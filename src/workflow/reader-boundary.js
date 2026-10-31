/**
 * **读者边界**那一份**现算的派生视图**（票 `reader-cognition-boundary-build/07`；口径来源
 * `.scratch/reader-cognition-boundary/spec.md` §4.2／§5.2／§6.2 D，载具由票 `14` 定、落点由票 `09` 落）。
 *
 * ## 它是什么（这一段就是本模块的边界，别在别处另写一句）
 *
 * 「边界」＝区间 `[下沿, 上沿]`，**机器身份＝两半已有／已裁的落点**（spec §5.1）：
 * **下沿**＝`工作区/knowledge-map-exclusions.json` 里 `reason: 已经会` 的那批卡；
 * **上沿①**＝**同一份记录**里 `reason: 不需要` 的那批卡；**上沿②**＝图外的知识（开集、**没有盘上件**）。
 * ⇒ 本模块⛔ **不落任何一件事实源**（⛔ 不新开 `工作区/读者边界.json`、⛔ 不落 `meta` 新键、
 * ⛔ 不新落人可读镜像）：它把那一份集合**折成人可读的一句话 ＋ 逐条点名**，只进交办正文（现算）。
 *
 * ## 一处口径、四处读者（票 07 的预重构）
 *
 * 「已剔除（人已划掉）N 条：逐条点名／另有 N 条旧裁决已失效」这一套现算**只有这一处**
 * （票 07 之前它自己拼在 `engine.js` 的 `outline` 那一支里）：
 *   · `outline` 交办用 {@link readerBoundarySentence} ＋ {@link readerBoundaryStaleSentence}；
 *   · **四份逐章派单**（`writing`／`gold-writing`／`audit`／`cross-audit`，见
 *     {@link BOUNDARY_DISPATCH_KINDS}）用 {@link readerBoundaryDispatchLines} 那一格
 *     「**本章不许写什么**」。
 * ⚠️ 期望值只从 {@link readCoverageCollection}（唯一读侧入口）来：本模块⛔ **不手抄第二份「怎么减」**，
 * 也⛔ 不自己读／解析那份 JSON（那一半住 `workflow/knowledge-map-exclusions.js`）。
 *
 * ## 「旧」＝**读取侧现算**（spec §5.3）
 *
 * 键没了／`title` 变了 ⇒ 该条**不生效、非阻断、⛔ 不写回文件**——它是 `stale` 那一条读数，
 * 不是状态字段。⛔ 本模块**不发明** `active → superseded` 那类作废状态（那个先例的名字
 * `appendLengthStyleLine` 已随 2026-10-16 三档删除整函数删掉，spec §5.3 逐字）。
 *
 * ## ⛔ 边界不驱动容量轴（spec §2.5／§4.5）
 *
 * 那一份读数**只有**图上条数／留下的条数／已划掉的条数／陈旧条数这几样，**没有**章数、字数、
 * 系数这一类派生量；渲染出来的那一格明写「⛔ 不因此改章数或字数」。⇒ 本模块⛔ 不设任何
 * 字数／篇幅判据，也⛔ 不把任何读数变成放行条件。
 *
 * ## 「卡 ↔ 章」今天**没有映射**（spec §4.2 的留白）
 *
 * 逐章那四份现算的是**整批**剔除集合（全书的），并在那一格里如实写明「卡片与章今天没有映射，
 * 哪几条与你这一章相关由你自己按本章 `points` 与章标题认领」——⛔ 机器不替它做这个映射，
 * 也⛔ 不因为边界改章数。⚠️ 这一处是**落地选定的那一条**（票 07 的 `## Answer`），不是漏接线。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）
 *
 *   · 只看得见**还算数的那一批裁决**（`live`）与**陈旧的那一批**（`stale`）：图上**没有**盘上件
 *     可对的那几条**点不出名**（它们是陈旧读数）；「上沿②＝图外的知识」是开集、**机器不列**
 *     （那一格在渲染里如实说明，⛔ 不假装列全了）。
 *   · 剔除按 **`title` 归一化后的相等**走（与覆盖闸门同一把尺子）⇒ 同一个 `title` 的多条知识点会
 *     **一起**离开判据面（窄处的出处＝`domain-rules.effectiveKnowledgePoints` 的注释）。
 *   · 断的是「这几句话在交办正文里」——⛔ **不证**「小助手照着不写」（真机层 ADR-0005）。
 *
 * @module workflow/reader-boundary
 */
import {
  EXCLUSION_REASON_ALREADY_KNOWN,
  EXCLUSION_REASON_NOT_NEEDED,
} from '../domain-rules.js'
import { readCoverageCollection } from './knowledge-map-exclusions.js'
// 票 `quality-review-2026-10-29/07`：`isPlainObject` 收编进零依赖叶子（本文件原先那一份是全仓
// 逐字抄件之一；判据＝`test-book-shape.mjs` 的「单点 · 对象判据」那一格）。
import { isPlainObject } from '../plain-object.js'

/**
 * 那一格「不许写什么」的抬头（**唯一声明**：四份逐章正文与判据都读它，⛔ 不各写一份）。
 *
 * ⚠️ 在此前的 `src/**` 里没有这一句（spec §6.2 D 逐字）——本次把它抽成这一个常量；判据断的是
 * 「这一句在拼出来的派单正文里」，⛔ 不是「源码里有没有这个字面量」。
 */
export const BOUNDARY_FORBIDDEN_HEAD = '本章不许写什么'

/** `outline` 那一族用的抬头（**逐字保持**票 `knowledge-graph-build/09` 落的那一句）。 */
export const BOUNDARY_DROPPED_HEAD = '**已剔除**（人已划掉）'

/**
 * 哪几档派单的正文里要有「本章不许写什么」那一格（**唯一一份清单**：动作层与拼装器都读它）。
 *
 * 逐字是 spec §4.2／§6.2 D 点名的那四份：`chapters` 那一段的写作派单（`writing`）、
 * `gold` 那一段的执笔派单（`gold-writing`）、章级审计（`audit`）、跨章审计（`cross-audit`）。
 */
export const BOUNDARY_DISPATCH_KINDS = Object.freeze(['writing', 'gold-writing', 'audit', 'cross-audit'])

/** 理由档那两句话的人可读译法（**唯一出处**；⛔ 不拿原样档名糊人）。 */
const REASON_TEXT = Object.freeze({
  [EXCLUSION_REASON_ALREADY_KNOWN]: '读者已经会了，以下不讲',
  [EXCLUSION_REASON_NOT_NEEDED]: '本书不覆盖这个主题',
})

function nonEmptyText(value) {
  return typeof value === 'string' && value.trim() !== ''
}

/** 逐条点名里的一个名字（⛔ 不拿归一化串糊人：印的是那条裁决自己记下的 `title`）。 */
function quoted(titles) {
  return titles.map((title) => `「${title}」`).join('')
}

/**
 * 把「那份人的裁决 ＋ 合并件」读成**人可读的那一份读数**（纯函数：同输入同输出、不读盘、不读时钟）。
 *
 * @param {object} [collection] {@link readCoverageCollection} 的返回（或同形状的一份）
 * @returns {{available: boolean, total: number, kept: number, dropped: number, stale: number,
 *   droppedTitles: string[], alreadyKnown: string[], notNeeded: string[]}}
 *   `available` ＝ **合并件里真有知识点**（看不到图与「图是空的」是两件事：⛔ 不把它说成 0 条）。
 */
export function readerBoundaryReading(collection = {}) {
  const points = Array.isArray(collection?.points) ? collection.points : []
  const effective = Array.isArray(collection?.effective) ? collection.effective : []
  const live = (Array.isArray(collection?.live) ? collection.live : []).filter(isPlainObject)
  const stale = (Array.isArray(collection?.stale) ? collection.stale : []).filter(isPlainObject)
  const titlesOf = (reason) => live
    .filter((item) => item.reason === reason && nonEmptyText(item.title))
    .map((item) => item.title)
  return {
    available: points.length > 0,
    total: points.length,
    kept: effective.length,
    dropped: live.length,
    stale: stale.length,
    droppedTitles: live.filter((item) => nonEmptyText(item.title)).map((item) => item.title),
    alreadyKnown: titlesOf(EXCLUSION_REASON_ALREADY_KNOWN),
    notNeeded: titlesOf(EXCLUSION_REASON_NOT_NEEDED),
  }
}

/**
 * `outline` 交办那一句**人可读的话**（票 `knowledge-graph-build/09` 落的那一句，**逐字不变**）。
 *
 * ⚠️ 它只到「逐条点名」为止：后面那半句「它们**不在**上面那 N 条里／`points` 里不许出现它们」
 * 是 **`outline` 特有**的（只有它上面才有「必须覆盖的那 N 条卡」）⇒ 那一半留在调用方，
 * ⛔ 不塞进这一处共用。
 *
 * @param {object} reading {@link readerBoundaryReading} 的返回
 * @returns {string} 看不到图时返回空串（由调用方决定这一格要不要出现）
 */
export function readerBoundarySentence(reading) {
  if (reading?.available !== true) return ''
  if (reading.dropped === 0) return `${BOUNDARY_DROPPED_HEAD}：0 条——这本书上还没有人划掉任何知识点。`
  return `${BOUNDARY_DROPPED_HEAD}${reading.dropped} 条：${quoted(reading.droppedTitles)}`
}

/**
 * 「另有 N 条旧裁决已失效」那一句的**正文**——**不带外层括号**（N ＝ 0 时返回空串）。
 *
 * ⚠️ 括不括由各调用点自己给：⛔ 不许靠 `slice(1, -1)` 剥括号拼句——那是**脆弱的字符串手术**
 * （正文里任何一次括号增删都会**静默**改掉另一个调用点的输出，而两边都不会红）。
 *
 * 陈旧 ＝ 重造探查之后那张卡没了、或它的标题变了（读取侧现算，spec §5.3）：**本次不生效**，
 * ⛔ 不算在已剔除里、⛔ 不写回那份件。
 */
export function readerBoundaryStaleSentence(reading) {
  if (!Number.isSafeInteger(reading?.stale) || reading.stale <= 0) return ''
  return `另有 ${reading.stale} 条旧裁决已失效：重造探查之后那张卡没了、或它的标题变了——本次不生效，也不算在已剔除里。`
}

/** 这一档派单拿这一格做什么（写的那两档 vs 审的那两档；措辞别让审计员读到「写完」那种字）。 */
function roleTail(kind) {
  if (kind === 'audit') return '——逐条核本章正文有没有写它们'
  if (kind === 'cross-audit') return '——逐章核各章正文有没有写它们'
  return '——写的时候不许写它们，也⛔ 不许写进本章 `points`'
}

/**
 * 四份逐章派单正文里那一格「**本章不许写什么**」（**逐条点名**）。
 *
 * ⚠️ **整批渲染**（票 07 的落地选择）：现算的是**全书**那一份剔除集合，并在那一格里如实写明
 * 「卡片与章今天没有映射」（spec §4.2 的留白）——⛔ 不假装它是「与本章相关的那几条」。
 *
 * @param {object} reading {@link readerBoundaryReading} 的返回
 * @param {{kind?: string}} [options] 这一档的 kind（只影响那一句动词；取值域见 {@link BOUNDARY_DISPATCH_KINDS}）
 * @returns {string[]} 值块里的行（含抬头那一行与它下面的逐条点名）
 */
export function readerBoundaryDispatchLines(reading, options = {}) {
  const kind = typeof options.kind === 'string' ? options.kind : 'writing'
  const prefix = `- ${BOUNDARY_FORBIDDEN_HEAD}（**本书已剔除**`
  if (reading?.available !== true) {
    return [
      `${prefix}＝人已划掉的知识点，逐条点名）${roleTail(kind)}：这本书今天**看不到知识点图**`
        + '（合并件不在场，或里面没有 \`knowledgePoints\`）——本格没有可点名的剔除集合。'
        + '⚠️ 这不是「一条都没有」：机器看不到图，所以它不说那句话。',
    ]
  }
  if (reading.dropped === 0) {
    return [`${prefix}＝人已划掉的知识点，逐条点名）${roleTail(kind)}：0 条——这本书上还没有人划掉任何知识点（⛔ 机器不替它编一条）。`]
  }
  const lines = [`${prefix}：人已划掉 ${reading.dropped} 条，逐条点名）${roleTail(kind)}：`]
  // ⚠️ 理由按**逐条**对（同一个 `title` 可以有一条「不需要」＋一条「已经会」）：
  // 从「不需要」那一档里按出现次数消掉，消不掉的归「已经会」——⛔ 不拿 `includes` 一问两答。
  const notNeededLeft = [...reading.notNeeded]
  for (const item of reading.droppedTitles) {
    const at = notNeededLeft.indexOf(item)
    let reason = EXCLUSION_REASON_ALREADY_KNOWN
    if (at >= 0) {
      notNeededLeft.splice(at, 1)
      reason = EXCLUSION_REASON_NOT_NEEDED
    }
    lines.push(`  - 「${item}」（人已划掉·${reason}：${REASON_TEXT[reason]}）`)
  }
  lines.push(`  - 两档分得开：**下沿**（已经会、以下不讲）${reading.alreadyKnown.length} 条`
    + `／**上沿①**（本书不覆盖这个主题）${reading.notNeeded.length} 条；`
    + '**上沿②**（图上没有的知识）没有盘上件，机器不替你列——那一半由你自己按材料判。')
  lines.push('  - ⚠️ 这一格是**整批**给的（全书那一份剔除集合）：**卡片与章今天没有映射** ⇒ '
    + '哪几条与你这一章相关，由你自己按本章 `points` 与章标题认领；机器⛔ 不替你做这个映射，'
    + '也⛔ 不因此改章数或字数。')
  const staleLine = readerBoundaryStaleSentence(reading)
  if (staleLine !== '') lines.push(`  - ⚠️ ${staleLine}（⛔ 不写回那份件。）`)
  return lines
}

/**
 * `style-spec` 两格那条**下游成文**的指令（票 07 第 6 条；只有 `gold-writing` 那一档带它——
 * 写 `工作区/style-spec.md` 的是**执笔小助手**）。
 *
 * ⚠️ 那两格（第 9 项「写作纪律」的**排除项**、第 12 项「读者意识声明」）是**下游成文**，
 * ⛔ **不是第二份事实源**（spec §4.4）：本格给的是**指令 ＋ 现算的边界**，产物里那两节由执笔小助手写。
 * ⚠️ 判据能断的只到「这条指令在它拿到的派单正文里」；「`工作区/style-spec.md` 里真写出了它」
 * 归人工抽读（机器在写作面拿不到那份产物，本票不改 `styleCheck`）。
 */
export const STYLE_SPEC_BOUNDARY_INSTRUCTION = '- ⚠️ `工作区/style-spec.md` 的**两格**要写出上面这份边界'
  + '（**下游成文**，⛔ 不是第二份事实源）：第 9 项「写作纪律」的**排除项**那一半逐条写上面那一批'
  + '（本书不写什么）；第 12 项「读者意识声明」写清**下沿**（读者已经会、以下不讲）与**上沿**'
  + '（这本书能教到哪；**上沿②**＝图上没有的知识，机器不替你列，按材料自己判）。'

/**
 * **读侧包装**（动作层用）：把这本书的那一份读数现算出来。
 *
 * ⚠️ 读盘只有这一条路，而它自己只走**唯一读侧入口** `readCoverageCollection()`
 * （`workflow/knowledge-map-exclusions.js`）——⛔ 本模块不另写一份读盘、也不手抄「怎么减」。
 *
 * @param {string} projectId
 * @returns {ReturnType<typeof readerBoundaryReading>}
 */
export function readReaderBoundary(projectId) {
  return readerBoundaryReading(readCoverageCollection(projectId))
}
