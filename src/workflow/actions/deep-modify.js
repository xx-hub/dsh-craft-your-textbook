/**
 * 动作族模块（架构评审候选 3，2026-09-01 拆分）：actDeepModify
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
  projectDir,
  readMeta,
  updateMeta,
  rollbackLedger,
  appendEvent,
  readEvents,
  workDir,
  archiveDir,
  wakeMainAI,
  handoff,
  runPhase3,
  kick,
  deepAffected,
  deepStartSeq,
  syncPendingReviewsAfterTruncate,
  // 票 `walkthrough-fixes/34`：深改自己把 `工作区/style-spec.md` 一并收走时，**这一笔当场记**
  // （理由写在下面调用点）。
  noteStyleSpecChange,
  // 票 `confirm-points-redesign-build/09`：归档改名那一圈（摊平命名进 `_旧版产物/<子目录>/`）
  // 与回退那条路**共用**这一处——spec §4.4 的两条路「同一条归档口」。
  archiveBookFiles,
} from '../engine.js'
import { familyOf, reject, accept } from '../action-runner.js'
// payload 字段词汇层（票 `deep-module-scan/18` 层一）。⚠️ 本文件用 `textCoerced(..., true)`
//   ——原表达式是 `textCoerced(body.note, DEEP_MODIFY_NOTE_MAX, true)`，**先强制再裁空白**，
//   与 `textField`（只认字符串）不是一回事。
import { textCoerced, DEEP_MODIFY_NOTE_MAX } from './payload-fields.js'
import { mkdirSync, readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs'
import { join, dirname } from 'node:path'
// 界面词（分段 → 人话）：这条 hint 会渲染进「之前的过程」，所以 `seg.key` 不能原样上屏
// （判定线③；译法与 UI/《过程记录.md》同一份，住在 domain-rules「界面词」区）。
import { segmentHuman } from '../../domain-rules.js'

/**
 * 段 key → 交给 `segmentHuman` 的那个值（票 `walkthrough-fixes/35`）。
 *
 * `segmentHuman` 的章分支要的是**带 label 的对象**（`typeof seg === 'object' && seg?.label`），
 * 而本文件的调用点手上只有 `segKey` 这个字符串——于是 `chapter-N` 一路走进章分支、`typeof` 判假，
 * 原样把机器词印进「之前的过程」。标题的来源**只有一个**：已拍板的大纲
 * `meta.outline.chapters[N-1].title`（与界面章段 label 同源，票 01 §2）。
 *
 * ⚠️ 查不到（没排章／那一章没写标题）⇒ **原样交回 key**，让 `segmentHuman` 的既有兜底把机器词
 * 露出来——「宁可露出机器词，也不猜错」是那个函数上方逐字写着的取向；⛔ 这里不许拼半截人话
 * （「第 2 章 」后面空着，比 `chapter-2` 更糟）。
 *
 * @param {object|null|undefined} meta 这本书的 `meta`（读的是 `outline.chapters`）
 * @param {string} segKey 段 key（`gate-1`／`outline`／`chapter-2`…）
 * @returns {string|{key: string, label: string}} 非章段原样回字符串；章段能查到标题时回带 label 的对象
 */
function segmentForHuman(meta, segKey) {
  const m = /^chapter-(\d+)$/.exec(segKey)
  if (m === null) return segKey
  const n = Number(m[1])
  const title = meta?.outline?.chapters?.[n - 1]?.title
  if (typeof title !== 'string' || title.trim() === '') return segKey
  return { key: segKey, label: `第 ${n} 章 ${title}` }
}


/**
 * 演示书上点「定点修改」时**原样上屏**的那句告知（票 `demo-channel-full/17`，维护者 2026-10-15 拍板）。
 *
 * 为什么把它抽成一个导出：它是一条**判定线①那样的人话出口**（错误条原样渲染），所以
 * ⛔ 不许在别处手抄第二份——判据（`test-collab-backend.mjs` 的 F6d）与文案判据都引**这一份**。
 *
 * 它要同时说清三件事：① 演示书**没有**可回退重做的真实段（所以这不是故障，是这本书的性质）；
 * ② 这颗键在这里的意思是「让你看见它长什么样」；③ 点下去**什么也不会发生**（⛔ 不承诺任何后果）。
 */
export const DEMO_DEEP_MODIFY_NOTICE = '演示书没有可回退重做的真实段——这一步在演示书里只是给你看它长什么样，点下去不会重做任何东西'

/** 动作族 · 深改：'deep-modify' / 'deep-undo'。 */
export const actDeepModify = familyOf('deep-modify', async ({ ctx: ctx, action: action, sessionId: sessionId, project: project, body: body }) => {
  switch (action) {
    case 'deep-modify': {
      // 定点修改（深改）：归档该段及下游产物、截断账本到该段起点、注入重做意见、把待办指回被改段重跑下游。
      // 上游产物与风格线/豁免/留言原样保留。
      // ⚠️ 票 `demo-channel-full/17`：演示书上**入口是可见的**（`workflow.js` 的 `canDeepModify` 不再
      // 带 demo 条件），但**动作这一层照旧整条拒**——演示书没有可回退重做的真实段，真去归档／截断／
      // 重跑下游等于凭空造一段历史。所以这一句 409 **必须留在下面那条暂停守卫之前**：demo 深改始终拒，
      // 与是否暂停无关。变的是**文案**（从机器腔的「不支持」改成说清「只是给你看它长什么样」），
      // 不是判定。
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      if (meta === null) throw new Error(`unknown project ${JSON.stringify(project)}`)
      if (meta.demo === true) { return reject(409, DEMO_DEEP_MODIFY_NOTICE) }
      // 票 12（spec 第 4 条 / 不变量 4：守卫读的字段＝动作写的字段）：提示语承诺「或先 ⏸ 暂停」，
      // 而「⏸ 暂停」写的是 meta.pause（collab-signals 的 'pause'）——所以暂停即放行，守卫读这个字段。
      // 提示语一个字不改（要改的是路，不是话）；上面那条 demo 的 409 必须留在本守卫之前
      // （票 `demo-channel-full/17` 复核时确认过这一条：演示书的入口可见了，动作层照旧始终拒，
      // 与是否暂停无关）。反面照旧：未暂停且该章还在做 → 409。
      if (meta.pause == null && (meta.status === 'running' || meta.pendingStage != null)) {
        return reject(409, '我正在做；要改历史请先等交工（或先 ⏸ 暂停）')
      }
      const segKey = String(body.segment ?? '')
      const affected = deepAffected(project, meta, segKey)
      const note = textCoerced(body.note, DEEP_MODIFY_NOTE_MAX, true)
      if (affected === null) { return reject(400, '不认识的历史段') }
      if (note === '') { return reject(400, '写一句这次要改什么') }
      // 1) 深改存档（meta+events+产物清单，独立目录，永不复用 seq 名）
      const id = `${Date.now().toString(36)}-${segKey}`
      // `archiveDir()` 建的是 `过程/存档/`；`deep/` 是它下面**再一层**，仍要自己建。
      const deepDir = join(archiveDir(project), 'deep')
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
      // ⚠️ 票 `confirm-points-redesign-build/09`：这一圈**搬进 `engine.archiveBookFiles`**
      // ——回退那条路（`restoreSnapshot`）要搬的东西同形（摊平命名进 `_旧版产物/<子目录>/`），
      // spec §4.4 要求两条路「同一条归档口、⛔ 不新造第二套规则」⇒ 判据与命名只留一处。
      // ⚠️ **收口 review · finding 2**：返回值**必须读**——单件搬不走时静默往下走就是
      // 「旧稿留在原位 ＋ 账本被截短 ＋ 状态被重置」＝重做从未真正发生，而屏上没有任何异常
      // （正是票 09 要治的「账本说没拍过、件却还在」）。`archived` 照旧是**真搬走的件数**
      // ——那一笔账与回包的口径一个字不改。
      // ⚠️ 抛在这里时 `deep/<id>.json` 那份存档已经写下（它先落盘，是为了避开「件搬走了、
      // 存档却写不出」那种更坏的情形），但它没有被 `lastDeepModify` 锚定 ⇒ 撤销不了，也不会
      // 被当成一次真深改；搬走的那几件留在 `工作区/_旧版产物/深改-<id>/`，用户关掉占用它的
      // 程序后重试即可（`movable` 现读盘上 ⇒ 已搬走的不再算「该搬的」）。
      const { want, moved, misses } = archiveBookFiles(project, movable, `深改-${id}`)
      const archived = moved
      if (moved < want) {
        throw new Error(
          `textbook: 定点修改「${segmentHuman(segmentForHuman(meta, segKey))}」没有生效——${misses.join('、')} 没能归档`
          + `（要搬 ${want} 件、只搬走 ${moved} 件）：旧稿留在原地下次会被当成新结果读走。`
          + '请关掉占用这些文件的程序后重试。',
        )
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
            // ⚠️ 票 `confirm-points-redesign-build/09`（spec §9.2 三处内容②）：**重做探查段时
            // 章节安排那一族也要清**——重做站 2／3 的下游是站 4–9（十行表），`deepAffected`
            // 早已把 `outline.md`／三关方案／范例章那些**产物文件**登进归档名单，但
            // `meta.outline` 不清会让 `runPhase3` 正面读它、**跳过章节安排重做**（实测：
            // 「产物搬走了、这一站却不重做」，同屏上读数与状态机还会打架）。
            // 照 `case 'gate'` 的 F37 先例逐字同形——**同一条规则**，⛔ 不另造一套。
            delete state.outline; delete state.outlineRedoNote; delete state.goldChapter; delete state.goldChapterReason
            state.goldSealed = null; state.goldOpinions = []; delete state.goldRedoNote
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
        text: `✍️ 已按你的意见定点修改「${segmentHuman(segmentForHuman(meta, segKey))}」：这一步和它后面的都会重做（旧版本会归档留底；最近一次修改，10 分钟内可以一键撤销）。`,
      })
      // 票 `walkthrough-fixes/34`：**这一笔必须落在这里，落在下面那个撤销点之前**。
      // 下游含 `gold` 的段（`gate-N`／`outline`／`gold`）会把 `工作区/style-spec.md` 一起归档 ⇒
      // 规范从此「读不到」，而票 12 那条检测点（`engine.noteStyleSpecChange`，挂在工作台 2 秒一轮的两条
      // 轮询路上）会在**紧接着的下一轮轮询**里记下这一笔——那条账把刚锚定的 `eventCountAfter` 顶掉，
      // 于是 `deep-undo` 的「账面无新进展」守卫恒 409、票面承诺的「10 分钟内一键撤销」永远打不开
      // （2026-10-12 一次性房的实测：10 秒 +11 条，`deep-undo` 回 409）。
      // 记在深改自己名下既准（这次「读不到」正是它造成的），也让撤销点锚在它**之后**。
      // 去重仍归 `noteStyleSpecChange`：规范没被这一刀波及的段走不到记账（`now === frozen` 即返）。
      // ⚠️ 与另外三处调用点**同一档**：记账失败不拖垮已经落地的深改（挡在这里会让用户看到 500，
      //    而件已经搬走、账本已经截短）。代价如实写在这儿：若这一笔真写不进去，它会落到下一轮轮询里，
      //    撤销点当日被顶掉（就这一次深改而言）——那是「磁盘写不进去」那种情形，不假装它不会发生。
      try { noteStyleSpecChange(project) } catch { /* 记账失败不挡深改本身；代价见上一行 */ }
      // 深改落账完成后锚定撤销点。注意 appendEvent 每次从盘上重读并 +1，此刻盘上
      // 账高已是「深改前 + 2」（两条事件各 +1；规范被这一刀一并收走时上面那笔再 +1）
      // ——这正是撤销守卫要盯的高度，所以在改法里读**当场新读**的那份账高
      // （原先「先读一份再整份写回」的写法正是票 02 的坏形状）。
      updateMeta(project, (state) => {
        state.lastDeepModify = { id, segment: segKey, at: Date.now(), eventCountAfter: (state.eventCount ?? 0) }
      })
      // 唤醒主 AI 领重做任务（真实模式；不 kick 以免立刻追加 stage-start 事件）。
      if (meta.demo !== true) {
        try { wakeMainAI(ctx, project) } catch { /* 唤醒失败不阻塞深改 */ }
      }
      return accept({ project, segment: segKey, archived })
    }
    case 'deep-undo': {
      // 一键撤销最近一次深改（10 分钟内且账面无新进展）。
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      const last = meta?.lastDeepModify
      if (last == null || Date.now() - last.at > 10 * 60 * 1000) {
        return reject(409, '没有 10 分钟内的深改可撤销')
      }
      if ((meta.eventCount ?? 0) !== last.eventCountAfter) {
        return reject(409, '深改后账面已有新进展，撤销会丢失它们；如确要撤销请回退快照')
      }
      const file = join(archiveDir(project), 'deep', `${last.id}.json`)
      if (!existsSync(file)) { return reject(404, '深改存档文件缺失') }
      let archive = null
      try { archive = JSON.parse(readFileSync(file, 'utf8')) } catch { archive = null }
      if (archive === null || typeof archive !== 'object') {
        return reject(500, '深改存档文件损坏，无法撤销；旧版产物仍在 工作区/_旧版产物/深改-… 目录留档')
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
      return accept({ project })
    }
  }
})
