/**
 * 展示派生（view rules）——架构评审候选 4 收口：壳（client-entry WorkbenchView）不养展示派生。
 *
 * 五个映射集中在此，纯函数、显式吃 (meta, workFiles) 输入，可独立测试：
 *   - STAGE_HUMAN / stageHuman：stage（机器内部简称）→ 界面全称
 *   - workEntryAction / openableArtifacts：产物 → 「打开一份文件看看」该做什么（ADR-0010）
 *   - artifactName / artifactKind：产物路径 → **人读名字 / 类型词**（票 05：任何屏同一个名字）
 *   - workEntryForEvent / workPathForEvent：事件卡片 → 结果文件（"查看"入口；票 13：结构字段 →
 *     label 形状 → 存在性；票 08：把"本来没有候选"与"认得出候选但文件还不在产物清单里"分开）
 *   - stepsOf / stepCount：分段 → **步**（票 01：一章＝写/审/复核三步；总数 3N + 10）
 * 阶段片不再是"一份文件"的入口（2026-09-21 用户裁决）：它是导航面，落点是阶段页；
 * 阶段页要的派生（phaseSteps / phaseSummary / openableArtifacts / stepWord）也在本模块底部。
 *
 * 双端共享领域件（goldChapterNo 等）以 src/domain-rules.js 为单一事实来源；
 * 本模块只做展示映射，不含业务状态。
 */
import {
	goldChapterNo,
	productOpenMode,
	gateHuman,
	stageLabelHuman,
	segmentHuman,
	GATE_TOPIC,
	PHASE_UI_SOURCE,
	SEGMENT_PHASE,
} from "../domain-rules.js";

// 界面词的两侧共用部分（关卡主题表 / 「第 N 次拍板」模板 / 交办阶段标签翻译 / 六格阶段词）
// 住在 src/domain-rules.js 的「界面词」区：服务端也要产出人话文本（《过程记录.md》、交办唤醒
// 消息、提案正文标题都是给人读的），共用件只住 UI 层就得在服务端抄第二份（grill Q24）。
// 这里只保留 UI 专属映射，并把共用件再导出——UI 组件照旧从本文件取词。
export { gateHuman, stageLabelHuman };
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
export const STAGE_HUMAN = {
	explore: "读材料挑重点",
	outline: "章节安排",
	gold: "最佳范例章",
	chapters: "写完整本",
	merge: "合并成书",
	final: "最后检查",
};

export const stageHuman = (stage) => STAGE_HUMAN[stage] ?? "";

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

	return candidates;
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

/** 一个阶段有哪几个分段（界面上读成「步」；服务端打 `phase` 优先，缺了按 kind 兜底——见上）。 */
export const phaseSegments = (segments, phase) =>
	(segments ?? []).filter((seg) => phaseOfSegment(seg) === phase);

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

/** 产物的人读类型词（按路径形状判，不按扩展名猜）。
 *  ⚠️ 票 05 起它是**名字缺省时的兜底**——一行只显示一件名字，不再与名字并排显示。 */
export function artifactKind(rel) {
	const path = relPath(rel);
	if (CHAPTER_NAME_RE.test(path)) return "正文";
	// 旧版产物目录下的都是旧稿（章节、大纲、风格规范…归档后落在这里），名字那一层再加章号限定语。
	if (/^work\/_旧版产物\//.test(path)) return "旧稿";
	if (/^提案\//.test(path)) return "拍板方案";
	if (/^sources-md\//.test(path)) return "材料转换稿";
	if (path === "work/explore.md") return "挑重点的结果";
	if (path === "work/outline.md") return "章节安排";
	if (path === "work/style-spec.md") return "写作规范";
	if (path === "work/book.md") return "成书";
	return "文件";
}

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
	const verdict = decision.approved === true ? "✅ 通过" : "❌ 驳回";
	return decision.note ? `${verdict}（${decision.note}）` : verdict;
}

/**
 * 一个阶段的全部**分段**与可打开产物（段级粒度）。
 * ⚠️ 2026-09-23（票 05）：阶段页的行单位改成**步**了（见 `phaseSteps`），它只借本函数的
 * `name`/`intro`。本函数的契约与返回形状**不动**（段级派生的既有断言照旧；要段级清单的调用点
 * 也照旧吃它）。
 */
export function phaseSummary(segments, phase, workFiles) {
	const segs = phaseSegments(segments, phase).map((seg) => ({
		key: seg.key,
		title: segmentHuman(seg),
		status: seg.status,
		statusWord: stepWord(seg.status),
		decision: decisionText(seg),
		canDeepModify: seg.canDeepModify === true,
		artifacts: openableArtifacts(seg, workFiles),
	}));
	const artifacts = segs.flatMap((row) =>
		row.artifacts.map((item) => ({ ...item, step: row.title, stepKey: row.key })),
	);
	return {
		phase,
		name: PHASE_UI[phase] ?? String(phase),
		intro: PHASE_INTRO[phase] ?? "",
		segs,
		artifacts,
		doneCount: segs.filter((row) => row.status === "done").length,
	};
}

/**
 * 一个阶段有哪几步、每步摆哪几行产物（阶段页的行单位＝**步**，票 01）。
 *
 * ⚠️ 步一律走 `stepsOf`——四态词、步名、章内三步的拆分**只有那一处来源**（CONTEXT.md「全览条」：
 * 清单与阶段页取同一份四态行，不许各写一套）。本函数只加阶段页要的那一层：把这一步归属的那
 * 一段的可打开产物挂上（`openableArtifacts`：机器产物与走卡片内联的都不进清单）。
 *
 * **材料准备那一步没有段**（`segmentKey` 为 null）：它的产物行是**材料清单**（`meta.sources`），
 * 由阶段页自己摆（`MaterialsBody`），不从段上出——别为了凑齐在这里编一份假段。
 *
 * ⚠️ 章内三步（写 / 审 / 复核）共属同一段，于是三行挂的是**同一份段级产物**（`work/chapter-NN.md`）。
 * 这是有意的：定点修改的粒度仍是段（票 01 Q9），机器也分不出这份正文是三步里哪一步落下的
 * （不许为凑数手工编步）。要收窄到"审只有审计记录"，得先让机器长出那个状态位。
 *
 * 票 11 给每一行补上 `downstream`（影响预告的**人读名字**，见 `downstreamNames`）：确认框里
 * 「这一步改了，这些要一起重做」不再是空话——数据本来就在客户端（`seg.downstream`），
 * 只是先前没有出口译词、也没接到行上。
 */
export function phaseSteps(payload, phase, workFiles) {
	const { segments } = stepPayloadOf(payload);
	return stepsOf(payload)
		.filter((step) => step.phase === phase)
		.map((step) => ({
			key: step.key,
			title: stepLabel(step),
			status: step.status,
			// 四态词取自步模型自己算好的那一份（它就是 stepWord 的结果，不在这里第二次数）。
			statusWord: step.statusWord,
			chapter: step.chapter,
			// 定点修改的粒度是**段**：提交时把段 key 交出去，不是步 key（`chapter-1:write` 后端不认）。
			segmentKey: step.segmentKey,
			canDeepModify: step.canDeepModify === true,
			decision: decisionText(step.segment),
			artifacts: openableArtifacts(step.segment, workFiles),
			// 影响预告（票 11）：这一步改了会连带重做哪些**下游**，出口已经是人读名字。
			downstream: downstreamNames(step, segments),
		}));
}

/**
 * 影响预告的清单：这一步改了，后面哪些步要一起重做（**人读名字**，票 11）。
 *
 * 数据源＝服务端打在段上的 `seg.downstream`（`workflow.js` 的 `deepAffected`，装的是**段 key**：
 * `explore` / `gate-1` / `chapter-1` / `merge`…）。三个坑，一个都不能踩：
 *   · 引擎给的那份**含被改的段自己**（`[segKey, ...下游]`）——自己不是"下游"，滤掉；重复项去重；
 *   · key 一律在出口经 `segmentHuman` 译成人话（CONTEXT.md「界面用词表」：机器身份词不上屏）；
 *     章段的名字（`第N章 <标题>`）只有段对象才译得出，所以先按 key 在 `segments` 里找那一段；
 *   · 译不出来（`segmentHuman` 原样返回 key）时**这一项不报**——宁可少报，也不把 `chapter-1`
 *     这种机器词端到人眼前（票 05 当初就是为这条才把影响预告留给票 11）。
 */
function downstreamNames(step, segments) {
	const keys = Array.isArray(step.segment?.downstream) ? step.segment.downstream : [];
	const byKey = new Map();
	for (const seg of segments)
		if (seg?.key !== undefined && seg?.key !== null) byKey.set(String(seg.key), seg);
	const names = [];
	const seen = new Set();
	for (const raw of keys) {
		const key = String(raw ?? "");
		if (key === "" || key === step.segmentKey) continue;
		const seg = byKey.get(key);
		const name = seg === undefined ? segmentHuman(key) : segmentHuman(seg);
		if (name === "" || name === key) continue;
		if (seen.has(name)) continue;
		seen.add(name);
		names.push(name);
	}
	return names;
}

// ── 步（票 01：人眼唯一的工作单位）────────────────────────────────────────────
//
// 裁决（.scratch/workbench-transitions/issues/01-一步是什么.md，Answer 1/2/4）：
//   · **一步＝分段内部一道「在『我正在做』期间换了执行者或产物、且机器分辨得出」的工序**。
//     今天只有**章内**有这种状态位（`meta.chapterPipeline[].stage` 五态，权威 src/workflow.js:105-110）
//     → **一章＝写 / 审 / 复核三步**；**其余每段＝一步**；**材料准备（阶段 1）＝第一步**。
//   · 总数 = **3N + 10**（N＝章数）。章未排定前只算**结构上已经存在**的步（今天＝10），
//     不按默认章数猜（会跳的假数不如不给）——`stepCount` 把 `known`/`total`/`chaptersPlanned`
//     交出去，那句话由 UI 拼（"已知 10 步 · 章节排定后补齐" / "全书 3N+10 步 · 还剩 M 步"）。
//   · **分段仍是机器层的账本单位**（`segments[]`、`deepAffected` 的键、定点修改的粒度＝整段，
//     票 01 Q9）：步只是它的展示细分，所以每一步都带 `segmentKey`/`segment`，UI 能从步反查段。
//   · 界面用词：人眼只有**「阶段」**与**「步」**；「期」「小步」「分段」不进界面。
//     步名不带阶段号（阶段号在 `step.phase` 上，由调用点按「第 N 阶段」的说法拼）。
//
// ⚠️ 不变量 1（客户端兜底，长期机制）：分段的阶段归属**优先服务端 `seg.phase`**，缺了按
// `domain-rules.SEGMENT_PHASE` 从 `kind` 查表（`phaseOfSegment`）——**不许只依赖服务端 payload**。
// 章内五态同理：优先服务端算好的 `seg.stage`，缺了读 `meta.chapterPipeline[n-1].stage`。

/** 章内三步（票 01 §2 的逐格表）：名字与稳定 key 后缀。 */
const CHAPTER_STEPS = Object.freeze([
	{ key: "write", name: "写" },
	{ key: "audit", name: "审" },
	{ key: "finalize", name: "复核" },
]);

/** 步名与 `segmentHuman` 只差这一格（票 01 §2 的表里这一步叫「最后检查与交付」）。 */
const SEGMENT_STEP_TITLE = Object.freeze({ final: "最后检查与交付" });

/** 材料准备那一步的 key（阶段 1 没有分段，但票 01 Q2 裁决它算第一步）。 */
export const MATERIAL_STEP_KEY = "material";

/** 章内三步各自的稳定 key 后缀（React key 与"从步反查段"都靠它）：`chapter-3:write`。 */
export const chapterStepKey = (segmentKey, stepKey) => `${segmentKey}:${stepKey}`;

/**
 * 章内五态 → 写 / 审 / 复核 三步各走到哪（票 01 §2 的完成判据）。
 * `writing`→写在动；`auditing`→审定稿前审在动；`audited`→审完了等复核；`finalizing`→复核在动；
 * `done`→三步都完（该章交工，chapters.js 的唯一写入点）。
 * `stage` 为 null（demo / 旧账本 / 主 AI 没上报）时**只有段级状态可用**：段 done＝三步都完；
 * 段 active＝正在做这一章，机器分辨不出做到哪一步，就只认「写」在动——**不为凑数手工编步**。
 */
function chapterStepStatuses(stage, segStatus) {
	if (stage === "writing") return ["active", "pending", "pending"];
	if (stage === "auditing") return ["done", "active", "pending"];
	if (stage === "audited") return ["done", "done", "pending"];
	if (stage === "finalizing") return ["done", "done", "active"];
	if (stage === "done") return ["done", "done", "done"];
	if (segStatus === "done") return ["done", "done", "done"];
	// 章段今天不会出现 waiting-user（buildProcessMap 只给 done/active/pending）；真出现时
	// 把「轮到你」落在第一步上，不猜后面两步。
	if (segStatus === "waiting-user") return ["waiting-user", "pending", "pending"];
	if (segStatus === "active") return ["active", "pending", "pending"];
	return ["pending", "pending", "pending"];
}

/**
 * 材料准备这一步走到哪（票 01 §1）：完成判据＝**书已进阶段 2**（`meta.phase >= 2`，不引新数据）。
 * 四态：`phase >= 2` → 已完成；`phase === 1 && status === 'running'` → 我正在做（转换中）；
 * 否则（`active`＝还没上传材料）→ 轮到你。
 * 只喂了分段、没给 meta 时，用「读材料挑重点那一段动过没有」反推阶段 1 已经过去——阶段 2 的段
 * 只有当书进了阶段 2 才不是 pending，这是机器事实、不是猜。
 */
function materialStepStatus(meta, segments) {
	const phase = Number.isInteger(meta?.phase) ? meta.phase : null;
	if (phase !== null) {
		if (phase >= 2) return "done";
		return phase === 1 && meta?.status === "running" ? "active" : "waiting-user";
	}
	const explore = segments.find((seg) => seg?.key === "explore");
	return explore !== undefined && explore.status !== "pending" ? "done" : "pending";
}

/** `stepsOf`/`stepCount` 的入参归一：`{ segments, meta }`（裸数组＝只给了分段、没有 meta）。 */
function stepPayloadOf(payload) {
	if (Array.isArray(payload)) return { segments: payload, meta: undefined };
	return {
		segments: Array.isArray(payload?.segments) ? payload.segments : [],
		meta: payload?.meta ?? undefined,
	};
}

/**
 * 章数 N：票 01 §2 的口径取自 `meta.outline.chapters`（N 就是已排定的章数）；
 * 缺了（或比实际章段少）按章段数兜底，两头取大——只为了不让 3N+10 少算。
 */
function chapterCountOf(segments, meta) {
	const planned = Array.isArray(meta?.outline?.chapters)
		? meta.outline.chapters.length
		: 0;
	const fromSegments = segments.filter((seg) => seg?.kind === "chapter").length;
	return Math.max(planned, fromSegments);
}

/** 章段的章号：`seg.key`（`chapter-3`）是权威机器身份；认不出退回它在章段里的序号。 */
function chapterNoOfSegment(seg, ordinal) {
	const match = /^chapter-(\d+)$/.exec(String(seg?.key ?? ""));
	return match === null ? ordinal : Number(match[1]);
}

/** 章内五态的客户端兜底：读 `meta.chapterPipeline[n-1].stage`（0 基，与 rules.js/chapters-map.js 同处）。 */
function chapterPipelineStage(meta, chapterNo) {
	const pipeline = Array.isArray(meta?.chapterPipeline) ? meta.chapterPipeline : [];
	const entry = pipeline[chapterNo - 1];
	return entry !== null && typeof entry === "object" ? (entry.stage ?? null) : null;
}

/** 章内三步的阶段号：段在就 `phaseOfSegment`（服务端优先、kind 兜底），段不在就是章段的阶段号。 */
function chapterStepPhase(seg) {
	const phase = seg === null || seg === undefined ? null : phaseOfSegment(seg);
	return Number.isInteger(phase) ? phase : SEGMENT_PHASE.chapter;
}

/**
 * 全书每一步（按阶段 1→6 排好；一行一步、四态）。人眼的工作单位就是它。
 *
 * @param {{segments?: object[], meta?: object}|object[]} payload
 *   `segments` 取自 `/textbook/process`，`meta` 取自 `/textbook/events`（后者 payload 里**没有**
 *   meta，两件是分开来的，调用点自己并成 `{ segments, meta }`）。
 * @returns {Array<{key:string,no:number,title:string,phase:(number|null),status:string,
 *   statusWord:string,chapter:(number|null),segmentKey:(string|null),segment:(object|null),
 *   canDeepModify:boolean}>}
 *   · `key`：稳定且唯一（段步＝`seg.key`；章内三步＝`chapter-N:write|audit|finalize`；
 *     材料准备＝`MATERIAL_STEP_KEY`）；
 *   · `segmentKey`/`segment`：**这一步归属哪一段**——定点修改的粒度仍是段，UI 从步反查段靠它
 *     （材料准备那一步没有段，两者为 null；旧 payload 缺章段时补出来的章步也是 null）；
 *   · `status`：段状态四态（done / active / waiting-user / pending）——章内三步另按五态细分；
 *   · `canDeepModify`：段级能力（材料准备恒 false——票 01 Q7：它不可定点修改）。
 */
export function stepsOf(payload) {
	const { segments, meta } = stepPayloadOf(payload);
	const steps = [];

	const pushMaterialStep = () => {
		const status = materialStepStatus(meta, segments);
		steps.push({
			key: MATERIAL_STEP_KEY,
			title: PHASE_UI[1] ?? "",
			phase: 1,
			status,
			statusWord: stepWord(status),
			chapter: null,
			segmentKey: null,
			segment: null,
			canDeepModify: false,
		});
	};

	const pushChapterSteps = (n, seg) => {
		const stage = seg?.stage ?? chapterPipelineStage(meta, n);
		const statuses = chapterStepStatuses(stage, seg?.status);
		const segmentKey = seg?.key ?? `chapter-${n}`;
		for (let i = 0; i < CHAPTER_STEPS.length; i += 1) {
			steps.push({
				key: chapterStepKey(segmentKey, CHAPTER_STEPS[i].key),
				title: `第 ${n} 章 · ${CHAPTER_STEPS[i].name}`,
				phase: chapterStepPhase(seg),
				status: statuses[i],
				statusWord: stepWord(statuses[i]),
				chapter: n,
				segmentKey: seg?.key ?? null,
				segment: seg ?? null,
				canDeepModify: seg?.canDeepModify === true,
			});
		}
	};

	const pushSegmentStep = (seg) => {
		steps.push({
			key: String(seg?.key ?? ""),
			title: SEGMENT_STEP_TITLE[seg?.key] ?? segmentHuman(seg),
			phase: phaseOfSegment(seg),
			status: seg?.status ?? "pending",
			statusWord: stepWord(seg?.status),
			chapter: null,
			segmentKey: seg?.key ?? null,
			segment: seg ?? null,
			canDeepModify: seg?.canDeepModify === true,
		});
	};

	pushMaterialStep();

	const chapterSegs = segments
		.filter((seg) => seg?.kind === "chapter")
		.map((seg, index) => ({ seg, n: chapterNoOfSegment(seg, index + 1) }))
		.sort((a, b) => a.n - b.n);
	const byChapterNo = new Map(chapterSegs.map((row) => [row.n, row.seg]));
	const chapterTotal = chapterCountOf(segments, meta);

	for (let phase = 2; phase <= 6; phase += 1) {
		const rows = segments.filter((seg) => phaseOfSegment(seg) === phase);
		if (phase === 5) {
			// 章内三步：段在就按段展开；段不在（旧 payload、或只给了 meta 的大纲）按章号补出来、
			// 状态取 pending——「章排定了」这件事本身就在 meta 里，不让一条章步凭空消失。
			for (let n = 1; n <= chapterTotal; n += 1)
				pushChapterSteps(n, byChapterNo.get(n));
			for (const seg of rows) if (seg?.kind !== "chapter") pushSegmentStep(seg);
			continue;
		}
		for (const seg of rows) pushSegmentStep(seg);
	}
	// 阶段归属认不出的分段（旧 payload 连 kind 都没有）不静默丢：挂在末尾，phase 为 null。
	for (const seg of segments) if (phaseOfSegment(seg) === null) pushSegmentStep(seg);

	return steps.map((step, index) => ({ no: index + 1, ...step }));
}

/**
 * 全书步数口径（票 01 §2）：总数 = **3N + 10**；章未排定时**只报已知的步**、`total` 给 null。
 *
 * @returns {{chapters:number, chaptersPlanned:boolean, known:number,
 *   total:(number|null), remaining:number}}
 *   · `chapters`：N（取自 `meta.outline.chapters`，缺了按章段数兜底）；
 *   · `chaptersPlanned`：N>0——界面「全书 3N+10 步」还是「已知 10 步 · 章节排定后补齐」的分叉；
 *   · `known`：现在数得出来的步数（章未排定时＝10；排定后 === `total`）；
 *   · `total`：3N + 10；章未排定时 **null**（不按默认章数猜），那句话由 UI 拼；
 *   · `remaining`：还没完成的步数（「还剩 M 步」）。
 */
export function stepCount(payload) {
	const { segments, meta } = stepPayloadOf(payload);
	const steps = stepsOf(payload);
	const chapters = chapterCountOf(segments, meta);
	return {
		chapters,
		chaptersPlanned: chapters > 0,
		known: steps.length,
		total: chapters > 0 ? 3 * chapters + 10 : null,
		remaining: steps.filter((step) => step.status !== "done").length,
	};
}

/** 一步的名字（人眼看到的字；组件取词只走这里，别在别处拼）。 */
export function stepLabel(step) {
	return String(step?.title ?? "");
}

/** 从一步反查它归属的那一段（定点修改的粒度仍是段；材料准备那一步没有段 → null）。 */
export function stepSegment(step) {
	return step?.segment ?? null;
}

/** 每一步走到哪了 → 工作台状态词（CONTEXT.md：只允许这三个词 + 还没到）。 */
export function stepWord(status) {
	if (status === "done") return "已完成";
	if (status === "waiting-user") return "轮到你";
	if (status === "active") return "我正在做";
	return "还没到这一步";
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
