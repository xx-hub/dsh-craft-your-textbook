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
	isReviewPending,
	reviewState,
	reviewText,
	contextOccupancySentence,
} from "./rules.js";
import { GoldReader } from "./gold-table.js";
// 界面用词表（批 2）：章节清单按 seg.key 取界面词，不再直接渲染服务端账本 label。
// ⚠️ 候选 06：步模型的四态词 / 分组 / 计数 / rowText **不再**从这里取——它们住在
// `stage-step-model.js` 的 projection 里，行自带 `rowText` / `detailLines` / `target`。
// 本 module 只保留章节卡要的 `PHASE_UI` / `artifactName` / `workEntryAction`。
import { PHASE_UI, artifactName, chapterAuditFreshnessText, workEntryAction } from "./view-rules.js";
// 票 09：章节卡非过目态那颗「打开」＝票 02 那颗共用按钮，住中性模块（阶段页再导出它）。
// ⚠️ 不许从 `./phase-page.js` import：那个文件已经 import 本文件（`foldKnowledgeMap`），
// 反向 import 会成环（`chapters-map → phase-page → chapters-map`）。
import { OpenArtifactButton } from "./open-artifact-button.js";
import { goldChapterNo } from "../domain-rules.js";

/**
 * 章号 → 章节正文路径（两位序号是契约，与 `view-rules` 里那份同一形状）。
 * 三处调用点（拉正文 / 「文件在不在产物清单里」的置灰判据 / 「打开」按钮的产物名）共用一份，
 * 别各拼一遍。
 */
const chapterRel = (n) => `work/chapter-${String(n).padStart(2, "0")}.md`;

// 票 27 · P38 ①：章节卡那颗「打开」按态分——**没定稿的章在按钮自己身上说清这一点**。
//
// 为什么不在共用件 `open-artifact-button.js` 里做：那个是**中性件**（阶段页三处 ＋ 事件行行内
// ＋ 章节卡共用，见该文件 :4-13），「这一章定没定稿」对它毫无意义。所以分态留在**调用点**，
// 只给章节卡这一处传自己的 `label` / `title`。
//
// ⚠️ 措辞只此一份（CONTEXT.md「界面用词表」：界面上的字只此一份）：
//   · 标签给**状态**（「未定稿」四个字），悬浮提示给**后果**（「你读到的东西还会被变」）——
//     **不复述 AI 在干嘛**（「正在检查」「正在复核」这类说法正是今天那行章卡小徽章失效的原因：
//     它说的是 AI 的流程视角，不是你读到的东西会不会变）。
//   · **不与 `view-rules.js` 那个 `freshness === "stale"` 的「旧稿」混用**：那个判的是
//     「检查记录 vs 正文」的新旧，本条判的是「这一章算不算完」，**是两件事**（票面 :113-114）。
//   · 「不保证是最后的样子」是**留了余地的说法**（spec.md:195 不变量 12「文案不得承诺没有兑现
//     机制的能力」）：`done === false` 的确会被继续改，但本票**不承诺**它一定改、也不编改法。
const DRAFT_QUALIFIER = "（未定稿）";

/** 未定稿那一档的悬浮提示：说清「读到的东西还会被变」这一层。 */
const draftOpenTitle = (name) =>
	`在右栏打开「${name}」；这一章还没定稿，AI 还可能再改它，现在读到的内容不保证是最后的样子`;


// ── 章节清单卡（铺章阶段 · 人+AI 协同抽查面板） ───────────────────────────────

/**
/**
 * AI 声称「已按抽查意见修订」的那一行账，按章号归拢（票 10 · P16/P47 落点①）。
 *
 * **只读账本，不改状态**：`project.json` 里那条意见的 `status` 仍然是 `pending`、仍然红字拦着
 * 这一章交工——「不搞交工自动全销号」是已拍板的设计（不信任 AI 的自报），一个字都不松。
 * 这里只是让那句人话在用户读那条意见的地方**看得见**（§十一 · 11.5 ③ 那一行账的界面回声）。
 *
 * 落账格式由规则正文钉死（`第 N 章：已按抽查意见修订（做了 X、Y、Z）`），所以这里按
 * 「含这句话 ＋ 能认出第几章」两条取；认不出的（AI 写得不合规）不硬套到任何一章上。
 * 事件按 seq 递增，后来的覆盖先前的 = 留下**最近一条**。
 */
function reviewProgressByChapter(events) {
	const byChapter = new Map();
	for (const event of events ?? []) {
		if (event?.type !== "textbook/progress") continue;
		const text = `${event.data?.label ?? ""}　${event.data?.detail ?? ""}`.trim();
		if (!text.includes("已按抽查意见修订")) continue;
		const match = /第\s*(\d+)\s*章/.exec(text);
		if (match === null) continue;
		byChapter.set(Number(match[1]), text.replace(/\s+/g, " "));
	}
	return byChapter;
}

/**
 * 一条意见在章节卡上的一行（票 10：本程对 `src/ui/` 的**唯一**开口；票 09 补了反方向的出口）。
 *
 * 用户在自己读那条意见的地方就能看见它被怎么处置了：`pending` 照旧显示（它正拦着这一章交工）、
 * 并给一个**撤回**按钮；`applied` 显示成「已处置 · <how>」并在**同一行**给一个「翻案」按钮
 * （就地，不另起界面）；`revoked` 显示「已撤回」。两条出口方向相反：
 *   撤回＝把这条**作废**（服务端 `gold-opinion-revoke` 置 `revoked`：不再发给 AI、不再拦交工）；
 *   翻案＝把这条退回未处置（服务端 `review-revoke` 把 `status` 写回 `pending` 并清掉 `how`，
 *          该章交工因此重新被拦）——见 `.scratch/dead-gates/issues/10-*.md`。
 *
 * 票 10 · P16/P47 落点①：处置态**一个字不改**（红字「还没处置 · 这一章交工前要先处置它」照旧），
 * 只在它旁边补一句**进展说明**——账上那行「AI 说它改好了」原话摆在这儿，用户过目之前先看得见
 * AI 自称做了什么。⚠️ 这一句**不是第四个状态词**，也不改徽章的三词上限（`chapterBadge` 原样）；
 * 它是意见行上的进展说明，与 `已处置 · <how>` 同一形状（状态 ＋ AI 的原话）。
 */
function ChapterReviewLine(props) {
	const { review, busy, onRevoke, progressText } = props;
	const state = reviewState(review);
	const text = reviewText(review);
	// 两个动作都按 id 点名（老账本里没写 id 的意见给不出按钮），不给一个点了没反应（或点了 404）
	// 的死按钮。`revocable` 只答「有没有出口」，**出口是哪个动作按 `state.key` 分派**。
	const canRevoke =
		state.revocable && typeof review?.id === "string" && review.id !== "";
	const withdrawing = state.key === "pending";
	// 进展说明只挂在**还没处置**那一条上：已处置的 `how` 本身就是那句话，已撤回的更不该提。
	// 用词走票 09 收口后的正名（`CONTEXT.md`「撤回（意见）」词条）；那张票的机械验收是
	// 全 `src/` 搜旧写法零命中，所以这里连注释里也不许把它写出来。
	const showProgress =
		state.key === "pending" && typeof progressText === "string" && progressText !== "";
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
								: "var(--dsw-alias-label-primary)",
					opacity: state.key === "revoked" ? 0.55 : 1,
				},
			},
			state.text,
		),
		showProgress
			? createElement(
					"span",
					{
						style: {
							flex: "1 1 100%",
							marginLeft: "14px",
							color: "var(--dsw-alias-label-primary)",
							opacity: 0.75,
						},
					},
					`AI 说它改好了，等你确认：${progressText}（这句是 AI 自述，你点头才销号）`,
				)
			: null,
		canRevoke
			? createElement(
					"button",
					{
						style: S.smallLink,
						onClick: () => onRevoke(state.key, review),
						disabled: busy,
						title: withdrawing
							? "撤回这条意见：AI 不再照它改，这一章也不再被它拦着交工（不回滚已经改好的正文）"
							: "把这条意见退回未处置：这一章的交工会重新被它拦住",
					},
					withdrawing ? "撤回" : "翻案",
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
		chapterSegments,
		project,
		session,
		// 票 28：主 AI 上下文占用百分比（null = 宿主读不到，界面不显示这一格）。
		contextPercent,
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
	// 票 30①：内联展开**不再只挂在 reviewMode 上**。
	// 过目态下提一条意见，服务端会把书从「全章过目」翻回「我正在做」——那是**正确**的状态迁移
	// （过目态提意见确实要交办修订），本票不去修它。原先的投影却是粗暴的：`reviewMode` 一变 false，
	// 13 张章卡**同时**收起，用户正在读的那一章当场合上，看起来像自己点坏了。
	// 解耦办法只解耦**这一章**：把刚提交意见的那一章钉在展开态；其余卡照旧按 `reviewMode` 收。
	const [keepOpenChapter, setKeepOpenChapter] = useState(null);
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
	// 票 10 · P16/P47 落点①：AI 自称「已按抽查意见修订」的那一行账，按章号归拢。
	// 它只让那句人话在意见行上看得见——**不销号、不改任何状态**（界面上那条红字照旧）。
	const reviewProgress = useMemo(() => reviewProgressByChapter(events), [events]);
	// 「打开」按钮置灰：chapter 文件不在产物清单里就禁用（旧账本/未拉取时 ?? 兜底不误灰）。
	const hasChapterFile = (n) => {
		const files = workFiles ?? [];
		if (files.length === 0) return true;
		return files.some((f) => f.path === chapterRel(n));
	};
	// 「这一章算不算完成」＝**闸门口径**（票 14）：服务端下发的 `chapterStatus[].done` 就是过目闸门认的
	// 「这一章算完成了」（两份产物 ＋ 章级交工通过 ＋ 该章无未处置意见）——有它就照它，两个数字必然一致；
	// 老服务端/样张没带 `done` 时退回本地同一判据（章级交工通过事件 + 该章无未处置意见）。
	// ⚠️ 不再按「文件在不在」数（旧口径会把没交工的章也算完成）；章级徽章另用 doneSet（见上），
	// 它要照旧显示「有意见待 AI 修订」这一态。
	//
	// 票 27：这一份判据**两个出口**——①「已完成 X/Y 章」那个计数；②章节卡那颗「打开」的
	// 「（未定稿）」后缀。原先这里只有 `.filter(...).length` 一个计数出口，票 27 要按章问
	// 「这一章是不是定稿」，所以**先把判据提成逐章谓词，再让计数从它派生**——
	// **不许两处各写一份**：两份判据一旦分叉，「已完成 3/13 章」和 13 颗按钮上的
	// 「（未定稿）」就会互相说假话，而且那种分叉没有任何既有测试抓得到（票面 :74-76 逐字警告：
	// 这条布局/文案改动不撞 `test-layout-anchors.mjs`，也没有别的回归网）。
	const chapterIsDone = (n) => {
		const found = (chapterStatus ?? []).find((r) => Number(r.n) === n);
		if (typeof found?.done === "boolean") return found.done;
		return doneSet.has(n) && !hasPendingReview(pendingReviews, n);
	};
	const done = rows.filter((row) => chapterIsDone(row.n)).length;
	const prepared = (chapterStatus ?? []).length > 0;
	// 票 30③：进度数字倒退**要有解释**。过目态提一条意见后「已完成 13/13」会退回「12/13」，
	// 那个 1 差在哪、是不是白干，屏上不点名字就说不出来。判据**读已有的那一份**
	// （`isReviewPending`，与章徽章、「已完成 X/Y 章」、交工拦截同口径），不另写一份算法。
	const pendingByChapter = rows
		.filter((row) => hasPendingReview(pendingReviews, row.n))
		.map((row) => ({
			n: row.n,
			count: (pendingReviews ?? []).filter(
				(review) =>
					Number(review.chapter) === Number(row.n) && isReviewPending(review),
			).length,
		}));
	const pendingExplain =
		pendingByChapter.length === 0
			? ""
			: `（${pendingByChapter
					.map((item) => `第 ${item.n} 章有 ${item.count} 条意见待修订`)
					.join("；")}）`;

	// 票 28：主 AI 上下文占用（走查 P46）——「计量」，**不是第四个状态词**：
	// 它不进 chapterBadge()、也不进任何返回状态词的函数（CONTEXT.md 三词上限不动）。
	// 读不到（contextPercent 不是有限数）时这里是空串，那一格**整句不出现**，不显示 0%。
	const contextNote = contextOccupancySentence(contextPercent);
	const contextNoteText = contextNote === "" ? "" : `（${contextNote}）`;

	const sendReview = (n) => {
		if (comment.trim() === "") return;
		void onReview(n, comment.trim()).then(() => {
			setReviewing(null);
			setComment("");
			// 票 30①：章卡「✍️ 写意见」这一条入账路径也要把这一章钉在展开态——
			// 段落三键那一支已经做了，只改一条等于没改全。
			setKeepOpenChapter(n);
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
							background: "var(--dsw-alias-state-business-tertiary)",
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
			// 两处并排是**两次独立票据**落在同一句话上，不是二选一：pendingExplain 解释的是
			// 紧邻其左的那个「已完成 N/M 章」为什么会倒退（票 30），contextNoteText 是一个独立计量
			// （票 28，不占状态词位）。两段各自要么是空串、要么是自带括号的一整段，串起来不会出现
			// 半截括号，也不需要第三种分隔符。
			`每章流程：小助手执笔 → 小助手检查 → AI 最后把关。已完成 ${done}/${rows.length} 章${pendingExplain}${contextNoteText}；想细看点「看看这章」，有意见直接写，AI 照改，处置过的意见能翻案。`,
		),
		// 票 25（走查 P20）：这一块是进度叙述的**主出口**（第 5 阶段）——同一段叙述曾经在这里
		// 与顶部横幅各出一遍，一屏渲染两遍。既定分工：叙述在主卡（就近可读）出全文，
		// 横幅只出状态词那半截（见 `panels.js` 的 `StatusStrip`）。
		// ⚠️ 不搬进折叠区、不截断、不改写原文——长叙述恰恰要就地看得见。
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
							background: "var(--dsw-alias-state-business-tertiary)",
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
			// 票 30①：刚提交过意见的那一章（`keepOpenChapter`）**不随 reviewMode 一起收**——
			// 其余卡照旧按 `reviewMode` 收（13 张卡全留着展开反而没法看）。
			const chapterOpen =
				(reviewMode || keepOpenChapter === row.n) && openChapter === row.n;
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
				// 票 10 · P47 落点②：这一章的检查记录是不是**比正文旧**（旧稿）。措辞与步清单那份
			// `artifactFactText` 同源（同一个出口、同一个判据）；服务端没下发、或这一章还没写
			// 检查记录 → 空串，不编一句。
			const auditFreshness = chapterAuditFreshnessText(chapterSegments, row.n);
		return createElement(
				"div",
				{
					key: row.n,
					style: {
						margin: "6px 0",
						padding: "8px 10px",
						background: "var(--dsw-alias-bg-layer-1)",
						borderRadius: "8px",
						border: "1px solid var(--dsw-alias-border-l2)",
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
					auditFreshness !== ""
					? createElement(
						"div",
						{ style: { margin: "2px 0 0", fontSize: "11px", opacity: 0.6 } },
						auditFreshness,
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
										// 票 30①：用户自己动了展开态，那枚「钉在展开态」的钉子就作废
										// （否则点开另一章会同时留下两章展开）。
										setKeepOpenChapter(null);
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
							// 票 27 · P38 ①：没定稿的章那颗「打开」**自己说清这一点**——标签加「（未定稿）」、
							// 悬浮提示说清后果（读到的东西还会被变）；**定稿的章逐字保持原样，一个字不加**。
							// ⚠️ 判据取 `chapterIsDone`（与上面「已完成 X/Y 章」**同一份**，不另写一条）。
							// ⚠️ `fileMissing` 那一支优先级更高：文件都还没出来，谈不上定没定稿，保持原样。
							// ⚠️ `open-artifact-button.js` 的默认值一个字不动（中性件，阶段页与事件行共用）。
							createElement(OpenArtifactButton, {
								item: { path: chapterRel(row.n) },
								onOpen: () => onView(row.n),
								label: chapterIsDone(row.n)
									? `${artifactName(chapterRel(row.n))} 打开`
									: `${artifactName(chapterRel(row.n))} 打开${DRAFT_QUALIFIER}`,
								disabled: fileMissing,
								title: fileMissing
									? "这一章还没写出来（或文件改名了），暂时看不了"
									: chapterIsDone(row.n)
										? undefined
										: draftOpenTitle(artifactName(chapterRel(row.n))),
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
									// 票 10 · P13：同一排里可点性必须一致（CONTEXT.md「热区」第 2 条）。旁边那颗「打开」
									// 对没写出来的章已经 disabled，这颗原来 13 章全 enabled——于是能给还没写出来的那一章
									// 提意见，承诺的兑现时点根本不存在（账本照收）。置灰判据与悬浮提示都与「打开」同源。
									disabled: fileMissing,
									title: fileMissing
										? "这一章还没写出来（或文件改名了），暂时提不了意见"
										: open
											? "收起这一章的意见输入框"
											: "给这一章写一条抽查意见，AI 照改后由你确认",
								},
								open ? "收起" : "✍️ 写意见",
							)
						: null,
				),
				// 票 10：该章的意见就在「写意见」这一区下面逐条列出来。未处置的（正拦着这章交工）
				// 照旧显示、并给「撤回」；已处置的显示「已处置 · <how>」+ 同行「翻案」；
				// 已撤回的显示「已撤回」（票 09 统一措辞，正名取 `rules.js` 的 `REVIEW_REVOKED_TEXT`）。
				rowReviews.length > 0
					? createElement(
							"div",
							{
								style: {
									marginTop: "6px",
									paddingTop: "4px",
									borderTop: "1px dashed var(--dsw-alias-border-l2)",
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
									progressText: reviewProgress.get(row.n) ?? null,
									onRevoke: (key, review) => {
										if (postAction === undefined) return;
										// 票 09：按处置态分派两个**方向相反**的动作。两条都复用契约目录里
										// 已有的名字（`gold-opinion-revoke` / `review-revoke`，都已是工作台可调用），
										// **不新增动作名**——新增会让契约动作目录那几处写死的计数四处红。
										if (key === "pending") {
											// 撤回（还没处置 → 作废）：置 `revoked`。下游三处过滤都认这个态——
											// 不再随交办发给 AI、不再拦这一章交工、不再当段落标记。
											void postAction({
												action: "gold-opinion-revoke",
												id: review.id,
											});
											return;
										}
										// 翻案（已处置 → 还没处置）：服务端把这条 status 写回 pending（并清 how），
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
									borderTop: "1px dashed var(--dsw-alias-border-l2)",
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
												"div",
												{
													style: {
														margin: "0 0 6px",
														fontSize: "12px",
														opacity: 0.75,
														display: "flex",
														alignItems: "baseline",
														gap: "8px",
														flexWrap: "wrap",
													},
												},
												`第 ${row.n} 章正文（鼠标停在哪一段，那段右侧亮出 😕🗑✏️ 提意见）：`,
												// 票 30①：被钉住的那一章此刻不是过目态，卡片上那颗按钮已经是「打开」
												// （它只开右栏），于是**收起**这条路上没有控件了。补这一颗：
												// 身份＝纯展开收起，不发动作、不开右栏，与「打开」各干一件事。
												!reviewMode
													? createElement(
															"button",
															{
																style: S.smallLink,
																onClick: () => {
																	setOpenChapter(null);
																	setKeepOpenChapter(null);
																	setChapterText(null);
																	setChapterError(null);
																},
																disabled: fileMissing,
																title: "收起这一章正文（正文就在这张卡里）",
															},
															"▾ 收起这一章正文",
														)
													: null,
											),
											createElement(GoldReader, {
												text: shownText,
												opinions: rowOpinions,
												busy,
												onOpinion: (kind, wish, para, hint) => {
													if (postAction === undefined) return;
													// 票 30①：段落三键这一条入账路径同样把这一章钉在展开态。
													setKeepOpenChapter(row.n);
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
			// 票 14（承诺账 B，来源票 15-Q2 的裁决）：这里原来只能说「关键节点自动存档」＋「最近一次存档」，
			// 因为全仓 `writeSnapshot(` 只有四个写点（阶段交办 / 每关首次与修订提案 / 回退前），
			// **没有「每章」写点**；reason 也不是拍板点（阶段交办类写的是「交办「写完整本」之前」）。
			// 票 05 / P36（2026-09-27 用户拍板「逐章交工各存一次」）：逐章交工成功路径补上了第五个写点
			// （`chapters.js` 的 `writeSnapshot(project, '交工「第 N 章《标题》」之后')`），于是「最近一次存档」
			// 在写完整本那段时间里**不再停在整段之前**，而是停在上一章交完的地方——这句承诺因此第一次说得准，
			// 也照票面记档把「随时能回到最近一次存档」原样留着（密度已修好，不再欠账）。
			// 🚫 不在这句里加「最近一次存档：xx 时间」：用户 2026-09-27 明确**没选**显示存档时间与数量。
			"📌 每交完一章、每次交办或拍板前都会自动存档；随时能回到最近一次存档——写完整本那段时间里，它就停在上一章交完的地方。想改更早的决定，展开上面的步清单点那一步，用「定点修改」。",
		),
	);
}

// ── 全书步清单（2026-09-21 用户裁决：左栏过程地图不再需要）────────────────────
// 左栏整栏删掉后，那份步清单搬到焦点区顶部：一条「全书 N 步 · 还剩 M 步」的全览条，
// 点「展开清单」展出按阶段分组的清单。
//
// ⚠️ 候选 06（`.scratch/stage-step-model/`）：抬头与清单都改吃 **`stage-step-model` 的
// `project({kind:"overview"})` projection**——分组、四态行（`row.rowText`）、计数、headline
// 全部由模型一次推导；本 module **不再**自己按 `phase` 重新分组、不再各拼四态行、不再调
// `stepsOf` / `stepCount`（那两份实现已随 06 迁进模型并从 `view-rules` 退役）。
// `stepIcon` / `stepRowText` 这两份旧具名件也随之移进模型（行自带 `rowText`），本文件不再导出。
//
// ⚠️ 展开体是**同层的兄弟 div**（不是浮层、也不铺进焦点区滚动流）。真判据只有一条——**收起时
// 不渲染清单内容**。它仍然会把下面的内容往下顶（`maxHeight` 约 46vh），这是有意的。

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
			? "var(--dsw-alias-state-business-tertiary)"
			: state === "active"
				? "var(--dsw-alias-bg-layer-1)"
				: state === "waiting-user"
					// 「等用户」这一档的浅金底与金边原来也是写死的浅色（票 19 路线 A 一并接宿主，
					// 否则同一个函数里两个浅色钉子，深色下仍然不可读）。取值见
					// docs/reference/dsh-theme-token-contracts.md §2。
					? "var(--dsw-alias-state-warn-tertiary)"
					: "transparent",
		opacity: state === "pending" ? 0.45 : state === "done" ? 0.75 : 1,
		border: isViewed
			? "1px solid var(--dsw-alias-label-primary)"
			: state === "waiting-user"
				? "1px solid var(--dsw-alias-state-warn-secondary)"
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
			: // 阶段号认不出的分段（旧 payload 连 kind 都没有）：模型把它们挂在末尾、
				// `phase` 为 null——**不静默丢**，给一个说得出口的组名（票 04）。
				"阶段待定",
	);
}

/**
 * 按阶段分组的步清单（全览条展开体用）：一行一步，四态行与阶段页同源。
 *
 * ⚠️ 候选 06：`groups` 直接来自 `project({kind:"overview"})`——**本 module 不再按 `phase` 重新
 * 分组**（模型才是分组的唯一拥有者）。行自带 `rowText`（四态行唯一出处）、`detailLines`、
 * `target`（导航目标）。
 */
export function StepList(props) {
	const { groups, browsingKey, onPickStep, onPickPhase } = props;
	const list = Array.isArray(groups) ? groups : [];
	return createElement(
		"div",
		null,
		...list.map((group) =>
			createElement(
				"div",
				{ key: `g-${group.phase ?? "other"}`, style: { marginBottom: "6px" } },
				createElement(GroupHead, { phase: group.phase }),
				...group.rows.map((row) =>
					createElement(
						"button",
						{
							key: row.key,
							// 全览条只在"现在"那一屏渲染，点任何一行立刻换屏，所以这一圈高亮其实看不到；
							// 仍按「正在看的那一步」算（`browsing` 就是步 key，票 04）。
							style: stepStyle(browsingKey !== null && browsingKey === row.key, row.status),
							// 行自带 `target`（候选 06）：`step` 目标交**步 key**（阶段页自己认得出焦点
							// 落在哪一步；工作台焦点也从步反查阶段）；`phase` 目标（材料准备＝第一步、旧
							// payload 补出来的章步）走 `onPickPhase`——落到那一阶段的清单页，**不是**
							// 浏览态（票 04 明写）。UI 不再看 `segmentKey` / `MATERIAL_STEP_KEY`。
							onClick: () =>
								row.target?.kind === "step"
									? onPickStep?.(row.target.ref)
									: onPickPhase?.(row.target?.phase ?? row.phase),
							title: row.statusWord,
						},
						row.rowText,
						...(row.detailLines ?? []).map((line, index) =>
							createElement(
								"span",
								{
									key: `detail-${index}`,
									style: {
										display: "block",
										marginTop: "2px",
										fontSize: "11px",
										lineHeight: "1.35",
										fontWeight: "normal",
										opacity: 0.72,
									},
								},
								line,
							),
						),
					),
				),
			),
		),
	);
}

/**
 * 焦点区顶部的全览条：全书几步、还剩几步、现在在第几阶段 + 展开清单（兄弟 div，收起即不渲染）。
 *
 * ⚠️ 候选 06：本组件现在只吃 **`projector`**（由 WorkbenchView 用 useMemo 建一次传入）——
 * 抬头、currentPhaseText、分组清单全部来自 `project({kind:"overview"})`。props 从「传
 * segments/meta 自己推导」迁为「传 projector」；导出名与用户可见行为不变。
 */
export function ProgressOverview(props) {
	const [open, setOpen] = useState(false);
	const { projector, browsingKey, onPickStep, onPickPhase } = props;
	// 票 04 + 候选 06：抬头按**步**数、分组、每行四态——全部由模型一次推导，界面不许自己数/自己分。
	//   headline：`全书 3N+10 步 · 还剩 M 步`（M=0 →「已全部完成」）/ `已知 N 步 · 章节排定后补齐`。
	//   currentPhaseText：`现在在第 N 阶段 · 阶段名`（spec 用户故事 2）。
	const overview = projector.project({ kind: "overview" });
	return createElement(
		"div",
		{ style: { marginBottom: "10px" } },
		createElement(
			"div",
			{
				style: {
					border: "1px solid var(--dsw-alias-border-l2)",
					borderRadius: "10px",
					padding: "8px 10px",
					background: "var(--dsw-alias-bg-base)",
				},
			},
			createElement(
				"div",
				{ style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } },
				createElement("strong", { style: { fontSize: "13px" } }, `🗺 ${overview.headline}`),
				createElement(
					"span",
					{ style: { fontSize: "12px", opacity: 0.65 } },
					overview.currentPhaseText,
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
							border: "1px solid var(--dsw-alias-border-l2)",
							borderRadius: "10px",
							padding: "10px 12px",
							background: "var(--dsw-alias-bg-base)",
							boxShadow: "0 10px 28px rgba(0,0,0,.16)",
							maxHeight: "46vh",
							overflowY: "auto",
							// 两栏：18 行一栏太长，两栏一屏装得下，也不至于铺满整页。
							columns: "2",
							columnGap: "18px",
						},
					},
					createElement(StepList, {
						groups: overview.groups,
						browsingKey,
						onPickStep,
						onPickPhase,
					}),
				)
			: null,
	);
}

// ── 右栏挤压时的一句提示（票 26 · P27 ＋ P37，2026-09-27 用户拍板：只做那一句提示）─────
//
// 病：宿主右栏一开，主区从 990px 塌到 414px（1280 视口：77% → 32%），**没有任何地方告诉用户
// 「收起右栏能让这里宽一倍」**——那颗按钮就在顶栏（走查实测 x=2520,y=11，标签随状态在
// 「打开右侧边栏」↔「收起右侧边栏」之间切换）。2K 视口下同一颗按钮让主区 1110 → 2270，
// 行也顺带变短（同一颗按钮也是「正文太宽」的解药——票 26 记档：两层一起说，但**不许新造第二句**）。
//
// ⚠️ **布局一个字不动**：走查 `:656` 那个 `min-width` 方案已被作者自己在 `:662-664` 撤回，
// 本票只加文案：不引入 min-width、不引覆盖式浮层、不碰任何宿主布局属性。
//
// ⚠️ **热区身份**（CONTEXT「热区」八个合法动作值）：这是**纯提示**——一个 `<p>`，不可点、
// 不发动作、不换屏、不开文件，所以**它根本不是一个热区**，也就没有「一个热区两个身份」的问题。
// 🚫 不许把它做成整块热区去替用户点那颗宿主按钮，也**不许新造一个收起动作**（收起那颗按钮是
// 宿主的，本票只指路）。

/** 主区窄于此（px）就提一句。真机数：1280 右栏开着 w≈414 / 收起 w≈990；2K 开 w≈1110 / 收 w≈2270。 */
export const NARROW_MAIN_WIDTH = 700;

/** 主区右边缘离视口右边这么远（px）＝右边被别的东西占着（＝右栏开着）。 */
export const SIDEBAR_OPEN_RIGHT_GAP = 64;

/** 那一句提示（纯提示，不点）。含「收起右栏」这个可行动的说法，也点名那颗按钮在顶栏。 */
export const NARROW_MAIN_HINT_TEXT =
	"👉 正文区太窄了。点顶栏那颗「收起右侧边栏」（收起右栏），这里能宽一倍，正文行也不会太长。";

/**
 * 判据（纯函数，可测）：主区是不是被右栏挤窄了。
 *
 * 两个量都来自**主区自己**的盒子（工作台根容器），不读宿主 DOM、不查宿主状态：
 *   · `mainWidth` —— 主区宽度；量不到（页签没激活、盒子还没长出来）一律**不显示**，不猜。
 *   · `mainRightGap` —— 主区右边缘到视口右边的距离：右栏开着时右边被占一大块（真机 586 / 1170px），
 *     收起时主区一路顶到视口右边（真机只剩 ~10px）。用它把「右栏开着」这一条落实了，
 *     免得窗口本来就窄、右栏没开时也冒出一句指错方向的提示。
 *
 * @param {number|null|undefined} mainWidth    主区宽度（px）
 * @param {number|null|undefined} mainRightGap 主区右边缘到视口右边的距离（px）
 * @returns {boolean} 该不该显示这一句
 */
export function narrowMainHintShown(mainWidth, mainRightGap) {
	if (!Number.isFinite(mainWidth) || mainWidth <= 0) return false;
	if (!Number.isFinite(mainRightGap) || mainRightGap < SIDEBAR_OPEN_RIGHT_GAP) return false;
	return mainWidth < NARROW_MAIN_WIDTH;
}

/** 提示本体：不满足条件就**什么都不渲染**（收起右栏后它自己消失，且不留占位的一行）。 */
export function NarrowMainHint(props) {
	const { mainWidth, mainRightGap } = props ?? {};
	if (!narrowMainHintShown(mainWidth, mainRightGap)) return null;
	return createElement(
		"p",
		{
			style: {
				margin: "0 0 8px",
				padding: "6px 10px",
				fontSize: "12px",
				lineHeight: "1.5",
				borderRadius: "8px",
				border: "1px solid var(--dsw-alias-border-l2)",
				background: "var(--dsw-alias-bg-base)",
				opacity: 0.85,
			},
		},
		NARROW_MAIN_HINT_TEXT,
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
	const { status, onDelete, deleting, busy, bookDir, onCancelDelete, onOpenProcessLog } = props;
	return createElement(
		"div",
		{
			style: {
				marginTop: "10px",
				paddingTop: "8px",
				borderTop: "1px solid var(--dsw-alias-border-l2)",
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
		// 票 workbench-transitions/24（ADR-0015 决策 2）：《过程记录.md》判成「有正文的产物」，
		// 入口摆在这条**常驻小条**上——它是全局产物、不属任何一步，所以不进任何一步的文件清单。
		// 走父级给的同一个打开回调（→ DSH 右栏预览、只读），小条因此从「状态 + 危险操作」
		// 变成「状态 + 只读入口 + 危险操作」，这代价 ADR-0015 有意接受。
		typeof onOpenProcessLog === "function"
			? createElement(
					"button",
					{
						style: { ...S.smallLink, fontSize: "11px", opacity: 0.55 },
						onClick: onOpenProcessLog,
						title: "在右栏查看「过程记录」（这一本书从建档到现在的流水账，只读）",
					},
					"过程记录",
				)
			: null,
		typeof onDelete === "function"
			? createElement(
					"button",
					{
						style: {
							...S.smallLink,
							fontSize: "11px",
							opacity: deleting === true ? 1 : 0.5,
							...(deleting === true
								? { color: "var(--dsw-alias-state-error-primary)" }
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
 *
 * ── 文案与它的**一行宽度预算**（2026-09-29 改）────────────────────────────────
 * 改成「【线团造书工作台】是【破卷】的衍生项目 · 3A 游戏级沉浸 · 三倍学习效率」。
 * 两处是**算出来的**、不是偏好：
 *  - 预算 = 根容器 `maxWidth`（`--dsh-chat-content-width` + 20，宿主 clamp 在 [680, 920]）
 *    − 10px 滚动条槽 − 28px 横条内边距 ⇒ 最窄档可用 ≈ **662px**。上一版实测 ≈690px，
 *    **已经会在最窄档折行**（折行 +17px 垂直空间，正是 8px 遮挡那条票要守的东西）；
 *    这一版 ≈647px，顺手把它让回来了。
 *  - 「把造好的书交给【破卷】，当教材来学」（16 字 ≈176px）被砍掉，是为了让**全称**
 *    进得来。全称是本项目的中文名（页签标题仍只写「造书工作台」），不进横条就等于
 *    贴片仍在替一个匿名项目打广告。那个"交给它当教材"的动作没丢：它还在**向导卡**
 *    （`WizardCard`「把造好的书交给【破卷】」，`event-cards.js`）与**交付卡**
 *    （`DeliveryCard`「这本书怎么用」第一段）上——两处都是长版，放得下。
 *    ⚠️ 别照这句反推「贴片在没建书时也看得到」：没书时 `meta === null` 那一支**不渲染
 *    贴片**（`client-entry.js` 只给 topBar + 向导面），所以贴片得等**有书**才出现。
 *  - 「3A 沉浸感」→「3A **游戏级**沉浸」：裸 `3A` 在中文里第一反应是学业评级或 AAA 顶级，
 *    长版（向导卡）本来就写着「3A 游戏的沉浸感」，贴片上原来漏了这个消歧词。
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
		createElement("strong", { style: { fontSize: "12px" } }, "【线团造书工作台】"),
		createElement("span", null, "是"),
		createElement("span", { style: { fontWeight: 600 } }, "【破卷】"),
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
		// ⚠️ 这句**紧跟在【破卷】后面、不插别的产品名**：「三倍学习效率」是关于破卷的断言，
		// 一旦两者之间隔了别的名词，读者会把它读成本项目自己的宣传——那是杜撰，得防。
		createElement(
			"span",
			{ style: { opacity: 0.85 } },
			"3A 游戏级沉浸 · 三倍学习效率",
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
// 这里只剩机器产物但**有人读形态**的那两条：知识地图（`foldKnowledgeMap`）与章节安排
// （`foldOutline`，票 pipeline-wiring-gaps/09）——人读形态都是**就地折叠清单**——
// 阶段页第 2 阶段的 `KnowledgeMapBlock` 与源探查确认卡调前者，第 3 阶段的 `OutlineBlock` 调后者，
// 别让同一样东西两处两种读法。
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

/**
 * `work/outline.md`（章节安排）的**人读折叠形态**（票 pipeline-wiring-gaps/09）。
 *
 * ⚠️ 这一份与 `foldKnowledgeMap` 同族、同一形状：文件名带 `.md`，**内容是机器 JSON**
 * （`{"chapters":[…]}`，落盘见 `actions/chapters.js` 的 `writeWork(project,'outline.md',…)`
 * 与演示模式的 `engine.js` 那一行），所以 `domain-rules.productOpenMode` 判它 `'inline'`
 * ——不开右栏（与 `work/audit-NN.md` 同一条理由）。它与 audit 那一族的分别只在于
 * **有人读**：人读形态是**就地折叠清单**，本函数是它**唯一**的实现
 * （阶段页第 3 阶段的 `OutlineBlock` 调它；拍板前那张 `OutlineConfirmCard` 从 `meta` 直接渲染，
 * 数据与本函数同源、措辞各自成篇）。
 *
 * 解析失败 / 无内容返回 `null`（由调用方回退原文）——**不许假装读懂了**（与 foldKnowledgeMap 同纪律）。
 * @param {string} text `work/outline.md` 的原文。
 * @returns {string|null} 人读清单；读不出来时 `null`。
 */
export function foldOutline(text) {
	let data;
	try {
		data = JSON.parse(text);
	} catch {
		return null;
	}
	if (data === null || typeof data !== "object") return null;
	const chapters = Array.isArray(data.chapters) ? data.chapters : [];
	if (chapters.length === 0) return null;
	const lines = [`📐 章节安排（${chapters.length} 章）`];
	chapters.forEach((chapter, index) => {
		const title = String(chapter?.title ?? "").trim();
		lines.push(`${index + 1}. ${title}`);
		const summary = String(chapter?.outline ?? "").trim();
		if (summary !== "") lines.push(`　${summary}`);
		const source = String(chapter?.source ?? "").trim();
		if (source !== "") lines.push(`　源：${source}`);
		const points = (Array.isArray(chapter?.points) ? chapter.points : [])
			.map((pt) => String(pt ?? "").trim())
			.filter((pt) => pt !== "");
		if (points.length > 0) lines.push(`　覆盖知识点 ${points.length} 个：${points.join(" / ")}`);
	});
	return lines.join("\n");
}

