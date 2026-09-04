/**
 * 动作族模块（架构评审候选 3，2026-09-01 拆分）：actPatternsOps
 * 从 src/workflow.js 平移，接口 (ctx, req, res, action, sessionId, project, body) 不变。
 * 共享工具来自 ../engine.js。
 */
import {
  assertSessionOwned,
  PHASE_LABELS,
  projectsRoot,
  registerProject,
  sessionWorkspace,
  sanitizeFolderName,
  freeBookDir,
  readMeta,
  writeMeta,
  appendEvent,
  listProjects,
  customPatternsDir,
  listCustomPatterns,
  getParent,
  projectRuntime,
  kick,
  sendJson,
} from '../engine.js'
import { mkdirSync, writeFileSync, appendFileSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import { readSettings, writeSettings } from '../../mineru-lib.js'
import { generateContent } from '../../content-lib.js'


/** 动作族 · 模式卡·运维：'suggest-words' / 'pattern-analyze' / 'pattern-list' / 'settings' / 'demo-run' / 'debug-spawn'。 */
export async function actPatternsOps(ctx, _req, res, action, sessionId, project, body) {
  switch (action) {
    case 'suggest-words': {
      // 每章目标字数建议（AI）：根据目标/路线/章节数；分章清单来自大纲（未定章 words=null，AI 铺章时自定）。
      assertSessionOwned(project, sessionId)
      const wordsMeta = readMeta(project)
      if (wordsMeta === null) {
        sendJson(res, 404, { ok: false, error: '项目不存在' })
        return
      }
      const goal = typeof body.goal === 'string' ? body.goal : wordsMeta.goal ?? ''
      const route = body.route === 'human' ? 'human' : wordsMeta.route ?? 'blueprint'
      const science = body.science === true || wordsMeta.science === true
      const chapterCount = Number(body.chapterCount) || (wordsMeta.outline?.chapters ?? []).length || 7
      const runtime = projectRuntime(ctx, project, wordsMeta)
      const perChapter = (wordsMeta.outline?.chapters ?? []).map((chapter, index) => ({
        n: index + 1, title: chapter.title ?? '',
        words: Number.isFinite(chapter.targetWords) ? chapter.targetWords : null,
        reason: chapter.volumeReason ?? '',
      }))
      try {
        const result = await generateContent(runtime, 'words', { goal, route, science, chapterCount })
        sendJson(res, 200, { ok: true, suggestion: { ...result, perChapter } })
      } catch (error) {
        sendJson(res, 200, {
          ok: true,
          fallback: true,
          suggestion: { suggested: 6000, range: '5000-7000', reason: '（AI 建议暂不可用，使用默认值）', perChapter },
        })
      }
      return
    }
    case 'pattern-analyze': {
      // 用户粘贴一段教学/结构描述 → AI 分析成「模式卡」→ 加入本书自定义模式库
      // （第 2 关模式选型与写作规范的 brief 会带上；demo 模式给占位卡，不动旧行为）。
      assertSessionOwned(project, sessionId)
      const patternMeta = readMeta(project)
      if (patternMeta === null) {
        sendJson(res, 404, { ok: false, error: '项目不存在' })
        return
      }
      const patternText = typeof body.text === 'string' ? body.text.trim() : ''
      if (patternText === '') {
        sendJson(res, 400, { ok: false, error: '请先粘贴要分析的文本' })
        return
      }
      const patternRuntime = projectRuntime(ctx, project, patternMeta)
      let card
      try {
        const result = await generateContent(patternRuntime, 'pattern', { text: patternText })
        card = result?.card
      } catch (error) {
        ctx.logger.warn(`textbook: 模式分析失败: ${String(error instanceof Error ? error.message : error)}`)
        card = null
      }
      if (card === null || typeof card !== 'object' || typeof card.name !== 'string' || card.name.trim() === '') {
        sendJson(res, 500, { ok: false, error: 'AI 没能从这段描述里分析出有效模式，请换一段更具体的描述再试' })
        return
      }
      const patternDir = customPatternsDir(project)
      const baseName = sanitizeFolderName(card.name.trim()) || '自定义模式'
      let cardFile = `${baseName}.md`
      let cardN = 2
      while (existsSync(join(patternDir, cardFile))) { cardFile = `${baseName}-${cardN}.md`; cardN += 1 }
      const cardBody = `# ${card.name}\n\n## 解决的教学问题\n${card.problem || '（未说明）'}\n\n## 什么时候用\n${card.when || '（未说明）'}\n\n## 在章节里怎么落地\n${card.blocks || '（未说明）'}\n\n> 由用户粘贴描述、AI 分析生成（${new Date().toLocaleString('zh-CN', { hour12: false })}）\n`
      writeFileSync(join(patternDir, cardFile), cardBody, 'utf8')
      const patternIndex = join(patternDir, 'README.md')
      if (!existsSync(patternIndex)) {
        writeFileSync(patternIndex, '# 本书自定义模式库\n\n> 用户粘贴文本、AI 分析生成的模式卡；写书时与内置模式库同等对待。\n', 'utf8')
      }
      appendFileSync(patternIndex, `\n- [${card.name}](${cardFile}) — ${card.problem || ''}\n`, 'utf8')
      appendEvent(project, 'textbook/pattern-added', { name: card.name, file: cardFile })
      ctx.logger.info(`textbook: 项目 ${project} 新增自定义模式「${card.name}」（${cardFile}）`)
      sendJson(res, 200, { ok: true, card, file: cardFile })
      return
    }
    case 'pattern-list': {
      // 本书自定义模式卡清单（工作台面板展示用）。
      assertSessionOwned(project, sessionId)
      const list = listCustomPatterns(project)
      sendJson(res, 200, { ok: true, patterns: list })
      return
    }
    case 'settings': {
      // 设置：MinerU Token 等
      const { mineruToken } = body
      const settings = readSettings()
      if (typeof mineruToken === 'string') {
        const trimmed = mineruToken.trim()
        if (trimmed === '') {
          // F42（2026-08-20）：空/空白 token 不覆盖已配置值（HTTP 直发曾把真实 token 清空）。
          sendJson(res, 400, { ok: false, error: 'MinerU Token 不能为空' })
          return
        }
        settings.mineruToken = trimmed
      }
      writeSettings(settings)
      sendJson(res, 200, { ok: true, settings: { mineruTokenSet: typeof settings.mineruToken === 'string' && settings.mineruToken !== '' } })
      return
    }
    case 'demo-run': {
      // 开发/演示：创建演示书并全流程跑一遍（demo 模式，产出明确标注）
      // 会话唯一书守卫：一个会话至多一本（和 book-create 同一套约束），
      // 防止界面入口在同会话连开两本演示书。
      if (listProjects(sessionId).length > 0) {
        sendJson(res, 409, { ok: false, error: '这个会话已经有一本书了：先完成它、删除它，或者新建一个会话再开演示书' })
        return
      }
      const id = `demo-${Date.now().toString(36)}`
      // 书夹位置：优先会话的工作区目录，文件夹名用演示书名；拿不到工作区就退回默认目录（与 book-create 一致）。
      const workspace = sessionWorkspace(ctx, sessionId) ?? projectsRoot()
      const dir = freeBookDir(workspace, sanitizeFolderName('演示书（示例流程）') || id)
      mkdirSync(dir, { recursive: true })
      registerProject(id, dir)
      const meta = {
        id, name: '演示书（示例流程）', goal: '学会基础运算，能独立做对配套练习',
        route: 'blueprint', science: false, demo: true, session: sessionId,
        folder: basename(dir),
        sources: [{ file: '示例教材.pdf', role: '学生用书', converted: true }],
        phase: 2, status: 'running',
        createdAt: Date.now(), updatedAt: Date.now(), eventCount: 0,
      }
      writeMeta(meta)
      appendEvent(id, 'textbook/phase-start', { phase: 1, label: PHASE_LABELS[1] })
      appendEvent(id, 'textbook/phase-end', { phase: 1, label: PHASE_LABELS[1] })
      appendEvent(id, 'textbook/phase-start', { phase: 2, label: PHASE_LABELS[2] })
      void kick(ctx, id)
      sendJson(res, 200, { ok: true, project: id, demo: true })
      return
    }
    case 'debug-spawn': {
      // 临时调试动作：最小子代理派发，返回完整结果（验证后移除）。
      const meta = readMeta(project)
      if (meta === null) throw new Error(`unknown project ${JSON.stringify(project)}`)
      const parent = await getParent(ctx, project, meta)
      const captured = []
      const offError = ctx.on('agent/error', (info) => { captured.push(`agent/error: ${String(info?.error ?? info)}`) })
      const offRetry = ctx.on('llm/retry', (info) => { captured.push(`llm/retry: ${JSON.stringify(info).slice(0, 200)}`) })
      let result
      try {
        const run = await ctx.subagents.start('spawn', {
          label: '调试',
          prompt: [{ type: 'text', text: '请只回复两个字：收到' }],
          parent,
          signal: AbortSignal.timeout(120 * 1000),
        })
        result = await run.result
        await run.dispose()
      } finally {
        offError()
        offRetry()
      }
      sendJson(res, 200, {
        ok: true,
        stopReason: result.stopReason,
        output: result.output.map((block) => block.text ?? '').join('').slice(0, 300),
        captured,
      })
      return
    }
  }
}
