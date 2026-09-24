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
  updateMeta,
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
import { readFileSync, readdirSync, writeFileSync, existsSync, statSync, mkdirSync, renameSync, rmSync, realpathSync } from 'node:fs'
import { join, resolve, basename } from 'node:path'
import { isWithin } from './path-guard.js'
import { readSettings } from './mineru-lib.js'
import { MAX_UPLOAD_BYTES, uploadTooLargeMessage, productOpenMode, SEGMENT_PHASE } from './domain-rules.js'


export const name = 'textbook-workflow'

export const inject = ['webServer', 'agents', 'subagents', 'sessions']

const SESSION_ID_RE = /^[A-Za-z0-9._-]{1,128}$/


/**
 * 读 session 参数：缺失/非法返回 null，由调用方回 400（票 04）。
 * ⚠️ 曾经缺省回退 `'default'`——所有权检查于是只剩「会话 id 给对了」那么强：
 * 带着非法 session 的请求会被当成 default 会话，凡是 meta.session === 'default'
 * 的老书都能被任何人读写。宁可拒绝，也不替调用方猜一个身份。
 */
function sessionOf(value) {
  if (typeof value === 'string' && SESSION_ID_RE.test(value)) return value
  return null
}


/** 校验会话参数：缺失/非法直接回 400 并返回 null（调用方据此提前 return）。 */
function requireSession(value, res) {
  const sessionId = sessionOf(value)
  if (sessionId === null) {
    sendJson(res, 400, { ok: false, error: '缺少或非法的 session 参数' })
    return null
  }
  return sessionId
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
  const sessionId = requireSession(url.searchParams.get('session'), res)
  if (sessionId === null) return
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
    // ⚠️ 状态改在 updateMeta 的改法里（当场新读）：上面 `await readRawBody` 期间可能已经有一笔
    // 记进了账本——原先拿着函数开头那份旧状态整份写回，会把账高打回读请求体之前的旧值，
    // 于是同一拍的下一次上传重号（真账本头六笔 source-added 序号全是 1，票 02）。
    let added = false
    updateMeta(project, (state) => {
      const sources = state.sources ?? []
      // 幂等：同一文件名重复上传只更新角色，不再追加条目/事件。
      // 背景：客户端瞬时网络失败（Failed to fetch）时服务端已落盘，前端重传同一批文件；
      // 无幂等 → meta.sources 与 timeline 逐次重复（实测 4 文件 × 3 轮 = 12 条）。
      const existing = sources.find((source) => source.file === safeName)
      if (existing !== undefined) {
        existing.role = role
      } else {
        sources.push({ file: safeName, role, converted: false })
        added = true
      }
      state.sources = sources
      state.status = 'active'
    })
    if (added) appendEvent(project, 'textbook/source-added', { file: safeName, role })
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


/**
 * GET /textbook/file?session=&project=&path= （文本读回：**只给有正文的产物**）
 *
 * 票 04 收窄：判据换成 domain-rules 的显式产物清单（productOpenMode === 'preview'，
 * 章节 / 探查报告 / 设计关卡方案 / 自查报告 / 成品 / 材料转换出的 Markdown），
 * **不是**扩展名、也不是「在项目目录里」——旧判据是后两者，于是机器产物
 * （knowledge-map.json / project.json / timeline.jsonl）与源 PDF 一道可读。
 *
 * 这条路由保留（历史章节回看、金标准逐段对比仍在调它，见 gold-table.js 的 fetchText），
 * 但只放行人会读的正文；越界/非白名单一律拒绝并给出可读原因，不静默。
 */
function handleFile(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const sessionId = requireSession(url.searchParams.get('session'), res)
  if (sessionId === null) return
  const project = url.searchParams.get('project')
  const rel = url.searchParams.get('path')
  if (project === null || rel === null) {
    sendJson(res, 400, { ok: false, error: '缺少参数' })
    return
  }
  if (productOpenMode(rel) !== 'preview') {
    sendJson(res, 403, { ok: false, error: '这份是机器产物，不提供文本读回' })
    return
  }
  try {
    assertSessionOwned(project, sessionId)
    const root = resolve(projectDir(project))
    const target = resolve(root, rel)
    if (!isWithin(root, target)) {
      sendJson(res, 403, { ok: false, error: '路径越界' })
      return
    }
    if (!existsSync(target) || statSync(target).isDirectory()) {
      sendJson(res, 404, { ok: false, error: '文件不存在' })
      return
    }
    // 白名单判的是名字，符号链接可以挂到项目外：再按真实路径确认一次落点还在项目里。
    if (!isWithin(realpathSync(root), realpathSync(target))) {
      sendJson(res, 403, { ok: false, error: '路径越界' })
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
  const sessionId = requireSession(url.searchParams.get('session'), res)
  if (sessionId === null) return
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
        if (name === 'explore.md') label = '读材料挑重点的结果'
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
  const sessionId = requireSession(url.searchParams.get('session'), res)
  if (sessionId === null) return
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
  ['review-revoke', actChapters],
  ['audit-submit', actChapters],
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
  const sessionId = requireSession(body.session, res)
  if (sessionId === null) return
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
  const sessionId = requireSession(url.searchParams.get('session'), res)
  if (sessionId === null) return
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
    // 票 14（界面数字同源）：`done` 直接问**闸门那一份判据**（engine 的 chapterDone：两份产物在
    // ＋ 机器记下的交工通过 ＋ 没有未处置的抽查意见）——界面的「已完成 X/Y 章」与过目闸门从此同源，
    // 两个数字不打架。**不许在这里写第二份判据**（写第二份就是本程要消灭的「两个数字打架」）。
    const chapters = meta.outline?.chapters ?? []
    const chapterStatus = chapters.map((chapter, index) => {
      const n = index + 1
      const { chapterPath, auditPath } = chapterArtifacts(project, n)
      return {
        n, title: chapter.title ?? `第${n}章`,
        source: chapter.source ?? '', targetWords: chapter.targetWords ?? null,
        // written/audited 保留为「产物在不在」的原义（界面用它区分「执笔中 / 写好了审计中 / AI 复核中」）；
        // done 才是闸门口径的「这一章算完成了」（客户端改用 done 后，两个数字必然一致）。
        written: existsSync(chapterPath), audited: existsSync(auditPath),
        done: chapterDone(project, n),
      }
    })
    // 探查摘要（探查确认卡用）：材料份数/知识点数/建议章数。
    let exploreSummary = null
    // 知识地图原文：机器产物，但人读形态是**卡片内联**折叠清单（ADR-0010 决策 2 / 票 05），
    // 故随事件一起下发，不再让前端走 /textbook/file——那条路由按「给人读的产物」收窄后
    // 拒绝机器产物（票 04）。文件不在/读不到时为 null（前端回退成一句可读说明）。
    let knowledgeMap = null
    try {
      const kmText = readFileSync(workFile(project, 'knowledge-map.json'), 'utf8')
      knowledgeMap = kmText
      const km = JSON.parse(kmText)
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
      knowledgeMap,
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
  // 「当前正在做的是哪一步」只认 pendingStage/pendingGate/status，**不认「phase 已经走到几」**。
  // 根因（2026-09-20 走查 04 屏）：原式一律 `phase >= N ? 'active' : 'pending'`，于是书一进
  // 第 3 期，第 2/3 次拍板与章节安排统统亮成「▶ 我正在做」——从没碰过的步骤也在"做"。
  const pending = meta?.pendingStage ?? null
  // 产物存在性按「项目目录相对路径」判（artifacts 输出即相对路径；workFile 会再拼 work/，不能复用）。
  const existsRel = (rel) => existsSync(join(projectDir(projectId), rel))
  // 探源
  push({
    key: 'explore', label: '源探查', kind: 'explore',
    // 阶段号：阶段片一格＝一个阶段＝若干分段（kind → 阶段号查 domain-rules 的 SEGMENT_PHASE，别手写数字）。
    phase: SEGMENT_PHASE['explore'],
    // 原式认 exploreConfirmed 单一标记：演示书没有这个标记，于是二十几步前就干完的「读材料」
    // 一直亮着「⚡轮到你」（03/04 屏实测）。改认「状态是否正停在等确认」+「是否已推进过去」。
    status: meta?.status === 'awaiting-explore'
      ? 'waiting-user'
      : (meta?.exploreConfirmed === true || phase >= 3 ? 'done' : (pending === 'explore' ? 'active' : 'pending')),
    artifacts: ['work/explore.md', 'work/knowledge-map.json'].filter(existsRel),
    redoNote: meta.exploreRedoNote ?? null,
  })
  for (const gate of ['1', '2', '3']) {
    // 2026-09-21 修：按 gate 号折（原来折"最后一个提案"，只有碰巧是它自己时才拿得到结论）。
    const folded = foldGate(projectId, gate)
    const mine = folded !== null && String(folded.gate) === String(gate) ? folded : null
    const approved = gateApproved(projectId, gate) || waived(projectId, 'gate-skip')
    push({
      key: `gate-${gate}`, label: `关卡${gate}·${GATE_LABELS[gate] ?? ''}`, kind: 'gate',
      phase: SEGMENT_PHASE['gate'],
      status: approved
        ? 'done'
        : (mine !== null && mine.status === 'awaiting'
          ? 'waiting-user'
          : (pending === 'gate' && meta?.pendingGate === gate ? 'active' : 'pending')),
      artifacts: [`提案/关卡${gate}-v1.md`].filter(existsRel),
      decision: mine === null ? undefined : { version: mine.version, approved: mine.status === 'approved', note: mine.decision?.note ?? '' },
    })
  }
  // 「章节安排」是第 3 次拍板定下来的东西——定过了才算做完。原式写 `phase >= 4 ? 'done' : 'active'`，
  // 于是只要章节清单已经存在（第 3 次拍板还没定）就亮「▶ 我正在做」（02 屏实测：那本书 phase=3、
  // 第 1 次拍板正等用户，步清单却把「章节安排」也报成"正在做"）。
  const gate3Ok = gateApproved(projectId, '3') || waived(projectId, 'gate-skip')
  push({
    key: 'outline', label: '章节安排', kind: 'outline',
    phase: SEGMENT_PHASE['outline'],
    status: meta?.status === 'awaiting-outline'
      ? 'waiting-user'
      : (gate3Ok || phase >= 4
        ? 'done'
        : (pending === 'outline' ? 'active' : 'pending')),
    artifacts: existsRel('work/outline.md') ? ['work/outline.md'] : [],
    redoNote: meta.outlineRedoNote ?? null,
  })
  const goldDone = meta.goldSealed != null || phase >= 5
  const goldNn = goldN(meta)
  push({
    key: 'gold', label: '最佳范例章（风格母版）', kind: 'gold',
    phase: SEGMENT_PHASE['gold'],
    status: goldDone ? 'done' : (meta.status === 'awaiting-gold' ? 'waiting-user' : (phase >= 4 ? 'active' : 'pending')),
    artifacts: ['work/style-spec.md', `work/chapter-${String(goldNn).padStart(2, '0')}.md`, `work/audit-${String(goldNn).padStart(2, '0')}.md`].filter(existsRel),
    decision: meta.goldSealed == null ? undefined : { version: meta.goldSealed.version, approved: true, note: '已定稿为最佳范例章' },
    redoNote: meta.goldRedoNote ?? null,
  })
  // 一章一章写：phase>=5 不等于每一章都在写。只有「已经在动的那章」（有流水线阶段上报）
  // 或「第一个还没写完的章」才是「▶ 我正在做」，其余未开始的章是 ○。
  const firstUndone = chapters.findIndex((_, index) => !chapterDone(projectId, index + 1))
  chapters.forEach((chapter, index) => {
    const n = index + 1
    const stageN = pipelineStage(meta, index)
    push({
      key: `chapter-${n}`, label: `第${n}章 ${chapter.title ?? ''}`, kind: 'chapter',
      phase: SEGMENT_PHASE['chapter'],
      status: chapterDone(projectId, n)
        ? 'done'
        : (phase >= 5 && (stageN !== null || index === firstUndone) ? 'active' : 'pending'),
      // F35（2026-08-20 走查）：每章流水线阶段（writing/auditing/audited/finalizing/done，未上报为 null）。
      stage: stageN,
      artifacts: [`work/chapter-${String(n).padStart(2, '0')}.md`, `work/audit-${String(n).padStart(2, '0')}.md`].filter(existsRel),
    })
  })
  push({
    key: 'chapters-review', label: '全章过目', kind: 'review',
    phase: SEGMENT_PHASE['review'],
    status: meta?.status === 'awaiting-chapters-review' ? 'waiting-user' : (meta?.chaptersReviewed === true || existsRel('work/book.md') ? 'done' : 'pending'),
    artifacts: [],
  })
  push({
    key: 'merge', label: '合并成书', kind: 'merge',
    phase: SEGMENT_PHASE['merge'],
    status: existsRel('work/book.md') ? 'done' : (phase >= 6 ? 'active' : 'pending'),
    artifacts: existsRel('work/book.md') ? ['work/book.md'] : [],
  })
  push({
    key: 'final', label: '最后检查与交付', kind: 'final',
    phase: SEGMENT_PHASE['final'],
    // 批 1 根因修复：原式只认 delivered → done，其余 phase>=6 → active，
    // 于是终检等认可时纵向地图显示「▶ 正在做」，而横向阶段片显示「⚡轮到你」——同屏打架。
    status: meta?.status === 'delivered' ? 'done' : (meta?.status === 'awaiting-final-approval' ? 'waiting-user' : (phase >= 6 ? 'active' : 'pending')),
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


/** 分段清单（`/textbook/process`）：历史分段 + 影响预告 + 撤销窗口。
 *
 * ⚠️ 票 stale-detection/01：这里原来还自己列一遍子代理、把 `{running, inactive}` 随响应下发，
 * 前端拿它拼「N 个小助手在跑 / N 个完成待收」。那条路径有两个毛病：① 口径不是宿主的口径
 * （`listDescendants` 的 `activity` 说的是「记录还在不在内存里」，驻留但空闲的也算在跑）；
 * ② 前端每 2 秒轮询、拉取失败还静默保留旧值——一旦它参与抑制就成了永久消音器。
 * 小助手状态现已改读宿主推送的会话摘要（前端那份订阅本来就在），这段计数随之删除；
 * 端点本身留着，它还返回这份分段清单。 */
async function handleProcess(ctx, req, res) {
  const url = new URL(req.url, 'http://localhost')
  const sessionId = requireSession(url.searchParams.get('session'), res)
  if (sessionId === null) return
  const project = url.searchParams.get('project')
  if (project === null || !PROJECT_ID_RE.test(project)) {
    sendJson(res, 400, { ok: false, error: '缺少或非法的 project 参数' })
    return
  }
  try {
    assertSessionOwned(project, sessionId)
    sendJson(res, 200, { ok: true, project, segments: buildProcessMap(project) })
  } catch (error) {
    sendJson(res, 500, { ok: false, error: String(error instanceof Error ? error.message : error) })
  }
}


function handleProjects(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const sessionId = requireSession(url.searchParams.get('session'), res)
  if (sessionId === null) return
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
        // 重置重做的状态改动走 updateMeta（不拿手里那份旧状态整份写回）。
        updateMeta(id, (state) => {
          state.phase = 2
          state.status = 'running'
          state.converting = false
          delete state.outline
          // 票 13（spec 第 7 条 / 不变量 5）：全量重置**清 `pendingReviews`**——重排大纲后旧章号的意见
          // 不许拦到新章号上（意见是挂在章号上的，章号一旦重排，旧意见指向的就是另一章了）。
          // 同时清掉「全章过目已通过」的标记：这一程的全部章节都要重新写、重新过目。
          delete state.pendingReviews
          state.chaptersReviewed = false
        })
        try {
          appendEvent(id, 'textbook/hint', { text: '已执行「重置重做」：从读材料挑重点重新开始（材料保留）' })
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
