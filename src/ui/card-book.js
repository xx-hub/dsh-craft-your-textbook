/**
 * 造书工作台 · 书级袋子的**声明与构造**（票 `gallery-realign/01`）
 *
 * 这个 module 回答一句话：**「递给每一张卡的那本书，有哪些键？」**
 * 答案**只此一处**——`CARD_BOOK_GROUPS`（分组的键名表，冻结）。生产壳
 * （`src/client-entry.js`）与画廊的下钻适配器（`dev/gallery/cards.js`）都经
 * `createCardBook(值来源)` 造那个袋子。
 * ⚠️ 票 `depth-round-3/02` 起：**值**那一侧由旁边那个 module（`src/ui/card-book-derive.js` 的
 * `deriveCardBook({ snapshot, shellState, wiring })`）**只算一处**，两侧递的是同一份三个输入；
 * 本 module 仍然只管「键齐 ＋ 没有多余的键」，`createCardBook` 的签名与两道闸一个字未改。
 *
 * 它治的病（本 effort 根因一）：生产壳与画廊**各写一份**键表 ⇒ 生产加一个书级键，画廊那份
 * 静默落后（连红 8 天、扫描面内 4 张卡、9 个键）。现在「这一袋有哪些键」只在声明里出现一次；
 * 少给一个键时构造器**当场抛**，不会等到某一屏渲出来少半块。
 *
 * 外部 interface：
 *   CARD_BOOK_GROUPS      分组的键名表（冻结；加/删一个书级键只改这里）
 *   CARD_BOOK_KEYS        拍平的键名数组（冻结；画廊适配器与链上判据读它，别再手抄一份）
 *   createCardBook(值来源) 冻结的袋子
 *
 * ## 构造器的两道闸（两个方向都当场抛）
 *
 *   · **声明了但没给值** ⇒ 抛：那个键压根不在值来源上，说明递值的那一侧没给这一项起名字
 *     （生产壳漏接，或画廊适配器旧了）。
 *   · **给了但没声明** ⇒ 抛：声明面之外的键要么是旧键退役没删干净，要么是名字写错了——两种都
 *     会让下一个人以为「这一袋里还有它」。
 *
 * ⚠️ **显式 `undefined` 合法**：`{ contextPercent: undefined }` 说的是「这一位没有」——
 * `src/ui/card-view.js` 的缺省三规则（`undefined` 才走缺省，`null` 是显式的「没有」）依赖
 * 这个区分。所以判「给没给」用的是 `Object.hasOwn`，不是「值 !== undefined」。
 *
 * ## 它**不**管什么（边界照实说）
 *
 *   · **不管值对不对**：值来源由两侧各自提供（生产壳给真实接线与真派生值；画廊给夹具派生值与
 *     回调空实现）。本 module 只保证「键齐、没有多余的键」。
 *   · **不管生产壳有没有真的用它**：那由 `test/test-card-view.mjs` 的源码级接线断言与整壳渲染
 *     判据兜。
 *   · **不管声明面是否等于生产卡的实际消费面**：`声明 ⇄ 每张卡 fromBook ∪ required` 的逐键
 *     对账是**另一条**判据（`gallery-realign/03` 的链上判据）；这里只冻结「这一袋有哪些键」。
 *     ⚠️ 它的窄处也在这里：声明改坏（少登记一个键）时，本 module 的闸**看不见**——那要靠那条
 *     对账判据，别把这里的绿读成「声明与卡对上了」。
 *
 * ⚠️ **零 import**：生产壳（客户端包 `lib/client.js`）与画廊（开发期件）import 的是**同一个**
 * 模块，所以它不能认识 react、node 内建或任何界面模块。与 `card-view.js` 同一条中性纪律。
 */

/**
 * 构造期抛错。
 *
 * 继承 `TypeError`：`CardBookError` 说的全是「这个 module 收到的值来源形状不对」，不是「某本书
 * 的用户操作失败了」。⚠️ 上层**不许** `catch` 它再降级——那正是本 module 要拆掉的那种静默。
 */
export class CardBookError extends TypeError {}

/**
 * 书级袋子的键名声明——**唯一一处**。
 *
 * 分组只为人读（「这个值从哪来」），构造器不关心某把钥匙归哪一组；分组也是「加键时该往哪想」
 * 的路标。⚠️ **加/删一个书级键**：改这里（一处）＋ 两侧各自的值来源（生产壳的真实接线、
 * 画廊的夹具派生／空实现）＋ 卡自己的 `defineCardView`。少给值时构造器当场抛。
 *
 * 键名必须是**能在值来源对象上按属性取到的普通标识符**（下划线小写开头），因为两侧都是
 * `{ key: value }` 形状的值来源；这条由 `test/test-card-view.mjs` 钉着。
 */
export const CARD_BOOK_GROUPS = Object.freeze({
	/** 书级只读数据：`/textbook/events` 等那份 snapshot 与它的现算派生（壳级 `deriveBookViewFacts`）。 */
	bookData: Object.freeze([
		"meta",
		"gate",
		"events",
		"checks",
		"aiReport",
		"lastEvent",
		"exploreSummary",
		"knowledgeMapText",
		"outlineText",
		"goldAuditText",
		"goldDrafts",
		"goldDraftVersion",
		"shapeReport",
		// ⚠️ 未过滤的 `meta.styleNotes`（壳里那个同名局部量是给 `StylePanel` 用的 active 过滤版，
		// 两者不是同一份）：卡读的是**全量**那份。
		"styleNotes",
	]),
	/** 产物读取通道：地址拼装归 `ui/artifact-read.js`，画廊只换 `fetchImpl`。 */
	products: Object.freeze([
		"readArtifact",
		"fetchText",
		"downloadHref",
		"knowledgeMapExclusions",
		"readerQuestionnaireReturn",
	]),
	/** 壳注入的接线：回调、导航目标、动作出口（值不共用，画廊那边一律空实现）。 */
	shellWiring: Object.freeze([
		"busy",
		"postAction",
		"onDecide",
		"onRollback",
		"onAddPattern",
		"maxConcurrentSubagents",
		"onSetKnobs",
		"onSkipStep",
		"onUpload",
		"onConvert",
		"onReplaceSource",
		"onRemoveSource",
		"autoSplit",
		"onDemoNext",
		"onResume",
		"onPreview",
		"onApprove",
		"onReject",
		// 票 `ui-display-redesign/20`：删书改**一步**（点一下直接发 `book-delete`）⇒ 卡袋只剩
		// 那颗真正发动作的回调；两步确认的「先进确认态」`onDeleteStart` 已从卡面退役（底栏那条
		// 小条自己的两步确认走壳里的 `deletingId`，不进卡片袋）。
		"onDeleteConfirm",
		// ⚠️ 三个「确认」各自不撞名：几张卡的 prop 都叫 `onConfirm`／`onDecide` 一族，指向的却是
		// 不同的事；合成一个会把一处手对的接线藏进壳里（见 `card-view.js` 的 delta 闭集那段）。
		"confirmExplore",
		"confirmGoals",
		"confirmOutline",
		"graphDropped",
		"onGraphVerdict",
		"predrawnLowerBoundary",
		"readerQuestionnaireSaved",
		"onOpenReaderQuestionnaire",
		"onViewReport",
		"onSuggestWords",
	]),
	/** 壳已经算好的派生／书级 UI state：原样递下去，卡里不重算。 */
	derived: Object.freeze([
		"needsConfig",
		"pendingStageLabel",
		"progressDetail",
		"stall",
		"contextPercent",
		"runningSubagentCount",
		"gateOpen",
		"setGateOpen",
		// 「没在回看任何一步」是**显式的 null**，不是「键不存在」（卡内高亮判据写着 `!== null`）。
		"browsingKey",
		"workKnown",
	]),
	/** 章节卡与账本回放列表：书级数据 ＋ 入账／打开的接线。 */
	chapters: Object.freeze([
		"chapterStatus",
		"pendingReviews",
		"workFiles",
		"submitReview",
		"onView",
		"onApproveAll",
		"onViewRow",
	]),
	/** 阶段／步视图模型与导航：两处 mount 点共用同一份 projector 与其接线。 */
	stageStep: Object.freeze([
		"processSegs",
		"processToken",
		"projector",
		"onPickStep",
		"onPickPhase",
		"openInSidebar",
		"onDeepModify",
		"onDeepUndo",
		"onBackfillGraph",
	]),
});

/**
 * 拍平的键名数组（冻结）。
 *
 * 画廊适配器与链上判据读它；构造器按它校验与拷贝。⚠️ **不许在别处再写一份**——那正是本票
 * 要收掉的第二个表。
 */
export const CARD_BOOK_KEYS = Object.freeze(Object.values(CARD_BOOK_GROUPS).flat());

/**
 * 从「值来源」构造那张冻结的袋子。
 *
 * @param {object} valueSource 「键 → 值」的对象。生产壳给真实接线与真派生值；画廊给夹具派生值
 *   与回调空实现。⚠️ 显式 `undefined` 合法（＝说了「这一位没有」）；**键压根不在** ⇒ 抛。
 * @returns {object} 冻结的袋子（键集与顺序＝`CARD_BOOK_KEYS`，值原样递过去）。
 */
export function createCardBook(valueSource) {
	if (valueSource === null || typeof valueSource !== "object" || Array.isArray(valueSource)) {
		throw new CardBookError(
			"createCardBook 的值来源必须是一个「键 → 值」的对象（生产壳／画廊各自递给它的那本 values，"
				+ "不是袋子本身）：要么忘了传，要么传成了数组。",
		);
	}
	// ① 声明了但没给值 ⇒ 抛。判的是「键在不在」，不是「值是不是 undefined」：
	//    后者是壳**说了**「这一位没有」（`browsingKey: null`、`contextPercent: undefined` 那种），
	//    合法；前者是递值的那一侧没给这一项起名字。
	const missing = CARD_BOOK_KEYS.filter((key) => !Object.hasOwn(valueSource, key));
	if (missing.length > 0) {
		throw new CardBookError(
			`书级袋子：声明了但没给值的键——${missing.join("、")}。这些键在 src/ui/card-book.js 的 `
				+ `CARD_BOOK_GROUPS 里声明，声明了就必须给值。⚠️ 显式传 undefined 是合法的「这一位没有」，`
				+ `别拿它来糊这一抛：键压根不在说明递值的那一侧没给这一项起名字（生产壳漏接，或画廊适配器旧了）。`,
		);
	}
	// ② 给了但没声明 ⇒ 抛。声明面之外的键：旧键退役没删干净，或名字写错了。
	const declared = new Set(CARD_BOOK_KEYS);
	const extra = Object.keys(valueSource).filter((key) => !declared.has(key));
	if (extra.length > 0) {
		throw new CardBookError(
			`书级袋子：给了但没有声明的键——${extra.join("、")}。值来源里有声明面之外的键：要么从值来源里`
				+ `删掉（旧键退役了？），要么在 src/ui/card-book.js 的 CARD_BOOK_GROUPS 里把它登记成这一袋的键`
				+ `（拼错的名字就是恒空）。`,
		);
	}
	const bag = {};
	for (const key of CARD_BOOK_KEYS) bag[key] = valueSource[key];
	return Object.freeze(bag);
}
