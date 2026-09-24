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

import { goldChapterNo, PHASES, EVENT_META, EVENT_TYPES, guessRoleFromName, gateHuman, stageLabelHuman, segmentHuman } from '../domain-rules.js'
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
      return `✍️ 最佳范例章意见#${o.seq}（${o.target ?? '笼统'}）${verbs[o.kind] ?? o.kind}${wish}`
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
    // 人读文本按票面口径说「交工被拒：<原因>」（不印机器阶段名）。
    case 'textbook/submit-rejected': return `🚫 交工被拒：${data.reason ?? ''}`
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
    case 'textbook/pause': return `⏸ 已暂停（${data.reason ?? '用户在造书工作台点击强制中断'}）`
    case 'textbook/resume': return `▶ 已继续`
    case 'textbook/outline-decision':
      return data.approved === true
        ? `✅ 章节安排已确认`
        : `↩️ 章节安排已被驳回，AI 正在重新安排`
    case 'textbook/gold-seal': return `🏆 最佳范例章已定稿（v${data.version ?? '?'}），意见沉淀入风格线（${data.count ?? 0} 条）`
    // 交工/提审被拒（票 01 (d)）：用户看得见机器挡下了什么——这正是被「机器报错、AI 说没事」坑过的那个用户。
    case 'textbook/submit-rejected': return `🚫 交工被拒：${String(data.reason ?? '').slice(0, 200)}`
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
    const message = {
      id: `tb-note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      role: 'user',
      source: { kind: 'plugin', plugin: 'dsh-craft-your-textbook', form: 'notice', summary: `工作台：${firstLine.slice(0, 60)}` },
      content: [{ type: 'text', text }],
    }
    const agent = ctx.get('agents')?.get?.(sessionId)
    if (agent !== undefined) {
      const status = typeof agent.status === 'string' ? agent.status : undefined
      if (status === 'running') {
        if (typeof agent.inject !== 'function') return
        agent.inject(message)
        return
      }
      if (status !== 'idle') {
        ctx.logger.warn('textbook: 播报跳过——拿不到 agent.status，无法确认回合已收口')
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
  if (agent === undefined) return false
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
  updateMeta(projectId, (meta) => {
    meta.pendingStage = stage
    meta.pendingGate = gate
    meta.wakeToken = (meta.wakeToken ?? 0) + 1
    meta.status = 'running'
  })
  const label = stageLabel(stage, gate)
  appendEvent(projectId, 'textbook/stage-start', { stage, gate, label })
  try {
    writeSnapshot(projectId, `交办「${stageLabelHuman(label)}」之前`)
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
 * 过目闸门「全部章节都写好了」的单章判据（票 14，**界面数字与闸门共用这一份**，不许写第二份）：
 *  ① 两份产物存在（`work/chapter-NN.md` ＋ `work/audit-NN.md`，今天已有）；
 *  ② 该章有机器记下的「交工通过」（见 chapterHasSubmitEvent）；
 *  ③ 该章**没有未处置（`status === 'pending'`）的抽查意见**——这条是票 10「翻案 → 这本书重新被拦住」
 *     的服务端一半：翻案把意见写回 `pending` 之后，**即使该章早就交工过**，过目闸门也必须重新拦住它。
 *
 * 老书/在建书不新造迁移：某章没交工就重新走既有逐章交工（`stage-submit chapters` 那个写入点在），
 * **不退回到「按文件判」兜底**（不变量 2）。
 */
function chapterDone(projectId, n, meta = null, events = null) {
  return chapterGateMiss(projectId, n, meta, events) === null
}


/**
 * 同一份判据的「差在哪一项」形态（**不重复判据，只给结论起个名**）：
 * 满足返回 `null`，不满足返回 `{ reason: 'artifact' | 'review' | 'submit' }`——
 * `chapters-review-confirm` 闸门要据此说清「是产物缺、还是该章有未处置意见、还是压根没交工」。
 * 三项与 chapterDone 一一对应，顺序也一致。
 */
function chapterGateMiss(projectId, n, meta = null, events = null) {
  const { chapterPath, auditPath } = chapterArtifacts(projectId, n)
  if (!existsSync(chapterPath) || !existsSync(auditPath)) return { reason: 'artifact' }
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
        // 改在改法里写（不拿手里那份旧状态整份写回）：生成要 await，期间账本可能已经动过。
        updateMeta(projectId, (state) => { state.outline = outline })
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
        appendEvent(projectId, 'textbook/agent-end', { label: `写第${n}章`, outcome: 'ok' })
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


/** 剥掉 human 路线的 loader 指令区（装配说明，留给 AI 老师，不是成品脚手架残留）。 */
function stripLoaderRegion(text) {
  return String(text).replace(/<!-- loader:begin -->[\s\S]*?<!-- loader:end -->/g, '')
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
    appendEvent(projectId, 'textbook/agent-end', { label: '最后检查（质量门）', outcome: 'ok' }, Date.now() - startedAt)
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
    {
      name: '没有遗留的 AI 笔记/脚手架',
      ok: residue.length === 0 || scaffoldWaived,
      note: scaffoldWaived ? '你已同意：保留 AI 的笔记不删' : (residue.length === 0 ? '没有留下 AI 的草稿痕迹' : `发现这些标记没清掉：${residue.slice(0, 3).join('；')}`),
    },
    { name: '练习与答案齐全', ok: /练习|答案|习题/.test(bookText) || otherWaived || styleSpecDeclaresNoExercises(projectId), note: otherWaived ? '你已同意：以你的说明为准' : (styleSpecDeclaresNoExercises(projectId) ? '写作规范里说了这本书不设练习' : '成品里有练习和答案') },
    { name: '与已拍板的设计一致', ok: gatesApproved || gateWaived, note: gateWaived ? '你已同意：跳过设计拍板' : (gatesApproved ? '三次设计拍板都过了' : '还有设计拍板没过') },
    { name: '源材料引用可追溯', ok: sourceCount > 0 || otherWaived, note: otherWaived ? '你已同意：以你的说明为准' : `${sourceCount} 份源材料都用上了` },
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
  // 事实矛盾（机器层，票 20 改口径）：重复标题 = 疑似重复/冲突内容；深层的语义矛盾由 AI 自查报告承载。
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
    // 票 20（2026-09-24 用户拍板）：这条**是真门槛**——有重复标题就 `ok:false`、交付被拦（走既有
    // 「机器打回 → AI 修 → 重新终检」回路）。推翻 ADR-0008 修订 3 的后半条（「线索级、不拦交付」）：
    // README 已对用户承诺「机器兜底再验一遍：…没有重复的标题」，`ok` 恒真等于空头承诺。
    // 判据强度照实写：查的是**全书标题去重**——同一内容性标题在书里出现不止一次就算（同章内重复
    // 同样算），**不叫「跨章」**；机器只看字符串，同名是否**真矛盾**仍是语义判断，归 AI 自查报告与
    // 合并前跨章审计（「机器扫结构、AI 查语义」分工不变，变的是机器这一侧的强度）。
    // 误伤出口：`other` 豁免仍放行（豁免是人手动放行，不是常规路径）。`warn` 保留（第三态表征），
    // 只是这条不再出现「ok:true + warn:true」。
    // 注意：不要再把 `ok` 改回恒真——那会让这条退回空头承诺（test-gate-write-points.mjs 钉着）。
    checks.push({
      name: '无重复标题',
      ok: dup.length === 0 || otherWaived,
      warn: dup.length > 0,
      note: dup.length === 0
        ? '全书没有重复的内容性标题'
        : (otherWaived
          ? `你已同意：以你的说明为准（重复标题：${dup.slice(0, 3).join('、')}）`
          : `发现重复标题 ${dup.slice(0, 3).join('、')}——同一个标题在书里出现不止一次（同章内重复也算），请合并或改写重名的小节，改完重新交工做最后检查`),
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
      brief.task = `手工起草${gateHuman(gate)}的设计方案，用人话向用户解释，等用户拍板。`
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
        'work/style-spec.md -- 写作规范（十问契约，节标题齐全）：模式选型（考虑过哪些/拒绝了哪些/为什么；每个模式对应本书哪个教学问题）、章内板块语法完整版、情境钩子写法、正文语言风格、量化参考密度、深度四维承诺表（四维各用什么板块兑现到什么程度）、最佳范例章写作惯例区（本稿回填）、防幻觉铁律、写作纪律（一个 agent 写几章/篇幅约束/排除项）、脚手架标题清单（交付前拆除用）。',
        `work/chapter-${String(gn).padStart(2, '0')}.md —— 第 ${gn} 章全文（按 style-spec，含全部板块与答案；约 ${brief.targetWords} 字，宁可多写不可敷衍）`,
        `work/audit-${String(gn).padStart(2, '0')}.md —— 审计记录（四层审计 + 试教[条件触发]，严格 JSON：{"passed":true,"issues":[{"level":"错误|警告|提示","text":"具体问题"}]}）`,
      ]
      brief.materials = sources
      brief.methodology = `${mtl('references/file-contracts.md')}\n\n${mtl('references/audit-and-testing.md')}`
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
      // F39（2026-08-20 走查）：段落级抽查意见也透出给 AI（整章意见带 comment，段落意见合成人话；已撤销的跳过）。
      // 票 09：**必须带 id**——没有 id，主笔 AI 交工时无从点名（handledReviews 按 id 销号）。
      brief.pendingReviews = (meta.pendingReviews ?? []).filter((r) => r.status !== 'revoked').map((r) => ({ id: r.id, chapter: r.chapter, comment: paragraphReviewText(r) }))
      brief.methodology = `${mtl('references/audit-and-testing.md')}\n${mtl('references/file-contracts.md')}\n${mtl('references/subagent-prompts/writing-agent-prompt.md')}\n${mtl('references/subagent-prompts/audit-agent-prompt.md')}`
      brief.hints = [
        '并行纪律：remaining 各章可并行派多个写作小助手，并发 2-4 章为宜（低内存/老机器从 2 起）；每章一个写作小助手、各章独立文件（chapter-NN.md / audit-NN.md），绝不共享工作区写同一文件；各章各自完成后逐个交工验货（ordered-commit：慢章压住快章属预期，不必等齐）。宿主不支持并行 spawn 时小助手自动排队，退化为逐章串行，行为与现状等价。',
        '派小助手/审计小助手时提醒：文件操作用文件工具（read/write/edit/glob/grep），别用 shell（工具纪律见 audit-and-testing.md §九，跨平台一致）。',
        '小助手与审计小助手用你的 subagent 工具派；提醒小助手材料小节与产出文件的准确路径（都在 dir 下）。',
        '每交一章前先 workbench_status 查有没有新抽查意见，有就先处理（修订 → 重新审计 → 机器验货）再继续；该章意见未处置机器会拒收。',
        '处置过的抽查意见要在交工时报出：stage-submit（stage=chapters）带 handledReviews:[{id, how}]——id 取 pendingReviews 里那一条，how 是一句人话（这条我怎么改的）。机器**只给点名的**置为已处置，没点名的继续拦；一条都不点名就交工会被 400 打回。',
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
      brief.task = `最后检查：亲自读 work/book.md，逐项自查（成品完整、每章有自查记录、无 AI 脚手架残留、练习与答案齐全、与已拍板设计一致、材料可追溯、无引用矛盾与事实矛盾），发现问题先修，再把你的自查报告（人话）随 stage-submit（stage=final, report=...）交工。${REPORT_WORDING_RULE}交工时若本书还有生效中的风格线（workbench_status 的 styleNotes 里 status 为 active 的那些），必须对**每一条**逐条交代去向，用 styleCheck:[{id, status, note?, chapter?}] 随交工一起交：adopted＝已落实（写清落实在哪章）、conflict＝与哪一章冲突（note 必写一句冲突理由）、superseded＝已不再适用；漏一条机器会拒收。机器硬检查会兜底（乱码/章节数/必含板块/禁用词，判据来自已拍板的 style-spec/outline）；全过后你在工作台等用户「认可」才算交付。`
      brief.counts = { chapters: (meta.outline?.chapters ?? []).length, sources: (meta.sources ?? []).length }
      brief.methodology = mtl('references/delivery-checklist.md')
      brief.outputs = ['维护 work/progress.md（每章一行：写完/审计/验货）']
      // 终检被用户驳回后的修订意见（final-approve approved=false → 原地循环）。
      // 意见在 stage-submit final 通过时才销号（2026-08-27 grill 修订）：领任务改纯读、无副作用，
      // AI 重领任务/机器打回后重领都仍带意见；「重做意见只对本轮生效」语义不变（与 exploreRedoNote/goldRedoNote 同构）。
      if (meta.finalRedoNote != null) {
        brief.userFeedback = meta.finalRedoNote
        brief.hints = [...(brief.hints ?? []), `这是最后检查的修订：用户对整本书的意见是「${meta.finalRedoNote}」。按意见修整本（改 book.md），改完重新自查一遍再交工。`]
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
  syncPendingReviewsAfterTruncate,
}
