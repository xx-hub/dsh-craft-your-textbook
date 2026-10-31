/**
 * 动作族模块（架构评审候选 3，2026-09-01 拆分）：actConvert
 * 从 src/workflow.js 平移（架构评审候选 3，2026-09-01）。
 *
 * ⚠️ 票 `workflow-seams/03`：interface 已收窄成**一个请求对象**
 * （`{ ctx, action, sessionId, project, body }`）并返回 `{status, json}`——
 * `_req` 与 `res` 两个传输参数都已从 interface 上消失（`res` 由 `handleAction` 那一次
 * `sendJson` 写出，落盘边界随它）。
 *
 * ⚠️ **本文件不许删、不许合、不许改名**：动作族 id ≡ 本文件名这一点被
 * `test-contract-action-catalog.mjs` 从**源码文本**锚定（它正则抠 `workflow.js` 的
 * `HANDLER_OF_FAMILY` 字面量表并要求 handler 绑定名匹配 `act[A-Z]\w*`）；
 * 另有 `test-context-vocabulary.mjs` 把「探查」钉在 `gates.js`、
 * `test-gate-write-points.mjs` 点名读本目录下的族文件。
 * ⇒ 改完之后本文件会变得**近乎空壳**——**那是承重件不是忘了删**。
 * 共享工具来自 ../engine.js。
 */
import {
  assertSessionOwned,
  stageLabel,
  readMeta,
  updateMeta,
  appendEvent,
  handoffAndDrive,
  kick,
  noticeMessage,
  pauseHandoverBlock,
  removeSourceFile,
  isRunning,
  // 票 `confirm-points-redesign-build/09`：站 0／1「只提示人」那一句的**唯一出口**（标签簇）。
  STATION_VALUE_EDIT_HINT,
} from '../engine.js'
import { familyOf, reject, accept } from '../action-runner.js'
import { convertedState } from '../../domain-rules.js'
// payload 字段词汇层（票 `deep-module-scan/18` 层一）。
import { textCoerced, CONVERT_TEXT_MAX } from './payload-fields.js'
import { join } from 'node:path'


/**
 * 「这一格能不能被删掉」的判据（票 `mineru-formats/03` · `CONTEXT.md`「材料缺口」）。
 *
 * 窄到只剩表态那一半，四条缺一即拒：
 *   ① 书还在**材料准备**（phase 1）——书已经往后走了，材料清单是设计基准，不许在基准上删东西；
 *   ② 请求体点名的那一格**真在这本书的材料清单里**（不是猜一个文件名来删盘上任意东西）；
 *   ③ 那一格**正是一个缺口**（`convertedState === 'failed'`）——转成过的那份删了就是丢数据，
 *      没转的那份还没轮到表态；判定一律经 `domain-rules.convertedState`（老书布尔只读归一）；
 *   ④ 文件名是**纯文件名**（判据在 engine 的 `assertPlainFileName`，删之前一定会过）。
 *
 * @returns {{ok: true, source: object} | {ok: false, status: number, error: string}}
 */
function assertRemovableSource(meta, body) {
  if (meta.phase !== 1) {
    return { ok: false, status: 409, error: '书已经不在材料准备了；材料是后面所有阶段的设计基准，不能在这一步删' }
  }
  const file = String(body.file ?? '')
  const source = (meta.sources ?? []).find((item) => item.file === file)
  if (source === undefined) {
    return { ok: false, status: 404, error: `这本书的材料清单里没有「${file}」这一份` }
  }
  if (convertedState(source) !== 'failed') {
    return { ok: false, status: 409, error: `「${file}」已经转成过了，删掉就是丢材料；只对没转成的那份开放这个动作` }
  }
  return { ok: true, source }
}


/** 动作族 · 转换与推进：'convert-start' / 'retry-convert' / 'nudge' / 'resume' / 'source-remove'。 */
export const actConvert = familyOf('convert', async ({ ctx: ctx, action: action, sessionId: sessionId, project: project, body: body }) => {
  switch (action) {
    case 'convert-start': {
      assertSessionOwned(project, sessionId)
      updateMeta(project, (meta) => { meta.status = 'running' })
      void kick(ctx, project)
      return accept({ project })
    }
    case 'retry-convert': {
      assertSessionOwned(project, sessionId)
      updateMeta(project, (meta) => { meta.status = 'running' })
      void kick(ctx, project)
      return accept({ project })
    }
    // 「删掉这份」：用户对**一份**红源表态（票 `mineru-formats/03` · ADR-0028 决策 3）。
    // 状态改法在 updateMeta 里（当场新读）；推进交给状态机自己重推——
    // 只要还有别的红源没表态，它照样停在材料准备（「逐个表态」不是「一次性放行」）。
    case 'source-remove': {
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      if (meta === null) {
        return reject(404, '项目不存在')
      }
      const verdict = assertRemovableSource(meta, body)
      if (verdict.ok === false) {
        return reject(verdict.status, verdict.error)
      }
      const file = verdict.source.file
      // 原件先落盘再改账：账上已经摘掉、盘上文件还在，是比反过来更难查的一种不一致。
      //
      // ⚠️ **删不掉 ≠ 本来就不在**（code-review ⑤）：`removeSourceFile` 以前把两者塌成同一个
      // `false`，于是 unlink 失败（占用/权限）时这里照说「原件本来就不在书夹里」并把那一格
      // 从清单摘掉 —— 文件成了没人管的孤儿，用户再也看不到、也点不到了。
      // 现在三档各自说各的：只有 `deleted`／`missing` 才改账，`failed` **不改清单**，
      // 如实告诉用户「删不掉、还在清单上、可以重试」。
      const removal = removeSourceFile(project, file)
      if (removal.outcome === 'failed') {
        // ⚠️ 原样回传 `removal.error` 会把**绝对路径**（`C:\Users\…\sources\讲义.pdf`）带进屏上——
        // `CONTEXT.md`「产物名」那条规矩：相对路径原文不上屏，机器细节同理。所以详细原因落日志，
        // 回给用户的是**他能使的下一步**。
        ctx.logger.warn(
          `textbook: 删不掉《${file}》这份原件（项目 ${project}）：${removal.error ?? '未知原因'}——那一格已保留在清单上`,
        )
        return reject(500, `《${file}》的原件现在删不掉（可能正被别的程序打开，或没有删除权限）。这一份仍留在材料清单里：关掉占用它的程序、或检查权限后，可以再点一次「删掉这份」。`)
      }
      // 回包里带上「还剩谁」：用户一份一份表过态，屏上与回包都得是当下的名单。
      const remaining = (meta.sources ?? []).filter((item) => item.file !== file)
      updateMeta(project, (state) => {
        state.sources = (state.sources ?? []).filter((item) => item.file !== file)
        // 「屏上还挂着上一轮那句批次报错」是过期的：缺口少了一个，说法要跟着变。
        // 这里**重算**而不是只删字段——用户可能一份一份删，屏上那句话必须始终是当下的份数与名单。
        const failedNow = (state.sources ?? []).filter((item) => convertedState(item) === 'failed')
        if (failedNow.length === 0) delete state.lastErrorHuman
        else state.lastErrorHuman = `还有 ${failedNow.length} 份没转成：${failedNow.map((item) => item.file).join('、')}`
        state.status = 'running'
      })
      appendEvent(project, 'textbook/hint', {
        text: `已删掉《${file}》这份材料（原件也一并删了${removal.outcome === 'missing' ? '；原件本来就不在书夹里' : ''}）`,
      })
      // ── 票 `confirm-points-redesign-build/09`：**站 1 也是「只提示人」那一档** ────────────────
      // 材料清单是**现读**的（`brief.materials`），没有可作废的产物 ⇒ 这里⛔ 不归档、⛔ 不截账本、
      // ⛔ 不清 `meta`、⛔ 不把待办指回，只**多打一句**（spec §4.5 的两处例外之一；
      // spec §3.2 站 1 的强度＝硬闸 2 条 ＋ `pointer`，⛔ 没有重做通路）。
      appendEvent(project, 'textbook/hint', { text: STATION_VALUE_EDIT_HINT })
      // kick 之后 runPhase1 自己判：还剩红源就又停在材料准备，一份不剩就推进。
      // ⚠️ 与上传那一半同一条理由：已经在跑的状态机下一轮就会重读 meta，不起第二个。
      // （「有没有在跑」这个判据经 `isRunning` 取，票 `deep-module-scan/10`——原先两处各读一次
      //  `runners.has`、含义只活在各自的注释里。）
      if (isRunning(project) === false) void kick(ctx, project)
      return accept({ project, removed: file, remaining })
    }
    case 'nudge': {
      // 催办：把用户的一句话以 notice 唤醒主 AI（不 cancel、不改账本状态）。
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      const agent = ctx.get('agents')?.get?.(meta?.session)
      if (agent === undefined) { return reject(409, '这个会话没有活着的主 AI') }
      const text = textCoerced(body.text, CONVERT_TEXT_MAX)
      // ⚠️ `reply` 让 try/catch 两条路都只赋值、末尾统一 return（票 03 第 2 步）。
      let reply
      try {
        agent.followup(noticeMessage({
          idPrefix: 'tb-nudge',
          text: `【工作台催办】${text === '' ? '用户在等你推进工作台上的活，请查 workbench_status 后继续。' : text}`,
          summary: '工作台：用户催办',
        }))
        reply = accept({})
      } catch (error) {
        reply = reject(502, `催办没送达：${String(error instanceof Error ? error.message : error)}`)
      }
      return reply
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
          // 票 `subagent-guidance/12`：§十二 的规则正文与「暂停那一刻还有几个在跑」都挂在这条通知上。
          // **只能在这里给**：触发 §十二 注入的那一行读 `meta.pause`，而下面 `updateMeta` 就把它清成
          // `null`（有意行为）；恢复后 AI 又常常不会再领一次任务说明书，brief 补不上。
          // 「那一刻的数」＝`resumeMeta.pause`（**清掉之前**读的那一份，不必去账本里捞）；
          // 正文运行时从源文取（`pauseHandoverBlock`），代码里没有第二份手抄。
          // ⚠️ 覆盖边界：只有这一条分支（有活主 AI）发通知；另两条分支（`handoffAndDrive`／`kick`）
          //    不发 ⇒ 那一支只剩指针兜底，裁决与理由见该票 `## Answer`。
          const handover = clearedPause ? pauseHandoverBlock(resumeMeta.pause) : null
          const text = [
            `【工作台继续 · ${label || '当前环节'}】`,
            '用户点了「让 AI 接着干」。请接着把当前环节做完，不要重做已完成的部分：',
            '1. 先调用 workbench_status 看真实状态（项目、阶段、待办、抽查意见）。',
            '2. 若本环节还没领过任务，调用 workbench_act（action=stage-brief）领取说明后再继续；领过就直接从中断处继续。',
            '3. 过程中用 workbench_act（action=progress）随时上报进度；完成后照常调用 stage-submit 交工。',
            '铁律：先用大白话告诉用户你要接着做什么，再动手；需要用户拍板的事绝不自作主张。',
            ...(handover === null ? [] : ['', handover]),
          ].join('\n')
          agent.followup(noticeMessage({
            idPrefix: 'tb-resume',
            text,
            summary: `工作台：用户点了「让 AI 接着干」（${label || '当前环节'}）`,
          }))
          if (!clearedPause) appendEvent(project, 'textbook/resume', {})
          // 状态改动走 updateMeta（当场新读）：上面 appendEvent 已经推进过账高，
          // 原先拿函数开头那份旧状态整份写回会把账高打回去（票 02）。
          updateMeta(project, (meta) => {
            if (clearedPause) meta.pause = null
            meta.status = 'running'
          })
          return accept({ project, woke: 'continue' })
        } catch (error) {
          ctx.logger.warn(`textbook: 继续（followup）失败，退回旧重试路径: ${String(error instanceof Error ? error.message : error)}`)
        }
      }
      if (resumeMeta.pendingStage !== null && resumeMeta.pendingStage !== undefined) {
        updateMeta(project, (meta) => {
          if (clearedPause) meta.pause = null
          meta.status = 'running'
        })
        handoffAndDrive(ctx, project, resumeMeta.pendingStage, resumeMeta.pendingGate ?? null)
        return accept({ project, woke: true })
      }
      updateMeta(project, (meta) => {
        if (clearedPause) meta.pause = null
        meta.status = 'running'
      })
      void kick(ctx, project)
      return accept({ project })
    }
  }
})
