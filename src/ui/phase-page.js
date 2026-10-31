/**
 * 造书工作台 · 阶段页（点阶段片落到的那一页）
 *
 * 用户裁决（2026-09-21，经 `/prototype` 三轮）：阶段片是**导航面**——点一格＝去那一步的
 * 页面，不是打开某份文件。页面本身按每一步的天性**分别定制**（"一刀切"在同一轮原型里被否）：
 *
 *   材料准备    清单页：这一步本身就是「材料准备」（第一步），材料是它的产物行
 *   写完整本    主从两栏：一章三步（写 / 审 / 复核），左栏选一步、右栏看那一步
 *   其余四步    堆叠回看卡：步少，每一步都值得一整张卡（状态/拍板结论/文件/定点修改）
 *
 * ⚠️ **行单位是「步」，不是分段**（票 01 的裁决；候选 06 起见 `stage-step-model`）：本页与全览条
 * 取**同一份步模型**——都吃 `stage-step-model` 的 `project({kind})` projection，行自带
 * `rowText`（四态行的文字与图标，模型是唯一出处）、`detailLines`、`target`、`modify`——
 * 不许在页内再拼一套。
 * 阶段的**专属东西**也各就各位：读材料挑重点摆人读的重点清单、最佳范例章摆稿次与旧稿、
 * 最后检查摆机器逐项检查与 AI 检查报告。
 *
 * 两条硬边界（承 ADR-0010）：
 *  1. 产物一律由写着「打开」的显式按钮交给 DSH 右栏（`onOpen`，只读、不进模型上下文）；
 *     **导航本身不开任何文件**。
 *  2. 机器产物（`工作区/audit-NN.md`）与走卡片内联的（知识地图、章节安排 `工作区/outline.md`）
 *     都不进"文件"清单——判据见 `view-rules.openableArtifacts`；后两者的可读形态由本文件的
 *     `KnowledgeMapBlock` / `OutlineBlock` 就地折叠承担（票 pipeline-wiring-gaps/09）。
 *
 * 「✍️ 定点修改」就地展开确认框：不换屏、不另造一份流程，页脚直接长出「影响预告 + 写一句 + 提交」。
 * 撤销（「↩️ 撤销刚才的定点修改（10 分钟内）」）也归这一页：原来它长在旧的分段单卡里，合并时
 * 随旧卡掉出了渲染路径，2026-09-21 接回这里——**就地改、就地撤**（见 `UndoButton`）。
 * 2026-09-23 票 11 补上两件：① 确认框的影响预告说真话（下游名单由模型译成人读名字）；
 * ② **提交后仍停在这一页**，被改的那一段就地标成「我正在做」（乐观标记，见 `PhasePage` 顶部）。
 * ⚠️ 「回到现在」**不在这一页**（2026-09-22 票 12：它长在阶段片「当前阶段」那一格上）——
 * 阶段页里任何换屏动作都不许有。
 */
import { createElement as h, useEffect, useState } from "react";
import { S } from "./styles.js";
import { checkStateIsNonBlocking } from "../domain-rules.js";
// 票 `ui-display-redesign/18`：阶段页也有卡头了（屏级问句＋事实句）。字号/间距/颜色只在
// `card-head.js` 定义一次，本文件⛔ 不就地另写一份；问句字面量仍留在**本文件**（界面用词一处）。
// ⚠️ 它**不在**人设「界面状态对照表」的取证面里：那个面只读 `S.focus` 卡上的
// `createElement("strong", …)` 字面量（`test-context-vocabulary.mjs` 的窄处 ④），而阶段页
// 根不是焦点卡、本文件又用别名 `h(` —— 两样都不满足。所以这里**不冒充**「人设逐字引着它」。
import { CardHead, CARD_HEAD_QUESTION_STYLE } from "./card-head.js";
// 票 `ui-display-redesign/18`：阶段 6 的 AI 报告走「摘要〔首〕＋全文〔折〕」，与站 11／交付页
// **同一份口径**（`aiReportSummary` 是截摘要的唯一出处，⛔ 本文件不另写一份截断逻辑）。
// 它们是 `event-cards.js` 的 public export（AGENTS.md「Frontend layout」：跨域只走 public exports）。
import { AI_REPORT_FOLD_SUMMARY, aiReportSummary } from "./event-cards.js";
import {
	checkHuman,
	stepWord,
	PHASE_UI,
	materialConversionActivityText,
	convertedIcon,
	convertedState,
	// 票 `pre-gold-build/02`：材料行上的**角色**取自合并件 `materials[].role`，而「这一份是第几号」
	// 要用与分片／细目／档位**同一份口径**的数法 ⇒ 序号从这里取（⛔ 本文件不另写一套过滤）。
	okMaterialShards,
	originalPreviewOpenable,
	originalSourceRel,
	// 票 `demo-flow-fidelity/06`：演示书那句提示（与终检认可卡**同一句**）与它的判据。
	demoQualityChecksNote,
	isDemoBook,
} from "./view-rules.js";
// 「打开这份文件」按钮：票 09 起住中性模块（章节卡也要用它，直接从本文件 import 会成环，
// 理由见那一件顶部的注释）——本文件原样**再导出**它，票 02 的导出表面不变。
import { OpenArtifactButton } from "./open-artifact-button.js";
// 机器产物（知识地图 / 章节安排 `工作区/outline.md`）的人读折叠：**中性模块**，零 react 依赖、
// 零域词，形状知识只此一份（原来住在 `chapters-map.js` 尾部而该文件内部零调用——票
// `depth-review-2026-10/03` 收编）。同源、但**措辞各自成篇**：下面 `KnowledgeMapBlock` 与
// `OutlineBlock` 用折叠那一份，源探查确认卡另有一份自己的说法（既有裁决，不许统一）。
import { foldKnowledgeMap, foldOutline, parseKnowledgeMap } from "./machine-product-folds.js";
// 票 `knowledge-graph-build/12`：老书那颗「补一份知识点图」的键 ＋ 补出来的图那一块（**只读**）。
// 它住在自己的域文件里（可见性三条、回执、图那一块的抬头都在那一份里）；本文件只负责
// 「摆在哪一屏的哪一行」——「AI 挑出来的重点」那一块里、与抬头同一行（票面 A 段）。
import { KnowledgeGraphBackfillBody, KnowledgeGraphBackfillKey } from "./knowledge-graph-backfill.js";
// 票 `reader-cognition-boundary-build/10`：老书那颗「补一份读者边界」的键 ＋ 能划的那张图
// （与补图那块**并列而不同物**：这块能划、落剔除记录、记另一笔账）。可见性四档与那句核心承诺
// 都住在它自己的域文件里，本文件只负责摆在这一屏的同一张卡上。
import { ReaderBoundaryBackfillBlock } from "./reader-boundary-backfill.js";
// 票 02（`workbench-card-contract`）：「这张卡吃什么」写在**卡旁边**，不写在壳里。声明式本身
// 住在中性 module `card-view.js`（零 react 依赖、零域词）——见下面 `phasePageView`。
import { defineCardView } from "./card-view.js";

// 每个阶段用哪套布局（用户裁决的那张表；改它等于改设计，别顺手改）。
const PHASE_LAYOUT = Object.freeze({
	1: "materials",
	2: "stack",
	3: "stack",
	4: "stack",
	5: "split",
	6: "stack",
});

/**
 * 阶段页的屏级问句（票 `ui-display-redesign/18`，spec §2.12–2.14 第 1 块）。
 *
 * ⚠️ 它是**屏级新写**、⛔ **不进** `decisionOf`（那是 8 个决策站既有问句的唯一出口；阶段页没有
 * 要你拍板的那一问）。字面量必须留在**本文件**（`card-head.js` 文件头的取证面理由）。
 */
const PHASE_PAGE_QUESTION = "这一阶段走到了哪、产出了什么？";

/**
 * 浏览某一步的屏级问句（票 `ui-display-redesign/19`，spec §2.15 第 1 块）。
 *
 * ⚠️ 它是**屏级新写**、⛔ **不进** `decisionOf`；更重要的是它**不是步级问句**——
 * 盘上只有 `DECISION_QUESTION`（按决策键、不按步 key）那一份，本文件⛔ 不造「步 key → 问句」映射
 * （batch2 表 §九 风险 1）。所以四块的第 ① 块叫「这一步是什么」、不叫「要回答什么」。
 */
const BROWSE_QUESTION = "这一步是什么、产出了什么、你定过什么？";

/**
 * 浏览态四块的**块名**（票 `ui-display-redesign/19`，spec §2.15 第 3–6 块）。
 *
 * ⚠️ 这里只放**字面量**：四张卡的内容各不相同，`BrowseBody` 仍是四段硬编码的 JSX（顺序由
 * 代码读得出），⛔ 别把它说成「按这个对象迭代」。这个对象的用途是「块名只写一次」——
 * 生产四块与判据读同一串字面量。
 */
const BROWSE_BLOCKS = Object.freeze({
	what: "① 这一步是什么",
	produced: "② 产出了什么",
	judged: "③ 判了什么",
	decided: "④ 你定过什么",
});

/** 非章段没有机器检查（spec §2.15 第 5 块；只有章段带 `row.auditSummary`）。 */
const BROWSE_NO_AUDIT = "这一步没有机器检查。";

/** 没有要你拍板的事（spec §2.15 第 6 块）：记录仍在屏下的「▸ 之前的过程」里。 */
const BROWSE_NO_DECISION = "没有要你拍板的事。";
const BROWSE_DECISION_POINTER = "当时的记录在下面的「▸ 之前的过程」里。";

const P = {
	head: { display: "flex", alignItems: "baseline", gap: "10px", margin: "0 0 2px" },
	// 票 18（spec §2.14 第 5 块）：阶段 5 的「打开」要留在 1280×720 首屏内。行高从默认 1.6
	// 收到 1.25、intro 下边距与几处小间距各收 2–4px——**字号一个没动**（这是压缩间距，不是换字号档）。
	// 读数（`.scratch/gallery-readings/uib2-phase-readings.json`）：「打开」y≈683.8、盒底 710.8 < 720；
	// 旧读数 y≈737.7。
	headTitle: { fontSize: "16px", fontWeight: 700, lineHeight: 1.25 },
	intro: { fontSize: "12px", opacity: 0.7, margin: "4px 0 4px" },
	sectionLabel: { fontSize: "12px", fontWeight: 600, opacity: 0.75, margin: "0 0 6px" },
	// 票 19：浏览态四块各自的块名一档——与阶段页的 `sectionLabel` 分开，因为四块是**卡级**
	// 结构（每块一张卡），不是卡内小标签。字号/颜色仍只在这一处定义。
	browseBlockTitle: { fontSize: "13px", fontWeight: 600, margin: "0 0 6px" },
	browseMeta: { fontSize: "12px", opacity: 0.65, margin: "2px 0 0" },
	row: {
		display: "flex",
		alignItems: "center",
		gap: "8px",
		padding: "7px 10px",
		borderRadius: "8px",
		border: "1px solid var(--dsw-alias-border-l2)",
		marginBottom: "6px",
		background: "var(--dsw-alias-bg-base)",
		fontSize: "13px",
	},
	kindTag: {
		fontSize: "12px",
		padding: "1px 6px",
		borderRadius: "999px",
		background: "var(--dsw-alias-bg-skeleton)",
		opacity: 0.85,
		whiteSpace: "nowrap",
	},
	empty: { fontSize: "12px", opacity: 0.65, margin: "6px 0" },
	pre: {
		whiteSpace: "pre-wrap",
		margin: "8px 0 0",
		padding: "8px 10px",
		borderRadius: "8px",
		// 产物代码块走宿主自己的「代码块底色」语义，不复用通用骨架底色（票 19 路线 A；
		// 取值见 docs/reference/dsh-theme-token-contracts.md §2）。
		background: "var(--dsw-alias-markdown-code-block)",
		fontSize: "12px",
		maxHeight: "260px",
		overflow: "auto",
		fontFamily: "inherit",
	},
};

/** 一步的产物事实明细：与全览条共用行上的 `detailLines`，只作第二视觉行，不碰四态行。 */
function StepDetailLines(props) {
	const lines = Array.isArray(props.step?.detailLines) ? props.step.detailLines : [];
	if (lines.length === 0) return null;
	return h(
		"div",
		{ style: { marginTop: "2px" } },
		...lines.map((line, index) =>
			h(
				"span",
				{
					key: `detail-${index}`,
					style: {
						display: "block",
						fontSize: "12px",
						lineHeight: "1.35",
						opacity: 0.72,
					},
				},
				line,
			),
		),
	);
}

/**
 * 票 09：`OpenArtifactButton` 已搬去中性模块 `./open-artifact-button.js`。这里**原样再导出**，
 * 票 02 的导出表面（`test-phase-page.js` 的测试与 `client-entry.js` 都按本文件取它）保持不变。
 *
 * 📌 **它当初搬走的那条理由已经不存在了**（票 `depth-review-2026-10/03`）：当时本文件为了
 * `foldKnowledgeMap` import 了 `chapters-map.js`，反向 import 会成环。那两个折叠函数今天住在
 * 第三个文件——中性模块 `./machine-product-folds.js`（零 import、不认识任何一张卡），
 * 于是 `phase-page → chapters-map` 这条边已经撤掉，环本来就不存在了。
 * ⚠️ 本文件**继续**不 import `chapters-map.js`：那是界面层另一个域的渲染件，与本页无关；
 * 真要引它的理由也不会是「防成环」——是「这个域的东西真的进得来吗」。`test-phase-page.mjs`
 * 的「依赖方向」那条源码级断言钉住这一条。
 */
export { OpenArtifactButton };

/**
 * 阶段页上「点『打开』…」那句说明（**全页一次**）。
 *
 * 2026-09-21 用户要求：文件是开在**右边**的，卡片上得先说一句，否则点完不知道内容去哪了。
 * 票 `ui-display-redesign/18`（spec §2.13 第 8 块）：这句话原来**每张步卡重复一遍**，现在
 * 收成页级一句、全页只印一次——放在主体之后（页尾），只有这一页真的摆了「打开」才印。
 */
const OPEN_NOTE = "点「打开」，内容会在右侧打开给你看（只读，不影响造书）。";

/**
 * 产物行的一格：`[类型] 名字 [打开]`。阶段页的文件行（`StepFileRow`）与浏览态四块的 ②
 * 共用这一份——两处曾经各写一遍同形状的 `<span>`，改一处必然漂一处。
 */
function ArtifactChip(props) {
	const { item, onOpen } = props;
	return h(
		"span",
		{ style: { display: "inline-flex", alignItems: "center", gap: "6px" } },
		h("span", { style: P.kindTag }, item.kind),
		h("strong", { style: { fontSize: "12px" } }, item.label),
		// 「打开」跟在自己那份产物名字后面（不是被推到行尾）：`marginLeft:auto` 是「产物行」
		// 那种整行只放一颗按钮时的对齐，这里要显式归零。
		h(OpenArtifactButton, { item, onOpen, style: { marginLeft: 0 } }),
	);
}

/**
 * 行上的产物把**步 key** 带上：同段三步共用一个 `segment`，`item.stepKey` 是列表的稳定 key
 * （`StackBody`／`SplitBody`／`BrowseBody` 三处同一份口径，⛔ 不各抄一遍 `map`）。
 */
const artifactsOf = (row) => row.artifacts.map((item) => ({ ...item, stepKey: row.key }));

/**
 * 这一步的文件行（票 `ui-display-redesign/18`，spec §2.13 第 6–7 块）：
 * `这一步的文件：`＋每份一个 `打开`＋`✍️ 定点修改这一步` **同一行右端**。
 *
 * 旧形态是三层竖排（标签一段、说明一段、每份一整行），一屏几个步就长出几十行；现在压成一行。
 * 「点『打开』…」那句说明**不在这里**（页级一次，见 `OPEN_NOTE`）——别再写回来。
 * 空清单仍说清"这份步没有文件"（`emptyText` 由调用方按步态给），那一支没有「打开」，只有一句。
 */
function StepFileRow(props) {
	const { artifacts, onOpen, emptyText, row, onDeepModify, busy, openKey, onOpenKey } = props;
	const items = artifacts.map((item) =>
		h(ArtifactChip, { key: `${item.stepKey ?? ""}::${item.path}`, item, onOpen }),
	);
	return h(
		"div",
		{
			style: {
				display: "flex",
				alignItems: "center",
				flexWrap: "wrap",
				gap: "8px",
				marginTop: "4px",
				fontSize: "12px",
			},
		},
		h("span", { style: { ...P.sectionLabel, margin: 0 } }, "这一步的文件："),
		items.length === 0
			? h("span", { style: { ...P.empty, margin: 0 } }, emptyText ?? "这一步没有留文件。")
			: items,
		// 同屏只能开一个确认框（见 `DeepModifyLink` 顶部说明）：状态提到布局那一层，兄弟卡才互斥。
		h(DeepModifyLink, { row, onDeepModify, busy, openKey, onOpenKey }),
	);
}

/**
 * 一步的页脚：定点修改。
 *
 * 就地展开确认框（影响预告 + 写一句 + 提交），不把人送到那一段的回看视图——用户原话
 * 「点了修改这一步，然后又跳到过程地图的那个里面去让我修了」「为什么非得跳一下？」。
 *
 * ⚠️ **同一屏只能开一个确认框**（`openKey` 由父组件持有）：后端 `deep-modify` 一次只认一个
 * segment，`lastDeepModify`（撤销窗口读的就是它，见 `chapters-map.js` 的 `undoable`）也只记**一条**。
 * 两个框同时开着真提交两笔，第二笔会覆盖第一笔的撤销记录——「10 分钟内可一键撤销」当场失效。
 * 所以这里不是样式问题，是**不许出现两个待提交的确认框**。
 */
function DeepModifyLink(props) {
	const { row, onDeepModify, busy, openKey, onOpenKey } = props;
	const [note, setNote] = useState("");
	// 候选 06：写意图只看行上的 `modify`（模型已把「有真实段 + 段允许定点修改」判完）；
	// 材料准备 / 合成章步 / 异常 identity 的 `modify:null` ——本页不再自己判 `canDeepModify`，
	// 也不拿 `row.segmentKey ?? row.key` 猜提交目标。
	if (row.modify === null || row.modify === undefined) return null;
	const open = openKey === row.key;
	const close = () => {
		onOpenKey(null);
		setNote("");
	};
	if (!open) {
		return h(
			"button",
			{
				// 🎯 票 `gold-display-period/05`：这颗**有意不禁用**（#2 的逐处复核）——它只
				// `onOpenKey(row.key)`（`StackBody` 的 `setOpenKey`，展开就地改的那张表单），
				// 提交那一笔在表单里（下面那颗「✍️ 就这么改，重做下游」照旧禁用）。
				// 票 18：它固定在文件行右端（唯一调用点在 `StepFileRow`）；展开后的确认框另起一行。
				style: { ...S.smallLink, marginTop: 0, marginLeft: "auto" },
				onClick: () => onOpenKey(row.key),
				title: "就地改决定并重做下游（不离开这一步）",
			},
			"✍️ 定点修改这一步",
		);
	}
	// 票 11：`row.downstream` 由**模型**从段上的 `seg.downstream`（服务端
	// `deepAffected` 的**段 key** 数组）译好——出口已是人读名字（`segmentHuman`），页里不许
	// 再碰 key，也不许在 tooltip 里补一份机器词（CONTEXT.md「界面用词表」）。
	const downstream = row.downstream ?? [];
	return h(
		"div",
		{
			style: {
				marginTop: "8px",
				borderTop: "1px dashed var(--dsw-alias-border-l2)",
				paddingTop: "8px",
				// 展开后的确认框**独占一行**：文件行是 flex，`flexBasis:100%` 让它换行铺满。
				flexBasis: "100%",
			},
		},
		h("p", { style: { margin: "0 0 6px", fontWeight: 600 } }, `✍️ 定点修改「${row.title}」`),
		h(
			"p",
			{ style: { margin: "0 0 6px", fontSize: "12px", color: "var(--dsw-alias-state-error-primary)" } },
			downstream.length === 0
				? "影响预告：这一步之后没有下游要重做。"
				: `影响预告：这一步改了，这些要一起重做：${downstream.join("、")}。`,
		),
		h(
			"p",
			{ style: { margin: "0 0 6px", fontSize: "12px", opacity: 0.75 } },
			"你的风格线和豁免原样保留；该拍板的步仍会来请你拍板；旧版本会归档留底；最近一次修改，10 分钟内可以一键撤销。",
		),
		// 同屏一次只能改一处：说清为什么，别让用户以为是界面坏了。
		// ⚠️ 票 14（承诺账 A1/A2，来源票 09 的裁决）：原来那句「一次只能改一步——先提交这一处，
		// 再改下一处」**做不到**——提交后守卫立刻挡住第二笔（深改结尾把 meta.status='running'、
		// pendingStage 指回被改段），得等整轮重做跑完、或先 ⏸ 暂停。这里改成能兑现的说法并指路。
		h(
			"p",
			{ style: { margin: "0 0 6px", fontSize: "12px", opacity: 0.6 } },
			"一次只改一处：提交后 AI 会先重做这一步；想接着改下一处，等它做完，或先 ⏸ 暂停。",
		),
		// 票 14（来源票 09）：撤销单位＝**最近一次提交**（`lastDeepModify` 只记一条）——在撤销窗内
		// 再改一处，上一笔的撤销入口就失效了。提交第二笔前先把代价说清（不许等用户撞上才发现）。
		h(
			"p",
			{ style: { margin: "0 0 6px", fontSize: "12px", opacity: 0.6 } },
			"撤销只覆盖最近一次提交——提交这一处后，上一次的撤销入口会失效。",
		),
		h("textarea", {
			style: S.textarea,
			placeholder: "这次要改成什么？写一句（必填）",
			value: note,
			onChange: (e) => setNote(e.target.value),
		}),
		h(
			"div",
			{ style: { marginTop: "8px", display: "flex", gap: "8px" } },
			h(
				"button",
				{
					style: S.disabled(S.bigBtn(false), busy === true || note.trim() === ""),
					disabled: busy === true || note.trim() === "",
					onClick: () => {
						// ⚠️ 定点修改的粒度是**段**（票 01 Q9 / ADR-0014）：步比段细，交出去的一律是
						// 段 key（`chapter-1:write` 这种步 key 后端不认；点在章内任何一步上＝整章重做）。
						// 候选 06：目标直接取模型判好的 `row.modify.segmentKey`——页面不再兜底猜。
						onDeepModify?.(row.modify.segmentKey, note.trim());
						onOpenKey(null);
						setNote("");
					},
				},
				"✍️ 就这么改，重做下游",
			),
			h("button", { style: S.smallLink, onClick: close }, "取消"),
		),
	);
}

// ── 布局一：堆叠回看卡（步少而每一步都值得一整张卡）────────────────────────

function StackBody(props) {
	const { steps, onOpen, onDeepModify, busy } = props;
	// 同一屏只能开一个确认框（见 DeepModifyLink 顶部说明）：状态提到这一层，兄弟卡才互斥。
	const [openKey, setOpenKey] = useState(null);
	return h(
		"div",
		null,
		...steps.map((row) =>
			h(
				"div",
				{
					key: row.key,
					// 票 19：焦点描边已随浏览态独立四块退役（`browsing` 不再渲染这一支；
					// 阶段页态从来不带 `focusedStep`）。⛔ 别再在这里加回「你点的是这一个」的圈。
					style: S.card,
				},
				h(
					"div",
					{
						style: {
							display: "flex",
							justifyContent: "space-between",
							alignItems: "baseline",
							gap: "10px",
						},
					},
					// 四态行（票 04 抽出、票 05 接线）：图标 + 步名 + 状态词走全览条清单同一份
					// 行上的 `row.rowText`，本页不再自己拼一份。
					h("strong", { style: { fontSize: "13px" } }, row.rowText),
				),
				h(StepDetailLines, { step: row }),
				row.decision !== null
					? h("p", { style: { margin: "6px 0 0", fontSize: "12px" } }, `拍板：${row.decision}`)
					: null,
				// 票 18（spec §2.13 第 7 块）：文件行压成一行，「定点修改」并进同一行右端。
				h(StepFileRow, {
					artifacts: artifactsOf(row),
					onOpen,
					emptyText: row.status === "pending" ? "还没到这一步。" : undefined,
					row,
					onDeepModify,
					busy,
					openKey,
					onOpenKey: setOpenKey,
				}),
			),
		),
	);
}

// ── 布局二：主从两栏（每章三步：左栏一步步选、右栏看那一步）─────────────────

/**
 * 选中一章时，右栏给它的机器检查结论摘要。
 *
 * `issues[].text` 已经是检查契约要求的大白话（问题、原因、建议怎么改），这里原样摆出；
 * 不再套一层有限词表，免得把具体卡点翻成泛化标签。原始 audit JSON 仍不进入右栏。
 *
 * 票 `ui-display-redesign/18`（spec §2.14 第 5 块）：这一块改成**紧凑两段**——结论并进标题行
 * （`机器检查结论：✅ 这一章通过了`），条数标签并进**第一条**问题行（`卡在 2 处：1. …`）。
 * 理由不是好看：阶段 5 右卡的「打开」原来在 1280×720 下 y≈737.7 掉出首屏，而卡头问句＋事实句
 * 又占了上面两行；不把这一块的四个竖排段落收成两行，首屏就放不下（裁决见票面验收）。
 * 文字一条都没少：结论、条数、每一条问题的人话原文都照旧逐条在屏上。
 */
function ChapterAuditSummary(props) {
	const summary = props.summary ?? null;
	const label = h("span", { style: { opacity: 0.75 } }, "机器检查结论：");
	if (summary === null)
		return h(
			"div",
			{ style: { marginTop: "6px" } },
			h("p", { style: { ...P.sectionLabel, margin: "0 0 2px" } }, "机器检查结论"),
			h("p", { style: { ...P.empty, margin: 0 } }, "还没有检查结论。"),
		);

	const passed = summary.passed === true;
	const issues = Array.isArray(summary.issues) ? summary.issues : [];
	const issueCount = Number.isSafeInteger(summary.issueCount) ? summary.issueCount : issues.length;
	const countLabel = passed ? `另有 ${issueCount} 处提醒：` : `卡在 ${issueCount} 处：`;
	return h(
		"div",
		{ style: { marginTop: "4px" } },
		// 结论与标题同一行（省一行；色只落在结论那半句上，标题仍是弱化的标签）。
		h(
			"p",
			{ style: { margin: 0, fontSize: "12px", fontWeight: 600 } },
			label,
			h(
				"span",
				{ style: { color: passed ? "var(--dsw-alias-state-success-primary)" : "var(--dsw-alias-state-error-primary)" } },
				passed ? "✅ 这一章通过了" : "❌ 这一章还没通过",
			),
		),
		issueCount === 0
			? h(
					"p",
					{ style: { ...P.empty, margin: "2px 0 0" } },
					passed ? "没有卡点。" : "检查记录没有列出具体问题。",
				)
			: issues.length === 0
				? h(
						"p",
						{ style: { margin: "2px 0 0", fontSize: "12px" } },
						`${countLabel}检查记录没有列出具体问题。`,
					)
				: issues.map((issue, index) =>
					h(
						"p",
						{
							key: `${index}:${issue.text}`,
							style: { margin: 0, fontSize: "12px" },
						},
						// 条数标签与第一条并排（不再单占一行）：`卡在 2 处：1. …`／`另有 1 处提醒：1. …`。
						index === 0 ? `${countLabel}${index + 1}. ${issue.text}` : `${index + 1}. ${issue.text}`,
					),
				),
	);
}

// ── 布局四：浏览某一步＝独立四块（票 19）────────────────────────────────────

/**
 * 浏览态主体：**独立四块**，不再是「同一张阶段页 ＋ 焦点描边」。
 *
 * 依据：spec §2.15（逐字源 `batch2-table-v1.md` §六）＋ 裁决 `design-draft.md` §7.12 第 4 条。
 * 它回答四个问题（① 是什么 ② 产出了什么 ③ 判了什么 ④ 你定过什么），卡头是**屏级**问句与事实句。
 *
 * 四条硬边界（都写在票面，改这里先读票）：
 *   · ⛔ **不造步级问句**：① 只叫「这一步是什么」。盘上没有按步 key 的决策问句，唯一那份
 *     `DECISION_QUESTION` 是按决策键的（见 `view-rules`），硬造一张表就是第二份枚举。
 *   · ③ **只有章段**有机器检查结论（`row.chapter !== null` ⇔ 段是 `chapter`）；非章段明说没有。
 *   · ④ **只有关卡/gold 段**有拍板句（`row.decision !== null`，与阶段页 `拍板：` 同一个来源）；
 *     其它段明说没有，并指到屏下的「▸ 之前的过程」——那条回放是**壳**渲染的，本组件不摆它，
 *     也不碰 `events` 契约（浏览态仍然没有 `events`）。
 *   · 焦点描边**不做**：浏览态是独立主体。`StackBody` 的旧描边分支已随本票删除——阶段页态
 *     （`viewPhase` 路径）本来就不带 `focusedStep`，描边在那边也只是死分支，不是本组件的分支。
 *
 * ⚠️ **它是被 `focusedStep` 选中的那一族渲染**，不是新加的可点区域、不换 mount 点：壳仍从
 * `cardView.phasePageBrowse` 这一行渲同一个 `PhasePage`，位置契约（阶段片在两页点之前）不变。
 * ⚠️ 切步整棵重挂仍由壳的 `key: seg-${browsing}` 负责（本组件无跨步状态；`openKey` 随重挂归零，
 * 票面允许）。
 */
function BrowseBody(props) {
	const { row, phase, phaseName, intro, stepIndex, stepTotal, onOpen, onDeepModify, busy } = props;
	// 同屏一次只能开一个定点修改确认框（理由见 `DeepModifyLink` 顶部）；浏览态只有这一处入口。
	const [openKey, setOpenKey] = useState(null);
	const artifacts = artifactsOf(row);
	const phaseNo = Number.isInteger(phase) ? String(phase) : "?";
	// 卡头事实句（spec §2.15 第 2 块；无中点版本见 `design-draft.md` §7.14 第 1 条）。
	// 状态词取行上那一份（`row.statusWord`）——浏览到的可能是还没走到的步，不能一律印「已完成」。
	const facts = `第 ${phaseNo} 阶段：第 ${stepIndex} 步 / 共 ${stepTotal} 步，${row.statusWord}。`;
	return h(
		"div",
		null,
		h(CardHead, {
			question: h("strong", { style: CARD_HEAD_QUESTION_STYLE }, BROWSE_QUESTION),
			facts,
		}),
		// ① 这一步是什么：四态行（与全览条同一份 `rowText`）＋ 所属阶段 ＋ 这一阶段做什么。
		// 「这一步做什么」取 stage intro（存量、`projection` 已算好的那句）——⛔ 不新写一句按步的描述；
		// 步/第几步由上面的事实句说一次，这里不重复印（原型 `?screen=browse` 同形）。
		h(
			"div",
			{ style: S.card },
			h("p", { style: P.browseBlockTitle }, BROWSE_BLOCKS.what),
			h("strong", { style: { fontSize: "13px" } }, row.rowText),
			h("p", { style: P.browseMeta }, `所属阶段：${phaseName}（第 ${phaseNo} 阶段）`),
			h("p", { style: { margin: "6px 0 0", fontSize: "12px" } }, intro),
			row.sourceNote === null || row.sourceNote === undefined
				? null
				: h("p", { style: { ...P.empty, margin: "4px 0 0" } }, row.sourceNote),
		),
		// ② 产出了什么：可打开产物按钮 ＋ 产物事实；没有可打开产物时一句空态。
		h(
			"div",
			{ style: S.card },
			h("p", { style: P.browseBlockTitle }, BROWSE_BLOCKS.produced),
			artifacts.length === 0
				? h("p", { style: { ...P.empty, margin: 0 } }, "这一步没有留可打开的文件。")
				: h(
						"div",
						null,
						h(
							"div",
							{ style: { display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" } },
							...artifacts.map((item) =>
								h(ArtifactChip, { key: `${item.stepKey ?? ""}::${item.path}`, item, onOpen }),
							),
						),
						row.factText === "" || row.factText === undefined
							? null
							: h("p", { style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.72 } }, row.factText),
						// 与阶段页同一句「打开」说明；只有这一块真的摆了「打开」才印（⛔ 不在页尾再印一份）。
						h("p", { style: { ...P.empty, margin: "6px 0 0" } }, OPEN_NOTE),
					),
		),
		// ③ 判了什么：章段＝机器检查结论（`ChapterAuditSummary` 与阶段 5 右卡同一份组件）；
		// 非章段＝明说「这一步没有机器检查」。
		h(
			"div",
			{ style: S.card },
			h("p", { style: P.browseBlockTitle }, BROWSE_BLOCKS.judged),
			row.chapter !== null
				? h(ChapterAuditSummary, { summary: row.auditSummary })
				: h("p", { style: { margin: 0, fontSize: "12px" } }, BROWSE_NO_AUDIT),
		),
		// ④ 你定过什么：拍板结论只有关卡/gold 段有（`row.decision`）；其它段指到屏下的过程回放。
		h(
			"div",
			{ style: S.card },
			h("p", { style: P.browseBlockTitle }, BROWSE_BLOCKS.decided),
			row.decision !== null
				? h("p", { style: { margin: 0, fontSize: "13px" } }, `拍板：${row.decision}`)
				: h(
						"div",
						null,
						h("p", { style: { margin: 0, fontSize: "12px" } }, BROWSE_NO_DECISION),
						h("p", { style: { ...P.empty, margin: "4px 0 0" } }, BROWSE_DECISION_POINTER),
					),
		),
		// ⑦ 定点修改这一步（条件＝`row.modify`）；⑧「▸ 之前的过程」由壳接在本页之后，不在这里。
		h(DeepModifyLink, { row, onDeepModify, busy, openKey, onOpenKey: setOpenKey }),
	);
}

function SplitBody(props) {
	const { steps, onOpen, onDeepModify, busy } = props;
	// 同一屏只能开一个确认框（见 DeepModifyLink 顶部说明）。
	const [openKey, setOpenKey] = useState(null);
	// 票 19：这一支只在**阶段页态**渲染（浏览态走 `BrowseBody`）⇒ 右卡初值恒为第一行；
	// 旧「从步清单点进来直接停在那一步」的 `focusedStepKey` 分支已随浏览态独立四块退役。
	// hook 一律在任何提前 return 之前（第 2 轮踩过 React #310：换书/换阶段会变 hook 数）。
	const [picked, setPicked] = useState(0);
	const row = steps[Math.min(picked, steps.length - 1)] ?? null;
	if (row === null) return null;
	return h(
		"div",
		{ style: { display: "flex", gap: "10px", alignItems: "flex-start" } },
		h(
			"div",
			{
				style: {
					width: "190px",
					flexShrink: 0,
					border: "1px solid var(--dsw-alias-border-l2)",
					borderRadius: "10px",
					padding: "6px",
					maxHeight: "360px",
					overflowY: "auto",
				},
			},
			...steps.map((item, index) =>
				h(
					"button",
					{
						key: item.key,
						style: {
							display: "block",
							width: "100%",
							textAlign: "left",
							border: "1px solid transparent",
							// 判据 5（票 04）：嵌套同心圆角 = 外层 10px − 间距 6px（外框 padding）＝ 4px。
							// ⚠️ 改外框 padding（上面 `padding: "6px"`）就要同批重算这里。
							borderRadius: "4px",
							padding: "6px 8px",
							margin: "0 0 2px",
							fontSize: "12px",
							cursor: "pointer",
							color: "inherit",
							background:
								index === picked ? "var(--dsw-alias-state-business-tertiary)" : "transparent",
							opacity: item.status === "pending" ? 0.55 : 1,
						},
						onClick: () => setPicked(index),
					},
					// 四态行（候选 06 收进模型）：左栏一行一步，与全览条清单同一份 `row.rowText`。
					item.rowText,
				),
			),
		),
		h(
			"div",
			// 票 18（spec §2.14 第 5 块）：「打开」必须在 1280×720 首屏内（旧读数 y≈737.7 掉出）。
			// 文件行压成一行是主要手段，右卡的内边距再收一点（12px → 8px）。
			{ style: { ...S.card, flex: 1, marginBottom: 0, padding: "8px 12px" } },
			h(
				"div",
				{
					style: {
						display: "flex",
						justifyContent: "space-between",
						alignItems: "baseline",
						gap: "10px",
					},
				},
				// 右栏那一行（四态行，与全览条同一份）：状态词在行文里，不再另起一格。
				h("strong", { style: { fontSize: "13px" } }, row.rowText),
			),
			h(StepDetailLines, { step: row }),
			row.decision !== null
				? h("p", { style: { margin: "6px 0 0", fontSize: "12px" } }, `拍板：${row.decision}`)
				: null,
			row.chapter !== null
				? h(ChapterAuditSummary, { summary: row.auditSummary })
				: null,
			// 票 18（spec §2.14 第 4–5 块）：右卡的文件行同样压成一行，让「打开」留在首屏。
			h(StepFileRow, {
				artifacts: artifactsOf(row),
				onOpen,
				emptyText: row.status === "pending" ? "还没到这一步。" : undefined,
				row,
				onDeepModify,
				busy,
				openKey,
				onOpenKey: setOpenKey,
			}),
		),
	);
}

// ── 布局三：材料清单（阶段 1 那一步就是「材料准备」本身）────────────────────

/**
 * 这一份材料有没有**转换稿**可开（`converted === 'ok'` 且转换稿文件名在）。
 *
 * 阶段 1 的「打开」按钮与页级那句「点『打开』…」（要不要印）用**同一份判据**：
 * 两处各写一遍，迟早一处按 `converted === true`、另一处认 `'ok'`。
 */
function convertedOpenable(source) {
	return convertedState(source) === "ok" && typeof source.md === "string" && source.md !== "";
}

/**
 * 阶段 1 的那一步。
 *
 * 票 01 Q2/Q3 的裁决：**材料准备本身就是第一步**（判据＝书已进阶段 2，见模型的 `materialStepStatus`），
 * 不是"零步阶段"。所以这里摆的是**那一步**（名字 + 四态词，与全览条同一份 `rowText`），
 * 材料清单是它的产物行。旧那句写死的「这一步没有小步：把材料传上来…」与这条裁决直接矛盾，
 * 2026-09-23（票 05）已删——别再写回来。
 */
function MaterialsBody(props) {
	const sources = props.sources ?? [];
	const step = props.step;
	const conversionText = materialConversionActivityText(props.meta, props.events);
	// ⚠️ **票 `pre-gold-build/02`：这一行上的角色改读合并件 `materials[].role`** ——它由探查段
	// 开头那一趟书级材料判定产出、交工那一刻机器按 `num` 并进 `工作区/knowledge-map.json`。
	// ⛔ 不再读 `meta.sources[].role`（老书留下的老值只读、不冒充新事实）。
	// 「探查交工前不显示角色」是**自然结果**：那一刻合并件还没诞生 ⇒ `knowledgeMapText` 为空
	// ⇒ 每个角色都是 `null` ⇒ 括号整块不印。序号用 `okMaterialShards()` 现算（与分片／细目／档位
	// **同一份口径**，⛔ 不在这里另写一套「转换完成」过滤）。
	const km = parseKnowledgeMap(props.knowledgeMapText);
	const roleByNum = new Map(
		(km === null ? [] : km.materials).map((material) => [
			material?.num,
			typeof material?.role === "string" && material.role !== "" ? material.role : null,
		]),
	);
	const numBySource = new Map(okMaterialShards(sources).map(({ n, source }) => [source, n]));
	/** 这一份材料在合并件里的角色（读不到／没转成／判定没覆盖 ⇒ `null`，⛔ 不补空值）。 */
	const roleOf = (source) => {
		const n = numBySource.get(source);
		return n === undefined ? null : roleByNum.get(n) ?? null;
	};
	/**
	 * 一行材料上的**入口**（票 `mineru-formats/11` / `ADR-0029`）：
	 *   - 「打开原件」：**非 PDF** 的原件给（`ADR-0011` 决策 2 的**按格式例外**，不是推翻它——
	 *     照片的原件就是最好的核对对象，而 14 种格式里 9 种转换质量未标定）。判据读
	 *     `originalPreviewOpenable`（`family` 派生），**不在这层判后缀**；
	 *   - 「打开」：转换稿那一份（票 10 的行的形状＝[名字] + [打开]，文案一个字不动）。
	 *
	 * ⚠️ **两个入口都是纯导航**（承 `ADR-0010` 决策 1/6）：点一下只把工作区相对路径交给
	 * `props.onOpen` → DSH 右栏，**不落账、不发动作、不建旁路**——用户在这里读到的东西永不
	 * 进入模型请求。⚠️ 通道是**宿主的**阅读器，它在图片／PPTX 上的渲染能力属宿主事实（本仓
	 * 没有随库的契约快照可查，见票 11 的 `## Comments`）；本层只管给不给这个入口。
	 */
	const entriesFor = (source) => {
		const buttons = [];
		if (originalPreviewOpenable(source.file))
			buttons.push(
				h(OpenArtifactButton, {
					item: { path: originalSourceRel(source.file) },
					// 与转换稿**同一个** `onOpen`（同一个 DSH 右栏通道），不另写第二条打开路径。
					onOpen: props.onOpen,
					// 词仍只来自登记词表：「打开」＋「原件」。⚠️ 这一行有两个入口了，两颗都只写
					// 「打开」分不清谁是谁——转换稿那颗按票 10 保持原样（一个字不动），新那颗自带
					// 限定语。tooltip 由 `artifactName` 出（「x 的原件」，`CONTEXT.md`「产物名」）。
					label: "打开原件",
					style: { marginLeft: 0 },
				}),
			);
		// 只有真转成了才给「打开」——没转成/转失败的压根没有转换稿可开。
		if (convertedOpenable(source))
			buttons.push(
				h(OpenArtifactButton, {
					item: { path: `材料/转换稿/${source.md}` },
					onOpen: props.onOpen,
					// 票 10（判定一 #14）：行的形状是 **[名字] + [打开]**（CONTEXT.md「产物名」）
					// ——左边那格已经是这份材料的名字（`source.file`），所以按钮只说动词「打开」，
					// 不再自造「查看转换内容」这种说法；这一份叫什么由按钮 tooltip 给出
					// （`artifactName` →「x 的转换稿」）。
				}),
			);
		return buttons.length === 0
			? null
			: h(
					"div",
					{ style: { display: "flex", gap: "8px", alignItems: "center", marginLeft: "auto" } },
					...buttons,
				);
	};
	return h(
		"div",
		{ style: S.card },
		h(
			"div",
			{
				style: {
					display: "flex",
					justifyContent: "space-between",
					alignItems: "baseline",
					gap: "10px",
				},
			},
			// 四态行（候选 06）：材料准备那一步的名字与四态词吃行上算好的 `rowText`。
			// ⚠️ 兜底那一支**不许手写**「材料准备」（2026-09-23 代码审查）：界面上的字只此一份
			// （CONTEXT.md「界面用词表」）。而且这一支事实上到不了——模型无条件 push 材料准备
			// 那一步，它的 `title` 就是 `PHASE_UI[1]`。留兜底只为不崩，词一律从表里取。
			h(
				"strong",
				{ style: { fontSize: "13px" } },
				step === null || step === undefined ? (PHASE_UI[1] ?? "") : step.rowText,
			),
		),
		conversionText !== null
			? h(
					"p",
					{ style: { margin: "6px 0 0", fontSize: "12px" } },
					`🤖 ${conversionText}`,
				)
			: null,
		sources.length === 0
			? h("p", { style: { margin: "6px 0 0", fontSize: "13px" } }, "还没有上传材料。")
			: h(
					"div",
					{ style: { marginTop: "6px" } },
					...sources.map((source) => {
						const role = roleOf(source);
						return h(
							"div",
							{
								key: source.file,
								style: {
									display: "flex",
									gap: "8px",
									alignItems: "center",
									padding: "5px 0",
								},
							},
							h(
								"span",
								{ style: { flex: 1, fontSize: "13px", wordBreak: "break-all" } },
								`${convertedIcon(source)} ${source.file}${role === null ? "" : `（${role}）`}`,
							),
							entriesFor(source),
						);
					}),
				),
		// 票 `mineru-formats/03`：红源在阶段页也要**说清是什么事**（只呈现，不给动作）。
		// 阶段页是只读的（ADR-0012 决策 6）——那两个可点的出口在「材料准备」那一步的卡上
		// （`MaterialGapList`），这里只把去处指出来，不摆一个点不动的按钮。
		...sources
			.filter((source) => convertedState(source) === "failed")
			.map((source) =>
				h(
					"p",
					{
						key: `gap-${source.file}`,
						style: { margin: "6px 0 0", fontSize: "12px" },
					},
					`${source.file}：这一份没转成，这本书暂时缺它；到「材料准备」那一步补传或删掉它。`,
				),
			),
	);
}

// ── 阶段专属块 ──────────────────────────────────────────────────────────────

/** 读材料挑重点：AI 挑出来的重点（人读清单就地展开；机器产物不开右栏）。 */
export function KnowledgeMapBlock(props) {
	const [open, setOpen] = useState(false);
	const text = typeof props.text === "string" && props.text !== "" ? props.text : null;
	if (text === null)
		return h(
			"div",
			{ style: S.card },
			h("p", { style: { margin: 0, fontSize: "12px", opacity: 0.7 } }, "还没有挑重点的结果。"),
		);
	// 机器产物（原始 JSON）折成人读清单（F38）：解析失败/无内容时回退原文（不假装读懂了）。
	// ⚠️ 这里的折叠**只管形状**，措辞归这个折叠自己——源探查确认卡读同一份 JSON、用它自己的
	// 说法（既有裁决「数据同源、措辞各自成篇」）。这两处不许互相改文案。
	const folded = foldKnowledgeMap(text);
	const body = folded ?? text;
	return h(
		"div",
		{ style: S.card },
		h(
			"div",
			{ style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } },
			h("strong", { style: { fontSize: "13px" } }, "AI 挑出来的重点"),
			h(
				"button",
				{ style: S.smallLink, onClick: () => setOpen((v) => !v) },
				open ? "收起" : "展开看清单",
			),
			// 票 `knowledge-graph-build/12`：老书那颗「补一份知识点图」的键——**与抬头同一行**
			// （这一屏是老书唯一走得到、且今天就印着知识点清单的那一屏：阶段片六格常驻可点、
			// 无 status 守卫）。可见性三条与回执都住在它自己的域文件里，这里只把三样递下去。
			h(KnowledgeGraphBackfillKey, {
				key: "backfill",
				meta: props.meta,
				knowledgeMapText: text,
				onBackfill: props.onBackfillGraph,
			}),
		),
		// 图那一块（补出来的那份图的抬头 ＋ 只读图）：**只有「这份图是补的」且图键都在**才出。
		h(KnowledgeGraphBackfillBody, {
			key: "backfill-body",
			meta: props.meta,
			knowledgeMapText: text,
		}),
		// 票 `reader-cognition-boundary-build/10`：老书那条「补一份读者边界」的通路（**能划**）。
		// ⚠️ 与上面那块是两个物：那块是补出来的**只读图**，这块是逐卡裁的**边界入口**——
		// 各自有独立抬头记号与独立 meta 账，⛔ 别混成一个。可见性四档在它自己的域文件里。
		h(ReaderBoundaryBackfillBlock, {
			key: "reader-boundary",
			meta: props.meta,
			knowledgeMapText: text,
			knowledgeMapExclusions: props.knowledgeMapExclusions,
			chapterStatus: props.chapterStatus,
			processSegs: props.processSegs,
			graphDropped: props.graphDropped,
			onVerdict: props.onGraphVerdict,
		}),
		open ? h("pre", { style: P.pre }, body) : null,
	);
}

/** 拍板定方案：章节安排（`工作区/outline.md` 是机器 JSON，人读形态是**就地折叠清单**）。 */
export function OutlineBlock(props) {
	const [open, setOpen] = useState(false);
	const text = typeof props.text === "string" && props.text !== "" ? props.text : null;
	if (text === null)
		return h(
			"div",
			{ style: S.card },
			h("p", { style: { margin: 0, fontSize: "12px", opacity: 0.7 } }, "还没有章节安排。"),
		);
	// 机器产物（原始 JSON）折成人读清单：与知识地图同一条路（同一个中性模块里的 `foldOutline`）——
	// 解析失败/无内容时回退原文（不假装读懂了）。`工作区/outline.md` 判 `'inline'` 不开右栏
	// （票 pipeline-wiring-gaps/09），所以**这里就是它回看时唯一的人读出口**。
	const folded = foldOutline(text);
	const body = folded ?? text;
	return h(
		"div",
		{ style: S.card },
		h(
			"div",
			{ style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } },
			h("strong", { style: { fontSize: "13px" } }, "章节安排"),
			h(
				"button",
				{ style: S.smallLink, onClick: () => setOpen((v) => !v) },
				open ? "收起" : "展开看清单",
			),
		),
		open ? h("pre", { style: P.pre }, body) : null,
	);
}

/** 最佳范例章：这一章的稿子（定稿没定稿、第几稿、旧稿逐个看）。 */
export function GoldBlock(props) {
	const drafts = props.goldDrafts ?? [];
	const sealed = props.goldSealed ?? null;
	// 票 gold-revision-flow/02：那句断言原先**不看状态**——修订在飞（`meta.status === 'running'`、
	// 待办正是最佳范例章）时也照写「现在是第 N 稿，等你过目」，于是「稿次先于写完/审完成立」。
	// 用词只取「工作台状态词」那三个，不新造说法：修订在飞＝「我正在做」，等你过目＝「轮到你」。
	// ⚠️ 待办阶段**只认 gold**：原式把 `pendingStage === null/undefined` 也算进来，于是任何
	// 「运行中但待办不在最佳范例章」的状态（例如下一步已交办、等 AI 自己走）都会误报成
	 // 「我正在改第 N 稿」——这一格说的是这一章的稿子，得由这一章的待办说话。
	// （`/code-review` 的 Spec 轴审出来的）
	const revising = sealed === null && props.status === "running" && props.pendingStage === "gold";
	return h(
		"div",
		{ style: S.card },
		h(
			"div",
			{ style: { display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" } },
			h("strong", { style: { fontSize: "13px" } }, "这一章的稿子"),
			h(
				"span",
				{ style: { fontSize: "12px", opacity: 0.75 } },
				sealed !== null
					? `✅ 已定稿（第 ${sealed.version ?? "?"} 稿）`
					: revising
						? `我正在做：改第 ${props.goldDraftVersion ?? 1} 稿，改完就请你过目`
						: `现在是第 ${props.goldDraftVersion ?? 1} 稿，等你过目`,
			),
		),
		drafts.length === 0
			? null
			: h(
					"div",
					{ style: { marginTop: "8px" } },
					h("p", { style: P.sectionLabel }, "旧稿："),
					...drafts.map((draft) =>
						h(
							"div",
							{ key: draft.path, style: P.row },
							h("span", { style: P.kindTag }, "旧稿"),
							h("strong", { style: { fontSize: "13px" } }, `第 ${draft.version} 稿`),
							h(OpenArtifactButton, { item: draft, onOpen: props.onOpen }),
						),
					),
				),
	);
}

/**
 * 一项机器检查的**五档**（与屏上图标一一对应，票 `ui-display-redesign/18`）：
 * `skipped` ⏭／`not-checked` ❔／`failed` ❌／`warned` ⚠️／`passed` ✅。
 *
 * ⚠️ **图标与折叠摘要的计数都从这里取**：两处各写一遍分类，必然一处把 `not-rechecked` 算进
 * 「未检查」、另一处漏掉；票 18 的裁决要求「折叠时逐态计数、不许静默吞掉 ❔/⏭」。
 */
function checkStateOf(check) {
	if (check?.state === "skipped") return "skipped";
	if (checkStateIsNonBlocking(check?.state)) return "not-checked";
	if (check?.ok !== true) return "failed";
	if (check?.warn === true) return "warned";
	return "passed";
}

/** 那一档的图标（与 `checkStateOf` 同序；⛔ 别在行里另写一串三元）。 */
const CHECK_STATE_ICON = Object.freeze({
	skipped: "⏭",
	"not-checked": "❔",
	failed: "❌",
	warned: "⚠️",
	passed: "✅",
});

/**
 * 最后检查：机器逐项检查 + AI 检查报告（都来自账本，客户端本来就有）。
 *
 * ⚠️ 票 `demo-flow-fidelity/06`：演示书在这一块上比真书少一块（机器检查跑不满真书后半那些项；
 * 「没有 AI 检查报告」那一块票 `demo-channel-full/08` 起已经补上），所以这里明说差在哪
 * ——句子出自 `view-rules.demoQualityChecksNote()`（**哪几项不跑是从这一屏真跑的清单现算的**，
 * 票 `demo-channel-full/04` 起也不再承诺「前 N 项」这个位置），
 * 与终检认可卡（`event-cards.js` 的 `FinalApprovalCard`）**同一个函数**，不许各拼一份。
 * `demo` 由调用方（本文件的 `PhasePage`）用 `isDemoBook(meta)` 算好递进来：这一块只负责摆字。
 * ⚠️ 票 06 收口（2026-10-08）：递进去的是**这一屏真的列出来的** `checks`（那句提示的
 * 「前 N 项」的 N 从它现算），不是拿条数反推演示与否——演示与否仍只看 `props.demo`。
 *
 * 票 `ui-display-redesign/18`（spec §2.13 第 5 块，裁决见 `design-draft.md` §7.14 第 3 条）：
 * - `机器逐项检查`：**没有 ⚠️/❌ 才折**（`❔`/`⏭` 不拦折叠），折起来是一行摘要，逐态计数
 *   `机器检查：通过 N 项，跳过 M 项，未检查 K 项（点开看明细）`；有 ⚠️/❌ 时照旧逐条平铺。
 * - `AI 检查报告`：摘要〔首〕＋全文收进默认折的 `<details>`（摘要口径与站 11 共用
 *   `aiReportSummary`，⛔ 本文件不另写截断逻辑）。
 */
export function FinalChecksBlock(props) {
	const checks = props.checks ?? [];
	const report =
		typeof props.aiReport === "string" && props.aiReport !== "" ? props.aiReport : null;
	const counts = { passed: 0, skipped: 0, "not-checked": 0, failed: 0, warned: 0 };
	for (const check of checks) counts[checkStateOf(check)] += 1;
	// 「折」的条件只有一条：没有 ⚠️/❌（`❔`/`⏭` 不拦折叠，但摘要里逐态计数，不许吞）。
	const folded = checks.length > 0 && counts.failed === 0 && counts.warned === 0;
	const foldSummary = `机器检查：通过 ${counts.passed} 项，跳过 ${counts.skipped} 项，未检查 ${counts["not-checked"]} 项（点开看明细）`;
	const rows =
		checks.length === 0
			? [h("p", { key: "empty", style: P.empty }, "还没有检查结果。")]
			: checks.map((check) => {
					const state = checkStateOf(check);
					return h(
						"div",
						{ key: check.name, style: { fontSize: "12px", padding: "2px 0" } },
						// 票 20：加 ❌——真门槛（如重复标题）失败时不能再显示成 ⚠️ 那种"提示"，
						// 与「拦交付」自相矛盾；⚠️ 仍留给第三态（`ok:true + warn:true`，只提示不拦）。
						// 票 `flow-audit-2026-10/03`：`state:'not-checked'`（没有口径、未检查）用 ❔，
						// ⛔ 不许渲染成 ❌ 也不许渲染成 ✅——它既不是失败、也不是通过。
						`${CHECK_STATE_ICON[state]} ${checkHuman(check.name)}${state === "skipped" ? "（已跳过，未验，不拦交付）" : state === "not-checked" ? (check.state === "not-rechecked" ? "（未重跑，未检查，不算通过）" : "（未检查，没有口径，不算通过）") : check.note ? `（${check.note}）` : ""}`,
					);
				});
	const aiSummary = aiReportSummary(report);
	return h(
		"div",
		{ style: S.card },
		h("strong", { style: { fontSize: "13px" } }, "机器逐项检查"),
		props.demo === true
			? h(
					"p",
					{ style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.75 } },
					demoQualityChecksNote(checks),
				)
			: null,
		folded
			? h(
					"details",
					{ style: { margin: "6px 0 0" } },
					h(
						"summary",
						{ style: { cursor: "pointer", fontSize: "12px", opacity: 0.85 } },
						foldSummary,
					),
					h("div", { style: { marginTop: "6px" } }, ...rows),
				)
			: h("div", { style: { marginTop: "6px" } }, ...rows),
		report !== null
			? h(
					"div",
					{ style: { marginTop: "10px" } },
					// 票 10（判定三 #10）：界面一律说「检查」——「自查」是机器视角（谁查谁？）。
					h("p", { style: { ...P.sectionLabel, margin: "0 0 4px" } }, "AI 检查报告"),
					aiSummary === null
						? null
						: h("p", { style: { margin: 0, fontSize: "12px", opacity: 0.85 } }, aiSummary),
					// 全文〔折〕：与站 11 同一句折叠口（`AI_REPORT_FOLD_SUMMARY`）。
					h(
						"details",
						{ style: { margin: "4px 0 0" } },
						h(
							"summary",
							{ style: { cursor: "pointer", fontSize: "12px", opacity: 0.75 } },
							AI_REPORT_FOLD_SUMMARY,
						),
						h("p", { style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.85 } }, report),
					),
				)
			: null,
	);
}

// ── 阶段页本体 ──────────────────────────────────────────────────────────────

/**
 * 「↩️ 撤销刚才的定点修改」（10 分钟窗）。
 *
 * 这句承诺原来由旧的分段单卡（`BrowseSection` → `HistoryBrowser`）兑现；2026-09-21 合并落地页时
 * 那份单卡掉出了渲染路径，撤销入口跟着消失——而确认框里那句「10 分钟内可一键撤销」还写着
 * （`CONTEXT.md`「定点修改」也把它算作兑现机制）。它属于「刚才那一次定点修改」，所以长在
 * **被改的那一步所在的那一页**上：就地改、就地撤。
 * 后端一次只记一条 `lastDeepModify`，所以整页只有一个撤销点。后端还有第二道守卫（账面无新进展，
 * 见下面 `PhasePage` 里的判据），那一支由调用处决定**不给入口**、只留一句说明。
 */
function UndoButton(props) {
	return h(
		"div",
		{ style: { marginTop: "10px" } },
		h(
			"button",
			{
				style: S.disabled({ ...S.smallLink, textDecoration: "none" }, props.busy === true),
				disabled: props.busy === true,
				onClick: () => props.onDeepUndo?.(),
			},
			"↩️ 撤销刚才的定点修改（10 分钟内）",
		),
	);
}

/**
 * `PhasePage` 的 props 契约（票 `workbench-card-contract` 02）。
 *
 * 阶段页有两个 mount 点（壳 `client-entry.js`：浏览态那一处 ＋ 阶段页态那一处），**两个
 * mount 点共用这一份契约**（两个 slot 注册同一个 builder 是刻意的，见 `card-view.js`）。
 * 它们今天共用一个 `renderPhasePage(overrides)` helper，**差异只在那三个键上**：
 *
 *   浏览态那一处   ＋ `focusedStep`（`browsing`）、`key`；**没有** `events`
 *   阶段页态那一处 ＋ `events`；**没有** `focusedStep`、**没有** `key`
 *
 * ⚠️ 票 `ui-display-redesign/19`：**props 的差异仍是这三个键**，但**渲染出来的主体不同**——
 * `focusedStep` 命中一行时交给 `BrowseBody`（独立四块），没命中/没给时才是阶段页三布局。
 * ⛔ 这不是新增一个 prop、也不是新增 mount 点：壳仍只从 `cardView.phasePageBrowse`／
 * `phasePagePhase` 两行渲同一个 `PhasePage`，位置契约不变。
 *
 * ⚠️ **`key` 不在本袋里——它由 React 消费，从不到达组件体**（React 建元素时把它摘走，
 * 组件 `props` 上永远没有它）。所以它**绝不许**列 `required`，壳也不许 `.with({key})`
 * （delta 的闭集是 `fromBook` ∪ `defaults`，会当场抛「契约没声明的键」）；壳要把它写在
 * `createElement` 的 props 里、与袋并列。
 *
 * ⚠️ **那三个键登记在 `defaults` 而不是 `fromBook`／`derive`**：它们是**每个 mount 点各自
 * 说的值**（浏览态给 `viewPhaseOfBrowsing`／`browsing`，阶段页态给 `viewPhase`／`events`），
 * 不是「这本书」的数据。`defaults` 是 `.with()` 闭集的一部分 ⇒ 两个 mount 点能各自覆盖它；
 * 走 `derive` 就既覆盖不了、也会让「键」与「整形出来的结果」脱节。
 *
 * **必填一项**：`projector`——它在**每次渲染**都被无条件调用（`project({kind:"phase"})`），
 * 缺了它这张卡当场渲不出来。
 * ⚠️ 它的来源是壳里的 `stageStepProjector`（**不是**模块级单例：`useMemo` 的三个依赖之一
 * `runningSubagentCount` 来自宿主会话状态、**不在 `book` 里** ⇒ book 引用没动它也会换身份）。
 * 别拿它当记忆化 key。
 *
 * ⚠️ **刻意不列必填的那几个**，逐条都有卡内的证据（列了必填就是在说「缺了是接线事故」，
 * 而卡内明写着它们可以没有）：
 *   · `processToken` —— 卡内是 `props.processToken ?? null`（票 11/ADR-0021 决策 15 的清除信号）。
 *   · `onDeepModify` —— 卡内是 `props.onDeepModify?.(…)`；**提交后不换屏**那一支（票 11）。
 *   · `onDeepUndo`  —— 卡内是 `props.onDeepUndo?.()`（`UndoButton` 里），且撤销入口本身
 *     受「10 分钟窗 ＋ 账面无新进展」两道判据控制，不给入口时整颗按钮不渲染。
 *   · `checks` / `goldDrafts` —— 卡内是 `props.checks ?? []` / `props.goldDrafts ?? []`。
 *   · `meta` —— 全程 `meta?.… ?? 兜底`（老账本字段可以没有）。
 *   · `events` / `focusedStep` —— 上表：两个 mount 点本来就不都给。
 *
 * ⚠️ **`.with()` 改不动 `derive` 整形出来的那一位**（`onOpen`）：delta 的闭集
 * `= fromBook ∪ defaults`，「一个名字一处来源」在 `card-view.js` 里是**闸**不是纪律。
 */
export const phasePageView = defineCardView({
	card: "PhasePage",
	fromBook: [
		// ⚠️ 壳里写的是 `projector: stageStepProjector`——**原样转发**，不经 derive。
		"projector",
		// 票 11 + ADR-0021 决策 15：乐观 redo 的清除信号 ＝ 当前 `segments` 数组的 commit token。
		"processToken",
		"meta",
		"checks",
		"aiReport",
		"knowledgeMapText",
		"outlineText",
		"goldDrafts",
		"goldDraftVersion",
		"busy",
		// ⚠️ 壳里写的是 `onOpen: openInSidebar`。**book 侧刻意用壳里那个标识符**：同一个
		//    「打开」语义在这份壳里还有别的闭包（事件行那颗 `onOpen: () => viewWork(product)`、
		//    源探查卡的 `onViewReport`），一个扁平的 book 上撞了名就说不清谁是谁。
		"openInSidebar",
		// 这两个是壳里的就地箭头（`postAction({action:"deep-modify"|"deep-undo"})`），没有自己的
		// 局部标识符，prop 名就是它们在壳里写的名字。
		"onDeepModify",
		"onDeepUndo",
		// 票 `knowledge-graph-build/12`：壳里那颗「发动作并刷新」的漏斗（`onBackfillGraph` 里包着
		// `postAction({action:"knowledge-graph-backfill"})`）。**老书那颗补图键唯一的出口**——
		// 卡侧只把它原样递给 `KnowledgeGraphBackfillKey`，⛔ 卡里不自己 fetch、不自己拼动作名。
		"onBackfillGraph",
		// ── 票 `reader-cognition-boundary-build/10`：老书「补一份读者边界」那五样 ──────────────
		// 壳里都已经在 `cardBook` 上（`knowledgeMapExclusions` 与 `knowledgeMapText` 同一条路随
		// payload 下发；`chapterStatus`／`processSegs` 是书级派生；`graphDropped`／`onGraphVerdict`
		// 是图上划痕与那条「意见」通路的唯一出口）⇒ 这里只是**声明**这张卡也吃它们。
		"knowledgeMapExclusions",
		"chapterStatus",
		"processSegs",
		"graphDropped",
		"onGraphVerdict",
	],
	required: ["projector"],
	defaults: {
		// 三个「每个 mount 点各自说」的键（见上方那张表）。壳的两个 mount 点都**显式**给，
		// 这里的缺省只是让「没给」有话说，而不是让它安静地渲出一页空阶段。
		phase: null,
		focusedStep: null,
		events: null,
	},
	// book 侧键 → 卡片 prop 名。壳里是 `onOpen: openInSidebar`，卡里叫 `onOpen`。
	derive: (bag) => ({ onOpen: bag.openInSidebar }),
});

/**
 * 卡片体内 22 个 prop 名的**完整清单**（解构 3 个 ＋ `props.某名` 直读 19 个）——
 * 「这张卡吃什么」写在**卡旁边**，这一串就是它的全部。改任何一处都要回来改上面的契约。
 *
 *   解构               `phase` `meta` `onOpen`
 *   直读 `props.某名`   `processToken` `onDeepModify` `busy`
 *                       `projector` `focusedStep` `events`
 *                       `knowledgeMapText` `onBackfillGraph` `outlineText`
 *                       `goldDrafts` `goldDraftVersion` `checks`
 *                       `aiReport` `onDeepUndo` `busy`
 *                       `knowledgeMapExclusions` `chapterStatus` `processSegs`
 *                       `graphDropped` `onGraphVerdict`
 *   （⚠️ 行号会漂，这里不再逐位标 `:行号`——清单本身就是判据的对照面，
 *     `test-card-views-coverage.mjs` 逐位对账。）
 *
 * ⚠️ 卡体内**一个字不改**（spec 不变量 1：袋是扁平的，`test-phase-page.mjs` 那 32 例照旧跑）。
 */
export function PhasePage(props) {
	const { phase, meta, onOpen } = props;
	// 票 11：提交「✍️ 就这么改，重做下游」后**不换屏**（热区表判"提交后替用户换屏"不合法），
	// 被改的那一段就地标成「我正在做」——工作台状态词只许三个，重做中的说法就是它，不另造词。
	// 乐观标记（本地先标、真值一到就让位）的理由：提交到下一份 `/textbook/process` 到货之间
	// 有一段真实延迟（POST + 连锁 `loadAll`），那段窗口里行文不许还停在「已完成」。
	// ⚠️ 候选 06：清除信号**必须是 process 身份**（`processToken`——壳每见到一份**内容确实变化**的
	// 成功 process 提交就把它 ＋1），不是 projector 身份——`meta` 与 `process` 是两个独立到达的请求，
	// 用 projector 身份会在 `/textbook/process` 新 payload 还没到时就提前清掉标记（`meta` 先到就会重建 projector）。
	const [redoKey, setRedoKey] = useState(null);
	const processToken = props.processToken ?? null;
	useEffect(() => {
		setRedoKey(null);
	}, [processToken]);
	// 就地定点修改所需的两件（`onLocate` 已退役：新建的那份卡就在原地改，不再换屏）。
	const modProps = {
		// 提交那一下先把这一段标成「我正在做」（乐观），再交给接线层发 `deep-modify`。
		onDeepModify: (segKey, note) => {
			setRedoKey(segKey);
			props.onDeepModify?.(segKey, note);
		},
		busy: props.busy,
	};
	// 候选 06：阶段名 / 开场白 / 完整行 / 焦点 / 计数**全部**来自模型的 phase projection
	//（`project({kind:"phase", phase, focus, optimisticSegmentKey})`）——本页不再自己跑
	// `phaseSummary` / `phaseSteps`、不再自己找焦点、不再自己数 done / 去重文件。乐观 redo
	// 作为显式 `optimisticSegmentKey` 交给 projection 在末端叠加（同时重算 status/rowText），
	// 页面不持有第二份组合规则。
	const page = props.projector.project({
		kind: "phase",
		phase,
		focus: props.focusedStep ?? null,
		optimisticSegmentKey: redoKey,
	});
	const steps = page.rows;
	const layout = PHASE_LAYOUT[phase] ?? "stack";
	const currentPhase = meta?.phase ?? 1;
	const focusedStepKey = page.focusedStepKey;
	const doneSteps = page.doneCount;
	const fileCount = page.uniqueFileCount;

	// 票 `ui-display-redesign/19`：浏览态（壳从 `phasePageBrowse` 那一行给 `focusedStep`）不再
	// 渲染「同一张阶段页 ＋ 焦点描边」，而是在**同一个 mount 点**里换主体：独立四块。
	// ⛔ 阶段页态（`phasePagePhase`，不带 `focusedStep`）不走这里。
	//
	// 命中条件＝焦点真的落在本阶段某一步上（`projection` 已经解析过步 key／旧段 key）。
	// 认不出（`browsing` 变陈、步骤已消失）时落回下面的普通阶段页——那是今天的安全退化，
	// 不是四块的一部分（不编一个「这一步不存在了」的新屏，票面没裁）。
	const browseRow =
		focusedStepKey === null ? null : steps.find((row) => row.key === focusedStepKey) ?? null;
	if (browseRow !== null) {
		return h(BrowseBody, {
			row: browseRow,
			phase,
			phaseName: page.name,
			intro: page.intro,
			// 第几步按**本阶段**的步序（与卡头事实句同一口径：`第 N 阶段：第 M 步 / 共 K 步`）。
			stepIndex: steps.findIndex((row) => row.key === browseRow.key) + 1,
			stepTotal: steps.length,
			onOpen,
			onDeepModify: modProps.onDeepModify,
			busy: modProps.busy,
		});
	}

	// 卡头事实句（票 18，spec §2.12–2.14 第 2 块）。
	//
	// ⚠️ 计数**只放这里**，阶段头只留名与 intro（旧形态两者同屏会印两遍）。两句都是
	// **无中点**版本（`design-draft.md` §7.14 第 1 条：本批逐字文案按 ui-cleanup 判据 1 清零）。
	//   · 阶段 2–6：步数按**步**（不是分段），份数按路径去重（`uniqueFileCount`），不把一章正文数三遍；
	//   · 阶段 1：这一页的「产出了什么」＝传了几份、转成功几份（步数对它没有意义，旧形态也不印）。
	const materialSources = meta?.sources ?? [];
	const facts =
		phase === 1
			? `已传 ${materialSources.length} 份材料，转换成功 ${okMaterialShards(materialSources).length} 份。`
			: steps.length > 0
				? `${doneSteps}/${steps.length} 步已完成，${fileCount} 份文件。`
				: stepWord(phase < currentPhase ? "done" : "pending");

	const head = h(
		"div",
		null,
		// 屏级问句＋事实句（spec §2.12–2.14 第 1–2 块）。问句**不进** `decisionOf`：阶段页没有
		// 「要你拍板」的那一问，它问的是「走到了哪、产出了什么」。
		h(CardHead, {
			question: h("strong", { style: CARD_HEAD_QUESTION_STYLE }, PHASE_PAGE_QUESTION),
			facts,
		}),
		// 阶段头只留**阶段名与 intro**（计数已经进事实句；stage 1 的步数本来就不印）。
		h(
			"div",
			{ style: P.head },
			h("strong", { style: P.headTitle }, page.name),
		),
		h("p", { style: P.intro }, page.intro),
	);

	const body =
		layout === "materials"
			? h(MaterialsBody, {
					// 候选 06：材料准备那一步是 phase-1 里 `target.kind === "phase"` 的**唯一**行
					// ——不再拿 `MATERIAL_STEP_KEY` 机器 key 找（key 泄漏已从 UI 移除）。
					step: steps.find((row) => row.phase === 1 && row.target?.kind === "phase") ?? null,
					sources: meta?.sources ?? [],
					// 票 `pre-gold-build/02`：材料行上的**角色**读合并件（`materials[].role`）——
					// 这就是这一页本来就有的那一份原文（第 2 阶段那块折叠读的也是它）。
					knowledgeMapText: props.knowledgeMapText,
					meta,
					events: props.events,
					onOpen,
				})
			: layout === "split"
				? h(SplitBody, { steps, onOpen, ...modProps })
				: h(StackBody, { steps, onOpen, ...modProps });

	const extras = [];
	if (phase === 2)
		extras.push(
			h(KnowledgeMapBlock, {
				key: "km",
				text: props.knowledgeMapText,
				// 票 `knowledge-graph-build/12`：老书那颗补图键要看的三样——书级 `meta`（可见性三条）
				// 与壳里那个「发动作并刷新」的漏斗（`postAction`，原样转发，本页自己不发动作）。
				meta,
				onBackfillGraph: props.onBackfillGraph,
				// 票 `reader-cognition-boundary-build/10`：老书那颗「补一份读者边界」的键要看五样——
				// 可见性细档（`chapterStatus` ＋ `processSegs`）、图上「已否」那一档（盘上那份剔除记录
				// ∪ 本会话划痕）、以及那颗键唯一的出口（壳的 `graphOpinion`）。**原样转发**，⛔ 本页不重算。
				knowledgeMapExclusions: props.knowledgeMapExclusions,
				chapterStatus: props.chapterStatus,
				processSegs: props.processSegs,
				graphDropped: props.graphDropped,
				onGraphVerdict: props.onGraphVerdict,
			}),
		);
	// 章节安排：机器 JSON 那一族（`'inline'`）的另一条，就地折叠给人读（票 pipeline-wiring-gaps/09）。
	if (phase === 3)
		extras.push(h(OutlineBlock, { key: "outline", text: props.outlineText }));
	if (phase === 4)
		extras.push(
			h(GoldBlock, {
				key: "gold",
				goldSealed: meta?.goldSealed ?? null,
				goldDrafts: props.goldDrafts,
				goldDraftVersion: props.goldDraftVersion,
				// 票 gold-revision-flow/02：把「这一稿处在哪一态」传进去（`meta.status` + 待办阶段），
				// 调用点不替组件推导状态——组件自己按真实状态选词。
				status: meta?.status ?? null,
				pendingStage: meta?.pendingStage ?? null,
				onOpen,
			}),
		);
	if (phase === 6)
		extras.push(
			h(FinalChecksBlock, {
				key: "checks",
				checks: props.checks,
				aiReport: props.aiReport,
				// 票 `demo-flow-fidelity/06`：演示与否只有 `meta.demo` 一个来源（`card-view.js` 的
				// 契约里 `meta` 早就在 `fromBook` 里），**不**拿检查条数去猜。
				demo: isDemoBook(meta),
			}),
		);

	if (steps.length === 0 && layout !== "materials") {
		return h(
			"div",
			null,
			head,
			// 「小步」是退役词（spec 不变量 7 / §6 越界清单），旧的「这一步没有小步，还没到它。」
			// 一并退役；而且这一页是**阶段页**：空的是"这一阶段还没有能摆的步"。
			// ⚠️ 句子不能说"这个阶段还没到"：抬头那一格的词可能是「已完成」（看的是**过去**的阶段，
			// 只是这份 payload 里没有它那几段——老宿主），两句会当场打架。所以取一句两头都成立的。
			h("div", { style: S.card }, h("p", { style: { margin: 0 } }, "这个阶段还没有可看的步。")),
		);
	}

	// 撤销点长在**被改的那一步所在的那一页**上（10 分钟窗，见 `UndoButton`）。
	// 比对的是**段** key（`lastDeepModify.segment`）——步比段细，章内三步任一步都能把这一页认出来。
	//
	// 票 workbench-transitions/19（承诺账 A1③ 的机制侧）：后端 `deep-undo` 是**两道**守卫——10 分钟窗
	// **加**「账面无新进展」（`actions/deep-modify.js`：`meta.eventCount !== last.eventCountAfter` → 409）。
	// 深改一落账就唤醒主 AI 重做，账高随即往前跑，所以只判时间窗的按钮会亮着却**必然**被拒。
	// 这里跟后端同一个判据（连 `?? 0` 的兜底也一致：老账本没记 `eventCountAfter` 时后端就 409，界面也不该给入口）。
	const last = meta?.lastDeepModify ?? null;
	const lastOnThisPage =
		last !== null && steps.some((row) => row.segmentKey === last.segment);
	const inUndoWindow = last !== null && Date.now() - last.at <= 10 * 60 * 1000;
	const ledgerAdvanced =
		last !== null && (meta?.eventCount ?? 0) !== last.eventCountAfter;
	const undoable = inUndoWindow && lastOnThisPage && !ledgerAdvanced;
	// 账高已推进：不给入口，改说一句事实——界面上不许留一个点下去必然被拒的按钮。
	const undoClosed = inUndoWindow && lastOnThisPage && ledgerAdvanced;

	// 「点『打开』…」全页只印一次（票 18，spec §2.13 第 8 块）：这一页真的摆了「打开」才印。
	// 材料页的判据与那几颗按钮同一个（`convertedOpenable` ＋ 原件预览）；其余布局看步上的产物，
	// 阶段 4 还多一份旧稿列表。
	const materialOpenable = materialSources.some(
		(source) => originalPreviewOpenable(source.file) || convertedOpenable(source),
	);
	const hasOpenButton =
		layout === "materials"
			? materialOpenable
			: steps.some((row) => row.artifacts.length > 0)
				|| (phase === 4 && (props.goldDrafts ?? []).length > 0);

	return h(
		"div",
		null,
		head,
		// 阶段专属块**上移到步卡之前**（票 18，spec §2.13 第 5 块）：它们才是这一阶段的产出/结论，
		// 步卡回答的是「走到了哪」。旧形态把专属块摆在步卡下面，正好反着。
		...extras,
		body,
		hasOpenButton
			? h("p", { style: { ...P.empty, margin: "8px 0 0" } }, OPEN_NOTE)
			: null,
		// 撤销点保留在**页面最底**（spec §2.13 第 9 块；裁决 §7.12 Q8「保持最底」）。
		undoable ? h(UndoButton, { onDeepUndo: props.onDeepUndo, busy: props.busy }) : null,
		undoClosed
			? h(
					"p",
					{ style: { marginTop: "10px", marginBottom: 0, fontSize: "12px", opacity: 0.85 } },
					"这一步已经开始重做，撤销已关闭",
				)
			: null,
	);
}
