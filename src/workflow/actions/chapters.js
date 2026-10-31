/**
 * 动作族模块（架构评审候选 3，2026-09-01 拆分）：actChapters
 * 从 src/workflow.js 平移（架构评审候选 3，2026-09-01）。
 *
 * ⚠️ 票 `workflow-seams/03`：interface 已收窄成**一个请求对象**
 * （`{ ctx, action, sessionId, project, body }`）并返回 `{status, json}`——
 * `_req` 与 `res` 两个传输参数都已从 interface 上消失（`res` 由 `handleAction` 那一次
 * `sendJson` 写出，落盘边界随它）。
 *
 * ⚠️ **本文件不许删、不许合、不许改名**：动作族 id ≡ 本文件名这一点被
 * `test-contract-action-catalog.mjs` 从**源码文本**锚定（它正则抠 `workflow.js` 的
 * `HANDLER_OF_FAMILY` 字面量表并要求 handler 绑定名匹配 `act[A-Z]\w*`）；
 * 另有 `test-context-vocabulary.mjs` 把「探查」钉在 `gates.js`、
 * `test-gate-write-points.mjs` 点名读本目录下的族文件。
 * ⇒ 改完之后本文件会变得**近乎空壳**——**那是承重件不是忘了删**。
 * 共享工具来自 ../engine.js。
 */
import {
  assertSessionOwned,
  // 票 `premature-announce/01`：源探查「盘上产物齐没齐」的唯一一份判据（置态/放行/交工三处共用）。
  exploreArtifactProblems,
  // 票 `pre-gold-build/01`：判定那一档派单的读物（每份转换稿的开头片段 ＋ 标题行清单 ＋ 路径）
  // **现读现抽**——抽取要读盘，而 `dispatch-assembly` 是纯函数（同输入同输出），所以读盘那一半在这儿。
  materialSurveyInput,
  goldN,
  stageLabel,
  projectDir,
  readMeta,
  updateMeta,
  waived,
  // 票 `walkthrough-fixes/23`：`other` 的读取口只此一个——**点名它放行的是哪一条检查**（可选章号）。
  // 直接写 `waived(project, 'other')` 会被 `test-gate-write-points.mjs` 当场判红（旧的一票整族形状）。
  otherWaiverFor,
  // 票 `kn-unowned-silent/02`：**逐点豁免**的判据单点——把一组点按「点名放弃的」与「没点名的」分开。
  // 三处覆盖读取点（outline 未认领、单章缺覆盖、单章写进已划掉的点）与单章上限那一步共用它，
  // ⛔ 不许在调用点自己 `filter`（那会长出第二份「怎么算被点名」）。
  splitWaivedPoints,
  appendEvent,
  // 票 `stage3-hard-limits/02`：章数对账读数按「同一本书、同一对 decided/actual」去重——
  // 驳回后重交看到的是同一件事，不重复刷同一条读数。
  readEvents,
  // 票 `confirm-points-redesign-build/05`：站 3 那一个停点的人读提示——同一个
  // `awaiting-explore` 状态值下的**第二个**停点那一句（与 `EXPLORE_DONE_HINT` 同一族）。
  STATION_GOALS_DONE_HINT,
  workFile,
  writeWork,
  detailDir,
  reportDir,
  // 票 `demo-channel-full/10`：「风格线逐条交代去向」的**唯一写入口**（本跳只做判定，写与刷镜像
  // 都在 engine 那一处；演示书的终检那一趟调的是同一个函数）——原先本文件直接调 `updateStyleLineMirror`，
  // 那一格随之搬进写入口，本文件不再需要它。
  applyStyleDisposals,
  sealGoldStandard,
  // ⚠️ 本文件**不再**直接调 `handoff`（票 `demo-flow-fidelity/05` 之后两处都走 `handoffAndDrive`）。
  //    `handoff` 不是不能用，而是这两处都属「交办之后得有人推」那一族——真书由被唤醒的主 AI 推，
  //    演示书没有主 AI，漏了补 kick 就停死在 `running`。判据与理由只在 engine 的 `handoffAndDrive` 一处。
  handoffAndDrive,
  chapterArtifacts,
  chapterDone,
  // 票 `word-budget-ineffective/02`：字数兜底/实际读数的单点（与面板、交付清单同一份）。
  chapterWordReading,
  noteStyleSpecChange,
  writeSnapshot,
  proposeGate,
  proposeRevision,
  advance,
  countProposals,
  scanScaffolding,
  scaffoldResidue,
  stripLoaderRegion,
  specFingerprint,
  styleSpecDeclaresNoExercises,
  runQualityChecks,
  // 票 `walkthrough-fixes/36`：最后检查阶段改章之后由机器**重拼成品**（与合并那一跳同一个纯函数）。
  refreshBookAfterChapterAssemble,
  EXPLORE_DONE_HINT,
  FINAL_CHECK_DONE_HINT,
  kick,
  buildStageBrief,
  // 票 `context-budget/18`：派单正文改机器代填——形状出处按层级切节（终检那一档是 §十 的一节）。
  pickSections,
  // 票 `pre-gold-build/13`：数「此时还有几个小助手在跑」**只此一份实现**——暂停那一族用的就是它
  //（`collab-signals.js` 的 pause、`gates.js` 重做前那道闸），本跳复用，⛔ 不另写一份计数。
  countRunningSubagents,
  // 票 `demo-channel-full/03`：章级流水线阶段的**唯一写入口**（真书这一跳与演示支那几步共用它）。
  recordChapterStage,
} from '../engine.js'
import { familyOf, reject, accept } from '../action-runner.js'
// 票 `walkthrough-fixes/37`：驳回意见的逐条交代契约（拆条落账在 `gates.js` 的 `final-redo-items`；
// 本文件只负责「交工那一刻与落账那份条目集逐条对齐」，判据形状住在 `final-redo.js` 一处）。
import { finalRedoCheckProblem, mergeFinalRedoCheck, finalRedoCheckText } from '../final-redo.js'
// 票 `audit-gate-semantics/01`：章审计的**通过语义**单点——`passed` 从 issues（level＋status）现算、
// 读数行 `{errors_open, warnings_open, fixed, accepted}` 与形状问题都在那一份实现里。
// ⛔ 章交工闸／范例章提审／合稿与终检／界面摘要都读它，不各写一份「怎么算通过」。
import { auditVerdict, readingsLine, auditShapeRejectReason, AUDIT_WARNINGS_OPEN_MAX, AUDIT_READING_KEYS } from '../../audit-semantics.js'
// payload 字段词汇层（票 `deep-module-scan/18` 层一）。⚠️ 本文件三处「理由类」字段
//   （`volumeReason` / `goldChapterReason` / 抽查意见处置 `how`）**共用 `CHAPTER_SIDE_REASON_MAX`**——
//   它们真的是同一个「人读理由句」那一档；而 `label` / `detail` / 撤销备注各自是另一档。
import {
  textField,
  textFieldRaw,
  textCoerced,
  CHAPTER_SIDE_REASON_MAX,
  OUTLINE_POINTS_MAX,
  PROGRESS_LABEL_MAX,
  PROGRESS_DETAIL_MAX,
  // 票 `context-budget/18`：派单那「一句叮嘱」的长度档（与人读的改进方向同档）。
  AGENT_ASSIGN_NOTE_MAX,
} from './payload-fields.js'
// 票 `stage3-hard-limits/02`：章数上下限都不判；站 6 拍板的章数只做**非阻断对账读数**
// （`工作区/决策/06.json` 的 `values.chapters`，读侧单点在 `workflow/decisions.js`）——
// 篇幅档位那张表连同 `deriveLengthPlan` 一起删了，⛔ 这里不另立一份上限、也不新造建议区间。
import { readDecisionChapterCount } from '../decisions.js'
// 票 `confirm-points-redesign-build/01`（票面落点 (c)）：**派单前的硬闸**——站 5 的前置
// （站 4 的结论件 ＋ 它指的那份正文）缺一件就**不开这一站**、当场报错。
// ⚠️ 判据本体（「件在不在」）在 `decision-record.js`，⛔ 本文件不另写一份存在性判定。
import { STATION_OF_GATE, STATION_GOALS, stationPreconditionProblem } from '../decision-record.js'
// 票 `confirm-points-redesign-build/05`：站 3 那一趟的产物（`工作区/目标-vM.md`）——名字、版本规则
// 与渲染**只有一处**（`workflow/goal-doc.js`），⛔ 本文件不手拼文件名、也不自己数版本。
import { goalDocRel, GOAL_COUNT_MAX, nextGoalDocVersion, writeGoalDoc } from '../goal-doc.js'
// 票 `ui-display-redesign/11`：收卷人闭集（唯一出处＝探索确认契约）——回卷载荷闸与 `meta.answerer`
// 写点都用它，⛔ 本文件不手抄「本人／监护人／老师」那份名单。
import { EXPLORE_CONFIRM_ANSWERERS } from '../../explore-confirm-contract.js'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { CHAPTER_PROGRESS_STAGES, normalizeTeachingFocus, normalizeKnowledgePointDifficulties, outlinePointsCoverage, chapterRel, chapterName, auditRel, auditName, okMaterialNumbers, standingGate, knowledgeShardRel, knowledgeShardName, readingRel, readingName, FINAL_AUDIT_SCOPES, finalAuditReportName, finalAuditReportRel, placeholderWordingHits, exploreDepthTier, CHAPTER_COUNT_POLICY_TEXT, rawValueText, progressFieldProblem, progressLineShapeProblem, checkBlocksDelivery,
  // 票 `pre-gold-build/17`：章级知识点覆盖的比对键——**不另写一份规范化**，与 outline 那一跳
  // （`outlinePointsCoverage`）共用 `domain-rules` 这一份（去尾部括注/trim/全半角）。
  normalizeKnowledgePointTitle,
  // 票 `exclusion-flow/01`（F1 的「减」那一半）：本章 points ∩ `effective` 的**唯一派生**——
  // ⛔ 本文件不自己 `points.filter(...)`（那样会在这里长出第二份减法，正是本 effort 要治的病）。
  effectiveChapterPoints,
  // 票 `exclusion-flow/03`（F3）：成品那一跳要问**同一个反问题**（「被划掉的 title 在不在正文里」）
  // ⇒ 「怎么算在场」只此一份（与本章那一跳共用；本文件不另写第二份扫法）。
  excludedTitlesInText,
  // 本 effort 票 `knowledge-graph-build/09`：人的裁决产物（`工作区/knowledge-map-exclusions.json`）
  // 那四个名字——被剔除的知识点**离开覆盖闸门判据面**，收口只此一处。
  KNOWLEDGE_MAP_EXCLUSIONS_REL, EXCLUSION_REASON_NOT_NEEDED, EXCLUSION_REASONS, EXCLUSION_BY_USER, addExclusion, removeExclusion,
  // 票 `demo-channel-full/19`：「写作规范五节标题在场」的**判定单点**——真书这一跳与演示支写盘之后
  //   共用它。⛔ 别再在本文件里手写第二份节标题数组（票 19 之前那份数组就活在本文件下面那一行）。
  styleSpecMissingSections,
  // 票 `reader-cognition-boundary-build/03`：读者情况问卷的两个路径常量（书夹相对，唯一出处）。
  READER_QUESTIONNAIRE_ISSUED_FILE_NAME,
  READER_QUESTIONNAIRE_ISSUED_REL,
  READER_QUESTIONNAIRE_RETURNED_FILE_NAME,
  READER_QUESTIONNAIRE_RETURNED_REL,
  // 票 `audit-gate-semantics/01`：审计读数落点的单一出处（清单那一行按它派生）。
  AUDIT_READINGS_FILE_NAME,
} from '../../domain-rules.js'
import { artifactDataForChapter, artifactDataForGate, artifactDataForStage, artifactDataForLabel } from '../artifact-fields.js'
// 票 `context-budget/18`：派单正文的机器代填（纯函数、同输入同输出）——形状出处＝九份派发模板
// ＋ 终检那一节方法论文档，本动作只负责「读形状 ＋ 填值 ＋ 起子代理 ＋ 落账」。
import { DispatchShapeError, assembleDispatchPrompt, dispatchKindSpec, dispatchKinds, dispatchValues } from '../dispatch-assembly.js'
// 九份模板的正文（`resources/` 下的原样导出层）：唯一读法是 `readResource`（分档答案，带 mtime+size 缓存）。
// 票 `resource-read-result/03`：读不出这一个结局要**显式**处理（500 点名「读不出」），不再靠假串。
import { readResource } from '../../content-lib.js'
// 票 `walkthrough-2026-10/02`：章正文由机器从分片拼（机器是唯一写者）——拼装与拒收文案都只此一份。
import { assembleChapter, verifyChapterAtSubmit, chapterAssemblyReject } from '../chapter-assembly.js'
// 票 `walkthrough-fixes/36`：成品 `工作区/book.md` 的拼装口径**只此一份**（纯函数）——合并那一跳与
// 「最后检查阶段改章后重拼成品」都调它，⛔ 本文件不再自己拼一遍（两份拼装逻辑＝判据自己会漂）。
import { composeBook } from '../book-assembly.js'
import { CROSS_AUDIT_TEMPLATE_REL, crossAuditRejectReason, judgeCrossAuditReport } from '../cross-audit.js'
// 票 `knowledge-graph-build/11`：跨章审计的**逐边清单**——读图那一步只住这里（动作层），
// 算出来的清单**当值**交给派发（`dispatchValues` 的 `edgeLedger`）与验货（`judgeCrossAuditReport`）
// 两边；`dispatchValues` 是纯函数，⛔ 它自己不读盘。
import { readCrossAuditEdgeLedger } from '../cross-audit-ledger.js'
// 票 `knowledge-graph-build/09`：那份**人的裁决产物**（`工作区/knowledge-map-exclusions.json`）的
// 读写侧——覆盖闸门与 `outline` 交办读的是**同一份集合**（「知识点 − 被剔除的」），而那份集合的
// 唯一读侧入口就是这个 `readCoverageCollection`（⛔ 闸门自己一个字不改）。
import { readCoverageCollection, readExclusions, writeExclusions } from '../knowledge-map-exclusions.js'
// 票 `chapter-skeleton/02`：交工那一跳的「outline 与图序」读数——排序本体住 `knowledge-order.js`（票 01），
// ⛔ 本文件不自己写拓扑排序，也不把这条读数接进任何拒收分支。
import { knowledgeOrderFromCoverage, orderReadingFieldsOf } from '../knowledge-order.js'
// 票 `knowledge-graph-build/10`：写作面两个**既有槽**（`{{本章知识链位置说明}}`／`{{知识链前置小节}}`）的
// 「知识链」——读图那一步只住这里（动作层），读出来的两样**当值**交给 `dispatchValues`（它不碰盘）。
import { readKnowledgeChainGraph } from '../knowledge-graph-chain.js'
// 票 `reader-cognition-boundary-build/07`：逐章那四档的**读者边界**那一份现算读数（「本章不许写什么」）。
// ⚠️ 它自己只走上面那个唯一读侧入口（`readCoverageCollection`）⇒ 这一层⛔ 不另写一份「怎么减」；
// 而「哪几档要它」只有一处声明（`BOUNDARY_DISPATCH_KINDS`，`DISPATCH_SPECS[kind].inputs` 里那一位
// 就是从它派生的），⛔ 本文件不抄第二份档名清单——**读什么由表驱动**（见 `DISPATCH_INPUT_READERS`）。
import { readReaderBoundary } from '../reader-boundary.js'
// ⚠️ 2026-10-14 两条 effort 合并：`main` 票 `pre-gold-build/13` 把 `final-audit-summary.js` 的出口
// 从「一个 `refreshFinalAuditSummary`」扩成下面五个，本 effort 那一个名字就在其中——两个都保住。
import {
  finalAuditReportsRejectReason,
  finalReportPointer,
  judgeFinalAuditReports,
  refreshFinalAuditSummary,
  styleDisposalsWithoutSourceRejectReason,
  styleLineCitedInReports,
} from '../final-audit-summary.js'
// ⚠️ 同上：`main` 那一侧原样三份，本 effort 票 `knowledge-graph-build/05` 再加 `bookLevelProblems`。
import { expectedKnowledgeMap, shardShapeProblems, bookLevelProblems, readerSliceProblems, effectiveReaderSlices } from '../knowledge-map-assembly.js'
// 票 `reader-cognition-boundary-build/03`：读者情况问卷的渲染（「给出那一份」）与回卷件的形状判据
// ——纯活都住那个模块，本文件只做接线（读 meta、写件、回包）。
// 票 `rcb-build/05`：`readerQuestionnaireOrdering`＝逐条那层「按组轮转取条」的轴（合并件里既有的
// 分组顺序 ＋ 退化的卡片顺序）——取条规则本身（`selectSliceItems`）也住那个模块，⛔ 这里不重算。
import {
  renderReaderQuestionnaire,
  readReaderQuestionnaireKnowledgeMap,
  readerQuestionnaireOrdering,
} from '../reader-questionnaire.js'
// 票 `knowledge-graph-build/03`：合并件成形那一刻的形状闸（唯一的判据出处；拼装那半在上一行）。
import { knowledgeMapGateProblems } from '../knowledge-map-gate.js'
// 票 `knowledge-graph-build/06`：对齐结论（`body.alignment`）落成「一条卡 ＋ N 个位置索引」——
// 合并算法与它的结论校验只住这一份模块，本文件只做接线（见探索段交工那一跳的注释）。
import { applyKnowledgeMapMerge } from '../knowledge-map-merge.js'
// 票 `knowledge-graph-build/12`：老书那颗「补一份知识点图」的键——**入口只调这一份机制**（票 04 落的
// `applyKnowledgeGraphBackfill`：读细目／回原文取行段／重拼／形状闸全在它里面），盘上那份在册形状
// （有没有分片、合并件里有没有图键）也读它那一份（`readBookGraphInputs`，唯一出处）。
// 票 `knowledge-graph-edges-build/05`：交工这一跳落盘前也要跑**同一份**传递约简（`reduceTransitivePrereqEdges`，
// 全仓唯一实现就住那个模块）——⛔ 别在这里或拼装器里另写一份约简。
// 票 `knowledge-graph-edges-build/06`：删了几条要说出来——那句告知的措辞也走那个模块的**同一处**
// （`reducedPrereqHintText`，与补图那档逐字同一句），⛔ 别在这里另写一句「机器改了什么」。
// 票 `graph-read-one-answer/03`：合并件「读出来是什么」只问**一个**出口 `readMergedMap`（严格 JSON
// 对象才算有；缺件／坏 JSON／数组／数字一律 `map === null`）——本文件的 `graph-opinion` 与
// `stage-submit(outline)` 覆盖闸都从这里取，⛔ 不再各手搓一行「读文件 ＋ `JSON.parse`」。
import { applyKnowledgeGraphBackfill, readBookGraphInputs, readMergedMap, MERGED_MAP_NAME, reducedPrereqHintText } from '../knowledge-graph-build.js'
// 票 `graph-write-order/02`：闸 → 约简 → 渲染 → 写的**唯一入口**（完整理由住它的文件头）。
import { MERGED_MAP_OUTCOMES, landMergedMap } from '../knowledge-map-landing.js'
// 票 `reader-cognition-boundary-build/10`：老书维护通路那笔**独立**账（`meta.readerBoundaryBackfill`）
// 的写侧——键名、形状与撤回都在那一份里（⛔ 与补图那笔 `knowledgeGraphBackfill` 不共用）。
import { applyReaderBoundaryBackfillAccount } from '../reader-boundary-backfill.js'
// 票 `knowledge-graph-build/13`：知识点图审校那一档的交办值（两条软读数 ＋ 把握档注意力清单）——
// **读盘那一步在动作层**（`readGraphReviewTarget`），因为 `dispatchValues` 被钉成纯函数、不碰盘。
import { readGraphReviewTarget } from '../knowledge-graph-review.js'


/**
 * 派单**输入值 → 读盘函数**（票 `depth-round-3/06`；读盘只住这一层，⛔ 没搬进 `dispatch-assembly.js`）。
 *
 * 「这一档要哪几位」**不在这里**：那是 `DISPATCH_SPECS[kind].inputs` 一处声明（`boundary` 那一位从
 * `BOUNDARY_DISPATCH_KINDS` 派生）。这张表只回答**「这一位怎么读」**——`agent-assign` 那一跳按声明
 * 逐位来取，⛔ 不再按 `spec.kind ===` 分支决定要不要读（那样「加一档／改一档的输入面」会两处各漂）。
 *
 * ⚠️ **键面**：与 `DISPATCH_SPECS` 里出现过的输入名**逐键一致**（多一位＝死代码、少一位＝那一档派单
 * 拼到一半才响）；判据在 `test-agent-dispatch.mjs` ⑥-B，运行时兜底在下面那个循环里（少了当场 500）。
 * ⚠️ **键的次序＝读盘次序**：本表的插入序就是「先读谁」（今天与票 07/10/11/13 落地时的读序逐字相同）；
 * 声明里的次序是**点名次序**（缺件时先点谁的名），两件事分得开。
 *
 * @type {Readonly<Record<string, (projectId: string, meta: object|null) => object>>}
 */
export const DISPATCH_INPUT_READERS = Object.freeze({
  graphReview: (project) => readGraphReviewTarget(project),
  graphInputs: (project) => readKnowledgeChainGraph(project),
  // 票 `exclusion-flow/02`：写作面两档的「本章要写哪些点」——唯一读侧入口原样当值传下去，
  // 派生（points ∩ effective）住 `dispatch-assembly.js` 调 `domain-rules.effectiveChapterPoints`。
  coverage: (project) => readCoverageCollection(project),
  boundary: (project) => readReaderBoundary(project),
  edgeLedger: (project, meta) => readCrossAuditEdgeLedger(project, meta),
  survey: (project, meta) => materialSurveyInput(project, meta),
})


/** 范例章审计文件名（NN 两位补零；机器身份词，勿改）。⚠️ 形与路径**都只有 `domain-rules.auditName`
 *  一个出口**——这里原先手拼一份 `audit-${String(n).padStart(2, '0')}.md`（票 `context-budget/18`
 *  复核 findings ⑥：同一族五处各拼一份），现在只是给「范例章那一份」起个本名，值逐字来自出口。 */
function goldAuditName(n) {
  return auditName(n)
}


/**
 * 第三条「意见」通路（票 `knowledge-graph-build/08`）认的两种裁决——**闭集**，就这两个值。
 *
 * ⚠️ 它们是**这一屏上的那两个词**（`src/ui/knowledge-graph-map.js` 的 `KG_VERDICTS`：
 * 「🗑 这部分不造进书里」＝`不讲`／「↩ 放回来（要讲）」＝`要讲`），界面递上来的就是它们。
 * 两边各写一份闭集是**有意的**（`AGENTS.md`：判据与被判物不共用一份枚举）——「两边真的同值」
 * 由 `test-collab-backend.mjs` 拿界面那一份 export 逐个真发一次来断，不靠谁记得同步。
 */
const GRAPH_OPINION_VERDICTS = Object.freeze(['不讲', '要讲'])


/**
 * 派单用的子代理 provider 名（票 `context-budget/18`）。
 *
 * ⚠️ 与 `preset/textbook.patch.yml` 里 `tool-subagent` 的 `provider: spawn` **同值**：主笔自己
 * 用 `subagent` 工具派的那几路，与机器代填派出去的那几路，**用的必须是同一个 provider**——
 * 换一个就是「同一个模式里两种子代理」，孩子的形状、工具面与回灌通道都会分家。
 */
const SUBAGENT_PROVIDER = 'spawn'


/** 票 `pipeline-wiring-gaps/13`：「机器改写了什么」提示里的**原值**展示——引号/JSON 化/截断
 *  与难度归一化消费 `domain-rules.rawValueText` 的**同一实现**（不各写一份「同一口径」）；
 *  本语境下 undefined 叫「没交」。 */
function describeRawValue(v) {
  return rawValueText(v, '没交')
}


/** 票 `pipeline-wiring-gaps/13`：一条机器改写记录 → 人读一行（账本 hint 用）。
 *  书级条目（goldChapter 族，`chapter: null`）不带章前缀。 */
function renderMachineEdit(edit) {
  return edit.chapter === null ? edit.detail : `第${edit.chapter}章：${edit.detail}`
}


/**
 * 票 `pre-gold-build/17` · 章级知识点覆盖：本章 `points` 里**在正文里读不到着落**的条目（原样写法，点名用）。
 *
 * 承诺面是债-17／R5（`resources/references/subagent-prompts/writing-agent-prompt.md` 第 41 行、
 * 同义句在 `gold-writing-agent-prompt.md`）：「从 `outline.md` 里本章的 `points` 字段读出本章必须覆盖
 * 的知识点清单（一个知识点一条），写完**逐条打钩，不能有知识点遗漏**」。机器原先在**章交工那一跳**
 * 一个字都不判（唯一的 points 判据在 `outline` 那一跳，比的是知识地图 ↔ 骨架各章 `points` 的归属）。
 *
 * ⚠️ **判定强度＝形状级（照实说，不许读成「讲透了没有」）**：一条知识点算「有着落」当且仅当
 *   ① 正文原文含该条目（trim 后的原样写法）；或
 *   ② 正文与条目**走同一份规范化**（`domain-rules.normalizeKnowledgePointTitle`：NFKC 全半角折算、
 *      去尾部括注、trim）之后，正文含归一化后的条目。
 * ①是「正文原样写了这一串」这条最直的形状；②接住「正文写的是全角／带尾部括注的同一串」——
 * 即与 `outlinePointsCoverage` 同一个键口径**下沉到章级**，不在这里另裁一份规范化。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**（票 `dev-gate-scan/17` 的纪律）：
 *   · 只判**标题在场**：换一种说法讲同一个知识点（「PUE 计算」写成「PUE 的计算方法」）、缩写、
 *     同义词、错别字、语序颠倒——都不在枚举面内，会走「读不到着落」那一格（点名它，由豁免出口
 *     承接）。⛔ 它**不判**这个知识点讲得对不对、讲透了没有（那归真机层与人类抽查那一面）。
 *   · 标题出现在正文**哪个位置不管**（任何角落、包括被 loader 区块包住的那一段都算在场）——
 *     本判据不做区间裁剪，也不跟脚手架残留那道闸共用扫面。
 *   · 只读盘上这一份正文（`工作区/chapter-NN.md`）：分片里写了但**没拼进来**的，在本判据眼里
 *     就是不在场（与「机器是章正文唯一写者」那条协议一致，verdict 由 `verifyChapterAtSubmit` 给）。
 *   · 条目里的空白项／非字符串进不了比对环（`outline` 交工早已把它们丢掉），不冒充「漏」。
 *   · **教法** `teachingMethods[]`（票 04）⛔ 不进本判据：覆盖只查 `knowledgePoints`／`points` 这一族。
 *
 * @param {unknown[]} points 本章 `outline.chapters[n-1].points`
 * @param {unknown} text 盘上那一份章正文（读不到就传空串）
 * @returns {string[]} 读不到着落的条目（trim 后的原样写法，保持 points 里的顺序）
 */
export function missingChapterPoints(points, text) {
  const body = typeof text === 'string' ? text : ''
  const bodyNorm = normalizeKnowledgePointTitle(body)
  const missing = []
  for (const entry of Array.isArray(points) ? points : []) {
    const raw = typeof entry === 'string' ? entry.trim() : ''
    if (raw === '') continue
    if (body.includes(raw)) continue
    const key = normalizeKnowledgePointTitle(raw)
    if (key !== '' && bodyNorm.includes(key)) continue
    missing.push(raw)
  }
  return missing
}

/**
 * **本章正文里出现了哪些「人已划掉」的知识点**（spec `exclusion-flow` 决策 2 的「加」那一半）。
 *
 * 与 {@link missingChapterPoints} **同一把尺子**（原样在场，或同一份 `normalizeKnowledgePointTitle`
 * 下落之后在场），但问的是**反问题**：那边问「该有的缺了没有」，这边问「不该有的有没有」。
 * ⚠️ 单独一条判据、⛔ 不塞进 `missingChapterPoints`——`missingPoints` 的语义是「缺」，不是「多」。
 *
 * ⚠️ **实现已收进 `domain-rules.excludedTitlesInText`**（票 `exclusion-flow/03`）：成品那一跳（F3）
 * 要问同一个反问题，两条判据不许各写一份「怎么算在场」——那是本 effort 要治的病。本函数是章交工
 * 那一跳的**名字**（调用点一个字没改），扫面与规范化都走那一份；枚举面窄处也写在那里。
 * ⚠️ 票 `quality-review-2026-10-29/07`：它**不导出**（全仓零外部消费者，只有本文件
 * `stage-submit(chapters)` 那一处「加」半判据调用它）——零消费者符号留在导出面上＝白付一格
 * interface（`ADR-0044` 决策 2 第六行）。防回潮格在 `test/test-ledger-seq-integrity.mjs` 的
 * 「零消费者符号」那一组。
 *
 * @param {unknown[]} titles 那份件里「今天还算数」的裁决（`live`）的 title
 * @param {unknown} text 盘上那一份章正文（读不到就传空串）
 * @returns {string[]} 命中的 title（trim 后的原样写法，去重、保持传入顺序）
 */
function excludedPointsInChapterText(titles, text) {
  return excludedTitlesInText(titles, text)
}


/** 章审计 JSON 的唯一解析点；读取侧、交工验货与过程图谱摘要都从这里走。 */
function parseAuditJson(raw) {
  try {
    return { audit: JSON.parse(raw), error: null }
  } catch (error) {
    return { audit: null, error }
  }
}


/** 审计记录**可读那一层**的唯一判据：解析结果必须是对象（不是 null／数组／标量）。
 *  读取侧、交工闸、合稿闸、读数快照共用，⛔ 不各写一份「什么算读得出」。 */
function isAuditRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}


/**
 * 读取一章的审计记录。文件不存在、读不到或 JSON 不合法时一律 null——
 * 调用方据真实形状决定拒收或「还没有检查结论」，不在这里猜。
 */
export function readChapterAudit(project, n) {
  try {
    const raw = readFileSync(chapterArtifacts(project, n).auditPath, 'utf8')
    return parseAuditJson(raw).audit
  } catch {
    return null
  }
}


/**
 * `/textbook/process` 下发的人读结论摘要，不把机器审计 JSON（含 matrix）整份搬出去。
 *
 * `issues[].text` 的产出契约已经要求用大白话写清「哪里、什么问题、为什么、怎么改」
 * （见 audit-agent/gold-audit prompt），而具体问题与改法是开放文本，无法用有限词表无损翻译；
 * 这里保留这句话本身，只裁成 `{ level, status, text }`，避免词典化后丢掉真正让用户判断的细节。
 *
 * ⚠️ 票 `audit-gate-semantics/01`：`passed` **不再透传文件里那个自报布尔**——它由
 * `auditVerdict` 从 issues（level＋status）现算（自报字段只回显、不采信），
 * 读数行 `errors_open/warnings_open/fixed/accepted` 一并下发，界面与闸门读同一份语义。
 *
 * 老记录没有文件、形状不足（含 **issue 缺 status**、accepted-risk 缺理由/确认人）、JSON 损坏，
 * 或用户已用 `audit-skip` 豁免本章检查时，一律 null——「读不出」不许冒充「通过了」。
 */
export function readChapterAuditSummary(project, n) {
  if (waived(project, 'audit-skip')) return null
  const audit = readChapterAudit(project, n)
  if (!isAuditRecord(audit) || !Array.isArray(audit.issues)) return null
  const verdict = auditVerdict(audit)
  if (verdict.problems.length > 0) return null
  const issues = []
  for (const issue of audit.issues) {
    if (issue === null || typeof issue !== 'object' || Array.isArray(issue)
        || typeof issue.level !== 'string' || issue.level.trim() === ''
        || typeof issue.text !== 'string' || issue.text.trim() === '') return null
    issues.push({ level: issue.level, status: issue.status, text: issue.text })
  }
  return {
    passed: verdict.passed,
    issueCount: issues.length,
    issues,
    errors_open: verdict.readings.errors_open,
    warnings_open: verdict.readings.warnings_open,
    fixed: verdict.readings.fixed,
    accepted: verdict.readings.accepted,
  }
}


/** 范例章审计「必读文档矩阵」固定的 5 个必读文件（书夹相对路径）。这份清单的**唯一出处**是
 *  `resources/references/subagent-prompts/gold-audit-prompt.md`（那儿另注明 `工作区/style-line.md` 不进矩阵）；
 *  这里只是它的机器判据，本票不许在别处再抄一份契约。
 *
 *  ⚠️ 矩阵里的 `file` 是**书夹相对路径**（`工作区/…`），且要与那份 prompt 里逐字列的示例对账 ⇒
 *  取 `chapterRel`（相对路径那一个），不是 `chapterName`。 */
function goldAuditFiles(n) {
  return [
    '工作区/explore.md',
    '工作区/knowledge-map.json',
    '工作区/outline.md',
    '工作区/style-spec.md',
    chapterRel(n),
  ]
}


/** 范例章审计被拒时的**可行动报错**（票 audit-matrix-contract/01 (a)）：一次说清三件事——
 *  ① 机器实际解析到的行（行键＋样例）② 契约要求的行形状与 5 个必读文件 ③ 哪一项不对（由 `detail` 说）。
 *  写入侧 `audit-submit` 与读取侧 `stage-submit(gold)` 共用这一个铸造点：两处不会各写一套说法。 */
function goldAuditError(n, detail, matrix) {
  const rows = Array.isArray(matrix) ? matrix : []
  const keys = []
  rows.forEach((row, index) => {
    if (row === null || typeof row !== 'object' || Array.isArray(row)) {
      keys.push(`第 ${index + 1} 行是 ${row === null ? 'null' : (Array.isArray(row) ? '数组' : typeof row)}`)
      return
    }
    for (const key of Object.keys(row)) if (!keys.includes(key)) keys.push(key)
  })
  const samples = []
  for (const row of rows.slice(0, 2)) {
    try { samples.push(JSON.stringify(row).slice(0, 160)) } catch { /* 序列化不了的行只报行键 */ }
  }
  const got = Array.isArray(matrix)
    ? `机器解析到 ${rows.length} 行，行键：${keys.length > 0 ? keys.join('、') : '（无）'}；样例：${samples.length > 0 ? samples.join(' ') : '（无）'}`
    : '机器没能解析出 matrix（整份文件不是合法 JSON，或顶层没有 matrix 键）'
  return `范例章审计不合格（${detail}）。① ${got}。② 契约要求 工作区/${goldAuditName(n)} 是严格 JSON：matrix 对 5 个必读文件各正好一行——${goldAuditFiles(n).join('、')}；每行形状 {file, quote}，quote 必须从对应文件里逐字复制一行原文。`
}


/** 范例章审计结论的机器判据——**写入侧与读取侧唯一的一份判据与报错**（票 01 (b)）。
 *  返回 `{ passed, rows, readings, error }`：`error !== null` ＝ 拒收，两处都用它当那一条 400 文案。
 *  `passed !== true` 与普通章那支同口径：`audit-skip` 豁免可跳过；`gold-skip` 跳过的是「等用户拍板」
 *  那一步，不是验货豁免（三方一致的口径写在 `CONTEXT.md`「验货」）。
 *
 *  ⚠️ **为什么 export 出来**（票 `demo-flow-fidelity/07` 的影子对账）：它是 gold 那一关生产验货的
 *  **唯一实现**（`stage-submit(gold)` 与 `audit-submit` 两处都调它），而影子对账要把演示书盘上那份
 *  `工作区/audit-NN.md` 喂进**同一段**判据——在判据里另抄一份「看起来一样」的量法，正是
 *  `docs/测试信任边界.md` 总纲第 2 条点名「不算反证」的那种写法。先例：`handoffAndDrive` 就是为
 *  G4 那道门导出给判据用的。**导出不改任何一条判定的结果**（本文件行为一字未动，只是可见性）。 */
/** 逐字整行判据的空白归一：把一行里的连续空白（含全角空格）压成一个空格再比。
 *
 *  为什么是「整行」而不是「子串」：票 `flow-audit-2026-10/04` 实测——截成半句、跨两行、
 *  两文件里都出现的同一句互换，旧的 `text.includes(quote)` 全部放行。审计矩阵的全部作用就是
 *  防「写一份审计报告假装读过那 5 份文件」，子串在场证明不了「这一行是那个文件里的原文」。
 *
 *  ⚠️ **枚举面比现实窄在哪里**：它只认「某一行归一空白后逐字相等」。两个文件里**都有一模一样
 *  的整行**时，机器分不清 quote 是从哪一份抄来的（字符串层面不可判定）；它不判「审计员真读了」、
 *  不判 L1–L5 做没做——那两条仍是只有承诺的那一半（见 `checkGoldAudit` 末尾的窄处注释）。 */
function normalizeQuoteLine(line) {
  return String(line).replace(/[\s\u3000]+/g, ' ').trim()
}

/** `quote` 是否是 `text` 里某一行归一空白后的**完整一行**（不是某行的子串）。 */
function hasVerbatimLine(text, quote) {
  const wanted = normalizeQuoteLine(quote)
  if (wanted === '') return false
  return String(text).split(/\r?\n/).some((line) => normalizeQuoteLine(line) === wanted)
}


export function checkGoldAudit(project, n, raw) {
  const parsed = parseAuditJson(raw)
  if (parsed.error !== null) {
    return {
      passed: false,
      rows: 0,
      error: goldAuditError(n, `工作区/${goldAuditName(n)} 不是合法 JSON（${String(parsed.error instanceof Error ? parsed.error.message : parsed.error)}）`, null),
    }
  }
  const audit = parsed.audit
  const matrix = Array.isArray(audit?.matrix) ? audit.matrix : []
  if (matrix.length === 0) {
    return { passed: false, rows: 0, error: goldAuditError(n, '缺文档矩阵（matrix 缺失、为空或不是数组）', matrix) }
  }
  for (const rel of goldAuditFiles(n)) {
    const row = matrix.find((m) => m !== null && typeof m === 'object' && m.file === rel)
    if (row === undefined) {
      return { passed: false, rows: matrix.length, error: goldAuditError(n, `matrix 里没有「${rel}」那一行（每行要用 file 键写文件相对路径）`, matrix) }
    }
    const full = join(projectDir(project), rel)
    if (!existsSync(full)) {
      return { passed: false, rows: matrix.length, error: goldAuditError(n, `必读文件 ${rel} 还没写出来（先把它写出来，再验审计矩阵）`, matrix) }
    }
    const text = readFileSync(full, 'utf8')
    if (typeof row.quote !== 'string' || row.quote.trim() === '' || !hasVerbatimLine(text, row.quote)) {
      return { passed: false, rows: matrix.length, error: goldAuditError(n, `「${rel}」那一行的 quote 对不上（quote 必须从该文件里逐字复制一行原文）`, matrix) }
    }
  }
  // 票 `pre-gold-build/11`（债-24 · R12）：「matrix 对 5 个必读文件各**正好一行**」。
  //
  // 上面那一支只保证每个必读文件**至少**有一行（`find`），多出来的行、重复行原先一律不判——
  // 而承诺面（`resources/references/subagent-prompts/gold-audit-prompt.md`「每个必读文件正好一行
  // （共 5 行）」）比自己强。这一支补的是**生产闸门**那一半（`stage-submit(gold)` 与 `audit-submit`
  // 两处共用同一份判据与报错），判两件、都**点名**：
  //   ① 5 个必读文件之外的任何一行（含没有 `file` 键的行、非对象行）⇒ 拒收、逐行点名；
  //   ② 同一个必读文件出现 ≥2 行 ⇒ 拒收、点名该文件写了几行。
  // ⚠️ **生产面与测试链的分工**：这条判据长在生产路径上（上面两个调用点），测试链（`test/`）
  // 只喂反例证明它承重——**测试链不冒充这道闸门**（边界③）。反例与正例住在
  // `test-flow-transitions-chapters.mjs` 的 D8 那一族。
  // ⚠️ **我的枚举面比现实窄在哪里**：它只对账「这 5 个必读文件的行数／行键」这两维——
  // quote 那一维的判据在**上面**（`hasVerbatimLine`：必须与目标文件里某一行归一空白后**整行相等**，
  // 已不是票 `flow-audit-2026-10/04` 之前那种子串匹配）；两个文件里有一模一样的整行时它分不清
  // quote 是从哪一份抄来的（字符串层面不可判定）。「审计员真读没读那 5 份」、「L1–L5 逐层做没做、
  // 试教触发没触发」一条都不在面内；后两条是**只有承诺**（机器零判据，看 `engine.js` 的
  // `case 'gold'` 那两处标注）。判据这一侧的「逐项差集」断言（`test-contract-gap.mjs`）比的是
  // 契约项名，与本题无关、也不冒充它。
  const requiredFiles = goldAuditFiles(n)
  const rowFileOf = (row) => (row !== null && typeof row === 'object' && !Array.isArray(row) ? row.file : undefined)
  const extraRows = []
  const seenFiles = new Map()
  matrix.forEach((row, index) => {
    const file = rowFileOf(row)
    if (typeof file !== 'string' || !requiredFiles.includes(file)) {
      extraRows.push(`第 ${index + 1} 行（${typeof file === 'string' ? file : '没有 file 键'}）`)
      return
    }
    seenFiles.set(file, (seenFiles.get(file) ?? 0) + 1)
  })
  if (extraRows.length > 0) {
    return {
      passed: false,
      rows: matrix.length,
      error: goldAuditError(n, `matrix 多出 ${extraRows.length} 行、不在这 5 个必读文件里：${extraRows.join('、')}（每个必读文件正好一行，共 5 行）`, matrix),
    }
  }
  const duplicatedRows = requiredFiles.filter((rel) => (seenFiles.get(rel) ?? 0) > 1)
  if (duplicatedRows.length > 0) {
    return {
      passed: false,
      rows: matrix.length,
      error: goldAuditError(n, `${duplicatedRows.map((rel) => `「${rel}」写了 ${seenFiles.get(rel)} 行`).join('、')}（每个必读文件正好一行，共 5 行；重复行点名拒收）`, matrix),
    }
  }
  // 票 `audit-gate-semantics/01`：`passed` 从 issues（level＋status）**现算**，并把读数行说清。
  // ⚠️ 形状（缺 status、accepted-risk 缺 reason/confirmedBy）**不豁免**：`audit-skip` 只跳过
  // 「passed 是否为 true」这一条判定，不跳过审计 JSON 的契约（与 matrix 形状同一口径）。
  const verdict = auditVerdict(audit)
  if (verdict.problems.length > 0) {
    return { passed: false, rows: matrix.length, error: goldAuditError(n, auditShapeRejectReason(verdict.problems), matrix) }
  }
  if (verdict.passed !== true && !waived(project, 'audit-skip')) {
    return {
      passed: false,
      rows: matrix.length,
      error: goldAuditError(
        n,
        `passed 不是 true（按 issues 现算：${readingsLine(verdict.readings)}；报告自报 passed=${String(verdict.declaredPassed)}）。`
          + '先按审计意见修订、逐条把 status 改回 fixed（accepted-risk 要写 reason 与 confirmedBy）、重新审计后再交工',
        matrix,
      ),
    }
  }
  return { passed: verdict.passed, rows: matrix.length, readings: verdict.readings, error: null }
}


/**
 * 单章审计在**合稿／终检**那一刻的判据（票 `audit-gate-semantics/01` 的 A4）。
 *
 * 章交工闸与合稿／终检闸读的是**同一个** `verdict.passed`（＝按 issues 现算）——
 * ⛔ 不认审计员自报的那个布尔（票面：「`passed` 不再由审计小助手自报」）。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：
 *  - **0 章有交工记录**时整条不动（「跳过章交工、直接造 merge 夹具」的测试/演示旁路不在面内）；
 *    一旦有 ≥1 章有记录，就要求**每一章**都有（少一章即点名），⛔ 不允许「十章里只对了一章」。
 *    正常流程里过不了章交工就到不了这一跳，所以真书上是全量对账。
 *  - 只判「记录读得出、issues 形状合格、`errors_open=0`（且 `warnings_open ≤ 阈值`）」；
 *    审计员真读没读、条目判得对不对，仍不在机器面内。
 *
 * @param {string} project
 * @param {number} n
 * @returns {string|null} 不合格时的点名句（含章号与读数行），合格 null
 */
function chapterAuditGateProblem(project, n) {
  const { auditPath } = chapterArtifacts(project, n)
  if (!existsSync(auditPath)) return `第 ${n} 章缺审计记录 ${auditRel(n)}`
  const audit = readChapterAudit(project, n)
  if (!isAuditRecord(audit)) {
    return `第 ${n} 章审计记录读不出（${auditRel(n)} 不是合法 JSON 对象）`
  }
  const verdict = auditVerdict(audit)
  if (verdict.problems.length > 0) {
    return `第 ${n} 章审计记录不合契约（${auditRel(n)}）：${auditShapeRejectReason(verdict.problems)}`
  }
  if (verdict.computedPassed !== true) {
    return `第 ${n} 章 ${readingsLine(verdict.readings)}（阈值：warnings_open ≤ ${AUDIT_WARNINGS_OPEN_MAX}）`
  }
  return null
}


/**
 * 合稿／终检共用的「每章 `errors_open = 0`」断言（票面 A4）——**单一实现**，两跳都调它。
 *
 * `audit-skip` 与演示书跳过（与章交工那一支同口径：豁免＝用户同意不要求每章独立审查）。
 *
 * @param {string} project
 * @param {object|null} [meta] 已读账本（省一次读盘）
 * @returns {{checked: number, problems: string[]}}
 */
function chapterAuditGateProblems(project, meta = null) {
  const subMeta = meta ?? readMeta(project)
  if (subMeta === null || subMeta.demo === true || waived(project, 'audit-skip')) return { checked: 0, problems: [] }
  const chapters = Array.isArray(subMeta.outline?.chapters) ? subMeta.outline.chapters : []
  const problems = []
  let checked = 0
  for (let n = 1; n <= chapters.length; n += 1) {
    if (!chapterDone(project, n, subMeta)) continue
    checked += 1
    const problem = chapterAuditGateProblem(project, n)
    if (problem !== null) problems.push(problem)
  }
  // 有交工记录就要求全量：否则「十章只对了一章」也会绿（票面 A4 的「十章」）。
  if (checked > 0 && checked < chapters.length) {
    problems.unshift(`还有 ${chapters.length - checked} 章没有机器记下的交工（已交工 ${checked}/${chapters.length}）：`
      + '先在章交工那一跳逐章交齐并让它按 issues 现算通过，再合稿')
  }
  return { checked, problems }
}


/** 合稿／终检拒收文案：逐章点名 + 回写要求（两跳共用，⛔ 不各拼一份）。 */
function chapterAuditGateRejectReason({ problems }) {
  return `合稿前审计读数未清零：${problems.join('；')}。合稿要求每一章 errors_open = 0`
    + `（warnings_open 阈值 ${AUDIT_WARNINGS_OPEN_MAX}）：逐条修订、把对应 issue 的 status 回写 fixed`
    + '（或 accepted-risk 并写 reason/confirmedBy）、重新审计后再交工。'
}


/**
 * 从各章 `工作区/audit-NN.md` 现算读数并落 `工作区/审计读数.json`（票面「要的做法」第 3 条）。
 *
 * ⚠️ 写下的是一份**派生的快照**，不是判据：合稿／终检每次都重新从 `audit-NN.md` 现算，
 * ⛔ 不读这份文件当绿证（过期快照不许洗绿）。没读出的章在这份文件里是 `readable:false`，
 * 读数记 `null`（不拿 0 冒充「没有未解决问题」）。
 *
 * @param {string} project
 * @param {object|null} [meta]
 * @returns {object|null} 落盘的那一份（`meta` 读不出时 null）
 */
function refreshAuditReadings(project, meta = null) {
  const subMeta = meta ?? readMeta(project)
  if (subMeta === null) return null
  const chapters = Array.isArray(subMeta.outline?.chapters) ? subMeta.outline.chapters : []
  const entries = chapters.map((_chapter, index) => {
    const n = index + 1
    const audit = readChapterAudit(project, n)
    const readable = isAuditRecord(audit)
    const verdict = readable ? auditVerdict(audit) : null
    // 读数四格**按键集生成**（`AUDIT_READING_KEYS` 是唯一出处，⛔ 不在这里手抄第二份键顺序）。
    const readings = Object.fromEntries(AUDIT_READING_KEYS.map((key) => [key, verdict === null ? null : verdict.readings[key]]))
    return {
      n,
      readable,
      ...readings,
      passed: verdict !== null && verdict.computedPassed,
      problems: verdict === null ? ['工作区/audit-NN.md 读不出或不是 JSON 对象'] : verdict.problems,
    }
  })
  const sum = (key) => entries.reduce((total, entry) => total + (Number.isSafeInteger(entry[key]) ? entry[key] : 0), 0)
  const payload = {
    version: 1,
    chapters: entries,
    totals: {
      errors_open: sum('errors_open'),
      warnings_open: sum('warnings_open'),
      fixed: sum('fixed'),
      accepted: sum('accepted'),
      chapters_unreadable: entries.filter((entry) => entry.readable !== true).length,
    },
    // 票面 A4 的那一句读数：十章（＝每一章）errors_open 全 0 才为真。读不出的章不算 0。
    all_errors_open_zero: entries.length > 0 && entries.every((entry) => entry.errors_open === 0),
  }
  writeWork(project, AUDIT_READINGS_FILE_NAME, `${JSON.stringify(payload, null, 2)}\n`)
  return payload
}


/**
 * 票 `confirm-points-redesign-build/01`（票面落点 (c)）· **站 5 的派单前硬闸**；
 * 票 `confirm-points-redesign-build/17` 把它补齐到**每一个有派单通路的站**。
 *
 * 「派单前」＝这一跳（主笔来领任务 / 派小助手那两处），⛔ 不是造派单件那一层——
 * 那一层（`buildStageBrief`）今天被大量判据直调，在那里抛会连带打断别人的夹具。
 *
 * 强度照实认（spec §4.3／05 §3 第 1 条）：机器验的是「**结论件在 ＋ 它指的正文在**」，
 * 「AI 真的读了它」那一半**机器验不了**，这里一个字都不冒充。
 *
 * **站号来源**：⛔ 本文件**不另立第二份站↔关／站↔段映射**——关卡那三站走 `decision-record.js`
 * 那张唯一的 `STATION_OF_GATE`；不是关卡的段（站 7／8）由本函数按「这一段服务的停点是哪一站」直接点名
 * （与 `buildStageBrief` 里那几根指针**同一份事实**，spec §3.2 逐站的「落点」）。
 *
 * | 这一段（`meta.pendingStage`） | 服务的停点 | 吃什么（上游） |
 * | --- | --- | --- |
 * | `goal` | 站 3（学完能做到什么） | 站 2 的结论件 ＋ `工作区/explore.md` |
 * | `gate` ＋ `pendingGate ∈ {1,2,3}` | 站 4／5／6 | 上一站的结论件 ＋ 它指的正文 |
 * | `outline` | 站 7（章节安排） | 站 6 的结论件 ＋ `工作区/方案/关卡3-vM.md` |
 * | `gold` | 站 8（范例章那一趟） | 站 7 的结论件 ＋ `工作区/outline.md` |
 * | 其余（`explore`／`chapters`／`merge`／`final`） | —— | 今天不在本闸的面内（spec §4.3 的 11 条只数站 1–9） |
 *
 * ⚠️ **站 9 不在表里，这是盘上事实不是漏做**：`handoff()` 的 stage 枚举里没有站 9
 * （`src/workflow/engine.js` 的 `function handoff(ctx, projectId, stage, …)`，取值只有
 * `explore／goal／gate／outline／gold／chapters／merge／final`）——谈判桌那一屏是**一次点击**
 * （`gold-target-words-set`：写回字数 ＋ 重写 `工作区/outline.md` ＋ 落 `工作区/决策/09.json`），
 * 机器**不派单** ⇒ 「站 9 的派单前校验」在盘上**无处可挂**。它那一格落成**同一处读侧**的判据
 * （`stationPreconditionProblem(project, 9)`，上游＝站 8）＋ 反证，见
 * `test/test-station-decision-record.mjs` 第七节；票 17 的 `## Answer` 逐字记了这一条。
 *
 * ⚠️ **与站 7 的「章数对账」是两件事**（spec §3.2 当时写「硬闸 **2** 条」，其中章数那一条已被
 * 票 `stage3-hard-limits/02` 降级为非阻断读数——2026-10-27 维护者裁决章数上下限都不判）：
 *   · **本闸**判的是「**上游的结论件吃不吃得到**」（派单前，缺 ⇒ 不开这一站），仍是硬闸；
 *   · **章数对账**判的是「这一站交上来的 `outline.chapters.length` 与站 6 拍板的 `values.chapters`
 *     对不对得上」（**交工那一刻**，`actions/chapters.js` 的 `case 'outline'` 里那一支）——
 *     **只记一条读数、不拒收**，不再是硬闸。
 *   两者判据不同、时刻不同 ⇒ ⛔ 不合并成第二条口径。
 *
 * @param {string} project 书夹 id
 * @returns {string|null} 缺件时那句当场报错的话；齐了（或这一段不在面内）就 `null`
 */
function stageDispatchPreconditionProblem(project) {
  const meta = readMeta(project)
  if (meta === null) return null
  // 站 3 那一趟（`goal`）：站 2 的结论件（`工作区/决策/02.json`）＋ 它指的那份正文
  //（`工作区/explore.md`）缺一件就**不开这一站**（spec §3.2 站 3 的强度：硬闸 1 条 ＋ 只有承诺 1 条；
  // 旁证缺 —— 剔除件 —— 走降级，不在这里拦）。
  if (meta.pendingStage === 'goal') return stationPreconditionProblem(project, STATION_GOALS)
  // 站 4／5／6（＝第 1／2／3 关）：站号由**那一张唯一的**站↔关映射给（⛔ 不在这里另立一份——
  // `STATION_OF_GATE` 逐字是 `{4:'1', 5:'2', 6:'3'}`，`String(pendingGate)` 上的 `null`／越界值取不到 ⇒ 不判）。
  if (meta.pendingStage === 'gate') {
    const station = STATION_OF_GATE[String(meta.pendingGate)]
    return station === undefined ? null : stationPreconditionProblem(project, station)
  }
  // 站 7（章节安排）／站 8（范例章那一趟）：各吃**上一站**的结论（站 6／站 7）。
  if (meta.pendingStage === 'outline') return stationPreconditionProblem(project, 7)
  if (meta.pendingStage === 'gold') return stationPreconditionProblem(project, 8)
  return null
}


/**
 * 终检交工（`stage-submit final`）与认可交付（`final-approve`）**共用**的交付前硬条件。
 *
 * 票 `flow-audit-2026-10/01` 的病因：认可交付那一跳只重跑 `runQualityChecks`（八条硬检查），
 * 而 `stage-submit(final)` 另有五条**不在** `runQualityChecks` 里的门——留言销号、进度账本、
 * 五份分查报告、style-spec 指纹、**每章审计 `errors_open=0`**（票 `audit-gate-semantics/01`）。
 * 交工之后、认可之前把盘改坏，这几条都不再验，书照样交付。
 *
 * 这里把它们收成**一份只读判据**，两跳都调它（⛔ 不各写一套）。返回 `[{status, message}]`：
 * 第一条就是调用方该回给用户的那条拒收（状态码沿用原来各格：留言 409、其余 400）。
 *
 * ⚠️ **判据面比现实窄在哪**：它只判「这一份在不在、读不读得出、形状对不对」，不判报告内容真假、
 * 不判 style-spec 那一次改动是否真经用户确认（声明行是唯一出口）、也不判进度账本每一行是否真实。
 * 这些仍是只有承诺的那一半。
 *
 * @param {string} project 书夹 id
 * @param {object|null} [meta] 已读的账本（省一次读盘；不传则现读）
 * @param {{report?: string}} [options] `report` 用于认「style-spec 变更：」声明（认可交付那一跳没有新报告）
 * @returns {Array<{status: number, message: string}>}
 */
export function finalDeliveryProblems(project, meta = null, { report = '', atApproval = false } = {}) {
  const subMeta = meta ?? readMeta(project)
  if (subMeta === null || subMeta.demo === true) return []
  const problems = []
  const pendingIv = (subMeta.pendingInterventions ?? []).filter((item) => item?.status === 'pending')
  if (pendingIv.length > 0) {
    problems.push({
      status: 409,
      message: `还有 ${pendingIv.length} 条用户留言没处理：${pendingIv.map((item) => item.text).join('；')}。先处理（intervene-done）再交工。`,
    })
  }
  if (!waived(project, 'progress-skip') && !existsSync(workFile(project, 'progress.md'))) {
    problems.push({
      status: 400,
      message: '缺 工作区/progress.md（进度账本）：每章一行（写完/审计/验货），是中途换人/重做的参照。不需要可先豁免「跳过进度账本检查」再交工。',
    })
  }
  // 票 `audit-gate-semantics/01` · A4：合稿／终检前每章 `errors_open = 0`（与 merge 那一跳共用同一份）。
  // 放在分查报告之前：章审计有未解决「错误」时，先修章，不必等终检那五份报告都写完才被告知。
  const auditGate = chapterAuditGateProblems(project, subMeta)
  if (auditGate.problems.length > 0) {
    problems.push({ status: 400, message: chapterAuditGateRejectReason(auditGate) })
  }
  const reportMissing = FINAL_AUDIT_SCOPES
    .filter(({ n }) => !existsSync(join(reportDir(project), finalAuditReportName(n))))
    .map(({ n }) => finalAuditReportRel(n))
  if (reportMissing.length > 0) {
    problems.push({
      status: 400,
      message: `分查报告缺失：${reportMissing.join('、')} —— 五路分查每一路都要有一份落盘报告（由写那份报告的小助手自落，协调员不转写），缺 ${reportMissing.length} 份。`,
    })
  } else {
    const unreadable = []
    const finalAuditReports = FINAL_AUDIT_SCOPES.map(({ n }) => {
      try {
        return { n, text: readFileSync(join(reportDir(project), finalAuditReportName(n)), 'utf8') }
      } catch {
        unreadable.push(finalAuditReportRel(n))
        return { n, text: '' }
      }
    })
    if (unreadable.length > 0) {
      problems.push({
        status: 400,
        message: `分查报告读不出来：${unreadable.join('、')} —— 报告人自落的那一份必须是一份可读的文本件，补齐再交工。`,
      })
    } else {
      const contentProblems = judgeFinalAuditReports(finalAuditReports)
      if (contentProblems.length > 0) {
        problems.push({ status: 400, message: finalAuditReportsRejectReason(contentProblems) })
      }
    }
  }
  let specNow = null
  try { specNow = specFingerprint(project) } catch { /* spec 被删/不可读：视为已变更（堵「删 spec 逃检查」的逃逸口） */ }
  if (subMeta.styleSpecHash != null && specNow !== subMeta.styleSpecHash && !report.includes('style-spec 变更')) {
    problems.push({
      status: 400,
      message: atApproval
        ? 'style-spec 在范例章定稿后有改动，而认可交付这一跳没有 report 通道：先把它改回定稿时那一版；若这次改动经用户确认，请让 AI 在终检交工时写「style-spec 变更：<改了哪条>」重新交工，再回来认可。'
        : 'style-spec 在范例章定稿后有改动（机器对账发现）：若改动经用户确认，请在 report 末尾写明「style-spec 变更：<改了哪条>」再交工；未经用户确认的改动请改回原样。',
    })
  }
  return problems
}


/** 动作族 · 章节执行与审阅：'audit-submit' / 'review' / 'stage-submit' / 'stage-brief' / 'progress'。 */
export const actChapters = familyOf('chapters', async ({ ctx: ctx, action: action, sessionId: sessionId, project: project, body: body }) => {
  /** 拒收入账（票 01 (d)，票 02 铺满交工类）：**交工被机器拒收**时一律落一条账本事件（含 stage 与原因）——
   *  账本与工作台读得到「交工被拒：<原因>」，不再只活在对话轨迹里。
   *  票 02 的范围：这一族（A 类 · 业务事实）＝ `stage-submit` 各阶段分支里判「这一阶段该交出来的东西」
   *  的那 20 处 + 票 01 落下的 gold 5 处，一律走这个助手（`stage` 实参取 canonical 阶段词）。
   *  参数校验那一族（B 类 · 调用方自己把请求写错：章节号/意见正文/`body.chapter` 范围/未知阶段）照旧裸
   * `reject(400, …)`（**不落这条账**）——把它们记成「交工被拒」会让工作台事件行说假话。
   *
   * ⚠️ 票 03 第 2 步：**25 个调用点全部带 `return`**。这在 helper 内部直接写响应时不是必需的
   * （隐式契约：helper 自己回），改成返回回包后每个调用点都必须显式 return，否则拒收路径不回包。
   * 改这个 helper 之前先数调用点。 */
  const rejectSubmit = (stage, reason) => {
    appendEvent(project, 'textbook/submit-rejected', { stage, reason })
    return reject(400, reason)
  }
  switch (action) {
    case 'review': {
      // 用户抽查提意见（铺章阶段）：记录 → 主 AI 处理。
      assertSessionOwned(project, sessionId)
      const rvMeta = readMeta(project)
      if (rvMeta === null) throw new Error(`unknown project ${JSON.stringify(project)}`)
      const n = Number(body.chapter)
      const chapters = rvMeta.outline?.chapters ?? []
      const comment = typeof body.comment === 'string' ? body.comment.trim() : ''
      if (!Number.isSafeInteger(n) || n < 1 || n > chapters.length) {
        return reject(400, '章节号不合法')
      }
      if (comment === '') {
        return reject(400, '请写下你的意见')
      }
      if (rvMeta.phase !== 5) {
        return reject(409, '现在不在写完整本的阶段，没法直接在章节卡写意见；可以在对话里告诉 AI，它会帮你安排')
      }
      // 票 09：入账必须自带身份与「待处置」——没有 id 就没有可点名/可撤销的对象，
      // 没有 status='pending' 就没有「未处置」这个机器判据认得的态（id 造型照 gold.js 的既有做法）。
      const opinionId = `pr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
      // 意见入账 + 置态一次收进改法（当场新读）：原先拿请求开头那份状态整份写回，会把中途
      // 「记一笔」刚推进的账高带回旧值（票 02 的形状）。`inChaptersReview` / `pendingAfter` 取改法里的值。
      let inChaptersReview = false
      let pendingAfter = null
      updateMeta(project, (state) => {
        const reviews = Array.isArray(state.pendingReviews) ? state.pendingReviews : []
        reviews.push({
          id: opinionId,
          chapter: n, comment, at: Date.now(), status: 'pending',
        })
        state.pendingReviews = reviews
        // 过目态下提意见：转回 running 并交办修订（改完回来继续过目）。
        inChaptersReview = state.status === 'awaiting-chapters-review'
        state.status = 'running'
        if (inChaptersReview) {
          state.pendingStage = null
          state.chaptersReviewed = false
        }
        pendingAfter = state.pendingStage
      })
      const title = chapters[n - 1]?.title ?? `第${n}章`
      // 事件带 `reviewId`（与 meta.pendingReviews 的 id 同源）：深改截断账本时要按它把被删事件对应的
      // 意见一并去掉（票 13，engine 的 syncPendingReviewsAfterTruncate），没有这个字段就只能靠
      // 「同章 + 原文」猜，同一章提两次一样的意见就会误留孤儿。
      appendEvent(project, 'textbook/review', { reviewId: opinionId, chapter: n, title, comment })
      if (inChaptersReview) {
        // 过目态提意见＝把书从「等你过目」翻回「我正在做」并交办修订。**这一处原先漏了演示书那一半**：
        // `handoff` 对 demo 书恒返回「没叫醒」（`wakeMainAI` 对 `meta.demo === true` 早退），
        // 而 demo **没有主 AI 可唤醒** ⇒ 书停在 `running` ＋ `pendingStage='chapters'`，谁都不推，
        // 直到用户自己猜到再点一次「继续／重试」（那条路走 `convert.js` 的 `handoffAndDrive`，
        // 所以能恢复，但那不是用户猜得到的一步）。改走引擎那一处（票 `demo-flow-fidelity/05`）：
        // 真书照旧「只唤醒、不额外 kick」（判据是 `woke === false && meta.demo === true`），
        // demo 书补一趟 kick，由演示占位通道自己把下一步做出来。
        handoffAndDrive(ctx, project, 'chapters')
      } else {
        const pending = pendingAfter
        if (pending === null || pending === undefined || pending === 'chapters') {
          // 机器空闲或正在铺章：唤醒/让主 AI 接着处理意见（交工前必查意见）。
          // ⚠️ 只有**机器空闲**（`pending` 为空）这一支才交办——`pending === 'chapters'` 说明铺章
          // 已经交办过（主 AI 接工时会查意见），再交一次就是重复唤醒。
          // 这一支与上面同族：交办之后同样得有人推，所以同样走 `handoffAndDrive`。
          // 可达性（本票实施时逐条读过，票面 Answer 记了依据）：`convert.js` 的「重新推状态机」
          // 那一支会留下 `status='running'` ＋ `pendingStage=null`；此刻用户在章节卡写意见就走这里
          //（章卡那颗「✍️ 写意见」只按「这一章有产物 ＋ 书有骨架」渲染，不按 `status`）。
          if (pending === null || pending === undefined) handoffAndDrive(ctx, project, 'chapters')
        }
      }
      // 若正在合并/终检：不打断；主 AI 交工前会查 workbench_status 里的抽查意见并先处理。
      return accept({ project, chapter: n, queued: true })
    }
    case 'review-revoke': {
      // 票 09（4）+ 票 10 的前置：用户翻案——把一条已被处置的抽查意见退回「未处置」。
      // 写回 'pending'（**不是** 'revoked'）：pending 是机器按章交工唯一拦的那个态，
      // 退回 pending 才谈得上「书被重新拦回」；写 revoked 等于把这条意见永久作废，翻案就成了空话。
      assertSessionOwned(project, sessionId)
      const rkMeta = readMeta(project)
      if (rkMeta === null) throw new Error(`unknown project ${JSON.stringify(project)}`)
      const review = (Array.isArray(rkMeta.pendingReviews) ? rkMeta.pendingReviews : [])
        .find((r) => r.id === body.reviewId)
      if (review === undefined) {
        return reject(404, '没有这条抽查意见')
      }
      // 翻案只改这一条意见，走单一入口在**当场新读**的状态上改。原先这里还自己写了一次
      // `updatedAt`——「最后动静时刻」只归「记一笔」所有（ADR-0016 决策 1）；本动作不记事件，故不动它。
      let revoked = null
      updateMeta(project, (state) => {
        revoked = (Array.isArray(state.pendingReviews) ? state.pendingReviews : [])
          .find((r) => r.id === review.id)
        if (revoked === undefined) return
        revoked.status = 'pending'
        delete revoked.how // 翻案即撤销「怎么处置的」这句交代，重新处置时再写一条新的
      })
      if (revoked === undefined || revoked === null) {
        return reject(404, '没有这条抽查意见')
      }
      return accept({ project, reviewId: revoked.id, chapter: revoked.chapter, review: revoked })
    }
    case 'graph-opinion': {
      // 票 `knowledge-graph-build/08` · **第三条「意见」通路**（spec §6 末段那条落地代价）：
      // 知识点图上那两颗键——「🗑 这部分不造进书里」＝`不讲`、「↩ 放回来（要讲）」＝`要讲`。
      //
      // ## 为什么是**第三条**、以及它认哪一档
      //
      // 既有两条「意见」通路**各自绑死阶段**：`gold-opinion` 的整章支只认
      // `status === 'awaiting-gold' || pendingStage === 'gold'`（`gold.js`），段落支与 `review`
      // 只认 `phase === 5`。而这张图住在**阶段二探查确认卡**上，那一档是
      // `status === 'awaiting-explore'`（`src/ui/view-rules.js` 的 `focusCardKey`）⇒ 那两条
      // 一条都够不着这一屏，这里只能**新开一条**。
      // ⚠️ 三条**互不认领**：各认各的那一档，谁都不认领别人的（两个方向的反例都在
      // `test-collab-backend.mjs`：本条在 `awaiting-gold` 上 409，那两条在 `awaiting-explore` 上 409）。
      //
      // ## 这一跳**落盘**（票 09 接上了那半；票 08 当年只做到「界面上成立」）
      //
      // 票 08 的落点是「不做人的裁决产物」——那一半归本票。现在这一跳把裁决记进
      // `工作区/knowledge-map-exclusions.json`（形状 `{items:[{key,title,reason,by,at}]}`）：
      //   · `不讲`（🗑）⇒ 记一条（`reason` ＝ `不需要`：本书不覆盖这个主题，归本 effort）；
      //     票 `confirm-points-redesign-build/10` 起可带**理由档**（`body.reason`）：框里那颗键走
      //     `不需要`、图上那把**划子**走 `已经会`（读者已经会了 ⇒ 下沿那一半）——**同一份记录**、
      //     两个理由、两处入口（规划票 `confirm-points-redesign/08` §4 的 C5 逐字）。
      //   · `要讲`（↩ 放回来）⇒ 把这一条去掉（那份件照旧在盘上，全部放回来时是 `items: []`）。
      // ⚠️ **它仍然不入账**（不 `appendEvent`）：这不是「交工被拒」那类业务事实，与票 08 的口径
      // 一致——这份件自己带 `by`／`at`，追溯读它。
      // ⚠️ **坏形状不覆盖**：那份件是人写的，读出来坏了就**停手并说清**（⛔ 不静默重写掉人的东西）。
      //    形状坏了的硬闸在 `outline` 交工那一跳（那份集合真正被消费的那一刻）。
      assertSessionOwned(project, sessionId)
      const goMeta = readMeta(project)
      if (goMeta === null) throw new Error(`unknown project ${JSON.stringify(project)}`)
      // ① 阶段守卫（本票起**两条入口**；票 `reader-cognition-boundary-build/10`）：
      //    · **站 2 那张卡**：`awaiting-explore` 且**还没拍过板**（`exploreConfirmed !== true`）——
      //      既有那条，一个字不放宽；
      //    · **老书维护通路**（票 `reader-cognition-boundary` 的票 11／spec §4.6）：`exploreConfirmed === true`
      //      的书在阶段 2 那一屏**补一份读者边界**——那是**产品决定**（过了站 2 的书还够得着这张图），
      //      不是本票顺手放宽的：界在那本书**已经交出过材料报告**，而重做探查会把
      //      `exploreConfirmed` 清掉（`deep-modify.js`）⇒「正在重做探查」那一档也进不来。
      // ⚠️ 放宽**只到这两条**：没过站 2 的书照旧 409（下面那句拒绝文案逐字不变）。
      // ⚠️ **2026-10-17 票 `rcb-build/06` 加注**：这条通路自本票起还有**第三种**走法——
      //    AI 读回卷件**代笔**（`reason` ＝ `已经会`，ADR-0040 决策 2）。它**落在**
      //    `goOldBookMaintenance` 那一支上（回卷件是在站 2 拍板**之后**、站 3 那一趟才被读的），
      //    **不是**新开一条入口：写侧形状、`by`、理由闭集一个字没动。⇒ 那句「只到这两条」按
      //    「**阶段守卫只认这两格**」读，⛔ 别读成「只有两条写路」。
      const goOnExploreCard = goMeta.status === 'awaiting-explore' && goMeta.exploreConfirmed !== true
      const goOldBookMaintenance = goMeta.exploreConfirmed === true
      if (!goOnExploreCard && !goOldBookMaintenance) {
        return reject(409, '现在不在「AI 挑出来的重点」这一步的确认卡上，图上划不了（等那张卡出来再划）')
      }
      // ② 请求形状（B 类：调用方把请求写错 ⇒ 裸 400，**不落**「交工被拒」那条账）。
      const goVerdict = GRAPH_OPINION_VERDICTS.includes(body.verdict) ? body.verdict : null
      const goKey = typeof body.key === 'string' ? body.key.trim() : ''
      if (goVerdict === null || goKey === '') {
        return reject(400, `图上意见需要「哪一张卡」与「${GRAPH_OPINION_VERDICTS.join('／')}」两样`)
      }
      // ②b **理由档**（票 `confirm-points-redesign-build/10`）：可选的第三个字段，缺省＝框里那颗键
      //     那一档（`不需要`）。图上那把划子递的是**另一档**（`已经会`）——两档今天都已登记且有
      //     校验（`domain-rules.EXCLUSION_REASONS`），今天补上的只是**第二个入口**。
      //     ⚠️ 出域值当场 400：⛔ 不静默落成缺省那一档（那会把人的另一个意思记成「不需要」）。
      //     ⚠️ 缺省这一档**留着**是给老调用方的：`{key, verdict}` 这条载荷一个字不改（票 08 的契约）。
      const goReason = body.reason === undefined || body.reason === null ? EXCLUSION_REASON_NOT_NEEDED : body.reason
      if (!EXCLUSION_REASONS.includes(goReason)) {
        return reject(400, `图上意见的 reason 是 ${JSON.stringify(body.reason)}，不在「${EXCLUSION_REASONS.join('／')}」里（不写就按「${EXCLUSION_REASON_NOT_NEEDED}」记）`)
      }
      // ③ 这张卡必须真在这次合并件的图上：与 §9 那道覆盖闸门问**同一个读侧出口** `readMergedMap`
      //    ——口径只有一条（严格 JSON 对象才算「有」；缺件／坏 JSON／数组／数字一律 `map === null`），
      //    解析归它，本文件不再自己 `JSON.parse`。判「图在不在」仍走形状闸自己的读数 `graphPresent`
      //    ——⛔ 不在这里另写一套「两个键都在」（那就是第二份口径）。
      //    ⚠️ 这一格是**读屏障**不是裁决：它只知道「这张卡在图上」，不知道「此刻是否轮到它」
      //    （前沿是界面那套模型的事；机器不替人判，也不替界面重算一遍）。
      const goMerged = readMergedMap(project).map
      if (goMerged === null || knowledgeMapGateProblems({ merged: goMerged }).readings.graphPresent !== true) {
        return reject(409, '这本书的合并件里还没有知识点图（老书那一档），图上没得划')
      }
      const goCards = Array.isArray(goMerged.cards) ? goMerged.cards : []
      const goCard = goCards.find((card) => card !== null && typeof card === 'object' && card.key === goKey)
      if (goCard === undefined) {
        return reject(400, `这份知识点图上没有「${goKey}」这张卡`)
      }
      // ④ 落盘那一半（唯一写侧入口在 `workflow/knowledge-map-exclusions.js`）。
      const goExisting = readExclusions(project)
      if (goExisting.present && goExisting.problems.length > 0) {
        return reject(409, `这本书上那份人写的裁决记录（\`${KNOWLEDGE_MAP_EXCLUSIONS_REL}\`）读不出：${goExisting.problems[0]}。它在盘上，修好它再划（⛔ 机器不覆盖人写的东西）`)
      }
      const goTitle = typeof goCard.name === 'string' ? goCard.name : ''
      const goNow = Date.now()
      const goNext = goVerdict === '不讲'
        ? addExclusion(goExisting.items, {
          key: goKey,
          // ⚠️ 记**当时**那个 title：重拼之后卡片改名了，这一条就该判陈旧（spec §9 逐字）。
          title: goTitle,
          reason: goReason,
          by: EXCLUSION_BY_USER,
          at: goNow,
        })
        : removeExclusion(goExisting.items, goKey)
      writeExclusions(project, goNext)
      // ⑤ 老书维护通路的**独立一笔账**（票 `reader-cognition-boundary-build/10`；
      //    ⛔ 与补图那笔 `meta.knowledgeGraphBackfill` 不共用键、不共用记号）。
      //    只在**老书那条入口**落：站 2 那张卡上划的那批不算「补的」（那本书的边界是当场定的）。
      //    · 划一条 ⇒ 这笔账在场且清掉撤回（再补一次＝重新生效）；
      //    · **全部放回**（这份件回到空 `items`）⇒ 落 `withdrawnAt`（撤回**真能触发**的落点）。
      //    ⚠️ 这里**不 appendEvent**（与 §④ 那份件同一口径）：这不是「交工被拒」那类业务事实；
      //    这一笔只记「这份**人的**声明是补的、从什么时候起生效」，追溯读 meta 与那份件自带的
      //    `by`／`at`（补图那一笔入账，是因为它改了机器产物，两者不同轴）。
      //    ⚠️ **2026-10-17 票 `rcb-build/06` 加注**：AI 读回卷件代笔那一批**也走这一支**
      //    （见上面 ① 的加注）⇒ 对「刚过站 2、问卷回卷来的那几条」而言，这笔账记的是
      //    「**在站 2 成文之后**补进来的那一批」，与票 10 那句「只对还没写的章生效／已写已交付的章
      //    一个字没动」同义、**不是**假话（代笔发生在站 3 那一趟，早于任何章）。
      //    ⛔ 今天**不**给这条入口加第二个判别字段（载荷与站 2 那张卡同形是票 10 的裁决）；
      //    真要把「老书补的」与「回卷代笔的」分开记，那是一次新决定，归决定面。
      if (goOldBookMaintenance) {
        updateMeta(project, (state) => {
          applyReaderBoundaryBackfillAccount(state, {
            now: goNow,
            added: goVerdict === '不讲',
            recordEmpty: goNext.length === 0,
          })
        })
      }
      return accept({ project, key: goKey, verdict: goVerdict, reason: goReason, persisted: true, excluded: goNext.length })
    }
    case 'chapter-assemble': {
      // 票 `walkthrough-2026-10/02`（走查 A10「同一文件多写者」的裁决）：**机器拼章正文**。
      //
      // 协议（交办说明与派发模板都照这一段说）：写作小助手**只落分片** `工作区/分片/chapter-NN-MM.md`
      // （一路一个号，谁也不碰别人的分片）；分片落齐之后主笔叫**这一步**，机器按分片号升序拼出
      // `工作区/chapter-NN.md`；审计小助手读的就是机器拼出来的那一份。
      //
      // ⚠️ 为什么必须由主笔显式叫一次（而不是只在交工那一刻拼）：审计小助手在**交工之前**就要读正文，
      // 而票 22 的新鲜度闸门比的是正文与检查记录的 mtime——晚拼一步，检查记录就当场变成「审的是旧稿」。
      // 所以「拼」与「验收」是两步：这一步只管把正文做出来（盘上那份若不是拼装件就覆盖它，
      // 因为它的职责不是验收），验收在 `stage-submit`。
      assertSessionOwned(project, sessionId)
      const caMeta = readMeta(project)
      if (caMeta === null) throw new Error(`unknown project ${JSON.stringify(project)}`)
      const caN = Number(body.chapter)
      const caChapters = caMeta.outline?.chapters ?? []
      if (!Number.isSafeInteger(caN) || caN < 1 || caN > caChapters.length) {
        return reject(400, 'chapter 参数不合法（需要第几章的编号）')
      }
      if (caMeta.pause !== null && caMeta.pause !== undefined) {
        return reject(409, '已在暂停，请先点继续（▶）再拼章正文')
      }
      const ca = assembleChapter(project, caN)
      if (ca.status !== 'ok') {
        return rejectSubmit('chapters', chapterAssemblyReject(ca, caN))
      }
      // ── 票 `walkthrough-fixes/36`：**改章之后重拼成品**（修法 1）────────────────────────────
      // 最后检查阶段改章走的就是这一条（分片 → 机器拼章正文）。原先成品 `book.md` 只有合并那一跳
      // 一个写点，于是改完章、成品仍停在旧稿，只能靠 AI 手抄（真机漂了 3 章 9 处）。
      // 现在：章正文写下去之后，**同一次**由机器把成品重拼——与合并那一跳同一个纯函数；
      // 拼出来逐字相同就一个字节都不写（守住 `chapter-assembly.js` 头部那条 mtime 纪律）。
      // ⚠️ 只对「机器合并过的书」生效（`refreshBookAfterChapterAssemble` 里那一枚判据）：
      // 铺章阶段 `book.md` 还不存在，这里什么也不做（⛔ 不替合并闸门抢跑）。
      const bookSync = refreshBookAfterChapterAssemble(project)
      // 票 `walkthrough-2026-10/02` · **账上要有痕**（code-review 规格轴 C2）：这一步会写掉
      // `工作区/chapter-NN.md`，而它的 **mtime 是票 22 那道新鲜度闸门的输入**——「审的是旧稿」
      // 这类事后追问必须能在账本里查到「什么时候、机器把哪一章重拼了一次」。
      // ⚠️ **只有真写了才落账**（`ca.wrote` 或成品被重拼）：内容逐字相同时这一步一个字节都不动，
      // 那时落一条「机器拼了」的账就是假话（同一份分片被主笔来回叫几次就会刷出一串假动作）。
      // ⚠️ **复用 `textbook/hint` 这个碎语通道，不新立事件类型**：与 B69（宿主提问卡作答）、
      // B71／B72（材料的删除／补传）同一条既有惯例——「新增事件类型要同动 EVENT_TYPES /
      // EVENT_META / logEntryText 三处」，而这件事实就是一句留痕。结构化事实一并进 `data`，
      // `timeline.jsonl` 里查得到（`machine` 那一枚同时在 `engine.js` 的 `announceText` 里
      // 让这一条**不播报**：主笔自己叫的一步，不值得在对话里再回一遍）。
      if (ca.wrote === true || bookSync.wrote === true) {
        const bookSuffix = bookSync.wrote
          ? `；成品 工作区/book.md 同一次由机器重拼（原先与拼装件不一致${bookSync.chapters.length > 0 ? `：第 ${bookSync.chapters.join('、')} 章` : ''}）`
          : ''
        appendEvent(project, 'textbook/hint', {
          machine: 'chapter-assemble',
          chapter: caN,
          path: ca.rel,
          shards: ca.shards,
          wrote: ca.wrote === true,
          overwroteExternalWrite: ca.overwroteExternalWrite === true,
          book: { wrote: bookSync.wrote === true, status: bookSync.status, chapters: bookSync.chapters, header: bookSync.header },
          text: (ca.overwroteExternalWrite === true
            ? `🧩 第 ${caN} 章正文由机器从 ${ca.shards} 片分片拼出（${ca.rel}）——盘上原本那一份不是拼装件，已由机器覆盖（机器之外有人在写这份文件）`
            : `🧩 第 ${caN} 章正文由机器从 ${ca.shards} 片分片拼出（${ca.rel}）`) + bookSuffix,
        })
      }
      return accept({ project, chapter: caN, path: ca.rel, shards: ca.shards, wrote: ca.wrote, overwroteExternalWrite: ca.overwroteExternalWrite, bookWrote: bookSync.wrote === true })
    }
    case 'audit-submit': {
      // 写入侧校验（票 01 (b)）：主笔 AI 拿到范例章审计结论后**先交这里**，机器当场用与交工路径
      // **同一份**判据验形状（5 个必读文件各一行 `{file, quote}`、`quote` 逐字、`passed` 判定），
      // 不合格立刻把可行动报错给回去（并入账）——不拖到「这一关交工」那一刻。
      assertSessionOwned(project, sessionId)
      const asMeta = readMeta(project)
      if (asMeta === null) throw new Error(`unknown project ${JSON.stringify(project)}`)
      const asN = goldN(asMeta)
      const asName = goldAuditName(asN)
      const inline = typeof body.auditJson === 'string' && body.auditJson.trim() !== ''
      const asPath = workFile(project, asName)
      const asRaw = inline
        ? body.auditJson
        : (existsSync(asPath) ? readFileSync(asPath, 'utf8') : '')
      if (asRaw.trim() === '') {
        return rejectSubmit('gold', `没拿到范例章审计结论：工作区/${asName} 不在或为空，也没带 auditJson 正文——先让审计小助手把结论落盘（或把 JSON 正文带来）再提交`)
      }
      const asVerdict = checkGoldAudit(project, asN, asRaw)
      if (asVerdict.error !== null) {
        return rejectSubmit('gold', asVerdict.error)
      }
      // 带了正文就由机器落盘：验过的就是落盘的那一份（写入侧的唯一写入者），中间不再经手。
      if (inline) writeWork(project, asName, asRaw)
      return accept({ project, chapter: asN, rows: asVerdict.rows, passed: asVerdict.passed, readings: asVerdict.readings })
    }
    case 'stage-submit': {
      // 主 AI 交工：逐阶段验货，验过才放行（AI 说做了不算，机器验过才算）。
      assertSessionOwned(project, sessionId)
      const subMeta = readMeta(project)
      if (subMeta === null) throw new Error(`unknown project ${JSON.stringify(project)}`)
      if (subMeta.pause !== null && subMeta.pause !== undefined) {
        return reject(409, '已在暂停，请先点继续（▶）再交工')
      }
      const stage = String(body.stage ?? '')
      if (subMeta.pendingStage !== stage) {
        return reject(409, `机器现在等的是「${stageLabel(subMeta.pendingStage, subMeta.pendingGate ?? null) ?? '无'}」，不是「${stage}」`)
      }
      switch (stage) {
        // ── 票 `confirm-points-redesign-build/05`：**站 3 那一趟的交工**（站 2 拍板之后另跑）──────
        // 这一趟的产物是**一份带版本号的正文**：`工作区/目标-vM.md`，由机器在交工这一刻写
        // （与「合并件由机器在交工那一刻写」同一先例：AI 交的是**内容**，落盘是机器的活）。
        // ⚠️ **「3–5 条」是提示、不是硬拦**（spec §3.2 站 3）：材料本身可能只撑得起 2 条
        // ⇒ 这里**不设下限**（下限设了就是把提示写成硬闸）；上限只防「整段散文塞进一格」的形状失控，
        // 它不是内容判据（这几条到底够不够「可检验」，机器一个字都不读——那是只有承诺的那一半）。
        case 'goal': {
          // 票 `flow-audit-2026-10/07`：条目**类型**要校验——`String({text:'…'})` 会把
          // `[object Object]` 写进 `目标-vN.md`（实测真机上出现过）。⛔ 不静默强转。
          const rawGoals = Array.isArray(body.goals) ? body.goals : []
          const nonStringGoal = rawGoals.findIndex((goal) => typeof goal !== 'string')
          if (nonStringGoal !== -1) {
            return rejectSubmit('goal', `goals 第 ${nonStringGoal + 1} 条不是文本（${rawGoals[nonStringGoal] === null ? 'null' : typeof rawGoals[nonStringGoal]}）：这几条目标必须是字符串数组，一条一句话。`)
          }
          const goals = rawGoals.map((goal) => goal.trim()).filter((goal) => goal !== '')
          if (goals.length === 0) {
            return rejectSubmit('goal', '没拿到 goals：这几条目标只能由你产出（字符串数组，一条一句话），交工时带 goals 参数。')
          }
          if (goals.length > GOAL_COUNT_MAX) {
            return rejectSubmit('goal',
              `goals 有 ${goals.length} 条，超了上限 ${GOAL_COUNT_MAX} 条——这几条要一条一句、具体可检验，收敛之后重交。`)
          }
          // 版本号：盘上那一族最大的一版 ＋1（第一次跑 ⇒ v1；「让 AI 重写这几条」之后那一趟 ⇒ 下一版）。
          const goalVersion = nextGoalDocVersion(project)
          writeGoalDoc(project, goalVersion, goals)
          // `meta.goalDocVersion` ＝「界面那张卡该读哪一版」的**指针**（盘上那一族仍是唯一事实）。
          updateMeta(project, (state) => { state.pendingStage = null; state.goalDocVersion = goalVersion })
          // ── 票 `confirm-points-redesign-build/05`：站 3 驳回之后的「让 AI 重写这几条」─────────────
          // 上一次的用户意见随这一趟交办件读（与 `outlineRedoNote` 同一先例）——消费掉就删，
          // 否则下一趟（用户没写意见的那一次）还会看见上一轮那句。
          if (typeof subMeta.goalRedoNote === 'string' && subMeta.goalRedoNote.trim() !== '') {
            updateMeta(project, (state) => { delete state.goalRedoNote })
          }
          // ⚠️ 这一趟的产物名与版本号都**现算**（⛔ 不在 `artifactDataForStage` 里手写
          // `工作区/目标-v1.md`——那一份函数拿不到 projectId，写死版本号就会指着上一版）。
          appendEvent(project, 'textbook/agent-end', { label: '学完能做到什么', outcome: 'ok', path: goalDocRel(goalVersion) })
          appendEvent(project, 'textbook/hint', { text: STATION_GOALS_DONE_HINT })
          void kick(ctx, project)
          return accept({ project, stage: 'goal', version: goalVersion, goals: goals.length })
        }
        case 'explore': {
          // ── 盘上产物那一面**不再是本文件自己的一套检查**（票 `premature-announce/01`）──────
          // 它与「置态」「放行」两处共用 `engine.exploreArtifactProblems`：判据只有一份、报错措辞
          // 也只有一份（下面这条 400 的文案逐字取自那一处，`test-explore-handoff-content.mjs` 锚着它）。
          // 本文件在这里只做**交工那一刻才有答案**的那几件：书级键（含片）、合并件的知识点、材料分量。
          const { problems: artifactProblems, shards, materialRoles } = exploreArtifactProblems(project, subMeta, { atSubmit: true })
          if (artifactProblems.length > 0) return rejectSubmit('explore', artifactProblems[0])
          // 书级键只能由主笔产出（机器不替它编）。teachingFocus 契约是 [string]，AI 偶发写对象
          // 数组——在这里归一化成纯字符串再拼（落盘 / 摘要 / 页面三处看到的都是同一份干净形状，
          // 2026-09 修复 [object Object] 的那条口径照旧）。
          // ⚠️ `teachingFocus` 的**在场检查是新事、不是「照旧」**：旧代码只验 knowledgePoints 与
          // chapterSuggestion，从未验过它（票面 Comments 2026-10-06 第 2 条点名了这处不一致）。
          // ⚠️ 票 `reader-cognition-boundary-build/01` 起，「主笔要交的书级聚合」是**三件**：
          // teachingFocus／chapterSuggestion（逐字搬运族）＋ readerSlices（拼接族）。片**缺席不 400**
          // （老书／没产那一档 ⇒ 退化整书一片，归消费侧现算）；只有**交了的形状**才在这里咬。
          const teachingFocus = normalizeTeachingFocus(body.teachingFocus)
          if (teachingFocus.length === 0) {
            return rejectSubmit('explore',
              '没拿到 teachingFocus：书级的教学重点/难点只能由你产出（纯字符串一条一句，如「重点：分数运算」），交工时带 teachingFocus 参数。')
          }
          const chapterSuggestion = Array.isArray(body.chapterSuggestion) ? body.chapterSuggestion : []
          if (chapterSuggestion.length === 0) {
            return rejectSubmit('explore',
              `没拿到 chapterSuggestion：书级的章节建议只能由你产出（非空数组，${CHAPTER_COUNT_POLICY_TEXT}），交工时带 chapterSuggestion 参数。`)
          }
          // 2026-10-27 维护者裁决（票 `stage3-hard-limits/02`）：「章节：上限不再限制。」
          // 「章数允许只出一章」——上下限都取消，这里**不再判章数**，1 章与 12 章同样放行。
          // ⛔ 不再从 `domain-rules` 取一个区间常量：章数政策只有 `CHAPTER_COUNT_POLICY_TEXT`
          // 那一句（交办、工具说明与本处同源），⛔ 别在这里新造「建议区间」的软读数。
          // ── 票 `knowledge-graph-build/03`：书级 `edges`（主笔若带了）**必须走到拼装器** ──────
          // 票 01 把 `edges` 登记进了书级**拼接族**（分片那份在前、书级那份在后）。这里只做接线：
          // 请求体里有 `edges` 就透传，没有就**不带这个键**（⛔ 不带 `undefined`——票 01 的
          // `bookLevelProblems` 会把拼接族的 `undefined` 当成「非数组」点名，那是把「老书没这键」
          // 误判成坏形状）。族外／非数组的书级键走 `bookLevelProblems` 同一份点名（拼装器遇到它会
          // **当场抛**，所以先在这里收成 400——「两面都走同一份点名」）。
          const bookEdges = Object.hasOwn(body, 'edges') ? body.edges : undefined
          // ── 票 `reader-cognition-boundary-build/01`：第 4 个书级键「片」（`readerSlices`）──────
          // 与 `edges` 同一条接线口径：请求体里**有**这个键才透传（⛔ 不带 `undefined`——拼接族把
          // `undefined` 当「非数组」点名，那会把「老书没这键」误判成坏形状）；形状闸在下面
          // `readerSliceProblems` 那一段（拼装器不负责片级语义）。
          const bookSlices = Object.hasOwn(body, 'readerSlices') ? body.readerSlices : undefined
          const bookLevel = {
            teachingFocus,
            chapterSuggestion,
            ...(bookEdges === undefined ? {} : { edges: bookEdges }),
            ...(bookSlices === undefined ? {} : { readerSlices: bookSlices }),
          }
          // ── 票 `pre-gold-build/01`：`materials[].role` 由**材料判定产物**来 ──────────────────
          // 并进合并件的那张 `num → {role, basis?}` 表就取自上面那一份判据**同一趟读进来的那份文件**
          // （`exploreArtifactProblems` 的回包）——⛔ 不在这里再读一次盘（两次读之间那份文件
          // 允许被改写，两处读数就可能分叉；判据读到哪一份，并进合并件的就是哪一份）。
          // ⛔ `role`／`basis` **不进** `BOOK_LEVEL_KEYS`：它们是并进 `materials[]` 条目的字段，
          // 走 `expectedKnowledgeMap` 的**第三个输入**（`materialRoles`），不是第三个书级键。
          const levelProblems = bookLevelProblems(bookLevel)
          if (levelProblems.length > 0) return rejectSubmit('explore', levelProblems[0])
          let merged = expectedKnowledgeMap(shards, bookLevel, materialRoles)
          // ── 票 `knowledge-graph-build/06`：**对齐结论**落成「一条卡 ＋ N 个位置索引」 ──────────
          // 对齐小助手（探索段内再派的一路）交回来的两样东西分两条路进合并件：
          // · **跨材料的边**走上面的 `body.edges`（票 01 的拼接族，接在各分片边之后）；
          // · **合并结论**走这里的 `body.alignment`（spec §3：书级那一份走**主笔交工参数**，⛔ 不另落一份）。
          // 口径与落地**只住 `src/workflow/knowledge-map-merge.js`**，本文件只做接线：结论站不住就当场
          // 400（**一个字节都不写**——与 teachingFocus 缺那一支同形）；站得住就把 `locations`／`mergedFrom`
          // 与改指过的边并进 `merged`。⇒ 随后的形状闸（⑥⑦ 条）与 `difficulty` 归一化看到的都是**合并之后**
          // 那一份（spec §5 第 1 条那句「合并之后现算查环」就是靠这个顺序成立的）。
          const mergeResult = applyKnowledgeMapMerge(merged, Object.hasOwn(body, 'alignment') ? body.alignment : undefined)
          if (mergeResult.problems.length > 0) return rejectSubmit('explore', mergeResult.problems[0].message)
          merged = mergeResult.merged
          const mergeReadings = mergeResult.readings
          // 合并件缺 knowledgePoints：今天只可能来自**分片**（合并件已不是主笔交的输入）——
          // 有片就必须有知识点，缺了要点名是哪几片。零片（**零源旧书**没有材料；演示书也走这一路，
          // 但它有 1 份转换完成的源、只是没有分片——票 08 ③ 订正过的旧措辞）时不要求：
          // 那时没有分片可拼，凭空要求一份知识点等于要一份不存在的东西（与「不能凭空要片」同一口径）。
          if (shards.length > 0 && merged.knowledgePoints.length === 0) {
            return rejectSubmit('explore',
              `机器按分片拼出来的知识地图没有 knowledgePoints（每份转换完成的材料那一片都要带这一份的知识点）：${shards.map((shard) => knowledgeShardRel(shard.n)).join('、')}`)
          }
          // ── 票 `reader-cognition-boundary-build/01`：「片」的**片级形状闸** ──────────────────
          // 片是「读者情况」问卷外层作答面的唯一来源（spec §3.7）。交来的片数 ≥1 且**片级非空**
          // （有名、有成员）、成员按 title 归一化**能在知识点图上对上**；坏形状 ⇒ 当场 400、**一个字节都不写**。
          // 判据与拼装那一侧共用 `readerSliceProblems`（spec §6.2 F 的「不另写相似的量法」）。
          // ⚠️ 片**缺席不 400**：那是「主笔没产」那一档——退化（整本书一片 ＋ 一句如实说明）由
          // 消费侧现算（`effectiveReaderSlices`），⛔ 不往合并件里编一片；老书也没有这个键（spec §3.9）。
          const sliceProblems = readerSliceProblems(bookSlices, merged.knowledgePoints)
          if (sliceProblems.length > 0) return rejectSubmit('explore', sliceProblems[0])
          // ── 票 17 · pipeline-wiring-gaps · ADR-0023：**材料分量**（standing）逐源表态 ──
          // 「这份材料在什么问题上说了算、在什么问题上不算数」由主笔 AI 逐源写一句声明，落
          // 各分片 materials[].standing（结构化字段是唯一出口——gate/gold 两关读不到 explore.md
          // 散文，交办里散文那份「权威层级」要求已退役）。四条闸门（G1 逐源非空 / G2 单源豁免 /
          // G3 去重不足只记 hint / G4 真题源必须表态有无配套答案与评分标准——机器只验「表态了
          // 没有」不验「带没带」，能力上限写在那份判据的注释里）的判据与反例口径都在
          // `domain-rules.standingGate` 单点，这里只接线：rejects 拒收、hints 账本告知。
          const standing = standingGate(subMeta.sources, merged.materials)
          if (standing.rejects.length > 0) {
            return rejectSubmit('explore', standing.rejects.join('；'))
          }
          // 机器是合并件的**唯一写入者**：它在这一刻才诞生（主笔预先留在盘上的那一份不是输入——
          // 「同一份内容搬两遍」正是本票要收口的那件事）。
          // ── 票 06 · pipeline-wiring-gaps：knowledgePoints[].difficulty **出域值归一化写回** ──
          // 与上面 teachingFocus 归一化同一先例（同文件、同一段交工）：那份契约写了形状所以能归一化，
          // 这份此前没有。取值域与别名表只在 `domain-rules`（登记单点）；机器只动 difficulty 一键，
          // 认不出的没收成「无难度」（合法形状）、其余字段照旧只搬不写。**不阻断**（难度是初判
          // 展示档位，不是内容真伪），但件件告知：回包带 `difficultyEdits` 全量、非空另发一条账本
          // hint（用户在探查确认卡拍板之前看得到）——口径照票 13 的 machineEdits/hint 先例，
          // 不另造第二套「机器改了什么」的呈现。
          // ⚠️ 这一步之后合并件＝分片 ＋ 书级键 ＋ **difficulty 归一化**的确定函数；票 17 那条
          // 「重拼逐字相同」的判据其夹具难度都在域内，归一化不咬它（窄处已在判据夹具注明）。
          const { points: mergedPoints, edits: difficultyEdits } = normalizeKnowledgePointDifficulties(merged.knowledgePoints)
          merged.knowledgePoints = mergedPoints
          // ── 票 `knowledge-graph-build/03`：**合并件成形那一刻的形状闸**（spec §5 第 1–5 条）──
          // 落点是「这一跳写下这份件之前」的最后一道；今天以前这里**零形状校验**（拼出来就无条件落盘）。
          // 口径只有一份（`src/workflow/knowledge-map-gate.js`）：①无环（走票 02 的 `prereqShapeProblems`）
          // ②把握档形状 ③卡的字段形状 ④卡↔知识点 1:1 双射 ⑤`cards[]`／`edges[]` 形状与边端
          // ⑥位置索引与 `mergedFrom` ⑦跨材料的边（⑥⑦ 由票 06 落；它们吃的是**上一步合并之后**那一份）。
          // **过渡口径**：合并件没有图键＝老书那一档，照旧放行（盘上无片老书是大多数，⛔ 不判红）。
          // **失败＝两个图键不落地**：这一跳在 400 之前先把 payload 那份（**不含**图键）写回盘上
          // ——于是盘上不会留着一份「图键指着旧分片」的件；⛔ 闸只挡「图落地」这一件事，不阻断
          // 已写的章。⚠️ 载体已知粗：只回 `problems[0]` ⇒ 多条问题要多轮修（照实记，别把「报了」
          // 读成「报全了」）。
          // ── 票 `graph-write-order/02`：闸、约简、渲染、写全走**同一个入口** ─────────────────
          // 次序的完整理由只住 `knowledge-map-landing.js` 的文件头；这里只留指针——闸吃**声明的那一份**、
          // 约简在闸之后，两条都由那个入口保证（⛔ 别再在这里排一遍）。
          // 失败写法也由它定：交工这一跳闸红 ⇒ `payload-only`（剥掉两个图键、只留 payload 写回盘上）。
          // 删了几条的告知仍走 `reducedPrereqHintText`（唯一措辞出处），⛔ 不在本文件另写一句。
          const landing = landMergedMap({
            kind: 'submit',
            projectId: project,
            merged,
            shards,
            target: { path: workFile(project, MERGED_MAP_NAME) },
            // 交工这一跳之前盘上没有图键（章已写、图还没落）⇒ 闸红只能写 payload，不能撤回章。
            hasGraphKeys: false,
          })
          if (landing.outcome === MERGED_MAP_OUTCOMES.payloadOnly) {
            return rejectSubmit('explore',
              `${landing.problems[0]}——本次没有把图的两个键（cards／edges）落盘（图不落地；合并件已按分片重拼、只留 payload），已写的章不受影响。`)
          }
          if (landing.outcome !== MERGED_MAP_OUTCOMES.landed) {
            throw new Error(`交工那一跳落合并件认不出的结局：${landing.outcome}（只可能是 landed／payload-only）`)
          }
          merged = landing.candidate
          const graphReduction = { removed: landing.removed }
          updateMeta(project, (state) => {
            state.pendingStage = null
            state.pendingGate = null
            state.status = 'awaiting-explore'
            delete state.exploreRedoNote // 重做意见只对本轮探查生效
          })
          appendEvent(project, 'textbook/agent-end', { label: '源探查', outcome: 'ok', ...artifactDataForStage('explore') })
          if (difficultyEdits.length > 0) {
            appendEvent(project, 'textbook/hint', {
              text: `🧭 知识点难度有出域值，机器已按取值域（基础/重点/难点/进阶）归一化并写回 工作区/knowledge-map.json：${difficultyEdits.map((e) => e.detail).join('；')}`,
            })
          }
          // 票 `knowledge-graph-edges-build/06`：删了 ≥1 条冗余直接边 ⇒ 一条账本 hint（措辞出自
          // `knowledge-graph-build` 的**同一处**，与补图那档逐字相同 ⇒ 待核对象里只有一套「机器改了什么」）。
          if (graphReduction.removed.length > 0) {
            appendEvent(project, 'textbook/hint', { text: reducedPrereqHintText(graphReduction.removed) })
          }
          // 票 17 · G3 的放行告知：去重不足不拒交，但用户在探查确认卡拍板之前要看得见
          //（口径照票 13 的 hint 先例，不另造呈现）。
          if (standing.hints.length > 0) {
            appendEvent(project, 'textbook/hint', {
              text: `⚖️ 材料分量提醒：${standing.hints.join('；')}`,
            })
          }
          appendEvent(project, 'textbook/hint', {
            text: EXPLORE_DONE_HINT,
          })
          return accept({ project, stage: 'explore', difficultyEdits, graphEdits: graphReduction.removed, standingHints: standing.hints, merge: mergeReadings })
        }
        case 'gate': {
          const gate = subMeta.pendingGate ?? '1'
          const title = typeof body.title === 'string' ? body.title.trim() : ''
          const summary = typeof body.summary === 'string' ? body.summary.trim() : ''
          let detail = typeof body.detail === 'string' ? body.detail.trim() : ''
          if (title === '' || summary === '' || detail === '') {
            return rejectSubmit('gate', '方案不完整（需要 title 标题 / summary 人话摘要 / detail 完整方案）')
          }
          // 票 `walkthrough-2026-10/06` 现象一（2026-10-03 清单 A3）：**非空还不够**——
          // 那一次三个字段都非空，内容却是「测试标题／测试摘要。／测试正文是否可提交（稍后重发完整版）」，
          // 一张要用户拍板的正式卡上摆了占位件。所以这里再咬一口**内容真实性**：
          // 正式拍板卡的入参来自真实方案，命中测试/占位词表就打回。
          //
          // ⚠️ 判的是 **AI 交上来的那三段原文**（排在指针内联**之前**）：内联进来的文件正文是机器读的，
          // 而「AI 自己写了什么」才是这条纪律的对象；顺序反了会让「交一句指针、正文里全是占位」
          // 逃过闸门（内联发生在下面）。
          // ⚠️ 打回要**可行动**（票面 `:22`）：逐条点名「哪个词、在哪个字段」，只说「方案不合法」
          // 等于让 AI 去猜。词表只此一份（`domain-rules.PLACEHOLDER_WORDING`），这里一个字都不手抄。
          const placeholderHits = placeholderWordingHits({ title, summary, detail })
          if (placeholderHits.length > 0) {
            const named = placeholderHits.map((h) => `${h.field}命中「${h.word}」`).join('、')
            return rejectSubmit('gate',
              `方案里有测试/占位文本（${named}）——正式拍板卡的入参来自真实方案，不许出现测试/占位字样。把这几处写成真内容再交。`)
          }
          // 指针内联：AI 偶尔会把完整方案写进自选文件、detail 只留一句「见文件」。
          // 用户不该去文件夹翻文件——机器检测到指针样 detail 就把被指文件正文内联进来。
          const pointer = /(?:见|详见)[^。\n]{0,20}?((?:工作区\/)?proposal-[\w.-]+\.md)/.exec(detail)
          if (pointer !== null) {
            const rel = pointer[1].startsWith('工作区/') ? pointer[1] : `工作区/${pointer[1]}`
            const full = workFile(project, rel.replace(/^工作区\//, ''))
            if (existsSync(full)) {
              const fileText = readFileSync(full, 'utf8').trim()
              if (fileText !== '') detail = `${fileText}\n\n---\n（原摘要：${summary}）`
            }
          }
          const version = countProposals(project, gate) + 1
          // 票 `confirm-points-redesign-build/07`：交工载荷可以多带一格**可选**的结构化值
          // （第 3 关的 `{chapters: N}`）——它随提案进账本，拍板那一刻写进 `决策/06.json` 的 `values`，
          // 章数政策与站 7 的章数对账读数读的都是它（**一处真相**；2026-10-27 起对账只留读数、不拒收）。
          // ⚠️ 形状只收**对象**（标量／数组一律当没带：这一格的口径是「机器可读的标量／小数组」装在
          // 对象里，见 04 §1 的 `values` 行）；⛔ 没有值时不写这个键（不填 `null` 占位）。
          const gateValues = (body.values !== undefined && body.values !== null
            && typeof body.values === 'object' && !Array.isArray(body.values)) ? body.values : undefined
          updateMeta(project, (state) => {
            state.pendingStage = null
            state.pendingGate = null
          })
          appendEvent(project, 'textbook/agent-end', {
            label: `设计提案·第${gate}关${version > 1 ? `·修订v${version}` : ''}`, outcome: 'ok',
            ...artifactDataForGate(gate, version),
          })
          if (version === 1) proposeGate(project, gate, title, summary, detail, gateValues)
          else proposeRevision(project, gate, version, title, summary, detail, gateValues)
          return accept({ project, stage: 'gate', gate, version })
        }
        case 'outline': {
          let chapters = Array.isArray(body.chapters) ? body.chapters : null
          if (chapters === null && typeof body.chaptersJson === 'string' && body.chaptersJson.trim() !== '') {
            try { chapters = JSON.parse(body.chaptersJson) } catch { chapters = null }
          }
          if (chapters === null || !Array.isArray(chapters) || chapters.length === 0) {
            return rejectSubmit('outline', '章节骨架不能为空（需要 chapters 数组或 chaptersJson JSON 字符串）')
          }
          // ── 章数政策（2026-10-27 维护者裁决，票 `stage3-hard-limits/02`）──────────────────────
          // 「章节：上限不再限制。」「章数允许只出一章，这是我做知识点图的目的之一。」
          // ⇒ **上下限都不判**：交 1 章合法，交 12 章也合法；这里**没有**区间闸，也⛔ 不新造
          //   「建议章数区间」的软读数去顶替硬闸（那就等于把闸换个名字留着）。
          // 站 6 拍板的章数若已落盘（`工作区/决策/06.json` 的 `values.chapters`），只做**非阻断
          // 对账读数**：实际章数 ≠ 拍板章数时记一条 hint（`kind: 'chapter-count-reading'`），
          // **不拒收**、不改骨架。⚠️ 值不在（件不在／没写／写坏）⇒ `readDecisionChapterCount`
          // 回 `null`，**不判也不误报**（⛔ 不许取一个默认章数当作用户拍过——「不许静默回落默认值」
          // 那条先例照旧；这就是它被本票改挂到的**章数**）。
          // ⚠️ **枚举面比现实窄在哪里**（本仓纪律，`AGENTS.md` 票 `dev-gate-scan/17`）：判据数的是
          //   **交上来的 `chapters` 条数**。它不判「这个章数对不对得起这份材料」（AI 交 4 章却在
          //   `volumeReason` 里写「这本书只需要 2 章」照样放行），也不判用户对主笔的自然语言篇幅要求
          //   （那条根本不进机器）。它只保证**与站 6 拍板的章数对账时留一条读数**。
          const chapterCount = chapters.length
          const decidedChapters = readDecisionChapterCount(project)
          // ── 票 `pipeline-wiring-gaps/13`：outline 交工的机器改写不再静默 ──
          // 证据（verification.md 第 7 条）：下面每个字段的归一化原先都是「机器放行、用户无感」——
          // 字数不足静默补 6000、points 超上限/强转/空白项静默丢弃、goldChapter 越界静默回落并清空理由。
          // 口径按票 `01`（points 口径裁决，2026-09-29 用户拍板）：**缺失放行、失配「放行并记一条
          // 人话提示」、不阻断**——所以这里照旧归一化（入账值与旧口径逐字一致），但每一处改动都记进
          // `machineEdits`：交工回包带全量（提交结果能看出这一章被机器改过什么），非空时另发一条
          // 账本 hint（用户在确认骨架之前看得到）。
          // ⚠️ **不算改写、不记录**的两种：①字段**缺失**落空缺省（票 01 裁决「缺失放行」，`points`
          // 的 `?? []` 更是 2026-08-19 契约里有意写的）；②归一化后与原值严格相等（没改东西就不是改写）。
          const machineEdits = []
          // 票 `chapter-skeleton/02`：成功交工那一刻算的「交上来的 outline 与图序」读数；
          // 没有图（老书／图缺失）时保持 null ⇒ 整条读数不落账（与交办那一侧「整段不加」同一口径）。
          let submittedOrderFields = null
          const cleaned = []
          // 票 `kn-unowned-silent/02`：两本账——①`capProblems` 是**拒收**面（哪几章越界、被拒的是哪几条），
          // ②`waivedDrops` 是**逐点豁免**面（哪几条按人的点名放弃）。两者都只在**越界**时才可能非空。
          const capProblems = []
          const waivedDrops = []
          for (let i = 0; i < chapters.length; i += 1) {
            const chapter = chapters[i]
            const title = String(chapter?.title ?? '').trim()
            if (title === '') { return rejectSubmit('outline', '章节缺少 title') }
            const chapterNo = i + 1
            // ① targetWords（票 13）：不是 ≥500 的数字时补 6000——照样补，但告知补成了什么。
            const rawWords = chapter?.targetWords
            const wordsNum = Number(rawWords)
            let targetWords
            if (Number.isFinite(wordsNum) && wordsNum >= 500) {
              targetWords = Math.round(wordsNum)
              if (targetWords !== rawWords) {
                machineEdits.push({ chapter: chapterNo, field: 'targetWords', detail: `目标字数 ${describeRawValue(rawWords)} 被按 ${targetWords} 收下` })
              }
            } else {
              targetWords = 6000
              machineEdits.push({ chapter: chapterNo, field: 'targetWords', detail: `目标字数 ${describeRawValue(rawWords)} 不是不小于 500 的数字，机器按 6000 收下` })
            }
            // ② points（票 13②④；超上限的处置按票 01 裁决）：非数组落 `[]`（缺失放行；**交了但
            //    形状不对**要告知）、非字符串强转、空白项丢弃、超上限截断——件件告知。
            const rawPoints = chapter?.points
            let points
            if (!Array.isArray(rawPoints)) {
              points = []
              if (rawPoints !== undefined && rawPoints !== null) {
                machineEdits.push({ chapter: chapterNo, field: 'points', detail: `points ${describeRawValue(rawPoints)} 不是数组，机器按「无知识点」收下` })
              }
            } else {
              const nonStringCount = rawPoints.filter((pt) => pt !== null && pt !== undefined && typeof pt !== 'string').length
              let pts = rawPoints.map((pt) => String(pt ?? '').trim())
              const blankCount = pts.filter((pt) => pt === '').length
              pts = pts.filter((pt) => pt !== '')
              if (nonStringCount > 0) {
                machineEdits.push({ chapter: chapterNo, field: 'points', detail: `有 ${nonStringCount} 条知识点不是文本，机器已按文本收下` })
              }
              if (blankCount > 0) {
                machineEdits.push({ chapter: chapterNo, field: 'points', detail: `有 ${blankCount} 条知识点是空白，机器已丢弃` })
              }
              // ── 票 `kn-unowned-silent/02`（维护者 2026-10-27「按推荐」）：越界**不再静默截断** ──────
              // 裁决原文：「上限 20 保留（它是上限不是预算），但**越界不许静默丢**；豁免必须结构化到点。」
              // 旧形状是 `pts.slice(0, 20)` ＋ 一条 machineEdit——用户看不见被吃掉的是哪几条，书里就少了
              // 那几条的内容，而界面照旧显示「齐全」。今天改成两件事：
              //   ① 越界 ⇒ **交工 400**，文案逐条点名被拒的点（名字，不是「共 N 条」）；
              //   ② 唯一能「少收几条」的出口是**逐点豁免**：`meta.waivers[]` 里那条记录用
              //      `waivedPoints[]` 点名放弃了几条，机器才从那几条里减——⛔ 书级一刀切（只写散文）
              //      一条都减不了。被放弃的点**照样点名**落一条账本 hint（不静默，与票 01 同一口径）。
              // ⚠️ 只在**越界时**才用豁免减：没越界的章一条都不减——豁免是「超限时放弃哪几条」的出口，
              //   不是「顺手把已认领的点删掉」的后门（那会让一条旧记录悄悄改掉本章要写的内容）。
              // 先按逐点豁免**减**（不管有没有越界），再判上限。为什么先减：
              // 豁免的语义是「这几条这条路不写」，那它就不该留在 `points` 里——留着的后果是**三面各说一套**
              // （面板印「豁免放弃 1」、交办清单照旧把它派给执笔、正文闸门又不要求写它）。
              // ⚠️ 这一格只对**点名到本章**的记录生效（`splitWaivedPoints` 的章匹配），所以一条别章的
              //    旧记录不会悄悄改掉本章要写的内容。
              const submittedCount = pts.length
              const split = splitWaivedPoints(project, '知识点覆盖齐全', pts, chapterNo)
              if (split.waived.length > 0) {
                pts = split.kept
                waivedDrops.push({ chapter: chapterNo, title, dropped: split.waived })
              }
              if (pts.length > OUTLINE_POINTS_MAX) {
                capProblems.push({
                  chapter: chapterNo,
                  title,
                  total: submittedCount,
                  rejected: pts.slice(OUTLINE_POINTS_MAX),
                  waivedCount: split.waived.length,
                })
              }
              points = pts
            }
            // ③ outline / source 的 String() 强转（票 01 点名的第 5-8 处）：缺省落 `''` 按「缺失放行」
            //    不告知；交了非文本被强转要告知。
            const rawOutline = chapter?.outline
            if (rawOutline !== undefined && rawOutline !== null && typeof rawOutline !== 'string') {
              machineEdits.push({ chapter: chapterNo, field: 'outline', detail: `outline ${describeRawValue(rawOutline)} 不是文本，机器已按文本收下` })
            }
            const rawSource = chapter?.source
            if (rawSource !== undefined && rawSource !== null && typeof rawSource !== 'string') {
              machineEdits.push({ chapter: chapterNo, field: 'source', detail: `source ${describeRawValue(rawSource)} 不是文本，机器已按文本收下` })
            }
            // ④ volumeReason 的 slice(0, 200)（票 01 点名的第 5-8 处）：截断要告知，且只记真的发生了截断。
            const rawVolumeReason = chapter?.volumeReason
            const volumeReason = textCoerced(rawVolumeReason, CHAPTER_SIDE_REASON_MAX)
            if (typeof rawVolumeReason === 'string' && rawVolumeReason.length > CHAPTER_SIDE_REASON_MAX) {
              machineEdits.push({ chapter: chapterNo, field: 'volumeReason', detail: `体量依据 ${rawVolumeReason.length} 字超过 ${CHAPTER_SIDE_REASON_MAX} 字上限，机器截到 ${CHAPTER_SIDE_REASON_MAX} 字` })
            } else if (rawVolumeReason !== undefined && rawVolumeReason !== null && typeof rawVolumeReason !== 'string') {
              machineEdits.push({ chapter: chapterNo, field: 'volumeReason', detail: `体量依据 ${describeRawValue(rawVolumeReason)} 不是文本，机器已按文本收下` })
            }
            cleaned.push({
              title,
              outline: String(rawOutline ?? ''),
              source: String(rawSource ?? ''),
              targetWords,
              points,
              volumeReason,
            })
          }
          // ── 票 `kn-unowned-silent/02`：单章点数越界 ⇒ **交工 400**，逐条点名被拒的点 ─────────────
          // 旧形状是 `slice(0, 20)` 静默截断（只留一条 machineEdit）：真书第 6／9 章各交 23／22 条，
          // 盘上落成 20／20，那 5 条知识点**不带任何章节归属**，而界面照旧显示 143 齐全。
          // 裁决（维护者 2026-10-27「按推荐」）：「上限 20 保留，但越界不许静默丢。」
          // ⇒ 今天：要么 AI 自己把点数收进 20 条内，要么经用户同意后用 `waive` 的 `waivedPoints[]`
          //   **逐条点名放弃**（那是唯一能少收的出口，见上面 points 那一格）。⛔ 不再有第三条路。
          // 文案要点（票面判据「人眼可读」）：哪一章、交了几条、上限几条、**被拒的是哪几条的名字**，
          // 以及下一步能做什么（两条出路都写出来——AI 拿到 400 要能自己往下走）。
          if (capProblems.length > 0) {
            const lines = capProblems.map((problem) => {
              const waivedNote = problem.waivedCount > 0
                ? `已按豁免放弃 ${problem.waivedCount} 条，剩下的还超`
                : `这 ${problem.total} 条里没有一条被豁免点名放弃`
              return `第${problem.chapter}章「${problem.title}」交了 ${problem.total} 条知识点（${waivedNote}）：`
                + `超过单章上限 ${OUTLINE_POINTS_MAX}，被拒的是这 ${problem.rejected.length} 条——`
                + `「${problem.rejected.join('」「')}」`
            })
            return rejectSubmit('outline',
              `单章知识点超过上限（每章最多 ${OUTLINE_POINTS_MAX} 条，这是**上限不是预算**）：`
              + `${lines.join('；')}。`
              + '两条出路：①把这几条写进别的章的 points（它们就都有人认领了）；'
              + `②确要这本不写其中某几条，经用户明确同意后让 AI 调 waive（item=other、scope.check=「知识点覆盖齐全」、`
              + `waivedPoints 逐条点名那几条的 title）再交工——豁免**只放行点名的点**，没点名的一条都少不了。`
              + '⛔ 机器不再替你静默丢弃（旧行为：超出的部分直接不进本章，用户与读者都无从知道）。')
          }
          // ── 票 `pipeline-wiring-gaps/12` · 知识点覆盖闸门 ──
          // 证据（verification.md 第 8、11 条）：知识地图的 knowledgePoints 与骨架 points 之间
          // 没有任何机器约束，「每个知识点都要有章节认领」全靠 AI 自查或用户人眼，14 项质量门
          // 无一项触碰这两个字段。现在两头都查：知识地图里每条知识点都要在某一章的 points 里
          // 找到归属；points 里出现知识地图没有的条目同样拒——各自点名。
          // 口径按票 `01`（2026-09-29 用户拍板）：**title 单键**、比对前**先规范化**
          // （去尾部括注/trim/全半角——真书 54 条里唯一的失配就是尾部括注）、id 不进比对环；
          // 口径单点在 `domain-rules.outlinePointsCoverage`（交办/闸门/界面三面同一份）。
          // 豁免出口与 chapters 交工的 scaffold-keep/other 那两格同口径：**`other`**（用户手输原因、
          // AI 调 waive）——豁免时**不放静默行**：漏了哪些照样发一条账本 hint 点名（票 01 裁决的
          // 「人话提示」那一半，用户马上要在 awaiting-outline 拍板，看得到）。
          // ⚠️ **枚举面比现实窄在哪里**：无源书的知识点清单本就是空的（关卡③交办明写骨架那一列
          // 改写「锚定的源任务或概念」），书没有转换完成的源时这门闸**没有可比对的面**，不判——
          // 凭空要求一份不存在的东西与 explore 分片那格「零片不要求」同一口径。有转换完成的源
          // 却读不出知识地图是流水线破坏（探查交工时机器必落盘这一份），当场拒并点名，不当静默放行。
          //
          // ── 票 `knowledge-graph-build/09`：喂给这道闸门的集合 ＝「知识点 − **被剔除的**」 ──
          // ADR-0039 决策 1／2：闸门的规则、实现与豁免**一个字都不改**（下一行 `outlinePointsCoverage`
          // 照旧只比 title 单键），变的是**喂进去的那一份集合**——它来自人那份裁决产物，是人的产物。
          // ⚠️ **形状坏了是硬闸、陈旧是软读数**（spec §9 两档）：那份件读不出／不合形状 ⇒ 当场拒
          //    （⛔ 不静默当成「没有裁决」——那等于把人写的东西悄悄忽略掉）；而「键没了／title 变了」
          //    由读侧现算成 `stale`，**不进闸门**（那些条目本就不再生效，报数是界面的事）。
          // ⚠️ 副作用一处，如实记：一条被剔除的知识点若仍被写进某章 `points`，它现在**不在**喂进去的
          //    集合里 ⇒ 会走 `foreign` 那一支（「不在知识地图里」）。这是「离开判据面」的必然结果，
          //    ⛔ 不为它改闸门文案；交办正文（`engine.js` 的 outline 支）已明说「划掉的不许写进 points」。
          const outlineMeta = readMeta(project)
          if (okMaterialNumbers(outlineMeta?.sources).length > 0) {
            // 与 §9 上面那道「图上划一笔」问**同一个读侧出口** `readMergedMap`：合并件读成什么，
            // 全仓只有那一个答案（缺件／坏 JSON／数组／数字 ⇒ `map === null`）。⛔ 下面这三个条件
            // 是**覆盖闸的判据**（不只是「读没读出来」，还要求非空 `knowledgePoints`），一个字不改。
            const knowledgeMap = readMergedMap(project).map
            if (knowledgeMap === null || !Array.isArray(knowledgeMap.knowledgePoints) || knowledgeMap.knowledgePoints.length === 0) {
              return rejectSubmit('outline',
                '读不出 工作区/knowledge-map.json（文件不在、不是 JSON 或没有 knowledgePoints）：本书有转换完成的源，知识地图是知识点覆盖判定的对照面（探查交工时机器落盘这一份）。先补探查交工；确要跳过，经用户同意后豁免「其他」再交工。')
            }
            const collection = readCoverageCollection(project, knowledgeMap)
            if (collection.present && collection.problems.length > 0) {
              return rejectSubmit('outline',
                `这本书上那份人写的裁决记录（${KNOWLEDGE_MAP_EXCLUSIONS_REL}）读不出：${collection.problems.slice(0, 3).join('；')}。它是「图上划掉的那些卡」的归属处，读不出就没法知道该把哪几条从「必须覆盖」里拿出去——所以这里当场拦下。那份件是人写的：改好它的形状、或删掉它（删掉＝这一本书上没有任何裁决），再交工。`)
            }
            const coverage = outlinePointsCoverage(collection.effective, cleaned)
            // ── 票 `kn-unowned-silent/02`：未认领的点先过**逐点豁免**这一关 ────────────────────────
            // 旧形状：`otherWaiverFor(project, '知识点覆盖齐全')` 为真就**整句放行**——于是书级那条
            // 记录（`scope.chapter: null` ＋ 散文里写 5 个点）一票放行全部未认领点，覆盖闸门带着
            // 豁免报绿，而「哪 5 条被放弃」机器一件都不知道（真书 143 承诺 / 138 实写就是这么来的）。
            // 今天：**只有 `waivedPoints[]` 里逐条点名的点**才放行；没点名的照旧 400 并点名。
            // ⛔ 书级一刀切没有第二份实现——`waivedPointSet` 只读点名清单，散文（`userNote`）只作放行必要条件。
            const unclaimedSplit = splitWaivedPoints(project, '知识点覆盖齐全', coverage.unclaimed)
            const coverageMisses = [
              ...unclaimedSplit.kept.map((t) => `知识点「${t}」还没有任何一章认领`),
              ...coverage.foreign.map((f) => `第${f.chapter}章 points 里的「${f.title}」不在知识地图里`),
            ]
            if (coverageMisses.length > 0) {
              const named = coverageMisses.slice(0, 5).join('；')
              const more = coverageMisses.length > 5 ? `……共 ${coverageMisses.length} 处` : ''
              return rejectSubmit('outline',
                `知识点覆盖不完整：${named}${more}。知识地图里每条知识点都要在某一章的 points 里找到归属，points 也不能写知识地图没有的条目（title 口径，比对前机器先规范化：去尾部括注/trim/全半角）。把漏的认领进章节、或删掉地图外的条目再交工；确要这本不写其中某几条，经用户明确同意后让 AI 调 waive（item=other、scope.check=「知识点覆盖齐全」、waivedPoints 逐条点名那几条的 title）再交工——豁免**只放行点名的点**。`)
            }
            if (unclaimedSplit.waived.length > 0) {
              appendEvent(project, 'textbook/hint', {
                kind: 'coverage-waived-points',
                text: `⚠️ 按你的逐点豁免放行「知识点覆盖齐全」：这 ${unclaimedSplit.waived.length} 条知识点没有章节认领，`
                  + `是你点名放弃的——「${unclaimedSplit.waived.join('」「')}」。它们不会出现在任何一章正文里，`
                  + '后续派章时记得交代去向（要讲它们就收回豁免）。',
              })
            }
            // ⚠️ `otherWaiverFor(project, '知识点覆盖齐全')` 这个读取点在本跳**已删**：书级一刀切
            // 放行是本票要收掉的那一半。单章那两个覆盖读取点（缺覆盖 / 写进已划掉的点）走同一份
            // 逐点判据（见下面 `case 'chapters'`），⛔ 各写一份 `filter` 就是第二份「怎么算被点名」。
            // ── 票 `chapter-skeleton/02`：交上来的 outline 与图序的**非阻断读数** ──────────────
            // 只在「有图 ＋ 覆盖闸已放行」之后算：被别的判据打回的这次交工没资格留读数。
            // ⛔ 不拒收、⛔ 不改骨架：`cleaned` 已经定稿，这里只读它。
            const ordered = knowledgeOrderFromCoverage(collection, cleaned)
            // 空卡表不冒充「对过账」：没有图序时那条 0 处读数是空转。
            if (ordered !== null && ordered.status !== 'empty') {
              submittedOrderFields = orderReadingFieldsOf(ordered.readings)
            }
          }
          // ⑤ goldChapter（票 13）：越界/非法静默回落 1 并清空理由——回落与「理由没收」都告知；
          //    理由超长被截（票 01 点名的第 5-8 处）只在理由真的被用上时记「截断」（被丢弃时记在⑤里）。
          const rawGold = body.goldChapter
          const goldNum = Number(rawGold)
          const goldReason = textCoerced(body.goldChapterReason, CHAPTER_SIDE_REASON_MAX)
          const goldValid = Number.isSafeInteger(goldNum) && goldNum >= 1 && goldNum <= cleaned.length
          if (!goldValid) {
            const why = rawGold === undefined || rawGold === null
              ? '没交建议范例章'
              : `建议范例章 ${describeRawValue(rawGold)} 越界（共 ${cleaned.length} 章）`
            const reasonGiven = body.goldChapterReason !== undefined && body.goldChapterReason !== null
              && String(body.goldChapterReason).trim() !== ''
            machineEdits.push({
              chapter: null,
              field: 'goldChapter',
              detail: `${why}，机器回落第 1 章${reasonGiven ? '；交来的理由没有收' : ''}`,
            })
          } else if (typeof body.goldChapterReason === 'string' && body.goldChapterReason.length > CHAPTER_SIDE_REASON_MAX) {
            machineEdits.push({ chapter: null, field: 'goldChapterReason', detail: `范例章理由 ${body.goldChapterReason.length} 字超过 ${CHAPTER_SIDE_REASON_MAX} 字上限，机器截到 ${CHAPTER_SIDE_REASON_MAX} 字` })
          }
          updateMeta(project, (state) => {
            if (goldValid) {
              state.goldChapter = goldNum
              state.goldChapterReason = goldReason
            } else {
              state.goldChapter = 1
              state.goldChapterReason = ''
            }
            state.outline = { chapters: cleaned }
            // 票 `kn-unowned-silent/02`：**这次交工真放弃了哪几条**（按章记），供面板读「豁免放弃 M」。
            // 为什么要有这一格：豁免记录是「人点了名」的**授权**，但它未必带章号（书级记录 + 只给 title
            // 时机器根本推不出这个点归哪一章）；而「本章的 points 里少了哪几条」这件事，只有**交工那一刻**
            // 机器才知道——所以把**结果**记下来，而不是让面板去猜授权里的章号。
            // 每次 outline 交工按本次重算（不是累加）：旧一轮放弃、这一轮没放弃的点不该留在屏上。
            state.waivedPointDrops = waivedDrops.map((drop) => ({ chapter: drop.chapter, points: drop.dropped }))
            state.pendingStage = null
            state.pendingGate = null
          })
          // ⚠️ 这个文件**内容是 JSON**（票 pipeline-wiring-gaps/09）：所以
          // `domain-rules.productOpenMode` 判它 `'inline'`、不开右栏预览——与 `工作区/audit-NN.md`
          // 同一条理由。人读形态：章节安排确认卡（拍板前就在屏上）与阶段页第 3 阶段的就地折叠
          // 清单（`chapters-map.foldOutline`）。演示模式（`engine.js` 那一行）落同一份 JSON，口径相同。
          writeWork(project, 'outline.md', JSON.stringify({ chapters: cleaned }, null, 2))
          appendEvent(project, 'textbook/agent-end', { label: '整理章节骨架', outcome: 'ok', ...artifactDataForStage('outline') })
          // ── 票 `chapter-skeleton/02`：图序与交上来的 outline 的**非阻断读数** ──────────────────
          // 体例照 `chapter-count-reading`：只记一条、只报数、⛔ 不拒收、⛔ 不进任何 400、⛔ 不改覆盖闸。
          // 一致时也记一条「0 处」（防空跑：不能只有不一致才记账）；每次成功交工各一条（数相同也不吞）。
          if (submittedOrderFields !== null) {
            // 每次**成功交工**各记一条（含 0 处）：⛔ 不因为「上一次也是这个数」就不记——
            // 用户可能换了一版顺序而带出的四个数恰好相同，那一次也该留下读数。
            appendEvent(project, 'textbook/hint', {
              kind: 'outline-order-reading',
              ...submittedOrderFields,
              text: `📊 章节安排与图序对账（非阻断）：交上来的 outline 与按图排出的先后有 `
                + `${submittedOrderFields.outlineVsGraph} 处不一致——端点没被任何章认领的**前置边** `
                + `${submittedOrderFields.unresolvedPrereq === null ? '—' : submittedOrderFields.unresolvedPrereq} 条、`
                + `端点不在卡表的前置边 ${submittedOrderFields.danglingPrereq} 条、`
                + `没有前置入边的卡 ${submittedOrderFields.noInEdge} 张、`
                + `完全孤立的卡 ${submittedOrderFields.isolated} 张。已按你交的 outline 继续，不拒收、不改骨架。`,
            })
          }
          // 票 13：机器改写了交上来的骨架就发一条账本 hint——用户马上要在 awaiting-outline 拍板，
          // 提示就落在这之前（豁免 outline-skip 时用户不过目，但交工回包里照样带全量 machineEdits）。
          if (machineEdits.length > 0) {
            appendEvent(project, 'textbook/hint', {
              text: `机器改写了交上来的骨架，请过目再确认：${machineEdits.map(renderMachineEdit).join('；')}`,
            })
          }
          // 票 `kn-unowned-silent/02`：**被豁免放弃的点不静默**——哪一章放弃了哪几条，逐条点名落账。
          // 它与上面那条「机器改写了」分开：豁免不是机器改写（人点的名），所以不进 `machineEdits`；
          // 但它必须**看得见**：用户下一屏就在拍板，读者最终读到的书里也不会有这几条。
          for (const drop of waivedDrops) {
            appendEvent(project, 'textbook/hint', {
              kind: 'points-waived-drop',
              chapter: drop.chapter,
              dropped: drop.dropped,
              text: `⚠️ 第${drop.chapter}章「${drop.title}」按你的逐点豁免放弃了 ${drop.dropped.length} 条知识点`
                + `（它们不会出现在这一章正文里）：「${drop.dropped.join('」「')}」。`
                + `每章最多 ${OUTLINE_POINTS_MAX} 条，这是上限不是预算；要讲它们就收回豁免（waive-revoke）。`,
            })
          }
          // 票 `stage3-hard-limits/02`：拍板章数只做**非阻断对账读数**——实际章数对不上就记一条，
          // 交付照常。⛔ 不拒收、不改骨架、也不把这条读数混进 `machineEdits`（那不是机器改写）。
          // 放在所有拒收分支之后：被别的判据打回的这次交工没资格留下「对账过了」的读数。
          // ⚠️ 同一本书、同一对 (decided, actual) 只留第一条：驳回→重交看到的是同一件事，
          // 重刷同一条读数只会把账本灌成噪音（「只记一条读数」照字面办）。
          if (decidedChapters !== null && chapterCount !== decidedChapters) {
            const alreadyRead = readEvents(project).some((event) => event.type === 'textbook/hint'
              && event.data?.kind === 'chapter-count-reading'
              && event.data?.decidedChapters === decidedChapters
              && event.data?.actualChapters === chapterCount)
            if (!alreadyRead) {
              appendEvent(project, 'textbook/hint', {
                kind: 'chapter-count-reading',
                decidedChapters,
                actualChapters: chapterCount,
                text: `📊 章数对账（非阻断）：第 3 关拍板 ${decidedChapters} 章，章节骨架交了 ${chapterCount} 章`
                  + `（那一格写在工作区/决策/06.json 的 values.chapters）——已按交上来的章数继续，不拒收。`,
              })
            }
          }
          if (waived(project, 'outline-skip')) {
            advance(project, 3, 4)
            void kick(ctx, project)
          } else {
            updateMeta(project, (state) => { state.status = 'awaiting-outline' })
            appendEvent(project, 'textbook/hint', {
              text: '📐 章节安排出来了，请在工作台查看：满意点「✅ 通过」，不满意点「🔁 提改进方向」让 AI 修订。',
            })
          }
          return accept({ project, stage: 'outline', chapters: cleaned.length, machineEdits })
        }
        case 'gold': {
          const gN = goldN(subMeta)
          const auditName = goldAuditName(gN)
          // 票 `walkthrough-2026-10/02`：范例章正文与普通章同口径——**由机器从分片拼**，机器是唯一写者。
          // 交工这一格验的是「盘上那份正文就是那几片分片的拼装件」；机器还没拼过（文件不在）时它补拼。
          // ⚠️ demo 书不受这一格约束：演示通道**不派真小助手**，那一章的正文本来就由机器写
          // （`demoWriteChapters` / `runPhase4` 的演示支），「同一文件多写者」在那里结构上不存在。
          if (subMeta.demo !== true) {
            const assembled = verifyChapterAtSubmit(project, gN)
            if (assembled.status !== 'ok') {
              return rejectSubmit('gold', chapterAssemblyReject(assembled, gN))
            }
          }
          // ⚠️ 这三个名字**都是基名**（`workFile` 自己拼 `工作区/`，喂相对路径会变成 `工作区/工作区/…`），
          // 而且它们还要原样进 `missing.join('、')` 那句人话——同一条消息里三个词得是同一族。
          const missing = [chapterName(gN), 'style-spec.md', auditName].filter((name) => {
            const target = workFile(project, name)
            return !existsSync(target) || readFileSync(target, 'utf8').trim() === ''
          })
          if (missing.length > 0) {
            return rejectSubmit('gold', `范例章文件缺失或为空：${missing.join('、')}`)
          }
          // style-spec 节标题软验：写作规范十九项契约要求节标题齐全，缺了就拦下让 AI 补全。
          // ⚠️ 票 20 已知失效路径：这是**软验**（查节标题在不在），**不查列表内容合不合理**——
          // AI 写一个 30 字的长标题照样过。所以「宽声明 → 误报 → 用户 waive 一次 → 硬编码地板被永久关掉」
          // 这条路径没有被机器堵死，处置写在票 20 的 `## Comments`（人工边界）。
          // ⚠️ 票 `demo-channel-full/19`：这一格**不再有 demo 守卫**——演示书的 `style-spec.md` 从票 19 起
          // 由演示支按同一套形制产出（五节标题在场、逐节有正文），所以「演示书那份额外放行」的理由不成立了；
          // 判定与那份节标题表**都搬进了 `domain-rules`**（`styleSpecMissingSections`），
          // 真书这一跳与演示支写盘之后（`engine.js` 的 `runPhase4`）**共用同一份**。
          // ⚠️ 那五个词的来历（搬走了、别丢）：第四项「脚手架标题列表」由票 20 加（否则「AI 被要求写」
          // 与「机器查它写了」之间还是同一根断线）；第五项「多源同级声明」由票 26 加，同票把契约第 17 项
          // 改成**无条件节**（单源书也要写「本书无并行权威源，不存在同级冲突」）——两步必须同时落，
          // 只加表不改契约就是把一条合规行为判成违规。词形对账（契约源文 ↔ 那份表）在
          // `test-scaffold-declaration.mjs`，⛔ 不在这里或那里硬编码第二份词表。
          const spec = readFileSync(workFile(project, 'style-spec.md'), 'utf8')
          const missingSections = styleSpecMissingSections(spec)
          if (missingSections.length > 0) {
            return rejectSubmit('gold', `style-spec 缺节标题：${missingSections.join('、')}（写作规范十九项契约见任务说明）`)
          }
          // 干净审计（真实模式）：范例章交工前 audit 必须带机器可逐条核对的文档矩阵（必读清单逐份摘录原文），
          // 且 `passed === true`（票 01 (e)：范例章与普通章同口径，`audit-skip` 豁免可跳过 passed 判定；
          // `gold-skip` 跳过的是「等用户拍板」，不是验货豁免）。判据与报错跟写入侧 `audit-submit` 共用同一份。
          if (subMeta.demo !== true) {
            const auditText = readFileSync(workFile(project, auditName), 'utf8')
            const verdict = checkGoldAudit(project, gN, auditText)
            if (verdict.error !== null) {
              return rejectSubmit('gold', verdict.error)
            }
          }
          let handledThisRound = 0
          updateMeta(project, (state) => {
            state.pendingStage = null
            state.pendingGate = null
            state.status = 'awaiting-gold'
            delete state.goldRedoNote // 重做意见只对本轮生效
            // style-spec 指纹定格（Q9）：终检交工时对账，spec 变了而报告未声明 → 打回（契约修改必须留痕）。
            // ⚠️ 票 `premature-announce/05`：这里**有意不落账**——「该定格而没有定格」那一笔的唯一写入点是
            // `engine.js` 的 `noteStyleSpecUnfrozen`（**定稿那一刻**）。挂在这个 catch 上会漏掉票题点名的场景：
            // 展示期直接定稿时**这一跳根本没走过**，catch 一次都不会响；而同一个请求此前已经要求这份文件
            // 存在且非空、并为节标题读过它一遍，真盘面上「读不到」极难成立（那一支仍归同一个函数）。
            try { state.styleSpecHash = specFingerprint(project) } catch { /* spec 读不到时不记账（后续对账跳过） */ }
            if (Array.isArray(state.goldOpinions)) {
              for (const o of state.goldOpinions) if (o.status === 'sent') o.status = 'applied'
            }
            // 票 gold-revision-flow/01：交工提示带上**本轮处置**——第一稿与第 N 次修订落同一句，
            // 用户拿不到"你这轮提的意见已经落到新版里了"的任何信号。数的是**本轮真被交办出去的**
            // 那些（sent → applied 这一批），与状态迁移同源、不另记一份账。
            handledThisRound = (subMeta.goldOpinions ?? []).filter((o) => o.status === 'sent').length
          })
          const goldArtifact = artifactDataForChapter(gN)
          appendEvent(project, 'textbook/agent-end', { label: '最佳范例章', outcome: 'ok', path: goldArtifact.path, chapter: goldArtifact.chapter })
          // 票 15④（票 06 的 Answer 第 4 条）：补 `gold-skip` 的读取点——与既有 gate-skip/outline-skip/
          // audit-skip 同构，语义就是「跳过一道已存在的用户确认闸门」（「最佳范例章确认」），
          // 不是新能力、也没有放松任何判据。豁免须由主笔 AI 先得到用户明确同意才调（waive 动作自身的约束）。
          // 金标准定稿沉淀**照走**：意见转风格线 + 记 goldSealed + 落 gold-seal 事件，只跳过「等用户拍板」
          // 那一步（sealGoldStandard 与 gold-approve 共用同一份沉淀逻辑）。
          if (waived(project, 'gold-skip')) {
            sealGoldStandard(project)
            appendEvent(project, 'textbook/hint', { text: '✅ 你已同意跳过范例章确认：范例章照旧定稿沉淀，直接开始写全书。' })
            advance(project, 4, 5)
            void kick(ctx, project)
            return accept({ project, stage: 'gold', skipped: 'gold-confirm' })
          }
          appendEvent(project, 'textbook/hint', {
            text: handledThisRound > 0
              ? `📖 最佳范例章改好了（本轮照着改了 ${handledThisRound} 条意见），请在工作台查看：满意点「✅ 满意，继续写全书」，不满意点「❌ 重写」。`
              : '📖 最佳范例章写好了，请在工作台查看：满意点「✅ 满意，继续写全书」，不满意点「❌ 重写」。',
          })
          return accept({ project, stage: 'gold' })
        }
        case 'chapters': {
          const chapters = subMeta.outline?.chapters ?? []
          const n = Number(body.chapter)
          if (!Number.isSafeInteger(n) || n < 1 || n > chapters.length) {
            return reject(400, 'chapter 参数不合法（需要第几章的编号）')
          }
          const { chapterPath, auditPath } = chapterArtifacts(project, n)
          // 票 `walkthrough-2026-10/02`（走查 A10 的裁决）：**机器是章正文的唯一写者**。
          // 判据不是「文件在不在」（那是**单写者假设**：两个写者先后落盘之后，只要终态齐全它就绿），
          // 而是「盘上那份正文就是这几片分片的拼装件」——分片是子助手的产品、正文是机器的派生件。
          // 三条路各有各的话：① 一片分片都没有 ⇒ 有人（老协议里就是执笔小助手）直写了正文，拒收；
          // ② 盘上那份与拼装件不一致 ⇒ 机器之外有人在写这份文件（同一文件多写者），拒收、**不覆盖**；
          // ③ 机器还没拼过（文件不在）⇒ 机器当场补拼（它本来就是唯一写者）。
          // ⚠️ demo 书不受这一格约束（演示通道不派真小助手，正文本来就由机器写）——判据一个字没放宽。
          if (subMeta.demo !== true) {
            const assembled = verifyChapterAtSubmit(project, n)
            if (assembled.status !== 'ok') {
              return rejectSubmit('chapters', chapterAssemblyReject(assembled, n))
            }
          }
          // 票 `flow-audit-2026-10/07`：这一格原先在真书上**是死代码**——`verifyChapterAtSubmit`
          // 已经先拒了「一片分片都没有」与「正文字面为空」，走到这里时 `chapterPath` 必然非空。
          // 收成**只给演示书**那一支（演示通道不派小助手、上面那道拼装判据整条跳过）：它是演示
          // 正文的兜底，不再冒充真书的第二道判据。
          if (subMeta.demo === true && (!existsSync(chapterPath) || readFileSync(chapterPath, 'utf8').trim() === '')) {
            // ⚠️ 报错文案里给的是**书夹相对路径**（上面 `chapterPath` 是绝对路径，进人话不合适）
            // ⇒ 那一族取 `chapterRel`，与 `:607` 落账的 `path` 逐字同一形状。
            return rejectSubmit('chapters', `第${n}章正文缺失或为空：${chapterRel(n)}`)
          }
          if (!existsSync(auditPath)) {
            return rejectSubmit('chapters', `第${n}章缺少自查记录：${auditRel(n)}`)
          }
          // 章审计机器验货（2026-08-27 用户拍板 Q4'；票 `audit-gate-semantics/01` 起 passed 现算）：
          // 每章交工读 audit JSON，`passed` **不再透传审计员自报的那个布尔**——由 issues
          // （level＋status）现算：存在 `错误/open` ⇒ 拒；`警告/open` 超过阈值 ⇒ 拒；
          // 缺 status／accepted-risk 缺 reason/confirmedBy ⇒ 按契约形状拒（`audit-skip` 不豁免形状）。
          // 对齐金标准章 matrix 校验同口径；「审计未过但交工」直接拒（audit-skip 豁免可跳过）。
          if (subMeta.demo !== true) {
            const audit = readChapterAudit(project, n)
            if (!isAuditRecord(audit)) {
              return rejectSubmit('chapters', `第${n}章审计记录读不出（${auditRel(n)} 不是合法 JSON 对象）：先按审计意见修订并重新审计再交工`)
            }
            const verdict = auditVerdict(audit)
            // ⚠️ 形状**不豁免**：`audit-skip` 只跳过「passed 是否清零」这一条判定（与范例章那一支同口径）。
            if (verdict.problems.length > 0) {
              return rejectSubmit('chapters', `第${n}章审计记录不合契约（${auditRel(n)}）：${auditShapeRejectReason(verdict.problems)}`)
            }
            if (!waived(project, 'audit-skip') && verdict.passed !== true) {
              return rejectSubmit('chapters',
                `第${n}章审计未通过（${auditRel(n)} 按 issues 现算：${readingsLine(verdict.readings)}；`
                + `报告自报 passed=${String(verdict.declaredPassed)}，机器不采信）：先按审计意见修订、逐条把 status 回写 fixed`
                + '（accepted-risk 要写 reason 与 confirmedBy）、重新审计后再交工，'
                + '或豁免「不要求每章都有独立审查」再交工')
            }
          }
          // 前置验货（检查点前置）：单章阶段就查脚手架残留与练习/答案，不让问题流到合并后。
          // demo 书走旧通道不受此约束；scaffold-keep / other 豁免可跳过对应项（与终检 runQualityChecks 同口径）。
          if (subMeta.demo !== true) {
            const chapterText = readFileSync(chapterPath, 'utf8')
            // ── 票 `word-budget-ineffective/02` · 字数兜底下限（维护者 2026-10-27 裁决）──────────
            // 逐字：「字数要求：为兜底字数，不设上限」⇒ `targetWords` 是**至少要有这么多**。
            // 低于兜底 ⇒ 拒收并给三个数（兜底／实际／差）；**达到或超过一律放行、零告警**——
            // ⛔ 这里不判上限、不产生任何「超了」的读数（超了不提示错）。
            // 没有兜底值（老账本没填过）⇒ 不判：⛔ 不拿 6000 之类的默认值去拦旧书。
            // demo 通道不出现在这一支：演示正文由机器确定性生成（几十字），与真书的兜底不可比；
            // 与本节其余内容验货同一条 `subMeta.demo !== true` 口径（登记处见 `demo-exemptions.js`）。
            const wordReading = chapterWordReading(project, n, subMeta, chapterText)
            const { wordsFloor: floor, actualHanzi: actual } = wordReading
            if (floor !== null && actual !== null && actual < floor) {
              // 豁免出口（ADR-0008 修订 2026-08-27 决策 1 / 2026-10-06 裁决）：新检查项不能被卡死。
              // 与其他章级检查同一形状——`other` **点名「字数兜底」＋本章**才放行，且不静默：
              // 放行时照样落一条 hint 点名差了多少。
              if (otherWaiverFor(project, '字数兜底', n)) {
                appendEvent(project, 'textbook/hint', {
                  text: `⚠️ 第${n}章按你的豁免放行「字数兜底」：兜底 ${floor} 汉字 / 实际 ${actual} 汉字 / 差 ${floor - actual} 字。`,
                })
              } else {
                return rejectSubmit('chapters',
                  `第${n}章正文低于兜底：兜底 ${floor} 汉字 / 实际 ${actual} 汉字 / 差 ${floor - actual} 字。`
                  + '字数是兜底下限（达到或超过都放行，不设上限），请补写到至少兜底字数再交工；'
                  + '确因本书设计不写这么多，经用户同意后豁免「其他 · 字数兜底」（点名本章）再交工。')
              }
            }
            if (!waived(project, 'scaffold-keep')) {
              // 票 20：通用残留 + **写作规范声明过的本书标题**两个来源都查（复用 engine 的 `scaffoldResidue`，
              // 与终检 `runQualityChecks` 同一份判据、同一份护栏：escapeRegExp、数量/长度上限、
              // 没声明就整项不追加、读不到 style-spec 就干净退回通用那一条）。
              const residue = scaffoldResidue(project, stripLoaderRegion(chapterText))
              // 票 `pre-gold-build/16`：加上交付清单那 8 类的**逐类**判据（同一份 `scaffoldResidue`
              // 给的 `categories`）——只算**硬类**，措辞类（②「新增」／⑥「可追溯」）在终检那一条上
              // 也只提示、不拦，前置验货同样不拿它卡人。
              const hits = [...residue.declared, ...residue.generic, ...residue.categories.hard]
              if (hits.length > 0) {
                const kinds = [
                  residue.declared.length > 0 ? '本书声明过的脚手架标题' : null,
                  residue.generic.length > 0 ? '通用脚手架标记' : null,
                  residue.categories.hard.length > 0 ? '交付清单那 8 类过程元数据' : null,
                ].filter(Boolean).join(' ＋ ')
                return rejectSubmit('chapters', `第${n}章正文残留 ${kinds}：${hits.slice(0, 3).join('；')}。先拆干净再交工（豁免「保留 AI 的笔记不删」可跳过）。`)
              }
            }
            // 契约原则（Q9）：style-spec 声明「本书不设练习」→ 练习/答案检查自动跳过；否则仍要齐全。
            // 票 `walkthrough-fixes/23`：「其他」豁免在这里是**按章**读的（点名「练习与答案齐全」＋ 章号 N）
            // ——点名到第 1 章的豁免管不到第 2 章（作用域真的进判定，见 `test-flow-transitions-chapters.mjs`）。
            // ⚠️ `main` 那一线此处是 `waived(project, 'other')`（旧的一票整族形状）——并集口径下**不许回退**：
            // 那条形状会被 `test-gate-write-points.mjs` 当场判红（见上面 import 处那条注）。
            if (!otherWaiverFor(project, '练习与答案齐全', n) && !styleSpecDeclaresNoExercises(project) && !/练习|答案|习题/.test(chapterText)) {
              // 同上：文案里是**书夹相对路径** ⇒ `chapterRel`（`工作区/audit-NN.md` 那一行属
              // audit 族、由 `auditRel` 单点——见上面那两条拒收文案；票 `context-budget/18` 复核）。
              return rejectSubmit('chapters', `第${n}章正文没有练习或答案（成品要求练习与答案齐全；若本书设计为不设练习，请在 style-spec 写明「不设练习」）：${chapterRel(n)}`)
            }
            // ── 票 `pre-gold-build/17` · 章级知识点覆盖（承诺面＝债-17／R5；见 `missingChapterPoints`）──
            // 放在「抽查意见销号」**之前**：销号是写账（置 applied），本判据是纯读——放在它后面会让
            // 一次被拒的交工先消费掉用户的意见（半写半退），与上面「未知 id 先整体验明再应用」同一顾虑。
            // 判定强度照实标：**形状级**（逐条 title 在同一份规范化下于正文在场），⛔ 不判「讲透了没有」。
            // 豁免出口与 `outline` 那一跳同名（`other` 点名「知识点覆盖齐全」），但**按章点名**：
            // 第 N 章交工只认「这一章」的豁免（作用域为 null 的书级豁免照旧放行全章，与既有口径一致）。
            //
            // ── 票 `exclusion-flow/01` · F1（spec `exclusion-flow` 决策 1／2）：判据面改读「生效点集」──
            // 划卡**从不改 `meta.outline`**（史实不改）⇒ 本章 points 里可能还留着人已划掉的那条。
            // 两半都要，且共用上面那个豁免出口（⛔ 不新造检查名）：
            //   · 「减」：本章该写的点 ＝ points ∩ effective（`effectiveChapterPoints`，`src/` 里唯一派生）；
            //   · 「加」：正文里出现了人已划掉的那批 title ⇒ 拒（章交工这一刻能改；成品那一跳是兜底，另票）。
            // ⚠️ 两半共用同一个豁免出口是**最小面**的选择（不新造检查名、不动 `waived()` 的形状）；
            // 代价如实记：放行一条误报（正文里的正常引用）会**连带放行**那一章的缺覆盖——已在 spec
            // `.scratch/exclusion-flow/spec.md` 的待签项里写明，不在实现里另造放宽面。
            // ⚠️ `live.length === 0` 时**一个字节都不改**（没有那份件的书、以及「全部放回来」之后的
            // `items: []`）：不做交集、不做「多」的判据——这是「老书行为逐字相同」的保证。⛔ 不许改成
            // 「无条件与 effective 求交」：没有知识地图的书 effective 是空数组，那会把覆盖闸整个关掉。
            // ⚠️ 那份件坏形状 ⇒ 硬闸（与 `outline` 那一跳同一个口径），⛔ 不许章级静默当成「没有裁决」。
            const rawChapterPoints = Array.isArray(chapters[n - 1]?.points) ? chapters[n - 1].points : []
            const coverageCollection = readCoverageCollection(project)
            if (coverageCollection.present && coverageCollection.problems.length > 0) {
              return rejectSubmit('chapters', `这本书上那份人写的裁决记录（${KNOWLEDGE_MAP_EXCLUSIONS_REL}）读不出：${coverageCollection.problems.slice(0, 3).join('；')}。它是「图上划掉的那些卡」的归属处，读不出就没法知道哪几条不该再写——所以这里当场拦下。那份件是人写的：改好它的形状、或删掉它（删掉＝这一本书上没有任何裁决），再交工。`)
            }
            const liveExclusions = Array.isArray(coverageCollection.live) ? coverageCollection.live : []
            let chapterPoints = rawChapterPoints
            if (liveExclusions.length > 0) {
              chapterPoints = effectiveChapterPoints(rawChapterPoints, coverageCollection.effective)
              const droppedHits = excludedPointsInChapterText(liveExclusions.map((item) => item?.title), chapterText)
              if (droppedHits.length > 0) {
                // 票 `kn-unowned-silent/02`：放行只到**点名放弃的那几条**（不再按章一刀切）。
                const hitSplit = splitWaivedPoints(project, '知识点覆盖齐全', droppedHits, n)
                const named = hitSplit.kept.slice(0, 5).map((t) => `「${t}」`).join('、')
                const more = hitSplit.kept.length > 5 ? `……共 ${hitSplit.kept.length} 条` : ''
                if (hitSplit.kept.length > 0) {
                  return rejectSubmit('chapters', `第${n}章正文里出现了人已划掉的知识点：${named}${more}。它们不在「本书要写的」那一份里（见 ${KNOWLEDGE_MAP_EXCLUSIONS_REL}），正文不该再写——把这${hitSplit.kept.length}条从正文里删掉再交工；若只是正常引用、确要保留，经用户同意后让 AI 调 waive（scope.check=「知识点覆盖齐全」、waivedPoints 逐条点名那几条）再交工——豁免只放行点名的点。`)
                }
                // 豁免时不放静默行：写进去的是哪几条照样记一条账本 hint 点名（与缺覆盖那半同口径）。
                appendEvent(project, 'textbook/hint', {
                  text: `⚠️ 第${n}章按你的逐点豁免放行「知识点覆盖齐全」：${hitSplit.waived.slice(0, 5).map((t) => `「${t}」`).join('、')}${hitSplit.waived.length > 5 ? `……共 ${hitSplit.waived.length} 条` : ''} 是人已划掉的知识点（你点名放弃），正文里仍然出现了。`,
                })
              }
            }
            const missingPoints = missingChapterPoints(chapterPoints, chapterText)
            if (missingPoints.length > 0) {
              // 票 `kn-unowned-silent/02`：与 `outline` 那一跳同一份判据——只有**点名放弃的点**才免写。
              const missSplit = splitWaivedPoints(project, '知识点覆盖齐全', missingPoints, n)
              const named = missSplit.kept.slice(0, 5).map((t) => `「${t}」`).join('、')
              const more = missSplit.kept.length > 5 ? `……共 ${missSplit.kept.length} 条` : ''
              // 只有**这一章**真有点被交集拿掉时才说那句；否则「人已划掉的那些不在其中」是假话（别章划的与本区无关）。
              const derivedNote = chapterPoints.length === rawChapterPoints.length ? '' : '（人已划掉的那些不在其中）'
              if (missSplit.kept.length > 0) {
                return rejectSubmit('chapters', `第${n}章正文里读不到本章 points 的 ${missSplit.kept.length} 条知识点：${named}${more}。本章要覆盖的知识点清单在 工作区/outline.md 第${n}章的 points 字段${derivedNote}（机器只认「这一串在正文里出现」，同一份规范化：全半角折算/去尾部括注；换一种说法讲同一个知识点机器认不出来）——逐条补进正文再交工；确要这本不写其中某几条，经用户明确同意后让 AI 调 waive（scope.check=「知识点覆盖齐全」、waivedPoints 逐条点名那几条）再交工——豁免只放行点名的点。`)
              }
              // 豁免时不放静默行：漏了哪些照样记一条账本 hint 点名（与 `outline` 那一跳同口径）。
              appendEvent(project, 'textbook/hint', {
                text: `⚠️ 第${n}章按你的逐点豁免放行「知识点覆盖齐全」：${missSplit.waived.slice(0, 5).map((t) => `「${t}」`).join('、')}${missSplit.waived.length > 5 ? `……共 ${missSplit.waived.length} 条` : ''} 在正文里读不到着落（你点名放弃）。`,
              })
            }
            // 用户抽查意见（Q5'，票 09）：先按 handledReviews **点名销号**——机器只给点名的置 applied，
            // 不搞「交工自动全销号」；再只拦显式 status==='pending' 的意见：老账本里缺 status 的意见
            // （undefined）不再永久卡人（spec 不变量 3）。applied / revoked 都不拦。
            const handled = Array.isArray(body.handledReviews) ? body.handledReviews : []
            const reviews = Array.isArray(subMeta.pendingReviews) ? subMeta.pendingReviews : []
            // 未知 id 语义（本票拍板）：不在本书 pendingReviews 里 → 不认识的 id；别章的意见不在本次
            // 交工范围内 → 同样按未知处理（消息里说清是哪个 id）。先整体验明再应用，防半写半退。
            const unknownIds = handled
              .map((entry) => (typeof entry?.id === 'string' ? entry.id : ''))
              .filter((id) => id === '' || !reviews.some((r) => r.id === id && r.chapter === n))
            if (unknownIds.length > 0) {
              return rejectSubmit('chapters', `不认识的抽查意见 id：${unknownIds.join('、')}。只能点名第${n}章还没处置的意见（id 见 workbench_status 的 pendingReviews）。`)
            }
            // 这份 `reviews` 只用来判断：未知 id 已在上方整体验明（防半写半退）；「点名后还有没有没处置的」
            // 按 pending 且未被点名来算（applied 才销号、revoked 是用户收回的，重复点名幂等忽略）。
            const handledIds = new Set(handled
              .filter((entry) => reviews.some((r) => r.id === entry.id && r.chapter === n && r.status === 'pending'))
              .map((entry) => entry.id))
            const pendingForChapter = reviews.filter((r) => r.chapter === n && r.status === 'pending' && !handledIds.has(r.id))
            if (pendingForChapter.length > 0) {
              return rejectSubmit('chapters', `第${n}章还有 ${pendingForChapter.length} 条未处置的抽查意见：先按意见修订、重新审计（audit passed），交工时用 handledReviews 逐条点名（每条 id + 一句怎么处置的）后再交工。`)
            }
            // 销号落账走单一入口（当场新读）。
            updateMeta(project, (state) => {
              const list = Array.isArray(state.pendingReviews) ? state.pendingReviews : []
              for (const entry of handled) {
                const review = list.find((r) => r.id === entry.id && r.chapter === n)
                if (review === undefined || review.status !== 'pending') continue
                review.status = 'applied'
                review.how = textField(entry.how, CHAPTER_SIDE_REASON_MAX)
              }
            })
          }
          const title = chapters[n - 1]?.title ?? `第${n}章`
          appendEvent(project, 'textbook/agent-end', {
             label: `第${n}章《${title}》完成（小助手执笔 + 小助手审计 + 机器验货）`, outcome: 'ok',
             // 落账的 `path` 是**书夹相对路径**（前端拿它读产物、过程图谱与事件行都按这个形状认）⇒ `chapterRel`。
             // 与 `artifactDataForChapter` 那条是同一份形状的两个消费者，不必也不该另拼。
             path: chapterRel(n), chapter: n,
           })
          // 票 05 / P36（2026-09-27 用户拍板「逐章交工各存一次」）：铺章是**一个阶段**
          // （`stage-start {"stage":"chapters"}` 只发生一次），所以整段 40 万字的写作原先只配发一个存档
          // （交办「写完整本」之前那一个）——界面那句「随时能回到最近一次存档」字面为真，回的却是「一章未写」。
          // 这里在**交工成功之后**落一份，于是「最近一次存档」＝**上一章交完的地方**。
          // 排在 agent-end 之后：存档要含这一章的完成事件，回退到它才真的回到「这一章已交工」那一刻。
          writeSnapshot(project, `交工「第 ${n} 章《${title}》」之后`)
          // 原先这里 appendEvent 之后又拿请求开头那份旧状态整份写回（还自己写了一次 `updatedAt`）：
          // 账高被拉回交工前那份（票 02 的形状）。「最后动静时刻」只归「记一笔」所有，改法里不再碰它。
          const allDone = chapters.every((_chapter, index) => chapterDone(project, index + 1))
          if (allDone) {
            updateMeta(project, (state) => {
              state.pendingStage = null
              state.pendingGate = null
            })
            // 全章交齐：不直接交办合并，kick 让 runPhase5 先裁决过目闸门（F18）。
            void kick(ctx, project)
          }
          // 还有章节：pendingStage 保持 'chapters'（主 AI 在同一回合里继续，不重复唤醒）。
          // 票 `audit-gate-semantics/01`：交工通过之后刷新 `工作区/审计读数.json`（派生快照，不当事后判据），
          // 并把这一跳的读数随响应回给主笔（可复算，与闸门同一份 `auditVerdict`）。
          const readingsSnapshot = refreshAuditReadings(project, subMeta)
          return accept({
            project,
            stage: 'chapters',
            chapter: n,
            allDone,
            ...(readingsSnapshot === null ? {} : { auditReadings: readingsSnapshot }),
          })
        }
        case 'merge': {
          // 过目闸门硬校验：章节还在等人过目时不许合并（F18；demo 书不会进入此态，不拦 demo）。
          if (subMeta.status === 'awaiting-chapters-review') {
            return reject(409, '章节还在等你过目：先在工作台完成全章过目（或先提意见让 AI 改），再合并。')
          }
          // 合并前跨章审计（Q6，2026-08-27 用户拍板；票 `.scratch/context-budget/issues/05` 扩面）：
          // 这一层是**跨章审计小助手**做的（ADR-0030 决策 2 · 改派第一刀 · merge 段）——
          // 派发模板 `references/subagent-prompts/cross-audit-prompt.md`，报告人自落 audit-cross.md，
          // 主笔只派发、按点名条目派修复小助手、汇总裁决追加进同一份文件。
          //
          // ⚠️ 旧判据只验「文件存在且非空」——实测主笔凭协调记忆写了 2,780 字符即放行
          // （merge 窗口 +0 token，一个章都没读）。所以现在逐项断**那五项核对都有交代**。
          // ⚠️ 这一层只断**接线与形状**（在不在、有没有交代）：「它到底读没读章」是真机层（票 07），
          // 机器判据不许冒充。
          // ⚠️ 五项判定词与判定口径**只住在派发模板**（由 cross-audit.js 从那份模板解析）——
          // 拒收文案里点名的是**运行时算出来的**缺项，不在这里抄一份清单。
          if (subMeta.demo !== true) {
            const crossPath = workFile(project, 'audit-cross.md')
            if (!existsSync(crossPath) || readFileSync(crossPath, 'utf8').trim() === '') {
              return rejectSubmit('merge', `合并前缺跨章审计记录 工作区/audit-cross.md：按 resources/${CROSS_AUDIT_TEMPLATE_REL} 派一个上下文干净的跨章审计小助手读全部章做五项核对，它自己把报告落在这份文件里（五项判定词与判定口径只见那一份模板），补齐再交工合并。`)
            }
            const verdict = judgeCrossAuditReport(readFileSync(crossPath, 'utf8'), undefined, { ledger: readCrossAuditEdgeLedger(project, subMeta) })
            if (verdict.wiringBroken || verdict.missing.length > 0) {
              return rejectSubmit('merge', crossAuditRejectReason(verdict))
            }
          }
          // 票 `audit-gate-semantics/01` · A4：**合稿前**每章 `errors_open = 0`，否则不许出合稿
          // （与终检 `finalDeliveryProblems` 共用 `chapterAuditGateProblems`，⛔ 不各写一份）。
          // 位置在跨章审计之后：先确认跨章审计做过了，再对账逐章读数；两条都过才写 book.md。
          const auditGate = chapterAuditGateProblems(project, subMeta)
          if (auditGate.problems.length > 0) {
            return rejectSubmit('merge', chapterAuditGateRejectReason(auditGate))
          }
          const preface = typeof body.preface === 'string' ? body.preface.trim() : ''
          if (preface === '') {
            return rejectSubmit('merge', '需要 preface（书的引言/使用说明文本）')
          }
          // 合稿这一刻把读数刷成最新快照（派生件；闸门刚才的判定已从 audit-NN.md 现算过）。
          refreshAuditReadings(project, subMeta)
          writeWork(project, 'preface.md', preface)
          const chapters = subMeta.outline?.chapters ?? []
          // 票 `walkthrough-fixes/36`：拼装口径收进**一个纯函数**（`book-assembly.js`）——成品重拼
          // （`chapter-assemble` 之后）与成品判据（`runQualityChecks`）读的是同一个函数，
          // 不再有「合并时一份拼法、判据另一份量法」。本跳只负责「读盘上的章正文 ＋ 写下去」。
          // loader 段（human 路线）、章间 `---`、`# 第N章 <标题>` 这一行都是那个函数的拼装契约（逐字未动）。
          writeWork(project, 'book.md', composeBook({
            name: subMeta.name ?? '',
            preface,
            route: subMeta.route,
            chapters: chapters.map((chapter, index) => {
              const { chapterPath } = chapterArtifacts(project, index + 1)
              return {
                title: chapter?.title ?? '',
                text: existsSync(chapterPath) ? readFileSync(chapterPath, 'utf8') : '',
              }
            }),
          }))
          updateMeta(project, (state) => {
            state.pendingStage = null
            state.pendingGate = null
          })
          appendEvent(project, 'textbook/agent-end', { label: '合并成书（机器拼装 + AI 前言）', outcome: 'ok', ...artifactDataForStage('merge') })
          advance(project, 5, 6)
          void kick(ctx, project)
          return accept({ project, stage: 'merge' })
        }
        case 'final': {
          const report = typeof body.report === 'string' ? body.report.trim() : ''
          if (report === '') {
            return rejectSubmit('final', '需要 report（你的最后检查报告）')
          }
          // ── 票 `walkthrough-fixes/37` · 驳回意见的**逐条交代**（真实模式；演示书从不经这一跳）──────
          // 病：用户那句意见整段进 `finalRedoNote`、整段注入交办说明，重新交工只要一份 `report`
          // ⇒ 「四件事做了几件、漏了哪几件」在账本与界面两边都读不出来。
          // 现在的形状（与 `styleCheck` 同一强度）：
          //   · 拆条落账（`final-redo-items`）没做 ⇒ 这一跳直接拒（否则「漏项」从一开始就不可见）；
          //   · `redoCheck` 与落账那份条目集**逐条对齐**，漏一条点名拒收；
          //   · ⚠️ 机器只断「**有没有逐条交代**」，⛔ 不断「办得对不对」——`done` 仍然是自述，
          //     那条边界在 `docs/adr/0005`（§「这条没改什么」第 2 条：没人做出的判断仍然是空的）。
          const redoNote = typeof subMeta.finalRedoNote === 'string' ? subMeta.finalRedoNote : ''
          let finalRedoCheck = null
          if (redoNote.trim() !== '') {
            const redoItems = Array.isArray(subMeta.finalRedoItems) ? subMeta.finalRedoItems : []
            if (redoItems.length === 0) {
              return rejectSubmit('final', '这一轮是照用户的驳回意见改的，但那条意见还没拆成条目落账：先 workbench_act(action=final-redo-items, redoItems=[…]) 把意见逐条拆好（每条照原文抄一段），再重新交工。')
            }
            const redoProblem = finalRedoCheckProblem(redoItems, body.redoCheck)
            if (redoProblem !== null) {
              return rejectSubmit('final', redoProblem)
            }
            finalRedoCheck = mergeFinalRedoCheck(redoItems, body.redoCheck)
          }
          // ── 票 `flow-audit-2026-10/01`＋`audit-gate-semantics/01`：交付前五条硬条件收成**一份只读判据** ──
          // 留言销号／进度账本／五份分查报告／style-spec 指纹／每章审计 errors_open=0。原先它们只长在**这一跳**，
          // 认可交付（`gates.js` 的 `final-approve`）只重跑 `runQualityChecks`，交工之后改坏这四件
          // 照样能交付。现在两跳调同一个 `finalDeliveryProblems`，⛔ 不各写一套。
          // ⚠️ 先补记 style-spec 变更那一笔再对账（票 12 · ①）：工作台没开过、这一路也没人轮询时，
          // 那一笔不在账本里；补检让「留痕」不依赖「有人正开着界面」。
          try { noteStyleSpecChange(project) } catch { /* 补记失败不许挡住对账本身 */ }
          const deliveryProblems = finalDeliveryProblems(project, subMeta, { report })
          if (deliveryProblems.length > 0) {
            const first = deliveryProblems[0]
            if (first.status === 409) return reject(409, first.message)
            return rejectSubmit('final', first.message)
          }
          // 票 `audit-gate-semantics/01`：终检硬条件刚过（含「每章 errors_open = 0」那一格），
          // 把读数快照刷成终检这一刻的版本。⚠️ 它是派生件，不是通过凭据：上面那道判据已从
          // `audit-NN.md` 现算过；⛔ 以后读这份快照的人不许拿它当「检查过」的证据。
          refreshAuditReadings(project, subMeta)
          // 走到这里 ⇒ 五份分查报告都在且可读（上一条判据刚验过）——读回来喂 styleCheck 的
          // 「去向要有原文为据」那一格（与 `judgeFinalAuditReports` 同一个条目枚举，⛔ 不另读一份）。
          // ⚠️ 演示书走 `stage-submit(final)` 时五份分查不在盘上（它由演示终检支自己产）——这一跳
          // 只做「真实模式的 styleCheck 出处」那一格，demo 不读那五份（否则 500 ENOENT）。
          const finalAuditReports = subMeta.demo === true
            ? []
            : FINAL_AUDIT_SCOPES.map(({ n }) => ({
              n,
              text: readFileSync(join(reportDir(project), finalAuditReportName(n)), 'utf8'),
            }))
          // styleCheck 处置契约（真实模式 + 存在 active 风格线时必交）。
          if (subMeta.demo !== true) {
            const active = (subMeta.styleNotes ?? []).filter((n) => n.status === 'active')
            const disposals = Array.isArray(body.styleCheck) ? body.styleCheck : []
            if (active.length > 0 || disposals.length > 0) {
              const byId = new Map(disposals.map((d) => [d.id, d]))
              const missing = active.filter((n) => !byId.has(n.id)).map((n) => n.text)
              if (missing.length > 0) {
                return rejectSubmit('final', `这些风格意见没有处置：${missing.join('；')}。每条都要给出去向（落实在哪章 / 冲突理由 / 已收回）。`)
              }
              for (const d of disposals) {
                if (!['adopted', 'conflict', 'superseded'].includes(d.status)) {
                  return rejectSubmit('final', 'styleCheck 的 status 只能是 adopted / conflict / superseded')
                }
                if (d.status === 'conflict' && (typeof d.note !== 'string' || d.note.trim() === '')) {
                  return rejectSubmit('final', 'conflict（冲突）必须写一句理由，说明向用户确认过')
                }
              }
              // 票 `pre-gold-build/15` · 债-18：去向的**来源**——「交代由五份分报告各自做」。
              // `adopted`／`conflict` 那两种去向必须在五份分报告之一里有**原文为据**（逐字写着那条
              // 风格线的原文，或它的 id）；`superseded` 不要求（那是协调员对用户后来那句话的记账）。
              // ⚠️ 断的是「**有据**」，不断「协调员那条去向与报告里那句是同一句」（判断，真机层）。
              const noteById = new Map((subMeta.styleNotes ?? []).map((n) => [n.id, n]))
              const noSource = disposals
                .filter((d) => d.status === 'adopted' || d.status === 'conflict')
                .map((d) => noteById.get(d.id))
                .filter((n) => n !== undefined
                  && String(n.text ?? '').trim() !== ''
                  && !styleLineCitedInReports(finalAuditReports, n))
                .map((n) => n.text)
              if (noSource.length > 0) {
                return rejectSubmit('final', styleDisposalsWithoutSourceRejectReason(noSource))
              }
              // 权威翻转：meta 状态只在这里改。⚠️ 票 `demo-channel-full/10` 起这一下走**唯一写入口**
              // （`engine.applyStyleDisposals`，它一并刷新 `工作区/style-line.md` 镜像）——演示书的
              // 终检那一趟调的是**同一个函数**，两处不再各写一份「改 meta ＋ 刷镜像」。
              // 本行的行为逐字未变：同一个闭包、同一个 `textFieldRaw` 表达式，只是搬进了那个函数。
              applyStyleDisposals(project, disposals)
            }
          }
          // style-spec 对账（Q9，2026-08-27）：范例章定稿后 spec 被改过 → 契约修改必须留痕。
          // 判据已收进 `finalDeliveryProblems`（与认可交付共用）。这里只做**通过之后的锚定**：
          // 报告里声明了「style-spec 变更：」⇒ 这一版是用户确认过的新契约，把指纹推进到当前值，
          // 否则认可交付那一跳会拿旧指纹把一次已声明的合法修改再挡一次（两跳各判一次、口径必须同源）。
          // ⚠️ 没声明时上一条判据已经拒收，走不到这里。
          if (report.includes('style-spec 变更')) {
            try {
              const now = specFingerprint(project)
              updateMeta(project, (state) => { state.styleSpecHash = now })
            } catch { /* spec 读不到 ⇒ 不推进指纹；认可交付那一跳仍会按对不上拒 */ }
          }
          // 票 `context-budget/12` · ADR-0030 决策 18–20：**机器按固定形状无损拼装一份派生汇总件**，
          // 落 `工作区/报告/final-summary.md`（路径单一持有：`domain-rules.finalAuditSummaryRel`）。
          // 汇总件 = 五份分报告**逐条点名条目的并集（去重）**，同输入同输出；
          // **机器不出裁决**：通过／不通过仍归主笔，五份各自的结论一份都不合并、不替代。
          //
          // ⚠️ **为什么写在这里而不是只在交办说明里写**：`buildStageBrief` 已经拼过一次（主笔读它），
          // 这一处是**交工那一刻的权威刷新**——五份可能在最后一次领任务之后才改过。
          // 两处走的是**同一个** `refreshFinalAuditSummary`，不存在两份拼装口径。
          // ⚠️ demo 豁免那一族（票 11）：演示通道不派真小助手，五份不在盘上 ⇒ 拼不出汇总件
          // （`refreshFinalAuditSummary` 返回 `null`），于是指针是 `path: null` 而不是指向一份空件。
          //
          // ⚠️ 票 `demo-channel-full/08`：那一格的**形状与那句话**搬进了 `finalReportPointer`——因为
          // **演示书的终检支现在也产这一格**（原来只有真书这一支产）。一个字段一种形状，两处都从那个
          // 函数取；本行的行为逐字未变（同一个表达式、同一个句子）。
          //
          // ⚠️ **本地量叫 `reportPointer`、不叫 `finalReportPointer`**（本票第一版撞过：本地量与 import
          // 同名 ⇒ 下面那个 `updateMeta`（硬检查过的那一支）里的 `state.finalReport = finalReportPointer`
          // 悄悄赋成了**函数对象本身**，500 报的是「could not be cloned」——形状闸/类型闸都没有这一条，
          // 是 `test-flow-transitions-chapters.mjs`／`test-collab-backend.mjs` 的真跑把它逮住的）。
          const summary = refreshFinalAuditSummary(project)
          const reportPointer = finalReportPointer(report, summary)
          updateMeta(project, (state) => { state.finalReport = reportPointer })
          appendEvent(project, 'textbook/ai-report', { report })
          // 机器硬检查兜底：全过才交付，否则打回主 AI 修。
          const machineChecks = runQualityChecks(project)
          // 票 `walkthrough-fixes/19`③：第三态 `state:'skipped'`（用户跳过的关卡）**不是没过**——
          // 跳过＝把验货推迟并记账，不是取消验货、也不是新增一道闸；它照样逐条进清单
          // （那一族的 `ok` 仍是 false，所以下游读 `ok` 的地方仍看到「未验」）。
          // 票 `flow-audit-2026-10/03`：`state:'not-checked'`（没有基线、这一格不知道查什么）
          // 与 `state:'skipped'` 同档——**不算没过**，但也不折进「全过」，交付账照旧逐条列着它。
          if (machineChecks.every((check) => !checkBlocksDelivery(check))) {
            // 终检结果认可闸门（2026-08-26 用户拍板）：硬检查全过也不直接交付——
            // 先落 awaiting-final-approval，把自查报告 + 检查结果展示给用户做「对整本书的最终认可」。
            // demo 与真实共用认可闸门（2026-09-01 全镜像：演示书也走完整确认流程）。
            updateMeta(project, (state) => {
              state.pendingStage = null
              state.pendingGate = null
              state.status = 'awaiting-final-approval'
              state.finalChecks = machineChecks
              state.finalReport = reportPointer
              delete state.finalRedoNote // 终检修订意见销号：本轮交工已通过，意见已落实（2026-08-27 grill 修订）
              // 票 `walkthrough-fixes/37`：这一轮的**逐条去向**留在 meta 上——认可卡要先把它们摆给用户看
              // （「哪条没办」要在他点「认可」之前就看得见）。下一轮驳回或交付那一刻才清（`gates.js`）。
              if (finalRedoCheck !== null) state.finalRedoCheck = finalRedoCheck
            })
            appendEvent(project, 'textbook/quality', { checks: machineChecks })
            appendEvent(project, 'textbook/agent-end', { label: '最后检查（AI 自查 + 机器兜底）', outcome: 'ok', ...artifactDataForStage('final') })
            // 票 `walkthrough-fixes/37`：去向**逐条进账本**（`data.finalRedoCheck` 机器读，`text` 人读）——
            // 「哪条没办」不只活在 AI 的自查报告里，流水账与《过程记录.md》都能逐条读到。
            if (finalRedoCheck !== null) {
              appendEvent(project, 'textbook/hint', {
                text: finalRedoCheckText(finalRedoCheck),
                finalRedoCheck,
                finalRedoItems: subMeta.finalRedoItems ?? [],
              })
            }
            appendEvent(project, 'textbook/hint', {
              text: FINAL_CHECK_DONE_HINT,
            })
            return accept({ project, stage: 'final', awaitingApproval: true, checks: machineChecks })
          } else {
            const issues = machineChecks.filter(checkBlocksDelivery)
              .map((check) => `${check.name}：${check.note ?? ''}`)
            appendEvent(project, 'textbook/error', {
              task: '最后检查',
              message: `机器兜底发现 ${issues.length} 项没过：${issues.join('；')}。请 AI 修复后重新交工。`,
            })
            updateMeta(project, (state) => { state.status = 'running' })
            // 不自动再唤醒：问题已随响应返回主 AI，它会在同一回合修复并重交；用户也可点重试。
            return accept({ project, stage: 'final', delivered: false, issues: issues.map((text) => ({ text })) })
          }
          return
        }
        default:
          return reject(400, `未知交工阶段: ${stage}`)
      }
    }
    case 'agent-assign': {
      // ── 派单正文改**机器代填**（票 `.scratch/context-budget/issues/18` · ADR-0030 决策 4 的延续）──
      //
      // 病（实测 `.scratch/context-budget/evidence/ctx-audit-live-*.json`）：整份派单 prompt 是主笔
      // 自己写进 `subagent` 工具入参的——两本书 74,041／73,930 字符（8.06%／4.84%，24／32 次），
      // 而宿主剪枝器只遍历 `tool/result`，`tool/call` 的入参**一个字都不剪** ⇒ 这一栏是整场永久占位。
      // 它是**搬运不是判断**：模板自己就写着「填好的 dispatch ＝ 模板 ＋ 实际值」。
      //
      // 现在：主笔只给「哪一档 ＋ 章号 ＋ 一句叮嘱」，机器按模板（形状的**唯一**出处）＋ 这一段
      // brief／meta 的实际值拼好整份 prompt，再由本动作起子代理，把 `agentId` 回给主笔。
      //
      // ⛔ 边界（票面红线，一条都不许越）：
      //   · **只接管**九份派发模板 ＋ 终检那一节对应的那一族派单（`DISPATCH_SPECS` 十档）；
      //     模板覆盖不到的派单（改章小助手那类）仍走主笔自己的 `subagent` 工具。
      //   · **不接管** `send_message`（中途引导）／`list_agents`（召回）／审计员的 `audit-submit`。
      //   · **不改**落盘路径契约（`chapterRel` / `audit-<NN>.md` / `工作区/报告/` 那一族照旧）。
      //   · 插件里**不抄第二份骨架**：模板正文逐字进 prompt，缺一段就报断线（`DispatchShapeError`）。
      assertSessionOwned(project, sessionId)
      const assignMeta = readMeta(project)
      if (assignMeta === null) return reject(404, '项目不存在')
      // 票 `confirm-points-redesign-build/01`：派小助手也是「派单」⇒ 同一道前置闸（缺件不开这一站）。
      {
        const blocked = stageDispatchPreconditionProblem(project)
        if (blocked !== null) return reject(409, blocked)
      }
      const spec = dispatchKindSpec(body.dispatchKind)
      if (spec === null) {
        return reject(400, `未知派单类型: ${String(body.dispatchKind)}（认这些：${dispatchKinds().join(' / ')}）`)
      }
      // 每档的值本来就来自身处那一段的 brief（章级的值在 chapters、范例章的值在 gold……），
      // 所以「只在领到那一段任务时派」是**值从哪来**这条事实本身，不是额外限制。
      const assignBrief = buildStageBrief(project)
      if (assignBrief === null || assignBrief.stage !== spec.stage) {
        const where = assignBrief === null ? '当前没有在等主笔动手（先 stage-brief 领任务）' : `当前在等的是「${assignBrief.stage}」那一段`
        return reject(409, `这一档派单要等「${spec.stage}」那一段的任务说明（${where}）——${spec.kind} 的值逐字来自那一段的 brief`)
      }
      // 形状出处：九份是模板文件全文；终检那一档是 `audit-and-testing.md` §十 的「终检分查」一节。
      // 票 `resource-read-result/03`：读口回分档答案——**缺 ⇒ 仍在同一处 500 拒收**（状态码不变：
      // 这是仓内形状坏了，不是这本书的问题），但文案**点名「读不出」＋ rel ＋ reason**，不再让它
      // 溜到拼装器那里报成「模板缺承重段」（那句属于「模板在、但少了某段」，不是这一档）。
      // ⚠️ `final-check` 那一档带 `section`：迁移后也走同一个显式 500（先读全文、再切节、切不出仍是
      // 「读不出」的形状）——它今天已经是对的，⛔ 不许把那个好形状改坏。
      const rawShape = readResource(spec.shapeRel)
      const shapeText = rawShape.ok
        ? (spec.section === undefined ? rawShape.text : pickSections(rawShape.text, [spec.section]))
        : ''
      if (!rawShape.ok || String(shapeText).trim() === '') {
        const why = rawShape.ok ? (spec.section === undefined ? '' : ` 的「${spec.section}」切不出正文`) : ` 读不出（${rawShape.reason}）`
        return reject(500, `派单形状读不出来：resources/${spec.shapeRel}${why}——模板是这一档形状的唯一出处，读不到就不许给半份骨架`)
      }
      let values
      let prompt
      try {
        // ── 票 `depth-round-3/06`：**读什么由表驱动** ───────────────────────────────────────────
        // 「这一档要哪几位读盘结果」住在 `DISPATCH_SPECS[kind].inputs`（唯一一处声明；`boundary` 那一位
        // 从 `BOUNDARY_DISPATCH_KINDS` 派生）。本跳只按声明逐位去**读**——⛔ 不再按 `spec.kind ===`
        // 分支决定要不要读（那种写法会让「加一档／改一档的输入面」在动作层与拼装器两处各漂）。
        // ⚠️ **读盘只住这一层**（`dispatchValues` 是纯函数：不读时钟、不写随机数、**不碰盘**）；
        // 读出来的那几位**当值**传进去，拼装器一个字节都不读盘。
        // ⚠️ 遍历的是**读盘表**（键序＝读盘次序），不是声明（声明序＝缺件时的点名次序）；
        // 两个次序各管一件事，别合成一个——合成之后「先读谁」会随某一档的表意变。
        const dispatchInputs = {}
        for (const [name, read] of Object.entries(DISPATCH_INPUT_READERS)) {
          if (!spec.inputs.includes(name)) continue
          dispatchInputs[name] = read(project, assignMeta)
        }
        // 声明了却没有读法 ⇒ 仓库里的表破了（不是这次请求不成立）：⛔ 不许静默跳过这一位。
        for (const name of spec.inputs) {
          if (!Object.prototype.hasOwnProperty.call(dispatchInputs, name)) {
            throw new DispatchShapeError(`${spec.kind} 声明了要输入「${name}」，但动作层读盘表（DISPATCH_INPUT_READERS）里没有这一位的读法——`
              + '声明面与读盘表不同键：加一位输入时两处都要动')
          }
        }
        values = dispatchValues(spec.kind, {
          meta: assignMeta, brief: assignBrief,
          // ⚠️ `chapter`／`material`／`scope` 转数（缺＝NaN⇒400）；`shard` **原样传**——
          // 它可省（缺＝只派一路），但填了就必须合法，静默归一是在替主笔编一个分片号。
          chapter: Number(body.chapter), shard: body.shard,
          material: Number(body.material), scope: Number(body.scope),
          note: textField(body.note, AGENT_ASSIGN_NOTE_MAX),
          // 读盘结果那几位（`graphReview`／`graphInputs`／`boundary`／`edgeLedger`／`survey` 里
          // **这一档声明了的**那几位）——键名逐字就是 `DISPATCH_SPECS[kind].inputs` 里的写法。
          ...dispatchInputs,
        })
        prompt = assembleDispatchPrompt(spec.kind, { shapeText, values })
      } catch (error) {
        // 形状断线是**仓库里的形状出错**（500）；章号／材料号／分路号越界是**这次请求不成立**（400）。
        if (error instanceof DispatchShapeError) return reject(500, error.message)
        return reject(400, String(error instanceof Error ? error.message : error))
      }
      if (ctx.subagents === undefined || typeof ctx.subagents.startContinuable !== 'function') {
        return reject(500, '宿主没有小助手服务（ctx.subagents.startContinuable），这一档派单派不出去——升级宿主或先按老路自己用 subagent 工具派')
      }
      // ── 票 `pre-gold-build/13`（债-15）：并发上限从**承诺**变成**真判据** ────────────────────────
      // 承诺面：九份派发模板（`resources/references/subagent-prompts/` 各带那一节）与各段交办件都逐字写着
      // 「到上限就等一个回来再派下一路——**这是硬约束不是建议**」（模板侧那九份一个字不动；
      // `material-survey` 那一份是书级一路，同一句话换了措辞照旧写着）。
      // 这一跳从前零计数零比较，只会校验档位／章号／材料号就 `startContinuable`——超派没人拦。
      //
      // 上限**同源**：逐字取本轮 `buildStageBrief` 的那个字段（`brief.maxConcurrentSubagents`，
      // 由 `workbench-knobs.readMaxConcurrentSubagents(meta.maxConcurrentSubagents)` 派生）
      // ——派单模板里那个数与这里判的那个数是同一份读数，⛔ 不在本跳另读一次 meta／另设一个默认。
      // 计数**同源**：复用暂停那一族的 `countRunningSubagents`（engine）——⛔ 不另写一份计数实现。
      //
      // ⚠️ 判据声称的强度＝实现的强度：`countRunningSubagents` 数的是宿主的**活性位**
      //（`activity` 那一格为 `running` 的条目；**含编排脚本成员**，且「驻留但空闲」也算在跑，
      //  见 engine 那一处注释），不是「正在写」——所以文案只说「在跑」，不说「在写」。
      // ⚠️ `null` ＝ **数不出来**（宿主服务缺席／`listDescendants` 抛错）⇒ **不拦人**：
      // 「不知道」不是「有人在跑」，与 `gates.js` 重做前那道闸同一条口径（`null` 不是 0）。
      // ⚠️ 次序：这一跳排在**参数错（400）与形状断线（500）之后**——上面的档位／章号／shard／模板
      // 校验先说话，超派是「这次请求成立但此刻不该发」⇒ 409。
      // ⛔ 不排队、不等待（那会新开一个机制）：只**拒收并点名**，让主笔自己等一路回来。
      const cap = Number(assignBrief.maxConcurrentSubagents)
      if (Number.isSafeInteger(cap) && cap >= 1) {
        const runningNow = await countRunningSubagents(ctx, sessionId)
        if (runningNow !== null && runningNow >= cap) {
          return reject(409, `并发上限是 ${cap} 路，现在已经有 ${runningNow} 路在跑——等一路回来再派这一路`
            + '（交办件与派发模板里那句「到上限就等一个回来再派下一路」就是这一条）。')
        }
      }
      // ⚠️ **父级必须是主笔本人**（票 `context-budget/18` 落地时实测钉死的一条）：宿主这一端是
      // `backgroundMode: continuable`（`preset/textbook.patch.yml` 的 tool-subagent）——
      // 续接型子代理**没有 run 句柄**，它的结果由宿主的 `notifySettlement` 送回**它的直接父级**，
      // 而 `send_message`（中途引导）的许可判据也是「发送者的直接父级／直接续接子代理」。
      // 所以只有把子代理挂在主笔自己的会话下，「报告回得来 + 中途引导够得着」这两条才同时成立。
      // ⛔ 不另造第二套接线：`parents`/`getParent` 那一套是给「一次性子代理 ＋ 调用方自己 await 结果」
      //    的既有调用点（`content-lib.js` / `debug-spawn`）用的，投递模型与本票不同，不动它。
      const parent = typeof ctx.agents?.get === 'function' ? ctx.agents.get(sessionId) : undefined
      if (parent === undefined) {
        return reject(500, '派单派不出去：找不到这个会话的主 AI（子代理要挂在主笔自己的会话下，报告才回得来）——确认主笔正活着再重试')
      }
      let started
      try {
        started = await ctx.subagents.startContinuable({
          provider: SUBAGENT_PROVIDER,
          label: values.label,
          request: { prompt: [{ type: 'text', text: prompt }], parent },
          // 这个 signal 只掌「入队握手」那一段（上游：`owning the operation only until inbox acceptance`），
          // **不是子代理的寿命上限**——子代理被收下之后照旧自己跑完。
          signal: AbortSignal.timeout(60 * 1000),
        })
      } catch (error) {
        return reject(500, `派子代理失败：${String(error instanceof Error ? error.message : error)}`)
      }
      // 派单记录进账本（`label` 那一栏照用）：工作台照旧看得见每一路，产物入口照旧按 label 派生。
      appendEvent(project, 'textbook/agent-start', { label: values.label, ...artifactDataForLabel(values.label, goldN(assignMeta)) })
      return accept({
        project,
        agentId: started?.childId ?? null,
        label: values.label,
        kind: spec.kind,
        template: spec.shapeRel,
        promptChars: prompt.length,
      })
    }
    case 'stage-brief': {
      // 主 AI 领任务：当前 pendingStage 的任务说明 + 方法论文本（全中文）。
      assertSessionOwned(project, sessionId)
      // 票 `confirm-points-redesign-build/01`（票面落点 (c)）· **派单前的硬闸**：
      // 站 5 的前置（站 4 的结论件 ＋ 它指的那份正文）缺一件 ⇒ 这一站**不开**、当场报错，
      // ⛔ 不交一份指不到东西的派单件出去（旁证缺**不**走这里——那是降级：指针块里多一句照开）。
      {
        const blocked = stageDispatchPreconditionProblem(project)
        if (blocked !== null) return reject(409, blocked)
      }
      // 票 `depth-round-3/08`：**拼装写盘从读函数里挪出来**——`buildStageBrief` 从此只读；
      // 终检汇总件（读齐五份 → 写 `工作区/报告/final-summary.md`）由这一处调用方显式拼。
      // ⚠️ 只在**终检那一站**拼：其余阶段不该因为一次「领任务」就写别人的产物。
      if (readMeta(project)?.pendingStage === 'final') refreshFinalAuditSummary(project)
      const brief = buildStageBrief(project)
      if (brief === null) {
        return accept({ brief: null, message: '当前没有待办任务（机器没在等你）。' })
      }
      return accept({ brief })
    }
    case 'progress': {
      // 主 AI 上报进度（工作台状态卡实时显示；不需要征求用户同意）。
      assertSessionOwned(project, sessionId)
      const progressMeta = readMeta(project)
      if (progressMeta !== null && progressMeta.pause !== null && progressMeta.pause !== undefined) {
        return reject(409, '已在暂停，请先点继续（▶）再上报进度')
      }
      // 票 `pre-gold-build/12` · 债-11：越界 `chapter`／枚举外 `stage` 以前在这里判成 `null`
      // ——**不拒收、不提示、不记账**（另一半「静默丢而不报错」是 `.scratch/premature-announce/02`
      // 的地盘；本票只做**强度**那一半）。今天：**拒收并点名**，判据单一出处＝
      // `domain-rules.progressFieldProblem`（上限那一半由这里把本书章数传进去才判得动）。
      // ⚠️ 处置沿用既有的 B 类（调用方自己把请求写错）：裸 400，**不落**「交工被拒」那条账
      // （记成「交工被拒」会让工作台事件行说假话——见本文件那段 A/B 分类注释）。
      const chapterTotal = Array.isArray(progressMeta?.outline?.chapters) ? progressMeta.outline.chapters.length : 0
      const fieldProblem = progressFieldProblem(body.chapter, body.stage, chapterTotal)
      if (fieldProblem !== null) return reject(400, fieldProblem)
      const label = textFieldRaw(body.label, PROGRESS_LABEL_MAX)
      const detail = textFieldRaw(body.detail, PROGRESS_DETAIL_MAX)
      // 票 `pre-gold-build/12` · 债-13：这一行会**原样上屏**（`src/ui/event-cards.js` 的
      // `⏳ ${extra}`），所以先过最薄的形状判据（替用户记动作／承诺没发生的事）——命中即拒收并点名。
      const lineProblem = progressLineShapeProblem(`${label}${detail === '' ? '' : ` ${detail}`}`)
      if (lineProblem !== null) return reject(400, lineProblem)
      appendEvent(project, 'textbook/progress', { label, detail })
      // F35（2026-08-20 走查）：主 AI 上报章节流水线阶段（chapter+stage）→ 结构化账本
      // meta.chapterPipeline[n-1]={stage,updatedAt}；demo 豁免；旧账本 ?? [] 兜底。
      // 走单一入口（当场新读）：原先这里还自己写了一次 `updatedAt`（票 02 的形状）；
      // 「最后动静时刻」只归上面那记「记一笔」所有。
      // ⚠️ 票 `pre-gold-build/12`：合法性**已经在上面由 `progressFieldProblem` 判过**
      // （判据单一出处）——这里只取结构化值，不再自己判一次「这个 stage 在不在枚举里」
      // （第二份判据必然与第一份漂；原先那一行就是同一个 `includes` 的第二份副本）。
      const chapterN = body.chapter === undefined || body.chapter === null ? null : Number(body.chapter)
      const stage = body.stage === undefined || body.stage === null ? null : String(body.stage)
      if (chapterN !== null && stage !== null) {
        // 票 `demo-channel-full/03`：这一段抽成**唯一写入口**（`engine.recordChapterStage`）——
        // 演示支从那一票起也落这一笔（它自己那几步，见 `demoWriteChapters`），两边共用同一处口径。
        // ⚠️ 原先这里那条 `if (state.demo === true) return` 的 **demo 守卫已删**：它护的那句话是
        // 「演示通道不上报 `progress`，这一段没有内容可记」，而本票之后演示支**自己也记**这一格 ⇒
        // 那句话不再成立，守卫留着只会变成「同一份上报，真书记、演示书记一半」的无理由不对称。
        // 那条分叉的登记（`src/demo-exemptions.js` 的 `chapter-pipeline-ledger`）随之**关闭**。
        recordChapterStage(project, chapterN, stage)
      }
      // 上报进度后让状态机照账本重推导（幂等，runLoop 会在等待点停下）：
      // 铺章全写完的瞬间在这里停下等人过目（F18）；其它阶段照旧推进。
      void kick(ctx, project)
      return accept({ project })
    }
    // ── 票 `knowledge-graph-build/12`：老书那颗「补一份知识点图」的键（**入口**这一半）──────────
    // 机制一个字都不在这里：读细目／回原文取行段／重拼／形状闸全在 `../knowledge-graph-build.js`
    // （票 04）。这一格只做入口该做的三件——归属、**把界面那三条可见性在盘上兑现一遍**（界面读的是
    // 回包里的 `meta` ＋ 合并件正文，这里是权威事实的那一份）、把动作交出去并把结果译成人话。
    // ⚠️ 三条守卫只用来说「界面那颗键不该出现、却有人直接把动作发了过来」：界面侧由
    //    `src/ui/knowledge-graph-backfill.js` 的 `graphBackfillEntry` 同一条判据挡住。
    // ⛔ 这一格**不预告成败**、不自己读材料：落不落得下来只有机制知道。
    case 'knowledge-graph-backfill': {
      assertSessionOwned(project, sessionId)
      const backfillMeta = readMeta(project)
      if (backfillMeta === null) throw new Error(`unknown project ${JSON.stringify(project)}`)
      // ③ 非演示书：演示书的产物是**录制基线**，机器补图会把基线弄过期（票 04 §四.1）。
      if (backfillMeta.demo === true) {
        return reject(409, '演示书补不了知识点图（它那条流程是录好的，图补不进去）')
      }
      // ① 老书＝已交出过材料报告（合并件就是那一步落的）。
      if (backfillMeta.exploreConfirmed !== true) {
        return reject(409, '这本书还没交出过材料报告，先走完那一步再来补图')
      }
      // ② 合并件缺图键（两个图键都在＝图已在）：⛔ 不在已有图上再补一遍——那会把两个键整个重写，
      //    而票 06 对齐出来的跨材料边正是写在 `edges` 里的。
      const backfillInputs = readBookGraphInputs(project)
      if (Array.isArray(backfillInputs.merged?.cards) && Array.isArray(backfillInputs.merged?.edges)) {
        return reject(409, '这本书已经有知识点图了，不用再补')
      }
      const backfill = applyKnowledgeGraphBackfill({
        projectId: project,
        ledger: { updateMeta, appendEvent },
      })
      if (!backfill.ok) {
        // 失败＝图不落地（票 04 那一跳已经把这趟的两个键撤掉／一个字节都没写）⇒ 回一句人话。
        // 零源书那一档（形状闸的空扫守卫判 `cards-empty`）单独说清，别让用户对着「形状闸」猜。
        const codes = new Set((backfill.gate?.problems ?? []).map((problem) => problem?.code))
        if (codes.has('cards-empty')) {
          return reject(400, '这本书还没有可用的重点（一条知识点都没有）——图要有知识点才拼得出来。原来那些东西一个字没动。')
        }
        return reject(400, backfill.stage === 'gate'
          ? '拼出来的图没通过形状检查，没让它落到盘上。原来那些东西一个字没动。'
          : '这本书的文件里凑不出一张图（缺材料正文，或回不到原文那一行）。原来那些东西一个字没动。')
      }
      return accept({ project })
    }
    // ── 票 `reader-cognition-boundary-build/03`：读者情况问卷的往返通道（给出 → 手粘 → 落书夹）──
    // ⚠️ 这一对动作**不是闸门、不是放行条件**：给出/收回都不改 `meta`、不推进相位、不落账
    //    （回卷件自己就是证据；「回卷件在不在」不驱动任何流程，spec §6.2 H）。连「必须有一次表态」
    //    也不看——它是可选动作（老书那一档由 §3.9 的入口判据管，不在这里拦）。
    case 'reader-questionnaire-issue': {
      // 归属守卫：与目录里 `session-book` 的其余 48 个动作同一条（票 `deep-module-scan/12` 的闭包）。
      assertSessionOwned(project, sessionId)
      const questionnaireMeta = readMeta(project)
      if (questionnaireMeta === null) return reject(404, '项目不存在')
      // 合并件缺失／没有知识点 ⇒ 发不出卷（说清是哪一条，⛔ 不写半份空问卷）。
      const merged = readReaderQuestionnaireKnowledgeMap(project)
      if (merged === null) {
        return reject(409, '这本书还没有知识地图（合并件不在）——先等探查那一步把知识点挑出来，再来发问卷')
      }
      const { slices, degraded, note } = effectiveReaderSlices(merged)
      if (slices.length === 0) {
        return reject(409, '这本书的知识点还是空的——等探查挑出知识点之后才发得出问卷')
      }
      // 票 `rcb-build/05`：逐条那层的取条规则（合计 ≤30、按组轮转）要**轮转的轴**——它就是合并件里
      // 既有的分组顺序（`chapterSuggestion`）；没有任何分组时退化成按卡片顺序（`knowledgePoints`）。
      // ⚠️ 两样都只从**这一个合并件**现读（⛔ 不在动作层另算一份）。
      const { groups, cardOrder } = readerQuestionnaireOrdering(merged)
      const text = renderReaderQuestionnaire({ bookName: questionnaireMeta.name, slices, degraded, note, groups, cardOrder })
      writeWork(project, READER_QUESTIONNAIRE_ISSUED_FILE_NAME, text)
      // 「给出方式」＝写进书夹，交给**通用下载路由**（`/textbook/download`，书夹内任何文件都能下载；
      // 文件名会被硬编成 `<书名>.md`，正文首行的标题兜住可读性）。
      return accept({ file: READER_QUESTIONNAIRE_ISSUED_REL, degraded, note })
    }
    case 'reader-questionnaire-submit': {
      assertSessionOwned(project, sessionId)
      const submitMeta = readMeta(project)
      if (submitMeta === null) return reject(404, '项目不存在')
      // ── 票 `ui-display-redesign/11`：回卷载荷加 `answerer`（闭集、回卷时必填）────────────
      // 它是「这份是谁填的？」那一声：**此时才问**（发卷时不知道收卷人，不设系统默认）。
      // 形状是 B 类错误 ⇒ 裸 400 点名，⛔ 不落账、⛔ 不写半份回卷件、⛔ 不落半格 meta。
      const answerer = body.answerer
      if (!EXPLORE_CONFIRM_ANSWERERS.includes(answerer)) {
        return reject(400, `请先选「这份是谁填的」（${EXPLORE_CONFIRM_ANSWERERS.join('／')}）——缺了或不在这一档里的回卷不算收回来`)
      }
      // **原文逐字落盘**：⛔ 不 `trim()`、⛔ 不 `slice()` ——「回来那一份与粘的文本一致、长文本不截断」
      // 就是这一条通路存在的理由（现有 note 类字段是 `trim().slice(0,max)`，静默截断）。
      const raw = typeof body.text === 'string' ? body.text : ''
      if (raw.trim() === '') return reject(400, '请先把收卷人填好的内容粘进来（空文本不算收回来）')
      writeWork(project, READER_QUESTIONNAIRE_RETURNED_FILE_NAME, raw)
      // ── 票 11：收卷人的**唯一写点**（从 `explore-confirm` 挪来）─────────────────────────
      // `meta.answerer`＝谁填了这份问卷（闭集值已在上面验过）；`meta.answererAt`＝收到它的时刻——
      // 面板回执要印「谁填的＋时间」而回卷件正文**不许回写 header**（体例不动），所以时刻只能落在这里。
      // ⚠️ 回卷仍是**可选动作**：不推相位、不落账户流水、不是放行条件；它只是把两格事实记进书账本。
      const answererAt = new Date().toISOString()
      updateMeta(project, (meta) => {
        meta.answerer = answerer
        meta.answererAt = answererAt
      })
      // 回包给「落在哪 ＋ 多长 ＋ 这一次的收卷人/时刻」：不给正文（正文在盘上；下游读它走同一个文件）。
      return accept({ file: READER_QUESTIONNAIRE_RETURNED_REL, chars: raw.length, answerer, answererAt })
    }
  }
})
