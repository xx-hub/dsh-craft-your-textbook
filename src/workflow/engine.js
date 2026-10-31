/**
 * 造书工作台 · 领域引擎（六阶段状态机核心 + 共享工具）
 *
 * 从原 src/workflow.js 整体迁出（架构评审候选 3，2026-09-01 拆分）：
 * 状态机（runPhase1..6 / runLoop / kick / handoff 等）+ 账本/事件/fs/工作产物
 * 等共享 helper 的全部传递闭包。本模块自洽（只 import 外部库），
 * 供 ./workflow.js（Web 壳）与 ./workflow/actions/*.js（动作族）共同使用。
 *
 * 六阶段：Phase 1 材料准备 / Phase 2 源探查 / Phase 3 教学设计 /
 *   Phase 4 最佳范例章 / Phase 5 全章写作 / Phase 6 终检与交付。
 * 交办机制：meta.pendingStage 记账 + ctx.agents.get(sessionId).followup() 唤醒。
 * demo 模式（演示书）与真实并轨同一套 runPhaseX 路由器（无独立 auto 通道），
 * 唯一 seam = 内容来源：真实由主 AI 完成 / demo 由内置回放（generateContent）完成；
 * demo 与真实共用**同一套确认点**（＝机器停下来等人做决定的那一下；单位词与判据见 `CONTEXT.md` 的
 *   「确认点」词条）。⛔ **不在这里列这份清单、也不写这个数**：口径是「整本书的全部停机位」，
 *   逐站清单的唯一出处是 `.scratch/confirm-points-redesign/spec.md` §3 总表（抄第二份必漂）。
 *
 * ── 内部子模块（票 `depth-review-2026-10/10`，**拆分进行中**） ──────────────────
 * 本文件正按责任簇落成 `src/workflow/engine/*.js`，自己逐步瘦成只做再导出的 facade；
 * 消费者 import 一行不改（10 个生产消费者 163 个具名绑定全部是 `import { … } from` 具名导入，
 * 纯再导出对它们零影响）。已搬走的叶子都在依赖图最底层、导出面窄：
 *   · `engine/labels.js` 领域标签 / 豁免声明表 / 状态条提示文案（零内部依赖）
 *   · `engine/paths.js`  DSH home、项目根、注册表、每本书的账本与状态与过程记录路径
 *   · `engine/store.js`  状态缓存与落盘 ＋ ADR-0016 决策 2 那四个写入口
 * 后面还有 13 簇待搬（进程日志 / 播报 / 事件账本 / 快照 / 质量门 / 六阶段状态机 / 交办说明 …）。
 * 依赖图无环，按叶子先行逐簇切；**每一步只搬不撤**——撤那 16 个零生产引用导出是另一步、另开票。
 */

// 合并自双方（票 `context-budget/02` 第 1 层带进 manifestRowsFor/SPEC_ROW_BY_PATH/DISCLOSE_MODES/
// BOOK_PRODUCT_FAMILIES，票 `context-budget/12` 带进 finalAuditSummaryRel）——**并集**，两边都不删。
// ⚠️ 合并期解冲突（票 `pre-gold-build/02`）：`guessRoleFromName` 与 `ROLES` 两个名字随票 02 一起从本
// 文件退场——`role` 不再由文件名猜、也不在这里做 `ROLES` 收口（判定产物那份表自己就是唯一的规范面，
// 见 `materialRoleTable` 与本文件 `case 'explore'` 的注释）。`SYLLABUS_ROLE` **留着**：它只用于
// 「判出考纲 ⇒ 交办那句自动升完整版」的**试算**（票 03 的两段式），与老 `meta.sources[].role` 无关。
// ⚠️ 本 effort 票 `knowledge-graph-build/09` 再并进 `KNOWLEDGE_MAP_EXCLUSIONS_REL`（被剔除知识点
// 那一份集合的路径；覆盖闸门与 outline 交办读的是同一份）——**两支的改法都在、两边都不删**。
import { EVENT_META, EVENT_TYPES, gateHuman, stageLabelHuman, segmentHuman, CHAPTER_PROGRESS_REQUIREMENT, convertedState, chapterRel, chapterName, auditRel, auditName, chapterShardRel, okMaterialShards, okMaterialNumbers, readingRel, readingName, DETAIL_DIR_REL, knowledgeShardRel, knowledgeShardName, FINAL_AUDIT_SCOPES, finalAuditReportName, finalAuditReportRel, finalAuditSummaryRel, stageStateOf, manifestRowsFor, SPEC_ROW_BY_PATH, DISCLOSE_MODES, BOOK_PRODUCT_FAMILIES, PROPOSAL_DIR_REL, exploreDepthTier, CHAPTER_COUNT_POLICY_TEXT, SYLLABUS_ROLE, ACT_STAGES, MATERIAL_JUDGMENT_NAME, MATERIAL_SURVEY_HEAD_CHARS, materialJudgmentProblems, materialRoleTable, materialSurveyReadings, standingGate, KNOWLEDGE_MAP_EXCLUSIONS_REL, READER_QUESTIONNAIRE_RETURNED_REL, styleSpecMissingSections, residentDeclaration, bookDirIndex, countHanzi, chapterWordsFloor, normalizeKnowledgePointTitle, splitWaivedPoints as splitWaivedPointsOf } from '../domain-rules.js'
import { join, resolve, dirname, basename } from 'node:path'
import { mkdirSync, readFileSync, existsSync, writeFileSync, statSync, appendFileSync, readdirSync, copyFileSync, rmSync, unlinkSync, rmdirSync, renameSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { convertPdfBatch, readSettings, writeSettings, stripKnownExtension } from '../mineru-lib.js'
import { generateContent, readResource, RESOURCES_DIR, demoMaterialJudgment, demoChapterReviews, demoChapterOpinions, demoInterventions, demoStyleNotes, demoStyleDisposals, DEMO_INTERVENTION_IDS, demoKnowledgeShard, demoReading, demoMergedKnowledgeMap, demoGoals } from '../content-lib.js'
// 票 `demo-channel-full/10`：`textFieldRaw` 与那条具名上限是**字段词汇层**的单一出处
// （`actions/payload-fields.js` 是纯叶子，自己一个 import 都没有；`src/ui/knowledge-graph-map.js`
// 早已这样跨目录引它）——本条写入口要跟真书那一跳**同一个截断口径**，⛔ 不在这里另抄一份。
import { textFieldRaw, STYLE_NOTE_REVOKE_NOTE_MAX } from './actions/payload-fields.js'
import { CROSS_AUDIT_TEMPLATE_REL, CROSS_AUDIT_CONSTRAINTS, CROSS_AUDIT_REPORT_REL } from './cross-audit.js'
// 票 `demo-channel-full/08`：`finalReportPointer` 是 `meta.finalReport` 那一格的**唯一形状出口**——
// 真书（`actions/chapters.js` 的 final 交工）与演示书（本文件 `runPhase6` 的 demo 支）都从它取。
import { finalReportPointer, parseFinalAuditSummary, refreshFinalAuditSummary } from './final-audit-summary.js'
// 票 `demo-channel-full/05`：演示终检支写完那几件之后要重扫一次「实际有什么」那一份
// （登记只在动作漏斗那一层重扫，引擎内部推进不经过它）。
import { refreshArtifactRegistry } from './book-shape.js'
// 票 `knowledge-graph-build/09`：`outline` 交办读的「知识点 − 被剔除的」那一份集合——唯一读侧入口
// 住这个模块（覆盖闸门读的是同一份；spec §9 的「一处口径、三处读者」）。
// ⚠️ 票 `reader-cognition-boundary-build/07` 起本文件**不再直接读那个入口**：那一套现算（读数 ＋ 人话）
// 抽到 `workflow/reader-boundary.js` 一处，`outline` 与四份逐章派单共用它（⛔ 不各拼一份）。
import { readReaderBoundary, readerBoundarySentence, readerBoundaryStaleSentence } from './reader-boundary.js'
// 票 `chapter-skeleton/02`：站 7 交办里那一段「按图排序的起草建议」——排序本体住 `knowledge-order.js`
// （票 01 的唯一入口），⛔ 这里不自己写拓扑排序，也不把 `prereq` 判成章边界。
import { knowledgeOrderFromCoverage, orderReadingFieldsOf } from './knowledge-order.js'
// 票 `walkthrough-2026-10/02`：章正文由机器从分片拼——深改归档名单要认得**这一章盘上真有的分片**
// （只归档正文、把分片留在原地，重做那一路写的若是另一片，旧内容会被机器拼回正文里）。
import { chapterShardRelsOnDisk } from './chapter-assembly.js'
// 票 `walkthrough-fixes/36`：成品 `工作区/book.md` 的**唯一**拼装口径（纯函数）与「成品＝拼装件」
// 那一格判据都住在 `book-assembly.js`（与 `chapter-assembly.js` 同形：机器是成品的唯一写者）。
// ⚠️ 标题身份（`CHAPTER_HEADING_RE`／`headingKey`／`stripChapterTitleHeading`）随拼装契约一起搬过去，
// 本文件只 import ／ 再导出：`stripChapterTitleHeading` 仍在本文件导出面上（`actions/chapters.js` 的
// 调用点一个字没改），`headingKey` 仍是内部件（⛔ 不许进导出面）。
import { CHAPTER_HEADING_RE, headingKey, excludedTitlesInBook, judgeBookAssembly, refreshBook } from './book-assembly.js'
// 票 `exclusion-flow/03`（F3）：成品里「人已划掉的知识点」那一格的**活数**只从唯一读侧入口来
// （`readCoverageCollection().live`）——⛔ 本文件不自己 `JSON.parse` 那份件、也⛔ 不写第二套减法。
// ⚠️ 不成环：`knowledge-map-exclusions.js` 只 import `domain-rules`／`engine/paths.js`／
// `knowledge-graph-build.js`，它⛔ 不 import 本文件（下面 `readMergedMap` 那一段的注释同一条理由）。
import { readCoverageCollection } from './knowledge-map-exclusions.js'
// 票 `confirm-points-redesign-build/03`：站 6 拍板的章数（`工作区/决策/06.json` 的 `values.chapters`）
// ——outline 交办件那一句与 `actions/chapters.js` 那道硬闸读的是**同一份**读侧。
import { readDecisionChapterCount } from './decisions.js'
// 票 `premature-announce/01`：源探查那一套「盘上产物齐没齐」的判定只有一份，本文件是它的家
// （置态、放行、交工验货三处共用；模块只 import domain-rules，不成环）。
import { shardShapeProblems } from './knowledge-map-assembly.js'
// 票 `graph-read-one-answer/02`：「盘上那份合并件读出来是什么」全仓只有一个答案——
// 本文件原先那个私有手搓读者已删（连同它那行 `try`／`JSON.parse`），内容面直接问这一句。
// ⚠️ 不成环：`knowledge-graph-build.js` 只 import `domain-rules`／`engine/paths.js` 与三个图侧叶子，
//   ⛔ 它不 import 本文件（反向 import 才会成环；`readMergedMap` 自己的注释也钉着这一条）。
import { MERGED_MAP_NAME, readMergedMap } from './knowledge-graph-build.js'
// 票 `graph-write-order/01`：演示通道不再手写渲染合并件（那一行 `JSON.stringify`）——它与唯一渲染器
// 今天逐字同值，但那只是「恰巧对」；出口收成一处之后，「第二份缩进」不会再从这里长出来。
import { MERGED_MAP_OUTCOMES, landMergedMap } from './knowledge-map-landing.js'
import { artifactDataForStage, artifactDataForLabel, artifactDataForChapter } from './artifact-fields.js'
import { createHash } from 'node:crypto'
// 票 `walkthrough-fixes/19`②：并发上限的取值面单点在 `src/workbench-knobs.js`——交办件拼装
// 这一处只**读**，不在这里手抄第二份默认并发数。（票 `confirm-points-redesign-build/03` 把
// 篇幅档位那一半整块删了：建书不再问篇幅，交办件里也就不再有 `lengthPlan` 那一格。）
import {
  concurrencyDisciplineLine,
  readMaxConcurrentSubagents,
  DEFAULT_MAX_CONCURRENT_SUBAGENTS,
} from '../workbench-knobs.js'

// ── 内部子模块：三簇叶子从本文件搬出去，而下面的 export 块把它们的导出名原样再导出 ──
// ⇒ 10 个生产消费者的 163 个 import 绑定与全仓 11 处源码锚都照旧成立，一处都不用改。
// ⚠️ 票 `depth-round-3/01` 多了**第四簇** `engine/submission.js`（交工判据）：它的导出
//    **不列进**下面的 export 块——那两件（`submissionIndex`／`submitted`）是 engine 的内部接缝，
//    不是对外能力（`deep-module-scan/08` 收窄过导出面，别再把它撑回去）。
import { PROJECT_ID_RE, goldN, paragraphOpinion, paragraphReviewText, WAIVER_ITEMS, PHASE_LABELS, GATE_LABELS, STAGE_LABELS, stageLabel, EXPLORE_DONE_HINT, STATION_GOALS_DONE_HINT, STATION_VALUE_EDIT_HINT, FINAL_CHECK_DONE_HINT, finalCheckDoneHint, REPORT_WORDING_RULE } from './engine/labels.js'
import { dshHome, projectsRoot, registryPath, readRegistry, writeRegistry, registerProject, sessionWorkspace, sanitizeFolderName, freeBookDir, projectDir, timelinePath, metaPath, processLogPath, workDir, workFile, chapterArtifacts, detailDir, reportDir, proposalDir, processDir, archiveDir, materialDir, convertedDir, bookRelOnDisk, legacyDirConflicts } from './engine/paths.js'
// ⚠️ `writeMeta` **只进不出**：store.js 导出它（appendEvent 至今仍住在本文件，是账高与「最后动静
//   时刻」的唯一写入者，必须够得着它），但下面那个 export 块**不列**它——ADR-0016 决策 2 的两半。
//   防回潮断言（`key in engine`）见 test-ledger-seq-integrity.mjs。
import { assertSessionOwned, readMeta, flushMeta, updateMeta, createMeta, rollbackLedger, writeMeta } from './engine/store.js'
// 票 `depth-round-3/01`：**交工判据**那一簇（「这一步／这一章／合并／范例章交过工没有」）。
// ⚠️ 它只 import `./engine/labels.js`（叶子）＋ 零 I/O：⛔ 不 import 本文件（facade，会成环），
//   `readEvents` 留在本文件——四个判据自己读、把账本数组递进去。判据本体（四档语义表）在那边，
//   本文件只做调用者。
import { submissionIndex, submitted } from './engine/submission.js'
// 票 `stage-state-facts/01`：环节状态的**四项事实**从哪来——章级那条路先搬进子模块 5/5。
// ⚠️ 本文件仍调 `stageStateOf`（判档入口不搬），只把四个入参的来源交出去。
import { chapterFacts, chapterAuditReading, rowFacts, stepFacts } from './engine/stage-facts.js'
// 票 `confirm-points-redesign-build/01`：结论件那一族的**读侧与那句三行指针**。
// ⚠️ 它只 import `domain-rules` 与 `./engine/paths.js`（叶子），⛔ 不 import 本文件 ⇒ 不成环。
import { DECISION_DIR_NAME, DECISION_DIR_REL, HUMAN_ACTION_MARKER, STATION_OF_GATE, STATION_EXPLORE, readStationDecision, recordStationDecision, segmentDecisionRels, stationPointer } from './decision-record.js'
// 票 `rcb-build/04`：站 2 那一次表态的**身份读数**（现算）——「进 brief＝渲染进正文」那一半：
// 站 3 的交办正文里要如实说清这一版读者边界是不是**有人确认过**（没人动过 ⇒「本次按 AI 先验执行」）。
// ⚠️ 与界面用的是**同一份现算函数与同一句自述**（⛔ 不在这里手抄第二份中文）。
// 票 `ui-display-redesign/11`：出口闭集收窄成两条（`ai-draft` 退役）；收卷人从 `meta.answerer` 读
// （写点已挪到回卷动作），闭集从契约那一处取（⛔ 不手抄「本人／监护人／老师」）。
import { EXPLORE_CONFIRM_ANSWERERS, EXPLORE_CONFIRM_EXITS, EXPLORE_CONFIRM_AI_PRIOR_STATEMENT, EXPLORE_CONFIRM_STANCE_KINDS, exploreConfirmStance } from '../explore-confirm-contract.js'
// 票 `rcb-build/06`：站 3 的交办正文里那条**代笔教学**要读一下回卷件在不在盘上
// （有件才教——没件时那一句是假指令）。读侧只有那一处出口，⛔ 不在这里另拼路径。
// 票 11：按「谁填的」追加的那三档策略句也住那一处（同一份文件、单一出处）。
// ⚠️ 它只 import `domain-rules` 与 `./engine/paths.js`（叶子）⇒ 不成环。
import { readerAnswererBriefClause, readerQuestionnaireReturnText } from './reader-questionnaire.js'
// 票 `confirm-points-redesign-build/05`：站 3 的正文（`工作区/目标-vM.md`）——名字、版本规则、
// 渲染与读回**只有一处**（本文件与 `actions/chapters.js`／判据都从那里取，⛔ 不各拼一份）。
import { goalDocName, goalDocVersionOnDisk, nextGoalDocVersion, writeGoalDoc } from './goal-doc.js'


/** 阶段事件的人读阶段名：`data.label` 是 PHASES 的 canonical 全称（**机器身份词**，账本里就这么
 *  存着，不改），出口处过一遍界面词翻译；旧账本没带 label 时按 phase 号回落到 canonical 全称再译。
 *  译不出来原样显示（宁可露出机器词，也不猜）。 */
function phaseEventHuman(data) {
  const raw = data.label ?? PHASE_LABELS[data.phase] ?? data.phase ?? ''
  return stageLabelHuman(raw)
}


/** 暂停那一笔的附注：这次暂停**停掉了几条编排脚本**（票 `chapter-audit-orchestration/04`）。
 *
 *  措辞纪律：说词表登记的「编排脚本」，一个字都不许出现机器词「job」——「job」不在
 *  `test-wording-fixtures.mjs` 的 `BANNED_WORDS` 里（**机器抓不到**），靠人守；
 *  「子代理 / subagent」同样不许（`CONTEXT.md`「小助手」的 `_Avoid_`，机器也抓不到）。
 *
 *  为什么只有 `jobsStopped > 0` 才开口：`0` 与 `null` 各有各的实话（「确实没有在跑的」与
 *  「这一个数读不出来」），把它们翻成一句「停了 0 条」既没用、又会把「读不出来」洗成「没有」——
 *  与 `countRunningSubagents` 不肯把缺席折成 0 是同一条纪律。
 *
 *  取值域：`jobsStopped` 是正整数或 `null`（`stopRunningWorkflowJobs` 的返回值），
 *  非正整数/非整数一律当作「没有这件事实」不开口。
 */
function stoppedOrchestrationNote(data) {
  const stopped = data?.jobsStopped
  if (!Number.isSafeInteger(stopped) || stopped <= 0) return ''
  return `；这本书正在跑的编排脚本也停了（${stopped} 条）`
}


/**
 * 转换进度那一型（`textbook/mineru-progress`）里**不值得记的中间进度**（票 `pre-gold-build/14` 的节流表）。
 *
 * 为什么需要一张表：这一型的落账点在 `runPhase1` 的 `convertPdfBatch(…, onStage)` 回调里
 * （`src/mineru-lib.js` 逐处 `onStage(…)`），**一条转换要落好几轮**——`转换中（d/M 份完成）`
 * 每轮轮询（默认 5 秒）一条、`上传材料（i/N 份）`／`下载结果（X）`／`解压整理（X）` 每份材料一条。
 * 逐条搬进人读的《过程记录.md》就是刷屏，所以这里只滤掉**同一份／同一轮的中间进度**：
 * 批次级的里程碑（`申请上传通道（…）`／`完成`）与逐份的**异常**（拆分通知、`MinerU 收不了`）照旧记。
 *
 * ⚠️ **这张表的枚举面比现实窄在哪里**：它逐条对着**今天** `src/mineru-lib.js` 里那四个
 * 「逐份／逐轮」的 `onStage` 形状（取样：`Select-String -Path src\mineru-lib.js -Pattern 'onStage\('`），
 * 而采取的是**抑制表（黑名单）不是白名单**——将来 `mineru-lib` 新加一个 stage 文本，它**默认会被记下**
 * （宁可多记一条，不静默丢一条）；反过来说，真新加了一条同样是心跳的形状，它会先被多记，直到补进这张表。
 */
const MINERU_PROGRESS_HEARTBEATS = [
  /^转换中（/, // 每轮轮询一条（`mineru-lib.js` 的 240 轮循环里）
  /^上传材料（/, // 每份材料一条
  /^下载结果（/, // 每份材料一条
  /^解压整理（/, // 每份材料一条
]

/** 事件 → 人读的过程记录条目（返回 null 表示不值得记，如转换中间进度）。 */
function logEntryText(event) {
  const data = event.data ?? {}
  switch (event.type) {
    case 'textbook/phase-start': return `🏁 阶段开始：${phaseEventHuman(data)}`
    case 'textbook/phase-end': return `✅ 阶段完成：${phaseEventHuman(data)}`
    case 'textbook/agent-start': return `🤖 AI 开始：${stageLabelHuman(data.label)}`
    case 'textbook/agent-end': return `🤖 AI 完成：${stageLabelHuman(data.label)}`
    case 'textbook/gate-proposal':
      // ⚠️ 不印「工作区/方案/关卡N-vX.md」：文件名与产物路径是**机器身份词**（判定线不改，锚定它的正则
      // 见 domain-rules 的提案白名单），印到人读文本里就把「关卡」带出来了。指个真实去处即可。
      return `📋 ${gateHuman(data.gate)} · 方案 v${data.version}：${data.title ?? ''}\n\n${data.summary ?? ''}\n\n（完整方案在书夹的「提案」文件夹里）`
    case 'textbook/gate-decision':
      return data.approved === true
        ? `✅ 第 ${data.gate} 次拍板通过（v${data.version}）${data.note ? `\n\n用户备注：${data.note}` : ''}`
        : `❌ 第 ${data.gate} 次拍板驳回（v${data.version}）${(data.reasons ?? []).length > 0 ? `\n\n驳回理由：${data.reasons.join('、')}` : ''}${data.note ? `\n\n用户意见：${data.note}` : ''}`
    // ⚠️ 票 `pre-gold-build/02`：这一行去掉括号那半句（`（角色）`）——上传那一刻**还没有**角色，
    // 角色由探查段开头那一趟书级材料判定产出。老账本里那些带角色的事件行是**历史**，照旧不再改写。
    case 'textbook/source-added': return `📎 已上传材料：${data.file ?? ''}`
    // 票 `pre-gold-build/14`（债-02）：转换期这一面原先**一律 `return null`**，于是转换期间
    // 人读的《过程记录.md》整段静默（账本与界面两面照旧有读数，别混着说）。
    // ⚠️ **只动这一个出口**：`announceText` 照旧不开口（`EVENT_META` 的 `announce: false` 是账本面的决定，
    // 票面「账本那一面一个字不动」）；那条事件的**落账频率也一个字不改**——节流只在本函数内判别，
    // 不新造计数器（纯函数，只看这一条事件自己的 `data.stage`）。
    case 'textbook/mineru-progress': {
      const stage = typeof data.stage === 'string' ? data.stage : ''
      // 老账本／夹具里那种没有 `stage` 的形状（`{ file, done, total }`）无话可说，照旧不记。
      if (stage === '') return null
      if (MINERU_PROGRESS_HEARTBEATS.some((re) => re.test(stage))) return null
      return `📄 材料转换：${stage}`
    }
    case 'textbook/rollback': {
      // 票 `flow-audit-2026-10/06`：人读那一行要说清「从哪段退到哪段、归档了几件、谁点的」。
      const from = data.from?.phase
      const to = data.to?.phase
      const where = from === null || from === undefined || to === null || to === undefined
        ? ''
        : `（从阶段 ${from} 退到阶段 ${to}）`
      const files = Array.isArray(data.archivedFiles) && data.archivedFiles.length > 0
        ? `，归档 ${data.archivedFiles.length} 件：${data.archivedFiles.slice(0, 5).join('、')}${data.archivedFiles.length > 5 ? '…' : ''}`
        : (Number.isFinite(data.archived) && data.archived > 0 ? `，归档 ${data.archived} 件` : '')
      const by = data.by === 'human' ? '（你点的）' : data.by === 'agent' ? '（AI 点的）' : ''
      const why = typeof data.note === 'string' && data.note.trim() !== '' ? `；理由：${data.note.trim()}` : ''
      return `⏪ 回退到快照 ${data.snapshot ?? ''}${where}${files}${by}${why}`
    }
    case 'textbook/hint': return `💡 ${data.text ?? ''}`
    // 票 `dsh-contract-drift/09`：提问卡结算了、可这次答案**读不到、没记上**——账上要留下
    // 「需要重新问用户」这一句（协调员每轮读工作记录，重问不需要新功能）。
    // ⚠️ 这一型 `announce: false`：不替协调员在对话流里喊，但**必须开口**（`SILENT_BOTH` 空表）。
    //
    // 措辞只有一份出处：`questionUnrecordedText()`。`handleQuestion` 落账时把它的结果**录进**
    // `data.text`（与 `textbook/hint` 同一栏约定：录下来的那句话是账本的事实），本行**原样印它**
    // ——于是老账本永远印它自己那一天的那句话，⛔ 不会被今天的模板悄悄改写（收口 review 的
    // 规范轴就是拿这一点戳的：写时烘焙 ＋ 读时重算 = 同一笔账两个版本）。
    // 只有**没带** `text` 的账（本型落地前的手写事件／夹具）才现场拼一次；那条路仍走同一个
    // 函数，所以「唯一措辞出处」在两条路上都成立，而不是一句自称。
    case 'textbook/question-unrecorded': {
      const recorded = typeof data.text === 'string' ? data.text.trim() : ''
      return recorded !== '' ? data.text : questionUnrecordedText(data.question)
    }
    case 'textbook/error': return `⚠️ 出错（${stageLabelHuman(data.task)}）\n\n${data.message ?? ''}`
    case 'textbook/quality': {
      const checks = data.checks ?? []
      const pass = checks.filter((check) => check.ok === true).length
      return `🛡️ 最后检查：${pass}/${checks.length} 项通过`
    }
    case 'textbook/delivery': return '🎉 交付完成'
    case 'textbook/stage-start': return `🎯 交给 AI 动手：${stageLabelHuman(data.label ?? data.stage ?? '')}`
    case 'textbook/progress': return `⏳ ${data.label ?? ''}${data.detail ? `：${data.detail}` : ''}`
    case 'textbook/review': return `👀 抽查意见（第 ${data.chapter ?? '?'} 章《${data.title ?? ''}》）：${data.comment ?? ''}`
    case 'textbook/ai-report': return `🛡️ AI 检查报告：${data.report ?? ''}`
    case 'textbook/style-note': {
      const note = data.styleNote ?? {}
      return `🎨 风格线${data.revoked === true ? '收回' : '新增'}：${note.text ?? ''}${note.status === 'superseded' ? '（已收回）' : ''}`
    }
    // 票 `walkthrough-fixes/21`（2026-10-06 裁决「甲」）：原句「📮 留言稍后处理：」是一句**时机承诺**，
    // 与机器行为相反（§11.2 硬触发：铺章途中到达的意见**当轮**就转达给正在写那一章的小助手）。
    // 这里只说**这一刻的可见事实**——留言记下了、内容是什么；「什么时候被读到」由界面那两态说。
    case 'textbook/intervention': return `📮 已记下留言：${data.text ?? ''}`
    case 'textbook/intervention-done': return `📮 留言已处理：${data.text ?? ''}`
    case 'textbook/waiver': return `赦 ✅ 已获用户豁免「${WAIVER_ITEMS[data.item]?.label ?? data.item}」：${data.userNote ?? ''}`
    case 'textbook/waiver-revoke': return `赦 ↩️ 豁免已收回「${WAIVER_ITEMS[data.item]?.label ?? data.item}」，机器恢复拦截`
    case 'textbook/pause': return `⏸ 已暂停（${data.reason ?? '用户在造书工作台点击暂停'}）${stoppedOrchestrationNote(data)}`
    case 'textbook/resume': return `▶ 已继续`
    case 'textbook/outline-decision':
      return data.approved === true
        ? `✅ 章节安排已通过${data.note ? `\n\n用户备注：${data.note}` : ''}`
        : `↩️ 章节安排已驳回${data.note ? `\n\n用户意见：${data.note}` : ''}`
    case 'textbook/gold-opinion': {
      // 票 09（走查 P26）：撤回那一支**先于**取 opinion 返回——`data.revoked === true` 的事件
      // 没有 `opinion` 字段，硬往下走会渲染成「#undefined（笼统）undefined」那行乱码。
      if (data.revoked === true) {
        return `↩️ 已撤回${Number.isSafeInteger(data.chapter) ? `第 ${data.chapter} 章` : ''}的一条意见：AI 不再照它改，也不再拦这一章交工`
      }
      const o = data.opinion ?? {}
      const verbs = { dislike: '不喜欢', drop: '不需要', change: '要改成' }
      const wish = typeof o.wish === 'string' && o.wish !== '' ? `：${o.wish}` : ''
      // 票 07（P25）：这一行原本读 `o.seq`（＝`data.opinion.seq`），而**意见的编号不在那里**——
      // 落账时它在事件 `data` 的顶层（`workflow/actions/gold.js` 写的是 `{ seq, opinion:{ id, at, target, kind, wish, status } }`），
      // 条目自身的 id 则嵌在 `data.opinion.id`。两处路径都取不到值，于是《过程记录.md》与右栏
      // 那个「过程记录」面板**同一处**印出 `✍️ 最佳范例章意见#undefined`（一处字段写错、两个出口一起错
      // ——它们共用本函数）。改成按「顶层编号 → 条目 id」的次序取，取不到就不印编号（不拿 undefined 上屏）。
      const no = data.seq ?? o.id
      return `✍️ 最佳范例章意见${no === undefined || no === null || no === '' ? '' : `#${no}`}（${o.target ?? '笼统'}）${verbs[o.kind] ?? o.kind}${wish}`
    }
    case 'textbook/gold-seal': return `🏆 最佳范例章已定稿（v${data.version ?? '?'}），意见沉淀入风格线（${data.count ?? 0} 条）`
    case 'textbook/gold-chapter':
      return `👑 最佳范例章：第 ${data.chapter ?? '?'} 章${data.reason ? `\n\n选择理由：${data.reason}` : ''}`
    case 'textbook/chapters-review':
      return `🔍 章节过目确认（${data.approved === true ? '通过' : '驳回'}）`
    case 'textbook/final-approve':
      return data.approved === true
        ? `✅ 最后检查通过，交付完成`
        : `↩️ 最后检查未获认可，交办修订${data.note ? `\n\n改进意见：${data.note}` : ''}`
    case 'textbook/deep-modify':
      // `data.segment` 是**机器身份词**（`gate-1` / `explore` / `chapter-03` 这类 seg.key，账本里就这么存的，
      // 不改）；但这一行是写进《过程记录.md》给人读的（判定线②），所以过一遍界面词翻译
      // （2026-09-20 复审 a-4：原先直接把 seg.key 印到人读流水账里）。译不出来原样显示。
      return `✏️ 定点修改「${segmentHuman(data.segment)}」并重做下游${data.note ? `\n\n用户说明：${data.note}` : ''}`
    case 'textbook/deep-undo':
      return `↩️ 撤销定点修改「${segmentHuman(data.segment)}」`
    case 'textbook/pattern-added':
      return `📇 已加自定义模式：${data.name ?? ''}`
    // 交工/提审被拒（票 01 (d)）：写进《过程记录.md》的那一行——`stage` 与原因都在事件 data 里，
    // 人读文本说「交工被拒：<原因>」。
    //
    // ⚠️ **`logEntryText` 这一个出口不印阶段**（票 `audit-matrix-contract/06`，2026-09-29 用户拍板
    // 选 ②；这条注释就是票面要求的「四个出口逐个点名、各有理由」里 engine 侧那一处的落笔）。
    // **不印的理由**：这一行是**已经发生的事**的流水记录，阶段从「事件属于哪一步」已经能由上一条
    // `textbook/stage-start` 读出来；在这里再印一次等于同一屏/同一份文件里把同一件事说两遍。
    // 而**尚未解决的**那一条（用户此刻要知道「我这次交工卡在合并还是最后检查」）由界面事件行的
    // **展开详情**那一格承担（`src/ui/event-cards.js` 的 `replayRowDetail`，印人话词）。
    // 与上面 `announceText` 是两处**同理由、不同对象**（一份是文件流水、一份是对话播报）。
    case 'textbook/submit-rejected': return `🚫 交工被拒：${data.reason ?? ''}`
    // 票 12 · ①：《过程记录.md》那一行（事后翻账的人看的）。措辞与对话播报**共用**下面那一份
    // `styleSpecChangeWhen`——两处各写一遍就是「一处改、另一处漏」。
    case 'textbook/style-spec-change':
      return `📝 写作规范在范例章定稿后被改过：${styleSpecChangeWhen(data)}`
    default: return null
  }
}


/**
 * 「这一次提问没记上」那句话的**唯一出处**（票 `dsh-contract-drift/09`）。
 *
 * 两处用它，但**不是**同一形状（收口 review 的规范轴把原先那句「与 styleSpecChangeWhen
 * 那条先例一样、两处共用一份」戳穿了：那条先例的两处都是**读时渲染**）：
 * - `handleQuestion` 在**落账那一刻**调它，把结果录进 `data.text`（账本的事实）；
 * - `logEntryText` **读**那笔账时优先原样印 `data.text`，只有没带这一栏的才现场调它。
 * ⇒ 两个落点都只有这一份措辞，且老账本印的是它自己那一天的话，⛔ 不会被模板改写。
 *
 * **两句话是这条账的判据**（原票口径）：「没有记上」说清这一次不是一次作答，
 * 「需要重新问用户」是给协调员的**下一步**（它每轮读工作记录，读到就会重问）。
 * 问的是什么照实带上；连问都读不到时**照实说读不到**，不编一个空问句。
 *
 * ⚠️ 落账点已经过一遍 `asked`（`src/workflow.js` 的 `handleQuestion`），这里仍自己滤一次：
 * 这条函数连着「没带 `data.text` 的老账本／夹具」那条路，⛔ 不假设调用方一定先滤过
 * （多滤一遍同一谓词是**有意**的冗余，别当重复代码删掉）。
 *
 * @param {unknown} question 落账时 `data.question` 那一串（服务端从 `questions` 抽出的问句）
 */
function questionUnrecordedText(question) {
  const asked = Array.isArray(question)
    ? question.filter((text) => typeof text === 'string' && text.trim() !== '')
    : []
  const what = asked.length === 0
    ? '这次问的内容也读不到'
    : `问的是「${asked.join('；').slice(0, 60)}」`
  return `⚠️ 有一次提问没有记上：${what}，需要重新问用户`
}


/**
 * 「写作规范变更」那一笔要说清的两件事（**两个出口共用这一份**，不各写一遍）：
 * **哪一版变了**（指纹）与**此刻已经写了多少章**（不一致的波及面）。
 * 读不出指纹就说「读不到」——**读不出不是「没变」**（那会让真被改过的人以为自己没问题）。
 */
function styleSpecChangeWhen(data) {
  const from = typeof data?.from === 'string' && data.from !== '' ? data.from : '读不到'
  const to = typeof data?.to === 'string' && data.to !== '' ? data.to : '读不到（文件已不在）'
  const n = Number.isSafeInteger(data?.chapters) ? data.chapters : null
  const written = n === null ? '' : `，此刻已写 ${n} 章`
  return `改动前 ${from} → 改动后 ${to}${written}`
}


/**
 * 一条「工作台提示」消息（`CONTEXT.md` 词条：机器以 plugin+notice 注入对话流，**不冒充用户说话**）。
 *
 * **纯函数：只造出消息，不发。** 三个出口（`agent.followup` / `agent.inject` / `session.append`）
 * 各自有**正交的活锁规则**（见 `announceToSession` 上方那段：`status === 'running'` 走 inject、
 * 只有 idle 才 append、读不到就 warn 并放弃），合并不划算 ⇒ **策略留在调用方，只抽形状**。
 *
 * ⚠️ 票 `deep-module-scan/09`：这 4 条路径原先**各自手搓一遍**逐字相同的形状
 * （`announceToSession` / `wakeMainAI` / `nudge` / `resume`），而写错的代价**不是一次报错**——
 * `announceToSession` 上方那段注释记着 2026-09-23 的真机事故：**畸形历史一旦落盘，之后每个请求都 400，
 * 压缩也救不回来**。⇒ 同一份知识有四条传播路径，一处写错要改四处。
 *
 * ⚠️ **`source.kind` 必须是 v4 的 producer-owned 形状** `{kind: 'plugin:<名字>', form, summary}`——
 * `{ kind: 'plugin', plugin: '…' }` 那个 v3 包装已被宿主 0.1.7 的会话准入门**明确退役**
 * （`dsh-session-format-v3-to-v4 source()`：`kind === 'plugin'` 直接抛
 * `format v4 message requires a producer-owned source kind`，整轮判失败）。完整口径见
 * `announceToSession` 上方注释（那里讲得更细，**别删那段**，它记的是那次事故与宿主改写口径）。
 *
 * ⚠️ **文案一个字都不在这里**：`text` 与 `summary` 由调用方给。唤醒文案的措辞有逐字断言
 * （`test-startup-recovery.mjs:286-292`），改文案是另一件事。
 *
 * @param {{ idPrefix: string, text: string, summary: string }} parts
 * @returns {{ id: string, role: 'user', content: Array<{type: 'text', text: string}>, source: object }}
 */
function noticeMessage({ idPrefix, text, summary }) {
  return {
    // id 要唯一：同一毫秒里可能发两条（前缀不同），所以后缀带随机尾巴。
    // ⚠️ `nudge` / `resume` 原先**只有 base36 时间戳、没有随机尾巴**——统一后多了这一段，
    //   那只让它更不会撞（id 撞了宿主会当重复消息），不改变任何可观察行为。
    id: `${idPrefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    role: 'user',
    // content 恰好一个 text 块（第二个块会被宿主格式准入门拒）。
    content: [{ type: 'text', text }],
    source: { kind: 'plugin:dsh-craft-your-textbook', form: 'notice', summary },
  }
}


/**
 * 该豁免项当前是否有效（真实模式 ＋ `userNote` 非空 ＋ **作用域对得上**才算数）。
 *
 * ── 票 `walkthrough-fixes/23`（2026-10-06 裁决）：豁免记录必须带作用域 ─────────────────────
 * 病：记录里只有 `item`，读取面只按 `item` 相等 ＋ `userNote` 非空。于是「用户点的那一条」与
 * 「被放行的那一条」可以不是同一条：`other` 一次同时放行 `runQualityChecks` 的 8 条 ＋ 交工侧 2 处，
 * 交付面那句「你已同意：以你的说明为准」**看不出放行了什么**。
 *
 * 作用域三件（写入面 `workflow/actions/collab-signals.js` 的 `waive` 是唯一写入点）：
 *   · `check`   —— **哪一条检查**。`other` 时是**被放行检查项自己的名字**（交付面逐字显示的那一个）；
 *                  其余豁免项时是豁免项 id 本身（那一项就是它放行的那条检查）。**不给它编统一命名空间**
 *                  ——两族的身份来源本来就不同，编一份映射就是第二份词表（本票明令不许扩的那一样）。
 *   · `book`    —— **哪本书**（`projectId`；记录就住在那本书自己的 `meta` 里，这一格是防串用的显式核对）。
 *   · `chapter` —— **哪一章**（1 基）。`null` ＝ **全书/不限**（不适用就写 null，**不写假章号**）。
 *
 * 匹配口径：
 *   · 记录**没有作用域**（`null`/不是对象）⇒ **一律不放行**。`other` 那条老形状（一票放行整族）
 *     正是本裁决要收掉的东西，所以这是 fail-closed 的：升级后盘上已有的老记录要**按新形状重点一次名**
 *     （代价＝多一次点名，是应该付的；`docs/协作模型.md` §2.3 豁免行记着这一条）。
 *   · `check` 按**逐字相等**比：点名写错 ⇒ 什么也没放行（交付面照旧显示那一条没过，不会静默放行）。
 *   · 读取点传 `chapter: null` ＝ 「这一格问的是整本」⇒ 只认 `chapter: null`（全书）的记录；
 *     传章号 N ⇒ 认「全书」或「正好第 N 章」。
 *   · `other` 的读取点**必须点名**：传不进 `check` 就返回 false——「单条误报必须点得到那一条」。
 *
 * ⚠️ **枚举面比现实窄在哪里**：作用域能表达的是「一条检查 × 一本书 × 一章」，而现实里一次误判
 * 可能同时落在**多条**检查上（如一本书既缺板块又重名）——那要**逐条**各点一次名（本裁决要的正是
 * 这个：用户不能再一键关掉整族判据）。另：今天只有交工侧的「练习与答案齐全」那一处**按章**读
 * （`chapters.js` 的单章验货），整书那一族读的都是「全书」；`chapter` 因此不是装饰——它真的进判定。
 *
 * @param {string} projectId 书 id（＝作用域里的 `book`）
 * @param {string} item 豁免项（`WAIVER_ITEMS` 的键）
 * @param {{check?: string, chapter?: number|null}} [scope] 这次**读的是哪一条、哪一章**；
 *   `other` 必须给 `check`。
 * @returns {boolean}
 */
function waived(projectId, item, scope) {
  const meta = readMeta(projectId)
  if (meta === null || meta.demo === true) return false
  const wantCheck = scope === undefined ? undefined : scope.check
  const wantChapter = scope === undefined ? undefined : scope.chapter
  if (item === 'other' && (typeof wantCheck !== 'string' || wantCheck === '')) return false
  return (meta.waivers ?? []).some((w) => {
    if (w.item !== item) return false
    if (typeof w.userNote !== 'string' || w.userNote.trim() === '') return false
    const s = w.scope
    if (s === null || typeof s !== 'object') return false
    if (s.book !== projectId) return false
    if (typeof wantCheck === 'string' && wantCheck !== '' && s.check !== wantCheck) return false
    if (wantChapter === null) {
      if (s.chapter !== null) return false
    } else if (Number.isSafeInteger(wantChapter) && s.chapter !== null && s.chapter !== wantChapter) return false
    return true
  })
}


/**
 * `other` 豁免的**读取点**（票 `walkthrough-fixes/23`）：点名它放行的是**哪一条检查项**。
 * ⚠️ 全仓读 `other` 只许走这里（`test-gate-write-points.mjs` 按「每个 `other` 读取点都点名」钉着）：
 * 直接写 `waived(projectId, 'other')` 会当场判红——那是「一票放行整族」的旧形状。
 */
function otherWaiverFor(projectId, checkName, chapter = null) {
  return waived(projectId, 'other', { check: checkName, chapter })
}


/**
 * **逐点豁免**的读取口（票 `kn-unowned-silent/02`，维护者 2026-10-27 裁决「按推荐」）。
 *
 * ── 它治的病 ───────────────────────────────────────────────────────────────────
 * 单章知识点撞上 20 条上限时，旧实现 `slice(0, 20)` **静默丢掉**多出来的几条，只在
 * `machineEdits` 里记一笔；而那条「允许暂不带章节归属」的裁决是**书级一刀切**的豁免记录
 * （`scope.chapter: null`，`userNote` 里用散文写 5 个点）——读取面只按 `item` ＋ `userNote`
 * 非空放行，于是**哪几个点被放弃**机器一件都不知道，覆盖闸门照样报绿（真书 143 承诺 / 138 实写）。
 *
 * ── 它只做读盘，判据本体不在这里 ───────────────────────────────────────────────
 * 把一组点按「豁免里**点名放弃**的」与「没点名的」分开，判据本体住
 * `domain-rules.splitWaivedPoints`——界面卡片读**同一个**纯函数，⛔ 这里不另写一遍过滤
 * （两份必然漂，而漂了没人看得见）。三处覆盖判据（`outline` 交工的未认领点、单章缺覆盖、
 * 单章写进已划掉的点）与单章上限那一步都走这一个函数。
 *
 * 一条记录要算数，三件缺一不可：`item === 'other'` ＋ `userNote` 非空（放行必要条件不变）、
 * `scope{book, check}` 逐字对上（票 `walkthrough-fixes/23` 的作用域口径一个字没放宽）、
 * `waivedPoints[]` **逐条点名**。⛔ **没有 `waivedPoints` 的记录一条点也放行不了**——这正是
 * 「书级一刀切 true」被删掉的那一半：老记录（只有散文）在覆盖闸门前**自动失效**，代价与票 23
 * 同形（重交时要按点重点一次名；真书那一条的迁移见 `scripts/waiver-points-migrate.mjs`）。
 *
 * @param {string} projectId 书 id
 * @param {string} checkName 被放行的检查项自己的名字（与 `check.name` 逐字相等）
 * @param {unknown[]} titles 待分类的点（原样写法）
 * @param {number} [chapter] 问的是哪一章：给了章号 ⇒ 只认「全书」或「正好这一章」的记录；
 *   **不给**（`undefined`）⇒ 这本书上该检查的全部记录都算——「放弃一个点」是书级事实，
 *   而 `scope.chapter` 只决定这条记录在哪一章的**上限**那一步减负。
 * @returns {{waived: string[], kept: string[]}} 两个数组都保留**原样写法、原顺序**
 */
function splitWaivedPoints(projectId, checkName, titles, chapter = undefined) {
  const meta = readMeta(projectId)
  if (meta === null || meta.demo === true) {
    return { waived: [], kept: (Array.isArray(titles) ? titles : []).map((t) => String(t ?? '').trim()).filter((t) => t !== '') }
  }
  const scope = chapter === undefined
    ? { book: projectId, check: checkName }
    : { book: projectId, check: checkName, chapter }
  return splitWaivedPointsOf(meta.waivers, scope, titles)
}



/** 「其他」放行时交付面那句话的抬头（既有措辞的根部；既有断言按 `/你已同意/` 认它）。 */
const OTHER_WAIVER_LEAD = '你已同意：以你的说明为准'


/** 「其他」放行时的交付面措辞：**逐字点名实际放行的那一条检查项**（票 `walkthrough-fixes/23`）。
 *  名字**总是**从被放行检查自己（`check.name`）来，所以它不可能点到别的检查上去。 */
function otherWaiverNote(checkName, detail) {
  return `${OTHER_WAIVER_LEAD}——放行「${checkName}」${detail === '' ? '' : `（${detail}）`}`
}


/**
 * 该关卡是否被用户**跳过**（票 `walkthrough-fixes/19`③）。
 *
 * ⚠️ **与 `waived()` 不是同一条通路**（裁决的红线）：`waived()` 读 `meta.waivers`，那四类
 * （`gate-skip` / `audit-skip` / `progress-skip` / `other`）是**取消该检查**；这里读
 * `meta.skippedSteps`，跳过是**把验货推迟并记账**（第三态「已跳过（未验）」）。
 * 两者的存储、写入点、下游读法全都不同——⛔ 不许把跳过实现成第五个豁免项。
 *
 * ⚠️ 跳过**不表示这一关验过了**：它只是「不再在这儿等人」。所以调用方读到 `true` 时，
 * 该做的事是**继续往下走**，而**不是**把这一关记成 `approved`／`passed`。
 *
 * @param {string} projectId
 * @param {string} step 关卡身份（今天只有 `gate-N` 这一族，见 `src/workflow/actions/gates.js`）
 * @returns {boolean}
 */
function stepSkipped(projectId, step) {
  const meta = readMeta(projectId)
  return (meta?.skippedSteps ?? []).some((s) => s?.step === step)
}


/**
 * 拍板**被驳回**那一刻的对话流播报句（**唯一出口**；`announceText` 的 `gate-decision` 那一支调它）。
 *
 * ── 票 `demo-channel-full/22` 的病（第一件活是**真读数**，不是静态推断）─────────────────
 * 原句尾部说「**AI 正在修订**」。**演示书**上那是一件不会发生的事：演示通道**零 LLM**，驳回之后
 * 真出现的那一版 v2 是**引擎自己的演示回放**写的（`demoGateProposal()` 只吃 `{gate, version}`，
 * 连 `note` 都不读——票 21 的读数①），没有任何 AI 参与。
 *
 * ── ⚠️ 它到哪儿（逐条读数，出处见票 22 的 `## Answer`）───────────────────────────
 *  · **工作站九帧**：`node scripts/gallery.mjs read --screens=demo-phase-1,…` ＋ 同一台画廊页上读
 *    `document.body.innerText` ⇒ 九帧里「AI 正在修订」**零命中**；
 *  · **交互取样**（真引擎 ＋ 真界面走一遍演示书，点「❌ 驳回，提意见」→「提交驳回」）：18 秒窗口里
 *    工作台 DOM **零命中**；回放列表那些行逐字是它自己那份措辞；`过程记录.md` 里那一行是
 *    「❌ 第 1 次拍板驳回（v1）」——**也没有**这句；
 *  · **但它真到了人眼前**：同一刻它经 `announceToSession` → `agent.inject` **注入主对话流**
 *    （探针收下来的原句逐字：「↩️ 第 1 次拍板被驳回（v1），AI 正在修订」）。
 *  ⇒ 票面原以为它在「过程记录／回放列表」出口上；读数把它订正为**对话流播报**这一路。
 *
 * ── 处置（照票 20 的先例：同一句文案两个取值，⛔ 不新增分叉／豁免）──────────────────
 * 真书那侧**一个字不改**；演示书那侧说清「新版是它自己出的、没有 AI 参与」。演示取值的依据是
 * 读数②：驳回之后盘上/状态里**真出了 v2**（`gate.version` 1 → 2）⇒ 说「会自己再出一版」是真的。
 * ⚠️ 本函数**只管这一句**（拍板驳回）：`outline-decision` 驳回那一句（同族「AI 正在重新安排」）
 * 不在这里——它要一条「演示书驳回章节安排之后会不会真重新安排」的读数，本票没做（票面 `## Comments`）。
 *
 * @param {{gate?: number|string, version?: number|string}} data `textbook/gate-decision` 的 data
 * @param {{demo?: boolean}|null|undefined} meta 当前书的状态（不传＝按真书那侧）
 */
function gateRejectedAnnounce(data, meta) {
  const head = `↩️ 第 ${data.gate} 次拍板被驳回（v${data.version}）`
  // 判据沿用引擎里既有的那一份（`meta.demo === true`，与 `ui/view-rules.isDemoBook` 同一件事；
  // ⛔ engine 不 import `ui/**`，那是反方向的一层）。
  if (meta?.demo === true) return `${head}，演示书自己会再出一版（没有 AI 参与）`
  return `${head}，AI 正在修订`
}

/**
 * 章节安排**被驳回这一族**的三句人读文案（**唯一出口**，票 `demo-channel-full/24`）：
 * 播报那句（`outlineRejectedAnnounce`）＋ `textbook/hint` 那两句（`outlineRedoHint`）
 * ＋ 到确认点那条状态行（`outlineReadyHint`）。
 *
 * ── 病 ─────────────────────────────────────────────────────────────────────────
 * 这一族每一句都在**演示书**上说半句假话：句子说「**AI** 在／会重新安排」，而演示通道
 * **零 LLM**（压根没有 AI）。票 `23` 的真读数把「重排」那一半读清了：驳回之后
 * `工作区/outline.md` **真被重写**、旧稿进 `工作区/_旧版产物/`、书回到 `awaiting-outline`、
 * 账上多三笔（`stage-start`／`agent-start`／`agent-end`）——**但**新版与旧版**逐字相同**
 * （714 B，sha `e2ecb618550eac7c` 前后一致），用户写的那句意见只落 `meta.outlineRedoNote`、
 * 演示支**零下游**（读它的唯一一处是真书 brief，演示支不走 `stage-brief`）
 * ⇒ 「重新安排」这个动作发生了，**「AI」与「照你的意见改」都没发生**。
 *
 * ── 处置 ───────────────────────────────────────────────────────────────────────
 * 照票 `20`／`22` 的先例：**同一句文案两个取值**，**真书那侧一个字不改**，⛔ 不新增分叉／豁免。
 * ⚠️ 措辞按票 `23` 读出来的约束写（⛔ 不是照抄票 22 的「会自己再出一版」）：`meta.outline`
 * **没有版次概念**、新版与旧版**逐字相同** ⇒ 演示取值只能说「把**同一份安排原样再写一遍**
 * （没有 AI 参与；你写的那句意见不会进去）」。演示取值里的每一件事都有读数撑着
 * （本票探针 `.scratch/demo-channel-full/t-24-probe.mjs`，**不入库**）：
 *   · 「原样再写一遍」＝ 三轮驳回都是 `逐字相同=true`（同名探针 `engine` 段）；
 *   · 「没有 AI 参与」＝ 同一探针的模型接缝计数 **0**（`agents.create/start/followup` ＋
 *     `subagents.start` 触碰 0 次）；
 *   · 「你写的那句意见不会进去」＝ 同探针喂**两轮不同文字**的 note，新版字节完全一致；
 *     `outlineRedoNote` 真写进去了，但读它的唯一一处是真书 brief。
 *
 * ── 位置是**读数**定的（票 22／23 的教训：不许由静态推断下）────────────────────
 * · `outlineRejectedAnnounce`：**只在会话播报**上（同探针 `engine` 段：`过程记录.md`／事件流／
 *   工作台九帧对那句「AI 正在重新安排」**零命中**）；
 * · `outlineRedoHint`：到人眼前的路**更短**——会话播报 ＋ `过程记录.md` ＋ 回放列表（事件流）
 *   三处都在（探针 `channelTable` 的 A／B／C 三列各有命中）；
 * · `outlineReadyHint`：与它同形（三条通道都在），**不在**工作台屏的正文里
 *   （探针 `live` 段的 D 列 = 0）——票 `23` 没核过的那一格，本票核了。
 * ⛔ 一处**没改**：`src/ui/confirm-cards.js` 驳回表单那颗键的面文「🔁 就这样重新安排」——
 * 键本身就是那个动作的名字，改它＝改产品面（改键名／改键的行为／容忍这句话三选一），
 * 票面明令**停下来说清楚**，见本票 `## Comments`／`## Answer`。
 *
 * ── ⚠️ 我的枚举面比现实窄在哪里 ───────────────────────────────────────────────
 * 本组只管**这三句**（驳回播报、驳回 hint、到确认点那条状态行）。同一张卡上那颗键的面文、
 * 卡上另一颗「🔁 让 AI 重做」、以及探查那一族的同形句（`gates.js` 的「它正在重新探查」）
 * 都是同族邻居，**不在本出口的射程内**（票面窄处③：只记 `## Comments`）。
 */

/**
 * 章节安排被驳回那一句**播报**（`textbook/outline-decision` 的 `approved !== true` 支）。
 * @param {{demo?: boolean}|null|undefined} meta 当前书的状态（不传＝按真书那侧）
 */
function outlineRejectedAnnounce(meta) {
  // 判据与 `gateRejectedAnnounce` 同一份（`meta.demo === true`，与 `ui/view-rules.isDemoBook`
  // 同一件事；⛔ engine 不 import `ui/**`，那是反方向的一层）。
  if (meta?.demo === true) {
    return '↩️ 章节安排已被驳回，演示书会把同一份安排原样再写一遍（没有 AI 参与；你写的那句意见不会进去）'
  }
  return '↩️ 章节安排已被驳回，AI 正在重新安排'
}

/**
 * 驳回那一刻那条 `textbook/hint`（有意见／没意见两支；`actions/gates.js` 的 `outline-confirm` 调它）。
 * @param {string} note 用户写的那句意见（空串＝没写）
 * @param {{demo?: boolean}|null|undefined} meta 当前书的状态（不传＝按真书那侧）
 */
function outlineRedoHint(note, meta) {
  if (meta?.demo === true) {
    // ⚠️ 演示取值**有意不提**「想给方向随时在对话里说」：那句话在演示书上会暗示「说了就会照办」，
    // 而读数（同探针）证明 note 在演示支零下游 ⇒ 少一句承诺是允许的，多一句没发生的才是本票治的病。
    return note !== ''
      ? `↩️ 章节安排已驳回，你写的那句意见（${note}）不会进到安排里；演示书会把同一份安排原样再写一遍（没有 AI 参与）。`
      : '↩️ 章节安排已驳回（没写具体意见）；演示书会把同一份安排原样再写一遍（没有 AI 参与）。'
  }
  return note !== ''
    ? `↩️ 章节安排已驳回，你的意见（${note}）已带给 AI，它正在重新安排。`
    : '↩️ 章节安排已驳回（没写具体意见），AI 会重新安排；想给方向随时在对话里说。'
}

/**
 * 章节安排铺好、等用户确认那一条状态行提示（`runPhase3` 的演示支 `ensureStatus` 调它）。
 * ⚠️ 这一句今天的**唯一调用点**在演示支里，真书那一句在 `actions/chapters.js` 的
 * `stage-submit outline` 上（本票一个字没动）⇒ 这个函数的**真书取值今天不可达**。
 * 留它成对是为了「同一格两个取值只有一个出口」，⛔ 不是为了声称真书会读到它
 * （如实记在票面 `## Answer`）。
 * @param {{demo?: boolean}|null|undefined} meta 当前书的状态
 */
function outlineReadyHint(meta) {
  if (meta?.demo === true) {
    return '📐 章节安排出来了，请在工作台查看：满意点「✅ 通过」，不满意点「🔁 让 AI 重做」——演示书会把同一份安排原样再写一遍（没有 AI 参与），你写的意见不会进去。'
  }
  return '📐 章节安排出来了，请在工作台查看：满意点「✅ 通过」，不满意点「🔁 让 AI 重做」，AI 会重新安排。'
}

/**
 * 票 `demo-channel-full/26`（**清仓**）：这一族「AI 会／正在…」承诺句的**残余**（引擎侧六个出口）。
 *
 * 做法与上面那几个函数**逐字同一条**（票 20／22／24 的先例）：同一句两个取值 ＋ 唯一出口 ＋
 * 复用引擎里既有的那一份 `meta.demo === true`（与 `ui/view-rules.isDemoBook` 同一件事；
 * ⛔ engine 不 import `ui/**`，那是反方向的一层）＋ **真书那侧一个字不改** ＋ ⛔ 不新增分叉／豁免。
 *
 * ── ⚠️ 每句的演示取值都**读过**才写（票 22／23 的教训：不许由静态推断下）──────────────────
 * 读数出处＝一次性探针 `.scratch/demo-channel-full/t-26-probe.mjs`（**不入库**，可重跑）：
 *  · `corpus` 段：建演示书 → 自动拍板跑到 `delivered`，沿途收**会话播报**（`session.append`），
 *    收尾读《过程记录.md》与 `timeline.jsonl`（`A 会话播报`／`B 过程记录`／`C 事件流` 三条通道）；
 *  · `acts` 段：逐态驱动到目标状态再手动发那一个动作（驳回探查／修订范例章／整版重写／
 *    终检不满意／过目态写意见／撤回意见／模式库），逐条读回包 ＋ 通道命中 ＋ **盘上 sha**；
 *  · `frames`／`ui` 段：真浏览器（画廊九帧 ＋ 真引擎真界面交互取样）读工作台屏与 `title`。
 *
 * ── ⚠️ 本组的枚举面比现实窄在哪里 ──────────────────────────────────────────────────
 * 只管**这一族里被探针读到过的那几句**（写法面＝「AI／小助手 ＋ 会／正在／在 ＋ 动作词」的承诺句）。
 * ⛔ 不在射程的三类逐条记在票面 `## Answer`：① **键面文**（维护者 2026-10-15 裁决容忍，map 决定 42）；
 * ② **过去式陈述与名词标签**（`🤖 AI 开始：…`／`AI 检查报告`／`AI 提议：…`）——另一族措辞；
 * ③ ⛔ 不证真书那一侧的通路对不对（本票只看演示书这一支）。
 */

/**
 * 阶段五「全部章节都写好了」那条 hint（`ensureStatus`，演示支与真书支共用同一条调用点的那三处）。
 * 演示取值的读数：`acts` 段④（过目态发 `review` 回 200、意见真落 `meta.pendingReviews`）＋
 * 演示支**从不**给用户那条意见写 `how`（`demoWriteChapters` 只补自带的示例）⇒ 用户那条的
 * 唯一出路是撤回，且没有 AI 照它改。
 * @param {{demo?: boolean}|null|undefined} meta
 */
function chaptersReadyHint(meta) {
  if (meta?.demo === true) {
    return '📚 全部章节都写好了！请在工作台逐章过目：想细看就点「看看这章」，有意见直接写（演示书里没有 AI 照改：你自己写的那条要放行，得先把它撤回）；都满意了点「✅ 都过了，交工」开始合并。'
  }
  return '📚 全部章节都写好了！请在工作台逐章过目：想细看就点「看看这章」，有意见直接写（AI 会照改）；都满意了点「✅ 都过了，交工」开始合并。'
}

/**
 * 探查确认卡**被驳回**那一刻的两条 `textbook/hint`（`actions/gates.js` 的 `explore-confirm` 调它）。
 * ⚠️ 这一条是票 `demo-channel-full/24` 交下来的「**已知一条**」（它的票面 `## Comments`：
 * 探查那一族的「它正在重新探查」同族、但不在那一票射程内）。
 * 演示取值的读数：`acts` 段①（驳回回 200、`工作区/explore.md` 的 mtime 变了但
 * sha `c1ef38ee630f2d87` 前后一致 ⇒ 原样重写；用户那句只落 `meta.exploreRedoNote`，
 * 读它的唯一一处是真书 brief `stage-brief`）。
 * 措辞按票 23 读出来的约束写：⛔ 不说「会自己再出一版」（`explore.md` 没有版次概念、新旧逐字相同）。
 * @param {string} note 用户写的那句意见（空串＝没写）
 * @param {{demo?: boolean}|null|undefined} meta
 */
function exploreRedoHint(note, meta) {
  if (meta?.demo === true) {
    return note !== ''
      ? `↩️ 探查结果已标记重做，你写的那句意见（${note}）不会进到报告里；演示书会把同一份探查报告原样再写一遍（没有 AI 参与）。`
      : '↩️ 探查结果已标记重做（你没写具体意见）；演示书会把同一份探查报告原样再写一遍（没有 AI 参与）。'
  }
  return note !== ''
    ? `↩️ 探查结果已标记重做，你的意见（${note}）已带给 AI，它正在重新探查。`
    : '↩️ 探查结果已标记重做（你没写具体意见），AI 会重新仔细通读后再来；想给它方向随时在对话里说。'
}

/**
 * 终检「不满意」空意见那条 400（`actions/gates.js` 的 `final-approve` 调它；错误条原样上屏）。
 * 演示取值的读数：`acts` 段③（空意见 ⇒ 同一句话的 400；带意见 ⇒ 200 `redo:true`）。
 * @param {{demo?: boolean}|null|undefined} meta
 */
function finalRejectNeedsNote(meta) {
  if (meta?.demo === true) return '不满意最后检查结果必须写一句改进意见（演示书要有一句话才会把最后检查重跑一遍）'
  return '不满意最后检查结果必须写一句改进意见（AI 照着改整本后重新做最后检查）'
}

/**
 * 终检「不满意」收下之后那一条 `textbook/hint`（同 `actions/gates.js` 的 `final-approve`）。
 * 演示取值的读数：`acts` 段③——「重新做最后检查」这半句**是真的**（账上第二次出现
 * `🎯 交给 AI 动手：最后检查` 与 `🛡️ 最后检查：8/8 项通过`，书回到 `awaiting-final-approval`），
 * 假的是「**按你的意见修整本**」：`工作区/报告/` 六件**逐字未变**（sha 前后相同），
 * 那句话只落 `meta.finalRedoNote`，读它的唯一一处是真书 brief（`engine.js:4550／5444`）。
 * @param {{demo?: boolean}|null|undefined} meta
 */
function finalRejectedHint(meta) {
  if (meta?.demo === true) {
    return '🔁 最后检查未获认可：演示书会把最后检查原样重跑一遍（没有 AI 参与；你写的那句不会进去）。'
  }
  return '🔁 最后检查未获认可，AI 将按你的意见修整本后重新做最后检查。'
}

/**
 * 谈判桌「🔁 让 AI 照这些改」那一下的 `textbook/hint`（`actions/gold.js` 的 `gold-revise` 调它）。
 * ⚠️ 这一句**不是**「动作没发生」那一类（票面点名的「动作真发生、但结果不同」）：`acts` 段②
 * 读出 `工作区/chapter-01.md` 的 sha **真变了**（`3f9d4bbd…` → `341a7767023867a8`），而且
 * **演示支真读** `meta.goldRedoNote`（`engine.js:2766` 递进 `generateContent('gold', { redoNote })`，
 * `content-lib.demoGoldChapter` 把它织成「## 本稿按你的意见改了（演示）」那一节）
 * ⇒「意见织进新稿」是真的，「带给 **AI**」是假的。⇒ 演示取值只去掉「AI」那一半。
 * @param {{demo?: boolean}|null|undefined} meta
 */
function goldReviseHint(meta) {
  if (meta?.demo === true) return '✍️ 已经把这些意见织进新一稿（演示书里没有 AI），改完再请你过目。'
  return '✍️ 已把你的意见带给 AI，它正在照着修订最佳范例章，改完再请你过目。'
}

/**
 * 谈判桌「❌ 这版整个不要，重写」那一下的 `textbook/hint`（`actions/gold.js` 的 `gold-approve` 调它）。
 * 演示取值的读数同 `goldReviseHint`（`acts` 段②：重写后 sha 再一次变 `09db2d0ec5470b77`）。
 * @param {{demo?: boolean}|null|undefined} meta
 */
function goldRewriteAnnounce(meta) {
  if (meta?.demo === true) return '↩️ 范例章已标记重写：演示书会自己再生成一版（没有 AI 参与）。'
  return '↩️ 范例章已标记重写，AI 正在重新生成。'
}

/** 事件 → 主对话播报文本（null 表示不值得播报，只进项目时间线）。
 *  频率收紧：主 AI 现场讲话已覆盖的过程性事件（子代理起止/交办/进度/抽查/AI 报告）
 *  一律不播；用户新增的风格意见是自己刚点的，也不播（机器收回才值得告知）。
 *
 *  ⚠️ `meta` 是**可选**的第二位（票 `demo-channel-full/22`）：只有需要按「这本书是不是演示书」
 *  分岔的那几句看它（今天只有拍板驳回那一句，见 `gateRejectedAnnounce`）；不传＝按真书那侧说话
 *  （既有调用点与测试的直调都照旧）。 */
function announceText(event, meta) {
  // 沉默策略收进 EVENT_META（announce: false = 该型机器不开口；见 CONTEXT.md 工作台提示/验货频率收紧）：
  // 主 AI 现场已讲的过程性事件、用户自己刚做的动作、纯机器内部事件一律不重复播报。
  if (EVENT_META[event.type]?.announce === false) return null
  const data = event.data ?? {}
  switch (event.type) {
    case 'textbook/phase-start': return `🏁 阶段开始：${phaseEventHuman(data)}`
    case 'textbook/phase-end': return `✅ 阶段完成：${phaseEventHuman(data)}`
    case 'textbook/gate-proposal':
      return `📋 ${gateHuman(data.gate)} · 方案 v${data.version}：${data.title ?? ''}（工作台里可看完整方案）`
    case 'textbook/gate-decision':
      return data.approved === true
        ? `✅ 第 ${data.gate} 次拍板通过（v${data.version}）`
        : gateRejectedAnnounce(data, meta)
    case 'textbook/rollback': {
      const from = data.from?.phase
      const to = data.to?.phase
      const where = from === null || from === undefined || to === null || to === undefined ? '' : `（阶段 ${from} → ${to}）`
      return `⏪ 已回退到快照 ${data.snapshot ?? ''}${where}`
    }
    case 'textbook/error': return `⚠️ 出错（${stageLabelHuman(data.task)}）：${String(data.message ?? '').slice(0, 200)}`
    case 'textbook/quality': {
      const checks = data.checks ?? []
      const pass = checks.filter((check) => check.ok === true).length
      return `🛡️ 最后检查：${pass}/${checks.length} 项通过`
    }
    case 'textbook/delivery': return '🎉 书做好了！工作台里可以预览和下载。'
    case 'textbook/hint': {
      // ⚠️ **纯机器内部的一步不播报**（票 `walkthrough-2026-10/02` 的 `chapter-assemble` 留痕）：
      // 那是主笔自己刚叫过的一步（`workbench_act(action=chapter-assemble)`），机器再在对话里
      // 回一句就是「重复播报主 AI 现场已讲的过程性事件」——那条红线写在 `EVENT_META.announce`
      // 那段注释里。它照旧进项目时间线与《过程记录.md》（`logEntryText` 不认这一枚标记）。
      if (data.machine === 'chapter-assemble') return null
      // 票 `decision-provenance/01`：人工动作事件是**取证**用的账，不是一句要说给人听的话——
      // 它照旧进《过程记录.md》与时间线（可核），但⛔ 不在对话流里再播一遍。
      if (data.machine === HUMAN_ACTION_MARKER) return null
      return typeof data.text === 'string' && data.text !== '' ? `💡 ${data.text}` : null
    }
    case 'textbook/style-note':
      // 收回才值得告知；新增的意见是用户自己刚点的，不播。
      if (data.revoked !== true) return null
      return `🎨 风格线收回了一条意见（${String(data.styleNote?.text ?? '').slice(0, 40)}）`
    // 票 `walkthrough-fixes/21`（2026-10-06 裁决「甲」）：原句尾「（不打断 AI 手里的活，下个停靠点处理）」
    // 是一句**时机承诺**，与机器行为相反（§11.2 硬触发：当轮就转达）。且「不打断」只在铺章途中成立，
    // 而播报对所有相位都发声 ⇒ 这里换成**两态事实**。
    case 'textbook/intervention': return `📮 已留言：${String(data.text ?? '').slice(0, 60)}（有 AI 在跑时当轮转达；没有 AI 在跑时等到下一站）`
    case 'textbook/waiver': return `✅ 已按你的特殊要求放行：${WAIVER_ITEMS[data.item]?.label ?? data.item}`
    case 'textbook/pause': return `⏸ 已暂停（${data.reason ?? '用户在造书工作台点击暂停'}）${stoppedOrchestrationNote(data)}`
    case 'textbook/resume': return `▶ 已继续`
    case 'textbook/outline-decision':
      return data.approved === true
        ? `✅ 章节安排已确认`
        : outlineRejectedAnnounce(meta)
    case 'textbook/gold-seal': return `🏆 最佳范例章已定稿（v${data.version ?? '?'}），意见沉淀入风格线（${data.count ?? 0} 条）`
    // 交工/提审被拒（票 01 (d)）：用户看得见机器挡下了什么——这正是被「机器报错、AI 说没事」坑过的那个用户。
    //
    // ⚠️ **这里也不印阶段**（票 `audit-matrix-contract/06`，2026-09-29 用户拍板选 ②）。
    // **不印的理由**：这句是**发给主笔 AI、由它转述给用户**的对话流播报（判定线③），不是给人直接看的
    // 界面行——它整句被 `.slice(0, 200)` 截断，再塞一个阶段前缀就是拿配额换一句用户已经能从横幅
    // 看到的话；而 `reason` 本身已经是**机器拟的可行动报错**，主笔 AI 拿到它就知道该回哪一步。
    // 界面上用户要读的那一格是事件行的**展开详情**（`src/ui/event-cards.js` 的 `replayRowDetail`），
    // 那里才印人话阶段词。**这不是漏了，是四个出口里逐个点名后的第三处「不印」。**
    case 'textbook/submit-rejected': return `🚫 交工被拒：${String(data.reason ?? '').slice(0, 200)}`
    // 票 12 · ①：机器替 AI 记「它改了机器契约」这一笔。**两个出口都开口**——
    // 《过程记录.md》是事后翻账的人看的，对话播报是**当下**就该让用户与主笔 AI 知道的那一条
    // （此刻已写的那些章是照改动前那一版写的，这是不一致的唯一一处可核证据）。
    case 'textbook/style-spec-change':
      return `📝 写作规范在范例章定稿后被改过（${styleSpecChangeWhen(data)}）`
    default: return null
  }
}


/** 把一条机器播报追加到主会话（对话流里能看到机器在干什么）。
 *  形态：plugin 来源的 user/message「notice 注入行」——客户端把它归类为上下文行
 *  （折叠一行摘要 + 可展开全文），节点身份用消息 id，与回合体系完全解耦。
 *  旧实现伪造完整 turn 信封（turn/start→turn/end，号码取日志最大值+1），与真实
 *  主 AI 自己的回合计数冲突：客户端把重复的 assistant-step:${turn}:${step} 当致命
 *  错误抛出，且异常发生在推送管道里——之后到达的一切事件都进不了聊天视图（对话
 *  冻结、刷新重放也复崩）。已废弃该形态；历史遗留的存量信封组已由一次性修复脚本
 *  （fix-announce.mjs，已删）清理完毕，不再需要手动清理。
 *  安全闸（2026-09-24 重做）：AI 回合进行中绝不 `session.append`。notice 虽不占回合号，
 *  但落在「assistant 工具调用」与「tool 结果」之间仍会破坏下轮请求的消息相邻性——
 *  下轮请求会带上**同一 tool_call_id 的两条结果**（宿主现造的占位 + 迟到真结果），
 *  模型接口以 400 拒绝（`{"model":"…"}` 畸形体），且该畸形历史一旦落盘，之后每个请求
 *  都 400、压缩也救不回来（2026-09-23 真机事故：整本《抑郁自救…》会话就此卡死）。
 *  旧实现扫 `session.events` 的 turn/start↔turn/end 判「回合是否进行中」——真机上没拦住
 *  （快照滞后），故改用宿主公开的 `agent.status`：
 *    - `running` → 走 `agent.inject`（inbox / next-step / 不唤醒），由宿主在步边界安全插入；
 *    - `idle`（或没有活的主 AI）→ 直接 append，此刻没有在飞的 tool 调用，安全；
 *    - 拿不到 status → 保守放弃这次播报（工作台时间线里仍可见，绝不冒险污染会话）。 */
function announceToSession(ctx, sessionId, text) {
  try {
    const firstLine = (text.split('\n', 1)[0] ?? text).trim()
    // user/message 的 data 就是消息本身（不是 assistant/message 的 {message:...} 包裹）。
    // 写错形状会让宿主模型请求构建时读 data.source.kind 崩（.kind undefined），已修。
    // ⚠️ source 必须是 **v4 的 producer-owned 形状**：`{ kind: 'plugin', plugin: '…' }` 那个
    // v3 包装已被宿主 0.1.7 的会话格式准入门**明确退役**（dsh-session-format-v3-to-v4
    // `source()`：`kind === 'plugin'` 直接抛 `format v4 message requires a producer-owned
    // source kind`，整轮判失败）。宿主自己的改写口径见同文件 `producerKind()`：
    // kind 变成 `plugin:<名字>`，且 **`plugin` 键被丢掉**，form/summary 原样保留。
    const message = noticeMessage({
      idPrefix: 'tb-note',
      text,
      summary: `工作台：${firstLine.slice(0, 60)}`,
    })
    const agent = ctx.get('agents')?.get?.(sessionId)
    if (agent !== undefined) {
      const status = typeof agent.status === 'string' ? agent.status : undefined
      if (status === 'running') {
        // ⚠️ 双轴 review（2026-09-29，票 announce-adjacency/02）修的两处：
        // 「保守放弃」在本函数里**只有一种报法**——放弃必须 warn。
        // 原来这里是静默 `return`，而同一条路径上「拿不到 status」是 warn 的：
        // 同一个动作、两种报法，用户排查时会以为「没有放弃」，实际是被丢掉了。
        if (typeof agent.inject !== 'function') {
          ctx.logger.warn('textbook: 播报跳过——agent.inject 不可用（宿主 facade 与本仓用的不是同一枚）')
          return
        }
        agent.inject(message)
        return
      }
      // ⚠️ 同上第二处：这条 warn 原文写「拿不到 agent.status」，但它**也**在
      // 「拿到了、且不是 idle」时触发（上游新增任何一个状态值都会落这里）。
      // 文案与覆盖范围不符 ⇒ 排查会被引向「facade 改名了」这个错方向。
      // 两个读数都点出来：**读到的值**与**它为什么不能当成收口**。
      if (status !== 'idle') {
        const read = status === undefined ? '读不到' : `读到 ${JSON.stringify(status)}`
        ctx.logger.warn(`textbook: 播报跳过——${read} agent.status，无法确认回合已收口（只有 idle 才落会话）`)
        return
      }
    }
    const session = ctx.get('sessions')?.get?.(sessionId)
    if (session === undefined) return
    session.append('user/message', message, { surfaceOp: 'append' })
  } catch (error) {
    ctx.logger.warn(`textbook: 主对话播报失败: ${String(error instanceof Error ? error.message : error)}`)
  }
}


/** 播报入口：低价值事件只进项目时间线；相邻事件合并成一条注入行
 *  （如「✅ 阶段完成：源探查 → 🏁 阶段开始：教学设计」）。
 *  暂存按 project 记（进程内即可；跨重启最多丢一次合并机会，无实质影响）。 */
const pendingPhaseEnd = new Map()


/** 拒收去重记忆：project → 上一次**已开口**的 `(stage, 逐字 reason)` 键（票 `audit-matrix-contract/04`，
 *  裁决**乙**：同 project 的**连续同文**拒收不再原样 inject 第二遍）。
 *
 *  ⚠️ 消的是「返工循环里同文反复堆叠」，**不是**「单次事件里 400 与 notice 各一份」——单次那两份
 *  来自**两个不同的面**（工具结果 400 / 对话流 notice），工具结果那一份本票不该动。
 *
 *  合并键：**三者全同**才合并（project 天然按 key 分桶，故比的是 `stage` + 逐字 `reason`）。
 *  两者是 `===` 逐字比，**刻意不用 `includes`／归一化**——票 02 铺满的 20 处 reason 逐字未改，
 *  「异文」是真实情形；宽松判据会把两次不同的拒收并成一条看不出所以然的记录。
 *  **至少保留第一次开口**：只有「上一次开口就是同一篇」时才吞掉这一次。
 *  任何**别的**播报插在中间即清空记忆——「连续」按对话流里真正相邻判，不是「同 project 历史上出现过」。
 *  进程内暂存即可（跨重启最多多播一次，与 `pendingPhaseEnd` 同一取舍）。 */
const lastRejectAnnounce = new Map()

/** 拒收的合并键：`stage` + NUL + **逐字** `reason`。分隔符取 NUL，任何 stage/reason 组合都不会撞键。 */
function rejectDedupKey(data) {
  const stage = String(data?.stage ?? '')
  return `${stage}\u0000${String(data?.reason ?? '')}`
}

function announceEventToSession(ctx, projectId, meta, event) {
  const sessionId = meta.session
  if (typeof sessionId !== 'string' || sessionId === '') return
  if (event.type === 'textbook/phase-end') {
    // 它迟早会占掉对话流里的一行 ⇒ 同样打断「连续」，一并清空拒收去重记忆。
    lastRejectAnnounce.delete(projectId)
    pendingPhaseEnd.set(projectId, { text: announceText(event, meta), time: event.time })
    return
  }
  const text = announceText(event, meta)
  if (text === null) return
  // 拒收去重（票 `audit-matrix-contract/04` · 乙）：只在「上一次开口就是同一篇」时吞掉这一次，
  // 所以第一次照旧开口（机器确实挡了的那条线索不许消失）。判据逐字，比键不含任何宽松匹配。
  if (event.type === 'textbook/submit-rejected') {
    const key = rejectDedupKey(event.data)
    if (lastRejectAnnounce.get(projectId) === key) return
    lastRejectAnnounce.set(projectId, key)
  } else {
    // 别的播报插在中间 ⇒ 不再「连续」：下一次同文拒收必须重新开口。
    lastRejectAnnounce.delete(projectId)
  }
  const held = pendingPhaseEnd.get(projectId)
  pendingPhaseEnd.delete(projectId)
  if (held !== undefined && held.text !== null) {
    if (event.type === 'textbook/phase-start' && event.time - held.time < 60_000) {
      announceToSession(ctx, sessionId, `${held.text} → ${text}`)
      return
    }
    announceToSession(ctx, sessionId, held.text)
  }
  announceToSession(ctx, sessionId, text)
}


/** 账本里已有的**最大序号**（空账本 -1）。给已坏的老账本补基线用：下一笔的序号必须**大于它**——
 *  否则既和账本里已有的一笔撞号，又小于前端已收到的最大序号（页面继续不更新，「只增且唯一」在这本书上
 *  永远不成立）。**刻意不缓存**：账本会被回退快照 / 深改截断（文件变小），缓存一份「曾经的最大值」
 *  正是新一类旧值 bug。账本不大，这段 O(行数) 的读只在「记一笔」时发生。 */
function ledgerMaxSeq(projectId) {
  let max = -1
  for (const event of readEvents(projectId)) {
    if (Number.isSafeInteger(event?.seq) && event.seq > max) max = event.seq
  }
  return max
}


/** 「记一笔」：账本与「账高 / 最后动静时刻」的**唯一**写入者（ADR-0016 决策 1）。
 *  序号取「账高」，但已坏的老账本（账高小于账本最大序号）只补基线——**不重写旧行、不重排序号**。 */
function appendEvent(projectId, type, data, duration) {
  if (!EVENT_TYPES.has(type)) throw new Error(`textbook: unknown event type ${JSON.stringify(type)}`)
  const meta = readMeta(projectId)
  if (meta === null) throw new Error(`textbook: unknown project ${JSON.stringify(projectId)}`)
  const path = timelinePath(projectId)
  const seq = Math.max(meta.eventCount ?? 0, ledgerMaxSeq(projectId) + 1)
  const event = { seq, time: Date.now(), type, data }
  // duration（毫秒）：P2-9 性能基线用——调用方把紧邻操作的耗时带进来（如 agent-start→agent-end）；
  // cassette 回放不比对该字段，只比对事件类型序列/产物指纹/终态。
  if (Number.isFinite(duration) && duration >= 0) event.duration = Math.round(duration)
  appendFileSync(path, JSON.stringify(event) + '\n')
  meta.eventCount = seq + 1
  meta.updatedAt = event.time
  writeMeta(meta)
  // 人读的过程记录镜像（过程以文档形式留在文件夹里）。
  try {
    const entry = logEntryText(event)
    if (entry !== null) {
      const time = new Date(event.time).toLocaleString('zh-CN', { hour12: false })
      appendFileSync(processLogPath(projectId), `### ${time}\n${entry}\n\n`)
    }
  } catch { /* 过程记录失败不影响主流程 */ }
  // 主对话播报：让用户在对话流里看到机器在干什么（notice 注入行，不再伪造回合）。
  try {
    if (announceCtx !== null) announceEventToSession(announceCtx, projectId, meta, event)
  } catch { /* 播报失败不影响主流程 */ }
  return event
}


/**
 * **人类动作事件**（票 `decision-provenance/01` D3=A）——工作台那一条通道每次发来一个
 * 「会落拍板结论」的动作时，HTTP adapter 先落这一笔，再把它的 `eventId`／`at` 交给动作族。
 *
 * ⚠️ 它是**证据**，不是回执：`recordStationDecision` 只认这一种标记（`data.machine ===
 * 'human-action'`）＋ `seq`／`time` 都能在账本里查到的引用；AI 那条通道（`agent-tool`）不落它，
 * 所以 AI 代拍的结论件会被强制降级成 `machine`。这是「谁拍的」第一次在账上可区分。
 *
 * @param {string} projectId
 * @param {string} action 规范动作名（只作证据的说明，不参与判定）
 * @param {string} [sessionId] 给了就核会话归属（⛔ 不许给别人的书落人工事件）
 * @returns {{eventId: string, at: string, action: string}|null}
 */
function appendHumanActionEvent(projectId, action, sessionId) {
  const meta = readMeta(projectId)
  if (meta === null) return null
  if (typeof sessionId === 'string' && sessionId !== '' && meta.session !== sessionId) return null
  const event = appendEvent(projectId, 'textbook/hint', {
    text: '🖐 人工操作（工作台点击）',
    machine: HUMAN_ACTION_MARKER,
    humanAction: typeof action === 'string' ? action : '',
  })
  return {
    eventId: String(event.seq),
    at: new Date(event.time).toISOString(),
    // 写点拿它卡「同一条人工事件不能给别的动作签名」（`verifyHumanEvent`）。
    action: typeof action === 'string' ? action : '',
  }
}


function readEvents(projectId, after) {
  const path = timelinePath(projectId)
  if (!existsSync(path)) return []
  const lines = readFileSync(path, 'utf8').split('\n').filter((line) => line.trim() !== '')
  // 单行损坏不炸全局：跳过并告警（账本尾行被截断等场景；比抛错后整本不可用好）。
  const events = []
  for (const line of lines) {
    try { events.push(JSON.parse(line)) } catch { console.error(`[textbook-workflow] 账本行损坏已跳过：${path}`) }
  }
  return after === undefined ? events : events.filter((event) => event.seq > after)
}


/** 项目列表（按更新时间倒序；严格会话隔离：只列本会话的项目，一个会话至多一本）。 */
function listProjects(sessionId) {
  const projects = []
  const seen = new Set()
  // 1) 注册表里的项目（工作区书夹）
  for (const id of Object.keys(readRegistry())) {
    if (!PROJECT_ID_RE.test(id)) continue
    seen.add(id)
    const meta = readMeta(id)
    if (meta === null) continue
    if (meta.session !== sessionId) continue
    projects.push(meta)
  }
  // 2) 默认目录里未登记的遗留项目（旧书 / wizard 暂存目录跳过）
  for (const name of readdirSync(projectsRoot())) {
    if (seen.has(name) || !PROJECT_ID_RE.test(name) || name.startsWith('wizard-')) continue
    const meta = readMeta(name)
    if (meta === null) continue
    if (meta.session !== sessionId) continue
    projects.push(meta)
  }
  projects.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
  return projects
}


/**
 * 递归复制目录/文件（手动实现：mkdir + readdir + copyFileSync）。
 * 刻意不用 fs.cpSync：实测 cpSync 对某些真实书文件夹（含特定 PDF 的目录）会触发
 * Node 原生崩溃（0xC0000409 STATUS_STACK_BUFFER_OVERRUN，独立进程可复现，
 * 2026-08-20 实书走查 F27 发现）——逐文件复制实测安全。
 */
function copyTreeSync(src, target) {
  const st = statSync(src)
  if (st.isDirectory()) {
    mkdirSync(target, { recursive: true })
    for (const name of readdirSync(src)) {
      copyTreeSync(join(src, name), join(target, name))
    }
  } else {
    copyFileSync(src, target)
  }
}


/**
 * 删除目录/文件（尽力而为，绝不抛错拖垮删除主流程）。
 *
 * ⚠️ 2026-08-21 实测复现修复（取消书 → dsh 整体崩掉）：
 * `fs.rmSync(path, { recursive: true })` 在 Windows 上对**含中文的路径**会触发
 * Node **原生崩溃**（0xC0000409 STATUS_STACK_BUFFER_OVERRUN，直接崩掉整个宿主
 * 进程，JS try/catch 拦不住）。F27 走查只记录过它"静默失效"，没料到还会硬崩。
 * 因此**真实默认路径不再调用 fs.rmSync 递归删除**，改用手动逐文件删除
 * （readdirSync + unlinkSync/rmdirSync，实测安全）；删不干净时**按平台兜底**——
 * Windows 走 `cmd /c rmdir /s /q`（这条路上 fs.rmSync 不能用，中文路径会原生崩溃），
 * POSIX 走 fs.rmSync 递归（那条原生崩溃是 Windows 独有的，POSIX 上没有理由不用）——
 * 再失败则保留待下次清理。
 *
 * 两个分支都得在：兜底被 `process.platform === 'win32'` 整段门住的话，非 Windows
 * 上「删不干净」就等于「永远不删」（书夹留在原处），而这类差异只有换台机器才看得见。
 * `rm` 参数保留可注入（测试用：模拟 rmSync 静默失效的旧行为）。
 */
function removeTree(src, rm) {
  if (rm === rmSync) {
    // 真实 rmSync：跳过（中文路径会原生崩溃），直接手动逐文件删除。
    try { removeTreeManual(src) } catch { /* 已尽力；继续兜底 */ }
  } else {
    // 注入的 rm（测试模拟）：保留调用形态，删除结果由手动/兜底保证。
    try { rm(src, { recursive: true, force: true }) } catch { /* 已尽力 */ }
  }
  if (existsSync(src)) {
    if (process.platform === 'win32') {
      try { execFileSync('cmd', ['/c', 'rmdir', '/s', '/q', src], { stdio: 'ignore' }) } catch { /* 保留待下次清理 */ }
    } else {
      try { rmSync(src, { recursive: true, force: true }) } catch { /* 保留待下次清理 */ }
    }
  }
}


/** 手动递归删除（readdir + unlink/rmdir；刻意不用 fs.rmSync 递归，避开原生崩溃）。 */
function removeTreeManual(node) {
  const st = statSync(node)
  if (st.isDirectory()) {
    for (const name of readdirSync(node)) {
      try { removeTreeManual(join(node, name)) } catch { /* 单个条目失败不阻断 */ }
    }
    try { rmdirSync(node) } catch { /* 已尽力 */ }
  } else {
    try { unlinkSync(node) } catch { /* 已尽力 */ }
  }
}


/**
 * 移动文件/目录到目标：同盘走 rename（快）；跨盘（EXDEV，如书文件夹在 D:\ 而 $DSH_HOME 在 C:\）
 * 降级为复制到目标 + 删除原路径（行为等价，只是多一次 IO）。
 * rename/rm 可注入（测试用）；非 EXDEV 错误原样抛出，不吞。
 */
export function moveAcrossDevices(src, target, rename = renameSync, rm = rmSync) {
  try {
    rename(src, target)
    return true
  } catch (error) {
    if (error?.code !== 'EXDEV') throw error
    copyTreeSync(src, target)
    removeTree(src, rm)
    return true
  }
}


/** 把项目移入回收站目录（数据不删，只是移走；注册表条目由调用方决定去留）。 */
function trashProject(projectId) {
  const trash = join(dshHome(), 'textbook', 'trash')
  mkdirSync(trash, { recursive: true })
  const target = join(trash, `${projectId}-${Date.now().toString(36)}`)
  moveAcrossDevices(projectDir(projectId), target)
  return target
}


// ── 快照与回退 ──────────────────────────────────────────────────────────────

/**
 * 存档目录（`过程/存档/`）——票 `13` 从书夹根下平级的一层搬进 `过程/`。
 *
 * ⚠️ **旧名那段无斜杠**（spec 实现决策 25 点名的那个坑）：定义点原先是
 * `join(projectDir(id), <段名>)`、段名后面**不带斜杠**，按「带斜杠」去数命中会**漏掉定义点本身**。
 * 现在它经 `paths.archiveDir()` 拼，段名住在 `domain-rules.js` 的 `ARCHIVE_DIR_NAME`——
 * **本文件一个字都不许再写死目录名**。
 */
function snapshotsDir(projectId) {
  return archiveDir(projectId)
}


/** 截断/回退时把用户的声音（风格线/豁免/未处理留言/**抽查意见**）合并回恢复后的 meta：现在优先，按 id 去重。 */
function mergeUserVoice(currentMeta, restoredMeta) {
  const mergeList = (restored, current, keyOf) => {
    const byId = new Map((restored ?? []).map((item) => [keyOf(item), item]))
    for (const item of current ?? []) byId.set(keyOf(item), item) // 现在优先
    return [...byId.values()]
  }
  restoredMeta.styleNotes = mergeList(restoredMeta.styleNotes, currentMeta?.styleNotes, (n) => n.id)
  restoredMeta.waivers = mergeList(restoredMeta.waivers, currentMeta?.waivers, (w) => w.id)
  const pendingNow = (currentMeta?.pendingInterventions ?? []).filter((i) => i.status === 'pending')
  restoredMeta.pendingInterventions = mergeList(restoredMeta.pendingInterventions, pendingNow, (i) => i.id)
  // 票 13（spec 第 7 条 / 不变量 5「账本与 meta 同源」）：抽查意见也是「用户的声音」，回退的合并口
  // 原先只并 styleNotes/waivers/interventions，于是回退会把**快照之后新提的意见整批丢掉**（用户提了
  // 意见却再也看不到），也会把快照里已 applied/revoked 的旧状态盖回现在已翻案的那条上。两处一起并。
  // 老账本的意见可能没有 id（票 09 之前的入账）→ 退化成「章号 + 意见原文」当键，仍能去重、仍不丢。
  const reviewKey = (r) => (typeof r?.id === 'string' && r.id !== '' ? r.id : `#${r?.chapter ?? '?'}:${String(r?.comment ?? '')}`)
  restoredMeta.pendingReviews = mergeList(restoredMeta.pendingReviews, currentMeta?.pendingReviews, reviewKey)
  return restoredMeta
}


/** 目录里现有的最大快照号（没有 / 读不到时 0）——「快照文件名序号永不复用」的判据来源。
 *  注意这是**快照文件名序号**，与账本序号 / 账高（ADR-0016）是两套编号，别混。 */
function maxSnapshotSeqOnDisk(projectId) {
  let max = 0
  try {
    for (const name of readdirSync(snapshotsDir(projectId))) {
      const hit = /^(\d+)\.json$/.exec(name)
      if (hit !== null) max = Math.max(max, Number(hit[1]))
    }
  } catch { /* 目录读不到：退化为只用 meta.snapshotSeq */ }
  return max
}


function writeSnapshot(projectId, reason) {
  const events = readEvents(projectId)
  // 快照序号只增：读→改→写收在 updateMeta 里（这里也刻意不再写 updatedAt——「最后动静时刻」
  // 只归「记一笔」所有；调用方随后都会落一条事件，时刻由那条事件定）。
  // 票 workbench-transitions/19：`restoreSnapshot` 用 `{ ...snapshot.meta }` 把旧 `snapshotSeq` 一并写回，
  // 只按「旧号 + 1」就会落到一个**已经存在**的 `<seq>.json` 上、把旧存档整份覆盖掉（回退＝丢版本）。
  // 所以号取「目录现有最大号」与 `meta.snapshotSeq` 的较大者再 +1——文件名序号**永不复用**。
  const meta = updateMeta(projectId, (state) => {
    state.snapshotSeq = Math.max(maxSnapshotSeqOnDisk(projectId), state.snapshotSeq ?? 0) + 1
  })
  const snapshot = { seq: meta.snapshotSeq, eventCount: meta.eventCount ?? events.length, time: Date.now(), reason, meta, events }
  writeFileSync(join(snapshotsDir(projectId), `${meta.snapshotSeq}.json`), JSON.stringify(snapshot, null, 2) + '\n')
  return { seq: snapshot.seq, time: snapshot.time, reason }
}


/**
 * **回退时把「快照之后才拍下的」结论件搬进 `工作区/_旧版产物/回退-<seq>/`**
 * ——票 `confirm-points-redesign-build/09`（spec §4.4 第 1 条；收口 review 那条「拦」）。
 *
 * 病（review 实测）：真书拍板后回退到拍板前快照，账本里那条 `gate-decision` 已经消失，
 * 而 `工作区/决策/{02,04}.json` **仍在原地**、`_旧版产物/` **无归档** ⇒ 同一本书上两处真相：
 * 账本说没拍过、文件说拍过了。下游那一站的派单前硬闸读的正是那份文件 ⇒ 它会**放行**一本
 * 「账本说没拍过」的书。
 *
 * 判据＝**时间**：快照只装 `meta` ＋账本、**一个产物文件都不装**（spec §4.4 第 1／3 条）
 * ⇒ 一份结论件的 `decidedAt` **晚于**快照时刻，它就一定不在那份账本里，「件不在＝没拍过」
 * 才是对它的实话。⛔ 反过来**不许**把快照之前拍过的那几站一并搬走：它们的事件还在恢复后的
 * 账本里，搬走反而造出「账本说拍过、件却没了」——那时下游会被**无谓地硬停**。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：`decidedAt` 是**墙钟**（写件那一刻），不是账本序号。
 * 两次拍板落在同一毫秒、或系统时钟被回拨/校时，这一问就会看错（前者偏保守＝不搬，
 * 后者可能把该留的搬走）。要更硬就得把账本序号写进件里，而 spec §4.1 把结论件的键**钉死成
 * 九个 ＋ 可选 `values`** ⇒ 本票⛔ 不加键，如实记这条窄处。
 * 另一处**继承**来的窄处（spec 债-48，本票只登记不裁）：搬运用的是**规范形状**的
 * `工作区/决策/NN.json`，而老布局书上那份件住在**退役的那个书夹根段目录**下（那颗段名的逐字写法见 `test-book-dir-rename.mjs` 那张退役表，⛔ 本行不复写第二份）⇒ 那种书上一件都搬不走
 * （与别的产物族同一条既有病，不是本票新造）。
 *
 * ⚠️ **那份剔除记录（`KNOWLEDGE_MAP_EXCLUSIONS_REL`）有意不在这一族里**（票 `rcb-build/06` 选定
 * 「**边界裁决不随回退走**」）：它是**人写的**一份裁决集合，而这里能做的只有「整份搬走」或「按
 * `at` 拆着搬」——前者会把快照**之前**那些裁决一起丢掉，后者＝机器重写人写的件（本仓
 * ⛔ 不覆盖人写的东西）。⇒ 回退之后它照旧在盘上、照旧自带 `by`／`at`；界面（那张图那一块的读数旁）
 * 与 `src/workflow/knowledge-map-exclusions.js` 的文件头都如实写出这一句，判据见
 * `test/test-knowledge-map-exclusions.mjs` 第 ⑩ 节那条**真跑回退**的格子。
 *
 * @returns {{ want: number, moved: number, misses: string[] }} 透传 {@link archiveBookFiles} 的读数
 *   ——**调用方必须读它**（收口 review · finding 2）：没有决策目录／一件都不该搬时是 `0/0/[]`。
 */
function archiveDecisionRecordsAfter(projectId, snapshotSeq, snapshotTime) {
  const dir = join(workDir(projectId), DECISION_DIR_NAME)
  let names = []
  // 没有决策目录＝这一站还没拍过任何一站（`want: 0` ⇒ 调用方不会把它误读成「搬失败」）。
  try { names = readdirSync(dir) } catch { return { want: 0, moved: 0, misses: [], movedFiles: [] } }
  // ⚠️ 枚举面取自**盘上**（不是「站 1–9」那张表）：现实比任何站号区间都宽才是安全的那个方向。
  // 路径一律**从 `DECISION_DIR_REL`（唯一出处）拼**，⛔ 不在这里手写第二份 `工作区/决策`。
  const stale = names
    .filter((name) => /^\d+\.json$/.test(name))
    .filter((name) => {
      const record = readStationDecision(projectId, Number(name.slice(0, -'.json'.length)))
      const at = Date.parse(String(record?.decidedAt ?? ''))
      return Number.isFinite(at) && at > snapshotTime
    })
    .map((name) => `${DECISION_DIR_REL}/${name}`)
  if (stale.length === 0) return { want: 0, moved: 0, misses: [], movedFiles: [] }
  return { ...archiveBookFiles(projectId, stale, `回退-${snapshotSeq}`), movedFiles: stale }
}


function restoreSnapshot(projectId, snapshotSeq, extras = {}) {
  const file = join(snapshotsDir(projectId), `${snapshotSeq}.json`)
  if (!existsSync(file)) throw new Error(`textbook: snapshot ${snapshotSeq} 不存在`)
  const raw = readFileSync(file, 'utf8')
  let snapshot = null
  try { snapshot = JSON.parse(raw) } catch (error) {
    throw new Error(`textbook: 快照 ${snapshotSeq} 损坏无法恢复（${error instanceof Error ? error.message : error}）`)
  }
  const before = readMeta(projectId)
  const events = snapshot.events
  const meta = { ...snapshot.meta }
  // 截断/回退保留用户声音：把截断前的风格线/豁免/未处理留言并回恢复后的 meta（现在优先）。
  mergeUserVoice(readMeta(projectId), meta)
  // 票 09（spec §4.4 第 1 条）：**结论文档跟着归档、⛔ 不原地留**——顺序照深改那一条
  // （先归档、再截账本），不然「账本已经说没拍过」的那一瞬间盘上还留着件。
  const archived = archiveDecisionRecordsAfter(projectId, snapshotSeq, Number(snapshot.time ?? 0))
  // ⚠️ **收口 review · finding 2**：这一跳原先不读返回值，于是单件改名失败时回退照旧算「成功」
  // ——账本被截短（说没拍过）、件却还在原地，正好复现票 09 要治的那种两处真相，下游那一站的
  // 硬闸读的又正是那份**还在**的文件 ⇒ 放行一本「账本说没拍过」的书。现在**不等即抛**：
  // 抛在 `rollbackLedger` 之前 ⇒ 账本、meta、盘上那一件**都原样不动**（与 `gold.js` 那几处
  // 「归档搬不走 ⇒ 当场拒收、这一支一个字节不改」同口径），用户关掉占用它的程序后再点一次即可。
  // ⚠️ 抛在**部分搬成功**的情形下也是可收敛的：搬走的那几件已在 `工作区/_旧版产物/回退-<seq>/`，
  // 重试时 `stale` 现读盘上 ⇒ 它们不再算「该搬的」，于是重试只补搬剩下的那几件。
  if (archived.moved < archived.want) {
    throw new Error(
      `textbook: 回退 ${snapshotSeq} 没有生效——${archived.misses.join('、')} 没能归档`
      + `（要搬 ${archived.want} 件、只搬走 ${archived.moved} 件）。就地把件留下会让下游把一份`
      + '「账本说没拍过」的书当成拍过的书放行；请关掉占用这些文件的程序后重试。',
    )
  }
  // 合法回退：账本截短、账高随之变小（ADR-0016 决策 3）——走 rollbackLedger 这条明文例外。
  // （原先这里还自己写了一次 updatedAt；「最后动静时刻」只归「记一笔」，由下面那条 rollback 事件定。）
  rollbackLedger(projectId, events, meta)
  // ── 票 `flow-audit-2026-10/06`：回退**必须留账**，并且账上要说清「从哪段退到哪段、
  // 归档了哪些产物、谁点的、为什么」。旧实现这里只落 `{snapshot, reason}`（`reason` 还是
  // **建快照**那一刻的理由，不是这次回退的理由），事后查不出「曾写到第五章又退回去」。
  // ⚠️ 事件必须**在 `rollbackLedger` 之后**追加：账本刚被截到快照那一刻，先写就会被截掉。
  return appendEvent(projectId, 'textbook/rollback', {
    snapshot: snapshotSeq,
    reason: snapshot.reason,
    from: { phase: before?.phase ?? null, status: before?.status ?? null },
    to: { phase: meta.phase ?? null, status: meta.status ?? null },
    archived: archived.moved,
    archivedFiles: archived.movedFiles ?? [],
    by: typeof extras.by === 'string' ? extras.by : 'agent',
    note: typeof extras.note === 'string' ? extras.note : '',
  })
}


// ── 关卡折叠 ────────────────────────────────────────────────────────────────

function foldGate(projectId, wanted = null) {
  const events = readEvents(projectId)
  let proposal = null
  let decision = null
  // 最近一次**决策事件**裁的是哪一版（票 workbench-transitions/23）。它与 `decision` 分家：
  // 新提案会把 `decision` 重置为 null（"v3 还没拍板"），但"v2 已经拍过了"是历史事实、不能跟着清。
  let decidedVersion = null
  for (const event of events) {
    // ⚠️ 2026-09-21 修：原来只看「最后一个提案」，于是按 gate 号折叠时全靠运气——
    // 第 1/2 次拍板返回的折叠结果挂着第 3 次拍板的 gate 号，调用方 `folded.gate === gate`
    // 判不等就整条丢掉，decision 一起丢；于是阶段页上「第 1、2 次拍板」永远不显示拍板结论，
    // 只有碰巧是最后一次的那个才显示（用户实测：三张卡只有第三张有「拍板：✅ 通过」）。
    // 现在给了 wanted 就**按 gate 号**折，每张卡各拿自己那一次的提案与结论。
    if (wanted !== null && String(event.data?.gate ?? '') !== String(wanted)) continue
    if (event.type === 'textbook/gate-proposal') {
      proposal = event
      decision = null
    } else if (event.type === 'textbook/gate-decision' && proposal !== null) {
      decision = event
      if (typeof event.data.version === 'number') decidedVersion = event.data.version
    }
  }
  if (proposal === null) return null
  let prevProposal = null
  for (const event of events) {
    if (event.type === 'textbook/gate-proposal'
      && event.data?.gate === proposal.data?.gate
      && event.seq < proposal.seq) prevProposal = event
  }
  const status = decision === null ? 'awaiting' : (decision.data.approved === true ? 'approved' : 'rejected')
  return {
    gate: proposal.data.gate,
    version: proposal.data.version,
    title: proposal.data.title ?? '',
    summary: proposal.data.summary ?? '',
    detail: proposal.data.detail ?? '',
    // 票 `confirm-points-redesign-build/07`：这一版提案带的**结构化值**（可选；第 3 关的
    // `{chapters: N}` 是首个用例）。`gate-decide` 拍板那一刻把它透传进结论件。
    values: proposal.data.values,
    status,
    proposalSeq: proposal.seq,
    // 票 workbench-transitions/23：`version` 是**最新提案**的版次（awaiting 时也照样是新提案），
    // 「定下来的那一版」是最近一次决策事件当时裁决的那个——决策事件自带 `version`（gates.js 落账形状），
    // 记在 `decidedVersion` 上、**不随新提案重置**（v2 已定、v3 在等，两件事都要说得出来）。
    // 两者分家，阶段页的结论行才不会把「正在等拍板」渲染成「已驳回 · 第 M 版」。
    decidedVersion,
    decision: decision === null ? null : {
      seq: decision.seq,
      approved: decision.data.approved === true,
      mode: decision.data.mode ?? null,
      reasons: decision.data.reasons ?? [],
      note: decision.data.note ?? '',
    },
    prevProposal: prevProposal === null ? null : {
      seq: prevProposal.seq,
      version: prevProposal.data.version,
      title: prevProposal.data.title ?? '',
      summary: prevProposal.data.summary ?? '',
    },
  }
}


// ── 项目文件 ────────────────────────────────────────────────────────────────
//
// ⚠️ `workDir`（工作区目录）**不在这里**：它是书夹形状的位置，已搬进 `./engine/paths.js`
// 与 `projectDir`／`timelinePath`／`processLogPath` 同族（票 `context-budget/10` · ADR-0031 决策 1），
// 由下面 `import { … workDir … } from './engine/paths.js'` 取来再从这里再导出——
// **调用点一行未改**，而新形状（产物清单／登记／细目／报告）与它同源，改目录名只有一处要动。

function writeWork(projectId, name, content) {
  const target = workFile(projectId, name)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, content, 'utf8')
}


function readWork(projectId, name) {
  return readFileSync(workFile(projectId, name), 'utf8')
}


// ── 本书自定义模式库（2026-08-21 需求）────────────────────────────────────────
// 用户在工作台粘贴一段教学/结构描述 → AI 分析成「模式卡」→ 写进书夹 模式库/自定义/。
// 第 2 关（模式选型）与金标准写作规范的 brief 会把它连同内置模式库一起交给 AI。
// 只按书生效，不碰 resources/references/patterns/ 共享内置库（demo 模式不动）。

/** 本书自定义模式卡目录（无则建）。 */
function customPatternsDir(projectId) {
  const dir = join(projectDir(projectId), '模式库', '自定义')
  mkdirSync(dir, { recursive: true })
  return dir
}


/** 列出本书已有自定义模式卡（不含索引文件）：[{name,file,title,problem}]。 */
function listCustomPatterns(projectId) {
  const dir = customPatternsDir(projectId)
  const out = []
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.md') || name.toLowerCase() === 'readme.md') continue
    let title = name.slice(0, -3)
    let problem = ''
    try {
      const text = readFileSync(join(dir, name), 'utf8')
      const lines = text.split('\n')
      const head = lines.find((l) => /^#\s+/.test(l))
      if (head !== undefined) title = head.replace(/^#\s*/, '').trim()
      const pi = lines.findIndex((l) => l.includes('解决的教学问题'))
      if (pi >= 0 && lines[pi + 1] !== undefined) problem = lines[pi + 1].trim()
    } catch { /* 读不到就用文件名 */ }
    out.push({ name: title, file: name, title, problem })
  }
  return out
}


/** 自定义模式卡交办素材：把本书自定义模式卡全文内联进 brief（有才返回非空字符串）。 */
export function customPatternsBrief(projectId) {
  const patterns = listCustomPatterns(projectId)
  if (patterns.length === 0) return ''
  const lines = ['', '用户自定义模式（与内置模式库同等地位，必须逐张读完，并在「模式选型」里回答每张对应本书哪个教学问题）：']
  for (const p of patterns) {
    const body = (() => { try { return readFileSync(join(customPatternsDir(projectId), p.file), 'utf8').trim() } catch { return '' } })()
    lines.push(`\n--- 自定义模式卡：${p.title} ---\n${body}`)
  }
  return lines.join('\n')
}


/** 把账上的风格线镜像成 AI 必读的 工作区/style-line.md（写章/审计/交工前读）。 */
function updateStyleLineMirror(projectId) {
  const meta = readMeta(projectId)
  const notes = (meta.styleNotes ?? []).filter((n) => n.status === 'active' || n.status === 'adopted')
  const lines = ['# 风格线（用户对写法的要求，写每一章前必读、逐条落实）', '']
  for (const n of notes) {
    lines.push(`- [${n.status === 'adopted' ? '已落实过' : '生效中'}] ${n.text}${n.note ? `（备注：${n.note}）` : ''}`)
  }
  if (notes.length === 0) lines.push('（还没有风格意见；用户随时可能补充，交章前用 workbench_status 查增量。）')
  writeWork(projectId, 'style-line.md', lines.join('\n') + '\n')
}


/**
 * 「留言销号」的**唯一写入口**（票 `demo-channel-full/10`）。
 *
 * 两个调用者：
 *   · 真书那一头＝`intervene-done` 动作（`src/workflow/actions/collab-signals.js`，由主笔 AI 调）；
 *   · 演示书那一头＝演示支自己的**终检那一趟**（`runPhase6` 的 demo 支）——演示通道没有主笔 AI，
 *     销号这一下只能由**这台机器自己**走（与票 03「章级 `done` 由这台机器自己报」同一档）。
 * ⛔ 别在别处再写一份「改 meta ＋ 记一笔」。
 *
 * @returns {boolean} 真找到并销号了那一条（`false` 时调用方自己决定报不报 404）
 */
export function closeIntervention(projectId, id) {
  let target
  updateMeta(projectId, (state) => {
    target = (state.pendingInterventions ?? []).find((i) => i.id === id)
    if (target === undefined) return
    target.status = 'done'
  })
  if (target === undefined) return false
  appendEvent(projectId, 'textbook/intervention-done', { text: target.text })
  return true
}


/**
 * 「风格线逐条交代去向」的**唯一写入口**（票 `demo-channel-full/10`）。
 *
 * 两个调用者：真书＝`stage-submit(final)` 那一跳（`chapters.js`，**判定仍在那一边做**：
 * 缺去向／非法 status／`conflict` 没写理由／找不到分报告出处，四道都还在那里）；演示书＝
 * 演示支的终检那一趟。本函数只负责**写**——闭包与原先那一跳里的逐字同形（含 `textFieldRaw`
 * 那一格的截断与兜底），写完照旧刷新镜像（`工作区/style-line.md`）。
 *
 * @param {Array<{id: string, status: string, note?: unknown, chapter?: unknown}>} disposals
 */
export function applyStyleDisposals(projectId, disposals) {
  updateMeta(projectId, (state) => {
    for (const d of disposals) {
      const note = (state.styleNotes ?? []).find((n) => n.id === d.id)
      if (note === undefined) continue
      note.status = d.status
      note.note = textFieldRaw(d.note, STYLE_NOTE_REVOKE_NOTE_MAX, typeof d.chapter === 'string' ? `落实于${d.chapter}` : note.note)
    }
  })
  updateStyleLineMirror(projectId)
}


/**
 * 演示书**建档那一刻**注进它自带的那几条协作信号（票 `demo-channel-full/10`）：一条示例留言
 * ＋ 三条示例风格线，并把风格线镜像按生产那一份写出来（`工作区/style-line.md`）。
 *
 * ⚠️ **只补缺的 id**（与 `seedDemoChapterReviews` 同一档）：用户动过的态（销号、收回、翻案）
 * 不许被下一次驱动搬回注入时的样子。
 * ⚠️ 幂等 ⇒ 它可以在别的入口再被调；今天唯一的调用点是 `demo-run` 的**建书支**
 * （`src/workflow/actions/patterns-ops.js`）——那时还没铺章，所以顶栏那两颗键从**第一帧**起就在。
 */
export function seedDemoCollabSignals(projectId) {
  const at = Date.now()
  const interventions = demoInterventions(at)
  const notes = demoStyleNotes(at)
  updateMeta(projectId, (state) => {
    const ivs = Array.isArray(state.pendingInterventions) ? state.pendingInterventions.slice() : []
    for (const entry of interventions) {
      if (ivs.some((i) => i?.id === entry.id)) continue
      ivs.push(entry)
    }
    state.pendingInterventions = ivs
    const list = Array.isArray(state.styleNotes) ? state.styleNotes.slice() : []
    for (const entry of notes) {
      if (list.some((n) => n?.id === entry.id)) continue
      list.push(entry)
    }
    state.styleNotes = list
  })
  updateStyleLineMirror(projectId)
}


/**
 * 「范例章那一跳（`stage-submit gold`）**交过几次工**」——账本里按 label 身份词认，**只有这一份实现**
 * （`goldSealed.version` 读的是同一把尺子）。它答的是「那一跳**走过没有**」，不是「交得对不对」。
 *
 * ⚠️ 判据本体在 `engine/submission.js` 的**范例章档**（身份词从 `STAGE_LABELS.gold` **现取**，
 * 匹配 `includes`，**不查 `outcome`**——那是既有口径，票 `depth-round-3/01` 照实保留）。
 * 这里只取条数；⛔ 不在这里写第二个 label 字面量、也不在这里判「怎么算交过工」。
 */
function goldSubmitCount(projectId) {
  return submissionIndex(readEvents(projectId)).example
}


/**
 * 「这一次定稿没能记下写作规范当前那一版」的**显式**账（票 `premature-announce/05`；
 * 裁决 2026-10-11 第 2 条＝**要显式记一笔**，不分开判、不撤那道放行闸）。
 *
 * 病：范例章那一段的**提前展示是有意的**（`ADR-0034` 裁决甲），于是书可以在**没有走过**
 * `stage-submit gold` 那一跳的情况下被定稿（`gold-approve` 那道就绪判据只看三件产物在不在盘上）
 * ⇒ `styleSpecHash` 永远是 `null`，最后检查那一句对账（`actions/chapters.js` 的
 * `subMeta.styleSpecHash != null && …`）**静默不成立**：照样放行，而「写作规范改过没有」那次对账
 * **没有发生**、账本上一个字都没有 ⇒ 「**有意没做**」与「**漏了**」在账上长得一模一样。
 *
 * 本函数只做一件事：把「这一次没做」显式记一笔，让两者在账上分得开。⛔ 它**不拦人、不改状态、
 * 也不补做那次对账**（「改成审计覆盖当前正文」正是裁决甲明确否决的乙方案）。
 * `check` 说清**哪一件没做**（那次对账），`reason` 说清**为什么没做**，句子说清这是**有意放行**。
 *
 * ⚠️ **触发点只有一个**：{@link sealGoldStandard}——两条定稿路径（`gold-approve` 与 `gold-skip`
 * 自动定稿）共用的那一份沉淀函数，而 `phase 4→5` 也只发生在它后面那两处。
 * **有意不挂在 `actions/chapters.js` 的 `catch` 那一支**（票面原来指的就是那里）：那一支只在
 * 「交工那一跳走过、而当场读不到 `工作区/style-spec.md`」时才响，而票题点名的场景（展示期直接定稿）
 * **那一跳根本没走过**，catch 一次都不会响 ⇒ 事实「该定格而没有定格」只在**定稿那一刻**才是可知的。
 *
 * ⚠️ **演示通道不在面内**（`sealGoldStandard` 里 `demoBook` 那一支跳过它）：那里压根没有
 * `stage-submit gold` 这一跳（不派真小助手、正文由机器写），`styleSpecHash` **每一本演示书**
 * 都是 `null` ⇒ 记这一笔就是每本演示书都响一次，把「例外」变成噪声。
 * ⚠️ **票 `demo-channel-full/16` 复核后换掉了这条的理由**（裁决：**保留**跳过）：原先这里写的
 * 是「也让录制的演示基线当场过期」——**那条已被本 effort 的决定 3 推翻**（这里的改动就是要改演示
 * 产物），⛔ 不许再拿它当理由。今天成立的理由是那句话对演示书**说不通**：它逐字说「交工时读不到
 * 写作规范那一份文件」，而演示书此刻 `工作区/style-spec.md` 就在盘上（`runPhase4` 演示支刚写下），
 * 缺的只是 `stage-submit gold` 那一跳留下的指纹 ⇒ 记它就是响一句**假话**。
 * ⚠️ 跳过的是**这一笔**，不是整个沉淀：演示书的 `meta.goldSealed` ／ `textbook/gold-seal` ／
 * `工作区/style-line.md` 镜像照走（票 16）。
 *
 * @param {string} projectId
 * @param {'never-submitted'|'unreadable'} reason `never-submitted`＝范例章那一跳没有交过工（指纹从未
 *   尝试定格）；`unreadable`＝那一跳走过、而当场读不到写作规范那一份文件（尝试过、没成）。
 */
function noteStyleSpecUnfrozen(projectId, reason) {
  const why = reason === 'never-submitted'
    ? '范例章那一段没有交过工'
    : '交工时读不到写作规范那一份文件'
  appendEvent(projectId, 'textbook/hint', { text: `⚠️ 范例章定稿时没能记下写作规范当前那一版（${why}）：最后检查那次「写作规范改过没有」的对账因此不会发生。这是有意放行（展示期可以直接定稿），不是漏记。`, check: 'style-spec-reconcile', reason })
}


/**
 * 金标准定稿沉淀（票 15④）：把「最佳范例章」尚未撤销的意见转成风格线（`source:'gold'`），
 * 记下金标准母版版本号，落一条 `textbook/gold-seal` 事件——**只负责沉淀，不负责推进状态机**。
 *
 * 从 `actions/gold.js` 的 `gold-approve` 里抽出，因为现在有第二个调用者：`stage-submit gold` 在
 * `gold-skip` 豁免生效时（用户已同意跳过「最佳范例章确认」这道闸门）自动定稿。两条路径共用这一份
 * 沉淀逻辑，不许各写一份（否则「跳过确认」会连风格线一起跳过，等于偷偷放宽了下游判据）。
 *
 * ── 票 `pre-gold-build/08` 的承诺面④（**零未撤销意见的定稿也沉淀**）────────────────────
 * **病**：原来零未撤销意见时直接 `return false` ⇒ `meta.goldSealed` 不写、`textbook/gold-seal`
 * 事件不落 ⇒ 三处承诺面**一个都不出现**（`logEntryText`／`announceText` 的播报句、`ui/chat-desk.js`
 * 的回执、`ui/phase-page.js` 的「✅ 已定稿」），而 gold 段 done 只靠 `workflow.js` 的
 * `goldDone = meta.goldSealed != null || phase >= 5` 兜 ⇒ 用户刚点完「满意，继续写全书」，屏上那一格
 * 还写着「等你过目」——**承诺面（界面播报／状态词）与机器账对不上**（属政策 §1 的边界②）。
 * **处置（票面二选一：补足机制／收敛）＝补足机制**：零意见那一支照写 `goldSealed`（`count: 0`）。
 * ⚠️ 收敛那一支做不到这件事：那三句话**只在沉淀发生时才存在**，改措辞并不能让零意见的定稿说出
 * 「已定稿」——缺的是**记录**，不是措辞。
 * ⚠️ 返回值仍是「真沉淀了没有」，两个调用点照旧丢它（今天零消费者）。
 *
 * ⚠️ **演示通道也在面内**（票 `demo-channel-full/16`，2026-10-15）——原先这里写着
 * 「演示通道不在面内（登记在 `src/demo-exemptions.js` 的 `gold-seal-not-recorded`）」，
 * 理由是「记这一笔会把**人录的**演示基线顶掉」。本 effort 的决定 3 推翻了那条理由
 * （**这里的改动就是要改演示产物**）：演示书的定稿是**真走**的（用户点 `gold-approve` 那一颗键），
 * 定稿发生了而账上没有它 —— 于是演示书上那三条承诺面一条都不出现。⇒ 那句早退删掉，演示书与真书
 * 走**同一处沉淀**（⛔ 不在演示支另写一份），那条豁免随之 `closed`。
 *
 * ⚠️ **本函数里仍留一处演示分支**（见下面 `demoBook` 那一行）：它**只管** `noteStyleSpecUnfrozen`
 * 那一笔——票 16 复核 `premature-announce/05` 的结论是**保留**，但理由换成了「那句话对演示书
 * **不成立**」（它说「交工时读不到写作规范那一份文件」，而演示书此刻 `工作区/style-spec.md`
 * 就在盘上），⛔ 不是「为保基线」。
 */
function sealGoldStandard(projectId) {
  // 只读预检那一份状态今天只喂两件事：演示分叉与写作规范指纹（见下面两处）。真正的沉淀在改法里
  // 对**当场新读**的状态做：两个调用方原先各自把手里的旧状态当参数递进来，写回时把 appendEvent
  // 刚推进的账高一起带回了旧值（参数透传变体，见票 02）。
  const state = readMeta(projectId)
  // ⚠️ `demoBook` 这一支**只管下面那一笔**（写作规范没定格），⛔ **不许**再从这里 `return`：
  // 票 `demo-channel-full/16` 之前那句 `if (state !== null && state.demo === true) return false`
  // 是把演示书连**沉淀一起**跳过（`meta.goldSealed` 不写、`textbook/gold-seal` 不落 ⇒ 三条承诺面
  // 一条都不出现）。今天是「演示书也沉淀，只是不记这一笔」。
  // ⚠️ 写法上**有意**留一个正向的 `state.demo === true`：它是 `DEMO_GUARD_LITERALS` 五个字面量之一，
  // 而这一处是 `src/**` 非注释行里**唯一**的命中——删干净会让 `test-demo-exemptions.mjs` 的
  // 「每个字面量都真的用得着」那一格红（空名单＝那道门少咬一种写法）。
  const demoBook = state !== null && state.demo === true
  // 票 `premature-announce/05`：定稿这一刻写作规范的版本还没记下 ⇒ 最后检查那次对账**不会发生**，
  // 显式记一笔（见 {@link noteStyleSpecUnfrozen}；「有意没做」与「漏了」从此在账上分得开）。
  // ⚠️ 演示书**不记**它：那句话逐字说的是「交工时读不到写作规范那一份文件」，而演示通道从不经
  // `stage-submit gold`——`工作区/style-spec.md` 是 `runPhase4` 演示支直接写下的，就在盘上。
  // 记它就是每本演示书响一句**假话**（本 effort 的「不许说假话」），⛔ 不是因为基线。
  if (state !== null && !demoBook && state.styleSpecHash == null) {
    noteStyleSpecUnfrozen(projectId, goldSubmitCount(projectId) > 0 ? 'unreadable' : 'never-submitted')
  }
  let seal = null
  updateMeta(projectId, (meta) => {
    // ⚠️ 这里**不再**在「零未撤销意见」时早退（票 `pre-gold-build/08`）：零意见的定稿照样沉淀、
    // 照样落 `goldSeal`（`sealed` 为空数组 ⇒ 事件里的 `count: 0`，播报句照实说「0 条」）。
    // 原先那句「预检之后被并发撤销光了 ⇒ 一个字都不改」也一并去掉：那正是「零意见定稿不记账」
    // 这条病在并发下的一条支路，留着它等于留一个静默不记账的入口。
    const sealOpinions = (meta.goldOpinions ?? []).filter((o) => o.status !== 'revoked')
    const sealed = []
    sealOpinions.forEach((o, i) => {
      const kindText = o.kind === 'dislike' ? '不要这种写法' : o.kind === 'drop' ? '不要这类内容' : '要照此修改'
      sealed.push({
        id: `sn-gold-${Date.now().toString(36)}-${i}`,
        text: `${o.target === null ? '' : `${o.target.hint || `第${o.target.para}段`}：`}${kindText}--${o.wish}`,
        at: Date.now(), source: 'gold', status: 'active', note: `来自最佳范例章意见#${i + 1}`,
      })
      o.status = 'applied'
    })
    meta.styleNotes = [...(meta.styleNotes ?? []), ...sealed]
    const goldVersions = goldSubmitCount(projectId)
    meta.goldSealed = { version: Math.max(1, goldVersions), at: Date.now() }
    seal = { version: meta.goldSealed.version, count: sealed.length }
  })
  if (seal === null) return false
  updateStyleLineMirror(projectId)
  appendEvent(projectId, 'textbook/gold-seal', seal)
  return true
}


// ⚠️ `sources/`（原件）**不在本票射程**：`sources/` → `材料/原件/` 是票 `14` 的书夹形状收口，
// 本票一件都不许做（票 `13` 的边界）。所以这里两个目录看起来「一半新一半旧」，那是**预期的**。
function sourcesDir(projectId) {
  const dir = join(projectDir(projectId), 'sources')
  mkdirSync(dir, { recursive: true })
  return dir
}


/** 转换稿目录（`材料/转换稿/`）——票 `13` 从书夹根下平级的一层搬进 `材料/`，段名由 `paths.convertedDir()` 持有。 */
function sourcesMdDir(projectId) {
  return convertedDir(projectId)
}


/**
 * 纯文件名判据：不含任何路径分隔符、不是 `.`／`..`、不是绝对路径（`C:\x.pdf` 也不认）。
 *
 * **删除目标一律先过它**（`removeSourceFile`）。它与 `projectDir` 里的 `PROJECT_ID_RE` 是同一族
 * 东西：一个把「书」钉死在书夹里，一个把「要删的那一份材料」钉死在这本书的 `sources/` 里。
 * ⚠️ 别拿 `resolve` + `startsWith` 代替——那正是 2026-09-26 事故那一族的写法。
 */
function assertPlainFileName(file) {
  const name = String(file ?? '')
  if (name === '' || name === '.' || name === '..' || basename(name) !== name) {
    throw new Error(`不是合法的材料文件名: ${JSON.stringify(file)}`)
  }
  return name
}


/**
 * 删掉一份材料的**原件**（票 `mineru-formats/03` · `CONTEXT.md`「材料缺口」的「删掉这份」那一半）。
 *
 * 为什么原件也要删：用户说「删掉这份」之后，书夹里还躺着那份 PDF 而材料清单里没有它，
 * 就是另一种「屏上说的与盘上做的不是一件事」。**代价是不可逆**，所以 UI 那一侧是两步确认
 * （先「删掉这份」、再「确认删掉？」），这里只保证「删的确实是用户点名的那一格」。
 *
 * ## 三档结局，不是「删掉了没有」一个布尔（code-review ⑤）
 *
 * 原来这里 `unlinkSync` 外面套着一个空 `catch`（注释写着「已尽力」），之后回 `!existsSync(path)`，
 * 于是 unlink 失败（文件被别的进程占用、权限不足）会与「原件本来就不在」**塌成同一个 false**：
 * 调用方照说「原件本来就不在书夹里」，而那一格**照样从清单里消失**——
 * 文件成了没人管的孤儿，用户再也看不到、也再也点不到它。
 *
 * 现在三档各自说各的（判据只有这里一份，调用方不许自己再 `existsSync` 一遍）：
 *   · `'deleted'` —— 真删掉了；
 *   · `'missing'` —— 原件本来就不在盘上（**不是失败**，用户要的结局已经成立）；
 *   · `'failed'`  —— **在盘上却删不掉**：如实带出原因，调用方据此把那一格**留在清单上**
 *     并告诉用户「删不掉、可以重试」，不许静默摘掉。
 *
 * @param {string} projectId 书号（`projectDir` 的 `PROJECT_ID_RE` 限定）
 * @param {string} file 纯文件名（**先过 `assertPlainFileName`**，请求体里的名字另需命中
 *                       `meta.sources` 那一格——判据在 `actions/convert.js` 的 `assertRemovableSource`）
 * @returns {{outcome: 'deleted'|'missing'|'failed', error?: string}}
 */
export function removeSourceFile(projectId, file) {
  const name = assertPlainFileName(file)
  const path = join(sourcesDir(projectId), name)
  if (!existsSync(path)) return { outcome: 'missing' }
  // ⚠️ 刻意**只**用 unlinkSync 摘这一个文件：递归 `fs.rmSync` 对含中文的路径在 Windows 上
  // 原生崩溃（见 removeTree 头部），文件级删除用 unlinkSync 是本模块既有的安全做法。
  try {
    unlinkSync(path)
  } catch (error) {
    // 删不掉就说删不掉——**不回 `false`**（那个值会被读成「本来就不在」，于是清单那一格
    // 静默消失、文件变孤儿）。失败原因原样带出去，用户看得到也能据此重试。
    return { outcome: 'failed', error: String(error instanceof Error ? error.message : error) }
  }
  // unlinkSync 说成功但文件还在（罕见：网络盘/占用竞态）同样算「删不掉」，不许报成功。
  if (existsSync(path)) return { outcome: 'failed', error: '删除之后它仍在盘上（可能被别的程序占用）' }
  return { outcome: 'deleted' }
}


/**
 * 归档保留份数：每种产物只留**最近这么多份**归档，更早的在下一次归档时清掉
 * （票 `pipeline-wiring-gaps/08` 的「归档件不再只进不出」）。取 10 是「够回看、又不至于让
 * `工作区/` 无界长胖」的折中：一次驳回只多两件，用户真要回看十份之前的报告，回退（快照）那条路
 * 才是正经去处。
 *
 * ⚠️ 票 `depth-review-2026-10/04`：它原先住在 `actions/gates.js`，而保留策略只被**探查**那一条
 * 驳回链调用——另外四条「驳回→重做」路径的归档是**只进不出**的（`_旧版产物/` 随重做次数单调长胖）。
 * 现在它随 {@link archiveWorkArtifacts} 上移到这一处，六条路径共用同一份策略（搬家之后
 * `actions/gates.js` 一个字节的保留逻辑都不留）。
 */
const ARCHIVE_KEEP = 10


/**
 * 归档清理的越界守卫（也是删除点唯一的放行判据）：只认 `工作区/_旧版产物/` **直接**底下、
 * 形如 `<产物名>.<base36 毫秒时间戳>` 的**文件**。定点修改写下的 `深改-<id>/` 目录、
 * 别的族（最佳范例章/章节安排/重置重做）写下的归档，以及 `工作区/` 原位的产物都不在射程内。
 */
function assertArchiveEntry(name, entry, archive) {
  if (entry === '.' || entry === '..') return false
  if (entry.includes('/') || entry.includes('\\') || entry.includes('..')) return false
  if (!entry.startsWith(`${name}.`)) return false
  if (!/^[0-9a-z]+$/.test(entry.slice(name.length + 1))) return false
  const target = join(archive, entry)
  try {
    return dirname(target) === archive && statSync(target).isFile()
  } catch {
    return false
  }
}


/**
 * 归档保留策略：每种产物只留最近 `keep` 份，更早的在**下一次**归档时清掉。
 * 返回 `{ removed, failed }`（清掉几件 / 没清掉几件）——清理失败要能报出来，不能无声吞掉。
 * 导出是为了让测试**直调**这份策略（与 `gateMismatchError` 同一做法：不复制第二份判据）。
 *
 * ⚠️ 票 `depth-review-2026-10/04`：原先叫 `trimExploreArchive` 并住在 `actions/gates.js`
 * （只有探查那一条链用它）。**改名换家**的理由是它本来就与「探查」无关：它管的是
 * `_旧版产物/` 这个目录的**通用**保留策略，现在 {@link archiveWorkArtifacts} 每次都调它。
 */
function trimArchive(archive, names, keep = ARCHIVE_KEEP) {
  let entries = []
  try { entries = readdirSync(archive) } catch { return { removed: 0, failed: 0 } }
  let removed = 0
  let failed = 0
  for (const name of names) {
    const copies = entries
      .filter((entry) => assertArchiveEntry(name, entry, archive))
      // 时间戳是 base36 的毫秒数：按**数值**排才是时间先后（按字符串排在位数变化时会错）。
      .map((entry) => ({ entry, at: Number.parseInt(entry.slice(name.length + 1), 36) }))
      .sort((a, b) => b.at - a.at)
    for (const copy of copies.slice(keep)) {
      try {
        unlinkSync(join(archive, copy.entry))
        removed += 1
      } catch {
        failed += 1
      }
    }
  }
  return { removed, failed }
}


/**
 * 把一批产物搬进 `工作区/_旧版产物/` ——「驳回 → 重做」这条链上**唯一一份「归档成没成」的判据**。
 *
 * ## 为什么它是一个原语而不是六段内联循环
 *
 * 同一个用户动作（驳回 → 重做 → 旧产物归档）在仓里原先有**两套失败语义**：探查那一条修成
 * 「逐件记成败、任一件没搬走就 409」，另外五条（最佳范例章三处、章节安排一处、宿主重启后的
 * 重做标记）是「尽力归档 ＋ 静默 `catch {}`」。后果是用户可见的：旧稿留在原位 ⇒ 下一轮把旧产物
 * 当新结果读走 ⇒ **重做从未真正发生**，而屏上没有任何异常、用户写的驳回意见还被打上「已带给 AI」。
 * 判据收敛到这一处之后，「成功／缺席／失败」三档**只此一份**（与 {@link removeSourceFile} 同形）。
 *
 * ## 三档结局（与 `removeSourceFile` 同一套词汇，判据同一份）
 *
 *   · `'deleted'` —— 原件**已从原位搬走**（归档成功；名字沿用删除族那一档：源路径上它确实没了）；
 *   · `'missing'` —— 原位本来就没有这一件（**不是失败**：调用方要的结局已经成立，重做可以照走）；
 *   · `'failed'`  —— **在盘上却搬不走**（被占用、权限、目的端坏掉）：如实带出错误原文，
 *     调用方据此**当场拒收**（409）并把这一件点名报给用户。
 *
 * ⚠️ 逐件尝试、逐件记账：一件失败**不**让后面的件停手，所以一次失败可能留下**部分搬走**的局面。
 * 这是从探查那条加固版逐字继承下来的形状（那里也是这么做的），调用方拿到非空 `misses` 就必须
 * 拒收——用户看到的是「这一次重做没生效 ＋ 是哪几件没搬走」，再点一次时 `'missing'` 的件会被跳过、
 * 剩下的接着搬。
 *
 * ⚠️ 每次调用都会跑一遍保留策略（{@link trimArchive} ＋ {@link ARCHIVE_KEEP}）——这是
 * 「六条路径都走它」的全部含义：不这么收，`_旧版产物/` 仍会随重做次数无界长胖。清理失败
 * **不影响**这一批的结局（多留几份旧件不是重做失败），读数在 `trimmed` 里。
 * ⚠️ **这一批有 `misses` 时不跑保留策略**（收口订正，见下面那一行的注释）：失败的那一次连
 * 「清早先的旧件」都不做，与旧加固版的顺序逐字一致。
 *
 * @param {string} projectId 书号（`projectDir` 的 `PROJECT_ID_RE` 限定）
 * @param {Array<string|{name: string, rel: string}>} artifacts 要归档的产物：
 *   · 裸名（`explore.md`）—— 书夹 `工作区/` 底下那一件；
 *   · `{ name, rel }` —— `rel` 是**书夹相对路径**（票 11 起精读细目住在 `工作区/细目/`，
 *     `workFile` 对它恒 miss）。`name` 同时是归档件名与保留策略的归堆键。
 * @returns {{items: Array<{name: string, outcome: 'deleted'|'missing'|'failed', error?: string}>, misses: string[], trimmed: {removed: number, failed: number}}}
 *   `misses` 是「在盘上却没搬走」那一档的**点名文本**（`<名>（<错误原文>）`）——判据只有这一份，
 *   调用方直接把它拼进 409 的文案里，别自己再遍历一遍 `items`。
 *   ⚠️ 返回值里**没有** `archive`／`stamp`：收口 review 的规范轴 #7 实测全仓零消费者
 *   （`git grep -n "\.archive\b|\.stamp\b" src` 只命中别的 `archive.meta`），是臆测出来的通用性，
 *   已删（要归档目的地／那一次的时间戳，调用方自己从 `workDir`／`Date.now` 算得出来）。
 */
/**
 * 范例章的**旧稿清单**（谈判桌稿页签数据）——唯一出处（票 `confirm-points-redesign-build/08`
 * 从 `workflow.js` 那段内联实现搬来，⛔ 不许有第二份）。
 *
 * 形状：`工作区/_旧版产物/` 里**这一章**归档的旧稿，按时间戳升序——`{version, path, at}`，
 * `version` 1 基；当前稿号 ＝ 这份清单 `.length + 1`（见 {@link goldDraftVersionOf}）。
 *
 * ⚠️ **两处形状陷阱**（都踩过，改这一段前先读）：
 *   ① `chapterName` 返回的是**文件名**、不是正则片段——里面那个 `.` 不转义的话，
 *      `chapter-07Xmd.abc` 也会被认成一份旧稿；
 *   ② 它**已经含 `.md`**，所以后面只能接 `\.` ＋ 时间戳，再写一次 `\.md` 会变成
 *      `chapter-07\.md\.md\.…`，于是**一份旧稿都认不出来**（整族静默失效）。
 *      `String.replace` 只换第一处，而 `chapter-NN.md` 里恰好只有一个 `.`——改形状时要重核这一句。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：只认 `_旧版产物/` **直接**底下、章号等于
 * `goldChapterNo(meta)`（缺省第 1 章）的那些件；别的章的归档件、子目录里的件都不算。
 */
export function goldDraftsOf(projectId, meta) {
  try {
    const archive = join(workDir(projectId), '_旧版产物')
    if (!existsSync(archive)) return []
    const goldRe = new RegExp(`^${chapterName(goldN(meta)).replace('.', '\\.')}\\.([0-9a-z]+)$`)
    return readdirSync(archive)
      .flatMap((name) => { const m = goldRe.exec(name); return m === null ? [] : [{ name, at: parseInt(m[1], 36) }] })
      .sort((a, b) => a.at - b.at)
      .map((d, i) => ({ version: i + 1, path: `工作区/_旧版产物/${d.name}`, at: d.at }))
  } catch {
    return []
  }
}

/**
 * 范例章**现在是第几稿**（1 基）＝归档旧稿数 ＋ 1。
 *
 * 两个消费者：① `/textbook/events` 的 `goldDraftVersion`（谈判桌稿页签）；② 站 8 结论件
 * `决策/08.json` 的 `proposal.version`（「指回那一章的正文 ＋ 第几稿」）。
 * ⛔ 两处不许各数一遍——派生只此一处（`goldDraftsOf` 的 `.length + 1`）。
 */
export function goldDraftVersionOf(projectId, meta) {
  return goldDraftsOf(projectId, meta).length + 1
}

/**
 * 书夹内的**归档改名**——票 `confirm-points-redesign-build/09` 起，**深改与回退同走这一处**
 * （spec §4.4：两条路都要求「结论文档跟着归档、⛔ 不原地留」；⛔ 不新造第二套规则）。
 *
 * 形状：`工作区/_旧版产物/<stampName>/` 底下**摊平命名**（`工作区/决策/02.json`
 * → `工作区__决策__02.json`）——与 `actions/deep-modify.js` 原先那一圈逐字同形，只是收进一处。
 *
 * 「尽力归档」的语义照旧：单件搬不动就跳过**继续搬下一件**——但结果要**如实报出来**
 * （收口 review · finding 2：两个调用方原先都不读返回值 ⇒ 单件改名失败静默留在原地，
 * 正好复现票 09 要治的「账本说没拍过、件却还在」）。
 *
 * ⚠️ **枚举面**：`want` 数的是**盘上真该搬的件数**（不在盘上的不算，与下面那句 `continue` 同一口径）
 * ⇒ 缺件不会把自己算成失败；`moved < want` 与 `misses` 非空**互为充要**。
 *
 * @param {string} projectId
 * @param {string[]} rels 书夹**相对路径**清单（盘上没有的自然跳过）
 * @param {string} stampName 归档子目录名（`深改-<id>` ／ `回退-<seq>`）
 * @returns {{ want: number, moved: number, misses: string[] }}
 *   `want` ＝ 盘上真该搬的件数；`moved` ＝ 真搬走的件数；`misses` ＝ 改名失败、**仍留在原地**
 *   的那几件（书夹相对路径，按 `rels` 原序）——报错时点名用。
 */
function archiveBookFiles(projectId, rels, stampName) {
  const stampDir = join(workDir(projectId), '_旧版产物', stampName)
  mkdirSync(stampDir, { recursive: true })
  let want = 0
  let moved = 0
  const misses = []
  for (const rel of rels) {
    const from = join(projectDir(projectId), ...String(rel).split('/'))
    if (!existsSync(from)) continue
    want += 1
    try { renameSync(from, join(stampDir, String(rel).replace(/\//g, '__'))); moved += 1 } catch { misses.push(String(rel)) }
  }
  return { want, moved, misses }
}


function archiveWorkArtifacts(projectId, artifacts) {
  const bookRoot = projectDir(projectId)
  const work = workDir(projectId)
  const archive = join(work, '_旧版产物')
  // `mkdirSync` 在 try 之外（它抛就是 500，本来就响）——与探查那条加固版同一取舍。
  mkdirSync(archive, { recursive: true })
  const stamp = Date.now().toString(36)
  const names = []
  const items = []
  for (const entry of artifacts) {
    const artifact = typeof entry === 'string' ? { name: entry, rel: null } : entry
    const name = String(artifact.name)
    const rel = artifact.rel == null ? null : String(artifact.rel)
    names.push(name)
    const target = rel === null ? workFile(projectId, name) : join(bookRoot, ...rel.split('/'))
    if (!existsSync(target)) {
      items.push({ name, outcome: 'missing' })
      continue
    }
    try {
      renameSync(target, join(archive, `${name}.${stamp}`))
      items.push({ name, outcome: 'deleted' })
    } catch (error) {
      items.push({ name, outcome: 'failed', error: String(error instanceof Error ? error.message : error) })
    }
  }
  // ⚠️ 保留策略**只在这一批没有 misses 时**才跑（票 `depth-review-2026-10/04` 收口订正）：
  // 探查那条链的加固版原顺序就是「先判 `archiveMisses`、再 `trimExploreArchive`」（取样：
  // `git show 5adde8d:src/workflow/actions/gates.js`——`if (archiveMisses.length > 0) { …409… }`
  // 在 trim 那一行**之前**）。原语第一版把 trim 放在 misses 判定**之前**，于是**归档失败**时也会
  // 顺手清掉超保留份数的归档件——那是这一版与旧顺序之间唯一的行为差量，已按旧顺序收回。
  // 「其余调用点的保留策略仍然生效」不受影响：成功的调用点照旧每次都跑（这正是本票要的收敛）。
  const misses = items.filter((item) => item.outcome === 'failed').map((item) => `${item.name}（${item.error}）`)
  const trimmed = misses.length > 0 ? { removed: 0, failed: 0 } : trimArchive(archive, names, ARCHIVE_KEEP)
  return { items, trimmed, misses }
}


// ── 状态机运行器 ────────────────────────────────────────────────────────────

const runners = new Map() // projectId -> Promise

const gateWaiters = new Map() // projectId -> { gate, version, resolve }

const parents = new Map() // projectId -> { handle }


/**
 * 自动唤醒主对话 AI，把当前 pendingStage 的任务交给它（真实模式专用）。
 * 消息以「工作台提示」形式出现在对话流（source: plugin + notice），
 * 不冒充用户说话；AI 被唤醒后按人设流程：status → stage-brief → 干活 → 交工。
 */
function wakeMainAI(ctx, projectId) {
  const meta = readMeta(projectId)
  if (meta === null || meta.demo === true) return false
  const sessionId = meta.session
  if (typeof sessionId !== 'string' || sessionId === '') return false
  const agent = ctx.get('agents')?.get?.(sessionId)
  // ⚠️ 票 walkthrough-fixes/01（走查 P41）：这条原来是**无声**的 return false。注册表里
  // 根本没有这本书的会话时（宿主刚重启、agent 还没起来），调用方拿到的也只是「没叫醒」，
  // 没有任何一条线索指向「为什么」。这里补一条 warn：现场日志里能直接看到是「注册表里没有
  // 那个会话」，而不是再去猜是权限、是来源校验还是别的地方出的错。
  if (agent === undefined) {
    ctx.logger.warn(`textbook: 唤醒主 AI 失败：agents 注册表里没有会话 ${sessionId}（项目 ${projectId}）`)
    return false
  }
  // 交办唤醒消息是给人看的（CONTEXT.md：机器以 plugin+notice 注入对话流，不冒充用户），
  // 所以这里用界面词；账本里那条 stage-start 仍记机器 label（见 handoff，机器身份词不动）。
  const label = stageLabelHuman(stageLabel(meta.pendingStage, meta.pendingGate ?? null))
  const text = [
    `【工作台派任务 · ${label}】`,
    `这本书的「${label}」轮到你来做了。`,
    '1. 先调用 workbench_status 看真实状态（项目、阶段、待办、抽查意见）。',
    '2. 再调用 workbench_act（action=stage-brief）领取这一步的任务说明、写作方法与产物要求。',
    '3. 按说明完成（可亲手做，也可派小助手分头干）；过程中用 workbench_act（action=progress）随时上报进度。',
    '4. 完成后调用 workbench_act（action=stage-submit）交工；机器验货合格才会继续下一步。',
    '铁律：先用大白话告诉用户你要做什么，再动手；需要用户拍板的事绝不自作主张。',
  ].join('\n')
  const message = noticeMessage({
    idPrefix: 'tb-task',
    text,
    summary: `工作台：轮到 AI 动手（${label}）`,
  })
  try {
    agent.followup(message)
    return true
  } catch (error) {
    // 极少数宿主版本对 plugin+notice 来源校验严格：回退成普通 user 来源再试一次。
    ctx.logger.warn(`textbook: 唤醒主 AI（工作台提示来源）失败，回退 user 来源: ${String(error instanceof Error ? error.message : error)}`)
    try {
      agent.followup({ ...message, source: { kind: 'user' } })
      return true
    } catch (error2) {
      ctx.logger.warn(`textbook: 唤醒主 AI 彻底失败: ${String(error2 instanceof Error ? error2.message : error2)}`)
      return false
    }
  }
}


/**
 * 交办：记账 pendingStage → 记事件 → 快照 → 唤醒主 AI。
 * 幂等由调用方保证（runPhase 先查 pendingStage 是否已设）。
 *
 * `snapshotReason`（票 pipeline-wiring-gaps/08）：快照的 `reason` 是回退轴上唯一可读的字。例行交办一律写
 * 「交办「X」之前」；**驳回触发的重做**要给一句能分得开的措辞（探查驳回的那次交办也是
 * `stage='explore'`，不另给措辞就在回退轴上与第一次交办长得一模一样）。
 * 不给就沿用例行措辞，所以既有 10 处调用一个字都不用改。
 */
function handoff(ctx, projectId, stage, gate = null, snapshotReason = null) {
  updateMeta(projectId, (meta) => {
    meta.pendingStage = stage
    meta.pendingGate = gate
    meta.wakeToken = (meta.wakeToken ?? 0) + 1
    meta.status = 'running'
  })
  const label = stageLabel(stage, gate)
  const artifact = artifactDataForStage(stage, gate, goldN(readMeta(projectId)))
  appendEvent(projectId, 'textbook/stage-start', {
    stage, gate, label,
    path: artifact.path,
    chapter: artifact.chapter,
  })
  try {
    writeSnapshot(projectId, snapshotReason ?? `交办「${stageLabelHuman(label)}」之前`)
  } catch { /* 快照失败不影响交办 */ }
  return wakeMainAI(ctx, projectId)
}


/**
 * 交办 + demo 通道自驱动：**确认闸门放行/驳回之后**动作层该调的那一个口（票 depth-review-2026-10/07）。
 *
 * 为什么需要它：demo 与真实的唯一 seam＝内容来源（本文件头部自述）。真实书交办完由主 AI 接着推进，
 * demo 书**没有主 AI 可唤醒**——`wakeMainAI` 对 `meta.demo === true` 直接早退返回 false，于是
 * `pendingStage` 挂在那儿、状态机没人推。所以**交办之后得有人推**的那一族动作——确认闸门放行/驳回
 * （`gates` / `gold` / `resume`），以及「把书翻回 running 再交办」的入账动作（`chapters` 的提意见）
 * ——一律必须走这个口，由演示占位通道自己把下一步做出来。原先这个判据在 `actions/` 里抄了七份
 *（每份自带一段理由注释），新增确认动作时最容易漏抄或抄歪；判据与理由收在此处一处。
 *
 * ⚠️ **「七份」是历史份数，不是今天的处数**：走这个出口的地方会随票增长（票 `demo-flow-fidelity/05`
 * 把 `chapters.js` 的**过目态提意见**与**机器空闲时提意见**两处原本裸调 `handoff` 的也改了进来
 * ⇒ 处数 **7 → 9**）。今天的处数由 `test-flow-transitions-chapters.mjs` 的 G5 结构闸数着
 * （票 `test-chain-latency/04` 之前它在 `test-flow-transitions.mjs` 里）——它同时是
 * 「有人又裸调 `handoff`」（demo 书停死在 `running`）与「有人把 kick 堆在手边」（真书多吃一趟
 * 状态机；`kick` 不幂等）这两件事的警报，**本注释不另记一份会腐烂的账**。
 *
 * 判据是两个合取项，**第二个承重**：`woke === false` 的原因不止 demo 一个（meta 读不出、sessionId
 * 非法、`agents` 注册表里没有这本书的会话、两次 followup 都失败，见 wakeMainAI 各早退），只看 woke
 * 会把那些真书也拖去补 kick——那等于凭空多驱动一趟状态机。所以要求 `meta.demo === true` 才补。
 * 另一个承重点：**只读当场状态**（`readMeta` 现读），不收调用方那份局部拷贝——原先那七份拷贝的读取时刻
 * 各不相同，而语义上「交办之后的状态」只有现读才对。
 *
 * `drive: false` 是**刻意不补 kick** 的出口。理由写在定点修改那一族自己那里（`actions/deep-modify.js`）：
 * 它把待办直接写回 `meta.pendingStage` 再单独唤醒，**既不 handoff 也不 kick**——kick 会让状态机从
 * 账本重推导（可能落错段），handoff 会追加 stage-start 事件、破坏「10 分钟内可一键撤销」的
 * 「账面无新进展」守卫。
 *
 * @returns handoff 的返回值（= wakeMainAI 的 woke），调用方需要时自取。
 */
function handoffAndDrive(ctx, projectId, stage, gate = null, snapshotReason = null, options = {}) {
  const woke = handoff(ctx, projectId, stage, gate, snapshotReason)
  if (options.drive === false) return woke
  const meta = readMeta(projectId)
  if (woke === false && meta !== null && meta.demo === true) void kick(ctx, projectId)
  return woke
}


/**
 * 章级流水线阶段的**唯一写入口**（票 `demo-channel-full/03`）：把「第 N 章现在走到哪一步」写进
 * `meta.chapterPipeline[n-1] = { stage, updatedAt }`。
 *
 * ## 为什么要有它（而不是各写各的）
 *
 * 这一格原先**只有一处写点**：`progress` 动作里那个 `updateMeta` 闭包（真书的主笔 AI 上报进度时走它）。
 * 演示通道不上报 `progress`，于是那一格在演示书里**恒空**，界面只能走「从事件流现推」的兜底。
 * 票 `demo-channel-full/03` 让演示支也落这一笔 ⇒ 那句「拼数组 ＋ 写 meta」就变成了**两份口径**
 * （这正是本仓反复治过的形状）。⇒ 抽成这一个出口，真书那一跳与演示支那几步**共用它**。
 *
 * ## 形状是契约的一部分
 *
 * 数组**按章号 0 基定位**，缺的位补 `null`（⛔ 不是跳过）：所以「第 3 章报了、第 2 章还没报」在盘上
 * 仍是**长度 3** 的数组——界面按 `pipeline[n-1]` 直读（`src/workflow.js` 的 `pipelineStage`、
 * `src/ui/stage-step-model.js` 的 `chapterPipelineStage`、`src/ui/chapters-map.js` 的徽章各一处）。
 *
 * ## ⛔ 它**不**判阶段合法性
 *
 * `stage` 是不是那五个枚举值，判据的单一出处是 `domain-rules.progressFieldProblem`
 * （`progress` 动作在调本函数**之前**已经判过；票 `pre-gold-build/12` 立的口径）。
 * 本函数再判一次就是**第二份判据**——那一份必然与第一份漂。演示支那几步写的是**它自己真走过**的
 * 阶段（见 `demoWriteChapters`），不是从外部输入来的，所以也不需要过那道输入闸。
 *
 * @param {string} projectId
 * @param {number} chapterN 1 起的章号（不是正整数＝不落账，返回 `false`）
 * @param {string} stage 章级阶段（`CHAPTER_PROGRESS_STAGES` 里的取值）
 * @returns {boolean} 落了没有
 */
export function recordChapterStage(projectId, chapterN, stage) {
  const n = Number(chapterN)
  if (!Number.isSafeInteger(n) || n < 1) return false
  // ⚠️ 先落成局部量再进闭包：闭包里的形参名不许与外面的函数名／其它局部量撞（票 08 的实撞：
  // 撞名把**函数对象**写进了 meta，真书交工当场 500「could not be cloned」——只有真跑才逮得住）。
  const stageValue = String(stage)
  updateMeta(projectId, (state) => {
    const pipeline = Array.isArray(state.chapterPipeline) ? state.chapterPipeline.slice() : []
    while (pipeline.length < n) pipeline.push(null)
    pipeline[n - 1] = { stage: stageValue, updatedAt: Date.now() }
    state.chapterPipeline = pipeline
  })
  return true
}


/**
 * 某一章的「字数兜底 / 实际汉字数」读数（**只读盘、不写**）——票 `word-budget-ineffective/02`。
 *
 * 交工闸门、章节面板与交付清单三处都读这一份：⛔ 别处再拼「读 chapter-NN.md ＋ countHanzi」
 * 或「targetWords ?? meta.targetWords ?? 6000」（`docs/测试信任边界.md` 总纲第 3 条：
 * 「与 X 同一口径」这句自称必须由同一份实现兑现）。
 *
 * - `wordsFloor`：`domain-rules.chapterWordsFloor`（两处都没填 ⇒ `null`，不判）；
 * - `actualHanzi`：正文不在／读不到 ⇒ `null`（**不写 0**——「没读到」与「读到 0 个汉字」是两件事）；
 * - `floor` 为 `null` 时**仍然读** actual：章节面板要显示「这本书没设兜底 · 实际 N 汉字」。
 *
 * @param {string} projectId 书夹 id
 * @param {number} n 1 基章号
 * @param {object|null} [meta] 已读的账本（避免同一跳重复读盘）
 * @param {string|null} [chapterText] 调用方已经读到的正文（交工那一跳用它省掉第二次读盘）
 * @returns {{ wordsFloor: number|null, actualHanzi: number|null }}
 */
function chapterWordReading(projectId, n, meta = null, chapterText = null) {
  const current = meta ?? readMeta(projectId)
  let actualHanzi = null
  if (typeof chapterText === 'string') {
    actualHanzi = countHanzi(chapterText)
  } else {
    const { chapterPath } = chapterArtifacts(projectId, n)
    try { actualHanzi = countHanzi(readFileSync(chapterPath, 'utf8')) } catch { /* 不在／读不到就留 null，不编数字 */ }
  }
  return { wordsFloor: chapterWordsFloor(current, n), actualHanzi }
}


function chapterDone(projectId, n, meta = null, events = null) {
  return chapterGateMiss(projectId, n, meta, events) === null
}


/** 该章「机器记下的交工通过」——只认账本里已存在的机器证据，**不按文件存在兜底**。
 *
 * 判据（两选一，都是写入点早就存在的事件）：
 *  ① **章级交工**：`textbook/agent-end` 且 `outcome === 'ok'`，label 里的**第一处章号**＝该章号；
 *  ② **最佳范例章那一章**：`goldN(meta)` 那一章由「最佳范例章」这一步写的就是该章正文。
 *
 * ⚠️ 判据本体在 `engine/submission.js` 的章档；本函数只取事实（`goldN(meta)`）再问那一个谓词，
 * ⛔ 不重写 label 匹配。⚠️ 它**住 facade**：要 `readEvents` 兜底；`engine/stage-facts.js` 不读账本
 * （决策 8），只接收算好的那一枚布尔。
 */
function chapterHasSubmitEvent(projectId, n, meta = null, events = null) {
  const gold = goldN(meta ?? readMeta(projectId) ?? {})
  return submitted(submissionIndex(events ?? readEvents(projectId)), { chapter: n, gold })
}


/**
 * 过目闸门「全部章节都写好了」的单章判据（票 14，**界面数字与闸门共用这一份**，不许写第二份）：
 *  ① 两份产物存在（`工作区/chapter-NN.md` ＋ `工作区/audit-NN.md`，今天已有）；
 *  ② **检查记录不比正文旧**（票 22：正文在审计之后又改过 ⇒ 那份审计审的是旧稿，「审过」当场失效）；
 *  ③ 该章有机器记下的「交工通过」（见 chapterHasSubmitEvent）；
 *  ④ 该章**没有未处置（`status === 'pending'`）的抽查意见**——这条是票 10「翻案 → 这本书重新被拦住」
 *     的服务端一半：翻案把意见写回 `pending` 之后，**即使该章早就交工过**，过目闸门也必须重新拦住它。
 *
 * ⚠️ ② 是**验货**那一半，不是显示那一半（票面 :48-53）：没被审过的正文带着「已审过」进合并、
 *  进交付，比「清单没刷新」严重一个量级。而它必须落在这里——界面的「已完成 X/Y 章」与章徽章
 *  取的就是这一份（票 14 的同源不变量），写在别处就是「两个数字打架」的老病复发。
 *
 * 老书/在建书不新造迁移：某章没交工就重新走既有逐章交工（`stage-submit chapters` 那个写入点在），
 * **不退回到「按文件判」兜底**（不变量 2）。
 */
/**
 * 同一份判据的「差在哪一项」形态（**不重复判据，只给结论起个名**）：
 * 满足返回 `null`，不满足返回 `{ reason: 'artifact' | 'stale' | 'review' | 'submit', state: … }`——
 * `chapters-review-confirm` 闸门要据此说清「是产物缺、还是审的是旧稿、还是该章有未处置意见、还是压根没交工」。
 * 四项与 chapterDone 一一对应，顺序也一致。
 *
 * ⚠️ **`state` 是四档环节状态**（`missing`／`stale`／`unconfirmed`／`ready` · ADR-0031 决策 4），
 * 由 `domain-rules.stageStateOf` **算**出来 —— `reason` 是给闸门报错用的旧词，四档状态是给
 * 界面与注入面用的（票 `02` 的注入触发词表取的就是那一档）。**这里不新造判据**：
 * 本函数只负责取事实（产物在不在／审计对不对得上／人工确认到位没有／交工记下没有），四档由那一个函数给。
 */
function chapterGateMiss(projectId, n, meta = null, events = null) {
  const current = meta ?? readMeta(projectId)
  // 交工那一枚事实由本文件算（它要 `readEvents`；新子模块自己不读账本，决策 8）。
  const submitRecorded = chapterHasSubmitEvent(projectId, n, current, events)
  // 判档入口仍在**本文件**这一处：新子模块只回四个布尔（票 04 的单出处判据按这一点断）。
  const state = stageStateOf({ ...chapterFacts({ projectId, meta: current, submitRecorded }, n) })
  return state.reason === null ? null : { reason: state.reason, state: state.state }
}


/**
 * 某一章的**环节状态**（四档，纯派生）——服务端／前端／注入面都读它（只此一份）。
 * @returns {{state: string, reason: string|null}}
 */
export function chapterStageState(projectId, n, meta = null, events = null) {
  return chapterGateMiss(projectId, n, meta, events) ?? { state: 'ready', reason: null }
}


/** 播报上下文：appendEvent 播报主对话用的唯一跨切面依赖。
 *  显式契约：仅 apply 调 bindAnnounce 绑定一次；未绑定时不播报（只进项目时间线）。 */
let announceCtx = null


function bindAnnounce(ctx) {
  announceCtx = ctx
}



/** 主 AI 上下文占用的读数口（票 28 / 走查 P46）：领任务说明要带上它，好让主笔 AI 知道自己该收尾了。
 *
 *  数据源是宿主自己算的那份 `contextPressure` **会话投影**——与宿主输入区角标
 * 「上下文已用 51%」同一份数据。本模块**不 import 任何宿主包**，读数由宿主侧经
 * `bindContextOccupancy` 注入（同 `bindAnnounce` 的显式契约：只有 apply 绑一次）。
 *
 *  绑定方给的 reader 形状：`(sessionId) => number | null`，返回**占用百分比**。
 * 百分比算式只有一份，在 `src/domain-rules.js` 的 `contextOccupancyPercent`
 * （`src/ui/rules.js` 只是再导出；逐字照宿主 `contextOccupancy()`）。
 * 本模块 import 的**就是那同一个模块**（领域规则模块被 esbuild 打进前端、也被 node ESM
 * 后端直接 import，这是它被选为这一份的理由），所以不重算不是「没法共享」，
 * 抄第二份算式才是本仓在治的病（同一件事两份实现 → 改一处必漏两处）。
 *
 *  ⚠️ 未绑定 / reader 抛错 / 返回的不是有限数 → 一律 null，
 * brief 里那一句**整句不出现**（绝不写 0%、绝不编一个百分比）。 */
let contextOccupancyReader = null


function bindContextOccupancy(reader) {
  contextOccupancyReader = typeof reader === 'function' ? reader : null
}


/** 当前会话的主 AI 上下文占用百分比；读不到就是 null（界面/brief 都照此不显示）。 */
function readContextOccupancy(sessionId) {
  if (contextOccupancyReader === null) return null
  if (typeof sessionId !== 'string' || sessionId === '') return null
  let percent
  try {
    percent = contextOccupancyReader(sessionId)
  } catch {
    return null // 读数是辅助信息，读不到不许把领任务说明整个带崩
  }
  return Number.isFinite(percent) ? percent : null
}


/** 领任务说明里那一句（只在读得到数时出现）。
 *  给主笔 AI 看的口径与界面上那一句同源：这是**计量**、不是状态词（CONTEXT.md 三词上限不动）。 */
function contextOccupancyBriefLine(sessionId) {
  const percent = readContextOccupancy(sessionId)
  if (percent === null) return null
  return `上下文已用 ${percent}%（主 AI 这一场的上下文用量，只增不减；上下文满了会压缩正在追的活、还没落账的结论，必要时请用户早点介入：暂停、砍章节、提前过目）。`
}


async function disposeParent(projectId) {
  const entry = parents.get(projectId)
  if (entry === undefined) return
  parents.delete(projectId)
  try { await entry.handle.dispose() } catch { /* 尽力而为 */ }
}


/** 惰性创建父代理（真实模式派生子代理用）。 */
async function getParent(ctx, projectId, _meta) {
  const cached = parents.get(projectId)
  if (cached !== undefined) return cached.handle.agent
  let provider = 'deepseek-official'
  let model = 'deepseek-v4-flash'
  try {
    const defaultModel = ctx.get('agentDefaultModel')
    if (defaultModel !== undefined) {
      const resolved = typeof defaultModel.currentSelection === 'function'
        ? defaultModel.currentSelection()
        : defaultModel
      if (resolved?.provider !== undefined) provider = resolved.provider
      if (resolved?.model !== undefined) model = resolved.model
    }
  } catch { /* 保持默认 */ }
  const handle = await ctx.agents.create({
    sessionId: `textbook-${projectId}`,
    meta: { cwd: projectDir(projectId), origin: 'subagent' },
    agentOptions: { provider, model },
  })
  parents.set(projectId, { handle })
  return handle.agent
}


function projectRuntime(ctx, projectId, meta) {
  return {
    ctx,
    demo: meta.demo === true,
    dir: projectDir(projectId),
    project: meta,
    getParent: () => getParent(ctx, projectId, meta),
  }
}


/** 提案正文的一级标题（人读：《工作区/方案/关卡N-vX.md》的第一行）。
 *  文件名与路径是**机器身份词**（不改，锚定它的正则见 domain-rules 的提案白名单）；
 *  但这一行标题是写给人读的（判定线②），所以走界面词模板。导出以便用词不变量断言直调
 *  真实产出函数（票 01），不在测试里复制模板字符串。 */
export function proposalHeading(gate, version, title) {
  return `# ${gateHuman(gate)} · 方案 v${version}：${title}`
}


/** 关卡方案落盘为可读文档（工作区/方案/关卡N-vX.md）。 */
function writeProposalDoc(projectId, gate, version, title, summary, detail) {
  try {
    const dir = proposalDir(projectId)
    writeFileSync(
      join(dir, `关卡${gate}-v${version}.md`),
      `${proposalHeading(gate, version, title)}\n\n## 摘要\n\n${summary}\n\n## 完整方案\n\n${detail}\n`,
    )
  } catch { /* 文档失败不影响主流程 */ }
}


/**
 * 提交关卡提案（状态机内部与 action 共用）。
 *
 * ⚠️ 票 `confirm-points-redesign-build/07`：多接一格**可选**的 `values`（这一站的结构化值，
 * 如第 3 关的 `{chapters: 10}`）。它随提案进账本，拍板那一刻由 `gates.js` 的 `gate-decide`
 * 透传给 `recordStationDecision()` 写进 `工作区/决策/06.json`。
 * ⛔ **没有值的站不写这个键**（与结论文档那条「不填 `null` 占位」同一口径）。
 */
function proposeGate(projectId, gate, title, summary, detail, values) {
  writeProposalDoc(projectId, gate, 1, title, summary, detail)
  const snapshot = writeSnapshot(projectId, `提交「${gateHuman(gate)}」方案之前`)
  const event = appendEvent(projectId, 'textbook/gate-proposal', {
    gate, version: 1, title, summary, detail,
    ...(values === undefined ? {} : { values }),
  })
  void snapshot
  return event
}


function proposeRevision(projectId, gate, version, title, summary, detail, values) {
  writeProposalDoc(projectId, gate, version, title, summary, detail)
  writeSnapshot(projectId, `修订「${gateHuman(gate)}」方案 v${version} 之前`)
  return appendEvent(projectId, 'textbook/gate-proposal', {
    gate, version, title, summary, detail,
    ...(values === undefined ? {} : { values }),
  })
}


function advance(projectId, fromPhase, toPhase) {
  // 先落「阶段结束」再改状态、最后落「阶段开始」：原先「改状态 → 整份写回旧状态 → 记一笔」的顺序
  // 每次阶段推进都必产一个重号（票 02 的机制一）。现在状态改在 updateMeta 里（不碰账高），
  // 两笔事件的序号都来自「记一笔」自己那份当场新读。
  if (fromPhase !== undefined) {
    appendEvent(projectId, 'textbook/phase-end', { phase: fromPhase, label: PHASE_LABELS[fromPhase] })
  }
  updateMeta(projectId, (meta) => {
    meta.phase = toPhase
    meta.status = 'running'
  })
  appendEvent(projectId, 'textbook/phase-start', { phase: toPhase, label: PHASE_LABELS[toPhase] })
}


function waitForGateDecision(projectId, gate, version) {
  return new Promise((resolve) => {
    gateWaiters.set(projectId, { gate, version, resolve })
  })
}


/**
 * 兑现这一次拍板：`gateWaiters` 里那笔的 `(gate, version)` **逐字对上**时兑现并清掉；否则什么都不做。
 *
 * ⚠️ 票 `deep-module-scan/10`：`gateWaiters` 的 `{gate, version, resolve}` 三字段协议**原先横跨两个文件**——
 * engine 写、`actions/gates.js` 读（那里直接 `.get()` 出来、比对两个字段、再 `.resolve()`）。
 * 那意味着**协议的两半都没有声明它**，而 `gates.js` 必须知道 `resolve` 这个字段名才能兑现它。
 * ⇒ 收回成这一个函数后，**协议只活在 engine 内**，调用方只说「兑现 project 上这一次的拍板」。
 * 只有一个 implementation，所以**不造 seam**——只是把跨文件的形状收回来。
 */
function resolveGateDecision(projectId, gate, version) {
  const waiter = gateWaiters.get(projectId)
  if (waiter === undefined || waiter.gate !== gate || waiter.version !== version) return false
  gateWaiters.delete(projectId)
  waiter.resolve()
  return true
}


/**
 * 这一本书此刻有没有状态机在跑。
 *
 * ⚠️ 票 `deep-module-scan/10`：原先两个调用点各自直接 `runners.has(project)` 当「别起第二个状态机」
 * 的判据（`actions/convert.js` 与 `workflow.js`），**那条判据的含义只活在它们的注释里**。
 * 收回成具名的一格后，判断的来由写在名字上，而不是靠两处注释各自解释一遍。
 *
 * ⚠️ **但 `runners` 这个 Map 仍然导出**，不是忘了收：`books.js` 删书时要 `runners.delete(project)`
 * （那是清理，与「有没有在跑」不是一回事），`test-material-gap-stance.mjs` 的 `settleRunner`
 * 要**拿到那个 promise 去 await**——它要的不是布尔，是那一条。
 */
function isRunning(projectId) {
  return runners.has(projectId)
}


/** 「正文里有乱码（U+FFFD）」的**同一份判据**：阶段一转换稿与阶段六成品共用。
 *
 *  ⚠️ 票 `flow-audit-2026-10/02` 的明令：阶段一推进前的转换稿内容检查与 `runQualityChecks`
 *  的「成品无乱码（U+FFFD）」**不许各写一套阈值**。这里只判「出现即不合格」——与阶段六那一格
 *  逐字同一个条件（不是「成规模才算」，也不是比例阈值）。 */
function hasReplacementChar(text) {
  return String(text).includes('\uFFFD')
}


/** 阶段一推进前的**内容级**检查（票 `flow-audit-2026-10/02`）。
 *
 *  病：旧推进条件只读 `meta.sources[].converted === 'ok'` 这个**声明**——`full.md` 不在、
 *  0 字节、整份乱码、原件已删，四种坏法全都 `advanced`。下游阶段二拿到一份读不到的
 *  `full.md`，两边都不报错。
 *
 *  这里逐份对 `converted:'ok'` 的源做四维检查（缺件／空／乱码／原件不在），返回
 *  `[{ file, why, detail }]`；调用方据此把源转 `failed`、**不推进**，并逐份点名。
 *  ⚠️ 只查 `ok` 的源：`pending` 会被转换、`failed` 已有既有的「补传／删掉」出口。
 *
 *  @param {string} projectId
 *  @param {Array<object>} sources `meta.sources`
 *  @returns {Array<{file: string, why: string, detail: string}>}
 */
function convertedSourceProblems(projectId, sources) {
  const problems = []
  for (const source of sources) {
    if (convertedState(source) !== 'ok') continue
    const file = typeof source?.file === 'string' && source.file !== '' ? source.file : '（未命名的材料）'
    const original = join(sourcesDir(projectId), file)
    if (!existsSync(original)) {
      problems.push({ file, why: '原件不在', detail: `原件不在盘上（${file}）` })
      continue
    }
    const rel = typeof source?.md === 'string' ? source.md.trim() : ''
    if (rel === '') {
      problems.push({ file, why: '缺件', detail: '没有记下转换稿路径（full.md）' })
      continue
    }
    const full = join(sourcesMdDir(projectId), rel)
    if (!existsSync(full)) {
      problems.push({ file, why: '缺件', detail: `转换稿不在盘上（${rel}）` })
      continue
    }
    let text = ''
    try {
      text = readFileSync(full, 'utf8')
    } catch (error) {
      problems.push({ file, why: '缺件', detail: `转换稿读不出来（${rel}：${error instanceof Error ? error.message : String(error)}）` })
      continue
    }
    if (text.trim() === '') {
      problems.push({ file, why: '空', detail: `转换稿是空的（${rel}）` })
      continue
    }
    if (hasReplacementChar(text)) {
      problems.push({ file, why: '乱码', detail: `转换稿里有替换字符 U+FFFD（${rel}）` })
    }
  }
  return problems
}


/** 把阶段一的内容级坏源转成 `failed` 并让书停在 error；返回给用户逐份点名的话。 */
function markConvertedSourceFailures(projectId, problems) {
  const detail = problems.map((problem) => `${problem.file}（${problem.why}：${problem.detail}）`).join('；')
  const message = `这些材料的转换稿不合格：${detail}。请补传这一份，或删掉这份材料后再继续。`
  updateMeta(projectId, (state) => {
    for (const problem of problems) {
      const target = (state.sources ?? []).find((source) => source?.file === problem.file)
      if (target !== undefined) target.converted = 'failed'
    }
    state.status = 'error'
    state.lastErrorHuman = message
  })
  appendEvent(projectId, 'textbook/error', { task: '材料', message })
  return message
}


async function runPhase1(_ctx, projectId, meta) {
  // Phase 1：等待材料 → 逐份转换（MinerU）→ 全部完成推进 Phase 2
  const sources = meta.sources ?? []
  if (sources.length === 0) {
    // 票 09：退役「教材 PDF」。⚠️ `docs/协作模型.md` 的 B53 锚点逐字记着这句，改这里必须同改那张表。
    appendEvent(projectId, 'textbook/hint', { text: '请先上传材料（工作台向导）' })
    return 'waiting'
  }
  // 上次转换可能中途中断（宿主重启）留下卡死的 converting 标记：清掉，从头继续。
  if (meta.converting === true) {
    updateMeta(projectId, (state) => { state.converting = false })
  }
  // 逐本转换，全部转完才进下一阶段（此前只转一本就停，是 bug）。
  // ⚠️ 每一轮**重新读状态**：这一支原本一路握着开工时那份旧状态（转换要 await，期间账本/状态都在动），
  // 收尾时整份写回＝累积性回退（把账高拉回开工时的值，票 02 的真账本第 94 行就是这么来的）。
  for (;;) {
    const current = readMeta(projectId)
    const currentSources = current?.sources ?? []
    // 三值枚举的读法一律经 domain-rules.convertedState（单一真相源；老书布尔只读归一，不回写）。
    const pending = currentSources.filter((source) => convertedState(source) === 'pending')
    const failedSources = currentSources.filter((source) => convertedState(source) === 'failed')
    if (pending.length === 0) {
      // 推进条件（票 `mineru-formats/02` · ADR-0028 决策 1/3）：**没有 pending 也没有 failed** 才推进。
      // 只判 pending 是不够的——失败源会被留在一本「已进 Phase 2」的书里，
      // 于是 brief 指向一份**根本不存在**的 `材料/转换稿/…/full.md`（静默读不到，两边都不报错）。
      if (failedSources.length === 0) {
        // ── 票 `flow-audit-2026-10/02`：**推进前读转换稿本身**，不只读 `converted:'ok'` 声明 ──────
        // 旧条件只证明「转换那一刻报过 ok」：full.md 不在／0 字节／整份乱码／原件已删，四种坏法
        // 全都会推进到阶段 2。这里逐份做四维内容检查（与阶段六无乱码同一份判据），不合格的源转
        // `failed`、书停在阶段 1，走既有的「补传这一份／删掉这份」出口——⛔ 不静默推进。
        const okSources = currentSources.filter((source) => convertedState(source) === 'ok')
        const contentProblems = convertedSourceProblems(projectId, okSources)
        if (contentProblems.length > 0) {
          markConvertedSourceFailures(projectId, contentProblems)
          return 'error'
        }
        // ── 票 `confirm-points-redesign-build/15`：**站 1（材料就绪）的写点** ─────────────────────
        // spec §3.2 站 1 的「落点」＝`工作区/决策/01.json`（`proposal.file = null`：阶段 1 今天
        // **零派单零正文**）；§4.1 逐字「**从站 1 起各一份**」——这是那条链的起点（站 8 那一趟要指的
        // `工作区/决策/07.json` 就串在它下游）。⛔ 形状只走票 01 那一个统一写点：九个键 ＋
        // 「没有值的站不写 `values`」，本处一个字都不拼第二份。
        // ⚠️ **落点就是这一行**：上面那句「没有 pending 也没有 failed」是「材料就绪」在盘上的定义
        //（推进条件与它同一处，见 `mineru-formats/02` · ADR-0028 决策 1/3）⇒ 站 1 的结论件与推进
        // 共用一个前提，⛔ 不另设第二个「就绪」判据（那正是「一处真相」要防的形状）。
        // ⚠️ 票 `decision-provenance/01`：这一站是**机器工序**跑完那一刻、不是某一次点击 ⇒
        // 显式落 `decidedBy:'machine'`（D1=A 的闭集只有 human／machine）。⛔ 不许再靠「缺省＝human」
        // 把机拍签成人拍——那正是这张票要修的「判据声称的强度 ≠ 实现强度」。
        // 它不是「被跳过」，所以**不写** `autoSkipped`／`skipReason`；这两个键只给真的被越过的站。
        recordStationDecision(projectId, 1, { approved: true, decidedBy: 'machine', proposal: null })
        advance(projectId, 1, 2)
        return 'advanced'
      }
      // 停在材料准备，**这一轮不重传任何东西**（票面的反证：failed 源下一轮不会被挑中）。
      // 置 error 是为了不留「状态永远 running 却什么都不说」的空档——屏上照旧是那张既有的
      // 错误卡（它读 `lastErrorHuman`，就是上一轮那句批次口径的人话）。
      //
      // 票 `mineru-formats/03`（ADR-0028 决策 3）把「表过态」那一层补在这一格之下：
      // 每一份 `failed` 都要用户**逐个**表态，两个出口各走各的真路径——
      //   · 补传：同名重传（`handleUpload` 把那一格置回 `'pending'`）→ 下一轮真的重转；
      //   · 删掉：契约动作 `source-remove`（`actions/convert.js`）把那一格从 `meta.sources` 摘掉。
      // 两条都改 `meta.sources`，所以「逐个表态完才准推进」这件事**由这一行自己兑现**：
      // 只要还剩任何一格 `failed`，本函数就既不重传也不推进。
      updateMeta(projectId, (state) => { state.status = 'error' })
      return 'error'
    }
    const source = pending[0]
    const sourcePath = join(sourcesDir(projectId), source.file)
    if (!existsSync(sourcePath)) {
      updateMeta(projectId, (state) => { state.status = 'error' })
      appendEvent(projectId, 'textbook/error', { task: '材料', message: `源文件缺失: ${source.file}` })
      return 'error'
    }
    updateMeta(projectId, (state) => { state.converting = true })
    // 批量转换全部待转原件（一次提交并行解析；每份结果按 file_name 落到独立子目录）。
    const startedAt = Date.now()
    // ⚠️ 票 09 裁决：**账本 label 一个字不改**——`批量转换 N 本 PDF` 是机器身份词，
    // 同面先例见 CONTEXT.md「界面用词表」章级完成行（账本 label 照旧、界面走 `stageLabelHuman`）。
    // 这里也正是 `docs/协作模型.md` 的 B55 锚点逐字钉着的那一串。
    appendEvent(projectId, 'textbook/agent-start', { label: `批量转换 ${pending.length} 本 PDF` })
    try {
      const items = pending.map((item) => {
        const index = currentSources.indexOf(item)
        // 票 07：剥**已知**扩展名（`MINERU_KNOWN_EXTENSIONS` 那一份），不再手抄 `/\.pdf$/i`——
        // 受理闸门放开后原件可以是 docx/pptx/图片，那份手抄的后缀会原样留在转换稿目录名里
        // （`01-讲义.docx`），而 PDF 那一半继续被剥掉，同一批里两套命名口径。
        // 剥已知 ≠ 只认 PDF：`讲义.txt`（名单外，本仓压根进不来）原样留着。
        const sub = `${String(index + 1).padStart(2, '0')}-${sanitizeFolderName(stripKnownExtension(item.file)).slice(0, 24)}`
        return {
          file: join(sourcesDir(projectId), item.file),
          name: item.file,
          outDir: join(sourcesMdDir(projectId), sub),
          sub,
        }
      })
      const results = await convertPdfBatch(items, { formula: meta.science === true }, (stage) => {
        // ⚠️ 票 09 记一笔事实：`data.file` 是**死字段**——`src/ui/view-rules.js` 的转换活动行
        // 只读 `data.stage`，从不读 `data.file`。这里改「本→份」纯属账本内一致性，用户零感知。
        appendEvent(projectId, 'textbook/mineru-progress', { file: `${pending.length} 份`, stage })
      })
      const failed = results.filter((result) => result.ok !== true)
      // F26（2026-08-20）：记录人话错误文案（mineru-lib 已把页数超限/Token 失效归一成人话），前端 error 卡直接展示。
      // 票 09：判定线①（error 卡原样渲染 message），数材料说「份」。
      const humanMessage = failed.length === 0
        ? null
        : `${failed.length} 份转换失败：${failed.map((f) => `${f.name}（${f.error ?? '未知错误'}）`).join('；')}`
      // 转换结果写回**当场新读**的那份（按文件名找条目，不按开工时那份数组的下标）。
      // 三个结局都落到**同一个** `converted` 字段（票 `mineru-formats/02`）：
      // 成功写 'ok'（并记下转换稿相对路径），失败写 'failed'——失败源就是**第三态**，
      // 于是它既不会被下一轮重新挑去重传，也不会被推进条件当成「已经转完了」。
      updateMeta(projectId, (state) => {
        state.converting = false
        for (const result of results) {
          const target = (state.sources ?? []).find((s) => s.file === result.name)
          if (target === undefined) continue
          if (result.ok !== true) {
            target.converted = 'failed'
            continue
          }
          const item = items.find((it) => it.name === result.name)
          if (item === undefined) continue
          target.converted = 'ok'
          target.md = join(item.sub, 'full.md')
        }
        if (humanMessage !== null) {
          state.lastErrorHuman = humanMessage
          state.status = 'error'
        }
      })
      if (humanMessage === null) {
        // 票 09 裁决：与 :1524 的 agent-start 同一面——账本 label 一个字不改（B55 锚点逐字钉着）。
        appendEvent(projectId, 'textbook/agent-end', { label: `批量转换 ${pending.length} 本 PDF`, outcome: 'ok' }, Date.now() - startedAt)
      } else {
        appendEvent(projectId, 'textbook/error', {
          task: '转换',
          message: humanMessage,
        })
        return 'error'
      }
    } catch (error) {
      const message = String(error instanceof Error ? error.message : error)
      // F26（2026-08-20）：同上，把人话错误落 meta.lastErrorHuman（旧账本读取时 ?? null 兜底）。
      updateMeta(projectId, (state) => {
        state.converting = false
        state.status = 'error'
        state.lastErrorHuman = message
      })
      appendEvent(projectId, 'textbook/error', {
        task: '转换',
        message,
      })
      return 'error'
    }
  }
}


/** 真实模式：源探查交办给主 AI；演示模式：内置回放（共用产物判定/推进语义）。 */
/** 幂等置态 + 提示（状态没变就不重复写账/发提示）。真实与演示共用。
 *  ⚠️ 原先它还收一个 `meta` 参数——9 个调用方里 5 个递的是自己手里那份**旧状态**（长跑期间拿的），
 *  写回时把账高一起带回旧值（参数透传变体，票 02）。现在它自己去读，参数透传这个形状没有了。 */
function ensureStatus(projectId, status, hint) {
  let changed = false
  updateMeta(projectId, (meta) => {
    if (meta.status === status) return
    meta.status = status
    changed = true
  })
  if (changed && hint !== undefined) appendEvent(projectId, 'textbook/hint', { text: hint })
}


/** 演示模式统一步进：agent-start → 生成 → agent-end → 后续（置态/推进）。
 *  真实模式由主 AI 经 stage-brief/stage-submit 完成（见各 runPhaseX）；
 *  demo 是内置回放适配器，只做内容编排，状态机步进与真实共用 ensureStatus/advance/recordAgentError。 */
async function demoStep(ctx, projectId, meta, label, exec, after) {
  const runtime = projectRuntime(ctx, projectId, meta)
  const artifact = artifactDataForLabel(label, goldN(meta))
  const startedAt = Date.now()
  appendEvent(projectId, 'textbook/agent-start', { label, path: artifact.path, chapter: artifact.chapter })
  try {
    await exec(runtime)
    appendEvent(projectId, 'textbook/agent-end', { label, outcome: 'ok', path: artifact.path, chapter: artifact.chapter }, Date.now() - startedAt)
    if (after !== undefined) return await after(runtime)
    return 'advanced'
  } catch (error) {
    return recordAgentError(projectId, label, error)
  }
}


/**
 * **「此刻还有几个小助手在跑」**——只数个数，不碰它们。
 *
 * ⚠️ 它**不**进任何「就绪」判据（见 {@link exploreArtifactProblems} 的窄处）：`activity === 'running'`
 * 只表示那条子会话的记录还在会话库里活着（**驻留但空闲**也算），不表示「在写」；拿它当就绪判据会造出
 * 「小助手跑挂了就永远不齐」的死锁。它进两处：**卡上的活性文案**、**重做/归档前的那道闸**
 * （票 `premature-announce/01`；此前唯一消费者是 `pause`）。
 *
 * 形状取自随代码入库的契约快照 `docs/reference/dsh-subagent-contracts.md`：子代理条目的字段是
 * **`id`**（宿主**没有** `childId` 这个字段），活性位是 `activity`——`'running'` 表示这条子会话的
 * 记录还在会话库里活着，`'inactive'` 表示只剩磁盘上的记录。⚠️ 这个数**含编排脚本成员**。
 *
 * 数不出来时返回 `null`（「不知道」，不是 0）。**「数不出来」有两条路，都归到下面那个 `catch`**：
 * ① 宿主服务缺席（`ctx.subagents` 没挂、或它没有 `listDescendants`）——可选链短路成 `undefined`，
 *   这里的 `?? null` **刻意不写成 `?? []`**（折成 `[]` 就与「确实为 0」不可区分，票 10），
 *   紧接着的缺席守卫抛错；② `listDescendants` 调用真的抛错。
 * 这一层 try/catch **是会执行的**守卫——调用方不许因为一条附注而失败。
 * ⚠️ 消费它的两处都按「`null` ＝ 不知道 ⇒ **不拦人**」处置：`null` 不是「有人在跑」。
 *
 * ⚠️ 它**不**收回任何小助手：`ctx.subagents.interrupt` 在本仓是登记过的**禁读**成员
 * （`dev/host-contract-gate/catalog/web-chat.js` 的 `forbiddenMemberReads`；边界写在
 * `actions/collab-signals.js` 那一族注释里）——收回小助手是主笔 AI 自己的事。
 *
 * @returns {Promise<number|null>} 在跑的小助手个数；数不出来时 null
 */
export async function countRunningSubagents(ctx, sessionId) {
  try {
    // 「数不出来」不许折成 `[]`（票 host-contract-gate/10）：折成 `[]` 会让「服务缺席」与
    // 「确实一个都没在跑」变成同一个 0，主笔 AI 分不开。折成 `null` 后由下面那次守卫抛错，
    // 与「调用真的抛错」走同一条出口——`catch` 是缺席的唯一出口（改前它对这一支是死代码）。
    const children = await ctx?.subagents?.listDescendants?.(sessionId) ?? null
    if (children === null) throw new Error('宿主小助手服务缺席：ctx.subagents.listDescendants 不可用')
    return children.filter((child) => child?.activity === 'running').length
  } catch (e) {
    ctx?.logger?.warn?.(`textbook: 没数出小助手个数（记 null 不记 0）: ${String(e instanceof Error ? e.message : e)}`)
    return null
  }
}


/**
 * 盘上那份**材料判定产物**（`工作区/材料判定.json`，票 `pre-gold-build/01`）——读**一次**、读不出就 `null`。
 *
 * ⚠️ 「读不出」有三种形状，**一律折成 `null`**（都不算「判定合格」）：文件不在、不是严格 JSON、
 * 或 JSON 不是对象。区分它们没有下游用途——判据对这三种的处置是同一句「产物不在或读不出」，
 * 而「到底哪儿坏了」由人打开那个文件看（判断比这里猜准）。
 */
function readMaterialJudgment(projectId) {
  const path = workFile(projectId, MATERIAL_JUDGMENT_NAME)
  if (!existsSync(path)) return null
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'))
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}


/**
 * **判定小助手那一趟的读物**（票 `pre-gold-build/01`）：逐份转换完成的源现读现抽——
 * `{headChars, materials: [{n, file, md, head, headings, unreadable?}]}`。
 *
 * 「机器只做两个纯机械动作」（每份转换稿的开头 N 字符 ＋ `^#{1,6} ` 标题行清单）那一半的**口径**
 * 住在 `domain-rules.materialSurveyReadings()`（纯函数）；这里只负责**读盘与代填路径**
 * （`md` 这一栏与 `brief.parallelReads[].md` 同一份写法：`材料/转换稿/<md>`）。
 *
 * ⚠️ **读不出的那一份照实标**（`unreadable: true`）：抽不到就说抽不到，⛔ 不许拿一段空片段
 * 冒充「这份材料开头是空的」——那两句在判定小助手眼里是两件事（同 spec §4.2 ③「抽不到标题行是正常分支」）。
 *
 * @param {string} projectId
 * @param {object|null} [meta] 调用方手里那份状态；不递就自己读
 * @returns {{headChars: number, materials: Array<{n: number, file: unknown, md: string, head: string, headings: string[], unreadable?: true}>}}
 */
export function materialSurveyInput(projectId, meta = null) {
  const state = meta ?? readMeta(projectId)
  const dir = sourcesMdDir(projectId)
  const materials = okMaterialShards(state?.sources).map(({ n, source }) => {
    const md = `材料/转换稿/${source.md}`
    let text = null
    try {
      text = readFileSync(join(dir, String(source.md ?? '')), 'utf8')
    } catch {
      text = null
    }
    if (text === null) return { n, file: source.file, md, head: '', headings: [], unreadable: true }
    const { head, headings } = materialSurveyReadings(text, MATERIAL_SURVEY_HEAD_CHARS)
    return { n, file: source.file, md, head, headings }
  })
  return { headChars: MATERIAL_SURVEY_HEAD_CHARS, materials }
}

/**
 * 「合并件在不在」的**唯一**答案（票 `graph-read-one-answer/08`，`R-03`＝C）。
 *
 * 判据一句话：**读到了原文（`text !== null`）或读盘本身失败（`error !== null`）⇒ 在。**
 *
 * - **件不在盘**：`text === null` 且 `error === null` ⇒ 不在（与 `existsSync` 一致）。
 * - **读盘失败** ⇒ **在**（本票要改的那一档）：`EACCES`／`EISDIR` 是文件在盘、`existsSync` 为 `true`
 *   却读不出来；`existsSync` 与 `readFileSync` 之间那个 `ENOENT` 竞态是文件刚被搬走——两者对这两处
 *   判据的答案都与 `existsSync` 那一瞬间的读数等价（「算在」，⛔ 不折成「不在」）。
 * - **坏 JSON／`[]`／`42`／不是对象**：原文拿到了（`text !== null`）⇒ 在（与今天一致；⛔ 别拿
 *   `map` 当这句，那会把「读不出」也改成拦，是另一条强度变更）。
 *
 * 为什么读失败算「在」：这两处判据的本意是「机器在交工那一刻落过这份件没有」，不是「内容合不合法」；
 * 把 `EACCES` 折成「不在」会比 `existsSync` 更强，与 `R-03`＝C 的裁定相反。
 *
 * @param {string} projectId
 * @returns {boolean}
 */
function mergedMapPresent(projectId) {
  const read = readMergedMap(projectId)
  return read.error !== null || read.text !== null
}


/**
 * **源探查的就绪判据（全仓唯一一份）**：盘上那几件产物齐了吗？
 *
 * ## 它治的病：早宣告
 *
 * 状态机把「工序中途出现的那**一件**产物」当成「这一步做完了」，于是对用户宣告了一件还没发生的事。
 * 2026-10-10 实跑（`抑郁患者自救`）：那张卡在 `13:58:23.543` 跳出，而 5 件产物**一件都不存在**、
 * 两个精读小助手都还在跑——卡比真就绪早 **4 分 29 秒**，而且那一刻点「满意」会 200 并把书推过这一段，
 * 于是只在交工成功支里诞生的 `工作区/knowledge-map.json` **永久缺位**（回去的路又被 pendingStage 闸焊死）。
 *
 * 三处消费**同一份**：**置态**（{@link runPhase2} 真实支）、**放行**（`explore-confirm` 那座闸）、
 * **交工验货**（`stage-submit explore`）——⛔ 不许任何一处另抄一份枚举（票 `dev-gate-scan/17` 那条纪律）。
 *
 * ## 报错措辞与交工验货逐字同一份
 *
 * 交工那一跳直接拿 `problems[0]` 当 400 文案 ⇒ 这里改一个字，那条 400 也跟着改
 * （`test-explore-handoff-content.mjs` 锚着「探查报告缺必做项：… 」那一句）。所以别在这里另写人话。
 *
 * ## 窄处（判据声称的强度＝实现强度）
 *
 * 它只断「**在不在、能不能拼、形状对不对**」——分片内容真假、知识点抽得准不准仍归真机层与抽查那一面；
 * 也**不看**「还有几个小助手在跑」（`activity === 'running'` 只表示会话还在，不表示在写；
 * 拿它当就绪判据会造出「小助手跑挂了就永远不齐」的死锁）。小助手数只进两处：卡上的活性文案、
 * 重做/归档前的那道闸。
 *
 * ⚠️ **票 `pre-gold-build/01` 加进来的那一件**（`工作区/材料判定.json` 那条硬闸）**不是**另一份判据：
 * 它的口径住在 {@link materialJudgmentProblems}（`domain-rules`），这里只读盘 ＋ 接线；
 * 它的窄处（只验覆盖与枚举合法、零源书不要求、读盘上那一份、不管多出来的号）
 * 逐条写在那一处，⛔ 不在这里复述一份会漂的第二版。⚠️ 票 `demo-channel-full/11` 起**演示书也在射程内**
 * （那条说它「演示通道没有生产者」的豁免已关闭）；⚠️ 票 `demo-channel-full/12` 起**分片／细目那两条
 * 同样在射程内**（演示支真写那两份产物）——**本函数里一处 demo 分叉都没有了**。
 *
 * @param {string} projectId
 * @param {object|null} [meta] 调用方手里那份状态；不递就自己读（⛔ 别递长跑期间拿的旧状态去写回）
 * @param {{atSubmit?: boolean}} [options] **交工那一跳**传 `true`：那时合并件还没诞生（这一跳自己写它），
 *   所以末尾那条「合并件在不在」不判——其余几条**对真书与演示书一视同仁**
 * @returns {{problems: string[], shards: Array<{n: number, map: unknown}>, materialRoles: Map<number, {role: string, basis?: string}>}}
 *   `materialRoles`＝材料判定给的 `num → {role, basis?}` 表（读不出 ⇒ 空表）——交工那一刻并进合并件
 *   `materials[]` 用的就是它（`knowledge-map-assembly.expectedKnowledgeMap()` 的第三个输入），**不是**第二份量法。
 */
export function exploreArtifactProblems(projectId, meta = null, options = {}) {
  const problems = []
  const shards = []
  const state = meta ?? readMeta(projectId)
  if (state === null) return { problems: ['这本书的状态读不出来（账上的 meta 不在）'], shards, materialRoles: new Map() }
  const atSubmit = options.atSubmit === true
  // ⚠️ **票 `demo-channel-full/12` 起这里一处 demo 分叉都没有了**：从前那句
  // `const demoBook = !atSubmit && state.demo === true` 用来把「分片／细目」那两条按 `[]` 跳过
  // （登记在 `src/demo-exemptions.js` 的 `explore-artifact-shards`）。那一票让演示支**真写**
  // 那两份产物（`runPhase2` 的演示支：一片 `工作区/knowledge-map-NN.json` ＋ 一份
  // `工作区/细目/精读-NN.md`，号按 `okMaterialNumbers` 现算），于是那两条对演示书照跑、照过
  // ⇒ 分叉连同那条豁免一起删掉。⛔ **不许把它加回来**——加了之后演示书那两格的盘上事实
  // 就重新变成「机器看不见」，而屏上／盘上那份产物还在，两边各说各话。
  // ⚠️ 材料判定那一条（票 `demo-channel-full/11`）更早就拆过一次，同一条理由。
  // ── 材料判定产物：**只读一次盘**，两个消费点共用同一份 ────────────────────────────────
  // ① 档位的**声明面**（票 `pre-gold-build/03` 的两段式：交工／置态／放行按 AI 声明的角色算档）；
  // ② 末尾那条硬闸（票 01）与回包给调用方的 `num → role` 表（机器并进合并件用的那一份）。
  // ⚠️ 读一次而不是读两次：探查段内**允许改写**这份产物，两次读之间那份文件可能换了——
  // 判据读到哪一份，并进合并件的就是哪一份（`chapters.js` 的 explore 分支只用回包，不再读盘）。
  const materialJudgment = readMaterialJudgment(projectId)
  const materialRoles = materialRoleTable(materialJudgment)
  const exploreText = existsSync(workFile(projectId, 'explore.md'))
    ? readFileSync(workFile(projectId, 'explore.md'), 'utf8')
    : ''
  if (exploreText.trim() === '') {
    problems.push('工作区/explore.md 不存在或为空，请先写好探查报告再交工')
  } else {
    // ⚠️ **第二个输入＝同一份算法的第二个输入**（一份算法三处读、一个定义）：档位按上面的
    // `materialRoles` 重算——⛔ 不在这一处另抄一份「考纲就升档」的词表。
    // ⚠️ 合并期订正（票 02 × 票 03）：`materialRoleTable()` 的值是 `{role, basis?}`（票 02 为让确认卡上的
    // `basis` 有出处扩的），而 `exploreDepthTier` 的第二个输入要的是**角色词的数组** ⇒ 这里必须取 `.role`。
    const exploreTier = exploreDepthTier(state.sources, [...materialRoles.values()].map((entry) => entry?.role))
    const missingItems = exploreTier.required.filter((item) => !exploreText.includes(item))
    if (missingItems.length > 0) {
      problems.push(`探查报告缺必做项：${missingItems.join('、')} —— 工作区/explore.md 要有这几节（本次 ${exploreTier.count} 份转换完成的源 → ${exploreTier.tier}档，必做：${exploreTier.required.join('、')}），小节名照交办说明逐字写，机器按名字找。`)
    }
  }
  const okNumbers = okMaterialNumbers(state.sources)
  const shardMissing = okNumbers
    .filter((n) => !existsSync(workFile(projectId, knowledgeShardName(n))))
    .map((n) => knowledgeShardRel(n))
  if (shardMissing.length > 0) {
    problems.push(`知识地图分片缺失：${shardMissing.join('、')} —— 每份转换完成的材料都要有一片（逐份派精读小助手时由它落盘，机器按这些片拼成 工作区/knowledge-map.json），缺 ${shardMissing.length} 片。`)
  }
  // 票 `flow-audit-2026-10/07`：细目那一条原先只 `existsSync` —— 0 字节细目照样放行（同族 02 的
  // 唯一真泄漏）。这里改成**非空**判定：在盘但去空白后为空 ⇒ 与缺件同档点名。
  const detailMissing = okNumbers
    .filter((n) => {
      const path = join(detailDir(projectId), readingName(n))
      if (!existsSync(path)) return true
      try { return readFileSync(path, 'utf8').trim() === '' } catch { return true }
    })
    .map((n) => readingRel(n))
  if (detailMissing.length > 0) {
    problems.push(`精读细目缺失：${detailMissing.join('、')} —— 每份转换完成的材料都要有一份细目（逐份派精读小助手时由它自己落盘，主笔不用转写），缺 ${detailMissing.length} 份。`)
  }
  const brokenShards = []
  for (const n of okNumbers) {
    let map = null
    try { map = JSON.parse(readFileSync(workFile(projectId, knowledgeShardName(n)), 'utf8')) } catch { map = null }
    if (map === null || typeof map !== 'object' || Array.isArray(map)) brokenShards.push(knowledgeShardRel(n))
    else shards.push({ n, map })
  }
  if (brokenShards.length > 0) {
    problems.push(`知识地图分片读不出（不是严格 JSON 对象）：${brokenShards.join('、')} —— 那一片要按精读契约重写；机器按各片拼合并件，读不出就拼不出这一份。`)
  }
  const shardShapes = shardShapeProblems(shards)
  if (shardShapes.length > 0) problems.push(`知识地图分片形状不对：${shardShapes.join('；')}`)
  // 合并件：机器是它**唯一**的写入者，它在交工成功那一刻才诞生 ⇒ 盘上没有它，就等于这一段还没交工。
  // ⚠️ 交工那一跳自己就是写它的那一跳，所以那一处传 `atSubmit: true`。
  // ⚠️ **问的是「在不在」，不是 `map`**（票 `graph-read-one-answer/05`、`08`）：这一处是**有意的弱判据**；
  // 三档口径（件不在／坏内容／读盘失败）只住 `mergedMapPresent` 一处，⛔ 别在这里复述第二版。
  if (!atSubmit && !mergedMapPresent(projectId)) {
    problems.push('知识地图还没生成（工作区/knowledge-map.json 不在）—— 它由机器在主 AI 交工那一刻按分片拼装；盘上没有它，说明这一段还没交工')
  }
  // ── 票 `pre-gold-build/01`：**材料判定产物**（`工作区/材料判定.json`）那一条硬闸 ──────────
  //
  // 病：`role` 是上传那一刻由文件名猜出来的（`guessRoleFromName` → AI 识别 → 用户手改），
  // 而「哪一份在冲突时更权威」这种跨材料判断在上传那一刻无处可做。口径（spec §4.2 那张七格卡 ·
  // 票 `pre-gold-processes/11` §1／§4）把它搬进探查段开头的一趟书级材料判定，产物就是这一份文件；
  // 机器在交工那一刻按它把 `role` 并进合并件的 `materials[]`（见下面回包里的 `materialRoles`）。
  //
  // ⚠️ **为什么这一条排在这几件的最后**：它与上面几条是同一份判据里的并列项，顺序只影响
  // 交工那一跳取 `problems[0]` 当 400 文案时**先说哪一条**；判定产物是本族里最后加入的一项，
  // 排在末尾不动上面几条的文案（它们各有测试锚着，如 `test-explore-handoff-content.mjs`）。
  // ⚠️ **票 `demo-channel-full/11` 起这一条对演示通道不再分叉**：演示书也产这份产物
  // （`runPhase2` 的演示支写它），所以这里照读、照验；⛔ 不许把 `!demoBook` 加回来——
  // 加了之后演示书这一格又变成「机器看不见」，而屏上那半句角色也跟着没了。
  // ⚠️ 窄处（枚举面比现实窄在哪）逐条写在 {@link materialJudgmentProblems} 的注释里——⛔ 不在这里复述。
  // ⚠️ 票 `pre-gold-build/03`：这份产物**在本函数开头就读了**（档位的声明面与这里共用同一份——
  // ⛔ 不在这一处再读一次盘，两次读之间那份文件允许被改写）。
  problems.push(...materialJudgmentProblems(state.sources, materialJudgment))
  // ── 票 `premature-announce/01` 第 1 条点名的**另外两件盘上事实**：它们此前只在交工那一刻查 ──────
  //
  // 病（收口 review 逮到）：票面 `## 要做的` 1 把「`standingGate`」与「有片不许 `knowledgePoints` 空」
  // 列进了**就绪判据列的枚举**，但这两条原先只住在 `stage-submit explore` 里 ⇒ **放行那一跳验不到**
  // 它们：手摆一份 `knowledgePoints: []`、材料没有 `standing` 的合并件，`explore-confirm(true)` 照旧 200
  // （实测：`problems = []`、200、`exploreConfirmed: true`），而那正是本票要堵的「静默放行」同形。
  //
  // ⚠️ **只在合并件真在盘时判**：`atSubmit` 那一跳合并件还没诞生（它自己写它），这两条读的就是合并件，
  // 盘上没有就没有可判的东西——凭空要一份不存在的内容，是「判据比现实严」那一类错。
  // ⚠️ **判据本身不在这里另写一份**：材料分量走 `domain-rules.standingGate`（与交工那一条**同一份**，
  // 窄处与四道闸门写在它的注释里），「有片不许空知识点」也按交工那条**同一个条件**（`shards.length > 0`；
  // 零片旧书不要求——那时没有分片可拼）。这里只做**接线**：读盘上那份合并件、把同一份判据喂给它。
  // ⚠️ 枚举面窄处：读的是**盘上那份合并件**，不是分片重拼的结果 ⇒ 合并件与分片不一致这件事不在这里判
  // （交工那一刻机器自己拼，两边天然一致；盘上被手改过的那一份只能照它判）。
  if (!atSubmit) {
    // ⚠️ 合并件只问**那一句**（票 `graph-read-one-answer/02`）：读什么、读不出算不算没有，口径只有
    // `knowledge-graph-build.js` 的 `readMergedMap` 一处（缺件／不是严格 JSON／不是对象 ⇒ 一个答案）。
    // 本处**不改判据强度**：以前是「读不出就算没有」，现在还是——⛔ 不改成抛错或上报。
    // ⚠️ **它不判形状**：图那两个键的闸（`knowledgeMapGateProblems`）在交工那一跳，这里只取
    // `knowledgePoints`／`materials` 两格喂给「有片不许空知识点」与 `standingGate`。
    const mergedOnDisk = readMergedMap(projectId).map
    if (mergedOnDisk !== null) {
      const mergedPoints = Array.isArray(mergedOnDisk.knowledgePoints) ? mergedOnDisk.knowledgePoints : []
      if (shards.length > 0 && mergedPoints.length === 0) {
        problems.push(`机器按分片拼出来的知识地图没有 knowledgePoints（每份转换完成的材料那一片都要带这一份的知识点）：${shards.map((shard) => knowledgeShardRel(shard.n)).join('、')}`)
      }
      const standing = standingGate(state.sources, mergedOnDisk.materials)
      problems.push(...standing.rejects)
    }
  }
  return { problems, shards, materialRoles }
}


/**
 * **章节骨架那一段的就绪判据**（放行那一跳用；票 `premature-announce/01`）。
 *
 * ⚠️ 它比探查那一份**窄**，窄处写在明面上：交工验货在 `stage-submit(outline)` 里验的是**内容**
 * （大纲字段归一化、知识点覆盖、**章数政策**——2026-10-27 起上下限都不判，站 6 拍板章数只留一条
 * 非阻断对账读数，见 `actions/chapters.js` 那一支的注释），
 * 而那些判据读的是**交工请求体**——放行那一刻拿不到。
 * 这一份只断两件**盘上事实**：
 *   · `工作区/outline.md` 非空（这一段唯一的产物，机器在交工成功那一刻写它）
 *   · `工作区/knowledge-map.json` 在盘（骨架的知识点覆盖判据读的就是它；它不在，后面必然撞 400）
 *
 * @param {string} projectId
 * @param {object|null} [meta] 调用方手里那份状态；不递就自己读
 * @returns {string[]} 缺什么（空数组＝就绪）
 */
export function outlineArtifactProblems(projectId, meta = null) {
  const problems = []
  const state = meta ?? readMeta(projectId)
  const outlineText = existsSync(workFile(projectId, 'outline.md'))
    ? readFileSync(workFile(projectId, 'outline.md'), 'utf8')
    : ''
  if (outlineText.trim() === '') {
    problems.push('工作区/outline.md 不存在或为空——这一段还没交工（章节骨架由机器在交工那一刻写它）')
  }
  // ⚠️ 合并件**只在「这本书真有材料」时才要求**——与交工验货那条判据**同一个条件**：
  // `stage-submit(outline)` 的知识点覆盖闸门只在 `okMaterialNumbers(sources).length > 0` 时才读它
  //（零源旧书两处都不读）。凭空要一份不存在的件，就是「判据比现实严」那一类错。
  // ⚠️ `hasSources` 这一条判据**一个字不改**；问的同样是「件在不在」，⛔ 不是 `map`
  //（票 `graph-read-one-answer/05`、`08`：三档口径只住 `mergedMapPresent` 一处，⛔ 不在这里复述）。
  const hasSources = state !== null && okMaterialNumbers(state.sources).length > 0
  if (hasSources && !mergedMapPresent(projectId)) {
    problems.push('工作区/knowledge-map.json 不在——章节骨架的知识点覆盖读的就是它（源探查那一段的合并件）')
  }
  return problems
}


/**
 * **范例章那一段的就绪判据**（放行那一跳用；票 `premature-announce/01`）。
 *
 * ⚠️ **它不翻 `ADR-0034` 裁决甲**：裁决甲管的是 {@link runPhase4} 那道**置态**闸门
 * （「稿在盘就提前展示」——有意，一个字不动）；本函数管的是**放行**那一跳（用户点「定稿」时，
 * 这三件必须真在盘上）。两者不是一件事，本票只做后者。
 *
 * 判据与交工验货**同一份来源**（`stage-submit gold` 里那三行 `missing` 逐字）：章正文、
 * `style-spec.md`、检查记录 `audit-NN.md`，「在盘且非空」。⛔ 内容判据（style-spec 五个节标题、
 * 审计矩阵、正文与分片的一致性）**不在这里**：它们读的是内容与交工请求体，而顺序是「先交工、再放行」
 * ——交工那一跳已逐项验过；这一跳只防「产物被搬走／删掉之后书还往前走」。
 *
 * ⚠️ 它堵的是**静默跳过交工**那条路：跳过 `stage-submit gold`，`styleSpecHash` 永不定格，
 * 终检那一条对账会**静默不成立**（票 `05` 记的那半处不可逆）。
 *
 * @param {string} projectId
 * @param {object|null} [meta] 调用方手里那份状态；不递就自己读
 * @returns {string[]} 缺什么（空数组＝就绪）
 */
export function goldArtifactProblems(projectId, meta = null) {
  const state = meta ?? readMeta(projectId)
  if (state === null) return ['这本书的状态读不出来（账上的 meta 不在）']
  const gN = goldN(state)
  const missing = [chapterName(gN), 'style-spec.md', auditName(gN)].filter((name) => {
    const target = workFile(projectId, name)
    return !existsSync(target) || readFileSync(target, 'utf8').trim() === ''
  })
  return missing.length > 0 ? [`范例章文件缺失或为空：${missing.join('、')}`] : []
}


async function runPhase2(ctx, projectId, meta) {
  if (meta.demo) {
    // 演示模式：与真实共用确认闸门——产物已存在 → 停 awaiting-explore 等人拍板；内容来自内置回放。
    if (existsSync(workFile(projectId, 'explore.md'))) {
      // ── 票 `confirm-points-redesign-build/05`：**站 2／3 是两个停点**（同一个 `awaiting-explore`
      // 状态值，由账本折出「现在是哪一件事」＝`meta.exploreConfirmed` 那一格）──────────────
      // 站 2 拍过板之后，站 3 那一趟的产物**先落盘**，再停第二个停点。演示通道零 LLM ⇒
      // 那一趟的「产出」是一份确定性夹具（`content-lib.demoGoals`），与 `demoKnowledgeShard`／
      // `demoMaterialJudgment` 同一口径：名字、形状、版本规则与真书**同一份契约**。
      if (meta.exploreConfirmed === true) {
        ensureDemoGoalDoc(projectId, meta)
        // ⚠️ 那一趟在演示面上没有主 AI 可回话 ⇒ 它的 `pendingStage` 要**在产物落盘这一刻清掉**：
        // 留着它，下一次 `stage-brief` 仍会说「机器在等你交站 3 那一趟」（而那趟已经跑完了）。
        updateMeta(projectId, (state) => { if (state.pendingStage === 'goal') state.pendingStage = null })
      }      ensureStatus(projectId, 'awaiting-explore', EXPLORE_DONE_HINT)
      return 'waiting'
    }
    return demoStep(ctx, projectId, meta, '源探查', async (runtime) => {
      const result = await generateContent(runtime, 'explore')
      // v2：源探查产出人读索引 + 结构化知识地图（后续设计/写作直接复用）。
      writeWork(projectId, 'explore.md', result.index ?? result.text ?? '')
      // ── 票 `demo-channel-full/12`：**分片 ＋ 细目**两份产物，演示书也产 ─────────────────────
      //
      // 真书上这两族是「精读」那一族的落点：**每份转换完成的材料一片分片**
      // （`工作区/knowledge-map-NN.json`，那一路精读小助手自己落）＋**一份细目**
      // （`工作区/细目/精读-NN.md`，它自己的主产物）。演示通道零 LLM、没有精读小助手，
      // 内容由 `content-lib` 给（确定性夹具、逐段如实写着「演示不做这一步」）——
      // 但**名字、形状、覆盖哪几号、以及合并件的拼法**与真书同一份契约：
      // 号按盘上事实现算（`okMaterialNumbers`），细目的路径走 `detailDir` ＋ `readingName` 出口，
      // 分片的名字走 `knowledgeShardName` 出口（⛔ 不手写文件名）。
      // 于是 `exploreArtifactProblems` 里那两条（分片／细目在场）对演示书**不再需要分叉**。
      const okNums = okMaterialNumbers(meta.sources)
      const shard = demoKnowledgeShard(okNums)
      if (shard !== null) writeWork(projectId, knowledgeShardName(shard.num), JSON.stringify(shard, null, 2))
      const reading = demoReading(okNums)
      if (reading !== null) {
        mkdirSync(detailDir(projectId), { recursive: true })
        writeFileSync(join(detailDir(projectId), readingName(reading.num)), reading.text, 'utf8')
      }
      // ── 票 `demo-channel-full/11`：**材料判定产物**（`工作区/材料判定.json`）演示书也产 ──────────
      // 真书上它是探查段开头那一趟书级材料判定（派发档 `material-survey`）的产物；演示通道零 LLM，
      // 内容由 `content-lib.demoMaterialJudgment()` 给——但**名字、形状、覆盖哪几号**与真书同一份契约：
      // 号按盘上事实现算（`okMaterialNumbers`），⛔ 不在夹具里写死「只有 1 份」。
      // ⚠️ 它**必须排在合并件之前**：下面那次拼装要按分片号把它的 `role`／`basis` 并进 `materials[]`
      // （`materialRoleTable(readMaterialJudgment(projectId))` 读的是**盘上**那一份）。
      // ⛔ 别把两者调过来——调过来 `materials[]` 里那两格会静默不长出来（票 11 要治的正是那半句）。
      writeWork(
        projectId,
        MATERIAL_JUDGMENT_NAME,
        JSON.stringify(demoMaterialJudgment(okNums), null, 2),
      )
      // ── 合并件：**从上面那一片现拼**（票 `demo-channel-full/12` 改掉了「手写一整份」）────────────
      //
      // 病：演示通道原先直接落一份手写的合并件 ⇒ 盘上那几片与它没有任何关系，一片都不在，
      // 「合并件＝各片 ＋ 书级键 ＋ 角色表」这条**生产契约**在演示书上无从谈起。
      // 现在走**生产那一段**（`content-lib.demoMergedKnowledgeMap` → `knowledge-map-assembly.
      // expectedKnowledgeMap`）：各片（分片数组键 ＋ 图那两条拼接族的边）在前，主笔交的书级键在后，
      // 材料判定的 `num → {role, basis}` 表按分片号并进 `materials[]`——`role`／`basis` 的**唯一住处**
      // 仍是判定产物（票 11 的口径），这里只是把同一份表喂给同一段拼装。
      if (shard !== null) {
        const merged = demoMergedKnowledgeMap(okNums, materialRoleTable(readMaterialJudgment(projectId)).get(shard.num))
        // 票 `graph-write-order/01`：只走**同一个**渲染出口（`fixture` 档：不过闸、不约简）。
        // 改造前这一行是手写 `JSON.stringify(merged, …)`，与 `renderKnowledgeMap` 逐字同值 ⇒ 换过来零字节变化。
        if (merged !== null) {
          const landing = landMergedMap({
            kind: 'fixture',
            projectId,
            merged,
            target: { path: workFile(projectId, MERGED_MAP_NAME) },
          })
          if (landing.outcome !== MERGED_MAP_OUTCOMES.fixture) {
            throw new Error(`演示通道落合并件认不出的结局：${landing.outcome}（只可能是 fixture）`)
          }
        }
      }
    }, () => {
      ensureStatus(projectId, 'awaiting-explore', EXPLORE_DONE_HINT)
      return 'waiting'
    })
  }
  // 真实模式：源探查交办给主 AI。⚠️ 「这一步做完没有」**只看那一份就绪判据**（票 `premature-announce/01`）：
  // 原先这里只看 `工作区/explore.md` 在不在——主笔一写索引底稿，机器就宣告「材料读完了」，而精读小助手
  // 还在跑（2026-10-10 实跑：卡早 4 分 29 秒；那一刻点「满意」会把书推过这一段，合并件永久缺位）。
  //
  // ── 票 `confirm-points-redesign-build/05`：站 2 拍过板之后**不再直接进设计** ──────────────────
  // 病（本票要治的）：原先「探查拍板 ⇒ `advance(2,3)`」一步跨过站 3，而那 3–5 条目标**只能由
  // 站 2 拍板之后另跑的一趟**产出（它要吃站 2 划掉的那些卡 ⇒ ⛔ 不跟探查同一趟）。现在这一支
  // 先看那一趟的产物在不在：不在就交办它；在就停**第二个停点**（状态值仍是 `awaiting-explore`，
  // 「现在是哪一件事」由 `exploreConfirmed` 折出——⛔ 不新增 `awaiting-*` 值）。
  if (meta.exploreConfirmed === true) {
    if (existsSync(workFile(projectId, goalDocNameOfLatest(projectId)))) {
      ensureStatus(projectId, 'awaiting-explore', STATION_GOALS_DONE_HINT)
      return 'waiting'
    }
    if (meta.pendingStage === 'goal') return 'waiting'
    handoff(ctx, projectId, 'goal')
    return 'waiting'
  }
  // ── 票 `premature-announce/07` · `## 要做的` 2：**交办还在飞时先不判「做完了没有」** ──────────
  // `pendingStage === 'explore'` 这一格必须排在就绪判据**之前**：交办已经发出去、这一趟还没交工，
  // 盘上可能留着**上一轮**的合并件（`knowledge-map.json` 是交工成功那一刻才写的）⇒ 判据这一眼看过去
  // 全齐，先判就会把卡提前点亮（改之前它排在后面，只在「判据不齐」时才有用）。
  if (meta.pendingStage === 'explore') return 'waiting'
  if (exploreArtifactProblems(projectId, meta).problems.length === 0) {
    ensureStatus(projectId, 'awaiting-explore', EXPLORE_DONE_HINT)
    return 'waiting'
  }
  handoff(ctx, projectId, 'explore')
  return 'waiting'
}

/**
 * 站 3 那一份正文**盘上那一版的基名**（一份都没有 ⇒ 下一版该写的那个名字）。
 *
 * ⚠️ 单独抽一格只为一件事：`workFile` 要**基名**（它自己拼 `工作区/`），喂相对路径会读成
 * `工作区/工作区/目标-v1.md`——即「读不出来 ⇒ 以为那一趟没跑过 ⇒ 又交办一次」的死循环。
 */
function goalDocNameOfLatest(projectId) {
  const v = goalDocVersionOnDisk(projectId)
  return v === 0 ? goalDocName(nextGoalDocVersion(projectId)) : goalDocName(v)
}

/**
 * 演示通道的站 3 那一趟：把那份确定性夹具落成 `工作区/目标-vM.md`（**幂等**：已有就不动）。
 *
 * ⚠️ 它**不记任何事件**：演示轨迹（`cassettes/demo-full.json` 那一族录制基线）按账本对账，
 * 凭空多一笔 `stage-start` 会让基线过期——而这一趟在真书上「产出一份正文」这件事，
 * 演示面上由这一份文件本身如实表达（与 `demoKnowledgeShard` 那几件同一条口径）。
 */
function ensureDemoGoalDoc(projectId, meta) {
  if (goalDocVersionOnDisk(projectId) > 0) return
  try {
    const version = nextGoalDocVersion(projectId)
    writeGoalDoc(projectId, version, demoGoals(meta?.goal))
    // 界面那张卡要知道「该读哪一版」（它读的是 `工作区/目标-v<M>.md`）⇒ 版本号随盘上那一份
    // 一起记在账本上（`meta.goalDocVersion`）。⚠️ 它是**指针**不是第二份真相：盘上那一族仍是
    // 唯一事实，这里只记「最新的一版是几」。
    updateMeta(projectId, (state) => { state.goalDocVersion = version })
  } catch { /* 派生件写不进去不等于流程死了（与演示通道其余夹具同一条口径） */ }
}
/** 统计某关卡被驳回的次数（从时间线折叠）。 */
function countRejections(projectId, gate) {
  let count = 0
  for (const event of readEvents(projectId)) {
    if (event.type === 'textbook/gate-decision' && event.data?.gate === gate && event.data.approved === false) {
      count += 1
    }
  }
  return count
}


/** 统计某关卡已提案的次数（用于算下一版版本号）。 */
function countProposals(projectId, gate) {
  let count = 0
  for (const event of readEvents(projectId)) {
    if (event.type === 'textbook/gate-proposal' && event.data?.gate === gate) count += 1
  }
  return count
}


/** 该关卡是否已经通过（对该关卡最新提案的决策为通过）。 */
function gateApproved(projectId, gate) {
  let proposal = null
  let decision = null
  for (const event of readEvents(projectId)) {
    if (event.type === 'textbook/gate-proposal' && event.data?.gate === gate) {
      proposal = event
      decision = null
    } else if (event.type === 'textbook/gate-decision' && event.data?.gate === gate && proposal !== null) {
      decision = event
    }
  }
  return decision !== null && decision.data?.approved === true
}


/** 关卡循环：提案 → 等拍板；通过返回，驳回自动生成修订版再等（不限轮次，每 3 轮提示调整目标）。 */
async function runGate(ctx, projectId, meta, gate) {
  for (;;) {
    // 已通过的关卡直接跳过（宿主重启后从 gate 1 重来也不重复生成）。
    if (gateApproved(projectId, gate)) return 'approved'
    // 票 `walkthrough-fixes/19`③：用户**跳过**了这一关 ⇒ 不再等拍板（推迟＋记账），
    // 但**也不记成通过**——所以这里返回的是第三态 `'skipped'`，不是 `'approved'`
    // （下游读 `gateApproved` 的地方照样看到「未验」）。
    if (stepSkipped(projectId, `gate-${gate}`)) return 'skipped'
    const current = foldGate(projectId)
    if (current !== null && current.gate === gate && current.status === 'approved') return 'approved'
    if (current !== null && current.gate === gate && current.status === 'awaiting') {
      await waitForGateDecision(projectId, gate, current.version)
      continue
    }
    // 需要生成提案（首次）或修订版（被驳回后）。
    const prevDecision = current !== null && current.gate === gate ? current.decision : null
    const prevVersion = current !== null && current.gate === gate ? current.version : 0
    const version = prevVersion + 1
    const rejectCount = countRejections(projectId, gate)
    if (rejectCount > 0 && rejectCount % 3 === 0) {
      appendEvent(projectId, 'textbook/hint', {
        // 票 14（承诺账 G）：界面的「回退」只到最近一次存档，**回不到更早的拍板点**——
        // 「回到更早的拍板点并重做下游」只有定点修改能做（CONTEXT.md：「回退（快照）」与
        // 「定点修改」是两条路，勿混用）。这句话由主笔 AI 转述给用户，说错路名用户就找不到。
        text: `这一关已经来回 ${rejectCount} 次了。如果一直不满意，可以在对话里调整目标或换一种思路，或者用「定点修改」回到更早的拍板点重新来。`,
      })
    }
    const runtime = projectRuntime(ctx, projectId, meta)
    const label = version === 1 ? `设计提案·关卡${gate}` : `设计提案·关卡${gate}·修订v${version}`
    const artifact = artifactDataForLabel(label, goldN(meta))
    const startedAt = Date.now()
    appendEvent(projectId, 'textbook/agent-start', { label, path: artifact.path, chapter: artifact.chapter })
    try {
      const proposal = await generateContent(runtime, 'gate', {
        gate, version, prevSummary: current?.summary ?? null, decision: prevDecision,
      })
      // 安全网：设计方案缺字段就中止，绝不生成空提案占住面板。
      if (typeof proposal?.title !== 'string' || proposal.title.trim() === ''
        || typeof proposal?.summary !== 'string' || proposal.summary.trim() === ''
        || typeof proposal?.detail !== 'string' || proposal.detail.trim() === '') {
        throw new Error('设计方案不完整（缺少标题/摘要/正文），已中止生成，请重试')
      }
      appendEvent(projectId, 'textbook/agent-end', { label, outcome: 'ok', path: artifact.path, chapter: artifact.chapter }, Date.now() - startedAt)
      if (version === 1) {
        proposeGate(projectId, gate, proposal.title, proposal.summary, proposal.detail)
      } else {
        proposeRevision(projectId, gate, version, proposal.title, proposal.summary, proposal.detail)
      }
      await waitForGateDecision(projectId, gate, version)
    } catch (error) {
      return recordAgentError(projectId, label, error)
    }
  }
}


/** 真实模式：三关设计提案与章节骨架全部交办给主 AI；演示模式：三关自动跑 + 骨架回放（共用 runGate/advance）。 */
async function runPhase3(ctx, projectId, meta) {
  if (meta.demo) {
    // 演示模式：三关逐关提案→等拍板（runGate），全部通过后章节骨架回放生成。
    for (const gate of ['1', '2', '3']) {
      const result = await runGate(ctx, projectId, meta, gate)
      // 票 `walkthrough-fixes/19`③：`'skipped'`（用户跳过这一关）与 `'approved'` 都是
      // 「不必再在这儿等」，但**只有 `'approved'` 是验过了**——所以第三态必须与它分开走，
      // 不许折成一个返回值（折了，「跳过」就变成「通过」）。
      if (result !== 'approved' && result !== 'skipped') return result
    }
    if (meta.outline === undefined) {
      const outlineResult = await demoStep(ctx, projectId, meta, '整理章节骨架', async (runtime) => {
        const outline = await generateContent(runtime, 'outline', {})
        // 改在改法里写（不拿手里那份旧状态整份写回）：生成要 await，期间账本可能已经动过。
        updateMeta(projectId, (state) => { state.outline = outline })
        // ⚠️ 演示模式写的是**同一份 JSON**（与 `actions/chapters.js` 的真实模式一个文件、一个形状）：
        // 所以产物判据对两条路是同一条——`工作区/outline.md` 判 `'inline'`、不开右栏预览
        // （票 pipeline-wiring-gaps/09），人读形态是章节安排确认卡与阶段页第 3 阶段的就地折叠清单。
        writeWork(projectId, 'outline.md', JSON.stringify(outline, null, 2))
      })
      if (outlineResult !== 'advanced') return outlineResult
    }
    // 票 10（判定一 #7）：按钮名统一成「🔁 让 AI 重做」，这句告诉用户点哪个按钮的播报跟着改。
    // 票 `demo-channel-full/24`：这一句的**唯一出口**是 `outlineReadyHint`（两取值，见它自己的注释）。
    ensureStatus(projectId, 'awaiting-outline', outlineReadyHint(meta))
    return 'waiting'
  }
  // 真实模式：三关设计提案与章节骨架全部交办给主 AI（已通过的关自动跳过）。
  for (const gate of ['1', '2', '3']) {
    // ⚠️ 三个条件是**三条不同的通路**，别合并：`gateApproved`＝用户拍过板（验过了）；
    // `waived('gate-skip')`＝用户豁免（**取消**这三关的验货）；`stepSkipped`＝用户跳过
    // （**推迟**验货并记账，第三态）。前两条与第三条的下游读法完全不同（票 19③ 的红线）。
    if (gateApproved(projectId, gate) || waived(projectId, 'gate-skip') || stepSkipped(projectId, `gate-${gate}`)) continue
    if (meta.pendingStage === 'gate' && meta.pendingGate === gate) return 'waiting'
    handoff(ctx, projectId, 'gate', gate)
    return 'waiting'
  }
  // 章节安排在等用户人审（outline-confirm）：停在确认点，不自动推进。
  if (meta.status === 'awaiting-outline') return 'waiting'
  if (meta.outline === undefined) {
    if (meta.pendingStage === 'outline') return 'waiting'
    handoff(ctx, projectId, 'outline')
    return 'waiting'
  }
  advance(projectId, 3, 4)
  return 'advanced'
}
/** 真实模式：最佳范例章交办给主 AI（金标准，全书基准）；演示模式：回放生成（共用 awaiting-gold 闸门）。 */
async function runPhase4(ctx, projectId, meta) {
  const gn = goldN(meta)
  if (existsSync(workFile(projectId, chapterName(gn)))) {
    // 已写好：必须用户确认后才进全章写作（awaiting-gold）。真实与演示共用同一块（原逐字节相同）。
    ensureStatus(projectId, 'awaiting-gold', '📖 最佳范例章写好了，请在工作台查看：满意点「✅ 满意，继续写全书」，不满意点「❌ 重写」。')
    return 'waiting'
  }
  if (meta.demo) {
    // 演示模式：范例章回放生成，产出后停在 awaiting-gold 等人拍板（与真实同闸门）。
    return demoStep(ctx, projectId, meta, '最佳范例章（先写一章给你看）', async (runtime) => {
      const outline = meta.outline ?? { chapters: [{ title: '示例章节', outline: '' }] }
      const result = await generateContent(runtime, 'gold', {
        outline, targetWords: meta.targetWords, chapterSource: outline.chapters?.[goldN(meta) - 1]?.source ?? '',
        redoNote: meta.goldRedoNote ?? '',
      })
      writeWork(projectId, 'style-spec.md', result.styleSpec)
      // 票 `demo-channel-full/19`：演示支写完这份规范之后，用**真书交工那一跳同一份判定**查一遍
      //（`domain-rules.styleSpecMissingSections`）——演示通道因此**真过**这一格，
      // 而不是「结构上不触发、由豁免放行」（那份豁免随本票关闭）。
      // ⚠️ 这里只可能因为**生成侧漂了**才失败（契约新增了要软验的节标题、而演示正文表没跟上）：
      // 那就当场炸并点名，⛔ 不静默交一份空壳（那正是本票要治的病）。
      const specMissing = styleSpecMissingSections(result.styleSpec)
      if (specMissing.length > 0) {
        throw new Error(`演示写作规范缺这几节的标题：${specMissing.join('、')}（生成侧没有为契约要求的每一节写正文）`)
      }
      writeWork(projectId, chapterName(gn), result.chapter)
      writeWork(projectId, auditName(gn), JSON.stringify(result.audit, null, 2))
      if (result.audit?.passed === false) {
        appendEvent(projectId, 'textbook/hint', { text: '最佳范例章检查发现待完善项，已随章记录，可在交付前查看。' })
      }
    }, async () => {
      // 对齐真实模式 stage-submit gold：新稿落地即意见转 applied、本轮重做意见用毕即清。
      updateMeta(projectId, (state) => {
        if (Array.isArray(state.goldOpinions)) {
          for (const o of state.goldOpinions) if (o.status === 'sent') o.status = 'applied'
        }
        delete state.goldRedoNote
      })
      ensureStatus(projectId, 'awaiting-gold', '📖 最佳范例章写好了，请在工作台查看：满意点「✅ 满意，继续写全书」，不满意点「❌ 重写」。')
      return 'waiting'
    })
  }
  if (meta.pendingStage === 'gold') return 'waiting'
  handoff(ctx, projectId, 'gold')
  return 'waiting'
}
/** 演示模式 · 铺章的内容编排（回放）：逐章写 + 自查。
 *  只做内容落盘与 agent 事件，不路由状态机（推进/闸门由 runPhase5 负责）。
 *  真实模式铺章由主 AI 经 stage-brief/stage-submit 完成，不在这里。 */
/**
 * 票 `demo-channel-full/06` ＋ `/15`：把演示书自带的**抽查意见**合进账本（**幂等**）。
 *
 * 真书上这一族由用户写、由主笔 AI 在交工那一跳销号；演示通道没有 AI ⇒ 它自带**两条已处置**的示例：
 * 一条**整章**的（带 `comment`，票 06）与一条**段落**的（带 `kind` ＋ `target`，票 15）——
 * 于是卡上「已处置 · <怎么处置的>」与同一行那颗「翻案」键、以及**正文装订线上那个 `#N ✏️` 段落标记**
 * 在演示书上真的存在、真的点得动（撤回＝段旁那颗键再点一次）。
 *
 * ⚠️ **只补缺的 id**（不是「整份写回」）：用户翻案（`review-revoke` 把它写回 `pending`）或撤回
 * （`gold-opinion-revoke` 置 `revoked`）之后，下一次驱动**不许**把它搬回注入时的样子——
 * 注入是「补齐」，不是「覆盖用户动过的态」。
 * ⚠️ 条目的**形状**与那两句 `how` 由内容接缝持有（`content-lib.js` 的 `demoChapterReviews` ＋
 * `demoChapterOpinions`）：这里只负责合，⛔ 不在这里拼第三份形状。
 */
function seedDemoChapterReviews(projectId) {
  const seeded = [...demoChapterReviews(), ...demoChapterOpinions(Date.now())]
  updateMeta(projectId, (state) => {
    const list = Array.isArray(state.pendingReviews) ? state.pendingReviews.slice() : []
    for (const entry of seeded) {
      if (list.some((r) => r?.id === entry.id)) continue
      list.push(entry)
    }
    state.pendingReviews = list
  })
}

async function demoWriteChapters(ctx, projectId, meta) {
  const chapters = meta.outline?.chapters ?? [{ title: '第1章', outline: '' }]
  const styleSpec = existsSync(workFile(projectId, 'style-spec.md')) ? readWork(projectId, 'style-spec.md') : ''
  const audits = []
  for (let index = 0; index < chapters.length; index += 1) {
    const n = index + 1
    const file = chapterName(n)
    const chapterPath = workFile(projectId, file)
    if (existsSync(chapterPath)) {
      const auditPath = workFile(projectId, auditName(n))
      if (existsSync(auditPath)) {
        try { audits.push(JSON.parse(readFileSync(auditPath, 'utf8'))) } catch { audits.push({ passed: false, issues: [{ level: '错误', status: 'open', text: '已有审计记录读不出' }] }) }
      }
      // 票 14「演示通道照旧走到过目」：范例章那一章在第 4 阶段就已落盘（`chapter-0N.md` ＋ audit），
      // 这里原本直接 `continue`——于是这一章**永远没有章级完成事件**，新闸门（两份产物在 ＋ 机器记下的
      // 交工通过）在 demo 上就永远为假，demo 会卡死在过目门前。
      // 处置：**在这里补写入点**（不重写产物、不动内容），落一条与下面新写章节同形状的「写第N章」事件。
      // 判据不给 demo 开口子（spec 第 6 条：若某条演示流程缺章级事件，就在那里补写入点）。
      if (!chapterHasSubmitEvent(projectId, n, meta)) {
        const artifact = artifactDataForChapter(n)
        appendEvent(projectId, 'textbook/agent-end', { label: `写第${n}章`, outcome: 'ok', path: artifact.path, chapter: artifact.chapter })
      }
      // 票 `demo-channel-full/03`：这一章的产物与「机器记下的交工」都齐了 ⇒ 章级阶段如实写成
      // `done`（与真书同一份口径：真书那一跳由主笔 AI 报 `done`，这里由**这台机器自己**报——
      // 演示通道铺章的就是它）。⚠️ 这一格不写 `audited`：演示支没有「复核」那一步，
      // 写它等于替用户宣告一个没发生过的环节（见本函数末尾那一段说明）。
      recordChapterStage(projectId, n, 'done')
      continue
    }
    const runtime = projectRuntime(ctx, projectId, meta)
    const title = chapters[index].title ?? `第${n}章`
    const artifact = artifactDataForChapter(n)
    const writeStartedAt = Date.now()
    // 票 `demo-channel-full/03`：**写下的每一步都对应演示支真走过的一步**（承诺面 ≤ 实现面）：
    //   `writing`   这一章正在写（下面那次 `writeWork(chapter-0N.md)` 真的会发生）
    //   `auditing`  这一章正在自查（下面那次 `writeWork(audit-0N.md)` 真的会发生）
    //   `done`      两份产物都落盘、且机器记下的章级交工事件也在（与 `chapterDone` 同一份判据）
    // ⛔ 不写 `audited`／`finalizing`：演示支没有「复核」这一步，写它就是把没发生的环节标成已发生。
    // ⚠️ 落账走**唯一写入口**（`recordChapterStage`），与真书 `progress` 上报那一路同一处口径——
    // 演示支不在自己这里另拼一份数组。
    recordChapterStage(projectId, n, 'writing')
    appendEvent(projectId, 'textbook/agent-start', { label: `写第${n}章《${title}》`, path: artifact.path, chapter: artifact.chapter })
    try {
      const written = await generateContent(runtime, 'chapter', {
        n, title, outline: chapters[index].outline ?? '', styleSpec,
        targetWords: chapters[index].targetWords ?? meta.targetWords,
        chapterSource: chapters[index].source ?? '',
      })
      // demo 通道的 chapter 产物是字符串（demoChapterWrite 直接返回正文），不是 {text} 对象。
      writeWork(projectId, file, written)
      appendEvent(projectId, 'textbook/agent-end', { label: `写第${n}章`, outcome: 'ok', path: artifact.path, chapter: artifact.chapter }, Date.now() - writeStartedAt)
    } catch (error) {
      return recordAgentError(projectId, `写第${n}章`, error)
    }
    const auditStartedAt = Date.now()
    recordChapterStage(projectId, n, 'auditing')
    appendEvent(projectId, 'textbook/agent-start', { label: `自查第${n}章` })
    try {
      const audit = await generateContent(runtime, 'audit', {
        n, title, chapterPath,
      })
      writeWork(projectId, auditName(n), JSON.stringify(audit, null, 2))
      audits.push(audit)
      appendEvent(projectId, 'textbook/agent-end', { label: `自查第${n}章`, outcome: audit.passed === true ? 'ok' : 'issues' }, Date.now() - auditStartedAt)
    } catch (error) {
      // 审计失败也落盘一条记录，保证每章都有审计记录（质量门可核）。
      // ⚠️ 票 `audit-gate-semantics/01`：**不再写 `passed: true`**——自查没完成不是「通过」。
      // 按新契约落一条 `错误/open`：任何现算 `passed` 的地方读到的都是 false（失败不许洗绿）。
      const fallback = {
        passed: false,
        issues: [{ level: '错误', status: 'open', text: `自查未能完成：${String(error instanceof Error ? error.message : error)}` }],
      }
      writeWork(projectId, auditName(n), JSON.stringify(fallback, null, 2))
      audits.push(fallback)
      appendEvent(projectId, 'textbook/error', { task: `自查第${n}章`, message: String(error instanceof Error ? error.message : error) })
    }
    // 两份产物都在盘上 ＋ 上面那条 `写第N章` 的 agent-end 也在 ⇒ 这一章按 `chapterDone` 已经算完成
    //（那条 `writeWork(chapter)` 与那条事件都在上面那两段里）。所以这里写 `done` 是**如实**的，
    // 不是为了把三章都画成绿的。
    recordChapterStage(projectId, n, 'done')
  }
  // ── 票 `demo-channel-full/04`：进度账本（`工作区/progress.md`）──────────────────────────────
  // 真书上它由主笔 AI 一边干一边补（交办文本逐字：「维护 `工作区/progress.md`（每章一行：写完/审计/验货）」），
  // 是中途换人、重做时的参照；演示通道没有 AI ⇒ 按**同一形状**造一份。三种「谁写的」都定了口径：
  //   · **事实**（哪些章真落了盘、哪一份自查真落了盘）在**这里现读盘**，不猜、不写死；
  //   · **排版**在内容接缝那一侧（`content-lib.js` 的 `demoProgressLedger`），与其余演示内容同一个来源；
  //   · ⛔ 「验货」那一列恒为「不跑」——演示书从不经 `stage-submit(final)`（`final-gate-family`），
  //     所以⛔ 不许把没发生的步骤写成已发生。
  // ⚠️ 落点是**工作区根**：`writeWork` 收的是「工作区相对」的名字（⛔ 别把 `工作区/progress.md`
  //    整个传进来——那会写成 `工作区/工作区/progress.md`，票 08 踩过这个乘法错）。
  // ⚠️ 写在循环**之后**（不是每章一次）：中途 `recordAgentError` 已经 `return` 的路径不会走到这里，
  //    照实反映「这一段没走完」；而已经落过盘的章（范例章那一支 `continue`）照样进这份账。
  const ledgerRows = chapters.map((chapter, index) => {
    const n = index + 1
    return {
      n,
      title: chapter?.title ?? '',
      written: existsSync(workFile(projectId, chapterName(n))),
      audited: existsSync(workFile(projectId, auditName(n))),
    }
  })
  writeWork(projectId, 'progress.md', await generateContent(projectRuntime(ctx, projectId, meta), 'progress', {
    name: meta.name,
    rows: ledgerRows,
  }))
  // ── 票 `demo-channel-full/06`：抽查意见（`meta.pendingReviews`）那一族也补上 ────────────────
  // 位置与上面那份进度账本同一处：铺章这一段走完、书停在过目门之前。⚠️ 它是**幂等**的
  //（只补缺的 id），所以反复驱动不会把用户翻案／撤回过的态搬回去。
  seedDemoChapterReviews(projectId)
}


/** 演示模式 · 合并成书的内容编排（回放）：把已过目的章节拼成 book.md。
 *  与 demoWriteChapters 分开：全章过目闸门（awaiting-chapters-review）通过后才调它。 */
async function demoMergeBook(ctx, projectId, meta) {
  if (existsSync(workFile(projectId, 'book.md'))) return
  const runtime = projectRuntime(ctx, projectId, meta)
  const artifact = artifactDataForLabel('合并成书', goldN(meta))
  const startedAt = Date.now()
  appendEvent(projectId, 'textbook/agent-start', { label: '合并成书', path: artifact.path })
  try {
    const merged = await generateContent(runtime, 'merge', {
      chapters: (meta.outline?.chapters ?? [{ title: '第1章' }]).map((chapter, index) => {
        const file = chapterName(index + 1)
        return {
          n: index + 1,
          title: chapter.title ?? `第${index + 1}章`,
          path: workFile(projectId, file),
          text: existsSync(workFile(projectId, file)) ? readWork(projectId, file) : '',
        }
      }),
      title: meta.name,
    })
    // demo 通道的 merge 产物是字符串（demoMergeBook 直接返回正文），不是 {text} 对象。
    writeWork(projectId, 'book.md', merged)
    appendEvent(projectId, 'textbook/agent-end', { label: '合并成书', outcome: 'ok', path: artifact.path }, Date.now() - startedAt)
  } catch (error) {
    return recordAgentError(projectId, '合并成书', error)
  }
}


/** 真实模式：铺章交办给主 AI（小助手执笔 → 小助手审计 → 主 AI 终审），全部完成后交办合并；演示模式：回放编排。 */
async function runPhase5(ctx, projectId, meta) {
  if (meta.demo) {
    // 演示模式：与真实共用「全部写完 → 全章过目闸门 → 合并」的步进语义，内容来自内置回放。
    // 过目闸门判据与真实同源（chapterDone，票 14）：演示通道逐章写「写第N章」的 agent-end、
    // 范例章那章另有一条「最佳范例章（先写一章给你看）」——写入点早已存在，这里只是让闸门读它，
    // 所以 demo 轨迹零变化（ADR-0004，不重录 cassette）。
    const chapters = meta.outline?.chapters ?? []
    const allDone = chapters.length > 0 && chapters.every((_chapter, index) => chapterDone(projectId, index + 1))
    if (allDone) {
      if (!existsSync(workFile(projectId, 'book.md'))) {
        // 全章过目闸门（与真实共用）：写完先请人过目，通过才合并。
        if (meta.chaptersReviewed !== true) {
          // 票 `demo-channel-full/26`：这一条 hint 的两个取值（演示书上「AI 会照改」是假话）。
          ensureStatus(projectId, 'awaiting-chapters-review', chaptersReadyHint(meta))
          return 'waiting'
        }
        const mergeResult = await demoMergeBook(ctx, projectId, meta)
        if (mergeResult === 'error') return mergeResult
        advance(projectId, 5, 6)
        return 'advanced'
      }
      advance(projectId, 5, 6)
      return 'advanced'
    }
    const writeResult = await demoWriteChapters(ctx, projectId, meta)
    if (writeResult === 'error') return writeResult
    ensureStatus(projectId, 'awaiting-chapters-review', chaptersReadyHint(readMeta(projectId)))
    return 'waiting'
  }
  // 真实模式：铺章交办给主 AI（小助手执笔 → 小助手审计 → 主 AI 终审），全部完成后交办合并。
  const chapters = meta.outline?.chapters ?? []
  // 过目闸门「全部章节都写好了」＝ 每章**两份产物在 ＋ 机器记下的交工通过 ＋ 没有未处置的抽查意见**
  // （票 14 / 票 05 裁决 A；判据在 chapterDone 一处）。不再只数文件在不在——真机发生过「5 章文件齐全、
  // 账本只有 1 条章级完成事件」也一路进了过目 → 合并 → 交付。老书某章没交工就重新走既有逐章交工。
  const allDone = chapters.length > 0 && chapters.every((_chapter, index) => chapterDone(projectId, index + 1))
  if (allDone) {
    // ⚠️ 「机器已合并」**只认当前账本里的交工事实**（票 walkthrough-2026-10/10 裁决 A）。
    // 回退（快照）会把 `timeline.jsonl` 换回快照那一刻（ADR-0016 决策 3 的明文例外），而
    // **回退不删产物文件**——`book.md` 照旧在盘上。原先这里只看 `existsSync(book.md)`，于是
    // 回退到「交办合并之前」之后：机器看见旧书还在 ⇒ 直接 `advance(5,6)` 跳过合并，
    // 「合并成书」这一步再也点不动，成品变成 AI 手拼——「机器 100% 保真拼装」这条契约在回退
    // 路径上被绕过（真机账本 seq 107–113 的实录）。现在盘上有 `book.md` **且**当前账本里有
    // 一条合并交工，才算「机器已合并」；否则照常走全章过目闸门 → 交办合并（重拼由机器做）。
    if (!existsSync(workFile(projectId, 'book.md')) || !mergeSubmitRecorded(projectId)) {
      // 全章过目闸门（真实模式）：所有章写完先请人过目，不自动合并（F18）。
      if (meta.status !== 'awaiting-chapters-review' && meta.chaptersReviewed !== true && meta.demo !== true) {
        updateMeta(projectId, (state) => { state.status = 'awaiting-chapters-review' })
        appendEvent(projectId, 'textbook/hint', {
          // 票 `demo-channel-full/26`：同上（真书这一支说的是真话：真书真的会派 AI 改）；
          // ⚠️ 真书这一支**故意**走那个共用的 `meta && meta.demo !== true` 分支，
          // 所以这里直接传当场那份 meta——演示书不进这一段（上面那条 `meta.demo !== true` 挡着）。
          text: chaptersReadyHint(meta),
        })
        return 'waiting'
      }
      if (meta.pendingStage === 'merge') return 'waiting'
      handoff(ctx, projectId, 'merge')
      return 'waiting'
    }
    advance(projectId, 5, 6)
    return 'advanced'
  }
  if (meta.pendingStage === 'chapters') return 'waiting'
  handoff(ctx, projectId, 'chapters')
  return 'waiting'
}
const SCAFFOLD_MARKERS = /\b(META|TODO|FIXME|HACK)\b|审计批注|未决问题|loader 指令/g


function scanScaffolding(text) {
  const found = []
  for (const match of text.matchAll(SCAFFOLD_MARKERS)) {
    const lineNo = text.slice(0, match.index).split('\n').length
    const line = text.slice(0, match.index).split('\n').pop()?.trim().slice(0, 60) ?? ''
    found.push(`${match[0]}（第 ${lineNo} 行：${line}）`)
  }
  return found
}


/** 正则元字符转义（票 20 护栏 ①）。
 *  * 为什么必须有它*：`runQualityChecks` 是**同步调用**（`chapters.js` 的单章验货与终检各一处），
 *  AI 在 style-spec 里声明的标题会**原样进 `new RegExp`**——`## 备注（草稿` 这种写法抛 `SyntaxError`，
 *  抛出即把一次交工打成 500。**闸门会被声明文本杀死**，是本条最坏的一种失败。
 *  超长/超量标题在 `declaredScaffoldTitles` 里已先收口，这里是最后一道。 */
function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 声明「本书没有这类标题」的写法——**认出它等于不追加，不是关闭扫描**。 */
const NO_SCAFFOLD_TITLES = /^(无|没有|不需要|无额外|不适用|无额外标题|本书无)/
/** 数量上限（票 20 护栏 ③）：再宽的声明也会把 check note 变成一本账。 */
const DECLARED_TITLE_MAX = 12
/** 长度上限：与 `parseStyleSpecList` 既有的 ≤20 字符过滤同档（它先收口，这里是显形的第二道）。 */
const DECLARED_TITLE_MAX_LEN = 20

/**
 * 票 20：读 style-spec 行首的「脚手架标题：」声明（**复用 `parseStyleSpecList`**，判据句式与豁免出口
 * 照抄现有实现——必含板块/禁用词那两项就是这么读的）。
 *
 * 契约原则（`parseStyleSpecList` 的注释与 CONTEXT.md 质量门词条逐字记着）：**没显式列出就跳过该项，
 * 不以硬编码词表误判**。读不到文件 / 没声明 → `state` 不是 `declared`，调用方**不追加任何检查项**
 * （那不是「绿」，是「这项没跑」——两者的区别在 check note 上写明）。
 *
 * @returns {{state:'unreadable'|'undeclared'|'declared-none'|'declared', items:string[], dropped:number}}
 */
export function declaredScaffoldTitles(projectId) {
  const path = workFile(projectId, 'style-spec.md')
  if (!existsSync(path)) return { state: 'unreadable', items: [], dropped: 0 }
  const parsed = parseStyleSpecList(readFileSync(path, 'utf8'), '脚手架标题')
  if (parsed === null) return { state: 'undeclared', items: [], dropped: 0 }
  const items = []
  let dropped = 0
  for (const raw of parsed) {
    const title = String(raw).replace(/^`+|`+$/g, '').trim()
    if (title === '') continue
    // 「无／不需要／无额外标题」= 显式声明「没有」：**不追加**，也**不**当成「关闭扫描」。
    if (NO_SCAFFOLD_TITLES.test(title)) continue
    if (title.length > DECLARED_TITLE_MAX_LEN) { dropped += 1; continue }
    if (items.length >= DECLARED_TITLE_MAX) { dropped += 1; continue }
    if (items.includes(title)) continue
    items.push(title)
  }
  return { state: items.length === 0 ? 'declared-none' : 'declared', items, dropped }
}

/**
 * 按声明的标题扫残留（票 20）。逐条独立正则 + `escapeRegExp`——**一个标题炸掉不该让整轮验货炸掉**。
 * @returns {string[]} 形如 `「写作笔记」（第 12 行：…）`
 */
export function scanDeclaredScaffolding(text, titles) {
  const found = []
  for (const title of titles) {
    let re
    try {
      re = new RegExp(escapeRegExp(title), 'g')
    } catch {
      found.push(`「${title}」（声明的标题无法编译，已跳过匹配）`)
      continue
    }
    for (const match of text.matchAll(re)) {
      const lineNo = text.slice(0, match.index).split('\n').length
      const line = text.slice(0, match.index).split('\n').pop()?.trim().slice(0, 60) ?? ''
      found.push(`「${match[0]}」（第 ${lineNo} 行：${line}）`)
    }
  }
  return found
}

/**
 * 票 20：脚手架残留的**两个来源分开报**，报告里不混成一条。
 *   · `declared` —— AI 在 style-spec 声明「本书写作时会用哪些元数据板块标题」的那些（**它要求的**）
 *   · `generic`  —— 硬编码的通用残留标记（`META`/`TODO`/`FIXME`/`HACK`/审计批注/未决问题/loader 指令）
 * ⚠️ 分开是因为两者性质不同：通用残留是**任何书都不该留的**，声明项是**本书特有**的；
 * 混成一条就会让「AI 声明要拆的」看起来像通用规则，而它其实是本书自己定的。
 */
export function scaffoldResidue(projectId, text) {
  const declared = declaredScaffoldTitles(projectId)
  return {
    generic: scanScaffolding(text),
    declared: declared.state === 'declared' ? scanDeclaredScaffolding(text, declared.items) : [],
    // 票 `pre-gold-build/16`：交付清单那 8 类的**逐类**判据（同一个 `text` 面、同一段判据，
    // 终检与单章前置验货共用——`chapters.js` 的交工验货读的就是这一份）。
    categories: scanScaffoldCategories(text),
  }
}

/** 剥掉 human 路线的 loader 指令区（装配说明，留给 AI 老师，不是成品脚手架残留）。 */
function stripLoaderRegion(text) {
  return String(text).replace(/<!-- loader:begin -->[\s\S]*?<!-- loader:end -->/g, '')
}


// ── 标题身份：合并剥章标题与终检判重共用一份定义（票 `walkthrough-fixes/36`：随拼装逻辑搬进
// `book-assembly.js`——成品拼装与「剥章标题」是同一份契约的两半，住在同一个模块里不会各漂一份）──
// ⚠️ `stripChapterTitleHeading` 仍在**本文件的导出面**上（`actions/chapters.js` 从这里 import，
// 调用点一个字没改）；`headingKey` 仍是内部件、**不许**进导出面（`test-ledger-seq-integrity.mjs` 钉着）。
export { stripChapterTitleHeading } from './book-assembly.js'


/** 真实模式：最后检查交办给主 AI（自查报告），机器硬检查兜底后交付；演示模式：机器质量门 + 交付（共用 book.md 缺失兜底）。 */
async function runPhase6(ctx, projectId, meta) {
  const bookPath = workFile(projectId, 'book.md')
  if (!existsSync(bookPath)) {
    appendEvent(projectId, 'textbook/error', { task: '交付', message: 'book.md 不存在，请回退重跑' })
    updateMeta(projectId, (state) => { state.status = 'error' })
    return 'error'
  }
  if (meta.demo) {
    // 演示模式：机器质量门 → 停 awaiting-final-approval 等人认可（与真实同闸门），认可后交付。
    //
    // ── 票 `demo-channel-full/08`：这一支以前**只产机器质量门那几项** ────────────────────────
    // 于是认可卡上没有 AI 自查报告、没有五份分查、也没有那份派生汇总件的指针——而这三件正是真书上
    // 「用户点『✅ 认可，交付』之前要看的东西」（卡那一侧早就准备好了：`view-rules.js` 的 `aiReport`
    // 读最后一条 `textbook/ai-report`，`meta.finalReport` 是汇总件的指针）。现在按**真书那一路的
    // 同一条顺序**补上（对照 `actions/chapters.js` 的 final 交工那一跳）：
    //   ① 五份分报告落 `finalAuditReportRel(n)`（内容来自 `generateContent(runtime, 'final-audit')`）；
    //   ② 机器按五份拼 `工作区/报告/final-summary.md`——**唯一实现** `refreshFinalAuditSummary`，
    //      ⛔ 不在这里自拼一份（五份不齐时它返回 `null`，那正是「不指针」的语义）；
    //   ③ `meta.finalReport` 指针（形状取自 `finalReportPointer`，与真书**同一处**出口）
    //      ＋ 自查报告全文落账本事件 `textbook/ai-report`（⚠️ 自查报告**不落盘**，只进那一笔）。
    // ⚠️ 顺序在 `runQualityChecks` **之前**：真书也是先拼汇总件再跑硬检查，`finalReport` 与 `checks`
    //    一起进 meta。⚠️ 这一段只动 `meta.demo` 这一支——真书的 `stage-submit` 一个字不改。
    const runtime = projectRuntime(ctx, projectId, meta)
    // ⚠️ **落点用「子目录助手 ＋ 基名」，⛔ 不用 `writeWork` ＋ `finalAuditReportRel(n)`**：
    // `finalAuditReportRel(n)` 是**书夹相对**路径（`工作区/报告/final-01.md`），而 `writeWork` 收的是
    // **工作区相对**的名字 ⇒ 两者直接相乘会写出 `工作区/工作区/报告/…`（本票第一版就是这么错的，
    // 实撞读数：探针打出「书夹/工作区/工作区/报告」有件、而 `书夹/工作区/报告` 是空的）。
    // 本行的形状与同文件 `writeProposalDoc()`（`proposalDir` ＋ `join(dir, name)`）和读侧
    // （`final-audit-summary.js` 的 `reportDir` ＋ `finalAuditReportName`）**同一份口径**。
    const finalReportDir = reportDir(projectId)
    for (const row of await generateContent(runtime, 'final-audit')) {
      writeFileSync(join(finalReportDir, finalAuditReportName(row.n)), row.text, 'utf8')
    }
    const summary = refreshFinalAuditSummary(projectId)
    const selfReport = await generateContent(runtime, 'final-report')
    updateMeta(projectId, (state) => { state.finalReport = finalReportPointer(selfReport, summary) })
    appendEvent(projectId, 'textbook/ai-report', { report: selfReport })
    // ── 票 `demo-channel-full/10`：终检那一刻按真书那两道契约**处置** ──────────────────────────
    // 演示通道没有主笔 AI，这两下只能由**这台机器自己**走（与票 03「章级 `done` 由这台机器自己报」
    // 同一档），两处都走真书**同一个写入口**（`closeIntervention`／`applyStyleDisposals`）：
    //   ① 留言先销号——真书那道门在 `stage-submit(final)` 那一跳（`chapters.js` 的 `pendingIv`：
    //      「还有 N 条用户留言没处理」）。演示书从不经那一跳，所以这一下由演示支自己走完，
    //      交付出去的那本书**不留一条挂着的留言**（留了就是一本真书里交不出去的书）。
    //   ② 每条生效中的风格线逐条交代去向——真书那道门是 `styleCheck` 那一格；演示书那三条
    //      示例风格线的去向与它们的正文**同源**（`content-lib.js` 的 `DEMO_STYLE_NOTES`）。
    // ⚠️ **必须在 `runQualityChecks` 之前**：下一格机器检查「风格线条条有着落」读的就是这里写完的态
    //    （那一格本票起对演示书也跑，见 `runQualityChecks` 里那一处注释）。
    // ⚠️ **只动演示通道自己注进去的那几条 id**（`DEMO_INTERVENTION_IDS`）：⛔ 不许把用户自己写的
    //    留言／风格线也一起销掉——那不是「走完这一步」，那是替用户拍板。
    for (const id of DEMO_INTERVENTION_IDS) closeIntervention(projectId, id)
    applyStyleDisposals(projectId, demoStyleDisposals())
    const startedAt = Date.now()
    const checks = runQualityChecks(projectId)
    updateMeta(projectId, (state) => { state.finalChecks = checks })
    appendEvent(projectId, 'textbook/quality', { checks })
    appendEvent(projectId, 'textbook/agent-end', { label: '最后检查（质量门）', outcome: 'ok', ...artifactDataForStage('final') }, Date.now() - startedAt)
    // 票 `demo-channel-full/05`：这一支**刚写下的那几件**（五份分查 ＋ 那份派生汇总件）也要进
    // 「实际有什么」那一份（`过程/登记.json`）——否则产物对账会把它们报成**缺件**：登记只在
    // **动作漏斗**那一层重扫（`workflow.js` 的动作出口），而这一段是引擎内部推进、不是一次 HTTP 动作。
    try { refreshArtifactRegistry(projectId) } catch { /* 登记是派生件，写不进去不拖垮这一步 */ }
    // 票 `demo-channel-full/26`：这一句在演示书上说假话的那一半是「AI 会按意见修整本」
    // ⇒ 两取值，出口＝`labels.finalCheckDoneHint`（读数写在那个常量上面）。
    ensureStatus(projectId, 'awaiting-final-approval', finalCheckDoneHint(readMeta(projectId)))
    return 'waiting'
  }
  if (meta.pendingStage === 'final') return 'waiting'
  handoff(ctx, projectId, 'final')
  return 'waiting'
}
/** style-spec 指纹：范例章交工时定格，终检交工时对账——契约修改必须留痕（Q9，2026-08-27）。 */
function specFingerprint(projectId) {
  return createHash('sha256').update(readFileSync(workFile(projectId, 'style-spec.md'), 'utf8')).digest('hex').slice(0, 16)
}


/**
 * 票 12 · ①：**机器替 AI 记「它改了机器契约」这一笔**（落账侧检测）。
 *
 * 病（2026-09-29 真机走查）：范例章 22:57:09 定稿、指纹 `1e117f928b674fc7` 定格，
 * **`工作区/style-spec.md` 在 88 分钟后的 00:25:22 被改写**——而这 88 分钟里第 1–12 章全部照**旧版**落盘。
 * 机器**有**判据（终检那一次对账），但它：① 拦在最后一刻、② 拦错了对象（说的是「你的报告要补一句声明」，
 * 不是「你那 12 章是照一份已经作废的契约写的」）、③ **账本里一个字都没有**。
 *
 * 判据只有一条：**当前指纹 ≠ 范例章定稿时定格的那一枚**。其余全是边界：
 * - 范例章还没定稿（`styleSpecHash` 为 null）⇒ 根本没有「定稿后」这一说，不记；
 * - 读不到文件 ⇒ `to` 记 null 并照记一笔（「删掉规范逃检查」也是一次变更，**读不出不是「没变」**）；
 * - **同一次变更只记一条**（`styleSpecSeen` 存的是「已记过的那一枚」；`null` 也是一个**合法的已记值**——
 *   判键在不在，⛔ 不拿 `??` 回落。票 `walkthrough-fixes/34` 的病灶就是这一处回落）——
 *   调用点在工作台 2 秒一轮的轮询里，不去重就是每两秒一条事件，把账本淹掉。
 *
 * ⚠️ **为什么检测点是一个 GET**：AI 用文件工具直接改盘，服务端没有写入点可挂；
 * 唯一「那段时间里一定在跑」的东西是工作台自己的轮询（`/textbook/process`）。
 * 稳态下它**只读不写**（指纹没变就立即返回），且终检交工那一次也会补检一次，
 * 所以「工作台没开过」也不漏记。**这是一个有意的取舍，写在这里以免下一个人当漏洞改掉。**
 *
 * @returns {boolean} 这一次是否真的新记了一条
 */
function noteStyleSpecChange(projectId) {
  const meta = readMeta(projectId)
  const frozen = meta?.styleSpecHash
  if (frozen == null) return false
  let now = null
  try { now = specFingerprint(projectId) } catch { /* 文件不在/读不到：to 记 null，那也是一次变更 */ }
  if (now === frozen) return false
  // ⚠️ 票 `walkthrough-fixes/34`：去重键是「**已记过的那一枚**」，而「已记过的那一枚」**可以是 null**
  // （文件读不到时 `to` 记 null）。原先这里写的是 `(meta.styleSpecSeen ?? frozen) === now`——
  // `??` 把「**存过 null**」读成了「**没存过**」，于是 `now === null` 时回落成 `frozen` ≠ `null`，
  // 去重条件**恒不成立**：每打一次 GET（工作台两条轮询路各一发）就追一条账，账本无上界增长，
  // 而机器自己造的这一族条目又把 `deep-undo` 的「账面无新进展」守卫顶掉（撤销窗口永久打不开）。
  // ⇒ 这里按「**键在不在**」取默认值：键不在＝没记过（基线取 `frozen`，等价于「此刻还没变」）；
  //    键在而值是 `null`＝**已记过「那一枚是 null」**。⛔ 不许改回 `??`，也不许在外层再包一层
  //    「`now === null` 就不记」——「读不出不是『没变』」，第一次必须照记（见上面那段边界注释）。
  const seen = Object.prototype.hasOwnProperty.call(meta, 'styleSpecSeen') ? meta.styleSpecSeen : frozen
  if (seen === now) return false
  const chapters = (meta.outline?.chapters ?? []).filter((_c, i) => existsSync(workFile(projectId, chapterName(i + 1)))).length
  appendEvent(projectId, 'textbook/style-spec-change', { from: frozen, to: now, chapters })
  updateMeta(projectId, (state) => { state.styleSpecSeen = now })
  return true
}


/** 服务端确定性质量门（机器兜底，不依赖 LLM）：主 AI 自查之外的最后防线。 */
/** 从 style-spec 读机器可判定的契约列表（质量门判据，非硬编码）：
 * 只认行首显式声明的清单行（允许 markdown 标题 # 与加粗 ** 前缀）——「必含板块：」「禁用词：」开头；
 * 正文里「句中提到必含板块」的行不再被误当清单（2026-08-27 grill 修订，防误判卡死交付）。
 * 契约原则：style-spec 没显式列出 → 返回 null，跳过该项检查（不以硬编码词表误判）。 */
function parseStyleSpecList(specText, label) {
  if (typeof specText !== 'string' || specText === '') return null
  const re = new RegExp(`(?:^|\\n)\\s*(?:#{1,6}\\s*)?(?:\\*\\*)?${label}(?:\\*\\*)?\\s*[:：]([^\\n]*)`)
  const m = specText.match(re)
  if (m === null) return null
  const items = m[1].split(/[、,，;；|/]+/).map((s) => s.trim().replace(/^[-*]\s*/, '')).filter((s) => s.length > 0 && s.length <= 20)
  return items.length > 0 ? items : null
}


// ── 票 `flow-audit-2026-10/03`：终检两条契约检查的**机器基线** ─────────────────────────
//
// 病：这两项只在 style-spec **写了声明行**时才生成，等于被检方自己决定检不检它。
// 口径反过来：**机器定基线，style-spec 只能加严不能关闭**。
//
//   · 必含板块：基线从**已拍板的设计产物**里读——优先读 `工作区/决策/05.json` 的
//     `values.boards`（第 2 关的结构化值，若将来写入）；否则读 style-spec 的
//     「章内板块语法」一节里「必含板块（…）：」后面那串编号加粗词条（真书就是这么写的）。
//   · 禁用词：基线是**项目级**的最小词表（`PROJECT_BANNED_WORDS`，只收两个几乎总是
//     AI 腔/总结腔的词）；style-spec 的「禁用词：」声明行只做**追加**。
//
// ⚠️ 没有基线时**不是通过**：调用方必须落 `state:'not-checked'`，交付账上看得见这一格是空的。
// ⚠️ 枚举面窄处：板块基线只认「章内板块语法」一节里的那两种写法（编号加粗词条、或决策件
//    `values.boards` 数组）；写成散文/表格/其它符号的板块名**读不出来** ⇒ 落 not-checked，
//    ⛔ 不猜、也不回落硬编码列表。禁用词只做**子串**命中，不判语境。
/** 项目级禁用词最小基线（票 03 要求「先落一份最小基线」；style-spec 声明行只追加）。 */
const PROJECT_BANNED_WORDS = Object.freeze(['众所周知', '综上所述'])

/** 从 style-spec 的「章内板块语法」设计段读出必含板块；读不出返回 null（＝没有基线）。 */
function parseDesignBoards(specText) {
  if (typeof specText !== 'string' || specText === '') return null
  const heading = /^#{1,6}\s*(?:\d+\.\s*)?\*{0,2}章内板块语法\*{0,2}.*$/m.exec(specText)
  if (heading === null) return null
  const rest = specText.slice(heading.index + heading[0].length)
  const nextHeading = rest.search(/^#{1,6}\s+/m)
  const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading)
  const names = []
  const blocks = section.matchAll(/必含板块[^\n]*[:：][^\n]*\n([\s\S]*?)(?=\n\s*\*\*[^*\n]+\*\*|\n#{1,6}\s+|$)/g)
  for (const block of blocks) {
    for (const item of block[1].matchAll(/^\s*\d+[.、]\s*\*\*(.+?)\*\*/gm)) {
      const name = item[1].replace(/[（(].*?[）)]/g, '').trim()
      if (name !== '' && name.length <= 20 && !names.includes(name)) names.push(name)
    }
  }
  return names.length > 0 ? names : null
}

/** 读第 2 关结论件里的结构化板块（若将来有）；读不出返回 null。 */
function decisionBoards(projectId) {
  let record = null
  try { record = readStationDecision(projectId, '05') } catch { record = null }
  const values = record?.values
  if (values === null || values === undefined || typeof values !== 'object' || Array.isArray(values)) return null
  const boards = values.boards
  if (!Array.isArray(boards)) return null
  const names = boards.filter((item) => typeof item === 'string' && item.trim() !== '' && item.trim().length <= 20).map((item) => item.trim())
  return names.length > 0 ? names : null
}

/** 从第 2 关提案（已拍板的教学设计产物）里读板块名：`第 N 段·<板块名>`。
 *  真书的提案正文就是这种形状；读不出返回 null。⚠️ 只认「第 N 段·」这一种写法，
 *  散文/表格里的板块名读不出来 ⇒ 再看 style-spec 的「章内板块语法」那一节，最后才是声明行。 */
function proposalBoards(projectId) {
  let names = null
  try {
    const files = readdirSync(proposalDir(projectId))
      .filter((name) => /^关卡2-v\d+\.md$/.test(name))
      .sort((a, b) => Number(a.match(/v(\d+)/)[1]) - Number(b.match(/v(\d+)/)[1]))
    const latest = files.at(-1)
    if (latest !== undefined) {
      const text = readFileSync(join(proposalDir(projectId), latest), 'utf8')
      const found = []
      for (const match of text.matchAll(/第\s*\d+\s*段\s*[·:：]\s*([^\n（(，,。]+)/g)) {
        const name = match[1].trim().replace(/[*`]/g, '').slice(0, 20)
        if (name !== '' && !found.includes(name)) found.push(name)
      }
      if (found.length > 0) names = found
    }
  } catch { names = null }
  return names
}

/** 终检两条契约检查的基线：`{boards, banned, sources}`；`boards === null` ＝没有口径。 */
function qualityContractBaseline(projectId, spec) {
  const fromDecision = decisionBoards(projectId)
  // 优先级：结构化结论件 → 已拍板的教学设计提案（另一个文件）→ style-spec 的板块语法节 → 声明行。
  const fromProposal = proposalBoards(projectId)
  const fromDesign = parseDesignBoards(spec)
  const declaredBoards = parseStyleSpecList(spec, '必含板块')
  const boardParts = [fromDecision, fromProposal, fromDesign, declaredBoards].filter((part) => part !== null)
  const boards = boardParts.length === 0 ? null : [...new Set(boardParts.flat())]
  const declaredBanned = parseStyleSpecList(spec, '禁用词')
  const banned = [...new Set([...PROJECT_BANNED_WORDS, ...(declaredBanned ?? [])])]
  return { boards, banned }
}


/** style-spec 是否显式声明「本书不设练习」（契约原则：声明豁免自动跳过练习/答案检查）。 */
function styleSpecDeclaresNoExercises(projectId) {
  const path = workFile(projectId, 'style-spec.md')
  if (!existsSync(path)) return false
  const spec = readFileSync(path, 'utf8')
  return /不设练习|无练习|不设习题|无习题|不写练习|不要练习/.test(spec)
}


// ── 票 `pre-gold-build/16`：交付清单那四道（债-14／16／20／22）──────────────────────────
//
// 四条承诺面都在 `resources/references/delivery-checklist.md`（交付清单正本）：
//   · **债-14 必含板块**：质量门第 ① 项「= 章数 × 每章必含板块数（从 style-spec 读）」——
//     旧实现是 `requiredBoards.filter((board) => !bookText.includes(board))`：**全书出现过一次
//     就判绿**，既没数、也没有「每章」这一维（承诺面自己要求的「grep 计数」在实现里不存在）。
//   · **债-16 拆脚手架八类**：第 5 行「这不是可选项，是交付前的硬门」＋ 那 8 类——旧实现只有
//     `SCAFFOLD_MARKERS` 一条正则（7 个通用标记），与那 8 类**几乎没有交集**。
//   · **债-20 正文无元指令残留**：`invariants.md` H1（不内嵌「给 AI 老师」的元指令、技术回溯
//     标注、yaml frontmatter）＋ `two-routes.md` §四 human-readable 那一行——旧实现与「拆脚手架」
//     **共用那份 7 词表**，承诺面自己举的两个例子（`【AI 老师提问脚本】`、yaml frontmatter）一条都不命中。
//   · **债-22 交叉引用不悬空**：质量门第 ⑤ 项「随机抽查 3 章，验证……交叉引用指向的章/概念
//     真实存在」——旧实现里那一格判的是**另一样东西**（大纲 `source` 的「资料N」≤ 源材料数，
//     见下面「章节引用可追溯」那一条）。

/**
 * 「必须拆除的 8 类过程元数据」的**逐类**判据（票 `pre-gold-build/16` · 债-16）。
 *
 * 逐类的形状取自承诺面自己那张表与它 §2 的逐类搜索命令，不另发明一套词表：
 *   ① 版本标记注释（`<!-- v2 师生合版新增 -->`）／② 「新增内容」措辞／③ 自检清单（`- [x] …`）
 *   ④ 版本记录（`v1.0（初稿）：…`）／⑤ 源教材引用（「教师用书说…」）／⑥ 造书者口吻（「给人类教师」）
 *   ⑦ 增量描述（「在 v1 基础上追加」）／⑧ 过程勾选项（清单里**已勾选**的 `- [x]`）
 *
 * **硬／软两档按形状的可判性分**（不是按重要性）：`hard` 是形状本身就说明它是过程元数据的那些，
 * 命中即不绿；`soft` 是**措辞类**——「新增」「可追溯」这类词在正常教材正文里也可能合法出现
 * （「本节新增三个例题」「可追溯的历史脉络」），机器只把它们连同行号提示出来，判定权归 AI 检查报告。
 *
 * ⚠️ **枚举面比现实窄在哪**（照 `AGENTS.md` 引的票 `dev-gate-scan/17` 纪律写在旁边）：
 *   · 每一类只收承诺面那张表**自己写出来的**那几种写法（第 ⑤ 类只有「教师用书说／教材原文指出／
 *     学生用书说／原文指出」四个短语）——同一语义的别的说法（「据教师用书」「教材上写着」）不命中，
 *     机器看不出来；承诺面那张表本身也只是那 8 类的一个**取样**，不是穷举。
 *   · ③／⑧ 只认**已勾选**的 `[x]`／`[X]`（承诺面举的两个例子都是勾选态，打勾才说明「我核过了」）：
 *     正文里 `- [ ] 我能说出…` 这种给读者的自评清单不判——**这一条收窄是有意的**，代价是
 *     一份没被勾选过的残留自检清单也漏得过去（那归 AI 检查报告与人工过目）。
 *   · 按**行**判：一行里同时犯硬类与软类时只报**硬类**那一类（软措辞不许把硬命中挡在报告外）；
 *     跨行的元数据块（多行 HTML 注释里第二行才出现版本号）只认命中那一行。
 *   · 表里的 ③ 与 ⑧ 在承诺面里本就是同一件事（自检清单／清单里的勾选项），这里照它保留两行，
 *     但扫描时**同一行只报一次**（同一行内同类只留一条）。
 */
export const SCAFFOLD_CATEGORY_CHECKS = Object.freeze([
  Object.freeze({ id: '①', label: '版本标记注释', tier: 'hard', re: /<!--[^>\n]*\bv[ \t]?\d/i }),
  Object.freeze({ id: '②', label: '“新增内容”措辞', tier: 'soft', re: /新增|追加|新加/ }),
  Object.freeze({ id: '③', label: '自检清单', tier: 'hard', re: /^[ \t]*[-*+][ \t]*\[[xX]\][ \t]*[^\n]*/ }),
  Object.freeze({
    id: '④',
    label: '版本记录',
    tier: 'hard',
    re: /(?:^|[^0-9A-Za-z])v[ \t]?\d+(?:\.\d+)*[ \t]*[（(：:]?[ \t]*(?:初稿|定稿|修订|改版|版本|版次)|(?:版本记录|修订记录|修订日志)[ \t]*[：:]/,
  }),
  Object.freeze({ id: '⑤', label: '源教材引用', tier: 'hard', re: /教师用书说|教材原文指出|学生用书说|原文指出/ }),
  Object.freeze({ id: '⑥', label: '造书者口吻', tier: 'soft', re: /给人类教师|可追溯|造书者|人类教师/ }),
  Object.freeze({
    id: '⑦',
    label: '增量描述',
    tier: 'hard',
    re: /v[ \t]?\d+(?:\.\d+)?[ \t]*(?:增量|基础)|在[ \t]*v[ \t]?\d|基础上追加|基础上补充/,
  }),
  Object.freeze({ id: '⑧', label: '过程勾选项', tier: 'hard', re: /^[ \t]*[-*+][ \t]*\[[xX]\][ \t]*[^\n]*/ }),
])

/** 硬查的类数 / 只提示的类数——报告里那句「机器硬查其中 N 类」从这张表现算，不手抄。 */
export const SCAFFOLD_HARD_CATEGORY_COUNT = SCAFFOLD_CATEGORY_CHECKS.filter((c) => c.tier === 'hard').length


/**
 * 逐类扫残留（票 `pre-gold-build/16`）。分类照承诺面那张表的顺序与编号。
 *
 * ⚠️ **同一条命中只归一类、硬类优先**：表里的 ③ 与 ⑧ 是同一件事（承诺面自己写了两行），同一行
 * 只会报一次；一行同时犯硬类与软类时先报硬类——否则「追加」这类软措辞会把同一行上的硬类挡在
 * 报告外（`在 v1 基础上追加` 既命中 ⑦ 硬类、也命中 ② 软类，实测第一版就是这么把 ⑦ 漏掉的）。
 * @returns {{hard: string[], soft: string[]}} `hard` 命中即不绿；`soft` 只进报告、不拦交付。
 */
export function scanScaffoldCategories(text) {
  const lines = String(text).split('\n')
  const byLine = new Map()
  for (const category of SCAFFOLD_CATEGORY_CHECKS) {
    for (let index = 0; index < lines.length; index += 1) {
      const match = lines[index].match(category.re)
      if (match === null) continue
      const excerpt = lines[index].trim().slice(0, 60)
      const key = `${index + 1}|${excerpt}`
      const slot = byLine.get(key) ?? { index, excerpt, hard: [], soft: [] }
      const bucket = category.tier === 'hard' ? slot.hard : slot.soft
      if (!bucket.some((one) => one.id === category.id)) bucket.push({ id: category.id, label: category.label })
      byLine.set(key, slot)
    }
  }
  const hard = []
  const soft = []
  for (const slot of [...byLine.values()].sort((a, b) => a.index - b.index)) {
    const winner = slot.hard[0] ?? slot.soft[0]
    if (winner === undefined) continue
    // 命中原文就是 `excerpt`（整行去掉首尾空白），不另摘 `match[0]`：`- [x] 勾` 那种半截匹配更难看懂。
    const entry = `${winner.id} ${winner.label}（第 ${slot.index + 1} 行：${slot.excerpt}）`
    if (slot.hard.length > 0) hard.push(entry)
    else soft.push(entry)
  }
  return { hard, soft }
}


/**
 * 正文里的**元指令残留**（票 `pre-gold-build/16` · 债-20）——只认三种形状：
 *   ① yaml frontmatter 围栏块（`---` … `---`，且它**在书首或紧跟章标题行**、块内每一非空行都是
 *      `键：值`／列表项，免得把正文里两条 `---` 之间的普通段落误判成 frontmatter）；
 *   ② 独立成行的方括号块标题，且标题里带「指令／脚本／提示词／元数据／AI 老师」这类词
 *      （承诺面自己举的例子 `【AI 老师提问脚本】`）；
 *   ③ 行首「给 AI 老师」「元指令」开头的句子（承诺面那句「不内嵌「给 AI 老师」的元指令」）。
 *
 * ⚠️ **只对 human-readable 路线成立**：blueprint 的正文**可以**含元指令块与章级 yaml frontmatter
 * （`two-routes.md` 的两路线对照表）⇒ 那一路线**整项不追加**（不是「查过没查到」，与「声明了才查」
 * 那条契约原则同一形状）。
 * ⚠️ **枚举面比现实窄在哪**：行内夹在句子里的元指令（「（此处请引导学生……」）、技术回溯标注
 * （「第二稿」「上一版」那族）、纯靠语义才认得出的造书者口吻都不在这三种形状里——那归 AI 检查报告。
 * @returns {string[]} 逐条形如 `yaml frontmatter 块（第 3–6 行：title: 有理数）`
 */
export function scanMetaInstructionResidue(text) {
  const src = String(text)
  const lines = src.split('\n')
  const found = []
  const isChapterHeading = (line) => {
    const m = line.match(/^#{1,3}[ \t]+(.*)$/)
    return m !== null && CHAPTER_HEADING_RE.test(m[1].trim())
  }
  for (let i = 0; i < lines.length; i += 1) {
    if (!/^---[ \t]*$/.test(lines[i])) continue
    // 形状①的锚：书首（前面只有空行）或紧跟章标题行——正文中间的分隔线不算 frontmatter 残留。
    const anchor = lines.slice(0, i).every((line) => line.trim() === '') || isChapterHeading(lines[i - 1])
    if (!anchor) continue
    const body = []
    let closed = false
    let j = i + 1
    for (; j < lines.length; j += 1) {
      if (/^---[ \t]*$/.test(lines[j])) { closed = true; break }
      if (lines[j].trim() === '') continue
      if (!/^(?:#|-\s+|[\w\u4e00-\u9fa5][^:：]*[:：])/.test(lines[j])) break
      body.push(lines[j].trim())
    }
    if (!closed || body.length === 0) continue
    found.push(`yaml frontmatter 块（第 ${i + 1}–${j + 1} 行：${body[0].slice(0, 40)}）`)
    i = j
  }
  const META_BLOCK_RE = /^[ \t]*(?:#{1,6}[ \t]+)?【[^】\n]{1,40}】[ \t]*$/
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (META_BLOCK_RE.test(line) && /指令|脚本|提示词|prompt|元数据|元指令|AI[ \t]?老师/i.test(line)) {
      found.push(`方括号元指令块（第 ${i + 1} 行：${line.trim().slice(0, 40)}）`)
      continue
    }
    if (/^[ \t]*(?:#{1,6}[ \t]+)?(?:给[ \t]*AI[ \t]*老师|元指令)(?:[：:]|[ \t]|$)/.test(line)) {
      found.push(`元指令句（第 ${i + 1} 行：${line.trim().slice(0, 40)}）`)
    }
  }
  return found
}


/**
 * 按机器合并时拼的章标题行（行首 1–3 级 `#` ＋「第N章」）把成品正文切成**每章一段**。
 * 第一个章标题之前的内容（前言／loader 指令区）不属于任何一章，整段丢掉。
 * ⚠️ 章界在**这一族里是三个口径**，别把它们当同一件（收口 review 的 finding 3 照实订正）：
 *   ① 本函数（切段落用）：`#{1,3}` ＋ `CHAPTER_HEADING_RE`（`^第\s*[0-9一二三四五六七八九十百零两]+\s*章`，
 *      半角与中文数字都收）；② 质量门「章节数符合大纲」的计数用的是**另一条正则**
 *      `/^#{1,3}\s*第\s*\d+\s*章/gm`（`runQualityChecks`）——它**只认半角数字**（`\d`），
 *      于是 `## 第二章…`（中文数字）在本函数这里是章界、在计数那里一个字都数不到；
 *      反过来 `## 第2章…` 计数当章界、而 ③ 不认它。③ 终检「无重复标题」那一段分章
 *      只认 **1 级**标题（`match[1].length === 1` ＋ `CHAPTER_HEADING_RE`）——那一层对齐的是
 *      合并时**机器自己拼**的 `# 第N章 …`（`workflow/actions/chapters.js` 的拼装处）。
 * ⚠️ 另有一处「交叉引用跳过」用 `#{1,6}` ＋ `CHAPTER_HEADING_RE`（`scanChapterReferences`）——
 *    它与 ③ **今天不等价**（实测：同一行 `## 第2章 小结`，前者判 true、后者判 false），
 *    所以两处**有意不合**：合成一个形状必然改掉其中一处对 `## 第N章` 的判定（那是行为变化）。
 * ⚠️ 正文自带的、不带 `#` 的「第N章」行分不出章界，会被算进上一章的段里；`#### 第N章`（4 级及
 *    更深）在本函数（只到 3 级）与 ③（只认 1 级）也都不算——这就是「按章计数」的枚举面窄处。
 * @returns {string[]} 第 i 项＝第 i+1 章那一段（章标题行本身不在段里）
 */
export function splitIntoChapters(bookText) {
  const segments = []
  let current = null
  for (const line of String(bookText).split('\n')) {
    const heading = line.match(/^(#{1,3})[ \t]+(.*)$/)
    if (heading !== null && CHAPTER_HEADING_RE.test(heading[2].trim())) {
      current = []
      segments.push(current)
      continue
    }
    if (current !== null) current.push(line)
  }
  return segments.map((chunk) => chunk.join('\n'))
}


/**
 * 正文里的「第 N 章」交叉引用 vs 大纲章数（票 `pre-gold-build/16` · 债-22）。
 * 章标题行本身**不算引用**（它是这一章的名字，不是指向别处的指针）。
 * ⚠️ **枚举面比现实窄在哪**：只认半角数字的「第N章」（允许中间的空格/制表）；「第 3、4 章」这种并列、
 * 「见附录 A」「见卡 X.Y」两种承诺面点名的形式、以及中文数字（「第三章」）都不在扫面内；
 * 「概念／知识点真实存在」那一半机器结构上判不了（要读知识地图再判语义）——归 AI 检查报告与跨章审计。
 * @returns {{scanned: number, dangling: string[]}} `scanned` = 扫到几处引用（0 处时报告要照实说没内容可查）
 */
export function scanChapterReferences(bookText, chapterCount) {
  const lines = String(bookText).split('\n')
  const dangling = []
  let scanned = 0
  for (let i = 0; i < lines.length; i += 1) {
    const heading = lines[i].match(/^#{1,6}[ \t]+(.*)$/)
    if (heading !== null && CHAPTER_HEADING_RE.test(heading[1].trim())) continue
    for (const match of lines[i].matchAll(/第[ \t]*([0-9]+)[ \t]*章/g)) {
      scanned += 1
      const n = Number(match[1])
      if (n < 1 || n > chapterCount) {
        dangling.push(`第 ${match[1]} 章（第 ${i + 1} 行：${lines[i].trim().slice(0, 40)}）`)
      }
    }
  }
  return { scanned, dangling }
}


/**
 * 进度保鲜的**现算读数**（票 `pre-gold-build/12` · 债-12）。
 *
 * 义务面写着「每个小助手回来、每交工一章时**必须补一条** progress」，而机器此前**零判据**：
 * 交工那一跳只 `existsSync(工作区/progress.md)`、终检那一格也只判「文件在不在」。
 * 今天这一格把**能算的都算出来**：最后一条进度记录落在多久之前、此后又交工了几章——
 * **它是读数不是闸门**（不拦交工），够不够勤由人看。「一个章的时长」机器量不出来，
 * 所以它报的是**时长 ＋ 章数**两个可复算的事实，而不是一句「该补了」。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：只认账本事件 `textbook/progress` 与带 `chapter` 的
 * `textbook/agent-end`（＝逐章交工那一跳）；`工作区/progress.md` 那份**文件**的内容机器不解析
 * （它是 AI 的自由文本、没有形状契约），所以「文件里补了行、账本没补」这一格看不见。
 *
 * @returns {{hasRecord: boolean, text: string}} `text` 以「；」开头，供调用方拼在句尾；
 *   **账本里一条进度记录都没有**时 `hasRecord` 为 `false`（调用方据此换一句**说得通**的话，
 *   ⛔ 不拼出「工作记录在；账本里还没有一条进度记录」这种半句——票 `demo-channel-full/04` 起
 *   演示书也跑这一格，而演示通道不上报 `progress`，所以那一支**真会被走到**）。
 */
function progressFreshnessNote(events) {
  let lastProgressAt = null
  let chaptersAfter = 0
  for (const event of events) {
    if (event?.type === 'textbook/progress') {
      lastProgressAt = Number.isFinite(Number(event.time)) ? Number(event.time) : null
      chaptersAfter = 0
      continue
    }
    if (lastProgressAt !== null && event?.type === 'textbook/agent-end'
      && Number.isSafeInteger(event.data?.chapter)) chaptersAfter += 1
  }
  if (lastProgressAt === null) return { hasRecord: false, text: '；账本里还没有一条进度记录' }
  const minutes = Math.max(0, Math.round((Date.now() - lastProgressAt) / 60000))
  return {
    hasRecord: true,
    text: `；最后一条进度记录在${minutes === 0 ? '刚刚' : `${minutes} 分钟前`}，此后又交工了 ${chaptersAfter} 章（这一格只报数、不拦）`,
  }
}

/**
 * 逐章「检查记录在不在、审的是不是当前这份正文」的读数（票 `audit-state-regression/01`）。
 *
 * 交付清单那一格原先只数 `工作区/audit-NN.md` 的个数：十章各有一份检查记录就算过，而正文在
 * 交工之后被重写、检查记录还是旧稿时，交付闸照样放行（真机《无声的战争》第 8 章即此形状）。
 * ⇒ 这一格改成**有且新鲜**，并且逐章点名正文与检查记录各自的时刻。
 *
 * ⚠️ **判据不在这里写第二份**：新鲜不新鲜由 `domain-rules.auditCoversProduct` 判（章卡、
 * 过目闸门、`chapterStatus[].done` 全走它）；本函数只取两侧 mtime。
 * ⚠️ 只认 `chapterArtifacts` 给的那一份（`audit-NN.md`）：与 `chapterDone`／章徽章认的是同一个
 * 文件；`audit-NN.json` 是 `readdirSync` 旧计数才认的旁族，不在这里单开一档（否则三处读数又会
 * 对同一章给出两个答案）。老书上只有 `.json` 时会从「放行」变「拒收」——如实登记在票面风险里。
 *
 * @param {string} projectId
 * @param {object|null} meta
 * @returns {Array<{n:number,title:string,productModifiedAt:number|null,auditedModifiedAt:number|null,present:boolean,fresh:boolean}>}
 */
function chapterAuditCoverage(projectId, meta) {
  return (meta?.outline?.chapters ?? []).map((chapter, index) => {
    const n = index + 1
    return {
      n,
      title: typeof chapter?.title === 'string' ? chapter.title : '',
      // 读数取 `engine/stage-facts.js` 的**同一份**实现（章级四项事实也用它）——
      // 本文件不再自己 stat 两次，也不另判一次新鲜。
      ...chapterAuditReading(projectId, n),
    }
  })
}

/** 人读时刻（交付清单点名用）；读不出就照实说读不出，⛔ 不编一个时间。 */
function clockText(ms) {
  return Number.isFinite(Number(ms)) && ms !== null
    ? new Date(Number(ms)).toLocaleString('zh-CN', { hour12: false })
    : '读不出时间'
}

/** 交付清单里对一章「检查记录有问题」的点名（正文与检查记录各是什么时间，一眼可对）。 */
function chapterAuditProblemText(row) {
  const title = row.title === '' ? '' : `《${row.title}》`
  return `第 ${row.n} 章${title}（正文 ${clockText(row.productModifiedAt)}，`
    + `检查记录 ${row.present ? clockText(row.auditedModifiedAt) : '不在'}）`
}

function runQualityChecks(projectId) {
  const meta = readMeta(projectId)
  const bookPath = workFile(projectId, 'book.md')
  const sourceCount = (meta?.sources ?? []).length
  const chapterCount = meta?.outline?.chapters?.length ?? 1
  const bookText = readFileSync(bookPath, 'utf8')
  // human 路线的 loader 指令区是给 AI 老师的装配说明（保留在成品里），扫脚手架前剥掉，避免误判残留。
  const scanText = meta?.route === 'human' ? stripLoaderRegion(bookText) : bookText
  // 票 20：通用残留与「AI 声明要拆的」**分两个来源收**（报告里也是两条，不混）。
  // 声明项在 style-spec 没显式声明时**整项不追加**（契约原则：不以硬编码词表误判）——
  // 注意「没跑」与「跑过且全绿」在 note 上必须说得出来，否则界面会拿「没查」当「查过了」。
  const declaredTitles = declaredScaffoldTitles(projectId)
  const residue = scanScaffolding(scanText)
  const declaredResidue = declaredTitles.state === 'declared' ? scanDeclaredScaffolding(scanText, declaredTitles.items) : []
  // 票 `audit-state-regression/01`：这一格从「数 audit 文件个数」改成「逐章有且新鲜」——
  // 旧式的 `readdirSync` 计数已删（它对同一章可能给出第二个答案）。
  const auditCoverage = chapterAuditCoverage(projectId, meta)
  const auditProblems = auditCoverage.filter((row) => !row.present || !row.fresh)
  // 防空跑（`docs/测试信任边界.md` 总纲 #1）：没有章节清单时 `auditCoverage` 是空集，
  // `problems.length === 0` 会在空集上恒真——旧实现（至少 1 份 audit 文件）在这里是红的。
  // 退化书（没有 outline、盘上却有 `audit-NN`）退回旧的文件数口径，**只在这一格**；
  // 一旦有章节清单就逐章判新鲜（那才是本票的主路径）。
  const legacyAuditNames = auditCoverage.length === 0
    ? readdirSync(workDir(projectId)).filter((name) => /^audit-\d+\.(md|json)$/.test(name))
    : []
  const auditScopeShort = auditCoverage.length === 0
    ? legacyAuditNames.length < chapterCount
    : auditCoverage.length < chapterCount
  const auditWaived = waived(projectId, 'audit-skip')
  const scaffoldWaived = waived(projectId, 'scaffold-keep')
  const gateWaived = waived(projectId, 'gate-skip')
  // ⚠️ 这里原先有一个 `const otherWaived = waived(projectId, 'other')`：**一票放行整族**的旧形状。
  // 票 `walkthrough-fixes/23`（ADR-0008 修订 2026-10-06）已把它收掉——「其他」现在只能**逐条点名**
  // 放行：能被它放行的检查在自己的对象上声明现场细节 `otherDetail`，数组末尾的收口那一遍按
  // **检查项自己的名字**问 `otherWaiverFor`，交付面 note 也用同一个名字拼。
  // 票 15①（票 06 的 Answer）：这里原先还有一支「三关全 approved」的实时折叠判断——它**恒假**，
  // 因为折叠只保留最后一关（foldGate(wanted=null) 只折出最后那一关的当前状态），
  // `every(gate => current === gate)` 不可能对三关同时成立。恒假支已删，只留按事件统计的这一支。
  const gatesApproved = (() => {
    // 折叠只保留最后一关，所以只能按事件统计三关是否都通过过。
    const approved = new Set()
    for (const event of readEvents(projectId)) {
      if (event.type === 'textbook/gate-decision' && event.data.approved === true) approved.add(event.data.gate)
    }
    return approved.has('1') && approved.has('2') && approved.has('3')
  })()
  // ── 票 `walkthrough-fixes/19`③：跳过那一族的**第三态**（接缝①：机器验货面）──────────────
  // 被跳过的关卡在这里既**不是** `ok:true`（没验过，不许折进「已通过」的计数），
  // 也**不是**一道拦人的红（跳过＝把验货推迟并记账，不是取消验货、也不是新增一道闸）。
  // ⇒ 第三态用 `state: 'skipped'` 表达：`ok` 仍是 false（下游读 `ok` 的地方照旧看到「未验」），
  //    放行判定（`stage-submit final` / `final-approve`）按 `state` 把它排除在「没过」之外。
  // ⚠️ 与四类豁免的分别：豁免走 `waived()` → 那一行是 `ok:true` ＋ note「你已同意：…」（**取消**了检查）；
  //    跳过走 `meta.skippedSteps` → 这一行是 `state:'skipped'`（检查**还在那儿、只是没做**）。
  const skippedSteps = Array.isArray(meta?.skippedSteps) ? meta.skippedSteps : []
  const approvedGates = (() => {
    const approved = new Set()
    for (const event of readEvents(projectId)) {
      if (event.type === 'textbook/gate-decision' && event.data.approved === true) approved.add(event.data.gate)
    }
    return approved
  })()
  const missingGates = ['1', '2', '3'].filter((g) => !approvedGates.has(g))
  const skippedGateIds = new Set(skippedSteps
    .filter((s) => typeof s?.step === 'string' && s.step.startsWith('gate-'))
    .map((s) => s.step.slice('gate-'.length)))
  const designSkipped = !gatesApproved && !gateWaived && missingGates.length > 0
    && missingGates.every((g) => skippedGateIds.has(g))
  // 票 15②（票 06 的 Answer 第 2 条）：成品文件齐全**真数既有产物清单**——`工作区/book.md` ＋ 每章
  // `工作区/chapter-NN.md`（清单从 meta.outline 读，不硬编码章数）。缺项即 ok:false（other 豁免仍可放行）。
  // 按**硬闸门**的强度做：runQualityChecks 的结论在终检交工处是「全过才交付」，恒真项等于这道闸门少一格。
  // 清单**绝不许含** `preface.md` / `progress.md`：
  //   · `preface.md` 演示通道不写它，含了就是给 demo 判假（判据按 demo 的确定性产物清单校准，不给 demo 开豁免）；
  //   · `progress.md` **票 `demo-channel-full/04` 起演示通道写了**，但它照旧**不进这张清单**——
  //     这张清单是**读者产物**（成品 ＋ 逐章正文），而进度账本是协调用的中间件
  //     （`domain-rules` 的 `SWEEP_EXCLUDED` 逐条有理由：那一族归「环节状态」管，不从产物里数）。
  //     ⚠️ 别把这一句读成「演示通道没有进度账本」——它现在有，只是不该出现在这张清单里。
  const requiredArtifacts = [
    { rel: '工作区/book.md', path: bookPath },
    ...(meta?.outline?.chapters ?? []).map((_chapter, index) => {
      const { chapterPath } = chapterArtifacts(projectId, index + 1)
      return { rel: chapterRel(index + 1), path: chapterPath }
    }),
  ]
  const missingArtifacts = requiredArtifacts.filter((item) => !existsSync(item.path) || readFileSync(item.path, 'utf8').trim() === '')
  const checks = [
    {
      name: '成品文件齐全',
      ok: missingArtifacts.length === 0,
      otherDetail: missingArtifacts.length === 0 ? undefined : `缺：${missingArtifacts.slice(0, 3).map((i) => i.rel).join('、')}`,
      note: missingArtifacts.length === 0
        ? `该有的成品文件都在（${requiredArtifacts.length} 份）`
        : `少了这些成品文件：${missingArtifacts.slice(0, 3).map((i) => i.rel).join('、')}`,
    },
    {
      // 票 `audit-state-regression/01`：机器名**不改**（`CONTEXT.md`「界面用词表」判定线：
      // 机器检查 `name` 是机器身份词），改的是它背后那条判据：从「数 audit 文件个数」变成
      // 「每章都有且不过期」。点名时给正文与检查记录各自的时刻，交付面能当场核。
      name: '所有章节都有审计记录',
      ok: auditWaived || (!auditScopeShort && auditProblems.length === 0),
      note: auditWaived
        ? '你已同意：不要求每章都有独立检查'
        : (auditScopeShort
          ? `只核到 ${auditCoverage.length}/${chapterCount} 章（读不到章节清单）——不能算「每章都有检查记录」`
          : (auditProblems.length === 0
            ? `${chapterCount} 章都有检查记录，且检查记录都不比正文旧`
            : `这些章的检查记录缺失或比正文旧：${auditProblems.slice(0, 3).map(chapterAuditProblemText).join('；')}`
              + '（正文在检查之后又改过 ⇒ 那份检查记录审的是旧稿，重新检查后才算数）')),
    },
    // 票 20：这一条现在**只管通用残留**（硬编码的 8 个标记）。AI 在写作规范里声明的那些本书特有标题
    // 由下面单独一条查——两者性质不同，混成一条会让「AI 声明要拆的」冒充通用规则。
    {
      name: '没有遗留的通用脚手架标记',
      ok: residue.length === 0 || scaffoldWaived,
      note: scaffoldWaived ? '你已同意：保留 AI 的笔记不删' : (residue.length === 0 ? '没有留下 AI 的草稿痕迹' : `发现这些标记没清掉：${residue.slice(0, 3).join('；')}`),
    },
    {
      name: '练习与答案齐全',
      ok: /练习|答案|习题/.test(bookText) || styleSpecDeclaresNoExercises(projectId),
      // 现场细节为空串也**必须显式写出来**：`otherDetail` 在＝这一条能被「其他」点名放行。
      otherDetail: '',
      note: /练习|答案|习题/.test(bookText)
        ? '成品里有练习和答案'
        : (styleSpecDeclaresNoExercises(projectId)
          ? '写作规范里说了这本书不设练习'
          : '成品里没有练习或答案（若本书设计为不设练习，请在写作规范里写明「不设练习」）'),
    },
    {
      name: '与已拍板的设计一致',
      ok: gatesApproved || gateWaived,
      // 票 `walkthrough-fixes/19`③：被跳过的关卡在这一条上是**第三态**（不是通过、也不是没过）。
      ...(designSkipped ? { state: 'skipped' } : {}),
      note: gateWaived
        ? '你已同意：跳过设计拍板'
        : (gatesApproved
          ? '三次设计拍板都过了'
          : (designSkipped
            // ⚠️ 措辞：`gateHuman` 出的是「第 N 次拍板 · <主题>」——界面**不叫**「第 N 关」
            // （那是与它并存的第二套编号，界面用词表明令禁掉；`test-wording-invariants.mjs` 会红）。
            ? `${missingGates.map((g) => gateHuman(g)).join('、')}被跳过（未验）：那一关的验货结论＝未知（不是通过），清单里另有逐条一行`
            : '还有设计拍板没过')),
    },
    {
      name: '源材料引用可追溯',
      ok: sourceCount > 0,
      otherDetail: '',
      note: sourceCount > 0 ? `${sourceCount} 份源材料都用上了` : '一份源材料也没用上（成品要能追回源材料）',
    },
  ]
  // 票 `walkthrough-fixes/19`③：**被跳过的每一步各占一行**（交付/终检清单里「已跳过」逐条可见）。
  // ⚠️ 这三行不是「又一道闸」：`ok:false` 是为了让下游读 `ok` 的地方**仍然看到「未验」**，
  // 而放行判定按 `state==='skipped'` 把它们排除在「没过」之外（跳过＝推迟＋记账，不是取消验货）。
  for (const skip of skippedSteps) {
    checks.push({
      name: `已跳过（未验）：${skip?.label ?? skip?.step ?? '某一关'}`,
      ok: false,
      state: 'skipped',
      note: `这一关的验货结论＝未知（不是通过）：由${skip?.by === 'user' ? '用户' : String(skip?.by ?? '用户')}在拍板卡上跳过`
        + `（${skip?.step ?? '?'}）；补验落在：${skip?.makeupAt ?? '交付前的最后检查认可那一刻'}。`,
    })
  }
  // 票 20：声明项**只在写作规范显式声明时才追加这一条**。状态四分：
  //   `declared`      有条目 → 真查；
  //   `declared-none` 明写「无/不需要/无额外标题」→ 追加一条**显形**的说明，**不是静默绿**
  //                    （静默绿会被读成「机器查过了、没查到」，而实际是「AI 说不用查」）；
  //   `undeclared` / `unreadable` → **整项不追加**（契约原则：不以硬编码词表误判）。
  if (declaredTitles.state === 'declared' || declaredTitles.state === 'declared-none') {
    checks.push({
      name: '没有遗留本书声明的脚手架标题',
      ok: declaredResidue.length === 0 || scaffoldWaived,
      note: scaffoldWaived
        ? '你已同意：保留 AI 的笔记不删'
        : (declaredTitles.state === 'declared-none'
          ? '写作规范里明写「本书无额外脚手架标题」，这一项按声明不追加（不是查过没查到）'
          : (declaredResidue.length === 0
            ? `本书声明的 ${declaredTitles.items.length} 个脚手架标题都没留在成品里`
            : `这些本书声明过的脚手架标题还留着：${declaredResidue.slice(0, 3).join('；')}`)),
    })
  }
  if (declaredTitles.state === 'declared' && declaredTitles.dropped > 0) {
    // 护栏 ③ 的可见面：越界的声明不能悄悄消失——AI 要看得见自己写宽了。
    checks.push({
      name: '脚手架标题声明未越界',
      ok: true,
      note: `声明里超过 ${DECLARED_TITLE_MAX} 条、或超过 ${DECLARED_TITLE_MAX_LEN} 字符的 ${declaredTitles.dropped} 条已忽略（只按剩下的 ${declaredTitles.items.length} 条查）`,
    })
  }
  // 风格线条条有着落：机器只验「每条 active 都有处置」，不搜关键词伪验。
  // ⚠️ 票 `demo-channel-full/10`：这一格**演示书也跑**（原先整格在 `meta?.demo !== true` 后面）。
  //    演示书那三条示例风格线由演示支的终检那一趟逐条交代去向（`applyStyleDisposals`），所以这一格
  //    在演示书上是一格**真读数**：0 条 active ⇒ 通过；把那份处置拿掉 ⇒ 它当场点名「N 条还没交代去向」。
  //    ⚠️ 两处（真书／演示）**同一份判定**，⛔ 不为 demo 另写一条。它只验「有没有处置」，不验去向写得对不对。
  {
    const activeStyles = (meta.styleNotes ?? []).filter((n) => n.status === 'active')
    checks.push({
      name: '风格线条条有着落',
      ok: activeStyles.length === 0,
      note: activeStyles.length === 0 ? '全部风格意见已处置（或没有风格意见）' : `${activeStyles.length} 条还没交代去向`,
    })
  }
  // 进度账本：AI 的工作过程留账，交接/重做有参照；progress-skip 可豁免。
  // ⚠️ 票 `demo-channel-full/04`：这一格**演示书也跑**（原先整格在 `meta?.demo !== true` 后面）。
  //    演示书那份账本由铺章那一段落盘（`demoWriteChapters` 尾巴），内容接缝是 `demoProgressLedger`；
  //    真实与演示**共用这一处判定**（同一份 `waived`／`existsSync`／读数），⛔ 不为 demo 另写一条。
  //    ⚠️ 它只验**文件在不在**，不解析正文（正文是 AI 的自由文本、没有形状契约）——这一条窄处
  //    与 `progressFreshnessNote` 的注释同源，本票**不放大**它。
  //    ⚠️ 为什么 `progressFreshness` 要分两支拼句：演示通道不上报 `progress`（账本里一条进度记录
  //    都没有），照原样拼会得到「工作记录在；账本里还没有一条进度记录」这种半句——那一支真会被走到。
  {
    const progressWaived = waived(projectId, 'progress-skip')
    const progressExists = existsSync(workFile(projectId, 'progress.md'))
    // 票 `pre-gold-build/12` · 债-12：「每个小助手回来、每交工一章时必须补一条 progress」这条义务
    // 以前**零判据**（只判文件在不在）⇒ 今天把**能算的**算出来挂在这一格的注文里（读数、不是闸门）。
    const progressFreshness = progressFreshnessNote(readEvents(projectId))
    checks.push({
      name: '进度账本齐全',
      ok: progressExists || progressWaived,
      note: progressWaived
        ? '你已同意：不检查工作记录'
        : (progressExists
          ? (progressFreshness.hasRecord
            ? `工作记录在${progressFreshness.text}`
            : '工作记录在（账本里还没有一条进度记录——这一格只认账本事件，不解析那份文件的正文）')
          : `缺工作记录（每章一行：写完/检查/验货）${progressFreshness.text}`),
    })
  }
  // 质量门并入机器（2026-08-27 用户拍板 Q3）：从 skill 文档的 grep 流程收编为机器可判定项——
  // 乱码 U+FFFD、章节数符合大纲、必含板块齐全、禁用词。判据全部从已拍板的 style-spec/outline 读，
  // 非硬编码（契约原则）；demo 确定性内容都满足，不改变 cassette 轨迹。
  if (meta?.demo !== true) {
    const spec = existsSync(workFile(projectId, 'style-spec.md')) ? readWork(projectId, 'style-spec.md') : ''
    // ① 乱码 U+FFFD（OCR 残留替换字符）。误伤逃生口：other 豁免（2026-08-27 grill 修订——
    //    契约类检查全部挂豁免，机器误判时用户不被卡死）。**须逐条点名**（票 `walkthrough-fixes/23`）。
    //    ⚠️ 票 `flow-audit-2026-10/02`：判据收进 `hasReplacementChar`，与阶段一推进前对转换稿的
    //    内容检查**同一份**——两处各写一个 `includes` 正是「同一口径」两句空话的来源。
    const garbled = hasReplacementChar(bookText)
    checks.push({
      name: '成品无乱码（U+FFFD）',
      ok: !garbled,
      otherDetail: garbled ? '成品里有乱码字符' : undefined,
      note: garbled ? '成品里有乱码字符，需要清理' : '没有乱码',
    })
    // ② 章节数符合大纲（从 outline 读，非硬编码）
    const chapterHeadings = (bookText.match(/^#{1,3}\s*第\s*\d+\s*章/gm) ?? []).length
    checks.push({
      name: '章节数符合大纲',
      ok: chapterHeadings >= chapterCount,
      note: `${chapterHeadings}/${chapterCount} 章标题齐（合并时机器拼的，这里再验一遍）`,
    })
    // ②′ 成品＝拼装件（票 `walkthrough-fixes/36`）：**逐字等于**各章正文拼出来的那一份，不等就点名第几章。
    // 病：上一格只数**章标题条数**，而最后检查阶段改章只重拼 `chapter-NN.md`——AI 手抄成品漏了几处
    // （真机 3 章 9 处），第 ② 项照旧报 ✅，它那句「合并时机器拼的，这里再验一遍」在成品被手改过之后是假话。
    // 判据本体与拼装本体是**同一个纯函数**（`book-assembly.js`），所以「拼装逻辑漂了」与「判据没跟上」
    // 在结构上不可能发生在两处不同的地方。
    // ⚠️ **只在机器合并过的书上跑**（`mergeSubmitRecorded`，与 `runPhase5` 同一枚）：没有合并交工记录的
    // `book.md` 可能是回退残留（ADR-0016 决策 3），机器还没拼过它，这一格此刻无从判——⛔ 不拿它判假绿。
    if (mergeSubmitRecorded(projectId)) {
      const bookSync = judgeBookAssembly(projectId, meta)
      checks.push({
        name: '成品与各章正文一致',
        ok: bookSync.ok,
        note: bookSync.note,
      })
    }

    // ②″ 成品里不出现「人已划掉」的知识点（票 `exclusion-flow/03`，spec 决策 4／F3）。
    //
    // 病（取证 §4-E）：成品是各章正文的**逐字拼装**，而 `judgeBookAssembly` 判的是「是不是拼装件」
    // ——它是「一致」判据，结构上不可能判「多了一条不该有的」。于是「人已划掉」这条信息在
    // 章交工那一跳（F1）之后就再也没有任何一跳读它，`final-approve` 那一刻也咬不住。
    //
    // **不放**在「成品与各章正文一致」那一枚 `mergeSubmitRecorded` 守卫里（决策 4 点名的兜底时点）：
    // 那一格只在**机器拼过**的书上有意义（回退残留的 `book.md` 无处可比），而 F3 要兜的恰恰是
    // 「章交工之后、交付之前」有人改了正文/成品的那些路（`deep-modify`／重拼／手改）——其中就有
    // **没有合并交工记录**的书。⇒ 这一格的准入只看**成品在不在**（`book.md` 不在时整族 `readFileSync`
    // 早已抛，轮不到这里）。位置仍与那一格相邻，语义上是它的第二只眼。
    //
    // 放行机制**沿用既有那一套**（本检查对象上的 `otherDetail` → 数组末尾收口时按 `check.name` 问
    // `otherWaiverFor`），⛔ 不新造放行机制、不碰 `state:'skipped'` 的口径。
    //
    // ⚠️ **只在真读得出「今天还算数」的裁决时评这一格**（`live.length > 0`）：没有那份件的老书
    // （今天所有真书）**不许多出一行**——这是 T3-5 的「与今天老书的期望一致」，也是「划卡从不改
    // 老书」的同一枚守卫（与 F1 的 `live.length === 0` 一个口径）。`items: []`（全部放回来）同理。
    // ⚠️ **那份件坏形状 ⇒ 当场一行红点名它**（与 `outline`／章交工两跳同一条口径），⛔ 不静默当成
    // 「没有裁决」：读不出就不知道哪些该被排除，这一格**不能**冒充「没命中」。
    // ⚠️ **另一处窄处（如实记、不冒充）**：`live` 是由 `readCoverageCollection` 拿**合并件**判陈旧
    // 得来的——合并件读不出时（`cards = []`）每一条裁决都落进 `stale`，而「陈旧只是软读数、不进任何
    // 闸门」是 spec §9／决策 5 的明文口径 ⇒ 这一格**不 push**。也就是说「那份件在、合并件坏了」这一态
    // 与「没有裁决」长得一样；合并件读不出的硬闸在 `outline` 交工那一跳（有源时），不在这里冒充第二道。
    // ⛔ 别把这一格说成「合并件坏了也能拦住」。
    // ⚠️ 判定强度照实说：只断「那一串 title 在不在」（`excludedTitlesInBook` 与章交工**同一把尺子**），
    // ⛔ 不证「这一段真的在讲它」；正常行文引用会被误报 ⇒ 这就是它**必须可豁免**的原因。
    // 文案里⛔ 不许写「越界都查出来了」这类超出实现强度的话。锚那一半有意不做（材料行号与成品行号
    // 没有映射，见 spec 决策 4）。
    const coverage = readCoverageCollection(projectId)
    if (coverage.problems.length > 0) {
      // 坏的是**人写的那份件本身**，不是书里的内容：它不可豁免（放行它只会让下一跳继续读不出），
      // 出路只有「改好它、或删掉它」——文案里逐字说清这两条。
      checks.push({
        name: '成品里没有已划掉的知识点',
        ok: false,
        note: `读不出 ${KNOWLEDGE_MAP_EXCLUSIONS_REL}（${coverage.problems.slice(0, 3).join('；')}）：`
          + '这份人写的裁决记录读不出，就不知道哪些知识点该被排除，这一格不能当成「没命中」——'
          + '改好它的形状、或删掉它（删掉＝这本书上没有任何裁决）再交工',
      })
    } else if (coverage.live.length > 0) {
      const excluded = excludedTitlesInBook(bookText, coverage.live.map((item) => item?.title))
      const titles = coverage.live
        .map((item) => (typeof item?.title === 'string' ? item.title.trim() : ''))
        .filter((title) => title !== '')
      const whose = titles.slice(0, 5).map((title) => `「${title}」`).join('、')
      const moreTitles = titles.length > 5 ? `……共 ${titles.length} 条` : ''
      // `otherDetail`：**能被「其他」点名放行的现场细节**（照 `runQualityChecks` 末尾那一条收口）。
      // 红的时候**总要有**现场细节，否则这一格就成了一道不可豁免的硬门（spec 决策 4：它必须可豁免）；
      // 绿的时候给空串——已经过了的检查不认豁免（收口那一遍会先 `continue`）。
      // 细节文本由 `excludedTitlesInBook` 一处产出（与它自己的 note 同源），⛔ 不在这里再拼一份。
      checks.push({
        name: '成品里没有已划掉的知识点',
        ok: excluded.ok,
        ...(excluded.ok ? {} : { otherDetail: excluded.detail === '' ? excluded.note : excluded.detail }),
        // 决策 6：有／无排除件两份输出**不再逐字相同**，且差异**点名被划掉的内容**（不是只差一个数）
        // ⇒ 即使这一格是绿的，注文也把「这一本划掉的是哪几条」写出来。
        note: excluded.ok
          ? `${excluded.note}（这一本划掉的是：${whose}${moreTitles}）`
          : excluded.note,
      })
    }
    // ── 票 `flow-audit-2026-10/03`：两条契约检查的基线由**机器**定，style-spec 只能加严 ──────────
    // 旧口径是「style-spec 没写声明行 ⇒ 整条检查不存在」——等于被检方自己决定检不检它。
    // 现在：必含板块的基线从已拍板的设计产物读（决策件 `values.boards`，否则 style-spec 的
    // 「章内板块语法」一节里的「必含板块（…）：」词条）；禁用词的基线是项目级最小词表。
    // 声明行只**追加**，⛔ 不能关闭。没有基线 ⇒ `state:'not-checked'`（不是 `ok:true`）。
    const qualityBaseline = qualityContractBaseline(projectId, spec)
    // ③ 必含板块齐全（基线 ＋ 声明行；判据面＝承诺面：按章计数，不是「全书出现过一次就判绿」）
    //    ⚠️ 枚举面窄处见 `splitIntoChapters` 与 `parseDesignBoards` 的注释。
    const requiredBoards = qualityBaseline.boards
    if (requiredBoards === null) {
      checks.push({
        name: '必含板块齐全（契约项）',
        ok: false,
        state: 'not-checked',
        note: '没有口径，未检查：style-spec 的「章内板块语法」里没有可读的必含板块，也没有「必含板块：」声明行，第 2 关结论件里也没有 values.boards——这一格不知道查什么，⛔ 不当成通过。',
      })
    } else {
      const segments = splitIntoChapters(scanText)
      const expectedBoards = chapterCount * requiredBoards.length
      let boardHits = 0
      const boardsMissing = []
      for (let index = 0; index < chapterCount; index += 1) {
        const segment = segments[index] ?? ''
        const miss = requiredBoards.filter((board) => !segment.includes(board))
        boardHits += requiredBoards.length - miss.length
        if (miss.length > 0) boardsMissing.push(`第${index + 1}章缺：${miss.join('、')}`)
      }
      checks.push({
        name: '必含板块齐全（契约项）',
        ok: boardsMissing.length === 0,
        otherDetail: boardsMissing.length === 0 ? undefined : boardsMissing.slice(0, 3).join('；'),
        note: boardsMissing.length === 0
          ? `该有的板块都在（按章计数 ${boardHits}/${expectedBoards} ＝ ${chapterCount} 章 × ${requiredBoards.length} 块）`
          : `少了这些板块（按章计数 ${boardHits}/${expectedBoards} ＝ ${chapterCount} 章 × ${requiredBoards.length} 块）：${boardsMissing.slice(0, 3).join('；')}（若设计已改，请同步更新写作规范的「必含板块」行）`,
      })
    }
    // ④ 禁用词（项目级最小基线 ＋ style-spec 声明行；没有基线才落 not-checked）
    const bannedWords = qualityBaseline.banned
    if (bannedWords.length === 0) {
      checks.push({
        name: '无禁用词（契约项）',
        ok: false,
        state: 'not-checked',
        note: '没有口径，未检查：项目级禁用词基线与 style-spec 的「禁用词：」声明行都是空的——这一格不知道查什么，⛔ 不当成通过。',
      })
    } else {
      const hits = bannedWords.filter((word) => bookText.includes(word))
      checks.push({
        name: '无禁用词（契约项）',
        ok: hits.length === 0,
        otherDetail: hits.length === 0 ? undefined : `还在：${hits.slice(0, 3).join('、')}`,
        note: hits.length === 0
          ? '没出现写作规范里禁用的词'
          : `这些不该用的词还在：${hits.slice(0, 3).join('、')}`,
      })
    }
    // ⑤ 拆脚手架那 8 类（票 `pre-gold-build/16` · 债-16）：承诺面把 8 类都写成交付前的硬门，
    //    今天逐类补判据（表与窄处见 `SCAFFOLD_CATEGORY_CHECKS` 的注释：6 类按形状硬查、
    //    2 类措辞类只提示）。⚠️ 这一条落在**真书这一支**（演示通道由机器生成、不含过程元数据）。
    //    ⚠️ 票 `demo-channel-full/04` 起演示通道的检查清单**不再是「连续的前 6 项」**：它多跑了
    //    进度账本那一格（那一格在名单里排第 2，位置却在风格线之后）⇒ 界面那句提示句里的
    //    **位置承诺已经去掉**，改成「哪几项演示通道不跑」**从这一屏真跑了的清单现算**
    //    （见 `src/ui/view-rules.js` 的 `demoQualityChecksNote`）：这里**不再有「前 6 项」这个
    //    校准数**可抄，⛔ 别在注释里再抄一个数。
    //    豁免沿用 `scaffold-keep`（与「通用残留」那一条同一句话）。
    const scaffoldCategories = scanScaffoldCategories(scanText)
    checks.push({
      name: '拆脚手架八类残留',
      ok: scaffoldCategories.hard.length === 0 || scaffoldWaived,
      warn: scaffoldCategories.hard.length === 0 && scaffoldCategories.soft.length > 0,
      otherDetail: scaffoldCategories.hard.length === 0 ? undefined : scaffoldCategories.hard.slice(0, 3).join('；'),
      note: scaffoldWaived
        ? '你已同意：保留 AI 的笔记不删'
        : (scaffoldCategories.hard.length > 0
          ? `成品里还有造书过程留下的元数据（交付清单那 8 类里的 ${scaffoldCategories.hard.length} 处）：${scaffoldCategories.hard.slice(0, 3).join('；')}`
          : (scaffoldCategories.soft.length > 0
            ? `按形状硬查的 ${SCAFFOLD_HARD_CATEGORY_COUNT} 类都没命中；另有 ${scaffoldCategories.soft.length} 处措辞类疑似只作提示（第 ②／⑥ 类靠 AI 检查报告判）：${scaffoldCategories.soft.slice(0, 3).join('；')}`
            : `交付清单那 8 类过程元数据都没命中（其中机器按形状硬查 ${SCAFFOLD_HARD_CATEGORY_COUNT} 类；第 ②／⑥ 这两类是措辞类，机器只提示、判定权归 AI 检查报告）`)),
    })
    // ⑥ 正文里的元指令残留（票 `pre-gold-build/16` · 债-20）。⚠️ 只对 human-readable 路线成立：
    //    blueprint 的正文**可以**含元指令块与章级 yaml frontmatter（`two-routes.md` 的两路线对照表）
    //    ⇒ 那一路线**整项不追加**（不是「查过没查到」）。
    if (meta?.route === 'human') {
      const metaInstructionHits = scanMetaInstructionResidue(scanText)
      checks.push({
        name: '正文无元指令残留（human-readable）',
        ok: metaInstructionHits.length === 0,
        otherDetail: metaInstructionHits.length === 0 ? undefined : metaInstructionHits.slice(0, 3).join('；'),
        note: metaInstructionHits.length === 0
          ? '人读路线的正文里没有机器看得见的元指令或 markdown 头块（机器只按三种形状查：围栏头块、独立成行的【…】指令块、「给 AI 老师」开头的句子）'
          : `人读路线的正文里还嵌着给机器看的东西：${metaInstructionHits.slice(0, 3).join('；')}`,
      })
    }
  }
  // 矛盾审查（终检新增，用户拍板 2026-08-26）：引用矛盾 + 事实矛盾。
  // 引用矛盾：章节骨架标称的 source（资料N…）必须指向真实存在的源材料；指向不存在的资料 = 引用矛盾。
  if (meta?.demo !== true) {
    const chapters = meta?.outline?.chapters ?? []
    const sourceCount = (meta?.sources ?? []).length
    const badRefs = []
    for (let index = 0; index < chapters.length; index += 1) {
      const src = String(chapters[index]?.source ?? '')
      // matchAll：一章标称多份资料（「资料2、资料3」）时逐个核对，不只查第一处。
      for (const m of String(src).matchAll(/资料\s*(\d+)/g)) {
        const n = Number(m[1])
        if (n < 1 || n > sourceCount) {
          badRefs.push(`第${index + 1}章标称「${m[1]}号资料」但只有 ${sourceCount} 份源材料`)
        }
      }
    }
    checks.push({
      name: '章节引用可追溯（无引用矛盾）',
      ok: badRefs.length === 0,
      note: badRefs.length === 0 ? '每章标称的源材料都真实存在' : `发现引用矛盾：${badRefs.slice(0, 3).join('；')}`,
    })
    // 票 `pre-gold-build/16` · 债-22：承诺面（交付清单质量门第 ⑤ 项）要的是「交叉引用指向的章／概念
    // **真实存在**」。⚠️ **上面那一条判的是另一样东西**：它核的是大纲 `source` 字段里的「资料N」
    // 有没有对应源材料，与正文里的交叉引用一个字都不沾（边界②）。机器在这一条里补上「指向的章
    // 真实存在」那一半——**全量查**（比承诺面的「随机抽查 3 章」更强，也更可复现：闸门不许有随机性）；
    // 「概念真实存在」与「见附录 X／见卡 X.Y」两类仍在机器扫面之外（窄处见 `scanChapterReferences`）。
    const chapterRefs = scanChapterReferences(scanText, chapterCount)
    checks.push({
      name: '交叉引用指向真实存在的章',
      ok: chapterRefs.dangling.length === 0,
      otherDetail: chapterRefs.dangling.length === 0 ? undefined : `空指：${chapterRefs.dangling.slice(0, 3).join('、')}`,
      note: chapterRefs.dangling.length === 0
        ? (chapterRefs.scanned === 0
          // 防空跑（`docs/测试信任边界.md` 总纲第 1 条）：扫到 0 处引用时不许说成「都指向真实存在的章」。
          ? `正文里没有「第 N 章」形式的交叉引用，这一项没内容可查（0 处引用；概念那一半归 AI 抽查）`
          : `正文里 ${chapterRefs.scanned} 处「第 N 章」引用都指向真实存在的章（大纲共 ${chapterCount} 章）`)
        : `发现 ${chapterRefs.dangling.length} 处交叉引用指向不存在的章：${chapterRefs.dangling.slice(0, 3).join('；')}`,
    })
  }
  // 事实矛盾（机器层，2026-09-30 诊断后拆成两件事——旧口径是**一条判据两头都不准**）：
  //   旧口径拿「全书所有 H1–H3 标题归一化后去重」当重复标题。实测（ADR-0008 修订 2026-09-30）：
  //     ① 每章都有的**板块名**（🚧 常见误区 / 🎬 场景引入…，书自己在 style-spec 里声明的）被判重复
  //        → 拦交付，三本真书分别 27 / 12 / 1 处，全是误伤；
  //     ② 两章**章名真写成一样**反而**放行**——机器拼的「第1章」「第2章」前缀让归一化串不相等。
  //   所以：章名唯一性单独立一条（读大纲，精确）；小节标题去重收窄成**同一章内**才拦。
  // ⚠️ 这次收窄就是「机器检查与已拍板设计互斥时谁让路」的正例（票 `walkthrough-fixes/23`，2026-10-06 裁决）：
  //   让路的永远是机器检查，唯一形式是**收窄到该检查的原意范围**（原意＝抓复制粘贴残留），
  //   收窄后**仍是真门槛**（不许退化成提示、更不许退回 `ok:true` 恒真），语义那一半不删
  //   （归 AI 自查报告与合并前跨章审计）。判据／病因／代价三件与规则正文见
  //   `docs/adr/0008-交付闸门以机器为准.md` 修订 2026-09-30 ＋ `docs/协作模型.md` §2.2。
  if (meta?.demo !== true) {
    // ① 章名全书唯一：直接读大纲的章名，不经正文——正文里的写法（`#`/`##`/带不带冒号）不该影响这一条。
    const seenChapterTitles = new Set()
    const dupChapterTitles = []
    for (const chapter of meta?.outline?.chapters ?? []) {
      const key = headingKey(chapter?.title ?? '')
      if (key === '') continue // 没有章名不是「两章同名」，归别处管
      if (seenChapterTitles.has(key)) {
        if (!dupChapterTitles.includes(key)) dupChapterTitles.push(key)
      } else seenChapterTitles.add(key)
    }
    checks.push({
      name: '章名全书唯一',
      ok: dupChapterTitles.length === 0,
      otherDetail: dupChapterTitles.length === 0 ? undefined : `重名章：${dupChapterTitles.slice(0, 3).join('、')}`,
      note: dupChapterTitles.length === 0
        ? '每一章的章名在全书中都不一样'
        : `有 ${dupChapterTitles.length} 组章名在书里重复：${dupChapterTitles.slice(0, 3).join('、')}——请在拍板定方案那一关改掉重名的章名，再重新交工做最后检查`,
    })

    // ② 无重复标题 → 收窄为**同一章内**的小节标题重复。跨章同名多半是每章都有的板块名
    //    （设计使然，AI 改不掉——那是本书自己定的板位），机器分不出「板位名」与「复制粘贴的
    //    小节名」：字符串完全一样。所以跨章同名只**提示**（`warn` 第三态，不拦交付），
    //    语义归 AI 自查报告与合并前跨章审计（「机器扫结构、AI 查语义」分工不变）。
    //    同章内同名则多半是复制粘贴的产物，是真重复，拦。
    //    归一化用 `headingKey`：剥掉 emoji/符号/标点（旧的只删 8 个标点，emoji 留在串里
    //    把「🚧 常见误区」撑成 6 个字符混过下面的长度闸——那是 27 处误伤的直接成因）。
    //    标题正则的空白也从 `\s` 收紧成 `[ \t]`：`\s` 吃换行，一行裸 `##` 会把下一行正文收成标题。
    const BOILERPLATE = /小结|练习|答案|习题|本节|本章|目标|重点|方法|导入|复习|课后|思考/
    const perChapter = new Map() // 章号 → 该章已出现的小节标题键
    const acrossChapters = new Map() // 键 → 出现在几章（同章内多次只算一章）
    const dupInChapter = [] // 同章内重名：显示用（保留书里原样的标题，好让人照着改）
    const dupInChapterKeys = new Set() // 同章内重名的键：只作集合判据，不重复显示
    let chapterNo = 0
    for (const match of bookText.matchAll(/^(#{1,3})[ \t]+(.*)$/gm)) {
      const title = match[2].trim()
      if (title.length < 4) continue
      // 机器拼的章标题行（`# 第N章 …`）开启新的一章；它自己归 ① 那条判，这里只用来分章。
      if (match[1].length === 1 && CHAPTER_HEADING_RE.test(title)) {
        chapterNo += 1
        continue
      }
      const key = headingKey(title)
      if (key.length < 6 || BOILERPLATE.test(key)) continue
      const seenHere = perChapter.get(chapterNo) ?? new Set()
      if (seenHere.has(key)) {
        dupInChapterKeys.add(key)
        if (!dupInChapter.some((shown) => shown === title)) dupInChapter.push(title)
      } else {
        seenHere.add(key)
        acrossChapters.set(key, (acrossChapters.get(key) ?? 0) + 1)
      }
      perChapter.set(chapterNo, seenHere)
    }
    // 跨章同名（不含同章内已报的那些）：只提示，不拦。
    const sharedAcross = [...acrossChapters.entries()]
      .filter(([key, chapters]) => chapters > 1 && !dupInChapterKeys.has(key))
      .map(([key]) => `「${key}」`)
    const blocked = dupInChapter.length > 0
    checks.push({
      name: '无重复标题',
      ok: !blocked,
      warn: !blocked && sharedAcross.length > 0,
      otherDetail: blocked ? `重复标题：${dupInChapter.slice(0, 3).map((t) => `「${t}」`).join('、')}` : undefined,
      note: blocked
        ? `发现重复标题 ${dupInChapter.slice(0, 3).map((t) => `「${t}」`).join('、')}——同一个标题在同一章里出现不止一次，请合并或改写重名的小节，改完重新交工做最后检查`
        : (sharedAcross.length > 0
          ? `同一章里没有重名的小节；这些标题在多章里各出现一次（多半是每章都有的板块）：${sharedAcross.slice(0, 3).join('、')}——是不是内容重复，请 AI 在自查报告里说明`
          : '每一章里都没有重名的小节标题'),
    })

    // ① 字数兜底**读数**（票 `word-budget-ineffective/02`，维护者 2026-10-27 裁决「字数为兜底字数，不设上限」）：
    //    `targetWords` 是**至少要有这么多**，不是上限。**闸门在逐章交工那一跳**（`actions/chapters.js`），
    //    这里只把「兜底/实际」摆到交付清单上给用户看——⛔ 不是第二道闸：老书/绕过交工到达这里的书
    //    只如实报数，不在这里重复拦（`ok` 恒 true，⛔ 不加 warn：超了更不提示错）。
    //    ⚠️ 口径与交工那一跳**同一份**（`domain-rules.chapterWordsFloor` 与 `countHanzi`）。
    //    ⚠️ 我的枚举面比现实窄在哪里：只读 `工作区/chapter-NN.md`（成品 book.md 不参与），只数汉字
    //    （CJK 统一汉字；数字/字母/标点/空白不计），不判「这个字数对不对得起这份材料」——
    //    那是内容质量，仍归审计与 AI 自查。
    const wordFloorRows = (meta?.outline?.chapters ?? [])
      .map((_chapter, index) => {
        const n = index + 1
        const reading = chapterWordReading(projectId, n, meta)
        if (reading.wordsFloor === null) return null
        return { n, floor: reading.wordsFloor, actual: reading.actualHanzi }
      })
      .filter((row) => row !== null)
    if (wordFloorRows.length === 0) {
      checks.push({
        name: '字数兜底读数',
        ok: true,
        note: '这本书没有设字数兜底（老账本没填 targetWords），这一项不判',
      })
    } else {
      const below = wordFloorRows.filter((row) => row.actual !== null && row.actual < row.floor)
      const unread = wordFloorRows.filter((row) => row.actual === null)
      const floorTotal = wordFloorRows.reduce((sum, row) => sum + row.floor, 0)
      const actualTotal = wordFloorRows.reduce((sum, row) => sum + (row.actual ?? 0), 0)
      const problems = [
        ...below.map((row) => `第${row.n}章兜底 ${row.floor} / 实际 ${row.actual}（差 ${row.floor - row.actual} 字）`),
        ...unread.map((row) => `第${row.n}章正文读不到`),
      ]
      checks.push({
        name: '字数兜底读数',
        ok: true,
        note: problems.length === 0
          ? `${wordFloorRows.length} 章都达到兜底：兜底 ${floorTotal} 汉字 / 实际 ${actualTotal} 汉字（超了不限，不设上限）`
          : `字数兜底读数：${problems.slice(0, 3).join('；')}——这些章在逐章交工处应已被拒；旧账本/绕过交工到达这里时只报数，不在这里重复拦`,
      })
    }
  }
  // ── 「其他」豁免的收口（ADR-0008 修订 2026-10-06，票 `walkthrough-fixes/23`）──────────────
  // 能被「其他」放行的检查在自己的对象上声明了现场细节（`otherDetail`）；这一遍**逐条**按
  // **检查项自己的名字**问 `otherWaiverFor`，放行时才把 note 换成点名那一句。
  // 三条纪律：
  //   · **没声明 `otherDetail` 的检查根本不能被「其他」放行**（fail-closed，没有第三条路）；
  //   · 已经自己过了的检查**不认豁免**——交付面不许出现「你已同意…放行」而其实什么都没放行过；
  //   · note 的名字取自 `check.name`（被放行检查自己的名字），**不可能点到别的检查上去**。
  for (const check of checks) {
    const detail = check.otherDetail
    if (detail === undefined) continue
    delete check.otherDetail
    if (check.ok === true) continue
    if (otherWaiverFor(projectId, check.name) !== true) continue
    check.ok = true
    check.note = otherWaiverNote(check.name, detail)
  }
  return checks
}


function recordAgentError(projectId, task, error) {
  // 演示模式出错是流程 bug 或环境问题（可直接重试）；真实模式的子代理失败多半是
  // LLM 未配置/欠费，标为 needs-config 并给出引导。
  updateMeta(projectId, (meta) => {
    meta.status = meta.demo === true ? 'error' : 'needs-config'
  })
  appendEvent(projectId, 'textbook/error', {
    task,
    message: String(error instanceof Error ? error.message : error),
  })
  return 'error'
}


/** 状态机主循环：每次从账本重推导，幂等，可跨重启。 */
async function runLoop(ctx, projectId) {
  for (;;) {
    const meta = readMeta(projectId)
    if (meta === null) return
    if (meta.pause !== null && meta.pause !== undefined) return
    if (meta.status === 'error' || meta.status === 'needs-config'
      || meta.status === 'awaiting-gold' || meta.status === 'awaiting-explore'
      || meta.status === 'awaiting-outline' || meta.status === 'awaiting-chapters-review'
      || meta.status === 'awaiting-final-approval'
      || meta.status === 'delivered') return
    let result
    switch (meta.phase) {
      case 1: result = await runPhase1(ctx, projectId, meta); break
      case 2: result = await runPhase2(ctx, projectId, meta); break
      case 3: result = await runPhase3(ctx, projectId, meta); break
      case 4: result = await runPhase4(ctx, projectId, meta); break
      case 5: result = await runPhase5(ctx, projectId, meta); break
      case 6: result = await runPhase6(ctx, projectId, meta); break
      default: return
    }
    if (result === 'delivered' || result === 'waiting' || result === 'error' || result === 'running') return
    // 'advanced' / 'decided' / 'approved' → 继续循环
  }
}


function kick(ctx, projectId) {
  const promise = runLoop(ctx, projectId)
    .catch((error) => {
      ctx.logger.warn(`textbook: 状态机 ${projectId} 异常: ${String(error)}`)
      if (readMeta(projectId) !== null) {
        updateMeta(projectId, (meta) => { meta.status = 'error' })
        try {
          appendEvent(projectId, 'textbook/error', { task: '状态机', message: String(error instanceof Error ? error.message : error) })
        } catch { /* 账本也可能坏了 */ }
      }
    })
    .finally(() => {
      runners.delete(projectId)
      void disposeParent(projectId)
    })
  runners.set(projectId, promise)
  return promise
}


/**
 * 注入面（票 02 两层合并）：**注入什么由 `disclose` 决定 ＋ 一页纸常驻 ＋ 状态迁移→节注入表 ＋ 指针兜底**。
 *
 * ① `disclose`（产物清单那一列，**唯一判据** · ADR-0031「给下游票的接口清单 → 票 02」）：
 *    注入件集合＝`manifestRowsFor(shape)` 里 `disclose !== 'never'` 的切片，
 *    **每份一行登记（一句话 ＋ 路径）**。`pointer` 给一行 ＋ 精确路径；`inline` 的**摘要常驻**
 *    （今天**只有 §九 那四行**——2026-10-29 票 `nine-resident-downgrade/01` 把交付形态从整节正文
 *    改成 `residentLines`；正文留在 `resources/references/audit-and-testing.md` 当单一事实源）；
 *    `never` 一个字都不给（今天＝模式卡那一族）。
 *    ⚠️ 「什么时候给」**不在 `disclose` 里**（`CONTEXT.md`「disclose」词条明写）——那是下面那张表。
 * ② `METHODOLOGY_ONEPAGE` —— 每份共用文档一行「管什么＋何时需要」（那一行**就是**登记行本身）。
 * ③ `STAGE_STATE_INJECTIONS` —— **触发取状态迁移、不取阶段**：键取 `stageStateOf()` 的 `reason`
 *    （`artifact`／`stale`／`review`／`submit`／`null`＝全齐），取值域**就是那四档**，
 *    `reason → 四档` 的映射由 `domain-rules.STAGE_STATE_BY_REASON` 单点持有（**本层不重述四档**）。
 *    另有三条**仓库事件**行（用户驳回／暂停且还有小助手在跑／进入审计动作）——它们不是状态迁移，
 *    但同样是仓库可读的事实，与本文件既有的 `deepRedo`／`userFeedback`／`occupancyLine` 同构。
 * ④ 指针兜底 —— 精确路径＋节号（沿用旧 `clipMethodology` 第三参那种形态），
 *    事件没接住时 AI 自救；节号从源文自己的 `##`／`###` 标题按层级派生（票 16 泛化），台账不会与正文漂移。
 *
 * Q3 退役记账：这里原先是 `clipMethodology`（cap 9000）＋ `METHODOLOGY_TAIL_BY_STAGE` ＋
 * `withTailSections` 一整套。**当初为什么定**（票 subagent-guidance/09）：`audit-and-testing.md`
 * 有四节整节落在 cap 之外，而「省上下文」这条约束已被 9000 证明有效；指针曾掩盖交付缺失，
 * 所以不敢只留指针。**现在为什么改**（grilling Q7'(c)）：指针的病在**触发**不在**存在**——
 * 「需要时」的判定粒度停在「哪个阶段」，同一份 9000 字头重复进 gold/chapters/final 三份 brief。
 * 事件表把触发变成接线，AI 不必自觉判断；省上下文这条约束本身不变，机制细化。
 *
 * ⚠️ 本层只负责「交出去的在不在」；主笔**读没读**注入节、时机赶没赶上动作，归真机层（票 07）。
 */
const AUDIT_DOC = 'references/audit-and-testing.md'
/**
 * 章级审计的**派发模板**（rel，不含 `resources/` 前缀）——写完整本那一跳要交给审计小助手填的那一份。
 * 票 `chapter-audit-orchestration/03`：这一跳改由编排脚本驱动之后，派发正文仍按这份模板填，
 * 所以脚本那一跳的指路与交办说明里的指路**同出一源**（同一枚常量，不手抄第二个字面量）。
 */
const AUDIT_TEMPLATE_REL = 'references/subagent-prompts/audit-agent-prompt.md'
/**
 * 编排脚本骨架（rel）——铺章那一跳的审计改由宿主 `workflow` 工具驱动，主笔照这一份填脚本。
 * 它是**给主笔读的形状出处**，不是给成员读的派发模板（成员由脚本派、拿不到方法论挂载面）。
 */
const CHAPTER_AUDIT_SCRIPT_REL = 'references/workflow-scripts/chapter-audit.md'
/** 形状契约那份（四类设计产物的字段契约与铁律 ＋ 三次拍板各自的形状节）——「产物不在 → 给形状」与「全齐 → 给下一阶段的形状」都指它。 */
const SHAPE_DOC = 'references/file-contracts.md'

/** 一页纸常驻：一行 = 一份共用方法论文档（`管什么` ＋ `何时需要`）。键 = 挂载面那份 rel。 */
export const METHODOLOGY_ONEPAGE = {
  'SKILL.md': {
    what: '全流程导航 ＋ 两条 Iron Law（设计先行／先写金标准再并行铺章）',
    when: '不确定这一步在整条链的什么位置、或要卡 Iron Law 判据时',
  },
  'references/source-material.md': {
    what: '源材料通读法 ＋ 源角色标签（哪一份当权威源）',
    when: '判断某份材料能不能当真相源、要抽结构或定知识点时',
  },
  'references/patterns/README.md': {
    // 票 `inject-face-prune/03`：字面量只留声明面一处，这一格从声明面取值。
    // ⛔ 不写可选链、不加 `??` 回退——声明面那一行是本模块的硬依赖，缺了就该当场炸。
    what: SPEC_ROW_BY_PATH['resources/references/patterns/*/*.md'].manages.what,
    when: '关卡②选教学模式、定每章板块时',
  },
  'references/file-contracts.md': {
    // 票 `injection-face-fixes/02`：「管什么」要跟着正文说真话——那份文档现在既有四类设计产物的字段契约，
    // 也有三次拍板（学习目标与难点／教学方法与板块／章节骨架）各自的形状节。
    what: '四类设计产物的字段契约与铁律 ＋ 三次拍板的形状节',
    when: '写 工作区/style-spec.md 等四件设计产物、或交工前自查格式时',
  },
  [AUDIT_DOC]: {
    what: '审校与教学测试细则（§九 只常驻两行＋内容词；正文按指针回读）',
    when: '派小助手、派审计小助手、暂停、收到驳回意见时',
  },
  'references/delivery-checklist.md': {
    what: '交付前 6 项质量门',
    when: '最后检查与交付前逐条过',
  },
  'references/subagent-prompts/writing-agent-prompt.md': {
    what: '写作小助手派发模板',
    when: '派写作小助手时按模板填',
  },
  [AUDIT_TEMPLATE_REL]: {
    what: '章级审计小助手派发模板',
    when: '派章级审计小助手时按模板填',
  },
  'references/subagent-prompts/cross-audit-prompt.md': {
    what: '跨章审计小助手派发模板（五项判定词只住那一份）',
    when: '合并前派跨章审计小助手时按模板填',
  },
  [CHAPTER_AUDIT_SCRIPT_REL]: {
    what: '编排脚本骨架：一次运行只审一章',
    when: '审计那一跳要调 workflow 时',
  },
  'references/subagent-prompts/gold-audit-prompt.md': {
    what: '金标准章审计模板（必读矩阵＋一致性核对）',
    when: '派范例章审计小助手时按模板填',
  },
  'references/invariants.md': {
    what: '不变量底线 I/H 编号（按路线选节，见上面那段）',
    when: '拿不准某条底线适用哪条路线时',
  },
  // 票 `confirm-points-redesign-build/13`（spec §5.5 E1）：**包地图**那一行。
  // ⚠️ 这一行就是「常驻面只剩『一行路径 ＋ 一句它管什么』」那一格：**整份地图不进上下文**
  // （它判 `pointer`），要按路径翻哪一层时再回读 `resources/package-map.md`。
  // ⛔ 地图的正文**不由这里手写**：`node scripts/gen-package-map.mjs --write` 照声明面现算。
  'package-map.md': {
    what: '模式资产层的包地图（哪个文件能读、什么时候该读、谁产出它）',
    when: '找某一层该读哪份、或要一份按路径的索引时',
  },
}

/** 一行标题的层级（`## ` → 2，`### ` → 3）。认不出 `#` 前缀时按 `##` 算——旧调用点的形状。 */
const headingLevelOf = (heading) => ((String(heading).match(/^#+/) ?? ['##'])[0].length)

/**
 * 票 subagent-guidance/09；票 `context-budget/16` 泛化成**按层级取节**。
 *
 * 一节 = 从它的标题行到**下一个同级或更高级标题**为止（下级标题归它所有）。
 * 于是 `## X` 的切法与旧实现（只认 `##`、切到下一个 `##`）**逐字等价**——`##` 的下一个
 * 同级或更高级标题就是下一个 `##`，既有调用点一个字不用改；而 `### X` 从此能**只切那一小节**，
 * §十 那四档子节（第一轮／第二轮／第三轮／终检分查／执行要点）就是照这个切的。
 *
 * 找不到标题就返回空串——**缺一节不该炸掉整个交办说明**，上层会断言它。
 *
 * @param {string} text 方法论全文
 * @param {string[]} headings 要切出的标题逐字前缀（如 `'## 十一、'`／`'### 执行要点'`）
 * @returns {string} 按 headings 顺序拼接的小节正文
 */
export function pickSections(text, headings) {
  const clean = String(text ?? '')
  const starts = [...clean.matchAll(/^#{2,3} .+$/gm)]
    .map((match) => ({ at: match.index, title: match[0], level: headingLevelOf(match[0]) }))
  const picked = []
  for (const heading of headings ?? []) {
    const level = headingLevelOf(heading)
    const from = starts.findIndex((s) => s.title.startsWith(heading))
    if (from < 0) continue
    const next = starts.slice(from + 1).find((s) => s.level <= level)
    picked.push(clean.slice(starts[from].at, next === undefined ? clean.length : next.at).trim())
  }
  return picked.join('\n\n')
}

/**
 * 「让 AI 接着干」那一刻要交给 AI 的**暂停交接块**（票 `subagent-guidance/12`）。
 *
 * **为什么要有它**：§十二 的规则正文本来走**事件注入表**（`STAGE_STATE_INJECTIONS` 里
 * `暂停且还有小助手在跑` 那一行），而那一行的触发条件是 `meta.pause != null`——偏偏
 * 「▶ 继续」这一动**先把 `meta.pause` 清成 `null`**（`actions/convert.js` 三条分支都清，
 * 有意行为、`test-agent-tool.mjs` 钉着）。⇒ 规则正文在**最该出现的时刻**（恢复之后）不注入；
 * 恢复后 AI 又常常**不会再领一次任务说明书**（恢复通知自己写着「领过就直接从中断处继续」），
 * 所以 brief 也补不上。⇒ 由**恢复通知本身**一次交付：那一刻的数（清掉之前手里就有）＋
 * §十二 正文（**运行时从源文取**，不在代码里手抄第二份——「别处禁止另写一份」）。
 *
 * **一次性**由「这条通知每次恢复只发一次」天然保证：不需要新状态、不碰 `meta.pause` 的冻结形状、
 * 不碰 `pausedSubagentsRunning` 的生产语义（逐条裁决见该票 `## Answer`）。
 *
 * ⚠️ **已知边界（有意不覆盖，同记在该票 `## Answer`）**：没有活主 AI 的恢复（`resume` 的另两条
 * 分支走 `handoffAndDrive`／`kick`）不发这条通知 ⇒ 那一支只剩交办说明末尾**指针兜底**里的节号，
 * AI 得自己按节号去读。
 *
 * @param {object|null|undefined} pause `meta.pause`（**清掉之前**那一份）
 * @returns {string|null} 追加给 AI 的正文；`null`＝这次不用交接（没暂停过，或那一刻数出来是 `0`）
 */
export function pauseHandoverBlock(pause) {
  if (pause === null || pause === undefined) return null
  const running = pause.subagentsRunning
  // `0`＝那一刻数出来了、确实没有在跑的 ⇒ 没有要处置的（`null` 是「数不出来」，照样要交接）。
  if (running === 0) return null
  const head = running === null || running === undefined
    ? '【暂停交接】你按下「暂停」那一刻的数**没数出来**——照下面 §12.1 查一遍 `list_agents`，再继续当前环节。'
    : `【暂停交接】你按下「暂停」时还有 **${running}** 个小助手在跑——照下面 §十二 判、按「会不会往书里写产物」分档处置完，再继续当前环节。`
  // 票 `resource-read-result/04`（D7）：读口改吃分档答案，**行为一个字不动**——读不出（或切不出
  // §十二）⇒ 只发那句头。今天它靠一句假串到达同一个结果；迁移后不再靠假串，**输出逐字相同**。
  const read = readResource(AUDIT_DOC)
  const body = read.ok ? pickSections(read.text, ['## 十二、']) : ''
  return body === '' ? head : `${head}\n\n${body}`
}

// ── 这一步的产物行（阶段 → 它该产出的那几件）───────────────────────────────────
//
// 它有两个消费者，**只有这一份**：
//   ① `stepStageState()` —— 环节状态的四项事实从这些产物行在盘上的实况取（ADR-0031 决策 4
//      「粒度挂在产物行上，环节状态是它上面的聚合」）；
//   ② `dispatchRegistryFor()` —— 派发面「该产出的登记行」按这张表与清单的 `producer` 列对出来。
// `chapters` 是 `per-chapter`：它一次写 N 章，没有单文件（形状先例＝`artifactDataForStage` 的注释）。
export const PER_CHAPTER = 'per-chapter'
/**
 * 章正文的**清单行路径**（`工作区/chapter-{n}.md`）——从 `domain-rules` 的族声明**派生**，
 * 不在这里手抄一遍（手抄的路径改名时会静默失配）。
 */
const CHAPTER_ROW_PATH = BOOK_PRODUCT_FAMILIES.find((family) => family.family === '章节正文').path
/**
 * 章正文**分片**的清单行路径（`工作区/分片/*`）——票 `walkthrough-2026-10/02` 之后**小助手产出的
 * 就是这一族**（章正文那一族改成 `machine` 产出：机器按分片拼）。同款：从族声明派生，不手抄。
 */
const CHAPTER_SHARD_ROW_PATH = BOOK_PRODUCT_FAMILIES.find((family) => family.family === '章节正文分片').path
/**
 * 章审计（`工作区/audit-{n}.md`）与跨章审计（`工作区/audit-cross.md`）的清单行路径——票
 * `injection-face-fixes/03`。两族都是 `producer: 'subagent'`、都在产物清单里（见 `domain-rules.js`
 * 的「章审计」「跨章审计」两行），所以「派出去的那几路该落哪几件」里必须有它们。
 * 同款：从族声明派生，不手抄（手抄的路径改名时会静默失配）。
 */
const CHAPTER_AUDIT_ROW_PATH = BOOK_PRODUCT_FAMILIES.find((family) => family.family === '章审计').path
const CROSS_AUDIT_ROW_PATH = BOOK_PRODUCT_FAMILIES.find((family) => family.family === '跨章审计').path
/** 材料判定的清单行路径（`工作区/材料判定.json`）——票 `injection-face-fixes/03` 的反向判据认出来的那一行。 */
const MATERIAL_JUDGMENT_ROW_PATH = BOOK_PRODUCT_FAMILIES.find((family) => family.family === '材料判定').path
export const STEP_OUTPUT_ROWS = {
  explore: ['工作区/explore.md', '工作区/knowledge-map.json'],
  // 关卡的「产物」是用户拍板的裁决，不是 AI 写出来的文件——所以这一步没有产物行，
  // 状态恒为「产物不在」，注入的正是形状契约那一节（缺件时最该给的就是形状）。
  gate: [],
  outline: ['工作区/outline.md'],
  gold: [CHAPTER_ROW_PATH],
  chapters: PER_CHAPTER,
  // 合并的产物是机器拼装的成品书 + AI 前言。
  // ⚠️ 票 `injection-face-fixes/03` 改掉了一句**假话**（原文：「跨章审计报告是 `machine` 件，不进清单」）：
  // `domain-rules.js` 的「跨章审计」族明写 `producer: 'subagent'`，清单里确实有 `工作区/audit-cross.md`
  // 那一行。它是**派出去的那一路**的产物，不是这一步的主产物——所以它不进这一张表，
  // 而进下面 `STEP_SUB_OUTPUT_ROWS.merge`（那才是「派出去的那几路该落哪几件」）。
  merge: ['工作区/book.md', '工作区/preface.md'],
  final: ['工作区/book.md'],
}

/**
 * 这一步**派出的小助手**要产出的登记行（派发面「该产出的」那一半）。
 * ⚠️ 它与 `STEP_OUTPUT_ROWS` **不是同一张表的两个意思**：那一张是「这一步整体该有的产物」
 * （环节状态的事实来源），这一张是「派出去的那几路该落哪几件」。
 *
 * ⚠️ **票 `injection-face-fixes/03` 改掉了一句假话**：这一格的注记原先声称「`merge` 那格是空的」，
 * 理由是两份审计报告都属于「检查记录」、由机器产出、清单里没有它们。
 * 那是错的：`domain-rules.js` 的「跨章审计」「章审计」两族明写 `producer: 'subagent'`，清单里**有**那两行，
 * `test-tool-discipline.mjs` 的 `dispatchRegistryProblems()` 只判反方向，于是这句假话把一条矛盾钉成了绿基线。
 * （假话的原文**不在这份源码里复述**：`test/test-sub-output-alignment.mjs` 的第 ⑤ 节按原文扫「不许回来」，
 *   复述一遍会让那条判据自己咬自己。）
 * ⇒ 现在两侧口径对齐（票面选项 **(a)**）：`audit-{n}.md` 进 gold／chapters 的产出行，`audit-cross.md`
 * 进 merge 的产出行；同一张票反方向那一格（清单里每一行 subagent 产物都要在某一步的产出行里）
 * 又把 `工作区/材料判定.json` 认出来（它由探查段开头那一趟书级材料判定小助手落，缺件当场 400），
 * 也补进 explore。判据：`test/test-sub-output-alignment.mjs`（双向：无死条目 ＋ 无漏行）。
 */
export const STEP_SUB_OUTPUT_ROWS = {
  // ⚠️ 票 `premature-announce/02` 修了两处**声明面的错**（此前它们被 `dispatchRegistryFor` 的 `pick`
  // **静默过滤**掉，一声不响）：
  //   ① `工作区/reading-{n}.md` —— 早已随票 11 并进 `工作区/细目/*`（退役注记在
  //      `domain-rules.js` 的「细目」族那一行），留在这里就是一条**死条目**；
  //   ② `工作区/knowledge-map-{n}.md` —— 扩展名写错了，分片是 `.json`（族声明
  //      `domain-rules.js` 的「知识地图分片」那一行是同一份契约）。
  // ⇒ 现在这一行与产物清单**逐字对得上**，「该产出的」里终于有那一片分片。
  // 读数与判据见 `declaredStageRowsMissingFromManifest()`（静默过滤变成可断言的读数）。
  // ⚠️ 票 `injection-face-fixes/03`：`工作区/材料判定.json` 也是**派出去的那一路**落下的
  // （探查段开头那一趟书级材料判定，派发档 `material-survey`；`producer: 'subagent'`，缺件交工当场 400），
  // 所以它也在这张表里。反向判据（清单每一行 subagent 产物都在某一步的产出行里）在
  // `test/test-sub-output-alignment.mjs`——漏一行就红，不再靠「注记写着不是漏」。
  explore: ['工作区/细目/*', '工作区/knowledge-map-{n}.json', MATERIAL_JUDGMENT_ROW_PATH],
  gate: [],
  outline: [],
  // ⚠️ 票 `walkthrough-2026-10/02`：执笔小助手产出的是**分片**（章正文由机器拼，那一族改成
  // `machine` 产出）——这两格因此指向分片族。判据（`test-tool-discipline.mjs`）按清单的
  // `producer` 列与这张表对账，指错了当场红。
  // 票 `injection-face-fixes/03`：执笔那一路落分片，**审计那一路落章审计报告**——两件都是小助手产出，
  // 清单里都声明着，所以两格都是「分片 ＋ 章审计」。
  gold: [CHAPTER_SHARD_ROW_PATH, CHAPTER_AUDIT_ROW_PATH],
  chapters: [CHAPTER_SHARD_ROW_PATH, CHAPTER_AUDIT_ROW_PATH],
  // 票 `injection-face-fixes/03`：merge 派的是跨章审计那一路（`cross-audit`），落 `工作区/audit-cross.md`。
  merge: [CROSS_AUDIT_ROW_PATH],
  final: ['工作区/报告/*'],
}

/**
 * 这一步的**输入**产物行（派发面「该读的登记行」里那些书内产物）。
 * 共用文档那一半（`scope === 'reference'` 的规范行）由挂载面直接给，不在这张表里。
 */
export const STEP_INPUT_ROWS = {
  explore: [],
  gate: [],
  outline: ['工作区/knowledge-map.json', '工作区/explore.md'],
  gold: ['工作区/outline.md'],
  chapters: ['工作区/style-spec.md', '工作区/outline.md'],
  // ⚠️ 票 `injection-face-fixes/01`：merge 唯一要主笔**亲手写**的产物是前言，而这一站原先的读清单里
  // **一份已存在的工作区件都没有**——只有一格函数键 `chapterRel`（那是给小助手的
  // `auditScope.chapters`，主笔不读章正文）⇒ 主笔只能凭记忆写前言，前言里点到正文没有的板块，
  // 读者照着找不到。`工作区/outline.md` 早就写着章名与板块名，补上它才是「有输入」。
  // ⚠️ **函数键照样留着**（`chapterRel`）：它不是「死条目」，是给小助手的那一路；
  // `dispatchRegistryFor()` 的 `dropped` 读数会把它记成 `not-a-path`（票 04），这是**如实读数**、
  // 不是待修的缺口。
  merge: [chapterRel, '工作区/outline.md'],
  final: ['工作区/book.md'],
}

/**
 * 「产物不在 → 给形状」时，`file-contracts.md` 的**哪一节**对应这一步（票面 8 行表第 1 行）。
 * 逐档带理由：`file-contracts.md` 的四节正好对应四类设计产物，「这一步的形状」与
 * 「下一阶段的形状」走同一张表（判据 `test-tool-discipline.mjs` 断它是**闭的**：每个阶段都有一格）。
 *
 * ⚠️ 票 `injection-face-fixes/02`：**`gate` 那一格是「三关一表」**。gate 一站有三关，三关要定的东西不同
 * （① 学习目标与难点／② 教学方法与板块／③ 章节骨架），而改前它只写了一格 `## 章节骨架（大纲与架构）`
 * ⇒ 跑 gate①（学习目标与难点）的 brief 里注入的是**关卡③**那一节，节内落点写着「`工作区/outline.md`
 * ＋ 关卡③ 提案」（读数：`.scratch/injection-face-fixes/evidence/readings.json` 的 `gate-1`）。
 * ⇒ 取节改成按 (`stage`, `pendingGate`) 取：`gate` 的值是**关卡号 → 节名**的表（关卡号是字符串，
 * 与 `meta.pendingGate` 的取值域一致），别的阶段仍是一格字符串。
 * ⚠️ **`pendingGate` 读不出来时**退回关卡③那一节（＝改前的形状）：宁可给周题的那一节，也不许静默给空。
 * 三关各节的名字逐字写在 `resources/references/file-contracts.md` 里（判据逐字断言那个标题在源文里能切出来）。
 */
const GATE_SHAPE_HEADING_FALLBACK = '## 章节骨架（大纲与架构）'
const SHAPE_HEADING_BY_STAGE = {
  explore: '## 源材料索引与源定位（有源场景）',   // 这一步产出的两件都是源材料索引
  // 关卡三关各自的形状：① 学习目标与难点／② 教学方法与板块／③ 章节骨架（大纲与架构）。
  gate: {
    '1': '## 学习目标与难点',
    '2': '## 教学方法与板块',
    '3': '## 章节骨架（大纲与架构）',
  },
  outline: '## 章节骨架（大纲与架构）',
  gold: '## 写作规范 · 契约与铁律',
  chapters: '## 风格与语法',                    // 铺章逐章落实的是风格线那一份
  merge: '## 写作规范 · 契约与铁律',             // 成书与前言仍受铁律约束
  final: '## 写作规范 · 契约与铁律',
}

/**
 * 某一步（或从这一步要推进到的下一步）该注入的形状节（票 `injection-face-fixes/02`）。
 *
 * 两个消费点（「产物不在」与「全齐可推进」）都走它——取节规则只有这一处，
 * ⛔ 不在两个箭头里各写一遍「gate 要读 pendingGate」那种判断。
 *
 * @param {string} stage 阶段名（`ACT_STAGES` 的成员；认不出时退回 outline 那一节）
 * @param {string|number|null} [gate] `meta.pendingGate`（只在 `stage === 'gate'` 时有意义）
 * @returns {string[]} 一个元素的标题前缀（`pickSections` 的入参形状）
 */
function shapeHeadingsFor(stage, gate = null) {
  const shape = SHAPE_HEADING_BY_STAGE[stage]
  if (typeof shape === 'string') return [shape]
  if (shape !== null && typeof shape === 'object') {
    // `gate` 那一格：按关卡号取；读不出来时退回关卡③那一节（改前的形状）。
    return [shape[String(gate)] ?? GATE_SHAPE_HEADING_FALLBACK]
  }
  return [SHAPE_HEADING_BY_STAGE.outline]
}

/**
 * 阶段的推进次序（供「全齐 → 下一阶段的形状」用；末一个没有下一站，原地不动）。
 *
 * ⚠️ **键集从 `domain-rules.js` 的 `ACT_STAGES` 派生**（票 `depth-review-2026-10/13`）：engine
 * 只消费**成员关系**（合法 `stage` 取值域），不复制第二份清单。改法＝**与声明逐位对齐的取值数组**
 * ＋ `Object.fromEntries`——这样「键集漏一个／次序错位」在两处都写不出来，而不是靠记得同步。
 */
export const NEXT_STAGE_VALUES = ['outline', 'outline', 'gold', 'chapters', 'merge', 'final', 'final']
const NEXT_STAGE = Object.fromEntries(ACT_STAGES.map((stage, i) => [stage, NEXT_STAGE_VALUES[i]]))

/**
 * 票 02 第 1 层：**注入什么由 `disclose` 决定**（ADR-0031 给票 02 的接口清单）。
 *
 * 一份共用文档在交办说明里能以什么形态出现，**只由产物清单那一列决定**，本函数是那一份的读法：
 * · `never`   → 返回 `null`，**不许挂**（一个字都不给，连指针都没有）。
 * · `pointer` → 那一行 ＋ 精确路径（正文自己回读）。
 * · `inline`  → 那一节**摘要**常驻（今天只有 §九 的 `residentLines`；正文按指针回读）。
 * 清单里查不到的行**同样判 never**：挂载面宁可少给，也不许自己另定一套规矩——
 * 「代码里另有一份名单」正是票 02 第 1 层要消灭的那个病（`CONTEXT.md`「disclose」词条的 Avoid 行）。
 *
 * @param {string} rel 挂载面用的 rel（`references/…` 或 `SKILL.md`）
 * @returns {string|null} `disclose` 三档之一；不可注入时为 `null`
 */
export function discloseOf(rel) {
  const row = SPEC_ROW_BY_PATH[rel] ?? SPEC_ROW_BY_PATH[`resources/${rel}`] ?? null
  const disclose = row?.disclose ?? null
  return DISCLOSE_MODES.includes(disclose) ? disclose : null
}

/**
 * 这一步该给 AI 的几行登记——**注入件集合＝清单里 `disclose` 命中的切片**（用户故事 13／19）。
 * 每一行 = 一句话（那一页纸行）＋ 路径（`resources/…`）＋ 它自己在清单里的那一档 `disclose`。
 *
 * @param {string[]} rels 这一步挂载面交出去的每份共用文档的 rel
 * @returns {{path: string, rel: string, role: string, disclose: string}[]}
 */
function registryRowsFor(rels) {
  const rows = []
  for (const rel of rels) {
    const disclose = discloseOf(rel)
    if (disclose === null) continue
    const row = SPEC_ROW_BY_PATH[rel] ?? SPEC_ROW_BY_PATH[`resources/${rel}`]
    rows.push({ path: `resources/${rel}`, rel, role: row.role, disclose })
  }
  return rows
}

/**
 * 派发面也走**同一张表**（票 02 实现决策 11 · ADR-0031 接口清单第四行）：
 * 给「你该读的登记行 ＋ 你该产出的登记行」，**不再靠派发措辞**。
 *
 * 病根（实测）：explore 交办原文写「要求详细摘录」，于是三份精读报告 22,106／39,321／52,770
 * 字符全文回灌，而另一本书**同一机制**三个精读全落盘——同一个机制、两本书两种表现，全凭自觉。
 * 派发面拿到的两组清单**全部来自产物清单**（共用文档那一半＝本页挂载面；书内产物那一半＝上面两张表），
 * 所以「该读什么／该产出什么」不再由主笔的措辞决定。
 *
 * ⚠️ **票 `injection-face-fixes/04`：`pick()` 丢掉的行现在记进 `dropped` 读数**（只报数、不判红）。
 * 从前它对认不出的条目**静默过滤**——函数键（`STEP_INPUT_ROWS.merge` 的 `chapterRel`）、未登记的行、
 路径拼错的声明，一律变成「这一格空着」，没有任何读数说丢了几行、丢了谁。
 * ⇒ 每一行被丢时记下 `{ half, entry, reason }`，`reason` 只取三个词：
 *   · `not-a-path`        —— 声明面里放的不是字符串路径（今天的唯一实例是 merge 的 `chapterRel`，
 *                            那是**给小助手的** `auditScope.chapters`，本来就不该进派发读清单）；
 *   · `not-in-manifest`   —— 字符串路径在产物清单里查不到（退役的／名字写错的声明）；
 *   · `producer-mismatch` —— 清单里有这一行，但 `producer` 不是这一半要的那一档（`produce` 只要 subagent）。
 * ⚠️ **我的枚举面比现实窄在哪里**（票 `dev-gate-scan/17` 的纪律）：`dropped` 只覆盖 `pick()` 这**一个**
 * 过滤口。`dispatch.read` 之外还有 `decisionPointer`／`auditScope`／`materials`／`hints` 四条通道（gate 站
 * 的三关输入全在那四条里），所以「`dispatch.read` 里没有」**不等于**「没注入」——读这个读数的人要带着
 * 这句话一起读，否则会把它当成漏注入的证据。
 *
 * @param {string} stage
 * @param {object} meta
 * @param {string[]} mountedRels 这一步挂载面交出去的共用文档（它们就是「该读的」共用那一半）
 */
function dispatchRegistryFor(stage, meta, mountedRels) {
  const live = new Map(manifestRowsFor({ hasSources: okMaterialShards(meta.sources).length > 0 })
    .filter((row) => row.disclose !== 'never')
    .map((row) => [row.path, row]))
  // 被 `pick()` 丢掉的行（票 `injection-face-fixes/04`）：只报数，不判红（见函数头「窄处」那一段）。
  const dropped = []
  const pick = (paths, producer, half) => [...new Set(paths)].flatMap((entry) => {
    if (typeof entry !== 'string') {
      // 函数键的**名字**才是可读的读数（`String(fn)` 会把整段函数体印出来）。
      dropped.push({ half, entry: typeof entry === 'function' ? `函数键 ${entry.name || '（匿名）'}` : String(entry), reason: 'not-a-path' })
      return []
    }
    const row = live.get(entry)
    if (row === undefined) {
      dropped.push({ half, entry, reason: 'not-in-manifest' })
      return []
    }
    if (producer !== null && row.producer !== producer) {
      dropped.push({ half, entry, reason: 'producer-mismatch' })
      return []
    }
    return [{ path: row.path, role: row.role, disclose: row.disclose }]
  })
  return {
    read: [...pick(STEP_INPUT_ROWS[stage] ?? [], null, 'read'), ...registryRowsFor(mountedRels)],
    produce: pick([...(STEP_OUTPUT_ROWS[stage] === PER_CHAPTER ? [CHAPTER_ROW_PATH] : STEP_OUTPUT_ROWS[stage] ?? []), ...(STEP_SUB_OUTPUT_ROWS[stage] ?? [])], 'subagent', 'produce'),
    dropped,
  }
}

/**
 * **声明面自检**（票 `premature-announce/02`）：上面两张派发表里**落不到产物清单**的条目 ＋ 扫到的条数。
 *
 * 病：`dispatchRegistryFor` 的 `pick` 对认不出的路径**静默过滤**（`.filter((row) => row !== undefined)`），
 * 于是声明面里躺着退役的、或名字写错的条目也一声不响——实测两处（见 `STEP_SUB_OUTPUT_ROWS` 的注记：
 * `工作区/reading-{n}.md` 已随票 11 退役、`工作区/knowledge-map-{n}.md` 扩展名写错）。
 * ⇒ 本函数把「静默」变成**读数**：判据断 `missing` 为空、`checked` 有下限（防空跑）。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：它只对账**声明面 ↔ 产物清单**（两张表 ↔ 由
 * `BOOK_PRODUCT_FAMILIES` 派生的清单行，`hasSources` 两种形状都试，任一对得上就算活）；
 * **不判**「清单本身是不是交工验货要的那几件」——那一层是另一件事（A/B 与交工验货 C 的粒度差，
 * 例如检查记录成对挂在那份正文上，不由这里列）。
 *
 * @returns {{missing: string[], checked: number}}
 */
export function declaredStageRowsMissingFromManifest() {
  const liveByVariant = [false, true].map((hasSources) => new Set(manifestRowsFor({ hasSources }).map((row) => row.path)))
  const missing = []
  let checked = 0
  for (const [stage, rows] of Object.entries(STEP_OUTPUT_ROWS)) {
    const list = rows === PER_CHAPTER ? [CHAPTER_ROW_PATH] : rows ?? []
    for (const path of [...new Set([...list, ...(STEP_SUB_OUTPUT_ROWS[stage] ?? [])])]) {
      checked += 1
      if (!liveByVariant.some((live) => live.has(path))) missing.push(`${stage}: ${path}`)
    }
  }
  return { missing, checked }
}

/** 「进入审计动作」：本阶段会派审计小助手或产出审计结论（**选哪一份模板是另一件事**，在 inject 里分档）。 */
const AUDIT_ACTION_STAGES = new Set(['gold', 'chapters', 'merge', 'final'])
/**
 * 票 `context-budget/16` 的裁决：**`进入审计动作` 与 `旧审计过期` 共用同一份「按阶段的审计节表」**。
 *
 * 值 ＝ `references/audit-and-testing.md` §十 里**本阶段真用得上的那几个 `###` 小节**（逐字前缀，
 * `pickSections` 按层级切到下一个同级或更高级标题）。为什么要按阶段切：整节 §十 6,391 字符里
 * `### 终检分查`（终检专用，3,261 字符）与 `### 第二轮`（合并专用，1,311 字符）对 gold／chapters
 * 是**别的阶段的活**，跟着进来就是白装一遍上下文；四档 925／1,506／1,760／3,710 字符，
 * 各领一次合计 7,901（整节 ×4 ＝ 25,564）⇒ 省 **17,663 字符/场**。
 * 取样：`node --input-type=module -e "import{pickSections}from'./src/workflow/engine.js';import fs from'node:fs';const d=fs.readFileSync('resources/references/audit-and-testing.md','utf8');for(const h of [['## 十、'],['### 终检分查'],['### 第二轮']])console.log(h[0],pickSections(d,h).length)"`
 *
 * ⚠️ **两条接线为什么必须共用这一份**（不是「更保守」而是「去重键」）：stale 只可能在
 * `gold`／`chapters`／`final` 成立（`domain-rules.pairedAuditRels` 只给这几族配对检查件），
 * 而这三档**全在 `AUDIT_ACTION_STAGES` 里** ⇒ 两条接线**必然同场**；只有取同一份清单，
 * `resolveInjections` 的 `(rel, 节集合)` 键才相等、同一节才真合成一遍（否则 §十 成对进 brief）。
 */
const AUDIT_SECTIONS_BY_STAGE = Object.freeze({
  gold: Object.freeze(['### 第一轮', '### 执行要点']),
  chapters: Object.freeze(['### 第一轮', '### 第三轮', '### 执行要点']),
  merge: Object.freeze(['### 第二轮', '### 执行要点']),
  final: Object.freeze(['### 终检分查', '### 执行要点']),
})
/**
 * 四档之外那一格**结构上不可达**（两条用户：event 行只认 `AUDIT_ACTION_STAGES`；stale 行只可能在
 * gold／chapters／final 成立）。真出现了就退回**整节 §十**——宁可多给一节，也不许静默注入空气
 * （`marks.length > 0` 那道闸会把「没节号」的行整行吃掉，读的人连「旧审计过期」都看不到）。
 */
const AUDIT_SECTIONS_FALLBACK = Object.freeze(['## 十、'])
/** 某阶段该带的 §十 小节（`AUDIT_ACTION_STAGES` 那四档；表里没有的退整节）。 */
function auditSectionsFor(stage) {
  return AUDIT_SECTIONS_BY_STAGE[stage] ?? AUDIT_SECTIONS_FALLBACK
}

/**
 * 票 02 第 1 层 + 第 2 层：**状态迁移 → 节注入表**（票面那张 8 行表，逐行落成数据）。
 *
 * ⚠️ **键取 `stageStateOf()` 的 `reason`，不取阶段名，也不另立一份事件清单**：
 * `reason` 的取值域就是既有四档判据那四个词（`artifact`／`stale`／`review`／`submit`），
 * `null` 是「全齐」（= `ready`）。`reason → 四档` 的映射由 `domain-rules.STAGE_STATE_BY_REASON`
 * 单点持有——**本表不重述四档**（重述就是「两个数字打架」的原材料）。
 * 三条 `event` 行（用户驳回／暂停且还有小助手在跑／进入审计动作）不是状态迁移，
 * 是同样可读的仓库事件，判定口径与本文件既有的 `deepRedo`／`userFeedback`／`occupancyLine` 同一形状：
 * 读得到事实才成立，读不到就不成立（宁可少给，不编）。
 *
 * 逐行理由（哪一行为什么是这一节）：
 * · `产物不在`   → 该产物的**形状契约**（`file-contracts.md` 对应节）：缺件时最该给的是形状。
 * · `旧审计过期` → §十 里**本阶段**该带的那几小节（＝ `AUDIT_SECTIONS_BY_STAGE`）＋「须重新审计」口径。
 * · `抽查意见未清零` → §十一；「交工前三查」的落点是 §11.5「pending 不得交工」＋人设第 15 条，
 *   **不另写一份**。
 * · `机器交工未过` → `delivery-checklist.md` 的分工那一节（交工那一档的质量门住在交付清单里）。
 * · `用户驳回` → §十一（重做优先唤醒原来那个小助手，不另派）＋风格线处置那段。
 * · `暂停且还有小助手在跑` → §十二（§十二 自己的触发就只有「暂停」这一个，判据是那个数）。
 * · `进入审计动作` → §十 里**本阶段**该带的那几小节 ＋ 审计派发模板（今天已有，保留；按仓库事实选一份，不两份都塞）。
 * · `全齐` → 下一阶段的**形状**（只给形状，不给方法论）。
 */
export const STAGE_STATE_INJECTIONS = [
  {
    id: '产物不在',
    why: '这一步该有的产物还不在盘上（artifact）——缺件时最该给的是它的形状契约',
    reason: 'artifact',
    // 票 `injection-face-fixes/02`：关卡按 (`pendingStage`, `pendingGate`) 取节（gate 一站三关三节）。
    inject: (meta) => [{ rel: SHAPE_DOC, headings: shapeHeadingsFor(meta.pendingStage, meta.pendingGate) }],
  },
  {
    id: '旧审计过期',
    why: '产物被改过 ⇒ 旧审计过期（stale）：审的是旧稿的那份不算数，须重新审计',
    reason: 'stale',
    // ⚠️ 与「进入审计动作」**共用同一份按阶段节表**（票 16 裁决）：两条必然同场，
    //    取同一份清单才能让 `(rel, 节集合)` 去重键相等、§十 只进一遍。
    inject: (meta) => [{ rel: AUDIT_DOC, headings: auditSectionsFor(meta.pendingStage) }],
  },
  {
    id: '抽查意见未清零',
    why: '产物与审计对得上但人工确认没到位（review）——§11.5「pending 不得交工」就是三查那一半',
    reason: 'review',
    inject: () => [{ rel: AUDIT_DOC, headings: ['## 十一、'] }],
  },
  {
    id: '机器交工未过',
    why: '没有机器记下的交工（submit）——交工那一档的质量门住在交付清单里',
    reason: 'submit',
    inject: () => [{ rel: 'references/delivery-checklist.md', headings: ['## Phase 6 的三步分工'] }],
  },
  {
    id: '用户驳回',
    why: '关卡方案被用户驳回或终检 approved=false——重做优先唤醒原来那个小助手，不另派',
    event: '用户驳回',
    inject: () => [{ rel: AUDIT_DOC, headings: ['## 十一、'] }],
  },
  {
    id: '暂停且还有小助手在跑',
    why: '用户点过暂停且 pause.subagentsRunning > 0——§十二 自己的触发就只有这一个',
    event: '暂停且还有小助手在跑',
    inject: () => [{ rel: AUDIT_DOC, headings: ['## 十二、'] }],
  },
  {
    id: '进入审计动作',
    why: '本阶段进入审计动作（派审计小助手／产出审计结论）——§十 自己写死了三轮归属',
    event: '进入审计动作',
    inject: (meta) => [
      // ⚠️ 按阶段选节（票 16）：本阶段用不上的那几小节（例如 gold 时的「第二轮」、chapters 时的
      //    「终检分查」）不许跟着进来——那是别的阶段的活，跟着进来就是白装一遍上下文。
      { rel: AUDIT_DOC, headings: auditSectionsFor(meta.pendingStage) },
      // 审计派发模板跟着「进入审计」这一条走，且**按仓库事实选一份**（票 02 落地记录的原话：
      // 「按仓库事实选一份，不两份都塞」）。⚠️ 那一刀在票 05 落进这张表之后**没有回头改**，
      // 于是 merge / final 也拿到了**章级**那份——它教的是落 `工作区/audit-<NN>.md` 严格 JSON、
      // ≤2K token，而 merge 真要派的 `cross-audit-prompt.md` 落 `工作区/audit-cross.md`、final 真要派的
      // 是 §10.b 的五份分查形状（**各自落 `工作区/报告/`**）：**同一份 brief 里并存两套互相打架的派发口径**。
      // 口径（与 `test-tool-discipline.mjs` 的 `AUDIT_DISPATCH_BY_STAGE` 同一份形状，逐档对账）：
      //   gold     → 金标准章审计那份（审「范例章兑现了设计没有」）
      //   chapters → 章级审计那份（审「这一章写对没有」）
      //   merge    → 跨章审计那份（审「这本书拼起来对不对」，落盘点是 audit-cross）
      //   final    → **不带任何章级模板**：它派的是 §10.b 那五份分查，那一节的形状由 §十 自己承载。
      //
      // 票 11（`confirm-points-redesign-build/11`）：这三根从 `full: true`（**整份抄进主 AI 的
      // `methodology`**，合计上万字符）改成 `forward`（**转发**）——模板全文只进**小助手**那份
      // **机器拼出来的**派单件（`dispatch-assembly.js` 的 `assembleDispatchPrompt()`），主 AI 这一侧
      // 只留「**档名 ＋ 值块 ＋ 一份路径**」。`forward` 的取值就是那一档的 `dispatchKind`
      // （与 `DISPATCH_SPECS` 同面：`merge→cross-audit`／`chapters→audit`／`gold→gold-audit`）。
      // ⚠️ **三根接线不许整根删**：`cross-audit-prompt.md`（merge）与 `gold-audit-prompt.md`（gold）
      // **只靠**这根接线进 `methodologyDocs`（gold 段只 `mtl(...file-contracts.md)`＋
      // `mtl(...audit-and-testing.md)`；merge 段只 `mtl(...audit-and-testing.md)`；chapters 段另有
      // `mtl(AUDIT_TEMPLATE_REL)` 一处登记）——删行会让「挂载面 ↔ 一页纸登记表**双向**闭包」以
      // `neverMounted=…` 红。正确形状是**留 rel 登记、只让它不再吐正文**（`resolveInjections()`
      // 的 `forward` 分支：`rels.push` 照旧、`bodies.push` 不再）。
      { rel: 'references/subagent-prompts/cross-audit-prompt.md', forward: 'cross-audit', when: (meta) => meta.pendingStage === 'merge' },
      { rel: AUDIT_TEMPLATE_REL, forward: 'audit', when: (meta) => meta.pendingStage === 'chapters' },
      { rel: 'references/subagent-prompts/gold-audit-prompt.md', forward: 'gold-audit', when: (meta) => meta.pendingStage === 'gold' },
    ],
  },
  {
    id: '全齐可推进',
    why: '产物／审计／人工确认都到位（reason 为 null，即全齐）——只给下一阶段的形状，不给方法论',
    reason: null,
    inject: (meta) => {
      const next = NEXT_STAGE[meta.pendingStage] ?? meta.pendingStage
      // 下一站是**另一个站**：它的关卡号还没定下，所以传 null（gate 那一格退回关卡③那一节；
      // 今天 `NEXT_STAGE` 里没有一站指向 gate，这一支是形状兜底，不是活路径）。
      return [{ rel: SHAPE_DOC, headings: shapeHeadingsFor(next, null) }]
    },
  },
]

/** 本轮有没有用户意见/风格线变化在案（抽查意见／用户留言／金标准意见——都读 meta，不读措辞）。 */
function userFeedbackInFlight(meta) {
  const count = (list, keep) => (Array.isArray(list) ? list.filter(keep).length : 0)
  // 票 `stage-state-facts/05`：**只拦 pending**（与章级那条路、三处文档、CONTEXT.md 的「人工确认
  // 没到位」同一个口径）。`applied`／`revoked` 都不拦——一条已处置的意见不该让一本书永远显示未确认。
  return count(meta.pendingReviews, (r) => r.status === 'pending')
    + count(meta.pendingInterventions, (i) => i.status === 'pending')
    + count(meta.goldOpinions, (o) => o.status === 'pending' || o.status === 'sent')
}

/** 本轮是不是「用户驳回触发的重做」（关卡方案被驳回，或终检给了改进意见）。 */
function gateRejectedInFlight(meta, facts) {
  if (facts?.gateRejected === true) return true
  return typeof meta.finalRedoNote === 'string' && meta.finalRedoNote.trim() !== ''
}

/** 会派小助手的阶段——派发面那一半（两组登记行）只对这几个阶段有意义。 */
const SUBAGENT_DISPATCH_STAGES = new Set(['explore', 'gold', 'chapters', 'merge', 'final'])

/**
 * 本轮触发了哪几行（`{state, reason}` ＋ meta ＋ 已知事实 → 触发行 id 集合）。
 * 状态行按 `reason` 精确匹配（**不按阶段名匹配**），事件行读仓库可读的事实。
 *
 * @param {Array} [rows] 要判的表（默认＝生产那张 `STAGE_STATE_INJECTIONS`）。
 *   留这个口子是给**判据**用的：坏表也要走同一段代码（`resolveInjections` 那一段注释有理由）。
 */
function firedInjectionIds(state, meta, facts, rows = STAGE_STATE_INJECTIONS) {
  const events = {
    用户驳回: gateRejectedInFlight(meta, facts),
    暂停且还有小助手在跑: meta.pause != null && (meta.pause.subagentsRunning ?? 0) > 0,
    进入审计动作: AUDIT_ACTION_STAGES.has(meta.pendingStage),
  }
  const fired = new Set()
  for (const row of rows) {
    if (row.event !== undefined) {
      if (events[row.event] === true) fired.add(row.id)
      continue
    }
    if (state.reason === row.reason) fired.add(row.id)
  }
  return fired
}

/**
 * 单个产物行的四项事实 → 四档状态（走的是 `stageStateOf` 那**一个**函数，本层不判档）。
 *
 * ⚠️ 事实取法已搬进 `engine/stage-facts.js` 的 `rowFacts`（票 `stage-state-facts/02`）：
 * 本函数只留**判档入口**这一处（`stageStateOf` 仍是票 04 单出处判据数的四行之一），
 * 三档判法与「配对检查件来自 `pairedAuditRels`」那条源码钉都跟着事实一起搬走。
 *
 * ⚠️ **「交工」那一项由调用方喂进来，本层不许自己算第二份**：`stepStageState` 那一层已经在算
 * `stepSubmitRecorded`，在这里重算就是本程要消灭的「两个数字打架」。它曾被**写死**成 `false`，
 * 而 `stageStateOf` 在 `submitRecorded !== true` 时**必返 reason** ⇒ 调用方的循环**必在首轮 return**
 * ⇒ 末尾那行聚合**不可达** ⇒ 非 `PER_CHAPTER` 工序（explore／outline／gold／merge／final）的
 * **`ready` 档结构性不可达**（ADR-0031 决策 4 补记 · 票 `15`）。
 *
 * @param {string} stage 分段机器键（配对检查件那张表按它分档）
 * @param {string} productRel 产物行的书夹相对形状（规范形状）
 * @param {boolean} reviewPending 本轮有没有未处置的意见
 * @param {boolean} submitRecorded 账本里有没有这一步的机器交工证据（**调用方算好的那一枚**）
 */
function stepRowState(projectId, stage, productRel, reviewPending, submitRecorded) {
  return stageStateOf({ ...rowFacts({ projectId, reviewPending, submitRecorded }, stage, productRel) })
}

/**
 * 账本里有没有「这一步交工通过」的机器证据（只认已存在的写入点，不按文件存在兜底——同 `chapterHasSubmitEvent` 的纪律）。
 *
 * ⚠️ **机器身份取 label 里的身份词，不取 `data.stage`**（票 `premature-announce/03`）：
 * `agent-end` 的写入点（本文件 8 处 ＋ `actions/chapters.js` 7 处）**一处都不写 `stage`**——
 * `stage` 只写在 `stage-start` 上（见 `handoff()`）。按 `data.stage` 认是**结构性不命中**：
 * explore／outline／gold／merge／final 五步的环节状态**永远** `unconfirmed/submit`，`ready` 到不了
 * （链上却一直是绿的，因为夹具手写了那个字段——`test-step-submit-evidence.mjs` 现在盯着这一类假绿）。
 *
 * ⚠️ 判据本体在 `engine/submission.js` 的**步档**：身份词从 `STAGE_LABELS[stage]` **现取**（与
 * `stage-start` 的 label 同源），匹配取 `includes`（两处生产 label **不是**以身份词开头：
 * `整理章节骨架`／`最佳范例章`），查 `outcome === 'ok'`。今天这五步的生产 label 逐字：
 *   `explore`→`源探查`｜`outline`→`整理章节骨架`｜`gold`→`最佳范例章`｜
 *   `merge`→`合并成书（机器拼装 + AI 前言）`（真实）／`合并成书`（演示）｜
 *   `final`→`最后检查（AI 自查 + 机器兜底）`（真实）／`最后检查（质量门）`（演示）。
 * 这里只摆事实（`meta.pendingStage`／逐章那一支交给 `chapterHasSubmitEvent`），⛔ 不再自己匹配 label。
 * ⚠️ 它**只认 label 这一个面**：`stage-start` 那一笔不是证据（交办不等于交工）；`gate` 也不走这条
 * 路（它的 label 逐关不同、而它的环节状态结构上恒为 `missing`，见 `STEP_OUTPUT_ROWS.gate`）。
 * 身份词与生产 label 的对账（哪一档的生产写入点真的带这个身份词）由 `test-step-submit-evidence.mjs`
 * 的元检查守着——改 label 而没改身份词，那一条会当场点名。
 */
function stepSubmitRecorded(projectId, meta) {
  const stage = meta.pendingStage ?? null
  if (stage === null) return false
  if (stage === 'chapters') {
    const chapters = meta.outline?.chapters ?? []
    return chapters.length > 0 && chapters.every((_chapter, index) => chapterHasSubmitEvent(projectId, index + 1, meta))
  }
  return submitted(submissionIndex(readEvents(projectId)), { stage })
}

/**
 * 账本里有没有「**合并**这一步交工通过」的机器证据（票 `walkthrough-2026-10/10` 裁决 A）。
 *
 * **以当前账本为准**：回退（快照）会把 `timeline.jsonl` 换回快照那一刻（ADR-0016 决策 3），
 * 而**回退不删产物文件** ⇒「盘上有 `book.md`」不等于「机器合并过」。跳步闸门（`runPhase5`）
 * 读的就是这一枚：没有它就不许跳过合并。
 *
 * ⚠️ **判据取 label 前缀，不取 `data.stage`**：`agent-end` **不带 `stage`**（只有 `stage-start`
 * 带，见 `handoff()`），按 `data.stage` 认是**结构性不命中**。前缀取自 `stageLabel('merge')`
 * 这一份现成的机器身份词，**不另写一个 label 字面量**——写入点（`actions/chapters.js` 的
 * `stage-submit merge`）那条 label 正是以「合并成书」开头。判据本体在 `engine/submission.js` 的
 * **合并档**（`startsWith` ＋ `outcome`），这里只问那一句。
 */
function mergeSubmitRecorded(projectId) {
  return submitted(submissionIndex(readEvents(projectId)), { stage: 'merge' })
}

/**
 * 最后检查阶段改完章之后：**机器重拼成品**（票 `walkthrough-fixes/36` 修法 1）。
 *
 * 病：`工作区/book.md` 原来只有合并那一跳一个写点，而最后检查阶段改章走的是
 * 「分片 → `chapter-assemble`」——只重拼 `工作区/chapter-NN.md`，成品靠 AI 手抄（真机漂了 3 章 9 处）。
 *
 * 纪律与 `chapter-assembly.js` 头部那一段**同一条**：同输入同输出，盘上那份与拼装件逐字相同就
 * 一个字节都不写（mtime 不动）。
 *
 * ⚠️ **只对机器合并过的书重拼**（与 `runPhase5`「机器已合并」同一枚判据）：没有合并交工记录的
 * `book.md` 可能是回退残留（ADR-0016 决策 3：回退不删产物文件），那时机器还没拼过它——在这里重拼
 * 等于**绕过合并闸门**（全章过目 ＋ 跨章审计），而那是另一票的事。
 *
 * @param {string} projectId
 * @returns {{status: 'ok'|'absent'|'not-merged', wrote: boolean, chapters: number[], header: boolean}}
 */
export function refreshBookAfterChapterAssemble(projectId) {
  if (!mergeSubmitRecorded(projectId)) return { status: 'not-merged', wrote: false, chapters: [], header: false }
  return refreshBook(projectId, readMeta(projectId) ?? {})
}

/**
 * 这一步的**环节状态**——`stageStateOf` 的**调用方**，不是第二份判据（ADR-0031 决策 4 第一条纪律）。
 *
 * 四项事实从 `STEP_OUTPUT_ROWS` 指的产物行在盘上的实况取；章一级逐章那一档**直接复用既有的
 * `chapterStageState`**（它自己已经调 `stageStateOf`），本函数不重写任何一条判据。
 *
 * **聚合口径**：一步有多个产物行时，取**顺序里第一个没齐的**那一行的状态；全齐才报 `ready`
 * （「第一个没齐的」是阅读顺序，不是另立一份严重度排序——那样就成了第二份判据）。
 *
 * @param {string} projectId
 * @param {object} [meta]
 * @returns {{state: string, reason: string|null}}
 */
export function stepStageState(projectId, meta = null) {
  const current = meta ?? readMeta(projectId) ?? {}
  const reviewPending = userFeedbackInFlight(current) > 0
  const outputs = STEP_OUTPUT_ROWS[current.pendingStage] ?? []
  const submitRecorded = stepSubmitRecorded(projectId, current)
  if (outputs === PER_CHAPTER) {
    const chapters = current.outline?.chapters ?? []
    for (let index = 0; index < chapters.length; index += 1) {
      const state = chapterStageState(projectId, index + 1, current)
      if (state.reason !== null) return state
    }
    return stageStateOf({ ...stepFacts({ artifactPresent: chapters.length > 0, reviewPending, submitRecorded }) })
  }
  for (const rel of outputs) {
    const state = stepRowState(projectId, current.pendingStage, rel === CHAPTER_ROW_PATH ? chapterRel(goldN(current)) : rel, reviewPending, submitRecorded)
    if (state.reason !== null) return state
  }
  return stageStateOf({ ...stepFacts({ artifactPresent: outputs.length > 0, reviewPending, submitRecorded }) })
}


/** 三层挂载的块首（与判据里那几个哨兵同形——判据按**内容**定位，不按行号）。 */
const ONEPAGER_HEAD = '↓ 方法论一页纸（本 brief 挂的每份共用文档：管什么 ＋ 何时需要）'
const RESIDENT_HEAD = '↓ 常驻块（两行 ＋ 内容词，不按事件增减）'
const EVENT_HEAD = '↓ 状态迁移注入节（本轮命中的状态迁移 → 对应小节）'
const POINTER_HEAD = '↓ 指针兜底（上面没给的，按精确路径＋节号自己回读）'
/**
 * 方法论**根目录**那一行——本机绝对路径，运行时从 `content-lib.RESOURCES_DIR` 算，**不写死**
 * （写死＝`.scratch/dsh-contract-drift/issues/03` 那个病：代码里出现某台机器的路径）。
 *
 * 为什么必须有（票 `.scratch/methodology-root-pointer/01`）：下面每一条指针都是 `resources/…`
 * 形态的**包内相对路径**，而宿主把相对路径按**会话 cwd** 解析（`dsh-tool-fs` 的 `sessionResolveOptions`）。
 * 开发机上会话工作区恰好就是仓根、仓根又躺着几本书，所以 `resources/…` 凑巧命中、看不出病；
 * 换台机器（工作区 ≠ 插件包）就一条都读不到，只剩搜盘一条路。
 *
 * ⚠️ 它是**指针面**的一部分，不是新增的正文面——ADR-0030 决策 3（一页纸 ＋ 状态迁移→节 ＋ 指针兜底）
 * 那条取舍一个字没动：本票只补「发给 AI 的路径缺一个解析基准」。
 */
const RESOURCE_ROOT_LINE = `   - 方法论根目录（本机绝对路径，下面每条 resources/… 都相对它）：${RESOURCES_DIR}`

/** 一页纸的一行：路径＋管什么＋何时需要。没登记的文档明说「未登记」（由判据盯住不许出现）。 */
function onepagerLine(rel) {
  const entry = METHODOLOGY_ONEPAGE[rel]
  if (entry === undefined) return `- resources/${rel}：共用方法论文档（本仓未登记它管什么——补登记，或别挂它）`
  return `- resources/${rel}：${entry.what}｜何时需要：${entry.when}`
}

/**
 * 指针兜底里的节号台账：**从源文自己的 `##`／`###` 标题按层级派生**，标题改名时台账跟着走（不会漂）。
 *
 * ⚠️ 票 02 第 1 层起它对**每一份**挂载文档派生（原先只有 `audit-and-testing.md` 有）——
 * 因为「状态迁移→节」那张表现在也指向 `file-contracts.md` 与 `delivery-checklist.md`，
 * 它们的节号如果不在指针上，那几节就成了死路。**读不出标题就只给路径**（不给空气节号）。
 *
 * ⚠️ 票 `context-budget/16` 泛化到 `###`：接线开始按阶段点 `§第一轮`／`§第二轮` 这类**子节**，
 * 而 `test-tool-discipline.mjs` 那条闭包判的是「接线能注入的每个节号 vs 指针里带的节号」——
 * 不泛化的话那几档子节在指针上找不到（这正是票面点名的连带处）。
 * 代价实测：`audit-and-testing.md` 13 个／70 字符 → 44 个／576 字符（Δ +506）；`invariants.md` +159、
 * `source-material.md` +42、`delivery-checklist.md` +9、`file-contracts.md` 0。
 * 取样（打的是条数 13 / 44）：`node --input-type=module -e "import fs from 'node:fs';const t=fs.readFileSync('resources/references/audit-and-testing.md','utf8');const n=(re)=>[...t.matchAll(re)].length;console.log(n(/^## /gm),n(/^#{2,3} /gm))"`
 * ⛔ 台账**从源文派生，不从接线表派生**——自己判自己恒绿（`test-tool-discipline.mjs` 明禁）。
 */
function pointerMarks(rel) {
  // 票 `resource-read-result/02`：直接吃分档答案（旧那层「安全形」包装与它的死 `try/catch`
  // 已由票 02 拆掉——那个 `catch` 一次也进不去，因为它包住的读口不会抛）。
  // 缺 ⇒ 回 `[]`，与迁移前**逐字一致**：读不出标题就只给路径，不给空气节号。
  const result = readResource(rel)
  if (!result.ok) return []
  const text = result.text
  return [...text.matchAll(/^#{2,3} (.+)$/gm)]
    .map((match) => `§${match[1].split(/[、（]/)[0]}`)
}

/**
 * 票 12（`confirm-points-redesign-build/12`）：**注入节按体积划线**的那条线。
 *
 * 口径（spec §5.2 第 2 条 ＋ 规划票 17 `## Answer` §1 B 表第 2 行，逐字）：
 * 「`STAGE_STATE_INJECTIONS` 里 **> ~1,000c** 的注入节 ⇒ 「**3 行口径 ＋ 指针**」（同节号**已在**指针兜底里）；
 * 以下的留正文。」
 *
 * ⚠️ 那个 `~` 是原文自己的措辞，权威源**没有**给可执行阈值 ⇒ 本实现**当场把一个数冻在这里**：
 * **1000**（`>=` 即过线）。取它的理由（2026-10-16 现跑读数，见票面 `## Answer`）：今天过线那一族最小的
 * 是 §十·gold **1,033c**，没过线那一族最大的是 `file-contracts.md`「章节骨架」**947c** ⇒ 947–1033 之间
 * **没有任何一节**，取 1000 与取「~1,000」附近任何整数结果完全相同，而 1000 正好是人读得懂的那个整千。
 * ⛔ **不抄业界的「200 行」**（spec §5.2 末：那是外部量纲；压的是体积、不是信息量）。
 *
 * ⚠️ **判的是体积，不是行名**：阈值看的是 `pickSections(...)` 切出来那一段的字符数——文档长胖了自动
 * 过线、瘦了自动回正文。⛔ 不写「哪几节过线」的黑名单（那会随文档漂而静默失效）。
 * 判据侧正相反：期望值是**手写**的那份清单（⛔ 不从本常量反解）。
 * **我的枚举面比现实窄在哪里**：只量 `pickSections` 切出来那一段，不量它在 brief 里的最终增量
 * （那 3 行口径本身也有体积）。
 */
const INJECTION_POINTER_MIN_CHARS = 1000

/**
 * 过线那一节的「**3 行口径**」（票 12 · R1）。
 *
 * 具体是哪 3 行**权威源没写死**（spec §5.2 只写「3 行口径 ＋ 指针」）——属实现面，已逐字写进票面
 * `## Answer`：
 *   ① 这一节**没内联**、以及为什么（体积过线）；
 *   ② **有界读法**（读哪一节／多少行）——票面 Acceptance 第 2 条要的那句（spec §5.6 F）；
 *   ③ 读回来之后干什么（落产物／照它动手；触发由仓库判定）。
 *
 * ⚠️ **不复用也不新造第二份甲乙型读法模板**：盘上立着那份逐字读法（`decision-record.js` 的
 * `decisionPointerLines()`：甲型「读它的 `## 完整方案` 一节」／乙型「读它的**整个文件**」）是
 * **方案文档**那一族的；`§节号` 这一族的读法是「**只读上面点名的那几节**」，两者不同面。
 * 这里给的是本节号族那一句（⛔ 不是把甲乙型抄第二份）。
 *
 * ⚠️ 第 ② 行里的路径写成 `resources/<rel>`（**可解析形**，基准＝`RESOURCE_ROOT_LINE`），与上面标记行
 * 的裸 `<rel>` **不是同一个写法**——这是有意的：标记行那串文本是「同一串接线标记只印一遍」那格的
 * 计数靶，这里换写法才不会把那个计数顶成 2。
 *
 * @param {string} rel 包内相对路径
 * @param {string[]} secNames 已带 `§` 的节号（与标记行同一份派生）
 * @param {number} chars 那一段的字符数（现量）
 */
function injectionPointerLines(rel, secNames, chars) {
  return [
    `     ↳ 口径① 这一节**不在本 brief 里**：它 ${chars} 字符、过了 ${INJECTION_POINTER_MIN_CHARS} 字符线，正文与它的事实都在盘上，不在这儿重复一遍。`,
    `     ↳ 口径② 有界读法：只读 \`resources/${rel}\` 里上面点名的那几节（${secNames.join('、')}），读到那一节的末了即止；⛔ 别顺手把整份读进来（「只给路径」会变成「读一次爆一次」）。`,
    `     ↳ 口径③ 读回来的结论照旧落进产物、或照它动手；触发是仓库状态判定的，不是你自觉判断。`,
  ]
}

/**
 * 事件块里「节号对不上」那一行（票 `resource-read-result/06` · `R-06`＝B）。
 *
 * 两条来路分开：`ok:false`（真读不出）⇒ 缺件告知（`missingNote`）；`ok:true` 但
 * `pickSections` 切不出 ⇒ 文件仍在、只是节号改了名，所以**照旧登记**、指针面保留，
 * 只在事件块说清「节号对不上」。⛔ 这一句不许说「缺件／读不出」（那会把两档又压回一档）。
 */
function sectionMismatchLine(rel) {
  return `   · 节号对不上：resources/${rel}（接线要的节在源文里找不到）——这一份仍在指针兜底里，可按路径回读`
}

/**
 * 把「这一轮触发了哪几行」解析成实际要拼进**一份** brief 的注入件（票 `context-budget/16` 抽出来）。
 *
 * **去重键 ＝ `(rel, 节集合)`**：同一份文档的**同一节**在一份 brief 里只拼一次——`旧审计过期` 与
 * `进入审计动作` 共用同一份按阶段节表（见 `AUDIT_SECTIONS_BY_STAGE`），两条必然同场，键相等 ⇒ 正文合一；
 * 同一份文档的**不同节**（两行各要 §十 与 §十一）仍各进各的。
 * （同一份 rel 的「取节」与「全文」是两把键——今天没有哪条接线对同一份文档既取节又给全文；
 * 真长出来时，「同一节不许进两遍」那条判据会红，因为全文里带着那些 `###` 标题。）
 *
 * ⚠️ **不是「全 brief 级已拼节集合」的按节跳过**：那种写法下，一行只要了「已经拼过的那一节」时
 * 会**整条接线静默消失**（票面 ② 那种重复换个形状又长回来，判据还看不出来）。
 * 判据喂真表与坏表走的就是这一段（`test-tool-discipline.mjs` 的反证 A／B）。
 *
 * ⚠️ **标记文本也去重**（票面 item 1 的后半）：键相等的接线，正文只拼一遍，
 * 事件块那几行 `· 状态迁移「X」… → <rel> <节号>` 的标记也只在**第一次**印出来
 * （否则读的人仍以为有两套规则）。⛔ **但行不许删**：`marks` 为空的行会被调用方整行吃掉
 * （`marks.length > 0` 那道闸）——所以一行被跨行去重到一条不剩时，把它自己**第一条**标记补印回去
 * （「旧审计过期（须重新审计）」那一行本身是那句口径的唯一载体，删不得）。
 *
 * **三种接线形状**（票 11 加了第三种，票 12 给第一种加了体积线）：
 * ① `{ rel, headings }` —— 取那几节正文（默认形状）。⚠️ **票 12 起按体积二次分流**：那几节合起来的
 *    字符数 `>= INJECTION_POINTER_MIN_CHARS` 时**不再 push 正文**，改印「3 行口径 ＋ 指针」
 *    （`injectionPointerLines()`）；以下的照旧进正文。`rel`／`headings` 两种情形都照旧登记进
 *    `rels`（挂载面闭包与指针兜底的 `§节号` 都不许因此少一格）。
 * ② `{ rel, full: true }` —— 整份正文（**今天零处**：原来的三处已改转发，见下）；
 * ③ `{ rel, forward: '<dispatchKind>' }` —— **转发**：`rel` 照旧登记进 `rels`（挂载面闭包不变），
 *    但**不拼正文**，只印一条「档名 ＋ 路径 ＋ 全文去哪了」的标记。今天恰好三处，都在
 *    `STAGE_STATE_INJECTIONS['进入审计动作']`（chapters／merge／gold 三档的派发模板）。
 *
 * @param {Array} rows 状态迁移表（生产传 `STAGE_STATE_INJECTIONS`；判据传坏表）
 * @param {object} meta 书 meta（含 `pendingStage`）
 * @param {object} facts 调用方算好的仓库事实（`gateRejected` 等）
 * @param {object} state `stepStageState` 那一份（键取 `reason`）
 * @returns {{
 *   rels: string[],
 *   notes: string[],
 *   bodies: string[],
 *   missing: {rel: string, reason: string}[],
 *   sectionMismatch: string[],
 * }}
 *
 * ⚠️ 票 `resource-read-result/02`＋`06`（`R-06`＝B）：**只有「真读不出」（`ok:false`）才不进 `rels`**。
 * 理由不是新口径——是让两条既有闭包继续成立：「一份一行登记，少一行就有一份没人知道它管什么」、
 * 「一页纸的行数必须等于这份 brief 实际挂了的文档数」。登记一份**没给正文**的文档，这两条就从判据
 * 退化成两句一起撒谎的话。读不出的从 `missing` 出去，由调用方拼一行显式告知。
 * ⚠️ **「文件在、节号被改名」是另一档**：那一份仍然「挂了」（指针兜底里要能按路径回读），只是
 * 给不出接线要的那一节 ⇒ **照旧登记**、不印状态迁移标记，从 `sectionMismatch` 出去让事件块说一句
 * 「节号对不上」。⛔ 别把它塞进 `missing`（那会把两档又压回一档）。
 */
export function resolveInjections(rows, meta, facts, state) {
  const fired = firedInjectionIds(state, meta, facts, rows)
  const rels = []
  const notes = []
  const bodies = []
  const seen = new Set() // `${rel}\u0000${节集合}`（或 `\u0000*full*`）——本 brief 已拼过哪几件正文
  const printedMarks = new Set() // 已印过的标记文本（**跨行**：同一节不许在两行里各印一遍）
  // 票 `resource-read-result/02`＋`06`：**没给正文的**分两档，⛔ 不许再压回一档——
  //   ① 读口读不出（`ok:false`）⇒ `missing`：不进 `rels`、不进 `bodies`、不印标记，
  //      由调用方拼成一行「缺件告知」。
  //   ② 文件在、节号切不出（`ok:true` 且 `pickSections` 回空）⇒ `sectionMismatch`：**照旧登记**
  //      （`rels` 里留着，指针兜底才能按路径回读），只是不给那一节的正文、不印状态迁移标记，
  //      由调用方在事件块拼一句「节号对不上」。`missing` 的语义是「读不出」，⛔ 别混进来。
  // ⚠️ 同一个 `rel` 每档只记一次（本 brief 里它读不出就是读不出，重复十几条只是噪音）。
  const missing = []
  const sectionMismatch = []
  const noteMissing = (rel, reason) => {
    if (!missing.some((item) => item.rel === rel)) missing.push({ rel, reason })
  }
  const noteSectionMismatch = (rel) => {
    if (!sectionMismatch.includes(rel)) sectionMismatch.push(rel)
  }
  const ensureRel = (rel) => {
    if (!rels.includes(rel)) rels.push(rel)
  }
  for (const row of rows) {
    if (!fired.has(row.id)) continue
    const marks = []
    const extras = [] // 票 12：过线那一节的 3 行口径（**跟着印出来的那条标记走**，被跨行去重掉就一起不印）
    const suppressed = [] // 被跨行去重掉的标记——只在「本行一条都不剩」时补印，用来保住整行
    for (const wiring of row.inject(meta, facts)) {
      if (typeof wiring.when === 'function' && wiring.when(meta, facts) !== true) continue
      if (discloseOf(wiring.rel) === null) continue
      let mark = null
      let overPointer = null // 票 12：过线那一节的 3 行口径（跟着**印出来的那条标记**走）
      if (wiring.full === true) {
        const whole = readResource(wiring.rel)
        // 票 `resource-read-result/02` D3：**缺 ⇒ 不进正文、也不登记进挂载面**（不假装挂了）。
        // 登记一份没给正文的文档，会让「一份一行登记」「一页纸行数＝实际挂了的分份数」那两条既有
        // 闭包从判据退化成两句一起撒谎的话。
        if (!whole.ok) { noteMissing(wiring.rel, whole.reason); continue }
        mark = `${wiring.rel} 全文`
        const key = `${wiring.rel}\u0000*full*`
        if (!seen.has(key)) { seen.add(key); bodies.push(whole.text.trim()) }
        ensureRel(wiring.rel)
      } else if (typeof wiring.forward === 'string' && wiring.forward !== '') {
        // 票 11：**转发**档——整份模板**不进本 brief**（它由机器 `assembleDispatchPrompt()`
        // 拼进小助手那份派单件），主 AI 这一侧只留「档名（dispatchKind）＋ 一份路径 ＋ 一句
        // 『全文去哪了』」。⚠️ **仍然不 `continue`**：`rels.push` 照旧发生，rel 登记进
        // `methodologyDocs`（那正是「留 rel 登记、只让它不再吐正文」）；这里只是不
        // `bodies.push` 正文。⚠️ 这一档**不读盘**（全文本来就由派单那一跳自己读），所以
        // 「缺」不在这一档判定。
        ensureRel(wiring.rel)
        mark = `${wiring.rel} 转发（dispatchKind=${wiring.forward}）：全文进小助手那份机器拼的派单件，不进本 brief；要自己读时按路径 resources/${wiring.rel} 回读`
      } else {
        const read = readResource(wiring.rel)
        if (!read.ok) { noteMissing(wiring.rel, read.reason); continue }
        const section = pickSections(read.text, wiring.headings)
        // 票 `resource-read-result/06`（`R-06`＝B）：这一格**只**接「文件在、节号被改名（切不出节）」，
        // 与上一行的 `ok:false`（真读不出）**分两档**：
        //   读不出 ⇒ 不登记（上一行已 `continue`）；
        //   切不出 ⇒ **照旧登记**（指针兜底保留这份文档，可按路径回读），但不给那一节的正文、
        //             不印状态迁移标记，改由 `sectionMismatch` 让事件块说一句「节号对不上」。
        if (section === '') {
          ensureRel(wiring.rel)
          noteSectionMismatch(wiring.rel)
          continue
        }
        ensureRel(wiring.rel)
        const secNames = wiring.headings.map((h) => `§${h.replace(/^#{2,3} /, '')}`)
        mark = `${wiring.rel} ${secNames.join('、')}`
        if (section.length >= INJECTION_POINTER_MIN_CHARS) {
          // 票 12 · R1：过线 ⇒ **只留口径 ＋ 指针**。⚠️ 这里**不 `continue`**：`rels.push` 与上面的
          // `mark` 都已发生——挂载面闭包、指针兜底的 `§节号`、「同一串标记只印一遍」那几道既有
          // 闭包吃的都是这两样，删了任何一样都会让它们以「少一格」红（与票 11 的 `forward` 同一手法，
          // 只是票 11 少了「留节号标记」那一半，本票要留）。
          overPointer = injectionPointerLines(wiring.rel, secNames, section.length)
        } else {
          const key = `${wiring.rel}\u0000${[...wiring.headings].sort().join('\u0000')}`
          if (!seen.has(key)) { seen.add(key); bodies.push(section) }
        }
      }
      if (marks.includes(mark)) continue
      if (printedMarks.has(mark)) { suppressed.push(mark); continue }
      printedMarks.add(mark)
      marks.push(mark)
      if (overPointer !== null) extras.push(...overPointer)
    }
    const printed = marks.length > 0 ? marks : suppressed.slice(0, 1)
    if (printed.length > 0) {
      // 多根接线仍用「；」连成一行；过线那几节的 3 行口径另起行跟在后面
      // （⛔ 不并进那一行：口径是**读法**，读数的人要能一眼认出它属于上面那条标记）。
      notes.push(`   · 状态迁移「${row.id}」（${row.why}）→ ${printed.join('；')}`
        + (extras.length > 0 ? `\n${extras.join('\n')}` : ''))
    }
  }
  // 「节号对不上」每个 rel 只印一次（同一个 rel 有多行接线要它时，第二行不再重复）。
  for (const rel of sectionMismatch) notes.push(sectionMismatchLine(rel))
  return { rels, notes, bodies, missing, sectionMismatch }
}

/**
 * 把三层挂到 brief 上（票 02）。返回拼好的正文；顺带把状态迁移注入的文档**登记进挂载闭包**，
 * 让 `brief.methodologyDocs` 仍然是「这一份实际挂了哪几份」的完整事实。
 *
 * 票 `depth-round-3/08`：这是交办件的**第二段 interface**（第一段＝`briefFacts(stage, meta)`）。
 * 一页纸的行不再由调用方另攒一份传进来——它＝`docs` 逐份 `onepagerLine(rel)`（一处派生；
 * 阶段分支里 `mtl()` 登记过的文档全在 `docs` 里）。
 *
 * ⚠️ **`never` 的行挂不进来**（`register` 与事件注入两处都直接跳过）：注入件集合由清单那一列说了算，
 * 挂载面不拥有「这一份例外」的权力——那正是本票第 1 层要消灭的「代码另定一套规矩」。
 *
 * ⚠️ 常驻块不再交「§九 全文」：它交 `residentDeclaration()` 声明的 `residentLines`（四行摘要，
 * 2026-10-29 票 `nine-resident-downgrade/01`）。四行文本只住声明面，本函数不另写一份。
 */
function mountMethodology(base, meta, facts, state, docs, stageSectionMismatch = []) {
  // ⚠️ `let`：常驻件「整份读不出」时要从 `docs` 注销，一页纸行也随之重算（见下面第 ① 节）。
  let onepagerLines = docs.map((rel) => onepagerLine(rel))
  // 票 `resource-read-result/02`：常驻块与事件注入两处「缺」共用这一个收集器（同一个 rel 只报一次）。
  const residentMissing = []
  // 票 `resource-read-result/06`：常驻块「文件在、那一节切不出」与「读不出」**分两档**——
  // 前者不注销登记（同一份文件可能照旧由事件注入给出别的节），只记一条给事件块。
  const residentSectionMismatch = []
  const noteMissing = (rel, reason) => {
    if (!residentMissing.some((item) => item.rel === rel)) residentMissing.push({ rel, reason })
  }
  const register = (rel) => {
    if (discloseOf(rel) === null) return
    if (!docs.includes(rel)) {
      docs.push(rel)
      if (!onepagerLines.some((line) => line.startsWith(`- resources/${rel}：`))) onepagerLines.push(onepagerLine(rel))
    }
  }
  // ① 一页纸（阶段分支里 mtl() 攒的行）——**在状态迁移循环之后才拼**：注入的文档也要补一行。
  // ⚠️ **票 `confirm-points-redesign-build/13`（D1）**：常驻正文的**节号**原先硬写在本行
  // （那一段原先写死在这里，形如 `pickSections(读口(AUDIT_DOC), ['## 九、'])`），
  // 而声明面只有**文件粒度**
  // ⇒ 声明面比实现面宽两万多字符（spec §5.4 D1）。现在照**声明面**取（`residentDeclaration()`：
  // 清单里判 `inline` 的那几行自己带 `sections` 与 `residentLines`）——一处真相，改口径只改清单那一格。
  // ⚠️ **票 `nine-resident-downgrade/01`（2026-10-29）**：交付形态从「§九 整节正文」改成「四行摘要」。
  // 声明了 `lines` 就交摘要；**没声明才退回按 `sections` 取节正文**（给「将来另一份文档真要整节常驻」
  // 留同一条接口）。⛔ 这里不硬写节号、不另写一份四行字面量（判据在 `test/test-path-index.mjs`）。
  // 票 `resource-read-result/02`（D3）：**整份读不出的常驻件 ⇒ 也不登记**。
  // ⚠️ 只对「读不出」这一档**注销登记**（`unreadable`）：那一份**什么都没给**（正文、摘要、一页纸、
  // 登记、指针都不该有）。「文件在、但那一节切不出」**不注销**——同一份文件可能照旧由事件注入
  // 给出别的节（`audit-and-testing.md` 就是这种），注销它会把真给了正文的一份说成没挂。
  // 票 `resource-read-result/06` 把那一格显式接住：登记照旧保留，只往 `residentSectionMismatch`
  // 记一条，让事件块说「节号对不上」（⛔ 不说「缺件／读不出」）。
  const residentRows = residentDeclaration().map((row) => {
    const read = readResource(row.rel)
    if (!read.ok) { noteMissing(row.rel, read.reason); return { rel: row.rel, body: '', unreadable: true } }
    const body = row.lines.length > 0 ? row.lines.join('\n') : pickSections(read.text, row.sections)
    // 票 `resource-read-result/06`：切不出节 ≠ 读不出——登记照旧保留，只让事件块说「节号对不上」。
    // ⚠️ `row.lines` 那一档（四行摘要）不取节，自然不算「节号对不上」。
    if (row.lines.length === 0 && body === '' && !residentSectionMismatch.includes(row.rel)) residentSectionMismatch.push(row.rel)
    return { rel: row.rel, body, unreadable: false }
  })
  for (const row of residentRows) {
    if (!row.unreadable) continue
    const at = docs.indexOf(row.rel)
    if (at >= 0) docs.splice(at, 1) // 连带：一页纸行、登记行、指针行都从同一个 `docs` 派生
  }
  onepagerLines = docs.map((rel) => onepagerLine(rel))
  const resident = [
    RESIDENT_HEAD,
    ...residentRows.map((row) => row.body),
  ].filter((part) => part !== '').join('\n')
  // ② 状态迁移→节：触发取 `stageStateOf` 的 `reason` ＋ 仓库事件；没命中的节不进 brief。
  //    正文按 `(rel, 节集合)` 去重（票 16 · item 1）：同一份文档的同一节只拼一遍——
  //    实测（票面 ②）`旧审计过期` 与 `进入审计动作` 两条都接 §十，chapters 那份 brief 里
  //    `## 十、` 出现过 2 次（12,782 字符）。
  const resolved = resolveInjections(STAGE_STATE_INJECTIONS, meta, facts, state)
  for (const rel of resolved.rels) register(rel)
  // 票 `resource-read-result/02`：常驻块那一处「缺」与事件注入那几处「缺」汇到一起（同一个 rel 只报一次）。
  const missing = [...(resolved.missing ?? [])]
  for (const item of residentMissing) {
    if (!missing.some((row) => row.rel === item.rel)) missing.push(item)
  }
  // 票 `resource-read-result/02` 第 3 条：**缺件告知**——在事件注入块里补一行短句，点名叫哪份缺了。
  // ⛔ **不放进一页纸**（一页纸行数被判据二钉死）；⛔ **不放进 `methodologyDocs`**（那是「给了正文的」集合）。
  // ⚠️ 措辞是**承诺面**（`CONTEXT.md`「承诺过度」把交办说明点名成承诺面）⇒ 只说「哪份缺了、没给正文」，
  // ⛔ **不承诺任何补救动作**（不说「稍后会补」「请自行索取」那类话）。
  const missingNote = missing.length === 0 ? '' : `   · 缺件：${missing.map((item) => `resources/${item.rel}`).join('、')} 读不出（${[...new Set(missing.map((item) => item.reason))].join('／')}）——这一份**没给正文**，也不在下面的指针兜底里。`
  // 票 `resource-read-result/06`（`R-06`＝B）：「节号对不上」与「缺件」分两句。
  // 事件注入那几处已经由 `resolveInjections` 把它拼进 `notes`；这里补常驻块与
  // `attachInvariants`（它在 `mountMethodology` 之前跑，靠 `stageSectionMismatch` 传进来）。
  // 同一个 `rel` 只报一次（三边都点名时不重复印）。
  const sectionMismatchNote = [...new Set([...stageSectionMismatch, ...residentSectionMismatch])]
    .filter((rel) => !resolved.sectionMismatch.includes(rel))
    .map((rel) => sectionMismatchLine(rel))
    .join('\n')
  const events = resolved.notes.length === 0 && missingNote === '' && sectionMismatchNote === '' ? '' : [
    EVENT_HEAD,
    ...resolved.notes,
    ...(missingNote === '' ? [] : [missingNote]),
    ...(sectionMismatchNote === '' ? [] : [sectionMismatchNote]),
    '   （触发是仓库状态判定的，不是你自觉判断；没被触发的节一律走下面的指针兜底。）',
    '',
    resolved.bodies.join('\n\n'),
  ].join('\n')
  // ③ 指针兜底：精确路径＋节号，事件没接住时 AI 自救（rot 护栏：读一次 → 落产物 → 留摘要）
  //
  // ⚠️ 票 12 · R7（spec §5.6 F「指针必须带**有界读法**」）：收尾那句原先只有
  // 「只回读当前这一步真要用到的小节」——**无界**（没说读哪一节／读多少）。补上界：
  // 界就是上面那一行里**由源文标题现派生**的 `§节号`（`pointerMarks()`），读到那一节的末了即止。
  // ⛔ 不另造第二份读法模板：`§节号` 这一族的读法就住在本行；`decision-record.js` 的
  // `decisionPointerLines()`（甲型 `## 完整方案`／乙型整个文件）是**方案文档**那一族的，不重写一份。
  // 强度照实认：机器只验「这句在不在」，「AI 真按有界读」那一半**只有承诺**（spec §5.7 第 1 条）。
  const pointer = [
    POINTER_HEAD,
    RESOURCE_ROOT_LINE,
    ...[...new Set(docs)].map((rel) => {
      const marks = pointerMarks(rel)
      return `   - resources/${rel}${marks.length > 0 ? `：${marks.join('／')}` : ''}`
    }),
    '   （**有界读法**：只回读当前这一步真要用到的那一节——就是上面那一行点名的 `§节号`，读到那一节的末了即止；读完把结论落进产物。⛔ 别把整份读进来。）',
  ].join('\n')
  // ① 一页纸（阶段分支里 mtl() 攒的行）＋常驻块（§九 的四行摘要：两行规则 ＋ 两条内容词，不按事件增减）
  const head = [ONEPAGER_HEAD, ...onepagerLines].join('\n')
  return [base, head, resident, events, pointer].filter((part) => typeof part === 'string' && part.trim() !== '').join('\n\n')
}

/**
 * 票 22（2026-09-29 用户裁决）：`references/invariants.md` **挂进 brief，但按 route 选节**。
 *
 * 口径三条，缺一不可：
 * ① 挂在哪几个阶段 = 下面 `INVARIANTS_STAGES` / `INVARIANTS_GATES` 两张表
 *    （`gold`/`merge`/`final` 已有 `delivery-checklist.md` 覆盖 I8，**不重复挂**）。
 * ② 按 `meta.route` 选节 = 下面这张**按 route 的节清单表**。
 *    ⚠️ **它不是事件→节注入表**：那张选的是 audit-and-testing.md 的小节（按事件触发），
 *    本表选的是 invariants.md 的小节（按路线），两回事，别互相推导。
 * ③ invariants.md **只按 route 选节**（⚠️ 唯一例外：路线还没定的那一趟，
 *    见下面 `INVARIANTS_ROUTE_AGNOSTIC_STAGES`），不参与事件注入：它只有约 3000 字符、不需要按事件增减。
 *
 * 节号口径来自 `invariants.md` 自己的四段结构：I1-I4 跨路线 / I5-I6 仅 blueprint /
 * H1-H3 仅 human / I7-I9 过程（两条路线同等适用）。`writing-agent-prompt.md:17` 的占位符映射与此同源。
 *
 * ⚠️ **键是 route 的取值本身**（票 `confirm-points-redesign-build/06` 正名）：写点只产出
 * `'human'` / `'blueprint'`（`actions/books.js` 建档、`agent-tool.js` 建书），这张表从前有一个键写成
 * `'human-readable'`——那是**生产永不产出的值**，于是 `route='human'` 查不到键、`??` 回落成 blueprint，
 * 两条路线都拿到「给 AI 老师用」那一节（病因形状＝票 `dev-gate-scan/17`：判据与被判物共用一份枚举）。
 * ⛔ 别把这一处词表跟**模板槽位名**（`{{human-readable: …}}`，`dispatch-assembly.js`）或**人读检查名**
 * （「正文无元指令残留（human-readable）」）混起来：那两套是另外的词汇，不随 route 取值走。
 */
const INVARIANTS_SECTIONS_BY_ROUTE = {
  'blueprint': ['## 一、', '## 二、', '## 四、'],
  'human': ['## 一、', '## 三、', '## 四、'],
}
/** 两条路线的小节并集——供**路线还没定**的那一趟用（见 `INVARIANTS_ROUTE_AGNOSTIC_STAGES`）。 */
const INVARIANTS_ALL_SECTIONS = ['## 一、', '## 二、', '## 三、', '## 四、']
/**
 * 票 `confirm-points-redesign-build/06`：**这几趟不按 route 选节**，两节都带。
 *
 * `explore`（探查）在**站 4（第 1 关）之前**就发出去了，而 route 要到站 4 才被人拍定
 * （改判后的口径：取值站 4 定、拍板即锁定）⇒ 按它分岔＝按一个**还没被人选过**的值分岔
 * （建书时的默认档不是用户的表态）。这是「route 必须在探查之前定」的唯一理由，
 * 随 route 搬去站 4 一并裁掉。⛔ 站 4 之后的 `chapters` 与第 2／3 关照旧按 route 选节。
 */
const INVARIANTS_ROUTE_AGNOSTIC_STAGES = new Set(['explore'])
/** 挂的阶段：`explore`（否则 `SKILL.md` 那条 REQUIRED 是个**空指针**）与 `chapters`（铺章全程）。 */
const INVARIANTS_STAGES = new Set(['explore', 'chapters'])
/** 关卡阶段挂哪几关：②（教学模式选型）与 ③（整书教学架构）——最需要底线的两个设计路口。 */
const INVARIANTS_GATES = new Set(['2', '3'])


/**
 * 书夹里**此刻真的建出来的**目录（书夹相对、斜杠归一、深度不限）——票 13 的书夹投影靠它现算。
 *
 * ⚠️ 只枚举**目录**（文件面归那四族登记行），跳过 `.` 开头的（宿主产物）与 `node_modules`；
 * 读不到（书还没建）时返回空数组——**投影不许因为没有目录就炸掉一份交办件**。
 *
 * 为什么要扫盘而不是照常量列一遍：书夹的形状**随流程在变**（细目／报告／分片／模式库都是后长出来的），
 * 照常量列表就等于又落一份「会烂的地图」（spec §5.5 E3 的实证：真书 12 个目录里 5 个没被解释）。
 */
function bookDirsOnDisk(projectId) {
  const found = []
  const walk = (abs, rel) => {
    let entries = []
    try { entries = readdirSync(abs, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      if (entry?.isDirectory?.() !== true) continue
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      const child = rel === '' ? entry.name : `${rel}/${entry.name}`
      found.push(child)
      walk(join(abs, entry.name), child)
    }
  }
  walk(projectDir(projectId), '')
  return found
}

/** 交办件里那几族登记行 → `{family, path}` 的**归一形**（书夹投影的唯一输入）。
 *
 * 四族各自的原形不同（`outputs` 是「件名 —— 契约正文」的散文、`references` 带一个中文括注、
 * `materials` 是对象、`registry` 已经是路径行），归一放在**一处**（⛔ 不让投影去认四种形状）。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：`outputs`／`references` 的正文里**不是**以
 * `工作区|材料|过程|模式库|sources|resources` 起头的那几条**取不出路径**（如
 * 「维护 工作区/progress.md（每章一行）」那句是以「维护」起头的散文）⇒ 它们**不进投影**。
 * 也就是说这一份数的是「**件名写在最前面**的那几条」，⛔ 不是「交办件里提到的所有产物」。
 * 判据侧照实按这个面断（`test-path-index.mjs` 的 AC4 有防空跑下限）。
 */
function bookRegistrationRows(brief) {
  const rows = []
  const asArray = (value) => (Array.isArray(value) ? value : (typeof value === 'string' ? [value] : []))
  const push = (family, path) => {
    if (typeof path === 'string' && path.trim() !== '') rows.push({ family, path: path.trim() })
  }
  const BOOK_HEAD = /^((?:工作区|材料|过程|模式库|sources|resources)\/[^\s（(「」【】）]+)/
  for (const item of asArray(brief.outputs)) push('产物', BOOK_HEAD.exec(String(item))?.[1] ?? '')
  for (const item of asArray(brief.references)) push('引用', BOOK_HEAD.exec(String(item))?.[1] ?? '')
  for (const item of (brief.materials ?? [])) push('材料', typeof item?.md === 'string' ? item.md : '')
  for (const item of (brief.registry ?? [])) push('规范', typeof item?.path === 'string' ? item.path : '')
  return rows
}

/**
 * 交办件拼装：**两段 interface**（票 `depth-round-3/08`）。
 *
 * ① `briefFacts(stage, meta)` —— 该阶段**自己的那几个键**（按阶段判别收窄到一张内部表 `STAGE_FACTS`）；
 * ② `mountMethodology(...)` —— 方法论挂载（既有那段，本票升为第二段 interface）。
 *
 * ⚠️ 本票**只**动接口宽度与写副作用的位置（ADR-0044 决策 3 第 1 行：重开的理由是 interface 大小，
 * ⛔ **不是**「807 行太长」——「按行数拆」的形态否决仍然有效）。八个 `case` 收成一张表是
 * implementation 的内部组织，⛔ 不导出；行数不是判据。
 *
 * ⚠️ **读函数不写盘**：`refreshFinalAuditSummary`（读齐五份 → 拼装 → 写 `工作区/报告/final-summary.md`）
 * 原来住在 `case 'final'` 里，现在是 `actions/chapters.js` 的 `stage-brief` 调用方显式做的那一跳；
 * 本文件这两段 interface 只**读**它拼好的那一份（`readFinalAuditSummary`）。
 * ⚠️ **除 `deepRedoNote` 的一次性消费**（收口 review B4）：`buildStageBrief` 里那两处
 * `updateMeta(projectId, (state) => { delete state.deepRedoNote })`（重做意见只交给被改段的那个阶段，
 * 交出去就消费掉）仍是写盘——它是有意的**一次性消费**，不是「顺手写一份派单件」；
 * 声明面登记时已把它记在「不证明」那一栏，这里补一句，免得标题那句被读成「本函数一个字节都不写」。
 */

/**
 * 一阶段共享的**现算读数**与挂载记账（`STAGE_FACTS` 每一格的入参；只在本文件里流转，⛔ 不进导出）。
 *
 * ⚠️ `stage` **由调用方给**（`buildStageBrief` 传 `meta.pendingStage`；`briefFacts` 传它的第一入参）——
 * ⛔ 不在这里回读 `meta.pendingStage`，否则 `briefFacts('chapters', meta)` 会按 meta 里那个值跑。
 */
function stageBriefContext(projectId, meta, stage) {
  const gate = meta?.pendingGate ?? null
  // 票 03 · 「几路精读」这个数**只数一次**：连同它对应的材料条目一起从
  // `okMaterialShards`（`src/domain-rules.js`）取，`brief.materials` 与 `brief.parallelReads`
  // 都由**这一份**驱动。⚠️ 之前 `sources` 在这里私滤一遍 `convertedState(source) === 'ok'`，
  // `parallelReads[].n` 却来自 `okMaterialNumbers`（另一处过滤），而 `file/role/md` 靠
  // `sources[i]` **位置**对齐——两处口径哪天一分叉（一边认 `'ok'`、一边只认老书布尔 `true`），
  // 就是「派出去的文件名和材料对不上号」而没人看得懂。**位置对齐这个洞随本票一起消失。**
  const okShards = okMaterialShards(meta.sources)
  // ⚠️ **票 `pre-gold-build/02`：落到 brief 的 role 不再从 `meta.sources[].role` 来**
  // （老书留下的老值**只读、不冒充新事实**；票 11 §6 第 6 行）。它逐号取自**判定产物**
  // `工作区/材料判定.json`——`materialRoleTable()` 那张 `num → {role, basis?}` 表，与交工那一刻并进
  // 合并件用的是**同一份读法**（`domain-rules.materialRoleTable`，单点）。
  // 「缺就是缺」：判定产物不在场／没有这一号／那一行 role 非法 ⇒ 这一条**不长出 `role` 键**
  // （⛔ 不回落 `meta`、⛔ 不注空串），与合并件那一侧的写法逐字同形。
  // ⚠️ 枚举面窄处（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）：这一条**不在这里收口**——
  // 「落到 brief 的 role 值 ⊆ ROLES」是 `materialRoleTable()` 自己的副作用（它只收
  // `role ∈ ROLES` 的行，`src/domain-rules.js`），这里只是照表取 `.role`；机器**看不见**
  // 「判定判得对不对」（真机层）。
  // `meta.sources[].role` 这一格今天在**生产读侧上零读取**：G4 已改读合并件 `materials[].role`
  // （`domain-rules.standingGate`，自陈一个字节都不看源字段）；档位那一路的生产三处调用点
  // （`exploreArtifactProblems` 的交工／置态／放行 ＋ `stageBriefContext` explore 支的交办基线与试算）
  // **都显式传了第二输入**；全仓只剩 `domain-rules.exploreDepthTier` 的**省略第二输入**那一档
  // 兼容默认值还在读它（`src/domain-rules.js` 同函数的注释是同一口径，两处要一起对）。
  // `sources` 只算这一次，explore/gate/outline/gold 四个阶段的 `brief.materials` 都由它派生。
  const materialRoles = materialRoleTable(readMaterialJudgment(projectId))
  const sources = okShards.map(({ n, source }) => ({ file: source.file, ...(materialRoles.has(n) ? { role: materialRoles.get(n).role } : {}), md: `材料/转换稿/${source.md}` }))
  /** 本 brief 实际挂了哪几份共用方法论文档——**记下来随 brief 一起交出去**（`brief.methodologyDocs`）。
   *  「哪个阶段挂了哪几份」从此是**生产路径上的一个事实**，不是靠人反解 `engine.js` 源码猜的
   *  （`test-brief-doc-closure.mjs` 的传递闭包断言读的就是这一份）。 */
  const methodologyDocs = []
  /**
   * 登记一份挂载文档（`methodologyDocs` 那一份；一页纸的行由 `mountMethodology` 从它派生）。
   *
   * ⚠️ **票 12 · R8（`spec §5.7` 第 3 条／规划票 17 §2 第 3 条）起它返回空串**：
   * 各阶段分支原先写的是 `brief.methodology = \`${mtl('a')}\n${mtl('b')}\``——那些行于是
   * **同时**落在 `base`（＝阶段分支拼出来的那一份）与**一页纸块**（`ONEPAGER_HEAD` 那一段，
   * 由 `onepagerLines` 再拼一遍）**两处**，同一句话在一份 brief 里出现 2 次（零判据的浪费，
   * spec §5.7 自陈并已裁**去重**）。⛔ **不是删信息量**：那一行仍一字不动地在一页纸块里
   * （`mountMethodology` 照旧按 `docs` 派生 `onepagerLines`、`head` 照旧拼），这里只是**不再让它同时进 `base`**。
   */
  const mtl = (rel) => {
    if (discloseOf(rel) === null) return ''
    methodologyDocs.push(rel)
    return ''
  }
  /** 关卡当前盘上真实裁决（驳回重做事件的判据之一；只在这一步读一次，别在两处各读一遍）。 */
  const gateDecision = stage === 'gate' ? foldGate(projectId) : null
  // 票 `walkthrough-fixes/19`②：那个**用户可拧的旋钮**随每一份交办件交出去（形状先例＝ resourceRoot：
  // 从结构化字段取比从散文里抠可靠）。它是**派生**的，meta 里只存用户拧过的那个数：
  //   · `maxConcurrentSubagents` —— 一次最多派几个小助手；没拧过就是默认值（票 cprb/03 起＝5）。
  const maxConcurrentSubagents = readMaxConcurrentSubagents(meta.maxConcurrentSubagents)?.value
    ?? DEFAULT_MAX_CONCURRENT_SUBAGENTS
  // 站 6 拍板章数那条**非阻断对账读数**要读的同一个数（`工作区/决策/06.json` 的 `values.chapters`）。
  // 交办件与读数**读同一份**（⛔ 不在交办件里手抄一个数、机器那边再读另一个）——
  // 承诺面与实现面同源，是本仓「交办与机器验货同一套词」那条口径的又一次落地。
  const decidedChapters = readDecisionChapterCount(projectId)
  return {
    projectId, meta, stage, gate, shards: okShards, sources, gateDecision, maxConcurrentSubagents,
    decidedChapters, methodologyDocs, mtl,
    // 票 `resource-read-result/06`：`attachInvariants` 在 `mountMethodology` **之前**跑，
    // 它遇到的「文件在、节号切不出」要能传到事件块；同一个 rel 只报一次。
    sectionMismatch: [],
  }
}

/** 每个阶段都带的那七个键（公共事实）。⛔ 阶段私有的键归 `STAGE_FACTS` 每一格自己声明。 */
function commonBriefFacts(projectId, meta, stage, ctx) {
  return {
    stage,
    gate: ctx.gate,
    label: stageLabel(stage, ctx.gate),
    dir: projectDir(projectId),
    // 方法论根目录也走**结构化字段**（不只是指针块里那一行）：派发行要原样转给小助手，
    // 从字段取比从散文里抠路径可靠。票 `.scratch/methodology-root-pointer/01`。
    resourceRoot: RESOURCES_DIR,
    project: { name: meta.name ?? '', goal: meta.goal ?? '', route: meta.route ?? 'blueprint', science: meta.science === true },
    maxConcurrentSubagents: ctx.maxConcurrentSubagents,
  }
}

/**
 * **纯读**盘上那份 `工作区/报告/final-summary.md` → brief 要的 `finalSummary` 形状（不在／空 ⇒ `null`）。
 *
 * ⚠️ 票 `depth-round-3/08`：拼装写盘（`refreshFinalAuditSummary`）从 `case 'final'` 搬到
 * `actions/chapters.js` 的 `stage-brief` 调用方；读函数只读它拼好的那一份。
 * 五份齐不齐由**调用方**那一跳决定要不要拼，这里不猜、也不顺手补写。
 */
function readFinalAuditSummary(projectId) {
  const rel = finalAuditSummaryRel()
  const abs = join(projectDir(projectId), ...rel.split('/'))
  let text = ''
  try { text = readFileSync(abs, 'utf8') } catch { return null }
  if (text.trim() === '') return null
  const parsed = parseFinalAuditSummary(text)
  const items = parsed.sections.map((section) => section.items.length)
  return { path: rel, chars: text.length, unionSize: items.reduce((sum, n) => sum + n, 0), items }
}

/** 某份 brief 该不该挂不变量底线（阶段 + 关卡两维；`gold`/`merge`/`final` 一律不挂）。 */
function invariantsAttached(stageKey, gateKey) {
  if (stageKey === 'gate') return INVARIANTS_GATES.has(String(gateKey))
  return INVARIANTS_STAGES.has(stageKey)
}

/** 票 22：按 route 选节的不变量底线（**只对挂了的那几个阶段追加**）。 */
function attachInvariants(brief, stageKey, ctx) {
  const { meta, gate, methodologyDocs, sectionMismatch } = ctx
  if (!invariantsAttached(stageKey, gate)) return
  // ⚠️ 同一条 `never` 纪律：这张表按 route 选节是票 22 的口径，但**挂不挂**仍然由
  // 产物清单那一列说了算（今天它是 `pointer`；哪天判 never，这里就整块不给）。
  if (discloseOf('references/invariants.md') === null) return
  // 票 cprb/06：路线还没定的那几趟（今天只有 `explore`）**不按 route 选节**——两节都带。
  const routeAgnostic = INVARIANTS_ROUTE_AGNOSTIC_STAGES.has(stageKey)
  const headings = routeAgnostic
    ? INVARIANTS_ALL_SECTIONS
    : INVARIANTS_SECTIONS_BY_ROUTE[meta.route ?? 'blueprint'] ?? INVARIANTS_SECTIONS_BY_ROUTE['blueprint']
  // 票 `resource-read-result/02`：读口改吃分档答案——**读不出** ⇒ 整块不出现（`ok:false` 才 `return`）。
  // 票 `resource-read-result/06`（`R-06`＝B）：**文件在、节号切不出**是另一档——照旧登记进
  // `methodologyDocs`（指针兜底保留它、可按路径回读），由 `mountMethodology` 在事件块说一句
  // 「节号对不上」；⛔ 别把这一档塞回「读不出」。
  const read = readResource('references/invariants.md')
  if (!read.ok) return
  const sections = pickSections(read.text, headings)
  if (sections === '') {
    if (!methodologyDocs.includes('references/invariants.md')) methodologyDocs.push('references/invariants.md')
    if (!sectionMismatch.includes('references/invariants.md')) sectionMismatch.push('references/invariants.md')
    return
  }
  // 路线名照 meta.route 逐字取（'blueprint' / 'human'），不另造一套译法——
  // 这里写错会让 AI 看到「适用本路线（blueprint）」却拿到 human 的小节。
  const routeLabel = INVARIANTS_SECTIONS_BY_ROUTE[meta.route] === undefined ? 'blueprint' : meta.route
  // 路线未定那一趟不说「适用本路线」（那时还没有本路线可言），改说清它为什么不分岔。
  const invHeader = routeAgnostic
    ? `↓ 以下是不变量底线里**两条路线都适用**的 ${headings.length} 节（这一趟在路线拍定之前发出，不按路线分岔——resources/references/invariants.md 的四节都在这里）：`
    : `↓ 以下是不变量底线里**适用本路线（${routeLabel}）**的 ${headings.length} 节（resources/references/invariants.md 的其余小节属于另一条路线，不适用本书）：`
  brief.methodology = `${brief.methodology ?? ''}\n\n${invHeader}\n\n${sections}`
  methodologyDocs.push('references/invariants.md')
}

/**
 * 一张 **stage → facts** 的表（票 `depth-round-3/08`）。
 *
 * ⚠️ 它是 **implementation 的内部组织，⛔ 不导出**：每一格只声明**自己那几个键**（返回的对象字面量
 * 由那一格的赋值逐条长出来），公共的七个键由 `commonBriefFacts` 在 `briefFacts`／`buildStageBrief`
 * 那一层拼上来。表里**没有**「所有人共享一份大字典」那一步——那正是本票要收窄的接口宽度。
 *
 * ⚠️ 判据强度＝实现强度（`test-brief-doc-closure.mjs` 新那一格）：只断「每阶段键集＝它声明的那几个」
 * ＋「读函数不写盘」；⛔ 不断内容对不对、⛔ 不断行数（ADR-0044 决策 3 第 1 行）。
 */
const STAGE_FACTS = Object.freeze({
  goal: (ctx) => {
    const facts = {}
    const { meta, projectId, sources, mtl } = ctx
    const pointer3 = stationPointer(projectId, 3)
    if (pointer3.text !== null) facts.decisionPointer = pointer3.text
    // ── 票 `rcb-build/04`：「进 brief＝渲染进正文」（spec §5.4）────────────────────────────
    // 站 2 那一次表态的**身份读数**由结论件 `values` 现算（spec §6.8 裁决二），在这里**渲染成
    // 一句话**塞进交办正文的 hints——⛔ 不新增 `brief.*` 字段、⛔ 不落第二份事实源。
    // 用途：让站 3 的 AI 知道这份读者边界**是不是被人确认过**——「没人动过」那一版必须
    // 自称「本次按 AI 先验执行」，⛔ 不许当成已拍板的下沿；`brief.references` 也⛔ 不加
    //（这一站不需要整份件；问卷回卷的映射归后面的站）。
    const stationTwoDecision = readStationDecision(projectId, STATION_EXPLORE)
    const readerStance = exploreConfirmStance(stationTwoDecision?.values)
    // 票 11：收卷人不再是 `values` 的一格——从**书账本** `meta.answerer` 读（回卷动作写的史实）。
    const recordedAnswerer = EXPLORE_CONFIRM_ANSWERERS.includes(meta.answerer) ? meta.answerer : null
    if (readerStance.kind === EXPLORE_CONFIRM_STANCE_KINDS.aiPrior) {
      facts.hints = [...(facts.hints ?? []), `读者情况：${EXPLORE_CONFIRM_AI_PRIOR_STATEMENT}——还没有人答问卷；这一版读者边界**未经人确认**，别当成已拍板的下沿。`]
    } else if (readerStance.kind === EXPLORE_CONFIRM_STANCE_KINDS.human) {
      // 票 11：两条出口里只剩「答问卷」这一条人出口（ai-draft 已退役）。
      facts.hints = [...(facts.hints ?? []), `读者情况：这次读者边界按收卷人交回的问卷成文${recordedAnswerer === null ? '' : `（收卷人：${recordedAnswerer}）`}。`]
    }
    // ── 票 `rcb-build/06`：回卷件上的「已会」由 AI **逐条读、代笔**落剔除记录（ADR-0040 决策 2／3）──
    // 教学落点＝**本站的交办正文**（AI 真读得到的地方）：⛔ 不新开动作、⛔ 不新开产物流、⛔ 不新 brief 字段
    // ——`hints` 是既有字段，与上面那条身份读数同一条形状（渲染进正文）。
    // **有件才写**：回卷件不在盘上时这一句是假指令（没人回卷 ⇒ 没有可代笔的勾选）；件在不在走读侧
    // 那唯一出口（`readerQuestionnaireReturnText`），⛔ 不在这里另拼一份路径判断。
    // 票 `ui-display-redesign/11`：**按「谁填的」追加一档策略句**（本人＝自评／监护人＝第三方观察／
    // 老师＝教学判断）——三句的唯一出处住在 `reader-questionnaire.js` 的 `readerAnswererBriefClause`
    // （⛔ 不在这里手抄三份中文）；没记下收卷人（老书那一档）⇒ 只发上面那条通用教学，⛔ 不猜一个身份。
    // ⚠️ 强度如实（机器只验形状，spec §6.2 A／§6.5）：机器**不验** AI 读得对不对、也不验它有没有真发
    //   那一支——这里保证的只是「那句口径在 AI 手上」＋「落记录只有那一条写路」（判据在
    //   `test/test-knowledge-map-exclusions.mjs` 第 ⑩ 节）。
    if (readerQuestionnaireReturnText(projectId) !== null) {
      const strategyClause = readerAnswererBriefClause(recordedAnswerer)
      facts.hints = [...(facts.hints ?? []),
        `读者情况回卷件（\`${READER_QUESTIONNAIRE_RETURNED_REL}\`）在盘上：**逐条读它**，只有**明确勾了「已经会」**的条目才算「这本书不讲」；`
        + '答「不确定」的与**没勾**的一律照常讲（⛔ 一条都不落）。'
        + (strategyClause === null ? '' : `${strategyClause}（收卷人：${recordedAnswerer}）`)
        + `落记录走**既有**那条图上「意见」通路 \`graph-opinion\`（\`verdict=不讲\`、\`verdictReason=已经会\`）`
        + '——与图上那把划子是**同一支动作、同一份剔除记录**（⛔ 不给问卷另设一条写路）。'
        + '⛔ **不要自己手写**那份 `工作区/knowledge-map-exclusions.json`：它只经那支动作写，读的时候按人产物读。'
        + '记错了的用户能在图上照旧按 ↩ 放回来；这一步只把回卷件上那几条勾选落成记录，⛔ 不改图、⛔ 不改覆盖闸门。']
    }
    facts.task = '读上一站拍下的那份材料报告与它给你划掉的那几条，写下「**学完要能做到什么**」：'
      + `${'3–5 条'}具体、可检验的目标，一条一句话（读者学完能独立做到什么，不是这本书讲了什么）。`
      + '⚠️ 「3–5 条」是**提示不是硬拦**：材料本身只撑得起 2 条时就写 2 条，⛔ 不许为了凑数编。'
      + '⚠️ 这几条**不叫「上沿」**——它就是这本书的目标；它也不是知识点清单的复述。'
      + '⛔ 不在这里写章节安排、教学法或逐章骨架（那几件归后面的站）。'
    facts.outputs = 'goals（字符串数组，一条一句）通过 stage-submit（stage=goal）提交：'
      + '机器把它落成 工作区/目标-v<版本>.md（带版本号），并停在你那一屏等用户逐条改／删／加之后**整批一次过**；'
      + '用户「让 AI 重写这几条」时你会拿到他的意见，那一趟写的是**下一版**（目标-v<版本+1>.md）。'
    facts.materials = sources
    facts.methodology = mtl('SKILL.md')
    // 站 3 驳回之后的「让 AI 重写这几条」：用户上一句意见随这一趟交办件读
    // （与 `outlineRedoNote` 同一先例；⛔ 不在 brief 里另造第二份措辞）。
    if (typeof meta.goalRedoNote === 'string' && meta.goalRedoNote.trim() !== '') {
      facts.userFeedback = meta.goalRedoNote
    }
    return facts
  },
  explore: (ctx) => {
    const facts = {}
    const { meta, projectId, shards: okShards, sources, mtl } = ctx
    // 票 03 · ADR-0030 决策 2（改派）／4（模板层）：这一段的病是**回灌**——交办原文
    // 「要求详细摘录」把 3 份精读报告（22,106／39,321／52,770 字符）全灌回了主笔上下文。
    // 真机已经证明另一条路可行（有个精读小助手自发「细目落盘 38,030 字符＋摘要回灌」），
    // 但**全凭自觉**——这一支把它变成结构：精读派读是主路径，主笔的活是派发／合并／抽查。
    // 票 `context-budget/17`：合并件改**机器拼装**，主笔只交书级键——口径改了，交办不给新说法
    // AI 就仍会去抄一遍（那 24,025 字符的 write 正是本票要永久省掉的那一笔）。
    facts.task = '**先派一路书级材料判定**（`workbench_act(action=agent-assign, dispatchKind=material-survey)`：机器照 resources/references/subagent-prompts/material-survey-prompt.md 那份模板代填，并把每份转换稿的开头片段、标题行清单与路径一并给它）——它落 工作区/材料判定.json（逐份一个 role ＋ 一句 basis），交工那一刻机器按它把 role 与那句 basis 并进合并件的 materials[]；这份产物不在场，交工当场 400。再统筹读完全部转换后的材料（每份的 材料/转换稿/ 子路径与 full.md 见 materials）：**按 parallelReads 逐份派精读小助手**（每份一个干净上下文，各路可并发；用 `workbench_act(action=agent-assign, dispatchKind=close-reading, material=NN)`，机器照那份模板代填），每路按 resources/references/subagent-prompts/close-reading-prompt.md 派，自己落下该材料的细目与知识地图分片。你只做三件：派发与抽查一两路、产出书级三件（teachingFocus、chapterSuggestion 与 readerSlices「片」）、以及亲自汇总写 工作区/explore.md（那份索引的必做小节见 outputs，机器交工时逐项验）——**合并件由机器按分片拼装**（交工那一刻它按键拼成 工作区/knowledge-map.json），**不要自己再合并一遍**，那正是要砍掉的那份重复搬运。'
    // 票 07 · pipeline-wiring-gaps：explore.md 的必做小节与机器验货是**同一份词表**
    //（`domain-rules.exploreDepthTier`——任务说明与机器判据各写一份词表就会漂，漂了就是永远 400）。
    // 档位按当次转换完成的源数量分（同一次数出来的口径：分片/细目义务、parallelReads、这里的档位）。
    // ── 票 `pre-gold-build/03`：**两段式**档位 ────────────────────────────────────────────
    // 交办这一刻判定产物还不存在（它就是这一趟要产出的东西）⇒ 这里给的只能是**基线档**：
    // **按转换完成的源数**算、⛔ 不读任何角色声明（显式传空声明面）。
    // 交工／置态／放行三处读的是**同一份算法 ＋ 同一个第二输入**（判定产物的 role 集，
    // 见 `exploreArtifactProblems`）——一份算法三处读、一个定义，⛔ 不各抄一份词表。
    // ⚠️ **允许不一致**：这一句的基线档与交工那一刻实算的档**可以不一样**——不一致不是 bug，
    // 正是两段式的设计（交办这一刻判定还不存在）。承诺面只到「交工时按你那份声明重算一遍再验」，
    // 强度照实认：机器验的是**AI 自己声明的**角色推出来的档位，**不是**「机器发现这真是考纲」
    //（自证；口径按 `docs/测试信任边界.md` 总纲）。
    const baselineTier = exploreDepthTier(meta.sources, [])
    const fullTier = exploreDepthTier(meta.sources, [SYLLABUS_ROLE])
    const upgradeItems = fullTier.required.filter((item) => !baselineTier.required.includes(item))
    const exploreTierLine = baselineTier.count === 0
      ? '本次没有转换完成的源（无源书）：必做小节为空，索引写本次实际做的事（两段式档位不适用）。'
      : `本次转换完成的源共 ${baselineTier.count} 份 → **基线档「${baselineTier.tier}」**，explore.md 必做小节：${baselineTier.required.join('、')}（小节名**逐字**含这些词，机器交工时按名字逐项验，缺哪项当场 400 点名哪项）。${upgradeItems.length > 0 ? `**若你在材料判定里判出「考纲」，档位自动升「完整版」**，必做小节再加「${upgradeItems.join('」「')}」` : '**若你在材料判定里判出「考纲」，档位本来就已是「完整版」**——这一批必做小节不再加项'}——机器在交工时按你那份判定（工作区/${MATERIAL_JUDGMENT_NAME}）**重算一遍**再验。`
    facts.outputs = [
      // 票 brief-word-limits/01：主次分工写明——**细颗粒度落细目目录与知识地图 JSON，explore.md 只做给人读的索引**。
      // 原式两句并列，AI 看不出主次，于是「用户要更多细节」与「≤1200 字」互相顶。
      // ⚠️ 票 11 改掉了后半句：它原先逐字写着「细颗粒度的东西（逐条摘录、知识点细目）**一律进
      // 工作区/knowledge-map.json**」——那是**与落盘正面冲突**的一句话（spec 决策 14 点名要改的那句）：
      // 逐条摘录与知识点细目落的是**每个精读小助手自己的细目文件**，知识地图装的是结构化键与聚合，
      // 两件不是同一件，把细目导向 JSON 等于让主笔把五份全文手抄进一个文件里（实测最贵的那次搬运）。
      // 票 07 · pipeline-wiring-gaps：内容清单从「散文三类」换成与机器验货同一套词的必做小节
      //（源材料方法论 source-material.md §二第一层的产物：源文件简码表、真相校准、全书通用锚点；
      // 完整版再加每源结构探查与高频陷阱预判——三档分法见那份文档，档位与必做项由
      // exploreDepthTier 给：票 `pre-gold-build/03` 起是**两段式**——交办这一句是**基线档**
      //（按源数），判出考纲升完整版那句紧跟在后，交工按声明重算）。
      // ⚠️ 票 17 · ADR-0023：那份方法论简码表里的「地位」列**不在**这份索引里要求——
      // 逐源声明是结构化字段 materials[].standing（见下一条 outputs），散文里不再有第二份
      // 地位/权威式的要求（两处说法必然漂，结构化的那份是唯一出口；这个退役了的词
      // 在本文件里一个字都不许再出现——test-material-standing.mjs 的契约面判据盯着）。
      `工作区/explore.md —— **给人读的索引**（纯 Markdown，篇幅从简）。${exploreTierLine}每节下写真东西：源文件简码表要有 简码/路径/定位 三列，真相校准写实际翻源发现的「看起来完整其实是碎片」的坑，全书通用锚点写跨章共享的源定位（公式汇总表/原则全文位置/术语表位置）。⚠️ 这一条**只有承诺**、机器零判据：机器只认**小节名子串在场**（别的节里提一嘴也算），**不读节里有没有东西**（必做小节逐项在场本身是硬闸——缺哪项当场 400 点名；而节里写没写那三列，机器一个字都不看）。约 1200 汉字（软目标，机器不验字数、验上述必做小节，超一点没关系）。**逐条摘录与知识点细目落 ${DETAIL_DIR_REL}/（每份材料一份，由那个精读小助手自己落盘，见 parallelReads[].reading），结构化的知识点键落 工作区/knowledge-map.json**——两份都不要塞进这个索引，它只做索引。`,
      `工作区/knowledge-map.json —— 结构化知识地图（严格 JSON，**结构化键与书级聚合的主落点**，格式与以前那份一模一样）：materials:[{num,standing,sections:[{title,summary,keywords}]}]（standing＝**材料分量声明**，逐源一句人话写清这份材料在什么问题上说了算、在什么问题上不算数；本次转换完成的源只有一份时可省——单本教材的声明无信息量；角色为「真题」的源必须写，且要显式写明有无配套答案与评分标准）、knowledgePoints:[{id,title,source,summary,difficulty}]（difficulty 只填 基础/重点/难点/进阶 四档之一——取值域登记在案，出域值机器交工时会归一化写回并告知用户；id 可选，机器不依赖它）、teachingMethods:[{id,title,source,summary}]（**教法**＝某个知识点**怎么讲**那一层的做法，常藏在教师用书与讲义里、逐源读才看得见；形状与 knowledgePoints 同族，**不收 difficulty**，**缺席或空数组都合法**——学生用书里本来可能一条教法都没有，机器不因缺它拒交；它**与 knowledgePoints 是两个键、不许混**：覆盖闸门按 title 单键两头查，混进去会被要求锚定进章节或被漏掉，两条都不对）、teachingFocus:[string]（重点/难点各一句人话，纯字符串，如「重点：分数运算」「难点：应用题建模」）、chapterSuggestion:[{title,source,points}]（${CHAPTER_COUNT_POLICY_TEXT}，机器交工时只验非空）、readerSlices:[{name, description?, members:[知识点 title]}]（**书的「片」**：把这本书按**读者语域**切成几块（3–5 片为目标；**同片不混语域**——按章分组会把两种材料混编，语域块多于 5 片时片数可以更多）；片名与片说明**用读者的话**写（⛔ 不进任何机器判据）；members 按知识点 **title** 引用（⛔ 不能写 kp.id）；⛔ 不要求覆盖全部知识点、⛔ 不设「其他」垃圾桶片；机器只验形状：片数 ≥1 且每片有名有成员、members 按 title 归一化能在知识点图上对上——形状坏当场 400 点名，**不交也合法**（问卷侧会退化成「整本书一片」并如实说明））。**materials 与 knowledgePoints 与 teachingMethods 由各精读小助手各写各的分片（工作区/knowledge-map-NN.json），合并件由机器按分片序号按键拼装、交工那一刻落盘——你不用交它；你只交 teachingFocus、chapterSuggestion 与 readerSlices 这三件书级聚合（交工参数同名），它们是这一份里唯一只有你能产出的部分。逐条摘录与细目正文不在这里——它们在各路自己的细目文件里。**`,
    ]
    facts.materials = sources
    // 票 03 · Q6 已锁的落点：**逐份列并发单元**（形状先例＝ chapters 的 `remaining` 逐章表）。
    // 每格把那一份材料的两件落盘路径写死，派发时照抄即可——「并行」从散文里的「材料多时可以」
    // 变成表里的一行行事实。序号与材料条目**成对取自 `okMaterialShards`**（与
    // `stage-submit(explore)` 的验货同一份口径，且**不再按 `sources[i]` 位置对齐**）。
    // ⚠️ 票 `pre-gold-build/02`：`role` 与 `brief.materials[]` **同一处取**（都由上面那个 `sources`
    // 派生，而它的 role 来自判定产物）——⛔ 不回落 `meta`；判定产物里没有这一号时键**整体缺席**。
    facts.parallelReads = okShards.map(({ n, source }, i) => ({
      n,
      file: sources[i].file,
      ...(sources[i].role === undefined ? {} : { role: sources[i].role }),
      md: sources[i].md,
      reading: readingRel(n),
      shard: knowledgeShardRel(n),
    }))
    facts.methodology = `${mtl('SKILL.md')}\n\n${mtl('references/source-material.md')}`
    facts.hints = [
      '这是全书设计的基准，宁可多读、多整理，不要只读开头。',
      `精读派发模板：resources/references/subagent-prompts/close-reading-prompt.md —— 派每一路用 \`workbench_act(action=agent-assign, dispatchKind=close-reading, material=NN)\`（机器照这份模板代填：细目落盘 ${readingRel('NN')}、分片落盘 ${knowledgeShardRel('NN')}、最终回复 ≤2K token：结论／结构一句话／质量信号／落盘路径），你只给材料号 ＋ 一句叮嘱。按 parallelReads 逐份派、可并发；材料多时不要退回「自己从头读到尾再汇总」，那会把同一份内容搬两遍。`,
      `精读小助手的回灌要短：细目写在它自己的 ${readingRel('NN')} 里，带回来的是浓缩结论＋条目级点名＋落盘路径。**别让它把整份摘录灌回你的上下文**——那是你这一段最大的开销来源。`,
      `合并步：合并由机器做——交工那一刻它按 NN 把各份 ${knowledgeShardRel('NN')} 的 materials/knowledgePoints/teachingMethods 拼成 工作区/knowledge-map.json；你只交书级的 teachingFocus、chapterSuggestion 与 readerSlices（stage-submit 的同名参数）。抽查请读分片或细目的**片段**，不要整份搬进上下文。`,
      // 票 `reader-cognition-boundary-build/01`：**片的唯一教学句**（生产者＝探查主笔；两档路线在探查段
      // 无分岔 ⇒ 这一句同时覆盖 human／blueprint）。形状的机器判据是 `readerSliceProblems`（交工 400）；
      // 语义（同片是否真不混语域、片名是否读者的话）机器不验，所以这句写的是**要求**而不是判据。
      `片（readerSlices，交工参数）：把这本书按**读者语域**切成几块——同一片里不许混语域（按章分组会把两种材料混编）；每本 3–5 片为目标（语域块多于 5 片时片数可以更多，⛔ 别为了凑 ≤5 把不同语域硬塞进一片）；片名与片说明用**读者的话**写（它们不进任何机器判据）；members 按知识点 **title** 引用（⛔ 不能写 kp.id）。⛔ 不要求覆盖全部知识点（没被片收进的照常讲）、⛔ 不设「其他」垃圾桶片、⛔ 不二次分组。实在分不出语域就不交这一件——问卷侧会退化成「整本书一片」并如实说明。`,
      // 票 `knowledge-graph-build/06`：**跨材料那一层**由探索段内再派的一路产（spec §1）——主笔是交工者，
      // 但判断在那一路上。这一句是它**唯一的调用点**：不写它，第八档在主笔眼里就是一个不知何时用的档位。
      // 成本是一行提示（约 250 字符、只在 explore 段出现一次），换来的是主笔不必自己读全部卡片。
      `跨材料对齐：全部精读分片落盘之后**再派一路对齐小助手**（\`workbench_act(action=agent-assign, dispatchKind=alignment, note=…)\`，机器按 resources/references/subagent-prompts/alignment-prompt.md 代填：它读**全部卡片**），它带回来的是**跨材料的边**与「同一件事跨材料合并」的结论。交工时把它的 \`edges\` 与 \`alignment\` 两个参数**原样**带上（机器把书级边接在各片边之后、把合并落成一张卡 ＋ \`mergedFrom\` ＋ 位置索引，并当场现算查环）。⛔ 别自己改分片里的卡、也别自己改合并件。`,
      '无论自己读还是派小助手，文件操作用文件工具（read/write/edit/glob/grep），别用 shell（工具纪律见 audit-and-testing.md §九，跨平台一致）。',
      `写完用 stage-submit（stage=explore）交工，带 teachingFocus、chapterSuggestion 与 readerSlices（片，实在分不出来可以不交）；机器会验 工作区/explore.md（必做小节逐项在场，见 outputs）、每份转换完成的材料各有一片 ${knowledgeShardRel('NN')} 与一份 ${readingRel('NN')}、材料分量声明（≥2 份源时逐源要有 standing，真题源还要显式表态有无配套答案与评分标准——单源可省）、chapterSuggestion（${CHAPTER_COUNT_POLICY_TEXT}）、以及 readerSlices 的形状（片数 ≥1、片级非空、members 按 title 在知识点图上对得上），缺一件当场 400 并逐件点名；合并件由机器拼，不用你交。`,
    ]
    // 重做时：把用户的不满意见带给 AI（这是重做唯一的改进方向）。
    const redoNote = meta.exploreRedoNote
    if (typeof redoNote === 'string' && redoNote.trim() !== '') {
      facts.userFeedback = redoNote
      facts.hints.push(`这是重做：用户上次的不满意见是「${redoNote}」。必须照着改；实在不清楚就先在对话里问用户确认方向，绝不能再交一份几乎一样的。`)
    }
    return facts
  },
  gate: (ctx) => {
    const facts = {}
    const { meta, projectId, gateDecision, gate, sources, mtl } = ctx
    const current = gateDecision
    facts.task = `手工起草${gateHuman(gate)}的设计方案，用人话向用户解释，等用户拍板。`
    facts.gateLabel = GATE_LABELS[gate] ?? ''
    facts.gateTask = {
      // 票 `confirm-points-redesign-build/06`：第 1 关那句任务词**跟着 ADR-0037 决策 2 的改判换向**
      // ——那一关从「推导一份目标」变成「**复核并细化**上游已经拍定的 3–5 条目标」，改动记成
      // **三条：新增／改写／删掉**，随该关提案一起交给用户拍板（ADR-0037 决策 3「改动要显式落一笔」
      // 照旧适用，只是它现在管的对象是**目标**；改判落纸见 `docs/adr/0037-*.md` 的 `## Amendment`）。
      // ⚠️ 这里⛔ 不写上游结论件的路径：站 3 的结论件与 `工作区/目标-vM.md` 由**站 3 那一票**落，
      // 站 4 吃它要走的指针也归那一票接线（本票只改这一关**怎么做**，不替上游编一个还不存在的路径）。
      '1': '复核并细化学习目标（这一关**不再从零推导**）：对着上游那一站已经拍定的 3–5 条目标逐条过一遍，把这一关要动的地方记成三条——新增哪一条、把哪一条改写成什么、删掉哪一条；这三条随本关提案一起交给用户拍板。另外答一句：这本书主要怎么学（用户会在这张卡上把这一项拍定）。最大的坑是什么？',
      '2': '教学模式选型与板块语法：读了模式库，考虑过哪些、拒绝哪些、为什么；选中的模式解决本书哪个教学问题；设计每章的板块结构。',
      '3': '整书教学架构：知识链主线、卷/部划分、特殊章、跨章引用机制、附录策略、贯穿案例约定（每章的**锚定知识点来自知识地图**：探查段合并件 工作区/knowledge-map.json；无源书没有知识点清单时，改写锚定的源任务或概念）。⚠️ **逐章骨架表不在这一关写**（票 `confirm-points-redesign-build/07`：它归「章节安排」那一站按本关定下的架构逐章落——两处各写一张表正是「一处说 10 章、另一处 12 章」那个打架实例的来路）。**另有两件在**这一步**就要答、不能拖到写范式章才答**：①本书第一读者是谁（AI 老师 / 人类读者）；②防螺旋铁律的**设计期禁令**——从这一关拍板到写作规范产出之间，不许自行加章/加附录/加机制级板块，真要加等用户走定点修改重新拍板（style-spec 里的「防螺旋铁律」那一项记的是**定稿之后**的回炉规则，两半不是一回事）。',
    }[String(gate)] ?? ''
    // 票 `pre-gold-build/09`（债-09 的场内标注）：上面那三段实质内容**一个字未删**，只在末尾补一条
    // 照实读数——三关的**实质内容**机器零内容判据，闸门今天判的是另一样东西（三段非空 ＋ 占位词表）。
    // ⚠️ 落点是**承诺面当场**（先例＝ `case 'chapters'` 的 hints 里那条「只有纪律、机器不强制」——
    // 那一处已是照实写的，本票不动它），照 ticket 08 §4 的
    // ③档「有意的硬标准」处置：只加标注、⛔ 不补闸、⛔ 不写成「已验」。将来某处真补了闸（票 11／17
    // 可能碰同一处）要回来改这条标注——标注与实现面的强度同进同退。
    if (facts.gateTask !== '') {
      facts.gateTask += '⚠️ 上面这段实质内容**只有承诺**、机器零判据：机器只判 title／summary／detail 三段非空 ＋ 占位词表（命中当场 400 并点名是哪个字段哪个词），这就是闸门的**全部内容判据**——这三段该推导出什么，机器一个字都不读。'
    }
    // 票 `pipeline-wiring-gaps/05`：关卡③ 的骨架表第 5 列要「锚定知识点」，但这一关原先
    // 既没挂参考件、任务词也不提知识地图（核验报告 verification.md 第 1 条：CONFIRMED）——
    // 孤儿指令的形状。与 outline 段同形地**两处一起接**：参考件挂 `brief.references`、
    // 任务词在 gateTask['3'] 里明写「锚定知识点来自知识地图」（判据见 test-gate3-knowledge-map.mjs，
    // 两处缺一即红）。只在 gate 3 挂：①② 用不到知识地图，不动前两关。
    if (String(gate) === '3') {
      facts.references = ['工作区/knowledge-map.json（知识地图）']
    }
    facts.previousDecision = current === null || current.gate !== gate ? null : {
      version: current.version, status: current.status,
      reasons: current.decision?.reasons ?? [], note: current.decision?.note ?? '',
    }
    // ── 票 `confirm-points-redesign-build/01`（票面落点 (b)）：站 4 → 站 5 那一根 tracer bullet ──
    // 站 5（＝第 2 关）的派单件里**逐字**出现那句三行指针：①上一站结论件的路径 ②读哪些键
    // ③由结论件的 `proposal.file` **读出来拼**的那份正文路径（⛔ 不在 brief 里再抄一份，一处真相）
    // ＋ 一行**书夹绝对基准**。
    // ⚠️ 指针的**逐字模板与有界读法**（甲型读 `## 完整方案` 一节／乙型读整个文件）单一出处是
    // `decision-record.js` 的 `decisionPointerLines`，⛔ 这里不另写一份说法。
    // ⚠️ **硬闸不落在这一层**：它在「派单那一跳」（`actions/chapters.js` 的 `stage-brief`／
    // `agent-assign`，缺件 ⇒ 409 不开这一站）。理由：本函数今天被大量判据**直调**（`buildStageBrief`
    // 是它们造派单件的入口），在这一层抛会把这些判据的既有夹具一并打断——那是另一张票的面。
    // 结论件或它指的正文缺时，指针**整块不给**（⛔ 不给半份指针、也不留一句编出来的路径）。
    // ⚠️ 指针只给**路径**，⛔ 不替 AI 抄内容；「AI 真的读了它」那一半只有承诺，机器验不了。
    // ⚠️ **一处真相**：站号 → 关卡那三站的映射**只有** `decision-record.js` 的 `STATION_OF_GATE`
    // 一张（票 16 把原来那三段各写一遍 `STATION_OF_GATE['1'|'2'|'3']` 的调用收成**一次**派生；
    // 盘上那张表逐字是 `{4:'1', 5:'2', 6:'3'}`）。
    // ⚠️ `STATION_OF_GATE['1']` ＝ **4**（⛔ 别写成站 1）——站 4／5／6 ≡ 关卡 1／2／3。
    // 三站各自「吃什么」的读法由 `POINTER_READ_MODE` 那一张表给（站 4 乙型／站 5／6 甲型），
    // 本处一个字都不判断型——那是 `decision-record.js` 的活。
    {
      const pointerStation = STATION_OF_GATE[String(gate)]
      if (pointerStation !== undefined) {
        const pointer = stationPointer(projectId, pointerStation)
        if (pointer.text !== null) facts.decisionPointer = pointer.text
      }
    }
    // ⚠️ 编排合并 2026-10-16 解的冲突：本段（票 05 的站 3→站 4 指针）与下面票 12 那一段 `brief.outputs`
    // 争的是同一处；两侧都要留——指针取站 3 的结论件、`outputs` 取**更新**的那一版（票 05 那一侧带的是
    // 它分支起点上的**旧** outputs，已丢弃；05 的其它 engine 改动不在这一段）。
    // ── 票 `confirm-points-redesign-build/12` · R6：本关方案 `detail` **拆两栏** ──────────────────
    // 口径逐字（`04` `## Answer` §4 ＋ spec §9.2）：「**拆两栏**——页面载荷用全文；给 AI 的那一栏
    // 给指针（「本关方案：`工作区/方案/关卡N-vM.md`」，你刚写的那一版）」。
    // ⚠️ **页面那一栏一个字没动**：`actions/chapters.js` 检出指针样 detail 就把被指文件正文
    // **自动内联**进页面载荷与落盘镜像那条路照旧（`test-collab-backend.mjs` 的「关卡方案内联」
    // 那一格断的就是它，本票不碰它）。改的**只有给 AI 的那一栏**。
    // ⚠️ 路径从 `PROPOSAL_DIR_REL` 拼（⛔ 不在这里手抄 `工作区/方案` 第二个字面量）；
    // 「读它的 `## 完整方案` 一节」那句逐字复用 `decision-record.js` 的 `decisionPointerLines`
    // （甲型）——本节号族的读法与它同源，⛔ 不另造第二份模板。
    // ⚠️ **不印文件名**（`工作区/方案/关卡N-vM.md`）：文件名里的「关卡」是**界面避免词**
    // （本文件上面 `gate-proposal` 那一段的注释写着同一条理由，`test-wording-invariants.mjs` 的
    // 判定线④ 会当场判红）。改印**目录 ＋ 版次**——指得到盘上（那个目录里 `-v<版次>.md` 只有一份），
    // 且与人读面（`第 N 关`）词表一致。
    // ⚠️ 这一关还没提过案（`current === null` 或不是这一关）时**不编一个版次**：只给形状与
    // 有界读法，⛔ 不留一个指不到的路径。
    const gateProposalVersion = current === null || current.gate !== gate ? null : Number(current.version)
    facts.outputs = '方案三段通过 stage-submit（stage=gate）提交：title（一句话标题）/ summary（给用户看的人话摘要，约 300 汉字以内；软目标，机器不验）/ detail。'
      + '**detail 拆两栏**（票 `confirm-points-redesign-build/12`）：'
      + '①**页面载荷用全文**——'
      + (gateProposalVersion === null
        ? '用户只在页面上看方案、不会去文件夹翻'
        : `你刚写的那一版落在 \`${PROPOSAL_DIR_REL}/\` 里的 \`-v${gateProposalVersion}.md\``)
      + '；机器按老办法兜底——检出指针样的 detail 就把被指文件的正文**自动内联**进页面与落盘镜像'
      + '（被指文件**不存在**则**原样放行**，全程**无 reject**、不会因此打回）。'
      + '②**给 AI 的这一栏给指针**——'
      + (gateProposalVersion === null
        ? `本关方案＝\`${PROPOSAL_DIR_REL}/\` 里你写的 \`-v1.md\``
        : `本关方案＝\`${PROPOSAL_DIR_REL}/\` 里**你刚写的那一版**（\`-v${gateProposalVersion}.md\`）`)
      + '；你自己要回看就按一句**有界读法**去读它：**读它的 `## 完整方案` 一节（要快看就先读 `## 摘要`）**'
      + '（逐字模板的单一出处＝ `decision-record.js` 的 `decisionPointerLines`，本行不另写一份）'
      + '——⛔ 别把整份方案再内联一遍进上下文。'
      + '**正式拍板卡的入参来自真实方案，不许出现测试/占位字样**——三段都填了不等于内容是真的（真出过的一次三段全非空、内容全是占位件）；机器逐字段筛测试/占位词表（「测试标题」「测试摘要」「稍后重发」「占位」「TODO」…），命中当场 400 并点名是哪个词、在哪个字段，纪律见 resources/references/anti-patterns.md 的流程级反模式。'
    facts.materials = sources
    facts.methodology = mtl({
      '1': 'references/source-material.md', '2': 'references/patterns/README.md', '3': 'references/file-contracts.md',
    }[String(gate)] ?? 'SKILL.md')
    // 本书自定义模式库一并交给 AI（与内置模式库同等地位）：用户在拍板/驳回「换个风格」时
    // 粘贴的描述会变成自定义模式卡，任何一关（含修订）都要读到它。
    {
      const customPatterns = customPatternsBrief(projectId)
      if (customPatterns !== '') facts.methodology = `${facts.methodology}\n\n${customPatterns}`
    }
    facts.hints = [
      '面向家长/老师，别用黑话；字符串里严禁英文双引号，引用一律用「」。',
      '若 previousDecision 是被驳回的方案，必须认真采纳用户意见再修订，并在摘要里说明采纳了哪些。',
    ]
    return facts
  },
  outline: (ctx) => {
    const facts = {}
    const { meta, projectId, decidedChapters, sources, mtl } = ctx
    // 票 `pipeline-wiring-gaps/12`：任务词写明知识点覆盖闸门（票 07 的同一口径：交办与机器验货
    // 同一套词，AI 与机器都知道交工时验什么）。口径按票 01：title 单键、先规范化、id 不进比对环。
    facts.task = '基于知识地图与材料结构，设计整书章节骨架：每章明确用哪份材料的哪一部分、覆盖哪些知识点（points，来自知识地图——交工时机器会按 title 逐条比对知识地图（比对前先规范化：去尾部括注/trim/全半角）：知识地图里每条知识点都要被某一章的 points 认领，points 里也不许出现知识地图没有的条目，漏了/多了当场 400 并逐条点名）、建议字数（不许静默缺省）、体量依据；并标注建议的最佳范例章（goldChapter+理由：哪章最能代表全书风格/结构最完整/材料最充分）。⚠️ **逐章骨架表在这一站写**（票 `confirm-points-redesign-build/07`：架构那一站只定到架构层、不再写它；本表与**上游拍板**的章数不一致时，机器只记一条非阻断对账读数，不拒收）。'
    // 2026-10-27 维护者裁决（票 `stage3-hard-limits/02`）：「章节：上限不再限制。」
    // 「章数允许只出一章」——章数政策只引用 `domain-rules.CHAPTER_COUNT_POLICY_TEXT` 这一句，
    // ⛔ 不在这里写区间、也⛔ 不新造「建议区间」的软读数（交办、工具说明与交工判据同源）。
    facts.outputs = `chapters 数组通过 stage-submit（stage=outline）提交：[{title,outline(一句话),source:"资料N：小节或主题",targetWords,points:[知识点…],volumeReason(一句依据)}]（${CHAPTER_COUNT_POLICY_TEXT}），外加 goldChapter（1 基章号）与 goldChapterReason（一句理由）。`
      // 票 `confirm-points-redesign-build/03`：**站 6 拍板的章数落进交办件**——它取代了原先
      // 「篇幅档位派生的上限」（三档删除）。⚠️ 这一句是**承诺面**，与 `actions/chapters.js` 里
      // 那条对账读数读的是**同一个数**（`readDecisionChapterCount`）。
      // 没拍过（`工作区/决策/06.json` 不在 / `values.chapters` 没写）时**整句不加**：
      // 上面那句章数政策不是谁的默认值；⛔ 不替用户取一个章数。
      + (decidedChapters === null
        ? ''
        : `本书章节数已由用户在上游那一站拍板：**${decidedChapters} 章**`
          + `（写在工作区/决策/06.json 的 values.chapters）——交工那一刻机器按这一格记一条**非阻断对账读数**，`
          + '多了少了都不拒收；真要改章数，请用户回架构那一站重拍。')
    facts.references = ['工作区/knowledge-map.json（知识地图）', '工作区/explore.md（探查报告）']
    // 票 `confirm-points-redesign-build/07`：站 7（章节安排）**吃站 6 的结论**——上游正文是
    // 方案文档 ⇒ **甲型**指针（读 `## 完整方案` 一节），路径由结论件的 `proposal.file` 读出来拼。
    // ⚠️ 与站 5 那一根同一个模板、同一个读侧（`decision-record.js` 的 `stationPointer`），
    // ⛔ 这里不另写一份说法；指针只给路径与有界读法，⛔ 不替 AI 抄内容。
    {
      const pointer7 = stationPointer(projectId, 7)
      if (pointer7.text !== null) facts.decisionPointer = pointer7.text
    }
    // ── 票 `knowledge-graph-build/09`：交办正文要**认识卡片**、并把「已剔除」讲清楚 ──
    //
    // spec §9 逐字：`outline` 交办读的也是「知识点 − 被剔除的」那**同一份集合**（与覆盖闸门、
    // 与两张确认卡同源）。这里读的是那份集合的**唯一读侧入口**（`workflow/knowledge-map-exclusions.js`），
    // ⛔ 不在这里另写一份「怎么减」。
    // ⚠️ **票 `reader-cognition-boundary-build/07` 起那一套现算抽到一处**（`workflow/reader-boundary.js`）：
    //    读数是 `readReaderBoundary()`、那两句人话是 `readerBoundarySentence()`／
    //    `readerBoundaryStaleSentence()`——**四份逐章派单正文**（「本章不许写什么」）与这一支共用同一份，
    //    ⛔ 不再在这里自己拼（本支只留 `outline` 特有的那半句「它们不在上面那 N 条里」）。
    // ⚠️ **门面与闸门同一条**：只在「有转换完成的源 ＋ 合并件里真有知识点」时加这两句——无源书
    //    本来就没有知识地图，凭空对它说「必须覆盖 0 条」就是把闸门不判的事说成判了。
    // ⚠️ 这两句是**现算的读数**（N／M 逐字来自这一本书的盘），⛔ 不是一句泛泛的提醒：三处读者
    //    报的必须是同一个数（票 09 判据二就是拿这三处的数逐项相等来断的）。
    if (okMaterialNumbers(meta.sources).length > 0) {
      const boundary = readReaderBoundary(projectId)
      if (boundary.available) {
        const kept = boundary.kept
        // ① **认识卡片**：`points` 与图上的卡是同一批东西（卡名 ＝ 知识点 title），「必须覆盖」的
        //    那一批就是「图上的卡 − 人划掉的」。这一句是维护者说的「要协调新出现的卡片和 outline
        //    的提示词」落在这一步的那一半。
        facts.task += ` **认识卡片**：\`工作区/knowledge-map.json\` 里除 \`knowledgePoints\` 外还有一张图`
          + `（\`cards[].key\` ／ \`cards[].name\`）——\`cards[].name\` 就是知识点的 title，两者是同一批东西；`
          + `这一次「必须覆盖」的是图上留下的 ${kept} 条卡。`
        // ② **把「已剔除」讲清楚**：逐条点名（人划掉的那些），并说清它与闸门的关系。
        //    ⚠️ 那一句人话住共用那一处（票 07）；**后半句是 `outline` 特有的**（只有它上面才有
        //    「必须覆盖的那 N 条卡」）⇒ 它留在这里，⛔ 不塞进共用那一处。
        facts.task += ` ${readerBoundarySentence(boundary)}`
        if (boundary.dropped > 0) {
          facts.task += ` —— 它们**不在**上面那 ${kept} 条里，\`points\` 里**不许**出现它们`
            + `（机器交工时按同一份集合比对：漏了/多了当场 400 并逐条点名）；它们仍留在图上、也留在写作面的链上，`
            + `只是这本书不造。`
        }
        // ⚠️ 那一句是**正文**（⛔ 不带外层括号）：括起来这一跳由本调用点给——
        //    收口修正（票 07 面），⛔ 不再从别处靠剥括号拼句；措辞逐字不变。
        const staleSentence = readerBoundaryStaleSentence(boundary)
        if (staleSentence !== '') facts.task += `（${staleSentence}）`
        facts.references = [...facts.references,
          `${KNOWLEDGE_MAP_EXCLUSIONS_REL}（人划掉的那些卡；这本书上没人划过时没有这份件）`]
      }
    }
    // ── 票 `chapter-skeleton/02`：按图排序的**起草建议** ＋ 一条非阻断读数 ──────────────────
    // `outline` 仍是真值源、用户仍可改；这一段只把 `prereq` 算出的先后**交到主笔手上**：
    // ⛔ 不拒收、⛔ 不比章边界、⛔ 不渲染任何章骨架，⛔ 不把「图序」说成「章序」。
    // 图不在（老书／图缺失）⇒ **整段不加**，也不报错（票面判据 1）。
    {
      const orderCollection = readCoverageCollection(projectId)
      const ordered = knowledgeOrderFromCoverage(orderCollection, meta.outline?.chapters ?? null)
      if (ordered !== null) {
        const nameOf = new Map(orderCollection.cards.map((card) => [card.key, card.name ?? card.key]))
        const readings = ordered.readings
        const fields = orderReadingFieldsOf(readings)
        let sentence = ' **按图排序的起草建议**（只按 `prereq` 边算出的先后；⛔ 不是章序、⛔ 不是段边界）：'
        if (ordered.status === 'ok') {
          sentence += `下面这 ${ordered.order.length} 条是按图排出的先后（纯标题，供你起草时参考；`
            + '章怎么分、每章收哪些点仍由你定）：\n'
            + ordered.order.map((key, index) => `${index + 1}. ${nameOf.get(key) ?? key}`).join('\n')
        } else if (ordered.status === 'cycle') {
          sentence += `图里有环（${ordered.cycleMembers.join('、')}），这一次**不按图排序**——`
            + '先按你自己的判断写，机器不改图、也不剪环。'
        } else if (ordered.status === 'empty') {
          sentence += '卡表里没有带非空 `key` 的卡，这一次**不按图排序**——先按你自己的判断写。'
        } else {
          const named = readings.unknownEndpoints.length > 0 ? readings.unknownEndpoints.join('、') : '缺一端的边'
          sentence += `图里有 ${fields.unresolvedPrereq} 条 \`prereq\` 边的端点不在卡表里（${named}），`
            + '这一次**不按图排序**——先按你自己的判断写，机器不改图。'
        }
        const vsGraph = fields.outlineVsGraph === null
          ? 'null（本次是首稿，还没有 outline 可对账）'
          : String(fields.outlineVsGraph)
        const unclaimedEdges = fields.unresolvedPrereq === null ? 'null（本次是首稿，还没有 outline 可对账）' : String(fields.unresolvedPrereq)
        sentence += ` 读数（非阻断，不是判据）：{outlineVsGraph: ${vsGraph}, unresolvedPrereq: ${unclaimedEdges}, `
          + `danglingPrereq: ${fields.danglingPrereq}, isolated: ${fields.isolated}, noInEdge: ${fields.noInEdge}}。`
          + '（outlineVsGraph＝被 outline 次序违反的 `prereq` 边数；unresolvedPrereq＝端点没被任何章认领的 `prereq` 边数；'
          + 'danglingPrereq＝端点不在卡表的 `prereq` 边数；isolated＝没有任何 `prereq` 入/出边的卡；'
          + 'noInEdge＝没有 `prereq` 入边的卡。）'
        facts.task += sentence
      }
    }
    // 票 `knowledge-graph-build/13`：**图的语义那一半**的审校那一路——第一轮结果（探查段交工的
    // 合并件）落盘之后派一路干净上下文回头审它。这一句是它**唯一的调用点**：不写它，第九档在
    // 主笔眼里就是一个不知何时用的档位。成本是一行提示（约 300 字符、只在 outline 段出现一次），
    // 换来的是「一卡一事／容器卡／复述名字／`testable` 判不判得出来」有人看。
    facts.hints = ['图审校（`cards[]` 存在时才派）：`workbench_act(action=agent-assign, dispatchKind=graph-review, note=…)` —— 机器按 resources/references/subagent-prompts/graph-review-prompt.md 代填，并把**两条软读数**（锚区间互相包含／孤岛清单）与**按把握档排的注意力清单**（先复核「待核」，再全量扫一遍）随派单现算给它。它只交**条目级清单**（点名到卡），⛔ 不下「合格／不合格」结论、⛔ 不改卡不加边——清单是第二双眼睛，处置仍归你与用户。']
    facts.materials = sources
    facts.methodology = mtl('references/file-contracts.md')
    const outlineRedo = meta.outlineRedoNote
    if (typeof outlineRedo === 'string' && outlineRedo.trim() !== '') {
      facts.userFeedback = outlineRedo
      facts.hints = [...(facts.hints ?? []), `这是重做：用户上次的意见是「${outlineRedo}」。必须照着改；不清楚就先问，绝不能交一份几乎一样的。`]
    }
    return facts
  },
  gold: (ctx) => {
    const facts = {}
    const { meta, projectId, sources, mtl } = ctx
    const gn = goldN(meta)
    const chapterSource = meta.outline?.chapters?.[gn - 1]?.source ?? ''
    // ⚠️ 局部名**不能叫 `auditName`**：那个名字已经是从 `domain-rules` 进来的出口（同文件上面 import 过），
    // 同名遮蔽会让「这一份路径是谁拼的」在函数里看不出来（票 `context-budget/18` 复核 findings ⑥）。
    const auditRelPath = auditRel(gn)
    facts.chapter = gn
    facts.title = meta.outline?.chapters?.[gn - 1]?.title ?? ''
    // 票 `context-budget/04` · ADR-0030 决策 2：**风格源头从主笔挪到执笔小助手**。
    // 这一段的正文（写作规范 ＋ 范例章）原先由主笔亲笔写 ⇒ 主笔同时是「写的人」和「审的人」，
    // 而且材料正文要过主笔的手（与 ADR-0030 决策 1「材料不搬运」正面矛盾）。
    // 现在主笔是**纯协调者**：派发 ＋ 转达用户意见 ＋ 逐条回权威源核实后汇总裁决（裁决权那一半保留）。
    // ⚠️ 这是**质量模型的变化**、不只是省 token（ADR-0030 后果第一条）：机器层只断接线与形状，
    //    范例章质量与用户意见闭环的手感是真机层（ADR-0005，票 07）。
    facts.task = `协调全书的最佳范例章（第 ${gn} 章，全书基准）。这一段的正文不由你写——风格源头单点在执笔小助手那边，你走四步：①派执笔小助手起草（用 \`workbench_act(action=agent-assign, dispatchKind=gold-writing, note=…)\`：机器按 \`resources/references/subagent-prompts/gold-writing-agent-prompt.md\` 那份派发模板代填必带内容；本章材料小节由它在自己的干净上下文里读）；②**它交稿后先让机器把分片拼成章正文**（workbench_act(action=chapter-assemble, chapter=${gn})）——审计小助手要读的 ${chapterRel(gn)} 就是机器拼出来的那一份；③再派全新上下文的审计小助手（用 \`workbench_act(action=agent-assign, dispatchKind=gold-audit)\`；模板与产出形状照旧，结论照旧过 audit-submit）；④读审计报告，**逐条回权威源核实后汇总裁决**（审计员也会误判，不照单全收）；⑤点名条目与用户意见一并回灌给执笔小助手修订（改完分片要**再让机器拼一次**），最后 stage-submit 交工。这是全书其余章节要模仿的基准，务必高质量、与教材内容一致。`
    facts.targetWords = chapterWordsFloor(meta, gn)
    facts.chapterSource = chapterSource
    // ── 票 `confirm-points-redesign-build/16`：站 8（范例章这一稿行不行）吃**站 7** 的结论 ────────
    // spec §3.2 站 8 的「吃什么」＝站 7 的结论 ＋ 选章值 ＋ 机器工序（`gold-writing` 执笔）的产物
    // ⇒ **乙型**指针（上游正文是 `工作区/outline.md` 那一份**整份文件**，真 JSON、扩展名不是 `.json`），
    // 第三行那个路径由 `决策/07.json` 的 `proposal.file` **读出来拼**（⛔ 不在本函数里再抄一份）。
    // ⚠️ 模板与读侧**一个字都不新造**：`decision-record.js` 的 `stationPointer`（票 01 那一个读侧）。
    // ⚠️ 上游件缺 ⇒ **整块不给**（`pointer.text === null` 时不赋值；⛔ 不给半份指针、也不留一句
    // 指不到的路径）——「件缺时那一跳是 409」那道硬闸不在这一层（见上面 `case 'gate'` 的同一段注释：
    // `buildStageBrief` 被大量判据直调），它落在 `actions/chapters.js` 的派单那一跳。
    // ⚠️ **站 9 不在这里接线**：它在盘上**没有派单件**（`handoff()` 的 stage 枚举里没有站 9——
    // 谈判桌那一屏是一次点击 `gold-target-words-set`），所以它那一格走的是**同一读侧**
    // （`stationPointer(projectId, 9)`，上游＝站 8）；票 16 的 `## Answer` 里逐字记了这一条。
    {
      const pointer8 = stationPointer(projectId, 8)
      if (pointer8.text !== null) facts.decisionPointer = pointer8.text
    }
    facts.outputs = [
      // 票 19：这份契约文本是「审计要查的东西、producer 不许写」那条悬空契约的**生产端**。
      // 票 `context-budget/04` 起它**随 producer 搬到执笔派发模板**（生产端跟着生产端的人走），
      // engine 这一侧只留落盘形状 ＋ 指路；十八项与 `resources/references/subagent-prompts/audit-agent-prompt.md
      // §审计要求`、`audit-and-testing.md §7.0` 两份审计清单**逐项对齐**；差集断言（`test-contract-gap.mjs`）
      // 从两侧**解析**出集合来比，三处都不硬编码第二份清单。解析锚点与截段规则单点在
      // `dev/style-spec-contract-source.mjs`（三条判据共用，别各写一份）。
      // 票 `pre-gold-build/11`（债-06）：下面这句「每项都要有一个同名小节」是**有意的硬标准、
      // 只有承诺**——承诺面一字未删（照 ticket 08 §4 的处置：这一类只加标注、⛔ 不补闸、
      // ⛔ 不写成「已验」），只补一条照实读数。生产方式今天只查 **5 个节标题的子串在场**；
      // 「补到 19 项」那条路本票没走（理由与读数见票面 `## Answer`）。
      // ⚠️ 将来某处真补了闸（票 11／17 可能碰同一处）要回来改这条标注——标注与实现面的强度同进同退。
      `工作区/style-spec.md -- 写作规范（十九项契约，**每项都要有一个同名小节**，逐项打钩）。**十九项的全文与每一项的答法不在这里，在派发模板 \`resources/references/subagent-prompts/gold-writing-agent-prompt.md\` 的「写作规范十九项契约」一节**——照那一节写，别凭印象；「N. **项名**」的编号是给机器解析用的，改成散文这一段的差集判据就空转了。⚠️ 「每项都要有一个同名小节」是**有意的硬标准、只有承诺**：机器交工时只逐字查其中 **5 个节标题的子串在场**（模式选型／板块语法／深度四维承诺／脚手架标题列表／多源同级声明；\`stage-submit\` 的 \`case 'gold'\`），**其余 14 项机器一个字都不读**——别把这一句读成「机器会逐项查」。**逐项差集**那条断言只活在**测试链**（\`test-contract-gap.mjs\` 比的是契约文本与两份审计清单的项名，与「style-spec 里有没有那 19 个同名小节」无关）——按边界③，它**不冒充**这道生产闸门。`,
      // 票 `walkthrough-2026-10/02`：执笔小助手**只落分片**（章正文由机器拼）。这一行是它的产物要求，
      // 而下面那一行是被拼出来的那一份——两份都在清单里，AI 才知道「谁写哪一份」。
      `${chapterShardRel(gn, 1)} —— 第 ${gn} 章正文的**分片**（执笔小助手写这一份；NN＝章号、MM＝第几路，都补两位、从 01 起。一章只派一路就是「-01」；派两路就是「-01」＋「-02」，机器按 MM 升序拼）`,
      `${chapterRel(gn)} —— 第 ${gn} 章全文（按 style-spec，含全部板块与答案；${chapterWordsFloor(meta, gn) === null
        ? '这本书没有设字数兜底，字数不判'
        : `约 ${facts.targetWords} 汉字，是**兜底下限**——低于它会拒收、超过不设上限，宁可多写不可敷衍`}）。**这一份由机器从分片拼**（chapter-assemble），你与小助手都不写它`,
      // 票 `pre-gold-build/11`（债-10）：这句「四层审计 ＋ 试教」同样是**有意的硬标准、只有承诺**
      // ——承诺面一字未删，只补一条照实读数（`src/` 搜 L1–L5 零命中）。补判据那条路本票没走
      // （要 L1–L5 逐层判就得改审计产出的形状与派发模板，出本票射程），理由见票面 `## Answer`。
      // ⚠️ 将来某处真补了闸要回来改这条标注——标注与实现面的强度同进同退。
      `${auditRelPath} —— 审计记录（四层审计 + 试教[条件触发]；**由那份额外派出的审计小助手产出**，严格 JSON：{"passed":true,"issues":[{"level":"错误|警告|提示","status":"open|fixed|accepted-risk","text":"具体问题"}]}；accepted-risk 还要写 reason 与 confirmedBy）。⚠️ 票 \`audit-gate-semantics/01\` 起 \`passed\` 由机器按 issues **现算**（错误/open ⇒ false；警告/open 超过阈值 ⇒ false；提示不阻断），审计员自报 true 不能洗绿。⚠️ 「四层审计 ＋ 试教」**只有承诺**、机器零判据：机器只验 matrix 对 5 个必读文件各正好一行 {file, quote}（quote 逐字）＋ 上面那份 issues 形状与现算 passed（\`checkGoldAudit\`／\`audit-semantics\`，写入侧 audit-submit 与交工侧共用同一份）；**L1–L5 那四层有没有逐层做、试教有没有触发，机器一个字都不读**——这几个词在 \`src/\` 里零命中，界面上也没有（界面词表把「审计」统一成「检查」）。`,
    ]
    facts.materials = sources
    facts.methodology = `${mtl('references/file-contracts.md')}\n\n${mtl('references/audit-and-testing.md')}`
    // 票 workbench-transitions/19③（2026-09-24 裁决补充）：范例章也是写作任务，风格线同样必读。
    // 这一段原先**没有** `references` 字段（`gold` 是新建，不是「加一行」）。
    facts.references = ['工作区/style-line.md（写每一章前必读、逐条落实）']
    // 金标准写作规范：本书自定义模式库一并交给 AI（「模式选型」节须覆盖它们）。
    {
      const customPatterns = customPatternsBrief(projectId)
      if (customPatterns !== '') facts.methodology = `${facts.methodology}\n\n${customPatterns}`
    }
    facts.hints = [
      // 票 04：原来这条要求主笔自己「找到对应材料小节通读，再动笔」——那正是 ADR-0030 决策 1
      // 「材料不搬运」的活体反例。现在 `brief.materials` 只当**路径清单**用：主笔据它 ＋ outline 的
      // source 合成一条定位交给执笔小助手，**材料正文留在执笔小助手的干净上下文里**。
      `材料怎么交给执笔小助手：brief.materials 给的是**路径清单**（文件名／角色／转换后 md 相对路径，纯元数据不是正文搬运），你据它 ＋ outline 里第 ${gn} 章的 source（${chapterSource === '' ? '这一章没填 source，先按 outline 与知识地图对出来' : `「${chapterSource}」`}）合成一句定位——哪份材料的哪个小节——写进派发 prompt；**材料正文由执笔小助手在它自己的干净上下文里读，你不读**（ADR-0030 决策 1「材料不搬运」，rot 护栏：读一次 → 落产物 → 留摘要）。`,
      // 票 `context-budget/18`：执笔那一路的派单改机器代填（dispatchKind=gold-writing）——
      // 上方四步里「派执笔小助手」那一步现在是一次 `agent-assign`。
      '派执笔小助手用 `workbench_act(action=agent-assign, dispatchKind=gold-writing, note=…)`：机器按 gold-writing-agent-prompt.md 模板代填章骨架＋知识点清单／材料定位／风格线／本书自定义模式库／不变量编号 —— 你只给一句叮嘱（那一句就是你的判断出口）。它写 工作区/style-spec.md ＋ **本章分片**（`工作区/分片/chapter-NN-MM.md`，本章就是上面 outputs 里那一片），**章正文与审计文件都不归它**（也不许它先把审计文件写出来占位）。',
      // 票 `walkthrough-2026-10/02`：分片落齐后**先让机器拼**，再派审计——审计读的是拼出来的正文，
      // 而票 22 的新鲜度闸门比的就是它与检查记录的 mtime（晚拼一步，检查记录当场变成「审的是旧稿」）。
      `分片落齐后**先让机器拼章正文**：workbench_act(action=chapter-assemble, chapter=${gn})。审计小助手读的就是拼出来的 ${chapterRel(gn)}；改过分片（含用户意见那一轮修订）要**再拼一次**，否则审计审的是旧稿。交工时机器会再拼一次并验「盘上那份就是这几片分片的拼装件」——**盘上那份若不是机器拼的，交工会被拒收**（机器不覆盖它）。`,
      // 票 context-budget/06（ADR-0030 决策 4）＋ 合并对齐：回灌预算**不留占位符**——
      // 逐类定档已经落定（audit-and-testing.md §九 那张表的「范例章执笔回执」＝≤1K token），
      // 这里只点那一档与出处，不重述形状（与 chapters / final 两支同口径）。
      '回灌有预算：执笔小助手的完工回执 ≤1K token（形状与逐类一档表的单一事实源是 audit-and-testing.md §九「回灌三件套」，派发时按 gold-writing-agent-prompt.md 那份填）——超了就只留指针、细目去 工作区/style-spec.md 与章稿里看，不许把正文或逐条证据抄回回报。',
      '稿子回来后**不要自己充审计**：按 `resources/references/subagent-prompts/gold-audit-prompt.md` 派全新上下文的审计小助手（必读文档矩阵+一致性核对，产出含 matrix 的 audit 文件），读报告、判决后才交工。',
      `审计结论落盘后，先交给机器过一遍形状：workbench_act（action=audit-submit）当场验 ${auditRelPath} 的 matrix（5 个必读文件各一行 {file, quote}、quote 逐字；不带内容就读书里那份，也可带 auditJson 正文由机器落盘）。不合格会当场把机器看到的行键、样例与缺口说清——别等 stage-submit 那一刻才知道。`,
      '派小助手/审计小助手时提醒：文件操作用文件工具（read/write/edit/glob/grep），别用 shell（工具纪律见 audit-and-testing.md §九，跨平台一致）。',
      '要小助手继续跑：优先 send_message 唤醒原来那个执笔小助手（忘了是谁就用 list_agents 按「章号 ＋ 角色」的 label 召回），召不回才新派——与逐章写作段既有先例同形。',
      `写完用 stage-submit（stage=gold）交工；机器验三份文件都在且非空。`,
    ]
    // 修订时：把用户的金标准意见（意见单 + 合并后的交办）透出给 AI，由它转达给执笔小助手。
    const goldActive = (meta.goldOpinions ?? []).filter((o) => o.status === 'pending' || o.status === 'sent')
    const goldRedo = meta.goldRedoNote
    if (goldActive.length > 0 || typeof goldRedo === 'string') {
      facts.goldOpinions = goldActive.map((o) => ({ kind: o.kind, wish: o.wish, target: o.target }))
      const note = typeof goldRedo === 'string' && goldRedo !== '' ? goldRedo : goldActive.map((o, i) => `#${i + 1} ${o.wish}`).join('；')
      facts.userFeedback = note
      facts.hints = [
        ...(facts.hints ?? []),
        ...(meta.goldRedoNote != null && meta.goldRedoNote.includes('整版重写')
          ? // 整版重写本就「不参考旧稿」：唤醒原来那个等于让它背着旧稿重来，这一轮**直接新派**
            // 一个执笔小助手按派发模板从头起草，再走一遍审计（唤醒策略与普通修订轮不同形，理由在此）。
            [`这是整版重写：${meta.goldRedoNote} 不参考旧稿（已归档）——**直接新派一个执笔小助手**按派发模板从头起草（这一轮不唤醒原来那个，唤醒了它就是背着旧稿重写），审完再交工。`]
          : [`这是修订：用户的意见是「${note}」。**逐条转达给执笔小助手去改**（仍优先 send_message 唤醒原来那个，召不回才新派），正文不由你亲手改；改完自查一遍再交工。`]),
        '交工后用户会在工作台「边读边标记」确认；每条意见都会在定稿时沉淀进风格线，全书写都要遵守。',
      ]
    }
    return facts
  },
  chapters: (ctx) => {
    const facts = {}
    const { meta, projectId, sources, mtl } = ctx
    const chapters = meta.outline?.chapters ?? []
    const remaining = chapters
      .map((chapter, index) => ({ n: index + 1, ...chapter }))
      .filter((chapter) => !chapterDone(projectId, chapter.n))
    facts.task = `写完整本：对每一章走四步——派小助手写（用 \`workbench_act(action=agent-assign, dispatchKind=writing, chapter=N, shard=MM)\`：机器按 writing-agent-prompt.md 模板代填大纲/材料小节/写作规范/范例章路径，你只给章号、分片号与一句叮嘱；**它只落分片** \`工作区/分片/chapter-NN-MM.md\`，一路一个号，章正文不归它）→ **让机器把分片拼成章正文**（workbench_act(action=chapter-assemble, chapter=N)——审计要读的 \`工作区/chapter-NN.md\` 就是拼出来的那一份，改过分片要再拼一次）→ **调一次编排脚本审这一章**（宿主 \`workflow\` 工具，**一次运行只审一章**：脚本自己派一个干净上下文的审计小助手，**审计员自己落盘 \`工作区/audit-NN.md\`** 的严格 JSON，机器按章验货读的就是它；**你不再从它的回报转写**——脚本把 \`{chapter, passed, auditPath}\` 结构化带回）→ 机器按章验货（**按 issues 现算**：错误/open 或警告/open 超阈值即拒；审计员自报的 passed 不采信）。**remaining 里还没写的各章可并行派多个写作小助手**（每章一个、干净上下文、各写各的分片），各自完成后逐个交工验货。你不逐章复核；只有该章有用户抽查意见时，才需要你亲自核对修订结果。`
    facts.total = chapters.length
    facts.remaining = remaining.map((chapter) => ({
      n: chapter.n, title: chapter.title ?? '', outline: chapter.outline ?? '',
      source: chapter.source ?? '', targetWords: chapter.targetWords ?? meta.targetWords,
      points: chapter.points ?? [],
    }))
    facts.references = [
      '工作区/style-spec.md（写作规范）',
      // 票 workbench-transitions/19③：风格线原先只有 persona 一条 + `工作区/style-line.md` 镜像，
      // 逐章交办里没有它——界面那句「AI 写每一章都会照着办」于是不兑现。这里把它补进必读清单。
      '工作区/style-line.md（写每一章前必读、逐条落实）',
      '范例章（见 brief）',
      '工作区/outline.md（章节骨架）',
      // 票 `chapter-audit-orchestration/03`：审计那一跳改由编排脚本驱动 ⇒ 两件进必读清单。
      // 两处路径都从上面的常量派生（不在这里手抄第二个字面量）。
      `resources/${AUDIT_TEMPLATE_REL}（章级审计派发模板：脚本里那份派发正文照它逐项填）`,
      `resources/${CHAPTER_AUDIT_SCRIPT_REL}（编排脚本骨架与调用形状：一次运行只审一章）`,
    ]
    // F39（2026-08-20 走查）：段落级抽查意见也透出给 AI（整章意见带 comment，段落意见合成人话；已撤回的跳过）。
    // 票 09：**必须带 id**——没有 id，主笔 AI 交工时无从点名（handledReviews 按 id 销号）。
    facts.pendingReviews = (meta.pendingReviews ?? []).filter((r) => r.status !== 'revoked').map((r) => ({ id: r.id, chapter: r.chapter, comment: paragraphReviewText(r) }))
    facts.methodology = `${mtl('references/audit-and-testing.md')}\n${mtl('references/file-contracts.md')}\n${mtl('references/subagent-prompts/writing-agent-prompt.md')}\n${mtl(AUDIT_TEMPLATE_REL)}\n${mtl(CHAPTER_AUDIT_SCRIPT_REL)}`
    facts.hints = [
      CHAPTER_PROGRESS_REQUIREMENT,
      // 票 03 · P34：上面那条只说了 stage 有哪些取值，没说**什么时候**必须报——实测 9.4 小时里
      // 「还剩 39 步」一字未变、▶ 指着 10 小时前就写完的第 1 章，因为 AI 一次都没带过
      // chapter/stage（契约有、转发有、按章落账有、界面也接上了，只有上报这一格是空的）。
      '逐章阶段上报：每章走「写 → 审 → 复核」时，**每次状态变化**都用 workbench_act(action=progress) 把 chapter=N 与 stage 一起报上（stage 的取值见上一条）——派出去写时报 writing、检查时报 auditing、检查完报 audited、你要复核报 finalizing、这一章交工完报 done。只有文字、没有 chapter 与 stage 的 progress 落在步清单上什么也看不出来。',
      // 票 `walkthrough-2026-10/02`（走查 A10 的裁决）：**换协议**，不是「加一把锁」。
      // 病：「拆两半派」时两个执笔小助手写**同一个** `工作区/chapter-08.md`——零互斥、零合并，
      // 谁后落盘谁说了算（后半段那位报「已落盘、前半段未改动一字」的时间早于前半段报「已落盘 455 行」）。
      // 换协议之后**每一路落自己的分片**，章正文由机器按分片号拼——两个写者结构上碰不到同一个文件。
      // ⛔ 旧句「各章独立文件（chapter-NN.md / audit-NN.md），绝不共享工作区写同一文件」随本票退役：
      // 那句话当年就是**唯一的载体**（`src/**` 里没有任何机器判据断它），而它管不住子助手手里的写工具。
      '并行纪律：remaining 各章可并行派多个写作小助手，**并发不得超过 brief.maxConcurrentSubagents**（用户可拧的旋钮，没拧时是默认值；低内存/老机器从 2 起）；每章一个写作小助手、**各写各的分片文件**（`工作区/分片/chapter-NN-MM.md`：NN＝章号、MM＝第几路，都补两位、从 01 起，一路一个号——**同一章拆两半派就是 01 ＋ 02，谁也不碰别人的分片**；章正文 `工作区/chapter-NN.md` 由机器按 MM 升序拼，谁都不直接写它）；分片落齐后**先让机器拼章正文**（chapter-assemble）再派审计，改过分片要再拼一次；各章各自完成后逐个交工验货（ordered-commit：慢章压住快章属预期，不必等齐）。宿主不支持并行 spawn 时小助手自动排队，退化为逐章串行，行为与现状等价。',
      // 票 `chapter-audit-orchestration/03`：审计那一跳改由宿主的 `workflow`（编排脚本）驱动。
      // 三条杠杆与骨架同源——脚本形状住 resources/…（references 清单里也点了一次），这里只点
      // 「什么时候用、边界在哪」，不重述脚本正文（重述就是会漂的第二份）。
      `审计那一跳用编排脚本（宿主 \`workflow\` 工具，骨架与调用形状见 resources/${CHAPTER_AUDIT_SCRIPT_REL}）：**一次运行只审一章**——要审哪一章就把它放进 args 单开一次运行，别把 remaining 里剩下的章塞进同一次运行。`,
      '审不过就停：编排脚本**不自行派修复、也不重试**——它把 `{chapter, passed, auditPath}`（章号、结论、报告落点）原样带回；要修就由你按点名条目**另派一个干净上下文的成员**去改该章，改完重新走一遍审计与机器验货。',
      '脚本里不许再嵌 `workflow`：脚本成员继承模式里的**全部**工具集，引擎也不传深度限制——递归扇出是真实风险。⚠️ 这一条**只有纪律、机器不强制**（宿主没有按工具名的白/黑名单，可用的机制只有「挂不挂」）。',
      '派小助手/审计小助手时提醒：文件操作用文件工具（read/write/edit/glob/grep），别用 shell（工具纪律见 audit-and-testing.md §九，跨平台一致）。',
      // 票 `context-budget/18`：**派单正文改机器代填**——模板覆盖的那几类派单不再由主笔手抄，
      // 走 `workbench_act(action=agent-assign, …)`：主笔只给档位 ＋ 号 ＋ 一句叮嘱，
      // 机器按那档的派发模板与这一段 brief 的实际值拼好整份 prompt（那 74K/本 的入参因此不再进
      // 主笔上下文——`tool/call` 的入参宿主一个字都不剪）。模板没覆盖的派单（改章小助手那类）
      // 仍用主笔自己的 `subagent` 工具派。
      // ⚠️ 这一档的参数名是 **`dispatchKind`**，不是 `kind`：`kind` 已被 `gold-opinion` 占了
      //（意见类型 dislike|drop|change），一个参数名两个意思正是本票 `(a)` 要治的病（复核 findings ⑦）。
      '派单怎么发：**九份派发模板 ＋ 最后检查分查那一档覆盖的那几类**（`workbench_act(action=agent-assign, dispatchKind=…)` 取 writing／gold-writing／audit／gold-audit／material-survey／close-reading／alignment／graph-review／cross-audit／final-check 之一）**由机器按模板代填整份 prompt**——你只给档位 ＋ 章号（或材料号／分路号）＋ 一句叮嘱，别再手抄模板；模板没覆盖的派单（改章小助手那类）仍用你的 subagent 工具派。提醒小助手材料小节与产出文件的准确路径（都在 dir 下）。',
      // ⚠️ `dispatchKind=audit` 今天**没有活跃调用点**：铺章那一跳的章审计由编排脚本驱动
      //（脚本骨架自己按 audit-agent-prompt.md 填，见上面那条 `workflow` 工具的路子）——
      // 这一档是「脚本跑不了／要直派一个重审小助手」时的口子，别当成日常那一跳。
      '章级审计（dispatchKind=audit）今天正常走编排脚本那一跳（脚本自己派审计小助手、自己落盘 audit-NN.md）；只有脚本那条路走不了、或你确实要直派一个全新的重审小助手时才用 `agent-assign` 直派——两条路落盘点都是 工作区/audit-NN.md。',
      '每交一章前先 workbench_status 查有没有新抽查意见，有就先处理（修订 → 重新审计 → 机器验货）再继续；该章意见未处置机器会拒收。',
      '写完整本途中的引导杠杆：来了用户意见/风格线变化 → 先 send_message 转达给正在写那一章的小助手（别等整章写完再打回），并落一行 progress；小助手跑完没交齐 → 优先用 send_message 唤醒原来那个小助手（忘了是谁就用 list_agents 按「章号 + 角色」的 label 召回），不用重派。细则见 audit-and-testing.md §十一。',
      // 票 11 · P30＋P42：焦点区主卡逐字显示最近一条 progress（顶部横幅只出状态词那半截，
      // 见 audit-and-testing.md §11.5②），所以「只在开工时发一条」等于对外宣称一件
      // 已经结束的事；而要用户拍板的那类决定记进 progress，机器侧就无从知道有**一个问题悬着**。
      '进度保鲜与拍板通道：每个小助手回来、每交工一章时，**必须补一条 progress**，写那段时间里真的在做的事（派了几路、在写哪几章、哪几章检查完了、下一路是谁）；上一次落账到这一次之间一个章的时长都没补，工作台上挂的就是旧闻。要用户拍板、选一条路、授权一次改动，走 intervene，不要记进 progress（它是留给用户回话的悬案通道，工作台据此把闸门按钮亮出来）。留痕不许因为加了保鲜就被稀释——该落的引导那一行一次都不能少，细则见 audit-and-testing.md §十一。机器在最后检查**只报数**（最后一条进度记录落在多久前、此后又交工了几章），它不拦交工——够不够勤由人看，这一条是纪律、不是机器闸门。',
      '处置过的抽查意见要在交工时报出：stage-submit（stage=chapters）带 handledReviews:[{id, how}]——id 取 pendingReviews 里那一条，how 是一句人话（这条我怎么改的）。机器**只给点名的**置为已处置，没点名的继续拦；一条都不点名就交工会被 400 打回。',
      // 票 walkthrough-2026-10/06 现象二（2026-10-05 走查 BUG-4①）：主卡把 progress 的 detail **原样**
      // 上屏，而走查那一屏的自述写着「你已点继续」——屏上根本没有那个按钮。规则正文在 §11.5（进度保鲜那一半）。
      '进度行只叙述已发生的事实的界线：progress 那一行会**原样**出现在主卡上给用户读，所以它只说已经发生过的事（盘上写了、账上记了、小助手回来了）；不许承诺还没发生的事，也不许引用一个界面上没有的动作（走查那一屏写着「你已点继续」、而屏上只有「⏸ 暂停」）。别替用户记动作。细则见 audit-and-testing.md §11.5。机器今天只挡**最薄的那一层形状（词形）**：出现「你已…」这类替用户记动作、或「下一步／我会」这类承诺句，服务端当场拒收并点名；**没命中不等于合规**——这句话是不是真发生过仍归你自查与用户。',
      '机器按章验货：每章都要有 工作区/chapter-NN.md 和 audit-NN.md；读审计 JSON 的 issues（每条必须写 status=open|fixed|accepted-risk，accepted-risk 还要写 reason/confirmedBy），由机器**现算** passed——错误/open 或警告/open 超阈值即拒，审计员自报的 passed 不采信（不是只看文件存在）。',
      // 票 brief-word-limits/01（2026-10-27 票 `word-budget-ineffective/02` 改口）：把「字」的口径与「兜底下限、不是上限」**一次说清**（主笔 AI 自报进度
      // 那行自由文本只能靠交办说明/persona 传口径，服务端改不了它的措辞）。
      '体量口径：remaining[].targetWords 的「字」一律按**汉字**计（数字/字母/标点/空白都不计），它是**字数兜底下限**——低于它交工会被拒收，达到或超过都放行、**不设上限**（超了不提示错，多写不扣分）。没填兜底的老账本不判字数。自报 progress 时也按这个口径说。',
      // 票 02 · P19：要用户拍板的选择由宿主 `ask_user_question` 提问卡渲染（工作台零实现），
      // 它逐字显示每个选项的说明——**预告只能写在选项说明里**，写成别的位置等于没写。
      // 措辞沿用工作台「✍️ 定点修改这一步」那段既有的影响预告（`src/ui/phase-page.js`），不另起一份格式。
      '要用户拍板时先把影响预告给出来：凡是你要在几个选项里请用户选、而选哪条会牵动已经写好或已经拍板的内容（例如全书体量、章节结构、范例章写法），**每个选项的说明都要各带一句影响预告**，照「影响预告：这一步改了，这些要一起重做：…」那个形状说人话——按现在已写 N 章、累计多少汉字说清：选它要重写哪几章、最终落在多少汉字。三条路各有各的代价（实测里最忠于用户当初拍板的那条恰好最贵），不许等用户点完再在正文里补一句「我倾向」。',
      // 票 `context-budget/18`：写作那一路的派单也改机器代填（dispatchKind=writing）——上面那一行
      // 要带的东西仍由模板规定，但**填模板的人是机器**，主笔只给章号＋一句叮嘱。
      '派写作小助手用 `workbench_act(action=agent-assign, dispatchKind=writing, chapter=N, shard=MM, note=…)`：机器按 writing-agent-prompt.md 模板代填本章骨架／知识点清单／材料定位／范例章路径／写作规范；必须带的东西仍以那份模板为准（本章知识点清单 remaining[].points、本章在知识链中的位置与跨章引用指向、范例章路径与写作规范），**你不再手抄模板**。',
      '跨章引用纪律：前向引用只到大纲承诺粒度（「第 N 章会展开」），禁止编造未写章节的具体数字/结论/例题；审计小助手按 audit-agent-prompt.md 派，要求其扫跨章引用存在性（含前向承诺失配）。',
      // 票 context-budget/06（ADR-0030 决策 4）：回灌预算从交办说明这一层点一次名——形状与逐类
      // 一档表的唯一出处是 audit-and-testing.md §九「回灌三件套」，这里只点两档与出处，不重述形状。
      // N 是 AI 侧软目标（机器不查**回复长度**这类软目标，CONTEXT.md「机器检查契约原则」），真合没合规归真机层。
      '回灌有预算：写作小助手的完工回执 ≤1K token、章审计报告 ≤2K token（形状与逐类一档表的单一事实源是 audit-and-testing.md §九「回灌三件套」，派发时按 writing-agent-prompt.md / audit-agent-prompt.md 填）——超了就只留指针、细目去落盘件里看，不许把正文或逐条证据抄回回报。',
    ]
    // 票 28 / 走查 P46：每次领任务都把**主 AI 上下文占用**一并告诉主笔 AI，
    // 好让它知道自己该收尾了。读不到（宿主投影缺席 / 未绑定读数口）就**整句不追加**——
    // 绝不写 0%、绝不编一个百分比。落点在这一层（brief.hints），不改方法论文档、
    // 不动 progress 事件语义、不新增 workbench_act 动作名与账本事件类型。
    {
      const occupancyLine = contextOccupancyBriefLine(meta.session)
      if (occupancyLine !== null) facts.hints.push(occupancyLine)
    }
    return facts
  },
  merge: (ctx) => {
    const facts = {}
    const { meta, sources, mtl } = ctx
    // 票 `.scratch/context-budget/issues/05` · ADR-0030 决策 2（改派第一刀 · merge 段）。
    //
    // **病根是分工，不是措辞**：改之前这一支要求主笔「通读全部章节 + outline +
    // knowledge-map」，而实测（session-98d830e6）merge 窗口 **+0 token**——一个章都没读，
    // 凭协调记忆写出了 2,780 字符的 audit-cross.md，机器只验「文件存在且非空」就放行。
    // 交办文本与「材料不搬运」的诊断正面矛盾，实测的解法就是静默不做。
    // 所以这一支改成**协调者形态**：派审计小助手 → 收报告 → 按点名条目派修复小助手 →
    // 汇总裁决追加进 audit-cross.md → 写前言 → 交工。**主笔不碰章正文。**
    //
    // ⚠️ 五项核对的**判定词与判定口径只住在派发模板**（`references/subagent-prompts/
    // cross-audit-prompt.md` 的「五项核对判定表」，机器的验货判据也从那儿解析）。
    // 这里与方法论文档、拒收文案、人设一律只**引**它——各写一份就是四份会漂的平行清单。
    const mergeTemplatePath = `resources/${CROSS_AUDIT_TEMPLATE_REL}`
    facts.task = `合并前先**派跨章审计小助手**做跨章审计（派发模板：${mergeTemplatePath}，五项判定词与判定口径只住在那一份里，别处不另抄）：**派发那一刻你手里不许有任何一章正文**，它从零读全部章 + outline + knowledge-map + style-spec 逐项核对，**报告人自落** 工作区/audit-cross.md（机器逐项验那五项都有交代才放行合并）。你只收它的报告：按它**条目级点名**的那几条**逐条派修复小助手**去改（你不碰章正文），再把「哪几条要改、哪几条判为误判」的汇总裁决**追加**进 audit-cross.md（小 edit，别整份重写）。然后写这本书的前言/使用说明（约 300 汉字，通俗；软目标，机器不验字数），随 stage-submit（stage=merge, preface=...）交工；机器会 100% 保真拼装各章成书（不删节）。`
    // 章路径清单（票面「派发接线」）：**纯路径元数据**，不带正文——形状先例＝chapters 的
    // `brief.remaining`。路径逐字取自 `chapterRel`（章节正文路径的单一出处，见 `src/domain-rules.js`）。
    const mergeChapters = meta.outline?.chapters ?? []
    facts.auditScope = {
      template: mergeTemplatePath,
      chapters: mergeChapters.map((_chapter, index) => chapterRel(index + 1)),
      constraints: [...CROSS_AUDIT_CONSTRAINTS],
      report: CROSS_AUDIT_REPORT_REL,
    }
    facts.references = ['交工后工作台会生成 工作区/book.md（机器拼装成品）']
    // 挂载关系照旧（票 05 口径）：这一支仍挂 `references/audit-and-testing.md`，
    // 但**取法**用票 02 合并后的形态——`mtl(...)`（事件注入表已接管分阶段尾节，`mtlWithTail` 退役）。
    facts.methodology = mtl('references/audit-and-testing.md')
    facts.outputs = ['维护 工作区/progress.md（每章一行：写完/审计/验货）', `工作区/audit-cross.md —— 合并前跨章审计结论，由审计小助手自落（机器逐项验五项核对都有交代才放行）`]
    facts.hints = [
      '前言写给"拿到这本书的人"：这本书讲什么、怎么用（给 AI 老师上课还是人直接读）。',
      `audit-cross.md 是硬门槛：没落盘、或那五项核对有一项没交代，机器都会 400 拒收并点名缺哪一项，别只交前言。五项判定词与判定口径见 ${mergeTemplatePath}。`,
      '派审计小助手时把 auditScope 里的路径逐条给它（全部章 + 三份约束件 + 落盘路径），报告人自落——**你不转写那份报告**，那正是「全文回流 + 主笔转写」的搬运。',
      // 票 `context-budget/18`：跨章审计那一路的派单改机器代填（dispatchKind=cross-audit）——
      // 章清单／报告落点／五项判定词都在模板那儿，机器照它拼，主笔只给一句叮嘱。
      '派这一路用 `workbench_act(action=agent-assign, dispatchKind=cross-audit, note=…)`：机器按 cross-audit-prompt.md 模板代填全部章清单、三份约束件与报告落点（工作区/audit-cross.md），五项判定词与判定口径只住在那一份模板里。',
      '改法一律派修复小助手：只改它点名的那几条，不通读全书、不顺手重写别的章；改完把新发现的点名追加进 audit-cross.md。',
      '重跑优先 `send_message` 唤醒原来那个跨章审计小助手（`list_agents` 按「跨章审计」label 召回），召不回才新派——重读一遍全书很贵。',
    ]
    return facts
  },
  final: (ctx) => {
    const facts = {}
    const { meta, projectId, sources, mtl } = ctx
    // 票 walkthrough-fixes/32 · ADR-0027：终检改派 5 个小助手分查。**协调员不读正文**（§6.1 硬约束）——
    // 终检是全书体量最大、上下文余量最小的那个时点，让它亲自通读 book.md 等于把最贵的读放在最没余量的地方。
    // 三层归属在这条字符串里必须自洽：协调员**不读正文** / **仍能改点名的条目** / **styleCheck 逐条交代由分报告做**。
    facts.task = `最后检查**分头查，不要自己通读**（口径见 audit-and-testing.md §十「派 5 个小助手分查」那一节）：按那一节派 5 个上下文干净的小助手分查 工作区/book.md，各查各负责的范围（finalScopes 逐路写明了每一路的范围与**它自己该落的那一份报告**，派发时照表填），**派发那一刻你手里一章正文都不许有**，只收 5 份报告。五份**报告人自落**：每一路的小助手把「结论（通过／不通过）＋条目级点名＋落盘路径」写进它自己那一份（finalScopes[].report），**你不转写那份报告**——转写就是「全文回流 + 主笔搬运」，那正是这一层分派要治的病。五份各自出结论，**点名要到条目级**（「第 3 章有问题」不算点名，要指到具体哪一处）。**五份结论不合并、也不互相替代**：机器只拼一份**派生的条目并集**（finalSummary 那一件，只有条目、**它不出通过/不通过**——裁决仍在你手上）；每一份自己的结论与证据仍在它那份原文里，你要核就按汇总件各节「来源」那行去读对应那一份。你**只做汇总裁决**，不逐条回正文复核（核实是写那份报告的助手自己的活）；按点名的那几条**直接改**——只改点名的条目，不通读全书、不顺手重写别的章。⚠️ **改的是章正文，不是成品**：派修复小助手改它负责那几章的分片（工作区/分片/chapter-NN-MM.md，一路一个号），改完叫 workbench_act(action=chapter-assemble, chapter=N) 让机器重拼章正文——机器会**同一次把成品 工作区/book.md 按各章重拼**；⛔ 别自己手改 book.md（它是各章正文的拼装件，每次改章都会被机器重拼回去，手改的那份会被覆盖）。改完把五份结论汇成一份自查报告（人话）随 stage-submit（stage=final, report=...）交工。${REPORT_WORDING_RULE}**风格线逐条交代由五份分报告各自做、你不读正文所以不做**：交工时要对**每一条**生效中的风格线（workbench_status 的 styleNotes 里 status 为 active 的那些）都有交代——把五份报告里各自交代的去向合并成一份 styleCheck:[{id, status, note?, chapter?}] 随交工一起交：adopted＝已落实（写清落实在哪章）、conflict＝与哪一章冲突（note 必写一句冲突理由）、superseded＝已不再适用；漏一条机器会拒收（哪一路没交代就唤醒那一路补，别自己凭印象编）。**每条 adopted／conflict 的去向还得在某一份分报告里留下原文为据**（那一路把这条风格线的原文逐字写进它那份报告；找不到出处的机器会拒收——⛔ 别自己凭印象编一条顶上）。**分报告本身的内容形状机器逐条核**：每条问题一行「- 」＋严重度记号（P0／P1／P2）＋「文件：… 章：… 位置：… 原文：…」四个字段（派单正文 §10.b 里有原样例子）——派单时叮嘱那 5 路照它写，交工前先自己看一眼五份是不是都带齐了。机器硬检查会兜底（乱码/章节数/该有的板块/不该用的词/章名全书唯一/无重复标题，判据来自已拍板的 style-spec/outline；**章名唯一性读大纲的章名，同一章里重名的小节才算重复——每章都有的同名板块（板位）不拦，只在自查报告里说明**）；全过后你在工作台等用户「认可」才算交付。机器还会**逐份点名**缺哪一份分报告——缺了就唤醒那一路补，不许自己凭印象写一份顶上（那正是「自发件不是契约件」）。`
    facts.counts = { chapters: (meta.outline?.chapters ?? []).length, sources: (meta.sources ?? []).length }
    // 票 11：五份分报告的**落点表**（范围 ＋ 逐份路径）——形状先例＝ merge 那一支的 `brief.auditScope`。
    // 路径逐字取自 `finalAuditReportRel`（落盘路径的单一出处，见 `src/domain-rules.js`），
    // 这里与方法论文档、派发模板、拒收文案一律只**引**它——各写一份就是四份会漂的清单。
    facts.finalScopes = FINAL_AUDIT_SCOPES.map(({ n, scope }) => ({ n, scope, report: finalAuditReportRel(n) }))
    // 票 `context-budget/12`：五份齐了之后**机器拼一份派生的条目并集**给协调员读（它不合并结论、
    // 不替代各自结论，也不出裁决）。形状先例＝ merge 的 `brief.auditScope`：一张表，逐字来自
    // `domain-rules`（路径单一持有）。
    // ⚠️ 票 `depth-round-3/08`：**拼装写盘**（`refreshFinalAuditSummary`）从这一支挪到
    // `actions/chapters.js` 的 `stage-brief` 调用方——本函数（读函数）只读它拼好的那一份。
    // 交办说明仍是协调员**读到汇总件的唯一入口**，所以调用方必须在领任务那一刻先拼。
    const finalSummary = readFinalAuditSummary(projectId)
    facts.finalSummary = finalSummary === null
      ? { path: finalAuditSummaryRel(), ready: false, chars: null, unionSize: 0, items: [] }
      : { path: finalSummary.path, ready: true, chars: finalSummary.chars, unionSize: finalSummary.unionSize, items: finalSummary.items }
    facts.methodology = `${mtl('references/delivery-checklist.md')}\n\n${mtl('references/audit-and-testing.md')}`
    facts.outputs = [
      '维护 工作区/progress.md（每章一行：写完/审计/验货）',
      ...FINAL_AUDIT_SCOPES.map(({ n, scope }) => `${finalAuditReportRel(n)} —— 最后检查第 ${n} 路分报告（${scope}）：由那一路的小助手自落，协调员不转写`),
    ]
    // 这一句随五份齐不齐改写（读不到就不出现那半句——与「上下文占用」那句同一纪律）：
    // 齐了 ⇒ 汇总件已在盘上，**读它**；没齐 ⇒ 说清为什么没有，别让协调员去找一个不存在的文件。
    const finalSummaryHint = finalSummary === null
      ? `五份还没齐 ⇒ 机器拼不出那份条目并集（${finalAuditSummaryRel()} 还不在盘上）；五份齐了再领一次任务就能读到，别自己凭印象写一份顶上。`
      : `机器已把五份的**条目并集**拼在 ${finalAuditSummaryRel()}（${finalSummary.unionSize} 条，同一条只出现一次、不丢不重）：**读它**、按点到的条目改就够了，不用把五份全文都搬进上下文。它**只列条目、不出结论**——每份自己的结论与证据在它那份原文里。`
    // 票 32 · ADR-0027 决策 4：上下文余量**解绑**进终检——分派把书摘下去了，但五份报告回流、
    // 汇总、改点名条目仍在协调员身上，余量仍然是它该盯的数（读不到读数就整句不出现，同铺章那一族）。
    facts.hints = ['派完这 5 路之后别断线：五份齐了才进下一步；某一路超载就拆范围（或唤醒原助手补），别硬扛。',
      // 票 `context-budget/18`：终检那 5 路的派单也走机器代填（dispatchKind=final-check）——
      // 形状出处是 `audit-and-testing.md` §十「终检分查」那一节，机器照它拼，主笔只给分路号＋叮嘱。
      '派这 5 路用 `workbench_act(action=agent-assign, dispatchKind=final-check, scope=N, note=…)`：机器按 audit-and-testing.md §十「派 5 个小助手分查」那一节代填每一路的范围与它自己那份报告的落点（finalScopes 里逐份写明了）——你不再手抄派单正文。',
      '五份报告只信「条目级点名」的那几条——点名不到具体位置的打回重做。', `五份报告的预算与落点：每份最终回复 ≤2K token，收「结论＋条目级点名＋落盘路径」（口径与逐类一档表见 audit-and-testing.md §九「回灌三件套」）——**五份各自落盘**（finalScopes 里逐份写明了路径，由写它的那一路自己落，**你不转写**）；压不进 2K 就按 §10.g 拆范围，或点名不到条目级时打回重做，不许靠把正文贴上来兜（那等于把分派省下的工作量原样搬回你身上）。`, finalSummaryHint]
    {
      const occupancyLine = contextOccupancyBriefLine(meta.session)
      if (occupancyLine !== null) facts.hints.push(occupancyLine)
    }
    // 终检被用户驳回后的修订意见（final-approve approved=false → 原地循环）。
    // 意见在 stage-submit final 通过时才销号（2026-08-27 grill 修订）：领任务改纯读、无副作用，
    // AI 重领任务/机器打回后重领都仍带意见；「重做意见只对本轮生效」语义不变（与 exploreRedoNote/goldRedoNote 同构）。
    //
    // 票 `walkthrough-fixes/37`：驳回意见从此**不许整段糊过去**——主笔要先把那句意见拆成条目落账
    // （`final-redo-items`），重新交工时带 `redoCheck` 逐条交代去向。这一段的两个分支就是那两件事：
    // 还没拆 ⇒ 明确要它先拆（并把「每段必须是原文的连续一段」说清）；拆了 ⇒ 把条目逐条摊给它看。
    // ⚠️ 这里只**说形状**，不在这里重写判据：判据住 `src/workflow/final-redo.js`（拆条与对齐各一段）。
    if (meta.finalRedoNote != null) {
      facts.userFeedback = meta.finalRedoNote
      const redoItems = Array.isArray(meta.finalRedoItems) ? meta.finalRedoItems : []
      if (redoItems.length > 0) {
        facts.redoItems = redoItems.map((item) => ({ index: item.index, quote: item.quote }))
      }
      const splitLine = redoItems.length > 0
        ? `这句意见已经拆成 ${redoItems.length} 条（见 redoItems）：${redoItems.map((item) => `第 ${item.index} 条「${item.quote}」`).join('；')}。`
        : '**先把这句意见拆成条目落账**：workbench_act(action=final-redo-items, redoItems=[…])——每一条是这句意见原文里的**连续一段**（照原句逐字抄，别改写、别编；顺序按原文先后）；漏项或编造的条目机器会拒收。'
      // ⚠️ 合并裁决（票 36 × 票 37）：改法那半句取**票 36 的口径**（改章正文、机器重拼成品，
      // ⛔ 别手改 book.md），逐条交代那半句取票 37 的新契约——两边都要，不是二选一。
      facts.hints = [...(facts.hints ?? []), `这是最后检查的修订：用户对整本书的意见是「${meta.finalRedoNote}」。${splitLine}按意见改整本（**改的是章正文**：派修复小助手改分片 → workbench_act(action=chapter-assemble, chapter=N) 让机器重拼章正文，机器会顺带把成品 工作区/book.md 按各章重拼；⛔ 别手改 book.md）——仍按 §十「派 5 个小助手分查」那一节的分工：优先**唤醒原来那 5 路**去查改动处，够不着的再派新的干净上下文助手；改完五份齐了再汇总交工，不要自己通读全书。**交工时除了 report 还要带 redoCheck:[{item, status, note?, where?}]，对每一条交代去向**（done＝办了、not-done＝没办 ＋ 一句原因、superseded＝已不适用）：漏一条机器会拒收。`]
    }
    return facts
  },
})

/** 按阶段取 facts（表里没有的 stage 走 default 那一句）。 */
function stageFactsOf(stage, meta, ctx) {
  const build = STAGE_FACTS[stage]
  if (build !== undefined) return build(ctx)
  return { task: '（这个阶段的说明还没有补齐，先按状态机提示与用户确认该做什么。）' }
}

/**
 * **第一段 interface**（票 `depth-round-3/08`）：该阶段**自己的那几个键**——按阶段判别收窄
 * （公共七个键 ＋ `STAGE_FACTS` 那一格声明的键；⛔ 不把别的阶段那几个也带上）。
 *
 * ⚠️ `meta` 必须是 `readMeta(projectId)` 的返回：`meta.id` 就是书夹 id，本函数按它读盘。
 * ⚠️ **纯读**：⛔ 不写盘（拼装写盘那一跳在 `actions/chapters.js` 的 `stage-brief` 调用方）。
 * ⚠️ `stage` 取**第一入参**、不回读 `meta.pendingStage`——`buildStageBrief` 传的是同一个值，
 *    而判据可以拿一本 stage=gate 的书逐阶段调它（那正是「按阶段收窄」那一格的做法）。
 */
function briefFacts(stage, meta) {
  const projectId = meta?.id ?? null
  const ctx = stageBriefContext(projectId, meta, stage)
  return { ...commonBriefFacts(projectId, meta, stage, ctx), ...stageFactsOf(stage, meta, ctx) }
}

/** 给主 AI 的阶段任务说明（stage-brief 返回；全部中文、人话）。 */
function buildStageBrief(projectId) {
  const meta = readMeta(projectId)
  const stage = meta?.pendingStage ?? null
  if (stage === null) return null
  const ctx = stageBriefContext(projectId, meta, stage)
  const brief = { ...commonBriefFacts(projectId, meta, stage, ctx), ...stageFactsOf(stage, meta, ctx) }
  // 票 22：不变量底线只对裁决里那四个阶段/关卡追加（explore / 关卡② / 关卡③ / chapters）。
  attachInvariants(brief, stage, ctx)
  // 票 `confirm-points-redesign-build/13`（spec §5.5 E1）：包地图那一行**每一份交办件都挂**
  // （它是一行 pointer、不是正文）。⛔ 不挂在阶段分支里：那样「哪几个阶段能看到索引」又会分家。
  ctx.mtl('package-map.md')
  // 票 `walkthrough-fixes/19`②：那个旋钮那一行**收在这里一处**加给每一份交办件
  // （⛔ 不在七个阶段各写一遍：那样「旋钮改了、纪律那一行没跟上」就会静默漂）。
  brief.hints = [
    ...(brief.hints ?? []),
    concurrencyDisciplineLine(ctx.maxConcurrentSubagents),
  ]
  // 票 02：注入件集合＝清单里 `disclose` 命中的切片 ＋ 一页纸常驻 ＋ 状态迁移→节 ＋ 指针兜底
  //（**在 attachInvariants 之后**：不变量按 route 选节是票 22 的口径，它的位置与本三层无关）。
  brief.methodology = mountMethodology(
    brief.methodology ?? '',
    meta,
    { gateRejected: ctx.gateDecision !== null && ctx.gateDecision.status === 'rejected' },
    stepStageState(projectId, meta),
    ctx.methodologyDocs,
    ctx.sectionMismatch,
  )
  // 票 02 第 1 层 · 这一步的几行登记（用户故事 13／19）：**注入件集合＝清单里 `disclose` 命中的切片**。
  // 随 brief 交出去的是结构化事实（路径 ＋ 角色 ＋ 它自己那一档 `disclose`），
  // `test-tool-discipline.mjs` 拿它与 `manifestRowsFor()` 对账，而不用反解 `engine.js` 源码。
  brief.registry = registryRowsFor(ctx.methodologyDocs)
  // 票 02 实现决策 11：**派发面也走同一张表**——给「该读的登记行 ＋ 该产出的登记行」，
  // 不再靠派发措辞（实测：explore 交办原文「要求详细摘录」让三份报告全文回灌，而同一机制
  // 另一本书三个精读全落盘——同一个机制、两本书两种表现，全凭自觉）。
  brief.dispatch = dispatchRegistryFor(stage, meta, ctx.methodologyDocs)
  // ── 票 `confirm-points-redesign-build/13`（spec §5.5 E2）：**书夹现算投影** ──────────────────
  // 「这本书此刻有哪些目录、每个目录管什么」是**随流程变**的事实 ⇒ 机器**现算**成一份投影
  // （⛔ 不落新件、⛔ 不改书夹 README「每次注入」那一档；理由见 `bookDirIndex()` 的注记）。
  // 它同时把四族登记行**合并**进来（outputs／references／materials／registry），
  // 于是「这本书里有什么」只有一处说法，不再散在四个字段里各查一遍。
  brief.bookDirs = bookDirIndex({ dirs: bookDirsOnDisk(projectId), rows: bookRegistrationRows(brief) })
  // 派发那一半的**交办原文**：把两组登记行写进 hints，让主笔照它原样带给小助手
  // （九份派发模板里的「登记表口径」那一节说的是同一件事——派发时随活一起给它）。
  if (SUBAGENT_DISPATCH_STAGES.has(stage)) {
    const half = (rows, head) => (rows.length === 0 ? `${head}：这一步没有` : `${head}：${rows.map((r) => `${r.path}（${r.role}）`).join('、')}`)
    // ⚠️ 那两行路径是**包内相对路径**，而真正按它们去读的是**小助手**——所以根目录要随活一起发下去。
    // 不发根，小助手拿到 `resources/…` 就等于拿到一个没有基准的相对路径（票 `methodology-root-pointer/01`）。
    brief.hints = [...(brief.hints ?? []), `派小助手时按派发模板的「登记表口径」随活把那两行清单原样给它——**边界以那两行为准，不靠你的措辞**：${half(brief.dispatch.read, '你该读的登记行')}；${half(brief.dispatch.produce, '你该产出的登记行')}。**一并把方法论根目录（本机绝对路径）也给它**：${RESOURCES_DIR}——上面那些 resources/… 路径都相对它拼，小助手那边才读得到（只发相对路径＝它也得去搜盘）。`]
  }
  // 深改注入的重做意见：只交给被改段的那个阶段。
  if (meta.deepRedoNote != null) {
    // ⚠️ 票 `depth-review-2026-10/13`：**键集从 `domain-rules.js` 的 `ACT_STAGES` 派生**（engine 只消费
    // 成员关系，不复制第二份清单）；值各自映射，而 7 项里**只有 `gate` 的段 key 不是它自己**
    // （要带关卡号，而那一格已由上一行的特判持有）——所以其余各格＝恒等映射，不另立一张值表
    // （值表会把 7 个阶段名再手写一遍，正是本票要消掉的东西）。
    const segOfStage = Object.fromEntries(ACT_STAGES.map((stage) => [stage, stage]))
    const mySeg = stage === 'gate' ? `gate-${ctx.gate}` : segOfStage[stage] ?? null
    // 先快照再消费：首个分支会 delete meta.deepRedoNote，后续分支不能再用它判段。
    const redo = meta.deepRedoNote
    if (mySeg !== null && redo.segment === mySeg) {
      brief.userFeedback = redo.note
      brief.hints = [...(brief.hints ?? []), `这是定点修改后的重做：用户这次的要求是「${redo.note}」。必须照着改；产物从零重做（旧版已留档）。`]
      updateMeta(projectId, (state) => { delete state.deepRedoNote })
    }
    if (mySeg !== null && redo.segment.startsWith('chapter-') && stage === 'chapters') {
      brief.userFeedback = redo.note
      brief.hints = [...(brief.hints ?? []), `定点修改后的重做：用户要求「${redo.note}」，从第 ${redo.segment.slice(8)} 章起重做。`]
      updateMeta(projectId, (state) => { delete state.deepRedoNote })
    }
  }
  const pendingIv = (meta.pendingInterventions ?? []).filter((i) => i.status === 'pending')
  if (pendingIv.length > 0) {
    brief.pendingInterventions = pendingIv.map((i) => ({ text: i.text, target: i.target ?? null, at: i.at }))
    brief.hints = [...(brief.hints ?? []), `有 ${pendingIv.length} 条用户留言要先处理（见 pendingInterventions），处理完用 workbench_act(action=intervene-done, id=...) 逐条销号，再继续手头的活。`]
  }
  // 票 22：随 brief 交出「这一份挂了哪些共用方法论文档」（去重后保序）——
  // 这是把「哪份文档该出现在哪个 brief」变成**可测事实**的那一步，不是给人看的新负担。
  brief.methodologyDocs = [...new Set(ctx.methodologyDocs)]
  return brief
}

/** POST /textbook/action 动作分发 */
// ─────────────────────────────────────────────────────────────────────────────
// 动作族 dispatch 表（架构候选 4 · ADR-0003 第二刀）：40 个顶层 case 按 9 个动作族
// 归组为 handler + action→handler 映射表；同文件 banner 分区、不拆物理文件。
// HTTP 层仍是唯一 external seam；族 handler 不对测试导出——现有 mkReq/mkRes fakes
// 即第二个 adapter。族边界 = 未来共享 domain module 的候选挂载点（见议题 01 协调注记）。
// ─────────────────────────────────────────────────────────────────────────────

/** 该关卡**盘上真实存在**的全部版次（`工作区/方案/关卡N-vM.md`，按版次升序）。
 *  判据＝磁盘实况——与 workbench-transitions/23 同一条（不是"最新"、更不是写死的 v1）。
 *  定点修改的归档名单照这条判据走才不会把修订件留在原地（dead-gates/18：留下就会被下一轮同名版次覆盖）。 */
function proposalFilesOnDisk(projectId, gate) {
  let names = []
  try { names = readdirSync(proposalDir(projectId)) } catch { return [] }
  const re = new RegExp(`^关卡${gate}-v(\\d+)\\.md$`)
  return names
    .map((name) => { const m = re.exec(name); return m === null ? null : { rel: `${PROPOSAL_DIR_REL}/${name}`, version: Number(m[1]) } })
    .filter((entry) => entry !== null)
    .sort((a, b) => a.version - b.version)
    .map((entry) => entry.rel)
}


/** 段 -> 深改影响：下游段 keys + 会被归档的产物（相对路径）。上游产物一律保留（GLM 审查 B）。 */
function deepAffected(projectId, meta, segKey) {
  const chapters = meta?.outline?.chapters ?? []
  const gn = goldN(meta)
  // ⚠️ 这里的 `files` 是**书夹相对路径**（归档按它逐件 rename）⇒ 正文那一项取 `chapterRel`、
  // 审计记录那一项取 `auditRel`（都是 `domain-rules` 的出口，票 `context-budget/18` 收口前
  // 这里手拼了一份 —— 「一族的路径只有一个出口」）。
  // ⚠️ 下面 `outlineDown` 里的 `chapter-${i + 1}` 是**段 key**、不补零、也不是路径——**不要**动它。
  //
  // ⚠️ **票 `walkthrough-2026-10/02`：这一章盘上真有的分片也要登记**（扫盘，不凭请求体）。
  // 分片是章正文的**输入**（机器按它拼）：定点修改到本章／金标准段时只归档正文、把分片留在原地，
  // 重做那一路写的若是**另一片**，机器就会把旧内容拼回正文里——旧稿回来了，而账上什么都没说。
  // 这与票 11 给「细目／报告」两族补登记是同一条教训（`archived` 是撤销回移的唯一依据）。
  const chapterFiles = (n) => [chapterRel(n), auditRel(n), ...chapterShardRelsOnDisk(projectId, n)]
  const allChapters = chapters.flatMap((_, i) => chapterFiles(i + 1))
  const goldFiles = ['工作区/style-spec.md', ...chapterFiles(gn)]
  const bookFiles = ['工作区/book.md', '工作区/preface.md']
  // ⚠️ 票 11：细目与报告是**目录族**，份数随材料数／固定五份变，写死清单装不下——
  // 所以这里登**实际盘上有的那一族每一件**（枚举形状与 `deepAffected` 别处的 `proposalFilesOnDisk`
  // 同款：扫盘、按声明形状过滤，不凭请求体）。**不登记的后果**：定点修改到 explore／final 段时，
  // `deep-modify.js` 的 `movable` 只认 `affected.files`，新目录里的件既搬不走、撤销时也回不来——
  // 而那份 `过程/存档/deep/<id>.json` 里的 `archived` 就是撤销回移的唯一依据（它会静默少登记）。
  const okReadingNumbers = okMaterialNumbers(meta.sources)
  const detailFiles = okReadingNumbers
    .map((n) => readingRel(n))
    .filter((rel) => existsSync(join(projectDir(projectId), ...rel.split('/'))))
  const reportFiles = [...FINAL_AUDIT_SCOPES.map(({ n }) => finalAuditReportRel(n)), finalAuditSummaryRel()]
    .filter((rel) => existsSync(join(projectDir(projectId), ...rel.split('/'))))
  const gates = [1, 2, 3]
  const proposals = (from) => gates.filter((g) => g >= from).flatMap((g) => proposalFilesOnDisk(projectId, g))
  // 票 `confirm-points-redesign-build/09`（spec §4.4 第 2 条）：**被打回的段其结论文档也跟着归档**
  // ——「账本说没拍过、`工作区/决策/NN.json` 却还在原地」是收口 review 那条「拦」点名的那种两处真相。
  // 枚举面（哪一段波及哪些站）**只此一处**：`decision-record.js` 的 `segmentDecisionRels`。
  // ⚠️ `chapter-N` 那一档要带范例章号：重做的正是范例章时，它＝重做 `gold` 那一段（站 8／9 作废）。
  const decisions = segmentDecisionRels(segKey, gn)
  const outlineDown = ['outline', 'gold', ...chapters.map((_, i) => `chapter-${i + 1}`), 'chapters-review', 'merge', 'final']
  switch (segKey) {
    case 'explore':
      return { downstream: ['explore', 'gate-1', 'gate-2', 'gate-3', ...outlineDown],
        files: ['工作区/explore.md', '工作区/knowledge-map.json', ...detailFiles, ...proposals(1), '工作区/outline.md', ...goldFiles, ...allChapters, ...bookFiles, ...decisions],
        reset: 'explore' }
    case 'gate-1': case 'gate-2': case 'gate-3': {
      const n = Number(segKey.slice(5))
      // ⚠️ 票 09（spec §9.2 的 `deepAffected` 三处内容①）：三关是**一条链**、不是并列兄弟
      // （站 5 吃站 4、站 6 吃站 5）⇒ 重做第 N 关，**后面的关**也在下游名单里。
      // 从前这里只列 `[segKey, ...outlineDown]`，于是第 1 关的下游里看不见第 2／3 关
      // ——归档／清状态／截账本三步那三处**早已兑现**，只有上屏这一栏漏（承诺面 ＜ 实现面）。
      return { downstream: [...gates.filter((g) => g >= n).map((g) => `gate-${g}`), ...outlineDown],
        files: [...proposals(n), '工作区/outline.md', ...goldFiles, ...allChapters, ...bookFiles, ...decisions],
        reset: 'gate' }
    }
    case 'outline':
      return { downstream: outlineDown, files: ['工作区/outline.md', ...goldFiles, ...allChapters, ...bookFiles, ...decisions], reset: 'outline' }
    case 'gold':
      return { downstream: ['gold', ...chapters.map((_, i) => `chapter-${i + 1}`), 'chapters-review', 'merge', 'final'],
        files: [...goldFiles, ...chapters.flatMap((_, i) => (i + 1 === gn ? [] : chapterFiles(i + 1))), ...bookFiles, ...decisions],
        reset: 'gold' }
    case 'merge':
      return { downstream: ['merge', 'final'], files: [...bookFiles, ...reportFiles, ...decisions], reset: 'merge' }
    case 'final':
      // ⚠️ 票 11：终检这一段的 `files` 原本是**空的**（那时还没有任何终检产物）。
      // 五份分报告落盘之后它不再是空的——不然定点修改到终检段时那些报告既不搬走、也回不来。
      return { downstream: ['final'], files: [...reportFiles, ...decisions], reset: 'final' }
    default: {
      const m = /^chapter-(\d+)$/.exec(segKey)
      if (m === null) return null
      const n = Number(m[1])
      return { downstream: [segKey, 'chapters-review', 'merge', 'final'],
        files: [...chapterFiles(n), ...bookFiles, ...decisions], reset: 'chapter' }
    }
  }
}


/** 段工作的首事件序号（事件截断点）：找不到返回 null（不截断，仅归档+重置）。 */
function deepStartSeq(projectId, segKey) {
  const events = readEvents(projectId)
  const m = /^chapter-(\d+)$/.exec(segKey)
  for (let i = 0; i < events.length; i += 1) {
    const e = events[i]
    if (segKey === 'explore' && e.type === 'textbook/phase-start' && e.data?.phase === 2) return e.seq
    if (segKey === 'explore' && e.type === 'textbook/stage-start' && e.data?.stage === 'explore') return e.seq
    if (/^gate-\d$/.test(segKey) && e.type === 'textbook/gate-proposal' && e.data?.gate === segKey.slice(5)) return e.seq
    if (/^gate-\d$/.test(segKey) && e.type === 'textbook/stage-start' && e.data?.stage === 'gate' && String(e.data?.gate) === segKey.slice(5)) return e.seq
    if (segKey === 'outline' && e.type === 'textbook/stage-start' && e.data?.stage === 'outline') return e.seq
    if (segKey === 'gold' && (e.type === 'textbook/stage-start' && e.data?.stage === 'gold')) return e.seq
    if (m !== null && /agent-start|agent-end|progress|review/.test(e.type)
      && String(e.data?.label ?? e.data?.text ?? '').includes(`第${m[1]}章`)) return e.seq
  }
  return null
}


/**
 * 票 13（spec 第 7 条 / 不变量 5「账本与 meta 同源」）：**账本被截断时同步意见集合**。
 *
 * 深改把时间线截断到该段起点之后，被删掉的 `textbook/review` 事件对应的意见必须从 `meta.pendingReviews`
 * 里一起去掉——否则会留下**孤儿意见**：界面点进去一条账本里已经没有对应事件的意见，而且它还会永远拦人
 * （按章交工只拦 `pending`，孤儿意见没人能销号）。
 *
 * 判据：意见 `r` 保留 ⇔ 截断后仍有一条 `textbook/review` 与它对应：
 *  - 带 id 的新账本（票 09 起）：`reviewId` 或 `id` 相等即对应（**同一章的新意见不会顶替旧意见**）；
 *  - 缺 id 的老意见：退化成「同章 ＋ 意见原文相等」。
 *
 * **上游章的意见不许被误删**：只有该章自己的 review 事件被截断、且没有别的对应事件时才移除——
 * 别的章一个都不碰。
 */
function syncPendingReviewsAfterTruncate(meta, events) {
  const reviews = meta?.pendingReviews
  if (!Array.isArray(reviews) || reviews.length === 0) return 0
  const reviewEvents = events.filter((e) => e.type === 'textbook/review')
  const kept = reviews.filter((r) => reviewEvents.some((e) => {
    const eventId = typeof e.data?.reviewId === 'string' ? e.data.reviewId : e.data?.id
    if (typeof eventId === 'string' && eventId !== '') return eventId === r?.id
    return e.data?.chapter === r?.chapter && String(e.data?.comment ?? '') === String(r?.comment ?? '')
  }))
  const dropped = reviews.length - kept.length
  meta.pendingReviews = kept
  return dropped
}

export {
  PROJECT_ID_RE,
  assertSessionOwned,
  goldN,
  paragraphOpinion,
  paragraphReviewText,
  WAIVER_ITEMS,
  PHASE_LABELS,
  GATE_LABELS,
  STAGE_LABELS,
  stageLabel,
  // 这三个随 labels 簇一起搬走（票 depth-review-2026-10/10）。前两个是「这条路走完了」的人读
  // 提示，第三个是「写作规范里哪几项不许写」的硬约束——**都不是界面词的副本**：
  // `test-wording-invariants.mjs` 与 `test-contract-gap.mjs` 按名从 engine 取它们。
  EXPLORE_DONE_HINT,
  // 票 `confirm-points-redesign-build/05`：站 3 那一个停点的人读提示（同一个状态值下**第二个**
  // 停点的那句话）——与上面那一句同一族，随 labels 簇一起搬走。
  STATION_GOALS_DONE_HINT,
  // 票 `confirm-points-redesign-build/09`：站 0／1「只提示人」那一句（spec §4.5 的两处例外之一）
  // ——三个写点（`book-set-goal`／`source-remove`／上传）引**同一份**措辞。
  STATION_VALUE_EDIT_HINT,
  FINAL_CHECK_DONE_HINT,
  REPORT_WORDING_RULE,
  dshHome,
  projectsRoot,
  registryPath,
  readRegistry,
  writeRegistry,
  registerProject,
  sessionWorkspace,
  sanitizeFolderName,
  freeBookDir,
  projectDir,
  timelinePath,
  metaPath,
  processLogPath,
  logEntryText,
  // 票 `dsh-contract-drift/09`：提问没记上那一句的**唯一措辞出处**（本文件 `logEntryText`
  // 与 `src/workflow.js` 的 `handleQuestion` 两处共用，⛔ 不在调用点手抄第二份）。
  questionUnrecordedText,
  readMeta,
  flushMeta,
  // ⚠️ writeMeta / metaCache / metaDirty / metaFlushHandle **刻意不导出**（ADR-0016 决策 2）。
  // ⚠️ 边界在拆子模块后**不再是「engine 之外」**，而是「**store 子模块之外，且持有 appendEvent
  // 的那个模块之外**」——appendEvent 是账高与最后动静时刻的唯一写入者，它至今仍住在 engine.js，
  // 必须够得着底层写入口。测试按**名字搜出**那个模块，不手写清单；appendEvent 日后搬进
  // engine/ledger.js 时这条判据不用改。
  //   两半都要占：store.js **导出** writeMeta（engine.js 要 import 它），而 engine 的**导出面**
  //   **不列**它——`test-ledger-seq-integrity.mjs` 的 `key in engine` 正是钉这一条。
  // 四个写入入口＝updateMeta（读→改→写）、createMeta（建档）、
  // appendEvent（记一笔：账高与最后动静时刻的唯一写入者）、rollbackLedger（合法回退的账本重写）。
  // 防回潮断言见 test-ledger-seq-integrity.mjs。
  updateMeta,
  createMeta,
  rollbackLedger,
  waived,
  // 票 `walkthrough-fixes/23`：`other` 放行的唯一读取口（点名到那一条检查）。理由与「全仓只许走这里」
  // 写在它自己的注释里——`chapters.js` 的单章验货要用它，所以必须出得来。
  otherWaiverFor,
  // 票 `kn-unowned-silent/02`：逐点豁免的读取口——把一组点按「点名放弃的」与「没点名的」分开
  // （三处覆盖判据 ＋ 单章上限共用）。⛔ 调用点不许自己 `filter` 一遍：那会长出第二份
  // 「怎么算被点名」；判据本体住 `domain-rules.splitWaivedPoints`（界面读同一份）。
  splitWaivedPoints,
  announceText,
  gateRejectedAnnounce,
  // 票 `demo-channel-full/24`：章节安排驳回那一族的三句（播报 ＋ hint ＋ 状态行）——两取值、
  // 唯一出口；`actions/gates.js` 的 `outline-confirm` 要用 hint 那一个，所以必须出得来。
  outlineRejectedAnnounce,
  outlineRedoHint,
  outlineReadyHint,
  // 票 `demo-channel-full/26`（清仓）：这一族残余句子的引擎侧出口（两取值、唯一出口）。
  // `actions/gates.js` 要用探查驳回／终检不满意那三个，`actions/gold.js` 要用范例章那两个，
  // 所以都得出来；判据直调生产出口（⛔ 测试里不手抄第二份措辞）。
  exploreRedoHint,
  finalRejectNeedsNote,
  finalRejectedHint,
  goldReviseHint,
  goldRewriteAnnounce,
  announceToSession,
  noticeMessage,
  appendEvent,
  appendHumanActionEvent,
  readEvents,
  listProjects,
  removeTree,
  // 票 `depth-review-2026-10/04`：归档这一族（「驳回→重做」那条链的判据）从 `actions/gates.js`
  // 上移到本文件。`archiveWorkArtifacts` 是六条路径共用的那一个原语，`trimArchive` ＋
  // `ARCHIVE_KEEP` 是它每次都跑的保留策略（同一个家：判据与策略不许分住两处）。
  archiveWorkArtifacts,
  trimArchive,
  ARCHIVE_KEEP,
  // 票 `confirm-points-redesign-build/09`：书夹内归档改名**这一处**——深改（`深改-<id>/`）与
  // 回退（`回退-<seq>/`）两条路共用（spec §4.4 第 1／2 条同一条规则）。`actions/deep-modify.js` 用它。
  archiveBookFiles,
  // 票 `confirm-points-redesign-build/08`：范例章旧稿清单与「现在是第几稿」的唯一出处。
  // ⚠️ 它们与 `archiveWorkArtifacts` 同一个家（判据与策略不许分住两处），但**不列在这里**
  // ——两处都是 `export function` 直接导出的，再列一次就是 duplicate export（实撞过一次）。
  trashProject,
  snapshotsDir,
  writeSnapshot,
  restoreSnapshot,
  foldGate,
  workDir,
  // 票 `context-budget/11`：细目目录与报告目录**同样只经 `./engine/paths.js` 解析**，
  // 再从这里再导出给动作层——动作层要的是「绝对路径 + 越界守卫已在那一层」，
  // 而 brief／文案要的**书夹相对**形状归 `domain-rules` 的 `readingRel`／`finalAuditReportRel`。
  // ⚠️ 这两个目录下的件**不在工作区根**，所以 `workFile(project, name)` 对它们无效（那会拼成
  // `工作区/<name>`）；要绝对路径一律 `join(detailDir(project), <基名>)`。
  detailDir,
  reportDir,
  // 票 `context-budget/13` 改名：四个旧段名逐字落地成 `工作区/`／`工作区/方案/`／`过程/存档/`／
  // `材料/转换稿/`（旧名的逐字清单见 ADR-0031 的「改名补记」与票 13 落地记录），
  // 解析函数同样只此一份、从这里再导出。
  // ⚠️ `deep-modify` 那一族原先**手写**了 `join(projectDir(p), <存档段名>, 'deep')`（两处），
  // 那正是「定义点之外的第二份」的典型——不改就会把深改存档写到旧目录、撤销时找不到那份存档。
  proposalDir,
  processDir,
  archiveDir,
  materialDir,
  convertedDir,
  // 老书读侧兜底（票 `context-budget/13` 的取舍已被维护者推翻，见 `.scratch` 票面第 3 节的改写）：
  // ① `bookRelOnDisk` ＝「规范形状 → 盘上真落点」，读通道与交办说明的指针都要它
  //    （`brief.references` 逐字写的是规范形状，而老书盘上是老名那一份）；
  // ② `legacyDirConflicts` ＝「两套名同时存在」的逐条点名——**新名优先的那一半不许静默**。
  bookRelOnDisk,
  legacyDirConflicts,
  workFile,
  writeWork,
  customPatternsDir,
  listCustomPatterns,
  updateStyleLineMirror,
  sealGoldStandard,
  sourcesDir,
  runners,
  gateWaiters,
  wakeMainAI,
  handoff,
  handoffAndDrive,
  chapterArtifacts,
  chapterWordReading,
  chapterDone,
  chapterHasSubmitEvent,
  chapterGateMiss,
  bindAnnounce,
  bindContextOccupancy,
  contextOccupancyBriefLine,
  disposeParent,
  getParent,
  projectRuntime,
  writeProposalDoc,
  proposeGate,
  proposeRevision,
  proposalFilesOnDisk,
  advance,
  resolveGateDecision,
  isRunning,
  runPhase1,
  runPhase2,
  countRejections,
  countProposals,
  gateApproved,
  runGate,
  runPhase3,
  runPhase5,
  scanScaffolding,
  stripLoaderRegion,
  specFingerprint,
  noteStyleSpecChange,
  parseStyleSpecList,
  styleSpecDeclaresNoExercises,
  runQualityChecks,
  recordAgentError,
  runLoop,
  kick,
  buildStageBrief,
  // 票 `depth-round-3/08`：交办件的**两段 interface**——① 按阶段收窄的事实（`briefFacts(stage, meta)`，
  // 该阶段只出自己那几个键）；② 方法论挂载（`mountMethodology`）。⛔ `stage → facts` 那张表
  // （`STAGE_FACTS`）是 implementation 的内部组织，**不导出**。
  briefFacts,
  mountMethodology,
  deepAffected,
  deepStartSeq,
  syncPendingReviewsAfterTruncate,
}
