/**
 * 派单正文的**机器代填**（票 `.scratch/context-budget/issues/18` · ADR-0030 决策 4 的延续）。
 *
 * ## 它做什么／不做什么（这一段就是本模块的边界，别在别处另写一句）
 *
 * - **做**：把「九份派发模板 ＋ 终检那一节方法论文档」当**形状的唯一出处**读进来，把模板里的
 *   `{{占位符}}` 按本书的实际值填掉，再在前面挂一节**机器代填的本书实际值**（章号／标题／目标字数／
 *   本章知识点清单／落盘路径／该读与该产出的登记行／主笔的一句叮嘱）。填好的整份 prompt 直接交给
 *   子代理——主笔的入参从此降到「哪一档 ＋ 章号（或材料号／分路号）＋ 一句叮嘱」。
 * - **不做**：**不产判断**（叮嘱那一行是主笔的原话，机器一个字符不改），**不抄第二份骨架**
 *   （模板正文逐字进 prompt；本模块里没有一句模板的散文），**不落盘、不发子代理**（那两件归动作层）。
 *
 * ## 病与先例
 *
 * 实测（`.scratch/context-budget/evidence/ctx-audit-live-*.json`）：主笔把整份派单自己写进 `subagent`
 * 工具入参，两本书分别 **74,041 字符（8.06%）／73,930 字符（4.84%）**，24／32 次；宿主剪枝器
 * `pruneSession()` 只遍历 `tool/result`，`tool/call` 入参**一个字都不剪**（单条 2–5.7K 全在 8192
 * 阈值之下）⇒ 这一栏是**整场永久占位**。而它是**搬运不是判断**：模板自己就写着
 * 「填好的 dispatch ＝ 模板 ＋ 实际值」。
 *
 * 先例是票 `context-budget/12` 的 `final-audit-summary.js` 与票 `17` 的 `knowledge-map-assembly.js`：
 * 纯函数、同输入同输出、判据与拼装**共用同一段**（不另写一份「相似的量法」）。
 *
 * ## 这一层只断接线与形状（判据声称的强度＝实现强度）
 *
 * {@link judgeDispatchPrompt} 断的是「这份 prompt 是不是那份模板 ＋ 那批值的确定函数」：
 * 模板里必须有的锚一个不少、占位符一个不剩、值块在里面且只有一份、本章的值逐字在内。
 * 它**不证**子代理拿到之后产出的质量（真机层，ADR-0005），也不证「主笔真读了回灌」。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）
 *
 * ① **锚（`anchors`）是逐字的字符串表**：它只能证明「这些句子还在模板里」，证明不了「模板没有
 *    在别处被悄悄改弱」——判据强度＝「这几段在场」。
 * ② **能填的值只有 `dispatchValues()` 列出的那几样**：模板里新增一个机器不认识的占位符 ⇒
 *    {@link assembleDispatchPrompt} 响着失败（不静默给半份骨架），不会自动变出一个值来。
 * ②b **逐章那四档还多一样必填的当值**（票 `reader-cognition-boundary-build/07` 的 `boundary`：
 *    读者边界那一份现算读数，见 `reader-boundary.js` 的 `BOUNDARY_DISPATCH_KINDS`）——它与
 *    `graphInputs`／`edgeLedger` 同一条纪律（读盘在调用方、缺了响着失败），**不在**模板的占位符里：
 *    它渲染进值块那一格「本章不许写什么」。
 * ②c **「这一档要哪几位读盘结果」有一处声明**（票 `depth-round-3/06`）：`DISPATCH_SPECS[kind].inputs`
 *    ——动作层按它读盘、`dispatchValues()` 按它点名（缺了当场抛）。⚠️ 我是从**声明面**导出的判据：
 *    若某档在别处**又**读了一样声明里没有的值，这里看不出来（`AGENTS.md` 票 `dev-gate-scan/17`）。
 * ②d **写作面两档另要 `coverage`**（票 `exclusion-flow/02`）：唯一读侧入口 `readCoverageCollection()`
 *    的 `live`／`effective` 当值传进来，用来把「本章知识点清单」派生成「本书要写的」那一份。
 *    派生只走 `domain-rules.effectiveChapterPoints`（⛔ 本模块不写第二套减法）。
 * ③ **`final-check` 的形状出处是方法论文档的一节**（`### 终检分查`），不是独立模板文件——
 *    口径依据是 `audit-and-testing.md §九` 那张逐类一档表自己把「终检分查」的派发模板写成
 *    「本文件 §10.b」（该表六行里唯一一行没有独立文件的）。
 */
import {
  MATERIAL_JUDGMENT_REL,
  MATERIAL_SURVEY_HEAD_CHARS,
  SPEC_ROWS,
  auditRel,
  chapterRel,
  chapterShardRel,
  chapterWordsFloor,
  effectiveChapterPoints,
  goldChapterNo,
  knowledgeShardRel,
  okMaterialShards,
  productFamilyPath,
  readingRel,
  READER_QUESTIONNAIRE_INTENT_REL,
  READER_QUESTIONNAIRE_RETURNED_REL,
  READER_QUESTIONNAIRE_TEXT_REL,
  READER_QUESTIONNAIRE_VERDICT_REL,
} from '../domain-rules.js'
// 票 `knowledge-graph-build/13`：知识点图审校那一档的值块里有一段**机器现算的注意力清单**
// （两条软读数 ＋ 把握档排序）——渲染只住一处（`knowledge-graph-review.js`），本模块只把它拼进值块。
// ⚠️ 那个模块**不碰盘**（读盘那半在动作层：`readGraphReviewTarget`，见 `actions/chapters.js`），
// 所以「本模块不落盘、不发子代理、同输入同输出」这条纪律不变。
import { graphReviewValueLines } from './knowledge-graph-review.js'
// 票 `knowledge-graph-build/11`：跨章审计那一档的**条数对账句**只有一处出处（`cross-audit.js`，
// 它自己又走 `cross-audit-ledger.js` 的 `ledgerCountsClause()`）——⛔ 不在这里另拼一份措辞。
import { ledgerClaimLine } from './cross-audit.js'
// 票 `knowledge-graph-build/10`：写作面两个**既有槽**的「知识链」（本章每个 `points` 的 `prereq`
// 上游闭包 ＋ 直接后继 ＋ 位置索引）——渲染只住一处（`knowledge-graph-chain.js`）。
// ⚠️ 那个模块的**计算面**是纯函数（不读时钟、不写随机数、不碰盘）；读图那一步在**调用方**
// （`readKnowledgeChainGraph()`，见 `actions/chapters.js`）——本模块只把读出来的两样当值传进纯函数。
import { CHAIN_SECTION_HEADING, knowledgeChainFeed } from './knowledge-graph-chain.js'
// 票 `reader-questionnaire-ai-authoring/04`：写卷那一档的值块里那一段**机器已选好的条目清单**
// （逐片逐条 ＋ 三条字数上限 ＋ 「本卷合计 N 条」）——渲染只住一处（`questionnaire-author.js`）；
// 读合并件与取条那一步在动作层，⛔ 本模块不碰盘。
import { questionnaireAuthorValueLines } from './questionnaire-author.js'
// 票 `reader-questionnaire-ai-authoring/05`：读卷那一档的值块（三件注入的落点与读数 ＋ 交工形状）——
// 渲染只住一处（`questionnaire-analyze.js`）；重建「当初写卷那份派单提示词原文」那一步在动作层
// （它要读模板），⛔ 本模块不碰盘。
import { questionnaireAnalyzeValueLines, questionnaireAnalyzeInjectionReading } from './questionnaire-analyze.js'
// 票 `reader-cognition-boundary-build/07`：**读者边界那一份现算的派生视图**那一格
//（四份逐章派单正文里的「本章不许写什么」）。渲染只住一处（`reader-boundary.js`），
// 本模块只把它拼进值块——读盘那半在动作层（`readReaderBoundary()`），⛔ 本模块不碰盘。
import { BOUNDARY_DISPATCH_KINDS, STYLE_SPEC_BOUNDARY_INSTRUCTION, readerBoundaryDispatchLines } from './reader-boundary.js'

// ── 形状出处（九份模板文件 ＋ 终检那一节）────────────────────────────────────
//
// 路径**逐字取自 `src/domain-rules.js` 的两张清单**（九份模板与 `audit-and-testing.md` 是
// `SPEC_ROWS` 的行；`写作规范`／`章节安排`／… 那几份共用文档是产物行，走 `productFamilyPath`）
// ——**不在这里手写第二份路径清单**（手抄的那份会漂）。
//
// ⚠️ 传进来的 `rel` 是**资源根相对的完整路径**，清单行必须与它**逐字相等**
//（`resources/` ＋ rel）——**不用 basename ＋ `endsWith` 那种宽松匹配**：清单里
// `writing-agent-prompt.md` 与 `gold-writing-agent-prompt.md` 是后缀关系、gold 行还排在前面，
// 宽松匹配会把写作那一档匹配到执笔那一行（落地时真撞过；那次之所以响，是因为返回值改成了
// 「取清单行自己的 path」，宽松键才露出马脚）。
// 返回值取的是**清单行自己那个 `path`** 剥掉 `resources/` 前缀（不是把入参原样还回去）。

/** 九份模板／方法论文档在清单里的资源根相对 rel（**一条**查找口径，两处都走它）。 */
function manifestRel(rel) {
  const prefix = 'resources/'
  const wanted = `${prefix}${rel}`
  const row = SPEC_ROWS.find((candidate) => candidate.path === wanted)
  if (row === undefined) throw new Error(`产物清单里没有 ${rel} 这一行——形状出处读不出来`)
  // 清单行的 `path` 是仓内路径（带 `resources/`）；读口要的是资源根相对的那一段。
  return row.path.slice(prefix.length)
}

/** 九份派发模板的 rel（**逐字**是清单里那九行；查找键用完整 rel，见上面的 ⚠️）。 */
const templateRel = manifestRel

/** `audit-and-testing.md` 的 rel（终检那一档的形状出处是它的 §十）。 */
const AUDIT_DOC_REL = manifestRel('references/audit-and-testing.md')
/** 终检分查那一节的标题（逐字；`pickSections` 按层级切到下一个同级或更高级标题）。 */
export const FINAL_CHECK_SECTION = '### 终检分查：派 5 个小助手（真实模式 · ADR-0027）'

/** 九份模板共用的那一节（登记表口径）——派发面走同一张表那句话的住处。 */
const REGISTRY_SECTION = '## 登记表口径（派发时随活一起给你，不靠主笔措辞）'

/**
 * `alignment` 那一档的「你该产出的登记行」（票 `knowledge-graph-build/06`）。
 *
 * 它**不照搬这一步（explore）那张产物表**：表里那两份（细目与知识地图分片）是**精读**那一档的落点，
 * 对齐小助手一个都不写（它的结论随回灌带回、由主笔当书级参数交工）。照搬＝机器对小助手说一句假话，
 * 而「该产出的登记行」这一行的全部意义就是它不撒谎。⚠️ 这一档**不落盘**是有意的（spec §3：
 * 书级那一份走主笔交工参数，⛔ 不另落一份），不是「忘了给它一个落点」。
 */
const ALIGNMENT_PRODUCE_NOTE = '（这一档不落盘：你的结论随最终回复带回，由主笔在 stage-submit(explore) 当书级参数交工——细目与知识地图分片是精读那一档的落点，不是你的）'

/**
 * `graph-review` 那一档的「你该产出的登记行」（票 `knowledge-graph-build/13`）。
 *
 * 与 `alignment` 同一条理由、同一个口径：这一档**不落盘**。照搬这一步（outline）那张产物表
 * 会把「章节骨架」说成它的落点＝机器对小助手说一句假话。⚠️ 它带回的是**条目级清单**，
 * 由主笔与用户读（机器一个字都不解析），所以这一行不写任何路径。
 */
const GRAPH_REVIEW_PRODUCE_NOTE = '（这一档不落盘：你交回的是一份**条目级清单**（点名到卡），随最终回复带回即可——章节骨架与知识地图都不是你的落点，⛔ 也别往书夹里写文件）'

/**
 * `questionnaire-author` 那一档的「你该产出的登记行」（票 `reader-questionnaire-ai-authoring/04`）。
 *
 * 它**不是**不落盘：这一档确实交两份文件（题面 JSON ＋ 意图 `.md`），路径逐字取自 `domain-rules`
 * 的唯一出处。⚠️ 不照搬这一步（goal）那张产物表：那是站 3 的目标件，不是它的落点——照搬就是让机器
 * 对小助手说一句假话。
 */
const QUESTIONNAIRE_AUTHOR_PRODUCE_NOTE = `${READER_QUESTIONNAIRE_TEXT_REL}（题面 JSON）与 ${READER_QUESTIONNAIRE_INTENT_REL}（意图件）——就这两份，⛔ 别往书夹里写别的文件`

/**
 * `questionnaire-analyze` 那一档的「你该产出的登记行」（票 `reader-questionnaire-ai-authoring/05`）。
 *
 * ⚠️ 只一份（`工作区/问卷判断.json`）——**不是**剔除记录：那份记录只经主笔发既有的「图上意见」通路
 * 写（子助手调 `workbench_act` 会被归属闸拒，那是有意的）。
 */
const QUESTIONNAIRE_ANALYZE_PRODUCE_NOTE = `${READER_QUESTIONNAIRE_VERDICT_REL}（问卷判断 JSON）——就这一份，⛔ 别往书夹里写剔除记录（那一份只经主笔发 \`graph-opinion\` 写，你有自己的 sessionId，直调会被拒）`

/**
 * 这一档要哪几个**读盘结果当值**的输入（票 `depth-round-3/06`；**唯一**一份「谁要哪几位」的声明）。
 *
 * ⚠️ **`boundary` 那一位从 `BOUNDARY_DISPATCH_KINDS` 派生，不在这里手写**（票面二选一里的第二种）。
 * 理由：那四份逐章派单的清单是 spec 口径（§4.2／§6.2 D）的一处既有声明，`reader-boundary.js` 自己的
 * 渲染与文档都引它，动作层的读盘也按它落地过；并进这张表就得把那份口径整段搬走（多一次搬迁、
 * 多一份「哪边才是真的」的悬案）。派生只是**只读映射**：一处声明、一处派生，⛔ 不产生第二份档名清单。
 * 代价如实写：`dispatch-assembly.js` 因此仍要 import `BOUNDARY_DISPATCH_KINDS`（在 `reader-boundary.js`
 * 里改那四档名字，这里跟随，不会漂）。
 *
 * ⚠️ 次序**就是点名次序**：{@link dispatchValues} 按这个数组逐个查「给了没有」，第一个缺的就点它
 * ——今天的次序是「这一档自己那一位在前、`boundary` 在后」（与票 07 落地时的形状逐字相同）。
 *
 * @param {string} kind 这一档的 kind（只用来判 `boundary` 那一位是否派生进来）
 * @param {...string} own 这一档**自己**要的输入名（取值域＝动作层 `DISPATCH_INPUT_READERS` 的键面；
 *   `test-agent-dispatch.mjs` ⑥-A／⑥-B 两面都断）
 * @returns {readonly string[]} 冻结的输入名数组
 */
function dispatchInputs(kind, ...own) {
  const declared = [...own]
  if (BOUNDARY_DISPATCH_KINDS.includes(kind)) declared.push('boundary')
  return Object.freeze(declared)
}

/**
 * 一派一档的形状说明（**唯一**一份：动作层、拼装、判据都读它）。
 *
 * `stage` 是这一档派单**属于哪一段工序**：动作层据此要求「只在领到这一段任务时派」——
 * 每档的值本来就来自那一段的 `brief`（章级的值在 `chapters`、范例章的值在 `gold`……），
 * 拿错一段的 brief 就是把别的工序的值填进这一档。
 *
 * `inputs` 是这一档**要哪几位读盘结果当值**（票 `depth-round-3/06`）：⛔ 本模块不读盘，读在调用方；
 * 这一格是「谁要哪几位」的唯一声明——动作层按它读、{@link dispatchValues} 按它点名。
 */
export const DISPATCH_SPECS = Object.freeze({
  writing: Object.freeze({
    kind: 'writing',
    label: '铺章写作',
    stage: 'chapters',
    // 知识链那一格（票 10 的图）＋「本章要写哪些点」那一份（票 exclusion-flow/02：`readCoverageCollection`
    // 的 `live`／`effective`）＋「本章不许写什么」那一格（票 07）——三位都要读盘，缺任一位就响。
    inputs: dispatchInputs('writing', 'graphInputs', 'coverage'),
    shapeRel: templateRel('references/subagent-prompts/writing-agent-prompt.md'),
    // 这一档的模板有占位符，「抽掉哪一段 ⇒ 报断线」的锚取四段承重的——第四段是票 10 的知识链那一节：
    // 抽掉它，`{{本章知识链位置说明}}` 就不在形状里了，图会静默地不上路。
    anchors: Object.freeze([REGISTRY_SECTION, '## 必带内容（按顺序）', '## 章正文不归你写：你只落分片（机器拼）', CHAIN_SECTION_HEADING]),
  }),
  'gold-writing': Object.freeze({
    kind: 'gold-writing',
    label: '范例章执笔',
    stage: 'gold',
    // 与 writing 同面：范例章也写正文，清单同样只许取「本书要写的」那一份（⛔ 不各自过滤）。
    inputs: dispatchInputs('gold-writing', 'graphInputs', 'coverage'),
    shapeRel: templateRel('references/subagent-prompts/gold-writing-agent-prompt.md'),
    anchors: Object.freeze([REGISTRY_SECTION, '## 必带内容（按顺序）', '## 写作规范十九项契约', CHAIN_SECTION_HEADING]),
  }),
  audit: Object.freeze({
    kind: 'audit',
    label: '章级审计',
    stage: 'chapters',
    inputs: dispatchInputs('audit'),
    shapeRel: templateRel('references/subagent-prompts/audit-agent-prompt.md'),
    anchors: Object.freeze([REGISTRY_SECTION, '## 必带内容', '## 审计要求']),
    // ⚠️ **今天没有活跃调用点**：铺章那一跳的章审计由编排脚本驱动（`workflow-scripts/chapter-audit.md`
    // 的骨架自己按这份模板填正文，票 `chapter-audit-orchestration/03`），引擎给的提示也写着走脚本。
    // 这一档留着不是死代码：它是「重审／直派一个章级审计小助手」的口子（脚本跑不了时的老路），
    // 也是九份模板各自成档的完整性（少一档，`dispatchKinds` 就不再等于「九份模板 ＋ 终检」）。
    // ⛔ 别为了「消灭空闲档」删它：删了这条口子，直派章审计就只能回到主笔手抄模板那条老路上。
  }),
  'gold-audit': Object.freeze({
    kind: 'gold-audit',
    label: '范例章审计',
    stage: 'gold',
    // ⚠️ 这一档**不要**读者边界那一格（`BOUNDARY_DISPATCH_KINDS` 点名的是那四份，不含它）——
    // 声明由那张表派生，所以这里一个字都不写：写一个 `'boundary'` 才是第二份清单。
    inputs: dispatchInputs('gold-audit'),
    shapeRel: templateRel('references/subagent-prompts/gold-audit-prompt.md'),
    anchors: Object.freeze([
      REGISTRY_SECTION,
      '## 必读文档矩阵（逐份读，一份都不能少）',
      '## 核对项（五项，逐项过）',
    ]),
  }),
  // 票 `pre-gold-build/01`：探查段开头那一趟**书级材料判定**（角色不再在上传那一刻猜）。
  // 它排在这里（`close-reading` **之前**）也是工序事实：判定小助手插在逐源精读之前（spec §4.2 的七格卡）。
  'material-survey': Object.freeze({
    kind: 'material-survey',
    label: '书级材料判定',
    stage: 'explore',
    // 读物（每份转换稿的路径 ＋ 有界读法）由调用点现读现给（`engine.materialSurveyInput`）。
    inputs: dispatchInputs('material-survey', 'survey'),
    shapeRel: templateRel('references/subagent-prompts/material-survey-prompt.md'),
    anchors: Object.freeze([
      REGISTRY_SECTION,
      '## 派活时机器已经给你的是什么',
      '## 产出契约：`工作区/材料判定.json`（严格 JSON）',
      '## 判角色时按这几条来',
    ]),
  }),
  'close-reading': Object.freeze({
    kind: 'close-reading',
    label: '源探查精读',
    stage: 'explore',
    // 这一档的值全在 `meta`／`brief` 里，没有读盘结果当值（`role` 那半也从 brief 来）。
    inputs: dispatchInputs('close-reading'),
    shapeRel: templateRel('references/subagent-prompts/close-reading-prompt.md'),
    anchors: Object.freeze([
      REGISTRY_SECTION,
      '## 派活时要填给你的四件事',
      '## 产出契约一：',
      '## 产出契约二（本仓 dsh）：',
    ]),
  }),
  // 票 `knowledge-graph-build/06`：**探索段内再派的一路**——精读把每份材料变成一片卡片之后，
  // 这一路读**全部**卡片，只下两件判断：跨材料的边 ＋「同一件事在几份材料里各出现一次」合并成一条。
  // ⚠️ 它**不是新阶段、不进 `ACT_STAGES`、不让用户多等一次异步**：`stage` 与精读同是 `explore`
  // （值也从那一段的 brief／meta 来，动作层「只在领到这一段任务时派」那条守卫口径不变）。
  // 它与 `close-reading` 的分工是**读者面**的分工，不是工序的分工（spec §1：交工者仍是主笔）。
  'alignment': Object.freeze({
    kind: 'alignment',
    label: '跨材料对齐',
    stage: 'explore',
    inputs: dispatchInputs('alignment'),
    shapeRel: templateRel('references/subagent-prompts/alignment-prompt.md'),
    anchors: Object.freeze([
      REGISTRY_SECTION,
      '## 本仓（dsh）：产出契约一',
      '## skill 侧：产出契约一',
      '## 产出契约二：回灌三件套',
      '## 铁律',
    ]),
  }),
  // 票 `knowledge-graph-build/13`：**图的语义那一半的唯一读者**（spec §5 那两条软读数的去向、
  // §11 落地清单第 6 条那条接缝）。它读**全部卡片与边**（合并件那一份），按把握档排的注意力清单
  // 先复核「待核」、再全量扫一遍，判**卡的语义四类**（一卡一事／复述名字／容器卡／`testable` 可判）
  // **＋ 边的一类**（边的语义问题：方向三选一／该有前置而图上没有／看着像同一件事却不是 `alias`；
  // 票 `knowledge-graph-edges-build/01`），交一份**条目级清单**回灌
  // ——⛔ 不落盘、⛔ 不出「通过／不通过」结论键。
  // ⚠️ `stage: 'outline'` 不是随手挑的：合并件是**探索段交工那一刻**才由机器拼出来的
  //（`actions/chapters.js` 的 `stage-submit(explore)`），所以「第一轮结果出来后审一遍」最早
  // 只能落在**下一段**；而 outline 这一步的登记行里正好有 `工作区/knowledge-map.json`
  //（`STEP_INPUT_ROWS.outline`）⇒ 它是「值从哪来」这件事本身，不是额外限制。
  'graph-review': Object.freeze({
    kind: 'graph-review',
    label: '知识点图审校',
    stage: 'outline',
    // 这一档的值**全部**是调用方读盘现算出来的那一份（`readGraphReviewTarget(project)`）。
    inputs: dispatchInputs('graph-review', 'graphReview'),
    shapeRel: templateRel('references/subagent-prompts/graph-review-prompt.md'),
    anchors: Object.freeze([
      REGISTRY_SECTION,
      // ⚠️ 这一段标题里的类数**随 `GRAPH_REVIEW_CATEGORIES` 走**（票 `knowledge-graph-edges-build/01`
      // 由四类改五类）——改类数时这一行与模板标题要**同批**改，否则这一档的锚当场读不到。
      '### 判什么（五类，逐条给依据）',
      '### 产出契约：**只交清单，不交结论键**',
      '### 铁律',
    ]),
  }),
  // 票 `reader-questionnaire-ai-authoring/04`：**写卷**那一档。主笔在探查交工之后、发卷之前派这一路
  // 续接型小助手：它读合并件（⛔ 不读材料正文），交题面 JSON ＋ 意图 `.md`。
  // ⚠️ `stage: 'goal'` 不是随手挑的，理由与 `graph-review` 那一档同形：合并件是**探索段交工那一刻**
  // 才由机器拼出来的（`actions/chapters.js` 的 `stage-submit(explore)`），所以这一路最早只能落在
  // **下一段**；而 goal 这一步的登记行里正好有 `工作区/knowledge-map.json`（`STEP_INPUT_ROWS.goal`）
  // ⇒ 它是「值从哪来」这件事本身。⚠️ 题面没交回也**不阻塞发卷**（用户点「发问卷」照发今天的确定性版）。
  // ⚠️ 值里的条目清单**从合并件与取条规则现算**（`questionnaire-author.js` 的 `questionnaireAuthorSlices`），
  // 读盘那一步在调用方（`DISPATCH_INPUT_READERS.questionnaireAuthor`），本模块仍不碰盘。
  'questionnaire-author': Object.freeze({
    kind: 'questionnaire-author',
    label: '写读者问卷题面',
    stage: 'goal',
    inputs: dispatchInputs('questionnaire-author', 'questionnaireAuthor'),
    shapeRel: templateRel('references/subagent-prompts/questionnaire-author-prompt.md'),
    // 六个承重锚（票面逐字）：缺一个 `assembleDispatchPrompt` 就抛 `DispatchShapeError`。
    // ⚠️ 第一段是几份共用的「登记表口径」；中间四段是这一档自己的骨架（身份／读物／翻话法／硬约束），
    // 后两段是它交什么（意图件 ＋ 交工形状）。
    anchors: Object.freeze([
      REGISTRY_SECTION,
      '## 你是谁',
      '## 你手上是什么',
      '## 怎么把标签翻成问话',
      '## 四条硬约束',
      '## 意图件写什么（`工作区/问卷意图.md`）',
      '## 交工形状',
    ]),
  }),
  // 票 `reader-questionnaire-ai-authoring/05`：**读卷**那一档。回卷件落盘之后，主笔先试冷恢复
  // `meta.questionnaireAgentId` 那一个子助手（`resumed`）；唤不醒就新起一路上下文干净的读卷子代理
  // （`rehydrated`），交办里把三件注入补齐（提示词原文可确定性重建／意图件／回卷件）。
  // ⚠️ `stage: 'goal'` 与写卷那一档同形：回卷件是**站 2 拍板之后**、站 3 那一趟才被读的，而站 3 的
  // 派单值就从那一段的 brief 来——否则「只在领到这一段任务时派」那道守卫会与本票的产品行为打架。
  // ⚠️ 值里的**三件注入**由调用方读盘／现算当值传进来（`DISPATCH_INPUT_READERS.questionnaireAnalyze`），
  // 本模块仍不碰盘。
  'questionnaire-analyze': Object.freeze({
    kind: 'questionnaire-analyze',
    label: '读读者情况问卷',
    stage: 'goal',
    inputs: dispatchInputs('questionnaire-analyze', 'questionnaireAnalyze'),
    shapeRel: templateRel('references/subagent-prompts/questionnaire-analyze-prompt.md'),
    // 四个承重锚（缺一个就抛 `DispatchShapeError`）：
    // ① 共用的登记表口径；② 身份与两档来历（冷恢复／干净重派——口径完全相同）；
    // ③ 交工形状（`drop` ／ `skip` 两条数组，那是唯一被机器验的东西）；④ 铁律（不改件、不补答、不代笔）。
    anchors: Object.freeze([
      REGISTRY_SECTION,
      '## 你是谁',
      '## 交工形状（`工作区/问卷判断.json`，严格 JSON）',
      '## 铁律',
    ]),
  }),
  'cross-audit': Object.freeze({
    kind: 'cross-audit',
    label: '跨章审计',
    stage: 'merge',
    // 逐边清单（票 11）＋「本章不许写什么」（票 07）——两位都由调用方读盘现算。
    inputs: dispatchInputs('cross-audit', 'edgeLedger'),
    shapeRel: templateRel('references/subagent-prompts/cross-audit-prompt.md'),
    anchors: Object.freeze([
      REGISTRY_SECTION,
      '## 审计对象（派发时逐条填实际路径）',
      // ⚠️ 这一节还是机器验货（`cross-audit.js` 的 `crossAuditItemLabels()`）解析五项判定词的住处：
      // 抽掉它 ⇒ 拼装与验货一起空转，所以它必须在这张锚表上。
      '## 五项核对判定表',
      // 票 `knowledge-graph-build/11`：逐边清单那一节（`{{逐边清单}}` 的落点）——
      // 抽掉它，「清单是全量的」这条口径就没有载体，机器填的值也无处可去。
      '## 逐边清单（机器现算）',
    ]),
  }),
  'final-check': Object.freeze({
    kind: 'final-check',
    label: '最后检查分查',
    stage: 'final',
    // 值全在 brief 的分查范围里（`finalScopes`），没有读盘结果当值。
    inputs: dispatchInputs('final-check'),
    shapeRel: AUDIT_DOC_REL,
    section: FINAL_CHECK_SECTION,
    anchors: Object.freeze([
      '#### 10.a 派法：五路、各有范围、先派后读再合',
      '#### 10.b 报告形状：结论 + 条目级点名 + 预算（防错条款）',
    ]),
  }),
})

/** 这一档的形状说明；kind 认不出时返回 null（动作层据此回 400）。 */
export function dispatchKindSpec(kind) {
  return Object.prototype.hasOwnProperty.call(DISPATCH_SPECS, String(kind)) ? DISPATCH_SPECS[String(kind)] : null
}

/** 全部 kind（数据表顺序；错误文案与测试都用它，不另排一份）。 */
export function dispatchKinds() {
  return Object.freeze(Object.keys(DISPATCH_SPECS))
}

/**
 * 「缺了响着失败」是**判据**（票 `depth-round-3/06`）：这一档声明了要它而调用方没给 ⇒ 抛，
 * 错误原文点名**哪一档、缺哪一位**。
 *
 * ⚠️ 只断**在不在场**（`undefined`／`null`）：形状对不对归各分支那几段自己查（`edgeLedger` 还得有
 * `.text`／`.counts`、`survey` 还得有 `materials[]`）——两件事分开守，坏的时候才说得清是哪一样破了。
 * ⚠️ 次序＝`spec.inputs` 的声明次序（见 `dispatchInputs()`）：这一档自己那一位先点，`boundary` 后点。
 */
function requireDeclaredInputs(spec, input) {
  for (const name of spec.inputs) {
    const value = input[name]
    if (value === undefined || value === null) {
      throw new DispatchShapeError(`${spec.kind} 派单声明了要 ${name}（这一档的输入值之一），但调用方没给：`
        + '读盘那一步在调用方做（`DISPATCH_SPECS[kind].inputs` 就是这一档要哪几位）——'
        + '本模块不碰盘，也不替它编一份空的')
    }
  }
}

// ── 本书实际值（纯函数：meta ＋ brief ＋ 槽位 → 值对象）────────────────────────

/** 共用文档的书夹相对路径（`写作规范` / `章节安排` / `探查报告` / `知识地图` / `风格线`）。 */
const DOC_PATH = Object.freeze({
  styleSpec: productFamilyPath('写作规范'),
  outline: productFamilyPath('章节安排'),
  explore: productFamilyPath('探查报告'),
  knowledgeMap: productFamilyPath('知识地图'),
  styleLine: productFamilyPath('风格线'),
})

/** `资料N：小节` 拆开（`source` 字段的实际写法）。认不出形状时返回 null，由调用方点名。 */
function splitMaterialSource(text) {
  const match = /^\s*资料\s*(\d+)\s*[：:]\s*(.*)$/u.exec(String(text ?? ''))
  if (match === null) return null
  return { n: Number(match[1]), section: match[2].trim() }
}

/**
 * 本章的源材料定位：`outline` 的 `source`（`资料N：小节`）＋ `meta.sources` 里转换完成的那几份。
 * 认不出形状／序号越界时**返回一条点名**（`{ note }`），不猜一份材料出来。
 */
function materialFor(sources, sourceText) {
  const split = splitMaterialSource(sourceText)
  if (split === null) {
    const raw = String(sourceText ?? '').trim()
    return { note: raw === '' ? '本章 outline 没有填 source（哪份材料的哪一节）' : `本章 source 是「${raw}」，认不出「资料N：小节」的形状` }
  }
  const shard = okMaterialShards(sources).find((entry) => entry.n === split.n)
  if (shard === undefined) {
    return { note: `source 写的是「资料${split.n}」，但本书没有第 ${split.n} 份**转换完成**的材料` }
  }
  const md = `材料/转换稿/${shard.source.md}`
  return { n: split.n, file: shard.source.file, md, stem: md.replace(/\.md$/u, ''), section: split.section }
}

/** 一章的 `points` 逐字（空数组＝真的空，机器不替它编、也不拿别的章顶上）。 */
function pointsOf(chapter) {
  return Array.isArray(chapter?.points) ? chapter.points.filter((point) => typeof point === 'string' && point.trim() !== '') : []
}

/** 知识链位置那两句话（前章讲了什么／后章会用到什么），逐字取自 `outline` 的章名与 points。 */
function chainText(chapters, n) {
  const label = (chapter, at) => {
    const points = pointsOf(chapter)
    return `第 ${at} 章《${chapter?.title ?? ''}》${points.length === 0 ? '' : `（知识点：${points.join('、')}）`}`
  }
  const before = n >= 2 ? chapters[n - 2] : null
  const after = n < chapters.length ? chapters[n] : null
  const parts = []
  parts.push(before === null ? '这是第 1 章，前面没有前置章。' : `前面 ${label(before, n - 1)} 讲过——这一章若用到，说法要与它一致。`)
  parts.push(after === null ? '这是最后一章，后面没有章了。' : `后面 ${label(after, n + 1)} 会用到这一章的内容——提到还没写的章时只到大纲承诺粒度，禁止编造具体数字／结论／例题。`)
  return parts.join('')
}

/** 前置章逐条（范例章执笔模板的 `{{知识链前置小节}}`）。 */
function beforeChaptersText(chapters, n) {
  if (n < 2) return '（这是第 1 章，前面没有前置章。）'
  return chapters.slice(0, n - 1).map((chapter, index) => {
    const points = pointsOf(chapter)
    return `- 第 ${index + 1} 章《${chapter?.title ?? ''}》${points.length === 0 ? '' : `：${points.join('、')}`}`
  }).join('\n')
}

/** 该读／该产出的登记行（票 02 的两行清单；brief 不在手上时点名，不静默）。 */
function registryLines(brief) {
  const read = Array.isArray(brief?.dispatch?.read) ? brief.dispatch.read : null
  const produce = Array.isArray(brief?.dispatch?.produce) ? brief.dispatch.produce : null
  const half = (rows) => (rows === null
    ? '（这一档没从 brief 拿到登记表——机器不替它编）'
    : rows.length === 0 ? '（这一步没有）' : rows.map((row) => `${row.path}（${row.role}）`).join('、'))
  return { read: half(read), produce: half(produce) }
}

/**
 * 本书实际值（**同输入同输出**：不读时钟、不写随机数、不碰盘）。
 *
 * ⚠️ **最前面那道闸是声明面**（票 `depth-round-3/06`）：下面那几位读盘结果当值（`graphReview`／
 * `graphInputs`／`boundary`／`edgeLedger`／`survey`）里，**这一档声明了的那几位**（`spec.inputs`）
 * 缺一位就抛并点名；补上就照旧。⇒ 「缺了响着失败」从每档各写一句注释，变成一处可断的判据。
 *
 * @param {string} kind 十档之一（`DISPATCH_SPECS`）
 * @param {object} input
 * @param {object} input.meta 书的 `project.json`（机器身份词那几栏：`outline` / `sources` / `route`）
 * @param {object|null} input.brief 这一段的 brief（`buildStageBrief` 的那一份；章级的表在它里面）
 * @param {number|null} [input.chapter] 章号（`writing` / `audit`）
 * @param {number} [input.shard] 分片号 MM（`writing`，从 1 起；只录一路时是 1）
 * @param {number|null} [input.material] 材料号（`close-reading`）
 * @param {number|null} [input.scope] 分路号（`final-check`）
 * @param {object} [input.graphReview] 知识点图审校的交办值（`graph-review`；由**调用方**读盘现算，
 *   见 `knowledge-graph-review.js` 的 `graphReviewTarget` —— 本函数是纯函数，⛔ 不读盘）
 * @param {object} [input.edgeLedger] 机器现算的**逐边清单**（`cross-audit`；由调用方读盘算好当值传进来
 *   ——`cross-audit-ledger.js` 的 `readCrossAuditEdgeLedger()`，⛔ 本模块不碰盘）
 * @param {object} [input.graphInputs] 图那两样**当值**（`writing` / `gold-writing`；由调用方读盘读出来
 *   ——`knowledge-graph-chain.js` 的 `readKnowledgeChainGraph()`：合并件 ＋ 被划掉的卡键）。
 *   ⚠️ 章号**不在这里**：本章的图那一份由本函数按它自己算出来的 `n` 现算（纯函数），
 *   ⇒ 不存在「调用方按第 2 章算、这一档派的是第 3 章」那种错配。
 * @param {object} [input.coverage] 唯一读侧入口 `readCoverageCollection()` 的返回（`writing` /
 *   `gold-writing`）：本函数只用它的 `live`／`effective` 两栏来派生「本章要写的点」——⛔ 不在这里
 *   另写一套减法（派生只走 `domain-rules.effectiveChapterPoints`）。读盘同样在调用方。
 * @param {string} [input.note] 主笔的一句叮嘱（**原话**，机器一个字符不改）
 * @returns {object} 值对象（{@link renderDispatchValues} 与 {@link dispatchSlots} 的输入）
 */
export function dispatchValues(kind, input = {}) {
  const spec = dispatchKindSpec(kind)
  if (spec === null) throw new Error(`未知派单类型：${String(kind)}`)
  // 票 `depth-round-3/06`：声明面就是判据面——这一档声明了要哪几位，缺一位就在这里当场抛并点名。
  // ⚠️ 这是**唯一**一处统一点名缺件；下面各分支里那几段只剩「形状对不对」（缺件已在上面拦掉）。
  requireDeclaredInputs(spec, input)
  const meta = input.meta ?? {}
  const brief = input.brief ?? null
  const chapters = Array.isArray(meta.outline?.chapters) ? meta.outline.chapters : []
  const registry = registryLines(brief)
  const note = typeof input.note === 'string' ? input.note.trim() : ''
  const base = {
    kind: spec.kind,
    kindLabel: spec.label,
    stage: spec.stage,
    shapeRel: spec.shapeRel,
    note,
    registry,
    resourceRoot: typeof brief?.resourceRoot === 'string' ? brief.resourceRoot : null,
    // 本书夹的**绝对路径**：子代理的 cwd 归宿主那条继承链管（它挂的是主笔的会话），
    // 所以凡是相对路径（`工作区/…`、`材料/转换稿/…`）都要有这一个基准才落得对地方。
    dir: typeof brief?.dir === 'string' ? brief.dir : null,
  }

  /**
   * 票 `knowledge-graph-build/10`：写作面那两个**既有槽**的「知识链」正文（本章每个 `points` 的
   * `prereq` 上游闭包按距离分层 ＋ 直接后继 ＋ 位置索引）。
   *
   * ⚠️ **读图那一步在调用方**（`readKnowledgeChainGraph()`）：本函数是纯函数，⛔ 不碰盘；缺了那两样
   * **响着失败**（⛔ 不替它编一份「图是空的」——「没有图」这件事也必须是读出来的事实）。
   * ⚠️ **缺件**（`undefined`／`null`）已由 {@link requireDeclaredInputs} 在入口点过名；这里守的是
   * **形状**（给了一个不像图的东西）——两件事分开，坏的时候才说得清是哪一样破了。
   * ⚠️ 章号用的是**本函数自己那一份 `n`**（不是调用方算的）：两处各算一次就会错配。
   */
  const chainFeedOfChapter = (n) => {
    const inputs = input.graphInputs
    if (inputs === null || typeof inputs !== 'object') {
      throw new DispatchShapeError('这一档派单需要 graphInputs（合并件 ＋ 被划掉的卡键）：'
        + '读图那一步在调用方做（`knowledge-graph-chain.js` 的 `readKnowledgeChainGraph()`）——本模块不碰盘，也不替它编一份空图')
    }
    return knowledgeChainFeed({ merged: inputs.merged, chapters, chapter: n, excludedKeys: inputs.excludedKeys })
  }

  /**
   * 票 `reader-cognition-boundary-build/07`：逐章那四档的**读者边界**那一份现算读数。
   *
   * ⚠️ 与 `graphInputs`／`edgeLedger` 同一条纪律：**读在调用方**（`reader-boundary.js` 的
   * `readReaderBoundary()`），本函数不碰盘；缺了**响着失败**——⛔ 不替它编一份「没有剔除」
   *（那等于机器替这本书说「一条都没划」）。⚠️ **哪几档要它**由 `spec.inputs` 说（`boundary` 那一位
   * 从 `BOUNDARY_DISPATCH_KINDS` 派生）；**缺件**由 {@link requireDeclaredInputs} 在入口点过名，
   * 这里只守**形状**。
   */
  const boundaryOf = () => {
    const boundary = input.boundary
    if (boundary === null || typeof boundary !== 'object') {
      throw new DispatchShapeError(`${spec.kind} 派单需要 boundary（读者边界那一份现算读数）：`
        + '读那份人的裁决在调用方做（`reader-boundary.js` 的 `readReaderBoundary()`）——'
        + '本模块不碰盘，也不替它编一份「没有剔除」')
    }
    return boundary
  }

  /**
   * 票 `exclusion-flow/02`（F2）：「本章要写哪些点」取**生效点集**（`readCoverageCollection().effective`）。
   *
   * ⚠️ **派生只走 `domain-rules.effectiveChapterPoints`**（本仓「本章 points ∩ effective」的唯一实现）：
   * 这里⛔ 不再写一遍 `points.filter(...)`——四处各写一份、任何一份漂了都不会红，正是本 effort 要治的病。
   * ⚠️ **`live.length === 0` 时一个字节不改**（与 F1 的守卫同一个口径）：没有那份件／没有知识地图的
   * 老书 `effective` 可能是空数组，无条件求交会把「本章要写的点」整个清空。
   * ⚠️ **读在调用方**：`coverage` 是 `readCoverageCollection()` 的返回当值传进来，本模块仍不碰盘；
   * 缺件已由 {@link requireDeclaredInputs} 点过名，这里只守形状（`live`／`effective` 两栏）。
   */
  const coverageOf = () => {
    const coverage = input.coverage
    if (coverage === null || typeof coverage !== 'object'
      || !Array.isArray(coverage.live) || !Array.isArray(coverage.effective)) {
      throw new DispatchShapeError(`${spec.kind} 派单需要 coverage（readCoverageCollection 的返回：live／effective）：`
        + '读那份人的裁决在调用方做（`knowledge-map-exclusions.js` 的 `readCoverageCollection()`）——'
        + '本模块不碰盘，也不替它编一份「没有被划掉的」')
    }
    return coverage
  }

  /**
   * 本章 points 的那一份「要写的」：原样（没有 live 裁决）或 `points ∩ effective`（有 live 裁决）。
   *
   * 返回值直接铺进值块：`points` 是清单那几条，`pointsRawCount` 与 `pointsDerived` 只给渲染分清
   * 「outline 压根没写 points」与「写了 N 条、但全都不在『本书要写的』那一份里」——
   * ⛔ 不把后一件事印成前一件。`pointsDerived` 是**显式**的：不靠「某几个读数在不在」反推。
   */
  const chapterPointsValues = (chapter) => {
    const coverage = coverageOf()
    const raw = pointsOf(chapter)
    const derived = coverage.live.length > 0
    return {
      points: derived ? effectiveChapterPoints(raw, coverage.effective) : raw,
      pointsRawCount: raw.length,
      pointsDerived: derived,
    }
  }

  if (spec.kind === 'writing') {
    const n = Number(input.chapter)
    if (!Number.isSafeInteger(n) || n < 1) throw new Error('writing 派单需要 chapter（第几章，1 起）')
    const chapter = chapters[n - 1] ?? null
    if (chapter === null) throw new Error(`writing 派单的第 ${n} 章不在 outline 里`)
    // ⚠️ `shard` 只许**缺**或**合法**：缺＝只派一路（1）；填了不合法就响——它决定落盘分片号
    // （`工作区/分片/chapter-NN-MM.md`），静默归一成 1 会把「第 2 路」写进第 1 片（与本章
    // 「空着被点名、不替它编」同一口径）。0、负数、小数、NaN 都算填错。
    const shardRaw = input.shard
    const shard = shardRaw === undefined || shardRaw === null ? 1 : Number(shardRaw)
    if (!Number.isSafeInteger(shard) || shard < 1) {
      throw new Error(`writing 派单的 shard 不合法（${String(shardRaw)}）：第几号分片，1 起；不拆成多路就不用填`)
    }
    const gold = goldChapterNo(meta)
    const shardRel = chapterShardRel(n, shard)
    // 本章在知识链中的位置：**今天那两句章级的话照旧**（前章／后章），后面接票 10 的图那一份。
    const chain = chainText(chapters, n)
    // ⚠️ 次序（**形状**那一层）：知识链那一格先跑，边界那一格跟在后面。缺件的点名次序不在这里——
    // 已在入口按 `spec.inputs` 的声明次序点过（`graphInputs` 在前、`boundary` 在后）。
    const chainFeedText = chainFeedOfChapter(n).text
    const boundary = boundaryOf()
    // 票 `exclusion-flow/02`：清单取生效点集（同一处派生；⛔ 不在渲染处再过滤一遍）。
    return {
      ...base,
      label: `写第${n}章《${chapter.title ?? ''}》`,
      chapter: n,
      gold,
      title: chapter.title ?? '',
      targetWords: chapterWordsFloor(meta, n),
      ...chapterPointsValues(chapter),
      shard,
      material: materialFor(meta.sources, chapter.source),
      paths: {
        gold: chapterRel(gold),
        chapter: chapterRel(n),
        write: shardRel,
        styleSpec: DOC_PATH.styleSpec,
        outline: DOC_PATH.outline,
        explore: DOC_PATH.explore,
        knowledgeMap: DOC_PATH.knowledgeMap,
        styleLine: DOC_PATH.styleLine,
      },
      chain,
      // 票 10：`{{本章知识链位置说明}}` 那一格＝章级那两句 ＋ 图上现算的知识链（**同一个槽，不新开**）。
      knowledgeChain: `${chain}\n\n${chainFeedText}`,
      // 票 07：那一格「本章不许写什么」（整批剔除集合 ＋ 逐条点名）——⛔ 不新开槽位，只进值块。
      boundary,
      route: meta.route ?? 'blueprint',
    }
  }

  if (spec.kind === 'gold-writing') {
    const n = goldChapterNo(meta)
    const chapter = chapters[n - 1] ?? null
    const source = brief?.chapterSource ?? chapter?.source ?? ''
    // 范例章那一格照旧先给「前置各章逐条」（`beforeChaptersText()`），后面接同一份图上现算的知识链。
    const beforeChapters = beforeChaptersText(chapters, n)
    // ⚠️ 次序（**形状**那一层）同 `writing`：知识链那一格先跑，边界那一格跟在后面。
    const chainFeedText = chainFeedOfChapter(n).text
    const boundary = boundaryOf()
    return {
      ...base,
      label: `最佳范例章 · 写第${n}章《${chapter?.title ?? brief?.title ?? ''}》`,
      chapter: n,
      title: brief?.title ?? chapter?.title ?? '',
      targetWords: chapterWordsFloor(meta, n),
      ...chapterPointsValues(chapter),
      shard: 1,
      material: materialFor(meta.sources, source),
      paths: {
        gold: chapterRel(n),
        chapter: chapterRel(n),
        write: chapterShardRel(n, 1),
        audit: auditRel(n),
        styleSpec: DOC_PATH.styleSpec,
        outline: DOC_PATH.outline,
        explore: DOC_PATH.explore,
        knowledgeMap: DOC_PATH.knowledgeMap,
        styleLine: DOC_PATH.styleLine,
      },
      chain: chainText(chapters, n),
      // 票 10：`{{知识链前置小节}}` 那一格＝前置各章逐条 ＋ 图上现算的知识链（**同一个槽，不新开**）。
      // ⚠️ 槽名里那个「小节」是**已知的混轴债**（槽名说小节、机填物是章／卡那一轴），本票**不改槽名**：
      // 改名会让「槽位清单逐项相同」这条判据当场破，而「把机填物改成小节」在图上做不到（锚是材料局部
      // 的行段，图里没有小节边界——spec §5 明写不验「锚跨小节」）。债与理由记在票 10 的 `## Answer`。
      knowledgeChain: `${beforeChapters}\n\n${chainFeedText}`,
      // 票 07：那一格「本章不许写什么」——这一档还多一条**下游成文**的指令（`style-spec` 两格）。
      boundary,
      route: meta.route ?? 'blueprint',
    }
  }

  if (spec.kind === 'audit' || spec.kind === 'gold-audit') {
    const goldAudit = spec.kind === 'gold-audit'
    const n = goldAudit ? goldChapterNo(meta) : Number(input.chapter)
    if (!Number.isSafeInteger(n) || n < 1) throw new Error(`${spec.kind} 派单需要 chapter（第几章，1 起）`)
    const chapter = chapters[n - 1] ?? null
    return {
      ...base,
      label: goldAudit ? `检查第${n}章 · 范例章` : `检查第${n}章`,
      chapter: n,
      title: chapter?.title ?? '',
      targetWords: null,
      points: pointsOf(chapter),
      shard: null,
      material: materialFor(meta.sources, chapter?.source ?? ''),
      paths: {
        chapter: chapterRel(n),
        audit: auditRel(n),
        styleSpec: DOC_PATH.styleSpec,
        outline: DOC_PATH.outline,
        explore: DOC_PATH.explore,
        knowledgeMap: DOC_PATH.knowledgeMap,
        styleLine: DOC_PATH.styleLine,
      },
      chain: null,
      // 票 07：章级审计那一档要那一格「本章不许写什么」（范例章审计那一档**不在**那四份里，
      // 见 `BOUNDARY_DISPATCH_KINDS` 的注释）。⚠️ 「要不要这一位」问的是 `spec.inputs`（同一处声明，
      // `boundary` 那一位从 `BOUNDARY_DISPATCH_KINDS` 派生）——⛔ 这里不再直接比那张档名清单。
      boundary: spec.inputs.includes('boundary') ? boundaryOf() : undefined,
      route: meta.route ?? 'blueprint',
    }
  }

  if (spec.kind === 'material-survey') {
    // 票 `pre-gold-build/01`：这一档的值里带着**机器抽的读物**（每份转换稿的开头 N 字符 ＋ 标题行清单
    // ＋ 那份转换稿的路径）。抽取本身要读盘，而本模块**不碰盘**（同输入同输出）⇒ 由调用点现读现给
    // （`engine.materialSurveyInput`）。缺了就响：不给半份骨架，也不静默派一路「什么读物都没有」的判定
    // ——判定小助手拿不到读物，只会编角色出来。
    const survey = input.survey
    if (survey === null || typeof survey !== 'object' || !Array.isArray(survey.materials)) {
      throw new Error('material-survey 派单需要 survey（{headChars, materials:[{n,file,md,head,headings}]}）——机器抽读物要读盘，归调用点')
    }
    return {
      ...base,
      label: '书级材料判定',
      chapter: null,
      points: [],
      survey,
      paths: { judgment: MATERIAL_JUDGMENT_REL },
      route: meta.route ?? 'blueprint',
    }
  }

  if (spec.kind === 'close-reading') {
    const shards = okMaterialShards(meta.sources)
    const n = Number(input.material)
    const shard = shards.find((entry) => entry.n === n)
    if (shard === undefined) throw new Error(`close-reading 派单的材料号 ${String(input.material)} 不是一份转换完成的材料`)
    const md = `材料/转换稿/${shard.source.md}`
    // ⚠️ 票 `pre-gold-build/02`：这一份的**角色**逐字取自 `brief.parallelReads[].role`——那一份又
    // 逐号取自**判定产物**（`工作区/材料判定.json`，见 `engine.buildStageBrief`）。
    // ⛔ 不在这里回落 `meta.sources[].role`（老值只读、不冒充新事实），也⛔ 不在这里另读一遍盘
    // （本模块「同输入同输出」的纪律：读盘归调用点）。
    const row = (Array.isArray(brief?.parallelReads) ? brief.parallelReads : []).find((entry) => entry.n === n)
    const role = row?.role === undefined ? undefined : row.role
    return {
      ...base,
      label: `精读资料${n}`,
      chapter: null,
      material: { n, file: shard.source.file, md, stem: md.replace(/\.md$/u, ''), section: '', ...(role === undefined ? {} : { role }) },
      paths: { reading: readingRel(n), shard: knowledgeShardRel(n) },
      points: [],
      route: meta.route ?? 'blueprint',
    }
  }

  if (spec.kind === 'alignment') {
    // 票 `knowledge-graph-build/06`：这一档的输入是**全部**知识地图分片（它读全部卡片），值就两样——
    // 分片清单与各材料的转换稿路径（判「同一件事」时按卡的 `anchor` 回读那一段）。
    // ⚠️ **这一档不落盘**：结论（跨材料的边 ＋ 合并）随回灌带回，由主笔当书级参数交工
    // （spec §3「书级那一份走主笔交工参数」）⇒ 它的「该产出的登记行」不能照搬这一步（explore）
    // 那张产物表（表里那两份是**精读**那一档的落点）——照搬就是让机器对小助手说一句假话。
    const shards = okMaterialShards(meta.sources)
    return {
      ...base,
      label: '跨材料对齐',
      chapter: null,
      points: [],
      materialSources: shards.map(({ n, source }) => ({ n, file: source.file, md: `材料/转换稿/${source.md}` })),
      shardPaths: shards.map(({ n }) => knowledgeShardRel(n)),
      registry: { ...base.registry, produce: ALIGNMENT_PRODUCE_NOTE },
      paths: { knowledgeMap: DOC_PATH.knowledgeMap },
      route: meta.route ?? 'blueprint',
    }
  }

  if (spec.kind === 'graph-review') {
    // 票 `knowledge-graph-build/13`：这一档的值**全部**是调用方读盘现算出来的那一份
    //（`readGraphReviewTarget(project)`：两条软读数 ＋ 按把握档排的注意力清单 ＋ standing 上下文）。
    // ⚠️ 缺了它这一档就没有任何可审的东西 ⇒ 响着失败（⛔ 不许静默拼一份「图是空的」出去：
    //    「没有图」这件事也必须是**读出来的事实**，由 `graphReviewTarget(null)` 那条路给
    //    `available:false`，不是由本函数兜底编一个）。
    const review = input.graphReview
    if (review === null || typeof review !== 'object') {
      throw new Error('graph-review 派单需要 graphReview（机器现算的注意力清单与两条软读数，来自 knowledge-graph-review.js）——本函数不读盘、也不替它编一份空图')
    }
    return {
      ...base,
      label: '知识点图审校',
      chapter: null,
      points: [],
      // 票 `knowledge-graph-edges-build/01`（上游 spec §5 落地清单第 5 条）：这一档**此前拿不到任何
      // 转换稿路径**——模板两处早就要求「回原文要定点」，那句话于是**无路径可依**（票 `knowledge-graph-edges/06`
      // §2-4 实撞）。这里照 `alignment` 那一档**同一个映射**补上各材料转换稿路径；⚠️ 渲染那一句
      // **只有一处**（下面 `renderDispatchValues()` 里那一行，两档共用），⛔ 不在这里另写措辞、
      // 也⛔ 不给别的档（其余几档要的是整份材料或一条路径，不是这一格）。
      materialSources: okMaterialShards(meta.sources).map(({ n, source }) => ({ n, file: source.file, md: `材料/转换稿/${source.md}` })),
      review,
      registry: { ...base.registry, produce: GRAPH_REVIEW_PRODUCE_NOTE },
      paths: { knowledgeMap: DOC_PATH.knowledgeMap },
      route: meta.route ?? 'blueprint',
    }
  }

  if (spec.kind === 'questionnaire-author') {
    // 票 `reader-questionnaire-ai-authoring/04`：这一档的值里最承重的那一份是**机器已选好的条目清单**
    // （逐片逐条，用的是 `selectSliceItems` 那一份）——它由**调用方**读盘现算当值传进来
    // （`readQuestionnaireAuthorTarget(project)`），与 `graphReview`／`edgeLedger` 同一条纪律：
    // 本函数不碰盘，没拿到就响（⛔ 不替它编一份空清单）。
    const author = input.questionnaireAuthor
    if (author === null || typeof author !== 'object' || !Array.isArray(author.slices)) {
      throw new DispatchShapeError('questionnaire-author 派单需要 questionnaireAuthor（机器已选好的条目清单）：'
        + '读合并件与取条那一步在调用方做（`actions/chapters.js` 的 `readQuestionnaireAuthorTarget()`）——'
        + '本模块不碰盘，也不替它编一份空清单')
    }
    const total = author.slices.reduce((sum, slice) => sum + (Array.isArray(slice?.items) ? slice.items.length : 0), 0)
    return {
      ...base,
      label: '写读者问卷题面',
      chapter: null,
      points: [],
      author: { ...author, total },
      // ⚠️ 这一档要的是**合并件**（不是知识地图那份共用文档）：子代理的语义来源就是它。
      paths: {
        knowledgeMap: DOC_PATH.knowledgeMap,
        questionnaireText: READER_QUESTIONNAIRE_TEXT_REL,
        intent: READER_QUESTIONNAIRE_INTENT_REL,
      },
      registry: { ...base.registry, produce: QUESTIONNAIRE_AUTHOR_PRODUCE_NOTE },
      route: meta.route ?? 'blueprint',
    }
  }

  if (spec.kind === 'questionnaire-analyze') {
    // 票 `reader-questionnaire-ai-authoring/05`：这一档的**三件注入**由**调用方**读盘／现算当值传进来
    // （`DISPATCH_INPUT_READERS.questionnaireAnalyze`）：① 提示词原文（`assembleDispatchPrompt` 重建）、
    // ② 意图件在不在、③ 回卷件在不在。与 `graphReview`／`edgeLedger` 同一条纪律：本函数不碰盘，
    // 没拿到就响；**三件缺一件也不派**（点名缺哪件，⛔ 不拿半份口径硬读）。
    const analyze = input.questionnaireAnalyze
    if (analyze === null || typeof analyze !== 'object') {
      throw new DispatchShapeError('questionnaire-analyze 派单需要 questionnaireAnalyze（三件注入的读数）：'
        + '读盘与重建提示词那一步在调用方做（`actions/chapters.js` 的 `readQuestionnaireAnalyzeTarget()`）——'
        + '本模块不碰盘，也不替它编一份空口径')
    }
    const injections = questionnaireAnalyzeInjectionReading({ ...analyze, authorPrompt: analyze.authorPrompt })
    if (!injections.ok) throw new DispatchShapeError(injections.message)
    return {
      ...base,
      label: '读读者情况问卷',
      chapter: null,
      points: [],
      analyze: { ...analyze },
      paths: {
        intent: READER_QUESTIONNAIRE_INTENT_REL,
        returned: READER_QUESTIONNAIRE_RETURNED_REL,
        verdict: READER_QUESTIONNAIRE_VERDICT_REL,
      },
      registry: { ...base.registry, produce: QUESTIONNAIRE_ANALYZE_PRODUCE_NOTE },
      route: meta.route ?? 'blueprint',
    }
  }

  if (spec.kind === 'cross-audit') {
    // 票 `knowledge-graph-build/11`：这一档多一份**机器现算的逐边清单**（`prereq` 边，跨章 ＋ 章内
    // 都在），它由**调用方**读盘算好**当值传进来**——`dispatchValues` 的纯函数纪律（不读时钟、不写
    // 随机数、**不碰盘**）不许在这里破：本模块一个字都不读盘，没拿到清单就响（⛔ 不替它编一份空的）。
    const ledger = input.edgeLedger
    if (ledger === null || typeof ledger !== 'object' || typeof ledger.text !== 'string' || typeof ledger.counts !== 'object') {
      throw new DispatchShapeError('cross-audit 派单需要 edgeLedger（机器现算的逐边清单）：读图那一步在调用方做，清单当值传进来（`cross-audit-ledger.js` 的 `readCrossAuditEdgeLedger()`）——本模块不碰盘，也不替它编一份空的')
    }
    const list = chapters.map((_chapter, index) => chapterRel(index + 1))
    // ⚠️ 次序（**形状**那一层）：逐边清单那一格先跑，边界那一格跟在后面。缺件的点名次序在入口
    //（`spec.inputs`：`edgeLedger` 在前、`boundary` 在后），不在这里。
    const boundary = boundaryOf()
    return {
      ...base,
      label: '跨章审计',
      chapter: null,
      points: [],
      chapterPaths: list,
      totalChapters: list.length,
      // ⚠️ 清单**原样带过去**（本模块不改它一个字符、也不从它推导别的值）。
      edgeLedger: ledger,
      // 票 07：那一格「本章不许写什么」（这一档是**逐章核**：全书那一批剔除集合逐章核一遍）。
      boundary,
      paths: { report: productFamilyPath('跨章审计'), outline: DOC_PATH.outline, knowledgeMap: DOC_PATH.knowledgeMap, styleSpec: DOC_PATH.styleSpec, styleLine: DOC_PATH.styleLine },
      route: meta.route ?? 'blueprint',
    }
  }

  // final-check
  const n = Number(input.scope)
  const scope = (Array.isArray(brief?.finalScopes) ? brief.finalScopes : []).find((row) => row.n === n)
  if (scope === undefined) throw new Error(`final-check 派单的分路号 ${String(input.scope)} 不在这一次的分查范围里（finalScopes）`)
  // ⚠️ 报告落点**不许兜底**（复核 N4）：`finalScopes[].report` 逐字来自 brief（`engine.js` 恒设），
  // 缺了就响——原先这里 `?? finalAuditReportRel(n)` 会替它编一个「看起来对」的路径，
  // 与同模块「认不出就点名、不替它编」的口径相反。
  const reportRel = scope.report
  if (typeof reportRel !== 'string' || reportRel.trim() === '') {
    throw new Error(`final-check 派单的第 ${n} 路没有报告落点（finalScopes[].report 逐字来自 brief）——机器不替它编一个路径`)
  }
  return {
    ...base,
    label: `最后检查 第${n}路`,
    chapter: null,
    points: [],
    scope: { n, scope: scope.scope, report: reportRel },
    paths: { report: reportRel },
    route: meta.route ?? 'blueprint',
  }
}

// ── 占位符与值块（拼装与判据共用这一段）────────────────────────────────────

/**
 * 一个 `{{占位符}}` 该填什么。填不出来时返回 `undefined` ⇒ 拼装器报断线（**不许**留半份骨架）。
 *
 * 两条纪律：
 * · 不变量那两个槽位（`{{pure-blueprint: I1-I9}}` / `{{human-readable: …}}`）的**值写在槽位名里**
 *   ——编号随模板走，本模块不另抄一份；按本书路线只填适用的那一半，另一半写明不适用。
 * · 值一律来自 `dispatchValues()`，这里**不做推导**（推导只住在上面那一处）。
 */
export function dispatchSlots(kind, values) {
  const spec = dispatchKindSpec(kind)
  if (spec === null) throw new Error(`未知派单类型：${String(kind)}`)
  const p = values.paths ?? {}
  const mat = values.material ?? null
  /**
   * 源材料认不出形状时，那三个槽位填**一条点名**而不是留空／报断线：
   * 形状是好的（模板一个字没缺），缺的是**这一本书的值**——点名它，让子代理与主笔都看见，
   * 比让整条派单走不下去更诚实（同 points 清空那一路的口径：空着被点名，不拿别的顶上）。
   */
  const materialUnresolved = '（⚠️ 机器认不出本章 source 的形状，这一格要主笔补——见值块里的点名）'
  const matStem = mat === null ? null : (mat.note !== undefined ? materialUnresolved : mat.stem)
  const matMd = mat === null ? null : (mat.note !== undefined ? materialUnresolved : mat.md)
  const matSection = mat === null ? null : (mat.note !== undefined ? materialUnresolved : mat.section)
  const common = {
    'style-spec.md 路径': p.styleSpec,
    'outline.md 路径': p.outline,
    'explore.md 路径': p.explore,
    'knowledge-map.json 路径': p.knowledgeMap,
    'style-line.md 路径': p.styleLine,
  }
  // 票 `shared-layer-form-factor/03`：共用层派发模板改成**形态无关的路径槽**。这些槽只给
  // **真用到它的那一档**（⛔ 不塞进 `common`：一个槽在所有档里都出现，等于把一个错误映射
  // 藏进别的档的模板里），值仍由本书实际路径填；不改变注入面与模板承重段。
  const writingPaths = {
    '知识点清单路径': p.knowledgeMap,
    '章正文路径': p.chapter,
    '本章分片路径': p.write,
  }
  const auditPaths = {
    '审计报告路径': p.audit,
    '章正文路径': p.chapter,
    '知识点清单路径': p.knowledgeMap,
  }
  const kindSlots = {
    writing: {
      '金标准章路径': p.gold,
      '范例章号': Number.isSafeInteger(values.gold) ? String(values.gold) : null,
      '材料文件': matStem,
      '材料/转换稿 材料路径': matMd,
      '本章源材料小节': matSection,
      '本章知识链位置说明': values.knowledgeChain,
      ...common,
      ...writingPaths,
    },
    'gold-writing': {
      '章号': values.chapter === null ? null : String(values.chapter),
      '章标题': values.title ?? null,
      '材料/转换稿 材料路径': matMd,
      '本章源材料小节': matSection,
      '知识链前置小节': values.knowledgeChain,
      ...common,
      ...writingPaths,
      '写作规范路径': p.styleSpec,
      '审计报告路径': p.audit,
    },
    audit: {
      '审计对象：范例章 / 某章 / 附录 / 约束或基础设施文件路径': p.chapter,
      '材料文件': matStem,
      '源文件路径': matMd,
      ...common,
      ...auditPaths,
    },
    'gold-audit': { ...common, ...auditPaths },
    // 票 `pre-gold-build/01`：判定那一档的模板只认这一个槽位（读物与路径都在值块里，
    // 模板不重复它们——值块是机器填的那一份）。
    'material-survey': { '材料判定产物路径': MATERIAL_JUDGMENT_REL },
    'close-reading': {
      ...common,
      '精读细目路径': p.reading,
      '分片路径': p.shard,
      '材料序号': mat === null ? null : String(mat.n),
    },
    // 票 `knowledge-graph-build/06`：对齐那一档的模板**不带占位符**（它要的值都在值块里：
    // 分片清单、各材料转换稿、合并件落点）⇒ 这一格只给共用文档路径，不给它编槽位。
    'alignment': { ...common },
    // 票 `knowledge-graph-build/13`：审校那一档的模板同样**不带占位符**（图、清单、standing
    // 都在值块里给）⇒ 与对齐那一档同形：只给共用文档路径，不编槽位。
    'graph-review': { ...common, '知识点清单路径': p.knowledgeMap },
    // 票 `reader-questionnaire-ai-authoring/04`：写卷那一档的模板同样**不带占位符**（合并件、两个交付
    // 路径、条目清单、字数上限都在值块里给）⇒ 与审校那一档同形：只给共用文档路径，不编槽位。
    'questionnaire-author': { ...common, '知识点清单路径': p.knowledgeMap },
    // 票 `reader-questionnaire-ai-authoring/05`：读卷那一档的模板同样**不带占位符**（三件注入、落盘路径、
    // 交工形状都在值块里给）⇒ 与写卷那一档同形：只给共用文档路径，不编槽位。
    'questionnaire-analyze': { ...common },
    'cross-audit': {
      '全部章路径清单': (values.chapterPaths ?? []).join('、'),
      'N': values.totalChapters === undefined ? null : String(values.totalChapters),
      // 票 `knowledge-graph-build/11`：清单那一格的正文逐字来自 `dispatchValues()` 带过来的值
      // （本模块**不生成清单**：它由调用方读盘现算，见 `cross-audit-ledger.js`）。
      '逐边清单': typeof values.edgeLedger?.text === 'string' && values.edgeLedger.text !== '' ? values.edgeLedger.text : null,
      ...common,
      '跨章审计报告路径': p.report,
      '知识点清单路径': p.knowledgeMap,
    },
    'final-check': { ...common, '终检分查报告路径': p.report },
  }
  return kindSlots[spec.kind] ?? {}
}

/** 一个槽位名是不是「按路线二选一」的不变量槽；是则返回它适用的那一半（不适用时给一句说明）。
 *
 * ⚠️ 左半那两个名字（`pure-blueprint` / `human-readable`）是**模板槽位名**，不是 `meta.route` 的取值——
 * 右边那个比较值才是 route 取值（写点只产 `'human'` / `'blueprint'`；票 `confirm-points-redesign-build/06`
 * 正名前这里写的是 `'human-readable'`，于是「自己也要读」的书拿到的是给 AI 老师用的那一半）。
 * ⛔ 两条词汇别互相借：槽位名随模板走，route 取值随 `meta.route` 走。 */
function routeSlotValue(name, route) {
  const match = /^(pure-blueprint|human-readable)\s*:\s*(.+)$/u.exec(String(name ?? ''))
  if (match === null) return undefined
  const blueprint = match[1] === 'pure-blueprint'
  const mine = blueprint ? route !== 'human' : route === 'human'
  return mine ? match[2].trim() : '（这本书不走这一条路线，看前一半）'
}

/** 把模板里的占位符按本书实际值填掉；填不出来的那个槽位**响着失败**（点名是哪一个）。 */
function fillSlots(kind, shapeText, values) {
  const slots = dispatchSlots(kind, values)
  const filled = String(shapeText ?? '').replace(/\{\{([^{}]*)\}\}/gu, (_all, name) => {
    const raw = name.trim()
    const fromRoute = routeSlotValue(raw, values.route)
    const value = fromRoute !== undefined ? fromRoute : slots[raw]
    if (typeof value !== 'string' || value === '') {
      throw new DispatchShapeError(`派单模板里的占位符「{{${raw}}}」机器不知道怎么填（${dispatchKindSpec(kind).shapeRel}）——`
        + '模板是形状的唯一出处，填不出来的槽位不许静默留半份骨架：要么把它从模板里去掉，要么在 dispatchSlots() 里给它一个逐字来自 brief/meta 的值')
    }
    return value
  })
  const leftover = /\{\{([^{}]*)\}\}/u.exec(filled)
  if (leftover !== null) {
    throw new DispatchShapeError(`填完之后还剩占位符「{{${leftover[1].trim()}}}」——值里不许再带占位符（同输入同输出的前提）`)
  }
  return filled
}

/** 形状断线（模板缺了承重的那一段／占位符填不出来）——**不是**请求参数错，是仓库里的形状出错。 */
export class DispatchShapeError extends Error {
  constructor(message) {
    super(message)
    this.name = 'DispatchShapeError'
  }
}

/** 值块里的一行**点名**（空的／认不出的值各自说清是哪一格，不静默略过）。 */
function missingLine(what, why) {
  return `- ⚠️ ${what}：${why}——机器不替它编，也不拿别的章顶上；请主笔先补（或交办里点出来）。`
}

/** 本章知识点清单那一段（清空 ⇒ **空着被点名**，绝不拿上一章的串）。 */
function pointsLines(values, spec) {
  // 只有写作面两档带 `pointsDerived`（清单取的是生效点集）；审计那两档的清单仍是 outline 原样。
  const derived = values.pointsDerived === true
  if (values.points.length === 0) {
    // 票 `exclusion-flow/02`：全被排除与 outline 真没写点是**两件事**——⛔ 不许合成同一句，
    // 也⛔ 不许复用 `missingLine()` 那句「请主笔先补」：刚说「没有要覆盖的点」又要人补被划掉的，
    // 正是 F2 要治的自相矛盾。
    if (derived && values.pointsRawCount > 0) {
      return [`- 本章知识点清单（points）：outline 第 ${values.chapter} 章的 ${values.pointsRawCount} 条 points `
        + '都不在「本书要写的」那一份里（人已划掉的；有知识地图时，地图外的也不在）——'
        + '本章没有要覆盖的点（这与「outline 没写 points」是两件事）；按 outline 的其余内容正常写，不必把点补回来。']
    }
    return [missingLine('本章知识点清单（points）', `outline 第 ${values.chapter} 章的 points 是空的`)]
  }
  // ⚠️ 措辞按**角色**分档：写的那几档是「写完逐条打钩」，审的那两档是「逐条打钩核有没有交代」——
  // 值块与量法共用是对的，但别让审计员读到「写完」这种写作向的字（复核 N7；「打钩」这个说法
  // 是仓里的通用口径，审计模板自己也用它）。
  const tail = spec.kind === 'audit' || spec.kind === 'gold-audit'
    ? '逐条打钩核这几条有没有交代'
    : '写完逐条打钩'
  // 票 `exclusion-flow/02`：有 live 裁决时清单已经是「本书要写的」那一份 ⇒ 抬头⛔ 不许再说
  // 「逐条来自 outline 第 N 章的 points」（那是假话）；无 live 裁决时逐字不变，审计两档也不跟着改口。
  // ⚠️ 不说「都被人划掉了」：有知识地图时，地图外的 points 也会被交集拿掉（与 `effectiveChapterPoints`
  // 的注释同一个窄处），只点名一个原因就会说假话。
  const source = derived
    ? `逐条来自「本书要写的」那一份（outline 第 ${values.chapter} 章的 points 减去人已划掉的；有知识地图时，地图外的也不在清单里）`
    : `逐条来自 outline 第 ${values.chapter} 章的 points`
  return [
    `- 本章知识点清单（${source}；${tail}）：`,
    ...values.points.map((point) => `  - ${point}`),
  ]
}

/** 源材料定位那一行。 */
function materialLine(material) {
  if (material === null) return []
  if (material.note !== undefined) return [missingLine('本章源材料定位', material.note)]
  const section = material.section === '' ? '' : ` 的「${material.section}」一节`
  return [`- 本章源材料定位：资料${material.n}：${material.section === '' ? '（没写小节）' : material.section} → \`${material.md}\`${section}`]
}

/**
 * 判定小助手的那份**读物**（票 `pre-gold-build/01` 立、票 `confirm-points-redesign-build/12` · R5 改形状）
 * ——每份转换稿一段：序号 ＋ 转换稿路径 ＋ 原件名 ＋ **有界读法**（读哪一段／读哪几行）。
 *
 * ⚠️ **票 12 起正文不再内联**（先例＝ `close-reading` 那一支：机器只给路径，材料正文由小助手自己读）。
 * 换掉的正是原先那两件当值读物（开头 N 字符正文 ＋ 整份标题行清单）；**界没有变**：
 * · 读法①＝读**开头 `MATERIAL_SURVEY_HEAD_CHARS` 个字符**为止（原先机器就是**按字符数截**这一段）；
 * · 读法②＝读整份文件的 `^#{1,6} ` **标题行**（⛔ 不许把界收到前 N 字符那一截里，深处的标题行原先靠它带出来）。
 * ⚠️ 代价如实写：**多一趟读盘 × N 份**。收益＝派单件不再随源数增长。
 */
function surveyLines(values) {
  const rows = Array.isArray(values.survey?.materials) ? values.survey.materials : []
  if (rows.length === 0) {
    return [missingLine('材料判定的读物（每份转换稿的路径 ＋ 有界读法）', '本次一份转换完成的源都没有——零源书不派这一路')]
  }
  const headChars = Number.isSafeInteger(values.survey?.headChars) ? values.survey.headChars : MATERIAL_SURVEY_HEAD_CHARS
  // ── 票 `confirm-points-redesign-build/12` · R5（先例＝ `close-reading` 那一支）────────────────
  // 原先这里把每份转换稿的**开头 N 字符正文**与**整份标题行清单**当值内联进派单件（随书增长：
  // 一份一段，N 份就是 N 段）。票 12 起改成「**路径 ＋ 有界读法**」——正文由小助手自己按界去读。
  // ⚠️ **代价如实写**：多一趟读盘 × N 份。收益＝派单件不随源数增长（机器原先截那 N 段，
  // 截了还是要传，传了还是占上下文）。
  // ⚠️ **界就是机器原先那两件读物各自的界**：①开头 `headChars` 个**字符**（机器原先按字符数截的
  // 就是这个界，⛔ 不是机器挑的重点）；②整份的 `^#{1,6} ` 标题行（**不限前 N 字符**——深处的标题行
  // 原先就靠这一件带出来，界不能收）。两半缺一，这条指针就会变成「读一次爆一次」。
  const lines = [`- 机器**不替你抽转换稿正文**了（票 \`confirm-points-redesign-build/12\` · R5）：读物是每份转换稿的**路径 ＋ 有界读法**，自己按下面的界去读（**多一趟读盘**是这条的代价；下面都是**书夹相对**路径，先 cd 到本书夹或按它拼绝对路径）：`]
  for (const row of rows) {
    lines.push(`  - 资料${row.n}：转换稿 \`${row.md}\`（原件 ${row.file}）`)
    if (row.unreadable === true) {
      lines.push(`    - ⚠️ 机器读不出这份转换稿（\`${row.md}\`）——按这条路径自己读它；确实读不出来就照实说。`)
      continue
    }
    lines.push(`    - 有界读法①（判角色够用就停）：读它的**开头 ${headChars} 字符**为止。`)
    lines.push(`    - 有界读法②（要看目录时）：读它的 \`^#{1,6} \` **标题行**——整份文件的标题行都要（第 ${headChars} 字符之后的不许漏），⛔ 别把正文整份读进来。`)
  }
  lines.push('  - ⛔ 抽不到标题行的情形不再由机器替你表态：自己读了才下结论，⛔ 不许假装有目录（兜底＝上面的路径 ＋ 读法①）。')
  return lines
}

/**
 * 值块的正文行（**拼装与判据共用**：两处不会各写一套说法）。
 *
 * @param {string} kind
 * @param {object} values {@link dispatchValues} 的返回
 * @returns {string[]} 行数组（不含块标题）
 */
export function dispatchValueLines(kind, values) {
  const spec = dispatchKindSpec(kind)
  if (spec === null) throw new Error(`未知派单类型：${String(kind)}`)
  const lines = [
    `- 派单类型：${values.kindLabel}（kind=${spec.kind}）｜这一档属于「${spec.stage}」那一段`,
    `- 模板（形状的唯一出处）：resources/${spec.shapeRel}${spec.section === undefined ? '' : ` 的「${spec.section}」那一节`}`,
  ]
  if (values.resourceRoot !== null && values.resourceRoot !== undefined) {
    lines.push(`- 方法论根目录（本机绝对路径）：${values.resourceRoot}`)
  }
  if (typeof values.dir === 'string' && values.dir !== '') {
    lines.push(`- 本书夹绝对路径：${values.dir}（下面所有 \`工作区/…\`、\`材料/…\` 的相对路径都相对它拼——先 cd 到它，或按它拼绝对路径）`)
  }
  if (values.chapter !== null && values.chapter !== undefined) {
    lines.push(`- 章号：第 ${values.chapter} 章`)
    if (typeof values.title === 'string' && values.title !== '') lines.push(`- 章标题：${values.title}`)
    if (Number.isFinite(values.targetWords)) lines.push(`- 目标字数：${values.targetWords} 汉字（**兜底下限**——低于它交工会被拒收；达到或超过都放行，不设上限）`)
  }
  if (Number.isSafeInteger(values.shard)) {
    lines.push(`- 分片号 MM：${String(values.shard).padStart(2, '0')}（你这一路只写自己的分片，别碰别人的号）`)
  }
  if (values.chapter !== null && values.chapter !== undefined) lines.push(...pointsLines(values, spec))
  // 票 `reader-cognition-boundary-build/07`：那一格「本章不许写什么」（整批剔除集合 ＋ 逐条点名）。
  // ⚠️ 渲染只住一处（`reader-boundary.js`）：本行不做推导、也不另写一份措辞。
  // ⚠️ `gold-writing` 那一档多一句**下游成文**的指令（`style-spec` 两格）——那一句也住在同一处。
  if (values.boundary !== undefined && values.boundary !== null) {
    lines.push(...readerBoundaryDispatchLines(values.boundary, { kind: spec.kind }))
    if (spec.kind === 'gold-writing') lines.push(STYLE_SPEC_BOUNDARY_INSTRUCTION)
  }
  if (values.material !== null && values.material !== undefined) {
    if (spec.kind === 'close-reading') {
      lines.push(`- 材料号 NN：${values.material.n}（原件 ${values.material.file}）`)
      lines.push(`- 转换稿路径：\`${values.material.md}\``)
      // 票 `pre-gold-build/02`：这一份的**角色**由机器从判定产物取来给到派单里（票 11 §6 末那条
      // 「它的 `role` 从判定结果来（派单里给）」）。⚠️ 判定产物里没有这一号时**照实说**，
      // ⛔ 不回落 `meta`、⛔ 不替它编一个角色。
      lines.push(values.material.role === undefined
        ? '- 这份材料的角色：**书级材料判定里还没有这一号**（判定产物里没有它）——先按你自己读到的判断，别去别处找角色。'
        : `- 这份材料的角色（**来自探查段开头的书级材料判定**，由机器随派单给你）：${values.material.role}——你这一份读下来若有不同看法，在回灌里当异议提。`)
    } else {
      lines.push(...materialLine(values.material))
    }
  }
  if (typeof values.chain === 'string' && values.chain !== '') lines.push(`- 本章在知识链中的位置：${values.chain}`)
  if (spec.kind === 'material-survey') lines.push(...surveyLines(values))
  if (typeof values.scope === 'object' && values.scope !== null) {
    lines.push(`- 分路号：第 ${values.scope.n} 路 —— ${values.scope.scope}`)
  }
  if (Number.isSafeInteger(values.totalChapters)) lines.push(`- 全书章数：${values.totalChapters} 章`)
  // 票 `knowledge-graph-build/06`：对齐那一档的两样输入（全部卡片在哪、判「同一件事」时去哪回读原文）。
  // ⚠️ 值一律来自 `dispatchValues()`（这里的 `shardPaths` / `materialSources` 只有它会给），本行不做推导。
  // ⚠️ **`materialSources` 今天两档给**：`alignment`（判「同一件事」）与 `graph-review`
  // （判一条边的**方向**时同样要定点回原文——票 `knowledge-graph-edges-build/01` 补的那一格）。
  // 两档**共用这一行渲染**（同一句话），⛔ 不按档各写一份。
  if (Array.isArray(values.shardPaths) && values.shardPaths.length > 0) {
    lines.push(`- 全部知识地图分片（**逐片都读**，你的输入就是这些卡片）：${values.shardPaths.map((rel) => `\`${rel}\``).join('、')}`)
  }
  if (Array.isArray(values.materialSources) && values.materialSources.length > 0) {
    lines.push(`- 各材料转换稿（判「同一件事」时按卡的 \`anchor\` 行段回读那一段，⛔ 别整份读）：${values.materialSources.map((row) => `资料${row.n} → \`${row.md}\``).join('、')}`)
  }
  // 票 `knowledge-graph-build/13`：审校那一档的三样定向输入（图的落点 ＋ 两条软读数 ＋ 把握档清单）。
  // ⚠️ 渲染只住一处（`knowledge-graph-review.js`）：本行不做推导、也不另抄一份清单格式。
  if (values.review !== null && values.review !== undefined) {
    lines.push(...graphReviewValueLines(values.review, { knowledgeMapRel: DOC_PATH.knowledgeMap }))
  }
  // 票 `reader-questionnaire-ai-authoring/04`：写卷那一档的条目清单与三条字数上限。
  // ⚠️ 渲染只住一处（`questionnaire-author.js`）：本行不做推导、也不另抄一份清单格式。
  if (values.author !== null && values.author !== undefined) {
    lines.push(...questionnaireAuthorValueLines(values))
  }
  // 票 `reader-questionnaire-ai-authoring/05`：读卷那一档的三件注入与交工形状。
  // ⚠️ 渲染只住一处（`questionnaire-analyze.js`）：本行不做推导、也不另抄一份口径。
  if (values.analyze !== null && values.analyze !== undefined) {
    lines.push(...questionnaireAnalyzeValueLines(values))
  }
  // 票 `knowledge-graph-build/11`：跨章审计那一档的逐边清单——
  // ⚠️ 条数那一行是**照抄面**（判「通过」时逐字抄进报告，机器拿它跟自己现算的数对账），
  // 清单正文进模板的 `{{逐边清单}}` 那一格（值一律来自 `dispatchValues()`，本行不做推导）。
  if (values.edgeLedger !== undefined && values.edgeLedger !== null) {
    const counts = values.edgeLedger.counts
    lines.push(`- 逐边清单（机器现算的 \`prereq\` 边，逐条见模板「逐边清单（机器现算）」那一节）：`
      + `共 ${counts.total} 条（跨章 ${counts.across}／章内 ${counts.within}），其中章序倒置 ${counts.inverted} 条`)
    lines.push(`- 「知识递进链」判「通过」时逐字照抄的交代行：${ledgerClaimLine(counts)}`)
  }
  const paths = values.paths ?? {}
  const pathLines = []
  if (typeof paths.write === 'string') pathLines.push(`  - 你写这一份：\`${paths.write}\``)
  if (typeof paths.reading === 'string') pathLines.push(`  - 你写这一份（细目）：\`${paths.reading}\``)
  if (typeof paths.shard === 'string' && spec.kind === 'close-reading') pathLines.push(`  - 你写这一份（知识地图分片）：\`${paths.shard}\``)
  if (typeof paths.judgment === 'string' && spec.kind === 'material-survey') pathLines.push(`  - 你写这一份（材料判定）：\`${paths.judgment}\``)
  if (typeof paths.chapter === 'string' && spec.kind !== 'cross-audit') pathLines.push(`  - 被写的章正文（**由机器从分片拼**，你不许写）：\`${paths.chapter}\``)
  if (typeof paths.audit === 'string') pathLines.push(`  - 你的审计记录（你自己落盘）：\`${paths.audit}\``)
  if (typeof paths.report === 'string') pathLines.push(`  - 你写这一份（报告）：\`${paths.report}\``)
  if (Array.isArray(values.chapterPaths)) pathLines.push(`  - 全部章正文（一位都不能少）：${values.chapterPaths.map((rel) => `\`${rel}\``).join('、')}`)
  if (pathLines.length > 0) lines.push('- 落盘路径（逐字来自产物清单）：', ...pathLines)
  lines.push(`- 你该读的登记行：${values.registry.read}`)
  lines.push(`- 你该产出的登记行：${values.registry.produce}`)
  lines.push(values.note === ''
    ? '- 主笔的叮嘱：（无额外叮嘱——照上面的值与后面的模板照做）'
    : `- 主笔的叮嘱（判断在他那里，形状在上面那一份模板里）：${values.note}`)
  return lines
}

/** 值块标题（逐字是形状的一部分；判据按它认「值块在不在、有没有两份」）。 */
export const VALUES_BLOCK_HEAD = '【本书实际值 · 机器代填】'

/** 值块与模板之间的分隔线（逐字是形状的一部分）。 */
const VALUES_BLOCK_TAIL = '（分隔线以下 = 派发模板原文，形状的唯一出处；模板里的占位符已由机器按上面的值填好）'

/** 值块全文（拼装与判据共用）。 */
export function renderDispatchValues(kind, values) {
  return [
    VALUES_BLOCK_HEAD,
    ...dispatchValueLines(kind, values),
    '',
    VALUES_BLOCK_TAIL,
  ].join('\n')
}

// ── 拼装（纯函数：形状 ＋ 值 → 一份 prompt，逐字确定）──────────────────────────

/**
 * 形状 ＋ 本书实际值 → 整份派单 prompt。**同输入同输出**。
 *
 * @param {string} kind `writing` / `gold-writing` / `audit` / `gold-audit` / `close-reading` / `alignment` / `graph-review` / `cross-audit` / `final-check`
 * @param {{shapeText: string, values: object}} input `shapeText` 是模板原文（终检那一档是 §十 那一节）
 * @returns {string}
 * @throws {DispatchShapeError} 模板缺了承重的锚（抽掉那段）／占位符填不出来
 */
export function assembleDispatchPrompt(kind, input = {}) {
  const spec = dispatchKindSpec(kind)
  if (spec === null) throw new Error(`未知派单类型：${String(kind)}`)
  const values = input.values
  if (values === null || typeof values !== 'object') throw new Error('assembleDispatchPrompt 需要 values（dispatchValues() 的那一份）')
  const shapeText = String(input.shapeText ?? '')
  const missing = spec.anchors.filter((anchor) => !shapeText.includes(anchor))
  if (missing.length > 0) {
    throw new DispatchShapeError(`派单模板缺口：${spec.shapeRel} 里找不到这些承重段——${missing.map((m) => `「${m}」`).join('、')}。`
      + '模板是这一档形状的唯一出处，缺了它机器不许给半份骨架（改模板，别在插件里补一份）')
  }
  return `${renderDispatchValues(kind, values)}\n\n────────────────────────────────────────────\n\n${fillSlots(kind, shapeText, values)}\n`
}

// ── 判据（那把尺子；坏形状喂进**同一段**它，不另写一份「相似的量法」）──────────────

/**
 * 判一份派单 prompt 是不是**那份模板 ＋ 那批值的确定函数**。返回问题清单，空数组＝站得住。
 *
 * ⚠️ **扫面非空下限**（防空跑）：形状为空、值块为空时后面几句都恒真，所以先断「形状有内容」
 * 「值块恰一份」「锚一个不少」；反证正是把「抽掉那段锚」「清空 values」喂回**这一段**。
 *
 * @param {string} prompt 拼出来的整份 prompt
 * @param {{kind: string, values: object, shapeText: string}} input
 * @returns {string[]} 逐条点名的问题
 */
export function judgeDispatchPrompt(prompt, input = {}) {
  const problems = []
  const spec = dispatchKindSpec(input.kind)
  if (spec === null) return [`未知派单类型：${String(input.kind)}`]
  const text = String(prompt ?? '')
  const shapeText = String(input.shapeText ?? '')
  if (text.trim() === '') return ['派单正文是空的（防空跑：空正文上「模板在不在」恒真）']
  if (shapeText.trim() === '') problems.push(`形状出处是空的：${spec.shapeRel} 读不出内容`)

  // ① 模板的承重段一个不少（抽掉哪一段就点哪一段的名）。
  for (const anchor of spec.anchors) {
    if (!text.includes(anchor)) problems.push(`缺模板承重段「${anchor}」（${spec.shapeRel}）——那份模板是形状的唯一出处`)
  }
  // ② 模板**自己声明的那几个槽位**一个不剩（留一个就是半份骨架）。
  // ⚠️ 扫的是「形状里出现过的 `{{…}}` 原文」，**不是「正文里任何 `{{`」**：书里的值本身可能带花括号
  //（讲模板语法的教材就举 `{{ name }}` 当例子），拿「任意花括号」当判据会对好 prompt 恒误报；
  // 而「模板缺口」在 `fillSlots` 那一步就抛了，本来也走不到这里（复核 N5）。
  const slotTokens = [...new Set(shapeText.match(/\{\{[^{}]*\}\}/gu) ?? [])]
  const stillThere = slotTokens.find((token) => text.includes(token))
  if (stillThere !== undefined) problems.push(`正文里还剩模板的槽位「${stillThere}」——那一格没填上（半份骨架）`)
  // ③ 值块恰一份（两份＝机器和主笔各写了一份值，读者不知道信哪份）。
  // ⚠️ **围栏代码块里的值不算一个值块**（票 `reader-questionnaire-ai-authoring/05`）：
  // `questionnaire-analyze` 那一档把**当初写卷那份派单原文**当值嵌进来（它是确定性重建，
  // 自己就带一份值块）——那不是「第二个写点」，是**值**。所以数之前先把围栏块剔掉；
  // 机器自己那一份值块永远不在围栏里。⚠️ 窄处：有人把真值块写进一个围栏块里，这一句数不出来。
  const unfenced = text.replace(/```[^\n]*\n[\s\S]*?```/gu, '')
  const blocks = unfenced.split(VALUES_BLOCK_HEAD).length - 1
  if (blocks !== 1) problems.push(`值块「${VALUES_BLOCK_HEAD}」出现 ${blocks} 次（应恰好 1 次）`)
  // ④ 本章的值逐字在内（读者拿到的就是这一章那一份，不是邻章的）。
  const values = input.values
  if (values === undefined || values === null) {
    problems.push('判据没拿到 values——「值逐字在内」这一句会空转')
    return problems
  }
  for (const line of dispatchValueLines(input.kind, values)) {
    if (!text.includes(line)) problems.push(`值块里少了机器代填的那一行：「${line}」`)
  }
  return problems
}
