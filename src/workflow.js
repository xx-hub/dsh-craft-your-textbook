/**
 * 造书工作台 · 后端流程插件（宿主侧）——Web 壳
 *
 * 本文件保留：插件元数据（name/inject）、HTTP handlers、启动恢复链、
 * apply（路由注册 + 时机）、动作族 dispatch 表（ACTION_FAMILY_OF）。
 * 领域引擎（六阶段状态机核心 + 共享工具）在 ./workflow/engine.js；
 * 9 个动作族在 ./workflow/actions/*.js。
 */
import {
  GATE_LABELS,
  PROJECT_ID_RE,
  appendEvent,
  assertSessionOwned,
  bindAnnounce,
  chapterArtifacts,
  chapterDone,
  deepAffected,
  dshHome,
  foldGate,
  gateApproved,
  goldN,
  handoff,
  kick,
  listProjects,
  logEntryText,
  moveAcrossDevices,
  processLogPath,
  projectDir,
  projectsRoot,
  readEvents,
  readMeta,
  readRegistry,
  sendJson,
  snapshotsDir,
  sourcesDir,
  trashProject,
  waived,
  workDir,
  workFile,
  writeMeta,
} from './workflow/engine.js'
import { actBooks } from './workflow/actions/books.js'
import { actWizard } from './workflow/actions/wizard.js'
import { actConvert } from './workflow/actions/convert.js'
import { actGates } from './workflow/actions/gates.js'
import { actGold } from './workflow/actions/gold.js'
import { actDeepModify } from './workflow/actions/deep-modify.js'
import { actCollabSignals } from './workflow/actions/collab-signals.js'
import { actChapters } from './workflow/actions/chapters.js'
import { actPatternsOps } from './workflow/actions/patterns-ops.js'
import { readFileSync, readdirSync, writeFileSync, existsSync, statSync, mkdirSync, renameSync, rmSync } from 'node:fs'
import { join, resolve, basename } from 'node:path'
import { isWithin } from './path-guard.js'
import { readSettings } from './mineru-lib.js'
import { MAX_UPLOAD_BYTES, uploadTooLargeMessage } from './domain-rules.js'


export const name = 'textbook-workflow'

export const inject = ['webServer', 'agents', 'subagents', 'sessions']

const SESSION_ID_RE = /^[A-Za-z0-9._-]{1,128}$/


/** 归一化会话 id（缺省/非法 → 'default'）。 */
function sessionOf(value) {
  if (typeof value === 'string' && SESSION_ID_RE.test(value)) return value
  return 'default'
}


function listSnapshots(projectId) {
  const dir = snapshotsDir(projectId)
  const list = []
  for (const name of readdirSync(dir)) {
    const match = /^(\d+)\.json$/.exec(name)
    if (match === null) continue
    try {
      const raw = readFileSync(join(dir, name), 'utf8')
      const snapshot = JSON.parse(raw)
      list.push({ seq: Number(match[1]), time: snapshot.time, reason: snapshot.reason })
    } catch { /* 损坏快照跳过 */ }
  }
  list.sort((a, b) => b.seq - a.seq)
  return list
}


/** 章节流水线阶段（F35）：从 meta.chapterPipeline 读，旧账本/未上报返回 null。 */
function pipelineStage(meta, index) {
  const pipeline = Array.isArray(meta?.chapterPipeline) ? meta.chapterPipeline : []
  const entry = pipeline[index]
  return entry !== null && typeof entry === 'object' ? (entry.stage ?? null) : null
}


// ── HTTP 层 ────────────────────────────────────────────────────────────────

/** 请求体超限标记：调用方据此回可读的 413（不能掐断连接——掐断时浏览器
 *  只看到 Failed to fetch，看不到真实原因；实测 129MB 上传即触发）。 */
const BODY_TOO_LARGE = 'BODY_TOO_LARGE'

function bodyTooLargeError(limitLabel) {
  const err = new Error(`body too large (> ${limitLabel})`)
  err.code = BODY_TOO_LARGE
  return err
}


function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    let over = false
    req.on('data', (chunk) => {
      if (over) return // 超限后不再累积，等请求自然结束，让调用方先回 413
      size += chunk.length
      if (size > 64 * 1024 * 1024) {
        over = true
        reject(bodyTooLargeError('64MB'))
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (over) return
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw === '' ? {} : JSON.parse(raw))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}


// MAX_UPLOAD_BYTES / uploadTooLargeMessage 来自 domain-rules.js（前后端共享单一事实源）。


function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    let over = false
    req.on('data', (chunk) => {
      if (over) return // 超限后不再累积，等请求自然结束，让调用方先回 413
      size += chunk.length
      if (size > MAX_UPLOAD_BYTES) {
        over = true
        reject(bodyTooLargeError('500MB'))
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (over) return
      resolve(Buffer.concat(chunks))
    })
    req.on('error', reject)
  })
}


/** POST /textbook/upload?session=&project=&name=&role= （raw body = PDF 字节） */
async function handleUpload(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const sessionId = sessionOf(url.searchParams.get('session'))
  const project = url.searchParams.get('project')
  const name = url.searchParams.get('name')
  const role = url.searchParams.get('role') ?? '学生用书'
  if (project === null || !PROJECT_ID_RE.test(project)) {
    sendJson(res, 400, { ok: false, error: '缺少或非法的 project 参数' })
    return
  }
  if (name === null || name.trim() === '' || !/\.pdf$/i.test(name)) {
    sendJson(res, 400, { ok: false, error: '请选择 PDF 文件（.pdf）' })
    return
  }
  try {
    assertSessionOwned(project, sessionId)
  } catch (error) {
    sendJson(res, 403, { ok: false, error: String(error instanceof Error ? error.message : error) })
    return
  }
  const meta = readMeta(project)
  if (meta === null) {
    sendJson(res, 404, { ok: false, error: '项目不存在' })
    return
  }
  const safeName = basename(name)
  try {
    const bytes = await readRawBody(req)
    if (bytes.length === 0) {
      sendJson(res, 400, { ok: false, error: '文件内容为空' })
      return
    }
    writeFileSync(join(sourcesDir(project), safeName), bytes)
    const sources = meta.sources ?? []
    // 幂等：同一文件名重复上传只更新角色，不再追加条目/事件。
    // 背景：客户端瞬时网络失败（Failed to fetch）时服务端已落盘，前端重传同一批文件；
    // 无幂等 → meta.sources 与 timeline 逐次重复（实测 4 文件 × 3 轮 = 12 条）。
    const existing = sources.find((source) => source.file === safeName)
    if (existing !== undefined) {
      existing.role = role
    } else {
      sources.push({ file: safeName, role, converted: false })
      appendEvent(project, 'textbook/source-added', { file: safeName, role })
    }
    meta.sources = sources
    meta.status = 'active'
    writeMeta(meta)
    sendJson(res, 200, { ok: true, project, file: safeName, role })
  } catch (error) {
    const tooLarge = error?.code === BODY_TOO_LARGE
    sendJson(res, tooLarge ? 413 : 500, {
      ok: false,
      error: tooLarge
        ? uploadTooLargeMessage()
        : String(error instanceof Error ? error.message : error),
    })
  }
}


/** GET /textbook/file?session=&project=&path= （文本预览，限 work/ 与 book 产物） */
function handleFile(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const sessionId = sessionOf(url.searchParams.get('session'))
  const project = url.searchParams.get('project')
  const rel = url.searchParams.get('path')
  if (project === null || rel === null) {
    sendJson(res, 400, { ok: false, error: '缺少参数' })
    return
  }
  try {
    assertSessionOwned(project, sessionId)
    const target = resolve(projectDir(project), rel)
    const root = resolve(projectDir(project))
    if (!isWithin(root, target)) {
      sendJson(res, 403, { ok: false, error: '路径越界' })
      return
    }
    if (!existsSync(target) || statSync(target).isDirectory()) {
      sendJson(res, 404, { ok: false, error: '文件不存在' })
      return
    }
    res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'no-store' })
    res.end(readFileSync(target, 'utf8'))
  } catch (error) {
    sendJson(res, 500, { ok: false, error: String(error instanceof Error ? error.message : error) })
  }
}


/** GET /textbook/work?session=&project= （列出已完成步骤的结果文件） */
function handleWork(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const sessionId = sessionOf(url.searchParams.get('session'))
  const project = url.searchParams.get('project')
  if (project === null) {
    sendJson(res, 400, { ok: false, error: '缺少 project 参数' })
    return
  }
  try {
    assertSessionOwned(project, sessionId)
    const dir = workDir(project)
    const files = []
    // 过程记录放最前，人最常看。
    const logPath = processLogPath(project)
    if (existsSync(logPath)) files.push({ path: '过程记录.md', label: '过程记录（全部流水账）' })
    if (existsSync(dir)) {
      for (const name of readdirSync(dir)) {
        if (!name.endsWith('.md')) continue
        let label = null
        if (name === 'explore.md') label = '源探查结果'
        else if (name === 'outline.md') label = '教学设计·章节安排'
        else if (name === 'style-spec.md') label = '写作规范'
        else if (name === 'book.md') label = '成书 BOOK.md'
        else {
          const chapter = /^chapter-(\d+)\.md$/.exec(name)
          const audit = /^audit-(\d+)\.md$/.exec(name)
          if (chapter !== null) label = `第 ${Number(chapter[1])} 章`
          else if (audit !== null) label = `第 ${Number(audit[1])} 章·机器自查`
        }
        if (label !== null) files.push({ path: `work/${name}`, label })
      }
    }
    files.sort((a, b) => a.path.localeCompare(b.path))
    sendJson(res, 200, { ok: true, files })
  } catch (error) {
    sendJson(res, 500, { ok: false, error: String(error instanceof Error ? error.message : error) })
  }
}


/** GET /textbook/download?session=&project=&path= （附件下载） */
function handleDownload(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const sessionId = sessionOf(url.searchParams.get('session'))
  const project = url.searchParams.get('project')
  const rel = url.searchParams.get('path')
  if (project === null || rel === null) {
    sendJson(res, 400, { ok: false, error: '缺少参数' })
    return
  }
  try {
    assertSessionOwned(project, sessionId)
    const target = resolve(projectDir(project), rel)
    const root = resolve(projectDir(project))
    if (!isWithin(root, target)) {
      sendJson(res, 403, { ok: false, error: '路径越界' })
      return
    }
    if (!existsSync(target) || statSync(target).isDirectory()) {
      sendJson(res, 404, { ok: false, error: '文件不存在' })
      return
    }
    // 下载文件名用「人定的书名」（如《初中数学·有理数》.md），保留用户敲定的命名。
    const dlMeta = readMeta(project)
    const bookName = (typeof dlMeta?.name === 'string' && dlMeta.name.trim() !== '' ? dlMeta.name.trim() : basename(rel))
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').trim().replace(/[. ]+$/g, '') || 'BOOK'
    const fileName = encodeURIComponent(`${bookName}.md`)
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${fileName}`,
      'Cache-Control': 'no-store',
    })
    res.end(readFileSync(target))
  } catch (error) {
    sendJson(res, 500, { ok: false, error: String(error instanceof Error ? error.message : error) })
  }
}


/** action → 动作族 handler 映射表。 */
const ACTION_FAMILY_OF = new Map([
  ['book-create', actBooks],
  ['book-rename', actBooks],
  ['book-set-goal', actBooks],
  ['book-delete', actBooks],
  ['wizard-suggest', actWizard],
  ['suggest-roles', actWizard],
  ['convert-start', actConvert],
  ['retry-convert', actConvert],
  ['nudge', actConvert],
  ['resume', actConvert],
  ['gate-decide', actGates],
  ['explore-confirm', actGates],
  ['outline-confirm', actGates],
  ['chapters-review-confirm', actGates],
  ['final-approve', actGates],
  ['rollback', actGates],
  ['gold-opinion', actGold],
  ['gold-opinion-revoke', actGold],
  ['gold-revise', actGold],
  ['gold-chapter-set', actGold],
  ['gold-approve', actGold],
  ['deep-modify', actDeepModify],
  ['deep-undo', actDeepModify],
  ['style-note', actCollabSignals],
  ['style-note-revoke', actCollabSignals],
  ['intervene', actCollabSignals],
  ['intervene-done', actCollabSignals],
  ['waive', actCollabSignals],
  ['waive-revoke', actCollabSignals],
  ['pause', actCollabSignals],
  ['review', actChapters],
  ['stage-submit', actChapters],
  ['stage-brief', actChapters],
  ['progress', actChapters],
  ['suggest-words', actPatternsOps],
  ['pattern-analyze', actPatternsOps],
  ['pattern-list', actPatternsOps],
  ['settings', actPatternsOps],
  ['demo-run', actPatternsOps],
  ['debug-spawn', actPatternsOps],
])


/** POST /textbook/action 动作分发 */
async function handleAction(ctx, req, res) {
  let body
  try {
    body = await readBody(req)
  } catch (error) {
    sendJson(res, error?.code === BODY_TOO_LARGE ? 413 : 400, {
      ok: false,
      error: error?.code === BODY_TOO_LARGE ? '请求体超过 64MB 上限' : '请求体不是合法 JSON',
    })
    return
  }
  const { action, project } = body
  const sessionId = sessionOf(body.session)
  if (typeof action !== 'string' || action === '') {
    sendJson(res, 400, { ok: false, error: '缺少 action' })
    return
  }
  try {
    // 未知动作与旧 default 同文案（对外接口零变化）。
    const family = ACTION_FAMILY_OF.get(action)
    if (family === undefined) {
      sendJson(res, 400, { ok: false, error: `未知动作: ${action}` })
      return
    }
    await family(ctx, req, res, action, sessionId, project, body)
  } catch (error) {
    ctx.logger.warn(`textbook: action ${action} failed: ${String(error)}`)
    sendJson(res, 500, { ok: false, error: String(error instanceof Error ? error.message : error) })
  }
}


function handleEvents(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const sessionId = sessionOf(url.searchParams.get('session'))
  const project = url.searchParams.get('project')
  if (project === null || !PROJECT_ID_RE.test(project)) {
    sendJson(res, 400, { ok: false, error: '缺少或非法的 project 参数' })
    return
  }
  const afterRaw = url.searchParams.get('after')
  const after = afterRaw === null || afterRaw === '' ? undefined : Number(afterRaw)
  if (after !== undefined && (!Number.isSafeInteger(after) || after < 0)) {
    sendJson(res, 400, { ok: false, error: '非法的 after 参数' })
    return
  }
  try {
    assertSessionOwned(project, sessionId)
    const meta = readMeta(project)
    if (meta === null) {
      sendJson(res, 404, { ok: false, error: '项目不存在' })
      return
    }
    const events = readEvents(project, after)
    // 章节状态：每章写好/自查好的徽章（UI 与 AI 都用）。
    const chapters = meta.outline?.chapters ?? []
    const chapterStatus = chapters.map((chapter, index) => {
      const n = index + 1
      const { chapterPath, auditPath } = chapterArtifacts(project, n)
      return {
        n, title: chapter.title ?? `第${n}章`,
        source: chapter.source ?? '', targetWords: chapter.targetWords ?? null,
        written: existsSync(chapterPath), audited: existsSync(auditPath),
      }
    })
    // 探查摘要（探查确认卡用）：材料份数/知识点数/建议章数。
    let exploreSummary = null
    try {
      const km = JSON.parse(readFileSync(workFile(project, 'knowledge-map.json'), 'utf8'))
      const converted = (meta.sources ?? []).filter((source) => source.converted === true).length
      exploreSummary = {
        sources: converted,
        knowledgePoints: Array.isArray(km.knowledgePoints) ? km.knowledgePoints.length : 0,
        chapterSuggestion: Array.isArray(km.chapterSuggestion) ? km.chapterSuggestion.length : 0,
        teachingFocus: Array.isArray(km.teachingFocus) ? km.teachingFocus.slice(0, 5) : [],
      }
    } catch { exploreSummary = null }
    // 金标准稿版本（谈判桌页签数据）：_旧版产物 里按时间戳升序的旧稿；当前稿号 = 旧稿数 + 1。
    let goldDrafts = []
    try {
      const archiveDir = join(workDir(project), '_旧版产物')
      if (existsSync(archiveDir)) {
        const goldRe = new RegExp(`^chapter-${String(goldN(meta)).padStart(2, '0')}\\.md\\.([0-9a-z]+)$`)
        goldDrafts = readdirSync(archiveDir)
          .flatMap((name) => { const m = goldRe.exec(name); return m === null ? [] : [{ name, at: parseInt(m[1], 36) }] })
          .sort((a, b) => a.at - b.at)
          .map((d, i) => ({ version: i + 1, path: `work/_旧版产物/${d.name}`, at: d.at }))
      }
    } catch { goldDrafts = [] }
    sendJson(res, 200, {
      ok: true, project, after, events, meta,
      dir: projectDir(project),
      gate: foldGate(project),
      snapshots: listSnapshots(project),
      work: existsSync(workFile(project, 'book.md')) ? 'work/book.md' : null,
      pendingStage: meta.pendingStage ?? null,
      pendingGate: meta.pendingGate ?? null,
      pendingReviews: Array.isArray(meta.pendingReviews) ? meta.pendingReviews : [],
      pendingInterventions: (meta.pendingInterventions ?? []).filter((i) => i.status === 'pending'),
      finalReport: meta.finalReport ?? null,
      chapterStatus,
      goldDrafts,
      goldDraftVersion: goldDrafts.length + 1,
      exploreSummary,
    })
  } catch (error) {
    sendJson(res, 500, { ok: false, error: String(error instanceof Error ? error.message : error) })
  }
}


/** 过程图谱：把账本折叠成可点分段（前端地图与定点修改的数据源）。 */
function buildProcessMap(projectId) {
  const meta = readMeta(projectId)
  const chapters = meta?.outline?.chapters ?? []
  const segments = []
  const push = (s) => segments.push(s)
  const phase = meta?.phase ?? 1
  // 产物存在性按「项目目录相对路径」判（artifacts 输出即相对路径；workFile 会再拼 work/，不能复用）。
  const existsRel = (rel) => existsSync(join(projectDir(projectId), rel))
  // 探源
  push({
    key: 'explore', label: '源探查', kind: 'explore',
    status: existsSync(workFile(projectId, 'explore.md')) ? (meta.exploreConfirmed === true ? 'done' : 'waiting-user') : (phase >= 2 ? 'active' : 'pending'),
    artifacts: ['work/explore.md', 'work/knowledge-map.json'].filter(existsRel),
    redoNote: meta.exploreRedoNote ?? null,
  })
  for (const gate of ['1', '2', '3']) {
    const folded = foldGate(projectId)
    const mine = folded !== null && folded.gate === gate ? folded : null
    const approved = gateApproved(projectId, gate) || waived(projectId, 'gate-skip')
    push({
      key: `gate-${gate}`, label: `关卡${gate}·${GATE_LABELS[gate] ?? ''}`, kind: 'gate',
      status: approved ? 'done' : (mine !== null && mine.status === 'awaiting' ? 'waiting-user' : (phase >= 3 ? 'active' : 'pending')),
      artifacts: [`提案/关卡${gate}-v1.md`].filter(existsRel),
      decision: mine === null ? undefined : { version: mine.version, approved: mine.status === 'approved', note: mine.decision?.note ?? '' },
    })
  }
  push({
    key: 'outline', label: '章节安排', kind: 'outline',
    status: chapters.length === 0 ? (phase >= 3 ? 'active' : 'pending') : (meta.status === 'awaiting-outline' ? 'waiting-user' : (phase >= 4 ? 'done' : 'active')),
    artifacts: existsRel('work/outline.md') ? ['work/outline.md'] : [],
    redoNote: meta.outlineRedoNote ?? null,
  })
  const goldDone = meta.goldSealed != null || phase >= 5
  const goldNn = goldN(meta)
  push({
    key: 'gold', label: '最佳范例章（风格母版）', kind: 'gold',
    status: goldDone ? 'done' : (meta.status === 'awaiting-gold' ? 'waiting-user' : (phase >= 4 ? 'active' : 'pending')),
    artifacts: ['work/style-spec.md', `work/chapter-${String(goldNn).padStart(2, '0')}.md`, `work/audit-${String(goldNn).padStart(2, '0')}.md`].filter(existsRel),
    decision: meta.goldSealed == null ? undefined : { version: meta.goldSealed.version, approved: true, note: '已定稿为风格母版' },
    redoNote: meta.goldRedoNote ?? null,
  })
  chapters.forEach((chapter, index) => {
    const n = index + 1
    push({
      key: `chapter-${n}`, label: `第${n}章 ${chapter.title ?? ''}`, kind: 'chapter',
      status: chapterDone(projectId, n) ? 'done' : (phase >= 5 ? 'active' : 'pending'),
      // F35（2026-08-20 走查）：每章流水线阶段（writing/auditing/audited/finalizing/done，未上报为 null）。
      stage: pipelineStage(meta, index),
      artifacts: [`work/chapter-${String(n).padStart(2, '0')}.md`, `work/audit-${String(n).padStart(2, '0')}.md`].filter(existsRel),
    })
  })
  push({
    key: 'chapters-review', label: '全章过目', kind: 'review',
    status: meta?.status === 'awaiting-chapters-review' ? 'waiting-user' : (meta?.chaptersReviewed === true || existsRel('work/book.md') ? 'done' : 'pending'),
    artifacts: [],
  })
  push({
    key: 'merge', label: '合并成书', kind: 'merge',
    status: existsRel('work/book.md') ? 'done' : (phase >= 6 ? 'active' : 'pending'),
    artifacts: existsRel('work/book.md') ? ['work/book.md'] : [],
  })
  push({
    key: 'final', label: '最后检查与交付', kind: 'final',
    status: meta?.status === 'delivered' ? 'done' : (phase >= 6 ? 'active' : 'pending'),
    artifacts: existsRel('work/book.md') ? ['work/book.md'] : [],
  })
  // 影响预告数据：每段的深改影响范围（下游段 keys / 会被归档的现存产物 / 是否可深改）。
  // demo 书不开放定点修改（canDeepModify=false，走旧全自动通道）。
  for (const seg of segments) {
    const affected = deepAffected(projectId, meta, seg.key)
    seg.downstream = affected === null ? [] : affected.downstream
    seg.redoFiles = affected === null ? [] : affected.files.filter((rel) => existsSync(join(projectDir(projectId), rel)))
    seg.canDeepModify = affected !== null && meta?.demo !== true
  }
  return segments
}


/** 聚合主会话的审计/写作子代理状态（F35）：activity=running →「在跑」，inactive →「完成待收」；
 *  宿主未挂 subagents 服务或读取失败时优雅降级为 0（不阻塞 process 查询）。 */
async function countDescendantSubagents(ctx, sessionId) {
  try {
    const svc = typeof ctx?.get === 'function' ? ctx.get('subagents') : undefined
    if (svc === undefined || typeof svc.listDescendants !== 'function') return { running: 0, inactive: 0 }
    const entries = await svc.listDescendants(sessionId)
    let running = 0
    let inactive = 0
    for (const entry of Array.isArray(entries) ? entries : []) {
      if (entry === null || typeof entry !== 'object' || entry.kind !== 'child') continue
      if (entry.activity === 'running') running += 1
      else inactive += 1
    }
    return { running, inactive }
  } catch {
    return { running: 0, inactive: 0 }
  }
}


async function handleProcess(ctx, req, res) {
  const url = new URL(req.url, 'http://localhost')
  const sessionId = sessionOf(url.searchParams.get('session'))
  const project = url.searchParams.get('project')
  if (project === null || !PROJECT_ID_RE.test(project)) {
    sendJson(res, 400, { ok: false, error: '缺少或非法的 project 参数' })
    return
  }
  try {
    assertSessionOwned(project, sessionId)
    const subagents = await countDescendantSubagents(ctx, sessionId)
    sendJson(res, 200, { ok: true, project, segments: buildProcessMap(project), subagents })
  } catch (error) {
    sendJson(res, 500, { ok: false, error: String(error instanceof Error ? error.message : error) })
  }
}


function handleProjects(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const sessionId = sessionOf(url.searchParams.get('session'))
  try {
    sendJson(res, 200, { ok: true, session: sessionId, projects: listProjects(sessionId) })
  } catch (error) {
    sendJson(res, 500, { ok: false, error: String(error instanceof Error ? error.message : error) })
  }
}


function handleSettings(_req, res) {
  try {
    const settings = readSettings()
    sendJson(res, 200, {
      ok: true,
      settings: { mineruTokenSet: typeof settings.mineruToken === 'string' && settings.mineruToken !== '' },
    })
  } catch (error) {
    sendJson(res, 500, { ok: false, error: String(error instanceof Error ? error.message : error) })
  }
}


/** 全部项目 id（注册表 + 默认目录遗留，wizard 暂存跳过）。 */
function allProjectIds() {
  const ids = new Set()
  for (const id of Object.keys(readRegistry())) {
    if (PROJECT_ID_RE.test(id)) ids.add(id)
  }
  for (const name of readdirSync(projectsRoot())) {
    if (PROJECT_ID_RE.test(name) && !name.startsWith('wizard-')) ids.add(name)
  }
  return [...ids]
}


/** 启动恢复链（术语见 CONTEXT.md）：回填老书过程记录 → 处理重做标记 → 续跑进行中的书。
 *  三步顺序属于领域知识；apply 只保留延迟时机策略（setTimeout），测试可直接调用本函数直测。 */
export function startupRecovery(ctx) {
  backfillProcessLogs()
  processRedoMarks()
  resumeRunning(ctx)
}


/** 启动续跑：把状态为 running 的书重新推进（转换中断/宿主重启后自动继续）。
 *  机器在等主 AI（pendingStage）时重新唤醒（AI 回合随宿主重启而中断，需重派）。 */
function resumeRunning(ctx) {
  // 只处理 status === 'running'；awaiting-outline / awaiting-chapters-review / 暂停等情况自然跳过（awaiting 用户确认，不自动续跑）。
  for (const id of allProjectIds()) {
    try {
      const meta = readMeta(id)
      if (meta === null || meta.demo === true) continue
      if (meta.status === 'running') {
        if (meta.pause !== null && meta.pause !== undefined) {
          ctx.logger.info('[textbook-workflow] 项目处于用户暂停，重启后保持暂停不自动续跑')
          continue
        }
        ctx.logger.info(`[textbook-workflow] 续跑项目 ${id}`)
        if (meta.pendingStage !== null && meta.pendingStage !== undefined) {
          // 恢复此前交办：重新记账 + 再唤醒主 AI（本方法幂等）。
          handoff(ctx, id, meta.pendingStage, meta.pendingGate ?? null)
        } else {
          void kick(ctx, id)
        }
      }
      // awaiting-explore / awaiting-gold / awaiting-final-approval / delivered / error：停在用户确认点或终点，不自动推进。
    } catch { /* 单个项目损坏不影响启动 */ }
  }
}


/** 老书回填：过程记录.md 不存在时，把 timeline 全部事件补写成可读文档。 */
function backfillProcessLogs() {
  for (const id of allProjectIds()) {
    try {
      const meta = readMeta(id)
      if (meta === null || meta.demo === true) continue
      const logPath = processLogPath(id)
      if (existsSync(logPath)) continue
      const events = readEvents(id)
      if (events.length === 0) continue
      const lines = []
      for (const event of events) {
        const entry = logEntryText(event)
        if (entry === null) continue
        const time = new Date(event.time).toLocaleString('zh-CN', { hour12: false })
        lines.push(`### ${time}\n${entry}\n`)
      }
      if (lines.length > 0) {
        writeFileSync(logPath, lines.join('\n') + '\n')
        console.log(`[textbook-workflow] 已回填过程记录：${id}`)
      }
    } catch { /* 单本书失败不影响启动 */ }
  }
}


/** 重做标记：书夹里存在 .redo 时，重启后先重置（清产物 → 回源探查）再续跑。 */
function processRedoMarks() {
  // trash 目录真实部署里由首次删书（trashProject）创建；全新安装从未删书时不存在，
  // 不先建目录则 moveAcrossDevices 的 renameSync 对缺失父目录抛 ENOENT（非 EXDEV 不降级），
  // 被外层 catch 静默吞掉 → .redo 滞留书夹，下次重启再触发一次全量重置（workflow-seams/02）。
  // 建目录失败（如 $DSH_HOME 不可写）不阻断启动：标记滞留由下方 move 的 catch 兜底（旧行为）。
  const trash = join(dshHome(), 'textbook', 'trash')
  try { mkdirSync(trash, { recursive: true }) } catch { /* 兜底：move 侧 catch 接管 */ }
  for (const id of allProjectIds()) {
    try {
      const dir = projectDir(id)
      const mark = join(dir, '.redo')
      if (!existsSync(mark)) continue
      const workDirPath = workDir(id)
      if (existsSync(workDirPath)) {
        const archive = join(workDirPath, '_旧版产物')
        mkdirSync(archive, { recursive: true })
        const stamp = Date.now().toString(36)
        for (const name of readdirSync(workDirPath)) {
          if (name === '_旧版产物') continue
          if (name === 'explore.md' || /^chapter-\d+\.md$/.test(name) || /^audit-\d+\.md$/.test(name)
              || name === 'book.md' || name === 'style-spec.md' || name === 'outline.md') {
            try { renameSync(join(workDirPath, name), join(archive, `${name}.${stamp}`)) } catch { /* 尽力归档 */ }
          }
        }
      }
      const meta = readMeta(id)
      if (meta !== null) {
        meta.phase = 2
        meta.status = 'running'
        meta.converting = false
        delete meta.outline
        meta.updatedAt = Date.now()
        writeMeta(meta)
        try {
          appendEvent(id, 'textbook/hint', { text: '已执行「重置重做」：从源探查重新开始（材料保留）' })
        } catch { /* 账本异常忽略 */ }
      }
      // 移除标记（rmSync 在部分盘上失效，用移动代替；跨盘 EXDEV 自动降级复制+删除）。
      try {
        moveAcrossDevices(mark, join(trash, `.redo-${id}-${Date.now().toString(36)}`))
      } catch { /* 标记留着下次再处理 */ }
      console.log(`[textbook-workflow] 已重置重做：${id}`)
    } catch { /* 单本书失败不影响启动 */ }
  }
}


export function apply(ctx) {
  bindAnnounce(ctx)
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/projects', handler: handleProjects }), 'textbook: projects route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/events', handler: handleEvents }), 'textbook: events route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/process', handler: (req, res) => handleProcess(ctx, req, res) }), 'textbook: process route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/action', handler: (req, res) => handleAction(ctx, req, res) }), 'textbook: action route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/upload', handler: handleUpload }), 'textbook: upload route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/work', handler: handleWork }), 'textbook: work route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/file', handler: handleFile }), 'textbook: file route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/download', handler: handleDownload }), 'textbook: download route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/settings', handler: handleSettings }), 'textbook: settings route')
  ctx.logger.info('[textbook-workflow] 造书工作台后端已加载（步骤5：六阶段状态机）')
  // 宿主重启后延迟 3 秒走启动恢复链（三步顺序见 startupRecovery；这里只定时机）。
  setTimeout(() => {
    startupRecovery(ctx)
  }, 3000)
}
