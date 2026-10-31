/**
 * 「知识链」——**写作面两个既有槽**的机填物（票 `.scratch/knowledge-graph-build/issues/10`；口径来源
 * `.scratch/knowledge-graph-step/spec.md` §4「写作那一格」＋ §3「合并＝去重不是断料」那一节）。
 *
 * ## 它做什么／不做什么（这一段就是本模块的边界，别在别处另写一句）
 *
 * - **做**：吃一份**合并件**（`工作区/knowledge-map.json` 解析出来的对象）＋ `outline` 的章节 ＋
 *   （可选）那张**被划掉的卡**的键集合，按 spec §4 给**本章每个 `points`** 算一份「知识链」：
 *   ① `prereq` **上游传递闭包按距离分层**（第 1 层详给：名字 ＋ 一句 `testable` ＋ 归第几章 ＋
 *   位置索引；第 2 层及更远只给名字串一行）；② **直接后继**；③ 同章内的前置按本章 `points` 数组
 *   下标排在前面。渲染出来直接进那两个槽（`{{本章知识链位置说明}}`／`{{知识链前置小节}}`）。
 * - **不做**：⛔ **不新开槽位**（模板即契约）、⛔ **不抄原文**（只给名字与索引，要读照索引回材料）、
 *   ⛔ **不改 `outline`**（它是提示不是约束）、⛔ **不落第二份**（现算的正文只进那一份 prompt，
 *   盘上不写一个字节）、⛔ **不产判断**（哪条前置真的讲过是写作者与跨章审计的事）。
 *
 * ## 只走「方向已定」的边（`see-also` 与把握档「待核」一条都不进）
 *
 * spec §4 逐字：「`alias` 按 §2 读；**`see-also` 与 `待核` 不进**（方向都没定的边不该当约束交给
 * 写作者）」。⇒ 本模块的边集＝**显式 `kind: 'prereq'` 且把握档 ≠「待核」**的那几条（闭包与后继只用
 * 它），外加 `alias` 那几类**只印成「同一件事的另一个名字」**：
 *
 * - `alias`（spec §2：同一件事两个名字）**不是方向**，所以它既不进闭包也不进后继——只印在它那两张卡
 *   被别人点名的地方，让写作者知道「材料里另一个说法指的是同一件事」。
 * - ⚠️ `alias` 那句「状态联动」本模块**不做传播**：`notInBookMarkOf(key, keys)` 只问**这张卡自己的键**
 *   （票 09 留的出口就是这么给的），⛔ 不替人把同义的那张也判成划掉（划掉是人的裁决，机器只是代笔）。
 *
 * ## 被划掉的卡正好是前置时：**保留 ＋ 挂标记**（票 09 §D 的追加一档）
 *
 * 那张卡**留在链上**、只是带一句 `NOT_IN_BOOK_MARK`（出处只有一处：`domain-rules.js`）——⛔ 不剪、
 * ⛔ 不硬传播、⛔ 不提前拦。⚠️ 问的是「键在不在那份件里」这个**史实**（票 09 的 `exclusionKeysOf` 那
 * 把前向兼容尺子），⛔ **不问陈旧**：陈旧那一档是读取侧的软读数，写作面照旧挂标记。
 *
 * ## 合并卡：**N 处原文都要在手**（spec §3：合并是去重、不是断料）
 *
 * 一张带 `locations` 的卡把**全部**位置索引逐条印出来（`locationsText()` 那一个出口），并写明它并掉了
 * 哪几张、⛔ 别只读第一处。⇒ 「读到什么范围、进哪份交办件」的口径是：**范围＝该卡 `locations`（或它
 * 自己的 `anchor` ＋ 键前缀里的材料号）的全部**，**件＝这两个槽那一格**（写作那一份 prompt 里；
 * 盘上不另落一份）。
 *
 * ## 纯函数那一半与读盘那一半分得开（`dispatchValues` 的纪律）
 *
 * {@link knowledgeChainFeed} **一个字节都不碰盘**（同输入同输出、不读时钟、不写随机数）——「读图那一
 * 步在调用方做」这条硬约束靠它兑现；读盘只有 {@link readKnowledgeChainGraph} 这一个**读侧入口**。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）
 *
 * - **章归属与章内序只有一个读数**：`outline.chapters[].points` 的**数组下标**（spec §4 逐字：
 *   「今天唯一现成的章内序读数」），而「哪张卡归第几章」＝**卡名与那一章的 points 项归一化后逐字相等**
 *   （拿的是覆盖闸门同一把尺子 `normalizeKnowledgePointTitle`）⇒ points 写成同义改写／加编号，本模块
 *   看到的是「认不出卡」，它**点名、不猜**（那一条不进链，另记一条读数）。
 * - **位置索引只对「材料号 ＋ 行段」负责**：它**不证明「这条原文到底在哪」**（spec §5 末段逐字），
 *   也不证明「读那几行就够」。
 * - **「第几层」是算法产物的距离**、不是数据里的断言：传递性不保证（`A→B→C` 而数据没有 `A→C` 合法），
 *   所以「第 2 层」不代表数据里该有那一条边，⛔ 也不许拿它当「该补齐哪些边」的清单。
 * - **只判边集里出现过的卡**：一条 `prereq` 边都没连到的卡不进扫面（它没有前置也没有后继，本模块
 *   如实写「没有」，⛔ 不把它说成「图是空的」）。
 * - **`alias` 只印名字、不判「是不是真同一件事」**；`mergedFrom` 里被并卡的 `testable` **不印**（那张卡
 *   今天不作边端，spec §5 第 6 条；它的名字与位置索引印出来，是为了不把人读的那份料剪掉）。
 * - **边表坏了（缺显式 `kind`／`kind` 出域）时退化成「只认显式 `kind: 'prereq'` 的那几条」**并把
 *   `readable:false` 记进读数（形状闸管这一类坏图——见 `knowledge-map-gate.js`）——本模块**不当闸门**。
 */
import { exclusionKeysOf, normalizeKnowledgePointTitle, notInBookMarkOf, productFamilyPath } from '../domain-rules.js'
// 票 `quality-review-2026-10-29/07`：`isPlainObject` 收编进零依赖叶子（本文件原先那一份是全仓
// 逐字抄件之一；判据＝`test-book-shape.mjs` 的「单点 · 对象判据」那一格）。
import { isPlainObject } from '../plain-object.js'
// 闭包／后继只走票 02 的唯一入口（⛔ 本模块不自己写 filter、也不自己走图）。
import { prereqDirectSuccessors, prereqEdges, prereqUpstreams } from './knowledge-graph.js'
// 把握档那一档的名字只有一处声明（`src/knowledge-confidence.js` 的三档表；经 `knowledge-map-gate.js`
// 再导出取词）——⛔ 本模块不另写一个同义字面量，也⛔ 不从**审校那一档的模块**借那个名字（那一面的
// import 闭包被票 13 的判据按**正文提及**钉成「只有拼装器 ＋ 动作层」两个消费者 ⇒ 连提一句文件名
// 都算第三个，别去踩）。
import { PENDING_CONFIDENCE, isDecided } from './knowledge-map-gate.js'
// 章认领／章内序／位置索引三把尺子与跨章审计那一档**共用同一份**（票 11 落的出口；⛔ 别在这里再写一份）。
import { chapterPointIndex, claimOfCard, locationsText } from './cross-audit-ledger.js'
// 那份**人的裁决**的唯一读侧入口（票 09）——本模块⛔ 不自己读／解析那份 JSON。
import { readCoverageCollection } from './knowledge-map-exclusions.js'

/** 图那一份在书里的落点（**从产物清单派生**，⛔ 不手写第二份路径）。 */
export const KNOWLEDGE_MAP_REL = productFamilyPath('知识地图')

/** 闭包与后继**只走这一类**（另两类：`alias` 只印名字、`see-also` 一条都不进）。 */
const PREREQ_KIND = 'prereq'
/** `alias` 那一类（spec §2：同一件事两个名字）——只印、不当方向。 */
const ALIAS_KIND = 'alias'

/** 两个槽的**共同抬头**（两个槽都填同一份知识链；槽名各自照模板，⛔ 不新开槽位）。 */
export const CHAIN_LEAD = `知识链（**机器现算**；只走显式 \`${PREREQ_KIND}\`、把握档不是「${PENDING_CONFIDENCE}」的边）`
  + `｜图＝合并件 \`${KNOWLEDGE_MAP_REL}\` 的 \`cards[]\`／\`edges[]\``

/**
 * 两个槽所在**那一节的标题**（两份模板逐字用它，`DISPATCH_SPECS` 的承重锚也用它——**一处字面量**：
 * 模板改了这里不改，`assembleDispatchPrompt()` 抽锚那一步当场报断线）。
 */
export const CHAIN_SECTION_HEADING = '## 知识链（机器现算）'

/** 一句话说清这一格是**提示不是约束**（两个槽的机填物末尾都带上）。 */
export const CHAIN_TRAILER = '（本格只给**名字与位置索引**：⛔ 不抄原文，要读照索引回材料；⛔ 它是**提示不是约束**——'
  + '`outline` 的 `points` 与章节一个字都不许因此改；哪条前置真讲过由写作者与跨章审计判，本格不替谁下结论。）'

function nonEmptyText(value) {
  return typeof value === 'string' && value.trim() !== ''
}

/**
 * 「方向已定」的 `prereq` 边（票 02／11 的唯一入口 ＋ 去掉把握档最弱那一档）。
 *
 * ⚠️ 那一句**不在这里手写**（票 `depth-round-3/03`）：走词表的 `isDecided()`——与知识点图的门槛
 * 过滤是**同一句**（改名第三档时两侧一起跟）。
 *
 * ⚠️ 坏边表**不抛到派单那一跳**：退化成「只认显式 `kind: 'prereq'` 的那几条」并把 `readable:false`
 * 记进读数（形状闸在交工那一跳已经把坏图拒了；写作面是**读**的那一侧，不该让一次派单炸掉）。
 */
function decidedPrereqEdges(edges) {
  let all = []
  let readable = true
  try {
    all = prereqEdges(edges)
  } catch {
    readable = false
    all = (Array.isArray(edges) ? edges : []).filter((edge) => isPlainObject(edge) && edge.kind === PREREQ_KIND)
  }
  const decided = all.filter((edge) => isDecided(edge.confidence))
  return { decided, readable, scanned: all.length, pending: all.length - decided.length }
}

/** 一张卡的同义伙伴（`alias` 且把握档已定）——**只印名字**，⛔ 不进闭包、⛔ 不传播划掉。 */
function aliasPartnerKeys(edges, key) {
  const out = []
  for (const edge of Array.isArray(edges) ? edges : []) {
    if (!isPlainObject(edge) || edge.kind !== ALIAS_KIND) continue
    if (!isDecided(edge.confidence)) continue
    if (edge.from === key && nonEmptyText(edge.to)) out.push(edge.to)
    else if (edge.to === key && nonEmptyText(edge.from)) out.push(edge.from)
  }
  return out
}

/** 卡名（归一化后）→ 卡：与覆盖闸门同一把尺子（`normalizeKnowledgePointTitle`）；同名只认第一张。 */
function cardsByName(cards) {
  const byName = new Map()
  for (const card of cards) {
    if (!isPlainObject(card) || !nonEmptyText(card.key) || !nonEmptyText(card.name)) continue
    const key = normalizeKnowledgePointTitle(card.name)
    if (key === '' || byName.has(key)) continue
    byName.set(key, card)
  }
  return byName
}

/** 这张卡被哪几章认领那句人话（认不出时说「认不出」，⛔ 不猜一章）。 */
function chapterText(claim) {
  if (claim.chapters.length === 0) return '归哪一章：认不出（这张卡的名字不在任何一章的 `points` 里）'
  return `归第 ${claim.chapters.join('、')} 章`
}

/** 归一化后的名字 → 原样名字（印的是**卡自己写的那个串**，⛔ 不拿归一化串糊人）。 */
function nameOf(card, fallback) {
  return nonEmptyText(card?.name) ? card.name : fallback
}

/**
 * 一条「详给」的行（第 1 层直接前置：名字 ＋ 一句 `testable` ＋ 归第几章 ＋ 位置索引 ＋ 别名 ＋ 标记）。
 *
 * ⚠️ `mergedFrom` 只印**被并卡的名字与位置索引**（那张卡今天不作边端，见文件头窄处）——「N 处原文都
 * 在手」靠 `locationsText()` 把**全部**位置索引逐条印出来兑现。
 */
function level1Row(row) {
  const parts = [`「${row.name}」——${row.testable}`]
  parts.push(chapterText(row.claim))
  if (row.sameChapterIndex !== null) parts.push(`同章内前置：本章 \`points\` 下标 ${row.sameChapterIndex}`)
  parts.push(`位置索引：${row.locations}`)
  if (row.aliases.length > 0) parts.push(`同一件事的另一个名字：${row.aliases.map((name) => `「${name}」`).join('、')}`)
  if (row.mergedNames.length > 0) {
    parts.push(`合并卡：并掉了 ${row.mergedNames.length} 张（${row.mergedNames.map((name) => `「${name}」`).join('、')}）`
      + '——上面那串位置索引就是它的**全部** N 处原文，⛔ 别只读第一处')
  }
  if (row.mark !== '') parts.push(`⚠️ ${row.mark}`)
  return `    - ${parts.join('｜')}`
}

/** 下游那一行里的一个后继（名字 ＋ 归第几章 ＋ 标记）。 */
function successorText(row) {
  const mark = row.mark === '' ? '' : `（⚠️ ${row.mark}）`
  return `「${row.name}」（${chapterText(row.claim)}）${mark}`
}

/** 「只给名字」那一行里的一个名字（带别名的括注与标记；标记括在 `［］` 里，免得与别名那层括号糊在一起）。 */
function nameOnlyText(row) {
  const alias = row.aliases.length === 0 ? '' : `（另名：${row.aliases.map((name) => `「${name}」`).join('、')}）`
  const mark = row.mark === '' ? '' : `［${row.mark}］`
  return `「${row.name}」${alias}${mark}`
}

/** 卡表里那张卡（认不出返回 `null`）。 */
function cardOfKey(cards, key) {
  return cards.find((card) => card.key === key) ?? null
}

/**
 * 本章那一份「知识链」（**纯函数**：同输入同输出，不读盘、不读时钟）。
 *
 * @param {object} input
 * @param {object|null} [input.merged] 合并件（`工作区/knowledge-map.json` 解析出来的那一份；缺传 `null`）
 * @param {unknown[]} [input.chapters] `outline.chapters`（章归属与章内序的唯一读数）
 * @param {number} [input.chapter] 章号（1 起）
 * @param {Iterable<string>|null} [input.excludedKeys] 票 09 那份人产物里 `items[].key` 的集合
 * @returns {{chapter: number|null, text: string, readings: object, notes: string[]}}
 */
export function knowledgeChainFeed(input = {}) {
  const merged = isPlainObject(input.merged) ? input.merged : null
  const chapters = Array.isArray(input.chapters) ? input.chapters : []
  const rawChapter = Number(input.chapter)
  const chapter = Number.isSafeInteger(rawChapter) && rawChapter >= 1 ? rawChapter : null
  const chapterRow = chapter === null ? null : (chapters[chapter - 1] ?? null)
  const points = (Array.isArray(chapterRow?.points) ? chapterRow.points : [])
    .filter((point) => typeof point === 'string' && point.trim() !== '')
  const excludedKeys = input.excludedKeys === null || input.excludedKeys === undefined
    ? new Set()
    : new Set(input.excludedKeys)

  const cards = (Array.isArray(merged?.cards) ? merged.cards : []).filter(isPlainObject)
  const edges = Array.isArray(merged?.edges) ? merged.edges : []
  const graphPresent = cards.length > 0
  const { decided, readable, scanned, pending } = decidedPrereqEdges(edges)
  const chapterIndex = chapterPointIndex(chapters)
  const byName = cardsByName(cards)
  const notes = []
  const readings = {
    graphPresent,
    cards: cards.length,
    prereqEdges: scanned,
    pendingEdges: pending,
    unreadable: !readable,
    chapterCards: 0,
    unresolvedPoints: 0,
    level1: 0,
    deeper: 0,
    successors: 0,
    /** 挂了几**处**标记（同一条被划掉的卡在这两格出现两次就记两处——量的是渲染出来的标记处数）。 */
    markedMentions: 0,
  }

  /** 一张卡在**本章**里的 `points` 下标（同章内前置的排序键；不在本章就是 `null`）。 */
  const sameChapterIndex = (card) => {
    if (chapter === null || card === null) return null
    const row = chapterIndex.find((entry) => entry.n === chapter)
    if (row === undefined || !nonEmptyText(card.name)) return null
    const hit = row.entries.find((entry) => entry.key === normalizeKnowledgePointTitle(card.name))
    return hit === undefined ? null : hit.index
  }

  /** 一条「链上那张卡」的横切读法（第 1 层、第 2 层、后继三处共用；⛔ 不各写一遍）。 */
  const rowOf = (key) => {
    const card = cardOfKey(cards, key)
    return {
      key,
      name: nameOf(card, key),
      testable: nonEmptyText(card?.testable) ? card.testable : '（这张卡没有一句 `testable`——那是形状闸的事）',
      claim: claimOfCard(card ?? { key }, chapterIndex),
      locations: locationsText(card ?? { key }),
      aliases: aliasPartnerKeys(edges, key).map((partner) => nameOf(cardOfKey(cards, partner), partner)),
      mergedNames: (Array.isArray(card?.mergedFrom) ? card.mergedFrom : [])
        .filter(isPlainObject).map((absorbed) => nameOf(absorbed, absorbed?.key ?? '（缺 key）')),
      sameChapterIndex: sameChapterIndex(card),
      mark: notInBookMarkOf(key, excludedKeys),
    }
  }
  /** 卡在 `cards[]` 里的序（第 1 层的次级排序键：同章按 `points` 下标、其余按这张表的原序）。 */
  const cardOrder = (key) => {
    const at = cards.findIndex((card) => card.key === key)
    return at < 0 ? cards.length : at
  }
  /** 同一层里：**同章的排前面**（按 `points` 下标），其余的按 `cards[]` 原序（同输入同输出）。 */
  const sortKeys = (keys) => keys.slice().sort((a, b) => {
    const ai = sameChapterIndex(cardOfKey(cards, a))
    const bi = sameChapterIndex(cardOfKey(cards, b))
    if (ai !== null && bi !== null) return ai - bi
    if (ai !== null) return -1
    if (bi !== null) return 1
    return cardOrder(a) - cardOrder(b)
  })

  const pointRows = []
  const unresolved = []
  for (const [index, point] of points.entries()) {
    const card = byName.get(normalizeKnowledgePointTitle(point)) ?? null
    if (card === null) {
      unresolved.push(point)
      continue
    }
    const up = prereqUpstreams(decided, card.key)
    const down = prereqDirectSuccessors(decided, card.key)
    const level1 = sortKeys(up.layers[0] ?? []).map(rowOf)
    const deeper = (up.layers.slice(1).flat()).map(rowOf)
    const successors = (down.successors ?? []).map(rowOf)
    const ownMark = notInBookMarkOf(card.key, excludedKeys)
    pointRows.push({ point, index, card, ownMark, level1, deeper, successors })
    readings.level1 += level1.length
    readings.deeper += deeper.length
    readings.successors += successors.length
    readings.markedMentions += [...level1, ...deeper, ...successors].filter((row) => row.mark !== '').length
    if (ownMark !== '') readings.markedMentions += 1
  }
  readings.chapterCards = pointRows.length
  readings.unresolvedPoints = unresolved.length

  const lines = [CHAIN_LEAD]
  /** 边表坏掉那一路的如实说明——**每一条返回路径都渲染它**（⛔ 不挂在对象上就完事）。 */
  const noteLines = () => notes.map((note) => `⚠️ ${note}`)
  if (graphPresent && !readable) {
    notes.push(`边表里有边不能进图（缺显式 \`kind\` 或 \`kind\` 出域）——本格退化成「只认显式 \`kind: '${PREREQ_KIND}'\` 的那几条」（形状闸管这一类坏图）`)
  }
  if (chapter === null || chapterRow === null) {
    lines.push(`⚠️ 这一份知识链没有章号（拿到的是 ${String(input.chapter)}）——本格没有可铺的链（机器不替哪一章编一份）。`)
    lines.push(...noteLines())
    lines.push(CHAIN_TRAILER)
    return { chapter, text: lines.join('\n'), readings, notes }
  }
  const chapterLabel = `第 ${chapter} 章《${nonEmptyText(chapterRow.title) ? chapterRow.title : ''}》`
  if (!graphPresent) {
    lines.push(`（这本书今天**看不到知识点图**：\`${KNOWLEDGE_MAP_REL}\` 不在场，或里面没有 \`cards[]\`——`
      + '本格没有可铺的知识链。⚠️ 这不是「一条前置都没有」：机器看不到图，所以它不说这句话。）')
    lines.push(...noteLines())
    lines.push(CHAIN_TRAILER)
    return { chapter, text: lines.join('\n'), readings, notes }
  }
  if (points.length === 0) {
    lines.push(`⚠️ 本章（${chapterLabel}）的 \`points\` 是空的——本格没有可铺的链（哪些知识点该覆盖由覆盖闸门管）。`)
    lines.push(...noteLines())
    lines.push(CHAIN_TRAILER)
    return { chapter, text: lines.join('\n'), readings, notes }
  }
  lines.push(`本章（${chapterLabel}）的 \`points\` 认得出 ${pointRows.length} 张卡`
    + (pointRows.length === 0 ? '' : `：${pointRows.map((row) => `${row.card.key}「${nameOf(row.card, '')}」`).join('、')}`))
  lines.push(`本次扫面读数：\`${PREREQ_KIND}\` 边 ${scanned} 条（其中把握档「${PENDING_CONFIDENCE}」${pending} 条**不算前置**）`
    + `／本格直接前置 ${readings.level1} 条、更远 ${readings.deeper} 条、直接后继 ${readings.successors} 条`
    + `／\`see-also\` 与把握档「${PENDING_CONFIDENCE}」的边一条都不进本格`)
  lines.push(`同一层里，**与本章同章的**前置按本章 \`points\` 数组下标排在前面（0 起）；`
    + '`alias` 只印成「同一件事的另一个名字」（⛔ 不当方向）；这张图上被划掉的卡**留着**、带一句标记（⛔ 不剪、不传播）')
  if (unresolved.length > 0) {
    // ⚠️ 只报**条数**、不回抄那几条 point 的原文：一是它们就在值块「本章知识点清单」那一格里（回抄是重复），
    // 二是这一节的正文会被填进**模板的槽**，而 `fillSlots()` 填完会断「值里不许再带 `{{…}}`」——把
    // 用户写的 point 逐字搬进槽里，等于给「课本里举模板语法当例子」那种合法输入埋一颗哑雷。
    lines.push(`⚠️ 本章 \`points\` 里有 ${unresolved.length} 条在这张图上**认不出对应的卡**（它们不进本格——`
      + '覆盖闸门会按同一把尺子比对这几条；要认哪一条，看值块里「本章知识点清单」那一格）。')
  }
  // 边表坏掉那一路的如实说明（`notes` 是**渲染出来**的，不是只挂在返回对象上）。
  lines.push(...noteLines())
  if (decided.length === 0) {
    lines.push(readable
      ? '（这张图今天一条 `prereq` 边都没有——不是「没算出来」，是它确实没有前置边。）'
      : '（边表读不出来 ⇒ 本格按「只认显式 `kind: \'prereq\'` 的那几条」算：一条都没有。⛔ 别把它读成「这张图确实没有前置边」。）')
  }
  for (const row of pointRows) {
    lines.push(`- 「${nameOf(row.card, row.point)}」（本章 \`points\` 下标 ${row.index}）`
      + (row.ownMark === '' ? '' : `｜⚠️ ${row.ownMark}`)
      + (row.level1.length === 0 && row.deeper.length === 0 && row.successors.length === 0
        ? `：这张卡没有任何直接前置、更远前置与直接后继（⛔ 别读成「图是空的」——别类边不算，本格只走 \`${PREREQ_KIND}\`）。`
        : '：'))
    lines.push('  - 第 1 层（直接前置，**详给**：名字 ＋ 一句 `testable` ＋ 归第几章 ＋ 位置索引）：')
    if (row.level1.length === 0) lines.push('    - （没有直接前置：这张卡没有**已定**的入边——`see-also` 与把握档「待核」不算。）')
    else for (const one of row.level1) lines.push(level1Row(one))
    lines.push(`  - 第 2 层及更远（**只给名字**）：${row.deeper.length === 0 ? '（没有）' : row.deeper.map(nameOnlyText).join('、')}`)
    lines.push(`  - 直接后继（下游，距离 1）：${row.successors.length === 0
      ? '（没有——这张卡在这张图里没有出边）'
      : row.successors.map(successorText).join('、')}`)
  }
  lines.push(CHAIN_TRAILER)
  return { chapter, text: lines.join('\n'), readings, notes }
}

/**
 * **读侧入口**（动作层用）：把这本书的合并件 ＋ 那份人的裁决读成喂给
 * {@link knowledgeChainFeed} 的那两样**当值**传进去的东西。
 *
 * ⚠️ 读盘只住在这里（{@link knowledgeChainFeed} 与 `dispatchValues()` 一个字都不许读盘）。图那一份走
 * 票 09 的**唯一读侧入口** `readCoverageCollection()`（⛔ 本模块不另写一份读盘）；那张被划掉的卡的键走
 * `domain-rules.exclusionKeysOf`（票 09 的出口，⛔ 本模块不自己 `JSON.parse` 那份件）。
 *
 * @param {string} projectId
 * @returns {{merged: unknown, excludedKeys: Set<string>}}
 */
export function readKnowledgeChainGraph(projectId) {
  const collection = readCoverageCollection(projectId)
  // `exclusionKeysOf` 要的是「一份件里有 items」那个形状——`items` 已经是唯一读侧入口读出来（并过了
  // 形状那一道）的那一份。形状坏了 ⇒ 条目为空 ⇒ 一条标记都不挂（与闸门读到的集合同一口径）。
  return {
    merged: collection.merged,
    excludedKeys: exclusionKeysOf({ items: collection.items }),
  }
}
