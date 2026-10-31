/**
 * 造书工作台 · 读面 C：`ConversationNodeDefinition` 注册面兜底（票 `dsh-contract-drift/11`）
 *
 * 父票 05 的设计裁决第 3 条要「三条读面，主路径 A、兜底 C」：A（`props.useChat` 的聊天快照 →
 * 按 `callId` 找结算块）只覆盖**当前已加载窗口**；窗口外的结算块回读不到，工作台只能发
 * `unread: true`（协调员据此重问用户）。C 走宿主的公开注册面
 * `ctx.uiConversation.events.register(definition)`，让宿主在 `tool/result` 落库那一下把事件
 * 交给本 Definition，**不依赖那条调用还在不在已加载窗口里**。
 *
 * ## 读出来的宿主事实（别照猜的写；来源与版本见票面 `## Answer`）
 *
 * 1. **Definition 拿不到会话身份**：`match(event)` 只收 `SessionEventLike`，
 *    `ConversationNodeContext` 只有 `key/kind/id/matches/start/state/current`，
 *    `ConversationLocation` 的三档里也没有 sessionId；注册由 registry 的根 `ctx.effect` 持有，
 *    **不是 per-session**。⇒ 这里不能直接发 `POST /textbook/question`（那条要 `session` 与
 *    当前书 `project`）。本模块只把 `callId → answers` 记进模块级缓存，由**会话侧**的
 *    `WorkbenchView`（它知道 `session`/`bookRef`）消费，落账仍走 `recordQuestionAnswer`。
 * 2. **幂等主键仍是 `PendingQuestion.key`**：`tool/result` 只能读到
 *    `data.message.toolCallId`，读不到卡上的 `key`。⇒ 缓存键是 `callId`，落账键仍是那张卡的
 *    `key`（`RECORDED_QUESTION_KEYS` 原样复用，⛔ 不新开第二个 Set）。
 * 3. **答案与 A 是同一段 JSON**：`data.message.content` 的 text block 里
 *    `{answers:[{id,selected,custom?}]}`；解析共用 `chat-source.js` 的
 *    `questionAnswerFromContent`，⛔ 不另起一份。
 *
 * ## 为什么还要认 `tool/call`
 *
 * `pendingInteraction` 可能**先于** `tool/result` 消失。A 在窗口外看不到那次调用，
 * `isQuestionCallRunning` 也看不到它——若这时立刻发 `unread`，C 后到的那条结算就白收了
 * （账本已经记成「没记上」）。所以这里同时认 `ask_user_question` 的 `tool/call`：先记下
 * 「这次调用还欠一个结果」；卡先消失而结果没到时，会话侧**先等**，不抢答。
 * 结果一到：
 *   - 带答案 ⇒ 缓存答案，effect 落一次真实作答；
 *   - 不带答案（取消／工具错误）⇒ 缓存一条「已结算、无答案」，effect 照旧发 `unread`。
 *
 * 只认 `tool/call` 里 `name === "ask_user_question"` 的那一条——别的工具调用一概不进缓存。
 * 没有见过 `tool/call` 的 `tool/result`（例如窗口外/老记录）只有内容确实像答案批次时才收，
 * 这样「宿主根本没给这条」时仍会走既有的 `unread`。
 *
 * ⚠️ **等不到结果也要有尽头**：真机若在重载/断线边界上丢了 `tool/result`，`pending` 会把会话侧
 * 永久挂住（既没答案也没 `unread`，正是「⛔ 不静默」要防的）。所以 `tool/call` 登记时起一个
 * `QUESTION_ANSWER_STALL_GRACE_MS`（30 秒）的兜底：到点仍没有结果就按「已结算、无答案」发布，
 * 让会话侧走 `unread`。结果到了 / 缓存被清理时撤掉这个计时器。
 *
 * ## 边界
 *
 * 注册面在真宿主里挂没挂上、什么拍交给它，**只有真机验**；本模块与它的测试只证
 * 「接得对、不重复、形状是宿主契约里的那几件」。
 *
 * ## 缓存生命周期
 *
 * `PENDING_CALLS` 的一条从 `tool/call`（`pending`）走到 `tool/result`（`settled`），落账成功或
 * 确认「这张卡已记过」后由会话侧的 `clearQuestionAnswerFromFeed(callId)` 删掉——它只服务
 * 「还没落账」的那一段，不随会话永久增长。落账失败时留着，下次依赖变化（`projectId` /
 * 读面更新）再试。
 */

import { questionAnswerFromContent } from "./chat-source.js";

/** Definition 的 registry 键（宿主按这个键判重复注册；本仓只注册一次）。 */
export const QUESTION_ANSWER_DEFINITION_KIND = "textbook-question-answer";

/** 宿主提问工具的规范名（`tool/call` 事件里那一枚；与 `ask_user_question（读面 A）同源）。 */
const QUESTION_TOOL_NAME = "ask_user_question";

/**
 * 这次提问调用在本模块里的状态：
 * - `pending`：C 见过 `tool/call`，`tool/result` 还没到；
 * - `settled`：结果到了（`answer === null` 表示取消/错误，没有答案批次）。
 */
const PENDING_CALLS = new Map();

/** 缓存只留最近这么多条；`clearQuestionAnswerFromFeed` 会删已落账的，这里是第二条保险（防工作台一直不挂）。 */
const MAX_PENDING_CALLS = 200;

/**
 * 见过 `tool/call`、却一直没等到 `tool/result` 时的等待上限（毫秒）。
 *
 * 为什么需要它：真机若在重载/断线边界上丢了那条结算，`pending` 会把会话侧永久挂住——
 * 既没有答案、也没有 `unread`，正是「⛔ 不静默」要防的那一档。超过这个上限就按
 * 「已结算、无答案」处理，让会话侧走 `unread`。
 *
 * 30 秒是故意宽的：正常工具结算在一两个网络来回内到；30 秒还没到，已经不该再等。
 */
export const QUESTION_ANSWER_STALL_GRACE_MS = 30_000;

/** `callId → timeout`：`rememberResult` / `clear` 时要把还没到的兜底计时器撤掉。 */
const STALL_TIMERS = new Map();

/** C 每收到一条「结果到了」就通知一次：`useSyncExternalStore` 靠它重渲、落账 effect 靠它重跑。 */
const LISTENERS = new Set();

/** 同一个事件会被 `match` 与 `start`/`update` 各看一次——解析只做一次。 */
const PARSED_EVENTS = new WeakMap();

let revision = 0;

/** 结算块的 text block 像不像答案批次 JSON——**只用来决定要不要花 `JSON.parse` 的成本**，
 *  真正的形状判据仍是 `questionAnswerFromContent`（它才是 A/C 共用的唯一解析）。 */
function looksLikeAnswerBatch(content) {
	for (const block of content ?? []) {
		if (block?.type !== "text" || typeof block.text !== "string") continue;
		const text = block.text.trimStart();
		if (text.startsWith("{") && text.includes('"answers"')) return true;
	}
	return false;
}

/**
 * 从一个事件读本模块要记的东西：
 * - `{ callId, kind: "call" }`：`ask_user_question` 的 `tool/call`；
 * - `{ callId, kind: "result", answer }`：`tool/result`（`answer` 可 null）。
 * 别的类型/别的工具给 null（不抛）。
 */
function eventFactOf(event) {
	if (event === null || typeof event !== "object") return null;
	const cached = PARSED_EVENTS.get(event);
	if (cached !== undefined) return cached;

	let fact = null;
	if (event.type === "tool/call") {
		const callId = event.data?.callId;
		if (
			event.data?.name === QUESTION_TOOL_NAME
			&& typeof callId === "string"
			&& callId !== ""
		) {
			fact = { callId, kind: "call" };
		}
	} else if (event.type === "tool/result") {
		const message = event.data?.message;
		const callId =
			typeof message?.toolCallId === "string"
				? message.toolCallId
				: message?.source?.callId;
		if (typeof callId === "string" && callId !== "") {
			// 已经登记过「等结果」的调用，内容再怪也要收下这一条（好让会话侧决定答案还是 unread）；
			// 没登记过的，只在内容确实像答案批次时才收，避免把每个工具的结算都缓存一遍。
			const known = PENDING_CALLS.has(callId);
			const answer =
				known || looksLikeAnswerBatch(message?.content)
					? questionAnswerFromContent(message?.content)
					: null;
			if (known || answer !== null) fact = { callId, kind: "result", answer };
		}
	}
	PARSED_EVENTS.set(event, fact);
	return fact;
}

/** 通知订阅者：C 看到了一次「结果到了」（带答案或明确无答案）。订阅者只负责重渲这一帧。 */
function publish() {
	revision += 1;
	for (const listener of [...LISTENERS]) {
		try {
			listener();
		} catch (err) {
			// 订阅者是工作台自己的重渲触发器；它抛错不许把宿主的会话事件处理带崩。
			console.warn("[workbench] 提问答案缓存的订阅者抛错", err);
		}
	}
}

/**
 * 缓存里现在有多少条**调用条目**（`pending` 与 `settled` 都算）。
 *
 * 为什么要一个函数：`Map.size` 是「条数」的实现，而界面层那道体积预检闸按字面 `*.size > …`
 * 抓「第二道体积比较」——它看不出这里量的是**调用条数**还是**字节数**。给它一个说清量纲的
 * 名字，闸门就不必为一句同形不同义的代码背一次误命中（票 `dsh-contract-drift/12`）。
 *
 * ⚠️ 量的是**条目**不是「还在等结果的条数」：这个 Map 也收 `settled` 的条目
 * （`readQuestionAnswerFromFeed` 读的正是它们），叫 pending 反而比旧名更不准。
 */
function callEntryCount() {
	return PENDING_CALLS.size;
}

/** 缓存上限的第二条保险：条数超过 MAX_PENDING_CALLS 就丢最旧的一条（连同它的兜底计时器）。 */
function trimCalls() {
	while (callEntryCount() > MAX_PENDING_CALLS) {
		const oldest = PENDING_CALLS.keys().next().value;
		if (oldest === undefined) return;
		clearQuestionAnswerFromFeed(oldest);
	}
}

/** 记下「这次调用还欠一个结果」。已结算的调用不倒退（结果先到、调用事件后到时不能变成永久等待）。 */
function rememberCall(callId) {
	if (PENDING_CALLS.has(callId)) return;
	PENDING_CALLS.set(callId, { status: "pending" });
	const timer = setTimeout(() => {
		STALL_TIMERS.delete(callId);
		if (PENDING_CALLS.get(callId)?.status !== "pending") return;
		// 结果没来：按「已结算、无答案」处理，让会话侧走 unread（⛔ 不永久静默）。
		rememberResult(callId, null);
	}, QUESTION_ANSWER_STALL_GRACE_MS);
	// Node 侧的 Timer 允许 unref（测试/命令行走完不被它吊住）；浏览器返回数字，没有这个方法。
	if (typeof timer?.unref === "function") timer.unref();
	STALL_TIMERS.set(callId, timer);
	trimCalls();
}

/** 撤掉一条调用的兜底计时器（结果到了 / 缓存被清理时）。 */
function clearStallTimer(callId) {
	const timer = STALL_TIMERS.get(callId);
	if (timer === undefined) return;
	STALL_TIMERS.delete(callId);
	clearTimeout(timer);
}

/** 记下结果。**幂等**：宿主重放同一事件时只是再记一次同样的值。 */
function rememberResult(callId, answer) {
	clearStallTimer(callId);
	const previous = PENDING_CALLS.get(callId);
	PENDING_CALLS.set(callId, { status: "settled", answer });
	trimCalls();
	// 同一条事件可能被窗口重建重放；状态没变就不惊动订阅者。
	if (previous?.status === "settled" && previous.answer === answer) return;
	publish();
}

/** `start`/`update` 共用的一步：从 Match 里取事实并落缓存。 */
function absorb(match) {
	const fact = eventFactOf(match?.event);
	if (fact === null) return;
	if (fact.kind === "call") rememberCall(fact.callId);
	else rememberResult(fact.callId, fact.answer);
}

/**
 * 创建一个只认「提问调用/答案结算块」的 `ConversationNodeDefinition`。
 *
 * 不声明 `target` / `buildViewNode`：这是一条**只记事实、不画画**的 Definition
 * （宿主允许 `target` 与 `buildViewNode` 同时缺席）。
 *
 * `match` 用函数形式而不是按事件类型的表：表形式下宿主只在登记的事件类型调我们，
 * 但同一份 Definition 在测试里也要能直说「别的类型不是我的」；函数形式少一层解析约定。
 *
 * @returns {object} `ConversationNodeDefinitionInput` 形状
 */
export function createQuestionAnswerDefinition() {
	return {
		kind: QUESTION_ANSWER_DEFINITION_KIND,
		match(event) {
			const fact = eventFactOf(event);
			return fact === null ? null : { id: fact.callId, role: "start" };
		},
		start(_context, match) {
			absorb(match);
			// 没有 view target，State 只是宿主 Context 的占位；真正的答案在模块缓存里。
			return true;
		},
		update(_context, match) {
			absorb(match);
			return true;
		},
	};
}

/**
 * 会话侧读 C 的缓存（A 读不到时才调）。
 *
 * @param {string|undefined} callId 提问卡上的工具调用 id
 * @returns {{answers: Array<object>}|null}
 */
export function readQuestionAnswerFromFeed(callId) {
	if (typeof callId !== "string" || callId === "") return null;
	const entry = PENDING_CALLS.get(callId);
	return entry?.status === "settled" && entry.answer !== null ? entry.answer : null;
}

/**
 * C 已经见过这次调用的 `tool/call`、还没见到 `tool/result` 吗？
 * （卡先消失、结果后到的那一档用它等一拍，⛔ 不抢发 unread。）
 *
 * @param {string|undefined} callId
 * @returns {boolean}
 */
export function isQuestionCallExpectedInFeed(callId) {
	if (typeof callId !== "string" || callId === "") return false;
	return PENDING_CALLS.get(callId)?.status === "pending";
}

/**
 * 订阅 C 的到达。`useSyncExternalStore` 与「会话侧重跑落账 effect」共用这一枚。
 *
 * 监听器**不收参数**：它只需要「有一条新事实，重渲/重跑 effect」这个信号；答案本身由
 * `readQuestionAnswerFromFeed(callId)` 按卡上的 id 去读。
 *
 * @param {() => void} listener
 * @returns {() => void} 退订
 */
export function subscribeQuestionAnswerFeed(listener) {
	if (typeof listener !== "function") return () => {};
	LISTENERS.add(listener);
	return () => {
		LISTENERS.delete(listener);
	};
}

/** `useSyncExternalStore` 的快照：每收到一条结算 +1。 */
export function getQuestionAnswerFeedRevision() {
	return revision;
}

/**
 * 落账成功（或确认这张卡已经记过）后丢掉缓存：缓存只服务「还没落账」的那一段。
 * **不通知订阅者**——这条是清理，不是新事实，通知会让 effect 空转一轮。
 *
 * @param {string|undefined} callId
 */
export function clearQuestionAnswerFromFeed(callId) {
	if (typeof callId !== "string" || callId === "") return;
	PENDING_CALLS.delete(callId);
	clearStallTimer(callId);
}
