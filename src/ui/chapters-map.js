/**
 * 造书工作台 · 章节清单与步清单
 *
 * 铺章阶段的章节卡（含过目态内联展开）、全书步清单（全览条）、历史浏览与定点修改、
 * 文件查看器（knowledge-map 折叠）与浏览态整段。
 */

import { createElement, useEffect, useMemo, useState } from "react";
import { S } from "./styles.js";
import {
	chapterBadge,
	deriveDoneSet,
	hasPendingReview,
	reviewState,
	reviewText,
} from "./rules.js";
import { GoldReader } from "./gold-table.js";
// 界面用词表（批 2）：步清单按 seg.key 取界面词，不再直接渲染服务端账本 label。
import {
	PHASE_UI,
	artifactName,
	stepCount,
	stepWord,
	stepsOf,
	workEntryAction,
} from "./view-rules.js";
// 票 09：章节卡非过目态那颗「打开」＝票 02 那颗共用按钮，住中性模块（阶段页再导出它）。
// ⚠️ 不许从 `./phase-page.js` import：那个文件已经 import 本文件（`foldKnowledgeMap` /
// `stepRowText`），反向 import 会成环（`chapters-map → phase-page → chapters-map`）。
import { OpenArtifactButton } from "./open-artifact-button.js";
import { goldChapterNo } from "../domain-rules.js";

/**
 * 章号 → 章节正文路径（两位序号是契约，与 `view-rules` 里那份同一形状）。
 * 三处调用点（拉正文 / 「文件在不在产物清单里」的置灰判据 / 「打开」按钮的产物名）共用一份，
 * 别各拼一遍。
 */
const chapterRel = (n) => `work/chapter-${String(n).padStart(2, "0")}.md`;

// ── 章节清单卡（铺章阶段 · 人+AI 协同抽查面板） ───────────────────────────────

/**
 * 一条意见在章节卡上的一行（票 10：本程对 `src/ui/` 的**唯一**开口）。
 *
 * 用户在自己读那条意见的地方就能看见它被怎么处置了：`pending` 照旧显示（它正拦着这一章交工）；
 * `applied` 显示成「已处置 · <how>」并在**同一行**给一个「翻案」按钮（就地，不另起界面）；
 * `revoked` 显示「已作废」。翻案＝把这条退回未处置（服务端的 `review-revoke` 把 `status` 写回
 * `pending` 并清掉 `how`），该章交工因此重新被拦——见 `.scratch/dead-gates/issues/10-*.md`。
 */
function ChapterReviewLine(props) {
	const { review, busy, onRevoke } = props;
	const state = reviewState(review);
	const text = reviewText(review);
	// 翻案要按 id 点名（服务端 review-revoke 只认 id）：老账本里没写 id 的意见给不出翻案按钮，
	// 不给一个点了没反应（或点了 404）的死按钮。
	const canRevoke =
		state.revocable && typeof review?.id === "string" && review.id !== "";
	return createElement(
		"div",
		{
			style: {
				display: "flex",
				alignItems: "baseline",
				gap: "6px",
				flexWrap: "wrap",
				margin: "3px 0",
				fontSize: "12px",
			},
		},
		createElement("span", { style: { opacity: 0.6 } }, "·"),
		createElement(
			"span",
			{ style: { flex: "1 1 160px", wordBreak: "break-word" } },
			text,
		),
		createElement(
			"span",
			{
				style: {
					color:
						state.key === "pending"
							? "#cf222e"
							: state.key === "applied"
								? "#1a7f37"
								: "var(--dsw-text, #1f2328)",
					opacity: state.key === "revoked" ? 0.55 : 1,
				},
			},
			state.text,
		),
		canRevoke
			? createElement(
					"button",
					{
						style: S.smallLink,
						onClick: onRevoke,
						disabled: busy,
						title: "把这条意见退回未处置：这一章的交工会重新被它拦住",
					},
					"翻案",
				)
			: null,
	);
}

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
		const rel = chapterRel(openChapter);
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
	// 已交工通过的章（纯账本推导，票 14 口径）：章级「交工通过」事件（含最佳范例章那一步）。
	// 过目闸门认的就是同一件事——界面上报的「已完成 X/Y 章」与它同源，两个数字不打架。
	const doneSet = useMemo(
		() => deriveDoneSet(events, goldChapterNo(meta)),
		[events, meta],
	);
	// 「打开」按钮置灰：chapter 文件不在产物清单里就禁用（旧账本/未拉取时 ?? 兜底不误灰）。
	const hasChapterFile = (n) => {
		const files = workFiles ?? [];
		if (files.length === 0) return true;
		return files.some((f) => f.path === chapterRel(n));
	};
	// 「已完成 X/Y 章」＝**闸门口径**（票 14）：服务端下发的 `chapterStatus[].done` 就是过目闸门认的
	// 「这一章算完成了」（两份产物 ＋ 章级交工通过 ＋ 该章无未处置意见）——有它就照它，两个数字必然一致；
	// 老服务端/样张没带 `done` 时退回本地同一判据（章级交工通过事件 + 该章无未处置意见）。
	// ⚠️ 不再按「文件在不在」数（旧口径会把没交工的章也算完成）；章级徽章另用 doneSet（见上），
	// 它要照旧显示「有意见待 AI 修订」这一态。
	const done = rows.filter((row) => {
		const found = (chapterStatus ?? []).find(
			(r) => Number(r.n) === row.n,
		);
		if (typeof found?.done === "boolean") return found.done;
		return doneSet.has(row.n) && !hasPendingReview(pendingReviews, row.n);
	}).length;
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
			"📚 写完整本 · 章节清单",
		),
		createElement(
			"p",
			{ style: { margin: "4px 0 8px", fontSize: "12px", opacity: 0.75 } },
			// 票 10：①「审计」→「检查」（判定三 #8，界面一律说检查）；②判定四③ 原句 117 字压到 90 字内，
			// 删掉与全览条重复的步数解释与「与过目同一口径」这类内部口径说明，保留用户要做的事。
			`每章流程：小助手执笔 → 小助手检查 → AI 最后把关。已完成 ${done}/${rows.length} 章；想细看点「看看这章」，有意见直接写，AI 照改，处置过的意见能翻案。`,
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
			// 票 09（`workbench-transitions/spec.md` §3 热区表「章节卡」行 / 不变量 2）：入口**拆身份**。
			// 原来那一颗「👀 看看这章」随状态换目的地却不换文案（过目态＝就地展开正文，非过目态＝开右栏），
			// 点下去会发生什么只能靠误触学习——判「不合法」。现在两种形态各自只有一个后果、文案自证目的地：
			//   非过目态＝共用那颗「打开」（可见文案「第 N 章 打开」，点它只开右栏，不展开任何东西）；
			//   过目态　＝「▸ 展开第 N 章正文 / ▾ 收起」（点它只换这张卡的内联内容，不开右栏、不发动作）。
			const chapterOpen = reviewMode && openChapter === row.n;
			// 该章已挂的段落级意见（chapter 维度、未撤销）：喂给 GoldReader 标段与两态键。
			const rowOpinions = (pendingReviews ?? []).filter(
				(r) =>
					Number(r.chapter) === Number(row.n) &&
					r.kind != null &&
					r.status !== "revoked",
			);
			// 票 10：该章的**全部**意见（整章意见 + 段落意见），就地列在「写意见」这一区里——
			// 用户读那条意见的地方就能看见它的处置态，已处置的当场能翻案。
			const rowReviews = (pendingReviews ?? []).filter(
				(r) => Number(r.chapter) === Number(row.n),
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
					reviewMode
						? // 过目态：纯展开控件。一个热区只干一件事——只改这一章正文的可见性。
							// 文案照 spec 定的「▸ 展开第 N 章正文 / ▾ 收起」；悬浮提示补一句"不开右栏"。
							createElement(
								"button",
								{
									style: S.smallLink,
									onClick: () => {
										setOpenChapter(chapterOpen ? null : row.n);
										setChapterText(null);
										setChapterError(null);
									},
									disabled: fileMissing,
									title: fileMissing
										? "这一章还没写出来（或文件改名了），暂时看不了"
										: chapterOpen
											? "收起这一章正文（正文就在这张卡里）"
											: "就地展开这一章正文（在这张卡里看，不开右栏）",
								},
								chapterOpen ? "▾ 收起" : `▸ 展开第 ${row.n} 章正文`,
							)
						: // 非过目态：共用那颗「打开」——可见文案「<产物名> 打开」自证目的地（产物名走
							// 「产物名」词表＝「第 N 章」，与事件行行内那颗同形），点它只开右栏。
							createElement(OpenArtifactButton, {
								item: { path: chapterRel(row.n) },
								onOpen: () => onView(row.n),
								label: `${artifactName(chapterRel(row.n))} 打开`,
								disabled: fileMissing,
								title: fileMissing
									? "这一章还没写出来（或文件改名了），暂时看不了"
									: undefined,
								// 这一排按钮照旧左对齐（本件默认 `marginLeft:auto` 是给产物行靠右用的）。
								style: { marginLeft: 0 },
							}),
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
				// 票 10：该章的意见就在「写意见」这一区下面逐条列出来。未处置的（正拦着这章交工）
				// 照旧显示；已处置的显示「已处置 · <how>」+ 同行「翻案」；已作废的显示「已作废」。
				rowReviews.length > 0
					? createElement(
							"div",
							{
								style: {
									marginTop: "6px",
									paddingTop: "4px",
									borderTop: "1px dashed var(--dsw-border, #d0d7de)",
								},
							},
							createElement(
								"p",
								{
									style: {
										margin: "0 0 2px",
										fontSize: "11px",
										opacity: 0.6,
									},
								},
								"你在这一章提的意见：",
							),
							...rowReviews.map((review, index) =>
								createElement(ChapterReviewLine, {
									key:
										typeof review.id === "string" && review.id !== ""
											? review.id
											: `review-${row.n}-${index}`,
									review,
									busy,
									onRevoke: () => {
										if (postAction === undefined) return;
										// 翻案：服务端把这条 status 写回 pending（并清 how），
										// 这一章的交工重新被它拦住。postAction 成功后自带刷新。
										void postAction({
											action: "review-revoke",
											reviewId: review.id,
										});
									},
								}),
							),
						)
					: null,
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
			// 票 14（承诺账 B，来源票 15-Q2 的裁决）：全仓 `writeSnapshot(` 只有四个写点
			// （阶段交办 / 每关首次与修订提案 / 回退前），**没有「每章」写点**；reason 也不是拍板点
			// （阶段交办类写的是「交办「写完整本」之前」）。所以这里改说「关键节点自动存档」＋
			// 「最近一次存档」——机制侧「seq 不再覆盖旧版本」由票 19 落地。
			"📌 关键节点会自动存档，随时能回到最近一次存档；想改更早的决定，展开上面的步清单点那一步，用「定点修改」。",
		),
	);
}

// ── 全书步清单（2026-09-21 用户裁决：左栏过程地图不再需要）────────────────────
// 左栏整栏删掉后，那份步清单搬到焦点区顶部：一条「全书 N 步 · 还剩 M 步」的全览条，
// 点「展开清单」展出按阶段分组的清单。**清单本身与阶段页取同一份四态行**（见下面的
// `stepIcon` / `stepRowText`），只是搬家，不是重做——用户看的是同一件事。
//
// 2026-09-24 票 04（`.scratch/workbench-implementation/issues/04-overview-bar-consumes-steps.md`）：
// 抬头与清单都改吃**步**（`view-rules.stepsOf` / `stepCount`）——一章＝写/审/复核三行、
// 总数 3N+10。旧口径按**分段**数报，一本 17 段的书会说"全书 17 步"，与票 01「一步是什么」
// 的裁决对不上；「还剩 M 步」也随之改口径（旧 `remainingSteps` 数分段，已删——同一件事不许
// 留第二份实现）。
//
// ⚠️ 展开体是**同层的兄弟 div**（不是浮层、也不铺进焦点区滚动流）。旧注释写"浮在浮层里"
// 与代码不符（spec §2 D 勘误 ①）：真判据只有一条——**收起时不渲染清单内容**。
// 它仍然会把下面的内容往下顶（`maxHeight` 约 46vh），这是有意的。

/**
 * 四态行（票 04：全览条清单与阶段页**共用这一份**，不许两屏各写一套）。
 *
 * 出处：`workbench-transitions/spec.md` §2 D「清单与阶段页取**同一份四态行**，不许各写一套」
 * ＋ `CONTEXT.md`「全览条」同一句。四态＝轮到你 / 我正在做 / 已完成 / 还没到：状态词一律经
 * `view-rules.stepWord` 取（工作台状态词只此一份），图标只在这里定义一次。
 *
 * ⚠️ 接线分工（两个 agent 并发改同一个文件，按裁决分家）：**票 04 出这一份**（`chapters-map.js`
 * 的具名导出 + 全览条 `StepList` 用它），**票 05 在 `phase-page.js` 里接线**（它的 `STEP_ICON`
 * 与「标题 + 状态词」两段渲染换成 import 这一个，见 commit `54254b4`）——同一份行，两个调用点。
 *
 * 形态是一串**文字**、不包一层元素：两屏的行都长在真 `<button>` 里，而冒烟测试找按钮的
 * helper 只认按钮的**第一个文本子节点**（spec Testing Decisions 明写），包成元素会让它找不到。
 */
const STEP_ICON = Object.freeze({ done: "·", "waiting-user": "⚡", active: "▶", pending: "○" });

/** 四态图标（没登记的态退回"还没到"的圈，不猜）。 */
export function stepIcon(state) {
	return STEP_ICON[state] ?? STEP_ICON.pending;
}

/**
 * 四态行的可见文字：`图标 步名（状态词）`。
 * 输入是一"行"——`stepsOf` 的一步与阶段页 `phaseSummary.segs` 的一行都带
 * `title`/`status`/`statusWord`，两屏因此共用同一份行，不必各自再拼一遍状态词。
 */
export function stepRowText(row) {
	if (row === null || row === undefined || typeof row !== "object")
		throw new Error("stepRowText 要一行（一步／阶段页的一行），不给空值");
	const word =
		typeof row.statusWord === "string" && row.statusWord !== ""
			? row.statusWord
			: stepWord(row.status);
	return `${stepIcon(row.status)} ${row.title ?? ""}（${word}）`;
}

function stepStyle(isViewed, state) {
	return {
		display: "block",
		width: "100%",
		textAlign: "left",
		padding: "5px 8px",
		margin: "2px 0",
		fontSize: "12px",
		borderRadius: "6px",
		cursor: "pointer",
		fontFamily: "inherit",
		color: "inherit",
		// 「你正在看这一步」优先于状态底色：否则一个 waiting-user 行的金边会盖掉回看高亮
		// （第 4 轮原型实测抓到的排序 bug，别改回去）。
		background: isViewed
			? "var(--dsw-accent-soft, #eef2ff)"
			: state === "active"
				? "var(--dsw-surface, #fff)"
				: state === "waiting-user"
					? "#fff8e6"
					: "transparent",
		opacity: state === "pending" ? 0.45 : state === "done" ? 0.75 : 1,
		border: isViewed
			? "1px solid var(--dsw-text, #1f2328)"
			: state === "waiting-user"
				? "1px solid #e3b341"
				: "1px solid transparent",
	};
}

/** 清单的分组头：「第 N 阶段 · 阶段名」（旧写法是「第 N 期」——票 01 裁决「期」退役）。 */
function GroupHead(props) {
	return createElement(
		"p",
		{
			style: {
				margin: "2px 0 3px",
				fontSize: "11px",
				fontWeight: 700,
				opacity: 0.55,
				letterSpacing: "0.02em",
			},
		},
		Number.isInteger(props.phase)
			? `第 ${props.phase} 阶段 · ${PHASE_UI[props.phase] ?? ""}`
			: // 阶段号认不出的分段（旧 payload 连 kind 都没有）：`stepsOf` 把它们挂在末尾、
				// `phase` 为 null——**不静默丢**，给一个说得出口的组名（票 04）。
				"阶段待定",
	);
}

/** 按阶段分组的步清单（全览条展开体用）：一行一步，四态行与阶段页同源（`stepRowText`）。 */
export function StepList(props) {
	const { steps, browsingKey, onPickStep, onPickPhase } = props;
	const rows = Array.isArray(steps) ? steps : [];
	// 按 `step.phase` 分组；`stepsOf` 的输出已按阶段 1→6 排好，认不出的（null）挂在末尾。
	const groups = [];
	for (const step of rows) {
		const phase = step?.phase ?? null;
		const last = groups[groups.length - 1];
		if (last !== undefined && last.phase === phase) last.rows.push(step);
		else groups.push({ phase, rows: [step] });
	}
	return createElement(
		"div",
		null,
		...groups.map((group) =>
			createElement(
				"div",
				{ key: `g-${group.phase ?? "other"}`, style: { marginBottom: "6px" } },
				createElement(GroupHead, { phase: group.phase }),
				...group.rows.map((step) =>
					createElement(
						"button",
						{
							key: step.key,
							// 全览条只在"现在"那一屏渲染，点任何一行立刻换屏，所以这一圈高亮其实看不到；
							// 仍按「正在看的那一步」算（`browsing` 就是步 key，票 04）。
							style: stepStyle(browsingKey !== null && browsingKey === step.key, step.status),
							// 有段的行交**步 key**（阶段页自己认得出焦点落在哪一步；`viewPhaseOfBrowsing`
							// 也从步反查阶段）；没有段的行（材料准备＝第一步、旧 payload 补出来的章步）走
							// `onPickPhase`——落到那一阶段的清单页，**不是**浏览态（票 04 明写）。
							onClick: () =>
								step.segmentKey === null
									? onPickPhase?.(step.phase)
									: onPickStep?.(step.key),
							title: stepWord(step.status),
						},
						stepRowText(step),
					),
				),
			),
		),
	);
}

/** 焦点区顶部的全览条：全书几步、还剩几步、现在在第几阶段 + 展开清单（兄弟 div，收起即不渲染）。 */
export function ProgressOverview(props) {
	const [open, setOpen] = useState(false);
	const { segments, meta, browsingKey, currentPhase } = props;
	// 票 04：抬头按**步**数（spec §2 D 的 canonical 口径）——只由 `view-rules` 出数，界面不许自己数。
	//   章已排定 →「全书 3N+10 步 · 还剩 M 步」（M=0 时保留旧说法「已全部完成」，那是同一件事的收尾态）；
	//   章未排定 →「已知 N 步 · 章节排定后补齐」（只数结构上已经存在的步，不按默认章数猜）。
	// 另保留「现在在第 N 阶段 · 阶段名」那半句：spec 用户故事 2 要"一眼看出走到第几阶段、还剩几步"。
	const steps = stepsOf({ segments, meta });
	const count = stepCount({ segments, meta });
	const headline = count.chaptersPlanned
		? `全书 ${count.total} 步 · ${count.remaining === 0 ? "已全部完成" : `还剩 ${count.remaining} 步`}`
		: `已知 ${count.known} 步 · 章节排定后补齐`;
	return createElement(
		"div",
		{ style: { marginBottom: "10px" } },
		createElement(
			"div",
			{
				style: {
					border: "1px solid var(--dsw-border, #d0d7de)",
					borderRadius: "10px",
					padding: "8px 10px",
					background: "var(--dsw-bg, #fff)",
				},
			},
			createElement(
				"div",
				{ style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } },
				createElement("strong", { style: { fontSize: "13px" } }, `🗺 ${headline}`),
				createElement(
					"span",
					{ style: { fontSize: "12px", opacity: 0.65 } },
					`现在在第 ${currentPhase ?? 1} 阶段 · ${PHASE_UI[currentPhase ?? 1] ?? ""}`,
				),
				createElement(
					"button",
					{
						style: { ...S.smallLink, marginLeft: "auto" },
						onClick: () => setOpen((v) => !v),
					},
					open ? "收起清单" : "展开清单",
				),
			),
		),
		open
			? createElement(
					"div",
					{
						style: {
							marginTop: "6px",
							border: "1px solid var(--dsw-border, #d0d7de)",
							borderRadius: "10px",
							padding: "10px 12px",
							background: "var(--dsw-bg, #fff)",
							boxShadow: "0 10px 28px rgba(0,0,0,.16)",
							maxHeight: "46vh",
							overflowY: "auto",
							// 两栏：18 行一栏太长，两栏一屏装得下，也不至于铺满整页。
							columns: "2",
							columnGap: "18px",
						},
					},
					createElement(StepList, {
						steps,
						browsingKey,
						onPickStep: props.onPickStep,
						onPickPhase: props.onPickPhase,
					}),
				)
			: null,
	);
}

/**
 * 焦点区底部的常驻小条：跟造书步骤无关、但得一直在的两样。
 *
 * 用户 2026-09-21 裁决「左栏不再要了」时定：这两样做成焦点区底部一条常驻小条
 * （原先挂在左栏底部）。**做小做灰**是 2026-09-20 用户拍板时就定的调子——
 * 「取消这本书」是破坏性操作，不该跟主操作抢眼；点第一下变确认态，第二下才真删。
 *
 * 票 12（`workbench-transitions/spec.md` §3 面 G 的「纯展开收起」格，User Story 40）：
 * 确认态**必须能退回来**——原来第二下只剩"确认删除"一条路，进去就出不来。退路是**另一颗**
 * 按钮（「算了」），不跟确认那颗共用热区：同一颗按钮第二下既当"确认"又当"取消"，就是
 * 「一个热区只干一件事」（`CONTEXT.md`「热区」）的反例。文案取「算了」而不是「取消」——
 * 这条里「取消这本书」本身就是删除，再写一颗「取消」会让人分不清是"取消删除"还是"取消这本书"。
 *
 * ⚠️ 破卷广告**不在这条里**（它是广告，灰字一行就等于没做）：它单独钉在右下角，
 * 见 `SocratopiaAd`。原先把它塞进这一行是个错误——那既看不见、又丢掉了广告的视觉。
 */
export function FocusFooter(props) {
	const { status, onDelete, deleting, busy, bookDir, onCancelDelete } = props;
	return createElement(
		"div",
		{
			style: {
				marginTop: "10px",
				paddingTop: "8px",
				borderTop: "1px solid var(--dsw-border, #d0d7de)",
				display: "flex",
				alignItems: "center",
				gap: "10px",
				flexWrap: "wrap",
				fontSize: "11px",
			},
		},
		createElement(
			"span",
			{ style: { opacity: 0.55 } },
			`书的进度：${status ?? "—"}`,
		),
		bookDir !== null && bookDir !== undefined
			? createElement(
					"span",
					{ style: { opacity: 0.55, wordBreak: "break-all" } },
					`📁 ${bookDir}`,
				)
			: null,
		createElement("span", { style: { flex: 1 } }),
		typeof onDelete === "function"
			? createElement(
					"button",
					{
						style: {
							...S.smallLink,
							fontSize: "11px",
							opacity: deleting === true ? 1 : 0.5,
							...(deleting === true
								? { color: "var(--dsw-danger, #cf222e)" }
								: {}),
						},
						onClick: onDelete,
						disabled: busy === true,
						title: "把这本书移进回收站",
					},
					deleting === true ? "确认取消这本书（进回收站）" : "取消这本书",
				)
			: null,
		// 票 12：确认态的退路（见组件顶部说明）。只在确认态出现、且父级给了回调才渲染；
		// 它只改本地确认态、**不发任何动作**（破坏性动作仍然只有确认那颗发）。
		deleting === true && typeof onCancelDelete === "function"
			? createElement(
					"button",
					{
						style: {
							...S.smallLink,
							fontSize: "11px",
							opacity: 0.6,
						},
						onClick: onCancelDelete,
						disabled: busy === true,
						title: "先不删，回到上一步",
					},
					"算了",
				)
			: null,
	);
}

/**
 * 破卷常驻广告（2026-08-21 需求：造书进程中始终可见）。
 *
 * **它为什么钉在页面底部（焦点区与对话台之间），而不是浮动在内容上**：
 * 左栏删掉后这卡走了两版弯路，用户逐版驳回，最后一句点破了要害——
 *
 *   「广告贴片不随着滚动条移动，它现在会固定的挡住某些字，就很恼火」
 *   「可以挡字，放在页面最下面（dsh 的输入栏上面），这样当用户滚动滚动条时，
 *     被挡住的字会显示出来」
 *
 * 关键区别不在"挡不挡字"，在**被挡住的字有没有机会露出来**：
 *  - 浮在内容上的卡随视口走，压在它下面的字**再怎么滚也滚不出来**（那才叫恼火）；
 *  - 钉在页面底部的横条压住的是"当前滚到那一段"的字，**用户一滚就把它让出来了**。
 *
 * 所以它是焦点区的**兄弟节点**、不参与焦点区的滚动流：既不随内容滚走（永远可见），
 * 又不制造"永远露不出来"的字。恢复原来的渐变视觉，只是从竖卡摊成横条。
 */
export function SocratopiaAd() {
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
	return createElement(
		"a",
		{
			href: "https://www.socratopia.app/r/SCR-FEJXMQ",
			target: "_blank",
			rel: "noopener noreferrer",
			// 焦点区的兄弟节点：固定在它下面（对话台上面），不参与滚动流、不浮动。
			style: {
				flexShrink: 0,
				display: "flex",
				alignItems: "center",
				gap: "10px",
				flexWrap: "wrap",
				padding: "7px 14px",
				background:
					"linear-gradient(135deg, #4f6ef7 0%, #7a5cff 55%, #c04df7 100%)",
				color: "#ffffff",
				fontSize: "11px",
				lineHeight: 1.5,
				textDecoration: "none",
				borderTop: "1px solid rgba(255, 255, 255, 0.25)",
			},
		},
		createElement("span", { style: { fontSize: "15px" } }, "📚"),
		createElement("strong", { style: { fontSize: "12px" } }, "【破卷】"),
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
		createElement("span", null, "把造好的书交给【破卷】，当教材来学"),
		createElement(
			"span",
			{ style: { opacity: 0.85 } },
			"3A 沉浸感 · 3 倍学习效率",
		),
		createElement(
			"span",
			{ style: { marginLeft: "auto", fontSize: "10px" } },
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
	);
}

// ── 机器产物的人读折叠：knowledge-map.json 的**唯一**人读形态 ─────────────────
// ⚠️ 有正文的产物（章节/报告/方案/成品）一律走 DSH 右栏预览，不经这里（ADR-0010 决策 2）；
// 这里只剩 knowledge-map.json 这一条：机器产物，人读形态是**就地折叠清单**——
// 阶段页第 2 阶段的 `KnowledgeMapBlock` 与源探查确认卡都调它，别让同一样东西两处两种读法。
// （2026-09-21：原来还有 `FileViewer` 那个查看壳的第二条路，它不在渲染路径上，已随旧单卡删除。）

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

