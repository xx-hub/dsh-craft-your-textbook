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
// name, family, projectScope, workbenchExposure, agentCallable, agentInput, mark
const ACTION_DEFINITIONS = [
	['book-create', 'books', 'no-book', 'callable', true, 'create', null],
	['book-rename', 'books', 'session-book', null, true, 'rename', null],
	['book-set-goal', 'books', 'session-book', null, true, 'set_goal', null],
	['book-delete', 'books', 'session-book', 'callable', true, 'delete', null],
	['wizard-suggest', 'wizard', 'no-book', 'callable', false, null, null],
	['suggest-roles', 'wizard', 'no-book', 'callable', false, null, null],
	['convert-start', 'convert', 'session-book', 'callable', false, null, null],
	['retry-convert', 'convert', 'session-book', null, false, null, 'compatibility'],
	['nudge', 'convert', 'session-book', 'callable', true, 'nudge', null],
	['resume', 'convert', 'session-book', 'callable', true, 'resume', null],
	['gate-decide', 'gates', 'session-book', 'callable', true, 'gate', null],
	['explore-confirm', 'gates', 'session-book', 'callable', false, null, null],
	['outline-confirm', 'gates', 'session-book', 'callable', true, 'outline-confirm', null],
	['chapters-review-confirm', 'gates', 'session-book', 'callable', true, 'chapters-review-confirm', null],
	['final-approve', 'gates', 'session-book', 'callable', true, 'final-approve', null],
	['rollback', 'gates', 'session-book', 'callable', true, 'rollback', null],
	['gold-opinion', 'gold', 'session-book', 'callable', true, 'gold-opinion', null],
	['gold-opinion-revoke', 'gold', 'session-book', 'callable', true, 'gold-opinion-revoke', null],
	['gold-revise', 'gold', 'session-book', 'callable', true, 'gold-revise', null],
	['gold-chapter-set', 'gold', 'session-book', null, true, 'gold-chapter-set', null],
	['gold-target-words-set', 'gold', 'session-book', 'callable', false, null, null],
	['gold-approve', 'gold', 'session-book', 'callable', false, null, null],
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
	['audit-submit', 'chapters', 'session-book', null, true, 'audit-submit', null],
	['stage-submit', 'chapters', 'session-book', null, true, 'stage-submit', null],
	['stage-brief', 'chapters', 'session-book', null, true, 'stage-brief', null],
	['progress', 'chapters', 'session-book', null, true, 'progress', null],
	['suggest-words', 'patterns-ops', 'session-book', 'callable', false, null, null],
	['pattern-analyze', 'patterns-ops', 'session-book', 'callable', false, null, null],
	['pattern-list', 'patterns-ops', 'session-book', 'read-only', false, null, null],
	['settings', 'patterns-ops', 'global', 'callable', false, null, null],
	['demo-run', 'patterns-ops', 'no-book', 'callable', false, null, null],
	['debug-spawn', 'patterns-ops', 'session-book', null, false, null, 'internal-debug'],
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
		([name, family, projectScope, workbenchExposure, agentCallable, agentInput, mark]) =>
			Object.freeze({ name, family, projectScope, workbenchExposure, agentCallable, agentInput, mark }),
	),
)
validateContractActionDefinition({ actions: CONTRACT_ACTIONS, families: ACTION_FAMILIES })

const ACTION_BY_NAME = new Map(CONTRACT_ACTIONS.map((action) => [action.name, action]))
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

/** 按 HTTP canonical name 查询；未知名称返回 null。 */
export function getContractAction(name) {
	return ACTION_BY_NAME.get(name) ?? null
}

/** 把主笔 AI 精确输入名单向解析为 canonical action；未知输入返回 null。 */
export function resolveAgentAction(input) {
	return ACTION_BY_AGENT_INPUT.get(input) ?? null
}
