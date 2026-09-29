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
 */

const POLL_INTERVAL_MS = 2000
/** 预期身份失效：当前书被删或不再属于本会话，两类走同一条失效路径（ADR-0021 决策 13/16）。 */
const IDENTITY_FAILURE_KINDS = new Set(['not-found', 'not-owned'])

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
  return { segments: payload.segments }
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

async function requestBookJson(pathname, params) {
  // 每次请求现取 globalThis.fetch；不在 module 初始化或 source 创建时捕获测试替身。
  const fetchNow = globalThis.fetch
  if (typeof fetchNow !== 'function') {
    throw projectionFailure('transport', '当前环境没有可用的 fetch')
  }
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) search.set(key, value)
  const url = `${pathname}?${search.toString()}`

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

function createProductionBookSource() {
  return {
    projects(sessionId) {
      return requestBookJson('/textbook/projects', { session: sessionId })
    },
    // `after` 为 null 时是全量读取（不带该参数）；带数字时是沿用现有 cursor 口径的增量轮询。
    events(sessionId, projectId, after) {
      const params = { session: sessionId, project: projectId }
      if (Number.isSafeInteger(after)) params.after = after
      return requestBookJson('/textbook/events', params)
    },
    work(sessionId, projectId) {
      return requestBookJson('/textbook/work', { session: sessionId, project: projectId })
    },
    process(sessionId, projectId) {
      return requestBookJson('/textbook/process', { session: sessionId, project: projectId })
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
  source = createProductionBookSource(),
  scheduler = createBrowserScheduler(),
}) {
  if (typeof sessionId !== 'string' || sessionId === '') {
    throw new TypeError('createBookProjection 需要 sessionId')
  }
  if (source === null || typeof source !== 'object') {
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
      clearBookState()
      publish()
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
      list = normalizeProjects(await source.projects(sessionId))
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
      payload = await source.events(sessionId, projectId, delta ? base.cursor : null)
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
    return true
  }

  async function readSidecar(channel) {
    const token = startRequest(channel)
    const projectId = token.guard.projectId
    if (projectId === null) return
    let payload = null
    try {
      payload = await source[channel](sessionId, projectId)
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
    if (await readCore('full')) startSidecars()
  }

  async function refresh() {
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
    if (pollInFlight !== 0) return
    const seq = (pollSeq += 1)
    pollInFlight = seq
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
