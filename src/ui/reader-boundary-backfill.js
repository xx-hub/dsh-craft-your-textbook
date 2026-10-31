/**
 * 老书维护通路（票 `reader-cognition-boundary-build/10`）：阶段 2 那一屏那颗
 * 「补一份读者边界」的键 ＋ 补的界面。
 *
 * ## 它是什么（这一票只做：入口 ＋ 可见性 ＋ 能划 ＋ 那句话）
 *
 * 机制一个字都不在这里：划卡仍走**既有**那条第三条「意见」通路（`graph-opinion`，写侧在
 * `src/workflow/actions/chapters.js`），落**同一份** `工作区/knowledge-map-exclusions.json`；
 * 图仍是既有那块 `KnowledgeGraphView`（`src/ui/knowledge-graph-map.js`，下沿划子递 `已经会`、
 * 框里那颗 `🗑` 递 `不需要`）。本模块只回答四件：
 *   ① 这颗键**什么时候看得见**（`readerBoundaryBackfillEntry`：三条判据，见下）；
 *   ② 界面必须**如实**写出的那句核心承诺（`READER_BOUNDARY_BACKFILL_PROMISE` 逐字）；
 *   ③ 补过之后那块上的**独立抬头记号**（`READER_BOUNDARY_BACKFILL_NOTE`——⛔ 与补图不共用）；
 *   ④ 按下去之后把图摆出来（⛔ 不是只加一句文案）。
 *
 * ## 可见性（细档）：`exploreConfirmed ∧ 非演示 ∧ 还有边界读者`——**判不出来就不摆**
 *
 * 「还有边界读者」＝读这份边界的工序**还有的跑**（spec §4.6 的细档）：读它的是**站 3／4／5 的
 * 交办件 ＋ 合并前那道跨章审计** ⇒ **还有章没写、或还有章没过跨章审计**。
 *
 * 三个读数各管一段（全部来自 `/textbook/events` 与 `/textbook/process` 的回包，⛔ 不新落读数）：
 *   · **站 3 交办跑没跑**：`meta.outline.chapters`（有章节安排 ⇒ 站 3 交工过）；
 *   · **章写没写**：`chapterStatus[]`（服务端按盘上产物的 `written`，与章节卡徽章同一份判据）；
 *   · **跨章审计过没过**：进程分段里 `merge` 那一段 `status === 'done'`（合并成书过了 ⇒ 审计过了；
 *     那一段的 `done` 判据是 `工作区/book.md` 在盘上，见 `src/workflow.js` 的 `buildProcessMap`）。
 *
 * ⚠️ **它是入口不是闸门**。漏摆只是少一个入口（新书那条正路照旧）；**多摆才是承诺过度**
 * （书已经交付、边界不再有读者，摆出来就是一句空头诺言）⇒ 任何一段读数读不到就**不摆**。
 *
 * ## 与「补一份知识点图」两块的关系（⛔ 别混成一个）
 *
 * 两者同屏、相邻，但**不是一件事**：补图那块（`src/ui/knowledge-graph-backfill.js`）是**只读**
 * 的图；这一块是**能划**的边界入口，落的是剔除记录、记的是另一笔账
 * （`meta.readerBoundaryBackfill`）。两句抬头记号也各是各的。
 *
 * ⚠️ **一处要跟的口径**（票面点名）：补图那块给「老书维护只读」的理由是「划卡＝改**前置**、
 * 后置全得重做」；本票按票 `06` 的裁决读：加的是**一条剔除记录**，不触发重做、只影响**还没跑**
 * 的工序 ⇒ 两处**不同轴**。本模块的文件头（上面那段＋这里）把那件事分开说；补图那个文件的
 * 文件头另加了一行 ⚠️ 指针（⛔ 没把两者合成一句）。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（写判据时那条纪律）
 *
 * ① 可见性读的是**回包里的 `meta` ＋ 章节进度 ＋ 进程分段**——盘上真实的章产物、`book.md`、
 *    `audit-cross.md` 在不在，这里都看不见；「还有边界读者」那半只按这三份读数断。
 * ② **不证明「薄」**：它只把入口摆出来，书会不会因此变薄归越界审计与确认点那两处。
 * ③ **不证明好看**：位置、换行、对比度一个都不量（`react-test-renderer` 没有排版引擎）。
 */
import { createElement, useState } from "react";
import { exclusionKeysOf, liveExclusionsOf, parseExclusionsDocument } from "../domain-rules.js";
// 票 `ui-workflow-seam/04`：读侧改从 `src/` 根级窄门取（界面⛔ 不再知道 `workflow/` 的内部路径）。
// ⚠️ 那扇门**只给读侧**——写侧（`applyReaderBoundaryBackfillAccount`）与三个 meta 键常量不上根级，
// 界面这一侧拿不到（判据钉着根级门的导出面里没有它们）。
import { readerBoundaryBackfillActive } from "../reader-boundary-backfill-read.js";
import { KnowledgeGraphView } from "./knowledge-graph-map.js";
import { parseKnowledgeMap } from "./machine-product-folds.js";
import { S } from "./styles.js";

/** 那颗键的字。一颗键，就这一句。 */
export const READER_BOUNDARY_BACKFILL_KEY_TEXT = "补一份读者边界";

/**
 * 界面必须**如实**写出的那句核心承诺（票面逐字，也是这一票的界）：
 * 划卡只对**还没跑**的工序生效；已经写出来／已经交付的章一个字节都不动。
 */
export const READER_BOUNDARY_BACKFILL_PROMISE = "只对还没写的章生效；已写／已交付的章一个字没动";

/**
 * 「这份边界是补的」——**独立**抬头记号（⛔ 与补图那句 `GRAPH_BACKFILL_NOTE` 不共用）。
 * 只在**这笔账在场且未撤回**时出现（`readerBoundaryBackfillActive`）。
 */
export const READER_BOUNDARY_BACKFILL_NOTE =
	"这份读者边界是补的：按你在图上逐卡划的进同一份剔除记录（只影响还没跑的工序）。";

/** 看不见这颗键的五种处境（人读理由；判据只认这几档，⛔ 不给「随便一个字符串」留口）。 */
export const READER_BOUNDARY_BACKFILL_HIDDEN = Object.freeze({
	exploring: "这本书还没过「AI 挑出来的重点」那一步 ⇒ 走到站 2 时划子与问卷本来就在那张卡上",
	graphMissing: "盘上还没有知识点图 ⇒ 没有一张卡可划（先补一份知识点图）",
	demo: "演示书补不了（它那条流程是录好的） ⇒ 不提示",
	noReaders: "读这份边界的工序都已经跑完（章写完了、最后那道跨章检查也过了） ⇒ 补了零效果",
	unknown: "章进度读不到 ⇒ 判不出来，宁可不摆（它是入口不是闸门）",
});

/**
 * 「还有边界读者」没有：`true`＝还有／`false`＝没有／`null`＝**判不出来**（调用方据此不摆）。
 *
 * 三个读数的分工与窄处见文件头。⚠️ 判据顺序有意：先判「肯定还有」（站 3 没交工／还有章没写），
 * 再判「肯定没有」，最后剩下的那一档才需要跨章审计那一位；那一位**缺**（老宿主的分段里没有
 * `merge`）⇒ `null`，⛔ 不猜。
 *
 * @param {object} input
 * @param {object|null} input.meta 书级 `meta`（`status`／`delivered`／`finalApprovedAt`／`outline`）
 * @param {object[]|null} input.chapterStatus `/textbook/events` 回包里的章节进度（每章 `written`）
 * @param {object[]|null} input.processSegs `/textbook/process` 回包里的分段（找 `key === 'merge'`）
 * @returns {boolean|null}
 */
export function readerBoundaryReadersRemain({ meta, chapterStatus, processSegs } = {}) {
	if (meta === null || typeof meta !== "object") return null;
	// 已交付 ⇒ 没有读者（`finalApprovedAt` 是认可那一跳的账；`delivered` 是状态机那一档）。
	if (meta.status === "delivered" || (meta.finalApprovedAt !== undefined && meta.finalApprovedAt !== null)) {
		return false;
	}
	const chapters = Array.isArray(meta.outline?.chapters) ? meta.outline.chapters : null;
	// 站 3 的交办件还没跑（没有章节安排）⇒ 后面还有读者（站 3／4／5 那几份交办都会读边界）。
	if (chapters === null || chapters.length === 0) return true;
	// 章进度读不到 ⇒ 判不出来（⛔ 不猜「都写完了」）。
	if (!Array.isArray(chapterStatus) || chapterStatus.length === 0) return null;
	// 还有章没写 ⇒ 站 5 的交办件还没跑完 ⇒ 还有读者。
	if (chapterStatus.some((one) => one === null || typeof one !== "object" || one.written !== true)) return true;
	const segments = Array.isArray(processSegs) ? processSegs : [];
	const merge = segments.find((seg) => seg !== null && typeof seg === "object" && seg.key === "merge");
	// 章都写了、合并成书那一段读不到（老宿主）⇒ 跨章审计过没过判不出来。
	if (merge === undefined) return null;
	// 合并成书过了 ⇒ 跨章审计过了 ⇒ 没有读者；还没过 ⇒ 那一道审计还没跑 ⇒ 还有。
	return merge.status !== "done";
}

/**
 * 这颗键**此刻该不该看得见**＋**为什么**（三条判据，缺一不可；⚠️ 判不出来就不摆）：
 *
 *   ① `exploreConfirmed === true`（过了站 2；站 2 那张卡上有它自己的划子与问卷）**∧**
 *   ② 合并件里**有图**（两个图键都在——没有卡就没有「逐卡划」这回事）**∧**
 *   ③ **非演示书**（`meta.demo !== true`）**∧**
 *   ④ **还有边界读者**（`readerBoundaryReadersRemain` 返回 `true`）。
 *
 * ⚠️ 第②条不是票面那三条之外的「新决定」，是「补＝图上逐卡划」这个动作的**必要条件**：
 * 图不在时这颗键按下去没有一张卡可划（那时该先按隔壁那颗「补一份知识点图」）。
 *
 * @param {{meta?: object|null, knowledgeMapText?: string|null, chapterStatus?: object[]|null,
 *   processSegs?: object[]|null}} input
 * @returns {{show: boolean, reason: string|null}} `reason` 只在 `show === false` 时有值，
 *   取 `READER_BOUNDARY_BACKFILL_HIDDEN` 的键之一。
 */
export function readerBoundaryBackfillEntry({ meta, knowledgeMapText, chapterStatus, processSegs } = {}) {
	if (meta === null || typeof meta !== "object") return { show: false, reason: "unknown" };
	if (meta.exploreConfirmed !== true) return { show: false, reason: "exploring" };
	if (graphOfText(knowledgeMapText) === null) return { show: false, reason: "graphMissing" };
	if (meta.demo === true) return { show: false, reason: "demo" };
	const remain = readerBoundaryReadersRemain({ meta, chapterStatus, processSegs });
	if (remain === true) return { show: true, reason: null };
	return { show: false, reason: remain === false ? "noReaders" : "unknown" };
}

/**
 * 合并件里那一份图（`{cards, edges}`）或 `null`——**两个图键都在才算图**。
 * ⚠️ 与补图那块读的是同一个口径（`parseKnowledgeMap` 的 `graph`），本模块不另写一份。
 * @param {string|null} knowledgeMapText
 * @returns {{cards: object[], edges: object[]}|null}
 */
export function graphOfText(knowledgeMapText) {
	const parsed = parseKnowledgeMap(typeof knowledgeMapText === "string" ? knowledgeMapText : "");
	return parsed !== null && parsed.graph !== null ? parsed.graph : null;
}

/**
 * 补一份读者边界那一块（摆**在老书维护那两行下面**，与补图那块并列、⛔ 不混成一个）。
 *
 * 三态：
 *   · 看不见 ⇒ 返回 `null`（那颗键与整块都不出现）；
 *   · 看得见没按 ⇒ 一颗键 ＋ 那句核心承诺（**逐字**）；
 *   · 按下去 ⇒ 图本体打开（`KnowledgeGraphView`——下沿划子递 `已经会`、框里那颗 `🗑` 递
 *     `不需要`，两条都走同一个 `onVerdict` 到壳的 `graph-opinion`）。
 * 另外：那笔账在场且未撤回时，块上多一句**独立**抬头记号。
 *
 * @param {object} props
 * @param {object|null} props.meta 书级 `meta`（可见性三条 ＋ 那笔账）
 * @param {string|null} props.knowledgeMapText 合并件正文（图从它读）
 * @param {string|null} props.knowledgeMapExclusions 剔除记录原文（图上「已否」那一档按它画）
 * @param {object[]|null} props.chapterStatus 章节进度（可见性细档的一半）
 * @param {object[]|null} props.processSegs 进程分段（可见性细档的另一半）
 * @param {string[]} [props.graphDropped] 本会话刚划下去的那一段（与盘上那份**并起来**画）
 * @param {(key: string, verdict: string, reason?: string) => Promise<boolean>} [props.onVerdict]
 *   壳里那条「发意见并刷新」的漏斗（`graph-opinion`）；⛔ 本模块自己不 fetch、不知道动作怎么发。
 */
export function ReaderBoundaryBackfillBlock(props) {
	const [open, setOpen] = useState(false);
	const entry = readerBoundaryBackfillEntry({
		meta: props.meta,
		knowledgeMapText: props.knowledgeMapText,
		chapterStatus: props.chapterStatus,
		processSegs: props.processSegs,
	});
	if (!entry.show) return null;

	const graph = graphOfText(props.knowledgeMapText);
	const exclusions = parseExclusionsDocument(props.knowledgeMapExclusions);
	// 图上「已否」那一档 ＝ **盘上的史实**（刷新／切书之后仍在）∪ 本会话刚划下去的那一段。
	// 与两张确认卡同一对纯函数（「一处口径」的那份集合），⛔ 这里不另写一份过滤。
	const live = liveExclusionsOf(exclusions.items, graph === null ? [] : graph.cards);
	const dropped = [
		...new Set([
			...exclusionKeysOf({ items: live.live }),
			...(Array.isArray(props.graphDropped) ? props.graphDropped : []),
		]),
	];
	const active = readerBoundaryBackfillActive(props.meta);

	return createElement(
		"div",
		{ "data-rbb-block": "1", style: { marginTop: "6px" } },
		createElement(
			"div",
			{ style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } },
			createElement(
				"button",
				{
					type: "button",
					"data-rbb-key": "1",
					"aria-expanded": open,
					style: S.smallLink,
					onClick: () => setOpen((value) => !value),
				},
				open ? "收起图" : READER_BOUNDARY_BACKFILL_KEY_TEXT,
			),
		),
		// 那句核心承诺（票面逐字）——界在这儿：只对还没跑的工序生效。
		createElement(
			"p",
			{ "data-rbb-promise": "1", style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.85 } },
			READER_BOUNDARY_BACKFILL_PROMISE,
		),
		// 补过之后的**独立**抬头记号（账在场且未撤回才出现；⛔ 与补图那句不共用）。
		active
			? createElement(
					"div",
					{ "data-rbb-note": "1", style: { marginTop: "4px", fontSize: "12px", opacity: 0.85 } },
					READER_BOUNDARY_BACKFILL_NOTE,
				)
			: null,
		open && graph !== null
			? createElement(KnowledgeGraphView, {
					cards: graph.cards,
					edges: graph.edges,
					dropped,
					onVerdict: props.onVerdict,
				})
			: null,
	);
}
