/**
 * 章末「带读手册」的形状判据（票 `.scratch/chapter-teaching-handbook/issues/03`；
 * 口径见 `spec.md` §2／§3 的 G1′／G2′／G3′）。
 *
 * ## 它判什么／不判什么
 *
 * - **G1′**：本章有 H2 章末教学区，位置与本书 `style-spec` 的「位置：」声明一致；内部第一块是本档形态。
 *   ⛔ 不要求它是章的最末一节（真书末节是「六、跨章回扣」，第 10 章还有「附：术语对照表」）。
 * - **G2′**：blueprint 四个子项在场且按顺序；**human 只判教学区在场且非空**（⛔ 不判散文、不判条数）。
 *   档位没拍定（`route` 缺失）时只查最低公共形态（H2 在 ＋ 有一块带读语），⛔ 不按默认档发错档。
 * - **G3′**：**结构白名单**——本书板块表之外的「短行＋冒号」块头（标题行／加粗行／纯标签行；
 *   整行短加粗标签可无冒号）即红；表格行**只在冒充板块名时**算块头
 *   （2026-11-01 维护者裁决：正文允许表格）；引用行退出形状表。
 *   扫描面是**正文**（教学区之前）：手册的块名只属于手册内部。
 *   拒收文案按形状**分类计数**（表格 N 张／命中 N 行、引用行 N 行、其它块头 N 处），
 *   并给最早一张表的本章行号与最近 H2 板块；⛔ 不再把三类合成一个「N 处」（票 `chapter-handbook-gate/02`）。
 *
 * ⛔ **不判「教得好不好」**：题量、字数只出读数，不设阈值；不判「这段真的在讲这个知识点」。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）
 *
 * ① **位置声明只认 `style-spec` 里那一族「位置：」写法**：`倒数第 N 节`／`末节`／`第 N 节`
 *    （N 认阿拉伯数字与「一二三…十」）。写成散文（「放在跨章回扣之前」）⇒ 位置**不判**，
 *    只判教学区在场（⛔ 不猜、也不误杀）。这一档是**有意**的：判据声称的强度必须等于它实现的强度。
 * ② **板块名白名单只认 `parseDesignBoards`／`parseStyleSpecList` 读得出来的写法**（编号加粗词条、
 *    或声明行）；写成散文/表格的板块名**读不出来** ⇒ 白名单为空 ⇒ G3′ 退回「只认形状表那几档」
 *    （标题行／加粗行／纯标签行），表格行因没有板块名可比而全部放行，
 *    并在读数里如实写 `boards: 0`。⛔ 不回落硬编码板块表。
 * ③ **标题行只认标题长度 ≤ 10 的那一档**：真书的正文小标题（如「### 信息：情报是那条消息本身」）
 *    长度 12+，不当作表单块头；表单式 `### 定义：` 长度 5，当场红。更长的中文块名**判据看不见**。
 * ④ **英文词表只作迁移护栏**：`Definition:`／`Common Misconception`／`Concept Check`／`Exercises`／
 *    `Think Deeper` 命中就红（只在正文；手册内部允许）。中文块名靠形状那一半，不靠词表。
 * ⑤ **围栏只挡形状表，不挡英文块名**：围栏代码块里的「冒号块头」不判（那是示例，不是正文结构）；
 *    `englishBlockNamesIn()` 的英文迁移护栏**不看围栏**（代码块里连分隔行上的 `Definition` 也咬，
 *    与改前同一口径）。围栏里不建表格分组：那里的 `> Definition:` 归「引用行」、
 *    `| Definition |` 归「其它块头」，不计入表格张数。
 * ⑥ **表格行只在「冒充板块名」时算块头**（票 `chapter-handbook-gate/01`，维护者 2026-11-01 裁决
 *    「正文允许表格」）：任一单元格归一化后**等于**某板块名、或**以它开头**才红；普通内容行、
 *    `| --- |` 分隔行、**不写板块名的**纯数据行放行。⚠️ 两条窄处：① **同义改写**（把「例题拆解」
 *    写成「拆一道例题」）抓不到——判据只认归一化后的等于／前缀命中，不认语义；② **英文块名护栏
 *    独立生效**：`| Definition | … |` / `| Exercises | … |` 仍红（迁移护栏不随表格放宽）。
 * ⑦ **引用行退出形状表**（它是内容不是版块）。⚠️ 这是一条**已知的放宽**：`> 例题拆解：…` 这种
 *    不再由 G3′ 兜；英文块名（`> Definition:`）仍由迁移护栏咬住。要兜中文引用块头需另开票。
 * ⑧ **整行短加粗标签（无冒号）只认以 ASCII 字母开头**的 ≤12 字那一档（`**Q1**` 这一类 v1 绕过；
 *    有冒号的走加粗行）。⚠️ 纯中文 `**注意**` 与「中文＋数字」**不在面内**（本票不放宽这一档，
 *    要兜另开票）；更长的整行加粗句也看不见。
 * ⑨ **拒收文案的行号与板块只照正文实况**（票 `chapter-handbook-gate/02`）：行号＝章文行号
 *    （正文是章首到教学区之前的前缀，与文件行号一致）；板块只按**最近的 H2** 反推，
 *    首个 H2 之前如实写「章首（第一个 H2 之前）」，⛔ 不猜第几章／第几节。
 *    「表格 N 张／命中 N 行」只数**有命中行的表**与命中行（普通内容行、`| --- |` 分隔行不进计数）；
 *    表格只认两端带竖线的 `| … |` 紧凑行（GFM 省略首尾竖线的写法不在面内）；「最早一张」＝
 *    最早**有命中行**的表，不是正文第一张表；同一行同时命中形状与英文块名时只算**一处**
 *    （旧实现按命中次数重复计数）；围栏里不建表格分组（`> Definition:` 归「引用行」、
 *    `| Definition |` 归「其它块头」）。
 */

/** 两档的内部形态（**唯一出处**；`engine.js` 把它再导出给动作层与判据）。 */
export const HANDBOOK_FORM_BY_ROUTE = Object.freeze({
  human: Object.freeze({
    label: '带读手册',
    items: Object.freeze([]),
    mode: 'presence',
  }),
  blueprint: Object.freeze({
    label: '带读手册',
    items: Object.freeze(['本章骨架与课堂顺序', '三档题与提示分级', '误区五字段', '图与实物的文字版']),
    mode: 'items',
  }),
})

/** 三条判据的机器名（界面/文案取词用；⛔ 不是 `QUALITY_CHECKS_TAIL_NAMES` 那一份）。 */
export const HANDBOOK_CHECK_NAMES = Object.freeze({
  G1: '章末教学区在场且位置一致',
  G2: '带读手册形态齐全',
  G3: '正文没有板块表外的块头',
})

/** 英文块名迁移护栏（只扫正文；手册内部允许）。 */
const ENGLISH_BLOCK_NAMES = Object.freeze(['Definition', 'Common Misconception', 'Concept Check', 'Exercises', 'Think Deeper'])

const CHINESE_DIGITS = Object.freeze({ 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 })

function nonEmptyText(value) {
  return typeof value === 'string' && value.trim() !== ''
}

/** 中文/阿拉伯数字 → 正整数；认不出返回 null。 */
export function positiveNumber(text) {
  const raw = String(text ?? '').trim()
  if (/^\d+$/.test(raw)) {
    const n = Number(raw)
    return Number.isSafeInteger(n) && n > 0 ? n : null
  }
  if (raw.length === 1 && CHINESE_DIGITS[raw] !== undefined) return CHINESE_DIGITS[raw]
  if (raw === '十一') return 11
  if (raw === '十二') return 12
  if (/^十[一二三四五六七八九]$/.test(raw)) return 10 + CHINESE_DIGITS[raw.slice(1)]
  if (/^[二三四五六七八九]十$/.test(raw)) return CHINESE_DIGITS[raw[0]] * 10
  return null
}

/**
 * 从 `style-spec.md` 的「位置：」那一句读出教学区的期望位置；读不出返回 `null`（＝位置不判）。
 *
 * @param {string} styleSpec
 * @returns {{fromEnd: number}|null} `fromEnd: 1` ＝末节、`2` ＝倒数第二节
 */
export function handbookPositionExpectation(styleSpec) {
  if (!nonEmptyText(styleSpec)) return null
  const lines = styleSpec.split(/\r?\n/)
  const line = lines.find((item) => /位置\s*[:：]/.test(item))
  if (line === undefined) return null
  const fromEnd = /倒数第\s*([一二三四五六七八九十\d]+)\s*节/.exec(line)
  if (fromEnd !== null) {
    const n = positiveNumber(fromEnd[1])
    return n === null ? null : { fromEnd: n }
  }
  if (/末节|最后一节|章的最末/.test(line)) return { fromEnd: 1 }
  const fromStart = /第\s*([一二三四五六七八九十\d]+)\s*节/.exec(line)
  if (fromStart !== null) {
    const n = positiveNumber(fromStart[1])
    return n === null ? null : { fromStart: n }
  }
  return null
}

/** 归一化一个标题（去 markdown 装饰、编号、空格；取首个冒号之前那一截）。 */
export function normalizedHeadingName(title) {
  return String(title ?? '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .trim()
    .replace(/^#{1,6}\s*/, '')
    .replace(/^[一二三四五六七八九十]+[、.．]\s*/, '')
    .replace(/^\d+(?:\.\d+)*[、.．]?\s*/, '')
    .replace(/[：:].*$/, '')
    .replace(/\s+/g, '')
}

/**
 * H2 列表（跳过围栏代码块）。
 *
 * @param {string} text
 * @returns {{title: string, start: number, end: number, body: string}[]} `start`／`end` 是**字符下标**
 */
export function h2Sections(text) {
  const source = typeof text === 'string' ? text : ''
  const lines = source.split(/\r?\n/)
  const offsets = []
  let cursor = 0
  for (const line of lines) {
    offsets.push(cursor)
    cursor += line.length + 1
  }
  const headings = []
  let inFence = false
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const match = /^##\s+(.+?)\s*$/.exec(line)
    if (match !== null) headings.push({ title: match[1], start: offsets[index], lineIndex: index })
  }
  const sections = []
  for (let at = 0; at < headings.length; at += 1) {
    const next = headings[at + 1]
    const end = next === undefined ? source.length : next.start
    sections.push({
      title: headings[at].title,
      start: headings[at].start,
      end,
      body: source.slice(headings[at].start, end),
    })
  }
  return sections
}

/** 那一节是不是章末教学区（标题里出现这三个词之一）。 */
export function isTeachingAreaTitle(title) {
  return /教学区|带读手册|教师手册/.test(String(title ?? ''))
}

function isAppendixTitle(title) {
  return /^附/.test(normalizedHeadingName(title)) || /^附录/.test(normalizedHeadingName(title))
}

/**
 * 本章教学区的实际位置（从后数第几节；附录/术语表不算「节」）。
 *
 * @param {{title: string}[]} sections
 * @param {number} index
 */
export function teachingAreaFromEnd(sections, index) {
  let after = 0
  for (let at = index + 1; at < sections.length; at += 1) {
    if (!isAppendixTitle(sections[at].title)) after += 1
  }
  return after + 1
}

/** 归一化后的名字是否命中本书板块表（等于或以板块名开头）。 */
function isDeclaredBoardName(name, boardNames) {
  if (name === '') return false
  for (const board of boardNames) {
    if (board !== '' && (name === board || name.startsWith(board))) return true
  }
  return false
}

/**
 * 表格行是否用板块名冒充块头：逐个单元格归一化后，等于某板块名或以它开头。
 *
 * ⚠️ 枚举面窄处（文件头第 ⑥ 条）：只认「归一化后等于／前缀命中」；同义改写抓不到；
 * 英文块名护栏在 `englishBlockNamesIn()` 里独立生效。
 *
 * @param {string} text 已 trim 的表格行
 * @param {Set<string>} boardNames 归一化后的本书板块名
 * @returns {boolean}
 */
function tableRowImpersonatesBoard(text, boardNames) {
  if (boardNames.size === 0) return false
  for (const cell of text.replace(/^\|/, '').replace(/\|$/, '').split('|')) {
    if (isDeclaredBoardName(normalizedHeadingName(cell), boardNames)) return true
  }
  return false
}

/**
 * 是不是「正文按钮式块头」的那几行之一（返回命中的形状名或 null）。
 *
 * ⚠️ `boardNames` 缺省是**空集**：不带板块表调用时，表格行一律不算块头（这是有意的窄处）。
 *
 * @param {string} line
 * @param {Set<string>} [boardNames] 归一化后的本书板块名（表格行只有冒充它才算块头）
 */
export function blockHeadShape(line, boardNames = new Set()) {
  const text = String(line ?? '').trim()
  if (text === '') return null
  const boards = boardNames instanceof Set ? boardNames : new Set(boardNames)
  // 表格行：只有**冒充板块名**才算块头；普通内容行、`| --- |` 分隔行、不写板块名的纯数据行都放行
  // （票 `chapter-handbook-gate/01`；维护者 2026-11-01 裁决「正文允许表格」）。
  if (/^\|.*\|$/.test(text)) {
    return tableRowImpersonatesBoard(text, boards) ? '表格行' : null
  }
  // 加粗块头：`**标签：**` / `**标签**：`
  if (/^(?:\*\*|__)\s*[^：:*_\n]{1,18}\s*[：:]\s*(?:\*\*|__)/.test(text)) return '加粗行'
  if (/^(?:\*\*|__)[^：:*_\n]{1,18}(?:\*\*|__)\s*[：:]/.test(text)) return '加粗行'
  // 整行短加粗标签（无冒号）：`**Q1**` 这一类 v1 绕过（文件头第 ⑧ 条）。
  // ⚠️ 只认**以 ASCII 字母开头**的短标签：纯中文 `**注意**` 与「中文＋数字」是有意的窄处，
  // ⛔ 别放宽成「整行加粗就算」。
  const shortBold = /^(?:\*\*|__)([^*_\n]{1,12})(?:\*\*|__)\s*$/.exec(text)
  if (shortBold !== null && /^[A-Za-z][A-Za-z0-9 ._-]*$/.test(shortBold[1])) return '加粗行'
  // 引用行**已退出形状表**（票 `chapter-handbook-gate/01`）：它是内容不是版块。
  // ⚠️ 已知的放宽：`> 例题拆解：…` 不再由 G3′ 兜；要兜中文引用块头需另开票（文件头第 ⑦ 条）。
  // 标题行：只认**带冒号且很短**的那一档（真书正文小标题 11+ 字，不判；`### 定义：` 5 字，判）。
  const heading = /^#{2,6}\s+(.+)$/.exec(text)
  if (heading !== null) {
    if (!/[：:]/.test(heading[1])) return null
    const title = heading[1].replace(/\*\*/g, '').trim()
    return title.length <= 10 ? '标题行' : null
  }
  // 纯标签行：整行只有「短标签 ＋ 冒号」、后面没有正文。
  const label = /^(?:[-*+]\s+|\d+[.、]\s*)?(?:\*\*|__)?[^：:\n]{1,12}(?:\*\*|__)?\s*[：:]\s*$/.exec(text)
  if (label !== null) return '纯标签行'
  return null
}

/** 正文里出现的英文块名（迁移护栏；只扫正文，**不看围栏**——代码块里的英文块名也照咬）。 */
export function englishBlockNamesIn(text) {
  const hits = []
  const lines = String(text ?? '').split(/\r?\n/)
  for (let at = 0; at < lines.length; at += 1) {
    for (const name of ENGLISH_BLOCK_NAMES) {
      if (lines[at].includes(name)) hits.push({ name, line: lines[at].trim(), lineNumber: at + 1 })
    }
  }
  return hits
}

/** 声明的板块名（归一化后非空的集合）。 */
function declaredBoardNames(boards) {
  return new Set((Array.isArray(boards) ? boards : []).map((board) => normalizedHeadingName(board)).filter((name) => name !== ''))
}

/** 首个 H2 之前的正文：反推不出板块名时照实写的降级名（票 `chapter-handbook-gate/02`：别猜）。 */
const BEFORE_FIRST_H2 = '章首（第一个 H2 之前）'

/** `[3, 5, 8]` → `第 3、5、8 行`；超过 limit 行时补「等，共 N 行」。 */
function lineNumbersText(numbers, limit = 5) {
  const shown = numbers.slice(0, limit).join('、')
  return numbers.length > limit ? `第 ${shown} 行等，共 ${numbers.length} 行` : `第 ${shown} 行`
}

/**
 * G3′ 的拒收文案（票 `chapter-handbook-gate/02`）：分类计数 ＋ 行号 ＋ 最早一张要改的表的板块 ＋ 一句改法。
 *
 * ⚠️ 枚举面窄处：
 * ① 「表格 N 张」只数**有命中行**的表，普通内容表不报（票 01 起正文允许表格）；
 *    「最早一张」＝最早**有命中行**的表，不是正文第一张表——干净表不需要改，报它反而误导。
 * ② 「引用行」只数引用里的**英文块名**（中文引用块头已退出形状表，是已知的放宽，见文件头 ⑦）。
 * ③ 板块只按**最近的 H2** 反推；之前没有 H2 ⇒ 照实写 `BEFORE_FIRST_H2`，⛔ 不猜第几章／第几节。
 * ④ 表格只认两端带竖线的 `| … |` 紧凑行（`blockHeadShape()` 的同一形状）；GFM 省略首尾竖线的写法不在面内。
 * ⑤ 围栏里 `table: null`：围栏里的 `> Definition:` 归「引用行」、`| Definition |` 归「其它块头」，
 *    不计入表格张数（围栏不是正文结构，只由迁移护栏咬）。
 * ⑥ 同一行同时命中形状与英文块名时只算**一处**（旧实现按命中次数重复计数）。
 *
 * @param {{shape: string, line: string, lineNumber: number, table: {startLine: number, hitLines: number[], section: string|null}|null}[]} hits
 */
function g3RejectionMessage(hits) {
  const tables = []
  for (const hit of hits) if (hit.table !== null && !tables.includes(hit.table)) tables.push(hit.table)
  const tableHits = hits.filter((hit) => hit.table !== null)
  const isQuote = (hit) => hit.table === null && hit.shape === '英文块名' && /^>/.test(hit.line)
  const quotes = hits.filter(isQuote)
  const others = hits.filter((hit) => !isQuote(hit) && hit.table === null)
  const parts = []
  if (tables.length > 0) {
    const first = tables[0]
    const rest = tables.slice(1)
    const restText = rest.length === 0
      ? ''
      : `；另 ${rest.length} 张在第 ${rest.slice(0, 3).map((group) => group.startLine).join('、')} 行${rest.length > 3 ? '等' : ''}`
    const where = first.section === null ? BEFORE_FIRST_H2 : `「${first.section}」`
    parts.push(`表格 ${tables.length} 张／命中 ${tableHits.length} 行（最早一张要改的表在第 ${first.startLine} 行，`
      + `属${where}，命中${lineNumbersText(first.hitLines)}${restText}）`)
  }
  if (quotes.length > 0) {
    parts.push(`引用行 ${quotes.length} 行（英文块名；${lineNumbersText(quotes.map((hit) => hit.lineNumber))}）`)
  }
  if (others.length > 0) {
    const byShape = new Map()
    for (const hit of others) byShape.set(hit.shape, (byShape.get(hit.shape) ?? 0) + 1)
    const breakdown = [...byShape].map(([shape, count]) => `${shape} ${count} 处`).join('、')
    parts.push(`其它块头 ${others.length} 处（${lineNumbersText(others.map((hit) => hit.lineNumber))}；${breakdown}）`)
  }
  return `正文（教学区之前）出现板块表之外的块头：${parts.join('；')}。`
    + '可以这样改：把这几行改写成完整段落——表格里任何单元格都不要用板块名开头、也不要出现英文块名'
    + '（表头和数据行都一样），加粗／纯标签块头并进句子，正文里的英文块名一律换成中文；板块名只在带读手册内部用。'
}

/**
 * 三条判据的本体（纯函数：同输入同输出，不读盘）。
 *
 * @param {{chapterText?: string, route?: string|null, boards?: string[], position?: {fromEnd?: number, fromStart?: number}|null}} input
 * @returns {{problems: {code: string, name: string, message: string}[], readings: object}}
 */
export function handbookProblems(input = {}) {
  const text = typeof input.chapterText === 'string' ? input.chapterText : ''
  const boards = Array.isArray(input.boards) ? input.boards.filter(nonEmptyText) : []
  const boardNames = declaredBoardNames(boards)
  const route = nonEmptyText(input.route) ? input.route.trim() : null
  const form = route === null ? null : (HANDBOOK_FORM_BY_ROUTE[route] ?? HANDBOOK_FORM_BY_ROUTE.blueprint)
  const sections = h2Sections(text)
  const index = sections.findIndex((section) => isTeachingAreaTitle(section.title))
  const problems = []
  const add = (code, message) => problems.push({ code, name: HANDBOOK_CHECK_NAMES[code], message })
  const readings = { enabled: input.enabled !== false, sections: sections.length, boards: boards.length, route, teachingArea: index, fromEnd: null, handbookChars: 0, bodyChars: 0 }

  // **书有没有采纳手册形态**：这是一条「板块内容级」判据，基线是本书 style-spec 声明的板块表。
  // 没声明（老书／夹具书／还没写 style-spec 的书）⇒ 三条都不判，⛔ 不误杀。
  // ⚠️ 这一档是**有意的窄处**：不能靠删掉 style-spec 的声明来逃——那是本书契约违约（十九项之一）。
  if (readings.enabled === false) return { problems, readings }

  if (index === -1) {
    add('G1', '本章没有 H2 章末教学区——每章都要有（human 档它就是带读手册本身；blueprint 档是它内部的第一块）')
    return { problems, readings }
  }
  const area = sections[index]
  const body = text.slice(0, area.start)
  // 去掉教学区标题那一行，只留内部内容。
  const areaBody = area.body.slice(area.body.indexOf('\n') + 1)
  readings.handbookChars = areaBody.trim().length
  readings.bodyChars = body.length
  readings.fromEnd = teachingAreaFromEnd(sections, index)

  const position = input.position ?? null
  if (position !== null && typeof position === 'object') {
    const actual = position.fromEnd !== undefined ? readings.fromEnd : sectionIndexFromStart(sections, index)
    const expected = position.fromEnd !== undefined ? position.fromEnd : position.fromStart
    if (Number.isSafeInteger(expected) && expected > 0 && actual !== expected) {
      add('G1', `本章章末教学区在第 ${sectionIndexFromStart(sections, index)} 节（从后数第 ${readings.fromEnd} 节），`
        + `与 style-spec 声明的${position.fromEnd !== undefined ? '倒数第' : '第'} ${expected} 节不一致`)
    }
  }

  const contentLines = areaBody.split(/\r?\n/).map((line) => line.trim()).filter((line) => line !== '')
  if (contentLines.length === 0) {
    add('G1', '本章章末教学区是空的——human 档它就是带读手册本身，⛔ 不许留空')
    return { problems, readings }
  }

  if (form !== null && form.mode === 'items') {
    const positions = form.items.map((item) => areaBody.indexOf(item))
    const missing = form.items.filter((item, at) => positions[at] === -1)
    if (missing.length > 0) {
      add('G2', `blueprint 档的带读手册缺子项：${missing.join('、')}（四子项：${form.items.join('／')}）`)
    } else {
      // 「内部第一块是本档形态」：四个子项按声明顺序出现。
      const ordered = positions.every((value, at) => at === 0 || value > positions[at - 1])
      if (!ordered) add('G1', `blueprint 档带读手册的四子项顺序不对（要求按 ${form.items.join(' → ')} 的顺序）`)
    }
  }

  // G3′：结构白名单，只扫正文（教学区之前）。
  //
  // 拒收文案（票 `chapter-handbook-gate/02`）：按形状**分类计数**并带本章行号——
  // 「表格 N 张／命中 N 行」只数命中行（分隔行与放行的普通内容行不进计数），
  // 不再把表格行、引用行与其它块头合成一个「N 处」；行号＝章文里的行号
  // （正文是章首到教学区之前的前缀，与文件行号一致）。
  const hits = []
  let table = null
  let inFence = false
  const bodyLines = body.split(/\r?\n/)
  // 英文块名是迁移护栏，走**同一段**词表扫描（`englishBlockNamesIn()`）：它不看围栏，
  // 所以先把命中的行号收成集合，逐行扫描时只按行号并入（同一行只算一处，⛔ 不重复计数）。
  const englishLines = new Set(englishBlockNamesIn(body).map((hit) => hit.lineNumber))
  // 「最近 H2」用 `h2Sections()` 的**同一份结果**（按字符下标推进），⛔ 不在这里另写一条 `##` 正则。
  let sectionAt = -1
  let lineOffset = 0
  for (let at = 0; at < bodyLines.length; at += 1) {
    const raw = bodyLines[at]
    const lineNumber = at + 1
    const lineStart = lineOffset
    lineOffset += raw.length + 1
    while (sectionAt + 1 < sections.length && sections[sectionAt + 1].start <= lineStart) sectionAt += 1
    const section = sectionAt === -1 ? null : sections[sectionAt].title
    const hasEnglishName = englishLines.has(lineNumber)
    if (/^\s*```/.test(raw)) {
      // 围栏**分隔行本身**也在旧 `englishBlockNamesIn()` 的面里（比如 ```Definition 这种行旧的也咬）；
      // 围栏只挡形状表与表格分组，不挡英文块名。
      if (hasEnglishName) hits.push({ shape: '英文块名', line: raw.trim(), lineNumber, table: null })
      inFence = !inFence
      table = null
      continue
    }
    // 围栏只挡形状表，不挡英文块名（旧 `englishBlockNamesIn()` 的同一口径）。
    if (inFence) {
      if (hasEnglishName) hits.push({ shape: '英文块名', line: raw.trim(), lineNumber, table: null })
      continue
    }
    // 表以**连续表格行**为一张（起点＝表头那一行）：命中行才进计数，但报的是整张表的起点。
    const isTableRow = /^\|.*\|$/.test(raw.trim())
    if (!isTableRow) table = null
    else if (table === null) {
      table = { startLine: lineNumber, section, hitLines: [] }
    }
    const shape = blockHeadShape(raw, boardNames)
    let hitShape = shape
    // 标题行／加粗行／纯标签行若命中的是本书声明的板块名，放行（板块表就是白名单）。
    // ⛔ 表格行**不走**这条白名单：它只在「冒充板块名」时才成为命中，冒充了就不该再放行。
    if (hitShape !== null && hitShape !== '表格行') {
      const name = normalizedHeadingName(raw.replace(/^#{2,6}\s+/, ''))
      if (isDeclaredBoardName(name, boardNames)) hitShape = null
    }
    // 英文块名是迁移护栏，独立于形状白名单。
    if (hitShape === null && hasEnglishName) hitShape = '英文块名'
    if (hitShape === null) continue
    if (table !== null) {
      // 表格里的命中（冒充板块名，或表格里出现英文块名）按**张**归组，行号记进这张表。
      table.hitLines.push(lineNumber)
      hits.push({ shape: hitShape, line: raw.trim(), lineNumber, table })
      continue
    }
    hits.push({ shape: hitShape, line: raw.trim(), lineNumber, table: null })
  }
  if (hits.length > 0) add('G3', g3RejectionMessage(hits))

  return { problems, readings }
}

function sectionIndexFromStart(sections, index) {
  return index + 1
}
