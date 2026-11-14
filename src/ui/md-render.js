/**
 * 造书工作台 · 最小 markdown 渲染
 *
 * 正文流式阅读用的行内/分块渲染：不引依赖，全用 React.createElement。
 * 服务谈判桌（GoldReader/GoldCompare）、探查报告、章节内联展开等所有「读稿」场景。
 */

import { createElement } from "react";
import { splitParagraphs } from "./rules.js";

/**
 * 工作台内「连续正文块」的**量宽上限**——全仓唯一出处（票 `walkthrough-fixes/17`，
 * 2026-10-06 裁决「丙：另设正文测量宽上限」）。
 *
 * · 值 `36em`：`1em` 取**该块自身**的 `font-size` ⇒ **禁写死 px**（裁决原文说换算只作核对：
 *   16px⇒576、17px⇒612；写死 px 就把「跟着块自己的字号走」这件事丢了）。
 * · 为什么是 36em：裁决人给的约定（不是票面事实）——36em 中文约 30–40 汉字/行取中位、
 *   拉丁约 72 字符/行仍在 45–75 区间内；且它只压正文块，**卡盒宽度一点不动**。
 * · 适用范围（裁决约定）：「连续正文块」＝**报告卡正文／章节正文／终检报告正文**。
 *   裁决**排除**的那几类（表格、行号 gutter、折叠清单、代码）住**别的路径**——盘上对应的是
 *   `src/ui/gold-table.js` 左侧那个绝对定位的段号 `span`（gutter）、`src/ui/phase-page.js` 里
 *   知识地图/章节安排那两条折叠清单的 `<pre>`、`src/ui/event-cards.js` 闸门卡详情那个 `<pre>`。
 *   ⚠️ **本模块这条「报告 md」的路只有两个分支**（`exploreReportBlocks` 的 `/^#{1,2}\s+/` 标题支，
 *   与其余走 `READER_PARA_STYLE` 的段支）⇒ 报告 md 里的 ``` 围栏与 `|` 表格行在本路就是**普通文本段**，
 *   **也吃这条 `36em`**（本路不产生 `<table>`／`<pre>` 那一层；本仓 `src/**` 里**没有**任何
 *   markdown→`<table>` 的渲染点，取样：`Get-ChildItem -Recurse src -Include *.js |
 *   Select-String -Pattern '"table"'` ⇒ 零命中）。
 *   **这不是「没套」**：裁决排除的那几类在本路**没有对应物**。这句自陈曾经写成「本路不算」而与
 *   实现不符（收口 review 规范轴 N2，读数与复现命令在票 `walkthrough-fixes/17` 的 `## Answer` 末节）。
 * · ⛔ 它压的是**正文块**，不是卡盒：卡盒宽度归宿主那套变量（票 16 的「工作台＝输入框」
 *   逐字同一式子，见 `src/client-entry.js` 的 `rootStyle`）。为了消白把卡盒改回
 *   「随内容宽」正是票 16 判死的病（维护者原话「页面的宽度在流程进行中老变」）。
 * · 📌 **出处只此一处**：别处要用就 import 它，**不许**再抄一份同样的字面量。
 *   `test-layout-anchors.mjs` 的「正文块量宽只此一处」一节按**次数**咬第二处
 *   （坏形状反证见那一节；这一条与卡盒那条是两回事，别互相顶替）。
 */
export const BODY_MEASURE_MAX_WIDTH = "36em";

// 正文流式排版（F11）：像读书一样一段段往下流，不做卡片框。
// `maxWidth` 取上面那个唯一出处（**报告卡正文**与**章节正文**两条路都走这一份样式：
// 前者经 `exploreReportBlocks`、后者经 `gold-table.js` 的 `GoldReader`/`GoldCompare`）。
export const READER_PARA_STYLE = {
	margin: "0 0 0.75em",
	fontSize: "13px",
	lineHeight: 1.7,
	maxWidth: BODY_MEASURE_MAX_WIDTH,
};

/**
 * 行内最小 markdown 渲染（正文流式阅读用，不引依赖，全用 React.createElement）：
 * - `**加粗**` -> <strong>；
 * - `#`/`##` 开头 -> 加粗标题段；
 * - `- ` 开头 -> 列表行（前面加项目符号）；
 * - 其余原样当纯文本。
 * 恒返回节点数组（文本 + 元素混排），可直接 ... 展开成 createElement 的 children。
 */
export function renderInline(text) {
	const str = String(text ?? "");
	const head = /^(#{1,2})\s+(.+)$/.exec(str);
	if (head !== null)
		return [
			createElement(
				"strong",
				{ style: { fontSize: "16px" } },
				...inlineBold(head[2]),
			),
		];
	const list = /^[-*]\s+(.+)$/.exec(str);
	if (list !== null)
		return [
			createElement(
				"span",
				{ style: { display: "block" } },
				"• ",
				...inlineBold(list[1]),
			),
		];
	return inlineBold(str);
}

/** 把 `**加粗**` 切成 [文本, strong, 文本, ...] 的节点数组：odd 下标是加粗段。 */
function inlineBold(s) {
	const parts = String(s).split(/(\*\*.+?\*\*)/g);
	const nodes = [];
	for (let i = 0; i < parts.length; i += 1) {
		if (parts[i] === "") continue;
		nodes.push(
			i % 2 === 1
				? createElement("strong", { key: i }, parts[i].slice(2, -2))
				: parts[i],
		);
	}
	return nodes;
}

// F30（2026-08-20 走查）：源探查报告（工作区/explore.md）的 md 最小渲染。
// 按空行切段：`## ` 开头当标题（renderInline 自带加粗样式），普通段用正文流式排版
// （READER_PARA_STYLE），`- ` 列表行由 renderInline 转成带项目符号的块。
// 恒返回节点数组，可直接 ... 展开成 createElement 的 children；空/异常输入返回空数组。
//
// 🚩 票 `walkthrough-fixes/17`（2026-10-06 裁决）：**两个分支都要带正文量宽上限**
//   `BODY_MEASURE_MAX_WIDTH`。标题那一支原来是裸 `div`（只有 `margin`），于是它**继承卡自己的
//   `13px`**、宽度铺满卡片内容盒——票 17 的「落地前基线」在真 2K 上量到的
//   **「卡内正文块 3 段、`font-size: 13px`、宽 856.00px ＝ 65.85em」正是这一支**（演示书的
//   explore.md 恰好是 3 个 `##` 小节、没有散文段）。只给下面那一支（`READER_PARA_STYLE`）
//   加上限**改不动那个被验的数**，落地后复量还是 65.85em。⇒ 标题支也吃同一条上限。
//   ⚠️ 1em 取的是**这个块自己**的 font-size（标题支＝继承来的 13px），所以 36em 在这里是
//   468px；`renderInline` 里那个 `<strong fontSize:16px>` 只是块**内容**的字号，不改变量宽。
export function exploreReportBlocks(mdText) {
	const paras = splitParagraphs(mdText);
	const blocks = [];
	for (const para of paras) {
		blocks.push(
			/^#{1,2}\s+/.test(para)
				? createElement(
						"div",
						{
							key: blocks.length,
							style: { margin: "0 0 0.6em", maxWidth: BODY_MEASURE_MAX_WIDTH },
						},
						...renderInline(para),
					)
				: createElement(
						"p",
						{ key: blocks.length, style: READER_PARA_STYLE },
						...renderInline(para),
					),
		);
	}
	return blocks;
}

// 票 `ui-systematic-fixes/01`：**正文出口** `bodyOf`（spec 实现决策 §1·2、§3·1）。──────
//
// 病（57 屏逐屏观察 `.scratch/_archive/2026-11/ui-page-audit/shots/04`、`shots/13`）：正文**直接吃原文**——AI 报告的
// `# 标题`／`**加粗**`、关卡那份「完整方案」、站 2 卡尾那三条如实说明里的排版标记**逐字印在屏上**。
// 处置：一段以上的正文只有一个入口，两档分派（spec §1·2）：
//   · `markdown` → **既有报表块**（`exploreReportBlocks`：`# `/`## ` 标题、`**加粗**`、`- ` 列表，
//     并吃那条唯一的正文量宽上限 `BODY_MEASURE_MAX_WIDTH`）；
//   · `machine-json` → **既有那份折叠件**（`<details>` ＋ 折叠口 ＋ `<pre>` 原文，与 `MachineChecks`／
//     意见卡那几处同形）——机器原文逐字进 `<pre>`，⛔ 不做二次排版。
//
// ⛔ **不扩渲染器能力**（spec §范围外）：代码围栏、表格、引用今天都不支持（当普通文本段渲染），
// 本票只要求「正文都走它」。⇒ 屏上仍可能出现 `> `／``` 这类记号，那是渲染器的既有边界、不是本出口的缺口。
//
// ⚠️ **`kind` 是**我们自己产的闭集（spec §2 那条）：未登记的一档 ⇒ **不印**（返回空数组）＋ 测试报红
// ——闭集漏登记是 bug，不是「猜不出来」；自由文本那一档（译不出原样显示）与本出口无关。

/** 正文出口的第一档：md 正文（AI 报告、方案正文、说明句…）。 */
export const BODY_KIND_MARKDOWN = "markdown";
/** 正文出口的第二档：机器 JSON（原始产物）。 */
export const BODY_KIND_MACHINE_JSON = "machine-json";
/**
 * `bodyOf` 认的那两档——**闭集的唯一出处**（判据的期望值取它，⛔ 不在别处手抄第二份）。
 * ⚠️ 它与现实的关系：现实里「还有哪些正文渲染点没走这个出口」这件事**这张表看不见**（住
 * `RICH_SLOTS` 与 `test-wording-invariants.mjs` 那条双向闭包）。
 */
export const BODY_KINDS = Object.freeze([BODY_KIND_MARKDOWN, BODY_KIND_MACHINE_JSON]);

/**
 * 正文出口：吃一段正文原文与它的档，吐**可以直接摊进 `createElement` children 的节点数组**。
 *
 * 恒返回数组（两档同一形状）⇒ 两个调用点写法一致：`...bodyOf(text, BODY_KIND_MARKDOWN)`。
 * 空/异常输入由各档自己兜（`exploreReportBlocks` 空输入返回空数组；机器那一档空串只留折叠壳）。
 *
 * @param {unknown} text 正文原文
 * @param {string} kind `BODY_KINDS` 之一
 * @returns {import("react").ReactElement[]} 节点数组（闭集未登记的一档：**空数组**，不印）
 */
export function bodyOf(text, kind) {
	if (kind === BODY_KIND_MARKDOWN) return exploreReportBlocks(text);
	if (kind === BODY_KIND_MACHINE_JSON) return machineJsonBlocks(text);
	// 闭集未登记 ⇒ 不印（spec §2）。测试那侧同一份表：`BODY_KINDS` 之外的档要有判据点名。
	return [];
}

/** 机器 JSON 那份折叠件的折叠口文案（唯一出处）。 */
const MACHINE_JSON_FOLD_SUMMARY = "▸ 展开原文（机器 JSON）";

/** 正文出口的 `machine-json` 那一档：既有那份折叠件 ＋ 原文逐字进 `<pre>`。 */
function machineJsonBlocks(text) {
	const raw = String(text ?? "");
	return [
		createElement(
			"details",
			{ key: "machine-json", style: { margin: "4px 0 0" } },
			createElement(
				"summary",
				{ style: { cursor: "pointer", fontSize: "12px", opacity: 0.85 } },
				MACHINE_JSON_FOLD_SUMMARY,
			),
			createElement(
				"pre",
				{
					style: {
						whiteSpace: "pre-wrap",
						wordBreak: "break-word",
						background: "var(--dsw-alias-bg-layer-1)",
						borderRadius: "6px",
						padding: "8px",
						fontSize: "12px",
						margin: "4px 0 0",
					},
				},
				raw,
			),
		),
	];
}

/**
 * **`RICH_SLOTS`**：仍然**原样渲染**（`whiteSpace: "pre-wrap"` 直接吃原文）的正文块登记表——
 * 一行 ＝ 一处豁免 ＋ **它为什么必须原样**（spec §3·1 逐字：「只有纯文本才许 `pre-wrap`，
 * 且要在 `RICH_SLOTS` 表里登记『为什么这块必须原样』」）。
 *
 * 它不是「免死金牌」：双向闭包由 `test-wording-invariants.mjs` 那条判据守着（盘上每一处 `pre-wrap`
 * 都要在这里找得到；这里每一条也要在盘上真找得到那一处），而那些理由**算不算数**仍要人读。
 *
 * ⚠️ **这张表的枚举面比现实窄在哪里**：判据扫的是 `src/ui/**` 里**代码中**的
 * `whiteSpace: "pre-wrap"`（注释里的同形文本不算）⇒ `<pre>` 元素、`whiteSpace` 写别的值、先解构
 * 再转手、以及界面层目录之外的正文渲染点（薄壳 `src/client-entry.js`）**都不在面里**。
 * 票 `ui-systematic-fixes/03` 起逐处把这些正文接进 `bodyOf`，接一处就从这张表里删一条。
 */
export const RICH_SLOTS = Object.freeze([
	Object.freeze({
		file: "src/ui/md-render.js",
		slot: "机器 JSON 折叠件里的原文（本出口的 machine-json 那一档）",
		reason:
			"机器产物的**原文**就是它该有的样子：人读形态由各域自己的折叠件负责（数据同源、措辞各自成篇），"
			+ "而裁决明确把折叠清单排除在正文块之外——二次排版只会改掉它逐字的性质。",
	}),
	Object.freeze({
		file: "src/ui/chat-desk.js",
		slot: "对话气泡正文（用户与 AI 的自由文本）",
		reason:
			"对话台渲染的是**宿主对话节点**的自由文本，不是本仓产出的正文；气泡是「88% 宽 ＋ 靠边对齐」"
			+ "的版面，走正文块会把它改成长段落（那是另一种东西）。",
	}),
	Object.freeze({
		file: "src/ui/chat-desk.js",
		slot: "系统灰字小行（重试/命令/压缩等提示）",
		reason: "一行一条的系统提示（`muted`），没有段落结构；它的字号与透明度就是「不打扰主对话」那一档。",
	}),
	Object.freeze({
		file: "src/ui/chat-desk.js",
		slot: "落账回执徽章",
		reason: "一行一条的回执（「✓ 已记入…」），逐条左缩进对齐气泡内文——它是账本落点的回声，不是正文。",
	}),
	Object.freeze({
		file: "src/ui/knowledge-graph-map.js",
		slot: "知识点卡对话框里的「可检验」那一句",
		reason:
			"知识地图里的一句话（自由文本、单句），住在那张卡的对话框里；这里要的是「这句话该怎么验」"
			+ "的原文，排版改不动它的信息量。",
	}),
	Object.freeze({
		file: "src/ui/phase-page.js",
		slot: "阶段页各「就地折叠清单」的原文（`P.pre`）",
		reason:
			"裁决明确把**折叠清单**排除在正文块之外（见本模块文件头那段）：它逐字印机器产物的原文，"
			+ "人读形态由各域折叠件（`machine-product-folds`）负责。",
	}),
	Object.freeze({
		file: "src/ui/replay-list.js",
		slot: "回放行展开的全文（驳回理由/拒交原因/机器兜底…）",
		reason:
			"这一格给的是那一行**全文**（票 07 的纯展开收起，供核对当时写了什么）；"
			+ "这一屏的职责是核对，逐字优先于好看，⛔ 不在这里做第二套排版。"
			+ "（同一行里原先那份「提案正文」由票 `ui-systematic-fixes/03` 接进了 `bodyOf`，登记随之删掉。）",
	}),
]);
