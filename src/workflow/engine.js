/**
 * 造书工作台 · 领域引擎（六阶段状态机核心 + 共享工具）
 *
 * 从原 src/workflow.js 整体迁出（架构评审候选 3，2026-09-01 拆分）：
 * 状态机（runPhase1..6 / runLoop / kick / handoff 等）+ 账本/事件/fs/工作产物
 * 等共享 helper 的全部传递闭包。本模块自洽（只 import 外部库），
 * 供 ./workflow.js（Web 壳）与 ./workflow/actions/*.js（动作族）共同使用。
 *
 * 六阶段：Phase 1 材料准备 / Phase 2 源探查 / Phase 3 教学设计 /
 *   Phase 4 最佳范例章 / Phase 5 全章写作 / Phase 6 终检与交付。
 * 交办机制：meta.pendingStage 记账 + ctx.agents.get(sessionId).followup() 唤醒。
 * demo 模式（演示书）与真实并轨同一套 runPhaseX 路由器（无独立 auto 通道），
 * 唯一 seam = 内容来源：真实由主 AI 完成 / demo 由内置回放（generateContent）完成；
 * demo 与真实共用全部 6 个确认闸门（源探查/关卡/骨架/范例章/全章过目/终检认可）。
 */

import { goldChapterNo, PHASES, EVENT_META, EVENT_TYPES, guessRoleFromName } from '../domain-rules.js'
import { homedir } from 'node:os'
import { join, resolve, dirname, basename } from 'node:path'
import { mkdirSync, readFileSync, existsSync, writeFileSync, statSync, appendFileSync, readdirSync, copyFileSync, rmSync, unlinkSync, rmdirSync, renameSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { isWithin } from '../path-guard.js'
import { convertPdfBatch, readSettings, writeSettings } from '../mineru-lib.js'
import { generateContent, resourceText } from '../content-lib.js'
import { createHash } from 'node:crypto'


const PROJECT_ID_RE = /^[a-z0-9-]{1,64}$/


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
    case 'textbook/gold-chapter':
      return `👑 金标准章：第 ${data.chapter ?? '?'} 章${data.reason ? `\n\n选择理由：${data.reason}` : ''}`
    case 'textbook/chapters-review':
      return `🔍 章节过目确认（${data.approved === true ? '通过' : '驳回'}）`
    case 'textbook/final-approve':
      return data.approved === true
        ? `✅ 终检结果认可，交付完成`
        : `↩️ 终检结果未认可，交办修订${data.note ? `\n\n改进意见：${data.note}` : ''}`
    case 'textbook/deep-modify':
      return `✏️ 定点修改「${data.segment ?? ''}」并重做下游${data.note ? `\n\n用户说明：${data.note}` : ''}`
    case 'textbook/deep-undo':
      return `↩️ 撤销定点修改「${data.segment ?? ''}」`
    case 'textbook/pattern-added':
      return `📇 已加自定义模式：${data.name ?? ''}`
    default: return null
  }
}


/** project.json 内存缓存 + 批量落盘（P2-8，pipeline-perf）
 *  - readMeta 命中缓存返回深拷贝（语义与旧实现一致：每次读到独立对象），避免每事件一次整文件读；
 *  - writeMeta 只更新内存 + 标记脏，setImmediate 收口批量写盘；
 *  - flushMeta 在 setImmediate 与每次 HTTP 响应边界（sendJson）同步落盘并清缓存，
 *    保证外部直读 project.json（工作台/测试）始终看到最新状态；
 *  - timeline.jsonl 事件账本仍逐条同步追加，不受影响。 */
const metaCache = new Map() // projectId -> 最近一次读/写的深拷贝

const metaDirty = new Set() // projectId -> 待落盘

let metaFlushHandle = null


function readMeta(projectId) {
  const cached = metaCache.get(projectId)
  if (cached !== undefined) return structuredClone(cached)
  const path = metaPath(projectId)
  if (!existsSync(path)) return null
  try {
    const meta = JSON.parse(readFileSync(path, 'utf8'))
    metaCache.set(projectId, meta)
    return structuredClone(meta) // 与命中路径同语义：调用方拿到独立拷贝，缓存私有副本不受污染
  } catch (error) {
    throw new Error(`textbook: corrupt project meta ${projectId}: ${String(error)}`)
  }
}


/** 把缓存里待写的 project.json 全部同步落盘，然后清空缓存（幂等，无脏可写时是空转）。
 *  清空缓存是刻意的：每次 HTTP 响应（sendJson）后缓存归零，工作流外的 project.json 直写/直读，
 *  下一次读一定命中磁盘最新——这是工作台/测试依赖的契约。
 *  落盘失败的 project 例外：保留副本 + 脏标记，下次 flush 重试（写本地 project.json 失败极罕见）。 */
function flushMeta() {
  if (metaFlushHandle !== null) { clearImmediate(metaFlushHandle); metaFlushHandle = null }
  const retry = new Map() // projectId -> 落盘失败，保留副本下次重试
  for (const id of metaDirty) {
    const meta = metaCache.get(id)
    if (meta === undefined) continue
    try {
      writeFileSync(metaPath(id), JSON.stringify(meta, null, 2) + '\n')
    } catch {
      retry.set(id, meta)
    }
  }
  metaCache.clear()
  metaDirty.clear()
  for (const [id, meta] of retry) {
    metaCache.set(id, meta)
    metaDirty.add(id)
  }
}


function writeMeta(meta) {
  metaCache.set(meta.id, structuredClone(meta))
  metaDirty.add(meta.id)
  if (metaFlushHandle === null) {
    metaFlushHandle = setImmediate(() => { metaFlushHandle = null; flushMeta() })
  }
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
  // 沉默策略收进 EVENT_META（announce: false = 该型机器不开口；见 CONTEXT.md 工作台提示/验货频率收紧）：
  // 主 AI 现场已讲的过程性事件、用户自己刚做的动作、纯机器内部事件一律不重复播报。
  if (EVENT_META[event.type]?.announce === false) return null
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
    case 'textbook/style-note':
      // 收回才值得告知；新增的意见是用户自己刚点的，不播。
      if (data.revoked !== true) return null
      return `🎨 风格线收回了一条意见（${String(data.styleNote?.text ?? '').slice(0, 40)}）`
    case 'textbook/intervention': return `📮 已留言：${String(data.text ?? '').slice(0, 60)}（不打断 AI 手里的活，下个停靠点处理）`
    case 'textbook/waiver': return `✅ 已按你的特殊要求放行：${WAIVER_ITEMS[data.item]?.label ?? data.item}`
    case 'textbook/pause': return `⏸ 已暂停（${data.reason ?? '用户在造书工作台点击强制中断'}）`
    case 'textbook/resume': return `▶ 已继续`
    case 'textbook/outline-decision':
      return data.approved === true
        ? `✅ 章节安排已确认`
        : `↩️ 章节安排已被驳回，AI 正在重新安排`
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
 *  冻结、刷新重放也复崩）。已废弃该形态；历史遗留的存量信封组已由一次性修复脚本
 *  （fix-announce.mjs，已删）清理完毕，不再需要手动清理。
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


function appendEvent(projectId, type, data, duration) {
  if (!EVENT_TYPES.has(type)) throw new Error(`textbook: unknown event type ${JSON.stringify(type)}`)
  const meta = readMeta(projectId)
  if (meta === null) throw new Error(`textbook: unknown project ${JSON.stringify(projectId)}`)
  const path = timelinePath(projectId)
  const seq = meta.eventCount ?? 0
  const event = { seq, time: Date.now(), type, data }
  // duration（毫秒）：P2-9 性能基线用——调用方把紧邻操作的耗时带进来（如 agent-start→agent-end）；
  // cassette 回放不比对该字段，只比对事件类型序列/产物指纹/终态。
  if (Number.isFinite(duration) && duration >= 0) event.duration = Math.round(duration)
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
  // 单行损坏不炸全局：跳过并告警（账本尾行被截断等场景；比抛错后整本不可用好）。
  const events = []
  for (const line of lines) {
    try { events.push(JSON.parse(line)) } catch { console.error(`[textbook-workflow] 账本行损坏已跳过：${path}`) }
  }
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


function restoreSnapshot(projectId, snapshotSeq) {
  const file = join(snapshotsDir(projectId), `${snapshotSeq}.json`)
  if (!existsSync(file)) throw new Error(`textbook: snapshot ${snapshotSeq} 不存在`)
  const raw = readFileSync(file, 'utf8')
  let snapshot = null
  try { snapshot = JSON.parse(raw) } catch (error) {
    throw new Error(`textbook: 快照 ${snapshotSeq} 损坏无法恢复（${error instanceof Error ? error.message : error}）`)
  }
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
    `这本书的「${label}」轮到你来做了。`,
    '1. 先调用 workbench_status 看真实状态（项目、阶段、待办、抽查意见）。',
    '2. 再调用 workbench_act（action=stage-brief）领取这一步的任务说明、写作方法与产物要求。',
    '3. 按说明完成（可亲手做，也可派小助手分头干）；过程中用 workbench_act（action=progress）随时上报进度。',
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
async function getParent(ctx, projectId, _meta) {
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


async function runPhase1(_ctx, projectId, meta) {
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
    const startedAt = Date.now()
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
        appendEvent(projectId, 'textbook/agent-end', { label: `批量转换 ${pending.length} 本 PDF`, outcome: 'ok' }, Date.now() - startedAt)
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


/** 真实模式：源探查交办给主 AI；演示模式：内置回放（共用产物判定/推进语义）。 */
/** 幂等置态 + 提示（状态没变就不重复写账/发提示）。真实与演示共用。 */
function ensureStatus(projectId, meta, status, hint) {
  if (meta.status !== status) {
    meta.status = status
    writeMeta(meta)
    if (hint !== undefined) appendEvent(projectId, 'textbook/hint', { text: hint })
  }
}


/** 演示模式统一步进：agent-start → 生成 → agent-end → 后续（置态/推进）。
 *  真实模式由主 AI 经 stage-brief/stage-submit 完成（见各 runPhaseX）；
 *  demo 是内置回放适配器，只做内容编排，状态机步进与真实共用 ensureStatus/advance/recordAgentError。 */
async function demoStep(ctx, projectId, meta, label, exec, after) {
  const runtime = projectRuntime(ctx, projectId, meta)
  const startedAt = Date.now()
  appendEvent(projectId, 'textbook/agent-start', { label })
  try {
    await exec(runtime)
    appendEvent(projectId, 'textbook/agent-end', { label, outcome: 'ok' }, Date.now() - startedAt)
    if (after !== undefined) return await after(runtime)
    return 'advanced'
  } catch (error) {
    return recordAgentError(projectId, label, error)
  }
}


async function runPhase2(ctx, projectId, meta) {
  if (meta.demo) {
    // 演示模式：与真实共用确认闸门——产物已存在 → 停 awaiting-explore 等人拍板；内容来自内置回放。
    if (existsSync(workFile(projectId, 'explore.md'))) {
      ensureStatus(projectId, meta, 'awaiting-explore', '🔍 源探查做完了，请在工作台查看：满意点「✅ 满意，继续设计」，不满意点「🔁 让 AI 重做」。')
      return 'waiting'
    }
    return demoStep(ctx, projectId, meta, '源探查', async (runtime) => {
      const result = await generateContent(runtime, 'explore')
      // v2：源探查产出人读索引 + 结构化知识地图（后续设计/写作直接复用）。
      writeWork(projectId, 'explore.md', result.index ?? result.text ?? '')
      if (result.knowledgeMap !== undefined) {
        writeWork(projectId, 'knowledge-map.json', JSON.stringify(result.knowledgeMap, null, 2))
      }
    }, () => {
      ensureStatus(projectId, meta, 'awaiting-explore', '🔍 源探查做完了，请在工作台查看：满意点「✅ 满意，继续设计」，不满意点「🔁 让 AI 重做」。')
      return 'waiting'
    })
  }
  // 真实模式：源探查交办给主 AI；产物已存在则等人确认（explore-confirm）后推进。
  if (existsSync(workFile(projectId, 'explore.md'))) {
    if (meta.exploreConfirmed === true) {
      advance(projectId, 2, 3)
      return 'advanced'
    }
    ensureStatus(projectId, meta, 'awaiting-explore', '🔍 源探查做完了，请在工作台查看：满意点「✅ 满意，继续设计」，不满意点「🔁 让 AI 重做」。')
    return 'waiting'
  }
  if (meta.pendingStage === 'explore') return 'waiting'
  handoff(ctx, projectId, 'explore')
  return 'waiting'
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
    const startedAt = Date.now()
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
      appendEvent(projectId, 'textbook/agent-end', { label, outcome: 'ok' }, Date.now() - startedAt)
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


/** 真实模式：三关设计提案与章节骨架全部交办给主 AI；演示模式：三关自动跑 + 骨架回放（共用 runGate/advance）。 */
async function runPhase3(ctx, projectId, meta) {
  if (meta.demo) {
    // 演示模式：三关逐关提案→等拍板（runGate），全部通过后章节骨架回放生成。
    for (const gate of ['1', '2', '3']) {
      const result = await runGate(ctx, projectId, meta, gate)
      if (result !== 'approved') return result
    }
    if (meta.outline === undefined) {
      const outlineResult = await demoStep(ctx, projectId, meta, '整理章节骨架', async (runtime) => {
        const outline = await generateContent(runtime, 'outline', {})
        meta.outline = outline
        writeMeta(meta)
        writeWork(projectId, 'outline.md', JSON.stringify(outline, null, 2))
      })
      if (outlineResult !== 'advanced') return outlineResult
    }
    ensureStatus(projectId, meta, 'awaiting-outline', '📐 章节安排出来了，请在工作台查看：满意点「✅ 通过」，不满意点「🔁 提改进方向」让 AI 修订。')
    return 'waiting'
  }
  // 真实模式：三关设计提案与章节骨架全部交办给主 AI（已通过的关自动跳过）。
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
/** 真实模式：最佳范例章交办给主 AI（金标准，全书基准）；演示模式：回放生成（共用 awaiting-gold 闸门）。 */
async function runPhase4(ctx, projectId, meta) {
  const gn = goldN(meta)
  if (existsSync(workFile(projectId, `chapter-${String(gn).padStart(2, '0')}.md`))) {
    // 已写好：必须用户确认后才进全章写作（awaiting-gold）。真实与演示共用同一块（原逐字节相同）。
    ensureStatus(projectId, meta, 'awaiting-gold', '📖 最佳范例章写好了，请在工作台查看：满意点「✅ 满意，继续写全书」，不满意点「❌ 重写」。')
    return 'waiting'
  }
  if (meta.demo) {
    // 演示模式：范例章回放生成，产出后停在 awaiting-gold 等人拍板（与真实同闸门）。
    return demoStep(ctx, projectId, meta, '最佳范例章（先写一章给你看）', async (runtime) => {
      const outline = meta.outline ?? { chapters: [{ title: '示例章节', outline: '' }] }
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
    }, async () => {
      // 对齐真实模式 stage-submit gold：新稿落地即意见转 applied、本轮重做意见用毕即清。
      if (Array.isArray(meta.goldOpinions)) {
        for (const o of meta.goldOpinions) if (o.status === 'sent') o.status = 'applied'
      }
      delete meta.goldRedoNote
      ensureStatus(projectId, meta, 'awaiting-gold', '📖 最佳范例章写好了，请在工作台查看：满意点「✅ 满意，继续写全书」，不满意点「❌ 重写」。')
      return 'waiting'
    })
  }
  if (meta.pendingStage === 'gold') return 'waiting'
  handoff(ctx, projectId, 'gold')
  return 'waiting'
}
/** 演示模式 · 铺章的内容编排（回放）：逐章写 + 自查。
 *  只做内容落盘与 agent 事件，不路由状态机（推进/闸门由 runPhase5 负责）。
 *  真实模式铺章由主 AI 经 stage-brief/stage-submit 完成，不在这里。 */
async function demoWriteChapters(ctx, projectId, meta) {
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
    const writeStartedAt = Date.now()
    appendEvent(projectId, 'textbook/agent-start', { label: `写第${n}章《${title}》` })
    try {
      const written = await generateContent(runtime, 'chapter', {
        n, title, outline: chapters[index].outline ?? '', styleSpec,
        targetWords: chapters[index].targetWords ?? meta.targetWords,
        chapterSource: chapters[index].source ?? '',
      })
      // demo 通道的 chapter 产物是字符串（demoChapterWrite 直接返回正文），不是 {text} 对象。
      writeWork(projectId, file, written)
      appendEvent(projectId, 'textbook/agent-end', { label: `写第${n}章`, outcome: 'ok' }, Date.now() - writeStartedAt)
    } catch (error) {
      return recordAgentError(projectId, `写第${n}章`, error)
    }
    const auditStartedAt = Date.now()
    appendEvent(projectId, 'textbook/agent-start', { label: `自查第${n}章` })
    try {
      const audit = await generateContent(runtime, 'audit', {
        n, title, chapterPath,
      })
      writeWork(projectId, `audit-${String(n).padStart(2, '0')}.md`, JSON.stringify(audit, null, 2))
      audits.push(audit)
      appendEvent(projectId, 'textbook/agent-end', { label: `自查第${n}章`, outcome: audit.passed === true ? 'ok' : 'issues' }, Date.now() - auditStartedAt)
    } catch (error) {
      // 审计失败也落盘一条"警告"记录，保证每章都有审计记录（质量门可核）。
      const fallback = { passed: true, issues: [{ level: '警告', text: `自查未能完成：${String(error instanceof Error ? error.message : error)}` }] }
      writeWork(projectId, `audit-${String(n).padStart(2, '0')}.md`, JSON.stringify(fallback, null, 2))
      audits.push(fallback)
      appendEvent(projectId, 'textbook/error', { task: `自查第${n}章`, message: String(error instanceof Error ? error.message : error) })
    }
  }
}


/** 演示模式 · 合并成书的内容编排（回放）：把已过目的章节拼成 book.md。
 *  与 demoWriteChapters 分开：全章过目闸门（awaiting-chapters-review）通过后才调它。 */
async function demoMergeBook(ctx, projectId, meta) {
  if (existsSync(workFile(projectId, 'book.md'))) return
  const runtime = projectRuntime(ctx, projectId, meta)
  const startedAt = Date.now()
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
    appendEvent(projectId, 'textbook/agent-end', { label: '合并成书', outcome: 'ok' }, Date.now() - startedAt)
  } catch (error) {
    return recordAgentError(projectId, '合并成书', error)
  }
}


/** 真实模式：铺章交办给主 AI（小助手执笔 → 小助手审计 → 主 AI 终审），全部完成后交办合并；演示模式：回放编排。 */
async function runPhase5(ctx, projectId, meta) {
  if (meta.demo) {
    // 演示模式：与真实共用「全部写完 → 全章过目闸门 → 合并」的步进语义，内容来自内置回放。
    const chapters = meta.outline?.chapters ?? []
    const allDone = chapters.length > 0 && chapters.every((_chapter, index) => chapterDone(projectId, index + 1))
    if (allDone) {
      if (!existsSync(workFile(projectId, 'book.md'))) {
        // 全章过目闸门（与真实共用）：写完先请人过目，通过才合并。
        if (meta.chaptersReviewed !== true) {
          ensureStatus(projectId, meta, 'awaiting-chapters-review', '📚 全部章节都写好了！请在工作台逐章过目：想细看就点「看看这章」，有意见直接写（AI 会照改）；都满意了点「✅ 都过了，交工」开始合并。')
          return 'waiting'
        }
        const mergeResult = await demoMergeBook(ctx, projectId, meta)
        if (mergeResult === 'error') return mergeResult
        advance(projectId, 5, 6)
        return 'advanced'
      }
      advance(projectId, 5, 6)
      return 'advanced'
    }
    const writeResult = await demoWriteChapters(ctx, projectId, meta)
    if (writeResult === 'error') return writeResult
    ensureStatus(projectId, meta, 'awaiting-chapters-review', '📚 全部章节都写好了！请在工作台逐章过目：想细看就点「看看这章」，有意见直接写（AI 会照改）；都满意了点「✅ 都过了，交工」开始合并。')
    return 'waiting'
  }
  // 真实模式：铺章交办给主 AI（小助手执笔 → 小助手审计 → 主 AI 终审），全部完成后交办合并。
  const chapters = meta.outline?.chapters ?? []
  const allDone = chapters.length > 0 && chapters.every((_chapter, index) => chapterDone(projectId, index + 1))
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


/** 真实模式：最后检查交办给主 AI（自查报告），机器硬检查兜底后交付；演示模式：机器质量门 + 交付（共用 book.md 缺失兜底）。 */
async function runPhase6(ctx, projectId, meta) {
  const bookPath = workFile(projectId, 'book.md')
  if (!existsSync(bookPath)) {
    appendEvent(projectId, 'textbook/error', { task: '交付', message: 'book.md 不存在，请回退重跑' })
    meta.status = 'error'
    writeMeta(meta)
    return 'error'
  }
  if (meta.demo) {
    // 演示模式：机器质量门 → 停 awaiting-final-approval 等人认可（与真实同闸门），认可后交付。
    const startedAt = Date.now()
    const checks = runQualityChecks(projectId)
    meta.finalChecks = checks
    appendEvent(projectId, 'textbook/quality', { checks })
    appendEvent(projectId, 'textbook/agent-end', { label: '最后检查（质量门）', outcome: 'ok' }, Date.now() - startedAt)
    ensureStatus(projectId, meta, 'awaiting-final-approval', '🛡️ 终检完成了：AI 自查报告与机器检查结果已在工作台。这是你对整本书的最后一次把关——满意点「✅ 认可，交付」，要改的写意见（AI 会按意见修整本后重新终检）。')
    return 'waiting'
  }
  if (meta.pendingStage === 'final') return 'waiting'
  handoff(ctx, projectId, 'final')
  return 'waiting'
}
/** style-spec 指纹：范例章交工时定格，终检交工时对账——契约修改必须留痕（Q9，2026-08-27）。 */
function specFingerprint(projectId) {
  return createHash('sha256').update(readFileSync(workFile(projectId, 'style-spec.md'), 'utf8')).digest('hex').slice(0, 16)
}


/** 服务端确定性质量门（机器兜底，不依赖 LLM）：主 AI 自查之外的最后防线。 */
/** 从 style-spec 读机器可判定的契约列表（质量门判据，非硬编码）：
 * 只认行首显式声明的清单行（允许 markdown 标题 # 与加粗 ** 前缀）——「必含板块：」「禁用词：」开头；
 * 正文里「句中提到必含板块」的行不再被误当清单（2026-08-27 grill 修订，防误判卡死交付）。
 * 契约原则：style-spec 没显式列出 → 返回 null，跳过该项检查（不以硬编码词表误判）。 */
function parseStyleSpecList(specText, label) {
  if (typeof specText !== 'string' || specText === '') return null
  const re = new RegExp(`(?:^|\\n)\\s*(?:#{1,6}\\s*)?(?:\\*\\*)?${label}(?:\\*\\*)?\\s*[:：]([^\\n]*)`)
  const m = specText.match(re)
  if (m === null) return null
  const items = m[1].split(/[、,，;；|/]+/).map((s) => s.trim().replace(/^[-*]\s*/, '')).filter((s) => s.length > 0 && s.length <= 20)
  return items.length > 0 ? items : null
}


/** style-spec 是否显式声明「本书不设练习」（契约原则：声明豁免自动跳过练习/答案检查）。 */
function styleSpecDeclaresNoExercises(projectId) {
  const path = workFile(projectId, 'style-spec.md')
  if (!existsSync(path)) return false
  const spec = readFileSync(path, 'utf8')
  return /不设练习|无练习|不设习题|无习题|不写练习|不要练习/.test(spec)
}


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
    { name: '练习与答案齐全', ok: /练习|答案|习题/.test(bookText) || otherWaived || styleSpecDeclaresNoExercises(projectId), note: otherWaived ? '已获用户豁免：以你的说明为准' : (styleSpecDeclaresNoExercises(projectId) ? 'style-spec 已声明「本书不设练习」，按契约跳过' : '成品含练习与答案') },
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
      note: progressWaived ? '已获用户豁免：跳过「进度账本」检查' : (progressExists ? 'work/progress.md 存在' : '缺 work/progress.md（每章一行：写完/审计/验货）'),
    })
  }
  // 质量门并入机器（2026-08-27 用户拍板 Q3）：从 skill 文档的 grep 流程收编为机器可判定项——
  // 乱码 U+FFFD、章节数符合大纲、必含板块齐全、禁用词。判据全部从已拍板的 style-spec/outline 读，
  // 非硬编码（契约原则）；demo 确定性内容都满足，不改变 cassette 轨迹。
  if (meta?.demo !== true) {
    const spec = existsSync(workFile(projectId, 'style-spec.md')) ? readWork(projectId, 'style-spec.md') : ''
    // ① 乱码 U+FFFD（OCR 残留替换字符）。误伤逃生口：other 豁免（2026-08-27 grill 修订——
    //    契约类检查全部挂豁免，机器误判时用户不被卡死）。
    checks.push({
      name: '成品无乱码（U+FFFD）',
      ok: !bookText.includes('\uFFFD') || otherWaived,
      note: bookText.includes('\uFFFD')
        ? (otherWaived ? '已获用户豁免：以你的说明为准（成品含乱码替换字符）' : '成品含乱码替换字符（U+FFFD），需清理')
        : '成品无乱码',
    })
    // ② 章节数符合大纲（从 outline 读，非硬编码）
    const chapterHeadings = (bookText.match(/^#{1,3}\s*第\s*\d+\s*章/gm) ?? []).length
    checks.push({
      name: '章节数符合大纲',
      ok: chapterHeadings >= chapterCount,
      note: `${chapterHeadings}/${chapterCount} 章成品标题≥大纲（合并机器拼装保证，防御性复验）`,
    })
    // ③ 必含板块齐全（从 style-spec 行首「必含板块：」读清单；未声明则跳过，不以硬编码列表误判）。
    //    设计已改的合法出口：AI 同步更新 style-spec 清单行，或 other 豁免。
    const requiredBoards = parseStyleSpecList(spec, '必含板块')
    if (requiredBoards !== null) {
      const missingBoards = requiredBoards.filter((board) => !bookText.includes(board))
      checks.push({
        name: '必含板块齐全（契约项）',
        ok: missingBoards.length === 0 || otherWaived,
        note: missingBoards.length === 0
          ? `必含板块齐全（${requiredBoards.length} 个）`
          : (otherWaived
            ? `已获用户豁免：以你的说明为准（缺失：${missingBoards.slice(0, 3).join('、')}）`
            : `缺失必含板块：${missingBoards.slice(0, 3).join('、')}（若设计已改，请同步更新 style-spec 的「必含板块」行）`),
      })
    }
    // ④ 禁用词（从 style-spec 行首「禁用词：」读；未声明则跳过）
    const bannedWords = parseStyleSpecList(spec, '禁用词')
    if (bannedWords !== null) {
      const hits = bannedWords.filter((word) => bookText.includes(word))
      checks.push({
        name: '无禁用词（契约项）',
        ok: hits.length === 0 || otherWaived,
        note: hits.length === 0
          ? '未见 style-spec 禁用词'
          : (otherWaived
            ? `已获用户豁免：以你的说明为准（残留：${hits.slice(0, 3).join('、')}）`
            : `残留禁用词：${hits.slice(0, 3).join('、')}`),
      })
    }
  }
  // 矛盾审查（终检新增，用户拍板 2026-08-26）：引用矛盾 + 事实矛盾。
  // 引用矛盾：章节骨架标称的 source（资料N…）必须指向真实存在的源材料；指向不存在的资料 = 引用矛盾。
  if (meta?.demo !== true) {
    const chapters = meta?.outline?.chapters ?? []
    const sourceCount = (meta?.sources ?? []).length
    const badRefs = []
    for (let index = 0; index < chapters.length; index += 1) {
      const src = String(chapters[index]?.source ?? '')
      // matchAll：一章标称多份资料（「资料2、资料3」）时逐个核对，不只查第一处。
      for (const m of String(src).matchAll(/资料\s*(\d+)/g)) {
        const n = Number(m[1])
        if (n < 1 || n > sourceCount) {
          badRefs.push(`第${index + 1}章标称「${m[1]}号资料」但只有 ${sourceCount} 份源材料`)
        }
      }
    }
    checks.push({
      name: '章节引用可追溯（无引用矛盾）',
      ok: badRefs.length === 0,
      note: badRefs.length === 0 ? '每章标称的源材料都真实存在' : `发现引用矛盾：${badRefs.slice(0, 3).join('；')}`,
    })
  }
  // 事实矛盾（机器轻量层）：跨章重复标题 = 疑似重复/冲突内容；深层的语义矛盾由 AI 自查报告承载。
  // 只揪「内容性」标题（规范化的标题 ≥6 字，且不是通用小节名），避免「本章小结/本节练习」这类
  // 合法重复被误判成矛盾；真正的语义矛盾仍靠 AI 自查报告逐项核对。
  if (meta?.demo !== true) {
    const headings = []
    const headingRe = /^#{1,3}\s+(.*)$/gm
    for (const match of bookText.matchAll(headingRe)) {
      const title = match[1].trim()
      if (title.length >= 4) headings.push(title)
    }
    const BOILERPLATE = /小结|练习|答案|习题|本节|本章|目标|重点|方法|导入|复习|课后|思考/
    const seen = new Map()
    const dup = []
    for (const h of headings) {
      const k = h.replace(/[\s，。、,.·：:]/g, '')
      if (k.length < 6 || BOILERPLATE.test(k)) continue
      if (seen.has(k)) dup.push(`「${h}」`)
      else seen.set(k, true)
    }
    // 跨章重复标题：线索级警示，不拦交付（2026-08-27 grill 修订）——同名标题是否真矛盾是语义判断，
    // 归 AI 自查与合并前跨章审计（「机器扫结构、AI 查语义」分工）；机器硬判合法重复会误伤交付。
    checks.push({
      name: '无跨章重复标题（线索级警示）',
      ok: true,
      note: dup.length === 0
        ? '未见跨章重复的内容性标题'
        : `警示：跨章重复标题 ${dup.slice(0, 3).join('、')}——是否真矛盾请 AI 核对并在自查报告说明`,
    })
  }
  return checks
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
      || meta.status === 'awaiting-final-approval'
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


function sendJson(res, status, value) {
  // 元数据批量落盘边界：任何 HTTP 响应前把待写 project.json 同步写盘，
  // 外部读者（工作台/测试直读）始终看到最新状态（与旧同步写语义一致）。
  flushMeta()
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(body)
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
      brief.task = '统筹通读全部转换后的教材（sources 里每本给出准确的 sources-md/ 子路径与 full.md）：可自己读，也可把每本分头派给小助手通读（干净上下文、要求详细摘录结构/角色/权威层级/教学线索），你逐份核对后亲自汇总整理出「源材料索引」与「结构化知识地图」。'
      brief.outputs = [
        'work/explore.md —— 人读的源材料索引（纯 Markdown）：材料清单（文件名+角色）、结构观察（摸源结构、角色标签、权威层级）、教学线索（知识点密度、重点难点、可用素材）；≤1200 字，面向非技术家长。',
        'work/knowledge-map.json —— 结构化知识地图（严格 JSON）：materials:[{num,sections:[{title,summary,keywords}]}]、knowledgePoints:[{id,title,source,summary,difficulty}]、teachingFocus:[string]（重点/难点各一句人话，纯字符串，如「重点：分数运算」「难点：应用题建模」）、chapterSuggestion:[{title,source,points}]（4-10 章）。',
      ]
      brief.materials = sources
      brief.methodology = `${mtl('SKILL.md')}\n\n${mtl('references/source-material.md')}`
      brief.hints = [
        '这是全书设计的基准，宁可多读、多整理，不要只读开头。材料多时可直接把每本分头派给小助手通读（每本一个干净上下文，要求详细摘录结构/角色/权威层级/教学线索），你逐份核对后亲自汇总整理。',
        '无论自己读还是派小助手，文件操作用文件工具（read/write/edit/glob/grep），别用 shell（工具纪律见 audit-and-testing.md §九，跨平台一致）。',
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
        '派审计小助手时提醒：文件操作用文件工具（read/write/edit/glob/grep），别用 shell（工具纪律见 audit-and-testing.md §九，跨平台一致）。',
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
      brief.task = '铺章：对每一章走三步——派小助手写（给大纲/材料小节/写作规范/范例章路径）→ 派小助手审计（干净上下文，产出 audit-NN.md；机器会读它验货）→ 机器按章验货（audit.passed===true 才放行）。**remaining 里还没写的各章可并行派多个写作小助手**（每章一个、干净上下文、各写各的独立文件），各自完成后逐个交工验货。你不逐章终审；只有该章有用户抽查意见时，才需要你亲自核对修订结果。'
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
        '并行纪律：remaining 各章可并行派多个写作小助手，并发 2-4 章为宜（低内存/老机器从 2 起）；每章一个写作小助手、各章独立文件（chapter-NN.md / audit-NN.md），绝不共享工作区写同一文件；各章各自完成后逐个交工验货（ordered-commit：慢章压住快章属预期，不必等齐）。宿主不支持并行 spawn 时小助手自动排队，退化为逐章串行，行为与现状等价。',
        '派小助手/审计小助手时提醒：文件操作用文件工具（read/write/edit/glob/grep），别用 shell（工具纪律见 audit-and-testing.md §九，跨平台一致）。',
        '小助手与审计小助手用你的 subagent 工具派；提醒小助手材料小节与产出文件的准确路径（都在 dir 下）。',
        '每交一章前先 workbench_status 查有没有新抽查意见，有就先处理（修订 → 重新审计 → 机器验货）再继续；该章意见未处置机器会拒收。',
        '机器按章验货：每章都要有 work/chapter-NN.md 和 audit-NN.md，且 audit.passed 必须是 true（读审计 JSON，不是只看文件存在）。',
        '派写作小助手时必须带（按 writing-agent-prompt.md 模板填）：本章知识点清单（remaining[].points）、本章在知识链中的位置与跨章引用指向（前面哪章讲过什么、后面哪章会用到这里）、范例章路径与写作规范。',
        '跨章引用纪律：前向引用只到大纲承诺粒度（「第 N 章会展开」），禁止编造未写章节的具体数字/结论/例题；审计小助手按 audit-agent-prompt.md 派，要求其扫跨章引用存在性（含前向承诺失配）。',
      ]
      break
    }
    case 'merge': {
      brief.task = '合并前先做跨章审计：通读全部章节 + outline + knowledge-map，逐项核对（①跨章事实一致性—数字/人名/结论不打架 ②术语统一—同一概念全书一个说法 ③交叉引用不悬空—「见第X章」的章真实存在 ④知识递进链—后章依赖的前置概念前章真的讲过），发现问题先修，再把审计结论落盘 work/audit-cross.md（机器验存在才放行合并）。然后写这本书的前言/使用说明（≤300 字，通俗），随 stage-submit（stage=merge, preface=...）交工；机器会 100% 保真拼装各章成书（不删节）。'
      brief.references = ['交工后工作台会生成 work/book.md（机器拼装成品）']
      brief.methodology = mtl('references/audit-and-testing.md')
      brief.outputs = ['维护 work/progress.md（每章一行：写完/审计/验货）', 'work/audit-cross.md —— 合并前跨章审计结论（机器验存在才放行合并）']
      brief.hints = ['前言写给"拿到这本书的人"：这本书讲什么、怎么用（给 AI 老师上课还是人直接读）。', 'audit-cross.md 是硬门槛：没落盘机器会 400 拒收，别只交前言。']
      break
    }
    case 'final': {
      brief.task = '最后检查：亲自读 work/book.md，逐项自查（成品完整、每章有自查记录、无 AI 脚手架残留、练习与答案齐全、与已拍板设计一致、材料可追溯、无引用矛盾与事实矛盾），发现问题先修，再把你的自查报告（人话）随 stage-submit（stage=final, report=...）交工。机器硬检查会兜底（含质量门：乱码/章节数/必含板块/禁用词，判据来自已拍板的 style-spec/outline）；全过后你在工作台等用户「认可」才算交付。'
      brief.counts = { chapters: (meta.outline?.chapters ?? []).length, sources: (meta.sources ?? []).length }
      brief.methodology = mtl('references/delivery-checklist.md')
      brief.outputs = ['维护 work/progress.md（每章一行：写完/审计/验货）']
      // 终检被用户驳回后的修订意见（final-approve approved=false → 原地循环）。
      // 意见在 stage-submit final 通过时才销号（2026-08-27 grill 修订）：领任务改纯读、无副作用，
      // AI 重领任务/机器打回后重领都仍带意见；「重做意见只对本轮生效」语义不变（与 exploreRedoNote/goldRedoNote 同构）。
      if (meta.finalRedoNote != null) {
        brief.userFeedback = meta.finalRedoNote
        brief.hints = [...(brief.hints ?? []), `这是终检修订：用户对整本书的意见是「${meta.finalRedoNote}」。按意见修整本（改 book.md），改完重新自查一遍再交工。`]
      }
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
// 动作族 dispatch 表（架构候选 4 · ADR-0003 第二刀）：40 个顶层 case 按 9 个动作族
// 归组为 handler + action→handler 映射表；同文件 banner 分区、不拆物理文件。
// HTTP 层仍是唯一 external seam；族 handler 不对测试导出——现有 mkReq/mkRes fakes
// 即第二个 adapter。族边界 = 未来共享 domain module 的候选挂载点（见议题 01 协调注记）。
// ─────────────────────────────────────────────────────────────────────────────

/** 段 -> 深改影响：下游段 keys + 会被归档的产物（相对路径）。上游产物一律保留（GLM 审查 B）。 */
function deepAffected(_projectId, meta, segKey) {
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

export {
  PROJECT_ID_RE,
  assertSessionOwned,
  goldN,
  paragraphReviewText,
  WAIVER_ITEMS,
  PHASE_LABELS,
  GATE_LABELS,
  STAGE_LABELS,
  stageLabel,
  dshHome,
  projectsRoot,
  registryPath,
  readRegistry,
  writeRegistry,
  registerProject,
  registeredDir,
  sessionWorkspace,
  sanitizeFolderName,
  freeBookDir,
  projectDir,
  timelinePath,
  metaPath,
  processLogPath,
  logEntryText,
  metaCache,
  metaDirty,
  metaFlushHandle,
  readMeta,
  flushMeta,
  writeMeta,
  waived,
  announceText,
  announceToSession,
  pendingPhaseEnd,
  announceEventToSession,
  appendEvent,
  readEvents,
  listProjects,
  copyTreeSync,
  removeTree,
  removeTreeManual,
  trashProject,
  snapshotsDir,
  mergeUserVoice,
  writeSnapshot,
  restoreSnapshot,
  foldGate,
  workDir,
  workFile,
  writeWork,
  readWork,
  customPatternsDir,
  listCustomPatterns,
  updateStyleLineMirror,
  sourcesDir,
  sourcesMdDir,
  runners,
  gateWaiters,
  parents,
  wakeMainAI,
  handoff,
  chapterArtifacts,
  chapterDone,
  announceCtx,
  bindAnnounce,
  disposeParent,
  getParent,
  projectRuntime,
  writeProposalDoc,
  proposeGate,
  proposeRevision,
  advance,
  waitForGateDecision,
  runPhase1,
  runPhase2,
  countRejections,
  countProposals,
  gateApproved,
  runGate,
  runPhase3,
  runPhase4,
  runPhase5,
  SCAFFOLD_MARKERS,
  scanScaffolding,
  stripLoaderRegion,
  runPhase6,
  specFingerprint,
  parseStyleSpecList,
  styleSpecDeclaresNoExercises,
  runQualityChecks,
  recordAgentError,
  runLoop,
  kick,
  sendJson,
  clipMethodology,
  buildStageBrief,
  deepAffected,
  deepStartSeq,
}
