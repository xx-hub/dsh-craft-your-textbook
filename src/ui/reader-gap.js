/**
 * 站 2 卡上那一栏「**这批条目拿不到读者输入**」（票 `reader-cognition-boundary-build/09`；
 * spec §3.8／§5.1／§6.2 G／§9.3；正文出处＝票 `15` 的 `## Answer`，方向出处＝票 `07` 决策 3）。
 *
 * ## 它是什么，不是什么
 *
 * **是**一条**派生读数**：从三件**既有**事实现算——
 *   ① 书夹里那份回卷件（`工作区/读者情况回卷.md`，票 `03` 的形状判据在
 *      `workflow/reader-questionnaire.js`；原文随 `/textbook/events` 下发到 `readerQuestionnaireReturn`）；
 *   ② 分组面＝合并件的 `readerSlices`（票 `01`；缺席／坏形状时消费侧退化成「整书一片」）；
 *   ③ 图上的裁决＝`工作区/knowledge-map-exclusions.json`（`reason` 两档）。
 * **不是**：不是第二份事实源（⛔ 不落任何件、⛔ 不落 `meta` 键）、⛔ **不带自己的状态位**
 * （承 `src/ui/material-gap.js` 文件头第 2 条的同一句口径）、⛔ 不落剔除记录、⛔ 不触发剔除、
 * ⛔ **不拦放行**（「回卷件在不在」「缺口有几条」一个字都不驱动流水线）。
 *
 * ## 四条形状纪律（照「材料缺口」那一族 `src/ui/material-gap.js` 文件头）
 *
 * 1. **逐条不批次**：这里每一行只讲**这一片**（读数＝**片级一条 ＋「本片 N 条」**）；
 *    ⛔ **不逐条列 125 行**——那是红线的对偶（读的一侧也会变成「很多又臭又长的判断」，票 `15` 第 5 条）。
 * 2. **没有缺口时整块不渲染**（`return null`，⛔ 不是渲染一块空的）。
 * 3. **每条缺口旁必须有一个能走的动作**（承本仓口径「只显示一个没有补救的状态就是承诺过度」）。
 *    这里那颗动作＝**图上逐卡划**（票 `15` 第 7 条）——它就是本卡图那一块上已有的那些裁决键，
 *    ⛔ **不新开**「换成人话再问这一片」的按钮（那实质就是第 2 条关掉的那条路换个入口）。
 * 4. **三类屏上不许混成一栏**（`ADR-0041` 决策 3／后果 4）：① **没答** ② **答了「不确定」**
 *    ③ **问了不适配**（「这片不是问我的」）。三类各自的抬头／把手／那一行的动作**各不相同**。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）
 *
 * 1. **解析面只认问卷自己印的那几种行型**（`renderReaderQuestionnaire` 的那几种，逐字）：
 *    `## 第 N 问 · <片名>`／`- [x] <片级三态>`／`- [x] 已经会　- [ ] 不确定 —— <成员>`。
 *    回卷**不要求合格式**（spec §3.6：跑题散文、只答一半都收）⇒ 真人写的「我都不会」「第 2 片跳过」
 *    这类自由文本**一条都读不出来**，它只会表现为「那一片没人答」。⛔ 本模块**不假装**能读懂散文。
 * 2. **「没答」是残差**：本片成员 减掉「逐条勾了已会」减掉「逐条勾了不确定」（本片被答
 *    「这片不是问我的」时整片归第三类）。所以**卷上没列到的成员**（票 `05`：逐条 ≤30 封顶）
 *    也算「没答」——那是票 `07`／`15` 的保守方向（没列到的一律照常讲）。
 * 3. **只看得到「图上已经划掉的那批」**：带 `reason: 已经会`／`不需要` 的成员不再算缺口。
 *    陈旧（键没了／`title` 变了）那一档的现算归 `liveExclusionsOf`，本模块**有意不复算**——
 *    同一条裁决「算不算数」由图那两处既有读者说话。
 * 4. **片级三态只认两种写法里的一种**：片级勾「说不准」⇒ 整片落第②类（票 `15` 的对齐表：
 *    片级的「说不准」＝第二档在**片粒度**上的形态）；片级勾「这片我基本都会」**⛔ 不产生缺口、
 *    ⛔ 也不产生剔除**（票 `15` 第 4 条）——它只让**逐条没勾的那些**照旧落第①类。
 * 5. **本模块不证好看**：无 DOM、无浏览器 ⇒ 三类区块的位置、配色、字号，以及那颗动作键点下去
 *    之后的滚动行为，都归人工边界（ADR-0035 画廊）。
 */
import { createElement } from "react";
import { S } from "./styles.js";
// ⚠️ **唯一出处**：两套态词与 `title` 归一化都从问卷那一处取（票 `03` 的模块）
//    ——⛔ 本文件不再手抄第二份态词表、⛔ 也不再自带一份 `normalizeTitle`。
// ⚠️ 取的是**无 Node 依赖**的那一个文件（`src/reader-questionnaire-vocab.js`，票 `ui-workflow-seam/01`
//    把它搬到了 `src/` 根级）：本模块进浏览器 bundle（`build.mjs` 的 `platform: 'browser'`），
//    从 `reader-questionnaire.js` 取会把它那串 `node:fs`／`node:os` 拖进来、bundle 当场解不出
//    （收口修正实测）。⚠️ `workflow/reader-questionnaire-vocab.js` 是**同一个文件**的再导出，
//    界面走根级这一条只是不再知道 `workflow/` 那个路径。
import {
	READER_ITEM_STATES,
	READER_SLICE_STATES,
	normalizeTitle,
} from "../reader-questionnaire-vocab.js";

/** 三类缺口的**闭集**（屏上每一类各占各的区；把手／抬头／动作都按它派生）。 */
export const READER_GAP_KINDS = Object.freeze({
	/** ① 没答：问了他没回（含「卷上没列到」的那些成员）。 */
	unanswered: "unanswered",
	/** ② 答了「不确定」（片级「说不准」＝同一档在片粒度上的形态）。 */
	unsure: "unsure",
	/** ③ 问了不适配：「这片不是问我的」——归票 `15` 的那一档。 */
	unfit: "unfit",
});

/**
 * 三类的**抬头**（逐类各一句；屏幕上三块抬头互不相同）。
 * ⚠️ 第③类的抬头逐字带「不是问我的」——它与第②类的「不确定」**一个字都不许混**（`ADR-0041` 决策 3）。
 */
export const READER_GAP_LABELS = Object.freeze({
	[READER_GAP_KINDS.unanswered]: "① 没答的片",
	[READER_GAP_KINDS.unsure]: "② 答了「不确定」的片",
	[READER_GAP_KINDS.unfit]: "③ 问了不适配（「这片不是问我的」）的片",
});

/**
 * 三类的**一句解说**（把「为什么它算缺口」「补救是什么」说在明面上）。
 * ⚠️ 第①／②类那句「照常讲」是票 `07` 的保守方向；第③类那句「重写归书里、问卷不再问一遍」
 * 是票 `15` 第 2 条的收窄，⛔ 不许写成「下一轮再问一次」。
 */
export const READER_GAP_NOTES = Object.freeze({
	[READER_GAP_KINDS.unanswered]:
		"这些条目没人答过：按「没表态一律照常讲」处理——想让它们不讲，只能靠人在图上逐卡划。",
	[READER_GAP_KINDS.unsure]:
		"这些条目读者答了「不确定」：同样照常讲。想少讲，只能靠人在图上逐卡划。",
	[READER_GAP_KINDS.unfit]:
		"这些片读者答了「这片不是问我的」：这批条目默认讲（换主语重写发生在书里，问卷不再问第二遍）。"
		+ "⚠️ 这意味着它们可能永远拿不到读者输入——想砍掉它们，只能靠人在图上逐卡划。",
});

/**
 * 那处**代价**的如实登记（spec §3.8 末条／票 `15` 的「一处如实说明」）。
 * 它同时出现在第③类那一块上：定了「不再问一轮」⇒ 那批条目**永远拿不到读者输入**。
 */
export const READER_GAP_UNFIT_COST =
	"⚠️ 这批条目可能永远拿不到读者输入：想砍，只能靠人在图上逐卡划。";

/**
 * 那一颗**能走的动作**的文案（逐字）。
 * ⚠️ 它指向的是**本卡图那一块上已有的裁决键**（`graph-opinion` 那条既有通路），
 * ⛔ 不是一颗新按钮、⛔ 更不是「只问缺口」的第二次发卷。
 */
export const READER_GAP_ACTION_TEXT = "在图上逐卡划（去图那一块）";

/**
 * 那颗动作的**去向**：本卡「知识点图」那一块的锚（`data-kg-block`，`knowledge-graph-map.js` 上）
 * ＋ 一个真锚点 `href`（`#` ＋ 那个把手）。两者同源，⛔ 不留第二份手抄。
 */
export const READER_GAP_ACTION_TARGET = "data-kg-block";
export const READER_GAP_ACTION_HREF = `#${READER_GAP_ACTION_TARGET}`;

/** 从「`- [x] …` 那一行」里取勾上的那一项（认不出／勾了多个 ⇒ 返回 `null`）。 */
function markedStateOf(line, states) {
	const hits = states.filter((state) => line.startsWith(`- [x] ${state}`));
	return hits.length === 1 ? hits[0] : null;
}

/**
 * 逐条那一行的**形状**（`- [x] 已经会　- [ ] 不确定 —— <成员>`；全角空格分隔，照问卷自己印的）。
 * 返回 `{state, member}` 或 `null`。
 *
 * ⚠️ 成员名里若含「已经会」/「不确定」两个态词会被误读——那是本解析面的**窄处**（见文件头 ⚠️①），
 * 不假装能覆盖（真要覆盖得有一份转义约定，而票面没有这一件）。
 */
function parseItemLine(line, itemStates) {
	const row = /^- \[( |x)\] (已经会|不确定)　- \[( |x)\] (已经会|不确定) —— (.+)$/.exec(line);
	if (row === null) return null;
	const first = row[1] === "x" ? row[2] : null;
	const second = row[3] === "x" ? row[4] : null;
	if (first !== null && second !== null) return null; // 两态都勾了：认不出是哪一个 ⇒ 当作没答
	const state = first ?? second;
	if (state === null || !itemStates.includes(state)) return null;
	const member = normalizeTitle(row[5]);
	if (member === "") return null;
	return { state, member };
}

/**
 * **缺口读数**（纯函数：不读盘、不写盘、无副作用；同一个输入永远同一个输出）。
 *
 * @param {object} input
 * @param {unknown} input.returnedText 回卷件原文（`readerQuestionnaireReturn`；`null`／非串／空白 ⇒ `null`）
 * @param {unknown} input.slices `readerSlices`（`[{name, description?, members:[title]}]`）
 * @param {unknown} [input.exclusions] 图上那份裁决的**逐条**（`[{key,title,reason,by,at}]`；缺省＝没有裁决）
 * @param {object} [input.states] 两套状态词（缺省＝问卷自己印的那两套**常量**
 *   `READER_SLICE_STATES`／`READER_ITEM_STATES`，⛔ 这里不手抄字面量；只为让判据喂同一段判据）
 * @returns {Array<{kind: string, slice: string, gaps: number}>|null}
 *   **片级一条 ＋「本片 N 条」**；⛔ 无缺口／没有回卷件 ⇒ `null`（整块不渲染）。
 *   排列序＝① → ② → ③，同一类里按**片在合并件里的顺序**（与卷上那一问的顺序同源）。
 */
export function readerGapReading({
	returnedText,
	slices,
	exclusions,
	states = { sliceStates: READER_SLICE_STATES, itemStates: READER_ITEM_STATES },
} = {}) {
	if (typeof returnedText !== "string" || returnedText.trim() === "") return null;
	// 两种递法都认：`readerSlices` 那**一个数组**，或消费侧退化视图 `effectiveReaderSlices(...)`
	// （`{slices, degraded, note}`）。两条路给的是同一份片表 ⇒ 判据与实际渲染吃同一份输入。
	const list = Array.isArray(slices)
		? slices
		: (slices !== null && typeof slices === "object" && Array.isArray(slices.slices) ? slices.slices : []);
	if (list.length === 0) return null;

	const { sliceStates, itemStates } = states;
	const excluded = new Set(
		(Array.isArray(exclusions) ? exclusions : [])
			.map((item) => normalizeTitle(item?.title))
			.filter((title) => title !== ""),
	);

	// ── 解析回卷件：逐片收「片级那一勾」与「逐条那一勾」 ─────────────────────────────
	const HEADING_RE = /^## 第 \d+ 问 · (.+)$/;
	const answered = new Map(); // 片名 → { sliceState: string|null, items: Map<title, state> }
	let current = null;
	for (const line of returnedText.split(/\r?\n/)) {
		const heading = HEADING_RE.exec(line);
		if (heading !== null) {
			const name = normalizeTitle(heading[1]);
			current = name === "" ? null : { sliceState: null, items: new Map() };
			if (current !== null && !answered.has(name)) answered.set(name, current);
			continue;
		}
		if (current === null) continue;
		if (line.startsWith("- [x] ")) {
			const sliceState = markedStateOf(line, sliceStates);
			if (sliceState !== null && current.sliceState === null) {
				current.sliceState = sliceState;
				continue;
			}
		}
		const item = parseItemLine(line, itemStates);
		if (item !== null && !current.items.has(item.member)) current.items.set(item.member, item.state);
	}

	// ── 逐片分类（一片最多出一条读数；三类各占各的区） ───────────────────────────────
	const unanswered = [];
	const unsure = [];
	const unfit = [];
	for (const slice of list) {
		const name = normalizeTitle(slice?.name) === "" ? "（未命名的一片）" : normalizeTitle(slice.name);
		const members = (Array.isArray(slice?.members) ? slice.members : [])
			.map(normalizeTitle)
			.filter((title) => title !== "");
		const sheet = answered.get(normalizeTitle(slice?.name)) ?? null;

		// ③ **问了不适配**：整片进第三类——那批条目**默认讲** ＋ 单独一栏记账。
		//    ⚠️ 带 `reason` 的裁决（人已经划过的那批）不再算缺口；没有 `title`／问不到的按没裁过算。
		if (sheet !== null && sheet.sliceState === sliceStates[2]) {
			const gaps = members.filter((member) => !excluded.has(member)).length;
			if (gaps > 0) unfit.push({ kind: READER_GAP_KINDS.unfit, slice: name, gaps });
			continue;
		}
		// ② **答了「不确定」**：片级勾「说不准」⇒ 整片落第二类（片粒度上的同一档）。
		if (sheet !== null && sheet.sliceState === sliceStates[1]) {
			const gaps = members.filter((member) => !excluded.has(member)).length;
			if (gaps > 0) unsure.push({ kind: READER_GAP_KINDS.unsure, slice: name, gaps });
			continue;
		}
		// ① **没答** ＝ 残差：成员减掉「逐条勾了已会」减掉「逐条勾了不确定」减掉「图上已划掉」。
		//    ⚠️ 「不确定」**必须**在这里减掉：勾了它的那些条目只归②——三类屏上不许混成一栏
		//    （`ADR-0041` 决策 3），把它们同时算进①就是把「有交代」说成「没答」。
		const written = sheet === null ? new Map() : sheet.items;
		const noAnswer = members.filter(
			(member) => !excluded.has(member)
				&& written.get(member) !== itemStates[0]
				&& written.get(member) !== itemStates[1],
		).length;
		if (noAnswer > 0) unanswered.push({ kind: READER_GAP_KINDS.unanswered, slice: name, gaps: noAnswer });
		// ② 的另一半：逐条勾了「不确定」的那几条（片级没勾「说不准」时也照算）。
		const unsureItems = members.filter(
			(member) => !excluded.has(member) && written.get(member) === itemStates[1],
		).length;
		if (unsureItems > 0) unsure.push({ kind: READER_GAP_KINDS.unsure, slice: name, gaps: unsureItems });
	}

	const reading = [...unanswered, ...unsure, ...unfit];
	return reading.length === 0 ? null : reading;
}

/**
 * 那一颗动作键点下去要发生的事：**不是**新开一条通路，只是把用户送到**本卡图那一块**上
 * （票 `15` 第 7 条：那栏旁边能走的动作＝图上逐卡划）。
 *
 * ⚠️ 它**有意只做导航**：滚到那一块、把第一颗裁决键的焦点交出去。⛔ 不发任何请求、
 * ⛔ 不改任何状态、⛔ 不替用户划任何一张（「图上逐卡划」是**人的动作**）。
 * 无 DOM（`react-test-renderer`）或那一块不在场时，它**什么都不做**（不抛）——
 * 那时 `<a href="#data-kg-block">` 这一半仍在（浏览器的原生锚点跳转）。
 */
export function goToGraphVerdicts() {
	if (typeof document === "undefined") return;
	const block = document.querySelector(`[${READER_GAP_ACTION_TARGET}]`);
	if (block === null) return;
	if (typeof block.scrollIntoView === "function") block.scrollIntoView({ block: "start" });
	const firstKey = typeof block.querySelector === "function"
		? block.querySelector("[data-kg-card], button")
		: null;
	if (firstKey !== null && typeof firstKey.focus === "function") firstKey.focus();
}

/**
 * 缺口那一栏（站 2 卡尾**独立一块**；票 `09` 的逐条落点 2）。
 *
 * ⚠️ 它**只是读数的呈现**：⛔ 不落任何件、⛔ 不参与任何放行判断、⛔ 没有自己的状态位。
 *
 * @param {object} props
 * @param {ReturnType<typeof readerGapReading>} props.reading {@link readerGapReading} 的返回值
 * @returns {import("react").ReactElement|null} 没有缺口 ⇒ `null`（整块不渲染）
 */
export function ReaderGapBlock({ reading }) {
	if (!Array.isArray(reading) || reading.length === 0) return null;

	return createElement(
		"div",
		{
			style: {
				marginTop: "10px",
				padding: "8px 10px",
				borderRadius: "10px",
				border: "1px solid var(--dsw-alias-border-l2)",
				background: "var(--dsw-alias-bg-layer-1)",
			},
			"data-reader-gap": "1",
		},
		createElement(
			"div",
			{ style: { fontSize: "13px", fontWeight: 600 } },
			"⚠️ 这批条目拿不到读者输入",
		),
		createElement(
			"p",
			{ style: { margin: "4px 0 6px", fontSize: "12px", opacity: 0.8 } },
			"下面按三类分开记账：每一行只讲这一片，并如实写出这一片有多少条拿不到输入。",
		),
		...Object.values(READER_GAP_KINDS).map((kind) => {
			const lines = reading.filter((line) => line?.kind === kind);
			if (lines.length === 0) return null;
			return createElement(
				"div",
				{
					key: kind,
					"data-reader-gap-kind": kind,
					style: {
						padding: "6px 0",
						borderTop: "1px solid var(--dsw-alias-border-l2)",
						fontSize: "13px",
					},
				},
				createElement("div", { style: { fontWeight: 600 } }, READER_GAP_LABELS[kind]),
				createElement(
					"p",
					{ style: { margin: "2px 0 4px", fontSize: "12px", opacity: 0.75 } },
					READER_GAP_NOTES[kind],
				),
				...lines.map((line) =>
					createElement(
						"div",
						{
							key: `${kind}:${line.slice}`,
							"data-reader-gap-line": kind,
							"data-reader-gap-slice": line.slice,
							"data-reader-gap-count": String(line.gaps),
							style: {
								display: "flex",
								alignItems: "baseline",
								gap: "10px",
								flexWrap: "wrap",
								padding: "2px 0",
							},
						},
						createElement("span", null, `${line.slice}：本片 ${line.gaps} 条`),
						// 那一颗**能走的动作**：⛔ 不是新按钮、⛔ 不是第二次发卷——
						// 它就是把用户送到本卡图那一块（`graph-opinion` 那条既有通路的入口）。
						createElement(
							"a",
							{
								"data-reader-gap-action": kind,
								"data-reader-gap-action-kind": "graph-verdict",
								"data-reader-gap-action-target": READER_GAP_ACTION_TARGET,
								href: READER_GAP_ACTION_HREF,
								style: { fontSize: "12px" },
								onClick: (event) => {
									if (event !== null && typeof event.preventDefault === "function") event.preventDefault();
									goToGraphVerdicts();
								},
							},
							READER_GAP_ACTION_TEXT,
						),
					),
				),
				kind === READER_GAP_KINDS.unfit
					? createElement(
							"p",
							{
								"data-reader-gap-cost": "1",
								style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.75 },
							},
							READER_GAP_UNFIT_COST,
						)
					: null,
			);
		}),
	);
}
