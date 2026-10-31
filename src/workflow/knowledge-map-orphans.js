/**
 * 「知识点图里的点没有任何一章认领、也没有一条豁免」这件事的**只读读数**。
 * （票 `.scratch/chapter-skeleton/issues/03-旧书孤儿卡对账.md`；口径见 spec §甲-4 与 §B3。）
 *
 * ## 它做什么／不做什么（本模块的边界就写在这一段，别在别处另写一句）
 *
 * - **做**：对任一本书算出 `{points, claimed, unclaimed, excluded, exclusionsFilePresent}`，
 *   并把这五个数的**自洽**（`unclaimed.length === points - claimed - excluded`）一起交出去；
 *   另给 `liveExclusions`／`staleExclusions`／`outlinePresent`／`problems` 这几条如实读数。
 * - **不做**：⛔ 不改书、⛔ 不写 `knowledge-map-exclusions.json` 替它消警、⛔ 不改覆盖闸
 *   （`outlinePointsCoverage` 一个字不动）、⛔ 不进 `runQualityChecks`、⛔ 不判「这本书合格／不合格」。
 *   它只报**今天盘上是什么状态**；「补豁免还是补章」是维护者的裁决（票面 §Answer 只给建议）。
 *
 * ## 与票 01 的 `readings.isolated` **不是一件事**
 *
 * 票 01 的 `isolated` 讲**排序**（没有 `prereq` 入/出边）；本模块讲**认领**（没有任何一章的
 * `points` 认领，也没有豁免）。一张卡可以「有前置边」却「没被任何章认领」（真书正是这样：5 张
 * 孤儿卡里 3 张在 `prereq` 边上）⇒ ⛔ 两个读数不许合并、不许互相顶替。
 *
 * ## 三个关键口径（都可复算）
 *
 * 1. **点＝`knowledgePoints[]` 的行**（真书 143 行）。⛔ 不拿 `cards[]` 当第二份真值——两者是
 *    图闸 ④ 的双射；读 `cards` 只为**判豁免是否还活着**（`liveExclusionsOf` 的 liveness 输入）。
 * 2. **认领键＝`domain-rules.normalizeKnowledgePointTitle`**（去尾部括注／trim／全半角），与覆盖闸
 *    `outlinePointsCoverage` 同一把尺子。⚠️ 窄处：同一个归一化 title 的多行会被**一起**认领
 *    （与闸门同形）；比较键之外的差异（错别字／语序）一律算未认领。
 * 3. **`excluded` 是「真的离开了判据面」的行数**＝`knowledgePoints.length - effective.length`
 *    （`effective` 由 `effectiveKnowledgePoints` 现算），⛔ 不是「那份件里写了几条」——
 *    陈旧裁决（键没了／title 变了）**不减**任何行，只计入 `staleExclusions`。
 *
 * ## 缺件那一档（判据 4）
 *
 * 没有 `工作区/knowledge-map.json` ⇒ `{reading: null, reason: '…'}`：⛔ 不抛、⛔ 不写半份、
 * ⛔ 不把「没有图」算成「0 张未认领」。`exclusionsFilePresent === false` 时同理：**不许**把
 * 未认领算成 0，也不许把「闸门会红」说成「闸门已红」——本模块只报读数，不判闸门。
 *
 * @module workflow/knowledge-map-orphans
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  KNOWLEDGE_MAP_EXCLUSIONS_FILE_NAME,
  WORK_DIR_NAME,
  effectiveKnowledgePoints,
  liveExclusionsOf,
  normalizeKnowledgePointTitle,
} from '../domain-rules.js'
import { MERGED_MAP_NAME } from './knowledge-graph-build.js'

const OUTLINE_NAME = 'outline.md'

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)
const nonEmptyText = (value) => typeof value === 'string' && value !== ''

/** 读一份 JSON（缺件／读不出／不是 JSON 都翻成一句原因，⛔ 不抛）。 */
function readJsonFile(path) {
  if (!existsSync(path)) return { value: null, present: false, error: null }
  let text
  try {
    text = readFileSync(path, 'utf8')
  } catch (error) {
    return { value: null, present: true, error: `读不出 ${path}：${String(error instanceof Error ? error.message : error)}` }
  }
  try {
    return { value: JSON.parse(text), present: true, error: null }
  } catch {
    return { value: null, present: true, error: `${path} 不是严格 JSON` }
  }
}

/** 章节数组（只认 `{points: []}` 形状；缺 outline 就是「一章都没认领」，不是错误）。 */
function chaptersOf(outline) {
  const rows = Array.isArray(outline?.chapters) ? outline.chapters : []
  return rows.map((chapter) => ({ points: Array.isArray(chapter?.points) ? chapter.points : [] }))
}

/**
 * 纯函数本体：**只吃数据、不读盘**。
 *
 * @param {{
 *   knowledgePoints?: unknown[],
 *   cards?: unknown[],
 *   chapters?: Array<{points?: unknown[]}>,
 *   exclusionItems?: unknown[],
 *   exclusionsFilePresent?: boolean,
 * }} input
 * @returns {{
 *   points: number, claimed: number, unclaimed: string[], excluded: number,
 *   exclusionsFilePresent: boolean, cards: number, chapters: number,
 *   liveExclusions: number, staleExclusions: number,
 * }}
 */
export function orphanPointsReadingOf(input = {}) {
  const points = Array.isArray(input.knowledgePoints) ? input.knowledgePoints : []
  const cards = Array.isArray(input.cards) ? input.cards : []
  const chapters = Array.isArray(input.chapters) ? input.chapters : []
  const exclusionItems = Array.isArray(input.exclusionItems) ? input.exclusionItems : []
  const { live, stale } = liveExclusionsOf(exclusionItems, cards)
  const effective = effectiveKnowledgePoints(points, live)
  const excluded = points.length - effective.length

  const pointKeys = new Set()
  for (const point of points) {
    const key = normalizeKnowledgePointTitle(point?.title)
    if (key !== '') pointKeys.add(key)
  }
  const claimedKeys = new Set()
  for (const chapter of chapters) {
    for (const raw of chapter.points) {
      const key = normalizeKnowledgePointTitle(raw)
      if (key !== '' && pointKeys.has(key)) claimedKeys.add(key)
    }
  }

  let claimed = 0
  const unclaimed = []
  for (const point of effective) {
    const key = normalizeKnowledgePointTitle(point?.title)
    if (key !== '' && claimedKeys.has(key)) claimed += 1
    else unclaimed.push(typeof point?.title === 'string' ? point.title : '')
  }

  // 自洽：每一行要么「被认领」、要么「未认领」，要么「被豁免减掉」。
  // ⚠️ 等式两侧由**不同的输入**算出（effective 的行数 vs 逐行认领判定），不是同一句的定义式；
  //    判据在 test/test-orphan-points-reading.mjs 里逐格断，本函数只如实返回这几个数。
  return {
    points: points.length,
    claimed,
    unclaimed,
    excluded,
    exclusionsFilePresent: input.exclusionsFilePresent === true,
    cards: cards.length,
    chapters: chapters.length,
    liveExclusions: live.length,
    staleExclusions: stale.length,
  }
}

/**
 * 读一本书的落盘事实（**只读**）。`bookDir` 是书夹根目录的绝对路径。
 *
 * @param {string} bookDir
 * @returns {{
 *   reading: object|null,
 *   reason: string|null,
 *   bookDir: string,
 *   paths: {map: string, outline: string, exclusions: string},
 *   problems: string[],
 * }}
 */
export function readOrphanPointsReading(bookDir) {
  const paths = {
    map: join(bookDir, WORK_DIR_NAME, MERGED_MAP_NAME),
    outline: join(bookDir, WORK_DIR_NAME, OUTLINE_NAME),
    exclusions: join(bookDir, WORK_DIR_NAME, KNOWLEDGE_MAP_EXCLUSIONS_FILE_NAME),
  }
  const problems = []
  const merged = readJsonFile(paths.map)
  if (merged.present === false) {
    return { reading: null, reason: `${WORK_DIR_NAME}/${MERGED_MAP_NAME} 不在：这本书没有知识点图，算不出未认领`, bookDir, paths, problems }
  }
  if (merged.error !== null) {
    return { reading: null, reason: merged.error, bookDir, paths, problems }
  }
  if (!isPlainObject(merged.value)) {
    return { reading: null, reason: `${WORK_DIR_NAME}/${MERGED_MAP_NAME} 的顶层不是对象`, bookDir, paths, problems }
  }

  const outline = readJsonFile(paths.outline)
  if (outline.error !== null) problems.push(outline.error)
  if (outline.present === false) problems.push(`${WORK_DIR_NAME}/${OUTLINE_NAME} 不在：这本书还没有章节骨架，全部知识点都算未认领`)

  const exclusions = readJsonFile(paths.exclusions)
  if (exclusions.error !== null) problems.push(exclusions.error)
  const exclusionItems = Array.isArray(exclusions.value?.items) ? exclusions.value.items : []
  if (exclusions.present && !Array.isArray(exclusions.value?.items)) {
    problems.push(`${WORK_DIR_NAME}/${KNOWLEDGE_MAP_EXCLUSIONS_FILE_NAME} 的 items 不是数组（按「一条豁免都没有」报，但这条读数是坏的）`)
  }

  const reading = orphanPointsReadingOf({
    knowledgePoints: merged.value.knowledgePoints,
    cards: merged.value.cards,
    chapters: chaptersOf(outline.value),
    exclusionItems,
    exclusionsFilePresent: exclusions.present,
  })
  return { reading, reason: null, bookDir, paths, problems }
}
