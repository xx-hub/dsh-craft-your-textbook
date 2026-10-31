/**
 * 站 2 确认动作（`explore-confirm`）的**载荷与落点唯一写点**（票 `reader-cognition-boundary-build/04`；
 * 票 `ui-display-redesign/11` 收窄）
 *
 * ## 它是什么
 *
 * 一张**只读契约**：站 2 那次表态在三处出现——壳发出去的**载荷**（`src/client-entry.js` 的
 * `confirmExplore`）、卡上那行身份自述（`src/ui/confirm-cards.js`）、服务端把**落点**写进结论件与
 * `meta`（`src/workflow/actions/gates.js` 的 `case 'explore-confirm'`）。
 * 三处必须认同一套名字与取值域；把它们收进这一处，就是为了让**下一次加字段只改这一个文件**
 * （票面第一件事：⛔ 不许两处各改一半）。
 *
 * ## 两条放行出口（spec §3.2；ADR-0041 决策 2 经票 11 收窄）
 *
 *   · `questionnaire`（答问卷）：收卷人交回的问卷回来了 ⇒ 正文在书夹那份 `.md` 里。⚠️ 票 11 起，
 *     **收卷人不再随这一跳走**：它由回卷动作 `reader-questionnaire-submit` 写 `meta.answerer`
 *     （写点从这里挪走，见 `src/workflow/actions/chapters.js`）。
 *   · `untouched`（没人动过）：那一版**仍成文**，但身份是 **AI 先验（未经确认）**——界面必须
 *     如实写出 `EXPLORE_CONFIRM_AI_PRIOR_STATEMENT` 那句，⛔ 不许冒充「人拍过板」。
 *
 * ⚠️ **票 `ui-display-redesign/11`：`ai-draft` 出口退役**（ADR-0041 决策 2 的三条出口 → 两条）。
 * 病因：卡内问卷块（含「AI 起草的读者边界」那一格与「照 AI 起草的办」那颗键）随票 03 整块移出卡，
 * 那颗键已经没有 UI 入口 ⇒ 出口与 `values.draft` 一起退役。旧账本里留着的 `values.exit='ai-draft'`
 * 由 {@link exploreConfirmStance} 判成 `unrecorded`（⛔ 不冒充人的动作）。
 *
 * ⚠️ **两条路不等强、照实**（spec §6.8 裁决一）：界面那条路发 `approved`／`reasons`／`note`／`values`；
 * `agent-tool` 那条路只转 `approved` ＋可选 `note`（⛔ 不承诺补齐，那是下游可选增强）。
 * ⇒ 「读者情况问卷的作答与拍板一律走界面那条路」；本模块的 `values` 形状判据**只对界面那条路**
 * 声称强度——AI 代点那一跳不会让边界成文（`exploreConfirmStance(undefined).kind === 'unrecorded'`）。
 *
 * ## 身份＝现算，⛔ 不是新落的事实源（spec §6.8 裁决二）
 *
 * 「那一版是谁的」不落 `meta` 新键、不新落产物：`values.exit` 是**那一次表态的读数**（落在既有的
 * `工作区/决策/02.json` 的 `values` 里），`exploreConfirmStance(values)` 从它现算
 * `{ kind, humanAction, aiPrior }`。界面自述与判据都吃这同一份现算。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）
 *
 * · `values` 里**只认识 `exit` 一格**（另两格 `answerer`／`draft` 已退役，见下）。别的键（旧调用方
 *   塞进来的自由形态）一律**原样放过**——本模块不假装自己是 `values` 的全量形状闸。
 *   `values.exit` 缺席也合法（旧调用／`agent-tool` 窄路），那一档身份是 `unrecorded`，⛔ 不猜。
 * · 数组形态的 `values` 照旧合法（票 `cprb/10` 开的口子），本模块对它**零判据**。
 * · 「收卷人」闭集仍然只有三个值（`EXPLORE_CONFIRM_ANSWERERS`）——票 11 起它服务的是**回卷动作**的
 *   载荷闸与问卷面板，不再跟 `explore-confirm` 的 `values` 一起出现。
 * · **退役的两格当场点名**：`values.answerer`／`values.draft` 现在被 {@link exploreConfirmValuesProblems}
 *   400 拒收——⛔ 不许旧调用把它们悄悄落进结论件（「不再发」这件事因此是机器可判的）。
 */

/**
 * 站 2 那个动作的**规范名**（服务端 `case` 与判据认得的就是这个名字）。
 *
 * ⚠️ **壳的调用点必须把这个名字写成字面量**（`postAction({ action: "explore-confirm", ... })`）：
 * `test-contract-action-catalog.mjs` 的 `workbenchActionProperty()` 只认「调用实参里**唯一一个字面量**
 * `action`」——那是它抓「调用点与契约面动作目录漂移」的**全部强度**所在，⛔ 不能为了收编这个常量
 * 把它放宽成「读不出就跳过」。所以**动作名不进载荷构造器**（`exploreConfirmPayload()` 只造
 * `approved/reasons/note/values`），常量与调用点那个字面量的**同值**由判据对账。
 */
export const EXPLORE_CONFIRM_ACTION = 'explore-confirm'

/**
 * 两条放行出口的**机器取值**（人读文案住在界面那一侧，⛔ 不混进这份契约）。
 * 键名是「这次表态说的是哪条路」，值落进 `工作区/决策/02.json` 的 `values.exit`。
 */
export const EXPLORE_CONFIRM_EXITS = Object.freeze({
	/** 答问卷（收卷人交回的问卷回来了）。 */
	questionnaire: 'questionnaire',
	/** 没人动过（那一版仍成文，但身份是 AI 先验）。 */
	untouched: 'untouched',
})

/** 两条出口的取值域（`values.exit` 的闭集；期望值在判据里**手写**对账一次）。 */
export const EXPLORE_CONFIRM_EXIT_VALUES = Object.freeze(Object.values(EXPLORE_CONFIRM_EXITS))

/**
 * 收卷人闭集（ADR-0038 决策 1／7）：**谁填了这份问卷**（≠ 谁读这本书——后者是第一读者／`route`）。
 * 未成年那支「监护人或老师」不设系统默认（两者是**可得性**差异，不是准确度排序）。
 *
 * ⚠️ 票 11 起它服务两处：回卷载荷闸（`reader-questionnaire-submit` 的 `answerer` 字段）与问卷面板
 * 的三选一；⛔ 不再出现在 `explore-confirm` 的 `values` 里。
 */
export const EXPLORE_CONFIRM_ANSWERERS = Object.freeze(['本人', '监护人', '老师'])

/**
 * 没人动过那一版的**身份自述**（票 07 Q2／ADR-0041 决策 2 的原话，逐字）。
 *
 * ⚠️ 只此一处：界面照它写、站 3 的交办正文也照它写（「进 brief＝渲染进正文」那一半）；
 * ⛔ 卡里／引擎里不许再手抄一份同样的中文字面量（`test-wording-invariants.mjs` 有判据）。
 */
export const EXPLORE_CONFIRM_AI_PRIOR_STATEMENT = '本次按 AI 先验执行'

/** 现算出来的三档身份（⛔ 不落盘——每次从 `values` 现读）。 */
export const EXPLORE_CONFIRM_STANCE_KINDS = Object.freeze({
	/** 有一个人的动作（答问卷）。 */
	human: 'human',
	/** 没人动过：仍成文，但那一版是 AI 先验（未经确认）。 */
	aiPrior: 'ai-prior',
	/** 没有 `values.exit` 可读（`agent-tool` 那条窄路／旧调用／退役的 ai-draft）——⛔ 不声称身份。 */
	unrecorded: 'unrecorded',
})

/**
 * 从「这一次表态」的出口造出要落盘的 `values`——**载荷那一侧的唯一构造入口**。
 *
 * 只说真话的极简形状：出口必有。票 11 起**只此一格**（收卷人挪去回卷载荷、`draft` 随 ai-draft 退役）。
 *
 * @param {{exit?: string}} [input]
 * @returns {{exit: string}}
 */
export function exploreConfirmValues({ exit } = {}) {
	return { exit }
}

/**
 * `values` 那一格的**形状闸**（服务端动作层用它 400 拒收）。
 *
 * 说的只是**出口闭集**与**两个已退役字段**；`values` 的其余内容（别的键、数组形态、旧调用方塞的
 * 自由形态）**原样放过**——本模块不是 `values` 的全量形状闸（窄处见文件头）。空数组＝站得住。
 *
 * @param {unknown} values 请求体里的 `body.values`
 * @returns {string[]}
 */
export function exploreConfirmValuesProblems(values) {
	if (values === undefined || values === null) return []
	if (typeof values !== 'object') {
		return [`values（这一站的结构化值，如问卷结果）得是一个对象或数组（实为 ${typeof values}）`]
	}
	if (Array.isArray(values)) return [] // 数组形态是票 cprb/10 开的口子，本模块对它零判据。
	const problems = []
	const hasExit = Object.hasOwn(values, 'exit')
	if (hasExit && !EXPLORE_CONFIRM_EXIT_VALUES.includes(values.exit)) {
		problems.push(`values.exit 只认两条出口（${EXPLORE_CONFIRM_EXIT_VALUES.join('／')}），收到 ${JSON.stringify(values.exit)}`)
	}
	// 票 11：两个退役字段当场点名——「不再发」这件事不能只靠调用方自觉。
	if (Object.hasOwn(values, 'answerer')) {
		problems.push('values.answerer 已退役（票 ui-display-redesign/11）：收卷人改由回卷动作 reader-questionnaire-submit 的 answerer 字段写 meta.answerer，别再随 explore-confirm 发')
	}
	if (Object.hasOwn(values, 'draft')) {
		problems.push('values.draft 已退役（票 ui-display-redesign/11）：ai-draft 出口没有 UI 入口了，这一格不再成立')
	}
	return problems
}

/**
 * 壳那一侧的**载荷构造**——`confirmExplore(approved, feedback)` 除了动作名之外的全部字段。
 *
 * ⚠️ **它有意不带 `action`**：动作名必须由调用点写成**字面量**（`postAction({ action: "explore-confirm",
 * ...exploreConfirmPayload(...) })`），因为 `test-contract-action-catalog.mjs` 的提取器只认那一个字面量
 * ——把动作名收进这里就等于**拆掉那道闸**（详见 `EXPLORE_CONFIRM_ACTION` 的注释）。所以这里只造
 * `approved`／`reasons`／`note`／可选 `values`（`values` 的形状与身份现算都在本模块，一处写点）。
 *
 * `feedback` 认两样：`exit`（界面那条路）、`values`（显式整份，测试／将来沿用）；`reasons`／`note`
 * 是驳回那一支。没有 `exit`／`values` 时⛔ 不发 `values` 键（旧调用与 `agent-tool` 窄路照旧）。
 *
 * @param {{approved?: boolean, feedback?: object}} [input]
 * @returns {{approved: boolean, reasons: string[], note: string, values?: object}}
 */
export function exploreConfirmPayload({ approved, feedback = {} } = {}) {
	const payload = {
		approved: approved === true,
		reasons: Array.isArray(feedback?.reasons) ? feedback.reasons : [],
		note: typeof feedback?.note === 'string' ? feedback.note : '',
	}
	const values = valuesFromFeedback(feedback)
	if (values !== undefined) payload.values = values
	return payload
}

/** `feedback` → 要发的 `values`（没东西可发时返回 `undefined`，于是载荷⛔ 不长那个键）。 */
function valuesFromFeedback(feedback) {
	if (feedback === null || typeof feedback !== 'object') return undefined
	// 显式整份优先（测试与将来的调用方可以把已经拼好的 values 递进来）。
	if (feedback.values !== undefined && feedback.values !== null) return feedback.values
	if (typeof feedback.exit !== 'string' || feedback.exit === '') return undefined
	return exploreConfirmValues({ exit: feedback.exit })
}

/**
 * 「那一版的身份」的**唯一现算**（spec §6.8 裁决二）：从结论件的 `values` 现算，⛔ 不落盘。
 *
 * 票 11 起**不再从 `values` 现算收卷人**（`meta.answerer` 是回卷那一侧的事实，谁要读它就读 meta）——
 * 这一格只回答「有没有一个人的动作」。退役的 `ai-draft` 判成 `unrecorded`（⛔ 不冒充人的动作）。
 *
 * @param {unknown} values `工作区/决策/02.json` 的 `values`（可能不在／可能是旧形态）
 * @returns {{kind: string, exit: string|null, humanAction: boolean|null, aiPrior: boolean|null}}
 *   `kind` ∈ `human`／`ai-prior`／`unrecorded`；`unrecorded` 那一档两个布尔都是 `null`
 *   （⛔ 不猜「没记 = 没人的动作」）。
 */
export function exploreConfirmStance(values) {
	const base = { exit: null, humanAction: null, aiPrior: null }
	if (values === null || typeof values !== 'object' || Array.isArray(values)) {
		return { ...base, kind: EXPLORE_CONFIRM_STANCE_KINDS.unrecorded }
	}
	const exit = EXPLORE_CONFIRM_EXIT_VALUES.includes(values.exit) ? values.exit : null
	if (exit === EXPLORE_CONFIRM_EXITS.questionnaire) {
		return { kind: EXPLORE_CONFIRM_STANCE_KINDS.human, exit, humanAction: true, aiPrior: false }
	}
	if (exit === EXPLORE_CONFIRM_EXITS.untouched) {
		return { kind: EXPLORE_CONFIRM_STANCE_KINDS.aiPrior, exit, humanAction: false, aiPrior: true }
	}
	return { ...base, kind: EXPLORE_CONFIRM_STANCE_KINDS.unrecorded }
}
