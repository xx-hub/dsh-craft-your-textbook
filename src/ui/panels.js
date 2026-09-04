/**
 * 造书工作台 · 顶栏、状态条与面板
 *
 * 常驻条/横幅族：协作状态条（现在轮到谁）、主 AI 活性行、不打断提示条、
 * 自动跟随横幅；顶栏介入工具条与其展开面板（风格线/留言/自定义模式库）。
 */

import { createElement, useState } from "react";
import { S } from "./styles.js";
import { formatTime } from "./rules.js";
// 六阶段 canonical 全称（共享领域规则）。
import { PHASES } from "../domain-rules.js";

// ── 协作状态条：现在轮到谁 ───────────────────────────────────────────────────

export function StatusStrip(props) {
	const { meta, gate, pendingStage, progressDetail, metaLabel } = props;
	const status = meta?.status ?? "active";
	const phase = meta?.phase ?? 1;
	let text = null;
	let tone = "normal";
	if (status === "delivered") {
		text = `🎉 书做好了 · 可以预览和下载《${meta.name ?? ""}》.md`;
		tone = "ok";
	} else if (status === "error" || status === "needs-config") {
		text =
			status === "error"
				? "⚠️ 出错了 · 请看下面的提示"
				: "🔑 需要配置 · 请看下面的提示";
		tone = "error";
	} else if (gate !== null && gate.status === "awaiting") {
		text = `⚡ 轮到你 · 拍板第 ${gate.gate} 关`;
		tone = "you";
	} else if (status === "awaiting-gold") {
		text = "⚡ 轮到你 · 确认最佳范例章";
		tone = "you";
	} else if (status === "awaiting-explore") {
		text = "⚡ 轮到你 · 确认探查结果";
		tone = "you";
	} else if (phase === 1) {
		text = "📤 轮到你 · 上传教材（开始转换后 AI 会自动接手）";
		tone = "you";
	} else if (pendingStage !== null && pendingStage !== undefined) {
		text = `🤖 AI 干活中 · ${metaLabel ?? ""}${progressDetail ? `　⏳ ${progressDetail}` : ""}`;
		tone = "ai";
	} else {
		text = "🤖 AI 正在准备下一步…";
		tone = "ai";
	}
	const bg = {
		ok: "var(--dsw-success-soft, #dafbe1)",
		you: "var(--dsw-warn-soft, #fff8e1)",
		ai: "var(--dsw-accent-soft, #eef2ff)",
		error: "var(--dsw-danger-soft, #ffebe9)",
		normal: "transparent",
	}[tone];
	const border = {
		ok: "#1a7f37",
		you: "#d4a72c",
		ai: "var(--dsw-accent, #4f6ef7)",
		error: "var(--dsw-danger, #cf222e)",
		normal: "transparent",
	}[tone];
	return createElement(
		"div",
		{
			style: {
				borderRadius: "8px",
				padding: "8px 12px",
				margin: "0 0 10px",
				fontSize: "13px",
				background: bg,
				border: `1px solid ${border}`,
				fontWeight: 600,
			},
		},
		text,
	);
}

// ── 主 AI 活性行（F17）：AI 回合进行中 / 账面 N 分钟没动静[戳一下 AI] / 等你拍板 ─────

export function ActivityLine(props) {
	const { meta, aiActive, onNudge, subagents } = props;
	const staleMs = meta != null ? Date.now() - (meta.updatedAt ?? 0) : 0;
	// F35（2026-08-20 走查）：聚合主会话的审计/写作子代理状态——running=在跑、inactive=完成待收；
	// 对应为 0 不显示，全 0 不显示聚合行（不打扰既有活性行）。
	const agg = { running: 0, inactive: 0, ...(subagents ?? {}) };
	const aggText = [
		agg.running > 0 ? `🔎 ${agg.running} 个审计在跑` : null,
		agg.inactive > 0 ? `📥 ${agg.inactive} 个完成待收` : null,
	]
		.filter(Boolean)
		.join(" · ");
	const content = aiActive
		? "🤖 AI 回合进行中"
		: meta?.status === "running"
			? createElement(
					"span",
					null,
					`⏱ 账面 ${Math.round(staleMs / 60000)} 分钟没动静 `,
					createElement(
						"button",
						{
							style: S.smallLink,
							onClick: onNudge,
							title: "给主 AI 发一条提醒，让它继续推进（不打断它正在做的事，也不会取消）",
						},
						"[戳一下 AI]",
					),
				)
			: "⚡ 等你拍板/确认";
	return createElement(
		"div",
		{
			style: {
				margin: "0 0 10px",
				fontSize: "12px",
				opacity: 0.85,
				display: "flex",
				alignItems: "center",
				gap: "6px",
				flexWrap: "wrap",
			},
		},
		aggText !== ""
			? createElement(
					"span",
					{ style: { fontWeight: 600, color: "#0969da" } },
					aggText,
				)
			: null,
		content,
	);
}

// ── 不打断提示条（F17）：铺章中提交风格线/留言/意见成功后，焦点区顶部滑入、6 秒自清 ──

export function InterruptNote(props) {
	return createElement(
		"div",
		{
			role: "status",
			style: {
				position: "sticky",
				top: 0,
				zIndex: 20,
				margin: "0 0 10px",
				padding: "8px 12px",
				borderRadius: "8px",
				fontSize: "13px",
				background: "var(--dsw-accent-soft, #eef2ff)",
				border: "1px solid var(--dsw-accent, #4f6ef7)",
				boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
				display: "flex",
				alignItems: "center",
				gap: "8px",
			},
		},
		createElement(
			"span",
			{ style: { flex: 1 } },
			"💡 已记下；不打断正在写的这一章，AI 到下个停靠点会照办",
		),
		createElement(
			"button",
			{ style: S.smallLink, onClick: props.onClose },
			"✕",
		),
	);
}

// ── 自动跟随横幅（F5/Task 20 方案 A）：等拍板回现在 / AI 干活跳过去 ─────────────

// 顶部滑入动画（横幅共用，一次定义到处引用）。
const AUTO_FOLLOW_KEYFRAMES =
	"@keyframes dsh-auto-follow-in { from { transform: translateY(-10px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }";
// 横幅共用样式：粘顶（内容滚它不滚）、顶部滑入、与 F17 不打断提示条同一视觉语言。
const AUTO_FOLLOW_BANNER_STYLE = {
	position: "sticky",
	top: 0,
	zIndex: 20,
	margin: "0 0 10px",
	padding: "8px 12px",
	borderRadius: "8px",
	fontSize: "13px",
	background: "var(--dsw-accent-soft, #eef2ff)",
	border: "1px solid var(--dsw-accent, #4f6ef7)",
	boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
	display: "flex",
	alignItems: "center",
	gap: "8px",
	animation: "dsh-auto-follow-in 0.25s ease",
};

// 等拍板横幅：AI 进入 awaiting-* 且你正在翻历史时强制切回「现在」并亮这一条（6 秒自清由 WorkbenchView 定时器负责）。
export function AutoFollowAwaitNote(props) {
	return createElement(
		"div",
		{ role: "status", style: AUTO_FOLLOW_BANNER_STYLE },
		createElement("style", null, AUTO_FOLLOW_KEYFRAMES),
		createElement(
			"span",
			{ style: { flex: 1 } },
			"⚡ AI 在等你拍板，已切回现在",
		),
		createElement(
			"button",
			{ style: S.smallLink, onClick: props.onClose },
			"✕",
		),
	);
}

// AI 干活跳过去横幅：浏览历史时 AI 出了新进展，整条可点（点击清浏览、回「现在」）。
export function AutoFollowProgressNote(props) {
	const onDismiss = props.onDismiss ?? (() => {});
	return createElement(
		"div",
		{
			role: "status",
			style: { ...AUTO_FOLLOW_BANNER_STYLE, cursor: "pointer" },
			onClick: props.onJump,
		},
		createElement("style", null, AUTO_FOLLOW_KEYFRAMES),
		createElement("span", { style: { flex: 1 } }, "▶ AI 正在干活--点此跳过去"),
		createElement(
			"button",
			{
				style: S.smallLink,
				onClick: (e) => {
					e.stopPropagation();
					onDismiss();
				},
			},
			"✕",
		),
	);
}

// ── 顶栏介入工具条（常驻：书名 + 当前阶段 + 🎨风格线 / 📮留言 / ⏸暂停） ─────────

export function TopBar(props) {
	const { meta, openStylePanel, openIntervene, pause, resume } = props;
	// 计数从 meta 现算（旧账本 ?? [] 兜底）：风格线数=active 条数，留言数=pending 条数。
	const styleCount = (meta?.styleNotes ?? []).filter(
		(n) => n.status === "active",
	).length;
	const pendingCount = (meta?.pendingInterventions ?? []).filter(
		(i) => i.status === "pending",
	).length;
	return createElement(
		"div",
		{
			style: {
				display: "flex",
				alignItems: "center",
				gap: "8px",
				padding: "6px 8px",
				borderBottom: "1px solid var(--dsw-border, #d0d7de)",
				flexWrap: "wrap",
			},
		},
		createElement("strong", null, `《${meta?.name ?? ""}》`),
		createElement(
			"span",
			{ style: { fontSize: "12px", opacity: 0.75 } },
			`一起做到：${PHASES.find((x) => x.n === meta?.phase)?.label ?? ""}`,
		),
		createElement("span", { style: { flex: 1 } }),
		styleCount > 0
			? createElement(
					"button",
					{
						style: S.smallLink,
						onClick: openStylePanel,
						title: "你的风格意见清单（AI 写每一章都会照着办）",
					},
					`🎨 风格线(${styleCount})`,
				)
			: null,
		pendingCount > 0
			? createElement(
					"button",
					{
						style: S.smallLink,
						onClick: openIntervene,
						title: "留言稍后处理：不打断 AI，它到下个停靠点会看",
					},
					`📮 留言(${pendingCount})`,
				)
			: null,
		meta?.pause != null
			? createElement(
					"button",
					{
						style: { ...S.smallLink, color: "#1a7f37" },
						onClick: resume,
						title: "继续从断点接着写",
					},
					"▶ 已暂停·点继续",
				)
			: createElement(
					"button",
					{
						style: S.smallLink,
						onClick: pause,
						title: "暂停：这次先停下手里的活，听我的（包括小助手）",
					},
					"⏸ 暂停",
				),
	);
}

// ── 顶栏展开面板：🎨 风格线清单 / 📮 留言清单（点开即见，✕ 收起） ───────────────

export function StylePanel(props) {
	const { notes, onClose } = props;
	const list = notes ?? [];
	return createElement(
		"div",
		{
			style: {
				...S.card,
				borderColor: "var(--dsw-accent, #4f6ef7)",
				marginTop: "8px",
			},
		},
		createElement(
			"div",
			{
				style: {
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: "8px",
				},
			},
			createElement(
				"strong",
				{ style: { fontSize: "13px" } },
				`🎨 你的风格线（${list.length} 条：AI 写每一章都照着办）`,
			),
			createElement(
				"button",
				{ style: S.smallLink, onClick: onClose },
				"✕ 收起",
			),
		),
		list.length === 0
			? createElement(
					"p",
					{ style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
					"还没有风格意见。",
				)
			: list.map((note, index) =>
					createElement(
						"div",
						{
							key: note.id,
							style: { margin: "6px 0", fontSize: "13px", lineHeight: 1.55 },
						},
						createElement(
							"span",
							{ style: { fontWeight: 600 } },
							`#${index + 1}`,
						),
						` ${note.text ?? ""}`,
						note.note != null && note.note !== ""
							? createElement(
									"span",
									{ style: { opacity: 0.6, fontSize: "12px" } },
									`（${note.note}）`,
								)
							: null,
					),
				),
		createElement(
			"p",
			{ style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
			"想再记一条？在对话里直接跟 AI 说，它会记成风格线；写每一章都照着办。",
		),
	);
}

export function IntervenePanel(props) {
	const { items, onClose } = props;
	const list = items ?? [];
	return createElement(
		"div",
		{ style: { ...S.card, borderColor: "#e3b341", marginTop: "8px" } },
		createElement(
			"div",
			{
				style: {
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: "8px",
				},
			},
			createElement(
				"strong",
				{ style: { fontSize: "13px" } },
				`📮 你的留言（${list.length} 条待处理）`,
			),
			createElement(
				"button",
				{ style: S.smallLink, onClick: onClose },
				"✕ 收起",
			),
		),
		list.length === 0
			? createElement(
					"p",
					{ style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
					"没有待处理的留言。",
				)
			: list.map((item) =>
					createElement(
						"div",
						{
							key: item.id,
							style: { margin: "6px 0", fontSize: "13px", lineHeight: 1.55 },
						},
						createElement(
							"span",
							{ style: { opacity: 0.6, fontSize: "12px" } },
							formatTime(item.at),
						),
						item.target != null && item.target !== ""
							? createElement(
									"span",
									{
										style: {
											opacity: 0.7,
											fontSize: "12px",
											marginLeft: "6px",
										},
									},
									`（${item.target}）`,
								)
							: null,
						createElement("div", null, item.text ?? ""),
						createElement(
							"p",
							{ style: { margin: "2px 0 0", fontSize: "12px", opacity: 0.6 } },
							"AI 到下个停靠点会看到并处理，不打断它手里的活。",
						),
					),
				),
		createElement(
			"p",
			{ style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
			"想给 AI 留言？在对话里直接跟 AI 说，它会记成留言，到下个停靠点处理（不打断它正在写的章）。",
		),
	);
}

// ── 自定义模式库面板（2026-08-21）：粘贴描述 → AI 分析成「模式卡」加入本书 ──────

export function PatternPanel(props) {
	const { patterns, busy, onAnalyze, onClose, result } = props;
	const [text, setText] = useState("");
	const list = patterns ?? [];
	return createElement(
		"div",
		{
			style: {
				...S.card,
				borderColor: "var(--dsw-accent, #4f6ef7)",
				marginTop: "8px",
			},
		},
		createElement(
			"div",
			{
				style: {
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: "8px",
				},
			},
			createElement(
				"strong",
				{ style: { fontSize: "13px" } },
				"🧩 自定义模式库",
			),
			createElement(
				"button",
				{ style: S.smallLink, onClick: onClose },
				"✕ 收起",
			),
		),
		createElement(
			"p",
			{
				style: {
					margin: "6px 0",
					fontSize: "12px",
					opacity: 0.75,
					lineHeight: 1.6,
				},
			},
			"粘贴一段你想要的教法/章节结构描述，AI 会把它提炼成一张「模式卡」加入这本书的模式库；第 2 关「教学模式选型」和写作规范都会优先参考它。",
		),
		createElement("textarea", {
			style: { ...S.textarea, minHeight: "64px" },
			placeholder:
				"例：每个知识点先给一个生活中的真实场景引出概念，再配一道由浅入深的例题，最后放一道易错判断题……",
			value: text,
			onChange: (e) => setText(e.target.value),
		}),
		createElement(
			"div",
			{ style: { display: "flex", alignItems: "center", gap: "10px" } },
			createElement(
				"button",
				{
					style: S.bigBtn(true),
					disabled: busy || text.trim() === "",
					onClick: () => {
						onAnalyze(text.trim());
						setText("");
					},
				},
				"🤖 让 AI 分析并加入模式库",
			),
			busy
				? createElement(
						"span",
						{ style: { fontSize: "12px", opacity: 0.7 } },
						"AI 分析中…",
					)
				: null,
		),
		result !== null
			? createElement(
					"div",
					{
						style: {
							marginTop: "8px",
							padding: "8px 10px",
							borderRadius: "8px",
							background: "var(--dsw-success-soft, #dafbe1)",
							fontSize: "12px",
							lineHeight: 1.6,
						},
					},
					createElement(
						"strong",
						null,
						`✅ 已加入模式库：${result.name ?? ""}`,
					),
					result.problem != null && result.problem !== ""
						? createElement(
								"p",
								{ style: { margin: "4px 0 0" } },
								`解决：${result.problem}`,
							)
						: null,
					result.blocks != null && result.blocks !== ""
						? createElement(
								"p",
								{ style: { margin: "2px 0 0" } },
								`落地：${result.blocks}`,
							)
						: null,
				)
			: null,
		createElement(
			"p",
			{ style: { margin: "8px 0 4px", fontSize: "12px", opacity: 0.7 } },
			list.length === 0
				? "这本书还没有自定义模式。"
				: `已在这本书的模式库里（${list.length} 张）：`,
		),
		list.map((p, index) =>
			createElement(
				"div",
				{
					key: p.file ?? index,
					style: { margin: "3px 0", fontSize: "12px", lineHeight: 1.5 },
				},
				`· ${p.title ?? p.name ?? ""}${p.problem != null && p.problem !== "" ? ` — ${p.problem}` : ""}`,
			),
		),
	);
}
