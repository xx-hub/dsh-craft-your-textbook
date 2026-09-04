/**
 * 动作族模块（架构评审候选 3，2026-09-01 拆分）：actWizard
 * 从 src/workflow.js 平移，接口 (ctx, req, res, action, sessionId, project, body) 不变。
 * 共享工具来自 ../engine.js。
 */
import {
  projectsRoot,
  projectDir,
  getParent,
  sendJson,
} from '../engine.js'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { generateContent } from '../../content-lib.js'
import { guessRoleFromName } from '../../domain-rules.js'


/** 动作族 · 向导与素材识别：'wizard-suggest' / 'suggest-roles'。 */
export async function actWizard(ctx, _req, res, action, sessionId, _project, body) {
  switch (action) {
    case 'wizard-suggest': {
      // 向导建议：AI 推荐几个"造一本书"的起点，人类只做确认。
      let hint = typeof body.hint === 'string' ? body.hint.trim() : ''
      // F21（2026-08-20）：hint 为空时读会话首条用户消息当建议依据。
      if (hint === '') {
        const sess = ctx.get('sessions')?.get?.(sessionId)
        const first = (sess?.events ?? []).find((e) => e.type === 'user/message' && e.data?.source?.kind === 'user')
        const blocks = first?.data?.content ?? []
        hint = blocks.filter((b) => b.type === 'text').map((b) => String(b.text ?? '')).join(' ').trim().slice(0, 120)
      }
      ctx.logger.info(`textbook: wizard-suggest hint=「${hint || '（空）'}」`)
      const wizardId = `wizard-${sessionId.replace(/[^a-z0-9-]/g, '-').slice(0, 40)}`
      mkdirSync(projectDir(wizardId), { recursive: true })
      const runtime = {
        ctx,
        demo: false,
        dir: projectsRoot(),
        project: { name: '选书向导' },
        getParent: () => getParent(ctx, wizardId, { demo: false }),
      }
      try {
        const result = await generateContent(runtime, 'wizard', { hint })
        sendJson(res, 200, { ok: true, suggestions: result.suggestions })
      } catch (error) {
        // LLM 不可用时给内置建议（跟随背景），不让向导卡住。
        ctx.logger.warn(`textbook: wizard-suggest LLM 失败，使用内置建议: ${String(error instanceof Error ? error.message : error)}`)
        sendJson(res, 200, {
          ok: true,
          fallback: true,
          suggestions: hint === ''
            ? [
                { name: '初中数学·有理数', goal: '学完能独立做对教材配套的基础题，并说出每个概念是什么、为什么、怎么用', science: true },
                { name: '小学英语·自然拼读', goal: '看到陌生单词能试读出来，听写常见单词不再怕', science: false },
                { name: '高中物理·力学入门', goal: '能用受力分析解典型题，看懂"为什么物体会动"', science: true },
              ]
            : [
                { name: `围绕「${hint.slice(0, 12)}」的入门书`, goal: '学完能独立完成对应基础练习，并说出每个概念是什么、为什么、怎么用', science: false },
                { name: `${hint.slice(0, 12)}：从例子到规律`, goal: '能用自己的话讲清楚知识点的来龙去脉，做对配套练习', science: false },
                { name: `${hint.slice(0, 12)}：查漏补缺版`, goal: '找出最薄弱的两三处并逐一攻克，配套练习正确率达到九成', science: false },
              ],
        })
      }
      return
    }
    case 'suggest-roles': {
      // 上传时 AI 识别每本 PDF 的角色，人类只确认；AI 失败按文件名规则兜底。
      const files = Array.isArray(body.files)
        ? body.files.filter((f) => typeof f === 'string' && f.trim() !== '').slice(0, 20)
        : []
      if (files.length === 0) {
        sendJson(res, 400, { ok: false, error: '没有可识别的文件' })
        return
      }
      const wizardId = `wizard-${sessionId.replace(/[^a-z0-9-]/g, '-').slice(0, 40)}`
      mkdirSync(projectDir(wizardId), { recursive: true })
      const runtime = {
        ctx,
        demo: false,
        dir: projectsRoot(),
        project: { name: '材料识别' },
        getParent: () => getParent(ctx, wizardId, { demo: false }),
      }
      try {
        const result = await generateContent(runtime, 'roles', { files })
        sendJson(res, 200, { ok: true, roles: result.roles })
      } catch (error) {
        ctx.logger.warn(`textbook: suggest-roles LLM 失败，使用文件名规则: ${String(error instanceof Error ? error.message : error)}`)
        sendJson(res, 200, {
          ok: true,
          fallback: true,
          roles: files.map((file) => ({ file, role: guessRoleFromName(file) })),
        })
      }
      return
    }
  }
}
