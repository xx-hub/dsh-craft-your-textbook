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
 * 些小助手里，最老的一次动静是什么时候**（宿主侧字段走 `indexRunningSubagentActivity`，
 * 与 `indexSubagentDescendants` 同口径聚合）。它自称在跑、却已经到门槛，就算不再算"在推进"。
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
	// 自称在跑的小助手里最老的那次动静（取不到 = 不知道，维持原判据）。
	const activeSince =
		Number.isFinite(subagentActiveSince) && subagentActiveSince > 0 ? subagentActiveSince : null;
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
 * @param {Record<string, { id?: string, parentId?: string, origin?: string, running?: boolean, updatedAt?: number }>} summaries
 * @returns {Map<string, number>} 祖先 id → 它名下「自称在跑」的后代里**最老**的那次动静时刻
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
			// 取 min：一群小助手里**最老**的那个才是这件事的上限（最老的还没动静 = 全都没动静）。
			if (known === undefined || since < known) indexed.set(current.parentId, since);
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
// → 主 AI 上报的流水线阶段（chapterPipeline）→ 旧四态账本推导兜底。
//
// ⚠️ 票 10（判定一 #1/#2，2026-09-23）：徽章**一律「状态词 · 在做什么」**——状态词只取
// CONTEXT.md「工作台状态词」那三个（轮到你 / 我正在做 / 已完成），后半句才是这一章在干哪道工序。
// 原来这里有四套并行说法（「执笔中」「审计中」「写好了，审计中」「写完·审过·AI 把过关」），
// 既违反「状态词只此三个」，又把机器词「审计」摆到人眼上（判定三 #7）。后半句统一说「检查」
// （内部词→界面词的同一份译法见 view-rules.CHECK_UI / domain-rules.stageLabelHuman）。
// 「有意见待 AI 修订」保持不变：它是本词表认可的界面词（CONTEXT.md「意见」词条）。
export function chapterBadge(row, pendingReviews, doneSet, pipelineStage) {
	const hasReview = hasPendingReview(pendingReviews, row.n);
	// 「该章已完成」的两个来源（doneSet 交工事件 / 主 AI 上报 done）走同一句。
	const settled = () =>
		hasReview
			? { icon: "📝", text: "轮到你 · 有意见待修订", tone: "#cf222e" }
			: { icon: "🛡️", text: "已完成 · 审过", tone: "#1a7f37" };
	if (doneSet.has(row.n)) return settled();
	// F35（2026-08-20 走查）：主 AI 经 progress 动作上报的章级流水线阶段；demo/旧账本为 null → 回退四态。
	if (pipelineStage === "writing")
		return { icon: "⏳", text: "我正在做 · 执笔", tone: "#e3b341" };
	if (pipelineStage === "auditing")
		return { icon: "🔍", text: "我正在做 · 检查", tone: "#0969da" };
	if (pipelineStage === "audited")
		return { icon: "🔎", text: "我正在做 · 等复核", tone: "#0969da" };
	if (pipelineStage === "finalizing")
		return { icon: "👁", text: "我正在做 · 复核", tone: "#57606a" };
	if (pipelineStage === "done") return settled();
	if (row.written && row.audited)
		return { icon: "👁", text: "我正在做 · 复核", tone: "#57606a" };
	if (row.written)
		return { icon: "🔍", text: "我正在做 · 检查", tone: "#0969da" };
	return { icon: "⏳", text: "我正在做 · 执笔", tone: "#e3b341" };
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

// 段落级意见（带 kind）在章节卡上的三个说法。gold-table 的正文标记区另有一份（它不在本票开口内）；
// 两处说的都是同一件事，改一处要一起想——见 `.scratch/dead-gates/issues/10-章节卡已处置与翻案.md`。
const REVIEW_KIND_TEXT = {
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
			text: how === "" ? "已处置（AI 没写说明）" : `已处置 · ${how}`,
			revocable: true,
		};
	}
	if (review?.status === "revoked")
		return { key: "revoked", text: REVIEW_REVOKED_TEXT, revocable: false };
	if (review?.status === "pending")
		return {
			key: "pending",
			text: "还没处置 · 这一章交工前要先处置它",
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

// ── 焦点区吸底决策条（走查 P3 / `walkthrough-fixes` 票 20）────────────────────────
//
// 确认点上的推进键（「✅ 满意，继续设计」）原本埋在几千字报告底下：真机量到焦点区滚动容器
// `clientH 1165 / scrollH 2949`，那颗键在容器内 `top 2926`＝要滚过约 2.9 个视口高度才摸得到。
// 票面把形态留给实现者定，只钉三条硬要求：
//   ①**只在 `scrollH > clientH`（内容超出）时出现**——不超出时凭空插一条是纯噪音；
//   ②出现时给滚动区留出**等于自身高度**的下边距，最后一行可点元素不许被它压住；
//   ③它不是容器级 `onClick` 的整块热区（spec 不变量 2）——条上那颗按钮自己就是热区，
//     身份＝**发动作**（推进键那条动作），不是"又展开又发动作"的整块。
//
// 判据收在这里一处（纯函数、可独立测）；`client-entry.js` 只负责量、只负责渲染。
// ⚠️ 真几何（2.9 个视口那个数、吸底后 `elementFromPoint` 命中谁）node 侧量不到，
// 这里只判"出不出、留多少"，不冒充位置级事实。
export function stickyDecisionBar({ enabled, scrollHeight, clientHeight, barHeight }) {
	const content = Number(scrollHeight);
	const view = Number(clientHeight);
	// 量不到（还没布局 / 页签未激活，`clientHeight` 为 0）时不猜：宁可不出这条。
	const overflow = Number.isFinite(content) && Number.isFinite(view) && view > 0 && content > view;
	if (enabled !== true || overflow === false) return { show: false, paddingBottom: 0 };
	const height = Math.round(Number(barHeight));
	// 自身高度还没量到时留 0（宁可先不挡，也不要按猜的数留白）；量到了就一字不差地留出来。
	return { show: true, paddingBottom: Number.isFinite(height) && height > 0 ? height : 0 };
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
