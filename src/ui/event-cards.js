/**
 * 造书工作台 · 流程卡片群
 *
 * 焦点区按流水线状态切换的那组卡片：进度条、向导卡、上传区、状态/错误卡、
 * 交付卡、关卡拍板卡，以及 MinerU Token 常驻入口。
 * 还包括事件账本的人话文案映射（cardText/cardIcon）——「之前的过程」列表也用它。
 */

import { createElement, useEffect, useRef, useState } from "react";
import { S } from "./styles.js";
// 双端共享领域件：六阶段全称、素材角色、角色识别兜底、事件含义表（单一事实来源）。
import { PHASES, ROLES, guessRoleFromName, EVENT_META, MAX_UPLOAD_BYTES, uploadTooLargeMessage } from "../domain-rules.js";

function cardText(event) {
	const data = event.data ?? {};
	switch (event.type) {
		case "textbook/phase-start":
			return `阶段 ${data.phase} 开始：${data.label ?? ""}`;
		case "textbook/phase-end":
			return `阶段 ${data.phase} 完成：${data.label ?? ""}`;
		case "textbook/agent-start":
			return `AI 开始：${data.label ?? ""}`;
		case "textbook/agent-end":
			return `AI 完成：${data.label ?? ""}`;
		case "textbook/gate-proposal":
			return `AI 提案（第 ${data.gate ?? "?"} 关 · v${data.version ?? "?"}）：${data.title ?? ""}`;
		case "textbook/gate-decision":
			return data.approved === true
				? `第 ${data.gate ?? "?"} 关通过（v${data.version ?? "?"}）`
				: `第 ${data.gate ?? "?"} 关驳回（v${data.version ?? "?"}）${data.reasons?.length > 0 ? `：${data.reasons.join("、")}` : ""}`;
		case "textbook/mineru-progress":
			return `转换 ${data.file ?? ""}：${data.stage ?? ""}`;
		case "textbook/rollback":
			return `↩️ 已回退到快照 ${data.snapshot ?? "?"}`;
		case "textbook/source-added":
			return `已上传材料：${data.file ?? ""}（${data.role ?? ""}）`;
		case "textbook/hint":
			return `💡 ${data.text ?? ""}`;
		case "textbook/error":
			return `⚠️ 出错（${data.task ?? ""}）：${data.message ?? ""}`;
		case "textbook/quality":
			return `质量门：${(data.checks ?? []).filter((c) => c.ok === true).length}/${(data.checks ?? []).length} 项通过`;
		case "textbook/delivery":
			return "🎉 交付完成";
		case "textbook/stage-start":
			return `🎯 交给 AI 动手：${data.label ?? data.stage ?? ""}`;
		case "textbook/progress":
			return `⏳ ${data.label ?? ""}${data.detail ? `：${data.detail}` : ""}`;
		case "textbook/review":
			return `👀 抽查意见（${data.title ?? `第${data.chapter ?? "?"}章`}）：${data.comment ?? ""}`;
		case "textbook/ai-report":
			return `🛡️ AI 自查报告：${data.report ?? ""}`;
		case "textbook/deep-modify":
			return `✏️ 定点修改：${data.segment ?? ""}`;
		case "textbook/deep-undo":
			return `↩️ 撤销定点修改：${data.segment ?? ""}`;
		case "textbook/pattern-added":
			return `📇 已加自定义模式：${data.name ?? ""}`;
		case "textbook/gold-chapter":
			return `👑 金标准章：第 ${data.chapter ?? "?"} 章`;
		case "textbook/chapters-review":
			return `🔍 章节过目确认（${data.approved === true ? "通过" : "驳回"}）`;
		case "textbook/final-approve":
			return `✅ 终检认可${data.approved === true ? "" : `：${data.note ?? ""}`}`;
		default:
			// 兜底读 EVENT_META（label/emoji 双端共用）——绝不回落到 raw 机器串。
			return `${EVENT_META[event.type]?.emoji ?? ""} ${EVENT_META[event.type]?.label ?? event.type}`.trim();
	}
}

function cardIcon(event) {
	// 「通过/驳回」变体按 data.approved 覆盖基准 emoji（EVENT_META 只放基准）。
	if (event.type === "textbook/gate-decision" || event.type === "textbook/outline-decision")
		return event.data?.approved === true ? "✅" : "↩️";
	return EVENT_META[event.type]?.emoji ?? "•";
}

export { cardText, cardIcon };

// ── 进度条 ──────────────────────────────────────────────────────────────────

// 进度条窄格用的短标签（展示层缩写；canonical 全称以 domain-rules.js 的 PHASES 为准）。
const SHORT_PHASE_LABELS = { 3: "设计", 5: "铺章", 6: "交付" };

export function PhaseBar(props) {
	const { phase, gate, status, onSelect, productOf } = props;
	const doneUpTo = phase - 1;
	const gateAwaiting = gate !== null && gate.status === "awaiting";
	const humanTurn = props.humanTurn === true || (gateAwaiting && phase === 3);
	return createElement(
		"div",
		{ style: S.bar },
		PHASES.map((item) => {
			let state = "pending";
			if (
				item.n < phase ||
				status === "delivered" ||
				(status === "awaiting-explore" && item.n <= 2) ||
				(status === "awaiting-outline" && item.n <= 3) ||
				(status === "awaiting-gold" && item.n <= 4) ||
				(status === "awaiting-chapters-review" && item.n <= 5)
			)
				state = "done";
			else if (item.n === phase) state = "current";
			let label = SHORT_PHASE_LABELS[item.n] ?? item.label;
			if (item.n === phase && humanTurn) label = "⚡轮到你";
			const product =
				typeof productOf === "function" ? productOf(item.n) : null;
			if (product !== null && state === "done") label = `${label} 📄`;
			const clickable = product !== null;
			return createElement(
				"div",
				{
					key: item.n,
					style: {
						...S.seg(state),
						...(clickable ? { cursor: "pointer" } : {}),
					},
					title: clickable ? `查看「${product.label}」` : undefined,
					onClick:
						clickable && typeof onSelect === "function"
							? () => onSelect(item.n)
							: undefined,
				},
				label,
			);
		}),
	);
}

// ── 向导卡 ──────────────────────────────────────────────────────────────────

export function WizardCard(props) {
	const {
		onCreate,
		onCreateDemo,
		busy,
		suggestions,
		suggestLoading,
		onSuggest,
	} = props;
	const [name, setName] = useState("");
	const [goal, setGoal] = useState("");
	const [route, setRoute] = useState("blueprint");
	const [science, setScience] = useState(false);
	const [agree, setAgree] = useState(false);
	const [hint, setHint] = useState("");
	const [error, setError] = useState(null);

	// 书名/目标去前缀（前端兜底）：AI 建议偶尔带「开始：」「书名：」等口水前缀，填入前剥掉。
	// 源头净化在 content-lib.js wizardSuggest（后端），这里防历史/其他来源漏网。
	const stripPrefix = (s) =>
		typeof s === "string"
			? s.replace(/^\s*(?:开始|书名|建议|题目|目标)[:：]\s*/, "")
			: s;

	const pickSuggestion = (suggestion) => {
		setName(stripPrefix(suggestion.name ?? ""));
		setGoal(stripPrefix(suggestion.goal ?? ""));
		setScience(suggestion.science === true);
		setError(null);
	};

	const requestSuggest = () => {
		setError(null);
		void onSuggest(hint.trim()).catch((err) =>
			setError(String(err instanceof Error ? err.message : err)),
		);
	};

	const submit = () => {
		if (name.trim() === "") {
			setError("请填写书名");
			return;
		}
		if (goal.trim() === "") {
			setError("请填一下：这本书学完，学习者要能做到什么？");
			return;
		}
		if (!agree) {
			setError("请先勾选材料声明");
			return;
		}
		onCreate({ name: name.trim(), goal: goal.trim(), route, science });
	};

	return createElement(
		"div",
		{ style: S.focus },
		createElement(
			"div",
			null,
			createElement(
				"strong",
				{ style: { fontSize: "14px" } },
				'📚 第一步 · 材料准备：先给书"建档"（10 秒），然后就能上传教材',
			),
		),
		createElement(
			"div",
			{ style: { marginTop: "8px" } },
			createElement(
				"label",
				{ style: { ...S.label, marginTop: "0" } },
				"学习者的背景（选填，让建议更贴切）",
			),
			createElement(
				"div",
				{ style: { display: "flex", gap: "6px" } },
				createElement("input", {
					style: { ...S.input, margin: "4px 0 6px", flex: 1 },
					placeholder: "比如：三年级，想补古诗背诵和作文",
					value: hint,
					onChange: (e) => setHint(e.target.value),
				}),
				createElement(
					"button",
					{
						style: { ...S.bigBtn(true), padding: "6px 14px", marginTop: "4px" },
						onClick: requestSuggest,
						disabled: suggestLoading,
					},
					"✨ AI 建议",
				),
			),
		),
		suggestions.length > 0
			? createElement(
					"div",
					{ style: { marginTop: "4px" } },
					createElement(
						"p",
						{ style: { margin: "0 0 4px", fontSize: "12px", opacity: 0.7 } },
						"点一个 AI 建议自动填好（可再改）",
						createElement(
							"button",
							{
								style: { ...S.smallLink, marginLeft: "10px" },
								onClick: requestSuggest,
								disabled: suggestLoading,
							},
							"换一批",
						),
					),
					suggestions.map((suggestion, index) =>
						createElement(
							"button",
							{
								key: index,
								style: {
									...S.projectBtn(false),
									margin: "0 6px 6px 0",
									textAlign: "left",
								},
								onClick: () => pickSuggestion(suggestion),
							},
							`${suggestion.name ?? ""}：${(suggestion.goal ?? "").slice(0, 30)}${(suggestion.goal ?? "").length > 30 ? "…" : ""}`,
						),
					),
				)
			: suggestLoading
				? createElement(
						"p",
						{ style: { margin: "8px 0", fontSize: "12px", opacity: 0.7 } },
						"💡 AI 正在想建议……",
					)
				: null,
		createElement("label", { style: S.label }, "书名"),
		createElement("input", {
			style: S.input,
			placeholder: "比如：初中数学·有理数",
			value: name,
			onChange: (e) => setName(e.target.value),
		}),
		createElement("label", { style: S.label }, "这本书学完，要能做到什么？"),
		createElement("textarea", {
			style: S.textarea,
			placeholder:
				"比如：能独立做对教材配套的基础题，并说出每个概念是什么、为什么、怎么用",
			value: goal,
			onChange: (e) => setGoal(e.target.value),
		}),
		createElement("label", { style: S.label }, "给谁用？"),
		createElement(
			"label",
			{ style: S.checkItem },
			createElement("input", {
				type: "radio",
				name: "route",
				checked: route === "blueprint",
				onChange: () => setRoute("blueprint"),
			}),
			" 给 AI 老师上课用（推荐，教学精度最高）",
		),
		createElement(
			"label",
			{ style: S.checkItem },
			createElement("input", {
				type: "radio",
				name: "route",
				checked: route === "human",
				onChange: () => setRoute("human"),
			}),
			" 给人直接读的教材（AI 也能拿它教）",
		),
		createElement(
			"label",
			{ style: S.checkItem },
			createElement("input", {
				type: "checkbox",
				checked: science,
				onChange: (e) => setScience(e.target.checked),
			}),
			" 理科内容（公式较多，转换时开启公式识别）",
		),
		createElement(
			"label",
			{ style: S.checkItem },
			createElement("input", {
				type: "checkbox",
				checked: agree,
				onChange: (e) => setAgree(e.target.checked),
			}),
			" 我确认：只上传我有权使用的材料；造出来的是教学参考，AI 可能讲错，使用前我会请老师/家长复核",
		),
		error !== null ? createElement("p", { style: S.error }, error) : null,
		createElement(
			"div",
			{ style: { marginTop: "8px" } },
			createElement(
				"button",
				{ style: S.bigBtn(true), onClick: submit, disabled: busy },
				"创建这本书",
			),
		),
		createElement(
			"p",
			{ style: { margin: "10px 0 0", fontSize: "12px", opacity: 0.75 } },
			"还不确定这套流程适不适合你？",
			createElement(
				"button",
				{
					style: { ...S.smallLink, marginLeft: "6px" },
					disabled: busy,
					onClick: () => onCreateDemo(),
				},
				"先建一本演示书试试（不花模型额度，2 分钟走完全程）",
			),
		),
		createElement(
			"div",
			{
				style: {
					marginTop: "12px",
					padding: "8px 10px",
					fontSize: "12px",
					lineHeight: 1.6,
					opacity: 0.75,
					border: "1px solid var(--dsw-border, #d0d7de)",
					borderRadius: "8px",
					background: "var(--dsw-surface, #fff)",
				},
			},
			createElement(
				"p",
				{ style: { margin: "0 0 4px" } },
				"本项目是",
				createElement(
					"a",
					{
						href: "https://www.socratopia.app/r/SCR-FEJXMQ",
						target: "_blank",
						rel: "noopener noreferrer",
						style: {
							color: "var(--dsw-accent, #4f6ef7)",
							textDecoration: "underline",
						},
					},
					"【破卷】",
				),
				"的衍生项目，💡 如果本项目对你有帮助，欢迎填写邀请码：SCR-FEJXMQ，可免费领取 100 万 tokens，全场官方造书免费学习。",
			),
			createElement(
				"p",
				{ style: { margin: "0" } },
				"把造好的书交给",
				createElement(
					"a",
					{
						href: "https://www.socratopia.app/r/SCR-FEJXMQ",
						target: "_blank",
						rel: "noopener noreferrer",
						style: {
							color: "var(--dsw-accent, #4f6ef7)",
							textDecoration: "underline",
						},
					},
					"【破卷】",
				),
				"，即可享受3A游戏的沉浸感以及三倍以上的学习效率。",
			),
		),
	);
}

// ── 上传区（Phase 1） ───────────────────────────────────────────────────────

export function UploadArea(props) {
	const { sources, converting, onUpload, onConvert, onIdentify, busy } = props;
	const [pending, setPending] = useState([]); // [{ name, file, role }]
	const [identifying, setIdentifying] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState(null);
	const dirtyRef = useRef({});

	// 选择文件（可多选）：先按文件名秒猜角色，再让 AI 精识别。
	const pick = (e) => {
		setError(null);
		const files = Array.from(e.target.files ?? []);
		e.target.value = "";
		if (files.length === 0) return;
		const seen = new Set();
		const next = pending.filter(
			(item) => !files.some((f) => f.name === item.name),
		);
		files.forEach((file) => {
			if (seen.has(file.name)) return;
			seen.add(file.name);
			next.push({ name: file.name, file, role: guessRoleFromName(file.name) });
		});
		setPending(next);
		if (next.length > 0) void identify(next);
	};

	const setRole = (name, role) => {
		dirtyRef.current[name] = true; // 用户手动改过：AI 识别结果不再覆盖
		setPending((prev) =>
			prev.map((item) => (item.name === name ? { ...item, role } : item)),
		);
	};

	// AI 识别角色：一次请求识别所有文件；失败就保留规则猜测。
	const identify = async (list) => {
		setIdentifying(true);
		try {
			const roles = await onIdentify(list.map((item) => item.name));
			const byName = new Map(roles.map((r) => [r.file, r.role]));
			setPending((prev) =>
				prev.map((item) =>
					byName.has(item.name) && !dirtyRef.current[item.name]
						? { ...item, role: byName.get(item.name) }
						: item,
				),
			);
		} catch {
			// 保持规则猜测
		} finally {
			setIdentifying(false);
		}
	};

	const uploadAll = async () => {
		if (pending.length === 0) {
			setError("请先选择 PDF 文件");
			return;
		}
		setUploading(true);
		setError(null);
		const failed = [];
		for (const item of pending) {
			// 超限直接标记失败（服务端 413 同一文案），不发起注定失败的大请求。
			if (item.file.size > MAX_UPLOAD_BYTES) {
				failed.push({
					item,
					message: uploadTooLargeMessage(),
					retryable: false,
				});
				continue;
			}
			try {
				await onUpload(item.file, item.role);
			} catch (err) {
				failed.push({
					item,
					message: String(err instanceof Error ? err.message : err),
					retryable: err?.retryable !== false,
				});
			}
		}
		if (failed.length === 0) {
			setPending([]);
			dirtyRef.current = {};
		} else {
			// 只保留失败的项：重试不重传已成功落盘的（服务端已按文件名幂等，重复传也不会再加一条）。
			const failedNames = new Set(failed.map((f) => f.item.name));
			setPending((prev) => prev.filter((i) => failedNames.has(i.name)));
			const first = failed[0];
			const retryHint =
				first.retryable === false ? "" : "；重试只会重传这一本";
			const anyRetryable = failed.some((f) => f.retryable !== false);
			setError(
				failed.length === 1
					? `上传失败：${first.item.name}（${first.message}${retryHint}）`
					: `有 ${failed.length} 本上传失败（如 ${first.message}）${anyRetryable ? "，将仅重试失败项" : ""}`,
			);
		}
		setUploading(false);
	};

	return createElement(
		"div",
		{ style: S.focus },
		createElement(
			"strong",
			{ style: { fontSize: "14px" } },
			"① 上传教材 PDF（可一次选多本）",
		),
		createElement(
			"p",
			{ style: { margin: "4px 0 8px", fontSize: "12px", opacity: 0.7 } },
			"书文件夹建在当前工作区目录里（文件夹名＝书名，见上方 📁 路径），上传的 PDF 都保存在里面。每本是什么角色由 AI 自动识别，你只需要确认。",
		),
		createElement("label", { style: S.label }, "选择 PDF（可多选）"),
		createElement("input", {
			type: "file",
			accept: ".pdf",
			multiple: true,
			style: S.input,
			onChange: pick,
		}),
		pending.length > 0
			? createElement(
					"div",
					{ style: { marginTop: "8px" } },
					createElement(
						"div",
						{
							style: {
								display: "flex",
								alignItems: "center",
								gap: "6px",
								marginBottom: "4px",
							},
						},
						createElement(
							"span",
							{ style: { fontSize: "12px", fontWeight: 600 } },
							`待上传 ${pending.length} 本：`,
						),
						identifying
							? createElement(
									"span",
									{ style: { fontSize: "12px", opacity: 0.7 } },
									"✨ AI 识别角色中…",
								)
							: createElement(
									"span",
									{ style: { fontSize: "12px", opacity: 0.7 } },
									"✅ 已自动识别，可下拉修改",
								),
					),
					pending.map((item) =>
						createElement(
							"div",
							{
								key: item.name,
								style: {
									display: "flex",
									gap: "8px",
									alignItems: "center",
									margin: "4px 0",
								},
							},
							createElement(
								"span",
								{
									style: {
										flex: 1,
										fontSize: "12px",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									},
								},
								item.name,
							),
							createElement(
								"select",
								{
									style: {
										...S.input,
										width: "108px",
										margin: "0",
										padding: "4px 6px",
									},
									value: item.role,
									onChange: (e) => setRole(item.name, e.target.value),
								},
								ROLES.map((role) =>
									createElement("option", { key: role, value: role }, role),
								),
							),
						),
					),
				)
			: null,
		error !== null ? createElement("p", { style: S.error }, error) : null,
		createElement(
			"div",
			{
				style: {
					marginTop: "8px",
					display: "flex",
					gap: "8px",
					alignItems: "center",
				},
			},
			createElement(
				"button",
				{
					style: { ...S.bigBtn(true), padding: "8px 14px" },
					onClick: uploadAll,
					disabled: busy || uploading || pending.length === 0,
				},
				pending.length > 0 ? `上传这 ${pending.length} 本` : "上传",
			),
		),
		sources.length > 0
			? createElement(
					"div",
					{ style: { marginTop: "8px", fontSize: "12px", opacity: 0.85 } },
					createElement(
						"div",
						{ style: { margin: "0 0 4px" } },
						`已上传 ${sources.length} 本：`,
					),
					sources.map((source) =>
						createElement(
							"div",
							{
								key: source.file,
								style: { wordBreak: "break-all", margin: "2px 0" },
							},
							`${source.converted === true ? "✅" : "⏳"} ${source.file}`,
						),
					),
				)
			: null,
		sources.length > 0
			? createElement(
					"div",
					{ style: { marginTop: "10px" } },
					createElement(
						"button",
						{
							style: S.bigBtn(true),
							onClick: onConvert,
							disabled: busy || converting,
						},
						"② 开始转换（机器自动跑）",
					),
					converting
						? createElement(
								"span",
								{ style: { marginLeft: "8px", fontSize: "12px" } },
								"转换中……",
							)
						: null,
				)
			: null,
	);
}

// ── 状态卡 / 错误卡 ─────────────────────────────────────────────────────────

export function StatusCard(props) {
	const {
		meta,
		lastEvent,
		events,
		needsConfig,
		onResume,
		busy,
		pendingStageLabel,
		progressDetail,
		aiActive,
		onDeleteStart,
		onDeleteConfirm,
		deletingId,
	} = props;
	const [, tick] = useState(0);
	useEffect(() => {
		const timer = setInterval(() => tick((n) => n + 1), 1000);
		return () => clearInterval(timer);
	}, []);
	if (meta.status === "error") {
		// F26（2026-08-20 走查）：优先显示后端落账的人话错误（meta.lastErrorHuman，页数超限/Token 失效
		// 已归一成人话），否则回退事件消息；下方给「拆 PDF / 换一本 / 删掉重来」引导，错误含 Token
		// 关键词时补 Token 重设提示（入口见 F20 的 MinerU Token 常驻卡）。
		const rawError = lastEvent?.data?.message ?? "未知错误";
		const humanError =
			typeof meta?.lastErrorHuman === "string" && meta.lastErrorHuman !== ""
				? meta.lastErrorHuman
				: rawError;
		const isTokenIssue =
			humanError.includes("Token") || humanError.includes("token");
		return createElement(
			"div",
			{ style: { ...S.focus, borderColor: "var(--dsw-danger, #cf222e)" } },
			createElement(
				"strong",
				{ style: { color: "var(--dsw-danger, #cf222e)" } },
				"⚠️ 这一步出错了",
			),
			createElement("p", { style: { margin: "6px 0" } }, humanError),
			createElement(
				"p",
				{ style: { margin: "6px 0 0", fontSize: "13px", opacity: 0.9 } },
				"你可以：把 PDF 拆成几份（每份 <200 页）后分别上传，或换一本更薄的书，或删掉这本书重新开始。",
			),
			isTokenIssue
				? createElement(
						"p",
						{ style: { margin: "4px 0 0", fontSize: "13px", opacity: 0.9 } },
						"💡 MinerU Token 可能失效，可到工作台「MinerU Token」处点「重新设置」换新 Token。",
					)
				: null,
			createElement(
				"button",
				{ style: S.bigBtn(true), onClick: onResume, disabled: busy },
				"▶️ 让 AI 接着干",
			),
			// F28（2026-08-20 走查）：上传错了给「删书重来」入口——两步确认（第一态→确认态），
			// 确认按钮只受 busy 置灰；删除后回向导可马上建一本新书。仅在父级传入删除回调时显示。
			typeof onDeleteStart === "function"
				? createElement(
						"div",
						{
							style: {
								marginTop: "8px",
								paddingTop: "8px",
								borderTop: "1px dashed var(--dsw-border, #d0d7de)",
							},
						},
						createElement(
							"p",
							{ style: { margin: "0 0 6px", fontSize: "13px", opacity: 0.9 } },
							"上传错了？可以删掉这本书重新建一本（旧书进回收站），回到向导马上就能开始新书。",
						),
						deletingId === true
							? createElement(
									"button",
									{
										style: {
											...S.smallLink,
											color: "var(--dsw-danger, #cf222e)",
										},
										onClick: onDeleteConfirm,
										disabled: busy,
									},
									"确认删除这本书（进回收站）",
								)
							: createElement(
									"button",
									{
										style: {
											...S.smallLink,
											color: "var(--dsw-danger, #cf222e)",
										},
										onClick: onDeleteStart,
									},
									"🗑 删除这本书重新建",
								),
					)
				: null,
		);
	}
	if (meta.status === "needs-config") {
		return createElement(
			"div",
			{ style: { ...S.focus, borderColor: "var(--dsw-danger, #cf222e)" } },
			createElement(
				"strong",
				{ style: { color: "var(--dsw-danger, #cf222e)" } },
				"🔑 需要先配置",
			),
			createElement("p", { style: { margin: "6px 0" } }, needsConfig),
			createElement(
				"button",
				{ style: S.bigBtn(true), onClick: onResume, disabled: busy },
				"我配好了，继续",
			),
		);
	}
	// 机器在等主 AI（交办任务）→ 优先显示任务名；否则回退到最近的机器活动。
	let label = "";
	let extra = "";
	if (typeof pendingStageLabel === "string" && pendingStageLabel !== "") {
		label = `AI 干活中 · ${pendingStageLabel}`;
		extra = typeof progressDetail === "string" ? progressDetail : "";
	} else if (
		lastEvent?.type === "textbook/agent-start" ||
		lastEvent?.type === "textbook/mineru-progress"
	) {
		const data = lastEvent.data ?? {};
		if (data.label !== undefined && data.label !== null && data.label !== "")
			label = data.label;
		else if (
			data.stage !== undefined &&
			data.stage !== null &&
			data.stage !== ""
		) {
			label =
				data.file !== undefined && data.file !== null && data.file !== ""
					? `${data.file}：${data.stage}`
					: data.stage;
		}
	}
	// 阶段在做什么（让人放心的说明）
	const phase = meta.phase ?? 1;
	const phaseDesc = {
		2: "源探查：AI 正在通读你的教材（材料多时会派小助手分头读），整理成源材料索引",
		3: "教学设计：主 AI 正在起草设计关卡方案（已通过过的会自动跳过）",
		4: "最佳范例章：主 AI 正在写第 1 章给你看效果",
		5: "全章写作：小助手执笔 + 小助手自查 + 主 AI 终审，逐章推进",
		6: "终检与交付：主 AI 亲自做最后检查 + 机器兜底",
	}[phase];
	// 写章进度（phase 5）：已完章数 / 总章数
	let chapterProgress = null;
	if (phase === 5) {
		const total = (meta.outline?.chapters ?? []).length;
		if (total > 0) {
			const done = (events ?? []).filter(
				(e) =>
					e.type === "textbook/agent-end" &&
					typeof e.data?.label === "string" &&
					e.data.label.includes("完成（小助手执笔"),
			).length;
			chapterProgress = { done: Math.min(done, total), total };
		}
	}
	// 计时 + 卡顿警告（F31，2026-08-20；计时口径 F47，2026-08-23）：
	//  - 步骤计时按「这一步自己的开始时间」算：最近一条步骤开始事件（stage-start / agent-start）
	//    的时间就是这一步起点，期间不断发 progress/进度事件不会把计时清零、也不会串到上一步。
	//  - 卡顿判定仍看「账面多久没动静」（idleMs）：AI 流式干活（aiActive=true）抑制「可能卡住了」。
	//  - 只显示一行计时（🤖 / ⏱ 二选一），不再和「AI 正在干活」重复各显一行。
	const stepStart = (() => {
		const list = events ?? [];
		for (let i = list.length - 1; i >= 0; i--) {
			const type = list[i]?.type;
			if (type === "textbook/stage-start" || type === "textbook/agent-start")
				return list[i]?.time;
		}
		return null;
	})();
	const lastTime = lastEvent?.time ?? meta.updatedAt ?? Date.now();
	const stepElapsedMs = Math.max(0, Date.now() - (stepStart ?? lastTime));
	const idleMs = Math.max(0, Date.now() - lastTime);
	const fmt = (ms) => {
		const s = Math.floor(ms / 1000);
		const m = Math.floor(s / 60);
		const h = Math.floor(m / 60);
		const parts = [];
		if (h > 0) parts.push(`${h} 小时`);
		if (m % 60 > 0 || h > 0) parts.push(`${m % 60} 分`);
		parts.push(`${s % 60} 秒`);
		return parts.join(" ");
	};
	const stale = !aiActive && idleMs > 8 * 60 * 1000;
	return createElement(
		"div",
		{ style: S.focus },
		createElement(
			"strong",
			{ style: { fontSize: "14px" } },
			`⏳ ${label || "准备中…"}`,
		),
		extra !== ""
			? createElement(
					"p",
					{ style: { margin: "6px 0 0", opacity: 0.9 } },
					`⏳ ${extra}`,
				)
			: null,
		phaseDesc !== undefined
			? createElement(
					"p",
					{ style: { margin: "6px 0 0", opacity: 0.85 } },
					`📌 ${phaseDesc}`,
				)
			: null,
		chapterProgress !== null
			? createElement(
					"div",
					{ style: { marginTop: "10px" } },
					createElement(
						"div",
						{
							style: {
								display: "flex",
								justifyContent: "space-between",
								fontSize: "12px",
								marginBottom: "4px",
							},
						},
						createElement("span", { style: { opacity: 0.8 } }, "章节写作进度"),
						createElement(
							"span",
							{ style: { opacity: 0.8 } },
							`已完成 ${chapterProgress.done}/${chapterProgress.total} 章`,
						),
					),
					createElement(
						"div",
						{
							style: {
								height: "8px",
								borderRadius: "4px",
								background: "var(--dsw-border, #d0d7de)",
								overflow: "hidden",
							},
						},
						createElement("div", {
							style: {
								height: "100%",
								width: `${Math.round((chapterProgress.done / chapterProgress.total) * 100)}%`,
								background: "var(--dsw-accent, #4f6ef7)",
								borderRadius: "4px",
								transition: "width 0.6s",
							},
						}),
					),
				)
			: null,
		stale
			? createElement(
					"div",
					{
						style: {
							marginTop: "8px",
							padding: "8px 10px",
							border: "1px solid #d4a72c",
							borderRadius: "8px",
							background: "var(--dsw-warn-soft, #fff8e1)",
						},
					},
					createElement(
						"span",
						{ style: { fontSize: "13px" } },
						`⚠️ 已经 ${fmt(idleMs)} 没有新动静了，可能卡住了。到对话页确认一下：如果真卡住了，在对话里发一句「继续」，或点右边让 AI 接着干（它只会从断点继续，不会重做已完成的部分）。`,
					),
					createElement(
						"button",
						{
							style: {
								...S.bigBtn(true),
								marginLeft: "8px",
								padding: "4px 12px",
							},
							onClick: onResume,
							disabled: busy,
						},
						"🔁 让 AI 接着干",
					),
				)
			: createElement(
					"p",
					{
						style: {
							margin: "6px 0 0",
							fontSize: "12px",
							opacity: aiActive ? 0.85 : 0.7,
						},
					},
					aiActive
						? `🤖 AI 正在干活 · 这一步已进行 ${fmt(stepElapsedMs)}`
						: `⏱ 这一步已进行 ${fmt(stepElapsedMs)}`,
				),
		createElement(
			"p",
			{ style: { margin: "6px 0 0", opacity: 0.8 } },
			"AI 正在推进这一步（可能亲自做，也可能派一批小助手在后台并行干，不一定会逐条刷到下方对话台里）；轮到你需要拍板/确认时会亮起 ⚡，随时可以在对话里问它。",
		),
	);
}

// ── 交付卡 ──────────────────────────────────────────────────────────────────

export function DeliveryCard(props) {
	const {
		project,
		session,
		checks,
		onPreview,
		preview,
		busy,
		meta,
		aiReport,
		styleNotes,
	} = props;
	const bookName = (meta?.name ?? "").trim() || "BOOK";
	// 邀请码可点复制（与过程地图栏同款实现，2026-09）。
	const [copied, setCopied] = useState(false);
	const copyInvite = (e, code) => {
		e.preventDefault();
		e.stopPropagation();
		const done = () => {
			setCopied(true);
			setTimeout(() => setCopied(false), 1600);
		};
		const fallback = () => {
			try {
				const ta = document.createElement("textarea");
				ta.value = code;
				ta.style.position = "fixed";
				ta.style.opacity = "0";
				document.body.appendChild(ta);
				ta.select();
				document.execCommand("copy");
				document.body.removeChild(ta);
				done();
			} catch {
				/* 老浏览器降级：无操作 */
			}
		};
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(code).then(done, fallback);
		} else {
			fallback();
		}
	};
	return createElement(
		"div",
		{ style: S.focus },
		createElement("strong", { style: { fontSize: "14px" } }, "🎉 书做好了！"),
		aiReport !== null && aiReport !== undefined && aiReport !== ""
			? createElement(
					"div",
					{
						style: {
							margin: "10px 0",
							padding: "8px 10px",
							background: "var(--dsw-accent-soft, #eef2ff)",
							borderRadius: "8px",
							fontSize: "12px",
						},
					},
					createElement("strong", null, "🤖 AI 自查说的："),
					createElement(
						"p",
						{ style: { margin: "4px 0 0", whiteSpace: "pre-wrap" } },
						aiReport,
					),
				)
			: null,
		createElement(
			"div",
			{ style: { margin: "10px 0" } },
			(checks ?? []).map((check) =>
				createElement(
					"div",
					{ key: check.name, style: { margin: "4px 0" } },
					createElement("span", null, check.ok === true ? "✅" : "❌"),
					` ${check.name}`,
					createElement(
						"span",
						{ style: { opacity: 0.7, marginLeft: "6px", fontSize: "12px" } },
						check.note ?? "",
					),
				),
			),
		),
		(styleNotes ?? []).length > 0
			? createElement(
					"div",
					{
						style: {
							margin: "10px 0",
							padding: "8px 10px",
							borderRadius: "8px",
							border: "1px solid var(--dsw-border, #d0d7de)",
						},
					},
					createElement(
						"p",
						{ style: { margin: "0 0 6px", fontWeight: 600 } },
						"🎨 你的风格线条条有着落",
					),
					...(styleNotes ?? []).map((note, index) =>
						createElement(
							"div",
							{
								key: note.id ?? index,
								style: { fontSize: "12px", margin: "3px 0" },
							},
							`${note.status === "superseded" ? "·（已收回）" : note.status === "conflict" ? "·（与设计冲突，理由见备注）" : "·"}${note.text}`,
							note.note
								? createElement(
										"span",
										{ style: { opacity: 0.6 } },
										` -- ${note.note}`,
									)
								: null,
						),
					),
				)
			: null,
		createElement(
			"p",
			{ style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
			"AI 亲手做完最后检查，机器也兜底验过；你仍建议先让老师/家长复核一遍再用。",
		),
		createElement(
			"div",
			{ style: { display: "flex", gap: "10px", margin: "10px 0" } },
			createElement(
				"button",
				{ style: S.bigBtn(true), onClick: onPreview, disabled: busy },
				preview === null ? "👀 预览成品" : "收起预览",
			),
			createElement(
				"a",
				{
					style: {
						...S.bigBtn(true),
						textDecoration: "none",
						display: "inline-block",
					},
					href: `/textbook/download?session=${encodeURIComponent(session)}&project=${encodeURIComponent(project)}&path=work/book.md`,
				},
				`⬇️ 下载《${bookName}》.md`,
			),
		),
		preview !== null
			? createElement(
					"pre",
					{
						style: {
							whiteSpace: "pre-wrap",
							background: "var(--dsw-surface, #fff)",
							borderRadius: "8px",
							padding: "10px",
							maxHeight: "300px",
							overflow: "auto",
							fontSize: "12px",
						},
					},
					preview,
				)
			: null,
		createElement(
			"div",
			{ style: { margin: "8px 0 0", opacity: 0.8 } },
			createElement(
				"p",
				{ style: { margin: "0 0 4px", fontWeight: 600 } },
				"💡 这本书怎么用",
			),
			createElement(
				"div",
				{ style: { display: "flex", margin: "0 0 4px" } },
				createElement(
					"span",
					{
						style: {
							flexShrink: 0,
							width: "112px",
							display: "flex",
							justifyContent: "space-between",
							alignItems: "baseline",
						},
					},
					createElement("span", null, "给 AI 老师上课"),
					createElement("span", null, "→"),
				),
				createElement(
					"span",
					{ style: { minWidth: 0 } },
					`把下载的《${bookName}》.md 交给`,
					createElement(
						"a",
						{
							href: "https://www.socratopia.app/r/SCR-FEJXMQ",
							target: "_blank",
							rel: "noopener noreferrer",
							style: {
								color: "var(--dsw-accent, #4f6ef7)",
								textDecoration: "underline",
							},
						},
						"【破卷】",
					),
					"当教材来学。【建议】",
				),
			),
			createElement(
				"div",
				{ style: { display: "flex", margin: "0 0 4px" } },
				createElement(
					"span",
					{
						style: {
							flexShrink: 0,
							width: "112px",
							display: "flex",
							justifyContent: "space-between",
							alignItems: "baseline",
						},
					},
					createElement("span", null, "给人读"),
					createElement("span", null, "→"),
				),
				createElement(
					"span",
					{ style: { minWidth: 0 } },
					"直接阅读或打印。建议先复核一遍再用。",
				),
			),
			createElement(
				"p",
				{ style: { margin: "0" } },
				"如果本项目对你有帮助，欢迎填写邀请码：",
				createElement(
					"span",
					{
						onClick: (e) => copyInvite(e, "SCR-FEJXMQ"),
						title: copied ? "已复制" : "点击复制邀请码",
						style: {
							background: "var(--dsw-accent-soft, #eef2ff)",
							borderRadius: "4px",
							padding: "1px 6px",
							letterSpacing: "0.5px",
							cursor: "pointer",
							userSelect: "all",
							color: "var(--dsw-accent, #4f6ef7)",
						},
					},
					copied ? "✓ 已复制" : "SCR-FEJXMQ",
				),
				"，可免费领取 100 万 tokens，官方造书全场免费学。",
			),
		),
	);
}

// ── 终检结果认可卡（2026-08-26 用户拍板：终检 = AI 对全书整体调整 + 用户对整体的最终认可） ──

export function FinalApprovalCard(props) {
	const {
		checks,
		onPreview,
		preview,
		busy,
		aiReport,
		styleNotes,
		onApprove,
		onReject,
	} = props;
	const [note, setNote] = useState("");
	return createElement(
		"div",
		{ style: S.focus },
		createElement("strong", { style: { fontSize: "14px" } }, "🛡️ 终检完成，等你对整本书把关"),
		aiReport !== null && aiReport !== undefined && aiReport !== ""
			? createElement(
					"div",
					{
						style: {
							margin: "10px 0",
							padding: "8px 10px",
							background: "var(--dsw-accent-soft, #eef2ff)",
							borderRadius: "8px",
							fontSize: "12px",
						},
					},
					createElement("strong", null, "🤖 AI 自查说的："),
					createElement(
						"p",
						{ style: { margin: "4px 0 0", whiteSpace: "pre-wrap" } },
						aiReport,
					),
				)
			: null,
		createElement(
			"div",
			{ style: { margin: "10px 0" } },
			(checks ?? []).map((check) =>
				createElement(
					"div",
					{ key: check.name, style: { margin: "4px 0" } },
					createElement("span", null, check.ok === true ? "✅" : "❌"),
					` ${check.name}`,
					createElement(
						"span",
						{ style: { opacity: 0.7, marginLeft: "6px", fontSize: "12px" } },
						check.note ?? "",
					),
				),
			),
		),
		(styleNotes ?? []).length > 0
			? createElement(
					"div",
					{
						style: {
							margin: "10px 0",
							padding: "8px 10px",
							borderRadius: "8px",
							border: "1px solid var(--dsw-border, #d0d7de)",
						},
					},
					createElement(
						"p",
						{ style: { margin: "0 0 6px", fontWeight: 600 } },
						"🎨 你的风格线条条有着落",
					),
					...(styleNotes ?? []).map((note, index) =>
						createElement(
							"div",
							{
								key: note.id ?? index,
								style: { fontSize: "12px", margin: "3px 0" },
							},
							`${note.status === "superseded" ? "·（已收回）" : note.status === "conflict" ? "·（与设计冲突，理由见备注）" : "·"}${note.text}`,
							note.note
								? createElement(
										"span",
										{ style: { opacity: 0.6 } },
										` -- ${note.note}`,
									)
								: null,
						),
					),
				)
			: null,
		createElement(
			"p",
			{ style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
			"这是你对整本书的最后一次把关：AI 已整体调整过、机器也兜底验过。满意就认可交付；要改的写一句意见，AI 会照着改整本后重新终检。",
		),
		createElement(
			"textarea",
			{
				style: {
					width: "100%",
					minHeight: "64px",
					padding: "8px",
					borderRadius: "8px",
					border: "1px solid var(--dsw-border, #d0d7de)",
					fontSize: "13px",
					boxSizing: "border-box",
				},
				placeholder: "不满意的话，在这里写一句改进意见（可选，写了才会走「不满意」分支）…",
				value: note,
				onChange: (e) => setNote(e.target.value),
			},
		),
		createElement(
			"div",
			{ style: { display: "flex", gap: "10px", margin: "10px 0" } },
			createElement(
				"button",
				{ style: S.bigBtn(true), onClick: onPreview, disabled: busy },
				preview === null ? "👀 预览整本书" : "收起预览",
			),
			createElement(
				"button",
				{
					style: { ...S.bigBtn(true), marginRight: "auto" },
					onClick: () => onReject(note),
					disabled: busy || note.trim() === "",
					title: "写了改进意见才能走「不满意」",
				},
				"❌ 不满意，让 AI 改",
			),
			createElement(
				"button",
				{ style: S.bigBtn(true), onClick: () => onApprove(), disabled: busy },
				"✅ 认可，交付",
			),
		),
		preview !== null
			? createElement(
					"pre",
					{
						style: {
							whiteSpace: "pre-wrap",
							background: "var(--dsw-surface, #fff)",
							borderRadius: "8px",
							padding: "10px",
							maxHeight: "300px",
							overflow: "auto",
							fontSize: "12px",
						},
					},
					preview,
				)
			: null,
	);
}

// ── 关卡卡 ──────────────────────────────────────────────────────────────────

const REASONS = [
	"讲得太深了",
	"讲得太浅了",
	"不是我要的重点",
	"和别的部分重复",
	"换个风格",
];

// 2026-08-21：组装「驳回」提交体——勾选「换个风格」且粘贴了目标文本时，
// 把文本附进 note 交办给 AI（修订时照着改），并保留 reasons 里的「换个风格」。
export function rejectPayload(mode, reasons, note, styleText) {
	const style = (reasons ?? []).includes("换个风格")
		? String(styleText ?? "").trim()
		: "";
	const extraNote = style !== "" ? `\n【你想换的风格/写法】\n${style}` : "";
	return {
		approved: false,
		mode,
		reasons: reasons ?? [],
		note: `${String(note ?? "")}${extraNote}`.trim(),
	};
}

export function GatePanel(props) {
	const { gate, onDecide, onRollback, busy, error, onAddPattern } = props;
	// 2026-08-21 需求：完整方案默认展开展示（用户拍板前先看全），仍可点「收起完整方案」折叠。
	const [showDetail, setShowDetail] = useState(true);
	const [showCompare, setShowCompare] = useState(false);
	const [rejecting, setRejecting] = useState(false);
	const [mode, setMode] = useState("wrong");
	const [reasons, setReasons] = useState([]);
	const [note, setNote] = useState("");
	// 2026-08-21：勾选「换个风格」时出现的粘贴窗口（目标文本 → 本书自定义模式）。
	const [styleText, setStyleText] = useState("");
	// 回退是重操作（会把状态拉回上一个拍板点、重做后续推进）：先确认再执行（A3 快赢）。
	const [confirmRollback, setConfirmRollback] = useState(false);
	const rollbackConfirm = () =>
		createElement(
			"div",
			{
				style: {
					marginTop: "10px",
					borderTop: "1px dashed var(--dsw-border, #d0d7de)",
					paddingTop: "8px",
				},
			},
			createElement(
				"p",
				{ style: { margin: "0 0 6px", fontWeight: 600 } },
				"⏪ 回退到上一个拍板点？",
			),
			createElement(
				"p",
				{
					style: {
						margin: "0 0 6px",
						fontSize: "12px",
						color: "var(--dsw-danger, #cf222e)",
					},
				},
				"这一步之后新推进的部分会被重做，但每个版本都留档、之后还能再回退。",
			),
			createElement(
				"div",
				{ style: { display: "flex", gap: "8px" } },
				createElement(
					"button",
					{
						style: { ...S.bigBtn(false), padding: "6px 14px" },
						onClick: () => {
							setConfirmRollback(false);
							onRollback();
						},
						disabled: busy,
					},
					"确认回退",
				),
				createElement(
					"button",
					{ style: S.smallLink, onClick: () => setConfirmRollback(false) },
					"取消",
				),
			),
		);

	if (gate === null) return null;

	if (gate.status !== "awaiting") {
		const decided = gate.status === "approved";
		return createElement(
			"div",
			{ style: S.focus },
			createElement(
				"strong",
				null,
				decided
					? `✅ 第 ${gate.gate} 关已通过（v${gate.version}）`
					: `↩️ 第 ${gate.gate} 关已驳回（v${gate.version}），等 AI 修订`,
			),
			decided
				? createElement(
						"p",
						{ style: { margin: "6px 0 0", opacity: 0.8 } },
						"之后随时能改：可回退到上一个拍板点，或去左侧过程地图「定点修改」这一关。",
					)
				: createElement(
						"p",
						{ style: { margin: "6px 0 0", opacity: 0.8 } },
						"AI 正在按你的意见修改，新版提案会出现在这里。",
					),
			createElement(
				"div",
				{ style: { marginTop: "8px" } },
				createElement(
					"button",
					{
						style: {
							...S.projectBtn(false),
							color: "var(--dsw-danger, #cf222e)",
							borderColor: "var(--dsw-danger, #cf222e)",
						},
						onClick: () => setConfirmRollback(true),
						disabled: busy,
					},
					"⏪ 回退到上一个拍板点",
				),
				confirmRollback ? rollbackConfirm() : null,
			),
		);
	}

	const toggleReason = (reason) => {
		setReasons((prev) =>
			prev.includes(reason)
				? prev.filter((item) => item !== reason)
				: [...prev, reason],
		);
	};

	// 2026-08-21：勾「换个风格」+ 粘贴目标文本 → 后台分析成自定义模式 + 文本并入驳回 note。
	const submitReject = () => {
		const hasStyle = (reasons ?? []).includes("换个风格");
		const style = hasStyle ? styleText.trim() : "";
		if (hasStyle && style !== "" && typeof onAddPattern === "function") {
			void onAddPattern(style).catch(() => {});
		}
		onDecide(rejectPayload(mode, reasons, note, styleText));
	};

	return createElement(
		"div",
		{ style: S.focus },
		createElement(
			"div",
			null,
			createElement(
				"strong",
				{ style: { fontSize: "14px" } },
				`🚦 请你拍板 · 第 ${gate.gate} 关 · 方案 v${gate.version}`,
			),
			createElement(
				"span",
				{ style: { float: "right", opacity: 0.6, fontSize: "12px" } },
				"这一关不过，流程不会继续",
			),
		),
		createElement("p", { style: { margin: "10px 0 6px" } }, gate.title),
		createElement(
			"p",
			{ style: { margin: "0 0 6px", opacity: 0.9, lineHeight: 1.6 } },
			gate.summary,
		),
		createElement(
			"div",
			{ style: { margin: "6px 0" } },
			createElement(
				"button",
				{ style: S.smallLink, onClick: () => setShowDetail(!showDetail) },
				showDetail ? "收起完整方案" : "展开完整方案",
			),
			gate.prevProposal !== null
				? createElement(
						"span",
						null,
						"　",
						createElement(
							"button",
							{
								style: S.smallLink,
								onClick: () => setShowCompare(!showCompare),
							},
							showCompare
								? "收起对比"
								: `对比上一版（v${gate.prevProposal.version}）`,
						),
					)
				: null,
		),
		showDetail && (gate.detail ?? "") !== ""
			? createElement(
					"pre",
					{
						style: {
							whiteSpace: "pre-wrap",
							background: "var(--dsw-surface, #fff)",
							borderRadius: "8px",
							padding: "10px",
							fontSize: "12px",
							opacity: 0.9,
							maxHeight: "260px",
							overflow: "auto",
						},
					},
					gate.detail,
				)
			: null,
		showCompare && gate.prevProposal !== null
			? createElement(
					"div",
					{
						style: {
							background: "var(--dsw-surface, #fff)",
							borderRadius: "8px",
							padding: "10px",
							fontSize: "12px",
							opacity: 0.9,
						},
					},
					createElement(
						"strong",
						null,
						`上一版 v${gate.prevProposal.version}：`,
					),
					createElement(
						"p",
						{ style: { margin: "4px 0 0" } },
						gate.prevProposal.summary,
					),
				)
			: null,
		error !== null ? createElement("p", { style: S.error }, error) : null,
		rejecting
			? createElement(
					"div",
					{
						style: {
							marginTop: "10px",
							borderTop: "1px dashed var(--dsw-border, #d0d7de)",
							paddingTop: "8px",
						},
					},
					createElement(
						"p",
						{ style: { margin: "0 0 6px", fontWeight: 600 } },
						"驳回原因（选一个，不必打字）",
					),
					createElement(
						"div",
						{ style: { margin: "8px 0" } },
						createElement(
							"label",
							{ style: { display: "block", margin: "4px 0" } },
							createElement("input", {
								type: "radio",
								name: "mode",
								checked: mode === "wrong",
								onChange: () => setMode("wrong"),
							}),
							" 方案不对 —— AI 重做一版",
						),
						createElement(
							"label",
							{ style: { display: "block", margin: "4px 0" } },
							createElement("input", {
								type: "radio",
								name: "mode",
								checked: mode === "confused",
								onChange: () => setMode("confused"),
							}),
							" 我看不懂 / 不是我要的 —— AI 换人话重讲、给例子",
						),
					),
					createElement(
						"p",
						{ style: { margin: "6px 0 4px", fontWeight: 600 } },
						"具体哪里不满意（可多选）",
					),
					REASONS.map((reason) =>
						createElement(
							"label",
							{ key: reason, style: S.checkItem },
							createElement("input", {
								type: "checkbox",
								checked: reasons.includes(reason),
								onChange: () => toggleReason(reason),
							}),
							` ${reason}`,
						),
					),
					// 2026-08-21：勾选「换个风格」→ 弹出粘贴窗口，目标文本由 AI 分析成这本书的自定义模式。
					reasons.includes("换个风格")
						? createElement(
								"div",
								{ style: { marginTop: "4px" } },
								createElement(
									"p",
									{
										style: {
											margin: "0 0 4px",
											fontSize: "12px",
											opacity: 0.8,
										},
									},
									"把你想要的风格/写法粘贴进来，AI 会把它记成这本书的自定义模式，修订时照着改：",
								),
								createElement("textarea", {
									style: {
										...S.textarea,
										borderColor: "var(--dsw-accent, #4f6ef7)",
									},
									placeholder:
										"例：每个知识点先给一个生活中的真实场景引出概念，再配一道由浅入深的例题……",
									value: styleText,
									onChange: (e) => setStyleText(e.target.value),
								}),
							)
						: null,
					createElement("textarea", {
						style: S.textarea,
						placeholder: "想多说一句？在这里补充（可选）",
						value: note,
						onChange: (e) => setNote(e.target.value),
					}),
					createElement(
						"div",
						{ style: { marginTop: "8px", display: "flex", gap: "8px" } },
						createElement(
							"button",
							{ style: S.bigBtn(false), onClick: submitReject, disabled: busy },
							"提交驳回",
						),
						createElement(
							"button",
							{
								style: { ...S.smallLink, textDecoration: "none" },
								onClick: () => {
									setRejecting(false);
									setStyleText("");
								},
							},
							"取消",
						),
					),
				)
			: createElement(
					"div",
					{ style: { marginTop: "12px", display: "flex", gap: "10px" } },
					createElement(
						"button",
						{
							style: S.bigBtn(true),
							onClick: () => onDecide({ approved: true }),
							disabled: busy,
						},
						"✅ 通过，继续",
					),
					createElement(
						"button",
						{
							style: S.bigBtn(false),
							onClick: () => setRejecting(true),
							disabled: busy,
						},
						"❌ 驳回，提意见",
					),
				),
		createElement(
			"div",
			{ style: { marginTop: "10px" } },
			createElement(
				"button",
				{
					style: {
						...S.projectBtn(false),
						color: "var(--dsw-danger, #cf222e)",
						borderColor: "var(--dsw-danger, #cf222e)",
					},
					onClick: () => setConfirmRollback(true),
					disabled: busy,
				},
				"⏪ 回退到上一个拍板点",
			),
			confirmRollback ? rollbackConfirm() : null,
		),
	);
}

// ── MinerU Token 常驻入口（F20）─────────────────────────────────────────────
// 未设置（mineruSet=false）：原「还差一步」输入卡，现状不变；
// 已设置：常驻显示掩码（••••）+「重新设置」入口，点开（resetOpen）才展开输入框；
// 保存走父级 onSave（既有 settings 动作，后端支持覆盖），保存成功后父级关回掩码态。
export function MineruTokenCard(props) {
	const {
		mineruSet,
		mineruToken,
		busy,
		onTokenChange,
		onSave,
		resetOpen,
		onToggleReset,
	} = props;
	if (mineruSet === false) {
		return createElement(
			"div",
			{ style: { ...S.card, borderColor: "var(--dsw-danger, #cf222e)" } },
			createElement(
				"strong",
				{ style: { color: "var(--dsw-danger, #cf222e)" } },
				"🔑 还差一步：MinerU Token",
			),
			createElement(
				"p",
				{ style: { margin: "4px 0" } },
				"PDF 转换需要 MinerU 的免费 Token（mineru.net 申请）。填在这里即可：",
			),
			createElement("input", {
				style: S.input,
				placeholder: "粘贴 MinerU Token",
				value: mineruToken,
				onChange: onTokenChange,
			}),
			createElement(
				"button",
				{ style: S.bigBtn(true), onClick: onSave, disabled: busy },
				"保存 Token",
			),
		);
	}
	return createElement(
		"div",
		{ style: { ...S.card, borderColor: "var(--dsw-success, #1a7f37)" } },
		createElement(
			"div",
			{
				style: {
					display: "flex",
					gap: "10px",
					alignItems: "center",
					flexWrap: "wrap",
				},
			},
			createElement("strong", {}, "✅ MinerU Token 已设置（••••）"),
			createElement(
				"button",
				{ style: S.smallLink, onClick: onToggleReset },
				"重新设置",
			),
		),
		resetOpen
			? createElement(
					"div",
					{ style: { marginTop: "6px" } },
					createElement(
						"p",
						{ style: { margin: "4px 0" } },
						"填新的 Token 即可覆盖旧的：",
					),
					createElement("input", {
						style: S.input,
						placeholder: "粘贴新的 MinerU Token",
						value: mineruToken,
						onChange: onTokenChange,
					}),
					createElement(
						"button",
						{ style: S.bigBtn(true), onClick: onSave, disabled: busy },
						"保存新 Token",
					),
				)
			: null,
	);
}
