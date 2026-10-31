/**
 * 知识点图的**排序**纯函数：把 `cards[]` 按 `prereq` 边排成一个满足依赖的总序。
 * （票 `.scratch/chapter-skeleton/issues/01-knowledgeorder-排序纯函数.md`；口径来源
 * `.scratch/设计-拓扑序函数.md` §2.2／§2.3／§3 的**排序那一半**；切段那一半明确暂缓，
 * 见 `.scratch/chapter-skeleton/spec.md` §审计裁定。）
 *
 * ## 它做什么／不做什么（本模块的边界就写在这一段，别在别处另写一句）
 *
 * - **做**：吃 `{cards, edges}`（合并件 `工作区/knowledge-map.json` 的两个图键），纯函数地算
 *   ① 一个**满足每条可解析、未被剔除的 `prereq` 边**的总序（Kahn 分层 ＋ 稳定键）② 每张卡的**拓扑层级**
 *   ③ 一排**如实读数**（孤立点、无入边、不可解析边、被剔除的点、被忽略的边）。
 * - **不做**：⛔ 不读盘、不读时钟、不写随机数、⛔ 不写盘；⛔ 不剪环、不删点、不改入参；
 *   ⛔ 不把 `foreshadow`／`see-also` 混成 `prereq`；⛔ 不做章归属、不切段、不渲染任何章骨架
 *   （那是站 7 与「走向 A」的事，本票只出排序）。
 *
 * ## 三条口径（读代码前先读这三条）
 *
 * 1. **节点身份＝`cards[].key`**，⛔ 不用 `title`／`knowledgePoints[].id`：真书上
 *    `knowledgePoint.id ∩ card.key = 0/143`，而 `cards[].name` 才是知识点 title。`name` 只在
 *    「把序渲染成标题清单」与「与 `outline` 对账」这两处当展示键用。
 * 2. **稳定键只有 `card.key` 的字典序**（逐层：同层候选按 key 升序）。上游设计 §2.2 那三级
 *    优先级里的 `chapterHint`／`sourceOrder` **盘上不存在产出者**（`grep -rn "chapterHint\\|sourceOrder"
 *    src test docs` → 0 命中）⇒ 本模块**不假装**有这两级；`readings.tiesBrokenBy` 把这一句写出来，
 *    ⛔ 不许静默用旧 `outline` 序冒充排序证据（spec §B1）。
 * 3. **环检测复用** `knowledge-graph.js` 的 {@link prereqShapeProblems}（ADR-0033 决策 2：
 *    ⛔ 不新写一份 Tarjan／SCC）。它报的三档环——自环（1 元）／反对称（2 元）／`prereq-cycle`
 *    （≥3 元）——本模块**全当环**；有环 ⇒ `status: 'cycle'` ＋ 成员名单，**不返回 order**。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（票 `dev-gate-scan/17` 的纪律）
 *
 * - **只扫 `kind === 'prereq'` 的边**。`see-also`／`foreshadow` 不进序，但**不是静默丢**：
 *   `readings.ignoredEdgeKinds` 逐类计数（真书：`see-also` 35 条）；`kind` 缺失的边也计入
 *   `'<missing>'`。它们上面的环**看不见**（有意：那几类不主张方向）。
 * - **边端存在性只认 `cards[].key`**：任一 `prereq` 边的端点不在卡表里 ⇒ `status: 'rejected'`
 *   ＋ `unknownEndpoints`，**不产序**（设计 §2.2 第 3 条：`danglingUnknown` 拒收）。⚠️ 端点
 *   在卡表里、但被人的裁决划掉 ⇒ **只计数**（`droppedByExclusion`／`droppedEdges`），不拒收。
 * - **`cards[]` 里没有非空字符串 `key` 的条目进不了节点集**：不计错误、只少算——那是图闸
 *   （`knowledge-map-gate.js` ③）的面，本模块不替它判形状。
 * - **`outline` 对账按 `cards[].name` 与标题逐字比**：需要归一化（尾部括注／全半角）才匹配上的
 *   条目算「对不上」（`outlineUnresolvedPoints`）——正常图上 `cards[].name` 与知识点 title
 *   **逐字相等**（图闸 ④ 的双射），所以这一档只在坏图上少算，不会在好图上多算。
 * - **`outlineVsGraph` 数的是「被 outline 次序违反的 `prereq` 边」**，⛔ 不是「相邻两点反序的个数」：
 *   孤立点（真书 59 张，§甲-3）本来就没有排序依据，按相邻反序数会把「任意排列」算成不一致；
 *   按依赖边数才是「顺序错了字面上看不出来」那件事的读数。它只覆盖**可解析且未被剔除**的边。
 * - **两档「不可解析」分得开**：`readings.unresolvedEdges` ＝ 端点**不在卡表**（真书今天 0/62；
 *   这一档要 `rejected`）；`readings.outlineUnresolvedEdges` ＝ 端点**没被任何章认领**（真书 3/62，
 *   与票面「3/62」同一个数——它量的是 outline 的认领面，不是图的边端存在性）。票面把 3 写在
 *   「不可解析边数」旁边，但两者判的不是一件事；两档都如实报，⛔ 不拿一个数冒充另一个。
 * - **确定性**是「同输入同输出」，⛔ 不证明「这份序讲得对」：`prereq` 判得对不对是真机层
 *   （ADR-0005）；排序对了也不等于章分得好（spec §Further Notes）。
 *
 * ## 空面（防空跑）
 *
 * `cards` 里一张可用的卡都没有 ⇒ `status: 'empty'`，**不冒充**「排序成功」。调用方必须先断
 * 「这本书有知识点图」（`cards` 非空 ＋ `edges` 在场），再把结果放进交办；本模块不替它判「该不该有图」。
 *
 * @module workflow/knowledge-order
 */
import { prereqShapeProblems } from './knowledge-graph.js'

/** 进序的唯一一种边（**唯一声明**：本模块别处一律引用它，⛔ 不各写一个字面量）。 */
const ORDERED_EDGE_KIND = 'prereq'

/** `readings.tiesBrokenBy` 的取值（机器读的是这一句；⛔ 别在判据里另写一份）。 */
export const TIES_BROKEN_BY = 'card.key 字典序（逐层：同层候选按 key 升序；chapterHint／sourceOrder 盘上无产出者，不参与）'

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)
const nonEmptyText = (value) => typeof value === 'string' && value !== ''

/** 字典序比较（按 UTF-16 码元，⛔ 不用 `localeCompare`——它随运行环境的 locale 变）。 */
function compareKeys(a, b) {
  if (a === b) return 0
  return a < b ? -1 : 1
}

/** 把可选入参读成一串去重后的键（排序稳定；`excludedKeys` 只收 iterable，⛔ 不收裸字符串）。 */
function sortedKeysOf(value) {
  const out = new Set()
  if (value === null || value === undefined) return []
  for (const item of value) {
    if (nonEmptyText(item)) out.add(item)
  }
  return [...out].sort(compareKeys)
}

/** 卡片表 → 保输入序的 `{key, name}`（⛔ 不改原对象；重复键只认第一张，与图闸「key 书内唯一」同口径）。 */
function nodesOf(cards) {
  const nodes = []
  const seen = new Set()
  for (const card of Array.isArray(cards) ? cards : []) {
    if (!isPlainObject(card) || !nonEmptyText(card.key) || seen.has(card.key)) continue
    seen.add(card.key)
    nodes.push({ key: card.key, name: nonEmptyText(card.name) ? card.name : card.key })
  }
  return nodes
}

/** 边表 → 按 `kind` 分组的读数（非 `prereq` 的边**计数**，⛔ 不静默丢）。 */
function edgeKindsOf(edges) {
  const counts = new Map()
  for (const edge of Array.isArray(edges) ? edges : []) {
    if (!isPlainObject(edge)) continue
    const kind = nonEmptyText(edge.kind) ? edge.kind : '<missing>'
    counts.set(kind, (counts.get(kind) ?? 0) + 1)
  }
  const sorted = [...counts.entries()].sort((left, right) => compareKeys(left[0], right[0]))
  return Object.fromEntries(sorted)
}

/**
 * 把 `outline` 压成 `[{points: [title...]}]`（兼容两种入参：章对象数组，或扁平标题数组）。
 * ⛔ 不读章号、不拿章边界做任何事——这里只要「点的先后」。
 */
function outlineChaptersOf(outline) {
  if (!Array.isArray(outline)) return null
  return outline.map((chapter) => ({
    points: Array.isArray(chapter?.points) ? chapter.points.slice() : [],
  }))
}

/**
 * 与 `outline` 对账的读数（**纯函数内部用**，不单独导出——唯一入口是 {@link knowledgeOrder}）。
 *
 * `outlineVsGraph` ＝ 被 outline 次序违反的、**可解析且未被剔除**的 `prereq` 边数：
 * 边 `from → to` 要求 `pos(from) < pos(to)`，相等也算违反（同一点被两章重复认领时）。
 */
function outlineReadingOf({ outline, nodes, keptKeys, usedEdges }) {
  const chapters = outlineChaptersOf(outline)
  if (chapters === null) {
    return {
      outlineVsGraph: null,
      outlinePoints: 0,
      outlineResolvedPoints: 0,
      outlineUnresolvedPoints: 0,
      outlineUnresolvedEdges: null,
      outlineUnclaimedKeys: [],
    }
  }
  const keyByName = new Map()
  for (const node of nodes) {
    if (!keyByName.has(node.name)) keyByName.set(node.name, node.key)
  }
  const positions = new Map()
  let points = 0
  let resolved = 0
  for (const chapter of chapters) {
    for (const raw of chapter.points) {
      points += 1
      if (typeof raw !== 'string') continue
      const key = keyByName.get(raw)
      if (key === undefined) continue
      resolved += 1
      if (!positions.has(key)) positions.set(key, positions.size)
    }
  }
  // 空的 outline（首稿的 `{chapters: []}`）＝ **还没有可对账的次序** ⇒ 与「没传 outline」同一档。
  // ⚠️ 不许拿 0 冒充「对过账且一致」：0 是一个有意义的读数（正序），空面不是。
  if (points === 0) {
    return {
      outlineVsGraph: null,
      outlinePoints: 0,
      outlineResolvedPoints: 0,
      outlineUnresolvedPoints: 0,
      outlineUnresolvedEdges: null,
      outlineUnclaimedKeys: [],
    }
  }
  let outlineVsGraph = 0
  let outlineUnresolvedEdges = 0
  for (const edge of usedEdges) {
    const from = positions.get(edge.from)
    const to = positions.get(edge.to)
    // 「不可解析」在这里是**对 outline 的认领面**：端点没被任何章认领 ⇒ 这条边没有可比的位置。
    // ⚠️ 它与 `readings.unresolvedEdges`（端点不在卡表、要 rejected 的那一档）**不是一件事**。
    if (from === undefined || to === undefined) {
      outlineUnresolvedEdges += 1
      continue
    }
    if (from >= to) outlineVsGraph += 1
  }
  const outlineUnclaimedKeys = nodes
    .filter((node) => keptKeys.has(node.key) && positions.get(node.key) === undefined)
    .map((node) => node.key)
    .sort(compareKeys)
  return {
    outlineVsGraph,
    outlinePoints: points,
    outlineResolvedPoints: resolved,
    outlineUnresolvedPoints: points - resolved,
    outlineUnresolvedEdges,
    outlineUnclaimedKeys,
  }
}

/**
 * 环的成员名单（**只从 `prereqShapeProblems` 的 problems 里取**，⛔ 不自己再找一遍环）。
 *
 * @returns {{members: string[], cycles: Array<{code: string, members: string[]}>}}
 */
function cyclesOf(problems, nodesByKey) {
  const cycles = []
  for (const problem of problems) {
    if (problem?.code === 'edge-self-loop') {
      cycles.push({ code: problem.code, members: [problem.node] })
    } else if (problem?.code === 'edge-antisymmetric') {
      cycles.push({ code: problem.code, members: [...problem.pair] })
    } else if (problem?.code === 'prereq-cycle') {
      cycles.push({ code: problem.code, members: [...problem.nodes] })
    }
  }
  const members = new Set()
  for (const cycle of cycles) for (const key of cycle.members) if (nodesByKey.has(key)) members.add(key)
  return {
    members: [...members].sort(compareKeys),
    cycles: cycles.map((cycle) => ({
      code: cycle.code,
      members: [...new Set(cycle.members)].sort(compareKeys),
    })),
  }
}

/**
 * 排序入口（**唯一入口**）。
 *
 * @param {{cards?: unknown, edges?: unknown}} graph 合并件里的两个图键
 * @param {{
 *   excludedKeys?: Iterable<string>,
 *   outline?: Array<{points?: string[]}>,
 * }} [options]
 *   `excludedKeys`：人的裁决**已经存活判定过**的那批卡键（`readCoverageCollection().live[].key`；
 *   覆盖闸吃的是同一批点经 `effectiveKnowledgePoints` 减法后的集合）。本模块只做减法与计数，
 *   ⛔ 不重判陈旧、⛔ 不写回那份件。
 *   `outline`：可选，仅用于**对账读数**，⛔ 不参与排序推导（设计 §2.1）。
 * @returns {
 *   | {status: 'ok', order: string[], layers: Record<string, number>, readings: object}
 *   | {status: 'empty', readings: object}
 *   | {status: 'cycle', cycleMembers: string[], cycles: Array<object>, readings: object}
 *   | {status: 'rejected', unknownEndpoints: string[], readings: object}
 * }
 */
export function knowledgeOrder(graph, options = {}) {
  const cards = Array.isArray(graph?.cards) ? graph.cards : []
  const edges = Array.isArray(graph?.edges) ? graph.edges : []
  const nodes = nodesOf(cards)
  const nodesByKey = new Map(nodes.map((node) => [node.key, node]))

  const excludedKeys = new Set(sortedKeysOf(options?.excludedKeys))
  const dropped = nodes.filter((node) => excludedKeys.has(node.key))
  const kept = nodes.filter((node) => !excludedKeys.has(node.key))
  const keptKeys = new Set(kept.map((node) => node.key))

  const prereqEdges = edges.filter((edge) => isPlainObject(edge) && edge.kind === ORDERED_EDGE_KIND)
  const unknownEndpoints = new Set()
  let resolvedEdges = 0
  let malformedEdges = 0
  for (const edge of prereqEdges) {
    if (!nonEmptyText(edge.from) || !nonEmptyText(edge.to)) {
      malformedEdges += 1
      // 设计 §3.4：`rejected` 的名单必须非空。缺一端的边点不出键，用一句**稳定占位**代替，
      // ⛔ 不返回空名单（那会让「为什么被拒」在调用方看起来像「没有原因」）。
      unknownEndpoints.add('<缺一端的边>')
      continue
    }
    const fromKnown = nodesByKey.has(edge.from)
    const toKnown = nodesByKey.has(edge.to)
    if (!fromKnown) unknownEndpoints.add(edge.from)
    if (!toKnown) unknownEndpoints.add(edge.to)
    if (!fromKnown || !toKnown) continue
    resolvedEdges += 1
  }
  const unresolvedEdges = prereqEdges.length - resolvedEdges

  // 可用于排序的边：两端都可解析、且都还在（没被人的裁决划掉）。
  const usedEdges = []
  const seenEdge = new Set()
  let droppedEdges = 0
  for (const edge of prereqEdges) {
    if (!nonEmptyText(edge.from) || !nonEmptyText(edge.to)) continue
    if (!nodesByKey.has(edge.from) || !nodesByKey.has(edge.to)) continue
    if (!keptKeys.has(edge.from) || !keptKeys.has(edge.to)) {
      droppedEdges += 1
      continue
    }
    const signature = `${edge.from}\u0000${edge.to}`
    if (edge.from === edge.to || seenEdge.has(signature)) {
      // 自环与重复边不进邻接：自环由 `prereqShapeProblems` 报成环；重复边是同一件事写两遍。
      if (edge.from === edge.to) usedEdges.push({ from: edge.from, to: edge.to })
      continue
    }
    seenEdge.add(signature)
    usedEdges.push({ from: edge.from, to: edge.to })
  }

  // 度数只数「真实可用的边」（自环单独由环判据报；它在 Kahn 里会让节点永远出不来）。
  const out = new Map(kept.map((node) => [node.key, []]))
  const into = new Map(kept.map((node) => [node.key, []]))
  for (const edge of usedEdges) {
    if (edge.from === edge.to) continue
    out.get(edge.from).push(edge.to)
    into.get(edge.to).push(edge.from)
  }
  for (const list of out.values()) list.sort(compareKeys)
  for (const list of into.values()) list.sort(compareKeys)

  const noInEdgeKeys = kept
    .filter((node) => into.get(node.key).length === 0)
    .map((node) => node.key)
    .sort(compareKeys)
  const isolatedKeys = kept
    .filter((node) => into.get(node.key).length === 0 && out.get(node.key).length === 0)
    .map((node) => node.key)
    .sort(compareKeys)

  const readings = {
    cards: nodes.length,
    ordered: 0,
    isolated: isolatedKeys.length,
    noInEdge: noInEdgeKeys.length,
    isolatedKeys,
    noInEdgeKeys,
    tiesBrokenBy: TIES_BROKEN_BY,
    prereqEdges: prereqEdges.length,
    resolvedPrereqEdges: resolvedEdges,
    unresolvedEdges,
    malformedEdges,
    unknownEndpoints: [...unknownEndpoints].sort(compareKeys),
    droppedByExclusion: dropped.length,
    droppedByExclusionKeys: dropped.map((node) => node.key).sort(compareKeys),
    droppedEdges,
    ignoredEdgeKinds: edgeKindsOf(edges.filter((edge) => !isPlainObject(edge) || edge.kind !== ORDERED_EDGE_KIND)),
    ...outlineReadingOf({ outline: options?.outline ?? null, nodes, keptKeys, usedEdges }),
  }

  if (nodes.length === 0) return { status: 'empty', readings }

  // ── ① 环：复用 `prereqShapeProblems` 的三档环判据（⛔ 不新写 Tarjan／SCC）──────────────
  // 只喂「两端可解析且未被剔除」的 prereq 边：被划掉的点不该让整张图报环（它们不参与排序；
  // 但边端未知要另走 rejected，⛔ 不在这里静默吞掉——下面先判 unknown）。
  const shapeEdges = usedEdges.map((edge) => ({ from: edge.from, to: edge.to, kind: ORDERED_EDGE_KIND }))
  const shape = prereqShapeProblems(shapeEdges, { cards })
  const cycle = cyclesOf(shape.problems, nodesByKey)

  // 端点不认得出（不在卡表／缺一边）⇒ rejected：⛔ 不排一份悄悄缺几条边的序。
  // ⚠️ 「被人的裁决划掉」不走这一档：那是 droppedByExclusion／droppedEdges 的计数。
  if (readings.unresolvedEdges > 0) {
    return { status: 'rejected', unknownEndpoints: [...unknownEndpoints].sort(compareKeys), readings }
  }
  if (cycle.members.length > 0) {
    return { status: 'cycle', cycleMembers: cycle.members, cycles: cycle.cycles, readings }
  }

  // ── ② Kahn 分层（同层按 key 升序；层号＝最长前置链长度）────────────────────────────────
  const indegree = new Map(kept.map((node) => [node.key, into.get(node.key).length]))
  const layers = {}
  const order = []
  let frontier = kept
    .filter((node) => indegree.get(node.key) === 0)
    .map((node) => node.key)
    .sort(compareKeys)
  let layer = 0
  while (frontier.length > 0) {
    const next = []
    for (const key of frontier) {
      layers[key] = layer
      order.push(key)
      for (const successor of out.get(key)) {
        indegree.set(successor, indegree.get(successor) - 1)
        if (indegree.get(successor) === 0) next.push(successor)
      }
    }
    frontier = next.sort(compareKeys)
    layer += 1
  }

  // 环判据已经覆盖了所有会让 Kahn 停下来的形状；走到这里还短一截只能是判据与排序不共面。
  // ⛔ 不静默产一份短序（那正是「排序成功却没有依据」）：如实退回 cycle，把剩下的节点名单交出去。
  if (order.length !== kept.length) {
    const leftover = kept.filter((node) => !(node.key in layers)).map((node) => node.key).sort(compareKeys)
    return {
      status: 'cycle',
      cycleMembers: leftover,
      cycles: [{ code: 'kahn-leftover', members: leftover }],
      readings: { ...readings, ordered: order.length, cycleUnreported: true },
    }
  }

  readings.ordered = order.length
  return { status: 'ok', order, layers, readings }
}


/**
 * 从 `readCoverageCollection()` 的返回里取图并排序（**交办与交工两个调用点共用的唯一入口**）。
 * 没有图（卡表为空／`edges` 不是数组）⇒ `null`：调用方据此「整段不加」（票 02 判据 1）。
 *
 * ⚠️ 放在这里而不是各调用点自己拼：两处都会用到 `cards`／`merged.edges`／`live[].key` 这三样，
 * 各写一份「怎么算被剔除」就会长出第二份减法（`ADR-0033` 决策 2）。
 *
 * @param {{cards?: unknown[], merged?: {edges?: unknown}, live?: Array<{key?: unknown}>}} collection
 * @param {Array<{points?: string[]}>|null} [outline]
 * @returns {ReturnType<typeof knowledgeOrder>|null}
 */
export function knowledgeOrderFromCoverage(collection, outline = null) {
  const cards = Array.isArray(collection?.cards) ? collection.cards : []
  const merged = collection?.merged
  if (cards.length === 0 || !Array.isArray(merged?.edges)) return null
  const live = Array.isArray(collection?.live) ? collection.live : []
  return knowledgeOrder(
    { cards, edges: merged.edges },
    { excludedKeys: live.map((item) => item?.key), outline },
  )
}

/**
 * `readings` → 交办／账本那一组**对外的字段名**（唯一投影点）。
 *
 * 内部读数叫 `unresolvedEdges`，对外那四个数是 `unresolvedPrereq`；这层改名只写在这里，
 * ⛔ 不在交办与交工两处各映射一遍（那会让字段名分家）。
 *
 * @param {object} readings {@link knowledgeOrder} 的 `readings`
 * @returns {{outlineVsGraph: number|null, unresolvedPrereq: number|null, danglingPrereq: number, isolated: number, noInEdge: number}}
 *   `unresolvedPrereq`：端点**没被任何章认领**的 `prereq` 边数（spec §判据 2 的「真书 3/62」；
 *   `outline` 缺省时是 `null`——还没有可对账的认领面，⛔ 不拿 0 冒充）。
 *   `danglingPrereq`：端点**不在卡表**的 `prereq` 边数（设计 §2.2 的 `danglingUnknown`；
 *   它 > 0 时 `status` 已经是 `rejected`）。
 */
export function orderReadingFieldsOf(readings) {
  return {
    outlineVsGraph: readings?.outlineVsGraph ?? null,
    unresolvedPrereq: readings?.outlineUnresolvedEdges ?? null,
    danglingPrereq: readings?.unresolvedEdges ?? 0,
    isolated: readings?.isolated ?? 0,
    noInEdge: readings?.noInEdge ?? 0,
  }
}
