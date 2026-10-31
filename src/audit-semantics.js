/**
 * 章审计的**通过语义**（票 `audit-gate-semantics/01`）。
 *
 * ## 病（票面）
 *
 * 逐章审计产物 `工作区/audit-NN.md` 的 `passed` 由审计小助手**自报**：真机上 `passed:true`
 * 同时列着 14／17 条未改问题，其中一条自己写着「（上一轮第 2 条，**未改**）」——下游读到
 * `passed:true` 就放行。`issues[].level` 有「错误／警告／提示」之分，但闸门不看级别；
 * 每条 issue 也没有「改没改」的状态。
 *
 * ## 现在的契约
 *
 * 1. 每条 `issues[]` 必须带 `status ∈ {open, fixed, accepted-risk}`。
 *    `accepted-risk` 还必须写 `reason`（为什么可以接受）与 `confirmedBy`（谁确认的）。
 * 2. `passed` **不再采信自报那一半**：`computedPassed` 由 issues 现算——
 *    存在 `level=错误 且 status=open` ⇒ false；`level=警告 且 status=open` 超过
 *    {@link AUDIT_WARNINGS_OPEN_MAX} ⇒ false；提示级不阻断（但仍留在 issues 里落盘）。
 * 3. **所有闸门读的都是 `computedPassed`**：审计员自报的 `passed` 只留在产物里给人看，
 *    机器一个字都不采信（票面：「`passed` 不再由审计小助手自报：服务端按 issues 现算」）。
 *    自报 true 不能把红的说成绿的；自报 false 也不会把一份已清零的记录洗成红的——
 *    「改完回写」回写的是每条 issue 的 `status`，那才是机器读的那一半。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）
 *
 * - 只判 **issues 的形状与状态**：`text` 是否说清「哪份文件哪一节、为什么、怎么改」、
 *   `level` 判得对不对、`status` 标得诚不诚实，机器一个字都不读（那是审计员与人的判断）。
 * - 不判「审计员真读过正文」「L1–L5 逐层做没做」「试教触发没触发」——那几条仍是只有承诺的一半。
 * - 老记录**没有 `issues` 数组**时按「零条」读（`test-style-spec-unfrozen-record` 那类老夹具的
 *   形状）：没有条目就没有可 open 的条目，这一层不凭空判红。**有** `issues` 数组时逐条严判。
 * - `accepted-risk` 的 `reason`／`confirmedBy` 只判「非空字符串」，不判理由是否成立、
 *   确认人是否真的是用户。
 */

/** 审计条目的级别闭集（契约：`错误／警告／提示` 三选一）。 */
const AUDIT_LEVELS = Object.freeze(['错误', '警告', '提示'])

/** 审计条目的状态闭集（票面 A3：每条都必须有 status）。 */
const AUDIT_STATUSES = Object.freeze(['open', 'fixed', 'accepted-risk'])

/**
 * `passed` 语义里「未解决警告」的阈值——**只此一处**。
 *
 * 取 **0**：票面把 `audit-05`（`passed:true` ＋ 2 条问题）也列为矛盾样本，说明「有未解决的
 * 警告也标绿」正是本票要治的那一类；提示级才是唯一不阻断的档。将来要放宽，只改这一个数。
 */
export const AUDIT_WARNINGS_OPEN_MAX = 0

/** 读数行的四个键（票面「要的做法」第 3 条）——顺序即人读顺序。 */
export const AUDIT_READING_KEYS = Object.freeze(['errors_open', 'warnings_open', 'fixed', 'accepted'])

/** `issues` 数组（缺失／null 按零条；非数组由 {@link auditIssueProblems} 点名）。 */
function auditIssuesOf(audit) {
  return Array.isArray(audit?.issues) ? audit.issues : []
}

/**
 * 审计条目**形状**的问题清单（空数组＝合格）。每条都点名第几条、缺什么。
 *
 * ⚠️ 它只判形状，不判 `passed`；`passed` 的现算在 {@link auditVerdict}。
 *
 * @param {unknown} audit 解析后的审计 JSON
 * @returns {string[]}
 */
function auditIssueProblems(audit) {
  const problems = []
  if (typeof audit?.passed !== 'boolean') {
    problems.push('缺 passed 布尔（这个字段要保留供人读；机器不采信它，但契约要求它在）')
  }
  const raw = audit?.issues
  if (raw !== undefined && raw !== null && !Array.isArray(raw)) {
    problems.push('issues 不是数组（契约要求 issues: [] 或每条 issue 的数组）')
    return problems
  }
  const issues = Array.isArray(raw) ? raw : []
  issues.forEach((issue, index) => {
    const at = `第 ${index + 1} 条 issue`
    if (issue === null || typeof issue !== 'object' || Array.isArray(issue)) {
      problems.push(`${at}不是对象`)
      return
    }
    if (typeof issue.text !== 'string' || issue.text.trim() === '') {
      problems.push(`${at}缺 text（要写清哪份文件哪一节、什么问题、为什么、建议怎么改）`)
    }
    if (!AUDIT_LEVELS.includes(issue.level)) {
      problems.push(`${at}的 level 是 ${JSON.stringify(issue.level)}（只能是 ${AUDIT_LEVELS.join('／')}）`)
    }
    if (!AUDIT_STATUSES.includes(issue.status)) {
      problems.push(`${at}缺 status（每条必须写 status=${AUDIT_STATUSES.join('|')}）`)
    }
    if (issue.status === 'accepted-risk') {
      if (typeof issue.reason !== 'string' || issue.reason.trim() === '') {
        problems.push(`${at}是 accepted-risk，必须写 reason（为什么可以接受这个风险）`)
      }
      if (typeof issue.confirmedBy !== 'string' || issue.confirmedBy.trim() === '') {
        problems.push(`${at}是 accepted-risk，必须写 confirmedBy（谁确认接受这个风险）`)
      }
    }
  })
  return problems
}

/**
 * 审计读数的**唯一算法**（票面 A2「可复算」、第 3 条读数行）：
 * `errors_open`／`warnings_open`／`fixed`／`accepted`。
 *
 * - `errors_open`：`level=错误 且 status=open`
 * - `warnings_open`：`level=警告 且 status=open`
 * - `fixed`：`status=fixed`（不论级别）
 * - `accepted`：`status=accepted-risk`（不论级别）
 *
 * @param {unknown} audit
 * @returns {{errors_open: number, warnings_open: number, fixed: number, accepted: number}}
 */
function auditReadings(audit) {
  const issues = auditIssuesOf(audit)
  const count = (level, status) => issues.filter((issue) => issue?.level === level && issue?.status === status).length
  return {
    errors_open: count('错误', 'open'),
    warnings_open: count('警告', 'open'),
    fixed: issues.filter((issue) => issue?.status === 'fixed').length,
    accepted: issues.filter((issue) => issue?.status === 'accepted-risk').length,
  }
}

/** 读数行的人读形态（拒收文案／答复读数共用，⛔ 不各拼一份键名）。 */
export function readingsLine(readings) {
  return AUDIT_READING_KEYS.map((key) => `${key}=${Number.isSafeInteger(readings?.[key]) ? readings[key] : '?'}`).join('、')
}

/**
 * 一条审计记录的完整裁决——**`passed` 的唯一计算点**。
 *
 * @param {unknown} audit 解析后的审计 JSON
 * @returns {{
 *   problems: string[],
 *   readings: {errors_open: number, warnings_open: number, fixed: number, accepted: number},
 *   declaredPassed: boolean|null,
 *   computedPassed: boolean,
 *   passed: boolean,
 * }}
 *   `computedPassed`＝按 issues 现算；
 *   `passed`＝`computedPassed`（所有闸门读它；自报字段只作为 `declaredPassed` 回显给人看）。
 */
export function auditVerdict(audit) {
  const problems = auditIssueProblems(audit)
  const readings = auditReadings(audit)
  const declaredPassed = audit?.passed === true ? true : (audit?.passed === false ? false : null)
  const computedPassed = problems.length === 0
    && readings.errors_open === 0
    && readings.warnings_open <= AUDIT_WARNINGS_OPEN_MAX
  return { problems, readings, declaredPassed, computedPassed, passed: computedPassed }
}

/**
 * 形状问题的拒收文案（章交工／范例章提审共用同一句，⛔ 不各写一份）。
 *
 * @param {string[]} problems {@link auditIssueProblems} 的结果
 * @returns {string}
 */
export function auditShapeRejectReason(problems) {
  const shown = problems.slice(0, 3).join('；')
  const more = problems.length > 3 ? `；另有 ${problems.length - 3} 条同类问题` : ''
  return `审计记录不合契约：${shown}${more}。每条 issue 必须写 {level: 错误|警告|提示, status: open|fixed|accepted-risk, text: …}；`
    + 'accepted-risk 还要写 reason（为什么可以接受）与 confirmedBy（谁确认的）。'
}
