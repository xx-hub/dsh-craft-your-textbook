/**
 * 动作族模块（架构评审候选 3，2026-09-01 拆分）：actGold
 * 从 src/workflow.js 平移，接口 (ctx, req, res, action, sessionId, project, body) 不变。
 * 共享工具来自 ../engine.js。
 */
import {
  assertSessionOwned,
  goldN,
  paragraphReviewText,
  readMeta,
  writeMeta,
  appendEvent,
  readEvents,
  workDir,
  workFile,
  updateStyleLineMirror,
  wakeMainAI,
  handoff,
  advance,
  kick,
  sendJson,
} from '../engine.js'
import { mkdirSync, existsSync, renameSync, rmSync } from 'node:fs'
import { join } from 'node:path'


/** 动作族 · 金标准：'gold-opinion' / 'gold-opinion-revoke' / 'gold-revise' / 'gold-chapter-set' / 'gold-approve'。 */
export async function actGold(ctx, _req, res, action, sessionId, project, body) {
  switch (action) {
    case 'gold-opinion': {
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      // F39（2026-08-20 走查）：全章过目段级三键——带 chapter 的段落意见落 pendingReviews
      // （chapter 维度），修订回路与整章意见相同（过目态→转 running→交办修订→改完回过目卡）。
      // 只对真实模式生效（meta.demo !== true）；不带 chapter 保持原有 goldOpinions 链路不变。
      const chapters = meta?.outline?.chapters ?? []
      const chapter = Number.isSafeInteger(body.chapter) && body.chapter >= 1 ? Number(body.chapter) : null
      if (meta.demo !== true && meta.phase === 5 && chapter !== null && chapter <= chapters.length) {
        const kind = ['dislike', 'drop', 'change'].includes(body.kind) ? body.kind : null
        const wish = typeof body.wish === 'string' ? body.wish.trim().slice(0, 300) : ''
        if (kind === null || (kind === 'change' && wish === '')) {
          sendJson(res, 400, { ok: false, error: '意见需要类型；「要改成」必须补一句话（不喜欢/不需要可以只点一下）' })
          return
        }
        const target = Number.isSafeInteger(body.para) || typeof body.hint === 'string'
          ? { para: Number.isSafeInteger(body.para) ? body.para : null, hint: typeof body.hint === 'string' ? body.hint.slice(0, 60) : '' }
          : null
        const opinion = {
          id: `pr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          at: Date.now(), chapter, target, kind, wish, status: 'pending',
        }
        const reviews = Array.isArray(meta.pendingReviews) ? meta.pendingReviews : []
        reviews.push(opinion)
        meta.pendingReviews = reviews
        meta.updatedAt = Date.now()
        // 过目态下提段落意见：与整章意见同路径——先取原状态再落盘，转 running 交办修订（改完回来继续过目）。
        const inChaptersReview = meta.status === 'awaiting-chapters-review'
        meta.status = 'running'
        if (inChaptersReview) {
          meta.pendingStage = null
          meta.chaptersReviewed = false
        }
        writeMeta(meta)
        const title = chapters[chapter - 1]?.title ?? `第${chapter}章`
        appendEvent(project, 'textbook/review', { chapter, title, comment: paragraphReviewText(opinion), para: target?.para ?? null })
        if (inChaptersReview) {
          handoff(ctx, project, 'chapters')
        } else {
          // 机器空闲或正在铺章：唤醒/让主 AI 接着处理意见（交工前必查意见）。
          const pending = meta.pendingStage
          if (pending === null || pending === undefined || pending === 'chapters') {
            if (pending === null || pending === undefined) handoff(ctx, project, 'chapters')
          }
        }
        sendJson(res, 200, { ok: true, project, chapter, opinion, queued: true })
        return
      }
      const inGold = meta.status === 'awaiting-gold' || meta.pendingStage === 'gold'
      if (!inGold) { sendJson(res, 409, { ok: false, error: '现在不在最佳范例章确认环节' }); return }
      const kind = ['dislike', 'drop', 'change'].includes(body.kind) ? body.kind : null
      const wish = typeof body.wish === 'string' ? body.wish.trim().slice(0, 300) : ''
      if (kind === null || (kind === 'change' && wish === '')) {
        sendJson(res, 400, { ok: false, error: '意见需要类型；「要改成」必须补一句话（不喜欢/不需要可以只点一下）' })
        return
      }
      const target = Number.isSafeInteger(body.para) || typeof body.hint === 'string'
        ? { para: Number.isSafeInteger(body.para) ? body.para : null, hint: typeof body.hint === 'string' ? body.hint.slice(0, 60) : '' }
        : null
      const opinion = {
        id: `go-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        at: Date.now(), target, kind, wish, status: 'pending',
      }
      meta.goldOpinions = [...(meta.goldOpinions ?? []), opinion]
      meta.updatedAt = Date.now()
      writeMeta(meta)
      appendEvent(project, 'textbook/gold-opinion', {
        seq: meta.goldOpinions.filter((o) => o.status !== 'revoked').length,
        opinion: { ...opinion, target: target === null ? '笼统' : (target.hint || `第${target.para}段`) },
      })
      sendJson(res, 200, { ok: true, project, opinion })
      return
    }
    case 'gold-opinion-revoke': {
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      // F39：段落级意见记在 pendingReviews（chapter 维度），撤销时两处都找。
      const target = (meta.goldOpinions ?? []).find((o) => o.id === body.id)
        ?? (meta.pendingReviews ?? []).find((r) => r.id === body.id)
      if (target === undefined) { sendJson(res, 404, { ok: false, error: '没有这条意见' }); return }
      target.status = 'revoked'
      writeMeta(meta)
      sendJson(res, 200, { ok: true, project })
      return
    }
    case 'gold-revise': {
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      if (meta === null || meta.status !== 'awaiting-gold') {
        sendJson(res, 409, { ok: false, error: '当前没有等待确认的最佳范例章' })
        return
      }
      const pending = (meta.goldOpinions ?? []).filter((o) => o.status === 'pending')
      // 本轮交办的意见转「AI 修订中」；新稿交工时再转「AI 已改」。
      pending.forEach((o) => { o.status = 'sent' })
      const archive = join(workDir(project), '_旧版产物')
      mkdirSync(archive, { recursive: true })
      const stamp = Date.now().toString(36)
      const gn = goldN(meta)
      for (const name of [`chapter-${String(gn).padStart(2, '0')}.md`, 'style-spec.md', `audit-${String(gn).padStart(2, '0')}.md`]) {
        const target = workFile(project, name)
        if (existsSync(target)) { try { renameSync(target, join(archive, `${name}.${stamp}`)) } catch { /* 尽力归档 */ } }
      }
      meta.goldRedoNote = pending.length > 0
        ? pending.map((o, i) => `#${i + 1}（${o.target === null ? '笼统' : o.target.hint || `第${o.target.para}段`}）${o.kind === 'dislike' ? '不喜欢' : o.kind === 'drop' ? '不需要' : '要改成'}${o.wish ? `：${o.wish}` : ''}`).join('；')
        : (typeof body.note === 'string' && body.note.trim() !== '' ? body.note.trim().slice(0, 500) : null)
      meta.status = 'running'
      meta.pendingStage = null
      meta.pendingGate = null
      writeMeta(meta)
      appendEvent(project, 'textbook/hint', { text: '✍️ 已把你的意见带给 AI，它正在照着修订最佳范例章，改完再请你过目。' })
      handoff(ctx, project, 'gold')
      // 演示书不唤醒主 AI（wakeMainAI 对 demo 直接跳过）：直接驱动状态机，
      // 由演示占位通道自己重生成范例章，否则永远停在「AI 修订中」。
      if (meta.demo === true) void kick(ctx, project)
      sendJson(res, 200, { ok: true, project, redoNote: meta.goldRedoNote })
      return
    }
    case 'gold-chapter-set': {
      // 对话/界面改选样例章：未定稿且未进入铺章前可改；旧样例章产物存在则先归档再重交办。
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      const pick = Number(body.chapter)
      if (!Number.isSafeInteger(pick) || pick < 1 || pick > (meta?.outline?.chapters ?? []).length) {
        sendJson(res, 400, { ok: false, error: '章号不合法' })
        return
      }
      if (meta.goldSealed != null || meta.phase >= 5) {
        sendJson(res, 409, { ok: false, error: '范例章已定稿/铺章已开始；要换样例章请先驳回重做范例章' })
        return
      }
      // 控制器裁决（F10）：gold 修订在飞（pendingStage=gold）时允许改选样例章——AI 交工后自然写新章；
      // 其余 AI 回合进行中一律拦住，避免打断它手里的活。
      if (meta.status === 'running' && meta.pendingStage !== 'gold') {
        sendJson(res, 409, { ok: false, error: 'AI 正在干活；等它交工或先暂停，再改样例章' })
        return
      }
      const gn = goldN(meta)
      meta.goldChapter = pick
      const archive = join(workDir(project), '_旧版产物')
      mkdirSync(archive, { recursive: true })
      const stamp = Date.now().toString(36)
      let archived = 0
      for (const name of [`chapter-${String(gn).padStart(2, '0')}.md`, 'style-spec.md', `audit-${String(gn).padStart(2, '0')}.md`]) {
        const target = workFile(project, name)
        if (existsSync(target)) { try { renameSync(target, join(archive, `${name}.${stamp}`)); archived += 1 } catch { /* 尽力归档 */ } }
      }
      meta.status = 'running'
      meta.pendingStage = null
      meta.pendingGate = null
      writeMeta(meta)
      appendEvent(project, 'textbook/gold-chapter', { chapter: pick, reason: String(body.reason ?? '').slice(0, 200), archived })
      appendEvent(project, 'textbook/hint', { text: `📐 样例章改为第 ${pick} 章${archived > 0 ? '（旧范例章已留档，正在重写新范例章）' : ''}。` })
      if (archived > 0 || meta.phase >= 4) handoff(ctx, project, 'gold')
      else void kick(ctx, project)
      // 演示书不唤醒主 AI（wakeMainAI 对 demo 直接跳过）：直接驱动状态机，
      // 由演示占位通道自己重生成新样例章，否则永远停在「AI 修订中」。
      if (meta.demo === true) void kick(ctx, project)
      sendJson(res, 200, { ok: true, project, goldChapter: pick })
      return
    }
    case 'gold-approve': {
      // 最佳范例章确认：true → 继续写全书；false → 删掉重写。可同时设置每章目标字数。
      assertSessionOwned(project, sessionId)
      const { approved } = body
      if (typeof approved !== 'boolean') {
        sendJson(res, 400, { ok: false, error: 'gold-approve 需要 approved: true/false' })
        return
      }
      const goldMeta = readMeta(project)
      if (goldMeta === null || goldMeta.status !== 'awaiting-gold') {
        sendJson(res, 409, { ok: false, error: '当前没有等待确认的最佳范例章' })
        return
      }
      if (typeof body.targetWords === 'number' && Number.isFinite(body.targetWords) && body.targetWords >= 500) {
        goldMeta.targetWords = Math.round(body.targetWords) // 兼容旧单值：仅作未填章的兜底
        // 意见为空时上面 approved 路径不会 writeMeta，兜底值会随 advance 重读丢失，这里先落账。
        writeMeta(goldMeta)
        appendEvent(project, 'textbook/hint', { text: '字数以每章清单为准；这个统一值只作未填章的兜底。' })
      }
      if (approved === true) {
        // 定稿沉淀：把尚未撤销的意见转成风格线（source:'gold'），并记金标准母版版本号。
        const sealOpinions = (goldMeta.goldOpinions ?? []).filter((o) => o.status !== 'revoked')
        if (sealOpinions.length > 0) {
          const sealed = []
          sealOpinions.forEach((o, i) => {
            const kindText = o.kind === 'dislike' ? '不要这种写法' : o.kind === 'drop' ? '不要这类内容' : '要照此修改'
            const entry = {
              id: `sn-gold-${Date.now().toString(36)}-${i}`,
              text: `${o.target === null ? '' : `${o.target.hint || `第${o.target.para}段`}：`}${kindText}--${o.wish}`,
              at: Date.now(), source: 'gold', status: 'active', note: `来自金标准意见#${i + 1}`,
            }
            o.status = 'applied'
            sealed.push(entry)
          })
          goldMeta.styleNotes = [...(goldMeta.styleNotes ?? []), ...sealed]
          const goldVersions = readEvents(project).filter((e) => e.type === 'textbook/agent-end' && String(e.data?.label ?? '').includes('最佳范例章')).length
          goldMeta.goldSealed = { version: Math.max(1, goldVersions), at: Date.now() }
          writeMeta(goldMeta)
          updateStyleLineMirror(project)
          appendEvent(project, 'textbook/gold-seal', { version: goldMeta.goldSealed.version, count: sealed.length })
        }
        appendEvent(project, 'textbook/hint', { text: '✅ 范例章已确认，开始写全书。' })
        advance(project, 4, 5)
        void kick(ctx, project)
      } else {
        // 归档范例章产物（rmSync 在部分盘上失效，用移动代替删除）。
        const archive = join(workDir(project), '_旧版产物')
        mkdirSync(archive, { recursive: true })
        const stamp = Date.now().toString(36)
        const gN = goldN(goldMeta)
        for (const name of [`chapter-${String(gN).padStart(2, '0')}.md`, 'style-spec.md', `audit-${String(gN).padStart(2, '0')}.md`]) {
          const target = workFile(project, name)
          if (existsSync(target)) {
            try { renameSync(target, join(archive, `${name}.${stamp}`)) } catch { /* 尽力归档 */ }
          }
        }
        // 整版重写：明确告知 AI 这不是逐条修订，是推翻重来（意见保留为方向）。
        goldMeta.goldRedoNote = '整版重写：不参考上一稿的结构与表述，按学习目标与材料全新生成；用户意见仅作为方向参考。'
        appendEvent(project, 'textbook/hint', { text: '↩️ 范例章已标记重写，AI 正在重新生成。' })
        goldMeta.status = 'running'
        goldMeta.updatedAt = Date.now()
        writeMeta(goldMeta)
        void kick(ctx, project)
      }
      sendJson(res, 200, { ok: true, project, approved })
      return
    }
  }
}
