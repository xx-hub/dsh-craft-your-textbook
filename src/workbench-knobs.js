/**
 * 工作台剩下的那一个旋钮（票 `walkthrough-fixes/19`②；票 `confirm-points-redesign-build/03` 收窄）。
 *
 * ## 这一份是什么／不是什么
 *
 * 它是**纯数据 ＋ 纯函数**：并发上限的默认值与取值域。**没有状态、没有副作用、不认识账本**
 * ——写盘与落账归动作层（`src/workflow/actions/books.js`）。
 *
 * ## ⚠️ 票 `confirm-points-redesign-build/03`：篇幅档位那一半**整块删掉了**
 *
 * 原来这里还有一张「档位 →（章节数上限, 每章字数目标）」的表（`LENGTH_PRESETS` ＋
 * `deriveLengthPlan` ＋ `lengthStyleLine` ＋ 两条 brief 提示）。2026-10-16 裁决**三档删除**：
 * 建书不再问、书里不再有那个字段（`meta.lengthPreset` 从此没有写入点，盘上老书那格全空 ⇒
 * **无迁移**）。连带三处：
 *   · 章数上下限**都不判**（票 `stage3-hard-limits/02`）；站 6 拍板的章数
 *     （`工作区/决策/06.json` 的 `values.chapters`）只做非阻断对账读数，见 `actions/chapters.js`
 *     ——⛔ 本文件不在这里留一份章节数上限；
 *   · 「不许静默回落默认值」那条先例的靶子改挂**章数**（`docs/adr/0037…`）；
 *   · 每章字数仍**永不验**，字数一切归**站 9 谈判桌**。
 *
 * ## ⚠️ 枚举面比现实窄在哪里（本仓纪律，`AGENTS.md` 票 `dev-gate-scan/17`）
 *
 * 删掉那张表之后本模块只剩「并发上限的取值域」这一件事：它保证「用户拧过/没拧过时读到的
 * 那个数是多少」。它**不**保证主笔 AI 真的一次只派这么多个（宿主没有小助手生命周期的可消费
 * 事实，交办件级只证**字在位**）。
 */

/**
 * 并发上限的**默认值**。
 *
 * 票 `walkthrough-fixes/19`（2026-10-06）当时取 3＝那轮实测的现状；票
 * `confirm-points-redesign-build/03`（2026-10-16）按已裁的口径改成 **5**——代码里的 3
 * 是实现没跟上（`confirm-points-redesign/map.md` 第 03 行：默认＝**Q8 已裁的 5**）。
 */
export const DEFAULT_MAX_CONCURRENT_SUBAGENTS = 5

/** 取值域上界。⚠️ 这是**实现选择**，不是宿主限制（宿主自己有并行容量设置）。 */
export const MAX_CONCURRENT_SUBAGENTS_CEILING = 8

/**
 * 读一个「一次最多派几个小助手」的输入。
 *
 * 三种出口必须分得开（同「读不出来不是 0」那条纪律）：
 *   · `null` —— 这个字段**没传**（走默认值）；
 *   · `{ok:true, value}` —— 传了且合法；
 *   · `{ok:false}` —— 传了但不合法（调用方**当场拒**，⛔ 不许静默夹到边界里）。
 *
 * @param {unknown} raw
 * @returns {{ok: true, value: number}|{ok: false}|null}
 */
export function readMaxConcurrentSubagents(raw) {
  if (raw === undefined || raw === null || raw === '') return null
  const n = Number(raw)
  if (!Number.isSafeInteger(n) || n < 1 || n > MAX_CONCURRENT_SUBAGENTS_CEILING) return { ok: false }
  return { ok: true, value: n }
}

/** 交办件里那段**硬约束**（各阶段 brief 的 hints 都用这一句，⛔ 不在各阶段各写一份）。 */
export function concurrencyDisciplineLine(max) {
  return `并发上限（用户可拧的旋钮）：**一次最多派 ${max} 个小助手**，任何阶段都不许超`
    + `（派单模板 resources/references/subagent-prompts/ 里逐份写着同一句硬约束）。`
    + '这条是硬约束不是建议：派之前先数一数手上在跑几个；已经到上限就等一个回来再派下一路。'
    + '用户改过这个上限时，过程记录里有一条对应的记录（工作台查得到）。'
}

/** 改并发上限那一条账的正文（走**既有**事件通道 `textbook/hint`，⛔ 不新开事件类型）。 */
export function concurrencyLedgerLine(max) {
  return `🎚 并发上限已改为 ${max}：之后各阶段一次最多派 ${max} 个小助手（交办件与派单模板都照这个数）。`
}
