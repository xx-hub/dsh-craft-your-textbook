/**
 * 工作台书投影（内部 module，Candidate 05 / ADR-0021）。
 *
 * 公开 interface 恰为六方法：snapshot / refresh / selectProject / capture / isCurrent /
 * subscribe。source 与 scheduler 是 module 的内部 adapter，不进 Workbench props、宿主 inject
 * 或 public exports。本 module 无 React 依赖，也不 import React——它只拥有当前书身份、四条
 * 核心读通道（projects/events/work/process）、订阅拥有的 2 秒轮询、readiness 与请求顺序；
 * 界面、业务动作与渲染路由仍由 WorkbenchView 拥有（ADR-0021 决策 1）。
 *
 * 同步面：snapshot() / capture() / isCurrent() / subscribe()。
 * 异步面：refresh() 与两种 selectProject(...) 语义都返回 Promise<snapshot>；transport/http/
 * malformed 属预期 source 结果（resolve 并提交结构化错误），not-found/not-owned 属预期身份
 * 失效（在 clear commit 之后 resolve，不显示读取错误），非法参数属 programmer error（throw）。
 *
 * ## 票 `ui-systematic-fixes/06` 的两件事
 *
 * 1. **身份失效有个出口**（用户故事 24）。not-found/not-owned 那条路按 ADR-0021 决策 13/16
 *    清身份、重新发现、**不留读取错误**——于是界面上从前一个字都没有。这里加一个**注入回调**
 *    `onIdentityLost(info | null)`：失效时把 `{ projectId, kind, message }` 送出去，重新读回
 *    任何一本书（或调用方显式发起一次 refresh/selectProject）时送 `null`。
 *    ⛔ **不进 snapshot**：`test-ui-state-gallery-shape.mjs` 逐字段比夹具录下的顶层键集，
 *    多一个键会让每一份**录制基线**当场过期，而重录是人的动作、共享基线只在主树上改
 *    （`docs/agents/effort-orchestration.md`）。⛔ 也不加第 7 个公开方法（interface 是六方法）。
 *    ⛔ 文案不在这一层：`ADR-0021` 决策 16 把用户可见等级留给接线层（壳）——这里只送**事实**。
 *
 * 2. **一次挂死不许永久堵住轮询**（用户故事 22/23）。两条：
 *    · **读请求有上限**（`readTimeoutMs`，默认 10 秒）：到点**放弃这一份回包**并落一条结构化
 *      `timeout` 失败 ⇒ 那一轮轮询一定会 settle，下一轮 2 秒后照常起飞；宿主恢复后自然自愈。
 *      ⚠️ **超时不是中止**：`fetch` 的 `init` 形状被链上那张生产 source 的判据逐字钉着
 *      （`test-workbench-projection.mjs` 的 `assert.deepEqual(call.options, { headers: … })` 不在
 *      本票射程内），加 `AbortController` 的 `signal` 会当场把它判红。所以这里只放弃回包、
 *      **不真断连接**——迟到的那一份由 epoch 挡住，写不进新身份（决策 10）。这是**有意的降级**，
 *      窄处写在票 06 的 `## Answer` 与 `docs/测试信任边界.md`。
 *    · **在飞的轮询有上限**（`POLL_STUCK_MS`）：一轮超过 60 秒还没落地（注入的 source 不理会上限、
 *      或环境里根本没有定时器）⇒ 视为挂死，下一轮照常起飞；旧的那一轮由 epoch 挡住。
 *      **单飞照旧**（决策 10）：没超上限时第二个 tick 仍然直接返回。
 *    `now` 可注入（默认 `Date.now`）：判据拿它把 60 秒那一格走到，⛔ 不真等。
 *
 * ## 票 `ui-systematic-fixes/13`：接管另一本也要有信号（ADR-0021 决策 13 修订）
 *
 * 身份失效后 `discoverAndReadCore` 会按**既有发现顺序**接管同会话的另一本——`readCore` 成功
 * 那条路从前只把 `onIdentityLost(null)` 送出去，壳因此**分不出**「清空回空态」与「换了一本」，
 * 屏上也就一句话都没有（用户只看到书名换了）。现在接管**完成**（新身份落下且它的 core 真读
 * 回来）时另送一次 `onIdentityTakeover({ from, to, name })`：
 *   · `from`：刚失效那一本的 projectId（失效信号里带过来的那个，不是猜的）；
 *   · `to`：接管到的新身份；
 *   · `name`：接管到那一本的显示名（优先取刚读回来那份 core 的 `meta.name`——与屏上「📖 X」
 *     是同一格；core 没给才退回书单里的 `name`）。两边都没给就是空串（壳不许把 `undefined`
 *     或一对空书名号印上屏）。
 *
 * 三条边界（⛔ 都不是可选项）：
 *   · **不改发现顺序、不拦接管**：ADR-0021 决策 13 的「按既有顺序选择当前书」一个字没动，
 *     这里只加可观察性（裁决是「告知（不拦）」，见票 13）。
 *   · **只送「机器替你做主」的那一帧**：初始发现、显式 `refresh()`／`selectProject(...)`
 *     （用户自己点的那条路）都不送——否则「用户点了一下」也会被说成「机器换了一本」。
 *   · **不进 snapshot**：理由与 `onIdentityLost` 同一条（`test-ui-state-gallery-shape.mjs`
 *     逐字段比夹具录下的顶层键集，多一个键＝每一份录制基线当场过期）。也不加第 7 个公开方法。
 *     ⛔ 文案不在这一层（ADR-0021 决策 16）：这里只送**事实**。
 */

const POLL_INTERVAL_MS = 2000
/** 预期身份失效：当前书被删或不再属于本会话，两类走同一条失效路径（ADR-0021 决策 13/16）。 */
const IDENTITY_FAILURE_KINDS = new Set(['not-found', 'not-owned'])
/** 单条读请求的上限：到点放弃这一份回包（**不真断连接**，理由见文件头）。 */
const READ_TIMEOUT_MS = 10_000
/** 一轮轮询的上限：超过它仍在飞 ⇒ 视为挂死，允许下一轮重新起飞（旧回包由 epoch 挡住）。 */
const POLL_STUCK_MS = 60_000

const UNKNOWN_RESOURCE = Object.freeze({
  status: 'unknown',
  known: false,
  data: null,
  error: null,
})

const EMPTY_PROJECTS = Object.freeze([])

/**
 * 无书不是无身份：无书会话同样拿到**含 session 的非 null bookKey**（ADR-0021 决策 7）。
 * keyed subtree 用它隔离，所以「无书 A→B 归零」能表达；不另设 sessionKey，也不用 null 当 key。
 */
function bookKeyFor(sessionId, projectId) {
  return JSON.stringify([sessionId, projectId])
}

function projectionFailure(kind, message, status = null) {
  const error = new Error(message)
  error.projectionKind = kind
  if (status !== null) error.status = status
  return error
}

function malformed(message) {
  return projectionFailure('malformed', message)
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** HTTP JSON 是无环数据；提交时递归复制再深冻结，公开 snapshot 就不会别名 source 或内部状态。 */
function stableValue(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(stableValue))
  if (!isRecord(value)) return value
  const copy = {}
  for (const [key, item] of Object.entries(value)) copy[key] = stableValue(item)
  return Object.freeze(copy)
}

/**
 * 规范化后的结构比较：判「可观察结果真的变了没有」。成功响应内容相同就不换引用、不通知，
 * 空轮询同理（ADR-0021 决策 5/6）。
 */
function sameValue(a, b) {
  if (a === b) return true
  if (!isRecord(a) && !Array.isArray(a)) return a === b
  if (!isRecord(b) && !Array.isArray(b)) return b === a
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false
    for (let index = 0; index < a.length; index += 1) {
      if (!sameValue(a[index], b[index])) return false
    }
    return true
  }
  const keys = Object.keys(a)
  if (keys.length !== Object.keys(b).length) return false
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false
    if (!sameValue(a[key], b[key])) return false
  }
  return true
}

function errorSnapshot(error) {
  return {
    kind: typeof error?.projectionKind === 'string' ? error.projectionKind : 'transport',
    message: error instanceof Error ? error.message : String(error),
    status: Number.isSafeInteger(error?.status) ? error.status : null,
  }
}

function failedResource(previous, error) {
  return stableValue({
    status: previous.known ? 'stale' : 'error',
    known: previous.known,
    data: previous.data,
    error: errorSnapshot(error),
  })
}

function readyResource(data) {
  return stableValue({ status: 'ready', known: true, data, error: null })
}

function normalizeProjects(payload) {
  if (!isRecord(payload) || !Array.isArray(payload.projects)) {
    throw malformed('projects 响应形状不合法')
  }
  for (const project of payload.projects) {
    if (!isRecord(project) || typeof project.id !== 'string' || project.id === '') {
      throw malformed('projects 响应包含非法 project')
    }
  }
  return payload.projects
}

function listOrEmpty(payload, key, label) {
  const value = payload[key]
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) throw malformed(`${label} 必须是数组`)
  return value
}

/**
 * `/events` 归一。full（`after === null`）按完整账本重建 events 与 cursor；delta 只把本次
 * 追加的事件接到 last-known 列表后面，**不按序号去重**（回退与定点修改允许合法复用序号），
 * 空 delta 自然保留当前 cursor。cursor 一律从合并后的最后一条事件派生。
 */
function normalizeCore(payload, { base = null, delta = false } = {}) {
  if (!isRecord(payload) || !isRecord(payload.meta) || !Array.isArray(payload.events)) {
    throw malformed('events 响应的 meta/events 形状不合法')
  }
  if (payload.dir !== undefined && payload.dir !== null && typeof payload.dir !== 'string') {
    throw malformed('events 响应的 dir 必须是字符串')
  }
  if (
    payload.knowledgeMap !== undefined &&
    payload.knowledgeMap !== null &&
    typeof payload.knowledgeMap !== 'string'
  ) {
    throw malformed('events 响应的 knowledgeMap 必须是字符串')
  }
  if (
    payload.knowledgeMapExclusions !== undefined &&
    payload.knowledgeMapExclusions !== null &&
    typeof payload.knowledgeMapExclusions !== 'string'
  ) {
    throw malformed('events 响应的 knowledgeMapExclusions 必须是字符串')
  }
  // 票 `reader-cognition-boundary-build/09`：回卷原件的原文（站 2 那一栏缺口的唯一新输入）。
  // 与 `knowledgeMapExclusions` 同一条路、同一档形状检查（⛔ 不静默把坏形状读成「没有回卷」）。
  if (
    payload.readerQuestionnaireReturn !== undefined &&
    payload.readerQuestionnaireReturn !== null &&
    typeof payload.readerQuestionnaireReturn !== 'string'
  ) {
    throw malformed('events 响应的 readerQuestionnaireReturn 必须是字符串')
  }
  if (
    payload.outline !== undefined &&
    payload.outline !== null &&
    typeof payload.outline !== 'string'
  ) {
    throw malformed('events 响应的 outline 必须是字符串')
  }
  if (
    payload.goldAudit !== undefined &&
    payload.goldAudit !== null &&
    typeof payload.goldAudit !== 'string'
  ) {
    throw malformed('events 响应的 goldAudit 必须是字符串')
  }

  const incoming = payload.events
  for (const event of incoming) {
    if (!isRecord(event) || !Number.isSafeInteger(event.seq) || event.seq < 0) {
      throw malformed('events 响应包含非法事件或 cursor')
    }
  }
  const events = delta && base !== null ? base.events.concat(incoming) : incoming
  const last = events[events.length - 1]
  const cursor = last === undefined ? -1 : last.seq
  const dir = typeof payload.dir === 'string' ? payload.dir : null
  return {
    meta: payload.meta,
    events,
    gate: payload.gate ?? null,
    snapshots: listOrEmpty(payload, 'snapshots', 'events.snapshots'),
    dir,
    bookDir: dir,
    pending: {
      stage: payload.pendingStage ?? null,
      gate: payload.pendingGate ?? null,
      reviews: listOrEmpty(payload, 'pendingReviews', 'events.pendingReviews'),
    },
    knowledgeMap: typeof payload.knowledgeMap === 'string' ? payload.knowledgeMap : null,
    // 那份**人的裁决产物**原文（`工作区/knowledge-map-exclusions.json`，票 `knowledge-graph-build/09`）：
    // 与 `knowledgeMap` 同一条路（不经 `/textbook/file`），null ＝「这本书上还没有裁决」。
    knowledgeMapExclusions:
      typeof payload.knowledgeMapExclusions === 'string' ? payload.knowledgeMapExclusions : null,
    // 书夹里那份**回卷原件**的原文（`工作区/读者情况回卷.md`，票 `reader-cognition-boundary-build/09`）：
    // 与上面那份同一条路（不经 `/textbook/file`），null ＝「这本书还没有回卷」——
    // 站 2 那一栏「缺口」据它 ＋ 合并件的 `readerSlices` ＋ 剔除记录**现算**（⛔ 不落第二份）。
    readerQuestionnaireReturn:
      typeof payload.readerQuestionnaireReturn === 'string' ? payload.readerQuestionnaireReturn : null,
    // 章节安排原文（`工作区/outline.md`，内容是机器 JSON）：与 knowledgeMap 同一条路——
    // 不经 /textbook/file（那条路由按 'preview' 收窄），人读形态由阶段页就地折叠。
    outline: typeof payload.outline === 'string' ? payload.outline : null,
    // 当前范例章的检查记录原文（`工作区/audit-NN.md`，严格 JSON 的机器产物）：同 outline 一条路
    // ——不经 `/textbook/file`（那条路由按 'preview' 收窄，对它必然 403），改随 payload 下发。
    // 判据是**那一份**（服务端按 `meta.goldChapter` 取），前端不再自己拼路径去读。
    // ⚠️ **三态里「还没读到」（`undefined`）那一格必须留得住**——这一格与上面几格不同：
    // 它**驱动一颗键的能力**（`goldDisplayPeriod`：`null` ⇒ 挂展示期、把定稿键禁掉）。
    // 所以服务端**没有这一格**时要读成 `undefined`（＝还没读到 ⇒ 照旧放行），**不是** `null`：
    // 判成 `null` 就是让卡断言「这一稿的检查记录还没出来」——那是关于**文件**的断言，
    // 而客户端此刻并不知道（老宿主／半更新时这一格就是缺的），两颗键于是又灰回去，
    // 正是票 `gold-finalize-blocked/01` 那个形状。上面几格用 `?? null` 是因为它们只影响显示。
    goldAudit:
      payload.goldAudit === undefined
        ? undefined
        : typeof payload.goldAudit === 'string'
          ? payload.goldAudit
          : null,
    chapterStatus: listOrEmpty(payload, 'chapterStatus', 'events.chapterStatus'),
    goldDrafts: listOrEmpty(payload, 'goldDrafts', 'events.goldDrafts'),
    goldDraftVersion: Number.isSafeInteger(payload.goldDraftVersion)
      ? payload.goldDraftVersion
      : 1,
    cursor,
    exploreSummary: payload.exploreSummary ?? null,
    pendingInterventions: listOrEmpty(
      payload,
      'pendingInterventions',
      'events.pendingInterventions',
    ),
    finalReport: payload.finalReport ?? null,
    work: payload.work ?? null,
  }
}

function normalizeWork(payload) {
  if (!isRecord(payload) || !Array.isArray(payload.files)) {
    throw malformed('work 响应形状不合法')
  }
  return { files: payload.files }
}

function normalizeProcess(payload) {
  if (!isRecord(payload) || !Array.isArray(payload.segments)) {
    throw malformed('process 响应形状不合法')
  }
  // 票 `demo-channel-full/05`：`/textbook/process` 早就随这一路下发 `shape`（两份表的对账视图：
  // 「应当有什么」的清单行数 ／「实际有什么」的登记行数 ／ 缺件与多件逐条），而壳那一侧
  // **一个字都没读它**——于是「这本书缺了哪几件产物」在界面上没有出口。
  // ⚠️ 这里**只做形状归一、不做判定**：不是对象就归一成 `null`（老书没有清单、或读侧兜底返回
  // `null` 时都走这一格），判定（缺件怎么算）仍在 `domain-rules.reconcileManifestRows` 那一处。
  return { segments: payload.segments, shape: isRecord(payload.shape) ? payload.shape : null }
}

function classifyHttpFailure(status, message) {
  if (status === 404 || /项目不存在|not found/i.test(message)) {
    return projectionFailure('not-found', message, status)
  }
  if (
    status === 403 ||
    /不属于当前会话|not[- ]owned/i.test(message)
  ) {
    return projectionFailure('not-owned', message, status)
  }
  return projectionFailure('http', message, status)
}

/**
 * 给一条读请求加一个上限：**到点就放弃这一份回包**（不真断连接，理由见文件头那一节）。
 * 放弃之后这次读按 `timeout` 失败落账；迟到的那份回包由 epoch 挡住，写不进新身份。
 * ⚠️ node 的定时器要 `unref()`：判据里「某个请求永不回来」是常态，不能让它吊着测试进程。
 */
function withReadTimeout(promise, timeoutMs) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return promise
  if (typeof globalThis.setTimeout !== 'function') return promise
  return new Promise((resolve, reject) => {
    // 那句话要像句话：生产是 10 秒，判据里注入的是毫秒级（5ms）——两档各自读得通。
    const waited = timeoutMs >= 1000 ? `${Math.round(timeoutMs / 1000)} 秒` : `${timeoutMs} 毫秒`
    const handle = globalThis.setTimeout(() => {
      reject(projectionFailure('timeout', `这次读没回来（超过 ${waited}）`))
    }, timeoutMs)
    if (handle !== null && typeof handle === 'object' && typeof handle.unref === 'function') {
      handle.unref()
    }
    promise.then(
      (value) => {
        if (typeof globalThis.clearTimeout === 'function') globalThis.clearTimeout(handle)
        resolve(value)
      },
      (error) => {
        if (typeof globalThis.clearTimeout === 'function') globalThis.clearTimeout(handle)
        reject(error)
      },
    )
  })
}

async function requestBookJson(pathname, params, timeoutMs = READ_TIMEOUT_MS) {
  // 每次请求现取 globalThis.fetch；不在 module 初始化或 source 创建时捕获测试替身。
  const fetchNow = globalThis.fetch
  if (typeof fetchNow !== 'function') {
    throw projectionFailure('transport', '当前环境没有可用的 fetch')
  }
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) search.set(key, value)
  const url = `${pathname}?${search.toString()}`
  // 上限包住**整个读**（fetch ＋ 读正文）：半开连接上 `response.json()` 一样会永远吊着，
  // 只包 fetch 那一半等于把「挂死」原样留给下一层。
  return withReadTimeout(readJsonResponse(fetchNow, url, pathname), timeoutMs)
}

async function readJsonResponse(fetchNow, url, pathname) {
  let response
  try {
    response = await fetchNow.call(globalThis, url, {
      headers: { Accept: 'application/json' },
    })
  } catch (error) {
    throw projectionFailure(
      'transport',
      error instanceof Error ? error.message : String(error),
    )
  }

  let payload = null
  let parseFailed = false
  try {
    payload = await response.json()
  } catch {
    parseFailed = true
  }
  const status = Number.isSafeInteger(response.status) ? response.status : null
  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.error === 'string' && payload.error !== ''
        ? payload.error
        : `HTTP ${status ?? '错误'}`
    throw classifyHttpFailure(status, message)
  }
  if (parseFailed) throw malformed(`${pathname} 响应不是合法 JSON`)
  return payload
}

function createProductionBookSource({ timeoutMs = READ_TIMEOUT_MS } = {}) {
  return {
    projects(sessionId) {
      return requestBookJson('/textbook/projects', { session: sessionId }, timeoutMs)
    },
    // `after` 为 null 时是全量读取（不带该参数）；带数字时是沿用现有 cursor 口径的增量轮询。
    events(sessionId, projectId, after) {
      const params = { session: sessionId, project: projectId }
      if (Number.isSafeInteger(after)) params.after = after
      return requestBookJson('/textbook/events', params, timeoutMs)
    },
    work(sessionId, projectId) {
      return requestBookJson('/textbook/work', { session: sessionId, project: projectId }, timeoutMs)
    },
    process(sessionId, projectId) {
      return requestBookJson('/textbook/process', { session: sessionId, project: projectId }, timeoutMs)
    },
  }
}

function createBrowserScheduler() {
  return {
    setInterval(callback, delay) {
      const setIntervalNow = globalThis.setInterval
      if (typeof setIntervalNow !== 'function') {
        throw projectionFailure('transport', '当前环境没有可用的 setInterval')
      }
      return setIntervalNow.call(globalThis, callback, delay)
    },
    clearInterval(handle) {
      const clearIntervalNow = globalThis.clearInterval
      if (typeof clearIntervalNow === 'function') clearIntervalNow.call(globalThis, handle)
    },
  }
}

export function createBookProjection({
  sessionId,
  source,
  scheduler = createBrowserScheduler(),
  now = () => Date.now(),
  readTimeoutMs = READ_TIMEOUT_MS,
  onIdentityLost = null,
  onIdentityTakeover = null,
}) {
  if (typeof sessionId !== 'string' || sessionId === '') {
    throw new TypeError('createBookProjection 需要 sessionId')
  }
  // `source` 只有**显式传 undefined** 才建生产那一条；传 `null` 仍然当场抛（programmer error）。
  const bookSource =
    source === undefined ? createProductionBookSource({ timeoutMs: readTimeoutMs }) : source
  if (bookSource === null || typeof bookSource !== 'object') {
    throw new TypeError('createBookProjection 需要内部 source adapter')
  }
  if (
    scheduler === null ||
    typeof scheduler !== 'object' ||
    typeof scheduler.setInterval !== 'function' ||
    typeof scheduler.clearInterval !== 'function'
  ) {
    throw new TypeError('createBookProjection 需要内部 scheduler adapter')
  }
  if (typeof now !== 'function') {
    throw new TypeError('createBookProjection 的 now 必须是函数（默认 Date.now）')
  }
  if (!Number.isFinite(readTimeoutMs) || readTimeoutMs <= 0) {
    throw new TypeError('createBookProjection 的 readTimeoutMs 必须是正数')
  }
  if (onIdentityLost !== null && typeof onIdentityLost !== 'function') {
    throw new TypeError('createBookProjection 的 onIdentityLost 必须是函数或 null')
  }
  if (onIdentityTakeover !== null && typeof onIdentityTakeover !== 'function') {
    throw new TypeError('createBookProjection 的 onIdentityTakeover 必须是函数或 null')
  }

  // instance 的 sessionId 构造后不变：切会话靠卸载旧 instance、建新 instance（决策 2）。
  // 同一 session 内接管/清空/重新发现都只是这份状态的一次转换，不建第二个 instance。
  const state = {
    projectId: null,
    generation: 0,
    projects: EMPTY_PROJECTS,
    projectsStatus: 'unknown',
    projectsError: null,
    core: UNKNOWN_RESOURCE,
    work: UNKNOWN_RESOURCE,
    process: UNKNOWN_RESOURCE,
  }
  const listeners = new Set()
  /** 逐路 request epoch：旧 poll / 旧 sidecar / 旧 discovery 不得覆盖新 refresh（决策 10）。 */
  const epochs = { projects: 0, events: 0, work: 0, process: 0 }
  let snapshotRef = buildSnapshot()
  let pollHandle = null
  let pollInFlight = 0
  let pollSeq = 0
  /** 这一轮轮询是什么时候起飞的（`now()` 的读数）：超过 `POLL_STUCK_MS` 视为挂死。 */
  let pollStartedAt = 0
  /** 身份失效的**信号**（不进 snapshot，见文件头）：`null` 或 `{ projectId, kind, message }`。 */
  let identityLost = null

  /**
   * 把身份失效信号送出去（⛔ 不进 snapshot）。`null` ＝ 身份又落定了（读回了任何一本，
   * 或调用方显式发起 refresh/selectProject）。内容没变就不重复通知（与 listener 同一口径）。
   */
  function reportIdentityLost(next) {
    if (onIdentityLost === null) return
    if (next === identityLost) return
    if (
      next !== null &&
      identityLost !== null &&
      next.projectId === identityLost.projectId &&
      next.kind === identityLost.kind &&
      next.message === identityLost.message
    ) {
      return
    }
    identityLost = next
    try {
      onIdentityLost(next)
    } catch {
      /* 回调自己的问题不归 module 管（与 listener 同一条口径） */
    }
  }

  /**
   * 把「机器替你做主，换了一本」这件事送出去（⛔ 不进 snapshot，见文件头票 13 那一节）。
   *
   * `name` 取**刚读回来那一份 core 的 `meta.name`**（屏上「📖 X」印的同一格），core 没给才退回
   * 书单里那一本的 `name`；两边都没有就是空串——壳那一侧要拼一句人话，⛔ 不许它自己猜、
   * 也⛔ 不许 `undefined`／一对空书名号上屏。
   * 不去重：每一次接管都是**新发生的一件事**（壳按自己那份「这一帧还显示吗」的状态管告知）。
   */
  function reportIdentityTakeover({ from, to }) {
    if (onIdentityTakeover === null) return
    // 书名取**刚读回来的那一份 core**（`meta.name`）——那正是屏上「📖 X」印的那一格，
    // 告知与标题因此不会各说一本。书单里的 `name` 只是退路（core 没给名字时用它）。
    const coreName = state.core.data?.meta?.name
    const picked = state.projects.find((project) => project.id === to)
    const fromCore = typeof coreName === 'string' ? coreName.trim() : ''
    const fromList =
      picked !== undefined && typeof picked.name === 'string' ? picked.name.trim() : ''
    const name = fromCore !== '' ? fromCore : fromList
    try {
      onIdentityTakeover(Object.freeze({ from, to, name }))
    } catch {
      /* 同上：回调自己的问题不归 module 管 */
    }
  }

  function capture() {
    return {
      sessionId,
      projectId: state.projectId,
      generation: state.generation,
      bookKey: bookKeyFor(sessionId, state.projectId),
    }
  }

  function isCurrent(guard) {
    if (guard === null || typeof guard !== 'object') return false
    const current = capture()
    return (
      guard.sessionId === current.sessionId &&
      guard.projectId === current.projectId &&
      guard.generation === current.generation &&
      guard.bookKey === current.bookKey
    )
  }

  function buildSnapshot() {
    // 子值都已深冻结，顶层只需要浅冻结；projectsKnown 由 projectsStatus 派生，caller 写不了。
    return Object.freeze({
      sessionId,
      projectId: state.projectId,
      generation: state.generation,
      bookKey: bookKeyFor(sessionId, state.projectId),
      projects: state.projects,
      projectsStatus: state.projectsStatus,
      projectsKnown: state.projectsStatus === 'ready' || state.projectsStatus === 'stale',
      projectsError: state.projectsError,
      core: state.core,
      work: state.work,
      process: state.process,
    })
  }

  /** 两次可观察 commit 之间必须返回同一个冻结引用（ADR-0021 决策 6）。 */
  function snapshot() {
    return snapshotRef
  }

  function notify() {
    // 通知在 commit 完成之后调用；单个 listener 抛错不回滚内部状态，也不阻断其它 listener。
    for (const listener of [...listeners]) {
      try {
        listener(snapshotRef)
      } catch {
        /* listener 自己的问题不归 module 管 */
      }
    }
  }

  function publish() {
    const next = buildSnapshot()
    // 规范化后没有任何可观察变化 → 沿用同一个冻结引用，并且不通知。
    if (sameValue(next, snapshotRef)) return snapshotRef
    snapshotRef = next
    notify()
    return snapshotRef
  }

  function commit(patch) {
    if (patch.projects !== undefined) state.projects = patch.projects
    if (patch.projectsStatus !== undefined) state.projectsStatus = patch.projectsStatus
    if (patch.projectsError !== undefined) state.projectsError = patch.projectsError
    if (patch.core !== undefined) state.core = patch.core
    if (patch.work !== undefined) state.work = patch.work
    if (patch.process !== undefined) state.process = patch.process
    return publish()
  }

  function startRequest(channel) {
    epochs[channel] += 1
    return { channel, epoch: epochs[channel], guard: capture() }
  }

  function tokenAlive(token) {
    return epochs[token.channel] === token.epoch && isCurrent(token.guard)
  }

  function projectsKnownNow() {
    return state.projectsStatus === 'ready' || state.projectsStatus === 'stale'
  }

  function resetBookResources() {
    state.core = UNKNOWN_RESOURCE
    state.work = UNKNOWN_RESOURCE
    state.process = UNKNOWN_RESOURCE
  }

  /** 接管与清空是同一命令的两种参数语义：都只让旧身份失效、推进 generation、重置书级数据。 */
  function takeIdentity(nextProjectId) {
    if (nextProjectId === state.projectId) return false
    state.projectId = nextProjectId
    state.generation += 1
    resetBookResources()
    return true
  }

  /** clear 语义（含 not-found/not-owned 失效）：四路资源都回到各自的初始 unknown。 */
  function clearBookState() {
    state.projectId = null
    state.generation += 1
    state.projects = EMPTY_PROJECTS
    state.projectsStatus = 'unknown'
    state.projectsError = null
    resetBookResources()
  }

  /**
   * 一处失败落法：预期身份失效走 clear 路径（不显示读取错误，随后重新发现）；其余是预期
   * source 结果，把结构化错误提交到对应 resource。旧请求（epoch 或 generation 过期）不落。
   */
  function handleFailure(channel, token, error, { exclude } = {}) {
    if (!tokenAlive(token)) return
    const kind =
      typeof error?.projectionKind === 'string' ? error.projectionKind : 'transport'
    if (channel !== 'projects' && IDENTITY_FAILURE_KINDS.has(kind)) {
      // 先把「哪一本、为什么」记下来再清身份：清完之后 `projectId` 就没了，而壳那一侧要能说
      // 出一句人话（票 06 第 2 条：今天这里一个字都没有）。
      const lost = Object.freeze({
        projectId: token.guard.projectId,
        kind,
        message: error instanceof Error ? error.message : String(error),
      })
      clearBookState()
      publish()
      // 信号在 clear 那一帧**之后**送出：壳看到的是「身份已经没了」＋「为什么没的」，同一帧之后。
      reportIdentityLost(lost)
      // 重新发现：同一会话若还有另一本书就按既有顺序接管并读它，没有就回空态。
      void discoverAndReadCore(exclude)
      return
    }
    if (channel === 'projects') {
      commit({
        projects: projectsKnownNow() ? state.projects : EMPTY_PROJECTS,
        projectsStatus: projectsKnownNow() ? 'stale' : 'error',
        projectsError: errorSnapshot(error),
      })
      return
    }
    commit({ [channel]: failedResource(state[channel], error) })
  }

  async function readProjects({ discover = false, exclude = null } = {}) {
    const token = startRequest('projects')
    let list = null
    try {
      list = normalizeProjects(await bookSource.projects(sessionId))
    } catch (error) {
      handleFailure('projects', token, error)
      return false
    }
    if (!tokenAlive(token)) return false
    commit({ projects: stableValue(list), projectsStatus: 'ready', projectsError: null })
    if (!discover || state.projectId !== null || list.length === 0) return false
    // 既有发现顺序：取第一本合法书（刚失效的那本不立刻接管回来）。
    const picked = exclude === null ? list[0] : list.find((project) => project.id !== exclude)
    if (picked === undefined) return false
    takeIdentity(picked.id)
    publish()
    return true
  }

  /** mode 'full' 重建 events 与 cursor；'delta' 沿用 last-known 列表与 cursor 追加。 */
  async function readCore(mode) {
    const token = startRequest('events')
    const projectId = token.guard.projectId
    if (projectId === null) return false
    const base = state.core.known ? state.core.data : null
    const delta = mode === 'delta' && base !== null
    let payload = null
    try {
      payload = await bookSource.events(sessionId, projectId, delta ? base.cursor : null)
    } catch (error) {
      handleFailure('core', token, error, { exclude: projectId })
      return false
    }
    if (!tokenAlive(token)) return false
    let data = null
    try {
      data = stableValue(normalizeCore(payload, { base, delta }))
    } catch (error) {
      handleFailure('core', token, error, { exclude: projectId })
      return false
    }
    commit({ core: readyResource(data) })
    // 读回了这一本 ⇒ 身份又落定了：把「刚才那本打不开」那句告知撤掉（票 06）。
    reportIdentityLost(null)
    return true
  }

  async function readSidecar(channel) {
    const token = startRequest(channel)
    const projectId = token.guard.projectId
    if (projectId === null) return
    let payload = null
    try {
      payload = await bookSource[channel](sessionId, projectId)
    } catch (error) {
      handleFailure(channel, token, error, { exclude: projectId })
      return
    }
    if (!tokenAlive(token)) return
    let data = null
    try {
      data = stableValue(channel === 'work' ? normalizeWork(payload) : normalizeProcess(payload))
    } catch (error) {
      handleFailure(channel, token, error, { exclude: projectId })
      return
    }
    commit({ [channel]: readyResource(data) })
  }

  /** 旁支独立 settle：不 await、不延长 core Promise，也不把失败说成 core 失败。 */
  function startSidecars() {
    void readSidecar('work')
    void readSidecar('process')
  }

  /** 无当前书时的发现：读 projects，按既有顺序接管第一本，再读它的 core。 */
  async function discoverAndReadCore(exclude = null) {
    const discovered = await readProjects({ discover: true, exclude })
    if (!discovered) return
    if (!(await readCore('full'))) return
    // 票 `ui-systematic-fixes/13`：`exclude` 非空 ⇒ 这一趟是**刚失效那一本的重新发现**，
    // 真读回来另一本才算「接管发生」。初始发现（exclude 为 null）与轮询走的那条路不送。
    if (exclude !== null) reportIdentityTakeover({ from: exclude, to: state.projectId })
    startSidecars()
  }

  async function refresh() {
    // 显式再读一次：先把「刚才那本打不开」那句告知撤掉（真读不回来时下面会再报一次，
    // 于是「重试 → 仍失败」不会卡在一个永远撤不掉的告知上）。
    reportIdentityLost(null)
    let needsCore = state.projectId !== null
    if (!needsCore) needsCore = await readProjects({ discover: true })
    // 无当前书时 projects 发现完成即 core 完成；有当前书时 core commit 即完成点。
    if (!needsCore) return snapshotRef
    const committed = await readCore('full')
    // core 没成立的那一轮不启动旁支：这一轮里 work/process 没有可归属的书事实可说。
    if (committed) startSidecars()
    return snapshotRef
  }

  function selectProject(nextProjectId) {
    if (nextProjectId !== null && (typeof nextProjectId !== 'string' || nextProjectId === '')) {
      throw new TypeError('projectId 必须是非空字符串或 null')
    }
    if (nextProjectId === null) {
      clearBookState()
      publish()
      // 显式清空（删书/换台）：那句「刚才那本打不开」跟着退场（票 06）。
      reportIdentityLost(null)
      // clear 立即 resolve：不等待重新发现，随后 refresh() 才重新发现。
      return Promise.resolve(snapshotRef)
    }
    // 先建立新身份与 unknown 状态，再读 core：旧书内容不会出现在第一帧。
    if (takeIdentity(nextProjectId)) publish()
    return refresh()
  }

  async function runPoll() {
    if (state.projectId === null) {
      await discoverAndReadCore()
      return
    }
    if (await readCore(state.core.known ? 'delta' : 'full')) startSidecars()
  }

  function pollTick() {
    // 单飞照旧（决策 10）：一轮在飞时，后续 tick 直接返回。
    // ⚠️ 但**不许永久**返回（票 06）：上一轮超过 `POLL_STUCK_MS` 还没落地 ⇒ 它已经挂死了，
    // 这一轮照常起飞；旧那一轮的回包由 epoch 挡住（决策 10），落地也写不进任何 resource。
    if (pollInFlight !== 0 && now() - pollStartedAt < POLL_STUCK_MS) return
    const seq = (pollSeq += 1)
    pollInFlight = seq
    pollStartedAt = now()
    void runPoll().finally(() => {
      if (pollInFlight === seq) pollInFlight = 0
    })
  }

  function tickSafely() {
    try {
      pollTick()
    } catch {
      /* 轮询回调里的意外不能让 interval 变成哑火 */
    }
  }

  function startScheduler() {
    if (pollHandle !== null) return
    pollHandle = scheduler.setInterval(tickSafely, POLL_INTERVAL_MS)
  }

  function stopScheduler() {
    if (pollHandle === null) return
    scheduler.clearInterval(pollHandle)
    pollHandle = null
  }

  /** 全部订阅者离开：停轮询、推进 generation、留下一份 identity 已更新的新 snapshot。 */
  function teardown() {
    stopScheduler()
    pollInFlight = 0
    pollStartedAt = 0
    state.generation += 1
    publish()
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('subscribe 需要 listener 函数')
    }
    listeners.add(listener)
    if (listeners.size === 1) startScheduler()
    let disposed = false
    return function dispose() {
      if (disposed) return
      disposed = true
      listeners.delete(listener)
      if (listeners.size === 0) teardown()
    }
  }

  return { snapshot, refresh, selectProject, capture, isCurrent, subscribe }
}
