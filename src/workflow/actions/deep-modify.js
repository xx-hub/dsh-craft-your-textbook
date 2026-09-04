/**
 * 动作族模块（架构评审候选 3，2026-09-01 拆分）：actDeepModify
 * 从 src/workflow.js 平移，接口 (ctx, req, res, action, sessionId, project, body) 不变。
 * 共享工具来自 ../engine.js。
 */
import {
  assertSessionOwned,
  projectDir,
  timelinePath,
  readMeta,
  writeMeta,
  appendEvent,
  readEvents,
  workDir,
  wakeMainAI,
  handoff,
  runPhase3,
  kick,
  sendJson,
  deepAffected,
  deepStartSeq,
} from '../engine.js'
import { mkdirSync, readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs'
import { join, dirname } from 'node:path'


/** 动作族 · 深改：'deep-modify' / 'deep-undo'。 */
export async function actDeepModify(ctx, _req, res, action, sessionId, project, body) {
  switch (action) {
    case 'deep-modify': {
      // 定点修改（深改）：归档该段及下游产物、截断账本到该段起点、注入重做意见、把待办指回被改段重跑下游。
      // 上游产物与风格线/豁免/留言原样保留；demo 不开放（demo 走旧全自动通道）。
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      if (meta === null) throw new Error(`unknown project ${JSON.stringify(project)}`)
      if (meta.demo === true) { sendJson(res, 409, { ok: false, error: '演示书不支持定点修改' }); return }
      if (meta.status === 'running' || meta.pendingStage != null) {
        sendJson(res, 409, { ok: false, error: 'AI 正在干活；要改历史请先等它交工（或先 ⏸ 暂停）' })
        return
      }
      const segKey = String(body.segment ?? '')
      const affected = deepAffected(project, meta, segKey)
      const note = String(body.note ?? '').trim().slice(0, 500)
      if (affected === null) { sendJson(res, 400, { ok: false, error: '不认识的历史段' }); return }
      if (note === '') { sendJson(res, 400, { ok: false, error: '写一句这次要改什么' }); return }
      // 1) 深改存档（meta+events+产物清单，独立目录，永不复用 seq 名）
      const id = `${Date.now().toString(36)}-${segKey}`
      const deepDir = join(projectDir(project), 'snapshots', 'deep')
      mkdirSync(deepDir, { recursive: true })
      const events = readEvents(project)
      writeFileSync(join(deepDir, `${id}.json`), JSON.stringify({
        id, segment: segKey, time: Date.now(), meta, events, archived: affected.files,
      }) + '\n')
      // 2) 选择性归档：该段及下游产物 -> _旧版产物/深改-<id>/（上游原地保留）
      const stampDir = join(workDir(project), '_旧版产物', `深改-${id}`)
      mkdirSync(stampDir, { recursive: true })
      let archived = 0
      for (const rel of affected.files) {
        const from = join(projectDir(project), rel)
        if (existsSync(from)) {
          try { renameSync(from, join(stampDir, rel.replace(/\//g, '__'))); archived += 1 } catch { /* 尽力归档 */ }
        }
      }
      // 3) 事件截断到该段起点（下游折叠状态从账本重推导）
      const startSeq = deepStartSeq(project, segKey)
      if (startSeq !== null) {
        const kept = events.filter((e) => e.seq < startSeq)
        writeFileSync(timelinePath(project), kept.map((e) => JSON.stringify(e)).join('\n') + (kept.length > 0 ? '\n' : ''))
        meta.eventCount = kept.length
      }
      // 4) 外科式 meta 重置 + 重做意见
      meta.deepRedoNote = { segment: segKey, note }
      meta.status = 'running'
      meta.pause = null
      switch (affected.reset) {
        case 'explore':
          delete meta.exploreConfirmed; delete meta.exploreRedoNote
          meta.phase = 2
          break
        case 'gate':
          meta.phase = 3
          // F37（2026-08-20 走查）：关卡一改，章节安排（outline）作为下游必须重做——
          // deepAffected 已归档 outline/gold 产物文件，但 meta.outline 不清会让 runPhase3
          // 跳过章节安排重做、下游（金标准章）沿用旧大纲。与 outline 分支同样清干净。
          delete meta.outline; delete meta.outlineRedoNote; delete meta.goldChapter; delete meta.goldChapterReason
          meta.goldSealed = null; meta.goldOpinions = []; delete meta.goldRedoNote
          break
        case 'outline':
          delete meta.outline; delete meta.outlineRedoNote; delete meta.goldChapter; delete meta.goldChapterReason
          // 章节骨架一改，金标准（范例章+写作规范）作为下游必须重做：清定稿与旧意见。
          meta.goldSealed = null; meta.goldOpinions = []; delete meta.goldRedoNote
          meta.phase = 3
          break
        case 'gold':
          meta.goldSealed = null; meta.goldOpinions = []; delete meta.goldRedoNote
          meta.phase = 4
          break
        case 'chapter':
          meta.chaptersReviewed = false
          meta.phase = 5
          break
        case 'merge':
          meta.phase = 5
          break
        case 'final':
          meta.phase = 6
          break
      }
      // 重跑落点：把待办直接指回被改段（不 kick——kick 会让状态机从账本重推导，
      // 遇到演示/旧账可能落错段，且 handoff 会追加 stage-start 事件、破坏下方
      // 10 分钟撤销的「账面无新进展」守卫）。等主 AI 领任务交工后再 kick 自然续跑。
      const redoTarget = {
        explore: ['explore', null], gate: ['gate', segKey.slice(5)], outline: ['outline', null],
        gold: ['gold', null], chapter: ['chapters', null], merge: ['merge', null], final: ['final', null],
      }[affected.reset] ?? [null, null]
      meta.pendingStage = redoTarget[0]
      meta.pendingGate = redoTarget[1]
      // 金标准产物被归档时一并清过目标记（章节变了要重新过目）
      if (affected.reset !== 'merge' && affected.reset !== 'final') meta.chaptersReviewed = false
      // F35（2026-08-20 走查）：被重做的章节（下游含 chapter-N 的段）清掉流水线阶段账本，
      // 重做时不再显示旧的执笔/审计阶段（章节没被重做的 merge/final 保留）。
      const redoChapters = (affected.downstream ?? [])
        .filter((k) => /^chapter-\d+$/.test(k))
        .map((k) => Number(k.slice(8)))
      if (redoChapters.length > 0) {
        const pipeline = Array.isArray(meta.chapterPipeline) ? meta.chapterPipeline.slice() : []
        for (const n of redoChapters) { if (pipeline[n - 1] !== undefined) pipeline[n - 1] = null }
        meta.chapterPipeline = pipeline
      }
      meta.updatedAt = Date.now()
      writeMeta(meta)
      appendEvent(project, 'textbook/deep-modify', { segment: segKey, note, archived })
      appendEvent(project, 'textbook/hint', {
        text: `✍️ 已按你的意见定点修改「${segKey}」：这一步和它后面的都会重做（旧版本全部留档；10 分钟内可一键撤销）。`,
      })
      // 深改落账完成后锚定撤销点。注意 appendEvent 每次从盘上重读并 +1，此刻盘上
      // 账高已是「深改前 + 2」（两条事件各 +1）——这正是撤销守卫要盯的高度，直接用它，
      // 且必须重新读盘再写，否则本地旧对象会把 appendEvent 刚推进的账高覆盖回去。
      const anchored = readMeta(project)
      anchored.lastDeepModify = { id, segment: segKey, at: Date.now(), eventCountAfter: (anchored.eventCount ?? 0) }
      writeMeta(anchored)
      // 唤醒主 AI 领重做任务（真实模式；不 kick 以免立刻追加 stage-start 事件）。
      if (meta.demo !== true) {
        try { wakeMainAI(ctx, project) } catch { /* 唤醒失败不阻塞深改 */ }
      }
      sendJson(res, 200, { ok: true, project, segment: segKey, archived })
      return
    }
    case 'deep-undo': {
      // 一键撤销最近一次深改（10 分钟内且账面无新进展）。
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      const last = meta?.lastDeepModify
      if (last == null || Date.now() - last.at > 10 * 60 * 1000) {
        sendJson(res, 409, { ok: false, error: '没有 10 分钟内的深改可撤销' })
        return
      }
      if ((meta.eventCount ?? 0) !== last.eventCountAfter) {
        sendJson(res, 409, { ok: false, error: '深改后账面已有新进展，撤销会丢失它们；如确要撤销请回退快照' })
        return
      }
      const file = join(projectDir(project), 'snapshots', 'deep', `${last.id}.json`)
      if (!existsSync(file)) { sendJson(res, 404, { ok: false, error: '深改存档文件缺失' }); return }
      let archive = null
      try { archive = JSON.parse(readFileSync(file, 'utf8')) } catch { archive = null }
      if (archive === null || typeof archive !== 'object') {
        sendJson(res, 500, { ok: false, error: '深改存档文件损坏，无法撤销；旧版产物仍在 work/_旧版产物/深改-… 目录留档' })
        return
      }
      // 产物回移
      const stampDir = join(workDir(project), '_旧版产物', `深改-${last.id}`)
      for (const rel of archive.archived ?? []) {
        const back = join(stampDir, rel.replace(/\//g, '__'))
        const to = join(projectDir(project), rel)
        if (existsSync(back)) {
          mkdirSync(dirname(to), { recursive: true })
          try { renameSync(back, to) } catch { /* 尽力回移 */ }
        }
      }
      // meta + events 整体复原（守卫已确保期间无新账）
      writeFileSync(timelinePath(project), (archive.events ?? []).map((e) => JSON.stringify(e)).join('\n') + '\n')
      const restored = { ...archive.meta }
      restored.updatedAt = Date.now()
      delete restored.lastDeepModify
      delete restored.deepRedoNote
      writeMeta(restored)
      appendEvent(project, 'textbook/deep-undo', { segment: archive.segment })
      sendJson(res, 200, { ok: true, project })
      return
    }
  }
}
