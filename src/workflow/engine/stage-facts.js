/**
 * 造书工作台 · 环节状态的**四项事实**从哪来（engine 内部子模块 5/5，票 `stage-state-facts/01`）
 *
 * 本簇只答一个问题：`domain-rules.stageStateOf` 的四个入参，**分别从哪些盘上的读数来**。
 * 其中三项（产物在不在／审计新不新／意见清没清）由本文件取；交工那一枚由 facade 用
 * `chapterHasSubmitEvent` 算好递进来（它要读账本，而本文件不读账本，决策 8）。它**不判档**：
 * `stageStateOf` 仍是唯一的判档处（ADR-0031 决策 4），本文件不 import 它、不返回 `{state, reason}`。
 *
 * ## 为什么住在这里，而不是 `domain-rules.js`
 *
 * 取事实要读盘（`existsSync`／`statSync`），而 `domain-rules.js` 是零 node 内置依赖的双端纯模块
 * （前端 bundle 真的 import 它）。本文件与 `paths.js`／`store.js`／`submission.js` 同属「引擎子模块簇」，
 * 对 engine 之外零导出；`ADR-0003` 的「external seam 只有 HTTP 层」一个字不动。
 *
 * ## 四条生产调用点，收成三条路线（描述现状，不是统一口径的授权）
 *
 * 下表逐行写清「四项事实从哪来」。三处已知分歧**逐字列在本文件下方 `① ② ③`**，
 * 其中只有 ① 由票 05 对齐，②③ 保留（spec 决策 6）。
 *
 * ⚠️ 本表是**描述**：改「哪些文件必须在盘上」时只有本表一处要改，但**不要**把分歧顺手统一
 * ——统一要单独一票。
 */
import { existsSync, statSync } from 'node:fs'
import { basename } from 'node:path'

import { auditCoversProduct, pairedAuditRels } from '../../domain-rules.js'
import { chapterArtifacts, workFile, bookRelOnDisk } from './paths.js'
import { readMeta } from './store.js'


/**
 * 聚合那一格「检查件新不新」的**不适用**取值（票 `stage-state-facts/03`）。
 *
 * 这一档的检查件新不新，已经由上面每一行产物行判过（`stepStageState` 的循环一有 `reason` 就
 * `return`，走到聚合时每行必然已新鲜）。聚合这一格**不适用**，不是「没判」。
 * ⛔ 别改成读盘：那会和产物行重复判一次，且第二份判据会漂。
 *
 * ⚠️ 它在改之前也是 `true`——**不改变任何判决**，只是把「为什么是 true」从裸字面量变成具名常量。
 * ⚠️ 票 `quality-review-2026-10-29/07`：它**不导出**（全仓零外部消费者，只有本文件
 * {@link rowFacts} 自用）——零消费者符号留在导出面上＝白付一格 interface（`ADR-0044` 决策 2
 * 第六行）。防回潮格在 `test/test-ledger-seq-integrity.mjs` 的「零消费者符号」那一组。
 */
const AUDIT_FRESH_NOT_APPLICABLE = true


/**
 * 路线表：每一条路怎么取那四项事实。
 *
 * 键是路线（`engine.js` 的 `STEP_OUTPUT_ROWS` 决定一条路走哪一行）：
 * · `chapter`   章级：两份产物 ＋ 同号检查件 ＋ 章档交工；
 * · `rows`      产物行：`STEP_OUTPUT_ROWS` 逐行，配对检查件按 `pairedAuditRels`；
 * · `aggregate` 聚合：只在所有产物行都 `reason === null` 之后才取，审计那一格「不适用」。
 *
 * ⚠️ 三条可观测后果（矩阵第 5／9／14 格）就是下面三条分歧的读数；第 9／14 格由票 05 改。
 */
const FACT_ROUTES = Object.freeze({
  chapter: Object.freeze({
    artifactPresent: '正文与同号检查件两份都在盘上',
    auditFresh: '同号检查件不比正文旧（mtime；读不出不判旧）',
    reviewPending: 'pendingReviews 里该章 status === pending（只这一张表，不看另外两张）',
    submitRecorded: 'chapterHasSubmitEvent：章档 label（含范例章那一支）',
    why: '章级那条路：两份产物是一对，缺一份就算产物不在（与产物行「缺一份 ⇒ 过期」不同，保留）',
  }),
  rows: Object.freeze({
    artifactPresent: '产物行指向的那一份在盘上',
    auditFresh: '配对检查件清单为空 ⇒ 不适用；非空而缺一份或有一份更旧 ⇒ 过期',
    reviewPending: '由调用方喂进来的那一枚（stepStageState 的 userFeedbackInFlight 算好）',
    submitRecorded: '由调用方喂进来的那一枚（stepSubmitRecorded ／ mergeSubmitRecorded 已算好）',
    why: '产物行那条路：配对检查件由 domain-rules.pairedAuditRels 取，⛔ 不按文件名猜',
  }),
  aggregate: Object.freeze({
    artifactPresent: '这一步的产物行数量大于零',
    auditFresh: '不适用：走到聚合时每一行产物行都已判过新鲜（循环一有 reason 就 return）',
    reviewPending: '同 rows：同一个 reviewPending 变量（不自己再算）',
    submitRecorded: '同 rows：stepSubmitRecorded ／ mergeSubmitRecorded 已在上游算好',
    why: '聚合只把「全部行都齐」这句话翻成四档状态，⛔ 不在这里重判一次盘上事实',
  }),
})


/** 把四个事实交给调用方，同时确认路线名仍在 {@link FACT_ROUTES} 里。
 *
 * 表本身是**给人读的**「四项事实从哪来」；这个薄入口只保证路线的名字没有从表里漂走
 * （删一行／拼错一个键 ⇒ 调用当场抛，而不是留一张没人读的表）。
 */
function factsFor(route, facts) {
  if (FACT_ROUTES[route] === undefined) throw new Error(`unknown stage facts route: ${route}`)
  return facts
}


/*
 * ── 三处已知分歧（逐字标出，不粉饰成「一致」）────────────────────────────────
 *
 * ① **未清零的口径**（票 05 已对齐）：章级只认 `pendingReviews` 里 `status === 'pending'`；
 *    产物行走 `userFeedbackInFlight`，那一份原先认 `status !== 'revoked'`，票 05 把第一项也
 *    对齐到 `pending`（`applied` 不再算未清零）——矩阵第 9／14 格因此从 `unconfirmed/review`
 *    变成 `ready/null`。另外两张表（`pendingInterventions`／`goldOpinions`）**不动**：它们是
 *    各自的在飞档，章级本来就不看它们。第 2／3 条分歧**保留**（spec 决策 6）。
 * ② **交工谓词**（保留）：章级用 `chapterHasSubmitEvent`（章档 label）；产物行用
 *    `stepSubmitRecorded`（步档 label）／`mergeSubmitRecorded`（合并档）。三个谓词的**语义对象不同**
 *    （章档／步档／合并档），不是同一件事的三份实现。gold 那一档只记了章档交工、没记范例章交工时，
 *    章级 `ready`、步级 `unconfirmed/submit`（14 格矩阵没有单列这一格：两条路要的事件形状不同）。
 * ③ **另外两张表挡不住章级**（保留）：`userFeedbackInFlight` 数 `pendingInterventions === 'pending'`
 *    与 `goldOpinions ∈ {pending, sent}`，而章级只看 `pendingReviews`。这不是漏写：两张表的语义
 *    对象不是「这一章的意见」，章级没有对应的那一枚事实。
 */


/**
 * 章级那一条路：四档环节状态的**四个入参**（判档仍由 `engine.js` 调 `stageStateOf`）。
 *
 * @param {{projectId: string, meta?: object|null, submitRecorded?: boolean}} ctx 已取好的原料
 * @param {number} n 1 起的章号
 * @returns {{artifactPresent: boolean, auditFresh: boolean, reviewPending: boolean, submitRecorded: boolean}}
 */
export function chapterFacts(ctx, n) {
  const { projectId, meta = null, submitRecorded = false } = ctx
  const current = meta ?? readMeta(projectId)
  const { chapterPath } = chapterArtifacts(projectId, n)
  const audit = chapterAuditReading(projectId, n)
  return factsFor('chapter', {
    artifactPresent: existsSync(chapterPath) && audit.present,
    auditFresh: audit.fresh,
    reviewPending: (current?.pendingReviews ?? []).some((r) => r?.chapter === n && r?.status === 'pending'),
    // ⚠️ 交工那一枚由 facade 用 `chapterHasSubmitEvent` 算好递进来：那个谓词要 `readEvents`，
    // 而新子模块**不读账本**（决策 8）。四项事实仍由本函数一次交出，调用方不自己拼。
    submitRecorded: submitRecorded === true,
  })
}


/**
 * 某一章「正文与同号检查记录」的 mtime 读数 ＋ 新鲜判定——**取事实只此一处**（票
 * `audit-state-regression/01`）。
 *
 * 章级四项事实（{@link chapterFacts}）与交付清单的逐章读数都从这里取，⛔ 不各读一次盘：
 * 两次读盘在正常书上看不出差别，但「哪一份算检查记录」和「拿哪两个时刻比」会在两侧漂开。
 *
 * ⚠️ 新鲜判定仍是 `domain-rules.auditCoversProduct` 的**同一份实现**；本函数只取两侧 mtime。
 * 读不出 mtime 时**不判旧**（`auditCoversProduct` 的口径），但检查件**不在**时 `fresh` 必为
 * `false`——「缺一份」不是「读不出」。
 *
 * @param {string} projectId
 * @param {number} n 1 起的章号
 * @returns {{productModifiedAt: number|null, auditedModifiedAt: number|null, present: boolean, fresh: boolean}}
 */
export function chapterAuditReading(projectId, n) {
  const { chapterPath, auditPath } = chapterArtifacts(projectId, n)
  return auditReadingOf(chapterPath, auditPath)
}

/** 任意一对「产物 ＋ 检查件」的同一份读数（章级与产物行共用）。 */
function auditReadingOf(productPath, auditPath) {
  const productModifiedAt = safeMtimeMs(productPath)
  const auditedModifiedAt = safeMtimeMs(auditPath)
  return {
    productModifiedAt,
    auditedModifiedAt,
    present: auditedModifiedAt !== null,
    fresh: auditedModifiedAt !== null
      && auditCoversProduct({ productModifiedAt, auditedModifiedAt }),
  }
}


/**
 * 产物行那一条路：某一步某个产物行的**四个入参**（判档仍由 `engine.js` 调 `stageStateOf`）。
 *
 * ⚠️ **配对检查件经 `domain-rules.pairedAuditRels` 取，不在这里按文件名猜**：那一份是
 * 「这一行结构上有没有配对检查件」的单一出处，空数组＝没有（过期那一档对那几族不适用）。
 * 它曾在 facade 里就地做「产物文件名 → 检查件名」的字符串变换，对不带章号前缀的行那次变换
 * **原样返回** ⇒ 拿自己当自己的检查件 ⇒ 自比较恒真 ⇒ 过期那一档恒不可达。本行是那条源码钉
 * （`test/test-legacy-book-read.mjs`）定位的锚，**逐字保留**。
 *
 * ⚠️ **三档判法，缺的那一档不许蒙过去**：
 *   · 配对清单为空 ⇒ 结构上就没有配对检查件 ⇒ 这一项**不适用**，不判旧；
 *   · 配对清单非空而**缺一份** ⇒ 判不成立（把「还没审」与「审的是旧稿」并成一档，
 *     因为注入面那一行给的口径就是「须重新审计」——那正是缺一份时该说的话）；
 *   · 齐了且没有一份比产物旧 ⇒ 审的就是当前这份。
 *
 * @param {{projectId: string, reviewPending?: boolean, submitRecorded?: boolean}} ctx
 * @param {string} stage 分段机器键（配对检查件那张表按它分档）
 * @param {string} productRel 产物行的书夹相对形状（规范形状）
 * @returns {{artifactPresent: boolean, auditFresh: boolean, reviewPending: boolean, submitRecorded: boolean}}
 */
export function rowFacts(ctx, stage, productRel) {
  const { projectId, reviewPending = false, submitRecorded = false } = ctx
  const productPath = workFile(projectId, basename(productRel))
  const auditRels = pairedAuditRels(stage, productRel)
  return factsFor('rows', {
    artifactPresent: existsSync(productPath),
    auditFresh: auditRels.length === 0 || auditRels.every((rel) => {
      const auditPath = bookRelOnDisk(projectId, rel)
      const reading = auditReadingOf(productPath, auditPath)
      return reading.present && reading.fresh
    }),
    reviewPending,
    submitRecorded,
  })
}


/**
 * 聚合那一条路：某一步**所有产物行都齐**之后的四个入参（判档仍由 `engine.js` 调 `stageStateOf`）。
 *
 * ⚠️ `artifactPresent` **由调用方给**（`chapters.length > 0` ／ `outputs.length > 0`），本票不碰
 * 那条口径；`auditFresh` 恒取那个具名「不适用」常量——聚合这一格**不适用**，
 * 不是「没判」。⛔ 不在这里重读盘：那会和产物行重复判一次，且第二份判据会漂。
 *
 * @param {{artifactPresent?: boolean, reviewPending?: boolean, submitRecorded?: boolean}} ctx
 * @returns {{artifactPresent: boolean, auditFresh: boolean, reviewPending: boolean, submitRecorded: boolean}}
 */
export function stepFacts(ctx) {
  const { artifactPresent = false, reviewPending = false, submitRecorded = false } = ctx
  return factsFor('aggregate', {
    artifactPresent,
    auditFresh: AUDIT_FRESH_NOT_APPLICABLE,
    reviewPending,
    submitRecorded,
  })
}


/**
 * mtime（毫秒）；读不出返回 `null`（`auditCoversProduct` 把「读不出」判成「不判旧」）。
 */
function safeMtimeMs(path) {
  try {
    return statSync(path).mtimeMs
  } catch {
    return null
  }
}
