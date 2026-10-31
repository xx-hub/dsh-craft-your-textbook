/**
 * 成品（`工作区/book.md`）的**机器拼装** —— 机器是成品的唯一写者
 * （票 `.scratch/walkthrough-fixes/issues/36`，2026-10-06 裁决「修法 1 ＋ 修法 2」）。
 *
 * ## 病与它治的方式（这一段就是本模块的边界，别在别处另写一句）
 *
 * 原先 `工作区/book.md` 的**唯一写点**是 `stage-submit merge` 那一支（`actions/chapters.js`），
 * 而到了最后检查阶段，机器只重拼 `工作区/chapter-NN.md`（`chapter-assemble`）——**没有任何一处会重拼成品**。
 * 于是「AI 改完章 → 成品跟上」只能靠**手抄**：真机上漂了 3 章 9 处，而 `runQualityChecks` 的检查
 * 一条都验不出来（第 10 项还逐字声称「合并时机器拼的，这里再验一遍」）。
 *
 * 两条修法都落在这里（同一份拼装口径，两处共用，⛔ 不做第二份）：
 * 1. {@link composeBook} 是**纯函数**：合并那一跳与「最后检查阶段改章之后重拼成品」都调它；
 * 2. {@link judgeBookAssembly} 是判据：盘上那份 `book.md` 必须**逐字等于**各章正文的拼装件
 *    （`runQualityChecks` 里那一格，交工与放行那一刻的重算都会咬住它）。
 *
 * ## 为什么「逐字相同就一个字节都不写」是承重的一格
 *
 * 与 `chapter-assembly.js` 头部那一段**同一条纪律**（票 22 的新鲜度闸门读的是 mtime）：机器在
 * `chapter-assemble` 之后无条件重写成品，会把 `book.md` 的 mtime 推后——今天没有任何判据读它，
 * 但「同输入同输出 ＋ 逐字比对后再决定写不写」这条纪律本身是 `chapter-assembly.js` 已经付过学费的
 * 那一格，这里照抄，⛔ 不因为「今天没人读」就放松。
 *
 * ## 守住的不变量（⛔ 不许为了「看起来一致」重算它们）
 *
 * 成品的 loader 段（`human` 路线那两行 `<!-- loader:begin/end -->` 与那句指令）、章间 `---` 分隔线、
 * `# 第N章 <标题>` 这一行**都是拼装契约的一部分**（原样搬自 `chapters.js` 的 `case 'merge'`）：
 * 本模块只把这段逻辑搬进一个纯函数，字符串拼接顺序一个字节都没动。判据那一侧也**不重算**它们
 * ——它比的是「盘上那份」与「同一个纯函数现在拼出来的那份」，不是另写一份相似的量法。
 *
 * ## 适用面（判据在什么条件下存在）
 *
 * 「成品＝拼装件」这条判据**只对机器合并过的书**成立（`mergeSubmitRecorded`，由调用方判）：
 * 没有合并交工记录的 `book.md` 可能是回退残留（`runPhase5` 裁决 A），那时机器还没拼过它，
 * 重拼等于绕过合并闸门（跨章审计、全章过目）。调用方（`engine.js` 的 `runQualityChecks` 与
 * `refreshBookAfterChapterAssemble`）负责这一条；本模块自己只认盘上的事实。
 *
 * ## 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）
 *
 * ① 章正文只读 `工作区/chapter-NN.md`（名字由 `domain-rules.chapterName` 给，章数由 `meta.outline`
 *    给）。大纲里没有的章文件、以及名字写错的（`chapter-1.md`）都**看不见**——它们既不会被拼进
 *    成品，也不会被本模块点名。
 * ② 成品里那些**不是拼装件产生的**内容（AI 直接往 `book.md` 里加的东西）只能以「与拼装件不一致」
 *    的形式被看见；判据**说不出**它是从哪来的（那不是本模块的输入）。
 * ③ 判据点名的是**章号**（第几章那一段不同），不是具体行号/字符偏移。
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { chapterName, excludedTitlesInText } from '../domain-rules.js'
import { workDir } from './engine/paths.js'

// ── 章标题身份（合并剥章标题与终检判重共用同一份定义；原先住 `engine.js`）──────────────

/** 行首「第N章」（数字或中文数字都收）。章标题行与普通小节标题的分界。 */
export const CHAPTER_HEADING_RE = /^第\s*[0-9一二三四五六七八九十百零两]+\s*章/

/**
 * 标题归一化：**只留文字与数字**（剥掉 emoji、符号、标点、空白）。
 * ⚠️ 旧口径只删 8 个标点（`[\s，。、,.·：:]`），emoji 原样留在串里——
 * 「🚧 常见误区」按 6 个字符算，混过了「≥6 字才参与判重」那道闸，于是每章都有的
 * 板块名被判成「重复标题」拦交付（三本真书实测 27 / 12 / 1 处，见 ADR-0008 修订 2026-09-30）。
 */
export function headingKey(text) {
	return String(text).replace(/[^\p{L}\p{N}]/gu, '')
}

/**
 * 剥掉章正文自带的章标题行——合并时机器已经拼了一个 `# 第N章 <大纲标题>`，
 * 正文里那一行留着，成品里同一个章标题就出现两次，终检「无重复标题」会把
 * **「第X章」判成重复标题、拦交付**（这正是用户报的那条）。
 * ⚠️ 旧实现 `body.replace(/^#\s+.*$/m, '')` 只认单 `#`：AI 把章标题写成 `##` 时剥不掉。
 * 判据：文件里**第一个**标题行，且它长得像章标题（行首「第N章」，或与本章大纲标题同串）；
 * 第一个标题不是章标题就当它是真的小节标题，一个字不动。
 */
export function stripChapterTitleHeading(body, outlineTitle) {
	const text = String(body)
	const want = headingKey(outlineTitle)
	for (const match of text.matchAll(/^(#{1,6})[ \t]+(.*)$/gm)) {
		const title = match[2].trim()
		if (title === '') continue
		const bare = headingKey(title.replace(CHAPTER_HEADING_RE, ''))
		const isChapterish = CHAPTER_HEADING_RE.test(title) || (want !== '' && bare === want)
		if (!isChapterish) return text
		return text.slice(0, match.index) + text.slice(match.index + match[0].length)
	}
	return text
}

// ── 拼装口径（生产落盘与判据核对走同一段：两处不会各写一套说法）──────────────────

/** `human` 路线成品顶部的 loader 装配指令（原样搬自 `chapters.js` 的 `case 'merge'`，一个字没动）。 */
const LOADER_LINES = [
	'<!-- loader:begin -->',
	'给 AI 老师的 loader 指令：正文 prose 是素材库，用自己的话重组教学；章末教学区照问题链走。',
	'<!-- loader:end -->',
]

/** 分章之间的分隔线（拼装契约的一部分：判据**不重算**它，只比整段字节）。 */
const CHAPTER_SEPARATOR = '---'

/**
 * 各章正文 → **应该是那样**的成品（`工作区/book.md`）。
 *
 * 这是合并那一跳与「改章后重拼成品」共用的**唯一实现**：同输入同输出、不读时钟、不写随机数。
 *
 * @param {{name?: string, preface?: string, route?: string|null, chapters?: ReadonlyArray<{title?: string, text?: string}>}} book
 *   `chapters` 按章号升序；`text` 是 `工作区/chapter-NN.md` 的**全文**（读不出来就给空串，与合并那一跳同口径）。
 * @returns {string}
 */
export function composeBook(book) {
	const source = book ?? {}
	const chapters = Array.isArray(source.chapters) ? source.chapters : []
	const parts = [`# ${source.name ?? ''}`, '', source.preface ?? '', '']
	for (let index = 0; index < chapters.length; index += 1) {
		const title = chapters[index]?.title ?? ''
		const body = String(chapters[index]?.text ?? '').trim()
		const heading = `# 第${index + 1}章 ${title}`
		// 章节正文若自带章标题则去掉，避免与机器拼的章标题重复（见 stripChapterTitleHeading）。
		const stripped = stripChapterTitleHeading(body, title).trim()
		parts.push('', CHAPTER_SEPARATOR, '', heading, '', stripped)
	}
	// human 路线：成品顶部给 AI 老师留 loader 装配指令（正文 prose 当素材库用），保留在成品里。
	if (source.route === 'human') parts.splice(1, 0, '', ...LOADER_LINES)
	return parts.join('\n')
}

/**
 * 盘上那本书的**拼装输入**（`preface.md` ＋ 每章 `chapter-NN.md` 的全文）。
 *
 * ⚠️ 章数与章号从 `meta.outline` 读（与合并那一跳同一份来源）；读不出来的章给空串
 * ——「少了一章」由 `runQualityChecks` 的「成品文件齐全」那一格点名，不在这里判。
 *
 * @param {string} projectId
 * @param {{name?: string, route?: string|null, outline?: {chapters?: ReadonlyArray<{title?: string}>}}} meta
 * @returns {{name: string, route: string|null, preface: string, chapters: Array<{title: string, text: string}>}}
 */
export function readBookInputs(projectId, meta) {
	const dir = workDir(projectId)
	const readIfExists = (name) => {
		const path = join(dir, name)
		return existsSync(path) ? readFileSync(path, 'utf8') : ''
	}
	const chapters = meta?.outline?.chapters ?? []
	return {
		name: meta?.name ?? '',
		route: meta?.route ?? null,
		preface: readIfExists('preface.md'),
		chapters: chapters.map((chapter, index) => ({
			title: chapter?.title ?? '',
			text: readIfExists(chapterName(index + 1)),
		})),
	}
}

/** 盘上那本书**现在应该长成**的成品全文（{@link composeBook} ＋ {@link readBookInputs}）。 */
export function expectedBook(projectId, meta) {
	return composeBook(readBookInputs(projectId, meta))
}

// ── 判据（那把尺子）──────────────────────────────────────────────────────────

/**
 * 把一份成品按**机器拼的章标题**切段（`# 第N章 …` 那一行是段首）。
 *
 * ⚠️ 枚举面窄处：只认 `CHAPTER_HEADING_RE` 认得的行首标题（`#{1,3}`）；散文式的章界
 * （「第 3 章开始了」这类）看不见——那也正是成品拼装件的形状契约本身。
 *
 * @returns {Array<{n: number|null, text: string}>}
 */
function splitChapterBlocks(text) {
	const blocks = []
	let current = null
	let ordinal = 0
	for (const line of String(text).split('\n')) {
		const heading = line.match(/^(#{1,3})[ \t]+(.*)$/)
		if (heading !== null && CHAPTER_HEADING_RE.test(heading[2].trim())) {
			ordinal += 1
			// ⚠️ 章标题行**算进这一段的字节**：只比「标题之后」的话，`# 第2章 <标题>` 被换掉就看不见
			// （整份 `existing === want` 仍会报红，但那样就点不出是第几章了）。
			current = { n: ordinal, text: `${line}\n` }
			blocks.push(current)
			continue
		}
		if (current !== null) current.text += `${line}\n`
	}
	return blocks
}

/** 第一处章标题行**之前**的字节（书名 ＋ 前言 ＋ loader 段）；没有章标题时就是全文。 */
function headerOf(text) {
	const full = String(text)
	let offset = 0
	for (const line of full.split('\n')) {
		const heading = line.match(/^(#{1,3})[ \t]+(.*)$/)
		if (heading !== null && CHAPTER_HEADING_RE.test(heading[2].trim())) return full.slice(0, offset)
		offset += line.length + 1
	}
	return full
}

/**
 * 成品与拼装件**不一致在哪**：逐章点号 ＋ 顶部（书名/前言/loader 段）有没有变。
 *
 * @param {string} existing 盘上那份 `book.md`
 * @param {string} want 同一个纯函数现在拼出来的那份
 * @returns {{chapters: number[], header: boolean}}
 */
export function bookMismatch(existing, want) {
	const got = String(existing)
	const expected = String(want)
	if (got === expected) return { chapters: [], header: false }
	const gotBlocks = splitChapterBlocks(got)
	const wantBlocks = splitChapterBlocks(expected)
	const chapters = []
	const count = Math.max(gotBlocks.length, wantBlocks.length)
	for (let index = 0; index < count; index += 1) {
		if ((gotBlocks[index]?.text ?? null) !== (wantBlocks[index]?.text ?? null)) chapters.push(index + 1)
	}
	// 章界之前那一段（书名 ＋ 前言 ＋ loader 段）也要比：章都对齐时不一致只剩这一种可能。
	const header = headerOf(got) !== headerOf(expected)
	return { chapters, header }
}

/**
 * 盘上那份成品**是不是这几章正文的拼装件**（返回问题清单的原材料，空章号 ＋ 头不差＝站得住）。
 *
 * ⚠️ **扫面非空下限**（防空跑）：`book.md` 不在时**不是通过**——「成品不存在」另有「成品文件齐全」
 * 那一格点名，这里如实报 `ok:false`（两份判据各自点名自己看见的事实）。
 *
 * @param {string} projectId
 * @param {object} meta
 * @returns {{ok: boolean, chapters: number[], header: boolean, note: string}}
 */
export function judgeBookAssembly(projectId, meta) {
	const path = join(workDir(projectId), 'book.md')
	const chapterCount = meta?.outline?.chapters?.length ?? 0
	if (!existsSync(path)) {
		return { ok: false, chapters: [], header: false, note: '成品 工作区/book.md 不在，没有可以比对的拼装件' }
	}
	const existing = readFileSync(path, 'utf8')
	const want = expectedBook(projectId, meta)
	if (existing === want) {
		return { ok: true, chapters: [], header: false, note: `成品与 ${chapterCount} 章正文的拼装件逐字相同` }
	}
	const mismatch = bookMismatch(existing, want)
	const parts = []
	if (mismatch.chapters.length > 0) parts.push(`成品与第 ${mismatch.chapters.join('、')} 章不一致`)
	if (mismatch.header) parts.push('成品顶部（书名/前言/loader 段）与拼装件不一致')
	if (parts.length === 0) parts.push('成品与拼装件不一致')
	return {
		ok: false,
		chapters: mismatch.chapters,
		header: mismatch.header,
		note: `${parts.join('；')}——最后检查阶段改完章要让机器重拼成品（chapter-assemble 之后机器会自动重拼），`
			+ '⛔ 别手抄成品：成品是各章正文的拼装件，机器是唯一写者',
	}
}

/**
 * 把**成品**按「机器拼的章标题」切开（F3 专用；与 `splitChapterBlocks` 的口径**不同**，理由见下）。
 *
 * ⚠️ 为什么不用 `splitChapterBlocks`：那一个是**比对字节**用的，为了「`# 第2章 <标题>` 被换掉也看得见」
 * 把标题行并进了段字节，而且认 `#{1,3}`——`### 第2章小结` 这种小节标题也会被当成新的一章（章号整体
 * 偏移）。F3 要的是「**哪一章的正文**里出现了什么」：只认拼装契约里的那一行 `# 第N章 …`（一级标题），
 * 标题行**本身不进章节正文的扫面**，章号取标题里写的数字（半角数字解析不出时退回段序号）。
 * 第一处章标题**之前**的字节（书名/前言/loader 段）单独作为 `header` 返回——它们也在成品里，
 * 所以也扫，只是点名叫「成品顶部」而不是某一章。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：章界只认 `^# 第N章`（一级标题、半角数字才取得到号）。用 `## 第N章`
 * 或中文数字写章标题的成品切不出章界 ⇒ 退回「整份成品当一段」（章号 `null`，点名叫「认不出章号」），
 * ⛔ 不冒充「没命中」、也⛔ 不因为切不出就判红。
 *
 * @returns {{header: string, blocks: Array<{chapter: number|null, text: string}>}}
 */
function bookSectionsOf(bookText) {
	const full = String(bookText)
	const blocks = []
	let headerEnd = full.length
	let offset = 0
	let current = null
	let ordinal = 0
	for (const line of full.split('\n')) {
		const heading = line.match(/^#\s+(.*)$/)
		if (heading !== null && CHAPTER_HEADING_RE.test(heading[1].trim())) {
			if (current === null) headerEnd = offset
			ordinal += 1
			const digits = /^第\s*([0-9]+)\s*章/.exec(heading[1].trim())
			current = { chapter: digits === null ? ordinal : Number(digits[1]), lines: [] }
			blocks.push(current)
			offset += line.length + 1
			continue
		}
		if (current !== null) current.lines.push(line)
		offset += line.length + 1
	}
	return {
		// ⚠️ 切不出章界时**整份只当一段**：`header` 必须清空，否则同一段会被 `header` 与那一段各扫
		// 一遍 ⇒ 一次出现报成两条命中（「成品顶部「甲」、「甲」（认不出章号）」「共 2 处」）。
		// 那正是本函数头部那句「退回整份当一段」要排除的形状（收口 review 2026-10-28 实撞）。
		header: blocks.length === 0 ? '' : full.slice(0, headerEnd),
		blocks: blocks.length === 0
			? [{ chapter: null, text: full }]
			: blocks.map((block) => ({ chapter: block.chapter, text: block.lines.join('\n') })),
	}
}

/**
 * 成品里**出现了哪些「人已划掉」的知识点**（spec `exclusion-flow` 决策 4／F3）。
 *
 * 这是 `judgeBookAssembly` 的**第二只眼**，⛔ 不是它的替代：那一格问「盘上那份是不是这几章的拼装件」，
 * 这一格问「拼装件里有没有不该有的东西」——两种语义，两个返回值，⛔ 不塞进同一个 `{ok, chapters, header}`。
 *
 * 判据本体只借 `excludedTitlesInText`（与章交工那一跳**同一把尺子**：原样在场，或同一份
 * `normalizeKnowledgePointTitle` 下落之后在场），本函数只多做一件——**按机器拼的章标题切段**，
 * 好让点名说得出「第几章」。
 *
 * ## 只按 title（锚那一半有意不做）
 *
 * 真书 143 张卡里 `anchor` 的行段只在**材料**里可解析，成品正文的行号与之没有映射 ⇒ 首版只按 title。
 * 要加锚，先给出「怎么把材料行号映到成品行号」的取证——那是另一张票。
 *
 * ## 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17`）
 *
 * ① 扫面是**整份成品**（书名/前言/loader 段 ＋ 每一章正文；章标题行本身不算正文）。章界只认一级标题
 *    `# 第N章 …`：`## 第N章` 与中文数字写法的章标题切不出章界，那种成品退回「整份当一段」，
 *    命中只能点名「认不出章号」。
 * ② 只判 **title 字符串在不在**（与 `excludedTitlesInText` 同一把尺子、同一组窄处）：正常行文引用
 *    一条被划掉的知识点同样会命中；机器分不出「引用 vs 讲解」，所以这条**必须可豁免**
 *    （调用方给 `otherDetail`，走「其他」点名放行）。
 * ③ 章号取标题里写的数字（半角）；解析不出时退回**段序号**——与 `judgeBookAssembly` 点名第几章
 *    不是同一个口径（那一个是纯段序号）。中文数字章标题的成品会看到段序号而不是标题里的号。
 *    书名前言里的命中点名叫「成品顶部」，说得出它不在任何一章里。
 *
 * @param {string} bookText 盘上那份 `工作区/book.md` 的全文
 * @param {unknown[]} titles 那份件里「今天还算数」的裁决（`live`）的 title
 * @returns {{ok: boolean, hits: Array<{chapter: number|null, title: string}>, detail: string, note: string}}
 *   `detail` 是**现场细节**（`第N章「title」…`，红时供「其他」逐条点名用；绿时为空串）——
 *   与 `note` 分开，是因为两者要说的东西不同：`note` 说「怎么办」，`detail` 只列事实。
 */
export function excludedTitlesInBook(bookText, titles) {
	const sections = bookSectionsOf(bookText)
	const hits = []
	for (const title of excludedTitlesInText(titles, sections.header)) hits.push({ chapter: null, where: 'header', title })
	for (const block of sections.blocks) {
		for (const title of excludedTitlesInText(titles, block.text)) {
			hits.push({ chapter: block.chapter, where: 'chapter', title })
		}
	}
	const nameOf = (hit) => {
		if (hit.where === 'header') return `成品顶部「${hit.title}」`
		if (hit.chapter === null) return `「${hit.title}」（认不出章号）`
		return `第${hit.chapter}章「${hit.title}」`
	}
	if (hits.length === 0) {
		const where = sections.blocks.length === 1 && sections.blocks[0].chapter === null
			? '成品'
			: `成品（书名/前言/loader 段 ＋ ${sections.blocks.length} 章正文）`
		return {
			ok: true,
			hits,
			detail: '',
			note: `${where}里都没有人已划掉的知识点`,
		}
	}
	const named = hits.slice(0, 5).map(nameOf).join('、')
	const more = hits.length > 5 ? `……共 ${hits.length} 处` : ''
	return {
		ok: false,
		hits,
		detail: `${named}${more}`,
		note: `成品里出现了人已划掉的知识点：${named}${more}。它们不在「本书要写的」那一份里，`
			+ '成品（以及它逐字拼自的各章正文）不该再写——把这几个 title 从章正文里删掉再交工；'
			+ '若只是正常引用、确要保留，经用户同意后豁免「其他 · 成品里没有已划掉的知识点」再交工',
	}
}

// ── 盘上那一半：机器拼（写）──────────────────────────────────────────────────

/**
 * **重拼成品**（最后检查阶段改章之后）：盘上那份与拼装件逐字相同就**一个字节都不写**，
 * 不同才写下去——与 `chapter-assembly.js` 的 `assembleCore` 同一条纪律（保住 mtime）。
 *
 * ⚠️ `book.md` **不在**就什么都不做（`status: 'absent'`）：还没合并的书，成品由合并那一跳
 * 写出来，本模块**不替它合并**（那会绕过全章过目与跨章审计）。
 *
 * @param {string} projectId
 * @param {object} meta
 * @returns {{status: 'ok'|'absent', wrote: boolean, chapters: number[], header: boolean}}
 */
export function refreshBook(projectId, meta) {
	const path = join(workDir(projectId), 'book.md')
	if (!existsSync(path)) return { status: 'absent', wrote: false, chapters: [], header: false }
	const existing = readFileSync(path, 'utf8')
	const want = expectedBook(projectId, meta)
	const mismatch = bookMismatch(existing, want)
	if (existing === want) return { status: 'ok', wrote: false, chapters: [], header: false }
	writeFileSync(path, want, 'utf8')
	return { status: 'ok', wrote: true, chapters: mismatch.chapters, header: mismatch.header }
}
