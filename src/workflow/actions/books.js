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
  writeMeta,
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
        writeFileSync(join(dir, 'README.md'), `# 这本书的文件夹\n\n这里存放「${name.trim()}」从材料到成品的所有内容：\n\n- **README.md** — 本说明文件\n- **过程记录.md** — 从建书到交付的完整流水账（人读）\n- **sources/** — 你上传的教材 PDF 原件\n- **sources-md/** — PDF 转成的文字版\n- **提案/** — 每一关的设计方案（含修订版）\n- **work/** — 机器写出来的内容（源探查报告、各章、成书）\n- **snapshots/** — 每个拍板点的存档（可回退）\n- **timeline.jsonl / project.json** — 机器用的账本与信息（别手改）\n`)
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
      writeMeta(meta)
      appendEvent(id, 'textbook/phase-start', { phase: 1, label: PHASE_LABELS[1] })
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
      const renameMeta = readMeta(project)
      const oldName = renameMeta.name
      renameMeta.name = name.trim()
      renameMeta.updatedAt = Date.now()
      writeMeta(renameMeta)
      appendEvent(project, 'textbook/hint', { text: `书名已从「${oldName}」改为「${renameMeta.name}」` })
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
      const goalMeta = readMeta(project)
      goalMeta.goal = goal.trim()
      goalMeta.updatedAt = Date.now()
      writeMeta(goalMeta)
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
