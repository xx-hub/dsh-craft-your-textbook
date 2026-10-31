/**
 * 确认点结论件的**读侧**（`工作区/决策/NN.json`）。
 *
 * ## 这一份是什么／不是什么
 *
 * 十站分法（`confirm-points-redesign/spec.md` §4.6）里，**从站 1 起每个确认点各落一份结论件**：
 * 拍板那一刻机器把这一站**结构化**的那几个值写进 `values`（如站 6 的 `{"chapters": 10}`）。
 * 本模块只做一件事：**把它读出来**——不认识账本、不写盘、不判合法性。
 *
 * ⚠️ **写侧归票 `confirm-points-redesign-build/07`**（本票 `03` 只读）：07 落地前盘上没有这些件，
 * 读侧必须**当「这一格没写」处理**（`null`），⛔ 不许回落任何默认值——那正是
 * 「不许静默回落默认值」那条先例要防的形状（先例的靶子由本票改挂**章数**）。
 *
 * ## ⚠️ 枚举面比现实窄在哪里（本仓纪律，`AGENTS.md` 票 `dev-gate-scan/17`）
 *
 * 本模块看得见的只有**这一条路径下、这个形状**的件：`工作区/决策/NN.json` 里
 * `values` 是一个对象。它**看不见**：别处另存的章数（书里别的地方若也记了一个章数，本模块
 * 无从知道谁对谁错）、以及 07 打算写却没写进去的那些值。它也不判「这个件是不是给这一站的」
 * （路径由调用方给；今天只有一处调用，给的是 `'06'`）。
 */
import { readStationDecision } from './decision-record.js'

/**
 * 读某一站的 `values`（**可选键**那一格）。
 *
 * @param {string} projectId 书名夹
 * @param {string} station 站号（`'06'` 这种两位字符串）
 * @returns {object|null} `values` 对象；件不在／读不动／`values` 不是对象 ⇒ `null`
 */
export function readDecisionValues(projectId, station) {
  // ⚠️ 读侧**只有一处实现**：`decision-record.js` 的 `readStationDecision()`（票 01 落的读侧）。
  // 本层只做「取 `values` 那一格」的投影——⛔ 不自己拼路径、不自己 `JSON.parse`（两处真相要付代价）。
  const record = readStationDecision(projectId, station)
  if (record === null) return null
  const values = record.values
  if (values === null || values === undefined) return null
  if (typeof values !== 'object' || Array.isArray(values)) return null
  return values
}

/**
 * 站 6（第 3 关）拍板的**章数**——章数**非阻断对账读数**唯一该读的数（2026-10-27 起不再是硬闸）。
 *
 * 两种出口分得开：
 *   · `null` —— 这一格**没写**（07 还没落地 / 用户没拍过）⇒ 调用方**不判**（⛔ 不设上下限，
 *     也⛔ 不回落任何默认章数）；
 *   · 正整数 —— 拿它与实际章数对账，不一致只记一条读数、⛔ 不拒收。
 *
 * ⚠️ `values.chapters` 写了但**不是正整数**（字符串、0、负数、小数）时也回 `null`：
 * 今天只有一个写侧（07 的机器代填），本模块不替它猜。这一句是自陈的窄处——判据那一侧
 * 与我看到的是同一份形状。
 */
export function readDecisionChapterCount(projectId) {
  const values = readDecisionValues(projectId, '06')
  if (values === null) return null
  const raw = values.chapters
  const n = Number(raw)
  if (!Number.isSafeInteger(n) || n < 1) return null
  return n
}
