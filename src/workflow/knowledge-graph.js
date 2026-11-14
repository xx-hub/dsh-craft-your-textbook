/**
 * 知识点图（**只走 `prereq` 的子图**）的纯函数图算法：查环（含自环与反对称）、环链点名、传递闭包。
 * （票 `.scratch/knowledge-graph-build/issues/02-图算法查环与传递闭包.md`；口径来源
 * `.scratch/knowledge-graph-step/spec.md` §2 第 5 条（`prereq` 的形状性质）与 §5 第 1／5 条。）
 *
 * ## 它做什么／不做什么（本模块的边界就写在这一段，别在别处另写一句）
 *
 * - **做**：吃一份**已经合并完的边表**（票 01 之后合并件里的 `edges[]` 就是它）＋ 可选的**卡表**
 *   （只用于拒收文案里点名），纯函数地算三件：① 三个形状性质（自环／反对称／无环）并进**同一道**
 *   判据 ② 环链点名（指出是哪几张卡构成了环）③ 传递闭包——「某张卡的前置上游有哪些」的**唯一入口**。
 * - **不做**：不读盘、不读时钟、不写随机数（与 `dispatchValues` 同一条纪律）、⛔ 不引第三方图库；
 *   ⛔ 不读任何预存的 `checks` / `problems` 字段（那是实验件算好的**读数**，不是形状依据）；
 *   ⛔ 不接线（落闸门与界面住票 03／10／11——本票只出算法）。
 *
 * ## `kind` 为什么必须显式给出（本票入口最容易退化的那一格）
 *
 * 48 版原型读边时写的是 `e.kind ?? 'prereq'`——于是「查环只走 `prereq`」这句话**声称的边集
 * 就悄悄变宽**：任何一条 kind 缺省的边都被当成前置边进了查环。实测盘上那份
 * `.scratch/_archive/2026-11/knowledge-map-v2/map-whole.json`：53 条边里 **47 条没有 `kind`**、6 条是 `see-also`
 * （取样：`node -e "const a=require('./.scratch/_archive/2026-11/knowledge-map-v2/map-whole.json');console.log(a.edges.length,a.edges.filter((e)=>e.kind===undefined).length)"`）。
 * 「缺省即前置」在这一份上是**差不多对**的，正因为它对，这个默认值才危险：它让边集的口径
 * 藏在**数据**里，而读代码的人以为口径写在**代码**里。⇒ 本模块**不设默认值**：
 *   · **报告面** {@link prereqShapeProblems} 把「kind 缺失」当成一条要报的问题（`edge-kind-missing`）
 *     ——交工那一跳要的是「问题清单」，不是异常；
 *   · **分析面** {@link prereqEdges}／{@link prereqUpstreams}／{@link prereqDirectSuccessors}
 *     **当场抛** {@link KnowledgeGraphInputError}——默默算一份窄掉的闭包，与默默算一份宽掉的环，
 *     是同一个病的两个方向。
 * （`kind` 在枚举域内这一条同样住在这里；边的**其余**字段形状／重复边／边端命中 `cards[].key`
 * 归票 03 的形状闸，本模块一个字不判。）
 *
 * ## 传递闭包是**算法产物**，不是对数据的断言
 *
 * 边的**传递性不保证**：`A→B→C` 而数据里没有 `A→C` 是合法的——存量画的正是**传递约简**、
 * 判定用的才是**传递闭包**（spec §2）。所以 {@link prereqUpstreams} 算出 `A` 的上游里有 `C`，
 * **不意味着**数据里该有一条 `A→C`；也⛔ 不许拿闭包当「该补齐哪些边」的清单（那就成了
 * 「多连边迁就检查」）。环同理：闭包在环上照样算得出来（可达性定义良好），要不要拒收是
 * {@link prereqShapeProblems} 那一件事。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（票 `dev-gate-scan/17` 的纪律；口径照抄 spec §5 末段）
 *
 * - **无环／自环／反对称只扫 `prereq`** ⇒ `alias`／`see-also` 上真实的环**看不见**（**有意**：
 *   那两类不主张方向，`see-also` 明确「不参与查环」，`alias` 是「同一件事两个名字」、无环可言）；
 * - 只判**边集里出现过的节点**：一条 `prereq` 边都没连到的孤岛卡不进扫面（孤岛是另一条读数，
 *   归票 08／11；比率闸一类的上限本仓明确不验）；
 * - **边端存在性**（`from`／`to` 命中卡表）不在本模块：这里只要求 `from`／`to` 是**非空字符串**
 *   ——那是本模块自己建得出图的**输入前提**，不是形状判据（票 03 那一半才是）；
 * - 环**只点名一条链**：同一组卡上若有多个不同的初等环，只点出其中一条（穷举全部初等环不是
 *   本模块的目的；拒收文案要的是「哪几张卡构成了环」）；
 * - 2 元环（`A→B` ＋ `B→A`）**只报反对称、不再报一遍环**；1 元环（自环）同理只报 `edge-self-loop`
 *   ——同一件事不在拒收文案里说两遍（交工那一跳今天只报 `problems[0]`）；
 * - 一条边只报**一件事**，优先级＝**边端 → kind**（两者都缺时先报边端）；
 * - 输出顺序依赖**输入边序**（同输入同输出：不排序、不打乱；只有反对称那一对的键按字典序）；
 * - `tier`／`confidence`／`reason`／`source`／重复边一概不看（票 03 与票 11 的面）。
 *
 * ## 防空跑
 *
 * 本模块只**如实报扫面读数**（{@link prereqShapeProblems} 的 `scan`）。扫到 0 条边时「零问题」
 * 是恒真的空转 ⇒ **下限**（「这一次至少扫到几条」）由调用方／判据去断：票 03 的空扫守卫与
 * 票 11 的条数对账都吃 `scan` 里的数，本模块不替它们定阈值。
 */
// 票 `quality-review-2026-10-29/07`：`isPlainObject` 收编进零依赖叶子（本模块原先那一份是
// 全仓第 2 份逐字抄件）。这是本模块**唯一**的一条 import，且叶子自身零 import——依赖闭包仍是
// 纯的（`test-knowledge-graph.mjs` 的纯度判据同批改成「闭包纯度」，见那张票的 Answer）。
import { isPlainObject } from '../plain-object.js'

/** 边的三类，一个字不加不减（spec §2：`prereq` 有方向主张／`alias` 同一件事两个名字／`see-also` 只是相关）。 */
export const EDGE_KINDS = Object.freeze(['prereq', 'alias', 'see-also'])

/** 查环与闭包**只走这一类**（另两类的名字留在 {@link EDGE_KINDS} 里，只为判定「出域」）。 */
const PREREQ_KIND = 'prereq'

/** 判断面用不到的类别名（写成常量只为少一处字面量）。 */
const ALIAS_KIND = 'alias'
const SEE_ALSO_KIND = 'see-also'

/**
 * 分析面的输入错误：拿到**不显式／出域**的 `kind`、或建不出图的边端时**当场抛**。
 * `code` 是**第一条**缺陷的码（`edge-kind-missing` / `edge-kind-unknown` / `edge-endpoint-missing` /
 * `edge-not-object` / `edges-not-array` / `key-missing`），`details.defects` 是全部逐条。
 */
export class KnowledgeGraphInputError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = 'KnowledgeGraphInputError'
    this.code = code
    this.details = details
  }
}

// ── 小工具（本文件私有；没有一处读盘／读时钟／随机数）──────────────────────────
// ⚠️ `isPlainObject` 不在这里了：票 `quality-review-2026-10-29/07` 把它收编进
// `src/plain-object.js`（全仓 7 份逐字抄件收成一份），见文件头那条 import。

/** 一句能进报错文案的形状描述（⛔ 不 `JSON.stringify` 整份输入：大件会把日志撑爆）。 */
function shapeOf(value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return `数组(${value.length})`
  if (typeof value === 'string') return value === '' ? '空串' : `字符串(${value.length} 字)`
  return typeof value
}

function endpointOf(edge, field) {
  const value = edge[field]
  return typeof value === 'string' && value !== '' ? value : null
}

/**
 * 一条边的**输入缺陷**（`null` ＝ 这条边能进图）。一条边只报一件事，优先级 **边端 → kind**。
 *
 * ⚠️ 「显式 `undefined`」与「没有这个键」同等看待（JSON 里两者都到不了，只有夹具会造出来）。
 */
function edgeDefect(edge) {
  if (!isPlainObject(edge)) return { code: 'edge-not-object' }
  const from = endpointOf(edge, 'from')
  const to = endpointOf(edge, 'to')
  if (from === null || to === null) {
    return { code: 'edge-endpoint-missing', from, to, missing: [from === null ? 'from' : null, to === null ? 'to' : null].filter(Boolean) }
  }
  const kind = Object.hasOwn(edge, 'kind') ? edge.kind : undefined
  if (kind === undefined) return { code: 'edge-kind-missing', from, to }
  if (!EDGE_KINDS.includes(kind)) return { code: 'edge-kind-unknown', from, to, kind }
  return null
}

/** 卡表里**有名有姓**的那些卡 → `key → name`（只用于人读点名；判定的一个字都不吃它）。 */
function namesOf(cards) {
  const names = new Map()
  for (const card of Array.isArray(cards) ? cards : []) {
    if (!isPlainObject(card)) continue
    if (typeof card.key === 'string' && card.key !== '' && typeof card.name === 'string' && card.name !== '') {
      names.set(card.key, card.name)
    }
  }
  return names
}

/** 一张卡的人读点名：有名字就带上（`M1-01-1「情绪闪回…」`），没有就只给键。 */
function labelFor(key, names) {
  const name = names.get(key)
  return name === undefined ? key : `${key}「${name}」`
}

/** 一条边的人读点名（拒收文案里「是哪一条」要说得出来）。 */
function edgeLabelOf(edge) {
  return `${edge.from} → ${edge.to}（边 #${edge.index}）`
}

function defectTextOf(defect, edge, index) {
  if (defect.code === 'edge-not-object') return `边 #${index} 不是对象（${shapeOf(edge)}）`
  if (defect.code === 'edge-endpoint-missing') return `边 #${index} 的 ${defect.missing.join('／')} 不是非空字符串`
  if (defect.code === 'edge-kind-missing') return `边 #${index}（${edge.from} → ${edge.to}）没有显式的 kind`
  return `边 #${index}（${edge.from} → ${edge.to}）的 kind 是 ${shapeOf(defect.kind)}，不在 ${EDGE_KINDS.join('／')} 之内`
}

// ── 图的读入（两个面共用这一段：报告面收问题清单，分析面抛错）────────────────────

/**
 * 读一遍边表：能进图的 `prereq` 边 ＋ 逐条缺陷 ＋ 扫面读数。
 *
 * @param {unknown} edges 合并件里那份 `edges[]`
 * @returns {{prereq: Array<{from: string, to: string, index: number, edge: object}>, defects: Array<object>, scan: object}}
 */
function readEdgeTable(edges) {
  if (!Array.isArray(edges)) {
    throw new KnowledgeGraphInputError(
      'edges-not-array',
      `边表必须是一份数组，拿到的是 ${shapeOf(edges)}——本模块吃的是票 01 之后合并件里的 \`edges[]\`（它不替调用方去找盘上的文件）。`,
    )
  }
  const scan = {
    edges: edges.length,
    notObject: 0,
    endpointMissing: 0,
    kindMissing: 0,
    kindUnknown: 0,
    prereq: 0,
    alias: 0,
    seeAlso: 0,
    nodes: 0,
    selfLoops: 0,
    antisymmetricPairs: 0,
    cycles: 0,
  }
  const prereq = []
  const defects = []
  const nodeSet = new Set()
  edges.forEach((edge, index) => {
    const defect = edgeDefect(edge)
    if (defect !== null) {
      defects.push({ index, ...defect })
      if (defect.code === 'edge-not-object') scan.notObject += 1
      else if (defect.code === 'edge-endpoint-missing') scan.endpointMissing += 1
      else if (defect.code === 'edge-kind-missing') scan.kindMissing += 1
      else scan.kindUnknown += 1
      return
    }
    if (edge.kind === PREREQ_KIND) {
      scan.prereq += 1
      prereq.push({ from: edge.from, to: edge.to, index, edge })
      nodeSet.add(edge.from)
      nodeSet.add(edge.to)
    } else if (edge.kind === ALIAS_KIND) scan.alias += 1
    else if (edge.kind === SEE_ALSO_KIND) scan.seeAlso += 1
  })
  scan.nodes = nodeSet.size
  return { prereq, defects, scan }
}

/** 分析面那道门：有缺陷就抛（第一条缺陷的码当 `code`，全部逐条进 `details`）。 */
function requireCleanEdgeTable(edges, defects) {
  if (defects.length === 0) return
  const first = defects[0]
  const text = defects.map((defect) => defectTextOf(defect, edges[defect.index], defect.index)).join('；')
  throw new KnowledgeGraphInputError(
    first.code,
    `边表里有 ${defects.length} 条边不能进图：${text}。本模块**不把缺省的 kind 读成 prereq**——原型那句 \`e.kind ?? 'prereq'\` 会让「查环只走 prereq」这句声称的边集悄悄变宽；请把 kind 显式写成 ${EDGE_KINDS.join('／')} 之一。`,
    { defects },
  )
}

/** `prereq` 边集 → 前驱／后继邻接（去重、保输入序；自环不参与查环，故不进邻接）。 */
function adjacencyOf(prereq) {
  const nodes = []
  const seenNode = new Set()
  for (const edge of prereq) {
    for (const node of [edge.from, edge.to]) {
      if (seenNode.has(node)) continue
      seenNode.add(node)
      nodes.push(node)
    }
  }
  const out = new Map(nodes.map((node) => [node, []]))
  const into = new Map(nodes.map((node) => [node, []]))
  const seenEdge = new Set()
  for (const edge of prereq) {
    if (edge.from === edge.to) continue // 自环另有 edge-self-loop 那一条（不在这里再说一遍）
    const signature = `${edge.from}\u0000${edge.to}`
    if (seenEdge.has(signature)) continue // 同一条边写两遍不进邻接（重复边判红归票 03）
    seenEdge.add(signature)
    out.get(edge.from).push(edge.to)
    into.get(edge.to).push(edge.from)
  }
  return { nodes, out, into }
}

// ── ① 报告面：三个形状性质并进同一道 ────────────────────────────────────────────

/**
 * `prereq` 子图的形状问题清单（**空数组＝这一道全过**）。自环／反对称／无环＋输入卫生，
 * 全在**同一次**调用里报出来（交工那一跳只报 `problems[0]`，所以顺序也是契约：
 * ① 输入卫生（按边序）② 自环 ③ 反对称 ④ 环）。
 *
 * @param {unknown} edges 合并件里那份 `edges[]`（**合并之后**的那一份）
 * @param {{cards?: ReadonlyArray<{key?: unknown, name?: unknown}>}} [options] 卡表：**只用于点名**
 * @returns {{problems: Array<object>, scan: object}} `scan` 是扫面读数（防空跑下限由调用方断）
 */
export function prereqShapeProblems(edges, options = {}) {
  const { prereq, defects, scan } = readEdgeTable(edges)
  const names = namesOf(options?.cards)
  const problems = []

  // ① 输入卫生：kind 显式且入域、边端建得出图（说明见文件头「`kind` 为什么必须显式给出」）
  for (const defect of defects) {
    const edge = edges[defect.index]
    const base = {
      code: defect.code,
      edgeIndex: defect.index,
      message: defectTextOf(defect, edge, defect.index),
    }
    if (defect.code === 'edge-kind-missing') {
      problems.push({
        ...base,
        from: defect.from,
        to: defect.to,
        message: `${base.message}：本模块不把它读成 ${PREREQ_KIND}（那会让「查环只走 ${PREREQ_KIND}」这句声称的边集悄悄变宽）——请把 kind 显式写成 ${EDGE_KINDS.join('／')} 之一。`,
      })
    } else if (defect.code === 'edge-kind-unknown') {
      problems.push({ ...base, from: defect.from, to: defect.to, kind: defect.kind })
    } else {
      problems.push(base)
    }
  }

  // ② 自环：A 不能是自己的前置
  const selfLoops = prereq.filter((edge) => edge.from === edge.to)
  scan.selfLoops = selfLoops.length
  for (const edge of selfLoops) {
    problems.push({
      code: 'edge-self-loop',
      edgeIndex: edge.index,
      node: edge.from,
      from: edge.from,
      to: edge.to,
      message: `自环：卡 ${labelFor(edge.from, names)}有一条指向自己的 ${PREREQ_KIND} 边（${edgeLabelOf(edge)}）——前置关系里一张卡不能是自己的前置。`,
    })
  }

  // ③ 反对称：A→B 与 B→A 不许同时成立（每一对只报一条，对内的键按字典序，点名稳定）
  const directed = new Set()
  const firstIndexOf = new Map()
  for (const edge of prereq) {
    if (edge.from === edge.to) continue
    const signature = `${edge.from}\u0000${edge.to}`
    if (!directed.has(signature)) {
      directed.add(signature)
      firstIndexOf.set(signature, edge.index)
    }
  }
  const pairSeen = new Set()
  for (const edge of prereq) {
    if (edge.from === edge.to) continue
    const forward = `${edge.from}\u0000${edge.to}`
    const backward = `${edge.to}\u0000${edge.from}`
    if (!directed.has(backward)) continue
    const pair = [edge.from, edge.to].slice().sort()
    const pairKey = pair.join('\u0000')
    if (pairSeen.has(pairKey)) continue
    pairSeen.add(pairKey)
    const edgeIndexes = [firstIndexOf.get(forward), firstIndexOf.get(backward)].slice().sort((a, b) => a - b)
    problems.push({
      code: 'edge-antisymmetric',
      pair,
      edgeIndexes,
      message: `反对称：卡 ${labelFor(pair[0], names)}与卡 ${labelFor(pair[1], names)}之间同时有 ${pair[0]} → ${pair[1]} 与 ${pair[1]} → ${pair[0]} 两条 ${PREREQ_KIND} 边（边 #${edgeIndexes[0]}、#${edgeIndexes[1]}）——前置只认一个方向，两者不能同时成立。`,
    })
  }
  scan.antisymmetricPairs = pairSeen.size

  // ④ 无环：DFS 找回路。1 元环（自环）与 2 元环（反对称那一对）已各有各的码，这里只报 ≥3 张卡的环。
  const { nodes, out } = adjacencyOf(prereq)
  const cycles = findCycles(nodes, out)
  scan.cycles = cycles.length
  for (const chain of cycles) {
    const edgeIndexes = []
    for (let i = 0; i + 1 < chain.length; i += 1) {
      const hit = prereq.find((edge) => edge.from === chain[i] && edge.to === chain[i + 1])
      if (hit !== undefined) edgeIndexes.push(hit.index)
    }
    const onCycle = chain.slice(0, -1)
    problems.push({
      code: 'prereq-cycle',
      cycle: chain,
      nodes: onCycle,
      edgeIndexes,
      message: `环：${chain.map((key) => labelFor(key, names)).join(' → ')}——这 ${onCycle.length} 张卡互相成为前置（前置关系必须无环，请至少改掉其中一条边${edgeIndexes.length === onCycle.length ? `：#${edgeIndexes.join('、#')}` : ''}）。`,
    })
  }

  return { problems, scan }
}

/**
 * 回路点名：迭代式 DFS（**不递归**——深链不该靠调用栈兜底），回溯边落在当前路径上即得一条链。
 * 同一组卡上只回**一条**链（按 `chain.slice(0, -1)` 去重，见文件头那条窄处）。
 *
 * @param {string[]} nodes 按首次出现序
 * @param {Map<string, string[]>} out 后继邻接（已去重、不含自环）
 * @returns {string[][]} 每条链形如 `[A, B, C, A]`（首尾同一张卡）
 */
function findCycles(nodes, out) {
  const WHITE = 0
  const GRAY = 1
  const BLACK = 2
  const color = new Map(nodes.map((node) => [node, WHITE]))
  const found = []
  const reportedGroups = new Set()
  for (const root of nodes) {
    if (color.get(root) !== WHITE) continue
    const path = [root]
    const positionOnPath = new Map([[root, 0]])
    color.set(root, GRAY)
    const stack = [{ node: root, next: 0 }]
    while (stack.length > 0) {
      const frame = stack[stack.length - 1]
      const successors = out.get(frame.node) ?? []
      if (frame.next >= successors.length) {
        color.set(frame.node, BLACK)
        positionOnPath.delete(frame.node)
        path.pop()
        stack.pop()
        continue
      }
      const to = successors[frame.next]
      frame.next += 1
      const state = color.get(to) ?? WHITE
      if (state === WHITE) {
        color.set(to, GRAY)
        positionOnPath.set(to, path.length)
        path.push(to)
        stack.push({ node: to, next: 0 })
      } else if (state === GRAY) {
        const chain = path.slice(positionOnPath.get(to)).concat([to])
        if (chain.length - 1 < 3) continue // 1 元／2 元环各有自己的码（见文件头那条窄处）
        const group = chain.slice(0, -1).slice().sort().join('\u0000')
        if (reportedGroups.has(group)) continue
        reportedGroups.add(group)
        found.push(chain)
      }
    }
  }
  return found
}

// ── ② 分析面：边集与闭包（`kind` 不干净就抛）──────────────────────────────────

/**
 * **唯一入口**：这份边表里那些**显式写着** `kind: 'prereq'` 的边（保输入序、原对象引用）。
 * 票 11 的逐边清单与两个读者面都从这里取边，⛔ 别在调用方再写一次 `filter`——那会多出一处口径。
 *
 * @param {unknown} edges
 * @returns {object[]} `prereq` 边的子集
 * @throws {KnowledgeGraphInputError} 任一条边的 kind 不显式／出域，或边端建不出图
 */
export function prereqEdges(edges) {
  const { prereq, defects } = readEdgeTable(edges)
  requireCleanEdgeTable(edges, defects)
  return prereq.map((entry) => entry.edge)
}

/**
 * **唯一入口**：「某张卡的前置上游有哪些」。
 *
 * 返回按**距离分层**的上游：第 1 层＝直接前置，第 2 层＝再往前一层，依此类推（票 10 那句话是
 * 「第 1 层详给、第 2 层及更远只给名字」）。⚠️ 这是**算法产物**、不是对数据的断言：传递性不保证
 * （`A→B→C` 而 `A` 不到 `C` 合法），所以算出来的上游**不意味着**数据里该有一条边连过去。
 * ⚠️ 起点**不在自己的上游里**（哪怕它在环上）；环由 {@link prereqShapeProblems} 报。
 *
 * @param {unknown} edges 合并之后那份边表
 * @param {string} key 起点那张卡的**书内复合键**（`cards[].key`）
 * @returns {{key: string, known: boolean, upstream: string[], layers: string[][], distances: Map<string, number>}}
 *   `known` ＝这张卡在这份 `prereq` 边集里出现过（有边连着它）；`upstream` ＝ `layers.flat()`
 */
export function prereqUpstreams(edges, key) {
  if (typeof key !== 'string' || key === '') {
    throw new KnowledgeGraphInputError('key-missing', `起点必须是一张卡的键（非空字符串），拿到的是 ${shapeOf(key)}。`)
  }
  const prereq = prereqEdges(edges)
  const { nodes, into } = adjacencyOf(prereq)
  const layers = []
  const distances = new Map()
  if (nodes.includes(key)) {
    const seen = new Set([key])
    let frontier = [key]
    let distance = 0
    while (frontier.length > 0) {
      distance += 1
      const next = []
      for (const node of frontier) {
        for (const previous of into.get(node) ?? []) {
          if (seen.has(previous)) continue
          seen.add(previous)
          distances.set(previous, distance)
          next.push(previous)
        }
      }
      if (next.length > 0) layers.push(next)
      frontier = next
    }
  }
  return { key, known: nodes.includes(key), upstream: layers.flat(), layers, distances }
}

/**
 * **直接后继**（距离 1 的下游）：spec §4 说写作面那一格要给「上游传递闭包 ＋ **直接后继**」，
 * 所以这里给上游闭包配一个同族的兄弟（⛔ 不是「上游有哪些」的第二个入口——那一个只有
 * {@link prereqUpstreams}）。自环不把这张卡算成自己的后继（它由形状判据报）。
 *
 * @param {unknown} edges
 * @param {string} key
 * @returns {{key: string, known: boolean, successors: string[]}}
 */
export function prereqDirectSuccessors(edges, key) {
  if (typeof key !== 'string' || key === '') {
    throw new KnowledgeGraphInputError('key-missing', `起点必须是一张卡的键（非空字符串），拿到的是 ${shapeOf(key)}。`)
  }
  const prereq = prereqEdges(edges)
  const { nodes, out } = adjacencyOf(prereq)
  const successors = nodes.includes(key) ? (out.get(key) ?? []) : []
  return { key, known: nodes.includes(key), successors: successors.slice() }
}
