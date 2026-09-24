/**
 * 动作族模块（架构评审候选 3，2026-09-01 拆分）：actCollabSignals
 * 从 src/workflow.js 平移，接口 (ctx, req, res, action, sessionId, project, body) 不变。
 * 共享工具来自 ../engine.js。
 */
import {
  assertSessionOwned,
  WAIVER_ITEMS,
  updateMeta,
  appendEvent,
  updateStyleLineMirror,
  sendJson,
} from '../engine.js'


/** 「按下暂停时还有几个小助手在跑」——**只数个数**，不碰它们（本票的载体只要那个数）。
 *
 *  形状取自随代码入库的契约快照 `docs/reference/dsh-subagent-contracts.md`：子代理条目的字段是
 *  **`id`**（宿主**没有** `childId` 这个字段），活性位是 `activity`——`'running'` 表示这条子会话的
 *  记录还在会话库里活着（驻留的也算，服务端能拿到的就是这个口径），`'inactive'` 表示只剩磁盘上的记录。
 *
 *  数不出来时返回 `null`（「不知道」，不是 0）：老宿主没有这个方法、宿主没挂投影注册表都会抛
 *  （`SubagentError`）。这一层 try/catch **是会执行的**守卫——暂停本身不许因为一条附注而失败，
 *  这与本票删掉的那两层「永不执行」的 try/catch 不是一回事。
 *
 *  @returns {Promise<number|null>} 在跑的小助手个数；数不出来时 null
 */
async function countRunningSubagents(ctx, sessionId) {
  try {
    const children = await ctx?.subagents?.listDescendants?.(sessionId) ?? []
    return children.filter((child) => child?.activity === 'running').length
  } catch (e) {
    ctx?.logger?.warn?.(`textbook: 暂停时没数出小助手个数（记 null 不记 0）: ${String(e instanceof Error ? e.message : e)}`)
    return null
  }
}


/** 动作族 · 协作信号：'style-note' / 'style-note-revoke' / 'intervene' / 'intervene-done' / 'waive' / 'waive-revoke' / 'pause'。
 *  状态改动一律走 updateMeta 的改法（当场新读）：本族原先清一色「读状态 → 改 → 整份写回 → 再记一笔」，
 *  写回时会把账高带回读状态那一刻的旧值（票 02）。 */
export async function actCollabSignals(ctx, _req, res, action, sessionId, project, body) {
  switch (action) {
    case 'style-note': {
      assertSessionOwned(project, sessionId)
      const text = typeof body.text === 'string' ? body.text.trim().slice(0, 300) : ''
      if (text === '') { sendJson(res, 400, { ok: false, error: '请写下你的风格意见' }); return }
      const source = ['wizard', 'ui', 'chat'].includes(body.source) ? body.source : 'ui'
      const styleNote = { id: `sn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, text, at: Date.now(), source, status: 'active' }
      updateMeta(project, (meta) => { meta.styleNotes = [...(meta.styleNotes ?? []), styleNote] })
      updateStyleLineMirror(project)
      appendEvent(project, 'textbook/style-note', { styleNote })
      sendJson(res, 200, { ok: true, project, styleNote })
      return
    }
    case 'style-note-revoke': {
      assertSessionOwned(project, sessionId)
      let target
      updateMeta(project, (meta) => {
        target = (meta.styleNotes ?? []).find((n) => n.id === body.id)
        if (target === undefined) return
        target.status = 'superseded'
        target.note = '用户收回'
      })
      if (target === undefined) { sendJson(res, 404, { ok: false, error: '没有这条风格意见' }); return }
      updateStyleLineMirror(project)
      appendEvent(project, 'textbook/style-note', { styleNote: target, revoked: true })
      sendJson(res, 200, { ok: true, project, styleNote: target })
      return
    }
    case 'intervene': {
      assertSessionOwned(project, sessionId)
      const text = typeof body.text === 'string' ? body.text.trim().slice(0, 500) : ''
      if (text === '') { sendJson(res, 400, { ok: false, error: '请写下想留言的内容' }); return }
      const intervention = {
        id: `iv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        at: Date.now(), text,
        target: typeof body.target === 'string' ? body.target.slice(0, 60) : undefined,
        status: 'pending',
      }
      updateMeta(project, (meta) => { meta.pendingInterventions = [...(meta.pendingInterventions ?? []), intervention] })
      appendEvent(project, 'textbook/intervention', { text: intervention.text, target: intervention.target })
      sendJson(res, 200, { ok: true, project, intervention })
      return
    }
    case 'intervene-done': {
      assertSessionOwned(project, sessionId)
      let target
      updateMeta(project, (meta) => {
        target = (meta.pendingInterventions ?? []).find((i) => i.id === body.id)
        if (target === undefined) return
        target.status = 'done'
      })
      if (target === undefined) { sendJson(res, 404, { ok: false, error: '没有这条留言' }); return }
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
      const waiver = {
        id: `wv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        item, reason: WAIVER_ITEMS[item].label, risk: WAIVER_ITEMS[item].risk, userNote,
        source: body.source === 'chat' ? 'chat' : 'ui', at: Date.now(),
      }
      updateMeta(project, (meta) => { meta.waivers = [...(meta.waivers ?? []), waiver] })
      appendEvent(project, 'textbook/waiver', { item, userNote })
      sendJson(res, 200, { ok: true, project, waiver })
      return
    }
    case 'waive-revoke': {
      assertSessionOwned(project, sessionId)
      let removed
      updateMeta(project, (meta) => {
        const idx = (meta.waivers ?? []).findIndex((w) => w.id === body.id)
        if (idx === -1) return
        ;[removed] = meta.waivers.splice(idx, 1)
      })
      if (removed === undefined) { sendJson(res, 404, { ok: false, error: '没有这条豁免' }); return }
      appendEvent(project, 'textbook/waiver-revoke', { item: removed.item })
      sendJson(res, 200, { ok: true, project })
      return
    }
    case 'pause': {
      // 强制中断：记账 pause → 事件 → 取消主 AI（keepInbox）；绝不 followup。
      // **不碰小助手**（票 dsh-contract-drift/01）：收回小助手是主笔 AI 自己的事，工作台只喊主 AI。
      // 口径：**「已暂停」说的是主 AI，不是整条流水线**——小助手会把手上那段跑完、可能还在往书里写。
      // （本条待人的规矩在 `.scratch/subagent-guidance/issues/08`，不在这里。）
      assertSessionOwned(project, sessionId)
      // 「按下暂停时还有几个小助手在跑」——**只记那个数**，不记名字/编号（主笔 AI 自己有 list_agents）。
      // 这一刻先数（取消主 AI 不影响小助手，但事实说的是「按下暂停时」）。
      const subagentsRunning = await countRunningSubagents(ctx, sessionId)
      const meta = updateMeta(project, (state) => {
        state.pause = {
          at: Date.now(),
          reason: typeof body.reason === 'string' ? body.reason.slice(0, 200) : '用户在造书工作台点击强制中断',
          subagentsRunning,
        }
      })
      appendEvent(project, 'textbook/pause', {
        reason: meta.pause.reason,
        pendingStage: meta.pendingStage ?? null,
        subagentsRunning,
      })
      try {
        ctx?.agents?.get?.(sessionId)?.cancel?.(
          { kind: 'hook', reason: meta.pause.reason },
          { keepInbox: true },
        )
      } catch (e) { ctx?.logger?.warn?.(`textbook: 暂停取消主 AI 失败: ${String(e instanceof Error ? e.message : e)}`) }
      sendJson(res, 200, { ok: true, project, pause: meta.pause })
      return
    }
  }
}
