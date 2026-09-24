/**
 * 动作族模块（架构评审候选 3，2026-09-01 拆分）：actConvert
 * 从 src/workflow.js 平移，接口 (ctx, req, res, action, sessionId, project, body) 不变。
 * 共享工具来自 ../engine.js。
 */
import {
  assertSessionOwned,
  stageLabel,
  readMeta,
  updateMeta,
  appendEvent,
  handoff,
  kick,
  sendJson,
} from '../engine.js'
import { join } from 'node:path'


/** 动作族 · 转换与推进：'convert-start' / 'retry-convert' / 'nudge' / 'resume'。 */
export async function actConvert(ctx, _req, res, action, sessionId, project, body) {
  switch (action) {
    case 'convert-start': {
      assertSessionOwned(project, sessionId)
      updateMeta(project, (meta) => { meta.status = 'running' })
      void kick(ctx, project)
      sendJson(res, 200, { ok: true, project })
      return
    }
    case 'retry-convert': {
      assertSessionOwned(project, sessionId)
      updateMeta(project, (meta) => { meta.status = 'running' })
      void kick(ctx, project)
      sendJson(res, 200, { ok: true, project })
      return
    }
    case 'nudge': {
      // 催办：把用户的一句话以 notice 唤醒主 AI（不 cancel、不改账本状态）。
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      const agent = ctx.get('agents')?.get?.(meta?.session)
      if (agent === undefined) { sendJson(res, 409, { ok: false, error: '这个会话没有活着的主 AI' }); return }
      const text = String(body.text ?? '').slice(0, 200)
      try {
        agent.followup({
          id: `tb-nudge-${Date.now().toString(36)}`,
          role: 'user',
          content: [{ type: 'text', text: `【工作台催办】${text === '' ? '用户在等你推进工作台上的活，请查 workbench_status 后继续。' : text}` }],
          source: { kind: 'plugin', plugin: 'dsh-craft-your-textbook', form: 'notice', summary: '工作台：用户催办' },
        })
        sendJson(res, 200, { ok: true })
      } catch (error) {
        sendJson(res, 502, { ok: false, error: `催办没送达：${String(error instanceof Error ? error.message : error)}` })
      }
      return
    }
    case 'resume': {
      // 重试/继续（F48，2026-08-23 语义修正）：优先像「戳一下 AI」一样，只给活的主 AI 发一条
      // 「从断点继续」的短提醒——不重发整段交办、不重做当前环节；没有活的主 AI 或发不出去时
      // 才退回旧逻辑：机器在等 AI（pendingStage）→ 重新交办唤醒；否则重新推状态机。
      assertSessionOwned(project, sessionId)
      const resumeMeta = readMeta(project)
      if (resumeMeta === null) throw new Error(`unknown project ${JSON.stringify(project)}`)
      const clearedPause = resumeMeta.pause !== null && resumeMeta.pause !== undefined
      // 「已继续」事件先落（账本那一笔），清暂停标记与置 running 交给下面的 updateMeta 改法。
      if (clearedPause) appendEvent(project, 'textbook/resume', {})
      const agent = (ctx.get('agents') ?? ctx.agents)?.get?.(resumeMeta.session)
      if (resumeMeta.demo !== true && agent !== undefined) {
        try {
          const label = stageLabel(resumeMeta.pendingStage, resumeMeta.pendingGate ?? null)
          const text = [
            `【工作台继续 · ${label || '当前环节'}】`,
            '用户点了「让 AI 接着干」。请接着把当前环节做完，不要重做已完成的部分：',
            '1. 先调用 workbench_status 看真实状态（项目、阶段、待办、抽查意见）。',
            '2. 若本环节还没领过任务，调用 workbench_act（action=stage-brief）领取说明后再继续；领过就直接从中断处继续。',
            '3. 过程中用 workbench_act（action=progress）随时上报进度；完成后照常调用 stage-submit 交工。',
            '铁律：先用大白话告诉用户你要接着做什么，再动手；需要用户拍板的事绝不自作主张。',
          ].join('\n')
          agent.followup({
            id: `tb-resume-${Date.now().toString(36)}`,
            role: 'user',
            content: [{ type: 'text', text }],
            source: { kind: 'plugin', plugin: 'dsh-craft-your-textbook', form: 'notice', summary: `工作台：用户点了「让 AI 接着干」（${label || '当前环节'}）` },
          })
          if (!clearedPause) appendEvent(project, 'textbook/resume', {})
          // 状态改动走 updateMeta（当场新读）：上面 appendEvent 已经推进过账高，
          // 原先拿函数开头那份旧状态整份写回会把账高打回去（票 02）。
          updateMeta(project, (meta) => {
            if (clearedPause) meta.pause = null
            meta.status = 'running'
          })
          sendJson(res, 200, { ok: true, project, woke: 'continue' })
          return
        } catch (error) {
          ctx.logger.warn(`textbook: 继续（followup）失败，退回旧重试路径: ${String(error instanceof Error ? error.message : error)}`)
        }
      }
      if (resumeMeta.pendingStage !== null && resumeMeta.pendingStage !== undefined) {
        updateMeta(project, (meta) => {
          if (clearedPause) meta.pause = null
          meta.status = 'running'
        })
        handoff(ctx, project, resumeMeta.pendingStage, resumeMeta.pendingGate ?? null)
        // F41（2026-08-20）：demo 无主 AI 消费 handoff，必须补 kick 驱动状态机，
        // 否则 pendingStage 非空时 resume 后卡 running（实测需再 kick 才能恢复）。
        if (resumeMeta.demo === true) void kick(ctx, project)
        sendJson(res, 200, { ok: true, project, woke: true })
        return
      }
      updateMeta(project, (meta) => {
        if (clearedPause) meta.pause = null
        meta.status = 'running'
      })
      void kick(ctx, project)
      sendJson(res, 200, { ok: true, project })
      return
    }
  }
}
