/**
 * 跨章审计的**逐边清单**（票 `.scratch/knowledge-graph-build/issues/11`；口径来源
 * `.scratch/knowledge-graph-step/spec.md` §4「跨章审计那一格」＋ §5 第 7 条那条硬闸）。
 *
 * ## 它做什么／不做什么（这一段就是本模块的边界，别在别处另写一句）
 *
 * - **做**：吃一份**合并件**（`工作区/knowledge-map.json` 解析出来的对象）＋ `outline` 的章节
 *   （`chapters[].points` 是「这条被哪一章认领」与「章内序」的唯一读数）＋ 可选的一份**人的裁决产物**
 *   （被划掉的卡，票 09 那份），把**全量** `prereq` 边**逐条**列成一行：两端卡名 ／ 两端各被哪一章
 *   认领 ／ 章序关系（跨章给章序，同章给章内序） ／ 两端位置索引。**章序倒置的排最前并显式标出。**
 * - **不做**：**不产判断**（「前章真的讲过没有」是审计小助手的判断，本模块只把账摆全）、
 *   **不读时钟、不写随机数**（`crossAuditEdgeLedger()` 是纯函数，见下）、⛔ 不判「是不是只出现名字」。
 *
 * ## 为什么清单是**全量**的（票面逐字：不是「只列看着可疑的那几条」）
 *
 * 「只列可疑的」＝把「真的讲过没有」退回散文判断：谁可疑由机器挑，等于机器替审计下了半张结论。
 * 所以这里一条不挑：**跨章 ＋ 章内都装**，条数可对账（`N = 跨章 X ＋ 章内 Y`）。
 *
 * ## 纯函数那一半与读盘那一半分得开（`dispatchValues` 的纪律）
 *
 * `crossAuditEdgeLedger()`／`crossAuditLedgerText()`／`ledgerCountsClause()`／`parseLedgerCounts()`
 * **一个字节都不碰盘**——「读图那一步在调用方做、清单当值传进来」这条硬约束靠它们兑现
 * （`dispatchValues()` 只收算好的清单）。落盘的只有 {@link readCrossAuditEdgeLedger} 这一个
 * **读侧入口**：调用方（动作层）用它把清单读出来，再**当值**交给派发与验货两边。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）
 *
 * · **章序的读数只有一个来源**：`outline.chapters[].points` 的**数组下标**（spec §4 逐字：
 *   「今天唯一现成的章内序读数」）。⇒ 一条边若两端落在**同一章**，本模块能给的只有「谁在 points
 *   数组里靠前」——它**不证明**正文里谁先讲（正文的先后机器看不见）。
 * · **「被哪一章认领」＝卡名与那一章的 points 项**归一化后**逐字相等**（拿的是覆盖闸门同一把
 *   归一化尺子 `normalizeKnowledgePointTitle`）。⇒ points 写成别的说法（同义改写、加编号）在这里
 *   就是「认不出」，本模块**不猜**：两端里只要有一端认不出章，就按**跨章**归类（保守：宁可把它
 *   算进要逐条核的那一堆），并在那一行写明「认不出章序」。
 * · **一张卡被多章认领时按「最早那一章」定章序**（`chapters[]` 里第一处认领）。⇒ 「同一张卡既在第
 *   1 章又在第 5 章的 points 里」这种收窄写法下，本模块看到的是第 1 章那一处。
 * · **只认 `prereq`**：`alias`／`see-also` 不主张方向，不进清单（spec §5 末段那条有意收窄同款）。
 * · **位置索引只对「材料号 ＋ 行段」负责**（`cards[].locations` 或 `anchor` ＋ key 前缀的材料号）——
 *   它**不证明「这条原文到底在哪」**（spec §5 末段逐字）。
 * · **被划掉的卡只影响那一句人话**（票 `exclusion-flow/04`，F4）：命中
 *   `工作区/knowledge-map-exclusions.json` 的 `items[].key` 时，**没人认领**照旧报
 *   「未被任何章认领（人已划掉）」，**有章认领**报「第 N 章认领（人已划掉）」——两个事实
 *   （认领／人已划掉）同时说出，⛔ 不把认领那句吞掉（`claimOfCard` 的另一个读者面还要认章）。
 *   没被划掉的两档**逐字不变**。本模块**不剪边、不硬传播、不提前拦**（spec §9：那是「如实报」的
 *   对象，不是要修的问题）；那份文件不在场时**什么都不做**（票 09 的产物，读侧前向兼容）。
 */
import { existsSync, readFileSync } from 'node:fs'

import {
  KNOWLEDGE_MAP_EXCLUSIONS_REL,
  exclusionKeysOf,
  normalizeKnowledgePointTitle,
} from '../domain-rules.js'
import { bookRelOnDisk } from './engine/paths.js'
// 票 `quality-review-2026-10-29/07`：`isPlainObject` 收编进零依赖叶子（本文件原先那一份是全仓
// 逐字抄件之一；判据＝`test-book-shape.mjs` 的「单点 · 对象判据」那一格）。
import { isPlainObject } from '../plain-object.js'
import { materialNumbersOfCard } from './knowledge-map-merge.js'
import { readBookGraphInputs } from './knowledge-graph-build.js'

/** 清单只装这一种边（`alias`／`see-also` 不主张方向）。 */
export const LEDGER_EDGE_KIND = 'prereq'

/**
 * 票 09 那份**人的裁决产物**（⛔ 本模块不创建它、不写它：不在场就什么都不做）。
 *
 * ⚠️ 路径**不在本模块另拼一份**（收口 review 的 S2）：它就是 `domain-rules.js` 的
 * `KNOWLEDGE_MAP_EXCLUSIONS_REL`（票 09 的落点），这里只是换个名字再给本模块的读者用。
 * 此前这里自己拼 `${WORK_DIR_NAME}/knowledge-map-exclusions.json`——与 `domain-rules.js`
 * 那一份逐字等价，两处各写各的就会各漂各的（单点出处的纪律）。
 */
export const CROSS_AUDIT_EXCLUSIONS_REL = KNOWLEDGE_MAP_EXCLUSIONS_REL

/** 卡没被任何章认领时的那句话（spec §4／§9 逐字）。 */
export const UNCLAIMED_TEXT = '未被任何章认领'

/** 那一句话在**人已划掉**时的形态（票 09 §D：如实报，⛔ 不剪、不硬传播、不提前拦）。 */
export const UNCLAIMED_DROPPED_TEXT = `${UNCLAIMED_TEXT}（人已划掉）`

/**
 * **有章认领**、**人已划掉**那一档（票 `exclusion-flow/04`，F4／决策 5）：两个事实**同时**说出。
 *
 * ⚠️ 为什么是独立常量、⛔ 不与 {@link UNCLAIMED_DROPPED_TEXT} 共用：两句说的是**不同的交集**
 * （没人认领 vs 有人认领），共用一个模板会让将来改一句时静默改掉另一句。⇒ 这五个字在本文件里
 * **有意出现两次**（上面那句的插值 ＋ 这里），⛔ 别为了「去重」把两句并成一个模板。
 * `test-cross-audit-ledger.mjs` 的 T4 四档那一格把两条边界都钉住：「被划掉且有认领」必须含它，
 * 「没被划掉且有认领」⛔ 不许出现它。
 */
const CLAIMED_DROPPED_SUFFIX = '（人已划掉）'

/**
 * 逐边清单那一行的**可解析形状**（条数对账那一把尺子）。
 *
 * ⚠️ 它量的**是报告的写法**（spec §5 末段那条窄处）：写对了这一串不代表审计真读了原文。
 * 生成侧是 {@link ledgerCountsClause}——**同一处**定义，不许在别处另写一份措辞
 * （改了措辞而没改这里，对账会当场判红，不会静默放行）。
 */
const LEDGER_COUNTS_RE = /逐边清单\s*(\d+)\s*条全核\s*[（(]\s*跨章\s*(\d+)\s*[／/]\s*章内\s*(\d+)\s*[）)]\s*[，,]\s*(?:无倒置|(\d+)\s*条章序倒置)\s*[、，,]\s*无「只出现名字」/u

function nonEmptyText(value) {
  return typeof value === 'string' && value.trim() !== ''
}

/**
 * `outline.chapters[].points` 归一化之后的那张表（章号 → 逐项 `{key, index}`）。
 *
 * ⚠️ **出口是给两个读者面共用的**（写作面 `knowledge-graph-chain.js` 的「归第几章／同章内前置按
 * `points` 下标排」与跨章审计那一档）——章归属与章内序**只有这一把尺子**，⛔ 别在别处再写一份。
 */
export function chapterPointIndex(chapters) {
  const rows = Array.isArray(chapters) ? chapters : []
  return rows.map((chapter, at) => {
    const points = Array.isArray(chapter?.points) ? chapter.points : []
    const entries = []
    points.forEach((point, index) => {
      if (typeof point !== 'string') return
      const key = normalizeKnowledgePointTitle(point)
      if (key === '') return
      entries.push({ key, index })
    })
    return { n: at + 1, title: nonEmptyText(chapter?.title) ? chapter.title : '', entries }
  })
}

/**
 * 一张卡被哪几章认领（升序章号）＋它在**最早那一章**里的 `points` 下标。
 *
 * ⚠️ 与 {@link chapterPointIndex} 同一把尺子、同样**两个读者面共用**（写作面那一格也读它）。
 */
export function claimOfCard(card, chapterIndex) {
  const key = nonEmptyText(card?.name) ? normalizeKnowledgePointTitle(card.name) : ''
  if (key === '') return { chapters: [], firstIndex: null }
  const chapters = []
  let firstIndex = null
  for (const chapter of chapterIndex) {
    const hit = chapter.entries.find((entry) => entry.key === key)
    if (hit === undefined) continue
    chapters.push(chapter.n)
    if (firstIndex === null) firstIndex = hit.index
  }
  return { chapters, firstIndex }
}

/** 某一张卡在**指定那一章**里的 `points` 下标（章内序；认不出返回 `null`）。 */
function pointIndexOf(card, chapter, chapterIndex) {
  const key = nonEmptyText(card?.name) ? normalizeKnowledgePointTitle(card.name) : ''
  if (key === '') return null
  const row = chapterIndex.find((entry) => entry.n === chapter)
  const hit = row?.entries.find((entry) => entry.key === key)
  return hit === undefined ? null : hit.index
}

/**
 * 两端各被哪一章认领那句人话（三支：没人认领的两档按票 09 那份裁决产物决定用哪一句，
 * **有人认领**那一档再多问一句「人已划掉」——F4 补的就是这第三支）。
 *
 * ⚠️ 第三支**不吞掉认领事实**：同一张卡的两件事实（被哪几章认领／人已划掉）在写作面
 * （`knowledge-graph-chain.js`）也是分开读的，把「第 N 章」从这一格里去掉会让审计这一面
 * 说的和写作面那一面不是同一件事（spec 决策 5 第一条约束）。
 */
function claimText(claim, key, excludedKeys) {
  if (claim.chapters.length === 0) {
    return excludedKeys.has(key) ? UNCLAIMED_DROPPED_TEXT : UNCLAIMED_TEXT
  }
  const claimed = `第 ${claim.chapters.join('、')} 章认领`
  // ⛔ 不与 `UNCLAIMED_DROPPED_TEXT` 共用模板：两句说的是不同的交集（见上面那个常量的注释）。
  return excludedKeys.has(key) ? `${claimed}${CLAIMED_DROPPED_SUFFIX}` : claimed
}

/**
 * 一张卡的位置索引（`cards[].locations` 优先；没有就退回分片侧的 `anchor` ＋ key 前缀的材料号）。
 *
 * ⚠️ 窄处：只印「哪份材料的哪一段」——**不证明「这条原文到底在哪」**（文件头那条）。
 * 未合并的卡只有 `anchor`（那份锚不带材料号），材料号从 `M<材料号>-` 前缀取
 * （`materialNumbersOfCard()` 是唯一出处）。
 *
 * ⚠️ **两个读者面共用**（写作面那一格印的是同一串）：合并卡把 `locations` 的**全部**位置索引逐条印
 * 出来（spec §3：N 处原文都要在手，⛔ 不是只给第一处）。
 */
export function locationsText(card) {
  const locations = Array.isArray(card?.locations) ? card.locations : null
  if (locations !== null && locations.length > 0) {
    const parts = locations.map((row) => (isPlainObject(row) && Number.isSafeInteger(row.material) && Number.isSafeInteger(row.start) && Number.isSafeInteger(row.end)
      ? `资料${row.material} 第${row.start}–${row.end} 行`
      : '（这一项位置索引不成形状）'))
    return parts.join('；')
  }
  const anchors = Array.isArray(card?.anchor) ? card.anchor : []
  if (anchors.length === 0) return '（没有位置索引）'
  const spans = anchors.map((row) => (isPlainObject(row) && Number.isSafeInteger(row.start) && Number.isSafeInteger(row.end)
    ? `${row.start}–${row.end}`
    : '（不成形状）')).join('、')
  const materials = materialNumbersOfCard(card)
  return materials.length === 0 ? `第${spans} 行（材料号认不出）` : `资料${materials.join('、')} 第${spans} 行`
}

/**
 * 章序关系（spec §4 的第三样）＋它算不算**倒置**。
 *
 * 口径（判定表见文件头那一段）：
 * · 两端有**共同**的认领章 ⇒ 「章内」：给那一章里的 `points` 数组下标（谁靠前）。
 * · 没有共同章（含任一端认不出章） ⇒ 「跨章」：给**最早认领章**之间的章序；
 *   前置那条被认领的章序**晚于**依赖它的那条 ⇒ `inverted = true`（正是「倒着依赖」那件事）。
 */
function orderOf({ fromClaim, toClaim, from, to, chapterIndex }) {
  const shared = fromClaim.chapters.filter((n) => toClaim.chapters.includes(n))
  if (shared.length > 0) {
    const chapter = shared[0]
    const fromAt = pointIndexOf(from, chapter, chapterIndex)
    const toAt = pointIndexOf(to, chapter, chapterIndex)
    const reversed = fromAt !== null && toAt !== null && fromAt > toAt
    const order = `同章（第 ${chapter} 章），章内序 ${fromAt ?? '？'} → ${toAt ?? '？'}（points 数组下标，0 起）`
      + (reversed ? '（章内序倒序：points 里前置那条排在后头，请一并核）' : '')
    return {
      group: '章内',
      order,
      inverted: false,
      // ⚠️ 章内序倒序**不算倒置**：spec §4 的「无倒置」指**章序**倒置（章与章之间）——
      // 这一档只如实印出来（上面那句提示），机器不把它计进倒置条数。
      withinOutOfOrder: reversed,
    }
  }
  if (fromClaim.chapters.length === 0 || toClaim.chapters.length === 0) {
    const unknown = []
    if (fromClaim.chapters.length === 0) unknown.push(`「${from?.name ?? ''}」`)
    if (toClaim.chapters.length === 0) unknown.push(`「${to?.name ?? ''}」`)
    return { group: '跨章', order: `认不出章序（${unknown.join('、')}未被任何章认领）`, inverted: false, withinOutOfOrder: false }
  }
  const cf = Math.min(...fromClaim.chapters)
  const ct = Math.min(...toClaim.chapters)
  const inverted = cf > ct
  return {
    group: '跨章',
    order: `第 ${cf} 章 → 第 ${ct} 章${inverted ? '（倒置：前置那条被认领的章序晚于依赖它的那条）' : ''}`,
    inverted,
    withinOutOfOrder: false,
  }
}

/**
 * 那张清单本体（**纯函数**：同输入同输出，不读盘、不读时钟）。
 *
 * @param {{merged?: unknown, chapters?: unknown, excludedKeys?: Iterable<string>|null, exclusionsPresent?: boolean}} input
 *   `merged` ＝ 合并件对象（`工作区/knowledge-map.json` 解析出来的那一份；缺／坏传 `null`）；
 *   `chapters` ＝ `outline.chapters`（章序与章内序的唯一读数）；
 *   `excludedKeys` ＝ 票 09 那份人产物里 `items[].key` 的集合（不在场传空集）；
 *   `exclusionsPresent` ＝ 那份件在不在场（只影响一句提示，⛔ 不影响任何判定）
 * @returns {{rows: object[], counts: object, text: string, notes: string[]}}
 */
export function crossAuditEdgeLedger({ merged = null, chapters = [], excludedKeys = null, exclusionsPresent = false } = {}) {
  const excluded = excludedKeys === null || excludedKeys === undefined ? new Set() : new Set(excludedKeys)
  const notes = []
  const cards = Array.isArray(merged?.cards) ? merged.cards.filter(isPlainObject) : []
  const edges = Array.isArray(merged?.edges) ? merged.edges : []
  if (!isPlainObject(merged)) {
    notes.push('合并件不在盘上（或不是 JSON 对象）——清单按「一条都没有」算')
  } else if (!Object.hasOwn(merged, 'cards') && !Object.hasOwn(merged, 'edges')) {
    notes.push('这份合并件里没有图键（老书那一档）——机器看不到任何 `prereq` 边')
  }
  if (!exclusionsPresent) {
    notes.push(`人的裁决产物 \`${CROSS_AUDIT_EXCLUSIONS_REL}\` 不在场——没被任何章认领的卡照旧只报「${UNCLAIMED_TEXT}」`)
  }
  const chapterIndex = chapterPointIndex(chapters)
  const byKey = new Map(cards.map((card) => [card.key, card]))

  const rows = []
  edges.forEach((edge, index) => {
    if (!isPlainObject(edge) || edge.kind !== LEDGER_EDGE_KIND) return
    const from = byKey.get(edge.from) ?? { key: edge.from, name: '' }
    const to = byKey.get(edge.to) ?? { key: edge.to, name: '' }
    const fromClaim = claimOfCard(from, chapterIndex)
    const toClaim = claimOfCard(to, chapterIndex)
    const order = orderOf({ fromClaim, toClaim, from, to, chapterIndex })
    rows.push({
      edgeIndex: index,
      from: { key: edge.from, name: from.name, chapters: fromClaim.chapters, claim: claimText(fromClaim, edge.from, excluded), locations: locationsText(from) },
      to: { key: edge.to, name: to.name, chapters: toClaim.chapters, claim: claimText(toClaim, edge.to, excluded), locations: locationsText(to) },
      confidence: nonEmptyText(edge.confidence) ? edge.confidence : '',
      group: order.group,
      order: order.order,
      inverted: order.inverted,
      withinOutOfOrder: order.withinOutOfOrder,
    })
  })

  const within = rows.filter((row) => row.group === '章内').length
  const counts = {
    total: rows.length,
    across: rows.length - within,
    within,
    inverted: rows.filter((row) => row.inverted).length,
    withinOutOfOrder: rows.filter((row) => row.withinOutOfOrder).length,
  }
  // 倒置的排最前（票面逐字），组内保持边表的原序（同输入同输出）。
  const ordered = [...rows.filter((row) => row.inverted), ...rows.filter((row) => !row.inverted)]
  const ledger = { rows: ordered, counts, notes }
  ledger.text = crossAuditLedgerText(ledger)
  return ledger
}

/** 一行清单（四样都在这：两端卡名／两端各被哪一章认领／章序关系／两端位置索引）。 */
function rowText(row) {
  const marker = row.inverted ? '⚠️ 章序倒置 · ' : ''
  return `- ${marker}[${row.group}]「${row.from.name}」（${row.from.claim}）→「${row.to.name}」（${row.to.claim}）`
    + `｜章序：${row.order}｜位置索引：${row.from.locations} → ${row.to.locations}`
}

/**
 * 清单全文（进派发模板的 `{{逐边清单}}` 那一格）。
 *
 * ⚠️ 措辞里**不许**出现 {@link ledgerCountsClause} 的那一串：条数对账认的是「报告里那一行」，
 * 清单抬头长得像它就会让「对账」变成「抄自己」。
 */
export function crossAuditLedgerText(ledger) {
  const counts = ledger?.counts ?? { total: 0, across: 0, within: 0, inverted: 0 }
  const head = `本次逐边清单（**机器现算**；只列 \`${LEDGER_EDGE_KIND}\` 边，**跨章 ＋ 章内都在**）：`
    + `共 ${counts.total} 条（跨章 ${counts.across}／章内 ${counts.within}），其中章序倒置 ${counts.inverted} 条（排在最前）。`
  const notes = (ledger?.notes ?? []).map((note) => `> ⚠️ ${note}`)
  if (counts.total === 0) {
    return [head, ...notes, '', '（一条都没有：这不是「清单没算出来」，是这张图里今天确实没有 `prereq` 边。）'].filter((line) => line !== undefined).join('\n')
  }
  return [head, '每行四样：两端卡名 ／ 两端各被哪一章认领 ／ 章序关系 ／ 两端位置索引。', ...notes, '',
    ...(ledger?.rows ?? []).map(rowText)].join('\n')
}

/**
 * 条数那一句（**唯一的措辞出处**：派发面给 AI 照抄的那一行 ＋ 验货面对账的那一把尺子，
 * 两边都从这里长出来）。调用方在它前面接上 `已核，未见——`（那一句的家在 `cross-audit.js`）。
 */
export function ledgerCountsClause(counts) {
  const total = Number.isSafeInteger(counts?.total) ? counts.total : 0
  const across = Number.isSafeInteger(counts?.across) ? counts.across : 0
  const within = Number.isSafeInteger(counts?.within) ? counts.within : 0
  const inverted = Number.isSafeInteger(counts?.inverted) ? counts.inverted : 0
  const tail = inverted === 0 ? '无倒置' : `${inverted} 条章序倒置`
  return `逐边清单 ${total} 条全核（跨章 ${across}／章内 ${within}），${tail}、无「只出现名字」`
}

/**
 * 从一行文本里解析条数那一句；不是那一句就返回 `null`。
 *
 * @param {string} line
 * @returns {{total: number, across: number, within: number, inverted: number}|null}
 */
export function parseLedgerCounts(line) {
  const match = LEDGER_COUNTS_RE.exec(String(line ?? ''))
  if (match === null) return null
  return {
    total: Number(match[1]),
    across: Number(match[2]),
    within: Number(match[3]),
    // 那一句写「无倒置」时没有可捕获的条数 ⇒ 0（组 4 只在「K 条章序倒置」那一支存在）。
    inverted: match[4] === undefined ? 0 : Number(match[4]),
  }
}

/**
 * 票 09 那份人产物里 `items[].key` 的集合（**纯函数**：吃解析好的对象，不读盘）。
 *
 * ⚠️ 函数体**不住在本模块**（收口 review 的 S2）：口径的唯一出处是 `./domain-rules.js` 的
 * `exclusionKeysOf`（票 09 的 `## Answer` 逐字写的就是「与审计面同一口径：`domain-rules.exclusionKeysOf(document)`」）。
 * 这里此前自己复制了一份逐字等价的实现 ⇒ 已删，改成从 `../domain-rules.js` 取、原样再导出给
 * 本模块的既有读者（`test-cross-audit-ledger.mjs` 与 `knowledge-graph-chain.js` 都从这一处拿它）。
 * 那边自己写着：**读侧前向兼容**——坏形状／键认不出 ⇒ 空集。
 *
 * @param {unknown} document `{ items: [{ key, title, reason, by, at }] }`
 * @returns {Set<string>}
 */
export { exclusionKeysOf }

/**
 * **读侧入口**（动作层用）：把这本书的合件、`outline` 与那份人产物读成一份清单。
 *
 * ⚠️ 读盘只住在这里（`dispatchValues()` 一个字都不许读盘）：调用方拿它算出来的那份清单
 * **当值**交给派发与验货两边。
 *
 * @param {string} projectId
 * @param {object|null} [meta] 已经在手上的 `project.json`（省一次读；不传就现读）
 * @returns {{rows: object[], counts: object, text: string, notes: string[]}}
 */
export function readCrossAuditEdgeLedger(projectId, meta = null) {
  const inputs = readBookGraphInputs(projectId)
  const readMeta = isPlainObject(meta) ? meta : inputs.meta
  const chapters = Array.isArray(readMeta?.outline?.chapters) ? readMeta.outline.chapters : []
  let excluded = new Set()
  let exclusionsPresent = false
  // ⚠️ 这一段**有意**不走票 09 那个唯一读侧入口
  //    （`knowledge-map-exclusions.js` 的 `readCoverageCollection`；收口 review 的 S2 点名要核这一处）。
  //    两条理由都当场核过：
  //    ① 它顺带把**整份合并件**再读一遍（`readBookGraphInputs`），而本函数手上已经有一份
  //       （上面那次 `readBookGraphInputs`，且允许调用方把 `meta` 当值传进来省一次读）；
  //    ② 它给的是**已经判过陈旧**的 `live` 那一档，而这一句人话要的是**原样的 keys**
  //       （`exclusionKeysOf` 的读侧前向兼容口径：不问陈旧）——换过去会改这句话的语气。
  //    ⇒ 依赖**不是**障碍（`knowledge-map-exclusions.js` 到本模块无回路，实测过 import 图），
  //      不换是上面这两条；两条口径（路径常量 ＋ 键解析）都已单点取自 `../domain-rules.js`。
  const exclusionsPath = bookRelOnDisk(projectId, CROSS_AUDIT_EXCLUSIONS_REL)
  if (exclusionsPath !== null && existsSync(exclusionsPath)) {
    exclusionsPresent = true
    try {
      excluded = exclusionKeysOf(JSON.parse(readFileSync(exclusionsPath, 'utf8')))
    } catch {
      // 坏形状不在这里报（那是票 09 的闸的活）：读侧前向兼容只承诺「在场就用」。
      excluded = new Set()
    }
  }
  return crossAuditEdgeLedger({ merged: inputs.merged, chapters, excludedKeys: excluded, exclusionsPresent })
}
