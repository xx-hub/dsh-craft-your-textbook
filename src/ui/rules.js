/**
 * 造书工作台 · 前端私有纯函数
 *
 * UI 侧的纯推导：章级徽章、账本事件推导（已完成章）、自动跟随判定、段落切分/对比等。
 * 零 React、零副作用——冒烟测试直接穿过这里断言。
 * 双端共享的领域常量与规则（素材角色、范例章号、六阶段、事件类型清单）
 * 在 src/domain-rules.js —— 单一事实来源，勿在此手抄。
 */

export function formatTime(time) {
	return new Date(time).toLocaleTimeString("zh-CN", { hour12: false });
}

// ── 兜底出口 `fallbackWord`（票 `ui-systematic-fixes/02` · spec 实现决策 §1·3、§2）──────────
//
// 每一张「机器值 → 人话」的表都要回答同一个问题：**表里没有这个值时说什么**？在此之前这个
// 答案被抄了 7 遍（意见 kind 6 处、意见状态 1 处），一律是 `表[值] ?? 值`——而那一条恰恰是错的：
// 它把**闭集里漏登记**的值原样印到屏上。同一个未登记的 kind 甚至两条相反取向并存
// （章节卡整格不出、谈判桌原样露机器词），矛盾就长在这 7 份副本里（spec §2 的判据）。
//
// 处置：兜底方向**只在这里决定**，按「这个值是谁产的」分两条路（spec §2）：
//   · `FALLBACK_CLOSED`（缺省）＝**闭集**（`status`／`outcome`／`kind`／`gate.status`，值由本仓
//     代码产生）未登记 ⇒ **不印**（返回 `null`）。表漏了是 bug、不是「猜不出来」，由
//     `test-wording-invariants.mjs` 的 G3 逐表报红（票 `ui-systematic-fixes/02`）。
//   · `FALLBACK_FREE`＝**自由文本**（AI 拼的 label、旧账本里的标签）译不出 ⇒ **原样返回**；
//     既有裁定「宁可露出机器词，也不猜错」一个字不动（`stageLabelHuman`／`stageHuman`／
//     `eventHuman`／`checkHuman` 这一档都走它，行为保持）。
//
// ⚠️ **「唯一形态」这句话的边界**：本函数让「查表 → 表里没有」这件事只剩一处（不写
// `表[值] ?? 值`，改用 `Object.hasOwn` 判定）；判据扫的是 `src/ui/**` 里那一个形态 ＋ 一张
// **带理由**的豁免表（回放域那份有意措辞不同的短动词表）。**不是**「所有兜底都只有一份」：
// 兜底值不是原值的那些（`PHASE_UI[n] ?? ""`、`分段标题 ?? segmentHuman(seg)`）各有自己的语义，
// 不在这个接缝上。

/** 闭集（值由本仓代码产生）：未登记 ⇒ **不印**（`null`）。缺省方向。 */
export const FALLBACK_CLOSED = "closed";
/** 自由文本（AI 拼的 label、旧账本标签）：未登记 ⇒ **原样返回**。 */
export const FALLBACK_FREE = "free";

/**
 * 兜底出口：查 `表[机器值]`，查不到时按**兜底方向**回。
 *
 * 只认**自有键**（`Object.hasOwn`）：原型链上的 `constructor`／`toString` 不算「登记过」，
 * 否则一个未登记的值会从表上漏一个函数到屏上。
 *
 * @param {Record<string, string>} map 机器值 → 人话（表里只许登记本仓代码真会产生的值）
 * @param {unknown} value 机器值
 * @param {string} [orientation] 兜底方向（缺省 `FALLBACK_CLOSED`；自由文本传 `FALLBACK_FREE`）
 * @returns {string|null|undefined} 句子 ／ 闭集未登记时的 `null` ／ 自由文本未登记时的原值
 */
export function fallbackWord(map, value, orientation = FALLBACK_CLOSED) {
	const registered =
		map !== null &&
		typeof map === "object" &&
		value !== null &&
		value !== undefined &&
		Object.hasOwn(map, value);
	if (registered) return map[value];
	return orientation === FALLBACK_FREE ? value : null;
}

// ── 「多久没动静」的共用判定（票 stale-detection/01）──────────────────────────
//
// 拍板（`.scratch/stale-detection/issues/01-卡住误报.md`）：判定喂**三路**、门槛**统一 5 分钟**、
// 这一屏**只有一个出口**（活性行）、措辞**只说可见事实**（不下「卡住了」这个诊断）。
// 这一节是那条判定的**唯一**出处：活性行与状态卡消费同一份结果，两处不许各自再抄一遍算式
// （改这一份的前身就是"逐字抄了两遍、各自消费"，于是同一屏一行说在跑、一行说卡住）。
//
// 三路输入：
//   · `mainAiRunning`——主笔 AI 的回合还在不在跑。**照宿主自己的判法**读会话快照的 `running` 位
//     （形状见 `docs/reference/dsh-session-contracts.md`）。原来的实现读聊天快照那层
//     `legacy.partial`——会话快照里没有这个字段，于是这一路**恒为 false**（钩子接错了，
//     宿主自己一处都没消费过 `partial`）。
//   · `subagentRunningCount`——有几个小助手在跑，由 `indexSubagentDescendants` 从会话摘要聚合
//     （宿主推送，不再由插件自己轮询计数）。**注意它的口径**（票 walkthrough-fixes/01 · 走查 P44）：
//     宿主的 `running` 是「记录还驻留」，**驻留但空闲的也算在跑**——见
//     `indexRunningSubagentActivity` 的说明，那正是它需要配一路「多久没动静」的原因。
//   · `lastWriteAt`——账本最后一次被写入的时刻（`meta.updatedAt`）：取时基准只此一份。
//     精度到分钟的理由：这行跟着 2 秒轮询重画，显示秒会一跳两秒，看着像坏了。

/** 判定门槛：到点就说一句、就给按钮（票 stale-detection/01 拍板统一成 5 分钟）。 */
export const STALL_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * 时长说人话（**界面唯一一份**格式化，精度到分钟）：
 * `12 分钟` / `1 小时 30 分钟` / `1 天 1 小时` / `不到 1 分钟`。
 *
 * 「精度到分钟」＝**不显示秒**，不是"抹掉整段余量"：90 分钟就说「1 小时 30 分钟」，
 * 别退化成「1 小时」（那是另一处旧格式化器丢掉信息的地方）。
 */
export function humanDuration(ms) {
	const value = Number.isFinite(ms) ? Math.max(0, ms) : 0;
	const minutes = Math.floor(value / 60000);
	if (minutes < 1) return "不到 1 分钟";
	if (minutes < 60) return `${minutes} 分钟`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24)
		return minutes % 60 === 0
			? `${hours} 小时`
			: `${hours} 小时 ${minutes % 60} 分钟`;
	const days = Math.floor(hours / 24);
	return hours % 24 === 0 ? `${days} 天` : `${days} 天 ${hours % 24} 小时`;
}

/**
 * 「多久没动静」的唯一判定：四路输入、一个门槛。
 *
 * 前三路里**任一路**说"在推进"就不判停——这是这次误报的根因所在：「主 AI 派活 → 等小助手 →
 * 汇总交工」这段主 AI 与账本都不动，工作正在几十个小助手那里跑，只看账本必然误报，
 * 且误报的正是最忙的时候。
 *
 * 第四路（票 walkthrough-fixes/01 · 走查 P44）反过来堵另一个洞：**"有小助手在跑"不等于
 * "它在干活"**。宿主把 `running` 定义成「记录还驻留」，驻留但空闲的也算在跑，于是一个
 * 早就干完、结论一直没被消费的小助手会**把自己的报警器一直按住**（实测：终检小助手干了
 * 7 分 13 秒就结束，之后 3 小时 34 分钟零事件零新文件，界面一声不吭；它自己在名单里明明
 * 写着「可继续 · 当前未运行」）。所以这一路读的是 `subagentActiveSince`——**自称在跑的那
 * 些小助手里，最新的一次动静是什么时候**（宿主侧字段走 `indexRunningSubagentActivity`，
 * 与 `indexSubagentDescendants` 同口径聚合）。**任一路在门槛内动过就算在推进**，全都到门槛
 * 才算"没有人在写"。
 *
 * ⚠️ 这一路的聚合口径 2026-10-06 由**取 min**改成**取 max**（票 `walkthrough-2026-10/01`，
 * 依据是宿主会话日志实测）：取 min 时「一群小助手里最老的那个还没动静」被当成全都没动静，
 * 于是有一路 **3 秒前刚写过**、屏上仍喊「7 分钟没动静」（那一屏同时还写着「4 个小助手在跑」）。
 * 这一格要问的是**"还有没有人在写"**，不是"最老的那个歇了多久"——前者才是它服务的判断。
 * ⚠️ 改这条口径**不动**取不到时的方向（见下面那条）：拿不到证据仍然照旧算"在推进"。
 *
 * 取数方向上两路刻意**相反**，别改错：
 *   · 小助手数取不到 → 按 0 算，**宁可报警**（旧实现拉取失败保留旧值，一旦它参与抑制就是
 *     永久消音器）；
 *   · 「小助手多久没动静」取不到（宿主没给 `updatedAt` / 还没接线）→ **维持原判据**（照旧算
 *     "在推进"）。这里缺的是「它真停住了」的证据；拿不到证据就翻案，会把每一次正常的派活
 *     都报成没动静——那是拿新误报换旧漏报，不划算。
 * 反过来，账本一个读数都没有（`lastWriteAt` 非正数）时**不下判断**：没有可陈述的事实。
 *
 * @param {{ mainAiRunning?: unknown, subagentRunningCount?: unknown, subagentActiveSince?: unknown, lastWriteAt?: unknown, now?: number }} input
 * @returns {{ stalled: boolean, idleMs: number }}
 */
export function deriveStallJudgment(input) {
	const { mainAiRunning, subagentRunningCount, subagentActiveSince, lastWriteAt, now } = input ?? {};
	const at = Number.isFinite(lastWriteAt) && lastWriteAt > 0 ? lastWriteAt : null;
	const clock = Number.isFinite(now) ? now : Date.now();
	const idleMs = at === null ? 0 : Math.max(0, clock - at);
	const subagentsRunning =
		Number.isSafeInteger(subagentRunningCount) && subagentRunningCount > 0;
	// 自称在跑的小助手里最新的一次动静（取不到 = 不知道，维持原判据）。
	const activeSince =
		Number.isFinite(subagentActiveSince) && subagentActiveSince > 0 ? subagentActiveSince : null;
	// 口径：**任一路在门槛内动过**就算在推进（聚合层取的是最新那次动静的口径，见
	// `indexRunningSubagentActivity`）——不是"最老的那一路还没歇够"。
	const progressing =
		subagentsRunning &&
		(activeSince === null || clock - activeSince < STALL_THRESHOLD_MS);
	return {
		stalled:
			at !== null &&
			mainAiRunning !== true &&
			!progressing &&
			idleMs >= STALL_THRESHOLD_MS,
		idleMs,
	};
}

/**
 * 小助手血缘聚合：筛出 `origin === 'subagent'` 的会话，顺着父子关系往上走，
 * 对每个祖先累计 `{ count, runningCount }`。
 *
 * **⚠️ 这份口径曾经是照抄宿主的**（0.1.5-rc.3 的
 * `@deepseek-ai/dsh-client-ui-subagent` `indexSubagentDescendants` 逐字同构）。**0.1.7 起
 * 宿主不再提供对应实现**：那一族类型（`subagent-lineage.d.ts` / `LineageEntry` /
 * `SubagentDescendantSummary`）连文件带函数整份删除，宿主页头改成的
 * `SubagentCatalogAction` 只数**直接子级**、不再递归累计。所以这份口径**是工作台自己的**
 * ——依据、形状与退役事实见 `docs/reference/dsh-session-contracts.md` §3，登记闸门
 * `web-session-lineage` 断的正是「宿主那一族类型确实已退役」＋「这四条语义在样例上成立」。
 *
 * 四条语义：**孙辈也累计进祖先**（不是只数直接子级，累计的是"这条后代自己"的 `running`）、
 * 普通 fork（没有 `origin`）不算、断链只挂到它写明的父 id 名下、防环的 `seen` 收敛。
 *
 * @param {Record<string, { id?: string, parentId?: string, origin?: string, running?: boolean }>} summaries
 * @returns {Map<string, { count: number, runningCount: number }>}
 */
export function indexSubagentDescendants(summaries) {
	const indexed = new Map();
	for (const descendant of Object.values(summaries ?? {})) {
		if (descendant?.origin !== "subagent") continue;
		const seen = new Set();
		let current = descendant;
		while (
			current?.origin === "subagent" &&
			current.parentId !== undefined &&
			!seen.has(current.id)
		) {
			seen.add(current.id);
			const aggregate = indexed.get(current.parentId);
			if (aggregate === undefined) {
				indexed.set(current.parentId, {
					count: 1,
					runningCount: descendant.running ? 1 : 0,
				});
			} else {
				aggregate.count += 1;
				if (descendant.running) aggregate.runningCount += 1;
			}
			current = summaries[current.parentId];
		}
	}
	return indexed;
}

/**
 * 「自称在跑、却已经多久没动静」的聚合（票 walkthrough-fixes/01 · 走查 P44）。
 *
 * **为什么 `indexSubagentDescendants` 答不了这个问题**：宿主的 `running` 位是「记录还驻留」，
 * **驻留但空闲的也算在跑**（口径见 `docs/reference/dsh-subagent-contracts.md` §1 与
 * `docs/reference/dsh-session-contracts.md` §1）。P44 实测里那个终检小助手 10:20:59 干完就
 * 再没动过，宿主名单上它明明写着「可继续 · 当前未运行」——可谱系计数里它**一直**算"在跑"，
 * 于是「有没有小助手在跑」这一路把告警按了 3 小时 34 分钟。**这不是数错了，是那个位本来
 * 就不表达"在干活"。**
 *
 * 所以这里不动 `indexSubagentDescendants`（它与宿主逐字同构，动了就是契约漂移），另起一份
 * **同口径**的血缘聚合：同样筛 `origin === 'subagent'`、同样沿 `parentId` 往上走、同样
 * 孙辈累计进祖先、同样 `seen` 防环、断链只挂它写明的父 id 名下；**只多认一个字段
 * `updatedAt`**（会话摘要里声明的那一位，见 `docs/reference/dsh-session-contracts.md` §1）。
 * 它只搬事实、**不下判断**：门槛与比较全在 `deriveStallJudgment`（门槛只此一份）。
 *
 * 只统计 `running === true` 的那些——「在跑却没动静」才是要问的那一类；本来就写着没在跑的
 * 不必再问一遍（`subagentRunningCount` 那边已经数过了）。
 *
 * ⚠️ **取不到 `updatedAt` 的行不进这张表**：没有可陈述的事实就别造一个（`Number.NaN` / 0 /
 * 缺字段一律跳过）。于是「宿主没给这一位」时下游拿到的是"没有这一路事实"，判定照旧走
 * 原来的三路——**宁可维持现状，也不用一个猜出来的时刻去翻案**（见 `deriveStallJudgment`
 * 里两路取数方向为什么相反）。
 *
 * ⚠️ **同一个祖先名下取的是最新的一次动静（取 max），不是最老的**——2026-10-06 改，
 * 票 `walkthrough-2026-10/01`。取 min 时「最老的那个还没动静 ＝ 全都没动静」，
 * 而走查那一屏的事实是：四个执笔小助手，分别 7.0 分／6.4 分／1.5 分／**3 秒**前写过自己的
 * 日志，屏上却喊「7 分钟没动静了」（同一屏还写着「4 个小助手在跑」）。
 * **这一格要回答的是"还有没有人在写"**，所以任一路在门槛内动过就够；取 min 是把这个问句
 * 换成了"最老的那一路歇了多久"，于是最忙的时候最容易误报。
 *
 * @param {Record<string, { id?: string, parentId?: string, origin?: string, running?: boolean, updatedAt?: number }>} summaries
 * @returns {Map<string, number>} 祖先 id → 它名下「自称在跑」的后代里**最新**的那次动静时刻
 */
export function indexRunningSubagentActivity(summaries) {
	const indexed = new Map();
	for (const descendant of Object.values(summaries ?? {})) {
		if (descendant?.origin !== "subagent" || descendant.running !== true) continue;
		const since = descendant.updatedAt;
		if (!Number.isFinite(since) || since <= 0) continue;
		const seen = new Set();
		let current = descendant;
		while (
			current?.origin === "subagent" &&
			current.parentId !== undefined &&
			!seen.has(current.id)
		) {
			seen.add(current.id);
			const known = indexed.get(current.parentId);
			// 取 max：**只要还有一路在写，这一屏就没停**（票 walkthrough-2026-10/01）。
			// 取 min 时最老的那一路会替全屏发言——「有人歇了 7 分钟」被说成「都没动静」，
			// 而同一刻别人正在猛写。这一格问的是"还有没有人在写"。
			if (known === undefined || since > known) indexed.set(current.parentId, since);
			current = summaries[current.parentId];
		}
	}
	return indexed;
}

/**
 * 一条抽查意见是不是「还没处置」（票 10 / spec 不变量 3）：**只认显式 `status === 'pending'`**。
 *
 * 机器按章交工也只拦 `pending`（`applied` / `revoked` 与老账本里缺 `status` 的都不拦），
 * 界面照同一个口径判——否则已处置的意见会永远在徽章上冒充「有意见待 AI 修订」，
 * 界面与闸门两个数字就打架了。
 */
export function isReviewPending(review) {
	return review?.status === "pending";
}

/** 该章有没有「还没处置」的抽查意见（章级徽章与「已完成 X/Y 章」共用这一个口径）。 */
export function hasPendingReview(pendingReviews, n) {
	return (pendingReviews ?? []).some(
		(r) => Number(r.chapter) === Number(n) && isReviewPending(r),
	);
}

// 章级徽章（F17 四态 + F35 五态）：优先级 doneSet（章级「交工通过」事件，F40 语义最高）
// → 主 AI 上报的流水线阶段（chapterPipeline）→ **有没有在跑的小助手认领它**（票 20）→ 不给徽章。
//
// ⚠️ 票 10（判定一 #1/#2，2026-09-23）：徽章**一律「状态词 · 在做什么」**——状态词只取
// CONTEXT.md「工作台状态词」那三个（轮到你 / 我正在做 / 已完成），后半句才是这一章在干哪道工序。
// 原来这里有四套并行说法（「执笔中」「审计中」「写好了，审计中」「写完·审过·AI 把过关」），
// 既违反「状态词只此三个」，又把机器词「审计」摆到人眼上（判定三 #7）。后半句统一说「检查」
// （内部词→界面词的同一份译法见 view-rules.CHECK_UI / domain-rules.stageLabelHuman）。
// 「有意见待 AI 修订」保持不变：它是本词表认可的界面词（CONTEXT.md「意见」词条）。
//
// ⚠️ 票 22（2026-09-29 真机走查）：「已完成 · 审过」原先只看**账本里有过交工事件**，
// 于是「交工之后正文又被改过、没重新审计」的章照样亮「审过」——那一轮 3 章里 2 章的徽章是按**旧稿**
// 给的，而「已完成 3/3 章」正是按这个徽章算出来的。界面上那句「比正文旧，属于旧稿」**已经算出来了**
// （同一份服务端事实），只是没人拿它卡住徽章。⇒ 第 5 个入参 `auditStale` 就是那份事实的判据形态
// （`view-rules.chapterAuditIsStale`，与那句文案取同一条 fact），**不是**客户端重比的 mtime。
// 这一格**不许**回落成「我正在做 · 执笔/检查」——那是在说一件没人做的事（票 20 那个病）；
// 「轮到你」按 CONTEXT.md「出错了不单列，归入轮到你」的既有口径：它得有人推一把才会重新长好。
//
// ⚠️⚠️ 票 20（2026-09-30 用户裁决 · 状态来源换掉，不是词不够细）：**「我正在做」只留给真在做的事**。
// 病根：徽章原先是按「清单里有这一章、且它还没定稿」**推导**出来的，于是走查那一屏三章
// 逐字一样地亮「⏳ 我正在做 · 执笔」，而盘上只有第 1 章的正文、只有 1 个小助手在跑（跑的是第 1 章）。
// 现在「我正在做」这一支的**唯一**前置是 `claimed`——由 `view-rules.indexRunningChapterClaims`
// 按「该章产物在不在」＋「名额（＝在跑的小助手数）够不够」判出来；**两者都缺 ⇒ 不显示「我正在做」**。
// ⇒ 兜底那一支从 `我正在做 · 执笔` 变成 **null（这一格不出声）**：`row.written/audited` 说的是
// 「产物在不在盘上」，它**不表达「有人在写它」**（票 24 在步清单那侧已按同一条理由改过一次：
// 有产物但没交工说「还没完成」，不给「我正在做」）。产物那一行本来就逐章显示在卡上，
// 用户看得见这一章写到哪；**说一件没人做的事则收不回来**。
// 返回 null 时调用方**整颗徽章不渲染**——不是渲染一颗空徽章，也不是拿别的词顶上。
const CHAPTER_OPERATION = Object.freeze({
	writing: { icon: "⏳", tone: "var(--dsw-alias-state-warn-label)", text: "执笔", agent: "写作小助手" },
	auditing: { icon: "🔍", tone: "var(--dsw-alias-state-business-primary)", text: "检查", agent: "检查小助手" },
	audited: { icon: "🔎", tone: "var(--dsw-alias-state-business-primary)", text: "等复核", agent: "复核小助手" },
	finalizing: { icon: "👁", tone: "var(--dsw-alias-label-secondary)", text: "复核", agent: "复核小助手" },
});

/** 归属栏那一份图标与色：与徽章**故意不同**——它是次要信息，不与状态抢眼睛。 */
const CHAPTER_ATTRIBUTION_ICON = "🛠️";
const CHAPTER_ATTRIBUTION_TONE = "var(--dsw-alias-label-secondary)";

/**
 * 章级徽章。`claimed` 认不认这一章（「有没有在跑的小助手认领它」，判据在 `view-rules`）。
 *
 * 票 `audit-state-regression/01`：第 7 个入参 `serverDone` 是**服务端 `chapterStatus[].done`**
 * （与「已完成 N/M 章」、交付闸同一份派生）。传了它就**以它为准**：`false` 时徽章不许再说
 * 「已完成 · 审过」——否则同一屏会出现「计数说 1/2，徽章说那一章已完成」的自相矛盾。
 * 不传（`null`）时逐字退回本票之前的本地判据（老服务端／样张）。
 *
 * @param {boolean} auditStale 检查记录是否比正文旧（`view-rules.chapterAuditIsStale`）
 * @param {boolean} claimed 这一章此刻有没有在跑的小助手认领它
 * @param {boolean|null} serverDone 服务端 `chapterStatus[].done`；`null` ＝没下发
 * @returns {{icon: string, text: string, tone: string} | null} **null ＝这一章此刻没有状态可报**
 */
export function chapterBadge(
	row,
	pendingReviews,
	doneSet,
	pipelineStage,
	auditStale = false,
	claimed = false,
	serverDone = null,
) {
	const hasReview = hasPendingReview(pendingReviews, row.n);
	// 「该章已完成」的两个来源（doneSet 交工事件 / 主 AI 上报 done）走同一句。
	const settled = () =>
		hasReview
			? { icon: "📝", text: "轮到你：有意见待修订", tone: "var(--dsw-alias-state-error-primary)" }
			: auditStale
				? { icon: "⚠️", text: "轮到你：还没审过", tone: "var(--dsw-alias-state-warn-label)" }
				: serverDone === false
					? { icon: "⚠️", text: "轮到你：还没完成", tone: "var(--dsw-alias-state-warn-label)" }
					: { icon: "🛡️", text: "已完成，审过", tone: "var(--dsw-alias-state-success-primary)" };
	// 服务端说这一章完成了 ⇒ 徽章照它说（与计数、交付闸同一份）。新鲜度/意见两项仍优先。
	if (serverDone === true) return settled();
	// 票 22：新鲜度先于任何「说它完了」的来源（交工事件 / 有检查记录这一事实）。
	// 后两者说的是**过去某一刻**发生过什么，这一条说的是**此刻这份正文**有没有被审过。
	if (auditStale && (doneSet.has(row.n) || row.audited === true)) return settled();
	if (doneSet.has(row.n)) {
		// 票 `audit-state-regression/01`：服务端说**还没完成**时，账本里的旧交工事件不许把它
		// 洗成「已完成 · 审过」；但**有人认领**时也不许盖掉「我正在做」——那一章正在被返工，
		// 说「轮到你」同样是在说一件没发生的事，所以让下面那一支照实说「我在写」。
		if (serverDone !== false || !claimed) return settled();
	}
	// ⚠️ 票 `premature-announce/04`（2026-10-10 裁决）：**「已完成 · 审过」只认机器事实**——就是上面
	// 那一支（账本里机器记下的章级交工；过目闸门与「已完成 X/Y 章」用的是同一份判据）。此前 **AI 自报**
	// `chapterPipeline.stage === 'done'` 也能单独说出这句话，而服务端只校验那个枚举、**不验产物**
	// ⇒「自报 done 而这一章其实还没交工」时，徽章替机器说了一句它没说过的话（「早宣告」在宣告面上的第三处）。
	// ⇒ 自报 `done` 现在**只**撑得起「轮到你」那一支（有未处置意见／正文还没被审过）；
	// 其余情况落回认领那一支：有人认领说「我正在做」，没人认领整颗不出声。⛔ 自报不是结论。
	if (pipelineStage === "done" && (hasReview || auditStale || serverDone === false)) return settled();
	// 票 20：**只有被认领的章才说「我正在做」**。工序取自 AI 自报的流水线阶段；
	// 说不出是哪一道工序（没上报 / 不认识的态）就只说状态词那半截，**不猜**。
	if (claimed) {
		const operation = CHAPTER_OPERATION[pipelineStage];
		return operation === undefined
			? { icon: "⏳", text: "我正在做", tone: "var(--dsw-alias-state-warn-label)" }
			: { icon: operation.icon, text: `我正在做：${operation.text}`, tone: operation.tone };
	}
	// 没人在写它：这一格整颗不出声（票面 :98/:104「实跑 1 章时只该有 1 行我正在做」）。
	return null;
}

/**
 * **归属**栏（票 20 · 与状态拆成两件不同的事，票面 :57/:87 裁决）：「谁在写这一章」。
 *
 * 与 `chapterBadge` 同形（`{ icon, text, tone } | null`）——两栏的字与色都由本模块出，
 * 组件里不留展示字面量。
 *
 * ⚠️ **这一栏说的是「名额落在这一章上」，不是「我们看见了那个小助手」**：宿主没给
 * 「哪个小助手在写哪一章」的逐个归属（会话摘要只有 `id`/`parentId`/`origin`/`running`，
 * 见 `docs/reference/dsh-session-contracts.md` §1），所以「谁」由认领判据**推**出来。
 * 要逐个归属得先有一条宿主契约——那是另开一票的事，不许在这里拿标题去猜。
 *
 * 没有在跑的小助手认领就返回 **null**——调用方整格不渲染。
 * ⚠️ 空着就是空着：**不许**退回成「排队中」或任何别的话（票面 :99「那正是把计划说成事实的另一种写法」）。
 * 它也**不是**状态词（不占 CONTEXT.md「工作台状态词」那三个词的名额）：它答的是「谁」，不是「走到哪了」。
 *
 * @param {boolean} claimed 这一章此刻有没有在跑的小助手认领它
 * @param {string | null} pipelineStage AI 自报的章级流水线阶段（决定是哪一道工序的小助手）
 * @returns {{ icon: string, text: string, tone: string } | null}
 */
export function chapterAttribution(claimed, pipelineStage) {
	if (claimed !== true) return null;
	const operation = CHAPTER_OPERATION[pipelineStage];
	return {
		icon: CHAPTER_ATTRIBUTION_ICON,
		text: operation === undefined ? "小助手" : operation.agent,
		tone: CHAPTER_ATTRIBUTION_TONE,
	};
}

// 已交工通过的章（纯账本推导，票 14 口径）：该章有机器记下的章级 `agent-end` 且 `outcome==='ok'`
// ——label 含该章号（真实通道「第N章《…》完成（…）」、演示通道「写第N章 / 自查第N章」都算），
// 「最佳范例章」那一步算它选中的那一章交工（章号取 meta.goldChapter，缺省 1）。
// ⚠️ **不再看文件在不在、也不再要求 label 含「完成」**：过目闸门与界面「已完成 X/Y 章」取同一判据，
// 两个数字才不会打架（spec 票 05 选定 A）。抽成纯函数便于冒烟直接断言。
export function deriveDoneSet(events, goldChapter) {
	const gold = Number(goldChapter);
	const set = new Set();
	for (const event of events ?? []) {
		if (event.type !== "textbook/agent-end") continue;
		if (event.data?.outcome !== "ok") continue;
		const label = String(event.data?.label ?? "");
		const match = /第(\d+)章/.exec(label);
		if (match !== null) {
			set.add(Number(match[1]));
			continue;
		}
		if (label.includes("最佳范例章") && Number.isSafeInteger(gold) && gold >= 1)
			set.add(gold);
	}
	return set;
}

/**
 * 「这一章算不算完成」——**界面侧只此一份判据**（票 `audit-state-regression/01`）。
 *
 * 两个出口读它：章节卡的「已完成 X/Y 章」（`chapters-map.js`）与阶段五状态卡的同一个计数
 * （`event-cards.js` 的 `StatusCard`）。两处各写一份时，「服务端说这一章还没审过／正文在检查之后
 * 又改过」与「按账本里的交工事件数出来」会各说各话——第 8 章正文被重写后仍显示十章的假信号
 * 正是这么来的。
 *
 * 判据的**主来源是服务端下发的 `chapterStatus[].done`**：它由 `engine.chapterDone` 算出，
 * 覆盖「两份产物在 ＋ 检查记录审的是当前这份正文 ＋ 机器记下的章级交工 ＋ 无未处置意见」
 * （`chapterGateMiss` 那四项，过目闸门认的也是它）。有它就照它，两个数字必然一致。
 *
 * ⚠️ **`typeof done === "boolean"` 那一支是给老服务端／样张的**（没下发这一格）：退回本地能算的
 * 那一半「章级交工事件 ＋ 无未处置意见」。它**不是**完整口径——产物在不在、检查记录新不新
 * 客户端不读盘，所以这两项在旧服务端上退回本票之前的行为。⛔ 不许把它当成第二份判据的授权：
 * 新代码只要服务端有 `done` 就必须走它（否则正文返工后的新鲜度在界面上就丢了）。
 *
 * @param {unknown} chapterStatus `/textbook/events` 下发的逐章进度（可缺）
 * @param {Set<number>} doneSet 账本里章级交工通过的章号（`deriveDoneSet` 的产出）
 * @param {unknown[]} pendingReviews 未处置意见表（`meta.pendingReviews`）
 * @param {number} n 1 起的章号
 * @returns {boolean}
 */
export function chapterIsDone(chapterStatus, doneSet, pendingReviews, n) {
	const found = (chapterStatus ?? []).find((r) => Number(r?.n) === Number(n));
	if (typeof found?.done === "boolean") return found.done;
	return doneSet.has(Number(n)) && !hasPendingReview(pendingReviews, n);
}

/**
 * 段落级意见（带 kind）在界面上的**唯一一份正名**（票 02）。
 *
 * 出口只有这一处：章节卡的 `reviewText` 与谈判桌意见单（`gold-table.js`）同取这一份。
 * 此前谈判桌的正文标记区另抄了一份**逐字相同**的，票 02 已收编——意见 kind 词一处，改措辞防漂移
 * （与 `REVIEW_REVOKED_TEXT` 同一条路：跨域协作只走 public exports，见 `AGENTS.md`「Frontend layout」）。
 * ⚠️ `replay-list.js` 的 `goldOpinionVerbs` 是**第三份短动词版**，措辞与这两份**有意不同**，不并入这里。
 * （它随票 `depth-review-2026-10/09` 的回放域搬迁从 `event-cards.js` 到了 `replay-list.js`。）
 */
export const REVIEW_KIND_TEXT = {
	dislike: "😕 不喜欢这种写法",
	drop: "🗑 这类内容不需要",
	change: "✏️ 要改成",
};

/** 一条抽查意见在界面上的人话正文：整章意见有 `comment`，段落意见只有 `kind` + `wish`。 */
export function reviewText(review) {
	const comment =
		typeof review?.comment === "string" ? review.comment.trim() : "";
	if (comment !== "") return comment;
	const kind = REVIEW_KIND_TEXT[review?.kind];
	const wish = typeof review?.wish === "string" ? review.wish.trim() : "";
	if (kind !== undefined) return wish === "" ? kind : `${kind}：${wish}`;
	return wish === "" ? "（这条意见没写内容）" : wish;
}

/**
 * 意见被撤回（`status === 'revoked'`）在界面上的**唯一正名**（`CONTEXT.md`「撤回（意见）」）。
 *
 * 出口只有这一处：章节卡的处置态（`reviewState`）、谈判桌意见单的状态词与撤回行都从这里取词。
 * 此前同一个状态在意见单与章节卡里各写了一份同义说法，四条走查意见（走查 P25/P26/P32/P52）全踩这个坑。
 * ⚠️ `revoked` 这个**机器身份词**（`status` 的值）一个字不改，这里统一的是界面字。
 */
export const REVIEW_REVOKED_TEXT = "已撤回";

/**
 * 一条意见此刻的处置态（章节卡的「该章的意见」列表与翻案入口用）。
 *
 * - `pending`：还没处置——它正拦着这一章交工（机器只拦这一个态）。
 * - `applied`：主笔 AI 交工时点名处置过、并写了怎么处置的（`how`）；可翻案。
 * - `revoked`：已撤回（`REVIEW_REVOKED_TEXT`）。
 * - 其余（老账本没写 `status`）：早先的意见，不拦交工，也不假装处置过。
 *
 * ⚠️ `revocable` 只答「这一态**有没有**出口」，**不答出口是哪个动作**——`pending` 的出口是
 * 「撤回」（作废），`applied` 的出口是「翻案」（取消处置），方向相反。去哪一个由
 * `chapters-map.js` 的 `ChapterReviewLine` 按 `key` 分派，别让一个布尔表达两种语义（票 09）。
 */
export function reviewState(review) {
	if (review?.status === "applied") {
		const how = typeof review.how === "string" ? review.how.trim() : "";
		return {
			key: "applied",
			text: how === "" ? "已处置（AI 没写说明）" : `已处置：${how}`,
			revocable: true,
		};
	}
	if (review?.status === "revoked")
		return { key: "revoked", text: REVIEW_REVOKED_TEXT, revocable: false };
	if (review?.status === "pending")
		return {
			key: "pending",
			text: "还没处置：这一章交工前要先处置它",
			// 票 09：还没处置的意见也能**撤回**（`gold-opinion-revoke` 置 `revoked`）。原先这里
			// 是 false，于是这一态在界面上**一个按钮都没有**——唯一那条反悔路是「重置重做」，
			// 代价是整本书推倒重来（而那时这一章已经被 AI 改完了）。
			revocable: true,
		};
	return { key: "legacy", text: "早先的意见（不再拦交工）", revocable: false };
}

// F22（2026-08-20）那条旧规则**已不成立**（2026-09-22 票 12 裁决，见 `workbench-transitions/spec.md`
// 不变量 13 与 `CONTEXT.md`「阶段片」2026-09-22 修订条）：旧规则是「浏览历史（browsing 非空）时
// 主进度条隐藏」，撤销它的理由是**回看态下没有可见的「回到现在」入口**——入口不该随看点深浅
// 消失。现在阶段片（那排六格）**常驻**：有书就渲染，浏览某一步 / 停在阶段页时照常在，回看态下
// 「当前阶段」那一格脸上直接写「回到现在」。于是这条判据恒真——保留它只为不改导出表面（`mainProgressVisible`
// 是 `client-entry.js` 的导出表面之一，冒烟测试穿过这些名字），**渲染处不再拿它门控**。
export function mainProgressVisible() {
	return true;
}

// F33 自动跟随判定（抽成纯函数供冒烟测试）：等拍板状态**新到达**且当时正在浏览历史 → 才强制拉回「现在」；
// 已处于等拍板态后用户再主动浏览 → 不打断（有意浏览/定点修改）。
export function shouldForceBackToNow(prevAwaiting, awaiting, browsing) {
	return awaiting && !prevAwaiting && browsing;
}

// 状态条「进度详情」：只取「当前这一步」内的最新 progress 事件。
// 以最近一条 textbook/stage-start 为界（handoff 交办每一步都会落一条 stage-start，
// 重启/重派会再落一条、取最近为准），界前的 progress 属于上一步——跨阶段残留会让
// 状态条误导（2026-09 实测：源探查结束进设计关卡，探查期的「通读6本材料…」仍挂在
// 「AI 干活中 · 设计提案·第 N 关」后面）。没有 stage-start（还没交办任何一步）时
// 返回 ""，不显示无法归属的进度。
export function stageScopedProgressDetail(events) {
	const list = events ?? [];
	let boundary = -1;
	for (const event of list) {
		if (event.type === "textbook/stage-start") boundary = event.seq;
	}
	if (boundary === -1) return "";
	let progress = null;
	for (const event of list) {
		if (event.type === "textbook/progress" && event.seq > boundary)
			progress = event;
	}
	if (progress === null) return "";
	return `${progress.data?.label ?? ""}${
		progress.data?.detail ? `：${progress.data.detail}` : ""
	}`;
}

/** 把稿子按空行切成段（1 基编号 = 下标 + 1），丢掉空白段。 */
export function splitParagraphs(text) {
	return String(text ?? "")
		.split(/\n\s*\n/)
		.map((para) => para.trim())
		.filter((para) => para !== "");
}

/** 段落一句话摘要（意见 hint 用）：压空白、取前 40 字。 */
export function paragraphHint(para) {
	return String(para ?? "")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, 40);
}

// ── 工作台底边锚点：量**输入区容器**，不量输入元素自身（票 ad-strip-occlusion/01）──────
//
// 工作台根容器的高度由「可用高度」推导（`client-entry.js` 的 `measure()`）：根容器自身 top →
// 底边锚点。锚点原来取「最靠视口底部的文本输入**元素**自身的 top」——而宿主的作曲家是一张**卡**，
// 输入元素上方还有卡自己的 `padding-top`、一行提示语、排队消息行。于是工作台的底边落在卡**里面**：
// 实测差 8px（输入区容器 top 792 / 输入元素自身 top 800），广告横条下沿被吃掉 8px（≈21%），
// 同时把宿主页签容器撑出一条 8px 的外层滚动条（票 workbench-scroll/01——两票同一个 8px、
// 同一次改动）。宿主**任何**新增在输入元素上方的块都会再吃一次，所以这里换的是**锚点**，
// 不是补一个 8px 的补丁。
//
// 判据两级，两级都要求那一层**从输入元素上方开始**（`top < 元素自身 top`）且**有真实盒子**
// （宽高非 0——宿主 `display:contents` 那层 rect 全 0，拿它当锚点会把工作台压成 0 高）：
//   ① 圆角 + 不透明底：宿主作曲家那张卡（实测 `border-radius: 22px` + `rgb(255,255,255)`）；
//   ② 兜底：宿主换了皮（不再圆角/不再不透明）时，取最近那层从输入元素上方开始的盒子。
// 找不到（输入框上面确实什么都没有）返回 `null`，调用方退回「输入元素自身 top」的现行为。

/**
 * 从输入元素的祖先链里挑出**输入区容器**的 top。
 *
 * @param {Array<{ top?: unknown, width?: unknown, height?: unknown, borderRadius?: unknown, backgroundColor?: unknown }> | null | undefined} chain
 *   从被选中的输入元素**自身**起、逐层向上的祖先盒子（纯数据；本函数不碰 DOM）
 * @returns {number | null} 输入区容器的 top；没有比输入元素更靠上的贴底容器时 `null`
 */
export function pickComposerAnchorTop(chain) {
	const list = Array.isArray(chain) ? chain : [];
	const self = list[0];
	if (self === undefined || !Number.isFinite(self.top)) return null;
	const above = list
		.slice(1)
		.filter(
			(box) =>
				box !== null &&
				typeof box === "object" &&
				box.width > 0 &&
				box.height > 0 &&
				box.top < self.top,
		);
	const card = above.find((box) => isRoundedOpaqueBox(box));
	const anchor = card ?? above[0];
	return anchor === undefined ? null : anchor.top;
}

// ── 谁够格当「作曲家」：候选判据（票 walkthrough-2026-10/10）────────────────────────
//
// 病（真机复现，2026-10-05）：终检认可那一屏，工作台**根容器被压成 207px**、整块内容区被裁掉，
// 用户看到的正是「一条进度条 ＋ 六个阶段格 ＋ 一条广告 ＋ 空白」（与 2026-09-26 走查 P55 同形）。
//
// 机制不在渲染里，在 `measure()` 挑「作曲家」的那两行上：它遍历
// `textarea, input, [role=textbox], [contenteditable=true]`，只要求 **`r.bottom > vh - 160`**
// ——这条判据**不要求那个元素在视口里**。终检认可卡是全书最高的一张卡（自查报告可达 1400px＋），
// 它自己那个「不满意意见」输入框一旦**没被自动带进视野**（旧 bundle／竞态那一帧），
// 它的 bottom 就落在视口下方（真机实测 1625 > 1297），于是它**比真正的作曲家更靠下**、
// 被挑成锚点；`pickComposerAnchorTop` 取到的「输入区容器 top」＝**那张卡自己的 top**（283），
// 于是 `usable = 283 - 76 = 207 > 200` ⇒ `rootH = 207px` ⇒ 工作台塌成一条。
//
// 两刀都要（各自堵一条路，两条都喂进下面这个纯函数，不在接线处另写一份）：
//   ① **工作台自己的输入不算作曲家**——判据要的是宿主那张作曲家卡，工作台里的意见框／笔记框
//      天然「在根容器里面」，`root.contains(el)` 一句话就把它们整族排除；
//   ② **必须在视口里**（`bottom <= viewportHeight`）——把①放宽一点也够今天这一屏，但「视口下面
//      一千像素处有个输入框」在任何宿主布局下都不该当锚点，两刀都写下来才不用赌下一屏。
//
// ⚠️ **它不是「谁最靠下」那半条**：挑最大 bottom 仍归调用方（那是「遍历里挑一个」的机械动作）。

/** 「接近视口底部」那条带子的高度（px）；与判据①合起来＝「贴着底部的、看得见的输入」。 */
const COMPOSER_BOTTOM_BAND = 160;

/**
 * 这一枚输入元素**够不够格当宿主的作曲家**（`measure()` 挑底边锚点时的唯一候选判据）。
 *
 * @param {{ top?: unknown, bottom?: unknown, width?: unknown, height?: unknown, insideWorkbench?: unknown } | null | undefined} box
 *   一枚候选的盒子（视口坐标）＋「它在不在工作台根容器里面」
 * @param {{ rootTop?: unknown, viewportHeight?: unknown } | null | undefined} frame
 *   工作台根容器的 top 与视口高度（两个都是从同一帧里量出来的读数）
 * @returns {boolean} true ＝ 够格（调用方再在够格的里面挑 bottom 最大的那个）
 */
export function isComposerCandidate(box, frame) {
	const b = box ?? {};
	const f = frame ?? {};
	const top = Number(b.top);
	const bottom = Number(b.bottom);
	const width = Number(b.width);
	const height = Number(b.height);
	const rootTop = Number(f.rootTop);
	const vh = Number(f.viewportHeight);
	if (![top, bottom, width, height, rootTop, vh].every(Number.isFinite)) return false;
	// 零尺寸的盒子（宿主 display:contents 那层、还没布局的元素）从来不是作曲家。
	if (!(width > 0 && height > 0)) return false;
	// ① 工作台自己的输入框不算：它只是在根容器里面，与宿主那张作曲家卡无关。
	if (b.insideWorkbench === true) return false;
	// ② 必须在视口里，且确实贴着底部那一条带（`bottom` 超过视口高度 ＝ 在屏幕下面，不算）。
	if (!(bottom <= vh)) return false;
	if (!(bottom > vh - COMPOSER_BOTTOM_BAND)) return false;
	// 起点要在工作台根容器之下（旧判据那一半，照留）。
	return top > rootTop;
}

/** 输入区容器的精确信号：圆角 + 不透明底（见上面判据①）。 */
function isRoundedOpaqueBox(box) {
	if (!(parseFloat(box.borderRadius) > 8)) return false;
	const bg =
		typeof box.backgroundColor === "string"
			? box.backgroundColor.trim().toLowerCase()
			: "";
	if (bg === "" || bg === "transparent") return false;
	const rgba = bg.match(/^rgba?\(([^)]+)\)$/);
	if (rgba === null) return true; // 命名色等一律当作不透明
	const parts = rgba[1].split(",").map((part) => parseFloat(part));
	if (parts.length < 4) return true; // rgb(...) 没有 alpha 通道
	return Number.isFinite(parts[3]) ? parts[3] > 0 : true;
}

// ── 「现在」那张卡要自己进视野（`walkthrough-fixes` 票 24）────────────────────────
//
// 票 20 治的是**同一类**病的另一半（确认点那颗推进键埋在几千字报告底下）；票 24 这一半治的是
// **终检/交付屏**——那里没有第二颗键可给，「认可，交付」就是那颗唯一定案键，而它在 2551px 内容列的
// `y 1523`（真机量测，见票面表格），用户那一侧干脆整屏空白。于是**自动把那张卡带进可视带**是唯一
// 的解法，而不是再造一个出口。
// ⚠️ 票 20 那一半**曾经**的解法是「再给一颗同一动作的键」（焦点区吸底决策条），那条已按
// `walkthrough-fixes/18` 的裁决**整条删掉**——同一屏里那颗键渲染了两次（用户原话「满意的那行位置不对」）。
// ⇒ 记这一句是因为它当年被拿来当「探索/大纲/定稿/交工那四张为什么不自动滚」的**理由**：
// 那四张至今**不滚**，而那条理由（底对齐会把正在读报告的用户一把拽到几千字下面）本身仍然成立。
// 探索那一屏的高度另按票 20 的 2026-10-06 裁决治——「读材料报告默认折叠」（落在
// `confirm-cards.js` 那张卡自己身上）⇒ 推进键回首屏；与「这几张不滚」是两件事，见
// `view-rules.autoScrollCardKey` 与票 20 的 `## Comments`。
//
// 三条口径：
//   ① **量不到不猜，且量不到就不算数**：页签没激活／还没布局（`clientHeight === 0`）、卡还没
//      长出来时返回 `measured: false`——调用方**必须**拿这一位决定要不要记账。否则一次「量不到」
//      的帧会把「已经摆过」记上，之后每帧都提前返回，**原病原样复发**（2026-09-30 首轮实现里
//      的那个 bug；票面 §Answer 已记）。
//   ② **一像素也不多给**：整张卡已经在可视带里 → `scrollTop: null`（`measured` 仍为 true）。
//      **不在每一次轮询上抢滚动**——用户自己滚到哪儿是用户的事，判据只管「进来时没在视野里」
//      这一种。
//   ③ **装得下就顶对齐、装不下就底对齐**：唯一定案键长在卡的**底部**（票面实测它就在最下面），
//      卡比可视带还高时先把它带进来；卡装得下时顶对齐＝票面那句「钉在容器顶部」，抬头那句
//      「🛡️ 最后检查完成，等你对整本书把关」也一起看得见。
//
// 判据收在这里一处（纯函数、可独立测）；`client-entry.js` 只负责量坐标、只负责写 `scrollTop`。
// ⚠️ 真几何（滚完之后 `getBoundingClientRect()` 落在第几个视口、`elementFromPoint` 命中谁）
// node 侧量不到——本文件头与 `test-layout-anchors.mjs` 头已有同样的自陈，这里只判"滚到哪"。

/** 卡与可视带之间留的那道缝（px）。量不到时**不用**它下判断。 */
const DECISION_CARD_MARGIN = 12;

/** 「量不到」的读数（**只此一份**，免得两处各造一个字面量）。 */
const CARD_SCROLL_NOT_MEASURED = Object.freeze({ scrollTop: null, measured: false });

/**
 * 闸门卡：容器该滚到哪，**以及这一帧到底量到了没有**。
 *
 * 全部入参都在**焦点区滚动容器的内容坐标系**里（不是视口坐标）——调用方负责换算
 * （`卡片 rect.top - 容器 rect.top + 容器 scrollTop`），本函数不碰 DOM。
 *
 * @param {{ cardTop: number, cardHeight: number, viewportHeight: number, scrollTop: number }} input
 * @returns {{ scrollTop: number | null, measured: boolean }}
 *   `measured: false` ＝ **这一帧不算数**（量不到），调用方不要拿它当「已经摆过」；
 *   `measured: true` ＋ `scrollTop: null` ＝ 量到了，且**不要动**。
 */
export function decisionCardScroll(input) {
	const { cardTop, cardHeight, viewportHeight, scrollTop } = input ?? {};
	const top = Number(cardTop);
	const height = Number(cardHeight);
	const view = Number(viewportHeight);
	const from = Number(scrollTop);
	// 量不到（还没布局 / 页签未激活 / 卡还没长出来 / 这一格根本没渲染）→ **这一帧不算数**。
	if (![top, height, view, from].every(Number.isFinite)) return CARD_SCROLL_NOT_MEASURED;
	if (view <= 0 || height <= 0) return CARD_SCROLL_NOT_MEASURED;
	const bottom = top + height;
	// ① 整张卡已经在可视带里 → 一像素不动（`measured` 仍为 true：这一帧确实量到了）。
	if (
		top >= from + DECISION_CARD_MARGIN &&
		bottom <= from + view - DECISION_CARD_MARGIN
	)
		return { scrollTop: null, measured: true };
	// ② 装得下 → 顶对齐（抬头那句也一起进视野）。
	// ③ 装不下 → 底对齐：唯一定案键在卡的底部，先把它带进来。
	const fits = height + DECISION_CARD_MARGIN * 2 <= view;
	const next = Math.max(
		0,
		Math.round(
			fits ? top - DECISION_CARD_MARGIN : bottom + DECISION_CARD_MARGIN - view,
		),
	);
	return { scrollTop: next === from ? null : next, measured: true };
}

// ── 焦点区空白兜底（票 24 要求③）──────────────────────────────────────────────
//
// 「阶段片亮了 ⚡、内容区却是空的」比没有提示更让人发毛（用户的原话是「页面有问题」）。
// 空白与「还没画完」在人眼前分不开，所以**宁可多一句**：工作台那一屏该给内容而没有时，
// 焦点区必须**有一句人话**说明并给出路（刷新），而不是留一大片白。
// ⚠️ 这句话是判定线① 的出口，字只此一份。票 `ui-display-redesign/21`（spec §2.20 第 5 块）
// 起**生产上不再有调用点**：非造书会话、又没有可画的书那一支（`src/ui/surface.js` 的 bare 支）
// 换成了专用人话「这个会话没有在造书，也没有正在读的书。」——那一句说的是**这个会话本来就不是
// 在造书**，而不是「该有卡却没画出来」，借用兜底句会把处境说错。
// ⛔ 本常量与 `blankFocusText` 的**语义一个字不动**：它仍是「焦点区该有卡却没有」这条判定线，
// 判定它的那几条判据（`test-layout-anchors.mjs`）照旧逐字咬它；哪天又有真能触发它的渲染点，
// 仍走这一个出口（⛔ 不许在渲染处抄第二份字）。
// 「现在」主卡那一格**刻意没有**这道兜底：`focusCardKey` 是全函数（十个返回值每一个都有卡
// ——表上 `routedBy` 非 null 的 10 行；取样：
// `node --input-type=module -e "import {focusCardKey} from './src/ui/view-rules.js'; import {focusCardKeysOf} from './scripts/source-scan-base.mjs'; console.log(new Set(focusCardKeysOf(focusCardKey)).size)"`），
// 挂一个今天走不到的分支只会造出一条「形状断言冒充行为断言」的假绿（2026-09-30 双轴 review
// 的判断，已按它改：把那处分支与它的纯函数一起删掉，兜底只留真能触发的那一个）。

/** 焦点区兜底句（界面词只此一份；判定线① 的出口，改字要过 `test-wording-invariants.mjs`）。 */
export const BLANK_FOCUS_TEXT = "这一屏该出来的卡片没画出来。刷新一下试试。";

/**
 * 兜底句出不出：**该给内容却没给**时出，其余一律不出。
 *
 * @param {{ expectsContent?: unknown, rendered?: unknown }} input
 *   `expectsContent` ＝ 这一屏本来就该给用户一件事看；`rendered` ＝ 这一次**到底渲染了没有**。
 * @returns {string | null} 该显示的那句话；不出时 `null`
 */
export function blankFocusText(input) {
	const { expectsContent, rendered } = input ?? {};
	return expectsContent === true && rendered !== true ? BLANK_FOCUS_TEXT : null;
}


/** 段级最长公共子序列对比：返回按稿面顺序排好的操作序列（下标 0 基）。 */
export function diffParagraphs(oldParas, newParas) {
	const n = oldParas.length;
	const m = newParas.length;
	const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
	for (let i = n - 1; i >= 0; i -= 1) {
		for (let j = m - 1; j >= 0; j -= 1) {
			dp[i][j] =
				oldParas[i] === newParas[j]
					? dp[i + 1][j + 1] + 1
					: Math.max(dp[i + 1][j], dp[i][j + 1]);
		}
	}
	const ops = [];
	let i = 0;
	let j = 0;
	while (i < n && j < m) {
		if (oldParas[i] === newParas[j]) {
			ops.push({ type: "same", old: i, new: j });
			i += 1;
			j += 1;
		} else if (dp[i + 1][j] >= dp[i][j + 1]) {
			ops.push({ type: "del", old: i });
			i += 1;
		} else {
			ops.push({ type: "add", new: j });
			j += 1;
		}
	}
	while (i < n) {
		ops.push({ type: "del", old: i });
		i += 1;
	}
	while (j < m) {
		ops.push({ type: "add", new: j });
		j += 1;
	}
	return ops;
}
// ── 主 AI 上下文占用（票 28）──────────────────────────────────────────────
//
// 走查 P46 报的「书还没写完，主 AI 的上下文已经用掉一半」——数是宿主自己算好的
// `contextPressure` 会话投影，与宿主输入区角标「上下文已用 51%」同一份数据；
// 工作台之前是**没去读**，不是宿主没传。
//
// 折算口径不在这里：**它是两侧都必须知道的规则**
//（领任务说明那一半也要折同一份数），故它居于 `src/domain-rules.js`
// 的 `contextOccupancyPercent`。**这里只做再导出**，前端 import 路径一个字都不用改。
export { contextOccupancyPercent } from "../domain-rules.js";

/**
 * 章节清单头部那一句人话（**计量，不是状态**）——单侧展示文案，按领域规则模块的口径不进那里。
 *
 * ⚠️ 不占状态词的位置：CONTEXT.md「工作台状态词」的上限仍是
 * 「轮到你／我正在做／已完成」三个，「上下文已用 51%」是容量计量，
 * 既不进 `chapterBadge()`，也不进任何返回状态词的函数。
 * @param {unknown} percent 占用百分比（`contextOccupancyPercent` 的结果）
 * @returns {string} 读不到时是**空串**（调用方直接拼上去，不留空位痕迹）
 */
export function contextOccupancySentence(percent) {
	if (!Number.isFinite(percent)) return "";
	return `上下文已用 ${percent}%`;
}

// ── 材料格式（界面那两行；名单与闸门在 domain-rules.js）─────────────────────
//
// 票 `mineru-formats/07`：**词表共享、句子行文各端自己写**（本文件头部那条分工）。
// 受理名单 `MATERIAL_FORMATS` 是两侧共用的领域规则，住 `src/domain-rules.js`；
// 这里是上传区那两行**界面句子**的派生——它只读那份名单，不自己再抄一份扩展名。
//
// ⚠️ 「未标定」那句是这张票的**诚实性载荷**：名单里 14 种里有 11 种上游只有散文声明、
// 本仓**零成功记录**（票 01 真机实测只坐实 pdf / png / docx）。收下它们是为了兑现用户
// 「多格式兼容」的诉求，但**不许让用户以为每一个都是验过的**——所以未标定的那几种
// 在界面上要点名出来，而不是只在代码注释里说一句。

import { MATERIAL_FORMATS, MATERIAL_FORMAT_OFF_CHANNEL } from "../domain-rules.js";

/** 上传区那一行：支持哪些形状（按 family 归并，顺序取自名单；单一扩展名不套括号）。 */
export function materialFormatHint() {
	const groups = [];
	for (const { ext, family } of MATERIAL_FORMATS) {
		const last = groups[groups.length - 1];
		if (last !== undefined && last.family === family) last.exts.push(ext);
		else groups.push({ family, exts: [ext] });
	}
	return `支持格式：${groups
		.map((g) =>
			g.exts.length === 1 ? g.family : `${g.family}（${g.exts.join("/")}）`,
		)
		.join("、")}`;
}

/**
 * 上传区「支持格式」下面另起的那一行：**云端通道不收、但有出路**的那几档（票 `upload-formats/01`）。
 *
 * 为什么必须常显、不能只在选到它时才说：文件选择器的 `accept` **本来就列不出** `.epub`
 * （那是云端通道的事实，不能为了提示去放开选择面）——只靠「选到才提示」，用户连选都选不到，
 * 提示等于永远不出现。而票面「现象」那一句说的正是「只列白名单让人自己猜」。
 *
 * ⚠️ 句子**逐字取自** `MATERIAL_FORMAT_OFF_CHANNEL[].hint`（不在这里另写一份）：那一行短、
 * 只说「要转换、转成什么」；完整的两条出路（含命令）是 `guidance`，由**选到它时**那条红字说。
 * 两处都从表里取，只是各取一格——各写一份就会一处改了另一处没改，用户会在两个时刻读到两句
 * 不一样的话。
 */
export function offChannelMaterialFormatNote() {
	// 空格分隔：表是**设计成会变长**的（日后 md/txt 也可能登记成通道外），`join("")` 会把两句
	// 中文粘成一句。
	return MATERIAL_FORMAT_OFF_CHANNEL.map((one) => one.hint).join(" ");
}

// 票 `ui-display-redesign/17`（收口 review S8）：`materialFormatCalibrationNote()` **已退役**——
// spec §2.2 第 8 块写的是「已删」（票 02 只做到不上屏）；留着实现函数＋那条「函数出口不许被删空」
// 的断言，等于把「已删」说成「没删」。屏上「未标定／已实测可用」零出现那一条闸保留在
// `test/test-material-format.mjs`。
