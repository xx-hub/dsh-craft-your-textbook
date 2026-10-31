/**
 * 动作族模块（架构评审候选 3，2026-09-01 拆分）：actBooks
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
  readRegistry,
  writeRegistry,
  registerProject,
  sessionWorkspace,
  sanitizeFolderName,
  freeBookDir,
  readMeta,
  createMeta,
  updateMeta,
  appendEvent,
  // 票 `confirm-points-redesign-build/09`：站 0／1「只提示人」那一句的**唯一出口**（标签簇）。
  STATION_VALUE_EDIT_HINT,
  listProjects,
  trashProject,
  runners,
  gateWaiters,
  disposeParent,
} from '../engine.js'
import { familyOf, reject, accept } from '../action-runner.js'
import { refreshArtifactRegistry, writeArtifactManifest } from '../book-shape.js'
// 票 `confirm-points-redesign-build/03`：篇幅档位那一族（档位表 / `deriveLengthPlan` /
// `lengthStyleLine`）**整块删除**——建书不再问篇幅、书里不再有那个字段（盘上老书那格全空 ⇒ 无迁移）。
// 本动作层现在只认那**一个**剩下的旋钮：并发上限。
import {
  readMaxConcurrentSubagents,
  concurrencyLedgerLine,
  MAX_CONCURRENT_SUBAGENTS_CEILING,
} from '../../workbench-knobs.js'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, basename } from 'node:path'


/**
 * 书夹 `README.md` 的正文（判定线②：写进文件给人读的文本）。
 * 导出以便用词不变量断言直调**真实产出函数**（票 01），不在测试里复制模板字符串。
 */
export function bookReadmeText(name) {
  return `# 这本书的文件夹\n\n这里存放「${name.trim()}」从材料到成品的所有内容：\n\n- **README.md** — 本说明文件\n- **过程记录.md** — 从建书到交付的完整流水账（人读）\n- **sources/** — 你上传的原件\n- **材料/转换稿/** — 从原件转出的转换稿\n- **工作区/方案/** — 每一次拍板的方案（含修订版）\n- **工作区/** — 机器写出来的内容（读材料挑重点的报告、各章、成书）\n- **过程/存档/** — 关键节点自动存的档（可回退到最近一次）\n- **timeline.jsonl / project.json** — 机器用的账本与信息（别手改）\n`
}


/**
 * 会话名文案（判定线①：渲染到人眼的字符串）。`CONTEXT.md`「会话名」：
 * 建档与每次改书名都把会话名钉成「造书 · 当前书名」；超长不自己截，
 * 交给宿主按它的 80 字节上限处理（与 dsh 对任何标题的规则一致）。
 * 导出以便用词不变量断言直调**真实产出函数**（同 bookReadmeText）。
 */
export function sessionTitleText(bookName) {
  return `造书 · ${String(bookName).trim()}`
}


/**
 * 把会话名钉成书名（ADR-0013）。`book-create` 与 `book-rename` 各调一次，
 * 让左侧会话列表那一行永远等于这本书当前的书名。
 *
 * `sessionTitle` 是宿主的**可选**服务（老 dsh / 精简部署可能没有），所以走
 * `ctx.get` 而**不**进插件行的 `inject`——进了 inject，整行工作台会等一个
 * 可能永远不来的服务，页签直接消失。改名失败一律吞掉：会话名是锦上添花，
 * 绝不能拖垮建档；诊断只进宿主日志，不给用户看，也不改写建档的返回。
 */
export function syncSessionTitle(ctx, sessionId, bookName) {
  try {
    const titles = typeof ctx?.get === 'function' ? ctx.get('sessionTitle') : undefined
    if (titles === undefined || titles === null || typeof titles.rename !== 'function') return undefined
    const session = ctx.get('sessions')?.get?.(sessionId)
    if (session === undefined || session === null) return undefined
    return titles.rename(session, sessionTitleText(bookName))
  } catch (error) {
    try {
      const reason = error instanceof Error ? error.message : String(error)
      ctx?.logger?.warn?.(`textbook: 会话名未跟着书名更新（不影响造书）: ${reason}`)
    } catch { /* 记日志也失败就算了，绝不再抛 */ }
    return undefined
  }
}




/** 动作族 · 书目管理：'book-create' / 'book-rename' / 'book-set-goal' / 'book-set-knobs' / 'book-delete'。 */
export const actBooks = familyOf('books', async ({ ctx: ctx, action: action, sessionId: sessionId, project: project, body: body }) => {
  switch (action) {
    case 'book-create': {
      // 向导：新建书项目（一个会话只能有一本书）
      const { name, goal, route, science, demo } = body
      if (typeof name !== 'string' || name.trim() === '') {
        return reject(400, '请填写书名')
      }
      // 票 `confirm-points-redesign-build/03`：**服务端也拦空目标**（ADR-0037 决策 5）。
      // 今天拦人的只有界面那条红字（`WizardCard.submit`），而这个接口对空目标**照收**
      // （原来那句 `goal: typeof goal === 'string' ? goal : ''`）——`book-set-goal`（`:243`）
      // 与 AI 自己建书那条路都要求非空，只有建书这条路漏着 ⇒ 承诺面 ＞ 实现面。
      // 措辞与 `book-set-goal` 那一条**同一句**（同一件事两处说法不同，就是下一次漂移的种子）。
      if (typeof goal !== 'string' || goal.trim() === '') {
        return reject(400, '请填写学习目标')
      }
      // 票 `confirm-points-redesign-build/03`：**篇幅档位那一格整块删除**——建书不再问、书里不再有
      // 那个字段。盘上老书那格全空（**无迁移**）：读侧一个字都不读它，写侧从此没有写入点。
      // 章数上下限都不判；站 6 拍板的章数只做非阻断对账读数（`工作区/决策/06.json`，
      // 读侧在 `workflow/decisions.js`）。
      const cap = readMaxConcurrentSubagents(body.maxConcurrentSubagents)
      if (cap !== null && cap.ok !== true) {
        return reject(400, `并发上限要是 1-${MAX_CONCURRENT_SUBAGENTS_CEILING} 之间的整数`)
      }
      if (listProjects(sessionId).length > 0) {
        return reject(409, '这个会话已经有一本书了：先完成它、删除它，或者新建一个会话再开第二本')
      }
      const id = `book-${Date.now().toString(36)}`
      // 书夹位置：优先会话的工作区目录，文件夹名用书名；拿不到工作区就退回默认目录。
      const workspace = sessionWorkspace(ctx, sessionId) ?? projectsRoot()
      const folderName = sanitizeFolderName(name.trim()) || id
      const dir = freeBookDir(workspace, folderName)
      mkdirSync(dir, { recursive: true })
      registerProject(id, dir)
      try {
        writeFileSync(join(dir, 'README.md'), bookReadmeText(name))
      } catch { /* README 失败不影响建书 */ }
      const meta = {
        id, name: name.trim(), goal: goal.trim(),
        // ⚠️ **票 `confirm-points-redesign-build/06`：建书屏那条路不再写 `route`**——那一项已搬去
        // **站 4（第 1 关）**，值在**拍板那一刻**才由人定（`gates.js` 的 `gate-decide` 写进 `meta.route`）。
        // 建档时替用户先落一个默认档＝**替用户表态**（读侧一律 `meta.route ?? 'blueprint'` 兜底，
        // 缺这一格不会让任何一条路读不出来）。AI 自己建书那条路仍可**显式**给
        // （`agent-tool.js` 的 `create` 带 `route`），给了就照写——⛔ 不给就不编。
        ...(route === 'human' || route === 'blueprint' ? { route } : {}),
        science: science === true,
        demo: demo === true,
        session: sessionId,
        folder: basename(dir),
        sources: [], phase: 1, status: 'active',
        // ⚠️ **这里没有 `lengthPreset`**（票 cprb/03 起）：篇幅档位那个字段不存在了，
        // 盘上老书那一格留着旧值也**没人读**（无迁移、无回落）。
        ...(cap !== null && cap.ok === true ? { maxConcurrentSubagents: cap.value } : {}),
        createdAt: Date.now(), updatedAt: Date.now(), eventCount: 0,
      }
      createMeta(meta)
      // 书夹形状的「应当有什么」那一份（票 `context-budget/10`）：**建档时探形状生成一次**，
      // 书内只读。失败不许拖垮建档——没有清单的老书照常用（读侧据此不拦人）。
      try {
        writeArtifactManifest(id, meta)
        refreshArtifactRegistry(id)
      } catch { /* 形状件是派生的，写不进去不等于建档失败 */ }
      appendEvent(id, 'textbook/phase-start', { phase: 1, label: PHASE_LABELS[1] })
      // ⚠️ 这里原先还落一条「篇幅档位」的 active 风格线——随三档删除一并退役（屏上不再有档位可换，
      // 也就不存在「换档位要作废上一条」那件事）。用户自己提的风格线走 `style-note`，不受影响。
      // 书名敲定 → 会话名钉成「造书 · 书名」（ADR-0013；失败不影响建档）。
      syncSessionTitle(ctx, sessionId, meta.name)
      return accept({ project: id, meta })
    }
    case 'book-rename': {
      // 对话/向导代改书名（文件夹名不变，只改界面显示的书名）。
      assertSessionOwned(project, sessionId)
      const { name } = body
      if (typeof name !== 'string' || name.trim() === '') {
        return reject(400, '请填写书名')
      }
      // 状态改动走 updateMeta 的改法（当场新读）：旧名字在改法里取，比函数开头那份读更新。
      let oldName = ''
      const renameMeta = updateMeta(project, (state) => {
        oldName = state.name
        state.name = name.trim()
      })
      appendEvent(project, 'textbook/hint', { text: `书名已从「${oldName}」改为「${renameMeta.name}」` })
      // 会话名跟着书名走（ADR-0013 决策 2）；失败不影响改名本身。
      syncSessionTitle(ctx, sessionId, renameMeta.name)
      return accept({ project, name: renameMeta.name })
    }
    case 'book-set-goal': {
      // 对话/向导代改学习目标。
      assertSessionOwned(project, sessionId)
      const { goal } = body
      if (typeof goal !== 'string' || goal.trim() === '') {
        return reject(400, '请填写学习目标')
      }
      const goalMeta = updateMeta(project, (state) => { state.goal = goal.trim() })
      appendEvent(project, 'textbook/hint', { text: '学习目标已更新' })
      // ── 票 `confirm-points-redesign-build/09`：**站 0 是「只提示人」那一档** ───────────────
      // 站 0 的值（`meta.name`／`goal`／`science`）是**现读**的，没有可作废的产物 ⇒ 这里
      // ⛔ 不归档、⛔ 不截账本、⛔ 不清 `meta`、⛔ 不把待办指回，只**多打一句**（spec §4.5 的两处例外之一）。
      // 措辞的**唯一出口**＝`engine.STATION_VALUE_EDIT_HINT`（⛔ 不在这里手抄第二份）。
      appendEvent(project, 'textbook/hint', { text: STATION_VALUE_EDIT_HINT })
      return accept({ project, goal: goalMeta.goal })
    }
    case 'book-set-knobs': {
      // 票 `walkthrough-fixes/19`②：**拍板之前还能改**那个旋钮（消掉「等 AI 出一版方案再驳回」
      // 那条绕圈子路）。⚠️ 票 `confirm-points-redesign-build/03` 起只剩**一个**旋钮
      // （篇幅档位三档删除）⇒ 现在**要**给 `maxConcurrentSubagents`；给了别人认得的旧字段
      // （`length`）也一律拒——静默收下一个已删的字段，就是下一次「用户以为改了」。
      assertSessionOwned(project, sessionId)
      if (body.length !== undefined) {
        return reject(400, '篇幅档位已删除（票 confirm-points-redesign-build/03）：book-set-knobs 只剩 maxConcurrentSubagents')
      }
      const cap = readMaxConcurrentSubagents(body.maxConcurrentSubagents)
      if (cap === null) {
        return reject(400, 'book-set-knobs 需要 maxConcurrentSubagents')
      }
      if (cap.ok !== true) {
        return reject(400, `并发上限要是 1-${MAX_CONCURRENT_SUBAGENTS_CEILING} 之间的整数`)
      }
      let changed = false
      {
        const before = readMeta(project)?.maxConcurrentSubagents ?? null
        updateMeta(project, (state) => { state.maxConcurrentSubagents = cap.value })
        if (before !== cap.value) {
          // **改完必须落账**（裁决②）：走**既有**事件通道 `textbook/hint`，⛔ 不新开事件类型。
          // 落的是「用户把它拧成了几」——「拧了没生效」从此在账本上查得出来。
          appendEvent(project, 'textbook/hint', {
            text: concurrencyLedgerLine(cap.value),
            knob: 'maxConcurrentSubagents',
            value: cap.value,
            by: 'user',
          })
          changed = true
        }
      }
      const meta = readMeta(project)
      return accept({
        project,
        maxConcurrentSubagents: meta?.maxConcurrentSubagents ?? null,
        changed,
      })
    }
    case 'book-delete': {
      // 取消/删除一本书：两步确认后移入回收站（数据不物理删除，可恢复）。
      const { confirm } = body
      assertSessionOwned(project, sessionId)
      if (confirm !== true) {
        return reject(400, '需要 confirm: true 才执行删除')
      }
      runners.delete(project)
      gateWaiters.delete(project)
      void disposeParent(project)
      const target = trashProject(project)
      // 从注册表移除：已删除的书不再出现在项目列表（文件夹仍在回收站，可恢复）。
      const registry = readRegistry()
      if (registry[project] !== undefined) {
        delete registry[project]
        writeRegistry(registry)
      }
      ctx.logger.info(`textbook: 项目 ${project} 已移入回收站 ${target}`)
      return accept({ project, trash: target })
    }
  }
})
