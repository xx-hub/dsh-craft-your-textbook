/**
 * 造书工作台 · 书级袋子的**值**（票 `depth-round-3/02`）
 *
 * `card-book.js` 回答「递给每一张卡的那本书**有哪些键**」（声明 ＋ 构造器，两个方向都当场抛）。
 * 本模块回答另一半：**那些键的值从哪来**——`deriveCardBook({ snapshot, shellState, wiring })`
 * 一处算完，生产壳（`src/client-entry.js`）与画廊的下钻适配器（`dev/gallery/cards.js`）
 * 递**同一份**三个输入里的东西，谁也不许再自写一份派生。
 *
 * 它治的病（票面逐字）：键已共用（`gallery-realign/01`），而**值仍两份**——画廊自写
 * `workKnown: workPayload !== null`／`processToken: JSON.stringify({ segments })`／
 * `goldDraftVersion: … ?? 1`，壳写的是 `book.work.known`／上一次成功 process 提交的 token／
 * `coreData.goldDraftVersion`。**同名不同源** ⇒ 画廊可以整屏「看着对」而值是假的
 * （`ADR-0035` 的 `## Amendment · 2026-10-18` 把这一格写成窄处的直接来源）。现在三条派生
 * 只此一处，壳与画廊各自只摆**输入**。
 * ⚠️ 票 `ui-display-redesign/20`：原先还有一条 `deletingId ← shellState.deletingId === projectId`
 * ——删书改一步之后卡片不再消费确认态，那一格随 `onDeleteStart` 一起退役（底栏小条自己的
 * 两步确认仍走壳里的 `deletingId`，不进卡片袋）。
 *
 * ## 三个输入为什么必须分开命名（上一轮报告在这里错过一次）
 *
 * 袋里的值来自**三个不同地方**，而且 `shellState` 那几位**在快照里根本不存在**
 * （`createBookProjection` 只收 `sessionId`／`source`／`scheduler`）——不显式递进来就只能靠
 * `wiring` 夹带，那才是真正的隐式 interface：
 *
 *   · `snapshot`   —— `createBookProjection(...).snapshot()` 那一份**书级只读数据**
 *     （`core.data` / `work` / `process` / `projectId`）。壳给真的；画廊按夹具造一份
 *     （`dev/gallery/cards.js` 的 `snapshotOfRoutes`，它只把夹具回包摆成投影那个形状）。
 *   · `shellState` —— 只有壳（或夹具的等价物）知道的那几位：`busy`、
 *     `contextPercent`、`browsingKey`、`gateOpen`、`projector`，
 *     以及壳级派生 `deriveBookViewFacts` 那八格里**进袋的七格**（`checks`／`aiReport`／
 *     `lastEvent`／`needsConfig`／`pendingStageLabel`／`progressDetail`／`stall`）。
 *   · `wiring`     —— 回调组（`postAction`／`onDecide`／各 `on*`）与产物读取那三件
 *     （`readArtifact`／`fetchText`／`downloadHref`）。壳给真实接线；画廊给 NOOP ＋ 夹具桩 fetch。
 *
 * ⚠️ **`shellState` 的键逐个 `Object.hasOwn` 地核**（`wiring` 同）：漏一个键时值会读成
 * `undefined`，而 `createCardBook` 那道闸**认显式 `undefined` 为合法**（＝「这一位没有」）——
 * 于是漏传在这里是静默的。所以本模块自己再加一道：缺谁点名谁（与构造器同一族的抛）。
 * 反过来「多给了键」不抛：多给的键进不了袋子（本模块只按下面那两张名单取），而拼错的名字
 * 一定表现为**名单里的某个键不在**——那一条被点名。
 *
 * ## 它自己算的几条（其余是原样递下去）
 *
 *   · `workKnown`        ← `snapshot.work.known`（ready 与 stale 都算已知，`ADR-0021` 决策 11/16）
 *   · `processSegs`      ← `snapshot.process.data.segments`
 *   · `processToken`     ← `shellState.processToken`（**原样**）。它是「最近一次成功、仍属当前身份、
 *     且**规范化内容确实变化**的 process 提交」的**推进计数**，判据住在壳那枚 latest-ref 里
 *     （`src/client-entry.js` 的「process commit token」那一段：引用不等 ＋ 内容不同 ⇒ ＋1）。
 *     ⚠️ **不由本模块按内容签名**（收口 review A1）：`JSON.stringify(process.data)` 当 token 值是
 *     另一条判据（它不认成功／身份两格），票 `depth-round-3/02` 是**纯等价重构**，这里只许原样收、
 *     ⛔ 不许另算一份。画廊给夹具等价物（静态一屏没有新提交 ⇒ 0／1 那一档），值域与壳同为计数。
 *   · `goldDraftVersion` ← `snapshot.core.data.goldDraftVersion`（`normalizeCore` 已把它归一到 ≥1 的整数）
 *   · 其余：`core.data` / `work` / `process` 那几格按 `src/client-entry.js` 原来逐格写死的同一口径取
 *     （空数组常量、`?? null`、以及 `goldAudit` **有意留住的 `undefined` 第三态**——它驱动一颗键的能力，
 *     见 `src/workbench-projection.js` 的 `normalizeCore`；判成 `null` 就是让卡替**文件**下断言）。
 *
 * ## 它**不**管什么（边界照实说）
 *
 *   · ⛔ **不验值的对错**：`snapshot` 里的值对不对、`shellState` 那几位是不是当下真的——那是各自
 *     调用点的事（生产侧由整壳渲染判据兜；画廊侧归那条链上适配器判据的**值形状**那一段）。
 *   · ⛔ **不认识 `view-rules`**：`deriveBookViewFacts` 那七格由调用方算好递进来（见上）。
 *   · ⛔ **不改任何界面行为**：生产侧是**等价改写**（递出去的键一个不多、一个不少，取值逐格照旧）。
 *
 * ## 与票面那句「零 import 的中性件」的关系（照实说）
 *
 * 本模块**零外部依赖**：不 import react／node 内建／任何界面模块——生产壳（客户端包 `lib/client.js`）
 * 与画廊（开发期件）import 的是同一份，这条与 `card-book.js` ／ `card-view.js` 同一条中性纪律。
 * ⚠️ 它有一条 **import**：`./card-book.js`（它要 `createCardBook` 造那个冻结的袋子 ＋ `CardBookError`）。
 * 若把票面那句照字面读成「一条 import 都不许有」，它与「返回 `createCardBook` 造的冻结袋子」这条
 * 写死的接口**自相矛盾**（构造器住在 `card-book.js`）；本票按「零外部依赖」这一读法落，
 * `card-book.js` 自己仍然**字面**零 import（由 `test/test-card-view.mjs` 那一条钉着）。
 */

import { CardBookError, createCardBook } from './card-book.js'

// 与生产壳同口径的几个「没有」常量（`src/client-entry.js` 的 `NO_*`）：`core`／`work`／`process`
// 还没到时给**稳定的空**，而不是每次现造一个数组（渲染层按引用记忆化时那会是无谓的换身份）。
const NO_EVENTS = Object.freeze([])
const NO_PENDING_REVIEWS = Object.freeze([])
const NO_CHAPTER_STATUS = Object.freeze([])
const NO_GOLD_DRAFTS = Object.freeze([])
const NO_WORK_FILES = Object.freeze([])
const NO_SEGMENTS = Object.freeze([])

/**
 * 从 `shellState` **同名**递进袋子的键（唯一声明处：下面 `deriveCardBook` 按它取名）。
 *
 * ⚠️ 加一个书级键时：`card-book.js` 的 `CARD_BOOK_GROUPS`（键名）＋ 这里（值从哪一组来，或者下面
 * 那几条派生之一）＋ 两侧各自的值来源（`src/client-entry.js` ／ `dev/gallery/cards.js`）。
 */
const SHELL_STATE_KEYS = Object.freeze([
  // ── 只有壳知道的那几位
  'busy',
  'contextPercent',
  'runningSubagentCount',
  'browsingKey',
  'gateOpen',
  'setGateOpen',
  'autoSplit',
  'graphDropped',
  'predrawnLowerBoundary',
  'readerQuestionnaireSaved',
  'projector',
  // ⚠️ `processToken` 是**壳推进的那一位**（不是从快照内容派生的）：原样收、原样递（收口 review A1）。
  'processToken',
  // ── 壳级派生 `deriveBookViewFacts` 那八格里、进袋的七格（算在壳那一侧，本模块不认识 view-rules）
  'checks',
  'aiReport',
  'lastEvent',
  'needsConfig',
  'pendingStageLabel',
  'progressDetail',
  'stall',
])

/** 从 `wiring` **同名**递进袋子的键（回调组 ＋ 产物读取那三件）。 */
const WIRING_KEYS = Object.freeze([
  'postAction',
  'onDecide',
  'onRollback',
  'onAddPattern',
  'onSetKnobs',
  'onSkipStep',
  'onUpload',
  'onConvert',
  'onReplaceSource',
  'onRemoveSource',
  'onDemoNext',
  'onResume',
  'onPreview',
  'onApprove',
  'onReject',
  // 票 `ui-display-redesign/20`：删书一步 ⇒ 只留真正发动作的那颗回调。
  'onDeleteConfirm',
  'confirmExplore',
  'confirmGoals',
  'confirmOutline',
  'onGraphVerdict',
  'onOpenReaderQuestionnaire',
  'onViewReport',
  'onSuggestWords',
  'readArtifact',
  'fetchText',
  'downloadHref',
  'onView',
  'submitReview',
  'onApproveAll',
  'onViewRow',
  'onPickStep',
  'onPickPhase',
  'openInSidebar',
  'onDeepModify',
  'onDeepUndo',
  'onBackfillGraph',
])

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

/** `snapshot` 必须是**投影那一份**：少了这几格说明递进来的不是它（而不是「这本书还没有这些」）。 */
const PROJECTION_REQUIRED_FIELDS = Object.freeze(['projectId', 'core', 'work', 'process'])

/** 缺键就点名的那一道闸（`source` 里没有 `keys` 里的哪一个就抛，与构造器同一族的 `CardBookError`）。 */
function takeNamed(target, source, keys, label) {
  const missing = keys.filter((key) => !Object.hasOwn(source, key))
  if (missing.length > 0) {
    throw new CardBookError(
      `书级袋子的值：${label} 里没有给这些键——${missing.join('、')}。它们由 `
        + `src/ui/card-book-derive.js 的 ${label} 名单声明、本模块逐个按名取；`
        + `⚠️ 漏传在这里**不是**「这一位没有」（那要显式写 undefined）：漏传的值会读成 undefined，`
        + `而构造器认显式 undefined 为合法，于是它会静默地传下去。补上，或从名单里去掉。`,
    )
  }
  for (const key of keys) target[key] = source[key]
}

/**
 * 从三个命名输入算出那张冻结的书级袋子（键名表见 `CARD_BOOK_KEYS`，构造与两道闸见 `createCardBook`）。
 *
 * @param {object} input
 * @param {object} input.snapshot `createBookProjection(...).snapshot()`（或画廊照夹具造的同形状一份）：
 *   书级只读数据 ＋ `projectId`。
 * @param {object} input.shellState 只有壳知道的那几位（原值；进袋的只有下面 `SHELL_STATE_KEYS` 那些键）。
 * @param {object} input.wiring 回调组与产物读取那三件。
 * @returns {object} 冻结的袋子（键集与顺序＝`CARD_BOOK_KEYS`）。
 */
export function deriveCardBook({ snapshot, shellState, wiring } = {}) {
  if (!isRecord(snapshot)) {
    throw new CardBookError(
      'deriveCardBook 的 snapshot 必须是 createBookProjection(...).snapshot() 那一份（书级只读数据）；'
        + `实得 ${snapshot === null ? 'null' : typeof snapshot}。`,
    )
  }
  const missingFields = PROJECTION_REQUIRED_FIELDS.filter((field) => !Object.hasOwn(snapshot, field))
  if (missingFields.length > 0) {
    throw new CardBookError(
      `deriveCardBook 的 snapshot 缺这几格——${missingFields.join('、')}。`
        + '它不是投影那一份 snapshot（`src/client-entry.js` 传的是 `useSyncExternalStore` 读出来的 `book`；'
        + '画廊那一份在 `dev/gallery/cards.js` 的 `snapshotOfRoutes`）：别把 `snapshot.core` 或 `core.data` 递进来。',
    )
  }
  if (!isRecord(shellState)) {
    throw new CardBookError(
      'deriveCardBook 的 shellState 必须是「只有壳知道的那几位」那个对象（busy／contextPercent／'
        + `browsingKey／gateOpen／…）；实得 ${shellState === null ? 'null' : typeof shellState}。`,
    )
  }
  if (!isRecord(wiring)) {
    throw new CardBookError(
      'deriveCardBook 的 wiring 必须是回调组那个对象（postAction／onDecide／各 on*／readArtifact…）；'
        + `实得 ${wiring === null ? 'null' : typeof wiring}。`,
    )
  }

  const core = isRecord(snapshot.core) ? (snapshot.core.data ?? null) : null
  const work = isRecord(snapshot.work) ? snapshot.work : null
  const process = isRecord(snapshot.process) ? snapshot.process : null
  const meta = core === null ? null : core.meta
  const workData = work === null ? null : (work.data ?? null)
  const processData = process === null ? null : (process.data ?? null)

  const values = {
    // ── 书级只读数据（逐格照 `src/client-entry.js` 那份等价写法取）
    meta,
    gate: core === null ? null : core.gate,
    events: core === null ? NO_EVENTS : core.events,
    exploreSummary: core === null ? null : core.exploreSummary,
    knowledgeMapText: core === null ? null : core.knowledgeMap,
    outlineText: core === null ? null : core.outline,
    // 检查记录原文：`undefined` 是**有意留住的第三态**（＝还没读到），不是漏格——
    // `normalizeCore` 的注释写着为什么（它驱动 `goldDisplayPeriod` 那颗键的能力）。
    goldAuditText: core === null ? undefined : core.goldAudit,
    goldDrafts: core === null ? NO_GOLD_DRAFTS : core.goldDrafts,
    goldDraftVersion: core === null ? 1 : core.goldDraftVersion,
    // 产物对账（`/textbook/process` 的 `shape`）：`null` ＝ 老书没有清单／读侧兜底判它不可谈。
    shapeReport: processData === null ? null : processData.shape,
    // ⚠️ **未过滤**的 `meta.styleNotes`（壳里那个同名局部量是给 `StylePanel` 用的 active 过滤版）：
    //   卡读的是**全量**那份，且契约**不给**它缺省（消费点自己写 `?? []`）——所以这里原样递。
    styleNotes: meta === null ? undefined : meta.styleNotes,
    knowledgeMapExclusions: core === null ? null : core.knowledgeMapExclusions,
    readerQuestionnaireReturn: core === null ? null : core.readerQuestionnaireReturn,
    chapterStatus: core === null ? NO_CHAPTER_STATUS : core.chapterStatus,
    pendingReviews: core === null ? NO_PENDING_REVIEWS : core.pending.reviews,
    maxConcurrentSubagents: meta === null ? null : (meta.maxConcurrentSubagents ?? null),
    // ── 产物清单与分段（`ADR-0021` 决策 11/15/16：`known` 恒在 ready 与 stale 时为真）
    workFiles: workData === null ? NO_WORK_FILES : workData.files,
    workKnown: work !== null && work.known === true,
    processSegs: processData === null ? NO_SEGMENTS : processData.segments,
    // `processToken` **不在这里**算：它是 `shellState` 那一位（壳那枚 ref 的推进计数，原样递进袋子），
    // 见上面 `SHELL_STATE_KEYS` 与文件头那条。⛔ 不许按 `processData` 内容签名。
  }

  takeNamed(values, shellState, SHELL_STATE_KEYS, 'shellState')
  takeNamed(values, wiring, WIRING_KEYS, 'wiring')

  return createCardBook(values)
}
