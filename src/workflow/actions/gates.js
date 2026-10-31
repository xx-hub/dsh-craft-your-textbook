/**
 * 动作族模块（架构评审候选 3，2026-09-01 拆分）：actGates
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
// 章节正文路径／审计记录路径：正文那份在 `domain-rules.js`（票 `depth-review-2026-10/05`），
// 审计记录那份同处（票 `context-budget/18` 复核把 `工作区/audit-NN.md` 的拼法也收进单点）；
// `gateHuman` 是闸门名的唯一读法（票 `walkthrough-fixes/19` 那一族）。
import { chapterRel, auditRel, readingName, knowledgeShardName, WORK_DIR_NAME, DETAIL_DIR_REL, PROPOSAL_DIR_REL, gateHuman, checkBlocksDelivery } from '../../domain-rules.js'
// 票 `rcb-build/04`：站 2 确认动作的**载荷与落点唯一写点**（共享件）——`values` 那一格的形状闸
// （出口闭集；票 11 收窄成两条，退役的 `answerer`／`draft` 当场点名）都从它读（⛔ 本文件不另写枚举）。
// ⚠️ 票 11：收卷人的写点**已搬走**（回卷动作 `reader-questionnaire-submit` 写 `meta.answerer`），
// 本文件不再从 `values.answerer` 落 meta。
import { exploreConfirmValuesProblems } from '../../explore-confirm-contract.js'
// 票 `confirm-points-redesign-build/01`（票面落点 (a)）：结论件的**唯一写点**。
// ⛔ 本文件只调它一次（与下面那一笔账同一处），不在这里拼第二个形状。
import { recordStationDecision, STATION_OF_GATE, STATION_EXPLORE, STATION_EXPLORE_BODY_REL, STATION_GOALS, STATION_GOALS_TITLE } from '../decision-record.js'
// 票 `confirm-points-redesign-build/05`：站 3 的正文（`工作区/目标-vM.md`）与「那 3–5 条」的形状上限。
// ⚠️ 文件名的拼法、版本号怎么数、渲染成什么样**只有 `goal-doc.js` 一处**——本文件不手拼。
import { goalDocRel, GOAL_COUNT_MAX, readGoalDocOnDisk, writeGoalDoc } from '../goal-doc.js'
import {
  assertSessionOwned,
  // 票 `premature-announce/01`：源探查「盘上产物齐没齐」的唯一一份判据（置态/放行/交工三处共用）。
  exploreArtifactProblems,
  // 同票：章节骨架那一段的就绪判据（比探查那份窄，窄处写在它自己的注释里）。
  outlineArtifactProblems,
  // 同票：交付不可撤回 ⇒ 放行那一刻当场重算一次硬检查（不拿账上那份快照当现状）。
  runQualityChecks,
  noteStyleSpecChange,
  // 同票：`countRunningSubagents` 搬进了 engine（暂停与「重做/归档前」两处共用同一份实现）。
  countRunningSubagents,
  readMeta,
  updateMeta,
  appendEvent,
  writeSnapshot,
  restoreSnapshot,
  foldGate,
  workDir,
  chapterGateMiss,
  resolveGateDecision,
  handoffAndDrive,
  advance,
  kick,
  // 票 `depth-review-2026-10/04`：归档（「驳回→重做」那条链的判据）与它的保留策略上移到 engine，
  // 六条路径共用同一份实现——本文件不再内联任何归档循环，也不再持有 `ARCHIVE_KEEP`。
  archiveWorkArtifacts,
  ARCHIVE_KEEP,
  // 票 `demo-channel-full/24`：驳回章节安排那两条 hint 的**唯一出口**（两取值：真书／演示书，
  // 见它自己的注释）——⛔ 本文件不再持第二份措辞。
  outlineRedoHint,
// 票 `demo-channel-full/26`（清仓）：探查驳回那两条 hint ＋ 终检「不满意」那两条（错误条与 hint）
// ——同一族的两个取值（真书／演示书），出口收在 engine，⛔ 本文件不拼第二份措辞。
exploreRedoHint,
finalRejectNeedsNote,
finalRejectedHint,
} from '../engine.js'
// payload 字段词汇层（票 `deep-module-scan/18` 层一）。本文件三个 case（拍板 / 两条重做）
// 读的是**同一个** `note` 字段、同一个 500 字上限 ⇒ 共用 `GATE_NOTE_MAX` 一个常量。
import { textField, GATE_NOTE_MAX } from './payload-fields.js'
// 票 `walkthrough-fixes/37`：驳回意见的拆条契约（形状与判据只住那一份，⛔ 本文件不另写一份）。
import { finalRedoItemsProblem, normalizeFinalRedoItems, clipQuote } from '../final-redo.js'
// 票 `flow-audit-2026-10/01`：交付前四条硬条件（留言／进度账本／五份分查报告／style-spec 指纹）
// 与 `stage-submit(final)` **共用同一份只读判据**——⛔ 两跳各写一套。
import { finalDeliveryProblems } from './chapters.js'
import { familyOf, reject, accept } from '../action-runner.js'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'


/**
 * 拍板动作的两条校验报错（错误条 / 回给主 AI 的话都算界面词，判定线①③；界面不叫「关卡」）。
 * 导出以便用词不变量断言直调**真实报错文本**（票 01），不在测试里复制文案。
 */

/** 提案对不上号（gate/version 不匹配，或压根没有待拍板的提案）。 */
export function gateMismatchError(current) {
  return `拍板状态不匹配（当前: ${current === null ? '无' : `${current.gate} v${current.version} ${current.status}`}）`
}

/** 该次拍板已经拍过了（不能重复拍板）。 */
export function gateAlreadyDecidedError(current) {
  return `第 ${current.gate} 次拍板已${current.status === 'approved' ? '通过' : '驳回'}，不能重复拍板`
}


/**
 * 探查重做要归档的两件产物（归档与清点都只认这一份清单，不在别处再抄一遍文件名）。
 * `knowledge-map.json` 可能压根没生成（那一版探查没写知识地图），循环里按存在性跳过。
 *
 * ⚠️ 票 03 之后它只管**两份固定名**的件；精读派发按材料落下的 `reading-NN.md` /
 * `knowledge-map-NN.json` 由 {@link exploreRedoArtifactNames} 现场枚举（份数随材料数变，
 * 写死清单装不下）——重做那一圈两份都不搬的话，新旧分片会混在同一本书的 `工作区/` 里。
 */
const EXPLORE_REDO_ARTIFACTS = Object.freeze(['explore.md', 'knowledge-map.json'])

/**
 * 票 03 · ADR-0030 决策 2：精读派发落下的两族**按材料分号**的产物（`NN` = 材料序号，两位）。
 * 这一条正则同时认两种形状：`工作区/` 原位的裸件、`_旧版产物/` 里带 base36 时间戳的归档件。
 *
 * ⚠️ **形状从 `domain-rules` 的两个出口派生**（`readingName` / `knowledgeShardName`），不另写一份
 * （code-review S2）：这里原先手抄 `reading-\d{2}\.md|knowledge-map-\d{2}\.json`，于是
 * 「改名」变成**静默失配**——生产者（brief 的 `parallelReads`）已经按新名写了，认领这一族
 * 归档的正则却还认旧名，重做时 `工作区/` 原位那几片搬不走、`_旧版产物/` 里那几片清不掉，
 * 而新旧的混账一直长胖。派生的做法把这一族钉回它的单一出处：
 * **改 `domain-rules` 那两个函数就同时改了这里**。
 *
 * 派生方式：基名逐字转义后，把那个**两位序号**换成 `\d{2}`——序号位可匹配，其余一个字都不动。
 * （`escapeRegExp` 不转义数字，所以转义后的字符串里 `01` 仍以原样出现。）
 */
function escapeRegExp(literal) {
  return literal.replace(/[.*+?^${}()|[\]\\-]/g, (c) => `\\${c}`)
}
const shardNameShape = (name) => escapeRegExp(name).replace(/\d{2}/g, String.raw`\d{2}`)
const EXPLORE_SHARD_ARTIFACT_RE = new RegExp(
  `^(?:${shardNameShape(readingName('01'))}|${shardNameShape(knowledgeShardName('01'))})(?:\\.[0-9a-z]+)?$`,
)

/**
 * 本次探查重做要归档的产物全集 = 两份固定件 ∪ 盘上现存的精读分片件／细目件。
 *
 * ⚠️ **票 11：精读细目换家了**（工作区根 → `工作区/细目/`），所以这一族现在**跨两个目录**，
 * 只扫 `工作区/` 会让细目留在原位、和新一轮混在同一本书里——而 `stage-submit(explore)`
 * 的细目存在性断言会把上一轮的旧细目当这一轮的交账（正是探查笔记 §6.9 说的那个静默失配）。
 * 于是这里扫**两个源目录**，并把每一件的**书夹相对路径**一起交出去（`rel`）：
 * 动作层若靠 `workFile(project, name)` 反推，它只会拼工作区根、对细目恒 miss。
 *
 * 三处各答一个问题：
 * - `work`：这一轮留下什么（要搬走的正是这些）；
 * - `detail`：细目那一族（票 11 起在子目录里）；
 * - `archive`：清理策略认得哪些产物名（某一轮材料比现在多时，早先搬走的那几片照样归
 *   `ARCHIVE_KEEP` 管，否则 `_旧版产物/` 会随着材料数单调长胖——那正是这族当初「只进不出」的病）。
 *
 * 归档件那边的名字要**还原成基名**（`精读-01.md.m3fk2` → `精读-01.md`）：归档件的真名
 * 是「基名 + 时间戳」，直接把整个 entry 当产物名会让 {@link trimExploreArchive} 的
 * `<名>.<时间戳>` 匹配对不上（等于没纳入清理）。
 *
 * @param {string} work 该书的 `工作区/` 目录
 * @param {string} archive `工作区/_旧版产物/` 目录（可与 `work` 同一个，默认如此）
 * @returns {Array<{name: string, rel: string}>} 文件名（不含目录）＋ 它的书夹相对路径
 */
export function exploreRedoArtifactEntries(work, archive = work) {
  const detail = join(work, ...DETAIL_DIR_REL.split('/').slice(1))
  // 键＝产物基名（清理策略按它归堆），值＝那一件在书夹里的相对路径（动作层按它搬）。
  const out = new Map(EXPLORE_REDO_ARTIFACTS.map((name) => [name, `${WORK_DIR_NAME}/${name}`]))
  for (const [dir, relDir, inArchive] of [
    [work, `${WORK_DIR_NAME}`, false],
    [detail, DETAIL_DIR_REL, false],
    [archive, `${WORK_DIR_NAME}/_旧版产物`, true],
  ]) {
    let entries = []
    try { entries = readdirSync(dir) } catch { continue }
    for (const entry of entries) {
      if (!EXPLORE_SHARD_ARTIFACT_RE.test(entry)) continue
      const name = inArchive ? entry.slice(0, entry.lastIndexOf('.')) : entry
      if (!out.has(name)) out.set(name, `${relDir}/${name}`)
    }
  }
  return [...out].map(([name, rel]) => ({ name, rel }))
}

/**
 * 本次探查重做要归档的**文件名**全集——{@link exploreRedoArtifactEntries} 的一份投影
 * （`trimExploreArchive` 与判据要的只是名字；动作层要的是来处，那份用 entries）。
 *
 * ⚠️ 签名保持 `(work, archive = work)`：它是判据直调的那一个出口，别为了加第三个参数改形状。
 *
 * @param {string} work 该书的 `工作区/` 目录
 * @param {string} archive `工作区/_旧版产物/` 目录（可与 `work` 同一个，默认如此）
 * @returns {string[]} 文件名（不含目录）
 */
export function exploreRedoArtifactNames(work, archive = work) {
  return exploreRedoArtifactEntries(work, archive).map((entry) => entry.name)
}

/**
 * **站 3 那一个停点的拍板**（票 `confirm-points-redesign-build/05`）。
 *
 * 它与站 2 那一支**不是**同一件事，所以是另一个函数（同一个 `awaiting-explore` 状态值下的
 * **第二个**停点，由 `meta.exploreConfirmed` 折出；见 `case 'goal-confirm'` 那条注释）：
 *
 * - **粒度＝整批一次过**（spec §3.2 站 3）：`approved:true` ⇒ 把（可能被人逐条改／删／加过的）
 *   那一批**整份**认下来；`approved:false` ⇒ **整份驳回重拟**，⛔ 不逐条勾。
 *   ⇒ 载荷里的 `goals` 是**用户拍板的那一份**（界面逐条编辑的结果），机器用它**原地重写**
 *   `工作区/目标-vM.md`——下游（站 4）读的就是这一份，所以「拍过板的那几条」必须落盘，
 *   否则 AI 的原稿会冒充人认下来的那一份。
 * - **落点**：`工作区/决策/03.json`（走票 01 那个统一写点函数，
 *   `proposal: {file: 工作区/目标-vM.md, version: M}`）。⚠️ 站 3 **不写 `values`**——
 *   spec 明写站 6 是唯一带结构化值的一站；这几条目标的正文就是那份文件本身。
 * - **驳回也留**（票 01 的纪律②）：`approved:false` 照写一份同形的，它的读者是「重写这几条」
 *   那一次交办件。
 * - ⛔ **不连带作废目标**：这一支**不归档**那一份文件（重写那一趟写的是**下一版**，
 *   上一版留在原地——与 `关卡N-vM.md` 的多版共处同形）。
 *
 * ⚠️ 机器验的只有「那一份在 ＋ 它有几条」；「这几条到底算不算可检验」机器一个字都不读
 * （spec §3.2 站 3 的强度：硬闸 1 条 ＋ 只有承诺 1 条）。
 */
async function confirmStationGoals(ctx, project, body, humanEvent) {
  const approved = body.approved === true
  const onDisk = readGoalDocOnDisk(project)
  if (onDisk.version === 0) {
    // 硬闸：站 3 那一趟的产物不在 ⇒ 没有可拍板的东西。它不在只有一种可能——那一趟没跑或被人删了。
    return reject(409, `还没有可拍的「学完能做到什么」：${goalDocRel(1)} 一族的目标件不在盘上。先让 AI 跑完那一趟再来。`)
  }
  const proposal = { file: goalDocRel(onDisk.version), version: onDisk.version }
  if (approved) {
    // 人在卡上逐条改／删／加之后交回来的那一份；没带就认盘上那一份（「不改」也是一次正当拍板）。
    const edited = Array.isArray(body.goals) ? body.goals : null
    const rawGoals = edited ?? onDisk.goals
    const nonStringGoal = rawGoals.findIndex((goal) => typeof goal !== 'string')
    if (nonStringGoal !== -1) {
      return reject(400, `这几条目标的第 ${nonStringGoal + 1} 条不是文本：目标卡交回来的必须是字符串数组（一条一句话）。`)
    }
    const goals = rawGoals.map((goal) => goal.trim()).filter((goal) => goal !== '')
    if (goals.length === 0) {
      return reject(409, '这几条目标一条都不剩了——要么留下至少一条，要么点「🔁 让 AI 重写这几条」。')
    }
    if (goals.length > GOAL_COUNT_MAX) {
      return reject(409, `这几条目标有 ${goals.length} 条，超了上限 ${GOAL_COUNT_MAX} 条——请先收敛到一条一句。`)
    }
    if (edited !== null) writeGoalDoc(project, onDisk.version, goals)
    // 界面那张卡要知道「该读哪一版」——版本号随盘上那一份一起记在账本上（**指针**，不是第二份真相）。
    updateMeta(project, (meta) => { meta.goalDocVersion = onDisk.version })
    const event = appendEvent(project, 'textbook/hint', { text: '🎯 「学完能做到什么」已确认，开始做教学设计。' })
    recordStationDecision(project, STATION_GOALS, {
      approved: true,
      decidedAt: new Date(event.time ?? Date.now()).toISOString(),
      // 票 `decision-provenance/01`：调用方声称 human 只是**声称**——`humanEvent` 在账本里
      // 查得到才落 human，否则写点强制降级 machine＋autoSkipped（⛔ 不再靠「只有人点得动」的口头假设）。
      decidedBy: 'human',
      humanEvent,
      // ⚠️ 正名：`stationTitle(3)` 只回「第 3 站」（`GATE_OF_STATION` 只有 4／5／6），
      // 而 spec §3.2 站 3 那一节的主题是这一句——落点名归文案面那一票，本票只把 `title` 给值。
      title: STATION_GOALS_TITLE,
      proposal,
    })
    // 站 3 拍完 ⇒ 才真正离开源探查那一段（站 2 拍板时**不**推进：那时站 3 那一趟还没跑）。
    advance(project, 2, 3)
    void kick(ctx, project)
    return accept({ project, approved: true, version: onDisk.version, goals: goals.length })
  }
  const reasons = Array.isArray(body.reasons)
    ? body.reasons.filter((item) => typeof item === 'string' && item.trim() !== '').slice(0, 5)
    : []
  const note = textField(body.note, GATE_NOTE_MAX)
  const feedback = [...reasons, note].filter((text) => text !== '')
  const redoEvent = appendEvent(project, 'textbook/hint', {
    text: feedback.length > 0
      ? `🔁 这几条目标不合格，AI 会照你的意见重写（${feedback.join('；')}）。`
      : '🔁 这几条目标不合格，AI 会重写一份。',
  })
  updateMeta(project, (meta) => { meta.goalRedoNote = feedback.length > 0 ? feedback.join('；') : null })
  // 驳回也留（纪律②）：它的读者是下面那次交办（重写那一趟要看用户上一句说了什么）。
  // ⚠️ 写在交办**之前**：交办那一刻会快照，而结论件是「这一站拍过什么」的件，不是那一次的输入。
  recordStationDecision(project, STATION_GOALS, {
    approved: false,
    decidedAt: new Date(redoEvent.time ?? Date.now()).toISOString(),
    decidedBy: 'human',
    humanEvent,
    reasons,
    userNote: note,
    title: STATION_GOALS_TITLE,
    proposal,
  })
  // 「让 AI 重写这几条」与探查驳回同一条口径（走 `handoffAndDrive`：演示书没有主 AI 可唤醒，
  // 由它补一次 kick）。⚠️ 这里**只归档不搬件**——目标那一份留着，重写写的是下一版。
  handoffAndDrive(ctx, project, 'goal', null, '重写「学完能做到什么」这几条之前')
  return accept({ project, approved: false })
}

/** 动作族 · 关卡拍板：'gate-decide' / 'explore-confirm'（含站 3 那一个停点）/ 'outline-confirm' / 'chapters-review-confirm' / 'final-approve' / 'final-redo-items' / 'rollback'。 */
export const actGates = familyOf('gates', async ({ ctx: ctx, action: action, sessionId: sessionId, project: project, body: body, humanEvent: humanEvent }) => {
  switch (action) {
    case 'gate-decide': {
      const { gate, version, approved, mode, reasons, note } = body
      const gateId = String(gate)
      if ((gateId === '' || gateId === 'undefined') || typeof version !== 'number' || typeof approved !== 'boolean') {
        return reject(400, 'gate-decide 需要 gate/version/approved')
      }
      assertSessionOwned(project, sessionId)
      const current = foldGate(project)
      if (current === null || current.gate !== gateId || current.version !== version) {
        return reject(409, gateMismatchError(current))
      }
      if (current.status !== 'awaiting') {
        return reject(409, gateAlreadyDecidedError(current))
      }
      // ── 票 `confirm-points-redesign-build/06`：**站 4（第 1 关）在这里把「这本书主要怎么学」拍定** ──
      // 站 4 那张卡（`GatePanel` 的 `isStation4` 支）随「通过」交上 `human` / `blueprint` 两个
      // **生产取值**之一；拍板这一刻写进 `meta.route`，**拍板即锁定**——⛔ 没有单独的「改路线」动作，
      // 要改＝驳回第 1 关重拍（那时这张卡再问一次，这一格照旧随「通过」交上来、覆盖旧值）。
      // ⚠️ 三条边界，缺一不可：① 只有**第 1 关**认这一格（第 2／3 关那两张卡不问它）；
      // ② 只有**通过**才写（驳回＝让 AI 重做，不锁任何值）；③ 值只认那两个（⛔ 不在这里收一个
      // 「生产永不产出的写法」——那正是本票要修的那处活漂移）。都不成立 ⇒ **一个字都不动**。
      const routeChoice = gateId === '1' && approved === true
        && (body.route === 'human' || body.route === 'blueprint')
        ? body.route
        : null
      const event = appendEvent(project, 'textbook/gate-decision', {
        gate: gateId,
        version,
        approved,
        mode: typeof mode === 'string' ? mode : null,
        reasons: Array.isArray(reasons) ? reasons.filter((item) => typeof item === 'string') : [],
        note: typeof note === 'string' ? note : '',
      })
      // 票 `confirm-points-redesign-build/01` · 结论件（票面落点 (a)）：**拍板那一刻**由机器落一份
      // `工作区/决策/NN.json`——与上面那一笔账**同一处**调用（「一个统一函数、⛔ 不十处各写一遍」）。
      // 「站 0 不留／从站 1 起一站一份／驳回也留」三条纪律的出处见 `decision-record.js` 文件头。
      // ⚠️ 站号只对得上 4／5／6（＝关卡 1／2／3，同一处写的三站）。其余各站的写点（站 2／3／8／9）
      // 归别的票：本票不替它们编一份假的结论件，`STATION_OF_GATE` 里没有就**不写**。
      // ⚠️ `proposal.file` 照 spec §4.1 那张表写**规范形状**的书夹相对路径（老书上盘里那份是
      // 旧名那一份，读侧由 `bookRelOnDisk` 自己兜底——⛔ 不在这里按盘上名字写死）。
      const station = STATION_OF_GATE[gateId]
      if (station !== undefined) {
        recordStationDecision(project, station, {
          approved,
          decidedAt: new Date(event.time ?? Date.now()).toISOString(),
          // 票 `decision-provenance/01`：`humanEvent` 由工作台 adapter 落、AI 通道不落 ⇒
          // 人点的那一跳记 human，AI 代拍的那一跳被写点降级成 machine＋autoSkipped。
          decidedBy: 'human',
          humanEvent,
          reasons: Array.isArray(reasons) ? reasons.filter((item) => typeof item === 'string') : [],
          userNote: typeof note === 'string' ? note : '',
          proposal: { file: `${PROPOSAL_DIR_REL}/关卡${gateId}-v${version}.md`, version },
          // 票 `confirm-points-redesign-build/07`：本关提案带进来的**结构化值**（第 3 关的
          // `{chapters: N}`，从 `stage-submit` 的 `values` 经账本折到 `current.values`）——
          // 拍板这一刻落进结论件的 `values`，章数政策（`chapters.js` 的 `case 'outline'`）与站 7 的
          // 章数**非阻断对账读数**读的都是它（**一处真相**；2026-10-27 起不再拒收）。
          // ⚠️ 没有值的站**不长这个键**（不填 `null` 占位）。
          ...(current.values === undefined ? {} : { values: current.values }),
        })
      }
      // 票 `walkthrough-fixes/19`③ · **补验**：用户回到这一关做出了裁决 ⇒ 那条「已跳过（未验）」
      // 不再是这一关的现状——**通过**时它转成「已验」（补验那一条路），**驳回**时这一关回到
      // 「等你拍板」（跳过被取代；否则 `stepSkipped` 会让状态机继续越过一个刚被驳回的关）。
      // ⚠️ 与豁免不同：这里**不写** `meta.waivers`（跳过与豁免不是同一条通路）。
      updateMeta(project, (state) => {
        state.skippedSteps = (state.skippedSteps ?? []).filter((s) => s?.step !== `gate-${gateId}`)
        // 站 4 拍板即锁定路线（见上面 `routeChoice` 那三条边界；`null` ⇒ 这一格不动）。
        if (routeChoice !== null) state.route = routeChoice
      })
      // 原先这里还「读状态 → meta.updatedAt = event.time → 整份写回」：那个写回纯属多余
      // （appendEvent 已经把 updatedAt 记成 event.time），却会把账高带回读状态那一刻的旧值（票 02）。已删。
      // ⚠️ 票 `deep-module-scan/10`：原先这里直接 `gateWaiters.get(project)`、比对 `gate`/`version`
      // 两个字段、再 `.resolve()`——也就是 `gateWaiters` 的三字段协议**有一半住在这个文件里**。
      // 现在只说「兑现这一次的拍板」，比对与兑现都在 engine 内（`resolveGateDecision`）。
      // 票 `flow-audit-2026-10/05`：**这一笔已经兑现了等在 `runGate` 里的那一趟**——
      // 它会被唤醒并继续跑下一关；再 `kick` 就是第二条 runLoop，两趟会各生成一份同版提案。
      // 只有「没有在等的 runLoop」（重启后/账本已推进）才需要新起一趟。
      if (resolveGateDecision(project, gateId, version) === false) void kick(ctx, project)
      return accept({ project, event })
    }
    case 'explore-confirm': {
      // 用户确认探查结果：true → 进设计；false → 归档重做（可带一句"哪里不满意"，重做时 AI 必看）。
      assertSessionOwned(project, sessionId)
      const exMeta = readMeta(project)
      if (exMeta === null || exMeta.status !== 'awaiting-explore') {
        return reject(409, '当前没有等待确认的探查结果')
      }
      // ── 票 `confirm-points-redesign-build/05`：**同一个停点状态、两个停点** ────────────────────
      // 站 2 与站 3 共用 `awaiting-explore` 这一个值（⛔ 不新增 `awaiting-*` 值），
      // 「现在是哪一件事」由**账本折出**：`meta.exploreConfirmed` 是站 2 拍板那一刻写下的那一格
      // （先例＝关卡那一路的 `foldGate`：状态值不变、折叠出子状态）。
      //
      // ⚠️ **第二个停点上要一声明确的「这是站 3 那件事」**（`stage: 'goal'`）：不认的话，
      // 站 2 那一颗键**重复发一次**（用户连点、界面重发）就会把 AI 刚拟的那几条**默默**认下来
      // ——人根本没上过那一屏，而这一票的全部意义就是让他上。⇒ 没带那一声的请求在这里 409
      // （它想拍的**站 2** 那件事已经拍过了），⛔ 不静默分流。
      if (exMeta.exploreConfirmed === true) {
        if (String(body.stage ?? '') !== 'goal') {
          return reject(409, '这一屏已经是「学完能做到什么」那一个停点了（上一件事已经拍过板）：请在那一张卡上表态（`stage: goal`）。')
        }
        return confirmStationGoals(ctx, project, body, humanEvent)
      }
      const approved = body.approved === true
      // ── 票 `confirm-points-redesign-build/10`：**载荷不再闭集** ────────────────────────────
      // 病（spec §6 末段那条硬事实）：站 2 那个确认动作原先只能带「过没过 ＋ 理由若干条 ＋ 意见若干字」
      // （而且放行那一支连理由与意见都没有），**带不上问卷的结果**；而 rcb 的读者情况问卷那一块
      // 正要落在这张卡上（`08` §2：收卷人 ＋ 填卷入口 ＋ 回卷粘贴）⇒ 载荷必须开一个口。
      //
      // 口径：`body.values` —— **这一站的结构化值**（rcb 那一族）：把调用方递进来的那个对象**原样**
      // 交给结论件的 `values`（spec §4.1：`values` ＝「这一站的结构化值，机器可读的标量／小数组」；
      // 没有值的站不长这个键）。
      // ⚠️ 形状闸：不是对象／数组就当场 400（调用方把请求写错了是 B 类，⛔ 不静默丢掉它——
      //    丢掉就等于「用户填的问卷结果在结论件里不见了」，而那正是这条口子要治的病）。
      // —— 票 `rcb-build/04` ＋ 票 `ui-display-redesign/11`：`values.exit` 这一格的形状闸住**唯一写点**
      //    `explore-confirm-contract.js`（出口闭集；退役的 `answerer`／`draft` 当场点名）。
      //    ⚠️ 它**只对界面那条路**声称强度：`agent-tool` 那条窄路不带 `values`（spec §6.8 裁决一）。
      //    ⚠️ 票 11：收卷人的写点**已搬走**——这里不再从 `values.answerer` 写 `meta.answerer`
      //    （它由回卷动作 `reader-questionnaire-submit` 写；见 `actions/chapters.js`）。
      const exValues = body.values === undefined || body.values === null ? undefined : body.values
      const exValuesProblems = exploreConfirmValuesProblems(exValues)
      if (exValuesProblems.length > 0) {
        return reject(400, `explore-confirm 的 values（这一站的结构化值，如问卷结果）形状不对：${exValuesProblems.join('；')}`)
      }
      if (approved) {
        // ── 票 `premature-announce/01`：**放行那一跳过同一份就绪判据**────────────────────
        // 病（2026-10-10 实跑）：这一段还没做完就点「满意」，原先会 200 并 `advance(2,3)` 把书推过去，
        // 而 `工作区/knowledge-map.json` 只在交工成功支里诞生 ⇒ 它**永久缺位**；回去的路又被
        // `stage-submit` 的 pendingStage 闸焊死（那条 400 指着「先补探查交工」，而那一跳当天走不通）。
        // ⚠️ 判据与置态、交工验货**同一份**（`exploreArtifactProblems`）——⛔ 不许在这里另抄一份枚举。
        // ⚠️ 这不是「调用方把请求写错了」那类 409：是**用户的一次真实动作被系统挡住**，所以照本文件
        //    「归档没生效」那条先例**落一条账再拒收**（`CONTEXT.md`「验货」词条 2026-10-10 的例外条）。
        const notReady = exploreArtifactProblems(project, exMeta).problems
        if (notReady.length > 0) {
          appendEvent(project, 'textbook/hint', {
            text: `⛔ 还不能确认探查结果：${notReady.join('；')}。这几件是机器验过的产物——等它们落齐再确认；要重来就点「🔁 让 AI 重做」。`,
          })
          return reject(409, `还不能确认探查结果：${notReady.join('；')}`)
        }
      }
      if (approved) {
        updateMeta(project, (meta) => {
          meta.exploreConfirmed = true
          meta.status = 'running'
          meta.pendingStage = null
          meta.pendingGate = null
          delete meta.exploreRedoNote
          // 票 pipeline-wiring-gaps/08：这一轮「来回 N 次」到此为止——用户认了这份报告，下一轮再计数。
          delete meta.exploreRedoCount
          // ⚠️ 票 `ui-display-redesign/11`：`meta.answerer` 的写点**已搬走**——它由回卷动作
          // `reader-questionnaire-submit` 的 `answerer` 字段写（`actions/chapters.js`）。
          // 这一跳⛔ 不再写它：`values.answerer` 已被形状闸 400 拒收，收卷人也不该由「拍板」冒充。
          // 「那一版的身份」⛔ 不在这里落：身份由结论件 `values.exit` 现算（spec §6.8 裁决二）。
        })
        const exEvent = appendEvent(project, 'textbook/hint', { text: '✅ 探查结果已确认，开始拟「学完能做到什么」。' })
        // ── 票 `confirm-points-redesign-build/04`：**站 2 的结论件**（`工作区/决策/02.json`）──────
        // 与上面那一笔账**同一处**调用票 01 那个统一写点函数（⛔ 不另写一份写侧）。
        // ⚠️ 站号＝**2**（`STATION_EXPLORE`）：站 2 **不是关卡站**，`STATION_OF_GATE` 里没有它
        // ⇒ 这里直接给站号，⛔ 不借关卡那条派生（`STATION_OF_GATE['2']` 指的不是站 2，是站 5）。
        // `proposal.file` 照 spec §3.2 站 2 那一行写探查报告；这一站没有「第几版」的概念 ⇒ `version: null`。
        recordStationDecision(project, STATION_EXPLORE, {
          // 票 `confirm-points-redesign-build/10`：停点主题**正名**（同一个停点、总数不变）。
          // ⚠️ 这里**不传 `title`**：`stationTitle(2)` 现在自带「第 2 站 · AI 读得对不对 ＋ 这本书
          // 教到哪儿」（登记在 `decision-record.js` 的 `STATION_TOPIC`）——传一份带前缀的字符串
          // 就是同一个名字的第二处来源（票 04 那时必须显式传，是因为那时那张表里还没有站 2）。
          approved: true,
          decidedAt: new Date(exEvent.time ?? Date.now()).toISOString(),
          // 票 `decision-provenance/01`：与 `gate-decide` 同一口径——人类事件在账本里查得到
          // 才落 human；`agent-tool.js` 的代点没有那条事件 ⇒ 降级 machine＋autoSkipped。
          decidedBy: 'human',
          humanEvent,
          proposal: { file: STATION_EXPLORE_BODY_REL, version: null },
          // 票 `confirm-points-redesign-build/10`：问卷结果（`body.values`）**原样**进结论件；
          // 没带就不长这个键（「没有值的站不写这个键」那条口径不动）。
          ...(exValues === undefined ? {} : { values: exValues }),
        })
        // ── 票 `confirm-points-redesign-build/05`：站 2 拍完**不直接进设计** ─────────────────────
        // 站 3 那 3–5 条目标**由站 2 拍板之后另跑的一趟**产出（Q9 甲：那一趟要吃站 2 刚划掉的
        // 那些卡 ⇒ ⛔ 不跟探查同一趟）⇒ 这里交办 `goal` 那一趟，`advance(2,3)` 挪到站 3 拍板
        // 那一支（`confirmStationGoals`）。⚠️ 走 `handoffAndDrive`：演示书没有主 AI 可唤醒，
        // 由它补一次 kick（与既有六条确认闸门同一条口径）。
        handoffAndDrive(ctx, project, 'goal', null, '拟「学完能做到什么」之前')
        return accept({ project, approved: true })
      } else {
        // ── 票 `premature-announce/01`：**重做前先看还有几个小助手在写**（反向那一支）──────────
        // 病：这一段还在被写的时候点「让 AI 重做」，下面那段归档会把小助手**正在写**的产物一起搬进
        // `_旧版产物/`（搬走的那一份它再也写不回来）。
        // ⚠️ 处置**不是**去收回它们：`ctx.subagents.interrupt` 在本仓是登记过的禁读成员
        //（`dev/host-contract-gate/catalog/web-chat.js` 的 `forbiddenMemberReads`），
        //「收回小助手是主笔 AI 自己的事」——所以这里只**拒收 ＋ 说明**。
        // ⚠️ `null` ＝ 数不出来 ⇒ **不拦人**（「不知道」不是「有人在跑」；同「读不出不判旧」那条口径）。
        const running = await countRunningSubagents(ctx, sessionId)
        if (running !== null && running > 0) {
          appendEvent(project, 'textbook/hint', {
            text: `⛔ 现在还不能重做：还有 ${running} 个小助手在写这一段的产物，这一刻归档会把它们正在写的东西一起搬走。等它们回来再点「让 AI 重做」；想马上重做，先在对话里让 AI 停掉它们。`,
          })
          return reject(409, `还有 ${running} 个小助手在写这一段的产物，现在归档会把它们正在写的东西一起搬走——等它们回来再重做。`)
        }
        // 用户意见（可选）：理由点选 + 一句话，随重做交办带给 AI（重做唯一的改进方向）。
        const reasons = Array.isArray(body.reasons)
          ? body.reasons.filter((r) => typeof r === 'string' && r.trim() !== '').slice(0, 5)
          : []
        const note = textField(body.note, GATE_NOTE_MAX)
        const feedback = [...reasons, note].filter((t) => t !== '')
        // 票 pipeline-wiring-gaps/08：归档不再「尽力」——逐件记成败，**任一件没搬走就当场回错误**。
        // 旧件留在原位时，下一轮 `runPhase2`（engine.js「产物已存在 → 等人确认」）见到
        // `explore.md` 还在就直接短路返回，于是用户点完「让 AI 重做」看到的还是上一轮那份
        // 一模一样的报告，他写的意见又会在点「满意」时被删掉——那一次重做从来没发生过，
        // 而整条路径全程静默。
        // ⚠️ 票 `depth-review-2026-10/04`：那三段内联循环收进 `engine.archiveWorkArtifacts`——
        // 它是六条「驳回→重做」路径**共用**的那一份判据（三档结局、保留策略都在那儿），
        // 本文件只负责「拿 misses 拼话术 ＋ 决定拒收」。文案逐字未动。
        // 票 03：清单是**算出来的**（固定两件 + 盘上现存的精读分片件／细目件），不是写死的那两个字面量。
        // 票 11：取 entries 而不是 names——细目在 `工作区/细目/` 子目录里，
        // `workFile(project, name)` 对它恒 miss（那会拼成 `工作区/<name>`），所以来处要一起带上。
        const work = workDir(project)
        const redoEntries = exploreRedoArtifactEntries(work, join(work, '_旧版产物'))
        const archived = archiveWorkArtifacts(project, redoEntries)
        const archiveMisses = archived.misses
        if (archiveMisses.length > 0) {
          // 一件都没交办：既不改状态，也不写 meta.exploreRedoNote——用户点「满意」时
          // 旧报告原样还在，意见没被消费过，也就不该在这里被「用掉」。
          // 意见本身记进账本（hint），所以它不会随这一次失败悄悄消失。
          appendEvent(project, 'textbook/hint', {
            text: `↩️ 探查重做没有生效：旧报告没能归档（${archiveMisses.join('、')}），它还留在原位。`
              + (feedback.length > 0 ? `你的意见（${feedback.join('；')}）已经记在这条账里，不会丢。` : '')
              + '请把正在占用这些文件的程序关掉（编辑器、同步盘、杀毒软件都可能占着）再点一次。',
          })
          return reject(409, `旧报告没能归档（${archiveMisses.join('、')}），这次「让 AI 重做」没有生效：旧报告还留在原位，直接重做会拿它当新结果。请关掉占用这些文件的程序后重试。`)
        }
        const trimmed = archived.trimmed
        let redoCount = 0
        updateMeta(project, (meta) => {
          meta.status = 'running'
          meta.pendingStage = null
          meta.pendingGate = null
          meta.exploreRedoNote = feedback.length > 0 ? feedback.join('；') : null
          // 票 pipeline-wiring-gaps/08：探查侧的「来回几次了」（关卡侧是 `countRejections` 从账本折叠出来的，
          // 探查没有 gate-decision 事件，所以这份计数记在账本 meta 上，**唯一写入点就是这一行**）。
          // 记的是「真的重做过几次」：归档被闸门拒掉的那一次不算——那一次重做没有发生。
          meta.exploreRedoCount = (meta.exploreRedoCount ?? 0) + 1
          redoCount = meta.exploreRedoCount
        })
        const redoEvent = appendEvent(project, 'textbook/hint', {
          // 票 `demo-channel-full/26`：这两句的措辞收进 `engine.exploreRedoHint(note, meta)`
          // （两取值；演示书那侧不许说「AI 在重新探查」——读数见那个函数的注释）。
          text: exploreRedoHint(feedback.join('；'), exMeta),
        })
        // 票 `confirm-points-redesign-build/04` · 站 2 的结论件：**驳回也留**（`approved: false`）——
        // 它的读者是「重做这一站」那次交办件（票 01 的纪律②）。⚠️ 写在归档成功之后：上面那条
        // `reject` 的路径（旧件没搬走 ⇒ 这次重做**没有发生**）不该留下一份说「用户驳回了」的件。
        recordStationDecision(project, STATION_EXPLORE, {
          // 票 `confirm-points-redesign-build/10`：**驳回那一支也带同一份开口**——主题正名走
          // `stationTitle(2)`（⛔ 不在这里再写一份），`body.values` 两支同形。
          approved: false,
          decidedAt: new Date(redoEvent.time ?? Date.now()).toISOString(),
          decidedBy: 'human',
          humanEvent,
          reasons,
          userNote: note,
          ...(exValues === undefined ? {} : { values: exValues }),
          // ⚠️ 归档把旧报告搬进了 `_旧版产物/`，这一刻这个路径上**没有**文件——但它就是这一站的
          // 正文（重跑出来的新报告还写在这里），照 spec §3.2 那一行写**规范形状**。
          proposal: { file: STATION_EXPLORE_BODY_REL, version: null },
        })
        if (trimmed.removed > 0 || trimmed.failed > 0) {
          appendEvent(project, 'textbook/hint', {
            text: `🧹 归档清理：清掉了 ${trimmed.removed} 份更早的旧件（每种产物只留最近 ${ARCHIVE_KEEP} 份）`
              + (trimmed.failed > 0 ? `，另有 ${trimmed.failed} 份没清掉（文件被占用），留着不影响重做。` : '。'),
          })
        }
        // 措辞与关卡那一族一致（`runGate` 每 3 次一条）：反复驳回时提醒用户换思路，
        // 而不是让 AI 一份份地交几乎一样的报告。
        if (redoCount % 3 === 0) {
          appendEvent(project, 'textbook/hint', {
            text: `探查已经来回 ${redoCount} 次了。如果一直不满意，可以在对话里调整目标或换一种思路，或者用「定点修改」回到源探查重新来。`,
          })
        }
        handoffAndDrive(ctx, project, 'explore', null, '驳回探查结果、重做之前')
        return accept({ project, approved: false })
      }
      return
    }
    case 'outline-confirm': {
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      if (meta === null || meta.status !== 'awaiting-outline') {
        return reject(409, '当前没有等待确认的章节安排')
      }
      if (body.approved === true) {
        // ── 票 `premature-announce/01`：放行那一跳过一遍**这一段自己的**就绪判据 ──────────────
        // 与探查那两跳同一条纪律：不拿「状态已经推到 awaiting-outline」当「这一段真做完了」。
        // ⚠️ 这一份判据比探查那份窄（它只断盘上那两件）——窄处写在 `engine.outlineArtifactProblems`
        //    的注释里，别在这里另立一份。
        const notReady = outlineArtifactProblems(project, meta)
        if (notReady.length > 0) {
          appendEvent(project, 'textbook/hint', {
            text: `⛔ 还不能确认章节安排：${notReady.join('；')}。`,
          })
          return reject(409, `还不能确认章节安排：${notReady.join('；')}`)
        }
      }
      const note = textField(body.note, GATE_NOTE_MAX)
      const pick = Number(body.goldChapter)
      // ── 票 `depth-review-2026-10/04`：**归档先于记账** ───────────────────────────────────
      // 原先这一支是「先 updateMeta（清 outline、把意见记进 outlineRedoNote）、再记
      // `outline-decision`、最后才尽力归档 ＋ 静默 catch」——旧稿搬不走时，账上已经写着
      // 「章节安排已驳回、你的意见已带给 AI」，而 `工作区/outline.md` 原样躺在原位，下一轮
      // 直接把旧稿当新结果。现在归档搬到这一支的**最前面**：任一件没搬走就当场 409，
      // 状态一个字不改、意见一个字不记（也就没被消费），用户点得到重试。
      // ⚠️ 只挡**驳回**那一支：放行（approved=true）本来就不归档。
      if (body.approved !== true) {
        const archived = archiveWorkArtifacts(project, ['outline.md'])
        if (archived.misses.length > 0) {
          return reject(409, `章节安排的旧稿没能归档（${archived.misses.join('、')}），这次驳回没有生效：旧稿还留在原位，直接重排会拿它当新结果。请关掉占用这些文件的程序后重试。`)
        }
      }
      // 改选最佳范例章也要改在改法里（当场新读那份状态）：下面两笔事件之间原先夹着一次整份写回，
      // 会把账高带回读状态那一刻的旧值（票 02）。
      let pickedGold = false
      updateMeta(project, (state) => {
        if (body.approved === true && Number.isSafeInteger(pick) && pick >= 1 && pick <= (state.outline?.chapters ?? []).length) {
          if (state.goldChapter !== pick) {
            state.goldChapter = pick
            pickedGold = true
          }
        }
        if (body.approved === true) {
          state.status = 'running'
          delete state.outlineRedoNote
          // 驳回重排时 handoff 记过 pendingStage='outline'；拍板通过必须清掉，
          // 否则 stale 残留到 phase4/5（2026-09-03 实测：UI 误显「AI 干活中·章节骨架」）。
          state.pendingStage = null
          state.pendingGate = null
        } else {
          delete state.outline
          state.status = 'running'
          state.pendingStage = null
          state.pendingGate = null
          if (note !== '') state.outlineRedoNote = note
        }
      })
      if (pickedGold) {
        // 票 10（判定一 #3/#4）：「样例章」是界面词表外的叫法，这条 hint 会渲染到人眼，统一成「最佳范例章」。
        appendEvent(project, 'textbook/hint', { text: `📐 最佳范例章定为第 ${pick} 章。` })
      }
      const outlineEvent = appendEvent(project, 'textbook/outline-decision', { approved: body.approved === true, note })
      // ── 票 `confirm-points-redesign-build/15`：**站 7（章节安排）的写点** ─────────────────────
      // spec §3.2 站 7 的「落点」＝`工作区/决策/07.json`；「产出」那一行逐字给了正文
      //（`proposal.file = 工作区/outline.md`、`version = null`——章节安排**没有「第几版」**
      // 这个概念，重排写的是同一个文件名，与 `explore.md` 同形）。
      // ⛔ 形状只走票 01 那一个统一写点（九个键 ＋「没有值就不长 `values`」），本处不拼第二份；
      // ⛔ **两支都要留**（spec §4.1「驳回也留」）：**通过**那一份是站 8 的「上一站结论」
      //（下游那句指针指的就是它），**驳回**那一份的读者是「重做这一站」那次交办件。
      // ⚠️ 写在归档**之后**（驳回那一支的归档在这一支的最前面，搬不走就当场 409 了）：走到这里
      // ＝「这次驳回真的生效了」——与站 2 那条先例同口径（没发生的重做不落一份说「用户驳回了」的件）。
      // ⚠️ `version`（这一站第几次拍板）由 `recordStationDecision` 从盘上上一份 ＋1 现读，⛔ 不在这里数。
      // 票 `decision-provenance/01`：`humanEvent` 由工作台 adapter 落、AI 通道不落；写点据此
      // 决定 human／machine（与站 2／3 同一处判定，⛔ 不在这里做第二份判断）。
      recordStationDecision(project, 7, {
        approved: body.approved === true,
        decidedAt: new Date(outlineEvent.time ?? Date.now()).toISOString(),
        decidedBy: 'human',
        humanEvent,
        userNote: note,
        // ⚠️ 路径从 `WORK_DIR_NAME` 拼（⛔ 不手抄第二个 `工作区` 字面量）——与站 9 那条
        // `gold-target-words-set` 写的是**同一个文件**（spec §4.1 那张表的第 9 行「它改的那一份」）。
        proposal: { file: `${WORK_DIR_NAME}/outline.md`, version: null },
      })
      if (body.approved === true) {
        appendEvent(project, 'textbook/hint', { text: '✅ 章节安排已确认，开始写最佳范例章。' })
        advance(project, 3, 4)
        void kick(ctx, project)
      } else {
        // 归档已在上面（这一支的最前面）做完——搬不走就在那儿 409 了，走到这里说明旧稿
        // 确实搬走了，下面这几笔才是「这次重做真的生效」的记账。
        // 票 `demo-channel-full/24`：这两句的措辞收进 `engine.outlineRedoHint(note, meta)`
        // （两取值；演示书那侧不许说「AI 在重新安排」——读数与约束见那个函数的注释）。
        appendEvent(project, 'textbook/hint', { text: outlineRedoHint(note, meta) })
        handoffAndDrive(ctx, project, 'outline')
      }
      return accept({ project, approved: body.approved === true })
    }
    case 'chapters-review-confirm': {
      // 全章过目确认：true → 开始合并；false → 记账 chaptersReviewed=false（可继续改意见，不会并发合并）。
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      if (meta === null || meta.status !== 'awaiting-chapters-review') {
        return reject(409, '当前没有等你过目的章节')
      }
      // 票 10 的服务端收口（死条件收口 · 票 14 的连带）：**确认过目时重验全书 chapterDone**。
      // 原先这里只看 status，于是「用户点翻案（review-revoke 把意见写回 pending）」之后书仍停在
      // awaiting-chapters-review，能直接确认 → 合并 → 交付——票 10「退回去之后这本书重新被这条意见拦住」
      // 就成了空话（真旁路）。判据复用 engine 的同一份 chapterDone / chapterGateMiss，**不写第二份**。
      if (body.approved === true) {
        const chapters = meta.outline?.chapters ?? []
        const misses = chapters
          .map((chapter, index) => ({ n: index + 1, chapter, miss: chapterGateMiss(project, index + 1, meta) }))
          .filter((row) => row.miss !== null)
        if (misses.length > 0) {
          const why = misses.slice(0, 3).map((row) => {
            const title = row.chapter?.title ?? ''
            // 两项都取 `domain-rules` 的出口：正文是 `chapterRel`（书夹相对路径，票
            // depth-review-2026-10/05）、审计记录是 `auditRel`（票 `context-budget/18` 复核
            // findings ⑥ 收掉这处手拼）——两者同属一句人话、同一族词，所以都是相对路径形。
            const what = row.miss.reason === 'artifact'
              ? `缺产物（${chapterRel(row.n)} / ${auditRel(row.n)}）`
              : row.miss.reason === 'stale'
                ? '检查记录比正文旧（正文改过之后没重新审计，那份「审过」是旧稿的）'
                : row.miss.reason === 'review'
                  ? '还有未处置的抽查意见'
                  : '没有机器记下的交工通过（还没按章交工）'
            return `第${row.n}章${title === '' ? '' : `《${title}》`}：${what}`
          })
          return reject(409, `还没到能交工的时候：${why.join('；')}。逐章处置完（改稿 → 重新审计 → 交工点名）机器才会放行过目。`)
        }
      }
      // 过目记账与「开始合并」的置态一次收进改法（原先分两次整份写回，后一次还落在
      // 「记一笔」之后——账高会被带回旧值，票 02）。
      updateMeta(project, (state) => {
        state.chaptersReviewed = body.approved === true
        if (body.approved === true) {
          state.status = 'running'
          state.pendingStage = null
        }
      })
      appendEvent(project, 'textbook/chapters-review', { approved: body.approved === true })
      if (body.approved === true) {
        appendEvent(project, 'textbook/hint', { text: '✅ 全章过目通过，开始合并成书。' })
        handoffAndDrive(ctx, project, 'merge')
      }
      return accept({ project })
    }
    case 'final-approve': {
      // 终检结果认可（2026-08-26 用户拍板）：approved=true → 交付；false + note → 交办终检修订（原地循环）。
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      if (meta === null || meta.status !== 'awaiting-final-approval') {
        return reject(409, '当前没有等你认可的最后检查结果')
      }
      if (body.approved === true) {
        // ── 票 `premature-announce/01`：交付**撤不回**，所以放行那一刻**当场重算**一次硬检查 ──────
        // 原先这一支只判 `meta.status === 'awaiting-final-approval'`，一条产物、一项检查都不验；
        // 而那个状态另有别的写入点（演示支就在不判检查结果的情况下置它）。
        // ⚠️ **演示书是这条闸的分叉**（登记在 `src/demo-exemptions.js` 的 `final-approve-hard-checks`）：
        //    演示通道的 `awaiting-final-approval` 由 `engine.js` 的演示支置下、**有意不判检查结果**
        //    （它跑的是内置回放夹具，硬检查里那几项在它身上没有来源）——这是登记过的结构性到不了，
        //    不是本闸放水；真书一律当场重算。
        // ⚠️ 这里**不列**失败项的名字：检查名的界面译法住在前端（`src/ui/view-rules.js` 的 `CHECK_UI`），
        //    服务端不 import 前端模块。但**要列它自己的 `note`**——那一行是人读的、已点名到章／文件，
        //    拒收没有落点时用户只能再猜是哪一章（票 `audit-state-regression/01`）。
        //    逐项结论仍由工作台那一屏完整呈现；这里只带前几条，避免 409 被一串长注文撑爆。
        // ⚠️ **重跑本身会抛**（实测：盘上什么都没有时 `runQualityChecks` 直接 ENOENT）——那也算「不能交付」，
        //    所以这里连异常一起收下：**验不了就不放行**（⛔ 不许因为「检查跑不起来」把书放过去）。
        let rerunChecks = null
        if (meta?.demo !== true) {
          let failed = null
          try {
            // 票 `walkthrough-fixes/19`③：第三态 `state:'skipped'`（用户跳过的关卡）**不算没过**——
            // 跳过是推迟＋记账，不是取消验货、也不是新增一道拦人的闸。它照样逐条进交付清单
            // （`runQualityChecks` 里那一族行的 `ok` 仍是 false，所以下游读 `ok` 的地方仍看到「未验」）。
            rerunChecks = runQualityChecks(project)
            failed = rerunChecks.filter(checkBlocksDelivery)
          } catch (error) {
            const why = error instanceof Error ? error.message : String(error)
            ctx?.logger?.warn?.(`textbook: 交付放行时重跑最后检查出错（按「不能交付」处置）: ${why}`)
            appendEvent(project, 'textbook/hint', {
              text: `⛔ 还不能交付：机器当场重跑最后检查时出错（${why}）——验不了就不放行。`,
            })
            return reject(409, `还不能交付：机器当场重跑最后检查时出错（${why}）——验不了就不放行，先修好再认可。`)
          }
          if (failed.length > 0) {
            // 票 `audit-state-regression/01`：拒收要**点名**（哪一章、正文与检查记录各是什么时间），
            // 不能只报「有 N 项没过」——人拿到一句没有落点的拒收，只能再猜是哪一章的旧稿。
            // 取的是检查行自己的 `note`（点名的唯一出处；⛔ 不在这里另拼一份，⛔ 不拿机器名顶替）。
            // ⚠️ 带**前三条**而不是只带第一条：`成品文件齐全` 之类排在前面时，只带第一条会把
            //    「有章节 stale」那条挤掉，而它才是本票要人看见的那一格。
            const details = failed
              .slice(0, 3)
              .map((check) => String(check?.note ?? '').trim())
              .filter((text) => text !== '')
            const detailClause = details.length === 0
              ? ''
              : `：${details.join('；')}${failed.length > details.length ? '；…' : ''}`
            appendEvent(project, 'textbook/hint', {
              text: `⛔ 还不能交付：机器当场又核了一遍最后检查，有 ${failed.length} 项没过${detailClause}（工作台那一屏逐项看得到是哪几项）。`,
            })
            return reject(409, `还不能交付：机器当场又核了一遍最后检查，有 ${failed.length} 项没过${detailClause}`)
          }
          // ── 票 `flow-audit-2026-10/01`：**四条不在 `runQualityChecks` 里的交付前硬条件** ──────────
          // 留言全部销号／进度账本在位／五份分查报告在位可读／style-spec 指纹对得上。它们原先只在
          // `stage-submit(final)` 验过一次；交工之后、认可之前改坏，旧实现照样交付。
          // 判据与交工那一跳**共用** `finalDeliveryProblems`（⛔ 不另写一套），逐条点名。
          // ⚠️ 排在 `runQualityChecks` **之后**：空盘/红项那些既有拒收（409「项没过／出错」）的读数
          // 一个字不变；这一层只补上硬检查**根本不看**的那四件。
          // 票 12 · ①：先把「写作规范变更」那一笔补记进账（这一跳没有 report，但留痕仍要落），
          // 再判「对不上」；atApproval 让拒收文案说清「这一跳没有 report 通道」的出路。
          try { noteStyleSpecChange(project) } catch { /* 补记失败也照旧判 */ }
          const deliveryProblems = finalDeliveryProblems(project, readMeta(project), { atApproval: true })
          if (deliveryProblems.length > 0) {
            const first = deliveryProblems[0]
            appendEvent(project, 'textbook/hint', { text: `⛔ 还不能交付：${first.message}` })
            return reject(first.status, first.message)
          }
        } else {
          // 演示书是**登记过的结构性豁免**（`src/demo-exemptions.js` 的 `final-approve-hard-checks`）：
          // 它不重跑硬检查。但交付账上⛔ 不许静默变成 0 条——显式记一行「未当场重跑」，
          // 让「这一格没验」在交付面看得见（票 01 的判据：抹空 `meta.finalChecks` 后账上仍有 it）。
          rerunChecks = [{
            name: '认可交付当场重跑',
            ok: false,
            state: 'not-rechecked',
            note: '演示书按登记豁免（src/demo-exemptions.js 的 final-approve-hard-checks）未当场重跑：交付账上复用的是交工那一刻的读数，标为「未检查」，不算通过。',
          }]
        }
        // 交付账取**这一次**的结果（票 `flow-audit-2026-10/01`）：真书＝刚重跑那一份；演示书＝
        // 只有那一行显式的 `not-rechecked`。⛔ 不抄 `delivered.finalChecks`、也不把旧读数混进来
        // ——旧 `ok:true` 行会被渲染成 ✅，那就是把「没重跑」说成「过了」。
        const deliveryChecks = meta?.demo === true ? [...rerunChecks] : (rerunChecks ?? [])
        const delivered = updateMeta(project, (state) => {
          state.status = 'delivered'
          state.finalApprovedAt = Date.now()
          // 票 `flow-audit-2026-10/06`：交付是终态，交办标记不许残留（旧实现留着 `pendingStage=merge`）。
          state.pendingStage = null
          state.pendingGate = null
          // 交付账读的就是这一份：本次重跑（演示书：显式 not-checked ＋ 旧读数）。
          state.finalChecks = deliveryChecks
          // 票 `walkthrough-fixes/37`：交付之后这份逐条去向已经「用过」——认可卡不再显示，
          // 留着它只会让下一轮（定点修改／回退）读到上一轮的条目。
          delete state.finalRedoItems
          delete state.finalRedoCheck
        })
        appendEvent(project, 'textbook/final-approve', { approved: true })
        // 票 `walkthrough-fixes/19`③ · **交付面**：被跳过的每一步在交付那一刻**逐条可见**，
        // ⛔ 不许被折进「已通过」的计数。那一族的机器行由 `runQualityChecks` 出（`state:'skipped'`），
        // 这里再落一条人读的账，让「交付完了、但哪几关没验」在流水账里也逐条点得到名。
        const skippedAtDelivery = delivered.skippedSteps ?? []
        if (skippedAtDelivery.length > 0) {
          appendEvent(project, 'textbook/hint', {
            text: `⏭ 交付清单里有 ${skippedAtDelivery.length} 条「已跳过（未验）」：`
              + skippedAtDelivery.map((s) => `${s.label ?? s.step}（结论未知，补验落在${s.makeupAt ?? '交付前'}）`).join('；')
              + '。它们没有被算进「已通过」——想补验就在拍板卡上把那一关补拍一次。',
          })
        }
        appendEvent(project, 'textbook/delivery', {
          checks: deliveryChecks,
          note: `交付完成！点「下载《${delivered.name ?? ''}》.md」保存成品。`,
        })
        return accept({ project, delivered: true })
      }
      const note = textField(body.note, GATE_NOTE_MAX)
      if (note === '') {
        // 票 `demo-channel-full/26`：这一句原样上屏（错误条）⇒ 同族的两个取值。
        return reject(400, finalRejectNeedsNote(meta))
      }
      // 原地循环：交办终检修订，AI 按意见改整本 → 重新硬检查 → 再给用户认可。
      updateMeta(project, (state) => {
        state.status = 'running'
        state.pendingStage = null
        state.finalRedoNote = note
        // 票 `walkthrough-fixes/37`：**新一轮驳回，上一轮的拆条与去向一律作废**——
        // 留着它们会让「这一轮交代了几条」读成上一轮的答案（同样的病只在账本里换个位置复发）。
        delete state.finalRedoItems
        delete state.finalRedoCheck
      })
      appendEvent(project, 'textbook/final-approve', { approved: false, note })
      appendEvent(project, 'textbook/hint', { text: finalRejectedHint(meta) })
      handoffAndDrive(ctx, project, 'final')
      return accept({ project, redo: true })
    }
    case 'final-redo-items': {
      // 票 `walkthrough-fixes/37` · 拆条落账：驳回那一刻由主笔把用户那句意见拆成条目、**落进 meta 与账本**。
      // 为什么机器不自己拆：拆条是自然语言活（哪一段算一条意见只有读得懂的人判得了）；机器能做的是
      // 把「这一段是不是原文里连续的一段」验掉 ⇒ 编造／改写当场拒收，漏项由人看拆出来的条数。
      assertSessionOwned(project, sessionId)
      const meta = readMeta(project)
      if (meta === null) return reject(404, '项目不存在')
      const note = typeof meta.finalRedoNote === 'string' ? meta.finalRedoNote : ''
      if (note.trim() === '') {
        return reject(409, '现在没有要逐条交代的驳回意见：等用户在最后检查结果卡上点「不满意」并写下意见之后再来')
      }
      const problem = finalRedoItemsProblem(note, body.redoItems)
      if (problem !== null) return reject(400, problem)
      const items = normalizeFinalRedoItems(body.redoItems)
      updateMeta(project, (state) => {
        state.finalRedoItems = items
        // 重拆 ⇒ 上一份去向对不上新编号了，一并作废（重新交工时按新条目集逐条交代）。
        delete state.finalRedoCheck
      })
      appendEvent(project, 'textbook/hint', {
        text: `🧾 你上一轮的意见已拆成 ${items.length} 条，重新交工时逐条交代去向：`
          + items.map((item) => `第 ${item.index} 条「${clipQuote(item.quote)}」`).join('；'),
        finalRedoItems: items,
      })
      return accept({ project, items })
    }
    case 'skip-step': {
      // ── 票 `walkthrough-fixes/19`③ · 「跳过的口子」────────────────────────────────────────
      // **定义一句话：跳过 ＝ 把验货推迟并记账，不是取消验货。**
      //
      // 它与既有四类豁免（`gate-skip` / `audit-skip` / `progress-skip` / `other`）**不是一回事**：
      // 那四类经 `waived()` 读 `meta.waivers`，是**取消该检查**（那一行下游变成 `ok:true` ＋
      // 「你已同意：…」）；这一格读写的都是 `meta.skippedSteps`，被跳过的那一关在机器验货面上
      // 是**独立第三态**（`state:'skipped'`：`ok` 不是 true ⇒ 下游仍看到「未验」）。
      // ⛔ **不许把两者实现成同一条通路**——所以这里一个 `meta.waivers` 的写点都没有。
      //
      // 出口的**位置**是关卡层（拍板卡那一层），不是活性行那颗按钮的第二个含义、
      // 也不是那一屏的第二颗按钮（`stale-detection/01` 的「这一屏只留一个出口」维持）。
      assertSessionOwned(project, sessionId)
      const current = foldGate(project)
      if (current === null || current.status !== 'awaiting') {
        return reject(409, `现在没有等你拍板的方案（${current === null ? '这一关还没有提案' : `当前是 ${current.gate} v${current.version} ${current.status}`}）`)
      }
      const step = `gate-${current.gate}`
      const label = gateHuman(current.gate)
      // 「补验落在哪一步」：不编一个时间，只写**落在哪一步**（可执行的那一步）。
      const makeupAt = '交付前的最后检查认可那一刻——在拍板卡上把这一关补拍一次即可'
      const record = {
        step,
        label,
        at: Date.now(),
        // 谁跳的：**用户**。这个动作 `agentCallable: false`（见 `contract-actions.js`），
        // 所以账上这句是机器保证的，不是 AI 的自述。
        by: 'user',
        // 那一关的验货结论＝**未知**（不是通过）——这一格是第三态的全部意义所在。
        verdict: 'unknown',
        makeupAt,
      }
      updateMeta(project, (state) => {
        state.skippedSteps = [...(state.skippedSteps ?? []).filter((s) => s?.step !== step), record]
        state.pendingStage = null
        state.pendingGate = null
        state.status = 'running'
      })
      // 复用**既有**通道（`textbook/hint`），⛔ 不新开事件类型（ADR-0009「三件事都不许另开通道」）。
      // 四件齐：谁跳的（`skip.by`）／跳的是哪一步（`skip.step`＋人话 `label`）／
      // 结论＝未知（`skip.verdict`）／补验落在哪一步（`skip.makeupAt`）。
      appendEvent(project, 'textbook/hint', {
        text: `⏭ 你跳过了「${label}」：这一关的验货结论＝未知（不是通过），补验落在${makeupAt}；`
          + '交付与最后检查的清单里会逐条列着它，不会被算进「已通过」。',
        skip: record,
      })
      // 兑现这一次等待（与 `gate-decide` 同一条兑现口径）：状态机醒来后按 `stepSkipped` 越过这一关，
      // 而**不会**把它记成通过（`gateApproved` 读的是 `approved === true` 的决策事件）。
      if (resolveGateDecision(project, current.gate, current.version) === false) void kick(ctx, project)
      return accept({ project, skip: record })
    }
    case 'rollback': {
      assertSessionOwned(project, sessionId)
      const { snapshot } = body
      const seq = Number(snapshot)
      if (!Number.isSafeInteger(seq) || seq < 0) {
        return reject(400, 'rollback 需要合法的 snapshot 序号')
      }
      writeSnapshot(project, `回退到快照 ${seq} 之前`)
      // 票 `flow-audit-2026-10/06`：把「谁点的、为什么」一起交给回退事件（`body.note` 可选；
      // 工作台通道带 `humanEvent` ⇒ human，AI 通道 ⇒ agent）。
      const rollbackNote = textField(body.note ?? body.reason, GATE_NOTE_MAX)
      const event = restoreSnapshot(project, seq, { by: humanEvent === null || humanEvent === undefined ? 'agent' : 'human', note: rollbackNote })
      // 回退后清掉交办标记，让状态机根据账本重新推导（文件产物保留，由验货逻辑复用）。
      // 注意走 updateMeta：账本刚被 rollbackLedger 截短、账高已回到笔数，这里不许再整份写回。
      updateMeta(project, (meta) => {
        delete meta.pendingStage
        delete meta.pendingGate
        delete meta.wakeToken
        meta.status = 'running'
      })
      void kick(ctx, project)
      return accept({ project, event })
    }
  }
})
