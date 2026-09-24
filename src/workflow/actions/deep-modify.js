/**
 * 动作族模块（架构评审候选 3，2026-09-01 拆分）：actDeepModify
 * 从 src/workflow.js 平移，接口 (ctx, req, res, action, sessionId, project, body) 不变。
 * 共享工具来自 ../engine.js。
 */
import {
  assertSessionOwned,
  projectDir,
  readMeta,
  updateMeta,
  rollbackLedger,
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
  syncPendingReviewsAfterTruncate,
} from '../engine.js'
import { mkdirSync, readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs'
import { join, dirname } from 'node:path'
// 界面词（分段 → 人话）：这条 hint 会渲染进「之前的过程」，所以 `seg.key` 不能原样上屏
// （判定线③；译法与 UI/《过程记录.md》同一份，住在 domain-rules「界面词」区）。
import { segmentHuman } from '../../domain-rules.js'


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
      // 票 12（spec 第 4 条 / 不变量 4：守卫读的字段＝动作写的字段）：提示语承诺「或先 ⏸ 暂停」，
      // 而「⏸ 暂停」写的是 meta.pause（collab-signals 的 'pause'）——所以暂停即放行，守卫读这个字段。
      // 提示语一个字不改（要改的是路，不是话）；demo 的 409 必须留在本守卫之前（demo 深改始终拒，
      // 与是否暂停无关）。反面照旧：未暂停且该章还在做 → 409。
      if (meta.pause == null && (meta.status === 'running' || meta.pendingStage != null)) {
        sendJson(res, 409, { ok: false, error: '我正在做；要改历史请先等交工（或先 ⏸ 暂停）' })
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
      // 归档名单＝**真的搬得走的那些**：盘上没有的不进存档。存档的 `archived` 是撤销回移的唯一依据，
      // 它必须与搬走的东西**逐条一致**（dead-gates/18 验收③）——原先记的是"打算搬的清单"，其中
      // 含盘上根本没有的文件。同一份产物可能被两条清单同时点到（如范例章：goldFiles 与 allChapters），
      // 而一个文件只能搬一次 → 去重（`affected.files` 的清单语义不变，喂给搬移的这份是集合）。
      const movable = [...new Set(affected.files)].filter((rel) => existsSync(join(projectDir(project), rel)))
      writeFileSync(join(deepDir, `${id}.json`), JSON.stringify({
        id, segment: segKey, time: Date.now(), meta, events, archived: movable,
      }) + '\n')
      // 2) 选择性归档：该段及下游产物 -> _旧版产物/深改-<id>/（上游原地保留）
      const stampDir = join(workDir(project), '_旧版产物', `深改-${id}`)
      mkdirSync(stampDir, { recursive: true })
      let archived = 0
      for (const rel of movable) {
        const from = join(projectDir(project), rel)
        try { renameSync(from, join(stampDir, rel.replace(/\//g, '__'))); archived += 1 } catch { /* 尽力归档 */ }
      }
      // 3) 事件截断到该段起点（下游折叠状态从账本重推导）
      const startSeq = deepStartSeq(project, segKey)
      let kept = null
      if (startSeq !== null) {
        kept = events.filter((e) => e.seq < startSeq)
        // 合法回退（ADR-0016 决策 3）：账本截短、账高随之变小——走 rollbackLedger 这条明文例外，
        // 刻意不借 updateMeta（updateMeta 挡住对账高的改动，那正是它该做的）。
        rollbackLedger(project, kept)
      }
      // 4) 外科式 meta 重置 + 重做意见：一次收进改法，对**当场新读**的状态做（账本刚被截断，
      //    读到的账高已是截断后的）。原先这里是深改开工时那份旧状态整份写回——它会把紧跟着
      //    appendEvent 推进的账高带回旧值（票 02 的形状）；「最后动静时刻」也只归「记一笔」所有。
      updateMeta(project, (state) => {
        if (kept !== null) {
          // 票 13（spec 第 7 条 / 不变量 5「账本与 meta 同源」）：账本被截断了，意见集合要跟着一起走——
          // 被截掉的那些 `textbook/review` 对应的意见从 meta.pendingReviews 里去掉，不留孤儿意见
          // （界面上点进去一条已经不存在的意见 / 一条没人能销号的永久拦路意见）。上游章的意见不碰：
          // 判据只看「截断后还有没有与它对应的 review 事件」，别的章的事件没被截，自然一条都不删。
          // 注：下面的 chapter 分支还会把该章**未处置**的意见一并作废（票 11 的语义）；这里按账本重算的是
          // 「账上没有对应事件的意见一律不留」，比票 11 更狠一点——但两者对目标章是同结论，不冲突。
          syncPendingReviewsAfterTruncate(state, kept)
        }
        state.deepRedoNote = { segment: segKey, note }
        state.status = 'running'
        state.pause = null
        switch (affected.reset) {
          case 'explore':
            delete state.exploreConfirmed; delete state.exploreRedoNote
            state.phase = 2
            break
          case 'gate':
            state.phase = 3
            // F37（2026-08-20 走查）：关卡一改，章节安排（outline）作为下游必须重做——
            // deepAffected 已归档 outline/gold 产物文件，但 meta.outline 不清会让 runPhase3
            // 跳过章节安排重做、下游（金标准章）沿用旧大纲。与 outline 分支同样清干净。
            delete state.outline; delete state.outlineRedoNote; delete state.goldChapter; delete state.goldChapterReason
            state.goldSealed = null; state.goldOpinions = []; delete state.goldRedoNote
            break
          case 'outline':
            delete state.outline; delete state.outlineRedoNote; delete state.goldChapter; delete state.goldChapterReason
            // 章节骨架一改，金标准（范例章+写作规范）作为下游必须重做：清定稿与旧意见。
            state.goldSealed = null; state.goldOpinions = []; delete state.goldRedoNote
            state.phase = 3
            break
          case 'gold':
            state.goldSealed = null; state.goldOpinions = []; delete state.goldRedoNote
            state.phase = 4
            break
          case 'chapter':
            // 票 11（spec 第 2.5 条 / 用户 story 8·9）：「定点修改这一章」＝该章未处置的抽查意见一并作废
            // ——整章重做这条路不再掺第二件事。语义是**删除**（不是标 'revoked'）：票 13 会让账本截断与
            // 意见集合同源，被截断事件对应的意见不该留下；标 revoked 会在界面上留下一条「对已不存在意见的
            // 处置记录」。射程＝本次深改的目标章本身：别的章的未处置意见原样保留；该章重做后**新产生**的
            // 意见照旧拦人（不做任何永久豁免）。
            if (Array.isArray(state.pendingReviews)) {
              const n = Number(segKey.slice('chapter-'.length))
              state.pendingReviews = state.pendingReviews.filter((r) => !(r?.chapter === n && r?.status === 'pending'))
            }
            state.chaptersReviewed = false
            state.phase = 5
            break
          case 'merge':
            state.phase = 5
            break
          case 'final':
            state.phase = 6
            break
        }
        // 重跑落点：把待办直接指回被改段（不 kick——kick 会让状态机从账本重推导，
        // 遇到演示/旧账可能落错段，且 handoff 会追加 stage-start 事件、破坏下方
        // 10 分钟撤销的「账面无新进展」守卫）。等主 AI 领任务交工后再 kick 自然续跑。
        const redoTarget = {
          explore: ['explore', null], gate: ['gate', segKey.slice(5)], outline: ['outline', null],
          gold: ['gold', null], chapter: ['chapters', null], merge: ['merge', null], final: ['final', null],
        }[affected.reset] ?? [null, null]
        state.pendingStage = redoTarget[0]
        state.pendingGate = redoTarget[1]
        // 金标准产物被归档时一并清过目标记（章节变了要重新过目）
        if (affected.reset !== 'merge' && affected.reset !== 'final') state.chaptersReviewed = false
        // F35（2026-08-20 走查）：被重做的章节（下游含 chapter-N 的段）清掉流水线阶段账本，
        // 重做时不再显示旧的执笔/审计阶段（章节没被重做的 merge/final 保留）。
        const redoChapters = (affected.downstream ?? [])
          .filter((k) => /^chapter-\d+$/.test(k))
          .map((k) => Number(k.slice(8)))
        if (redoChapters.length > 0) {
          const pipeline = Array.isArray(state.chapterPipeline) ? state.chapterPipeline.slice() : []
          for (const n of redoChapters) { if (pipeline[n - 1] !== undefined) pipeline[n - 1] = null }
          state.chapterPipeline = pipeline
        }
      })
      appendEvent(project, 'textbook/deep-modify', { segment: segKey, note, archived })
      // 票 14（承诺账 A1③/A1④）：「全部留档」是全集承诺（归档是尽力语义）、「10 分钟内可一键撤销」
      // 少了「只覆盖最近一次」这个单位；同时 `segKey` 是机器词（`gate-1`），出口处过 `segmentHuman`。
      appendEvent(project, 'textbook/hint', {
        text: `✍️ 已按你的意见定点修改「${segmentHuman(segKey)}」：这一步和它后面的都会重做（旧版本会归档留底；最近一次修改，10 分钟内可以一键撤销）。`,
      })
      // 深改落账完成后锚定撤销点。注意 appendEvent 每次从盘上重读并 +1，此刻盘上
      // 账高已是「深改前 + 2」（两条事件各 +1）——这正是撤销守卫要盯的高度，所以在改法里
      // 读**当场新读**的那份账高（原先「先读一份再整份写回」的写法正是票 02 的坏形状）。
      updateMeta(project, (state) => {
        state.lastDeepModify = { id, segment: segKey, at: Date.now(), eventCountAfter: (state.eventCount ?? 0) }
      })
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
      // meta + events 整体复原（守卫已确保期间无新账）：合法回退——账本截短、账高随之变小，
      // 走 rollbackLedger 这条明文例外（ADR-0016 决策 3）；原先这里自己写 timeline + writeMeta。
      const restored = { ...archive.meta }
      delete restored.lastDeepModify
      delete restored.deepRedoNote
      rollbackLedger(project, archive.events ?? [], restored)
      appendEvent(project, 'textbook/deep-undo', { segment: archive.segment })
      sendJson(res, 200, { ok: true, project })
      return
    }
  }
}
