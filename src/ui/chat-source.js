/**
 * 造书工作台 · 对话台的消息来源（宿主对话区用的同一份）
 *
 * 票 `dsh-contract-drift/02`：工作台原来在**会话快照**上读「消息列表」与「消息条数」——
 * 那两样不在它身上（会话快照只有 `running` / `openState` 这些；⚠️ 也没有 `queue`——0.1.7
 * 把它连同 `QueuedMessage` 一起删了，票 03），所以聊天台恒空、自动打开页签的计数恒 0。
 * 这里改成读**聊天快照**里宿主对话区自己用的那一份：按宿主给的顺序
 * （`ChatSnapshot.order`）、只取要显示的那些。
 *
 * 形状的唯一出处是随代码入库的契约快照 `docs/reference/dsh-chat-contracts.md`
 * （摘自上游客 dsh 0.1.7-rc.2，头部写着来源路径与版本，升级 dsh 后人工核对）。三个要点：
 *
 *   1. `ChatSnapshot.nodes` 是**节点仓**、不是数组，且顶层**没有** `partial`
 *      （`partial` 只在那层自称「兼容投影」的 `legacy` 上，宿主自己零消费——本模块不碰它）。
 *   2. 节点仓的 `values()` 明说 `without imposing render order`，且 `get` 会把**隐藏**节点
 *      也给你——所以顺序只能走 `order`，可见性要自己按 `visibility` 过滤。
 *   3. 节点的业务载荷在 `node.data` 上（节点没有顶层 `content` / `blocks`）。
 *
 * **聊天台与「首次对话后自动打开工作台页签」共用这一个推导**（本文件是消息来源的唯一出口）：
 * 两处不许各自再读一遍、更不许有第二处计数。
 *
 * 票 `dsh-contract-drift/10` 起，**提问卡的答案**也走这同一份推导：`findQuestionAnswerByCallId`
 * 按 `callId` 从 `tool-result` 结算块回读答案，`isQuestionCallRunning` 看那次调用还在不在跑。
 * 它们与对话台共用 `order` ＋ 节点仓那一遍遍历——读面 A 只此一处，⛔ 不在别处再走一遍。
 *
 * 票 `dsh-contract-drift/11` 起，**读面 C**（`ConversationNodeDefinition` 注册面）读的是
 * `tool/result` 事件里**同一段 JSON**。解析因此抽成 `questionAnswerFromContent(content)`：
 * A 从 `ToolResultNode.content` 调它，C 从 `ToolResultMessage.content` 调它，⛔ 不各写一份。
 */

/** 不属这一栏的**页脚行**（契约快照 §3）：`turn-tail` 是「完成的这一回合」的页脚
 *  （宿主原文：`Turn-local footer row that owns actions and optional feature contributions`），
 *  与消息不是一回事，不进对话台镜像。 */
export const CHAT_DESK_FOOTER_KINDS = new Set(["turn-tail"]);

/**
 * 从聊天快照取「要显示的那些节点」，**按宿主给的渲染顺序**。
 *
 * 顺序与过滤都照宿主自己的对话区（契约快照 §4 的 `orderedVisibleChatNodes`：
 * 先滤 `visibility === 'visible'`，再按宿主排好的序渲染）——`order` 本身就是那个函数的产物，
 * 这里逐 key 取回节点，并**再滤一次** `visibility`（宿主自己的读取也这么做，见快照 §4 末）。
 *
 * 容错：宿主还没挂上聊天目标时 `useChat` 会给 `EMPTY_CHAT_SNAPSHOT`；老会话记录给不出
 * v3 日志时也可能缺项。取不到就返回空清单，绝不抛——这个函数喂的是槽位里的组件。
 *
 * @param {object|null|undefined} chat 聊天快照（`useChat((s) => s)`）
 * @returns {Array<object>} 要显示的节点，按宿主顺序
 */
export function deriveChatDeskNodes(chat) {
	const order = chat?.order;
	const store = chat?.nodes;
	if (!Array.isArray(order) || store === null || store === undefined) return [];
	const get = typeof store.get === "function" ? store.get.bind(store) : null;
	if (get === null) return [];
	const nodes = [];
	for (const key of order) {
		const node = get(key);
		if (node === null || node === undefined) continue;
		if (node.visibility !== "visible") continue;
		if (CHAT_DESK_FOOTER_KINDS.has(node.kind)) continue;
		nodes.push(node);
	}
	return nodes;
}

/** 结算块里 text block 的正文（契约快照 §3：`ToolResultNode.content` 是 `ContentBlock[]`）。 */
function toolResultText(content) {
	const parts = [];
	for (const block of content ?? []) {
		if (block?.type === "text" && typeof block.text === "string") parts.push(block.text);
	}
	return parts.join("\n");
}

/**
 * 把一段结算正文解析成答案批次——**读面 A 与读面 C 的唯一解析**（票 `dsh-contract-drift/11`）。
 *
 * 形状：text block 的 JSON `{answers:[{id,selected,custom?}]}`（契约快照 §1；工具出参 schema）。
 * 不是 JSON、或不是这个形状 ⇒ `null`（调用方继续找/走兜底），⛔ 不抛。
 *
 * @param {unknown} text 结算正文
 * @returns {{answers: Array<object>}|null}
 */
function parseQuestionAnswerText(text) {
	if (typeof text !== "string" || text === "") return null;
	try {
		const parsed = JSON.parse(text);
		if (parsed !== null && typeof parsed === "object" && Array.isArray(parsed.answers)) {
			return parsed;
		}
	} catch {
		// 不是 JSON 的结算块（别的工具/别的输出形状）——这一条不是。
	}
	return null;
}

/**
 * 从 `ContentBlock[]`（`ToolResultNode.content` / `ToolResultMessage.content`）读答案批次。
 *
 * 票 `dsh-contract-drift/11`：读面 A（聊天快照里的 `ToolResultNode`）与读面 C
 * （`tool/result` 事件的 `data.message`）读的是**同一段 JSON**，所以解析只此一处。
 *
 * @param {unknown} content 结算块的内容数组
 * @returns {{answers: Array<object>}|null}
 */
export function questionAnswerFromContent(content) {
	return parseQuestionAnswerText(toolResultText(content));
}

/** 聊天快照里 `callId` 对得上的工具行根（`ToolCallBlock`）：正在跑的与定稿的都在。
 *  `callId` 缺席/空串（blocking 型）⇒ 一条都不给。 */
function* questionCallRoots(chat, callId) {
	if (typeof callId !== "string" || callId === "") return;
	for (const node of deriveChatDeskNodes(chat)) {
		if (node.kind !== "tool-call") continue;
		const root = node.data?.root;
		if (root?.callId === callId) yield root;
	}
}

/**
 * 从聊天快照按 `callId` 找回提问卡那次结算的答案（读面 A）。
 *
 * 票 `dsh-contract-drift/10`：宿主 0.2.0-rc.2 删掉了 `PendingQuestion.result` 那枚
 * 「用户提交答案时兑现」的 promise，答案本身没丢——它是 `ask_user_question` 那次工具
 * 调用的结算 output。这里按 `callId` 在聊天快照里找那条 `tool-result` 节点，读它
 * `content` 里那段 JSON `{answers:[{id,selected,custom?}]}`（契约快照
 * `docs/reference/dsh-user-question-contracts.md` §1、`dsh-chat-contracts.md` §3）。
 *
 * ⚠️ **只覆盖当前已加载窗口内的结算调用**：窗口外的旧调用不在这份快照里，
 * 回读不到 ⇒ 调用方发 `unread: true`（⛔ 不静默）。这里**不抛**：不是 JSON、不是
 * 答案批次的结算块都只是「这一条不是」，继续找下一条。
 *
 * @param {object|null|undefined} chat 聊天快照（`useChat((s) => s)`）
 * @param {string|undefined} callId 提问卡上的工具调用 id（blocking 型没有）
 * @returns {{answers: Array<object>}|null} 答案批次；找不到/形状不对返回 null
 */
export function findQuestionAnswerByCallId(chat, callId) {
	for (const root of questionCallRoots(chat, callId)) {
		if (root.kind !== "tool-result") continue;
		const answer = questionAnswerFromContent(root.content);
		if (answer !== null) return answer;
	}
	return null;
}

/**
 * 那次提问的工具调用**还在跑**吗（读面 A 的另一半，票 `dsh-contract-drift/10`）。
 *
 * 为什么需要它：用户点「提交」那一刻，卡片状态（`pendingInteraction`）可能**先于**
 * 工具结算块从宿主那一侧消失——两个 store 不是同一拍更新。若只看「卡没了 + 没有结算块」
 * 就发 `unread: true`，真实主路径（结算块晚一个网络来回才到）会被抢答成「没记上」。
 * 所以调用方在宣布「读不到」之前先看这条：同一个 `callId` 的 `RunningToolCall` 还在
 * ⇒ 结算块还没到，等它；`tool-result` 到了（哪怕内容读不出答案）或这条调用已不在窗口里
 * ⇒ 才是真的读不到。
 *
 * @param {object|null|undefined} chat 聊天快照
 * @param {string|undefined} callId 提问卡上的工具调用 id
 * @returns {boolean} 该调用仍在跑
 */
export function isQuestionCallRunning(chat, callId) {
	for (const root of questionCallRoots(chat, callId)) {
		// 定稿的那一形态带 `kind: 'tool-result'`（契约快照 §3）；其余就是 `RunningToolCall`。
		if (root.kind !== "tool-result") return true;
	}
	return false;
}
