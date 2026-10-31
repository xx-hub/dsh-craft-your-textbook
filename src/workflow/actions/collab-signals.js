/**
 * 动作族模块（架构评审候选 3，2026-09-01 拆分）：actCollabSignals
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
  WAIVER_ITEMS,
  readMeta,
  updateMeta,
  appendEvent,
  updateStyleLineMirror,
  // 票 `demo-channel-full/10`：「留言销号」的**唯一写入口**（`intervene-done` 与演示书终检那一趟共用）。
  closeIntervention,
  // ⚠️ 票 `premature-announce/01`：这个函数从本文件**搬进 engine**（暂停与「重做/归档前」两处共用，
  // 生产者仍只有这里那一处消费点，契约登记面跟着搬到 engine）。
  countRunningSubagents,
} from '../engine.js'
// payload 字段词汇层（票 `deep-module-scan/18` 层一）：只管「怎么读一个字段」＋具名上限。
// ⚠️ `textField`（严格 typeof）与 `textFieldRaw`（不裁空白）**不是**同一件事的两种写法，
//   合并会静默改行为——搬动时按原表达式选函数。
import {
  textField,
  textFieldRaw,
  STYLE_NOTE_TEXT_MAX,
  INTERVENE_TEXT_MAX,
  INTERVENE_TARGET_MAX,
  WAIVER_NOTE_MAX,
  // 票 `walkthrough-fixes/23`：作用域里「哪一条检查」那一格的上限（`other` 点名的检查项名）。
  WAIVER_CHECK_MAX,
  // 票 `kn-unowned-silent/02`：逐点豁免那一格的上限（条数／title／id）——与 `WAIVER_CHECK_MAX` 同族。
  WAIVER_POINTS_MAX,
  WAIVER_POINT_TITLE_MAX,
  WAIVER_POINT_ID_MAX,
  PAUSE_REASON_MAX,
} from './payload-fields.js'
import { familyOf, reject, accept } from '../action-runner.js'
// 宿主 `jobs` 契约面的**单点**（票 `chapter-audit-orchestration/04` 收口）：形状的唯一出处是随代码
// 入库的快照 `docs/reference/dsh-cordis/jobs-后台作业契约摘录.md`，本文件与测试探针
// （`workbench-fake-host.mjs` 的 `makeJobsProbe`）共用这一份词表，谁也不手抄第二份。
import { JOB_RUNNING_STATUS } from '../jobs-contract.js'


// ⚠️ 票 `premature-announce/01`：`countRunningSubagents` 已**搬进 `../engine.js`**（暂停与
// 「重做/归档前」两处共用同一份实现，⛔ 不在这里留第二份）。形状与「数不出来记 null 不记 0」的
// 纪律随它一起搬走，注释也只在那一处。


/** 暂停时停掉**这本书 owner 名下在跑的编排脚本**（票 `chapter-audit-orchestration/04`）。
 *
 *  病：宿主**没有**会话级 paused 状态，工作台的暂停从前只 cancel 主笔那一回合，
 *  而编排脚本跑在后台 job 里——于是「界面说已暂停、书还在长」。本函数补上那条 kill 路径。
 *
 *  **为什么由工作台来 kill（owner fence 够得到）**：形状与语义的出处是随代码入库的快照
 *  `docs/reference/dsh-cordis/jobs-后台作业契约摘录.md` §2b（owner fence 是**纯参数比对**：
 *  `owner === caller` 才放行；id 可预测 ⇒ 它是 **authorization, not secrecy**）。
 *  实现行号（本机 dsh 0.2.0-rc.2，升级后按快照复核）：`dsh-jobs-local/lib/index.js:565-567` 的
 *  `assertAccess` 与 `:493-495` 的 `list(caller)` 是同一条口径；`caller` 就是一个会话 id 字符串，
 *  注册表不看它是谁递进来的。而 job 的 owner 是 `parent.id`＝主笔所在会话的 session id
 *  （`dsh-tool-workflow/lib/index.js:223-226`），与工作台 HTTP 动作体里那个 `session` 是同一个
 *  ⇒ 把 `sessionId` 当 `caller` 递进去即可穿过 fence，**不必**从主笔那一侧发起。
 *  ⚠️ 这条 fence 的真实约束不是技术边界而是**授权边界**：本函数只该在
 *  `assertSessionOwned(project, sessionId)`（本文件 pause 分支第一行）之后调用——那才是
 *  「只能停自己那本书」的依据，`jobs` 那一层只是第二道同义校验。
 *
 *  ⚠️ **写直接成员访问 `ctx.jobs.*`，不写 `ctx.get('jobs')`**：本文件已登记在宿主契约闸门的
 *  `dynamicHostEntries` 里（`dev/host-contract-gate/catalog/web-chat.js`）而动态读登记表为空，
 *  多一条 `ctx.get(...)` 会当场判红 `unregistered-dynamic-host-read`——而红点会出现在离这里
 *  很远的一条断言上（「四类契约走同一个 seam」那条）。
 *
 *  **只 kill 三种条件同时成立的那些**（逐条都有契约依据）：
 *  ① `job.owner === sessionId`——`list(caller)` 也返回 **unowned** job（快照 §2b：
 *     「不带 owner 的 job，任何 caller 都看得见」），不归这本书的一律不碰；
 *  ② `job.kind === 'workflow'`——`JobView.kind` 的声明类型是**开字符串**（快照 §3），
 *     `workflow` 这一枚由 `dsh-tool-workflow` 合并进 `JobKindMap`（`dsh-tool-workflow/lib/types/index.d.ts:16-20`）；
 *     只认字面量，别指望类型系统；
 *  ③ `job.status === JOB_RUNNING_STATUS`——取值域是那五枚闭集（快照 §1），「在跑」只指 `running`；
 *     `stopping` 是**取消已经发出、等结算**，再 kill 一次只会把同一个取消请求重复计一遍
 *     （`killJob` 只挡终态，`dsh-jobs-local/lib/index.js:611-622`），所以这里不碰它、也不把它算进返回值。
 *     ⚠️ 状态词表**只此一处**：`JOB_STATUS_VALUES` / `JOB_RUNNING_STATUS` 都从
 *     `src/workflow/jobs-contract.js` 来，本文件与测试探针共用那一份（票 `chapter-audit-orchestration/04`
 *     收口前这里是注释里手抄的一张枚举表）。
 *
 *  ⚠️ **kill 不同步变终态**：`jobs.kill` 只把状态推到 `'stopping'` 并返回 `'requested'`
 *  （快照 §1 与 §4；实现 `dsh-jobs-local/lib/index.js:611-622`），终态 `'killed'` 要等 producer 的
 *  `done` 落定（`dsh-tool-workflow/lib/index.js:237-252`）。⇒ 调用方/判据**不许** kill 完立刻断言
 *  「不跑了」，要么 `jobs.wait(id, timeoutMs, caller)`（注意它要求正数毫秒，
 *  `dsh-jobs-local/lib/index.js:624`），要么轮询到 `status !== 'running'`。
 *  返回值只数真发出取消请求的（`requested`，见 `JOB_KILL_RESULTS`）；
 *  竞态里已经自己结算的那个返回 `already-finished`，不计。
 *
 *  数不出来 / 停不下来时返回 `null`（「不知道」，不是 0）——与 `countRunningSubagents` 同一条纪律：
 *  暂停本身**不许**因为一条附注而失败。缺席与调用抛错走同一个 `catch` 出口。
 *
 *  @returns {number|null} 真发出取消请求的编排脚本条数；服务缺席或调用抛错时 null
 */
function stopRunningWorkflowJobs(ctx, sessionId) {
  try {
    // 「服务缺席」与「确实一条都没在跑」必须是两个可区分的出口：前者抛，后者返回 0。
    // 刻意不写 `?? []`：折成空清单就与「确实没有」不可区分（票 `host-contract-gate/10` 那条纪律）。
    if (ctx === null || ctx === undefined
      || typeof ctx.jobs?.list !== 'function' || typeof ctx.jobs.kill !== 'function') {
      throw new Error('宿主作业服务缺席：ctx.jobs.list / ctx.jobs.kill 不可用')
    }
    const running = ctx.jobs.list(sessionId).filter(
      (job) => job?.owner === sessionId && job.kind === 'workflow' && job.status === JOB_RUNNING_STATUS,
    )
    let requested = 0
    for (const job of running) {
      if (ctx.jobs.kill(job.id, sessionId, '用户在造书工作台点击暂停') === 'requested') requested += 1
    }
    return requested
  } catch (e) {
    ctx?.logger?.warn?.(`textbook: 暂停时没停掉编排脚本（记 null 不记 0）: ${String(e instanceof Error ? e.message : e)}`)
    return null
  }
}


/**
 * 演示书上点「豁免」时**原样给回**的那句说明（票 `demo-channel-full/14`，维护者 2026-10-15 拍板）。
 *
 * 为什么把它抽成一个导出：它是一条**说给人听的话**（判定线①），所以 ⛔ 不许在别处手抄第二份——
 * 判据（`test-collab-backend.mjs` 的 F6e）与文案判据都引**这一份**（与票 17 的
 * `DEMO_DEEP_MODIFY_NOTICE` 同一个先例）。它说的是**这一条通道的事实**，⛔ 不承诺任何后果：
 * 演示书不真跑那些验货，所以这里没有要豁免的东西；这一下不算数——不记下豁免，也不因此放开任何东西。
 *
 * ⚠️ 与真书那句「你已同意：…」**必须明显不同**：同一句话在两种书上说不同的事＝说假话
 * （真书那句的意思是「某条检查被取消了」，而演示书上压根没有那条检查在跑）。
 */
export const DEMO_WAIVE_NOTICE = '演示模式不真跑那些验货，这里没有要豁免的东西：这一下只是给你看它长什么样，不记豁免、也不因此放开任何东西。'


/** 动作族 · 协作信号：'style-note' / 'style-note-revoke' / 'intervene' / 'intervene-done' / 'waive' / 'waive-revoke' / 'pause'。
 *  状态改动一律走 updateMeta 的改法（当场新读）：本族原先清一色「读状态 → 改 → 整份写回 → 再记一笔」，
 *  写回时会把账高带回读状态那一刻的旧值（票 02）。 */
export const actCollabSignals = familyOf('collab-signals', async ({ ctx: ctx, action: action, sessionId: sessionId, project: project, body: body }) => {
  switch (action) {
    case 'style-note': {
      assertSessionOwned(project, sessionId)
      const text = textField(body.text, STYLE_NOTE_TEXT_MAX)
      if (text === '') { return reject(400, '请写下你的风格意见') }
      const source = ['wizard', 'ui', 'chat'].includes(body.source) ? body.source : 'ui'
      const styleNote = { id: `sn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, text, at: Date.now(), source, status: 'active' }
      updateMeta(project, (meta) => { meta.styleNotes = [...(meta.styleNotes ?? []), styleNote] })
      updateStyleLineMirror(project)
      appendEvent(project, 'textbook/style-note', { styleNote })
      return accept({ project, styleNote })
    }
    case 'style-note-revoke': {
      assertSessionOwned(project, sessionId)
      let target
      updateMeta(project, (meta) => {
        target = (meta.styleNotes ?? []).find((n) => n.id === body.id)
        if (target === undefined) return
        target.status = 'superseded'
        target.note = '用户收回'
      })
      if (target === undefined) { return reject(404, '没有这条风格意见') }
      updateStyleLineMirror(project)
      appendEvent(project, 'textbook/style-note', { styleNote: target, revoked: true })
      return accept({ project, styleNote: target })
    }
    case 'intervene': {
      assertSessionOwned(project, sessionId)
      const text = textField(body.text, INTERVENE_TEXT_MAX)
      if (text === '') { return reject(400, '请写下想留言的内容') }
      const intervention = {
        id: `iv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        at: Date.now(), text,
        target: textFieldRaw(body.target, INTERVENE_TARGET_MAX, undefined),
        status: 'pending',
      }
      updateMeta(project, (meta) => { meta.pendingInterventions = [...(meta.pendingInterventions ?? []), intervention] })
      appendEvent(project, 'textbook/intervention', { text: intervention.text, target: intervention.target })
      return accept({ project, intervention })
    }
    case 'intervene-done': {
      assertSessionOwned(project, sessionId)
      // 票 `demo-channel-full/10`：销号那一下（改 meta ＋ 记一笔）搬进 engine 的**唯一写入口**——
      // 演示书的终检那一趟调的是**同一个函数**（演示通道没有主笔 AI，那一下由机器自己走）。
      if (!closeIntervention(project, body.id)) { return reject(404, '没有这条留言') }
      return accept({ project })
    }
    case 'waive': {
      assertSessionOwned(project, sessionId)
      const item = typeof body.item === 'string' ? body.item : ''
      if (WAIVER_ITEMS[item] === undefined) { return reject(400, '未知的豁免项') }
      // ── 票 `demo-channel-full/14`（维护者 2026-10-15 拍板「**可点但不算数 ＋ 给一句说明**」）──────
      // 演示书上这一跳**照旧可点**（入口一个字不改），点下去**一个字节都不写**：不写 `meta.waivers`、
      // 不落 `textbook/waiver` 账，而是拿回一句如实的告知。
      //
      // 为什么「不算数」才是如实的那一半：演示通道**从不真跑验货**（`stage-submit` 那条链在它身上
      // 没有入口点，那个豁免的判定 `waived()` 对演示书恒 false）。若照真书那样写一条豁免记录，账上
      // 就会出现「某条检查被用户放行了」——而那条检查在这条通道里**根本没跑过**。⛔ 所以这里既不
      // 写记录、也不放行任何东西：那句告知说的正是「这里没有要豁免的东西」。
      //
      // ⚠️ 位置在 `userNote` 校验**之前**是有意的：演示书不写任何记录，那条「必须手输原因」的
      // 必要条件对它不适用（它的边界是「跟用户说了句实话」，不是「拦下这次请求」）。⚠️ 但它必须
      // 在 `assertSessionOwned` 与「未知的豁免项」**之后**——那两条是**身份与形状**校验，与是不是
      // 演示书无关（演示书不该打开一条能探别家的口子）。
      const demoMeta = readMeta(project)
      if (demoMeta?.demo === true) { return accept({ project, demo: true, notice: DEMO_WAIVE_NOTICE }) }
      const userNote = textField(body.userNote, WAIVER_NOTE_MAX)
      if (userNote === '') { return reject(400, '豁免必须手输原因（在对话里直接说明即可，由 AI 转交），这是放行的必要条件') }
      // ── 作用域（票 `walkthrough-fixes/23`，2026-10-06 裁决）：哪一条检查／哪本书／哪一章 ──────────
      // 本 case 是 `meta.waivers[].scope` 的**唯一写入点**（读取面 `engine.js` 的 `waived()`）。
      // 三格的来源各不一样，逐格写清（别在这里编第二份词表）：
      //   · `check`：非 `other` 的豁免项，**那一项就是它放行的那条检查**（id 由服务端派生，不接受调用方另填）；
      //     `other` 必须由调用方点名——机器不知道该放行哪一条，而这正是本裁决要的粒度（一次只放行一条）。
      //   · `book`：本书 id（记录就住在这本书的 meta 里，这一格是防串用的显式核对）。
      //   · `chapter`：适用时给章号（1 基）；**不适用就明确记 `null`**＝全书/不限——**不写假章号**。
      //     今天只有「其他」这一族有按章的读取点（单章验货的「练习与答案齐全」），别的豁免项都是
      //     全书的 ⇒ 调用方顺手带一个章号也**不抄进作用域**（那会记下一个没人按它判定的假值）。
      const scopeIn = (body.scope !== null && typeof body.scope === 'object') ? body.scope : {}
      const check = item === 'other' ? textField(scopeIn.check, WAIVER_CHECK_MAX) : item
      if (check === '') {
        return reject(400, '「其他」豁免必须点名放行的是哪一条检查（scope.check，用机器检查结果里的项名，如「无重复标题」）——一次只放行点名的那一条')
      }
      if (item !== 'other' && scopeIn.check !== undefined && scopeIn.check !== item) {
        return reject(400, '这一项豁免的作用域只能点名它自己那条检查：scope.check 要么不写，要么与 item 相同')
      }
      const chapter = item === 'other' && Number.isSafeInteger(scopeIn.chapter) && scopeIn.chapter >= 1
        ? scopeIn.chapter
        : null
      // ── 票 `kn-unowned-silent/02`：**逐点豁免**（`waivedPoints[]`）────────────────────────────
      // 裁决（维护者 2026-10-27「按推荐」）：「豁免必须结构化到点。」旧形状是书级一刀切
      // （`scope.chapter: null` ＋ 散文里写 5 个点）——读取面只按 `item` ＋ `userNote` 非空放行，
      // 于是**哪几个点被放弃**机器一件都不知道（真书 143 承诺 / 138 实写）。
      // 今天：一笔豁免要少收哪几条点，就在这里**逐条点名**（点 `id`／`title`，可选 `chapter`）。
      // ⚠️ 形状只认「非空字符串」或「带非空 title 的对象」；**写了的型别错当场 400**——静默丢一条
      //   就等于「用户点了名、机器当没看见」，那正是本票要治的病。
      // ⚠️ 非 `other` 的豁免项**不收** `waivedPoints`（它们不按点判）——但**当场上 400**，不静默吞掉：
      //    「写了的输入被机器悄悄丢掉」正是本票要治的病（`scope.chapter` 那一格可以静默不抄，因为它是
      //    「顺手指带的假值」；`waivedPoints` 不一样，它是「用户点名要放弃哪几条」的正题）。
      if (item !== 'other' && body.waivedPoints !== undefined && body.waivedPoints !== null) {
        return reject(400, 'waivedPoints 只对「其他」豁免（item=other）有意义：别的豁免项不按点判，点名放弃哪几条点请用 item=other ＋ scope.check=被放行的那条检查')
      }
      let waivedPoints = []
      if (item === 'other' && body.waivedPoints !== undefined && body.waivedPoints !== null) {
        if (!Array.isArray(body.waivedPoints)) {
          return reject(400, 'waivedPoints 需要数组：每条是知识点的 title（字符串），或 {id?, title, chapter?} 对象——逐条点名你要放弃的那几条')
        }
        if (body.waivedPoints.length > WAIVER_POINTS_MAX) {
          return reject(400, `waivedPoints 一次最多点名 ${WAIVER_POINTS_MAX} 条（这是「放弃哪几条点」的清单，不是整本书的图谱）`)
        }
        for (const raw of body.waivedPoints) {
          const title = typeof raw === 'string' ? raw : (typeof raw?.title === 'string' ? raw.title : '')
          const trimmedTitle = title.trim()
          if (trimmedTitle === '') {
            return reject(400, 'waivedPoints 的每一条都要有非空的 title（知识点名，与工作区/outline.md 的 points 同一写法）')
          }
          // ⚠️ 超长 title **不截断**（`textField` 会裁）：裁出来的串与图上那条对不上，豁免会**静默失效**
          // ——那正是「点了名、机器当没看见」的另一种写法。超了当场 400。
          if (trimmedTitle.length > WAIVER_POINT_TITLE_MAX) {
            return reject(400, `waivedPoints 里有一条 title 长 ${trimmedTitle.length} 字、超过 ${WAIVER_POINT_TITLE_MAX} 字上限（不截断：截了就对不上图上那条点了）`)
          }
          const point = { title: trimmedTitle }
          if (typeof raw?.id === 'string' && raw.id.trim() !== '') point.id = textField(raw.id, WAIVER_POINT_ID_MAX)
          // 章归属**落盘时就写实**：条目自己给了就记它；没给而这条记录本身按章（`scope.chapter`）⇒ 记那个章号。
          // 为什么要在写侧补齐：面板「豁免放弃 M」与「哪一章的点数被减负」都按**条目上的章号**认，
          // 落盘时省掉它，读侧就只能推出 `null`（＝不知道），于是闸门放行而面板印 0——两处各说一套。
          const pointChapter = Number.isSafeInteger(raw?.chapter) && raw.chapter >= 1 ? raw.chapter : chapter
          if (pointChapter !== null) point.chapter = pointChapter
          waivedPoints.push(point)
        }
      }
      const waiver = {
        id: `wv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        item, reason: WAIVER_ITEMS[item].label, risk: WAIVER_ITEMS[item].risk, userNote,
        source: body.source === 'chat' ? 'chat' : 'ui', at: Date.now(),
        scope: { check, book: project, chapter },
        // 只有真的点名了才写这一格（不写空数组占位：那会让「没有逐点豁免」与「点了名但是空的」分不出来）。
        ...(waivedPoints.length > 0 ? { waivedPoints } : {}),
      }
      updateMeta(project, (meta) => { meta.waivers = [...(meta.waivers ?? []), waiver] })
      // 作用域也进账本那一笔：事后翻账的人要读得到「这次放行的是哪一条、哪一章」；
      // 点名的点跟着进——账本是「这次到底放弃了什么」的追溯面。
      appendEvent(project, 'textbook/waiver', {
        item, userNote, scope: waiver.scope,
        ...(waivedPoints.length > 0 ? { waivedPoints } : {}),
      })
      return accept({ project, waiver })
    }
    case 'waive-revoke': {
      assertSessionOwned(project, sessionId)
      let removed
      updateMeta(project, (meta) => {
        const idx = (meta.waivers ?? []).findIndex((w) => w.id === body.id)
        if (idx === -1) return
        ;[removed] = meta.waivers.splice(idx, 1)
      })
      if (removed === undefined) { return reject(404, '没有这条豁免') }
      appendEvent(project, 'textbook/waiver-revoke', { item: removed.item, scope: removed.scope })
      return accept({ project })
    }
    case 'pause': {
      // 暂停：记账 pause → 事件 → 取消主 AI（keepInbox）；绝不 followup。
      // **不碰小助手**（票 dsh-contract-drift/01）：收回小助手是主笔 AI 自己的事，工作台只喊主 AI。
      // 票 `chapter-audit-orchestration/04` 起**另外** kill 掉这本书 owner 名下在跑的编排脚本——
      // 那条路径不越过「不许操纵宿主子代理」这条边界：它停的是 **job**（宿主 job 级取消，
      // 见 `stopRunningWorkflowJobs`），一个 `ctx.subagents.interrupt(...)` 都不发。
      // 口径：**「已暂停」现在对主 AI 与编排脚本都成立**——只有小助手还会把手上那段跑完、可能还在往书里写。
      // （本条待人的规矩在 `.scratch/subagent-guidance/issues/08`，不在这里。）
      assertSessionOwned(project, sessionId)
      // 「按下暂停时还有几个小助手在跑」——**只记那个数**，不记名字/编号（主笔 AI 自己有 list_agents）。
      // 这一刻先数（取消主 AI 不影响小助手，但事实说的是「按下暂停时」）。
      // ⚠️ **次序是契约的一部分：先数、再 kill**——编排脚本的成员在 `listDescendants` 眼里与小助手
      // 同形（同 `parentSession`、同 `origin: 'subagent'`、活的时候同 `activity: 'running'`，
      // 见 `CONTEXT.md`「编排脚本」与票 04 的笔记 §7），kill 会连带 abort 它们；次序反了，
      // 「按下暂停时还有几个在跑」这个数的口径就变成「kill 之后还剩几个」。
      const subagentsRunning = await countRunningSubagents(ctx, sessionId)
      const jobsStopped = stopRunningWorkflowJobs(ctx, sessionId)
      const meta = updateMeta(project, (state) => {
        state.pause = {
          at: Date.now(),
          reason: textFieldRaw(body.reason, PAUSE_REASON_MAX, '用户在造书工作台点击暂停'),
          subagentsRunning,
        }
      })
      // 停掉几条编排脚本**只进这一笔账的 data**，不进 `meta.pause`：那个记录的形状由 subagents
      // 契约冻结成 `['at','reason','subagentsRunning']`（`catalog/web-chat.js` 的
      // `SUBAGENT_PAUSE_SHAPE`，期望值从源码 AST 读出来对账），往里加字段是**另一份契约**的事。
      // 人读的两个出口（《过程记录.md》与对话播报）按 `data.jobsStopped` 说话（`engine.js`）。
      appendEvent(project, 'textbook/pause', {
        reason: meta.pause.reason,
        pendingStage: meta.pendingStage ?? null,
        subagentsRunning,
        jobsStopped,
      })
      try {
        ctx?.agents?.get?.(sessionId)?.cancel?.(
          { kind: 'hook', reason: meta.pause.reason },
          { keepInbox: true },
        )
      } catch (e) { ctx?.logger?.warn?.(`textbook: 暂停取消主 AI 失败: ${String(e instanceof Error ? e.message : e)}`) }
      return accept({ project, pause: meta.pause })
    }
  }
})
