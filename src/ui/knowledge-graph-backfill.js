/**
 * 老书那颗「补一份知识点图」的键（票 `knowledge-graph-build/12`）。
 *
 * ## 它是什么（本票只做三件：**入口 ＋ 可见性 ＋ 只读呈现**）
 *
 * 机制一个字都不在这里——读细目／回原文取行段／重拼／形状闸全在
 * `src/workflow/knowledge-graph-build.js`（票 04 的 `applyKnowledgeGraphBackfill`）。本模块只回答三件：
 *   ① 这颗键**什么时候看得见**（三条判据，见 `graphBackfillEntry`）；
 *   ② 按下去之后**回执**说什么（一句人话，⛔ 不印机器读数）；
 *   ③ 补出来的图**怎么摆**（复用票 07 的 `KnowledgeGraphBlock`——只读、三态／前沿／线型照那一套，
 *      ⛔ 一个动作键都不摆）。
 *
 * ## 为什么判定读的是**合并件里的图键**，不是 `meta`
 *
 * 票 04 的约定：判「图在不在盘上」一律读合并件里的 `cards`／`edges`——`meta` 只记「这份图是补的」，
 * 而且撤回之后 `meta` 上那一笔（`withdrawnAt`）**还留着**。⇒ 这里走票 07 的
 * `parseKnowledgeMap(...).graph`（**两个图键都在**才算图），⛔ 不自己 `JSON.parse`。
 *
 * ## 为什么老书这条维护动作上**不改前置**（那些动作键为什么不摆）
 *
 * 在图上划掉一张卡＝改**前置**，而后置（已写的章、章节方案）全都得重做——那属于**重开一本书**
 * 的流程，不是老书的一次维护。⇒ 这一块是**只读**的：键只有一颗「补一份知识点图」，
 * 图本身不带任何动作（推进、划掉、重排一个都没有）。
 *
 * ## ⚠️ 一处**不同轴**的邻族（别把两句合成一句）
 *
 * 上面那句只读的理由是「**改图** ⇒ 改前置 ⇒ 后置全得重做」。邻族 `reader-boundary-backfill`
 * （票 `reader-cognition-boundary-build/10`）在老书同一屏上摆的是**另一件事**：它往
 * `工作区/knowledge-map-exclusions.json` **加一条剔除记录**，⛔ 不改前置、⛔ 不改图、⛔ 不改闸门
 * ——只影响**还没跑**的工序（站 3／4／5 交办件与合并前跨章审计），**已写／已交付的章一个字没动**。
 * ⇒ 两处**不是同一条轴**：那边禁止的是「改图」，这边允许的是「补记录」；两块在屏上**并列而不同物**，
 * 各有独立抬头记号与独立 `meta` 账（`meta.readerBoundaryBackfill`，与下面这个键不共用）。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（写判据时那条纪律）
 *
 * ① 它只看**这一本书的 `meta` ＋ 合并件正文**（两者都来自 `/textbook/events` 那一份回包）：
 *    盘上真正的图键长什么样、`landingOfBook` 判出来是哪一档（有没有分片）、转换稿在不在，
 *    这里**都看不见**——所以「按下去图落不落得下来」由动作层回答（`workflow/actions/chapters.js`
 *    那个 case），界面**一句都不预告**（⛔ 不替机制报数）。
 * ② 三态／前沿队列／边的线型**不在这里**（票 07 的 `knowledge-graph-map.js`）：本模块只决定
 *    「摆不摆、抬头那句话说什么」。它也因此不认识任何一张卡的名字。
 * ③ **零源书**（一条知识点都没有）今天补不出图——形状闸按空扫守卫判 `cards-empty`（票 04 实测，
 *    `map.md` §15①）。本模块**不为它开口子**：那颗键照旧按这三条看得见，按下去由动作层如实回
 *    一句「这本书还没有可用的重点」。决定与理由写在票 12 的 `## Answer`。
 */
import { createElement, useState } from "react";
import { parseKnowledgeMap } from "./machine-product-folds.js";
import { KnowledgeGraphBlock } from "./knowledge-graph-map.js";
import { S } from "./styles.js";

/**
 * 这颗键发出去的那个名字**不住在本模块**（收口 review 的 F5）。名字今天有三处字面量：
 *   ① 契约面动作目录 `src/contract-actions.js`——**身份的唯一出处**；
 *   ② 壳 `src/client-entry.js` 里那一个 `postAction({ action: … })`（这颗键**唯一的出口**）；
 *   ③ 动作层 `src/workflow/actions/chapters.js` 里那个 `case`。
 * 运行时那一跳由漏斗过 `uiCallable` 的门兜底：名字与目录对不上会**响着失败**，不会静默发出去。
 * ⚠️ 此前本模块导出一个 `GRAPH_BACKFILL_ACTION` 常量、注释自称「身份的唯一出处＝契约面动作目录」，
 *    可**全仓没有一处 import 它**（真正发出去的是壳里那个裸字面量）⇒ 自称 ≠ 实现，那两行已删。
 */

/** 键上的字。一颗键，就这一句。 */
export const GRAPH_BACKFILL_KEY_TEXT = "补一份知识点图";

/**
 * 「这份图是补的」——**只留这一句**（票面逐字给的那句），只印在图那一块的抬头。
 * ⛔ 与邻族「边界是补的」不共用记号（那是另一份产物）；⛔ 合并件里一个字节都没有。
 */
export const GRAPH_BACKFILL_NOTE = "按已有细目＋回原文补出来的；已写／已交付的章一个字没动";

/** 补完那一刻的回执：**一句人话**（⛔ 没有张数／条数／路径／指纹这些机器读数）。 */
export const GRAPH_BACKFILL_RECEIPT = "✅ 补好了。这份图只读——看得到三态与箭头，改不了；要改前置，得重开一本书。";

/** 没补成那一刻的回执：两件事实（没补出来 ＋ 原来那些东西没动），原因由动作层那条提示说。 */
export const GRAPH_BACKFILL_FAILED = "⚠️ 没能补出图。原来那些东西一个字没动。";

/** 看不见这颗键的四种处境（人读理由；判据只认这几档，⛔ 不给「随便一个字符串」留口）。 */
export const GRAPH_BACKFILL_HIDDEN = Object.freeze({
	exploring: "这本书还没交出过材料报告 ⇒ 还不算老书",
	graphPresent: "合并件里已经有图了 ⇒ 不用补",
	demo: "演示书补不了（它那条流程是录好的） ⇒ 不提示",
	noMergedMap: "盘上还没有合并件 ⇒ 补图没有落点",
});

/**
 * 这颗键**此刻该不该看得见**＋**为什么**（三条判据，缺一不可；票面 B 段逐字）：
 *
 *   ① `exploreConfirmed === true`（已交出过材料报告 ⇒ 合并件在盘）**∧**
 *   ② 合并件**缺图键**（`cards`／`edges` 两个都不在，或只有一个——`graph === null`）**∧**
 *   ③ **非演示书**（`meta.demo !== true`）。
 *
 * ⚠️ 正在爬阶段 2、还没交过报告的书**不算老书**（第①条挡住）；**图已在 ⇒ 看不见**（第②条挡住）；
 * **演示书补不了**（第③条挡住，见 `GRAPH_BACKFILL_HIDDEN.demo`）。
 *
 * @param {{meta?: object|null, knowledgeMapText?: string|null}} input `meta` 与合并件正文都来自
 *   `/textbook/events` 那一份回包（壳原样递给卡）。
 * @returns {{show: boolean, reason: string|null}} `reason` 只在 `show === false` 时有值，取
 *   `GRAPH_BACKFILL_HIDDEN` 的键之一。
 */
export function graphBackfillEntry({ meta, knowledgeMapText } = {}) {
	const text = typeof knowledgeMapText === "string" && knowledgeMapText !== "" ? knowledgeMapText : null;
	if (text === null) return { show: false, reason: "noMergedMap" };
	if (meta?.exploreConfirmed !== true) return { show: false, reason: "exploring" };
	if (graphOf(text) !== null) return { show: false, reason: "graphPresent" };
	if (meta?.demo === true) return { show: false, reason: "demo" };
	return { show: true, reason: null };
}

/**
 * 合并件里那一份图（`{cards, edges}`）或 `null`——**两个图键都在才算图**（票 07 的口径，不另写一份）。
 * @param {string|null} knowledgeMapText
 * @returns {{cards: object[], edges: object[]}|null}
 */
export function graphOf(knowledgeMapText) {
	const parsed = parseKnowledgeMap(typeof knowledgeMapText === "string" ? knowledgeMapText : "");
	return parsed !== null && parsed.graph !== null ? parsed.graph : null;
}

/**
 * 这份图**是不是补的**（决定 `GRAPH_BACKFILL_NOTE` 摆不摆）。
 *
 * `meta.knowledgeGraphBackfill` 在场 ＝ 这台机器为这本书补过图（票 04 落的账）；
 * `withdrawnAt` 在场 ＝ **那一份已经撤回**（成功再补一次会清掉这一笔）⇒ 这时不说是补的。
 * ⚠️ 它只回答「那句话摆不摆」；「图在不在」照旧读合并件（见 `graphOf`）。
 */
export function graphIsBackfilled(meta) {
	const backfill = meta?.knowledgeGraphBackfill;
	if (backfill === null || typeof backfill !== "object") return false;
	return backfill.withdrawnAt === undefined || backfill.withdrawnAt === null;
}

/**
 * 那颗键 ＋ 补完那一刻的回执（**长在「AI 挑出来的重点」那一行里**，与抬头同一行）。
 *
 * 三态：`idle`（看得见键）／`working`（按下去、动作在飞）／`done`｜`failed`（回执）。
 * ⚠️ **看不见时它仍然挂在树上**（返回 `null`）——这样按下去那一趟的状态不会因为
 * 「图补好了、键该消失了」而被卸载丢掉（回执要留到这一屏翻过去为止）。
 *
 * @param {object} props
 * @param {object|null} props.meta 书级 `meta`（判可见性三条）
 * @param {string|null} props.knowledgeMapText 合并件正文
 * @param {(body?: object) => Promise<object|null>} [props.onBackfill] 壳里那个「发动作并刷新」的漏斗
 *   （`postAction`）；⛔ 本模块自己不 fetch、不知道动作怎么发。
 */
export function KnowledgeGraphBackfillKey(props) {
	const [state, setState] = useState("idle");
	const entry = graphBackfillEntry({ meta: props.meta, knowledgeMapText: props.knowledgeMapText });
	const receipt =
		state === "done" ? GRAPH_BACKFILL_RECEIPT : state === "failed" ? GRAPH_BACKFILL_FAILED : null;
	if (!entry.show && receipt === null) return null;

	const press = () => {
		if (state === "working") return;
		setState("working");
		// 「这一趟成没成」由动作层回答（⛔ 界面不预告、不猜）：回包为 null＝没成（那一路的
		// 原因已经由壳的错误条说过一次，这里只补一句「没补出来 ＋ 原来那些东西没动」）。
		Promise.resolve()
			.then(() => (typeof props.onBackfill === "function" ? props.onBackfill({}) : null))
			.then(
				(json) => setState(json === null ? "failed" : "done"),
				() => setState("failed"),
			);
	};

	return createElement(
		"span",
		{ style: { display: "inline-flex", alignItems: "center", gap: "8px" }, "data-kgb-key-row": "1" },
		entry.show
			? createElement(
					"button",
					{
						style: S.disabled(S.smallLink, state === "working"),
						onClick: press,
						disabled: state === "working",
						"data-kgb-key": "1",
					},
					state === "working" ? "正在补…" : GRAPH_BACKFILL_KEY_TEXT,
				)
			: null,
		receipt === null
			? null
			: createElement("span", { style: { fontSize: "12px", opacity: 0.85 }, "data-kgb-receipt": "1" }, receipt),
	);
}

/**
 * 图那一块（**补出来的那份图的抬头 ＋ 只读图**）。
 *
 * 摆的条件**只有一条**：这台机器为这本书补过图（`graphIsBackfilled`）**且**合并件里图键都在。
 * ⇒ 新书的图不在这里出第二份（它归票 07 那一块自己的屏）；老书补完图之后，这一屏也才看得到它。
 *
 * ⚠️ 图上**没有任何动作键**：`KnowledgeGraphBlock` 只吃数据（`cards`／`edges`／计数／合并件），
 * 一个回调都不接。三态与措辞以票 07 为准（要讲／现在轮到／已否），本模块一个字都不重写。
 *
 * @param {object} props
 * @param {object|null} props.meta
 * @param {string|null} props.knowledgeMapText
 */
export function KnowledgeGraphBackfillBody(props) {
	const graph = graphOf(props.knowledgeMapText);
	if (graph === null || !graphIsBackfilled(props.meta)) return null;
	const parsed = parseKnowledgeMap(props.knowledgeMapText) ?? { kps: [], chapters: [], materials: [] };
	return createElement(
		"div",
		{ style: { marginTop: "6px" }, "data-kgb-block": "1" },
		createElement(
			"div",
			{ style: { fontSize: "12px", opacity: 0.85 }, "data-kgb-note": "1" },
			GRAPH_BACKFILL_NOTE,
		),
		// 只读那一块照票 07 原样复用：`dropped` 不给（老书这条维护动作上不改前置）。
		createElement(KnowledgeGraphBlock, {
			cards: graph.cards,
			edges: graph.edges,
			knowledgePointCount: parsed.kps.length,
			chapterCount: parsed.chapters.length,
			merged: {
				knowledgePoints: parsed.kps,
				materials: parsed.materials,
				chapterSuggestion: parsed.chapters,
				cards: graph.cards,
				edges: graph.edges,
			},
		}),
	);
}
