/**
 * 造书工作台 · 对话台的消息来源（宿主对话区用的同一份）
 *
 * 票 `dsh-contract-drift/02`：工作台原来在**会话快照**上读「消息列表」与「消息条数」——
 * 那两样不在它身上（会话快照只有 `running` / `queue` / `openState` 这些），所以聊天台恒空、
 * 自动打开页签的计数恒 0。这里改成读**聊天快照**里宿主对话区自己用的那一份：按宿主给的顺序
 * （`ChatSnapshot.order`）、只取要显示的那些。
 *
 * 形状的唯一出处是随代码入库的契约快照 `docs/reference/dsh-chat-contracts.md`
 * （摘自上游客 dsh 0.1.5-rc.3，头部写着来源路径与版本，升级 dsh 后人工核对）。三个要点：
 *
 *   1. `ChatSnapshot.nodes` 是**节点仓**、不是数组，且顶层**没有** `partial`
 *      （`partial` 只在那层自称「兼容投影」的 `legacy` 上，宿主自己零消费——本模块不碰它）。
 *   2. 节点仓的 `values()` 明说 `without imposing render order`，且 `get` 会把**隐藏**节点
 *      也给你——所以顺序只能走 `order`，可见性要自己按 `visibility` 过滤。
 *   3. 节点的业务载荷在 `node.data` 上（节点没有顶层 `content` / `blocks`）。
 *
 * **聊天台与「首次对话后自动打开工作台页签」共用这一个推导**（本文件是消息来源的唯一出口）：
 * 两处不许各自再读一遍、更不许有第二处计数。
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
