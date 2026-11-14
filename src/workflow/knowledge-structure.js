/**
 * 「知识结构.md」——**章级切片**的确定性派生件（票 `.scratch/chapter-teaching-handbook/issues/05`；
 * 口径见 `spec.md` §7 票 05）。
 *
 * ## 它是什么
 *
 * 从 `工作区/knowledge-map.json`（合并件）＋ `工作区/outline.md`（章节安排）＋ 那份人的裁决
 * （`工作区/knowledge-map-exclusions.json`）**确定性派生**一份给人读的 `工作区/知识结构.md`：
 * 按 `outline` 的章序与 `points` 顺序，列「本章知识点 → 先修（上游）→ 可考点」。**零 LLM**：
 * 数据全在盘上，让模型再写一遍等于把已经算好的结构重新猜一遍。
 *
 * ## 为什么是「伴生交付件」而不是书的正文
 *
 * 它跟着 `book.md` 一起交付（产物清单那一行 `deliverable: true`），但⛔ **不拼进 `book.md`**：
 * 书的正文边界不变（拼装只认各章正文，见 `book-assembly.js`）。它是给 AI 老师备课时先看的那一层。
 *
 * ## 边界（这一段就是本模块的边界，别在别处另写一句）
 *
 * - **做**：读那三份件 → 按章切片 → 写 `工作区/知识结构.md`（一个纯函数 ＋ 一个读盘写盘入口）。
 * - **不做**：⛔ 不改 `knowledge-map.json` 的结构化字段（只读）；⛔ 不设字数／条数阈值；
 *   ⛔ 不剪人划掉的知识点（保留并挂 `NOT_IN_BOOK_MARK`，与知识链那一节同口径）；
 *   ⛔ 不碰 `book.md` 的拼装；⛔ 不把「哪条先修真讲过」写成判断（只抄图上的边与 `reason`）。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）
 *
 * ① **章归属与章内序只有一个读数**：`outline.chapters[].points` 的数组下标；「哪条知识点归第几章」
 *    走覆盖闸门同一把尺子 `normalizeKnowledgePointTitle`。points 写成同义改写／加编号时本模块
 *    **认不出**它，但会把它落进「未归章」那一节（⛔ 不静默丢）。
 * ② **知识点 ↔ 卡片的连接只认 name↔title 归一化后逐字相等**：图上 cards 与 knowledgePoints 是
 *    两个数组，没有显式外键；对不上时「可考点」写一句「图上没有同名卡」（⛔ 不猜）。
 * ③ **先修只认 `edges[]` 里 `kind: 'prereq'` 的边**；`see-also` 不是方向，⛔ 不进这一份。
 * ④ **跨章先修只详给第 1 层**（那张卡自己的章号）；第 2 层及更远只给章号——与票面口径一致，
 *    ⛔ 不假装那是「必须按顺序讲」的结论。
 */

import { writeFileSync, existsSync, readFileSync } from 'node:fs'

import { MANIFEST_FILE_NAME, NOT_IN_BOOK_MARK, normalizeKnowledgePointTitle, productFamilyPath } from '../domain-rules.js'
import { workFile } from './engine/paths.js'
import { chapterPointIndex } from './cross-audit-ledger.js'
import { readCoverageCollection } from './knowledge-map-exclusions.js'

/** 这一份的书夹相对路径（**从产物清单派生**，⛔ 不手写第二份）。 */
export const KNOWLEDGE_STRUCTURE_REL = productFamilyPath('知识结构')

/** 文件名（`workFile` 的第二参；与上面那份路径同源，从它切出来）。 */
export const KNOWLEDGE_STRUCTURE_NAME = KNOWLEDGE_STRUCTURE_REL.split('/').at(-1)

/** 顶部那句「怎么用」——给 AI 老师看的，一句话。 */
export const KNOWLEDGE_STRUCTURE_LEAD = '> 怎么用这份文件：给 AI 老师备课时**先看结构、再读正文**——'
  + '先按章找到这一章的知识点与先修，再回正文看它们怎么讲。'

function nonEmptyText(value) {
  return typeof value === 'string' && value.trim() !== ''
}

function textOf(value) {
  return nonEmptyText(value) ? value.trim().replace(/\s+/g, ' ') : ''
}

/** `reason` 只取一句摘要（原句可能很长；⛔ 这不是字数阈值，只是排版上的摘要）。 */
function reasonSummary(reason) {
  const text = textOf(reason)
  return text.length > 100 ? `${text.slice(0, 100)}…` : text
}

/** 知识点 title → 知识点（与覆盖闸门同一把尺子）；同名只认第一条。 */
function pointsByName(points) {
  const byName = new Map()
  for (const point of Array.isArray(points) ? points : []) {
    if (typeof point !== 'object' || point === null || Array.isArray(point)) continue
    const key = normalizeKnowledgePointTitle(point.title)
    if (key === '' || byName.has(key)) continue
    byName.set(key, point)
  }
  return byName
}

/** 卡名 → 卡；同名只认第一张（与 `knowledge-graph-chain.js` 同一把尺子）。 */
function cardsByName(cards) {
  const byName = new Map()
  for (const card of Array.isArray(cards) ? cards : []) {
    if (typeof card !== 'object' || card === null || Array.isArray(card)) continue
    const key = normalizeKnowledgePointTitle(card.name)
    if (key === '' || byName.has(key)) continue
    byName.set(key, card)
  }
  return byName
}

/** 显式 `prereq` 边按 `to` 归堆（⛔ `see-also` 不是方向，一条都不进）。 */
function prereqIn(edges) {
  const byTo = new Map()
  for (const edge of Array.isArray(edges) ? edges : []) {
    if (typeof edge !== 'object' || edge === null || Array.isArray(edge)) continue
    if (edge.kind !== 'prereq' || !nonEmptyText(edge.from) || !nonEmptyText(edge.to)) continue
    if (!byTo.has(edge.to)) byTo.set(edge.to, [])
    byTo.get(edge.to).push(edge)
  }
  return byTo
}

/** 知识点那一行的身份串（`title` ＋ `` `id` `` ＋ 难度）；id 缺省时**不编**。 */
function pointIdentity(point, fallbackTitle = '') {
  const title = textOf(point?.title) || fallbackTitle
  const id = textOf(point?.id)
  const difficulty = textOf(point?.difficulty)
  const bits = []
  if (id !== '') bits.push(`\`${id}\``)
  if (difficulty !== '') bits.push(`难度${difficulty}`)
  return bits.length > 0 ? `${title}（${bits.join('，')}）` : title
}

/** 那张卡被哪几章认领（升序章号）；认不出返回空数组。 */
function claimChapters(card, index) {
  const key = nonEmptyText(card?.name) ? normalizeKnowledgePointTitle(card.name) : ''
  if (key === '') return []
  const chapters = []
  for (const chapter of index) {
    if (chapter.entries.some((entry) => entry.key === key)) chapters.push(chapter.n)
  }
  return chapters
}

/**
 * 纯函数：把三份输入渲染成 `知识结构.md` 的全文。
 *
 * @param {{map?: object, chapters?: object[], exclusions?: object[]}} input
 *   `map` 是合并件；`chapters` 是 `outline.chapters`；`exclusions` 是那份人裁决的 `items`
 * @returns {{text: string, readings: {chapters: number, points: number, cards: number, unclaimed: number, missingCard: number}}}
 */
export function renderKnowledgeStructure(input = {}) {
  const map = typeof input.map === 'object' && input.map !== null && !Array.isArray(input.map) ? input.map : {}
  const points = Array.isArray(map.knowledgePoints) ? map.knowledgePoints : []
  const cards = Array.isArray(map.cards) ? map.cards : []
  const edges = Array.isArray(map.edges) ? map.edges : []
  const chapters = Array.isArray(input.chapters) ? input.chapters : []
  const excludedKeys = new Set(
    (Array.isArray(input.exclusions) ? input.exclusions : [])
      .map((item) => (nonEmptyText(item?.key) ? item.key : ''))
      .filter((key) => key !== ''),
  )
  const pointByName = pointsByName(points)
  const cardByName = cardsByName(cards)
  const prereqByTo = prereqIn(edges)
  const chapterIndex = chapterPointIndex(chapters)
  const byCardKey = new Map()
  for (const card of cards) {
    if (typeof card === 'object' && card !== null && nonEmptyText(card.key) && !byCardKey.has(card.key)) byCardKey.set(card.key, card)
  }

  const identityOfPoint = (point, fallbackTitle) => {
    const card = cardByName.get(normalizeKnowledgePointTitle(point?.title ?? fallbackTitle))
    const suffix = nonEmptyText(card?.key) && excludedKeys.has(card.key) ? `（${NOT_IN_BOOK_MARK}）` : ''
    return `${pointIdentity(point, fallbackTitle)}${suffix}`
  }

  /** 一张卡的先修读数：第 1 层详给（名字＋id＋reason＋章号），更远的只给章号。 */
  const prereqLinesOf = (card) => {
    if (card === undefined || !nonEmptyText(card.key)) return { direct: [], deeper: [] }
    const direct = []
    const deeperChapters = new Set()
    const seen = new Set([card.key])
    const queue = []
    for (const edge of prereqByTo.get(card.key) ?? []) queue.push({ key: edge.from, edge, distance: 1 })
    while (queue.length > 0) {
      const current = queue.shift()
      if (!nonEmptyText(current.key) || seen.has(current.key)) continue
      seen.add(current.key)
      const upstream = byCardKey.get(current.key)
      if (upstream === undefined) continue
      const point = pointByName.get(normalizeKnowledgePointTitle(upstream.name))
      const chapterNumbers = claimChapters(upstream, chapterIndex)
      if (current.distance === 1) {
        const id = textOf(point?.id) || (nonEmptyText(upstream.key) ? upstream.key : '')
        const mark = excludedKeys.has(upstream.key) ? `（${NOT_IN_BOOK_MARK}）` : ''
        const head = `${textOf(upstream.name)}${id === '' ? '' : `（\`${id}\`）`}${mark}`
        const reason = reasonSummary(current.edge?.reason)
        const where = chapterNumbers.length > 0 ? `（第 ${chapterNumbers.join('、')} 章）` : '（图上没有章节认领）'
        direct.push(`${head}——${reason === '' ? '（边上没有写 reason）' : reason}${where}`)
      } else {
        for (const n of chapterNumbers) deeperChapters.add(n)
      }
      for (const edge of prereqByTo.get(current.key) ?? []) {
        queue.push({ key: edge.from, edge, distance: current.distance + 1 })
      }
    }
    return { direct, deeper: [...deeperChapters].sort((a, b) => a - b) }
  }

  const lines = ['# 知识结构', '', KNOWLEDGE_STRUCTURE_LEAD, '']
  lines.push(`- 章数：${chapters.length}（按 \`工作区/outline.md\` 的章序）`)
  lines.push(`- 知识点：${points.length}（可考点原文取自 \`工作区/knowledge-map.json\` 的 \`cards[].testable\`）`)
  const readings = { chapters: chapters.length, points: points.length, cards: cards.length, unclaimed: 0, missingCard: 0 }

  const renderBody = (point, card, fallbackTitle) => {
    const key = normalizeKnowledgePointTitle(point?.title ?? fallbackTitle)
    const actualCard = card ?? cardByName.get(key)
    const { direct, deeper } = prereqLinesOf(actualCard)
    lines.push(`  - 先修：${direct.length === 0 ? '（没有直接先修）' : ''}`)
    for (const line of direct) lines.push(`    - ${line}`)
    if (deeper.length > 0) lines.push(`  - 更远的上游（只给章号）：第 ${deeper.join('、')} 章`)
    const testable = textOf(actualCard?.testable)
    lines.push(`  - 可考点：${testable === '' ? '（图上没有同名卡／卡上没有写 testable）' : testable}`)
  }

  // 章序与章内序都照 outline：points 里的 title 归一化后找 knowledgePoints。
  const claimedIds = new Set()
  for (let at = 0; at < chapters.length; at += 1) {
    const chapter = chapters[at]
    const title = textOf(chapter?.title) || '（未命名章节）'
    lines.push('', `## 第 ${at + 1} 章 ${title}`, '')
    const chapterPoints = Array.isArray(chapter?.points) ? chapter.points : []
    if (chapterPoints.length === 0) {
      lines.push('- （本章的 `points` 是空的：`outline.md` 没有声明要覆盖的知识点）')
      continue
    }
    for (const rawPoint of chapterPoints) {
      const key = normalizeKnowledgePointTitle(rawPoint)
      const point = pointByName.get(key)
      const card = cardByName.get(key)
      if (point !== undefined && nonEmptyText(point.id)) claimedIds.add(point.id)
      lines.push(`- 知识点：${point === undefined ? `${textOf(rawPoint)}（图上没有同名知识点）` : identityOfPoint(point, textOf(rawPoint))}`)
      readings.unclaimed += point === undefined ? 1 : 0
      if (card === undefined && point !== undefined) readings.missingCard += 1
      renderBody(point, card, textOf(rawPoint))
    }
  }

  // 没被任何章节认领的知识点也要有落点：它们的 id 至少要出现一次（判据「漏一条即红」）。
  const unassigned = points.filter((point) => !nonEmptyText(point?.id) || !claimedIds.has(point.id))
  if (unassigned.length > 0) {
    lines.push('', '## 未归章的知识点（`outline.md` 的 points 没有认领）', '')
    for (const point of unassigned) {
      lines.push(`- 知识点：${identityOfPoint(point)}`)
      renderBody(point, undefined, '')
    }
  }

  return { text: `${lines.join('\n')}\n`, readings }
}

/**
 * 读盘入口：读合并件 ＋ `outline.chapters` ＋ 那份人裁决，写 `工作区/知识结构.md`。
 *
 * @param {string} projectId
 * @param {{outline?: {chapters?: object[]}}|null} [meta]
 * @returns {{written: boolean, rel: string, chapterCount: number, readings: object|null, reason: string}}
 */
export function writeKnowledgeStructure(projectId, meta = null) {
  // 老书的 `产物清单.json` 是建档那一刻的「应当有什么」，里面**没有这一族**。
  // ⇒ 不能给它们凭空写一份：盘上多出来的件会以「多件」身份把形状对账弄红（见 `book-shape.js`）。
  // 建档时由新的族表写进清单的书才会走到下面这一支。
  const manifestPath = workFile(projectId, MANIFEST_FILE_NAME)
  if (!existsSync(manifestPath)) {
    return { written: false, rel: KNOWLEDGE_STRUCTURE_REL, chapterCount: 0, readings: null, reason: `没有 ${MANIFEST_FILE_NAME}（老书路径）` }
  }
  let declared = false
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    declared = Array.isArray(manifest?.rows) && manifest.rows.some((row) => row?.path === KNOWLEDGE_STRUCTURE_REL)
  } catch {
    declared = false
  }
  if (!declared) {
    return { written: false, rel: KNOWLEDGE_STRUCTURE_REL, chapterCount: 0, readings: null, reason: `${MANIFEST_FILE_NAME} 没有声明这一族（老书不补）` }
  }
  const collection = readCoverageCollection(projectId)
  if (collection.merged === null || !Array.isArray(collection.merged?.knowledgePoints) || collection.merged.knowledgePoints.length === 0) {
    return { written: false, rel: KNOWLEDGE_STRUCTURE_REL, chapterCount: 0, readings: null, reason: '知识地图合并件不在或没有 knowledgePoints' }
  }
  const chapters = Array.isArray(meta?.outline?.chapters) ? meta.outline.chapters : []
  if (chapters.length === 0) {
    return { written: false, rel: KNOWLEDGE_STRUCTURE_REL, chapterCount: 0, readings: null, reason: 'outline 没有章节清单' }
  }
  const { text, readings } = renderKnowledgeStructure({ map: collection.merged, chapters, exclusions: collection.items })
  writeFileSync(workFile(projectId, KNOWLEDGE_STRUCTURE_NAME), text)
  return { written: true, rel: KNOWLEDGE_STRUCTURE_REL, chapterCount: chapters.length, readings, reason: '' }
}
