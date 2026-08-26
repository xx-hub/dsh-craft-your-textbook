/**
 * 造书工作台 · 谈判桌（最佳范例章 · 风格谈判）
 *
 * Gold 系列组件：意见单、阅读与标记（段旁三键 + 笼统便签）、稿间内联对比、
 * 定稿沉淀、总装（稿页签 + 读/对比 + 意见单 + 定稿区）。
 */

import { createElement, useEffect, useState } from "react";
import { S } from "./styles.js";
import { splitParagraphs, paragraphHint, diffParagraphs } from "./rules.js";
import { goldChapterNo } from "../domain-rules.js";
import { READER_PARA_STYLE, renderInline } from "./md-render.js";

// ── 谈判桌·意见单 ───────────────────────────────────────────────────────────

const OPINION_KIND_TEXT = {
	dislike: "😕 不喜欢这种写法",
	drop: "🗑 这类内容不需要",
	change: "✏️ 要改成",
};
const OPINION_STATUS_TEXT = {
	pending: "待处理",
	sent: "AI 修订中",
	applied: "AI 已改",
	revoked: "已撤销",
};

export function GoldOpinionList(props) {
	const { opinions, busy, onRevoke, onRevise } = props;
	const list = opinions ?? [];
	if (list.length === 0) {
		return createElement(
			"div",
			{ style: { ...S.card, opacity: 0.85 } },
			createElement(
				"p",
				{ style: { margin: "0" } },
				"📋 本稿意见单还空着：读下面的稿子随手标记，或用最底下的「笼统提一条」。",
			),
		);
	}
	let seq = 0;
	const rows = list.map((o) => {
		if (o.status === "revoked") {
			return createElement(
				"div",
				{
					key: o.id,
					style: {
						...S.card,
						opacity: 0.45,
						textDecoration: "line-through",
						marginBottom: "6px",
					},
				},
				`已撤销：${OPINION_KIND_TEXT[o.kind] ?? o.kind}${o.wish ? ` ${o.wish}` : ""}`,
			);
		}
		seq += 1;
		const target =
			o.target == null
				? "笼统（不指哪段）"
				: `第${o.target.para}段${o.target.hint ? `「${o.target.hint}」` : ""}`;
		return createElement(
			"div",
			{ key: o.id, style: { ...S.card, marginBottom: "6px" } },
			createElement(
				"div",
				{
					style: {
						display: "flex",
						gap: "8px",
						alignItems: "baseline",
						flexWrap: "wrap",
					},
				},
				createElement("strong", null, `#${seq}`),
				createElement("span", null, OPINION_KIND_TEXT[o.kind] ?? o.kind),
				createElement(
					"span",
					{ style: { opacity: 0.75, fontSize: "12px" } },
					target,
				),
				o.wish ? createElement("span", null, o.wish) : null,
				createElement(
					"span",
					{
						style: {
							marginLeft: "auto",
							fontSize: "12px",
							whiteSpace: "nowrap",
						},
					},
					OPINION_STATUS_TEXT[o.status] ?? o.status,
					" ",
					createElement(
						"button",
						{
							style: S.smallLink,
							onClick: () => onRevoke(o.id),
							disabled: busy,
						},
						"撤销",
					),
				),
			),
		);
	});
	const pendingCount = list.filter((o) => o.status === "pending").length;
	return createElement(
		"div",
		null,
		createElement(
			"p",
			{ style: { margin: "0 0 6px", fontWeight: 600 } },
			`📋 本稿意见单（${seq} 条）`,
		),
		...rows,
		onRevise !== undefined
			? createElement(
					"div",
					{ style: { margin: "8px 0" } },
					createElement(
						"button",
						{
							style: S.bigBtn(true),
							onClick: onRevise,
							disabled: busy || pendingCount === 0,
						},
						pendingCount > 0
							? `🔁 让 AI 照这些改（${pendingCount} 条）`
							: "🔁 让 AI 照这些改",
					),
					pendingCount === 0
						? createElement(
								"span",
								{
									style: { marginLeft: "8px", fontSize: "12px", opacity: 0.7 },
								},
								"先标记至少一条意见（段旁三键或笼统便签）",
							)
						: null,
					createElement(
						"p",
						{ style: S.hint },
						"只改你标过的地方，其余原样保留",
					),
				)
			: null,
	);
}

// ── 谈判桌·阅读与标记（段旁三键 + 笼统便签） ───────────────────────────────

// F36（2026-08-20 走查）：首次引导脉冲只在本页会话触发一次（页面刷新后重新计）。
let goldFirstPulseDone = false;

export function GoldReader(props) {
	const {
		text,
		opinions,
		busy,
		onOpinion,
		readOnly,
		onRevokeOpinion = () => {},
	} = props;
	const [hover, setHover] = useState(null);
	const [formPara, setFormPara] = useState(null);
	const [wishText, setWishText] = useState("");
	const [wishError, setWishError] = useState(null);
	const [generalKind, setGeneralKind] = useState("change");
	const [generalText, setGeneralText] = useState("");
	const [generalError, setGeneralError] = useState(null);
	// F36：进入标记态时首段三键闪两下，教用户「这三键可标意见」（本页会话一次）。
	// pulsePhase: null=未闪 | 'on1' | 'off' | 'on2' | 'done'（done 后不再闪）。
	const [pulsePhase, setPulsePhase] = useState(null);
	useEffect(() => {
		if (readOnly || goldFirstPulseDone) return undefined;
		goldFirstPulseDone = true;
		const timers = [
			setTimeout(() => setPulsePhase("on1"), 250),
			setTimeout(() => setPulsePhase("off"), 750),
			setTimeout(() => setPulsePhase("on2"), 1150),
			setTimeout(() => setPulsePhase("done"), 1650),
		];
		return () => {
			for (const t of timers) clearTimeout(t);
		};
	}, [readOnly]);
	const paras = splitParagraphs(text);
	// 段号 -> 已挂意见的标签（#N 表情），给人看「这段已标过」。
	const marked = new Map();
	let seq = 0;
	for (const o of opinions ?? []) {
		if (o.status === "revoked") continue;
		seq += 1;
		if (o.target != null && Number.isSafeInteger(o.target.para)) {
			const arr = marked.get(o.target.para) ?? [];
			arr.push(
				`#${seq} ${o.kind === "dislike" ? "😕" : o.kind === "drop" ? "🗑" : "✏️"}`,
			);
			marked.set(o.target.para, arr);
		}
	}
	const submitWish = () => {
		const wish = wishText.trim();
		if (wish === "") {
			setWishError("写一句你想让它变成什么样");
			return;
		}
		onOpinion(
			"change",
			wish,
			formPara,
			paragraphHint(paras[formPara - 1] ?? ""),
		);
		setFormPara(null);
		setWishText("");
		setWishError(null);
	};
	const submitGeneral = () => {
		const wish = generalText.trim();
		if (generalKind === "change" && wish === "") {
			setGeneralError("「要改成」请写一句话");
			return;
		}
		onOpinion(generalKind, wish, null, "");
		setGeneralText("");
		setGeneralError(null);
	};
	// 左右留白：右 68px 给三键浮出腾地方，左 34px 给段号/已标标签的装订线腾地方。
	return createElement(
		"div",
		{ style: { paddingLeft: "34px", paddingRight: "68px" } },
		!readOnly
			? createElement(
					"p",
					{ style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
					"标记方法：鼠标停在哪一段，那段右侧就亮出三个键 😕🗑✏️；不指哪段就用最底下「笼统提一条」。提完点意见单里的【让 AI 照这些改】。",
				)
			: null,
		paras.map((para, idx) => {
			const n = idx + 1;
			const marks = marked.get(n) ?? [];
			// F36：首段三键引导脉冲（on1/on2 亮起、off 熄灭），平时常显淡态 0.3。
			const pulsing = n === 1 && (pulsePhase === "on1" || pulsePhase === "on2");
			const pulseBtnStyle = pulsing
				? {
						background: "var(--dsw-accent-soft, #eef2ff)",
						borderRadius: "6px",
						boxShadow: "0 0 0 2px var(--dsw-accent, #4f6ef7)",
						transform: "scale(1.15)",
						transition: "transform 0.2s, boxShadow 0.2s, background 0.2s",
					}
				: null;
			return createElement(
				"div",
				{
					key: n,
					// 段容器相对定位：装订线、三键浮出都以它为参照，正文不占这些位置。
					style: { position: "relative" },
					onMouseEnter: () => setHover(n),
					onMouseLeave: () => setHover((cur) => (cur === n ? null : cur)),
				},
				// 左侧装订线：段号 + 已标 #N 标签（不指段时淡出到 0.35，指到时亮起）。
				createElement(
					"span",
					{
						style: {
							position: "absolute",
							left: "-34px",
							top: "0",
							fontSize: "11px",
							lineHeight: 1.6,
							whiteSpace: "nowrap",
							color: "var(--dsw-accent, #4f6ef7)",
							opacity: hover === n ? 1 : 0.35,
							transition: "opacity 0.15s",
						},
					},
					String(n),
					marks.length > 0
						? createElement(
								"span",
								{ style: { display: "block" } },
								marks.join(" "),
							)
						: null,
				),
				// 正文段落：纯流式 + markdown 最小渲染（标题/加粗/列表行）。
				createElement("p", { style: READER_PARA_STYLE }, ...renderInline(para)),
				formPara === n
					? createElement(
							"div",
							{ style: { margin: "-4px 0 8px" } },
							createElement("textarea", {
								style: { ...S.input, width: "100%", boxSizing: "border-box" },
								rows: 2,
								placeholder:
									"写一句你想让它变成什么样（例：开头别反问，直接讲道理）",
								value: wishText,
								onChange: (e) => {
									setWishText(e.target.value);
									setWishError(null);
								},
							}),
							createElement(
								"div",
								{
									style: { display: "flex", gap: "8px", alignItems: "center" },
								},
								createElement(
									"button",
									{
										style: S.bigBtn(true),
										onClick: submitWish,
										disabled: busy,
									},
									"✅ 记下这条",
								),
								createElement(
									"button",
									{
										style: S.smallLink,
										onClick: () => {
											setFormPara(null);
											setWishError(null);
										},
									},
									"收起",
								),
								wishError !== null
									? createElement("span", { style: S.error }, wishError)
									: null,
							),
						)
					: null,
				// 三键浮出（absolute 定在段右上角、不占正文宽度）：F36 常显淡态 0.3（可感知、不占位），
				// 悬停或首段引导脉冲时全亮；键始终可点（悬停键本身也算悬停该段）。
				!readOnly
					? createElement(
							"div",
							{
								style: {
									position: "absolute",
									top: "-2px",
									right: "-64px",
									display: "flex",
									gap: "2px",
									opacity: hover === n || pulsing ? 1 : 0.3,
									transition: "opacity 0.15s",
									pointerEvents: "auto",
								},
							},
							(() => {
								const activeOf = (kind) =>
									(opinions ?? []).find(
										(o) =>
											o.status !== "revoked" &&
											o.target != null &&
											o.target.para === n &&
											o.kind === kind,
									);
								// toggle=true 的两态键：同段同类型已有未撤销意见 -> 再点=revoke（防误触，F14 裁决）。
								// ✏️ 传 toggle=false：点开的是改写框、本身不落账、无误触问题，行为不变（F14 裁决第 3 条）。
								const keyWith = (
									label,
									kind,
									title,
									onClick,
									toggle = true,
								) => {
									const active = toggle ? activeOf(kind) : null;
									// aria-label 与 title 同文案：让读屏用户也知道「再点=撤销」。
									const labelText =
										active != null ? `${title}（已标：再点一次=撤销）` : title;
									return createElement(
										"button",
										{
											key: label,
											"aria-label": labelText,
											style: {
												...S.smallLink,
												fontSize: "15px",
												padding: "2px 4px",
												whiteSpace: "nowrap",
												transition:
													"transform 0.2s, boxShadow 0.2s, background 0.2s",
												...(active != null
													? {
															background: "var(--dsw-accent-soft, #eef2ff)",
															borderRadius: "6px",
														}
													: {}),
												...(pulseBtnStyle ?? {}),
											},
											title: labelText,
											onClick: () => {
												if (pulsing) setPulsePhase("done");
												if (active != null) onRevokeOpinion(active.id);
												else onClick();
											},
											disabled: busy,
										},
										label,
									);
								};
								return [
									keyWith("😕", "dislike", "这种写法不喜欢", () =>
										onOpinion("dislike", "", n, paragraphHint(para)),
									),
									keyWith("🗑", "drop", "这类内容不需要", () =>
										onOpinion("drop", "", n, paragraphHint(para)),
									),
									keyWith(
										"✏️",
										"change",
										"要改成（写一句话）",
										() => {
											setFormPara(n);
											setWishText("");
										},
										false,
									),
								];
							})(),
						)
					: null,
			);
		}),
		!readOnly
			? createElement(
					"div",
					{
						style: {
							...S.card,
							display: "flex",
							gap: "8px",
							alignItems: "center",
							flexWrap: "wrap",
						},
					},
					createElement(
						"span",
						{ style: { fontSize: "12px", opacity: 0.75 } },
						"笼统提一条（不指哪段也行）：",
					),
					["dislike", "drop", "change"].map((k) =>
						createElement(
							"button",
							{
								key: k,
								style: S.projectBtn(generalKind === k),
								onClick: () => setGeneralKind(k),
								disabled: busy,
							},
							OPINION_KIND_TEXT[k],
						),
					),
					createElement("input", {
						style: { ...S.input, flex: "1 1 160px", minWidth: "120px" },
						placeholder: "例：整体语气再亲切一点",
						value: generalText,
						onChange: (e) => {
							setGeneralText(e.target.value);
							setGeneralError(null);
						},
					}),
					createElement(
						"button",
						{ style: S.bigBtn(true), onClick: submitGeneral, disabled: busy },
						"笼统提一条",
					),
					generalError !== null
						? createElement("span", { style: S.error }, generalError)
						: null,
				)
			: null,
	);
}

// ── 谈判桌·稿间内联对比（删除线旧文 + 绿底新文 + 意见号） ──────────────────

export function GoldCompare(props) {
	const { oldText, newText, opinions } = props;
	const oldParas = splitParagraphs(oldText);
	const newParas = splitParagraphs(newText);
	const ops = diffParagraphs(oldParas, newParas);
	// 新稿段号(1 基) -> 意见号数组；笼统意见只计数。
	const chipsByNewPara = new Map();
	let generalCount = 0;
	let seq = 0;
	for (const o of opinions ?? []) {
		if (o.status === "revoked") continue;
		seq += 1;
		if (o.target != null && Number.isSafeInteger(o.target.para)) {
			const arr = chipsByNewPara.get(o.target.para) ?? [];
			arr.push(seq);
			chipsByNewPara.set(o.target.para, arr);
		} else generalCount += 1;
	}
	const chipSpan = (n) =>
		createElement(
			"span",
			{
				key: `c${n}`,
				style: {
					fontWeight: 700,
					marginRight: "6px",
					color: "var(--dsw-accent, #4f6ef7)",
					whiteSpace: "nowrap",
				},
			},
			`#${n}`,
		);
	const blocks = ops.map((op, idx) => {
		if (op.type === "del") {
			return createElement(
				"p",
				{
					key: `d${idx}`,
					style: {
						...READER_PARA_STYLE,
						textDecoration: "line-through",
						background: "var(--dsw-danger-soft, #ffebe9)",
						opacity: 0.75,
					},
				},
				oldParas[op.old],
			);
		}
		// same 与 add 都按新稿渲染；挂到该段的意见号亮出来（same 段挂了意见=AI 在别处落实，也给人看见）。
		const paraNo = op.new + 1;
		const chips = chipsByNewPara.get(paraNo) ?? [];
		return createElement(
			"p",
			{
				key: `n${idx}`,
				style:
					op.type === "add"
						? {
								...READER_PARA_STYLE,
								background: "var(--dsw-success-soft, #dafbe1)",
								borderColor: "var(--dsw-success, #2da44e)",
							}
						: READER_PARA_STYLE,
			},
			chips.map((n) => chipSpan(n)),
			" ",
			newParas[op.new],
		);
	});
	return createElement(
		"div",
		null,
		createElement(
			"p",
			{ style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
			`对照方式：红底划掉的是旧稿删掉的；绿底是新稿改成的；#号对应意见单里的第几条${generalCount > 0 ? `（另有 ${generalCount} 条笼统意见，AI 会对号入座）` : ""}。`,
		),
		...blocks,
	);
}

// ── 谈判桌·定稿沉淀（字数 + AI 建议 + 定稿/重写确认层） ─────────────────────

export function GoldFinalize(props) {
	const { meta, opinions, busy, onApprove, onSuggestWords } = props;
	const [targetWords, setTargetWords] = useState(""); // 兜底单值：默认空（每章字数以清单为准，这个数只兜未填章）
	const [suggesting, setSuggesting] = useState(false);
	const [suggestion, setSuggestion] = useState(null);
	const [error, setError] = useState(null);
	const [confirming, setConfirming] = useState(null); // 'seal' | 'rewrite' | null
	const requestSuggestion = () => {
		setSuggesting(true);
		setError(null);
		Promise.resolve(onSuggestWords())
			.then((result) => {
				if (result === null) return;
				setSuggestion(result);
				if (
					Number.isFinite(Number(result.suggested)) &&
					Number(result.suggested) >= 500
				) {
					setTargetWords(String(Math.round(Number(result.suggested))));
				}
			})
			.catch((err) =>
				setError(String(err instanceof Error ? err.message : err)),
			)
			.finally(() => setSuggesting(false));
	};
	const wordsRaw = String(targetWords ?? "").trim();
	const wordsEmpty = wordsRaw === "";
	const words = Number(wordsRaw);
	const wordsOk =
		wordsEmpty || (Number.isFinite(words) && words >= 500 && words <= 50000);
	const targetToSend = wordsEmpty
		? null
		: Number.isFinite(words) && words >= 500 && words <= 50000
			? Math.round(words)
			: null;
	const live = (opinions ?? []).filter((o) => o.status !== "revoked");
	return createElement(
		"div",
		{ style: S.card },
		createElement(
			"p",
			{ style: { margin: "0 0 6px", fontWeight: 600 } },
			"✅ 满意了就定稿（这一章就是全书的样板）",
		),
		createElement(
			"div",
			{ style: { margin: "6px 0" } },
			createElement(
				"p",
				{ style: { margin: "0 0 4px", fontSize: "12px", opacity: 0.8 } },
				"每章字数（来自章节安排，可只调这一章）：",
			),
			(meta.outline?.chapters ?? []).map((chapter, index) =>
				createElement(
					"div",
					{
						key: index,
						style: {
							fontSize: "12px",
							margin: "2px 0",
							display: "flex",
							gap: "6px",
							alignItems: "baseline",
						},
					},
					`${index + 1}. ${chapter.title ?? ""}`,
					createElement(
						"span",
						{ style: { opacity: 0.6 } },
						Number.isFinite(chapter.targetWords)
							? `约 ${chapter.targetWords} 字`
							: "未定，AI 铺章时自定",
					),
					chapter.volumeReason
						? createElement(
								"span",
								{ style: { opacity: 0.5 } },
								`（${chapter.volumeReason}）`,
							)
						: null,
				),
			),
			Number.isFinite(meta.targetWords)
				? createElement(
						"p",
						{ style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.6 } },
						`兜底统一值：${meta.targetWords} 字（仅未填章使用）`,
					)
				: null,
		),
		createElement(
			"div",
			{
				style: {
					display: "flex",
					gap: "6px",
					alignItems: "center",
					flexWrap: "wrap",
				},
			},
			createElement(
				"label",
				{ style: S.label },
				"兜底统一字数（可选，仅未填章使用）",
			),
			createElement("input", {
				style: { ...S.input, width: "110px" },
				type: "number",
				min: 500,
				max: 50000,
				step: 500,
				value: targetWords,
				onChange: (e) => {
					setTargetWords(e.target.value);
					setSuggestion(null);
				},
			}),
			createElement(
				"button",
				{
					style: { ...S.bigBtn(true), padding: "6px 14px" },
					onClick: requestSuggestion,
					disabled: suggesting || busy,
				},
				suggesting ? "AI 思考中…" : "✨ AI 建议",
			),
		),
		suggestion !== null
			? createElement(
					"div",
					{ style: { margin: "4px 0", fontSize: "12px", opacity: 0.8 } },
					createElement(
						"p",
						{ style: { margin: "0 0 4px" } },
						`🤖 AI 建议：每章 ${suggestion.suggested} 字（${suggestion.range ?? ""}）。${suggestion.reason ?? ""}`,
					),
					(suggestion.perChapter ?? []).length > 0
						? createElement(
								"div",
								null,
								(suggestion.perChapter ?? []).map((item) =>
									createElement(
										"div",
										{ key: item.n, style: { margin: "1px 0" } },
										`${item.n}. ${item.title ?? ""}：${Number.isFinite(item.words) ? `约 ${item.words} 字` : "未定，AI 铺章时自定"}${item.reason ? `（${item.reason}）` : ""}`,
									),
								),
							)
						: null,
				)
			: null,
		!wordsEmpty && !wordsOk
			? createElement(
					"p",
					{ style: S.error },
					"兜底字数请在 500-50000 之间，或留空只用每章清单",
				)
			: null,
		error !== null
			? createElement("p", { style: S.error }, `⚠️ ${error}`)
			: null,
		createElement(
			"div",
			{
				style: {
					display: "flex",
					gap: "8px",
					marginTop: "8px",
					alignItems: "center",
				},
			},
			createElement(
				"button",
				{
					style: S.bigBtn(true),
					onClick: () => {
						if (live.length > 0) setConfirming("seal");
						else onApprove(true, targetToSend);
					},
					disabled: busy || !wordsOk,
				},
				"✅ 就按这章的风格写全书",
			),
			createElement(
				"button",
				{
					style: {
						...S.bigBtn(true),
						background: "transparent",
						color: "var(--dsw-danger, #cf222e)",
						padding: "8px 10px",
					},
					onClick: () => setConfirming("rewrite"),
					disabled: busy || !wordsOk,
				},
				"❌ 这版整个不要，重写",
			),
		),
		createElement(
			"p",
			{ style: S.hint },
			"从头重写这一章；你标过的意见仍会带给 AI 当方向",
		),
		confirming === "seal"
			? createElement(
					"div",
					{
						style: {
							...S.card,
							borderColor: "var(--dsw-accent, #4f6ef7)",
							marginTop: "8px",
						},
					},
					createElement(
						"p",
						{ style: { margin: "0 0 4px", fontWeight: 600 } },
						"定稿前确认：下面这些会永久生效",
					),
					createElement(
						"p",
						{ style: { margin: "0 0 4px", fontSize: "12px", opacity: 0.85 } },
						"① 你的意见转成「风格线」，后面每一章都照此执行：",
					),
					live.map((o, i) =>
						createElement(
							"p",
							{
								key: o.id,
								style: { margin: "0 2px 2px 12px", fontSize: "12px" },
							},
							`#${i + 1} ${OPINION_KIND_TEXT[o.kind] ?? o.kind}${o.wish ? `：${o.wish}` : ""}`,
						),
					),
					createElement(
						"p",
						{ style: { margin: "4px 0", fontSize: "12px", opacity: 0.85 } },
						"② 这一稿冻结为「风格母版」，AI 铺全书时都拿它当样板。",
					),
					createElement(
						"div",
						{ style: { display: "flex", gap: "8px", marginTop: "6px" } },
						createElement(
							"button",
							{
								style: S.bigBtn(true),
								onClick: () => onApprove(true, targetToSend),
								disabled: busy || !wordsOk,
							},
							"确认，定稿",
						),
						createElement(
							"button",
							{ style: S.smallLink, onClick: () => setConfirming(null) },
							"再想想",
						),
					),
				)
			: null,
		confirming === "rewrite"
			? createElement(
					"div",
					{
						style: {
							...S.card,
							borderColor: "var(--dsw-danger, #cf222e)",
							marginTop: "8px",
						},
					},
					createElement(
						"p",
						{ style: { margin: "0 0 6px" } },
						"整稿丢弃重写：这一稿会存档留底（不丢），AI 从头再写一版。",
					),
					createElement(
						"div",
						{ style: { display: "flex", gap: "8px" } },
						createElement(
							"button",
							{
								style: {
									...S.bigBtn(true),
									background: "transparent",
									color: "var(--dsw-danger, #cf222e)",
								},
								onClick: () => onApprove(false, targetToSend),
								disabled: busy || !wordsOk,
							},
							"确认重写",
						),
						createElement(
							"button",
							{ style: S.smallLink, onClick: () => setConfirming(null) },
							"再想想",
						),
					),
				)
			: null,
	);
}

// ── 谈判桌·总装（稿页签 + 读/对比 + 意见单 + 定稿区） ────────────────────────

export function GoldTable(props) {
	const {
		meta,
		goldDrafts,
		goldDraftVersion,
		busy,
		postAction,
		fetchText,
		onSuggestWords,
	} = props;
	const [texts, setTexts] = useState({});
	const [view, setView] = useState({ tab: goldDraftVersion, mode: "read" });
	const [auditText, setAuditText] = useState(undefined); // undefined=未读到 null=没有
	const [loadError, setLoadError] = useState(null);
	const opinions = meta.goldOpinions ?? [];
	const goldNo = goldChapterNo(meta);
	const currentPath = `work/chapter-${String(goldNo).padStart(2, "0")}.md`;
	const pathOf = (version) =>
		version === goldDraftVersion
			? currentPath
			: ((goldDrafts ?? []).find((d) => d.version === version)?.path ?? null);
	const load = (path) => {
		if (texts[path] !== undefined) return;
		fetchText(path)
			.then((t) => setTexts((prev) => ({ ...prev, [path]: t })))
			.catch((err) =>
				setLoadError(String(err instanceof Error ? err.message : err)),
			);
	};
	useEffect(() => {
		load(currentPath);
		fetchText(`work/audit-${String(goldNo).padStart(2, "0")}.md`)
			.then(setAuditText)
			.catch(() => setAuditText(null));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	// 展示稿：当前稿或旧稿
	const showTab = Math.min(view.tab, goldDraftVersion);
	const showPath = pathOf(showTab);
	const showText = showPath === null ? null : (texts[showPath] ?? null);
	// 对比对象：当前稿比上一稿；旧稿比它的下一稿
	const compareWith =
		view.mode === "compare"
			? showTab === goldDraftVersion
				? showTab - 1
				: showTab + 1
			: null;
	const comparePath = compareWith !== null ? pathOf(compareWith) : null;
	useEffect(() => {
		if (comparePath !== null) load(comparePath);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [comparePath]);
	const compareText =
		comparePath === null ? null : (texts[comparePath] ?? null);
	let auditBadge = "🧪 质检：已附自查记录";
	if (auditText != null) {
		try {
			const audit = JSON.parse(auditText);
			auditBadge =
				typeof audit.passed === "boolean"
					? audit.passed === true
						? "🧪 质检：通过（自查无待完善项）"
						: "🧪 质检：有几处待完善（可以让 AI 改）"
					: "🧪 质检：记录格式待完善";
		} catch {
			auditBadge = "🧪 质检：记录格式待完善";
		}
	}
	const addOpinion = (kind, wish, para, hint) => {
		void postAction({
			action: "gold-opinion",
			kind,
			wish,
			...(para !== null ? { para } : {}),
			...(hint ? { hint } : {}),
		});
	};
	const tabBtn = (v) =>
		createElement(
			"button",
			{
				key: v,
				style: S.projectBtn(view.tab === v),
				onClick: () => setView({ tab: v, mode: "read" }),
			},
			`第 ${v} 稿${v === goldDraftVersion ? "（最新）" : ""}`,
		);
	return createElement(
		"div",
		{ style: S.focus },
		createElement(
			"div",
			{
				style: {
					display: "flex",
					gap: "8px",
					alignItems: "center",
					flexWrap: "wrap",
					marginBottom: "6px",
				},
			},
			createElement(
				"strong",
				{ style: { fontSize: "14px" } },
				"🤝 最佳范例章 · 风格谈判桌",
			),
			createElement(
				"span",
				{ style: { fontSize: "12px", opacity: 0.8 } },
				auditBadge,
			),
		),
		goldDraftVersion > 1
			? createElement(
					"div",
					{
						style: {
							display: "flex",
							gap: "6px",
							flexWrap: "wrap",
							marginBottom: "6px",
						},
					},
					Array.from({ length: goldDraftVersion }, (_, i) => tabBtn(i + 1)),
					showTab === goldDraftVersion
						? createElement(
								"button",
								{
									style: S.smallLink,
									onClick: () =>
										setView({
											tab: showTab,
											mode: view.mode === "compare" ? "read" : "compare",
										}),
								},
								view.mode === "compare"
									? "只看这一稿"
									: `和第 ${goldDraftVersion - 1} 稿对比`,
							)
						: createElement(
								"button",
								{
									style: S.smallLink,
									onClick: () =>
										setView({
											tab: showTab,
											mode: view.mode === "compare" ? "read" : "compare",
										}),
								},
								view.mode === "compare"
									? "只看这一稿"
									: `和第 ${showTab + 1} 稿对比`,
							),
				)
			: null,
		loadError !== null
			? createElement("p", { style: S.error }, `稿子打开失败：${loadError}`)
			: null,
		createElement(
			"div",
			{ style: { margin: "6px 0" } },
			showText === null
				? createElement("p", { style: S.hint }, "加载中…")
				: view.mode === "compare" && compareText !== null
					? createElement(
							"div",
							null,
							createElement(
								"p",
								{ style: S.hint },
								"想在这一稿上继续挑毛病？点「只看这一稿」。",
							),
							createElement(GoldCompare, {
								oldText: showTab === goldDraftVersion ? compareText : showText,
								newText: showTab === goldDraftVersion ? showText : compareText,
								opinions,
							}),
						)
					: createElement(GoldReader, {
							text: showText,
							opinions,
							busy,
							onOpinion: addOpinion,
							onRevokeOpinion: (id) => {
								void postAction({ action: "gold-opinion-revoke", id });
							},
							readOnly: showTab !== goldDraftVersion,
						}),
			showTab !== goldDraftVersion && view.mode === "read"
				? createElement(
						"p",
						{ style: { fontSize: "12px", opacity: 0.7, margin: "4px 0" } },
						"这是旧稿，只能回顾；要挑毛病请回到「最新」那稿。",
					)
				: null,
		),
		createElement(GoldOpinionList, {
			opinions,
			busy,
			onRevoke: (id) => {
				void postAction({ action: "gold-opinion-revoke", id });
			},
			onRevise: () => {
				void postAction({ action: "gold-revise" });
			},
		}),
		createElement(GoldFinalize, {
			meta,
			opinions,
			busy,
			onApprove: (approved, targetWords) => {
				void postAction({ action: "gold-approve", approved, targetWords });
			},
			onSuggestWords,
		}),
	);
}
