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
  writeMeta,
  waived,
  appendEvent,
  workFile,
  writeWork,
  updateStyleLineMirror,
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
  kick,
  sendJson,
  buildStageBrief,
} from '../engine.js'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { normalizeTeachingFocus } from '../../domain-rules.js'


/** 动作族 · 章节执行与审阅：'review' / 'stage-submit' / 'stage-brief' / 'progress'。 */
export async function actChapters(ctx, _req, res, action, sessionId, project, body) {
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
        sendJson(res, 409, { ok: false, error: '现在不在铺章阶段，没法直接在章节卡写意见；可以在对话里告诉 AI，它会帮你安排' })
        return
      }
      const reviews = Array.isArray(rvMeta.pendingReviews) ? rvMeta.pendingReviews : []
      reviews.push({ chapter: n, comment, at: Date.now() })
      rvMeta.pendingReviews = reviews
      // 过目态下提意见：转回 running 并交办修订（改完回来继续过目）。
      // 注意：要先取原状态再落盘，否则 writeMeta 会把 handoff 写好的 pendingStage 覆盖回 null。
      const inChaptersReview = rvMeta.status === 'awaiting-chapters-review'
      rvMeta.status = 'running'
      if (inChaptersReview) {
        rvMeta.pendingStage = null
        rvMeta.chaptersReviewed = false
      }
      writeMeta(rvMeta)
      const title = chapters[n - 1]?.title ?? `第${n}章`
      appendEvent(project, 'textbook/review', { chapter: n, title, comment })
      if (inChaptersReview) {
        handoff(ctx, project, 'chapters')
      } else {
        const pending = rvMeta.pendingStage
        if (pending === null || pending === undefined || pending === 'chapters') {
          // 机器空闲或正在铺章：唤醒/让主 AI 接着处理意见（交工前必查意见）。
          if (pending === null || pending === undefined) handoff(ctx, project, 'chapters')
        }
      }
      // 若正在合并/终检：不打断；主 AI 交工前会查 workbench_status 里的抽查意见并先处理。
      sendJson(res, 200, { ok: true, project, chapter: n, queued: true })
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
          subMeta.pendingStage = null
          subMeta.pendingGate = null
          subMeta.status = 'awaiting-explore'
          delete subMeta.exploreRedoNote // 重做意见只对本轮探查生效
          writeMeta(subMeta)
          appendEvent(project, 'textbook/agent-end', { label: '源探查', outcome: 'ok' })
          appendEvent(project, 'textbook/hint', {
            text: '🔍 源探查做完了，请在工作台查看：满意点「✅ 满意，继续设计」，不满意点「🔁 让 AI 重做」。',
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
          subMeta.pendingStage = null
          subMeta.pendingGate = null
          writeMeta(subMeta)
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
          if (Number.isSafeInteger(goldN) && goldN >= 1 && goldN <= cleaned.length) {
            subMeta.goldChapter = goldN
            subMeta.goldChapterReason = String(body.goldChapterReason ?? '').slice(0, 200)
          } else {
            subMeta.goldChapter = 1
            subMeta.goldChapterReason = ''
          }
          subMeta.outline = { chapters: cleaned }
          subMeta.pendingStage = null
          subMeta.pendingGate = null
          writeMeta(subMeta)
          writeWork(project, 'outline.md', JSON.stringify({ chapters: cleaned }, null, 2))
          appendEvent(project, 'textbook/agent-end', { label: '整理章节骨架', outcome: 'ok' })
          if (waived(project, 'outline-skip')) {
            advance(project, 3, 4)
            void kick(ctx, project)
          } else {
            subMeta.status = 'awaiting-outline'
            writeMeta(subMeta)
            appendEvent(project, 'textbook/hint', {
              text: '📐 章节安排出来了，请在工作台查看：满意点「✅ 通过」，不满意点「🔁 提改进方向」让 AI 修订。',
            })
          }
          sendJson(res, 200, { ok: true, project, stage: 'outline', chapters: cleaned.length })
          return
        }
        case 'gold': {
          const gN = goldN(subMeta)
          const missing = [`chapter-${String(gN).padStart(2, '0')}.md`, 'style-spec.md', `audit-${String(gN).padStart(2, '0')}.md`].filter((name) => {
            const target = workFile(project, name)
            return !existsSync(target) || readFileSync(target, 'utf8').trim() === ''
          })
          if (missing.length > 0) {
            sendJson(res, 400, { ok: false, error: `范例章文件缺失或为空：${missing.join('、')}` })
            return
          }
          // style-spec 节标题软验（真实模式）：写作规范十问契约要求节标题齐全，缺了就拦下让 AI 补全。
          // demo 模式的占位 style-spec 没有节标题，不拦。
          if (subMeta.demo !== true) {
            const spec = readFileSync(workFile(project, 'style-spec.md'), 'utf8')
            const missingSections = ['模式选型', '板块语法', '深度四维承诺'].filter((h) => !spec.includes(h))
            if (missingSections.length > 0) {
              sendJson(res, 400, { ok: false, error: `style-spec 缺节标题：${missingSections.join('、')}（写作规范十问契约见任务说明）` })
              return
            }
          }
          // 干净审计（真实模式）：范例章交工前 audit 必须带机器可逐条核对的文档矩阵（必读清单逐份摘录原文）。
          if (subMeta.demo !== true) {
            try {
              const audit = JSON.parse(readFileSync(workFile(project, `audit-${String(goldN(subMeta)).padStart(2, '0')}.md`), 'utf8'))
              const required = ['work/explore.md', 'work/knowledge-map.json', 'work/outline.md', 'work/style-spec.md', `work/chapter-${String(goldN(subMeta)).padStart(2, '0')}.md`]
              const matrix = Array.isArray(audit.matrix) ? audit.matrix : []
              if (matrix.length === 0) { sendJson(res, 400, { ok: false, error: 'audit 缺文档矩阵（matrix）：审计小助手须逐份必读文件摘录一行原文' }); return }
              for (const rel of required) {
                const row = matrix.find((m) => m.file === rel)
                if (row === undefined) { sendJson(res, 400, { ok: false, error: `audit.matrix 缺必读文件：${rel}` }); return }
                const text = readFileSync(join(projectDir(project), rel), 'utf8')
                if (typeof row.quote !== 'string' || !text.includes(row.quote)) {
                  sendJson(res, 400, { ok: false, error: `audit.matrix 摘录对不上：${rel}` }); return
                }
              }
            } catch (error) {
              sendJson(res, 400, { ok: false, error: `audit 文件不是合法 JSON 或缺 matrix：${String(error instanceof Error ? error.message : error)}` })
              return
            }
          }
          subMeta.pendingStage = null
          subMeta.pendingGate = null
          subMeta.status = 'awaiting-gold'
          delete subMeta.goldRedoNote // 重做意见只对本轮生效
          // style-spec 指纹定格（Q9）：终检交工时对账，spec 变了而报告未声明 → 打回（契约修改必须留痕）。
          try { subMeta.styleSpecHash = specFingerprint(project) } catch { /* spec 读不到时不记账（后续对账跳过） */ }
          if (Array.isArray(subMeta.goldOpinions)) {
            for (const o of subMeta.goldOpinions) if (o.status === 'sent') o.status = 'applied'
          }
          writeMeta(subMeta)
          appendEvent(project, 'textbook/agent-end', { label: '最佳范例章', outcome: 'ok' })
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
            // 用户抽查意见未处置（Q5'）：该章还有未 applied/revoked 的意见 → 拒交，先修订+重新审计+标记处置。
            const pendingForChapter = (subMeta.pendingReviews ?? []).filter((r) => r.chapter === n && r.status !== 'applied' && r.status !== 'revoked')
            if (pendingForChapter.length > 0) {
              sendJson(res, 400, { ok: false, error: `第${n}章还有 ${pendingForChapter.length} 条未处置的抽查意见，先按意见修订、重新审计（audit passed）并标记处置后再交工` })
              return
            }
          }
          const title = chapters[n - 1]?.title ?? `第${n}章`
          appendEvent(project, 'textbook/agent-end', { label: `第${n}章《${title}》完成（小助手执笔 + 小助手审计 + 机器验货）`, outcome: 'ok' })
          subMeta.updatedAt = Date.now()
          writeMeta(subMeta)
          const allDone = chapters.every((_chapter, index) => chapterDone(project, index + 1))
          if (allDone) {
            subMeta.pendingStage = null
            subMeta.pendingGate = null
            writeMeta(subMeta)
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
          subMeta.pendingStage = null
          subMeta.pendingGate = null
          writeMeta(subMeta)
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
              // 权威翻转：meta 状态只在这里改。
              for (const d of disposals) {
                const note = subMeta.styleNotes.find((n) => n.id === d.id)
                if (note === undefined) continue
                note.status = d.status
                note.note = typeof d.note === 'string' ? d.note.slice(0, 300) : (typeof d.chapter === 'string' ? `落实于${d.chapter}` : note.note)
              }
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
          subMeta.finalReport = report
          writeMeta(subMeta)
          appendEvent(project, 'textbook/ai-report', { report })
          // 机器硬检查兜底：全过才交付，否则打回主 AI 修。
          const machineChecks = runQualityChecks(project)
          if (machineChecks.every((check) => check.ok === true)) {
            // 终检结果认可闸门（2026-08-26 用户拍板）：硬检查全过也不直接交付——
            // 先落 awaiting-final-approval，把自查报告 + 检查结果展示给用户做「对整本书的最终认可」。
            // demo 与真实共用认可闸门（2026-09-01 全镜像：演示书也走完整确认流程）。
            subMeta.pendingStage = null
            subMeta.pendingGate = null
            subMeta.status = 'awaiting-final-approval'
            subMeta.finalChecks = machineChecks
            subMeta.finalReport = report
            delete subMeta.finalRedoNote // 终检修订意见销号：本轮交工已通过，意见已落实（2026-08-27 grill 修订）
            writeMeta(subMeta)
            appendEvent(project, 'textbook/quality', { checks: machineChecks })
            appendEvent(project, 'textbook/agent-end', { label: '最后检查（AI 自查 + 机器兜底）', outcome: 'ok' })
            appendEvent(project, 'textbook/hint', {
              text: '🛡️ 终检完成了：AI 自查报告与机器检查结果已在工作台。这是你对整本书的最后一次把关——满意点「✅ 认可，交付」，要改的写意见（AI 会按意见修整本后重新终检）。',
            })
            sendJson(res, 200, { ok: true, project, stage: 'final', awaitingApproval: true, checks: machineChecks })
          } else {
            const issues = machineChecks.filter((check) => check.ok !== true)
              .map((check) => `${check.name}：${check.note ?? ''}`)
            appendEvent(project, 'textbook/error', {
              task: '最后检查',
              message: `机器兜底发现 ${issues.length} 项没过：${issues.join('；')}。请 AI 修复后重新交工。`,
            })
            subMeta.status = 'running'
            writeMeta(subMeta)
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
      const prMeta = readMeta(project)
      if (prMeta !== null) {
        // F35（2026-08-20 走查）：主 AI 上报章节流水线阶段（chapter+stage）→ 结构化账本
        // meta.chapterPipeline[n-1]={stage,updatedAt}；demo 豁免；旧账本 ?? [] 兜底。
        const chapterN = Number.isSafeInteger(body.chapter) && body.chapter >= 1 ? Number(body.chapter) : null
        const stage = ['writing', 'auditing', 'audited', 'finalizing', 'done'].includes(String(body.stage))
          ? String(body.stage)
          : null
        if (chapterN !== null && stage !== null && prMeta.demo !== true) {
          const pipeline = Array.isArray(prMeta.chapterPipeline) ? prMeta.chapterPipeline.slice() : []
          while (pipeline.length < chapterN) pipeline.push(null)
          pipeline[chapterN - 1] = { stage, updatedAt: Date.now() }
          prMeta.chapterPipeline = pipeline
        }
        prMeta.updatedAt = Date.now()
        writeMeta(prMeta)
      }
      // 上报进度后让状态机照账本重推导（幂等，runLoop 会在等待点停下）：
      // 铺章全写完的瞬间在这里停下等人过目（F18）；其它阶段照旧推进。
      void kick(ctx, project)
      sendJson(res, 200, { ok: true, project })
      return
    }
  }
}
