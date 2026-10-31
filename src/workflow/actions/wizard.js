/**
 * 动作族模块（架构评审候选 3，2026-09-01 拆分）：actWizard
 * 共享工具来自 ../engine.js。
 *
 * ⚠️ 票 `workflow-seams/03`：interface 已收窄成**一个请求对象**
 * （`{ ctx, action, sessionId, project, body }`）并返回 `{status, json}`——
 * `_req` 与 `res` 两个传输参数都已从 interface 上消失（`res` 由 `handleAction` 那一次
 * `sendJson` 写出，落盘边界随它）。
 *
 * ⚠️ **本文件不许删、不许合、不许改名**：动作族 id ≡ 本文件名、`actWizard` 这个绑定名与
 * `./workflow/actions/wizard.js` 这个路径，都被 `test-contract-action-catalog.mjs`
 * 从**源码文本**锚定——**是承重件**。
 * ⇒ 改完之后本文件会变得**近乎空壳**——**那是承重件不是忘了删**。
 */
import {
  projectsRoot,
  projectDir,
  getParent,
} from '../engine.js'
import { familyOf, reject, accept } from '../action-runner.js'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { generateContent } from '../../content-lib.js'


/** 动作族 · 向导：'wizard-suggest'。
 *  ⚠️ 票 `pre-gold-build/02`：同族的 `suggest-roles`（上传那一刻的角色识别）整条退役——
 *  上传屏不再有「角色」这一栏，那路识别只看得到文件名；角色改由探查段开头那一趟
 *  **书级材料判定**产出（派发档 `material-survey`）。
 *  ⚠️ 这一族仍不需要 `project`（无书的动作），所以签名里**不接**它——
 *  原先写 `_project: _project` 是票 03 第 2 步留下的死绑定，与 `ActionRequest`
 *  typedef 的 `project` 对不上；用不到就别解构。 */
export const actWizard = familyOf('wizard', async ({ ctx: ctx, action: action, sessionId: sessionId, body: body }) => {
  switch (action) {
    case 'wizard-suggest': {
      // 向导建议：AI 推荐几个"造一本书"的起点，人类只做确认。
      let reply
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
        reply = accept({ suggestions: result.suggestions })
      } catch (error) {
        // LLM 不可用时给内置建议（跟随背景），不让向导卡住。
        ctx.logger.warn(`textbook: wizard-suggest LLM 失败，使用内置建议: ${String(error instanceof Error ? error.message : error)}`)
        reply = accept({
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
      return reply
    }
  }
})
