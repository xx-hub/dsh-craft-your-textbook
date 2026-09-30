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

import { goldChapterNo, PHASES, EVENT_META, EVENT_TYPES, guessRoleFromName, gateHuman, stageLabelHuman, segmentHuman, CHAPTER_PROGRESS_REQUIREMENT } from '../domain-rules.js'
import { homedir } from 'node:os'
import { join, resolve, dirname, basename } from 'node:path'
import { mkdirSync, readFileSync, existsSync, writeFileSync, statSync, appendFileSync, readdirSync, copyFileSync, rmSync, unlinkSync, rmdirSync, renameSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { isWithin } from '../path-guard.js'
import { convertPdfBatch, readSettings, writeSettings } from '../mineru-lib.js'
import { generateContent, resourceText } from '../content-lib.js'
import { artifactDataForStage, artifactDataForLabel, artifactDataForChapter } from './artifact-fields.js'
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
  'gate-skip': { label: '跳过「请你拍板」的设计环节', risk: '设计没经你确认就定稿，方向错了要返工' },
  'outline-skip': { label: '跳过「章节安排」确认', risk: '章节切分没经你确认，可能与预期不符' },
  'gold-skip': { label: '跳过「最佳范例章」确认', risk: '全书风格基准没经你认可' },
  'audit-skip': { label: '不要求每章都有独立审查', risk: '章节质量问题可能漏网' },
  'scaffold-keep': { label: '保留 AI 的笔记不删', risk: '成品里会留下工作痕迹' },
  // 票 15⑤：`route-override` 已删除声明。判别规则（票 06 的 Answer）：语义是「改变一个已定状态并牵动
  // 下游产物」→ 全仓没有该状态变更的迁移语义 ＝ 未实现的新能力，只能删声明（要做得另开 effort）。
  // 此前它只写在声明表与 AI 可见的枚举描述里、全仓没有 waived() 读取点，AI 可能调一个没效果的豁免。
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


/**
 * 用户读到的状态条/提示文案（**界面字**，不是机器身份词——账本 label、文件名、事件 type
 * 才是不动的那一类）。
 * ⚠️ 这两句曾在多处 ensureStatus / hint 里逐字重复，2026-09-20 走查抓到"只改了一半"：
 * 「终检完成了」的孪生件改名成「最后检查完成了」，这份没跟上。抽成常量，一处改、处处改。
 */
export const EXPLORE_DONE_HINT =
  '🔍 材料读完了，请在工作台查看：满意点「✅ 满意，继续设计」，不满意点「🔁 让 AI 重做」。'
export const FINAL_CHECK_DONE_HINT =
  '🛡️ 最后检查完成了：AI 检查报告与机器检查结果已在工作台。这是你对整本书的最后一次把关——满意点「✅ 认可，交付」，要改的写意见（AI 会按意见修整本后重新做最后检查）。'

/**
 * 最后检查交办说明里的「别写内部词」清单（**元语言例外/豁免一**：指称禁词时只能用禁词）。
 * ⚠️ 这一段**故意保留内部词**（旧词→新词两列照抄），改它等于把给 AI 的指令改成自相矛盾。
 * 因为它是唯一一段"合法含禁词"的 brief 文本，用词不变量断言按**名字**引这个常量把它从被扫
 * 文本里剔掉（见 test-wording-invariants.mjs），而不是"整段跳过"糊过去。
 */
export const REPORT_WORDING_RULE =
  '⚠️ 这份报告用户会逐字读：不写"审计文件/进度账本/禁用词/契约项/回源核对/U+FFFD/质量门/终检"这类内部词，改说"检查记录/工作记录/不该用的词/写作规范/标注了出处/乱码/最后检查"。'


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


/** 阶段事件的人读阶段名：`data.label` 是 PHASES 的 canonical 全称（**机器身份词**，账本里就这么
 *  存着，不改），出口处过一遍界面词翻译；旧账本没带 label 时按 phase 号回落到 canonical 全称再译。
 *  译不出来原样显示（宁可露出机器词，也不猜）。 */
function phaseEventHuman(data) {
  const raw = data.label ?? PHASE_LABELS[data.phase] ?? data.phase ?? ''
  return stageLabelHuman(raw)
}


/** 事件 → 人读的过程记录条目（返回 null 表示不值得记，如转换中间进度）。 */
function logEntryText(event) {
  const data = event.data ?? {}
  switch (event.type) {
    case 'textbook/phase-start': return `🏁 阶段开始：${phaseEventHuman(data)}`
    case 'textbook/phase-end': return `✅ 阶段完成：${phaseEventHuman(data)}`
    case 'textbook/agent-start': return `🤖 AI 开始：${stageLabelHuman(data.label)}`
    case 'textbook/agent-end': return `🤖 AI 完成：${stageLabelHuman(data.label)}`
    case 'textbook/gate-proposal':
      // ⚠️ 不印「提案/关卡N-vX.md」：文件名与产物路径是**机器身份词**（判定线不改，锚定它的正则
      // 见 domain-rules 的提案白名单），印到人读文本里就把「关卡」带出来了。指个真实去处即可。
      return `📋 ${gateHuman(data.gate)} · 方案 v${data.version}：${data.title ?? ''}\n\n${data.summary ?? ''}\n\n（完整方案在书夹的「提案」文件夹里）`
    case 'textbook/gate-decision':
      return data.approved === true
        ? `✅ 第 ${data.gate} 次拍板通过（v${data.version}）${data.note ? `\n\n用户备注：${data.note}` : ''}`
        : `❌ 第 ${data.gate} 次拍板驳回（v${data.version}）${(data.reasons ?? []).length > 0 ? `\n\n驳回理由：${data.reasons.join('、')}` : ''}${data.note ? `\n\n用户意见：${data.note}` : ''}`
    case 'textbook/source-added': return `📎 已上传材料：${data.file ?? ''}（${data.role ?? ''}）`
    case 'textbook/mineru-progress': return null
    case 'textbook/rollback': return `⏪ 回退到快照 ${data.snapshot ?? ''}`
    case 'textbook/hint': return `💡 ${data.text ?? ''}`
    case 'textbook/error': return `⚠️ 出错（${stageLabelHuman(data.task)}）\n\n${data.message ?? ''}`
    case 'textbook/quality': {
      const checks = data.checks ?? []
      const pass = checks.filter((check) => check.ok === true).length
      return `🛡️ 最后检查：${pass}/${checks.length} 项通过`
    }
    case 'textbook/delivery': return '🎉 交付完成'
    case 'textbook/stage-start': return `🎯 交给 AI 动手：${stageLabelHuman(data.label ?? data.stage ?? '')}`
    case 'textbook/progress': return `⏳ ${data.label ?? ''}${data.detail ? `：${data.detail}` : ''}`
    case 'textbook/review': return `👀 抽查意见（第 ${data.chapter ?? '?'} 章《${data.title ?? ''}》）：${data.comment ?? ''}`
    case 'textbook/ai-report': return `🛡️ AI 检查报告：${data.report ?? ''}`
    case 'textbook/style-note': {
      const note = data.styleNote ?? {}
      return `🎨 风格线${data.revoked === true ? '收回' : '新增'}：${note.text ?? ''}${note.status === 'superseded' ? '（已收回）' : ''}`
    }
    case 'textbook/intervention': return `📮 留言稍后处理：${data.text ?? ''}`
    case 'textbook/intervention-done': return `📮 留言已处理：${data.text ?? ''}`
    case 'textbook/waiver': return `赦 ✅ 已获用户豁免「${WAIVER_ITEMS[data.item]?.label ?? data.item}」：${data.userNote ?? ''}`
    case 'textbook/waiver-revoke': return `赦 ↩️ 豁免已收回「${WAIVER_ITEMS[data.item]?.label ?? data.item}」，机器恢复拦截`
    case 'textbook/pause': return `⏸ 已暂停（${data.reason ?? '用户在造书工作台点击暂停'}）`
    case 'textbook/resume': return `▶ 已继续`
    case 'textbook/outline-decision':
      return data.approved === true
        ? `✅ 章节安排已通过${data.note ? `\n\n用户备注：${data.note}` : ''}`
        : `↩️ 章节安排已驳回${data.note ? `\n\n用户意见：${data.note}` : ''}`
    case 'textbook/gold-opinion': {
      // 票 09（走查 P26）：撤回那一支**先于**取 opinion 返回——`data.revoked === true` 的事件
      // 没有 `opinion` 字段，硬往下走会渲染成「#undefined（笼统）undefined」那行乱码。
      if (data.revoked === true) {
        return `↩️ 已撤回${Number.isSafeInteger(data.chapter) ? `第 ${data.chapter} 章` : ''}的一条意见：AI 不再照它改，也不再拦这一章交工`
      }
      const o = data.opinion ?? {}
      const verbs = { dislike: '不喜欢', drop: '不需要', change: '要改成' }
      const wish = typeof o.wish === 'string' && o.wish !== '' ? `：${o.wish}` : ''
      // 票 07（P25）：这一行原本读 `o.seq`（＝`data.opinion.seq`），而**意见的编号不在那里**——
      // 落账时它在事件 `data` 的顶层（`workflow/actions/gold.js` 写的是 `{ seq, opinion:{ id, at, target, kind, wish, status } }`），
      // 条目自身的 id 则嵌在 `data.opinion.id`。两处路径都取不到值，于是《过程记录.md》与右栏
      // 那个「过程记录」面板**同一处**印出 `✍️ 最佳范例章意见#undefined`（一处字段写错、两个出口一起错
      // ——它们共用本函数）。改成按「顶层编号 → 条目 id」的次序取，取不到就不印编号（不拿 undefined 上屏）。
      const no = data.seq ?? o.id
      return `✍️ 最佳范例章意见${no === undefined || no === null || no === '' ? '' : `#${no}`}（${o.target ?? '笼统'}）${verbs[o.kind] ?? o.kind}${wish}`
    }
    case 'textbook/gold-seal': return `🏆 最佳范例章已定稿（v${data.version ?? '?'}），意见沉淀入风格线（${data.count ?? 0} 条）`
    case 'textbook/gold-chapter':
      return `👑 最佳范例章：第 ${data.chapter ?? '?'} 章${data.reason ? `\n\n选择理由：${data.reason}` : ''}`
    case 'textbook/chapters-review':
      return `🔍 章节过目确认（${data.approved === true ? '通过' : '驳回'}）`
    case 'textbook/final-approve':
      return data.approved === true
        ? `✅ 最后检查通过，交付完成`
        : `↩️ 最后检查未获认可，交办修订${data.note ? `\n\n改进意见：${data.note}` : ''}`
    case 'textbook/deep-modify':
      // `data.segment` 是**机器身份词**（`gate-1` / `explore` / `chapter-03` 这类 seg.key，账本里就这么存的，
      // 不改）；但这一行是写进《过程记录.md》给人读的（判定线②），所以过一遍界面词翻译
      // （2026-09-20 复审 a-4：原先直接把 seg.key 印到人读流水账里）。译不出来原样显示。
      return `✏️ 定点修改「${segmentHuman(data.segment)}」并重做下游${data.note ? `\n\n用户说明：${data.note}` : ''}`
    case 'textbook/deep-undo':
      return `↩️ 撤销定点修改「${segmentHuman(data.segment)}」`
    case 'textbook/pattern-added':
      return `📇 已加自定义模式：${data.name ?? ''}`
    // 交工/提审被拒（票 01 (d)）：写进《过程记录.md》的那一行——`stage` 与原因都在事件 data 里，
    // 人读文本说「交工被拒：<原因>」。
    //
    // ⚠️ **`logEntryText` 这一个出口不印阶段**（票 `audit-matrix-contract/06`，2026-09-29 用户拍板
    // 选 ②；这条注释就是票面要求的「四个出口逐个点名、各有理由」里 engine 侧那一处的落笔）。
    // **不印的理由**：这一行是**已经发生的事**的流水记录，阶段从「事件属于哪一步」已经能由上一条
    // `textbook/stage-start` 读出来；在这里再印一次等于同一屏/同一份文件里把同一件事说两遍。
    // 而**尚未解决的**那一条（用户此刻要知道「我这次交工卡在合并还是最后检查」）由界面事件行的
    // **展开详情**那一格承担（`src/ui/event-cards.js` 的 `replayRowDetail`，印人话词）。
    // 与上面 `announceText` 是两处**同理由、不同对象**（一份是文件流水、一份是对话播报）。
    case 'textbook/submit-rejected': return `🚫 交工被拒：${data.reason ?? ''}`
    // 票 12 · ①：《过程记录.md》那一行（事后翻账的人看的）。措辞与对话播报**共用**下面那一份
    // `styleSpecChangeWhen`——两处各写一遍就是「一处改、另一处漏」。
    case 'textbook/style-spec-change':
      return `📝 写作规范在范例章定稿后被改过：${styleSpecChangeWhen(data)}`
    default: return null
  }
}


/**
 * 「写作规范变更」那一笔要说清的两件事（**两个出口共用这一份**，不各写一遍）：
 * **哪一版变了**（指纹）与**此刻已经写了多少章**（不一致的波及面）。
 * 读不出指纹就说「读不到」——**读不出不是「没变」**（那会让真被改过的人以为自己没问题）。
 */
function styleSpecChangeWhen(data) {
  const from = typeof data?.from === 'string' && data.from !== '' ? data.from : '读不到'
  const to = typeof data?.to === 'string' && data.to !== '' ? data.to : '读不到（文件已不在）'
  const n = Number.isSafeInteger(data?.chapters) ? data.chapters : null
  const written = n === null ? '' : `，此刻已写 ${n} 章`
  return `改动前 ${from} → 改动后 ${to}${written}`
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


/** 底层写入：只更新内存 + 标脏，落盘交给 setImmediate 与 sendJson 边界（见上）。
 *  ⚠️ 它**不再对外导出**（ADR-0016 决策 2）：engine 之外一律走 updateMeta / createMeta /
 *  appendEvent / rollbackLedger 这四个入口——别处的「整份写回」正是票 02 的根因
 *  （写回一份旧状态会把旧账高一起带回来）。 */
function writeMeta(meta) {
  metaCache.set(meta.id, structuredClone(meta))
  metaDirty.add(meta.id)
  if (metaFlushHandle === null) {
    metaFlushHandle = setImmediate(() => { metaFlushHandle = null; flushMeta() })
  }
}


/**
 * 状态写入的**单一入口**（ADR-0016 决策 2）：读 → 改 → 写收成一个动作，改法拿到的是**当场新读**的状态。
 *
 * 为什么要有它：原先的习惯是「先读一份状态 → 中途往账本记了一笔 → 再把手里那份**旧**状态整份写回去」。
 * 状态是内存缓存 + 延迟落盘，读优先命中缓存，所以写回旧状态不只覆盖磁盘，**同一瞬间的下一次读也拿到旧值**
 * ——账高被带回旧值，下一笔事件的序号于是重号或回退，前端「给我序号大于 N 的」增量拉取再也拉不到新事件
 * （票 timeline-seq-integrity/02 的根因）。收成单一入口后，「旧状态写回」这个形状在结构上不再可能。
 *
 * **账高（`eventCount`）与「最后动静时刻」（`updatedAt`）只归「记一笔」（appendEvent）所有**：
 * 改法里对这两个字段的任何改动一律丢弃（还原成写入前那份）。合法回退要「把账高调小」，
 * 那是 rollbackLedger 的事，不走这里。
 *
 * 改法必须**同步**（读到的就是写回的那一份；中间 await 出去，手里那份又成了旧状态）。
 * 返回写进去的那份状态，调用方据此读改完的字段。
 */
function updateMeta(projectId, mutator) {
  const meta = readMeta(projectId)
  if (meta === null) throw new Error(`textbook: unknown project ${JSON.stringify(projectId)}`)
  const ownedEventCount = meta.eventCount
  const ownedUpdatedAt = meta.updatedAt
  mutator(meta)
  meta.eventCount = ownedEventCount
  meta.updatedAt = ownedUpdatedAt
  writeMeta(meta)
  return meta
}


/** 建档：项目**还不存在**时的那第一笔写入（book-create / demo-run）。
 *  updateMeta 要求「已存在」（读→改→写），这条是「从无到有」，分开写——不让建档借道 updateMeta
 *  （那会逼它先编一份不存在的状态）。已存在时抛错：建档路径不许覆盖别人的书。 */
function createMeta(meta) {
  if (readMeta(meta.id) !== null) throw new Error(`textbook: project ${meta.id} already exists`)
  writeMeta(meta)
  return meta
}


/** 合法回退 · 账本重写（回退快照 / 深改截断 / 深改撤销共用这一份）：把 `timeline.jsonl` 换成 `events`，
 *  账高随之回到「笔数」——**这是「账高可以变小」的明文例外**（ADR-0016 决策 3），所以它刻意绕过
 *  updateMeta（updateMeta 会挡住对账高的改动，那正是它该做的）。
 *  - 给了 `restoredMeta`：整份换（回退快照 / 深改撤销，恢复到存档那一刻的状态）；
 *  - 没给：在**当场新读**的状态上只改账高（深改截断，其余字段由调用方随后的 updateMeta 改）。 */
function rollbackLedger(projectId, events, restoredMeta = null) {
  writeFileSync(timelinePath(projectId), events.map((event) => JSON.stringify(event)).join('\n') + (events.length > 0 ? '\n' : ''))
  const base = restoredMeta === null ? readMeta(projectId) : { ...restoredMeta }
  if (base === null) throw new Error(`textbook: unknown project ${JSON.stringify(projectId)}`)
  base.id = projectId
  base.eventCount = events.length
  writeMeta(base)
  return base
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
    case 'textbook/phase-start': return `🏁 阶段开始：${phaseEventHuman(data)}`
    case 'textbook/phase-end': return `✅ 阶段完成：${phaseEventHuman(data)}`
    case 'textbook/gate-proposal':
      return `📋 ${gateHuman(data.gate)} · 方案 v${data.version}：${data.title ?? ''}（工作台里可看完整方案）`
    case 'textbook/gate-decision':
      return data.approved === true
        ? `✅ 第 ${data.gate} 次拍板通过（v${data.version}）`
        : `↩️ 第 ${data.gate} 次拍板被驳回（v${data.version}），AI 正在修订`
    case 'textbook/rollback': return `⏪ 已回退到快照 ${data.snapshot ?? ''}`
    case 'textbook/error': return `⚠️ 出错（${stageLabelHuman(data.task)}）：${String(data.message ?? '').slice(0, 200)}`
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
    case 'textbook/pause': return `⏸ 已暂停（${data.reason ?? '用户在造书工作台点击暂停'}）`
    case 'textbook/resume': return `▶ 已继续`
    case 'textbook/outline-decision':
      return data.approved === true
        ? `✅ 章节安排已确认`
        : `↩️ 章节安排已被驳回，AI 正在重新安排`
    case 'textbook/gold-seal': return `🏆 最佳范例章已定稿（v${data.version ?? '?'}），意见沉淀入风格线（${data.count ?? 0} 条）`
    // 交工/提审被拒（票 01 (d)）：用户看得见机器挡下了什么——这正是被「机器报错、AI 说没事」坑过的那个用户。
    //
    // ⚠️ **这里也不印阶段**（票 `audit-matrix-contract/06`，2026-09-29 用户拍板选 ②）。
    // **不印的理由**：这句是**发给主笔 AI、由它转述给用户**的对话流播报（判定线③），不是给人直接看的
    // 界面行——它整句被 `.slice(0, 200)` 截断，再塞一个阶段前缀就是拿配额换一句用户已经能从横幅
    // 看到的话；而 `reason` 本身已经是**机器拟的可行动报错**，主笔 AI 拿到它就知道该回哪一步。
    // 界面上用户要读的那一格是事件行的**展开详情**（`src/ui/event-cards.js` 的 `replayRowDetail`），
    // 那里才印人话阶段词。**这不是漏了，是四个出口里逐个点名后的第三处「不印」。**
    case 'textbook/submit-rejected': return `🚫 交工被拒：${String(data.reason ?? '').slice(0, 200)}`
    // 票 12 · ①：机器替 AI 记「它改了机器契约」这一笔。**两个出口都开口**——
    // 《过程记录.md》是事后翻账的人看的，对话播报是**当下**就该让用户与主笔 AI 知道的那一条
    // （此刻已写的那些章是照改动前那一版写的，这是不一致的唯一一处可核证据）。
    case 'textbook/style-spec-change':
      return `📝 写作规范在范例章定稿后被改过（${styleSpecChangeWhen(data)}）`
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
 *  安全闸（2026-09-24 重做）：AI 回合进行中绝不 `session.append`。notice 虽不占回合号，
 *  但落在「assistant 工具调用」与「tool 结果」之间仍会破坏下轮请求的消息相邻性——
 *  下轮请求会带上**同一 tool_call_id 的两条结果**（宿主现造的占位 + 迟到真结果），
 *  模型接口以 400 拒绝（`{"model":"…"}` 畸形体），且该畸形历史一旦落盘，之后每个请求
 *  都 400、压缩也救不回来（2026-09-23 真机事故：整本《抑郁自救…》会话就此卡死）。
 *  旧实现扫 `session.events` 的 turn/start↔turn/end 判「回合是否进行中」——真机上没拦住
 *  （快照滞后），故改用宿主公开的 `agent.status`：
 *    - `running` → 走 `agent.inject`（inbox / next-step / 不唤醒），由宿主在步边界安全插入；
 *    - `idle`（或没有活的主 AI）→ 直接 append，此刻没有在飞的 tool 调用，安全；
 *    - 拿不到 status → 保守放弃这次播报（工作台时间线里仍可见，绝不冒险污染会话）。 */
function announceToSession(ctx, sessionId, text) {
  try {
    const firstLine = (text.split('\n', 1)[0] ?? text).trim()
    // user/message 的 data 就是消息本身（不是 assistant/message 的 {message:...} 包裹）。
    // 写错形状会让宿主模型请求构建时读 data.source.kind 崩（.kind undefined），已修。
    // ⚠️ source 必须是 **v4 的 producer-owned 形状**：`{ kind: 'plugin', plugin: '…' }` 那个
    // v3 包装已被宿主 0.1.7 的会话格式准入门**明确退役**（dsh-session-format-v3-to-v4
    // `source()`：`kind === 'plugin'` 直接抛 `format v4 message requires a producer-owned
    // source kind`，整轮判失败）。宿主自己的改写口径见同文件 `producerKind()`：
    // kind 变成 `plugin:<名字>`，且 **`plugin` 键被丢掉**，form/summary 原样保留。
    const message = {
      id: `tb-note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      role: 'user',
      source: { kind: 'plugin:dsh-craft-your-textbook', form: 'notice', summary: `工作台：${firstLine.slice(0, 60)}` },
      content: [{ type: 'text', text }],
    }
    const agent = ctx.get('agents')?.get?.(sessionId)
    if (agent !== undefined) {
      const status = typeof agent.status === 'string' ? agent.status : undefined
      if (status === 'running') {
        // ⚠️ 双轴 review（2026-09-29，票 announce-adjacency/02）修的两处：
        // 「保守放弃」在本函数里**只有一种报法**——放弃必须 warn。
        // 原来这里是静默 `return`，而同一条路径上「拿不到 status」是 warn 的：
        // 同一个动作、两种报法，用户排查时会以为「没有放弃」，实际是被丢掉了。
        if (typeof agent.inject !== 'function') {
          ctx.logger.warn('textbook: 播报跳过——agent.inject 不可用（宿主 facade 与本仓用的不是同一枚）')
          return
        }
        agent.inject(message)
        return
      }
      // ⚠️ 同上第二处：这条 warn 原文写「拿不到 agent.status」，但它**也**在
      // 「拿到了、且不是 idle」时触发（上游新增任何一个状态值都会落这里）。
      // 文案与覆盖范围不符 ⇒ 排查会被引向「facade 改名了」这个错方向。
      // 两个读数都点出来：**读到的值**与**它为什么不能当成收口**。
      if (status !== 'idle') {
        const read = status === undefined ? '读不到' : `读到 ${JSON.stringify(status)}`
        ctx.logger.warn(`textbook: 播报跳过——${read} agent.status，无法确认回合已收口（只有 idle 才落会话）`)
        return
      }
    }
    const session = ctx.get('sessions')?.get?.(sessionId)
    if (session === undefined) return
    session.append('user/message', message, { surfaceOp: 'append' })
  } catch (error) {
    ctx.logger.warn(`textbook: 主对话播报失败: ${String(error instanceof Error ? error.message : error)}`)
  }
}


/** 播报入口：低价值事件只进项目时间线；相邻事件合并成一条注入行
 *  （如「✅ 阶段完成：源探查 → 🏁 阶段开始：教学设计」）。
 *  暂存按 project 记（进程内即可；跨重启最多丢一次合并机会，无实质影响）。 */
const pendingPhaseEnd = new Map()


/** 拒收去重记忆：project → 上一次**已开口**的 `(stage, 逐字 reason)` 键（票 `audit-matrix-contract/04`，
 *  裁决**乙**：同 project 的**连续同文**拒收不再原样 inject 第二遍）。
 *
 *  ⚠️ 消的是「返工循环里同文反复堆叠」，**不是**「单次事件里 400 与 notice 各一份」——单次那两份
 *  来自**两个不同的面**（工具结果 400 / 对话流 notice），工具结果那一份本票不该动。
 *
 *  合并键：**三者全同**才合并（project 天然按 key 分桶，故比的是 `stage` + 逐字 `reason`）。
 *  两者是 `===` 逐字比，**刻意不用 `includes`／归一化**——票 02 铺满的 20 处 reason 逐字未改，
 *  「异文」是真实情形；宽松判据会把两次不同的拒收并成一条看不出所以然的记录。
 *  **至少保留第一次开口**：只有「上一次开口就是同一篇」时才吞掉这一次。
 *  任何**别的**播报插在中间即清空记忆——「连续」按对话流里真正相邻判，不是「同 project 历史上出现过」。
 *  进程内暂存即可（跨重启最多多播一次，与 `pendingPhaseEnd` 同一取舍）。 */
const lastRejectAnnounce = new Map()

/** 拒收的合并键：`stage` + NUL + **逐字** `reason`。分隔符取 NUL，任何 stage/reason 组合都不会撞键。 */
function rejectDedupKey(data) {
  const stage = String(data?.stage ?? '')
  return `${stage}\u0000${String(data?.reason ?? '')}`
}

function announceEventToSession(ctx, projectId, meta, event) {
  const sessionId = meta.session
  if (typeof sessionId !== 'string' || sessionId === '') return
  if (event.type === 'textbook/phase-end') {
    // 它迟早会占掉对话流里的一行 ⇒ 同样打断「连续」，一并清空拒收去重记忆。
    lastRejectAnnounce.delete(projectId)
    pendingPhaseEnd.set(projectId, { text: announceText(event), time: event.time })
    return
  }
  const text = announceText(event)
  if (text === null) return
  // 拒收去重（票 `audit-matrix-contract/04` · 乙）：只在「上一次开口就是同一篇」时吞掉这一次，
  // 所以第一次照旧开口（机器确实挡了的那条线索不许消失）。判据逐字，比键不含任何宽松匹配。
  if (event.type === 'textbook/submit-rejected') {
    const key = rejectDedupKey(event.data)
    if (lastRejectAnnounce.get(projectId) === key) return
    lastRejectAnnounce.set(projectId, key)
  } else {
    // 别的播报插在中间 ⇒ 不再「连续」：下一次同文拒收必须重新开口。
    lastRejectAnnounce.delete(projectId)
  }
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


/** 账本里已有的**最大序号**（空账本 -1）。给已坏的老账本补基线用：下一笔的序号必须**大于它**——
 *  否则既和账本里已有的一笔撞号，又小于前端已收到的最大序号（页面继续不更新，「只增且唯一」在这本书上
 *  永远不成立）。**刻意不缓存**：账本会被回退快照 / 深改截断（文件变小），缓存一份「曾经的最大值」
 *  正是新一类旧值 bug。账本不大，这段 O(行数) 的读只在「记一笔」时发生。 */
function ledgerMaxSeq(projectId) {
  let max = -1
  for (const event of readEvents(projectId)) {
    if (Number.isSafeInteger(event?.seq) && event.seq > max) max = event.seq
  }
  return max
}


/** 「记一笔」：账本与「账高 / 最后动静时刻」的**唯一**写入者（ADR-0016 决策 1）。
 *  序号取「账高」，但已坏的老账本（账高小于账本最大序号）只补基线——**不重写旧行、不重排序号**。 */
function appendEvent(projectId, type, data, duration) {
  if (!EVENT_TYPES.has(type)) throw new Error(`textbook: unknown event type ${JSON.stringify(type)}`)
  const meta = readMeta(projectId)
  if (meta === null) throw new Error(`textbook: unknown project ${JSON.stringify(projectId)}`)
  const path = timelinePath(projectId)
  const seq = Math.max(meta.eventCount ?? 0, ledgerMaxSeq(projectId) + 1)
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
 * （readdirSync + unlinkSync/rmdirSync，实测安全）；删不干净时**按平台兜底**——
 * Windows 走 `cmd /c rmdir /s /q`（这条路上 fs.rmSync 不能用，中文路径会原生崩溃），
 * POSIX 走 fs.rmSync 递归（那条原生崩溃是 Windows 独有的，POSIX 上没有理由不用）——
 * 再失败则保留待下次清理。
 *
 * 两个分支都得在：兜底被 `process.platform === 'win32'` 整段门住的话，非 Windows
 * 上「删不干净」就等于「永远不删」（书夹留在原处），而这类差异只有换台机器才看得见。
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
  if (existsSync(src)) {
    if (process.platform === 'win32') {
      try { execFileSync('cmd', ['/c', 'rmdir', '/s', '/q', src], { stdio: 'ignore' }) } catch { /* 保留待下次清理 */ }
    } else {
      try { rmSync(src, { recursive: true, force: true }) } catch { /* 保留待下次清理 */ }
    }
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


/** 截断/回退时把用户的声音（风格线/豁免/未处理留言/**抽查意见**）合并回恢复后的 meta：现在优先，按 id 去重。 */
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
  // 票 13（spec 第 7 条 / 不变量 5「账本与 meta 同源」）：抽查意见也是「用户的声音」，回退的合并口
  // 原先只并 styleNotes/waivers/interventions，于是回退会把**快照之后新提的意见整批丢掉**（用户提了
  // 意见却再也看不到），也会把快照里已 applied/revoked 的旧状态盖回现在已翻案的那条上。两处一起并。
  // 老账本的意见可能没有 id（票 09 之前的入账）→ 退化成「章号 + 意见原文」当键，仍能去重、仍不丢。
  const reviewKey = (r) => (typeof r?.id === 'string' && r.id !== '' ? r.id : `#${r?.chapter ?? '?'}:${String(r?.comment ?? '')}`)
  restoredMeta.pendingReviews = mergeList(restoredMeta.pendingReviews, currentMeta?.pendingReviews, reviewKey)
  return restoredMeta
}


/** 目录里现有的最大快照号（没有 / 读不到时 0）——「快照文件名序号永不复用」的判据来源。
 *  注意这是**快照文件名序号**，与账本序号 / 账高（ADR-0016）是两套编号，别混。 */
function maxSnapshotSeqOnDisk(projectId) {
  let max = 0
  try {
    for (const name of readdirSync(snapshotsDir(projectId))) {
      const hit = /^(\d+)\.json$/.exec(name)
      if (hit !== null) max = Math.max(max, Number(hit[1]))
    }
  } catch { /* 目录读不到：退化为只用 meta.snapshotSeq */ }
  return max
}


function writeSnapshot(projectId, reason) {
  const events = readEvents(projectId)
  // 快照序号只增：读→改→写收在 updateMeta 里（这里也刻意不再写 updatedAt——「最后动静时刻」
  // 只归「记一笔」所有；调用方随后都会落一条事件，时刻由那条事件定）。
  // 票 workbench-transitions/19：`restoreSnapshot` 用 `{ ...snapshot.meta }` 把旧 `snapshotSeq` 一并写回，
  // 只按「旧号 + 1」就会落到一个**已经存在**的 `<seq>.json` 上、把旧存档整份覆盖掉（回退＝丢版本）。
  // 所以号取「目录现有最大号」与 `meta.snapshotSeq` 的较大者再 +1——文件名序号**永不复用**。
  const meta = updateMeta(projectId, (state) => {
    state.snapshotSeq = Math.max(maxSnapshotSeqOnDisk(projectId), state.snapshotSeq ?? 0) + 1
  })
  const snapshot = { seq: meta.snapshotSeq, eventCount: meta.eventCount ?? events.length, time: Date.now(), reason, meta, events }
  writeFileSync(join(snapshotsDir(projectId), `${meta.snapshotSeq}.json`), JSON.stringify(snapshot, null, 2) + '\n')
  return { seq: snapshot.seq, time: snapshot.time, reason }
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
  const meta = { ...snapshot.meta }
  // 截断/回退保留用户声音：把截断前的风格线/豁免/未处理留言并回恢复后的 meta（现在优先）。
  mergeUserVoice(readMeta(projectId), meta)
  // 合法回退：账本截短、账高随之变小（ADR-0016 决策 3）——走 rollbackLedger 这条明文例外。
  // （原先这里还自己写了一次 updatedAt；「最后动静时刻」只归「记一笔」，由下面那条 rollback 事件定。）
  rollbackLedger(projectId, events, meta)
  return appendEvent(projectId, 'textbook/rollback', { snapshot: snapshotSeq, reason: snapshot.reason })
}


// ── 关卡折叠 ────────────────────────────────────────────────────────────────

function foldGate(projectId, wanted = null) {
  const events = readEvents(projectId)
  let proposal = null
  let decision = null
  // 最近一次**决策事件**裁的是哪一版（票 workbench-transitions/23）。它与 `decision` 分家：
  // 新提案会把 `decision` 重置为 null（"v3 还没拍板"），但"v2 已经拍过了"是历史事实、不能跟着清。
  let decidedVersion = null
  for (const event of events) {
    // ⚠️ 2026-09-21 修：原来只看「最后一个提案」，于是按 gate 号折叠时全靠运气——
    // 第 1/2 次拍板返回的折叠结果挂着第 3 次拍板的 gate 号，调用方 `folded.gate === gate`
    // 判不等就整条丢掉，decision 一起丢；于是阶段页上「第 1、2 次拍板」永远不显示拍板结论，
    // 只有碰巧是最后一次的那个才显示（用户实测：三张卡只有第三张有「拍板：✅ 通过」）。
    // 现在给了 wanted 就**按 gate 号**折，每张卡各拿自己那一次的提案与结论。
    if (wanted !== null && String(event.data?.gate ?? '') !== String(wanted)) continue
    if (event.type === 'textbook/gate-proposal') {
      proposal = event
      decision = null
    } else if (event.type === 'textbook/gate-decision' && proposal !== null) {
      decision = event
      if (typeof event.data.version === 'number') decidedVersion = event.data.version
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
    // 票 workbench-transitions/23：`version` 是**最新提案**的版次（awaiting 时也照样是新提案），
    // 「定下来的那一版」是最近一次决策事件当时裁决的那个——决策事件自带 `version`（gates.js 落账形状），
    // 记在 `decidedVersion` 上、**不随新提案重置**（v2 已定、v3 在等，两件事都要说得出来）。
    // 两者分家，阶段页的结论行才不会把「正在等拍板」渲染成「已驳回 · 第 M 版」。
    decidedVersion,
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


/**
 * 金标准定稿沉淀（票 15④）：把「最佳范例章」尚未撤销的意见转成风格线（`source:'gold'`），
 * 记下金标准母版版本号，落一条 `textbook/gold-seal` 事件——**只负责沉淀，不负责推进状态机**。
 *
 * 从 `actions/gold.js` 的 `gold-approve` 里抽出，因为现在有第二个调用者：`stage-submit gold` 在
 * `gold-skip` 豁免生效时（用户已同意跳过「最佳范例章确认」这道闸门）自动定稿。两条路径共用这一份
 * 沉淀逻辑，不许各写一份（否则「跳过确认」会连风格线一起跳过，等于偷偷放宽了下游判据）。
 * 返回是否真的沉淀了（无未撤销意见时不写 `goldSealed`——既有语义：零意见通过不写，被「阶段 ≥ 5」兜住）。
 */
function sealGoldStandard(projectId) {
  // 无未撤销意见时不写 `goldSealed`（既有语义：零意见通过不写，被「阶段 ≥ 5」兜住）——先做只读预检，
  // 真正的沉淀在改法里对**当场新读**的状态做：两个调用方原先各自把手里的旧状态当参数递进来，
  // 写回时把 appendEvent 刚推进的账高一起带回了旧值（参数透传变体，见票 02）。
  if ((readMeta(projectId)?.goldOpinions ?? []).filter((o) => o.status !== 'revoked').length === 0) return false
  let seal = null
  updateMeta(projectId, (meta) => {
    const sealOpinions = (meta.goldOpinions ?? []).filter((o) => o.status !== 'revoked')
    if (sealOpinions.length === 0) return // 预检之后被并发撤销光了：一个字都不改
    const sealed = []
    sealOpinions.forEach((o, i) => {
      const kindText = o.kind === 'dislike' ? '不要这种写法' : o.kind === 'drop' ? '不要这类内容' : '要照此修改'
      sealed.push({
        id: `sn-gold-${Date.now().toString(36)}-${i}`,
        text: `${o.target === null ? '' : `${o.target.hint || `第${o.target.para}段`}：`}${kindText}--${o.wish}`,
        at: Date.now(), source: 'gold', status: 'active', note: `来自最佳范例章意见#${i + 1}`,
      })
      o.status = 'applied'
    })
    meta.styleNotes = [...(meta.styleNotes ?? []), ...sealed]
    const goldVersions = readEvents(projectId).filter((e) => e.type === 'textbook/agent-end' && String(e.data?.label ?? '').includes('最佳范例章')).length
    meta.goldSealed = { version: Math.max(1, goldVersions), at: Date.now() }
    seal = { version: meta.goldSealed.version, count: sealed.length }
  })
  if (seal === null) return false
  updateStyleLineMirror(projectId)
  appendEvent(projectId, 'textbook/gold-seal', seal)
  return true
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
  // ⚠️ 票 walkthrough-fixes/01（走查 P41）：这条原来是**无声**的 return false。注册表里
  // 根本没有这本书的会话时（宿主刚重启、agent 还没起来），调用方拿到的也只是「没叫醒」，
  // 没有任何一条线索指向「为什么」。这里补一条 warn：现场日志里能直接看到是「注册表里没有
  // 那个会话」，而不是再去猜是权限、是来源校验还是别的地方出的错。
  if (agent === undefined) {
    ctx.logger.warn(`textbook: 唤醒主 AI 失败：agents 注册表里没有会话 ${sessionId}（项目 ${projectId}）`)
    return false
  }
  // 交办唤醒消息是给人看的（CONTEXT.md：机器以 plugin+notice 注入对话流，不冒充用户），
  // 所以这里用界面词；账本里那条 stage-start 仍记机器 label（见 handoff，机器身份词不动）。
  const label = stageLabelHuman(stageLabel(meta.pendingStage, meta.pendingGate ?? null))
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
    // v4 producer-owned source（不是已退役的 `{ kind: 'plugin', plugin: … }` 包装）——
    // 那一版会被宿主 0.1.7 的会话准入门整轮判失败，病因与口径见 announceToSession 上方注释。
    source: { kind: 'plugin:dsh-craft-your-textbook', form: 'notice', summary: `工作台：轮到 AI 动手（${label}）` },
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
 *
 * `snapshotReason`（票 pipeline-wiring-gaps/08）：快照的 `reason` 是回退轴上唯一可读的字。例行交办一律写
 * 「交办「X」之前」；**驳回触发的重做**要给一句能分得开的措辞（探查驳回的那次交办也是
 * `stage='explore'`，不另给措辞就在回退轴上与第一次交办长得一模一样）。
 * 不给就沿用例行措辞，所以既有 10 处调用一个字都不用改。
 */
function handoff(ctx, projectId, stage, gate = null, snapshotReason = null) {
  updateMeta(projectId, (meta) => {
    meta.pendingStage = stage
    meta.pendingGate = gate
    meta.wakeToken = (meta.wakeToken ?? 0) + 1
    meta.status = 'running'
  })
  const label = stageLabel(stage, gate)
  const artifact = artifactDataForStage(stage, gate, goldN(readMeta(projectId)))
  appendEvent(projectId, 'textbook/stage-start', {
    stage, gate, label,
    path: artifact.path,
    chapter: artifact.chapter,
  })
  try {
    writeSnapshot(projectId, snapshotReason ?? `交办「${stageLabelHuman(label)}」之前`)
  } catch { /* 快照失败不影响交办 */ }
  return wakeMainAI(ctx, projectId)
}


/** 某章的两份产物路径。 */
function chapterArtifacts(projectId, n) {
  const file = `chapter-${String(n).padStart(2, '0')}.md`
  const audit = `audit-${String(n).padStart(2, '0')}.md`
  return { file, audit, chapterPath: workFile(projectId, file), auditPath: workFile(projectId, audit) }
}


/**
 * 该章「机器记下的交工通过」——只认账本里已存在的机器证据，**不按文件存在兜底**（票 14 / 票 05 裁决 A）。
 *
 * 判据（两选一，都是写入点早就存在的事件，本程不新造能力）：
 *  ① **章级交工**：`textbook/agent-end` 且 `outcome === 'ok'`，label 里的**第一处章号**＝该章号
 *     （「第N章」是跨通道稳定的机器身份词）。真实通道＝`stage-submit chapters`（小助手执笔 + 小助手审计
 *     + 机器验货），label 形如「第N章《标题》完成（…）」；演示通道＝`demoWriteChapters` 的「写第N章」。
 *  ② **最佳范例章那一章**：`goldN(meta)` 那一章由「最佳范例章」这一步写的就是该章正文，所以那一步交工
 *     ＝该章交工。label 的真实形态是 `最佳范例章`（真实通道）/`最佳范例章（先写一章给你看）`（演示通道），
 *     只认前四个字即可覆盖两者——**不改 demo 轨迹、不重录 cassette**。
 *
 * ⚠️ 章号必须**取 label 里第一处**再与 n 严格比对，不能用 `label.includes('第N章')`：
 * 真实 label 是「第3章《…》完成」，**标题里只要出现「第5章」字样**（如「第1章《第2章的秘密》完成」），
 * 用 includes 就会把第 5 章误判成已交工 → 过目闸门放行未交工的章。
 */
function chapterHasSubmitEvent(projectId, n, meta = null, events = null) {
  const gold = goldN(meta ?? readMeta(projectId) ?? {})
  for (const event of events ?? readEvents(projectId)) {
    if (event.type !== 'textbook/agent-end') continue
    const label = String(event.data?.label ?? '')
    if (event.data?.outcome === 'ok') {
      const first = /第(\d+)章/.exec(label)
      if (first !== null && Number(first[1]) === n) return true
    }
    // 「最佳范例章」那条独立分支：它本身不带章号，走 goldN(meta) 定位
    if (label.includes('最佳范例章') && gold === n) return true
  }
  return false
}


/**
 * 票 22：**正文一改，审过就失效**——检查记录必须**晚于**当前这份正文才算审过它。
 *
 * 判据是**两个文件的 mtime 谁更晚**，与 `src/workflow.js` 的 `buildArtifactFacts` 里那条
 * 「新鲜度是服务端事实」**同一口径**（那边算给界面看，这边卡住闸门；两边读的是同一对文件）。
 * 读不到 mtime（stat 抛了）时**不判旧稿**——「读不出」不许当成「有问题」，那会让一本正常书
 * 凭空被拦住；那种情况下上面的「两份产物在」已经扛住了最要紧的那一半。
 */
function chapterAuditOlderThanChapter(chapterPath, auditPath) {
  try {
    return statSync(auditPath).mtimeMs < statSync(chapterPath).mtimeMs
  } catch {
    return false
  }
}


/**
 * 过目闸门「全部章节都写好了」的单章判据（票 14，**界面数字与闸门共用这一份**，不许写第二份）：
 *  ① 两份产物存在（`work/chapter-NN.md` ＋ `work/audit-NN.md`，今天已有）；
 *  ② **检查记录不比正文旧**（票 22：正文在审计之后又改过 ⇒ 那份审计审的是旧稿，「审过」当场失效）；
 *  ③ 该章有机器记下的「交工通过」（见 chapterHasSubmitEvent）；
 *  ④ 该章**没有未处置（`status === 'pending'`）的抽查意见**——这条是票 10「翻案 → 这本书重新被拦住」
 *     的服务端一半：翻案把意见写回 `pending` 之后，**即使该章早就交工过**，过目闸门也必须重新拦住它。
 *
 * ⚠️ ② 是**验货**那一半，不是显示那一半（票面 :48-53）：没被审过的正文带着「已审过」进合并、
 *  进交付，比「清单没刷新」严重一个量级。而它必须落在这里——界面的「已完成 X/Y 章」与章徽章
 *  取的就是这一份（票 14 的同源不变量），写在别处就是「两个数字打架」的老病复发。
 *
 * 老书/在建书不新造迁移：某章没交工就重新走既有逐章交工（`stage-submit chapters` 那个写入点在），
 * **不退回到「按文件判」兜底**（不变量 2）。
 */
function chapterDone(projectId, n, meta = null, events = null) {
  return chapterGateMiss(projectId, n, meta, events) === null
}


/**
 * 同一份判据的「差在哪一项」形态（**不重复判据，只给结论起个名**）：
 * 满足返回 `null`，不满足返回 `{ reason: 'artifact' | 'stale' | 'review' | 'submit' }`——
 * `chapters-review-confirm` 闸门要据此说清「是产物缺、还是审的是旧稿、还是该章有未处置意见、还是压根没交工」。
 * 四项与 chapterDone 一一对应，顺序也一致。
 */
function chapterGateMiss(projectId, n, meta = null, events = null) {
  const { chapterPath, auditPath } = chapterArtifacts(projectId, n)
  if (!existsSync(chapterPath) || !existsSync(auditPath)) return { reason: 'artifact' }
  if (chapterAuditOlderThanChapter(chapterPath, auditPath)) return { reason: 'stale' }
  const current = meta ?? readMeta(projectId)
  const pending = (current?.pendingReviews ?? []).some((r) => r?.chapter === n && r?.status === 'pending')
  if (pending) return { reason: 'review' }
  if (!chapterHasSubmitEvent(projectId, n, current, events)) return { reason: 'submit' }
  return null
}


/** 播报上下文：appendEvent 播报主对话用的唯一跨切面依赖。
 *  显式契约：仅 apply 调 bindAnnounce 绑定一次；未绑定时不播报（只进项目时间线）。 */
let announceCtx = null


function bindAnnounce(ctx) {
  announceCtx = ctx
}



/** 主 AI 上下文占用的读数口（票 28 / 走查 P46）：领任务说明要带上它，好让主笔 AI 知道自己该收尾了。
 *
 *  数据源是宿主自己算的那份 `contextPressure` **会话投影**——与宿主输入区角标
 * 「上下文已用 51%」同一份数据。本模块**不 import 任何宿主包**，读数由宿主侧经
 * `bindContextOccupancy` 注入（同 `bindAnnounce` 的显式契约：只有 apply 绑一次）。
 *
 *  绑定方给的 reader 形状：`(sessionId) => number | null`，返回**占用百分比**。
 * 百分比算式只有一份，在 `src/domain-rules.js` 的 `contextOccupancyPercent`
 * （`src/ui/rules.js` 只是再导出；逐字照宿主 `contextOccupancy()`）。
 * 本模块 import 的**就是那同一个模块**（领域规则模块被 esbuild 打进前端、也被 node ESM
 * 后端直接 import，这是它被选为这一份的理由），所以不重算不是「没法共享」，
 * 抄第二份算式才是本仓在治的病（同一件事两份实现 → 改一处必漏两处）。
 *
 *  ⚠️ 未绑定 / reader 抛错 / 返回的不是有限数 → 一律 null，
 * brief 里那一句**整句不出现**（绝不写 0%、绝不编一个百分比）。 */
let contextOccupancyReader = null


function bindContextOccupancy(reader) {
  contextOccupancyReader = typeof reader === 'function' ? reader : null
}


/** 当前会话的主 AI 上下文占用百分比；读不到就是 null（界面/brief 都照此不显示）。 */
function readContextOccupancy(sessionId) {
  if (contextOccupancyReader === null) return null
  if (typeof sessionId !== 'string' || sessionId === '') return null
  let percent
  try {
    percent = contextOccupancyReader(sessionId)
  } catch {
    return null // 读数是辅助信息，读不到不许把领任务说明整个带崩
  }
  return Number.isFinite(percent) ? percent : null
}


/** 领任务说明里那一句（只在读得到数时出现）。
 *  给主笔 AI 看的口径与界面上那一句同源：这是**计量**、不是状态词（CONTEXT.md 三词上限不动）。 */
function contextOccupancyBriefLine(sessionId) {
  const percent = readContextOccupancy(sessionId)
  if (percent === null) return null
  return `上下文已用 ${percent}%（主 AI 这一场的上下文用量，只增不减；上下文满了会压缩正在追的活、还没落账的结论，必要时请用户早点介入：暂停、砍章节、提前过目）。`
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


/** 提案正文的一级标题（人读：《提案/关卡N-vX.md》的第一行）。
 *  文件名与路径是**机器身份词**（不改，锚定它的正则见 domain-rules 的提案白名单）；
 *  但这一行标题是写给人读的（判定线②），所以走界面词模板。导出以便用词不变量断言直调
 *  真实产出函数（票 01），不在测试里复制模板字符串。 */
export function proposalHeading(gate, version, title) {
  return `# ${gateHuman(gate)} · 方案 v${version}：${title}`
}


/** 关卡方案落盘为可读文档（提案/关卡N-vX.md）。 */
function writeProposalDoc(projectId, gate, version, title, summary, detail) {
  try {
    const dir = join(projectDir(projectId), '提案')
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      join(dir, `关卡${gate}-v${version}.md`),
      `${proposalHeading(gate, version, title)}\n\n## 摘要\n\n${summary}\n\n## 完整方案\n\n${detail}\n`,
    )
  } catch { /* 文档失败不影响主流程 */ }
}


/** 提交关卡提案（状态机内部与 action 共用）。 */
function proposeGate(projectId, gate, title, summary, detail) {
  writeProposalDoc(projectId, gate, 1, title, summary, detail)
  const snapshot = writeSnapshot(projectId, `提交「${gateHuman(gate)}」方案之前`)
  const event = appendEvent(projectId, 'textbook/gate-proposal', {
    gate, version: 1, title, summary, detail,
  })
  void snapshot
  return event
}


function proposeRevision(projectId, gate, version, title, summary, detail) {
  writeProposalDoc(projectId, gate, version, title, summary, detail)
  writeSnapshot(projectId, `修订「${gateHuman(gate)}」方案 v${version} 之前`)
  return appendEvent(projectId, 'textbook/gate-proposal', {
    gate, version, title, summary, detail,
  })
}


function advance(projectId, fromPhase, toPhase) {
  // 先落「阶段结束」再改状态、最后落「阶段开始」：原先「改状态 → 整份写回旧状态 → 记一笔」的顺序
  // 每次阶段推进都必产一个重号（票 02 的机制一）。现在状态改在 updateMeta 里（不碰账高），
  // 两笔事件的序号都来自「记一笔」自己那份当场新读。
  if (fromPhase !== undefined) {
    appendEvent(projectId, 'textbook/phase-end', { phase: fromPhase, label: PHASE_LABELS[fromPhase] })
  }
  updateMeta(projectId, (meta) => {
    meta.phase = toPhase
    meta.status = 'running'
  })
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
    updateMeta(projectId, (state) => { state.converting = false })
  }
  // 逐本转换，全部转完才进下一阶段（此前只转一本就停，是 bug）。
  // ⚠️ 每一轮**重新读状态**：这一支原本一路握着开工时那份旧状态（转换要 await，期间账本/状态都在动），
  // 收尾时整份写回＝累积性回退（把账高拉回开工时的值，票 02 的真账本第 94 行就是这么来的）。
  for (;;) {
    const current = readMeta(projectId)
    const currentSources = current?.sources ?? []
    const pending = currentSources.filter((source) => source.converted !== true)
    if (pending.length === 0) {
      advance(projectId, 1, 2)
      return 'advanced'
    }
    const source = pending[0]
    const sourcePath = join(sourcesDir(projectId), source.file)
    if (!existsSync(sourcePath)) {
      updateMeta(projectId, (state) => { state.status = 'error' })
      appendEvent(projectId, 'textbook/error', { task: '材料', message: `源文件缺失: ${source.file}` })
      return 'error'
    }
    updateMeta(projectId, (state) => { state.converting = true })
    // 批量转换全部待转 PDF（一次提交并行解析；每本结果按 file_name 落到独立子目录）。
    const startedAt = Date.now()
    appendEvent(projectId, 'textbook/agent-start', { label: `批量转换 ${pending.length} 本 PDF` })
    try {
      const items = pending.map((item) => {
        const index = currentSources.indexOf(item)
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
      // F26（2026-08-20）：记录人话错误文案（mineru-lib 已把页数超限/Token 失效归一成人话），前端 error 卡直接展示。
      const humanMessage = failed.length === 0
        ? null
        : `${failed.length} 本转换失败：${failed.map((f) => `${f.name}（${f.error ?? '未知错误'}）`).join('；')}`
      // 转换结果写回**当场新读**的那份（按文件名找条目，不按开工时那份数组的下标）。
      updateMeta(projectId, (state) => {
        state.converting = false
        for (const result of results) {
          if (result.ok !== true) continue
          const target = (state.sources ?? []).find((s) => s.file === result.name)
          const item = items.find((it) => it.name === result.name)
          if (target === undefined || item === undefined) continue
          target.converted = true
          target.md = join(item.sub, 'full.md')
        }
        if (humanMessage !== null) {
          state.lastErrorHuman = humanMessage
          state.status = 'error'
        }
      })
      if (humanMessage === null) {
        appendEvent(projectId, 'textbook/agent-end', { label: `批量转换 ${pending.length} 本 PDF`, outcome: 'ok' }, Date.now() - startedAt)
      } else {
        appendEvent(projectId, 'textbook/error', {
          task: '转换',
          message: humanMessage,
        })
        return 'error'
      }
    } catch (error) {
      const message = String(error instanceof Error ? error.message : error)
      // F26（2026-08-20）：同上，把人话错误落 meta.lastErrorHuman（旧账本读取时 ?? null 兜底）。
      updateMeta(projectId, (state) => {
        state.converting = false
        state.status = 'error'
        state.lastErrorHuman = message
      })
      appendEvent(projectId, 'textbook/error', {
        task: '转换',
        message,
      })
      return 'error'
    }
  }
}


/** 真实模式：源探查交办给主 AI；演示模式：内置回放（共用产物判定/推进语义）。 */
/** 幂等置态 + 提示（状态没变就不重复写账/发提示）。真实与演示共用。
 *  ⚠️ 原先它还收一个 `meta` 参数——9 个调用方里 5 个递的是自己手里那份**旧状态**（长跑期间拿的），
 *  写回时把账高一起带回旧值（参数透传变体，票 02）。现在它自己去读，参数透传这个形状没有了。 */
function ensureStatus(projectId, status, hint) {
  let changed = false
  updateMeta(projectId, (meta) => {
    if (meta.status === status) return
    meta.status = status
    changed = true
  })
  if (changed && hint !== undefined) appendEvent(projectId, 'textbook/hint', { text: hint })
}


/** 演示模式统一步进：agent-start → 生成 → agent-end → 后续（置态/推进）。
 *  真实模式由主 AI 经 stage-brief/stage-submit 完成（见各 runPhaseX）；
 *  demo 是内置回放适配器，只做内容编排，状态机步进与真实共用 ensureStatus/advance/recordAgentError。 */
async function demoStep(ctx, projectId, meta, label, exec, after) {
  const runtime = projectRuntime(ctx, projectId, meta)
  const artifact = artifactDataForLabel(label, goldN(meta))
  const startedAt = Date.now()
  appendEvent(projectId, 'textbook/agent-start', { label, path: artifact.path, chapter: artifact.chapter })
  try {
    await exec(runtime)
    appendEvent(projectId, 'textbook/agent-end', { label, outcome: 'ok', path: artifact.path, chapter: artifact.chapter }, Date.now() - startedAt)
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
      ensureStatus(projectId, 'awaiting-explore', EXPLORE_DONE_HINT)
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
      ensureStatus(projectId, 'awaiting-explore', EXPLORE_DONE_HINT)
      return 'waiting'
    })
  }
  // 真实模式：源探查交办给主 AI；产物已存在则等人确认（explore-confirm）后推进。
  if (existsSync(workFile(projectId, 'explore.md'))) {
    if (meta.exploreConfirmed === true) {
      advance(projectId, 2, 3)
      return 'advanced'
    }
    ensureStatus(projectId, 'awaiting-explore', EXPLORE_DONE_HINT)
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
        // 票 14（承诺账 G）：界面的「回退」只到最近一次存档，**回不到更早的拍板点**——
        // 「回到更早的拍板点并重做下游」只有定点修改能做（CONTEXT.md：「回退（快照）」与
        // 「定点修改」是两条路，勿混用）。这句话由主笔 AI 转述给用户，说错路名用户就找不到。
        text: `这一关已经来回 ${rejectCount} 次了。如果一直不满意，可以在对话里调整目标或换一种思路，或者用「定点修改」回到更早的拍板点重新来。`,
      })
    }
    const runtime = projectRuntime(ctx, projectId, meta)
    const label = version === 1 ? `设计提案·关卡${gate}` : `设计提案·关卡${gate}·修订v${version}`
    const artifact = artifactDataForLabel(label, goldN(meta))
    const startedAt = Date.now()
    appendEvent(projectId, 'textbook/agent-start', { label, path: artifact.path, chapter: artifact.chapter })
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
      appendEvent(projectId, 'textbook/agent-end', { label, outcome: 'ok', path: artifact.path, chapter: artifact.chapter }, Date.now() - startedAt)
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
        // 改在改法里写（不拿手里那份旧状态整份写回）：生成要 await，期间账本可能已经动过。
        updateMeta(projectId, (state) => { state.outline = outline })
        // ⚠️ 演示模式写的是**同一份 JSON**（与 `actions/chapters.js` 的真实模式一个文件、一个形状）：
        // 所以产物判据对两条路是同一条——`work/outline.md` 判 `'inline'`、不开右栏预览
        // （票 pipeline-wiring-gaps/09），人读形态是章节安排确认卡与阶段页第 3 阶段的就地折叠清单。
        writeWork(projectId, 'outline.md', JSON.stringify(outline, null, 2))
      })
      if (outlineResult !== 'advanced') return outlineResult
    }
    // 票 10（判定一 #7）：按钮名统一成「🔁 让 AI 重做」，这句告诉用户点哪个按钮的播报跟着改。
    ensureStatus(projectId, 'awaiting-outline', '📐 章节安排出来了，请在工作台查看：满意点「✅ 通过」，不满意点「🔁 让 AI 重做」，AI 会重新安排。')
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
    ensureStatus(projectId, 'awaiting-gold', '📖 最佳范例章写好了，请在工作台查看：满意点「✅ 满意，继续写全书」，不满意点「❌ 重写」。')
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
        appendEvent(projectId, 'textbook/hint', { text: '最佳范例章检查发现待完善项，已随章记录，可在交付前查看。' })
      }
    }, async () => {
      // 对齐真实模式 stage-submit gold：新稿落地即意见转 applied、本轮重做意见用毕即清。
      updateMeta(projectId, (state) => {
        if (Array.isArray(state.goldOpinions)) {
          for (const o of state.goldOpinions) if (o.status === 'sent') o.status = 'applied'
        }
        delete state.goldRedoNote
      })
      ensureStatus(projectId, 'awaiting-gold', '📖 最佳范例章写好了，请在工作台查看：满意点「✅ 满意，继续写全书」，不满意点「❌ 重写」。')
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
      // 票 14「演示通道照旧走到过目」：范例章那一章在第 4 阶段就已落盘（`chapter-0N.md` ＋ audit），
      // 这里原本直接 `continue`——于是这一章**永远没有章级完成事件**，新闸门（两份产物在 ＋ 机器记下的
      // 交工通过）在 demo 上就永远为假，demo 会卡死在过目门前。
      // 处置：**在这里补写入点**（不重写产物、不动内容），落一条与下面新写章节同形状的「写第N章」事件。
      // 判据不给 demo 开口子（spec 第 6 条：若某条演示流程缺章级事件，就在那里补写入点）。
      if (!chapterHasSubmitEvent(projectId, n, meta)) {
        const artifact = artifactDataForChapter(n)
        appendEvent(projectId, 'textbook/agent-end', { label: `写第${n}章`, outcome: 'ok', path: artifact.path, chapter: artifact.chapter })
      }
      continue
    }
    const runtime = projectRuntime(ctx, projectId, meta)
    const title = chapters[index].title ?? `第${n}章`
    const artifact = artifactDataForChapter(n)
    const writeStartedAt = Date.now()
    appendEvent(projectId, 'textbook/agent-start', { label: `写第${n}章《${title}》`, path: artifact.path, chapter: artifact.chapter })
    try {
      const written = await generateContent(runtime, 'chapter', {
        n, title, outline: chapters[index].outline ?? '', styleSpec,
        targetWords: chapters[index].targetWords ?? meta.targetWords,
        chapterSource: chapters[index].source ?? '',
      })
      // demo 通道的 chapter 产物是字符串（demoChapterWrite 直接返回正文），不是 {text} 对象。
      writeWork(projectId, file, written)
      appendEvent(projectId, 'textbook/agent-end', { label: `写第${n}章`, outcome: 'ok', path: artifact.path, chapter: artifact.chapter }, Date.now() - writeStartedAt)
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
  const artifact = artifactDataForLabel('合并成书', goldN(meta))
  const startedAt = Date.now()
  appendEvent(projectId, 'textbook/agent-start', { label: '合并成书', path: artifact.path })
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
    appendEvent(projectId, 'textbook/agent-end', { label: '合并成书', outcome: 'ok', path: artifact.path }, Date.now() - startedAt)
  } catch (error) {
    return recordAgentError(projectId, '合并成书', error)
  }
}


/** 真实模式：铺章交办给主 AI（小助手执笔 → 小助手审计 → 主 AI 终审），全部完成后交办合并；演示模式：回放编排。 */
async function runPhase5(ctx, projectId, meta) {
  if (meta.demo) {
    // 演示模式：与真实共用「全部写完 → 全章过目闸门 → 合并」的步进语义，内容来自内置回放。
    // 过目闸门判据与真实同源（chapterDone，票 14）：演示通道逐章写「写第N章」的 agent-end、
    // 范例章那章另有一条「最佳范例章（先写一章给你看）」——写入点早已存在，这里只是让闸门读它，
    // 所以 demo 轨迹零变化（ADR-0004，不重录 cassette）。
    const chapters = meta.outline?.chapters ?? []
    const allDone = chapters.length > 0 && chapters.every((_chapter, index) => chapterDone(projectId, index + 1))
    if (allDone) {
      if (!existsSync(workFile(projectId, 'book.md'))) {
        // 全章过目闸门（与真实共用）：写完先请人过目，通过才合并。
        if (meta.chaptersReviewed !== true) {
          ensureStatus(projectId, 'awaiting-chapters-review', '📚 全部章节都写好了！请在工作台逐章过目：想细看就点「看看这章」，有意见直接写（AI 会照改）；都满意了点「✅ 都过了，交工」开始合并。')
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
    ensureStatus(projectId, 'awaiting-chapters-review', '📚 全部章节都写好了！请在工作台逐章过目：想细看就点「看看这章」，有意见直接写（AI 会照改）；都满意了点「✅ 都过了，交工」开始合并。')
    return 'waiting'
  }
  // 真实模式：铺章交办给主 AI（小助手执笔 → 小助手审计 → 主 AI 终审），全部完成后交办合并。
  const chapters = meta.outline?.chapters ?? []
  // 过目闸门「全部章节都写好了」＝ 每章**两份产物在 ＋ 机器记下的交工通过 ＋ 没有未处置的抽查意见**
  // （票 14 / 票 05 裁决 A；判据在 chapterDone 一处）。不再只数文件在不在——真机发生过「5 章文件齐全、
  // 账本只有 1 条章级完成事件」也一路进了过目 → 合并 → 交付。老书某章没交工就重新走既有逐章交工。
  const allDone = chapters.length > 0 && chapters.every((_chapter, index) => chapterDone(projectId, index + 1))
  if (allDone) {
    if (!existsSync(workFile(projectId, 'book.md'))) {
      // 全章过目闸门（真实模式）：所有章写完先请人过目，不自动合并（F18）。
      if (meta.status !== 'awaiting-chapters-review' && meta.chaptersReviewed !== true && meta.demo !== true) {
        updateMeta(projectId, (state) => { state.status = 'awaiting-chapters-review' })
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


/** 正则元字符转义（票 20 护栏 ①）。
 *  * 为什么必须有它*：`runQualityChecks` 是**同步调用**（`chapters.js` 的单章验货与终检各一处），
 *  AI 在 style-spec 里声明的标题会**原样进 `new RegExp`**——`## 备注（草稿` 这种写法抛 `SyntaxError`，
 *  抛出即把一次交工打成 500。**闸门会被声明文本杀死**，是本条最坏的一种失败。
 *  超长/超量标题在 `declaredScaffoldTitles` 里已先收口，这里是最后一道。 */
function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 声明「本书没有这类标题」的写法——**认出它等于不追加，不是关闭扫描**。 */
const NO_SCAFFOLD_TITLES = /^(无|没有|不需要|无额外|不适用|无额外标题|本书无)/
/** 数量上限（票 20 护栏 ③）：再宽的声明也会把 check note 变成一本账。 */
const DECLARED_TITLE_MAX = 12
/** 长度上限：与 `parseStyleSpecList` 既有的 ≤20 字符过滤同档（它先收口，这里是显形的第二道）。 */
const DECLARED_TITLE_MAX_LEN = 20

/**
 * 票 20：读 style-spec 行首的「脚手架标题：」声明（**复用 `parseStyleSpecList`**，判据句式与豁免出口
 * 照抄现有实现——必含板块/禁用词那两项就是这么读的）。
 *
 * 契约原则（`parseStyleSpecList` 的注释与 CONTEXT.md 质量门词条逐字记着）：**没显式列出就跳过该项，
 * 不以硬编码词表误判**。读不到文件 / 没声明 → `state` 不是 `declared`，调用方**不追加任何检查项**
 * （那不是「绿」，是「这项没跑」——两者的区别在 check note 上写明）。
 *
 * @returns {{state:'unreadable'|'undeclared'|'declared-none'|'declared', items:string[], dropped:number}}
 */
export function declaredScaffoldTitles(projectId) {
  const path = workFile(projectId, 'style-spec.md')
  if (!existsSync(path)) return { state: 'unreadable', items: [], dropped: 0 }
  const parsed = parseStyleSpecList(readFileSync(path, 'utf8'), '脚手架标题')
  if (parsed === null) return { state: 'undeclared', items: [], dropped: 0 }
  const items = []
  let dropped = 0
  for (const raw of parsed) {
    const title = String(raw).replace(/^`+|`+$/g, '').trim()
    if (title === '') continue
    // 「无／不需要／无额外标题」= 显式声明「没有」：**不追加**，也**不**当成「关闭扫描」。
    if (NO_SCAFFOLD_TITLES.test(title)) continue
    if (title.length > DECLARED_TITLE_MAX_LEN) { dropped += 1; continue }
    if (items.length >= DECLARED_TITLE_MAX) { dropped += 1; continue }
    if (items.includes(title)) continue
    items.push(title)
  }
  return { state: items.length === 0 ? 'declared-none' : 'declared', items, dropped }
}

/**
 * 按声明的标题扫残留（票 20）。逐条独立正则 + `escapeRegExp`——**一个标题炸掉不该让整轮验货炸掉**。
 * @returns {string[]} 形如 `「写作笔记」（第 12 行：…）`
 */
export function scanDeclaredScaffolding(text, titles) {
  const found = []
  for (const title of titles) {
    let re
    try {
      re = new RegExp(escapeRegExp(title), 'g')
    } catch {
      found.push(`「${title}」（声明的标题无法编译，已跳过匹配）`)
      continue
    }
    for (const match of text.matchAll(re)) {
      const lineNo = text.slice(0, match.index).split('\n').length
      const line = text.slice(0, match.index).split('\n').pop()?.trim().slice(0, 60) ?? ''
      found.push(`「${match[0]}」（第 ${lineNo} 行：${line}）`)
    }
  }
  return found
}

/**
 * 票 20：脚手架残留的**两个来源分开报**，报告里不混成一条。
 *   · `declared` —— AI 在 style-spec 声明「本书写作时会用哪些元数据板块标题」的那些（**它要求的**）
 *   · `generic`  —— 硬编码的通用残留标记（`META`/`TODO`/`FIXME`/`HACK`/审计批注/未决问题/loader 指令）
 * ⚠️ 分开是因为两者性质不同：通用残留是**任何书都不该留的**，声明项是**本书特有**的；
 * 混成一条就会让「AI 声明要拆的」看起来像通用规则，而它其实是本书自己定的。
 */
export function scaffoldResidue(projectId, text) {
  const declared = declaredScaffoldTitles(projectId)
  return {
    generic: scanScaffolding(text),
    declared: declared.state === 'declared' ? scanDeclaredScaffolding(text, declared.items) : [],
  }
}

/** 剥掉 human 路线的 loader 指令区（装配说明，留给 AI 老师，不是成品脚手架残留）。 */
function stripLoaderRegion(text) {
  return String(text).replace(/<!-- loader:begin -->[\s\S]*?<!-- loader:end -->/g, '')
}


// ── 标题身份：合并剥章标题与终检判重共用同一份定义（不许两处各写一份正则）──

/** 行首「第N章」（数字或中文数字都收）。章标题行与普通小节标题的分界。 */
const CHAPTER_HEADING_RE = /^第\s*[0-9一二三四五六七八九十百零两]+\s*章/

/**
 * 标题归一化：**只留文字与数字**（剥掉 emoji、符号、标点、空白）。
 * ⚠️ 旧口径只删 8 个标点（`[\s，。、,.·：:]`），emoji 原样留在串里——
 * 「🚧 常见误区」按 6 个字符算，混过了「≥6 字才参与判重」那道闸，于是每章都有的
 * 板块名被判成「重复标题」拦交付（三本真书实测 27 / 12 / 1 处，见 ADR-0008 修订 2026-09-30）。
 */
export function headingKey(text) {
  return String(text).replace(/[^\p{L}\p{N}]/gu, '')
}

/**
 * 剥掉章正文自带的章标题行——合并时机器已经拼了一个 `# 第N章 <大纲标题>`，
 * 正文里那一行留着，成品里同一个章标题就出现两次，终检「无重复标题」会把
 * **「第X章」判成重复标题、拦交付**（这正是用户报的那条）。
 * ⚠️ 旧实现 `body.replace(/^#\s+.*$/m, '')` 只认单 `#`：AI 把章标题写成 `##` 时剥不掉。
 * 判据：文件里**第一个**标题行，且它长得像章标题（行首「第N章」，或与本章大纲标题同串）；
 * 第一个标题不是章标题就当它是真的小节标题，一个字不动。
 */
export function stripChapterTitleHeading(body, outlineTitle) {
  const text = String(body)
  const want = headingKey(outlineTitle)
  for (const match of text.matchAll(/^(#{1,6})[ \t]+(.*)$/gm)) {
    const title = match[2].trim()
    if (title === '') continue
    const bare = headingKey(title.replace(CHAPTER_HEADING_RE, ''))
    const isChapterish = CHAPTER_HEADING_RE.test(title) || (want !== '' && bare === want)
    if (!isChapterish) return text
    return text.slice(0, match.index) + text.slice(match.index + match[0].length)
  }
  return text
}


/** 真实模式：最后检查交办给主 AI（自查报告），机器硬检查兜底后交付；演示模式：机器质量门 + 交付（共用 book.md 缺失兜底）。 */
async function runPhase6(ctx, projectId, meta) {
  const bookPath = workFile(projectId, 'book.md')
  if (!existsSync(bookPath)) {
    appendEvent(projectId, 'textbook/error', { task: '交付', message: 'book.md 不存在，请回退重跑' })
    updateMeta(projectId, (state) => { state.status = 'error' })
    return 'error'
  }
  if (meta.demo) {
    // 演示模式：机器质量门 → 停 awaiting-final-approval 等人认可（与真实同闸门），认可后交付。
    const startedAt = Date.now()
    const checks = runQualityChecks(projectId)
    updateMeta(projectId, (state) => { state.finalChecks = checks })
    appendEvent(projectId, 'textbook/quality', { checks })
    appendEvent(projectId, 'textbook/agent-end', { label: '最后检查（质量门）', outcome: 'ok', path: 'work/book.md' }, Date.now() - startedAt)
    ensureStatus(projectId, 'awaiting-final-approval', FINAL_CHECK_DONE_HINT)
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


/**
 * 票 12 · ①：**机器替 AI 记「它改了机器契约」这一笔**（落账侧检测）。
 *
 * 病（2026-09-29 真机走查）：范例章 22:57:09 定稿、指纹 `1e117f928b674fc7` 定格，
 * **`work/style-spec.md` 在 88 分钟后的 00:25:22 被改写**——而这 88 分钟里第 1–12 章全部照**旧版**落盘。
 * 机器**有**判据（终检那一次对账），但它：① 拦在最后一刻、② 拦错了对象（说的是「你的报告要补一句声明」，
 * 不是「你那 12 章是照一份已经作废的契约写的」）、③ **账本里一个字都没有**。
 *
 * 判据只有一条：**当前指纹 ≠ 范例章定稿时定格的那一枚**。其余全是边界：
 * - 范例章还没定稿（`styleSpecHash` 为 null）⇒ 根本没有「定稿后」这一说，不记；
 * - 读不到文件 ⇒ `to` 记 null 并照记一笔（「删掉规范逃检查」也是一次变更，**读不出不是「没变」**）；
 * - **同一次变更只记一条**（`styleSpecSeen` 存的是「已记过的那一枚」）——
 *   调用点在工作台 2 秒一轮的轮询里，不去重就是每两秒一条事件，把账本淹掉。
 *
 * ⚠️ **为什么检测点是一个 GET**：AI 用文件工具直接改盘，服务端没有写入点可挂；
 * 唯一「那段时间里一定在跑」的东西是工作台自己的轮询（`/textbook/process`）。
 * 稳态下它**只读不写**（指纹没变就立即返回），且终检交工那一次也会补检一次，
 * 所以「工作台没开过」也不漏记。**这是一个有意的取舍，写在这里以免下一个人当漏洞改掉。**
 *
 * @returns {boolean} 这一次是否真的新记了一条
 */
function noteStyleSpecChange(projectId) {
  const meta = readMeta(projectId)
  const frozen = meta?.styleSpecHash
  if (frozen == null) return false
  let now = null
  try { now = specFingerprint(projectId) } catch { /* 文件不在/读不到：to 记 null，那也是一次变更 */ }
  if (now === frozen) return false
  if ((meta.styleSpecSeen ?? frozen) === now) return false
  const chapters = (meta.outline?.chapters ?? []).filter((_c, i) => existsSync(workFile(projectId, `chapter-${String(i + 1).padStart(2, '0')}.md`))).length
  appendEvent(projectId, 'textbook/style-spec-change', { from: frozen, to: now, chapters })
  updateMeta(projectId, (state) => { state.styleSpecSeen = now })
  return true
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
  // 票 20：通用残留与「AI 声明要拆的」**分两个来源收**（报告里也是两条，不混）。
  // 声明项在 style-spec 没显式声明时**整项不追加**（契约原则：不以硬编码词表误判）——
  // 注意「没跑」与「跑过且全绿」在 note 上必须说得出来，否则界面会拿「没查」当「查过了」。
  const declaredTitles = declaredScaffoldTitles(projectId)
  const residue = scanScaffolding(scanText)
  const declaredResidue = declaredTitles.state === 'declared' ? scanDeclaredScaffolding(scanText, declaredTitles.items) : []
  const auditNames = readdirSync(workDir(projectId)).filter((name) => /^audit-\d+\.(md|json)$/.test(name))
  const auditWaived = waived(projectId, 'audit-skip')
  const scaffoldWaived = waived(projectId, 'scaffold-keep')
  const otherWaived = waived(projectId, 'other')
  const gateWaived = waived(projectId, 'gate-skip')
  // 票 15①（票 06 的 Answer）：这里原先还有一支「三关全 approved」的实时折叠判断——它**恒假**，
  // 因为折叠只保留最后一关（foldGate(wanted=null) 只折出最后那一关的当前状态），
  // `every(gate => current === gate)` 不可能对三关同时成立。恒假支已删，只留按事件统计的这一支。
  const gatesApproved = (() => {
    // 折叠只保留最后一关，所以只能按事件统计三关是否都通过过。
    const approved = new Set()
    for (const event of readEvents(projectId)) {
      if (event.type === 'textbook/gate-decision' && event.data.approved === true) approved.add(event.data.gate)
    }
    return approved.has('1') && approved.has('2') && approved.has('3')
  })()
  // 票 15②（票 06 的 Answer 第 2 条）：成品文件齐全**真数既有产物清单**——`work/book.md` ＋ 每章
  // `work/chapter-NN.md`（清单从 meta.outline 读，不硬编码章数）。缺项即 ok:false（other 豁免仍可放行）。
  // 按**硬闸门**的强度做：runQualityChecks 的结论在终检交工处是「全过才交付」，恒真项等于这道闸门少一格。
  // 清单**绝不许含** `preface.md` / `progress.md`：演示通道不写它们，含了就是给 demo 判假（判据按
  // demo 的确定性产物清单校准，不给 demo 开豁免）。
  const requiredArtifacts = [
    { rel: 'work/book.md', path: bookPath },
    ...(meta?.outline?.chapters ?? []).map((_chapter, index) => {
      const { chapterPath } = chapterArtifacts(projectId, index + 1)
      return { rel: `work/chapter-${String(index + 1).padStart(2, '0')}.md`, path: chapterPath }
    }),
  ]
  const missingArtifacts = requiredArtifacts.filter((item) => !existsSync(item.path) || readFileSync(item.path, 'utf8').trim() === '')
  const checks = [
    {
      name: '成品文件齐全',
      ok: missingArtifacts.length === 0 || otherWaived,
      note: missingArtifacts.length === 0
        ? `该有的成品文件都在（${requiredArtifacts.length} 份）`
        : (otherWaived
          ? `你已同意：以你的说明为准（缺：${missingArtifacts.slice(0, 3).map((i) => i.rel).join('、')}）`
          : `少了这些成品文件：${missingArtifacts.slice(0, 3).map((i) => i.rel).join('、')}`),
    },
    { name: '所有章节都有审计记录', ok: auditNames.length >= chapterCount || auditWaived, note: auditWaived ? '你已同意：不要求每章都有独立检查' : `${auditNames.length}/${chapterCount} 章有检查记录` },
    // 票 20：这一条现在**只管通用残留**（硬编码的 8 个标记）。AI 在写作规范里声明的那些本书特有标题
    // 由下面单独一条查——两者性质不同，混成一条会让「AI 声明要拆的」冒充通用规则。
    {
      name: '没有遗留的通用脚手架标记',
      ok: residue.length === 0 || scaffoldWaived,
      note: scaffoldWaived ? '你已同意：保留 AI 的笔记不删' : (residue.length === 0 ? '没有留下 AI 的草稿痕迹' : `发现这些标记没清掉：${residue.slice(0, 3).join('；')}`),
    },
    { name: '练习与答案齐全', ok: /练习|答案|习题/.test(bookText) || otherWaived || styleSpecDeclaresNoExercises(projectId), note: otherWaived ? '你已同意：以你的说明为准' : (styleSpecDeclaresNoExercises(projectId) ? '写作规范里说了这本书不设练习' : '成品里有练习和答案') },
    { name: '与已拍板的设计一致', ok: gatesApproved || gateWaived, note: gateWaived ? '你已同意：跳过设计拍板' : (gatesApproved ? '三次设计拍板都过了' : '还有设计拍板没过') },
    { name: '源材料引用可追溯', ok: sourceCount > 0 || otherWaived, note: otherWaived ? '你已同意：以你的说明为准' : `${sourceCount} 份源材料都用上了` },
  ]
  // 票 20：声明项**只在写作规范显式声明时才追加这一条**。状态四分：
  //   `declared`      有条目 → 真查；
  //   `declared-none` 明写「无/不需要/无额外标题」→ 追加一条**显形**的说明，**不是静默绿**
  //                    （静默绿会被读成「机器查过了、没查到」，而实际是「AI 说不用查」）；
  //   `undeclared` / `unreadable` → **整项不追加**（契约原则：不以硬编码词表误判）。
  if (declaredTitles.state === 'declared' || declaredTitles.state === 'declared-none') {
    checks.push({
      name: '没有遗留本书声明的脚手架标题',
      ok: declaredResidue.length === 0 || scaffoldWaived,
      note: scaffoldWaived
        ? '你已同意：保留 AI 的笔记不删'
        : (declaredTitles.state === 'declared-none'
          ? '写作规范里明写「本书无额外脚手架标题」，这一项按声明不追加（不是查过没查到）'
          : (declaredResidue.length === 0
            ? `本书声明的 ${declaredTitles.items.length} 个脚手架标题都没留在成品里`
            : `这些本书声明过的脚手架标题还留着：${declaredResidue.slice(0, 3).join('；')}`)),
    })
  }
  if (declaredTitles.state === 'declared' && declaredTitles.dropped > 0) {
    // 护栏 ③ 的可见面：越界的声明不能悄悄消失——AI 要看得见自己写宽了。
    checks.push({
      name: '脚手架标题声明未越界',
      ok: true,
      note: `声明里超过 ${DECLARED_TITLE_MAX} 条、或超过 ${DECLARED_TITLE_MAX_LEN} 字符的 ${declaredTitles.dropped} 条已忽略（只按剩下的 ${declaredTitles.items.length} 条查）`,
    })
  }
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
      note: progressWaived ? '你已同意：不检查工作记录' : (progressExists ? '工作记录在' : '缺工作记录（每章一行：写完/检查/验货）'),
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
        ? (otherWaived ? '你已同意：以你的说明为准（成品里有乱码字符）' : '成品里有乱码字符，需要清理')
        : '没有乱码',
    })
    // ② 章节数符合大纲（从 outline 读，非硬编码）
    const chapterHeadings = (bookText.match(/^#{1,3}\s*第\s*\d+\s*章/gm) ?? []).length
    checks.push({
      name: '章节数符合大纲',
      ok: chapterHeadings >= chapterCount,
      note: `${chapterHeadings}/${chapterCount} 章标题齐（合并时机器拼的，这里再验一遍）`,
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
          ? `该有的板块都在（${requiredBoards.length} 个）`
          : (otherWaived
            ? `你已同意：以你的说明为准（缺：${missingBoards.slice(0, 3).join('、')}）`
            : `少了这些板块：${missingBoards.slice(0, 3).join('、')}（若设计已改，请同步更新写作规范的「必含板块」行）`),
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
          ? '没出现写作规范里禁用的词'
          : (otherWaived
            ? `你已同意：以你的说明为准（还在：${hits.slice(0, 3).join('、')}）`
            : `这些不该用的词还在：${hits.slice(0, 3).join('、')}`),
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
  // 事实矛盾（机器层，2026-09-30 诊断后拆成两件事——旧口径是**一条判据两头都不准**）：
  //   旧口径拿「全书所有 H1–H3 标题归一化后去重」当重复标题。实测（ADR-0008 修订 2026-09-30）：
  //     ① 每章都有的**板块名**（🚧 常见误区 / 🎬 场景引入…，书自己在 style-spec 里声明的）被判重复
  //        → 拦交付，三本真书分别 27 / 12 / 1 处，全是误伤；
  //     ② 两章**章名真写成一样**反而**放行**——机器拼的「第1章」「第2章」前缀让归一化串不相等。
  //   所以：章名唯一性单独立一条（读大纲，精确）；小节标题去重收窄成**同一章内**才拦。
  if (meta?.demo !== true) {
    // ① 章名全书唯一：直接读大纲的章名，不经正文——正文里的写法（`#`/`##`/带不带冒号）不该影响这一条。
    const seenChapterTitles = new Set()
    const dupChapterTitles = []
    for (const chapter of meta?.outline?.chapters ?? []) {
      const key = headingKey(chapter?.title ?? '')
      if (key === '') continue // 没有章名不是「两章同名」，归别处管
      if (seenChapterTitles.has(key)) {
        if (!dupChapterTitles.includes(key)) dupChapterTitles.push(key)
      } else seenChapterTitles.add(key)
    }
    checks.push({
      name: '章名全书唯一',
      ok: dupChapterTitles.length === 0 || otherWaived,
      note: dupChapterTitles.length === 0
        ? '每一章的章名在全书中都不一样'
        : (otherWaived
          ? `你已同意：以你的说明为准（重名章：${dupChapterTitles.slice(0, 3).join('、')}）`
          : `有 ${dupChapterTitles.length} 组章名在书里重复：${dupChapterTitles.slice(0, 3).join('、')}——请在拍板定方案那一关改掉重名的章名，再重新交工做最后检查`),
    })

    // ② 无重复标题 → 收窄为**同一章内**的小节标题重复。跨章同名多半是每章都有的板块名
    //    （设计使然，AI 改不掉——那是本书自己定的板位），机器分不出「板位名」与「复制粘贴的
    //    小节名」：字符串完全一样。所以跨章同名只**提示**（`warn` 第三态，不拦交付），
    //    语义归 AI 自查报告与合并前跨章审计（「机器扫结构、AI 查语义」分工不变）。
    //    同章内同名则多半是复制粘贴的产物，是真重复，拦。
    //    归一化用 `headingKey`：剥掉 emoji/符号/标点（旧的只删 8 个标点，emoji 留在串里
    //    把「🚧 常见误区」撑成 6 个字符混过下面的长度闸——那是 27 处误伤的直接成因）。
    //    标题正则的空白也从 `\s` 收紧成 `[ \t]`：`\s` 吃换行，一行裸 `##` 会把下一行正文收成标题。
    const BOILERPLATE = /小结|练习|答案|习题|本节|本章|目标|重点|方法|导入|复习|课后|思考/
    const perChapter = new Map() // 章号 → 该章已出现的小节标题键
    const acrossChapters = new Map() // 键 → 出现在几章（同章内多次只算一章）
    const dupInChapter = [] // 同章内重名：显示用（保留书里原样的标题，好让人照着改）
    const dupInChapterKeys = new Set() // 同章内重名的键：只作集合判据，不重复显示
    let chapterNo = 0
    for (const match of bookText.matchAll(/^(#{1,3})[ \t]+(.*)$/gm)) {
      const title = match[2].trim()
      if (title.length < 4) continue
      // 机器拼的章标题行（`# 第N章 …`）开启新的一章；它自己归 ① 那条判，这里只用来分章。
      if (match[1].length === 1 && CHAPTER_HEADING_RE.test(title)) {
        chapterNo += 1
        continue
      }
      const key = headingKey(title)
      if (key.length < 6 || BOILERPLATE.test(key)) continue
      const seenHere = perChapter.get(chapterNo) ?? new Set()
      if (seenHere.has(key)) {
        dupInChapterKeys.add(key)
        if (!dupInChapter.some((shown) => shown === title)) dupInChapter.push(title)
      } else {
        seenHere.add(key)
        acrossChapters.set(key, (acrossChapters.get(key) ?? 0) + 1)
      }
      perChapter.set(chapterNo, seenHere)
    }
    // 跨章同名（不含同章内已报的那些）：只提示，不拦。
    const sharedAcross = [...acrossChapters.entries()]
      .filter(([key, chapters]) => chapters > 1 && !dupInChapterKeys.has(key))
      .map(([key]) => `「${key}」`)
    const blocked = dupInChapter.length > 0
    checks.push({
      name: '无重复标题',
      ok: !blocked || otherWaived,
      warn: !blocked && sharedAcross.length > 0,
      note: blocked
        ? (otherWaived
          ? `你已同意：以你的说明为准（重复标题：${dupInChapter.slice(0, 3).map((t) => `「${t}」`).join('、')}）`
          : `发现重复标题 ${dupInChapter.slice(0, 3).map((t) => `「${t}」`).join('、')}——同一个标题在同一章里出现不止一次，请合并或改写重名的小节，改完重新交工做最后检查`)
        : (sharedAcross.length > 0
          ? `同一章里没有重名的小节；这些标题在多章里各出现一次（多半是每章都有的板块）：${sharedAcross.slice(0, 3).join('、')}——是不是内容重复，请 AI 在自查报告里说明`
          : '每一章里都没有重名的小节标题'),
    })
  }
  return checks
}


function recordAgentError(projectId, task, error) {
  // 演示模式出错是流程 bug 或环境问题（可直接重试）；真实模式的子代理失败多半是
  // LLM 未配置/欠费，标为 needs-config 并给出引导。
  updateMeta(projectId, (meta) => {
    meta.status = meta.demo === true ? 'error' : 'needs-config'
  })
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
      if (readMeta(projectId) !== null) {
        updateMeta(projectId, (meta) => { meta.status = 'error' })
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


/**
 * 方法论文本过长时截断（交办说明里嵌，避免刷爆 AI 上下文）。
 *
 * 票 subagent-guidance/09：`audit-and-testing.md` 有四节（§八/§十/§十一/§十二）**整节落在
 * cap 之外**——成因是「往文档末尾加节」这个做法本身在持续挤掉前面的节，不是一次性事故。
 * 这里**不抬 cap**（省上下文这条约束已被 9000 证明有效），改为**按阶段定向注入**（见
 * `METHODOLOGY_TAIL_BY_STAGE` 与 `withTailSections`）。
 *
 * 截断提示语**必须带可点路径**：原来只写「需要全文可再读插件 resources/ 目录」，
 * AI 得先 glob 才知道文件在哪——那正是「靠指针自救」这个绕路成立的原因之一。
 */
function clipMethodology(text, cap = 9000, rel = null) {
  const clean = String(text ?? '').trim()
  if (clean.length <= cap) return clean
  return `${clean.slice(0, cap)}\n…（方法论过长已截断${rel === null ? '，需要全文可再读插件 resources/ 目录' : `；全文 ${rel}`}）`
}

/**
 * 票 subagent-guidance/09：从方法论文档里切出指定的 `##` 级小节。
 *
 * 一节 = 从它的 `## ` 行到**下一个同级或更高级标题**为止（`###` 归它所有）。
 * 找不到标题就返回空串——**缺一节不该炸掉整个交办说明**，上层会断言它。
 *
 * @param {string} text 方法论全文
 * @param {string[]} headings 要切出的 `## ` 标题逐字前缀（如 `'## 十一、'`）
 * @returns {string} 按 headings 顺序拼接的小节正文
 */
export function pickSections(text, headings) {
  const clean = String(text ?? '')
  const starts = []
  for (const match of clean.matchAll(/^## .+$/gm)) starts.push({ at: match.index, title: match[0] })
  const picked = []
  for (const heading of headings) {
    const from = starts.findIndex((s) => s.title.startsWith(heading))
    if (from < 0) continue
    const at = starts[from].at
    const end = from + 1 < starts.length ? starts[from + 1].at : clean.length
    picked.push(clean.slice(at, end).trim())
  }
  return picked.join('\n\n')
}

/**
 * 票 subagent-guidance/09：把按阶段选中的小节**追加**在截断件之后。
 *
 * **口径（追加 vs 替换）：选追加。** 理由有两条，缺一不可：
 * ① 主文仍以「已截断」收尾、追加块自己交代来由——AI 的读法是「主文被截了，下面这几节是
 *    按阶段补进来的」，两句同时成立；选替换会让截断提示语与追加块互相矛盾。
 * ② 主文长度与「§九 工具纪律完整存活在截线以内」那条契约**一个字不用改**。
 */
function withTailSections(clipped, rel, headings) {
  const sections = pickSections(resourceText(rel), headings)
  if (sections === '') return clipped
  return [
    clipped,
    '',
    `↓ 以下 ${headings.length} 节按本阶段定向补进来（它们在 resources/${rel} 里排在 9000 字截断线之后，`,
    `   主文被截断时整节都读不到，所以单独附在后面）：`,
    '',
    sections,
  ].join('\n')
}

/**
 * 票 subagent-guidance/09：**按阶段**定向注入 audit-and-testing.md 的四节尾节。
 *
 * 映射依据是每节各自治理的事，不是「哪个阶段就全给」：
 * - `## 八、`  审计后回填约束文件（防复发）→ 审计**产出结论**的阶段才有意义
 * - `## 十、`  三阶段递进审计：§十 自己写死了三轮的归属——第一轮章级审计＝gold·chapters、
 *            第二轮全书结构与索引审计＝merge、第三轮修订复审＝**final**
 * - `## 十一、` 小助手中途引导 → 派小助手干活的阶段
 * - `## 十二、` 暂停时收回小助手 → 触发只有「暂停」一个，跟着会派小助手的阶段走
 *
 * ⚠️ `final` 今天**根本不读 audit-and-testing.md**（它只挂 delivery-checklist.md），
 * 所以 §十 第三轮「终检 AI 自查 + 机器硬检查质量门」这条判据此前从未进过终检 brief——
 * 定向注入顺带补上这一格。
 */
/**
 * 票 22（2026-09-29 用户裁决）：`references/invariants.md` **挂进 brief，但按 route 选节**。
 *
 * 口径三条，缺一不可：
 * ① 挂在哪几个阶段 = 下面 `INVARIANTS_STAGES` / `INVARIANTS_GATES` 两张表
 *    （`gold`/`merge`/`final` 已有 `delivery-checklist.md` 覆盖 I8，**不重复挂**）。
 * ② 按 `meta.route` 选节 = 下面这张**按 route 的节清单表**。
 *    ⚠️ **它不是 `METHODOLOGY_TAIL_BY_STAGE`**：那张是「同一份文件被 9000 截断线切掉之后按阶段补尾节」，
 *    由 `test-tool-discipline.mjs` 逐字反解比对，**一个字都不许动**。本表是「另一份文件按路线选节」，两回事。
 * ③ **不许用 `mtlWithTail`**：`invariants.md` 只有约 3000 字符、**从不截断**，对它调 `mtlWithTail`
 *    = 整份原文 ＋ 重复的小节 ＋ 一句**事实错误的**横幅（「以下 N 节排在 9000 字截断线之后」）。
 *
 * 节号口径来自 `invariants.md` 自己的四段结构：I1-I4 跨路线 / I5-I6 仅 blueprint /
 * H1-H3 仅 human / I7-I9 过程（两条路线同等适用）。`writing-agent-prompt.md:17` 的占位符映射与此同源。
 */
const INVARIANTS_SECTIONS_BY_ROUTE = {
  'blueprint': ['## 一、', '## 二、', '## 四、'],
  'human-readable': ['## 一、', '## 三、', '## 四、'],
}
/** 挂的阶段：`explore`（否则 `SKILL.md` 那条 REQUIRED 是个**空指针**）与 `chapters`（铺章全程）。 */
const INVARIANTS_STAGES = new Set(['explore', 'chapters'])
/** 关卡阶段挂哪几关：②（教学模式选型）与 ③（整书教学架构）——最需要底线的两个设计路口。 */
const INVARIANTS_GATES = new Set(['2', '3'])

const METHODOLOGY_TAIL_BY_STAGE = {
  gold: ['## 八、', '## 十、', '## 十一、', '## 十二、'],
  chapters: ['## 八、', '## 十、', '## 十一、', '## 十二、'],
  merge: ['## 八、', '## 十、', '## 十一、', '## 十二、'],
  final: ['## 十、', '## 十二、'],
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
  /** 本 brief 实际挂了哪几份共用方法论文档——**记下来随 brief 一起交出去**（`brief.methodologyDocs`）。
   *  「哪个阶段挂了哪几份」从此是**生产路径上的一个事实**，不是靠人反解 `engine.js` 源码猜的
   *  （`test-brief-doc-closure.mjs` 的传递闭包断言读的就是这一份）。 */
  const methodologyDocs = []
  const mtl = (rel) => {
    methodologyDocs.push(rel)
    return clipMethodology(resourceText(rel), 9000, rel)
  }
  // 票 22：按 route 选节的不变量底线（**只对挂了的那几个阶段追加**）。
  const attachInvariants = (stageKey) => {
    if (!invariantsAttached(stageKey, gate)) return
    const headings = INVARIANTS_SECTIONS_BY_ROUTE[meta.route ?? 'blueprint'] ?? INVARIANTS_SECTIONS_BY_ROUTE['blueprint']
    const sections = pickSections(resourceText('references/invariants.md'), headings)
    if (sections === '') return
    // 路线名照 meta.route 逐字取（'blueprint' / 'human-readable'），不另造一套译法——
    // 这里写错会让 AI 看到「适用本路线（blueprint）」却拿到 human 的小节。
    const routeLabel = INVARIANTS_SECTIONS_BY_ROUTE[meta.route] === undefined ? 'blueprint' : meta.route
    brief.methodology = `${brief.methodology ?? ''}\n\n↓ 以下是不变量底线里**适用本路线（${routeLabel}）**的 ${headings.length} 节（resources/references/invariants.md 的其余小节属于另一条路线，不适用本书；本文件从不截断，所以没有「排在截断线之后」那回事）：\n\n${sections}`
    methodologyDocs.push('references/invariants.md')
  }
  /** 某份 brief 该不该挂不变量底线（阶段 + 关卡两维；`gold`/`merge`/`final` 一律不挂）。 */
  function invariantsAttached(stageKey, gateKey) {
    if (stageKey === 'gate') return INVARIANTS_GATES.has(String(gateKey))
    return INVARIANTS_STAGES.has(stageKey)
  }
  /** 票 09：某个阶段该补哪几节尾节（没登记的阶段就是没有，不补）。 */
  const mtlWithTail = (rel, stage) => {
    const headings = METHODOLOGY_TAIL_BY_STAGE[stage] ?? []
    return withTailSections(mtl(rel), rel, headings)
  }
  const brief = {
    stage, gate, label: stageLabel(stage, gate), dir: projectDir(projectId),
    project: { name: meta.name ?? '', goal: meta.goal ?? '', route: meta.route ?? 'blueprint', science: meta.science === true },
  }
  switch (stage) {
    case 'explore': {
      brief.task = '统筹通读全部转换后的教材（sources 里每本给出准确的 sources-md/ 子路径与 full.md）：可自己读，也可把每本分头派给小助手通读（干净上下文、要求详细摘录结构/角色/权威层级/教学线索），你逐份核对后亲自汇总整理出「源材料索引」与「结构化知识地图」。'
      brief.outputs = [
        // 票 brief-word-limits/01：主次分工写明——**细颗粒度进 knowledge-map.json，explore.md 只做给人读的索引**。
        // 原式两句并列，AI 看不出主次，于是「用户要更多细节」与「≤1200 字」互相顶。
        'work/explore.md —— **给人读的索引**（纯 Markdown，篇幅从简）：材料清单（文件名+角色）、结构观察（摸源结构、角色标签、权威层级）、教学线索（知识点密度、重点难点、可用素材）；约 1200 汉字（软目标，机器不验，超一点没关系）。**细颗粒度的东西（逐条摘录、知识点细目）一律进 work/knowledge-map.json，不要塞进这个索引**——它只做索引。',
        'work/knowledge-map.json —— 结构化知识地图（严格 JSON，**细颗粒度内容的主落点**）：materials:[{num,sections:[{title,summary,keywords}]}]、knowledgePoints:[{id,title,source,summary,difficulty}]、teachingFocus:[string]（重点/难点各一句人话，纯字符串，如「重点：分数运算」「难点：应用题建模」）、chapterSuggestion:[{title,source,points}]（4-10 章）。',
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
      brief.task = `手工起草${gateHuman(gate)}的设计方案，用人话向用户解释，等用户拍板。`
      brief.gateLabel = GATE_LABELS[gate] ?? ''
      brief.gateTask = {
        '1': '分析源材料并推导学习目标：这本书让学习者最终能做到什么？最大的坑是什么？',
        '2': '教学模式选型与板块语法：读了模式库，考虑过哪些、拒绝哪些、为什么；选中的模式解决本书哪个教学问题；设计每章的板块结构。',
        '3': '整书教学架构：知识链主线、卷/部划分、逐章骨架表（每章五行：章号/标题/类型/知识链位置/锚定知识点——**第 5 列统一是知识点**，无源书没有知识点清单、那一列改写锚定的源任务或概念）、特殊章、跨章引用机制、附录策略、贯穿案例约定；以及体量设计：整书总字数与预计学时、每章字数区间、依据（材料知识量/学习目标/读者背景），体量须在大白话摘要中呈现。**另有两件在**这一步**就要答、不能拖到写范式章才答**：①本书第一读者是谁（AI 老师 / 人类读者）；②防螺旋铁律的**设计期禁令**——从这一关拍板到写作规范产出之间，不许自行加章/加附录/加机制级板块，真要加等用户走定点修改重新拍板（style-spec 里的「防螺旋铁律」那一项记的是**定稿之后**的回炉规则，两半不是一回事）。',
      }[String(gate)] ?? ''
      brief.previousDecision = current === null || current.gate !== gate ? null : {
        version: current.version, status: current.status,
        reasons: current.decision?.reasons ?? [], note: current.decision?.note ?? '',
      }
      brief.outputs = '方案三段通过 stage-submit（stage=gate）提交：title（一句话标题）/ summary（给用户看的人话摘要，约 300 汉字以内；软目标，机器不验）/ detail（完整方案 Markdown 正文，必须内联全文--禁止写「见文件/proposal-*.md」，用户只在页面上看方案，不会去文件夹翻）。'
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
      brief.task = '基于知识地图与材料结构，设计整书章节骨架：每章明确用哪本材料的哪一部分、覆盖哪些知识点（points，来自知识地图）、建议字数（遵循第 3 次拍板已定的体量设计，不许静默缺省）、体量依据；并标注建议的最佳范例章（goldChapter+理由：哪章最能代表全书风格/结构最完整/材料最充分）。'
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
      brief.task = `亲笔写全书的最佳范例章（第 ${gn} 章，全书基准）：写出写作规范 + 第 ${gn} 章全文 + 四层审计 + 试教（条件触发）。这是全书其余章节要模仿的基准，务必高质量、与教材内容一致。`
      brief.targetWords = meta.outline?.chapters?.[gn - 1]?.targetWords ?? meta.targetWords ?? 6000
      brief.chapterSource = chapterSource
      brief.outputs = [
        // 票 19：这份契约文本是「审计要查的东西、producer 不许写」那条悬空契约的**生产端**。
        // 十八项与 `resources/references/subagent-prompts/audit-agent-prompt.md §审计要求`、
        // `audit-and-testing.md §7.0` 两份审计清单**逐项对齐**；差集断言（`test-contract-gap.mjs`）
        // 从两侧**解析**出集合来比，本文件里不硬编码第二份清单。
        // 「N. **名字**」的编号+加粗是**给解析器看的**：改成不带编号的散文，那条断言会立刻空转
        // （它会报「生产集合解析出 0 项」）。
        // 版权铁律／字数／frontmatter schema 三项**要求写的是「有意不做 + 理由」**，不是写内容——
        // 2026-08-18 走查 :73 的原裁是「补产物**或**写明『有意不做』的理由」，仓里有先例。
        'work/style-spec.md -- 写作规范（十九项契约，**每项都要有一个同名小节**，逐项打钩）：1. **模式选型**（考虑过哪些/拒绝了哪些/为什么；每个模式对应本书哪个教学问题）、2. **章内板块语法**（必含/循环/可选板块的完整语法）、3. **情境钩子写法**、4. **Voice 规则**（正文语言风格：正式程度/术语处理/本书特有禁用词）、5. **量化参考密度**（参考非铁律，本稿回填实测）、6. **深度四维承诺**（四维各用什么板块兑现到什么程度）、7. **最佳范例章写作惯例区**（本稿回填）、8. **防幻觉铁律**（最危险的断言类型/回源到哪/追不到怎么降级）、9. **写作纪律**（一个 agent 写几章/并行度/篇幅约束/排除项）、10. **脚手架标题列表**（交付前拆除用）、11. **本书定位**（一句话说清这本书是什么、给谁用）、12. **读者意识声明**（本书第一读者是谁；**写每一块之前先问自己什么问题**——这半句落在这里，「第一读者是谁」那一半在第 3 次拍板（整书教学架构）的提案里）、13. **章末教学区规范**（板块结构/长度/格式）、14. **frontmatter schema**（需要章级 yaml 就定义字段+校验规则；不需要就逐字声明「本书无章级 frontmatter」）、15. **AI 老师使用方式**（顺序讲/地基章先吃透/按需检索）、16. **防螺旋铁律**（定稿后不许自行加章/附录/机制级板块；确需加由用户走定点修改重新拍板）、17. **多源同级声明**（本书若有两本并行的权威源且说法不同，逐字写出「以哪本为准 ＋ 为什么是它」；冲突先按问题类型四路分派定权威源——定义/原则、操作步骤、考试覆盖范围、敏捷——四路分不出来才用「根真相源 > 教学讲义 > 碎片笔记」那条线性刻度，**考纲是覆盖校验基准、不进那条刻度**）、18. **版权铁律**、19. **字数**。⚠️ **18 与 19 是「有意不做」项**：照 2026-08-18 实书走查的裁决，本仓不设版权声明模板、也**不设任何字数/篇幅闸门**（与「机器永不查字数」的口径一致，超一点没关系）——这两项**必须写下来的是那句「有意不做 + 理由」，不是内容**；14 同理，只能二选一（有 schema / 无 schema），不许留空。',
        `work/chapter-${String(gn).padStart(2, '0')}.md —— 第 ${gn} 章全文（按 style-spec，含全部板块与答案；约 ${brief.targetWords} 汉字，是写作体量参考、**不是闸门**——机器不验字数，宁可多写不可敷衍）`,
        `work/audit-${String(gn).padStart(2, '0')}.md —— 审计记录（四层审计 + 试教[条件触发]，严格 JSON：{"passed":true,"issues":[{"level":"错误|警告|提示","text":"具体问题"}]}）`,
      ]
      brief.materials = sources
      brief.methodology = `${mtl('references/file-contracts.md')}\n\n${mtlWithTail('references/audit-and-testing.md', 'gold')}`
      // 票 workbench-transitions/19③（2026-09-24 裁决补充）：范例章也是写作任务，风格线同样必读。
      // 这一段原先**没有** `references` 字段（`gold` 是新建，不是「加一行」）。
      brief.references = ['work/style-line.md（写每一章前必读、逐条落实）']
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
        `审计结论落盘后，先交给机器过一遍形状：workbench_act（action=audit-submit）当场验 work/audit-${String(gn).padStart(2, '0')}.md 的 matrix（5 个必读文件各一行 {file, quote}、quote 逐字；不带内容就读书里那份，也可带 auditJson 正文由机器落盘）。不合格会当场把机器看到的行键、样例与缺口说清——别等 stage-submit 那一刻才知道。`,
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
      brief.task = '写完整本：对每一章走三步——派小助手写（给大纲/材料小节/写作规范/范例章路径）→ 派小助手审计（干净上下文，产出 audit-NN.md；机器会读它验货）→ 机器按章验货（audit.passed===true 才放行）。**remaining 里还没写的各章可并行派多个写作小助手**（每章一个、干净上下文、各写各的独立文件），各自完成后逐个交工验货。你不逐章复核；只有该章有用户抽查意见时，才需要你亲自核对修订结果。'
      brief.total = chapters.length
      brief.remaining = remaining.map((chapter) => ({
        n: chapter.n, title: chapter.title ?? '', outline: chapter.outline ?? '',
        source: chapter.source ?? '', targetWords: chapter.targetWords ?? meta.targetWords,
        points: chapter.points ?? [],
      }))
      brief.references = [
        'work/style-spec.md（写作规范）',
        // 票 workbench-transitions/19③：风格线原先只有 persona 一条 + `work/style-line.md` 镜像，
        // 逐章交办里没有它——界面那句「AI 写每一章都会照着办」于是不兑现。这里把它补进必读清单。
        'work/style-line.md（写每一章前必读、逐条落实）',
        '范例章（见 brief）',
        'work/outline.md（章节骨架）',
      ]
      // F39（2026-08-20 走查）：段落级抽查意见也透出给 AI（整章意见带 comment，段落意见合成人话；已撤回的跳过）。
      // 票 09：**必须带 id**——没有 id，主笔 AI 交工时无从点名（handledReviews 按 id 销号）。
      brief.pendingReviews = (meta.pendingReviews ?? []).filter((r) => r.status !== 'revoked').map((r) => ({ id: r.id, chapter: r.chapter, comment: paragraphReviewText(r) }))
      brief.methodology = `${mtlWithTail('references/audit-and-testing.md', 'chapters')}\n${mtl('references/file-contracts.md')}\n${mtl('references/subagent-prompts/writing-agent-prompt.md')}\n${mtl('references/subagent-prompts/audit-agent-prompt.md')}`
      brief.hints = [
        CHAPTER_PROGRESS_REQUIREMENT,
        // 票 03 · P34：上面那条只说了 stage 有哪些取值，没说**什么时候**必须报——实测 9.4 小时里
        // 「还剩 39 步」一字未变、▶ 指着 10 小时前就写完的第 1 章，因为 AI 一次都没带过
        // chapter/stage（契约有、转发有、按章落账有、界面也接上了，只有上报这一格是空的）。
        '逐章阶段上报：每章走「写 → 审 → 复核」时，**每次状态变化**都用 workbench_act(action=progress) 把 chapter=N 与 stage 一起报上（stage 的取值见上一条）——派出去写时报 writing、检查时报 auditing、检查完报 audited、你要复核报 finalizing、这一章交工完报 done。只有文字、没有 chapter 与 stage 的 progress 落在步清单上什么也看不出来。',
        '并行纪律：remaining 各章可并行派多个写作小助手，并发 2-4 章为宜（低内存/老机器从 2 起）；每章一个写作小助手、各章独立文件（chapter-NN.md / audit-NN.md），绝不共享工作区写同一文件；各章各自完成后逐个交工验货（ordered-commit：慢章压住快章属预期，不必等齐）。宿主不支持并行 spawn 时小助手自动排队，退化为逐章串行，行为与现状等价。',
        '派小助手/审计小助手时提醒：文件操作用文件工具（read/write/edit/glob/grep），别用 shell（工具纪律见 audit-and-testing.md §九，跨平台一致）。',
        '小助手与审计小助手用你的 subagent 工具派；提醒小助手材料小节与产出文件的准确路径（都在 dir 下）。',
        '每交一章前先 workbench_status 查有没有新抽查意见，有就先处理（修订 → 重新审计 → 机器验货）再继续；该章意见未处置机器会拒收。',
        '写完整本途中的引导杠杆：来了用户意见/风格线变化 → 先 send_message 转达给正在写那一章的小助手（别等整章写完再打回），并落一行 progress；小助手跑完没交齐 → 优先用 send_message 唤醒原来那个小助手（忘了是谁就用 list_agents 按「章号 + 角色」的 label 召回），不用重派。细则见 audit-and-testing.md §十一。',
        // 票 11 · P30＋P42：焦点区主卡逐字显示最近一条 progress（顶部横幅只出状态词那半截，
        // 见 audit-and-testing.md §11.5②），所以「只在开工时发一条」等于对外宣称一件
        // 已经结束的事；而要用户拍板的那类决定记进 progress，机器侧就无从知道有**一个问题悬着**。
        '进度保鲜与拍板通道：每个小助手回来、每交工一章时，**必须补一条 progress**，写那段时间里真的在做的事（派了几路、在写哪几章、哪几章检查完了、下一路是谁）；上一次落账到这一次之间一个章的时长都没补，工作台上挂的就是旧闻。要用户拍板、选一条路、授权一次改动，走 intervene，不要记进 progress（它是留给用户回话的悬案通道，工作台据此把闸门按钮亮出来）。留痕不许因为加了保鲜就被稀释——该落的引导那一行一次都不能少，细则见 audit-and-testing.md §十一。',
        '处置过的抽查意见要在交工时报出：stage-submit（stage=chapters）带 handledReviews:[{id, how}]——id 取 pendingReviews 里那一条，how 是一句人话（这条我怎么改的）。机器**只给点名的**置为已处置，没点名的继续拦；一条都不点名就交工会被 400 打回。',
        '机器按章验货：每章都要有 work/chapter-NN.md 和 audit-NN.md，且 audit.passed 必须是 true（读审计 JSON，不是只看文件存在）。',
        // 票 brief-word-limits/01：把「字」的口径与「这些数字不是闸门」**一次说清**（主笔 AI 自报进度
        // 那行自由文本只能靠交办说明/persona 传口径，服务端改不了它的措辞）。
        '体量口径：remaining[].targetWords 的「字」一律按**汉字**计（数字/字母/标点/空白都不计），它是写作体量参考、**不是交工闸门**——机器不验字数，超一点没关系。自报 progress 时也按这个口径说。',
        // 票 02 · P19：要用户拍板的选择由宿主 `ask_user_question` 提问卡渲染（工作台零实现），
        // 它逐字显示每个选项的说明——**预告只能写在选项说明里**，写成别的位置等于没写。
        // 措辞沿用工作台「✍️ 定点修改这一步」那段既有的影响预告（`src/ui/phase-page.js`），不另起一份格式。
        '要用户拍板时先把影响预告给出来：凡是你要在几个选项里请用户选、而选哪条会牵动已经写好或已经拍板的内容（例如全书体量、章节结构、范例章写法），**每个选项的说明都要各带一句影响预告**，照「影响预告：这一步改了，这些要一起重做：…」那个形状说人话——按现在已写 N 章、累计多少汉字说清：选它要重写哪几章、最终落在多少汉字。三条路各有各的代价（实测里最忠于用户当初拍板的那条恰好最贵），不许等用户点完再在正文里补一句「我倾向」。',
        '派写作小助手时必须带（按 writing-agent-prompt.md 模板填）：本章知识点清单（remaining[].points）、本章在知识链中的位置与跨章引用指向（前面哪章讲过什么、后面哪章会用到这里）、范例章路径与写作规范。',
        '跨章引用纪律：前向引用只到大纲承诺粒度（「第 N 章会展开」），禁止编造未写章节的具体数字/结论/例题；审计小助手按 audit-agent-prompt.md 派，要求其扫跨章引用存在性（含前向承诺失配）。',
      ]
      // 票 28 / 走查 P46：每次领任务都把**主 AI 上下文占用**一并告诉主笔 AI，
      // 好让它知道自己该收尾了。读不到（宿主投影缺席 / 未绑定读数口）就**整句不追加**——
      // 绝不写 0%、绝不编一个百分比。落点在这一层（brief.hints），不改方法论文档、
      // 不动 progress 事件语义、不新增 workbench_act 动作名与账本事件类型。
      {
        const occupancyLine = contextOccupancyBriefLine(meta.session)
        if (occupancyLine !== null) brief.hints.push(occupancyLine)
      }
      break
    }
    case 'merge': {
      brief.task = '合并前先做跨章审计：通读全部章节 + outline + knowledge-map，逐项核对（①跨章事实一致性—数字/人名/结论不打架 ②术语统一—同一概念全书一个说法 ③交叉引用不悬空—「见第X章」的章真实存在 ④知识递进链—后章依赖的前置概念前章真的讲过），发现问题先修，再把审计结论落盘 work/audit-cross.md（机器验存在才放行合并）。然后写这本书的前言/使用说明（约 300 汉字，通俗；软目标，机器不验字数），随 stage-submit（stage=merge, preface=...）交工；机器会 100% 保真拼装各章成书（不删节）。'
      brief.references = ['交工后工作台会生成 work/book.md（机器拼装成品）']
      brief.methodology = mtlWithTail('references/audit-and-testing.md', 'merge')
      brief.outputs = ['维护 work/progress.md（每章一行：写完/审计/验货）', 'work/audit-cross.md —— 合并前跨章审计结论（机器验存在才放行合并）']
      brief.hints = ['前言写给"拿到这本书的人"：这本书讲什么、怎么用（给 AI 老师上课还是人直接读）。', 'audit-cross.md 是硬门槛：没落盘机器会 400 拒收，别只交前言。']
      break
    }
    case 'final': {
      // 票 walkthrough-fixes/32 · ADR-0027：终检改派 5 个小助手分查。**协调员不读正文**（§6.1 硬约束）——
      // 终检是全书体量最大、上下文余量最小的那个时点，让它亲自通读 book.md 等于把最贵的读放在最没余量的地方。
      // 三层归属在这条字符串里必须自洽：协调员**不读正文** / **仍能改点名的条目** / **styleCheck 逐条交代由分报告做**。
      brief.task = `最后检查**分头查，不要自己通读**（口径见 audit-and-testing.md §十「派 5 个小助手分查」那一节）：按那一节派 5 个上下文干净的小助手分查 work/book.md，各查各负责的范围（成品完整与每章自查记录 / AI 脚手架残留与练习答案齐全 / 与已拍板设计一致 / 材料可追溯与引用矛盾 / 事实与跨章一致性），**派发那一刻你手里一章正文都不许有**，只收 5 份报告。五份各自出结论（通过／不通过）＋**条目级**点名（「第 3 章有问题」不算点名，要指到具体哪一处）。**五份不合成**：你只做汇总裁决，不逐条回正文复核（核实是写那份报告的助手自己的活）；按点名的那几条**直接改**——只改点名的条目，不通读全书、不顺手重写别的章。改完把五份结论汇成一份自查报告（人话）随 stage-submit（stage=final, report=...）交工。${REPORT_WORDING_RULE}**风格线逐条交代由五份分报告各自做、你不读正文所以不做**：交工时要对**每一条**生效中的风格线（workbench_status 的 styleNotes 里 status 为 active 的那些）都有交代——把五份报告里各自交代的去向合并成一份 styleCheck:[{id, status, note?, chapter?}] 随交工一起交：adopted＝已落实（写清落实在哪章）、conflict＝与哪一章冲突（note 必写一句冲突理由）、superseded＝已不再适用；漏一条机器会拒收（哪一路没交代就唤醒那一路补，别自己凭印象编）。机器硬检查会兜底（乱码/章节数/必含板块/禁用词/章名全书唯一/无重复标题，判据来自已拍板的 style-spec/outline；**章名唯一性读大纲的章名，同一章里重名的小节才算重复——每章都有的同名板块（板位）不拦，只在自查报告里说明**）；全过后你在工作台等用户「认可」才算交付。`
      brief.counts = { chapters: (meta.outline?.chapters ?? []).length, sources: (meta.sources ?? []).length }
      brief.methodology = `${mtl('references/delivery-checklist.md')}\n\n${mtlWithTail('references/audit-and-testing.md', 'final')}`
      brief.outputs = ['维护 work/progress.md（每章一行：写完/审计/验货）']
      // 票 32 · ADR-0027 决策 4：上下文余量**解绑**进终检——分派把书摘下去了，但五份报告回流、
      // 汇总、改点名条目仍在协调员身上，余量仍然是它该盯的数（读不到读数就整句不出现，同铺章那一族）。
      brief.hints = ['派完这 5 路之后别断线：五份齐了才进下一步；某一路超载就拆范围（或唤醒原助手补），别硬扛。', '五份报告只信「条目级点名」的那几条——点名不到具体位置的打回重做。']
      {
        const occupancyLine = contextOccupancyBriefLine(meta.session)
        if (occupancyLine !== null) brief.hints.push(occupancyLine)
      }
      // 终检被用户驳回后的修订意见（final-approve approved=false → 原地循环）。
      // 意见在 stage-submit final 通过时才销号（2026-08-27 grill 修订）：领任务改纯读、无副作用，
      // AI 重领任务/机器打回后重领都仍带意见；「重做意见只对本轮生效」语义不变（与 exploreRedoNote/goldRedoNote 同构）。
      if (meta.finalRedoNote != null) {
        brief.userFeedback = meta.finalRedoNote
        brief.hints = [...(brief.hints ?? []), `这是最后检查的修订：用户对整本书的意见是「${meta.finalRedoNote}」。按意见改整本（改 book.md）——仍按 §十「派 5 个小助手分查」那一节的分工：优先**唤醒原来那 5 路**去查改动处，够不着的再派新的干净上下文助手；改完五份齐了再汇总交工，不要自己通读全书。`]
      }
      break
    }
    default:
      brief.task = '（这个阶段的说明还没有补齐，先按状态机提示与用户确认该做什么。）'
  }
  // 票 22：不变量底线只对裁决里那四个阶段/关卡追加（explore / 关卡② / 关卡③ / chapters）。
  attachInvariants(stage)
  // 深改注入的重做意见：只交给被改段的那个阶段。
  if (meta.deepRedoNote != null) {
    const segOfStage = { explore: 'explore', gate: `gate-${gate ?? ''}`, outline: 'outline', gold: 'gold', chapters: 'chapters', merge: 'merge', final: 'final' }
    const mySeg = stage === 'gate' ? `gate-${gate}` : segOfStage[stage] ?? null
    // 先快照再消费：首个分支会 delete meta.deepRedoNote，后续分支不能再用它判段。
    const redo = meta.deepRedoNote
    if (mySeg !== null && redo.segment === mySeg) {
      brief.userFeedback = redo.note
      brief.hints = [...(brief.hints ?? []), `这是定点修改后的重做：用户这次的要求是「${redo.note}」。必须照着改；产物从零重做（旧版已留档）。`]
      updateMeta(projectId, (state) => { delete state.deepRedoNote })
    }
    if (mySeg !== null && redo.segment.startsWith('chapter-') && stage === 'chapters') {
      brief.userFeedback = redo.note
      brief.hints = [...(brief.hints ?? []), `定点修改后的重做：用户要求「${redo.note}」，从第 ${redo.segment.slice(8)} 章起重做。`]
      updateMeta(projectId, (state) => { delete state.deepRedoNote })
    }
  }
  const pendingIv = (meta.pendingInterventions ?? []).filter((i) => i.status === 'pending')
  if (pendingIv.length > 0) {
    brief.pendingInterventions = pendingIv.map((i) => ({ text: i.text, target: i.target ?? null, at: i.at }))
    brief.hints = [...(brief.hints ?? []), `有 ${pendingIv.length} 条用户留言要先处理（见 pendingInterventions），处理完用 workbench_act(action=intervene-done, id=...) 逐条销号，再继续手头的活。`]
  }
  // 票 22：随 brief 交出「这一份挂了哪些共用方法论文档」（去重后保序）——
  // 这是把「哪份文档该出现在哪个 brief」变成**可测事实**的那一步，不是给人看的新负担。
  brief.methodologyDocs = [...new Set(methodologyDocs)]
  return brief
}


/** POST /textbook/action 动作分发 */
// ─────────────────────────────────────────────────────────────────────────────
// 动作族 dispatch 表（架构候选 4 · ADR-0003 第二刀）：40 个顶层 case 按 9 个动作族
// 归组为 handler + action→handler 映射表；同文件 banner 分区、不拆物理文件。
// HTTP 层仍是唯一 external seam；族 handler 不对测试导出——现有 mkReq/mkRes fakes
// 即第二个 adapter。族边界 = 未来共享 domain module 的候选挂载点（见议题 01 协调注记）。
// ─────────────────────────────────────────────────────────────────────────────

/** 该关卡**盘上真实存在**的全部版次（`提案/关卡N-vM.md`，按版次升序）。
 *  判据＝磁盘实况——与 workbench-transitions/23 同一条（不是"最新"、更不是写死的 v1）。
 *  定点修改的归档名单照这条判据走才不会把修订件留在原地（dead-gates/18：留下就会被下一轮同名版次覆盖）。 */
function proposalFilesOnDisk(projectId, gate) {
  let names = []
  try { names = readdirSync(join(projectDir(projectId), '提案')) } catch { return [] }
  const re = new RegExp(`^关卡${gate}-v(\\d+)\\.md$`)
  return names
    .map((name) => { const m = re.exec(name); return m === null ? null : { rel: `提案/${name}`, version: Number(m[1]) } })
    .filter((entry) => entry !== null)
    .sort((a, b) => a.version - b.version)
    .map((entry) => entry.rel)
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
  const proposals = (from) => gates.filter((g) => g >= from).flatMap((g) => proposalFilesOnDisk(projectId, g))
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


/**
 * 票 13（spec 第 7 条 / 不变量 5「账本与 meta 同源」）：**账本被截断时同步意见集合**。
 *
 * 深改把时间线截断到该段起点之后，被删掉的 `textbook/review` 事件对应的意见必须从 `meta.pendingReviews`
 * 里一起去掉——否则会留下**孤儿意见**：界面点进去一条账本里已经没有对应事件的意见，而且它还会永远拦人
 * （按章交工只拦 `pending`，孤儿意见没人能销号）。
 *
 * 判据：意见 `r` 保留 ⇔ 截断后仍有一条 `textbook/review` 与它对应：
 *  - 带 id 的新账本（票 09 起）：`reviewId` 或 `id` 相等即对应（**同一章的新意见不会顶替旧意见**）；
 *  - 缺 id 的老意见：退化成「同章 ＋ 意见原文相等」。
 *
 * **上游章的意见不许被误删**：只有该章自己的 review 事件被截断、且没有别的对应事件时才移除——
 * 别的章一个都不碰。
 */
function syncPendingReviewsAfterTruncate(meta, events) {
  const reviews = meta?.pendingReviews
  if (!Array.isArray(reviews) || reviews.length === 0) return 0
  const reviewEvents = events.filter((e) => e.type === 'textbook/review')
  const kept = reviews.filter((r) => reviewEvents.some((e) => {
    const eventId = typeof e.data?.reviewId === 'string' ? e.data.reviewId : e.data?.id
    if (typeof eventId === 'string' && eventId !== '') return eventId === r?.id
    return e.data?.chapter === r?.chapter && String(e.data?.comment ?? '') === String(r?.comment ?? '')
  }))
  const dropped = reviews.length - kept.length
  meta.pendingReviews = kept
  return dropped
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
  readMeta,
  flushMeta,
  // ⚠️ writeMeta / metaCache / metaDirty / metaFlushHandle **刻意不导出**（ADR-0016 决策 2）：
  // engine 之外不该再有直接写状态的通道。四个写入入口＝updateMeta（读→改→写）、createMeta（建档）、
  // appendEvent（记一笔：账高与最后动静时刻的唯一写入者）、rollbackLedger（合法回退的账本重写）。
  // 防回潮断言见 test-ledger-seq-integrity.mjs（engine 之外出现这些标识符即判红）。
  updateMeta,
  createMeta,
  rollbackLedger,
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
  sealGoldStandard,
  sourcesDir,
  sourcesMdDir,
  runners,
  gateWaiters,
  parents,
  wakeMainAI,
  handoff,
  chapterArtifacts,
  chapterDone,
  chapterHasSubmitEvent,
  chapterGateMiss,
  announceCtx,
  bindAnnounce,
  bindContextOccupancy,
  readContextOccupancy,
  contextOccupancyBriefLine,
  disposeParent,
  getParent,
  projectRuntime,
  writeProposalDoc,
  proposeGate,
  proposeRevision,
  proposalFilesOnDisk,
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
  noteStyleSpecChange,
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
  syncPendingReviewsAfterTruncate,
}
