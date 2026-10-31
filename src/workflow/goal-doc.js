/**
 * **站 3 的正文**：`工作区/目标-vM.md` 的**盘上读写侧**（票 `confirm-points-redesign-build/05`）。
 *
 * 形状的权威源＝`.scratch/confirm-points-redesign/issues/05-每个确认点吃什么.md` 的 `## Answer`
 * （Q7′ 乙／Q9 甲／Q10 甲）＋ spec §3.2 站 3 那一节：
 *
 * - **载体**：独立正文，**带版本号** `目标-vM.md`（照 `工作区/方案/关卡N-vM.md` 的先例，Q10 甲）；
 * - **谁产出**：**站 2 拍板之后另跑的一趟**（Q9 甲）——⛔ 不跟探查同一趟，那样它就没吃站 2
 *   划掉的那些卡；站 2 驳回重做探查时**不连带作废目标**（两件事的补救动作不同）；
 * - **它是什么**：那 **3–5 条**「学完要能做到什么」。⚠️ 术语：它就是**一个目标**，
 *   ⛔ 不叫「上沿」（那是 rcb 那一族的词，＝这本书能教到的知识范围）。
 *
 * ⚠️ **名字、版本规则、渲染与读回不在这里**：它们住在 **`src/goal-doc-format.js`**（零 `node:fs`
 * 的纯形状层）。理由是界面那张卡（浏览器侧）也要认同一条版式，而本文件引了 `node:fs`
 * ⇒ 界面⛔ 引不动它。本文件把它们**再导出**，于是消费侧仍然只有一个入口。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）
 *
 * · {@link readGoalDocOnDisk} 只认 `目标-v<正整数>.md` 这一族（{@link GOAL_DOC_RE}）。
 *   盘上出现别的名字的目标文档时 {@link goalDocVersionOnDisk} 看不见它——
 *   「现实比声明面大」这件事是本票如实登记的窄处。
 * · 读回只认**自己 {@link renderGoalDoc} 写出来的那一种形状**（一级标题 ＋ `N. ` 起首的编号行）；
 *   手改过盘上那份文件（在条目下面补一段说明）时，那一段**读不回来**。
 * · 本模块**不碰** `SWEEP_EXCLUDED`／`BOOK_PRODUCT_FAMILIES`（产物清单那一面归别的族，
 *   见票面 `## Answer` 里那条如实登记的偏离）。
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { bookRelOnDisk, workDir } from './engine/paths.js'
import { GOAL_DOC_RE, goalDocName, goalDocRel, readGoalDoc, renderGoalDoc } from '../goal-doc-format.js'

// 纯形状层**再导出**（消费侧只认这一个入口）：界面那边引的是 `src/goal-doc-format.js`。
export { GOAL_COUNT_MAX, GOAL_DOC_RE, goalDocName, goalDocRel, goalDocTitle, readGoalDoc, renderGoalDoc } from '../goal-doc-format.js'

/**
 * 盘上已有的站 3 正文里**最大的那个版本号**（一份都没有 ⇒ `0`）。
 *
 * 读目录失败（书夹还没建）⇒ 也是 `0`：那是「这一站还没跑过」，不是错误。
 *
 * @param {string} projectId
 * @returns {number}
 */
export function goalDocVersionOnDisk(projectId) {
  let entries = []
  try {
    entries = readdirSync(workDir(projectId))
  } catch {
    return 0
  }
  let max = 0
  for (const entry of entries) {
    const match = GOAL_DOC_RE.exec(entry)
    if (match === null) continue
    max = Math.max(max, Number(match[1]))
  }
  return max
}

/**
 * 下一趟该写的版本号（盘上最大 ＋1；一份都没有 ⇒ 1）。
 *
 * ⚠️ 「下一趟」指**又一次产出**（第一次跑、或站 3 驳回之后的「让 AI 重写这几条」）。
 * 人在界面上逐条改完点「就按这几条办」**不是**又一版——那是**同一版被拍板**，
 * 机器用同一条渲染函数把拍过板的那几条**原地重写**回这一份（见 `actions/gates.js` 那一支）。
 */
export function nextGoalDocVersion(projectId) {
  return goalDocVersionOnDisk(projectId) + 1
}

/**
 * 盘上那一份正文的**权威读侧**：`version` 缺省取盘上最大那一版；读不出 ⇒ `{version: 0, goals: []}`。
 *
 * @param {string} projectId
 * @param {number} [version]
 * @returns {{version: number, rel: string|null, goals: string[]}}
 */
export function readGoalDocOnDisk(projectId, version = undefined) {
  const v = Number.isFinite(version) ? Number(version) : goalDocVersionOnDisk(projectId)
  if (!Number.isSafeInteger(v) || v < 1) return { version: 0, rel: null, goals: [] }
  let text = ''
  try {
    text = readFileSync(bookRelOnDisk(projectId, goalDocRel(v)), 'utf8')
  } catch {
    return { version: 0, rel: null, goals: [] }
  }
  return { version: v, rel: goalDocRel(v), goals: readGoalDoc(text) }
}

/**
 * **写点**：把这一版那几条落成 `工作区/目标-vM.md`。
 *
 * ⚠️ 写侧经 `workDir`（它带老书兜底，与 `decision-record.js` 同一口径）；读侧一律
 * `bookRelOnDisk`（只算不建）。
 *
 * @param {string} projectId
 * @param {number} version
 * @param {string[]} goals
 * @returns {{rel: string, version: number, goals: string[]}}
 */
export function writeGoalDoc(projectId, version, goals) {
  const v = Number(version)
  const clean = (Array.isArray(goals) ? goals : [])
    .map((goal) => String(goal ?? '').trim())
    .filter((goal) => goal !== '')
  writeFileSync(join(workDir(projectId), goalDocName(v)), renderGoalDoc(v, clean), 'utf8')
  return { rel: goalDocRel(v), version: v, goals: clean }
}
