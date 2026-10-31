/**
 * 卡头行小件：每一屏卡头那句「**这一屏要你定什么**」的问句，加它下面一句事实句。
 *
 * ## API
 *
 * ```js
 * createElement(CardHead, {
 *   question: createElement("strong", { style: CARD_HEAD_QUESTION_STYLE }, "…问句…"),
 *   facts: "…事实句…",
 * })
 * ```
 *
 * - `question`：**已经构造好的问句节点**（一行）。⛔ 不要只传字符串让本文件代造那个 `<strong>`——
 *   问句就是这张卡在屏上的**标题**，字面量必须留在**卡片自己的文件**里。理由是仓库里一条既有契约：
 *   `test-context-vocabulary.mjs` 的「焦点区卡标题」取证面只读 `src/ui/**` 里
 *   `createElement("strong", …)` 调用点上的字面量（或同文件的 `const` 字面量），而造书模式人设的
 *   「界面状态对照表」逐字引着这些标题（`看到"…"` 那一族断言）。问句节点由本文件代造时，
 *   取证面看不到它 ⇒ 人设里那句逐字引用会红成「认一张盘上没有的卡」。
 * - `lead`（**可选**）：夹在问句与事实句之间的一个**已经构造好的节点**（一行）。站 2
 *   （票 `ui-display-redesign/03`）的块序是「卡头问句 → 里程碑标题 → 卡头事实句」，那个存量
 *   里程碑标题（`🔍 材料读完了！`，6 处判据锚在它上面）就住这一格；不传它时行为与票 01 那一版
 *   逐字相同（问句一行＋事实句一行）。
 * - `facts`：事实句**字符串**（一行）——字号/间距/颜色归本文件。
 *
 * 字号/间距/颜色只在下方的冻结常量里定义一次；站 0（无书建书）先用，**后续 02–10 的决策站复用同一件**
 * （一屏一个问题：问句归卡头，⛔ 不重复印在状态条里，见 spec §1「问句只出现一次」）。
 *
 * 视觉取自 A 版定稿（`.scratch/ui-display-redesign/prototype/index.html` 的 `.qhead`）：
 * 问句 16px/700，事实句 12px/0.8，行下一条虚线分隔卡头与卡身。
 *
 * ⚠️ 只定义展示：本文件不发动作、不读状态，也**不**进 `decisionOf`（那是 8 个决策站既有问句的
 * 唯一出口；屏级问句——站 0、站 1、交付——不属于它）。
 */
import { createElement } from "react";

/** 问句那一行（卡标题那一档）。⛔ 各卡不要就地另写一份字号/颜色。 */
export const CARD_HEAD_QUESTION_STYLE = Object.freeze({
	fontSize: "16px",
	fontWeight: 700,
	lineHeight: 1.35,
});

/** 事实句那一行。⛔ 各卡不要就地另写一份字号/颜色。 */
export const CARD_HEAD_FACT_STYLE = Object.freeze({
	margin: "4px 0 0",
	fontSize: "12px",
	opacity: 0.8,
});

/** 卡头整行：与卡身之间一条虚线，把「这一屏要定什么」与「具体控件」分开。 */
export const CARD_HEAD_ROW_STYLE = Object.freeze({
	margin: "0 0 10px",
	paddingBottom: "8px",
	borderBottom: "1px dashed var(--dsw-alias-border-l2)",
});

export function CardHead(props) {
	const { question, lead, facts } = props;
	return createElement(
		"div",
		{ style: CARD_HEAD_ROW_STYLE },
		question,
		lead ?? null,
		// 票 `ui-display-redesign/17`（收口 review S4）：事实句**可选**——读盘期／读失败时
		// 「还没有读数」不该被印成一句带数的假事实（站 3 修前会印「0 条」）。空串也算没有。
		typeof facts === "string" && facts.trim() !== ""
			? createElement("p", { style: CARD_HEAD_FACT_STYLE }, facts)
			: null,
	);
}
