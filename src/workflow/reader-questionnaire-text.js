/**
 * 读者情况问卷的**题面**（AI 写的那一份）——形状闸与它的读侧（票 `reader-questionnaire-ai-authoring/02`）。
 *
 * ## 它是什么，不是什么
 *
 * **是**两件纯活的**唯一出处**：
 *   1. `readerQuestionnaireProblems()` —— 题面的**形状闸**：不合形状逐条点名（哪一片、哪一条、错在哪），
 *      ⛔ 静默归一、⛔ 静默丢弃。生产那一跳（`stage-submit` 的 `stage=explore`）就在**写盘之前**调它，
 *      坏形状当场 400、一个字节都不写；
 *   2. `readReaderQuestionnaireText()` —— 盘上那一份的**唯一读侧**（渲染层在票 `03` 只经它读）。
 *
 * **不是**：不是第二份事实源（问法与提示是 AI 的内容，机器只验形状）；⛔ 不是放行条件
 * （不交题面＝合法：卷子退回今天的确定性版，`degraded` 先例照旧）；⛔ 不是渲染器
 * （把题面印进固定行型是票 `03` 的事，行型一个字不由本模块碰）；也不是判定「问得像不像人话」的判据
 * ——措辞进人工边界（`docs/测试信任边界.md`）。
 *
 * ## 形状（本模块**只认**这一种；规格出处＝spec「结构面」第 1 条与票 02）
 *
 * ```json
 * {
 *   "estimate": "预计 8–10 分钟",                       // 可选，非空字符串
 *   "slices": [
 *     {
 *       "slice": "认数和算数",                            // 必须是这张图上**在册的片名**
 *       "lead": "这一片先弄清楚数是什么。",               // 可选，非空字符串（片级题面）
 *       "items": [
 *         { "title": "知识点1甲",                          // 必须是该片成员（按 title 归一化）
 *           "ask": "……",                                   // 必填、≤ 60 字
 *           "why": "……",                                   // 必填、≤ 25 字（不是提示，是为什么值得认真答）
 *           "hint": "……" }                                 // 可选、≤ 60 字
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）
 *
 * - **只认对象形状**：`items` 里塞字符串、`slice` 写成对象、`slices` 写成对象，各自落在
 *   「不是对象／不是字符串」那几格，⛔ 不去猜它想指哪一条。
 * - **成员身份只认 `title`**（走 `normalizeTitle` 那唯一一把尺子：`trim`）。同义词、错别字、
 *   语序颠倒都算对不上；`kp.id` 不是身份（真书 203 条只有 125 个不同 `id`）。
 *   这条**与** `readerSliceProblems`（片的形状闸）**同一把尺子、不同的对象**：
 *   那一个量的是合并件里 `readerSlices[].members`，本模块量的是题面里 `items[].title`
 *   落不落在那张成员表上——两处都不另写归一口径。
 * - **片名只认逐字相等**（`normalizeTitle` 之后）：题面里写了图上没有的片名 ⇒ 点名，⛔ 不按近义合并。
 * - **字数按 `[...text].length`（码位）算**：本仓既有的「字数」判据是 `countHanzi`（汉字数），
 *   它量的是**章节正文的篇幅**；题面这里量的是「这一行会不会太长」，标点与拉丁字母同样占位，
 *   所以**有意不用** `countHanzi`——这是两件事，别把其中一个当成另一个的写法（见下面那条注释）。
 * - **禁问项**是一张**固定黑名单**（今天四条）：它只咬这几条字面，换个说法问「理解到哪一层」
 *   扫不出来——语义真假归真机层。
 * - **纸面暗示**同样是固定词表（今天四个词）：同义词（「纸上」「动笔」）不在表上，扫不出来。
 * - 本模块**看不见**的事：AI 交没交（交工那一跳的接线面）、渲染层有没有把题面印上去（票 `03`）、
 *   每一条题面写得对不对（人工边界）。
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { READER_QUESTIONNAIRE_TEXT_FILE_NAME } from '../domain-rules.js'
import { workDir } from './engine/paths.js'
import { normalizeTitle } from '../reader-questionnaire-vocab.js'

/**
 * 题面**一行**的上限（票 02 判据 3）：`ask` 与 `hint` 各 ≤ 60。
 *
 * ⚠️ 它与渲染层的「合计 ≤ 30 条」（`READER_QUESTIONNAIRE_ITEM_LIMIT`）是**两个不同的量**：
 * 那一个数的是卷上印几条，本常量数的是**一条问话有多长**。⛔ 别把其中一个读成另一个。
 */
export const READER_QUESTIONNAIRE_ASK_MAX = 60

/**
 * `why`（「为什么问这个」）的上限（票 02 判据 4）：≤ 25 字。
 *
 * 它比 `ask` 还短是**有意的**：这一行买的是「认真答」，写长了就变成第二句问话
 * （`hint` 买「答得准」——两件不是一件，⛔ 不许合并成一句）。
 */
export const READER_QUESTIONNAIRE_WHY_MAX = 25

/**
 * **禁问项**（票 02 判据 6 的落点；理由出处＝`ADR-0038` 决策 3 与 spec 硬约束 4）。
 *
 * 为什么是这几条：收卷人（本人／监护人／老师）**答得了「会不会」，答不了「理解到哪一层」**
 * ——后者要他先猜这本书的层次模型，答了也是编造；而编造出来的答案会一路落进剔除记录
 * （「已经会」→ 这本书不讲），比不答更坏。⇒ 这一类问法整条不收。
 *
 * ⚠️ **本表是固定黑名单**：只咬这几条字面（`includes` 子串），换个说法扫不出来。
 * 加词是一次**行为变化**（今天能交的题面会变成 400），所以只能由裁决推动。
 */
export const READER_QUESTIONNAIRE_BANNED_ASKS = Object.freeze([
  '理解到哪一层',
  '理解到哪一步',
  '理解到什么程度',
  '掌握到什么程度',
])

/**
 * **纸面暗示**词表（票 02 判据 5；spec 硬约束 3）。
 *
 * 回卷只有一条路：在文件上改完、粘回工作台。卷面上任何「打印出来／在方框边上写／手写」这类
 * 纸面指引都在教人走一条本产品**没有**的通道（上传受理面不含 `.md`，语义是源材料），
 * 收卷人照做之后那份卷子就回不来了。⇒ 这三个词加上「打印」整条不收。
 *
 * ⚠️ 同为固定词表：同义词（「纸上」「动笔」）扫不出来。
 */
export const READER_QUESTIONNAIRE_PAPER_HINTS = Object.freeze(['打印', '方框', '写在旁边', '手写'])

/** 一条文本的**长度**（码位；不是汉字数——理由见文件头「枚举面」那一段）。 */
function textLength(value) {
  return [...String(value)].length
}

/** 逐条检查的容器：`problems` 逐条点名；`at` 是给文案用的位置短语。 */
function paperHintProblem(at, field, text) {
  const hit = READER_QUESTIONNAIRE_PAPER_HINTS.find((word) => text.includes(word))
  if (hit === undefined) return null
  return `${at}的「${field}」里出现了纸面暗示「${hit}」——回卷只走「在文件上改完、粘回工作台」一条路，`
    + '没有打印／手写／在方框边上写这一条（上传通道的语义是源材料，不收回卷）：'
    + `把「${hit}」这类指引删掉再交`
}

/**
 * 题面的**形状闸**——**唯一出处**（生产交工那一跳与判据都调它；⛔ 不在别处另写一份「相似的量法」）。
 * 空数组＝站得住。
 *
 * 七条判据（票 02 面；每条都有反证格，见 `test/test-reader-questionnaire-authoring.mjs`）：
 * 1. `slice` 必须是这张图上**在册的片名**（对不上 ⇒ 点名第几片、那个片名对不上）；
 * 2. `items[].title` 必须是该片成员，且按 `normalizeTitle` 归一化后能对上（⛔ `kp.id` 不当身份）；
 * 3. `items[].ask` 非空、≤ {@link READER_QUESTIONNAIRE_ASK_MAX} 字（**超一个字就拒收**，⛔ 不截断）；
 * 4. `items[].why` 必填、≤ {@link READER_QUESTIONNAIRE_WHY_MAX} 字（⛔ 缺它拒收，⛔ 不许拿 `hint` 顶替）；
 * 5. `ask`／`why`／`hint` 里都不许出现纸面暗示（{@link READER_QUESTIONNAIRE_PAPER_HINTS}）；
 * 6. `ask` 里不许问「理解到哪一层」这一类（{@link READER_QUESTIONNAIRE_BANNED_ASKS}）；
 * 7. **不交也合法**：`undefined`／`null` ⇒ 零问题（消费侧退回今天的确定性版）。
 *
 * @param {unknown} questionnaire 交工参数里的那一份（缺席＝`undefined`）
 * @param {{slices?: unknown, knowledgePoints?: unknown}} [context]
 *   `slices`＝合并件里那份**在册的片**（`readerSlices`，用它建片名与成员表）；`knowledgePoints` 不用
 *   来做身份（成员身份＝片成员表），只留给调用方将来核对——本函数**不看**它。
 * @returns {string[]} 逐条点名的问题（空数组＝站得住）
 */
export function readerQuestionnaireProblems(questionnaire, { slices } = {}) {
  // 判据 7：不交也合法（⛔ 不是「默认空题面」——缺席与「交了但是空的」是两件事）。
  if (questionnaire === undefined || questionnaire === null) return []
  if (typeof questionnaire !== 'object' || Array.isArray(questionnaire)) {
    return [`书级参数里的「readerQuestionnaire」（问卷题面）必须是对象：{estimate?, slices:[{slice, lead?, items:[{title, ask, why, hint?}]}]}（实为 ${Array.isArray(questionnaire) ? '数组' : typeof questionnaire}）`]
  }
  const problems = []

  // `estimate`（可选）：非空字符串。它是**卷头那一句预计用时**的素材（票 03 印它），
  // ⛔ 机器不替它编一个数（编出来的数不是 AI 读过内容之后的估计）。
  if (Object.hasOwn(questionnaire, 'estimate') && questionnaire.estimate !== undefined && questionnaire.estimate !== null) {
    if (typeof questionnaire.estimate !== 'string' || questionnaire.estimate.trim() === '') {
      problems.push(`题面的「estimate」（预计用时那句）必须是**非空字符串**（实为 ${describeValue(questionnaire.estimate)}）：要么别交这一格，要么写清「大约几分钟」`)
    }
  }

  const registered = registeredSlices(slices)
  const rawSlices = questionnaire.slices
  if (!Array.isArray(rawSlices)) {
    problems.push(`题面的「slices」必须是数组（每一片是 {slice, lead?, items:[…]}；实为 ${describeValue(rawSlices)}）——⛔ 不交整份题面才合法，「交了个不是数组的 slices」是坏形状`)
    return problems
  }
  if (rawSlices.length === 0) {
    problems.push('题面的「slices」是空数组——交题面就要至少写一片；整份不想写就**别交这个键**（那一档退回今天的确定性版并如实说明），⛔ 交一个空壳')
    return problems
  }
  if (registered.size === 0) {
    problems.push('题面里带了片，可这张图上一片「在册的片」都没有（合并件里没有 readerSlices）——片名对不上任何一片：先让探查交工把片交上来，再写题面')
    return problems
  }

  rawSlices.forEach((rawSlice, sliceIndex) => {
    const sliceAt = sliceIndex + 1
    if (rawSlice === null || typeof rawSlice !== 'object' || Array.isArray(rawSlice)) {
      problems.push(`题面第 ${sliceAt} 片不是对象（形状＝{slice, lead?, items:[{title, ask, why, hint?}]}；实为 ${describeValue(rawSlice)}）`)
      return
    }
    const sliceName = normalizeTitle(rawSlice.slice)
    const label = sliceName === '' ? `题面第 ${sliceAt} 片` : `题面第 ${sliceAt} 片（「${sliceName}」）`
    if (sliceName === '') {
      problems.push(`题面第 ${sliceAt} 片没有写「slice」（要逐字写图上一个**在册的片名**：${[...registered.keys()].join('、')}）——不写片名，机器不知道这一片问的是哪一片，⛔ 不按顺序猜`)
      return
    }
    const members = registered.get(sliceName)
    if (members === undefined) {
      problems.push(`${label}的片名对不上图上的任何一片（在册的片名：${[...registered.keys()].join('、')}）——题面的片名要与合并件里的片名**逐字**相同`)
      return
    }
    if (Object.hasOwn(rawSlice, 'lead') && rawSlice.lead !== undefined && rawSlice.lead !== null) {
      if (typeof rawSlice.lead !== 'string' || rawSlice.lead.trim() === '') {
        problems.push(`${label}的「lead」（片级题面那句）必须是**非空字符串**（实为 ${describeValue(rawSlice.lead)}）：要么别交这一格，要么写一句读者读得懂的话`)
      } else {
        const hit = paperHintProblem(label, 'lead', rawSlice.lead)
        if (hit !== null) problems.push(hit)
      }
    }
    const items = rawSlice.items
    if (!Array.isArray(items)) {
      problems.push(`${label}没有「items」数组（每一问是 {title, ask, why, hint?}；实为 ${describeValue(items)}）`)
      return
    }
    if (items.length === 0) {
      problems.push(`${label}的「items」是空数组——写了这一片就要至少问一条（⛔ 交一个只有片名的空壳）`)
      return
    }
    items.forEach((item, itemIndex) => {
      const itemAt = `${label}的第 ${itemIndex + 1} 条`
      if (item === null || typeof item !== 'object' || Array.isArray(item)) {
        problems.push(`${itemAt}不是对象（形状＝{title, ask, why, hint?}；实为 ${describeValue(item)}）`)
        return
      }
      // 判据 2：`title` 必须是**这一片**的成员（⛔ kp.id 不当身份）。
      const title = normalizeTitle(item.title)
      if (title === '') {
        problems.push(`${itemAt}没有写「title」（要逐字写这一片里某个知识点的 title）`)
      } else if (!members.has(title)) {
        problems.push(`${itemAt}的 title「${title}」不是这一片的成员（这一片只有 ${members.size} 条：${[...members].slice(0, 5).join('、')}${members.size > 5 ? '…' : ''}）——title 按知识点 title 引用（⛔ 不能写 kp.id），且必须在这一片的 members 里`)
      }
      // 判据 3：`ask` 非空、≤ 60 字（⛔ 不截断——超了就是超了）。
      const askProblem = fieldTextProblem(itemAt, 'ask', item.ask, READER_QUESTIONNAIRE_ASK_MAX)
      if (askProblem !== null) problems.push(askProblem)
      else {
        const banned = READER_QUESTIONNAIRE_BANNED_ASKS.find((word) => item.ask.includes(word))
        if (banned !== undefined) {
          problems.push(`${itemAt}的「ask」问的是「${banned}」这一类——收卷人答不了「理解到哪一层」（他要先猜这本书的层次模型，答了也是编造，而编出来的答案会一路落进剔除记录）：改问「这个你现在会吗」这种他自己答得了的`)
        }
        const hit = paperHintProblem(itemAt, 'ask', item.ask)
        if (hit !== null) problems.push(hit)
      }
      // 判据 4：`why` **必填**（⛔ 不许拿 `hint` 顶替：两件不是一件）。
      if (item.why === undefined || item.why === null) {
        problems.push(`${itemAt}缺「why」——这一行不是提示，是**为什么值得认真答**（≤ ${READER_QUESTIONNAIRE_WHY_MAX} 字，如「这一条不会的话，后面的算式看不懂」）；它买的是认真答，hint 买的是答得准，两件不是一件、⛔ 不能互相顶替`)
      } else {
        const whyProblem = fieldTextProblem(itemAt, 'why', item.why, READER_QUESTIONNAIRE_WHY_MAX)
        if (whyProblem !== null) problems.push(whyProblem)
        else {
          const hit = paperHintProblem(itemAt, 'why', item.why)
          if (hit !== null) problems.push(hit)
        }
      }
      // `hint`（可选）：≤ 60 字、不许纸面暗示、不许顶替 `why`（顶替已在上面那一格咬住）。
      if (item.hint !== undefined && item.hint !== null) {
        const hintProblem = fieldTextProblem(itemAt, 'hint', item.hint, READER_QUESTIONNAIRE_ASK_MAX)
        if (hintProblem !== null) problems.push(hintProblem)
        else {
          const hit = paperHintProblem(itemAt, 'hint', item.hint)
          if (hit !== null) problems.push(hit)
        }
      }
    })
  })
  return problems
}

/**
 * 一格文本字段的形状（「非字符串／空／超长」三档各一句点名）。合法返回 `null`。
 *
 * ⚠️ 长度口径只在这里写一次（码位）——`ask`／`why`／`hint` 三格共用它，⛔ 别在调用处再量一遍。
 */
function fieldTextProblem(at, field, value, max) {
  const hint = {
    ask: '一句读者自己答得了的问话',
    why: '一句「为什么问这个」',
    hint: '一句提示（帮人答得准，⛔ 不是第二句问话）',
  }[field] ?? '一句文本'
  if (typeof value !== 'string') {
    return `${at}的「${field}」必须是字符串（${hint}；实为 ${describeValue(value)}）`
  }
  const text = value.trim()
  if (text === '') {
    return `${at}的「${field}」是空的——${hint}，不能留白`
  }
  const length = textLength(text)
  if (length > max) {
    return `${at}的「${field}」有 ${length} 字，超了上限 ${max} 字（「${truncateForReport(text)}」）——⛔ 机器不替你截断：把它写短一点再交`
  }
  return null
}

/** 文案里引用超长原文时只印一个可辨认的前缀（⛔ 不把整段话搬进 400 回包）。 */
function truncateForReport(text) {
  const chars = [...text]
  return chars.length <= 24 ? text : `${chars.slice(0, 24).join('')}…`
}

/** 坏值的**可辨认**写法（⛔ 不 `JSON.stringify` 一整坨：那些值可能很长）。 */
function describeValue(value) {
  if (value === undefined) return '没交这一格'
  if (value === null) return 'null'
  if (Array.isArray(value)) return `数组（${value.length} 项）`
  if (typeof value === 'object') return '对象'
  if (typeof value === 'string') return `字符串「${truncateForReport(value)}」`
  return `${typeof value} ${String(value)}`
}

/**
 * 在册的片名 → 成员集合（走 `normalizeTitle`，与 `readerSliceProblems` 吃**同一把尺子**）。
 *
 * ⚠️ 片名**空**的片不进这张表（它连名字都没有，题面无从对起）——那不是本函数在判红，
 * 片的形状闸（`readerSliceProblems`）在交工同一跳上已经会咬它。
 */
function registeredSlices(slices) {
  const out = new Map()
  for (const slice of Array.isArray(slices) ? slices : []) {
    const name = normalizeTitle(slice?.name)
    if (name === '') continue
    const members = new Set()
    for (const member of Array.isArray(slice?.members) ? slice.members : []) {
      const title = normalizeTitle(member)
      if (title !== '') members.add(title)
    }
    // 同名片（图上重叠的两片）取**并集**：题面按片名挂，成员表宽一点不会放过坏值之外的任何东西
    // （`title` 仍必须落在这一片的成员里）。⛔ 不在这里判「片名重名」——那归片的形状闸。
    out.set(name, out.has(name) ? new Set([...out.get(name), ...members]) : members)
  }
  return out
}

/**
 * 把过闸的题面收成**落盘那一份**（键序固定、可选格缺席时不长出来）。
 *
 * 为什么要有这一跳而不是原样 `JSON.stringify(questionnaire)`：
 * - 落盘件是**下游唯一的读侧输入**（票 `03` 的渲染），键序固定让「重写同一个输入逐字相同」
 *   （同 `expectedKnowledgeMap` 的确定函数口径）；
 * - 可选格（`estimate`／`lead`／`hint`）**缺席就不长出来**：⛔ 不注空串、⛔ 不注 `null`
 *   （「没有这一格」与「交了个空的」是两件事，后一种是坏形状、已被闸拒收）。
 *
 * 前提：调用方**已经**过 {@link readerQuestionnaireProblems} 且零问题（本函数不判红、不抛）。
 *
 * @param {object} questionnaire 过闸的那一份
 * @returns {{estimate?: string, slices: Array<{slice: string, lead?: string, items: Array<{title: string, ask: string, why: string, hint?: string}>}>}}
 */
export function normalizeReaderQuestionnaire(questionnaire) {
  const source = questionnaire !== null && typeof questionnaire === 'object' ? questionnaire : {}
  const estimate = normalizeTitle(source.estimate)
  return {
    ...(estimate === '' ? {} : { estimate }),
    slices: (Array.isArray(source.slices) ? source.slices : []).map((slice) => {
      const lead = normalizeTitle(slice?.lead)
      return {
        slice: normalizeTitle(slice?.slice),
        ...(lead === '' ? {} : { lead }),
        items: (Array.isArray(slice?.items) ? slice.items : []).map((item) => {
          const hint = normalizeTitle(item?.hint)
          return {
            title: normalizeTitle(item?.title),
            ask: normalizeTitle(item?.ask),
            why: normalizeTitle(item?.why),
            ...(hint === '' ? {} : { hint }),
          }
        }),
      }
    }),
  }
}

/**
 * 盘上那份题面（**唯一读侧**：渲染层在票 `03` 只经这里读）。无件／读不出 ⇒ `null`。
 *
 * ⚠️ 读不出**不抛**：题面是可选件，读不到就说读不到（卷子照今天的确定性版发，同
 * `effectiveReaderSlices` 的 `degraded` 先例）。也不校验形状——盘上那份是交工那一刻过闸写下的，
 * 事后再过一遍闸等于给「别人手改过的旧件」判红，那不是读侧该做的事（形状闸在交工那一跳）。
 *
 * @param {string} projectId
 * @returns {object|null}
 */
export function readReaderQuestionnaireText(projectId) {
  try {
    const file = join(workDir(projectId), READER_QUESTIONNAIRE_TEXT_FILE_NAME)
    if (!existsSync(file)) return null
    const parsed = JSON.parse(readFileSync(file, 'utf8'))
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}
