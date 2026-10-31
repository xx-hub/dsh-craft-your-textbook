/**
 * 知识点图的**形状闸**——落在「合并件成形那一刻」（票 `.scratch/knowledge-graph-build/issues/03`；
 * 口径来源 `.scratch/knowledge-graph-step/spec.md` §5，逐条对应见下）。
 *
 * ## 它做什么／不做什么（这一段就是本模块的边界，别在别处另写一句）
 *
 * - **做**：吃一份**已经合并完的合并件**（`{materials, knowledgePoints, teachingFocus,
 *   chapterSuggestion, cards?, edges?}`）＋ 可选的分片表，返回
 *   `{problems, readings}`：`problems` 是逐条点名到**具体的卡／边**的问题清单（空数组＝这一道全过），
 *   `readings` 是这次扫面的读数（含「本次扫面 0 条边」那条）。
 *   调用方（`src/workflow/actions/chapters.js` 的探索段交工那一跳、补图脚本）拿 `problems[0]` 去
 *   拒收（`rejectSubmit` ⇒ 400 ＋ 一条账）。**本模块不读盘、不写盘、不产裁决、不抛异常。**
 * - **不做**：不产边（边是 AI 的判断，spec §2）、不验语义（`testable` 是不是一句可判的话、
 *   一卡两事、锚对不对得上原文）、不验比例／分布、不验传递性完整性、不新增豁免。
 *
 * ## 过渡口径（票 `knowledge-graph-build/01` 联签 · **老书那一档照旧放行**）
 *
 * 合并件**没有**图键（`cards` / `edges` 两键一个都不在）＝ **老书那一档**：盘上今天绝大多数书都是
 * 这一档（分片契约里根本还没写这两个键）⇒ 本闸**零问题放行**（`readings.graphPresent === false`）。
 * **图键一出现**（任一侧给了 `cards` 或 `edges`）才走全套——那时两个键都必须到齐。
 * ⛔ 别把「老书还没补图」读成「图坏了」；⛔ 也不许给结构性错误留豁免（spec §5 守卫 (c)）。
 *
 * ## 这一层只断形状（判据声称的强度＝实现强度）
 *
 * 逐条对应 spec §5（票面「本票落这几条」）：
 * ① **无环**：边集只走 `prereq`、**现算**、**合并之后**算，自环 ＋ 反对称并进同一道——
 *    实现**全部委托**给票 02 的 {@link prereqShapeProblems}（那是 `prereq` 子图的唯一算法入口）。
 * ② **把握档字段形状**：卡片与每条边都带 `confidence`，取值 ∈ 强／中／待核。⛔ 不验比例／分布。
 * ③ **卡的字段形状**：`key`／`name`／`testable`／`anchor`／`confidence` 都在且非空；`key` 书内唯一。
 * ④ **卡 ↔ 知识点 1:1 双射**：两边非空、条数相等、**逐项计数**口径下逐字相等。
 * ⑤ **`cards[]`／`edges[]` 形状与边端**：两个键都在；边的 `kind` 必填且在枚举域内（委托票 02）、
 *    `reason` 非空、`confidence` 入域、`from`／`to` 命中 `cards[].key`、同 `from`/`to`/`kind`
 *    的重复边判红。⛔ 不验传递性完整性（存量画的是传递约简）。
 * ⑥ **位置索引与 `mergedFrom`**（票 06 落，spec §5 第 6 条）：`locations` **在场的**非空、逐项
 *    `{material, start, end}` 且 `material` 命中 `materials[].num`；被并的那条**整张**记在 `mergedFrom`
 *    里（含锚）；带 `mergedFrom` 的卡 `locations` **至少 2 条**；被并卡**不得再作边端**（也不许留在 `cards`）。
 * ⑦ **跨材料的边**（票 06 落，§5 第 8 条）：跨材料的 `prereq` 把握档 ∈ {中, 待核}——「跨材料」由
 *    **两端材料集合是否相交**现算（未合并卡＝它的 key 前缀；合并卡＝survivor ∪ `mergedFrom`，⛔ 不新增字段）。
 * 守卫：**(a) 空扫守卫**（键必在、`cards` 非空、「本次扫面 0 条边」如实记一条读数、非阻断）；
 * **(b) 防静默丢**（期望值不取自 `expectedKnowledgeMap`——走票 01 的 `scanKnowledgeMapEdges`）；
 * **(c) 结构性错误不新增豁免**（本模块没有 `options.allow*` 这类口子）。
 *
 * ## 每条判据的**枚举面比现实窄在哪里**（`dev-gate-scan/17` 的纪律；口径照抄 spec §5 末段）
 *
 * · **无环只扫 `prereq`** ⇒ `alias`／`see-also` 上真实的环**看不见**（有意：那两类不主张方向）。
 * · **锚只判「有没有可解析的行段」**（§8.1 的形状：非空数组、逐项 `{start,end}`、1 基、`start ≤ end`、
 *   项间不重叠且升序）⇒ **不证明锚对得上原文**：把行号整体加 1（或换成另一本书的行号）我照样绿。
 * · **位置索引只对「材料号」负责**（票 06 的 ⑥）：它只证明「这条属于哪几份材料、在那份材料的哪一段」，
 *   ⇒ **不证明「这条原文到底在哪」**（行号整体偏移、或指着同一份材料里另一段，本闸看不出来）。
 *   它还**只压带 `locations` 的卡**（产者是合并那一步；没合并过的卡只有分片侧的 `anchor`）——
 *   ⛔ 别把这一条读成「每张卡都必须有位置索引」。
 * · **⑥ 不判「该合并的漏并了」**：两张卡到底是不是同一件事是判断题（对齐小助手 ＋ 独立审校），
 *   本闸只验**交来的那份结论落地之后**的形状；一份「一条都没合并」的图在这里全绿。
 * · **⑦ 只压 `prereq`**：跨材料的 `see-also`／`alias` 不受约束（前者不主张方向；后者按 spec §7 不存在）。
 *   材料集合认不出时按「空集合 ⇒ 不相交 ⇒ 跨材料」处理（宁可压上限，不留「换个 key 写法就逃掉」的口子）。
 * · **双射只比两串字**（卡的 `name` 与知识点的 `title`，逐字、不套规范化）⇒ **不证明那张卡讲的是
 *   那条知识点的事**。「甲 甲」写两遍、把卡名换成别的字符串，只要两边逐字相等我就绿。
 * · **防静默丢只抓「全丢」、抓不住「丢一半」**（spec §5 明写的有意收窄，`scanKnowledgeMapEdges`
 *   自己那条窄处）：分片声明过 2 条边、合并件里剩 1 条，本闸在这条上是绿的（那形状归拼装对账）。
 * · **把握档只验「字段在不在、值入不入域」**：不验比例／分布（阈值闸＝换名字的字数闸），也不验
 *   「强／中／待核」判得对不对（那是独立审校的事；本闸连软读数都不产）。
 * · **跨章审计的条数对账**（§5 第 7 条）不住本闸：它住 merge 段那一跳。
 * · **扫面只走 `merged` 这一个入参**：`shards` 只喂「防静默丢」那一条读数（期望值取自分片自己的
 *   声明）；「这一片该不该有图键」「分片里图键的形状对不对」不在本闸的扫面里（那是分片验货面）。
 *
 * ## 载体的已知粗处（照实记，别把「报了」读成「报全了」）
 *
 * 交工那一跳今天只回 `problems[0]`（`rejectSubmit` 一次一条）⇒ 一次坏图**要多轮修**。
 * 本模块如实返回**全部** problems（顺序是契约：①②③④⑤＋守卫那几条的先后见
 * {@link knowledgeMapGateProblems} 的实现），但**上游只用得上第一条**。
 */

import { EDGE_KINDS, prereqShapeProblems } from './knowledge-graph.js'
import { CROSS_MATERIAL_PREREQ_LEVELS, LEVELS, PENDING, isDecided } from '../knowledge-confidence.js'
import { scanKnowledgeMapEdges } from './knowledge-map-assembly.js'
import { LOCATIONS_FIELD, MERGED_FROM_FIELD, cardMaterialIndex, isCrossMaterialEdge } from './knowledge-map-merge.js'
// 票 `quality-review-2026-10-29/07`：`isPlainObject` 收编进零依赖叶子（本文件原先那一份是全仓
// 逐字抄件之一；判据＝`test-book-shape.mjs` 的「单点 · 对象判据」那一格）。
import { isPlainObject } from '../plain-object.js'

/**
 * 把握档的三档（spec §2：卡片与边**共用一把**、但住在两个字段里——两处字段名都是 `confidence`）。
 *
 * ⚠️ **声明已搬去** `src/knowledge-confidence.js`（票 `depth-round-3/03`）：本行是**原位置再导出**，
 * 所以 chain／审校面／build 与既有测试的 import 面**一行不改**（先例 `src/material-formats.js`）。
 * 本文件是**唯一** import 那个新家的地方（全仓只有这一处，由 `test-knowledge-map-gate.mjs` 钉着）。
 */
export const KNOWLEDGE_CONFIDENCE_LEVELS = LEVELS

/**
 * 把握档里「**方向都没定**」的那一档（spec §2／§4）：审校面的注意力清单（先复核它）与写作面的
 * 「不算前置，一条都不进」都读这一个名字。
 *
 * ⚠️ **从三档表里取**（⛔ 这里不另写一个同义字面量）——今天它由 `src/knowledge-confidence.js` 的
 * `PENDING`（＝那边 `LEVELS[2]`）派生，本行同样只是**原位置再导出**。
 */
export const PENDING_CONFIDENCE = PENDING

// 同一次搬家的另外两样：门槛过滤那一句与「跨材料上限」那张子集表——下游经本文件取词
// （import 面一行不改；⛔ 别在别处再 import 新家）。
export { CROSS_MATERIAL_PREREQ_LEVELS, isDecided }

/** 图的两个键（spec §5 第 5 条：两个都必须在，不许靠缺省）。 */
export const GRAPH_KEYS = Object.freeze(['cards', 'edges'])

/** 卡的非空字段（形状那一半；`difficulty` 不在其中——它是既有字段、可缺，见 spec §2 的行文）。 */
export const CARD_REQUIRED_FIELDS = Object.freeze(['key', 'name', 'testable', 'anchor', 'confidence'])

/** 边的非空字段（spec §5 第 5 条那五样；`kind` 的**枚举域**那一半由票 02 的 `prereqShapeProblems` 判）。 */
export const EDGE_REQUIRED_FIELDS = Object.freeze(['from', 'to', 'kind', 'confidence', 'reason'])

/** 问题码表（**下游按码取值的那一份**：票 07 上屏、票 11 的逐边清单与条数对账都从 problem 对象上读）。 */
export const GATE_PROBLEM_CODES = Object.freeze([
  'graph-keys-missing',
  'graph-key-not-array',
  'cards-empty',
  'card-not-object',
  'card-field-missing',
  'card-confidence-out-of-domain',
  'card-key-duplicate',
  'card-anchor-shape',
  'cards-points-bijection',
  'edge-not-object',
  'edge-field-missing',
  'edge-confidence-out-of-domain',
  'edge-duplicate',
  'edge-endpoint-unknown',
  // 以下六个由票 02 的 `prereqShapeProblems` 原样透传（口径只此一处）：
  'edge-kind-missing',
  'edge-kind-unknown',
  'edge-endpoint-missing',
  'edge-self-loop',
  'edge-antisymmetric',
  'prereq-cycle',
  // 票 06：位置索引与 `mergedFrom`（spec §5 第 6 条）与**跨材料的边**（第 8 条）
  'card-locations-shape',
  'card-locations-material-unknown',
  'card-merged-from-shape',
  'merged-card-not-absorbed',
  'merged-card-as-edge-endpoint',
  'merged-card-locations-too-few',
  'cross-material-prereq-confidence',
  // 守卫 (b)：票 01 的独立读数
  'edges-lost',
])

function nonEmptyText(value) {
  return typeof value === 'string' && value.trim() !== ''
}

/** 一句能进拒收文案的形状描述（⛔ 不 `JSON.stringify` 整份输入）。 */
function shapeOf(value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return `数组(${value.length})`
  if (typeof value === 'string') return value === '' ? '空串' : `字符串(${value.length} 字)`
  if (value === undefined) return '没这个键'
  return typeof value
}

/** 一张卡的人读点名（文案要说得出来是**哪一张**；`key「name」`，缺哪个用哪个）。 */
function cardLabel(card, index) {
  const key = nonEmptyText(card?.key) ? card.key : `第 ${index + 1} 张卡`
  const name = nonEmptyText(card?.name) ? `「${card.name}」` : ''
  return `${key}${name}`
}

/** 一条边的人读点名（`from → to（边 #i）`，两端都可能缺）。 */
function edgeLabel(edge, index) {
  const from = nonEmptyText(edge?.from) ? edge.from : '（缺 from）'
  const to = nonEmptyText(edge?.to) ? edge.to : '（缺 to）'
  return `${from} → ${to}（边 #${index}）`
}

/**
 * `cards[].anchor` 的形状（spec §8.1）：非空数组、逐项 `{start, end}`、
 * **该材料转换稿里的 1 基行号**、`start ≤ end`、项间不重叠且按 `start` 升序。
 *
 * ⚠️ 强度到「可判到区间」为止：**它不证明锚对得上原文**（见文件头那条窄处）。
 * ⛔ 本函数**不**接受散文锚（`"行 609–617（五大主要症状）"` 那种）：机器判不了那种串里的区间，
 * 说明该写进 `testable`（spec §8.1 逐字）。
 */
function anchorProblems(card, index) {
  const label = cardLabel(card, index)
  const anchor = card?.anchor
  if (!Array.isArray(anchor) || anchor.length === 0) {
    return [{ code: 'card-anchor-shape', cardIndex: index, message: `卡 ${label} 的 anchor 必须是非空数组（逐项 {start,end} 的 1 基行号区间），实为 ${shapeOf(anchor)}——「行 609–617（…）」那种散文锚机器判不了区间，说明写进 testable。` }]
  }
  const problems = []
  let previousEnd = null
  anchor.forEach((item, at) => {
    const where = `卡 ${label} 的 anchor 第 ${at + 1} 项`
    if (!isPlainObject(item)) {
      problems.push({ code: 'card-anchor-shape', cardIndex: index, anchorIndex: at, message: `${where} 不是 {start,end} 对象（实为 ${shapeOf(item)}）` })
      previousEnd = null
      return
    }
    const { start, end } = item
    const badStart = !Number.isSafeInteger(start) || start < 1
    const badEnd = !Number.isSafeInteger(end) || end < 1
    if (badStart || badEnd) {
      problems.push({ code: 'card-anchor-shape', cardIndex: index, anchorIndex: at, message: `${where} 的 start／end 必须是该材料转换稿里的 1 基行号（正整数），实为 start=${shapeOf(start)}、end=${shapeOf(end)}` })
      previousEnd = null
      return
    }
    if (start > end) {
      problems.push({ code: 'card-anchor-shape', cardIndex: index, anchorIndex: at, message: `${where} 的 start(${start}) 大于 end(${end})——行段必须 start ≤ end` })
      previousEnd = null
      return
    }
    if (previousEnd !== null && start <= previousEnd) {
      problems.push({ code: 'card-anchor-shape', cardIndex: index, anchorIndex: at, message: `${where}（${start}–${end}）与前一项（…–${previousEnd}）重叠或没按 start 升序——项间不重叠且按 start 升序是 §8.1 的形状` })
    }
    previousEnd = end
  })
  return problems
}

/** 卡片那一组的形状（spec §5 第 ③ ＋ ② 的卡片那一半）。 */
function cardProblems(cards) {
  const problems = []
  const seen = new Map()
  cards.forEach((card, index) => {
    if (!isPlainObject(card)) {
      problems.push({ code: 'card-not-object', cardIndex: index, message: `cards 第 ${index + 1} 项不是对象（实为 ${shapeOf(card)}）` })
      return
    }
    const label = cardLabel(card, index)
    for (const field of CARD_REQUIRED_FIELDS) {
      const value = card[field]
      if (field === 'anchor') continue // 形状单独判（见 `anchorProblems`）
      if (!nonEmptyText(value)) {
        problems.push({ code: 'card-field-missing', cardIndex: index, field, message: `卡 ${label} 的 ${field} 必须是非空字符串（实为 ${shapeOf(value)}）` })
      }
    }
    if (nonEmptyText(card.confidence) && !KNOWLEDGE_CONFIDENCE_LEVELS.includes(card.confidence.trim())) {
      problems.push({ code: 'card-confidence-out-of-domain', cardIndex: index, field: 'confidence', message: `卡 ${label} 的把握档是「${card.confidence}」，不在取值域 ${KNOWLEDGE_CONFIDENCE_LEVELS.join('／')} 之内` })
    }
    problems.push(...anchorProblems(card, index))
    // `key` 书内唯一（重复＝边端指谁有歧义）。只在 key 是文本时进这一格（非文本已在上面的字段那组点名）。
    if (nonEmptyText(card.key)) {
      const key = card.key
      if (seen.has(key)) {
        problems.push({ code: 'card-key-duplicate', cardIndex: index, key, message: `卡 ${label} 的 key「${key}」在本图里出现了不止一次（第 ${seen.get(key) + 1} 项与第 ${index + 1} 项）——key 是书内复合键，重复会让边端指谁有歧义` })
      } else {
        seen.set(key, index)
      }
    }
  })
  return { problems, keys: seen }
}

/** 边那一组的形状（spec §5 第 ⑤ ＋ ② 的边那一半；`kind`／边端卫生委托票 02）。 */
function edgeProblems(edges, cardKeys) {
  const problems = []
  const seen = new Set()
  edges.forEach((edge, index) => {
    if (!isPlainObject(edge)) {
      problems.push({ code: 'edge-not-object', edgeIndex: index, message: `edges 第 ${index + 1} 项不是对象（实为 ${shapeOf(edge)}）` })
      return
    }
    const label = edgeLabel(edge, index)
    for (const field of EDGE_REQUIRED_FIELDS) {
      if (field === 'kind') continue // 枚举域那一半归票 02（`edge-kind-missing` / `edge-kind-unknown`）
      if (!nonEmptyText(edge[field])) {
        problems.push({ code: 'edge-field-missing', edgeIndex: index, field, message: `边 #${index}（${label}）的 ${field} 必须是非空字符串（实为 ${shapeOf(edge[field])}）` })
      }
    }
    if (nonEmptyText(edge.confidence) && !KNOWLEDGE_CONFIDENCE_LEVELS.includes(edge.confidence.trim())) {
      problems.push({ code: 'edge-confidence-out-of-domain', edgeIndex: index, field: 'confidence', message: `边 #${index}（${label}）的把握档是「${edge.confidence}」，不在取值域 ${KNOWLEDGE_CONFIDENCE_LEVELS.join('／')} 之内` })
    }
    // 边端命中卡表（票 02 明确不判这一条；只有两端都是文本时才谈得上「命中谁」）。
    for (const side of ['from', 'to']) {
      const value = edge[side]
      if (!nonEmptyText(value)) continue
      if (!cardKeys.has(value)) {
        problems.push({ code: 'edge-endpoint-unknown', edgeIndex: index, side, message: `边 #${index}（${label}）的 ${side}「${value}」不在 cards 的 key 里——边的两端必须是卡（书内复合键）` })
      }
    }
    // 重复边：同 `from`/`to`/`kind` 写两遍＝图自己把同一件事写两遍（spec §5 第 5 条判红）。
    if (nonEmptyText(edge.from) && nonEmptyText(edge.to) && nonEmptyText(edge.kind)) {
      const signature = `${edge.from}\u0000${edge.to}\u0000${edge.kind}`
      if (seen.has(signature)) {
        problems.push({ code: 'edge-duplicate', edgeIndex: index, message: `边 #${index}（${label}）与前面那条 from／to／kind 完全相同——同一件事写了两遍（同一对卡上的不同 kind 是合法的，重复的是这三样都一样的那条）` })
      } else {
        seen.add(signature)
      }
    }
  })
  return problems
}

/**
 * 卡 ↔ 知识点 1:1 双射（spec §5 第 ④ 条）。
 *
 * 口径：两边非空、条数相等、**各自排序后逐项相等**——实现走**逐项计数**（同一个值在两边各有几条），
 * 它与「排序后逐项相等」等价，而**集合**口径会把「一张卡重复两次、另一条知识点没有卡」互相抵掉
 * （spec 逐字点了这个病）。比较**逐字、不套规范化**：`" 甲"` 与 `"甲"` 是两条。
 *
 * ⚠️ 窄处（文件头那条）：**只比两串字**，不证明那张卡讲的是那条知识点的事。
 */
function bijectionProblems(cards, points) {
  const problems = []
  // 逐字比较的那把尺子：非文本值也参与（它们比不出相等，于是各自成一条差异——⛔ 不静默跳过）。
  const text = (value) => (typeof value === 'string' ? value : `\u0000非文本(${typeof value}):${String(value)}`)
  const tally = (list, side, pick) => {
    const map = new Map()
    for (const item of list) {
      const value = pick(item)
      const key = text(value)
      const row = map.get(key) ?? { value, card: 0, point: 0 }
      row[side] += 1
      map.set(key, row)
    }
    return map
  }
  const cardCounts = tally(cards, 'card', (card) => card?.name)
  const pointCounts = tally(points, 'point', (point) => point?.title)
  const allKeys = [...new Set([...cardCounts.keys(), ...pointCounts.keys()])].sort()
  for (const key of allKeys) {
    const card = cardCounts.get(key)?.card ?? 0
    const point = pointCounts.get(key)?.point ?? 0
    if (card === point) continue
    const value = (cardCounts.get(key) ?? pointCounts.get(key)).value
    if (point === 0) {
      problems.push({ code: 'cards-points-bijection', value, card, point, message: `卡「${String(value)}」出现了 ${card} 张，知识点里一条都没有——卡必须 1:1 从知识点派生（卡的 name 逐字等于 knowledgePoints[].title）` })
    } else if (card === 0) {
      problems.push({ code: 'cards-points-bijection', value, card, point, message: `知识点「${String(value)}」有 ${point} 条，图里一张卡都没有——每条知识点都要有一张卡（1:1 派生）` })
    } else {
      problems.push({ code: 'cards-points-bijection', value, card, point, message: `「${String(value)}」在图上出现 ${card} 次、在知识点里出现 ${point} 条——逐项计数对不上（集合口径会把这种「一张卡重复两次、另一条没有卡」互相抵掉，所以这里按逐项计数判）` })
    }
  }
  if (problems.length === 0 && cards.length !== points.length) {
    // 计数逐项都对得上却条数不等：只可能是「同一串字在一边多算了一条、另一边也多算了一条同串」那种
    // 不可能形状（逐项计数等价于排序后逐项相等）。留一条兜底，免得「条数相等」这句话没人守。
    problems.push({ code: 'cards-points-bijection', value: null, card: cards.length, point: points.length, message: `卡 ${cards.length} 张、知识点 ${points.length} 条，条数不相等（逐项计数没查出差异——请连同这一条一起报，别静默）` })
  }
  return problems
}

/**
 * 位置索引与 `mergedFrom`（spec §5 第 6 条）＋「被并卡不得再出场」。
 *
 * 三件事：① `cards[].locations` **在场的**必须是非空数组、逐项 `{material, start, end}` 且
 * `material` 命中 `materials[].num`；② 带 `mergedFrom` 的卡，被并的那几条**整张**都在
 * （`key`／`name`／`testable`／`anchor`），且它自己的位置索引**至少 2 条**；
 * ③ 被并的 key **不得再出场**（既不留在 `cards` 里、也不当边端）。
 *
 * ⚠️ **一处有意收窄（我的枚举面比现实窄在哪里）**：第 ① 条只压**带 `locations` 的卡**——
 * `locations` 的产者是**合并那一步**（只有参加过合并的卡才有），分片侧只产 `anchor`
 * （票 06 的实现与 spec §8.2 都这么分）。⇒ 「每张卡都必须有位置索引」**不是**本闸的判据：
 * 没带 `locations` 的卡在这里一个字都不判（它的原文位置由分片侧的 `anchor` 那一条管）。
 * 把这条读成「卡必须有 locations」会误判**所有还没合并过的卡**（今天盘上真书全是这一档）。
 * ⚠️ 另外：`locations` 的行段只判**形状**（1 基、`start ≤ end`）——它**不证明「这条原文到底在哪」**
 * （spec §5 末段那条：位置索引只对材料号负责）。
 *
 * @param {{cards: unknown[], edges: unknown[], materialNumbers: Set<number>}} input
 * @returns {{problems: Array<object>, readings: object}}
 */
function mergeShapeProblems({ cards, edges, materialNumbers }) {
  const problems = []
  const readings = { locationCards: 0, mergedCards: 0, absorbedCards: 0 }
  const cardKeys = new Set()
  for (const card of cards) if (isPlainObject(card) && nonEmptyText(card.key)) cardKeys.add(card.key)
  // 「被并卡」这一集合要**整份视野**才算得齐（它挂在别的卡的 `mergedFrom` 里），所以先扫一遍再判。
  const absorbedKeys = new Set()
  for (const card of cards) {
    if (!isPlainObject(card)) continue
    for (const row of Array.isArray(card[MERGED_FROM_FIELD]) ? card[MERGED_FROM_FIELD] : []) {
      if (isPlainObject(row) && nonEmptyText(row.key)) absorbedKeys.add(row.key)
    }
  }
  readings.absorbedCards = absorbedKeys.size
  const materialsText = [...materialNumbers].sort((a, b) => a - b).join('／')

  cards.forEach((card, index) => {
    if (!isPlainObject(card)) return
    const label = cardLabel(card, index)
    // ① 位置索引：在场的必须非空、逐项形状对、材料号命中 materials[].num。
    if (Object.hasOwn(card, LOCATIONS_FIELD)) {
      const locations = card[LOCATIONS_FIELD]
      if (!Array.isArray(locations) || locations.length === 0) {
        problems.push({ code: 'card-locations-shape', cardIndex: index, message: `卡 ${label} 的 locations 必须是非空数组（逐项 {material,start,end} 的位置索引；实为 ${shapeOf(locations)}）——它由合并那一步产出，空数组等于「这一条原文在哪」这一栏没给` })
      } else {
        readings.locationCards += 1
        locations.forEach((item, at) => {
          const where = `卡 ${label} 的 locations 第 ${at + 1} 项`
          if (!isPlainObject(item)) {
            problems.push({ code: 'card-locations-shape', cardIndex: index, locationIndex: at, message: `${where} 不是 {material,start,end} 对象（实为 ${shapeOf(item)}）` })
            return
          }
          const { material, start, end } = item
          if (!Number.isSafeInteger(material) || !materialNumbers.has(material)) {
            problems.push({ code: 'card-locations-material-unknown', cardIndex: index, locationIndex: at, material, message: `${where} 的材料号是 ${shapeOf(material)}，不在 materials[].num（${materialsText === '' ? '一个都没有' : materialsText}）里——位置索引只对**材料号**负责，打不中就等于这条索引指不到任何一份材料` })
          }
          if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end < 1 || start > end) {
            problems.push({ code: 'card-locations-shape', cardIndex: index, locationIndex: at, message: `${where} 的行段必须是该材料转换稿里的 1 基行号且 start ≤ end（实为 start=${shapeOf(start)}、end=${shapeOf(end)}）` })
          }
        })
      }
    }
    // ② `mergedFrom`：被并的那条**整张**都在（可回滚）＋ 位置索引至少 2 条。
    if (!Object.hasOwn(card, MERGED_FROM_FIELD)) return
    const rows = card[MERGED_FROM_FIELD]
    if (!Array.isArray(rows) || rows.length === 0) {
      problems.push({ code: 'card-merged-from-shape', cardIndex: index, message: `卡 ${label} 的 ${MERGED_FROM_FIELD} 必须是非空数组（被并的那条**整张**记在这里：key／name／testable／anchor 都在、可回滚；实为 ${shapeOf(rows)}）` })
      return
    }
    readings.mergedCards += 1
    rows.forEach((row, at) => {
      const where = `卡 ${label} 的 ${MERGED_FROM_FIELD} 第 ${at + 1} 项（被并的那一条）`
      if (!isPlainObject(row)) {
        problems.push({ code: 'card-merged-from-shape', cardIndex: index, mergedFromIndex: at, message: `${where} 不是一张卡的对象（实为 ${shapeOf(row)}）——被并的那条要整张留着，才能回滚` })
        return
      }
      for (const field of ['key', 'name', 'testable']) {
        if (!nonEmptyText(row[field])) {
          problems.push({ code: 'card-merged-from-shape', cardIndex: index, mergedFromIndex: at, field, message: `${where} 的 ${field} 必须是非空字符串（实为 ${shapeOf(row[field])}）——「整张记进 mergedFrom」的强度就是这几样都在` })
        }
      }
      // 锚的形状复用**同一把尺子**（`anchorProblems`）——⛔ 不另写一份「相似的量法」。
      const anchorHit = anchorProblems({ key: nonEmptyText(row.key) ? row.key : `第 ${at + 1} 项`, name: row.name, anchor: row.anchor }, index)
      if (anchorHit.length > 0) {
        problems.push({ code: 'card-merged-from-shape', cardIndex: index, mergedFromIndex: at, message: `${where} 的原文锚不成形状：${anchorHit[0].message}` })
      }
    })
    const locationCount = Array.isArray(card[LOCATIONS_FIELD]) ? card[LOCATIONS_FIELD].length : 0
    if (locationCount < 2) {
      problems.push({ code: 'merged-card-locations-too-few', cardIndex: index, locations: locationCount, message: `卡 ${label} 带了 ${MERGED_FROM_FIELD}（并了 ${rows.length} 张）却只有 ${locationCount} 条位置索引——合并不是断料：留下的这一条至少要指得回 2 处原文（它自己那份 ＋ 被并的各条至少一处）` })
    }
  })

  // ③ 被并卡不得再出场：既不许还留在 cards 里，也不许还当边端。
  for (const key of absorbedKeys) {
    if (cardKeys.has(key)) {
      problems.push({ code: 'merged-card-not-absorbed', key, message: `卡「${key}」已经被并进 survivor 的 ${MERGED_FROM_FIELD} 里，却还留在 cards 里——合并之后它不再是一张卡（留着它，1:1 双射与边端都会指错人）` })
    }
    edges.forEach((edge, index) => {
      if (!isPlainObject(edge)) return
      for (const side of ['from', 'to']) {
        if (edge[side] !== key) continue
        problems.push({ code: 'merged-card-as-edge-endpoint', edgeIndex: index, side, key, message: `边 #${index}（${edgeLabel(edge, index)}）的 ${side}「${key}」是一张**已被并掉**的卡——它的边要改指 survivor（合并是并集，⛔ 不是把边丢掉）` })
      }
    })
  }
  return { problems, readings }
}

/**
 * 跨材料的边（spec §5 第 8 条）：「跨材料」由**两端材料集合是否相交**现算（不相交＝跨材料），
 * 上限**只压 `prereq`**——跨材料的 `see-also` 不主张方向、不受约束。
 *
 * ⚠️ 上限那两档（第二档 ＋ 最弱一档）**不在这里写第二份**：它是 `src/knowledge-confidence.js` 的
 * `CROSS_MATERIAL_PREREQ_LEVELS`（派生自那边的 `LEVELS`），本文件只 import（票 `depth-round-3/03`）。
 * 改名第三档时这张子集表跟着走——反证在 `test-knowledge-map-gate.mjs`。
 *
 * ⚠️ **`reason` 非空那一半不在这里判**：它由第 ③ 组（`EDGE_REQUIRED_FIELDS` 的 `edge-field-missing`）
 * 对**每一条边**判过了——同一条规则不在两处各写一套（spec §5 第 8 条那两个合取项：
 * 「`reason` 非空」是通用形状，「把握档 ∈ {中,待核}」才是跨材料**特有**的那一半，所以只有后者住这里）。
 *
 * ⚠️ **枚举面窄处**：材料集合是从 `cards[].key` 的 `M<材料号>-` 前缀 ＋ `mergedFrom[].key` 现算的
 * （{@link cardMaterialIndex}）——**认不出材料号的卡**在这里是**空集合**，而空集合与谁都不相交
 * ⇒ 按「跨材料」处理（宁可压上限，也不给「把 key 写成别的样子就逃掉上限」留口子）。
 */
function crossMaterialProblems(edges, materialIndex) {
  const problems = []
  const readings = { crossMaterialEdges: 0, crossMaterialPrereq: 0 }
  edges.forEach((edge, index) => {
    if (!isPlainObject(edge)) return
    if (!isCrossMaterialEdge(edge, materialIndex)) return
    readings.crossMaterialEdges += 1
    if (edge.kind !== 'prereq') return // ⛔ 上限只压 prereq（see-also 不主张方向）
    readings.crossMaterialPrereq += 1
    if (!nonEmptyText(edge.confidence)) return // 缺字段已在第 ③ 组点名，不在这里报第二遍
    if (!CROSS_MATERIAL_PREREQ_LEVELS.includes(edge.confidence.trim())) {
      problems.push({ code: 'cross-material-prereq-confidence', edgeIndex: index, confidence: edge.confidence, message: `边 #${index}（${edgeLabel(edge, index)}）是**跨材料**的 ${edge.kind}，把握档却写着「${edge.confidence}」——两份材料之间的先后关系没人核过，只能写 ${CROSS_MATERIAL_PREREQ_LEVELS.join('／')}（⛔ 这条上限**只压 ${edge.kind}**：跨材料的 see-also 不主张方向、不受它约束）` })
    }
  })
  return { problems, readings }
}

/**
 * 「本次扫面 0 条边」那条读数（spec §5 守卫 (a)：**非阻断**、要如实记一条）。
 * 票 07 上屏直接吃这句文本；⛔ 别在别处另写一份措辞（措辞也是契约的一部分）。
 *
 * @param {{edges: number, prereq: number, alias: number, seeAlso: number}|null} scan 票 02 的扫面读数
 * @returns {string} 如 `本次扫面 12 条边（prereq 9／alias 1／see-also 2）`
 */
export function edgeScanText(scan) {
  if (scan === null || typeof scan !== 'object') return '本次扫面 0 条边'
  const total = Number.isSafeInteger(scan.edges) ? scan.edges : 0
  return `本次扫面 ${total} 条边（prereq ${scan.prereq ?? 0}／alias ${scan.alias ?? 0}／see-also ${scan.seeAlso ?? 0}）`
}

/**
 * 合并件成形那一刻的形状闸（**唯一入口**）。空数组＝这一道全过。
 *
 * 问题顺序是契约（交工那一跳只回 `problems[0]`）：
 * ① 图键在不在（两个键都在）② 卡那一组（字段／把握档／锚／key 唯一）③ 边那一组（字段／把握档／
 * 重复边／边端命中卡表）④ `prereq` 子图（委托票 02：输入卫生 → 自环 → 反对称 → 环）
 * ⑤ 卡 ↔ 知识点双射 ⑥ 位置索引与 `mergedFrom`（票 06；含「被并卡不得再出场」）
 * ⑦ 跨材料的边（票 06；上限只压 `prereq`）⑧ 空扫守卫（`cards` 非空）⑨ 防静默丢（票 01 的独立读数）。
 *
 * @param {{merged: unknown, shards?: ReadonlyArray<{n: number, map: unknown}>}} input
 *   `merged` ＝ 合并件（对象；⛔ 不是全文——本模块不解析 JSON，那一层归拼装器）；
 *   `shards` ＝ 盘上那几片（只喂守卫 (b) 的期望值；老书／无片那一档给空数组）
 * @returns {{problems: Array<{code: string, message: string}>, readings: object}}
 */
export function knowledgeMapGateProblems({ merged, shards = [] } = {}) {
  const readings = {
    graphPresent: false,
    cards: null,
    edges: null,
    edgeScan: null,
    edgeScanText: null,
    zeroEdges: null,
    declaredShards: [],
    declaredEdges: 0,
    mergedEdges: null,
    // 票 06：位置索引／合并／跨材料那三组各一条读数（⛔ 都是**非阻断读数**：闸只按 problems 拒收）。
    locationCards: 0,
    mergedCards: 0,
    absorbedCards: 0,
    crossMaterialEdges: 0,
    crossMaterialPrereq: 0,
  }
  if (!isPlainObject(merged)) {
    return { problems: [{ code: 'graph-keys-missing', message: `合并件不是一个 JSON 对象（实为 ${shapeOf(merged)}）——形状闸无从谈起` }], readings }
  }
  const hasCards = Object.hasOwn(merged, 'cards')
  const hasEdges = Object.hasOwn(merged, 'edges')
  // 过渡口径：两键一个都不在＝老书那一档 ⇒ 零问题放行（⛔ 不判红、也不要求补图键）。
  if (!hasCards && !hasEdges) return { problems: [], readings }
  readings.graphPresent = true

  const problems = []
  // ① 两个键都必须在（spec §5 第 5 条：不许靠缺省）。
  for (const key of GRAPH_KEYS) {
    if (!Object.hasOwn(merged, key)) {
      problems.push({ code: 'graph-keys-missing', key, message: `合并件里出现了图键，但少了「${key}」——${GRAPH_KEYS.join('／')} 两个键要么都在、要么都不在（只有一个的那一份没法判）` })
      continue
    }
    if (!Array.isArray(merged[key])) {
      problems.push({ code: 'graph-key-not-array', key, message: `合并件的「${key}」必须是数组，实为 ${shapeOf(merged[key])}` })
    }
  }
  if (problems.length > 0) return { problems, readings }

  const cards = merged.cards
  const edges = merged.edges
  readings.cards = cards.length
  readings.edges = edges.length

  // ② 卡那一组
  const cardGroup = cardProblems(cards)
  problems.push(...cardGroup.problems)

  // ③ 边那一组（边端命中卡表；`kind` 与边端**卫生**委托票 02，见下）
  problems.push(...edgeProblems(edges, cardGroup.keys))

  // ④ `prereq` 子图：输入卫生 → 自环 → 反对称 → 环（票 02 是这一道的唯一实现）。
  const shape = prereqShapeProblems(edges, { cards })
  readings.edgeScan = shape.scan
  readings.edgeScanText = edgeScanText(shape.scan)
  readings.zeroEdges = shape.scan.edges === 0
  problems.push(...shape.problems)

  // ⑤ 卡 ↔ 知识点 1:1 双射
  const points = Array.isArray(merged.knowledgePoints) ? merged.knowledgePoints : []
  problems.push(...bijectionProblems(cards, points))

  // ⑥ 位置索引与 `mergedFrom`（spec §5 第 6 条）＋ 被并卡不得再出场 —— 它必须排在②（卡的字段／锚）
  //    与⑤（双射）**之后**：那两组保证「读卡片上的 key／anchor 是安全的」，本组只做合并那一层的事。
  const materialNumbers = new Set((Array.isArray(merged.materials) ? merged.materials : [])
    .map((row) => (isPlainObject(row) ? row.num : undefined))
    .filter((n) => Number.isSafeInteger(n)))
  const mergeGroup = mergeShapeProblems({ cards, edges, materialNumbers })
  problems.push(...mergeGroup.problems)
  readings.locationCards = mergeGroup.readings.locationCards
  readings.mergedCards = mergeGroup.readings.mergedCards
  readings.absorbedCards = mergeGroup.readings.absorbedCards

  // ⑦ 跨材料的边（spec §5 第 8 条）：上限只压 `prereq`（`reason` 非空那一半在第③组，见该函数的注）。
  const crossGroup = crossMaterialProblems(edges, cardMaterialIndex(cards))
  problems.push(...crossGroup.problems)
  readings.crossMaterialEdges = crossGroup.readings.crossMaterialEdges
  readings.crossMaterialPrereq = crossGroup.readings.crossMaterialPrereq

  // ⑧ 空扫守卫：`cards` 非空（空的 `cards` 会让上面那几道全是恒真的空转）。
  //    ⚠️ 已知后果：**零源书**（`knowledgePoints: []`）在这一格是红的——spec §10 把「零源书能走、
  //       产出空图」那一条留给票 12 的入口去兑现，本票按 spec §5 的守卫 (a) 原样实现，不留口子。
  if (cards.length === 0) {
    problems.push({ code: 'cards-empty', message: '合并件的 cards 是空数组——图键在、一张卡都没有，这一道的其余判据全成了空转（空扫守卫）；要么别落图键（老书那一档），要么把卡产出来' })
  }

  // ⑨ 防静默丢（守卫 (b)）：期望值取自**盘上分片自己的声明**，与拼装器无关。
  const scan = scanKnowledgeMapEdges(shards, merged)
  readings.declaredShards = scan.declaredShards
  readings.declaredEdges = scan.declaredEdges
  readings.mergedEdges = scan.mergedEdges
  for (const text of scan.problems) problems.push({ code: 'edges-lost', message: text })

  return { problems, readings }
}
