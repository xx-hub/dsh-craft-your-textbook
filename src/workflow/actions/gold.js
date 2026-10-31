/**
 * 动作族模块（架构评审候选 3，2026-09-01 拆分）：actGold
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
  goldN,
  paragraphOpinion,
  paragraphReviewText,
  readMeta,
  updateMeta,
  appendEvent,
  workFile,
  sealGoldStandard,
  wakeMainAI,
  handoff,
  handoffAndDrive,
  advance,
  kick,
  // 票 `premature-announce/01`：重做/归档前先看还有几个小助手在写（与探查那一支共用同一份实现）；
  // 以及范例章那一段的**就绪判据**（放行那一跳过它）。
  countRunningSubagents,
  goldArtifactProblems,
  // 票 `depth-review-2026-10/04`：「驳回→重做」的归档判据收进 engine 一处（三档结局 ＋ 保留策略），
  // 本文件三处归档循环换成它，不再各写一遍「尽力归档 ＋ 静默 catch」。
  archiveWorkArtifacts,
// 票 `confirm-points-redesign-build/08`：范例章「现在是第几稿」的唯一出处（站 8 结论件的
// `proposal.version` 写它）。
goldDraftVersionOf,
// 票 `demo-channel-full/26`（清仓）：修订与整版重写那两条 hint 的两个取值（真书／演示书）。
goldReviseHint,
goldRewriteAnnounce,
} from '../engine.js'
import { familyOf, reject, accept } from '../action-runner.js'
// payload 字段词汇层（票 `deep-module-scan/18` 层一）。⚠️ 本文件三处 `note` 的上限**各不相同**
//   （改进方向 500 / 交接理由 200），**不要**按数值归类共用一个名字——那是把复制变成耦合。
import {
  textField,
  textFieldRaw,
  textCoerced,
  GOLD_WISH_MAX,
  GOLD_HINT_MAX,
  GOLD_REVISE_NOTE_MAX,
  CHAPTER_SIDE_REASON_MAX,
} from './payload-fields.js'
import { rmSync, writeFileSync } from 'node:fs'
import { chapterName, auditName, chapterRel } from '../../domain-rules.js'
// 票 `confirm-points-redesign-build/08`：站 8／9 的结论件走**统一写点**（票 01 的地基）
// ——⛔ 不在这里另写一份 `工作区/决策/NN.json` 的拼路径与写盘。
// 第三轮（维护者 2026-10-16 授权）：`gold-approve` 那道「站 9 已拍板」的前置读的是同一条读侧的
// `decisionApproved()`——⛔ 不再写第二份「站 9 拍没拍」的判定。
import { recordStationDecision, readStationDecision, decisionApproved } from '../decision-record.js'


/**
 * 「站 9 还没拍板」那条 409 的**报错原文**。
 *
 * ⚠️ 它**原样上屏**（工作台那条错误条）⇒ 它是本仓判定线①③ 的一个出口，所以**单独导出**：
 * 好让它进 `test/test-wording-invariants.mjs` 那一段用词判据（避免词 ＋ 「第 N 关」第二套编号）。
 * ⛔ 导出**不是**为了让别的调用点复用它——这一句话只属于 `gold-approve` 这一跳的前置。
 *
 * 文案要点（spec §244／§535）：① 点名**前置＝站 9 已拍板**；② 说清**该怎么补**——
 * 先去站 9 点那颗「💾 保存各章字数」（＝`gold-target-words-set`，它落 `工作区/决策/09.json`）。
 * ⚠️ 票 `ui-display-redesign/07`（续）：这颗键由「💾 写回章节安排」改名 ⇒ 这句**原样上屏**的文案
 * 必须跟着引新键名（否则界面与报错各说各的键）。断言那一侧不再抄字面量，改为**引界面出口**
 * `gold-table.GOLD_WRITE_TARGETS_LABEL`（见 `test/test-wording-invariants.mjs`），从结构上防再漂。
 */
export const GOLD_APPROVE_NEEDS_STATION9 =
  '⛔ 现在还不能动这一稿：这一跳的前置＝站 9 已拍板，而站 9 那一屏的「💾 保存各章字数」还没点过（`工作区/决策/09.json` 不在）。先去站 9 点一次「💾 保存各章字数」，把逐章目标写回 `工作区/outline.md`，再回来定稿或整版重写。'


/**
 * 范例章重写/改选时归档的三份文件（**基名**：`workFile` 自己拼 `工作区/`，归档时也是把
 * `${name}.${stamp}` 拼成 `chapter-NN.md.<stamp>` 放进 `_旧版产物/`——那边认的是基名）。
 *
 * ⚠️ 这一族由 `chapterName` 单点；`audit-NN.md` 那一份属 audit 族、由 `auditName` 单点
 * （见 `gold-audit-prompt.md`；票 `context-budget/18` 复核 findings ⑥ 收掉这处手拼）。
 * 三处归档循环（改稿 / 改选 / 整版重写）共用这一个函数，别各拼一遍。
 */
function goldArchiveNames(gn) {
  return [chapterName(gn), 'style-spec.md', auditName(gn)]
}


/** 逐章目标只在最佳范例章定稿区、且尚未进入写完整本时可写。 */
export function canEditTargetWords(meta) {
  return meta?.phase === 4 && meta?.status === 'awaiting-gold' && meta?.goldSealed == null
}

/** 动作族 · 金标准：意见/修订/改选/逐章目标写回/定稿。 */
export const actGold = familyOf('gold', async ({ ctx: ctx, action: action, sessionId: sessionId, project: project, body: body, humanEvent: humanEvent }) => {
  switch (action) {
    case 'gold-opinion': {
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      // F39（2026-08-20 走查）：全章过目段级三键——带 chapter 的段落意见落 pendingReviews
      // （chapter 维度），修订回路与整章意见相同（过目态→转 running→交办修订→改完回过目卡）。
      // 只对真实模式生效（meta.demo !== true）；不带 chapter 保持原有 goldOpinions 链路不变。
      const chapters = meta?.outline?.chapters ?? []
      const chapter = Number.isSafeInteger(body.chapter) && body.chapter >= 1 ? Number(body.chapter) : null
      if (meta.demo !== true && meta.phase === 5 && chapter !== null && chapter <= chapters.length) {
        const kind = ['dislike', 'drop', 'change'].includes(body.kind) ? body.kind : null
        const wish = textField(body.wish, GOLD_WISH_MAX)
        if (kind === null || (kind === 'change' && wish === '')) {
          return reject(400, '意见需要类型；「要改成」必须补一句话（不喜欢/不需要可以只点一下）')
        }
        const target = Number.isSafeInteger(body.para) || typeof body.hint === 'string'
          ? { para: Number.isSafeInteger(body.para) ? body.para : null, hint: textFieldRaw(body.hint, GOLD_HINT_MAX) }
          : null
        const opinion = paragraphOpinion({ id: `pr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, at: Date.now(), chapter, target, kind, wish })
        // 过目态下提段落意见：与整章意见同路径——状态改在改法里（当场新读），转 running 交办修订
        // （改完回来继续过目）。原先「改在手里那份旧状态上再整份写回」会把账高带回旧值（票 02）。
        const inChaptersReview = meta.status === 'awaiting-chapters-review'
        updateMeta(project, (state) => {
          state.pendingReviews = [...(state.pendingReviews ?? []), opinion]
          state.status = 'running'
          if (inChaptersReview) {
            state.pendingStage = null
            state.chaptersReviewed = false
          }
        })
        const title = chapters[chapter - 1]?.title ?? `第${chapter}章`
        // 事件带 `reviewId`（与 meta.pendingReviews 的 id 同源）：深改截断账本时按它同步意见集合
        // （票 13，engine 的 syncPendingReviewsAfterTruncate）——两条入账路径同形状，别只改一条。
        appendEvent(project, 'textbook/review', { reviewId: opinion.id, chapter, title, comment: paragraphReviewText(opinion), para: target?.para ?? null })
        if (inChaptersReview) {
          handoff(ctx, project, 'chapters')
        } else {
          // 机器空闲或正在铺章：唤醒/让主 AI 接着处理意见（交工前必查意见）。
          const pending = meta.pendingStage
          if (pending === null || pending === undefined || pending === 'chapters') {
            if (pending === null || pending === undefined) handoff(ctx, project, 'chapters')
          }
        }
        return accept({ project, chapter, opinion, queued: true })
      }
      const inGold = meta.status === 'awaiting-gold' || meta.pendingStage === 'gold'
      if (!inGold) { return reject(409, '现在不在最佳范例章确认环节') }
      const kind = ['dislike', 'drop', 'change'].includes(body.kind) ? body.kind : null
      const wish = textField(body.wish, GOLD_WISH_MAX)
      if (kind === null || (kind === 'change' && wish === '')) {
        return reject(400, '意见需要类型；「要改成」必须补一句话（不喜欢/不需要可以只点一下）')
      }
      const target = Number.isSafeInteger(body.para) || typeof body.hint === 'string'
        ? { para: Number.isSafeInteger(body.para) ? body.para : null, hint: textFieldRaw(body.hint, GOLD_HINT_MAX) }
        : null
      const opinion = {
        id: `go-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        at: Date.now(), target, kind, wish, status: 'pending',
      }
      const withOpinion = updateMeta(project, (state) => {
        state.goldOpinions = [...(state.goldOpinions ?? []), opinion]
      })
      appendEvent(project, 'textbook/gold-opinion', {
        seq: withOpinion.goldOpinions.filter((o) => o.status !== 'revoked').length,
        opinion: { ...opinion, target: target === null ? '笼统' : (target.hint || `第${target.para}段`) },
      })
      return accept({ project, opinion })
    }
    case 'gold-opinion-revoke': {
      assertSessionOwned(project, sessionId)
      // F39：段落级意见记在 pendingReviews（chapter 维度），撤销时两处都找。
      let target
      updateMeta(project, (state) => {
        target = (state.goldOpinions ?? []).find((o) => o.id === body.id)
          ?? (state.pendingReviews ?? []).find((r) => r.id === body.id)
        if (target === undefined) return
        target.status = 'revoked'
      })
      if (target === undefined) { return reject(404, '没有这条意见') }
      // 票 09（走查 P26）：撤回**自己也要进账本**。原先这里只改 project.json 就直接 200，
      // 于是《过程记录.md》上这条意见「从没发生过任何变化」，界面与账本对「它还在不在」
      // 给出相反答案。事件类型**沿用** `textbook/gold-opinion`（不新增类型，闭包测试全绿），
      // 撤回那一支靠 `revoked: true` 认——形状照 `collab-signals.js` 的 style-note 撤回。
      appendEvent(project, 'textbook/gold-opinion', {
        id: target.id,
        ...(Number.isSafeInteger(target.chapter) ? { chapter: target.chapter } : {}),
        revoked: true,
      })
      return accept({ project })
    }
    case 'gold-revise': {
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      if (meta === null || meta.status !== 'awaiting-gold') {
        return reject(409, '当前没有等待确认的最佳范例章')
      }
      const pending = (meta.goldOpinions ?? []).filter((o) => o.status === 'pending')
      const gn = goldN(meta)
      // ── 票 `depth-review-2026-10/04`：**归档先于记账** ───────────────────────────────────
      // 原先这里是「尽力归档 ＋ 静默 catch」：旧稿搬不走时下面照样把待处理意见标成 `sent`、
      // 写下 `goldRedoNote`、记「已把你的意见带给 AI」——而 AI 那边拿到的是原封不动的旧稿。
      // 现在搬不走就当场 409，且这一支一个字节的状态都不改（意见没被消费）。
      const archived = archiveWorkArtifacts(project, goldArchiveNames(gn))
      if (archived.misses.length > 0) {
        return reject(409, `最佳范例章的旧稿没能归档（${archived.misses.join('、')}），这次修订没有生效：旧稿还留在原位，直接重做会拿它当新结果。请关掉占用这些文件的程序后重试。`)
      }
      const reviseNote = textField(body.note, GOLD_REVISE_NOTE_MAX)
      const redoNote = pending.length > 0
        ? pending.map((o, i) => `#${i + 1}（${o.target === null ? '笼统' : o.target.hint || `第${o.target.para}段`}）${o.kind === 'dislike' ? '不喜欢' : o.kind === 'drop' ? '不需要' : '要改成'}${o.wish ? `：${o.wish}` : ''}`).join('；')
        : (reviseNote !== '' ? reviseNote : null)
      // 本轮交办的意见转「AI 修订中」（新稿交工时再转「AI 已改」）＋置态，一次收进改法。
      updateMeta(project, (state) => {
        for (const o of state.goldOpinions ?? []) if (o.status === 'pending') o.status = 'sent'
        state.goldRedoNote = redoNote
        state.status = 'running'
        state.pendingStage = null
        state.pendingGate = null
      })
      // 票 `demo-channel-full/26`：这一句的两个取值（演示支**真**把意见织进新稿，
      // 只是没有 AI——读数见 `engine.goldReviseHint` 的注释）。
      appendEvent(project, 'textbook/hint', { text: goldReviseHint(meta) })
      handoffAndDrive(ctx, project, 'gold')
      return accept({ project, redoNote })
    }
    case 'gold-chapter-set': {
      // 对话/界面改选样例章：未定稿且未进入铺章前可改；旧样例章产物存在则先归档再重交办。
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      const pick = Number(body.chapter)
      if (!Number.isSafeInteger(pick) || pick < 1 || pick > (meta?.outline?.chapters ?? []).length) {
        return reject(400, '章号不合法')
      }
      if (meta.goldSealed != null || meta.phase >= 5) {
        // 票 10（判定一 #3/#4）：这两条 409 会渲染到人眼，统一说「最佳范例章」。
        return reject(409, '最佳范例章已定稿/写完整本已开始；要换最佳范例章请先驳回重做')
      }
      // 控制器裁决（F10）：gold 修订在飞（pendingStage=gold）时允许改选样例章——AI 交工后自然写新章；
      // 其余 AI 回合进行中一律拦住，避免打断它手里的活。
      if (meta.status === 'running' && meta.pendingStage !== 'gold') {
        return reject(409, '我正在做；等交工或先暂停，再改最佳范例章')
      }
      const gn = goldN(meta)
      // 票 `depth-review-2026-10/04`：归档先于记账——旧稿搬不走就当场 409，`goldChapter` 一个字不改。
      const outcome = archiveWorkArtifacts(project, goldArchiveNames(gn))
      if (outcome.misses.length > 0) {
        return reject(409, `最佳范例章的旧稿没能归档（${outcome.misses.join('、')}），这次改选没有生效：旧稿还留在原位，直接重写会拿它当新结果。请关掉占用这些文件的程序后重试。`)
      }
      const archived = outcome.items.filter((item) => item.outcome === 'deleted').length
      // 改选落账走单一入口（当场新读）：原先拿请求开头那份旧状态整份写回（票 02 的形状）。
      updateMeta(project, (state) => {
        state.goldChapter = pick
        state.status = 'running'
        state.pendingStage = null
        state.pendingGate = null
      })
      appendEvent(project, 'textbook/gold-chapter', { chapter: pick, reason: textCoerced(body.reason, CHAPTER_SIDE_REASON_MAX), archived })
      appendEvent(project, 'textbook/hint', { text: `📐 最佳范例章改为第 ${pick} 章${archived > 0 ? '（旧的最佳范例章已留档，正在重写）' : ''}。` })
      // ── 票 `flow-audit-2026-10/05`：这里原先**逐字保留**的「双 kick」已收成一次 ──────────────
      // 旧形状：`else { void kick(...); if (meta.demo === true) void kick(...) }`。`kick` 不幂等
      // （`runners` 是覆盖式 Map，两次 = 两个 runLoop 并行），演示书在这条路上会起两趟。
      // 现在这一行只留一次；真正的「不重入」在拍板入口：`gate-decide` 只有在没有等在
      // `runGate` 的那一趟时才 `kick`（见 `actions/gates.js` 的 `resolveGateDecision` 那一行）。
      // ⚠️ 改这里是**行为变更**，由票 `flow-audit-2026-10/05` 裁决；`demo-exemptions.js` 的
      // `demo-self-drive` 锚点同批改成这一行。
      if (archived > 0 || meta.phase >= 4) handoffAndDrive(ctx, project, 'gold')
      else { void kick(ctx, project) }
      return accept({ project, goldChapter: pick })
    }
    case 'gold-draft-approve': {
      // ── 站 8「这一稿行不行」的两颗键（票 `confirm-points-redesign-build/08`，口径出处＝
      //    规划票 `confirm-points-redesign/07` 的 `## Answer` §3）────────────────────────
      // ① `approved:true`「✅ 就用这一稿」⇒ **只落 `工作区/决策/08.json`**：⛔ 不推进阶段、
      //    ⛔ 不盖范例章印（那些是站 9 之后那一下，`gold-approve` 一个字没动）。
      // ② `approved:false`「🔁 不满意，重写这一章」⇒ **同一支的负向出口**：「驳回也留」
      //    （04 §1）＋ 今天那颗「整版重写」的行为原样（归档旧稿 → 记 goldRedoNote → kick）。
      // ③ 中间那条**修订回路**（写意见 →「让 AI 改」→ 出下一稿 → 再看）**不落结论件**——
      //    它走 `gold-revise`，一个字节都不经这里。
      // ⚠️ `version`（结论件自己的「这一站第几次拍板」）由 `recordStationDecision` 从盘上
      //    上一份 ＋1 现读——重写一次就是站 8 内部再拍一次，⛔ 不新开确认点、⛔ 不新增
      //    `awaiting-*` 值。`proposal.version` 另有一义＝**第几稿**（`goldDraftVersionOf`）。
      assertSessionOwned(project, sessionId)
      const { approved } = body
      if (typeof approved !== 'boolean') {
        return reject(400, 'gold-draft-approve 需要 approved: true/false')
      }
      const meta = readMeta(project)
      if (meta === null || meta.status !== 'awaiting-gold') {
        return reject(409, '当前没有等待确认的最佳范例章')
      }
      const gn = goldN(meta)
      const draftVersion = goldDraftVersionOf(project, meta)
      if (approved === false) {
        // ── 票 `premature-announce/01`：重做前先看还有几个小助手在写（与 `gold-approve`
        //    反向那一支同一个病、同一条处置——归档会把它们正在写的三件一起搬走）。
        const running = await countRunningSubagents(ctx, sessionId)
        if (running !== null && running > 0) {
          // ⚠️ 单行调用是**有意的**（同 `gold-approve` 那一支）：账本产物字段对账表的锚点
          // 按源码子串登记、一格一行。
          const redoHint = `⛔ 现在还不能重写这一章：还有 ${running} 个小助手在写范例章这一段的产物。等它们回来再点；想马上重写，先在对话里让 AI 停掉它们。`
          appendEvent(project, 'textbook/hint', { text: redoHint })
          return reject(409, `还有 ${running} 个小助手在写范例章这一段的产物，现在归档会把它们正在写的东西一起搬走——等它们回来再重写。`)
        }
        // 归档先于记账（票 `depth-review-2026-10/04`）：搬不走就当场 409，
        // `goldRedoNote` 一个字不写、结论件也不落（这一次拍板没有生效）。
        const archived = archiveWorkArtifacts(project, goldArchiveNames(gn))
        if (archived.misses.length > 0) {
          return reject(409, `最佳范例章的旧稿没能归档（${archived.misses.join('、')}），这次重写没有生效：旧稿还留在原位，直接重写会拿它当新结果。请关掉占用这些文件的程序后重试。`)
        }
        updateMeta(project, (state) => {
          state.goldRedoNote = '整版重写：不参考上一稿的结构与表述，按学习目标与材料全新生成；用户意见仅作为方向参考。'
          state.status = 'running'
        })
        appendEvent(project, 'textbook/hint', { text: goldRewriteAnnounce(meta) })
      }
      // ⚠️ **驳回也留**：不落这一份，界面就无从知道「用户已经对稿子表态了」（站 8／9 的
      // 区分全靠这份件，⛔ 不靠新状态值）。
      recordStationDecision(project, 8, {
        approved,
        decidedBy: 'human',
        humanEvent,
        proposal: { file: chapterRel(gn), version: draftVersion },
        reasons: approved === true
          ? [`第 ${draftVersion} 稿通过`]
          : [`第 ${draftVersion} 稿不满意，已归档重写`],
      })
      if (approved === false) void kick(ctx, project)
      return accept({ project, approved, draftVersion })
    }
    case 'gold-target-words-set': {
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      if (meta === null) {
        return reject(404, '项目不存在')
      }
      if (!canEditTargetWords(meta)) {
        return reject(409, '写完整本已经开始，逐章目标请走「定点修改 · 章节安排」修改。')
      }

      const chapters = meta.outline?.chapters
      if (!Array.isArray(chapters) || chapters.length === 0) {
        return reject(400, '当前还没有章节安排，不能写回逐章目标')
      }
      const updates = body.targets
      if (!Array.isArray(updates) || updates.length === 0) {
        return reject(400, '请至少提供一章的逐章目标')
      }

      const normalized = new Map()
      for (const update of updates) {
        const n = Number(update?.n)
        const targetWords = Number(update?.targetWords)
        if (!Number.isSafeInteger(n) || n < 1 || n > chapters.length) {
          return reject(400, '逐章目标的章号不合法')
        }
        if (!Number.isFinite(targetWords) || targetWords < 500 || targetWords > 50000) {
          return reject(400, '每章目标请填 500-50000 汉字')
        }
        if (n === goldN(meta)) {
          return reject(400, '最佳范例章的原定目标不能改；实测只作标定依据')
        }
        if (normalized.has(n)) {
          return reject(400, `第 ${n} 章目标重复了，请只保留一项`)
        }
        normalized.set(n, Math.round(targetWords))
      }

      const updated = updateMeta(project, (state) => {
        for (const [n, targetWords] of normalized) state.outline.chapters[n - 1].targetWords = targetWords
      })
      writeFileSync(
        workFile(project, 'outline.md'),
        JSON.stringify({ ...updated.outline, chapters: updated.outline.chapters }, null, 2),
        'utf8',
      )
      // ── 站 9 的**拍板**（票 `confirm-points-redesign-build/08`，口径出处＝规划票 07 §3）──
      // 「💾 保存各章字数」（票 `ui-display-redesign/07` 改名；原名「写回章节安排」）这一颗键
      // **升格**成站 9 的拍板键：一次点击＝① 字数写回
      // `meta.outline.chapters[].targetWords` ② 当场重写 `工作区/outline.md` ③ 落这份结论件。
      // ⛔ 前三步今天的样子一个字没改（最佳范例章的原定目标不能改、`canEditTargetWords`
      // 那一档、不新造字段、不写 `meta.targetWords`）——本票只**加**这第三样。
      // `version: null` ＝「非方案文档」（票 05 §2 已裁；本件指回的是章节安排，不是一份方案正文）。
      recordStationDecision(project, 9, {
        approved: true,
        decidedBy: 'human',
        humanEvent,
        proposal: { file: '工作区/outline.md', version: null },
        reasons: [`写回 ${[...normalized].length} 章的逐章目标`],
      })
      return accept({ project,
        targets: [...normalized].map(([n, targetWords]) => ({ n, targetWords })),
        canEditTargetWords: true })
    }
    case 'gold-approve': {
      // 最佳范例章确认：true → 继续写全书；false → 删掉重写。可同时设置每章目标字数。
      assertSessionOwned(project, sessionId)
      const { approved } = body
      if (typeof approved !== 'boolean') {
        return reject(400, 'gold-approve 需要 approved: true/false')
      }
      const goldMeta = readMeta(project)
      if (goldMeta === null || goldMeta.status !== 'awaiting-gold') {
        return reject(409, '当前没有等待确认的最佳范例章')
      }
      // ── 前置：**站 9 已拍板**（spec §244／§535；维护者 2026-10-16 明确授权这一笔）──────────
      // 站 8／9 拆两屏之后，站 9 屏末尾那颗「确认，定稿」与它旁边那颗「🔁 整版重写」在界面上
      // **都**钉在 `!station9Decided` 上（`src/ui/gold-table.js`）；而 AI 那条路（本动作
      // `agentCallable: true`，见 `src/contract-actions.js`）打的是**同一条 HTTP 动作**
      // ⇒ 这道前置只做在界面＝AI 那条路可以绕过那颗键直接定稿。
      // ⇒ 拦在**这一段自己的就绪判据**这里：与下面 `approved:true` 那一支的
      // `goldArtifactProblems`（「放行那一跳也过一遍这一段自己的就绪判据」）同一条纪律，
      // ⛔ 不在路由层再抄一份。
      // ⚠️ **两支同形**：定稿（true）与推翻重写（false）都要过——界面上那两颗键同挂一个条件。
      // ⚠️ 排在 `body.targetWords` 那段之前是**有意的**：那段会写 meta ＋ 落一笔 hint，
      // 被拦下的这一跳必须**一分账都不落**。
      // 「站 9 拍没拍」的读数**只有一处**：`decision-record.js` 的 `decisionApproved()`。
      if (!decisionApproved(readStationDecision(project, 9))) {
        return reject(409, GOLD_APPROVE_NEEDS_STATION9)
      }
      if (typeof body.targetWords === 'number' && Number.isFinite(body.targetWords) && body.targetWords >= 500) {
        // 兼容旧单值：仅作未填章的兜底。走单一入口（当场新读）先落账——意见为空时下面 approved 路径
        // 不写状态，兜底值会随 advance 重读丢失。
        updateMeta(project, (state) => { state.targetWords = Math.round(body.targetWords) })
        appendEvent(project, 'textbook/hint', { text: '汉字数以每章清单为准；这个统一值只作未填章的兜底。' })
      }
      if (approved === true) {
        // ── 票 `premature-announce/01`（③）：**放行那一跳也过一遍这一段自己的就绪判据** ──────────
        // 与探查／骨架／交付三处同一条纪律。⚠️ 它**不翻** `ADR-0034` 裁决甲——裁决甲管的是
        // `engine.js` 那道「稿在盘就提前展示」的**置态**闸门（有意，一个字不动）；这里管的是**放行**：
        // 三件产物（正文／写作规范／检查记录）真在盘上，才让书往前走。
        const notReady = goldArtifactProblems(project, goldMeta)
        if (notReady.length > 0) {
          // ⚠️ 单行调用是**有意的**：账本产物字段对账表（`docs/协作模型.md` §2.8 表 B）的锚点按源码
          // 子串登记、一格一行——写成多行就只能用泛锚点，核不到这一处。
          const goldNotReadyHint = `⛔ 还不能定稿：${notReady.join('；')}。`
          appendEvent(project, 'textbook/hint', { text: goldNotReadyHint })
          return reject(409, `还不能定稿：${notReady.join('；')}`)
        }
        // 定稿沉淀：把尚未撤销的意见转成风格线（source:'gold'），并记金标准母版版本号。
        // 抽到 engine 的 sealGoldStandard（票 15④）：stage-submit gold 在 gold-skip 豁免下自动定稿时
        // 走的是**同一个**沉淀函数，两条路径不许各写一份。它自己去读当场状态，不收meta参数（票 02）。
        sealGoldStandard(project)
        appendEvent(project, 'textbook/hint', { text: '✅ 范例章已确认，开始写全书。' })
        advance(project, 4, 5)
        void kick(ctx, project)
      } else {
        // ── 票 `premature-announce/01`：**重做前先看还有几个小助手在写**（反向那一支）──────────
        // 与探查那支同一个病、同一条处置：归档会把小助手正在写的三件（正文／检查记录／写作规范）
        // 一起搬走。⛔ 不去收回它们（`ctx.subagents.interrupt` 是登记过的禁读成员）；只拒收＋说明。
        // ⚠️ `null` ＝ 数不出来 ⇒ **不拦人**。
        const running = await countRunningSubagents(ctx, sessionId)
        if (running !== null && running > 0) {
          // ⚠️ 单行调用是**有意的**：账本产物字段对账表（`docs/协作模型.md` §2.8 表 B）的锚点按源码
          // 子串登记、一格一行——写成多行就只能用泛锚点，核不到这一处。
          const redoHint = `⛔ 现在还不能整版重写：还有 ${running} 个小助手在写范例章这一段的产物。等它们回来再点；想马上重写，先在对话里让 AI 停掉它们。`
          appendEvent(project, 'textbook/hint', { text: redoHint })
          return reject(409, `还有 ${running} 个小助手在写范例章这一段的产物，现在归档会把它们正在写的东西一起搬走——等它们回来再重写。`)
        }
        // 归档范例章产物（rmSync 在部分盘上失效，用移动代替删除）。
        // 票 `depth-review-2026-10/04`：归档先于记账——搬不走就当场 409，`goldRedoNote` 一个字不写。
        const gN = goldN(goldMeta)
        const archived = archiveWorkArtifacts(project, goldArchiveNames(gN))
        if (archived.misses.length > 0) {
          return reject(409, `最佳范例章的旧稿没能归档（${archived.misses.join('、')}），这次整版重写没有生效：旧稿还留在原位，直接重写会拿它当新结果。请关掉占用这些文件的程序后重试。`)
        }
        // 整版重写：明确告知 AI 这不是逐条修订，是推翻重来（意见保留为方向）。
        // 走单一入口（当场新读）：「最后动静时刻」只归「记一笔」所有，改法里不再自己写 updatedAt。
        updateMeta(project, (state) => {
          state.goldRedoNote = '整版重写：不参考上一稿的结构与表述，按学习目标与材料全新生成；用户意见仅作为方向参考。'
          state.status = 'running'
        })
        appendEvent(project, 'textbook/hint', { text: goldRewriteAnnounce(goldMeta) })
        void kick(ctx, project)
      }
      return accept({ project, approved })
    }
  }
})
