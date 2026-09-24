/**
 * 造书工作台 · 领域规则单一事实来源
 *
 * 前后端共享的领域常量与纯推导函数：素材角色、范例章、六阶段、账本事件类型。
 * 双端约束（架构评审候选 3 敲定）：本文件被 esbuild 打进前端 bundle
 * （入口 src/client-entry.js），也被 node ESM 后端直接 import——
 * 必须保持零 node 内置依赖、零 react 依赖、零第三方依赖；
 * 只放「两侧都必须知道」的规则，单侧展示文案（进度条短标签等）不进这里。
 * 术语见 CONTEXT.md（素材角色 / 范例章 / 金标准）。
 *
 * 2026-09-01 增补（架构评审候选 1 拍板）：EVENT_META 是「账本事件的双端含义表」
 * （label/emoji/announce 沉默策略）——账本事件双端都要渲染（后端过程记录与播报、
 * 前端账本列表），属于两侧共有知识，故入本文件；各端自己的句子行文
 * （logEntryText / announceText / cardText 各自的措辞与冗长）仍是单侧展示，不进这里。
 */

// ── 素材角色 ────────────────────────────────────────────────────────────────

/** 素材角色五分类（canonical 集合；顺序即上传区下拉顺序）。 */
export const ROLES = Object.freeze([
	"学生用书",
	"教师用书",
	"考纲",
	"讲义",
	"真题",
]);

/** 按文件名猜素材角色（规则兜底，AI 识别失败时用）。 */
export function guessRoleFromName(name) {
	const n = String(name ?? "").toLowerCase();
	if (/(教师|教参|teacher|教学参考|教师用书)/.test(n)) return "教师用书";
	if (/(考纲|大纲|课标|syllabus|课程标准)/.test(n)) return "考纲";
	if (/(真题|试卷|试题|卷子|exam|paper|test)/.test(n)) return "真题";
	if (/(讲义|教案|课件|笔记|handout|notes)/.test(n)) return "讲义";
	return "学生用书";
}

// ── 范例章 ──────────────────────────────────────────────────────────────────

/** 范例章章号（1 基；旧账本/缺省 = 1）。meta 字段名 goldChapter 为历史遗留。 */
export function goldChapterNo(meta) {
	return Number.isSafeInteger(meta?.goldChapter) && meta.goldChapter >= 1
		? meta.goldChapter
		: 1;
}

// ── 六阶段 ──────────────────────────────────────────────────────────────────

/**
 * 六阶段流水线（canonical 全称；进度条等窄处的短标签由各端显式派生，勿回写此处）。
 */
export const PHASES = Object.freeze([
	{ n: 1, label: "材料准备" },
	{ n: 2, label: "源探查" },
	{ n: 3, label: "教学设计" },
	{ n: 4, label: "范例章" },
	{ n: 5, label: "全章写作" },
	{ n: 6, label: "终检与交付" },
]);

/** 六阶段标签：按阶段号取 canonical 全称（未知返回空串）。 */
export function phaseLabel(n) {
	return PHASES.find((p) => p.n === n)?.label ?? "";
}

/**
 * 分段（`/textbook/process` 那批）kind → 阶段号：阶段片一格＝一个阶段＝若干分段/步；
 * 「材料准备」（阶段 1）没有分段，故本表没有 1（它就是一步）。
 * 后端 buildProcessMap（src/workflow.js）给每个分段打 phase 用它，前端把分段按阶段分组
 * 也用它——阶段片归属是双端共用的知识，两侧不许各写一份映射（单一事实源）。
 * 2026-09-21 起界面把分段读成「步」，但本表仍按机器词分段工作（见 CONTEXT.md「阶段与步」）。
 */
export const SEGMENT_PHASE = Object.freeze({
	explore: 2,
	gate: 3,
	outline: 3,
	gold: 4,
	chapter: 5,
	review: 5,
	merge: 6,
	final: 6,
});

// ── 探查教学重点/难点（teachingFocus）────────────────────────────────────────

/**
 * 单条 teachingFocus 条目 → 可读字符串（2026-09 修复 [object Object] 泄漏）。
 * 契约是 teachingFocus:[string]（见 engine.js 的 stage-brief）；但 schema 曾只写
 * `teachingFocus:[]`、未定元素形状，AI 因此偶发产出对象数组（{title/text/…} 等）。
 * 这里把常见对象形状摊平成一句话：优先取 title/text/label/content/name/item/重点/难点
 * 字段；difficulty 若存在且正文未包含则补 `（难点）`；字符串原样 trim；其余返回 ""（由调用方过滤）。
 */
export function teachingFocusText(item) {
	if (typeof item === "string") return item.trim();
	if (item === null || typeof item !== "object") return "";
	const text = [
		item.title,
		item.text,
		item.label,
		item.content,
		item.name,
		item.item,
		item.重点,
		item.难点,
	]
		.map((v) => (typeof v === "string" ? v.trim() : ""))
		.find((v) => v !== "");
	if (text === undefined) return "";
	const diff =
		typeof item.difficulty === "string" ? item.difficulty.trim() : "";
	return diff !== "" && !text.includes(diff) ? `${text}（${diff}）` : text;
}

/**
 * teachingFocus 归一化为纯字符串数组（契约形状）。
 * 非数组返回 []；空串丢弃。UI 渲染与机器验货（explore 交工）共用此函数，
 * 保证「落盘文件 / 摘要 / 页面」三处看到的都是同一份干净形状。
 */
export function normalizeTeachingFocus(items) {
	if (!Array.isArray(items)) return [];
	const out = [];
	for (const item of items) {
		const text = teachingFocusText(item);
		if (text !== "") out.push(text);
	}
	return out;
}

// ── 上传上限 ────────────────────────────────────────────────────────────────

/**
 * 单份 PDF 上传上限（用户拍板 500MB）。前端预检、后端 readRawBody 强制共用同一常量，
 * 两侧不许各写一份（2026-09 上传幂等/413 修复收拢）。
 */
export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

/** 超限人话提示（前端预检与后端 413 同一文案，避免两处措辞漂移）。 */
export function uploadTooLargeMessage() {
	return `这份 PDF 超过 500MB 上传上限，请拆成多份（每份 <500MB）后分别上传`;
}

// ── 界面词（两侧共用部分）──────────────────────────────────────────────────
//
// 2026-09-20 拍板（grill Q24）：界面上的字只此一份，但**服务端也要产出人话文本**——
// 《过程记录.md》、交办唤醒消息（「【工作台派任务 · X】」）、提案正文的一级标题都是给人读的。
// 所以「两侧都必须知道」的那部分界面词落在这里；纯 UI 专属映射（PHASE_UI / STAGE_HUMAN /
// CHECK_UI / EVENT_UI）留在 src/ui/view-rules.js，由它把这里的共用件再导出给组件取词。
// 分工与本文件头部原则一致：**词表共享，句子行文各端自己写**（logEntryText / announceText /
// cardText 各自的措辞与冗长仍是单侧展示）。
//
// ⚠️ 服务端**机器身份词**一律不动：账本 label、STAGE_LABELS、PHASE_LABELS、事件 type、
// 文件名、产物路径、正则锚点。界面词只在「说给人听 / 写给人读」的出口处替换。
// 依据：CONTEXT.md「界面用词表」。

/** 三次设计关卡的**主题**（界面词；与 engine.js 的机器 label `GATE_LABELS` 同值但不同用途）。 */
export const GATE_TOPIC = Object.freeze({
	1: "学习目标与难点",
	2: "教学方法与板块",
	3: "全书架构与章节",
});

/**
 * 设计关卡 → 界面词「第 N 次拍板 · <主题>」（CONTEXT.md：界面**不叫**「第 N 关」）。
 * 分段界面词、状态条、事件卡、账本播报、《过程记录.md》、提案正文标题共用这一份。
 */
export function gateHuman(n) {
	const topic = GATE_TOPIC[String(n)];
	return topic === undefined ? `第 ${n} 次拍板` : `第 ${n} 次拍板 · ${topic}`;
}

/**
 * 六阶段（按阶段号）→ 界面词。
 * 阶段片那 6 个窄格、「一起做到：X」、以及六阶段 canonical 全称的翻译共用这一份。
 * ⚠️ 两侧共用件，住这一层（CONTEXT.md「界面上的字只此一份」）：展示派生模块**再导出**供 UI 取词。
 */
export const PHASE_UI_SOURCE = Object.freeze({
	1: "材料准备",
	2: "读材料挑重点",
	3: "拍板定方案",
	4: "最佳范例章",
	5: "写完整本",
	6: "最后检查",
});

/**
 * 分段键（`seg.key`）→ 界面词。
 * ⚠️ `seg.key`（`gate-1` / `explore` / `chapter-03`…）与 `seg.label`（服务端 label）都是**机器身份词**，
 * 账本里就这么存的、一个字不改；这里只负责在**出口处**译成人话——步清单/阶段页（UI）与
 * 《过程记录.md》的「定点修改」条目（服务端）共用这一份（2026-09-20 复审 a-4：
 * 原先引擎把 seg.key 直接印进人读流水账，UI 侧另有一份 `segmentHuman`）。
 * 译不出来原样显示：宁可露出机器词，也不猜错。
 */
export function segmentHuman(seg) {
	const key = typeof seg === "string" ? seg : (seg?.key ?? "");
	if (key === "explore") return PHASE_UI_SOURCE[2];
	if (key.startsWith("gate-")) return gateHuman(key.slice("gate-".length));
	if (key === "outline") return "章节安排";
	if (key === "gold") return PHASE_UI_SOURCE[4];
	if (key === "chapters-review") return "全章过目";
	if (key === "merge") return "合并成书";
	if (key === "final") return PHASE_UI_SOURCE[6];
	// 第 N 章 <标题>：标题来自已拍板的大纲，原样保留。
	if (key.startsWith("chapter-")) return (typeof seg === "object" && seg?.label) || key;
	if (typeof seg === "object" && seg?.label) return seg.label;
	return key;
}

/**
 * 交办阶段标签 → 界面词（`agent-start` / `agent-end` / `stage-start` 事件带的 `data.label`）。
 * ⚠️ 服务端 `STAGE_LABELS` / `stageLabel()` 是**机器身份词**（账本里就这么存的，不动它），
 * 由这一层翻译。未登记的原样显示——宁可露出机器词，也不猜错。
 */
const STAGE_LABEL_UI = Object.freeze({
	// 六阶段的 canonical 全称（domain-rules PHASES）也走这一张表：账本事件带的 data.label 就是
	// 它，出口（《过程记录.md》/对话播报）必须译成界面词，否则「同一件事说两种话」的病会复发。
	// ⚠️ 值不再手抄——直接取 PHASE_UI_SOURCE，两处逐字相同过的副本已合并（2026-09-20 复审 M5）。
	"材料准备": PHASE_UI_SOURCE[1],
	"源探查": PHASE_UI_SOURCE[2],
	"教学设计": PHASE_UI_SOURCE[3],
	"范例章": PHASE_UI_SOURCE[4],
	"全章写作": PHASE_UI_SOURCE[5],
	"终检与交付": PHASE_UI_SOURCE[6],
	// 交办阶段标签（engine STAGE_LABELS / stageLabel）的简写形态。
	"章节骨架": "章节安排",
	"整理章节骨架": "章节安排",
	"铺章": "写完整本",
	"合并成书": "合并成书",
	"最后检查": "最后检查",
	"最后检查（质量门）": "最后检查",
});

export function stageLabelHuman(label) {
	const raw = String(label ?? "");
	if (raw === "") return "";
	const direct = STAGE_LABEL_UI[raw];
	if (direct !== undefined) return direct;
	// 服务端有两种拼法，都是**机器身份词**、都不许出现在人眼前：
	//   stageLabel('gate', n) →「设计提案·第 N 关」（stage-start 事件）；runGate →「设计提案·关卡N」
	//   （agent-start 事件，修订版再带「·修订vM」后缀）。两种都译成界面词的「第 N 次拍板 · <主题>」。
	const gate = /^设计提案·(?:第\s*([0-9]+)\s*关|关卡\s*([0-9]+))(·.*)?$/.exec(raw);
	if (gate !== null) return `${gateHuman(gate[1] ?? gate[2])}${gate[3] ?? ""}`;
	// 「写第 3 章」已是人话；「自查第 3 章」的「自查」是机器视角（谁查谁？）→「检查」。
	if (raw.startsWith("写第")) return raw;
	if (raw.startsWith("自查第")) return raw.replace(/^自查/, "检查");
	return raw;
}

// ── 产物：给人读的正文 vs 机器产物 ──────────────────────────────────────────
//
// 单一判据（ADR-0010 决策 2 与「有正文的产物」条；票 04/05 共用）：
//   'preview' 有正文的产物 —— 「打开一份文件看看」交 DSH 右栏预览；
//   'inline'  机器产物但有卡片内联人读形态 —— work/knowledge-map.json 折成清单（不进右栏）；
//   'machine' 机器产物（project.json / timeline.jsonl / 源 PDF / 过程记录…）—— 不给人读。
//
// ⚠️ 判据是**显式清单**，不是扩展名、也不是「在项目目录里」：
// 扩展名判据会把 knowledge-map.json 之外的机器产物一并放进来（票 04 收窄的正是这件事）。
// ⚠️ `work/audit-NN.md` 看着像 Markdown，实际是机器审计 JSON（`{"passed":…,"issues":[…]}`，
// 见 actions/chapters.js 的 JSON.parse）——名字里的 `.md` 是历史遗留，**不是有正文的产物**。
// ADR-0010 决策 2 里「自查报告」指的是给人读的 AI 自查报告，不是这个文件；把原始 JSON 送进
// 右栏等于让家长读 JSON（与它自己否掉「knowledge-map.json 也进右栏」是同一条理由）。
// 双端分工：前端「有正文的产物」开右栏（不经 /textbook/file）；后端该路由按同一判据放行，
// 所以两端读的是同一份清单，改这里即两端同时改。

/** work/ 下按序号命名的章节正文。 */
const NUMBERED_CHAPTER_FILE_RE = /^work\/chapter-\d{2}\.md$/;
/** 谈判桌归档的旧稿章节（`chapter-01.md.3f2k` 这种带时间戳后缀的名字，故不能按扩展名判）。 */
const ARCHIVED_CHAPTER_RE = /^work\/_旧版产物\/chapter-\d{2}\.md\.[0-9a-z]+$/;
/** 三次设计关卡的提案（设计关卡方案）。 */
const GATE_PROPOSAL_RE = /^提案\/关卡[123]-v\d+\.md$/;
/** 材料转换出的 Markdown（MinerU 产物，给人读原料）。 */
const CONVERTED_SOURCE_RE = /^sources-md\/.+\.md$/;

/**
 * 这份产物该怎么给人看。
 * @param {string} rel - 书文件夹相对路径（形如 `work/chapter-01.md`）。
 * @returns {'preview'|'inline'|'machine'}
 */
export function productOpenMode(rel) {
	const path = String(rel ?? "")
		.replace(/\\/g, "/")
		.replace(/^(?:\.\/)+/, "");
	if (path === "work/knowledge-map.json") return "inline";
	if (
		NUMBERED_CHAPTER_FILE_RE.test(path) ||
		ARCHIVED_CHAPTER_RE.test(path) ||
		GATE_PROPOSAL_RE.test(path) ||
		CONVERTED_SOURCE_RE.test(path) ||
		path === "work/explore.md" || // 探查报告
		path === "work/outline.md" || // 章节安排（设计关卡定下来的方案）
		path === "work/style-spec.md" || // 写作规范（同为设计文档，步清单把它当产物列出）
		path === "work/book.md" // 成品
	) {
		return "preview";
	}
	return "machine";
}

/** 是否「打开一份文件看看」的产物（有正文 → 右栏预览）。 */
export function isPreviewProduct(rel) {
	return productOpenMode(rel) === "preview";
}

// ── 账本事件类型 ────────────────────────────────────────────────────────────

/** 账本合法事件类型（appendEvent 落账校验；前端对照防拼错）。勿在运行期增删。 */
export const EVENT_TYPES = new Set([
	"textbook/phase-start",
	"textbook/phase-end",
	"textbook/agent-start",
	"textbook/agent-end",
	"textbook/gate-proposal",
	"textbook/gate-decision",
	"textbook/mineru-progress",
	"textbook/rollback",
	"textbook/source-added",
	"textbook/hint",
	"textbook/quality",
	"textbook/delivery",
	"textbook/error",
	"textbook/stage-start",
	"textbook/progress",
	"textbook/review",
	"textbook/ai-report",
	"textbook/style-note",
	"textbook/intervention",
	"textbook/intervention-done",
	"textbook/waiver",
	"textbook/waiver-revoke",
	"textbook/pause",
	"textbook/resume",
	"textbook/outline-decision",
	"textbook/gold-opinion",
	"textbook/gold-seal",
	"textbook/gold-chapter",
	"textbook/chapters-review",
	"textbook/final-approve",
	"textbook/deep-modify",
	"textbook/deep-undo",
	"textbook/pattern-added",
	"textbook/submit-rejected",
]);

/**
 * 账本事件的「双端含义表」（key 集合必须 === EVENT_TYPES，测试以双向闭包钉死）。
 *
 * - label：短人话含义（前端账本列表的兜底文案与图标来源；过程记录/播报的句子行文不在此）。
 * - emoji：该事件的图标（沿用前端 cardIcon 的既有约定；gate-decision / outline-decision
 *   的「通过/驳回」变体由消费端按 data.approved 覆盖，此处只放基准 emoji）。
 * - announce: false = 该型事件机器在主对话不播报（沉默策略，见 CONTEXT.md 工作台提示与
 *   验货频率收紧）：主 AI 现场已讲的过程性事件、用户自己刚做的动作、纯机器内部事件。
 *   缺省（未声明）即开口；hint / style-note 两个「看 data 再决定」的类型不在此列，
 *   留在 announceText 内特判。
 */
export const EVENT_META = Object.freeze({
	"textbook/phase-start": { label: "阶段开始", emoji: "▶️" },
	"textbook/phase-end": { label: "阶段完成", emoji: "🏁" },
	"textbook/agent-start": { label: "AI 开始", emoji: "🤖", announce: false },
	"textbook/agent-end": { label: "AI 完成", emoji: "🤖", announce: false },
	"textbook/gate-proposal": { label: "关卡提案", emoji: "📋" },
	"textbook/gate-decision": { label: "关卡拍板", emoji: "✅" },
	"textbook/mineru-progress": { label: "材料转换", emoji: "📄", announce: false },
	"textbook/rollback": { label: "回退快照", emoji: "⏪" },
	"textbook/source-added": { label: "上传材料", emoji: "📎", announce: false },
	"textbook/hint": { label: "提示", emoji: "💡" },
	"textbook/quality": { label: "质量门检查", emoji: "🛡️" },
	"textbook/delivery": { label: "交付完成", emoji: "🎉" },
	"textbook/error": { label: "出错", emoji: "⚠️" },
	"textbook/stage-start": { label: "交给 AI 动手", emoji: "🤖", announce: false },
	"textbook/progress": { label: "进度", emoji: "⏳", announce: false },
	"textbook/review": { label: "抽查意见", emoji: "👀", announce: false },
	// ⚠️ 票 10（判定三 #10）**不动本行**：本表是 ADR-0009 决策 1 的**双端含义表**（机器身份词，
	// 与「源探查」「铺章」同族），ui-wording 那批已把「事件含义表一律不改」写成决定（spec 的
	// Implementation Decisions）。界面上说「AI 检查报告」由 `src/ui/view-rules.js` 的 `EVENT_UI`
	// 覆盖（UI 取词只走那里）；服务端写给人读的出口（`logEntryText` / `announceText` / hint）
	// 各自在出口处翻译——「机器身份词不动、界面词只在出口处替换」正是那条决定的形态。
	"textbook/ai-report": { label: "AI 自查报告", emoji: "🛡️", announce: false },
	"textbook/style-note": { label: "风格线", emoji: "🎨" },
	"textbook/intervention": { label: "留言", emoji: "📮" },
	"textbook/intervention-done": { label: "留言已处理", emoji: "📮", announce: false },
	"textbook/waiver": { label: "豁免放行", emoji: "🛟" },
	"textbook/waiver-revoke": { label: "豁免收回", emoji: "🛟", announce: false },
	"textbook/pause": { label: "暂停", emoji: "⏸" },
	"textbook/resume": { label: "继续", emoji: "▶" },
	"textbook/outline-decision": { label: "章节安排拍板", emoji: "📋" },
	"textbook/gold-opinion": { label: "金标准意见", emoji: "✍️", announce: false },
	"textbook/gold-seal": { label: "金标准定稿", emoji: "🏆" },
	"textbook/gold-chapter": { label: "金标准章", emoji: "👑", announce: false },
	"textbook/chapters-review": { label: "章节过目确认", emoji: "🔍", announce: false },
	"textbook/final-approve": { label: "终检认可", emoji: "✅", announce: false },
	"textbook/deep-modify": { label: "定点修改", emoji: "✏️", announce: false },
	"textbook/deep-undo": { label: "撤销定点修改", emoji: "↩️", announce: false },
	"textbook/pattern-added": { label: "自定义模式", emoji: "📇", announce: false },
	// 交工/提审被拒（票 audit-matrix-contract/01 (d)）：机器把拒收与原因入账——用户与下一个接手的人
	// 不必再翻对话轨迹才知道这道闸门响过。**要开口**（用户正是被「机器报错、AI 说没事」卡住的人）。
	"textbook/submit-rejected": { label: "交工被拒", emoji: "🚫" },
});
