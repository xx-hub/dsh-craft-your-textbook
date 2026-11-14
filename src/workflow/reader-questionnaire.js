/**
 * 读者情况问卷 · 「给出那一份」的渲染 ＋ 回卷件的落点与形状（票 `reader-cognition-boundary-build/03`）
 *
 * ## 它是什么，不是什么
 *
 * **是**这条异步往返的两件纯活：
 *   1. `renderReaderQuestionnaire()` —— 把合并件里的「片」（`readerSlices`，票 `01`）与它的成员
 *      渲染成一份 `.md`（题号 ＋ 明确填写位 ＋ 勾选框 ＋ 顶部三行电子填法 ＋
 *      每题都允许答「不确定」＋ **正文首行自带标题**，兜住下载文件名被硬编成 `<书名>.md` 那个坑）；
 *      ⚠️ **屏一用，不是纸屏两用**（票 `reader-questionnaire-ai-authoring/06` 收窄 `ADR-0038` 决策 6）：
 *      回卷只有「在文件上改完、粘回工作台」一条路，卷面⛔ 不许再教「打印／手写／口头代填」那几条
 *      （见 `reader-questionnaire-text.js` 的 `READER_QUESTIONNAIRE_PAPER_HINTS`）；
 *   2. `readerQuestionnaireProblems()` —— 回卷件**有件时**的形状判据（件在就要非空）；
 *      外加一个读回卷原文的出口（下游 AI 逐条读它、代笔落剔除记录，归票 `06`）。
 *
 * **不是**：不是第二份事实源（问卷件只是给出那一刻的抄本、回卷件是人的输入原文）；
 * 不是放行条件（「回卷件在不在」**一个字都不驱动**流水线）；不是材料上传通道（⛔ 那份通道的语义是
 * 源材料，借它会污染材料面——转录是造书用户自己的动作）；也⛔ 不承诺图片／Word 直读。
 *
 * ## 三条硬约束（照 spec §3.6／§6.2 H）
 *
 * - **「非空」措辞只对回卷件成立**：别的产物可以合法为空（如剔除记录的 `items: []`），这一份不行
 *   ——但它**只在有件时**才被要求。**无件＝不适用**，⛔ 不是违约。
 * - **回来那一份不要求合格式**：跑题散文、只答一半都收；把它映射到上沿／下沿是 AI 的活。
 *   所以这里**只**收 `string` 原文、**逐字落盘**（⛔ 不 `trim()`、⛔ 不 `slice()` 截断）。
 * - **片缺席退化在消费侧现算**（`effectiveReaderSlices`），本模块⛔ 不往合并件里落第二份「整书一片」。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（票 `dev-gate-scan/17` 的纪律）
 *
 * - 渲染只看合并件里的 `readerSlices`（缺席／坏形状时由 `effectiveReaderSlices` 退化成整书一片）。
 *   合并件里**没被任何片收进的知识点**不会出现在逐条清单里——这是票 `07` 的「默认讲 ＋ 缺口可见」
 *   口径，不是本模块漏印。
 * - **逐条那层的取条规则**（票 `05`）＝`selectSliceItems()`：合计 ≤ `READER_QUESTIONNAIRE_ITEM_LIMIT`
 *   （30）、按组轮转取条。它的**轮转轴只认合并件里的 `chapterSuggestion[].points`**（字符串形式的
 *   知识点 title）；真书上 `points` 若写成别的引用形（票 13 的读数：「资料N：小节」），一个组都
 *   认领不到成员 ⇒ 退化成**按 `knowledgePoints` 的卡片顺序**取——那正是票面点名的那条退化。
 *   它**不认**别种分组来源（`materials[].sections`／图上的边），⛔ 也不声称自己认得「哪几条最值得问」
 *   （那需要相关性排序，本仓今天没有这份输入；盘上只有「原序」与「按组轮转」两套可重跑的）。
 * - 逐条那层**不再分页、不再二次分组**：只列前 M 条，其余照「默认讲」——这是维护者那条红线
 *   （「⛔ 不让人做很多又臭又长的判断」）的实现，不是漏印。
 * - `readerQuestionnaireProblems()` 只看**回卷件本身**（在不在、空不空）；它看不到「问卷件在不在」，
 *   也看不到「收卷人真的填了没有」——后者是人的动作，机器不验（spec §6.3）。
 * - 片级「这片我基本都会」**⛔ 不产生剔除**（票 `15` 第 4 条）：本模块只把它印在卷上，
 *   盘上**没有任何一条从这个勾到剔除记录的写路**（问卷侧唯一的剔除入口是逐条勾「已经会」，
 *   而真正落盘那一条仍只在图上逐卡划／票 `06` 的护栏①里）。
 * - **题面（AI 写的那一份）只按两种身份挂上去**（票 `reader-questionnaire-ai-authoring/03`）：
 *   片名与知识点 `title`，两样都走 `normalizeTitle`（与片的形状闸、题的形状闸**同一把尺子**）。
 *   题面里写了、这一卷**没列到**的条目⛔ 不印（那是逐条 ≤30 封顶的必然，不是漏印）；
 *   盘上那份件若被人手改坏（缺 `ask` 之类），**认不出的那一格就不印**（按条退化到干清单），
 *   ⛔ 本模块不重跑形状闸（闸在交工那一跳；读侧判红等于给「别人手改过的旧件」判红）。
 * - **卷末那一节「还有什么我们没问到的？」缺口栏读不出来**：`src/ui/reader-gap.js` 只认固定行型
 *   （三类缺口读数），散文归**读卷那一侧**逐字读（spec「结构面」第 3 条与「已知窄处」末条）。
 *   ⛔ 不承诺它进得了界面那块。
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
	READER_QUESTIONNAIRE_RETURNED_FILE_NAME,
	READER_QUESTIONNAIRE_RETURNED_REL,
} from '../domain-rules.js'
// ⚠️ 纸面第 1 问那三档**派生自**收卷人闭集（唯一出处＝`EXPLORE_CONFIRM_ANSWERERS`）——
//    ⛔ 本文件不手抄那份名单（抄漏／抄多一格就是把「谁填的」问歪；票 11 起那份闭集是
//    **回卷载荷** `reader-questionnaire-submit` 的 `answerer` 字段与问卷面板三选一的同一份）。
import { EXPLORE_CONFIRM_ANSWERERS } from '../explore-confirm-contract.js'
import { workDir } from './engine/paths.js'
import { effectiveReaderSlices } from './knowledge-map-assembly.js'
// 票 `reader-questionnaire-ai-authoring/03`：AI 写的那份**题面**（`工作区/问卷题面.json`）的
// **唯一读侧**就住这里（票 `02` 落的那一个出口）。⚠️ 不成环：那个模块只 import `domain-rules`／
// `engine/paths.js`／`reader-questionnaire-vocab.js`，⛔ 不 import 本文件。
import { readReaderQuestionnaireText } from './reader-questionnaire-text.js'
// 票 `graph-read-one-answer/02`：「盘上那份合并件读出来是什么」只有一处口径（`readMergedMap`），
// 本文件不再自己 `JSON.parse` 一份。⚠️ 不成环：那个模块只 import `domain-rules`／`engine/paths.js`
// 与三个图侧叶子，⛔ 不 import `engine.js`。
import { readMergedMap } from './knowledge-graph-build.js'
// ⚠️ **唯一出处**住 `./reader-questionnaire-vocab.js`（那个文件**无 Node 依赖**，所以界面那一侧的
//    缺口栏 `src/ui/reader-gap.js` 也能直接读它，而不会把本文件的 `node:fs` 拖进浏览器 bundle）。
import {
	READER_ITEM_STATES,
	READER_SLICE_STATES,
	normalizeTitle,
} from './reader-questionnaire-vocab.js'

/**
 * **逐条那一层的合计封顶**（票 `05`／票 `18` 契约 10）：合计 ≤ 30 条。
 * ⚠️ 它是**呈现层**的闸（那份产物本身不存逐条）：片数、成员对上那两样归
 * `readerSliceProblems()`；「取多少条、怎么取」只活在这里。
 */
export const READER_QUESTIONNAIRE_ITEM_LIMIT = 30

/**
 * **片级三态**与**逐条两态**、以及成员身份那一把尺子（`normalizeTitle`）——**唯一出处**住
 * `./reader-questionnaire-vocab.js`（见文件头那三样的注释）。
 *
 * ⚠️ 这里**原样再导出**：既有消费者（含判据）照旧从本模块取这三样，⛔ 不在本文件手抄第二份字面量。
 */
export { READER_SLICE_STATES, READER_ITEM_STATES, normalizeTitle }

/**
 * 纸面第 1 问那三档的**显示装饰**（值 → 卷面写法）。
 *
 * ⚠️ 三档的**取值**派生自 `EXPLORE_CONFIRM_ANSWERERS`（闭集唯一出处＝
 * `explore-confirm-contract.js`）；本表**只**给显示写法，⛔ 不是第二份闭集——
 * 表里没有的值一律**逐字退回原值**（于是「老师」不需要一条）。
 */
const ANSWERER_DISPLAY = Object.freeze({
	本人: '本人（读者自己）',
	监护人: '监护人（家长）',
})

/**
 * 按收卷人「这份回卷该怎么读」的**三档策略句**（票 `ui-display-redesign/11`；spec §4）。
 *
 * 它们是站 3 交办正文（brief `hints`）里那一段的**唯一出处**——`src/workflow/engine.js` 的
 * `goal` facts 按 `meta.answerer` 取一句追加，⛔ 不在引擎里手抄三份中文（那样三档会各自漂）。
 *
 * | 收卷人 | 解读档 | 落账方向 |
 * |---|---|---|
 * | 本人 | 自评证据：明确勾「已经会」的才进剔除记录；不确定与未勾照常讲 | 只落明确项 |
 * | 监护人 | 第三方观察：只采明确项；不据此改教学重点或读者边界 | 只落明确项 |
 * | 老师 | 教学判断：明确项照落；重点/难点意见可带进 brief 参考；⛔ 不重写读者边界、⛔ 不替用户拍板 | 剔除仍只落「已经会」明确项 |
 *
 * ⚠️ **键集合必须＝`EXPLORE_CONFIRM_ANSWERERS`（闭集唯一出处）**：票 17 · 收口 review F4 起由
 * `test/test-brief-doc-closure.mjs` 的「策略句表 ⇔ 收卷人闭集」那条判据**两向**对账（缺一档/多一档
 * 都点名，并带缺/多档的反证）——本注释不再自证「键集合＝闭集」（修前它只是自称，表键是手写中文）。
 * 表里没有的值 ⇒ {@link readerAnswererBriefClause} 返回 `null`（老书没记下收卷人，⛔ 不猜一个身份）。
 */
export const READER_ANSWERER_BRIEF_CLAUSES = Object.freeze({
	本人: '回卷是本人自评：只把明确勾「已经会」的落剔除记录，不确定与未勾照常讲。',
	监护人: '回卷是监护人的第三方观察：只采明确项，不确定不落，不要据此改教学重点或读者边界。',
	老师: '回卷是老师的教学判断：明确项照落；重点/难点意见可参考，但不得重写读者边界、不得替用户拍板。',
})

/**
 * 取一档策略句；认不出的收卷人（没记下／旧账本里的野值）⇒ `null`（⛔ 不猜身份、⛔ 不拿缺省冒充一档）。
 *
 * @param {unknown} answerer 收卷人（`meta.answerer`）
 * @returns {string|null}
 */
export function readerAnswererBriefClause(answerer) {
	return Object.hasOwn(READER_ANSWERER_BRIEF_CLAUSES, answerer) ? READER_ANSWERER_BRIEF_CLAUSES[answerer] : null
}

/**
 * 从合并件里取**轮转的轴**（＝该片成员在合并件里的**既有分组顺序**）与**退化的底**（卡片顺序）。
 *
 * - `groups`＝`chapterSuggestion`（既有分组顺序；逐组 `points` 是知识点 title 串时才认得出成员）；
 * - `cardOrder`＝`knowledgePoints` 的 title 顺序（没有任何分组时按它取）。
 *
 * ⚠️ 两样都只从**这一个合并件**现读，⛔ 不落第二份、⛔ 不从别处（材料小节／图上的边）另算一份。
 *
 * @param {object|null|undefined} merged 合并件
 * @returns {{groups: unknown[], cardOrder: string[]}}
 */
export function readerQuestionnaireOrdering(merged) {
	const groups = Array.isArray(merged?.chapterSuggestion) ? merged.chapterSuggestion : []
	const cardOrder = Array.isArray(merged?.knowledgePoints)
		? merged.knowledgePoints.map((point) => normalizeTitle(point?.title)).filter((title) => title !== '')
		: []
	return { groups, cardOrder }
}

/** 按组轮转取条：「每组先出一条、再回头出第二条……」，取够 `cap` 条就停。 */
function roundRobinTake(buckets, cap) {
	const out = []
	if (cap <= 0) return out
	for (let depth = 0; out.length < cap; depth += 1) {
		let took = 0
		for (const bucket of buckets) {
			if (out.length >= cap) break
			if (depth < bucket.length) {
				out.push(bucket[depth])
				took += 1
			}
		}
		if (took === 0) break
	}
	return out
}

/**
 * **「取哪 30 条」的纯函数**（票 `05`）：合计封顶 ＋ 按组轮转取条。
 *
 * 规则（票面逐条／spec §3.7）：
 * 1. **合计 ≤ `limit`**（默认 30）：`每片取 ≤ ⌊limit／片数⌋`——4 片时 7、5 片时 6
 *    （⚠️ 票 18 契约 10 的括号「每片 6–10 条」只在 3 片时算得平，⛔ 不照它实现）；
 * 2. **按组轮转**：轴＝该片成员在合并件里的**既有分组顺序**（`groups` 逐组的 `points` 认领成员），
 *    每组先出第 1 条、再回头出第 2 条……没被任何组认领的成员接在末尾（保持卡片顺序）；
 * 3. **没有任何分组时退化成按卡片顺序取**：一个组都认领不到 ⇒ 只剩一个桶 ⇒ 轮转＝卡片顺序。
 *
 * 纯函数：不读盘、不写盘、无副作用；同一个输入永远同一个输出（判据与界面吃同一份）。
 *
 * @param {unknown} slices `effectiveReaderSlices(...).slices`（`[{name, description?, members:[title]}]`）
 * @param {{limit?: number, groups?: unknown[], cardOrder?: string[]}} [options]
 *   `groups`／`cardOrder` 由 {@link readerQuestionnaireOrdering} 从合并件取。
 * @returns {{perSliceLimit: number, slices: Array<{name: unknown, description: unknown, members: string[], total: number}>}}
 *   `members`＝取出来的那一份（已封顶＋轮转）；`total`＝该片**原有**成员数（供卷上如实印出「共 N 条」）。
 */
export function selectSliceItems(slices, { limit = READER_QUESTIONNAIRE_ITEM_LIMIT, groups = [], cardOrder = [] } = {}) {
	const list = Array.isArray(slices) ? slices : []
	const budget = Number.isSafeInteger(limit) && limit > 0 ? limit : 0
	const perSliceLimit = list.length === 0 ? 0 : Math.floor(budget / list.length)
	const rank = new Map()
	cardOrder.forEach((title, index) => {
		const key = normalizeTitle(title)
		if (key !== '' && !rank.has(key)) rank.set(key, index)
	})
	const rankOf = (title) => (rank.has(title) ? rank.get(title) : Number.MAX_SAFE_INTEGER)
	const picked = list.map((slice) => {
		const members = (Array.isArray(slice?.members) ? slice.members : [])
			.map(normalizeTitle)
			.filter((title) => title !== '')
		// 成员表里的写法顺序**不作数**：先落到卡片顺序（没有任何分组时这就是最终顺序）。
		const byCard = members.slice().sort((a, b) => rankOf(a) - rankOf(b))
		// 既有分组顺序 → 桶；没被任何组认领的接在末尾（仍是卡片顺序）。
		const buckets = []
		const claimed = new Set()
		for (const group of Array.isArray(groups) ? groups : []) {
			const points = new Set((Array.isArray(group?.points) ? group.points : [])
				.map(normalizeTitle)
				.filter((title) => title !== ''))
			const bucket = byCard.filter((title) => points.has(title) && !claimed.has(title))
			if (bucket.length === 0) continue
			for (const title of bucket) claimed.add(title)
			buckets.push(bucket)
		}
		const rest = byCard.filter((title) => !claimed.has(title))
		if (rest.length > 0) buckets.push(rest)
		return {
			name: slice?.name,
			description: slice?.description,
			members: roundRobinTake(buckets, perSliceLimit),
			total: members.length,
		}
	})
	return { perSliceLimit, slices: picked }
}

/**
 * 读这本书的合并件（读不出／坏形状返回 `null`——⛔ 不抛：问卷是**可选动作**，读不到就说读不到）。
 *
 * ⚠️ 票 `graph-read-one-answer/02`：**只问那一句**（`readMergedMap`）。口径一条——严格 JSON 对象，
 * 否则算没有；缺件／不是严格 JSON／不是对象／是数组 ⇒ 同一个 `null`。判据强度不变：
 * 以前是「读不出就算没有」，现在还是（⛔ 不改成抛错，⛔ 不改下游那句拒绝文案的判词）。
 *
 * @param {string} projectId
 * @returns {object|null}
 */
export function readReaderQuestionnaireKnowledgeMap(projectId) {
	return readMergedMap(projectId).map
}

/**
 * 逐条那一行的**总条数基准**（票 `03`「卷头写出预计用时」那句的分母）：
 * 「30 条按 8–10 分钟估」——30 就是 {@link READER_QUESTIONNAIRE_ITEM_LIMIT}（⛔ 不另写一个 30）。
 * 卷上的实数变，那句用时跟着变：3 条＝1 分钟、15 条＝4–5 分钟、30 条＝8–10 分钟
 * （判据就盯「3 条」与「30 条」那两格）。
 */
export const READER_QUESTIONNAIRE_MINUTES_PER_30_ITEMS = Object.freeze([8, 10])

/** 片级题面（`lead`）那一行的**抬头**（逐字；它压掉该片的 `description`）。
 * ⚠️ **不导出**：它只在这一处用得上，卷面那三个字本身就是判据（判据手写期望值，从实现再取一份就不可靠了）。
 */
const READER_QUESTIONNAIRE_LEAD_LABEL = '> **这一片在问什么：**'

/**
 * 本卷条数 ⇒ 预计用时（分钟区间）。无条 ⇒ `null`（⛔ 不编一个数出来）。
 *
 * ⚠️ **它是本卷实数折出来的，不是一个写死的常数**（票 `03` 验收：「与条数同源换算」）：
 * 分母取 {@link READER_QUESTIONNAIRE_ITEM_LIMIT}，比例取
 * {@link READER_QUESTIONNAIRE_MINUTES_PER_30_ITEMS}，两端各自取整、下限 1 分钟。
 * AI 自己估的那一份（题面的 `estimate`）**另起一行印**，⛔ 不并进这一个数
 * （两个来源混成一格，判据就盯不住「改条数 ⇒ 那句数跟着变」这一行）。
 *
 * @param {number} itemCount 卷上逐条那一层合计多少条
 * @returns {{min: number, max: number}|null}
 */
export function estimateReaderQuestionnaireMinutes(itemCount) {
	if (!Number.isSafeInteger(itemCount) || itemCount <= 0) return null
	const base = READER_QUESTIONNAIRE_ITEM_LIMIT
	const [low, high] = READER_QUESTIONNAIRE_MINUTES_PER_30_ITEMS
	const min = Math.max(1, Math.round((itemCount * low) / base))
	const max = Math.max(min, Math.round((itemCount * high) / base))
	return { min, max }
}

/** 用时区间的**卷面写法**（`8–10 分钟`／`2 分钟`）。 */
function minutesText({ min, max }) {
	return min === max ? `${min} 分钟` : `${min}–${max} 分钟`
}

/**
 * AI 题面的**只读索引**：片名 → `{lead, items: Map<知识点 title, {ask, why, hint}>}`。
 *
 * ⚠️ **它只认两种身份**：片名与知识点 `title`，两样都走 `normalizeTitle`（与片的形状闸、题的形状闸
 * **同一把尺子**）。认不出的格子（缺 `ask`／缺 `why`／不是串）**不并进索引**⇒ 那一条照今天的干清单印
 * （**按条退化**，不是整卷退化）。⛔ 本函数不判红、不抛：盘上那份件是过闸写下的，
 * 读侧再判一次红等于给「别人手改过的旧件」判红（`reader-questionnaire-text.js` 文件头那条口径）。
 *
 * @param {unknown} questionnaireText `readReaderQuestionnaireText(...)` 的返回值
 * @returns {Map<string, {lead: string, items: Map<string, {ask: string, why: string, hint: string}>}>}
 */
function questionnaireTextIndex(questionnaireText) {
	const index = new Map()
	const source = questionnaireText !== null && typeof questionnaireText === 'object' ? questionnaireText : null
	if (source === null) return index
	for (const slice of Array.isArray(source.slices) ? source.slices : []) {
		const sliceName = normalizeTitle(slice?.slice)
		if (sliceName === '') continue
		const items = new Map()
		for (const item of Array.isArray(slice?.items) ? slice.items : []) {
			const title = normalizeTitle(item?.title)
			const ask = normalizeTitle(item?.ask)
			const why = normalizeTitle(item?.why)
			// `why` 必填（票 `02` 判据 4）：缺它的那一格不印题面——那一行买的是「认真答」，不印它等于少一半。
			if (title === '' || ask === '' || why === '') continue
			if (!items.has(title)) items.set(title, { ask, why, hint: normalizeTitle(item?.hint) })
		}
		// 同名片（图上重叠的两片）取**先出现的那一片**：后一片只补它自己没有的格
		// （与题的形状闸「同名片并集」不一样——那里验形状，这里不拿后一片篡前一片的 `lead`）。
		const known = index.get(sliceName)
		if (known === undefined) {
			index.set(sliceName, { lead: normalizeTitle(slice?.lead), items })
		} else {
			if (known.lead === '') known.lead = normalizeTitle(slice?.lead)
			for (const [title, block] of items) if (!known.items.has(title)) known.items.set(title, block)
		}
	}
	return index
}

/**
 * 一条题面的**卷面行**（逐字；`null`＝这一条没有题面）。
 *
 * ```text
 * > **问：** 〈ask〉
 * > 为什么问这个：〈why〉
 * > （提示：〈hint〉）        ← 可缺
 * ```
 *
 * ⚠️ 三行都是 `>` 引用行：`src/ui/reader-gap.js` 的解析面逐行按 `startsWith` 与一条严格正则
 * 认行，**认不出的行直接跳过**——把题面塞进逐条那一行（`—— 问：… —— title`）才是改行型。
 * ⛔ 这里一个字都不动行型。
 *
 * @param {{ask: string, why: string, hint: string}|undefined} block
 * @returns {string[]|null}
 */
function questionBlockLines(block) {
	if (block === undefined) return null
	const out = [`> **问：** ${block.ask}`, `> 为什么问这个：${block.why}`]
	if (block.hint !== '') out.push(`> （提示：${block.hint}）`)
	return out
}

/** 把一条题面推到卷上（前后各留一个空行，免得 `>` 块与上一条的勾选框黏在一起）；`null` ⇒ 什么都不推。 */
function pushQuestionBlock(lines, blockLines) {
	if (blockLines === null) return
	if (lines[lines.length - 1] !== '') lines.push('')
	for (const line of blockLines) lines.push(line)
	lines.push('')
}

/**
 * 渲染「给出那一份」——**屏一用**（`.md` 可编辑文件）的读者情况问卷。
 *
 * 版式（照 `ADR-0038` 决策 6 及其 `## Amendment`（2026-11-02 收窄）逐条）：
 * - 正文首行自带标题：`# 《书名》· 读者情况问卷`；
 * - 顶部三行电子填法：下载这份文件 → 把 `[ ]` 改成 `[x]`、要说的写在题下 → 全选复制 → 粘回工作台
 *   （**只有这一条路**：卷面⛔ 不出现打印／手写／口头这类纸面指引）；
 * - 第一问＝谁填（收卷人；本票只印在卷首，**不落任何字段**——字段与路由归票 `04`）；
 * - 每一片一问：片级三态（这片我基本都会／说不准／这片不是问我的）＋ 逐条清单（已会／不确定 两态）；
 * - **每题都允许答「不确定」**（让「未知」成为合法答案，否则代理会编）；
 * - 没勾＝照常讲（spec §3.8 的保守方向，印在卷上让人看得见）。
 *
 * ⚠️ 票 `03` 起多认一份 **AI 写的题面**（`input.questionnaireText`，盘上那份的唯一读侧是
 * {@link readReaderQuestionnaireText}）：问话／「为什么问这个」／提示印在**每一条勾选框的正上方**，
 * 片级 `lead` 印在片顶上并压掉该片的 `description`；**行型一个字节都不动**
 * （`## 第 N 问 · <片名>`／`- [ ] <片级三态>`／逐条那一行照旧——缺口栏与「已经会 → 剔除」那条链
 * 逐字认它们）。
 *
 * @param {object} input
 * @param {unknown} input.bookName 书名（拿不到时退「这本书」）
 * @param {unknown} input.slices `effectiveReaderSlices(...).slices`
 * @param {boolean} [input.degraded] 片缺席／形状坏时为 true（会印一句如实说明）
 * @param {string|null} [input.note] 那句如实说明（来自 `effectiveReaderSlices`）
 * @param {unknown[]} [input.groups] 轮转的轴＝既有分组顺序（`readerQuestionnaireOrdering`；缺省＝没有分组）
 * @param {string[]} [input.cardOrder] 没有任何分组时的退化底＝卡片顺序
 * @param {number} [input.limit] 逐条合计封顶（默认 {@link READER_QUESTIONNAIRE_ITEM_LIMIT}）
 * @param {object|null} [input.questionnaireText] AI 写的那份题面（{@link readReaderQuestionnaireText}
 *   的返回值；缺席／坏形状 ⇒ 卷子退回今天的干清单，⛔ 不抛）
 * @returns {string}
 */
export function renderReaderQuestionnaire({
	bookName,
	slices,
	degraded = false,
	note = null,
	groups = [],
	cardOrder = [],
	limit = READER_QUESTIONNAIRE_ITEM_LIMIT,
	questionnaireText = null,
} = {}) {
	const name = typeof bookName === 'string' && bookName.trim() !== '' ? bookName.trim() : '这本书'
	const list = Array.isArray(slices) ? slices : []

	// ⚠️ 取条那一跳（封顶 ＋ 按组轮转）**只此一处**：纯函数，判据吃的是同一个。
	//    票 `03` 起它要**先**算——卷头那句预计用时按**本卷实数**换算（⛔ 不写死「8–10 分钟」一个常数）。
	const { slices: listed } = selectSliceItems(list, { limit, groups, cardOrder })
	const listedItems = listed.reduce((sum, slice) => sum + slice.members.length, 0)
	// 题面的只读索引（片名 → {lead, items}）：认不出的格子不印，于是**按条退化**到干清单。
	const textIndex = questionnaireTextIndex(questionnaireText)
	const estimate = estimateReaderQuestionnaireMinutes(listedItems)
	// ⚠️ `estimate` 与 `aiEstimate` 是**两个来源**，⛔ 不合并：前者是按条数折的（改条数就变，判据盯它），
	//    后者是 AI 出卷时**自己估的**（票 `02` 那一格，只在这一份题面带过 `estimate` 时才印）。
	const aiEstimate = normalizeTitle(questionnaireText?.estimate)
	const lines = []

	lines.push(`# 《${name}》· 读者情况问卷`, '')
	// ⚠️ 票 `reader-questionnaire-ai-authoring/06`：卷头那三行纸面口径**整段删掉**，换成电子一条路。
	//    回卷只有「在文件上改完、粘回工作台」这一条（`ADR-0038` 决策 6 的 `## Amendment`）；
	//    凡是教人走打印／手写／口头那几条的句子，收卷人照做之后那份卷子就**回不来**了。
	lines.push('> **怎么填（电子一条路）**')
	lines.push('> 1. 下载这份文件，用任何能改文字的软件打开。')
	lines.push('> 2. 把要选的 `[ ]` 改成 `[x]`；要说的那句话直接写在题下。')
	lines.push('> 3. 全选复制整份文字，粘回工作台那个框里。', '')
	// 票 `03`：填写说明之后加**「怎么答」**那一块——预计用时（按本卷实数折算）＋「答一半也行」。
	// async 场景下这句决定人会不会真的开始（spec「结构面」第 2 条）。
	lines.push('> **怎么答**')
	if (estimate !== null) {
		// ⚠️ 这里**只印折算出来的那一个区间**，⛔ 不把基准（30 条 8–10 分钟）也抄上卷面：
		//    那会把一个常数写上卷，而判据盯的正是「那句数是不是从本卷实数来的」。
		lines.push(`> 预计用时：${minutesText(estimate)}（卷上 ${listedItems} 条）。`)
	}
	if (aiEstimate !== '') lines.push(`> 写这份问卷时另估过：${aiEstimate}（以你手上这一份的实际条数为准）。`)
	lines.push('> 答一半也行，跳过的我们会照常讲。', '')
	lines.push('> 每题都可以答「不确定」：不确定也是合法答案，不用猜。**没勾的条目我们默认照常讲。**')
	if (degraded === true) {
		lines.push('>')
		lines.push(`> ⚠️ ${typeof note === 'string' && note.trim() !== '' ? note.trim() : '这本书的知识点还没有分「片」，整本书算作一片。'}`)
	}
	lines.push('', '---', '')

	// 第一问：这份问卷是谁填的（**纸面自填、仅作人读**）。
	// 票 11：造书用户发卷时**不选收卷人**（单版通用卷）——谁填的由填卷人自己在卷首勾，
	// 真正落书账本的那个值是造书用户在**回卷时**选的（面板三选一 → 回卷载荷 `answerer`）。
	// ⚠️ 三档从 `EXPLORE_CONFIRM_ANSWERERS` 派生（⛔ 不手抄一份）：显示装饰由 `ANSWERER_DISPLAY` 给，
	//    表里没有的值逐字退回原值。
	lines.push('## 第 1 问 · 这份问卷是谁填的？', '')
	for (const answerer of EXPLORE_CONFIRM_ANSWERERS) {
		lines.push(`- [ ] ${ANSWERER_DISPLAY[answerer] ?? answerer}`)
	}
	// ⚠️ 「不确定」**不是** `EXPLORE_CONFIRM_ANSWERERS` 那三档的一员（那一格是回卷载荷的闭集）：
	//    它只是这份纸面**每一题都有**的通用选项（票 03：每题都允许答不确定，让「未知」成为合法答案）。
	lines.push('- [ ] 不确定')
	lines.push('')

	if (list.length === 0) {
		lines.push('（这本书还没有可勾选的知识点清单。）', '')
	} else {
		lines.push('（下面每一问都是一个「片」——这本书里一类相近的内容；片里再逐条列知识点。）', '')
		lines.push(`（逐条那层是**抽样**：整份卷子合计最多列 ${limit} 条，按组轮转着取，没列到的一律照常讲。）`, '')
	}

	listed.forEach((slice, index) => {
		const rawName = typeof slice?.name === 'string' ? slice.name.trim() : ''
		const sliceName = rawName !== '' ? rawName : `第 ${index + 1} 片`
		lines.push(`## 第 ${index + 2} 问 · ${sliceName}`, '')
		// 票 `03`：片级题面（`lead`）印在片顶上，并**压掉**该片的 `description`（没 lead 才印 description
		// ——**按片退化**，不是整卷退化）。
		const sliceText = textIndex.get(normalizeTitle(rawName))
		const lead = sliceText === undefined ? '' : sliceText.lead
		const description = typeof slice?.description === 'string' ? slice.description.trim() : ''
		if (lead !== '') lines.push(`${READER_QUESTIONNAIRE_LEAD_LABEL} ${lead}`, '')
		else if (description !== '') lines.push(description, '')
		lines.push('**这一片的情况**（只能勾一个）：', '')
		for (const state of READER_SLICE_STATES) lines.push(`- [ ] ${state}`)
		lines.push('')
		// 如实印出「共 N 条／卷上先列 M 条」：没列到的照「默认讲」（票 07 的保守方向，⛔ 不假装问全了）。
		lines.push(`> 这一片共 ${slice.total} 条，卷上先列 ${slice.members.length} 条（没列到的照常讲）。`, '')
		lines.push('**这一片里的知识点**（每条勾一个；没勾＝照常讲）：', '')
		if (slice.members.length === 0) {
			lines.push(slice.total > 0
				? '（这一片这次没有逐条列出来——没列到的一律照常讲。）'
				: '（这一片还没有逐条列出的知识点。）')
		}
		for (const member of slice.members) {
			// 票 `03`：AI 的问话印在**这一条勾选框的正上方**（认不出的那条不印 ⇒ 照今天的干清单）。
			pushQuestionBlock(lines, questionBlockLines(sliceText?.items.get(normalizeTitle(member))))
			lines.push(`- [ ] ${READER_ITEM_STATES[0]}　- [ ] ${READER_ITEM_STATES[1]} —— ${member}`)
		}
		lines.push('')
	})

	// 票 `03`：卷末那一节＝「还有什么我们没问到的？」——**取代**了原先的「想补充的话」
	// （同一件事⛔ 不摆两个框）。它**不带任何勾选框**：缺口栏只认固定行型、读不出来，
	// 但它归读卷那一侧**逐字读整份回卷件**（spec「结构面」第 3 条）。
	lines.push('---', '')
	lines.push('## 还有什么我们没问到的？', '')
	lines.push('哪一条都不是问你的、想补充的直接写在下面。', '')
	lines.push('（不用管格式：跑题、只答一半、只说一句都行。）', '')
	lines.push('（写在这里）', '')
	lines.push('> 填完把整份文字交回造书的人：由他粘回工作台，内容会原样存成书夹里的一份 `.md`。', '')
	return lines.join('\n')
}

/**
 * 给一本书渲染「给出那一份」：读合并件 → 消费侧退化视图 → 渲染。
 *
 * @param {string} projectId
 * @param {{name?: string}|null} meta `project.json`（用书名进标题）
 * @returns {{text: string, degraded: boolean, note: string|null, problems: string[]}}
 *   `problems` 非空＝**发不出卷**（合并件缺失／一条知识点都没有），动作据此 409。
 */
export function renderReaderQuestionnaireForBook(projectId, meta) {
	const merged = readReaderQuestionnaireKnowledgeMap(projectId)
	if (merged === null) {
		return { text: '', degraded: false, note: null, problems: ['这本书还没有知识地图（合并件不在）——先等探查那一步把知识点挑出来，再来发问卷'] }
	}
	const { slices, degraded, note } = effectiveReaderSlices(merged)
	if (slices.length === 0) {
		return { text: '', degraded, note, problems: ['这本书的知识点还是空的——等探查挑出知识点之后才发得出问卷'] }
	}
	const { groups, cardOrder } = readerQuestionnaireOrdering(merged)
	// 票 `03`：AI 写的那份题面经**唯一读侧**读（读不到 ⇒ `null` ⇒ 卷子退回今天的干清单）。
	const questionnaireText = readReaderQuestionnaireText(projectId)
	return {
		text: renderReaderQuestionnaire({ bookName: meta?.name, slices, degraded, note, groups, cardOrder, questionnaireText }),
		degraded,
		note,
		problems: [],
	}
}

/**
 * 回卷件的原文（**逐字**，⛔ 不裁空白、⛔ 不截断）。无件返回 `null`。
 *
 * 下游（票 `06` 的 AI 代笔）读的就是这一份——它不要求合格式：跑题散文、只答一半都收。
 *
 * @param {string} projectId
 * @returns {string|null}
 */
export function readerQuestionnaireReturnText(projectId) {
	try {
		const file = join(workDir(projectId), READER_QUESTIONNAIRE_RETURNED_FILE_NAME)
		if (!existsSync(file)) return null
		return readFileSync(file, 'utf8')
	} catch {
		return null
	}
}

/**
 * **有件时才验**的形状判据：回卷件在盘上就要非空；无件＝不适用（返回空数组，⛔ 不是违约）。
 *
 * ⚠️ 强度说小（spec §6.5）：它只证「件在且不是空的」；**不证**收卷人真的填了、填得对不对、
 * 回来的是不是合格式——那些机器不验（§6.3）。而且它**不是放行条件**：⛔ 没有任何动作／闸门拿
 * 这个返回值去拦人或放人。
 *
 * ⚠️ 它在生产路径上**有意没有消费者**：本仓对它的口径是「链上判据＝有件时才验的形状面」
 * （spec §6.2 H），⛔ 不许把它接成放行条件（把它接进任何一条 `problems`／闸门，就是把
 * 「件在不在」变成拦人的条件，而那正是文件头第 1 条否掉的那件事）。
 *
 * @param {string} projectId
 * @returns {string[]} 问题清单（空数组＝站得住／不适用）
 */
export function readerQuestionnaireProblems(projectId) {
	const text = readerQuestionnaireReturnText(projectId)
	if (text === null) return [] // 无件 ⇒ 不适用（无件不是违约）
	if (text.trim() === '') {
		return [`回卷件 ${READER_QUESTIONNAIRE_RETURNED_REL} 在盘上但是空的——有件时才验：件在就要有内容；无件时不适用（⛔ 这不是放行条件）`]
	}
	return []
}
