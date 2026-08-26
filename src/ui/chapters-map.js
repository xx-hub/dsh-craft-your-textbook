/**
 * 造书工作台 · 章节清单与过程地图
 *
 * 铺章阶段的章节卡（含过目态内联展开）、过程地图栏、历史浏览与定点修改、
 * 文件查看器（knowledge-map 折叠）与浏览态整段。
 */

import { createElement, useEffect, useMemo, useState } from "react";
import { S } from "./styles.js";
import { chapterBadge, deriveDoneSet } from "./rules.js";
import { GoldReader } from "./gold-table.js";

// ── 章节清单卡（铺章阶段 · 人+AI 协同抽查面板） ───────────────────────────────

export function ChaptersCard(props) {
	const {
		meta,
		chapterStatus,
		pendingReviews,
		progressDetail,
		onView,
		onReview,
		busy,
		reviewMode,
		onApproveAll,
		events,
		workFiles,
		project,
		session,
		postAction,
		initialOpenChapter,
		chapterTextOverride,
	} = props;
	const [reviewing, setReviewing] = useState(null);
	const [comment, setComment] = useState("");
	// F39（2026-08-20 走查）：过目态「看看这章」内联展开——openChapter 记当前点开的章号，
	// 正文经文件接口拉取（initialOpenChapter / chapterTextOverride 仅供测试注入，生产不传）。
	const [openChapter, setOpenChapter] = useState(() =>
		Number.isSafeInteger(initialOpenChapter) && initialOpenChapter >= 1
			? initialOpenChapter
			: null,
	);
	const [chapterText, setChapterText] = useState(null);
	const [chapterError, setChapterError] = useState(null);
	useEffect(() => {
		let alive = true;
		setChapterText(null);
		setChapterError(null);
		if (openChapter === null || openChapter === undefined) return undefined;
		if (project === null || project === undefined) return undefined;
		const rel = `work/chapter-${String(openChapter).padStart(2, "0")}.md`;
		fetch(
			`/textbook/file?session=${encodeURIComponent(session)}&project=${encodeURIComponent(project)}&path=${encodeURIComponent(rel)}`,
		)
			.then((res) =>
				res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`)),
			)
			.then((text) => {
				if (alive) setChapterText(text);
			})
			.catch((err) => {
				if (alive)
					setChapterError(String(err instanceof Error ? err.message : err));
			});
		return () => {
			alive = false;
		};
	}, [openChapter, project, session]);
	const rows = (meta?.outline?.chapters ?? []).map((chapter, index) => {
		const found = (chapterStatus ?? []).find(
			(row) => Number(row.n) === index + 1,
		);
		// F38（2026-08-20 走查）：源材料索引的「源」优先取后端账本 chapterStatus 的实际来源，
		// 为空时回退到确认过的大纲 plan（chapter.source），保证每章都有可读的源出处。
		const foundSource = found != null ? (found.source ?? "") : "";
		return {
			n: index + 1,
			title: found?.title ?? chapter.title ?? `第${index + 1}章`,
			source: foundSource !== "" ? foundSource : (chapter.source ?? ""),
			// F38（2026-08-20 走查）：每章「源材料索引」的覆盖知识点与体量依据，取自确认过的大纲。
			points: Array.isArray(chapter?.points)
				? chapter.points
						.map((pt) => String(pt ?? "").trim())
						.filter((pt) => pt !== "")
				: [],
			volumeReason:
				typeof chapter?.volumeReason === "string" ? chapter.volumeReason : "",
			written: found?.written === true || (chapterStatus ?? []).length === 0,
			audited: found?.audited === true || (chapterStatus ?? []).length === 0,
		};
	});
	// 已完成的章（纯账本推导）：events 里「AI 完成某章」的 agent-end 事件（label 含 第N章）。
	const doneSet = useMemo(() => deriveDoneSet(events), [events]);
	// 「看看这章」置灰：chapter 文件不在产物清单里就禁用（旧账本/未拉取时 ?? 兜底不误灰）。
	const hasChapterFile = (n) => {
		const files = workFiles ?? [];
		if (files.length === 0) return true;
		return files.some(
			(f) => f.path === `work/chapter-${String(n).padStart(2, "0")}.md`,
		);
	};
	const done = rows.filter((row) => row.written && row.audited).length;
	const prepared = (chapterStatus ?? []).length > 0;

	const sendReview = (n) => {
		if (comment.trim() === "") return;
		void onReview(n, comment.trim()).then(() => {
			setReviewing(null);
			setComment("");
		});
	};

	return createElement(
		"div",
		{ style: S.focus },
		reviewMode
			? createElement(
					"div",
					{
						style: {
							margin: "0 0 10px",
							padding: "8px 10px",
							borderRadius: "8px",
							background: "var(--dsw-accent-soft, #eef2ff)",
						},
					},
					createElement("strong", null, "📚 全部章节写好了，请你过目"),
					createElement(
						"p",
						{ style: { margin: "4px 0", fontSize: "12px", opacity: 0.8 } },
						"想细看点「看看这章」；有意见直接写，AI 照改；都满意就交工合并。",
					),
					createElement(
						"button",
						{ style: S.bigBtn(true), onClick: onApproveAll, disabled: busy },
						"✅ 都过了，交工",
					),
				)
			: null,
		createElement(
			"strong",
			{ style: { fontSize: "14px" } },
			"📚 铺章 · 章节清单",
		),
		createElement(
			"p",
			{ style: { margin: "4px 0 8px", fontSize: "12px", opacity: 0.75 } },
			`每章流程：小助手执笔 → 小助手审计 → AI 最后把关。已完成 ${done}/${rows.length} 章；你随时可以"看看这章"并写意见，AI 会照意见修订。`,
		),
		progressDetail !== null &&
			progressDetail !== undefined &&
			progressDetail !== ""
			? createElement(
					"div",
					{
						style: {
							margin: "0 0 8px",
							padding: "6px 10px",
							borderRadius: "8px",
							background: "var(--dsw-accent-soft, #eef2ff)",
							fontSize: "12px",
						},
					},
					`🤖 ${progressDetail}`,
				)
			: null,
		rows.map((row) => {
			// F35：主 AI 上报的章级流水线阶段（meta.chapterPipeline[n-1]={stage,updatedAt}；旧账本兜底 null → 四态回退）。
			const pipelineStage =
				(meta?.chapterPipeline ?? [])[row.n - 1]?.stage ?? null;
			const badge = chapterBadge(row, pendingReviews, doneSet, pipelineStage);
			const open = reviewing === row.n;
			const fileMissing = !hasChapterFile(row.n);
			// F39：过目态点「看看这章」= 内联展开（openChapter），正文渲染在该章卡片正下方；
			// 非过目态保持原行为（onView → 父级底部查看器）。
			const chapterOpen = reviewMode && openChapter === row.n;
			// 该章已挂的段落级意见（chapter 维度、未撤销）：喂给 GoldReader 标段与两态键。
			const rowOpinions = (pendingReviews ?? []).filter(
				(r) =>
					Number(r.chapter) === Number(row.n) &&
					r.kind != null &&
					r.status !== "revoked",
			);
			const shownText =
				typeof chapterTextOverride === "string" && chapterTextOverride !== ""
					? chapterTextOverride
					: chapterText;
			// F38（2026-08-20 走查）：每章「源材料索引」——源：用哪本材料哪部分 · 覆盖知识点 N 个 · 体量依据。
			// 字段缺失就不显示对应段；全缺则整行不渲染。
			const sourceIndex = [
				row.source !== undefined && row.source !== "" && row.source !== null
					? `源：${row.source}`
					: null,
				row.points.length > 0 ? `覆盖知识点 ${row.points.length} 个` : null,
				row.volumeReason !== "" ? `体量依据：${row.volumeReason}` : null,
			]
				.filter(Boolean)
				.join(" · ");
			return createElement(
				"div",
				{
					key: row.n,
					style: {
						margin: "6px 0",
						padding: "8px 10px",
						background: "var(--dsw-surface, #fff)",
						borderRadius: "8px",
						border: "1px solid var(--dsw-border, #d0d7de)",
					},
				},
				createElement(
					"div",
					{
						style: {
							display: "flex",
							alignItems: "center",
							gap: "8px",
							flexWrap: "wrap",
						},
					},
					createElement(
						"span",
						{ style: { flex: 1, fontSize: "13px", fontWeight: 600 } },
						`第 ${row.n} 章《${row.title}》`,
					),
					!prepared
						? createElement(
								"span",
								{ style: { fontSize: "12px", color: badge.tone } },
								`${badge.icon} 准备中`,
							)
						: createElement(
								"span",
								{ style: { fontSize: "12px", color: badge.tone } },
								`${badge.icon} ${badge.text}`,
							),
				),
				sourceIndex !== ""
					? createElement(
							"div",
							{ style: { margin: "2px 0 0", fontSize: "11px", opacity: 0.6 } },
							sourceIndex,
						)
					: null,
				createElement(
					"div",
					{
						style: {
							marginTop: "6px",
							display: "flex",
							gap: "10px",
							alignItems: "center",
						},
					},
					createElement(
						"button",
						{
							style: S.smallLink,
							onClick: () => {
								if (reviewMode) {
									setOpenChapter(chapterOpen ? null : row.n);
									setChapterText(null);
									setChapterError(null);
								} else onView(row.n);
							},
							disabled: fileMissing,
							title: fileMissing
								? "这一章还没写出来（或文件改名了），暂时看不了"
								: undefined,
						},
						chapterOpen ? "收起" : "👀 看看这章",
					),
					prepared
						? createElement(
								"button",
								{
									style: S.smallLink,
									onClick: () => {
										setReviewing(open ? null : row.n);
										setComment("");
									},
								},
								open ? "收起" : "✍️ 写意见",
							)
						: null,
				),
				open
					? createElement(
							"div",
							{ style: { marginTop: "6px" } },
							createElement("textarea", {
								style: S.textarea,
								placeholder:
									"你对这章的意见（比如：例子太难、多给几道练习、风格换成更口语）",
								value: comment,
								onChange: (e) => setComment(e.target.value),
							}),
							createElement(
								"button",
								{
									style: { ...S.bigBtn(true), padding: "6px 14px" },
									onClick: () => sendReview(row.n),
									disabled: busy || comment.trim() === "",
								},
								"把意见交给 AI 修订",
							),
						)
					: null,
				// F39：过目态内联展开——章正文 md 渲染（GoldReader 的段落流式排版 + renderInline），
				// 段落旁复用 GoldReader 段级三键（😕/🗑/✏️），意见走 gold-opinion 带 chapter 落 pendingReviews。
				chapterOpen
					? createElement(
							"div",
							{
								style: {
									marginTop: "8px",
									borderTop: "1px dashed var(--dsw-border, #d0d7de)",
									paddingTop: "8px",
								},
							},
							chapterError !== null
								? createElement(
										"p",
										{ style: S.error },
										`打开失败：${chapterError}`,
									)
								: shownText === null
									? createElement("p", { style: S.hint }, "加载中…")
									: createElement(
											"div",
											null,
											createElement(
												"p",
												{
													style: {
														margin: "0 0 6px",
														fontSize: "12px",
														opacity: 0.75,
													},
												},
												`第 ${row.n} 章正文（鼠标停在哪一段，那段右侧亮出 😕🗑✏️ 提意见）：`,
											),
											createElement(GoldReader, {
												text: shownText,
												opinions: rowOpinions,
												busy,
												onOpinion: (kind, wish, para, hint) => {
													if (postAction === undefined) return;
													void postAction({
														action: "gold-opinion",
														kind,
														wish,
														...(para !== null ? { para } : {}),
														...(hint ? { hint } : {}),
														chapter: row.n,
													});
												},
												onRevokeOpinion: (id) => {
													if (postAction === undefined) return;
													void postAction({
														action: "gold-opinion-revoke",
														id,
													});
												},
											}),
										),
						)
					: null,
			);
		}),
		createElement(
			"p",
			{ style: { margin: "8px 0 0", fontSize: "12px", opacity: 0.7 } },
			"📌 每章都自动存档，之后随时能回退到任意拍板点。",
		),
	);
}

// ── 过程地图（左竖栏：全书分段，历史灰/当前亮/未来虚；点击=焦点区切浏览视图） ──

function segState(segments, key) {
	return segments.find((s) => s.key === key)?.status ?? "pending";
}

export function ProcessMapRail(props) {
	const { segments, status, browsingKey, onSelect } = props;
	// 邀请码可点复制：整卡是链接会跳转，代码块单独拦下来复制、不跳转（2026-08-21）。
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
				done();
			}
		};
		if (
			typeof navigator !== "undefined" &&
			navigator.clipboard?.writeText !== undefined
		) {
			navigator.clipboard.writeText(code).then(done, fallback);
		} else {
			fallback();
		}
	};
	const row = (seg) => {
		const state = seg.status;
		const isCurrent = browsingKey === seg.key;
		return createElement(
			"button",
			{
				key: seg.key,
				style: {
					display: "block",
					width: "100%",
					textAlign: "left",
					padding: "5px 8px",
					margin: "2px 0",
					fontSize: "12px",
					borderRadius: "6px",
					cursor: "pointer",
					background: isCurrent
						? "var(--dsw-accent-soft, #eef2ff)"
						: state === "active"
							? "var(--dsw-surface, #fff)"
							: state === "waiting-user"
								? "#fff8e6"
								: "transparent",
					opacity: state === "pending" ? 0.45 : state === "done" ? 0.75 : 1,
					border:
						state === "waiting-user"
							? "1px solid #e3b341"
							: "1px solid transparent",
					color: "inherit",
				},
				onClick: () => onSelect(seg.key),
				title:
					state === "waiting-user"
						? "在等你拍板/确认"
						: state === "active"
							? "正在做"
							: state === "done"
								? "已完成，点开回看"
								: "还没到这一步",
			},
			`${state === "waiting-user" ? "⚡" : state === "done" ? "·" : state === "active" ? "▶" : "○"} ${seg.label}`,
			seg.status === "waiting-user" ? "（轮到你）" : "",
		);
	};
	return createElement(
		"div",
		{
			style: {
				width: "220px",
				flexShrink: 0,
				borderRight: "1px solid var(--dsw-border, #d0d7de)",
				padding: "8px",
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
			},
		},
		createElement(
			"div",
			{ style: { flex: 1, minHeight: 0, overflowY: "auto" } },
			createElement(
				"p",
				{ style: { margin: "0 0 6px", fontSize: "12px", opacity: 0.7 } },
				"🗺 过程地图（点任意一步回看/定点修改）",
			),
			...(segments ?? []).map(row),
			createElement(
				"p",
				{ style: { margin: "8px 0 0", fontSize: "11px", opacity: 0.55 } },
				"⚡=在等你 · ▶=正在做 · ·=已完成",
			),
		),
		// 破卷常驻广告（2026-08-21 需求）：醒目好看、整块可点，造书进程中始终可见。
		createElement(
			"a",
			{
				href: "https://www.socratopia.app/r/SCR-FEJXMQ",
				target: "_blank",
				rel: "noopener noreferrer",
				// F43（2026-08-20）：广告卡 flexShrink:0 常驻 rail 底部，地图滚动只滚自己的滚动条。
				style: {
					display: "block",
					marginTop: "6px",
					padding: "10px 10px 9px",
					borderRadius: "10px",
					flexShrink: 0,
					background:
						"linear-gradient(135deg, #4f6ef7 0%, #7a5cff 55%, #c04df7 100%)",
					color: "#ffffff",
					fontSize: "11px",
					lineHeight: 1.55,
					textDecoration: "none",
					border: "1px solid rgba(255, 255, 255, 0.3)",
					boxShadow: "0 3px 10px rgba(79, 110, 247, 0.35)",
				},
			},
			createElement(
				"div",
				{
					style: {
						display: "flex",
						alignItems: "center",
						gap: "6px",
						marginBottom: "5px",
					},
				},
				createElement("span", { style: { fontSize: "16px" } }, "📚"),
				createElement("strong", { style: { fontSize: "13px" } }, "【破卷】"),
				createElement(
					"span",
					{
						style: {
							fontSize: "10px",
							background: "rgba(255,255,255,0.22)",
							borderRadius: "4px",
							padding: "0 5px",
							lineHeight: "15px",
						},
					},
					"衍生项目",
				),
			),
			createElement("div", null, "把造好的书交给【破卷】"),
			createElement("div", null, "3A 沉浸感 · 3 倍学习效率"),
			createElement(
				"div",
				{ style: { marginTop: "5px", fontSize: "10px" } },
				"填邀请码 ",
				createElement(
					"span",
					{
						onClick: (e) => copyInvite(e, "SCR-FEJXMQ"),
						title: copied ? "已复制" : "点击复制邀请码",
						style: {
							background: "rgba(255,255,255,0.28)",
							borderRadius: "5px",
							padding: "1px 6px",
							letterSpacing: "0.5px",
							cursor: "pointer",
							userSelect: "all",
						},
					},
					copied ? "✓ 已复制" : "SCR-FEJXMQ",
				),
				" 领 100 万 tokens →",
			),
		),
	);
}

// ── 历史浏览与定点修改（深改入口；数据来自 /textbook/process） ───────────────

export function HistoryBrowser(props) {
	const { segment, meta, onDeepModify, onDeepUndo, busy } = props;
	const [confirming, setConfirming] = useState(false);
	const [note, setNote] = useState("");
	const undoable =
		meta?.lastDeepModify != null &&
		Date.now() - meta.lastDeepModify.at <= 10 * 60 * 1000;
	if (segment == null) return null;
	const downstreamText =
		(segment.downstream ?? []).length === 0
			? "这一步之后没有下游要重做"
			: `要重做：${(segment.downstream ?? []).join(" -> ")}`;
	return createElement(
		"div",
		{ style: S.focus },
		createElement(
			"strong",
			{ style: { fontSize: "14px" } },
			`🗂 回看：${segment.label ?? segment.key}`,
		),
		createElement(
			"p",
			{ style: { margin: "6px 0", fontSize: "12px", opacity: 0.75 } },
			`现在：${segment.status === "done" ? "已完成" : segment.status === "waiting-user" ? "在等你" : segment.status === "active" ? "进行中" : "还没到"}`,
			segment.decision != null
				? ` · 拍板：${segment.decision.approved === true ? "✅ 通过" : "❌ 驳回"}${segment.decision.note ? `（${segment.decision.note}）` : ""}`
				: "",
		),
		(segment.artifacts ?? []).length > 0
			? createElement(
					"div",
					{ style: { margin: "4px 0 8px" } },
					createElement(
						"p",
						{ style: { margin: "0 0 4px", fontSize: "12px", opacity: 0.8 } },
						"这一步的产物：",
					),
					...(segment.artifacts ?? []).map((rel) =>
						createElement(
							"button",
							{
								key: rel,
								style: { ...S.smallLink, display: "block", margin: "2px 0" },
								onClick: () => props.onView(rel),
								title: "点开看内容",
							},
							`📄 ${rel}`,
						),
					),
				)
			: createElement(
					"p",
					{ style: { margin: "4px 0 8px", fontSize: "12px", opacity: 0.6 } },
					"这一步没有留产物。",
				),
		segment.key !== "chapters-review" && segment.canDeepModify === true
			? confirming
				? createElement(
						"div",
						{
							style: {
								marginTop: "8px",
								borderTop: "1px dashed var(--dsw-border, #d0d7de)",
								paddingTop: "8px",
							},
						},
						createElement(
							"p",
							{ style: { margin: "0 0 6px", fontWeight: 600 } },
							`✍️ 定点修改「${segment.label}」`,
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
							`影响预告：${downstreamText}。`,
						),
						createElement(
							"p",
							{ style: { margin: "0 0 6px", fontSize: "12px", opacity: 0.75 } },
							"你的风格线和豁免原样保留；每一步仍会来请你拍板；旧版本全部留档；10 分钟内可一键撤销。",
						),
						createElement("textarea", {
							style: S.textarea,
							placeholder: "这次要改成什么？写一句（必填）",
							value: note,
							onChange: (e) => setNote(e.target.value),
						}),
						createElement(
							"div",
							{ style: { marginTop: "8px", display: "flex", gap: "8px" } },
							createElement(
								"button",
								{
									style: S.bigBtn(false),
									disabled: busy || note.trim() === "",
									onClick: () => {
										onDeepModify(segment.key, note.trim());
										setConfirming(false);
										setNote("");
									},
								},
								"✍️ 就这么改，重做下游",
							),
							createElement(
								"button",
								{
									style: S.smallLink,
									onClick: () => {
										setConfirming(false);
										setNote("");
									},
								},
								"取消",
							),
						),
					)
				: createElement(
						"button",
						{
							style: {
								...S.bigBtn(true),
								background: "transparent",
								color: "var(--dsw-danger, #cf222e)",
							},
							onClick: () => setConfirming(true),
							disabled: busy,
						},
						"✍️ 定点修改这一步",
					)
			: null,
		undoable
			? createElement(
					"button",
					{
						style: { ...S.smallLink, textDecoration: "none", marginTop: "8px" },
						disabled: busy,
						onClick: onDeepUndo,
					},
					"↩️ 撤销刚才的定点修改（10 分钟内）",
				)
			: null,
		createElement(
			"p",
			{ style: { margin: "10px 0 0", fontSize: "12px", opacity: 0.7 } },
			"想问『当时为什么这么定』？在对话里告诉 AI 你正在看哪一步（比如『第 2 关为什么这么定』），它会翻账本用大白话答。",
		),
	);
}

// ── 文件查看器（F22 抽出共用）：标题 + 收起 + 正文 <pre>。 ─────────────────────
// 浏览态下嵌在该段卡片正下方；「现在」视图下用于顶栏/事件卡/材料查看。

// F38（2026-08-20 走查）：knowledge-map.json 的最小人读折叠——把原始 JSON 的
// 章节建议/知识点清单/材料小节折叠成逐行清单；解析失败或无内容返回 null（回退原样）。
export function foldKnowledgeMap(text) {
	let data;
	try {
		data = JSON.parse(text);
	} catch {
		return null;
	}
	if (data === null || typeof data !== "object") return null;
	const lines = [];
	const chapters = Array.isArray(data.chapterSuggestion)
		? data.chapterSuggestion
		: [];
	if (chapters.length > 0) {
		lines.push(`📚 章节建议（${chapters.length} 章）`);
		chapters.forEach((chapter, index) => {
			const title = String(chapter?.title ?? "").trim();
			const src = String(chapter?.source ?? "").trim();
			lines.push(`${index + 1}. ${title}${src !== "" ? `　← ${src}` : ""}`);
		});
		lines.push("");
	}
	const kps = Array.isArray(data.knowledgePoints) ? data.knowledgePoints : [];
	if (kps.length > 0) {
		lines.push(`🎯 知识点清单（${kps.length} 个）`);
		for (const point of kps) {
			const title = String(point?.title ?? "").trim();
			if (title === "") continue;
			const diff = String(point?.difficulty ?? "").trim();
			const src = String(point?.source ?? "").trim();
			lines.push(
				`· ${title}${diff !== "" ? `（${diff}）` : ""}${src !== "" ? ` ${src}` : ""}`,
			);
		}
		lines.push("");
	}
	const materials = Array.isArray(data.materials) ? data.materials : [];
	if (materials.length > 0) {
		lines.push(`📄 材料小节（${materials.length} 份）`);
		materials.forEach((material, index) => {
			const title = String(material?.title ?? "").trim();
			const sections = Array.isArray(material?.sections)
				? material.sections
						.map((s) => String(s?.title ?? "").trim())
						.filter((t) => t !== "")
				: [];
			lines.push(
				`资料${material?.num ?? index + 1}${title !== "" ? `（${title}）` : ""}：${sections.join(" / ") || "（未读到小节标题）"}`,
			);
		});
		lines.push("");
	}
	if (lines.length === 0) return null;
	return lines.join("\n").replace(/\n+$/, "");
}

export function FileViewer(props) {
	const { viewing, viewText, onClose } = props;
	// F38（2026-08-20 走查）：knowledge-map.json 折叠成人读清单；解析失败/无内容回退原样 <pre>。
	const isKm =
		typeof viewing?.path === "string" &&
		viewing.path.endsWith("knowledge-map.json");
	const folded = isKm ? foldKnowledgeMap(viewText) : null;
	return createElement(
		"div",
		{
			style: {
				marginTop: "8px",
				border: "1px solid var(--dsw-border, #d0d7de)",
				borderRadius: "8px",
				padding: "10px",
			},
		},
		createElement(
			"div",
			{
				style: {
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				},
			},
			createElement(
				"strong",
				{ style: { fontSize: "13px" } },
				`📄 ${viewing.label}`,
			),
			createElement(
				"button",
				{ style: S.smallLink, onClick: onClose },
				"✕ 收起",
			),
		),
		createElement(
			"pre",
			{
				style: {
					whiteSpace: "pre-wrap",
					wordBreak: "break-word",
					background: "var(--dsw-surface, #fff)",
					borderRadius: "8px",
					padding: "10px",
					maxHeight: "320px",
					overflow: "auto",
					fontSize: "12px",
					marginTop: "6px",
				},
			},
			folded !== null ? folded : viewText,
		),
	);
}

// ── 浏览态整段（F22 2026-08-20）：「⏪ 回到现在」+ 历史分段卡（HistoryBrowser） ──
// + 该段「产物」查看内容直接渲染在卡片正下方（不再沉到焦点区底部）。

export function BrowseSection(props) {
	const {
		segment,
		meta,
		busy,
		viewing,
		viewText,
		onBack,
		onView,
		onDeepModify,
		onDeepUndo,
		onCloseView,
	} = props;
	return createElement(
		"div",
		{ style: { marginBottom: "8px" } },
		createElement(
			"button",
			{ style: S.smallLink, onClick: onBack },
			"⏪ 回到现在",
		),
		createElement(HistoryBrowser, {
			segment,
			meta,
			busy,
			onView,
			onDeepModify,
			onDeepUndo,
		}),
		viewing !== null && viewText !== null
			? createElement(FileViewer, { viewing, viewText, onClose: onCloseView })
			: null,
	);
}
