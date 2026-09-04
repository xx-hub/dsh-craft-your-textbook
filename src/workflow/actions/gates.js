/**
 * 动作族模块（架构评审候选 3，2026-09-01 拆分）：actGates
 * 从 src/workflow.js 平移，接口 (ctx, req, res, action, sessionId, project, body) 不变。
 * 共享工具来自 ../engine.js。
 */
import {
  assertSessionOwned,
  readMeta,
  writeMeta,
  appendEvent,
  writeSnapshot,
  restoreSnapshot,
  foldGate,
  workDir,
  workFile,
  gateWaiters,
  handoff,
  advance,
  kick,
  sendJson,
} from '../engine.js'
import { mkdirSync, existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'


/** 动作族 · 关卡拍板：'gate-decide' / 'explore-confirm' / 'outline-confirm' / 'chapters-review-confirm' / 'final-approve' / 'rollback'。 */
export async function actGates(ctx, _req, res, action, sessionId, project, body) {
  switch (action) {
    case 'gate-decide': {
      const { gate, version, approved, mode, reasons, note } = body
      const gateId = String(gate)
      if ((gateId === '' || gateId === 'undefined') || typeof version !== 'number' || typeof approved !== 'boolean') {
        sendJson(res, 400, { ok: false, error: 'gate-decide 需要 gate/version/approved' })
        return
      }
      assertSessionOwned(project, sessionId)
      const current = foldGate(project)
      if (current === null || current.gate !== gateId || current.version !== version) {
        sendJson(res, 409, { ok: false, error: `关卡状态不匹配（当前: ${current === null ? '无' : `${current.gate} v${current.version} ${current.status}`}）` })
        return
      }
      if (current.status !== 'awaiting') {
        sendJson(res, 409, { ok: false, error: `该关卡已 ${current.status === 'approved' ? '通过' : '驳回'}，不能重复拍板` })
        return
      }
      const event = appendEvent(project, 'textbook/gate-decision', {
        gate: gateId,
        version,
        approved,
        mode: typeof mode === 'string' ? mode : null,
        reasons: Array.isArray(reasons) ? reasons.filter((item) => typeof item === 'string') : [],
        note: typeof note === 'string' ? note : '',
      })
      const meta = readMeta(project)
      meta.updatedAt = event.time
      writeMeta(meta)
      const waiter = gateWaiters.get(project)
      if (waiter !== undefined && waiter.gate === gateId && waiter.version === version) {
        gateWaiters.delete(project)
        waiter.resolve()
      }
      void kick(ctx, project)
      sendJson(res, 200, { ok: true, project, event })
      return
    }
    case 'explore-confirm': {
      // 用户确认探查结果：true → 进设计；false → 归档重做（可带一句"哪里不满意"，重做时 AI 必看）。
      assertSessionOwned(project, sessionId)
      const exMeta = readMeta(project)
      if (exMeta === null || exMeta.status !== 'awaiting-explore') {
        sendJson(res, 409, { ok: false, error: '当前没有等待确认的探查结果' })
        return
      }
      const approved = body.approved === true
      if (approved) {
        exMeta.exploreConfirmed = true
        exMeta.status = 'running'
        exMeta.pendingStage = null
        exMeta.pendingGate = null
        delete exMeta.exploreRedoNote
        writeMeta(exMeta)
        appendEvent(project, 'textbook/hint', { text: '✅ 探查结果已确认，开始做教学设计。' })
        advance(project, 2, 3)
        void kick(ctx, project)
        sendJson(res, 200, { ok: true, project, approved: true })
      } else {
        // 用户意见（可选）：理由点选 + 一句话，随重做交办带给 AI（重做唯一的改进方向）。
        const reasons = Array.isArray(body.reasons)
          ? body.reasons.filter((r) => typeof r === 'string' && r.trim() !== '').slice(0, 5)
          : []
        const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : ''
        const feedback = [...reasons, note].filter((t) => t !== '')
        const archive = join(workDir(project), '_旧版产物')
        mkdirSync(archive, { recursive: true })
        const stamp = Date.now().toString(36)
        for (const name of ['explore.md', 'knowledge-map.json']) {
          const target = workFile(project, name)
          if (existsSync(target)) { try { renameSync(target, join(archive, `${name}.${stamp}`)) } catch { /* 尽力归档 */ } }
        }
        exMeta.status = 'running'
        exMeta.pendingStage = null
        exMeta.pendingGate = null
        exMeta.exploreRedoNote = feedback.length > 0 ? feedback.join('；') : null
        writeMeta(exMeta)
        appendEvent(project, 'textbook/hint', {
          text: feedback.length > 0
            ? `↩️ 探查结果已标记重做，你的意见（${feedback.join('；')}）已带给 AI，它正在重新探查。`
            : '↩️ 探查结果已标记重做（你没写具体意见），AI 会重新仔细通读后再来；想给它方向随时在对话里说。',
        })
        handoff(ctx, project, 'explore')
        // demo 无主 AI 可唤醒：仅 demo 补 kick 驱动重做（真实模式靠主 AI，加了反而会提前触发 runPhase 重推导）。
        if (exMeta.demo === true) void kick(ctx, project)
        sendJson(res, 200, { ok: true, project, approved: false })
      }
      return
    }
    case 'outline-confirm': {
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      if (meta === null || meta.status !== 'awaiting-outline') {
        sendJson(res, 409, { ok: false, error: '当前没有等待确认的章节安排' })
        return
      }
      const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : ''
      const pick = Number(body.goldChapter)
      if (body.approved === true && Number.isSafeInteger(pick) && pick >= 1 && pick <= (meta.outline?.chapters ?? []).length) {
        if (meta.goldChapter !== pick) {
          meta.goldChapter = pick
          appendEvent(project, 'textbook/hint', { text: `📐 样例章定为第 ${pick} 章。` })
        }
      }
      appendEvent(project, 'textbook/outline-decision', { approved: body.approved === true, note })
      if (body.approved === true) {
        meta.status = 'running'
        delete meta.outlineRedoNote
        // 驳回重排时 handoff 记过 pendingStage='outline'；拍板通过必须清掉，
        // 否则 stale 残留到 phase4/5（2026-09-03 实测：UI 误显「AI 干活中·章节骨架」）。
        meta.pendingStage = null
        meta.pendingGate = null
        writeMeta(meta)
        appendEvent(project, 'textbook/hint', { text: '✅ 章节安排已确认，开始写最佳范例章。' })
        advance(project, 3, 4)
        void kick(ctx, project)
      } else {
        const archive = join(workDir(project), '_旧版产物')
        mkdirSync(archive, { recursive: true })
        const stamp = Date.now().toString(36)
        const target = workFile(project, 'outline.md')
        if (existsSync(target)) { try { renameSync(target, join(archive, `outline.md.${stamp}`)) } catch { /* 尽力归档 */ } }
        delete meta.outline
        meta.status = 'running'
        meta.pendingStage = null
        meta.pendingGate = null
        if (note !== '') meta.outlineRedoNote = note
        writeMeta(meta)
        appendEvent(project, 'textbook/hint', {
          text: note !== ''
            ? `↩️ 章节安排已驳回，你的意见（${note}）已带给 AI，它正在重新安排。`
            : '↩️ 章节安排已驳回（没写具体意见），AI 会重新安排；想给方向随时在对话里说。',
        })
        handoff(ctx, project, 'outline')
        // demo 无主 AI 可唤醒：仅 demo 补 kick 驱动重排（真实模式靠主 AI——加了会在关卡未通过的书上
        // 提前触发 runPhase3 重新 handoff 到 gate，覆盖 pendingStage）。
        if (meta.demo === true) void kick(ctx, project)
      }
      sendJson(res, 200, { ok: true, project, approved: body.approved === true })
      return
    }
    case 'chapters-review-confirm': {
      // 全章过目确认：true → 开始合并；false → 记账 chaptersReviewed=false（可继续改意见，不会并发合并）。
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      if (meta === null || meta.status !== 'awaiting-chapters-review') {
        sendJson(res, 409, { ok: false, error: '当前没有等你过目的章节' })
        return
      }
      meta.chaptersReviewed = body.approved === true
      writeMeta(meta)
      appendEvent(project, 'textbook/chapters-review', { approved: body.approved === true })
      if (body.approved === true) {
        meta.status = 'running'
        meta.pendingStage = null
        writeMeta(meta)
        appendEvent(project, 'textbook/hint', { text: '✅ 全章过目通过，开始合并成书。' })
        handoff(ctx, project, 'merge')
        // demo 无主 AI 可唤醒：仅 demo 补 kick 让状态机自驱动合并（真实模式靠主 AI 交工推进）。
        if (meta.demo === true) void kick(ctx, project)
      }
      sendJson(res, 200, { ok: true, project })
      return
    }
    case 'final-approve': {
      // 终检结果认可（2026-08-26 用户拍板）：approved=true → 交付；false + note → 交办终检修订（原地循环）。
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      if (meta === null || meta.status !== 'awaiting-final-approval') {
        sendJson(res, 409, { ok: false, error: '当前没有等你认可的终检结果' })
        return
      }
      if (body.approved === true) {
        meta.status = 'delivered'
        meta.finalApprovedAt = Date.now()
        writeMeta(meta)
        appendEvent(project, 'textbook/final-approve', { approved: true })
        appendEvent(project, 'textbook/delivery', {
          book: 'work/book.md', checks: meta.finalChecks ?? [],
          note: `交付完成！点「下载《${meta.name ?? ''}》.md」保存成品。`,
        })
        sendJson(res, 200, { ok: true, project, delivered: true })
        return
      }
      const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : ''
      if (note === '') {
        sendJson(res, 400, { ok: false, error: '不满意终检结果必须写一句改进意见（AI 照着改整本后重新终检）' })
        return
      }
      // 原地循环：交办终检修订，AI 按意见改整本 → 重新硬检查 → 再给用户认可。
      meta.status = 'running'
      meta.pendingStage = null
      meta.finalRedoNote = note
      writeMeta(meta)
      appendEvent(project, 'textbook/final-approve', { approved: false, note })
      appendEvent(project, 'textbook/hint', { text: '🔁 终检被驳回，AI 将按你的意见修整本后重新终检。' })
      handoff(ctx, project, 'final')
      // demo 无主 AI 可唤醒：仅 demo 补 kick 驱动重新终检（真实模式靠主 AI）。
      if (meta.demo === true) void kick(ctx, project)
      sendJson(res, 200, { ok: true, project, redo: true })
      return
    }
    case 'rollback': {
      assertSessionOwned(project, sessionId)
      const { snapshot } = body
      const seq = Number(snapshot)
      if (!Number.isSafeInteger(seq) || seq < 0) {
        sendJson(res, 400, { ok: false, error: 'rollback 需要合法的 snapshot 序号' })
        return
      }
      writeSnapshot(project, `回退到快照 ${seq} 之前`)
      const event = restoreSnapshot(project, seq)
      const rbMeta = readMeta(project)
      // 回退后清掉交办标记，让状态机根据账本重新推导（文件产物保留，由验货逻辑复用）。
      delete rbMeta.pendingStage
      delete rbMeta.pendingGate
      delete rbMeta.wakeToken
      rbMeta.status = 'running'
      writeMeta(rbMeta)
      void kick(ctx, project)
      sendJson(res, 200, { ok: true, project, event })
      return
    }
  }
}
