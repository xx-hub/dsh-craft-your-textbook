/**
 * 造书工作台 · **站 3 那一屏**：学完能做到什么（那 3–5 条目标）。
 *
 * 票 `confirm-points-redesign-build/05`。形状的权威源＝spec §3.2 站 3 那一节 ＋
 * `.scratch/confirm-points-redesign/issues/06-探查确认卡重设计.md` §2 的「站 3」那张表；
 * 块序按票 `ui-display-redesign/04`（`.scratch/ui-display-redesign/spec.md` §2.4）重排：
 *
 * | # | 块 | 默认态 |
 * | :-: | --- | --- |
 * | 1 | **卡头问句**（存量句 `这几条学习目标可以定下来了吗？`）＋卡头事实句（条数现算） | 首屏 |
 * | 2 | 说明句（这一趟是站 2 拍板之后另跑的那一趟；⛔ 不带 `工作区/…` 机器路径） | 常显 |
 * | 3 | **`学完要能做到什么`＝3–5 条（逐条可改／删／加）** | **常显 ＝ 首屏必须看见的那一块** |
 * | 4 | 两颗键（`✅ 就按这几条办`／`🔁 让 AI 重写这几条`） | 常显（卡底） |
 * | 5 | 重写表单（点「🔁 让 AI 重写这几条」后出现） | 〔隐〕 |
 *
 * ⛔ 站 3 **不重复列**「重点／难点」、⛔ 不加「这些目标从哪来」的证据栏（维护者裁「只装那份目标」）。
 * ⛔ 也**没有 rcb 的插槽**（`08` 把 rcb 两件都落回站 2 了）。
 * ⛔ 通过后果句**不再单列一段**（票 `ui-display-redesign/04`：后果并进卡头事实句；契约里的
 * `effect` 文本按 spec 保留、只是不上屏——见下面 `GOAL_CONFIRM_PASS_EFFECT` 的注释）。
 *
 * ## 拍板粒度＝**整批一次过**
 *
 * 这一屏**没有**逐条勾选的键：人逐条改／删／加之后点「✅ 就按这几条办」，机器把**整份**认下来；
 * 不满意就「🔁 让 AI 重写这几条」＝**整份驳回重拟**（⛔ 不逐条否）。
 * ⇒ 这一屏只往壳递**一次**决定（`onDecide(approved, goals, note)`），⛔ 不逐条发动作。
 *
 * ## 这一屏上「那几条」从哪来（为什么不从 props 递进来）
 *
 * 正文是**盘上的那一份**（路径由 {@link goalDocRel} 拼，界面⛔ 不手抄第二份文件名），
 * 版本号由账本上那一格
 * （`meta.goalDocVersion`，机器写那一份时一并记下）指出来——与站 2 那张卡读
 * `工作区/explore.md` 同一口径（`readArtifact` ＋ 读不到就不显示、**不打断这一站**）。
 * 版式（`1. ` 起首的编号行）走 `src/goal-doc-format.js` 那**同一份** `readGoalDoc`，
 * ⛔ 界面不手抄第二份解析法。
 *
 * ## ⚠️ 如实登记（这一屏今天**验不了**的两件）
 *
 * · 「这几条到底算不算可检验」机器一个字都不读（spec §3.2 站 3 的强度：硬闸 1 条 ＋ 只有承诺 1 条）
 *   ——这一屏的**编辑**是给人用的，不是给机器判的。
 * · 「3–5 条」是**提示不是硬拦**（材料本身可能只撑得起 2 条）⇒ 这一屏**不设下限**，
 *   一条都不剩时才拦（那已经不是「几条」了）。
 */

import { createElement, useEffect, useState } from "react";
import { defineCardView } from "./card-view.js";
import { S } from "./styles.js";
// 票 `ui-display-redesign/04`：卡头行（问句一行＋事实句一行）是**共用小件**（票 01 立起来的那一件）——
// 字号/间距/颜色只在 `card-head.js` 定义一次，本卡⛔ 不就地另写一份。
import { CardHead, CARD_HEAD_QUESTION_STYLE } from "./card-head.js";
import { readGoalDoc, goalDocRel } from "../goal-doc-format.js";

/** 两颗键的逐字文案（票面逐字）。⚠️ 与站 2 那三颗键**不同名**：这是另一件事。 */
export const GOAL_CONFIRM_ACCEPT_LABEL = "✅ 就按这几条办";
export const GOAL_CONFIRM_REWRITE_LABEL = "🔁 让 AI 重写这几条";

/**
 * 卡头问句（票 `ui-display-redesign/04`；**存量句逐字不改**——它就是 `view-rules.js`
 * `DECISION_QUESTION.goals` 那一句，本票把它从状态条搬上卡头）。
 *
 * ⚠️ 字面量必须留在**本文件**、并由本卡就地造那个 `<strong>` 再交给 `CardHead`（理由见
 * `card-head.js` 文件头「API」）：造书模式人设的「界面状态对照表」逐字引着这张卡的标题，而那条
 * 契约（`test-context-vocabulary.mjs`）的取证面只读 `src/ui/**` 里 `createElement("strong", …)`
 * 调用点上的字面量／同文件 `const`——问句节点由共用件代造时，取证面看不见它。
 */
export const GOAL_CONFIRM_QUESTION = "这几条学习目标可以定下来了吗？";

/**
 * 卡头事实句（票 `ui-display-redesign/04` 新写）：条数**按此刻清单里真有的条数现算**，
 * 后半句是原通过后果句的压缩（「定下后 AI 接着起草下一版方案。」）——⛔ 不写死「3 条」。
 */
export function goalConfirmFacts(count) {
	return `${count} 条，逐条可改可删可加，定下后 AI 接着起草下一版方案。`;
}

/**
 * 说明句（存量句；票 `ui-display-redesign/04` 删掉原句尾「正文是 `工作区/目标-vN.md`。」那半句）：
 * 机器路径不上正文（usf spec §3「机器路径只许进悬停提示」）。
 */
export const GOAL_CARD_NOTE = "这一趟是上一站拍板之后另跑的：它读过那份材料报告、也认了你在图上划掉的那几条。";

/**
 * 0 条时的空态句（存量句的改写；票 `ui-display-redesign/04`：去掉「盘上」这个内部词，
 * 换成「这次没从报告里读出」这个人话视角）。
 */
export const GOAL_EMPTY_NOTE = "这次没从报告里读出学习目标——要么点下面「🔁 让 AI 重写这几条」，要么自己加一条。";

/**
 * 「✅ 就按这几条办」那颗主键的**后果说明**（票 `ui-systematic-fixes/09` 立的唯一出口）。
 *
 * ── 病（`.scratch/_archive/2026-11/ui-page-audit/inv-decisions.md` §1 站 3 那一行）──────────────────────
 * 同一张卡上「🔁 让 AI 重写这几条」写明了后果（`哪里不行？`那块表单自述 AI 会照这句重拟），
 * 而「✅ 就按这几条办」**零后果说明**。
 *
 * ── 为什么它住在**本模块**（而不是 `view-rules.js` 那张表）────────────────────────────
 * 票 10／11 从这里 import 去填 `decisionOf(...).options[].effect`（spec 实现决策 §5）。
 * ⛔ 不在 `view-rules.js` 另立第二份——「同一句话只许有一个出口」（`CONTEXT.md`「界面用词表」）。
 *
 * ── ⚠️ 票 `ui-display-redesign/04` 起：这句**不上屏**了 ──────────────────────────────
 * 用户 2026-10-21 裁「通过后果句删」：后果并进卡头事实句（`goalConfirmFacts` 的
 * 「定下后 AI 接着起草下一版方案。」），卡上⛔ 不再单列一段。但这句**文本本身一字不改**——
 * `decisionOf("goals").options[].effect` 仍取它（契约那一格不动，只是改成不上屏）。
 * ⇒ 本导出的读者只剩**契约**；`GoalsConfirmCard` 不渲染它（⛔ 别再搬回卡上）。
 *
 * ⚠️ 这一步之后去哪，按盘上事实写：`onDecide(true, …)` ⇒ `explore-confirm` 的站 3 那一支
 * （`workflow/actions/gates.js` 的 `confirmStationGoals`）写回目标并 `advance(2, 3)` ⇒
 * 进**拍板定方案**那一阶段的第一份提案（「学习目标与难点」那一版），写好之后用户还要在那张卡上
 * 拍一次板——本句只说这一步的后果，⛔ 不替下一站许任何诺。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：本出口只管**这一张卡的这一颗键**；「点了之后 AI 真去干了那件事」
 * 本句**不声称**（真机层，ADR-0005）。它也不分出演示书那一支：这一跳在演示书上同样把书推进一步。
 */
export const GOAL_CONFIRM_PASS_EFFECT =
	"点了它这几条就此定下：书往前走一步，AI 接着起草「学习目标与难点」那一版方案，写好还要你拍板。";

/**
 * 上面那句的**取值出口**（票 10／11 从这儿取，⛔ 不手抄第二份原文）。
 * 今天它没有分支——留成函数是为了「同一格将来出现第二个取值」时**只有一个地方**可以分叉
 * （先例：`view-rules.gateDecidedNote(meta)` 那两个取值）。
 */
export function goalConfirmPassEffect() {
	return GOAL_CONFIRM_PASS_EFFECT;
}

/**
 * 「🔁 让 AI 重写这几条」那一路的后果句（票 11 的 `options[].effect`）：**就是卡上那块表单的标题**
 * （逐字搬进常量，卡渲染它、契约也取它）——它自述了后果（「AI 会照这句重拟」）。
 *
 * ⚠️ 它**不是**新写的一句：票面只允许本票补六句（站 2／7／8／9／10／11），重写这一路不在其中。
 */
export const GOAL_REWRITE_EFFECT = "哪里不行？（可留空，AI 会照这句重拟）";

export const goalConfirmCardView = defineCardView({
	card: "GoalsConfirmCard",
	// 壳那一侧不撞名的标识符 → 卡片真正的 prop 名由 `derive` 整形（与 `exploreConfirmCardView`
	// 同一条纪律：两个「确认」回调不许在壳里合成一个）。
	fromBook: ["meta", "readArtifact", "confirmGoals", "busy"],
	required: ["readArtifact", "confirmGoals"],
	// ⚠️ `derive` 只拿得到一个参数（此刻的袋子）：整形出来的 `onDecide` 就是卡片消费的那一个。
	derive: (bag) => ({ onDecide: bag.confirmGoals }),
});

export function GoalsConfirmCard(props) {
	const { meta, readArtifact, onDecide, busy } = props;
	// 该读哪一版：机器写那一份时记在账本上的那一格（`meta.goalDocVersion`）。
	// ⚠️ 缺它（老书／手摆的夹具）时退回 1：这一族的第一版就是 v1（`goalDocRel(1)`）。
	const version = Number.isFinite(Number(meta?.goalDocVersion)) && Number(meta.goalDocVersion) > 0
		? Number(meta.goalDocVersion)
		: 1;
	// 那一份正文的原文：读不到就**不显示这一块**，也**不打断这一站**（与站 2 那张卡对
	// `工作区/explore.md` 的错误策略逐字一致：那一条是产品决定，不是随手写的兜底）。
	const [docText, setDocText] = useState(null);
	// 人正在编的那几条（初值＝盘上那一份）。
	const [items, setItems] = useState([]);
	const [rewriting, setRewriting] = useState(false);
	const [note, setNote] = useState("");
	useEffect(() => {
		let alive = true;
		setDocText(null);
		readArtifact(goalDocRel(version))
			.then((text) => {
				if (!alive) return;
				setDocText(text);
				setItems(readGoalDoc(text));
			})
			.catch(() => {
				// 读不出来 ⇒ 当作没有（不抛、不打断）。人在这一屏仍能点「重写这几条」。
				if (alive) setDocText("");
			});
		return () => { alive = false; };
	}, [version, readArtifact]);

	const setAt = (index, value) => setItems((prev) => prev.map((item, i) => (i === index ? value : item)));
	const removeAt = (index) => setItems((prev) => prev.filter((_, i) => i !== index));
	const addOne = () => setItems((prev) => [...prev, ""]);
	const cleaned = items.map((item) => String(item ?? "").trim()).filter((item) => item !== "");

	const rows = items.map((item, index) =>
		createElement(
			"div",
			{ key: `goal-${index}`, style: { display: "flex", gap: "6px", alignItems: "center", margin: "4px 0" } },
			createElement("span", { style: { opacity: 0.6, minWidth: "18px" } }, `${index + 1}.`),
			createElement("input", {
				type: "text",
				value: item,
				disabled: busy,
				"data-goal-item": String(index + 1),
				// 置灰跟着**它自己那个** disabled 表达式走（逐字同一个 `busy`）：
				// 与同族（`gold-table.js` 的 `S.disabled({ ...S.input, … }, busy || writing)`）同一口径。
				style: S.disabled({ flex: "1 1 auto", minWidth: "120px", padding: "4px 6px" }, busy),
				onChange: (event) => setAt(index, event.target.value),
			}),
			createElement(
				"button",
				{
					type: "button",
					style: S.disabled({ ...S.smallLink, textDecoration: "none" }, busy),
					disabled: busy,
					"data-goal-remove": String(index + 1),
					onClick: () => removeAt(index),
				},
				"🗑 删掉这条",
			),
		),
	);
	// 票 `ui-display-redesign/17`（收口 review S4）：事实句只在**读盘落定且读成功**之后印——
	// `docText === null` ＝ 还在读（正文那句「正在读那几条目标……」）；`docText === ""` ＝ 读不到
	// （正文走空态句）。两种「还没有读数」都不许被印成「0 条」（修前 `items=[]` 被当成真读数）。
	const headFacts = docText === null || docText === "" ? undefined : goalConfirmFacts(cleaned.length);

	return createElement(
		"div",
		{ style: S.focus, "data-goal-card": "1", "data-goal-version": String(version) },
		// ── 卡头：问句（存量句）＋事实句（条数现算、后果并进后半句）────────────────────────
		createElement(CardHead, {
			question: createElement(
				"strong",
				{ style: CARD_HEAD_QUESTION_STYLE },
				GOAL_CONFIRM_QUESTION,
			),
			facts: headFacts,
		}),
		// ── 说明句（存量句 − 机器路径半句）────────────────────────────────────────────────
		createElement(
			"p",
			{ style: { margin: "6px 0", fontSize: "12px", opacity: 0.8 } },
			GOAL_CARD_NOTE,
		),
		// ── 首屏必须看见的那一块：那几条（逐条可改／删／加）────────────────────────────────
		docText === null
			? createElement("p", { style: { margin: "6px 0", opacity: 0.8 } }, "正在读那几条目标……")
			: createElement(
					"div",
					{ style: { ...S.card, marginBottom: "10px" }, "data-goal-items": "1" },
					createElement(
						"p",
						{ style: { margin: "0 0 6px", fontWeight: 600 } },
						`学完要能做到什么（${cleaned.length} 条）——逐条可改、可删，也可以自己加一条：`,
					),
					rows.length === 0
						? createElement(
								"p",
								{ style: { margin: "4px 0", color: "var(--dsw-alias-state-error-primary)" } },
								GOAL_EMPTY_NOTE,
							)
						: rows,
					createElement(
						"button",
						{
							type: "button",
							style: S.disabled({ ...S.smallLink, textDecoration: "none" }, busy),
							disabled: busy,
							"data-goal-add": "1",
							onClick: addOne,
						},
						"➕ 加一条",
					),
				),
		// ── 两颗键（整批一次过；卡底）────────────────────────────────────────────────────
		// ⚠️ 票 `ui-display-redesign/04`：原先这两颗键紧上方那段通过后果句**已删**（后果并进卡头事实句）。
		// 契约里的 `GOAL_CONFIRM_PASS_EFFECT` 文本保留、只是不再由本卡渲染——⛔ 别搬回来。
		createElement(
			"div",
			{ style: { display: "flex", gap: "8px", flexWrap: "wrap" } },
			createElement(
				"button",
				{
					style: S.disabled(S.bigBtn(true), busy || cleaned.length === 0),
					disabled: busy || cleaned.length === 0,
					"data-goal-accept": "1",
					onClick: () => onDecide(true, cleaned, ""),
				},
				GOAL_CONFIRM_ACCEPT_LABEL,
			),
			createElement(
				"button",
				{
					style: S.disabled({
						...S.bigBtn(true),
						background: "transparent",
						color: "var(--dsw-alias-state-error-primary)",
					}, busy),
					disabled: busy,
					"data-goal-rewrite": "1",
					onClick: () => setRewriting(true),
				},
				GOAL_CONFIRM_REWRITE_LABEL,
			),
		),
		// 驳回那一支：**整份**重拟（⛔ 不逐条否）——所以这里只有一句话 ＋ 可选的一句意见。
		rewriting
			? createElement(
					"div",
					{
						style: {
							marginTop: "10px",
							borderTop: "1px dashed var(--dsw-alias-border-l2)",
							paddingTop: "8px",
						},
						"data-goal-rewrite-note": "1",
					},
					createElement("p", { style: { margin: "0 0 6px", fontWeight: 600 } }, GOAL_REWRITE_EFFECT),
					createElement("input", {
						type: "text",
						value: note,
						disabled: busy,
						// 同一口径：这一处的置灰是它自己那个 `busy` 的函数。
						style: S.disabled({ width: "100%", padding: "4px 6px" }, busy),
						onChange: (event) => setNote(event.target.value),
					}),
					createElement(
						"div",
						{ style: { display: "flex", gap: "8px", marginTop: "6px" } },
						createElement(
							"button",
							{
								style: S.disabled(S.bigBtn(true), busy),
								disabled: busy,
								"data-goal-rewrite-send": "1",
								onClick: () => onDecide(false, cleaned, note.trim()),
							},
							"就这么重写",
						),
						createElement(
							"button",
							{ style: S.disabled({ ...S.smallLink, textDecoration: "none" }, busy), disabled: busy, onClick: () => setRewriting(false) },
							"取消",
						),
					),
				)
			: null,
	);
}
