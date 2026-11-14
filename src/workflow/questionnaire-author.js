/**
 * 写卷那一档（`questionnaire-author`）的**值块正文**（票 `reader-questionnaire-ai-authoring/04`）。
 *
 * ## 它是什么，不是什么
 *
 * **是**两件纯活的唯一出处：
 *   1. `questionnaireAuthorTarget()` —— 把合并件（`工作区/knowledge-map.json`）＋ 本轮的取条规则
 *      折成这一档派单要的那一份**机器已选好的条目清单**（逐片逐条，用的是 `selectSliceItems` 那一份；
 *      ⛔ 不在这里另写一套「哪几条卷上会印」的算法——那正是「同一件事两处各算」的病）。
 *      纯函数：不读盘、不写时钟。
 *   2. `questionnaireAuthorValueLines()` —— 值块那几行（书与书夹绝对路径、合并件路径、两个交付路径、
 *      条目清单、三条字数上限、本卷合计 N 条）。派单拼装（`dispatch-assembly.js`）与判据**共用这一段**。
 *
 * **不是**：不是渲染器（把题面印进固定行型是票 `03` 的事）；⛔ 不是形状闸（题面的形状闸住
 * `reader-questionnaire-text.js`，票 `02`）；⛔ 不落盘、不发子代理（那两件归动作层）；⛔ 不判
 * 「问得像不像人话」（人工边界，`docs/测试信任边界.md`）。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）
 *
 * - **条目清单是「这一卷会印的那几条」的投影**，不是全部知识点：`selectSliceItems` 封顶 30 条
 *   （`READER_QUESTIONNAIRE_ITEM_LIMIT`）。真书 143 条全写约六千字，spec 明写「只写卷上要印的那 30 条量级」
 *   ⇒ 这是**有意**窄，不是漏。代价如实写：题面里写了而这一卷没列到的条目，渲染层⛔ 不印（票 `03`）。
 * - **摘要只给 `summary` 那一栏**：`difficulty` 也印（模板第 2 条要用它判「锚点必须给」），
 *   `id`／`source` 一个字都不给——`id` 不是身份（真书 203 条只有 125 个不同 `id`），给了只会让人写错。
 * - **片名／片说明不在这里规整**：它们由 `effectiveReaderSlices` 折过（缺席／坏形状退化成整书一片，
 *   并带一句如实说明）；本模块只把折完那一份原样印给子代理。
 * - 本模块**看不见**的事：AI 是否真按清单写、写得好不好（真机层 `ADR-0005`）。
 */

import {
  READER_QUESTIONNAIRE_ASK_MAX,
  READER_QUESTIONNAIRE_WHY_MAX,
} from './reader-questionnaire-text.js'

/**
 * 这一档要的那一份**机器已选好的条目清单**（纯函数：合并件 ＋ 已选好的片 → 逐片逐条）。
 *
 * ⚠️ **取条那一跳不在这里**：`slices` 必须是**已经过** {@link selectSliceItems} 折过的那一份
 * （与卷上真会印的那几条同一份，由调用方现算——⛔ 本模块不另写一套「哪几条会印」的算法）。
 * 本函数只做一件事：把合并件里那几条的 `summary`／`difficulty` 按 `title` 配上。
 *
 * @param {object|null} merged 合并件（`readMergedMap(...).map` 的返回值；`null` ⇒ 空的片清单）
 * @param {{slices?: unknown[], groups?: unknown[], cardOrder?: string[], limit?: number}} [input]
 *   `slices`＝`effectiveReaderSlices(...).slices`（片名／片说明／成员）；`groups`／`cardOrder` 是
 *   {@link selectSliceItems} 的轮转轴（来自 `readerQuestionnaireOrdering`）；`limit` 缺省＝卷上封顶。
 * @returns {{slice: string, description: string, items: Array<{title: string, summary: string, difficulty: string}>}[]}
 *   逐片：片名（逐字）＋ 片说明（可空串）＋ 该片这一卷会印的那几条（`title` 逐字、`summary` 与
 *   `difficulty` 取自合并件的 `knowledgePoints`；查不到就空串——**空着被点名，不拿别的顶上**）。
 */
export function questionnaireAuthorSlices(merged, input = {}) {
  const points = Array.isArray(merged?.knowledgePoints) ? merged.knowledgePoints : []
  const byTitle = new Map()
  for (const point of points) {
    const title = typeof point?.title === 'string' ? point.title.trim() : ''
    if (title === '') continue
    if (!byTitle.has(title)) {
      byTitle.set(title, {
        summary: typeof point?.summary === 'string' ? point.summary.trim() : '',
        difficulty: typeof point?.difficulty === 'string' ? point.difficulty.trim() : '',
      })
    }
  }
  const list = Array.isArray(input.slices) ? input.slices : []
  return list.map((slice) => {
    const name = typeof slice?.name === 'string' ? slice.name : ''
    const description = typeof slice?.description === 'string' ? slice.description : ''
    const members = Array.isArray(slice?.members) ? slice.members.filter((title) => typeof title === 'string' && title.trim() !== '') : []
    return {
      slice: name,
      description,
      items: members.map((title) => {
        const known = byTitle.get(title)
        return {
          title,
          summary: known === undefined ? '' : known.summary,
          difficulty: known === undefined ? '' : known.difficulty,
        }
      }),
    }
  })
}

/** 值块里的一条条目行（`title`／`summary`／`difficulty` 三段；缺哪段就照实说缺哪段）。 */
function itemLines(item) {
  const summary = item.summary === '' ? '（合并件里没有这条的 summary——照实说读不到，⛔ 别拿书名猜）' : item.summary
  const difficulty = item.difficulty === '' ? '（没写 difficulty）' : item.difficulty
  return [`    - \`${item.title}\`（难度：${difficulty}）${summary}`]
}

/**
 * 值块那几行（**拼装与判据共用**：两处不会各写一套说法）。
 *
 * @param {object} values {@link dispatchValues}('questionnaire-author') 的返回
 * @returns {string[]} 行数组（不含值块标题；由 `dispatch-assembly.js` 拼进整块）
 */
export function questionnaireAuthorValueLines(values) {
  const paths = values?.paths ?? {}
  const author = values?.author ?? { slices: [], total: 0 }
  const total = Number.isSafeInteger(author.total) ? author.total : 0
  const lines = [
    '- 片名与条目 title 必须**逐字**照抄下面的写法（机器按 title 归一化比对，差一个字拒收）',
    `- 合并件（**你唯一的语义来源**；⛔ 不读材料正文）：\`${paths.knowledgeMap ?? '（缺）'}\``,
    `- 你交的两份：\`${paths.questionnaireText ?? '（缺）'}\`（题面 JSON）＋ \`${paths.intent ?? '（缺）'}\`（意图 .md）`,
    `- 题面上限：\`ask\`／\`hint\` 各 ≤ ${READER_QUESTIONNAIRE_ASK_MAX} 字；\`why\` ≤ ${READER_QUESTIONNAIRE_WHY_MAX} 字（超一个字机器拒收，⛔ 不替你截断）`,
    `- 这一份卷合计 ${total} 条（**逐条列在下面**；每片 \`items\` 必须覆盖同片列出的**全部**条目，少一条整片按「没交」处理）：`,
  ]
  if (author.slices.length === 0) {
    lines.push('  - ⚠️ 这一卷一条可问的条目都没有（合并件里没有知识点，或者片是空的）——机器不替它编一份清单：'
      + '先让探查交工把知识点与片交上来，再来派这一路。')
    return lines
  }
  for (const slice of author.slices) {
    const head = slice.description === '' ? `  - 片「${slice.slice}」` : `  - 片「${slice.slice}」（片说明：${slice.description}）`
    lines.push(head, ...slice.items.flatMap(itemLines))
  }
  return lines
}
