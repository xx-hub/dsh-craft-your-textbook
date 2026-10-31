/**
 * 最后检查驳回意见的**逐条交代**契约（票 `walkthrough-fixes/37`）。
 *
 * ## 它接住了什么病
 *
 * 用户在最后检查结果卡上点「不满意」时写的那句意见原先**整段**落 `meta.finalRedoNote`、整段注入
 * 交办说明；主笔重新交工只被要求交一份 `report` —— 用户一次点名的四件事里做了几件、漏了哪几件，
 * **账本与界面两边都读不出来**（真机读数：4 件事里 3 件一字未改、也未说明）。
 *
 * ## 这一份管哪两段判据
 *
 * ① **拆条落账**（动作 `final-redo-items`，驳回那一刻由主笔调用）：`redoItems` 是意见原文被拆成的
 *   若干段，每一段都必须是 `finalRedoNote` 的**连续子串**——机器因此能验「这一段是真的抄回来的」，
 *   而不是主笔改写／编出来的一条。顺序要与原文一致，同一段不许拆两次。
 * ② **逐条交代**（`stage-submit(final)` 的 `redoCheck`）：与落账那份条目集**逐条对齐**，漏一条就拒收
 *   并点名漏的是哪一条。
 *
 * ## ⚠️ 判据强度（＝实现强度，`docs/测试信任边界.md` 总纲）
 *
 * 机器只断「**有没有逐条交代**」：条目齐不齐、编号对不对、`status` 在不在 `FINAL_REDO_STATUSES` 里、
 * `not-done` 有没有写一句原因。它**断不了**「`done` 是不是真办了」——那不是它的活，也不许在这
 * 里加一条包含式弱校验冒充（`docs/adr/0005` §「这条没改什么」第 2 条）。「办得对不对」是维护者
 * 的手感题，界面只把 AI 的**自述**逐条摊开给人看（`src/ui/event-cards.js` 的终检认可卡）。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里
 *
 * - 「哪些段落算一条意见」是**主笔的拆分判断**，不是机器的：机器只保证每一段**逐字出自原文**，
 *   断不了「它把三件事拆成了一条」——后者归人看拆条那一屏（账本里的 `finalRedoItems` 与认可卡）。
 * - `redoItems` 的顺序判据只按 `indexOf` 的**首次出现位置**比先后；一段原文在意见里重复出现时，
 *   机器认不出「引用的是第二处」，只按第一次出现算。
 * - 本模块**不读盘、不落账**：调它的是动作族（`actions/gates.js`／`actions/chapters.js`），
 *   账本与 meta 的写入点各只有一处。
 */
import { FINAL_REDO_STATUSES } from '../domain-rules.js'

/** 一条去向里那句补充说明的上限（与 `CHAPTER_SIDE_REASON_MAX` 同档的人读句子长度）。 */
export const FINAL_REDO_NOTE_MAX = 200
/** 一条去向里「办在哪」那一句的上限。 */
export const FINAL_REDO_WHERE_MAX = 200

/** 把一段可能很长的原文裁成一句可点名的引用（只用于错误文案与账本行）。 */
export function clipQuote(text, max = 40) {
  const value = typeof text === 'string' ? text : ''
  return value.length <= max ? value : `${value.slice(0, max)}…`
}

function blank(value) {
  return typeof value !== 'string' || value.trim() === ''
}

/**
 * 拆条校验：合法返回 `null`，不合法返回一句**点名哪一条、为什么**的话。
 *
 * @param {string} note 用户那句驳回意见（`meta.finalRedoNote` 原文）
 * @param {unknown} raw 主笔交上来的 `redoItems`（字符串数组）
 * @returns {string|null}
 */
export function finalRedoItemsProblem(note, raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return 'redoItems 需要数组：把用户那句意见拆成若干段，每段是意见原文里的连续一段（一条意见一段）'
  }
  const text = typeof note === 'string' ? note : ''
  const seen = new Map()
  let lastPos = -1
  let lastIndex = 0
  for (let i = 0; i < raw.length; i += 1) {
    const quote = raw[i]
    if (blank(quote)) {
      return `redoItems 第 ${i + 1} 条不是一段非空的原文——每条都照意见原文抄一段`
    }
    const pos = text.indexOf(quote)
    if (pos < 0) {
      return `redoItems 第 ${i + 1} 条「${clipQuote(quote)}」不是用户那句意见里的连续一段——照原句逐字抄一段，别改写、别编`
    }
    if (seen.has(quote)) {
      return `redoItems 第 ${i + 1} 条与第 ${seen.get(quote)} 条是同一段原文（一条意见只拆一次）`
    }
    if (pos < lastPos) {
      return `redoItems 要按意见原文的先后顺序排：第 ${i + 1} 条「${clipQuote(quote)}」在原文里出现在第 ${lastIndex} 条之前`
    }
    seen.set(quote, i + 1)
    lastPos = pos
    lastIndex = i + 1
  }
  return null
}

/**
 * 把合法的 `redoItems` 归一成落账形状：`[{index, quote}]`（`index` 从 1 起，由机器给）。
 *
 * ⚠️ 调用前必须先用 {@link finalRedoItemsProblem} 验过；本函数不重复那段判据（一处判据一处实现）。
 *
 * @param {string[]} raw
 * @returns {Array<{index: number, quote: string}>}
 */
export function normalizeFinalRedoItems(raw) {
  return raw.map((quote, offset) => ({ index: offset + 1, quote }))
}

/**
 * 逐条交代校验：合法返回 `null`，不合法返回一句点名的话。
 *
 * 判据只有「**对齐**」这一层（`docs/adr/0005` §「这条没改什么」第 2 条）：
 * 落账的每条都要有一条去向、`item` 只能是落账的编号、同一条不许交代两次、`status` 在枚举里、
 * `not-done` 要写一句原因（「没办」本身也是交代，但一句原因才让用户知道为什么）。
 *
 * @param {Array<{index: number, quote: string}>} items 落账的条目集
 * @param {unknown} raw 交工带上来的 `redoCheck`
 * @returns {string|null}
 */
export function finalRedoCheckProblem(items, raw) {
  const list = Array.isArray(items) ? items : []
  if (!Array.isArray(raw)) {
    return `这一轮是照用户的驳回意见改的：交工要带 redoCheck:[{item, status, note?, where?}]，对落账的 ${list.length} 条逐条交代去向（done／not-done／superseded）`
  }
  const byItem = new Map()
  for (let i = 0; i < raw.length; i += 1) {
    const entry = raw[i] ?? {}
    const item = entry.item
    if (!Number.isSafeInteger(item) || item < 1 || item > list.length) {
      return `redoCheck 第 ${i + 1} 条的 item 不在落账的条目里（只能是 1–${list.length}）：先把意见拆成条目（final-redo-items），再按那里的编号交代`
    }
    if (byItem.has(item)) {
      return `redoCheck 第 ${i + 1} 条与第 ${byItem.get(item)} 条交代的是同一条（item=${item}）`
    }
    byItem.set(item, i + 1)
    if (!FINAL_REDO_STATUSES.includes(entry.status)) {
      return `redoCheck 的 status 只能是 done / not-done / superseded（第 ${i + 1} 条写的是 ${JSON.stringify(entry.status)}）`
    }
    if (entry.status === 'not-done' && blank(entry.note)) {
      return `redoCheck 第 ${i + 1} 条（第 ${item} 条「${clipQuote(list[item - 1]?.quote)}」）是 not-done，要写一句 note 说明为什么没办`
    }
  }
  const missing = list.filter((item) => !byItem.has(item.index))
  if (missing.length > 0) {
    return `这些驳回意见条目没有交代：${missing.map((item) => `第 ${item.index} 条「${clipQuote(item.quote)}」`).join('、')}——每一条都要在 redoCheck 里给出 done／not-done／superseded`
  }
  return null
}

/**
 * 把「落账条目集 ＋ 交上来的去向」合并成落账／上屏共用的形状：
 * `[{index, quote, status, note, where}]`（按条目编号排）。
 *
 * ⚠️ 调用前必须先用 {@link finalRedoCheckProblem} 验过。`note`／`where` 只裁长度，不改判据。
 *
 * @param {Array<{index: number, quote: string}>} items
 * @param {Array<{item: number, status: string, note?: string, where?: string}>} raw
 */
export function mergeFinalRedoCheck(items, raw) {
  const byItem = new Map((Array.isArray(raw) ? raw : []).map((entry) => [entry.item, entry]))
  return (Array.isArray(items) ? items : []).map((item) => {
    const entry = byItem.get(item.index) ?? {}
    const note = typeof entry.note === 'string' ? entry.note.trim().slice(0, FINAL_REDO_NOTE_MAX) : ''
    const where = typeof entry.where === 'string' ? entry.where.trim().slice(0, FINAL_REDO_WHERE_MAX) : ''
    return { index: item.index, quote: item.quote, status: entry.status, note, where }
  })
}

/** 去向的人话（账本行与错误文案共用一份，别处不许再写第二份翻译表）。 */
export const FINAL_REDO_STATUS_HUMAN = Object.freeze({
  done: '已办',
  'not-done': '没办',
  superseded: '不适用了',
})

/**
 * 一条账本行：把整份去向逐条写出来（`textbook/hint` 的 `text`，人读的《过程记录.md》与播报都读它）。
 * 结构化的那一份同时写进事件的 `data.finalRedoCheck`（机器读），这一份给人读。
 *
 * @param {Array<{index: number, quote: string, status: string, note?: string, where?: string}>} check
 */
export function finalRedoCheckText(check) {
  const rows = (Array.isArray(check) ? check : []).map((row) => {
    const status = FINAL_REDO_STATUS_HUMAN[row.status] ?? row.status
    const note = row.note === '' || row.note === undefined ? '' : `：${row.note}`
    const where = row.where === '' || row.where === undefined ? '' : `（${row.where}）`
    return `第 ${row.index} 条「${clipQuote(row.quote)}」→ ${status}${where}${note}`
  })
  return `🧾 你上一轮的意见逐条去向：${rows.join('；')}`
}
