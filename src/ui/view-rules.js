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
	chapterRel,
	goldChapterNo,
	productOpenMode,
	gateHuman,
	stageLabelHuman,
	segmentHuman,
	convertedState,
	finalAuditSummaryRel,
	GATE_TOPIC,
	PHASE_UI_SOURCE,
	SEGMENT_PHASE,
	// 票 `demo-flow-fidelity/06`：最后检查那句演示提示的项名单点（服务端 name，见 domain-rules）。
	QUALITY_CHECKS_TAIL_NAMES,
} from "../domain-rules.js";
import {
	formatTime,
	humanDuration,
	stageScopedProgressDetail,
	deriveStallJudgment,
	// 票 `ui-systematic-fixes/02`：兜底出口与它的两个方向（spec §2）。
	fallbackWord,
	FALLBACK_FREE,
} from "./rules.js";
// ── 拍板契约要**引各卡自己的键文案与后果句**（票 `ui-systematic-fixes/11` · spec 实现决策 §5）──
//
// ⛔ 本文件**不另抄一份字**：`options[].label`／`keysAt` 必须就是卡上那颗键的文案，而
// 「同一句话只许有一个出口」（`CONTEXT.md`「界面用词表」）⇒ 字住卡片模块、契约引它的绑定。
//
// ⚠️ 这组导入让本文件与卡片模块成**环**（卡片早就 import 本文件）。环安全的**唯一前提**：
// 本文件**顶层不读**下面任何一个绑定——所有读取都发生在 `decisionOf()` 被调用时（渲染期，
// 两侧模块体都已求值完）。⛔ 别把 `options` 提升成顶层常量（那会在求值顺序反过来时撞 TDZ）。
// 判据：`test/test-wording-invariants.mjs` 的票 11 那一节逐条断「每张卡的键文案在源码里只有一份」。
import {
	GATE_PASS_LABEL,
	GATE_REJECT_LABEL,
	GATE_SKIP_LABEL,
	GATE_ROLLBACK_LABEL,
	GATE_REJECT_EFFECT,
	GATE_SKIP_EFFECT,
	GATE_ROLLBACK_EFFECT,
	gatePassEffect,
	FINAL_APPROVE_LABEL,
	FINAL_REJECT_LABEL,
	FINAL_APPROVE_EFFECT,
} from "./event-cards.js";
import {
	EXPLORE_CONFIRM_ACCEPT_LABEL,
	EXPLORE_CONFIRM_REWRITE_LABEL,
	EXPLORE_PASS_EFFECT,
	OUTLINE_CONFIRM_ACCEPT_LABEL,
	OUTLINE_PASS_EFFECT,
} from "./confirm-cards.js";
import {
	GOAL_CONFIRM_ACCEPT_LABEL,
	GOAL_CONFIRM_REWRITE_LABEL,
	GOAL_REWRITE_EFFECT,
	goalConfirmPassEffect,
} from "./goal-cards.js";
import {
	GOLD_DRAFT_ACCEPT_LABEL,
	GOLD_DRAFT_REWRITE_LABEL,
	GOLD_SEAL_LABEL,
	GOLD_WRITE_TARGETS_LABEL,
	GOLD_DRAFT_PASS_EFFECT,
	GOLD_SEAL_EFFECT,
	// 票 `ui-display-redesign/07`：保存键的提示从卡模块取（唯一出口）；未拍板那件事实的
	// 契约理由也换了名字——它**不再上屏**（卡片那句提示整句删了），只给 `blocked.reason`。
	GOLD_WRITE_TARGETS_HINT,
	GOLD_STATION9_NOT_DECIDED,
} from "./gold-table.js";
import {
	CHAPTERS_APPROVE_LABEL,
	CHAPTERS_REVIEW_LABEL,
	CHAPTERS_APPROVE_EFFECT,
} from "./chapters-map.js";

// 界面词的两侧共用部分（关卡主题表 / 「第 N 次拍板」模板 / 交办阶段标签翻译 / 六格阶段词）
// 住在 src/domain-rules.js 的「界面词」区：服务端也要产出人话文本（《过程记录.md》、交办唤醒
// 消息、提案正文标题都是给人读的），共用件只住 UI 层就得在服务端抄第二份（grill Q24）。
// 这里只保留 UI 专属映射，并把共用件再导出——UI 组件照旧从本文件取词。
export { artifactKind, gateHuman, stageLabelHuman, convertedState };
// 站 3 那份正文的文件名判据（票 `goals-handoff-missing/01`）：与 `productOpenMode` 的预览准入
// **同一个出口**（`goal-doc-format.isGoalDocRel`——那一族文件名形状只有一个来源）。
// ⚠️ 只 `import`、**不**再 `export … from`：本文件外面今天没有第二处需要它，转一手只是多一个
// 没人读的导出面（收口 review 的 Speculative Generality）。
import { isGoalDocRel } from "../goal-doc-format.js";
// 原件那一格（票 `mineru-formats/11` / `ADR-0029`）：判据与路径形状住在领域规则模块（它们由
// `MATERIAL_FORMATS[].family` 派生，那份表在那边），UI 组件照旧只从本文件取——与 `convertedState`
// 同一处置，组件不许自己去 import 领域规则模块里的那一格。
export { originalPreviewOpenable, originalSourceRel } from "../domain-rules.js";
// 「转换完成的那几份，连同它们的序号（1 基）」——票 `pre-gold-build/02`：阶段页材料行要把合并件
// `materials[].role` 对回每一份材料，序号口径必须与分片／细目／档位**同一份**（`okMaterialShards`
// 是那一份唯一算法）⇒ 与上面那个原件出口同一处置，UI 组件只从本文件取。
export { okMaterialShards } from "../domain-rules.js";
export const GATE_UI = GATE_TOPIC;

// ── 界面用词表（批 2，2026-09-20 用户逐行拍板）────────────────────────────────
// 病灶不是"谁写错了"，是同一件事同时存在四套词源：本文件的 STAGE_HUMAN、
// event-cards 的 SHORT_PHASE_LABELS、后端 stageLabel、以及 domain-rules 的 PHASES。
// 现在**界面词只此一份**：UI 组件一律经这里取词，不再直接渲染服务端 label。
// ⚠️ 只改「用户会读到的字」；账本字段名 / 文件名 / 事件 type / 产物路径一律不动。
// 依据：.scratch/_archive/2026-11/ui-rebuild/行话替换表.md；术语见 CONTEXT.md。

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

/**
 * 阶段片那一格 hover 文案的**前缀**：`去「<阶段界面词>」`（票 `ui-display-redesign/17` ·
 * 收口 review F5）。
 *
 * ⚠️ **唯一出处**：`src/ui/event-cards.js` 的 `PhaseBar` 拼 `title`（前缀后面再接「这一步…」）
 * 与画廊驱动器 `dev/gallery/knobs.js` 的 `phaseChipTitleOf`（按前缀选中那一格）都调它——
 * 修前两处各写一份 `去「${…}」` 字面量，注释却声称「两边不会各记各的」。
 * 判据：`test/test-ui-state-gallery-adapter.mjs` 的票 17·F5 那一格（两边源码的代码面都不许再出现
 * 自带前缀的字面量）。
 *
 * @param {string} label 阶段界面词（`PHASE_UI[n]` 或该格的兜底 label）
 * @returns {string}
 */
export function phaseChipTitlePrefix(label) {
	return `去「${label}」`;
}

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
// 机器阶段是**七个**（`docs/协作模型.md` 的「**阶段标签**」那一行逐字列的就是这七个：explore / gate（带第几关）/
// outline / gold / chapters / merge / final），今天一格不漏。
//
// `gate` 那一格取**既有措辞**「拍板定方案」，**不新创风格**：
//   · `CONTEXT.md` 的「阶段片六格＝」那一行（2026-09-20 用户逐行拍板）：第 3 格＝「拍板定方案」；
//   · 与本表其余几格同属 `PHASE_UI_SOURCE` 家族——`explore`/`gold`/`chapters`/`final`
//     四格与 `PHASE_UI_SOURCE[2]/[4]/[5]/[6]` 逐字相同，`gate` ＝ `PHASE_UI_SOURCE[3]`；
//     （本表另两格 `outline`/`merge` 不在 `PHASE_UI_SOURCE` 里，是阶段层面更细的说法。
//     防漂由 `test-wording-invariants.mjs` 那条断言兜住，不靠这里改写法。）
//   · `CONTEXT.md` 的「含三次拍板 + 章节安排」那一行（原句主语是「拍板定方案」）——所以**阶段层面**
//     `gate` 叫「拍板定方案」、`outline` 叫「章节安排」，两格分工不同、各叫各的，
//     **不要**因为阶段片第 3 格叫「拍板定方案」就把 `outline` 也改成那一句。
//   · ⚠️ **不叫「第 N 关」**（`CONTEXT.md` 的「设计关卡＝」那一句明写界面不叫那个；`ALT_GATE_NUMBER_RE` 会判红）。
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
 * （`src/ui/event-cards.js` 判 `pendingStageLabel !== ""` 才出「我正在做 · <阶段名>」，
 * 空串会让它整个不出现——**屏上看不出出过错**）。
 *
 * 兜底选「**原样返回那个机器阶段名**」而不是抛错，理由与仓库里**另外两处同一选择**逐字一致：
 *   · `src/domain-rules.js` `segmentHuman`：「译不出来原样显示：**宁可露出机器词，也不猜错**」；
 *   · `src/ui/event-cards.js`：「译不出来（未登记的原样返回）才原样显示——
 *     **宁可露出机器词，也不猜错**」。
 * 不抛错是因为本函数**在渲染路径上**（`src/client-entry.js` 里壳调 `deriveBookViewFacts({` 那一处）：抛错会把一个
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
	// 票 `audit-state-regression/01`：机器名「所有章节都有审计记录」不改（`CONTEXT.md` 判定线：
	// 机器检查 `name` 是机器身份词），改的是它背后那条判据——从「有检查记录」变成「有且不过期」。
	// 界面词跟着判据说全：只说「都有」会漏掉「旧稿」那一半。
	"所有章节都有审计记录": "每章的检查记录都在且不过期",
	// ⚠️ 票 06 收口（2026-10-08）订正：这一格的键原来是「没有遗留的 AI 笔记/脚手架」——
	// `engine.js` 在票 20 把那条 check 的 `name` 改成了「没有遗留的通用脚手架标记」，这张表的键
	// 没跟着改，于是 `checkHuman` 认不出它、**屏上原样印机器名**（键必须是服务端 `name`，
	// 见本表上面那段注释）。值一个字没动。
	"没有遗留的通用脚手架标记": "没有留下 AI 的草稿痕迹",
	"练习与答案齐全": "练习和答案都在",
	// 票 `chapter-teaching-handbook/03`：章交工验里的章末带读手册三条（G1′／G2′／G3′）。
	// ⚠️ 它们**不在** `QUALITY_CHECKS_TAIL_NAMES`（那一份是 `runQualityChecks` 尾段的项名）；
	// 三条只住在章交工验，⛔ 不挂终检。界面词按判据写实：只判形状与在场，不判教得好不好。
	"章末教学区在场且位置一致": "每章都有章末教学区，位置和写作规范说的一致",
	"带读手册形态齐全": "章末带读手册的块都在",
	"正文没有板块表外的块头": "正文没有被写成表单",
	"与已拍板的设计一致": "和你说定的设计一致",
	// ⚠️ 票 14（承诺账 E）：这两条白话名原来把机制说大了——
	//   「源材料引用可追溯」的机器判据只是 `sourceCount > 0`（用上了至少一份材料），不验任何一处内容；
	//   「进度账本齐全」只验 `工作区/progress.md` 存在，不验「每一步」都有行。
	// 名字即承诺，所以按机制收（收名，不动服务端判据）。
	"源材料引用可追溯": "用上了你上传的材料",
	"风格线条条有着落": "你提的风格要求都处理了",
	"进度账本齐全": "有工作记录可查",
	"成品无乱码（U+FFFD）": "没有乱码",
	"章节数符合大纲": "章节数和说好的一致",
	// 票 `walkthrough-fixes/36`：机器判据是「成品逐字等于各章正文拼出来的那一份」。界面词按机制写实
	// （不说「没有手抄痕迹」那种猜测），点名第几章不一致那一半由服务端 note 承担。
	"成品与各章正文一致": "成品和每章正文对得上",
	// 票 `exclusion-flow/03`（F3）：机器判据只是「那一串 title 在不在成品里」（同一份规范化），
	// ⛔ 不证「这一段真的在讲它」——所以界面词按机制写实：说「没有你不让写的那几条」，
	// 不说「没有越界内容」那种猜语义的话；点名第几章、哪一条由服务端 note 承担。
	"成品里没有已划掉的知识点": "成品里没有你划掉的知识点",
	"必含板块齐全（契约项）": "该有的板块都在",
	"无禁用词（契约项）": "没有出现不该用的词",
	// ⚠️ 票 `pre-gold-build/16` 补的三条（键＝服务端 `name` 逐字，见 `domain-rules.js` 的
	// `QUALITY_CHECKS_TAIL_NAMES`）：界面词按机制写实——「八类」在机器那一侧是 6 类硬查、
	// 2 类只提示，所以界面词只说「造书的草稿痕迹」这个用户看得懂的结果，不承诺「八类都查了」。
	"拆脚手架八类残留": "没有留下造书的草稿痕迹",
	"正文无元指令残留（human-readable）": "正文里没有给机器看的指令块",
	"章节引用可追溯（无引用矛盾）": "每章标的材料出处都真实存在",
	"交叉引用指向真实存在的章": "正文里提到的章都真的存在",
	// 2026-09-30 诊断后按判据写实：这一项现在只查**同一章内**的小节标题重名（跨章同名多半是
	// 每章都有的板块名，只提示不拦，见 ADR-0008 修订 2026-09-30）；章名唯一性单独立下一条。
	"无重复标题": "同一章里没有重名的小节",
	"章名全书唯一": "每章的章名在全书中都不一样",
	// 票 `word-budget-ineffective/02`：字数兜底（低于不过、超过不限）——界面词不承诺上限。
	"字数兜底读数": "每章的兜底字数与实际字数",
	// 票 `flow-audit-2026-10/01`：演示书在认可交付那一跳按登记豁免不重跑硬检查；交付账上那一行
	// 是**显式的「未检查」**（不是通过）。界面词说清楚它是什么。
	"认可交付当场重跑": "交付时重跑机器检查",
};

// 未登记的项**原样显示**（宁可露出机器词，也不猜错）——票 `ui-systematic-fixes/02`：
// 这是**自由文本**那一档（服务端 `name` 是机器身份词，但它不是本仓代码产的四类闭集），
// 兜底方向改由 `fallbackWord` 一处决定（行为逐字不变：未登记 ⇒ 原样）。
export const checkHuman = (name) => fallbackWord(CHECK_UI, name, FALLBACK_FREE);

// ── 演示书在终检那两块上的那句提示（票 `demo-flow-fidelity/06`）────────────────────────
//
// 用户看得到终检那两块的地方有**两处**：焦点区的终检认可卡（`event-cards.js` 的
// `FinalApprovalCard`）与阶段页第 6 阶段那块（`phase-page.js` 的 `FinalChecksBlock`）。
// 演示书在这两处与真书**只差一项**：真书后半那一段（名单见 `src/domain-rules.js` 的
// `QUALITY_CHECKS_TAIL_NAMES`）里还有若干项演示通道不跑（AI 检查报告那一块票 08 起演示书也有了）
// ——所以两处要说**同一句话**。句子**只此一份**：两个渲染点都调下面这个函数，谁也不许自己拼一遍。
//
// 项名**从票 08 的声明面派生**：`src/demo-exemptions.js` 的 `quality-checks-tail`
// 那条的机器可读元数据 `checkNames` 就是这里的 `QUALITY_CHECKS_TAIL_NAMES`（**同一个数组
// 引用**，不是抄一份）——但那份数组装的是**服务端 `name`**，所以这句拼接时**逐项过
// `checkHuman`**（`CHECK_UI`，键＝服务端名）：屏上是界面词（「有工作记录可查」），
// 不是「进度账本齐全」这类机器名（`CONTEXT.md`「界面用词表」把「进度账本」「禁用词」
// 列为界面避免词）。
//
// ⚠️ 票 `demo-channel-full/04` 改过两处（改的都是**会变成假话**的地方）：
//   ① 首句原来承诺**位置**（「只跑前 N 项机器检查」）。那一票起演示书跑的是「前 6 项 ＋ 进度账本
//      那一项」——是**挑选**、不是前缀（进度账本那一格在真实名单里位置在风格线之后）⇒ 位置承诺去掉。
//      ⛔ 别再往首句里加任何「前几项」的说法。
//   ② 「哪几项演示通道不跑」原来直接列整份名单，而那一票起名单里有一项（进度账本）**演示书真跑**了
//      ⇒ 改成**这份名单减去这一屏真跑了的项**（现算）。演示通道以后再多跑／少跑一项，这句话自己
//      跟着变，⛔ 不手抄第二份「不跑的项」名单。
//
// N（这一屏列了几项）**来自这一屏真的列了几项**（两个渲染点上手上就有 `checks` 数组，
// 由调用方递进来）：这是**这一屏的事实**，不是拿条数猜「这是不是演示书」——
// 是不是演示书只由 `meta.demo` 判（见 `isDemoBook`，票面明令不许用条数反推）。
// ⚠️ 为什么**不**再从「名义总数 − 名单项数」算（票 06 原版就是 14 − 8 ＝ 6）：
//   ① 那个 14 在 `src/` 里**没有出处**、只能手抄（原注释自陈「算不出来所以写死」），
//      而纪律是「别手抄一个会腐烂的数」；
//   ② 名单按服务端 `name` 补成 9 项那天，`14 − 9 ＝ 5` 会当场把演示书那几项说错——
//      算术的两个操作数一个都没有出处，改一处就静默说错话。
//   这一屏列的那几项**就是演示通道真跑的那几项**（同一份数组递进来），所以按它现算既准确、
//   又不靠一份手抄的清单。收口时选的就是这一路（票面二选一）。
//
// ⚠️ 这一句是**说明文字、不是判据**（票 06 要做的第 3 条）：声明面若比现实窄，它就少说／多说几项
// ——那份窄处逐条写在 `QUALITY_CHECKS_TAIL_NAMES` 的注释里，没有任何机器闸门咬它说的项数
// 对不对。真正被判据钉住的有三格：**它上了屏**（演示 payload）、**屏上每个项名都是界面词**
// （过 `checkHuman`，`test-component-cards.mjs` / `test-phase-page.mjs` 逐项断）、
// 以及**真书那一侧一个字都不许有**（反证，同样那两个文件）。
/**
 * 演示书在终检那两块上的那句提示（两个渲染点共用这一句）。
 *
 * ⚠️ **改过两次，两次都是「删掉会变成假话的那半句」**：
 * · 票 `demo-channel-full/08` 删了结尾的「并附一份 AI 检查报告」——那一票起演示书的终检支**也产**
 *   自查报告，那块正文此刻就在同一张卡上，再说「并附」就是假话；
 * · 票 `demo-channel-full/04` 删了首句的位置承诺「只跑前 N 项」——那一票起演示书**还跑**进度账本
 *   那一格（`runQualityChecks` 的后半里唯一真跑的一项），它**不在前缀里**；同时把「不跑的那些项」
 *   改成**从这一屏真跑了的清单现算**（原先列的是整份名单，会把这一项也说成「真书上还会跑」）。
 *
 * @param {unknown} checksShown 这一屏**真的列出来的**机器检查清单（`checks` 数组，元素带服务端 `name`）
 */
export function demoQualityChecksNote(checksShown) {
	const shown = Array.isArray(checksShown) ? checksShown : [];
	// 「哪几项演示通道不跑」＝真书那份后半名单 **减去这一屏真跑了的**（⛔ 不手抄第二份「不跑的项」名单）。
	const ran = new Set(shown.map((check) => check?.name).filter((name) => typeof name === "string"));
	const notRun = QUALITY_CHECKS_TAIL_NAMES.filter((name) => !ran.has(name));
	const tail = notRun.map((name) => checkHuman(name)).join("／");
	return `演示模式：这一屏列了 ${shown.length} 项机器检查。`
		+ (notRun.length === 0 ? "真书上这里要跑的项这一屏都跑了。" : `真书上这里还会跑「${tail}」这些项。`);
}

/**
 * 这本书是不是演示书（票 `demo-flow-fidelity/06`）——**只给展示面用**。
 *
 * 它是「要不要说那句演示提示」的**唯一判据**（两个渲染点共用），与 `engine.js` 里那一族
 * `meta.demo` 守卫是**两件事**：那些守卫决定演示通道**不做**什么（豁免，登记在
 * `src/demo-exemptions.js`），这里只决定界面**说不说**这句话——它不给演示通道放行任何东西。
 *
 * ⚠️ **不许拿别的事实反推它**（票面明令）：`checks` 条数、有没有 AI 报告都是「别人家的判据」
 * 的副产品，真书哪天加/减一项就会当场说错话。演示与否只有 `meta.demo` 这一个来源。
 */
export const isDemoBook = (meta) => meta?.demo === true;

// ── 从账本倒着找一条事件（票 `depth-review-2026-10/08`）────────────────────────────
//
// 搬移前「取最近一条某类型的事件」是四份各自抄的 `[...list].reverse().find((e) => e.type === T)`
// ——机器检查、AI 检查报告、进度横幅、开始浏览时记进度序号各一份。同一件事抄四遍的代价不是
// 「多了几行」，是**改判据要改四处、漏一处就静默分叉**（这正是本仓反复治的「一处改、另一处漏」）。
//
// 口径逐字照搬原实现，一格都没动：
//   · **按数组顺序取末位**（先 reverse 再 find），**不按 `seq` 比较**——账本乱序时两者会分叉，
//     现状是前者，改成后者就是一次静默的行为变更。
//   · 取不到回 `undefined`（`find` 的原样语义），**兜底归各自的调用方**：机器检查回空数组、
//     AI 报告回 `null`、进度横幅比记住的序号。判据层不许替它们编。
//   · 事件列表读不到（`null` / `undefined`）回 `undefined`，不抛。
//
// ⚠️ **有一处故意不用它**：壳里 `onPickStep` 记进度序号那一份读的是 **latest ref**
// （`bookRef.current.core.data?.events`，可能比当前这一帧的渲染更新——壳自己的注释明写这是
// 有意的）。把它改成读渲染期的 `events`（也就是并进 `deriveBookViewFacts`）会引入一个真实的
// 时序差异，所以那一份**仍在自己写**，只是不再自己抄这个模板。判据共用 ≠ 数据源共用。
export function lastEventOfType(events, type) {
	const list = events ?? [];
	for (let i = list.length - 1; i >= 0; i -= 1) {
		if (list[i]?.type === type) return list[i];
	}
	return undefined;
}

/**
 * 「**展示期**」（票 `walkthrough-2026-10/04`，2026-10-06 裁决甲）：章稿已落盘、而那一步**还没交工**。
 *
 * 这一格是怎么来的：`src/workflow/engine.js` 的 `runPhase4` 只看「范例章文件在不在盘上」就置 `awaiting-gold`
 * （不看检查跑没跑完），而 `pendingStage` 要等主笔 AI `stage-submit gold` 才被清空
 * （`actions/chapters.js` 的 `case 'gold'`）。于是这两件事实的**合取**正好是
 * 「稿已经给用户看了，但机器这一步还没交出结果」——走查 B4 那一屏。
 *
 * 裁决**甲**（承认提前展示是有意的）要的是：展示期归现有状态词「我正在做」，
 * 而不是把用户叫过来说「轮到你」（此刻验收面的定稿键正禁着，他点不动）。
 * 判据只用机器自己那两位事实，**不比较任何文件时间**——「审计覆盖当前正文」那套（乙）
 * 要先推翻本裁决才许用；全仓唯一那处 mtime 比较在 `src/domain-rules.js` 的 `auditCoversProduct`。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：本条只认 `pendingStage === 'gold'` 这一位。
 * 主笔 AI 若在没有交工的情况下结束了回合（状态机停在 `awaiting-gold`、待办没清），
 * 这一格仍会说「我正在做」——那正是「这一步还挂着」的实话，恢复出口是活性行那颗
 * 「🔁 从断点继续」，不是把用户叫来点一颗按不动的键。
 *
 * @param {object | null | undefined} meta 当前书的状态投影
 * @param {unknown} pendingStage 待办阶段（`/textbook/status` 顶层那一位）
 * @returns {boolean}
 */
export function goldDraftDisplayed(meta, pendingStage) {
	return meta?.status === "awaiting-gold" && pendingStage === "gold";
}

// ── 值出口 `statusHuman`（票 `ui-systematic-fixes/02` · spec 实现决策 §1·1、§2）─────────────
//
// 病（spec §1·1 的取样）：`meta.status` 的比较散在 8 个文件 20 处、**一张表都没有**——状态条自己
// 那个没导出的「轮到你该干什么」只覆盖 5 档 `awaiting-*`，而已交付／出错／待配置三档的措辞又
// 写在渲染分支里；状态条、活性行、阶段片三处各判各的。
//
// 处置：**这一个函数是 `status` 唯一的翻译处**。它吃一份书的状态投影与关卡，吐
// `{ word, tone, action, humanTurn }`：
//   · `word`——状态词那一半（**裸词**：轮到你／我正在做／书做好了…；
//     状态条那一侧的图标由 `tone` 决定，见 `panels.js` 的 `STATUS_TONE_ICON`——一处翻译一种东西）；
//   · `tone`——取色档（`normal`／`ok`／`you`／`config`／`ai`／`error`；`config` 与 `you` 同色、
//     只有图标不同：🔑 对 ⚡）；
//   · `action`——「· 」后面那半句（轮到你时＝`decisionOf` 那一句问句；已交付／出错／待配置各有现成的）；
//   · `humanTurn`——「轮到谁」的判据（壳级派生的 `humanTurn` **就是这个值**，两处不再各判各的）。
//
// 输入契约：`meta` 是**一份书的状态投影**——`status`／`phase`／`pause`／`name` 之外，展示期那一格
// 还要 `pendingStage`（它住在 payload 顶层，由调用点用 `withPendingStage` 并回投影）。
// ⚠️ 闭集未登记（`STATUS_HUMAN` 里没有那个 status）⇒ `word`/`action` 都是 `null`＝**不印**
// （spec §2）＋ G3 判据报红；⛔ 不是退回机器值。
//
// ⚠️ **票 11 起这三处同源了（只到「轮到谁」这一层）**：判定收在下方的 `turnKindOf`／`turnOwnerOf`，
// 状态条、活性行（`panels.ActivityLine`）与阶段片（`event-cards.PhaseBar`）说的是**同一个**状态词；
// 三处各自的行文一个字未改。卡片里那两处「我正在做」仍不在射程（见 `test-wording-invariants.mjs`
// 里票 22 那节的覆盖说明）。

/**
 * 「这本书被暂停了吗」的唯一判据（票 walkthrough-fixes/22 · P6）。
 *
 * 为什么要单独一份：暂停这件事**三处各判各的**——顶栏判 `meta.pause` 出「⏸ 已暂停 / ▶ 继续」，
 * 状态条与活性行原先**全程不读** `meta.pause`，于是点完暂停同一屏既说「已暂停」又说
 * 「🤖 我正在做」（走查实测，且刷新后照旧）。判据同源，矛盾就没有第二处生长的地方。
 *
 * 判定归属：**暂停优先**——`meta.pause` 一置上，正文这两处就不再说「我正在做」。⚠️「同一屏允许
 * 几个状态词」那个上限的裁决属于另一张票（`walkthrough-fixes/16`），这里不抢、也不新造第四个说法：
 * 暂停期间正文让位给顶栏那句。
 *
 * 票 `ui-systematic-fixes/02`：判据从 `panels.js` 搬到这里（值出口要它判「整条不出声」那一支），
 * 状态条与活性行仍取**同一个函数**（`panels.js` 只是 import 它）。
 */
export const pausedNow = (meta) => meta?.pause != null;

/**
 * 两个状态词（`CONTEXT.md` 工作台三词上限里的那两个；「已完成」那一档由 `delivered` 自己说）。
 *
 * ⚠️ `word` 是**裸词**（不带图标）：图标是**取色档的事**（`tone` → `panels.js` 的 `STATUS_TONE_ICON`），
 * 这样别处要「一句话里的状态词」（票 03 的「书的进度：轮到你」）也能直接取它，不必再剥一次图标。
 *
 * ⚠️ **收口 review A1：这两个常量只许在 `STATUS_HUMAN` 里当值用**——`statusHuman` 一个都不许直接读，
 * 它一律从表里取（按 kind）。从前 `statusHuman` 用它们（再加重写的「书做好了」）又拼了一遍同一批词，
 * 于是表里那份 word／tone 成了没人读的第二份词表；`test-wording-invariants.mjs` 的 A1 那一节钉着。
 */
const TURN_WORD = "轮到你";
const BUSY_WORD = "我正在做";
/** 没交办、也没轮到用户时那半句（今天状态条 else 那一支的逐字取值）。 */
const READY_NEXT_ACTION = "准备下一步";
/** 已交付那一支的动作半句（书名的插值留在 `statusHuman` 里，表里只放静态句子）。 */
const deliveredAction = (meta) => `可以预览和下载《${meta?.name ?? ""}》.md`;

/**
 * 状态 → 界面词那半截 ＋ 取色档（**闭集**：值由本仓代码产生，spec §2）。
 *
 * `kind` 决定哪一支走法（`done`／`error`／`config`／`turn`／`busy`），⛔ 它不是给人看的字：
 *  - `done`   —— 已交付：`action` 由书名现拼（`deliveredAction`）；
 *  - `error`／`config` —— 出错／待配置：`action` 就是表里那两句现成措辞；
 *  - `turn`   —— 五个 `awaiting-*`：轮到用户时说的就是 `word`，那半句由 `decisionOf` 给；
 *                不是「轮到你」时（展示期）落回「我正在做」；
 *  - `busy`   —— 在跑／刚建好书：默认「我正在做 · 准备下一步」，但关卡等拍板或阶段一仍归「轮到你」。
 *
 * ⚠️ **这一张表就是词源（收口 review A1）**：`statusHuman` 的 `word`／`tone`（以及 error／config 的
 * `action`）全部经 `humanOfKind` 从这里取——⛔ 函数体里没有再写一份状态词。同一 `kind` 的每一格必须
 * 逐字一致（按 kind 取词才不至于两格说两样话）；判据在 `test-wording-invariants.mjs` 的 A1 那一节，
 * 它同时断言 `statusHuman` 函数体里零中文字面量、零 `TURN_WORD`／`BUSY_WORD` 直接读。
 */
export const STATUS_HUMAN = Object.freeze({
	active: Object.freeze({ word: BUSY_WORD, tone: "ai", kind: "busy" }),
	running: Object.freeze({ word: BUSY_WORD, tone: "ai", kind: "busy" }),
	"awaiting-explore": Object.freeze({ word: TURN_WORD, tone: "you", kind: "turn" }),
	"awaiting-outline": Object.freeze({ word: TURN_WORD, tone: "you", kind: "turn" }),
	"awaiting-gold": Object.freeze({ word: TURN_WORD, tone: "you", kind: "turn" }),
	"awaiting-chapters-review": Object.freeze({ word: TURN_WORD, tone: "you", kind: "turn" }),
	"awaiting-final-approval": Object.freeze({ word: TURN_WORD, tone: "you", kind: "turn" }),
	delivered: Object.freeze({ word: "书做好了", tone: "ok", kind: "done" }),
	error: Object.freeze({
		word: TURN_WORD,
		tone: "error",
		kind: "error",
		action: "出错了，请看下面的提示",
	}),
	"needs-config": Object.freeze({
		word: TURN_WORD,
		tone: "config",
		kind: "config",
		action: "需要配置，请看下面的提示",
	}),
});

/**
 * 某一档（`kind`）在 `STATUS_HUMAN` 里说的词与取色——**词表只此一份**（收口 review A1）。
 *
 * 为什么按 `kind` 取、不按 `status` 取：`turn` 这一档**跨 status**（五个 `awaiting-*`，以及
 * `running` 遇上关卡等拍板／阶段一）——按 status 取会拿到那个 status 自己的那一格（`running`
 * 拿到「我正在做」），说错话。同一 kind 的每一格逐字一致由判据钉着，所以取第一条同档登记即可。
 *
 * @param {string} kind `turnKindOf` 给出的那七档之一
 * @returns {{ word: string, tone: string, action?: string } | null} 表里没有这一档 ⇒ `null`
 *   （`paused`／`unregistered` 本来就不出声，调用方自己给 `null` 词，不查表）
 */
function humanOfKind(kind) {
	for (const entry of Object.values(STATUS_HUMAN)) {
		if (entry.kind === kind) return entry;
	}
	return null;
}

// ── 「轮到谁」的唯一判定（票 `ui-systematic-fixes/11` · spec 实现决策 §5「三处同源」）──────────
//
// 病（`inv-decisions.md` §A 末段的 ⚠️）：同一条状态词有**三处平行判据**——状态条走 `humanTurn`，
// 活性行自己一架梯子（`meta.status !== "running"` 就说「轮到你」），阶段片自己那一份
// （多一项 `phase === 3`）。改一处漏两处。
//
// 处置：**判定收成一个函数**，三处只各自保留自己的**行文**（⛔ 不改任何一句文案）：
//   · `turnKindOf` —— 七档：`done`／`error`／`config`／`turn`／`paused`／`busy`／`unregistered`；
//   · `turnOwnerOf` —— 压成三词上限里那一层：`'you'`（轮到你）／`'ai'`（我正在做）／
//     `'done'`（已完成／书做好了）／`null`（此刻不说话）。
//
// ⚠️ 三处怎么消费（各自的**行文**仍归自己，⛔ 不许并成一句）：
//   · 状态条（`panels.StatusStrip`）→ `statusHuman`（它内部就叫 `turnKindOf`，见下）；
//   · 活性行（`panels.ActivityLine`）→ `turnOwnerOf` 决定说「⚡ 轮到你」／「🤖 我正在做」／
//     「✅ 已完成」／整行不出声；
//   · 阶段片（`event-cards.PhaseBar`）→ 吃壳递进来的 `humanTurn`（它**就是** `statusHuman` 的
//     `humanTurn`），另加它自己那一条**另一个事实**（`phase === 3` 且关卡等拍板）——那条不在本函数里，
//     见 `deriveBookViewFacts` 的注释（⛔ 不许合进来）。
//
// ⚠️ 我的枚举面比现实窄在哪里：`turnKindOf` 认的是 `STATUS_HUMAN` 那**一张手写的闭集表**
// （status 值由本仓代码产生）；表里没有的 status 落 `unregistered`（不印、由 G3 判据报红）。
// 它也不判「卡片里那两处『我正在做』」（那是另一张票的射程，见 `test-wording-invariants.mjs`）。

/**
 * 状态投影 ＋ 关卡 → 此刻属于哪一档（**唯一判定**，三处状态词的共同出处）。
 *
 * 分支顺序与历史实现**同一顺序**（渲染结果逐字不变）：已交付 → 出错／待配置 → 轮到用户 →
 * 暂停 → 我正在做。`unregistered` 是闭集漏登记那一档（不印）。
 *
 * @param {object | null | undefined} meta 状态投影（展示期要带 `pendingStage`）
 * @param {object | null | undefined} gate 当前关卡
 * @returns {'done'|'error'|'config'|'turn'|'paused'|'busy'|'unregistered'}
 */
function turnKindOf(meta, gate) {
	const status = meta?.status ?? "active";
	const entry = STATUS_HUMAN[status];
	if (entry === undefined) return "unregistered";
	if (entry.kind === "done") return "done";
	if (entry.kind === "error") return "error";
	if (entry.kind === "config") return "config";
	if (humanTurnOf(meta, gate)) return "turn";
	if (pausedNow(meta)) return "paused";
	return "busy";
}

/**
 * 「轮到谁」压到三词上限那一层：`'you'`／`'ai'`／`'done'`／`null`（此刻不说话）。
 *
 * ⚠️ `'done'` 那一档两处**行文不同**（状态条说「书做好了」、活性行说「已完成」）——那是各自的
 * 行文，⛔ 不是两个判定：判定只回答「轮到谁」，词怎么说是渲染侧的事。
 *
 * @param {object | null | undefined} meta 状态投影（展示期要带 `pendingStage`）
 * @param {object | null | undefined} gate 当前关卡
 * @returns {'you'|'ai'|'done'|null}
 */
export function turnOwnerOf(meta, gate) {
	const kind = turnKindOf(meta, gate);
	if (kind === "done") return "done";
	if (kind === "turn" || kind === "error" || kind === "config") return "you";
	if (kind === "busy") return "ai";
	return null; // paused／unregistered：这一刻不说话
}

// ── 拍板契约 `decisionOf`（票 `ui-systematic-fixes/10` · spec 实现决策 §5「拍板」）───────────────
//
// 病（清点档 `inv-decisions.md` §1／§B 逐条）：`⚡ 轮到你 · X` 的 X 有 3 句只是**卡片标题又念一遍**
// （`第 N 次拍板 · <主题>`），0 句说得出「有哪几条路」；而且它按 `status` 算，一个 `status` 值盖
// 两个停点——站 3（学习目标）屏上写着站 2 的「确认材料重点」，站 9（定体量）屏上写着站 8 的
// 「确认最佳范例章」。
//
// 处置：把「要你定什么」收成**一句问句**，`decisionKey` 取「**用户正看着哪张卡**」
// （`focusCardKey` 的既有取值，⛔ 不按 `status` 编），那两处错位就在结构上消失。
// 票 10 只落了 `{ question, decisionKey }` 两格（C2「契约小步」）；**票 11 把另外三格铺满**
// （`options`／`keysAt`／`blocked`，见下方 `decisionOptionsOf`／`keysAtOf`／`blockedOf`）——
// 卡内键与布局**从头到尾没动**（用户裁定：键留在卡底，得看完了才能拍板）。
//
// ⚠️ 我的枚举面比现实窄在哪里（AGENTS.md 纪律）：`decisionKey` 的闭集就是 `focusCardKey`
// 那 10 个返回值（`gold` 再按站 8／站 9 折成两档）——`focusCardKey` 以后新加一个返回值时，
// 本模块**不会自己报错**（表里没有它 ⇒ `question` 是 `null`），红在 `test-wording-invariants.mjs`
// 那一侧（状态条输出为空的 11 格 ＋ 手写的 `DECISION_KEYS`）。⛔ 本票不冒充「闭集写入点扫描」。

/**
 * 八个**拍板**点的问句（`decisionKey → question`）。
 *
 * 措辞三条约束（票面）：
 *   ① **问句**，不是话题名／不是卡片标题——关卡那三档尤其：`gateHuman(n)` 是卡片抬头那一串
 *      （「第 N 次拍板 · <主题>」），⛔ 不许再把它念一遍；三档**共用同一句**（票面允许，
 *      且它本来就问的是同一件事：这份方案能不能开工）。
 *   ② 用词全取自仓里既有的界面词（`CONTEXT.md`「界面用词表」），⛔ 不新造状态词——
 *      状态条前面那三个词（轮到你／我正在做／已完成）一个都不动。
 *   ③ 每句都只说**这一屏要你定什么**（站 8 是「这一稿」，站 9 是「体量」，互不串台）。
 *
 * ⚠️ 站 1（上传材料）**不在这张表里**：`inv-decisions.md` §1 把它判为「顺序动作不是二选一」，
 * 它的两个取值（真书／演示书）住在 `phase1TurnAction` 那一份既有出口里，⛔ 这里不抄第二份。
 * ⚠️ `delivered` 也不在：spec §5 逐字「其中「已交付」不是拍板」——没有「要你定什么」，
 * `decisionOf` 对它回 `question: null`（不是编一句）。
 */
export const DECISION_QUESTION = Object.freeze({
	// 站 2（探查）：AI 读到的重点对不对（两路：满意继续／让 AI 重做）。
	explore: "AI 读到的材料重点对不对？",
	// 站 3（学习目标）：原来状态条在这里说的是站 2 的话（本票修掉的错位之一）。
	goals: "这几条学习目标可以定下来了吗？",
	// 站 4／5／6（三次拍板）：同一张卡、同一件事（这份方案能不能开工），故三档共用一句。
	gate: "这份方案能照它开工吗？",
	// 站 7（章节安排）。
	outline: "这份章节安排能通过吗？",
	// 站 8（这一稿行不行）：`gold` 折出来的第一档。
	"gold-draft": "这一稿能当全书的最佳范例章吗？",
	// 站 9（定体量）：`gold` 折出来的第二档——原来它说的是站 8 的话（本票修掉的错位之二）。
	"gold-measure": "其余各章的字数就按这个定吗？",
	// 站 10（全章过目）。
	chapters: "全书都过目了、可以交工吗？",
	// 站 11（终检）。
	final: "整本书能交付吗？",
});

/**
 * 兜底那一句（旧 `humanTurnAction` 的最后一行，逐字保留）。
 *
 * ⚠️ 代码判断：走不到——`humanTurn` 的六个条件每一个都被上面某一支接走（`inv-decisions.md`
 * §A 末段逐字这么写）。留着是为了「取不到卡」时状态条仍有一句话说，⛔ 不是新状态词。
 */
const FALLBACK_QUESTION = "看一眼下面的卡片";

/**
 * 「用户正看着哪张卡」→ `decisionKey`：`focusCardKey` 的取值，只把 `gold` 折成站 8／站 9 两档。
 *
 * ⚠️ 折的那一位与 `gold-table.js` 的 `GoldTable` **同一判据**：`meta.stationDecisions[8].approved
 * === true` 就说明站 8 已拍板、此刻这一屏是站 9（`showStation9 = draftApproved && !reviewing`）。
 * 它**不是新的事实源**：`stationDecisions` 由服务端从 `工作区/决策/08.json`／`09.json` 折出来
 * （`workflow.js` 的 `stationDecisionsOf`，照关卡 `foldGate` 那一档先例），`focusCardKey` 的
 * 分量已经由账本决定——这里只挑「同一份账本的哪一格」。
 *
 * ⚠️ 窄处（票 11 之后照旧）：站 9 屏上点「📖 回看这一稿」是**本地态**（`GoldTable` 的 `reviewing`，
 * ⛔ 不发动作、⛔ 不改盘），那个瞬间用户看的是站 8、而 `decisionOf(meta, gate)` 仍说站 9 的问句——
 * 本函数的签名里没有那个本地态（它与 `focusCardKey` 同形，只吃盘上事实）。要把这一格也治准，
 * 得让卡把 `reviewing` 提到壳那一层，而**壳不在票 11 的射程**（`client-entry.js` 是明令不许碰的
 * 那几个文件之一）⇒ 这一格**本 effort 没做**，如实登记在票面 `## Answer` 的边界那节。
 */
function decisionKeyOf(meta, gate) {
	const key = focusCardKey(meta, gate);
	if (key !== "gold") return key;
	const draft = meta?.stationDecisions?.[8] ?? meta?.stationDecisions?.["8"] ?? null;
	return draft?.approved === true ? "gold-measure" : "gold-draft";
}

/**
 * 每个拍板点那几条路（票 `ui-systematic-fixes/11` 补上的 `options`）。
 *
 * 四条纪律（票面逐字）：
 *   · `label` **不新造**——一律取卡片模块导出的那个绑定（卡渲染用的就是它）；
 *   · `effect` 取**既有出口**（票 09 的两句、各卡既有的说明句），本票只补六句
 *     （站 2／7／8／9／10／11 各一句，住在各自卡片模块里）；
 *   · `meaning` 是一句**短白话**（说这一路「算什么」，不是后果）——票面给了字段但没给来源，
 *     所以它由本票写、逐条列进票面的 `## Answer`（⛔ 不是从卡里抠的原文）；
 *   · ⛔ 不新增可点区域：整张表是**文字**，一个 onClick 都没有。
 *
 * ⚠️ 为什么是函数而不是顶层常量：表里每一项都读卡片模块的绑定，而本文件与卡片模块成环——
 * 顶层读会在求值顺序反过来时撞 TDZ（见文件上方那组 import 的注释）。
 *
 * ⚠️ 我的枚举面比现实窄在哪里：`options` 列的是**卡上那一排拍板键**，不是「所有能点的东西」——
 * 卡内的展开／回看／旋钮类键不在面里（它们不改结果）。非拍板点（`upload`／`delivered`／`status`）
 * 回**空数组**（`delivered` 逐字不是拍板，见 spec §5）。
 *
 * @param {string} decisionKey 卡级编号
 * @param {object | null | undefined} meta 状态投影
 * @returns {{ label: string, meaning: string, effect: string }[]}
 */
function decisionOptionsOf(decisionKey, meta) {
	switch (decisionKey) {
		case "explore":
			return [
				{
					label: EXPLORE_CONFIRM_ACCEPT_LABEL,
					meaning: "照这份报告往下设计",
					effect: EXPLORE_PASS_EFFECT,
				},
				{
					label: EXPLORE_CONFIRM_REWRITE_LABEL,
					meaning: "不满意，让 AI 重做一版",
					// ⚠️ 这个取值按书分叉（真书／演示书）——沿用卡上那一句的**同一个出口**，⛔ 不抄第二份。
					effect: exploreConfirmNote(meta),
				},
			];
		case "goals":
			return [
				{
					label: GOAL_CONFIRM_ACCEPT_LABEL,
					meaning: "这几条就此定下",
					effect: goalConfirmPassEffect(),
				},
				{
					label: GOAL_CONFIRM_REWRITE_LABEL,
					meaning: "打回去让 AI 重拟",
					effect: GOAL_REWRITE_EFFECT,
				},
			];
		case "gate":
			return [
				{ label: GATE_PASS_LABEL, meaning: "这份方案就此定下", effect: gatePassEffect() },
				{ label: GATE_REJECT_LABEL, meaning: "打回这一版重做", effect: GATE_REJECT_EFFECT },
				{ label: GATE_SKIP_LABEL, meaning: "先不验这一关，往下走", effect: GATE_SKIP_EFFECT },
				{ label: GATE_ROLLBACK_LABEL, meaning: "退回上一个存档点", effect: GATE_ROLLBACK_EFFECT },
			];
		case "outline":
			return [
				{
					label: OUTLINE_CONFIRM_ACCEPT_LABEL,
					meaning: "照这份安排开工",
					effect: OUTLINE_PASS_EFFECT,
				},
				{
					label: EXPLORE_CONFIRM_REWRITE_LABEL,
					meaning: "打回去重新安排",
					effect: outlineRejectPlaceholder(meta),
				},
			];
		case "gold-draft":
			return [
				{
					label: GOLD_DRAFT_ACCEPT_LABEL,
					meaning: "这一稿就是全书的最佳范例章",
					effect: GOLD_DRAFT_PASS_EFFECT,
				},
				{
					label: GOLD_DRAFT_REWRITE_LABEL,
					meaning: "这一稿作废，重写一章",
					effect: goldRewriteHint(meta),
				},
			];
		case "gold-measure":
			return [
				{ label: GOLD_SEAL_LABEL, meaning: "定稿，按这一章写全书", effect: GOLD_SEAL_EFFECT },
				{
					label: GOLD_WRITE_TARGETS_LABEL,
					meaning: "把逐章字数写回安排",
					// 票 `ui-display-redesign/07`：保存键改名后，这句提示与卡上逐字同一份
					// （`gold-table.js` 的出口）——「点『保存』才落盘」。
					effect: GOLD_WRITE_TARGETS_HINT,
				},
			];
		case "chapters":
			return [
				{ label: CHAPTERS_APPROVE_LABEL, meaning: "交工，合并成书", effect: CHAPTERS_APPROVE_EFFECT },
				{
					label: CHAPTERS_REVIEW_LABEL,
					meaning: "有意见就地写一条",
					effect: chaptersReviewLead(meta),
				},
			];
		case "final":
			return [
				{ label: FINAL_APPROVE_LABEL, meaning: "认可，交付这本书", effect: FINAL_APPROVE_EFFECT },
				{
					label: FINAL_REJECT_LABEL,
					meaning: "写一句要改什么，AI 改整本",
					effect: finalApprovalNote(meta),
				},
			];
		default:
			// `upload`／`delivered`／`status`：不是二选一拍板（站 1 是顺序动作、已交付不是拍板）。
			return [];
	}
}

/**
 * 「此刻能不能定，不能为什么」（`blocked: null | { reason }`）。
 *
 * ⚠️ **判据只吃 `(meta, gate)`**，所以它只认**账本里那几件事实**——今天恰好是站 9 那一位：
 * `✅ 就按这章的风格写全书` 的前置是「站 9 已拍板」（`决策/09.json`，服务端折进
 * `meta.stationDecisions[9]`），没拍板时那颗键灰着，理由取 `gold-table.GOLD_STATION9_NOT_DECIDED`。
 * 它**不是**新事实源：`gold-table.GoldTable` 的 `station9Decided` 读的是同一格。
 *
 * ⚠️ **票 `ui-display-redesign/07` 改了这一格的可见性口径**（spec §7.7#5）：卡上那句
 * 「站 9 还没拍板：先在下面点…」**整句删了**（写回键自身可用就是软提示）⇒ `blocked.reason`
 * 今天**不再逐字出现在那张卡上**，只是契约面的输入（AI 工具面／下一层渲染）。
 * ⛔ 别把这条读成「blocked 与界面无关」：那颗键的 `disabled` 仍与 `blocked !== null` 同源，
 * 一致性判据在 `test-component-cards.mjs`；但「理由在脸上」这一半**本票有意撤掉了**。
 *
 * ⚠️ 我的枚举面比现实窄在哪里（照实说，别把绿当全覆盖）：**卡内那几种「灰」不在本函数里**——
 * `busy`（局部在飞）、展示期（`displayPeriod`，要卡里读到的两份产物）、
 * `targetsDirty`（卡里正在改的字数）、目标一条都没读出来（站 3 的 `cleaned.length === 0`）。
 * 它们的判据输入不在 `(meta, gate)` 里，硬塞进来就要把卡的本地态提到契约层（另一张票的活）。
 * ⇒ 四件齐判据只在**契约判得到的那几格**上断「`blocked` 与那颗键的 `disabled` 一致」，
 * 边界逐条写在 `test/test-component-cards.mjs` 那一节的注释里。
 *
 * @param {string} decisionKey 卡级编号
 * @param {object | null | undefined} meta 状态投影
 * @returns {null | { reason: string }}
 */
function blockedOf(decisionKey, meta) {
	if (decisionKey !== "gold-measure") return null;
	const measured = meta?.stationDecisions?.[9] ?? meta?.stationDecisions?.["9"] ?? null;
	if (measured?.approved === true) return null;
	return { reason: GOLD_STATION9_NOT_DECIDED };
}

/**
 * 拍板契约：`{ question, decisionKey, options, keysAt, blocked }`（spec 实现决策 §5 的全部五格）。
 *
 * `question` 是给**状态条**渲染的那一句（`statusHuman` 的 `action` 就是它——一条路径，不是两处各算）；
 * `decisionKey` 是**卡级编号**（用户正看着哪张卡）；`options`／`keysAt`／`blocked` 是票 11 铺满的
 * 那三格（今天**不上屏**，它们是下一层渲染的输入；`blocked.reason` 已经在卡上就地可见）。
 *
 * ⚠️ **`keysAt` 从 `options[0].label` 派生**（收口 review A2）：它就是对同一批键的第二张 switch，
 * 而且 `keysAt` 恒等于 `options[0].label` ⇒ 删掉那张 switch、只留这一条派生。⛔ 别再加第二张
 * 按 `decisionKey` 分叉的表（`test-wording-invariants.mjs` 的 A2 那一节数着 `switch` 的张数）。
 *
 * ⚠️ 排序无关：`focusCardKey` 的路由顺序即语义顺序，本函数不另判一次，只消费它。
 * @param {object | null | undefined} meta 状态投影（站 8／9 那一档要 `stationDecisions`）
 * @param {object | null | undefined} gate 当前关卡
 * @returns {{
 *   question: string | null,
 *   decisionKey: string,
 *   options: { label: string, meaning: string, effect: string }[],
 *   keysAt: string,
 *   blocked: null | { reason: string },
 * }}
 */
export function decisionOf(meta, gate) {
	const decisionKey = decisionKeyOf(meta, gate);
	const question =
		decisionKey === "upload"
			? phase1TurnAction(meta)
			: decisionKey === "status"
				? FALLBACK_QUESTION
				: DECISION_QUESTION[decisionKey] ?? null;
	const options = decisionOptionsOf(decisionKey, meta);
	return {
		question,
		decisionKey,
		options,
		// 「本卡最下面」那颗定案键的文案＝主键那一条路的 label（同一个绑定，⛔ 不另写一份）。
		keysAt: options[0]?.label ?? "",
		blocked: blockedOf(decisionKey, meta),
	};
}


/**
 * 「轮到谁」的判据（**唯一一份**）：五个 `awaiting-*`（`awaiting-gold` 要减去展示期）＋ 关卡等拍板
 * ＋ 还在材料准备且没进过拍板。`meta` 为 null 时整体短路——没有书就没有「轮到你」。
 *
 * ⚠️ 票 `walkthrough-2026-10/04`（裁决甲）：`awaiting-gold` 那一档**要减去展示期**
 * （`goldDraftDisplayed`）——稿已在盘、这一步还没交工时验收面的定稿键正禁着，此刻说
 * 「轮到你 · 确认最佳范例章」就是把用户叫来点一颗按不动的键。那一档归「我正在做」。
 * @param {object | null | undefined} meta 状态投影（要带 `pendingStage` 才判得准展示期）
 * @param {object | null | undefined} gate 当前关卡
 * @returns {boolean}
 */
function humanTurnOf(meta, gate) {
	if (meta === null || meta === undefined) return false;
	const status = meta.status;
	if (
		status === "awaiting-explore" ||
		status === "awaiting-outline" ||
		(status === "awaiting-gold" && !goldDraftDisplayed(meta, meta.pendingStage)) ||
		status === "awaiting-chapters-review" ||
		status === "awaiting-final-approval"
	)
		return true;
	if (gate !== null && gate !== undefined && gate.status === "awaiting") return true;
	return meta.phase === 1 && gate === null;
}

/**
 * 把 `pendingStage`（住在 payload 顶层的那一位）并回状态投影——`statusHuman` 的输入契约是
 * 「一份书的状态投影」，而展示期（`awaiting-gold` ＋ `pendingStage === 'gold'`）只有它才判得准。
 *
 * 恒等短路（值本来就相同 ⇒ 原对象返回）：生产上 `meta.pendingStage` 与 payload 顶层那位同源
 * （`workflow.js` 的 `metaView` 是 `{...meta}`、顶层那一位是 `meta.pendingStage ?? null`），
 * 所以这一跳多数局面下不复制对象。
 *
 * @param {object | null | undefined} meta 状态投影
 * @param {unknown} pendingStage 待办阶段
 * @returns {object | null | undefined}
 */
export function withPendingStage(meta, pendingStage) {
	if (meta === null || meta === undefined) return meta;
	if (meta.pendingStage === pendingStage) return meta;
	return { ...meta, pendingStage };
}

/**
 * 值出口：状态投影 ＋ 关卡 → `{ word, tone, action, humanTurn }`（spec §1·1）。
 *
 * 分支顺序与今天状态条 `if/else` 链**同一顺序**（渲染结果逐字不变，判据见
 * `test-wording-invariants.mjs`「状态条那 7 个分支」一节）：
 * ① 已交付／出错／待配置（状态自己说了算）→ ② 轮到用户 → ③ 暂停（整条不出声）→ ④ 「我正在做」。
 *
 * @param {object | null | undefined} meta 状态投影（展示期要带 `pendingStage`）
 * @param {object | null | undefined} gate 当前关卡
 * @returns {{ word: string | null, tone: string, action: string | null, humanTurn: boolean }}
 */
export function statusHuman(meta, gate) {
	const humanTurn = humanTurnOf(meta, gate);
	// 票 `ui-systematic-fixes/11`：分支判定收进 `turnKindOf` **一处**（三处状态词的共同出处）；
	// 本函数只负责「这一档出什么词、什么图标、哪半句」——**行文归这里、判据不归这里**。
	const kind = turnKindOf(meta, gate);
	// 闭集未登记 ⇒ 不印（spec §2）；`STATUS_HUMAN` 的键集与 G3 判据同批维护。
	if (kind === "unregistered") return { word: null, tone: "normal", action: null, humanTurn };
	// ③ 暂停：整条不出声（「轮到你／出错／书做好了」那几支不受影响——它们已在上两支出完）。
	// ⚠️ 这一档**不查表**：暂停不是「某个 status」，是压在 status 上的一格；它的词就是「没有词」。
	if (kind === "paused") return { word: null, tone: "normal", action: null, humanTurn: false };
	// 词与取色**一律从 `STATUS_HUMAN` 取**（收口 review A1）：按 kind 取，跨 status 的 turn 才不会拿错。
	const said = humanOfKind(kind);
	// 表里没有这一档（`turnKindOf` 以后新加档、词表没跟上）⇒ 与「闭集未登记」同一处置：**不印**，
	// ⛔ 不让一次显示缺口升级成整块工作台崩掉（与 `stageHuman` 那条「渲染路径上不抛」同一取向）。
	if (said === null) return { word: null, tone: "normal", action: null, humanTurn };
	// ① 已交付／出错／待配置：今天 if/else 的第一组，先于「轮到谁」与暂停。
	if (kind === "done") return { word: said.word, tone: said.tone, action: deliveredAction(meta), humanTurn };
	if (kind === "error") return { word: said.word, tone: said.tone, action: said.action ?? null, humanTurn };
	if (kind === "config") return { word: said.word, tone: said.tone, action: said.action ?? null, humanTurn };
	// ② 轮到用户（五个 awaiting-* ＋ 关卡等拍板 ＋ 阶段一）。
	// 票 `ui-systematic-fixes/10`：这半句**不是这里拼的**——`decisionOf` 那一份契约给问句
	// （`decisionKey` 取「用户正看着哪张卡」，站 2／3 与站 8／9 两处错位因此在结构上消失）。
	// ⛔ 别在这里补第二句措辞：状态条那 11 格逐字钉着它（`test-wording-invariants.mjs`）。
	if (kind === "turn")
		return {
			word: said.word,
			tone: said.tone,
			action: decisionOf(meta, gate).question,
			humanTurn: true,
		};
	// ④ 剩下这一档：「我正在做」。`turn` 类走到这里只可能是**展示期**（稿在盘、这一步还没交工）。
	return { word: said.word, tone: said.tone, action: READY_NEXT_ACTION, humanTurn: false };
}

/**
 * 一本书的**壳级派生**（票 `depth-review-2026-10/08`）：壳（`client-entry.js` 的
 * `WorkbenchView`）在渲染体上方现算的这几格，收进本文件一处，壳只消费。
 *
 * 它收的是**判据**，不是快照解包：`meta` / `gate` / `events` / 待办阶段那几份输入由壳从
 * `book` 这份 snapshot 拆好递进来（那是投影的事实，不是派生）。本函数只做「从这些事实推出
 * 界面上要说的那句话」这一件事，纯函数、零副作用、不碰 React。
 *
 * ## 八个键与各自的印字出口（搬移不得改任何一个出口的字）
 *
 * **出工作台状态词的四个**（`CONTEXT.md` 三词上限：轮到你 / 我正在做 / 已完成，因此这一层
 * 一个字都不许动）：
 *   · `humanTurn` → `panels.StatusStrip` 出「⚡ 轮到你」（票 `ui-display-redesign/16` 起问句归卡头、
 *     状态条**不再**印 `decisionOf` 那一句；`humanTurn.action` 仍逐字保留在值出口里）；`panels.ActivityLine`
 *     在轮到用户时**整行不出现**（不是出第四个词）；`event-cards.PhaseBar` 只加「⚡」前缀
 *     （那不是三个词里的任何一个）。⚠️ **卡内还有一份自己的判据**（`event-cards` 的 PhaseBar
 *     多一项 `phase === 3`）——那是**另一个事实**，卡内那份照旧，不许合到这份里来。
 *     ⚠️ 票 `walkthrough-2026-10/04`（裁决甲）：`awaiting-gold` 那一档要**减去展示期**
 *     （`goldDraftDisplayed`）——稿已在盘、这一步还没交工时归「我正在做」，见那个函数的注释。
 *   · `pendingStageLabel` → `panels.StatusStrip` 出「我正在做：…」；`event-cards.StatusCard`
 *     出「⏳ <阶段名>」（票 `ui-display-redesign/20` 起卡内标题去掉「我正在做 · 」前缀）。
 *     ⚠️ **空串是正确答案**（`stageHuman` 那一段注释）：`StatusCard` 判 `!== ""` 才点名，
 *     任何非空兜底都会凭空多印一个来源不明的状态词。
 *   · `progressDetail` → 为空时经 `panels.activityClaimUnsupported` 把状态条那一格**整条摘掉**
 *     （`CONTEXT.md` 登记的「不算第四个状态词＝整条不出声」）。取数口径一个字没改。
 *   · `stall` → `panels.ActivityLine` 出「⏱ N 分钟没动静了」（票 20 起不带「我正在做」前缀）。
 *     ⚠️ `event-cards.StatusCard` 那句「只报时长」是**另一件事**（它那行的注释逐字这么写），
 *     两个措辞不许合并。
 *
 * **不出状态词的四个**：`checks`（机器检查项白话）、`aiReport`（AI 检查报告正文）、
 * `lastEvent`（错误正文 / 阶段标签 / 计时基准）、`needsConfig`（纯显示值）。
 *
 * ## 两条实施红线
 *
 * 1. **本函数返回的 `stall` 必须由壳**裸调用**取，不得包 `useMemo`**：`deriveStallJudgment` 的
 *    `now` 默认 `Date.now()`，记忆化会把时间基准冻在第一次渲染的那一刻（活性行永远停在同一句
 *    「N 分钟没动静了」）。本函数自身不记忆化，但**调用点**可以——那一处的注释与源码级断言钉着它。
 * 2. **`humanTurn` 不进 props 袋**：它只喂阶段片 / 状态条 / 活性行三个渲染点，壳从本函数的返回值里
 *    解构出来直喂那三处。把它塞进袋只会多一个没人消费的键。
 *
 * @param {{
 *   events?: unknown,
 *   meta?: unknown,
 *   gate?: unknown,
 *   pendingStage?: unknown,
 *   pendingGate?: unknown,
 *   mainAiRunning?: unknown,
 *   subagentRunningCount?: unknown,
 *   subagentActiveSince?: unknown,
 * }} input
 * @returns {{
 *   lastEvent: object | null,
 *   checks: unknown[],
 *   aiReport: unknown,
 *   progressDetail: string,
 *   pendingStageLabel: string,
 *   humanTurn: boolean,
 *   needsConfig: string,
 *   stall: { stalled: boolean, idleMs: number },
 * }}
 */
export function deriveBookViewFacts(input) {
	const {
		events,
		meta = null,
		gate = null,
		pendingStage = null,
		pendingGate = null,
		mainAiRunning,
		subagentRunningCount,
		subagentActiveSince,
	} = input ?? {};
	const list = events ?? [];
	const lastEvent = list.length > 0 ? list[list.length - 1] : null;
	// 交办待办阶段的界面词。⚠️ `gate` 那一格**自己短路**去调 `gateHuman`（带关卡号的那一份词），
	// 绕开 `STAGE_HUMAN`——那是票 `audit-matrix-contract/05` 的反证锚点，补 gate 词表不改变它。
	const pendingStageLabel =
		pendingStage === "gate" ? gateHuman(pendingGate ?? "?") : stageHuman(pendingStage);
	// 「轮到谁」：判据**只有一份**——值出口 `statusHuman`（票 `ui-systematic-fixes/02`）。
	// `pendingStage` 并回投影（展示期要它：`awaiting-gold` ＋ `pendingStage === 'gold'` 归「我正在做」，
	// 见 `goldDraftDisplayed`）；`meta` 为 null 时整体短路——没有书就没有「轮到你」。
	const humanTurn = statusHuman(withPendingStage(meta, pendingStage), gate).humanTurn;
	return {
		lastEvent,
		checks: lastEventOfType(list, "textbook/quality")?.data?.checks ?? [],
		aiReport: lastEventOfType(list, "textbook/ai-report")?.data?.report ?? null,
		progressDetail: stageScopedProgressDetail(list),
		pendingStageLabel,
		humanTurn,
		// 两个分支都带兜底文案、恒为非空串（`StatusCard` 只把它当纯显示值印一行）。
		needsConfig:
			lastEvent?.type === "textbook/error"
				? `${lastEvent.data?.task ?? ""}失败：${lastEvent.data?.message ?? ""}`
				: '请先配置大模型接口（右上角设置 → 模型），配好后点"继续"。',
		stall: deriveStallJudgment({
			mainAiRunning,
			subagentRunningCount,
			subagentActiveSince,
			lastWriteAt: meta?.updatedAt,
		}),
	};
}

// 焦点区（主卡）选哪张卡：把 WorkbenchView 的内联路由链抽成纯函数，可独立测试。
// ⚠️ 路由顺序即语义顺序（与历史实现一一对应）：拍板关卡 → 出错／待配置（状态卡）→
// 各确认闸门 → 交付 → 铺章章节卡 → 上传材料 → 状态卡。改了顺序必须同步改这里与调用点。
export function focusCardKey(meta, gate) {
  if (gate !== null && gate !== undefined && gate.status === "awaiting")
    return "gate";
  const status = meta?.status ?? "";
  // 票 `ui-systematic-fixes/07`：出错／待配置两档**优先**落状态卡。状态条在那一档说
  // 「⚠️ 轮到你 · 出错了，请看下面的提示」（`statusHuman` 的 action），而提示就是 `StatusCard`
  // 的两个异常分支——它已有「🔁 让 AI 接着干」（error）与「我配好了，继续」（needs-config）两颗
  // 现成键（都接既有 `resume`）。阶段判定（铺章 → 章节卡、材料准备 → 上传卡）排在这之前的话，
  // 它俩会被挡在门外 ⇒ 屏上两处喊「轮到你」、零颗键。⛔ 不新增 `status` 值、⛔ 不改状态机语义。
  //
  // ⚠️ **阶段一的 `error` 是唯一的例外**：那一档就是材料缺口屏——每份没转成的材料各有一颗
  // 「补传这一份」／「删掉这份」，而它们**只长在上传卡里**（`material-gap.js` 只被 `UploadArea`
  // 渲染，那是这些红源唯一能走的路）。按同一优先落到状态卡会把它们整块挡掉，只留下破坏性的
  // 「删除这本书重新建」（`test-workbench-first-screen.mjs` 里 `mineru-formats/03` 那两条链上
  // 判据当场红）。⇒ 这一格的上传卡**自己有错误分支**（`errorText` 印同一句正文），出口是
  // 「重传／补传／删份」，不是 `resume`。`needs-config` 没有这个例外：上传卡对它是**静默**的
  // （`errorText` 只在 `status === "error"` 时算），而状态条已经承诺「请看下面的提示」。
  if (status === "error" && meta?.phase !== 1) return "status";
  if (status === "needs-config") return "status";
  // 票 `confirm-points-redesign-build/05`：`awaiting-explore` 是**两个停点共用的那一个状态值**
  // （⛔ 不新增 `awaiting-*` 值，照关卡那一族的先例由账本折出子状态）——站 2 拍板那一刻写下
  // `meta.exploreConfirmed`，它还是 `true` 就说明「现在是第二件事」（那 3–5 条目标等人拍板）。
  if (status === "awaiting-explore") return meta?.exploreConfirmed === true ? "goals" : "explore";
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
 * 要**自动带进焦点区可视带**的那两张闸门卡（`autoScrollCardKey` 的清单，**只此一份**）。
 *
 * 就是票面写的那一类：「拍板 / 认可这类**唯一可行动作**」——`gate`（关卡拍板）与
 * `final`（最后检查认可）。**为什么只有这两张**（2026-09-30 双轴 review 之后收窄的）：
 *   · `explore`——**不收**。那张卡实测高 2949px、推进键在 `top 2926`；底对齐会把正在读报告的
 *     用户一把拽到几千字下面，那条理由**仍然成立**（所以这张表照旧只有 `gate`／`final`）。
 *     ⚠️ 但它原来那句「票 20 给了吸底条、它有第二出口了」**已经不成立**：票 18 裁决把那条吸底条
 *     整条删掉（同一屏里那颗键渲染两次）。**那一屏的高度改由票 20 的 2026-10-06 裁决治**——
 *     「读材料报告默认折叠」（落在 `confirm-cards.js` 那张卡自己身上）⇒ 推进键回首屏；
 *     ⛔ 本表照旧**不许**顺手把 `explore` 收进来（底对齐那条理由没变），见票 20 的 `## Comments`。
 *   · `outline` / `gold` / `chapters`——**不收**。票 20 的「不要一次改全部」仍然成立：
 *     票 24 报的是最后检查那一屏，这三张不是本票说的那一类。
 *
 * 要扩只改这张表一处，不在渲染处另写一遍。
 */
const AUTO_SCROLL_CARD_KEYS = Object.freeze(["gate", "final"]);

/**
 * 焦点区主卡路由出来的 key 是不是**要自动带进可视带**的那一张（票 `walkthrough-fixes/24`）。
 *
 * 名字照它回答的事起：它只判「这一张要不要被滚过去」，不判「这一张能不能改结果」
 * （那是 CONTEXT「现在」词条的事，`focusCardKey` 那个 `switch` 才是那张卡的内容）。
 *
 * @param {object | null | undefined} meta 当前书的状态投影
 * @param {object | null | undefined} gate 当前关卡
 * @returns {string | null} 是则返回那一张卡的 key，否则 `null`
 */
export function autoScrollCardKey(meta, gate) {
  const key = focusCardKey(meta, gate);
  return AUTO_SCROLL_CARD_KEYS.includes(key) ? key : null;
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

/**
 * 拍板提案的路径形状：`工作区/方案/<前缀>N-vM.md`（v1 与 v2/v3 修订件同形）。
 * ⚠️ 文件名的两个汉字是**机器身份词**（产物路径——CONTEXT.md「界面用词表」的判定线明写
 * 「文件名、产物路径……一个字不改」），不是界面词；但判定线① 的字面量扫描会把 `src/ui/**`
 * 里**含中文的字符串**一律当人眼可见的字检查，产物路径恰好长成那样。故这里用码点写前缀，
 * 值就是 `工作区/方案/关卡`；正则字面量不在扫描面内（`/^工作区\/方案\//` 照旧可用）。
 * 改这一行＝改契约：`domain-rules.productOpenMode` 的 GATE_PROPOSAL_RE 必须认同一个形状。
 */
const GATE_PROPOSAL_DIR = "工作区/方案/";
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
	if (label.startsWith("源探查")) out.push("工作区/explore.md");
	if (label.includes("章节骨架") || label.includes("章节安排")) out.push("工作区/outline.md");
	if (label.includes("最佳范例章")) out.push(chapterRel(goldChapterNo(meta)));
	if (label.startsWith("合并成书") || label.startsWith("最后检查")) out.push("工作区/book.md");
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
 * ②认得出的 `工作区/outline.md`（章节安排）是机器 JSON，判 `'inline'`（票 pipeline-wiring-gaps/09），
 * 放它过就是一个点了没反应的「打开」。
 *
 * ⚠️ **「自查第 N 章」故意没有候选**：它落的是 `工作区/audit-NN.md`——机器审计 JSON
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
		if (phase === 2) candidates.push("工作区/explore.md");
		else if (phase === 4) candidates.push(chapterRel(goldChapterNo(meta)));
		else if (phase === 5 || phase === 6) candidates.push("工作区/book.md");
	}

	// ⚠️ **三层的候选一律过产物判据**（票 pipeline-wiring-gaps/09）：label 形状层认得出
	// 「章节骨架 → 工作区/outline.md」，但那份文件内容是机器 JSON（`productOpenMode` 判 `'inline'`），
	// 而右栏通道只认 `'sidebar'`——候选放行出去，事件行就长出一个**点了没反应**的「打开」。
	// 那一族的出口是卡片内联折叠清单（`machine-product-folds.foldOutline` / `KnowledgeMapBlock`），
	// 与「自查第 N 章」不给 audit JSON 入口同源：机器产物不生死按钮。
	return candidates.filter((rel) => workEntryAction(rel) === "sidebar");
}

/**
 * **候选的"存在性"收紧 + 提案的免检例外**（这一条判据只此一份）。
 * ⚠️ 例外＝`工作区/方案/`：产物清单（`/textbook/work`）从不列它（只列 `工作区/*.md`），而"落提案文档"与
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

/** `工作区/chapter-NN.md`（两位序号是契约）。
 *  读侧宽松（`\d+`）：**能不能打开**由 domain-rules.productOpenMode 判（那儿才要求两位），
 *  名字这一层只负责"叫得出"——一份旧书里少补了个零的正文不该在界面上没名字。 */
const CHAPTER_NAME_RE = /^工作区\/chapter-(\d+)\.md$/;
/** 旧版产物目录（`工作区/_旧版产物/<文件>.<stamp>`；深改归档还会多一层 `深改-<id>/`）。 */
const ARCHIVED_NAME_RE = /^工作区\/_旧版产物\/(?:[^/]+\/)?(.+)$/;
/** 三次拍板的提案（`工作区/方案/关卡N-vM.md`，v1 与 v2/v3 修订件同形）。 */
const GATE_PROPOSAL_NAME_RE = /^工作区\/方案\/关卡(\d+)-v(\d+)\.md$/;
/** 材料转换稿（`材料/转换稿/<材料名>.md`，或 MinerU 拆份后的 `材料/转换稿/<材料名>/…`）。 */
const CONVERTED_SOURCE_NAME_RE = /^材料\/转换稿\/(.+)$/;
/** 精读细目（`工作区/细目/精读-NN.md`）——票 `context-budget/11` 接线后的家。 */
const DETAIL_NOTE_NAME_RE = /^工作区\/细目\/精读-(\d+)\.md$/;
/** 最后检查的五份分报告（`工作区/报告/final-NN.md`）——票 `context-budget/11` 落盘。 */
const FINAL_REPORT_NAME_RE = /^工作区\/报告\/final-(\d+)\.md$/;
/** 那份**派生**的条目并集（`工作区/报告/final-summary.md`）——票 `context-budget/12` 的机器拼装件。
 *  路径**不手写**：逐字取自 `domain-rules.finalAuditSummaryRel`（落盘路径的单一出处）。 */
const FINAL_SUMMARY_NAME = finalAuditSummaryRel();
/** 用户上传的原件（`sources/<文件名>`）。名字取自 `MATERIAL_FORMATS` 那一格的 `family` 无关——
 * **「给不给入口」才按格式判**，名字只答「这一份是什么」＝原件（`CONTEXT.md` 词条）。 */
const ORIGINAL_NAME_RE = /^sources\/(.+)$/;
/** 末段扩展名（`板书.v2.png` → `.png`）。名字里**不带任何扩展名**（转换稿那一支同此规矩）。 */
const NAME_EXTENSION_RE = /\.[A-Za-z0-9]+$/;
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
		const base = nameForRel(`工作区/${draftBaseName(archived[1])}`);
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
	// 原件（票 `mineru-formats/11` / `ADR-0029`）：形状「x 的原件」，与转换稿**同一个基名**
	// （取自原件名、去掉扩展名）——同一份材料的两个入口在界面上叫得出同一个东西的两半。
	// ⚠️ PDF 原件**没有**这个入口（`domain-rules.originalPreviewOpenable` 判掉），但名字仍在
	// 词表里：判「有没有入口」与判「它叫什么」是两条判据，名字这一层不重复那份判断。
	const original = ORIGINAL_NAME_RE.exec(path);
	if (original !== null) {
		const material = original[1].split("/")[0].replace(NAME_EXTENSION_RE, "");
		return material === "" ? "原件" : `${material}的原件`;
	}
	if (path === "工作区/explore.md") return "读材料挑重点的结果";
	if (path === "工作区/outline.md") return "章节安排";
	if (path === "工作区/style-spec.md") return "写作规范";
	if (path === "工作区/book.md") return "成书";
	// 站 3 那份正文（票 `goals-handoff-missing/01`）：它开右栏 ⇒ 词表里就必须有它的名字，
	// 否则界面上只剩类型词「文件」（同细目／报告那一族的口径）。名字取那一站的主题词
	// （与 `STATION_GOALS_TITLE`／卡头问句同一件事），⛔ 不把文件名里的版本号搬上屏。
	// 判据走 `isGoalDocRel`（那一族文件名的唯一出口），⛔ 不在这里手抄 `目标-v\d+`。
	if (isGoalDocRel(path)) return "学完要能做到什么";
	// 细目目录与报告目录（票 `context-budget/11`／`12` 落盘）。⚠️ **这一族**开右栏**，
	//   词表里就必须有它们的名字——不然界面上只剩一个类型词「文件」（判定线⑧，
	//   `test-product-open-mode.mjs` 的「有正文的产物都叫得出名字」那一格盯的就是这件事）。
	//   `终检` 是界面避免词，界面这一族一律说「最后检查」（与 brief 任务说明同一译法）。
	const detailNote = DETAIL_NOTE_NAME_RE.exec(path);
	if (detailNote !== null) return `第 ${Number(detailNote[1])} 份材料的精读细目`;
	const finalReport = FINAL_REPORT_NAME_RE.exec(path);
	if (finalReport !== null) return `最后检查·第 ${Number(finalReport[1])} 路分报告`;
	if (path === FINAL_SUMMARY_NAME) return "最后检查·五份分报告的汇总";
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
const AUDIT_FACT_PATH_RE = /^工作区\/audit(?:-[^/]+)?\.md$/i;

/** 产物事实里的时间是服务端给的；这里只做有效性检查与既有的可读时间格式化。 */
function artifactFactTime(modifiedAt) {
	const at = artifactFactTimestamp(modifiedAt);
	return at === null ? "" : formatTime(new Date(at));
}

/**
 * 一条产物事实的时刻 → **毫秒数**；读不出就 null（不猜、不填 0）。
 *
 * ⚠️ 票 20：**这是全仓读 `artifactFacts[].modifiedAt` 的唯一一处**（复审时把两处 reader
 * 合成一处——「同一件事实两处各读一遍、接受的形状还不同」正是本仓记档过的病）。
 * 生产形状是服务端的 `stat.mtimeMs`（一个数，`src/workflow.js` 的 `buildArtifactFacts`）；
 * 这里**也**认 ISO 字符串／`Date`，因为契约快照里写的就是时间，而**读不出就是读不出**——
 * 认不出的值落 null，调用方各自决定「说什么」（排序与格式化都不许拿 0 当时刻）。
 */
function artifactFactTimestamp(modifiedAt) {
	if (modifiedAt === null || modifiedAt === undefined || modifiedAt === "") return null;
	const ms = modifiedAt instanceof Date ? modifiedAt.getTime() : new Date(modifiedAt).getTime();
	return Number.isFinite(ms) ? ms : null;
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
			lines.push(time === "" ? `正文：${name}` : `正文：${name}（${time}）`);
		else lines.push(time === "" ? name : `${name}（${time}）`);
	}
	return lines.join("，");
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
	const fact = chapterAuditFact(segments, n);
	return fact === null ? "" : auditFactText(fact, artifactFactTime(fact.modifiedAt));
}

/**
 * 同一份服务端事实的**判据形态**（票 22）：这一章的检查记录是不是**比正文旧**。
 *
 * 与 `chapterAuditFreshnessText` 取的是**同一条 fact**（同一个 `chapterAuditFact`）——
 * 一句话「比正文旧，属于旧稿」和一颗「审过」徽章因此不可能一个说旧稿、一个说审过。
 * 取不到事实（没下发／没 stat 到／这一章还没写检查记录）→ `false`（**读不出不是「旧」**）。
 */
export function chapterAuditIsStale(segments, n) {
	const fact = chapterAuditFact(segments, n);
	return fact !== null && fact.freshness === "stale";
}

// ── 票 20（2026-09-30 用户裁决）：「谁在写这一章」的**唯一**判据 ──────────────────
//
// 病（2026-09-29 真机走查）：三章的徽章**逐字一样**地写着「⏳ 我正在做 · 执笔」，
// 而那一刻盘上只有第 1 章那一份正文、只有 1 个小助手在跑（跑的是第 1 章的检查）。
// 徽章不是「查出来的」——它是按「清单里有这一章、且它还没定稿」推导出来的。
// ⇒ **「我正在做」只留给真在做的事**，本节是它唯一的判据（章节卡徽章与步清单都经它）。
//
// 名额从**真实在跑的小助手数**来（`runningSubagentCount`，与顶栏「🔎 N 个小助手在跑」同一份读数
// ——票面 :93「第三问不是决策，是硬要求」：同屏两个数字必须一致）。候选从**真实产物**来：
// 这一章必须已经有产物落盘（票面 :98「没有产物就不许显示执笔中」），按产物最后一次被写下的
// 时刻从新到旧排——铺章是一章一章派的，最新的那一章就是刚开工的那一章。
//
// ⚠️ **主笔 AI 自己不占名额**：它派完活就在等，会话照旧 `running`；把它算进去会让
// 「我正在做」的行数恒比顶栏那个「N 个小助手在跑」多一行，票面 :104 要求的逐字相等立刻破。
// 主笔 AI 自己的在跑另有出处（横幅 / 活性行 / 状态条），章这一层不替它说话。
// ⚠️ 读不出 `modifiedAt` 的段**不进候选**：没有可陈述的时刻就排不出先后，
// 拿别的章的时刻顶替是又一次把猜测说成事实。

/** 章段的章号（`chapter-N` 的 N）；不是章段就 null。 */
function chapterNoOfSeg(seg) {
	const match = /^chapter-(\d+)$/.exec(String(seg?.key ?? ""));
	return match === null ? null : Number(match[1]);
}

/** 这一段上的产物最后一次被写下的时刻（各条 `artifactFacts` 里最晚的那个）；读不出 → null。 */
function segmentArtifactTouchedAt(seg) {
	const facts = Array.isArray(seg?.artifactFacts) ? seg.artifactFacts : [];
	let latest = null;
	for (const fact of facts) {
		const at = artifactFactTimestamp(fact?.modifiedAt);
		if (at === null) continue;
		if (latest === null || at > latest) latest = at;
	}
	return latest;
}

/** 这一章 AI 自报的流水线阶段是不是「还在进行中」（非空、且不是 `done`）。**认领的第三条判据**。 */
function chapterStageInFlight(seg) {
	return typeof seg?.stage === "string" && seg.stage !== "" && seg.stage !== "done";
}

/**
 * 「谁在写这一章」的认领表（票 20 · **状态与归属唯一的来源**）：一组**章号**。
 *
 * 判据**三条**，缺一条不进候选：**该章产物在不在**（票面 :98）、**AI 说它还在进行中**、
 * **名额够不够**（名额＝在跑的小助手数）。名额用完就停 ⇒ **认领数 ≤ 名额**，票面 :63/:104「顶栏 N 个小助手在跑 ＝ 列表里 N 行我正在做」
 * 那条硬要求由构造保证：屏上**永远不会出现比在跑的小助手还多的「我正在做」**。
 *
 * ⚠️ **两个方向都要说准，别只说一个**（复审时把「恒等于」这句改掉）：
 *   · 候选比名额**多** → 行数 ＝ 名额（相等，常见情形）；
 *   · 候选比名额**少**（如刚派出去、正文一个字都还没落盘） → 行数 **小于**名额。
 *     那种时刻屏上是「0 行我正在做 / 1 个小助手在跑」，**两个数字各自都在说自己那件事**，
 *     少说的那一格是「还没开始」而不是谎报——比反过来（说一件没人做的事）安全得多。
 *   · 名额多于章数（在跑的小助手里有别阶段的，末检查那 5 个分查就是） → 行数 ＝ 章数。
 *
 * ⚠️ 这里**只回答「有没有人认领」**，不捎带「在干哪一道工序」：工序由各调用点已经拿到的那份
 * `chapterPipeline`／`seg.stage` 说（同一个上游事实）。往这张表里塞一份没人读的载荷就是
 * 「凭猜测给归属命名」，正是本票要治的那件事。
 *
 * @param {unknown[]} segments 服务端下发的分段（每章一段，带 `status` / `artifactFacts`）
 * @param {unknown} runningSubagentCount 在跑的小助手数（`indexSubagentDescendants()` 那个 `runningCount`）
 * @returns {Set<number>} 被认领的章号
 */
export function indexRunningChapterClaims(segments, runningSubagentCount) {
	const claims = new Set();
	const slots = Number.isSafeInteger(runningSubagentCount) && runningSubagentCount > 0 ? runningSubagentCount : 0;
	if (slots === 0) return claims;
	const candidates = [];
	for (const seg of Array.isArray(segments) ? segments : []) {
		const n = chapterNoOfSeg(seg);
		if (n === null) continue;
		// 已交工的章没有人在写它（`status: 'done'` 是服务端 `chapterDone` 那一份，与徽章同源）。
		if (seg?.status === "done") continue;
		const touchedAt = segmentArtifactTouchedAt(seg);
		if (touchedAt === null) continue;
		// ⚠️ 认领的**三条**硬判据，第三条是「AI 说它还在进行中」（`stage` 非空且不是 `done`）。
		// 为什么自报也能当判据之一：票面 :98 只禁「没有产物就说执笔中」，没有说「有产物就许说」。
		// 而**只按产物排**会在好几个章都有正文时随便挑一个（走查实测：四章的书里第 3 章上报
		// writing、正文刚写完的第 4 章时间戳更新 ⇒ 名额落到第 4 章，屏上就说「在写第 4 章」）。
		// 三条齐了才是「有东西正在这一章上发生」；缺任何一条都**整格不出声**（票 14 的老规矩：
		// 宁可少说一句，也别拿一句新的假静默换一句旧的实话）。
		if (!chapterStageInFlight(seg)) continue;
		candidates.push({ n, touchedAt });
	}
	// 同为进行中的几个候选：产物最新的在前（铺章是一章一章派的，最新的就是刚开工的那一章），
	// 同一时刻按章号。
	// ⚠️ 候选多于名额时这一层**仍然是推断**：宿主没给「哪个小助手在写哪一章」的逐个归属
	// （会话摘要只有 id/parentId/origin/running），所以「谁被认领」是排出来的，不是看见的。
	candidates.sort((a, b) => b.touchedAt - a.touchedAt || a.n - b.n);
	for (const candidate of candidates.slice(0, slots)) claims.add(candidate.n);
	return claims;
}

/** 那一章的「检查记录」事实（`chapter-N` 段里 kind 为检查记录的那条）；没有就 null。 */
function chapterAuditFact(segments, n) {
	const list = Array.isArray(segments) ? segments : [];
	const seg = list.find((row) => row?.key === `chapter-${n}`);
	if (seg === undefined) return null;
	const facts = Array.isArray(seg.artifactFacts) ? seg.artifactFacts : [];
	for (const fact of facts) {
		if (fact === null || typeof fact !== "object") continue;
		const path = relPath(fact.path);
		if (artifactFactKind(fact, path) !== "检查记录") continue;
		return fact;
	}
	return null;
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
 * ⚠️ 机器产物（`工作区/audit-NN.md`，动作 `none`）与走卡片内联的（`工作区/knowledge-map.json`，
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
	// 第 1 版不写版次、第 2 版起写「，第 M 版」（CONTEXT「产物名」的 v1 规矩）。
	// 分隔符取逗号而不是括号：括号已经被你的备注占着（`✅ 通过（备注）`）。
	const versionSuffix = (raw) => {
		const version = Number(raw);
		return Number.isInteger(version) && version >= 2 ? `，第 ${version} 版` : "";
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
 * 材料行的三态图标——**上传卡与阶段页材料清单共用这一份**（票 `mineru-formats/02`）。
 *
 * ⚠️ 这两个模块原先各写一份 `converted === true ? "✅" : "⏳"`（`event-cards.js` 的上传卡
 * 与 `phase-page.js` 的材料清单），而**只改一处照样全绿**——布尔升三值时失败的那一份
 * 仍然把 `failed` 说成「还在转」。两份拷贝收成一份之后，界面上「转失败了」才有唯一读法。
 *
 * 三个取值都取自 `domain-rules.CONVERTED_STATES` 派生的那份表（真值在领域规则模块，
 * 这里是展示映射）；`convertedState` 一并再导出，UI 组件只从本文件取这两个件。
 * ⚠️ 图标**不是工作台状态词**（`CONTEXT.md`「材料缺口」：逐源明细，不占三个状态词的名额）。
 */
const CONVERTED_ICON = Object.freeze({
	pending: "⏳",
	ok: "✅",
	failed: "❌",
});

/** 一份材料该印哪个图标（老书布尔经 `convertedState` 只读归一，不另判）。 */
export const convertedIcon = (source) => CONVERTED_ICON[convertedState(source)];

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
	return parts.join("，");
}

/** 每个阶段在干什么（阶段页顶部一句说明；界面词）。 */
export const PHASE_INTRO = Object.freeze({
	1: "你把材料传上来，机器把它转成能读的正文。",
	2: "AI 读完材料、挑出重点，等你确认。",
	3: "三次拍板：定下学习目标与难点、教学方法与板块、全书架构与章节，再排好章节。",
	4: "先写一章给你过目，定下全书风格。",
	5: "一章一章写，每章机器检查过，你随时能抽查提意见。",
	6: "AI 把全书整体调整一遍 + 机器硬检查，你认可后交付。",
});

/**
 * 阶段 5 那句「每章机器检查过」**不成立**时，同屏换成的话（票 `pre-gold-build/08`，承诺面②）。
 *
 * ── 病（依据 `.scratch/pre-gold-processes/spec.md` 债-05）─────────────────────────
 * **承诺面**：界面文案（给用户）——阶段页抬头那句「一章一章写，**每章机器检查过**，你随时能抽查提意见。」
 * **实现面今天判什么**：那一跳的机器判据**带两个生效条件**（`src/workflow/actions/chapters.js`：
 * `subMeta.demo !== true && !waived(project, 'audit-skip')` 才读 `工作区/audit-NN.md` 判
 * `passed === true`）——**演示书**与**勾过 `audit-skip` 豁免**（`meta.waivers[].item === 'audit-skip'`）
 * 的书**整段跳过**该检查 ⇒ 在那两支上「每章机器检查过」**零判据**。而原句是**无条件渲染**的
 * （唯一出口 `phase-page.js` 的 `h("p", { style: P.intro }, page.intro)`）⇒ 那句承诺比机器做的多。
 * 处置照 `CONTEXT.md`「承诺过度」的 remedy：**收敛成带条件的说法**（票面二选一里的前一支）。
 *
 * ── 为什么是「换一句话」而不是「补一句诚实提示」───────────────────────────────────
 * 同仓那条先例（`demoQualityChecksNote`，演示通道终检那两块）说的是「少跑了哪几项」——那时原承诺
 * 仍然成立（只是项数不同）。这里不同：豁免生效时**每章那道检查根本没跑**，原句留在屏上就是一句
 * 假话 ⇒ 必须**不再出现**（票面完成判据第 2 条要的正是这个读数）。
 *
 * ── ⚠️ 我的枚举面比现实窄在哪里 ────────────────────────────────────────────────
 * `auditSkipWaived` 只读 `meta.waivers` 的 `item` 与 `userNote`（非空），**不核 `scope.book`**——
 * 服务端 `waived()` 还要 `scope.book === projectId`，而前端手里没有那个比较基准。方向是安全的：
 * 认不出的豁免**多说一句实话**（少承诺），⛔ 不会把没生效的豁免说成生效。
 * ⚠️ 它**不是判据**：一句文案的取舍不拦任何人、也不放宽任何东西——那一跳的豁免判定仍在
 * `chapters.js` 原处（登记在 `src/demo-exemptions.js` 的 `audit-skip` 与 `gold-audit-clean` 两条）。
 */
export const auditSkipWaived = (meta) =>
	(meta?.waivers ?? []).some(
		(w) =>
			w?.item === "audit-skip" &&
			typeof w?.userNote === "string" &&
			w.userNote.trim() !== "",
	);

/** 演示通道的阶段 5 抬头（`chapters.js` 那一格对演示书整个不分叉）。 */
export const DEMO_PHASE5_INTRO = "一章一章写，你随时能抽查提意见。演示模式：每章不跑机器检查。";

/** 勾过 `audit-skip` 豁免的书在阶段 5 的抬头（注文与会话里那句「你已同意」同一口径）。 */
export const AUDIT_SKIP_PHASE5_INTRO =
	"一章一章写，你随时能抽查提意见。你已同意不要求每章都有独立审查：每章那道机器检查不跑。";

/**
 * 阶段页抬头那一句（**唯一出口**；`stage-step-model.js` 的相投影调它，其余处不许自己拼）。
 *
 * 只有阶段 5 那一句带生效条件（见上）；其余阶段原样返回 `PHASE_INTRO`。
 *
 * @param {number} phase 阶段号
 * @param {{demo?: boolean, waivers?: Array<{item?: string, userNote?: string}>}|null|undefined} meta 当前书的状态
 */
export function phaseIntro(phase, meta) {
	if (phase !== 5) return PHASE_INTRO[phase] ?? "";
	if (isDemoBook(meta)) return DEMO_PHASE5_INTRO;
	if (auditSkipWaived(meta)) return AUDIT_SKIP_PHASE5_INTRO;
	return PHASE_INTRO[5];
}

/**
 * 拍板卡「已通过」那一行下面的**存档提示句**（**唯一出口**；`event-cards.js` 的 `GatePanel` 调它）。
 *
 * ── 票 `demo-channel-full/20` 的病 ─────────────────────────────────────────────
 * 原句说「要改更早的决定，**等 AI 停手**（或先 ⏸ 暂停）后…用『定点修改』」。它对**演示书**是一句
 * **假话**：演示通道**零 LLM**、压根没有 AI 在跑（没有「停手」这个状态可等）；而那颗键在演示书上
 * 虽然**看得见**（票 17 落地），点下去也**不会重做任何东西**（服务端固定 409 ＋ 那句
 * `DEMO_DEEP_MODIFY_NOTICE`）。处置照 `CONTEXT.md`「承诺过度」的 remedy：**同一句文案的两个取值**，
 * ⛔ 不新增分叉、⛔ 不新增豁免（决定 4）。
 *
 * ── ⚠️ 位置订正（施工时按盘上事实改的，票面原指 `client-entry.js` 的无书首屏）──────────────
 * 票面把那句提示指到 `src/client-entry.js` 的 `simpleSurface`。那一屏只在 `meta === null || loading`
 * 时渲染，而**演示书有书、走的是 `projectView`** ⇒ 那句提示在任何演示帧上都**到不了人眼前**
 * （取样：`node scripts/gallery.mjs list` 的演示通道九帧 ＋ 夹具 `dev/gallery/fixtures/demo-phase-1.json`
 * 的 `/textbook/projects` 回包里 `"demo":true`；票面给的那条 `meta?.demo` 取样命令在
 * `client-entry.js` 上**零命中**）。演示书上**真正读到**这句假话的是**这里**——`demo-phase-5`／
 * `demo-phase-6` 那几帧的拍板卡「已通过」条。⇒ 出口落在这里；首屏那句已列进票面 `## Comments`。
 *
 * ── ⚠️ 我的枚举面比现实窄在哪里 ──────────────────────────────────────────────
 * 本出口只管**这一句**（拍板卡已通过条）：它⛔ 不是判据、不拦任何动作、不放宽任何东西，
 * 「等 AI 停手」在别处的其它出现（若有）不在本票射程。
 */
export const GATE_DECIDED_NOTE =
	"之后想改：可回退到最近一次存档；要改更早的决定，等 AI 停手（或先 ⏸ 暂停）后展开上面的步清单点那一步，用「定点修改」。";

/** 演示书上同一格的取值：说清没有 AI 可等、也没有可回退重做的真实段（与 `DEMO_DEEP_MODIFY_NOTICE` 同一口径）。 */
export const DEMO_GATE_DECIDED_NOTE =
	"之后想改：可回退到最近一次存档。演示书没有 AI 在跑，所以没有「等它停手」这回事；要改更早的决定，展开上面的步清单点那一步、用「定点修改」——那一步在演示书里只是给你看它长什么样，点下去不会重做任何东西。";

/**
 * 正文**逐字**是上面两份之一（⛔ 不在这里拼第二份措辞）；`meta` 认不出是演示书时按**真书**那一句。
 *
 * @param {{demo?: boolean}|null|undefined} meta 当前书的状态
 */
export function gateDecidedNote(meta) {
	if (isDemoBook(meta)) return DEMO_GATE_DECIDED_NOTE;
	return GATE_DECIDED_NOTE;
}

/**
 * 章节卡页脚那条**「存档 ＋ 定点修改」提示**（**唯一出口**；`chapters-map.js` 的 `ChaptersCard` 调它）。
 *
 * ── 票 `demo-channel-full/22` 的病 ─────────────────────────────────────────────
 * 原句向用户承诺三件事：① 每交完一章会存档；② 随时能回到最近一次存档（写完整本那段时间里停在
 * 上一章交完的地方）；③ 用「定点修改」能改更早的决定。**演示书**上①的后半与③都不成立：
 *  · **存档面的读数**（一次性探针 `.scratch/demo-channel-full/t-22-probe.mjs` 的 B／⑧／⑩，不入库）：
 *    演示书从建书走到交付，盘上一共 **8 份存档**，reason 逐份是「提交／修订「第 N 次拍板」方案之前」
 *    与「交办「合并成书」之前」——**一份「交工「第 N 章」之后」都没有**（那是真书
 *    `chapters.js` 的 `chapter-submit` 成功路径写的，演示通道的章不经过那一跳）；
 *  · **定点修改**在演示书上**入口可见（票 17）、点下去不会重做任何东西**（动作层 409 ＋
 *    `DEMO_DEEP_MODIFY_NOTICE`）。
 * 处置照 `CONTEXT.md`「承诺过度」的 remedy：**同一句文案的两个取值**（先例：本文件的
 * `gateDecidedNote` 与 `DEMO_GATE_DECIDED_NOTE`，票 20），⛔ 不新增分叉／豁免（地图决定 4）。
 * **真书那侧一个字不改**——原句逐字搬进 `CHAPTERS_FOOTER_NOTE`。
 *
 * ── ⚠️ 位置是**读数**定的，不是静态路由推断（本票的第一件活就是做读数）────────────
 * 这句在屏上的那一帧是 **`demo-phase-5`**（阶段五·全章过目）：真浏览器逐帧读数（
 * `node scripts/gallery.mjs read --screens=demo-phase-1,…` ＋ 同一台画廊页上读 `document.body.innerText`）
 * 九帧里**只有它**命中；真引擎 ＋ 真界面走一遍演示书的交互取样，在阶段五那一帧同样命中。
 *
 * ── ⚠️ 我的枚举面比现实窄在哪里 ──────────────────────────────────────────────
 * 本出口只管**这一句**（章节卡页脚）：⛔ 它不是判据、不拦任何动作、不放宽任何东西。同族的其它
 * 「AI 会改」句子（拍板卡那两支、`engine.announceText` 的驳回落账句）各有自己的出口，不在本函数射程。
 * ⚠️ 演示取值**有意不提「回到最近一次存档」**：那是回退那颗键的行为，本票**没有**在演示书上跑过它
 * ⇒ 不写一句没读过的承诺（少一句承诺是允许的，多一句没发生的才是本票治的病）。
 */
export const CHAPTERS_FOOTER_NOTE =
	"📌 每交完一章、每次交办或拍板前都会自动存档；随时能回到最近一次存档——写完整本那段时间里，它就停在上一章交完的地方。想改更早的决定，展开上面的步清单点那一步，用「定点修改」。";

/** 演示书上同一格的取值：说清存档没有「每章」那一种、定点修改点下去不会重做任何东西。 */
export const DEMO_CHAPTERS_FOOTER_NOTE =
	"📌 演示书会在每次交办或拍板前自动存档（没有「每交完一章」那一种）；想改更早的决定，展开上面的步清单点那一步、用「定点修改」——那一步在演示书里只是给你看它长什么样，点下去不会重做任何东西。";

/**
 * 正文**逐字**是上面两份之一（⛔ 不在这里拼第二份措辞）；`meta` 认不出是演示书时按**真书**那一句。
 *
 * @param {{demo?: boolean}|null|undefined} meta 当前书的状态
 */
export function chaptersFooterNote(meta) {
	if (isDemoBook(meta)) return DEMO_CHAPTERS_FOOTER_NOTE;
	return CHAPTERS_FOOTER_NOTE;
}

/**
 * 章节安排确认卡上**驳回表单**那行输入框的提示语（**唯一出口**；`confirm-cards.js` 的
 * `OutlineConfirmCard` 调它）。
 *
 * ── 票 `demo-channel-full/24` 的病 ────────────────────────────────────────────
 * 原句逐字「想怎么调，写在这里（**可不填，AI 会自己重新安排**）」。**演示书**上没有 AI
 * （零 LLM），而且驳回之后新版与旧版**逐字相同**（714 B，sha 前后一致）、用户写的那句意见
 * 在演示支**零下游**（只落 `meta.outlineRedoNote`，读它的唯一一处是真书 brief）
 * ⇒「AI 会自己重新安排」这一句在演示书上说的事**不会发生**。
 * 处置照 `CONTEXT.md`「承诺过度」的 remedy：**同一句文案两个取值**（先例：本文件的
 * `chaptersFooterNote`，票 22），⛔ 不新增分叉／豁免。**真书那侧一个字不改**——原句逐字搬进
 * `OUTLINE_REJECT_PLACEHOLDER`。
 *
 * ── ⚠️ 位置是**读数**定的（票 22／23 的教训）──────────────────────────────────
 * 这两句在**用户做决定之前**就在眼前：真浏览器 ＋ 真 `WorkbenchView` 走一遍演示书，到章节安排卡
 * 点开「🔁 让 AI 重做」之后，`textarea` 的 `placeholder` 逐字读到原句
 * （本票探针 `.scratch/demo-channel-full/t-24-probe.mjs` 的 `live` 段 D2 列 = 1）；
 * 而工作台**九帧**上它零命中（那九帧的表单是收着的）。⇒ 出口落在本函数。
 *
 * ── ⚠️ 我的枚举面比现实窄在哪里 ──────────────────────────────────────────────
 * 本出口只管**这一行 placeholder**。同一张表单上还有两处同族邻居，**不在本出口的射程内**：
 *   · 那颗提交键的面文「🔁 就这样重新安排」——键本身就是那个动作的名字，改它＝改产品面
 *     （改键名／改键的行为／容忍这句话三选一），票面明令**停下来说清楚**，见本票 `## Comments`；
 *   · 表单小标题「改哪里？写一句（…）」——同一形态（问了「改哪里」而演示书不会改），
 *     同样只记 `## Comments`。
 */

/** 真书那侧**逐字原句**（票 22 的先例：搬进常量，不在别处留副本）。 */
export const OUTLINE_REJECT_PLACEHOLDER =
	"想怎么调，写在这里（可不填，AI 会自己重新安排）";

/** 演示书上同一格的取值：说清会**原样再写一遍**、写进去的话不会进到安排里。 */
export const DEMO_OUTLINE_REJECT_PLACEHOLDER =
	"想怎么调，写在这里（可不填；演示书会把同一份安排原样再写一遍，你写的话不会进去）";
/**
 * 段落三键（😕／🗑）**确认层**那句话（**唯一出口**；`gold-table.js` 的 `GoldReader` 调它）。
 *
 * ── 票 `demo-channel-full/25` 的病 ─────────────────────────────────────────────
 * 原句向用户承诺两件事：① AI 会照这条改这一章；② 这一章交工前必须先处置它。**演示书**上①不成立
 * ——演示通道**零 LLM**（没有 AI 这回事），②对演示书**没有对象**（见下面那段读数：用户提不出段落
 * 意见，一个字节都不落）。而这一句是**点键那一刻本地渲染**的（不经服务端）⇒ 它跟 `gold.js` 那条
 * demo 409 红线无关，演示书上用户**今天就能读到它**。
 * 处置照 `CONTEXT.md`「承诺过度」的 remedy：**同一句文案的两个取值**（先例：本文件的
 * `gateDecidedNote` 票 20 ／ `chaptersFooterNote` 票 22），⛔ 不新增分叉／豁免（地图决定 4）。
 * **真书那侧一个字不改**——原句逐字搬进 `PARA_MARK_CONFIRM_NOTE`。
 *
 * ── 读数是这么来的（本票的第一件活；探针不入库，跑法见那两行注释）────────────────
 * `node .scratch/demo-channel-full/t-25-probe.mjs`（自造一次性 DSH_HOME，不碰真实书夹）：
 *  · **A／九帧**（真浏览器 ＋ 画廊 `scripts/gallery.mjs` 的 serve）：这句话在演示通道**九帧上零命中**
 *    （它要点一下键才渲染）；九帧里**只有 `demo-phase-4`（谈判桌·等范例章拍板）**摆着段旁三键
 *    （15 颗＝5 段 × 😕🗑✏️）；`demo-phase-5`（过目态章节卡）要先点一次「▸ 展开第 1 章正文」才出现。
 *  · **B①／谈判桌**（真引擎 ＋ 真界面：演示书 `phase=4 status=awaiting-gold demo=true`）：点 😕 →
 *    确认层**当场**出现（0ms，且**这一段窗口内零 RPC** ⇒ 本地渲染），逐字
 *    「确认：把第 1 段记成「😕 不喜欢这种写法」？」＋「AI 会照这条改这一章；这一章交工前必须先处置它。」；
 *    点「✅ 提交这条」→ `POST /textbook/action` **200**，意见落 `meta.goldOpinions`（0 → 1 条）。
 *  · **B②／过目态章节卡**（同一本演示书推到 `phase=5 status=awaiting-chapters-review demo=true`）：
 *    点 😕 → 同一句逐字（同样 0ms／零 RPC）；点「✅ 提交这条」→ **409**
 *    「现在不在最佳范例章确认环节」⇒ 账本 **54 → 54 笔**、`工作区/` 顶层指纹面 **15 件逐字相同**、
 *    `pendingReviews` 逐条相同——**一个字节都不落**（与 `src/demo-exemptions.js` 里
 *    `gold-chapter-opinions` 那条登记同口径）。
 *  · **零 LLM 是读出来的**：同一次跑批 `modelSeamArmed() === true`（接缝装着、摸到就记账并抛）
 *    而 `MODEL_CALL_ATTEMPTS` 为空 ⇒ 全程一次都没碰过宿主的模型侧服务。
 *  · **「交工前必须先处置它」那半句对演示书的读数**（B②c）：把演示书**自带**那条示例段落意见翻回
 *    `pending` 再点「过目通过」，闸门**当场 409**「还没到能交工的时候：第1章《数的认识》：还有未处置的
 *    抽查意见…」⇒ 那半句在「真有这么一条」时是**真的**；但演示书上今天两条段落/整章意见**都是
 *    `applied`**，用户自己那条又提不出来（B②）⇒ 这一句对演示书**没有对象**，故演示取值里**整句不写**它
 *    （少一句承诺是本票允许的，多一句没发生的才是病）。
 *
 * ── ⚠️ 我的枚举面比现实窄在哪里 ──────────────────────────────────────────────
 * 本出口只管**这一句**（段落三键的确认层）：⛔ 它不是判据、不拦任何动作、不放宽任何东西。
 * 同一屏上还有几句「AI 会…」的兄弟句（`GoldReader` 的标记方法行尾「点意见单里的【让 AI 照这些改】」、
 * 提交后那句提示条「点【让 AI 照这些改】，AI 才会照它改。」、修订键「🔁 让 AI 照这些改（1 条）」）——
 * 它们**不在本票射程**（票面明令只记 `## Comments`、别扩范围），本出口一个字都不替。
 * ⚠️ 演示取值**有意只说「没有 AI、这一条不会交给谁去改这一章」**：演示书上这一下到底落不落账
 * **两个宿主不一样**（谈判桌 200 落意见单／过目态 409 一个字节不落）⇒ 一句通吃的措辞只会有一半说假话，
 * 故两个宿主共用**同一个**演示取值、只说两处都成立的那件事。
 */
export const PARA_MARK_CONFIRM_NOTE =
	"AI 会照这条改这一章；这一章交工前必须先处置它。";

/** 演示书上同一格的取值：说清没有 AI，这一条不会交给谁去改这一章。 */
export const DEMO_PARA_MARK_CONFIRM_NOTE =
	"演示书里没有 AI：这一条不会交给谁去改这一章。";

/**
 * 正文**逐字**是上面两份之一（⛔ 不在这里拼第二份措辞）；`meta` 认不出是演示书时按**真书**那一句。
 *
 * @param {{demo?: boolean}|null|undefined} meta 当前书的状态
 */
export function outlineRejectPlaceholder(meta) {
	if (isDemoBook(meta)) return DEMO_OUTLINE_REJECT_PLACEHOLDER;
	return OUTLINE_REJECT_PLACEHOLDER;
}


export function paraMarkConfirmNote(meta) {
	if (isDemoBook(meta)) return DEMO_PARA_MARK_CONFIRM_NOTE;
	return PARA_MARK_CONFIRM_NOTE;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 票 `demo-channel-full/26`（清仓）：这一族「AI 会／正在…」句子的**残余**
// ══════════════════════════════════════════════════════════════════════════════════════════
//
// ## 这一节是什么
//
// 演示通道**零 LLM**，而界面上还有一批「**AI** 会／正在／在 ＋ 动作」的句子。这一族已逐句治过
// 四轮（票 20／22／24／25 就是本文件上面那四个出口族），票 26 是**清仓**：一次扫完残余。
// 做法照票 20／22／24／25 的先例，一个字都不新发明：
//   · **同一句文案两个取值**（真书那一份 `XXX` 逐字搬过来，演示那一份 `DEMO_XXX`）；
//   · 出口收成**一处**（`xxx(meta)`，正文逐字是上面两份之一，⛔ 不在这里拼第二份措辞）；
//   · 复用**现成的** `isDemoBook`（⛔ 不另写 `meta?.demo === true`）；
//   · **真书那侧一个字不改**；⛔ 不新增分叉／豁免（地图决定 4）。
//
// ## ⚠️ 每一句的演示取值都**读过**才写（票 22／23 的教训：位置与真伪都不许由静态推断下）
//
// 读数出处＝一次性探针 `.scratch/demo-channel-full/t-26-probe.mjs`（**不入库**，可重跑；
// 三段：`corpus` 真引擎跑到 delivered 收五条通道、`frames` 真浏览器九帧逐帧读
// 正文／`placeholder`／`title`、`ui` 真引擎＋真界面逐屏交互取样）。逐句证据写在各句上面。
//
// ## ⚠️ 我的枚举面比现实窄在哪里（本仓纪律，票面要求写进 `## Answer`）
//
// 本节只覆盖**这一族里被探针读到过的那几句**：写法面＝「AI／小助手 ＋ 会／正在／在 ＋ 动作词」
// 的**承诺句**，通道面＝会话播报／`过程记录.md`／事件流与回放列表／工作台屏（真浏览器逐帧）／
// 表单 placeholder 这五种。⇒ 三类**不在**本节射程，逐条记在票面 `## Answer`：
//   ① **键面文**（`🔁 让 AI 重做` 这类）——维护者 2026-10-15 裁决容忍（map 决定 42），⛔ 不改；
//   ② **过去式陈述与名词标签**（`AI 已处理完材料，整理出…`／`🤖 AI 开始：…`／`AI 检查报告`）——
//      是**另一族措辞**，不在这份枚举面里；
//   ③ ⛔ 不证用户看懂改过的话（人工边界），也⛔ 不证真书那一侧的通路对不对（本票只看演示书这一支）。

/** 演示书上「轮到你」时那句阶段一动作（`panels.js` 的 `StatusStrip` 调它）。 */
export const PHASE1_TURN_ACTION = "上传教材（开始转换后 AI 会自动接手）";
export const DEMO_PHASE1_TURN_ACTION = "上传教材（演示书不真跑转换；点「▶ 开始演示」往下走）";

/**
 * 阶段一那一句的取值。
 *
 * ── 读数（探针 `frames` 段的 `demo-phase-1` 正文 ＋ `ui` 段的起始屏，两处都命中 1）──
 * 演示书的阶段一是**展示态**（`demo-exemptions.js` 的 `phase1-no-real-conversion`）：不真跑转换、
 * 也**没有 AI 接手**（`demo-run { mode: 'next' }` 是引擎自己的回放，模型接缝触碰 0 次；
 * 同探针 `corpus` 段读数）。⇒ 原句「会**自动接手**」的「AI」那一半在演示书上是假话，
 * 而「往下走」那颗键**真在屏上**（票 02 的 `▶ 开始演示`，同帧正文）。
 */
export function phase1TurnAction(meta) {
	if (isDemoBook(meta)) return DEMO_PHASE1_TURN_ACTION;
	return PHASE1_TURN_ACTION;
}

/** 阶段一上传区那句「每份材料是什么角色，由谁判定」（`event-cards.js` 的 `UploadArea` 调它）。 */
export const MATERIAL_ROLE_NOTE =
	"书文件夹建在当前工作区目录里（文件夹名＝书名），上传的材料都放里面。每份材料是什么角色，由 AI 在「读材料挑重点」那一步读完材料后判定。";
export const DEMO_MATERIAL_ROLE_NOTE =
	"书文件夹建在当前工作区目录里（文件夹名＝书名），上传的材料都放里面。每份材料是什么角色，由机器在「读材料挑重点」那一步按演示夹具写定（演示书里没有 AI）。";

/**
 * 上面那一句的取值。
 *
 * ── 读数（同探针 `frames` 段的 `demo-phase-1` 正文、`ui` 段起始屏，各命中 1）──
 * 演示书的 `工作区/材料判定.json` 由**机器**写（票 11：号按 `okMaterialNumbers(meta.sources)`
 * 现算、`role`／`basis` 取自 `content-lib` 的常量）⇒「由 AI …判定」在演示书上是假话。
 */
export function materialRoleNote(meta) {
	if (isDemoBook(meta)) return DEMO_MATERIAL_ROLE_NOTE;
	return MATERIAL_ROLE_NOTE;
}

/** 探查确认卡（`ExploreConfirmCard`）卡尾那句「不满意会怎样」。 */
export const EXPLORE_CONFIRM_NOTE =
	"这是后面所有设计的基础。满意就继续；不满意点「重做」，勾个理由或写一句哪里不满意，AI 会照着改（不填也能重做）。";
export const DEMO_EXPLORE_CONFIRM_NOTE =
	"这是后面所有设计的基础。满意就继续；不满意点「重做」，勾个理由或写一句哪里不满意——演示书会把同一份探查报告原样再写一遍（没有 AI 参与；你写的那句不会进去）。";

/**
 * 上面那一句的取值。
 *
 * ── 读数（同探针 `frames` 段的 `demo-phase-2` 正文 ＋ `ui` 段的探查确认卡，两处都命中 1）──
 * 驳回那一下**真发生**（同探针 `acts` 段①：`explore-confirm {approved:false}` 回 200、
 * `工作区/explore.md` 的 mtime 变了）——但**内容逐字未变**（sha `c1ef38ee630f2d87` 前后一致），
 * 而用户写的那句只落 `meta.exploreRedoNote`，读它的**唯一一处**是 `stage-brief`（真书 brief；
 * `src/workflow.js` 的 `redoNote: meta.exploreRedoNote ?? null`／`src/workflow/engine.js` 的
 * `buildStageBrief` 里 `case 'explore'` 那一支）⇒「AI 会照着改」在演示书上说的事不会发生。
 * 措辞按票 23 读出来的约束写（⛔ 不是「会自己再出一版」：`explore.md` 没有版次概念、新旧逐字相同）。
 */
export function exploreConfirmNote(meta) {
	if (isDemoBook(meta)) return DEMO_EXPLORE_CONFIRM_NOTE;
	return EXPLORE_CONFIRM_NOTE;
}

/**
 * 章节安排确认卡（`OutlineConfirmCard`）开头那一段。
 *
 * ⚠️ 末句那颗键的面文「🔁 让 AI 重做」**逐字保留**——键名是动作的名字，维护者 2026-10-15
 * 裁决容忍（map 决定 42）；同族的占位提示语已由票 24 收进 `outlineRejectPlaceholder`。
 *
 * ── 读数（同探针 `frames` 段的 `demo-phase-3-outline` 正文 ＋ `ui` 段的同卡，两处都命中）──
 * 演示书的章节安排来自 `content-lib.demoOutline()`（**零入参**，票 23 的读数）⇒「AI 计划」是假话；
 * 而「先把第 N 章写出来给你过目」这半句**是真的**（演示书真写出那一章，同探针 `ui` 段：
 * 这一屏之后就是谈判桌，`工作区/chapter-01.md` 在盘）。
 *
 * @param {{demo?: boolean}|null|undefined} meta 当前书的状态
 * @param {number|string} chapterCount 这本书的章数（调用方现算）
 * @param {number|string} pick 选中的最佳范例章号（调用方现算）
 */
export function outlineCardLead(meta, chapterCount, pick) {
	if (isDemoBook(meta)) {
		return `这本书按演示夹具排成 ${chapterCount} 章。每章标好了用材料的哪一块、覆盖哪些知识点。每章多少字，等最佳范例章写完、实测之后一起定。满意点「通过」，演示书接着把第 ${pick} 章当最佳范例章写出来给你过目；要调就点「让 AI 重做」。`;
	}
	return `AI 计划把这本书分成 ${chapterCount} 章。每章标好了用材料的哪一块、覆盖哪些知识点。每章多少字，等最佳范例章写完、实测之后一起定。满意点「通过」，AI 先把第 ${pick} 章当最佳范例章写出来给你过目；要调就点「让 AI 重做」。`;
}

/**
 * 阶段五过目态章节卡卡头那句（`chapters-map.js` 的 `ChaptersCard` 调它）。
 *
 * 票 `ui-display-redesign/08`：①「看看这章」是**失效旧词**（那颗键早已改名成每章的
 * 「▸ 展开第 N 章正文」／「第 N 章 打开」）⇒ 换成点每章的展开入口；②末句原来写「交工合并」，
 * 但这一屏之后还有**最后检查**，旧词读起来像最终交付 ⇒ 「都满意就合并成书、进入最后检查」。
 */
export const CHAPTERS_REVIEW_LEAD =
	"点每章的「▸ 展开第 N 章正文」；有意见直接写，AI 照改；都满意就合并成书、进入最后检查。";
export const DEMO_CHAPTERS_REVIEW_LEAD =
	"点每章的「▸ 展开第 N 章正文」；有意见直接写（演示书里没有 AI 照它改：你自己写的那条要放行，得先把它撤回）；都满意就合并成书、进入最后检查。";

/**
 * 上面那一句的取值。
 *
 * ── 读数（同探针 `frames` 段的 `demo-phase-5` 正文、`ui` 段的过目态章节卡，各命中 1）──
 * 「有意见直接写」这半句**是真的**（同探针 `acts` 段④：过目态发 `review` 回 200、
 * 那条意见真落 `meta.pendingReviews`，账本 53 → 56 笔）；假的是「AI 照改」——
 * 演示支**从不**给用户那条意见写 `how`（`engine.js` 的 `demoWriteChapters` 只补自带的示例、
 * 不销号），而章正文是 `content-lib.demoChapterWrite` 按大纲现拼的固定内容 ⇒
 * 用户那条的**唯一出路是撤回**（`gold-opinion-revoke`，票 06 已读到的边界）。
 */
export function chaptersReviewLead(meta) {
	if (isDemoBook(meta)) return DEMO_CHAPTERS_REVIEW_LEAD;
	return CHAPTERS_REVIEW_LEAD;
}

/** 阶段五章节清单那行「每章流程 ＋ 已完成 N/M」（`chapters-map.js` 的 `ChaptersCard` 调它）。 */
export const CHAPTERS_FLOW_LEAD = "每章流程：小助手执笔 → 小助手检查 → AI 最后把关。";
export const DEMO_CHAPTERS_FLOW_LEAD = "每章流程：演示书自己把这一章写一遍、再检查一遍（这里没有小助手、也没有 AI 把关）。";

/**
 * 上面那一句的取值（`pendingExplain`／`contextNoteText` 两个后缀由调用方现算，⛔ 本函数不碰它们）。
 *
 * ── 读数（同探针 `frames` 段的 `demo-phase-5` 正文、`ui` 段的过目态章节卡，各命中 1）──
 * 演示书的章由引擎铺（`demoWriteChapters` → `content-lib.demoChapterWrite`），
 * 全流程 `agents.create/start/followup` 与 `subagents.start` 触碰 **0** 次（同探针 `corpus` 段）
 * ⇒ 没有小助手执笔、没有小助手检查、也没有 AI 把关。
 */
export function chaptersFlowLead(meta) {
	if (isDemoBook(meta)) return DEMO_CHAPTERS_FLOW_LEAD;
	return CHAPTERS_FLOW_LEAD;
}

/** 同一行里紧跟其后的「有意见直接写、会怎样」那半句（与上面那句**同族并举**，口径 5）。 */
export const CHAPTERS_FLOW_OPINION_CLAUSE = "AI 照改，";
export const DEMO_CHAPTERS_FLOW_OPINION_CLAUSE = "演示书里没有 AI 照它改，";

/** 上面那半句的取值（读数见 `chaptersReviewLead`：演示书上用户那条只能撤回）。 */
export function chaptersFlowOpinionClause(meta) {
	if (isDemoBook(meta)) return DEMO_CHAPTERS_FLOW_OPINION_CLAUSE;
	return CHAPTERS_FLOW_OPINION_CLAUSE;
}

/** 章节卡上「✍️ 写意见」那颗键的 `title`（`chapters-map.js` 的 `ChaptersCard` 调它）。 */
export const REVIEW_WRITE_HINT = "给这一章写一条抽查意见，AI 照改后由你确认";
export const DEMO_REVIEW_WRITE_HINT = "给这一章写一条抽查意见（演示书里没有 AI 照它改；要放行得先把这条撤回）";

/**
 * 上面那一句的取值。
 *
 * ── 读数（同探针 `frames` 段的 `demo-phase-5` 的 `[title]` 列命中 3 次＝三章各一颗；
 *    `ui` 段的过目态章节卡同样命中 3，写完意见后降到 2——那颗键在这一章收起了）──
 * 假的那一半同 `chaptersReviewLead`（演示支不销号、用户那条只能撤回）：⛔「由你确认」也一并去掉——
 * 演示书上没有任何一步会回到「由你确认这一条改好没有」。
 */
export function reviewWriteHint(meta) {
	if (isDemoBook(meta)) return DEMO_REVIEW_WRITE_HINT;
	return REVIEW_WRITE_HINT;
}

/**
 * 票 `walkthrough-fixes/37`：最后检查驳回意见的**逐条去向**（认可卡上那一块）。
 *
 * 病：用户那句意见整段落 `finalRedoNote`、整段注入交办说明，重新交工只要一份 `report`
 * ⇒ 「四件事做了几件、漏了哪几件」在界面与账本两边都看不见，用户只能自己逐条核。
 *
 * ⚠️ **这里只把 AI 的自述摆出来**，不含任何「验过了」的断言——机器只断「有没有逐条交代」
 * （`src/workflow/final-redo.js`），⛔ 不断「办得对不对」（`docs/adr/0005` §「这条没改什么」第 2 条）。
 * 所以卡上那句尾注也必须这么说（`FINAL_REDO_FOOT`），⛔ 不许写成「AI 已逐条办完」。
 */
export const FINAL_REDO_HEADING = "🧾 你上一轮的意见，逐条去向";
export const FINAL_REDO_FOOT =
	"这些去向是 AI 自己交代的：机器只核对它有没有逐条交代，不核对办得对不对。哪一条没办，你在这里一眼看得到。";
/** 三档去向与「没交代」那一档的记号／人话（枚举取值来自 `domain-rules.js`，这里只给界面译法）。 */
export const FINAL_REDO_STATUS_UI = Object.freeze({
	done: { mark: "✅", text: "已办" },
	"not-done": { mark: "⚠️", text: "没办" },
	superseded: { mark: "⏭", text: "不适用了" },
});
export const FINAL_REDO_MISSING = Object.freeze({ mark: "❓", text: "交工时没有交代" });

/**
 * 认可卡上那一块的**投影**：落账的条目集（`meta.finalRedoItems`）× 交工那次的去向
 * （`meta.finalRedoCheck`）→ 逐行 `{index, quote, status, mark, statusText, note, where}`。
 *
 * 没有条目集（这本书没被驳回过，或拆条那一步还没发生）⇒ `null`（卡上不摆那一块）。
 * 有条目但没有对应去向 ⇒ 那一行如实印「交工时没有交代」——**这是看得见的那一半**，不许静默略掉。
 *
 * @param {object|null|undefined} meta `/textbook/process` 下发的 meta 投影
 * @returns {Array<{index: number|null, quote: string, status: string|null, mark: string, statusText: string, note: string, where: string}>|null}
 */
export function finalRedoRows(meta) {
	const items = Array.isArray(meta?.finalRedoItems) ? meta.finalRedoItems : [];
	if (items.length === 0) return null;
	const check = Array.isArray(meta?.finalRedoCheck) ? meta.finalRedoCheck : [];
	const byIndex = new Map();
	for (const entry of check) {
		if (Number.isSafeInteger(entry?.index)) byIndex.set(entry.index, entry);
	}
	return items.map((item) => {
		const entry = byIndex.get(item?.index) ?? null;
		const ui = entry === null ? FINAL_REDO_MISSING : FINAL_REDO_STATUS_UI[entry.status] ?? {
			mark: "❓",
			text: typeof entry.status === "string" ? entry.status : "去向读不出来",
		};
		return {
			index: Number.isSafeInteger(item?.index) ? item.index : null,
			quote: typeof item?.quote === "string" ? item.quote : "",
			status: entry === null ? null : entry.status ?? null,
			mark: ui.mark,
			statusText: ui.text,
			note: typeof entry?.note === "string" ? entry.note : "",
			where: typeof entry?.where === "string" ? entry.where : "",
		};
	});
}

/** 终检认可卡卡尾那句（`event-cards.js` 的 `FinalApprovalCard` 调它）。 */
export const FINAL_APPROVAL_NOTE =
	"这是你对整本书的最后一次把关：满意就认可交付；要改的写一句意见，AI 会照着改整本后重新做最后检查。";
export const DEMO_FINAL_APPROVAL_NOTE =
	"这是你对整本书的最后一次把关：满意就认可交付；要改的写一句意见——演示书会把最后检查原样重跑一遍（没有 AI 参与；你写的那句不会进去）。";

/**
 * 上面那一句的取值。
 *
 * ── 读数（同探针 `frames` 段的 `demo-phase-6` 正文、`ui` 段的终检认可卡，各命中 1）──
 * 「重新做最后检查」这半句**是真的**（同探针 `acts` 段③：带意见点「不满意」回 200、
 * `redo: true`、书回到 `awaiting-final-approval`，账上第二次出现
 * `🎯 交给 AI 动手：最后检查` 与 `🛡️ 最后检查：8/8 项通过`）；
 * 假的是「**AI 会照着改整本**」：`工作区/报告/` 那六件**逐字未变**（六份 sha 前后相同），
 * 用户那句话只落 `meta.finalRedoNote`，读它的唯一一处是真书 brief（`src/workflow/engine.js` 的
 * `brief.userFeedback = meta.finalRedoNote` 那一行）。
 */
export function finalApprovalNote(meta) {
	if (isDemoBook(meta)) return DEMO_FINAL_APPROVAL_NOTE;
	return FINAL_APPROVAL_NOTE;
}

/** 终检卡上「没写意见就点不满意」时那句红字（`event-cards.js` 的 `FinalApprovalCard` 调它）。 */
export const FINAL_APPROVAL_NEED_NOTE =
	"⚠️ 先在上面写一句「要改什么」，再点「不满意」——AI 得照着你这句话改整本。";
export const DEMO_FINAL_APPROVAL_NEED_NOTE =
	"⚠️ 先在上面写一句「要改什么」，再点「不满意」——演示书要有一句话才会把最后检查重跑一遍。";

/**
 * 上面那一句的取值。
 *
 * ── 读数（同探针 `ui` 段：在终检屏点「❌ 不满意，让 AI 改」而输入框空着 ⇒ 这一句上屏，
 *    命中 1；服务端那侧同一条件的 400 文本见 `engine.FINAL_REJECT_NEEDS_NOTE`）──
 * 演示书上「这句话」的用途是**过 400 那道闸**（空意见当场 400），不是「给 AI 当方向」
 * ——同探针 `acts` 段③ 的 `emptyStatus: 400`。
 */
export function finalApprovalNeedNote(meta) {
	if (isDemoBook(meta)) return DEMO_FINAL_APPROVAL_NEED_NOTE;
	return FINAL_APPROVAL_NEED_NOTE;
}

/** 谈判桌上「从头重写这一章」那颗键旁的一句（`gold-table.js` 的 `GoldFinalize` 调它）。 */
export const GOLD_REWRITE_HINT = "从头重写这一章；还没处理的意见会一并带给 AI 当方向";
export const DEMO_GOLD_REWRITE_HINT = "从头重写这一章（演示书里没有 AI）；还没处理的意见会一并织进新稿";

/**
 * 上面那一句的取值。
 *
 * ── 读数（同探针 `frames` 段的 `demo-phase-4` 正文、`ui` 段的谈判桌，各命中 1）──
 * ⚠️ 这一句**不是**「动作没发生」那一类，而是票面点名的「**动作真发生、但结果不同**」——
 * 同探针 `acts` 段②：`gold-approved {approved:false}` 回 200、`工作区/chapter-01.md` 的 sha
 * 真变了（`3f9d4bbd…` → `09db2d0e…`）。**示范支真读 `meta.goldRedoNote`**
 * （`src/workflow/engine.js` 的 `runPhase4` 演示支里 `redoNote: meta.goldRedoNote ?? ''` 把它递进
 * `generateContent(runtime, 'gold', …)`，而
 * `content-lib.demoGoldChapter` 把它织成「## 本稿按你的意见改了（演示）」那一节）
 * ⇒「意见**会**当方向」是真的，「带给 **AI**」是假的。⇒ 演示取值只去掉「AI」那一半。
 */
export function goldRewriteHint(meta) {
	if (isDemoBook(meta)) return DEMO_GOLD_REWRITE_HINT;
	return GOLD_REWRITE_HINT;
}

/** 谈判桌「整稿丢弃重写」确认层那句（`gold-table.js` 的 `GoldFinalize` 调它）。 */
export const GOLD_REWRITE_CONFIRM_NOTE = "整稿丢弃重写：这一稿会归档留底，AI 从头再写一版。";
export const DEMO_GOLD_REWRITE_CONFIRM_NOTE =
	"整稿丢弃重写：这一稿会归档留底，演示书会自己从头再写一版（没有 AI 参与）。";

/**
 * 上面那一句的取值。
 *
 * ── 读数（同探针 `ui` 段：在谈判桌点「❌ 这版整个不要，重写」⇒ 这一句上屏，命中 1）──
 * 「归档留底 ＋ 从头再写一版」两半都真（`acts` 段② 的 sha 读数同上；旧稿进
 * `工作区/_旧版产物/`）⇒ 演示取值只把「AI」换成「演示书自己」。
 */
export function goldRewriteConfirmNote(meta) {
	if (isDemoBook(meta)) return DEMO_GOLD_REWRITE_CONFIRM_NOTE;
	return GOLD_REWRITE_CONFIRM_NOTE;
}

/** 顶栏「🎨 风格线」那颗键的 `title`（`panels.js` 的顶栏调它）。 */
export const STYLE_NOTES_PANEL_TITLE = "你的风格意见清单（AI 写每一章都会照着办）";
export const DEMO_STYLE_NOTES_PANEL_TITLE = "你的风格意见清单（演示书里没有 AI 写章；这几条只记在这里）";

/**
 * 上面那一句的取值。
 *
 * ── 读数（同探针 `frames` 段：九帧的 `[title]` 列**每一帧**都命中 1；`ui` 段起始屏同样命中 1）──
 * 演示书的章正文是固定内容（`content-lib.demoChapterWrite` 按大纲现拼）⇒「写每一章都会照着办」
 * 在演示书上没有对应事实（演示支**真读**的只有 gold 那一处 `redoNote`，见 `goldRewriteHint`）。
 */
export function styleNotesPanelTitle(meta) {
	if (isDemoBook(meta)) return DEMO_STYLE_NOTES_PANEL_TITLE;
	return STYLE_NOTES_PANEL_TITLE;
}

/** 风格线面板打开后那一行标题（`panels.js` 的风格线面板调它）。 */
export const STYLE_LINE_PANEL_HEADING = (count) => `🎨 你的风格线（${count} 条：AI 写每一章都照着办）`;
export const DEMO_STYLE_LINE_PANEL_HEADING = (count) => `🎨 你的风格线（${count} 条：演示书里没有 AI 写章，这几条只记在这里）`;

/** 上面那一行的取值（读数同 `styleNotesPanelTitle`：`ui` 段打开风格线面板时这一行命中 1）。 */
export function styleLinePanelHeading(meta, count) {
	if (isDemoBook(meta)) return DEMO_STYLE_LINE_PANEL_HEADING(count);
	return STYLE_LINE_PANEL_HEADING(count);
}

/** 风格线面板底部那句（`panels.js` 的风格线面板调它）。 */
export const STYLE_LINE_PANEL_HINT =
	"想再记一条？在对话里直接跟 AI 说，它会记成风格线；写每一章都照着办。";
export const DEMO_STYLE_LINE_PANEL_HINT =
	"想再记一条？演示书里没有 AI 替你记风格线：下面这几条是演示通道自带的示例。";

/** 上面那一句的取值（读数同 `styleNotesPanelTitle`：`ui` 段打开风格线面板时这一句命中 1）。 */
export function styleLinePanelHint(meta) {
	if (isDemoBook(meta)) return DEMO_STYLE_LINE_PANEL_HINT;
	return STYLE_LINE_PANEL_HINT;
}

/** 自定义模式面板里那段说明（`panels.js` 的模式库面板调它）。 */
export const PATTERN_PASTE_HINT =
	"粘贴一段你想要的教法/章节结构描述，AI 会把它提炼成一张「模式卡」加入这本书的模式库；第 2 次拍板「教学方法与板块」和写作规范都会优先参考它。";
export const DEMO_PATTERN_PASTE_HINT =
	"粘贴一段你想要的教法/章节结构描述：演示书里没有 AI，它会按占位造一张演示模式卡加进这本书的模式库（那张卡上自己写着「真实模式由 AI 分析生成」）。";

/**
 * 上面那一句的取值。
 *
 * ── 读数（同探针 `ui` 段：打开「🧩 自定义模式」面板这一句命中 1）＋ `acts` 段⑥ ──
 * 演示书上发 `pattern-analyze` 回的是**占位卡**（`name: "自定义板块（演示）"`、
 * `problem: "…（演示占位，真实模式由 AI 分析生成）"`）⇒「AI 会把它提炼成…」是假话，
 * 而「加进这本书的模式库」是真的（那份卡真落盘、`textbook/pattern-added` 真落账）。
 */
export function patternPasteHint(meta) {
	if (isDemoBook(meta)) return DEMO_PATTERN_PASTE_HINT;
	return PATTERN_PASTE_HINT;
}

/** 自定义模式那段输入框的 `placeholder`（`client-entry.js` 的模式库表单调它）。 */
export const PATTERN_PASTE_PLACEHOLDER = "粘贴一段你想要的教法/结构描述，AI 会把它加进这本书的模式库";
export const DEMO_PATTERN_PASTE_PLACEHOLDER = "粘贴一段你想要的教法/结构描述（演示书会按占位造一张演示模式卡）";

/** 上面那一行的取值（读数同 `patternPasteHint`：九帧 `[title]` 列每帧命中 1 ＋ 表单打开时它是 placeholder）。 */
export function patternPastePlaceholder(meta) {
	if (isDemoBook(meta)) return DEMO_PATTERN_PASTE_PLACEHOLDER;
	return PATTERN_PASTE_PLACEHOLDER;
}

