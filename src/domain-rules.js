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
});
