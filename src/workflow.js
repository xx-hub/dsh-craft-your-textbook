/**
 * 造书工作台 · 后端流程插件（宿主侧）——Web 壳
 *
 * 本文件保留：插件元数据（name/inject）、HTTP handlers、启动恢复链、
 * apply（路由注册 + 时机）、动作族 dispatch 表（HANDLER_OF_FAMILY + 由目录构造的
 * ACTION_FAMILY_OF，票 contract-actions/04）。
 * 领域引擎（六阶段状态机核心 + 共享工具）在 ./workflow/engine.js；
 * 9 个动作族在 ./workflow/actions/*.js；动作身份与动作族 metadata 在 ./contract-actions.js。
 */
import {
  GATE_LABELS,
  PROJECT_ID_RE,
  appendEvent,
  appendHumanActionEvent,
  assertSessionOwned,
  bindAnnounce,
  bindContextOccupancy,
  chapterArtifacts,
  chapterWordReading,
  chapterDone,
  noteStyleSpecChange,
  deepAffected,
  dshHome,
  foldGate,
  flushMeta,
  gateApproved,
  goldN,
  handoff,
  kick,
  listProjects,
  logEntryText,
  // 票 `dsh-contract-drift/09`：「提问没记上」那一句的唯一措辞出处（`logEntryText` 与
  // 本文件 `handleQuestion` 共用，⛔ 不在这里手抄第二份）。
  questionUnrecordedText,
  moveAcrossDevices,
  processLogPath,
  projectDir,
  projectsRoot,
  proposalFilesOnDisk,
  readEvents,
  readMeta,
  readRegistry,
  isRunning,
  snapshotsDir,
  sourcesDir,
  trashProject,
  waived,
  bookRelOnDisk,
  legacyDirConflicts,
  workDir,
  workFile,
  updateMeta,
  // 票 `depth-review-2026-10/04`：`.redo` 标记那一步（本文件唯一的归档点）走 engine 那一份原语
  // ——「归档成没成」的判据六条路径只许有一份，本文件不再内联 renameSync。
  archiveWorkArtifacts,
  // 票 `confirm-points-redesign-build/08`：范例章旧稿清单与「现在是第几稿」的唯一出处
  // （原先那一段内联实现搬进 `engine.js`，站 8 的结论件要写同一个「第几稿」）。
  goldDraftsOf,
  goldDraftVersionOf,
  // 票 `confirm-points-redesign-build/09`：站 0／1「只提示人」那一句的**唯一出口**（标签簇，
  // 由 `engine.js` 再导出）——上传那一支（站 1 的清单增了一件）引的就是这一份。
  STATION_VALUE_EDIT_HINT,
} from './workflow/engine.js'
import { actBooks } from './workflow/actions/books.js'
import { actWizard } from './workflow/actions/wizard.js'
import { actConvert } from './workflow/actions/convert.js'
import { actGates } from './workflow/actions/gates.js'
import { actGold, canEditTargetWords } from './workflow/actions/gold.js'
import { actDeepModify } from './workflow/actions/deep-modify.js'
import { actCollabSignals } from './workflow/actions/collab-signals.js'
import { actChapters, readChapterAuditSummary } from './workflow/actions/chapters.js'
import { actPatternsOps } from './workflow/actions/patterns-ops.js'
import { buildActionFamilyTable } from './workflow/registration.js'
import { listStationDecisionActions } from './contract-actions.js'
import { runAction } from './workflow/action-runner.js'
import { bookShapeReport, refreshArtifactRegistry } from './workflow/book-shape.js'
import { readFileSync, readdirSync, writeFileSync, existsSync, statSync, mkdirSync, rmSync, realpathSync } from 'node:fs'
import { join, resolve, basename } from 'node:path'
import { isWithin } from './path-guard.js'
import { autoSplitAvailable, mineruTokenStatus } from './mineru-lib.js'
// 票 `confirm-points-redesign-build/08`：站 8／9 的结论件读侧（`metaView.stationDecisions`
// 那一个折叠的唯一来源）。⛔ 本文件不自己解析 `工作区/决策/NN.json`。
import { readStationDecision, readEffectiveStationDecision, decisionApproved } from './workflow/decision-record.js'
// 票 `graph-read-one-answer/04`：合并件的读侧只问这一个出口（票 01 的窄出口）——
// `/textbook/events` 的 `knowledgeMap` 原文与 `exploreSummary` 三格出自**同一次**读。
// ⛔ 本文件不再自己 `readFileSync ＋ JSON.parse` 那份件（第六份手搓读盘）。
import { readMergedMap } from './workflow/knowledge-graph-build.js'
import { MAX_UPLOAD_BYTES, uploadTooLargeMessage, productOpenMode, artifactKind, SEGMENT_PHASE, countHanzi, contextOccupancyPercent, convertedState, MATERIAL_INTAKE, judgeMaterialFileIntake, chapterRel, chapterName, auditRel, auditName, KNOWLEDGE_MAP_EXCLUSIONS_FILE_NAME, READER_QUESTIONNAIRE_RETURNED_FILE_NAME } from './domain-rules.js'


export const name = 'textbook-workflow'

// 回答：`sessionProjections`（宿主 `contextPressure` 会话投影的读数口，票 walkthrough-fixes/28）。
// 没有它，领任务说明里那一句「上下文已用 N%」就永远不出现（读数口未绑定 ⇒ null ⇒ 整句不追加，
// 读不到就不显示，不显示 0%）——而不是写一个假数。
// 票 `chapter-audit-orchestration/04` 再加 `jobs`：暂停要停掉这本书 owner 名下**在跑的编排脚本**
// （消费点 `ctx.jobs.list` / `ctx.jobs.kill` 在 `src/workflow/actions/collab-signals.js`）。
// 它是宿主组合里的**常驻服务**（`@deepseek-ai/dsh-base` 的 `cordis.patch.yml` 在宿主组合里加载
// `dsh-jobs-local`，`ctx.jobs` 由那一份的实现声明合并进来）⇒ 走直接成员访问，不进动态读取登记表。
// 按 AGENTS.md「用谁就声明谁」：声明在 `dev/host-contract-gate/catalog/web-chat.js` 的
// `contracts.session.source.hostServiceInjection.required` 里，拿掉这一枚会判红 `undeclared-host-service`。
export const inject = ['webServer', 'agents', 'subagents', 'sessions', 'sessionProjections', 'jobs']

const SESSION_ID_RE = /^[A-Za-z0-9._-]{1,128}$/


/**
 * 写一次 JSON 响应 —— **HTTP adapter**（字节与 header 归它，状态落盘不归它）。
 *
 * ⚠️ 票 `deep-module-scan/11`：这个函数原先住在 `src/workflow/engine.js`，于是**一条领域不变量
 * （状态必须在工作单元结束时落盘）的 owner 是住在领域 module 里的 HTTP adapter**。
 * 后果是每一条**不经 HTTP 的路径**都得自己记得调 `flushMeta()`——今天有 9 处测试在替生产代码记这件事
 * （`test-material-gap-stance.mjs` 七处、`test-ledger-seq-integrity.mjs` 两处）。
 *
 * ⇒ 本次是**纯搬运**：43 个调用点**全部**在本文件里，engine 里一处都不用，所以搬完是一处不漏的机械移动。
 * **搬动的机械条件正是那 43 个调用点都在这里**——若哪天某个动作族开始直接用它，得先想清楚那是
 * 「不经 HTTP 的领域路径」（该自己 flush，不该用这个）还是「又多了一个 HTTP adapter」。
 */
function sendJson(res, status, value) {
  // 元数据批量落盘边界：任何 HTTP 响应前把待写 project.json 同步写盘，
  // 外部读者（工作台/测试直读）始终看到最新状态（与旧同步写语义一致）。
  // ⚠️ **顺序不许调**：flushMeta 在 writeHead 之前。换了顺序，`test-startup-recovery.mjs:297-303`
  // 那种「返回瞬间文件可能还是旧值、轮询等 flush」的假设要重新验。
  flushMeta()
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(body)
}


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


/**
 * 材料受理判据说「不收」时的那一个回包（票 `upload-formats/01`）。**唯一出口**：
 * 四条拒收路径（第一段的名单外／第二段的通道外与坏件）都从这里出去，⛔ 不许各写一份——
 * 少带一个 `code` 的那一处，客户端就分不出「格式不支持」与「文件已损坏」。
 */
function sendIntakeRejection(res, verdict) {
  sendJson(res, 400, { ok: false, code: verdict.code, error: verdict.message })
}


/** POST /textbook/upload?session=&project=&name=&declared= （raw body = 原件字节；后缀闸门见下）
 *
 * ⚠️ **票 `pre-gold-build/02`：这里不再收 `role` 参数**——上传那一刻还没有角色这回事。
 * 角色由探查段开头那一趟**书级材料判定**产出（`工作区/材料判定.json`，派发档 `material-survey`），
 * 交工那一刻机器按 `num` 并进合并件的 `materials[]`（口径见
 * `.scratch/pre-gold-processes/issues/11` 的 `§6` 第 7／8 行：上传落库**键缺席**、URL 参数退役）。
 *
 * ⚠️ **票 `confirm-points-redesign-build/03`：多了一个 `declared` 参数**——那句材料声明（「我只上传
 * 有权使用的材料……」）从建书屏搬到了**真正要上传的这一站**。它是**用户在这一屏的勾选**
 * （`UploadArea` 那颗勾选框，界面在没勾时**不让**发上传），随这一趟上传一起交上来，落成
 * `meta.materialDeclaration`（字段名归实现定）＋ **一条账**（走既有通道 `textbook/hint`）。
 * ⛔ 服务端**不替用户声明**：没带 `declared=1` 的请求一个字的声明都不落——「承诺面 ＞ 实现面」
 * 正是本票要治的形状。声明**只落一次**（同一颗勾选框连传多份，账上只有第一条）。
 */
async function handleUpload(ctx, req, res) {
  const url = new URL(req.url, 'http://localhost')
  const sessionId = requireSession(url.searchParams.get('session'), res)
  if (sessionId === null) return
  const project = url.searchParams.get('project')
  const name = url.searchParams.get('name')
  // 用户在站 1 勾了那句材料声明吗（见上方契约注释）。
  const declared = url.searchParams.get('declared') === '1'
  if (project === null || !PROJECT_ID_RE.test(project)) {
    sendJson(res, 400, { ok: false, error: '缺少或非法的 project 参数' })
    return
  }
  // ⚠️ 票 07：受理闸门与 400 文案**都从 `MATERIAL_FORMATS` 派生**（`src/domain-rules.js`），
  // 浏览器那个 `<input accept>` 由**同一份**常量派生——两侧不许各写一份（照
  // `MAX_UPLOAD_BYTES` 的先例）。原来这里是 `!/\.pdf$/i.test(name)` 一行手抄的后缀，
  // 改名单时它会**静默**留在原地（前端放行、后端拒收，或反过来）。
  // 名单里的多数格式（图片 / Office）上游只有散文声明、零成功记录 ⇒ 那一格在界面上标「未标定」。
  //
  // ⚠️ **票 `upload-formats/01`：受理判定分两段，第一段只看名字。**
  // 名单外的一律当场拒（不必把一个注定退回去的 500MB 请求体读进来）；但**通道外**那几档
  // （今天只有 epub）要看到**字节**才能把「文件本身是坏 zip」与「这个格式云端不收」分开报——
  // 前者要用户重新拿一份，后者要用户换一条路。所以那一档**不在这里拒**，往下走读到字节再判。
  // 两段用的是**同一份**判据（`judgeMaterialFileIntake`，界面那次选文件也调它）。
  const nameVerdict = judgeMaterialFileIntake({ name })
  // 「这一档要不要看到字节才定得下来」只认判据自己声明的 `needsBytes`，⛔ 不在这里猜枚举
  // （写成「状态不是这两档」的取反，加第五档时会把它静默归进「名字就能判」那一支）。
  if (nameVerdict.needsBytes === false && nameVerdict.status !== MATERIAL_INTAKE.ACCEPTED) {
    sendIntakeRejection(res, nameVerdict)
    return
  }
  // ⚠️ **票 `pre-gold-build/02`：那一道 `role` 白名单闸门随参数一起退役**——上传接口不再收角色，
  // 也就没有「越界角色直连绕过界面」这条口子（口径见这张票的 §6 第 7／8 行）。
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
    // ⚠️ **第二段**（票 `upload-formats/01`）：拿到字节之后，同一份判据再判一次。
    // 这一档只对**登记过的通道外格式**有意义（epub 的坏 zip）——受理格式不走这条，
    // `judgeMaterialFileIntake` 对它们直接返回 ACCEPTED（要不要替 MinerU 先验容器是另一个决定）。
    // 拒的时候**一个字节都不落盘**（票面验收②的隐含要求：被拒的那份不许留在 sources/ 里）。
    const bytesVerdict = judgeMaterialFileIntake({ name, bytes })
    if (bytesVerdict.status !== MATERIAL_INTAKE.ACCEPTED) {
      sendIntakeRejection(res, bytesVerdict)
      return
    }
    writeFileSync(join(sourcesDir(project), safeName), bytes)
    // ⚠️ 状态改在 updateMeta 的改法里（当场新读）：上面 `await readRawBody` 期间可能已经有一笔
    // 记进了账本——原先拿着函数开头那份旧状态整份写回，会把账高打回读请求体之前的旧值，
    // 于是同一拍的下一次上传重号（真账本头六笔 source-added 序号全是 1，票 02）。
    let added = false
    let resent = false
    // 这一趟是否**第一次**落那句材料声明（同一个勾选框连传多份，账上只留第一条）。
    let declaredNow = false
    updateMeta(project, (state) => {
      // ── 材料声明（票 `confirm-points-redesign-build/03`）────────────────────────────
      // 用户在这一屏勾了它（界面没勾不许发上传），所以这一条账记的是**用户真的表过的态**。
      // 只落一次：已经声明过的（`materialDeclaration` 在）不再重复落账。
      if (declared === true && state.materialDeclaration === undefined) {
        state.materialDeclaration = { at: Date.now(), by: 'user' }
        declaredNow = true
      }
      const sources = state.sources ?? []
      // 幂等：同一文件名重复上传不再追加条目/事件（**也不再更新角色**——票 `pre-gold-build/02`
      // 起这里一个字都不写角色：上传那一刻还没有角色，它由探查段开头的书级材料判定产出）。
      // 背景：客户端瞬时网络失败（Failed to fetch）时服务端已落盘，前端重传同一批文件；
      // 无幂等 → meta.sources 与 timeline 逐次重复（实测 4 文件 × 3 轮 = 12 条）。
      const existing = sources.find((source) => source.file === safeName)
      if (existing !== undefined) {
        // 票 `mineru-formats/03`（ADR-0028 决策 3）的**「补传」那一半**：同一个名字再传一次，
        // 而那一格正是一个缺口（`failed`）⇒ 这是用户对这一份表过态「我补一份」，把它放回
        // `'pending'`，下一轮状态机真的会重转它（`failed` 自己不会被挑中重传，票 02）。
        // ⚠️ 只对 `failed` 放行：转成过的那份（`ok`）重传**不动**它的结局——那是另一个问题
        // （原件换了、转换稿还是旧的），不在本票射程里，票面 Comments 记着。
        // 顺手清掉旧的转换稿路径：那一格要重新转，旧的 `md` 留着就是一处会指向过期文件的指针。
        if (convertedState(existing) === 'failed') {
          existing.converted = 'pending'
          delete existing.md
          resent = true
        }
      } else {
        // ⚠️ **键缺席**（不是空串）：`role` 从此不由上传写面维护，⛔ 也不在这里补一个默认值
        // ——那会把「一个事实两处」再长一次（口径见票 11 §6 第 7 行）。
        sources.push({ file: safeName, converted: 'pending' })
        added = true
      }
      state.sources = sources
      state.status = 'active'
      // 补传的那一格是「待转」，不是「已转」——状态得让状态机能接上去（见下面那次 kick）。
      if (resent) state.status = 'running'
    })
    if (added) appendEvent(project, 'textbook/source-added', { file: safeName })
    // ── 票 `confirm-points-redesign-build/09`：**站 1 的「只提示人」那一档** ────────────────────
    // 材料清单增了一件（＝站 1 原地改清单）：清单是**现读**的，没有可作废的产物 ⇒
    // ⛔ 不归档、⛔ 不截账本、⛔ 不清 `meta`、⛔ 不把待办指回，只**多打一句**（spec §4.5 的两处例外之一）。
    // ⚠️ 只在**真的多了一件**时打（重复上传／补传那一支的清单没变，那句话对它们不成立）。
    if (added) appendEvent(project, 'textbook/hint', { text: STATION_VALUE_EDIT_HINT })
    // 材料声明那条账（既有通道 `textbook/hint`，⛔ 不新开事件类型）：正文＝用户勾的那句话本身。
    if (declaredNow) {
      appendEvent(project, 'textbook/hint', {
        text: '📋 材料声明已确认：只上传有权使用的材料；造出来的是教学参考，AI 可能讲错，使用前会请老师/家长复核。',
        declaration: 'material-rights',
        by: 'user',
      })
    }
    if (resent) appendEvent(project, 'textbook/hint', { text: `已补传《${safeName}》，正在重新转换这一份` })
    // 补传要**当场**接上状态机：用户点的是「补传这一份」，点完就该看着它重转，
    // 而不是还得再点一次「开始转换」才动（那就不是一个动作，是两步）。
    // ⚠️ 已经有一个状态机在跑时**不**再起第二个：那一轮每轮都重读 meta，下一次循环自己
    // 就把这一格 pending 挑去转了；两个 runLoop 并跑会把同一批待转源重复提交给 MinerU
    // （烧额度）。「有没有在跑」经 `isRunning` 取（票 `deep-module-scan/10`：原先两处各读一次
    //  `runners.has`、含义只活在各自的注释里；`runners` 本身仍导出，因为删书要清理它）。
    if (resent && ctx !== undefined && isRunning(project) === false) void kick(ctx, project)
    sendJson(res, 200, { ok: true, project, file: safeName, resent })
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
    // ⚠️ **老书读侧兜底**：传上来的是**规范形状**（`工作区/chapter-01.md`），而老书盘上是老名那一份
    // ——`bookRelOnDisk` 负责这一步「新名 → 盘上真落点」。
    // ⚠️ **越界判定不许因此放松**：它返回的那一条照样过下面两道 `isWithin`（符号链接那道也在），
    // 兜底只许在**书夹之内**的老名段上生效，不许变成一条绕过越界判定的旁路。
    const target = bookRelOnDisk(project, rel)
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
        if (label !== null) files.push({ path: `工作区/${name}`, label })
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
    // `rel` 来自 query（用户可造）而下面要 `readFileSync(target)`（读盘）⇒ 按落点协议必须第二道：
    // 第一道只看名字，链接可以挂到书夹外；这条路由又没有 `productOpenMode` 白名单，
    // 书夹里任何一件都能被读走，所以同一枚链接在这里的暴露面比 `/textbook/file` 更宽。
    // ⚠️ 必须排在 `existsSync` 之后：target 已存在，`realpathSync` 才不抛。
    if (!isWithin(realpathSync(root), realpathSync(target))) {
      sendJson(res, 403, { ok: false, error: '路径越界' })
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


/**
 * 提问卡的一次作答 → 一条书账本事件（票 06 ②）。
 *
 * 真相（票面 §先说清楚）：提问卡是**宿主**的 UI——`dsh-client-ui-user-questions` 接管聊天编辑器，
 * 渲染的是 `dsh-tool-ask-user`（工具名 `ask_user_question`）的 schema。答案**本来留痕了**，
 * 只留在宿主会话档案里；书账本里查不到，那才是这一票要补的通路。
 *
 * **为什么是新端点而不是新动作**：契约面动作目录（`src/contract-actions.js`）的 <!--r:catalog.canonical-->54<!--/r--> 个规范动作里
 * 没有任何一个的语义是「记下用户答了什么」——硬套 `intervene`（留言）会让账本说「稍后处理」，
 * 而用户答完那一刻 AI 正在等这个答案，说法就是假的。动作身份归目录，目录不归本票改。
 *
 * **为什么作答那一档复用 `textbook/hint` 这个事件类型**：`hint` 正是仓里登记的「碎语」通道
 * （docs/协作模型.md §2.8 表 B 多处复用），语义就是「随手记一句、不产出文件」。结构化的
 * `question` / `answers` 一并写进 data，机器产物 `timeline.jsonl` 里查得到——**不靠人读文本
 * 还原那次选择**。
 *
 * ⚠️ **「读不到答案」是另一档、另一条事件**（票 `dsh-contract-drift/09`）：body 带
 * `unread: true` 时客户端已确认那张卡结算了，只是按 `callId` 从读面回读读不到——这一档落
 * `textbook/question-unrecorded`（正文写明「需要重新问用户」），⛔ **不落 hint**；否则账本上
 * 会多一笔「（没有勾选）」的假话。
 *
 * ⚠️ 发生时刻由 `appendEvent` 打在事件上（服务端时间）：浏览器不另带一个自己的时刻来，
 * 与「新鲜度是服务端事实」同一条纪律。
 *
 * POST /textbook/question?session=&project= （body: { key, questions, answers, unread? }）
 */
async function handleQuestion(req, res) {
  let body
  try {
    body = await readBody(req)
  } catch (error) {
    sendJson(res, 400, {
      ok: false,
      error: error?.code === BODY_TOO_LARGE ? '请求体超过 64MB 上限' : '请求体不是合法 JSON',
    })
    return
  }
  const sessionId = requireSession(body.session, res)
  if (sessionId === null) return
  const project = body.project
  if (typeof project !== 'string' || !PROJECT_ID_RE.test(project)) {
    sendJson(res, 400, { ok: false, error: '缺少或非法的 project 参数' })
    return
  }
  const questions = Array.isArray(body.questions) ? body.questions : []
  const answers = Array.isArray(body.answers) ? body.answers : []
  if (questions.length === 0 && answers.length === 0) {
    sendJson(res, 400, { ok: false, error: '没有可记的提问内容' })
    return
  }
  try {
    assertSessionOwned(project, sessionId)
  } catch (error) {
    // 归属不成立是**请求本身不成立**，与「机器出错」分开回（与 upload/file 同一口径）。
    sendJson(res, 403, { ok: false, error: String(error instanceof Error ? error.message : error) })
    return
  }
  try {
    if (readMeta(project) === null) {
      sendJson(res, 404, { ok: false, error: '项目不存在' })
      return
    }
    const asked = questions
      .map((item) => (typeof item?.header === 'string' && item.header.trim() !== '' ? item.header.trim() : item?.question))
      .filter((text) => typeof text === 'string' && text.trim() !== '')
    // 票 `dsh-contract-drift/09`：「读不到答案」与「一次作答」是**两档**，账上不许混。
    // `unread === true` 时客户端已确认那张卡结算了、只是按 `callId` 从读面回读读不到——
    // 这一档**不落 hint**（否则账本上多一笔「（没有勾选）」的假话），落它自己那条
    // `textbook/question-unrecorded`，正文写明「需要重新问用户」。
    if (body.unread === true) {
      const key = typeof body.key === 'string' ? body.key : ''
      appendEvent(project, 'textbook/question-unrecorded', {
        text: questionUnrecordedText(asked),
        question: asked,
        key,
        source: 'ask_user_question',
      })
      sendJson(res, 200, { ok: true, project })
      return
    }
    const picked = answers.flatMap((answer) => [
      ...(Array.isArray(answer?.selected) ? answer.selected : []),
      ...(typeof answer?.custom === 'string' && answer.custom.trim() !== '' ? [answer.custom] : []),
    ])
    const text = `用户在提问卡上答了「${clip(asked.join('；'), 60)}」：${clip(picked.join('、'), 120) || '（没有勾选）'}`
    appendEvent(project, 'textbook/hint', { text, question: asked, answers, source: 'ask_user_question' })
    sendJson(res, 200, { ok: true, project })
  } catch (error) {
    sendJson(res, 500, { ok: false, error: String(error instanceof Error ? error.message : error) })
  }
}


/** 提问/答案都是模型或用户写的字：截断后再落账，一条事件不许无限长。 */
function clip(value, max) {
  return value.length > max ? `${value.slice(0, max)}…` : value
}


/**
 * 动作族 → handler 的真实注册（Node implementation 只留在这里，票 contract-actions/04）。
 * 一族一实现，族 id 与 module 文件名同源：`./workflow/actions/<族>.js`。
 */
const HANDLER_OF_FAMILY = new Map([
  ['books', actBooks],
  ['wizard', actWizard],
  ['convert', actConvert],
  ['gates', actGates],
  ['gold', actGold],
  ['deep-modify', actDeepModify],
  ['collab-signals', actCollabSignals],
  ['chapters', actChapters],
  ['patterns-ops', actPatternsOps],
])


/**
 * 动作 → 动作族 handler 的分发表：**规范动作名与动作族 metadata 只从契约面动作目录来**
 * （`./contract-actions.js`，ADR-0017 决策 6/9）。本文件不再手写第二份动作清单——
 * 新增动作就是往目录里加一行，它自动落进本表。
 *
 * 目录是零依赖 metadata module、不认识本文件的 handler；本文件也不把 payload、授权、
 * 用户确认、账本或错误语义搬进目录：那些仍归各自动作族实现与 engine。
 *
 * 装配与两边的闭包在 `./workflow/registration.js`（纯函数，好数据坏数据都由测试直接验）。
 */
const ACTION_FAMILY_OF = buildActionFamilyTable(HANDLER_OF_FAMILY)


/**
 * **会落拍板结论**的动作（票 `decision-provenance/01` D3=A）：只有这几个动作需要先落一条
 * 「人工动作事件」，动作族才知道「这一下是不是人点的」。
 *
 * ⚠️ 名单**不在这里第二个地方手抄**：唯一声明面是 `src/contract-actions.js` 里那几行
 * `writesStationDecision: true`（`listStationDecisionActions()`）。理由不只是「少抄一份」——
 * 收口票把本票合进 main 时，原先这里手写的那五个名字当场让
 * `test-contract-action-catalog.mjs` 的「整个 src/ 里没有第二份动作名清单」变红（票 05 的闸）；
 * 而那张手写表与目录一旦分家，表现是「新加一条会落结论件的动作却忘了登记 ⇒ 人点被降级成 machine」
 * ——⛔ 不许靠「记得两处同改」。
 */
const STATION_DECISION_ACTIONS = new Set(listStationDecisionActions())

/** 需要落「人工动作证据」的动作：站结论动作 ＋ `rollback`。
 *  票 `flow-audit-2026-10/06`：回退不是站结论（不写 `决策/NN.json`），但它同样是人的动作，
 *  账上要能记「谁点的」⇒ 给它同一份 `textbook/hint` 证据（`machine:'human-action'`），
 *  ⛔ 不因此伪造一份结论件。 */
const HUMAN_ACTION_EVIDENCE_ACTIONS = new Set([...STATION_DECISION_ACTIONS, 'rollback'])


/** POST /textbook/action 动作分发 —— **HTTP adapter**（读流、限体、写响应）。
 *  判据全在下面那个 `dispatchAction` 里，这里只负责传输那一层。 */
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
  // ⚠️ I2 · 回包 ≠ 落盘：`dispatchAction` 不调 flushMeta，落盘边界就在下面这次 sendJson 里
  // （`test-material-gap-stance.mjs` 直接 import flushMeta 7 处，那条路径不经 HTTP）。
  // ⚠️ `reply === undefined`＝这个族没有这个动作的 case：照旧什么都不写
  // （今天 handler 掉出 switch、socket 挂着；改成回 400 是行为变化）。
  // ── 票 `decision-provenance/01` D3=A：**工作台通道**发来的「会落结论件」的动作，先落一条
  // 人工动作事件，再把它的 eventId／at 交给动作族。⛔ 这条证据只由本 adapter 产（AI 的
  // `agent-tool` 不走这里），所以「谁拍的」第一次在账上分得开。
  // ⚠️ 证据落账失败**不许**拖垮动作本身（结论件仍会落，但如实降级成 machine）。
  let humanEvent = null
  const humanSession = sessionOf(body?.session)
  if (req.headers?.['x-textbook-actor'] === 'human'
    && humanSession !== null
    && typeof body?.action === 'string'
    && HUMAN_ACTION_EVIDENCE_ACTIONS.has(body.action)
    && typeof body?.project === 'string'
    && PROJECT_ID_RE.test(body.project)) {
    try { humanEvent = appendHumanActionEvent(body.project, body.action, humanSession) } catch { humanEvent = null }
  }
  const reply = await dispatchAction(ctx, body, humanEvent)
  // 「实际有什么」那一份：**机器每次动作扫盘写回**登记（票 `context-budget/10`）。
  // ⚠️ 写在动作漏斗这一层而不是读通道：工作台 2 秒轮询一次 `/textbook/process`，
  // 放读通道等于每两秒写一次盘。⚠️ 只在有书且动作真落过盘时才扫；被拒的请求（400/409）
  // 不扫——盘上什么都没变，重扫一遍只是白写。
  if (reply !== undefined && reply.status < 400 && typeof body?.project === 'string' && PROJECT_ID_RE.test(body.project)) {
    try { refreshArtifactRegistry(body.project) } catch { /* 登记是派生件，写不进去不许拖垮动作 */ }
  }
  if (reply !== undefined) {
    sendJson(res, reply.status, reply.json)
  }
}


/**
 * **动作层 interface**：打一个规范动作，拿一个应答。传输不在这个 interface 上——
 * 它不碰 `req`/`res`，只认「一次动作请求」与「一次应答」这一对形状。
 *
 * 与 `handleAction` 的关系：`handleAction` 是它上面的 **HTTP adapter**（读流、限 64MB、
 * 写状态码与 header、触发 `flushMeta` 落盘边界）；本函数是 seam 本身。
 *
 * ⚠️ **本函数不导出，ADR-0003 决策 4 原样保持**：「动作族 handler 不对测试单独导出——
 * 现有 mkReq/mkRes fakes 是唯一的第二 adapter」。票 03 第 4 步曾把它导成测试面
 * （`test-session-title.mjs` 不再造假件），code-review 双轴后**已撤回**（票 03 · 裁决）：
 * 那条路要额外付一个定时器隐患 + 一个与票面不符的入口位置，换来的只有 0.4 秒。
 * ⇒ 测试要调动作层，**仍然自己造 mkReq/mkRes**。
 *
 * ⚠️ **返回 `{status, json}`，不写任何响应**——所以**盘面还没落盘**
 * （落盘边界在 `sendJson` 里，见 I2）。
 *
 * @param {object} ctx 宿主上下文（与 `apply(ctx)` 收的是同一个形状）。
 * @param {{action:string, session?:string, project?:string}} request 解析后的请求体本体。
 * @param {{eventId:string, at:string}|null} [humanEvent] 本 adapter 刚落下的人工动作事件
 *   （票 `decision-provenance/01`；只有工作台通道会带，AI 通道恒为 null）。
 * @returns {Promise<{status:number, json:object}|undefined>}
 */
async function dispatchAction(ctx, request, humanEvent = null) {
  const body = request ?? {}
  const { action, project } = body
  const sessionId = sessionOf(body.session)
  if (sessionId === null) {
    return { status: 400, json: { ok: false, error: '缺少或非法的 session 参数' } }
  }
  if (typeof action !== 'string' || action === '') {
    return { status: 400, json: { ok: false, error: '缺少 action' } }
  }
  const family = ACTION_FAMILY_OF.get(action)
  if (family === undefined) {
    return { status: 400, json: { ok: false, error: `未知动作: ${action}` } }
  }
  try {
    const reply = await runAction(family, { ctx, action, sessionId, project, body, humanEvent })
    // 与 handleAction 同一句：没有这个 case 就照旧什么都不写（这里返回 undefined）。
    return reply
  } catch (error) {
    ctx.logger.warn(`textbook: action ${action} failed: ${String(error)}`)
    return { status: 500, json: { ok: false, error: String(error instanceof Error ? error.message : error) } }
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
    // 票 12 · ①：AI 改写作规范这件事**机器替它记账**。检测点选在这里的理由与代价写在
    // `engine.noteStyleSpecChange` 的注释里（稳态只读不写；终检交工那一次还会补检）。
    // ⚠️ 必须排在 `readEvents` **之前**：这一笔落进账本后，本轮响应要能把它带回去，
    // 否则用户得再等一个轮询周期才看见（实测轮询间隔 2 秒——不差，但顺序摆在这里更符合因果）。
    try { noteStyleSpecChange(project) } catch { /* 记账失败不许拖垮这一轮读取 */ }
    const events = readEvents(project, after)
    // 定稿区展示用的实测值是**响应派生**，不落 project.json：服务端当场读盘上当前范例章，
    // 用 domain-rules 的唯一汉字计数口径算好后随 meta 视图下发，浏览器不另读正文。
    const goldMeasuredChapter = goldN(meta)
    let goldMeasuredHanzi = null
    try {
      // ⚠️ 这里要的是**基名**：`workFile` 自己拼 `工作区/`，给它相对路径会变成 `工作区/工作区/chapter-NN.md`。
      const goldPath = workFile(project, chapterName(goldMeasuredChapter))
      if (existsSync(goldPath)) goldMeasuredHanzi = countHanzi(readFileSync(goldPath, 'utf8'))
    } catch { /* 还没产出正文时留 null，不编数字 */ }
    const metaView = {
      ...meta,
      goldMeasuredChapter,
      goldMeasuredHanzi,
      canEditTargetWords: canEditTargetWords(meta),
      // 站 8／9 由**账本折出**（票 `confirm-points-redesign-build/08`，照关卡 `foldGate` 那一档
      // 先例）：⛔ **不加新的 `awaiting-*` 值**——`awaiting-gold` 照旧一个值覆盖两站，
      // 「这一稿行不行拍过没有／体量拍过没有」只由 `工作区/决策/08.json`／`09.json` 在不在 ＋
      // 它的 `approved` 说话（唯一写点＝`decision-record.recordStationDecision`）。
      // ⚠️ 形状**落在 `metaView` 里**（不是 payload 顶层）是**有意的**：payload 顶层多一个键会
      // 改动 `workbench-projection` 的 core 形状，而画廊形状闸逐份夹具比那一份键集——
      // 加顶层键＝几十份夹具一次性漂（而夹具只许在主树上由人重录）。`metaView` 里
      // `canEditTargetWords` 正是同一条路的既有先例（同样是派生事实）。
      stationDecisions: stationDecisionsOf(project),
    }
    // 章节状态：每章写好/自查好的徽章（UI 与 AI 都用）。
    // 票 14（界面数字同源）：`done` 直接问**闸门那一份判据**（engine 的 chapterDone：两份产物在
    // ＋ 机器记下的交工通过 ＋ 没有未处置的抽查意见）——界面的「已完成 X/Y 章」与过目闸门从此同源，
    // 两个数字不打架。**不许在这里写第二份判据**（写第二份就是本程要消灭的「两个数字打架」）。
    const chapters = meta.outline?.chapters ?? []
    const chapterStatus = chapters.map((chapter, index) => {
      const n = index + 1
      const { chapterPath, auditPath } = chapterArtifacts(project, n)
      const written = existsSync(chapterPath)
      // 票 `word-budget-ineffective/02`：章节面板要显示「兜底/实际」。
      // 读数由 `engine.chapterWordReading` 单点给出（与交工闸门、交付清单同一份实现）：
      // 兜底没填过 ⇒ `null`（不凭空造 6000），正文不在 ⇒ `actualHanzi: null`（不写 0）。
      // 超了不判、不涂红——预算的语义是「至少要有这么多」，不是上限。
      const wordReading = chapterWordReading(project, n, meta)
      return {
        n, title: chapter.title ?? `第${n}章`,
        source: chapter.source ?? '', targetWords: chapter.targetWords ?? null,
        wordsFloor: wordReading.wordsFloor, actualHanzi: wordReading.actualHanzi,
        // written/audited 保留为「产物在不在」的原义（界面用它区分「执笔中 / 写好了审计中 / AI 复核中」）；
        // done 才是闸门口径的「这一章算完成了」（客户端改用 done 后，两个数字必然一致）。
        written, audited: existsSync(auditPath),
        done: chapterDone(project, n),
      }
    })
    // 探查摘要（探查确认卡用）：材料份数/知识点数/建议章数。
    let exploreSummary = null
    // 知识地图原文：机器产物，但人读形态是**卡片内联**折叠清单（ADR-0010 决策 2 / 票 05），
    // 故随事件一起下发，不再让前端走 /textbook/file——那条路由按「给人读的产物」收窄后
    // 拒绝机器产物（票 04）。文件不在/读不到时为 null（前端回退成一句可读说明）。
    //
    // ⚠️ 票 `graph-read-one-answer/04`：原文与那三格读数出自**同一次**读，读侧只问
    // `readMergedMap`（票 01 的窄出口）——⛔ 这里不再自己 `readFileSync ＋ JSON.parse`
    // （这一处是候选卡片 `files` 清单漏掉的第六份手搓读盘）。口径随窄出口：
    // **严格 JSON 对象，否则算没有**。
    // ⚠️ **行为修正**（不是重构）：盘上是 `[]`／`42` 时窄出口答 `map === null` ⇒
    // `exploreSummary` 也是 `null`，界面走「读不到」那一支；今天 `JSON.parse` 会成功、
    // `Array.isArray(km.knowledgePoints)` 是 false ⇒ 界面看到一张「0 个知识点」的假图。
    let knowledgeMap = null
    // 原文那一格**逐字**照抄盘上（⛔ 不顺手 `JSON.stringify` 重排一遍）；件不在 ⇒ `null`。
    const mergedMap = readMergedMap(project)
    knowledgeMap = mergedMap.text
    if (mergedMap.map !== null) {
      const km = mergedMap.map
      const converted = (meta.sources ?? []).filter((source) => convertedState(source) === 'ok').length
      exploreSummary = {
        sources: converted,
        knowledgePoints: Array.isArray(km.knowledgePoints) ? km.knowledgePoints.length : 0,
        chapterSuggestion: Array.isArray(km.chapterSuggestion) ? km.chapterSuggestion.length : 0,
        teachingFocus: Array.isArray(km.teachingFocus) ? km.teachingFocus.slice(0, 5) : [],
      }
    }
    // 章节安排原文（`工作区/outline.md`）：**内容是机器 JSON**，判 `'inline'` 不开右栏
    // （票 pipeline-wiring-gaps/09），人读形态是阶段页第 3 阶段那张就地折叠清单
    // （`machine-product-folds.foldOutline`）。同知识地图：随事件一起下发，文件读不到时为 null。
    let outlineText = null
    try {
      outlineText = readFileSync(workFile(project, 'outline.md'), 'utf8')
    } catch { outlineText = null }
    // 那份**人的裁决产物**（`工作区/knowledge-map-exclusions.json`，票 `knowledge-graph-build/09`）的原文：
    // 「图上划掉的那些卡」的唯一归属处。⚠️ 它不经 `/textbook/file`——那条路由只放行
    // `productOpenMode === 'preview'` 的产物，而这份件**不在任何产物族里**（它是一件人的裁决记录，
    // 见 `domain-rules.SWEEP_EXCLUDED` 那一条）⇒ 与 knowledgeMap／outline 同一条路：随 payload 下发，
    // 界面（两张确认卡）据此把「留下的集合」算出来。文件不在／读不到时为 null（＝这本书上还没有裁决）。
    let knowledgeMapExclusions = null
    try {
      knowledgeMapExclusions = readFileSync(workFile(project, KNOWLEDGE_MAP_EXCLUSIONS_FILE_NAME), 'utf8')
    } catch { knowledgeMapExclusions = null }
    // 票 `reader-cognition-boundary-build/09`：书夹里那份**回卷原件**（`工作区/读者情况回卷.md`）的原文，
    // 与上面那一份同一条路下发（不经 `/textbook/file`——那条路由只放行 `productOpenMode === 'preview'`，
    // 而这份件按人的输入原样躺着，判 `machine`）。它是站 2 那一栏「缺口」的**唯一新输入**：
    // 缺口读数从它 ＋ 合并件的 `readerSlices` ＋ 剔除记录**现算**（⛔ 不落第二份、⛔ 不落 `meta` 键）。
    // 文件不在／读不到时为 `null` ＝「这本书还没有回卷」——那时那一栏整块不渲染（没有可报的缺口）。
    let readerQuestionnaireReturn = null
    try {
      readerQuestionnaireReturn = readFileSync(workFile(project, READER_QUESTIONNAIRE_RETURNED_FILE_NAME), 'utf8')
    } catch { readerQuestionnaireReturn = null }
    // 当前范例章的**检查记录原文**（`工作区/audit-NN.md`）：同样是「机器产物但有人读」——
    // 内容是**严格 JSON**，`productOpenMode` 判 `'machine'`（ADR-0010 决策 2），所以
    // `/textbook/file` 对它是**明确 403**（那条路由只放行 `'preview'`）。
    // ⚠️ **病**（票 `gold-finalize-blocked/01`，2026-02-11 真机《抑郁患者自救》）：谈判桌那张卡
    // 就是拿 `/textbook/file` 去读它的，于是**每一次请求都必然 403** ⇒ 卡永远停在「展示期」、
    // 「定稿」「重写」两颗键永远灰、**刷新无效**（那不是缓存问题，是每次都失败），
    // 书卡在第三阶段出不去。从别的入口（AI 工具 `gold-approve`）定稿却能成——两侧口径不一致。
    // ⇒ 与上面两份走**同一条既有路**：随 payload 下发，前端不再经那条路由读它
    // （人读形态由谈判桌的检查徽章 ＋ 那句 fact line 承担）。
    // 读不到（还没落盘／读失败）时为 `null`——正好落进前端三态里的「没有／读不到」那一格。
    // ⚠️ 文件名形状与 `:901`／`:928` 那两处逐字同款（`audit` 族同一个补两位序号契约）。
    let goldAudit = null
    try {
      goldAudit = readFileSync(workFile(project, auditName(goldMeasuredChapter)), 'utf8')
    } catch { goldAudit = null }
    // 金标准稿版本（谈判桌页签数据）：_旧版产物 里按时间戳升序的旧稿；当前稿号 = 旧稿数 + 1。
    // ⚠️ 票 `confirm-points-redesign-build/08`：这一段（连同下面那个正则的两条陷阱）收进
    // `engine.goldDraftVersionOf`——站 8 的结论件要写同一个「第几稿」，⛔ 不许有第二份实现。
    const goldDrafts = goldDraftsOf(project, meta)
    const goldDraftVersion = goldDraftVersionOf(project, meta)
    sendJson(res, 200, {
      ok: true, project, after, events, meta: metaView,
      dir: projectDir(project),
      gate: foldGate(project),
      snapshots: listSnapshots(project),
      work: existsSync(workFile(project, 'book.md')) ? '工作区/book.md' : null,
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
      knowledgeMapExclusions,
      readerQuestionnaireReturn,
      outline: outlineText,
      goldAudit,
    })
  } catch (error) {
    sendJson(res, 500, { ok: false, error: String(error instanceof Error ? error.message : error) })
  }
}


/**
 * 站 8／9 的**账本折出**（票 `confirm-points-redesign-build/08`）：`工作区/决策/NN.json`
 * 在不在 ＋ 它的 `approved` —— 界面据此判断「这一稿行不行拍过没有」（站 8）与「体量拍过没有」
 * （站 9）。⛔ 没有那份件就**不长这个键**（不是填 `null`：`in` 一测就知道「没拍过」）。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：只折**这两站**（站 8／9 是这张票的射程）；
 * 站 2／3 的结论件今天还没有生产写点，等它们落地时这张表要跟着扩——
 * 界面上「没这个键」一律读成「没拍过板」，所以漏一站的表现是**那一站永远不会被认为拍过**，
 * 不会误判成拍过（宁可拦着，也不放行）。
 */
function stationDecisionsOf(projectId) {
  const out = {}
  for (const station of [8, 9]) {
    // 票 `decision-provenance/01` D2=A：展示口径**先 apply 纠偏**（原文件字节不动）。
    const record = readEffectiveStationDecision(projectId, station)
    if (record === null) continue
    out[station] = {
      approved: decisionApproved(record),
      version: Number.isFinite(record.version) ? Number(record.version) : 1,
      decidedAt: typeof record.decidedAt === 'string' ? record.decidedAt : '',
      // 票 `decision-provenance/01` D1=A：界面逐站显示「谁拍的」（人／机／纠偏）。
      decidedBy: record.decidedBy === 'human' ? 'human' : 'machine',
      autoSkipped: record.autoSkipped === true,
      skipReason: typeof record.skipReason === 'string' ? record.skipReason : '',
      provenanceCorrected: record.provenanceCorrected === true,
      provenanceText: stationProvenanceText(record),
    }
  }
  return out
}

/**
 * 一条结论件的**人读出处**（票 `decision-provenance/01`）：界面只拿这一个字符串，⛔ 不自己
 * 从 `decidedBy`／`autoSkipped` 再拼第二套说法（那会让「纠偏」的展示口径与服务端分家）。
 *
 * ⚠️ 只服务站 8／9（`stationDecisionsOf` 今天折的这两站）；站 2／3／4 没有回放面板，
 * 它们的出处仍只在 `工作区/决策/NN.json` 与纠偏文件里可查。
 */
function stationProvenanceText(record) {
  if (record?.provenanceCorrected === true) {
    const reason = record.provenanceFix?.reason
    // 纠偏的目标值可能是 human 也可能是 machine（`corrected` 是显式给的），⛔ 不把两种都写成
    // 「机器自动跳过」——那句只在 corrected==='machine' 时成立。
    const corrected = record.decidedBy === 'human' ? '人拍' : '机器自动跳过'
    return `本站被纠偏：${corrected}${typeof reason === 'string' && reason !== '' ? `（${reason}）` : ''}`
  }
  if (record?.decidedBy === 'human') {
    return typeof record.eventId === 'string' && record.eventId !== ''
      ? `本站由人拍板（事件 ${record.eventId}）`
      : '本站由人拍板'
  }
  if (record?.autoSkipped === true) {
    return typeof record.skipReason === 'string' && record.skipReason !== ''
      ? `本站由机器自动跳过（${record.skipReason}）`
      : '本站由机器自动跳过'
  }
  return '本站由机器记录'
}

/**
 * 盘上产物事实：与 artifacts 并行下发，stat 失败只省掉这一份事实。
 * kind 统一复用 domain-rules.artifactKind 的共享领域规则映射。
 */
function buildArtifactFacts(projectId, artifacts) {
  const root = projectDir(projectId)
  const facts = []
  const chapters = new Map()
  const audits = new Map()
  for (const rel of artifacts) {
    if (typeof rel !== 'string' || rel === '') continue
    try {
      const stat = statSync(join(root, rel))
      if (!stat.isFile()) continue
      const path = rel.replace(/\\/g, '/')
      const chapter = /^工作区\/chapter-(\d{2})\.md$/.exec(path)
      const audit = /^工作区\/audit-(\d{2})\.md$/.exec(path)
      const fact = {
        path: rel,
        kind: artifactKind(path),
        modifiedAt: stat.mtimeMs,
      }
      facts.push(fact)
      if (chapter !== null) chapters.set(chapter[1], fact)
      if (audit !== null) audits.set(audit[1], fact)
    } catch { /* 读不到 stat 就省略这份事实，不让过程图谱整体失败 */ }
  }
  // 新鲜度是服务端事实；浏览器不再拿自己的时间或另一份数据重算。
  for (const [n, chapter] of chapters) {
    const audit = audits.get(n)
    if (audit === undefined) continue
    chapter.freshness = 'current'
    audit.freshness = audit.modifiedAt < chapter.modifiedAt ? 'stale' : 'current'
  }
  return facts
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
  // 产物存在性按「项目目录相对路径」判（artifacts 输出即相对路径；workFile 会再拼 工作区/，不能复用）。
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
    artifacts: ['工作区/explore.md', '工作区/knowledge-map.json'].filter(existsRel),
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
      artifacts: proposalFilesOnDisk(projectId, gate).filter(existsRel),
      // 票 workbench-transitions/23：`version` 取**已决的那条提案**的版次（`decidedVersion`），
      // 不取 `mine.version`（那是最新提案的版次，awaiting 时也照样是新提案）；另把 `status` 带出来，
      // 让界面分得清「还没拍板」与「拍过了但没通过」——两者今天都落在 `approved:false` 上。
      // 票 workbench-transitions/25：`proposalVersion` 补上**最新提案**那一版——用户此刻正要拍的是它，
      // 与「已定下来的那一版」分家（v1 驳回、v2 在等时 `version` 是 1、它才是 2）。
      // ⚠️ 这两个字段名与 `foldGate` 返回值里**同名的那两个意思相反**（那边 `version` 是最新提案、
      // `decidedVersion` 是已定下来的那版），别看着"顺手"对调。
      decision: mine === null ? undefined : {
        status: mine.status,
        version: mine.decidedVersion ?? mine.version,
        proposalVersion: mine.version,
        approved: mine.status === 'approved',
        note: mine.decision?.note ?? '',
      },
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
    artifacts: existsRel('工作区/outline.md') ? ['工作区/outline.md'] : [],
    redoNote: meta.outlineRedoNote ?? null,
  })
  const goldDone = meta.goldSealed != null || phase >= 5
  const goldNn = goldN(meta)
  push({
    key: 'gold', label: '最佳范例章（风格母版）', kind: 'gold',
    phase: SEGMENT_PHASE['gold'],
    status: goldDone ? 'done' : (meta.status === 'awaiting-gold' ? 'waiting-user' : (phase >= 4 ? 'active' : 'pending')),
    // ⚠️ 产物清单里的路径是**书夹相对路径**（`existsRel` 自己 join 书夹根），所以取 `chapterRel`
    // 而不是 `chapterName`——后者是基名，喂进去 `existsRel` 会去书夹根找 `chapter-NN.md`。
    // `工作区/audit-NN.md` 是 `audit` 族的同款契约（同一个补两位序号）⇒ 取 `auditRel`，
    // 与上面 `chapterRel` 是同一条纪律（票 `context-budget/18` 复核 findings ⑥ 收掉这里的手拼）。
    artifacts: ['工作区/style-spec.md', chapterRel(goldNn), auditRel(goldNn)].filter(existsRel),
    decision: meta.goldSealed == null ? undefined : { version: meta.goldSealed.version, approved: true, note: '已定稿为最佳范例章' },
    redoNote: meta.goldRedoNote ?? null,
  })
  // 一章一章写：phase>=5 不等于每一章都在写。**「我正在做」只认机器真知道的那一条**——
  // 主笔 AI 上报了这一章的流水线阶段（`meta.chapterPipeline[n-1].stage`）。
  // ⚠️ 票 24 / P17（2026-09-27）：原来这里还兜底「index === firstUndone」（第一个还没交工的章），
  // 于是那个 `▶` 的真实含义是「第一个还没交工的章」而不是「正在干的活」——从第 1 章正文写完那一刻起
  // 就钉在「第 1 章 · 写」上，直到第 1 章交工为止（交工还要等它的独立检查过，不过就一直钉着）。
  // 同一时刻章节卡说的是另一回事（第 5 章「我正在做 · 检查」），同屏两处对「这一章到哪了」打架。
  // ⇒ AI 没上报（`stageN === null`）就是**机器不知道**，不许拿「第一个还没交工的章」冒充知道。
  // 🚫 不许换成「第一张有产物的章」之类的新猜法：那只是换一个猜法，仍不是「AI 在干这一章」的事实。
  // 这一档落回 pending 之后，界面那句「还没到这一步」混着的两件事由 stage-step-model 拆开说
  // （产物已在盘上、这一章还没走完 → 「还没完成」；真没开始 → 仍说「还没到这一步」）。
  chapters.forEach((chapter, index) => {
    const n = index + 1
    const stageN = pipelineStage(meta, index)
    push({
      key: `chapter-${n}`, label: `第${n}章 ${chapter.title ?? ''}`, kind: 'chapter',
      phase: SEGMENT_PHASE['chapter'],
      status: chapterDone(projectId, n)
        ? 'done'
        : (phase >= 5 && stageN !== null ? 'active' : 'pending'),
      // F35（2026-08-20 走查）：每章流水线阶段（writing/auditing/audited/finalizing/done，未上报为 null）。
      stage: stageN,
      // 票 nav-vs-preview/01：只随过程图谱给人读摘要；原始机器 JSON 仍不开右栏。
      auditSummary: readChapterAuditSummary(projectId, n),
      artifacts: [chapterRel(n), auditRel(n)].filter(existsRel),
    })
  })
  push({
    key: 'chapters-review', label: '全章过目', kind: 'review',
    phase: SEGMENT_PHASE['review'],
    status: meta?.status === 'awaiting-chapters-review' ? 'waiting-user' : (meta?.chaptersReviewed === true || existsRel('工作区/book.md') ? 'done' : 'pending'),
    artifacts: [],
  })
  push({
    key: 'merge', label: '合并成书', kind: 'merge',
    phase: SEGMENT_PHASE['merge'],
    status: existsRel('工作区/book.md') ? 'done' : (phase >= 6 ? 'active' : 'pending'),
    artifacts: existsRel('工作区/book.md') ? ['工作区/book.md'] : [],
  })
  push({
    key: 'final', label: '最后检查与交付', kind: 'final',
    phase: SEGMENT_PHASE['final'],
    // 批 1 根因修复：原式只认 delivered → done，其余 phase>=6 → active，
    // 于是终检等认可时纵向地图显示「▶ 正在做」，而横向阶段片显示「⚡轮到你」——同屏打架。
    status: meta?.status === 'delivered' ? 'done' : (meta?.status === 'awaiting-final-approval' ? 'waiting-user' : (phase >= 6 ? 'active' : 'pending')),
    artifacts: existsRel('工作区/book.md') ? ['工作区/book.md'] : [],
  })
  // 影响预告数据：每段的深改影响范围（下游段 keys / 会被归档的现存产物 / 是否可深改）。
  // ⚠️ 票 `demo-channel-full/17`（维护者 2026-10-15 拍板「入口可见 ＋ 点了给明确告知」）：
  // 这一行**原先还带着** `&& meta?.demo !== true`——演示书上「定点修改」整颗键不出，用户在演示通道里
  // 看不见本方法最重的那件他能动的事。现在**入口这一半不再分叉**：演示书与真书同一处（同一张卡、
  // 同一个 `modify` 目标）渲染那颗键。
  // ⛔ 别把这一格读成「演示书也能深改」：`canDeepModify` 说的是「这一步在这本书上**够得着**」，
  // 真去重做下游仍然只有动作层说了算——演示书那一条 409 一个字没放宽（`actions/deep-modify.js`，
  // 文案已改成人话）。要分辨「这书是不是演示书」看 `meta.demo`，⛔ 不看这一格。
  for (const seg of segments) {
    seg.artifactFacts = buildArtifactFacts(projectId, seg.artifacts)
    const affected = deepAffected(projectId, meta, seg.key)
    seg.downstream = affected === null ? [] : affected.downstream
    seg.redoFiles = affected === null ? [] : affected.files.filter((rel) => existsSync(join(projectDir(projectId), rel)))
    seg.canDeepModify = affected !== null
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
    // 票 12 · ①：与 `handleEvents` 同一个检测点，理由见 `engine.noteStyleSpecChange` 的注释。
    // 工作台这两条路都是 2 秒一轮，且**同时**在跑；去重（`styleSpecSeen`）保证同一次变更只记一条。
    try { noteStyleSpecChange(project) } catch { /* 记账失败不许拖垮这一轮读取 */ }
    // 书夹形状那两份表的对账事实（票 `context-budget/10`）：缺件/多件**各自点名**。
    // ⚠️ 老书没有清单 ⇒ `shape: null`，**不拦也不显示**（用户故事 12：老书照常打开、能交付）。
    let shape = null
    try { shape = bookShapeReport(project) } catch { /* 派生件读不出就当没有，不拖垮这一轮读取 */ }
    // ⚠️ **老名／新名两套同时存在的段逐条点名**（老书读侧兜底）：解析层按「新名优先」取其一，
    // 于是老的那一份会被**遮住**——不报出来，用户看到的是「我明明有产物，怎么少了一半」，
    // 而兼容层把「少东西」藏起来比不兼容更坏。空数组是常态（不是新书一律老书），恒定在场。
    let legacyDirs = []
    try { legacyDirs = legacyDirConflicts(project) } catch { /* 派生事实读不出就当没有 */ }
    sendJson(res, 200, {
      ok: true,
      project,
      segments: buildProcessMap(project),
      // 票 `flow-audit-2026-10/06`：回退必须在 `/textbook/process` 这一屏也读得到——不只是账本与
      // 《过程记录.md》。这一段是**只读投影**（`{...data, seq, at}`），界面今天不消费它，但
      // 「曾写到第五章又退回去」这件事在这一屏有了机器可读的位置。
      rollbacks: readEvents(project)
        .filter((event) => event?.type === 'textbook/rollback')
        .map((event) => ({ ...(event.data ?? {}), seq: event.seq, at: event.time })),
      shape,
      legacyDirs,
    })
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


/**
 * GET /textbook/settings —— 全局设置快照（客户端用它渲染 Token 卡与**上传前那道预检**）。
 *
 * 票 `token-banner/01`（D③=A）：`mineruTokenSet` **不再只读 settings 文件**——它问
 * `mineruTokenStatus()`，与 `resolveMineruToken` 同一条读序（settings → env → credentials）。
 * 同时下发 `mineruTokenSource`（`settings` / `env` / `credentials`）与 `mineruTokenMasked`
 * （脱敏值，⛔ 不明文），界面据此说「来源：设置 / 环境变量」。
 *
 * 票 10：`autoSplitAvailable` 是**本机的事实**（有没有 Python + PyMuPDF），由 `mineru-lib` 的
 * 探针真探一次给出；**探针是惰性缓存的**，所以第一次要付一次子进程的开销（最坏 15 秒超时），
 * 之后这次调用都是瞬时的。⚠️ 它**故意不进**书投影的四条通道：那是「当前书的事实」，
 * 装没装 PyMuPDF 是**这台机器**的事实，两者混在一起会让切会话时多发无谓请求。
 */
async function handleSettings(_req, res) {
  try {
    const token = mineruTokenStatus()
    sendJson(res, 200, {
      ok: true,
      settings: {
        mineruTokenSet: token.configured,
        mineruTokenSource: token.source,
        mineruTokenMasked: token.masked,
        autoSplitAvailable: await autoSplitAvailable(),
      },
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
  processRedoMarks(ctx)
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
          // ⚠️ 票 walkthrough-fixes/01（走查 P41）：原来这里**不接返回值**，于是唤醒静默失败
          // 也是一个「三层都在报成功」的结局（交办照记 → 用户看到「新一章开工了」→ AI 其实一动没动，
          // 10:07–10:12 对话页无「停止生成」按钮、账本零变化，10:13 用户手打一句「继续」才活过来）。
          // 现在接住它：`false` 时往账本里落一条 hint，用户 10 分钟内就知道要自己说一句话。
          const woke = handoff(ctx, id, meta.pendingStage, meta.pendingGate ?? null)
          if (woke === false) {
            appendEvent(id, 'textbook/hint', {
              text: '⚠️ 重启后没能把 AI 叫醒，请发一句话让它继续',
            })
          }
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


/**
 * 重做标记：书夹里存在 .redo 时，重启后先重置（清产物 → 回源探查）再续跑。
 *
 * ⚠️ 票 `depth-review-2026-10/04`：这一步原先也是「尽力归档 ＋ 静默 catch」——**第 5 条静默点**
 * （票面完全没列，由维护者 2026-10-06 签字纳入射程）。旧产物搬不走时，下面照样把 `phase` 打回 2、
 * 清掉 `outline`、并把 `.redo` 标记移走：用户看到的是一本被「重置」过的书，而 `工作区/explore.md`
 * 原封不动躺在原位 ⇒ 下一轮 `runPhase2` 见到产物还在直接短路 ⇒ **「重启一次就悄悄放过」**。
 * 现在它走与另外五条路径**同一个**判据（`archiveWorkArtifacts`）：任一件没搬走就**整本跳过**
 * ——状态一个字不改、`.redo` 标记也留着（下次启动再试一次），并在宿主日志里点名是哪几件。
 * 这一条没有 HTTP 回包可回 409，「响」＝不推进 ＋ 标记滞留 ＋ 日志点名（用户可见的是书没被悄悄重置）。
 */
function processRedoMarks(ctx) {
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
        // 名单是**现场枚举**出来的（与另外五条路径写死名单不同：这一步要清的正是「盘上这一堆」），
        // 归档与保留策略都交给 engine 那一份原语——本文件不再内联任何 renameSync。
        const names = readdirSync(workDirPath).filter((name) =>
          name === 'explore.md' || /^chapter-\d+\.md$/.test(name) || /^audit-\d+\.md$/.test(name)
          || name === 'book.md' || name === 'style-spec.md' || name === 'outline.md')
        const archived = archiveWorkArtifacts(id, names)
        if (archived.misses.length > 0) {
          ctx.logger.warn(`[textbook-workflow] 重置重做没有生效（${id}）：${archived.misses.join('、')} 没能归档、还留在原位；状态与 .redo 标记都保持原样，下次启动再试一次`)
          continue
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


/**
 * 注册工作台后端。`config` 是**可选**第二实参（既有调用约定：宿主契约闸门与探针都按两实参调插件，
 * 见 `dev/host-contract-gate/probe/standing-mount-probe.js` 的 `async apply(ctx, config)`）。
 *
 * 今天它只收一个旋钮 `startupRecoveryDelayMs`（最后那个定时器的延迟，**默认仍是 3000**）：
 * 启动恢复链本身仍是一等公民、时机仍只由 apply 定（ADR-0003 决策 2），本参数只是把那个**值**
 * 变成可注入——链上那 10 次支付（9 份文件 ＋ 一个被两个导入者各 import 一遍的链外夹具）改传 `0`
 * 之后，不再各白等 3.5 秒。生产调用点一个字都不改（不传第二实参 ⇒ 3000）。
 *
 * ⚠️ 参数名只能是 `config`／`opts`：宿主契约闸门的「动态读取」只扫 `props`／`ctx` 对象面，
 * 叫 `props` 会当场踩闸（票 `test-chain-latency/03` 的决定台账第 2 条）。
 */
export function apply(ctx, config = {}) {
  bindAnnounce(ctx)

  // 票 walkthrough-fixes/28：主 AI 上下文占用的读数口（同 `bindAnnounce` 的显式契约：只在 apply 绑一次）。
  // 数据源：宿主 `ctx.sessionProjections` 的 `contextPressure` 会话投影——与宿主输入区角标
  // 「上下文已用 51%」同一份数据；折算口径是 `domain-rules.contextOccupancyPercent`（双端共用的那一份）。
  // 快照与来源路径：`docs/reference/dsh-context-occupancy-contracts.md`。
  // ⚠️ 会话不在存里 / 投影未注册 / 投影值不完整 → null（读不到），
  // 领任务说明那一句就整句不出现。
  bindContextOccupancy((sessionId) => {
    const session = ctx.sessions.get(sessionId)
    if (session === undefined || session === null) return null
    // ⚠️ 一定读 `snapshot()`（wire 视图），**不读 `stateOf()`**：后者给的是投影
    // 单位的**内部折叠态**（`surfaceTokens` / `sampledSurfaceTokens`），而 `projectedTokens` 是在 `wire.view`
    // 里现算的。读内部态会静默回退到 `pressureTokens`，给出一个与宿主输入区角标
    // **不同口径**的数字（角标走 `projectedTokens`）——那正是本仓在治的病：同一件事两套数。
    const cut = ctx.sessionProjections.snapshot(session, ['contextPressure'])
    return contextOccupancyPercent(cut.values.contextPressure)
  })
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/projects', handler: handleProjects }), 'textbook: projects route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/events', handler: handleEvents }), 'textbook: events route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/process', handler: (req, res) => handleProcess(ctx, req, res) }), 'textbook: process route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/action', handler: (req, res) => handleAction(ctx, req, res) }), 'textbook: action route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/upload', handler: (req, res) => handleUpload(ctx, req, res) }), 'textbook: upload route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/work', handler: handleWork }), 'textbook: work route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/file', handler: handleFile }), 'textbook: file route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/download', handler: handleDownload }), 'textbook: download route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/settings', handler: handleSettings }), 'textbook: settings route')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/textbook/question', handler: handleQuestion }), 'textbook: question route')
  ctx.logger.info('[textbook-workflow] 造书工作台后端已加载（步骤5：六阶段状态机）')
  // 宿主重启后延迟走启动恢复链（三步顺序见 startupRecovery；这里只定时机）。
  // 延迟值是**可注入的**（`config.startupRecoveryDelayMs`，默认 3000ms＝生产行为逐字不变）：
  // 测试传 `0` 把这次「游离的恢复」在场景开跑前烧完，不用再各等 3.5 秒。
  // ⚠️ `??` 而不是 `||`：传 `0` 是**有意义的一格**（立刻走），不能被当成缺省。
  const startupRecoveryDelayMs = config.startupRecoveryDelayMs ?? 3000
  setTimeout(() => {
    startupRecovery(ctx)
  }, startupRecoveryDelayMs)
}
