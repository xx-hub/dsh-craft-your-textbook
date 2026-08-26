/**
 * 造书工作台 · 领域规则单一事实来源
 *
 * 前后端共享的领域常量与纯推导函数：素材角色、范例章、六阶段、账本事件类型。
 * 双端约束（架构评审候选 3 敲定）：本文件被 esbuild 打进前端 bundle
 * （入口 src/client-entry.js），也被 node ESM 后端直接 import——
 * 必须保持零 node 内置依赖、零 react 依赖、零第三方依赖；
 * 只放「两侧都必须知道」的规则，单侧展示文案（进度条短标签等）不进这里。
 * 术语见 CONTEXT.md（素材角色 / 范例章 / 金标准）。
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
	"textbook/deep-modify",
	"textbook/deep-undo",
	"textbook/pattern-added",
]);
