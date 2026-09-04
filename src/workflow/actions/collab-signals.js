/**
 * 动作族模块（架构评审候选 3，2026-09-01 拆分）：actCollabSignals
 * 从 src/workflow.js 平移，接口 (ctx, req, res, action, sessionId, project, body) 不变。
 * 共享工具来自 ../engine.js。
 */
import {
  assertSessionOwned,
  WAIVER_ITEMS,
  readMeta,
  writeMeta,
  appendEvent,
  updateStyleLineMirror,
  handoff,
  sendJson,
} from '../engine.js'



/** 动作族 · 协作信号：'style-note' / 'style-note-revoke' / 'intervene' / 'intervene-done' / 'waive' / 'waive-revoke' / 'pause'。 */
export async function actCollabSignals(ctx, _req, res, action, sessionId, project, body) {
  switch (action) {
    case 'style-note': {
      assertSessionOwned(project, sessionId)
      const text = typeof body.text === 'string' ? body.text.trim().slice(0, 300) : ''
      if (text === '') { sendJson(res, 400, { ok: false, error: '请写下你的风格意见' }); return }
      const source = ['wizard', 'ui', 'chat'].includes(body.source) ? body.source : 'ui'
      const meta = readMeta(project)
      const styleNote = { id: `sn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, text, at: Date.now(), source, status: 'active' }
      meta.styleNotes = [...(meta.styleNotes ?? []), styleNote]
      meta.updatedAt = Date.now()
      writeMeta(meta)
      updateStyleLineMirror(project)
      appendEvent(project, 'textbook/style-note', { styleNote })
      sendJson(res, 200, { ok: true, project, styleNote })
      return
    }
    case 'style-note-revoke': {
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      const target = (meta.styleNotes ?? []).find((n) => n.id === body.id)
      if (target === undefined) { sendJson(res, 404, { ok: false, error: '没有这条风格意见' }); return }
      target.status = 'superseded'
      target.note = '用户收回'
      writeMeta(meta)
      updateStyleLineMirror(project)
      appendEvent(project, 'textbook/style-note', { styleNote: target, revoked: true })
      sendJson(res, 200, { ok: true, project, styleNote: target })
      return
    }
    case 'intervene': {
      assertSessionOwned(project, sessionId)
      const text = typeof body.text === 'string' ? body.text.trim().slice(0, 500) : ''
      if (text === '') { sendJson(res, 400, { ok: false, error: '请写下想留言的内容' }); return }
      const meta = readMeta(project)
      const intervention = {
        id: `iv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        at: Date.now(), text,
        target: typeof body.target === 'string' ? body.target.slice(0, 60) : undefined,
        status: 'pending',
      }
      meta.pendingInterventions = [...(meta.pendingInterventions ?? []), intervention]
      meta.updatedAt = Date.now()
      writeMeta(meta)
      appendEvent(project, 'textbook/intervention', { text: intervention.text, target: intervention.target })
      sendJson(res, 200, { ok: true, project, intervention })
      return
    }
    case 'intervene-done': {
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      const target = (meta.pendingInterventions ?? []).find((i) => i.id === body.id)
      if (target === undefined) { sendJson(res, 404, { ok: false, error: '没有这条留言' }); return }
      target.status = 'done'
      writeMeta(meta)
      appendEvent(project, 'textbook/intervention-done', { text: target.text })
      sendJson(res, 200, { ok: true, project })
      return
    }
    case 'waive': {
      assertSessionOwned(project, sessionId)
      const item = typeof body.item === 'string' ? body.item : ''
      if (WAIVER_ITEMS[item] === undefined) { sendJson(res, 400, { ok: false, error: '未知的豁免项' }); return }
      const userNote = typeof body.userNote === 'string' ? body.userNote.trim().slice(0, 300) : ''
      if (userNote === '') { sendJson(res, 400, { ok: false, error: '豁免必须手输原因（在对话里直接说明即可，由 AI 转交），这是放行的必要条件' }); return }
      const meta = readMeta(project)
      const waiver = {
        id: `wv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        item, reason: WAIVER_ITEMS[item].label, risk: WAIVER_ITEMS[item].risk, userNote,
        source: body.source === 'chat' ? 'chat' : 'ui', at: Date.now(),
      }
      meta.waivers = [...(meta.waivers ?? []), waiver]
      meta.updatedAt = Date.now()
      writeMeta(meta)
      appendEvent(project, 'textbook/waiver', { item, userNote })
      sendJson(res, 200, { ok: true, project, waiver })
      return
    }
    case 'waive-revoke': {
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      const idx = (meta.waivers ?? []).findIndex((w) => w.id === body.id)
      if (idx === -1) { sendJson(res, 404, { ok: false, error: '没有这条豁免' }); return }
      const [removed] = meta.waivers.splice(idx, 1)
      writeMeta(meta)
      appendEvent(project, 'textbook/waiver-revoke', { item: removed.item })
      sendJson(res, 200, { ok: true, project })
      return
    }
    case 'pause': {
      // 强制中断：记账 pause → 事件 → 取消主 AI（keepInbox）→ 逐个中断子代理；绝不 followup。
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      meta.pause = { at: Date.now(), reason: typeof body.reason === 'string' ? body.reason.slice(0, 200) : '用户在造书工作台点击强制中断' }
      meta.updatedAt = Date.now()
      writeMeta(meta)
      appendEvent(project, 'textbook/pause', { reason: meta.pause.reason, pendingStage: meta.pendingStage ?? null })
      try {
        ctx?.agents?.get?.(sessionId)?.cancel?.(
          { kind: 'hook', reason: meta.pause.reason },
          { keepInbox: true },
        )
      } catch (e) { ctx?.logger?.warn?.(`textbook: 暂停取消主 AI 失败: ${String(e instanceof Error ? e.message : e)}`) }
      // 子代理：中止当前回合（不 dispose、不重排队）；绝不 followup（中断即静默，恢复时 handoff 再带上下文）。
      // 注意：await 等子代理中断收敛完成后再回包（界面此时才显示「已暂停」，测试也依赖顺序）。
      try {
        const children = await ctx?.subagents?.listDescendants?.(sessionId) ?? []
        for (const child of children) {
          try { ctx.subagents.interrupt(child.childId, { kind: 'user', parentSessionId: sessionId }) }
          catch {
            try { ctx.subagents.interrupt(child.childId, { kind: 'ancestor', agent: ctx.agents.get(sessionId) }) }
            catch (e2) { ctx?.logger?.warn?.(`textbook: 中断子代理失败: ${String(e2 instanceof Error ? e2.message : e2)}`) }
          }
        }
      } catch (e) { ctx?.logger?.warn?.(`textbook: 枚举子代理失败: ${String(e instanceof Error ? e.message : e)}`) }
      sendJson(res, 200, { ok: true, project, pause: meta.pause })
      return
    }
  }
}
