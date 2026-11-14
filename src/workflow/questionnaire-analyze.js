/**
 * 读卷那一档（`questionnaire-analyze`）的**值块正文与三件注入的唯一出处**
 * （票 `reader-questionnaire-ai-authoring/05`）。
 *
 * ## 它是什么，不是什么
 *
 * **是**三件纯活的唯一出处：
 *   1. `questionnaireAnalyzeInjections()` —— 这一档交办里**必须齐全**的三件（① 当初写卷那份派单
 *      提示词原文（确定性重建，⛔ 不存副本）；② `工作区/问卷意图.md`；③ `工作区/读者情况回卷.md`），
 *      以及「缺哪一件」的逐条点名（缺一件 ⇒ **不派**，⛔ 不拿半份口径硬读）。
 *   2. `questionnaireAnalyzeValueLines()` —— 值块那几行（三件注入的落点与读数、判读口径、
 *      交工形状、落笔路径）。派单拼装（`dispatch-assembly.js`）与判据**共用这一段**。
 *   3. `questionnaireVerdictProblems()` —— 形状面（`drop`／`skip` 两条数组的形状检查）——
 *      盘上那份 `工作区/问卷判断.json` 的**读侧**（⛔ 不验它读得对不对）。
 *
 * **不是**：不落盘（判读件由那一路子代理自己落；落**剔除记录**仍由主笔发既有的 `graph-opinion`
 * ——子助手调 `workbench_act` 会被 `assertSessionOwned` 拒，它有自己的 sessionId）；⛔ 不是第二份
 * 事实源（判读是 AI 的结论，机器只验形状）；⛔ 不判「读得对不对」（人工边界
 * `docs/测试信任边界.md`）。
 *
 * ## 为什么两档（`resumed` / `rehydrated`）都要存在
 *
 * 票 `01` 实测：同一个 `childId` 跨宿主重启**能**被冷恢复（`resumed`），而唤不醒时工具结果报错
 * （未知 id／历史没了）⇒ 换「上下文干净的一路」重派（`rehydrated`）。**两档的判读口径、结论形状、
 * 落笔路径完全相同**——区别只在它没有上一轮的对话历史，靠三件注入把口径补齐。
 * ⛔ 不退回确定性卷：题面是 AI 写的，判读也必须是 AI 的（否则同一份卷子被两套口径判）。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）
 *
 * - **三件注入的「在场」只按盘上文件存在与否判**：① 那块是**确定性重建**（`assembleDispatchPrompt`
 *   按模板 ＋ 盘上值现算），它的「在场」＝模板能读出来且值拼得出来；②／③ 是两枚路径常量的
 *   `existsSync`。⛔ 看不见「那两份件里写的东西是否足够读卷」（语义，真机层）。
 * - **形状检查只认两条数组**：`drop[].title`／`drop[].why` 与 `skip[].title`／`skip[].reason`。
 *   多余的键、少一个键、不是数组、title 空串各自点名；⛔ 不判「该 drop 的有没有 drop 漏」——
 *   那是 AI 的判断（票面明写「只断意图件被要求读、结论形状合法、落笔走同一条路」）。
 * - **`drop` 条数与回卷件上明确勾「已经会」的条数相等**这件事，判据走的是**回卷件那一侧**的
 *   既有解析（`src/ui/reader-gap.js` 的固定行型），⛔ 不在本模块重算一份——本模块只看形状。
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'

import {
  READER_QUESTIONNAIRE_INTENT_REL,
  READER_QUESTIONNAIRE_RETURNED_REL,
  READER_QUESTIONNAIRE_VERDICT_REL,
} from '../domain-rules.js'
import { workDir } from './engine/paths.js'

/**
 * 这一档交办里**必须齐全**的三件注入（票面逐字）。
 *
 * ⚠️ 次序**就是点名次序**：缺件时先点谁的名。第一件是「提示词原文」（确定性重建，⛔ 不存副本），
 * 第二／三件是两枚盘上件。
 */
export const QUESTIONNAIRE_ANALYZE_INJECTIONS = Object.freeze([
  'authorPrompt',
  'intent',
  'returned',
])

/** 三件注入各自的人话名（错误文案与值块共用这一段，⛔ 不各写一份）。 */
export const QUESTIONNAIRE_ANALYZE_INJECTION_LABELS = Object.freeze({
  authorPrompt: '当初写卷那份派单提示词原文（`assembleDispatchPrompt(\'questionnaire-author\', …)` 确定性重建）',
  intent: `写卷那个人自己的自述（\`${READER_QUESTIONNAIRE_INTENT_REL}\`）`,
  returned: `收卷人交回的那份原样（\`${READER_QUESTIONNAIRE_RETURNED_REL}\`）`,
})

/**
 * 那一份 `工作区/问卷意图.md` 在盘上吗（唯一判据；⛔ 不读内容）。
 *
 * @param {string} projectId
 * @returns {boolean}
 */
export function questionnaireIntentOnDisk(projectId) {
  try {
    return existsSync(join(workDir(projectId), READER_QUESTIONNAIRE_INTENT_REL.split('/').pop()))
  } catch {
    return false
  }
}

/**
 * 那一份 `工作区/读者情况回卷.md` 在盘上吗。
 *
 * ⚠️ 与 `reader-questionnaire.js` 的 `readerQuestionnaireReturnText()` **不是**同一件事：
 * 那一个读**原文**（下游 AI 逐字读它），本函数只判**在不在**（三件注入齐不齐）。
 * 两处都只看这一枚文件名（唯一出处＝`domain-rules` 的常量）。
 *
 * @param {string} projectId
 * @returns {boolean}
 */
export function readerQuestionnaireReturnOnDisk(projectId) {
  try {
    return existsSync(join(workDir(projectId), READER_QUESTIONNAIRE_RETURNED_REL.split('/').pop()))
  } catch {
    return false
  }
}

/**
 * 三件注入**齐不齐**（缺一件就点名，⛔ 不拿半份口径硬读）。
 *
 * `authorPrompt` 在不在由**调用方**判（它是确定性重建，只有拼装那一跳知道模板读没读出来）；
 * 本函数只做「三件各自在不在」的汇总 ＋ 逐条点名。
 *
 * @param {{authorPrompt?: unknown, intent?: boolean, returned?: boolean}} input
 * @returns {{ok: boolean, missing: string[], message: string|null}}
 */
export function questionnaireAnalyzeInjectionReading(input = {}) {
  const present = {
    authorPrompt: typeof input.authorPrompt === 'string' && input.authorPrompt.trim() !== '',
    intent: input.intent === true,
    returned: input.returned === true,
  }
  const missing = QUESTIONNAIRE_ANALYZE_INJECTIONS.filter((name) => present[name] === false)
  if (missing.length === 0) return { ok: true, missing: [], message: null }
  const named = missing.map((name) => `${name}（${QUESTIONNAIRE_ANALYZE_INJECTION_LABELS[name]}）`)
  return {
    ok: false,
    missing,
    message: `读卷这一路不派：三件注入缺了 ${missing.length} 件——${named.join('、')}。`
      + '这三件是它没有上一轮对话历史时唯一的判断依据，缺一件就只能拿半份口径硬读'
      + '（⛔ 不许：那等于让它猜当初为什么这么问）。补齐再派。',
  }
}

/**
 * 值块那几行（**拼装与判据共用**：两处不会各写一套说法）。
 *
 * @param {object} values `dispatchValues('questionnaire-analyze')` 的返回
 * @returns {string[]} 行数组（不含值块标题；由 `dispatch-assembly.js` 拼进整块）
 */
export function questionnaireAnalyzeValueLines(values) {
  const paths = values?.paths ?? {}
  const analyze = values?.analyze ?? {}
  const lines = [
    `- 你交的那一份：\`${paths.verdict ?? READER_QUESTIONNAIRE_VERDICT_REL}\`（严格 JSON，形状见下面那一节）`,
    `- ③ 收卷人交回的原样（**逐字读整份**，包括卷末那一栏散文）：\`${paths.returned ?? READER_QUESTIONNAIRE_RETURNED_REL}\``,
    `- ② 写卷那个人自己的自述（**必读**：它写着当初每片在探哪个缺口、哪句是提示）：\`${paths.intent ?? READER_QUESTIONNAIRE_INTENT_REL}\``,
  ]
  // ① 那一件是**确定性重建**的提示词原文，⛔ 不存副本（模板是唯一出处）。
  if (typeof analyze.authorPrompt === 'string' && analyze.authorPrompt.trim() !== '') {
    lines.push('- ① 下面是**当初写卷那份派单的提示词原文**（`assembleDispatchPrompt(\'questionnaire-author\', …)` 按模板与盘上的值现算重建，⛔ 不另存副本）：')
    lines.push('')
    lines.push('```text')
    lines.push(analyze.authorPrompt.trimEnd())
    lines.push('```')
    lines.push('')
  } else {
    lines.push('- ⚠️ ① 提示词原文**没拿到**（模板读不出或值拼不全）——这一格空着被点名，⛔ 不拿半份口径硬读。')
  }
  return lines
}

/**
 * 盘上那份 `工作区/问卷判断.json` 的形状检查（**唯一判据**）。
 *
 * 形状：`{ drop: [{title, why}], skip: [{title, reason}] }`
 *   · `drop` ＝回卷件上**明确勾「已经会」**的条目（主笔照它逐条发 `graph-opinion`）；
 *   · `skip` ＝「不确定」／未勾／片级没答的那一批（**只作读数，⛔ 一条都不落记录**）。
 *
 * ⚠️ **强度**：只断形状（两条数组、每条带 `title` 与那句理由、`title` 非空）；⛔ 不断「它读得对
 * 不对」、⛔ 不断「该 drop 的有没有 drop 漏」（那是 AI 的判断，票面明写判据只到形状）。
 *
 * @param {unknown} document 盘上那份的 `JSON.parse` 结果
 * @returns {string[]} 问题清单（空数组＝形状站得住）
 */
export function questionnaireVerdictProblems(document) {
  if (document === null || typeof document !== 'object' || Array.isArray(document)) {
    return [`问卷判断不是对象（形状应是 \`{ drop: [{title, why}], skip: [{title, reason}] }\`，实为 ${Array.isArray(document) ? '数组' : typeof document}）`]
  }
  const problems = []
  for (const [key, reasonField] of [['drop', 'why'], ['skip', 'reason']]) {
    const list = document[key]
    if (!Array.isArray(list)) {
      problems.push(`问卷判断的 \`${key}\` 不是数组（这一格必须是一条数组，缺了也当没交）`)
      continue
    }
    list.forEach((entry, index) => {
      const at = `\`${key}[${index}]\``
      if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
        problems.push(`${at} 不是对象（每条要带 \`title\` 与 \`${reasonField}\`）`)
        return
      }
      if (typeof entry.title !== 'string' || entry.title.trim() === '') {
        problems.push(`${at} 少了非空的 \`title\`（点名是哪一条知识点）`)
      }
      if (typeof entry[reasonField] !== 'string' || entry[reasonField].trim() === '') {
        problems.push(`${at} 少了非空的 \`${reasonField}\`（每条都要有一句理由）`)
      }
    })
  }
  return problems
}

/**
 * 判读件**读数**（盘上那份里两条数组的条数；形状站不住时为 `null`）。
 *
 * 界面与账本按它说「这次读了 N 条要剔、M 条只作读数」——两处读**同一个**函数，⛔ 不各算一份。
 *
 * @param {unknown} document
 * @returns {{drop: number, skip: number}|null}
 */
export function questionnaireVerdictCounts(document) {
  if (questionnaireVerdictProblems(document).length > 0) return null
  return { drop: document.drop.length, skip: document.skip.length }
}
