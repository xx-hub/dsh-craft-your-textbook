/**
 * 造书工作台 · 「阶段 / 步」视图模型（架构评审候选 06）
 *
 * 这是**候选 06** 的深 module：一本书的「阶段 / 步」只在这里归一一次（canonical snapshot），
 * 全览条（ProgressOverview）、阶段页（PhasePage）、阶段片接线与工作台焦点都从同一份只读
 * projection 读取。`WorkbenchView` 用 `useMemo([meta, processSegs])` 建一次 projector，
 * 交给各消费方共用——「一次推导」由此成立。
 *
 * 外部只有一个 interface：
 *   createStageStepProjector({ meta, segments, runningSubagentCount })  →  project(request)
 * `request` 是带 tag 的三选一（per-tag **最小形状**，tag 真实缩小 interface）：
 *   · { kind: "overview" } 全览条用：headline / currentPhaseText / counts / 分组行 / 阶段片文件数
 *   · { kind: "phase", phase, focus?, optimisticSegmentKey? } 阶段页用：阶段名 / intro / 完整行 / 焦点 / 计数
 *   · { kind: "focus", ref, fallbackPhase? } 工作台焦点用：这一步 / 这一段落在第几阶段
 *
 * `runningSubagentCount`（在跑的小助手数，票 20 加的第三个入参）只喂章那几行：「我正在做」凭什么说得出来。
 * 它与章节卡徽章（`chapters-map.js`）走**同一个判据函数**，两屏因此不可能一个说有人在写、
 * 另一个说没人认领。
 *
 * canonical snapshot、索引、排序、key 兼容解析、diagnostics 全藏在 implementation 内；返回对象
 * 深冻结、只读，不含 callback / 时间 / 导航目标 / 写动作。
 *
 * 依赖分类（DEEPENING.md）：**in-process 纯计算**——只吃已取回的 `segments`（机器分段）与 `meta`，
 * 不创建 I/O、不引入 adapter、不需要新 seam。`workFiles` **不进**本 interface（`openableArtifacts`
 * 实际只读 `seg.artifacts`）；它仍是 Workbench 的真实 state。
 *
 * 继承的不变量（只编码、不重决；依据见 `.scratch/stage-step-model/spec.md` 的继承指针）：
 *   · 服务端整数 `seg.phase` 无条件优先，缺值才按 `domain-rules.SEGMENT_PHASE[kind]` 兜底（ADR-0012 决策 8）。
 *   · 一章＝写 / 审 / 复核三步；材料准备＝第一步；已排定 `total=3N+10`，未排定 `known=10`/`total=null`（票 01）。
 *   · 当前步只由 `pendingStage` / `pendingGate` / `meta.status` 决定，不由 `meta.phase` 推断（CONTEXT「当前步」）。
 *   · 定点修改粒度＝分段（ADR-0014）；行只带 `modify.segmentKey`，材料准备 / 合成章步 `modify:null`。
 *   · 导航只换屏、不开文件、不发动作（ADR-0010 / 0012）。
 *
 * 依赖方向（单向、无环）：本 module **import** `view-rules` 的展示派生（`stepWord` / `phaseOfSegment` /
 * `openableArtifacts` / `decisionText` / `artifactFactText` / `PHASE_INTRO` / `PHASE_UI`）与
 * `domain-rules` 的界面词区；`view-rules` **不** import 本 module。`stepWord` 留在 `view-rules`
 * （`materialConversionActivityText` 与两屏共用），`stepIcon` 与 `rowText` 的合成搬进本 module
 * （行自带 `rowText`，调用方不再各拼一份）。
 */
import {
	PHASE_UI,
	phaseOfSegment,
	stepWord,
	openableArtifacts,
	decisionText,
	artifactFactText,
	indexRunningChapterClaims,
	PHASE_INTRO,
} from "./view-rules.js";
import { SEGMENT_PHASE, segmentHuman } from "../domain-rules.js";

// ── 只读工具 ──────────────────────────────────────────────────────────────

/** 递归深冻结：projection 返回值只读，某个渲染方不许就地改一份行污染别的渲染方。 */
function deepFreeze(value) {
	if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
	Object.freeze(value);
	for (const key of Object.keys(value)) deepFreeze(value[key]);
	return value;
}

// ── 章内三步（票 01 §2 的逐格表） ──────────────────────────────────────────
const CHAPTER_STEPS = Object.freeze([
	{ key: "write", name: "写" },
	{ key: "audit", name: "审" },
	{ key: "finalize", name: "复核" },
]);

/** 步名与 `segmentHuman` 只差这一格（票 01 §2 的表里这一步叫「最后检查与交付」）。 */
const SEGMENT_STEP_TITLE = Object.freeze({ final: "最后检查与交付" });

/** 材料准备那一步的 key（阶段 1 没有分段，但票 01 Q2 裁决它算第一步）。——只在本 module 内用。 */
const MATERIAL_STEP_KEY = "material";

/** 范例章在写完整本里注明来源时使用的唯一一句话。 */
const GOLD_SOURCE_NOTE = "最佳范例章，第 4 阶段已写";

/** 章内三步各自的稳定 key 后缀：`chapter-3:write`。 */
const chapterStepKey = (segmentKey, stepKey) => `${segmentKey}:${stepKey}`;

/** 四态图标（票 04：全览条清单与阶段页共用的那一份；没登记的态退回「还没到」的圈，不猜）。 */
const STEP_ICON = Object.freeze({ done: "·", "waiting-user": "⚡", active: "▶", pending: "○" });
const stepIcon = (state) => STEP_ICON[state] ?? STEP_ICON.pending;

/** 四态行的可见文字：`图标 步名（状态词）`。全览条与阶段页都吃行上算好的 `rowText`，不再各拼。 */
const buildRowText = (title, status, statusWord) => {
	const word =
		typeof statusWord === "string" && statusWord !== "" ? statusWord : stepWord(status);
	return `${stepIcon(status)} ${title ?? ""}（${word}）`;
};

// ── 归一：材料准备 / 章内五态 / 章数 ───────────────────────────────────────

/** 章内五态 → 写 / 审 / 复核 三步各走到哪（票 01 §2 的完成判据）。
 *
 * ⚠️ 票 22（2026-09-29 真机走查）：**机器事实先判**。原来 AI 自报的 `stage` 排在 `segStatus` 前面，
 * 于是「AI 最后一次报的是 auditing」会**永久压住**随后落到账本上的交工事件——
 * 走查那一屏正是这样冻着的：`▶ 第 2 章 · 审（我正在做）`／`○ 第 2 章 · 复核（还没到这一步）`，
 * 而账本与章节卡都已经记下「第 2 章 22:10:42 交工」，那一屏**一个子智能体都没在跑**。
 * 交工是**账本事件**，清单既然是账本的投影就该在同一轮刷新里跟上；AI 自报的是「我刚才到哪了」，
 * 那是**过去某一刻**的读数。两件事都真，冲突时**机器的那一件赢**。
 *
 * ⚠️⚠️ 票 20（2026-09-30 用户裁决 · 换掉状态**来源**）：**AI 自报的五态只答「这一章上一刻走到哪了」**，
 * 它**不表示此刻有人在写它**。原先 `active` 直接由它推导，于是铺章里排队的章逐行亮起
 * 「▶ 我正在做」——与章节卡那几行、顶栏那个「N 个小助手在跑」三处互相打架。
 * 现在 **五态映射只在「这一章被认领」时**（`claimed`，判据与章节卡徽章**同一份**：
 * `view-rules.indexRunningChapterClaims`）才给 `active`；没被认领就落回 `pending`，
 * 由 `chapterStatusWord` 按「产物在不在盘上」说准是「还没完成」还是「还没到这一步」——
 * 与票 24 在这一档上定的口径同款：**产物在 ≠ 有人在写**。
 * ⚠️ **服务端给的段状态 `active` 对章段**也**要认领**，尽管它长着机器的样子：
 * `buildProcessMap` 的章段那一格是 `phase >= 5 && stageN !== null`（`src/workflow.js`）——
 * **`stageN !== null` 就是 AI 自报过**，所以对章而言这一位是自报的**改写**，不是第二个来源。
 * 留着它不设闸 ＝ 走查那一屏原样复发（3 章都报过阶段、只跑 1 个 ⇒ 3 行「我正在做」）。
 * 定点修改不靠它：服务端 `deep-modify` 会**清掉**被重做章的 `chapterPipeline` 条目（F35），
 * 那一章的段状态因此是 `pending`；「用户刚点了重做」那个窗口由 `PhasePage` 的**乐观标记**管
 * （它只管到下一份 `/textbook/process` 为止，见那个文件的注释），**不靠这一位**。
 */
/** 自报五态 → 三步各走到哪（`CHAPTER_PROGRESS_STAGES` 里除 `done` 外的四态；值＝三步状态）。 */
const CHAPTER_STAGE_STEPS = Object.freeze({
	writing: Object.freeze(["active", "pending", "pending"]),
	auditing: Object.freeze(["done", "active", "pending"]),
	audited: Object.freeze(["done", "done", "pending"]),
	finalizing: Object.freeze(["done", "done", "active"]),
});

/** 被认领、但自报阶段判不出在哪一道工序（没上报／不认识的值）→ 只说「这一章在被做」，不猜是哪一步。 */
const CHAPTER_STEPS_UNPLACED = Object.freeze(["active", "pending", "pending"]);

function chapterStepStatuses(stage, segStatus, claimed) {
	// ① 机器判定的「这一章已交工」（`segStatus` 来自服务端 `chapterDone`）——最高优先。
	if (segStatus === "done") return ["done", "done", "done"];
	// ② 「做完」与「在写」是**两件不同的事**：自报 `done` 说的是这一章已经走完（与①同族，
	// 都由机器随后盖章），它不占用名额、不需要认领。票 20 只管「我正在做」那一支。
	if (stage === "done") return ["done", "done", "done"];
	// ③ 轮到用户（与「在写」也无关，它说的是「等你拍板」）。
	if (segStatus === "waiting-user") return ["waiting-user", "pending", "pending"];
	// ④ 票 20：章段上「我正在做」**只有一个来源**——认领（判据与章节卡徽章同一份）。
	//    没认领就一律 pending，哪怕服务端把这一段判成 `active`（对章而言那是自报的改写，见上）。
	if (claimed !== true) return ["pending", "pending", "pending"];
	return CHAPTER_STAGE_STEPS[stage] ?? CHAPTER_STEPS_UNPLACED;
}

/** 材料准备这一步走到哪：完成判据＝书已进阶段 2（`meta.phase >= 2`）。 */
function materialStepStatus(meta, segments) {
	const phase = Number.isInteger(meta?.phase) ? meta.phase : null;
	if (phase !== null) {
		if (phase >= 2) return "done";
		return phase === 1 && meta?.status === "running" ? "active" : "waiting-user";
	}
	const explore = segments.find((seg) => seg?.key === "explore");
	return explore !== undefined && explore.status !== "pending" ? "done" : "pending";
}

/** 章数 N：取 `meta.outline.chapters` 的长度，缺了按章段数兜底，两头取大。 */
function chapterCountOf(segments, meta) {
	const planned = Array.isArray(meta?.outline?.chapters) ? meta.outline.chapters.length : 0;
	const fromSegments = segments.filter((seg) => seg?.kind === "chapter").length;
	return Math.max(planned, fromSegments);
}

/** 章段的章号：`seg.key`（`chapter-3`）是权威机器身份；认不出退回它在章段里的序号。 */
function chapterNoOfSegment(seg, ordinal) {
	const match = /^chapter-(\d+)$/.exec(String(seg?.key ?? ""));
	return match === null ? ordinal : Number(match[1]);
}

/** 章内五态的客户端兜底：读 `meta.chapterPipeline[n-1].stage`（0 基）。 */
function chapterPipelineStage(meta, chapterNo) {
	const pipeline = Array.isArray(meta?.chapterPipeline) ? meta.chapterPipeline : [];
	const entry = pipeline[chapterNo - 1];
	return entry !== null && typeof entry === "object" ? (entry.stage ?? null) : null;
}

// ── 票 24（P17）：「还没到这一步」那一档要说准 ────────────────────────────────
//
// 那一档（pending）过去混着两件不同的事：①真没开始 ②开始写了、但这一章还没交工。
// ②那一档说「还没到这一步」是**假话**（正文已经在盘上，用户据此以为没写）——2026-09-27 走查 P17
// 的原话：同屏两处对「这一章现在到哪了」给出不同答案，清单说的还更保守。
//
// 这里按**机器真知道的事实**把两件事分开，不猜：判据只有「这一章的产物在不在盘上」
// （`artifactFacts` / `artifacts` 都是服务端判定过的事实，见 view-rules 的 artifactFactText）。
// ①没产物 → 仍说「还没到这一步」（那是准的）；②有产物但 AI 没上报阶段 → 改说「还没完成」：
// 这一章已经开始落盘、只是**这一章**还没走完——**不猜它在写还是在检查**，所以不给「我正在做」，
// 也不说「没到」。第二章正文写到哪一步由下面那行产物事实（正文时间戳 + 新鲜度标记）交代。
//
// ⚠️ 用词上刻意避开「交工」两个字：步清单的每一行本身是**导航**热区（点一行＝去那一步），
// 界面里「交工」是**会改结果**那颗按钮的用词（test-phase-page 的只读断言按这条子串扫），
// 状态词里带它会让那道守卫分不清导航与写操作。
//
// 📖 **口径不在本文件里定，在词条里定**（票 `walkthrough-fixes/16` · 2026-09-29 用户拍板选「甲」）：
// 见 `CONTEXT.md`「工作台状态词」2026-09-29 那两条边界——
//   · 「还没到这一步」与「还没完成」是**步清单四态里那两个步态说法**，不占「轮到你 / 我正在做 /
//     已完成」三个词的名额，也不受「任一时刻只允许出现一个」约束（三档里**已完成／轮到你／
//     我正在做**仍取自那三个词）；三词上限**不改成五词**。
//   · 出口**保持两处**：`view-rules.stepWord` 给默认词，`makeRow` 在拿到非空串时用
//     `statusWord` 覆盖——**不收成一处**（那会反转 `view-rules` 声明的「模型单向 import 本文件」）。
// ⇒ **本文件是那段口径的实现，不是它的副本**：改词先改 `CONTEXT.md`，本文件跟着；
// 不要在这里另立一套说法（另立过一次，见 2026-09-29 之前的「第五个说法」写法）。
// 本票**零行为变更**：下面的逻辑与 2026-09-27 落地时逐字相同。

/** 步态补充说法：产物已落盘、这一章还没完成（AI 又没上报阶段）——**不是**工作台状态词，见 `CONTEXT.md`「工作台状态词」。 */
const CHAPTER_NOT_DONE_YET_WORD = "还没完成";

/** 这一章的产物是不是已经在盘上（正文/检查记录任一即可，都是服务端判过的事实）。 */
function chapterStartedOnDisk(seg) {
	if (seg === null || seg === undefined) return false;
	if (Array.isArray(seg.artifactFacts) && seg.artifactFacts.some((fact) => fact !== null && typeof fact === "object" && fact.path !== undefined)) return true;
	const artifacts = Array.isArray(seg.artifacts) ? seg.artifacts : [];
	return artifacts.some((rel) => typeof rel === "string" && rel !== "");
}

/**
 * 章内一步的状态词：只在这一档（pending）上做区分，其余档交回默认的 `stepWord`。
 * 返回 null ＝「按默认词走」；调用方 `makeRow` 只在给了非空串时覆盖。
 *
 * ⚠️ 票 20：AI 自报的阶段**不再**足以压住这一档的「产物判据」——自报的是过去某一刻，
 * 此刻谁在写由 `chapterStepStatuses` 的认领那一支管。只有**这一章真被认领**时，五态映射才知道
 * 剩下那几步各自该说「还没到这一步」，那才是自报阶段能贡献的信息。
 * 没被认领而产物已在盘上的章，落回「还没完成」（票 24 的口径）：产物在 ≠ 有人在写。
 */
function chapterStatusWord(status, stage, seg, claimed) {
	if (status !== "pending") return null; // 已完成/轮到你/我正在做：各走各的默认词
	// 认领 ＋ 自报阶段 → 机器知道剩下几步还没到，用默认词。
	if (claimed === true && typeof stage === "string" && stage !== "") return null;
	if (chapterStartedOnDisk(seg)) return CHAPTER_NOT_DONE_YET_WORD;
	return null; // 真没开始：「还没到这一步」本来就是准的
}

/** 章内三步的阶段号：段在就 `phaseOfSegment`（服务端优先、kind 兜底），段不在就是章段的阶段号。 */
function chapterStepPhase(seg) {
	const phase = seg === null || seg === undefined ? null : phaseOfSegment(seg);
	return Number.isInteger(phase) ? phase : SEGMENT_PHASE.chapter;
}

/** 一步的展示明细只在这里派生一次；四态与步序完全不从这些字段反推。 */
function stepDetailFields(step, meta) {
	let sourceNote = null;
	const chapterStep = Number.isSafeInteger(step?.chapter) && step.chapter >= 1;
	const writeStep = chapterStep && String(step?.key ?? "").endsWith(":write");
	// 一章的三行共用同一个 segment；把产物事实放在「写」行，审/复核不再重复。
	const factText = chapterStep && !writeStep ? "" : artifactFactText(step?.segment);
	const explicitlyGold =
		Number.isSafeInteger(meta?.goldChapter) &&
		meta.goldChapter >= 1 &&
		meta.goldChapter === step?.chapter;
	const phaseAtOrAfterGold = Number.isInteger(meta?.phase) && meta.phase >= 4;
	if (writeStep && explicitlyGold && phaseAtOrAfterGold) sourceNote = GOLD_SOURCE_NOTE;
	const detailLines = [];
	if (sourceNote !== null) detailLines.push(sourceNote);
	if (factText !== "") detailLines.push(factText);
	return { detailLines, factText, sourceNote };
}

// ── 下游影响预告（人读名字，票 11） ────────────────────────────────────────
function downstreamNames(seg, segments) {
	const keys = Array.isArray(seg?.downstream) ? seg.downstream : [];
	const byKey = new Map();
	for (const s of segments)
		if (s?.key !== undefined && s?.key !== null) byKey.set(String(s.key), s);
	const selfKey = seg?.key === undefined || seg?.key === null ? null : String(seg.key);
	const names = [];
	const seen = new Set();
	for (const raw of keys) {
		const key = String(raw ?? "");
		if (key === "" || key === selfKey) continue;
		const s = byKey.get(key);
		const name = s === undefined ? segmentHuman(key) : segmentHuman(s);
		if (name === "" || name === key) continue;
		if (seen.has(name)) continue;
		seen.add(name);
		names.push(name);
	}
	return names;
}

// ── canonical 行 ──────────────────────────────────────────────────────────

/**
 * 一行 canonical step。`target` 取代「`segmentKey===null` 判材料/合成步」与 `MATERIAL_STEP_KEY`
 * 两处机器 key 泄漏；`modify` 取代 `MATERIAL_STEP_KEY` / `chapterStepKey` 的写意图判定。
 *
 * 异常 identity（空 / 重复 key）的 `modify` 一律 null——绝不猜一个可能写错目标的
 * `deep-modify` 段 key（这是行为零变化的唯一例外，仅针对损坏输入）。
 */
function makeRow(step, segments, enriched) {
	const status = step.status;
	// 步可以自带状态词覆盖（票 24：章那一档要按「产物在不在盘上」把「还没到这一步」说准）；
	// 没给或给了空串就取默认的那一份 `stepWord`（界面状态词只此一份，见 view-rules）。
	const statusWord = typeof step.statusWord === "string" && step.statusWord !== "" ? step.statusWord : stepWord(status);
	const segmentKey = step.segmentKey ?? null;
	const validSegment = typeof segmentKey === "string" && segmentKey !== "";
	const canModify = validSegment && step.canDeepModify === true;
	const base = {
		key: step.key,
		no: step.no,
		phase: step.phase,
		title: step.title,
		status,
		statusWord,
		rowText: buildRowText(step.title, status, statusWord),
		// 只读导航目标：有真实段 → 步 key；材料准备 / 合成章步 → 阶段号。
		target: validSegment ? { kind: "step", ref: step.key } : { kind: "phase", phase: step.phase },
		// 写意图：只有「有真实段 且 段允许定点修改」才给 modify 目标（ADR-0014 粒度＝分段）。
		modify: canModify ? { segmentKey } : null,
		detailLines: step.detailLines ?? [],
		factText: step.factText ?? "",
		sourceNote: step.sourceNote ?? null,
	};
	if (!enriched) return base;
	// phase 行才带这些（overview 行保持窄）：章号、段能力、产物、结论、下游、检查摘要。
	return {
		...base,
		chapter: step.chapter,
		segmentKey,
		canDeepModify: canModify,
		auditSummary: step.segment?.auditSummary ?? null,
		decision: decisionText(step.segment),
		artifacts: openableArtifacts(step.segment),
		downstream: downstreamNames(step.segment, segments),
	};
}

/** 一份 payload 的 step 模型（**步**只派生一次；材料准备 / 章内三步 / 其余每段一步）。 */
function deriveSteps(meta, segments, chapterClaims) {
	const steps = [];

	const pushMaterialStep = () => {
		const status = materialStepStatus(meta, segments);
		const step = {
			key: MATERIAL_STEP_KEY,
			no: 0,
			title: PHASE_UI[1] ?? "",
			phase: 1,
			status,
			chapter: null,
			segmentKey: null,
			segment: null,
			canDeepModify: false,
		};
		steps.push({ ...step, ...stepDetailFields(step, meta) });
	};

	const pushChapterSteps = (n, seg) => {
		const stage = seg?.stage ?? chapterPipelineStage(meta, n);
		// 票 20：这一章此刻有没有在跑的小助手认领它——**与章节卡徽章同一份判据**
		// （`view-rules.indexRunningChapterClaims`，在 `createStageStepProjector` 里算一次）。
		const claimed = chapterClaims.has(n);
		const statuses = chapterStepStatuses(stage, seg?.status, claimed);
		const segmentKey = seg?.key ?? `chapter-${n}`;
		for (let i = 0; i < CHAPTER_STEPS.length; i += 1) {
			const step = {
				key: chapterStepKey(segmentKey, CHAPTER_STEPS[i].key),
				no: 0,
				title: `第 ${n} 章 · ${CHAPTER_STEPS[i].name}`,
				phase: chapterStepPhase(seg),
				status: statuses[i],
				// 票 24（P17）：这一档的说法由「产物在不在盘上」决定，不让 UI 自己猜。
				statusWord: chapterStatusWord(statuses[i], stage, seg, claimed),
				chapter: n,
				segmentKey: seg?.key ?? null,
				segment: seg ?? null,
				canDeepModify: seg?.canDeepModify === true,
			};
			steps.push({ ...step, ...stepDetailFields(step, meta) });
		}
	};

	const pushSegmentStep = (seg) => {
		const step = {
			key: String(seg?.key ?? ""),
			no: 0,
			title: SEGMENT_STEP_TITLE[seg?.key] ?? segmentHuman(seg),
			phase: phaseOfSegment(seg),
			status: seg?.status ?? "pending",
			chapter: null,
			segmentKey: seg?.key ?? null,
			segment: seg ?? null,
			canDeepModify: seg?.canDeepModify === true,
		};
		steps.push({ ...step, ...stepDetailFields(step, meta) });
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
			for (let n = 1; n <= chapterTotal; n += 1) pushChapterSteps(n, byChapterNo.get(n));
			for (const seg of rows) if (seg?.kind !== "chapter") pushSegmentStep(seg);
			continue;
		}
		for (const seg of rows) pushSegmentStep(seg);
	}
	// 阶段归属认不出的分段（旧 payload 连 kind 都没有）不静默丢：挂在末尾，phase 为 null。
	for (const seg of segments) if (phaseOfSegment(seg) === null) pushSegmentStep(seg);

	return steps.map((step, index) => ({ ...step, no: index + 1 }));
}

// ── canonical snapshot ───────────────────────────────────────────────────

/**
 * 私有 canonical snapshot：一次归一 + first-wins 索引 + 计数。**不直接暴露**给调用方——
 * 只经 `project` 投影。`rowByStepKey` / `rowBySegmentKey` 都 first-wins（只在缺键时写），
 * 保住 legacy `.find()` first-match 语义（Map 若 last-wins 会悄悄改重复 key 的行为）。
 *
 * ⚠️ 票 20：「谁在写哪一章」的认领**在这里算一次**，全览条与阶段页的所有行共用同一份
 * （`indexRunningChapterClaims` 与 `chapters-map.js` 的章卡徽章是**同一个函数**，
 * 不许两处各判各的——两处各判一次就是两套真相）。
 */
function buildSnapshot({ meta, segments, runningSubagentCount }) {
	const normMeta = meta ?? undefined;
	const normSegments = Array.isArray(segments) ? segments : [];
	const chapterClaims = indexRunningChapterClaims(normSegments, runningSubagentCount);
	const steps = deriveSteps(normMeta, normSegments, chapterClaims);

	const overviewRows = steps.map((step) => makeRow(step, normSegments, false));
	const phaseRows = steps.map((step) => makeRow(step, normSegments, true));

	// first-wins 索引：exact step key 优先，其次 segment key（章段多步共享一段 → 取第一步）。
	const rowByStepKey = new Map();
	const rowBySegmentKey = new Map();
	for (const row of phaseRows) {
		if (!rowByStepKey.has(row.key)) rowByStepKey.set(row.key, row);
		if (row.segmentKey !== null && !rowBySegmentKey.has(row.segmentKey))
			rowBySegmentKey.set(row.segmentKey, row);
	}

	const chapters = chapterCountOf(normSegments, normMeta);
	const counts = {
		chapters,
		chaptersPlanned: chapters > 0,
		known: steps.length,
		total: chapters > 0 ? 3 * chapters + 10 : null,
		remaining: steps.filter((step) => step.status !== "done").length,
	};

	// 阶段片文件数：按分段条目累计（**不**按路径去重）——与阶段页的 `uniqueFileCount` 是有意不同的两个事实。
	const artifactEntryCountByPhase = {};
	for (const seg of normSegments) {
		const phase = phaseOfSegment(seg);
		if (phase === null) continue;
		artifactEntryCountByPhase[phase] =
			(artifactEntryCountByPhase[phase] ?? 0) + openableArtifacts(seg).length;
	}

	return {
		meta: normMeta,
		segments: normSegments,
		steps,
		overviewRows,
		phaseRows,
		rowByStepKey,
		rowBySegmentKey,
		counts,
		artifactEntryCountByPhase,
	};
}

// ── overview projection ──────────────────────────────────────────────────

/** 按阶段分组（overview 行）；`phase:null` 的旧 payload 行挂末尾（UI 取「阶段待定」组名）。 */
function groupRows(overviewRows) {
	const groups = [];
	for (const row of overviewRows) {
		const phase = row.phase ?? null;
		const last = groups[groups.length - 1];
		if (last !== undefined && last.phase === phase) last.rows.push(row);
		else groups.push({ phase, rows: [row] });
	}
	return groups;
}

function projectOverview(snapshot) {
	const { counts } = snapshot;
	const headline = counts.chaptersPlanned
		? `全书 ${counts.total} 步 · ${counts.remaining === 0 ? "已全部完成" : `还剩 ${counts.remaining} 步`}`
		: `已知 ${counts.known} 步 · 章节排定后补齐`;
	const currentPhase = Number.isInteger(snapshot.meta?.phase) ? snapshot.meta.phase : 1;
	const currentPhaseText = `现在在第 ${currentPhase} 阶段 · ${PHASE_UI[currentPhase] ?? ""}`;
	return {
		kind: "overview",
		headline,
		currentPhaseText,
		counts: { ...counts },
		groups: groupRows(snapshot.overviewRows),
		artifactEntryCountByPhase: { ...snapshot.artifactEntryCountByPhase },
	};
}

// ── phase projection ─────────────────────────────────────────────────────

/**
 * 某一阶段的完整投影。
 *
 * 乐观 redo（`optimisticSegmentKey`）：**只有 phase 投影**吃这个输入，且只覆写**同段**行的
 * status / statusWord / rowText / doneCount——不碰 canonical rows、overview counts。
 * 覆盖在投影末端做，所以 `rowText` 不会 stale；新 process 身份到来由 `PhasePage` 清 redoKey
 * （`processToken`），projector 本身无状态。
 */
function projectPhase(snapshot, request) {
	const phase = request.phase;
	const focus = request.focus ?? null;
	const optimistic =
		typeof request.optimisticSegmentKey === "string" && request.optimisticSegmentKey !== ""
			? request.optimisticSegmentKey
			: null;

	let rows = snapshot.phaseRows.filter((row) => row.phase === phase);
	if (optimistic !== null) {
		rows = rows.map((row) => {
			if (row.segmentKey !== optimistic) return row;
			const statusWord = stepWord("active");
			return {
				...row,
				status: "active",
				statusWord,
				rowText: buildRowText(row.title, "active", statusWord),
			};
		});
	}

	// 焦点落点：精确步 key 优先，旧段 key 落该段第一步（first-wins），认不出（或是别的阶段）null。
	const focusedStepKey = (() => {
		if (focus === null || focus === undefined) return null;
		const key = String(focus);
		const byStep = snapshot.rowByStepKey.get(key);
		if (byStep !== undefined) return byStep.phase === phase ? byStep.key : null;
		const bySegment = snapshot.rowBySegmentKey.get(key);
		return bySegment !== undefined && bySegment.phase === phase ? bySegment.key : null;
	})();

	const doneCount = rows.filter((row) => row.status === "done").length;
	// 「份文件」按**路径去重**：章内三步共属一段，不去重会把一章的正文数成三份。
	const uniqueFileCount = new Set(rows.flatMap((row) => row.artifacts.map((item) => item.path))).size;

	return {
		kind: "phase",
		phase,
		name: PHASE_UI[phase] ?? String(phase),
		intro: PHASE_INTRO[phase] ?? "",
		rows,
		focusedStepKey,
		doneCount,
		uniqueFileCount,
	};
}

// ── focus projection ─────────────────────────────────────────────────────

/** 工作台焦点：这一步 / 这一段落在第几阶段（精确步 key → 旧段 key → 回退阶段）。 */
function projectFocus(snapshot, request) {
	const fallbackPhase = Number.isInteger(request.fallbackPhase) ? request.fallbackPhase : 1;
	const ref = request.ref ?? null;
	if (ref === null || ref === undefined) {
		return { kind: "focus", phase: fallbackPhase, stepKey: null, segmentKey: null, matchedBy: "none" };
	}
	const key = String(ref);
	const byStep = snapshot.rowByStepKey.get(key);
	if (byStep !== undefined) {
		return {
			kind: "focus",
			phase: byStep.phase,
			stepKey: byStep.key,
			segmentKey: byStep.segmentKey,
			matchedBy: "step",
		};
	}
	const bySegment = snapshot.rowBySegmentKey.get(key);
	if (bySegment !== undefined) {
		return {
			kind: "focus",
			phase: bySegment.phase,
			stepKey: bySegment.key,
			segmentKey: bySegment.segmentKey,
			matchedBy: "segment",
		};
	}
	return { kind: "focus", phase: fallbackPhase, stepKey: null, segmentKey: null, matchedBy: "fallback" };
}

// ── 唯一导出：projector factory ──────────────────────────────────────────

/**
 * 建一个只读 projector。`{ meta, segments }` 是同一份 process/meta 快照；调用方（WorkbenchView）
 * 负责用 `useMemo([meta, processSegs])` 保证同一快照只建一次。
 * 返回 `{ project }`——调用方只经 `projector.project(request)` 读事实。
 *
 * ⚠️ 票 20：`runningSubagentCount`（在跑的小助手数，与顶栏「🔎 N 个小助手在跑」同一份读数）是**第三个入参**，
 * 章那几行凭什么说「我正在做」全由它决定。**缺这一格按 0 算**——那意味着清单不说「我正在做」，
 * 是安全方向（少说一句收得回来，多说一句就是票 20 那个病）。
 */
export function createStageStepProjector(input) {
	const snapshot = buildSnapshot(input ?? {});
	const project = (request) => {
		if (request === null || typeof request !== "object") {
			throw new Error("project(request) 要一个带 kind 的 request");
		}
		let result;
		if (request.kind === "overview") result = projectOverview(snapshot);
		else if (request.kind === "phase") result = projectPhase(snapshot, request);
		else if (request.kind === "focus") result = projectFocus(snapshot, request);
		else throw new Error(`project 收到不认识的 kind：${String(request.kind)}`);
		return deepFreeze(result);
	};
	return Object.freeze({ project });
}
