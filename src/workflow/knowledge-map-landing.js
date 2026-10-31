/**
 * 「落一件合并件」——盘上那份 `工作区/knowledge-map.json` 的**唯一落盘入口**。
 *
 * 它吃一份**已拼好的结构**（或一张边表）＋ 落点描述，内部固定走
 * **闸 → 约简 → 渲染 → 写**，并返回一个**封闭七档结局**（{@link MERGED_MAP_OUTCOMES}）之一。
 * 五条既有的落盘路径（交工成功／交工闸红／补图／重拼／演示）都退成它的调用者。
 *
 * ## 为什么要有这一处（spec `.scratch/graph-write-order/spec.md` 决策 1／3）
 *
 * 排序工具只回答「先谁后谁」，会把**失败语义**留在 caller 心里——而那正是今天的病：
 * 合并件有 6 处写调用（5 处落盘 ＋ 1 处撤回写），失败写法有三种，而「闸 → 约简 → 渲染 → 写」
 * 这条次序只活在两段注释里。⇒ 本模块同时回答「成功写什么」与「失败写什么」。
 *
 * ## 次序契约：先过闸、后约简、再 render、最后写
 *
 * ⚠️ **顺序是契约：先过闸、后约简、再 render**（票 `knowledge-graph-edges-build/05`，spec 落地清单
 * 第 9 条）。闸吃的必须是 **AI 声明的那一份**——约简会把「有 ≥2 步替代路径」的冗余 `prereq` 删掉，
 * 先约简就等于**先把重复边擦干净再去判重复边**，`edge-duplicate` 从此判不出来（判据声称的强度 ≠
 * 实现的强度）。这一点在票 05 之前**就是既有缺口**（补图那一路一直是「先约简后过闸」），本票
 * 只是把它改回真实顺序；交工那一跳与重拼两处则是本票新接的约简。
 *
 * 第四步「写」也必须在这里（spec 决策 3）：否则 `payload-only`／`withdrawn`／
 * `withdrawn-on-plan`／`unchanged` 没有落点，模块只会返回一段文本，caller 仍然自己挑一种失败写法。
 *
 * ## 封闭七档结局（⛔ 不许再长）
 *
 * | 结局 | 什么时候 | 写什么 |
 * | --- | --- | --- |
 * | `landed` | 闸零问题（交工／补图） | 约简后的那一份（渲染出口写） |
 * | `payload-only` | 交工这一跳闸有问题（它之前盘上没有图键） | 剥掉 `cards`／`edges` 的 payload |
 * | `withdrawn` | **闸**有问题，且盘上**已有**图键 | 撤回（合并件 ＋ 带图键的分片） |
 * | `withdrawn-on-plan` | **写之前就拒**（计划阶段：读不出／没有落点／锚或卡派生不出来；或闸之后的约简出硬问题），且盘上**已有**图键 | 撤回（合并件 ＋ 带图键的分片） |
 * | `unchanged` | 计划阶段就拒而本来没有图键；或补图闸红而盘上本来没有图键 | 零字节 |
 * | `fixture` | 演示通道（零 LLM 夹具） | 只渲染，**不过闸、不约简** |
 * | `reconciled-from-disk` | 重拼／对账（输入是盘上已落过的字节） | 约简 ＋ 渲染 ＋ 写，**不过闸**（具名） |
 *
 * `payload-only` 与 `withdrawn` 都发生在「闸红」之后，区别只在**这一跳之前盘上有没有图键**：
 * 交工那一跳之前没有（章已写，不能连 payload 一起撤），补图那一跳之前可能有（要撤回）。
 * ⇒ 同一条策略的两个出口，不是两个策略（`ADR-0044:59` 那句告诫要问的正是这个）。
 *
 * `unchanged` 单列：它不写盘，但它**也必须说出来**——否则「零字节」会被读成「写了但没变」。
 * `withdrawn-on-plan` 与 `unchanged` 的分界是**盘上有没有图键**，不是「拒在哪个阶段」：
 * 写之前就拒一样要撤回已有的图键（spec 决策 9 · `W-04`＝A），否则盘上会留一份「图键指着
 * 一次没落成的计划」的件；本来没有图键才是真零字节。⚠️ 这一档有**两条来路**：计划阶段
 * （`refusal`）与「约简出硬问题」（认不出的 `kind`，发生在闸之后、写之前）——后者虽然过了闸，
 * 仍归这一档：它同样不落图、同样要把旧键撤回；两处只共用这一档判定，⛔ 不另立第八档。
 *
 * `reconciled-from-disk` 单列成一档、而不是 `landed` 的子类：它要回答的是「这一档**有没有闸**」，
 * 不是「写了什么」。把它塞进 `landed` 会让「闸跑过」与「闸没跑」共用同一个名字——那正是本模块
 * 要治的病（{@link REBUILD_GATE_NOTE} 逐字给出「闸未跑」的理由）。
 *
 * ## 它**不**做什么（硬边界，spec 决策 6）
 *
 * - 不改形状闸的判据（`knowledge-map-gate.js` 一个字不碰）；
 * - 不改拼装器的输出契约（`expectedKnowledgeMap`／`renderKnowledgeMap` 不动）；
 * - 不改约简算法（唯一实现仍是 `knowledge-graph-build.js` 的 `reduceTransitivePrereqEdges`）；
 * - 不改重拼的拼法（唯一实现仍是 `rebuildMergedMapFromShards`）。
 *
 * ## 它与 `knowledge-graph-build.js` 的互相 import（有意的）
 *
 * 本模块是**落盘**的唯一入口；约简与撤回的唯一实现仍在 `knowledge-graph-build.js`（它是本模块的
 * 调用者，也是那两样东西的家）⇒ 两边互相 import。两处都只在函数体里取对方的**函数声明**、模块
 * 求值期一次都不调用，所以 ESM 的循环不会在加载时炸。⛔ 不许为了「去掉环」把约简或撤回抄第二份。
 *
 * 撤回那两个键的**字节写**仍在 `withdrawKnowledgeGraphKeys`（唯一实现，导出给 CLI／测试）；生产里
 * 它的**唯一调用者**是本模块的写面（`grep -rn "withdrawKnowledgeGraphKeys(" src/` 可核）——
 * 「撤不撤」由计划面的结局定，⛔ 不在别处再调一次。
 *
 * ## `steps` 是自陈读数，**不承重**
 *
 * 返回值里的 `steps`（`['gate','reduce','render','write']` 之类）只是它自己说「我按这个次序走了」；
 * 它**不构成判据**。主判据是「同一张坏边表喂进来，闸点不点得出 `edge-duplicate`」＋ 落盘字节。
 *
 * @module knowledge-map-landing
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

// 票 `quality-review-2026-10-29/07`：`isPlainObject` 收编进零依赖叶子（本文件原先那一份是全仓
// 逐字抄件的第 7 份；判据＝`test-book-shape.mjs` 的「单点 · 对象判据」那一格）。
import { isPlainObject } from '../plain-object.js'
import { renderKnowledgeMap } from './knowledge-map-assembly.js'
import { knowledgeMapGateProblems } from './knowledge-map-gate.js'
// ⚠️ 见文件头「它与 knowledge-graph-build.js 的互相 import」：这两个是**唯一实现**，⛔ 不抄第二份。
import { reduceTransitivePrereqEdges, withdrawKnowledgeGraphKeys } from './knowledge-graph-build.js'

/**
 * 封闭的七档结局。⛔ **不许再长**：加第八档要先改 spec 决策 2 并重新论证「它与前七档不是同一条策略」。
 */
export const MERGED_MAP_OUTCOMES = Object.freeze({
  landed: 'landed',
  payloadOnly: 'payload-only',
  withdrawn: 'withdrawn',
  withdrawnOnPlan: 'withdrawn-on-plan',
  unchanged: 'unchanged',
  fixture: 'fixture',
  reconciledFromDisk: 'reconciled-from-disk',
})

/** 「闸没跑」的哨兵值（票 `graph-write-order/04` 的 `gate: 'not-run'`；⛔ 别在调用点另写一份字面量）。 */
export const MERGED_MAP_GATE_NOT_RUN = 'not-run'

/**
 * 输入档（**不是**结局）：它决定「闸红时写什么」与「要不要跑闸／约简」这两件**策略**。
 *
 * - `submit`：交工那一跳——过闸；闸红 ⇒ 剥两键写 payload（`payload-only`）。
 * - `backfill`：老书补图——过闸；闸红且盘上已有图键 ⇒ 撤回；写之前就拒（计划阶段，或闸之后的
 *   约简出硬问题）且已有图键 ⇒ `withdrawn-on-plan`；本来没有图键 ⇒ 零字节（`unchanged`）。
 * - `rebuild`：重拼／对账——**不过闸**（具名），约简 ＋ 渲染 ＋ 写。
 * - `fixture`：演示通道（零 LLM 夹具）——**不过闸、不约简**，只走渲染出口。
 */
export const MERGED_MAP_LANDING_KINDS = Object.freeze({
  submit: 'submit',
  backfill: 'backfill',
  rebuild: 'rebuild',
  fixture: 'fixture',
})

/** 重拼那一档「闸没跑」的逐字理由（spec 决策 4；⛔ 别在别处另写一句）。 */
export const REBUILD_GATE_NOTE = '输入是盘上已经落过的字节——它们在落盘那一刻已经过闸；重拼不补闸，补闸会把历史重复边的旧书从「报差异」变成「拒写」'

/** 演示那一档「闸没跑」的逐字理由（spec 决策 2；⛔ 别在别处另写一句）。 */
export const FIXTURE_GATE_NOTE = '演示通道是零 LLM 的确定性夹具：不过闸、不约简，只走同一个渲染出口（它证明的是「出口收成一处」，不是「演示书的图被验过」）'

/** 计划阶段就拒且盘上已有图键时，撤回那句话的机器理由（spec 决策 9 · `W-04`＝A）。 */
const PLAN_REFUSAL_WITHDRAW_REASON = '补图在计划阶段就拒'

/** 约简出硬问题（落在闸之后、写之前）那一档的机器理由——别把它说成「计划阶段」。 */
const REDUCE_REFUSAL_WITHDRAW_REASON = '补图在约简这一步出了硬问题（认不出的 kind）就拒'

/** 闸红且盘上已有图键时，撤回那句话的机器理由。 */
const GATE_RED_WITHDRAW_REASON = '补图在形状闸没过'

/** 两档撤回的结局：它们的字节写完全一样，只有「拒在哪一阶段」不同（spec 决策 2／9）。 */
function isWithdrawalOutcome(outcome) {
  return outcome === MERGED_MAP_OUTCOMES.withdrawn || outcome === MERGED_MAP_OUTCOMES.withdrawnOnPlan
}

function refusalLines(refusal) {
  if (refusal === null || refusal === undefined) return []
  const list = Array.isArray(refusal) ? refusal : [refusal]
  return list.filter((line) => typeof line === 'string' && line !== '')
}

/** 剥掉两个图键（`payload-only` 那一档的写什么）。 */
function stripGraphKeys(map) {
  const out = { ...map }
  delete out.cards
  delete out.edges
  return out
}

function requireTarget(target) {
  if (!isPlainObject(target) || typeof target.path !== 'string' || target.path === '') {
    throw new Error('落一件合并件需要落点描述 `target.path`（要写到哪个书夹绝对路径）')
  }
  return target
}

/**
 * 计划面：**纯读、一个字节都不写**。dry-run 与真写共用这一份结果（继承 `planKnowledgeGraphBackfill`
 * 那条既有不变量）。
 *
 * @param {object} input 见 {@link landMergedMap}
 * @returns {object} 见文件头「返回值」；`writes` 是**计划**要写的路径与全文，`written` 在计划面恒空。
 */
export function planMergedMapLanding(input = {}) {
  const kind = input.kind ?? MERGED_MAP_LANDING_KINDS.submit
  if (!Object.values(MERGED_MAP_LANDING_KINDS).includes(kind)) {
    throw new Error(`落一件合并件：认不出的输入档 ${JSON.stringify(kind)}（只认 ${Object.values(MERGED_MAP_LANDING_KINDS).join('／')}）`)
  }
  const projectId = input.projectId ?? null
  const refusal = refusalLines(input.refusal)
  const merged = input.merged ?? null
  const target = input.target ?? null
  const base = {
    kind,
    projectId,
    outcome: null,
    written: [],
    text: null,
    problems: [],
    gate: null,
    gateNote: null,
    steps: [],
    reduced: null,
    removed: [],
    candidate: null,
    layout: null,
    writes: [],
    withdrawal: null,
    withdrawReason: null,
  }

  // ── 演示夹具：不过闸、不约简，只渲染（spec 决策 2）──────────────────────────
  if (kind === MERGED_MAP_LANDING_KINDS.fixture) {
    if (!isPlainObject(merged)) throw new Error('演示通道落合并件需要一份合并件结构（对象）')
    requireTarget(target)
    const text = renderKnowledgeMap(merged)
    return {
      ...base,
      outcome: MERGED_MAP_OUTCOMES.fixture,
      text,
      gate: MERGED_MAP_GATE_NOT_RUN,
      gateNote: FIXTURE_GATE_NOTE,
      steps: ['render', 'write'],
      writes: [{ path: target.path, text }],
    }
  }

  // ── 重拼／对账：约简 ＋ 渲染 ＋ 写，**不过闸**（具名，spec 决策 4）──────────────
  if (kind === MERGED_MAP_LANDING_KINDS.rebuild) {
    // ⚠️ 重拼／对账的**两条分支都要过约简**（有分片那一档与无分片那一档）：盘上那份是**约简后**的
    // （补图／交工两处都落约简后的边），重拼那一份不约简 ⇒ `equal` **恒红**。那不是真的不一致，
    // 是确定函数不自洽。⛔ 别只在写盘那一支加。
    // ⚠️ 没有 `edges` 键（老书那一档／这本书没有图）时**原样返回**：⛔ 不凭空添一个空表——
    // 那会让「重拼逐字相等」凭空多出一个键（旧实现 `reduceEdgesOfMap` 的窄处，逐字保留）。
    const hasEdges = isPlainObject(merged) && Array.isArray(merged.edges)
    const edges = Array.isArray(input.edges) ? input.edges : (hasEdges ? merged.edges : [])
    const reduced = reduceTransitivePrereqEdges(edges)
    const candidate = isPlainObject(merged) && hasEdges ? { ...merged, edges: reduced.edges } : merged
    const text = candidate === null ? null : renderKnowledgeMap(candidate)
    const problems = [...reduced.problems]
    const outcome = problems.length > 0 ? MERGED_MAP_OUTCOMES.unchanged : MERGED_MAP_OUTCOMES.reconciledFromDisk
    const write = input.write !== false
    const steps = ['reduce', 'render']
    const writes = []
    if (write && outcome === MERGED_MAP_OUTCOMES.reconciledFromDisk) {
      requireTarget(target)
      writes.push({ path: target.path, text })
      steps.push('write')
    }
    return {
      ...base,
      outcome,
      text,
      problems,
      gate: MERGED_MAP_GATE_NOT_RUN,
      gateNote: REBUILD_GATE_NOTE,
      steps,
      reduced,
      layout: { candidate, shardWrites: [], mergedWrite: writes[0] ?? null },
      writes,
    }
  }

  // ── 交工／补图：闸 → 约简 → 渲染 → 写 ────────────────────────────────────────
  const edges = Array.isArray(input.edges)
    ? input.edges
    : (isPlainObject(merged) && Array.isArray(merged.edges) ? merged.edges : [])
  const shards = Array.isArray(input.shards) ? input.shards : []
  const layout = typeof input.layout === 'function' ? input.layout : null
  // 落点描述：`layout` 把**一张边表**排成「候选 ＋ 各片要写的文本 ＋ 闸要看的各片」（补图两档落点）；
  // 没有它时，交工那一跳的落点就是调用方递进来的那一份结构 ＋ 一个目标路径。
  let declared
  if (layout !== null) {
    declared = layout(edges)
  } else {
    if (!isPlainObject(merged)) throw new Error('交工那一跳落合并件需要一份合并件结构（对象）')
    requireTarget(target)
    declared = {
      candidate: merged,
      shardWrites: [],
      mergedWrite: { path: target.path, text: renderKnowledgeMap(merged) },
      gateShards: shards,
    }
  }
  if (!isPlainObject(declared?.candidate)) throw new Error('落一件合并件：落点描述没有给出候选合并件（对象）')
  const mergedWrite = declared.mergedWrite ?? (target === null ? null : {
    path: target.path,
    text: renderKnowledgeMap(declared.candidate),
  })
  if (mergedWrite === null || typeof mergedWrite.path !== 'string') {
    throw new Error('落一件合并件：落点描述没有给出合并件落点（`mergedWrite.path`／`target.path`）')
  }
  const steps = ['gate']
  const gate = knowledgeMapGateProblems({ merged: declared.candidate, shards: declared.gateShards ?? shards })

  steps.push('reduce')
  const reduced = reduceTransitivePrereqEdges(edges)
  // 约简真的动过 ⇒ 按约简后的表重排一遍落点（文本要 render 的都是**这一份**）；没动过就复用上一步。
  let writtenLayout
  if (layout !== null && reduced.removed.length > 0) {
    writtenLayout = layout(reduced.edges)
  } else if (layout === null) {
    const candidate = Array.isArray(declared.candidate.edges)
      ? { ...declared.candidate, edges: reduced.edges }
      : declared.candidate
    writtenLayout = {
      ...declared,
      candidate,
      mergedWrite: { ...mergedWrite, text: renderKnowledgeMap(candidate) },
    }
  } else {
    writtenLayout = declared
  }
  steps.push('render')
  const finalWrite = writtenLayout.mergedWrite ?? mergedWrite

  // ── 结局：先看「写之前就拒」，再看闸；两者都不是才是 `landed` ──────────────────
  const hasGraphKeys = input.hasGraphKeys === true
  let outcome
  let problems = []
  let withdrawReason = null
  // 写之前就拒的两条来路（`refusal`／约简出硬问题）共用这一档判定：盘上已有图键 ⇒ 撤回，
  // 本来没有图键 ⇒ 零字节（spec 决策 9 · `W-04`＝A）。
  const planRefusal = (reason) => ({
    outcome: hasGraphKeys ? MERGED_MAP_OUTCOMES.withdrawnOnPlan : MERGED_MAP_OUTCOMES.unchanged,
    withdrawReason: hasGraphKeys ? reason : null,
  })
  // 两条来路只记「为什么拒」，结局与理由在下面**一处**落定（⛔ 不把同一个三元式抄两遍）。
  let planRefusalReason = null
  if (refusal.length > 0) {
    // 计划阶段就拒（读不出／没有落点／锚或卡派生不出来）：**盘上已有图键就撤回**
    // （`withdrawn-on-plan`，spec 决策 9 · `W-04`＝A）；本来没有图键才是真零字节（`unchanged`）。
    // ⛔ 别再把这一档一律写成 `unchanged`：那会让盘上留下一份「图键指着一次没落成的计划」的件。
    problems = refusal
    planRefusalReason = PLAN_REFUSAL_WITHDRAW_REASON
  } else if (gate.problems.length > 0) {
    problems = gate.problems.map((problem) => problem.message)
    if (kind === MERGED_MAP_LANDING_KINDS.backfill) {
      // 补图没有「交工的 payload」要写回：盘上有图键 ⇒ 撤回；本来没有 ⇒ 一个字节都不写。
      outcome = hasGraphKeys ? MERGED_MAP_OUTCOMES.withdrawn : MERGED_MAP_OUTCOMES.unchanged
      withdrawReason = hasGraphKeys ? GATE_RED_WITHDRAW_REASON : null
    } else {
      outcome = MERGED_MAP_OUTCOMES.payloadOnly
    }
  } else if (reduced.problems.length > 0 && kind === MERGED_MAP_LANDING_KINDS.backfill) {
    // 约简出硬问题（「认不出的 `kind`」）在补图这一档**是硬拒**（既有强度，⛔ 不许降级成软读数）。
    // 它发生在闸之后、写之前，归「写之前就拒」那一档：盘上已有图键 ⇒ `withdrawn-on-plan`；
    // 本来没有图键 ⇒ `unchanged` 零字节。
    problems = [...reduced.problems]
    planRefusalReason = REDUCE_REFUSAL_WITHDRAW_REASON
  } else {
    outcome = MERGED_MAP_OUTCOMES.landed
  }
  if (planRefusalReason !== null) {
    const landing = planRefusal(planRefusalReason)
    outcome = landing.outcome
    withdrawReason = landing.withdrawReason
  }

  const writes = []
  let text = null
  if (outcome === MERGED_MAP_OUTCOMES.landed) {
    text = finalWrite.text
    for (const shardWrite of writtenLayout.shardWrites ?? []) {
      writes.push({ path: shardWrite.path, text: shardWrite.text })
    }
    writes.push({ path: finalWrite.path, text })
    steps.push('write')
  } else if (outcome === MERGED_MAP_OUTCOMES.payloadOnly) {
    text = renderKnowledgeMap(stripGraphKeys(declared.candidate))
    const path = finalWrite.path
    writes.push({ path, text })
    steps.push('write')
  } else if (isWithdrawalOutcome(outcome)) {
    steps.push('withdraw')
  }

  const finalCandidate = outcome === MERGED_MAP_OUTCOMES.payloadOnly
    ? stripGraphKeys(declared.candidate)
    : writtenLayout.candidate
  return {
    ...base,
    outcome,
    text,
    problems,
    gate,
    gateNote: null,
    steps,
    reduced,
    removed: reduced.removed,
    candidate: finalCandidate,
    layout: writtenLayout,
    writes,
    withdrawReason,
    withdrawal: isWithdrawalOutcome(outcome)
      ? { reason: withdrawReason, ledger: null, now: null }
      : null,
  }
}

/**
 * 写面：**只**按 {@link planMergedMapLanding} 已经定下的结局写——caller 拿不到「只写一半」的口子。
 *
 * - `landed`／`payload-only`／`fixture`／`reconciled-from-disk`：按计划里的 `writes` 逐份写；
 * - `withdrawn`／`withdrawn-on-plan`：调**唯一**的撤回实现（`withdrawKnowledgeGraphKeys`），
 *   它自己决定哪几份件带图键；
 * - `unchanged`：一个字节都不写（写面不再读盘、不再改结局）。
 *
 * @param {object} plan {@link planMergedMapLanding} 的返回值
 * @param {{ledger?: object|null, now?: number}} [options] 撤回要用的 ledger（补图那一档）
 * @returns {object} 计划 ＋ `written`（**实际**写了哪些路径）＋ `withdrawal`（撤回那一档）
 */
export function applyMergedMapLanding(plan, options = {}) {
  if (!isPlainObject(plan)) throw new Error('落一件合并件的写面需要计划面返回的那一份结果')
  const result = { ...plan, written: [] }
  // `unchanged` 是**真的零字节**：⛔ 写面不再读盘、不再改结局（计划面说 unchanged，写面就什么都不做）。
  if (plan.outcome === MERGED_MAP_OUTCOMES.unchanged) return result
  if (isWithdrawalOutcome(plan.outcome)) {
    if (typeof plan.projectId !== 'string' || plan.projectId === '') {
      throw new Error('撤回那一档需要 projectId（哪本书的图键要撤）')
    }
    // 撤回的字节写仍走**唯一实现** `withdrawKnowledgeGraphKeys`；但「撤不撤」已由计划面定死。
    const withdrawal = withdrawKnowledgeGraphKeys(plan.projectId, {
      ledger: options.ledger ?? plan.withdrawal?.ledger ?? null,
      reason: plan.withdrawal?.reason ?? '落盘失败',
      now: options.now ?? plan.withdrawal?.now ?? Date.now(),
    })
    return { ...result, withdrawal, written: withdrawal.files.map((file) => file.path) }
  }
  for (const write of plan.writes) {
    mkdirSync(dirname(write.path), { recursive: true })
    writeFileSync(write.path, write.text, 'utf8')
    result.written.push(write.path)
  }
  return result
}

/**
 * **一个入口**：计划 ＋ 写。调用点只需要它（dry-run 那两处才拆开用）。
 *
 * @param {object} input
 *   - `kind`：{@link MERGED_MAP_LANDING_KINDS} 之一；
 *   - `projectId`：书 id（撤回那一档要用；其余档可省）；
 *   - `merged`：已拼好的合并件结构（交工／演示／重拼要写的那一份）；
 *   - `edges`：一张边表（补图那一档；不传就从 `merged.edges` 取）；
 *   - `shards`：闸要看的各片（`[{n, map}]`；交工那一档）；
 *   - `layout`：`(edgeTable) => {candidate, shardWrites, mergedWrite, gateShards}`（补图两档落点）；
 *   - `target`：`{path}`（写到哪个书夹绝对路径）；
 *   - `refusal`：计划阶段就拒的那几句（非空且 `hasGraphKeys` ⇒ `withdrawn-on-plan`／撤回；
 *     非空且本来没有图键 ⇒ `unchanged`／零字节）；闸之后的约简出硬问题走同一档判定；
 *   - `hasGraphKeys`：这一跳之前盘上有没有图键（补图闸红或写之前就拒且 true ⇒
 *     `withdrawn`／`withdrawn-on-plan`；false ⇒ `unchanged`；交工那一档闸红固定 `payload-only`）；
 *   - `write`：`false` ⇒ 只出读数不写盘（重拼无分片那一档）。
 * @returns {object} `{outcome, written, text, problems, gate, gateNote, steps, reduced, removed, candidate, layout, writes, withdrawal, withdrawReason}`
 */
export function landMergedMap(input = {}) {
  return applyMergedMapLanding(planMergedMapLanding(input))
}
