/**
 * 展示派生（view rules）——架构评审候选 4 收口：壳（client-entry WorkbenchView）不养展示派生。
 *
 * 五个映射集中在此，纯函数、显式吃 (meta, workFiles) 输入，可独立测试：
 *   - STAGE_HUMAN / stageHuman：stage（机器内部简称）→ 界面全称
 *   - workEntryAction / openableArtifacts：产物 → 「打开一份文件看看」该做什么（ADR-0010）
 *   - artifactName / artifactKind：产物路径 → **人读名字 / 类型词**（票 05：任何屏同一个名字）
 *   - workEntryForEvent / workPathForEvent：事件卡片 → 结果文件（"查看"入口；票 13：结构字段 →
 *     label 形状 → 存在性；票 08：把"本来没有候选"与"认得出候选但文件还不在产物清单里"分开）
 *   - phaseOfSegment：分段的阶段号（服务端 `phase` 优先，缺了按 `SEGMENT_PHASE[kind]` 兜底）
 *   - stepWord：工作台状态词（**共用**：`materialConversionActivityText` 与
 *     `stage-step-model` 的阶段 / 步模型都取它这一份）
 * ⚠️ 候选 06：分段 → **步** 的归一（`stepsOf` / `stepCount` / `phaseSteps` / `phaseSummary` 等）
 * **已于 2026-09-25 整体迁入 `src/ui/stage-step-model.js`**——那才是这一步知识的唯一拥有者。
 * 本文件与它的依赖方向是单向的：`stage-step-model → view-rules`。
 *
 * 阶段片不再是"一份文件"的入口（2026-09-21 用户裁决）：它是导航面，落点是阶段页；
 * 阶段页要的 `openableArtifacts` 留在本模块（候选 08 的地盘，模型只消费它的结果）。
 *
 * 双端共享领域件（goldChapterNo 等）以 src/domain-rules.js 为单一事实来源；
 * 本模块只做展示映射，不含业务状态。
 */
import {
	artifactKind,
	goldChapterNo,
	productOpenMode,
	gateHuman,
	stageLabelHuman,
	segmentHuman,
	GATE_TOPIC,
	PHASE_UI_SOURCE,
	SEGMENT_PHASE,
} from "../domain-rules.js";
import { formatTime, humanDuration } from "./rules.js";

// 界面词的两侧共用部分（关卡主题表 / 「第 N 次拍板」模板 / 交办阶段标签翻译 / 六格阶段词）
// 住在 src/domain-rules.js 的「界面词」区：服务端也要产出人话文本（《过程记录.md》、交办唤醒
// 消息、提案正文标题都是给人读的），共用件只住 UI 层就得在服务端抄第二份（grill Q24）。
// 这里只保留 UI 专属映射，并把共用件再导出——UI 组件照旧从本文件取词。
export { artifactKind, gateHuman, stageLabelHuman };
export const GATE_UI = GATE_TOPIC;

// ── 界面用词表（批 2，2026-09-20 用户逐行拍板）────────────────────────────────
// 病灶不是"谁写错了"，是同一件事同时存在四套词源：本文件的 STAGE_HUMAN、
// event-cards 的 SHORT_PHASE_LABELS、后端 stageLabel、以及 domain-rules 的 PHASES。
// 现在**界面词只此一份**：UI 组件一律经这里取词，不再直接渲染服务端 label。
// ⚠️ 只改「用户会读到的字」；账本字段名 / 文件名 / 事件 type / 产物路径一律不动。
// 依据：.scratch/ui-rebuild/行话替换表.md；术语见 CONTEXT.md。

/**
 * 六阶段 → 界面词（阶段片那 6 个窄格与「一起做到：X」共用）。
 *
 * ⚠️ 2026-09-20 复审：这张表**下沉到领域规则模块**（`PHASE_UI_SOURCE`）再由此再导出。
 * 原先是本文件与 `domain-rules.STAGE_LABEL_UI`（六阶段 canonical 全称 → 界面词）各存一份、
 * 两处逐字相同的映射——改一处漏一处就是本批在治的「同一件事说两种话」，故按 CONTEXT.md
 * 「界面上的字只此一份：两侧共用部分住领域规则模块、展示派生模块再导出」合并为一份。
 * 取词路径不变（UI 仍旧 `import { PHASE_UI } from "./view-rules.js"`）。
 */
export const PHASE_UI = PHASE_UI_SOURCE;

export const phaseUi = (n) => PHASE_UI[n] ?? "";

// 关卡主题表（GATE_TOPIC）与「第 N 次拍板」模板（gateHuman）见 domain-rules.js「界面词」区，
// 已在文件顶部再导出为 GATE_UI / gateHuman——服务端也要用它产出人话文本，故不留在本层。

/**
 * 分段（`/textbook/process` 那批）→ 界面词。**按 seg.key 认，不认服务端 label**——
 * 服务端 label（源探查/关卡N/最佳范例章（风格母版）/铺章…）是账本词，不属于界面。
 * ⚠️ 2026-09-20 复审 a-4：实现下沉到领域规则模块（`segmentHuman`），服务端写《过程记录.md》的
 * 「定点修改」条目也用它——同一件事不再两处各写一份译法。此处再导出，UI 取词路径不变。
 */
export { segmentHuman };

// 阶段（stage）→ 界面词。⚠️ 与后端 stageLabel 的「范例章」是故意分工：
// 机器内部/账本/文件用简称，界面给用户看界面词（见 CONTEXT.md 与界面用词表）。
//
// ⚠️ 2026-09-27 补齐 `gate`（票 `audit-matrix-contract/05`）：这张表原来**独独缺 `gate`**，
// `stageHuman('gate')` 返回空串——空串正是「谁想在界面上说方案关都拼不出来」的同一种病。
// 机器阶段是**七个**（`docs/协作模型.md:220` 逐字列的就是这七个：explore / gate（带第几关）/
// outline / gold / chapters / merge / final），今天一格不漏。
//
// `gate` 那一格取**既有措辞**「拍板定方案」，**不新创风格**：
//   · `CONTEXT.md:192`（2026-09-20 用户逐行拍板）阶段片第 3 格＝「拍板定方案」；
//   · 与本表其余几格同属 `PHASE_UI_SOURCE` 家族——`explore`/`gold`/`chapters`/`final`
//     四格与 `PHASE_UI_SOURCE[2]/[4]/[5]/[6]` 逐字相同，`gate` ＝ `PHASE_UI_SOURCE[3]`；
//     （本表另两格 `outline`/`merge` 不在 `PHASE_UI_SOURCE` 里，是阶段层面更细的说法。
//     防漂由 `test-wording-invariants.mjs` 那条断言兜住，不靠这里改写法。）
//   · `CONTEXT.md:237` 逐字：「『拍板定方案』含三次拍板 ＋ 章节安排」——所以**阶段层面**
//     `gate` 叫「拍板定方案」、`outline` 叫「章节安排」，两格分工不同、各叫各的，
//     **不要**因为阶段片第 3 格叫「拍板定方案」就把 `outline` 也改成那一句。
//   · ⚠️ **不叫「第 N 关」**（`CONTEXT.md:192` 明写界面不叫那个；`ALT_GATE_NUMBER_RE` 会判红）。
//     带关卡号的那一档是**另一份词**：`gateHuman(n)`→「第 N 次拍板 · <主题>」。
export const STAGE_HUMAN = {
	explore: "读材料挑重点",
	gate: "拍板定方案",
	outline: "章节安排",
	gold: "最佳范例章",
	chapters: "写完整本",
	merge: "合并成书",
	final: "最后检查",
};

/**
 * 阶段名 → 界面词。
 *
 * ⚠️ 2026-09-27（票 `audit-matrix-contract/05`）：原来是 `STAGE_HUMAN[stage] ?? ""`——
 * **收到未知阶段就静默返回空串**。空串不是「兜底」，它和本票那格病因**是同一种病**：
 * 调用点拿到的不是词、是「没有词」，而界面那一格**照旧渲染、只是悄悄少一截**
 * （`src/ui/event-cards.js:1151` 判 `pendingStageLabel !== ""` 才出「我正在做 · <阶段名>」，
 * 空串会让它整个不出现——**屏上看不出出过错**）。
 *
 * 兜底选「**原样返回那个机器阶段名**」而不是抛错，理由与仓库里**另外两处同一选择**逐字一致：
 *   · `src/domain-rules.js` `segmentHuman`：「译不出来原样显示：**宁可露出机器词，也不猜错**」；
 *   · `src/ui/event-cards.js:1160`：「译不出来（未登记的原样返回）才原样显示——
 *     **宁可露出机器词，也不猜错**」。
 * 不抛错是因为本函数**在渲染路径上**（`src/client-entry.js:1179`）：抛错会把一个
 * 「显示缺口」升级成**整块工作台崩掉**，代价严格更大；而原样返回恰好把缺口**显出来**
 * （屏上会出现一个 `gates` 之类），那正是「不静默」要的效果。
 *
 * ⚠️ `null` / `undefined` / `""` 仍然返回 `""`——那不是「译不出来」，是**本来就没有阶段**
 * （调用点在没有待办时就是这么传的），空串在那里是正确答案，不是缺口。
 */
export const stageHuman = (stage) => {
	const key = typeof stage === "string" ? stage : "";
	return STAGE_HUMAN[key] ?? (key === "" ? "" : key);
};

// 交办阶段标签的翻译（stageLabelHuman）同样在 domain-rules.js「界面词」区，已在顶部再导出：
// 服务端 wakeMainAI 的交办唤醒消息与《过程记录.md》要和 UI 用同一份译法，
// 否则又是「一处改、另一处漏」——正是本轮在修的毛病。

/**
 * 账本事件 → 界面词（事件卡兜底分支用）。
 * ⚠️ `domain-rules.EVENT_META.label` 是**双端含义表**（ADR-0009 决策 1）：账本、播报、
 * 机器回给主 AI 的话都按它说，所以不改服务端；但它是"机器怎么称呼这件事"，不是"用户读到
 * 的字"。这里只覆盖仍露机器词的那几条（关卡/质量门/金标准/终检），其余沿用表里已有的短人话。
 */
export const EVENT_UI = {
	"textbook/gate-proposal": "拍板方案",
	"textbook/gate-decision": "拍板结果",
	"textbook/quality": "机器检查",
	"textbook/gold-opinion": "最佳范例章意见",
	"textbook/gold-seal": "最佳范例章定稿",
	"textbook/gold-chapter": "最佳范例章",
	"textbook/final-approve": "最后检查认可",
	// 票 10（判定三 #10）：服务端 EVENT_META 的 label 是「AI 自查报告」——「自查」是机器视角
	// （谁查谁？），界面一律说「检查」。这条覆盖让兜底分支也走同一份词。
	"textbook/ai-report": "AI 检查报告",
};

export const eventHuman = (type, fallback) =>
	EVENT_UI[type] ?? fallback ?? "";

/**
 * 机器检查项 → 界面词（批 2）。
 * ⚠️ 服务端的 `name` 是**机器身份**：CONTEXT.md、docs/adr、以及机器回给主 AI 的 `issues`
 * 都按它说话，所以不改服务端；由 UI 翻译。未登记的项原样显示（宁可露出机器词，也不猜错）。
 */
export const CHECK_UI = {
	"成品文件齐全": "整本书文件齐全",
	"所有章节都有审计记录": "每章都有检查记录",
	"没有遗留的 AI 笔记/脚手架": "没有留下 AI 的草稿痕迹",
	"练习与答案齐全": "练习和答案都在",
	"与已拍板的设计一致": "和你说定的设计一致",
	// ⚠️ 票 14（承诺账 E）：这两条白话名原来把机制说大了——
	//   「源材料引用可追溯」的机器判据只是 `sourceCount > 0`（用上了至少一份材料），不验任何一处内容；
	//   「进度账本齐全」只验 `work/progress.md` 存在，不验「每一步」都有行。
	// 名字即承诺，所以按机制收（收名，不动服务端判据）。
	"源材料引用可追溯": "用上了你上传的材料",
	"风格线条条有着落": "你提的风格要求都处理了",
	"进度账本齐全": "有工作记录可查",
	"成品无乱码（U+FFFD）": "没有乱码",
	"章节数符合大纲": "章节数和说好的一致",
	"必含板块齐全（契约项）": "该有的板块都在",
	"无禁用词（契约项）": "没有出现不该用的词",
	"章节引用可追溯（无引用矛盾）": "每章标的材料出处都真实存在",
	// 票 20：这一项从线索级警示改成**真门槛**（有重复标题即拦交付），白话名跟着写实——
	// 机器查的是**全书**标题去重（同章内重复也算），不是只查「跨章」，所以按判据收成这一句。
	"无重复标题": "整本书里没有重复的标题",
};

export const checkHuman = (name) => CHECK_UI[name] ?? name;

// 焦点区（主卡）选哪张卡：把 WorkbenchView 的内联路由链抽成纯函数，可独立测试。
// ⚠️ 路由顺序即语义顺序（与历史实现一一对应）：拍板关卡 → 各确认闸门 → 交付 →
// 铺章章节卡 → 上传材料 → 状态卡。改了顺序必须同步改这里与调用点。
export function focusCardKey(meta, gate) {
  if (gate !== null && gate !== undefined && gate.status === "awaiting")
    return "gate";
  const status = meta?.status ?? "";
  if (status === "awaiting-explore") return "explore";
  if (status === "awaiting-outline") return "outline";
  if (status === "awaiting-gold") return "gold";
  if (status === "awaiting-final-approval") return "final";
  if (status === "delivered") return "delivered";
  // 铺章章节卡（含全章过目确认）：真实与演示共用——demo 全镜像后演示书也停在
  // awaiting-chapters-review 等人过目（2026-09-03 实测：`demo!==true` 会把演示书踢去
  // StatusCard，没有「都过了，交工」按钮，死在过目闸门）。
  if (meta?.phase === 5) return "chapters";
  if (meta?.phase === 1) return "upload";
  return "status";
}

/**
 * 「打开一份文件看看」的动作分派（ADR-0010 决策 1/2；票 02/05 的唯一判据）：
 *   'sidebar' 有正文的产物 → 交给 DSH 右栏预览（地址由 file-address 拼）；
 *   'inline'  机器产物的人读形态（knowledge-map.json）→ 卡片内联折叠清单，**不开右栏**；
 *   'none'    机器产物/源材料 → 不给人读，什么都不开。
 * ⚠️ 判据集中在 domain-rules.productOpenMode（前端路由与后端 /textbook/file 白名单共用）；
 * 这里是它与界面动作之间的那一跳，测试直接钉它，防「统一处理产物清单」时把知识地图
 * 顺手接上右栏（票 05 的防回潮断言）。
 */
export function workEntryAction(rel) {
	const mode = productOpenMode(rel);
	if (mode === "preview") return "sidebar";
	if (mode === "inline") return "inline";
	return "none";
}

/** 章号 → 章节正文路径（两位序号是契约；与 domain-rules 的 NUMBERED_CHAPTER_FILE_RE 同一个形状）。 */
const chapterRel = (n) => `work/chapter-${String(n).padStart(2, "0")}.md`;

/**
 * 拍板提案的路径形状：`提案/<前缀>N-vM.md`（v1 与 v2/v3 修订件同形）。
 * ⚠️ 文件名的两个汉字是**机器身份词**（产物路径——CONTEXT.md「界面用词表」的判定线明写
 * 「文件名、产物路径……一个字不改」），不是界面词；但判定线① 的字面量扫描会把 `src/ui/**`
 * 里**含中文的字符串**一律当人眼可见的字检查，产物路径恰好长成那样。故这里用码点写前缀，
 * 值就是 `提案/关卡`；正则字面量不在扫描面内（`/^提案\//` 照旧可用）。
 * 改这一行＝改契约：`domain-rules.productOpenMode` 的 GATE_PROPOSAL_RE 必须认同一个形状。
 */
const GATE_PROPOSAL_DIR = "提案/";
const GATE_PROPOSAL_PREFIX = "\u5173\u5361";
const gateProposalRel = (gate, version) =>
	`${GATE_PROPOSAL_DIR}${GATE_PROPOSAL_PREFIX}${gate}-v${version}.md`;

/** 事件 `data` 里能直接判定产物的结构字段（服务端将来补字段，这里自动生效，不必再改 label 判据）。 */
function structuredEventArtifacts(data) {
	const out = [];
	if (typeof data?.path === "string" && data.path !== "") out.push(data.path);
	if (Array.isArray(data?.artifacts))
		for (const rel of data.artifacts)
			if (typeof rel === "string" && rel !== "") out.push(rel);
	return out;
}

/**
 * label → 候选产物（票 13：**按形状判，不再只认 6 个写死字符串**）。
 * 真实账本里"同一件事由引擎跑还是由 action 跑"有两种写法（event-row-facts.md §4.4）：
 *   `合并成书` vs `合并成书（机器拼装 + AI 前言）`；`最后检查（质量门）` vs `最后检查（AI 自查 + 机器兜底）`；
 *   `写第N章《…》` vs **`第N章《…》完成（小助手执笔 + 小助手审计 + 机器验货）`**（真书每章完成全走这条）。
 * label 是**机器身份词**，只在判断上下文里用（比较/正则），一个字不改、也不落到人眼前。
 */
function eventLabelArtifacts(label, meta) {
	const out = [];
	if (label === "") return out;
	// 章级：起草那条带「写第N章」，交工那条带「第N章《…》完成（…）」。「完成」是交工那条的识别位。
	const write = /写第\s*(\d+)\s*章/.exec(label);
	if (write !== null) out.push(chapterRel(Number(write[1])));
	else if (label.includes("完成")) {
		const done = /第\s*(\d+)\s*章/.exec(label);
		if (done !== null) out.push(chapterRel(Number(done[1])));
	}
	// 其余各步：名字取**前缀**（带后缀的变体一并认）。
	if (label.startsWith("源探查")) out.push("work/explore.md");
	if (label.includes("章节骨架") || label.includes("章节安排")) out.push("work/outline.md");
	if (label.includes("最佳范例章")) out.push(chapterRel(goldChapterNo(meta)));
	if (label.startsWith("合并成书") || label.startsWith("最后检查")) out.push("work/book.md");
	// 拍板提案（`设计提案·关卡N` / `设计提案·第 N 关`，修订件带 `·修订vM`）→ 提案 v1 或 vM。
	const gate = /设计提案·(?:第\s*(\d+)\s*关|关卡\s*(\d+))(?:·修订\s*v\s*(\d+))?/.exec(label);
	if (gate !== null)
		out.push(gateProposalRel(gate[1] ?? gate[2], gate[3] === undefined ? 1 : Number(gate[3])));
	return out;
}

/** 带「在做的这件事」人话 label 的事件类型（交办 / 交工 / 阶段交办）。 */
const LABEL_EVENT_TYPES = new Set([
	"textbook/agent-start",
	"textbook/agent-end",
	"textbook/stage-start",
]);

/**
 * 事件卡片 → **候选产物**（判据的前两层＝结构化字段与 label 形状；存在性那一层不在这里）。
 * **唯一出处**（`event-row-entries/spec.md` 决策 15「判据集中在一个客户端纯函数里」；票 08）：
 * `workEntryForEvent` 与兼容入口 `workPathForEvent` 都只读这一份，不许任何调用点各建一套。
 * 判据分三层，**顺序即优先级**：
 *   ① **结构化字段优先**：`data.path` / `data.artifacts[]`（照产物判据 `workEntryAction` 收窄，
 *      机器产物与源材料不进候选＝不生死按钮），以及 `gate-proposal` 的 `gate` + `version`；
 *   ② **label 的形状**（见 `eventLabelArtifacts`）；
 *   ③ **存在性**（在 `workEntryForEvent` 里收口）：候选要真在 `/textbook/work` 的清单里才算数。
 *
 * ⚠️ 候选的**动作判据（`workEntryAction === 'sidebar'`）对三层一视同仁**，不只作用在 ①：
 * ②认得出的 `work/outline.md`（章节安排）是机器 JSON，判 `'inline'`（票 pipeline-wiring-gaps/09），
 * 放它过就是一个点了没反应的「打开」。
 *
 * ⚠️ **「自查第 N 章」故意没有候选**：它落的是 `work/audit-NN.md`——机器审计 JSON
 * （`{"passed":…,"issues":[…]}`，不是给人读的文件）。既不开右栏，也不给「查看结果」入口：
 * 留一个点了没反应的按钮，正是本轮在修的毛病。每章的检查结论经机器检查清单与
 * AI 自查报告给人读，不靠暴露这个文件（下面只认带「完成」的章级事件，故这条自动成立）。
 */
function eventArtifactCandidates(event, meta) {
	const data = event?.data ?? {};
	const candidates = [];

	for (const rel of structuredEventArtifacts(data))
		if (workEntryAction(rel) === "sidebar") candidates.push(rel);

	if (event?.type === "textbook/gate-proposal") {
		// 拍板提案那一行：`data.gate` + `data.version` 就是文件名（票 13：「不许恒返回空」）。
		const gate = String(data.gate ?? "").trim();
		const version = Number(data.version);
		if (/^[1-9]\d*$/.test(gate) && Number.isInteger(version) && version >= 1)
			candidates.push(gateProposalRel(gate, version));
	} else if (LABEL_EVENT_TYPES.has(event?.type)) {
		const label = String(data.label ?? "");
		for (const rel of eventLabelArtifacts(label, meta)) candidates.push(rel);
	} else if (event?.type === "textbook/phase-end") {
		const phase = Number(data.phase);
		if (phase === 2) candidates.push("work/explore.md");
		else if (phase === 4) candidates.push(chapterRel(goldChapterNo(meta)));
		else if (phase === 5 || phase === 6) candidates.push("work/book.md");
	}

	// ⚠️ **三层的候选一律过产物判据**（票 pipeline-wiring-gaps/09）：label 形状层认得出
	// 「章节骨架 → work/outline.md」，但那份文件内容是机器 JSON（`productOpenMode` 判 `'inline'`），
	// 而右栏通道只认 `'sidebar'`——候选放行出去，事件行就长出一个**点了没反应**的「打开」。
	// 那一族的出口是卡片内联折叠清单（`chapters-map.foldOutline` / `KnowledgeMapBlock`），
	// 与「自查第 N 章」不给 audit JSON 入口同源：机器产物不生死按钮。
	return candidates.filter((rel) => workEntryAction(rel) === "sidebar");
}

/**
 * **候选的"存在性"收紧 + 提案的免检例外**（这一条判据只此一份）。
 * ⚠️ 例外＝`提案/`：产物清单（`/textbook/work`）从不列它（只列 `work/*.md`），而"落提案文档"与
 * "落这条事件"在服务端是同一函数里的前后两行（engine.js writeProposalDoc → appendEvent），
 * 故提案候选以**事件本身**为存在性证据——否则拍板那一行恒没有入口（票 13 点名的窟窿）。
 * 代价写在 `event-row-entries/spec.md` 决策 5：提案文件若被删，那一行就成了死按钮（今天 0 例）。
 */
function candidateExists(rel, files) {
	return rel.startsWith(GATE_PROPOSAL_DIR) || files.some((f) => f?.path === rel);
}

/**
 * 事件行入口判据的**唯一出处**（票 08：把今天同一个 `null` 的两种处境分开）。三类结果：
 *   · `{ kind: "open", path, label }` —— 认得出候选**且**那份文件在产物清单里（或它是提案）。
 *     形状与旧 `workPathForEvent` 的返回**同一层**（`path`/`label` 不在 `kind` 下），
 *     故「打开」那条路径原样吃它：`item: entry` / `viewWork(entry)`。
 *   · `{ kind: "blocked" }` —— **认得出候选、一件都不在产物清单里**（且都不是提案）。
 *     语义＝"这件事有产物、只是结果还没生成"（票 08 的灰字那一类，`{ kind: "blocked" }`
 *     **故意不带 path**：决策 8 判它「不起名」，不给渲染层任何能起名的把手）。
 *   · `{ kind: "none" }` —— **本来就没有候选**（过程碎语、机器产物、源材料、没有 gate/version
 *     的旧提案事件……）。这一类的行什么都不长：给它们控件就是点了没反应的死按钮。
 *
 * ⚠️ 已知前提（`event-row-entries/spec.md` 决策 8 的代价条）：本判据说的是"候选不在产物清单里"，
 * **文件被删**时 `blocked` 那句灰字会说假话；真账本 7 本 0 例，实现时遇到了再收紧措辞。
 */
export function workEntryForEvent(event, meta, workFiles) {
	const files = Array.isArray(workFiles) ? workFiles : [];
	const candidates = eventArtifactCandidates(event, meta);

	const hit = candidates.find((rel) => candidateExists(rel, files));
	// label 是人读名字（票 05）：不回服务端 label、也不把路径原文当名字。
	if (hit !== undefined) return { kind: "open", path: hit, label: artifactName(hit) };
	// 提案候选永远命中（上面那条免检例外），所以"有候选却没命中"就是在存在性上被挡掉那一类。
	return candidates.length > 0 ? { kind: "blocked" } : { kind: "none" };
}

/**
 * 兼容入口（票 07 的渲染层与既有断言照旧吃它）：有得打开就给 `{ path, label }`，**其余一律 `null`**。
 * ⚠️ 与 `workEntryForEvent` 是**同一份判据**的两种取景——本函数只把 `open` 那一支的 `kind` 摘掉，
 * 返回形状与票 08 之前逐字相同（`blocked` 与 `none` 在这条路上都读成 `null`，行为不变）。
 */
export const workPathForEvent = (event, meta, workFiles) => {
	const entry = workEntryForEvent(event, meta, workFiles);
	return entry.kind === "open" ? { path: entry.path, label: entry.label } : null;
};

// ── 阶段页（点阶段片落到的那一页，2026-09-21）────────────────────────────────
// 用户裁决（经 /prototype 三轮）：阶段片是**导航面**——点一格＝去那一步的页面，不是打开某份
// 文件；页面按每一步的天性分别定制；产物一律由写着「查看…」的显式按钮交给 DSH 右栏
// （ADR-0010 决策 1/2）。下面这些是那一页要用的展示派生，纯函数、可独立测试。

/**
 * 分段的阶段号。
 *
 * 首选服务端给的值（`buildProcessMap` 按 `domain-rules.SEGMENT_PHASE` 打），**缺了就按同一张表
 * 从 `kind` 兜底**：宿主的服务端半部要重启进程才生效（2026-09-21 实测：宿主进程还停在改动前，
 * `/textbook/process` 17/17 段都不带 `phase`），此时如果没有兜底，每一个阶段页都会渲染成
 * 「这个阶段还没有可看的步。」——同一份知识查同一张表，不是猜。
 */
export function phaseOfSegment(seg) {
	if (Number.isInteger(seg?.phase)) return seg.phase;
	const byKind = SEGMENT_PHASE[seg?.kind];
	return Number.isInteger(byKind) ? byKind : null;
}

/**
 * 阶段 / 步 归一（章三步、材料准备第一步、`3N+10`、四态、焦点双 key、计数、阶段分组、四态行
 * `rowText`）**已于候选 06 整体迁入 `src/ui/stage-step-model.js`**——那里是这一步知识的唯一
 * 拥有者（`createStageStepProjector({meta,segments})` → `project({kind})`）。本文件不再导出
 * `stepsOf` / `stepCount` / `phaseSteps` / `phaseSummary` / `stepLabel` / `stepSegment` /
 * `phaseSegments` / `MATERIAL_STEP_KEY` / `chapterStepKey` / `stepDetailLines`，也不再有
 * `chapters-map.stepIcon` / `stepRowText`：两屏都吃模型行上算好的 `rowText`。
 *
 * 本文件保留的是**不属于这一步模型**的展示派生：界面词、焦点主卡路由、产物 / 事件入口、
 * 产物名与开预览判据、拍板结论、产物事实文本、转换活动行、`PHASE_INTRO`，以及 `stepWord`
 * （`materialConversionActivityText` 与模型共用，模型单向 import 本文件）。
 *
 * 依赖方向：**stage-step-model → view-rules**（单向）。本文件不 import 新 module，避免成环。
 */

// ── 产物名（票 05：一份产物在任何屏上只用一个名字）────────────────────────────
//
// 裁决（.scratch/workbench-transitions/issues/05-开文件按钮的文案规则.md，Answer 1/2/3/6/7）：
//   · **名字由客户端出、纯按路径形状判**——`artifactName` 不读文件、不联网、不吃服务端 payload，
//     「同一份产物在任何屏幕同一个名字」由此天然成立（不靠调用点自律）；
//   · UI 组件**不再渲染服务端 label**（CONTEXT.md「界面用词表」早就写了这条，本批才落地）；
//   · 相对路径原文（含按钮 title）一律不上屏：认不出路径退回**类型词**（artifactKind），
//     类型词也认不出就是「文件」——绝不把路径本身当名字；
//   · 名字里**不带章标题**（标题留在步名上）；拍板方案 **v1 不写版次**、v2+ 追加「（第 M 版）」；
//     调用点要补信息只能加限定语（`artifactNameWith`，格式「基名·限定语」——今天只有旧稿要用）。

/** 路径归一化：反斜杠与 `./` 前缀不参与判形状（与 domain-rules.productOpenMode 同一口径）。 */
function relPath(rel) {
	return String(rel ?? "")
		.replace(/\\/g, "/")
		.replace(/^(?:\.\/)+/, "");
}

/** `work/chapter-NN.md`（两位序号是契约）。
 *  读侧宽松（`\d+`）：**能不能打开**由 domain-rules.productOpenMode 判（那儿才要求两位），
 *  名字这一层只负责"叫得出"——一份旧书里少补了个零的正文不该在界面上没名字。 */
const CHAPTER_NAME_RE = /^work\/chapter-(\d+)\.md$/;
/** 旧版产物目录（`work/_旧版产物/<文件>.<stamp>`；深改归档还会多一层 `深改-<id>/`）。 */
const ARCHIVED_NAME_RE = /^work\/_旧版产物\/(?:[^/]+\/)?(.+)$/;
/** 三次拍板的提案（`提案/关卡N-vM.md`，v1 与 v2/v3 修订件同形）。 */
const GATE_PROPOSAL_NAME_RE = /^提案\/关卡(\d+)-v(\d+)\.md$/;
/** 材料转换稿（`sources-md/<材料名>.md`，或 MinerU 拆份后的 `sources-md/<材料名>/…`）。 */
const CONVERTED_SOURCE_NAME_RE = /^sources-md\/(.+)$/;
/** 旧版产物的稿次尾巴（`.3f2k9x` 这类 base36 时间戳）。 */
const DRAFT_STAMP_RE = /\.[0-9a-z]+$/i;

// 产物的人读类型词（artifactKind）住在 domain-rules.js，由本模块再导出，
// 这样 UI 与服务端事实分类共用同一份纯规则；名字层的路径正则仍留在下面。

/** 旧稿文件名去掉稿次尾巴；尾巴一去就没了 `.md` 的名字说明它不是稿次（别把扩展名当稿次）。 */
function draftBaseName(file) {
	const stripped = file.replace(DRAFT_STAMP_RE, "");
	return stripped.endsWith(".md") ? stripped : file;
}

/**
 * 路径 → 名字（认不出返回 ""，由 `artifactName` 退类型词）。逐条＝票 05 Answer 6 的表格。
 * 顺序即优先级：旧版产物那一支要把内层文件名拿回来再走一次同一张表，故「旧稿」由限定语加出来。
 */
function nameForRel(path) {
	const chapter = CHAPTER_NAME_RE.exec(path);
	if (chapter !== null) return `第 ${Number(chapter[1])} 章`;
	const archived = ARCHIVED_NAME_RE.exec(path);
	if (archived !== null) {
		const base = nameForRel(`work/${draftBaseName(archived[1])}`);
		return base === "" ? "" : `${base}·旧稿`;
	}
	const gate = GATE_PROPOSAL_NAME_RE.exec(path);
	if (gate !== null) {
		const name = `${gateHuman(gate[1])}的方案`;
		const version = Number(gate[2]);
		// v1 不写版次（第一次的方案不需要"第 1 版"这种废话）；v2+ 才追加「（第 M 版）」。
		return version >= 2 ? `${name}（第 ${version} 版）` : name;
	}
	const source = CONVERTED_SOURCE_NAME_RE.exec(path);
	if (source !== null) {
		const material = source[1].split("/")[0].replace(/\.md$/i, "");
		return material === "" ? "材料转换稿" : `${material}的转换稿`;
	}
	if (path === "work/explore.md") return "读材料挑重点的结果";
	if (path === "work/outline.md") return "章节安排";
	if (path === "work/style-spec.md") return "写作规范";
	if (path === "work/book.md") return "成书";
	// 过程记录（ADR-0015）：全局产物、写给人读的流水账——名字走词表，不再退成类型词「文件」。
	// 它**不属任何一步**，所以只出现在焦点区底部那条常驻小条上，不进任何一步的文件清单。
	if (path === "过程记录.md") return "过程记录";
	return "";
}

/**
 * 这份产物在界面上叫什么（票 05 的名字 API；UI 取词的唯一入口）。
 * 纯按路径形状判：**不读文件、不联网、不吃服务端 payload**——同一路径在任何屏、任何时刻同名。
 * 返回值**绝不含 `/`、绝不含 `.md` 这类扩展名**（认不出 → 类型词；类型词也认不出 → 「文件」）。
 */
export function artifactName(rel) {
	const path = relPath(rel);
	const name = nameForRel(path);
	return name === "" ? artifactKind(path) : name;
}

/** 「基名·限定语」：调用点要补信息（今天只有旧稿的稿次）只能这样加，不改基名。 */
export function artifactNameWith(name, qualifier) {
	const base = String(name ?? "");
	const extra = String(qualifier ?? "").trim();
	return extra === "" ? base : `${base}·${extra}`;
}

/** 产物事实里的正文/检查记录分类（路径与既有产物判据同形，不另造一套）。 */
const AUDIT_FACT_PATH_RE = /^work\/audit(?:-[^/]+)?\.md$/i;

/** 事实里的时间是服务端给的；这里只做有效性检查与既有的可读时间格式化。 */
function artifactFactTime(modifiedAt) {
	if (modifiedAt === null || modifiedAt === undefined || modifiedAt === "") return "";
	let date;
	try {
		date = modifiedAt instanceof Date ? modifiedAt : new Date(modifiedAt);
	} catch {
		return "";
	}
	if (!Number.isFinite(date.getTime())) return "";
	return formatTime(date);
}

/** 一条产物事实的展示分类：只认服务端给的 kind，缺省时再按既有路径形状认。 */
function artifactFactKind(fact, path) {
	const serverKind = String(fact?.kind ?? "").trim();
	if (serverKind === "检查记录" || AUDIT_FACT_PATH_RE.test(path)) return "检查记录";
	if (serverKind === "正文" || artifactKind(path) === "正文") return "正文";
	return "";
}

/**
 * 服务端随分段下发的盘上事实 → 给人看的第二行。
 *
 * 这里**只读** `seg.artifactFacts`：产物存在与新鲜度都是服务端已经判定的事实，浏览器不拿
 * 文件 mtime 互相比较，也不把 `current` 翻成「已完成」。章节仍用现有 `artifactName`/`正文`
 * 分类，检查记录沿用界面词「检查记录」；其它事实只露 `artifactName`，绝不把机器路径带上屏。
 */
export function artifactFactText(seg) {
	const facts = Array.isArray(seg?.artifactFacts) ? seg.artifactFacts : [];
	const lines = [];
	for (const fact of facts) {
		if (fact === null || typeof fact !== "object") continue;
		const path = relPath(fact.path);
		const kind = artifactFactKind(fact, path);
		const time = artifactFactTime(fact.modifiedAt);
		if (kind === "检查记录") {
			// stale 的结论只来自服务端；即便时间不可读，也要把「属于旧稿」说清楚。
			lines.push(auditFactText(fact, time));
			continue;
		}
		const name = artifactName(path);
		if (kind === "正文")
			lines.push(time === "" ? `正文 · ${name}` : `正文 · ${name}（${time}）`);
		else lines.push(time === "" ? name : `${name}（${time}）`);
	}
	return lines.join(" · ");
}

/**
 * 「检查记录」那一句（**同源出口**：`artifactFactText` 与章节卡共用它，措辞只有这一份）。
 *
 * 服务端已判定 `freshness === "stale"` 时，那份检查记录是**正文改完之后**写的旧稿——即便
 * 时间读不出来，「比正文旧，属于旧稿」这句也照说（判据在 `src/workflow.js` 的
 * `buildArtifactFacts`，浏览器不自己比文件时间）。
 */
function auditFactText(fact, time) {
	const suffix =
		fact.freshness === "stale"
			? time === ""
				? "比正文旧，属于旧稿"
				: `${time}，比正文旧，属于旧稿`
			: time;
	return suffix === "" ? "检查记录" : `检查记录（${suffix}）`;
}

/**
 * 章节卡那一行的检查记录新鲜度（票 10 · P47 落点②）。
 *
 * 与 `artifactFactText` **同源**：读的是同一份服务端事实（`seg.artifactFacts`），用的是同一个
 * 出口 `auditFactText`，所以「比正文旧，属于旧稿」这句话在步清单与章卡上逐字相同。
 * 取不到新鲜度的事实（没下发／没 stat 到／这一章还没写检查记录）→ 返回空串，**不编一句**。
 *
 * @param {{key?: string, artifactFacts?: unknown}[]} segments 服务端下发的分段（每章一段）
 * @param {number} n 章号（1 基）
 */
export function chapterAuditFreshnessText(segments, n) {
	const list = Array.isArray(segments) ? segments : [];
	const seg = list.find((row) => row?.key === `chapter-${n}`);
	if (seg === undefined) return "";
	const facts = Array.isArray(seg.artifactFacts) ? seg.artifactFacts : [];
	for (const fact of facts) {
		if (fact === null || typeof fact !== "object") continue;
		const path = relPath(fact.path);
		if (artifactFactKind(fact, path) !== "检查记录") continue;
		return auditFactText(fact, artifactFactTime(fact.modifiedAt));
	}
	return "";
}

/**
 * 阶段页 / 事件行那一行显示的名字（`openableArtifacts` 的 `label` 就是它）。
 * ⚠️ 2026-09-21（票 05 决策 1/3）：**不再**优先服务端 label、**不再**退回 `String(path)` 路径原文——
 * 名字一律走 `artifactName`。`workFiles` / `seg` 两个参数留着只为调用点签名不变（本函数不读它们）。
 */
export function artifactLabel(workFiles, path, seg) {
	return artifactName(path);
}

/**
 * 这一步能**在右栏打开**的产物（动作是 `sidebar` 的那一批）。
 * ⚠️ 机器产物（`work/audit-NN.md`，动作 `none`）与走卡片内联的（`work/knowledge-map.json`，
 * 动作 `inline`）都不进清单：前者会变成点了没反应的死按钮，后者点了会把 JSON 塞进右栏
 * （ADR-0010 决策 2）。知识地图的人读清单由那一步自己的块就地展示。
 */
export function openableArtifacts(seg, workFiles) {
	return (seg?.artifacts ?? [])
		.filter((rel) => typeof rel === "string" && workEntryAction(rel) === "sidebar")
		.map((rel) => ({
			path: rel,
			label: artifactLabel(workFiles, rel, seg),
			kind: artifactKind(rel),
		}));
}

/** 拍板结论（只有拍板那几步有）。 */
export function decisionText(seg) {
	const decision = seg?.decision;
	if (decision == null) return null;
	// 第 1 版不写版次、第 2 版起写「· 第 M 版」（CONTEXT「产物名」的 v1 规矩 + 老分隔符 `·`）。
	// 分隔符取 `·` 而不是括号：括号已经被你的备注占着（`✅ 通过（备注）`）。
	const versionSuffix = (raw) => {
		const version = Number(raw);
		return Number.isInteger(version) && version >= 2 ? ` · 第 ${version} 版` : "";
	};
	// 票 workbench-transitions/25：第三态「正在等拍板」自己说话。留白看着干净，但用户在阶段页上
	// 找不到反馈，只当卡片坏了；更不能沿用「已驳回」那两个字。
	// ⭐ 版次**只**从 `proposalVersion`（最新提案那一版＝用户此刻正要拍的那一版）取。
	// 不许退回 `version`：那一列按票 23 的语义是**已定下来的那一版**，「v1 驳回、v2 在等」时是 1——
	// 印出来就是一句假话，且比「显示成已驳回」更难被察觉。老 payload（服务端那半部还没重启）没有
	// `proposalVersion` 时**宁可不印版次**：说不清是哪一版，就别点名。
	if (decision.status === "awaiting") return `待拍板${versionSuffix(decision.proposalVersion)}`;
	const verdict = decision.approved === true ? "✅ 通过" : "❌ 驳回";
	return `${verdict}${versionSuffix(decision.version)}${decision.note ? `（${decision.note}）` : ""}`;
}

/**
 * 每一步走到哪了 → 工作台状态词（CONTEXT.md：只允许这三个词 + 还没到）。
 *
 * 仍住在 `view-rules`：它被 `materialConversionActivityText`（转换活动行）与
 * `stage-step-model`（阶段 / 步模型，两屏的行文）**共用**——工作台状态词只此一份
 * （CONTEXT.md「工作台状态词」）。模型单向 import 本文件，不反向。
 */
export function stepWord(status) {
	if (status === "done") return "已完成";
	if (status === "waiting-user") return "轮到你";
	if (status === "active") return "我正在做";
	return "还没到这一步";
}


// 这些事件只用来圈定「当前这一轮转换」；**不把 stage-start / agent-start 当计时起点**。
// 转换期可靠的可见事实是本轮 mineru-progress：首条之后，后续每条都只是心跳，不能重置已用时长。
const CONVERSION_RUN_BOUNDARIES = new Set([
	"textbook/stage-start",
	"textbook/agent-start",
	"textbook/agent-end",
	"textbook/error",
	"textbook/rollback",
	"textbook/source-added",
]);

function currentConversionProgress(events) {
	const list = Array.isArray(events) ? events : [];
	let runStart = 0;
	for (let i = list.length - 1; i >= 0; i -= 1) {
		if (CONVERSION_RUN_BOUNDARIES.has(list[i]?.type)) {
			runStart = i + 1;
			break;
		}
	}
	const progress = [];
	for (let i = runStart; i < list.length; i += 1) {
		const event = list[i];
		const stage = typeof event?.data?.stage === "string" ? event.data.stage.trim() : "";
		if (event?.type === "textbook/mineru-progress" && stage !== "") progress.push(event);
	}
	return { first: progress[0] ?? null, last: progress[progress.length - 1] ?? null };
}

function eventTime(event) {
	return Number.isFinite(event?.time) && event.time > 0 ? event.time : null;
}

/**
 * 材料转换期的唯一一行活动明细；上传卡与阶段页材料清单共用这一份。
 *
 * 计时起点取**当前这一轮最早一条可见 mineru-progress**：本票不把 stage-start / agent-start
 * 当作跨屏计时契约；即便某轮账本里碰巧有这类事件，后续 progress 每几秒刷新一次，
 * 拿最新一条也会把总时长清零。首条进度尚未到达时，
 * `meta.updatedAt` 是 `converting=true` 那次写入的时刻，只在这段窗口里兜底；已有进度后绝不再用它。
 * 没有 stage 时只说「转换材料」，不猜 n/m。
 */
export function materialConversionActivityText(meta, events, now = Date.now()) {
	if (meta?.converting !== true) return null;
	const { first, last } = currentConversionProgress(events);
	const stage = typeof last?.data?.stage === "string" ? last.data.stage.trim() : "";
	const startedAt = eventTime(first) ?? eventTime({ time: meta?.updatedAt });
	const parts = [stepWord("active"), stage === "" ? "转换材料" : stage];
	if (startedAt !== null) parts.push(`已用 ${humanDuration(now - startedAt)}`);
	return parts.join(" · ");
}

/** 每个阶段在干什么（阶段页顶部一句说明；界面词）。 */
export const PHASE_INTRO = Object.freeze({
	1: "你把教材 PDF 传上来，机器把它转成能读的正文。",
	2: "AI 读完材料、挑出重点，等你确认。",
	3: "三次拍板：定下学习目标与难点、教学方法与板块、全书架构与章节，再排好章节。",
	4: "先写一章给你过目，定下全书风格。",
	5: "一章一章写，每章机器检查过，你随时能抽查提意见。",
	6: "AI 把全书整体调整一遍 + 机器硬检查，你认可后交付。",
});
