/**
 * 造书工作台 · 交工事件的索引与四档语义（engine 内部子模块 4/4，票 `depth-round-3/01`）
 *
 * 本簇只答**一个问题**：「这一步／这一章／合并／范例章**交过工没有**」。
 * 此前它由四个函数（`goldSubmitCount`／`chapterHasSubmitEvent`／`stepSubmitRecorded`／
 * `mergeSubmitRecorded`）**各写一遍**，每个都自己 `readEvents()` 一遍、自己写一段 label 匹配，
 * 而匹配是**四种形态**（`includes`／`startsWith`／正则取章号＋`includes`／**不查 `outcome`**）——
 * 同一份「怎么认交工」的知识抄了四份，改一处不会带着另外三处一起动。
 *
 * 现在只有这里一份：`submissionIndex(events)` 把账本数组投影成**按章／按档的索引**，
 * `submitted(index, { stage, chapter, gold })` 是那四档语义**唯一的谓词**；四个判据都成了它的调用者。
 *
 * ## 依赖图位置与「零 I/O」
 * 只 import `./labels.js`（身份词 `STAGE_LABELS`／`stageLabel`）——**叶子之上半层**。
 * ⛔ **不 import `../engine.js`**：facade 要 import 本模块，反着来就是环。
 * ⛔ **不读盘**：`readEvents` 留在 facade（它是「engine 内部子模块」那一族的活，另有其票），
 * 调用方自己读、把账本**数组**递进来——票面把这条接口写死了，也正是它让本模块无环。
 *
 * ## ⚠️ 身份词**现取**，⛔ 不在这里写 label 字面量
 * 表里每一档的身份来源都是一个**取词函数**，在**判的那一刻**从 `STAGE_LABELS`／`stageLabel()` 取
 * ——不是建索引时抄一份字面量，也不是 import 时求值。于是把某一档的身份词改坏（内存副本），
 * 那一档的判据**当场**跟着变，而另外三档不动（`test-step-submit-evidence.mjs` 第四节把四档各改一次）。
 *
 * ## 四档语义表（**implementation 内部，不导出**）
 *
 * | 档 | 身份来源 | 匹配写法 | 查 `outcome === 'ok'` | 谁问 |
 * | --- | --- | --- | --- | --- |
 * | `example` | `STAGE_LABELS.gold` | `includes` | **不查** | `goldSubmitCount`（问**条数**）、章档的「范例章那一章」那一支 |
 * | `chapter` | label 里**第一处**「第N章」这个结构词 | 正则取码 ＋ 与 n 严格相等 | 查 | `chapterHasSubmitEvent` |
 * | `step` | `STAGE_LABELS[stage]` | `includes` | 查 | `stepSubmitRecorded` |
 * | `merge` | `stageLabel('merge')` | `startsWith` | 查 | `mergeSubmitRecorded`（以及 `stepSubmitRecorded` 的 merge 那一档） |
 *
 * ⚠️ **`example` 档不查 `outcome` 是既有口径**（`goldSubmitCount` 今天就是这么读的），本票**照实保留**：
 * 统一成「都查」会改变既有读数（`goldSealed.version` 与「写作规范有没有定格」那一笔），属**另一次裁决**。
 * 表里这一格是显式的，不是漏写——「查不查」四档里只有这一格是「不查」。
 * ⚠️ **`merge` 档与 `step` 档共用同一个身份词**（`stageLabel('merge') === STAGE_LABELS.merge`），两档只差
 * 匹配写法：`startsWith` ⊆ `includes`。`submitted({ stage: 'merge' })` 取的是**较严的那一档**，
 * 于是「合并这一步的环节状态」（`stepSubmitRecorded`）与「合并那一跳交过工」（`mergeSubmitRecorded`）
 * 在今天账本上同值——全部生产写入点里含这个身份词的 label 都以它开头（`test-step-submit-evidence.mjs`
 * 第四节盯着这一条）。方向上**只严不宽**：不会因为某个 label 把「合并成书」写在中间就放宽跳步闸门。
 * ⚠️ **我的枚举面比现实窄在哪里**（`AGENTS.md` 的 `dev-gate-scan/17` 纪律）：账本事件只认
 * `type === 'textbook/agent-end'` 与 `data.label`／`data.outcome` 两个字段；`data.stage` **不读**
 * （票 `premature-announce/03`：生产一处都不写它，按它认是结构性不命中）。label 由变量拼出来的
 * 写入点照样按**运行时取值**判（这里不像源码扫描那样只认字面量）；但「label 之外的身份来源」
 * （例如将来真加了字段）不在本模块的视野里——那时要改的是这张表，而不是在调用点再写一段匹配。
 */
import { STAGE_LABELS, stageLabel } from './labels.js'


/** 交工事件的类型（机器身份词，与写入点同源）。 */
const EVENT_TYPE = 'textbook/agent-end'

/**
 * label 里**第一处**章号（没有＝`null`）——章档的身份来源就是这个**结构词**，不从词表取。
 *
 * ⚠️ 必须取**第一处**再与 n 严格比对，不能用 `label.includes('第N章')`：真实 label 是
 * 「第3章《…》完成」，**标题里只要出现「第5章」字样**（如「第1章《第2章的秘密》完成」），
 * 用 includes 就会把第 5 章误判成已交工 → 过目闸门放行未交工的章（票 14 ／票 05 裁决 A）。
 */
function chapterNumberOf(label) {
  const first = /第(\d+)章/.exec(label)
  return first === null ? null : Number(first[1])
}


/**
 * 四档交工语义表 —— **只此一份，⛔ 不导出**（票面写死：语义表是 implementation 的内部物）。
 *
 * 每一档三件：`identity`（身份来源的**取词函数**；`null`＝身份是结构词，不从词表取）、
 * `match`（`includes`｜`startsWith`）、`requiredOutcome`（查不查 `outcome === 'ok'`）。
 * `chapter` 那一档的匹配由 {@link chapterNumberOf} 负责（正则取码 ＋ 与 n 严格相等），
 * 所以它**连 `match` 这一格都没有**（收口 review B3：一个没人消费的 `'chapterNo'` 会被读成
 * 「还有第二种匹配写法」）。
 */
const TIERS = {
  // 范例章那一跳交过几次工：**不查 outcome**（既有口径，见文件头）。
  example: { identity: () => STAGE_LABELS.gold, match: 'includes', requiredOutcome: false },
  // 章级交工：label 里第一处「第N章」＝该章号（结构词，不是词表里的一档）。
  chapter: { identity: null, requiredOutcome: true },
  // 某一步交过工：身份词取该步的机器身份词（与 `stage-start` 的 label 同源）。
  step: { identity: (stage) => STAGE_LABELS[stage], match: 'includes', requiredOutcome: true },
  // 合并那一跳：label 以身份词**开头**（真实「合并成书（机器拼装 + AI 前言）」／演示「合并成书」）。
  merge: { identity: () => stageLabel('merge'), match: 'startsWith', requiredOutcome: true },
}


/** 这一笔的 `outcome` 过不过这一档的口径（范例章档不查 ⇒ 恒过）。 */
function passesOutcome(tier, ok) {
  return ok || !tier.requiredOutcome
}


/** 这一档的身份词（**当场**从词表取；取不出来＝这一档认不了，一律不命中）。 */
function identityOf(tier, args) {
  const identity = tier.identity(...args)
  return typeof identity === 'string' && identity !== '' ? identity : null
}


/** 这一档的身份词在不在 label 里（匹配写法按表里的 `match` 那一格）。 */
function matchesIdentity(tier, label, ok, args = []) {
  if (!passesOutcome(tier, ok)) return false
  const identity = identityOf(tier, args)
  if (identity === null) return false
  return tier.match === 'startsWith' ? label.startsWith(identity) : label.includes(identity)
}


/**
 * 账本数组 → **交工索引**（`{ example, chapter, step, merge }`）。
 *
 * - `example`：**条数**（范例章那一档不查 `outcome`，所以是「交过几次工」而不是「交过没有」）；
 * - `chapter`：`Map<章号, true>`——该章有一笔「第一处章号＝它、且 `outcome === 'ok'`」的账；
 * - `step`：`Map<stage, true>`——该步有一笔含它身份词、且 `outcome === 'ok'` 的账；
 * - `merge`：`true`＝有一笔以合并身份词**开头**、且 `outcome === 'ok'` 的账。
 *
 * ⚠️ **零 I/O**：只吃数组；调用方自己 `readEvents(projectId)` 再递进来（见文件头）。
 * ⚠️ **不是缓存**：索引只活在这一次判定的栈上（每问一次交工就从账本重算一遍，与旧口径同一个
 * 读频率）——「少读几次盘」是另一件事，不在本票射程内。
 *
 * @param {Array<object>} events `timeline.jsonl` 那一种事件对象的数组（只读 `type`／`data`）
 * @returns {{example: number, chapter: Map<number, boolean>, step: Map<string, boolean>, merge: boolean}}
 */
export function submissionIndex(events) {
  const list = Array.isArray(events) ? events : []
  let example = 0
  const chapter = new Map()
  const step = new Map()
  let merge = false
  for (const event of list) {
    if (event?.type !== EVENT_TYPE) continue
    const label = String(event?.data?.label ?? '')
    const ok = event?.data?.outcome === 'ok'
    if (matchesIdentity(TIERS.example, label, ok)) example += 1
    if (passesOutcome(TIERS.chapter, ok)) {
      const number = chapterNumberOf(label)
      if (number !== null) chapter.set(number, true)
    }
    // 步档逐档试：身份词表有哪几档就试哪几档（⛔ 不在这里手写第二份阶段清单）。
    for (const stage of Object.keys(STAGE_LABELS)) {
      if (step.get(stage) === true) continue
      if (matchesIdentity(TIERS.step, label, ok, [stage])) step.set(stage, true)
    }
    if (merge !== true && matchesIdentity(TIERS.merge, label, ok)) merge = true
  }
  return { example, chapter, step, merge }
}


/**
 * 四档语义**唯一的谓词**：这份索引里，这一问「交过工没有」？
 *
 * - `{ chapter: n, gold }` → **章档**：那一章自己交过工（正则取章号 ＋ `outcome`），**或**它就是
 *   `gold` 那一章而**范例章那一跳**交过工（`goldN(meta)` 那一章的正文就是范例章那一步写的，
 *   ⚠️ 这一支**不查 `outcome`**——与 `example` 档同一个口径，照实保留）。
 * - `{ stage: 'merge' }` → **合并档**（前缀）；`{ stage: 'explore' }` 等 → **步档**（包含）。
 * - 「范例章**交过几次工**」问的是**条数**，不是「交过没有」⇒ 读 `index.example`（`goldSubmitCount`），
 *   谓词只把那一档当「有没有（>0）」用（章档那一支）。
 *
 * ⚠️ 身份词在这里**现取**（每次调用都从词表读，不缓存），所以改坏某一档的词，这一问当场变。
 *
 * @param {{example: number, chapter: Map<number, boolean>, step: Map<string, boolean>, merge: boolean}} index
 * @param {{stage?: string|null, chapter?: number|null, gold?: number|null}} question
 * @returns {boolean}
 */
export function submitted(index, { stage = null, chapter = null, gold = null } = {}) {
  if (chapter !== null && chapter !== undefined) {
    if (index?.chapter?.get(chapter) === true) return true
    // 「最佳范例章那一章」那条独立分支：那一笔本身不带章号，章号在 `meta` 里（由调用方给 gold）。
    return gold !== null && gold !== undefined && gold === chapter && index?.example > 0
  }
  if (stage === null || stage === undefined) return false
  if (stage === 'merge') return index?.merge === true
  return index?.step?.get(stage) === true
}
