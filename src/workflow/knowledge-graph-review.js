/**
 * 「独立审校小助手」的**机器侧**（票 `.scratch/knowledge-graph-build/issues/13`；
 * 口径来源 `.scratch/knowledge-graph-step/spec.md` §2／§5／§7／§11 落地清单第 6 条）。
 *
 * ## 它做什么／不做什么（这一段就是本模块的边界，别在别处另写一句）
 *
 * - **做**：把合并件（`工作区/knowledge-map.json`）读成一份**审校交办值**——
 *   ① 按**把握档**排的注意力清单（先复核「待核」，再全量扫一遍，spec §2 那句）；
 *   ② **两条软读数**（锚区间互相包含／孤岛清单）的现算值——它们是**只到这一路**的定向输入；
 *   ③ 上下文那一行（`materials[].standing`，spec §7：「当上下文带上」）。
 * - **不做**：⛔ **不落盘**（软读数不进合并件、不进任何文件）、⛔ **不进闸门**（形状闸一个字都不读它）、
 *   ⛔ **不上界面**（总览图那一块零命中）、⛔ **不产判断**（一卡一事／容器卡／复述名字／`testable` 判得出来
 *   判不出来／**边的语义**（方向对不对、该不该有这条），全是那一路上 AI 的判断）；
 *   ⛔ **不出裁决**——本模块没有、也不导出任何「删卡／加边／改覆盖集合」
 *   的函数或字段，审校结论也不在这里解析（结构上不给它写这些的地方）。
 *
 * ## 两条软读数为什么住在这里（spec §5 那一档的去向）
 *
 * spec §5：「**软读数**＝可疑但合法（锚区间互相包含／孤岛清单）：现算、**不落盘、不进闸门、不上界面
 * 总览图**，去向＝那次**独立审校**的定向输入」。⇒ 它们**只有这一个读者**，所以实现跟着读者走：
 * 住本模块、由本模块的消费者（`dispatch-assembly.js` 的 `graph-review` 那一档）随派单发出去。
 * ⚠️ **别把它们搬进 `knowledge-map-gate.js`**：闸门是硬闸（结构性错误＋400），软读数进闸门就是
 * 「把可疑当错误」（spec §5 两档强度那条），而且会让「闸门零命中这两条读数」这条读数变成空话。
 *
 * ## 判据声称的强度 ＝ 实现强度（`docs/测试信任边界.md` 总纲）
 *
 * 本模块是**纯函数 ＋ 一条读盘包装**：计算面不读盘、不读时钟、不写随机数（同 `dispatchValues` 那条纪律）。
 * 判据断的是「清单的顺序、两条读数的算得对不对、渲染出来的正文逐字」——**不断**任何语义判断
 * （哪张卡该拆、哪张是容器卡、哪句 `testable` 合格），那是那一路上 AI 的事（真机层 ADR-0005）。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）
 *
 * ① **锚区间互相包含**只比**行号区间**，而且**只比同一份材料内的两张卡**：`anchor` 的行号是
 *    **材料局部**的（spec §8.1：⛔ 不带材料号），两份材料的同一行号指的是两处毫不相干的原文
 *    ——真跑第一次就撞到这个假阳性（材料 1 的 `[48,48]` 是「一级事件的应急响应」、材料 2 的
 *    `[48,48]` 是「入职人员表」）。跨材料与材料号认不出的那几对**只计数、不当证据**。
 *    两张卡指着同一段原文而区间写法不同（一个 `[12,40]` 一个 `[13,39]`）会被算成「包含」，而
 *    **区间对得上原文**这件事它一个字都不判（那是审校读原文的事）；
 *    区间不可解析（散文锚／非整数／缺字段）的卡**不进这一面**——那归形状闸（票 03）判红。
 * ② **孤岛**＝**一条边都不沾**（入度＋出度都是 0）的卡：它与界面那一档的「假前沿」（前沿里
 *    没有 `prereq` 入边）**不是一件事**——孤岛是整张图的读数，假前沿是那一屏的语言。
 *    边端指向不存在的卡（悬空边）在这里**不报**（那是形状闸的硬闸），本模块只按边表算度数。
 * ③ **注意力清单的顺序**只保证「把握档＝待核 的那批排在前面」：它不保证 AI 真按这个顺序读，
 *    也不保证「待核」判得对（那是产出它的那一路的事）。
 * ④ **软读数不算比率、不给上限**（spec §5 逐字：「孤岛率上限」连软读数都不做——比率闸的唯一
 *    通过路径是「多连边」，与「禁止 AI 注水迁就检查」正面冲突）。
 * ⑤ **清单正文里锚那一档有头部上限**（{@link ANCHOR_PAIR_LIMIT} 对）：真书 `book-mv1zccvi` 上
 *    这一条读数有 491 对，逐对铺开就是一份把别的档淹掉的噪音 ⇒ 渲染只列头部 40 对（强信号在前），
 *    余下的**逐字写明「另有 N 对」**。**读数与对象里的 `pairs` 是全量**，被截的只是值块正文——
 *    ⛔ 别把「清单里没列」读成「没有那一对」。
 */
import { readBookGraphInputs } from './knowledge-graph-build.js'
// 材料号只从一个出口取（票 06 落的 `materialOfCardKey`，`M<材料号>-` 前缀）——⛔ 不在这里另写正则。
import { materialOfCardKey } from './knowledge-map-merge.js'
// 把握档最弱那一档的**定义**在词表那一份（`src/knowledge-confidence.js`，经 `knowledge-map-gate.js`
// 再导出）；本文件只 import ＋ 再导出。
import { PENDING_CONFIDENCE } from './knowledge-map-gate.js'

/** 把握档取值域里**要优先复核**的那一档（spec §2）。⚠️ 它的**定义**在词表那一份
 *（`src/knowledge-confidence.js` 的 `PENDING`，从三档表里取；票 `depth-round-3/03` 搬的家）；这里再导出
 * 一次只为不动这一路的公开面——⛔ 本文件不再是第二处声明（票 10 的写作面也读同一个名字，
 * 而不是各写一个同义字面量）。 */
export { PENDING_CONFIDENCE } from './knowledge-map-gate.js'

/**
 * 审校要判的语义毛病：**卡的语义四类 ＋ 边的一类**（spec §2 那张卡片判据的四个操作化 ＋
 * 「边那一层」spec §3.3 补的第五类）。
 *
 * ⚠️ 这是**名字的唯一出处**：派发模板必须逐类点名，判据（`test-knowledge-graph-review.mjs`）拿这两处对账。
 * ⛔ 本模块**不判它们**——它只把清单与读数交出去，判在那一路上。
 * ⚠️ 第五类（`边的语义问题`）与前四类**不是一件事**：前四类逐张卡判，它**逐条边**判
 * （方向三选一／该有前置而图上没有／看着像同一件事却不是 `alias`）⇒ 读者仍是主笔与用户，
 * 强度仍是**只有承诺**（票 `knowledge-graph-edges-build/01`）。
 */
export const GRAPH_REVIEW_CATEGORIES = Object.freeze([
  '一卡一事',
  '复述名字',
  '容器卡',
  'testable 能不能出一道题检验',
  '边的语义问题',
])

/** 注意力清单的分档（**顺序是契约**：待核 → 两条软读数 → 全量）。 */
export const GRAPH_REVIEW_BANDS = Object.freeze([
  '待核·边',
  '待核·卡',
  '软读数·锚区间互相包含',
  '软读数·孤岛',
  '全量·卡',
])

/** 两条软读数的名字（⛔ 只许出现在这一路：合并件／闸门／界面总览图里零命中）。 */
export const GRAPH_SOFT_READINGS = Object.freeze(['锚区间互相包含', '孤岛'])

function asArray(value) {
  return Array.isArray(value) ? value : []
}

/** 合并件里的卡（非对象项不进面）。 */
function cardsOf(merged) {
  return asArray(merged?.cards).filter((card) => card !== null && typeof card === 'object')
}

/** 合并件里的边（非对象项不进面）。 */
function edgesOf(merged) {
  return asArray(merged?.edges).filter((edge) => edge !== null && typeof edge === 'object')
}

/** 一张卡上**可解析**的锚区间（散文锚／非整数不进这一面——那是形状闸的事）。 */
function anchorIntervals(card) {
  const out = []
  for (const item of asArray(card?.anchor)) {
    if (item === null || typeof item !== 'object') continue
    if (!Number.isSafeInteger(item.start) || !Number.isSafeInteger(item.end)) continue
    out.push({ start: item.start, end: item.end })
  }
  return out
}

/**
 * 一对卡的锚区间有没有「一段盖住另一段」（含全等）。返回 `null` ＝ 两卡锚互不包含。
 *
 * 关系名是给渲染用的（谁盖谁），**不是判断**：可疑而已，spec §5 那一档。
 */
function containmentBetween(aAnchors, bAnchors) {
  let aCoversB = false
  let bCoversA = false
  let equal = false
  let evidence = null
  for (const x of aAnchors) {
    for (const y of bAnchors) {
      const coversXY = x.start <= y.start && y.end <= x.end
      const coversYX = y.start <= x.start && x.end <= y.end
      if (!coversXY && !coversYX) continue
      if (x.start === y.start && x.end === y.end) equal = true
      if (coversXY) aCoversB = true
      if (coversYX) bCoversA = true
      if (evidence === null) evidence = { a: { ...x }, b: { ...y } }
    }
  }
  if (!aCoversB && !bCoversA) return null
  const relation = equal ? 'equal' : (aCoversB && bCoversA ? 'both' : (aCoversB ? 'a-covers-b' : 'b-covers-a'))
  return { relation, evidence }
}

/**
 * **软读数一：锚区间互相包含**（spec §5）。
 *
 * 逐对算关系（同一对只报一次）：
 * · `equal` —— 两卡的某两个锚**全等**（字面上的「互相包含」）；
 * · `both`  —— 两边**各有一段**盖住对方（两张卡都带多段锚时才可能出现）；
 * · `a-covers-b` / `b-covers-a` —— **单向**覆盖（一段盖住另一段）。
 *
 * ⚠️ **只比同一份材料内的两张卡**（材料号从书内复合键 `M<材料号>-` 前缀现算，口径唯一出处是
 * `knowledge-map-merge.js` 的 `materialOfCardKey()`）：`anchor` 的行号是**材料局部**的，
 * 跨材料比行号＝拿两把不同的尺子量。跨材料／材料号认不出的那几对**只计数**（`crossMaterialPairs`／
 * `unknownMaterialPairs`），渲染时逐字说出来——⛔ 不当证据、也不静默丢掉。
 *
 * @param {object} merged 合并件（`{cards, edges, materials, …}`）
 * @returns {{pairs: object[], relationCounts: object, crossMaterialPairs: number,
 *   unknownMaterialPairs: number, materialUnknownCards: number, cardsScanned: number, anchoredCards: number}}
 */
export function anchorContainmentPairs(merged) {
  const rows = cardsOf(merged).map((card) => ({
    key: typeof card.key === 'string' ? card.key : '',
    name: typeof card.name === 'string' ? card.name : '',
    material: materialOfCardKey(card.key),
    anchor: anchorIntervals(card),
  }))
  const anchoredCards = rows.filter((row) => row.anchor.length > 0).length
  const materialUnknownCards = rows.filter((row) => row.material === null).length
  const pairs = []
  let crossMaterialPairs = 0
  let unknownMaterialPairs = 0
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      const found = containmentBetween(rows[i].anchor, rows[j].anchor)
      if (found === null) continue
      if (rows[i].material === null || rows[j].material === null) { unknownMaterialPairs += 1; continue }
      if (rows[i].material !== rows[j].material) { crossMaterialPairs += 1; continue }
      pairs.push({ a: rows[i].key, b: rows[j].key, relation: found.relation, material: rows[i].material, aAnchor: found.evidence.a, bAnchor: found.evidence.b })
    }
  }
  const relationCounts = { equal: 0, both: 0, 'a-covers-b': 0, 'b-covers-a': 0 }
  for (const pair of pairs) relationCounts[pair.relation] += 1
  return { pairs, relationCounts, crossMaterialPairs, unknownMaterialPairs, materialUnknownCards, cardsScanned: rows.length, anchoredCards }
}

/**
 * **软读数二：孤岛清单**（spec §5）——**一条边都不沾**的卡（入度＋出度都是 0）。
 *
 * @param {object} merged
 * @returns {{keys: string[], names: string[], cardsScanned: number, edgeScanned: number}}
 */
export function islandCards(merged) {
  const cards = cardsOf(merged)
  const edges = edgesOf(merged)
  const touched = new Set()
  for (const edge of edges) {
    if (typeof edge.from === 'string') touched.add(edge.from)
    if (typeof edge.to === 'string') touched.add(edge.to)
  }
  const islands = cards.filter((card) => !touched.has(typeof card.key === 'string' ? card.key : ''))
  return {
    keys: islands.map((card) => (typeof card.key === 'string' ? card.key : '')),
    names: islands.map((card) => (typeof card.name === 'string' ? card.name : '')),
    cardsScanned: cards.length,
    edgeScanned: edges.length,
  }
}

/** 两条软读数（**唯一入口**：调用方别自己再算一遍）。 */
export function graphSoftReadings(merged) {
  return { anchorContainment: anchorContainmentPairs(merged), islands: islandCards(merged) }
}

/** 一条边的端点与把握档（渲染与计数共用，避免两处各取一遍）。 */
function edgeRow(edge, index) {
  return {
    index,
    from: typeof edge.from === 'string' ? edge.from : '',
    to: typeof edge.to === 'string' ? edge.to : '',
    kind: typeof edge.kind === 'string' ? edge.kind : '',
    confidence: typeof edge.confidence === 'string' ? edge.confidence : '',
    reason: typeof edge.reason === 'string' ? edge.reason : '',
  }
}

/** 一张卡的度数（渲染用；孤岛那条读数的另一处口径在 `islandCards`，两处都从边表数）。 */
function degreesOf(merged) {
  const deg = new Map()
  const bump = (key) => deg.set(key, (deg.get(key) ?? 0) + 1)
  for (const edge of edgesOf(merged)) {
    if (typeof edge.from === 'string') bump(edge.from)
    if (typeof edge.to === 'string') bump(edge.to)
  }
  return deg
}

/**
 * 一份**审校交办值**（纯函数：同一份合并件 ⇒ 逐字同一份值）。
 *
 * @param {object|null} merged 合并件（盘上那份；`null` ＝ 还没落盘）
 * @returns {object} `{available, note, cards, edges, materials, pending, soft, sweep, items, readings}`
 */
export function graphReviewTarget(merged) {
  const cards = cardsOf(merged)
  const edges = edgesOf(merged).map(edgeRow)
  const soft = graphSoftReadings(merged)
  const materials = asArray(merged?.materials).map((row) => ({
    num: Number.isSafeInteger(row?.num) ? row.num : null,
    standing: typeof row?.standing === 'string' ? row.standing : '',
  }))
  const available = cards.length > 0
  const deg = degreesOf(merged)

  const pendingEdges = edges.filter((edge) => edge.confidence === PENDING_CONFIDENCE)
  const pendingCards = cards
    .filter((card) => card?.confidence === PENDING_CONFIDENCE)
    .map((card) => ({ key: typeof card.key === 'string' ? card.key : '', name: typeof card.name === 'string' ? card.name : '' }))
  const sweep = cards.map((card) => {
    const key = typeof card.key === 'string' ? card.key : ''
    return {
      key,
      confidence: typeof card.confidence === 'string' ? card.confidence : '',
      degree: deg.get(key) ?? 0,
    }
  })

  // 清单＝**有序**的分档数组：先「待核」（边、卡），再两条软读数，最后全量
  //（spec §2 逐字：「先复核『待核』，再全量扫一遍」）。⚠️ 全量那一档包含前面出现过的卡
  //——「再全量扫一遍」就是字面意思（第一遍是复核，第二遍是逐张过），**不是**去重后的补集。
  const items = []
  for (const edge of pendingEdges) {
    items.push({ band: GRAPH_REVIEW_BANDS[0], kind: 'edge', from: edge.from, to: edge.to, edgeKind: edge.kind, reason: edge.reason })
  }
  for (const card of pendingCards) {
    items.push({ band: GRAPH_REVIEW_BANDS[1], kind: 'card', key: card.key, name: card.name })
  }
  // 锚那一档：强信号（全等／互相）排前面，逐对**列到上限为止**，余下的**逐字说明另有几对**
  //（⛔ 不静默截断；全量在 `soft.anchorContainment.pairs` 与 `readings` 里）。
  const relationRank = { equal: 0, both: 1, 'a-covers-b': 2, 'b-covers-a': 3 }
  const orderedPairs = soft.anchorContainment.pairs
    .map((pair, index) => ({ pair, index }))
    .sort((x, y) => (relationRank[x.pair.relation] - relationRank[y.pair.relation]) || (x.index - y.index))
    .map((row) => row.pair)
  for (const pair of orderedPairs.slice(0, ANCHOR_PAIR_LIMIT)) {
    items.push({
      band: GRAPH_REVIEW_BANDS[2],
      kind: 'anchor-pair',
      relation: pair.relation,
      a: pair.a,
      b: pair.b,
      aAnchor: pair.aAnchor,
      bAnchor: pair.bAnchor,
    })
  }
  if (orderedPairs.length > ANCHOR_PAIR_LIMIT) {
    items.push({
      band: GRAPH_REVIEW_BANDS[2],
      kind: 'anchor-pair-rest',
      listed: ANCHOR_PAIR_LIMIT,
      total: orderedPairs.length,
      relationCounts: soft.anchorContainment.relationCounts,
    })
  }
  if (soft.anchorContainment.crossMaterialPairs > 0 || soft.anchorContainment.unknownMaterialPairs > 0) {
    items.push({
      band: GRAPH_REVIEW_BANDS[2],
      kind: 'anchor-pair-other-materials',
      crossMaterialPairs: soft.anchorContainment.crossMaterialPairs,
      unknownMaterialPairs: soft.anchorContainment.unknownMaterialPairs,
      materialUnknownCards: soft.anchorContainment.materialUnknownCards,
    })
  }
  items.push({
    band: GRAPH_REVIEW_BANDS[3],
    kind: 'islands',
    keys: soft.islands.keys,
    edgeScanned: soft.islands.edgeScanned,
  })
  items.push({
    band: GRAPH_REVIEW_BANDS[4],
    kind: 'sweep',
    keys: sweep.map((row) => row.key),
    pending: sweep.filter((row) => row.confidence === PENDING_CONFIDENCE).length,
    isolated: sweep.filter((row) => row.degree === 0).length,
  })

  return {
    available,
    note: available
      ? ''
      : '（合并件里今天还没有 `cards[]`（还没补图／还没交过探索段），这一趟没有可审的图）',
    cards: cards.length,
    edges: edges.length,
    materials,
    pending: { edges: pendingEdges, cards: pendingCards },
    soft,
    sweep,
    items,
    readings: {
      cards: cards.length,
      edges: edges.length,
      pendingEdges: pendingEdges.length,
      pendingCards: pendingCards.length,
      containmentPairs: soft.anchorContainment.pairs.length,
      containmentByRelation: { ...soft.anchorContainment.relationCounts },
      containmentCrossMaterial: soft.anchorContainment.crossMaterialPairs,
      containmentMaterialUnknown: soft.anchorContainment.unknownMaterialPairs,
      islands: soft.islands.keys.length,
      anchoredCards: soft.anchorContainment.anchoredCards,
    },
  }
}

/** 区间写成 `[开始–结束]`（人读；⛔ 不判对错）。 */
function intervalText(interval) {
  return `[${interval.start}–${interval.end}]`
}

function materialStandingLine(target) {
  const rows = target.materials.filter((row) => row.standing !== '')
  if (rows.length === 0) return '- 各材料分量声明（当上下文读，⛔ 不是判据）：这一份合并件里没有 `materials[].standing`（机器只验有没有表态，不验它写得对不对）'
  return `- 各材料分量声明（当上下文读，⛔ 不是判据）：${rows.map((row) => `资料${row.num === null ? '?' : row.num}——「${row.standing}」`).join('；')}`
}

/**
 * 软读数一那一档**最多逐对列几行**（头部上限）。
 *
 * ⚠️ 这是**有意的头**、不是穷举（真书 `book-mv1zccvi` 上这一条读数有 424 对——逐对铺开就是
 * 一份 25K 字符的噪音，读者反而看不见该看的那几对）。**全量在对象里**（`soft.anchorContainment.pairs`
 * 与 `readings` 的逐类计数），渲染时把「另有 N 对」逐字写出来，⛔ 不许静默截断。
 */
const ANCHOR_PAIR_LIMIT = 40

/** 一对锚的渲染行（强信号在前：全等 → 互相 → 单向）。 */
function anchorPairText(pair) {
  if (pair.relation === 'equal') return `${pair.a} ${intervalText(pair.aAnchor)} 与 ${pair.b} ${intervalText(pair.bAnchor)}：两段**全等**`
  if (pair.relation === 'both') return `${pair.a} 与 ${pair.b} 的锚**互相包含**（${intervalText(pair.aAnchor)}／${intervalText(pair.bAnchor)}）`
  if (pair.relation === 'a-covers-b') return `${pair.a} ${intervalText(pair.aAnchor)} 盖住 ${pair.b} ${intervalText(pair.bAnchor)}（单向）`
  return `${pair.b} ${intervalText(pair.bAnchor)} 盖住 ${pair.a} ${intervalText(pair.aAnchor)}（单向）`
}

function itemText(item) {
  if (item.kind === 'edge') {
    return `${item.from} → ${item.to}（${item.edgeKind === '' ? 'kind 缺失' : item.edgeKind}，把握档「${PENDING_CONFIDENCE}」）：${item.reason === '' ? '（reason 是空的——那是形状闸的事）' : item.reason}`
  }
  if (item.kind === 'card') return `${item.key}《${item.name}》`
  if (item.kind === 'anchor-pair') return anchorPairText(item)
  if (item.kind === 'anchor-pair-rest') {
    return `（以上是前 ${item.listed} 对，按「全等 → 互相包含 → 单向覆盖」排；**另有 ${item.total - item.listed} 对**没有逐对列出——不是没有，是这一行只给头部。逐类计数：全等 ${item.relationCounts.equal}／互相 ${item.relationCounts.both}／单向 ${item.relationCounts['a-covers-b'] + item.relationCounts['b-covers-a']}；逐对明细在那份合并件的 \`cards[].anchor\` 上现算得出来）`
  }
  if (item.kind === 'anchor-pair-other-materials') {
    const parts = []
    if (item.crossMaterialPairs > 0) parts.push(`跨材料的 ${item.crossMaterialPairs} 对`)
    if (item.unknownMaterialPairs > 0) parts.push(`材料号认不出的 ${item.unknownMaterialPairs} 对（这类卡 ${item.materialUnknownCards} 张）`)
    return `另有${parts.join('、')}行号嵌套**没有**算进这一条读数：\`anchor\` 的行号是**材料局部**的（spec §8.1：⛔ 不带材料号），两份材料的同一行号指的是两处不相干的原文（真跑撞过：材料 1 的 [48–48] 是「一级事件的应急响应」、材料 2 的 [48–48] 是「入职人员表」）⇒ 读数只比同一份材料内的两张卡`
  }
  if (item.kind === 'islands') {
    if (item.keys.length === 0) return '孤岛 0 张（每张卡至少沾一条边）'
    if (item.edgeScanned === 0) return `本次扫面 0 条边 ⇒ 全部 ${item.keys.length} 张卡都是孤岛（**整图读数**，不是逐卡的问题；逐卡的清单就是那份合并件的 cards[]，本行不再抄一遍）`
    return `${item.keys.length} 张卡一条边都不沾：${item.keys.join('、')}`
  }
  if (item.keys.length === 0) return '（合并件里没有卡）'
  return `按 \`cards[]\` 顺序逐张过（共 ${item.keys.length} 张；其中把握档「${PENDING_CONFIDENCE}」${item.pending} 张、度数 0 的 ${item.isolated} 张——逐张的把握档与度数在那份合并件的 \`cards[]\` 里，本行只给顺序与 key）：${item.keys.join('、')}`
}

/** 注意力清单的**唯一**渲染（值块里的那一段；顺序读数就从这份正文读出来）。 */
export function renderGraphAttention(target) {
  const head = `- 审校清单（顺序就是注意力顺序：**先复核「${PENDING_CONFIDENCE}」，再按两条软读数，最后按全量清单逐张过**）：`
  if (!target.available) return `${head}\n  - （没有可审的图：见上面那条点名）`
  const lines = target.items.map((item) => `  - 【${item.band}】${itemText(item)}`)
  return [head, ...lines].join('\n')
}

/**
 * 值块里那一段（图的落点 ＋ 覆盖率读数 ＋ standing 上下文 ＋ 注意力清单）。
 *
 * ⚠️ 值块里还有**一行不住这里**：各材料转换稿路径（票 `knowledge-graph-edges-build/01` 补的
 * `materialSources`，渲染在 `dispatch-assembly.js` 的 `renderDispatchValues()` 那一行）——
 * 它与 `alignment` 那一档**共用同一句**，⛔ 别在本函数里再写第二份措辞。
 *
 * @param {object} target {@link graphReviewTarget} 的返回
 * @param {{knowledgeMapRel: string}} paths 图的落点（**取自产物清单**，⛔ 不在本模块手写第二份路径）
 */
export function graphReviewValueLines(target, { knowledgeMapRel }) {
  const r = target.readings
  const lines = [
    `- 你要审的那张图：\`${knowledgeMapRel}\`（**全部** \`cards[]\`／\`edges[]\` 都在这一份里，逐张读它——本派单不替你抄内容）`,
  ]
  if (!target.available) {
    lines.push(`- 本次没有可审的图：${target.note}`)
    return lines
  }
  lines.push(`- 覆盖率读数（机器现算，**不是判据**）：卡 ${r.cards} 张／边 ${r.edges} 条；把握档「${PENDING_CONFIDENCE}」的边 ${r.pendingEdges} 条、卡 ${r.pendingCards} 张；同一份材料内锚区间互相包含 ${r.containmentPairs} 对（有锚的卡 ${r.anchoredCards} 张／共 ${r.cards} 张；另有跨材料 ${r.containmentCrossMaterial} 对、材料号认不出 ${r.containmentMaterialUnknown} 对，⛔ 没算进这一条）；孤岛 ${r.islands} 张`)
  lines.push(materialStandingLine(target))
  lines.push(renderGraphAttention(target))
  return lines
}

/**
 * 顺序读数：从**渲染出来的那份清单正文**里读出分档与顺序（⛔ 不读意图、不读数组下标）。
 *
 * ⚠️ 零「待核」时 `pendingFirst` 是**恒真**的（−1 < 第一个别的档）⇒ 用它的判据必须同时断
 * 「待核那一档非空」（防空跑），本仓口径见 `docs/测试信任边界.md` 总纲第 ① 条。
 */
export function graphAttentionOrder(text) {
  const bands = []
  for (const line of String(text ?? '').split('\n')) {
    const match = /^\s*-\s*【([^】]+)】/u.exec(line)
    if (match === null) continue
    bands.push(match[1])
  }
  const pendingAt = bands.map((band, index) => ({ band, index })).filter((row) => row.band.startsWith('待核')).map((row) => row.index)
  const otherAt = bands.map((band, index) => ({ band, index })).filter((row) => !row.band.startsWith('待核')).map((row) => row.index)
  const lastPendingAt = pendingAt.length === 0 ? -1 : Math.max(...pendingAt)
  const firstNonPendingAt = otherAt.length === 0 ? bands.length : Math.min(...otherAt)
  return {
    bands,
    total: bands.length,
    pending: pendingAt.length,
    nonPending: otherAt.length,
    lastPendingAt,
    firstNonPendingAt,
    pendingFirst: lastPendingAt < firstNonPendingAt,
  }
}

/**
 * 盘上这本书的审校交办值（**唯一的读盘点**；纯函数那一半在 {@link graphReviewTarget}）。
 *
 * ⚠️ 读图走 `readBookGraphInputs`（票 03 的**唯一**读侧出处）——⛔ 别在本模块另写一份读盘。
 */
export function readGraphReviewTarget(projectId) {
  const inputs = readBookGraphInputs(projectId)
  const target = graphReviewTarget(inputs.merged)
  return { ...target, projectId, mergedRel: inputs.mergedRel, mergedOnDisk: inputs.merged !== null }
}
