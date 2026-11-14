/**
 * 造书内容生成库（v2 · 主 AI 嵌入工作流）
 *
 * 流水线（源探查/设计提案/章节骨架/范例章/铺章/自查/合并）真实模式已交由
 * 主对话 AI 统筹完成（可亲手做或派小助手；宿主通过 workbench_act 的 stage-brief 派发方法论素材，
 * 不在这里跑子代理）。本库保留：
 *  - demo 模式：演示书的流水线占位产出（明确标注演示内容，仅用于熟悉流程）
 *  - 向导与辅助：选书建议（wizard）、每章字数建议（words）
 *    —— 这**两类**仍是宿主侧一次性子代理（快捷建议，非流水线写作）
 *    （⚠️ 票 `pre-gold-build/02` 退役了原先第三类「PDF 角色识别（roles）」：`suggestRoles()`／
 *    `buildRolePrompt()` 整条撤掉，角色改由探查段开头的书级材料判定产出，见本文件下半段那条注）
 *
 * resources/ 方法论文件由 `workflow/engine.js` 的 buildStageBrief 通过 `readResource`（分档答案）
 * 读取，嵌入交办说明给主 AI。
 */

import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { jsonrepair } from "jsonrepair";
import {
	// 探查报告的**必做小节名**（票 `demo-flow-fidelity/04`）——演示夹具那份 `工作区/explore.md`
	// 必须逐字含这几个词：验货是 `includes` 子串匹配（`src/workflow/actions/chapters.js:447-452`），
	// 这里抄一份字面量就等于第二份会漂的词表（词表改名 → 夹具静默失配 → 演示书第一份报告
	// 按真实口径当场 400）。小节名只此一处，派生面＝下面 `demoExplore()` 的 `index`。
	EXPLORE_ITEM_CODE_TABLE,
	EXPLORE_ITEM_TRUTH_CALIBRATION,
	EXPLORE_ITEM_COMMON_ANCHORS,
	// 票 `demo-channel-full/08`：最后检查那**五路**的身份词（`{n, scope}` 五行）——演示那五份分报告按它
	// 派生（⛔ 不手抄那五个节名：抄一份，上游改一处，演示书上就会多出/少掉一路而没人响）。
	FINAL_AUDIT_SCOPES,
	// 票 `demo-channel-full/19`：写作规范里**机器逐字软验的那五节**——演示书那份 `style-spec.md`
	// 的节标题按这张表派生（⛔ 不手抄第二份五个词：抄一份，上游加一节，演示书就少一节而没人响；
	// 对账面在 `test-scaffold-declaration.mjs`，它从契约源文解析词来比）。
	STYLE_SPEC_REQUIRED_SECTIONS,
} from "./domain-rules.js";
// 知识点卡的**复合键格式**只有生产那一处实现（`M<材料号>-<片内组:02>-<序号:02>`，三段都是 1 基正整数）
// ——演示夹具不手抄它（票 `demo-channel-full/01`）：手抄一份，键格式一改，演示书上那张图会以
// 「卡的材料号认不出」的形状静默降级，而图闸对「没有图键」的书走老书那一档、接不住它。
// ⚠️ 只取这一个纯函数：`knowledge-graph-build.js` 不 import 本文件，方向仍向下（不是环）。
import { knowledgeCardKey } from "./workflow/knowledge-graph-build.js";
// 票 `demo-channel-full/12`：演示书那份**合并件**要走**生产那一段拼装**（各片 ＋ 书级键 ＋ 角色表
// 的确定函数）——否则盘上那几片与合并件没有任何关系，「分片／细目」那两条就绪判据在演示书上
// 只能靠一条 demo 分叉跳过。⚠️ 只取这一个纯函数（它自己零 import，方向仍向下、不成环）。
import { expectedKnowledgeMap } from "./workflow/knowledge-map-assembly.js";
// 票 `demo-channel-full/15`：**段落级**抽查意见的形状只有一处出口（那个叶子模块只 import
// `domain-rules`，方向仍向下、不成环）——演示书自带的那条示例从它派生，⛔ 不在这里手抄第二份
// （抄一份，真书那一支加字段／改 `status` 取值时演示这条不会跟着动，而演示书上没有闸接得住）。
import { paragraphOpinion } from "./workflow/engine/labels.js";

const HERE = dirname(fileURLToPath(import.meta.url));
export const RESOURCES_DIR = join(HERE, "..", "resources");

/** 读 vendored 方法论文件：**一次问答、答案分档**（票 `resource-read-result/01`）。
 *
 *  - 读到了：`{ ok: true, text }`
 *  - 读不出：`{ ok: false, rel, reason }`（`rel` 让人拿得到「谁缺的」，`reason` 只进诊断文案）
 *
 *  为什么是分档而不是 `null`／抛：`null` 与「文件合法地是空串」分不开、也与「忘了返回」分不开
 *  （同族先例 `ADR-0028`：一个布尔装不下三种结局）；抛则把「挂载面不许因为一份文档坏掉就炸掉
 *  整份 brief」这条口径变成**每个调用点各写一遍 `try`**——那正是本票要治的病（八个调用点
 *  各从字符串长相反推「这算不算读到」）。
 *
 *  ⛔ **唯一判据是 `ok`**；`reason` **不是判据**——调用方只许把它拼进给人看的文案，
 *  **不许按它分支**（按它分支＝把「缺」重新猜成若干细分档，病只是挪了个地方）。
 *  ⛔ `ok:true` 不带 `rel`（调用方本来就知道自己传了什么；多一个没人读的键只是白胖）。
 *
 *  带 mtime+size 内容缓存（P0-2）：resources/ 是只读静态文件，命中缓存时返回内容与磁盘一致，
 *  不改变产物内容；按文件变更（mtimeMs/size）失效，无陈旧风险。
 *  ⚠️ **成功才写缓存、失败不写**：缺的文件补上之后**下一次就读到**。
 */
const resourceCache = new Map(); // rel -> { mtimeMs, size, text }
export function readResource(rel) {
	const p = join(RESOURCES_DIR, rel);
	try {
		const stat = statSync(p);
		const cached = resourceCache.get(rel);
		if (
			cached !== undefined &&
			cached.mtimeMs === stat.mtimeMs &&
			cached.size === stat.size
		) {
			return { ok: true, text: cached.text };
		}
		const text = readFileSync(p, "utf8");
		resourceCache.set(rel, {
			mtimeMs: stat.mtimeMs,
			size: stat.size,
			text,
		});
		return { ok: true, text };
	} catch (error) {
		// 诊断用：把那一层的 `error.code`（ENOENT／EISDIR…）原样带上，分不开时退回人话。
		// ⛔ 这不是闭式枚举（枚举会变成第二份要人守的词表，ADR-0033 决策 2）。
		const code = typeof error?.code === "string" && error.code !== "" ? error.code : null;
		return {
			ok: false,
			rel,
			reason: code !== null ? code : `读不出：${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

const DEMO_MARK = "【演示内容 · 仅用于熟悉流程，非真实产出】";

// ── 一次性子代理执行（向导/识别/字数建议等快捷任务用） ─────────────────────

/**
 * 派发一个一次性子代理，返回其最终文本。
 * runtime: { ctx, demo, dir, project, getParent }
 * timeoutMs：单任务硬超时（默认 30 分钟——P2-10 从 15 分钟放宽，避免长章写作被硬超时打断；超时自动报错）。
 *
 * ⚠️ 接口（0.2.1 起）：宿主把小助手起法统一成 `startActivation({ provider, label, request, signal, delivery })`。
 * 这一档是**一次性**的：`delivery: 'caller'` 表示结果只回到调用方（这里 `await activation.result`），
 * 不通知模型；跑完由调用方 `dispose()` 释放。续接型那一支（报告回直接父级）见
 * `src/workflow/actions/chapters.js` 的派单／读卷两跳。
 */
async function runSubagent(
	runtime,
	label,
	promptText,
	timeoutMs = 30 * 60 * 1000,
) {
	const parent = await runtime.getParent();
	const activation = await runtime.ctx.subagents.startActivation({
		provider: "spawn",
		label,
		request: {
			prompt: [{ type: "text", text: promptText }],
			parent,
		},
		signal: AbortSignal.timeout(timeoutMs),
		delivery: "caller",
	});
	try {
		const result = await activation.result;
		if (result.stopReason !== "completed") {
			const tail = result.output
				.filter((block) => block.type === "text")
				.map((block) => block.text)
				.join("\n")
				.slice(0, 300);
			runtime.ctx.logger.warn(
				`textbook: 子代理「${label}」未完成（${result.stopReason}），输出尾部: ${tail}`,
			);
			throw new Error(`子代理未完成（${result.stopReason}）`);
		}
		const text = (() => {
			const blocks = result.output.filter((block) => block.type === "text");
			// 只取最后一段文本（最终答复）；前面的推理/计划文本不算数。
			return blocks.length > 0 ? blocks[blocks.length - 1].text.trim() : "";
		})();
		if (text === "") throw new Error("子代理没有产出文本");
		return text;
	} finally {
		await activation.dispose();
	}
}

/**
 * 宽容 JSON 解析：子代理输出常带解释文字、markdown 代码块、裸控制字符或未转义引号。
 * 依次尝试：直接解析 → 清理控制字符 → jsonrepair 修复 → 提取首个 {…} 片段 → 片段修复。
 */
function parseJsonLoose(raw) {
	const clean = (text) =>
		text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
	const candidates = [raw, clean(raw)];
	for (const candidate of candidates) {
		try {
			return JSON.parse(candidate);
		} catch {
			/* 继续 */
		}
	}
	for (const candidate of candidates) {
		try {
			return JSON.parse(jsonrepair(candidate));
		} catch {
			/* 继续 */
		}
	}
	const start = raw.indexOf("{");
	const end = raw.lastIndexOf("}");
	if (start >= 0 && end > start) {
		const segment = raw.slice(start, end + 1);
		for (const candidate of [segment, clean(segment)]) {
			try {
				return JSON.parse(candidate);
			} catch {
				/* 继续 */
			}
		}
		try {
			return JSON.parse(jsonrepair(segment));
		} catch {
			/* 继续 */
		}
	}
	throw new Error(
		`AI 输出不是合法 JSON（已尝试全部修复）：${raw.slice(0, 120)}`,
	);
}

// ── 演示模式 · 流水线占位产出（仅 demo 书） ────────────────────────────────

// ── 演示夹具的**叙述口径**（票 demo-flow-fidelity/03、02）────────────────────
//
// ⚠️ 这是**演示夹具的用词／结构口径**，不是产品词表（产品词表在 `src/ui/` 与 `resources/`，
//    界面判定线见 `CONTEXT.md`「界面用词表」）。它只服务这一件事：演示书里几处叙述面
//    本来各写各的字面量，改一处必漏另一处（2026-10-07 只读审计 C3/C4/C7/C8，票 03；
//    以及 C1/C2/C5 的**章数**那一半（C6 旧下限那条已随章数上下限取消而退役），票 02——
//    见下面 `DEMO_CHAPTERS`）。
//    所以下面每一处字面量都从这几个常量派生，派生面＝demoExplore / demoGateProposal /
//    demoGoldChapter / demoOutline 这四个函数。
//
// 共用判据件的期望值也从这里取（`test-demo-fixtures.mjs` import 本文件），
// 不另抄一份口径。
//
// 票 `demo-flow-fidelity/04` 再补一件：`demoExplore()` 的 `index` 要含**探查必做小节**那三节
// （名字从 `domain-rules.js` 的 `EXPLORE_ITEM_*` import，见文件头的 import 注释）。

/** 演示夹具里材料的叫法。跟**知识地图**那一侧（`materials[]` 是产物、也是给主笔看的交办文本）。 */
export const DEMO_MATERIAL_TERM = "资料";

/** 演示夹具里唯一那份源的编号（与 demoExplore 的 `materials[].num:1` 同一份，票 01 的 Q6＝甲）。 */
export const DEMO_MATERIAL_NUM = 1;

/** 「资料1」/「资料1：数的认识部分」——演示夹具里每一处 source 引用都走这一个出口。 */
export function demoMaterialRef(part) {
	const head = `${DEMO_MATERIAL_TERM}${DEMO_MATERIAL_NUM}`;
	return part === undefined || part === "" ? head : `${head}：${part}`;
}

/**
 * 演示书那份**材料判定产物**（`工作区/材料判定.json`）里的角色（票 `demo-channel-full/11`）。
 *
 * ⚠️ **一个常量、两个用途**：判定产物那一行，与合并件 `materials[]` 条目上那一格。
 * 真书上这两处的值**只有一处出处**——判定产物；机器在交工那一刻按 `num` 把它并进合并件
 * （`domain-rules.materialRoleTable()` → `knowledge-map-assembly`）。演示通道的合并件是夹具
 * **整份给的**、不走那条拼装路 ⇒ 这里用同一个常量保证两处说同一句话，
 * ⛔ 不在别处再写一份「学生用书」（改了这里两处一起动，不会有半句漂掉）。
 *
 * ⚠️ 取值必须在 `domain-rules.ROLES` 五分类里（那条硬闸会验；⛔ 别在这里另抄一份枚举）。
 */
export const DEMO_MATERIAL_ROLE = "学生用书";

/**
 * 判定产物里那一句**人读依据**（`basis`；机器不验它，但⛔ 不许编）。
 *
 * 演示通道零 LLM：这句只能说得清「这份演示夹具是什么」，⛔ 不许写成「AI 读过之后的判断」。
 */
export const DEMO_MATERIAL_BASIS =
	"演示夹具里唯一一份源，封面署名是「学生用书」（演示占位：不作真伪判断）";

/**
 * 合并件 `materials[].standing`（**材料分量声明**）那一句（票 `demo-channel-full/13`）。
 *
 * 真书上这一句由各精读小助手写在**分片**里（`工作区/knowledge-map-NN.json` 的 `materials[].standing`）、
 * 机器在交工那一刻并进合并件；演示通道的合并件是夹具**整份给的**、不走那条拼装路 ⇒ 这里用同一个常量
 * （与上面 `role`／`basis` 同一条口径：一个常量、两处说同一句话）。
 *
 * ⚠️ **如实**：演示通道零 LLM ⇒ 这句只能说得清「这份夹具是什么、以它为准的是什么、什么它不算数」，
 * ⛔ 不许写成「AI 读过之后判出来的分量」。生产那条契约的形状是「在什么问题上说了算、在什么问题上不算数」，
 * 所以这句照那个形状写（⚠️ 那一族**不设枚举**——生产不验这句话的用词，只验它在不在）。
 */
export const DEMO_MATERIAL_STANDING =
	"演示夹具里唯一一份转换稿：概念、例题与练习的说法以它为准；它不作真伪判断、也没有第二份资料可对照（演示占位）";

/**
 * 演示书的材料判定产物内容：**逐份覆盖传进来的号**（⛔ 不在夹具里写死「只有 1 份」）。
 *
 * 号由调用方按盘上事实现算（`domain-rules.okMaterialNumbers(meta.sources)`）——与真书那条硬闸
 * 「逐份覆盖转换完成的源」是同一份口径；写盘由 `engine.js` 的演示支用生产的 `writeWork` 做。
 */
export function demoMaterialJudgment(nums) {
	return {
		materials: (Array.isArray(nums) ? nums : []).map((num) => ({
			num,
			role: DEMO_MATERIAL_ROLE,
			basis: DEMO_MATERIAL_BASIS,
		})),
	};
}

/**
 * 演示书的站 3 目标（票 `confirm-points-redesign-build/05`）——**站 2 拍板之后另跑的那一趟**的产物。
 *
 * 演示通道零 LLM ⇒ 这一趟的「产出」是一份确定性夹具，与 `demoKnowledgeShard`／
 * `demoMaterialJudgment` 同一口径：名字、形状、版本规则（{@link GOAL_DOC_RE} 那一族）与真书
 * **同一份契约**，内容由这里给。
 *
 * ⚠️ **如实**：演示书上那几条不是「AI 细化出来的」——它是把这本书**建书时那句粗档目标**
 * （`meta.goal`，站 0 那一格）按标点切成几条。所以它常常只有 **2 条**，而不是提示里的 3–5 条：
 * 那正是「『3–5 条』是提示、不是硬拦」那句话的演示面，⛔ 不要为了凑数往这里补编条目。
 */
export function demoGoals(goal) {
	return String(goal ?? "")
		.split(/[，。；、]/u)
		.map((part) => part.trim())
		.filter((part) => part !== "");
}

/** 章节板块链的**唯一**顺序（关卡 2 提案标题／关卡 3 提案摘要／`styleSpec` 三处共用）。 */
export const DEMO_SECTION_STEPS = Object.freeze(["概念", "例题", "易错点", "小练习"]);

/** 板块链的箭头写法（三处逐字相同，判据按子串比对）。 */
export const DEMO_SECTION_CHAIN = DEMO_SECTION_STEPS.join(" → ");

/** 每段的分钟数——和上面同一份 steps 走，`DEMO_CHAPTER_MINUTES` 由它求和派生。 */
export const DEMO_SECTION_MINUTES = Object.freeze({
	概念: 10,
	例题: 10,
	易错点: 5,
	小练习: 15,
});

/** 一章的总时长＝各段之和（**派生**，不手写第二份数）。 */
export const DEMO_CHAPTER_MINUTES = DEMO_SECTION_STEPS.reduce(
	(sum, step) => sum + DEMO_SECTION_MINUTES[step],
	0,
);

/** 「概念（10分钟）→ 例题（10分钟）→ ……」——关卡 3 提案摘要里的分段时长那半句。 */
export function demoSectionMinutesText() {
	return DEMO_SECTION_STEPS.map((step) => `${step}（${DEMO_SECTION_MINUTES[step]}分钟）`).join(" → ");
}

/**
 * 演示书的**章级骨架**——「这本书有几章、各叫什么、各写什么」的**唯一**一份事实
 * （票 `demo-flow-fidelity/02`；2026-10-07 只读审计 C1「四处章数不同」、C2「关卡 3 列的
 * 第 3／4／5 章 乘法／除法／混合运算既不在知识地图、也不在章节安排里」）。
 *
 * 派生面（改这里，下面这几处跟着走，**别在别处再抄一份章名或章数**）：
 *   - `demoOutline().chapters`（章节安排：逐字段；`source` 仍走 `demoMaterialRef()`）
 *   - `demoExplore()` 的 `index`（落成 `工作区/explore.md`，正文那句「共 N 章」）
 *   - `demoExplore()` 的 `knowledgeMap.chapterSuggestion`（条数与章名）
 *   - `demoGateProposal(3)` 的标题（「全书 N 章」）与摘要（「第1章 … → 第N章 …」那串，
 *     以及末章自查清单那句的章号——它原先写死「第 6 章」，是同一个数的第五处写法）
 *
 * ⚠️ 有意**不**把知识地图的 `knowledgePoints[].title` 也收到这份骨架里：那是**另一处**事实，
 * `test-collab-replay.mjs` 的 `checkDemoPointsCaliber` 正是拿两边互对（`chapterSuggestion[].points`
 * 逐字命中 `knowledgePoints[].title`）。两边同源＝判据变成自证（`dev-gate-scan/17` 那个病）。
 * 今天两边的字面量恰好相同——那是这条判据要**守着**的，不是要**抹平**的。
 */
export const DEMO_CHAPTERS = Object.freeze([
	Object.freeze({
		title: "数的认识",
		outline: "什么是数、数的读写、大小比较",
		sourcePart: "数的认识部分",
		targetWords: 4000,
	}),
	Object.freeze({
		title: "加减法",
		outline: "不进位/进位加法、不退位/退位减法",
		sourcePart: "加减法部分",
		targetWords: 5000,
	}),
	Object.freeze({
		title: "应用题综合",
		outline: "读懂题意、分步列式、检查答案",
		sourcePart: "应用题部分",
		targetWords: 6000,
	}),
]);

/** 演示书的章数——**派生**自 `DEMO_CHAPTERS`，不手写第二份数（票 01 裁决：骨架维持 3 章）。 */
export const DEMO_CHAPTER_COUNT = DEMO_CHAPTERS.length;

/** 「第1章 数的认识 → 第2章 加减法 → …」——关卡 3 提案摘要里那串章名（派生自 `DEMO_CHAPTERS`）。 */
export function demoChapterChainText() {
	return DEMO_CHAPTERS.map((chapter, index) => `第${index + 1}章 ${chapter.title}`).join(" → ");
}

/**
 * 演示书自带的一条**抽查意见**（票 `demo-channel-full/06`）。
 *
 * ## 为什么演示书要自带一条
 *
 * 「抽查意见」（`meta.pendingReviews`）在真书上是**用户**在章卡上写的（`src/workflow/actions/chapters.js` 的
 * `case 'review'`），由**主笔 AI**在交工那一跳按 `handledReviews` 逐条点名销号（`status:'applied'` ＋ `how`）。
 * 演示通道没有主笔 AI ⇒ 用户自己写的那条**永远停在「未处置」**，卡上「已处置 · <怎么处置的>」与同一行那颗
 * **「翻案」**键在演示书上到不了（那一族的另一半就缺席了）。这一条把那一格补上：它**落在已处置那一档**，
 * 于是「翻案」真能点（`review-revoke` 把它写回 `pending`，那一章因此**真的**重新被拦）。
 *
 * ⚠️ 三条纪律：
 *   · 正文带 {@link DEMO_MARK} ＋ 一句「不是你提的」——⛔ 不许让屏上那句「你在这一章提的意见」冒充用户的话；
 *   · `how` **如实**写它是占位处置（演示通道没有真 AI 改稿）——⛔ 不许写「AI 已按意见修订」这种假话；
 *   · 章号从 {@link DEMO_CHAPTERS} 的**下标**派生（⛔ 不写死「第 1 章」）。
 */
export const DEMO_CHAPTER_REVIEWS = Object.freeze([
	Object.freeze({
		chapterIndex: 0,
		comment: "例题要是能再多一道就好了。",
		how: "演示通道占位处置：这条示例意见按占位收下（这里没有真 AI 改稿，它不拦这一章交工）。",
	}),
]);

/**
 * 上面那张表 → 账本形状的 `meta.pendingReviews` 条目。
 *
 * `origin:'demo'` 是「这一条不是用户写的」那个字段：卡片按它换一句如实的小标题
 * （见 `src/ui/chapters-map.js`）。⚠️ 它**只**出现在演示通道注入的那几条上，真书那一侧一个字节不变。
 */
export function demoChapterReviews() {
	return DEMO_CHAPTER_REVIEWS.map((row, index) => ({
		id: `pr-demo-${index + 1}`,
		chapter: row.chapterIndex + 1,
		comment: `${DEMO_MARK}（演示通道自带的示例意见，不是你提的）${row.comment}`,
		status: "applied",
		how: row.how,
		origin: "demo",
	}));
}

/**
 * 演示书自带的一条**段落级**抽查意见（票 `demo-channel-full/15`）——「抽查意见」这一族的**另一半**。
 *
 * ## 为什么票 06 那一半不够
 *
 * 票 06 补的是**整章**意见（带 `comment` 的那一族：`meta.pendingReviews` 里 `kind == null` 的那些）。
 * 段落级的那一族**另有一副脸**：真书上用户在「全章过目」那一段把鼠标停在某一章正文的某一段上，
 * 点旁那三键（😕／🗑／✏️）⇒ 意见带 `kind` ＋ `target{para,hint}` 落进 `pendingReviews` ⇒
 * **正文装订线上标出 `#N ✏️`**（`src/ui/gold-table.js` 的 `marked`）、意见列表里也一行。
 *
 * ⚠️ 演示书上**用户自己**提的那条走不到这里，那是**有意的**（`test-collab-backend.mjs` 的
 * 「demo 作用域（红线）」正断着「demo 书过目态带 chapter ⇒ 409」；豁免 `gold-chapter-opinions` 就是它的登记）
 * ⇒ 这一格要「在场」，只能由**演示书自带的示例**补：它落在**已处置**那一档，于是
 * 段落标记、那一行「已处置 · <怎么处置的>」、同行那颗**「翻案」**、以及段旁那颗键的**再点＝撤回**
 * 在演示书上**都真的存在、真的点得动**。
 *
 * ⚠️ 三条纪律（与上面那张整章意见表同一份）：
 *   · 正文带 {@link DEMO_MARK} ＋ 一句「不是你提的」——⛔ 不许让屏上那句「你在这一章提的意见」冒充用户的话；
 *   · `how`／`wish` **如实**写它是占位（演示通道零 LLM、没有 AI 照段落意见改稿）——⛔ 不许写「AI 已按意见修订」；
 *   · `section` 指**板块链**里的一节（{@link DEMO_SECTION_STEPS}），段号由下面那个函数**现算**——⛔ 不写死段号。
 */
export const DEMO_CHAPTER_OPINIONS = Object.freeze([
	Object.freeze({
		chapterIndex: 0,
		section: "例题",
		kind: "change",
		wish: "例题要是能再来一道由浅入深的，孩子能自己跟着做。",
		how: "演示通道占位处置：这条示例段落意见按占位收下（这里没有真 AI 照段落意见改稿，它不拦这一章交工）。",
	}),
]);

/**
 * 上面那张表 → `meta.pendingReviews` 的**段落级**条目（形状引**生产那一份出口**
 * `workflow/engine/labels.js` 的 `paragraphOpinion`，⛔ 不在这里手抄第二份）。
 *
 * `at` 由**调用方**传（照票 10 的口径：⛔ 不在夹具里编一个时间）。
 *
 * ⚠️ **段号（`target.para`）与正文排版的耦合**：第 1 段是 `DEMO_MARK` ＋ 章标题那一行，
 * 正文四节各占一段、顺序与 {@link DEMO_SECTION_STEPS} 一致（生成侧两份模板：本文件的
 * `demoChapterOne` 与 `demoChapterWrite`）⇒ `para = 节下标 + 2`。
 * ⚠️ 这份耦合**有链上判据**接住：`test-flow-transitions-chapters.mjs` 的 G6 用**界面自己那份切段**
 * （`src/ui/rules.js` 的 `splitParagraphs`）读**真落盘**的章正文，断「这一段就是那一节」——
 * 排版一变，那一格当场红（本票有意不让它静默降级成「标到别的段上」）。
 * 那一节在链里找不到 ⇒ **当场抛**（缺一条标不到段上的意见＝屏上什么都看不见，⛔ 不许静默）。
 */
export function demoChapterOpinions(at) {
	return DEMO_CHAPTER_OPINIONS.map((row, index) => {
		const sectionIndex = DEMO_SECTION_STEPS.indexOf(row.section);
		if (sectionIndex < 0) {
			throw new Error(
				`演示内容接缝：板块链里没有「${row.section}」这一节（DEMO_SECTION_STEPS = ${DEMO_SECTION_STEPS.join("、")}）——`
				+ `段落意见的 target.para 会标到一段不存在的地方，屏上什么都看不见`,
			);
		}
		return {
			...paragraphOpinion({
				id: `pr-demo-opinion-${index + 1}`,
				at,
				chapter: row.chapterIndex + 1,
				target: { para: sectionIndex + 2, hint: row.section },
				kind: row.kind,
				wish: `${DEMO_MARK}（演示通道自带的示例段落意见，不是你提的）${row.wish}`,
			}),
			// 已处置那一档的形状与真书**同一处**：真书上它由主笔 AI 在交工那一跳按 `handledReviews` 写
			// （`actions/chapters.js` 的 `review.status = 'applied'` ＋ `review.how = …`）——演示通道没有 AI，
			// 所以这里给一条**占位**处置，`how` 逐字写明是占位（⛔ 不许写「AI 已按意见修订」）。
			status: "applied",
			how: row.how,
			origin: "demo",
		};
	});
}

/**
 * 演示书自带的**示例留言**（票 `demo-channel-full/10`）。
 *
 * 病：演示通道没有用户留言 ⇒ `meta.pendingInterventions` 恒空 ⇒ 顶栏那颗 `📮 留言(N)`
 * （`src/ui/panels.js` 的 `TopBar` 只在 `pendingCount > 0` 时渲染）与 `IntervenePanel` 在演示书上
 * **到不了**；而真书那一族是**契约**：`stage-submit(final)` 那一跳「留言必须先销号」。
 *
 * ⚠️ 三条纪律（与上面那张抽查意见表同一份）：
 *   · 正文带 {@link DEMO_MARK} ＋ 一句「不是你写的」——⛔ 不许让屏上那句「你的留言」冒充用户的话；
 *   · 销号由**演示支自己那一趟**在终检那一刻做（演示通道没有主笔 AI），⛔ 别写成用户点的；
 *   · `at` 由**调用方**传（⛔ 不在这里编一个时间）。
 */
export const DEMO_INTERVENTIONS = Object.freeze([
	Object.freeze({
		id: "iv-demo-1",
		text: "第2章的例题请换一道更贴近生活的。",
		target: "第2章",
	}),
]);

/** 上面那张表 → `meta.pendingInterventions` 的条目形状（真书那一份由 `intervene` 动作写）。 */
export function demoInterventions(at) {
	return DEMO_INTERVENTIONS.map((row) => ({
		id: row.id,
		at,
		text: `${DEMO_MARK}（演示通道自带的示例留言，不是你写的）${row.text}`,
		target: row.target,
		status: "pending",
	}));
}

/** 那几条示例留言的 id——终检那一刻销号**只销这几条**（⛔ 别在别处再拼一遍 id，也⛔ 别连用户写的那些一起销）。 */
export const DEMO_INTERVENTION_IDS = Object.freeze(DEMO_INTERVENTIONS.map((row) => row.id));

/**
 * 演示书自带的**示例风格线**（票 `demo-channel-full/10`），**连同它终检那一刻的去向**。
 *
 * ## 为什么「风格线」与「它的去向」写在**一张表**里
 *
 * 去向（`adopted`／`conflict`／`superseded` 三档）不是另一件事，它是**这一条风格线自己的账**：
 * 两处各写一份字面量，改一处漏一处，屏上就会出现「一条没有出处的风格线」或「一条没有对应风格线的去向」，
 * 而演示书**没有闸接得住它**（真书那两道门在 `stage-submit(final)` 那一跳，演示书从不经它）。
 * ⇒ 这里只写**一张**表，两个出口从它派生：
 *   - `demoStyleNotes(at)` → `meta.styleNotes` 的条目（三条都 `active`，正是顶栏那颗 🎨 键出现的条件）；
 *   - `demoStyleDisposals()` → 终检那一刻逐条交代的**去向**（形状与真书 `styleCheck` 的条目一致）。
 *
 * ⚠️ 三条纪律：
 *   · 正文带 {@link DEMO_MARK} ＋ 一句「不是你提的」；
 *   · 去向**如实**写它是演示占位（⛔ 不写「AI 已照这条改稿」这种假话）；
 *   · `conflict` 那一条的冲突理由必须**在盘上说得通**（下面那条与「每章必含 小练习」的板块链冲突，
 *     板块链的唯一出处是 {@link DEMO_SECTION_STEPS}）——⛔ 不编一个查不到的冲突。
 */
export const DEMO_STYLE_NOTES = Object.freeze([
	Object.freeze({
		id: "sn-demo-1",
		text: "每章的小练习后面请直接给出答案。",
		disposal: Object.freeze({
			status: "adopted",
			note: "演示占位去向：示例章的正文里小练习确实带着答案，按占位记为已落实",
		}),
	}),
	Object.freeze({
		id: "sn-demo-2",
		text: "每章别写小练习了，正文短一点更好看。",
		disposal: Object.freeze({
			status: "conflict",
			note: `与「每章必含 ${DEMO_SECTION_STEPS[DEMO_SECTION_STEPS.length - 1]}」那条板块链冲突（演示占位：未改稿）`,
		}),
	}),
	Object.freeze({
		id: "sn-demo-3",
		text: "先写成大白话，之后再润色。",
		disposal: Object.freeze({
			status: "superseded",
			note: "演示占位去向：这条示例要求按占位记为已不再适用",
		}),
	}),
]);

/** 上面那张表 → `meta.styleNotes` 的条目形状（真书那一份由 `style-note` 动作写）。 */
export function demoStyleNotes(at) {
	return DEMO_STYLE_NOTES.map((row) => ({
		id: row.id,
		text: `${DEMO_MARK}（演示通道自带的示例风格线，不是你提的）${row.text}`,
		at,
		source: "ui",
		status: "active",
	}));
}

/** 上面那张表 → 终检那一刻逐条交代的**去向**（`{id,status,note}`，与真书 `styleCheck` 的条目同形）。 */
export function demoStyleDisposals() {
	return DEMO_STYLE_NOTES.map((row) => ({ id: row.id, status: row.disposal.status, note: row.disposal.note }));
}

/**
 * 演示书的**知识点与图上那些卡**的同一份事实源（票 `demo-channel-full/01`）。
 *
 * ## 为什么知识点与卡写在**一张表**里
 *
 * 图上的卡是知识点的 **1:1 派生**——生产那道图闸按 `cards[].name` 逐字等于
 * `knowledgePoints[].title` 判（`src/workflow/knowledge-map-gate.js` 的 `bijectionProblems`）。
 * 两处各写一份字面量，改标题时漏改一处，就会以「双射被拆开」的形状回到盘上；而演示书
 * **没有闸接得住它**（图闸对「没有图键」的书走老书那一档，照旧放行，见
 * `src/ui/machine-product-folds.js` 的 `knowledgeGraphOf`）。⇒ 这里只写**一张**表：
 *   - `demoKnowledgePoints()` → 合并件的 `knowledgePoints`；
 *   - `demoKnowledgeCards()` → 图上的卡（`key` 走**生产**那条 `knowledgeCardKey()`，不手抄键格式）。
 * 边是**另一件事**（关系不是实体），所以它单列一张表（`DEMO_GRAPH_EDGES`），
 * 但两端只引用上表的**下标**，既不抄卡名也不抄 key。
 *
 * ⚠️ **如实记**：演示书盘上**没有转换稿**（`ADR-0004` 与豁免 `phase1-no-real-conversion`），
 * 所以每张卡的 `anchor` 只满足**形状**（1 基行号区间、`start ≤ end`、项间不重叠且升序），
 * 它**对不上任何原文**——真实书里那一格由产图脚本按转换稿的小节点名解析后写死行段。
 * ⛔ 别把这份锚当成「锚被校验过」的证据。
 */
export const DEMO_KNOWLEDGE = Object.freeze([
	Object.freeze({
		title: "数的认识",
		sourcePart: "数的认识",
		summary: "数与运算的基础概念",
		// 票 `pipeline-wiring-gaps/06`：difficulty 有登记取值域（domain-rules
		// 的 KNOWLEDGE_POINT_DIFFICULTY：基础/重点/难点/进阶）——夹具原写「低」是出域值
		// （只靠界面兜底灰兜着），改成域内值；顺带给「重点」「难点」两格补知识地图语境样本
		//（原先这两格全仓零样本，钉在 test-knowledge-difficulty.mjs）。
		difficulty: "基础",
		testable: "能用自己的话说出「数」是什么，并把一组数按大小排好",
		anchor: Object.freeze([Object.freeze({ start: 1, end: 4 })]),
		confidence: "强",
	}),
	Object.freeze({
		title: "加减法",
		sourcePart: "加减法",
		summary: "不进位/进位加法、不退位/退位减法",
		difficulty: "重点",
		testable: "能算对两位数以内的进位加法与退位减法，并说清每一步在做什么",
		anchor: Object.freeze([Object.freeze({ start: 5, end: 9 })]),
		confidence: "强",
	}),
	Object.freeze({
		title: "应用题综合",
		sourcePart: "应用题",
		summary: "读懂题意、分步列式、检查答案",
		difficulty: "难点",
		// 三张卡走两档把握档：`强` 两张、`中` 一张——演示书上看得出「把握档是分档的」这件事。
		testable: "能读懂一段情境、分步列式并回代检查答案是否说得通",
		anchor: Object.freeze([Object.freeze({ start: 10, end: 14 })]),
		confidence: "中",
	}),
]);

/**
 * 图上的边（生产那一路由精读小助手产边、机器拼装并做**传递约简**——存量画的就是约简后的图）。
 * 两端只写 {@link DEMO_KNOWLEDGE} 的**下标（1 基）**。
 *
 * ⚠️ 两条 `prereq` 连成 `1 → 2 → 3` 的链，**不补** `1 → 3` 的 `prereq`——那一条正是传递约简要删掉的；
 * 另有一条 `see-also` 走另一套线型，顺带让「链高亮只走 `prereq`」这件事在演示书上也看得见
 *（`CONTEXT.md`「有向无环（DAG）」：`alias`／`see-also` 不在无环的作用域内）。
 */
export const DEMO_GRAPH_EDGES = Object.freeze([
	Object.freeze({ from: 1, to: 2, kind: "prereq", confidence: "强", reason: "先认数、再谈加减——不认数就读不懂算式" }),
	Object.freeze({ from: 2, to: 3, kind: "prereq", confidence: "中", reason: "会算加减，才谈得上分步列式解应用题" }),
	Object.freeze({ from: 1, to: 3, kind: "see-also", confidence: "待核", reason: "同一批生活情境里，数与运算反复一起出现" }),
]);

/** 合并件的 `knowledgePoints`：派生自 {@link DEMO_KNOWLEDGE}（**别在别处再写一份标题**）。 */
function demoKnowledgePoints() {
	return DEMO_KNOWLEDGE.map((item, index) => ({
		id: `kp-${index + 1}`,
		title: item.title,
		source: demoMaterialRef(item.sourcePart),
		summary: item.summary,
		difficulty: item.difficulty,
	}));
}

/** 图上的卡：与知识点**同一张表**派生（`name` 逐字等于 `title`），键走生产的 `knowledgeCardKey()`。 */
function demoKnowledgeCards() {
	return DEMO_KNOWLEDGE.map((item, index) => ({
		key: knowledgeCardKey({ material: DEMO_MATERIAL_NUM, group: 1, index: index + 1 }),
		name: item.title,
		testable: item.testable,
		// 拷一份再交出去：交出去的那份是可变的（下游会 JSON.stringify 它），常量表保持冻结。
		anchor: item.anchor.map((span) => ({ start: span.start, end: span.end })),
		confidence: item.confidence,
	}));
}

/** 边：两端按下标取 {@link demoKnowledgeCards} 的 key（⛔ 不在这里另生成一套键）。 */
function demoKnowledgeEdges() {
	const keys = demoKnowledgeCards().map((card) => card.key);
	return DEMO_GRAPH_EDGES.map((edge) => ({
		from: keys[edge.from - 1],
		to: keys[edge.to - 1],
		kind: edge.kind,
		confidence: edge.confidence,
		reason: edge.reason,
	}));
}

/**
 * 演示书那份**知识地图分片**（`工作区/knowledge-map-NN.json`，票 `demo-channel-full/12`）。
 *
 * ## 病与它治的方式
 *
 * 真书上这一族是**每份转换完成的材料一片**：那一路精读小助手自己落盘，机器在交工那一刻按这些片拼成
 * 合并件（`src/workflow/knowledge-map-assembly.js` 的 `expectedKnowledgeMap`）。演示通道原先**没有分片**——
 * 合并件是下面 `demoExplore()` 手写的一整份、由演示支一步写好 ⇒ `exploreArtifactProblems` 里那条
 * 「每份材料各有一片」对演示书整条分叉掉（豁免 `explore-artifact-shards`）。本函数把那一格补上，
 * 分叉随之拆掉：**盘上那几片成了合并件的真输入**。
 *
 * ## 三条纪律（缺一条就变成「摆一个说得通的样子」）
 *
 *  1. **逐份覆盖传进来的号**（⛔ 不在夹具里写死「只有 1 份」）——号由调用方按盘上事实现算
 *     （`domain-rules.okMaterialNumbers(meta.sources)`），与生产那条硬闸同一份口径。
 *  2. **`materials[]` 条目上⛔ 不写 `role`／`basis`**：那两格的唯一住处是 `工作区/材料判定.json`，
 *     真书上机器在拼装那一刻按 `num` 把它们并进去（`expectedBlockFor` 的第三个输入）。夹具若自己
 *     也写一份，就是**同一个事实的第二处住处**——正是票 11 花力气拆掉的那种病。
 *  3. **形状过生产的 `shardShapeProblems`**：`knowledgePoints` 必须是数组（那是它唯一的必交项）。
 *     `cards`／`edges` 两键**每片都要有**（契约二：「一条边都没判出来时写空数组，⛔ 不许省掉这个键」）。
 *
 * ## ⚠️ 如实（与 {@link DEMO_KNOWLEDGE} 那一段同一条）
 *
 * 演示通道零 LLM、盘上也没有转换稿（豁免 `phase1-no-real-conversion`）：这一片的 `cards[].anchor`
 * 只满足**形状**（1 基行号区间），**对不上任何原文**。⛔ 别把这份分片读成「材料真被精读过」。
 *
 * @param {number[]} nums 材料号（`okMaterialNumbers(meta.sources)` 的返回值）
 * @returns {{num: number, materials: object[], knowledgePoints: object[], cards: object[], edges: object[]}|null}
 *   `nums` 为空（零源书）时返回 `null`——**凭空造一片就是假话**（那条硬闸对零源书同样不要求分片）。
 */
export function demoKnowledgeShard(nums) {
	const list = Array.isArray(nums) ? nums : [];
	if (list.length === 0) return null;
	// ⚠️ 演示通道今天只有一份材料（`okMaterialNumbers` 会给 [1]），但它**不写死**这一点：
	// 每一号各一行 `materials`、各有一个号；片的内容按同一张 `DEMO_KNOWLEDGE` 派生。
	return {
		// `num` 是分片自己的身份键（不进合并件）：取第一号，写盘时由调用方按号命名。
		num: list[0],
		materials: list.map((num) => ({
			num,
			// 票 `demo-channel-full/13`：分量声明那一句住在常量里（真书上它来自本片自己的 `materials[]`）。
			standing: DEMO_MATERIAL_STANDING,
			sections: [
				{
					title: "数的认识",
					summary: "数与运算的基础概念",
					keywords: ["数", "运算"],
				},
			],
		})),
		// 知识点／卡／边与合并件、图上那两处**同一张表**派生（见上面 `DEMO_KNOWLEDGE` 那一段的注释）。
		knowledgePoints: demoKnowledgePoints(),
		cards: demoKnowledgeCards(),
		edges: demoKnowledgeEdges(),
	};
}

/**
 * 细目那四段的**标题**（派发契约一：结构骨架／角色与权威层级／知识点细目／教学线索与坑）。
 *
 * ⚠️ 这是**演示占位**的排版，不是机器会验的契约——真书上那份细目同样只有「在不在、非不非空」那层判据
 * （「至少四段」那一条**全仓没有机器闸门**，真书也一样）。它导出是给判据用的：判据若只会
 * 「文件在不在」，那么「把这份细目清空」这条反证就咬不住（一份空文件照样 existsSync 为真）。
 */
export const DEMO_READING_SECTIONS = Object.freeze([
	"结构骨架",
	"角色与权威层级",
	"知识点细目",
	"教学线索与坑",
]);

/**
 * 演示书那份**精读细目**（`工作区/细目/精读-NN.md`，票 `demo-channel-full/12`）。
 *
 * 真书上这是那一路精读小助手的**主产物**（派发契约一：至少四段——结构骨架／角色与权威层级／
 * 知识点细目／教学线索与坑）；演示通道没有「精读小助手」这回事 ⇒ 这份只能是**占位**。
 *
 * ## ⚠️ 如实（本票最要紧的一条纪律）
 *
 * 演示通道零 LLM：这份细目**不是**「AI 读完了这份材料」的结论。所以逐段写的都是
 * 「真书上这一节由那个精读小助手写 ＋ 演示通道不做这一步 ＋ 为什么」，而不是编一篇像样的细读笔记
 * （照票 11 的 `basis`／票 13 的 `standing`／票 19 的那五节同一路数：**没做的那一步就写清没做**）。
 * 唯一的例外是第 3 段：它列的是 `DEMO_KNOWLEDGE` 那张表里**演示夹具真声明过**的三条知识点
 * （表格形状按契约，读数是演示通道自己的）。
 *
 * @param {number[]} nums 材料号（`okMaterialNumbers(meta.sources)` 的返回值）
 * @returns {{num: number, text: string}|null} `nums` 为空时返回 `null`（零源书没有细目可写）
 */
export function demoReading(nums) {
	const list = Array.isArray(nums) ? nums : [];
	if (list.length === 0) return null;
	const num = list[0];
	const rows = DEMO_KNOWLEDGE.map((item, index) => `| ${index + 1} | ${item.title} | ${item.summary} | ${item.difficulty} | 见上一节 |`);
	const text = `${DEMO_MARK}
# 精读细目 · 第 ${num} 份材料（演示）

> 这一份由**演示通道**生成（零 LLM、确定性）：**不是**某个精读小助手读完材料的摘录，
> 而是按真书那份细目的**同一套段落形制**（派发契约一：至少四段）落的一份**占位**。
> 真书上这一份由那一路精读小助手落盘（**细目那一族**，每份材料一份），主笔不用转写。
> ⚠️ 演示通道没有「精读小助手」这一步，所以下面每一段都如实写着**演示不做这一步**。
> ⚠️ 两份落盘件（本份细目 ＋ 同号的**知识地图分片**）的路径一律引 \`domain-rules\` 的出口
> （\`readingRel\`／\`readingName\`／\`knowledgeShardRel\`／\`knowledgeShardName\`），⛔ 不在这里手写第二份。

## ${DEMO_READING_SECTIONS[0]}

真书上这一段写的是：这份材料有哪几级标题、每一节讲什么（逐节一两句）。
**演示通道不做这一步**——它零 LLM、盘上也没有转换稿（豁免 \`phase1-no-real-conversion\`），
没有可读的原文；下面三节里能给的只有演示夹具自己声明过的那点东西。

## ${DEMO_READING_SECTIONS[1]}

真书上这一段写的是：这份材料是教材／讲义／习题／补充材料里的哪一种，与其他材料冲突时它算不算权威。
**演示通道不做这一步**——它的角色声明是一次**占位判定**（住在工作区根那份材料判定产物里，
逐份一个 \`role\` ＋ 一句 \`basis\`），结论照旧进合并件的 \`materials[]\`，
但那份判定**没有读过材料**（零 LLM）。

## ${DEMO_READING_SECTIONS[2]}

真书上这一段是**逐条知识点细目**（标题 ＋ 一句话摘要 ＋ 难度初判 ＋ 出自哪一节）。
演示通道给的是它自己那张夹具表（${DEMO_KNOWLEDGE.length} 条，与合并件 \`knowledgePoints\`／图上的卡**同一处出处**）：

| # | 知识点 | 一句话摘要 | 难度初判 | 出自哪一节 |
| --- | --- | --- | --- | --- |
${rows.join("\n")}

⚠️ 「出自哪一节」那一列演示通道给不出：盘上没有转换稿，所以每条只写「见上一节」，
⛔ 不编一个看起来像真的小节名。

## ${DEMO_READING_SECTIONS[3]}

真书上这一段写的是：密度高的地方、易混点、可直接拿来做例题／练习的素材。
**演示通道不做这一步**——它不读材料，也就没有「哪里密、哪里易错」这种读数。
`;
	return { num, text };
}

/**
 * 演示书那份**合并件**（`工作区/knowledge-map.json`，票 `demo-channel-full/12`）。
 *
 * 真书上它不是谁写出来的，而是**算出来的**：机器在交工那一刻按
 * `knowledge-map-assembly.expectedKnowledgeMap(各片, 书级键, 角色表)` 把盘上那几片拼成一份
 * （各片在前、书级键在后、材料判定的 `num → {role, basis}` 表按分片号并进 `materials[]`）。
 * 票 12 之前演示支是**手写一整份**，盘上那几片与它没有任何关系；本函数把「演示那一份片 ＋ 那几件书级
 * ＋ 那张角色表」喂给**同一段生产拼装** ⇒ 合并件与盘上那几片**同一处出处**。
 *
 * ## ⚠️ 为什么这个出口要放在这里（而不是让调用方各拼一遍）
 *
 * 它有三个调用点：**演示支**（`engine.js` 的 `runPhase2`，写盘那一份）与**判据**（两处要拿「演示通道
 * 本该产出的合并件」当输入：组件渲染那一格与图那一族）。三处各写一遍「喂哪几个键、按什么顺序」＝
 * 第三、第四份会各自漂的量法——本仓反复治的病。所以拼装**本身**仍归 `knowledge-map-assembly`
 * （⛔ 这里不重写一份拼法），这个函数只做「演示这一份的输入从哪来」那一步。
 *
 * ## ⚠️ 如实记的窄处
 *
 *  · 上面的 `expectedKnowledgeMap` 用的是**静态** import——`content-lib.js` 是**前后端共用**的
 *    （前端 bundle 也打它）。今天这个口径成立（前端也 import `domain-rules`）；
 *    若哪天 `knowledge-map-assembly.js` 长出对 `node:fs` 一类宿主 API 的依赖，这条 import 就得改。
 *  · `role`／`basis` 那一格**照旧**由角色表并进来（本函数第二个输入），所以它**不是**第二个住处：
 *    内容仍住在 `工作区/材料判定.json`。
 *
 * @param {number[]} nums 材料号（`okMaterialNumbers(meta.sources)` 的返回值）
 * @param {{role: string, basis?: string}} [roleCell] 第 `nums[0]` 号那份材料的角色格（省略＝不并角色）
 * @returns {object|null} `nums` 为空（零源书）时返回 `null`
 */
export function demoMergedKnowledgeMap(nums, roleCell) {
	const shard = demoKnowledgeShard(nums);
	if (shard === null) return null;
	// 书级键：`teachingFocus`／`chapterSuggestion` 是**逐字搬运族**（机器一个字不改）；
	// `edges` 是**拼接族**且**书级那一端为空**（演示书那三条边都写在分片里——生产把它接在分片那份
	// **后面**，这里给成三条就会变成「多印了一遍」）。它们都取自 {@link demoExplore} 交的那一份，
	// ⛔ 不在这里再写一遍。
	const explore = demoExplore();
	return expectedKnowledgeMap(
		[{ n: shard.num, map: shard }],
		explore.bookLevel,
		roleCell === undefined || roleCell === null ? null : new Map([[shard.num, roleCell]]),
	);
}

/**
 * 演示书交上去的**书级键**（逐字搬运族两件 ＋ 拼接族 `edges`／`readerSlices`）——`demoExplore()` 与
 * {@link demoMergedKnowledgeMap} **同一处出处**（⛔ 不写第二份：两处各写一份就会漂）。
 *
 * - `teachingFocus`／`chapterSuggestion`：**逐字搬运族**（机器一个字不改，只搬进合并件）；
 * - `edges`：**拼接族**，且**书级这一端是空的**——演示书那三条边都写在分片里，
 *   生产把它接在分片那份**后面**（这里给成三条就会变成「多印了一遍」）。
 * - `readerSlices`（票 `reader-cognition-boundary-build/01`）：**拼接族**的第 2 个键（书的「片」，
 *   读者情况问卷外层的作答单位）——演示书只有三张卡，按**读者语域**切成两片（认数/加减法 vs
 *   应用题）；成员从 {@link DEMO_KNOWLEDGE} 派生（⛔ 不在别处再写一份标题）。
 *   ⚠️ 这是**演示夹具的片**，不是真让 AI 分过的语域（零 LLM）——它只证明「生产那一段拼装会在场」。
 */
function demoBookLevel() {
	return {
		teachingFocus: ["重点：概念清晰", "难点：应用题理解"],
		// 票 demo-flow-fidelity/02：原先只有 1 条（审计 C5：知识点 3 条、outline 3 章，
		// 这里只建议 1 章）。补齐到与 `DEMO_CHAPTERS` 同构的 3 条：条数与章名都从那份骨架派生，
		// 不再手写第二份章名清单。⚠️ 2026-10-27 起章数上下限都不判（`stage3-hard-limits/02`，
		// 1 章也合法），3 章仍是演示骨架的有意取值，与真实书的章数政策无关。
		// `points` 走票 01 的 **title 单键口径**——这里写的是 `DEMO_CHAPTERS[].title`，
		// 它是否逐字命中 `knowledgePoints[].title` 由回放测试逐条互对（有意不在这里同源）。
		// 票 pipeline-wiring-gaps/14：`points` 每一项逐字命中 `knowledgePoints[].title`
		//（id 留在 knowledgePoints 上，但不接进比对环；把 points 写成 id 会被 `test-collab-replay`
		// 的 points 口径判据点名）。
		chapterSuggestion: DEMO_CHAPTERS.map((chapter) => ({
			title: chapter.title,
			source: demoMaterialRef(),
			points: [chapter.title],
		})),
		edges: [],
		// 票 `reader-cognition-boundary-build/01`：片的形状＝`[{name, description?, members:[知识点 title]}]`；
		// 成员**从 DEMO_KNOWLEDGE 派生**（`title` 口径与剔除记录同一身份，⛔ 不是 kp.id）。
		readerSlices: [
			{
				name: "认数和加减法",
				description: "先弄懂数是什么、怎么比大小，再学进位加法和退位减法",
				members: DEMO_KNOWLEDGE.slice(0, 2).map((item) => item.title),
			},
			{
				name: "解应用题",
				description: "读懂题目、分步列式，把答案代回去检查",
				members: DEMO_KNOWLEDGE.slice(2).map((item) => item.title),
			},
		],
	};
}

function demoExplore() {
	return {
		index: `${DEMO_MARK}
# 源材料索引（演示）

## 材料清单
- 《示例教材》全文（由 MinerU 转换的 Markdown）

## ${EXPLORE_ITEM_CODE_TABLE}
- ${String(DEMO_MATERIAL_NUM).padStart(2, "0")} ＝《示例教材》（学生用书）：本报告唯一一份源，正文按"概念 → 例题 → 练习"组织，权威层级最高。

## ${EXPLORE_ITEM_TRUTH_CALIBRATION}
- 本报告是**演示占位**：数值与结论都不作真伪判断，也不代表真翻过源文件。真实书里这一节写的是"哪些说法只是转述、哪些在源里有出处"。

## 结构观察
1. 全书按"概念 → 例题 → 练习"组织，共 ${DEMO_CHAPTER_COUNT} 章。
2. 权威层级：教材正文 > 例题 > 练习。
3. 角色标签：学生用书（正文）、教师用书（讲解提示）。

## 教学线索
- 知识点密度中等，公式较少。
- 每章末有小结与习题，适合直接复用为"自查清单"。

## ${EXPLORE_ITEM_COMMON_ANCHORS}
- 贯穿案例"小明学数学"跨全书各章复用；每章按"${DEMO_SECTION_CHAIN}"四段式组织（板块链与关卡提案同一份口径）。
`,
		// ── 票 `demo-channel-full/12`：这里交的是**一片分片**，不是合并件 ────────────────────
		//
		// 真书上合并件是机器按各片拼出来的（`src/workflow/knowledge-map-assembly.js` 的
		// `expectedKnowledgeMap(各片, 书级键, 角色表)`）：盘上那几片**在前**、主笔交的书级键**在后**、
		// 材料判定那张 `num → {role, basis}` 表按分片号并进 `materials[]`。演示支因此**不再**手写一份合并件，
		// 而是把这一片写盘、再用生产那一段算出合并件 ⇒ 盘上那几片是它的**真输入**，
		// 「分片／细目」那两条就绪判据对演示书也不再需要分叉（豁免随之关闭）。
		// ⚠️ 形状与内容仍与从前**逐字一致**：`materials`（不含 `role`／`basis`——那两格由角色表并进来）、
		// `knowledgePoints`／`cards`／`edges` 都还是 `DEMO_KNOWLEDGE` 那一张表的派生。
		shard: demoKnowledgeShard([DEMO_MATERIAL_NUM]),
		// 书级键（**逐字搬运族**：机器一个字不改，只搬）＋ 图与片那两条**拼接族**的键。
		// 票 `demo-channel-full/01`：图的两个键——**要么都在、要么都不在**（生产那条口径见
		// `src/ui/machine-product-folds.js` 的 `knowledgeGraphOf`）。演示书今天是有图的书：
		// 探查确认卡上那块只读图会画出来，图上那两下走 `graph-opinion`（第三条「意见」通路）。
		// ⚠️ 内容住在 {@link demoBookLevel}（与 {@link demoMergedKnowledgeMap} 同一处出处）。
		bookLevel: demoBookLevel(),
	};
}

function demoGateProposal(_runtime, params) {
	const { gate, version } = params;
	const base = {
		1: {
			title: "AI 提议：先明确这本书要让学习者学会什么",
			summary:
				'这本书的目标是：学完能独立做对教材配套的基础题，并说出每个概念"是什么、为什么、怎么用"。\n最大难点：概念记住了但不会用，例题看得懂、变个形式就不会。',
		},
		2: {
			title: `AI 提议：用"${DEMO_SECTION_CHAIN}"的固定板块`,
			summary:
				'每章按四段式组织：先讲清概念（配生活例子），再给 2-3 个由浅入深的例题，然后专门讲"最容易错的地方"，最后放 5 道小练习（带答案）。\n叙述上用一个"小明学数学"的贯穿案例串起全书，降低理解门槛。',
		},
		3: {
			// 票 demo-flow-fidelity/02：章数与章名串从 `DEMO_CHAPTERS` 派生（原先写死「6 章」＋
			// 「第3／4／5章 乘法／除法／混合运算」六章，而章节安排只有 3 章，审计 C1／C2）。
			title: `AI 提议：全书 ${DEMO_CHAPTER_COUNT} 章、每章约 ${DEMO_CHAPTER_MINUTES} 分钟学完`,
			summary:
				`${demoChapterChainText()}。\n每章内部按「${DEMO_SECTION_CHAIN}」组织，四段时长：${demoSectionMinutesText()}。\n第 ${DEMO_CHAPTER_COUNT} 章末尾附"全书自查清单"。`,
		},
	};
	const entry = base[String(gate)];
	if (entry === undefined) throw new Error(`未知拍板序号: ${gate}`);
	return {
		title: `${entry.title}（演示·v${version}）`,
		summary: entry.summary,
		detail: `${DEMO_MARK}\n完整方案正文（演示）：\n${entry.summary}\n\n章节级细节表格……`,
	};
}

/**
 * 演示书的**写作规范**（`工作区/style-spec.md`，票 `demo-channel-full/19`）。
 *
 * 票 19 之前这一份是**一行占位**（`# style-spec（演示）` ＋ 一句板块与口吻），**一个节标题都没有**
 * ——用户在演示书上看到的「写作规范」是个空壳；而真书那一份由执笔小助手按「写作规范十九项契约」写，
 * `stage-submit(gold)` 还会逐字软验其中五节的标题在场（缺了拦下让 AI 补全）。
 *
 * ⚠️ 三条纪律（都写在票 `19` 的票面上）：
 *  1. **节标题只从生产那份表来**（`STYLE_SPEC_REQUIRED_SECTIONS`）：⛔ 不在这里手抄第二份五个词。
 *     表里出现一个本文件没写正文的标题 ⇒ 生成侧**当场抛**（静默落一份空壳正是本票要治的病）。
 *  2. **正文说真话**：演示通道零 LLM——真做过的那一步照实写，演示**不做**的那一步就逐字写
 *     「演示不做这一步 ＋ 理由」，⛔ 不编一篇「有个 AI 写过的规范」。
 *  3. ⛔ **别写会触发机器解析的声明行**：行首 `必含板块：`／`禁用词：` 会让质量门按这份规范多跑两项；
 *     而 `不设练习`／`无练习` 那一族词会让演示书的「练习与答案齐全」**整格被跳过**
 *     （`engine.js` 的 `styleSpecDeclaresNoExercises` 是整份文本上的宽松匹配）——那等于顺手把两条判据一起关掉。
 */
export const DEMO_STYLE_SPEC_BODIES = Object.freeze({
	模式选型: `本书落定「${DEMO_SECTION_CHAIN}」四段式固定板块，服务同一个教学问题：
读者是**第一次系统学**的人，需要「先说清是什么 → 马上看一遍怎么用 → 立刻知道哪里会错 → 当堂练一道」这条节奏。
考虑过但**拒掉**的两种模式：按题型分章（同一个概念会在不同章各出现一次，节奏断）、按难度分卷（读者还没建立概念就要选难度）。
⚠️ 演示通道**不做**真实模式选型（零 LLM、确定性回放）：这一节按真书形制落位，正文是这条链与它对应的问题，⛔ 不是某个 AI 在演示通道里做过的判断。`,
	板块语法: `每章正文按固定顺序落四个二级板块，**一个不多一个不少**：

1. \`## 概念\` —— 这个知识点是什么，一段话说完；
2. \`## 例题\` —— 一道示范题：题干 ＋ 一步一行的解法；
3. \`## 易错点\` —— 最常见的错法 ＋ 为什么错；
4. \`## 小练习\` —— 一道当堂题，答案紧随其后（写成 \`（答案：…）\`）。

章标题一律 \`# 第N章 <章名>\`；板块标题一律二级、逐字用上面四个词——机器要逐章按这四个词核对，改名即失配。`,
	深度四维承诺: `四维（判定问题与档位见 \`references/depth.md\`，那是单一事实源）在本书的承诺：

| 维度 | 本书承诺 | 由什么兑现 |
| --- | --- | --- |
| 机理/原理（Why） | **浅**（写明理由） | \`## 概念\` 里给一句「为什么是这样」，不展开推导 |
| 脉络/争议（Where from） | **浅**（写明理由） | 不写学派与演变 |
| 边界/反例（Where it fails） | **中** | \`## 易错点\` 逐章给一条常见错法与它的边界 |
| 专家视角/精度（Expert's eye） | **浅**（写明理由） | 演示正文不追求内行精度 |

⚠️ 声明「浅」的那三维按契约**必须写明理由**：本书是**演示书**（零 LLM、正文为确定性回放），
承诺「中／深」而兑现不了就是假话 —— 所以这里如实降到「浅」，⛔ 不为了好看写「中」。`,
	脚手架标题列表: `本书**交付前没有要拆除的脚手架标题**：正文只由上面那四个内容板块组成，
不含「本节要点」「小结」「思考题」「延伸阅读」这类过程性标题，也不含 \`【AI 老师…】\` 元指令行。

（演示读数：${DEMO_CHAPTER_COUNT} 章正文由机器确定性生成，标题只有 \`# 第N章 …\` 与四个 \`## \` 板块标题。
契约要求这一节**无条件在场**，单源、无脚手架的书就照实写「没有」——⛔ 别留空。）`,
	多源同级声明: `本书只有**一份**转换完成的材料（演示书），不存在并行权威源：

**本书无并行权威源，不存在同级冲突**

（那一句是契约第 17 项对单源书的逐字要求：这一节**无论本书有几份材料都必须写**，
单源时照写这句、不许留空。演示通道照真书形制落它。）`,
});

/** 生成侧自检：生产那份表里**哪几节没有非空正文**（齐全时返回空数组）。 */
export function demoStyleSpecMissingBodies(bodies = DEMO_STYLE_SPEC_BODIES) {
	return STYLE_SPEC_REQUIRED_SECTIONS.filter((heading) => {
		const body = bodies?.[heading];
		return typeof body !== "string" || body.trim() === "";
	});
}

/** 组装演示书的写作规范正文（节标题从生产那份表派生，正文来自 {@link DEMO_STYLE_SPEC_BODIES}）。 */
export function demoStyleSpec() {
	const missing = demoStyleSpecMissingBodies();
	if (missing.length > 0) {
		throw new Error(
			`演示写作规范缺这几节的正文：${missing.join("、")}（契约新增了必须软验的节标题，而 DEMO_STYLE_SPEC_BODIES 没跟上）` +
				"——⛔ 别用占位正文糊过去，也别静默少落一节（那正是票 demo-channel-full/19 要治的空壳病）。",
		);
	}
	const sections = STYLE_SPEC_REQUIRED_SECTIONS.map(
		(heading) => `## ${heading}\n${DEMO_STYLE_SPEC_BODIES[heading].trim()}`,
	);
	return `${DEMO_MARK}\n# style-spec（演示）\n\n> 这一份由**演示通道**按真书的形制生成（零 LLM、确定性）：节标题与真书那份**同一套**，\n> 正文是演示内容。真书上这份规范由执笔小助手按「写作规范十九项契约」写，机器会逐字软验其中**五节**的标题在场。\n\n${sections.join("\n\n")}\n`;
}

function demoGoldChapter(_runtime, params) {
	// 修订回路演示：把本轮意见要点织进新稿，让「稿间对比」真的看得到变化。
	const redoNote =
		typeof params?.redoNote === "string" ? params.redoNote.trim() : "";
	const redoSection =
		redoNote === ""
			? ""
			: `\n\n## 本稿按你的意见改了（演示）\n\n已照以下意见调整：${redoNote}\n`;
	return {
		styleSpec: demoStyleSpec(),
		chapter: `${DEMO_MARK}\n# 第1章 数的认识（最佳范例·演示）\n\n## 概念\n数是用来数东西的符号……\n\n## 例题\n例1 ……\n\n## 易错点\n不要把 0 和"没有"搞混……\n\n## 小练习\n1. ……（答案：……）${redoSection}`,
		audit: {
			passed: true,
			issues: [{ level: "提示", status: "open", text: "演示章未做真实审计" }],
		},
	};
}

function demoChapterWrite(_runtime, params) {
	const { n, title } = params;
	return `${DEMO_MARK}\n# 第${n}章 ${title}（演示）\n\n## 概念\n（演示内容：${params.outline ?? ""}）\n\n## 例题\n例1 ……\n\n## 易错点\n……\n\n## 小练习\n1. ……`;
}

function demoChapterAudit() {
	return {
		passed: true,
		issues: [{ level: "提示", status: "open", text: "演示章未做真实审计" }],
	};
}

/**
 * 演示书的**进度账本**（`工作区/progress.md`，票 `demo-channel-full/04`）。
 *
 * 真书上它是主笔 AI 一边干一边补的**中间件**（交办文本逐字：「维护 `工作区/progress.md`
 * （每章一行：写完/审计/验货）」），中途换人／重做时拿它当参照；`domain-rules` 的
 * `SWEEP_EXCLUDED` 明确把它排除出**读者产物**那一族（它是协调用的中间件，不进产物清单对账）。
 * 演示通道没有 AI ⇒ 这里按**同一形状**造一份：每章一行，逐字记演示通道**真做过**的那两步。
 *
 * ⚠️ 第三步「验货」演示通道**从不经** `stage-submit(final)`（登记在 `demo-exemptions` 的
 * `final-gate-family`）⇒ 那一列**如实写「不跑」**，⛔ 不许把没发生的步骤写成已发生
 * （承诺面强度 ≤ 实现面强度）。
 *
 * ⚠️ 章名与章数都由调用方从大纲派生传进来，⛔ 本函数不写死章数、也不自己编章名。
 *
 * @param {{name?: string, rows?: {n: number, title: string, written: boolean, audited: boolean}[]}} params
 */
function demoProgressLedger(_runtime, params) {
	const rows = Array.isArray(params?.rows) ? params.rows : [];
	const lines = rows.map((row) => {
		const title = typeof row?.title === "string" && row.title.trim() !== "" ? row.title.trim() : `第${row?.n ?? "?"}章`;
		const step = (done) => (done === true ? "已落盘" : "未落盘");
		return `- 第${row?.n ?? "?"}章《${title}》：写完（${step(row?.written)}）｜ 自查（${step(row?.audited)}）｜ 验货（不跑——演示通道不走交工验货）`;
	});
	const who = typeof params?.name === "string" && params.name.trim() !== "" ? `\n> 本书：${params.name.trim()}\n` : "";
	return `${DEMO_MARK}
# 进度账本（演示）
${who}
> 这一份由**演示通道**生成（零 LLM、确定性）：真书上它由主笔 AI 一边干一边补
> （每个小助手回来、每交工一章时补一条），是中途换人、重做时的参照。演示通道没有 AI，
> 所以下面逐章记的是**演示通道真做过的那两步**；第三步「验货」那一列如实写着**不跑**。

${lines.join("\n")}
`;
}

/**
 * 演示书的**最后检查 · AI 自查报告**全文（票 `demo-channel-full/08`）。
 *
 * 它是账本事件 `textbook/ai-report` 的 `data.report`——**不落盘**（与真书同一条口径：自查报告随交工上送、
 * 逐字进那一笔），认可卡上那块报告正文读的就是它（`src/ui/view-rules.js` 的 `aiReport`）。
 *
 * ⚠️ **逐字自陈是演示**：它**不是**一份真读完全书后的自查结论，⛔ 别拿它当「这本书查过了」的证据。
 * 真书上这一份由主笔 AI 在 `stage-submit(stage=final)` 时交上来。
 */
function demoFinalSelfReport() {
	return `${DEMO_MARK}
# 最后检查 · AI 自查报告（演示）

> 这一份由**演示通道**生成（零 LLM、确定性）：**不是**真读完全书之后的自查结论，
> 只用来让你看见「点『认可，交付』之前 AI 会交上来什么」。真书上这一份由主笔 AI 交工上送。

## 结论
通过（演示占位——真书上这一句由读过正文的主笔自己写）。

## 逐条点名
- 三章的板块都按四段式排齐了（演示读数，未逐字核对正文）。
- 每一章的引用都能在材料清单里找到（演示读数）。
- 已拍板的设计在盘上都有据（演示读数）。
`;
}

/**
 * 演示书的**五份分查报告**（票 `demo-channel-full/08`）。
 *
 * 真书上这五份由**五个上下文干净的小助手**各自读全书后自落（`FINAL_AUDIT_SCOPES` 那五路），
 * 机器再把它们的**条目并集**拼成 `工作区/报告/final-summary.md`。演示通道不派真小助手 ⇒ 这里按
 * **同一份身份词表**（`FINAL_AUDIT_SCOPES`，⛔ 不手抄那五个节名）造五份占位件。
 *
 * ⚠️ 每份都得**有条目**（`- …` 列表项）：汇总件只搬条目，没有条目的报告会让 `unionSize` 是 0——
 * 那样「并集拼出来了」就成了空转的绿。
 * ⚠️ **逐字自陈是演示**：这五份**不是**真读过正文的结论。
 *
 * @returns {{n: number, scope: string, text: string}[]}
 */
function demoFinalChapterReports() {
	const itemsOf = {
		1: [
			"- 第 1 章《数的认识》：章稿与检查记录都在盘上（演示读数，未逐字核对）。",
			"- 第 2 章《加减法》：章稿与检查记录都在盘上（演示读数，未逐字核对）。",
			"- 第 3 章《应用题综合》：章稿与检查记录都在盘上（演示读数，未逐字核对）。",
		],
		2: [
			"- 全书正文里没有留下草稿标记一类的东西（演示读数）。",
			"- 三章都写了小练习并带上参考答案（演示读数）。",
		],
		3: [
			`- 三章的板块都按「${DEMO_SECTION_CHAIN}」四段排（与拍板的设计一致；演示读数）。`,
			"- 章节安排与已确认的那一版一致（演示读数）。",
		],
		4: [
			"- 每一章的引用都指向材料清单里的那一份（演示读数）。",
			"- 没有发现悬空的交叉引用（演示读数）。",
		],
		5: [
			"- 贯穿案例「小明学数学」在三章里都复用（演示读数）。",
			"- 同一个说法在全书前后一致（演示读数）。",
		],
	};
	return FINAL_AUDIT_SCOPES.map(({ n, scope }) => ({
		n,
		scope,
		text: `${DEMO_MARK}
# 最后检查 · 第 ${n} 路分报告 · ${scope}（演示）

> 这一份由**演示通道**生成（零 LLM、确定性）：**不是**真读完全书之后的结论，
> 只用来让认可那一屏上「五份分查 ＋ 机器拼的汇总件」这条路有东西可看。

## 条目级点名
${(itemsOf[n] ?? []).join("\n")}

## 结论
通过（演示占位——真书上这一句由读过正文的那一路自己写）。
`,
	}));
}

function demoMergeBook(_runtime, params) {
	const { chapters, title } = params;
	const parts = [
		`# ${title}（演示成品）`,
		"",
		"> 本书由造书工作台演示模式生成，仅用于熟悉流程。",
	];
	for (const [n, { title: chapterTitle, text }] of chapters.entries()) {
		parts.push(
			"",
			`---`,
			"",
			`# 第${n + 1}章 ${chapterTitle}`,
			"",
			(text ?? "").replace(/^# .*$/m, "").trim(),
		);
	}
	return parts.join("\n");
}

function demoOutline() {
	// 票 pipeline-wiring-gaps/14：outline 提交按 engine.js outline 段 brief 带 `points`，
	// 每项按票 01 裁决的 **title 单键口径**（`knowledgePoints[].id` 不接进比对环）。
	// 票 demo-flow-fidelity/02：章名/章数/细目全部从 `DEMO_CHAPTERS` 派生（原先这份清单是
	// 第二处手写的章名事实，与 `explore.md`「共 6 章」、关卡 3 的六章串三处不同口径）。
	// `points` 取的是 `DEMO_CHAPTERS[].title`，与知识地图 `knowledgePoints[].title` 是**两份**
	// 字面量——靠 `test-collab-replay.mjs` 的 `checkDemoPointsCaliber` 逐项互对（缺字段/id 口径即红），
	// 有意不从知识地图派生（同源即自证，理由见 `DEMO_CHAPTERS` 的注释）。
	// `source` 仍走 `demoMaterialRef()`（票 03 收口的引用出口：本书只有 1 份源，票 01 的 Q6＝甲；
	// 原先第 3 章那句「材料2：应用题部分」是凭空来的编号，审计 C3）。
	return {
		chapters: DEMO_CHAPTERS.map((chapter) => ({
			title: chapter.title,
			outline: chapter.outline,
			source: demoMaterialRef(chapter.sourcePart),
			points: [chapter.title],
			targetWords: chapter.targetWords,
		})),
	};
}

// ── 选书向导 / 字数建议（真实子代理） ────────────────────────────────────

// 规则兜底 guessRoleFromName 与角色五分类（原 ROLE_LIST）收编在 ./domain-rules.js。
// ⚠️ 票 `pre-gold-build/02`：**「角色识别」这一路整条退役**——原先这里的 `buildRolePrompt()`／
// `suggestRoles()` 是上传那一刻那路「只看文件名猜角色」的 AI 识别（票 `pipeline-wiring-gaps/04`
// 给它加过枚举派生）。角色改由探查段开头的**书级材料判定**产出（派发档 `material-survey`，
// 口径见 `.scratch/pre-gold-processes/issues/11` 的 §6 第 1 行）⇒ 这条流水线没有消费者了。

// 书名/目标净化：LLM 偶尔给 name 加「开始：」「书名：」等口水前缀，后端源头剥掉。
// 前端 pickSuggestion（event-cards.js）另有兜底剥离，防其他来源漏网。
const cleanSuggestionText = (s) =>
	typeof s === "string"
		? s.replace(/^\s*(?:开始|书名|建议|题目|目标)[:：]\s*/, "")
		: s;

async function wizardSuggest(runtime, params) {
	const hint =
		typeof params.hint === "string" && params.hint.trim() !== ""
			? params.hint.trim()
			: "";
	if (runtime.demo) {
		return {
			suggestions:
				hint === ""
					? [
							{
								name: "初中数学·有理数",
								goal: "学完能独立做对教材配套的基础题，并说出每个概念是什么、为什么、怎么用",
								science: true,
							},
							{
								name: "小学英语·自然拼读",
								goal: "看到陌生单词能试读出来，听写常见单词不再怕",
								science: false,
							},
							{
								name: "高中物理·力学入门",
								goal: '能用受力分析解典型题，看懂"为什么物体会动"',
								science: true,
							},
						]
					: [
							{
								name: `围绕"${hint.slice(0, 12)}"的入门书`,
								goal: "学完能独立完成对应基础练习，并说出每个概念是什么、为什么、怎么用",
								science: false,
							},
							{
								name: `${hint.slice(0, 12)}：从例子到规律`,
								goal: "能用自己的话讲清楚知识点的来龙去脉，做对配套练习",
								science: false,
							},
							{
								name: `${hint.slice(0, 12)}：查漏补缺版`,
								goal: "找出最薄弱的两三处并逐一攻克，配套练习正确率达到九成",
								science: false,
							},
						],
		};
	}
	const contextBlock =
		hint === ""
			? "用户没有填写背景信息。请给出 3 个覆盖面广的通用建议（不同学科/场景）。"
			: `用户的背景信息：「${hint}」——这是唯一依据，严禁无视它、套用默认模板。`;
	const prompt = `你是"造书工作台"的选书顾问，为想"造一本书"的用户推荐起点。用户是谁、想要什么，完全由下面这条背景信息决定：

${contextBlock}

规则：
1. 背景填写了：先想清楚"这位用户是谁、最急的事是什么"，再推荐对应的书。
   · 背景是成年人/职业/考证（如 PMP、CPA、法考、考研）→ 推荐对应的备考书，书名和 goal 都用成年人的说法。
     例子：name「PMP 备考·项目管理知识体系」goal「学完能掌握五大过程组与十大知识领域，刷题正确率 80% 以上，有信心走进考场」。
   · 背景是学习者/年级/学科（如三年级、古诗）→ 推荐对应的教材书。
2. 背景没填写：给 3 个不同方向的通用建议。
3. 严禁无视背景、一律按"中小学生教材"输出。
4. name 只写书名本身（如「初中数学·有理数」），严禁带「开始：」「书名：」「建议：」等任何前缀；goal 同理，严禁带「目标：」等前缀。

输出严格 JSON（不要解释、不要代码块）：
{"suggestions":[{"name":"书名（具体、贴近教材）","goal":"学完要能做到什么（一句话，具体可检验，措辞贴合用户身份）","science":true或false}]}
三个建议要互相有差异（打基础 / 补短板 / 提兴趣 / 备考冲刺等）。
字符串内部严禁使用英文双引号，引用一律用「」。`;
	const raw = await runSubagent(runtime, "选书建议", prompt);
	const parsed = parseJsonLoose(raw);
	if (Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
		return {
			suggestions: parsed.suggestions.map((sg) => ({
				...sg,
				name: cleanSuggestionText(sg.name),
				goal: cleanSuggestionText(sg.goal),
			})),
		};
	}
	throw new Error("建议格式不对");
}

async function suggestWords(runtime, params) {
	const goal = typeof params.goal === "string" ? params.goal : "";
	const route =
		params.route === "human"
			? "给人直接读的教材"
			: "给 AI 老师上课用的教学蓝本";
	const science = params.science === true;
	const chapterCount =
		Number.isFinite(Number(params.chapterCount)) &&
		Number(params.chapterCount) > 0
			? Number(params.chapterCount)
			: 7;
	const currentTargets = Array.isArray(params.currentTargets) ? params.currentTargets : [];
	const goldChapter = Number.isSafeInteger(params.goldChapter) ? params.goldChapter : 1;
	const goldMeasuredHanzi = Number.isFinite(params.goldMeasuredHanzi)
		? Math.round(params.goldMeasuredHanzi)
		: null;
	const fallbackPerChapter = currentTargets.map((chapter) => ({
		n: chapter.n,
		targetWords: Number.isFinite(chapter.targetWords) ? chapter.targetWords : 6000,
		reason: chapter.reason ?? "",
	}));
	if (runtime.demo) {
		return {
			suggested: 6000,
			range: "5000-7000",
			reason: "（演示建议）按内容密度给每章约 6000 汉字。",
			perChapter: fallbackPerChapter,
		};
	}
	const measuredLine = goldMeasuredHanzi === null
		? `第 ${goldChapter} 章范例章实测：正文尚未生成`
		: `第 ${goldChapter} 章范例章实测：${goldMeasuredHanzi} 汉字`;
	const targetLines = currentTargets.length === 0
		? "（尚无逐章目标）"
		: currentTargets
			.map((chapter) => {
				const current = Number.isFinite(chapter.targetWords)
					? `${chapter.targetWords} 汉字`
					: "未定";
				return `- 第 ${chapter.n} 章「${chapter.title || "未命名"}」现有目标：${current}${chapter.reason ? `；依据：${chapter.reason}` : ""}`;
			})
			.join("\n");
	const prompt = `你是"造书工作台"的编辑顾问，为一位家长/老师建议每章目标汉字数。

学习目标：${goal || "（未填写）"}
使用方式：${route}
理科内容：${science ? "是" : "否"}
全书章节数：${chapterCount} 章
${measuredLine}
现有逐章目标：
${targetLines}

请结合最佳范例章的实测体量、各章现有目标、标题、内容密度与例题量，给出**每一章**的目标汉字数建议。这是供用户预填和拍板的建议，不是必须命中的指标，也不要给篇幅压力。

输出严格 JSON（不要解释、不要代码块），perChapter 必须逐章齐全，形状为 {n:1-based章号,targetWords:正整数,reason:一句话}：
{"suggested":6000,"range":"5000-7000","reason":"一句话总理由（家长能看懂）","perChapter":[{"n":1,"targetWords":5400,"reason":"这一章概念少"},{"n":2,"targetWords":6800,"reason":"这一章例题多"}]}`;
	try {
		const raw = await runSubagent(runtime, "逐章字数建议", prompt, 120 * 1000);
		const parsed = parseJsonLoose(raw);
		const suggested = Number(parsed.suggested);
		if (!Number.isFinite(suggested) || suggested < 500)
			throw new Error("建议字数不合法");
		if (!Array.isArray(parsed.perChapter) || parsed.perChapter.length !== chapterCount)
			throw new Error("逐章建议不完整");
		const perChapter = parsed.perChapter.map((chapter) => {
			const n = Number(chapter?.n);
			const targetWords = Number(chapter?.targetWords);
			if (!Number.isSafeInteger(n) || n < 1 || n > chapterCount || !Number.isFinite(targetWords) || targetWords < 500 || targetWords > 50000)
				throw new Error("逐章建议格式不对");
			return {
				n,
				targetWords: Math.round(targetWords),
				reason: typeof chapter?.reason === "string" ? chapter.reason : "",
			};
		});
		if (new Set(perChapter.map((chapter) => chapter.n)).size !== chapterCount)
			throw new Error("逐章建议章号重复");
		return {
			suggested: Math.round(suggested),
			range: typeof parsed.range === "string" ? parsed.range : "",
			reason: typeof parsed.reason === "string" ? parsed.reason : "",
			perChapter,
		};
	} catch {
		return {
			suggested: 6000,
			range: "5000-7000",
			reason: "（AI 建议暂不可用，保留现有逐章目标）",
			perChapter: fallbackPerChapter,
		};
	}
}

/** 自定义模式分析：用户粘贴一段教学/结构描述 → AI 提炼成「模式卡」（加入本书模式库用）。 */
async function analyzePattern(runtime, params) {
	const text = typeof params.text === "string" ? params.text.trim() : "";
	if (text === "") throw new Error("请先粘贴要分析的文本");
	if (runtime.demo) {
		return {
			card: {
				name: "自定义板块（演示）",
				problem:
					"按你粘贴的描述提炼的板块结构（演示占位，真实模式由 AI 分析生成）",
				when: "本书写作时使用",
				blocks: `1. 先呈现：${text.slice(0, 50)}${text.length > 50 ? "…" : ""}\n2. 再逐条落地为章节板块。`,
			},
		};
	}
	const prompt = `你是"造书工作台"的教学模式设计师。用户粘贴了一段对「教学结构/教法/板块」的描述，请把它提炼成一张标准「模式卡」，供 AI 写书时选用（与内置模式库格式一致）。

模式卡字段：
- name：模式名（4-12 个字的动词短语，如「先场景后概念」「误区判断题」）
- problem：它解决哪个教学问题（一句话，家长能看懂）
- when：什么时候用（什么场景/什么类型的内容适合）
- blocks：在章节里怎么落地——板块/步骤怎么排、每步干什么（可执行的写法，用「1. … 2. … 3. …」编号）

用户粘贴的文本：
「${text.slice(0, 3000)}」

输出严格 JSON（不要解释、不要代码块）：
{"card":{"name":"…","problem":"…","when":"…","blocks":"…"}}
字符串内部严禁使用英文双引号，引用一律用「」。`;
	const raw = await runSubagent(runtime, "分析自定义模式", prompt, 120 * 1000);
	const parsed = parseJsonLoose(raw);
	const card = parsed?.card;
	if (card === null || typeof card !== "object")
		throw new Error("模式分析格式不对");
	const name = typeof card.name === "string" ? card.name.trim() : "";
	if (name === "") throw new Error("模式分析缺少模式名");
	return {
		card: {
			name,
			problem: typeof card.problem === "string" ? card.problem.trim() : "",
			when: typeof card.when === "string" ? card.when.trim() : "",
			blocks: typeof card.blocks === "string" ? card.blocks.trim() : "",
		},
	};
}

/** 按任务类型生成内容。 */
export async function generateContent(runtime, kind, params = {}) {
	// 流水线任务：只支持演示模式（真实模式已由主 AI 接管，走到这说明是配置错误）。
	const pipeline = (demoCode) => {
		if (runtime.demo) return demoCode(runtime, params);
		throw new Error(
			`流水线任务「${kind}」应由主 AI 经 stage-brief/stage-submit 完成，不应在这里调用`,
		);
	};
	switch (kind) {
		case "explore":
			return pipeline(demoExplore);
		case "gate":
			return pipeline(demoGateProposal);
		case "outline":
			return pipeline(demoOutline);
		case "gold":
			return pipeline(demoGoldChapter);
		case "chapter":
			return pipeline(demoChapterWrite);
		case "audit":
			return pipeline(demoChapterAudit);
		// 票 `demo-channel-full/04`：演示书的进度账本（`工作区/progress.md`）——真书上由主笔 AI
		// 一边干一边补，这里按**同一形状**造一份（内容侧只排版，事实由 `engine.js` 铺章那一段传进来）。
		case "progress":
			return pipeline(demoProgressLedger);
		case "merge":
			return pipeline(demoMergeBook);
		// 票 `demo-channel-full/08`：最后检查那两件（自查报告 ＋ 五份分查）——真书上分别由主笔与五个
		// 小助手产，演示通道在这里造占位件；「谁把它写进盘／写进账本」在 `engine.js` 的终检支。
		case "final-report":
			return pipeline(demoFinalSelfReport);
		case "final-audit":
			return pipeline(demoFinalChapterReports);
		case "words":
			return await suggestWords(runtime, params);
		case "wizard":
			return await wizardSuggest(runtime, params);
		case "pattern":
			return await analyzePattern(runtime, params);
		default:
			throw new Error(`未知生成任务: ${kind}`);
	}
}
