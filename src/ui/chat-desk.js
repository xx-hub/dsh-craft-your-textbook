/**
 * 造书工作台 · 对话台
 *
 * 宿主对话的完整镜像（节点全集自绘；只显人话，工具噪音默认折叠一行），
 * 含账本回执徽章（F5/Task 20）与钉底滚动。独立滚动由外层容器负责。
 */

import { createElement, useEffect, useRef } from "react";
import { S } from "./styles.js";

function blockText(block) {
	if (block === null || block === undefined) return "";
	if (typeof block.text === "string") return block.text;
	return "";
}

function assistantBlocks(blocks) {
	const parts = [];
	for (const block of blocks ?? []) {
		if (block?.kind === "text") parts.push(blockText(block));
		else if (block?.kind === "tool-call")
			parts.push(`🔧 调用工具：${block.name ?? ""}`);
		else if (block?.kind === "reasoning") parts.push("（思考中…）");
	}
	return parts.join("\n");
}

function contentBlocksText(blocks) {
	const parts = [];
	for (const block of blocks ?? []) {
		if (block?.type === "text") parts.push(blockText(block));
		else if (block?.type === "tool_use")
			parts.push(`🔧 调用工具：${block.name ?? ""}`);
	}
	return parts.join("\n");
}

// 单条气泡（用户靠右、助手靠左）；从旧左栏镜像提为模块级函数，对话台与别处共用。
function bubble(side, text, extraStyle) {
	return createElement(
		"div",
		{
			style: {
				maxWidth: "88%",
				margin: "6px 0",
				padding: "8px 10px",
				borderRadius: "10px",
				fontSize: "13px",
				lineHeight: 1.55,
				whiteSpace: "pre-wrap",
				wordBreak: "break-word",
				alignSelf: side === "user" ? "flex-end" : "flex-start",
				background:
					side === "user"
						? "var(--dsw-accent-soft, #eef2ff)"
						: "var(--dsw-surface, #ffffff)",
				border: "1px solid var(--dsw-border, #d0d7de)",
				...(extraStyle ?? {}),
			},
		},
		text,
	);
}

// 工具行一句话：正在跑 / 已完成 / 出错（工具细节压成一行，避免刷屏）。
function toolLine(root) {
	const name = root?.name ?? root?.toolName ?? "工具";
	if (root?.kind === "tool-result") {
		const text = String(root?.result?.text ?? root?.text ?? "")
			.replace(/\s+/g, " ")
			.slice(0, 120);
		const ok = root?.result?.isError !== true && root?.isError !== true;
		return `🔧 ${name} · ${ok ? "完成" : "出错"}${text !== "" ? `：${text}` : ""}`;
	}
	return `🔧 ${name} · 执行中…`;
}

// 灰字小行（重试/命令/压缩等系统提示，不打扰主对话）。
function muted(text) {
	return createElement(
		"p",
		{
			style: {
				margin: "3px 0",
				fontSize: "11px",
				opacity: 0.55,
				whiteSpace: "pre-wrap",
				wordBreak: "break-word",
			},
		},
		text,
	);
}

// ── 账面回执徽章（F5/Task 20）：把落账事件按时间窗回贴到最近的 assistant 气泡 ──
// 界面只跟账走：AI 在对话里答应过的事，一旦账本里落了事件，就在最近那口气泡下面
// 亮一行绿色小字当回执，让"说了"和"落账了"在界面上接得上。
const RECEIPT_TEXT = {
	"textbook/style-note": (d) =>
		`✓ 已记入风格线${d?.styleNote?.text ? `：${String(d.styleNote.text).slice(0, 20)}…` : ""}`,
	"textbook/intervention": () => "✓ 已记入留言（下个停靠点处理）",
	"textbook/intervention-done": () => "✓ 留言已处理",
	"textbook/pause": () => "✓ 已暂停",
	"textbook/resume": () => "✓ 已继续",
	"textbook/outline-decision": (d) =>
		`✓ 章节安排${d?.approved === true ? "已通过" : "已驳回"}`,
	"textbook/gate-decision": (d) =>
		`✓ 第 ${d?.gate ?? "?"} 关${d?.approved === true ? "通过" : "驳回"}`,
	"textbook/gold-seal": () => "✓ 金标准已定稿为风格母版",
	"textbook/pattern-added": (d) =>
		`✓ 已加自定义模式${d?.name ? `：${String(d.name).slice(0, 20)}` : ""}`,
};

// 绿色小字徽章条（一行一个回执；左缩进对齐气泡内文）。
function badgeSpan(text) {
	return createElement(
		"div",
		{
			style: {
				margin: "2px 0 6px 12px",
				fontSize: "11px",
				color: "var(--dsw-success, #1a7f37)",
				lineHeight: 1.5,
				whiteSpace: "pre-wrap",
				wordBreak: "break-word",
			},
		},
		text,
	);
}

// assistant 气泡的完整文本（正文 + 状态记号）；都空就不渲染（回执也无处可贴）。
// F29（2026-08-20 走查）：真实节点形态兼容多种——chat 节点形（data.blocks）与
// 简单消息形（node.content / data.content，user 同款）。挨个试，取第一个非空。
function assistantBubbleText(node) {
	const data = node?.data ?? node ?? {};
	const fromBlocks =
		Array.isArray(data.blocks) && data.blocks.length > 0
			? assistantBlocks(data.blocks)
			: "";
	const fromContent =
		fromBlocks !== ""
			? ""
			: contentBlocksText(node?.content) || contentBlocksText(data.content);
	const text = fromBlocks || fromContent;
	const mark =
		data.status === "running"
			? "▍"
			: data.status === "interrupted"
				? "（已中断）"
				: "";
	return `${text}${mark}`;
}

// 对话台（右下：宿主对话的完整镜像，节点全集自绘；独立滚动由外层容器负责）。
export function ChatDesk(props) {
	const nodes = props.useSession((s) => s.nodes) ?? [];
	const partial = props.useSession((s) => s.partial);
	// F5 账面事件（/textbook/events，Task 20 回执徽章用）；漏账催办（Task 19 nudge，不传时安全忽略）。
	const events = props.events ?? [];
	const onNudge = props.onNudge ?? (() => {});
	const onCollapse = props.onCollapse ?? null;
	// 对话台钉底滚动（回归修复）：新消息/流式增量（nodes.length/partial）进来时，若用户正停在
	// 底部附近就自动滚到底；用户往上翻（离开底部）就不打扰，回到底部附近后重新钉住。
	// 清理安全：effect 只返回 undefined，随组件卸载/重渲一并回收，无外部监听残留。
	const deskScrollRef = useRef(null);
	useEffect(() => {
		const el = deskScrollRef.current;
		if (el === null) return undefined;
		const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
		if (nearBottom) el.scrollTop = el.scrollHeight;
		return undefined;
	}, [nodes.length, partial]);
	// 打开对话台时默认滚到最新一条消息：ChatDesk 在展开态才挂载，挂载即无条件钉底
	// （上面的 effect 只在用户已停在底部附近时才滚，长对话刚打开时会停在顶部）。
	useEffect(() => {
		const el = deskScrollRef.current;
		if (el !== null) el.scrollTop = el.scrollHeight;
		return undefined;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	const items = [];
	const push = (el) => items.push(el);
	// 回执徽章预计算：先收集每个会渲染的 assistant 气泡的时间戳（按渲染顺序编号），
	// 再把每个落账事件交给「它之前最近、且不早于 5 分钟」的那口气泡（最近语义，一条只贴一次）。
	// 防御：宿主 assistant 节点可能没带 data.time（旧账本/宿主结构差异）——先读 data.time 再退回
	// node.time，都没有就记为无效时间（不参与回贴、也不崩）；这同时兼容冒烟测试用 data.time 的伪节点。
	const assistantTimes = [];
	for (const node of nodes ?? []) {
		// F29：真实 kind 是 assistant-step 或 assistant；正文可能在 data.blocks 或 node.content。
		if (node.kind !== "assistant-step" && node.kind !== "assistant") continue;
		if (assistantBubbleText(node) !== "")
			assistantTimes.push(Number(node.data?.time ?? node.time));
	}
	const badgeByAssistant = new Map(); // assistant 序号 -> 徽章文本数组
	for (const e of events) {
		const textOf = RECEIPT_TEXT[e.type];
		if (textOf === undefined || typeof e.time !== "number") continue;
		let best = -1;
		for (let i = 0; i < assistantTimes.length; i += 1) {
			const t = assistantTimes[i];
			if (Number.isFinite(t) && e.time >= t && e.time - t < 5 * 60 * 1000)
				best = i;
		}
		if (best >= 0) {
			const arr = badgeByAssistant.get(best) ?? [];
			arr.push(badgeSpan(textOf(e.data)));
			badgeByAssistant.set(best, arr);
		}
	}
	let assistantOrdinal = -1;
	for (const node of nodes ?? []) {
		const data = node.data ?? {};
		switch (node.kind) {
			case "user":
			case "steering": {
				const text = contentBlocksText(node.content);
				if (text !== "") push(bubble("user", text));
				break;
			}
			// F29 修复（2026-08-20 实书走查）：真实 ChatNodeKind 是 assistant-step/tool-call/
			// model-retry/command-input/manual-compaction/unknown（Inspect conversation.chat.node
			// key 域）；旧代码用 assistant/tool/retry/command/compaction/fallback 对不上，
			// 导致 AI 消息/工具卡被静默丢弃（用户消息 kind=user 恰好匹配所以能显示）。
			// 主用真实名，保留旧名作兼容。
			case "assistant-step":
			case "assistant": {
				const text = assistantBubbleText(node);
				if (text !== "") {
					assistantOrdinal += 1;
					push(bubble("assistant", text));
					// 账面回执徽章：这口气泡的回执贴到它下面（最近语义已在预计算里定好）。
					const badges = badgeByAssistant.get(assistantOrdinal);
					if (badges !== undefined) for (const b of badges) push(b);
				}
				break;
			}
			case "tool-call":
			case "tool":
				push(toolLine(data.root));
				break;
			case "turn-error":
				push(
					bubble(
						"assistant",
						`⚠️ 出错了：${data.message ?? node.message ?? ""}`,
						{ color: "var(--dsw-danger, #cf222e)" },
					),
				);
				break;
			case "model-retry":
			case "retry":
				push(
					muted(`↻ 模型自动重试（第 ${(data.attempts ?? []).length + 1} 次）`),
				);
				break;
			case "command":
			case "command-input":
				push(muted(`⌘ /${data.command?.name ?? "命令"} 已执行`));
				break;
			case "compaction":
			case "manual-compaction":
				push(muted("🧹 早期对话已压缩（内容要点保留）"));
				break;
			case "turn-max-tokens":
				push(muted("⚠️ 这一轮写到长度上限被截断"));
				break;
			case "unknown":
			case "fallback":
				push(muted(data.message ?? "（一段未识别的记录）"));
				break;
			// F29：context 是「注入的上下文」消息（system-reminder/上下文快照等），正文在 data.content，
			// 灰字折行显示（会很长，截断到 200 字提示即可，别刷屏）。
			case "context": {
				const ctxText = (
					contentBlocksText(data.content) ||
					String(data.text ?? data.message ?? "")
				)
					.replace(/\s+/g, " ")
					.trim();
				push(
					muted(
						ctxText !== ""
							? `（上下文）${ctxText.slice(0, 200)}${ctxText.length > 200 ? "…" : ""}`
							: "（上下文提示）",
					),
				);
				break;
			}
			case "workflow-run":
				push(muted("（工作流运行）"));
				break;
			default:
				break; // turn-tail 等页脚行不进镜像
		}
	}
	if (partial != null && partial.blocks != null) {
		const text = assistantBlocks(partial.blocks);
		if (text !== "") push(bubble("assistant", `${text}▍`));
	}
	if (items.length === 0)
		push(muted("对话会实时显示在这里；你对 AI 说话用页面底下的输入条。"));
	// 外层是对话台自己的滚动容器（旧 ChatMirror 的 chatPaneRef 钉底滚动回归修复）：
	// 钉底 effect 由上面的 deskScrollRef 驱动，用户翻上去不打扰；「收成一条」在容器内粘顶。
	return createElement(
		"div",
		{
			ref: deskScrollRef,
			style: {
				height: "100%",
				overflowY: "auto",
				display: "flex",
				flexDirection: "column",
				boxSizing: "border-box",
			},
		},
		onCollapse !== null
			? createElement(
					"div",
					{
						style: {
							position: "sticky",
							top: 0,
							background: "inherit",
							textAlign: "right",
						},
					},
					createElement(
						"button",
						{ style: S.smallLink, onClick: onCollapse },
						"收成一条",
					),
				)
			: null,
		createElement(
			"div",
			{
				style: {
					display: "flex",
					flexDirection: "column",
					padding: "10px 12px",
					minHeight: "100%",
					boxSizing: "border-box",
				},
			},
			...items,
			// 漏账催办（F5/Task 20）：对话台底部常驻小按钮，一键催主 AI 落账（nudge 动作）。
			createElement(
				"button",
				{
					style: { ...S.smallLink, margin: "6px 0" },
					onClick: () =>
						onNudge(
							"工作台还没跟上，请把刚才答应的事落账（style-note/progress 等）",
						),
				},
				"⏰ 提醒 AI 落账",
			),
		),
	);
}
