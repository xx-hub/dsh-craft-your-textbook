/**
 * 造书工作台 · 焦点区主卡族
 *
 * 焦点区按流水线状态切换的那组卡片：进度条、向导卡、上传区、状态/错误卡、
 * 交付卡、关卡拍板卡，以及 MinerU Token 常驻入口。
 *
 * 账本回放列表（「之前的过程」那块）连同它的**人话文案映射**（`cardText` / `cardIcon`）已整体
 * 搬进 `src/ui/replay-list.js`（票 `depth-review-2026-10/09`）——那是**另一群观众**，与本文件
 * 零内部共享。搬走之后本文件回到「一件事」的深度。
 */

import { createElement, useEffect, useRef, useState } from "react";
import { S } from "./styles.js";
// 票 `ui-display-redesign/01`：卡头行（问句一行＋事实句一行）是**共用小件**——站 0 先用，
// 后续 02–10 的决策站复用同一件（字号/间距/颜色只定义在那里一次）。
import { CardHead, CARD_HEAD_QUESTION_STYLE } from "./card-head.js";
// 票 `ui-display-redesign/10`（接口由票 09 给）：全书汉字／知识点读数与它的**唯一取数口**
// ——交付卡在这里接渲染（终检卡不需要那两个读数，见 `finalApprovalFacts` 的注释）。
import {
	useBookReadings,
	bookReadingsFactSentence,
	hanziReadingText,
	knowledgePointsReadingText,
} from "./book-readings.js";
// 逐源表态面（票 mineru-formats/03）：材料不齐时这一张卡就是那个红的唯一可行动出口。
import { MaterialGapList } from "./material-gap.js";
// 工作台内「连续正文块」的量宽上限**唯一出处**（票 `walkthrough-fixes/17` 的 2026-10-06 裁决）：
// 交付卡与终检认可卡上那两块报告正文（`aiReport`）直接吃它，不自己再写一份字面量
// （那份常量与它的适用范围／红线见 md-render.js）。
// ⚠️ 票 `ui-systematic-fixes/01` 起：那两块报告的**正文本身**改走 `bodyOf`（正文出口，见 md-render.js）
// ——上限仍绑在卡里那个容器上（包住出口吐出来的那些块，值同一条常量 ⇒ 两处不打架），
// `whiteSpace: "pre-wrap"` 随之退场（排版交给报表块）。
import { BODY_MEASURE_MAX_WIDTH, BODY_KIND_MARKDOWN, bodyOf } from "./md-render.js";
// 双端共享领域件：六阶段全称、素材角色、角色识别兜底、范例章号（单一事实来源）。
// （事件含义表 `EVENT_META` 随回放域搬进 `./replay-list.js`——焦点卡族不读它。）
// 票 10：上传前那道**按格式**的体积预检走 `judgeMaterialUploadSize`（500MB 与 200MB 两道
// 分别说、PDF 与非 PDF 分别说），所以这里**不再**直接摸 `MAX_UPLOAD_BYTES`／
// `uploadTooLargeMessage` —— 那两个仍归服务端 413 与 domain-rules 那一节所有。
// 票 `upload-formats/01`：选到「云端通道不收」的格式（epub）时**不许静默丢掉**——判定与四档结局
// 走两侧共用的 `judgeMaterialFileIntake`（服务端闸门调的是同一份），所以这里连同它的状态词一起取。
import { PHASES, goldChapterNo, materialFormatAccept, judgeMaterialUploadSize, MATERIAL_INTAKE, judgeMaterialFileIntake, checkBlocksDelivery, checkStateIsNonBlocking } from "../domain-rules.js";
// 界面用词表（批 2）：阶段片不再各写一套短标签，取词只此一处。
// 票 `demo-flow-fidelity/06`：演示书那句提示（`demoQualityChecksNote`）与它的判据
// （`isDemoBook`）都住这里——阶段页第 6 阶段那块调的是**同一句**（句子只此一份）。
import { PHASE_UI, phaseChipTitlePrefix, DECISION_QUESTION, gateHuman, stageLabelHuman, checkHuman, materialConversionActivityText, convertedIcon, demoQualityChecksNote, isDemoBook, gateDecidedNote, materialRoleNote, finalApprovalNote, finalApprovalNeedNote, finalRedoRows, FINAL_REDO_HEADING, FINAL_REDO_FOOT } from "./view-rules.js";
// 章完成度的唯一一份口径（票 14）：章节卡与状态卡都读 `rules.chapterIsDone`——服务端
// `chapterStatus[].done` 优先（它含「检查记录审的是当前这份正文」），老服务端才退回
// 「章级交工事件 ＋ 无未处置意见」。⛔ 本文件不再各写一份。
// 票 `ui-display-redesign/02`：`rules.js` 里那句**格式标定说明**（「未标定」那一句）已按 spec §2.2
// 第 8 块删出屏幕，本文件不再取用它——函数仍住 `rules.js`，由 `test-material-format.mjs` 守着
// 它的正文与实测闭包。⛔ 别把那个 import 顺手加回来（取样命令要求它只在自己的定义处命中）。
import { chapterIsDone, deriveDoneSet, humanDuration, materialFormatHint, offChannelMaterialFormatNote } from "./rules.js";
// 卡片 props 契约（票 `workbench-card-contract` 02）：本文件里 5 张焦点区主卡的「吃什么」写在
// **各自紧邻的卡旁**，壳只负责递「当前这本书」。`card-view.js` 是零域 import、零 react import 的
// 中性 module——它不认识任何一张卡，加卡不必回来改它（locality 就是这么保住的）。
import { defineCardView } from "./card-view.js";
// 票 `walkthrough-fixes/19`②：那个旋钮的取值面（默认并发数、上限）单点在
// `src/workbench-knobs.js`——界面只**呈现**，⛔ 不在这里手抄第二份。
// ⚠️ 票 `confirm-points-redesign-build/03` 起档位表那一半没有了（篇幅档位三档删除）。
import {
	DEFAULT_MAX_CONCURRENT_SUBAGENTS,
	MAX_CONCURRENT_SUBAGENTS_CEILING,
} from "../workbench-knobs.js";
// 📌 **票 `depth-review-2026-10/05` 收尾**：票 09 搬回放域时在这里留了一行**过渡再导出**
// （`cardText` / `cardIcon` / `collapseConversionRuns` / `replayRowSummary` / `replayRowDetail` /
// `REPLAY_SUMMARY_MAX` / `replayListView` / `ReplayList` 共 8 个），让壳与四组测试零改动取词。
// 今天壳与那四组测试全部改指 `./replay-list.js`，那行连同自陈「改指之后即可删」的注释一并撤掉——
// 留着就是一处能引到旧路径的死入口，而注释还写着收尾没做，正是本仓点名要治的那类漂移。
// ⚠️ 本文件因此与 `./replay-list.js` **零内部共享**（两个方向都由 `test-card-views-coverage.mjs`
// 钉住：回放域不许反向 import 本文件，本文件不许声明或消费任何一个回放符号）。

/**
 * 上传卡「还没传过任何材料」时的空清单（缺省规则 3：空引用必须是**模块级同一个引用**）。
 *
 * ⚠️ 壳调用点原先写的是 `meta.sources ?? []`——**每帧新建一个数组**：props 袋于是每装配一次
 * 就换一个引用，袋的「记忆」（`createCardView` 两次取同一 slot 拿同一引用）在这一位上失效，
 * 任何按它做依赖的东西都得跟着重算。
 * ⚠️ 这里**只换空缺省，不动数组本身**：`meta.sources` 是宿主写的活对象，取到时原样传下去，
 * 卡里读到的仍是真清单。已核实 `UploadArea` 对 `sources` **只读**（`sources.length` ×2、
 * `sources.map` ×1，全卡无 `.push` / `.sort` / `.splice` 这类就地改写），共享引用因此安全。
 */
const NO_SOURCES = Object.freeze([]);

// ── 机器检查清单（批 2，2026-09-20 用户拍板）─────────────────────────────────
// 原来 12 条 ✅ 平铺在卡里，加上 AI 自查 6 条 = 18 行绿勾，把唯一的决策按钮挤出首屏。
// 改成一行摘要 + 折叠细则；**有没过项时不折叠**——失败项不该藏起来。
// 终检认可卡与交付卡共用（原来两处逐字节重复）。
//
// 票 26（2026-09-25 拍板）：票 20 的机器修复入口按钮已收——有检查项没过时根本走不到终检
// 认可卡（`chapters.js` 直接带 `issues` 打回主 AI），机器本来就把起草的指令自动送回；人只剩判断，不点。
export function MachineChecks({ checks, openByDefault = false }) {
	const list = checks ?? [];
	if (list.length === 0) return null;
	// 票 `walkthrough-fixes/19`③：第三态「已跳过（未验）」**不是没过**——
	// 跳过＝把验货推迟并记账（用户自己点的），所以它既不进 `failed` 的计数、也不折进「全过」，
	// 而是单独一档逐条列出来（`state: 'skipped'`，服务端给的那一位）。
	const skipped = list.filter((check) => check.state === "skipped").length;
	// 票 `flow-audit-2026-10/03`：第四态「没有口径、未检查」（`state:'not-checked'`）——
	// 它不是没过（不拦交付），但也⛔ 不许被折进「全过」：界面上必须看得出这一格是空的。
	const notChecked = list.filter((check) => checkStateIsNonBlocking(check.state) && check.state !== "skipped").length;
	const failed = list.filter(checkBlocksDelivery).length;
	// 「提示你看一眼」是第三态：机器不拦交付、但确实发现了东西。
	// 原来这种项也打绿勾 ✅，绿勾与警告同框——现在用 ⚠️ 分开。
	const warned = list.filter((check) => check.ok === true && check.warn === true).length;
	// ⚠️ 票 20 起重复标题**不再是**第三种状态（它是真门槛，没过就是 ❌）——
	// 但第三态的表征留着：`ok:true + warn:true` 的项仍标 ⚠️ 并挂「只是提示，不拦交付」。
	// 这一句必须挂在每一项自己行里——否则用户会把提示当门槛，以为不解决就交付不了。
	const rows = list.map((check) =>
		createElement(
			"div",
			{ key: check.name, style: { margin: "4px 0" } },
			createElement(
				"span",
				null,
				check.state === "skipped"
					? "⏭"
					: (check.state === "not-checked" || check.state === "not-rechecked")
						? "❔"
						: check.ok !== true
							? "❌"
							: check.warn === true
								? "⚠️"
								: "✅",
			),
			` ${checkHuman(check.name)}`,
			check.state === "skipped"
				? createElement(
						"span",
						{
							style: {
								marginLeft: "6px",
								fontSize: "12px",
								color: "#9a6700",
							},
						},
						"（已跳过，未验，不拦交付）",
					)
				: check.state === "not-checked"
					? createElement(
							"span",
							{
								style: {
									marginLeft: "6px",
									fontSize: "12px",
									color: "#9a6700",
								},
							},
							check.state === "not-rechecked" ? "（未重跑，未检查，不算通过）" : "（未检查，没有口径，不算通过）",
						)
					: null,
			check.ok === true && check.warn === true
				? createElement(
						"span",
						{
							style: {
								marginLeft: "6px",
								fontSize: "12px",
								color: "#9a6700",
							},
						},
						"（只是提示，不拦交付）",
					)
				: null,
			createElement(
				"span",
				{ style: { opacity: 0.7, marginLeft: "6px", fontSize: "12px" } },
				check.note ?? "",
			),
		),
	);
	const summary =
		`🔧 机器也查过了 ${list.length} 项，` +
		// ⚠️ 有跳过项/未检查项时**不许说「全过」**（票 19③／票 `flow-audit-2026-10/03`）：
		// 全过＝每一项都验过了，而跳过的那些**没验**、未检查的那些**不知道**。
		(failed > 0
			? `有 ${failed} 项没过`
			: skipped > 0 || notChecked > 0
				? "没有没过项"
				: "全过") +
		(skipped === 0 ? "" : `，另有 ${skipped} 项是你跳过的（未验，没算进「已通过」）`) +
		(notChecked === 0 ? "" : `，另有 ${notChecked} 项标为「未检查」（没算进「已通过」）`) +
		(warned === 0 ? "" : `，另有 ${warned} 项提示你看一眼（只是提示，不拦交付）`);
	// 有没过项、有跳过项、有未检查项或有提示项时不折叠——这四档都不该藏起来。
	if (failed > 0 || warned > 0 || skipped > 0 || notChecked > 0)
		return createElement(
			"div",
			{ style: { margin: "10px 0" } },
			createElement(
				"p",
				{ style: { margin: "0 0 4px", fontSize: "12px", fontWeight: 600 } },
				summary,
			),
			...rows,
		);
	return createElement(
		"details",
		// 票 `ui-display-redesign/10`：交付页那两块要**默认打开**（可收）——`openByDefault` 只影响
		// 全过那一支；有失败/提示/跳过时本来就不折（那三档不藏）。终检卡不传它 ⇒ 全过照旧折。
		{
			style: { margin: "10px 0" },
			...(openByDefault === true ? { open: true } : {}),
		},
		createElement(
			"summary",
			{ style: { cursor: "pointer", fontSize: "12px", opacity: 0.85 } },
			`${summary}（点开看每一项）`,
		),
		createElement("div", { style: { margin: "6px 0 0" } }, ...rows),
	);
}

// ── 进度条 ──────────────────────────────────────────────────────────────────

// 进度条窄格标签：一律取界面用词表（原来这里另有一套 { 3:"设计", 5:"铺章", 6:"交付" } 短标签，
// 与 PHASES 的 canonical 全称混着用，同一格两套命名法）。
//
// 2026-09-21 用户裁决（经 `/prototype` 三轮）：**阶段片是导航面**——六格全可点，点一格＝去
// 那一步的页面（`ui/phase-page.js`），**不再**直接打开某份文件（旧行为：按"这一步有没有产物"
// 决定能不能点，点开就是预览）。于是：
//   - 可点性不再看产物：有 `onSelect` 就可点（没有则纯指示器，静态渲染/测试走这条）；
//   - `📄` 的含义从"能点开"改成"这一步已经有产物"（只在已完成格出现，纯信息）；
//   - hover 交代**目的地**：去「写完整本」这一步 · 这一步有 3 份文件；
//     **阶段 1 例外**：那一格数的是材料，说「这一步有 N 份材料」/「还没有材料」
//     （票 walkthrough-2026-10/03——它没有分段，按产物累计恒为 0，旧话恒说"还没有文件"）；
//   - `viewed`＝正在看哪一页，用一圈深色描边标出来——与"书走到哪一步"（蓝底，`S.seg`）区分开。
//
// 2026-09-22 票 12（不变量 13 / ADR-0012 决策 2 同日定稿）：那排六格**常驻**，回看态下
// 「当前阶段」那一格的脸直接写「回到现在」——**可见文字**就是判据（不许只活在悬浮提示里）。
// 于是这一格的两态文案是：
//   "现在"态（`viewed == null`）：`⚡ 写完整本`（轮到你时）/ `写完整本`——阶段名 + 状态色，照旧；
//   回看态（`viewed != null`，即 `browsing` 或 `viewPhase` 非空）：`⚡ 写完整本 · 回到现在`——
//     阶段名仍在（那是这一格的房间身份），另加一个看得见的「回到现在」affordance。
// `viewed` 在这里同时承担"回看态"这一信号：被看的那一步所属的阶段由 `client-entry.js` 传进来
// （浏览态传 `viewPhaseOfBrowsing`，阶段页态传 `viewPhase`），两者非空即"用户不在现在"。

/**
 * 数**材料**的那一阶段（「材料准备」）。它那一格与其余五格吃的不是同一份读数：
 * 它在宿主分段表里没有分段，产物计数结构上恒为 0（票 walkthrough-2026-10/03）。
 */
const MATERIAL_PHASE = 1;

export function PhaseBar(props) {
	const { phase, gate, status, onSelect, viewed, artifactCountOf } = props;
	const doneUpTo = phase - 1;
	const gateAwaiting = gate !== null && gate.status === "awaiting";
	const humanTurn = props.humanTurn === true || (gateAwaiting && phase === 3);
	return createElement(
		"div",
		{ style: S.bar },
		PHASES.map((item) => {
			// ⚠️ **阶段 1 那一格数的不是产物**（票 walkthrough-2026-10/03）：它没有分段，按分段
			// 累计恒为 0，于是那一格恒说「还没有文件」而同屏卡上列着材料。材料有它自己的量词
			// （`CONTEXT.md`「量词『份』」：数材料用「份」），读数走 `materialCount`。
			const isMaterialPhase = item.n === MATERIAL_PHASE;
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
			let label = PHASE_UI[item.n] ?? item.label;
			// 批 4（02 屏判读）：原来这里把当前格的阶段名整个换成「⚡轮到你」——于是「拍板定方案」
			// 那一格只剩「⚡轮到你」，看不出是哪个阶段（用户要的恰恰是"知道自己到哪一步"）。
			// 状态词要带出来，但名字不能丢：用前缀图标，与步清单同款。
			if (item.n === phase && humanTurn) label = `⚡ ${label}`;
			const count = isMaterialPhase
				? (Number.isSafeInteger(props.materialCount) ? props.materialCount : 0)
				: typeof artifactCountOf === "function"
					? (artifactCountOf(item.n) ?? 0)
					: 0;
			// `📄` 的含义是"这一步已经有产物"（ADR-0012 决策 1）。材料**不是产物**——它与产物
			// 是两个轴的事实（`CONTEXT.md`「素材角色」「材料分量」与「有正文的产物」那一族分轴），
			// 所以阶段 1 那一格**不借它顶上**（本票二选一：给材料自己的标记／那一格不加标记 ⇒ 选后者）。
			if (count > 0 && state === "done" && !isMaterialPhase) label = `${label} 📄`;
			const clickable = typeof onSelect === "function";
			const isViewed = viewed === item.n;
			// 回看态＝用户手里不是"现在"（`viewed` 非空）；此刻「当前阶段」那一格就是「回到现在」。
			const backToNow = viewed != null && item.n === phase;
			if (backToNow) label = `${label}，回到现在`;
			return createElement(
				"div",
				{
					key: item.n,
					style: {
						...S.seg(state),
						...(clickable ? { cursor: "pointer" } : {}),
						outline: isViewed ? "2px solid var(--dsw-alias-label-primary)" : "none",
						outlineOffset: isViewed ? "-2px" : "0",
					},
					// hover 文案**两态同形**（都写「去「X」这一步 · 有几份…」）：目的地信息一致，
					// 回看态下"点它其实是回到现在"由那一格脸上的可见文字承担（不靠 hover 才说得清），
					// 也免得同一条 hover 前缀随态变脸（既有断言按 `去「X」` 前缀选格，别让选择器碎掉）。
					// ⚠️ 前缀**不在这里手写**（票 17 · 收口 review F5）：`phaseChipTitlePrefix` 是唯一出处，
					// 画廊驱动器（`dev/gallery/knobs.js`）按同一个函数拼前缀选格。
					// ⚠️ 量词按阶段分：阶段 1 说「份材料」，其余说「份文件」（票 walkthrough-2026-10/03）——
					// 「份」是材料的量词，说阶段 1「还没有文件」是把材料说成了产物。
					title: clickable
						? `${phaseChipTitlePrefix(PHASE_UI[item.n] ?? item.label)}这一步${
								count > 0
									? `：有 ${count} ${isMaterialPhase ? "份材料" : "份文件"}`
									: `：还没有${isMaterialPhase ? "材料" : "文件"}`
							}`
						: undefined,
					onClick: clickable ? () => onSelect(item.n) : undefined,
				},
				label,
			);
		}),
	);
}

// ── 向导卡 ──────────────────────────────────────────────────────────────────

/**
 * 站 0 卡头那句问句（**屏级新写**，票 `ui-display-redesign/01`）。
 *
 * ⚠️ 屏级问句**不进** `decisionOf`：`view-rules.js` 的 `DECISION_QUESTION` 只留 8 个决策站的
 * 既有句子（站 0／站 1／交付属屏级，不归那张表管）。
 * ⚠️ 字面量写在**本文件**、并由 `WizardCard` 就地造那个 `<strong>` 再交给 `CardHead`：
 * 造书模式人设的「界面状态对照表」逐字引着这张卡的标题，而那条契约的取证面只读
 * `src/ui/**` 里 `createElement("strong", …)` 调用点上的字面量／同文件 `const`
 * （`test-context-vocabulary.mjs`）——⚠️ 别把问句只当字符串传给共用件代造。
 */
export const WIZARD_CARD_QUESTION = "这是一本什么书，学完要能做到什么？";
/** 站 0 卡头那句事实句（新写，票 `ui-display-redesign/01`）。 */
export const WIZARD_CARD_FACTS = "还没有书，建出来就能上传材料，一个会话只造一本。";

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
	const [science, setScience] = useState(false);
	// ⚠️ **票 `confirm-points-redesign-build/03`：这一屏不再问篇幅档位**（三档删除，连带书里
	// 不再有那个字段）。也不在这里问「一次最多派几个小助手」——那个旋钮留在**关卡拍板卡**
	// 那条「现在改还来得及」的行上（默认值＝已裁的 5）。**材料声明那句勾选也不在这里**：
	// 它搬到了站 1 的上传卡（`UploadArea`）——真正要上传材料的那一步。
	// ⚠️ **票 `confirm-points-redesign-build/06`：「这本书主要怎么学」也不再在这一屏问**——
	// 它搬去**站 4（第 1 关）那张卡**，跟学习目标一起拍、**拍板即锁定**（`GatePanel` 里
	// `gate === "1"` 那一支）。⇒ 这一屏既没有路线那一格，也就没有 `route` 这个本地状态、
	// 更不往建档 payload 里塞它：值要等站 4 拍板那一刻才**存在**。
	const [hint, setHint] = useState("");
	const [error, setError] = useState(null);

	// 票 17（走查 P5）：`error` 记的是**上一次提交的结果**，不是**当前的校验状态**——
	// 用户改正输入后那条红字就成了一句过期的话，还挂在控件下面，要再点一次提交才消失。
	// 口径收在这里一处：「**阻塞已不存在 ⇒ 提示必须撤**」，三个被校验的字段共用它。
	// ⚠️ 只撤提示，**不顺手加新的实时校验**（提交前就拦人，与「机器检查契约原则」相悖，
	// 也不符合「建档」词条：必填项在提交那一刻拦）。
	const edit = (setter) => (next) => {
		setError(null);
		setter(next);
	};

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
		// ⚠️ **材料声明那条本地校验也随它搬走了**（票 `confirm-points-redesign-build/03`）：
		// 那句勾选现在长在**站 1 的上传卡**上（`UploadArea`），由它拦「还没勾就想上传」。
		// ⛔ 建书屏不再问它：那时还没有材料可传，问了只是一句没有对象的承诺。
		// ⚠️ **篇幅档位那条本地校验随三档删除一并退役**：这一屏不再有可选的篇幅，也就不存在
		// 「没选就拦住」这件事。章节数上下限**都不判**；站 6 拍板的章数（`工作区/决策/06.json` 的
		// `values.chapters`）只做非阻断对账读数。
		// ⚠️ 票 `confirm-points-redesign-build/06`：**路线（这本书主要怎么学）不在这里发**
		// ——建书屏不再问它，值在**站 4 拍板**那一刻随关卡裁决一起写进书里（`gate-decide` 的
		// `route` 那一格）。建档 payload 里没有它，读侧照 `meta.route ?? "blueprint"` 兜底。
		onCreate({ name: name.trim(), goal: goal.trim(), science });
	};

	// 票 `ui-display-redesign/01`：站 0 块序（spec §2.1 逐字）——
	//   卡头问句＋事实句 → 书名 → 学完目标＋预告 → 学习者背景＋`✨ AI 建议` → 建议结果列表〔条件〕
	//   → 理科 → 校验红字〔条件〕 → `创建这本书`（卡底）→ 演示书入口（主键下）。
	// MinerU Token 卡与推广块**不在卡里**：壳把它们摆在这张卡之后（MinerU 折成一行，
	// 推广块默认折、最底那一块），见 `client-entry.js` 的无书单屏。
	// ⚠️ 旧抬头「📚 第一步 · 材料准备…」退役：一屏一个问题，卡头问句就是这一屏的标题。
	return createElement(
		"div",
		{ style: S.focus },
		createElement(CardHead, {
			question: createElement(
				"strong",
				{ style: CARD_HEAD_QUESTION_STYLE },
				WIZARD_CARD_QUESTION,
			),
			facts: WIZARD_CARD_FACTS,
		}),
		createElement("label", { style: S.label }, "书名"),
		createElement("input", {
			style: S.input,
			placeholder: "比如：初中数学：有理数",
			value: name,
			onChange: (e) => edit(setName)(e.target.value),
		}),
		createElement("label", { style: S.label }, "这本书学完，要能做到什么？"),
		createElement("textarea", {
			style: S.textarea,
			placeholder:
				"比如：能独立做对教材配套的基础题，并说出每个概念是什么、为什么、怎么用",
			value: goal,
			onChange: (e) => edit(setGoal)(e.target.value),
		}),
		// 票 `confirm-points-redesign-build/03`：这句预告**逐字照裁**（ADR-0037 决策 5 那一句
		// 「文案要预告『先写个大概，后面有一张卡跟你细化』」的落地写法）。它把这一格从一句空要求
		// 变成一个有下文的约定：粗档先写个大概，读过材料后由站 3 那张卡陪着细成 3–5 条。
		createElement(
			"p",
			{ style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.75 } },
			"先写个大概就行——读过材料后有一张卡陪你把它细成 3–5 条",
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
						// 批 4（第一屏判读）：原来「✨ AI 建议」也是 bigBtn(true)，和「创建这本书」
						// 两个一模一样的蓝实心并排——第一屏上"该点哪儿"又糊了。主操作只有一个：创建。
						style: S.disabled({ ...S.ghostBtn(false), padding: "6px 14px", marginTop: "4px" }, suggestLoading),
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
								style: S.disabled({ ...S.smallLink, marginLeft: "10px" }, suggestLoading),
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
		// ⚠️ 票 `confirm-points-redesign-build/06`：「给谁用？」那两颗 radio 整块**搬去站 4**
		// （第 1 关那张卡），措辞与预选都换了——见 `GatePanel` 里 `gate === "1"` 那一支。
		// 这里连标签一起不留：建书那一刻还没有「学习目标」可跟它一起拍，问了也只是替用户先选一次。
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
		// ⚠️ 那句**材料声明**原先长在这里，票 `confirm-points-redesign-build/03` 把它搬到了
		// **站 1 的上传卡**（`UploadArea`）——真正要上传材料的那一步。建书屏不再问它：
		// 那时还没有材料可传，勾了也只是走过场。
		error !== null ? createElement("p", { style: S.error }, error) : null,
		createElement(
			"div",
			{ style: { marginTop: "8px" } },
			createElement(
				"button",
				{ style: S.disabled(S.bigBtn(true), busy), onClick: submit, disabled: busy },
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
					style: S.disabled({ ...S.smallLink, marginLeft: "6px" }, busy),
					disabled: busy,
					onClick: () => onCreateDemo(),
				},
				// 票 14（承诺账 D「说不清」第 4 条）：「2 分钟走完全程」查无机制——demo 与真实共用
				// 同一套确认点（口径见 `CONTEXT.md` 的「确认点」词条），全程要用户在每一个停点上拍板，
				// 没有任何计时/自动推进。改成能兑现的说法。
				"先建一本演示书试试（不花模型额度，几步就能走完）",
			),
		),
	);
}

// ── 站 0 的推广块（票 `ui-display-redesign/01`：搬出建书卡、默认折、最底那一块）─────────────
//
// 它原先长在 `WizardCard` 里（卡尾一块常显的方框）。票 01 的块序是「MinerU 卡 → 推广块」，
// 两件都在卡**外**、由壳按顺序摆（见 `client-entry.js` 的无书单屏）；推广块默认折成一行，
// 不占首屏。内容一个字没改（合作方链接仍是真超链接）——只是默认态与位置。
/** 折叠口那一行（唯一出处）。 */
export const PROMO_FOLD_SUMMARY = "💡 关于本项目（邀请码 / 破卷）";
export function PromoFoldBlock() {
	return createElement(
		"details",
		{ style: { margin: "10px 0" } },
		createElement(
			"summary",
			{
				style: { cursor: "pointer", fontSize: "12px", opacity: 0.75 },
			},
			PROMO_FOLD_SUMMARY,
		),
		createElement(
			"div",
			{
				style: {
					marginTop: "8px",
					padding: "8px 10px",
					fontSize: "12px",
					lineHeight: 1.6,
					opacity: 0.75,
					border: "1px solid var(--dsw-alias-border-l2)",
					borderRadius: "8px",
					background: "var(--dsw-alias-bg-layer-1)",
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
							color: "var(--dsw-alias-state-business-primary)",
							textDecoration: "underline",
						},
					},
					"【破卷】",
				),
				"的衍生项目，邀请码：SCR-FEJXMQ。",
			),
		),
	);
}

// ── 错误正文（唯一判据） ─────────────────────────────────────────────────────

/**
 * 「这一次出错的正文是什么」的**唯一判据**——`StatusCard`（兜底臂）与 `UploadArea`（Phase 1
 * 的焦点主卡）共用这一份，**不许各写一份**。
 *
 * 优先后端落账的人话 `meta.lastErrorHuman`（页数超限／Token 失效已由 `humanizeMineruError`
 * 归一成人话），没有它才回退账本那边给来的原文（老书就是这个形状）。
 */
const ERROR_HEADING = "⚠️ 这一步出错了";
const TOKEN_HINT =
	"💡 MinerU Token 可能失效，可到工作台「MinerU Token」处点「重新设置」换新 Token。";
function humanErrorOf(meta, fallbackMessage) {
	if (typeof meta?.lastErrorHuman === "string" && meta.lastErrorHuman !== "")
		return meta.lastErrorHuman;
	if (typeof fallbackMessage === "string" && fallbackMessage !== "") return fallbackMessage;
	return "未知错误";
}
/** 同一句的另一个来路：账本里**最后一条** `textbook/error` 的原文（`UploadArea` 手上只有 `events`）。 */
function lastErrorEventMessage(events) {
	const list = Array.isArray(events) ? events : [];
	for (let i = list.length - 1; i >= 0; i -= 1) {
		const one = list[i];
		if (one?.type === "textbook/error") return one?.data?.message;
	}
	return undefined;
}
const isTokenIssueOf = (text) => text.includes("Token") || text.includes("token");

// ── 上传区（Phase 1） ───────────────────────────────────────────────────────

/**
 * 上传卡吃什么：材料清单与转换状态（都从**书**的 `meta` 上现算）+ 三个动作回调 + 事件账本。
 *
 * · `sources` / `converting` / `conversionStartedAt` —— 壳调用点上原本是三条现算表达式
 *   （`meta.sources ?? []` / `meta.converting === true` / `meta.updatedAt`），取值与形状**逐字**
 *   搬进 `derive`；`meta` 因此要进 `fromBook`（连同下面那条 `errorText`，四条的唯一来源）。
 *   `sources` 的空缺省同时换成模块级 `NO_SOURCES`（见它的定义处）：壳那边 `?? []` 每帧新建
 *   一个数组，违反缺省规则 3。
 * · ⚠️ **`errorText`（2026-10-08 修；票 `ui-systematic-fixes/07` 把这里那句事实改准）**：phase 1
 *   出错时焦点区主卡**就是这张上传卡**——但它不是「排在所有 `status` 判断之前」，而是
 *   `view-rules.focusCardKey` 里**唯一一条显式例外**（`if (status === "error" && meta?.phase !== 1)
 *   return "status"`；其余出错／待配置两档一律先落状态卡，票 07 改的那一格）。留这个例外的理由：
 *   材料缺口那两个出口（「补传这一份」／「删掉这份」）**只长在这张卡里**，落到状态卡会把它们整块
 *   挡掉。而错误正文原先**只有 `StatusCard` 会印** ⇒ 状态条那句「⚠️ 轮到你 · 出错了，
 *   请看下面的提示」指向一张**一个字都没有**的卡（真机：书夹 `project.json` 里
 *   `{"phase":1,"status":"error","lastErrorHuman":"fetch failed"}`，屏上零提示）。
 *   它由 `derive` 从**已经在袋里**的 `meta` + `events` 现算（`humanErrorOf` +
 *   `lastErrorEventMessage`，与 `StatusCard` 同一份判据）：非 error 态给 `null`＝这一格整条
 *   不出声，**不在卡里另写一句标题或取数**。
 * · `meta` 必填 —— 漏了它，上面三条会一起塌成「一本书都没传过 / 没在转」，那是对用户说假话的
 *   静默降级。（`null` 放行：`required` 只拦 `undefined`，与缺省规则 2「`null` 是显式的『没有』」
 *   同一条。）
 * · `onUpload` / `onConvert` 必填 —— 两处都是裸调用（`await onUpload(...)`、`onClick: onConvert`）。
 *   漏了 `onUpload`，用户点「上传这 N 本」什么都不发生；漏了 `onConvert`，「② 开始转换」那颗键
 *   点下去静默无反应。按钮在、动作没了，就是票 01 查出的那种静默降级 ⇒ 装配期就抛，并点名是
 *   哪张卡、缺哪个字段。
 * · ⚠️ **票 `pre-gold-build/02`：这一屏不再有「角色」这一栏**——于是也没有 `onIdentify` 这个
 *   输入了（那条「按文件名猜 → AI 识别 → 用户手改」的三层流水线整条退役；角色改由探查段开头
 *   那一趟书级材料判定产出，见 `.scratch/pre-gold-processes/issues/11` 的 §6 第 1 行）。
 * · `busy` / `events` **不**必填：前者只当 `disabled`（undefined 与 false 同义）；后者喂
 *   `materialConversionActivityText`，而它下游 `currentConversionProgress` 自己
 *   `Array.isArray(events) ? events : []` 兜底（`view-rules.js:1018`），读不到只会少报一句活动明细。
 * · ⚠️ **票 `mineru-formats/03` 在这张卡上又加了三个输入**（材料不齐时逐个表态：「补传这一份」
 *   /「删掉这份」，以及上传前的按格式体积预检）。收编（票 02）与那笔**在 main 上并行发生过**，
 *   所以这里补登记：`autoSplit` 由**内层**组件消费（不是顶层解构，靠透传），另两个是顶层解构。
 *   若当初只按顶层解构点名，这三个会被当成「卡不消费」而漏掉——记在这里，因为同一个坑对
 *   `phase-page.js`（13 个 `props.某名` 直读）也成立。
 */
export const uploadAreaView = defineCardView({
	card: "UploadArea",
	fromBook: [
		"meta",
		"events",
		"onUpload",
		"onConvert",
		// 票 `mineru-formats/03`：补传这一份（沿用上传写面，但**以缺口那一格的名字**落上去）。
		"onReplaceSource",
		// 票 `mineru-formats/03`：删掉这一份（走 `source-remove`；只对 `failed` 的那一格开放）。
		"onRemoveSource",
		// 票 10：上传前那道按格式的体积预检（`false` = 不许承诺会自动拆）。**由内层组件消费**。
		"autoSplit",
		"busy",
		// 票 `demo-channel-full/02`：**演示书**那一屏才有的一颗键（阶段一的「▶ 开始演示」）。
		// ⛔ 不列 `required`：真实书的阶段一没有它，列必填会让所有既有的渲染夹具当场缺项；
		// 缺省 `null` ＝ 这颗键不渲染（见下面 `defaults`）。
		"onDemoNext",
	],
	required: ["meta", "onUpload", "onConvert"],
	defaults: {
		// 票 `demo-channel-full/02`：缺省 `null`——只有演示书那一屏传它。
		onDemoNext: null,
	},
	derive: (book) => ({
		sources: book.meta?.sources ?? NO_SOURCES,
		converting: book.meta?.converting === true,
		conversionStartedAt: book.meta?.updatedAt,
		// 见上方契约注释：非 error 态给 `null`（整条不出声），error 态给那一句正文。
		errorText:
			book.meta?.status === "error"
				? humanErrorOf(book.meta, lastErrorEventMessage(book.events))
				: null,
	}),
});

// ── 站 1 卡头行／灰键理由／主出口（票 `ui-display-redesign/02`）────────────────────────
//
// 站 1 是第二个在卡头印「问句＋事实句」的屏，复用 `card-head.js` 那一件（字号/间距/颜色只定义
// 在那里一次）。问句是**屏级新写**，⛔ 不进 `decisionOf`：`decisionOf(meta,null).question` 对
// `upload` 仍取 `phase1TurnAction(meta)`（状态条那一句），那是别处的输入、一个字不改。
//
// ⚠️ 问句字面量必须写在**本文件**、并由 `UploadArea` 就地造那个 `<strong>` 再交给 `CardHead`
// （理由见 `WIZARD_CARD_QUESTION` 上面那段：人设对照表的逐字取证面只读 `src/ui/**` 里
// `createElement("strong", …)` 调用点上的字面量／同文件 `const`）。
export const UPLOAD_CARD_QUESTION = "材料齐了、可以开工吗？";
/** 角色说明折口的折叠口一行（唯一出处）。 */
export const UPLOAD_ROLE_FOLD_SUMMARY = "这些材料放在哪？每份是什么角色？";
/** 主出口那一行小字（唯一出处）：逐份明细统一去阶段页看，这一屏只报状态。 */
export const UPLOAD_EXIT_NOTE = "这一屏只报状态；逐份的转换稿／原件去阶段页的材料清单看。";

/**
 * 站 1 的卡头事实句（**派生**，票面逐字例：`已传 1 份 · 还有 1 份待上传 · 材料声明还没勾。`）。
 *
 * 三段各自取值：已传＝`meta.sources` 的条数；待传＝本屏本地待传清单的条数（0 时不说「还有 0 份」，
 * 说「还没有选材料」——那才是此刻的事实）；声明＝本地勾否。⛔ 不编第四个数字。
 */
export function uploadCardFacts({ sources, pending, agree }) {
	const uploaded = Array.isArray(sources) ? sources.length : 0;
	const waiting = Array.isArray(pending) ? pending.length : 0;
	const head = `已传 ${uploaded} 份`;
	const tail = waiting > 0 ? `还有 ${waiting} 份待上传` : "还没有选材料";
	return `${head}，${tail}，材料声明${agree === true ? "已勾" : "还没勾"}。`;
}

/**
 * 上传键灰着时**就地**那一条理由（票面：无待传／未勾声明／忙三种原因都要有理由句）。
 * 键可点（`null`）时调用方整条不渲染——理由只解释「为什么现在按不动」。
 *
 * 优先序＝「正在发生的事」先说：上传中＞书级忙＞缺材料/缺声明。两样都缺时合成一句。
 */
export function uploadDisabledReason({ busy, uploading, pendingCount, agree }) {
	if (uploading === true) return "正在上传这几份，传完就能继续。";
	if (busy === true) return "正在忙别的，等它停手再传。";
	const waiting = Number.isSafeInteger(pendingCount) ? pendingCount : 0;
	const needFiles = waiting === 0;
	const needAgree = agree !== true;
	if (needFiles && needAgree) return "先选材料、勾上声明，才能上传。";
	if (needFiles) return "先选材料，才能上传。";
	if (needAgree) return "勾上上面的声明，才能上传。";
	return null;
}

/**
 * 一份选中的文件的字节（票 `upload-formats/01`）：**读不到就返回 `null`**，不抛。
 *
 * 为什么读不到不抛：这条路径只服务「坏件与格式分开报」那一档——读不到字节时判据会退成
 * 「只给方向，不判坏件」，那仍然是一个**正确**的结局（用户照样知道该去转换）。
 * 抛出去则会把「选个文件」变成一次报错，而错的原因（老浏览器没有 `arrayBuffer`）与用户无关。
 *
 * ⚠️ 整份读进内存是既有口径：`uploadSource` 对每一份真正要上传的文件也是 `await file.arrayBuffer()`
 * ——这里没有新开一条更贵的路（而且只对通道外的那几档走）。
 */
async function readBytesOf(file) {
	if (file === null || file === undefined || typeof file.arrayBuffer !== "function") return null;
	try {
		return new Uint8Array(await file.arrayBuffer());
	} catch {
		return null;
	}
}

export function UploadArea(props) {
	const {
		meta,
		sources,
		converting,
		conversionStartedAt,
		events,
		errorText = null,
		onUpload,
		onConvert,
		onReplaceSource,
		onRemoveSource,
		busy,
		// 票 10：本机**真探到**了自动切分能力（Python + PyMuPDF）吗？由 `/textbook/settings`
		// 下发（`mineru-lib` 的探针）。⚠️ 缺省是 **false** —— 「探不到」必须落到「不许承诺会自动拆」
		// 那一档，写成 true 就等于给一句没人验过的承诺。
		autoSplit = false,
		// 票 `demo-channel-full/02`：演示书那一屏的「往下走」那颗键。缺省 `null` ＝ 不渲染。
		onDemoNext = null,
	} = props;
	// ⚠️ 演示书那条分叉（票 `demo-channel-full/02`）：**只**在演示书 ＋ 阶段一 ＋ 壳真递了回调时出现。
	// 登记在 `src/demo-exemptions.js` 的 `demo-phase1-continue-key` 那一条里，守卫点就是下面这一行。
	const demoNextVisible =
		meta?.demo !== true ? false : meta.phase === 1 && typeof onDemoNext === "function";
	// ⚠️ 每项只有「名字 ＋ 文件」——**票 `pre-gold-build/02` 起这里没有角色**：上传那一刻还没有
	// 角色这回事（它由探查段开头的书级材料判定产出），所以也没有「猜／识别／手改」三层。
	const [pending, setPending] = useState([]); // [{ name, file }]
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState(null);
	// 票 `confirm-points-redesign-build/03`：那句**材料声明**搬到了这一屏（真正要上传的那一站）。
	// 建书屏不再问它——那时还没有材料可传，问了也只是走过场；这里问，用户正对着要传的文件。
	// 口径与建书屏那条本地校验同源：**没勾不许发上传**（按钮灰着＋一个动作都不发）。
	const [agree, setAgree] = useState(false);
	// 票 10：**不拦**但要说的一句（PDF 超 200MB 而本机切得开/切不开时的说明）。
	// 与 `error` 分开两格：拦路的话是错色，说明的话不该长得像一次失败。
	const [notice, setNotice] = useState(null);

	// 选择文件（可多选）：只把名字与文件收进待传清单，**不猜角色、也不发识别请求**。
	//
	// ⚠️ **票 `upload-formats/01`：选到不该收的文件不许静默丢掉。** 原实现是「选到什么就往
	// `pending` 里塞什么」，于是 `.epub` 这种云端通道根本不收的格式会一路走到上传、吃一句
	// 400（用户白等），而 `<input accept>` 又让它常常**连选都选不到**——两头都不说话。
	// 现在这一格先过**两侧共用的那份判据**（`judgeMaterialFileIntake`，服务端闸门调的是同一份）：
	//   · 受理的：照旧进待传清单；
	//   · 通道外有出路的（epub）：**不进清单**，屏上给一条可执行的提示；
	//   · 坏件：**不进清单**，报「文件已损坏」（与「格式不支持」分开，用户要做的事不一样）。
	// 「拦」的话为什么走 `error` 而不是 `notice`：`notice` 在本卡的定义是「**不拦**，只说」
	// （票 10 的体积说明）——这两种文件是真没被收下，染成中性色就是另一句假话。
	const applyPicked = (judged) => {
		const rejected = judged.filter((one) => one.verdict.status !== MATERIAL_INTAKE.ACCEPTED);
		const accepted = judged.filter((one) => one.verdict.status === MATERIAL_INTAKE.ACCEPTED);
		if (rejected.length > 0) {
			// 逐份点名：多选时「有一份没进来」不够，用户得知道是哪一份、为什么。
			setError(
				rejected
					.map(({ file, verdict }) => `《${file.name}》${verdict.message}`)
					.join("；"),
			);
		}
		if (accepted.length === 0) return;
		// ⚠️ 用**函数式**更新而不是「拿闭包里那份 `pending` 算完再 set」：这一格现在可能是
		// **异步**到的（通道外那几档要读字节），两次快选之间闭包里那份可能已经过期——
		// 拿旧的算完覆写，会把先选的那一批悄悄丢掉。
		setPending((prev) => {
			const seen = new Set();
			const next = prev.filter(
				(item) => !accepted.some(({ file }) => file.name === item.name),
			);
			accepted.forEach(({ file }) => {
				if (seen.has(file.name)) return;
				seen.add(file.name);
				next.push({ name: file.name, file });
			});
			return next;
		});
	};

	const pick = (e) => {
		setError(null);
		setNotice(null);
		const files = Array.from(e.target.files ?? []);
		e.target.value = "";
		if (files.length === 0) return;
		// 第一段只看名字（同步，绝大多数路径走这里）；只有**通道外**那几档要读字节——
		// 不读字节就分不出「这个格式云端不收」与「这份文件本身是坏的」。
		const byName = files.map((file) => ({ file, verdict: judgeMaterialFileIntake({ name: file.name }) }));
		if (byName.every((one) => one.verdict.needsBytes === false)) {
			applyPicked(byName);
			return;
		}
		// 读不到字节（老浏览器 / 夹具）时 `readBytesOf` 给 `null`，判据于是只给方向、
		// **不替这份文件宣布「已损坏」**（少说一句只是啰嗦，多说一句就是承诺）。
		void (async () => {
			const judged = await Promise.all(byName.map(async ({ file, verdict }) => (
				verdict.needsBytes === true
					? { file, verdict: judgeMaterialFileIntake({ name: file.name, bytes: await readBytesOf(file) }) }
					: { file, verdict }
			)));
			applyPicked(judged);
		})();
	};

	const uploadAll = async () => {
		if (pending.length === 0) {
			// 票 09：数材料说「材料」，不把上传入口按扩展名说成 PDF 入口。
			setError("请先选择材料文件");
			return;
		}
		// 票 `confirm-points-redesign-build/03`：声明是**发上传的前置**（与书名/目标同一条本地校验：
		// 只写红字、一个动作都不发）。按钮也灰着，这一支是防「灰按钮被别的路绕过去」的兜底。
		if (!agree) {
			setError("请先勾选材料声明");
			return;
		}
		setUploading(true);
		setError(null);
		setNotice(null);
		const failed = [];
		// 票 10：**不拦**但要说的那几句（PDF 超 200MB）。与 `failed` 分开：拦与说是两件事。
		const notes = [];
		for (const item of pending) {
			// 上传前预检：超限直接标记失败（服务端 413 同一文案），不发起注定失败的大请求。
			// ⚠️ 判据由 `judgeMaterialUploadSize` 一处给出（`src/domain-rules.js`）：**按格式**分档，
			//  ① 500MB 那道（仓门）与 ② 200MB 那道（MinerU 云端）**分别说**，不合成一句；
			//  ② 那一道对**非 PDF** 是拦（`page_ranges` 官方只对 PDF 生效、本机物理切也只对 PDF
			//  跑得起来 ⇒ 一律请用户自己拆），对 PDF 是不拦、只如实说会不会先切。
			const verdict = judgeMaterialUploadSize({ name: item.name, size: item.file.size, autoSplit });
			if (verdict.blocked) {
				failed.push({
					item,
					message: verdict.message,
					retryable: false,
				});
				continue;
			}
			// 只有**没拦**的那几份才进 `notes`：被拦的那句已经由红字那条说了，
			// 两处各说一遍＝同一件事在屏上响两次。
			if (verdict.message !== "") notes.push(`${item.name}：${verdict.message}`);
			try {
				// ⚠️ 第三位是**材料声明**（票 cprb/03）：勾了就随这一趟上传交上去，服务端据此落
				// `meta.materialDeclaration` ＋ 一条账。⛔ 它不由服务端替用户补——没勾界面上就发不出去。
				await onUpload(item.file, null, agree);
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
		} else {
			// 只保留失败的项：重试不重传已成功落盘的（服务端已按文件名幂等，重复传也不会再加一条）。
			const failedNames = new Set(failed.map((f) => f.item.name));
			setPending((prev) => prev.filter((i) => failedNames.has(i.name)));
			const first = failed[0];
			// 票 10（判定一 #10）：单份与多份两条分支原来说两句话（「；重试只会重传这一份」/
			// 「，将仅重试失败项」）——同一件事收敛成同一句，两条分支都用它。
			// 票 09：量词收窄到材料（「份」），「本」留给「书」。
			const retryHint =
				first.retryable === false ? "" : "；只会重试失败的那几份";
			const anyRetryable = failed.some((f) => f.retryable !== false);
			setError(
				failed.length === 1
					? `上传失败：${first.item.name}（${first.message}${retryHint}）`
					: `有 ${failed.length} 份上传失败（如 ${first.message}）${anyRetryable ? "；只会重试失败的那几份" : ""}`,
			);
		}
		if (notes.length > 0) setNotice(notes.join("\n"));
		setUploading(false);
	};

	const conversionText = materialConversionActivityText(
		{ converting: converting === true, updatedAt: conversionStartedAt },
		events,
	);
	// 票 `ui-display-redesign/02`：卡头事实句与灰键理由都是**现算**的（唯一出口在文件上方
	// `uploadCardFacts` / `uploadDisabledReason`，⛔ 不在渲染里再拼第二份）。
	const cardFacts = uploadCardFacts({ sources, pending, agree });
	const disabledReason = uploadDisabledReason({
		busy,
		uploading,
		pendingCount: pending.length,
		agree,
	});
	// 票 `upload-formats/01`：「云端通道不收、但有出路」那一行（唯一出口在 `rules.js`，现算一次）。
	const offChannelNote = offChannelMaterialFormatNote();

	return createElement(
		"div",
		{ style: S.focus },
		// ⚠️ 出错这一段**排在①之前**：状态条那句「出错了，请看下面的提示」指的就是它，
		// 而 phase 1 的焦点主卡就是这张卡（错不到 `StatusCard` 去——见上方契约注释）。
		// 非 error 态 `errorText` 是 `null` ⇒ 整条不渲染，不上屏一个空框。
		errorText === null
			? null
			: createElement(
					"div",
					{
						style: {
							margin: "0 0 10px",
							padding: "8px 10px",
							borderRadius: "8px",
							border: "1px solid var(--dsw-alias-state-error-primary)",
						},
					},
					createElement(
						"strong",
						{ style: { color: "var(--dsw-alias-state-error-primary)" } },
						ERROR_HEADING,
					),
					createElement("p", { style: { margin: "6px 0 0" } }, errorText),
					isTokenIssueOf(errorText)
						? createElement(
								"p",
								{ style: { margin: "4px 0 0", fontSize: "13px", opacity: 0.9 } },
								TOKEN_HINT,
							)
						: null,
				),
		// 票 `ui-display-redesign/02`：卡头行（屏级问句＋派生事实句）是这一屏的第一块，
		// 排在「① 上传材料」之前；问句节点就地造（理由见 `UPLOAD_CARD_QUESTION` 上面那段）。
		createElement(CardHead, {
			question: createElement(
				"strong",
				{ style: CARD_HEAD_QUESTION_STYLE },
				UPLOAD_CARD_QUESTION,
			),
			facts: cardFacts,
		}),
		createElement(
			"strong",
			{ style: { fontSize: "13px" } },
			"① 上传材料（可一次选多份）",
		),
		// 票 `ui-display-redesign/02`：这条长说明默认**折成一行**（今天常显占首屏）——
		// 展开内容就是今天那一句，逐字不变（`materialRoleNote` 的两取值也没动）。
		createElement(
			"details",
			{ style: { margin: "4px 0 8px" } },
			createElement(
				"summary",
				{ style: { cursor: "pointer", fontSize: "12px", opacity: 0.7 } },
				UPLOAD_ROLE_FOLD_SUMMARY,
			),
			createElement(
				"p",
				{ style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
				// 票 10（判定四③）：原句 76 字压到 90 字内——删掉与上方 📁 路径行重复的「见上方 📁 路径」
				// 与「都保存在里面」这类可从"文件夹＝书名"推出来的话。
				// 票 09：退役「教材 PDF／上传的 PDF」，数材料说「份」。
				// 票 `pre-gold-build/02`：这一屏不再有「角色」这一栏，那句「每份是什么角色由 AI 自动识别」
				// 随之退役——角色改由**探查段开头那一趟书级材料判定**产出（那时它才读得到材料内容）。
				// 票 `demo-channel-full/26`：这句的「由 AI …判定」对演示书是假话（那份判定由机器写，
				// 见 `view-rules.materialRoleNote` 的读数）⇒ 两取值。
				materialRoleNote(meta),
			),
		),
		// 票 `ui-display-redesign/02`：**演示书的阶段一**那一块（「▶ 开始演示」＋说明）按 spec §2.2
		// 的块序摆在**这一屏最末**（第 17 块，材料缺口块之后）——实现见本卡返回值的末尾。
		createElement("label", { style: S.label }, "选择材料（可多选）"),
		createElement("input", {
			type: "file",
			// ⚠️ 票 07：由 `MATERIAL_FORMATS` 派生（与**服务端那道受理闸门同一份常量**）。
			// 原来这里写死 `".pdf"`，用户连 docx 都选不到；写死与后端手抄的 `/\.pdf$/i`
			// 各改一处就会分叉（前端放行、后端拒收）。改名单时这一行自动跟随。
			accept: materialFormatAccept(),
			multiple: true,
			style: S.input,
			onChange: pick,
		}),
		createElement(
			"p",
			{ style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
			materialFormatHint(),
		),
		// 票 `upload-formats/01`：「支持格式」下面另起一行，说清**云端通道不收、但有一条路**的那几档
		// （今天只有 epub）。为什么必须常显：`<input accept>` 本来就列不出 `.epub`（那是云端通道的
		// 事实），只靠「选到才提示」等于提示永远不出现——而票面「现象」那一句说的正是
		// 「只列白名单让人自己猜」。
		// ⚠️ 这一行取的是表里的 `hint`（短句：要转换、转成什么）；**完整出路**（含命令）是
		// `guidance`，由**选到它时**那条红字说。两处都从同一张表取，只是各取一格——⛔ 不在渲染里另写。
		offChannelNote === ""
			? null
			: createElement(
					"p",
					{ style: { margin: "2px 0 0", fontSize: "12px", opacity: 0.7 } },
					offChannelNote,
				),
		// ⚠️ 票 `ui-display-redesign/02`（spec §2.2 第 8 块「已删」）：那句**格式标定**说明
		// （「已实测可用…其余 N 种未标定」）**不再上屏**——它那个函数与实测闭包判据都留着
		// （`test-material-format.mjs`），只是界面上不摆这一行。
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
							`待上传 ${pending.length} 份：`,
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
						),
					),
				)
			: null,
		// 票 10：说明与错是两件事——`notice`（不拦，只说）用中性色，`error`（拦）用错色。
		// 把「不拦但要说」的那几句混进红字里，用户会以为上传失败了。
		notice !== null
			? createElement(
					"p",
					{ style: { margin: "6px 0 0", fontSize: "12px", whiteSpace: "pre-line", opacity: 0.85 } },
					`ℹ️ ${notice}`,
				)
			: null,
		error !== null ? createElement("p", { style: S.error }, error) : null,
		// 票 `confirm-points-redesign-build/03`：**材料声明**（从建书屏搬到真正要上传的这一站）。
		// 位置：上传按钮**正上方**——它是那一颗按钮的前置，不是这一屏的装饰。
		createElement(
			"label",
			{ style: S.checkItem },
			createElement("input", {
				type: "checkbox",
				checked: agree,
				onChange: (e) => {
					setError(null);
					setAgree(e.target.checked);
				},
			}),
			" 我确认：只上传我有权使用的材料；造出来的是教学参考，AI 可能讲错，使用前我会请老师/家长复核",
		),
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
					// 没勾声明时这颗键灰着（与 `uploadAll` 里那条校验同一件事的两面）。
					style: S.disabled({ ...S.bigBtn(true), padding: "8px 14px" }, busy || uploading || pending.length === 0 || !agree),
					onClick: uploadAll,
					disabled: busy || uploading || pending.length === 0 || !agree,
				},
				pending.length > 0 ? `上传这 ${pending.length} 份` : "上传",
			),
		),
		// 票 `ui-display-redesign/02`：键灰着时理由**就在键旁边**（三种原因都有一句）；键可点时
		// 整条不渲染。唯一出口是 `uploadDisabledReason`（⛔ 不在渲染里再拼第二份措辞）。
		disabledReason === null
			? null
			: createElement(
					"p",
					{ style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.8 } },
					disabledReason,
				),
		sources.length > 0
			? createElement(
					"div",
					{ style: { marginTop: "8px", fontSize: "12px", opacity: 0.85 } },
					createElement(
						"div",
						{ style: { margin: "0 0 4px" } },
						`已上传 ${sources.length} 份：`,
					),
					sources.map((source) =>
						createElement(
							"div",
							{
								key: source.file,
								style: { wordBreak: "break-all", margin: "2px 0" },
							},
							`${convertedIcon(source)} ${source.file}`,
						),
					),
				)
			: null,
		// 票 `ui-display-redesign/02`（spec §2.2 第 14 块）：主出口一行小字——这一屏只报状态，
		// 逐份的转换稿／原件去阶段页的材料清单看（⛔ 不在本屏新增那两颗入口，ADR-0034 的
		// 「材料清单主出口＝阶段页」照旧）。
		createElement(
			"p",
			{ style: { margin: "8px 0 0", fontSize: "12px", opacity: 0.75 } },
			UPLOAD_EXIT_NOTE,
		),
		sources.length > 0
			? createElement(
					"div",
					{ style: { marginTop: "10px" } },
					createElement(
						"button",
						{
							style: S.disabled(S.bigBtn(true), busy || converting),
							onClick: onConvert,
							disabled: busy || converting,
						},
						"② 开始转换（机器自动跑）",
					),
					converting
						? createElement(
								"p",
								{ style: { margin: "8px 0 0", fontSize: "12px" } },
								`🤖 ${conversionText}`,
							)
						: null,
				)
			: null,
		// 票 `mineru-formats/03`：材料不齐时书**停在这一步**（ADR-0028 决策 3），于是这一张
		// 卡片就是那个红的**唯一可行动出口**——每一份红源在这里有补传／删掉两条路。
		// 没有缺口时整块不渲染（不是渲染一块空的）。
		createElement(MaterialGapList, {
			sources,
			busy,
			onReplaceSource,
			onRemoveSource,
			// 票 10：补传那颗选择器背后那道**按格式**的体积预检与上传卡**用同一个事实**
			// （`/textbook/settings` 的 `autoSplitAvailable` 经 `client-entry` 透传下来）。
			// 不透传的话它只能取缺省 false＝「探不到」，那句话会与上传卡那一屏不一致。
			autoSplit,
		}),
		// 票 `ui-display-redesign/02`：**演示书的阶段一**那一块按 spec §2.2 的块序摆在**最末**
		// （第 17 块）。它是这一屏唯一属于演示通道的分叉，守卫与文案一个字未动（票
		// `demo-channel-full/02`）：只在演示书 ＋ 阶段一 ＋ 壳递了回调时出现。
		// ⛔ 它不叫「开始转换」：那会承诺一件这条通道有意不做的事。
		demoNextVisible
			? createElement(
					"div",
					{
						style: {
							margin: "10px 0",
							padding: "10px 12px",
							borderRadius: "10px",
							border: "1px solid var(--dsw-alias-border-l2)",
						},
					},
					createElement(
						"div",
						{ style: { fontSize: "13px", marginBottom: "8px", opacity: 0.85 } },
						"这是演示书：材料准备已完成（展示态——演示模式不真做转换，也不花模型额度）。",
					),
					createElement(
						"button",
						{
							style: S.disabled(S.bigBtn(true), busy === true),
							disabled: busy === true,
							// 票 `auto-walkthrough/04`：关键键的语义钩子（D17；⛔ 不是 test id 全量体系）。
							"data-demo-start": "1",
							onClick: onDemoNext,
						},
						"▶ 开始演示（往下走）",
					),
				)
			: null,
	);
}

// ── 状态卡 / 错误卡 ─────────────────────────────────────────────────────────

/** error 卡头问句（**屏级新写**，⛔ 不进 `decisionOf`：出错不是拍板点）。 */
export const ERROR_CARD_QUESTION = "出了什么事、你能做什么？";
/** error 卡头事实句（⛔ 不重复错误正文：正文只说这一次坏在哪）。 */
export const ERROR_CARD_FACTS = "出错停在这一步；书和已经上传的材料都还在。";
/** needs-config 卡头问句（**屏级新写**，⛔ 不进 `decisionOf`）。 */
export const NEEDS_CONFIG_CARD_QUESTION = "需要先配置什么？";
/** needs-config 卡头事实句（缺的是一项配置，不是整本书坏了）。 */
export const NEEDS_CONFIG_CARD_FACTS = "缺的是一项配置；配好点「继续」就能往下走。";
/** running 卡头问句（**只问句、无事实句**：进度叙述与计时行各自只有一处）。 */
export const RUNNING_CARD_QUESTION = "现在在做什么、等了多久？";

/**
 * 兜底状态卡吃什么：整份书级快照 + 活性行**已经算好的**那一份判定 + 删书一步的回调。
 *
 * 它是焦点区路由的 `default:` 臂——没被专门路由走的状态全落在这一张卡上，所以它是本文件里
 * props 最宽的一张：10 位里 8 位是**只读快照／派生／壳状态**，另 2 位是回调（`onResume`／
 * `onDeleteConfirm`）；每位的消费点都写在卡内（`meta.status` 决定三条分支、`events` 算写章进度与
 * 这一步的起点、`lastEvent` 取人话错误），没有第二份推导。
 * · `meta` 必填 —— 漏了它在第一条分支就崩（`meta.status`，无 `?.`）。`spec.md` 的 error modes
 *   也把「缺 `meta`」列为这些 slot 的真错：没有书时它们一个都不渲染。
 * · `onResume` 必填 —— 两颗键（「🔁 让 AI 接着干」「我配好了，继续」）都是 `onClick: onResume`
 *   裸接，漏了就是用户点下去**什么都不发生**、界面零变化——票 01 查出的静默降级那种形状
 *   （`dead-gates` 不变量 7 禁的就是它）。
 * · `onDeleteConfirm` **不**必填 —— 删书入口仍是**有意可选**的（卡内注释逐字写着「仅在父级
 *   传入删除回调时显示」），`typeof onDeleteConfirm === "function"` 是这条功能的判据，不是防
 *   「壳忘了传」的守卫。票 `ui-display-redesign/20` 起它是**一步**：点一下直接发
 *   `book-delete`，不再有「确认删除这本书（进回收站）」中间态（旧书进回收站可找回）。
 * · 其余 `lastEvent` / `events` / `chapterStatus` / `needsConfig` / `busy` / `pendingStageLabel` /
 *   `progressDetail` / `stall` **不**必填：每一位都有 `?.` / `??` / `typeof` 兜底，缺了只少一截
 *   显示，不丢动作。其中 `needsConfig` 值得单说：壳里 `needsConfigText` 两个分支都带兜底文案、
 *   恒为非空串，而它在卡内是**纯显示值**（`createElement("p", …, needsConfig)`）——真缺了也
 *   只是那一行空着，不该为它白屏。
 */
export const statusCardView = defineCardView({
	card: "StatusCard",
	fromBook: [
		"meta",
		"lastEvent",
		"events",
		// 票 `audit-state-regression/01`：阶段五「已完成 N/M 章」与章节卡、交付闸读**同一份**
		// 服务端派生 `chapterStatus[].done`（它含检查记录新鲜度）——缺了它这里就会退回本地账本
		// 口径，正文返工后仍报「十章已完成」的假信号正是这么来的。
		"chapterStatus",
		"needsConfig",
		"onResume",
		"busy",
		"pendingStageLabel",
		"progressDetail",
		"stall",
		"onDeleteConfirm",
	],
	required: ["meta", "onResume"],
});

export function StatusCard(props) {
	const {
		meta,
		lastEvent,
		events,
		// 票 `audit-state-regression/01`：阶段五计数的**主来源**——与章节卡同读服务端
		// `chapterStatus[].done`（含检查记录新鲜度）。缺了它才退回本地账本口径。
		chapterStatus,
		needsConfig,
		onResume,
		busy,
		pendingStageLabel,
		progressDetail,
		// 票 stale-detection/01：状态卡不再自己算一遍停顿时长、也不再出黄色警告框与那颗按钮——
		// 这一屏唯一的出口是活性行（每个阶段都在，而状态卡只在兜底那一支才在）。
		// 它消费的**就是活性行那一份判定对象**（`src/ui/rules.js` 的 `deriveStallJudgment`）：
		// 票 `ui-display-redesign/20` 起卡内计时行只报时长（「⏱ 这一步已进行 X」），
		// 「我正在做」那半句只留状态条一处。
		stall,
		onDeleteConfirm,
	} = props;
	const [, tick] = useState(0);
	useEffect(() => {
		const timer = setInterval(() => tick((n) => n + 1), 1000);
		return () => clearInterval(timer);
	}, []);
	if (meta.status === "error") {
		// F26（2026-08-20 走查）：优先显示后端落账的人话错误（meta.lastErrorHuman，页数超限/Token 失效
		// 已归一成人话），否则回退事件消息；下方给「拆开 / 换一本 / 删掉重来」引导，错误含 Token
		// 关键词时补 Token 重设提示（入口见 F20 的 MinerU Token 常驻卡）。
		// ⚠️ 票 07：引导句按**格式中立**写。受理闸门放开后原件可能是 docx/pptx/图片，
		// 写死「把 PDF 拆成几份」对它们就是假话。
		// ⚠️ 2026-10-08：取数（`humanErrorOf`）与那句标题／Token 提示搬到模块级共用件上了——
		// `UploadArea` 也印同一句（phase 1 出错时焦点主卡是它，见那张卡的契约注释）。
		const humanError = humanErrorOf(meta, lastEvent?.data?.message);
		const isTokenIssue = isTokenIssueOf(humanError);
		return createElement(
			"div",
			{ style: { ...S.focus, borderColor: "var(--dsw-alias-state-error-primary)" } },
			// 票 `ui-display-redesign/20`：卡头问句＋事实句在红标题**上面**（红标题保留：判据按它找）。
			createElement(CardHead, {
				question: createElement(
					"strong",
					{ style: CARD_HEAD_QUESTION_STYLE },
					ERROR_CARD_QUESTION,
				),
				facts: ERROR_CARD_FACTS,
			}),
			createElement(
				"strong",
				{ style: { color: "var(--dsw-alias-state-error-primary)" } },
				ERROR_HEADING,
			),
			createElement("p", { style: { margin: "6px 0" } }, humanError),
			createElement(
				"p",
				{ style: { margin: "6px 0 0", fontSize: "13px", opacity: 0.9 } },
				// 票 10（判定一 #9）：两条上限是**两件事**——500MB 是单份上传体积上限
				// （domain-rules.MAX_UPLOAD_BYTES，前后端共用同一常量），200 页是 MinerU 单次解析的页数上限。
				// 原来这句只说页数、不说体积，用户按 200 页拆完仍可能撞 500MB。这里一并说清。
				// 票 09：原件不再被叫成「教材 PDF」，材料按份数说；「换一本更薄的书」
				// 里的「本」是数**书**，保留（CONTEXT.md「量词『份』」）。
				"你可以：把这份材料拆成几份（每份 <200 页、<500MB）后分别上传，或换一本更薄的书，或删掉这本书重新开始。",
			),
			isTokenIssue
				? createElement(
						"p",
						{ style: { margin: "4px 0 0", fontSize: "13px", opacity: 0.9 } },
						TOKEN_HINT,
					)
				: null,
			createElement(
				"button",
				{ style: S.disabled(S.bigBtn(true), busy), onClick: onResume, disabled: busy },
				// 票 10（判定一 #8）：原来这里说「▶️ 让 AI 接着干」、活性行说「[戳一下 AI]」、
				// 状态卡说「🔁 让 AI 接着干」——同一动作三种说法，统一成这一句。
				"🔁 让 AI 接着干",
			),
			// F28 → 票 `ui-display-redesign/20`：上传错了给「删书重来」入口。原来是两步确认
			// （第一态纯展开、确认态才删）；本票改**一步**——点一下直接发 `book-delete`，旧书进
			// 回收站可找回（F28 的两步确认被本票取代，spec §2.16 第 9 块）。仅在父级传入删除
			// 回调时显示；忙时置灰（否则会和正在飞的那一笔抢同一本书）。
			typeof onDeleteConfirm === "function"
				? createElement(
						"div",
						{
							style: {
								marginTop: "8px",
								paddingTop: "8px",
								borderTop: "1px dashed var(--dsw-alias-border-l2)",
							},
						},
						createElement(
							"p",
							{ style: { margin: "0 0 6px", fontSize: "13px", opacity: 0.9 } },
							"上传错了？可以删掉这本书重新建一本（旧书进回收站），回到向导马上就能开始新书。",
						),
						createElement(
							"button",
							{
								style: S.disabled(
									{
										...S.smallLink,
										color: "var(--dsw-alias-state-error-primary)",
									},
									busy,
								),
								onClick: onDeleteConfirm,
								disabled: busy,
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
			{ style: { ...S.focus, borderColor: "var(--dsw-alias-state-error-primary)" } },
			// 票 `ui-display-redesign/20`：卡头问句＋事实句在红标题上面；红标题保留（判据按它找）。
			createElement(CardHead, {
				question: createElement(
					"strong",
					{ style: CARD_HEAD_QUESTION_STYLE },
					NEEDS_CONFIG_CARD_QUESTION,
				),
				facts: NEEDS_CONFIG_CARD_FACTS,
			}),
			createElement(
				"strong",
				{ style: { color: "var(--dsw-alias-state-error-primary)" } },
				"🔑 需要先配置",
			),
			createElement("p", { style: { margin: "6px 0" } }, needsConfig),
			createElement(
				"button",
				{ style: S.disabled(S.bigBtn(true), busy), onClick: onResume, disabled: busy },
				"我配好了，继续",
			),
		);
	}
	// 机器在等主 AI（交办任务）→ 优先显示任务名；否则回退到最近的机器活动。
	// 票 `ui-display-redesign/20`：任务名**不带**「我正在做 · 」前缀——那句话全屏只留状态条一处
	// （spec §2.18：「我正在做」四处收到一处）。
	let label = "";
	let extra = "";
	if (typeof pendingStageLabel === "string" && pendingStageLabel !== "") {
		label = pendingStageLabel;
		extra = typeof progressDetail === "string" ? progressDetail : "";
	} else if (
		lastEvent?.type === "textbook/agent-start" ||
		lastEvent?.type === "textbook/mineru-progress"
	) {
		const data = lastEvent.data ?? {};
		// 服务端 label 是机器词（源探查/铺章/设计提案·第 N 关…），过一遍界面词表；
		// 译不出来（未登记的原样返回）才原样显示——宁可露出机器词，也不猜错。
		const human = stageLabelHuman(data.label);
		if (human !== "") label = human;
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
		2: "读材料挑重点：AI 正在通读你的教材（材料多时会派小助手分头读），整理成材料索引",
		3: "拍板定方案：AI 正在起草设计方案（已经拍过板的会自动跳过）",
		4: "最佳范例章：AI 正在写第 1 章给你看效果",
		5: "写完整本：小助手执笔 + 小助手检查 + AI 复核，逐章推进",
		6: "最后检查：AI 亲自做最后检查 + 机器兜底",
	}[phase];

	// 写章进度（phase 5）：已完章数 / 总章数——**口径与过目闸门、章节卡同源**（票 14）。
	// 票 `audit-state-regression/01`：**主来源改成服务端 `chapterStatus[].done`**（章节卡读的同一份，
	// 它含「检查记录审的是不是当前这份正文」）。原来的 `doneSet ＋ pendingReviews` 只看账本里
	// 有没有交工事件，于是正文在交工之后被重写、重新审计之前，这里仍报「十章已完成」——同一屏
	// 章节卡已经退回「轮到你」而阶段五计数还在说假话。老服务端没下发 `done` 时才走本地兜底，
	// 兜底口径收在 `rules.chapterIsDone` 一处（⛔ 不在这里另写）。
	let chapterProgress = null;
	if (phase === 5) {
		const chapters = meta.outline?.chapters ?? [];
		const total = chapters.length;
		if (total > 0) {
			const doneSet = deriveDoneSet(events ?? [], goldChapterNo(meta));
			const reviews = meta.pendingReviews ?? [];
			const done = chapters.filter((_chapter, index) =>
				chapterIsDone(chapterStatus, doneSet, reviews, index + 1),
			).length;
			chapterProgress = { done: Math.min(done, total), total };
		}
	}
	// 计时（F47，2026-08-23 口径；票 stale-detection/01 收敛）：
	//  - 计时按「这一步自己的开始时间」算：最近一条步骤开始事件（stage-start / agent-start）
	//    的时间就是这一步起点，期间不断发 progress/进度事件不会把计时清零、也不会串到上一步。
	//  - 说「我正在做」还是只说时长，由**同一份判定**（`stalled`，归 `deriveStallJudgment`）决定；
	//    这里不再自己算一遍停顿时长、也不再出警告框——那两样已归活性行（这一屏唯一的出口）。
	//  - 格式与停顿时长共用 `humanDuration`（精度到分钟，不显示秒）。
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
	const stalled = (stall ?? {}).stalled === true;
	return createElement(
		"div",
		{ style: S.focus },
		// 票 `ui-display-redesign/20`：running 卡头**只放问句、不放事实句**（spec §2.18 第 3 块）。
		// 事实句在这里会与 progressDetail／计时行撞车：那两样全屏各只许出现 1 处。
		createElement(CardHead, {
			question: createElement(
				"strong",
				{ style: CARD_HEAD_QUESTION_STYLE },
				RUNNING_CARD_QUESTION,
			),
		}),
		createElement(
			"strong",
			{ style: { fontSize: "13px" } },
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
								background: "var(--dsw-alias-border-l2)",
								overflow: "hidden",
							},
						},
						createElement("div", {
							style: {
								height: "100%",
								width: `${Math.round((chapterProgress.done / chapterProgress.total) * 100)}%`,
								background: "var(--dsw-alias-state-business-primary)",
								borderRadius: "4px",
								// 判据 7「少动」：宽度过渡已删（票 05；原缺省 ease 先慢后快）。
							},
						}),
					),
				)
			: null,
		createElement(
			"p",
			{
				style: {
					margin: "6px 0 0",
					fontSize: "12px",
					opacity: stalled ? 0.7 : 0.85,
				},
			},
			// 票 stale-detection/01：这一行照常显示（计时只显示一行），判停时只报时长、不下诊断；
			// 「好一会儿没动静了」那句话与那颗「从断点继续」的按钮归顶上的活性行。
			// 票 `ui-display-redesign/20`：计时行**不带**「我正在做 · 」前缀——那句话全屏只留
			// 状态条一处；判停与不判停都只说时长（判停时活性行另说「N 分钟没动静了」）。
			`⏱ 这一步已进行 ${humanDuration(stepElapsedMs)}`,
		),
	);
}

// ── 交付卡 ──────────────────────────────────────────────────────────────────

// ── 票 `ui-display-redesign/10`：交付／终检两卡共用的那几句 ─────────────────────────────────

/** 交付页卡头问句（**屏级新写**，⛔ 不进 `decisionOf`：`delivered` 不是拍板点）。 */
export const DELIVERY_CARD_QUESTION = "书做好了，接下来怎么用？";
/** 交付页读数的兜底句（章单都没有时；⛔ 不印「0 章 0 汉字」）。 */
export const DELIVERY_READINGS_PENDING = "书的篇幅读数还没到。";
/** AI 报告「全文」折叠口那一行（站 11 与交付页共用；交付页默认打开那条不走它）。 */
export const AI_REPORT_FOLD_SUMMARY = "▸ 展开完整报告";

/**
 * AI 报告的**摘要**：取第一段的第一行（剥掉 markdown 标记）。
 *
 * 站 11（spec §2.10 第 4 块）与交付页（§2.11 第 9 块）共用这一份口径——「摘要〔首］＋全文〔折〕」
 * 里的「摘要」就是它。⛔ 卡里不另写第二份截断逻辑（截前 N 字那种会在半句话上断掉）。
 *
 * @param {string|null|undefined} report 报告正文（markdown 原文）
 * @returns {string|null} 摘要；报告为空 ⇒ null（那一块整块不渲染）
 */
export function aiReportSummary(report) {
	if (typeof report !== "string" || report.trim() === "") return null;
	for (const block of report.replace(/\r\n?/g, "\n").split(/\n[ \t]*\n/)) {
		const line = block.split("\n").map((one) => one.trim()).find((one) => one !== "");
		if (line === undefined) continue;
		const text = line
			.replace(/^#{1,6}\s+/, "")
			.replace(/^[>*+-]\s+/, "")
			.replace(/\*\*/g, "")
			.trim();
		if (text !== "") return text;
	}
	return null;
}

/**
 * 交付卡吃什么：一个下载地址函数 + 三份只读快照 + 两个动作回调。
 *
 * · `downloadHref` 必填 —— 卡内是 `downloadHref("工作区/book.md")` 裸调用。票 03 把地址拼装收进
 *   `ui/artifact-read.js` 之后，`project` / `session` 两个身份 prop 随之退休（原先**只**被用于
 *   那一条 href）。「没有当前书」的正确表达是**这个函数返回 `null`**（那一支不渲染下载键），
 *   不是这个函数不存在——后者今天会在渲染期抛。
 * · `onPreview` 必填 —— `onClick: onPreview` 裸接，漏了「👀 打开成书」点下去静默无反应。
 * · `meta` 必填 —— 它在这张卡里只被用在一处：书名 `(meta?.name ?? "").trim() || "BOOK"`。
 *   取不到就把用户要下的书**报错名字**（渲染成《BOOK》）——那是拿缺省盖住问题，所以这里
 *   **不**给 `defaults`，宁可装配期点名。
 * · `checks` / `aiReport` / `styleNotes` / `busy` **不**必填：前三者卡内自带兜底
 *   （`MachineChecks` 自己 `checks ?? []`，`aiReport` 显式判 `null`/`undefined`/`""`，
 *   `styleNotes` 走 `?? []`），`busy` 只当 `disabled`。
 *   ⚠️ 旧账本没有 `styleNotes` 这个字段是真事（壳调用点那行注释写着「内部 ?? [] 兜底」），所以
 *   它由壳按 `meta.styleNotes` 原样递下来，契约**不**给它任何缺省。
 */
export const deliveryCardView = defineCardView({
	card: "DeliveryCard",
	// 票 `ui-display-redesign/10`：09 的取数口要的两个**既有袋键**（⛔ 不新增袋键；
	// `knowledgeMapText`／`fetchText` 早就在 `CARD_BOOK_KEYS` 里，只是这张卡以前不取）。
	fromBook: ["downloadHref", "checks", "onPreview", "busy", "meta", "aiReport", "styleNotes", "knowledgeMapText", "fetchText"],
	required: ["downloadHref", "onPreview", "meta"],
});

export function DeliveryCard(props) {
	const {
		// 票 03：下载地址的拼装归 `ui/artifact-read.js`（`downloadHref`），本卡只给一个 `rel`。
		// `project` / `session` 两个身份 prop 随之退休——它们原先**只**被用于下面那一条 href。
		downloadHref,
		checks,
		onPreview,
		busy,
		meta,
		aiReport,
		styleNotes,
		// 票 `ui-display-redesign/10`：09 那个取数口要的两个**既有袋键**（合并件原文 ＋ 产物读取）。
		// ⛔ 不是新增袋键：`knowledgeMapText`／`fetchText` 早就在 `CARD_BOOK_KEYS` 里，只是这张卡以前不取。
		knowledgeMapText = null,
		fetchText = null,
	} = props;
	const bookName = (meta?.name ?? "").trim() || "BOOK";
	// 票 `ui-display-redesign/10`：全书读数只走 09 的**唯一取数口**（章数同步可算；字数要在挂载后
	// 真读 N 份章稿；知识点按清单计）。读不到就「未知」，⛔ 不写 0。
	const readings = useBookReadings({ meta, knowledgeMapText, fetchText });
	const facts = bookReadingsFactSentence(readings) ?? DELIVERY_READINGS_PENDING;
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
		// 票 `ui-display-redesign/10`：卡头行（屏级问句＋09 读数事实句）放在第一块，排 `🎉` 标题之前。
		createElement(CardHead, {
			question: createElement(
				"strong",
				{ style: CARD_HEAD_QUESTION_STYLE },
				DELIVERY_CARD_QUESTION,
			),
			facts,
		}),
		createElement("strong", { style: { fontSize: "13px" } }, "🎉 书做好了！"),
		// 票 `ui-display-redesign/10`（spec §2.11 第 4 块）：**成品入口在标题下**（原先埋在卡尾）。
		createElement(
			"div",
			{ style: { display: "flex", gap: "10px", margin: "10px 0" } },
			createElement(
				"button",
				// 票 03：预览改成在 DSH 右栏打开成品——卡片里不再灌整本 <pre>，故没有「收起」态。
				{
					style: S.disabled(S.ghostBtn(false), busy),
					onClick: onPreview,
					disabled: busy,
				},
				// 票 10（判定一 #13）：与终检认可卡统一——同一份 `工作区/book.md`，名字用产物词表的
				// 「成书」（票 05），动词只有「打开」。
				"👀 打开成书",
			),
			createElement(
				"a",
				{
					style: {
						...S.bigBtn(true),
						textDecoration: "none",
						display: "inline-block",
					},
					// 票 03：地址由 `ui/artifact-read.js` 拼（`/textbook/download`）。
					// ⚠️ 「导航 vs 读取」是**两件不同的事**：这里是 `<a href>`——浏览器导航，**没有** `res.ok`
					// 检查、**不产生**错误条，下载失败由浏览器自己那一屏负责。别顺手给它补一套 fetch 语义。
					// 「无当前书」时 `downloadHref` 返回 null ⇒ 不渲染那颗下载键（这一支在生产里走不到：
					// 本卡只在 `case "delivered"` 渲染，而那要求 `meta.status === "delivered"` ⇒ 有书）。
					href: downloadHref("工作区/book.md") ?? null,
				},
				`⬇️ 下载《${bookName}》.md`,
			),
		),
		// 票 `ui-display-redesign/10`（spec §2.11 第 5 块）：全书读数（章数／字数／知识点）；
		// ⛔ **没有件数、没有对账**（书只有一本；工作文件对账归站 11 的「文件对账」）。
		readings.chapters === null
			? null
			: createElement(
					"div",
					{
						style: {
							display: "flex",
							gap: "16px",
							flexWrap: "wrap",
							margin: "0 0 8px",
							fontSize: "13px",
						},
					},
					createElement("span", null, createElement("strong", null, String(readings.chapters)), " 章"),
					createElement("span", null, createElement("strong", null, hanziReadingText(readings.hanzi))),
					createElement(
						"span",
						null,
						createElement("strong", null, knowledgePointsReadingText(readings.knowledgePoints)),
					),
				),
		// 怎么用（spec §2.11 第 7 块；文案一个字不动）。
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
								color: "var(--dsw-alias-state-business-primary)",
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
					// 票 10（判定四①）：卡上那句已经说了「仍建议先让老师/家长复核一遍再用」，
					// 这一行再说一遍就是同屏两行同话——只留「直接阅读或打印」。
					"直接阅读或打印。",
				),
			),
		),
		// 复核提示（spec §2.11 第 8 块）。
		createElement(
			"p",
			{ style: { margin: "8px 0 0", fontSize: "12px", opacity: 0.75 } },
			"AI 亲手做完最后检查，机器也兜底验过；仍建议先让老师/家长复核一遍再用。",
		),
		// AI 报告：交付页**默认打开**（spec §2.11 第 9 块；不折——折的是站 11 那张卡）。
		aiReport !== null && aiReport !== undefined && aiReport !== ""
			? createElement(
					"div",
					{
						style: {
							margin: "10px 0",
							padding: "8px 10px",
							background: "var(--dsw-alias-state-business-tertiary)",
							borderRadius: "8px",
							fontSize: "12px",
						},
					},
					createElement("strong", null, "🤖 AI 检查说的："),
					// 报告正文那一块：它是**连续正文**，走**正文出口**（票 `ui-systematic-fixes/01`）
					// ——md 正文经 `exploreReportBlocks` 排成块（`# `/`**`/`- ` 不再原样上屏）。
					// ⚠️ 容器这一层仍套工作台唯一那条量宽上限（票 `walkthrough-fixes/17`）：
					// 出口吐出来的标题支继承的是这一层的字号，所以这里连 `fontSize` 一起给成正文档
					// （14px）——`36em` 要是「正文自己的 36em」，不是容器 12px 的。
					// **卡盒宽度一点不动**（票 16 的「工作台＝输入框」那条式子照旧）。
					createElement(
						"div",
						{
							style: {
								margin: "4px 0 0",
								fontSize: "13px",
								maxWidth: BODY_MEASURE_MAX_WIDTH,
							},
						},
						...bodyOf(aiReport, BODY_KIND_MARKDOWN),
					),
				)
			: null,
		// 机器检查：交付页**默认打开**（可收）——spec §2.11 第 9 块。
		createElement(MachineChecks, { checks, openByDefault: true }),
		// 风格线：默认打开（有条件才出现）。
		(styleNotes ?? []).length > 0
			? createElement(
					"div",
					{
						style: {
							margin: "10px 0",
							padding: "8px 10px",
							borderRadius: "8px",
							border: "1px solid var(--dsw-alias-border-l2)",
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
							`${note.status === "superseded" ? "· （已收回）" : note.status === "conflict" ? "· （与设计冲突，理由见备注）" : "· "}${note.text}`,
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
		// 邀请码（spec §2.11 第 10 块）：常显、**最底**、文案一个字不动。
		createElement(
			"p",
			{ style: { margin: "10px 0 0" } },
			"如果本项目对你有帮助，欢迎填写邀请码：",
			createElement(
				"span",
				{
					onClick: (e) => copyInvite(e, "SCR-FEJXMQ"),
					title: copied ? "已复制" : "点击复制邀请码",
					style: {
						background: "var(--dsw-alias-state-business-tertiary)",
						borderRadius: "4px",
						padding: "1px 6px",
						letterSpacing: "0.5px",
						cursor: "pointer",
						userSelect: "all",
						color: "var(--dsw-alias-state-business-primary)",
					},
				},
				copied ? "✓ 已复制" : "SCR-FEJXMQ",
			),
			"，可免费领取 100 万 tokens，官方造书全场免费学（第三方活动，以对方规则为准）。",
		),
	);
}
// ── 终检结果认可卡（2026-08-26 用户拍板：终检 = AI 对全书整体调整 + 用户对整体的最终认可） ──

/**
 * 终检认可卡吃什么：机器检查结果 + 两份产物视图（AI 报告、风格线清单）+ 三颗动作键的回调
 * ＋ 这本书的状态投影（只为读 `meta.demo`）。
 *
 * ⚠️ 取证口径（范围＝本文件 `export function FinalApprovalCard` 起至下一个顶层 `export function`
 * 为止）：`project` / `session` 这两个名字在函数体内**各 0 命中**（按子串匹配，比词匹配更严）
 * ——它们仍是壳在传、卡在从不读的死 prop，本契约**不声明**它们。票 03 收 `DeliveryCard` /
 * `ChaptersCard` / `ExploreConfirmCard` 的身份 prop 时漏掉了这一处。
 * ⚠️ **`meta` 从票 `demo-flow-fidelity/06` 起不再是死 prop**：卡要读 `meta.demo` 才决定说
 * 不说那句演示提示（`view-rules.demoQualityChecksNote()`），所以它进了 `fromBook`——这正是
 * 票面「与 `PhasePage` 那条路对齐」的做法（`phasePageView.fromBook` 早就有 `meta`）。
 * **不许**改成拿 `checks` 条数或有没有 AI 报告来反推演示与否（票面明令：那是把显示逻辑建在
 * 别人家的判据上）。`test-card-views-coverage.mjs` 按卡体内真实消费点核覆盖率，所以这一位
 * 进契约的同时，卡体里必须真的读它。
 * · `onApprove` / `onReject` / `onPreview` 必填 —— 三颗都是裸调用（`onApprove()`、
 *   `onReject(note)`、`onClick: onPreview`）。⚠️ `onReject` 最阴：它藏在「先写一句意见、
 *   再点不满意」那段守卫后面，用户写完意见点下去**什么都不会发生**。
 * · `checks` / `aiReport` / `styleNotes` / `busy` / `meta` **不**必填：前者与交付卡同判
 *   （三者卡内自带兜底，`busy` 只当 `disabled`），`meta` 走 `isDemoBook(meta)` 的 `?.` 兜底
 *   （老账本可以不带这一位 ⇒ 那就是一本真书，不显示演示提示）。
 * · `shapeReport`（票 `demo-channel-full/05`；票 `ui-display-redesign/10` 改了默认态）**不**必填，
 *   缺省 `null`：它是 `/textbook/process` 那一路上的**文件对账**读数（「该有 N 件工作文件」↔
 *   「盘上 M 件」）。三档各不同、⛔ 别折成一档：`null`＝这本书没有清单（老书，**不谈也不摆**）／
 *   有清单（**无一例外都印一行**：没缺件印「没缺」，有缺件逐条点名）。⚠️ 那一块**只列缺件、
 *   不拦交付**——「什么时候缺件该拦住」归产物清单那两族自己的票（出处见
 *   `src/workflow/book-shape.js` 文件头「边界」那一节）。
 *   ⚠️ **差集里「多出」那一半有意不上屏**（理由与读数在卡内那一块的注释里，别当成漏了）。
 */
export const finalApprovalCardView = defineCardView({
	card: "FinalApprovalCard",
	fromBook: ["checks", "onPreview", "busy", "aiReport", "styleNotes", "onApprove", "onReject", "meta", "shapeReport"],
	required: ["onPreview", "onApprove", "onReject"],
});

/**
 * 站 11 的卡头事实句（**派生**，spec §2.10 第 2 块逐字例：`8 项机器检查全过 · 没有缺件 · AI 报告 1 份。`）。
 *
 * 三段各取各的：机器检查（条数＋全过与否，**跳过/提示不算全过**）、文件对账（无清单 vs 没缺件 vs
 * 缺 K 件）、AI 报告（有没有）。⛔ 不印「8 件产物」那类件数（件数只属文件对账那一行的工作文件）。
 *
 * @param {{checks?: object[], shapeReport?: object|null, aiReport?: string|null}} input
 * @returns {string}
 */
export function finalApprovalFacts({ checks, shapeReport, aiReport } = {}) {
	const list = Array.isArray(checks) ? checks : [];
	const failed = list.filter(checkBlocksDelivery).length;
	const warned = list.filter((check) => check.ok === true && check.warn === true).length;
	const skipped = list.filter((check) => check.state === "skipped").length;
	const notChecked = list.filter((check) => checkStateIsNonBlocking(check.state) && check.state !== "skipped").length;
	const machine =
		list.length === 0
			? "机器检查结果还没到"
			: failed === 0 && warned === 0 && skipped === 0 && notChecked === 0
				? `${list.length} 项机器检查全过`
				: `机器检查 ${list.length} 项里有需要你看的`;
	// 票 `ui-display-redesign/17`（收口 review S5）：`missing` 不是数组 ＝「这一格读不到」，
	// ⛔ 不是「缺件为 0」——修前 `null > 0` 为假 ⇒ 把没数据说成「没有缺件」。
	const missingKnown = Array.isArray(shapeReport?.missing);
	const missing = missingKnown ? shapeReport.missing.length : null;
	const files =
		shapeReport === null || shapeReport === undefined
			? "没有文件对账清单"
			: missingKnown === false
				? "文件对账读数不可用"
				: missing > 0
					? `还缺 ${missing} 件工作文件`
					: "没有缺件";
	const report =
		typeof aiReport === "string" && aiReport !== "" ? "AI 报告 1 份" : "还没有 AI 报告";
	return `${machine}，${files}，${report}。`;
}

export function FinalApprovalCard(props) {
	const {
		checks,
		onPreview,
		busy,
		aiReport,
		styleNotes,
		onApprove,
		onReject,
		meta,
		// 票 `demo-channel-full/05`：**文件对账**（`/textbook/process` 的 `shape`，随书级只读数据下发）。
		// 票 `ui-display-redesign/10`：有清单就**常显一行**（没缺件印「没缺」）；没有清单（null）才不摆。
		shapeReport = null,
	} = props;
	// ⚠️ `shapeReport.extra`（清单没声明、盘上却有的那几件）**有意不渲染**——理由写在下面那一块的注释里
	//（表缺口，不是用户的盘脏了）。⇒ 这里只取缺件那一半。
	// 票 17（收口 review S5）：`missing` 不是数组＝读不到（⛔ 不当成「缺 0 件」，下面按这一档印）。
	const shapeMissingKnown = Array.isArray(shapeReport?.missing);
	const shapeMissing = shapeMissingKnown ? shapeReport.missing : [];
	// 票 `ui-display-redesign/10`：卡头事实句（三段各自现算；⛔ 不印件数、不写死）。
	const cardFacts = finalApprovalFacts({ checks, shapeReport, aiReport });
	const aiSummary = aiReportSummary(aiReport);
	// 票 `walkthrough-fixes/37`：驳回意见的**逐条去向**（没有条目集时是 null，这一块不摆）。
	const redoRows = finalRedoRows(meta);
	const [note, setNote] = useState("");
	// 批 3：把「不满意」从「看着能点却点不动」改成「点了告诉你为什么还不能走」。
	const noteRef = useRef(null);
	const [needNote, setNeedNote] = useState(false);
	return createElement(
		"div",
		{ style: S.focus },
		// 票 `ui-display-redesign/10`：卡头行（存量问句 `DECISION_QUESTION.final` ＋派生事实句）
		// 是这一屏第一块，排在 `🛡️` 标题之前。问句节点就地造（理由同 `UPLOAD_CARD_QUESTION` 那段）。
		createElement(CardHead, {
			question: createElement(
				"strong",
				{ style: CARD_HEAD_QUESTION_STYLE },
				DECISION_QUESTION.final,
			),
			facts: cardFacts,
		}),
		createElement("strong", { style: { fontSize: "13px" } }, "🛡️ 最后检查完成，等你对整本书把关"),
		aiReport !== null && aiReport !== undefined && aiReport !== ""
			? createElement(
					"div",
					{
						style: {
							margin: "10px 0",
							padding: "8px 10px",
							background: "var(--dsw-alias-state-business-tertiary)",
							borderRadius: "8px",
							fontSize: "12px",
						},
					},
					createElement("strong", null, "🤖 AI 检查说的："),
					// 票 `ui-display-redesign/10`（spec §2.10 第 4 块）：**摘要〔首〕＋全文〔折〕**。
					// 摘要＝报告第一段（`aiReportSummary` 的唯一口径）；全文收进默认折的 `<details>`，
					// 展开仍是原来那份**正文出口**排版（`bodyOf`，⛔ 卡里不另写第二份渲染）。
					aiSummary === null
						? null
						: createElement(
								"p",
								{ style: { margin: "4px 0 0", fontSize: "13px", lineHeight: 1.6 } },
								aiSummary,
							),
					createElement(
						"details",
						{ style: { margin: "6px 0 0" } },
						createElement(
							"summary",
							{ style: { cursor: "pointer", fontSize: "12px", opacity: 0.75 } },
							AI_REPORT_FOLD_SUMMARY,
						),
						createElement(
							"div",
							{
								style: {
									margin: "4px 0 0",
									fontSize: "13px",
									maxWidth: BODY_MEASURE_MAX_WIDTH,
								},
							},
							...bodyOf(aiReport, BODY_KIND_MARKDOWN),
						),
					),
				)
			: null,
		// 票 `demo-flow-fidelity/06`（票 01 Q5＝乙：卡上明写差在哪一块）：
		// ⚠️ **票 `demo-channel-full/08` 起演示书在这张卡上只比真书少一块**——机器检查跑不满真书后半那些项
		// （⚠️ 票 `demo-channel-full/04` 起「进度账本」那一项**也真跑了**，所以那句提示里的项名是
		// **从这一屏真跑了的清单现算**的：⛔ 这里不抄一份数、也不再说「前 N 项」）；
		// 「没有 AI 检查报告」与「没有那五份分查／汇总件指针」那两块**已经补上了**（同一支终检支产），
		// 所以那句提示里原来结尾的「并附一份 AI 检查报告」也一并删了（留着就是**说假话**）。
		// 句子的出处只此一处（`view-rules.demoQualityChecksNote()`，阶段页那块调
		// 同一个函数），演示与否只看 `meta.demo`（`isDemoBook`），**不拿检查条数反推**
		// ——递进去的 `checks` 只用来叙述「这一屏真的列了几项」（票 06 收口，2026-10-08）。
		// ⚠️ 它必须留在下面三键那一排**之前**：票 24 的滚动判据以「卡的最后一行是那颗定案键」
		// 为承重前提（`test-layout-anchors.mjs` 源码级钉着这个顺序）。
		isDemoBook(meta)
			? createElement(
					"p",
					{ style: { margin: "8px 0 0", fontSize: "12px", opacity: 0.75 } },
					demoQualityChecksNote(checks),
				)
			: null,
		// 票 26：机器检查清单（失败项显示 ❌，票 20 成果）。原票 20 的修复按钮已收——
		// 没过时不走这卡，指令由机器自动随 issues 送回主 AI；自由文本驳回（onReject）照旧。
		createElement(MachineChecks, { checks }),
		// 票 `demo-channel-full/05`：**文件对账**那一块——「该有 N 件工作文件」（`工作区/产物清单.json`）
		// 与「盘上 M 件」（扫盘登记）的对照。
		// ⚠️ **只列缺件，⛔ 不列「多出」那一半**：演练实测 `工作区/方案/`（三次设计关卡的提案）
		// **压根没进**生产那份产物族表 ⇒ 每本写过提案的书（演示书与真书一样）都会报出三五条
		// 「清单里没有声明」——那是**表**的缺口，不是用户的盘被弄脏了。把表缺口摆到用户脸上，
		// 等于拿一条假警报换掉这条真信号（读数与后续见票 `demo-channel-full/05` 的 `## Answer`）。
		// ⚠️ 这一块**只如实列差集**，不做判决、也不拦交付：「什么时候缺件该拦住」归产物清单
		// 那两族自己的票（出处见 `src/workflow/book-shape.js` 文件头「边界」那一节）——所以下面
		// 那句「不拦交付」是**事实陈述**，⛔ 别在这里加任何「点它去补」的承诺。
		// 票 `ui-display-redesign/10`（spec §2.10 第 7 块）：**有清单就常显一行**——没缺件印「没缺」，
		// 有缺件逐条点名；只有没有清单（老书 null）才整块不摆。
		// 票 17（收口 review S5）：清单在、但「缺件」那一格读不到（不是数组）⇒ 印「缺件读数不可用」，
		// ⛔ 不说「没缺」（「没数据」不是「没有缺件」）。
		shapeReport === null || shapeReport === undefined
			? null
			: createElement(
					"div",
					{
						style: {
							margin: "10px 0",
							padding: "8px 10px",
							borderRadius: "8px",
							border: "1px solid var(--dsw-alias-border-l2)",
						},
					},
					createElement(
						"p",
						{ style: { margin: "0 0 4px", fontWeight: 600 } },
						`📦 文件对账：该有 ${shapeReport.manifestRows ?? 0} 件工作文件，盘上 ${shapeReport.registryRows ?? 0} 件`
							+ (shapeMissingKnown === false
								? "，缺件读数不可用"
								: shapeMissing.length > 0 ? `，还缺 ${shapeMissing.length} 件` : "，没缺"),
					),
					...shapeMissing.map((row, index) =>
						createElement(
							"div",
							{ key: `miss-${index}`, style: { fontSize: "12px", margin: "3px 0", opacity: 0.85 } },
							// ⚠️ **只报族名，不报机器路径**——`CONTEXT.md`「产物名」那条判据：产物相对路径的
							// 原文不上屏（`test-wording-invariants.mjs` 那条「含中文的字面量不许把机器路径
							// 拼进可见文本」会当场逮住）。族名本身就是人写的词（生产族表的 `family`），
							// 够答「缺哪一件」这个问题。
							`· 还缺：${row?.family ?? "（认不出是哪一族）"}`,
						),
					),
					createElement(
						"p",
						{ style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.75 } },
						"这一栏只是把缺件如实列出来，不拦交付。",
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
							border: "1px solid var(--dsw-alias-border-l2)",
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
							`${note.status === "superseded" ? "· （已收回）" : note.status === "conflict" ? "· （与设计冲突，理由见备注）" : "· "}${note.text}`,
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
		// 票 `walkthrough-fixes/37`：用户上一轮写的那句意见，**逐条列出去向**——认可之前一眼看得见哪条没办。
		// ⚠️ 这一块是 AI 的自述，不是机器结论（尾注 `FINAL_REDO_FOOT` 就写着这条边界，⛔ 别改成「已验过」）。
		redoRows !== null
			? createElement(
					"div",
					{
						style: {
							margin: "10px 0",
							padding: "8px 10px",
							borderRadius: "8px",
							border: "1px solid var(--dsw-alias-border-l2)",
						},
					},
					createElement(
						"p",
						{ style: { margin: "0 0 6px", fontWeight: 600 } },
						FINAL_REDO_HEADING,
					),
					...redoRows.map((row) =>
						createElement(
							"div",
							{ key: `redo-${row.index}`, style: { fontSize: "12px", margin: "3px 0" } },
							`${row.mark} 第 ${row.index ?? "?"} 条「${row.quote}」：${row.statusText}`,
							row.where !== ""
								? createElement("span", { style: { opacity: 0.6 } }, `，${row.where}`)
								: null,
							row.note !== ""
								? createElement("span", { style: { opacity: 0.6 } }, `，${row.note}`)
								: null,
						),
					),
					createElement(
						"p",
						{ style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.75 } },
						FINAL_REDO_FOOT,
					),
				)
			: null,
		createElement(
			"p",
			{ style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
			// 票 10（判定四③）：原句 79 字压到 90 字内——「AI 已整体调整过、机器也兜底验过」与
			// 上面那句（交付卡同款）重复，删掉；保留"这是最后一次把关"与两条出路。
			// 票 `demo-channel-full/26`：末句「AI 会照着改整本」对演示书是假话（报告六件逐字未变，
			// 那句意见只落 `meta.finalRedoNote`）⇒ 两取值，出口在 `view-rules.finalApprovalNote`。
			finalApprovalNote(meta),
		),
		createElement(
			"textarea",
			{
				ref: noteRef,
				style: {
					width: "100%",
					minHeight: "64px",
					padding: "8px",
					borderRadius: "8px",
					border: needNote
						? "1px solid var(--dsw-alias-state-error-primary)"
						: "1px solid var(--dsw-alias-border-l2)",
					fontSize: "13px",
					boxSizing: "border-box",
				},
				placeholder: "不满意的话，在这里写一句要改什么（写了才能点「不满意」）…",
				value: note,
				onChange: (e) => {
					setNote(e.target.value);
					if (e.target.value.trim() !== "") setNeedNote(false);
				},
			},
		),
		needNote
			? createElement(
					"p",
					{
						style: {
							margin: "6px 0 0",
							fontSize: "12px",
							color: "var(--dsw-alias-state-error-primary)",
						},
					},
					// 票 `demo-channel-full/26`：这句说的是「这句话会被拿去改整本」——演示书上
					// 那句话的用途只是过 400 那道闸 ⇒ 两取值（出口 `view-rules.finalApprovalNeedNote`）。
					finalApprovalNeedNote(meta),
				)
			: null,
		createElement(
			"div",
			{ style: { display: "flex", gap: "10px", margin: "10px 0" } },
			createElement(
				"button",
				// 票 03：成品在 DSH 右栏预览（卡片里不再灌整本 <pre>，故无「收起」态）。
				{
					style: S.disabled(S.ghostBtn(false), busy),
					onClick: onPreview,
					disabled: busy,
				},
				// 票 10（判定一 #13）：与交付卡同一份成品、同一个名字（「成书」）。
				"👀 打开成书",
			),
			createElement(
				"button",
				{
					// 2026-09-20 批 3：三键同权 → 主操作（认可）填色、其余描边。
					// 「不满意」原来在没写意见时直接 disabled，看着能点却点不动；现在让它永远可点，
					// 点了把光标送进输入框并说明原因（后端契约：approved=false 必须带 note）。
					style: S.disabled({ ...S.ghostBtn(true), marginRight: "auto" }, busy),
					onClick: () => {
						if (note.trim() === "") {
							setNeedNote(true);
							// 无 DOM 的测试渲染器里 ref.current 没有 focus 方法，防御一下。
							if (typeof noteRef.current?.focus === "function")
								noteRef.current.focus();
							return;
						}
						onReject(note);
					},
					disabled: busy,
					title: "要先写一句改进意见（AI 照着改整本）",
				},
				FINAL_REJECT_LABEL,
			),
			createElement(
				"button",
				{
					style: S.disabled(S.bigBtn(true), busy),
					onClick: () => onApprove(),
					disabled: busy,
					// 票 `auto-walkthrough/04`：关键键的语义钩子（D17）。
					"data-final-approve": "1",
				},
				FINAL_APPROVE_LABEL,
			),
		),
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

/**
 * 关卡卡那颗主操作「✅ 通过，继续」的**后果说明**（票 `ui-systematic-fixes/09`；唯一出口）。
 *
 * ── 病（`.scratch/ui-page-audit/inv-decisions.md` §1 第 3 行、§B.9 第 9 条）──────────────
 * 同一排键里「❌ 驳回」两个 mode 各带一句后果（`REASONS` 那两块）、「⏭ 先跳过这一关」一整段、
 * 「⏪ 回退」一个确认层，而**用户唯一会点的那颗主键一个字解释都没有**——
 * 「用户唯一会点的键，是唯一没被解释的键」。
 *
 * ── 为什么它住在**本模块**（而不是 `view-rules.js` 那张表）────────────────────────────
 * 票 10／11 要从这里 import 去填 `decisionOf(...).options[].effect`（spec 实现决策 §5）。
 * 本卡与站 3 那张卡各管自己那两句，⛔ 不在 `view-rules.js` 另立第二份——
 * 「同一句话只许有一个出口」（`CONTEXT.md`「界面用词表」）。
 *
 * ── 措辞的四条纪律（票面逐字）──────────────────────────────────────────────────────
 * ① 只说后果（点了会怎样、下一步去哪），⛔ 不新造状态词（三词上限：轮到你／我正在做／已完成）；
 * ② ⛔ 不改键文案本身（那句「✅ 通过，继续」一个字不动）；③ ⛔ 不新增可点区域（这是纯文字）；
 * ④ 落在**卡内既有说明区**（键那一排的上沿），⛔ 不新开面板。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：本出口只管**这一张卡的这一颗键**。同一颗键在别处的出现
 * （若有）不在本票射程；「点了之后 AI 真去干了那件事」本句**不声称**——那是真机层（ADR-0005）。
 * 这句也不留「正文块展开与否」「演示书与否」的分叉：通过之后到哪一步，演示书与真书逐字同一条路。
 */
export const GATE_PASS_EFFECT =
	"点了它这份方案就此定下：AI 接着往下干，不用你再点一次；之后想改，回退到最近一次存档。";

/**
 * 上面那句的**取值出口**（票 10／11 从这儿取，⛔ 不手抄第二份原文）。
 * 今天它没有分支——留成函数是为了「同一格将来出现第二个取值」时**只有一个地方**可以分叉
 * （先例：`view-rules.gateDecidedNote(meta)` 那两个取值）。
 */
export function gatePassEffect() {
	return GATE_PASS_EFFECT;
}

// ── 关卡卡那排键的**文案出口**（票 `ui-systematic-fixes/11` · spec 实现决策 §5）─────────────
//
// 为什么提成 export：拍板契约 `view-rules.decisionOf(...)` 的 `options[].label` 与 `keysAt`
// **必须**就是卡上那颗键的字（票面逐字「`label` 不新造：引用各卡里已有的键文案」），
// 而「同一句话只许有一个出口」（`CONTEXT.md`「界面用词表」）⇒ 字住这里、卡与契约都从这一个
// 绑定取。⛔ 别在 `view-rules.js` 再抄一份原文：那一份漂了，契约说键 A、卡上写键 B，
// 而四件齐判据正好拿这两个值对账（`test/test-component-cards.mjs` 的 `keysAt` 那条）。
export const GATE_PASS_LABEL = "✅ 通过，继续";
export const GATE_REJECT_LABEL = "❌ 驳回，提意见";
export const GATE_SKIP_LABEL = "⏭ 先跳过这一关（未验）";
export const GATE_ROLLBACK_LABEL = "⏪ 回退到最近一次存档";

/** 驳回表单里两个 mode 的**选项文案**（同一颗键的两条路，逐字照旧）——契约要拿它们拼后果句。 */
export const GATE_REJECT_MODE_WRONG_LABEL = "方案不对 —— AI 重做一版";
export const GATE_REJECT_MODE_CONFUSED_LABEL = "我看不懂 / 不是我要的 —— AI 换人话重讲、给例子";

/**
 * 驳回那一路的后果句（票 11 的 `options[].effect`）：**由上面两条既有 mode 文案逐字拼成**，
 * ⛔ 不新写一个字——票面只允许本票补六句（站 2／7／8／9／10／11 各一句），驳回不在这六句里。
 */
export const GATE_REJECT_EFFECT =
	`${GATE_REJECT_MODE_WRONG_LABEL}；${GATE_REJECT_MODE_CONFUSED_LABEL}。`;

/** 跳过那一路的后果句：**这就是卡片上那段说明**（逐字搬进常量，卡渲染它、契约也取它）。 */
export const GATE_SKIP_EFFECT =
	"不想在这儿等？可以先跳过这一关：流程照常往下走，但这一关的验货结论会记成「未知」——"
	+ "交付与最后检查的清单里逐条列着它，不会被算进「已通过」，你之后想补验随时回来补拍一次。";

/** 回退那一路的后果句：**这就是确认层那段说明**（逐字搬进常量，卡渲染它、契约也取它）。 */
export const GATE_ROLLBACK_EFFECT =
	"这一步之后新推进的部分会被重做；回退前会先存一版，之后还能再回退。";

// ── 票 `ui-display-redesign/05`：三次拍板卡的卡头行与两个折口 ──────────────────────────────
//
// 站 4／5／6 共用同一张卡（`GatePanel`，`gate` 是 '1'／'2'／'3'）。卡头问句取
// `DECISION_QUESTION.gate`（**存量句，三关共用，逐字不改**；它也是 `decisionOf(meta, gate).question`
// 那一格——底部的「通过」/「驳回」两键与它同源）。卡头事实句是新写：**去版本号**，后果并进这一句
// （spec §2.5 第 10 块：通过后果句不上屏，契约里的 `effect` 文本保留）。
/** 站 4/5/6 卡头事实句（新写；不带 `方案 v2` 这类版本号）。 */
export const GATE_CARD_FACTS = "通过后不用再点；想改只能回退到最近一次存档。";
/** 并发旋钮折口一行（**只在第 1 关**出现；低频、一次性设定）。 */
export const GATE_CONCURRENCY_FOLD_SUMMARY = "🎚 并发（现在改还来得及）";
/** 「其他选择」折口一行（**每关都折**；跳过与回退两项每关都有效、但都低频）。 */
export const GATE_OTHER_FOLD_SUMMARY = "其他选择（跳过这一关 / 回退到最近一次存档）";

/** 终检认可卡那排键的**文案出口**（票 11：`decisionOf("final")` 的 `label`／`keysAt` 取这两个）。 */
export const FINAL_APPROVE_LABEL = "✅ 认可，交付";
export const FINAL_REJECT_LABEL = "❌ 不满意，让 AI 改";

/**
 * 「✅ 认可，交付」那颗主键的**后果说明**（票 `ui-systematic-fixes/11` 补的六句之一 · 站 11）。
 *
 * ⚠️ 与票 09 那两句同一族纪律：只说后果（点了会怎样），⛔ 不新造状态词、⛔ 不改键文案、
 * ⛔ 不新增可点区域。今天它**只进契约**（`decisionOf("final").options[].effect`），
 * 卡上不渲染——spec §5 的 `options` 是下一层渲染的输入，本票只把契约铺满。
 */
export const FINAL_APPROVE_EFFECT =
	"点了它就是认可交付；之后这本书不再改动，想改只能走定点修改。";

/**
 * 关卡卡吃什么：待拍板那一份关卡快照 + 三个动作回调，外加两个壳级装饰输入。
 *
 * · `gate` 是**唯一**的数据来源：卡内三条分支（`gate === null` 直接不渲 / `status !== "awaiting"`
 *   出结果条 / 其余出拍板屏）都直接读它，没有第二份推导，也没有任何守卫。`null` 是有意义的值
 *   （「这一屏没有待拍板的关卡」），`required` 只拦 `undefined`，两者不打架。
 * · `onDecide` / `onRollback` 必填 —— 两处都是裸调用（`onClick: () => onDecide({ approved: true })`、
 *   `onClick: () => { …; onRollback(); }`）。漏了它们，用户点「✅ 通过，继续」「⏪ 回退到最近一次
 *   存档」「确认回退」**什么都不会发生**：按钮在、界面不报错、也没人看得见——正是票 01 查出的
 *   那种静默降级（`.scratch/dsh-contract-drift/` 那两次「界面零变化、通路悄悄死掉」的形状）。
 *   收编后它在**装配期**抛，原文点名是哪张卡、缺哪个字段。
 * · `busy` / `onAddPattern` **不**必填：前者只当 `disabled: busy`（`undefined` 与 `false` 同义）；
 *   后者卡内自己判 `typeof onAddPattern === "function"` 才有那步「记成这本书的自定义模式」——
 *   那是 2026-08-21 需求里的**有意可选**，不是防「壳忘了传」的守卫，契约不该把它收紧。
 * · `error` 是壳调用点上写死的 `null`（壳今天没有关卡级错误状态），故走 `defaults`：缺省成
 *   `null` 是**安全**的而非掩盖——卡内是 `error !== null ? … : null`，`null` 就是「不渲染错误条」
 *   这个真值。哪天壳真有了关卡错误，这一位会是真值，缺省（只在 `undefined` 时生效）**不再登场**。
 */
export const gatePanelView = defineCardView({
	card: "GatePanel",
	// 票 `walkthrough-fixes/19`②③：那个旋钮的现状（`maxConcurrentSubagents`）
	// 与两个回调（`onSetKnobs` 改旋钮、`onSkipStep` 跳过这一关）都从壳上取。
	// ⚠️ 票 `confirm-points-redesign-build/03` 起**没有** `lengthPreset` 这一位（篇幅档位删除）。
	fromBook: ["gate", "onDecide", "onRollback", "busy", "onAddPattern", "maxConcurrentSubagents", "onSetKnobs", "onSkipStep", "meta"],
	required: ["gate", "onDecide", "onRollback"],
	defaults: { error: null },
});

export function GatePanel(props) {
	const {
		gate, onDecide, onRollback, busy, error, onAddPattern,
		maxConcurrentSubagents, onSetKnobs, onSkipStep, meta,
	} = props;
	// 票 `demo-channel-full/20`：已通过那一条下面的存档提示句**只此一处**取值差异——
	// 真书说「等 AI 停手就能改」，演示书说清没有 AI 可等、也没有可回退重做的真实段。
	// 两个取值与取舍理由都住在 `view-rules.gateDecidedNote`（⛔ 本文件不自己拼措辞）。
	const decidedNote = gateDecidedNote(meta);
	// 2026-08-21 需求：完整方案默认展开展示（用户拍板前先看全），仍可点「收起完整方案」折叠。
	const [showDetail, setShowDetail] = useState(true);
	const [showCompare, setShowCompare] = useState(false);
	const [rejecting, setRejecting] = useState(false);
	const [mode, setMode] = useState("wrong");
	const [reasons, setReasons] = useState([]);
	const [note, setNote] = useState("");
	// 2026-08-21：勾选「换个风格」时出现的粘贴窗口（目标文本 → 本书自定义模式）。
	const [styleText, setStyleText] = useState("");
	// 票 `confirm-points-redesign-build/06`：站 4（第 1 关）那一问的**预选＝前者「自己也要读」**
	// （`human`）——spec 站 4 逐字「预选前者」。它是这一屏**唯一**的路线入口：路线在站 4 拍板那
	// 一刻随裁决写进书里（`gate-decide` 的 `route` 那一格），⛔ 之后没有任何「改路线」的入口。
	const [route, setRoute] = useState("human");
	// `gate.gate` 是字符串（`'1'`／`'2'`／`'3'`）；`String()` 一层防历史数据里出现过数字。
	const isStation4 = String(gate?.gate ?? "") === "1";
	// 回退是重操作（会把状态拉回上一个拍板点、重做后续推进）：先确认再执行（A3 快赢）。
	const [confirmRollback, setConfirmRollback] = useState(false);
	// 票 `ui-display-redesign/05`：**「其他选择」折口的展开态**。默认折（spec §2.5 第 9 块）。
	// ⚠️ 为什么折叠时**不渲染**里面的两颗键（而不是让原生 `<details>` 自己藏）：走查器把
	// 「盒子存在但看不见」的 `<button>` 仍算进可点面并判「越界／滚不进带」（`dev/walkthrough/
	// README.md` 的「隐藏键」那一档）⇒ 默认折的键会被读成红。折叠态不渲染＝它此刻**不在这张屏的
	// 可点面上**，语义也更准（折着就没有这两颗键可点）。原生 `details` 仍负责开合，`onToggle` 只是
	// 把它的开合同步进 React（展开那一刻才把内容挂上）。
	const [otherOpen, setOtherOpen] = useState(false);
	const rollbackConfirm = () =>
		createElement(
			"div",
			{
				style: {
					marginTop: "10px",
					borderTop: "1px dashed var(--dsw-alias-border-l2)",
					paddingTop: "8px",
				},
			},
			createElement(
				"p",
				{ style: { margin: "0 0 6px", fontWeight: 600 } },
				"⏪ 回退到最近一次存档？",
			),
			createElement(
				"p",
				{
					style: {
						margin: "0 0 6px",
						fontSize: "12px",
						color: "var(--dsw-alias-state-error-primary)",
					},
				},
				// 票 11：这段说明的**唯一出处**是 `GATE_ROLLBACK_EFFECT`（契约的 `options[].effect`
				// 取的也是它）——⛔ 别在这儿再写一遍原文。
				GATE_ROLLBACK_EFFECT,
			),
			createElement(
				"div",
				{ style: { display: "flex", gap: "8px" } },
				createElement(
					"button",
					{
						style: S.disabled({ ...S.bigBtn(false), padding: "6px 14px" }, busy),
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
					? `✅ ${gateHuman(gate.gate)}已通过（v${gate.version}）`
					: `↩️ ${gateHuman(gate.gate)}已驳回（v${gate.version}），等 AI 修订`,
			),
			decided
				? createElement(
						"p",
						{ style: { margin: "6px 0 0", opacity: 0.8 } },
						decidedNote,
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
						// 同上：回退做轻（灰色小链接），别和主操作抢眼。
						// 🎯 票 `gold-display-period/05`：这颗**有意不禁用**（#2 的逐处复核）——它只
						// `setConfirmRollback(true)`（开自己那张确认层，不发动作，`smoke-test.mjs` 自己就断着
						// 「点它第一下不该发动作」）⇒ `busy` 里挡住它只会造出「看着能点却点不动」的键。
						style: { ...S.smallLink, color: "inherit", opacity: 0.7 },
						onClick: () => setConfirmRollback(true),
					},
					GATE_ROLLBACK_LABEL,
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
		// 票 `ui-display-redesign/05`：卡头行（存量问句＋新写事实句）是这一屏第一块，
		// 排在 `🚦 …` 抬头之前。问句节点就地造（理由同 `WIZARD_CARD_QUESTION` 那段：人设逐字
		// 取证面只读 `src/ui/**` 里 `<strong>` 上的字面量／同文件 const；这里取的是 view-rules 的
		// 存量常量，三关共用同一句）。
		createElement(CardHead, {
			question: createElement(
				"strong",
				{ style: CARD_HEAD_QUESTION_STYLE },
				DECISION_QUESTION.gate,
			),
			facts: GATE_CARD_FACTS,
		}),
		createElement(
			"div",
			null,
			createElement(
				"strong",
				{ style: { fontSize: "13px" } },
				`🚦 ${gateHuman(gate.gate)}，方案 v${gate.version}`,
			),
			createElement(
				"span",
				{ style: { float: "right", opacity: 0.6, fontSize: "12px" } },
				"这一步你定了，流程才继续",
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
					"div",
					{
						// 票 `ui-systematic-fixes/01`：这份「完整方案」是**正文**，走正文出口
						// （原来是一个 `pre-wrap` 的 `<pre>`：`# 标题`、`**加粗**` 逐字印在屏上）。
						// 容器保留原来的底色／内边距／内滚封顶，排版交给 `exploreReportBlocks`
						// （它自己带那条唯一的量宽上限与正文档字号）；`bodyOf` 恒返回节点数组。
						style: {
							background: "var(--dsw-alias-bg-layer-1)",
							borderRadius: "8px",
							padding: "10px",
							opacity: 0.9,
							maxHeight: "260px",
							overflow: "auto",
						},
					},
					...bodyOf(gate.detail, BODY_KIND_MARKDOWN),
				)
			: null,
		showCompare && gate.prevProposal !== null
			? createElement(
					"div",
					{
						style: {
							background: "var(--dsw-alias-bg-layer-1)",
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
		// ── 票 `confirm-points-redesign-build/06`：**站 4（第 1 关）在这里问「这本书主要怎么学」** ──
		// 位置：紧挨着拍板那两颗键——它是这一步**最先要定**的那一件（spec 站 4 的①），拍板那一刻
		// 随裁决一起写进书里（`gate-decide` 的 `route`）。⛔ 措辞逐字：题面「这本书主要怎么学？」、
		// 选项「自己也要读」/「只让 AI 老师带着学」（票 `ui-display-redesign/05`：只把这一个词
		// 从「就让」改成「只让」），**预选前者**；选项上⛔ 不挂「推荐」字样、⛔ 不挂说明性括注
		// （维护者原话：「不要那个括号里的字，太冗长了」）。
		// ⛔ 只有**第 1 关**问它：第 2／3 关这一格整块不渲染——「拍板之后不作为可改项出现」这句话
		// 在界面上的落法就是「除了站 4 那一张卡，全仓没有第二处渲染它」；要改＝驳回第 1 关重拍。
		isStation4
			? createElement(
					"div",
					{
						style: {
							marginTop: "12px",
							padding: "8px 10px",
							border: "1px solid var(--dsw-alias-border-l2)",
							borderRadius: "8px",
							background: "var(--dsw-alias-bg-layer-1)",
						},
					},
					createElement(
						"p",
						{ style: { margin: "0 0 6px", fontSize: "13px", fontWeight: 600 } },
						"这本书主要怎么学？",
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
						" 自己也要读",
					),
					createElement(
						"label",
						{ style: S.checkItem },
						createElement("input", {
							type: "radio",
							name: "route",
							checked: route === "blueprint",
							onChange: () => setRoute("blueprint"),
						}),
						" 只让 AI 老师带着学",
					),
					createElement(
						"p",
						{ style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.8 } },
						// ⚠️ 措辞里⛔ 不写「第 N 关」（那是机器词，`test-wording-invariants` 判红）——
						// 用这张卡自己的词「这一步」（同上面那句「这一步你定了，流程才继续」）。
						"这一项拍板之后就定了，不再作为可改项出现；要改就驳回这一步重做。",
					),
				)
			: null,
		// ── 票 `ui-display-redesign/05`：**并发旋钮只在第 1 关、默认折**（spec §2.5 第 8 块）────────
		// 一次性设定：之后要改走对话（`book-set-knobs` 仍可由 AI 改），不在每关重复摆。
		// ⛔ 第 2／3 关整块不渲染（票面逐关断：路线与并发都只属于第 1 关）。
		isStation4
			? createElement(
					"details",
					{ style: { marginTop: "10px" } },
					createElement(
						"summary",
						{ style: { cursor: "pointer", fontSize: "12px", opacity: 0.8 } },
						GATE_CONCURRENCY_FOLD_SUMMARY,
					),
					createElement(
						"div",
						{
							style: {
								marginTop: "6px",
								padding: "8px 10px",
								border: "1px solid var(--dsw-alias-border-l2)",
								borderRadius: "8px",
								background: "var(--dsw-alias-bg-layer-1)",
							},
						},
						createElement(
							"label",
							{ style: { ...S.label, marginTop: "0" } },
							"一次最多派几个小助手",
						),
						createElement(
							"select",
							{
								style: S.disabled({ ...S.input, margin: "4px 0 0" }, busy),
								value: String(maxConcurrentSubagents ?? DEFAULT_MAX_CONCURRENT_SUBAGENTS),
								onChange: (e) => onSetKnobs?.({ maxConcurrentSubagents: Number(e.target.value) }),
								disabled: busy,
								// 票 `auto-walkthrough/04`：`book-set-knobs` 的可见控件是一个 `<select>`（**不是**按钮），
								// 它不在走查器的可点面（D2）里 ⇒ 位置锚点只能靠这枚钩子找到它；点击/效果仍不归它。
								"data-book-knobs": "1",
							},
							Array.from({ length: MAX_CONCURRENT_SUBAGENTS_CEILING }, (_v, i) =>
								createElement("option", { key: i + 1, value: String(i + 1) }, `${i + 1} 个`),
							),
						),
						createElement(
							"p",
							{ style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.8 } },
							`默认 ${DEFAULT_MAX_CONCURRENT_SUBAGENTS} 个。改完过程记录里会留一行，派单模板里也照这个数。`,
						),
					),
				)
			: null,
		// ── 票 `ui-display-redesign/05`：**其他选择**（跳过／回退＋各自后果句）——**每关都折** ────────
		// 定义一句话：**跳过 ＝ 把验货推迟并记账，不是取消验货。** 回退是重操作，先确认再执行。
		// 两项每关都有效、但都低频 ⇒ 收成一个默认折的出口（spec §2.5 第 9 块）。
		// ⛔ 内容（两段后果句与两颗键）一个字没改：它们仍取 `GATE_SKIP_EFFECT`／`GATE_ROLLBACK_EFFECT`
		// 与既有键文案（契约的 `options[].effect` 取的也是那两个常量）。
		createElement(
			"details",
			{
				style: {
					marginTop: "10px",
					borderTop: "1px dashed var(--dsw-alias-border-l2)",
					paddingTop: "8px",
				},
				// 票 `ui-display-redesign/05`：原生开合驱动 React 状态（折叠态不挂内容，见 state 旁注释）。
				onToggle: (e) => setOtherOpen(e.currentTarget.open === true),
			},
			createElement(
				"summary",
				{ style: { cursor: "pointer", fontSize: "12px", opacity: 0.8 } },
				GATE_OTHER_FOLD_SUMMARY,
			),
			otherOpen
				? createElement(
				"div",
				{ style: { marginTop: "6px" } },
				createElement(
					"p",
					{ style: { margin: "0 0 6px", fontSize: "12px", opacity: 0.85 } },
					// 票 11：这段说明的**唯一出处**是 `GATE_SKIP_EFFECT`（契约的 `options[].effect`
					// 取的也是它）——⛔ 别在这儿再写一遍原文。
					GATE_SKIP_EFFECT,
				),
				createElement(
					"button",
					{
						style: S.disabled({ ...S.smallLink, textDecoration: "none" }, busy),
						onClick: () => onSkipStep?.(),
						disabled: busy,
					},
					GATE_SKIP_LABEL,
				),
				createElement(
					"p",
					{ style: { margin: "8px 0 6px", fontSize: "12px", opacity: 0.85 } },
					// 票 11：这段说明的唯一出处同样是 `GATE_ROLLBACK_EFFECT`。
					GATE_ROLLBACK_EFFECT,
				),
				createElement(
					"div",
					null,
					createElement(
						"button",
						{
							// 批 3 视觉权重三档：通过＝填色（主）、驳回＝描边（次）、回退＝灰色小链接（末）。
							// 🎯 票 `gold-display-period/05`：这颗**有意不禁用**（#2 的逐处复核）——
							// 它只开确认层（与关卡卡那一颗同形）。
							style: { ...S.smallLink, color: "inherit", opacity: 0.7 },
							onClick: () => setConfirmRollback(true),
						},
						GATE_ROLLBACK_LABEL,
					),
					confirmRollback ? rollbackConfirm() : null,
				),
			)
				: null,
		),
		error !== null ? createElement("p", { style: S.error }, error) : null,
		rejecting
			? createElement(
					"div",
					{
						style: {
							marginTop: "10px",
							borderTop: "1px dashed var(--dsw-alias-border-l2)",
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
							` ${GATE_REJECT_MODE_WRONG_LABEL}`,
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
							` ${GATE_REJECT_MODE_CONFUSED_LABEL}`,
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
										borderColor: "var(--dsw-alias-state-business-primary)",
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
						placeholder: "想多说一句？在这里写（可选）",
						value: note,
						onChange: (e) => setNote(e.target.value),
					}),
					createElement(
						"div",
						{ style: { marginTop: "8px", display: "flex", gap: "8px" } },
						createElement(
							"button",
							{ style: S.disabled(S.bigBtn(false), busy), onClick: submitReject, disabled: busy },
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
					// 票 `ui-display-redesign/05`（spec §2.5 第 10 块）：主键上方那句**通过后果句已删**
					// ——后果并进了卡头事实句；契约里的 `effect` 文本仍是 `GATE_PASS_EFFECT`，只是不上屏。
					// ⇒ 两颗键直接落在卡底（这一段设计上就只该有键排）。⛔ 别把那句说明加回来。
					"div",
					{ style: { marginTop: "12px" } },
					createElement(
						"div",
						{ style: { display: "flex", gap: "10px" } },
						createElement(
							"button",
							{
								style: S.disabled(S.bigBtn(true), busy),
								// 票 cprb/06：第 1 关的「通过」把**这一项**一并拍定（`route` 随裁决交上去）。
								// 其余两关不带这一格——它们那一步不问路线，带上就等于替用户又定了一次。
								onClick: () => onDecide({ approved: true, ...(isStation4 ? { route } : {}) }),
								disabled: busy,
								// 票 `auto-walkthrough/04`：关键键的语义钩子（三个设计关共用这一颗文案）。
								"data-gate-pass": "1",
							},
							GATE_PASS_LABEL,
						),
						createElement(
							"button",
							{
								// 批 3：原来「驳回」是整块红实心，和「通过」一样重；改成描边，
								// 让主操作（通过）是唯一填色的那个。
								// 🎯 票 `gold-display-period/05`：这颗**有意不禁用**（#2 的逐处复核）——
								// 它只 `setRejecting(true)`（展开这张卡自己的表单），提交那一笔在表单里。
								style: S.ghostBtn(true),
								onClick: () => setRejecting(true),
							},
							GATE_REJECT_LABEL,
						),
					),
				),
	);
}

// ── MinerU Token 常驻入口（F20）─────────────────────────────────────────────
// 未设置（mineruSet=false）：原「还差一步」输入卡，现状不变；
// 已设置：常驻显示脱敏值＋来源（票 `token-banner/01`）＋「重新设置」入口，点开（resetOpen）才展开
// 输入框；保存走父级 onSave（既有 settings 动作，后端支持覆盖），保存成功后父级关回掩码态。
//
// ⚠️ 票 `ui-systematic-fixes/08`（spec 实现决策 §4 落地顺序表第 8 行）：**未设置那一支**多一个
// `collapsed` 档。真书阶段一那一处（`client-entry.js` 唯一那个调用点）传 `collapsed: true` ⇒
// 收成 `<details>` 的**一行提示**（展开才是上面那份完整表单，行为一个字不改）；演示书那一屏由壳
// 决定**不摆**这张卡（它压根不转换，见 `src/demo-exemptions.js` 的 `phase1-no-real-conversion`）。
// 缺省（不传）＝无书向导那一处照旧：一张红框大卡。
//
// ⚠️ 票 `token-banner/01`（2026-10-29）：**已设置那一支也认 `collapsed`**。阶段一原来在已设置后
// 把这张卡整块藏掉，而本票要求界面说出「来源：设置 / 环境变量」——那条信息必须在用户当时那一屏
// 上（阶段一）读得到，不能只住在无书向导里。折成一行后它只占一句话，不再把首屏让给配置。
/** 折叠口那一行（唯一出处）。⛔ 不再拼第二份：真书阶段一首屏上只该有这一句 MinerU 的话。 */
export const MINERU_TOKEN_FOLD_SUMMARY = "🔑 还差一步：MinerU Token（点开填）";

/**
 * Token 来源的中文标签（票 `token-banner/01`）。
 *
 * 后端只回机器词汇（`settings` / `env` / `credentials`），中文只在界面这一处拼——同一份来源
 * 要在「已设置」那一行与折叠口两处说，两处都从这里取，⛔ 不再各写一份。
 */
const MINERU_TOKEN_SOURCE_LABEL = Object.freeze({
	settings: "设置",
	env: "环境变量",
	credentials: "凭据文件",
});

function mineruSourceLabel(source) {
	return Object.hasOwn(MINERU_TOKEN_SOURCE_LABEL, source)
		? MINERU_TOKEN_SOURCE_LABEL[source]
		: null;
}

export function MineruTokenCard(props) {
	const {
		mineruSet,
		mineruToken,
		busy,
		onTokenChange,
		onSave,
		resetOpen,
		onToggleReset,
		// 票 `token-banner/01`：来源与脱敏值由服务端随设置快照下发（`mineruTokenStatus`）。
		mineruSource,
		mineruMasked,
		// 票 `usf/08`：真书阶段一那一处折成一行（见本节头注）。
		collapsed,
	} = props;
	// 票 `premature-announce/06`：`mineruSet` 是三态——`true`＝已设置／`false`＝确实未设置／
	// `null`（缺省同义）＝**还没读到**。未定档一句结论都不印：既不说「已设置（••••）」，
	// 也不摆「还差一步」那张卡（那同样是替数据宣告结论）。两句文案本身一字未动。
	if (mineruSet !== true && mineruSet !== false) return null;
	if (mineruSet === false) {
		// 表单本体只此一份：折叠与不折叠共用同一批节点（「展开后行为不变」不是靠抄一份）。
		const form = [
			createElement(
				"p",
				{ style: { margin: "4px 0" } },
				"材料转换需要 MinerU 的 Token（在 mineru.net 申请；免费额度以对方规则为准）。填在这里即可：",
			),
			createElement("input", {
				style: S.input,
				placeholder: "粘贴 MinerU Token",
				value: mineruToken,
				onChange: onTokenChange,
			}),
			createElement(
				"button",
				{ style: S.disabled(S.bigBtn(true), busy), onClick: onSave, disabled: busy },
				"保存 Token",
			),
		];
		if (collapsed === true)
			return createElement(
				"details",
				{ style: { margin: "0 0 10px" } },
				createElement(
					"summary",
					{
						style: {
							cursor: "pointer",
							fontSize: "12px",
							color: "var(--dsw-alias-state-error-primary)",
						},
					},
					MINERU_TOKEN_FOLD_SUMMARY,
				),
				createElement(
					"div",
					{
						style: {
							...S.card,
							borderColor: "var(--dsw-alias-state-error-primary)",
							marginTop: "6px",
						},
					},
					...form,
				),
			);
		return createElement(
			"div",
			{ style: { ...S.card, borderColor: "var(--dsw-alias-state-error-primary)" } },
			createElement(
				"strong",
				{ style: { color: "var(--dsw-alias-state-error-primary)" } },
				"🔑 还差一步：MinerU Token",
			),
			...form,
		);
	}
	// 已设置：脱敏值（旧回包没有这一格时退回 `••••`，与 F20 的原文案等价）＋来源（没有就不印）。
	const masked =
		typeof mineruMasked === "string" && mineruMasked !== "" ? mineruMasked : "••••";
	const sourceLabel = mineruSourceLabel(mineruSource);
	const setLine = `✅ MinerU Token 已设置（${masked}）`;
	// 空输入时保存键照样灰着：点了也只是 `saveMineruToken` 的早返回（四路都看不见后果）。
	// 走查器对「空输入＋可点保存」一律判死键——灰着是真实状态，不是为消红放宽。
	const resetDisabled = busy || mineruToken.trim() === "";
	const resetForm = [
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
			{ style: S.disabled(S.bigBtn(true), resetDisabled), onClick: onSave, disabled: resetDisabled },
			"保存新 Token",
		),
	];
	if (collapsed === true)
		return createElement(
			"div",
			{ style: { margin: "0 0 10px" } },
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
				createElement(
					"span",
					{
						style: {
							fontSize: "12px",
							color: "var(--dsw-alias-state-success-primary)",
						},
					},
					`${setLine}${sourceLabel === null ? "" : `，来源：${sourceLabel}`}`,
				),
				createElement(
					"button",
					{ style: S.smallLink, onClick: onToggleReset },
					"重新设置",
				),
			),
			// ⚠️ 表单只在**点了「重新设置」之后**才渲染：这里没有原生 `<details>` 的收起态可借，
			// 若一直渲染，屏上会多一颗不可见的保存键（走查器会把它读成死键）。
			resetOpen
				? createElement("div", { style: { marginTop: "6px" } }, ...resetForm)
				: null,
		);
	return createElement(
		"div",
		{ style: { ...S.card, borderColor: "var(--dsw-alias-state-success-primary)" } },
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
			createElement("strong", {}, setLine),
			sourceLabel === null
				? null
				: createElement(
						"span",
						{ style: { fontSize: "12px", opacity: 0.65 } },
						`来源：${sourceLabel}`,
					),
			createElement(
				"button",
				{ style: S.smallLink, onClick: onToggleReset },
				"重新设置",
			),
		),
		resetOpen ? createElement("div", { style: { marginTop: "6px" } }, ...resetForm) : null,
	);
}


