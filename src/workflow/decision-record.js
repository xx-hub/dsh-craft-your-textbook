/**
 * 结论件（「站结论」）的**唯一写点** ＋ 读侧 ＋ 下游那句三行指针
 * （票 `confirm-points-redesign-build/01`；形状的权威源＝
 * `.scratch/confirm-points-redesign/issues/04-拍的结论怎么落盘.md` 的 `## Answer` §1／§2，
 * ⛔ 本文件不重新决定任何口径，只把已裁的形状落成代码）。
 *
 * ## 它是什么
 *
 * 人拍完一个确认点（一站），机器在**拍板那个动作里**落一份结构化的结论件
 * `工作区/决策/NN.json`（`NN` ＝站号，两位、从 `00` 起）——九个基键 ＋ **可选** `values`
 * ＋ **可选**的出处格（`autoSkipped`／`skipReason`／`inheritedFrom`／`eventId`／`at`，票
 * `decision-provenance/01` D1=A：`decidedBy` 闭集只有 `human`／`machine`）。
 * 一句话：**账本仍是流水，结论件是「这一站拍过什么」的可读件**；正文 `关卡N-vM.md`
 * 仍归 `writeProposalDoc`，结论文档⛔ 不装方案内容。
 *
 * ## 三条不许破的纪律（照 04 §1 逐条落）
 *
 * ① **从站 1 起一站一份**；⛔ **站 0 不留**（它的内容就是 `meta`，再写一份＝两处真相）
 *    ⇒ {@link recordStationDecision} 对站 0 **响亮拒绝**，不静默写。
 * ② **驳回也留**（`approved:false` 照写一份同形的）；它的读者只有「重做这一站」那次交办件。
 * ③ **写点只此一处**：⛔ 不十处各写一遍。今天唯一调用点在
 *    `src/workflow/actions/gates.js` 的 `case 'gate-decide'`（与 `appendEvent` **同一处**）。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）
 *
 * · {@link POINTER_READ_MODE} 那张表**照 spec §4.2 的「三型」逐字抄**（站 3／4／8／9 乙型、
 *   站 5／6／7 甲型）。它只保证「表里这几站的读法不会抄漏」，**不保证**「现实里只有这七站会收指针」
 *   ——本票只把**站 5** 接上生产（tracer bullet），其余各站的接线归别的票；接了线而没进这张表的站
 *   会走 {@link POINTER_READ_MODE} 的兜底（`whole-file`）而**不会报错**。
 * · {@link SUPPORTING_ARTIFACTS}（旁证产物）今天只登记**剔除件**一件（spec §4.3 点名的「典型旁证」）。
 *   现实里旁证不止一件时，缺的那几件不会被降级句点到名。
 * · 「AI 真的读了它」这一半**机器验不了**：本文件只做到「那句在 ＋ 它指的件在」。
 *   ⛔ 任何地方都不许把这半边写成「已验」（spec §4.3／05 §3 第 1 条）。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { DECISION_DIR_NAME, DECISION_DIR_REL, GATE_TOPIC, KNOWLEDGE_MAP_EXCLUSIONS_REL } from '../domain-rules.js'
import { bookRelOnDisk, projectDir, timelinePath, workDir } from './engine/paths.js'
// ⚠️ 「上游那一站被跳过没有」的唯一事实源是 `meta.skippedSteps`（`engine.js` 的 `stepSkipped` 读的就是它）
// ⇒ 这里**复用**它，⛔ 不另读账本、也不自己造第二种「跳过」的表示。
import { readMeta } from './engine/store.js'

/**
 * 结论件那一层目录名／书夹相对路径的**唯一出处是 `domain-rules.js`**（那里 `SWEEP_EXCLUDED`
 * 在模块初始化时就要引用它，见那条「多件永远红」的理由）。⛔ 本文件不手抄第二份；
 * 这里只把它们**再导出**给同族消费者（判据、下游票）。
 */
export { DECISION_DIR_NAME, DECISION_DIR_REL }

/**
 * 结论文档的九个键（**插入序即字节身份**：`JSON.stringify` 按插入序输出，
 * 与 04 §1 那个 JSON 例子逐字同形）。可选的 `values` **不在**这张表里——
 * 它的口径是「没有值的站不写这个键、⛔ 不填 `null` 占位」。
 */
export const STATION_DECISION_KEYS = Object.freeze([
  'station', 'title', 'approved', 'decidedAt', 'version', 'decidedBy', 'reasons', 'userNote', 'proposal',
])

/**
 * `decidedBy` 的**闭集**（票 `decision-provenance/01` D1=A）。
 *
 * 只有两个值：`human`／`machine`。⚠️ **没有第三值 `inherited`**——继承不是第三类决策来源，
 * 它仍然是「没有人拍板」，只是沿用了上一站的人类裁决，来源必须仍是 `machine`；
 * 「是否跳过」与「继承自哪一站」用独立字段 {@link autoSkipped}／{@link skipReason}／{@link inheritedFrom}。
 *
 * ⚠️ 老账本／老结论件里可能还有 `agent-proxy`（票 01 之前那一版闭集）。**读侧不拒绝**它，
 * 但写侧⛔ 不再产出它：它按 `machine` 处理（AI 代拍不是人类动作）。
 *
 * ⚠️ 票 `quality-review-2026-10-29/07`：它**不导出**（全仓零外部消费者）——零消费者符号留在导出面上
 * ＝白付一格 interface（`ADR-0044` 决策 2 第六行）。留着它是为了让「闭集」有一处机器可读的落点，
 * 并由**本文件内部**唯一那个写侧校验口 {@link recordProvenanceFix} 真去 `includes` 它
 * （不是「声明了一个没人守的闭集」）。防回潮格在 `test/test-ledger-seq-integrity.mjs` 的
 * 「零消费者符号」那一组。
 */
const DECIDED_BY_VALUES = Object.freeze(['human', 'machine'])

/** 人工动作事件在账本 `hint` 里的标记（`data.machine`）——见 {@link verifyHumanEvent}。 */
export const HUMAN_ACTION_MARKER = 'human-action'

/** 纠偏文件的书夹文件名（与 `决策/NN.json` 同目录；票 `decision-provenance/01` D2=A）。 */
export const PROVENANCE_FIXES_FILE_NAME = 'provenance-fixes.json'

/**
 * 人工动作事件与结论件之间的**最大允许时差**（票 `decision-provenance/01` D3=A 的加强）：
 * 同一请求里「落人工事件 → 写结论件」是毫秒级；给 5 分钟余量只为容纳慢盘／时钟粒度。
 * ⚠️ 它挡的是「拿一条今天早些时候的人工事件去给另一站签名」那种重放；⛔ 不证明屏幕前有人。
 */
export const HUMAN_EVENT_MAX_AGE_MS = 5 * 60 * 1000

/** 站 4／5／6 ≡ 关卡 1／2／3（04 §1 末尾那张「站号 ↔ 老名字」表的机器读法）。 */
export const GATE_OF_STATION = Object.freeze({ 4: '1', 5: '2', 6: '3' })

/** 关卡 1／2／3 → 站号（`GATE_OF_STATION` 的反向；同一条事实，两向都只在这一处派生）。 */
export const STATION_OF_GATE = Object.freeze(
  Object.fromEntries(Object.entries(GATE_OF_STATION).map(([station, gate]) => [gate, Number(station)])),
)

/**
 * **站 2**（「AI 读得对不对 ＋ 这本书教到哪儿」）——票 `confirm-points-redesign-build/04` 接上的写点，
 * `10` 补上**停点主题的正名**。
 *
 * ⚠️ 它**不是关卡站** ⇒ **不在** {@link GATE_OF_STATION} 里（那张表只有 4／5／6 ＝关卡 1／2／3）；
 * 它的主题名走 {@link STATION_TOPIC}（§3.0 总表「主题」那一列的机器载体），⛔ 不从关卡那条派生。
 */
export const STATION_EXPLORE = 2

/**
 * **站 2 停点主题的正名**（＝§3.0 总表「主题」那一列那半句）——票 `confirm-points-redesign-build/10`
 * 逐条落点第 3 条。
 *
 * 权威源＝`.scratch/confirm-points-redesign/spec.md` §3.0 总表「主题」那一列 ＋ §3.2 站 2 小节
 * ＋ 规划票 `confirm-points-redesign/08` 的 `## Answer` §0／§2 末条（「停点主题名今天只说了一半，
 * spec 里要正名」）。
 *
 * ⚠️ **是同一个停点**：站 2 仍是一颗键的停点（`✅ 满意，继续设计`／`🔁 让 AI 重做`／`👀 看完整报告`），
 * **确认点总数仍是 10**（`08` §2 逐字）——正名⛔ 不是新开一站、⛔ 不是加一颗键。
 * ⚠️ 括号里那一半（「这本书教到哪儿」）落在这儿**只到名字这一层**：rcb 的两件（问卷那一块、
 * 图上那把划子）落在同一张卡／同一张图上，见 `src/ui/confirm-cards.js` 与
 * `src/ui/knowledge-graph-map.js`；「AI 真的读了那份下沿」**只有承诺**，⛔ 不写成「已验」。
 *
 * ⚠️ **这是「主题」本身**；结论件 `title` 那一格是**拼出来的**（`第 2 站 · <主题>`），
 * 与关卡那三站的 `第 N 关 · <主题>` 同形——⛔ 别在调用处再手写一份带前缀的字符串。
 */
export const STATION_EXPLORE_TOPIC = 'AI 读得对不对 ＋ 这本书教到哪儿'
/**
 * 站号 → 人读的**主题**——**非关卡站**那一支（今天只有站 2）。
 * ⚠️ 关卡 4／5／6 的主题照旧从 `GATE_TOPIC` 派生（⛔ 不手抄第二份）；这张表只装不是关卡的那些站。
 * 加一站就往这儿加一行，⛔ 不在调用处手写字符串（那样同一个名字就有两处来源）。
 */
const STATION_TOPIC = Object.freeze({
  [STATION_EXPLORE]: STATION_EXPLORE_TOPIC,
})

/** 站 2 那一站的正文（`proposal.file`）——探查报告；spec §3.2 站 2 那一行逐字。 */
export const STATION_EXPLORE_BODY_REL = '工作区/explore.md'

/**
 * **站 3**（「学完能做到什么」）——票 `confirm-points-redesign-build/05` 接上的写点。
 *
 * ⚠️ 与站 2 同一条道理：它**不是关卡站**（{@link GATE_OF_STATION} 只有 4／5／6 ＝关卡 1／2／3）
 * ⇒ {@link stationTitle} 对它给的是兜底的「第 3 站」；正名由调用处**显式传 `title`**
 * （{@link STATION_GOALS_TITLE}）给值，⛔ 不改 `stationTitle` 的派生口径
 * （那一格是「站号 ↔ 主题」那张表在机器上的读法，改它会连带动 4／5／6 的说法）。
 */
export const STATION_GOALS = 3

/** 站 3 的主题正名（spec §3.2 站 3 那一节的小标题逐字）。 */
export const STATION_GOALS_TITLE = '学完能做到什么'

/**
 * 收指针那一站的**有界读法**（spec §4.2 的「三型」）：
 * **甲型** `proposal-section`＝上游正文是方案文档（`writeProposalDoc` 写死的 `## 摘要` ＋ `## 完整方案`）
 * ⇒ 读 `## 完整方案` 一节；**乙型** `whole-file`＝上游正文是整份文件（散文／JSON／章正文）⇒ 读整个文件。
 * ⛔ 两种形态都要有（票面落点），今天**接上生产的只有站 5**（甲型）。
 */
export const POINTER_READ_MODE = Object.freeze({
  3: 'whole-file', 4: 'whole-file',
  5: 'proposal-section', 6: 'proposal-section', 7: 'proposal-section',
  8: 'whole-file', 9: 'whole-file',
})

/**
 * **旁证产物**（缺 ⇒ 降级，照开；spec §4.3「典型旁证＝剔除件」）。
 * 它**不是**硬闸判据：没人划过知识点时这本书上本来就没有剔除件。
 */
export const SUPPORTING_ARTIFACTS = Object.freeze({
  3: Object.freeze([KNOWLEDGE_MAP_EXCLUSIONS_REL]),
  4: Object.freeze([KNOWLEDGE_MAP_EXCLUSIONS_REL]),
  5: Object.freeze([KNOWLEDGE_MAP_EXCLUSIONS_REL]),
  6: Object.freeze([KNOWLEDGE_MAP_EXCLUSIONS_REL]),
  7: Object.freeze([KNOWLEDGE_MAP_EXCLUSIONS_REL]),
})

/** 站号 → 结论件的**文件名**（`NN.json`，两位、从 `00` 起）。⚠️ 文件名模板**只此一份**（读写两侧都引它）。 */
export function stationDecisionFileName(station) {
  return `${String(Number(station)).padStart(2, '0')}.json`
}

/** 站号 → 结论件的书夹相对路径（`工作区/决策/NN.json`）。 */
export function stationDecisionRel(station) {
  return `${DECISION_DIR_REL}/${stationDecisionFileName(station)}`
}

/** 站号 → 结论件的绝对路径。⚠️ 只算路径、**不建目录、不碰盘**（读侧要用它）。 */
export function stationDecisionAbs(projectId, station) {
  return bookRelOnDisk(projectId, stationDecisionRel(station))
}

/** 收指针的那一站（`station`）所指的**上游那一站**：结论件的号 ＝ 站号 − 1。 */
export function upstreamStationOf(station) {
  return Number(station) - 1
}

/**
 * **段 → 被这一段的「重做」波及的站**（含**被重做的那一站自己**）——票 `confirm-points-redesign-build/09`。
 *
 * 权威源＝spec §4.5 的「闭包」＋规划票 `confirm-points-redesign/14` 的 `## Answer` §1 那张十行表
 * （「重做它 ⇒ 要重走的站」那一栏，逐行抄成机器可读的形态）。spec §4.4 第 2 条：**被打回的段其结论文档
 * 归档**、保留的上游留着 ⇒ 这张表就是「哪些站的结论件跟着归档」的**唯一一处**枚举。
 *
 * ⚠️ **表按站写、机器按段执行**（spec §3.0 的「一次产出、两个停点」）：站 2／3 共住 `explore`、
 * 站 8／9 共住 `gold` ⇒ 那两段各自带回**两个**站。⛔ 不为「只重走其中一站」新增更细的深改目标。
 * ⚠️ 站 4／5／6 ＝关卡 1／2／3（`GATE_OF_STATION`）；⛔ 这里不引那张表，注释里的站号是十行表读法。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）：
 * ① 这张表**逐条抄自十行表**，只保证「表里那七档段不会抄漏」；`chapter-N`／`merge`／`final`
 *    在十行表里没有对应的站行（章级重做＝射程外的铺章那一段），所以这里给空表——
 *    现实里若哪一天「重做某一章 ⇒ 上游那一站的结论也作废」，这张表**看不出来**。
 * ② 它只回答「哪些站的结论件要跟着归档」，「下游状态清掉／账本截断／待办指回」那三件事
 *    今天仍散在 `deepAffected` 各档体与 `actions/deep-modify.js` 里（spec 债-42：同一事实多份拷贝）。
 * ③ 域名层：**站 9 在射程内没有下游站**（十行表最后一行），所以 `gold` 那一档只到 8／9。
 */
export const SEGMENT_DECISION_STATIONS = Object.freeze({
  explore: Object.freeze([2, 3, 4, 5, 6, 7, 8, 9]),
  'gate-1': Object.freeze([4, 5, 6, 7, 8, 9]),
  'gate-2': Object.freeze([5, 6, 7, 8, 9]),
  'gate-3': Object.freeze([6, 7, 8, 9]),
  outline: Object.freeze([7, 8, 9]),
  gold: Object.freeze([8, 9]),
  merge: Object.freeze([]),
  final: Object.freeze([]),
})

/**
 * 段 key → 这一段的「重做」要跟着归档的**结论件**（书夹相对路径，规范形状）。
 *
 * @param {string} segKey `deepAffected` 认的那七档 ＋ `chapter-N`
 * @param {number|null} [goldChapter] 范例章是第几章（`goldN(meta)`）。**只在 `chapter-N` 那一档**用得上：
 *   重做的这一章**就是范例章**时，它等于重做 `gold` 那一段（站 8／9 的结论随之作废）；
 *   重做**别的**章时站 8／9 的结论件不归它管（它们说的是范例章那一稿，不是这些章）。
 * @returns {string[]}
 */
export function segmentDecisionRels(segKey, goldChapter = null) {
  const key = String(segKey)
  const m = /^chapter-(\d+)$/.exec(key)
  const stations = m === null
    ? (SEGMENT_DECISION_STATIONS[key] ?? [])
    : (goldChapter !== null && Number(m[1]) === Number(goldChapter) ? SEGMENT_DECISION_STATIONS.gold : [])
  return stations.map((n) => stationDecisionRel(n))
}

/**
 * 上游那一站**是被用户跳过的吗**（`meta.skippedSteps` 里有没有 `gate-N`）。
 *
 * 为什么要这一问（票面落点 (c) 的边界，2026-10-16 编排会话补）：用户**只跳过第 1 关**
 * （引擎里 `stepSkipped(projectId, 'gate-1')` 那条支，读的就是 `meta.skippedSteps`）时，
 * 流程会走到站 5，而站 4 的结论件**本来就不该有**——那时按「缺件 ⇒ 硬停」会把这一站
 * **永远拦死**（没有出路）。⇒ 口径：
 *   · **跳过了**那一站而件不在 ⇒ 不给指针、也**不拦**（「按现状办」）；
 *   · **没跳过**而件不在 ⇒ **硬停**（spec §4.3：拍过板／该有件却没有）。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：这里只认 `meta.skippedSteps[].step === 'gate-N'` 这一种
 * 「跳过」写法（今天唯一的写法，出处＝`engine.js` 的 `stepSkipped`）；将来若长出别的表示「这一站
 * 不必有结论件」的路，这一问要跟着改，否则那种书会被误判成硬停。
 */
function upstreamGateSkipped(projectId, upstreamStation) {
  const gate = GATE_OF_STATION[Number(upstreamStation)]
  if (gate === undefined) return false // 上游不是关卡站（机器工序那一档）⇒ 照旧「缺件＝硬停」
  const meta = readMeta(projectId)
  return (meta?.skippedSteps ?? []).some((s) => s?.step === `gate-${gate}`)
}

/**
 * 站号 → 人读的主题名（04 §1 的 `title` 那一格）。4／5／6 从 `GATE_TOPIC` 派生（⛔ 不手抄第二份）；
 * 非关卡站从 {@link STATION_TOPIC} 取（站 2 ＝ 票 `confirm-points-redesign-build/10` 的正名）；
 * 两处都没有 ⇒ 兜底「第 N 站」。
 */
export function stationTitle(station) {
  const n = Number(station)
  const gate = GATE_OF_STATION[n]
  if (gate !== undefined) return `第 ${gate} 关 · ${GATE_TOPIC[gate]}`
  const topic = STATION_TOPIC[n]
  return topic === undefined ? `第 ${n} 站` : `第 ${n} 站 · ${topic}`
}

/**
 * 读一份结论件。**读不出就是 `null`**（⛔ 不抛、不替它编一份空的）——
 * 「件不在＝没拍过」是 spec §4.4 里一句机器能验的话，读侧必须原样保留这个事实。
 *
 * @param {string} projectId
 * @param {number} station
 * @returns {object|null}
 */
export function readStationDecision(projectId, station) {
  try {
    const parsed = JSON.parse(readFileSync(stationDecisionAbs(projectId, station), 'utf8'))
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * 一份结论件**算不算「这一站拍板过」**——「拍板过没有」这个判定的**唯一一处**。
 *
 * 判据就一句：`approved === true`。两个反面各有各的实话，⛔ 都不算拍板过：
 *   · `approved: false` —— 驳回也留一份同形的（见本文件头「三条不许破的纪律」②），它是
 *     「用户表过态、这一稿没过」，不是「站拍过了」；
 *   · `null` —— 件不在（这一站还没走到／没拍过）。
 *
 * 谁读它：界面那一半（`workflow.js` 的 `stationDecisionsOf` 折 `meta.stationDecisions`）与
 * 服务端那道前置（`actions/gold.js` 的 `gold-approve`：spec §244／§535「定稿键的前置＝站 9 已
 * 拍板」）。两处读的是**同一份件、同一个比较**，⛔ 不许各自再写一遍 `=== true`——那就成了
 * 两份「站 9 拍没拍」的判定，漂了也看不出来。
 *
 * @param {object|null|undefined} record {@link readStationDecision} 的返回值
 * @returns {boolean}
 */
export function decisionApproved(record) {
  return record !== null && typeof record === 'object' && record.approved === true
}


/** 纠偏文件的书夹相对路径（`工作区/决策/provenance-fixes.json`）。 */
export function provenanceFixesRel() {
  return `${DECISION_DIR_REL}/${PROVENANCE_FIXES_FILE_NAME}`
}

/** 纠偏文件的绝对路径（**只算、不建**）。 */
function provenanceFixesAbs(projectId) {
  return bookRelOnDisk(projectId, provenanceFixesRel())
}

/**
 * 读纠偏清单（票 `decision-provenance/01` D2=A）。
 *
 * 形状：`{ "fixes": [ { file, station, was, corrected, autoSkipped, reason, at } ] }`。
 * 读不出来／形状不对 ⇒ 空清单（⛔ 不抛：纠偏是**增量**，文件不在是正常的）。
 *
 * @param {string} projectId
 * @returns {object[]}
 */
export function readProvenanceFixes(projectId) {
  try {
    const parsed = JSON.parse(readFileSync(provenanceFixesAbs(projectId), 'utf8'))
    const fixes = parsed?.fixes
    return Array.isArray(fixes) ? fixes.filter((fix) => fix !== null && typeof fix === 'object' && !Array.isArray(fix)) : []
  } catch {
    return []
  }
}

/**
 * 追加一条**显式纠偏**（票 `decision-provenance/01` D2=A）。
 *
 * ⚠️ 纠偏**不改写** `决策/NN.json` 原文件——原文件字节保持不变，纠偏只住在这份
 * `provenance-fixes.json` 里；读侧 {@link readEffectiveStationDecision} 负责 apply。
 *
 * @param {string} projectId
 * @param {{file?: string, station: number, was: 'human'|'machine', corrected: 'human'|'machine',
 *   autoSkipped?: boolean, reason: string, at?: string}} fix
 * @returns {{rel: string, abs: string, fix: object, fixes: object[]}}
 */
export function recordProvenanceFix(projectId, fix = {}) {
  const station = Number(fix.station)
  if (!Number.isSafeInteger(station) || station < 1) {
    throw new Error(`纠偏的站号必须是从 1 起的整数（收到 ${JSON.stringify(fix.station)}）`)
  }
  if (!DECIDED_BY_VALUES.includes(fix.was)) {
    throw new Error(`纠偏的 was 只能是 human／machine（收到 ${JSON.stringify(fix.was)}）`)
  }
  if (!DECIDED_BY_VALUES.includes(fix.corrected)) {
    throw new Error(`纠偏的 corrected 只能是 human／machine（收到 ${JSON.stringify(fix.corrected)}）`)
  }
  const reason = typeof fix.reason === 'string' ? fix.reason.trim() : ''
  if (reason === '') throw new Error('纠偏必须写清 reason（为什么这一条曾被误标）')
  const normalized = {
    file: typeof fix.file === 'string' && fix.file !== ''
      ? fix.file
      : `${DECISION_DIR_NAME}/${stationDecisionFileName(station)}`,
    station,
    was: fix.was,
    corrected: fix.corrected,
    autoSkipped: fix.autoSkipped === true,
    reason,
    at: typeof fix.at === 'string' && !Number.isNaN(Date.parse(fix.at)) ? fix.at : new Date().toISOString(),
  }
  const fixes = [...readProvenanceFixes(projectId), normalized]
  const abs = provenanceFixesAbs(projectId)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, `${JSON.stringify({ fixes }, null, 2)}\n`, 'utf8')
  return { rel: provenanceFixesRel(), abs, fix: normalized, fixes }
}

/**
 * 一条**人类动作事件**是否真的在会话事件流（本书账本）里。
 *
 * 票 `decision-provenance/01` D3=A 的全部强度就在这里：`human` **只认**一条同时带
 * `eventId` 与 `at` 的事件，而且那一条必须能在账本里按 `seq` ＋ `time` 查到、并且是机器写的
 * **人工动作标记**（`textbook/hint` ＋ `data.machine === 'human-action'`）。调用方只传一个
 * `decidedBy:"human"` 而没有任何事件 ⇒ 本函数返回 `null`，写点强制降级。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：只认本仓 HTTP adapter（`workflow.js` 的 `handleAction`）
 * 在**工作台通道**落的那一种标记；别的通道（AI 的 `agent-tool`）今天不落它 ⇒ 那一类调用
 * 一律按 machine 记账。将来若长出第二条真人通路，要同步扩这里，否则那条通路会被误降级。
 *
 * ⚠️ **为什么必须自读账本（票 `quality-review-2026-10-29/07` 的裁决留档，⛔ 不是漏写注释）**：
 *   ① **成环**：本模块被 facade `src/workflow/engine.js` import（那边 `:119` 那次 import 就在它里面），
 *      而 `readEvents` 是 engine **内部**的读法；本文件反过来 import facade 的它就是一条环，方向也反了
 *      （子模块依赖 facade）。⇒ 这里只能自己按 `timelinePath()` 读那一份。
 *   ② **更承重的是强度**：D3=A 的全部保证落在**写点**——「调用方声称 human 只是声称」这件事要由
 *      写点**自己**核账本。若把「查得到／查不到」交给调用方算好递进来，写点就只能信任一个布尔，
 *      `test/test-station-decision-record.mjs` 那条反证（「传 human 但账本里查不到 ⇒ 落盘必须是
 *      machine」）就无处可放 ⇒ 等于放宽判据（`docs/测试信任边界.md` 总纲：声称的强度必须等于
 *      实现的强度）。
 *   ⇒ 保留自读，并把它**登记进「读账本面」那道判据的扫描面**（`test/test-step-submit-evidence.mjs`
 *   第 ④ 节：直读账本文件**恰好 1 处**且必须落在本文件；登记册那一行＝`docs/测试信任边界.md` 里
 *   `test-step-submit-evidence.mjs` 那行）。**这份第二读法不证明什么**：它只证明「这条引用在账本里
 *   按 `seq` ＋ `time` ＋ human-action 标记 ＋ 动作名查得到」；⛔ 不证明屏幕前真的有人、
 *   ⛔ 不证明两个读法读到的字段完全一致（字段筛选是这里自己写的字面量）。
 *
 * @param {string} projectId
 * @param {{eventId?: string|number, at?: string, action?: string}|null|undefined} humanEvent
 * @param {string} decidedAt 结论件记的拍板时刻（用来卡「事件与拍板同一刻」这条时限）
 * @returns {{eventId: string, at: string}|null}
 */
function verifyHumanEvent(projectId, humanEvent, decidedAt) {
  if (humanEvent === null || humanEvent === undefined || typeof humanEvent !== 'object') return null
  const eventId = humanEvent.eventId === undefined || humanEvent.eventId === null ? '' : String(humanEvent.eventId)
  const atMs = typeof humanEvent.at === 'string' ? Date.parse(humanEvent.at) : NaN
  if (eventId === '' || !Number.isFinite(atMs)) return null
  // 事件必须与「这一次拍板」同一刻（不是几小时前那条同型事件）；`decidedAt` 解析不了就不收。
  const decidedMs = typeof decidedAt === 'string' ? Date.parse(decidedAt) : NaN
  if (!Number.isFinite(decidedMs) || Math.abs(atMs - decidedMs) > HUMAN_EVENT_MAX_AGE_MS) return null
  // ⚠️ 自读账本（理由＝成环 ＋ 判据强度，逐条写在上面那段 JSDoc「为什么必须自读账本」）：
  // 读的是与 engine `readEvents` **同一个文件**（`timelinePath`），但**不**复用它的实现。
  // 它已登记进「读账本面」判据的扫描面（`test/test-step-submit-evidence.mjs` 第 ④ 节：
  // 直读账本恰好 1 处且落在本文件）——再加第二处直读，那道判据会红着找人回来登记。
  let events = []
  try {
    events = readFileSync(timelinePath(projectId), 'utf8').split('\n').filter((line) => line.trim() !== '').map((line) => {
      try { return JSON.parse(line) } catch { return null }
    }).filter((event) => event !== null)
  } catch {
    return null
  }
  const requestedAction = typeof humanEvent.action === 'string' ? humanEvent.action : ''
  const found = events.find((event) => String(event?.seq) === eventId
    && event?.time === atMs
    && event?.type === 'textbook/hint'
    && event?.data?.machine === HUMAN_ACTION_MARKER
    // 同一条人工事件不能拿去给**别的动作**签名（站 4 的 gate-decide 事件不能拿去签站 8）。
    && (requestedAction === '' || event?.data?.humanAction === requestedAction))
  return found === undefined ? null : { eventId, at: new Date(atMs).toISOString() }
}

/** 一条纠偏是否指向这一站（**`station` 优先且互斥**；没有 station 时才认 `file`）。 */
function provenanceFixMatches(fix, station, rel) {
  const n = Number(station)
  if (Number.isSafeInteger(Number(fix.station))) return Number(fix.station) === n
  const file = String(fix.file ?? '').replace(/^工作区\//, '')
  return file === rel.replace(/^工作区\//, '')
}

/**
 * **读侧 apply 纠偏后的结论件**（票 `decision-provenance/01` D2=A 的读侧）。
 *
 * ⚠️ 与 {@link readStationDecision} 的分工：后者是**盘上原文件**（不 apply，供「原文件字节不变」
 * 与迁移核对用）；本函数是**展示口径**（界面回放／报告／统计都应该读它）。
 *
 * 返回值在原始记录上叠三样：
 *   · `decidedBy` 换成纠偏后的值；
 *   · `provenanceCorrected: true` ＋ `provenanceFix`（was／corrected／autoSkipped／reason／at）；
 *   · 纠偏说 `autoSkipped:true` 时补 `autoSkipped:true`。
 *
 * @param {string} projectId
 * @param {number} station
 * @returns {object|null}
 */
export function readEffectiveStationDecision(projectId, station) {
  const raw = readStationDecision(projectId, station)
  if (raw === null) return null
  const n = Number(station)
  const rel = stationDecisionRel(n)
  const fix = readProvenanceFixes(projectId).filter((item) => provenanceFixMatches(item, n, rel)).pop()
  if (fix === undefined) return raw
  const effective = {
    ...raw,
    decidedBy: fix.corrected,
    provenanceCorrected: true,
    provenanceFix: {
      was: fix.was,
      corrected: fix.corrected,
      autoSkipped: fix.autoSkipped === true,
      reason: typeof fix.reason === 'string' ? fix.reason : '',
      at: typeof fix.at === 'string' ? fix.at : '',
    },
  }
  if (fix.autoSkipped === true) effective.autoSkipped = true
  return effective
}

/**
 * **写点：唯一的一处**（票面落点 (a)）。在拍板／确认那个动作里由机器调用——今天唯一调用点
 * 与账本 `appendEvent(project, 'textbook/gate-decision', …)` **同一处**。
 *
 * 形状＝九个键 ＋ 可选的 `values`：**没有值的站不写这个键，⛔ 不填 `null` 占位**。
 * `version` ＝「这一站第几次拍板」（驳回一次 ＋1）——**由本函数从盘上现读的上一份 ＋1 得出**，
 * ⛔ 不要求调用方自己数（数两份就会漂）。
 *
 * @param {string} projectId
 * @param {number} station 站号（**从 1 起**；站 0 响亮拒绝）
 * @param {object} payload
 * @param {string} [payload.title] 人读的主题名（缺时取 {@link stationTitle}）
 * @param {boolean} payload.approved 过没过
 * @param {string} [payload.decidedAt] 拍板那一刻（ISO 8601；缺时取当前时刻）
 * @param {number} [payload.version] 覆盖「第几次拍板」（缺时＝盘上那份 ＋1，再缺＝1）
 * @param {'human'|'machine'} [payload.decidedBy] 谁拍的（缺＝`machine`；⛔ 不再有第三值）
 * @param {{eventId: string|number, at: string}|null} [payload.humanEvent] **人类动作事件**的引用
 *   （`decidedBy:"human"` 时**必须**给，且必须能在账本里查到；否则强制降级为 machine）
 * @param {string|number} [payload.eventId] `humanEvent` 的平铺写法（与 `at` 一起给）
 * @param {string} [payload.at] `humanEvent` 的平铺写法
 * @param {boolean} [payload.autoSkipped] 这一站是**自动越过**的（不是人拍的）
 * @param {string} [payload.skipReason] 为什么自动越过（如 `no-human-event`）
 * @param {number} [payload.inheritedFrom] 继承了哪一站的人类裁决（仍是 machine）
 * @param {string[]} [payload.reasons] 机器给的理由
 * @param {string} [payload.userNote] **用户那句话照抄**（⛔ 不摘要）
 * @param {{file: string, version: number|null}|null} [payload.proposal] 指回正文哪一版；没有正文的站写 `null`
 * @param {object} [payload.values] 这一站的结构化值（可选；没有就不写这个键）
 * @returns {{rel: string, abs: string, record: object}}
 */
export function recordStationDecision(projectId, station, payload = {}) {
  const n = Number(station)
  if (!Number.isSafeInteger(n) || n < 1) {
    // 站 0 不留（它＝`meta`），站号非法更不许写。两条都**响亮拒绝**，不静默写一份没人认得的件。
    throw new Error(`结论件的站号必须是从 1 起的整数（收到 ${JSON.stringify(station)}）：⛔ 站 0 不留结论件（它的内容就是 meta）`)
  }
  const prev = readStationDecision(projectId, n)
  const version = Number.isFinite(payload.version)
    ? Number(payload.version)
    : (Number.isFinite(prev?.version) ? Number(prev.version) + 1 : 1)
  const proposal = payload.proposal === null || payload.proposal === undefined
    ? null
    : {
        file: String(payload.proposal.file ?? ''),
        version: Number.isFinite(payload.proposal.version) ? Number(payload.proposal.version) : null,
      }
  // ── 票 `decision-provenance/01` D1=A／D3=A：`human` 只由**真实人类动作事件**产生 ──────────
  // 调用方的 `decidedBy:"human"` 只是**声称**；没有一条能按 eventId ＋ at 在账本里查到的人工动作
  // 事件，就一律强制降级成 machine（＋ autoSkipped/skipReason），⛔ 不许把「机器越过」签成人拍。
  const claimedHuman = payload.decidedBy === 'human' || payload.decidedBy === 'agent-proxy'
  const humanEventRef = payload.humanEvent !== undefined && payload.humanEvent !== null
    ? payload.humanEvent
    : (payload.eventId !== undefined && payload.at !== undefined
        ? { eventId: payload.eventId, at: payload.at }
        : null)
  const decidedAt = typeof payload.decidedAt === 'string' && payload.decidedAt !== ''
    ? payload.decidedAt
    : new Date().toISOString()
  const verifiedHuman = claimedHuman && payload.decidedBy !== 'agent-proxy'
    ? verifyHumanEvent(projectId, humanEventRef, decidedAt)
    : null
  const explicitAutoSkip = payload.autoSkipped === true
  const decidedBy = explicitAutoSkip || verifiedHuman === null ? 'machine' : 'human'
  // 「没有人类事件」在账上就是「这一站被人以外的力量越过」——`autoSkipped` 表达的是
  // **没有人拍板**（不是「用户点了跳过」这个动作），`skipReason` 再说清是哪一种（用户点在
  // `skip-step` 那一格另记 `skippedSteps`，不写结论件）。⇒ 降级那一支也带 autoSkipped，
  // 这样事后一眼能把「机器越过」与「机器正常记了一笔」分开。
  const autoSkipped = explicitAutoSkip || (claimedHuman && verifiedHuman === null)
  const skipReason = autoSkipped
    ? (typeof payload.skipReason === 'string' && payload.skipReason !== ''
        ? payload.skipReason
        : (claimedHuman ? 'no-human-event' : 'auto-skip'))
    : null
  const record = {
    station: n,
    title: typeof payload.title === 'string' && payload.title !== '' ? payload.title : stationTitle(n),
    approved: payload.approved === true,
    decidedAt,
    version,
    decidedBy,
    reasons: Array.isArray(payload.reasons) ? payload.reasons.filter((item) => typeof item === 'string') : [],
    userNote: typeof payload.userNote === 'string' ? payload.userNote : '',
    proposal,
  }
  // ⚠️ 「可选」的读法：**没有值就不长这个键**（⛔ 不写 `null` 占位）。
  if (payload.values !== undefined && payload.values !== null && typeof payload.values === 'object') {
    record.values = payload.values
  }
  // 纠偏之外的三格都只在这件事**真发生**时才长（⛔ 不填 `false`／`null` 占位——那会让
  // 「没有这一格」与「这一格是假的」长得一样）。
  if (autoSkipped) {
    record.autoSkipped = true
    record.skipReason = skipReason
  }
  if (Number.isSafeInteger(Number(payload.inheritedFrom)) && Number(payload.inheritedFrom) >= 1) {
    record.inheritedFrom = Number(payload.inheritedFrom)
  }
  if (decidedBy === 'human') {
    record.eventId = verifiedHuman.eventId
    record.at = verifiedHuman.at
  }
  const rel = stationDecisionRel(n)
  // ⚠️ 写侧经 `workDir`（它带老书兜底：老书上新名那一份不在、旧名那一份在时写进旧名那一份，
  // ⛔ 不凭空长出一个空的新名目录）；读侧一律走 `bookRelOnDisk`（**只算不建**）。
  // ⚠️ 文件名模板**只此一份**（`stationDecisionFileName()`）——2026-10-16 收口 review 逮到写侧
  // 手抄了一遍 `${String(n).padStart(2,'0')}.json`；改一处漏一处就会让读写落点分家。
  const abs = join(workDir(projectId), DECISION_DIR_NAME, stationDecisionFileName(n))
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, `${JSON.stringify(record, null, 2)}\n`, 'utf8')
  return { rel, abs, record }
}

/** 书夹相对路径 → 绝对路径（**只算、不建**）。 */
function bookAbs(projectId, rel) {
  return bookRelOnDisk(projectId, rel)
}

/**
 * 下游那一站的**上游指针**：读上游结论件 ＋ 它 `proposal.file` 指的那份正文，拼出那句三行指针。
 *
 * 三段各答一件事（照 04 §2 的逐字模板，⛔ 不另造）：
 *   ① 结论件路径；② 读哪些键；③ 由结论件的 `proposal.file` **读出来拼**的那份正文路径 ＋ 有界读法；
 *   ④ 一行**书夹绝对基准**（`CONTEXT.md`「指针必须带基准」；先例＝`dispatch-assembly.js` 那句
 *      「本书夹绝对路径」）。
 *
 * ⚠️ **硬闸与降级是两件不同强度的东西**（spec §4.3）：结论件缺 ／ 它指的正文缺 ⇒ `problems`
 * 非空（**硬停**，调用方据此不开这一站）；旁证缺 ⇒ `degraded` 非空（**降级**，派单件里多一句
 * 「上游缺，按现状办」，照开）。
 * ⚠️ 「AI 真的读了它」**不在返回值里**——机器验不了，如实只到「那句在 ＋ 它指的件在」。
 *
 * @param {string} projectId
 * @param {number} station 收指针的那一站（今天生产上只有 5）
 * @returns {{station: number, upstreamStation: number, conclusionRel: string, conclusion: object|null,
 *   bodyRel: string|null, mode: string, bookDir: string, problems: string[], degraded: string[],
 *   upstreamNeverDecided: boolean, lines: string[]|null, text: string|null}}
 */
export function stationPointer(projectId, station) {
  const n = Number(station)
  const up = upstreamStationOf(n)
  const conclusionRel = stationDecisionRel(up)
  const mode = POINTER_READ_MODE[n] ?? 'whole-file'
  const bookDir = projectDir(projectId)
  // 票 `decision-provenance/01` D2=A：下游拿到的上游结论也走**纠偏后的口径**——原文件没被改写，
  // 但任何读者都不该再看到那个被误标的 `decidedBy`。
  const conclusion = readEffectiveStationDecision(projectId, up)
  const problems = []
  // ⚠️ 「**上游被跳过**」与「**上游该有件却没有**」是两件事（见 `upstreamGateSkipped` 的文件头）：
  // 前者不给指针、也**不拦**；后者才是硬停。
  const upstreamNeverDecided = conclusion === null && upstreamGateSkipped(projectId, up)
  if (conclusion === null && !upstreamNeverDecided) {
    problems.push(`${conclusionRel} 不在场（第 ${up} 站的结论件）`)
  }
  const proposalFile = conclusion?.proposal?.file
  const bodyRel = typeof proposalFile === 'string' && proposalFile !== '' ? proposalFile : null
  if (conclusion !== null && bodyRel !== null && !existsSync(bookAbs(projectId, bodyRel))) {
    problems.push(`${bodyRel} 不在场（第 ${up} 站结论件里 proposal.file 指的那份正文）`)
  }
  const degraded = (SUPPORTING_ARTIFACTS[n] ?? []).filter((rel) => !existsSync(bookAbs(projectId, rel)))
  const lines = problems.length > 0 || upstreamNeverDecided ? null : decisionPointerLines({
    upstreamStation: up,
    conclusionRel,
    conclusionTitle: typeof conclusion?.title === 'string' && conclusion.title !== '' ? conclusion.title : stationTitle(up),
    bodyRel,
    mode,
    bookDir,
    degraded,
  })
  return {
    station: n,
    upstreamStation: up,
    conclusionRel,
    conclusion,
    bodyRel,
    mode,
    bookDir,
    problems,
    degraded,
    /** ⚠️ 上游那一站**压根没拍过板**（用户跳过了它）：指针整块不给、也**不算**硬闸的问题。 */
    upstreamNeverDecided,
    lines,
    text: lines === null ? null : lines.join('\n'),
  }
}

/**
 * 那句三行指针的**逐字模板**（＋ 书夹绝对基准那一行）——生成与判据**共用这一份**，
 * 于是两处不会各写一套说法（票面落点 (b)：指针模板照票 04 的 `Answer` §2 逐字，⛔ 不另造）。
 *
 * ⚠️ 第三行那个路径**由调用方从结论件的 `proposal.file` 读出来传进来**，本函数⛔ 不自己拼、
 * 也不在别处再抄一份（一处真相）；`bodyRel === null`（站 1 那种零正文的站）⇒ **整行不写**。
 *
 * @param {object} input
 * @param {number} input.upstreamStation 上游那一站的站号（第二行那个「第 N 站」）
 * @param {string} input.conclusionRel 结论件的书夹相对路径
 * @param {string} input.conclusionTitle 结论件自己那份 `title`（第二行括注里那个主题名）
 * @param {string|null} input.bodyRel 上游正文的书夹相对路径（`null` ⇒ ⛔ 不写第三行）
 * @param {'proposal-section'|'whole-file'} input.mode 有界读法（甲型／乙型）
 * @param {string} input.bookDir 书夹绝对路径（那一行基准）
 * @param {string[]} [input.degraded] 旁证缺的那几件（非空 ⇒ 追加一句「上游缺，按现状办」）
 * @returns {string[]}
 */
export function decisionPointerLines({
  upstreamStation, conclusionRel, conclusionTitle, bodyRel, mode, bookDir, degraded = [],
}) {
  const lines = [
    '↓ 上一站的拍板结论（按路径自己读，本派单不替你抄）：',
    `  \`${conclusionRel}\` —— 第 ${Number(upstreamStation)} 站（${conclusionTitle}）的结论：\`approved\`／\`userNote\`／\`reasons\`／\`proposal\`。`,
  ]
  if (bodyRel !== null) {
    lines.push(mode === 'proposal-section'
      ? `  它指的那份方案正文：\`${bodyRel}\`，读它的 \`## 完整方案\` 一节（要快看就先读 \`## 摘要\`）。`
      : `  它指的那份正文：\`${bodyRel}\`，读它的**整个文件**。`)
  }
  lines.push(`  ${bookDir}（本书夹绝对路径：上面那些 \`工作区/…\` 的相对路径都相对它拼——先 cd 到它，或按它拼绝对路径）`)
  if (degraded.length > 0) {
    lines.push(`  ⚠️ 上游缺，按现状办：${degraded.map((rel) => `\`${rel}\``).join('、')} 不在场（这本书上没人划过时本来就没有这份件）。`)
  }
  return lines
}

/**
 * **派单前的硬闸**（票面落点 (c)）：结论件 ／ 它指的那份正文缺 ⇒ 返回一句**当场报错**的话；
 * 都齐 ⇒ `null`。⛔ 旁证缺**不走这里**（那是降级：派单件里写一句照开）。
 *
 * ⚠️ 这是「机器能验的那一半」的**全部**：它验「件在 ＋ 那句在」，⛔ 不冒充「AI 读了它」。
 *
 * @param {string} projectId
 * @param {number} station
 * @returns {string|null}
 */
export function stationPreconditionProblem(projectId, station) {
  const pointer = stationPointer(projectId, station)
  if (pointer.problems.length === 0) return null
  return `⛔ 第 ${Number(station)} 站不开：上一站的拍板结论吃不到——${pointer.problems.join('；')}。`
    + '先补齐上游那一站（或按「重做这一站」重走），这一站不派单。'
}
