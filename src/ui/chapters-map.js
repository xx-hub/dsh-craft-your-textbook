/**
 * 造书工作台 · 章节清单与步清单
 *
 * 铺章阶段的章节卡（含过目态内联展开）、全书步清单（全览条）、历史浏览与定点修改、
 * 文件查看器（knowledge-map 折叠）与浏览态整段。
 */

import { createElement, useEffect, useMemo, useState } from "react";
import { S } from "./styles.js";
// 票 `ui-display-redesign/08`：卡头行（问句一行＋事实句一行）是票 01 立的**共用小件**——
// 字号/间距/颜色只在 `card-head.js` 定义一次，本卡⛔ 不就地另写一份。
import { CardHead, CARD_HEAD_QUESTION_STYLE } from "./card-head.js";
import {
	chapterAttribution,
	chapterBadge,
	chapterIsDone,
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
import {
	PHASE_UI,
	artifactName,
	chapterAuditFreshnessText,
	chapterAuditIsStale,
	chaptersFooterNote,
	// 票 `demo-channel-full/26`（清仓）：本卡上这一族句子的两个取值（真书／演示书）——
	// ⛔ 本文件不拼第二份措辞，病与读数见 `view-rules.js` 那一节。
	chaptersReviewLead,
	chaptersFlowLead,
	chaptersFlowOpinionClause,
	reviewWriteHint,
	indexRunningChapterClaims,
	workEntryAction,
	// 票 `ui-systematic-fixes/03`（spec 实现决策 §1·1）：底部小条那句「书的进度」取**值出口**的裸词，
	// ⛔ 不在这里写第二张 status 表（那正是本票要收掉的东西）。
	statusHuman,
} from "./view-rules.js";
// 票 09：章节卡非过目态那颗「打开」＝票 02 那颗共用按钮，住中性模块（阶段页再导出它）。
// 📌 **当初「不许从 `./phase-page.js` import，反向会成环」那条理由已经不存在了**（票
// `depth-review-2026-10/03`）：那个环由 `phase-page → chapters-map` 这条边撑着（为了
// `foldKnowledgeMap` / `foldOutline`），而那两个函数今天住在第三个文件——中性模块
// `./machine-product-folds.js`，那条边随之撤掉。
// ⚠️ 但**结论不变**，而且现在它的理由更硬：`open-artifact-button.js` 是渲染路径上的**真共用件**
// （阶段页三处 + 事件行 + 本文件），搬进任何一个域都会让另一个域反向 import 它。
import { OpenArtifactButton } from "./open-artifact-button.js";
import { chapterRel, goldChapterNo } from "../domain-rules.js";
// 票 02（`workbench-card-contract`）：「这张卡吃什么」写在**卡旁边**，不写在壳里。
// 声明式本身住在中性 module `card-view.js`（零 react 依赖、零域词），本文件只声明
// 「本文件这两张卡各吃哪几个键」——见下面 `chaptersCardView` / `progressOverviewView`。
import { defineCardView } from "./card-view.js";

// 📌 **章号 → 章节正文路径不再在本文件自建**（票 `depth-review-2026-10/05`）：构造只此一份，
// 住在 `../domain-rules.js` 的 `chapterRel`（与识别侧 `NUMBERED_CHAPTER_FILE_RE` 同居），
// `view-rules.js` 那份逐字相同的本地副本已一并撤掉。下面三处调用点——拉正文 /「文件在不在
// 产物清单里」的置灰判据 /「打开」按钮的产物名——取的仍是同一份形状。

/** 「准备中」那一格：图标与中性色，逐字保持票 20 之前那一格的样子（组件里不留零散字面量）。 */
const CHAPTER_NOT_READY = Object.freeze({ icon: "⏳", tone: "#57606a" });

/**
 * 「产物清单还没读到」的那一份空引用——`chaptersCardView.defaults.workFiles` 的缺省值。
 *
 * ⚠️ **必须是模块级同一引用**（spec 缺省三规则第 3 条）：每帧新建一个 `[]` 会让下游任何
 * 「引用变了没有」的比较每帧都为真。壳里那几处手抄的 `Object.freeze([])` 就是这么退役的
 * ——不是删掉了兜底，是把同一句话从内联挪到了契约里。
 *
 * ⚠️ 它**不替壳说话**：壳的 `workFiles` 照旧进 `fromBook`，这一格只在**书没给**时补上，
 * 而且只补 `undefined`（书上给 `null` 原样保住，缺省三规则第 2 条）。
 */
const NO_WORK_FILES = Object.freeze([]);

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

// ── 票 `ui-systematic-fixes/11`：章节卡那两颗拍板键的**文案出口**（拍板契约的 `options[].label`／
// `keysAt` 取这两个绑定）＋ 主键那一句后果说明。⛔ 不在 `view-rules.js` 再抄一份原文。
//
// 票 `ui-display-redesign/08`：主键面文 `✅ 都过了，交工` 退役、改成 `✅ 都过了，进入最后检查`——
// 这一屏之后还有最后检查，旧词让人把它读成最终交付。契约 `decisionOf("chapters").options[0].label`
// 与 `keysAt` 都 import 这一颗常量（⛔ 不另写一份字面量）。
export const CHAPTERS_APPROVE_LABEL = "✅ 都过了，进入最后检查";
export const CHAPTERS_REVIEW_LABEL = "✍️ 写意见";

/**
 * 卡头问句（票 `ui-display-redesign/08`；**存量句逐字不改**——它就是 `view-rules.js`
 * `DECISION_QUESTION.chapters` 那一句，本票把它搬上卡头）。
 *
 * ⚠️ 字面量必须留在**本文件**、并由本卡就地造那个 `<strong>` 再交给 `CardHead`（理由见
 * `card-head.js` 文件头「API」）：造书模式人设的「界面状态对照表」逐字引着这张卡的标题，而那条
 * 契约（`test-context-vocabulary.mjs`）的取证面只读 `src/ui/**` 里 `createElement("strong", …)`
 * 调用点上的字面量／同文件 `const`——问句节点由共用件代造时，取证面看不见它。
 */
export const CHAPTERS_CARD_QUESTION = "全书都过目了、可以交工吗？";

/**
 * 卡头事实句（票 `ui-display-redesign/08` 新写，派生）：已完成章数／未处置意见数**都按真账本现算**；
 * 末尾「交工后合并成书」是这一屏点下去之后会发生的事（下一屏才是最后检查）。
 *
 * @param {number} done 已完成的章数（`rules.chapterIsDone` 的口径，与阶段五状态卡同源）
 * @param {number} total 总章数
 * @param {number} pendingCount 未处置意见数（`isReviewPending` 口径）
 */
export function chaptersCardFacts(done, total, pendingCount) {
	const opinions = pendingCount === 0 ? "没有未处置的意见" : `${pendingCount} 条意见待处置`;
	return `${done}/${total} 章已完成，${opinions}；交工后合并成书。`;
}

/** 0 章时的空态句（票 `ui-display-redesign/08` 新写）：不再只有「已完成 0/0 章」那一格计数。 */
export const CHAPTERS_EMPTY_NOTE = "还没有章节——等章节安排定下来，这里会逐章列出来。";

/**
 * 存档说明的折叠口那一行（票 `ui-display-redesign/08`：长承诺句默认折，不占正文）。
 * ⚠️ 展开体仍是 `chaptersFooterNote(meta)` 的原句，一个字不改。
 */
export const CHAPTERS_FOOTER_FOLD_SUMMARY = "📌 存档说明";

/**
 * 「✅ 都过了，进入最后检查」那颗主键的**后果说明**（票 11 补的六句之一 · 站 10）。
 *
 * ⚠️ 与卡头那句「点每章的「▸ 展开第 N 章正文」；有意见直接写…；都满意就合并成书、进入最后检查。」
 * （`view-rules.chaptersReviewLead`）**各答一半**：那句说**这一屏怎么用**，本句说**点了交工**
 * 会发生什么。⚠️ 票 `ui-display-redesign/08` 只改了键面文与导语，本句（契约 `effect`）**内容不动**。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：本句只管这一颗键。交工之后「合并成书」那几步的细节
 * （少章会被拦、缺件对账）各有各的出口，不在本句。
 */
export const CHAPTERS_APPROVE_EFFECT =
	"点了它就是把这本书交出去合并成书；之后想改，回到最近一次存档或就地写一条意见。";

/**
 * 某一章**文件还不在盘上**时，那排键为什么灰着（票 11 的第二件：`blocked` 的理由上屏）。
 *
 * 票面病根（`inv-decisions.md` §2）：这条理由此前**只在 `title` 属性里**——触屏与键盘用户
 * 拿不到（悬停才看得见）。⇒ 现在它同时出现在 **键那一行的可见文字**里（行尾一行 11px 小字）。
 * ⚠️ 判据仍是同一个 `fileMissing`（`!hasChapterFile(row.n)`），⛔ 没有第二份判据。
 */
export const CHAPTER_FILE_MISSING_REASON =
	"这一章还没写出来（或文件改名了），暂时看不了";

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
		createElement("span", { style: { opacity: 0.6 } }, "· "),
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
						style: S.disabled(S.smallLink, busy),
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

/**
 * `ChaptersCard` 的 props 契约（票 `workbench-card-contract` 02）。
 *
 * 「这张卡吃什么」写在**卡旁边**（locality）：壳只负责把「当前这本书 ＋ 接线」递过来
 * （`client-entry.js` 的 `case "chapters"` → `cardBook`）。给这张卡加一个输入要改的是
 * **这个文件**，不是那个两千多行的壳——那条「知识住在壳里」的路就是本票要拆的。
 *
 * ⚠️ **book 侧的键取壳里那个不撞名的标识符**，卡片消费的 prop 名由 `derive` 整形成卡片体内
 * 那个名字。一本书只有一本扁平的 book：两张卡的 prop 名撞车时（两张确认卡都叫 `onConfirm`，
 * 壳里却是两个不同动作）只有这样才说得清谁是谁。
 *
 * **必填三项**——缺任一个 ⇒ **装配期**抛 `CardViewError`（点名是这张卡、缺哪个字段），
 * 而不是等用户点下去才发现「什么都没发生」：
 *   · `postAction`：章卡上三条入账出口都走它（提意见 / 处置与翻案 / 段落三键）。收编前这三处
 *     各有一道 `if (postAction === undefined) return;` 守卫（`onReview` 之外的 `onRevoke`、
 *     `onOpinion`、`onRevokeOpinion` 三个回调的第一行）——生产里它们不可达，票 01 查实那是
 *     「壳漏传就静默降级」，`.scratch/dead-gates` 不变量 7 禁的形状。已删，注释留在原位。
 *   · `readArtifact`：「看看这章」的内联正文经它取回（票 03 的 `ui/artifact-read.js`；
 *     `project` / `session` 两个身份 prop 随之退休）。
 *   · `onView`：每章那颗「打开」（`OpenArtifactButton`）。壳里它是 `viewWork` 的一个**闭包**
 *     （`path` 固定成 `工作区/chapter-NN.md`），与源探查那张卡的 `onViewReport` 不是同一个函数。
 *
 * ⚠️ **`derive` 只有一个参数**（此刻的袋子，含 book 键、缺省与 `.with()` 覆盖后的最终值）。
 * ⚠️ **`.with()` 改不动 `derive` 整形出来的那几个键**（delta 的闭集 = `fromBook` ∪ `defaults`）：
 *    「一个名字一处来源」在 `card-view.js` 里是**闸**不是纪律。真要在调用处换掉
 *    `chapterSegments` / `onReview` / `reviewMode` 中的哪一个，先想清楚它该归谁。
 */
export const chaptersCardView = defineCardView({
	card: "ChaptersCard",
	fromBook: [
		// ── 书级只读数据（`client-entry.js` 里同名或近似名的局部量）
		"meta",
		"chapterStatus",
		"pendingReviews",
		"progressDetail",
		"contextPercent",
		"events",
		"workFiles",
		// ⚠️ 壳里写的是 `chapterSegments: processSegs`（`/textbook/process` 的分段事实；票 20
		//    「谁在写哪一章」与徽章新鲜度都吃它）。book 侧用壳里那个标识符，卡侧由 derive 整形。
		"processSegs",
		// 票 20：此刻**真在跑**的小助手有几个（与顶栏「🔎 N 个小助手在跑」同一份读数）。
		// ⚠️ 刻意**不给**缺省 0：卡内的 `view-rules.indexRunningChapterClaims` 自己按 0 算
		//    （注释逐字写着「缺这一格按 0 算，不是缺省成『全都在写』」），那句话留在判据那边。
		"runningSubagentCount",
		"busy",
		// ── 壳注入的接线（回调与读取口，不是界面词）
		"readArtifact",
		"postAction",
		// 壳里是就地箭头：`() => void postAction({action:"chapters-review-confirm", approved:true})`
		// ——它没有自己的局部标识符，prop 名就是它在壳里写的名字（`client-entry.js` 的
		// `onApproveAll`）。与 final 卡那颗 `onApprove`（壳里的 `onApprove` 键）是两个键，不撞名。
		"onApproveAll",
		// 壳里是就地箭头：`(n) => viewWork({path: "工作区/chapter-NN.md", label: 第 n 章})`。
		// ⚠️ 撞名核查：`onView` 在壳里只出现在**这一处**；源探查确认卡那一处叫
		//    `onViewReport`（`viewWork({path:"工作区/explore.md"})`），是两个不同的闭包、两个键。
		"onView",
		// 壳里写的是 `onReview: submitReview`（`client-entry.js` 的 `submitReview` 本名）。
		"submitReview",
	],
	required: ["postAction", "readArtifact", "onView"],
	defaults: {
		// 「产物清单还没读到」＝「读到一份空清单」，在卡里是同一句话（`hasChapterFile` 里
		// `files.length === 0` ⇒ 一律不置灰，旧账本口径）。空引用必须是模块级同一引用 ⇒
		// `NO_WORK_FILES`。壳照旧传 `workFiles`，这一格只在**书没给**时补。
		workFiles: NO_WORK_FILES,
		// 票 28：主 AI 上下文占用读不到就是「不显示这一格」，**绝不显示 0%**。
		// 缺省只在 `undefined` 时填——书上给 `null` 原样保住（缺省三规则第 2 条）。
		contextPercent: null,
		// ⚠️ 下面两个是 **SSR 专用开口**，不是「让测试偷懒的旁门」（票 03 裁决 A，2026-10）：
		//    壳**从不**传它们；全仓唯一注入点是 `smoke-test.mjs` 第 24 节，那一节用
		//    `renderToStaticMarkup` **直接渲这张卡**——正文是卡内 effect 取回来的，SSR 跑不了
		//    effect，不靠这两个 prop 就无法呈现「章节已展开」这一态。定性：**给一个客户端状态
		//    补的 SSR 渲染路径**（真实取数那条路仍由组件测试钉着，两处并存，不是二选一）。
		//    将来冒烟那一节若改用客户端渲染，这两个 prop 随之删除——**记在这里，别让它们
		//    悄悄长成别的东西**（destructure 处 `:326-336` 那段说明是它的原文）。
		// 复核「`null` 作缺省安全」（两处用法逐字）：`:350` 的
		// `Number.isSafeInteger(initialOpenChapter) && initialOpenChapter >= 1`
		// 对 `null` 与 `undefined` 同为 `false`（不预开初始态）；`:599-602` 的
		// `typeof chapterTextOverride === "string" && chapterTextOverride !== ""`
		// 对 `null`（`typeof` 得 `"object"`）与 `undefined` 同为 `false`（回落
		// `chapterText`）。⇒ 两者逐字同路，不需要另找缺省值。
		initialOpenChapter: null,
		chapterTextOverride: null,
	},
	// 壳里的现算表达式 ＋ book 侧键 → 卡片 prop 名的整形。**无条件**给出下面每一个键。
	derive: (bag) => ({
		chapterSegments: bag.processSegs,
		onReview: bag.submitReview,
		// 过目态（票 10）：壳里就是这一句 `meta.status === "awaiting-chapters-review"`。
		// 收进契约是为了**只此一份**——留在壳里各写一份，正是本票要收的「接线住在壳里」。
		reviewMode: bag.meta?.status === "awaiting-chapters-review",
	}),
});

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
		// 票 20：此刻**真在跑**的小助手有几个（`indexSubagentDescendants()` 那个 `runningCount`，与顶栏
		// 「🔎 N 个小助手在跑」同一份读数）。它决定「我正在做」有几个名额——章卡与归属都经它，
		// 所以屏上「说我在做的行数」**≤**「几个小助手在跑」，候选够时两者相等（票面 :63/:103）。
		// ⚠️ 缺这一格按 0 算（不是缺省成「全都在写」）：少说一次「我正在做」收得回来，
		// 多说一次就是票 20 那个病本身。
		runningSubagentCount,
		// 票 03：产物读取归 `ui/artifact-read.js`（`createArtifactReader(...).readText`），
		// 本卡只给一个 `rel`。`project` / `session` 两个身份 prop 因此**退休**——它们原先只被用来
		// 拼那一条 URL（收编前全卡对这两个名字的引用只有 destructure、那道 `project == null` 早退、
		// 那条 URL、以及依赖数组里的它们）。
		readArtifact,
		// ⚠️ 下面两个是 **SSR 专用开口**，不是「让测试偷懒的旁门」（票 03 裁决 A，2026-10）。
		//
		// 收编时本想一并删掉，理由是它们违反 `dead-gates` 不变量 7「断言必须经产品代码的路径把
		// 字段喂进去」。**那个理由只对客户端测试成立**——`test-component-cards.mjs` 那三条已改走
		// 真实点击（从收起态点「▸ 展开第 N 章正文」取正文），比原来更强，不退回。
		//
		// **但 `smoke-test.mjs` 第 24 节用的是 `renderToStaticMarkup`（SSR）**：正文是**卡内 effect
		// 取回来**的（`client-entry.js:6072` 记着「SSR 跑不了 useEffect/fetch」），SSR 不跑 effect ⇒
		// 不靠这两个 prop，**SSR 就无法呈现「章节已展开」这一态**。这不是豁免一条业务判据，是给一个
		// 客户端状态补一条 SSR 渲染路径；真实取数那条路仍由组件测试钉着（两处并存，不是二选一）。
		// 将来若冒烟那一节改用客户端渲染，这两个 prop 即可随之删除——**记在这里，别让它们悄悄长成别的东西**。
		initialOpenChapter,
		chapterTextOverride,
		// 票 28：主 AI 上下文占用百分比（null = 宿主读不到，界面不显示这一格）。
		contextPercent,
		postAction,
	} = props;
	const [reviewing, setReviewing] = useState(null);
	const [comment, setComment] = useState("");
	// F39（2026-08-20 走查）：过目态「看看这章」内联展开——openChapter 记当前点开的章号，
	// 正文经 `readArtifact` 取（票 03：地址拼装归 `ui/artifact-read.js`）。
	// 生产入口只有「从收起态点开」（`setOpenChapter`，`:576` 展开 / `:763` 收起）；
	// `initialOpenChapter` 只为上面那条 SSR 路径预开初始态。
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
		// 票 03：只给一个 `rel`，地址由 `ui/artifact-read.js` 拼。
		// ⚠️ 收编前这里有一道 `if (project === null || project === undefined) return undefined;`——
		// 它在生产里**不可达**（壳的 `case "chapters"` 分支必传 `projectId`，而 `projectId` 非空蕴含
		// `meta` 非空，见 `.scratch/workbench-card-contract/issues/01` 的投影不变式）。它真正的用途是
		// 让组件测试不发网络请求——那正是 `dead-gates` 不变量 7 禁的形状。
		// 「无当前书 ⇒ 不发请求」现在归那个 module（表现为一次 reject），落进下面**同一条**降级路径。
		//
		// ⚠️ 错误策略**逐字保留**（两条正当策略之一）：读不到就在这一章里显示错误条。
		// 另一条在 `confirm-cards.js`（静默降级，不显示报告区）。**不许把两条统一**。
		readArtifact(chapterRel(openChapter))
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
	}, [openChapter, readArtifact]);
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
			// 票 `word-budget-ineffective/02`：字数兜底与当前实际汉字数**只消费服务端下发的那两格**
			// （`engine.chapterWordReading` 的单点读数）。⛔ 界面这一侧不再拼
			// 「chapter.targetWords ?? meta.targetWords」——那是第二份兜底口径。
			wordsFloor: Number.isFinite(found?.wordsFloor) ? found.wordsFloor : null,
			actualHanzi: Number.isFinite(found?.actualHanzi) ? found.actualHanzi : null,
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
	// 票 `audit-state-regression/01`：谓词本体搬进 `rules.chapterIsDone`——阶段五状态卡上的同一个
	// 计数（「已完成 N/M 章」）也读它，两处不可能再各判各的。
	const chapterIsDoneAt = (n) => chapterIsDone(chapterStatus, doneSet, pendingReviews, n);
	// 服务端**真下发了** `done` 才返回布尔；没下发（老服务端／样张）返回 null，徽章退回本地判据。
	const serverDoneOf = (n) => {
		const found = (chapterStatus ?? []).find((r) => Number(r?.n) === Number(n));
		return typeof found?.done === "boolean" ? found.done : null;
	};
	const done = rows.filter((row) => chapterIsDoneAt(row.n)).length;
	// 票 `ui-display-redesign/08`：卡头事实句要报「未处置意见数」——与上面 `pendingExplain`／
	// 交工拦截／章徽章同一条判据（`isReviewPending`），⛔ 不另写一份计数。
	const pendingReviewCount = (pendingReviews ?? []).filter((review) => isReviewPending(review)).length;
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

	// 票 20：这一屏的「谁在写哪一章」——**一份**认领表，徽章与归属都读它，不各判各的。
	// 判据见 `view-rules.indexRunningChapterClaims` 的注释（产物 ＋ 名额两条硬判据）。
	const chapterClaims = useMemo(
		() => indexRunningChapterClaims(chapterSegments, runningSubagentCount),
		[chapterSegments, runningSubagentCount],
	);

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
		// ── 卡头：问句（存量句）＋事实句（已完成章数／未处置意见数现算）──────────────────────
		createElement(CardHead, {
			question: createElement(
				"strong",
				{ style: CARD_HEAD_QUESTION_STYLE },
				CHAPTERS_CARD_QUESTION,
			),
			facts: chaptersCardFacts(done, rows.length, pendingReviewCount),
		}),
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
						// 票 `demo-channel-full/26`：「AI 照改」对演示书是假话（用户那条只能撤回）
						// ⇒ 两取值，出口＝`view-rules.chaptersReviewLead`。
						// 票 `ui-display-redesign/08`：导语里失效旧词「看看这章」与「交工合并」同批退役。
						chaptersReviewLead(meta),
					),
					createElement(
						"button",
						{
							style: S.disabled(S.bigBtn(true), busy),
							onClick: onApproveAll,
							disabled: busy,
							// 票 `auto-walkthrough/04`：关键键的语义钩子（全章过目交工，六闸门之一）。
							"data-chapters-approve": "1",
						},
						CHAPTERS_APPROVE_LABEL,
					),
				)
			: null,
		createElement(
			"strong",
			{ style: { fontSize: "13px" } },
			"📚 写完整本：章节清单",
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
			// 票 `demo-channel-full/26`：开头那句「小助手执笔 → 小助手检查 → AI 最后把关」在演示书上
			// 三件都不成立（演示支全流程零小助手、零 AI 把关）⇒ 两个取值（后半句的「AI 照改」同
			// `chaptersReviewLead`）。两个后缀由调用方现算，⛔ 出口那一侧不碰它们。
			`${chaptersFlowLead(meta)}已完成 ${done}/${rows.length} 章${pendingExplain}${contextNoteText}；想细看点每章的「▸ 展开第 N 章正文」，有意见直接写，${chaptersFlowOpinionClause(meta)}处置过的意见能翻案。`,
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
			// 票 22：徽章认「**此刻这份正文**有没有被审过」——与下面那句新鲜度文案同一条服务端事实
			// （`view-rules.chapterAuditIsStale`）。不传这一格时徽章照旧只看交工事件（原行为）。
			const auditStale = chapterAuditIsStale(chapterSegments, row.n);
			// 票 20：这一章此刻**有没有在跑的小助手认领它**（唯一的「我正在做」前置条件）。
			// 徽章与下面那颗归属**读同一个值**——一处说「有人在写」、另一处说「没人认领」是新的自相矛盾。
			const claimed = chapterClaims.has(row.n);
			// 票 `audit-state-regression/01`：徽章与「已完成 X/Y 章」读**同一个** `doneNow`（服务端
			// `chapterStatus[].done` 优先）——不然计数说 1/2、徽章说那一章「已完成 · 审过」。
			const doneNow = chapterIsDoneAt(row.n);
			const badge = chapterBadge(
				row,
				pendingReviews,
				doneSet,
				pipelineStage,
				auditStale,
				claimed,
				serverDoneOf(row.n),
			);
			// 票 20 · 归属栏（与状态拆成两件事）：没有在跑的小助手就**整格不渲染**——
			// 不留占位、不写「排队中」（那正是把计划说成事实的另一种写法，票面 :99）。
			const attribution = chapterAttribution(claimed, pipelineStage);
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
			// 票 `demo-channel-full/06`：演示通道**自带**的那几条意见（`origin:'demo'`）不是用户写的。
			// 全块都是这种来源时，小标题换成如实的那一句——⛔ 不让「你在这一章提的意见」冒充用户的话。
			// 真书上一条这种条目都不会有（注入只在演示支），所以这一格对真书是恒假、一个字不改。
			const demoReviewsOnly =
				rowReviews.length > 0 &&
				rowReviews.every((r) => r?.origin === "demo");
			// 票 03：`chapterTextOverride` 是 SSR 专用开口（见 destructure 处那段说明）——
		// SSR 不跑 effect，正文取不回来，正文区靠它才有内容可渲染。
		// 客户端那一条（`readArtifact` 取回来的 `chapterText`）是**默认**路径。
		const shownText =
			typeof chapterTextOverride === "string" && chapterTextOverride !== ""
				? chapterTextOverride
				: chapterText;
			// F38（2026-08-20 走查）：每章「源材料索引」——源：用哪本材料哪部分 · 覆盖知识点 N 个。
			// 字段缺失就不显示对应段；全缺则整行不渲染。
			// ⚠️ 票 `confirm-points-redesign-build/07`：**「体量依据」那一项撤下**（同一句话原先在
			// 这一行与站 7 的大纲卡各渲染一次）；盘上字段、交办件里那句、AI 工具契约**三处不动**，
			// 只是不再上屏。⛔ 同行的「源：」「覆盖知识点 N 个」不动。
			const sourceIndex = [
				row.source !== undefined && row.source !== "" && row.source !== null
					? `源：${row.source}`
					: null,
				row.points.length > 0 ? `覆盖知识点 ${row.points.length} 个` : null,
			]
				.filter(Boolean)
				.join("，");
				// 票 10 · P47 落点②：这一章的检查记录是不是**比正文旧**（旧稿）。措辞与步清单那份
			// `artifactFactText` 同源（同一个出口、同一个判据）；服务端没下发、或这一章还没写
			// 检查记录 → 空串，不编一句。
			const auditFreshness = chapterAuditFreshnessText(chapterSegments, row.n);
			// 票 `word-budget-ineffective/02`：章节面板显示「兜底/实际」。⛔ 这一行**不带颜色/图标**——
			// 超过兜底不是错（预算语义是「至少要有这么多」），低于兜底由交工那一步拒收，
			// 界面这里只如实报两个数（没写正文时「实际」停在「还没量到」，⛔ 不写 0）。
			const wordsReading =
				row.wordsFloor === null && row.actualHanzi === null
					? ""
					: [
							row.wordsFloor !== null
								? `兜底 ${row.wordsFloor} 汉字`
								: "这本书没设兜底",
							row.actualHanzi !== null
								? `实际 ${row.actualHanzi} 汉字`
								: "实际字数还没量到",
						].join("，");
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
					? // 「准备中」答的是**这一屏的账还没读回来**（`chapterStatus` 一个都没有），
					// 不是某一章的状态，所以它不占章徽章那一格、也不占状态词三词。
					// ⚠️ 逐字保持票 20 之前的样子（图标 ⏳ ＋ 中性色），本票只把**有账可读**那一格换成判据。
					createElement(
						"span",
						{ style: { fontSize: "12px", color: CHAPTER_NOT_READY.tone } },
						`${CHAPTER_NOT_READY.icon} 准备中`,
					)
					: // 票 20：徽章**可以没有**——没人在写这一章、它也还没定稿，这一格整颗不出声
					// （不是空徽章，也不是拿「排队中」之类的说法顶上）。
					badge === null
						? null
						: createElement(
							"span",
							{ style: { fontSize: "12px", color: badge.tone } },
							`${badge.icon} ${badge.text}`,
						),
				// 票 20 · 归属栏（「谁在写这一章」，与状态分开的一栏）：认领才说话，
				// 空着就**整格不渲染**——不留占位、不写「排队中」。
				attribution === null
					? null
					: createElement(
						"span",
						{
							style: { fontSize: "12px", color: attribution.tone, opacity: 0.85 },
							title: "这一章此刻是谁在写",
						},
						`${attribution.icon} ${attribution.text}`,
					),
			),
				sourceIndex !== ""
					? createElement(
							"div",
							{ style: { margin: "2px 0 0", fontSize: "12px", opacity: 0.6 } },
							sourceIndex,
						)
					: null,
				wordsReading !== ""
					? createElement(
							"div",
							{ style: { margin: "2px 0 0", fontSize: "12px", opacity: 0.6 } },
							wordsReading,
						)
					: null,
					auditFreshness !== ""
					? createElement(
						"div",
						{ style: { margin: "2px 0 0", fontSize: "12px", opacity: 0.6 } },
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
									style: S.disabled(S.smallLink, fileMissing),
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
										? CHAPTER_FILE_MISSING_REASON
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
							// ⚠️ 判据取 `doneNow`（与上面「已完成 X/Y 章」**同一份**，不另写一条）。
							// ⚠️ `fileMissing` 那一支优先级更高：文件都还没出来，谈不上定没定稿，保持原样。
							// ⚠️ `open-artifact-button.js` 的默认值一个字不动（中性件，阶段页与事件行共用）。
							createElement(OpenArtifactButton, {
								item: { path: chapterRel(row.n) },
								onOpen: () => onView(row.n),
								label: doneNow
									? `${artifactName(chapterRel(row.n))} 打开`
									: `${artifactName(chapterRel(row.n))} 打开${DRAFT_QUALIFIER}`,
								disabled: fileMissing,
								title: fileMissing
									? CHAPTER_FILE_MISSING_REASON
									: doneNow
										? undefined
										: draftOpenTitle(artifactName(chapterRel(row.n))),
								// 这一排按钮照旧左对齐（本件默认 `marginLeft:auto` 是给产物行靠右用的）。
								// ⚠️ 票 `gold-display-period/05`：这里**不**套 `S.disabled`——`disabled` 是当 prop
								// 递给 `OpenArtifactButton` 的，置灰长在**那一件自己**身上（同一个表达式），
								// 判据认这种透传（`test/test-disabled-visual.mjs` 第 4 条）。
								style: { marginLeft: 0 },
							}),
					prepared
						? createElement(
								"button",
								{
									style: S.disabled(S.smallLink, fileMissing),
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
											// 票 `demo-channel-full/26`：「AI 照改后由你确认」对演示书是假话
											// ⇒ 两取值，出口＝`view-rules.reviewWriteHint`。
											: reviewWriteHint(meta),
								},
								open ? "收起" : CHAPTERS_REVIEW_LABEL,
							)
						: null,
					// 票 `ui-systematic-fixes/11` 的第二件：**灰键的理由写在脸上**。
					// 这一排三颗键（展开／打开／写意见）判据同一个 `fileMissing`，而此前理由只活在
					// `title` 属性里——触屏点不出悬停、键盘也读不到（`inv-decisions.md` §2 的档三）。
					// 纯文字、⛔ 不是热区、⛔ 不加新键、⛔ 不改那三颗键的任何一行字。
					fileMissing
						? createElement(
								"span",
								{ style: { fontSize: "12px", opacity: 0.75 } },
								CHAPTER_FILE_MISSING_REASON,
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
										fontSize: "12px",
										opacity: 0.6,
									},
								},
								demoReviewsOnly
									? "演示通道自带的示例意见（不是你提的）："
									: "你在这一章提的意见：",
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
										// 票 02（`workbench-card-contract`）：原先这个回调的第一行是
										// `if (postAction === undefined) return;`，收编进契约后删掉——不再需要这道防
										// 「壳漏传」的保险，因为 `postAction` 是本卡契约里的**必填** props
										// （`chaptersCardView.required`）：壳漏传会在**装配期**就响着抛，并点名是这张卡、
										// 缺哪个字段，不必等用户点了这颗键才发现「按下去什么都没发生」。
										// ⚠️ 取证（删它的前提）：本回调由 `ChapterReviewLine` 的按钮 `onClick`
										// （`:194`）触发，**渲染期零执行**——函数体在渲染中被构造，但只有真点了
										// 「撤回」/「翻案」才进来，所以删它不改变任何一次渲染的输出。
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
									style: S.disabled({ ...S.bigBtn(true), padding: "6px 14px" }, busy || comment.trim() === ""),
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
																style: S.disabled(S.smallLink, fileMissing),
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
												// 票 `demo-channel-full/25`：段落三键确认层那句话的取值要认得出演示书
												// （`view-rules.paraMarkConfirmNote(meta)`）；本卡手上的就是这一份 `meta`。
												meta,
												onOpinion: (kind, wish, para, hint) => {
													// 票 02（`workbench-card-contract`）：原先这里的第一行是
													// `if (postAction === undefined) return;`，收编进契约后删掉——不再需要这道防
													// 「壳漏传」的保险，因为 `postAction` 是契约里的**必填**项，漏传会在**装配期**
													// 就响着抛（点名是这张卡、缺哪个字段），不必等用户按了段落三键才发现「按了
													// 什么都没发生」；另见 `chaptersCardView.required` 那条注释。
													//
													// ⚠️ **这三处里就数它不一样**：删掉守卫之后，这个回调的**第一动作变成本地
													// state 写**（就是紧跟着的那句 `setKeepOpenChapter(row.n)`），不是发动作。今天
													// 那道守卫在 `postAction` 缺失时会把这一次本地写**一起短路掉**——而「把刚提了
													// 意见的这一章钉在展开态」是票 30① 的本地效果，与发不发动作无关。
													//
													// ⚠️ 取证（删它的前提）：本回调只在 GoldReader 确认层的提交键被按 `onClick` 时
													// 进来（`gold-table.js` 的三颗提交键 `:438`／`:523`／`:680` →
													// `submitMark`／`submitWish`／`submitGeneral`，定义在 `:369`／`:334`／`:350`），
													// **渲染期零执行**——渲染只是把这个函数构造出来。
													// 🚨 零覆盖区（票 02「🚨 零覆盖区」一节）：段落三键这条入账路径全仓没有组件级
													// 测试，删守卫没有回归网，靠上面那条必填声明兜住漏传。
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
													// 票 02：同上——原先这道 `if (postAction === undefined) return;` 已随契约收编删除
													// （`postAction` 是 `chaptersCardView` 的**必填** props，壳漏传在**装配期**就抛）。
													// ⚠️ 取证：本回调只在 GoldReader 那颗段落键被按 `onClick` 时进来
													// （`gold-table.js:605-611` → `:607`），渲染期零执行。
													// 🚨 零覆盖区（票 02「🚨 零覆盖区」）：全仓搜 `onRevokeOpinion` 只命中
													// `smoke-test.mjs:4565`，而那里渲的是独立的 `GoldReader`、不是这张卡——这条路径
													// 没有组件级测试，删守卫没有回归网，靠上面那条必填声明兜住漏传。
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
		// ── ⑩存档说明〔折〕：长承诺句默认收成一行，展开体仍是原来的那句话（一字不改）──────
		createElement(
			"details",
			{ style: { margin: "8px 0 0" } },
			createElement(
				"summary",
				{ style: { cursor: "pointer", fontSize: "12px", opacity: 0.7 } },
				CHAPTERS_FOOTER_FOLD_SUMMARY,
			),
			createElement(
				"p",
				{ style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.7 } },
				// 票 14（承诺账 B，来源票 15-Q2 的裁决）：这里原来只能说「关键节点自动存档」＋「最近一次存档」，
				// 因为全仓 `writeSnapshot(` 只有四个写点（阶段交办 / 每关首次与修订提案 / 回退前），
				// **没有「每章」写点**；reason 也不是拍板点（阶段交办类写的是「交办「写完整本」之前」）。
				// 票 05 / P36（2026-09-27 用户拍板「逐章交工各存一次」）：逐章交工成功路径补上了第五个写点
				// （`chapters.js` 的 `writeSnapshot(project, '交工「第 N 章《标题》」之后')`），于是「最近一次存档」
				// 在写完整本那段时间里**不再停在整段之前**，而是停在上一章交完的地方——这句承诺因此第一次说得准，
				// 也照票面记档把「随时能回到最近一次存档」原样留着（密度已修好，不再欠账）。
				// 🚫 不在这句里加「最近一次存档：xx 时间」：用户 2026-09-27 明确**没选**显示存档时间与数量。
				//
				// 票 `demo-channel-full/22`：这一句的**两个取值**（真书／演示书）收进
				// `view-rules.chaptersFooterNote`——原句对演示书不成立（那个文件里逐条写着读数出处），
				// ⛔ 本文件不自己拼措辞。它在屏上的那一帧就是**本卡**（`demo-phase-5`）。
				// 票 `ui-display-redesign/08`：这句话**默认折**（块序 ⑩），展开体照旧。
				chaptersFooterNote(meta),
			),
		),
		// ── ⑪0 章空态：补一句人话，不再只有「已完成 0/0 章」那格计数──────────────────────
		rows.length === 0
			? createElement(
					"p",
					{ style: { margin: "8px 0 0", fontSize: "12px", opacity: 0.8 } },
					CHAPTERS_EMPTY_NOTE,
				)
			: null,
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
				fontSize: "12px",
				fontWeight: 700,
				opacity: 0.55,
				letterSpacing: "0.02em",
			},
		},
		Number.isInteger(props.phase)
			? `第 ${props.phase} 阶段：${PHASE_UI[props.phase] ?? ""}`
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
										fontSize: "12px",
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
/**
 * `ProgressOverview` 的 props 契约（票 `workbench-card-contract` 02）。
 *
 * 全览条（焦点区顶部「全书 N 步 · 还剩 M 步」＋ 展开清单）只吃四样：一个 projector、
 * 一个「正在看哪一步」、两个导航回调。
 *
 * ⚠️ **`projector` 走 `fromBook`、不走 `derive`**：它是壳里 `stageStepProjector` 的**原样
 * 转发**（`projector: stageStepProjector`），没有任何现算。放进 `derive` 等于给同一个名字
 * 造第二处来源，还要白白多担一条「`.with()` 改不动」的约束。
 * ⚠️ 而它**不是模块级单例**：壳里是
 * `useMemo(() => createStageStepProjector({meta, processSegs, runningSubagentCount}), [...])`，
 * 三个依赖之一的 `runningSubagentCount` 来自**宿主会话状态**、不在 `book` 里 ⇒ **book 引用
 * 没动，projector 的身份照样会换**。所以别把它当记忆化 key，也别因为「book 没变」就以为
 * 袋可以缓存（壳 `cardBook` 每帧重建是刻意的，见 `client-entry.js` 那段注释）。
 *
 * ⚠️ 另外三个是**纯壳-local 的导航接线**（`browsingKey` ← 壳的 `browsing`；`onPickStep` /
 * `onPickPhase` 就是壳里那两个同名局部量）。它们**与 `PhasePage` 没有交集**——只有
 * `projector` 一项重叠——照实登记即可，**不许**为了「和阶段页对齐」把两边凑成同一个形状。
 */
export const progressOverviewView = defineCardView({
	card: "ProgressOverview",
	fromBook: ["projector", "browsingKey", "onPickStep", "onPickPhase"],
	// `projector` 在**每次渲染**都被无条件调用（`project({kind:"overview"})`）——缺了它不是
	// 「点一下没反应」，是这张卡当场渲不出来。所以它是必填。
	// ⚠️ 反过来 `onPickStep` / `onPickPhase` **不列必填**：卡内是 `onPickStep?.(…)` 的可选调用
	// （清单行点不动时的合法状态），声明成必填等于把一件合法的事写成接线事故。
	required: ["projector"],
	defaults: {
		// 「没在回看任何一步」是**显式的 null**，不是「键不存在」：`StepList` 的高亮判据
		// （`:1073`）是 `browsingKey !== null && browsingKey === row.key`，
		// 那个 `!== null` 写的就是这一格。
		browsingKey: null,
	},
});

export function ProgressOverview(props) {
	const [open, setOpen] = useState(false);
	const { projector, browsingKey, onPickStep, onPickPhase } = props;
	// 票 04 + 候选 06：抬头按**步**数、分组、每行四态——全部由模型一次推导，界面不许自己数/自己分。
	//   headline：`全书 3N+10 步，还剩 M 步`（M=0 →「已全部完成」）/ `已知 N 步，章节排定后补齐`。
	//   currentPhaseText：`现在在第 N 阶段：阶段名`（spec 用户故事 2）。
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
// ⚠️ 上面那两个「塌了多少」是**票 26 当时的读数**（**票 16 之前**：工作台通栏填满中心列 ⇒ 主区宽
// ≈ 中心列宽）。今天主区宽改由 `T = min(C − 32, W + 32)` 给出（票 16，2026-10-05）：1280 下是
// 392 ↔ 712、2K 下 754 ↔ 952 —— 算式与依据见下面 `NARROW_MAIN_WIDTH` 的注释（2026-10-06 票
// `walkthrough-2026-10/08` 对齐）。**文案一个字没改**（那句「能宽一倍」是票 08 红线的逐字保留件）。
//
// ⚠️ **布局一个字不动**：走查 `:656` 那个 `min-width` 方案已被作者自己在 `:662-664` 撤回，
// 本票只加文案：不引入 min-width、不引覆盖式浮层、不碰任何宿主布局属性。
//
// ⚠️ **热区身份**（CONTEXT「热区」八个合法动作值）：这是**纯提示**——一个 `<p>`，不可点、
// 不发动作、不换屏、不开文件，所以**它根本不是一个热区**，也就没有「一个热区两个身份」的问题。
// 🚫 不许把它做成整块热区去替用户点那颗宿主按钮，也**不许新造一个收起动作**（收起那颗按钮是
// 宿主的，本票只指路）。

/** 主区窄于此（px）就提一句。
 *
 * 2026-10-06（票 `walkthrough-2026-10/08`）把取数对齐到**今天的接线**并重算了「余量」这笔账：
 * 接线是 `src/client-entry.js` 的 `rootStyle`（票 16）⇒ 主区实宽 `T = min(C − 32, W + 32)`
 * （`C` ＝ 宿主中心列宽、`W` ＝ `--dsh-chat-content-width`；列宽与 `W` 见快照
 * `docs/reference/dsh-chat-width-handle-geometry-contracts.md` §1／§2／§2b）：
 *   · 1280 右栏**收起**：`C = 1000`、`W = clamp(680, 640, 920) = 680` ⇒ `T = min(968, 712) = 712`
 *   · 1280 右栏**开着**：`C =  424`、`W = 680`                         ⇒ `T = 392`
 *   · 2K（2560）开 / 关：`T = 754` / `T = 952`
 * ⇒ 本注释原写的「真机数 990 / 414、2270 / 1110」是**票 16 之前**的通栏读数（那时工作台通栏填满
 * 中心列，`T ≈ C`），与今天真正喂进这个判据的量已经不是一回事了。
 * **余量就是 712 − 700 = 12px**，而且 `712` 是**平台值**不是尖峰：`C ∈ [744, 1062]` 这一段上
 * `T` 恒等于 `W + 32`（`C` 再大，`W` 按 `0.64C` 爬到 920 封顶 ⇒ `T` 到 952；`C ≤ 744` 时改由
 * `C − 32` 说了算）。所以这 12px 不会因为侧栏拖一下就翻（1280 下侧栏 264–420 ⇒ `C = 860–1020`，
 * 仍在平台里）；默认口径下能把 `T` 压到 700 以下的只有 `C < 732`，而那一刻 `T = C − 32`
 * ⇒ **是列宽在压它**，「收起右栏能让这里变宽」这句话在该格才成立。
 * ⛔ 这个 `700` **不是从任何一个量推出来的**：它是票 04「真机严格上限 718、取 700 留余量」那个
 * 决定的残留（今天「不落进那两条透明手柄带」已由 `T ≤ W + 32 ≤ W + 48` 结构性保证，不再靠它兜）。
 * 按 `CONTEXT.md`「工作台的宽度＝输入框的宽度」那一条，**不许**自己按 `--dsh-chat-content-width`
 * 重推一个上限来替换它（用户拖过手柄后真机量到过 `W = 1239`）⇒ 本票只对齐取数与注释，
 * **不动阈值、不动布局**。
 * ⚠️ **我的枚举面比现实窄在哪里**：判据只看得见主区自己那两个数，所以它分不出 `T` 小是因为
 * 中心列窄、还是因为用户把 `W` 拖小了（`W` 可被拖到 640 ⇒ `W + 32 = 672 < 700`）。
 */
export const NARROW_MAIN_WIDTH = 700;

/** 主区右边缘离视口右边这么远（px）就**不排除**「右边被别的东西占着」。
 *
 * ⚠️ 2026-10-06（票 08）复核：它**不再是「右栏开着」的判别者**——收起态因为主区被 `W + 32` 封顶
 * 又水平居中，右边还留着 `(1000 − 712) / 2 = 144px` 的**空列**（≥ 64）；开着态是 `576 + 16 = 592`
 * （也 ≥ 64）。两支都过，所以「过得了这一支」并不说明右栏开着。
 * 它今天真正管的是**反方向**那一格：窗口本身就窄、右栏没开时，主区由 `C − 32` 顶到列沿
 * （按同一算式：视口 780 ⇒ `C = 724`、`T = 692`、右边只剩 16px）⇒ 靠这一支把指错方向的提示压住，
 * 否则「窗口窄」会被误读成「右栏挤的」。**真正的判别者是宽度那一支**（`mainWidth`）。
 * 强度如实：`gap ≥ 64` 只是「右边还有空」的必要条件，不是「右栏开着」的判据。
 * ⚠️ 它也因此**保守**：列被两边同时挤（窗口窄 ＋ 右栏开着）时右边同样只剩十几像素 ⇒ 这一格不提示。
 */
export const SIDEBAR_OPEN_RIGHT_GAP = 64;

/** 那一句提示（纯提示，不点）。含「收起右栏」这个可行动的说法，也点名那颗按钮在顶栏。 */
export const NARROW_MAIN_HINT_TEXT =
	"👉 正文区太窄了。点顶栏那颗「收起右侧边栏」（收起右栏），这里能宽一倍，正文行也不会太长。";

/**
 * 判据（纯函数，可测）：主区是不是被右栏挤窄了。
 *
 * 两个量都来自**主区自己**的盒子（工作台根容器），不读宿主 DOM、不查宿主状态：
 *   · `mainWidth` —— 主区宽度；量不到（页签没激活、盒子还没长出来）一律**不显示**，不猜。
 *     **窄不窄由这一支说了算**（今天 `T` 由 `T = min(C − 32, W + 32)` 给出，见上面那个常量）。
 *   · `mainRightGap` —— 主区右边缘到视口右边的距离。⚠️ 它**不等于**「右栏开着」：收起态也有
 *     144px 的空列（2026-10-06 票 08 复核，数字与理由见上面那个常量）。它今天的作用是压住
 *     「窗口本来就窄」那一格——收起的右边缘贴着列沿时右边只剩十几像素，那一格必须不提示。
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
 * 小条那句「书的进度」**只取值出口的裸词**；说不出就 `null`＝整句不印（票 `ui-systematic-fixes/03`）。
 *
 * 为什么不直接 `statusHuman({ status }, null).word`：`statusHuman` 的输入契约是「一份书的状态投影」，
 * 而 `status` 缺省（`null`／`undefined`／空串）时它会把 `status` 当成 `active`（壳那侧的缺省）——
 * 在这一格上那是**猜**，不是书真在跑。⇒ 没有状态就没有这句（spec 用户故事 2 的「要么干脆不出现」）。
 *
 * @param {unknown} status 状态投影里的那一格（`meta.status`）
 * @returns {string|null} 裸词 ／ 说不出时的 `null`
 */
function footerProgressWord(status) {
	if (typeof status !== "string" || status === "") return null;
	return statusHuman({ status }, null).word;
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
	// 票 `ui-systematic-fixes/03`（spec §问题陈述 1、§1·1）：这一句原来把 `meta.status` 的**机器原值**
	// 直接插进中文句子（「书的进度：running」）。今天**只经值出口取裸词**：
	//   · 闭集登记过 ⇒ 「书的进度：轮到你／我正在做／书做好了」（图标归状态条，这里只要词）；
	//   · 说不出（闭集未登记 ⇒ `word` 是 `null`；或者压根没有状态）⇒ **整句不印**——
	//     顶上那条状态条已经在说同一件事，⛔ 不回退机器原值、也不摆一个「—」占位。
	// ⚠️ 窄处：本组件的 props 袋只有 `status`（壳那一侧各有其票，本票不动 `client-entry.js`）⇒
	// 关卡推理用的 `gate` 传 `null`、暂停也看不见；这两格影响的是「轮到谁」的判定，不是词本身
	// ——小条本来就不抢状态条的话（spec 用户故事 2：要么说人话、要么干脆不出现）。
	const progressWord = footerProgressWord(status);
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
				fontSize: "12px",
			},
		},
		progressWord === null
			? null
			: createElement(
					"span",
					{ style: { opacity: 0.55 } },
					`书的进度：${progressWord}`,
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
						style: { ...S.smallLink, fontSize: "12px", opacity: 0.55 },
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
						style: S.disabled({
							...S.smallLink,
							fontSize: "12px",
							opacity: deleting === true ? 1 : 0.5,
							...(deleting === true
								? { color: "var(--dsw-alias-state-error-primary)" }
								: {}),
						}, busy === true),
						onClick: onDelete,
						disabled: busy === true,
						title: "把这本书移进回收站",
					},
					deleting === true ? "确认取消这本书（进回收站）" : "取消这本书",
				)
			: null,
		// 票 12：确认态的退路（见组件顶部说明）。只在确认态出现、且父级给了回调才渲染；
		// 它只改本地确认态、**不发任何动作**（破坏性动作仍然只有确认那颗发）。
		// 🎯 票 `gold-display-period/05`：正因为这句「只改本地确认态、不发任何动作」，它**不许禁用**
		// （#2 的逐处复核：`busy` 里挡住一条退路 ＝ 造一个「看着能点却点不动」的键）。
		deleting === true && typeof onCancelDelete === "function"
			? createElement(
					"button",
					{
						style: {
							...S.smallLink,
							fontSize: "12px",
							opacity: 0.6,
						},
						onClick: onCancelDelete,
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
				fontSize: "12px",
				lineHeight: 1.5,
				textDecoration: "none",
				borderTop: "1px solid rgba(255, 255, 255, 0.25)",
			},
		},
		createElement("span", { style: { fontSize: "13px" } }, "📚"),
		createElement("strong", { style: { fontSize: "12px" } }, "【线团造书工作台】"),
		createElement("span", null, "是"),
		createElement("span", { style: { fontWeight: 600 } }, "【破卷】"),
		createElement(
			"span",
			{
				style: {
					fontSize: "12px",
					background: "rgba(255,255,255,0.22)",
					borderRadius: "4px",
					padding: "0 5px",
					lineHeight: "15px",
				},
			},
			"衍生项目",
		),
		createElement(
			"span",
			{ style: { marginLeft: "auto", fontSize: "12px" } },
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

// ── 机器产物的人读折叠：实现不住在这里 ───────────────────────────────────────
// ⚠️ 有正文的产物（章节/报告/方案/成品）一律走 DSH 右栏预览，不经这一族（ADR-0010 决策 2）；
// 这里只剩机器产物但**有人读形态**的那两条：知识地图与章节安排（`工作区/outline.md`）——
// 人读形态都是**就地折叠清单**，实现在**中性模块** `machine-product-folds.js`
// （`parseKnowledgeMap` / `foldKnowledgeMap` / `foldOutline`）。
//
// 📌 **票 `depth-review-2026-10/03`**：这两个函数原先住在**这个文件的尾部**，而该文件内部**零调用**
// ——渲染路径上唯一的消费者是阶段页第 2 阶段（知识地图）与第 3 阶段（章节安排）那两块。
// 住址与消费方分离，于是「不许 import，防成环」的三处注释被写了出来（那个环由
// `phase-page → chapters-map` 那条边撑着，边一撤就不存在了）。搬走之后这个文件不再是它们的家。
//
// 📌 **票 `depth-review-2026-10/05` 收尾**：这里原先还留着一行**过渡再导出**（`foldKnowledgeMap`），
// 只为等壳 `client-entry.js` 把那一行 import 改指到 `./ui/machine-product-folds.js`。改指已落地，
// 那行过渡再导出连同它自陈「收尾＝改指然后删掉」的整段注释一并撤掉——留着就是「注释与代码相矛盾」。

