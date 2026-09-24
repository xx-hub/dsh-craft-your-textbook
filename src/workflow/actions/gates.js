/**
 * 动作族模块（架构评审候选 3，2026-09-01 拆分）：actGates
 * 从 src/workflow.js 平移，接口 (ctx, req, res, action, sessionId, project, body) 不变。
 * 共享工具来自 ../engine.js。
 */
import {
  assertSessionOwned,
  readMeta,
  updateMeta,
  appendEvent,
  writeSnapshot,
  restoreSnapshot,
  foldGate,
  workDir,
  workFile,
  chapterGateMiss,
  gateWaiters,
  handoff,
  advance,
  kick,
  sendJson,
} from '../engine.js'
import { mkdirSync, existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'


/**
 * 拍板动作的两条校验报错（错误条 / 回给主 AI 的话都算界面词，判定线①③；界面不叫「关卡」）。
 * 导出以便用词不变量断言直调**真实报错文本**（票 01），不在测试里复制文案。
 */

/** 提案对不上号（gate/version 不匹配，或压根没有待拍板的提案）。 */
export function gateMismatchError(current) {
  return `拍板状态不匹配（当前: ${current === null ? '无' : `${current.gate} v${current.version} ${current.status}`}）`
}

/** 该次拍板已经拍过了（不能重复拍板）。 */
export function gateAlreadyDecidedError(current) {
  return `第 ${current.gate} 次拍板已${current.status === 'approved' ? '通过' : '驳回'}，不能重复拍板`
}


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
        sendJson(res, 409, { ok: false, error: gateMismatchError(current) })
        return
      }
      if (current.status !== 'awaiting') {
        sendJson(res, 409, { ok: false, error: gateAlreadyDecidedError(current) })
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
      // 原先这里还「读状态 → meta.updatedAt = event.time → 整份写回」：那个写回纯属多余
      // （appendEvent 已经把 updatedAt 记成 event.time），却会把账高带回读状态那一刻的旧值（票 02）。已删。
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
        updateMeta(project, (meta) => {
          meta.exploreConfirmed = true
          meta.status = 'running'
          meta.pendingStage = null
          meta.pendingGate = null
          delete meta.exploreRedoNote
        })
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
        updateMeta(project, (meta) => {
          meta.status = 'running'
          meta.pendingStage = null
          meta.pendingGate = null
          meta.exploreRedoNote = feedback.length > 0 ? feedback.join('；') : null
        })
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
      // 改选最佳范例章也要改在改法里（当场新读那份状态）：下面两笔事件之间原先夹着一次整份写回，
      // 会把账高带回读状态那一刻的旧值（票 02）。
      let pickedGold = false
      updateMeta(project, (state) => {
        if (body.approved === true && Number.isSafeInteger(pick) && pick >= 1 && pick <= (state.outline?.chapters ?? []).length) {
          if (state.goldChapter !== pick) {
            state.goldChapter = pick
            pickedGold = true
          }
        }
        if (body.approved === true) {
          state.status = 'running'
          delete state.outlineRedoNote
          // 驳回重排时 handoff 记过 pendingStage='outline'；拍板通过必须清掉，
          // 否则 stale 残留到 phase4/5（2026-09-03 实测：UI 误显「AI 干活中·章节骨架」）。
          state.pendingStage = null
          state.pendingGate = null
        } else {
          delete state.outline
          state.status = 'running'
          state.pendingStage = null
          state.pendingGate = null
          if (note !== '') state.outlineRedoNote = note
        }
      })
      if (pickedGold) {
        // 票 10（判定一 #3/#4）：「样例章」是界面词表外的叫法，这条 hint 会渲染到人眼，统一成「最佳范例章」。
        appendEvent(project, 'textbook/hint', { text: `📐 最佳范例章定为第 ${pick} 章。` })
      }
      appendEvent(project, 'textbook/outline-decision', { approved: body.approved === true, note })
      if (body.approved === true) {
        appendEvent(project, 'textbook/hint', { text: '✅ 章节安排已确认，开始写最佳范例章。' })
        advance(project, 3, 4)
        void kick(ctx, project)
      } else {
        const archive = join(workDir(project), '_旧版产物')
        mkdirSync(archive, { recursive: true })
        const stamp = Date.now().toString(36)
        const target = workFile(project, 'outline.md')
        if (existsSync(target)) { try { renameSync(target, join(archive, `outline.md.${stamp}`)) } catch { /* 尽力归档 */ } }
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
      // 票 10 的服务端收口（死条件收口 · 票 14 的连带）：**确认过目时重验全书 chapterDone**。
      // 原先这里只看 status，于是「用户点翻案（review-revoke 把意见写回 pending）」之后书仍停在
      // awaiting-chapters-review，能直接确认 → 合并 → 交付——票 10「退回去之后这本书重新被这条意见拦住」
      // 就成了空话（真旁路）。判据复用 engine 的同一份 chapterDone / chapterGateMiss，**不写第二份**。
      if (body.approved === true) {
        const chapters = meta.outline?.chapters ?? []
        const misses = chapters
          .map((chapter, index) => ({ n: index + 1, chapter, miss: chapterGateMiss(project, index + 1, meta) }))
          .filter((row) => row.miss !== null)
        if (misses.length > 0) {
          const why = misses.slice(0, 3).map((row) => {
            const title = row.chapter?.title ?? ''
            const pad = String(row.n).padStart(2, '0')
            const what = row.miss.reason === 'artifact'
              ? `缺产物（work/chapter-${pad}.md / work/audit-${pad}.md）`
              : row.miss.reason === 'review'
                ? '还有未处置的抽查意见'
                : '没有机器记下的交工通过（还没按章交工）'
            return `第${row.n}章${title === '' ? '' : `《${title}》`}：${what}`
          })
          sendJson(res, 409, {
            ok: false,
            error: `还没到能交工的时候：${why.join('；')}。逐章处置完（改稿 → 重新审计 → 交工点名）机器才会放行过目。`,
          })
          return
        }
      }
      // 过目记账与「开始合并」的置态一次收进改法（原先分两次整份写回，后一次还落在
      // 「记一笔」之后——账高会被带回旧值，票 02）。
      const after = updateMeta(project, (state) => {
        state.chaptersReviewed = body.approved === true
        if (body.approved === true) {
          state.status = 'running'
          state.pendingStage = null
        }
      })
      appendEvent(project, 'textbook/chapters-review', { approved: body.approved === true })
      if (body.approved === true) {
        appendEvent(project, 'textbook/hint', { text: '✅ 全章过目通过，开始合并成书。' })
        handoff(ctx, project, 'merge')
        // demo 无主 AI 可唤醒：仅 demo 补 kick 让状态机自驱动合并（真实模式靠主 AI 交工推进）。
        if (after.demo === true) void kick(ctx, project)
      }
      sendJson(res, 200, { ok: true, project })
      return
    }
    case 'final-approve': {
      // 终检结果认可（2026-08-26 用户拍板）：approved=true → 交付；false + note → 交办终检修订（原地循环）。
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      if (meta === null || meta.status !== 'awaiting-final-approval') {
        sendJson(res, 409, { ok: false, error: '当前没有等你认可的最后检查结果' })
        return
      }
      if (body.approved === true) {
        const delivered = updateMeta(project, (state) => {
          state.status = 'delivered'
          state.finalApprovedAt = Date.now()
        })
        appendEvent(project, 'textbook/final-approve', { approved: true })
        appendEvent(project, 'textbook/delivery', {
          book: 'work/book.md', checks: delivered.finalChecks ?? [],
          note: `交付完成！点「下载《${delivered.name ?? ''}》.md」保存成品。`,
        })
        sendJson(res, 200, { ok: true, project, delivered: true })
        return
      }
      const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : ''
      if (note === '') {
        sendJson(res, 400, { ok: false, error: '不满意最后检查结果必须写一句改进意见（AI 照着改整本后重新做最后检查）' })
        return
      }
      // 原地循环：交办终检修订，AI 按意见改整本 → 重新硬检查 → 再给用户认可。
      updateMeta(project, (state) => {
        state.status = 'running'
        state.pendingStage = null
        state.finalRedoNote = note
      })
      appendEvent(project, 'textbook/final-approve', { approved: false, note })
      appendEvent(project, 'textbook/hint', { text: '🔁 最后检查未获认可，AI 将按你的意见修整本后重新做最后检查。' })
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
      // 回退后清掉交办标记，让状态机根据账本重新推导（文件产物保留，由验货逻辑复用）。
      // 注意走 updateMeta：账本刚被 rollbackLedger 截短、账高已回到笔数，这里不许再整份写回。
      updateMeta(project, (meta) => {
        delete meta.pendingStage
        delete meta.pendingGate
        delete meta.wakeToken
        meta.status = 'running'
      })
      void kick(ctx, project)
      sendJson(res, 200, { ok: true, project, event })
      return
    }
  }
}
