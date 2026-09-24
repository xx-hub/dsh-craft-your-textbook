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
 * ⚠️ **行单位是「步」，不是分段**（票 01 的裁决；见 `view-rules.phaseSteps`）：本页与全览条
 * 取**同一份步模型**（`stepsOf`），四态词的**文字与图标**也共用同一份具名件
 * （`chapters-map.stepRowText`，票 04 抽出）——不许在页内再拼一套。
 * 阶段的**专属东西**也各就各位：读材料挑重点摆人读的重点清单、最佳范例章摆稿次与旧稿、
 * 最后检查摆机器逐项检查与 AI 检查报告。
 *
 * 两条硬边界（承 ADR-0010）：
 *  1. 产物一律由写着「打开」的显式按钮交给 DSH 右栏（`onOpen`，只读、不进模型上下文）；
 *     **导航本身不开任何文件**。
 *  2. 机器产物（`work/audit-NN.md`）与走卡片内联的（知识地图）都不进"文件"清单——
 *     判据见 `view-rules.openableArtifacts`。
 *
 * 「✍️ 定点修改」就地展开确认框：不换屏、不另造一份流程，页脚直接长出「影响预告 + 写一句 + 提交」。
 * 撤销（「↩️ 撤销刚才的定点修改（10 分钟内）」）也归这一页：原来它长在旧的分段单卡里，合并时
 * 随旧卡掉出了渲染路径，2026-09-21 接回这里——**就地改、就地撤**（见 `UndoButton`）。
 * 2026-09-23 票 11 补上两件：① 确认框的影响预告说真话（下游名单由 `phaseSteps` 译成人读名字）；
 * ② **提交后仍停在这一页**，被改的那一段就地标成「我正在做」（乐观标记，见 `PhasePage` 顶部）。
 * ⚠️ 「回到现在」**不在这一页**（2026-09-22 票 12：它长在阶段片「当前阶段」那一格上）——
 * 阶段页里任何换屏动作都不许有。
 */
import { createElement as h, useEffect, useState } from "react";
import { S } from "./styles.js";
import {
	phaseSummary,
	phaseSteps,
	checkHuman,
	stepWord,
	MATERIAL_STEP_KEY,
	PHASE_UI,
} from "./view-rules.js";
// 「打开这份文件」按钮：票 09 起住中性模块（章节卡也要用它，直接从本文件 import 会成环，
// 理由见那一件顶部的注释）——本文件原样**再导出**它，票 02 的导出表面不变。
import { OpenArtifactButton } from "./open-artifact-button.js";
// 知识地图（机器产物）的人读折叠：与阶段页里就地展开它的 `KnowledgeMapBlock` 共用一份，
// 别让同一样东西两处两种读法。
// 四态行（票 04 抽出、票 05 接线）：`stepRowText` 是全览条清单与阶段页**共用**的那一份
// （spec §2 D 明写「清单与阶段页取同一份四态行，不许各写一套」）——阶段页原先自己抄了一份
// `STEP_ICON`，本票收掉：行的图标、步名与状态词只从这一处出。
import { foldKnowledgeMap, stepRowText } from "./chapters-map.js";

// 每个阶段用哪套布局（用户裁决的那张表；改它等于改设计，别顺手改）。
const PHASE_LAYOUT = Object.freeze({
	1: "materials",
	2: "stack",
	3: "stack",
	4: "stack",
	5: "split",
	6: "stack",
});

const P = {
	head: { display: "flex", alignItems: "baseline", gap: "10px", margin: "0 0 2px" },
	headTitle: { fontSize: "17px", fontWeight: 700 },
	headMeta: { fontSize: "12px", opacity: 0.7 },
	intro: { fontSize: "12px", opacity: 0.7, margin: "4px 0 12px" },
	sectionLabel: { fontSize: "12px", fontWeight: 600, opacity: 0.75, margin: "0 0 6px" },
	row: {
		display: "flex",
		alignItems: "center",
		gap: "8px",
		padding: "7px 10px",
		borderRadius: "8px",
		border: "1px solid var(--dsw-border, #d0d7de)",
		marginBottom: "6px",
		background: "var(--dsw-bg, #fff)",
		fontSize: "13px",
	},
	kindTag: {
		fontSize: "11px",
		padding: "1px 6px",
		borderRadius: "999px",
		background: "var(--dsw-border-soft, #eff1f4)",
		opacity: 0.85,
		whiteSpace: "nowrap",
	},
	empty: { fontSize: "12px", opacity: 0.65, margin: "6px 0" },
	pre: {
		whiteSpace: "pre-wrap",
		margin: "8px 0 0",
		padding: "8px 10px",
		borderRadius: "8px",
		background: "var(--dsw-border-soft, #eff1f4)",
		fontSize: "12px",
		maxHeight: "260px",
		overflow: "auto",
		fontFamily: "inherit",
	},
};

/**
 * 票 09：`OpenArtifactButton` 已搬去中性模块 `./open-artifact-button.js`（章节卡也要用它，
 * 而本文件已经 import 了 `chapters-map.js`——反向 import 会成环）。这里**原样再导出**，
 * 票 02 的导出表面（`test-phase-page.mjs` 与 `client-entry.js` 都按本文件取它）保持不变。
 */
export { OpenArtifactButton };

/** 「这一步的文件：」+ 每份一个显式按钮（空则说清"没有文件"）。 */
function ArtifactList(props) {
	const { artifacts, onOpen, emptyText } = props;
	if (artifacts.length === 0)
		return h("p", { style: P.empty }, emptyText ?? "这一步没有留文件。");
	return h(
		"div",
		{ style: { marginTop: "8px" } },
		h("p", { style: P.sectionLabel }, "这一步的文件："),
		// 2026-09-21 用户要求：文件是开在**右边**的，卡片上得先说一句，否则点完不知道内容去哪了。
		h(
			"p",
			{ style: { ...P.empty, margin: "0 0 6px" } },
			"点「打开」，内容会在右侧打开给你看（只读，不影响造书）。",
		),
		...artifacts.map((item) =>
			h(
				"div",
				{ key: `${item.stepKey ?? ""}::${item.path}`, style: P.row },
				h("span", { style: P.kindTag }, item.kind),
				h("strong", { style: { fontSize: "13px" } }, item.label),
				h(OpenArtifactButton, { item, onOpen }),
			),
		),
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
	if (row.canDeepModify !== true) return null;
	const open = openKey === row.key;
	const close = () => {
		onOpenKey(null);
		setNote("");
	};
	if (!open) {
		return h(
			"button",
			{
				style: { ...S.smallLink, marginTop: "8px" },
				onClick: () => onOpenKey(row.key),
				disabled: busy === true,
				title: "就地改决定并重做下游（不离开这一步）",
			},
			"✍️ 定点修改这一步",
		);
	}
	// 票 11：`row.downstream` 由 `view-rules.phaseSteps` 从段上的 `seg.downstream`（服务端
	// `deepAffected` 的**段 key** 数组）译好——出口已是人读名字（`segmentHuman`），页里不许
	// 再碰 key，也不许在 tooltip 里补一份机器词（CONTEXT.md「界面用词表」）。
	const downstream = row.downstream ?? [];
	return h(
		"div",
		{ style: { marginTop: "8px", borderTop: "1px dashed var(--dsw-border, #d0d7de)", paddingTop: "8px" } },
		h("p", { style: { margin: "0 0 6px", fontWeight: 600 } }, `✍️ 定点修改「${row.title}」`),
		h(
			"p",
			{ style: { margin: "0 0 6px", fontSize: "12px", color: "var(--dsw-danger, #cf222e)" } },
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
					style: S.bigBtn(false),
					disabled: busy === true || note.trim() === "",
					onClick: () => {
						// ⚠️ 定点修改的粒度是**段**（票 01 Q9）：步比段细，交出去的一律是段 key
						// （`chapter-1:write` 这种步 key 后端不认；点在章内任何一步上＝整章重做）。
						onDeepModify?.(row.segmentKey ?? row.key, note.trim());
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
					style: {
						...S.card,
						// 从步清单点进来的那一步：描一圈，指明"你点的是这一个"。
						...(row.key === props.focusedStepKey
							? { outline: "2px solid var(--dsw-text, #1f2328)", outlineOffset: "-2px" }
							: {}),
					},
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
					// `stepRowText`，本页不再自己拼一份。
					h("strong", { style: { fontSize: "14px" } }, stepRowText(row)),
				),				row.decision !== null
					? h("p", { style: { margin: "6px 0 0", fontSize: "12px" } }, `拍板：${row.decision}`)
					: null,
				h(ArtifactList, {
					artifacts: row.artifacts.map((item) => ({ ...item, stepKey: row.key })),
					onOpen,
					emptyText: row.status === "pending" ? "还没到这一步。" : undefined,
				}),
				h(DeepModifyLink, {
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

function SplitBody(props) {
	const { steps, onOpen, onDeepModify, busy } = props;
	// 同一屏只能开一个确认框（见 DeepModifyLink 顶部说明）。
	const [openKey, setOpenKey] = useState(null);
	// 从步清单点一步进来时，直接停在**那一步**上（用户 2026-09-21 第 5 条：
	// 「点击写完整本的某一章的时候，直接跳到回看页面的那一章就行了吧」）。
	const focusedIndex = steps.findIndex((row) => row.key === props.focusedStepKey);
	const [picked, setPicked] = useState(focusedIndex >= 0 ? focusedIndex : 0);
	// hook 一律在任何提前 return 之前（第 2 轮踩过 React #310：换书/换阶段会变 hook 数）。
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
					border: "1px solid var(--dsw-border, #d0d7de)",
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
							borderRadius: "7px",
							padding: "6px 8px",
							margin: "0 0 2px",
							fontSize: "12px",
							cursor: "pointer",
							color: "inherit",
							background:
								index === picked ? "var(--dsw-accent-soft, #eef2ff)" : "transparent",
							opacity: item.status === "pending" ? 0.55 : 1,
						},
						onClick: () => setPicked(index),
					},
					// 四态行（票 04 抽出、票 05 接线）：左栏一行一步，与全览条清单同一份 `stepRowText`。
					stepRowText(item),
				),
			),
		),
		h(
			"div",
			{ style: { ...S.card, flex: 1, marginBottom: 0 } },
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
				h("strong", { style: { fontSize: "14px" } }, stepRowText(row)),
			),
			row.decision !== null
				? h("p", { style: { margin: "6px 0 0", fontSize: "12px" } }, `拍板：${row.decision}`)
				: null,
			h(ArtifactList, {
				artifacts: row.artifacts.map((item) => ({ ...item, stepKey: row.key })),
				onOpen,
				emptyText: row.status === "pending" ? "还没到这一步。" : undefined,
			}),
			h(DeepModifyLink, {
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
 * 阶段 1 的那一步。
 *
 * 票 01 Q2/Q3 的裁决：**材料准备本身就是第一步**（判据＝书已进阶段 2，见 `materialStepStatus`），
 * 不是"零步阶段"。所以这里摆的是**那一步**（名字 + 四态词，与全览条同一份 `stepsOf`/`stepWord`），
 * 材料清单是它的产物行。旧那句写死的「这一步没有小步：把材料传上来…」与这条裁决直接矛盾，
 * 2026-09-23（票 05）已删——别再写回来。
 */
function MaterialsBody(props) {
	const sources = props.sources ?? [];
	const step = props.step;
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
			// 四态行（票 04 抽出、票 05 接线）：材料准备那一步的名字与四态词走全览条清单同一份
			// `stepRowText`。
			// ⚠️ 兜底那一支**不许手写**「材料准备」（2026-09-23 代码审查）：界面上的字只此一份
			// （CONTEXT.md「界面用词表」），组件里手写阶段短标签正是它点名要避免的。而且这一支
			// 事实上到不了——`stepsOf` 无条件 push 材料准备那一步（`view-rules.js:755`），
			// 它的 `title` 就是 `PHASE_UI[1]`。留兜底只为不崩，词一律从表里取。
			h(
				"strong",
				{ style: { fontSize: "14px" } },
				step === null || step === undefined
					? (PHASE_UI[1] ?? "")
					: stepRowText(step),
			),
		),
		sources.length === 0
			? h("p", { style: { margin: "6px 0 0", fontSize: "13px" } }, "还没有上传材料。")
			: h(
					"div",
					{ style: { marginTop: "6px" } },
					...sources.map((source) =>
						h(
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
								`${source.converted === true ? "✅" : "⏳"} ${source.file}（${source.role ?? ""}）`,
							),
							source.converted === true &&
								typeof source.md === "string" &&
								source.md !== ""
								? h(OpenArtifactButton, {
										item: { path: `sources-md/${source.md}` },
										onOpen: props.onOpen,
										// 票 10（判定一 #14）：行的形状是 **[名字] + [打开]**（CONTEXT.md「产物名」）
										// ——左边那格已经是这份材料的名字（`source.file`），所以按钮只说动词「打开」，
										// 不再自造「查看转换内容」这种说法；这一份叫什么由按钮 tooltip 给出
										// （`artifactName` →「x 的转换稿」）。
									})
								: h(
										"span",
										{ style: { fontSize: "12px", opacity: 0.6 } },
										"转换中",
									),
						),
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
	// 机器产物（原始 JSON）折成人读清单：与 FileViewer 走同一份 foldKnowledgeMap（F38）——
	// 这份知识地图有两条展示路径，读法不能两样。解析失败/无内容时回退原文（不假装读懂了）。
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
		),
		open ? h("pre", { style: P.pre }, body) : null,
	);
}

/** 最佳范例章：这一章的稿子（定稿没定稿、第几稿、旧稿逐个看）。 */
export function GoldBlock(props) {
	const drafts = props.goldDrafts ?? [];
	const sealed = props.goldSealed ?? null;
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

/** 最后检查：机器逐项检查 + AI 检查报告（都来自账本，客户端本来就有）。 */
export function FinalChecksBlock(props) {
	const checks = props.checks ?? [];
	const report =
		typeof props.aiReport === "string" && props.aiReport !== "" ? props.aiReport : null;
	return h(
		"div",
		{ style: S.card },
		h("strong", { style: { fontSize: "13px" } }, "机器逐项检查"),
		checks.length === 0
			? h("p", { style: P.empty }, "还没有检查结果。")
			: h(
					"div",
					{ style: { marginTop: "6px" } },
					...checks.map((check) =>
						h(
							"div",
							{ key: check.name, style: { fontSize: "12px", padding: "2px 0" } },
							// 票 20：加 ❌——真门槛（如重复标题）失败时不能再显示成 ⚠️ 那种"提示"，
							// 与「拦交付」自相矛盾；⚠️ 仍留给第三态（`ok:true + warn:true`，只提示不拦）。
							`${check.ok !== true ? "❌" : check.warn === true ? "⚠️" : "✅"} ${checkHuman(check.name)}${check.note ? `（${check.note}）` : ""}`,
						),
					),
				),
		report !== null
			? h(
					"div",
					{ style: { marginTop: "10px" } },
					// 票 10（判定三 #10）：界面一律说「检查」——「自查」是机器视角（谁查谁？）。
					h("p", { style: { ...P.sectionLabel, margin: "0 0 4px" } }, "AI 检查报告"),
					h("p", { style: { margin: 0, fontSize: "12px", opacity: 0.85 } }, report),
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
				style: { ...S.smallLink, textDecoration: "none" },
				disabled: props.busy === true,
				onClick: () => props.onDeepUndo?.(),
			},
			"↩️ 撤销刚才的定点修改（10 分钟内）",
		),
	);
}

export function PhasePage(props) {
	const { phase, meta, segments, workFiles, onOpen } = props;
	// 票 11：提交「✍️ 就这么改，重做下游」后**不换屏**（热区表判"提交后替用户换屏"不合法），
	// 被改的那一段就地标成「我正在做」——工作台状态词只许三个，重做中的说法就是它，不另造词。
	// 乐观标记（本地先标、真值一到就让位）的理由：提交到下一份 `/textbook/process` 到货之间
	// 有一段真实延迟（POST + 连锁 `loadAll`），那段窗口里行文不许还停在「已完成」；而
	// `/textbook/process` 每 2 秒刷一次、每次都给一份**新的** `segments`（`refreshProcess`），
	// 所以「任何一份新 payload 到货就清掉标记」＝本地标记绝不活得比服务端真值久
	// （服务端没接受、或重做已完成时，下一份 payload 立刻把这一行还原成真实状态）。
	const [redoKey, setRedoKey] = useState(null);
	useEffect(() => {
		setRedoKey(null);
	}, [segments]);
	// 就地定点修改所需的两件（`onLocate` 已退役：新建的那份卡就在原地改，不再换屏）。
	const modProps = {
		// 提交那一下先把这一段标成「我正在做」（乐观），再交给接线层发 `deep-modify`。
		onDeepModify: (segKey, note) => {
			setRedoKey(segKey);
			props.onDeepModify?.(segKey, note);
		},
		busy: props.busy,
	};
	// 阶段名与开场白仍借 `phaseSummary`（它的段级契约不动）；这一页的**行单位是「步」**——
	// 与全览条共取 `stepsOf`（票 01），四态词与步名因此只有一处来源。
	const page = phaseSummary(segments, phase, workFiles);
	const steps = phaseSteps({ segments, meta }, phase, workFiles).map((row) =>
		// 乐观标记只覆写四态词/状态：行是**段**级的活（章内三步共属一段，整章一起重做，
		// 所以章段的三行会一起说「我正在做」——那正是事实）。
		redoKey !== null && row.segmentKey === redoKey
			? { ...row, status: "active", statusWord: stepWord("active") }
			: row,
	);
	const currentPhase = meta?.phase ?? 1;
	const layout = PHASE_LAYOUT[phase] ?? "stack";

	// 从步清单点进来的那一步（`focusedSegment` 这名字是接线层的历史包袱：今天全览条的清单仍按
	// **分段**出行，所以它先是段 key；票 04 之后一行一步，它会变成**步 key**）——两种都认。
	// 落点取**第一个命中的步**：一章段现在展开成「写 / 审 / 复核」三步，而页面同一时刻只能说清
	// "你点的是这一个"（三行都描＝谎称点了三步），右栏也一次只装得下一步；描「写」＝那一段的起点，
	// 与"点了一章"的语义对得上（章内五态没上报时，`stepsOf` 也只认第一步在动）。
	const focusedStepKey = (() => {
		const focused = props.focusedSegment;
		if (focused === null || focused === undefined) return null;
		const hit = steps.find((row) => row.key === focused || row.segmentKey === focused);
		return hit?.key ?? null;
	})();

	const doneSteps = steps.filter((row) => row.status === "done").length;
	// 「份文件」按**路径去重**数：章内三步共属同一段，不去重会把一章的正文数成三份。
	const fileCount = new Set(
		steps.flatMap((row) => row.artifacts.map((item) => item.path)),
	).size;

	const head = h(
		"div",
		null,
		h(
			"div",
			{ style: P.head },
			h("strong", { style: P.headTitle }, page.name),
			// 票 10（判定一 #11）：这一处原来手写「轮到你 / 已完成 / 还没到这一步」——
			// 与 view-rules.stepWord 是同一组状态词的第二份实现（「界面上的字只此一份」）。
			// ⚠️ 阶段 1 不再在这里报状态：那一步的四态词由它自己那张卡承担（见 MaterialsBody），
			// 同屏说两遍同一件事没必要。其余阶段按**步**计数（票 05 起行单位是步，不再数分段）。
			// 「N/M 小步已完成」里的「小步」是退役词（票 01 / spec 不变量 7 / §6 越界清单），
			// 本票改成「N/M 步已完成」；「份文件」按**路径去重**（`fileCount`），不把一章正文数三遍。
			phase === 1
				? null
				: h(
						"span",
						{ style: P.headMeta },
						steps.length > 0
							? `${doneSteps}/${steps.length} 步已完成 · ${fileCount} 份文件`
							: stepWord(phase < currentPhase ? "done" : "pending"),
					),
		),
		h("p", { style: P.intro }, page.intro),
	);

	const body =
		layout === "materials"
			? h(MaterialsBody, {
					step: steps.find((row) => row.key === MATERIAL_STEP_KEY) ?? null,
					sources: meta?.sources ?? [],
					onOpen,
				})
			: layout === "split"
				? h(SplitBody, { steps, onOpen, focusedStepKey, ...modProps })
				: h(StackBody, { steps, onOpen, focusedStepKey, ...modProps });

	const extras = [];
	if (phase === 2)
		extras.push(h(KnowledgeMapBlock, { key: "km", text: props.knowledgeMapText }));
	if (phase === 4)
		extras.push(
			h(GoldBlock, {
				key: "gold",
				goldSealed: meta?.goldSealed ?? null,
				goldDrafts: props.goldDrafts,
				goldDraftVersion: props.goldDraftVersion,
				onOpen,
			}),
		);
	if (phase === 6)
		extras.push(
			h(FinalChecksBlock, { key: "checks", checks: props.checks, aiReport: props.aiReport }),
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

	return h(
		"div",
		null,
		head,
		body,
		...extras,
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
