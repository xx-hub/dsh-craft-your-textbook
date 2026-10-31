/**
 * 动作族模块（架构评审候选 3，2026-09-01 拆分）：actPatternsOps
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
  PHASE_LABELS,
  projectsRoot,
  registerProject,
  sessionWorkspace,
  sanitizeFolderName,
  freeBookDir,
  readMeta,
  updateMeta,
  createMeta,
  appendEvent,
  listProjects,
  customPatternsDir,
  listCustomPatterns,
  getParent,
  projectRuntime,
  workFile,
  goldN,
  kick,
  // 票 `demo-channel-full/10`：演示书建档时注进它自带的那几条协作信号（一条示例留言 ＋ 三条示例风格线）。
  seedDemoCollabSignals,
} from '../engine.js'
import { familyOf, reject, accept } from '../action-runner.js'
// 票 `demo-channel-full/05`：演示书那一份「应当有什么」（清单）与「实际有什么」（登记）
// ——两件都走**生产那一条实现**，⛔ 不手写 JSON（`book-create` 那边也是这两件）。
import { refreshArtifactRegistry, writeArtifactManifest } from '../book-shape.js'
import { mkdirSync, writeFileSync, appendFileSync, existsSync, readFileSync } from 'node:fs'
import { join, basename } from 'node:path'
import { readSettings, writeSettings, mineruTokenStatus } from '../../mineru-lib.js'
import { generateContent } from '../../content-lib.js'
import { countHanzi, chapterName } from '../../domain-rules.js'


/** 动作族 · 模式卡·运维：'suggest-words' / 'pattern-analyze' / 'pattern-list' / 'settings' / 'demo-run' / 'debug-spawn'。 */
export const actPatternsOps = familyOf('patterns-ops', async ({ ctx: ctx, action: action, sessionId: sessionId, project: project, body: body }) => {
  switch (action) {
    case 'suggest-words': {
      // ⚠️ `reply` 让 try/catch 两条路都只赋值、末尾统一 return（票 03 第 2 步）。
      let reply
      // 逐章目标建议（AI）：把范例章盘上实测与现有逐章目标一并喂给小助手；
      // 返回只供界面预填，落盘必须另走 gold-target-words-set。
      assertSessionOwned(project, sessionId)
      const wordsMeta = readMeta(project)
      if (wordsMeta === null) {
        return reject(404, '项目不存在')
      }
      const goal = typeof body.goal === 'string' ? body.goal : wordsMeta.goal ?? ''
      const route = body.route === 'human' ? 'human' : wordsMeta.route ?? 'blueprint'
      const science = body.science === true || wordsMeta.science === true
      const chapters = wordsMeta.outline?.chapters ?? []
      const chapterCount = chapters.length > 0 ? chapters.length : (Number(body.chapterCount) || 7)
      const runtime = projectRuntime(ctx, project, wordsMeta)
      const currentTargets = chapters.map((chapter, index) => ({
        n: index + 1,
        title: chapter.title ?? '',
        targetWords: Number.isFinite(chapter.targetWords) ? chapter.targetWords : null,
        reason: chapter.volumeReason ?? '',
      }))
      const goldChapter = goldN(wordsMeta)
      let goldMeasuredHanzi = null
      try {
        // ⚠️ 要**基名**：`workFile` 自己拼 `工作区/`，喂相对路径会读成 `工作区/工作区/chapter-NN.md`。
        // （与 `src/workflow.js` 那份读范例章实测汉字数的是同一件事的两份拷贝。）
        const goldPath = workFile(project, chapterName(goldChapter))
        if (existsSync(goldPath)) goldMeasuredHanzi = countHanzi(readFileSync(goldPath, 'utf8'))
      } catch { /* 正文尚未生成时不编实测值 */ }

      const toResponsePerChapter = (resultPerChapter) => {
        const byChapter = new Map(
          (Array.isArray(resultPerChapter) ? resultPerChapter : []).map((item) => [Number(item?.n), item]),
        )
        return currentTargets.map((chapter) => {
          const suggested = byChapter.get(chapter.n)
          const words = Number(suggested?.targetWords)
          return {
            ...chapter,
            words: Number.isFinite(words) && words >= 500 && words <= 50000
              ? Math.round(words)
              : chapter.targetWords,
            reason: typeof suggested?.reason === 'string' ? suggested.reason : chapter.reason,
          }
        })
      }

      try {
        const result = await generateContent(runtime, 'words', {
          goal,
          route,
          science,
          chapterCount,
          goldChapter,
          goldMeasuredHanzi,
          currentTargets,
        })
        reply = accept({
          suggestion: { ...result, perChapter: toResponsePerChapter(result.perChapter) },
        })
      } catch (error) {
        reply = accept({
          fallback: true,
          suggestion: {
            suggested: 6000,
            range: '5000-7000',
            reason: '（AI 建议暂不可用，保留现有逐章目标）',
            perChapter: toResponsePerChapter(null),
          },
        })
      }
      return reply
    }
    case 'pattern-analyze': {
      // 用户粘贴一段教学/结构描述 → AI 分析成「模式卡」→ 加入本书自定义模式库
      // （第 2 关模式选型与写作规范的 brief 会带上；demo 模式给占位卡，不动旧行为）。
      assertSessionOwned(project, sessionId)
      const patternMeta = readMeta(project)
      if (patternMeta === null) {
        return reject(404, '项目不存在')
      }
      const patternText = typeof body.text === 'string' ? body.text.trim() : ''
      if (patternText === '') {
        return reject(400, '请先粘贴要分析的文本')
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
        return reject(500, 'AI 没能从这段描述里分析出有效模式，请换一段更具体的描述再试')
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
      return accept({ card, file: cardFile })
    }
    case 'pattern-list': {
      // 本书自定义模式卡清单（工作台面板展示用）。
      assertSessionOwned(project, sessionId)
      const list = listCustomPatterns(project)
      return accept({ patterns: list })
    }
    case 'settings': {
      // 设置：MinerU Token 等
      const { mineruToken } = body
      const settings = readSettings()
      if (typeof mineruToken === 'string') {
        const trimmed = mineruToken.trim()
        if (trimmed === '') {
          // F42（2026-08-20）：空/空白 token 不覆盖已配置值（HTTP 直发曾把真实 token 清空）。
          return reject(400, 'MinerU Token 不能为空')
        }
        settings.mineruToken = trimmed
      }
      writeSettings(settings)
      // 票 `token-banner/01`：回包与 GET 用**同一份判据**（`mineruTokenStatus`），并把来源与
      // 脱敏值一起交给界面——保存后不刷新页面也要立刻知道「现在用的是设置」。
      // ⚠️ 明文 Token 只进 settings.json（0600），⛔ 不进回包、不进日志、不进事件流。
      const token = mineruTokenStatus()
      return accept({
        settings: {
          mineruTokenSet: token.configured,
          mineruTokenSource: token.source,
          mineruTokenMasked: token.masked,
        },
      })
    }
    case 'demo-run': {
      // ── 阶段一（材料准备）在演示书里**为什么不真做**（票 `demo-flow-fidelity` 的 01 Q4，
      //    2026-10-07 裁决：**维持**下面这个「伪造已完成态」的做法）────────────────────────────
      // ① 演示书的源是一条**占位**（`sources` 只有 `{file:'示例教材.pdf', …}` 这一项，
      //    见下面 `createMeta`），盘上压根没有 `sources/` 目录，也没有任何可转换的真文件。
      // ② 真跑一次转换要 MinerU Token、要时间，还要处理失败态与重试——这与演示入口的语义
      //    （不花模型额度、几步走完给人看流程）正面冲突。
      // ③ 所以阶段一在演示书里是「已完成」的**展示态**，不是「没做」：`phase-start(1)` ＋
      //    `phase-end(1)` 两条事件让阶段片显示为已完成，用户点开阶段片仍能看到材料行与那张已完成卡。
      //    这条豁免登记在 `src/demo-exemptions.js` 的 `phase1-no-real-conversion`
      //    （声明面只是登记，不放行任何东西）。
      //
      // ── 两个模式（票 `demo-channel-full/02`）──────────────────────────────────────────
      // **本票之前**这里建完书就写满三条事件、`phase: 2`、直接 `kick` ⇒ 用户点「先建一本演示书
      // 试试」**永远看不到材料准备那一屏**（`dev/gallery/README.md` 的「已知缺口」第 1 条就是它）。
      // 现在拆成两个模式，**共用同一个守卫**（一个会话至多一本书）：
      //   · **不带参数**（默认）＝**建书并停在阶段一**：只写 `phase-start(1)`，`phase: 1`／`status: 'active'`，
      //     ⛔ 不 `kick`——那一屏就是给用户看的（`src/ui/event-cards.js` 的 `UploadArea` 在演示书 ＋
      //     阶段一上多一颗「▶ 开始演示」）。
      //   · **`mode: 'next'`** ＝**继续**：把**本会话那本停在阶段一的演示书**推进到阶段二
      //     （补 `phase-end(1)` ＋ `phase-start(2)`、置 `phase: 2, status: 'running'`、`kick`）。
      //     前置不成立时 409，并**说清是哪一条**（没有书／不是演示书／已经过了阶段一）。
      // ⛔ 不加第三个模式：要停的只有阶段一这一处；⛔ 也不另开一个动作——`demo-run` 已在冻结契约表里
      //   （`src/contract-actions.js` 的 `['demo-run', 'patterns-ops', 'no-book', …]`），另开动作会动那份
      //   计数与三处散文，而语义仍是同一件事（**开演示书 / 让它往下走**）。
      const demoMode = body?.mode === 'next' ? 'next' : 'create'

      if (demoMode === 'next') {
        // 继续：只认「本会话那本停在阶段一的演示书」。⛔ 不碰别的书——那不是「继续」，是别的事。
        // ⚠️ `listProjects()` 回的是**meta 对象**（不是 id；见 `engine.js` 那个函数的注释），
        // 所以这里直接读它，⛔ 别拿它当 id 再 `readMeta` 一次（那会把整份 meta 当 id 传下去）。
        const heldMeta = listProjects(sessionId).find((meta) => meta !== null && meta.demo === true)
        if (heldMeta === undefined) {
          return reject(409, '这个会话里没有停在阶段一的演示书可以继续：先建一本演示书（或者它已经往下跑了）')
        }
        const heldId = heldMeta.id
        if (heldMeta.phase !== 1) {
          return reject(409, `这本演示书已经过了阶段一（现在在阶段 ${heldMeta.phase}）——「继续」只在材料准备那一屏有意义`)
        }
        appendEvent(heldId, 'textbook/phase-end', { phase: 1, label: PHASE_LABELS[1] })
        appendEvent(heldId, 'textbook/phase-start', { phase: 2, label: PHASE_LABELS[2] })
        updateMeta(heldId, (state) => {
          state.phase = 2
          state.status = 'running'
        })
        void kick(ctx, heldId)
        return accept({ project: heldId, demo: true, continued: true })
      }

      // 建书：会话唯一书守卫（一个会话至多一本，和 book-create 同一套约束），
      // 防止界面入口在同会话连开两本演示书。
      if (listProjects(sessionId).length > 0) {
        return reject(409, '这个会话已经有一本书了：先完成它、删除它，或者新建一个会话再开演示书')
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
        sources: [{ file: '示例教材.pdf', role: '学生用书', converted: 'ok' }],
        // 停在阶段一（展示态）：`status: 'active'` 与 `book-create` 建出来的新书同一档，
        // 于是这一屏走的是**同一个** `focusCardKey`（`phase === 1` ⇒ `upload` 卡）。
        phase: 1, status: 'active',
        createdAt: Date.now(), updatedAt: Date.now(), eventCount: 0,
      }
      createMeta(meta)
      // ── 票 `demo-channel-full/10`：演示书自带的那几条**协作信号**（一条示例留言 ＋ 三条示例风格线）──
      // 在**建档那一刻**注入 ⇒ 顶栏那两颗键（`📮 留言(N)`／`🎨 风格线(N)`，只在有数据时渲染）从**第一帧**
      // 起就在，用户不用等到铺章才看得见这一族；它们由演示支的终检那一趟按真书契约处置（销号 ＋ 逐条交代去向）。
      // ⚠️ 注入是**幂等**的（只补缺的 id）；风格线镜像 `工作区/style-line.md` 由生产那一份现推（⛔ 不手写）。
      // ⚠️ 失败一律吞：派生件写不进去不等于建书失败（与上面那两件同一条口径）。
      try { seedDemoCollabSignals(id) } catch { /* 派生件写不进去不等于建书失败 */ }
      // ── 票 `demo-channel-full/05`：演示书也要有「应当有什么」那一份 ─────────────────────────
      // 与 `book-create` **同一处两件**（`writeArtifactManifest` ＋ `refreshArtifactRegistry`）：
      // 在此之前演示书**没有** `工作区/产物清单.json` ⇒ `/textbook/process` 的 `shape` 恒 `null`
      // ⇒ 「这本书缺了哪几件产物」在演示通道里既没有数据、也没有出口（票面「病」那一节）。
      // ⚠️ 清单是**静态件**（建档时探形状写一次），登记是**派生件**（每次动作后由
      // `workflow.js` 的动作漏斗重扫）——所以这里只负责把两份都建起来，⛔ 不在这里逐件补行。
      // 失败一律吞：形状件是派生的，写不进去不等于建书失败（与 `books.js` 同一条口径）。
      try {
        writeArtifactManifest(id, meta)
        refreshArtifactRegistry(id)
      } catch { /* 形状件是派生的，写不进去不等于建书失败 */ }
      appendEvent(id, 'textbook/phase-start', { phase: 1, label: PHASE_LABELS[1] })
      return accept({ project: id, demo: true, heldAtPhase1: true })
    }
    case 'debug-spawn': {
      // 临时调试动作：最小子代理派发，返回完整结果（验证后移除）。
      //
      // ⚠️ 归属守卫（票 `deep-module-scan/02`）：目录 `contract-actions.js` 把本动作的
      // `projectScope` 标成 `session-book`，**意思就是「要守归属」**（`:18` 那行注释逐字写着
      // 「只作事实，不执行 ownership」——事实是对的，只是过去没有人消费它）。本 case 此前
      // **没守**，`getParent(ctx, project, meta)` 会拿着别人的 project 去 `ctx.agents.create`，
      // 派子代理进别人的会话与别人的书夹。与同族另三处（`:54`/`:124`/`:163`）同形补上。
      assertSessionOwned(project, sessionId)
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
      return accept({ stopReason: result.stopReason,
        output: result.output.map((block) => block.text ?? '').join('').slice(0, 300),
        captured })
    }
  }
})
