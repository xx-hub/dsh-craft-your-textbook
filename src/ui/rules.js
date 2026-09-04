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

// 章级徽章（F17 四态 + F35 五态）：优先级 doneSet（agent-end 含「完成」+第N章，F40 语义最高，
// 防「写第N章」「自查第N章」提前标完成）→ 主 AI 上报的流水线阶段（chapterPipeline）→ 旧四态账本推导兜底。
export function chapterBadge(row, pendingReviews, doneSet, pipelineStage) {
	const hasReview = (pendingReviews ?? []).some(
		(r) => Number(r.chapter) === Number(row.n),
	);
	if (doneSet.has(row.n)) {
		return hasReview
			? { icon: "📝", text: "有意见待 AI 修订", tone: "#cf222e" }
			: { icon: "🛡️", text: "写完·审过·AI 把过关", tone: "#1a7f37" };
	}
	// F35（2026-08-20 走查）：主 AI 经 progress 动作上报的章级流水线阶段；demo/旧账本为 null → 回退四态。
	if (pipelineStage === "writing")
		return { icon: "⏳", text: "执笔中", tone: "#e3b341" };
	if (pipelineStage === "auditing")
		return { icon: "🔍", text: "审计中", tone: "#0969da" };
	if (pipelineStage === "audited")
		return { icon: "🔎", text: "审计完成，等 AI 终审", tone: "#0969da" };
	if (pipelineStage === "finalizing")
		return { icon: "👁", text: "AI 终审中", tone: "#57606a" };
	if (pipelineStage === "done") {
		return hasReview
			? { icon: "📝", text: "有意见待 AI 修订", tone: "#cf222e" }
			: { icon: "🛡️", text: "写完·审过·AI 把过关", tone: "#1a7f37" };
	}
	if (row.written && row.audited)
		return { icon: "👁", text: "AI 终审中", tone: "#57606a" };
	if (row.written)
		return { icon: "🔍", text: "写好了，审计中", tone: "#0969da" };
	return { icon: "⏳", text: "执笔中", tone: "#e3b341" };
}

// 已完成的章（纯账本推导）：events 里「AI 完成某章」的 agent-end 事件（label 含 第N章）。
// F40（2026-08-20 走查）收紧：label 必须同时含「完成」，「写第N章」「自查第N章」这类
// 中间事件不再提前把章标成完成。抽成纯函数便于冒烟直接断言。
export function deriveDoneSet(events) {
	const set = new Set();
	for (const event of events ?? []) {
		if (event.type !== "textbook/agent-end") continue;
		const label = String(event.data?.label ?? "");
		// F40（2026-08-20 走查）：label 必须同时含「完成」，否则「写第N章」「自查第N章」
		// 这类中间事件会把章提前标成完成。
		if (!label.includes("完成")) continue;
		const match = /第(\d+)章/.exec(label);
		if (match !== null) set.add(Number(match[1]));
	}
	return set;
}

// F22（2026-08-20）：浏览历史（browsing 非空）时主进度条隐藏，回到现在（null）才显示。
export function mainProgressVisible(browsing) {
	return browsing === null;
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
