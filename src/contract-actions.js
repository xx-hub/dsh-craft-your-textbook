/**
 * 契约面动作目录：只保存动作身份与稳定 metadata。
 *
 * 这里是仓库内部 module，不接管 payload、授权、账本、阶段机或 HTTP 行为。
 */
const ACTION_FAMILIES = Object.freeze([
	'books',
	'wizard',
	'convert',
	'gates',
	'gold',
	'deep-modify',
	'collab-signals',
	'chapters',
	'patterns-ops',
])

// projectScope: no-book | session-book | global（只作事实，不执行 ownership）
// workbenchExposure: callable | read-only | null（read-only 只表示该调用专供展示，如 pattern-list）
// writesStationDecision: true 只标在「这一支会落 `工作区/决策/NN.json`」的动作上（票
// `decision-provenance/01` D3=A）——它是**动作身份的一部分**：HTTP adapter 据此决定「这一下要不要
// 先落一条人工动作事件」（`src/workflow.js` 的 `handleAction`）。
//
// ⚠️ **我的枚举面比现实窄在哪里**：这张表登记的是**动作面**的写点，⛔ 不含**机器工序站**——站 1
// （「材料就绪」）由 `engine.js` 的 `runPhase1` 直接写，不经任何动作，也永远不该拿人工动作章。
// 「有没有动作会写结论件却漏标这一格」由 `test-contract-action-catalog.mjs` 的
// 「会落结论件的动作逐个登记在目录里」逐 case 对账（双向闭包）；它断不了的是「某一条 case 的某一条
// 返回分支忘了落件」——那一半归各动作族自己的定向判据。要加新的结论件写点，同一次把这一格标上。
// name, family, projectScope, workbenchExposure, agentCallable, agentInput, mark, writesStationDecision
const ACTION_DEFINITIONS = [
	['book-create', 'books', 'no-book', 'callable', true, 'create', null],
	['book-rename', 'books', 'session-book', null, true, 'rename', null],
	['book-set-goal', 'books', 'session-book', null, true, 'set_goal', null],
	// 票 `walkthrough-fixes/19`①②：工作台那两个**用户可拧的旋钮**——篇幅档位（速览/标准/精读，
	// 由它派生章节数上限与每章字数目标）与并发上限（一次最多派几个小助手）。
	// 它是**代用户操作**那一类（与改书名/改目标同族），所以进 AI 闭包：用户在对话里说「写成小书」
	// 时，AI 引导用户拍板后替他把这一格落下。
	['book-set-knobs', 'books', 'session-book', 'callable', true, 'set-knobs', null],
	['book-delete', 'books', 'session-book', 'callable', true, 'delete', null],
	['wizard-suggest', 'wizard', 'no-book', 'callable', false, null, null],
	// ⚠️ 票 `pre-gold-build/02`：同族的 `suggest-roles`（上传那一刻的角色识别）**退役**——
	// 上传屏不再有「角色」这一栏，角色改由探查段开头那一趟书级材料判定产出。
	['convert-start', 'convert', 'session-book', 'callable', false, null, null],
	['retry-convert', 'convert', 'session-book', null, false, null, 'compatibility'],
	// 票 `mineru-formats/03`（CONTEXT.md「材料缺口」）：材料不齐时书停在材料准备，用户对
	// 每一份红源逐个表态——「补传」走既有的上传写面，「删掉这份」只有这一个动作。
	// **只对 `failed` 的那一格开放**（判在 handler），所以它不是「随便删一份材料」的后门。
	['source-remove', 'convert', 'session-book', 'callable', false, null, null],
	['nudge', 'convert', 'session-book', 'callable', true, 'nudge', null],
	['resume', 'convert', 'session-book', 'callable', true, 'resume', null],
	['gate-decide', 'gates', 'session-book', 'callable', true, 'gate', null, true],
	// 走查票 09（2026-10-06 裁决①）：`explore-confirm` 是**挡在相位上的硬闸门**
	// （`advance(project, 2, 3)`，`actions/gates.js`），同类兄弟 `outline-confirm` /
	// `chapters-review-confirm` / `final-approve` 全是 `agentCallable: true`——它此前够不着
	// 属于**漏登记**，不是「闸门不该给 AI」，所以补进 AI 闭包（agentInput 与规范名同名）。
	['explore-confirm', 'gates', 'session-book', 'callable', true, 'explore-confirm', null, true],
	['outline-confirm', 'gates', 'session-book', 'callable', true, 'outline-confirm', null, true],
	['chapters-review-confirm', 'gates', 'session-book', 'callable', true, 'chapters-review-confirm', null],
	['final-approve', 'gates', 'session-book', 'callable', true, 'final-approve', null],
	// 票 `walkthrough-fixes/37`：终检驳回意见的**拆条落账**（驳回那一刻由主笔调用，`redoItems` 每段
	// 必须是那句意见的连续子串）——重新交工的 `redoCheck` 与这一份条目集逐条对齐，漏一条拒收。
	// ⚠️ `workbenchExposure: null`：用户不按这颗键（他只在最后检查结果卡上写一句意见），
	// 拆条是主笔自己的活 ⇒ 它不进工作台可调用那一批，但进 AI 闭包（`agentInput` 与规范名同名）。
	['final-redo-items', 'gates', 'session-book', null, true, 'final-redo-items', null],
	['rollback', 'gates', 'session-book', 'callable', true, 'rollback', null],
	// 票 `walkthrough-fixes/19`③：**跳过**那一格。它与既有四类豁免（`gate-skip` / `audit-skip` /
	// `progress-skip` / `other`）**不是一回事**：那四类经 `waived()` 读 `meta.waivers`，是**取消该检查**；
	// 这一格走 `meta.skippedSteps` ＋ 一条账，是**把验货推迟并记账**（第三态「已跳过（未验）」）。
	// ⚠️ `agentCallable: false` 是**有意的**：裁决写着「谁跳的＝用户」，而豁免那条路已经明文规定
	// 「主笔 AI 不能自己豁免」——跳过若让 AI 自己发，账上那句「用户跳的」就成了假话。
	// ⇒ 它和 `review` / `gold-target-words-set` 同类：只在工作台界面由用户自己点。
	['skip-step', 'gates', 'session-book', 'callable', false, null, null],
	['gold-opinion', 'gold', 'session-book', 'callable', true, 'gold-opinion', null],
	['gold-opinion-revoke', 'gold', 'session-book', 'callable', true, 'gold-opinion-revoke', null],
	['gold-revise', 'gold', 'session-book', 'callable', true, 'gold-revise', null],
	['gold-chapter-set', 'gold', 'session-book', null, true, 'gold-chapter-set', null],
	// 票 `confirm-points-redesign-build/08`（站 8／站 9 拆屏）：**站 8 的两颗键**——
	// 「✅ 就用这一稿」（approved:true）与「🔁 不满意，重写这一章」（approved:false）是**同一个动作**
	// 的两个出口，两支都落 `工作区/决策/08.json`（「驳回也留」，规划票 04 §1）。
	// ⚠️ **能力档照 `gold-approve` 先例**（规划票 07 Q10 甲）：AI 可代操作、**但需用户明确同意**
	// ——它替用户对「这一稿行不行」表态，问不出这句同意就不许代按。
	// ⚠️ 它**不是**定稿键：定稿仍是 `gold-approve`（站 9 之后那一下，行为一个字没动）。
	['gold-draft-approve', 'gold', 'session-book', 'callable', true, 'gold-draft-approve', null, true],
	['gold-target-words-set', 'gold', 'session-book', 'callable', false, null, null, true],
	// 走查票 09（2026-10-06 裁决①）：`gold-approve` 是范例章定稿的**唯一放行键**，此前
	// `agentCallable: false` ——与 `gold-opinion` / `gold-revise` / `gold-chapter-set` 那三个
	// 兄弟不一致，且 `agent-tool.js` 的工具描述当时把「gold 定稿类」写成可调用（描述与闭包
	// 不一致，AI 照描述调它却撞「未知操作」）⇒ 同样是**漏登记**，补进 AI 闭包。
	['gold-approve', 'gold', 'session-book', 'callable', true, 'gold-approve', null],
	['deep-modify', 'deep-modify', 'session-book', 'callable', true, 'deep-modify', null],
	['deep-undo', 'deep-modify', 'session-book', 'callable', true, 'deep-undo', null],
	['style-note', 'collab-signals', 'session-book', null, true, 'style-note', null],
	['style-note-revoke', 'collab-signals', 'session-book', null, true, 'style-note-revoke', null],
	['intervene', 'collab-signals', 'session-book', null, true, 'intervene', null],
	['intervene-done', 'collab-signals', 'session-book', null, true, 'intervene-done', null],
	['waive', 'collab-signals', 'session-book', null, true, 'waive', null],
	['waive-revoke', 'collab-signals', 'session-book', null, true, 'waive-revoke', null],
	['pause', 'collab-signals', 'session-book', 'callable', true, 'pause', null],
	['review', 'chapters', 'session-book', 'callable', false, null, null],
	['review-revoke', 'chapters', 'session-book', 'callable', false, null, null],
	// 票 `knowledge-graph-build/08`：**第三条「意见」通路**——知识点图上「🗑 这部分不造进书里」／
	// 「↩ 放回来（要讲）」（`src/ui/knowledge-graph-map.js` 的对话框）。
	// ⚠️ 既有两条「意见」通路**各自绑死阶段**（`gold-opinion` 只认 `awaiting-gold`／`pendingStage==='gold'`；
	// `review`／带 `chapter` 的 `gold-opinion` 只认 `phase===5`），这一屏在**阶段二探查确认卡**上
	// （`status === 'awaiting-explore'`）⇒ 那两条都够不着它，只能**新开这一条**（spec §6 末段那条
	// 落地代价）。三条**互不认领**：各认各的 status／phase，谁都不认领别人的那一档（判据在
	// `test-collab-backend.mjs`，两个方向的反例都在）。
	// ⚠️ **2026-10-17 · 票 `reader-cognition-boundary-build/06` 改判：`agentCallable` false → true**
	//    （`agentInput` 与规范名同名）。原注逐字是「与 `review` 同类——『谁划的＝用户』，主笔 AI
	//    不能替人把这本书的内容判掉」——那一半**今天仍然成立**，变的只是「谁敲的键」这一格：
	//    `ADR-0040` 决策 2 选了「**AI 读回卷件、代笔落同一支动作**」（下沿那一档）⇒ 那一跳要 AI
	//    真够得着这条通路，而写侧形状**一个字不动**（唯一调用点仍是 `actions/chapters.js` 的
	//    `case 'graph-opinion'`、`by` 仍只有 `EXCLUSION_BY_USER`＝`user`、`reason` 仍两档闭集、
	//    那份件仍**不** `appendEvent`）。「谁的意思＝用户」由 `by` 与回卷件本身追溯，
	//    ⛔ 不给 `by` 加第二个值、⛔ 不新开动作。判据与那条「唯一写侧」的对账住
	//    `test/test-knowledge-map-exclusions.mjs` 第 ⑩ 节与 `test/test-contract-action-catalog.mjs`。
	['graph-opinion', 'chapters', 'session-book', 'callable', true, 'graph-opinion', null],
	['audit-submit', 'chapters', 'session-book', null, true, 'audit-submit', null],
	// 票 `walkthrough-2026-10/02`（走查 A10「同一文件多写者」的裁决）：**机器拼章正文**。
	// 子助手只落分片（`工作区/分片/chapter-NN-MM.md`），这一步按分片号拼出 `工作区/chapter-NN.md`；
	// 审计小助手读的就是机器拼出来的那一份（所以它必须在派审计**之前**被叫到）。
	// 它不是用户按的键（`workbenchExposure: null`）：用户看到的是章正文本身，拼装是内务。
	['chapter-assemble', 'chapters', 'session-book', null, true, 'chapter-assemble', null],
	['stage-submit', 'chapters', 'session-book', null, true, 'stage-submit', null],
	['stage-brief', 'chapters', 'session-book', null, true, 'stage-brief', null],
	// 票 `context-budget/18`：**派单正文改机器代填**——主笔只给「哪一档 ＋ 章号 ＋ 一句叮嘱」，
	// 机器按九份派发模板（＋ 终检那一节方法论文档）与这一段 brief／meta 的实际值拼好整份 prompt，
	// 由插件起子代理、把 id 回给主笔。
	// ⚠️ **名字有意不叫 `dispatch`**：`brief.dispatch` 已经占了那个词（票 02，含义是「该读／该产出的
	// 登记行」），一词两义正是 `CONTEXT.md` 里被当病治的「一号三用」（票 18 裁决条件 (a)）。
	// ⚠️ **归 `chapters` 族**：它派出去的活横跨五段（explore/gold/chapters/merge/final），但族是
	// 「实现单位」不是「只能管章」——`stage-brief` / `stage-submit` / `progress` / `chapter-assemble`
	// 那一族正是主笔在各工序里推流水线用的那一批，派单与它们同属一处；另立一个族只会多一处
	// 「族 id ≡ 文件名」的承重件而不多一分信息。
	// `workbenchExposure: null`：这不是用户按的键（用户看到的是章／报告本身），照 `stage-submit` 那一档。
	['agent-assign', 'chapters', 'session-book', null, true, 'agent-assign', null],
	['progress', 'chapters', 'session-book', null, true, 'progress', null],
	['suggest-words', 'patterns-ops', 'session-book', 'callable', false, null, null],
	['pattern-analyze', 'patterns-ops', 'session-book', 'callable', false, null, null],
	['pattern-list', 'patterns-ops', 'session-book', 'read-only', false, null, null],
	['settings', 'patterns-ops', 'global', 'callable', false, null, null],
	['demo-run', 'patterns-ops', 'no-book', 'callable', false, null, null],
	['debug-spawn', 'patterns-ops', 'session-book', null, false, null, 'internal-debug'],
	// 票 `knowledge-graph-build/12`：老书那颗「补一份知识点图」的键（补齐：已交出过材料报告、
	// 合并件里还没有图、且不是演示书的那本书）。机制全在 `src/workflow/knowledge-graph-build.js`
	// （票 04 的 `applyKnowledgeGraphBackfill`），这一条只是它的**身份**。
	// ⚠️ `agentCallable: false` 是**有意的**：这是「这本书要不要补一张图」的**用户表态**
	//（与 `review`／`skip-step`／`gold-target-words-set` 同类）——主笔 AI 不该替用户按这颗键。
	// `workbenchExposure: 'callable'`：它只在工作台界面由用户点（那张屏由票 12 落在阶段页）。
	['knowledge-graph-backfill', 'chapters', 'session-book', 'callable', false, null, null],
	// 票 `reader-cognition-boundary-build/03`：**读者情况问卷的往返通道**——`issue` 给出那一份
	// （服务端把纸屏两用的 `.md` 写进书夹，界面再走通用下载路由交给收卷人）、`submit` 收回卷
	// （造书用户把整段文字手粘回来，内容逐字落成书夹一份 `.md`）。
	// ⚠️ 两条都 `agentCallable: false`：发卷／粘回卷是**造书用户本人**的动作（与 `review`／
	//    `skip-step` 同一条理由——谁填的／谁粘的＝人，AI 不能代）。
	//    ⚠️ **2026-10-17（票 `rcb-build/06`）**：这一行原先还点着 `graph-opinion`，它已经**改判**为
	//    `agentCallable: true`（AI 读回卷件代笔那一条要够得着它）⇒ 这里把那个名字撤掉，⛔ 别照旧句读。
	// ⚠️ `workbenchExposure: 'callable'`：两颗键都在工作台界面上（问卷面板）。
	// ⚠️ 归 `chapters` 族：与站 2 的 `graph-opinion` 同一批「工序里由人动手」的动作，⛔ 不新开动作族
	//    （新族＝新 module ＋ 族闭包三处同改，而语义上它并不比 `chapters` 更窄）。
	['reader-questionnaire-issue', 'chapters', 'session-book', 'callable', false, null, null],
	['reader-questionnaire-submit', 'chapters', 'session-book', 'callable', false, null, null],
]

/**
 * 纯验证入口：只读检查一份目录定义，供 module 初始化与坏数据 fixture 使用。
 * 不缓存、不修改传入值，也不把 fixture 接入已加载目录。
 */
export function validateContractActionDefinition(definition) {
	if (!Array.isArray(definition?.actions) || !Array.isArray(definition?.families))
		throw new TypeError('动作目录定义必须包含 actions 与 families 数组')

	const familyNames = new Set(definition.families)
	const canonicalNames = new Set()
	for (const action of definition.actions) {
		if (typeof action?.name !== 'string' || action.name === '')
			throw new TypeError('动作目录含无效 canonical name')
		if (canonicalNames.has(action.name))
			throw new Error(`重复 canonical action: ${action.name}`)
		if (!familyNames.has(action.family))
			throw new Error(`未知动作族: ${action.family}`)
		canonicalNames.add(action.name)
	}

	const aliases = new Set()
	for (const action of definition.actions) {
		if (action.agentInput == null) continue
		if (typeof action.agentInput !== 'string' || action.agentInput === '')
			throw new TypeError(`动作 ${action.name} 的 AI input 无效`)
		if (action.agentInput === action.name) continue
		if (canonicalNames.has(action.agentInput))
			throw new Error(`AI input 与 canonical action 冲突: ${action.agentInput}`)
		if (aliases.has(action.agentInput))
			throw new Error(`重复 AI alias: ${action.agentInput}`)
		aliases.add(action.agentInput)
	}
}

const CONTRACT_ACTIONS = Object.freeze(
	ACTION_DEFINITIONS.map(
		([name, family, projectScope, workbenchExposure, agentCallable, agentInput, mark, writesStationDecision]) =>
			Object.freeze({
				name,
				family,
				projectScope,
				workbenchExposure,
				agentCallable,
				agentInput,
				mark,
				writesStationDecision: writesStationDecision === true,
			}),
	),
)
validateContractActionDefinition({ actions: CONTRACT_ACTIONS, families: ACTION_FAMILIES })

const ACTION_BY_NAME = new Map(CONTRACT_ACTIONS.map((action) => [action.name, action]))
const STATION_DECISION_ACTION_NAMES = Object.freeze(
	CONTRACT_ACTIONS.filter((action) => action.writesStationDecision).map((action) => action.name),
)
const AGENT_ACTION_INPUTS = Object.freeze(
	CONTRACT_ACTIONS.filter((action) => action.agentCallable).map((action) => action.agentInput),
)
const ACTION_BY_AGENT_INPUT = new Map(
	CONTRACT_ACTIONS.filter((action) => action.agentCallable).map((action) => [action.agentInput, action]),
)

/** 返回全部规范动作的只读清单。 */
export function listContractActions() {
	return CONTRACT_ACTIONS
}

/** 返回全部动作族的只读清单。 */
export function listActionFamilies() {
	return ACTION_FAMILIES
}

/** 返回主笔 AI 工具当前的精确输入名，不补 canonical alias。 */
export function listAgentActionInputs() {
	return AGENT_ACTION_INPUTS
}

/**
 * 返回**会落拍板结论**的动作名（票 `decision-provenance/01` D3=A 的唯一声明面）。
 *
 * 唯一消费者是 HTTP adapter（`src/workflow.js` 的 `handleAction`）：只有这几个动作在「工作台通道」
 * 发来时先落一条人工动作事件，动作族才有东西交给 `recordStationDecision` 去查。⛔ 别的 module
 * 不该再手抄一份这几个名字（那是第二份动作清单，`test-contract-action-catalog.mjs` 会红）。
 */
export function listStationDecisionActions() {
	return STATION_DECISION_ACTION_NAMES
}

/** 按 HTTP canonical name 查询；未知名称返回 null。 */
export function getContractAction(name) {
	return ACTION_BY_NAME.get(name) ?? null
}

/** 把主笔 AI 精确输入名单向解析为 canonical action；未知输入返回 null。 */
export function resolveAgentAction(input) {
	return ACTION_BY_AGENT_INPUT.get(input) ?? null
}
