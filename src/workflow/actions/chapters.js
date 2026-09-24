/**
 * 动作族模块（架构评审候选 3，2026-09-01 拆分）：actChapters
 * 从 src/workflow.js 平移，接口 (ctx, req, res, action, sessionId, project, body) 不变。
 * 共享工具来自 ../engine.js。
 */
import {
  assertSessionOwned,
  goldN,
  stageLabel,
  projectDir,
  readMeta,
  updateMeta,
  waived,
  appendEvent,
  workFile,
  writeWork,
  updateStyleLineMirror,
  sealGoldStandard,
  handoff,
  chapterArtifacts,
  chapterDone,
  proposeGate,
  proposeRevision,
  advance,
  countProposals,
  scanScaffolding,
  stripLoaderRegion,
  specFingerprint,
  styleSpecDeclaresNoExercises,
  runQualityChecks,
  EXPLORE_DONE_HINT,
  FINAL_CHECK_DONE_HINT,
  kick,
  sendJson,
  buildStageBrief,
} from '../engine.js'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { normalizeTeachingFocus } from '../../domain-rules.js'


/** 范例章审计文件名（NN 两位补零；机器身份词，勿改）。 */
function goldAuditName(n) {
  return `audit-${String(n).padStart(2, '0')}.md`
}


/** 范例章审计「必读文档矩阵」固定的 5 个必读文件（书夹相对路径）。这份清单的**唯一出处**是
 *  `resources/references/subagent-prompts/gold-audit-prompt.md`（那儿另注明 `work/style-line.md` 不进矩阵）；
 *  这里只是它的机器判据，本票不许在别处再抄一份契约。 */
function goldAuditFiles(n) {
  return [
    'work/explore.md',
    'work/knowledge-map.json',
    'work/outline.md',
    'work/style-spec.md',
    `work/chapter-${String(n).padStart(2, '0')}.md`,
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
  return `范例章审计不合格（${detail}）。① ${got}。② 契约要求 work/${goldAuditName(n)} 是严格 JSON：matrix 对 5 个必读文件各正好一行——${goldAuditFiles(n).join('、')}；每行形状 {file, quote}，quote 必须从对应文件里逐字复制一行原文。`
}


/** 范例章审计结论的机器判据——**写入侧与读取侧唯一的一份判据与报错**（票 01 (b)）。
 *  返回 `{ passed, rows, error }`：`error !== null` ＝ 拒收，两处都用它当那一条 400 文案。
 *  `passed !== true` 与普通章那支同口径：`audit-skip` 豁免可跳过；`gold-skip` 跳过的是「等用户拍板」
 *  那一步，不是验货豁免（三方一致的口径写在 `CONTEXT.md`「验货」）。 */
function checkGoldAudit(project, n, raw) {
  let audit = null
  try {
    audit = JSON.parse(raw)
  } catch (error) {
    return {
      passed: false,
      rows: 0,
      error: goldAuditError(n, `work/${goldAuditName(n)} 不是合法 JSON（${String(error instanceof Error ? error.message : error)}）`, null),
    }
  }
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
    if (typeof row.quote !== 'string' || row.quote.trim() === '' || !text.includes(row.quote)) {
      return { passed: false, rows: matrix.length, error: goldAuditError(n, `「${rel}」那一行的 quote 对不上（quote 必须从该文件里逐字复制一行原文）`, matrix) }
    }
  }
  if (audit.passed !== true && !waived(project, 'audit-skip')) {
    return { passed: false, rows: matrix.length, error: goldAuditError(n, 'passed 不是 true（该章审计还有没解决的问题：先按审计意见修订、重新审计）', matrix) }
  }
  return { passed: audit.passed === true, rows: matrix.length, error: null }
}


/** 动作族 · 章节执行与审阅：'audit-submit' / 'review' / 'stage-submit' / 'stage-brief' / 'progress'。 */
export async function actChapters(ctx, _req, res, action, sessionId, project, body) {
  /** 拒收入账（票 01 (d)）：交工／提审被拒时一律落一条账本事件（含 stage 与原因）——
   *  账本与工作台读得到「交工被拒：<原因>」，不再只活在对话轨迹里。 */
  const rejectSubmit = (stage, reason) => {
    appendEvent(project, 'textbook/submit-rejected', { stage, reason })
    sendJson(res, 400, { ok: false, error: reason })
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
        sendJson(res, 400, { ok: false, error: '章节号不合法' })
        return
      }
      if (comment === '') {
        sendJson(res, 400, { ok: false, error: '请写下你的意见' })
        return
      }
      if (rvMeta.phase !== 5) {
        sendJson(res, 409, { ok: false, error: '现在不在写完整本的阶段，没法直接在章节卡写意见；可以在对话里告诉 AI，它会帮你安排' })
        return
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
        handoff(ctx, project, 'chapters')
      } else {
        const pending = pendingAfter
        if (pending === null || pending === undefined || pending === 'chapters') {
          // 机器空闲或正在铺章：唤醒/让主 AI 接着处理意见（交工前必查意见）。
          if (pending === null || pending === undefined) handoff(ctx, project, 'chapters')
        }
      }
      // 若正在合并/终检：不打断；主 AI 交工前会查 workbench_status 里的抽查意见并先处理。
      sendJson(res, 200, { ok: true, project, chapter: n, queued: true })
      return
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
        sendJson(res, 404, { ok: false, error: '没有这条抽查意见' })
        return
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
        sendJson(res, 404, { ok: false, error: '没有这条抽查意见' })
        return
      }
      sendJson(res, 200, { ok: true, project, reviewId: revoked.id, chapter: revoked.chapter, review: revoked })
      return
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
        rejectSubmit('gold', `没拿到范例章审计结论：work/${asName} 不在或为空，也没带 auditJson 正文——先让审计小助手把结论落盘（或把 JSON 正文带来）再提交`)
        return
      }
      const asVerdict = checkGoldAudit(project, asN, asRaw)
      if (asVerdict.error !== null) {
        rejectSubmit('gold', asVerdict.error)
        return
      }
      // 带了正文就由机器落盘：验过的就是落盘的那一份（写入侧的唯一写入者），中间不再经手。
      if (inline) writeWork(project, asName, asRaw)
      sendJson(res, 200, { ok: true, project, chapter: asN, rows: asVerdict.rows, passed: asVerdict.passed })
      return
    }
    case 'stage-submit': {
      // 主 AI 交工：逐阶段验货，验过才放行（AI 说做了不算，机器验过才算）。
      assertSessionOwned(project, sessionId)
      const subMeta = readMeta(project)
      if (subMeta === null) throw new Error(`unknown project ${JSON.stringify(project)}`)
      if (subMeta.pause !== null && subMeta.pause !== undefined) {
        sendJson(res, 409, { ok: false, error: '已在暂停，请先点继续（▶）再交工' })
        return
      }
      const stage = String(body.stage ?? '')
      if (subMeta.pendingStage !== stage) {
        sendJson(res, 409, {
          ok: false,
          error: `机器现在等的是「${stageLabel(subMeta.pendingStage, subMeta.pendingGate ?? null) ?? '无'}」，不是「${stage}」`,
        })
        return
      }
      switch (stage) {
        case 'explore': {
          const explorePath = workFile(project, 'explore.md')
          if (!existsSync(explorePath) || readFileSync(explorePath, 'utf8').trim() === '') {
            sendJson(res, 400, { ok: false, error: 'work/explore.md 不存在或为空，请先写好探查报告再交工' })
            return
          }
          let km = null
          try { km = JSON.parse(readFileSync(workFile(project, 'knowledge-map.json'), 'utf8')) } catch { km = null }
          if (km === null || typeof km !== 'object' || !Array.isArray(km.knowledgePoints) || km.knowledgePoints.length === 0
            || !Array.isArray(km.chapterSuggestion) || km.chapterSuggestion.length === 0) {
            sendJson(res, 400, { ok: false, error: 'work/knowledge-map.json 缺失或格式不对（需要非空的 knowledgePoints 与 chapterSuggestion）' })
            return
          }
          // teachingFocus 契约是 [string]，AI 偶发写对象数组——机器验货时归一化回写，
          // 让落盘文件（后续快照/下游消费）保持契约形状（2026-09 修复 [object Object]）。
          if (Array.isArray(km.teachingFocus) && km.teachingFocus.some((t) => typeof t !== 'string')) {
            km.teachingFocus = normalizeTeachingFocus(km.teachingFocus)
            writeWork(project, 'knowledge-map.json', JSON.stringify(km, null, 2))
          }
          updateMeta(project, (state) => {
            state.pendingStage = null
            state.pendingGate = null
            state.status = 'awaiting-explore'
            delete state.exploreRedoNote // 重做意见只对本轮探查生效
          })
          appendEvent(project, 'textbook/agent-end', { label: '源探查', outcome: 'ok' })
          appendEvent(project, 'textbook/hint', {
            text: EXPLORE_DONE_HINT,
          })
          sendJson(res, 200, { ok: true, project, stage: 'explore' })
          return
        }
        case 'gate': {
          const gate = subMeta.pendingGate ?? '1'
          const title = typeof body.title === 'string' ? body.title.trim() : ''
          const summary = typeof body.summary === 'string' ? body.summary.trim() : ''
          let detail = typeof body.detail === 'string' ? body.detail.trim() : ''
          if (title === '' || summary === '' || detail === '') {
            sendJson(res, 400, { ok: false, error: '方案不完整（需要 title 标题 / summary 人话摘要 / detail 完整方案）' })
            return
          }
          // 指针内联：AI 偶尔会把完整方案写进自选文件、detail 只留一句「见文件」。
          // 用户不该去文件夹翻文件——机器检测到指针样 detail 就把被指文件正文内联进来。
          const pointer = /(?:见|详见)[^。\n]{0,20}?((?:work\/)?proposal-[\w.-]+\.md)/.exec(detail)
          if (pointer !== null) {
            const rel = pointer[1].startsWith('work/') ? pointer[1] : `work/${pointer[1]}`
            const full = workFile(project, rel.replace(/^work\//, ''))
            if (existsSync(full)) {
              const fileText = readFileSync(full, 'utf8').trim()
              if (fileText !== '') detail = `${fileText}\n\n---\n（原摘要：${summary}）`
            }
          }
          const version = countProposals(project, gate) + 1
          updateMeta(project, (state) => {
            state.pendingStage = null
            state.pendingGate = null
          })
          appendEvent(project, 'textbook/agent-end', {
            label: `设计提案·第${gate}关${version > 1 ? `·修订v${version}` : ''}`, outcome: 'ok',
          })
          if (version === 1) proposeGate(project, gate, title, summary, detail)
          else proposeRevision(project, gate, version, title, summary, detail)
          sendJson(res, 200, { ok: true, project, stage: 'gate', gate, version })
          return
        }
        case 'outline': {
          let chapters = Array.isArray(body.chapters) ? body.chapters : null
          if (chapters === null && typeof body.chaptersJson === 'string' && body.chaptersJson.trim() !== '') {
            try { chapters = JSON.parse(body.chaptersJson) } catch { chapters = null }
          }
          if (chapters === null || !Array.isArray(chapters) || chapters.length === 0) {
            sendJson(res, 400, { ok: false, error: '章节骨架不能为空（需要 chapters 数组或 chaptersJson JSON 字符串）' })
            return
          }
          const cleaned = []
          for (const chapter of chapters) {
            const title = String(chapter?.title ?? '').trim()
            if (title === '') { sendJson(res, 400, { ok: false, error: '章节缺少 title' }); return }
            cleaned.push({
              title,
              outline: String(chapter?.outline ?? ''),
              source: String(chapter?.source ?? ''),
              targetWords: Number.isFinite(Number(chapter?.targetWords)) && Number(chapter.targetWords) >= 500
                ? Math.round(Number(chapter.targetWords)) : 6000,
              points: Array.isArray(chapter?.points)
                ? chapter.points.map((pt) => String(pt ?? '').trim()).filter((pt) => pt !== '').slice(0, 20)
                : [],
              volumeReason: String(chapter?.volumeReason ?? '').slice(0, 200),
            })
          }
          const goldN = Number(body.goldChapter)
          const goldReason = String(body.goldChapterReason ?? '').slice(0, 200)
          updateMeta(project, (state) => {
            if (Number.isSafeInteger(goldN) && goldN >= 1 && goldN <= cleaned.length) {
              state.goldChapter = goldN
              state.goldChapterReason = goldReason
            } else {
              state.goldChapter = 1
              state.goldChapterReason = ''
            }
            state.outline = { chapters: cleaned }
            state.pendingStage = null
            state.pendingGate = null
          })
          writeWork(project, 'outline.md', JSON.stringify({ chapters: cleaned }, null, 2))
          appendEvent(project, 'textbook/agent-end', { label: '整理章节骨架', outcome: 'ok' })
          if (waived(project, 'outline-skip')) {
            advance(project, 3, 4)
            void kick(ctx, project)
          } else {
            updateMeta(project, (state) => { state.status = 'awaiting-outline' })
            appendEvent(project, 'textbook/hint', {
              text: '📐 章节安排出来了，请在工作台查看：满意点「✅ 通过」，不满意点「🔁 提改进方向」让 AI 修订。',
            })
          }
          sendJson(res, 200, { ok: true, project, stage: 'outline', chapters: cleaned.length })
          return
        }
        case 'gold': {
          const gN = goldN(subMeta)
          const auditName = goldAuditName(gN)
          const missing = [`chapter-${String(gN).padStart(2, '0')}.md`, 'style-spec.md', auditName].filter((name) => {
            const target = workFile(project, name)
            return !existsSync(target) || readFileSync(target, 'utf8').trim() === ''
          })
          if (missing.length > 0) {
            rejectSubmit('gold', `范例章文件缺失或为空：${missing.join('、')}`)
            return
          }
          // style-spec 节标题软验（真实模式）：写作规范十问契约要求节标题齐全，缺了就拦下让 AI 补全。
          // demo 模式的占位 style-spec 没有节标题，不拦。
          if (subMeta.demo !== true) {
            const spec = readFileSync(workFile(project, 'style-spec.md'), 'utf8')
            const missingSections = ['模式选型', '板块语法', '深度四维承诺'].filter((h) => !spec.includes(h))
            if (missingSections.length > 0) {
              rejectSubmit('gold', `style-spec 缺节标题：${missingSections.join('、')}（写作规范十问契约见任务说明）`)
              return
            }
          }
          // 干净审计（真实模式）：范例章交工前 audit 必须带机器可逐条核对的文档矩阵（必读清单逐份摘录原文），
          // 且 `passed === true`（票 01 (e)：范例章与普通章同口径，`audit-skip` 豁免可跳过 passed 判定；
          // `gold-skip` 跳过的是「等用户拍板」，不是验货豁免）。判据与报错跟写入侧 `audit-submit` 共用同一份。
          if (subMeta.demo !== true) {
            const auditText = readFileSync(workFile(project, auditName), 'utf8')
            const verdict = checkGoldAudit(project, gN, auditText)
            if (verdict.error !== null) {
              rejectSubmit('gold', verdict.error)
              return
            }
          }
          updateMeta(project, (state) => {
            state.pendingStage = null
            state.pendingGate = null
            state.status = 'awaiting-gold'
            delete state.goldRedoNote // 重做意见只对本轮生效
            // style-spec 指纹定格（Q9）：终检交工时对账，spec 变了而报告未声明 → 打回（契约修改必须留痕）。
            try { state.styleSpecHash = specFingerprint(project) } catch { /* spec 读不到时不记账（后续对账跳过） */ }
            if (Array.isArray(state.goldOpinions)) {
              for (const o of state.goldOpinions) if (o.status === 'sent') o.status = 'applied'
            }
          })
          appendEvent(project, 'textbook/agent-end', { label: '最佳范例章', outcome: 'ok' })
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
            sendJson(res, 200, { ok: true, project, stage: 'gold', skipped: 'gold-confirm' })
            return
          }
          appendEvent(project, 'textbook/hint', {
            text: '📖 最佳范例章写好了，请在工作台查看：满意点「✅ 满意，继续写全书」，不满意点「❌ 重写」。',
          })
          sendJson(res, 200, { ok: true, project, stage: 'gold' })
          return
        }
        case 'chapters': {
          const chapters = subMeta.outline?.chapters ?? []
          const n = Number(body.chapter)
          if (!Number.isSafeInteger(n) || n < 1 || n > chapters.length) {
            sendJson(res, 400, { ok: false, error: 'chapter 参数不合法（需要第几章的编号）' })
            return
          }
          const { chapterPath, auditPath } = chapterArtifacts(project, n)
          if (!existsSync(chapterPath) || readFileSync(chapterPath, 'utf8').trim() === '') {
            sendJson(res, 400, { ok: false, error: `第${n}章正文缺失或为空：work/chapter-${String(n).padStart(2, '0')}.md` })
            return
          }
          if (!existsSync(auditPath)) {
            sendJson(res, 400, { ok: false, error: `第${n}章缺少自查记录：work/audit-${String(n).padStart(2, '0')}.md` })
            return
          }
          // 章审计机器验货（2026-08-27 用户拍板 Q4'）：每章交工读 audit JSON，passed === true 才放行。
          // 对齐金标准章 matrix 校验同口径；「审计未过但交工」直接拒（audit-skip 豁免可跳过）。
          if (subMeta.demo !== true && !waived(project, 'audit-skip')) {
            let audit = null
            try { audit = JSON.parse(readFileSync(auditPath, 'utf8')) } catch { /* 非合法 JSON = 未过 */ }
            if (audit?.passed !== true) {
              sendJson(res, 400, { ok: false, error: `第${n}章审计未通过（work/audit-${String(n).padStart(2, '0')}.md 的 passed 不是 true）：先按审计意见修订并重新审计，或豁免「不要求每章都有独立审查」再交工` })
              return
            }
          }
          // 前置验货（检查点前置）：单章阶段就查脚手架残留与练习/答案，不让问题流到合并后。
          // demo 书走旧通道不受此约束；scaffold-keep / other 豁免可跳过对应项（与终检 runQualityChecks 同口径）。
          if (subMeta.demo !== true) {
            const chapterText = readFileSync(chapterPath, 'utf8')
            if (!waived(project, 'scaffold-keep')) {
              const residue = scanScaffolding(stripLoaderRegion(chapterText))
              if (residue.length > 0) {
                sendJson(res, 400, { ok: false, error: `第${n}章正文残留 AI 笔记/脚手架：${residue.slice(0, 3).join('；')}。先拆干净再交工（豁免「保留 AI 的笔记不删」可跳过）。` })
                return
              }
            }
            // 契约原则（Q9）：style-spec 声明「本书不设练习」→ 练习/答案检查自动跳过；否则仍要齐全。
            if (!waived(project, 'other') && !styleSpecDeclaresNoExercises(project) && !/练习|答案|习题/.test(chapterText)) {
              sendJson(res, 400, { ok: false, error: `第${n}章正文没有练习或答案（成品要求练习与答案齐全；若本书设计为不设练习，请在 style-spec 写明「不设练习」）：work/chapter-${String(n).padStart(2, '0')}.md` })
              return
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
              sendJson(res, 400, {
                ok: false,
                error: `不认识的抽查意见 id：${unknownIds.join('、')}。只能点名第${n}章还没处置的意见（id 见 workbench_status 的 pendingReviews）。`,
              })
              return
            }
            // 这份 `reviews` 只用来判断：未知 id 已在上方整体验明（防半写半退）；「点名后还有没有没处置的」
            // 按 pending 且未被点名来算（applied 才销号、revoked 是用户收回的，重复点名幂等忽略）。
            const handledIds = new Set(handled
              .filter((entry) => reviews.some((r) => r.id === entry.id && r.chapter === n && r.status === 'pending'))
              .map((entry) => entry.id))
            const pendingForChapter = reviews.filter((r) => r.chapter === n && r.status === 'pending' && !handledIds.has(r.id))
            if (pendingForChapter.length > 0) {
              sendJson(res, 400, {
                ok: false,
                error: `第${n}章还有 ${pendingForChapter.length} 条未处置的抽查意见：先按意见修订、重新审计（audit passed），交工时用 handledReviews 逐条点名（每条 id + 一句怎么处置的）后再交工。`,
              })
              return
            }
            // 销号落账走单一入口（当场新读）。
            updateMeta(project, (state) => {
              const list = Array.isArray(state.pendingReviews) ? state.pendingReviews : []
              for (const entry of handled) {
                const review = list.find((r) => r.id === entry.id && r.chapter === n)
                if (review === undefined || review.status !== 'pending') continue
                review.status = 'applied'
                review.how = typeof entry.how === 'string' ? entry.how.trim().slice(0, 200) : ''
              }
            })
          }
          const title = chapters[n - 1]?.title ?? `第${n}章`
          appendEvent(project, 'textbook/agent-end', { label: `第${n}章《${title}》完成（小助手执笔 + 小助手审计 + 机器验货）`, outcome: 'ok' })
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
          sendJson(res, 200, { ok: true, project, stage: 'chapters', chapter: n, allDone })
          return
        }
        case 'merge': {
          // 过目闸门硬校验：章节还在等人过目时不许合并（F18；demo 书不会进入此态，不拦 demo）。
          if (subMeta.status === 'awaiting-chapters-review') {
            sendJson(res, 409, { ok: false, error: '章节还在等你过目：先在工作台完成全章过目（或先提意见让 AI 改），再合并。' })
            return
          }
          // 合并前跨章审计（Q6，2026-08-27 用户拍板）：真实模式交工 merge 前，主 AI 必须已做
          // 跨章深度审计（事实一致性/术语统一/引用悬空/知识递进链）并落盘 audit-cross.md，机器验存在。
          if (subMeta.demo !== true) {
            const crossPath = workFile(project, 'audit-cross.md')
            if (!existsSync(crossPath) || readFileSync(crossPath, 'utf8').trim() === '') {
              sendJson(res, 400, { ok: false, error: '合并前缺跨章审计记录 work/audit-cross.md：请先通读全部章节，核对事实一致性、术语统一、交叉引用悬空、知识递进链，发现问题先修，再把审计结论落盘 audit-cross.md 后交工合并。' })
              return
            }
          }
          const preface = typeof body.preface === 'string' ? body.preface.trim() : ''
          if (preface === '') {
            sendJson(res, 400, { ok: false, error: '需要 preface（书的引言/使用说明文本）' })
            return
          }
          writeWork(project, 'preface.md', preface)
          const chapters = subMeta.outline?.chapters ?? []
          const parts = [`# ${subMeta.name ?? ''}`, '', preface, '']
          for (let index = 0; index < chapters.length; index += 1) {
            const { chapterPath } = chapterArtifacts(project, index + 1)
            const body2 = existsSync(chapterPath) ? readFileSync(chapterPath, 'utf8').trim() : ''
            const heading = `# 第${index + 1}章 ${chapters[index]?.title ?? ''}`
            // 章节正文若自带一级标题则去掉，避免与章标题重复。
            const stripped = body2.replace(/^#\s+.*$/m, '').trim()
            parts.push('', '---', '', heading, '', stripped)
          }
          // human 路线：成品顶部给 AI 老师留 loader 装配指令（正文 prose 当素材库用），保留在成品里。
          if (subMeta.route === 'human') {
            parts.splice(1, 0, '', '<!-- loader:begin -->', '给 AI 老师的 loader 指令：正文 prose 是素材库，用自己的话重组教学；章末教学区照问题链走。', '<!-- loader:end -->')
          }
          writeWork(project, 'book.md', parts.join('\n'))
          updateMeta(project, (state) => {
            state.pendingStage = null
            state.pendingGate = null
          })
          appendEvent(project, 'textbook/agent-end', { label: '合并成书（机器拼装 + AI 前言）', outcome: 'ok' })
          advance(project, 5, 6)
          void kick(ctx, project)
          sendJson(res, 200, { ok: true, project, stage: 'merge' })
          return
        }
        case 'final': {
          const report = typeof body.report === 'string' ? body.report.trim() : ''
          if (report === '') {
            sendJson(res, 400, { ok: false, error: '需要 report（你的最后检查报告）' })
            return
          }
          // 终检门槛（真实模式）：留言必须先销号。
          if (subMeta.demo !== true) {
            const pendingIv = (subMeta.pendingInterventions ?? []).filter((i) => i.status === 'pending')
            if (pendingIv.length > 0) {
              sendJson(res, 409, {
                ok: false,
                error: `还有 ${pendingIv.length} 条用户留言没处理：${pendingIv.map((i) => i.text).join('；')}。先处理（intervene-done）再交工。`,
              })
              return
            }
          }
          // 进度账本硬验（真实模式）：交工前 work/progress.md 必须在（progress-skip 可豁免）。
          if (subMeta.demo !== true && !waived(project, 'progress-skip') && !existsSync(workFile(project, 'progress.md'))) {
            sendJson(res, 400, {
              ok: false,
              error: '缺 work/progress.md（进度账本）：每章一行（写完/审计/验货），是中途换人/重做的参照。不需要可先豁免「跳过进度账本检查」再交工。',
            })
            return
          }
          // styleCheck 处置契约（真实模式 + 存在 active 风格线时必交）。
          if (subMeta.demo !== true) {
            const active = (subMeta.styleNotes ?? []).filter((n) => n.status === 'active')
            const disposals = Array.isArray(body.styleCheck) ? body.styleCheck : []
            if (active.length > 0 || disposals.length > 0) {
              const byId = new Map(disposals.map((d) => [d.id, d]))
              const missing = active.filter((n) => !byId.has(n.id)).map((n) => n.text)
              if (missing.length > 0) {
                sendJson(res, 400, { ok: false, error: `这些风格意见没有处置：${missing.join('；')}。每条都要给出去向（落实在哪章 / 冲突理由 / 已收回）。` })
                return
              }
              for (const d of disposals) {
                if (!['adopted', 'conflict', 'superseded'].includes(d.status)) {
                  sendJson(res, 400, { ok: false, error: 'styleCheck 的 status 只能是 adopted / conflict / superseded' })
                  return
                }
                if (d.status === 'conflict' && (typeof d.note !== 'string' || d.note.trim() === '')) {
                  sendJson(res, 400, { ok: false, error: 'conflict（冲突）必须写一句理由，说明向用户确认过' })
                  return
                }
              }
              // 权威翻转：meta 状态只在这里改。走单一入口（当场新读）——紧接着的镜像读的就是刚写进去的这份
              // （原先靠请求末尾那次整份写回兜着，写回一收窄就露馅）。
              updateMeta(project, (state) => {
                for (const d of disposals) {
                  const note = (state.styleNotes ?? []).find((n) => n.id === d.id)
                  if (note === undefined) continue
                  note.status = d.status
                  note.note = typeof d.note === 'string' ? d.note.slice(0, 300) : (typeof d.chapter === 'string' ? `落实于${d.chapter}` : note.note)
                }
              })
              updateStyleLineMirror(project)
            }
          }
          // style-spec 对账（Q9，2026-08-27）：范例章定稿后 spec 被改过 → 契约修改必须留痕。
          // 机器只认自查报告里的「style-spec 变更：」声明——没声明就打回，防 AI 静默放宽契约迁就检查。
          let specNow = null
          try { specNow = specFingerprint(project) } catch { /* spec 被删/不可读：视为已变更（堵「删 spec 逃检查」的逃逸口） */ }
          if (subMeta.styleSpecHash != null && specNow !== subMeta.styleSpecHash
            && !report.includes('style-spec 变更')) {
            sendJson(res, 400, {
              ok: false,
              error: 'style-spec 在范例章定稿后有改动（机器对账发现）：若改动经用户确认，请在 report 末尾写明「style-spec 变更：<改了哪条>」再交工；未经用户确认的改动请改回原样。',
            })
            return
          }
          updateMeta(project, (state) => { state.finalReport = report })
          appendEvent(project, 'textbook/ai-report', { report })
          // 机器硬检查兜底：全过才交付，否则打回主 AI 修。
          const machineChecks = runQualityChecks(project)
          if (machineChecks.every((check) => check.ok === true)) {
            // 终检结果认可闸门（2026-08-26 用户拍板）：硬检查全过也不直接交付——
            // 先落 awaiting-final-approval，把自查报告 + 检查结果展示给用户做「对整本书的最终认可」。
            // demo 与真实共用认可闸门（2026-09-01 全镜像：演示书也走完整确认流程）。
            updateMeta(project, (state) => {
              state.pendingStage = null
              state.pendingGate = null
              state.status = 'awaiting-final-approval'
              state.finalChecks = machineChecks
              state.finalReport = report
              delete state.finalRedoNote // 终检修订意见销号：本轮交工已通过，意见已落实（2026-08-27 grill 修订）
            })
            appendEvent(project, 'textbook/quality', { checks: machineChecks })
            appendEvent(project, 'textbook/agent-end', { label: '最后检查（AI 自查 + 机器兜底）', outcome: 'ok' })
            appendEvent(project, 'textbook/hint', {
              text: FINAL_CHECK_DONE_HINT,
            })
            sendJson(res, 200, { ok: true, project, stage: 'final', awaitingApproval: true, checks: machineChecks })
          } else {
            const issues = machineChecks.filter((check) => check.ok !== true)
              .map((check) => `${check.name}：${check.note ?? ''}`)
            appendEvent(project, 'textbook/error', {
              task: '最后检查',
              message: `机器兜底发现 ${issues.length} 项没过：${issues.join('；')}。请 AI 修复后重新交工。`,
            })
            updateMeta(project, (state) => { state.status = 'running' })
            // 不自动再唤醒：问题已随响应返回主 AI，它会在同一回合修复并重交；用户也可点重试。
            sendJson(res, 200, { ok: true, project, stage: 'final', delivered: false, issues: issues.map((text) => ({ text })) })
          }
          return
        }
        default:
          sendJson(res, 400, { ok: false, error: `未知交工阶段: ${stage}` })
          return
      }
    }
    case 'stage-brief': {
      // 主 AI 领任务：当前 pendingStage 的任务说明 + 方法论文本（全中文）。
      assertSessionOwned(project, sessionId)
      const brief = buildStageBrief(project)
      if (brief === null) {
        sendJson(res, 200, { ok: true, brief: null, message: '当前没有待办任务（机器没在等你）。' })
        return
      }
      sendJson(res, 200, { ok: true, brief })
      return
    }
    case 'progress': {
      // 主 AI 上报进度（工作台状态卡实时显示；不需要征求用户同意）。
      assertSessionOwned(project, sessionId)
      const progressMeta = readMeta(project)
      if (progressMeta !== null && progressMeta.pause !== null && progressMeta.pause !== undefined) {
        sendJson(res, 409, { ok: false, error: '已在暂停，请先点继续（▶）再上报进度' })
        return
      }
      const label = typeof body.label === 'string' ? body.label.slice(0, 60) : ''
      const detail = typeof body.detail === 'string' ? body.detail.slice(0, 300) : ''
      appendEvent(project, 'textbook/progress', { label, detail })
      // F35（2026-08-20 走查）：主 AI 上报章节流水线阶段（chapter+stage）→ 结构化账本
      // meta.chapterPipeline[n-1]={stage,updatedAt}；demo 豁免；旧账本 ?? [] 兜底。
      // 走单一入口（当场新读）：原先这里还自己写了一次 `updatedAt`（票 02 的形状）；
      // 「最后动静时刻」只归上面那记「记一笔」所有。
      const chapterN = Number.isSafeInteger(body.chapter) && body.chapter >= 1 ? Number(body.chapter) : null
      const stage = ['writing', 'auditing', 'audited', 'finalizing', 'done'].includes(String(body.stage))
        ? String(body.stage)
        : null
      if (chapterN !== null && stage !== null) {
        updateMeta(project, (state) => {
          if (state.demo === true) return
          const pipeline = Array.isArray(state.chapterPipeline) ? state.chapterPipeline.slice() : []
          while (pipeline.length < chapterN) pipeline.push(null)
          pipeline[chapterN - 1] = { stage, updatedAt: Date.now() }
          state.chapterPipeline = pipeline
        })
      }
      // 上报进度后让状态机照账本重推导（幂等，runLoop 会在等待点停下）：
      // 铺章全写完的瞬间在这里停下等人过目（F18）；其它阶段照旧推进。
      void kick(ctx, project)
      sendJson(res, 200, { ok: true, project })
      return
    }
  }
}
