/**
 * 「同一件事在几份材料里各出现一次」的**合并步**：把对齐小助手交来的「对齐结论」落成
 * **一条知识点 ＋ N 个位置索引**（票 `.scratch/knowledge-graph-build/issues/06`；
 * 口径来源 `.scratch/knowledge-graph-step/spec.md` §3（合并规则）／§7（跨材料）／§8.2（`locations` 形状））。
 *
 * ## 它做什么／不做什么（本模块的边界就写在这一段，别在别处另写一句）
 *
 * - **做**：吃一份**已经拼装完的合并件**（`{materials, knowledgePoints, cards, edges, …}`，票 01／03 那份
 *   「分片 ＋ 书级键的确定函数」）＋ 主笔交来的**对齐结论**（`{merges: [{survivor, absorbed, reason?}]}`），
 *   纯函数地做四件：① 校验结论本身站得住（指得到真卡、不重、确实跨材料）；
 *   ② 被并的卡**整张**记进 survivor 的 `mergedFrom`（`name`／`testable`／锚都在 ⇒ 可回滚）；
 *   ③ 按各条的 `anchor` ＋ 它 `key` 前缀里的材料号**现算** `locations`（`[{material, start, end}]`）；
 *   ④ 被并卡的边**改指 survivor**（并集：同一 `from`／`to`／`kind` 只留先出现的那一条），
 *      并把「合并自己吃掉的那两条关系」（合并组内部的 `alias`／`see-also` 自环）如实记进读数。
 * - **不做**：不读盘、不写盘、不读时钟、不写随机数（同 `dispatchValues` 的纯函数纪律）；
 *   ⛔ **不判语义**（两张卡到底是不是同一件事——那是对齐小助手与后面那次独立审校的判断，
 *   本模块只管它交来的结论**形状**与**落地**）；⛔ 不产边、不改 `materials`、不碰书级三键。
 * - **合并之后现算查环**：本模块**不做**——那件事归形状闸（`knowledge-map-gate.js` 的④，
 *   它吃的是**合并之后**的边表；交工那一跳是「合并 → 随后调闸」，顺序是契约）。
 *
 * ## 为什么 `locations` 由这里产（而不是分片产、也不是 `anchor` 的复数）
 *
 * `anchor` 是**分片侧**的字段（1 基行段，⛔ 不带材料号——分片只知道本材料）；`locations` 是**合并件侧**的字段
 * （`{material, start, end}`）。两个字段、两份产物、两个产者（spec §8.2 那处混轴订正）。
 * ⇒ 位置索引的材料号只能从**书内复合键** `M<材料号>-…` 里现算，而那是合并这一刻才有的视野。
 * ⛔ **章号不进索引**（精读那一刻章号不存在）。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）
 *
 * · **只对「材料号」负责**（spec §5 末段那一条照抄）：位置索引证明的是「这条属于哪几份材料、
 *   在那份材料的哪一段」——它**不证明「这条原文到底在哪」**（行号整体偏移、或指着同一份材料里
 *   另一段，本模块一个字都看不出来）。`anchor` 的区间形状由形状闸判，本模块**不重复判一遍**。
 * · **「同一件事」是判断题**：两张卡为什么算同一件事（`reason`）本模块**只搬不判**——它拿到的
 *   `merges` 是**主笔交来的结论**，本模块证明不了它是对的，也证明不了「该合并的都被合并了」
 *   （对齐小助手**漏并**了，这里没有任何读数会响；那条口子见 spec §12 的已知债）。
 * · **被并卡的边是「按 key 改指」**：同一条边在改指之后与 survivor 自己那条三样全同 ⇒ 只留先出现的
 *   那一条（读数 `droppedDuplicateEdges` 如实记）。**哪一条留着**是按拼装序（分片序）判的，
 *   不是按「survivor 的那条优先」——本模块不猜哪条理由更好。
 * · **`knowledgePoints` 先按位置、后按 `title` 配对**：各片都是 `cards[i].name === knowledgePoints[i].title`
 *   这套 1:1 派生的产物 ⇒ **位置就是它那一条**（两份材料同一节的那条标题逐字相同时，只有位置分得开
 *   「删 survivor 自己那条」与「删被并那条」）；位置对不上才退回「按 `title` 逐项消耗」。它**不证明**
 *   删掉的正是那一张卡对应的那一条——**分片自己没按 1:1 排**时（位置那条落空），机器就只剩标题这一把尺子。
 * · **只认 `M<数字>-` 这个前缀**：认不出材料号的卡（键写成别的样子）在这里是**硬问题**
 *   （`alignment-card-material-unknown`）——造不出位置索引就静默少一条，正是本仓点名的病。
 */

import { EDGE_KINDS } from './knowledge-graph.js'
// 票 `quality-review-2026-10-29/07`：`isPlainObject` 收编进零依赖叶子（本文件原先那一份是全仓
// 逐字抄件之一；判据＝`test-book-shape.mjs` 的「单点 · 对象判据」那一格）。
import { isPlainObject } from '../plain-object.js'

/** 留下的那一条卡上，被并卡的**整张**记在这个字段里（spec §3：可回滚）。 */
export const MERGED_FROM_FIELD = 'mergedFrom'

/** 合并件侧的位置索引字段（spec §8.2：非空数组、逐项 `{material, start, end}`）。 */
export const LOCATIONS_FIELD = 'locations'

/** 对齐结论里认得的键（⛔ 族外键不许静默丢——与 `bookLevelProblems` 同一条纪律）。 */
const ALIGNMENT_KEYS = Object.freeze(['merges'])

/** 书的**内复合键**里那一段材料号（`M<材料号>-<片内组:02>-<序号:02>`）。 */
const MATERIAL_KEY_RE = /^M(\d+)-/u

/** 「合并吃掉的关系」：这一对卡已经是同一件事了，它们之间的这两类边没有意义（⛔ 不含 `prereq`）。 */
const CONSUMED_KINDS = Object.freeze(['alias', 'see-also'])

/**
 * 对齐结论本身的问题码（**下游按码取值的那一份**：交工那一跳只回 `problems[0]` 的 message）。
 *
 * ⚠️ 它们**不进形状闸的码表**（`GATE_PROBLEM_CODES`）：闸吃的是**合并之后**那份合并件，
 * 这里是「主笔交来的那份参数」——两个不同的面，两个不同的码表（别把两份并成一份）。
 */
export const ALIGNMENT_PROBLEM_CODES = Object.freeze([
  'alignment-not-object',
  'alignment-key-unknown',
  'alignment-merges-shape',
  'alignment-group-shape',
  'alignment-key-unknown-card',
  'alignment-key-reused',
  'alignment-group-not-cross-material',
  'alignment-card-material-unknown',
  'alignment-card-point-missing',
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

/** 卡的人读点名（`key「name」`，缺哪个用哪个）。 */
function cardLabel(card, fallback) {
  const key = nonEmptyText(card?.key) ? card.key : fallback
  const name = nonEmptyText(card?.name) ? `「${card.name}」` : ''
  return `${key}${name}`
}

/**
 * 一张卡的**书内复合键**里那个材料号（`M<材料号>-…`）；认不出返回 `null`。
 *
 * ⚠️ 只认这一个前缀（见文件头那条窄处）：别的写法一律 `null`，由调用方**点名**，⛔ 不猜。
 */
export function materialOfCardKey(key) {
  if (!nonEmptyText(key)) return null
  const match = MATERIAL_KEY_RE.exec(key.trim())
  if (match === null) return null
  const n = Number(match[1])
  return Number.isSafeInteger(n) && n > 0 ? n : null
}

/**
 * 一张卡属于**哪几份材料**（升序去重的材料号数组）——spec §7 那条判据的现算口径：
 * **未合并卡＝它自己那份材料（key 前缀）；合并卡＝survivor ∪ `mergedFrom` 各那份**。⛔ 不新增字段。
 *
 * @param {{key?: unknown, mergedFrom?: unknown}} card
 * @returns {number[]}
 */
export function materialNumbersOfCard(card) {
  const found = new Set()
  const eat = (key) => {
    const n = materialOfCardKey(key)
    if (n !== null) found.add(n)
  }
  eat(card?.key)
  for (const row of Array.isArray(card?.[MERGED_FROM_FIELD]) ? card[MERGED_FROM_FIELD] : []) {
    eat(row?.key)
  }
  return [...found].sort((a, b) => a - b)
}

/**
 * 卡表 → `key → 材料号数组`（闸与下游都从这里取「两端材料集合」，⛔ 别在调用方再写一遍解析）。
 *
 * ⚠️ 认不出材料号的卡在索引里是**空数组**：闸按「空集与谁都不相交 ⇒ 算跨材料」处理
 * （见 `knowledge-map-gate.js` 那条窄处：宁可压上限，不给静默逃逸的口子）。
 */
export function cardMaterialIndex(cards) {
  const index = new Map()
  for (const card of Array.isArray(cards) ? cards : []) {
    if (!isPlainObject(card) || !nonEmptyText(card.key)) continue
    index.set(card.key, materialNumbersOfCard(card))
  }
  return index
}

/** 两端材料集合**是否相交**（spec §7：不相交＝跨材料）。任一端不在索引里／集合为空 ⇒ 不相交。 */
export function isCrossMaterialEdge(edge, index) {
  const from = index.get(edge?.from) ?? []
  const to = index.get(edge?.to) ?? []
  if (from.length === 0 || to.length === 0) return true
  return !from.some((n) => to.includes(n))
}

// ── ① 结论本身的形状（唯一一处点名；`applyKnowledgeMapMerge` 先过它）────────────────

/**
 * 对齐结论**自己**站不站得住（空数组＝站得住）。逐条点名是哪一组、哪个 key。
 *
 * ⚠️ **这一层看不见**「该合并的漏并了」「两张卡到底是不是同一件事」——那是判断题（文件头那条窄处）。
 *
 * @param {{cards?: unknown}} merged 拼装完的合并件（只用它的 `cards` 找 key）
 * @param {unknown} alignment 主笔交来的对齐结论
 * @returns {{problems: Array<{code: string, message: string}>, groups: Array<object>}}
 */
export function alignmentProblems(merged, alignment) {
  const problems = []
  if (alignment === undefined || alignment === null) return { problems, groups: [] }
  const push = (code, message) => problems.push({ code, message })
  if (!isPlainObject(alignment)) {
    push('alignment-not-object', `对齐结论必须是一个对象（形如 {merges: [{survivor, absorbed}]}），实为 ${shapeOf(alignment)}——它逐字来自对齐小助手的回灌，主笔原样带进 stage-submit(explore) 的同名参数`)
    return { problems, groups: [] }
  }
  for (const key of Object.keys(alignment)) {
    if (!ALIGNMENT_KEYS.includes(key)) {
      push('alignment-key-unknown', `对齐结论里的「${key}」不在契约里（只认 ${ALIGNMENT_KEYS.join('／')}）——机器不静默丢参数、也不替它编一份：要么别交过来，要么把它登记进契约`)
    }
  }
  const merges = alignment.merges
  if (merges === undefined || merges === null) return { problems, groups: [] }
  if (!Array.isArray(merges)) {
    push('alignment-merges-shape', `对齐结论里的 merges 必须是数组（实为 ${shapeOf(merges)}）——一组一条，没合并就交空数组`)
    return { problems, groups: [] }
  }
  const cards = Array.isArray(merged?.cards) ? merged.cards : []
  const byKey = new Map()
  for (const card of cards) {
    if (isPlainObject(card) && nonEmptyText(card.key) && !byKey.has(card.key)) byKey.set(card.key, card)
  }
  const seen = new Map() // key → 「第 N 组（survivor／absorbed）」，同一张卡不许出现在两处
  const groups = []
  merges.forEach((group, at) => {
    const where = `对齐结论第 ${at + 1} 组`
    if (!isPlainObject(group)) {
      push('alignment-group-shape', `${where} 不是一个对象（实为 ${shapeOf(group)}）——一组形如 {survivor, absorbed: [key…], reason?}`)
      return
    }
    for (const key of Object.keys(group)) {
      if (!['survivor', 'absorbed', 'reason'].includes(key)) {
        push('alignment-group-shape', `${where} 里的「${key}」不是这一组的字段（只认 survivor／absorbed／reason）`)
      }
    }
    const survivor = group.survivor
    const absorbed = group.absorbed
    if (!nonEmptyText(survivor)) {
      push('alignment-group-shape', `${where} 的 survivor 必须是非空字符串（留下的那一条卡的 key；实为 ${shapeOf(survivor)}）`)
      return
    }
    if (!Array.isArray(absorbed) || absorbed.length === 0 || !absorbed.every((key) => nonEmptyText(key))) {
      push('alignment-group-shape', `${where}（survivor=${survivor}）的 absorbed 必须是**非空**的 key 数组（被并进去的那几条；实为 ${shapeOf(absorbed)}）`)
      return
    }
    const members = [survivor, ...absorbed]
    for (const [side, key] of [['survivor', survivor], ...absorbed.map((one) => ['absorbed', one])]) {
      if (!byKey.has(key)) {
        push('alignment-key-unknown-card', `${where} 的 ${side}「${key}」不在 cards 的 key 里——对齐结论必须指着真卡（写错 key 机器不猜，否则这一组的合并会静默落空）`)
        return
      }
    }
    for (const key of members) {
      if (seen.has(key)) {
        push('alignment-key-reused', `${where} 里的卡「${key}」在${seen.get(key)}里已经出现过——同一张卡不许出现在两处（既当 survivor 又被并、或落在两组里），那是两种合并互相打架`)
        return
      }
    }
    // ⛔ 只合并**跨材料**的（spec §3；同材料内维持 `alias`，那口子归 spec §12 的已知债，不在这里堵）。
    const materials = new Set()
    for (const key of members) for (const n of materialNumbersOfCard(byKey.get(key))) materials.add(n)
    if (materials.size < 2) {
      push('alignment-group-not-cross-material', `${where} 的这几张卡都在同一份材料里（${materials.size === 0 ? '而且 key 前缀里认不出材料号' : `材料 ${[...materials].sort((a, b) => a - b).join('、')}`}）：「同一件事」的合并在这一层**只合并跨材料**的；同一份材料内的两个名字维持 alias（要改成一律合并＝另一张票 ＋ 重画 Destination）`)
      return
    }
    members.forEach((key) => seen.set(key, where))
    groups.push({ survivor, absorbed: [...absorbed], reason: nonEmptyText(group.reason) ? group.reason : null, materials: [...materials].sort((a, b) => a - b) })
  })
  return { problems, groups }
}

// ── ② 合并落地（纯函数：合并件 ＋ 结论 → 一份新的合并件 ＋ 读数）─────────────────────

/** 一条 `locations` 项：`{material, start, end}`（非对象／行段不成形状的锚项**不进**——那是锚的账，归形状闸）。 */
function locationItemsOf(anchor, material) {
  const items = []
  for (const item of Array.isArray(anchor) ? anchor : []) {
    if (!isPlainObject(item)) continue
    const { start, end } = item
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end < 1 || start > end) continue
    items.push({ material, start, end })
  }
  return items
}

/**
 * 对齐结论 → 合并之后的合并件（**纯函数**：不改入参；没交结论时原样返回同一个引用）。
 *
 * @param {object} merged 拼装完的合并件
 * @param {unknown} alignment 主笔交来的对齐结论（`undefined`／`null` ＝ 这一本没有对齐结论，合法）
 * @returns {{merged: object, problems: Array<{code: string, message: string}>, readings: object}}
 *   `problems` 非空时**不要**用返回的 `merged`（它可能只改了一半）——交工那一跳按 `problems[0]` 拒收。
 */
export function applyKnowledgeMapMerge(merged, alignment) {
  const readings = {
    groups: 0,
    absorbedCards: 0,
    locations: 0,
    locationsAdded: 0,
    pointsRemoved: 0,
    rewiredEdges: 0,
    droppedDuplicateEdges: 0,
    droppedConsumedEdges: 0,
  }
  const { problems, groups } = alignmentProblems(merged, alignment)
  if (problems.length > 0 || groups.length === 0) return { merged, problems, readings }
  if (!isPlainObject(merged) || !Array.isArray(merged.cards) || !Array.isArray(merged.edges)) {
    return {
      merged,
      problems: [{ code: 'alignment-key-unknown-card', message: '合并件里没有 cards／edges 数组——对齐结论无从落地（这一份不是拼装出来的合并件？）' }],
      readings,
    }
  }

  const byKey = new Map()
  for (const card of merged.cards) {
    if (isPlainObject(card) && nonEmptyText(card.key) && !byKey.has(card.key)) byKey.set(card.key, card)
  }
  /** 被并的 key → survivor 的 key（查表用）。 */
  const survivorOf = new Map()
  /** survivor 的 key → 它的那一组（落地时用）。 */
  const groupOf = new Map()
  for (const group of groups) {
    groupOf.set(group.survivor, group)
    for (const key of group.absorbed) survivorOf.set(key, group.survivor)
  }

  // ① 卡：survivor 挂 `mergedFrom`（整张）＋ `locations`（按各条的 anchor ＋ 材料号现算）；被并卡不再出场。
  const localProblems = []
  const newCards = []
  for (const card of merged.cards) {
    if (!isPlainObject(card) || !nonEmptyText(card.key)) {
      newCards.push(card)
      continue
    }
    if (survivorOf.has(card.key)) continue // 被并的那一条不再是一张卡
    const group = groupOf.get(card.key)
    if (group === undefined) {
      newCards.push(card)
      continue
    }
    const members = [card, ...group.absorbed.map((key) => byKey.get(key))]
    const locations = []
    for (const member of members) {
      const material = materialOfCardKey(member.key)
      if (material === null) {
        localProblems.push({
          code: 'alignment-card-material-unknown',
          message: `卡 ${cardLabel(member, '（缺 key）')} 的书内复合键里认不出材料号（形如 M<材料号>-<片内组:02>-<序号:02>）——位置索引要按材料号挂，认不出就只能静默少一条，所以这里当场拦下（这一组的 survivor 是 ${cardLabel(card, '（缺 key）')}）`,
        })
        continue
      }
      // ⚠️ `difficulty` 之类只搬不写：`locations` 与 `mergedFrom` 是**新增**的两个字段，其余字段逐字照旧。
      locations.push(...locationItemsOf(member.anchor, material))
    }
    if (locations.length === 0) {
      localProblems.push({
        code: 'alignment-card-material-unknown',
        message: `卡 ${cardLabel(card, '（缺 key）')} 这一组（含被并的 ${group.absorbed.length} 张）一条位置索引都算不出来——各条的 anchor 至少要有可解析的行段（锚的形状归形状闸，这里只是算不出索引时如实拦下）`,
      })
    }
    newCards.push({
      ...card,
      // ⚠️ 被并的那条**深拷贝**进 `mergedFrom`（不是引用）：它是「可回滚」的那份快照，
      // 调用方之后改自己手上那份合并件不该把留档一起改掉（`structuredClone` 是 stdlib，不引第三方）。
      [MERGED_FROM_FIELD]: group.absorbed.map((key) => structuredClone(byKey.get(key))),
      [LOCATIONS_FIELD]: locations,
    })
    readings.groups += 1
    readings.absorbedCards += group.absorbed.length
    readings.locations += locations.length
    readings.locationsAdded += 1
  }
  if (localProblems.length > 0) return { merged, problems: localProblems, readings }

  // ② 知识点：被并的那一条**并进留下的那条**（合并是「并成一条知识点」，不是只动卡——
  //    只删卡不删知识点会把 1:1 双射拆开，那是形状闸⑤的账）。
  //    ⚠️ **配对顺序**：先按**被并卡在拼装序里的位置**配（各片都是 `cards[i].name === knowledgePoints[i].title`
  //    这套 1:1 派生的产物 ⇒ 位置就是它那一条）；位置对不上（分片没按 1:1 排）才退回「按 title 逐项消耗」。
  //    两处同名时（真的会：两份材料同一节的那条标题逐字相同）**先按位置**才不会删错——按 title 取第一条
  //    会把 survivor 自己那条删掉、留下被并那条的（卡片说的是材料 1、留下来的 `source` 却写着资料 2）。
  const points = Array.isArray(merged.knowledgePoints) ? merged.knowledgePoints : []
  const consumed = new Set()
  for (const group of groups) {
    for (const key of group.absorbed) {
      const absorbedCard = byKey.get(key)
      const name = absorbedCard.name
      const at = merged.cards.indexOf(absorbedCard)
      let hit = at >= 0 && !consumed.has(at) && isPlainObject(points[at]) && points[at].title === name ? at : -1
      if (hit < 0) {
        points.forEach((point, index) => {
          if (hit >= 0 || consumed.has(index)) return
          if (isPlainObject(point) && point.title === name) hit = index
        })
      }
      if (hit < 0) {
        return {
          merged,
          problems: [{
            code: 'alignment-card-point-missing',
            message: `被并的卡 ${cardLabel(absorbedCard, key)} 在 knowledgePoints 里找不到同名（title 逐字等于卡的 name）的那一条——1:1 派生被拆了（分片那一侧的问题）：合并要先能配对才谈得上「并成一条知识点」`,
          }],
          readings,
        }
      }
      consumed.add(hit)
      readings.pointsRemoved += 1
    }
  }
  const newPoints = points.filter((_point, at) => !consumed.has(at))

  // ③ 边：被并卡的边改指 survivor（并集）；同一 `from`／`to`／`kind` 只留先出现的那一条。
  const newEdges = []
  const signatures = new Map() // `from\0to\0kind` → { rewritten: boolean }
  for (const edge of merged.edges) {
    if (!isPlainObject(edge)) {
      newEdges.push(edge)
      continue
    }
    const from = survivorOf.get(edge.from) ?? edge.from
    const to = survivorOf.get(edge.to) ?? edge.to
    const rewritten = from !== edge.from || to !== edge.to
    // `rewiredEdges` 数的是**被改指过的边**（含随后被并集吃掉的那一条）——不是「落进图里的改指边」：
    // 两个数混成一个会让「合并吃掉了多少」看不出来（那两笔各自另有读数）。
    if (rewritten) readings.rewiredEdges += 1
    const next = rewritten ? { ...edge, from, to } : edge
    // 合并自己吃掉的那两条关系：两端都成了同一张卡、而这一类边不主张方向（`prereq` **不在此列**——
    // 合并出来一条前置自环是「你说的两件事其实有先后」这种真矛盾，留给形状闸点名）。
    if (rewritten && from === to && CONSUMED_KINDS.includes(next.kind)) {
      readings.droppedConsumedEdges += 1
      continue
    }
    if (nonEmptyText(from) && nonEmptyText(to) && nonEmptyText(next.kind)) {
      const signature = `${from}\u0000${to}\u0000${next.kind}`
      const seen = signatures.get(signature)
      if (seen !== undefined && (seen.rewritten || rewritten)) {
        readings.droppedDuplicateEdges += 1
        continue
      }
      signatures.set(signature, { rewritten: seen === undefined ? rewritten : seen.rewritten || rewritten })
      newEdges.push(next)
      continue
    }
    newEdges.push(next)
  }

  // 键序照旧（只覆盖已存在的键 ⇒ 合并件的键序契约不受本步影响）。
  return {
    merged: { ...merged, knowledgePoints: newPoints, cards: newCards, edges: newEdges },
    problems: [],
    readings,
  }
}
