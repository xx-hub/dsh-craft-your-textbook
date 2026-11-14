/**
 * 造书工作台 · 确认卡
 *
 * 两个人审确认点：源探查结果确认（awaiting-explore）与章节安排确认（awaiting-outline）。
 */

import { createElement, useEffect, useRef, useState } from "react";
import { defineCardView } from "./card-view.js";
// 票 `ui-display-redesign/03`：卡头那一行（问句＋事实句）复用票 01 立的共用小件；站 2 的里程碑
// 标题（`🔍 材料读完了！`）夹在两者之间，走它的可选中间行（`lead`）。问句字面量留在**本文件**
// （票 01 的 API 约定：人设取证面只读卡片自己文件里的 `<strong>` 字面量）。
import { CardHead, CARD_HEAD_QUESTION_STYLE } from "./card-head.js";
import { S } from "./styles.js";
import { exploreReportBlocks, bodyOf, BODY_KIND_MARKDOWN } from "./md-render.js";
// 知识地图（`工作区/knowledge-map.json`）的**形状读取**（票 `depth-review-2026-10/03`）：
// 键名与「不是数组就当没有」这条兜底收在中性模块——那份 JSON 今天有两个读者，形状知识分住在
// 两个文件里就等于有两份会漂的读法（收编前这里就是一份内联的 `JSON.parse`）。
// ⚠️ **只收形状，不收措辞**（既有裁决「数据同源、措辞各自成篇」）：下面三块清单的每一句人话
// 仍是这张卡自己写的，与 `foldKnowledgeMap` 那份折叠**逐字不同**，两者服务于两种读法
// （就地折叠的纯文本 vs 一张要拍板的卡）。改文案前先问产品，别当成重复代码清掉。
import { parseKnowledgeMap } from "./machine-product-folds.js";
// ⚠️ **合并期修整（票 `rcb-build/06`）**：上面那一行是 `test-phase-page.mjs` 的「依赖方向」判据
// **逐字锚住**的那一行（形状读取只经中性模块）⇒ 一个字不动；这一行从**同一个**中性模块再引
// **原始**读法——票 `rcb-build/09` 的缺口栏要按合并件里的 `readerSlices` 现算，而那一格不在折叠
// 视图里。⛔ 本文件里从此**没有**任何 `JSON.parse(...)`：那份形状知识仍只住在中性模块里。
import { parseKnowledgeMapRaw } from "./machine-product-folds.js";
// 知识点图（票 `knowledge-graph-build/07` 画、`08` 划）：**同一个东西的第三种读法**——整张 DAG 一次全画。
// 它长在下面「▸ 知识点清单（N 个）」那个折叠块**旁边**（同一张卡、同一区），⛔ 不是新的一屏、
// ⛔ 不新开阶段。票 08 起图上能划（四档动作键），改动走**第三条「意见」通路**（`graph-opinion`）：
// 本卡只把数据与两个活口递下去，几何／四态／走法全在那个 module 里。
// 票 `ui-display-redesign/12`：窄到放不下就切「清单」那件事也要量**同一只**滚动盒 ⇒ 量宽与判据从那里取。
import { KnowledgeGraphView, KG_DIALOG_KEYS, KG_VERDICTS, edgeScanReading, magnitudeReading, exclusionStaleReading, kgPointsView, kgViewportIsNarrow, knowledgeGraphModel, measureKgViewportWidth } from "./knowledge-graph-map.js";
import {
	KNOWLEDGE_POINT_DIFFICULTY,
	normalizeTeachingFocus,
	// 票 `pipeline-wiring-gaps/12`：知识点覆盖的两头比对——与 outline 交工闸门同一份
	// （`actions/chapters.js` 吃的就是这个函数），界面不另写一套量法。
	// `okMaterialNumbers` 同理：闸门只对「有转换完成的源」的书判覆盖，卡照抄同一口径，
	// 不然无源书会印出「交工会被机器拒」这种机器根本不会做的事。
	okMaterialNumbers,
	outlinePointsCoverage,
	// 票 `knowledge-graph-build/09`：喂给上面那道闸门的集合是「知识点 − **被剔除的**」——
	// 下面两张卡用的就是**同一对纯函数**（读侧同一个 `liveExclusionsOf` ＋ `effectiveKnowledgePoints`），
	// 所以「一处口径、三处读者」在这里不是一句话，是同一次调用。
	effectiveKnowledgePoints,
	exclusionKeysOf,
	liveExclusionsOf,
	// 票 `confirm-points-redesign-build/04`：清单每行那颗「划掉」键要把**知识点那一行**
	// 对回**图上的卡键**（`graph-opinion` 只认卡键）。比对用**闸门那把尺子**（同一份归一化），
	// ⛔ 界面不另写一套「两串算不算同一个」的判法。
	normalizeKnowledgePointTitle,
	parseExclusionsDocument,
	// 票 `confirm-points-redesign-build/10`：清单那一行那颗键走**「不需要」**那一档理由——
	// 常量从它的登记单点（`domain-rules.js`）取，⛔ 不在这里手抄「不需要」三个字。
	EXCLUSION_REASON_NOT_NEEDED,
	// 票 `rcb-build/06`：那一句**如实说明**要按「还算数的 `已经会` 条数」**现算** N——
	// 理由档那一格的登记单点同上，⛔ 不在这里手抄「已经会」三个字。
	EXCLUSION_REASON_ALREADY_KNOWN,
	// 票 `ui-systematic-fixes/01`：那条「回退下场」如实说明里的**机器件名**只许进悬停提示
	// （spec §3·2），所以那两个路径从它们的登记单点取——⛔ 不在界面里手拼第二份。
	DECISION_DIR_REL,
	KNOWLEDGE_MAP_EXCLUSIONS_REL,
	// 票 `kn-unowned-silent/02`：逐点豁免的**同一份**判据（服务端闸门与这张卡读同一个纯函数）——
	// 「哪几条点被点名放弃」不在界面另写一份 filter，⛔ 两套判据必然漂。
} from "../domain-rules.js";
// 票 `rcb-build/04`：站 2 确认动作的**载荷与落点唯一写点**（共享件——壳／卡／服务端同一份闭集与现算）。
// ⚠️ 只取**机器取值**与身份档；人读文案住本文件，⛔ 不让共享件长出界面措辞。
import {
	EXPLORE_CONFIRM_AI_PRIOR_STATEMENT,
	EXPLORE_CONFIRM_ANSWERERS,
	EXPLORE_CONFIRM_EXITS,
	EXPLORE_CONFIRM_STANCE_KINDS,
} from "../explore-confirm-contract.js";
// 票 `demo-channel-full/24`：驳回表单那行 placeholder 的**唯一出口**（两取值，复用现成的
// `isDemoBook`）——⛔ 本文件不再持第二份措辞（病与读数见那个函数的注释）。
import { outlineRejectPlaceholder, exploreConfirmNote, outlineCardLead } from "./view-rules.js";
// 票 `rcb-build/09`：卡尾那一栏「这批条目拿不到读者输入」——**派生读数**（从回卷原件 ＋ 合并件的
// `readerSlices` ＋ 图上的裁决现算）＋ 它那一块的渲染。⛔ 它不落任何件、⛔ 不参与任何放行判断。
// ⚠️ 「片缺席／形状坏 ⇒ 整书一片」那条退化在**消费侧**现算（`effectiveReaderSlices`），
// 本卡读的与问卷那条路读的是**同一份**退化视图（⛔ 不留第二份）。
import { ReaderGapBlock, readerGapReading } from "./reader-gap.js";
// 票 `kn-unowned-silent/02`：面板读数「本章上限 / 实际 / 豁免放弃」里的那个上限——**同一份**声明
// （`src/outline-limits.js` 是零依赖根级模块，量级读数早就从它取；⛔ 不在这里手抄 20）。
import { OUTLINE_POINTS_MAX } from "../outline-limits.js";
// 票 `ui-workflow-seam/04`：退化视图改从 `src/` 根级窄门取（界面⛔ 不再知道 `workflow/` 的内部路径）。
// 仍是**同一份**实现：根级那扇门是 `export … from`，零拷贝（判据断两个模块导出的是同一个引用）。
import { effectiveReaderSlices } from "../reader-slices.js";

// ── 探查结果确认卡（探源 → 用户看一眼再继续） ───────────────────────────────

// 知识点难度 → 颜色（让清单一眼可扫）。
// 票 06：难度取值域**登记在 `domain-rules.KNOWLEDGE_POINT_DIFFICULTY`**（登记单点，不是这张表）。
// 色表从取值域**派生**（键域＝登记面）：界面不再自设四格、也不再配一把兜底灰把出域值兜成
// 「看不出问题」——出域值已在 explore 交工时由机器归一化写回（`actions/chapters.js` 的
// explore 分支），机器产物落不到缺色格；`DIFF_COLORS[d]` 落空只剩旧书/夹具残值那一格，
// 渲染成默认正文色。登记面加一档而这里没配色的活口由 `test-knowledge-difficulty.mjs`
// 的对账判据咬住（每档必须真有一色）。
const DIFF_TONES = {
	基础: "var(--dsw-alias-state-success-primary)",
	重点: "var(--dsw-alias-state-warn-label)",
	难点: "var(--dsw-alias-state-error-primary)",
	进阶: "var(--dsw-alias-state-business-primary)",
};
export const DIFF_COLORS = Object.fromEntries(
	KNOWLEDGE_POINT_DIFFICULTY.map((d) => [d, DIFF_TONES[d]]),
);
// 重做探查的预置理由（点选即用，不用打字）。
const RE_EXPLORE_REASONS = [
	"有的材料没读全",
	"知识点整理得太粗",
	"章节建议不合理",
	"重点难点判断不对",
];

// 「拍板通过、继续往下走」那颗推进键的可见文案——**唯一出口**。
// 票 20 当初在焦点区底部加过一条吸底决策条，条上那颗同名按钮取的就是这里（两处不许各写一份）。
// ⚠️ 那条已按票 `walkthrough-fixes/18` 的裁决整条删掉（2026-10-04，用户选 B）——**屏上同一颗键
// 渲染了两次**：卡内那颗（对的那次，和「🔁 让 AI 重做」「👀 看完整报告」并排）之外，卡片外面
// 还有一颗右对齐、孤零零挂在右下方的同名键，用户原话「满意的那行位置不对」。
// 现在**这颗键只有卡上这一个出口**；防它回来的判据在 `test-layout-anchors.mjs`（源码级）
// 与 `test-workbench-first-screen.mjs`（渲染级：逐字只出现一次）。
export const EXPLORE_CONFIRM_ACCEPT_LABEL = "✅ 满意，继续设计";

// ── 票 `ui-systematic-fixes/11`：另两颗键的文案也提成出口（拍板契约的 `options[].label`／`keysAt`
// 取的就是这两个绑定）。⛔ 不在 `view-rules.js` 再抄一份原文——「同一句话只许有一个出口」。
// ⚠️「🔁 让 AI 重做」在**站 2 与站 7 两张卡上同一句话**（票 10 判定一 #7 已经把两处统一成这一句）
// ⇒ 只此一个常量、两处渲染都取它。
export const EXPLORE_CONFIRM_REWRITE_LABEL = "🔁 让 AI 重做";
// 驳回面板展开之后那颗**确认重做**键（链上判据 B 真点的那一颗）。收口 review 之前它是内联字面量，
// 判据只能手抄第二份原文——这里提成唯一出口，判据 import 它（照 `EXPLORE_CONFIRM_REWRITE_LABEL` 同形）。
export const EXPLORE_CONFIRM_REWRITE_CONFIRM_LABEL = "🔁 就这样重做";
export const OUTLINE_CONFIRM_ACCEPT_LABEL = "✅ 通过，开始写最佳范例章";

/**
 * 站 7（章节安排）卡头的**主问题**（票 `ui-display-redesign/06`；**存量句逐字不改**——
 * 它就是 `view-rules.js` `decisionOf("outline").question` 那一句，本票把它从状态条搬上卡头）。
 *
 * ⚠️ 字面量必须留在**本文件**、并由本卡就地造那个 `<strong>` 再交给 `CardHead`（理由见
 * `card-head.js` 文件头「API」）：人设「界面状态对照表」逐字引着这张卡的标题，而
 * `test-context-vocabulary.mjs` 的取证面只读 `src/ui/**` 里 `createElement("strong", …)` 调用点上的
 * 字面量／同文件 `const`——问句节点由共用件代造时，取证面看不见它。
 * ⚠️ 与 `decisionOf("outline").question` 必须是**同一个值**（判据在 `test-component-cards` 的
 * 票 06 那一节逐字对账）。
 */
export const OUTLINE_CARD_QUESTION = "这份章节安排能通过吗？";

/**
 * 站 7 卡头**事实句**（票 `ui-display-redesign/06` 新写，派生）：
 * `N 章 · 每条知识点都有章节认领 · 范例章可改选。`
 *
 * ⚠️ 三个数/状态**全部现算**，⛔ 不写死「3 章」：
 *   · `chapterCount`＝`meta.outline.chapters` 的长度；
 *   · 中段＝覆盖对照面（`outlinePointsCoverage`，与覆盖闸门**同一份**）里**没有章节认领**的条数；
 *     没有对照面（无源书 / 读不出知识地图）时如实说「没有知识点覆盖可核对」，⛔ 不冒充「都有认领」；
 *   · 末段＝范例章能不能改选（章数 >1 才有那个下拉）。
 *
 * @param {number} chapterCount 这一版章节骨架的章数
 * @param {number} unclaimedCount 还没有任何一章认领的知识点条数（没有对照面时忽略）
 * @param {boolean} hasCoverage 这一屏有没有覆盖对照面
 */
export function outlineCardFacts(chapterCount, unclaimedCount, hasCoverage) {
	const claim = !hasCoverage
		? "没有知识点覆盖可核对"
		: unclaimedCount === 0
			? "每条知识点都有章节认领"
			: `${unclaimedCount} 条知识点还没有章节认领`;
	const pick = chapterCount > 1 ? "范例章可改选" : "范例章就是这一章";
	return `${chapterCount} 章，${claim}，${pick}。`;
}

/**
 * 第 `chapterNo` 章**这次真被放弃**的知识点（票 `kn-unowned-silent/02`；面板读数「豁免放弃 M」的 M）。
 *
 * ## 读哪一份、为什么
 *
 * 读 `meta.waivedPointDrops`——那是**交工那一刻**机器记下的结果（`chapters.js` 的 `outline` 支：
 * 「本章 points 里少了哪几条」）。⛔ 不去猜豁免记录里的章号：一条书级豁免（`scope.chapter=null`）
 * 里只写了 title 时，机器根本推不出这个点归哪一章；替它猜一个章号，就会出现「闸门放行、面板印 0」
 * （服务端与屏上各说一套）。**有结果就读结果**，没有结果（老书／这一轮没交工过）就印 0。
 *
 * ⚠️ 与「豁免台账里点名了什么」是两件事，如实分开：台账是**授权**（人点了名），
 * `waivedPointDrops` 是**结果**（这一版骨架真少收了哪几条）。面板要的是结果。
 *
 * @param {object|null|undefined} meta 书状态
 * @param {number} chapterNo 1 基章号
 * @returns {{chapter: number, points: string[]}}
 */
export function chaptersWaivedPoints(meta, chapterNo) {
	if (!Number.isSafeInteger(chapterNo) || chapterNo < 1) return { chapter: chapterNo, points: [] };
	const rows = Array.isArray(meta?.waivedPointDrops) ? meta.waivedPointDrops : [];
	for (const row of rows) {
		if (row === null || typeof row !== "object") continue;
		if (row.chapter !== chapterNo) continue;
		const points = Array.isArray(row.points) ? row.points.filter((t) => typeof t === "string" && t !== "") : [];
		return { chapter: chapterNo, points };
	}
	return { chapter: chapterNo, points: [] };
}

/**
 * 「必须覆盖 ↔ 已认领」清单的折叠口那**一行**（票 `ui-display-redesign/06`；票 17 收口 review S6）。
 *
 * 病：这一节的清单随知识点条数变长（几十条很常见），常显会把「选范例章」与两颗拍板键一路推下去。
 * ⇒ 默认折起来（spec §2.6 第 5 块「折＋内滚」），展开后那一块自己有内滚封顶。
 * ⚠️ 折叠口只做**展开收起**（⛔ 不发任何动作），文案里**不带数字**（数字在展开后的抬头里，
 * 也免得一行阈值读数被当成承诺）。
 * ⚠️ 票 `ui-display-redesign/17`（收口 review S6）：这一格从票 06 的**新增 `<button>`** 改成
 * **原生 `<details>/<summary>`**——spec §1 不许新增可点区域，同批同类折叠（站 1／9／10）都是这一档；
 * 文案是**静态**的（收起/展开由浏览器管，`<summary>` 不换词）。
 */
export const OUTLINE_COVERAGE_FOLD_SUMMARY = "必须覆盖 ↔ 已认领（点开核对）";

/**
 * 覆盖清单展开后那一块的**内滚封顶**（px）——「清单再长也不把下面的键推走」。
 *
 * ⚠️ 这个数是**人工边界**读数定的（与 `EXPLORE_POINTS_VIEW_MAX_HEIGHT` 的 6 层算式**不是同一种**——
 * 920 那一格由「表头 ＋ 6 × 层距」导出，这一格仍是「选范例章与两颗键在不在首屏」的人工读数）：
 * 无排版引擎判不了「选范例章与两颗键在不在首屏」，这里只保证清单自身封顶＋可滚。今天 240px ≈ 12 条知识点，
 * 而演示书那一屏是 3 条（远不到封顶）；换这个数＝改人工边界结论，回写本票 `## Comments`。
 */
export const OUTLINE_COVERAGE_VIEW_MAX_HEIGHT = 240;

/**
 * 「✅ 满意，继续设计」那颗主键的**后果说明**（票 `ui-systematic-fixes/11` 补的六句之一 · 站 2）。
 *
 * 与票 09 那两句同一族纪律：只说后果（点了会怎样、下一步去哪），⛔ 不新造状态词、
 * ⛔ 不改键文案本身、⛔ 不新增可点区域（纯文字）。今天它**只进契约**
 * （`decisionOf("explore").options[].effect`），卡上不渲染——spec §5 的 `options` 是下一层渲染的输入。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：本句只管这一颗键；「点了之后 AI 真去起草了那几条目标」
 * 本句**不声称**（真机层，ADR-0005）。演示书上这一跳同样把书推进一步，故不分叉。
 */
export const EXPLORE_PASS_EFFECT =
	"点了它这份报告就此定下：书往前走一步，AI 照着它起草那几条学习目标，写好还要你确认。";

/**
 * 「✅ 通过，开始写最佳范例章」那颗主键的**后果说明**（票 11 补的六句之一 · 站 7）。
 *
 * ⚠️ 句子里**不带章号**：这一句是常量，而「哪一章当最佳范例章」由卡上那个下拉现选
 * （`pick`，卡内本地态）——契约的签名里没有它，硬插一个号就会与用户此刻选的那一章说岔。
 * 号由卡片自己那句现值说得更具体，本句只说这一步的后果。
 */
export const OUTLINE_PASS_EFFECT =
	"点了它这份安排就此定下：书往前走一步，AI 先把最佳范例章写出来给你过目。";

// ── 票 `ui-display-redesign/03`：读者情况问卷**整块移出卡**（spec §2.3 第 9 行）──────────────
//
// 票 `confirm-points-redesign-build/10` 在这里落过一块位置，票 `rcb-build/04`／`05` 又往里填过
// **收卷人三选一 ＋ AI 起草稿那一格 ＋「照 AI 起草的办」那颗键 ＋ 身份自述**。票 03 把整块移出：
// 卡内**零块**（收卷人、AI 草案、答问卷按键、身份句全随块离开），全部操作进顶栏那块
// 「🧑‍🎓 读者情况问卷」面板（面板三态归票 11）。卡底只留**一行**「这一版按什么成文」：
//
//   · 没有回卷：`本次按 AI 先验执行（还没有人答问卷）· 去答问卷`（入口仍走既有
//     `onOpenReaderQuestionnaire`，⛔ 不新开可点区域、不重做通道）；
//   · 有回卷：`按回卷成文（X 填的）`（X＝书上记着的收卷人 `meta.answerer`）。
//
// 数据来源照 spec §2.3 第 10 行：回卷件（随 `/textbook/events` 下发的 `readerQuestionnaireReturn`）
// ＋ `meta.answerer`。⚠️ 本票**不动** `explore-confirm` 的出口闭集与载荷形状（问卷载荷归票 11）：
// 那一行与推进键递出去的 `exit` 同源（盘上有回卷 ⇒ questionnaire），只是让屏上那句与真正发出去的
// 那一条出口不许说岔。

/**
 * 站 2 卡头的**主问题**（存量句，逐字沿用 `decisionOf("explore").question`）。
 *
 * ⚠️ 字面量必须住在**本文件**（票 01 立卡头行小件时的 API 约定）：人设「界面状态对照表」的
 * 逐字取证面只读卡片自己文件里的 `<strong>` 字面量／同文件 `const`；由共用件代造的字面量它看不见。
 * ⚠️ 与 `view-rules.decisionOf` 的那一句必须是**同一个值**（判据在 `test-component-cards` 的
 * 票 03 那一节逐字对账）——问句只有一句，⛔ 两处各写一半。
 */
export const EXPLORE_CARD_QUESTION = "AI 读到的材料重点对不对？";

/** 卡底那一行里「去答问卷」入口的可见文案（那一行唯一可点的东西；仍走既有面板入口）。 */
export const EXPLORE_READER_STANCE_GOTO_LABEL = "去答问卷";

/**
 * 探查确认卡的 props 契约（票 `workbench-card-contract` 02）
 *
 * **这张卡吃什么**：书级只读两件（`exploreSummary` / `knowledgeMapText`）+ 壳级可变的三件
 * （`busy` ＋ 票 08 的 `graphDropped` / `onGraphVerdict`：知识点图上那一份划痕与它唯一的入口）
 * + 壳注入的三件（`confirmExplore` / `onViewReport` / `readArtifact`）+ 一个**只由测试注入**的
 * `reportText`。收编前这七项由 `client-entry.js` 的 `case "explore"` 那一整块逐项手抄——「这张卡吃
 * 什么」的知识从此住在**这张卡旁边**：加一个输入不必再去动那个两千多行的壳。
 *
 * ### 必填三项的判据：卡内**没有兜底**，缺了会崩或会让那颗键静默死
 *
 * · `confirmExplore` → 整形成 prop `onConfirm` —— `:461` / `:483` 两处用户点击直接调它，没有 `?.`、
 *   没有 `if` 守卫。缺了 = 用户点「✅ 满意，继续设计」或「🔁 就这样重做」当场 TypeError。
 * · `onViewReport` —— `:505` 直接挂在「👀 看完整报告」的 `onClick` 上。缺了**不崩**，是那颗键点了
 *   什么都不发生——这正是本票要拆的那个形状（spec「问题」第 1 条：UI 回调假设壳会递值却无契约，
 *   漏了只静默降级），所以它必填。
 * · `readArtifact` —— `:182` 在挂载 effect 里**无条件**调。票 03 把「无当前书 ⇒ 不发请求」搬进了
 *   `ui/artifact-read.js`（在那里表现为一次 reject，落进本卡**同一条**降级路径），本卡不再自己判；
 *   缺了它 = effect 内当场 TypeError。
 *
 * ### `book` 的键不许撞名，prop 名由 `derive` 整形（壳那边定的全局规则，不是本卡的特例）
 *
 * `createCardView(book, slots)` 只有**一本扁平的 book**，而各卡的 prop 名域是重叠的：`onConfirm`
 * 这一个名字，本卡指的是壳的 `confirmExplore`，兄弟卡指的是壳的 `confirmOutline`——两个不同的函
 * 数。所以 book 侧取壳里**不撞名**的标识符，prop 名一字不改，由 `derive` 整形一次。
 * ✅ **这一位已经收成一道闸，不是一条纪律**：`.with({ onConfirm: … })` 当场抛 `CardViewError`——
 *   `build` 的 ③ 只认 `fromBook` ∪ `defaults` 里**声明过**的键，**不含** `derive` 产出的键。
 *   **为什么是闸**：整形是 `derive` 的职责，若 `.with` 改得动整形结果，同一个名字就有两处来源——
 *   那正是这张票要消灭的形状。要在调用处覆盖的值必须**声明**在 `fromBook` / `defaults` 里。
 *
 * ### 不列必填的三项：漏了会怎样静默降级（逐项写明，判据是**卡内自己有兜底**，本票一个字不改）
 *
 * · `exploreSummary` —— `:139` 的 `?? {}` 兜底。漏了不崩，但屏上那行会**说假话**：「来源材料 0 份 ·
 *   知识点 0 个 · 建议分 0 章」。⚠️ 这条 `?? {}` **不在**票 01 查实的那 6 处守卫清单里（那 6 处在
 *   `chapters-map.js` 五处，加上 `confirm-cards.js:85` 那处、已在票 03 随 URL 拼装一起收编掉），
 *   不许顺手删。
 * · `knowledgeMapText` —— `:153` 的 `typeof === "string"` 判据兜底：解析失败等同于没有清单，不渲
 *   染知识地图、不阻断确认流程。⚠️ 壳那一份**可以是 `null`**（`client-entry.js:458`
 *   `coreData === null ? null : coreData.knowledgeMap`）——`null` 是显式的「没有」，按缺省三规则
 *   第 2 条原样穿过，绝不被填成别的值。
 * · `busy` —— 全卡只作 `disabled` 用（`:462` / `:484` / `:506`）。漏了 = 按钮永不置灰，AI 干活时
 *   能重复点。它是**壳级可变 UI state**（`BookSessionScope` 的 `ui.busy`），不是书级快照，与其余
 *   11 个 slot 共用同一份。
 *
 * ✅ **死 prop `meta` 不在这份契约里**（票 02 取证：函数体里 `meta` 的唯一命中是 `:129` 那行**自陈
 *   「本卡不使用」的注释本身**，**可执行代码零命中**——判据是可执行引用，不是 grep 的命中数）。
 *   壳那一份随之停传：切走它不需要任何行为论证，因为卡内从头到尾没读过它。`:129` 那行注释也已同步
 *   改成同一句取证结论——**契约与卡体不许留一句与代码矛盾的注释**，所以两边一起改，不留尾巴。
 */
export const exploreConfirmCardView = defineCardView({
	card: "ExploreConfirmCard",
	fromBook: [
		// 票 `demo-channel-full/26`：本卡尾那句「不满意会怎样」要认得出演示书（两取值，
		// 出口＝`view-rules.exploreConfirmNote`）⇒ `meta` **重新进契约**。
		// ⚠️ 票 02 当年把它判成**死 prop**（函数体可执行代码零命中）是对的；本票让卡真读了它，
		// 那句「本卡不使用 meta」的注释同时作废（契约与卡体不许留一句与代码矛盾的注释）。
		"meta",
		"exploreSummary",
		"knowledgeMapText",
		"readArtifact",
		"confirmExplore",
		"onViewReport",
		"busy",
		// 票 `knowledge-graph-build/08`：图上那两颗裁决键的**接线**（这一块唯一会改状态的东西）。
		// ⚠️ 两个都是**必填的活口**、卡内没有兜底：`graphDropped` 是壳手上那一份划痕（缺了＝每张卡
		// 都画成「要讲」，与用户刚划过的事实相反），`onGraphVerdict` 是第三条「意见」通路的入口
		// （缺了＝三颗键点了什么都不发生——`KnowledgeGraphBlock` 那一侧对「没接」的表现是
		// **键照旧在、点了不翻**，不静默把键撤掉）。⇒ 它们列进 `fromBook`，壳漏传由
		// `test-card-views-coverage.mjs` 的契约×消费对账点名。
		"graphDropped",
		"onGraphVerdict",
		// 票 `knowledge-graph-build/09`：盘上那份**人的裁决产物**的原文（`工作区/knowledge-map-exclusions.json`，
		// 随 `/textbook/events` 下发）。它是「已经划掉了哪几条」的**史实**（壳手上那份 `graphDropped`
		// 只是本会话的快照，刷新就没了）⇒ 下面那一栏与两条读数都从它现算。
		"knowledgeMapExclusions",
		// 票 `confirm-points-redesign-build/10`：**预画的下沿**（问卷／分组面的结果先画到图上的
		// 那几条卡键）。它是**容量**不是内容——本卡只把它原样递给图那块（照「已经会」画出来，
		// 人在图上再调）；⚠️ 今天**生产上没有生产者**（回卷那一半归 rcb 的票 06／10）
		// ⇒ 壳不传、这一格恒缺省，图上照旧只有人自己划的那些。缺省时行为与今天逐字相同。
		"predrawnLowerBoundary",
		// 票 `rcb-build/04`：**本会话刚收下回卷**那一位（面板收卷成功那一刻由壳置 true）。
		// 票 `ui-display-redesign/03` 起它只服务卡底那一行「这一版按什么成文」＋推进键的出口判定
		// （与盘上那份回卷件是**同一件事的两个来源**：本会话刚收下、或刷新后仍躺在书夹里）。
		// ⚠️ 它只是**本会话**的回执（切书即归零）⇒ 「有回卷」还要看 `readerQuestionnaireReturn`，
		// 两件任一为真都按 `exit=questionnaire` 成文。
		"readerQuestionnaireSaved",
		// 票 `rcb-build/04`：「**去答问卷**」那一行的入口——打开顶栏那块「🧑‍🎓 读者情况问卷」面板
		// （⛔ 本卡不重做那套通道，只做入口；票 03 起只在「还没有回卷」那一态出现）。
		// 缺了＝那颗入口点了什么都不发生，所以列进必填。
		"onOpenReaderQuestionnaire",
		// 票 `rcb-build/09`：书夹里那份**回卷原件**（`工作区/读者情况回卷.md`）的原文——
		// 卡尾那一栏「这批条目拿不到读者输入」的**唯一新输入**（缺口＝从它 ＋ 合并件的
		// `readerSlices` ＋ 图上的裁决**现算**的派生读数）；票 `ui-display-redesign/03` 起它同时是
		// 卡底那一行「有回卷」的判据（spec §2.3 第 10 行的数据来源就是回卷件）。与
		// `knowledgeMapExclusions` 同一条路（⛔ 不经 `/textbook/file`）。
		// `null` ＝ 这本书还没有回卷 ⇒ 那一栏整块不渲染、卡底那行走「AI 先验」那一支。
		"readerQuestionnaireReturn",
	],
	required: ["confirmExplore", "onViewReport", "readArtifact", "onOpenReaderQuestionnaire"],
	defaults: {
		/**
		 * `reportText` —— **只由测试注入的口子**（`smoke-test.mjs:6020` 的 SSR 那一节：
		 * `renderToStaticMarkup` 跑不了 `useEffect`/fetch，于是把报告经这个 prop 注进去，断言
		 * 「报告区排在摘要行之前」）。
		 *
		 * ⚠️ **壳从不传它**（`client-entry.js` 的 `case "explore"` 那一整块没有这一项）。于是生产恒为
		 * 缺省值 `null`，`:165` 的 `useState` 初值与 `:169-171` 的 effect 早退**每次都不命中**，那个
		 * effect 每次跑都真的去读一次 `readArtifact("工作区/explore.md")`——**这不是 bug**，是那条
		 * 降级路径本来就该走的（票 03 之后 `project`/`session` 已退休，判据归 `artifact-read`）。
		 *
		 * 之所以**登记成 `defaults`、绝不列 `required`**：列了必填就是**逼壳去传它**，那才是行为
		 * 变更（凭空多出一个恒空的 prop，正是 `.scratch/dsh-contract-drift/` 记的那个形状）。
		 * 之所以**不把这个 prop 删掉**：删了会让冒烟那一节的报告置顶断言失真——那条断言证的是
		 * 「报告区早于摘要行」，它需要一条不联网的注入口。**登记比删除更有价值**。
		 *
		 * 缺省取 `null`（不是 `undefined`）：`:165` / `:169` 的判据都是
		 * `typeof … === "string" && … !== ""`，两种取值行为逐字一致，而只有 `null` 能把
		 * 「生产恒无、只此一处注入」这件事**写进契约本身**。
		 */
		reportText: null,
	},
	// 整形：壳里不撞名的 `confirmExplore` → 卡片真正消费的那个 `onConfirm`。理由见上面那一节。
	// ⚠️ `derive` **只拿得到一个参数**（此刻的袋子，`build` 的 ④）：delta 已排在它之前，所以从袋
	// 里读到的就是**最终值**，也是唯一正确的读法（拿不到「原始书切片」，两个读法会打架）。
	// 除此之外没有现算表达式——`onViewReport` 的闭包在壳里，不在这里重写：`viewWork` 不是卡片该
	// 认识的东西，袋里其余每一项都是壳原样递过来的值。
	derive: (bag) => ({ onConfirm: bag.confirmExplore }),
});

export function ExploreConfirmCard(props) {
	// 票 `demo-channel-full/26`：本卡尾那句「AI 会照着改」对演示书是假话（驳回只是把**同一份**
	// 探查报告原样再写一遍）⇒ 认得出演示书要 `meta`（出口＝`view-rules.exploreConfirmNote`）。
	// ⚠️ 票 02 那句「本卡不使用 meta」的取证已随本票作废——契约里的 `meta` 与这里一起加回来。
	const {
		meta,
		exploreSummary,
		knowledgeMapText,
		readArtifact,
		onConfirm,
		onViewReport,
		busy,
		reportText,
		// 票 `knowledge-graph-build/08`：图上那一份划痕（壳手上的）与它的入口。
		graphDropped,
		onGraphVerdict,
		// 票 `knowledge-graph-build/09`：盘上那份人的裁决的原文。
		knowledgeMapExclusions,
		// 票 `confirm-points-redesign-build/10`：**预画的下沿**（问卷／分组面 → 图）。原样转给图那块。
		predrawnLowerBoundary,
		// 票 `rcb-build/04`：回卷是否已收下（决定通用推进键走哪条出口）＋「答问卷」入口。
		readerQuestionnaireSaved,
		onOpenReaderQuestionnaire,
		// 票 `rcb-build/09`：书夹里那份**回卷原件**的原文（卡尾那一栏缺口的唯一新输入）。
		readerQuestionnaireReturn,
	} = props;
	const sum = exploreSummary ?? {};
	// 契约是 teachingFocus:[string]，但 AI 曾产出对象数组——归一化兜底，
	// 杜绝 `· ${item}` 把对象渲染成 [object Object]（2026-09 修复）。
	const focus = normalizeTeachingFocus(sum.teachingFocus);
	// ⚠️ 票 `confirm-points-redesign-build/04`：原先这里那个 `showPoints`（知识点清单的折叠口）
	// 随「合一」作废——那一块不再有折叠键，改成块里的一颗两分段控件（默认图）。
	const [showSections, setShowSections] = useState(false);
	// 票 `walkthrough-fixes/20`（2026-10-06 裁决「方向一」）：**读材料报告默认折叠**。
	//
	// 裁决之前那一屏的病：确认点那颗推进键埋在几千字报告底下（焦点区容器内 `top 2926`、
	// 容器高 `1165`，**要滚过约 2.9 个视口**）——而 2026-10-04 维护者已把当初那条
	// 「吸底决策条」整条删掉（同一颗键同屏渲染两次，用户原话「满意的那行位置不对」），
	// 于是那一屏既不滚、也没有第二出口。裁决**不是**再造第二出口，而是**把主出口请回首屏**：
	// 报告一收，推进键自然落到首屏里。
	//
	// ⚠️ **折叠治的是高度**（36em 行宽那一半归票 17，spec §G 明令两件不许互相顶替）；
	// ⚠️ **折叠是叠加不是替换**：不撤那两个折叠清单，也**不动**「👀 看完整报告」那颗键的
	// 入口位置与文案（ADR-0012 `:44` 明文冻结它，`smoke-test.mjs` 也逐字钉着）。
	// ⚠️ **折叠控件的热区身份 ＝ 纯展开收起**（`CONTEXT.md`「热区」八合法值之一）：它长成
	// 行内那颗 `<button>` 自己，**不是**「容器级 `onClick` 又展开又发动作」的整块热区
	// （spec 不变量 2；判据在 `test/test-component-cards.mjs` 的
	// `judgeReportFoldHotzone`——真渲染树、同屏收文本，正本与反证喂同一段）。
	//
	// ⚠️ 默认态**不做客户端持久化**（票面没裁这一件）：每次进屏都收起，按最小改动走。
	const [showReport, setShowReport] = useState(false);
	const [rejecting, setRejecting] = useState(false);
	const [reasons, setReasons] = useState([]);
	const [rejectNote, setRejectNote] = useState("");
	// 知识地图（工作区/knowledge-map.json）原文由父级随事件一起取回（它随 /textbook/events
	// 下发的 knowledgeMap 字段，见 workflow.js）：这是**机器产物**，`/textbook/file` 按
	// 「给人读的产物」收窄后已拒绝它（票 04）；它的人读形态是这张卡片内联的折叠清单（票 05）。
	// 解析失败等同于没有清单：不渲染知识地图清单、不阻断确认流程。
	// 📌 这份读取住在中性模块（票 `depth-review-2026-10/03`）——**只统一形状，措辞仍在本卡**。
	const km = parseKnowledgeMap(knowledgeMapText);
	// F30（2026-08-20 走查）：源探查报告（工作区/explore.md）——票 `ui-display-redesign/03` 起它
	// **不再置顶**，排在卡头（问句／里程碑／摘要句）与 AI 重点/难点之后、材料小节之前
	// （spec §2.3 第 6 块）。默认态仍是**收起**（票 20 的裁决不动：正文要点一下「▸ 展开全文」才铺出来，
	// 标题行两态都在）。
	// 有 reportText（父级/测试注入）直接用（含首次渲染）；否则按上面 knowledge-map 的
	// 同一方式拉取，读取失败不抛错、报告为空也不影响卡片其余功能（优雅降级）。
	const [report, setReport] = useState(() =>
		typeof reportText === "string" && reportText !== "" ? reportText : null,
	);
	useEffect(() => {
		let alive = true;
		if (typeof reportText === "string" && reportText !== "") {
			setReport(reportText);
			return undefined;
		}
		setReport(null);
		// 票 03：地址拼装归 `ui/artifact-read.js`（`createArtifactReader(...).readText`），
		// 本卡只给一个 `rel`。`project` / `session` 两个身份 prop 因此**退休**——它们原先只被用来
		// 拼那一条 URL。「无当前书 ⇒ 不发请求」这条判断也一并搬进那个 module：它在这里表现为一次
		// reject，落进下面**同一条**降级路径，不需要本卡再自己判一次。
		//
		// ⚠️ 错误策略**逐字保留**（票 03 收编的两条正当策略之一）：读不到就不显示报告区、
		// **不打断确认流程**。另一条在 `chapters-map.js`（显示错误条）。收敛时**不许把两条统一**——
		// 那是产品决定的收窄，不是重构。
		readArtifact("工作区/explore.md")
			.then((text) => {
				if (alive) setReport(text);
			})
			.catch(() => {
				/* 报告读不到就不显示报告区，不打断确认流程 */
			});
		return () => {
			alive = false;
		};
	}, [readArtifact, reportText]);
	const reportBlocks =
		report !== null && report !== "" ? exploreReportBlocks(report) : [];
	// 三份清单由中性模块那份形状读取给出来（`null` 时三份都是空数组，所以下面照旧直接用）。
	const kps = km === null ? [] : km.kps;
	const chapters = km === null ? [] : km.chapters;
	// ── 票 `knowledge-graph-build/09`：被剔除的那些卡（「一处口径」的第 ② 个读者） ──
	//
	// spec §9 的「一处口径、三处读者」：①覆盖闸门 ②**探查确认卡与 outline 确认卡**上那栏
	// 「本书必须覆盖的知识点（N 个）」 ③`outline` 交办。这里的 N 与①③**逐项相等**，因为三处读的是
	// **同一对纯函数**（`liveExclusionsOf` ＋ `effectiveKnowledgePoints`）——⛔ 不是各自过滤一遍
	// （本仓记着「漏改半边」那类实撞：只改闸门那一处，另外两处照旧报旧数）。
	//
	// 哪些裁决**今天还算数**：键没了、或键在而标题变了 ⇒ 陈旧（**该条不生效**，但⛔ 不整份失效）。
	// 陈旧那一档只是**非阻断读数**；形状坏了才是硬闸，而那道硬闸在 `outline` 交工那一跳。
	const exclusions = parseExclusionsDocument(knowledgeMapExclusions);
	const graphCards = km !== null && km.graph !== null ? km.graph.cards : [];
	const exclusionSplit = liveExclusionsOf(exclusions.items, graphCards);
	const keptPoints = effectiveKnowledgePoints(kps, exclusionSplit.live);
	const keptCount = keptPoints.length;
	// 图上那一份划痕 ＝ **盘上的史实**（刷新／切书之后仍在）∪ 本会话刚划下去的那一段
	// （壳手上那份 `graphDropped`，票 08 的 UI state）。⛔ 不删 `graphDropped`：票 08 的动作键（票 16 起四档）
	// 与它的读数都建在它上面；这里只是把两者并起来——长命的那个是盘上那一份。
	const droppedKeys = [
		...new Set([
			...exclusionKeysOf({ items: exclusionSplit.live }),
			...(Array.isArray(graphDropped) ? graphDropped : []),
		]),
	];
	const sections = km === null ? [] : km.materials;
	// ── 票 `rcb-build/09`：卡尾那一栏「缺口」的**派生读数**（⛔ 不落盘、⛔ 不新字段、⛔ 无状态位）──
	//
	// 三件输入全是**既有事实**：①回卷原件（随 payload 下发的那一份）②分组面（合并件的
	// `readerSlices`，缺席／坏形状时走**同一条**消费侧退化 `effectiveReaderSlices`——与问卷那条路
	// 读的是同一份视图）③图上的裁决（`exclusionSplit.live`，与上面「留下的集合」**同一次调用**）。
	// ⚠️ 它**只是读数**：⛔ 不触发剔除、⛔ 不拦放行、⛔ 不是第四条放行出口。没有缺口 ⇒ `null`。
	// ⚠️ **合并期的修整（票 `rcb-build/06`）**：这一格原先在这里**又内联 parse 了一遍**
	// `knowledgeMapText`（票 09 那一支留下的）——那正是 `test-phase-page.mjs` 那条「形状知识只此一份」
	// 判据点名的第二份 `JSON.parse`。⇒ 原始解析改走中性模块的 `parseKnowledgeMapRaw`
	// （兜底逐字同义：读不出来 ⇒ `null`），本文件不再出现任何 `JSON.parse`。
	const gapMerged = parseKnowledgeMapRaw(knowledgeMapText);
	const readerGap = readerGapReading({
		returnedText: readerQuestionnaireReturn,
		slices: effectiveReaderSlices(gapMerged).slices,
		exclusions: exclusionSplit.live,
	});
	// ── 票 `ui-display-redesign/03`：卡底那一行「这一版按什么成文」的**现算**（⛔ 不落盘、不新字段）──
	//
	// ① 「有回卷」＝**本会话刚收下**（`readerQuestionnaireSaved`，面板收卷成功那一刻置 true）
	//    **或盘上真有回卷件**（`readerQuestionnaireReturn` 是那份 `工作区/读者情况回卷.md` 的原文，
	//    随 `/textbook/events` 下发）——两件都是既有事实，后者让「刷新之后」也说得对（数据来源照
	//    spec §2.3 第 10 行：回卷件 ＋ `meta.answerer`）。
	// ② 推进键那一跳的出口与那一行**同源**：有回卷 ⇒ `questionnaire`；否则 `untouched`（没人动过）。
	//    ⚠️ 出口闭集与载荷形状本票一个字不改（问卷载荷归票 11）——这里只是不许「屏上说按回卷、
	//    发出去却记成没人动过」。
	// ③ `meta.answerer` 只**读**：书上记下的收卷人是史实（票 11 起由回卷动作写），那一行据此写出
	//    「谁填的」；没记下时只说「按回卷成文」，⛔ 不编一个名字。
	const questionnaireReturned =
		readerQuestionnaireSaved === true
		|| (typeof readerQuestionnaireReturn === "string" && readerQuestionnaireReturn.trim() !== "");
	const advanceExit = questionnaireReturned
		? EXPLORE_CONFIRM_EXITS.questionnaire
		: EXPLORE_CONFIRM_EXITS.untouched;
	const advanceKind = questionnaireReturned
		? EXPLORE_CONFIRM_STANCE_KINDS.human
		: EXPLORE_CONFIRM_STANCE_KINDS.aiPrior;
	const recordedAnswerer = EXPLORE_CONFIRM_ANSWERERS.includes(meta?.answerer) ? meta.answerer : null;
	// 卡头事实句＝卡内摘要那一句（spec §2.3 第 3 行：不另立第二条统计行）。
	// ⚠️ 句子强度是票 `pre-gold-build/08` 收敛过的（机器只判产物形状 ⇒ 说「处理完材料」不说
	// 「读懂了」；`sum.sources` 是**转换成功**的份数，不是上传原件份数）——本票只搬它的位置，⛔ 不改强度。
	const summaryLine =
		`AI 已处理完材料，整理出：转换成功的材料 ${sum.sources ?? 0} 份，知识点 ${sum.knowledgePoints ?? 0} 个，建议分 ${sum.chapterSuggestion ?? 0} 章。`;
	// 票 pgb04/04：**教法**（`teachingMethods[]`，「某个知识点怎么讲」那一层）——精读小助手逐源
	// 掏出来、机器拼进合并件。它**借下面那个已有的知识点折叠口**显示（⛔ 不新增折叠块：
	// 这一屏的容量问题在 seams §C4 记过），与另三份同一条降级口径（不是数组 / 读不出来 ⇒ 当作没有）。
	const methods = km === null ? [] : km.methods;
	const sectionTitles = (material) =>
		Array.isArray(material?.sections)
			? material.sections
					.map((s) => String(s?.title ?? ""))
					.filter((t) => t !== "")
			: [];
	// 票 17 · pipeline-wiring-gaps · ADR-0023：材料分量（standing）逐源声明——
	// AI 在各分片里逐源写的一句「这份材料在什么问题上说了算、在什么问题上不算数」，
	// 在材料清单里就地能看见，不是只躺在 JSON 里。旧夹具/单源书（可省）没有这个字段：
	// 不渲染空标签、不阻断确认流程（与上面三份清单同一条降级口径）。
	const standingText = (material) =>
		typeof material?.standing === "string" && material.standing.trim() !== ""
			? material.standing.trim()
			: null;
	// 票 `pre-gold-build/02`：材料行上第一次看得见**角色与依据**——它们逐字来自判定产物
	// （`工作区/材料判定.json`，机器在交工那一刻按 `num` 并进 `materials[]` 条目）。
	// 「缺就是缺」：没有这一键就不印那半句（⛔ 不补空值、⛔ 不回落 `meta.sources[].role`）。
	const roleText = (material) =>
		typeof material?.role === "string" && material.role.trim() !== ""
			? material.role.trim()
			: null;
	const basisText = (material) =>
		typeof material?.basis === "string" && material.basis.trim() !== ""
			? material.basis.trim()
			: null;
	const toggleReason = (reason) => {
		setReasons((prev) =>
			prev.includes(reason)
				? prev.filter((item) => item !== reason)
				: [...prev, reason],
		);
	};
	const cancelReject = () => {
		setRejecting(false);
		setReasons([]);
		setRejectNote("");
	};

	return createElement(
		"div",
		{ style: S.focus },
		// ── 卡头行（共用小件，票 01）：问句 → 里程碑标题（可选中间行 `lead`）→ 事实句 ─────────
		// 票 `ui-display-redesign/03` 的块序（spec §2.3 第 1–3 块）：
		// ① 卡头问句＝这一屏的主问题（**存量句**，逐字沿用 `decisionOf("explore").question`）；
		// ② 里程碑标题 `🔍 材料读完了！`＝存量抬头（6 处判据锚在它上面，⛔ 本票不改一个字）；
		// ③ 事实句＝卡内摘要那一句（⛔ 不另立第二条统计行）。
		// ⚠️ 问句字面量住在**本文件**（票 01 的 API 约定：人设取证面只读卡片自己文件的 `<strong>`）；
		// 字号/间距/颜色归共用件，⛔ 不在这里另写一份。
		createElement(CardHead, {
			question: createElement("strong", { style: CARD_HEAD_QUESTION_STYLE }, EXPLORE_CARD_QUESTION),
			lead: createElement("strong", { style: { fontSize: "13px" } }, "🔍 材料读完了！"),
			facts: summaryLine,
		}),
		// ── 票 `confirm-points-redesign-build/04`：`📚 AI 建议的章节安排（后续可再调）`那一块**删了** ──
		// 逐章安排归站 7、几章归站 6（06 §2 与 spec §3.2 站 2 逐字）——留在这儿就是**第三处真相**。
		// ⚠️ 那个数据字段（合并件的 `chapterSuggestion`）**没有变成孤儿**：它照旧有读者——
		//   ① 阶段页那份**就地折叠**（`machine-product-folds.foldKnowledgeMap` 的「📚 章节建议（N 章）」，
		//      另一副说法、另一处读法，措辞本来就与这张卡有意不同）；
		//   ② 上面那一块的**量级读数**（分母＝章数）与 `workflow.js` 给 `exploreSummary.chapterSuggestion`
		//      算的那个数（摘要句「建议分 N 章」）；
		//   ③ 合并件那一侧（`knowledge-map-assembly` 的逐字搬运族、形状闸、补图那一档的搬运）。
		// ⇒ 删的是这一块的**渲染**，⛔ 不是那个字段。
		// ── 合一（票 `confirm-points-redesign-build/04`）──────────────────────────────
		// 今天那两颗**并列的折叠键**（「▸ 知识点清单（N 个，点开看）」＋「▸ 知识点图（…）」）
		// 并成**一个块**：块里一颗两分段控件（`图｜清单`，**默认图**），图是主视图。
		// ⚠️ 那栏「本书必须覆盖的知识点」也并进同一个块（合一之前它与上面两处同屏三块）。
		// 详细口径与「为什么」写在下面 `ExplorePointsBlock` 的注释里。
		// ⚠️ 老书那一档（合并件没有图的两个键）照旧看得见清单：块在、只是没有「图」那一段。
		// 票 `ui-display-redesign/03`：整块**提到 AI 重点/难点之前**（spec §2.3 第 4 块）——
		// 先给「本书要覆盖哪些知识点」，再给 AI 自己挑的重点。
		kps.length > 0 || methods.length > 0 || (km !== null && km.graph !== null)
			? createElement(ExplorePointsBlock, {
					key: "points",
					kps,
					methods,
					graph: km === null ? null : km.graph,
					// 合并件（喂那条「本次扫面 N 条边」的读数；`null` ＝ 拿不到）
					merged: km === null || km.graph === null
						? null
						: {
								knowledgePoints: kps,
								materials: km.materials,
								chapterSuggestion: chapters,
								cards: km.graph.cards,
								edges: km.graph.edges,
							},
					// 票 09：量级／「已剔除·已失效」三条读数的**现算值**——与覆盖闸门、
					// `outline` 交办读的是同一份集合（`keptCount` 就是那个 N）。
					keptCount,
					live: exclusionSplit.live,
					stale: exclusionSplit.stale,
					problems: exclusions.problems,
					chapterCount: chapters.length,
					// 票 08：图上／清单上那两颗裁决键的**同一个入口**（两条走同一条 `graph-opinion`）。
					droppedKeys,
					// 票 `confirm-points-redesign-build/10`：承接下来、先画到图上的那条下沿。
					predrawn: Array.isArray(predrawnLowerBoundary) ? predrawnLowerBoundary : [],
					onVerdict: onGraphVerdict,
					busy,
				})
			: null,
		// ── AI 重点/难点（〔首〕）：票 `ui-display-redesign/03` 跟着知识点那一块（第 5 块）──────
		focus.length > 0
			? createElement(
					"div",
					{
						style: {
							margin: "4px 0 8px",
							padding: "8px 10px",
							background: "var(--dsw-alias-bg-layer-1)",
							borderRadius: "8px",
							border: "1px solid var(--dsw-alias-border-l2)",
						},
					},
					createElement(
						"p",
						{ style: { margin: "0 0 4px", fontSize: "12px", opacity: 0.8 } },
						"AI 判断的重点/难点：",
					),
					focus.map((item, index) =>
						createElement(
							"div",
							{ key: index, style: { fontSize: "12px", margin: "2px 0" } },
							`· ${item}`,
						),
					),
				)
			: null,
		// ── 读材料报告〔折〕：票 `ui-display-redesign/03` 把这一块从「置顶」移到第 6 块──────
		// 票 20（裁决 2026-10-06）：报告**默认收起**——那一行小标题照旧在（收起态也看得见
		// 「这一屏有一份读材料报告」），正文要那一颗**纯展开收起**的键点开才铺出来。
		reportBlocks.length > 0
			? createElement(
					"div",
					{ style: { ...S.card, marginBottom: "10px" } },
					createElement(
						"p",
						{ style: { margin: "0 0 6px", fontSize: "12px", opacity: 0.8 } },
						"📋 读材料报告（AI 通读后的完整记录）：",
					),
					createElement(
						"button",
						{
							style: S.smallLink,
							onClick: () => setShowReport(!showReport),
							"aria-expanded": showReport,
						},
						showReport ? "▾ 收起全文" : "▸ 展开全文",
					),
					showReport
						? createElement("div", { style: { marginTop: "6px" } }, ...reportBlocks)
						: null,
				)
			: null,
		sections.length > 0
			? createElement(
					"div",
					{ style: { margin: "4px 0 8px" } },
					createElement(
						"button",
						{
							style: S.smallLink,
							onClick: () => setShowSections(!showSections),
						},
						// 票 09：量词「份」只管材料，「本」留给「书」——这两句数的是材料。
						showSections
							? "▾ 收起每份材料里读到的小节"
							: "▸ 每份材料里读到的小节（点开看）",
					),
					showSections
						? createElement(
								"div",
								{
									style: {
										marginTop: "6px",
										padding: "8px 10px",
										background: "var(--dsw-alias-bg-layer-1)",
										borderRadius: "8px",
										border: "1px solid var(--dsw-alias-border-l2)",
									},
								},
								sections.map((material, index) => {
									const titles = sectionTitles(material);
									const standing = standingText(material);
									const role = roleText(material);
									const basis = basisText(material);
									return createElement(
										"div",
										{
											key: index,
											style: { fontSize: "12px", margin: "2px 0" },
										},
										`资料${material?.num ?? index + 1}：`,
										createElement(
											"span",
											{ style: { opacity: 0.8 } },
											titles.join(" / ") || "（未读到小节标题）",
										),
										// 票 `pre-gold-build/02`：**角色 ＋ 依据**落在这**同一行**里
										// （⛔ 不新增折叠块——这一屏的容量问题在 `seams.md` §C4 记过）。
										// ⚠️ 措辞与折叠那一份（`foldKnowledgeMap` 的「📄 材料小节」）
										// 有意不同：「数据同源、措辞各自成篇」是既有裁决。
										role !== null
											? createElement(
													"div",
													{ style: { opacity: 0.75, marginTop: "1px" } },
													`角色：${role}${basis === null ? "" : `（依据：${basis}）`}`,
												)
											: null,
										standing !== null
											? createElement(
													"div",
													{ style: { opacity: 0.75, marginTop: "1px" } },
													`分量声明：${standing}`,
												)
											: null,
									);
								}),
							)
						: null,
					)
				: null,
			// 票 `ui-display-redesign/03`：~~师生合版独有内容比对~~折叠块**删除**（spec §2.3 第 8 行）——
			// 内容**不丢**：它仍在那份「读材料报告」的全文里（`工作区/explore.md` 的「教师用书独有内容」
			// 小节；报告折叠块与「👀 看完整报告」都能看到）。原来那一块是「长报告之外的第二个出口」，
			// 票 03 把报告移到这里之后两处读法已经相邻，再单列一块就是同一件事说两遍。
			// ── 票 `ui-display-redesign/03`：卡底前那一行「这一版按什么成文」──────────────────
			// 卡内问卷块**整块移出**（spec §2.3 第 9 行）：收卷人第一问、AI 起草稿那一格、
			// 「照 AI 起草的办」、身份自述全随块离开；卡底只剩这一行（入口只在顶栏面板）。
			// · 没有回卷：`本次按 AI 先验执行（还没有人答问卷）· 去答问卷`（入口仍走既有
			//   `onOpenReaderQuestionnaire`，⛔ 不新开可点区域、不重做通道）；
			// · 有回卷：`按回卷成文（X 填的）`（X＝书上记着的收卷人；没记下就只说「按回卷成文」）。
			// 把手两格：`data-reader-stance`＝推进键那一跳会走的**出口**（untouched／questionnaire），
			// `data-reader-stance-kind`＝身份档（ai-prior／human）——与 `advanceExit` **同源**，
			// ⛔ 不是第二套判据。
			createElement(
				"p",
				{
					"data-reader-stance": advanceExit,
					"data-reader-stance-kind": advanceKind,
					style: { margin: "6px 0 4px", fontSize: "12px", fontWeight: 600, opacity: 0.9 },
				},
				questionnaireReturned
					? `按回卷成文${recordedAnswerer === null ? "" : `（${recordedAnswerer}填的）`}`
					: `${EXPLORE_CONFIRM_AI_PRIOR_STATEMENT}（还没有人答问卷）`,
				questionnaireReturned ? null : "，",
				questionnaireReturned
					? null
					: createElement(
							"button",
							{
								"data-open-reader-questionnaire": "1",
								style: S.disabled(S.smallLink, busy),
								disabled: busy,
								onClick: onOpenReaderQuestionnaire,
							},
							EXPLORE_READER_STANCE_GOTO_LABEL,
						),
			),
			createElement(
				"p",
				{ style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
				// 票 `demo-channel-full/26`：末句「AI 会照着改」对演示书是假话（同探针 `acts` 段①：
				// 报告 mtime 变了、sha 前后一致，用户那句只落 `meta.exploreRedoNote`）⇒ 两取值。
				exploreConfirmNote(meta),
			),
		rejecting
			? createElement(
					"div",
					{
						style: {
							marginTop: "10px",
							borderTop: "1px dashed var(--dsw-alias-border-l2)",
							paddingTop: "8px",
						},
					},
					createElement(
						"p",
						{ style: { margin: "0 0 6px", fontWeight: 600 } },
						// 票 14（承诺账 D「说不清」第 7 条）：「10 秒」估的是用户自己的操作成本、
						// 不是系统耗时，代码里断不了真假——收掉这个数字（点选或写一句本身已经够短）。
						"哪里不满意？（点选或写一句）",
					),
					createElement(
						"div",
						{ style: { margin: "6px 0" } },
						RE_EXPLORE_REASONS.map((reason) =>
							createElement(
								"label",
								{ key: reason, style: S.checkItem },
								createElement("input", {
									type: "checkbox",
									checked: reasons.includes(reason),
									onChange: () => toggleReason(reason),
								}),
								` ${reason}`,
							),
						),
					),
					createElement("textarea", {
						style: S.textarea,
						placeholder: "想多说一句？在这里写（可选）",
						value: rejectNote,
						onChange: (e) => setRejectNote(e.target.value),
					}),
					createElement(
						"div",
						{ style: { marginTop: "8px", display: "flex", gap: "8px" } },
						createElement(
							"button",
							{
								style: S.disabled(S.bigBtn(false), busy),
								// 票 `rcb-build/04`：驳回那一支**不**带出口读数——它不是一次放行；那一次
								// 表态（含收卷人）若已发生，仍留在结论件与 `meta.answerer` 的既有位置上
								// （「驳回也留」那条纪律管的是结论件本身，⛔ 不把驳回冒充成一条放行出口）。
								onClick: () => onConfirm(false, { reasons, note: rejectNote }),
								disabled: busy,
							},
							EXPLORE_CONFIRM_REWRITE_CONFIRM_LABEL,
						),
						createElement(
							"button",
							{
								style: { ...S.smallLink, textDecoration: "none" },
								onClick: cancelReject,
							},
							"取消",
						),
					),
				)
			: createElement(
					"div",
					// 票 `walkthrough-fixes/38`：这三颗（确认／重做／看完整报告）是**这一屏的主推进键行**——
					// 它们跟着卡片滚，卡片一高出焦点区可视带，主推进键就整颗掉到带外（实测键顶距带顶 914px、
					// 带高只有 425.5px）。⇒ 用公共那一格 `S.stickyActions` 贴住带底。
					// ⚠️ 同屏**不新增**任何可点区域：贴上来的就是**本来这三颗**，只是让这一行在卡滚时停在带底。
					// ⛔ 不是票 18 删掉的那条「在卡外另起一条、条上放同名副本」的吸底条（同屏两颗同名键）。
					// 口径与「为什么不是把卡自动滚进去」写在 `styles.js` 那一格的头注释里。
					// ⚠️ 本票只给站 2 这一屏上（票 20 那句「不要一次改全部」照旧成立）：章节安排那一张（本文件
					// 后面 `OUTLINE_CONFIRM_ACCEPT_LABEL` 那一支）不动。
					{ style: { ...S.stickyActions, display: "flex", gap: "8px", flexWrap: "wrap" } },
					createElement(
						"button",
						{
							style: S.disabled(S.bigBtn(true), busy),
							// 票 `ui-display-redesign/03`：拍板这一跳带上**这一次表态的出口读数**（`feedback.exit`）——
							// 壳经共享件的 `exploreConfirmPayload()` 把它落成 `values`，服务端再写进既有结论件
							// 的 `values`（⛔ 不新产物、⛔ 不新 meta 键）。
							// ⚠️ 出口与卡底那一行**同源**（`advanceExit`）：盘上有回卷 ⇒ `questionnaire`，否则
							// `untouched`。收卷人那一格**不随这一跳走**——卡内已没有收卷人选择，旧的
							// `values.answerer` 发射点随问卷块一起离开（写点挪到回卷动作归票 11）。
							onClick: () => onConfirm(true, { exit: advanceExit }),
							disabled: busy,
							// 票 `auto-walkthrough/04`：关键键的语义钩子（票 20／18 的事故键，文案重名）。
							"data-explore-confirm": "1",
						},
						EXPLORE_CONFIRM_ACCEPT_LABEL,
					),
					createElement(
						"button",
						{
							style: S.disabled({
								...S.bigBtn(true),
								background: "transparent",
								color: "var(--dsw-alias-state-error-primary)",
							}, busy),
							onClick: () => setRejecting(true),
							disabled: busy,
						},
						EXPLORE_CONFIRM_REWRITE_LABEL,
					),
					createElement(
						"button",
						{
							style: S.disabled({ ...S.smallLink, textDecoration: "none" }, busy),
							onClick: onViewReport,
							disabled: busy,
						},
						"👀 看完整报告",
					),
				),
		// ── 票 `rcb-build/09`：卡尾那一栏「缺口」（**独立一块**，⛔ 不住上面问卷那一块里）──────
		// 它是**派生读数**的呈现：片级一条 ＋「本片 N 条」，三类各占各的区，每条旁挂
		// **图上逐卡划**那颗能走的动作。没有缺口 ⇒ 那个组件自己 `return null`（整块不渲染）。
		// ⚠️ 它**不是闸、不是出口**：不落剔除记录、不触发剔除、不拦放行（读数的下游只有人眼）。
		createElement(ReaderGapBlock, { key: "reader-gap", reading: readerGap }),
	);
}

// ── 站 2 那一块：**清单与图合一**（票 `confirm-points-redesign-build/04`）──────────

/** 分段控件那两段的可见文案（唯一出口，⛔ 不在别处再抄一遍）。 */
export const EXPLORE_POINTS_VIEWS = Object.freeze([
	Object.freeze({ id: "graph", label: "图" }),
	Object.freeze({ id: "list", label: "清单" }),
]);

/**
 * **内滚封顶那个高度**（px）——「那一块**最多**长这么高，多出来的自己滚」。
 *
 * ## 920 是怎么来的（票 `knowledge-graph-step/17`；维护者 2026-10-30 口径「抬高上限到能容纳 6 层卡」）
 *
 * ⛔ 它是 `maxHeight`，**不是固定高度**：盒高由内容决定——短书贴着卡收（`scrollHeight === clientHeight`，
 * 一个内滚条都不出现），只有超过 6 层才顶到 920 内滚。
 *
 * 算式按 `KG_LAYOUT`（`src/ui/knowledge-graph-map.js`）的**最坏情况**推：
 * 卡高 ＝ `headPx + 标题行数 × lineHeight` ⇒ 三行标题 ＝ `32 + 3×15` ＝ 77；
 * 层距 ＝ 卡高 ＋ `gapY` ＝ `77 + 52` ＝ 129。
 * 盒内画布顶部还有一圈表头（图例 33 ＋ 下沿读数 25 ＋ 上沿读数 25 ＋ 划子说明 29），
 * 实测首层卡顶距盒顶 **134～144px**（取最坏 144）。
 * `144 + 6 × 129 = 918` 是**第 7 层卡顶**（第 6 层卡底 ＝ `144 + 5 × 129 + 77 = 866`）；
 * 取 **920** ⇒ 第 6 层完整、第 7 层被盒底切开。
 * 同一本书文案变短（层距 99／114）时会有富余，那是允许的；⛔ 不许为了「刚好 6 层」去改卡高或层距。
 *
 * ⚠️ 直接后果（接受）：长书（> 6 层）顶到 920 时，盒子会高于常见窗口——读者得先滚页面才看得到盒底；
 * 盒内仍有内滚条（内容超过 920 时），所以是「页面 ＋ 盒」两条竖向滚动，不是「只剩页面一条」。
 * 短书仍贴着内容收。⛔ 不要自作主张加 `vh` 兜底或 `min(920, 视口)` 收口（要改另开票）。
 *
 * ⚠️ 换这个数仍是**人工裁决**：它决定「最多完整放下几层」。改完照 `ADR-0035` 回写原票的 `## Comments`
 * （2026-10-30 的 360→920 已回写 spec §5 与票 12 的 `## Comments`）。
 */
export const EXPLORE_POINTS_VIEW_MAX_HEIGHT = 920;

/**
 * 站 2 那张卡上「本书必须覆盖的知识点」那一块——**清单与图合一**。
 *
 * ## 它取代了什么（今天那三块并成这一块）
 *
 * 合一之前同一张卡上并排长着三块：`▸ 知识点清单（N 个，点开看）`（折叠）、
 * `🧭 本书必须覆盖的知识点（N 个）`（常显）、`▸ 知识点图（N 张卡 · M 条箭头，点开看）`（折叠）。
 * 现在只有这一块：一句抬头 ＋ **一颗两分段控件（`图｜清单`，默认图）** ＋ 那一块的读数 ＋
 * 底下一个**内滚封顶**的视图区（挂哪一份视图由控件决定）。
 *
 * ## 两个视图**都给**「划掉」入口，两条走**同一条**通路
 *
 * · 图上：沿用那个点卡对话框里的 `🗑 这部分不造进书里`（四档动作键，`KG_DIALOG_KEYS` 一个字不改）；
 * · 清单上：**只有两端**（`frontier`／`upper`）那一行有一颗同文案的键；中段（`keep`）⛔ 不摆
 *   （与图上的「点开只读」同一条判据）。没有图的**旧书**照旧每行一颗——那里没有前沿可判，
 *   清单是唯一的入口。
 * 两条最终都调**同一个** `onVerdict(key, verdict)`（＝壳的 `graph-opinion`，载荷 `{key, verdict}`
 * **一个字不改**）——清单那一行只是多一个派发点，⛔ 不是第二条通路。
 * ⚠️ **清单那一行怎么拿到卡键**：`graph-opinion` 只认**卡键**，而清单列的是知识点；两串用
 * **闸门那把尺子**（`normalizeKnowledgePointTitle`）比对，卡名归一化后等于知识点 title 就配上了。
 * ⚠️ **配不上卡键的那一行不摆键**（机器那边会 400「图上没有这张卡」）——今天合并件里
 * 卡↔知识点是 1:1（形状闸的双射那一条），配不上只可能是坏形状的书；那种书上宁可少一颗键，
 * 也不给一颗点了必错的键。
 *
 * ## 已否的卡**仍在原地**（灰 ＋ 虚线 ＋ 删除线）
 *
 * 「划掉＝不造，不是从图上删」：清单那一行不消失，只变灰＋虚线＋删除线；那一行那颗键同时
 * 从「划掉」换成「↩ 放回来（要讲）」（与图上对话框第三档同一句文案，同一个动作的反向载荷）。
 *
 * ## 内滚封顶
 *
 * `maxHeight` 只加在**视图区**上（抬头／控件／读数不进那个滚动盒）——两百张卡时那三颗推进键
 * 仍在首屏内。⚠️ 封顶**不吃**「已否的卡仍在原地」那一条：滚动盒里照旧画全量（含已否那几张）。
 *
 * ## 它不证明什么（`dev-gate-scan/17` 的窄处）
 *
 * 无 DOM、无排版引擎 ⇒ 「三颗键在不在首屏内」「灰／虚线／删除线好不好认」在这里**一个字都不量**，
 * 归人工边界（`ADR-0035` 画廊）。这里只断「哪一段该在、两颗键各发什么载荷」。
 */
export function ExplorePointsBlock(props) {
	const {
		kps,
		methods,
		graph,
		merged,
		keptCount,
		live,
		stale,
		problems,
		chapterCount,
		droppedKeys,
		// 票 `confirm-points-redesign-build/10`：预画的下沿（问卷／分组面画上来的那几条卡键）。
		predrawn,
		onVerdict,
		busy,
	} = props;
	const cards = graph === null || graph === undefined ? [] : graph.cards;
	const edges = graph === null || graph === undefined ? [] : graph.edges;
	const hasGraph = graph !== null && graph !== undefined;
	// 默认视图＝**图**（spec §3.2 站 2 第 ② 块）；老书那一档没有图 ⇒ 只有清单可看。
	const [view, setView] = useState(hasGraph ? "graph" : "list");
	// 票 `ui-display-redesign/12`：**窄到放不下**（滚动盒 <190px）⇒ 自动切「清单」，⛔ 不硬塞。
	// 量的是**这个滚动盒自己**的 `clientWidth`——它已扣掉纵向滚动条，与图本体量的是同一只盒子
	// （`KnowledgeGraphView` 也是按它画），所以「画不画得下」这里与那里是同一把尺子。
	// ⚠️ 量不到（Node 侧无排版引擎／首帧）时不算窄 ⇒ 照请求的那一支（`kgPointsView()` 的口径）。
	const bodyRef = useRef(null);
	const [viewWidth, setViewWidth] = useState(null);
	useEffect(() => {
		const node = bodyRef.current;
		if (node === null) return undefined;
		const measure = () => setViewWidth(measureKgViewportWidth(node));
		measure();
		if (typeof ResizeObserver === "function") {
			const observer = new ResizeObserver(measure);
			observer.observe(node);
			return () => observer.disconnect();
		}
		if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
			window.addEventListener("resize", measure);
			return () => window.removeEventListener("resize", measure);
		}
		return undefined;
	}, []);
	const narrow = hasGraph && kgViewportIsNarrow(viewWidth);
	const shown = kgPointsView({ hasGraph, requested: view, measuredWidth: viewWidth });

	const rows = Array.isArray(kps) ? kps : [];
	const methodRows = Array.isArray(methods) ? methods : [];
	const dropped = Array.isArray(droppedKeys) ? droppedKeys : [];
	// 卡名 → 卡键（归一化后相等才算；第一张赢，与闸门「首个原样 title」同一读法）。
	const cardKeyOfTitle = new Map();
	for (const card of cards) {
		const key = normalizeKnowledgePointTitle(typeof card?.name === "string" ? card.name : "");
		if (key !== "" && !cardKeyOfTitle.has(key)) cardKeyOfTitle.set(key, card.key);
	}
	// 「已否」的两条来路：盘上还算数的那份裁决（按 title）＋ 本会话刚划的（按卡键）。
	const liveKeys = new Set(exclusionKeysOf({ items: Array.isArray(live) ? live : [] }));
	const liveTitles = new Set(
		(Array.isArray(live) ? live : []).map((item) => normalizeKnowledgePointTitle(item?.title)).filter((t) => t !== ""),
	);
	const isDropped = (cardKey, titleKey) =>
		(cardKey !== undefined && (liveKeys.has(cardKey) || dropped.includes(cardKey)))
		|| (titleKey !== "" && liveTitles.has(titleKey));
	// 票 16：清单那一行的撤销键也**只给两端**（下沿前沿／上端前沿）。没有图的旧书照旧每条都能划
	// ——那里没有前沿可判，清单是唯一的入口（⛔ 不因为这条把老书的划掉能力收掉）。
	const droppedForModel = cards
		.filter((card) => isDropped(card.key, normalizeKnowledgePointTitle(card.name)))
		.map((card) => card.key);
	const graphModel = hasGraph ? knowledgeGraphModel({ cards, edges, dropped: droppedForModel }) : null;
	/**
	 * 清单一行那颗键：已否 ⇒ 放回；没划掉的只在两端（`frontier`／`upper`）给「划掉」；
	 * 中段（`keep`）⇒ `null`（与图上点开只读同一条判据）。没有图的旧书（`graphModel === null`）
	 * 照旧每行给「划掉」——那里没有前沿可判，清单是唯一的入口。
	 */
	const rowAction = (cardKey, droppedRow, rowState) => {
		if (cardKey === undefined) return null;
		const restoring = droppedRow === true;
		if (!restoring && graphModel !== null && rowState !== "frontier" && rowState !== "upper") return null;
		const verdict = restoring ? KG_VERDICTS.keep : KG_VERDICTS.drop;
		return createElement(
			"button",
			{
				type: "button",
				style: S.disabled(S.smallLink, busy === true),
				disabled: busy === true,
				"data-kg-point-key": cardKey,
				onClick: () => {
					// 与图上那一支**同一个载荷、同一个入口**（`graph-opinion`）：
					// ⛔ 不做乐观更新——屏上的「已否」由壳递回来的划痕画出来。
					// 票 `confirm-points-redesign-build/10`：理由档**显式**给 `不需要`；
					// 「已经会」那一档归图上那把划子。票 16：只有两端走得到「划掉」这一支。
					if (typeof onVerdict !== "function") return;
					Promise.resolve(onVerdict(cardKey, verdict, EXCLUSION_REASON_NOT_NEEDED))
						.catch(() => { /* 通路自己把错误写进工作台错误条（壳那一层）；这里不改任何状态 */ });
				},
			},
			restoring ? KG_DIALOG_KEYS.restore : KG_DIALOG_KEYS.drop,
		);
	};

	const readings = edgeScanReading(merged);
	const magnitude = magnitudeReading({ kept: keptCount, chapters: chapterCount });
	const staleNote = exclusionStaleReading(stale);
	// 票 `rcb-build/06`：那条**如实说明**的 N ＝ 还算数的、理由为「已经会」的条数（**现算**）。
	// ⚠️ 它与「图上划子划的那批」**分不开**（记录里有意没有「哪条从哪来」这一格）⇒ 说明句里把这条
	// 窄处一起说出来，⛔ 不冒充「这 N 条全是从回卷件来的」，也⛔ 不冒充「你在这张图上点过」。
	const alreadyKnownLive = (Array.isArray(live) ? live : [])
		.filter((item) => item?.reason === EXCLUSION_REASON_ALREADY_KNOWN);

	const segStyle = (active) => ({
		border: active ? "none" : "1px solid var(--dsw-alias-border-l2)",
		borderRadius: "6px",
		padding: "4px 14px",
		fontSize: "12px",
		fontWeight: active ? 600 : 400,
		cursor: "pointer",
		background: active ? "var(--dsw-alias-state-business-primary)" : "transparent",
		color: active ? "var(--dsw-alias-label-primary-foreground)" : "inherit",
	});
	const rowStyle = (droppedRow) => ({
		fontSize: "12px",
		margin: "2px 0",
		padding: "3px 6px",
		borderRadius: "6px",
		display: "flex",
		gap: "8px",
		alignItems: "baseline",
		justifyContent: "space-between",
		// 「已否」那一档的形状：灰 ＋ 虚线 ＋ 删除线（与图上的 `KG_CARD_TONES.dropped` 同一副样子）。
		background: droppedRow ? "var(--dsw-alias-bg-skeleton)" : "transparent",
		border: droppedRow ? "1px dashed var(--dsw-alias-border-l2)" : "1px solid transparent",
		opacity: droppedRow ? 0.65 : 1,
		textDecoration: droppedRow ? "line-through" : "none",
	});

	return createElement(
		"div",
		{
			style: {
				margin: "4px 0 8px",
				padding: "8px 10px",
				background: "var(--dsw-alias-bg-layer-1)",
				borderRadius: "8px",
				border: "1px solid var(--dsw-alias-border-l2)",
				fontSize: "12px",
			},
			"data-kg-merged": "1",
			"data-kg-view": shown,
			"data-kg-exclusions": "1",
			"data-kg-exclusions-kept": String(keptCount),
			"data-kg-exclusions-dropped": String(Array.isArray(live) ? live.length : 0),
			"data-kg-exclusions-stale": String(Array.isArray(stale) ? stale.length : 0),
		},
		createElement(
			"div",
			{ style: { fontWeight: 600, margin: "0 0 4px" }, "data-kg-heading": "1" },
			// 票 `confirm-points-redesign-build/04`：那一块**只报一个数**——`还剩 K 个`（＝覆盖闸门读的
			// 同一份集合）＋`共 N 个`（这份合并件上有几条知识点）＋`已划掉 M 条`（那份件里还算数的条目）。
			// ⚠️ 合一之前这里是两处**不同源**的读数（清单那颗折叠键报 `kps.length`、
			// 这一栏报 `keptCount`）⇒ 现在只有这一处。
			`🧭 本书必须覆盖的知识点（还剩 ${keptCount} 个，共 ${rows.length} 个，已划掉 ${Array.isArray(live) ? live.length : 0} 条）——每条都要有章节认领：`,
		),
		// 两颗分段键：一颗控件、两段。⛔ 今天那两颗**并列的折叠键不再存在**。
		createElement(
			"div",
			{ style: { display: "flex", gap: "4px", margin: "4px 0 6px" }, role: "group", "data-kg-view-switch": "1" },
			// 票 `ui-display-redesign/12`：窄到放不下时**只提供清单这一段**——摆一颗「图」段而点了
			// 也只会被自动切回清单，那是给了一颗点了不翻的键。
			...EXPLORE_POINTS_VIEWS.filter((one) => one.id === "list" || (hasGraph && !narrow)).map((one) =>
				createElement(
					"button",
					{
						key: one.id,
						type: "button",
						style: segStyle(shown === one.id),
						"data-kg-view-option": one.id,
						"aria-pressed": shown === one.id,
						onClick: () => setView(one.id),
					},
					one.label,
				),
			),
		),
		createElement(
			"div",
			{ style: { margin: "2px 0", opacity: 0.85 }, "data-kg-exclusions-note": "1" },
			Array.isArray(live) && live.length === 0
				? "· 还没有人划掉任何一条。"
				: `· 人已划掉 ${Array.isArray(live) ? live.length : 0} 条，它们不在这 ${keptCount} 条里：${(Array.isArray(live) ? live : []).map((item) => item.title).join("、")}`,
		),
		// ── 票 `rcb-build/06`：三条如实说明（⛔ 都不是新事实源，全是**现算**读数）──────────────
		// ⚠️ 票 `ui-systematic-fixes/01` 起这三条走**正文出口**（`bodyOf` · spec §3）：`**重点**`
		//    变成真加粗（原来连着星号一起印在屏上），而**机器路径不占正文**——它只进悬停提示
		//    （见下面第三条那个 `title`；§3·2「机器 id 与路径只许进悬停提示」）。
		// ① 出处那一句（ADR-0040 决策 3 的第 3 条护栏）：N ＝ 还算数的「已经会」条数。
		//    ⛔ 不冒充「你在这张图上点过」；同时把那条**无法区分**的窄处说出来——记录里
		//    **有意**没有「哪条从哪来」这一格（⛔ 不给条目加归属字段），所以这一行**不替它们分归属**。
		alreadyKnownLive.length === 0
			? null
			: createElement(
					"div",
					{ style: { margin: "2px 0", opacity: 0.85 }, "data-kg-exclusions-source-note": "1" },
					...bodyOf(
						`· 这 ${alreadyKnownLive.length} 条（理由＝「${EXCLUSION_REASON_ALREADY_KNOWN}」）是**照你回卷件上的勾选**记的`
						+ "——⛔ 不是「你在这张图上点过」。图上你自己划的那批也落在同一份记录里，这一行不替它们分归属"
						+ "（记录里有意不存「哪条从哪来」这一格）。",
						BODY_KIND_MARKDOWN,
					),
				),
		// ② 已知窄处（spec §2.2／ADR-0040 决策 1 的自陈）：剔除按 `title` 归一化后相等判。
		Array.isArray(live) && live.length > 0
			? createElement(
					"div",
					{ style: { margin: "2px 0", opacity: 0.85 }, "data-kg-exclusions-title-note": "1" },
					...bodyOf(
						"· 已知窄处：剔除按知识点 title 归一化后相等判 ⇒ **同一个 title 的多条会一起被剔**"
						+ "（闸门唯一那把尺子就是 title；想逐条剔得先给覆盖闸门加第二个键）。",
						BODY_KIND_MARKDOWN,
					),
				)
			: null,
		// ③ 回退下场（票 `rcb-build/06` 二选一选定「**不随回退走**」）：如实说出后果与代价。
		//    ⚠️ 叙述里**不写机器路径**（§3·2 正文只印人读的那半）：两个件名进 `title` 悬停。
		Array.isArray(live) && live.length > 0
			? createElement(
					"div",
					{
						style: { margin: "2px 0", opacity: 0.85 },
						"data-kg-exclusions-rollback-note": "1",
						title: `机器件：${DECISION_DIR_REL}/NN.json（回退搬走的那一族）；${KNOWLEDGE_MAP_EXCLUSIONS_REL}（不随回退走）`,
					},
					...bodyOf(
						"· 回退下场（如实）：这份裁决**不随回退走**——回退照旧只搬拍板存档那一族；"
						+ "这一份会**照旧留在书夹里**，每条自带的记录时间就是它自己的追溯（回退后账本上不再有它对应的那一笔）。",
						BODY_KIND_MARKDOWN,
					),
				)
			: null,
		createElement(
			"div",
			{ style: { margin: "2px 0" }, "data-kg-reading": "edge-scan" },
			`· ${readings.text}`,
		),
		createElement(
			"div",
			{ style: { margin: "2px 0" }, "data-kg-reading": "magnitude" },
			`· ${magnitude}`,
		),
		staleNote === null
			? null
			: createElement(
					"div",
					{ style: { margin: "2px 0" }, "data-kg-reading": "exclusion-stale" },
					`· ${staleNote}`,
				),
		// 形状坏了＝硬闸（票 09 §A）：这里只说清「会被拦下」，真正拦的那一处是 outline 交工。
		Array.isArray(problems) && problems.length > 0
			? createElement(
					"div",
					{ style: { margin: "2px 0", color: "var(--dsw-alias-state-error-primary)" }, "data-kg-exclusions-problems": "1" },
					`⚠️ 那份人写的裁决记录读不出（${problems[0]}）——交工时会被机器拦下，先修好它或删掉它。`,
				)
			: null,
		createElement(
			"div",
			{
				ref: bodyRef,
				// 内滚封顶：只封**视图区**，抬头／控件／读数不进这个盒。
				// 上限 920 ＝ 最多完整放下 6 层卡；它是 `maxHeight`，短书仍贴着内容收（票 `knowledge-graph-step/17`）。
				// 票 `ui-display-redesign/12`：**显式禁横滚**——纵向一封顶它就成了滚动盒，横向默认跟着
				// 变成 `auto`，内容宽一点点就出一条横滚条。宽度已按这只盒子的 `clientWidth` 量
				// （图本体与「窄到放不下就切清单」量的是同一只），这里再把横滚这一条**显式**关掉。
				style: {
					marginTop: "4px",
					maxHeight: `${EXPLORE_POINTS_VIEW_MAX_HEIGHT}px`,
					overflowY: "auto",
					overflowX: "hidden",
				},
				"data-kg-view-body": "1",
			},
			shown === "graph"
				? createElement(KnowledgeGraphView, { key: "kg", cards, edges, dropped, predrawn, onVerdict, busy })
				: createElement(
						"div",
						{ "data-kg-list": "1" },
						rows.length === 0
							? createElement("div", { style: { opacity: 0.7 } }, "（这份合并件里没有知识点）")
							: rows.map((point, index) => {
									const title = typeof point?.title === "string" ? point.title : "";
									const titleKey = normalizeKnowledgePointTitle(title);
									const cardKey = cardKeyOfTitle.get(titleKey);
									const droppedRow = isDropped(cardKey, titleKey);
									const rowState = cardKey === undefined || graphModel === null
										? null
										: graphModel.stateOf(cardKey);
									return createElement(
										"div",
										{
											key: `kp-${index}`,
											style: rowStyle(droppedRow),
											"data-kg-point-row": titleKey === "" ? String(index) : titleKey,
											"data-kg-point-dropped": droppedRow ? "1" : "0",
										},
										createElement(
											"span",
											null,
											`· ${title}`,
											point?.difficulty !== undefined && point.difficulty !== "" && point.difficulty !== null
												? createElement(
														"span",
														{
															style: {
																// 票 06：不配兜底灰——上色从登记取值域派生（见 DIFF_COLORS 上方的注），
																// 出域残值落成默认正文色，不再被「万能灰」兜成看不出问题。
																color: DIFF_COLORS[point.difficulty],
															},
														},
														`（${point.difficulty}）`,
													)
												: null,
											point?.source !== undefined && point.source !== "" && point.source !== null
												? createElement("span", { style: { opacity: 0.5 } }, ` ${point.source}`)
												: null,
										),
										// 每行一颗键：没划掉的给「划掉」，已否的给「放回来」——两处同一条 `graph-opinion`。
										// ⚠️ 配不上卡键的那一行**不摆键**（机器那边没有这张卡，点了必 400）；
										// 票 16：有图的书上只有两端摆「划掉」，中段（`keep`）不摆（见 `rowAction`）。
										rowAction(cardKey, droppedRow, rowState),
									);
								}),
						// 票 pgb04/04：**教法**照旧住在清单这一支里（⛔ 不新开块）；一条都没有时整段不渲染。
						// 措辞与折叠那一份（`machine-product-folds.foldKnowledgeMap` 的「🧭 教法（N 条）」）
						// **有意不同**——「数据同源、措辞各自成篇」是既有裁决，两处不许互相改文案。
						methodRows.length === 0
							? null
							: createElement(
									"div",
									{
										style: {
											marginTop: "8px",
											paddingTop: "6px",
											borderTop: "1px solid var(--dsw-alias-border-l2)",
										},
									},
									createElement(
										"div",
										{ style: { opacity: 0.8, marginBottom: "2px" } },
										`🛠 教法（${methodRows.length} 条）：`,
									),
									methodRows.map((method, index) =>
										createElement(
											"div",
											{ key: `method-${index}`, style: { fontSize: "12px", margin: "2px 0" } },
											`· ${method?.title ?? ""}`,
											method?.source !== undefined && method.source !== "" && method.source !== null
												? createElement("span", { style: { opacity: 0.5 } }, ` ${method.source}`)
												: null,
										),
									),
								),
					),
		),
	);
}

// ── 章节安排确认卡（D1 人审：awaiting-outline 时的焦点区） ─────────────────────

/**
 * 章节安排确认卡的 props 契约（票 `workbench-card-contract` 02）
 *
 * **这张卡吃什么**：四件，全是「书 + 壳」直接递过来的——`meta`（书级只读）、`knowledgeMapText`
 * （书级只读，知识地图原文——票 `pipeline-wiring-gaps/12` 起「必须覆盖 ↔ 已认领」对应关系吃它）、
 * `busy`（壳级可变）、`confirmOutline`（壳注入的回调，整形成 prop `onConfirm`）。收编前由
 * `client-entry.js` 的 `case "outline"` 那一整块逐项手抄。
 *
 * ### 必填两项的判据：卡内**没有兜底**
 *
 * · `meta` —— spec「error modes」写死的一条：**缺 `meta` 就抛**（12 个 slot 在无书时一个都不渲染，
 *   缺 `meta` 是真错）。卡内 `meta?.outline?.chapters ?? []`（`:563`）用 `?.` 让它在 `meta === null`
 *   时渲出一张**空账卡**（「AI 计划把这本书分成 0 章」）——不崩，但那是**屏上对用户说假话**。
 *   ⚠️ `null`（无当前书，壳那一份是 `coreData === null ? null : coreData.meta`）**不算缺**：缺省三
 *   规则第 2 条与本 module 的必填校验都只认 `undefined`。
 * · `confirmOutline` → 整形成 prop `onConfirm` —— `:742` / `:768` 两处用户点击直接调它，无守卫。
 *   缺了 = 点「✅ 通过，开始写最佳范例章」或「🔁 就这样重新安排」当场 TypeError。
 *
 * ### `knowledgeMapText` 不列必填，漏了会怎样
 *
 * `parseKnowledgeMap` 的形状兜底（不是字符串 / 解析失败 → null）让卡退回「没有对照面」那一格：
 * 对应清单**整节不渲染**（不印半份假信息），确认流程照走——与 ExploreConfirmCard 那一份
 * `knowledgeMapText` 同一待遇。注意它与票 12 的服务端闸门是**两回事**：闸门在 outline 交工时
 * 拒交，这里只把同一份比对结果给人看；无源书没有对照面，两边都不判。
 *
 * ### 为什么 prop 名要绕一圈（全局规则，壳那边裁的）
 *
 * 兄弟卡 `exploreConfirmCardView` 的 prop 也叫 `onConfirm`，指的却是壳里另一个函数
 * （`confirmExplore`）。一本扁平的 book 容不下同名两义，所以**book 键取不撞名的那个**，prop 名
 * 一字不改，由 `derive` 整形。✅ 这一位**已经收成一道闸**：`.with({ onConfirm: … })` 当场抛
 * `CardViewError`——`build` 的 ③ 只认 `fromBook` ∪ `defaults` 声明过的键，**不含** `derive` 产出的
 * 键。**为什么是闸不是纪律**：整形是 `derive` 的职责，若 `.with` 改得动整形结果，同一个名字就有两
 * 处来源——正是这张票要消灭的形状。`onConfirm` 只由 `book.confirmOutline` 决定。
 *
 * ### `busy` 不列必填，漏了会怎样
 *
 * 全卡只作 `disabled` 用（`:695` 那个可改选的下拉、`:743` / `:755` / `:769` / `:782` 那几颗键）。
 * 漏了不崩，是**按钮永不置灰**（AI 还在安排时用户能重复点）。它与另外 11 个 slot 共用同一份
 * `BookSessionScope` 的 `ui.busy`——一处漏传全体失守，所以壳那一份只该构造一次。
 */
export const outlineConfirmCardView = defineCardView({
	card: "OutlineConfirmCard",
	// 票 `knowledge-graph-build/09`：多一位 `knowledgeMapExclusions`（那份人的裁决的原文）——
	// 「本书必须覆盖的知识点（N 个）」那一栏从它现算，与覆盖闸门、探查确认卡**同一个 N**。
	fromBook: ["meta", "knowledgeMapText", "knowledgeMapExclusions", "busy", "confirmOutline"],
	required: ["meta", "confirmOutline"],
	defaults: {},
	// 整形：壳里不撞名的 `confirmOutline` → 卡片消费的那个 `onConfirm`；「第 N 章」那类派生全在
	// 卡内按 `meta` 现算（`:578-582`），不进这里。⚠️ `derive` 只拿得到一个参数（此刻的袋子，
	// `build` 的 ④）：delta 已排在它之前，从袋里读到的就是最终值。
	derive: (bag) => ({ onConfirm: bag.confirmOutline }),
});

export function OutlineConfirmCard(props) {
	const { meta, knowledgeMapText, knowledgeMapExclusions, busy, onConfirm } = props;
	const [rejecting, setRejecting] = useState(false);
	const [note, setNote] = useState("");
	const chapters = meta?.outline?.chapters ?? [];
	// 票 31 / ADR-0026（grilling Q1 选 B）：第 3 阶段**干脆不印字数**——
	// 全书体量的「已定」性质后置到样章定稿之后（谈判桌上只报那一次）。
	// 「不显示」≠「不产生」：chapters[].targetWords 仍是契约必填，数据一个字没删。
	// 样例章：默认取旧账本兜底 meta.goldChapter ?? 1；用户可改选（只对确认生效）。
	const [goldPick, setGoldPick] = useState(() => {
		const initial = Number(meta?.goldChapter ?? 1);
		return Number.isSafeInteger(initial) &&
			initial >= 1 &&
			initial <= chapters.length
			? initial
			: 1;
	});
	const goldReason =
		typeof meta?.goldChapterReason === "string" ? meta.goldChapterReason : "";
	const safePick =
		Number.isSafeInteger(Number(goldPick)) &&
		Number(goldPick) >= 1 &&
		Number(goldPick) <= chapters.length
			? Number(goldPick)
			: 1;
	// 票 `pipeline-wiring-gaps/12`：「本书必须覆盖的知识点」↔「已认领」的对应关系，拍板前给人看。
	// 比对与 outline 交工的机器闸门是**同一份函数**（`domain-rules.outlinePointsCoverage`：
	// title 口径 ＋ 规范化）——屏上说的和机器判的不许是两套。判定的**门面**也照抄闸门：
	// 只对「有转换完成的源 ＋ 知识地图上有知识点」的书显示（无源书的知识点清单本就是空的，
	// 机器不判、卡也不印——否则卡会替机器说它不做的判断）；没有对照面时整节不渲染：
	// 不印半份假信息，确认流程照走（读不出地图的拒交由闸门在交工时点名）。
	//
	// 票 `knowledge-graph-build/09`：喂进去的这一份是「知识点 − **被剔除的**」（与覆盖闸门、
	// 探查确认卡同一对纯函数算出来的同一份集合）⇒ 那栏的 N（`coverage.claims.length`）与
	// 闸门报的、与交办正文里写的**逐项相等**。⚠️ 被划掉的那些因此**不出现**在这份清单里
	// （它们已经离开「必须被认领」的判据面）；若 AI 仍把某一条写进 `points`，它会走「骨架里有
	// 知识地图没有的条目」那一支——与闸门同一结果，屏上说的与机器判的仍然是一件事。
	const knowledgeMap = parseKnowledgeMap(knowledgeMapText);
	const exclusions = parseExclusionsDocument(knowledgeMapExclusions);
	const graphCards = knowledgeMap !== null && knowledgeMap.graph !== null ? knowledgeMap.graph.cards : [];
	const exclusionSplit = liveExclusionsOf(exclusions.items, graphCards);
	const effectivePoints = effectiveKnowledgePoints(
		knowledgeMap === null ? [] : knowledgeMap.kps,
		exclusionSplit.live,
	);
	const coverage =
		okMaterialNumbers(meta?.sources).length > 0 &&
		knowledgeMap !== null &&
		knowledgeMap.kps.length > 0
			? outlinePointsCoverage(effectivePoints, chapters)
			: null;
	// 票 `ui-display-redesign/06`：卡头事实句的**现算**（⛔ 不写死章数/认领状态）。
	// 「没有章节认领」＝覆盖对照面里 `chapters` 为空的那几条（与覆盖闸门同一份集合）。
	const unclaimedCount =
		coverage === null ? 0 : coverage.claims.filter((claim) => claim.chapters.length === 0).length;
	const cardFacts = outlineCardFacts(chapters.length, unclaimedCount, coverage !== null);

	return createElement(
		"div",
		{ style: S.focus },
		// ── 卡头行（共用小件，票 01）：问句 → 事实句（票 `ui-display-redesign/06` 块序第 1–2 块）──
		// 问句＝这一屏的主问题（**存量句**，逐字沿用 `decisionOf("outline").question`）；事实句＝
		// 章数／覆盖认领状态／范例章可改选，三个都现算（⛔ 不写死「3 章」）。
		// ⚠️ 问句字面量住在**本文件**（票 01 的 API 约定：人设取证面只读卡片自己文件的 `<strong>`）。
		createElement(CardHead, {
			question: createElement("strong", { style: CARD_HEAD_QUESTION_STYLE }, OUTLINE_CARD_QUESTION),
			facts: cardFacts,
		}),
		// ── 块序第 3 块：标题＋说明段（常显；说明段本身是存量句，两取值见 `outlineCardLead`）──────
		createElement(
			"strong",
			{ style: { fontSize: "13px" } },
			"📐 章节安排出来了！",
		),
		createElement(
			"p",
			{ style: { margin: "6px 0" } },
			// 票 31 / ADR-0026（grilling Q1 选 B）：不印「全书大约 X 汉字」，也不印逐章字数。
			// 如实告知它为什么不在这里——等最佳范例章写完、实测之后再定（谈判桌上只报那一次）。
			// 票 `demo-channel-full/26`：「AI 计划…／AI 先把…写出来给你过目」两句对演示书的前半是假话
			// （章节安排来自零入参的 `demoOutline()`），后半是真的（演示书真写出那一章）⇒ 两取值。
			outlineCardLead(meta, chapters.length, safePick),
		),
		createElement(
			"div",
			{
				style: {
					margin: "4px 0 8px",
					padding: "8px 10px",
					background: "var(--dsw-alias-bg-layer-1)",
					borderRadius: "8px",
					border: "1px solid var(--dsw-alias-border-l2)",
				},
			},
			chapters.map((chapter, index) => {
				// F38（2026-08-20 走查）：每章源材料索引措辞——「源：」前缀 + 「覆盖知识点 N 个」（N=points 数组长度）。
				const pointsArr = Array.isArray(chapter?.points)
					? chapter.points
							.map((pt) => String(pt ?? "").trim())
							.filter((pt) => pt !== "")
					: [];
				const points = pointsArr.join(" / ");
				// ── 票 `kn-unowned-silent/02`：面板读数「本章 20 上限 / 实际 N / 豁免放弃 M」─────────
				// 病：旧实现把越界的点 `slice(0, 20)` **静默丢掉**，屏上只印 `覆盖知识点 20 个`——
				// 用户与读者都看不出本章原交了 23 条、有 3 条被吃掉了（真书 143 承诺 / 138 实写）。
				// 今天：这一行把**上限、实际、放弃**三个数一起摆出来，被放弃的还**逐条点名**。
				// ⚠️ 「豁免放弃 M」读的是**交工那一刻记下的结果**（`meta.waivedPointDrops`，见那个函数的
				//   注释）：⛔ 不猜豁免记录里的章号——书级记录里只写了 title 时机器推不出它归哪一章，
				//   猜了就会「闸门放行、面板印 0」。
				const waived = chaptersWaivedPoints(meta, index + 1);
				const waivedCount = waived.points.length;
				return createElement(
					"div",
					{ key: index, style: { fontSize: "12px", margin: "4px 0" } },
					`${index + 1}. ${chapter.title ?? ""}`,
					chapter.outline !== undefined &&
						chapter.outline !== "" &&
						chapter.outline !== null
						? createElement(
								"span",
								{ style: { opacity: 0.6 } },
								`　${chapter.outline}`,
							)
						: null,
					// 票 31 / ADR-0026：逐章那行原来的「约 N 汉字」也一并撤掉
					//（第 3 阶段不假装字数是承诺）；数据仍在 outline.chapters[].targetWords。
					chapter.source !== undefined &&
					chapter.source !== "" &&
					chapter.source !== null
						? createElement(
								"div",
								{ style: { opacity: 0.6, margin: "1px 0 0" } },
								`源：${chapter.source}`,
							)
						: null,
					// 票 `kn-unowned-silent/02`：上限／实际／豁免放弃三个数**接在原来的那一行后面**——
					// 不另起一行：这一卡下面就是「选范例章」与两颗拍板键，多一行就多推 60px（走查读数
					// `demo-phase-3-outline` 的主推进键因此更容易掉出焦点带；基线本来就红，⛔ 不去加剧它）。
					// 三个数常显（不折）——它正是「本章有没有点数被放弃」这个问题的答案；有点被放弃时
					// 把它们的名字也点出来。
					pointsArr.length > 0 || waivedCount > 0
						? createElement(
								"div",
								{ style: { opacity: 0.6, margin: "1px 0 0" }, "data-outline-points-cap": "1" },
								(pointsArr.length > 0
									? `覆盖知识点 ${pointsArr.length} 个${points !== "" ? `：${points}` : ""}；`
									: ""),
								`知识点：上限 ${OUTLINE_POINTS_MAX} 条 / 实际 ${pointsArr.length} 条 / 豁免放弃 ${waivedCount} 条`
									+ (waivedCount > 0 ? `（放弃的是：${waived.points.join("、")}）` : ""),
							)
						: null,
					);
				}),
		),
		// ── 块序第 5 块〔折＋内滚〕：票 `ui-display-redesign/06`（spec §2.6）────────────────────
		// 票 `pipeline-wiring-gaps/12`：「必须覆盖 ↔ 已认领」对应清单——知识地图里每条知识点
		// 出一行，认领了的标章号，没认领的点名（用户拍板前自己核；漏了交工也会被机器拒并点名）。
		// 骨架里知识地图没有的条目同样点出（反向也是拒交项）。没有对照面时整节不渲染。
		// ⚠️ 默认**折起**：清单随知识点条数变长（几十条常见），常显会把「选范例章」与两颗拍板键
		// 一路推走；展开后清单那一块自己有内滚封顶。
		// 票 `ui-display-redesign/17`（收口 review S6）：折叠口是**原生 `<details>/<summary>`**——
		// spec §1 不许新增可点区域（票 06 那一版是一颗新增 `<button>`，同批同类折叠都是 `<details>`）。
		// 收起/展开由浏览器管：零动作、零组件状态；`<summary>` 文案静态（不换词）。
		coverage === null
			? null
			: createElement(
					"details",
					{ style: { margin: "0 0 8px" }, "data-outline-coverage": "1" },
					createElement(
						"summary",
						{ style: { ...S.smallLink, cursor: "pointer" } },
						OUTLINE_COVERAGE_FOLD_SUMMARY,
					),
					createElement(
						"div",
						{
							style: {
								marginTop: "6px",
								padding: "8px 10px",
								background: "var(--dsw-alias-bg-layer-1)",
								borderRadius: "8px",
								border: "1px solid var(--dsw-alias-border-l2)",
								fontSize: "12px",
							},
						},
						createElement(
							"div",
							{ style: { fontWeight: 600, margin: "0 0 4px" } },
							`🧭 本书必须覆盖的知识点（${coverage.claims.length} 个）——每条都要有章节认领：`,
						),
						exclusionSplit.live.length === 0
							? null
							: createElement(
									"div",
									{ style: { margin: "0 0 4px", opacity: 0.8 }, "data-kg-exclusions-note": "1" },
									`· 人已划掉 ${exclusionSplit.live.length} 条，它们不在这 ${coverage.claims.length} 条里：${exclusionSplit.live.map((item) => item.title).join("、")}`,
								),
						// 内滚只封**清单那一块**（抬头与折叠口不进滚动盒）：清单再长也不把
						// 下面的「选范例章」与两颗拍板键推走。
						createElement(
							"div",
							{
								style: {
									maxHeight: `${OUTLINE_COVERAGE_VIEW_MAX_HEIGHT}px`,
									overflowY: "auto",
									overflowX: "hidden",
								},
								"data-outline-coverage-body": "1",
							},
							...coverage.claims.map(({ title, chapters: claimedBy }) =>
								createElement(
									"div",
									{
										key: title,
										style: {
											margin: "2px 0",
											color: claimedBy.length > 0 ? undefined : "var(--dsw-alias-state-error-primary)",
										},
									},
									claimedBy.length > 0
										? `✓ ${title} —— 已认领：${claimedBy.map((n) => `第${n}章`).join("、")}`
										: `✗ ${title} —— 还没有章节认领`,
								),
							),
							coverage.foreign.length > 0
								? createElement(
										"div",
										{
											key: "foreign",
											style: {
												margin: "4px 0 0",
												color: "var(--dsw-alias-state-error-primary)",
											},
										},
										`⚠️ 骨架里有知识地图没有的条目（交工会被机器拒）：${coverage.foreign
											.map((f) => `第${f.chapter}章「${f.title}」`)
											.join("、")}`,
									)
								: null,
						),
					),
				),
		createElement(
			"div",
			{
				style: {
					margin: "4px 0 10px",
					display: "flex",
					alignItems: "center",
					gap: "6px",
					flexWrap: "wrap",
				},
			},
			createElement(
				"span",
				{ style: { fontSize: "12px" } },
				// 票 10（判定一 #3）：「样例章」与同一张卡下面按钮上的「最佳范例章」是同一件事两种叫法，
				// 统一取界面词表定的「最佳范例章」（CONTEXT.md「范例章」词条：对外统一为最佳范例章）。
				`📐 AI 建议用第 ${safePick} 章当最佳范例章：${goldReason !== "" ? goldReason : "（未给理由）"}`,
			),
			chapters.length > 1
				? createElement(
						"select",
						{
							style: S.disabled({
								fontSize: "12px",
								padding: "2px 4px",
								borderRadius: "6px",
								border: "1px solid var(--dsw-alias-border-l2)",
								background: "var(--dsw-alias-bg-layer-1)",
							}, busy),
							value: safePick,
							onChange: (e) => setGoldPick(Number(e.target.value)),
							disabled: busy,
						},
						chapters.map((chapter, index) =>
							createElement(
								"option",
								{ key: index, value: index + 1 },
								`${index + 1}. ${chapter.title ?? ""}`,
							),
						),
					)
				: null,
			chapters.length > 1
				? createElement(
						"span",
						{ style: { fontSize: "12px", opacity: 0.6 } },
						"（可改选）",
					)
				: null,
		),
		rejecting
			? createElement(
					"div",
					{
						style: {
							marginTop: "10px",
							borderTop: "1px dashed var(--dsw-alias-border-l2)",
							paddingTop: "8px",
						},
					},
					createElement(
						"p",
						{ style: { margin: "0 0 6px", fontWeight: 600 } },
						"改哪里？写一句（比如：第3章拆成两章 / 每章字数太多）",
					),
					createElement("textarea", {
						style: S.textarea,
						// 票 `demo-channel-full/24`：这一行在演示书上换如实的那一句（唯一出口在
						// `view-rules.outlineRejectPlaceholder`，复用现成的 `isDemoBook`）。
						placeholder: outlineRejectPlaceholder(meta),
						value: note,
						onChange: (e) => setNote(e.target.value),
					}),
					createElement(
						"div",
						{ style: { marginTop: "8px", display: "flex", gap: "8px" } },
						createElement(
							"button",
							{
								style: S.disabled(S.bigBtn(false), busy),
								onClick: () => onConfirm(false, note.trim()),
								disabled: busy,
							},
							// 票 `demo-channel-full/24`：这颗键的面文**有意没换**——键本身就是那个动作的
							// 名字，改它＝改产品面（改键名／改键的行为／容忍这句话三选一）；票面明令
							// 「停下来说清楚，别硬改」，读数与三个候选处置见本票 `## Comments`。
							"🔁 就这样重新安排",
						),
						createElement(
							"button",
							{
								// 🎯 票 `gold-display-period/05`：这颗**有意不禁用**（#2 的逐处复核）——
								// `onClick` 只收起这张表单（两个 setState，不发任何东西）⇒ `busy` 里挡住它
								// 只会造出「看着能点却点不动」的键（先例见 `event-cards.js` 的
								// 「❌ 不满意，让 AI 改」上方）。
								style: { ...S.smallLink, textDecoration: "none" },
								onClick: () => {
									setRejecting(false);
									setNote("");
								},
							},
							"取消",
						),
					),
				)
			: createElement(
					"div",
					{ style: { display: "flex", gap: "8px", flexWrap: "wrap" } },
					createElement(
						"button",
						{
							style: S.disabled(S.bigBtn(true), busy),
							onClick: () => onConfirm(true, note, safePick),
							disabled: busy,
							// 票 `auto-walkthrough/04`：关键键的语义钩子（章节安排确认，六闸门之一）。
							"data-outline-confirm": "1",
						},
						OUTLINE_CONFIRM_ACCEPT_LABEL,
					),
					createElement(
						"button",
						{
							style: S.disabled({
								...S.bigBtn(true),
								background: "transparent",
								color: "var(--dsw-alias-state-error-primary)",
							}, busy),
							onClick: () => setRejecting(true),
							disabled: busy,
						},
						// 票 10（判定一 #7）：与另一张确认卡的「🔁 让 AI 重做」是同一动作，统一成这一句
						// （引擎播报里告诉用户点哪个按钮的话也同步改了）。
						EXPLORE_CONFIRM_REWRITE_LABEL,
					),
				),
	);
}
