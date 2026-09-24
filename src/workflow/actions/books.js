/**
 * 动作族模块（架构评审候选 3，2026-09-01 拆分）：actBooks
 * 从 src/workflow.js 平移，接口 (ctx, req, res, action, sessionId, project, body) 不变。
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
  listProjects,
  trashProject,
  runners,
  gateWaiters,
  disposeParent,
  sendJson,
} from '../engine.js'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, basename } from 'node:path'


/**
 * 书夹 `README.md` 的正文（判定线②：写进文件给人读的文本）。
 * 导出以便用词不变量断言直调**真实产出函数**（票 01），不在测试里复制模板字符串。
 */
export function bookReadmeText(name) {
  return `# 这本书的文件夹\n\n这里存放「${name.trim()}」从材料到成品的所有内容：\n\n- **README.md** — 本说明文件\n- **过程记录.md** — 从建书到交付的完整流水账（人读）\n- **sources/** — 你上传的教材 PDF 原件\n- **sources-md/** — PDF 转成的文字版\n- **提案/** — 每一次拍板的方案（含修订版）\n- **work/** — 机器写出来的内容（读材料挑重点的报告、各章、成书）\n- **snapshots/** — 关键节点自动存的档（可回退到最近一次）\n- **timeline.jsonl / project.json** — 机器用的账本与信息（别手改）\n`
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


/** 动作族 · 书目管理：'book-create' / 'book-rename' / 'book-set-goal' / 'book-delete'。 */
export async function actBooks(ctx, _req, res, action, sessionId, project, body) {
  switch (action) {
    case 'book-create': {
      // 向导：新建书项目（一个会话只能有一本书）
      const { name, goal, route, science, demo } = body
      if (typeof name !== 'string' || name.trim() === '') {
        sendJson(res, 400, { ok: false, error: '请填写书名' })
        return
      }
      if (listProjects(sessionId).length > 0) {
        sendJson(res, 409, { ok: false, error: '这个会话已经有一本书了：先完成它、删除它，或者新建一个会话再开第二本' })
        return
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
        id, name: name.trim(), goal: typeof goal === 'string' ? goal : '',
        route: route === 'human' ? 'human' : 'blueprint',
        science: science === true,
        demo: demo === true,
        session: sessionId,
        folder: basename(dir),
        sources: [], phase: 1, status: 'active',
        createdAt: Date.now(), updatedAt: Date.now(), eventCount: 0,
      }
      createMeta(meta)
      appendEvent(id, 'textbook/phase-start', { phase: 1, label: PHASE_LABELS[1] })
      // 书名敲定 → 会话名钉成「造书 · 书名」（ADR-0013；失败不影响建档）。
      syncSessionTitle(ctx, sessionId, meta.name)
      sendJson(res, 200, { ok: true, project: id, meta })
      return
    }
    case 'book-rename': {
      // 对话/向导代改书名（文件夹名不变，只改界面显示的书名）。
      assertSessionOwned(project, sessionId)
      const { name } = body
      if (typeof name !== 'string' || name.trim() === '') {
        sendJson(res, 400, { ok: false, error: '请填写书名' })
        return
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
      sendJson(res, 200, { ok: true, project, name: renameMeta.name })
      return
    }
    case 'book-set-goal': {
      // 对话/向导代改学习目标。
      assertSessionOwned(project, sessionId)
      const { goal } = body
      if (typeof goal !== 'string' || goal.trim() === '') {
        sendJson(res, 400, { ok: false, error: '请填写学习目标' })
        return
      }
      const goalMeta = updateMeta(project, (state) => { state.goal = goal.trim() })
      appendEvent(project, 'textbook/hint', { text: '学习目标已更新' })
      sendJson(res, 200, { ok: true, project, goal: goalMeta.goal })
      return
    }
    case 'book-delete': {
      // 取消/删除一本书：两步确认后移入回收站（数据不物理删除，可恢复）。
      const { confirm } = body
      assertSessionOwned(project, sessionId)
      if (confirm !== true) {
        sendJson(res, 400, { ok: false, error: '需要 confirm: true 才执行删除' })
        return
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
      sendJson(res, 200, { ok: true, project, trash: target })
      return
    }
  }
}
