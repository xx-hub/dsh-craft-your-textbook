/**
 * 造书工作台 · 确认卡
 *
 * 两个人审确认点：源探查结果确认（awaiting-explore）与章节安排确认（awaiting-outline）。
 */

import { createElement, useEffect, useState } from "react";
import { S } from "./styles.js";
import { exploreReportBlocks } from "./md-render.js";

// ── 探查结果确认卡（探源 → 用户看一眼再继续） ───────────────────────────────

// 知识点难度 → 颜色（让清单一眼可扫）。
const DIFF_COLORS = {
	基础: "#1a7f37",
	重点: "#9a6700",
	难点: "#cf222e",
	进阶: "#8250df",
};
// 重做探查的预置理由（点选即用，不用打字）。
const RE_EXPLORE_REASONS = [
	"有的材料没读全",
	"知识点整理得太粗",
	"章节建议不合理",
	"重点难点判断不对",
];

export function ExploreConfirmCard(props) {
	// 注：调用方（WorkbenchView）仍会传 meta，但本卡不使用——不解构以免未用变量。
	const {
		exploreSummary,
		project,
		session,
		onConfirm,
		onViewReport,
		busy,
		reportText,
	} = props;
	const sum = exploreSummary ?? {};
	const focus = Array.isArray(sum.teachingFocus) ? sum.teachingFocus : [];
	const [showPoints, setShowPoints] = useState(false);
	const [showSections, setShowSections] = useState(false);
	const [rejecting, setRejecting] = useState(false);
	const [reasons, setReasons] = useState([]);
	const [rejectNote, setRejectNote] = useState("");
	// 知识地图（work/knowledge-map.json）通过现有文件接口读取并渲染成可读清单，
	// 让用户真正"看到"AI 从材料里整理出了什么，而不只是几个数字。
	const [km, setKm] = useState(null);
	useEffect(() => {
		let alive = true;
		setKm(null);
		if (project === null || project === undefined) return undefined;
		fetch(
			`/textbook/file?session=${encodeURIComponent(session)}&project=${encodeURIComponent(project)}&path=${encodeURIComponent("work/knowledge-map.json")}`,
		)
			.then((res) =>
				res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`)),
			)
			.then((text) => {
				// 解析失败等同读取失败（原实现靠链尾 .catch 兼容，此处改为局部捕获，行为不变）：
				// 不渲染知识地图清单、不阻断确认流程。
				try {
					const parsed = JSON.parse(text);
					if (alive) setKm(parsed);
				} catch {
					/* 保持 km 为 null */
				}
			})
			.catch(() => {
				/* 读取失败不影响确认卡；展示不了清单也不阻塞流程 */
			});
		return () => {
			alive = false;
		};
	}, [project, session]);
	// F30（2026-08-20 走查）：源探查报告（work/explore.md）默认置顶展示。
	// 有 reportText（父级/测试注入）直接用（含首次渲染）；否则按上面 knowledge-map 的
	// 同一方式拉取，读取失败不抛错、报告为空也不影响卡片其余功能（优雅降级）。
	const [report, setReport] = useState(() =>
		typeof reportText === "string" && reportText !== "" ? reportText : null,
	);
	useEffect(() => {
		let alive = true;
		if (typeof reportText === "string" && reportText !== "") {
			setReport(reportText);
			return undefined;
		}
		setReport(null);
		if (project === null || project === undefined) return undefined;
		fetch(
			`/textbook/file?session=${encodeURIComponent(session)}&project=${encodeURIComponent(project)}&path=${encodeURIComponent("work/explore.md")}`,
		)
			.then((res) =>
				res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`)),
			)
			.then((text) => {
				if (alive) setReport(text);
			})
			.catch(() => {
				/* 报告读不到就不显示报告区，不打断确认流程 */
			});
		return () => {
			alive = false;
		};
	}, [project, session, reportText]);
	const reportBlocks =
		report !== null && report !== "" ? exploreReportBlocks(report) : [];
	const kps = Array.isArray(km?.knowledgePoints) ? km.knowledgePoints : [];
	const chapters = Array.isArray(km?.chapterSuggestion)
		? km.chapterSuggestion
		: [];
	const sections = Array.isArray(km?.materials) ? km.materials : [];
	const sectionTitles = (material) =>
		Array.isArray(material?.sections)
			? material.sections
					.map((s) => String(s?.title ?? ""))
					.filter((t) => t !== "")
			: [];
	const toggleReason = (reason) => {
		setReasons((prev) =>
			prev.includes(reason)
				? prev.filter((item) => item !== reason)
				: [...prev, reason],
		);
	};
	const cancelReject = () => {
		setRejecting(false);
		setReasons([]);
		setRejectNote("");
	};

	return createElement(
		"div",
		{ style: S.focus },
		reportBlocks.length > 0
			? createElement(
					"div",
					{ style: { ...S.card, marginBottom: "10px" } },
					createElement(
						"p",
						{ style: { margin: "0 0 6px", fontSize: "12px", opacity: 0.8 } },
						"📋 源探查报告（AI 通读后的完整记录）：",
					),
					...reportBlocks,
				)
			: null,
		createElement(
			"strong",
			{ style: { fontSize: "14px" } },
			"🔍 源探查做完了！",
		),
		createElement(
			"p",
			{ style: { margin: "6px 0" } },
			`AI 已通读你的教材，整理出：来源材料 ${sum.sources ?? 0} 份 · 知识点 ${sum.knowledgePoints ?? 0} 个 · 建议分 ${sum.chapterSuggestion ?? 0} 章。`,
		),
		focus.length > 0
			? createElement(
					"div",
					{
						style: {
							margin: "4px 0 8px",
							padding: "8px 10px",
							background: "var(--dsw-surface, #fff)",
							borderRadius: "8px",
							border: "1px solid var(--dsw-border, #d0d7de)",
						},
					},
					createElement(
						"p",
						{ style: { margin: "0 0 4px", fontSize: "12px", opacity: 0.8 } },
						"AI 判断的重点/难点：",
					),
					focus.map((item, index) =>
						createElement(
							"div",
							{ key: index, style: { fontSize: "12px", margin: "2px 0" } },
							`· ${item}`,
						),
					),
				)
			: null,
		chapters.length > 0
			? createElement(
					"div",
					{
						style: {
							margin: "4px 0 8px",
							padding: "8px 10px",
							background: "var(--dsw-surface, #fff)",
							borderRadius: "8px",
							border: "1px solid var(--dsw-border, #d0d7de)",
						},
					},
					createElement(
						"p",
						{ style: { margin: "0 0 4px", fontSize: "12px", opacity: 0.8 } },
						"📚 AI 建议的章节安排（后续可再调）：",
					),
					chapters.map((chapter, index) =>
						createElement(
							"div",
							{ key: index, style: { fontSize: "12px", margin: "2px 0" } },
							`${index + 1}. ${chapter.title ?? ""}`,
							chapter.source !== undefined &&
								chapter.source !== "" &&
								chapter.source !== null
								? createElement(
										"span",
										{ style: { opacity: 0.6 } },
										`　← ${chapter.source}`,
									)
								: null,
						),
					),
				)
			: null,
		kps.length > 0
			? createElement(
					"div",
					{ style: { margin: "4px 0 8px" } },
					createElement(
						"button",
						{ style: S.smallLink, onClick: () => setShowPoints(!showPoints) },
						showPoints
							? `▾ 收起知识点清单（${kps.length} 个）`
							: `▸ 知识点清单（${kps.length} 个，点开看）`,
					),
					showPoints
						? createElement(
								"div",
								{
									style: {
										marginTop: "6px",
										padding: "8px 10px",
										background: "var(--dsw-surface, #fff)",
										borderRadius: "8px",
										border: "1px solid var(--dsw-border, #d0d7de)",
									},
								},
								kps.map((point, index) =>
									createElement(
										"div",
										{
											key: index,
											style: { fontSize: "12px", margin: "2px 0" },
										},
										`· ${point.title ?? ""}`,
										point.difficulty !== undefined &&
											point.difficulty !== "" &&
											point.difficulty !== null
											? createElement(
													"span",
													{
														style: {
															color: DIFF_COLORS[point.difficulty] ?? "#57606a",
														},
													},
													`（${point.difficulty}）`,
												)
											: null,
										point.source !== undefined &&
											point.source !== "" &&
											point.source !== null
											? createElement(
													"span",
													{ style: { opacity: 0.5 } },
													` ${point.source}`,
												)
											: null,
									),
								),
							)
						: null,
				)
			: null,
		sections.length > 0
			? createElement(
					"div",
					{ style: { margin: "4px 0 8px" } },
					createElement(
						"button",
						{
							style: S.smallLink,
							onClick: () => setShowSections(!showSections),
						},
						showSections
							? "▾ 收起每本材料里读到的小节"
							: "▸ 每本材料里读到的小节（点开看）",
					),
					showSections
						? createElement(
								"div",
								{
									style: {
										marginTop: "6px",
										padding: "8px 10px",
										background: "var(--dsw-surface, #fff)",
										borderRadius: "8px",
										border: "1px solid var(--dsw-border, #d0d7de)",
									},
								},
								sections.map((material, index) => {
									const titles = sectionTitles(material);
									return createElement(
										"div",
										{
											key: index,
											style: { fontSize: "12px", margin: "2px 0" },
										},
										`资料${material?.num ?? index + 1}：`,
										createElement(
											"span",
											{ style: { opacity: 0.8 } },
											titles.join(" / ") || "（未读到小节标题）",
										),
									);
								}),
							)
						: null,
				)
			: null,
		createElement(
			"p",
			{ style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
			"这是后面所有设计的基础。满意就继续；不满意点「重做」，勾个理由或写一句哪里不满意，AI 会照着改（不填也能重做）。",
		),
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
						"哪里不满意？（点选或写一句，10 秒内搞定）",
					),
					createElement(
						"div",
						{ style: { margin: "6px 0" } },
						RE_EXPLORE_REASONS.map((reason) =>
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
					),
					createElement("textarea", {
						style: S.textarea,
						placeholder: "想多说一句？在这里写（可选）",
						value: rejectNote,
						onChange: (e) => setRejectNote(e.target.value),
					}),
					createElement(
						"div",
						{ style: { marginTop: "8px", display: "flex", gap: "8px" } },
						createElement(
							"button",
							{
								style: S.bigBtn(false),
								onClick: () => onConfirm(false, { reasons, note: rejectNote }),
								disabled: busy,
							},
							"🔁 就这样重做",
						),
						createElement(
							"button",
							{
								style: { ...S.smallLink, textDecoration: "none" },
								onClick: cancelReject,
							},
							"取消",
						),
					),
				)
			: createElement(
					"div",
					{ style: { display: "flex", gap: "8px", flexWrap: "wrap" } },
					createElement(
						"button",
						{
							style: S.bigBtn(true),
							onClick: () => onConfirm(true),
							disabled: busy,
						},
						"✅ 满意，继续设计",
					),
					createElement(
						"button",
						{
							style: {
								...S.bigBtn(true),
								background: "transparent",
								color: "var(--dsw-danger, #cf222e)",
							},
							onClick: () => setRejecting(true),
							disabled: busy,
						},
						"🔁 让 AI 重做",
					),
					createElement(
						"button",
						{
							style: { ...S.smallLink, textDecoration: "none" },
							onClick: onViewReport,
							disabled: busy,
						},
						"👀 看完整报告",
					),
				),
	);
}

// ── 章节安排确认卡（D1 人审：awaiting-outline 时的焦点区） ─────────────────────

export function OutlineConfirmCard(props) {
	const { meta, busy, onConfirm } = props;
	const [rejecting, setRejecting] = useState(false);
	const [note, setNote] = useState("");
	const chapters = meta?.outline?.chapters ?? [];
	const totalWords = chapters.reduce(
		(sum, chapter) =>
			sum + (Number.isFinite(chapter?.targetWords) ? chapter.targetWords : 0),
		0,
	);
	// 样例章：默认取旧账本兜底 meta.goldChapter ?? 1；用户可改选（只对确认生效）。
	const [goldPick, setGoldPick] = useState(() => {
		const initial = Number(meta?.goldChapter ?? 1);
		return Number.isSafeInteger(initial) &&
			initial >= 1 &&
			initial <= chapters.length
			? initial
			: 1;
	});
	const goldReason =
		typeof meta?.goldChapterReason === "string" ? meta.goldChapterReason : "";
	const safePick =
		Number.isSafeInteger(Number(goldPick)) &&
		Number(goldPick) >= 1 &&
		Number(goldPick) <= chapters.length
			? Number(goldPick)
			: 1;

	return createElement(
		"div",
		{ style: S.focus },
		createElement(
			"strong",
			{ style: { fontSize: "14px" } },
			"📐 章节安排出来了！",
		),
		createElement(
			"p",
			{ style: { margin: "6px 0" } },
			`AI 计划把这本书分成 ${chapters.length} 章${totalWords > 0 ? `，全书大约 ${totalWords} 字` : ""}。每章标好了用材料的哪一块、覆盖哪些知识点、大概写多长。满意点「通过」，AI 先写最佳范例章（第 ${safePick} 章当全书样板）给你过目；要调就点「提改进方向」。`,
		),
		createElement(
			"div",
			{
				style: {
					margin: "4px 0 8px",
					padding: "8px 10px",
					background: "var(--dsw-surface, #fff)",
					borderRadius: "8px",
					border: "1px solid var(--dsw-border, #d0d7de)",
				},
			},
			chapters.map((chapter, index) => {
				// F38（2026-08-20 走查）：每章源材料索引措辞——「源：」前缀 + 「覆盖知识点 N 个」（N=points 数组长度）。
				const pointsArr = Array.isArray(chapter?.points)
					? chapter.points
							.map((pt) => String(pt ?? "").trim())
							.filter((pt) => pt !== "")
					: [];
				const points = pointsArr.join(" / ");
				const volumeReason =
					typeof chapter?.volumeReason === "string" ? chapter.volumeReason : "";
				return createElement(
					"div",
					{ key: index, style: { fontSize: "12px", margin: "4px 0" } },
					`${index + 1}. ${chapter.title ?? ""}`,
					chapter.outline !== undefined &&
						chapter.outline !== "" &&
						chapter.outline !== null
						? createElement(
								"span",
								{ style: { opacity: 0.6 } },
								`　${chapter.outline}`,
							)
						: null,
					createElement(
						"div",
						{ style: { opacity: 0.6, margin: "1px 0 0" } },
						[
							chapter.source !== undefined &&
							chapter.source !== "" &&
							chapter.source !== null
								? `源：${chapter.source}`
								: null,
							Number.isFinite(chapter.targetWords)
								? `约 ${chapter.targetWords} 字`
								: null,
						]
							.filter(Boolean)
							.join(" · "),
					),
					pointsArr.length > 0
						? createElement(
								"div",
								{ style: { opacity: 0.6, margin: "1px 0 0" } },
								`覆盖知识点 ${pointsArr.length} 个${points !== "" ? `：${points}` : ""}`,
							)
						: null,
					volumeReason !== ""
						? createElement(
								"div",
								{
									style: { opacity: 0.5, fontSize: "11px", margin: "1px 0 0" },
								},
								`体量依据：${volumeReason}`,
							)
						: null,
				);
			}),
		),
		createElement(
			"div",
			{
				style: {
					margin: "4px 0 10px",
					display: "flex",
					alignItems: "center",
					gap: "6px",
					flexWrap: "wrap",
				},
			},
			createElement(
				"span",
				{ style: { fontSize: "12px" } },
				`📐 AI 建议用第 ${safePick} 章当样例章：${goldReason !== "" ? goldReason : "（未给理由）"}`,
			),
			chapters.length > 1
				? createElement(
						"select",
						{
							style: {
								fontSize: "12px",
								padding: "2px 4px",
								borderRadius: "6px",
								border: "1px solid var(--dsw-border, #d0d7de)",
								background: "var(--dsw-surface, #fff)",
							},
							value: safePick,
							onChange: (e) => setGoldPick(Number(e.target.value)),
							disabled: busy,
						},
						chapters.map((chapter, index) =>
							createElement(
								"option",
								{ key: index, value: index + 1 },
								`${index + 1}. ${chapter.title ?? ""}`,
							),
						),
					)
				: null,
			chapters.length > 1
				? createElement(
						"span",
						{ style: { fontSize: "11px", opacity: 0.6 } },
						"（可改选）",
					)
				: null,
		),
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
						"改哪里？写一句（比如：第3章拆成两章 / 每章字数太多）",
					),
					createElement("textarea", {
						style: S.textarea,
						placeholder: "想怎么调，写在这里（可不填，AI 会自己重新安排）",
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
								onClick: () => onConfirm(false, note.trim()),
								disabled: busy,
							},
							"🔁 就这样重新安排",
						),
						createElement(
							"button",
							{
								style: { ...S.smallLink, textDecoration: "none" },
								onClick: () => {
									setRejecting(false);
									setNote("");
								},
								disabled: busy,
							},
							"取消",
						),
					),
				)
			: createElement(
					"div",
					{ style: { display: "flex", gap: "8px", flexWrap: "wrap" } },
					createElement(
						"button",
						{
							style: S.bigBtn(true),
							onClick: () => onConfirm(true, note, safePick),
							disabled: busy,
						},
						"✅ 通过，开始写范例章",
					),
					createElement(
						"button",
						{
							style: {
								...S.bigBtn(true),
								background: "transparent",
								color: "var(--dsw-danger, #cf222e)",
							},
							onClick: () => setRejecting(true),
							disabled: busy,
						},
						"🔁 提改进方向",
					),
				),
	);
}
