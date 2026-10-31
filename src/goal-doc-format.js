/**
 * 站 3 那份正文（`工作区/目标-vM.md`）的**纯形状层**（票 `confirm-points-redesign-build/05`）。
 *
 * ⚠️ **为什么它单独一层、不带任何 `node:fs`**：这份文档的**写侧**（机器在交工那一刻落盘）
 * 与**读侧的人眼那一面**（界面上那 3–5 条逐条可改／删／加的一张卡）必须说同一种形状，
 * 而界面是浏览器侧代码——`workflow/goal-doc.js` 引了 `node:fs`，界面⛔ 引不动它。
 * ⇒ 名字、版本规则、渲染与读回住在这里；盘上读写留在 `workflow/goal-doc.js`（它再导出这一层）。
 * 「一处真相」因此仍然成立：**渲染只有一份**，界面不手抄第二份版式。
 *
 * 形状的权威源＝`.scratch/confirm-points-redesign/issues/05-每个确认点吃什么.md` 的 `## Answer`
 * （Q7′ 乙／Q9 甲／Q10 甲）＋ spec §3.2 站 3：独立正文、**带版本号**（照 `关卡N-vM.md` 的先例）、
 * 内容就是那 **3–5 条**「学完要能做到什么」。
 */

/** 站 3 正文的文件名形状（`M` ＝正整数版本号）。⛔ 与 `工作区/方案/关卡N-vM.md` 同一条先例。 */
export const GOAL_DOC_RE = /^目标-v([1-9]\d*)\.md$/u

/** 站 3 正文所在的那一层目录（书夹相对；与 `domain-rules.WORK_DIR_NAME` 同值，界面侧不引它）。 */
const GOAL_DOC_DIR_REL = '工作区'

/**
 * 一次交工最多接受几条（**形状上限，不是内容判据**）。
 *
 * ⚠️ 「**3–5 条**」是**提示、不是硬拦**（spec §3.2 站 3）：材料本身可能只撑得起 2 条
 * ⇒ 下限**不设**（设了就是把提示写成硬闸）；上限只防「把一段散文整段塞进一格」那种形状失控。
 * 「这几条到底够不够可检验」机器一个字都不读——那是**只有承诺**的那一半。
 */
export const GOAL_COUNT_MAX = 10

/** 站 3 正文的基名（`workFile` 那一族要的是基名，不是相对路径）。 */
export function goalDocName(version) {
  return `目标-v${Number(version)}.md`
}

/** 站 3 正文的**规范形状**书夹相对路径（老书兜底那一份由 `bookRelOnDisk` 自己认）。 */
export function goalDocRel(version) {
  return `${GOAL_DOC_DIR_REL}/${goalDocName(version)}`
}

/**
 * 「这条**书夹相对路径**是不是站 3 那一份正文」——`工作区/目标-vM.md` 那一族的**唯一判据**。
 *
 * 谁要这个判据：`domain-rules.productOpenMode`（预览准入 ＝ `/textbook/file` 的白名单，
 * 票 `goals-handoff-missing/01`）与任何按路径族认它的地方。⛔ 别在别处再拼一份
 * `工作区/目标-v\d+.md`：目录名与文件名形状都在本文件里，抄第二份就多一处会与写侧漂的枚举
 * （`GOAL_DOC_RE` 的 `u` 标志与「版本号从 1 起」也在那一份里）。
 *
 * ⚠️ 只认**规范形状**（新名、正斜杠、`工作区/` 根下）：子目录里的同形件、缺版本号的 `目标.md`、
 * 前导零的 `目标-v01.md`、带尾巴的 `.md.bak` 都**不算**——它们不是这一族的读数，
 * `readGoalDocOnDisk` 那侧同样看不见它们（窄处登记在 `workflow/goal-doc.js` 文件头）。
 *
 * ⚠️ 斜杠与 `./` 前缀的归一**调调用方那一份**（`domain-rules.posixBookRel`），⛔ 不在这里另写一遍
 * ——同一条正则在本仓已经有两处（`posixBookRel`、`ui/view-rules.relPath`），第三处只会多一个漂的点。
 * 调用方（`productOpenMode` 与 `view-rules.nameForRel`）传进来的**已经是归一过的路径**，所以这里
 * 只需要判「是不是那一族」。
 *
 * @param {string} rel 书夹相对路径（**已归一的规范形状**；老名不必再映射——本族从中继改名起没变过名）
 * @returns {boolean}
 */
export function isGoalDocRel(rel) {
  const path = String(rel ?? '')
  if (!path.startsWith(`${GOAL_DOC_DIR_REL}/`)) return false
  return GOAL_DOC_RE.test(path.slice(GOAL_DOC_DIR_REL.length + 1))
}

/**
 * 站 3 正文那一份文档的**一级标题**（人读的抬头）。
 * ⚠️ 它是**界面字**、不是机器身份词；机器认这份文件靠文件名（{@link GOAL_DOC_RE}）。
 */
export function goalDocTitle(version) {
  return `学完要能做到什么（目标 v${Number(version)}）`
}

/**
 * 渲染这一份正文。**写与读共用这一条形状**（读侧 {@link readGoalDoc} 就是它的逆）。
 *
 * 版式（逐字）：
 * ```
 * # 学完要能做到什么（目标 v1）
 *
 * 1. 第一条
 * 2. 第二条
 * ```
 *
 * @param {number} version
 * @param {string[]} goals
 * @returns {string}
 */
export function renderGoalDoc(version, goals) {
  const lines = [`# ${goalDocTitle(version)}`, '']
  const clean = (Array.isArray(goals) ? goals : [])
    .map((goal) => String(goal ?? '').trim())
    .filter((goal) => goal !== '')
  clean.forEach((goal, index) => { lines.push(`${index + 1}. ${goal}`) })
  return `${lines.join('\n')}\n`
}

/**
 * 读回那 3–5 条（{@link renderGoalDoc} 的逆）。读不出／没有编号行 ⇒ **空数组**（⛔ 不替它编）。
 *
 * @param {string} text
 * @returns {string[]}
 */
export function readGoalDoc(text) {
  const goals = []
  for (const line of String(text ?? '').split(/\r?\n/u)) {
    const match = /^\s*\d+[.、]\s*(.+?)\s*$/u.exec(line)
    if (match === null) continue
    if (match[1] !== '') goals.push(match[1])
  }
  return goals
}
