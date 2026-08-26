/**
 * 造书工作台 · 后端流程插件（宿主侧）
 *
 * 六阶段状态机，采用「交办 → 验货 → 放行」引擎（主 AI 完全嵌入工作流）：
 *   Phase 1 材料准备（上传 PDF → MinerU 转换，机器干）
 *   Phase 2 源探查（主 AI 亲手做 → 用户确认探查结果）
 *   Phase 3 教学设计（主 AI 亲手起草 3 关方案 + 章节骨架，用户拍板）
 *   Phase 4 最佳范例章（主 AI 亲笔第 1 章 + 写作规范 + 四层审计 + 试教[条件触发]，用户确认）
 *   Phase 5 全章写作（主 AI 派小助手写 → 小助手审计 → 主 AI 终审 → 机器拼装成书）
 *   Phase 6 终检与交付（主 AI 自查报告 + 机器硬检查兜底 + 下载《书名》.md）
 *
 * 交办机制：
 *  - 机器到点把阶段任务"交办"给主对话 AI：meta.pendingStage 记账 + 通过
 *    ctx.agents.get(sessionId).followup() 自动唤醒主 AI（消息以"工作台提示"
 *    形式出现在对话里，不冒充用户）。
 *  - 主 AI 用 workbench_act（stage-brief 领任务说明 / progress 上报进度 /
 *    stage-submit 交工）与机器交互；机器逐项验货（文件存在、格式合法、
 *    内容完整），验过才放行下一阶段——"AI 说做了不算，机器验过才算"。
 *  - demo 模式（演示书）仍走旧的全自动子代理通道，与真实模式互不干扰。
 *
 * 设计约束：
 *  - 自定义事件不写会话日志（避免 dsh 重启后会话无法加载），全部走侧车账本
 *    $DSH_HOME/textbook/projects/<id>/（project.json + timeline.jsonl + snapshots/ + work/ + sources/）
 *  - 状态机每次从账本重推导（幂等），可跨重启续跑；重启后重新唤醒主 AI
 *  - 拍板/回退/快照机制不变；用户仍只做三件事：上传材料、拍板、抽查提意见
 */

import {
  mkdirSync, readFileSync, writeFileSync, appendFileSync, existsSync, readdirSync, statSync, renameSync, copyFileSync, rmSync,
  unlinkSync, rmdirSync,
} from 'node:fs'
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join, basename, dirname, resolve } from 'node:path'
import { convertPdfBatch, readSettings, writeSettings } from './mineru-lib.js'
import { generateContent, resourceText } from './content-lib.js'
import { isWithin } from './path-guard.js'
import {
  EVENT_TYPES,
  PHASES,
  goldChapterNo,
  guessRoleFromName,
  phaseLabel,
} from './domain-rules.js'

export const name = 'textbook-workflow'
export const inject = ['webServer', 'agents', 'subagents', 'sessions']

const PROJECT_ID_RE = /^[a-z0-9-]{1,64}$/
const SESSION_ID_RE = /^[A-Za-z0-9._-]{1,128}$/

/** 归一化会话 id（缺省/非法 → 'default'）。 */
function sessionOf(value) {
  if (typeof value === 'string' && SESSION_ID_RE.test(value)) return value
  return 'default'
}

/** 校验项目属于某个会话；不属于则抛错（严格隔离）。 */
function assertSessionOwned(projectId, sessionId) {
  const meta = readMeta(projectId)
  if (meta === null) throw new Error('项目不存在')
  if (meta.session !== sessionId) {
    throw new Error('该项目不属于当前会话')
  }
  return meta
}

/** 范例章章号（1 基；旧账本/缺省=1）——共享领域规则的本地别名（历史调用点沿用 goldN）。 */
const goldN = goldChapterNo
/** F39（2026-08-20 走查）：段落级抽查意见的人话说明（给 AI 交办修订 / 事件落账用）。
 *  整章意见（review 动作）带 comment；段落意见（gold-opinion 带 chapter）带 kind/wish/target。 */
function paragraphReviewText(r) {
  if (typeof r.comment === 'string' && r.comment !== '') return r.comment
  const where = r.target === null ? '笼统' : (r.target.hint || `第${r.target.para}段`)
  const kindText = r.kind === 'dislike' ? '不喜欢' : r.kind === 'drop' ? '不需要' : '要改成'
  return `段落意见（${where}）${kindText}${r.wish ? `：${r.wish}` : ''}`
}
/** 可豁免项（内部枚举 -> 大白话标签与风险提示；界面不裸露枚举）。 */
const WAIVER_ITEMS = {
  'gate-skip': { label: '跳过「请你拍板」的设计关卡', risk: '设计没经你确认就定稿，方向错了要返工' },
  'outline-skip': { label: '跳过「章节安排」确认', risk: '章节切分没经你确认，可能与预期不符' },
  'gold-skip': { label: '跳过「最佳范例章」确认', risk: '全书风格基准没经你认可' },
  'audit-skip': { label: '不要求每章都有独立审查', risk: '章节质量问题可能漏网' },
  'scaffold-keep': { label: '保留 AI 的笔记不删', risk: '成品里会留下工作痕迹' },
  'route-override': { label: '改变已定的使用路线', risk: '下游产物形态随之改变' },
  'progress-skip': { label: '跳过「进度账本」检查', risk: 'AI 的工作过程没有留账，中途换人/重做时缺参照' },
  'other': { label: '其他（自己写一句）', risk: '以你的说明为准' },
}

// 账本事件类型清单已收编至 ./domain-rules.js（单一事实来源，appendEvent 校验共用）。
// 六阶段标签派生自共享 PHASES（canonical 全称见 domain-rules.js，勿在此手写）。
const PHASE_LABELS = Object.fromEntries(PHASES.map((p) => [p.n, p.label]))
const GATE_LABELS = {
  '1': '学习目标与难点', '2': '教学方法与板块', '3': '全书架构与章节',
}

/** 交办阶段的人话标签（gate 单独带关卡号）。 */
const STAGE_LABELS = {
  explore: '源探查', outline: '章节骨架', gold: '范例章', chapters: '铺章', merge: '合并成书', final: '最后检查',
}
function stageLabel(stage, gate) {
  if (stage === 'gate') return `设计提案·第 ${gate ?? '?'} 关`
  return STAGE_LABELS[stage] ?? String(stage ?? '')
}

function dshHome() {
  const fromEnv = process.env.DSH_HOME
  if (fromEnv !== undefined && fromEnv.trim() !== '') return fromEnv
  return join(homedir(), '.dsh')
}

function projectsRoot() {
  const root = join(dshHome(), 'textbook', 'projects')
  mkdirSync(root, { recursive: true })
  return root
}

// ── 书夹位置注册表 ───────────────────────────────────────────────────────────
// 新书默认建在"会话的工作区目录"里、文件夹名用书名；注册表记录每个项目
// 当前的实际目录（旧书不动，仍记在默认目录；回收站里的书也记录新位置）。

function registryPath() { return join(dshHome(), 'textbook', 'registry.json') }

function readRegistry() {
  const path = registryPath()
  if (!existsSync(path)) return {}
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8'))
    return raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  } catch { return {} }
}

function writeRegistry(registry) {
  writeFileSync(registryPath(), JSON.stringify(registry, null, 2) + '\n')
}

function registerProject(projectId, dir) {
  const registry = readRegistry()
  registry[projectId] = { dir }
  writeRegistry(registry)
}

/** 已登记项目的实际目录（没有登记返回 null）。 */
function registeredDir(projectId) {
  const entry = readRegistry()[projectId]
  if (entry !== undefined && typeof entry.dir === 'string' && entry.dir !== '') return entry.dir
  return null
}

/** 会话的工作区目录（会话头里的 cwd；拿不到返回 null）。 */
function sessionWorkspace(ctx, sessionId) {
  try {
    const session = ctx.get('sessions')?.get?.(sessionId)
    const cwd = session?.header?.cwd
    if (typeof cwd === 'string' && cwd.trim() !== '' && existsSync(cwd) && statSync(cwd).isDirectory()) {
      return cwd
    }
  } catch { /* 走下一通道 */ }
  try {
    const registrySvc = ctx.get('workspaceRegistry')
    const list = typeof registrySvc?.list === 'function' ? registrySvc.list() : []
    for (const ws of list) {
      const members = ws?.sessionIds
      if (!Array.isArray(members)) continue
      const hit = members.find((m) => (m?.id ?? m) === sessionId)
      if (hit !== undefined && typeof hit?.cwd === 'string' && existsSync(hit.cwd) && statSync(hit.cwd).isDirectory()) {
        return hit.cwd
      }
    }
  } catch { /* 保持 null */ }
  return null
}

/** 把书名整理成合法的文件夹名。 */
function sanitizeFolderName(name) {
  let out = String(name ?? '')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '')
  if (out === '' || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(out)) out = 'book'
  if (out.length > 60) out = out.slice(0, 60).replace(/[. ]+$/g, '')
  return out
}

/** 在工作区里找一个没被占用的书夹名（重名自动加 -2、-3…）。 */
function freeBookDir(workspace, baseName) {
  let candidate = baseName
  let n = 2
  while (existsSync(join(workspace, candidate))) {
    candidate = `${baseName}-${n}`
    n += 1
  }
  return join(workspace, candidate)
}

function projectDir(projectId) {
  if (!PROJECT_ID_RE.test(projectId)) throw new Error(`invalid project id: ${JSON.stringify(projectId)}`)
  const registered = registeredDir(projectId)
  if (registered !== null) return registered
  return join(projectsRoot(), projectId)
}

function timelinePath(projectId) { return join(projectDir(projectId), 'timeline.jsonl') }
function metaPath(projectId) { return join(projectDir(projectId), 'project.json') }
function processLogPath(projectId) { return join(projectDir(projectId), '过程记录.md') }

/** 事件 → 人读的过程记录条目（返回 null 表示不值得记，如转换中间进度）。 */
function logEntryText(event) {
  const data = event.data ?? {}
  switch (event.type) {
    case 'textbook/phase-start': return `🏁 阶段开始：${data.label ?? data.phase}`
    case 'textbook/phase-end': return `✅ 阶段完成：${data.label ?? data.phase}`
    case 'textbook/agent-start': return `🤖 AI 开始：${data.label ?? ''}`
    case 'textbook/agent-end': return `🤖 AI 完成：${data.label ?? ''}`
    case 'textbook/gate-proposal':
      return `📋 请你拍板 · 第 ${data.gate} 关 · 方案 v${data.version}：${data.title ?? ''}\n\n${data.summary ?? ''}\n\n（完整方案见 提案/关卡${data.gate}-v${data.version}.md）`
    case 'textbook/gate-decision':
      return data.approved === true
        ? `✅ 第 ${data.gate} 关通过（v${data.version}）${data.note ? `\n\n用户备注：${data.note}` : ''}`
        : `❌ 第 ${data.gate} 关驳回（v${data.version}）${(data.reasons ?? []).length > 0 ? `\n\n驳回理由：${data.reasons.join('、')}` : ''}${data.note ? `\n\n用户意见：${data.note}` : ''}`
    case 'textbook/source-added': return `📎 已上传材料：${data.file ?? ''}（${data.role ?? ''}）`
    case 'textbook/mineru-progress': return null
    case 'textbook/rollback': return `⏪ 回退到快照 ${data.snapshot ?? ''}`
    case 'textbook/hint': return `💡 ${data.text ?? ''}`
    case 'textbook/error': return `⚠️ 出错（${data.task ?? ''}）\n\n${data.message ?? ''}`
    case 'textbook/quality': {
      const checks = data.checks ?? []
      const pass = checks.filter((check) => check.ok === true).length
      return `🛡️ 最后检查：${pass}/${checks.length} 项通过`
    }
    case 'textbook/delivery': return '🎉 交付完成'
    case 'textbook/stage-start': return `🎯 交给 AI 动手：${data.label ?? data.stage ?? ''}`
    case 'textbook/progress': return `⏳ ${data.label ?? ''}${data.detail ? `：${data.detail}` : ''}`
    case 'textbook/review': return `👀 抽查意见（第 ${data.chapter ?? '?'} 章《${data.title ?? ''}》）：${data.comment ?? ''}`
    case 'textbook/ai-report': return `🛡️ AI 自查报告：${data.report ?? ''}`
    case 'textbook/style-note': {
      const note = data.styleNote ?? {}
      return `🎨 风格线${data.revoked === true ? '收回' : '新增'}：${note.text ?? ''}${note.status === 'superseded' ? '（已收回）' : ''}`
    }
    case 'textbook/intervention': return `📮 留言稍后处理：${data.text ?? ''}`
    case 'textbook/intervention-done': return `📮 留言已处理：${data.text ?? ''}`
    case 'textbook/waiver': return `赦 ✅ 已获用户豁免「${WAIVER_ITEMS[data.item]?.label ?? data.item}」：${data.userNote ?? ''}`
    case 'textbook/waiver-revoke': return `赦 ↩️ 豁免已收回「${WAIVER_ITEMS[data.item]?.label ?? data.item}」，机器恢复拦截`
    case 'textbook/pause': return `⏸ 已暂停（${data.reason ?? '用户在造书工作台点击强制中断'}）`
    case 'textbook/resume': return `▶ 已继续`
    case 'textbook/outline-decision':
      return data.approved === true
        ? `✅ 章节安排已通过${data.note ? `\n\n用户备注：${data.note}` : ''}`
        : `↩️ 章节安排已驳回${data.note ? `\n\n用户意见：${data.note}` : ''}`
    case 'textbook/gold-opinion': {
      const o = data.opinion ?? {}
      const verbs = { dislike: '不喜欢', drop: '不需要', change: '要改成' }
      const wish = typeof o.wish === 'string' && o.wish !== '' ? `：${o.wish}` : ''
      return `✍️ 金标准意见#${o.seq}（${o.target ?? '笼统'}）${verbs[o.kind] ?? o.kind}${wish}`
    }
    case 'textbook/gold-seal': return `🏆 金标准已定稿为风格母版（v${data.version ?? '?'}），意见沉淀入风格线（${data.count ?? 0} 条）`
    default: return null
  }
}

function readMeta(projectId) {
  const path = metaPath(projectId)
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    throw new Error(`textbook: corrupt project meta ${projectId}: ${String(error)}`)
  }
}

function writeMeta(meta) {
  writeFileSync(metaPath(meta.id), JSON.stringify(meta, null, 2) + '\n')
}

/** 该豁免项当前是否有效（真实模式 + userNote 非空才算数）。 */
function waived(projectId, item) {
  const meta = readMeta(projectId)
  if (meta === null || meta.demo === true) return false
  return (meta.waivers ?? []).some((w) => w.item === item && typeof w.userNote === 'string' && w.userNote.trim() !== '')
}

/** 事件 → 主对话播报文本（null 表示不值得播报，只进项目时间线）。
 *  频率收紧：主 AI 现场讲话已覆盖的过程性事件（子代理起止/交办/进度/抽查/AI 报告）
 *  一律不播；用户新增的风格意见是自己刚点的，也不播（机器收回才值得告知）。 */
function announceText(event) {
  const data = event.data ?? {}
  switch (event.type) {
    case 'textbook/phase-start': return `🏁 阶段开始：${data.label ?? data.phase}`
    case 'textbook/phase-end': return `✅ 阶段完成：${data.label ?? data.phase}`
    case 'textbook/gate-proposal':
      return `📋 请你拍板 · 第 ${data.gate} 关 · 方案 v${data.version}：${data.title ?? ''}（工作台里可看完整方案）`
    case 'textbook/gate-decision':
      return data.approved === true
        ? `✅ 第 ${data.gate} 关通过（v${data.version}）`
        : `↩️ 第 ${data.gate} 关被驳回（v${data.version}），AI 正在修订`
    case 'textbook/rollback': return `⏪ 已回退到快照 ${data.snapshot ?? ''}`
    case 'textbook/error': return `⚠️ 出错（${data.task ?? ''}）：${String(data.message ?? '').slice(0, 200)}`
    case 'textbook/quality': {
      const checks = data.checks ?? []
      const pass = checks.filter((check) => check.ok === true).length
      return `🛡️ 最后检查：${pass}/${checks.length} 项通过`
    }
    case 'textbook/delivery': return '🎉 书做好了！工作台里可以预览和下载。'
    case 'textbook/hint': return typeof data.text === 'string' && data.text !== '' ? `💡 ${data.text}` : null
    // 交办/进度/子代理起止/抽查/AI 报告：主 AI 自己在对话里讲话（现场干活），机器不再重复播报。
    case 'textbook/stage-start':
    case 'textbook/progress':
    case 'textbook/review':
    case 'textbook/ai-report':
    case 'textbook/agent-start':
    case 'textbook/agent-end':
      return null
    case 'textbook/style-note':
      if (data.revoked !== true) return null
      return `🎨 风格线收回了一条意见（${String(data.styleNote?.text ?? '').slice(0, 40)}）`
    case 'textbook/intervention': return `📮 已留言：${String(data.text ?? '').slice(0, 60)}（不打断 AI 手里的活，下个停靠点处理）`
    case 'textbook/intervention-done': return null
    case 'textbook/waiver': return `✅ 已按你的特殊要求放行：${WAIVER_ITEMS[data.item]?.label ?? data.item}`
    case 'textbook/waiver-revoke': return null
    case 'textbook/pause': return `⏸ 已暂停（${data.reason ?? '用户在造书工作台点击强制中断'}）`
    case 'textbook/resume': return `▶ 已继续`
    case 'textbook/outline-decision':
      return data.approved === true
        ? `✅ 章节安排已确认`
        : `↩️ 章节安排已被驳回，AI 正在重新安排`
    case 'textbook/gold-opinion':
      // 用户自己提的意见，不用播报
      return null
    case 'textbook/gold-seal': return `🏆 金标准已定稿为风格母版（v${data.version ?? '?'}），意见沉淀入风格线（${data.count ?? 0} 条）`
    default: return null
  }
}

/** 把一条机器播报追加到主会话（对话流里能看到机器在干什么）。
 *  形态：plugin 来源的 user/message「notice 注入行」——客户端把它归类为上下文行
 *  （折叠一行摘要 + 可展开全文），节点身份用消息 id，与回合体系完全解耦。
 *  旧实现伪造完整 turn 信封（turn/start→turn/end，号码取日志最大值+1），与真实
 *  主 AI 自己的回合计数冲突：客户端把重复的 assistant-step:${turn}:${step} 当致命
 *  错误抛出，且异常发生在推送管道里——之后到达的一切事件都进不了聊天视图（对话
 *  冻结、刷新重放也复崩）。已废弃该形态；存量信封组由 fix-announce.mjs 清理。
 *  安全闸保留：AI 回合进行中绝不注入。notice 虽不占回合号，但落在「assistant 工具
 *  调用」与「tool 结果」之间仍会破坏下轮请求的消息相邻性（模型接口会以
 *  insufficient tool messages following tool_calls 拒绝）。回合中的播报直接放弃
 *  （工作台时间线里仍可见），等回合收口后的播报照常注入。 */
function announceToSession(ctx, sessionId, text) {
  try {
    const session = ctx.get('sessions')?.get?.(sessionId)
    if (session === undefined) return
    let lastTurnStart = -1
    let lastTurnEnd = -1
    const events = session.events ?? []
    for (let i = 0; i < events.length; i += 1) {
      const type = events[i]?.type
      if (type === 'turn/start') lastTurnStart = i
      else if (type === 'turn/end') lastTurnEnd = i
    }
    if (lastTurnStart > lastTurnEnd) return
    const firstLine = (text.split('\n', 1)[0] ?? text).trim()
    // user/message 的 data 就是消息本身（不是 assistant/message 的 {message:...} 包裹）。
    // 写错形状会让宿主模型请求构建时读 data.source.kind 崩（.kind undefined），已修。
    session.append('user/message', {
      id: `tb-note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      role: 'user',
      source: { kind: 'plugin', plugin: 'dsh-craft-your-textbook', form: 'notice', summary: `工作台：${firstLine.slice(0, 60)}` },
      content: [{ type: 'text', text }],
    }, { surfaceOp: 'append' })
  } catch (error) {
    ctx.logger.warn(`textbook: 主对话播报失败: ${String(error instanceof Error ? error.message : error)}`)
  }
}

/** 播报入口：低价值事件只进项目时间线；相邻事件合并成一条注入行
 *  （如「✅ 阶段完成：源探查 → 🏁 阶段开始：教学设计」）。
 *  暂存按 project 记（进程内即可；跨重启最多丢一次合并机会，无实质影响）。 */
const pendingPhaseEnd = new Map()
function announceEventToSession(ctx, projectId, meta, event) {
  const sessionId = meta.session
  if (typeof sessionId !== 'string' || sessionId === '') return
  if (event.type === 'textbook/phase-end') {
    pendingPhaseEnd.set(projectId, { text: announceText(event), time: event.time })
    return
  }
  const text = announceText(event)
  if (text === null) return
  const held = pendingPhaseEnd.get(projectId)
  pendingPhaseEnd.delete(projectId)
  if (held !== undefined && held.text !== null) {
    if (event.type === 'textbook/phase-start' && event.time - held.time < 60_000) {
      announceToSession(ctx, sessionId, `${held.text} → ${text}`)
      return
    }
    announceToSession(ctx, sessionId, held.text)
  }
  announceToSession(ctx, sessionId, text)
}

function appendEvent(projectId, type, data) {
  if (!EVENT_TYPES.has(type)) throw new Error(`textbook: unknown event type ${JSON.stringify(type)}`)
  const meta = readMeta(projectId)
  if (meta === null) throw new Error(`textbook: unknown project ${JSON.stringify(projectId)}`)
  const path = timelinePath(projectId)
  const seq = meta.eventCount ?? 0
  const event = { seq, time: Date.now(), type, data }
  appendFileSync(path, JSON.stringify(event) + '\n')
  meta.eventCount = seq + 1
  meta.updatedAt = event.time
  writeMeta(meta)
  // 人读的过程记录镜像（过程以文档形式留在文件夹里）。
  try {
    const entry = logEntryText(event)
    if (entry !== null) {
      const time = new Date(event.time).toLocaleString('zh-CN', { hour12: false })
      appendFileSync(processLogPath(projectId), `### ${time}\n${entry}\n\n`)
    }
  } catch { /* 过程记录失败不影响主流程 */ }
  // 主对话播报：让用户在对话流里看到机器在干什么（notice 注入行，不再伪造回合）。
  try {
    if (announceCtx !== null) announceEventToSession(announceCtx, projectId, meta, event)
  } catch { /* 播报失败不影响主流程 */ }
  return event
}

function readEvents(projectId, after) {
  const path = timelinePath(projectId)
  if (!existsSync(path)) return []
  const lines = readFileSync(path, 'utf8').split('\n').filter((line) => line.trim() !== '')
  const events = lines.map((line) => JSON.parse(line))
  return after === undefined ? events : events.filter((event) => event.seq > after)
}

/** 项目列表（按更新时间倒序；严格会话隔离：只列本会话的项目，一个会话至多一本）。 */
function listProjects(sessionId) {
  const projects = []
  const seen = new Set()
  // 1) 注册表里的项目（工作区书夹）
  for (const id of Object.keys(readRegistry())) {
    if (!PROJECT_ID_RE.test(id)) continue
    seen.add(id)
    const meta = readMeta(id)
    if (meta === null) continue
    if (meta.session !== sessionId) continue
    projects.push(meta)
  }
  // 2) 默认目录里未登记的遗留项目（旧书 / wizard 暂存目录跳过）
  for (const name of readdirSync(projectsRoot())) {
    if (seen.has(name) || !PROJECT_ID_RE.test(name) || name.startsWith('wizard-')) continue
    const meta = readMeta(name)
    if (meta === null) continue
    if (meta.session !== sessionId) continue
    projects.push(meta)
  }
  projects.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
  return projects
}

/**
 * 递归复制目录/文件（手动实现：mkdir + readdir + copyFileSync）。
 * 刻意不用 fs.cpSync：实测 cpSync 对某些真实书文件夹（含特定 PDF 的目录）会触发
 * Node 原生崩溃（0xC0000409 STATUS_STACK_BUFFER_OVERRUN，独立进程可复现，
 * 2026-08-20 实书走查 F27 发现）——逐文件复制实测安全。
 */
function copyTreeSync(src, target) {
  const st = statSync(src)
  if (st.isDirectory()) {
    mkdirSync(target, { recursive: true })
    for (const name of readdirSync(src)) {
      copyTreeSync(join(src, name), join(target, name))
    }
  } else {
    copyFileSync(src, target)
  }
}

/**
 * 删除目录/文件（尽力而为，绝不抛错拖垮删除主流程）。
 *
 * ⚠️ 2026-08-21 实测复现修复（取消书 → dsh 整体崩掉）：
 * `fs.rmSync(path, { recursive: true })` 在 Windows 上对**含中文的路径**会触发
 * Node **原生崩溃**（0xC0000409 STATUS_STACK_BUFFER_OVERRUN，直接崩掉整个宿主
 * 进程，JS try/catch 拦不住）。F27 走查只记录过它"静默失效"，没料到还会硬崩。
 * 因此**真实默认路径不再调用 fs.rmSync 递归删除**，改用手动逐文件删除
 * （readdirSync + unlinkSync/rmdirSync，实测安全）；删不干净时仍走
 * `cmd /c rmdir /s /q` 兜底，再失败则保留待下次清理。
 * `rm` 参数保留可注入（测试用：模拟 rmSync 静默失效的旧行为）。
 */
function removeTree(src, rm) {
  if (rm === rmSync) {
    // 真实 rmSync：跳过（中文路径会原生崩溃），直接手动逐文件删除。
    try { removeTreeManual(src) } catch { /* 已尽力；继续兜底 */ }
  } else {
    // 注入的 rm（测试模拟）：保留调用形态，删除结果由手动/兜底保证。
    try { rm(src, { recursive: true, force: true }) } catch { /* 已尽力 */ }
  }
  if (existsSync(src) && process.platform === 'win32') {
    try { execFileSync('cmd', ['/c', 'rmdir', '/s', '/q', src], { stdio: 'ignore' }) } catch { /* 保留待下次清理 */ }
  }
}

/** 手动递归删除（readdir + unlink/rmdir；刻意不用 fs.rmSync 递归，避开原生崩溃）。 */
function removeTreeManual(node) {
  const st = statSync(node)
  if (st.isDirectory()) {
    for (const name of readdirSync(node)) {
      try { removeTreeManual(join(node, name)) } catch { /* 单个条目失败不阻断 */ }
    }
    try { rmdirSync(node) } catch { /* 已尽力 */ }
  } else {
    try { unlinkSync(node) } catch { /* 已尽力 */ }
  }
}

/**
 * 移动文件/目录到目标：同盘走 rename（快）；跨盘（EXDEV，如书文件夹在 D:\ 而 $DSH_HOME 在 C:\）
 * 降级为复制到目标 + 删除原路径（行为等价，只是多一次 IO）。
 * rename/rm 可注入（测试用）；非 EXDEV 错误原样抛出，不吞。
 */
export function moveAcrossDevices(src, target, rename = renameSync, rm = rmSync) {
  try {
    rename(src, target)
    return true
  } catch (error) {
    if (error?.code !== 'EXDEV') throw error
    copyTreeSync(src, target)
    removeTree(src, rm)
    return true
  }
}

/** 把项目移入回收站目录（数据不删，只是移走；注册表条目由调用方决定去留）。 */
function trashProject(projectId) {
  const trash = join(dshHome(), 'textbook', 'trash')
  mkdirSync(trash, { recursive: true })
  const target = join(trash, `${projectId}-${Date.now().toString(36)}`)
  moveAcrossDevices(projectDir(projectId), target)
  return target
}

// ── 快照与回退 ──────────────────────────────────────────────────────────────

function snapshotsDir(projectId) {
  const dir = join(projectDir(projectId), 'snapshots')
  mkdirSync(dir, { recursive: true })
  return dir
}

/** 截断/回退时把用户的声音（风格线/豁免/未处理留言）合并回恢复后的 meta：现在优先，按 id 去重。 */
function mergeUserVoice(currentMeta, restoredMeta) {
  const mergeList = (restored, current, keyOf) => {
    const byId = new Map((restored ?? []).map((item) => [keyOf(item), item]))
    for (const item of current ?? []) byId.set(keyOf(item), item) // 现在优先
    return [...byId.values()]
  }
  restoredMeta.styleNotes = mergeList(restoredMeta.styleNotes, currentMeta?.styleNotes, (n) => n.id)
  restoredMeta.waivers = mergeList(restoredMeta.waivers, currentMeta?.waivers, (w) => w.id)
  const pendingNow = (currentMeta?.pendingInterventions ?? []).filter((i) => i.status === 'pending')
  restoredMeta.pendingInterventions = mergeList(restoredMeta.pendingInterventions, pendingNow, (i) => i.id)
  return restoredMeta
}

function writeSnapshot(projectId, reason) {
  const meta = readMeta(projectId)
  if (meta === null) throw new Error(`textbook: unknown project ${JSON.stringify(projectId)}`)
  const events = readEvents(projectId)
  const seq = (meta.snapshotSeq ?? 0) + 1
  meta.snapshotSeq = seq
  meta.updatedAt = Date.now()
  writeMeta(meta)
  const snapshot = { seq, eventCount: meta.eventCount ?? events.length, time: Date.now(), reason, meta, events }
  writeFileSync(join(snapshotsDir(projectId), `${seq}.json`), JSON.stringify(snapshot, null, 2) + '\n')
  return { seq, time: snapshot.time, reason }
}

function listSnapshots(projectId) {
  const dir = snapshotsDir(projectId)
  const list = []
  for (const name of readdirSync(dir)) {
    const match = /^(\d+)\.json$/.exec(name)
    if (match === null) continue
    try {
      const snapshot = JSON.parse(readFileSync(join(dir, name), 'utf8'))
      list.push({ seq: Number(match[1]), time: snapshot.time, reason: snapshot.reason })
    } catch { /* 损坏快照跳过 */ }
  }
  list.sort((a, b) => b.seq - a.seq)
  return list
}

function restoreSnapshot(projectId, snapshotSeq) {
  const file = join(snapshotsDir(projectId), `${snapshotSeq}.json`)
  if (!existsSync(file)) throw new Error(`textbook: snapshot ${snapshotSeq} 不存在`)
  const snapshot = JSON.parse(readFileSync(file, 'utf8'))
  const events = snapshot.events
  writeFileSync(timelinePath(projectId), events.map((event) => JSON.stringify(event)).join('\n') + (events.length > 0 ? '\n' : ''))
  const meta = { ...snapshot.meta }
  // 截断/回退保留用户声音：把截断前的风格线/豁免/未处理留言并回恢复后的 meta（现在优先）。
  mergeUserVoice(readMeta(projectId), meta)
  meta.eventCount = events.length
  meta.updatedAt = Date.now()
  writeMeta(meta)
  return appendEvent(projectId, 'textbook/rollback', { snapshot: snapshotSeq, reason: snapshot.reason })
}

// ── 关卡折叠 ────────────────────────────────────────────────────────────────

function foldGate(projectId) {
  const events = readEvents(projectId)
  let proposal = null
  let decision = null
  for (const event of events) {
    if (event.type === 'textbook/gate-proposal') {
      proposal = event
      decision = null
    } else if (event.type === 'textbook/gate-decision' && proposal !== null) {
      decision = event
    }
  }
  if (proposal === null) return null
  let prevProposal = null
  for (const event of events) {
    if (event.type === 'textbook/gate-proposal'
      && event.data?.gate === proposal.data?.gate
      && event.seq < proposal.seq) prevProposal = event
  }
  const status = decision === null ? 'awaiting' : (decision.data.approved === true ? 'approved' : 'rejected')
  return {
    gate: proposal.data.gate,
    version: proposal.data.version,
    title: proposal.data.title ?? '',
    summary: proposal.data.summary ?? '',
    detail: proposal.data.detail ?? '',
    status,
    proposalSeq: proposal.seq,
    decision: decision === null ? null : {
      seq: decision.seq,
      approved: decision.data.approved === true,
      mode: decision.data.mode ?? null,
      reasons: decision.data.reasons ?? [],
      note: decision.data.note ?? '',
    },
    prevProposal: prevProposal === null ? null : {
      seq: prevProposal.seq,
      version: prevProposal.data.version,
      title: prevProposal.data.title ?? '',
      summary: prevProposal.data.summary ?? '',
    },
  }
}

// ── 项目文件 ────────────────────────────────────────────────────────────────

function workDir(projectId) {
  const dir = join(projectDir(projectId), 'work')
  mkdirSync(dir, { recursive: true })
  return dir
}

function workFile(projectId, name) {
  const dir = workDir(projectId)
  const target = resolve(dir, name)
  if (!isWithin(dir, target)) {
    throw new Error(`非法文件路径: ${name}`)
  }
  return target
}

function writeWork(projectId, name, content) {
  const target = workFile(projectId, name)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, content, 'utf8')
}

function readWork(projectId, name) {
  return readFileSync(workFile(projectId, name), 'utf8')
}

// ── 本书自定义模式库（2026-08-21 需求）────────────────────────────────────────
// 用户在工作台粘贴一段教学/结构描述 → AI 分析成「模式卡」→ 写进书夹 模式库/自定义/。
// 第 2 关（模式选型）与金标准写作规范的 brief 会把它连同内置模式库一起交给 AI。
// 只按书生效，不碰 resources/references/patterns/ 共享内置库（demo 模式不动）。

/** 本书自定义模式卡目录（无则建）。 */
function customPatternsDir(projectId) {
  const dir = join(projectDir(projectId), '模式库', '自定义')
  mkdirSync(dir, { recursive: true })
  return dir
}

/** 列出本书已有自定义模式卡（不含索引文件）：[{name,file,title,problem}]。 */
function listCustomPatterns(projectId) {
  const dir = customPatternsDir(projectId)
  const out = []
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.md') || name.toLowerCase() === 'readme.md') continue
    let title = name.slice(0, -3)
    let problem = ''
    try {
      const text = readFileSync(join(dir, name), 'utf8')
      const lines = text.split('\n')
      const head = lines.find((l) => /^#\s+/.test(l))
      if (head !== undefined) title = head.replace(/^#\s*/, '').trim()
      const pi = lines.findIndex((l) => l.includes('解决的教学问题'))
      if (pi >= 0 && lines[pi + 1] !== undefined) problem = lines[pi + 1].trim()
    } catch { /* 读不到就用文件名 */ }
    out.push({ name: title, file: name, title, problem })
  }
  return out
}

/** 自定义模式卡交办素材：把本书自定义模式卡全文内联进 brief（有才返回非空字符串）。 */
export function customPatternsBrief(projectId) {
  const patterns = listCustomPatterns(projectId)
  if (patterns.length === 0) return ''
  const lines = ['', '用户自定义模式（与内置模式库同等地位，必须逐张读完，并在「模式选型」里回答每张对应本书哪个教学问题）：']
  for (const p of patterns) {
    const body = (() => { try { return readFileSync(join(customPatternsDir(projectId), p.file), 'utf8').trim() } catch { return '' } })()
    lines.push(`\n--- 自定义模式卡：${p.title} ---\n${body}`)
  }
  return lines.join('\n')
}

/** 把账上的风格线镜像成 AI 必读的 work/style-line.md（写章/审计/交工前读）。 */
function updateStyleLineMirror(projectId) {
  const meta = readMeta(projectId)
  const notes = (meta.styleNotes ?? []).filter((n) => n.status === 'active' || n.status === 'adopted')
  const lines = ['# 风格线（用户对写法的要求，写每一章前必读、逐条落实）', '']
  for (const n of notes) {
    lines.push(`- [${n.status === 'adopted' ? '已落实过' : '生效中'}] ${n.text}${n.note ? `（备注：${n.note}）` : ''}`)
  }
  if (notes.length === 0) lines.push('（还没有风格意见；用户随时可能补充，交章前用 workbench_status 查增量。）')
  writeWork(projectId, 'style-line.md', lines.join('\n') + '\n')
}

function sourcesDir(projectId) {
  const dir = join(projectDir(projectId), 'sources')
  mkdirSync(dir, { recursive: true })
  return dir
}

function sourcesMdDir(projectId) {
  const dir = join(projectDir(projectId), 'sources-md')
  mkdirSync(dir, { recursive: true })
  return dir
}

// ── 状态机运行器 ────────────────────────────────────────────────────────────

const runners = new Map() // projectId -> Promise
const gateWaiters = new Map() // projectId -> { gate, version, resolve }
const parents = new Map() // projectId -> { handle }

/**
 * 自动唤醒主对话 AI，把当前 pendingStage 的任务交给它（真实模式专用）。
 * 消息以「工作台提示」形式出现在对话流（source: plugin + notice），
 * 不冒充用户说话；AI 被唤醒后按人设流程：status → stage-brief → 干活 → 交工。
 */
function wakeMainAI(ctx, projectId) {
  const meta = readMeta(projectId)
  if (meta === null || meta.demo === true) return false
  const sessionId = meta.session
  if (typeof sessionId !== 'string' || sessionId === '') return false
  const agent = ctx.get('agents')?.get?.(sessionId)
  if (agent === undefined) return false
  const label = stageLabel(meta.pendingStage, meta.pendingGate ?? null)
  const text = [
    `【工作台派任务 · ${label}】`,
    `这本书的「${label}」轮到你亲手做了。`,
    '1. 先调用 workbench_status 看真实状态（项目、阶段、待办、抽查意见）。',
    '2. 再调用 workbench_act（action=stage-brief）领取这一步的任务说明、写作方法与产物要求。',
    '3. 按说明亲手完成；过程中用 workbench_act（action=progress）随时上报进度。',
    '4. 完成后调用 workbench_act（action=stage-submit）交工；机器验货合格才会继续下一步。',
    '铁律：先用大白话告诉用户你要做什么，再动手；需要用户拍板的事绝不自作主张。',
  ].join('\n')
  const message = {
    id: `tb-task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    role: 'user',
    content: [{ type: 'text', text }],
    source: { kind: 'plugin', plugin: 'dsh-craft-your-textbook', form: 'notice', summary: `工作台：轮到 AI 动手（${label}）` },
  }
  try {
    agent.followup(message)
    return true
  } catch (error) {
    // 极少数宿主版本对 plugin+notice 来源校验严格：回退成普通 user 来源再试一次。
    ctx.logger.warn(`textbook: 唤醒主 AI（工作台提示来源）失败，回退 user 来源: ${String(error instanceof Error ? error.message : error)}`)
    try {
      agent.followup({ ...message, source: { kind: 'user' } })
      return true
    } catch (error2) {
      ctx.logger.warn(`textbook: 唤醒主 AI 彻底失败: ${String(error2 instanceof Error ? error2.message : error2)}`)
      return false
    }
  }
}

/**
 * 交办：记账 pendingStage → 记事件 → 快照 → 唤醒主 AI。
 * 幂等由调用方保证（runPhase 先查 pendingStage 是否已设）。
 */
function handoff(ctx, projectId, stage, gate = null) {
  const meta = readMeta(projectId)
  if (meta === null) throw new Error(`textbook: unknown project ${JSON.stringify(projectId)}`)
  meta.pendingStage = stage
  meta.pendingGate = gate
  meta.wakeToken = (meta.wakeToken ?? 0) + 1
  meta.status = 'running'
  meta.updatedAt = Date.now()
  writeMeta(meta)
  const label = stageLabel(stage, gate)
  appendEvent(projectId, 'textbook/stage-start', { stage, gate, label })
  try {
    writeSnapshot(projectId, `交办「${label}」之前`)
  } catch { /* 快照失败不影响交办 */ }
  return wakeMainAI(ctx, projectId)
}

/** 某章的两份产物路径。 */
function chapterArtifacts(projectId, n) {
  const file = `chapter-${String(n).padStart(2, '0')}.md`
  const audit = `audit-${String(n).padStart(2, '0')}.md`
  return { file, audit, chapterPath: workFile(projectId, file), auditPath: workFile(projectId, audit) }
}

/** 第 n 章是否"写好 + 自查过"（机器验货标准）。 */
function chapterDone(projectId, n) {
  const { chapterPath, auditPath } = chapterArtifacts(projectId, n)
  return existsSync(chapterPath) && existsSync(auditPath)
}

/** 章节流水线阶段（F35）：从 meta.chapterPipeline 读，旧账本/未上报返回 null。 */
function pipelineStage(meta, index) {
  const pipeline = Array.isArray(meta?.chapterPipeline) ? meta.chapterPipeline : []
  const entry = pipeline[index]
  return entry !== null && typeof entry === 'object' ? (entry.stage ?? null) : null
}

/** 播报上下文：appendEvent 播报主对话用的唯一跨切面依赖。
 *  显式契约：仅 apply 调 bindAnnounce 绑定一次；未绑定时不播报（只进项目时间线）。 */
let announceCtx = null

function bindAnnounce(ctx) {
  announceCtx = ctx
}

async function disposeParent(projectId) {
  const entry = parents.get(projectId)
  if (entry === undefined) return
  parents.delete(projectId)
  try { await entry.handle.dispose() } catch { /* 尽力而为 */ }
}

/** 惰性创建父代理（真实模式派生子代理用）。 */
async function getParent(ctx, projectId, meta) {
  const cached = parents.get(projectId)
  if (cached !== undefined) return cached.handle.agent
  let provider = 'deepseek-official'
  let model = 'deepseek-v4-flash'
  try {
    const defaultModel = ctx.get('agentDefaultModel')
    if (defaultModel !== undefined) {
      const resolved = typeof defaultModel.currentSelection === 'function'
        ? defaultModel.currentSelection()
        : defaultModel
      if (resolved?.provider !== undefined) provider = resolved.provider
      if (resolved?.model !== undefined) model = resolved.model
    }
  } catch { /* 保持默认 */ }
  const handle = await ctx.agents.create({
    sessionId: `textbook-${projectId}`,
    meta: { cwd: projectDir(projectId), origin: 'subagent' },
    agentOptions: { provider, model },
  })
  parents.set(projectId, { handle })
  return handle.agent
}

function projectRuntime(ctx, projectId, meta) {
  return {
    ctx,
    demo: meta.demo === true,
    dir: projectDir(projectId),
    project: meta,
    getParent: () => getParent(ctx, projectId, meta),
  }
}

/** 关卡方案落盘为可读文档（提案/关卡N-vX.md）。 */
function writeProposalDoc(projectId, gate, version, title, summary, detail) {
  try {
    const dir = join(projectDir(projectId), '提案')
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      join(dir, `关卡${gate}-v${version}.md`),
      `# 第 ${gate} 关方案 v${version}：${title}\n\n## 摘要\n\n${summary}\n\n## 完整方案\n\n${detail}\n`,
    )
  } catch { /* 文档失败不影响主流程 */ }
}

/** 提交关卡提案（状态机内部与 action 共用）。 */
function proposeGate(projectId, gate, title, summary, detail) {
  writeProposalDoc(projectId, gate, 1, title, summary, detail)
  const snapshot = writeSnapshot(projectId, `关卡 ${gate} 提案之前`)
  const event = appendEvent(projectId, 'textbook/gate-proposal', {
    gate, version: 1, title, summary, detail,
  })
  void snapshot
  return event
}

function proposeRevision(projectId, gate, version, title, summary, detail) {
  writeProposalDoc(projectId, gate, version, title, summary, detail)
  writeSnapshot(projectId, `关卡 ${gate} 修订 v${version} 之前`)
  return appendEvent(projectId, 'textbook/gate-proposal', {
    gate, version, title, summary, detail,
  })
}

function advance(projectId, fromPhase, toPhase) {
  const meta = readMeta(projectId)
  if (fromPhase !== undefined) {
    appendEvent(projectId, 'textbook/phase-end', { phase: fromPhase, label: PHASE_LABELS[fromPhase] })
  }
  meta.phase = toPhase
  meta.status = 'running'
  writeMeta(meta)
  appendEvent(projectId, 'textbook/phase-start', { phase: toPhase, label: PHASE_LABELS[toPhase] })
}

function waitForGateDecision(projectId, gate, version) {
  return new Promise((resolve) => {
    gateWaiters.set(projectId, { gate, version, resolve })
  })
}

async function runPhase1(ctx, projectId, meta) {
  // Phase 1：等待材料 → 逐本转换（MinerU）→ 全部完成推进 Phase 2
  const sources = meta.sources ?? []
  if (sources.length === 0) {
    appendEvent(projectId, 'textbook/hint', { text: '请先上传教材 PDF（工作台向导）' })
    return 'waiting'
  }
  // 上次转换可能中途中断（宿主重启）留下卡死的 converting 标记：清掉，从头继续。
  if (meta.converting === true) {
    meta.converting = false
    writeMeta(meta)
  }
  // 逐本转换，全部转完才进下一阶段（此前只转一本就停，是 bug）。
  for (;;) {
    const pending = sources.filter((source) => source.converted !== true)
    if (pending.length === 0) {
      advance(projectId, 1, 2)
      return 'advanced'
    }
    const source = pending[0]
    const sourcePath = join(sourcesDir(projectId), source.file)
    if (!existsSync(sourcePath)) {
      appendEvent(projectId, 'textbook/error', { task: '材料', message: `源文件缺失: ${source.file}` })
      meta.status = 'error'
      writeMeta(meta)
      return 'error'
    }
    meta.converting = true
    writeMeta(meta)
    // 批量转换全部待转 PDF（一次提交并行解析；每本结果按 file_name 落到独立子目录）。
    appendEvent(projectId, 'textbook/agent-start', { label: `批量转换 ${pending.length} 本 PDF` })
    try {
      const items = pending.map((item) => {
        const index = sources.indexOf(item)
        const sub = `${String(index + 1).padStart(2, '0')}-${sanitizeFolderName(item.file.replace(/\.pdf$/i, '')).slice(0, 24)}`
        return {
          file: join(sourcesDir(projectId), item.file),
          name: item.file,
          outDir: join(sourcesMdDir(projectId), sub),
          sub,
        }
      })
      const results = await convertPdfBatch(items, { formula: meta.science === true }, (stage) => {
        appendEvent(projectId, 'textbook/mineru-progress', { file: `${pending.length} 本`, stage })
      })
      const failed = results.filter((result) => result.ok !== true)
      for (const result of results) {
        if (result.ok !== true) continue
        const target = sources.find((s) => s.file === result.name)
        const item = items.find((it) => it.name === result.name)
        if (target === undefined || item === undefined) continue
        target.converted = true
        target.md = join(item.sub, 'full.md')
      }
      meta.converting = false
      writeMeta(meta)
      if (failed.length === 0) {
        appendEvent(projectId, 'textbook/agent-end', { label: `批量转换 ${pending.length} 本 PDF`, outcome: 'ok' })
      } else {
        const humanMessage = `${failed.length} 本转换失败：${failed.map((f) => `${f.name}（${f.error ?? '未知错误'}）`).join('；')}`
        // F26（2026-08-20）：记录人话错误文案（mineru-lib 已把页数超限/Token 失效归一成人话），前端 error 卡直接展示。
        meta.lastErrorHuman = humanMessage
        appendEvent(projectId, 'textbook/error', {
          task: '转换',
          message: humanMessage,
        })
        meta.status = 'error'
        writeMeta(meta)
        return 'error'
      }
    } catch (error) {
      meta.converting = false
      meta.status = 'error'
      // F26（2026-08-20）：同上，把人话错误落 meta.lastErrorHuman（旧账本读取时 ?? null 兜底）。
      meta.lastErrorHuman = String(error instanceof Error ? error.message : error)
      writeMeta(meta)
      appendEvent(projectId, 'textbook/error', {
        task: '转换',
        message: String(error instanceof Error ? error.message : error),
      })
      return 'error'
    }
  }
}

/** 真实模式：源探查交办给主 AI；产物合格并获用户确认后进教学设计。 */
async function runPhase2(ctx, projectId, meta) {
  if (meta.demo) return runPhase2Auto(ctx, projectId, meta)
  if (existsSync(workFile(projectId, 'explore.md'))) {
    if (meta.exploreConfirmed === true) {
      advance(projectId, 2, 3)
      return 'advanced'
    }
    if (meta.status !== 'awaiting-explore') {
      meta.status = 'awaiting-explore'
      writeMeta(meta)
      appendEvent(projectId, 'textbook/hint', {
        text: '🔍 源探查做完了，请在工作台查看：满意点「✅ 满意，继续设计」，不满意点「🔁 让 AI 重做」。',
      })
    }
    return 'waiting'
  }
  if (meta.pendingStage === 'explore') return 'waiting'
  handoff(ctx, projectId, 'explore')
  return 'waiting'
}

/** 演示模式（旧通道）：机器自动派子代理跑源探查。 */
async function runPhase2Auto(ctx, projectId, meta) {
  if (existsSync(workFile(projectId, 'explore.md'))) {
    advance(projectId, 2, 3)
    return 'advanced'
  }
  const runtime = projectRuntime(ctx, projectId, meta)
  appendEvent(projectId, 'textbook/agent-start', { label: '源探查' })
  try {
    const result = await generateContent(runtime, 'explore')
    // v2：源探查产出人读索引 + 结构化知识地图（后续设计/写作直接复用）。
    writeWork(projectId, 'explore.md', result.index ?? result.text ?? '')
    if (result.knowledgeMap !== undefined) {
      writeWork(projectId, 'knowledge-map.json', JSON.stringify(result.knowledgeMap, null, 2))
    }
    appendEvent(projectId, 'textbook/agent-end', { label: '源探查', outcome: 'ok' })
    advance(projectId, 2, 3)
    return 'advanced'
  } catch (error) {
    return recordAgentError(projectId, '源探查', error)
  }
}

/** 统计某关卡被驳回的次数（从时间线折叠）。 */
function countRejections(projectId, gate) {
  let count = 0
  for (const event of readEvents(projectId)) {
    if (event.type === 'textbook/gate-decision' && event.data?.gate === gate && event.data.approved === false) {
      count += 1
    }
  }
  return count
}

/** 统计某关卡已提案的次数（用于算下一版版本号）。 */
function countProposals(projectId, gate) {
  let count = 0
  for (const event of readEvents(projectId)) {
    if (event.type === 'textbook/gate-proposal' && event.data?.gate === gate) count += 1
  }
  return count
}

/** 该关卡是否已经通过（对该关卡最新提案的决策为通过）。 */
function gateApproved(projectId, gate) {
  let proposal = null
  let decision = null
  for (const event of readEvents(projectId)) {
    if (event.type === 'textbook/gate-proposal' && event.data?.gate === gate) {
      proposal = event
      decision = null
    } else if (event.type === 'textbook/gate-decision' && event.data?.gate === gate && proposal !== null) {
      decision = event
    }
  }
  return decision !== null && decision.data?.approved === true
}

/** 关卡循环：提案 → 等拍板；通过返回，驳回自动生成修订版再等（不限轮次，每 3 轮提示调整目标）。 */
async function runGate(ctx, projectId, meta, gate) {
  for (;;) {
    // 已通过的关卡直接跳过（宿主重启后从 gate 1 重来也不重复生成）。
    if (gateApproved(projectId, gate)) return 'approved'
    const current = foldGate(projectId)
    if (current !== null && current.gate === gate && current.status === 'approved') return 'approved'
    if (current !== null && current.gate === gate && current.status === 'awaiting') {
      await waitForGateDecision(projectId, gate, current.version)
      continue
    }
    // 需要生成提案（首次）或修订版（被驳回后）。
    const prevDecision = current !== null && current.gate === gate ? current.decision : null
    const prevVersion = current !== null && current.gate === gate ? current.version : 0
    const version = prevVersion + 1
    const rejectCount = countRejections(projectId, gate)
    if (rejectCount > 0 && rejectCount % 3 === 0) {
      appendEvent(projectId, 'textbook/hint', {
        text: `这一关已经来回 ${rejectCount} 次了。如果一直不满意，可以在对话里调整目标或换一种思路，也可以回退到更早的拍板点重新来。`,
      })
    }
    const runtime = projectRuntime(ctx, projectId, meta)
    const label = version === 1 ? `设计提案·关卡${gate}` : `设计提案·关卡${gate}·修订v${version}`
    appendEvent(projectId, 'textbook/agent-start', { label })
    try {
      const proposal = await generateContent(runtime, 'gate', {
        gate, version, prevSummary: current?.summary ?? null, decision: prevDecision,
      })
      // 安全网：设计方案缺字段就中止，绝不生成空提案占住面板。
      if (typeof proposal?.title !== 'string' || proposal.title.trim() === ''
        || typeof proposal?.summary !== 'string' || proposal.summary.trim() === ''
        || typeof proposal?.detail !== 'string' || proposal.detail.trim() === '') {
        throw new Error('设计方案不完整（缺少标题/摘要/正文），已中止生成，请重试')
      }
      appendEvent(projectId, 'textbook/agent-end', { label, outcome: 'ok' })
      if (version === 1) {
        proposeGate(projectId, gate, proposal.title, proposal.summary, proposal.detail)
      } else {
        proposeRevision(projectId, gate, version, proposal.title, proposal.summary, proposal.detail)
      }
      await waitForGateDecision(projectId, gate, version)
    } catch (error) {
      return recordAgentError(projectId, label, error)
    }
  }
}

/** 真实模式：三关设计提案与章节骨架全部交办给主 AI（已通过的关自动跳过）。 */
async function runPhase3(ctx, projectId, meta) {
  if (meta.demo) return runPhase3Auto(ctx, projectId, meta)
  for (const gate of ['1', '2', '3']) {
    if (gateApproved(projectId, gate) || waived(projectId, 'gate-skip')) continue
    if (meta.pendingStage === 'gate' && meta.pendingGate === gate) return 'waiting'
    handoff(ctx, projectId, 'gate', gate)
    return 'waiting'
  }
  // 章节安排在等用户人审（outline-confirm）：停在确认点，不自动推进。
  if (meta.status === 'awaiting-outline') return 'waiting'
  if (meta.outline === undefined) {
    if (meta.pendingStage === 'outline') return 'waiting'
    handoff(ctx, projectId, 'outline')
    return 'waiting'
  }
  advance(projectId, 3, 4)
  return 'advanced'
}

/** 演示模式（旧通道）：机器自动跑三关 + 章节骨架。 */
async function runPhase3Auto(ctx, projectId, meta) {
  for (const gate of ['1', '2', '3']) {
    const result = await runGate(ctx, projectId, meta, gate)
    if (result !== 'approved') return result
  }
  // 三个关卡全部通过 → 生成章节骨架 → Phase 4
  if (meta.outline === undefined) {
    const runtime = projectRuntime(ctx, projectId, meta)
    appendEvent(projectId, 'textbook/agent-start', { label: '整理章节骨架' })
    try {
      const outline = await generateContent(runtime, 'outline', {})
      meta.outline = outline
      writeMeta(meta)
      writeWork(projectId, 'outline.md', JSON.stringify(outline, null, 2))
      appendEvent(projectId, 'textbook/agent-end', { label: '整理章节骨架', outcome: 'ok' })
    } catch (error) {
      return recordAgentError(projectId, '整理章节骨架', error)
    }
  }
  advance(projectId, 3, 4)
  return 'advanced'
}

/** 真实模式：最佳范例章交办给主 AI（金标准，全书基准）。 */
async function runPhase4(ctx, projectId, meta) {
  if (meta.demo) return runPhase4Auto(ctx, projectId, meta)
  const gn = goldN(meta)
  if (existsSync(workFile(projectId, `chapter-${String(gn).padStart(2, '0')}.md`))) {
    // 已写好：必须用户确认后才进全章写作（awaiting-gold）。
    if (meta.status !== 'awaiting-gold') {
      meta.status = 'awaiting-gold'
      writeMeta(meta)
      appendEvent(projectId, 'textbook/hint', {
        text: '📖 最佳范例章写好了，请在工作台查看：满意点「✅ 满意，继续写全书」，不满意点「❌ 重写」。',
      })
    }
    return 'waiting'
  }
  if (meta.pendingStage === 'gold') return 'waiting'
  handoff(ctx, projectId, 'gold')
  return 'waiting'
}

/** 演示模式（旧通道）：机器自动跑范例章。 */
async function runPhase4Auto(ctx, projectId, meta) {
  const gn = goldN(meta)
  const chapter01 = workFile(projectId, `chapter-${String(gn).padStart(2, '0')}.md`)
  if (existsSync(chapter01)) {
    // 已写好：必须用户确认后才进全章写作（awaiting-gold）。
    if (meta.status !== 'awaiting-gold') {
      meta.status = 'awaiting-gold'
      writeMeta(meta)
      appendEvent(projectId, 'textbook/hint', { text: '📖 最佳范例章写好了，请在工作台查看：满意点「✅ 满意，继续写全书」，不满意点「❌ 重写」。' })
    }
    return 'waiting'
  }
  const runtime = projectRuntime(ctx, projectId, meta)
  const outline = meta.outline ?? { chapters: [{ title: '示例章节', outline: '' }] }
  appendEvent(projectId, 'textbook/agent-start', { label: '最佳范例章（先写一章给你看）' })
  try {
    const result = await generateContent(runtime, 'gold', {
      outline, targetWords: meta.targetWords, chapterSource: outline.chapters?.[goldN(meta) - 1]?.source ?? '',
      redoNote: meta.goldRedoNote ?? '',
    })
    writeWork(projectId, 'style-spec.md', result.styleSpec)
    writeWork(projectId, `chapter-${String(gn).padStart(2, '0')}.md`, result.chapter)
    writeWork(projectId, `audit-${String(gn).padStart(2, '0')}.md`, JSON.stringify(result.audit, null, 2))
    if (result.audit?.passed === false) {
      appendEvent(projectId, 'textbook/hint', { text: '最佳范例章自查发现待完善项，已随章记录，可在交付前查看。' })
    }
    appendEvent(projectId, 'textbook/agent-end', { label: '最佳范例章', outcome: 'ok' })
    // 对齐真实模式 stage-submit gold：新稿落地即意见转 applied、本轮重做意见用毕即清。
    if (Array.isArray(meta.goldOpinions)) {
      for (const o of meta.goldOpinions) if (o.status === 'sent') o.status = 'applied'
    }
    delete meta.goldRedoNote
    meta.status = 'awaiting-gold'
    writeMeta(meta)
    appendEvent(projectId, 'textbook/hint', { text: '📖 最佳范例章写好了，请在工作台查看：满意点「✅ 满意，继续写全书」，不满意点「❌ 重写」。' })
    return 'waiting'
  } catch (error) {
    return recordAgentError(projectId, '最佳范例章', error)
  }
}

/** 真实模式：铺章交办给主 AI（小助手执笔 → 小助手审计 → 主 AI 终审），全部完成后交办合并。 */
async function runPhase5(ctx, projectId, meta) {
  if (meta.demo) return runPhase5Auto(ctx, projectId, meta)
  const chapters = meta.outline?.chapters ?? []
  const allDone = chapters.length > 0 && chapters.every((chapter, index) => chapterDone(projectId, index + 1))
  if (allDone) {
    if (!existsSync(workFile(projectId, 'book.md'))) {
      // 全章过目闸门（真实模式）：所有章写完先请人过目，不自动合并（F18）。
      if (meta.status !== 'awaiting-chapters-review' && meta.chaptersReviewed !== true && meta.demo !== true) {
        meta.status = 'awaiting-chapters-review'
        writeMeta(meta)
        appendEvent(projectId, 'textbook/hint', {
          text: '📚 全部章节都写好了！请在工作台逐章过目：想细看就点「看看这章」，有意见直接写（AI 会照改）；都满意了点「✅ 都过了，交工」开始合并。',
        })
        return 'waiting'
      }
      if (meta.pendingStage === 'merge') return 'waiting'
      handoff(ctx, projectId, 'merge')
      return 'waiting'
    }
    advance(projectId, 5, 6)
    return 'advanced'
  }
  if (meta.pendingStage === 'chapters') return 'waiting'
  handoff(ctx, projectId, 'chapters')
  return 'waiting'
}

/** 演示模式（旧通道）：机器自动逐章写 + 审计 + 合并。 */
async function runPhase5Auto(ctx, projectId, meta) {
  const chapters = meta.outline?.chapters ?? [{ title: '第1章', outline: '' }]
  const styleSpec = existsSync(workFile(projectId, 'style-spec.md')) ? readWork(projectId, 'style-spec.md') : ''
  const audits = []
  for (let index = 0; index < chapters.length; index += 1) {
    const n = index + 1
    const file = `chapter-${String(n).padStart(2, '0')}.md`
    const chapterPath = workFile(projectId, file)
    if (existsSync(chapterPath)) {
      const auditPath = workFile(projectId, `audit-${String(n).padStart(2, '0')}.md`)
      if (existsSync(auditPath)) {
        try { audits.push(JSON.parse(readFileSync(auditPath, 'utf8'))) } catch { audits.push({ passed: true }) }
      }
      continue
    }
    const runtime = projectRuntime(ctx, projectId, meta)
    const title = chapters[index].title ?? `第${n}章`
    appendEvent(projectId, 'textbook/agent-start', { label: `写第${n}章《${title}》` })
    try {
      const written = await generateContent(runtime, 'chapter', {
        n, title, outline: chapters[index].outline ?? '', styleSpec,
        targetWords: chapters[index].targetWords ?? meta.targetWords,
        chapterSource: chapters[index].source ?? '',
      })
      // demo 通道的 chapter 产物是字符串（demoChapterWrite 直接返回正文），不是 {text} 对象。
      writeWork(projectId, file, written)
      appendEvent(projectId, 'textbook/agent-end', { label: `写第${n}章`, outcome: 'ok' })
    } catch (error) {
      return recordAgentError(projectId, `写第${n}章`, error)
    }
    appendEvent(projectId, 'textbook/agent-start', { label: `自查第${n}章` })
    try {
      const audit = await generateContent(runtime, 'audit', {
        n, title, chapterPath,
      })
      writeWork(projectId, `audit-${String(n).padStart(2, '0')}.md`, JSON.stringify(audit, null, 2))
      audits.push(audit)
      appendEvent(projectId, 'textbook/agent-end', { label: `自查第${n}章`, outcome: audit.passed === true ? 'ok' : 'issues' })
    } catch (error) {
      // 审计失败也落盘一条"警告"记录，保证每章都有审计记录（质量门可核）。
      const fallback = { passed: true, issues: [{ level: '警告', text: `自查未能完成：${String(error instanceof Error ? error.message : error)}` }] }
      writeWork(projectId, `audit-${String(n).padStart(2, '0')}.md`, JSON.stringify(fallback, null, 2))
      audits.push(fallback)
      appendEvent(projectId, 'textbook/error', { task: `自查第${n}章`, message: String(error instanceof Error ? error.message : error) })
    }
  }
  if (!existsSync(workFile(projectId, 'book.md'))) {
    const runtime = projectRuntime(ctx, projectId, meta)
    appendEvent(projectId, 'textbook/agent-start', { label: '合并成书' })
    try {
      const merged = await generateContent(runtime, 'merge', {
        chapters: (meta.outline?.chapters ?? [{ title: '第1章' }]).map((chapter, index) => {
          const file = `chapter-${String(index + 1).padStart(2, '0')}.md`
          return {
            n: index + 1,
            title: chapter.title ?? `第${index + 1}章`,
            path: workFile(projectId, file),
            text: existsSync(workFile(projectId, file)) ? readWork(projectId, file) : '',
          }
        }),
        title: meta.name,
      })
      // demo 通道的 merge 产物是字符串（demoMergeBook 直接返回正文），不是 {text} 对象。
      writeWork(projectId, 'book.md', merged)
      appendEvent(projectId, 'textbook/agent-end', { label: '合并成书', outcome: 'ok' })
    } catch (error) {
      return recordAgentError(projectId, '合并成书', error)
    }
  }
  advance(projectId, 5, 6)
  return 'advanced'
}

/** 脚手架残留标记扫描（Iron Law 3 的机器验证：交付前必须拆干净）。 */
const SCAFFOLD_MARKERS = /\b(META|TODO|FIXME|HACK)\b|审计批注|未决问题|loader 指令/g

function scanScaffolding(text) {
  const found = []
  for (const match of text.matchAll(SCAFFOLD_MARKERS)) {
    const lineNo = text.slice(0, match.index).split('\n').length
    const line = text.slice(0, match.index).split('\n').pop()?.trim().slice(0, 60) ?? ''
    found.push(`${match[0]}（第 ${lineNo} 行：${line}）`)
  }
  return found
}

/** 剥掉 human 路线的 loader 指令区（装配说明，留给 AI 老师，不是成品脚手架残留）。 */
function stripLoaderRegion(text) {
  return String(text).replace(/<!-- loader:begin -->[\s\S]*?<!-- loader:end -->/g, '')
}

/** 真实模式：最后检查交办给主 AI（自查报告），机器硬检查兜底后交付。 */
async function runPhase6(ctx, projectId, meta) {
  if (meta.demo) return runPhase6Auto(ctx, projectId, meta)
  const bookPath = workFile(projectId, 'book.md')
  if (!existsSync(bookPath)) {
    appendEvent(projectId, 'textbook/error', { task: '交付', message: 'book.md 不存在，请回退重跑' })
    meta.status = 'error'
    writeMeta(meta)
    return 'error'
  }
  if (meta.pendingStage === 'final') return 'waiting'
  handoff(ctx, projectId, 'final')
  return 'waiting'
}

/** 服务端确定性质量门（机器兜底，不依赖 LLM）：主 AI 自查之外的最后防线。 */
function runQualityChecks(projectId) {
  const meta = readMeta(projectId)
  const bookPath = workFile(projectId, 'book.md')
  const sourceCount = (meta?.sources ?? []).length
  const chapterCount = meta?.outline?.chapters?.length ?? 1
  const bookText = readFileSync(bookPath, 'utf8')
  // human 路线的 loader 指令区是给 AI 老师的装配说明（保留在成品里），扫脚手架前剥掉，避免误判残留。
  const scanText = meta?.route === 'human' ? stripLoaderRegion(bookText) : bookText
  const residue = scanScaffolding(scanText)
  const auditNames = readdirSync(workDir(projectId)).filter((name) => /^audit-\d+\.(md|json)$/.test(name))
  const auditWaived = waived(projectId, 'audit-skip')
  const scaffoldWaived = waived(projectId, 'scaffold-keep')
  const otherWaived = waived(projectId, 'other')
  const gateWaived = waived(projectId, 'gate-skip')
  const gatesApproved = ['1', '2', '3'].every((gate) => {
    const current = foldGate(projectId)
    return current !== null && current.gate === gate && current.status === 'approved'
  }) || (() => {
    // 折叠只保留最后一关；按事件统计三关是否都通过过。
    const approved = new Set()
    for (const event of readEvents(projectId)) {
      if (event.type === 'textbook/gate-decision' && event.data.approved === true) approved.add(event.data.gate)
    }
    return approved.has('1') && approved.has('2') && approved.has('3')
  })()
  const checks = [
    { name: '成品文件齐全', ok: true || otherWaived, note: 'book.md 已生成' },
    { name: '所有章节都有审计记录', ok: auditNames.length >= chapterCount || auditWaived, note: auditWaived ? '已获用户豁免：不要求每章都有独立审查' : `${auditNames.length}/${chapterCount} 章有审计记录` },
    {
      name: '没有遗留的 AI 笔记/脚手架',
      ok: residue.length === 0 || scaffoldWaived,
      note: scaffoldWaived ? '已获用户豁免：保留 AI 的笔记不删' : (residue.length === 0 ? '成品干净，无脚手架残留' : `发现遗留标记：${residue.slice(0, 3).join('；')}`),
    },
    { name: '练习与答案齐全', ok: /练习|答案|习题/.test(bookText) || otherWaived, note: otherWaived ? '已获用户豁免：以你的说明为准' : '成品含练习与答案' },
    { name: '与已拍板的设计一致', ok: gatesApproved || gateWaived, note: gateWaived ? '已获用户豁免：跳过「请你拍板」的设计关卡' : (gatesApproved ? '3 个设计关卡均已通过' : '有设计关卡未通过') },
    { name: '源材料引用可追溯', ok: sourceCount > 0 || otherWaived, note: otherWaived ? '已获用户豁免：以你的说明为准' : `${sourceCount} 份源材料已索引` },
  ]
  // 风格线条条有着落（真实模式）：机器只验「每条 active 都有处置」，不搜关键词伪验。
  if (meta?.demo !== true) {
    const activeStyles = (meta.styleNotes ?? []).filter((n) => n.status === 'active')
    checks.push({
      name: '风格线条条有着落',
      ok: activeStyles.length === 0,
      note: activeStyles.length === 0 ? '全部风格意见已处置（或没有风格意见）' : `${activeStyles.length} 条还没交代去向`,
    })
  }
  // 进度账本（真实模式）：AI 的工作过程留账，交接/重做有参照；progress-skip 可豁免。
  if (meta?.demo !== true) {
    const progressWaived = waived(projectId, 'progress-skip')
    const progressExists = existsSync(workFile(projectId, 'progress.md'))
    checks.push({
      name: '进度账本齐全',
      ok: progressExists || progressWaived,
      note: progressWaived ? '已获用户豁免：跳过「进度账本」检查' : (progressExists ? 'work/progress.md 存在' : '缺 work/progress.md（每章一行：写完/审计/终审）'),
    })
  }
  return checks
}

/** 演示模式（旧通道）：机器跑质量门 + 交付。 */
async function runPhase6Auto(ctx, projectId, meta) {
  const bookPath = workFile(projectId, 'book.md')
  if (!existsSync(bookPath)) {
    appendEvent(projectId, 'textbook/error', { task: '交付', message: 'book.md 不存在，请回退重跑' })
    meta.status = 'error'
    writeMeta(meta)
    return 'error'
  }
  void ctx
  const checks = runQualityChecks(projectId)
  meta.status = 'delivered'
  writeMeta(meta)
  appendEvent(projectId, 'textbook/quality', { checks })
  appendEvent(projectId, 'textbook/agent-end', { label: '最后检查（质量门）', outcome: 'ok' })
  appendEvent(projectId, 'textbook/delivery', {
    book: 'work/book.md', checks,
    note: '交付完成！点"下载 BOOK.md"保存成品。',
  })
  return 'delivered'
}

function recordAgentError(projectId, task, error) {
  const meta = readMeta(projectId)
  // 演示模式出错是流程 bug 或环境问题（可直接重试）；真实模式的子代理失败多半是
  // LLM 未配置/欠费，标为 needs-config 并给出引导。
  meta.status = meta.demo === true ? 'error' : 'needs-config'
  writeMeta(meta)
  appendEvent(projectId, 'textbook/error', {
    task,
    message: String(error instanceof Error ? error.message : error),
  })
  return 'error'
}

/** 状态机主循环：每次从账本重推导，幂等，可跨重启。 */
async function runLoop(ctx, projectId) {
  for (;;) {
    const meta = readMeta(projectId)
    if (meta === null) return
    if (meta.pause !== null && meta.pause !== undefined) return
    if (meta.status === 'error' || meta.status === 'needs-config'
      || meta.status === 'awaiting-gold' || meta.status === 'awaiting-explore'
      || meta.status === 'awaiting-outline' || meta.status === 'awaiting-chapters-review'
      || meta.status === 'delivered') return
    let result
    switch (meta.phase) {
      case 1: result = await runPhase1(ctx, projectId, meta); break
      case 2: result = await runPhase2(ctx, projectId, meta); break
      case 3: result = await runPhase3(ctx, projectId, meta); break
      case 4: result = await runPhase4(ctx, projectId, meta); break
      case 5: result = await runPhase5(ctx, projectId, meta); break
      case 6: result = await runPhase6(ctx, projectId, meta); break
      default: return
    }
    if (result === 'delivered' || result === 'waiting' || result === 'error' || result === 'running') return
    // 'advanced' / 'decided' / 'approved' → 继续循环
  }
}

function kick(ctx, projectId) {
  if (runners.has(projectId)) return runners.get(projectId)
  const promise = runLoop(ctx, projectId)
    .catch((error) => {
      ctx.logger.warn(`textbook: 状态机 ${projectId} 异常: ${String(error)}`)
      const meta = readMeta(projectId)
      if (meta !== null) {
        meta.status = 'error'
        writeMeta(meta)
        try {
          appendEvent(projectId, 'textbook/error', { task: '状态机', message: String(error instanceof Error ? error.message : error) })
        } catch { /* 账本也可能坏了 */ }
      }
    })
    .finally(() => {
      runners.delete(projectId)
      void disposeParent(projectId)
    })
  runners.set(projectId, promise)
  return promise
}

// ── HTTP 层 ────────────────────────────────────────────────────────────────

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > 64 * 1024 * 1024) {
        reject(new Error('body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw === '' ? {} : JSON.parse(raw))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > 128 * 1024 * 1024) {
        reject(new Error('body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function sendJson(res, status, value) {
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

/** POST /textbook/upload?session=&project=&name=&role= （raw body = PDF 字节） */
async function handleUpload(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const sessionId = sessionOf(url.searchParams.get('session'))
  const project = url.searchParams.get('project')
  const name = url.searchParams.get('name')
  const role = url.searchParams.get('role') ?? '学生用书'
  if (project === null || !PROJECT_ID_RE.test(project)) {
    sendJson(res, 400, { ok: false, error: '缺少或非法的 project 参数' })
    return
  }
  if (name === null || name.trim() === '' || !/\.pdf$/i.test(name)) {
    sendJson(res, 400, { ok: false, error: '请选择 PDF 文件（.pdf）' })
    return
  }
  try {
    assertSessionOwned(project, sessionId)
  } catch (error) {
    sendJson(res, 403, { ok: false, error: String(error instanceof Error ? error.message : error) })
    return
  }
  const meta = readMeta(project)
  if (meta === null) {
    sendJson(res, 404, { ok: false, error: '项目不存在' })
    return
  }
  const safeName = basename(name)
  try {
    const bytes = await readRawBody(req)
    if (bytes.length === 0) {
      sendJson(res, 400, { ok: false, error: '文件内容为空' })
      return
    }
    writeFileSync(join(sourcesDir(project), safeName), bytes)
    const sources = meta.sources ?? []
    sources.push({ file: safeName, role, converted: false })
    meta.sources = sources
    meta.status = 'active'
    writeMeta(meta)
    appendEvent(project, 'textbook/source-added', { file: safeName, role })
    sendJson(res, 200, { ok: true, project, file: safeName, role })
  } catch (error) {
    sendJson(res, 500, { ok: false, error: String(error instanceof Error ? error.message : error) })
  }
}

/** GET /textbook/file?session=&project=&path= （文本预览，限 work/ 与 book 产物） */
function handleFile(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const sessionId = sessionOf(url.searchParams.get('session'))
  const project = url.searchParams.get('project')
  const rel = url.searchParams.get('path')
  if (project === null || rel === null) {
    sendJson(res, 400, { ok: false, error: '缺少参数' })
    return
  }
  try {
    assertSessionOwned(project, sessionId)
    const target = resolve(projectDir(project), rel)
    const root = resolve(projectDir(project))
    if (!isWithin(root, target)) {
      sendJson(res, 403, { ok: false, error: '路径越界' })
      return
    }
    if (!existsSync(target) || statSync(target).isDirectory()) {
      sendJson(res, 404, { ok: false, error: '文件不存在' })
      return
    }
    res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'no-store' })
    res.end(readFileSync(target, 'utf8'))
  } catch (error) {
    sendJson(res, 500, { ok: false, error: String(error instanceof Error ? error.message : error) })
  }
}

/** GET /textbook/work?session=&project= （列出已完成步骤的结果文件） */
function handleWork(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const sessionId = sessionOf(url.searchParams.get('session'))
  const project = url.searchParams.get('project')
  if (project === null) {
    sendJson(res, 400, { ok: false, error: '缺少 project 参数' })
    return
  }
  try {
    assertSessionOwned(project, sessionId)
    const dir = workDir(project)
    const files = []
    // 过程记录放最前，人最常看。
    const logPath = processLogPath(project)
    if (existsSync(logPath)) files.push({ path: '过程记录.md', label: '过程记录（全部流水账）' })
    if (existsSync(dir)) {
      for (const name of readdirSync(dir)) {
        if (!name.endsWith('.md')) continue
        let label = null
        if (name === 'explore.md') label = '源探查结果'
        else if (name === 'outline.md') label = '教学设计·章节安排'
        else if (name === 'style-spec.md') label = '写作规范'
        else if (name === 'book.md') label = '成书 BOOK.md'
        else {
          const chapter = /^chapter-(\d+)\.md$/.exec(name)
          const audit = /^audit-(\d+)\.md$/.exec(name)
          if (chapter !== null) label = `第 ${Number(chapter[1])} 章`
          else if (audit !== null) label = `第 ${Number(audit[1])} 章·机器自查`
        }
        if (label !== null) files.push({ path: `work/${name}`, label })
      }
    }
    files.sort((a, b) => a.path.localeCompare(b.path))
    sendJson(res, 200, { ok: true, files })
  } catch (error) {
    sendJson(res, 500, { ok: false, error: String(error instanceof Error ? error.message : error) })
  }
}

/** GET /textbook/download?session=&project=&path= （附件下载） */
function handleDownload(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const sessionId = sessionOf(url.searchParams.get('session'))
  const project = url.searchParams.get('project')
  const rel = url.searchParams.get('path')
  if (project === null || rel === null) {
    sendJson(res, 400, { ok: false, error: '缺少参数' })
    return
  }
  try {
    assertSessionOwned(project, sessionId)
    const target = resolve(projectDir(project), rel)
    const root = resolve(projectDir(project))
    if (!isWithin(root, target)) {
      sendJson(res, 403, { ok: false, error: '路径越界' })
      return
    }
    if (!existsSync(target) || statSync(target).isDirectory()) {
      sendJson(res, 404, { ok: false, error: '文件不存在' })
      return
    }
    // 下载文件名用「人定的书名」（如《初中数学·有理数》.md），保留用户敲定的命名。
    const dlMeta = readMeta(project)
    const bookName = (typeof dlMeta?.name === 'string' && dlMeta.name.trim() !== '' ? dlMeta.name.trim() : basename(rel))
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').trim().replace(/[. ]+$/g, '') || 'BOOK'
    const fileName = encodeURIComponent(`${bookName}.md`)
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${fileName}`,
      'Cache-Control': 'no-store',
    })
    res.end(readFileSync(target))
  } catch (error) {
    sendJson(res, 500, { ok: false, error: String(error instanceof Error ? error.message : error) })
  }
}

/** 方法论文本过长时截断（交办说明里嵌，避免刷爆 AI 上下文）。 */
function clipMethodology(text, cap = 9000) {
  const clean = String(text ?? '').trim()
  if (clean.length <= cap) return clean
  return `${clean.slice(0, cap)}\n…（方法论过长已截断，需要全文可再读插件 resources/ 目录）`
}

/** 给主 AI 的阶段任务说明（stage-brief 返回；全部中文、人话）。 */
function buildStageBrief(projectId) {
  const meta = readMeta(projectId)
  const stage = meta?.pendingStage ?? null
  const gate = meta?.pendingGate ?? null
  if (stage === null) return null
  const sources = (meta.sources ?? [])
    .filter((source) => source.converted === true)
    .map((source) => ({ file: source.file, role: source.role ?? '', md: `sources-md/${source.md}` }))
  const mtl = (rel) => clipMethodology(resourceText(rel))
  const brief = {
    stage, gate, label: stageLabel(stage, gate), dir: projectDir(projectId),
    project: { name: meta.name ?? '', goal: meta.goal ?? '', route: meta.route ?? 'blueprint', science: meta.science === true },
  }
  switch (stage) {
    case 'explore': {
      brief.task = '通读全部转换后的教材（sources 里每本给出准确的 sources-md/ 子路径与 full.md），亲手整理出「源材料索引」与「结构化知识地图」。'
      brief.outputs = [
        'work/explore.md —— 人读的源材料索引（纯 Markdown）：材料清单（文件名+角色）、结构观察（摸源结构、角色标签、权威层级）、教学线索（知识点密度、重点难点、可用素材）；≤1200 字，面向非技术家长。',
        'work/knowledge-map.json —— 结构化知识地图（严格 JSON）：materials:[{num,sections:[{title,summary,keywords}]}]、knowledgePoints:[{id,title,source,summary,difficulty}]、teachingFocus:[]、chapterSuggestion:[{title,source,points}]（4-10 章）。',
      ]
      brief.materials = sources
      brief.methodology = `${mtl('SKILL.md')}\n\n${mtl('references/source-material.md')}`
      brief.hints = [
        '直接用自己的文件工具读 sources 里列出的每个 md；这是全书设计的基准，宁可多读、多整理，不要只读开头。',
        '写完用 stage-submit（stage=explore）交工；机器会验 work/explore.md 与 work/knowledge-map.json 的格式，验过后等用户确认。',
      ]
      // 重做时：把用户的不满意见带给 AI（这是重做唯一的改进方向）。
      const redoNote = meta.exploreRedoNote
      if (typeof redoNote === 'string' && redoNote.trim() !== '') {
        brief.userFeedback = redoNote
        brief.hints.push(`这是重做：用户上次的不满意见是「${redoNote}」。必须照着改；实在不清楚就先在对话里问用户确认方向，绝不能再交一份几乎一样的。`)
      }
      break
    }
    case 'gate': {
      const current = foldGate(projectId)
      brief.task = `手工起草第 ${gate} 关的设计方案，用人话向用户解释，等用户拍板。`
      brief.gateLabel = GATE_LABELS[gate] ?? ''
      brief.gateTask = {
        '1': '分析源材料并推导学习目标：这本书让学习者最终能做到什么？最大的坑是什么？',
        '2': '教学模式选型与板块语法：读了模式库，考虑过哪些、拒绝哪些、为什么；选中的模式解决本书哪个教学问题；设计每章的板块结构。',
        '3': '整书教学架构：知识链主线、卷/部划分、逐章骨架表（每章五行：章号/标题/类型/知识链位置/锚定知识点）、特殊章、跨章引用机制、附录策略、贯穿案例约定；以及体量设计：整书总字数与预计学时、每章字数区间、依据（材料知识量/学习目标/读者背景），体量须在大白话摘要中呈现。',
      }[String(gate)] ?? ''
      brief.previousDecision = current === null || current.gate !== gate ? null : {
        version: current.version, status: current.status,
        reasons: current.decision?.reasons ?? [], note: current.decision?.note ?? '',
      }
      brief.outputs = '方案三段通过 stage-submit（stage=gate）提交：title（一句话标题）/ summary（给用户看的人话摘要 300 字内）/ detail（完整方案 Markdown 正文，必须内联全文--禁止写「见文件/proposal-*.md」，用户只在页面上看方案，不会去文件夹翻）。'
      brief.materials = sources
      brief.methodology = mtl({
        '1': 'references/source-material.md', '2': 'references/patterns/README.md', '3': 'references/file-contracts.md',
      }[String(gate)] ?? 'SKILL.md')
      // 本书自定义模式库一并交给 AI（与内置模式库同等地位）：用户在拍板/驳回「换个风格」时
      // 粘贴的描述会变成自定义模式卡，任何一关（含修订）都要读到它。
      {
        const customPatterns = customPatternsBrief(projectId)
        if (customPatterns !== '') brief.methodology = `${brief.methodology}\n\n${customPatterns}`
      }
      brief.hints = [
        '面向家长/老师，别用黑话；字符串里严禁英文双引号，引用一律用「」。',
        '若 previousDecision 是被驳回的方案，必须认真采纳用户意见再修订，并在摘要里说明采纳了哪些。',
      ]
      break
    }
    case 'outline': {
      brief.task = '基于知识地图与材料结构，设计整书章节骨架：每章明确用哪本材料的哪一部分、覆盖哪些知识点（points，来自知识地图）、建议字数（遵循第 3 关已拍板的体量设计，不许静默缺省）、体量依据；并标注建议的样例章（goldChapter+理由：哪章最能代表全书风格/结构最完整/材料最充分）。'
      brief.outputs = 'chapters 数组通过 stage-submit（stage=outline）提交：[{title,outline(一句话),source:"资料N：小节或主题",targetWords,points:[知识点…],volumeReason(一句依据)}]（4-10 章），外加 goldChapter（1 基章号）与 goldChapterReason（一句理由）。'
      brief.references = ['work/knowledge-map.json（知识地图）', 'work/explore.md（探查报告）']
      brief.materials = sources
      brief.methodology = mtl('references/file-contracts.md')
      const outlineRedo = meta.outlineRedoNote
      if (typeof outlineRedo === 'string' && outlineRedo.trim() !== '') {
        brief.userFeedback = outlineRedo
        brief.hints = [...(brief.hints ?? []), `这是重做：用户上次的意见是「${outlineRedo}」。必须照着改；不清楚就先问，绝不能交一份几乎一样的。`]
      }
      break
    }
    case 'gold': {
      const gn = goldN(meta)
      const chapterSource = meta.outline?.chapters?.[gn - 1]?.source ?? ''
      brief.chapter = gn
      brief.title = meta.outline?.chapters?.[gn - 1]?.title ?? ''
      brief.task = `亲笔写全书的最佳范例章（第 ${gn} 章，金标准）：写出写作规范 + 第 ${gn} 章全文 + 四层审计 + 试教（条件触发）。这是全书其余章节要模仿的基准，务必高质量、与教材内容一致。`
      brief.targetWords = meta.outline?.chapters?.[gn - 1]?.targetWords ?? meta.targetWords ?? 6000
      brief.chapterSource = chapterSource
      brief.outputs = [
        'work/style-spec.md -- 写作规范（十问契约，节标题齐全）：模式选型（考虑过哪些/拒绝了哪些/为什么；每个模式对应本书哪个教学问题）、章内板块语法完整版、情境钩子写法、正文语言风格、量化参考密度、深度四维承诺表（四维各用什么板块兑现到什么程度）、金标准写作惯例区（本稿回填）、防幻觉铁律、写作纪律（一个 agent 写几章/篇幅约束/排除项）、脚手架标题清单（交付前拆除用）。',
        `work/chapter-${String(gn).padStart(2, '0')}.md —— 第 ${gn} 章全文（按 style-spec，含全部板块与答案；约 ${brief.targetWords} 字，宁可多写不可敷衍）`,
        `work/audit-${String(gn).padStart(2, '0')}.md —— 审计记录（四层审计 + 试教[条件触发]，严格 JSON：{"passed":true,"issues":[{"level":"错误|警告|提示","text":"具体问题"}]}）`,
      ]
      brief.materials = sources
      brief.methodology = `${mtl('references/file-contracts.md')}\n\n${mtl('references/audit-and-testing.md')}`
      // 金标准写作规范：本书自定义模式库一并交给 AI（「模式选型」节须覆盖它们）。
      {
        const customPatterns = customPatternsBrief(projectId)
        if (customPatterns !== '') brief.methodology = `${brief.methodology}\n\n${customPatterns}`
      }
      brief.hints = [
        `先按 outline 里第 ${gn} 章的 source 找到对应材料小节通读，再动笔；章节长就分段写入 chapter-${String(gn).padStart(2, '0')}.md。`,
        '写完用 stage-submit（stage=gold）交工；机器验三份文件都在且非空。',
        '写完 style-spec 与范例章后**不要自己充审计**：按 `resources/references/subagent-prompts/gold-audit-prompt.md` 派全新上下文的审计小助手（必读文档矩阵+一致性核对，产出含 matrix 的 audit 文件），读报告、判决修订后才交工。',
      ]
      // 修订时：把用户的金标准意见（意见单 + 合并后的交办）透出给 AI 逐条照改。
      const goldActive = (meta.goldOpinions ?? []).filter((o) => o.status === 'pending' || o.status === 'sent')
      const goldRedo = meta.goldRedoNote
      if (goldActive.length > 0 || typeof goldRedo === 'string') {
        brief.goldOpinions = goldActive.map((o) => ({ kind: o.kind, wish: o.wish, target: o.target }))
        const note = typeof goldRedo === 'string' && goldRedo !== '' ? goldRedo : goldActive.map((o, i) => `#${i + 1} ${o.wish}`).join('；')
        brief.userFeedback = note
        brief.hints = [
          ...(brief.hints ?? []),
          ...(meta.goldRedoNote != null && meta.goldRedoNote.includes('整版重写')
            ? [`这是整版重写：${meta.goldRedoNote} 不参考旧稿（已归档）。`]
            : [`这是修订：用户的意见是「${note}」。逐条照改；改完自查一遍再交工。`]),
          '交工后用户会在工作台「边读边标记」确认；每条意见都会在定稿时沉淀进风格线，全书写都要遵守。',
        ]
      }
      break
    }
    case 'chapters': {
      const chapters = meta.outline?.chapters ?? []
      const remaining = chapters
        .map((chapter, index) => ({ n: index + 1, ...chapter }))
        .filter((chapter) => !chapterDone(projectId, chapter.n))
      brief.task = '铺章：对每一章走标准三步——派小助手写（给大纲/材料小节/写作规范/范例章路径）→ 派小助手审计 → 你亲自终审（读审计报告 + 抽查正文），通过后按章交工（stage=chapters, chapter=N）。'
      brief.total = chapters.length
      brief.remaining = remaining.map((chapter) => ({
        n: chapter.n, title: chapter.title ?? '', outline: chapter.outline ?? '',
        source: chapter.source ?? '', targetWords: chapter.targetWords ?? meta.targetWords,
        points: chapter.points ?? [],
      }))
      brief.references = [
        'work/style-spec.md（写作规范）',
        '范例章（见 brief）',
        'work/outline.md（章节骨架）',
      ]
      // F39（2026-08-20 走查）：段落级抽查意见也透出给 AI（整章意见带 comment，段落意见合成人话；已撤销的跳过）。
      brief.pendingReviews = (meta.pendingReviews ?? []).filter((r) => r.status !== 'revoked').map((r) => ({ chapter: r.chapter, comment: paragraphReviewText(r) }))
      brief.methodology = `${mtl('references/audit-and-testing.md')}\n${mtl('references/file-contracts.md')}\n${mtl('references/subagent-prompts/writing-agent-prompt.md')}\n${mtl('references/subagent-prompts/audit-agent-prompt.md')}`
      brief.hints = [
        '小助手与审计小助手用你的 subagent 工具派；提醒小助手材料小节与产出文件的准确路径（都在 dir 下）。',
        '每交一章前先 workbench_status 查有没有新抽查意见，有就先处理（修订 → 再审计 → 终审）再继续。',
        '机器按章验收：每章都要有 work/chapter-NN.md 和 work/audit-NN.md 才算过。',
        '派写作小助手时必须带（按 writing-agent-prompt.md 模板填）：本章知识点清单（remaining[].points）、本章在知识链中的位置与跨章引用指向（前面哪章讲过什么、后面哪章会用到这里）、范例章路径与写作规范。',
        '跨章引用纪律：前向引用只到大纲承诺粒度（「第 N 章会展开」），禁止编造未写章节的具体数字/结论/例题；审计小助手按 audit-agent-prompt.md 派，要求其扫跨章引用存在性（含前向承诺失配）。',
      ]
      break
    }
    case 'merge': {
      brief.task = '写这本书的前言/使用说明（≤300 字，通俗），随 stage-submit（stage=merge, preface=...）交工；机器会 100% 保真拼装各章成书（不删节）。'
      brief.references = ['交工后工作台会生成 work/book.md（机器拼装成品）']
      brief.outputs = ['维护 work/progress.md（每章一行：写完/审计/终审）']
      brief.hints = ['前言写给"拿到这本书的人"：这本书讲什么、怎么用（给 AI 老师上课还是人直接读）。']
      break
    }
    case 'final': {
      brief.task = '最后检查：亲自读 work/book.md，逐项自查（成品完整、每章有自查记录、无 AI 脚手架残留、练习与答案齐全、与已拍板设计一致、材料可追溯），发现问题先修，再把你的自查报告（人话）随 stage-submit（stage=final, report=...）交工。机器硬检查会兜底。'
      brief.counts = { chapters: (meta.outline?.chapters ?? []).length, sources: (meta.sources ?? []).length }
      brief.methodology = mtl('references/delivery-checklist.md')
      brief.outputs = ['维护 work/progress.md（每章一行：写完/审计/终审）']
      break
    }
    default:
      brief.task = '（这个阶段的说明还没有补齐，先按状态机提示与用户确认该做什么。）'
  }
  // 深改注入的重做意见：只交给被改段的那个阶段。
  if (meta.deepRedoNote != null) {
    const segOfStage = { explore: 'explore', gate: `gate-${gate ?? ''}`, outline: 'outline', gold: 'gold', chapters: 'chapters', merge: 'merge', final: 'final' }
    const mySeg = stage === 'gate' ? `gate-${gate}` : segOfStage[stage] ?? null
    // 先快照再消费：首个分支会 delete meta.deepRedoNote，后续分支不能再用它判段。
    const redo = meta.deepRedoNote
    if (mySeg !== null && redo.segment === mySeg) {
      brief.userFeedback = redo.note
      brief.hints = [...(brief.hints ?? []), `这是定点修改后的重做：用户这次的要求是「${redo.note}」。必须照着改；产物从零重做（旧版已留档）。`]
      delete meta.deepRedoNote
      writeMeta(meta)
    }
    if (mySeg !== null && redo.segment.startsWith('chapter-') && stage === 'chapters') {
      brief.userFeedback = redo.note
      brief.hints = [...(brief.hints ?? []), `定点修改后的重做：用户要求「${redo.note}」，从第 ${redo.segment.slice(8)} 章起重做。`]
      delete meta.deepRedoNote
      writeMeta(meta)
    }
  }
  const pendingIv = (meta.pendingInterventions ?? []).filter((i) => i.status === 'pending')
  if (pendingIv.length > 0) {
    brief.pendingInterventions = pendingIv.map((i) => ({ text: i.text, target: i.target ?? null, at: i.at }))
    brief.hints = [...(brief.hints ?? []), `有 ${pendingIv.length} 条用户留言要先处理（见 pendingInterventions），处理完用 workbench_act(action=intervene-done, id=...) 逐条销号，再继续手头的活。`]
  }
  return brief
}

/** POST /textbook/action 动作分发 */
// ─────────────────────────────────────────────────────────────────────────────
// 动作族 dispatch 表（架构候选 4 · ADR-0003 第二刀）：39 个顶层 case 按 9 个动作族
// 归组为 handler + action→handler 映射表；同文件 banner 分区、不拆物理文件。
// HTTP 层仍是唯一 external seam；族 handler 不对测试导出——现有 mkReq/mkRes fakes
// 即第二个 adapter。族边界 = 未来共享 domain module 的候选挂载点（见议题 01 协调注记）。
// ─────────────────────────────────────────────────────────────────────────────

/** 动作族 · 书目管理：'book-create' / 'book-rename' / 'book-set-goal' / 'book-delete'。 */
async function actBooks(ctx, req, res, action, sessionId, project, body) {
  switch (action) {
    case 'book-create': {
      // 向导：新建书项目（一个会话只能有一本书）
      const { name, goal, route, science, demo } = body
      if (typeof name !== 'string' || name.trim() === '') {
        sendJson(res, 400, { ok: false, error: '请填写书名' })
        return
      }
      if (listProjects(sessionId).length > 0) {
        sendJson(res, 409, { ok: false, error: '这个会话已经有一本书了：先完成它、删除它，或者新建一个会话再开第二本' })
        return
      }
      const id = `book-${Date.now().toString(36)}`
      // 书夹位置：优先会话的工作区目录，文件夹名用书名；拿不到工作区就退回默认目录。
      const workspace = sessionWorkspace(ctx, sessionId) ?? projectsRoot()
      const folderName = sanitizeFolderName(name.trim()) || id
      const dir = freeBookDir(workspace, folderName)
      mkdirSync(dir, { recursive: true })
      registerProject(id, dir)
      try {
        writeFileSync(join(dir, 'README.md'), `# 这本书的文件夹\n\n这里存放「${name.trim()}」从材料到成品的所有内容：\n\n- **README.md** — 本说明文件\n- **过程记录.md** — 从建书到交付的完整流水账（人读）\n- **sources/** — 你上传的教材 PDF 原件\n- **sources-md/** — PDF 转成的文字版\n- **提案/** — 每一关的设计方案（含修订版）\n- **work/** — 机器写出来的内容（源探查报告、各章、成书）\n- **snapshots/** — 每个拍板点的存档（可回退）\n- **timeline.jsonl / project.json** — 机器用的账本与信息（别手改）\n`)
      } catch { /* README 失败不影响建书 */ }
      const meta = {
        id, name: name.trim(), goal: typeof goal === 'string' ? goal : '',
        route: route === 'human' ? 'human' : 'blueprint',
        science: science === true,
        demo: demo === true,
        session: sessionId,
        folder: basename(dir),
        sources: [], phase: 1, status: 'active',
        createdAt: Date.now(), updatedAt: Date.now(), eventCount: 0,
      }
      writeMeta(meta)
      appendEvent(id, 'textbook/phase-start', { phase: 1, label: PHASE_LABELS[1] })
      sendJson(res, 200, { ok: true, project: id, meta })
      return
    }
    case 'book-rename': {
      // 对话/向导代改书名（文件夹名不变，只改界面显示的书名）。
      assertSessionOwned(project, sessionId)
      const { name } = body
      if (typeof name !== 'string' || name.trim() === '') {
        sendJson(res, 400, { ok: false, error: '请填写书名' })
        return
      }
      const renameMeta = readMeta(project)
      const oldName = renameMeta.name
      renameMeta.name = name.trim()
      renameMeta.updatedAt = Date.now()
      writeMeta(renameMeta)
      appendEvent(project, 'textbook/hint', { text: `书名已从「${oldName}」改为「${renameMeta.name}」` })
      sendJson(res, 200, { ok: true, project, name: renameMeta.name })
      return
    }
    case 'book-set-goal': {
      // 对话/向导代改学习目标。
      assertSessionOwned(project, sessionId)
      const { goal } = body
      if (typeof goal !== 'string' || goal.trim() === '') {
        sendJson(res, 400, { ok: false, error: '请填写学习目标' })
        return
      }
      const goalMeta = readMeta(project)
      goalMeta.goal = goal.trim()
      goalMeta.updatedAt = Date.now()
      writeMeta(goalMeta)
      appendEvent(project, 'textbook/hint', { text: '学习目标已更新' })
      sendJson(res, 200, { ok: true, project, goal: goalMeta.goal })
      return
    }
    case 'book-delete': {
      // 取消/删除一本书：两步确认后移入回收站（数据不物理删除，可恢复）。
      const { confirm } = body
      assertSessionOwned(project, sessionId)
      if (confirm !== true) {
        sendJson(res, 400, { ok: false, error: '需要 confirm: true 才执行删除' })
        return
      }
      runners.delete(project)
      gateWaiters.delete(project)
      void disposeParent(project)
      const target = trashProject(project)
      // 从注册表移除：已删除的书不再出现在项目列表（文件夹仍在回收站，可恢复）。
      const registry = readRegistry()
      if (registry[project] !== undefined) {
        delete registry[project]
        writeRegistry(registry)
      }
      ctx.logger.info(`textbook: 项目 ${project} 已移入回收站 ${target}`)
      sendJson(res, 200, { ok: true, project, trash: target })
      return
    }
  }
}

/** 动作族 · 向导与素材识别：'wizard-suggest' / 'suggest-roles'。 */
async function actWizard(ctx, req, res, action, sessionId, project, body) {
  switch (action) {
    case 'wizard-suggest': {
      // 向导建议：AI 推荐几个"造一本书"的起点，人类只做确认。
      let hint = typeof body.hint === 'string' ? body.hint.trim() : ''
      // F21（2026-08-20）：hint 为空时读会话首条用户消息当建议依据。
      if (hint === '') {
        const sess = ctx.get('sessions')?.get?.(sessionId)
        const first = (sess?.events ?? []).find((e) => e.type === 'user/message' && e.data?.source?.kind === 'user')
        const blocks = first?.data?.content ?? []
        hint = blocks.filter((b) => b.type === 'text').map((b) => String(b.text ?? '')).join(' ').trim().slice(0, 120)
      }
      ctx.logger.info(`textbook: wizard-suggest hint=「${hint || '（空）'}」`)
      const wizardId = `wizard-${sessionId.replace(/[^a-z0-9-]/g, '-').slice(0, 40)}`
      mkdirSync(projectDir(wizardId), { recursive: true })
      const runtime = {
        ctx,
        demo: false,
        dir: projectsRoot(),
        project: { name: '选书向导' },
        getParent: () => getParent(ctx, wizardId, { demo: false }),
      }
      try {
        const result = await generateContent(runtime, 'wizard', { hint })
        sendJson(res, 200, { ok: true, suggestions: result.suggestions })
      } catch (error) {
        // LLM 不可用时给内置建议（跟随背景），不让向导卡住。
        ctx.logger.warn(`textbook: wizard-suggest LLM 失败，使用内置建议: ${String(error instanceof Error ? error.message : error)}`)
        sendJson(res, 200, {
          ok: true,
          fallback: true,
          suggestions: hint === ''
            ? [
                { name: '初中数学·有理数', goal: '学完能独立做对教材配套的基础题，并说出每个概念是什么、为什么、怎么用', science: true },
                { name: '小学英语·自然拼读', goal: '看到陌生单词能试读出来，听写常见单词不再怕', science: false },
                { name: '高中物理·力学入门', goal: '能用受力分析解典型题，看懂"为什么物体会动"', science: true },
              ]
            : [
                { name: `围绕「${hint.slice(0, 12)}」的入门书`, goal: '学完能独立完成对应基础练习，并说出每个概念是什么、为什么、怎么用', science: false },
                { name: `${hint.slice(0, 12)}：从例子到规律`, goal: '能用自己的话讲清楚知识点的来龙去脉，做对配套练习', science: false },
                { name: `${hint.slice(0, 12)}：查漏补缺版`, goal: '找出最薄弱的两三处并逐一攻克，配套练习正确率达到九成', science: false },
              ],
        })
      }
      return
    }
    case 'suggest-roles': {
      // 上传时 AI 识别每本 PDF 的角色，人类只确认；AI 失败按文件名规则兜底。
      const files = Array.isArray(body.files)
        ? body.files.filter((f) => typeof f === 'string' && f.trim() !== '').slice(0, 20)
        : []
      if (files.length === 0) {
        sendJson(res, 400, { ok: false, error: '没有可识别的文件' })
        return
      }
      const wizardId = `wizard-${sessionId.replace(/[^a-z0-9-]/g, '-').slice(0, 40)}`
      mkdirSync(projectDir(wizardId), { recursive: true })
      const runtime = {
        ctx,
        demo: false,
        dir: projectsRoot(),
        project: { name: '材料识别' },
        getParent: () => getParent(ctx, wizardId, { demo: false }),
      }
      try {
        const result = await generateContent(runtime, 'roles', { files })
        sendJson(res, 200, { ok: true, roles: result.roles })
      } catch (error) {
        ctx.logger.warn(`textbook: suggest-roles LLM 失败，使用文件名规则: ${String(error instanceof Error ? error.message : error)}`)
        sendJson(res, 200, {
          ok: true,
          fallback: true,
          roles: files.map((file) => ({ file, role: guessRoleFromName(file) })),
        })
      }
      return
    }
  }
}

/** 动作族 · 转换与推进：'convert-start' / 'retry-convert' / 'nudge' / 'resume'。 */
async function actConvert(ctx, req, res, action, sessionId, project, body) {
  switch (action) {
    case 'convert-start': {
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      if (meta === null) throw new Error(`unknown project ${JSON.stringify(project)}`)
      meta.status = 'running'
      writeMeta(meta)
      void kick(ctx, project)
      sendJson(res, 200, { ok: true, project })
      return
    }
    case 'retry-convert': {
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      if (meta === null) throw new Error(`unknown project ${JSON.stringify(project)}`)
      meta.status = 'running'
      writeMeta(meta)
      void kick(ctx, project)
      sendJson(res, 200, { ok: true, project })
      return
    }
    case 'nudge': {
      // 催办：把用户的一句话以 notice 唤醒主 AI（不 cancel、不改账本状态）。
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      const agent = ctx.get('agents')?.get?.(meta?.session)
      if (agent === undefined) { sendJson(res, 409, { ok: false, error: '这个会话没有活着的主 AI' }); return }
      const text = String(body.text ?? '').slice(0, 200)
      try {
        agent.followup({
          id: `tb-nudge-${Date.now().toString(36)}`,
          role: 'user',
          content: [{ type: 'text', text: `【工作台催办】${text === '' ? '用户在等你推进工作台上的活，请查 workbench_status 后继续。' : text}` }],
          source: { kind: 'plugin', plugin: 'dsh-craft-your-textbook', form: 'notice', summary: '工作台：用户催办' },
        })
        sendJson(res, 200, { ok: true })
      } catch (error) {
        sendJson(res, 502, { ok: false, error: `催办没送达：${String(error instanceof Error ? error.message : error)}` })
      }
      return
    }
    case 'resume': {
      // 重试/继续（F48，2026-08-23 语义修正）：优先像「戳一下 AI」一样，只给活的主 AI 发一条
      // 「从断点继续」的短提醒——不重发整段交办、不重做当前环节；没有活的主 AI 或发不出去时
      // 才退回旧逻辑：机器在等 AI（pendingStage）→ 重新交办唤醒；否则重新推状态机。
      assertSessionOwned(project, sessionId)
      const resumeMeta = readMeta(project)
      if (resumeMeta === null) throw new Error(`unknown project ${JSON.stringify(project)}`)
      const clearedPause = resumeMeta.pause !== null && resumeMeta.pause !== undefined
      if (clearedPause) {
        resumeMeta.pause = null
        appendEvent(project, 'textbook/resume', {})
      }
      const agent = (ctx.get('agents') ?? ctx.agents)?.get?.(resumeMeta.session)
      if (resumeMeta.demo !== true && agent !== undefined) {
        try {
          const label = stageLabel(resumeMeta.pendingStage, resumeMeta.pendingGate ?? null)
          const text = [
            `【工作台继续 · ${label || '当前环节'}】`,
            '用户点了「让 AI 接着干」。请接着把当前环节做完，不要重做已完成的部分：',
            '1. 先调用 workbench_status 看真实状态（项目、阶段、待办、抽查意见）。',
            '2. 若本环节还没领过任务，调用 workbench_act（action=stage-brief）领取说明后再继续；领过就直接从中断处继续。',
            '3. 过程中用 workbench_act（action=progress）随时上报进度；完成后照常调用 stage-submit 交工。',
            '铁律：先用大白话告诉用户你要接着做什么，再动手；需要用户拍板的事绝不自作主张。',
          ].join('\n')
          agent.followup({
            id: `tb-resume-${Date.now().toString(36)}`,
            role: 'user',
            content: [{ type: 'text', text }],
            source: { kind: 'plugin', plugin: 'dsh-craft-your-textbook', form: 'notice', summary: `工作台：用户点了「让 AI 接着干」（${label || '当前环节'}）` },
          })
          if (!clearedPause) appendEvent(project, 'textbook/resume', {})
          resumeMeta.status = 'running'
          resumeMeta.updatedAt = Date.now()
          writeMeta(resumeMeta)
          sendJson(res, 200, { ok: true, project, woke: 'continue' })
          return
        } catch (error) {
          ctx.logger.warn(`textbook: 继续（followup）失败，退回旧重试路径: ${String(error instanceof Error ? error.message : error)}`)
        }
      }
      if (resumeMeta.pendingStage !== null && resumeMeta.pendingStage !== undefined) {
        resumeMeta.status = 'running'
        writeMeta(resumeMeta)
        handoff(ctx, project, resumeMeta.pendingStage, resumeMeta.pendingGate ?? null)
        // F41（2026-08-20）：demo 无主 AI 消费 handoff，必须补 kick 驱动状态机，
        // 否则 pendingStage 非空时 resume 后卡 running（实测需再 kick 才能恢复）。
        if (resumeMeta.demo === true) void kick(ctx, project)
        sendJson(res, 200, { ok: true, project, woke: true })
        return
      }
      resumeMeta.status = 'running'
      writeMeta(resumeMeta)
      void kick(ctx, project)
      sendJson(res, 200, { ok: true, project })
      return
    }
  }
}

/** 动作族 · 关卡拍板：'gate-decide' / 'explore-confirm' / 'outline-confirm' / 'chapters-review-confirm' / 'rollback'。 */
async function actGates(ctx, req, res, action, sessionId, project, body) {
  switch (action) {
    case 'gate-decide': {
      const { gate, version, approved, mode, reasons, note } = body
      const gateId = String(gate)
      if ((gateId === '' || gateId === 'undefined') || typeof version !== 'number' || typeof approved !== 'boolean') {
        sendJson(res, 400, { ok: false, error: 'gate-decide 需要 gate/version/approved' })
        return
      }
      assertSessionOwned(project, sessionId)
      const current = foldGate(project)
      if (current === null || current.gate !== gateId || current.version !== version) {
        sendJson(res, 409, { ok: false, error: `关卡状态不匹配（当前: ${current === null ? '无' : `${current.gate} v${current.version} ${current.status}`}）` })
        return
      }
      if (current.status !== 'awaiting') {
        sendJson(res, 409, { ok: false, error: `该关卡已 ${current.status === 'approved' ? '通过' : '驳回'}，不能重复拍板` })
        return
      }
      const event = appendEvent(project, 'textbook/gate-decision', {
        gate: gateId,
        version,
        approved,
        mode: typeof mode === 'string' ? mode : null,
        reasons: Array.isArray(reasons) ? reasons.filter((item) => typeof item === 'string') : [],
        note: typeof note === 'string' ? note : '',
      })
      const meta = readMeta(project)
      meta.updatedAt = event.time
      writeMeta(meta)
      const waiter = gateWaiters.get(project)
      if (waiter !== undefined && waiter.gate === gateId && waiter.version === version) {
        gateWaiters.delete(project)
        waiter.resolve()
      }
      void kick(ctx, project)
      sendJson(res, 200, { ok: true, project, event })
      return
    }
    case 'explore-confirm': {
      // 用户确认探查结果：true → 进设计；false → 归档重做（可带一句"哪里不满意"，重做时 AI 必看）。
      assertSessionOwned(project, sessionId)
      const exMeta = readMeta(project)
      if (exMeta === null || exMeta.status !== 'awaiting-explore') {
        sendJson(res, 409, { ok: false, error: '当前没有等待确认的探查结果' })
        return
      }
      const approved = body.approved === true
      if (approved) {
        exMeta.exploreConfirmed = true
        exMeta.status = 'running'
        exMeta.pendingStage = null
        exMeta.pendingGate = null
        delete exMeta.exploreRedoNote
        writeMeta(exMeta)
        appendEvent(project, 'textbook/hint', { text: '✅ 探查结果已确认，开始做教学设计。' })
        advance(project, 2, 3)
        void kick(ctx, project)
        sendJson(res, 200, { ok: true, project, approved: true })
      } else {
        // 用户意见（可选）：理由点选 + 一句话，随重做交办带给 AI（重做唯一的改进方向）。
        const reasons = Array.isArray(body.reasons)
          ? body.reasons.filter((r) => typeof r === 'string' && r.trim() !== '').slice(0, 5)
          : []
        const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : ''
        const feedback = [...reasons, note].filter((t) => t !== '')
        const archive = join(workDir(project), '_旧版产物')
        mkdirSync(archive, { recursive: true })
        const stamp = Date.now().toString(36)
        for (const name of ['explore.md', 'knowledge-map.json']) {
          const target = workFile(project, name)
          if (existsSync(target)) { try { renameSync(target, join(archive, `${name}.${stamp}`)) } catch { /* 尽力归档 */ } }
        }
        exMeta.status = 'running'
        exMeta.pendingStage = null
        exMeta.pendingGate = null
        exMeta.exploreRedoNote = feedback.length > 0 ? feedback.join('；') : null
        writeMeta(exMeta)
        appendEvent(project, 'textbook/hint', {
          text: feedback.length > 0
            ? `↩️ 探查结果已标记重做，你的意见（${feedback.join('；')}）已带给 AI，它正在重新探查。`
            : '↩️ 探查结果已标记重做（你没写具体意见），AI 会重新仔细通读后再来；想给它方向随时在对话里说。',
        })
        handoff(ctx, project, 'explore')
        sendJson(res, 200, { ok: true, project, approved: false })
      }
      return
    }
    case 'outline-confirm': {
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      if (meta === null || meta.status !== 'awaiting-outline') {
        sendJson(res, 409, { ok: false, error: '当前没有等待确认的章节安排' })
        return
      }
      const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : ''
      const pick = Number(body.goldChapter)
      if (body.approved === true && Number.isSafeInteger(pick) && pick >= 1 && pick <= (meta.outline?.chapters ?? []).length) {
        if (meta.goldChapter !== pick) {
          meta.goldChapter = pick
          appendEvent(project, 'textbook/hint', { text: `📐 样例章定为第 ${pick} 章。` })
        }
      }
      appendEvent(project, 'textbook/outline-decision', { approved: body.approved === true, note })
      if (body.approved === true) {
        meta.status = 'running'
        delete meta.outlineRedoNote
        writeMeta(meta)
        appendEvent(project, 'textbook/hint', { text: '✅ 章节安排已确认，开始写最佳范例章。' })
        advance(project, 3, 4)
        void kick(ctx, project)
      } else {
        const archive = join(workDir(project), '_旧版产物')
        mkdirSync(archive, { recursive: true })
        const stamp = Date.now().toString(36)
        const target = workFile(project, 'outline.md')
        if (existsSync(target)) { try { renameSync(target, join(archive, `outline.md.${stamp}`)) } catch { /* 尽力归档 */ } }
        delete meta.outline
        meta.status = 'running'
        meta.pendingStage = null
        meta.pendingGate = null
        if (note !== '') meta.outlineRedoNote = note
        writeMeta(meta)
        appendEvent(project, 'textbook/hint', {
          text: note !== ''
            ? `↩️ 章节安排已驳回，你的意见（${note}）已带给 AI，它正在重新安排。`
            : '↩️ 章节安排已驳回（没写具体意见），AI 会重新安排；想给方向随时在对话里说。',
        })
        handoff(ctx, project, 'outline')
      }
      sendJson(res, 200, { ok: true, project, approved: body.approved === true })
      return
    }
    case 'chapters-review-confirm': {
      // 全章过目确认：true → 开始合并；false → 记账 chaptersReviewed=false（可继续改意见，不会并发合并）。
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      if (meta === null || meta.status !== 'awaiting-chapters-review') {
        sendJson(res, 409, { ok: false, error: '当前没有等你过目的章节' })
        return
      }
      meta.chaptersReviewed = body.approved === true
      writeMeta(meta)
      appendEvent(project, 'textbook/chapters-review', { approved: body.approved === true })
      if (body.approved === true) {
        meta.status = 'running'
        meta.pendingStage = null
        writeMeta(meta)
        appendEvent(project, 'textbook/hint', { text: '✅ 全章过目通过，开始合并成书。' })
        handoff(ctx, project, 'merge')
      }
      sendJson(res, 200, { ok: true, project })
      return
    }
    case 'rollback': {
      assertSessionOwned(project, sessionId)
      const { snapshot } = body
      const seq = Number(snapshot)
      if (!Number.isSafeInteger(seq) || seq < 0) {
        sendJson(res, 400, { ok: false, error: 'rollback 需要合法的 snapshot 序号' })
        return
      }
      writeSnapshot(project, `回退到快照 ${seq} 之前`)
      const event = restoreSnapshot(project, seq)
      const rbMeta = readMeta(project)
      // 回退后清掉交办标记，让状态机根据账本重新推导（文件产物保留，由验货逻辑复用）。
      delete rbMeta.pendingStage
      delete rbMeta.pendingGate
      delete rbMeta.wakeToken
      rbMeta.status = 'running'
      writeMeta(rbMeta)
      void kick(ctx, project)
      sendJson(res, 200, { ok: true, project, event })
      return
    }
  }
}

/** 动作族 · 金标准：'gold-opinion' / 'gold-opinion-revoke' / 'gold-revise' / 'gold-chapter-set' / 'gold-approve'。 */
async function actGold(ctx, req, res, action, sessionId, project, body) {
  switch (action) {
    case 'gold-opinion': {
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      // F39（2026-08-20 走查）：全章过目段级三键——带 chapter 的段落意见落 pendingReviews
      // （chapter 维度），修订回路与整章意见相同（过目态→转 running→交办修订→改完回过目卡）。
      // 只对真实模式生效（meta.demo !== true）；不带 chapter 保持原有 goldOpinions 链路不变。
      const chapters = meta?.outline?.chapters ?? []
      const chapter = Number.isSafeInteger(body.chapter) && body.chapter >= 1 ? Number(body.chapter) : null
      if (meta.demo !== true && meta.phase === 5 && chapter !== null && chapter <= chapters.length) {
        const kind = ['dislike', 'drop', 'change'].includes(body.kind) ? body.kind : null
        const wish = typeof body.wish === 'string' ? body.wish.trim().slice(0, 300) : ''
        if (kind === null || (kind === 'change' && wish === '')) {
          sendJson(res, 400, { ok: false, error: '意见需要类型；「要改成」必须补一句话（不喜欢/不需要可以只点一下）' })
          return
        }
        const target = Number.isSafeInteger(body.para) || typeof body.hint === 'string'
          ? { para: Number.isSafeInteger(body.para) ? body.para : null, hint: typeof body.hint === 'string' ? body.hint.slice(0, 60) : '' }
          : null
        const opinion = {
          id: `pr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          at: Date.now(), chapter, target, kind, wish, status: 'pending',
        }
        const reviews = Array.isArray(meta.pendingReviews) ? meta.pendingReviews : []
        reviews.push(opinion)
        meta.pendingReviews = reviews
        meta.updatedAt = Date.now()
        // 过目态下提段落意见：与整章意见同路径——先取原状态再落盘，转 running 交办修订（改完回来继续过目）。
        const inChaptersReview = meta.status === 'awaiting-chapters-review'
        meta.status = 'running'
        if (inChaptersReview) {
          meta.pendingStage = null
          meta.chaptersReviewed = false
        }
        writeMeta(meta)
        const title = chapters[chapter - 1]?.title ?? `第${chapter}章`
        appendEvent(project, 'textbook/review', { chapter, title, comment: paragraphReviewText(opinion), para: target?.para ?? null })
        if (inChaptersReview) {
          handoff(ctx, project, 'chapters')
        } else {
          // 机器空闲或正在铺章：唤醒/让主 AI 接着处理意见（交工前必查意见）。
          const pending = meta.pendingStage
          if (pending === null || pending === undefined || pending === 'chapters') {
            if (pending === null || pending === undefined) handoff(ctx, project, 'chapters')
          }
        }
        sendJson(res, 200, { ok: true, project, chapter, opinion, queued: true })
        return
      }
      const inGold = meta.status === 'awaiting-gold' || meta.pendingStage === 'gold'
      if (!inGold) { sendJson(res, 409, { ok: false, error: '现在不在最佳范例章确认环节' }); return }
      const kind = ['dislike', 'drop', 'change'].includes(body.kind) ? body.kind : null
      const wish = typeof body.wish === 'string' ? body.wish.trim().slice(0, 300) : ''
      if (kind === null || (kind === 'change' && wish === '')) {
        sendJson(res, 400, { ok: false, error: '意见需要类型；「要改成」必须补一句话（不喜欢/不需要可以只点一下）' })
        return
      }
      const target = Number.isSafeInteger(body.para) || typeof body.hint === 'string'
        ? { para: Number.isSafeInteger(body.para) ? body.para : null, hint: typeof body.hint === 'string' ? body.hint.slice(0, 60) : '' }
        : null
      const opinion = {
        id: `go-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        at: Date.now(), target, kind, wish, status: 'pending',
      }
      meta.goldOpinions = [...(meta.goldOpinions ?? []), opinion]
      meta.updatedAt = Date.now()
      writeMeta(meta)
      appendEvent(project, 'textbook/gold-opinion', {
        seq: meta.goldOpinions.filter((o) => o.status !== 'revoked').length,
        opinion: { ...opinion, target: target === null ? '笼统' : (target.hint || `第${target.para}段`) },
      })
      sendJson(res, 200, { ok: true, project, opinion })
      return
    }
    case 'gold-opinion-revoke': {
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      // F39：段落级意见记在 pendingReviews（chapter 维度），撤销时两处都找。
      const target = (meta.goldOpinions ?? []).find((o) => o.id === body.id)
        ?? (meta.pendingReviews ?? []).find((r) => r.id === body.id)
      if (target === undefined) { sendJson(res, 404, { ok: false, error: '没有这条意见' }); return }
      target.status = 'revoked'
      writeMeta(meta)
      sendJson(res, 200, { ok: true, project })
      return
    }
    case 'gold-revise': {
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      if (meta === null || meta.status !== 'awaiting-gold') {
        sendJson(res, 409, { ok: false, error: '当前没有等待确认的最佳范例章' })
        return
      }
      const pending = (meta.goldOpinions ?? []).filter((o) => o.status === 'pending')
      // 本轮交办的意见转「AI 修订中」；新稿交工时再转「AI 已改」。
      pending.forEach((o) => { o.status = 'sent' })
      const archive = join(workDir(project), '_旧版产物')
      mkdirSync(archive, { recursive: true })
      const stamp = Date.now().toString(36)
      const gn = goldN(meta)
      for (const name of [`chapter-${String(gn).padStart(2, '0')}.md`, 'style-spec.md', `audit-${String(gn).padStart(2, '0')}.md`]) {
        const target = workFile(project, name)
        if (existsSync(target)) { try { renameSync(target, join(archive, `${name}.${stamp}`)) } catch { /* 尽力归档 */ } }
      }
      meta.goldRedoNote = pending.length > 0
        ? pending.map((o, i) => `#${i + 1}（${o.target === null ? '笼统' : o.target.hint || `第${o.target.para}段`}）${o.kind === 'dislike' ? '不喜欢' : o.kind === 'drop' ? '不需要' : '要改成'}${o.wish ? `：${o.wish}` : ''}`).join('；')
        : (typeof body.note === 'string' && body.note.trim() !== '' ? body.note.trim().slice(0, 500) : null)
      meta.status = 'running'
      meta.pendingStage = null
      meta.pendingGate = null
      writeMeta(meta)
      appendEvent(project, 'textbook/hint', { text: '✍️ 已把你的意见带给 AI，它正在照着修订最佳范例章，改完再请你过目。' })
      handoff(ctx, project, 'gold')
      // 演示书不唤醒主 AI（wakeMainAI 对 demo 直接跳过）：直接驱动状态机，
      // 由演示占位通道自己重生成范例章，否则永远停在「AI 修订中」。
      if (meta.demo === true) void kick(ctx, project)
      sendJson(res, 200, { ok: true, project, redoNote: meta.goldRedoNote })
      return
    }
    case 'gold-chapter-set': {
      // 对话/界面改选样例章：未定稿且未进入铺章前可改；旧样例章产物存在则先归档再重交办。
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      const pick = Number(body.chapter)
      if (!Number.isSafeInteger(pick) || pick < 1 || pick > (meta?.outline?.chapters ?? []).length) {
        sendJson(res, 400, { ok: false, error: '章号不合法' })
        return
      }
      if (meta.goldSealed != null || meta.phase >= 5) {
        sendJson(res, 409, { ok: false, error: '范例章已定稿/铺章已开始；要换样例章请先驳回重做范例章' })
        return
      }
      // 控制器裁决（F10）：gold 修订在飞（pendingStage=gold）时允许改选样例章——AI 交工后自然写新章；
      // 其余 AI 回合进行中一律拦住，避免打断它手里的活。
      if (meta.status === 'running' && meta.pendingStage !== 'gold') {
        sendJson(res, 409, { ok: false, error: 'AI 正在干活；等它交工或先暂停，再改样例章' })
        return
      }
      const gn = goldN(meta)
      meta.goldChapter = pick
      const archive = join(workDir(project), '_旧版产物')
      mkdirSync(archive, { recursive: true })
      const stamp = Date.now().toString(36)
      let archived = 0
      for (const name of [`chapter-${String(gn).padStart(2, '0')}.md`, 'style-spec.md', `audit-${String(gn).padStart(2, '0')}.md`]) {
        const target = workFile(project, name)
        if (existsSync(target)) { try { renameSync(target, join(archive, `${name}.${stamp}`)); archived += 1 } catch { /* 尽力归档 */ } }
      }
      meta.status = 'running'
      meta.pendingStage = null
      meta.pendingGate = null
      writeMeta(meta)
      appendEvent(project, 'textbook/gold-chapter', { chapter: pick, reason: String(body.reason ?? '').slice(0, 200), archived })
      appendEvent(project, 'textbook/hint', { text: `📐 样例章改为第 ${pick} 章${archived > 0 ? '（旧范例章已留档，正在重写新范例章）' : ''}。` })
      if (archived > 0 || meta.phase >= 4) handoff(ctx, project, 'gold')
      else void kick(ctx, project)
      // 演示书不唤醒主 AI（wakeMainAI 对 demo 直接跳过）：直接驱动状态机，
      // 由演示占位通道自己重生成新样例章，否则永远停在「AI 修订中」。
      if (meta.demo === true) void kick(ctx, project)
      sendJson(res, 200, { ok: true, project, goldChapter: pick })
      return
    }
    case 'gold-approve': {
      // 最佳范例章确认：true → 继续写全书；false → 删掉重写。可同时设置每章目标字数。
      assertSessionOwned(project, sessionId)
      const { approved } = body
      if (typeof approved !== 'boolean') {
        sendJson(res, 400, { ok: false, error: 'gold-approve 需要 approved: true/false' })
        return
      }
      const goldMeta = readMeta(project)
      if (goldMeta === null || goldMeta.status !== 'awaiting-gold') {
        sendJson(res, 409, { ok: false, error: '当前没有等待确认的最佳范例章' })
        return
      }
      if (typeof body.targetWords === 'number' && Number.isFinite(body.targetWords) && body.targetWords >= 500) {
        goldMeta.targetWords = Math.round(body.targetWords) // 兼容旧单值：仅作未填章的兜底
        // 意见为空时上面 approved 路径不会 writeMeta，兜底值会随 advance 重读丢失，这里先落账。
        writeMeta(goldMeta)
        appendEvent(project, 'textbook/hint', { text: '字数以每章清单为准；这个统一值只作未填章的兜底。' })
      }
      if (approved === true) {
        // 定稿沉淀：把尚未撤销的意见转成风格线（source:'gold'），并记金标准母版版本号。
        const sealOpinions = (goldMeta.goldOpinions ?? []).filter((o) => o.status !== 'revoked')
        if (sealOpinions.length > 0) {
          const sealed = []
          sealOpinions.forEach((o, i) => {
            const kindText = o.kind === 'dislike' ? '不要这种写法' : o.kind === 'drop' ? '不要这类内容' : '要照此修改'
            const entry = {
              id: `sn-gold-${Date.now().toString(36)}-${i}`,
              text: `${o.target === null ? '' : `${o.target.hint || `第${o.target.para}段`}：`}${kindText}--${o.wish}`,
              at: Date.now(), source: 'gold', status: 'active', note: `来自金标准意见#${i + 1}`,
            }
            o.status = 'applied'
            sealed.push(entry)
          })
          goldMeta.styleNotes = [...(goldMeta.styleNotes ?? []), ...sealed]
          const goldVersions = readEvents(project).filter((e) => e.type === 'textbook/agent-end' && String(e.data?.label ?? '').includes('最佳范例章')).length
          goldMeta.goldSealed = { version: Math.max(1, goldVersions), at: Date.now() }
          writeMeta(goldMeta)
          updateStyleLineMirror(project)
          appendEvent(project, 'textbook/gold-seal', { version: goldMeta.goldSealed.version, count: sealed.length })
        }
        appendEvent(project, 'textbook/hint', { text: '✅ 范例章已确认，开始写全书。' })
        advance(project, 4, 5)
        void kick(ctx, project)
      } else {
        // 归档范例章产物（rmSync 在部分盘上失效，用移动代替删除）。
        const archive = join(workDir(project), '_旧版产物')
        mkdirSync(archive, { recursive: true })
        const stamp = Date.now().toString(36)
        const gN = goldN(goldMeta)
        for (const name of [`chapter-${String(gN).padStart(2, '0')}.md`, 'style-spec.md', `audit-${String(gN).padStart(2, '0')}.md`]) {
          const target = workFile(project, name)
          if (existsSync(target)) {
            try { renameSync(target, join(archive, `${name}.${stamp}`)) } catch { /* 尽力归档 */ }
          }
        }
        // 整版重写：明确告知 AI 这不是逐条修订，是推翻重来（意见保留为方向）。
        goldMeta.goldRedoNote = '整版重写：不参考上一稿的结构与表述，按学习目标与材料全新生成；用户意见仅作为方向参考。'
        appendEvent(project, 'textbook/hint', { text: '↩️ 范例章已标记重写，AI 正在重新生成。' })
        goldMeta.status = 'running'
        goldMeta.updatedAt = Date.now()
        writeMeta(goldMeta)
        void kick(ctx, project)
      }
      sendJson(res, 200, { ok: true, project, approved })
      return
    }
  }
}

/** 动作族 · 深改：'deep-modify' / 'deep-undo'。 */
async function actDeepModify(ctx, req, res, action, sessionId, project, body) {
  switch (action) {
    case 'deep-modify': {
      // 定点修改（深改）：归档该段及下游产物、截断账本到该段起点、注入重做意见、把待办指回被改段重跑下游。
      // 上游产物与风格线/豁免/留言原样保留；demo 不开放（demo 走旧全自动通道）。
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      if (meta === null) throw new Error(`unknown project ${JSON.stringify(project)}`)
      if (meta.demo === true) { sendJson(res, 409, { ok: false, error: '演示书不支持定点修改' }); return }
      if (meta.status === 'running' || meta.pendingStage != null) {
        sendJson(res, 409, { ok: false, error: 'AI 正在干活；要改历史请先等它交工（或先 ⏸ 暂停）' })
        return
      }
      const segKey = String(body.segment ?? '')
      const affected = deepAffected(project, meta, segKey)
      const note = String(body.note ?? '').trim().slice(0, 500)
      if (affected === null) { sendJson(res, 400, { ok: false, error: '不认识的历史段' }); return }
      if (note === '') { sendJson(res, 400, { ok: false, error: '写一句这次要改什么' }); return }
      // 1) 深改存档（meta+events+产物清单，独立目录，永不复用 seq 名）
      const id = `${Date.now().toString(36)}-${segKey}`
      const deepDir = join(projectDir(project), 'snapshots', 'deep')
      mkdirSync(deepDir, { recursive: true })
      const events = readEvents(project)
      writeFileSync(join(deepDir, `${id}.json`), JSON.stringify({
        id, segment: segKey, time: Date.now(), meta, events, archived: affected.files,
      }) + '\n')
      // 2) 选择性归档：该段及下游产物 -> _旧版产物/深改-<id>/（上游原地保留）
      const stampDir = join(workDir(project), '_旧版产物', `深改-${id}`)
      mkdirSync(stampDir, { recursive: true })
      let archived = 0
      for (const rel of affected.files) {
        const from = join(projectDir(project), rel)
        if (existsSync(from)) {
          try { renameSync(from, join(stampDir, rel.replace(/\//g, '__'))); archived += 1 } catch { /* 尽力归档 */ }
        }
      }
      // 3) 事件截断到该段起点（下游折叠状态从账本重推导）
      const startSeq = deepStartSeq(project, segKey)
      if (startSeq !== null) {
        const kept = events.filter((e) => e.seq < startSeq)
        writeFileSync(timelinePath(project), kept.map((e) => JSON.stringify(e)).join('\n') + (kept.length > 0 ? '\n' : ''))
        meta.eventCount = kept.length
      }
      // 4) 外科式 meta 重置 + 重做意见
      meta.deepRedoNote = { segment: segKey, note }
      meta.status = 'running'
      meta.pause = null
      switch (affected.reset) {
        case 'explore':
          delete meta.exploreConfirmed; delete meta.exploreRedoNote
          meta.phase = 2
          break
        case 'gate':
          meta.phase = 3
          // F37（2026-08-20 走查）：关卡一改，章节安排（outline）作为下游必须重做——
          // deepAffected 已归档 outline/gold 产物文件，但 meta.outline 不清会让 runPhase3
          // 跳过章节安排重做、下游（金标准章）沿用旧大纲。与 outline 分支同样清干净。
          delete meta.outline; delete meta.outlineRedoNote; delete meta.goldChapter; delete meta.goldChapterReason
          meta.goldSealed = null; meta.goldOpinions = []; delete meta.goldRedoNote
          break
        case 'outline':
          delete meta.outline; delete meta.outlineRedoNote; delete meta.goldChapter; delete meta.goldChapterReason
          // 章节骨架一改，金标准（范例章+写作规范）作为下游必须重做：清定稿与旧意见。
          meta.goldSealed = null; meta.goldOpinions = []; delete meta.goldRedoNote
          meta.phase = 3
          break
        case 'gold':
          meta.goldSealed = null; meta.goldOpinions = []; delete meta.goldRedoNote
          meta.phase = 4
          break
        case 'chapter':
          meta.chaptersReviewed = false
          meta.phase = 5
          break
        case 'merge':
          meta.phase = 5
          break
        case 'final':
          meta.phase = 6
          break
      }
      // 重跑落点：把待办直接指回被改段（不 kick——kick 会让状态机从账本重推导，
      // 遇到演示/旧账可能落错段，且 handoff 会追加 stage-start 事件、破坏下方
      // 10 分钟撤销的「账面无新进展」守卫）。等主 AI 领任务交工后再 kick 自然续跑。
      const redoTarget = {
        explore: ['explore', null], gate: ['gate', segKey.slice(5)], outline: ['outline', null],
        gold: ['gold', null], chapter: ['chapters', null], merge: ['merge', null], final: ['final', null],
      }[affected.reset] ?? [null, null]
      meta.pendingStage = redoTarget[0]
      meta.pendingGate = redoTarget[1]
      // 金标准产物被归档时一并清过目标记（章节变了要重新过目）
      if (affected.reset !== 'merge' && affected.reset !== 'final') meta.chaptersReviewed = false
      // F35（2026-08-20 走查）：被重做的章节（下游含 chapter-N 的段）清掉流水线阶段账本，
      // 重做时不再显示旧的执笔/审计阶段（章节没被重做的 merge/final 保留）。
      const redoChapters = (affected.downstream ?? [])
        .filter((k) => /^chapter-\d+$/.test(k))
        .map((k) => Number(k.slice(8)))
      if (redoChapters.length > 0) {
        const pipeline = Array.isArray(meta.chapterPipeline) ? meta.chapterPipeline.slice() : []
        for (const n of redoChapters) { if (pipeline[n - 1] !== undefined) pipeline[n - 1] = null }
        meta.chapterPipeline = pipeline
      }
      meta.updatedAt = Date.now()
      writeMeta(meta)
      appendEvent(project, 'textbook/deep-modify', { segment: segKey, note, archived })
      appendEvent(project, 'textbook/hint', {
        text: `✍️ 已按你的意见定点修改「${segKey}」：这一步和它后面的都会重做（旧版本全部留档；10 分钟内可一键撤销）。`,
      })
      // 深改落账完成后锚定撤销点。注意 appendEvent 每次从盘上重读并 +1，此刻盘上
      // 账高已是「深改前 + 2」（两条事件各 +1）——这正是撤销守卫要盯的高度，直接用它，
      // 且必须重新读盘再写，否则本地旧对象会把 appendEvent 刚推进的账高覆盖回去。
      const anchored = readMeta(project)
      anchored.lastDeepModify = { id, segment: segKey, at: Date.now(), eventCountAfter: (anchored.eventCount ?? 0) }
      writeMeta(anchored)
      // 唤醒主 AI 领重做任务（真实模式；不 kick 以免立刻追加 stage-start 事件）。
      if (meta.demo !== true) {
        try { wakeMainAI(ctx, project) } catch { /* 唤醒失败不阻塞深改 */ }
      }
      sendJson(res, 200, { ok: true, project, segment: segKey, archived })
      return
    }
    case 'deep-undo': {
      // 一键撤销最近一次深改（10 分钟内且账面无新进展）。
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      const last = meta?.lastDeepModify
      if (last == null || Date.now() - last.at > 10 * 60 * 1000) {
        sendJson(res, 409, { ok: false, error: '没有 10 分钟内的深改可撤销' })
        return
      }
      if ((meta.eventCount ?? 0) !== last.eventCountAfter) {
        sendJson(res, 409, { ok: false, error: '深改后账面已有新进展，撤销会丢失它们；如确要撤销请回退快照' })
        return
      }
      const file = join(projectDir(project), 'snapshots', 'deep', `${last.id}.json`)
      if (!existsSync(file)) { sendJson(res, 404, { ok: false, error: '深改存档文件缺失' }); return }
      const archive = JSON.parse(readFileSync(file, 'utf8'))
      // 产物回移
      const stampDir = join(workDir(project), '_旧版产物', `深改-${last.id}`)
      for (const rel of archive.archived ?? []) {
        const back = join(stampDir, rel.replace(/\//g, '__'))
        const to = join(projectDir(project), rel)
        if (existsSync(back)) {
          mkdirSync(dirname(to), { recursive: true })
          try { renameSync(back, to) } catch { /* 尽力回移 */ }
        }
      }
      // meta + events 整体复原（守卫已确保期间无新账）
      writeFileSync(timelinePath(project), (archive.events ?? []).map((e) => JSON.stringify(e)).join('\n') + '\n')
      const restored = { ...archive.meta }
      restored.updatedAt = Date.now()
      delete restored.lastDeepModify
      delete restored.deepRedoNote
      writeMeta(restored)
      appendEvent(project, 'textbook/deep-undo', { segment: archive.segment })
      sendJson(res, 200, { ok: true, project })
      return
    }
  }
}

/** 动作族 · 协作信号：'style-note' / 'style-note-revoke' / 'intervene' / 'intervene-done' / 'waive' / 'waive-revoke' / 'pause'。 */
async function actCollabSignals(ctx, req, res, action, sessionId, project, body) {
  switch (action) {
    case 'style-note': {
      assertSessionOwned(project, sessionId)
      const text = typeof body.text === 'string' ? body.text.trim().slice(0, 300) : ''
      if (text === '') { sendJson(res, 400, { ok: false, error: '请写下你的风格意见' }); return }
      const source = ['wizard', 'ui', 'chat'].includes(body.source) ? body.source : 'ui'
      const meta = readMeta(project)
      const styleNote = { id: `sn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, text, at: Date.now(), source, status: 'active' }
      meta.styleNotes = [...(meta.styleNotes ?? []), styleNote]
      meta.updatedAt = Date.now()
      writeMeta(meta)
      updateStyleLineMirror(project)
      appendEvent(project, 'textbook/style-note', { styleNote })
      sendJson(res, 200, { ok: true, project, styleNote })
      return
    }
    case 'style-note-revoke': {
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      const target = (meta.styleNotes ?? []).find((n) => n.id === body.id)
      if (target === undefined) { sendJson(res, 404, { ok: false, error: '没有这条风格意见' }); return }
      target.status = 'superseded'
      target.note = '用户收回'
      writeMeta(meta)
      updateStyleLineMirror(project)
      appendEvent(project, 'textbook/style-note', { styleNote: target, revoked: true })
      sendJson(res, 200, { ok: true, project, styleNote: target })
      return
    }
    case 'intervene': {
      assertSessionOwned(project, sessionId)
      const text = typeof body.text === 'string' ? body.text.trim().slice(0, 500) : ''
      if (text === '') { sendJson(res, 400, { ok: false, error: '请写下想留言的内容' }); return }
      const meta = readMeta(project)
      const intervention = {
        id: `iv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        at: Date.now(), text,
        target: typeof body.target === 'string' ? body.target.slice(0, 60) : undefined,
        status: 'pending',
      }
      meta.pendingInterventions = [...(meta.pendingInterventions ?? []), intervention]
      meta.updatedAt = Date.now()
      writeMeta(meta)
      appendEvent(project, 'textbook/intervention', { text: intervention.text, target: intervention.target })
      sendJson(res, 200, { ok: true, project, intervention })
      return
    }
    case 'intervene-done': {
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      const target = (meta.pendingInterventions ?? []).find((i) => i.id === body.id)
      if (target === undefined) { sendJson(res, 404, { ok: false, error: '没有这条留言' }); return }
      target.status = 'done'
      writeMeta(meta)
      appendEvent(project, 'textbook/intervention-done', { text: target.text })
      sendJson(res, 200, { ok: true, project })
      return
    }
    case 'waive': {
      assertSessionOwned(project, sessionId)
      const item = typeof body.item === 'string' ? body.item : ''
      if (WAIVER_ITEMS[item] === undefined) { sendJson(res, 400, { ok: false, error: '未知的豁免项' }); return }
      const userNote = typeof body.userNote === 'string' ? body.userNote.trim().slice(0, 300) : ''
      if (userNote === '') { sendJson(res, 400, { ok: false, error: '豁免必须手输原因（界面「特殊要求」面板），这是放行的必要条件' }); return }
      const meta = readMeta(project)
      const waiver = {
        id: `wv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        item, reason: WAIVER_ITEMS[item].label, risk: WAIVER_ITEMS[item].risk, userNote,
        source: body.source === 'chat' ? 'chat' : 'ui', at: Date.now(),
      }
      meta.waivers = [...(meta.waivers ?? []), waiver]
      meta.updatedAt = Date.now()
      writeMeta(meta)
      appendEvent(project, 'textbook/waiver', { item, userNote })
      sendJson(res, 200, { ok: true, project, waiver })
      return
    }
    case 'waive-revoke': {
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      const idx = (meta.waivers ?? []).findIndex((w) => w.id === body.id)
      if (idx === -1) { sendJson(res, 404, { ok: false, error: '没有这条豁免' }); return }
      const [removed] = meta.waivers.splice(idx, 1)
      writeMeta(meta)
      appendEvent(project, 'textbook/waiver-revoke', { item: removed.item })
      sendJson(res, 200, { ok: true, project })
      return
    }
    case 'pause': {
      // 强制中断：记账 pause → 事件 → 取消主 AI（keepInbox）→ 逐个中断子代理；绝不 followup。
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      meta.pause = { at: Date.now(), reason: typeof body.reason === 'string' ? body.reason.slice(0, 200) : '用户在造书工作台点击强制中断' }
      meta.updatedAt = Date.now()
      writeMeta(meta)
      appendEvent(project, 'textbook/pause', { reason: meta.pause.reason, pendingStage: meta.pendingStage ?? null })
      try {
        ctx?.agents?.get?.(sessionId)?.cancel?.(
          { kind: 'hook', reason: meta.pause.reason },
          { keepInbox: true },
        )
      } catch (e) { ctx?.logger?.warn?.(`textbook: 暂停取消主 AI 失败: ${String(e instanceof Error ? e.message : e)}`) }
      // 子代理：中止当前回合（不 dispose、不重排队）；绝不 followup（中断即静默，恢复时 handoff 再带上下文）。
      // 注意：await 等子代理中断收敛完成后再回包（界面此时才显示「已暂停」，测试也依赖顺序）。
      try {
        const children = await ctx?.subagents?.listDescendants?.(sessionId) ?? []
        for (const child of children) {
          try { ctx.subagents.interrupt(child.childId, { kind: 'user', parentSessionId: sessionId }) }
          catch {
            try { ctx.subagents.interrupt(child.childId, { kind: 'ancestor', agent: ctx.agents.get(sessionId) }) }
            catch (e2) { ctx?.logger?.warn?.(`textbook: 中断子代理失败: ${String(e2 instanceof Error ? e2.message : e2)}`) }
          }
        }
      } catch (e) { ctx?.logger?.warn?.(`textbook: 枚举子代理失败: ${String(e instanceof Error ? e.message : e)}`) }
      sendJson(res, 200, { ok: true, project, pause: meta.pause })
      return
    }
  }
}

/** 动作族 · 章节执行与审阅：'review' / 'stage-submit' / 'stage-brief' / 'progress'。 */
async function actChapters(ctx, req, res, action, sessionId, project, body) {
  switch (action) {
    case 'review': {
      // 用户抽查提意见（铺章阶段）：记录 → 主 AI 处理。
      assertSessionOwned(project, sessionId)
      const rvMeta = readMeta(project)
      if (rvMeta === null) throw new Error(`unknown project ${JSON.stringify(project)}`)
      const n = Number(body.chapter)
      const chapters = rvMeta.outline?.chapters ?? []
      const comment = typeof body.comment === 'string' ? body.comment.trim() : ''
      if (!Number.isSafeInteger(n) || n < 1 || n > chapters.length) {
        sendJson(res, 400, { ok: false, error: '章节号不合法' })
        return
      }
      if (comment === '') {
        sendJson(res, 400, { ok: false, error: '请写下你的意见' })
        return
      }
      if (rvMeta.phase !== 5) {
        sendJson(res, 409, { ok: false, error: '现在不在铺章阶段，没法直接在章节卡写意见；可以在对话里告诉 AI，它会帮你安排' })
        return
      }
      const reviews = Array.isArray(rvMeta.pendingReviews) ? rvMeta.pendingReviews : []
      reviews.push({ chapter: n, comment, at: Date.now() })
      rvMeta.pendingReviews = reviews
      // 过目态下提意见：转回 running 并交办修订（改完回来继续过目）。
      // 注意：要先取原状态再落盘，否则 writeMeta 会把 handoff 写好的 pendingStage 覆盖回 null。
      const inChaptersReview = rvMeta.status === 'awaiting-chapters-review'
      rvMeta.status = 'running'
      if (inChaptersReview) {
        rvMeta.pendingStage = null
        rvMeta.chaptersReviewed = false
      }
      writeMeta(rvMeta)
      const title = chapters[n - 1]?.title ?? `第${n}章`
      appendEvent(project, 'textbook/review', { chapter: n, title, comment })
      if (inChaptersReview) {
        handoff(ctx, project, 'chapters')
      } else {
        const pending = rvMeta.pendingStage
        if (pending === null || pending === undefined || pending === 'chapters') {
          // 机器空闲或正在铺章：唤醒/让主 AI 接着处理意见（交工前必查意见）。
          if (pending === null || pending === undefined) handoff(ctx, project, 'chapters')
        }
      }
      // 若正在合并/终检：不打断；主 AI 交工前会查 workbench_status 里的抽查意见并先处理。
      sendJson(res, 200, { ok: true, project, chapter: n, queued: true })
      return
    }
    case 'stage-submit': {
      // 主 AI 交工：逐阶段验货，验过才放行（AI 说做了不算，机器验过才算）。
      assertSessionOwned(project, sessionId)
      const subMeta = readMeta(project)
      if (subMeta === null) throw new Error(`unknown project ${JSON.stringify(project)}`)
      if (subMeta.pause !== null && subMeta.pause !== undefined) {
        sendJson(res, 409, { ok: false, error: '已在暂停，请先点继续（▶）再交工' })
        return
      }
      const stage = String(body.stage ?? '')
      if (subMeta.pendingStage !== stage) {
        sendJson(res, 409, {
          ok: false,
          error: `机器现在等的是「${stageLabel(subMeta.pendingStage, subMeta.pendingGate ?? null) ?? '无'}」，不是「${stage}」`,
        })
        return
      }
      switch (stage) {
        case 'explore': {
          const explorePath = workFile(project, 'explore.md')
          if (!existsSync(explorePath) || readFileSync(explorePath, 'utf8').trim() === '') {
            sendJson(res, 400, { ok: false, error: 'work/explore.md 不存在或为空，请先写好探查报告再交工' })
            return
          }
          let km = null
          try { km = JSON.parse(readFileSync(workFile(project, 'knowledge-map.json'), 'utf8')) } catch { km = null }
          if (km === null || typeof km !== 'object' || !Array.isArray(km.knowledgePoints) || km.knowledgePoints.length === 0
            || !Array.isArray(km.chapterSuggestion) || km.chapterSuggestion.length === 0) {
            sendJson(res, 400, { ok: false, error: 'work/knowledge-map.json 缺失或格式不对（需要非空的 knowledgePoints 与 chapterSuggestion）' })
            return
          }
          subMeta.pendingStage = null
          subMeta.pendingGate = null
          subMeta.status = 'awaiting-explore'
          delete subMeta.exploreRedoNote // 重做意见只对本轮探查生效
          writeMeta(subMeta)
          appendEvent(project, 'textbook/agent-end', { label: '源探查', outcome: 'ok' })
          appendEvent(project, 'textbook/hint', {
            text: '🔍 源探查做完了，请在工作台查看：满意点「✅ 满意，继续设计」，不满意点「🔁 让 AI 重做」。',
          })
          sendJson(res, 200, { ok: true, project, stage: 'explore' })
          return
        }
        case 'gate': {
          const gate = subMeta.pendingGate ?? '1'
          const title = typeof body.title === 'string' ? body.title.trim() : ''
          const summary = typeof body.summary === 'string' ? body.summary.trim() : ''
          let detail = typeof body.detail === 'string' ? body.detail.trim() : ''
          if (title === '' || summary === '' || detail === '') {
            sendJson(res, 400, { ok: false, error: '方案不完整（需要 title 标题 / summary 人话摘要 / detail 完整方案）' })
            return
          }
          // 指针内联：AI 偶尔会把完整方案写进自选文件、detail 只留一句「见文件」。
          // 用户不该去文件夹翻文件——机器检测到指针样 detail 就把被指文件正文内联进来。
          const pointer = /(?:见|详见)[^。\n]{0,20}?((?:work\/)?proposal-[\w.-]+\.md)/.exec(detail)
          if (pointer !== null) {
            const rel = pointer[1].startsWith('work/') ? pointer[1] : `work/${pointer[1]}`
            const full = workFile(project, rel.replace(/^work\//, ''))
            if (existsSync(full)) {
              const fileText = readFileSync(full, 'utf8').trim()
              if (fileText !== '') detail = `${fileText}\n\n---\n（原摘要：${summary}）`
            }
          }
          const version = countProposals(project, gate) + 1
          subMeta.pendingStage = null
          subMeta.pendingGate = null
          writeMeta(subMeta)
          appendEvent(project, 'textbook/agent-end', {
            label: `设计提案·第${gate}关${version > 1 ? `·修订v${version}` : ''}`, outcome: 'ok',
          })
          if (version === 1) proposeGate(project, gate, title, summary, detail)
          else proposeRevision(project, gate, version, title, summary, detail)
          sendJson(res, 200, { ok: true, project, stage: 'gate', gate, version })
          return
        }
        case 'outline': {
          let chapters = Array.isArray(body.chapters) ? body.chapters : null
          if (chapters === null && typeof body.chaptersJson === 'string' && body.chaptersJson.trim() !== '') {
            try { chapters = JSON.parse(body.chaptersJson) } catch { chapters = null }
          }
          if (chapters === null || !Array.isArray(chapters) || chapters.length === 0) {
            sendJson(res, 400, { ok: false, error: '章节骨架不能为空（需要 chapters 数组或 chaptersJson JSON 字符串）' })
            return
          }
          const cleaned = []
          for (const chapter of chapters) {
            const title = String(chapter?.title ?? '').trim()
            if (title === '') { sendJson(res, 400, { ok: false, error: '章节缺少 title' }); return }
            cleaned.push({
              title,
              outline: String(chapter?.outline ?? ''),
              source: String(chapter?.source ?? ''),
              targetWords: Number.isFinite(Number(chapter?.targetWords)) && Number(chapter.targetWords) >= 500
                ? Math.round(Number(chapter.targetWords)) : 6000,
              points: Array.isArray(chapter?.points)
                ? chapter.points.map((pt) => String(pt ?? '').trim()).filter((pt) => pt !== '').slice(0, 20)
                : [],
              volumeReason: String(chapter?.volumeReason ?? '').slice(0, 200),
            })
          }
          const goldN = Number(body.goldChapter)
          if (Number.isSafeInteger(goldN) && goldN >= 1 && goldN <= cleaned.length) {
            subMeta.goldChapter = goldN
            subMeta.goldChapterReason = String(body.goldChapterReason ?? '').slice(0, 200)
          } else {
            subMeta.goldChapter = 1
            subMeta.goldChapterReason = ''
          }
          subMeta.outline = { chapters: cleaned }
          subMeta.pendingStage = null
          subMeta.pendingGate = null
          writeMeta(subMeta)
          writeWork(project, 'outline.md', JSON.stringify({ chapters: cleaned }, null, 2))
          appendEvent(project, 'textbook/agent-end', { label: '整理章节骨架', outcome: 'ok' })
          if (waived(project, 'outline-skip')) {
            advance(project, 3, 4)
            void kick(ctx, project)
          } else {
            subMeta.status = 'awaiting-outline'
            writeMeta(subMeta)
            appendEvent(project, 'textbook/hint', {
              text: '📐 章节安排出来了，请在工作台查看：满意点「✅ 通过」，不满意点「🔁 提改进方向」让 AI 修订。',
            })
          }
          sendJson(res, 200, { ok: true, project, stage: 'outline', chapters: cleaned.length })
          return
        }
        case 'gold': {
          const gN = goldN(subMeta)
          const missing = [`chapter-${String(gN).padStart(2, '0')}.md`, 'style-spec.md', `audit-${String(gN).padStart(2, '0')}.md`].filter((name) => {
            const target = workFile(project, name)
            return !existsSync(target) || readFileSync(target, 'utf8').trim() === ''
          })
          if (missing.length > 0) {
            sendJson(res, 400, { ok: false, error: `范例章文件缺失或为空：${missing.join('、')}` })
            return
          }
          // style-spec 节标题软验（真实模式）：写作规范十问契约要求节标题齐全，缺了就拦下让 AI 补全。
          // demo 模式的占位 style-spec 没有节标题，不拦。
          if (subMeta.demo !== true) {
            const spec = readFileSync(workFile(project, 'style-spec.md'), 'utf8')
            const missingSections = ['模式选型', '板块语法', '深度四维承诺'].filter((h) => !spec.includes(h))
            if (missingSections.length > 0) {
              sendJson(res, 400, { ok: false, error: `style-spec 缺节标题：${missingSections.join('、')}（写作规范十问契约见任务说明）` })
              return
            }
          }
          // 干净审计（真实模式）：范例章交工前 audit 必须带机器可逐条核对的文档矩阵（必读清单逐份摘录原文）。
          if (subMeta.demo !== true) {
            try {
              const audit = JSON.parse(readFileSync(workFile(project, `audit-${String(goldN(subMeta)).padStart(2, '0')}.md`), 'utf8'))
              const required = ['work/explore.md', 'work/knowledge-map.json', 'work/outline.md', 'work/style-spec.md', `work/chapter-${String(goldN(subMeta)).padStart(2, '0')}.md`]
              const matrix = Array.isArray(audit.matrix) ? audit.matrix : []
              if (matrix.length === 0) { sendJson(res, 400, { ok: false, error: 'audit 缺文档矩阵（matrix）：审计小助手须逐份必读文件摘录一行原文' }); return }
              for (const rel of required) {
                const row = matrix.find((m) => m.file === rel)
                if (row === undefined) { sendJson(res, 400, { ok: false, error: `audit.matrix 缺必读文件：${rel}` }); return }
                const text = readFileSync(join(projectDir(project), rel), 'utf8')
                if (typeof row.quote !== 'string' || !text.includes(row.quote)) {
                  sendJson(res, 400, { ok: false, error: `audit.matrix 摘录对不上：${rel}` }); return
                }
              }
            } catch (error) {
              sendJson(res, 400, { ok: false, error: `audit 文件不是合法 JSON 或缺 matrix：${String(error instanceof Error ? error.message : error)}` })
              return
            }
          }
          subMeta.pendingStage = null
          subMeta.pendingGate = null
          subMeta.status = 'awaiting-gold'
          delete subMeta.goldRedoNote // 重做意见只对本轮生效
          if (Array.isArray(subMeta.goldOpinions)) {
            for (const o of subMeta.goldOpinions) if (o.status === 'sent') o.status = 'applied'
          }
          writeMeta(subMeta)
          appendEvent(project, 'textbook/agent-end', { label: '最佳范例章', outcome: 'ok' })
          appendEvent(project, 'textbook/hint', {
            text: '📖 最佳范例章写好了，请在工作台查看：满意点「✅ 满意，继续写全书」，不满意点「❌ 重写」。',
          })
          sendJson(res, 200, { ok: true, project, stage: 'gold' })
          return
        }
        case 'chapters': {
          const chapters = subMeta.outline?.chapters ?? []
          const n = Number(body.chapter)
          if (!Number.isSafeInteger(n) || n < 1 || n > chapters.length) {
            sendJson(res, 400, { ok: false, error: 'chapter 参数不合法（需要第几章的编号）' })
            return
          }
          const { chapterPath, auditPath } = chapterArtifacts(project, n)
          if (!existsSync(chapterPath) || readFileSync(chapterPath, 'utf8').trim() === '') {
            sendJson(res, 400, { ok: false, error: `第${n}章正文缺失或为空：work/chapter-${String(n).padStart(2, '0')}.md` })
            return
          }
          if (!existsSync(auditPath)) {
            sendJson(res, 400, { ok: false, error: `第${n}章缺少自查记录：work/audit-${String(n).padStart(2, '0')}.md` })
            return
          }
          const title = chapters[n - 1]?.title ?? `第${n}章`
          appendEvent(project, 'textbook/agent-end', { label: `第${n}章《${title}》完成（小助手执笔 + AI 终审）`, outcome: 'ok' })
          subMeta.updatedAt = Date.now()
          writeMeta(subMeta)
          const allDone = chapters.every((chapter, index) => chapterDone(project, index + 1))
          if (allDone) {
            subMeta.pendingStage = null
            subMeta.pendingGate = null
            writeMeta(subMeta)
            // 全章交齐：不直接交办合并，kick 让 runPhase5 先裁决过目闸门（F18）。
            void kick(ctx, project)
          }
          // 还有章节：pendingStage 保持 'chapters'（主 AI 在同一回合里继续，不重复唤醒）。
          sendJson(res, 200, { ok: true, project, stage: 'chapters', chapter: n, allDone })
          return
        }
        case 'merge': {
          // 过目闸门硬校验：章节还在等人过目时不许合并（F18；demo 书不会进入此态，不拦 demo）。
          if (subMeta.status === 'awaiting-chapters-review') {
            sendJson(res, 409, { ok: false, error: '章节还在等你过目：先在工作台完成全章过目（或先提意见让 AI 改），再合并。' })
            return
          }
          const preface = typeof body.preface === 'string' ? body.preface.trim() : ''
          if (preface === '') {
            sendJson(res, 400, { ok: false, error: '需要 preface（书的引言/使用说明文本）' })
            return
          }
          writeWork(project, 'preface.md', preface)
          const chapters = subMeta.outline?.chapters ?? []
          const parts = [`# ${subMeta.name ?? ''}`, '', preface, '']
          for (let index = 0; index < chapters.length; index += 1) {
            const { chapterPath } = chapterArtifacts(project, index + 1)
            const body2 = existsSync(chapterPath) ? readFileSync(chapterPath, 'utf8').trim() : ''
            const heading = `# 第${index + 1}章 ${chapters[index]?.title ?? ''}`
            // 章节正文若自带一级标题则去掉，避免与章标题重复。
            const stripped = body2.replace(/^#\s+.*$/m, '').trim()
            parts.push('', '---', '', heading, '', stripped)
          }
          // human 路线：成品顶部给 AI 老师留 loader 装配指令（正文 prose 当素材库用），保留在成品里。
          if (subMeta.route === 'human') {
            parts.splice(1, 0, '', '<!-- loader:begin -->', '给 AI 老师的 loader 指令：正文 prose 是素材库，用自己的话重组教学；章末教学区照问题链走。', '<!-- loader:end -->')
          }
          writeWork(project, 'book.md', parts.join('\n'))
          subMeta.pendingStage = null
          subMeta.pendingGate = null
          writeMeta(subMeta)
          appendEvent(project, 'textbook/agent-end', { label: '合并成书（机器拼装 + AI 前言）', outcome: 'ok' })
          advance(project, 5, 6)
          void kick(ctx, project)
          sendJson(res, 200, { ok: true, project, stage: 'merge' })
          return
        }
        case 'final': {
          const report = typeof body.report === 'string' ? body.report.trim() : ''
          if (report === '') {
            sendJson(res, 400, { ok: false, error: '需要 report（你的最后检查报告）' })
            return
          }
          // 终检门槛（真实模式）：留言必须先销号。
          if (subMeta.demo !== true) {
            const pendingIv = (subMeta.pendingInterventions ?? []).filter((i) => i.status === 'pending')
            if (pendingIv.length > 0) {
              sendJson(res, 409, {
                ok: false,
                error: `还有 ${pendingIv.length} 条用户留言没处理：${pendingIv.map((i) => i.text).join('；')}。先处理（intervene-done）再交工。`,
              })
              return
            }
          }
          // 进度账本硬验（真实模式）：交工前 work/progress.md 必须在（progress-skip 可豁免）。
          if (subMeta.demo !== true && !waived(project, 'progress-skip') && !existsSync(workFile(project, 'progress.md'))) {
            sendJson(res, 400, {
              ok: false,
              error: '缺 work/progress.md（进度账本）：每章一行（写完/审计/终审），是中途换人/重做的参照。不需要可先豁免「跳过进度账本检查」再交工。',
            })
            return
          }
          // styleCheck 处置契约（真实模式 + 存在 active 风格线时必交）。
          if (subMeta.demo !== true) {
            const active = (subMeta.styleNotes ?? []).filter((n) => n.status === 'active')
            const disposals = Array.isArray(body.styleCheck) ? body.styleCheck : []
            if (active.length > 0 || disposals.length > 0) {
              const byId = new Map(disposals.map((d) => [d.id, d]))
              const missing = active.filter((n) => !byId.has(n.id)).map((n) => n.text)
              if (missing.length > 0) {
                sendJson(res, 400, { ok: false, error: `这些风格意见没有处置：${missing.join('；')}。每条都要给出去向（落实在哪章 / 冲突理由 / 已收回）。` })
                return
              }
              for (const d of disposals) {
                if (!['adopted', 'conflict', 'superseded'].includes(d.status)) {
                  sendJson(res, 400, { ok: false, error: 'styleCheck 的 status 只能是 adopted / conflict / superseded' })
                  return
                }
                if (d.status === 'conflict' && (typeof d.note !== 'string' || d.note.trim() === '')) {
                  sendJson(res, 400, { ok: false, error: 'conflict（冲突）必须写一句理由，说明向用户确认过' })
                  return
                }
              }
              // 权威翻转：meta 状态只在这里改。
              for (const d of disposals) {
                const note = subMeta.styleNotes.find((n) => n.id === d.id)
                if (note === undefined) continue
                note.status = d.status
                note.note = typeof d.note === 'string' ? d.note.slice(0, 300) : (typeof d.chapter === 'string' ? `落实于${d.chapter}` : note.note)
              }
              updateStyleLineMirror(project)
            }
          }
          subMeta.finalReport = report
          subMeta.pendingStage = null
          subMeta.pendingGate = null
          writeMeta(subMeta)
          appendEvent(project, 'textbook/ai-report', { report })
          // 机器硬检查兜底：全过才交付，否则打回主 AI 修。
          const machineChecks = runQualityChecks(project)
          if (machineChecks.every((check) => check.ok === true)) {
            subMeta.status = 'delivered'
            writeMeta(subMeta)
            appendEvent(project, 'textbook/quality', { checks: machineChecks })
            appendEvent(project, 'textbook/agent-end', { label: '最后检查（AI 自查 + 机器兜底）', outcome: 'ok' })
            appendEvent(project, 'textbook/delivery', {
              book: 'work/book.md', checks: machineChecks,
              note: `交付完成！点「下载《${subMeta.name ?? ''}》.md」保存成品。`,
            })
            sendJson(res, 200, { ok: true, project, stage: 'final', delivered: true })
          } else {
            const issues = machineChecks.filter((check) => check.ok !== true)
              .map((check) => `${check.name}：${check.note ?? ''}`)
            appendEvent(project, 'textbook/error', {
              task: '最后检查',
              message: `机器兜底发现 ${issues.length} 项没过：${issues.join('；')}。请 AI 修复后重新交工。`,
            })
            subMeta.status = 'running'
            writeMeta(subMeta)
            // 不自动再唤醒：问题已随响应返回主 AI，它会在同一回合修复并重交；用户也可点重试。
            sendJson(res, 200, { ok: true, project, stage: 'final', delivered: false, issues: issues.map((text) => ({ text })) })
          }
          return
        }
        default:
          sendJson(res, 400, { ok: false, error: `未知交工阶段: ${stage}` })
          return
      }
    }
    case 'stage-brief': {
      // 主 AI 领任务：当前 pendingStage 的任务说明 + 方法论文本（全中文）。
      assertSessionOwned(project, sessionId)
      const brief = buildStageBrief(project)
      if (brief === null) {
        sendJson(res, 200, { ok: true, brief: null, message: '当前没有待办任务（机器没在等你）。' })
        return
      }
      sendJson(res, 200, { ok: true, brief })
      return
    }
    case 'progress': {
      // 主 AI 上报进度（工作台状态卡实时显示；不需要征求用户同意）。
      assertSessionOwned(project, sessionId)
      const progressMeta = readMeta(project)
      if (progressMeta !== null && progressMeta.pause !== null && progressMeta.pause !== undefined) {
        sendJson(res, 409, { ok: false, error: '已在暂停，请先点继续（▶）再上报进度' })
        return
      }
      const label = typeof body.label === 'string' ? body.label.slice(0, 60) : ''
      const detail = typeof body.detail === 'string' ? body.detail.slice(0, 300) : ''
      appendEvent(project, 'textbook/progress', { label, detail })
      const prMeta = readMeta(project)
      if (prMeta !== null) {
        // F35（2026-08-20 走查）：主 AI 上报章节流水线阶段（chapter+stage）→ 结构化账本
        // meta.chapterPipeline[n-1]={stage,updatedAt}；demo 豁免；旧账本 ?? [] 兜底。
        const chapterN = Number.isSafeInteger(body.chapter) && body.chapter >= 1 ? Number(body.chapter) : null
        const stage = ['writing', 'auditing', 'audited', 'finalizing', 'done'].includes(String(body.stage))
          ? String(body.stage)
          : null
        if (chapterN !== null && stage !== null && prMeta.demo !== true) {
          const pipeline = Array.isArray(prMeta.chapterPipeline) ? prMeta.chapterPipeline.slice() : []
          while (pipeline.length < chapterN) pipeline.push(null)
          pipeline[chapterN - 1] = { stage, updatedAt: Date.now() }
          prMeta.chapterPipeline = pipeline
        }
        prMeta.updatedAt = Date.now()
        writeMeta(prMeta)
      }
      // 上报进度后让状态机照账本重推导（幂等，runLoop 会在等待点停下）：
      // 铺章全写完的瞬间在这里停下等人过目（F18）；其它阶段照旧推进。
      void kick(ctx, project)
      sendJson(res, 200, { ok: true, project })
      return
    }
  }
}

/** 动作族 · 模式卡·运维：'suggest-words' / 'pattern-analyze' / 'pattern-list' / 'settings' / 'demo-run' / 'debug-spawn'。 */
async function actPatternsOps(ctx, req, res, action, sessionId, project, body) {
  switch (action) {
    case 'suggest-words': {
      // 每章目标字数建议（AI）：根据目标/路线/章节数；分章清单来自大纲（未定章 words=null，AI 铺章时自定）。
      assertSessionOwned(project, sessionId)
      const wordsMeta = readMeta(project)
      if (wordsMeta === null) {
        sendJson(res, 404, { ok: false, error: '项目不存在' })
        return
      }
      const goal = typeof body.goal === 'string' ? body.goal : wordsMeta.goal ?? ''
      const route = body.route === 'human' ? 'human' : wordsMeta.route ?? 'blueprint'
      const science = body.science === true || wordsMeta.science === true
      const chapterCount = Number(body.chapterCount) || (wordsMeta.outline?.chapters ?? []).length || 7
      const runtime = projectRuntime(ctx, project, wordsMeta)
      const perChapter = (wordsMeta.outline?.chapters ?? []).map((chapter, index) => ({
        n: index + 1, title: chapter.title ?? '',
        words: Number.isFinite(chapter.targetWords) ? chapter.targetWords : null,
        reason: chapter.volumeReason ?? '',
      }))
      try {
        const result = await generateContent(runtime, 'words', { goal, route, science, chapterCount })
        sendJson(res, 200, { ok: true, suggestion: { ...result, perChapter } })
      } catch (error) {
        sendJson(res, 200, {
          ok: true,
          fallback: true,
          suggestion: { suggested: 6000, range: '5000-7000', reason: '（AI 建议暂不可用，使用默认值）', perChapter },
        })
      }
      return
    }
    case 'pattern-analyze': {
      // 用户粘贴一段教学/结构描述 → AI 分析成「模式卡」→ 加入本书自定义模式库
      // （第 2 关模式选型与写作规范的 brief 会带上；demo 模式给占位卡，不动旧行为）。
      assertSessionOwned(project, sessionId)
      const patternMeta = readMeta(project)
      if (patternMeta === null) {
        sendJson(res, 404, { ok: false, error: '项目不存在' })
        return
      }
      const patternText = typeof body.text === 'string' ? body.text.trim() : ''
      if (patternText === '') {
        sendJson(res, 400, { ok: false, error: '请先粘贴要分析的文本' })
        return
      }
      const patternRuntime = projectRuntime(ctx, project, patternMeta)
      let card
      try {
        const result = await generateContent(patternRuntime, 'pattern', { text: patternText })
        card = result?.card
      } catch (error) {
        ctx.logger.warn(`textbook: 模式分析失败: ${String(error instanceof Error ? error.message : error)}`)
        card = null
      }
      if (card === null || typeof card !== 'object' || typeof card.name !== 'string' || card.name.trim() === '') {
        sendJson(res, 500, { ok: false, error: 'AI 没能从这段描述里分析出有效模式，请换一段更具体的描述再试' })
        return
      }
      const patternDir = customPatternsDir(project)
      const baseName = sanitizeFolderName(card.name.trim()) || '自定义模式'
      let cardFile = `${baseName}.md`
      let cardN = 2
      while (existsSync(join(patternDir, cardFile))) { cardFile = `${baseName}-${cardN}.md`; cardN += 1 }
      const cardBody = `# ${card.name}\n\n## 解决的教学问题\n${card.problem || '（未说明）'}\n\n## 什么时候用\n${card.when || '（未说明）'}\n\n## 在章节里怎么落地\n${card.blocks || '（未说明）'}\n\n> 由用户粘贴描述、AI 分析生成（${new Date().toLocaleString('zh-CN', { hour12: false })}）\n`
      writeFileSync(join(patternDir, cardFile), cardBody, 'utf8')
      const patternIndex = join(patternDir, 'README.md')
      if (!existsSync(patternIndex)) {
        writeFileSync(patternIndex, '# 本书自定义模式库\n\n> 用户粘贴文本、AI 分析生成的模式卡；写书时与内置模式库同等对待。\n', 'utf8')
      }
      appendFileSync(patternIndex, `\n- [${card.name}](${cardFile}) — ${card.problem || ''}\n`, 'utf8')
      appendEvent(project, 'textbook/pattern-added', { name: card.name, file: cardFile })
      ctx.logger.info(`textbook: 项目 ${project} 新增自定义模式「${card.name}」（${cardFile}）`)
      sendJson(res, 200, { ok: true, card, file: cardFile })
      return
    }
    case 'pattern-list': {
      // 本书自定义模式卡清单（工作台面板展示用）。
      assertSessionOwned(project, sessionId)
      const list = listCustomPatterns(project)
      sendJson(res, 200, { ok: true, patterns: list })
      return
    }
    case 'settings': {
      // 设置：MinerU Token 等
      const { mineruToken } = body
      const settings = readSettings()
      if (typeof mineruToken === 'string') {
        const trimmed = mineruToken.trim()
        if (trimmed === '') {
          // F42（2026-08-20）：空/空白 token 不覆盖已配置值（HTTP 直发曾把真实 token 清空）。
          sendJson(res, 400, { ok: false, error: 'MinerU Token 不能为空' })
          return
        }
        settings.mineruToken = trimmed
      }
      writeSettings(settings)
      sendJson(res, 200, { ok: true, settings: { mineruTokenSet: typeof settings.mineruToken === 'string' && settings.mineruToken !== '' } })
      return
    }
    case 'demo-run': {
      // 开发/演示：创建演示书并全流程跑一遍（demo 模式，产出明确标注）
      // 会话唯一书守卫：一个会话至多一本（和 book-create 同一套约束），
      // 防止界面入口在同会话连开两本演示书。
      if (listProjects(sessionId).length > 0) {
        sendJson(res, 409, { ok: false, error: '这个会话已经有一本书了：先完成它、删除它，或者新建一个会话再开演示书' })
        return
      }
      const id = `demo-${Date.now().toString(36)}`
      // 书夹位置：优先会话的工作区目录，文件夹名用演示书名；拿不到工作区就退回默认目录（与 book-create 一致）。
      const workspace = sessionWorkspace(ctx, sessionId) ?? projectsRoot()
      const dir = freeBookDir(workspace, sanitizeFolderName('演示书（示例流程）') || id)
      mkdirSync(dir, { recursive: true })
      registerProject(id, dir)
      const meta = {
        id, name: '演示书（示例流程）', goal: '学会基础运算，能独立做对配套练习',
        route: 'blueprint', science: false, demo: true, session: sessionId,
        folder: basename(dir),
        sources: [{ file: '示例教材.pdf', role: '学生用书', converted: true }],
        phase: 2, status: 'running',
        createdAt: Date.now(), updatedAt: Date.now(), eventCount: 0,
      }
      writeMeta(meta)
      appendEvent(id, 'textbook/phase-start', { phase: 1, label: PHASE_LABELS[1] })
      appendEvent(id, 'textbook/phase-end', { phase: 1, label: PHASE_LABELS[1] })
      appendEvent(id, 'textbook/phase-start', { phase: 2, label: PHASE_LABELS[2] })
      void kick(ctx, id)
      sendJson(res, 200, { ok: true, project: id, demo: true })
      return
    }
    case 'debug-spawn': {
      // 临时调试动作：最小子代理派发，返回完整结果（验证后移除）。
      const meta = readMeta(project)
      if (meta === null) throw new Error(`unknown project ${JSON.stringify(project)}`)
      const runtime = projectRuntime(ctx, project, meta)
      const parent = await getParent(ctx, project, meta)
      const captured = []
      const offError = ctx.on('agent/error', (info) => { captured.push(`agent/error: ${String(info?.error ?? info)}`) })
      const offRetry = ctx.on('llm/retry', (info) => { captured.push(`llm/retry: ${JSON.stringify(info).slice(0, 200)}`) })
      let result
      try {
        const run = await ctx.subagents.start('spawn', {
          label: '调试',
          prompt: [{ type: 'text', text: '请只回复两个字：收到' }],
          parent,
          signal: AbortSignal.timeout(120 * 1000),
        })
        result = await run.result
        await run.dispose()
      } finally {
        offError()
        offRetry()
      }
      sendJson(res, 200, {
        ok: true,
        stopReason: result.stopReason,
        output: result.output.map((block) => block.text ?? '').join('').slice(0, 300),
        captured,
      })
      return
    }
  }
}

/** action → 动作族 handler 映射表。 */
const ACTION_FAMILY_OF = new Map([
  ['book-create', actBooks],
  ['book-rename', actBooks],
  ['book-set-goal', actBooks],
  ['book-delete', actBooks],
  ['wizard-suggest', actWizard],
  ['suggest-roles', actWizard],
  ['convert-start', actConvert],
  ['retry-convert', actConvert],
  ['nudge', actConvert],
  ['resume', actConvert],
  ['gate-decide', actGates],
  ['explore-confirm', actGates],
  ['outline-confirm', actGates],
  ['chapters-review-confirm', actGates],
  ['rollback', actGates],
  ['gold-opinion', actGold],
  ['gold-opinion-revoke', actGold],
  ['gold-revise', actGold],
  ['gold-chapter-set', actGold],
  ['gold-approve', actGold],
  ['deep-modify', actDeepModify],
  ['deep-undo', actDeepModify],
  ['style-note', actCollabSignals],
  ['style-note-revoke', actCollabSignals],
  ['intervene', actCollabSignals],
  ['intervene-done', actCollabSignals],
  ['waive', actCollabSignals],
  ['waive-revoke', actCollabSignals],
  ['pause', actCollabSignals],
  ['review', actChapters],
  ['stage-submit', actChapters],
  ['stage-brief', actChapters],
  ['progress', actChapters],
  ['suggest-words', actPatternsOps],
  ['pattern-analyze', actPatternsOps],
  ['pattern-list', actPatternsOps],
  ['settings', actPatternsOps],
  ['demo-run', actPatternsOps],
  ['debug-spawn', actPatternsOps],
])

/** POST /textbook/action 动作分发 */
async function handleAction(ctx, req, res) {
  let body
  try {
    body = await readBody(req)
  } catch {
    sendJson(res, 400, { ok: false, error: '请求体不是合法 JSON' })
    return
  }
  const { action, project } = body
  const sessionId = sessionOf(body.session)
  if (typeof action !== 'string' || action === '') {
    sendJson(res, 400, { ok: false, error: '缺少 action' })
    return
  }
  try {
    // 未知动作与旧 default 同文案（对外接口零变化）。
    const family = ACTION_FAMILY_OF.get(action)
    if (family === undefined) {
      sendJson(res, 400, { ok: false, error: `未知动作: ${action}` })
      return
    }
    await family(ctx, req, res, action, sessionId, project, body)
  } catch (error) {
    ctx.logger.warn(`textbook: action ${action} failed: ${String(error)}`)
    sendJson(res, 500, { ok: false, error: String(error instanceof Error ? error.message : error) })
  }
}

function handleEvents(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const sessionId = sessionOf(url.searchParams.get('session'))
  const project = url.searchParams.get('project')
  if (project === null || !PROJECT_ID_RE.test(project)) {
    sendJson(res, 400, { ok: false, error: '缺少或非法的 project 参数' })
    return
  }
  const afterRaw = url.searchParams.get('after')
  const after = afterRaw === null || afterRaw === '' ? undefined : Number(afterRaw)
  if (after !== undefined && (!Number.isSafeInteger(after) || after < 0)) {
    sendJson(res, 400, { ok: false, error: '非法的 after 参数' })
    return
  }
  try {
    assertSessionOwned(project, sessionId)
    const meta = readMeta(project)
    if (meta === null) {
      sendJson(res, 404, { ok: false, error: '项目不存在' })
      return
    }
    const events = readEvents(project, after)
    // 章节状态：每章写好/自查好的徽章（UI 与 AI 都用）。
    const chapters = meta.outline?.chapters ?? []
    const chapterStatus = chapters.map((chapter, index) => {
      const n = index + 1
      const { chapterPath, auditPath } = chapterArtifacts(project, n)
      return {
        n, title: chapter.title ?? `第${n}章`,
        source: chapter.source ?? '', targetWords: chapter.targetWords ?? null,
        written: existsSync(chapterPath), audited: existsSync(auditPath),
      }
    })
    // 探查摘要（探查确认卡用）：材料份数/知识点数/建议章数。
    let exploreSummary = null
    try {
      const km = JSON.parse(readFileSync(workFile(project, 'knowledge-map.json'), 'utf8'))
      const converted = (meta.sources ?? []).filter((source) => source.converted === true).length
      exploreSummary = {
        sources: converted,
        knowledgePoints: Array.isArray(km.knowledgePoints) ? km.knowledgePoints.length : 0,
        chapterSuggestion: Array.isArray(km.chapterSuggestion) ? km.chapterSuggestion.length : 0,
        teachingFocus: Array.isArray(km.teachingFocus) ? km.teachingFocus.slice(0, 5) : [],
      }
    } catch { exploreSummary = null }
    // 金标准稿版本（谈判桌页签数据）：_旧版产物 里按时间戳升序的旧稿；当前稿号 = 旧稿数 + 1。
    let goldDrafts = []
    try {
      const archiveDir = join(workDir(project), '_旧版产物')
      if (existsSync(archiveDir)) {
        const goldRe = new RegExp(`^chapter-${String(goldN(meta)).padStart(2, '0')}\\.md\\.([0-9a-z]+)$`)
        goldDrafts = readdirSync(archiveDir)
          .flatMap((name) => { const m = goldRe.exec(name); return m === null ? [] : [{ name, at: parseInt(m[1], 36) }] })
          .sort((a, b) => a.at - b.at)
          .map((d, i) => ({ version: i + 1, path: `work/_旧版产物/${d.name}`, at: d.at }))
      }
    } catch { goldDrafts = [] }
    sendJson(res, 200, {
      ok: true, project, after, events, meta,
      dir: projectDir(project),
      gate: foldGate(project),
      snapshots: listSnapshots(project),
      work: existsSync(workFile(project, 'book.md')) ? 'work/book.md' : null,
      pendingStage: meta.pendingStage ?? null,
      pendingGate: meta.pendingGate ?? null,
      pendingReviews: Array.isArray(meta.pendingReviews) ? meta.pendingReviews : [],
      pendingInterventions: (meta.pendingInterventions ?? []).filter((i) => i.status === 'pending'),
      finalReport: meta.finalReport ?? null,
      chapterStatus,
      goldDrafts,
      goldDraftVersion: goldDrafts.length + 1,
      exploreSummary,
    })
  } catch (error) {
    sendJson(res, 500, { ok: false, error: String(error instanceof Error ? error.message : error) })
  }
}

/** 段 -> 深改影响：下游段 keys + 会被归档的产物（相对路径）。上游产物一律保留（GLM 审查 B）。 */
function deepAffected(projectId, meta, segKey) {
  const chapters = meta?.outline?.chapters ?? []
  const gn = goldN(meta)
  const pad = (n) => String(n).padStart(2, '0')
  const chapterFiles = (n) => [`work/chapter-${pad(n)}.md`, `work/audit-${pad(n)}.md`]
  const allChapters = chapters.flatMap((_, i) => chapterFiles(i + 1))
  const goldFiles = ['work/style-spec.md', ...chapterFiles(gn)]
  const bookFiles = ['work/book.md', 'work/preface.md']
  const gates = [1, 2, 3]
  const proposals = (from) => gates.filter((g) => g >= from).map((g) => `提案/关卡${g}-v1.md`)
  const outlineDown = ['outline', 'gold', ...chapters.map((_, i) => `chapter-${i + 1}`), 'chapters-review', 'merge', 'final']
  switch (segKey) {
    case 'explore':
      return { downstream: ['explore', 'gate-1', 'gate-2', 'gate-3', ...outlineDown],
        files: ['work/explore.md', 'work/knowledge-map.json', ...proposals(1), 'work/outline.md', ...goldFiles, ...allChapters, ...bookFiles],
        reset: 'explore' }
    case 'gate-1': case 'gate-2': case 'gate-3': {
      const n = Number(segKey.slice(5))
      return { downstream: [segKey, ...outlineDown],
        files: [...proposals(n), 'work/outline.md', ...goldFiles, ...allChapters, ...bookFiles],
        reset: 'gate' }
    }
    case 'outline':
      return { downstream: outlineDown, files: ['work/outline.md', ...goldFiles, ...allChapters, ...bookFiles], reset: 'outline' }
    case 'gold':
      return { downstream: ['gold', ...chapters.map((_, i) => `chapter-${i + 1}`), 'chapters-review', 'merge', 'final'],
        files: [...goldFiles, ...chapters.flatMap((_, i) => (i + 1 === gn ? [] : chapterFiles(i + 1))), ...bookFiles],
        reset: 'gold' }
    case 'merge':
      return { downstream: ['merge', 'final'], files: bookFiles, reset: 'merge' }
    case 'final':
      return { downstream: ['final'], files: [], reset: 'final' }
    default: {
      const m = /^chapter-(\d+)$/.exec(segKey)
      if (m === null) return null
      const n = Number(m[1])
      return { downstream: [segKey, 'chapters-review', 'merge', 'final'],
        files: [...chapterFiles(n), ...bookFiles], reset: 'chapter' }
    }
  }
}

/** 段工作的首事件序号（事件截断点）：找不到返回 null（不截断，仅归档+重置）。 */
function deepStartSeq(projectId, segKey) {
  const events = readEvents(projectId)
  const m = /^chapter-(\d+)$/.exec(segKey)
  for (let i = 0; i < events.length; i += 1) {
    const e = events[i]
    if (segKey === 'explore' && e.type === 'textbook/phase-start' && e.data?.phase === 2) return e.seq
    if (segKey === 'explore' && e.type === 'textbook/stage-start' && e.data?.stage === 'explore') return e.seq
    if (/^gate-\d$/.test(segKey) && e.type === 'textbook/gate-proposal' && e.data?.gate === segKey.slice(5)) return e.seq
    if (/^gate-\d$/.test(segKey) && e.type === 'textbook/stage-start' && e.data?.stage === 'gate' && String(e.data?.gate) === segKey.slice(5)) return e.seq
    if (segKey === 'outline' && e.type === 'textbook/stage-start' && e.data?.stage === 'outline') return e.seq
    if (segKey === 'gold' && (e.type === 'textbook/stage-start' && e.data?.stage === 'gold')) return e.seq
    if (m !== null && /agent-start|agent-end|progress|review/.test(e.type)
      && String(e.data?.label ?? e.data?.text ?? '').includes(`第${m[1]}章`)) return e.seq
  }
  return null
}

/** 过程图谱：把账本折叠成可点分段（前端地图与定点修改的数据源）。 */
function buildProcessMap(projectId) {
  const meta = readMeta(projectId)
  const chapters = meta?.outline?.chapters ?? []
  const segments = []
  const push = (s) => segments.push(s)
  const phase = meta?.phase ?? 1
  // 产物存在性按「项目目录相对路径」判（artifacts 输出即相对路径；workFile 会再拼 work/，不能复用）。
  const existsRel = (rel) => existsSync(join(projectDir(projectId), rel))
  // 探源
  push({
    key: 'explore', label: '源探查', kind: 'explore',
    status: existsSync(workFile(projectId, 'explore.md')) ? (meta.exploreConfirmed === true ? 'done' : 'waiting-user') : (phase >= 2 ? 'active' : 'pending'),
    artifacts: ['work/explore.md', 'work/knowledge-map.json'].filter(existsRel),
    redoNote: meta.exploreRedoNote ?? null,
  })
  for (const gate of ['1', '2', '3']) {
    const folded = foldGate(projectId)
    const mine = folded !== null && folded.gate === gate ? folded : null
    const approved = gateApproved(projectId, gate) || waived(projectId, 'gate-skip')
    push({
      key: `gate-${gate}`, label: `关卡${gate}·${GATE_LABELS[gate] ?? ''}`, kind: 'gate',
      status: approved ? 'done' : (mine !== null && mine.status === 'awaiting' ? 'waiting-user' : (phase >= 3 ? 'active' : 'pending')),
      artifacts: [`提案/关卡${gate}-v1.md`].filter(existsRel),
      decision: mine === null ? undefined : { version: mine.version, approved: mine.status === 'approved', note: mine.decision?.note ?? '' },
    })
  }
  push({
    key: 'outline', label: '章节安排', kind: 'outline',
    status: chapters.length === 0 ? (phase >= 3 ? 'active' : 'pending') : (meta.status === 'awaiting-outline' ? 'waiting-user' : (phase >= 4 ? 'done' : 'active')),
    artifacts: existsRel('work/outline.md') ? ['work/outline.md'] : [],
    redoNote: meta.outlineRedoNote ?? null,
  })
  const goldDone = meta.goldSealed != null || phase >= 5
  const goldNn = goldN(meta)
  push({
    key: 'gold', label: '最佳范例章（风格母版）', kind: 'gold',
    status: goldDone ? 'done' : (meta.status === 'awaiting-gold' ? 'waiting-user' : (phase >= 4 ? 'active' : 'pending')),
    artifacts: ['work/style-spec.md', `work/chapter-${String(goldNn).padStart(2, '0')}.md`, `work/audit-${String(goldNn).padStart(2, '0')}.md`].filter(existsRel),
    decision: meta.goldSealed == null ? undefined : { version: meta.goldSealed.version, approved: true, note: '已定稿为风格母版' },
    redoNote: meta.goldRedoNote ?? null,
  })
  chapters.forEach((chapter, index) => {
    const n = index + 1
    push({
      key: `chapter-${n}`, label: `第${n}章 ${chapter.title ?? ''}`, kind: 'chapter',
      status: chapterDone(projectId, n) ? 'done' : (phase >= 5 ? 'active' : 'pending'),
      // F35（2026-08-20 走查）：每章流水线阶段（writing/auditing/audited/finalizing/done，未上报为 null）。
      stage: pipelineStage(meta, index),
      artifacts: [`work/chapter-${String(n).padStart(2, '0')}.md`, `work/audit-${String(n).padStart(2, '0')}.md`].filter(existsRel),
    })
  })
  push({
    key: 'chapters-review', label: '全章过目', kind: 'review',
    status: meta?.status === 'awaiting-chapters-review' ? 'waiting-user' : (meta?.chaptersReviewed === true || existsRel('work/book.md') ? 'done' : 'pending'),
    artifacts: [],
  })
  push({
    key: 'merge', label: '合并成书', kind: 'merge',
    status: existsRel('work/book.md') ? 'done' : (phase >= 6 ? 'active' : 'pending'),
    artifacts: existsRel('work/book.md') ? ['work/book.md'] : [],
  })
  push({
    key: 'final', label: '最后检查与交付', kind: 'final',
    status: meta?.status === 'delivered' ? 'done' : (phase >= 6 ? 'active' : 'pending'),
    artifacts: existsRel('work/book.md') ? ['work/book.md'] : [],
  })
  // 影响预告数据：每段的深改影响范围（下游段 keys / 会被归档的现存产物 / 是否可深改）。
  // demo 书不开放定点修改（canDeepModify=false，走旧全自动通道）。
  for (const seg of segments) {
    const affected = deepAffected(projectId, meta, seg.key)
    seg.downstream = affected === null ? [] : affected.downstream
    seg.redoFiles = affected === null ? [] : affected.files.filter((rel) => existsSync(join(projectDir(projectId), rel)))
    seg.canDeepModify = affected !== null && meta?.demo !== true
  }
  return segments
}

/** 聚合主会话的审计/写作子代理状态（F35）：activity=running →「在跑」，inactive →「完成待收」；
 *  宿主未挂 subagents 服务或读取失败时优雅降级为 0（不阻塞 process 查询）。 */
async function countDescendantSubagents(ctx, sessionId) {
  try {
    const svc = typeof ctx?.get === 'function' ? ctx.get('subagents') : undefined
    if (svc === undefined || typeof svc.listDescendants !== 'function') return { running: 0, inactive: 0 }
    const entries = await svc.listDescendants(sessionId)
    let running = 0
    let inactive = 0
    for (const entry of Array.isArray(entries) ? entries : []) {
      if (entry === null || typeof entry !== 'object' || entry.kind !== 'child') continue
      if (entry.activity === 'running') running += 1
      else inactive += 1
    }
    return { running, inactive }
  } catch {
    return { running: 0, inactive: 0 }
  }
}

async function handleProcess(ctx, req, res) {
  const url = new URL(req.url, 'http://localhost')
  const sessionId = sessionOf(url.searchParams.get('session'))
  const project = url.searchParams.get('project')
  if (project === null || !PROJECT_ID_RE.test(project)) {
    sendJson(res, 400, { ok: false, error: '缺少或非法的 project 参数' })
    return
  }
  try {
    assertSessionOwned(project, sessionId)
    const subagents = await countDescendantSubagents(ctx, sessionId)
    sendJson(res, 200, { ok: true, project, segments: buildProcessMap(project), subagents })
  } catch (error) {
    sendJson(res, 500, { ok: false, error: String(error instanceof Error ? error.message : error) })
  }
}

function handleProjects(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const sessionId = sessionOf(url.searchParams.get('session'))
  try {
    sendJson(res, 200, { ok: true, session: sessionId, projects: listProjects(sessionId) })
  } catch (error) {
    sendJson(res, 500, { ok: false, error: String(error instanceof Error ? error.message : error) })
  }
}

function handleSettings(req, res) {
  try {
    const settings = readSettings()
    sendJson(res, 200, {
      ok: true,
      settings: { mineruTokenSet: typeof settings.mineruToken === 'string' && settings.mineruToken !== '' },
    })
  } catch (error) {
    sendJson(res, 500, { ok: false, error: String(error instanceof Error ? error.message : error) })
  }
}

/** 全部项目 id（注册表 + 默认目录遗留，wizard 暂存跳过）。 */
function allProjectIds() {
  const ids = new Set()
  for (const id of Object.keys(readRegistry())) {
    if (PROJECT_ID_RE.test(id)) ids.add(id)
  }
  for (const name of readdirSync(projectsRoot())) {
    if (PROJECT_ID_RE.test(name) && !name.startsWith('wizard-')) ids.add(name)
  }
  return [...ids]
}

/** 启动恢复链（术语见 CONTEXT.md）：回填老书过程记录 → 处理重做标记 → 续跑进行中的书。
 *  三步顺序属于领域知识；apply 只保留延迟时机策略（setTimeout），测试可直接调用本函数直测。 */
export function startupRecovery(ctx) {
  backfillProcessLogs()
  processRedoMarks()
  resumeRunning(ctx)
}

/** 启动续跑：把状态为 running 的书重新推进（转换中断/宿主重启后自动继续）。
 *  机器在等主 AI（pendingStage）时重新唤醒（AI 回合随宿主重启而中断，需重派）。 */
function resumeRunning(ctx) {
  // 只处理 status === 'running'；awaiting-outline / awaiting-chapters-review / 暂停等情况自然跳过（awaiting 用户确认，不自动续跑）。
  for (const id of allProjectIds()) {
    try {
      const meta = readMeta(id)
      if (meta === null || meta.demo === true) continue
      if (meta.status === 'running') {
        if (meta.pause !== null && meta.pause !== undefined) {
          ctx.logger.info('[textbook-workflow] 项目处于用户暂停，重启后保持暂停不自动续跑')
          continue
        }
        ctx.logger.info(`[textbook-workflow] 续跑项目 ${id}`)
        if (meta.pendingStage !== null && meta.pendingStage !== undefined) {
          // 恢复此前交办：重新记账 + 再唤醒主 AI（本方法幂等）。
          handoff(ctx, id, meta.pendingStage, meta.pendingGate ?? null)
        } else {
          void kick(ctx, id)
        }
      }
      // awaiting-explore / awaiting-gold / delivered / error：停在用户确认点或终点，不自动推进。
    } catch { /* 单个项目损坏不影响启动 */ }
  }
}

/** 老书回填：过程记录.md 不存在时，把 timeline 全部事件补写成可读文档。 */
function backfillProcessLogs() {
  for (const id of allProjectIds()) {
    try {
      const meta = readMeta(id)
      if (meta === null || meta.demo === true) continue
      const logPath = processLogPath(id)
      if (existsSync(logPath)) continue
      const events = readEvents(id)
      if (events.length === 0) continue
      const lines = []
      for (const event of events) {
        const entry = logEntryText(event)
        if (entry === null) continue
        const time = new Date(event.time).toLocaleString('zh-CN', { hour12: false })
        lines.push(`### ${time}\n${entry}\n`)
      }
      if (lines.length > 0) {
        writeFileSync(logPath, lines.join('\n') + '\n')
        console.log(`[textbook-workflow] 已回填过程记录：${id}`)
      }
    } catch { /* 单本书失败不影响启动 */ }
  }
}

/** 重做标记：书夹里存在 .redo 时，重启后先重置（清产物 → 回源探查）再续跑。 */
function processRedoMarks() {
  for (const id of allProjectIds()) {
    try {
      const dir = projectDir(id)
      const mark = join(dir, '.redo')
      if (!existsSync(mark)) continue
      const workDirPath = workDir(id)
      if (existsSync(workDirPath)) {
        const archive = join(workDirPath, '_旧版产物')
        mkdirSync(archive, { recursive: true })
        const stamp = Date.now().toString(36)
        for (const name of readdirSync(workDirPath)) {
          if (name === '_旧版产物') continue
          if (name === 'explore.md' || /^chapter-\d+\.md$/.test(name) || /^audit-\d+\.md$/.test(name)
              || name === 'book.md' || name === 'style-spec.md' || name === 'outline.md') {
            try { renameSync(join(workDirPath, name), join(archive, `${name}.${stamp}`)) } catch { /* 尽力归档 */ }
          }
        }
      }
      const meta = readMeta(id)
      if (meta !== null) {
        meta.phase = 2
        meta.status = 'running'
        meta.converting = false
        delete meta.outline
        meta.updatedAt = Date.now()
        writeMeta(meta)
        try {
          appendEvent(id, 'textbook/hint', { text: '已执行「重置重做」：从源探查重新开始（材料保留）' })
        } catch { /* 账本异常忽略 */ }
      }
      // 移除标记（rmSync 在部分盘上失效，用移动代替；跨盘 EXDEV 自动降级复制+删除）。
      try {
        moveAcrossDevices(mark, join(dshHome(), 'textbook', 'trash', `.redo-${id}-${Date.now().toString(36)}`))
      } catch { /* 标记留着下次再处理 */ }
      console.log(`[textbook-workflow] 已重置重做：${id}`)
    } catch { /* 单本书失败不影响启动 */ }
  }
}

export function apply(ctx) {
  bindAnnounce(ctx)
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/projects', handler: handleProjects }), 'textbook: projects route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/events', handler: handleEvents }), 'textbook: events route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/process', handler: (req, res) => handleProcess(ctx, req, res) }), 'textbook: process route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/action', handler: (req, res) => handleAction(ctx, req, res) }), 'textbook: action route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/upload', handler: handleUpload }), 'textbook: upload route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/work', handler: handleWork }), 'textbook: work route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/file', handler: handleFile }), 'textbook: file route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/download', handler: handleDownload }), 'textbook: download route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/settings', handler: handleSettings }), 'textbook: settings route')
  ctx.logger.info('[textbook-workflow] 造书工作台后端已加载（步骤5：六阶段状态机）')
  // 宿主重启后延迟 3 秒走启动恢复链（三步顺序见 startupRecovery；这里只定时机）。
  setTimeout(() => {
    startupRecovery(ctx)
  }, 3000)
}
