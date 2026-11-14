/**
 * 动作族 seam：一次动作请求进、一次应答出（票 `workflow-seams/03`）。
 *
 * 本 module 只做两件事，其余全部留在缝后面：
 *   1. **回包词汇**：`reject(status, error)` / `accept(fields)`——136 处 `sendJson(res, N, B)` 里
 *      绝大多数的 body 就是 `{ok:false, error}` 这一种形状，收成构造器之后这条不变量
 *      （「任何 4xx/5xx 都带 `ok:false` 且 `error` 非空」）可以在 interface 上断言一次。
 *   2. **族 interface 的形状**：`familyOf(family, impl)` 把「七个位置参数」包成
 *      「一个请求对象」，并把族 id 贴在函数上（不可枚举）——`HANDLER_OF_FAMILY` 那张表一个字不用改。
 *
 * 另加一道 `assertReply` 响亮守卫：某个族忘了回包时，错误原文要指向**哪个动作没回**，
 * 而不是退化成一句骗人的 `Cannot read properties of undefined (reading 'status')`。
 * 它是 `runAction` 的**实现细节，不导出**（code-review 2026-09：规格从未点名这个导出）。
 *
 * ⚠️ 本 module **不认识 HTTP**：不碰 `res`、不调 `flushMeta`、不吞异常。
 * 响应由 `src/workflow.js` 的 `handleAction` 那一次 `sendJson` 写出，
 * 落盘边界随它一起（I2）。
 *
 * ⚠️ **I2 · 回包 ≠ 落盘**：落盘边界（`flushMeta`）**故意留在 `sendJson` 里不动**。
 * `test-material-gap-stance.mjs` 从 engine 直接 import `flushMeta()` 调用 7 处，那条路径根本不经
 * HTTP —— 所以「落盘 = 响应边界」从来不是完整事实，只是被 HTTP adapter 顺带满足的约定。
 * **今天没有例外路径**：本 module 的唯一调用方是 `workflow.js` 里那个不导出的
 * `dispatchAction`，它只被 `handleAction` 调，落盘照旧跟着那次 `sendJson` 走。
 * 把这条写成明文不变量，是为了让下一个想提前落盘、或者想把 seam 提成测试面的人
 * **先撞到它**（票 03 第 4 步试过一次，已撤回，见 `src/workflow.js` 的 `dispatchAction`）。
 */

/**
 * 一次动作的应答。
 *
 * ⚠️ 字段名是 `json` 不是 `body`——`workbench-fake-host.mjs` 今天就已经
 * `return { status: finished.status, json }`，而 `test-flow-transitions.mjs`
 * （票 `test-chain-latency/04` 起按**实测耗时**拆成 `test-flow-transitions-matrix.mjs` 与
 * `test-flow-transitions-chapters.mjs` 两半，**两半合计**才是这里说的那个面）有 120 处
 * `.json` 断言与 140 处 `callAction(` 调用点（写这条注释时的读数；读数会漂，今天两半合计
 * 按词边界数是 164 处 `.json`／154 处 `callAction(`，取样：
 * `Select-String -Path test/test-flow-transitions-*.mjs -Pattern '\.json\b','callAction\('`）。
 * 叫 `json` ⇒ 那些一行不改。
 *
 * @typedef {{ readonly status: number, readonly json: object }} ActionReply
 */

/**
 * 一次动作请求的全部输入。
 *
 * @typedef {object} ActionRequest
 * @property {object} ctx        宿主上下文。`ctx.get` 的读取点按**文件路径**登记在宿主契约门禁里
 *                               （`dev/host-contract-gate/catalog/web-chat.js` 的 `dynamicHostEntries`
 *                               ＋ `web-target.js` 按路径扫源码），**本票一个都不挪**。
 * @property {string} action      规范动作名（`src/contract-actions.js` 的 <!--r:catalog.canonical-->54<!--/r--> 个之一）。
 * @property {string} sessionId   会话身份，已过 `requireSession`（非空）。
 * @property {string|undefined} project 书夹 id；`no-book` 的动作上它可以是 undefined。
 * @property {object} body        `readBody(req)` 之后那一份，**原样透传**：实现继续读
 *                               `body.gate` / `body.files` / `body.note`。
 * @property {{eventId: string, at: string}|null} [humanEvent] HTTP adapter 落下的人工动作事件
 *                               （票 `decision-provenance/01` D3=A）。只有工作台通道会带；AI 的
 *                               `agent-tool` 通道恒为 `null` ⇒ 动作族把它透传给
 *                               `recordStationDecision`，后者据此决定 human／machine。
 */

/**
 * 动作族的 implementation 形状：**一个**位置参数（原来七个，其中 `_req` 在九个族里引用 0 次、
 * `res` 只当 `sendJson` 的第一个实参）。
 *
 * 返回 `undefined` 表示「这个族没有这个动作的 case」——adapter 照旧什么都不写
 * （今天 handler 掉出 switch，socket 挂着）。**改成回 400 是行为变化**，不许顺手做。
 *
 * @callback ActionHandler
 * @param {ActionRequest} request
 * @returns {Promise<ActionReply|undefined>}
 */

/**
 * 回包词汇 · 拒绝：body 就是 `{ ok: false, error }`。
 *
 * ⚠️ **键序是字节身份的一部分**——`JSON.stringify` 按插入序输出，
 * 所以这里是 `ok` 在前、`error` 在后，与原 `sendJson(res, N, { ok: false, error: … })` 逐字节相同。
 *
 * @param {number} status 真实 HTTP 状态码（族 implementation 不认识 HTTP 框架，只给数字）。
 * @param {string} error  说人话的拒绝理由，逐字上屏。
 * @returns {ActionReply}
 */
export function reject(status, error) {
	return { status, json: { ok: false, error } }
}

/**
 * 回包词汇 · 接受：`{ ok: true, …fields }`。
 *
 * ⚠️ **不自动补 `project`**：61 个 `ok:true` 回包里有 49 个把 `project` 排第一，
 * 自动补就等于改键序 —— 那就不是「零行为变化」了。要什么字段调用方自己按原序给。
 *
 * @param {object} fields 追加在 `ok` 之后的字段，**按原回包的键序**。
 * @returns {ActionReply}
 */
export function accept(fields) {
	return { status: 200, json: { ok: true, ...fields } }
}

/**
 * 回包守卫：族必须回一个 `{status, json}`，或者 `undefined`（= 没有这个 case）。
 *
 * 少了它，某个分支忘了 `return` 会得到 `Cannot read properties of undefined (reading 'status')`
 * ——一句**指向错误原因之外**的 500。装配错响着抛，与 `src/workflow/registration.js` 同一口径。
 *
 * @param {ActionReply|undefined} reply
 * @param {string} action 规范动作名（错误原文要指向它）。
 * @returns {ActionReply|undefined}
 */
function assertReply(reply, action) {
	if (reply === undefined) return undefined
	if (
		reply === null ||
		typeof reply !== 'object' ||
		typeof reply.status !== 'number' ||
		reply.json === null ||
		typeof reply.json !== 'object'
	) {
		throw new TypeError(
			`动作 ${action} 的族实现没有回包（每个分支都必须 return reject(...) / accept(...)）`,
		)
	}
	return reply
}

/**
 * **入口点**：跑一次动作，回一次包。
 *
 * 本 module **不碰 res、不调 flushMeta、不吞异常**（I2）。
 * 归属失败由 `assertSessionOwned` 抛出，经调用方的 catch 变成 500 + `logger.warn`——
 * **不是 403**（`/textbook/upload` 才是 403；两条路径今天就不一致，本票不许统一）。
 *
 * @param {ActionHandler} handler 族 implementation。
 * @param {ActionRequest} request 一次动作的全部输入。
 * @returns {Promise<ActionReply|undefined>}
 */
export async function runAction(handler, request) {
	return assertReply(await handler(request), request.action)
}

/**
 * 把「七个位置参数的族实现」包成「一个请求对象的族实现」，并贴上族 id。
 *
 * ⚠️ **九个别删**：`test-contract-action-catalog.mjs` 从**源码文本**正则抠
 * `HANDLER_OF_FAMILY = new Map([...])`，要求每个 `act*` 绑定名匹配正则 `act[A-Z]\w*`
 * 且 import 自 `./workflow/actions/<族>.js`；另有 `test-context-vocabulary.mjs:101`
 * 把「探查」钉在 `gates.js`、`test-gate-write-points.mjs:158-159` 点名读四个族文件。
 * ⇒ 族 module 不能删、不能合、不能改名。改完之后它们会变成**近乎空壳的文件**——
 * **那是承重件不是忘了删**，见 `.scratch/workflow-seams/issues/03` 约束 3。
 *
 * @param {string} family 族 id，必须与本 module 文件名同源。
 * @param {(request: ActionRequest) => Promise<ActionReply|undefined>} impl 族实现。
 * @returns {ActionHandler}
 */
export function familyOf(family, impl) {
	// 族实现只认一种形状：一个请求对象。**本 module 不碰 `res`**（票 03 第 3 步起
	// `handleAction` 经 `dispatchAction` 传请求对象，响应由分发那一处写）。
	const handler = async (request) => impl(request)
	// 不可枚举：族归属只是给装配期与诊断看的，不许混进函数自己的可枚举属性里。
	//
	// ⚠️ **今天还没有消费方**（code-review 2026-09 实测：全仓无人读 `handler.family`；
	// `test-contract-action-catalog.mjs:620` 的族是从源码锚定的那张表派生的）。
	// 它是**为将来的诊断/装配校验预留**的一处挂点，不是当前任何逻辑的依赖——
	// 删掉它不影响任何测试。真要有消费方时，这条注释连同实现一起复核。
	Object.defineProperty(handler, 'family', { value: family, enumerable: false })
	return handler
}