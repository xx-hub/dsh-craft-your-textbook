/**
 * 「造书前一道知识点图」的**补图逻辑**（票 `.scratch/knowledge-graph-build/issues/03` 的 §①；
 * 口径来源 `.scratch/knowledge-graph-step/spec.md` §2／§3／§8.1／§10／§11）。
 *
 * ## 它做什么／不做什么（这一段就是本模块的边界，别在别处另写一句）
 *
 * - **做**：把一本**已经在盘上**的书（新书用规范段名、老书用退役段名——两代都由读侧兜底认得）的那张图补出来——
 *   ① 从**盘上已有产物**派生 `cards[]`（一条知识点 ＝ 一张卡，`name` **逐字**等于
 *   `knowledgePoints[].title`，spec §3 的 1:1 派生）；② **定点回转换稿取锚**（按小节名找到转换稿里的
 *   标题行，锚＝那一节的行段），⛔ **不通读全文**；③ 落点**两档**（有分片的书两个键补进各分片、再由
 *   机器重拼；无分片的书直接补进合并件）；④ **落盘只走 `knowledge-map-landing.js` 那一个入口**
 *   （闸 → 约简 → 渲染 → 写；完整理由住它的文件头，⛔ 本文件不再抄第二份）；
 *   ⑤ 「这份图是补的」落 `meta` ＋ 一条账本事件（⛔ **不进合并件**）。
 * - **不做**：**不产边**（边是 AI 的判断，spec §2；本模块只把**盘上已声明**的边收进来、做一遍
 *   **传递约简**，没有声明就是空表）；不产书级判断（书级键 `teachingFocus`／`chapterSuggestion`／
 *   `edges`／`readerSlices` 只**原样搬运**）；
 *   不出裁决；跨材料的对齐与合并（票 06）；不接流程／不进阶段（票 05／07）。
 *
 * ## 边从哪来（今天盘上一条边都没有，如实记）
 *
 * 优先级：**显式草稿**（`options.edges`）→ **分片自己的声明**（各片 `edges` 首尾相接 ＋ 合并件里
 * 书级那一段）→ **合并件里已声明的**（无片那一档／重跑的幂等面）→ **空表**。
 * 今天的真书**一条边都没有声明过**（全仓无 `kind:"prereq"` 的盘上件，取样见票面 `## Answer`）
 * ⇒ 补出来的图 `edges: []`，本模块**如实**给出「本次扫面 0 条边」那条读数（spec §5 守卫 (a)，票 03
 * 完成判据第 5 条），⛔ 不为了让它非空去编边（那正是「多连边迁就检查」）。
 *
 * ## 存量用**传递约简**、判定用**传递闭包**（spec §2 那句的落点）
 *
 * 收进来的边先**过闸**、闸通过之后**才**过 {@link reduceTransitivePrereqEdges}：`prereq` 里凡有
 * ≥2 步替代路径的边**删掉**（存量画的就是约简）；`alias`／`see-also` 原样留着（它们不进可达性）。
 * 判定那半（查环／闭包）**不是本模块的活**——交工那一跳的闸走票 02 的 `prereqShapeProblems`。
 * 删掉的条数**如实进报告**（`reduced`；告知面归票 06）。
 * 约简只走票 02 的 `prereqEdges()` 取子集（**唯一入口**，⛔ 不在调用方再写一份 filter）。
 *
 * ⚠️ 「先过闸、后约简、再 render、最后写」这条次序的完整理由**只住
 * `knowledge-map-landing.js` 的文件头**（票 `graph-write-order/05` 收成一处；⛔ 本文件不再抄第二份）。
 *
 * ## 两档落点（spec §10 那条最容易抄丢的）
 *
 * - **有分片的书**：两个键补进**各分片**，再由机器**重拼**合并件（＝ `expectedKnowledgeMap`
 *   ＋ 一遍 `difficulty` 归一化，与 `src/workflow/actions/chapters.js` 探索段交工那一跳同一套）。
 *   每片只拿**自己那份材料**的卡与该材料内部的边；跨材料的边走书级那一块（票 06）。
 * - **没有分片的书**：**直接补进合并件**（盘上真书里无片的是大多数）。这一档 `payload` **逐字不变**
 *   ——只多 `cards`／`edges` 两个键（「机器是合并件的唯一写入者」在这一档放宽成「只有机器写、
 *   人不手改」，spec §10 逐字）。
 *
 * ## 重拼对账（spec §10 的「先把盘上那份重算一遍」）
 *
 * {@link reconcileKnowledgeMapRebuild} 用手上这套重拼把**盘上那份**重算一遍，返回逐字是否相等与
 * **差异清单**。⛔ **不相等时不抹平**：差异照实摆出来（票面的完成判据第 3 条）。
 * 分片那一档重拼＝分片 ＋ 书级键 ＋ 归一化；无片那一档没有分片可拼 ⇒ 重拼面只剩「同一个渲染器再渲染
 * 一遍」＋ 另算一条**归一化会改什么**的读数（那一条正是「盘上那份本来就不是这个渲染器＋归一化的
 * 产物」这个分辨点）。
 *
 * ## 显式的**重拼**入口（票 04 定的名字与调用面）
 *
 * - {@link planKnowledgeMapRebuild}（纯读）／{@link applyKnowledgeMapRebuild}（写盘）＝「由**盘上各分片**
 *   把合并件重拼一遍」这一件事的**唯一实现**。它有分片那一档才有意义：无分片那一档没有分片可拼 ⇒
 *   重拼入口**不写盘**，只给两条读数（恒等再渲染 `identityEqual` ＋ 归一化会改什么）。
 * - 重拼含**一遍 `difficulty` 归一化**（与交工那一跳、与补图的落地同一套，{@link rebuildMergedMapFromShards}）
 *   ——少了这一遍，逐字对账永远差一点（票 04 的完成判据第 3 条）。
 *   ⚠️ 归一化作用在**分片交来的原值**上，而分片自己的 payload（AI 的产出）**逐字不动** ⇒
 *   `difficultyNorm.wouldChange` 这条读数的意思是「**这一遍**动了什么」，⛔ 不是「盘上还差什么」：
 *   一本分片里带着出域难度的书，重拼一百遍它都是真。
 * - 输出指纹走 {@link outputFingerprint}（字节数 ＋ sha256 前 16 位）：连跑两次的指纹逐字相同＝幂等。
 *
 * ## 两档落点**显式分家**（票 04 的主 deliverable，别读成 03 的一个参数）
 *
 * {@link landingOfBook} 是「这本书该走哪一档」的**唯一出处**（{@link LANDING_MODES}），落点本身分成
 * 两条互不相同的路：**有分片** ⇒ 两个键补进各分片、再由机器**重拼**合并件；**没有分片** ⇒ 两个键
 * **直接补进合并件**（这一档的文件层面**必然重写**，政策那句「一个字不动」落在 **payload**：
 * 除两个图键之外的每一个键逐字不变；「机器是合并件的**唯一**写入者」在这一档放宽成「**只有机器写、
 * 人不手改**」，spec §10 逐字）。
 *
 * ## 失败＝**撤回**那两个键（spec §10；与交工那一跳同一先例）
 *
 * 计划阶段或形状闸有任何问题 ⇒ **图不落地**，并把**盘上带着图键的那几份件**里的两个键去掉、
 * 用同一个渲染器写回（{@link withdrawKnowledgeGraphKeys}）：交工那一跳今天就是这么做的
 * （`src/workflow/actions/chapters.js` 把 payload-only 那份写回盘），这里只是同一口径落到补图入口。
 * ⛔ **没有图键的件一个字节都不碰**（连重排都不做：「回到补图前的样子」是逐字的要求）；
 * ⛔ **章产物（`chapter-NN.md`／`book.md`／`explore.md`）本模块碰都不碰**——撤回只动那两个键。
 * ⚠️ 撤回**不区分那两个键是谁写的**（老书补图前盘上本来没有它们；分片那一档本模块本来就会重写
 * 分片里的卡与边）——这是有意的，理由写在 {@link withdrawKnowledgeGraphKeys} 的注释里。
 *
 * ## 两处盘上事实（票 04 写在明处，⛔ 别当惊喜）
 *
 * - **演示书补不了**：分片结构性到不了演示书那一档（它的源不是「转换完成的材料」），改书那条通路
 *   对它是 409 ⇒ 界面**不提示**这颗键（可见性三条归票 12）。本模块不按 `demo` 分档（它只按分片分档）
 *   ——「补不了」住在界面与改书守卫那一层，不在这一层。
 * - **零源书走到闸为止**：`knowledgePoints: []` 的书写得出计划与两键（空表），但形状闸按 spec §5
 *   守卫 (a) 判 `cards-empty` ⇒ **图落不了**。这条接缝（零源书要不要放行空图）归票 12，本模块
 *   ⛔ 不为它开口子（守卫 (c)：结构性错误不新增豁免）。
 *
 * ## 读盘一律经 `bookRelOnDisk`（⛔ 不建目录）
 *
 * 书夹段名有两代（工作区根段与转换稿段各有一个退役名；**逐字清单只住一处**：
 * `src/domain-rules.js` 的 `LEGACY_*_NAME` 那一族）⇒ 一律走
 * `src/workflow/engine/paths.js` 那族**读侧兜底**（{@link bookRelOnDisk}，与 `workDir` 共用同一份
 * 「新名优先、老名兜底」判法）。⛔ **本模块不调 `workDir`／`detailDir`／`convertedDir`**：那三个会
 * `mkdirSync`，读一件事实不该在用户的旧书上凭空长出空的新目录（票 `context-budget/13` 的实测病）。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（票 `dev-gate-scan/17` 的纪律；口径照抄 spec §5 末段）
 *
 * - **锚只判「有没有可解析的行段」**：本模块按小节名在转换稿里找**标题行**、取那一节的行段——
 *   它**不证明锚对得上原文**（小节名对不上时本模块如实报 `anchor-unresolved` 并且**不写盘**，
 *   ⛔ 不拿一个兜底区间糊过去）。
 * - **`testable` 的来路窄**：票面说「`testable` 由细目产」，而盘上细目今天**只有**
 *   `标题：要点列表（章节）——难度` 这一种形状（没有「一句可判的话」那一格）⇒ 本模块按级联取
 *   （**知识点摘要 → 细目条目余段 → 该小节摘要**，顺序与理由见 {@link testableOf}），
 *   **来路逐条计数进报告**。语义质量（这句话能不能真判「会不会」）**本模块不证**，归票 05 与独立审校。
 * - 片的数量与材料号取自**盘上文件**（`knowledge-map-NN.json`）与分片自己的 `materials[].num`；
 *   「这一片该不该在」（材料转好了没有）不在本模块的扫面里（那是交工验货面）。
 * - 卡与知识点的 1:1 只**逐字比两串字**（本模块连这条都不比——那是闸的活；本模块只保证**产**出来的
 *   `name` 是逐字抄的 `title`）。
 *
 * 运行入口：`node scripts/knowledge-graph-build.mjs --project=<projectId>`（薄 CLI，见那份文件头；
 * `--rebuild` 走进 {@link applyKnowledgeMapRebuild}）。
 */

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'

import {
  CONVERTED_DIR_REL,
  WORK_DIR_NAME,
  normalizeKnowledgePointDifficulties,
  okMaterialShards,
  posixBookRel,
  productFamilyPath,
  readingRel,
} from '../domain-rules.js'
import { bookRelOnDisk, metaPath, projectDir } from './engine/paths.js'
import {
  expectedKnowledgeMap,
  renderKnowledgeMap,
} from './knowledge-map-assembly.js'
import { KnowledgeGraphInputError, prereqEdges } from './knowledge-graph.js'
// 票 `graph-write-order/03`：合并件落盘的**唯一入口**（闸 → 约简 → 渲染 → 写；七档结局）。
import { MERGED_MAP_GATE_NOT_RUN, MERGED_MAP_OUTCOMES, applyMergedMapLanding, planMergedMapLanding } from './knowledge-map-landing.js'
import { KNOWLEDGE_CONFIDENCE_LEVELS, PENDING_CONFIDENCE, edgeScanText, knowledgeMapGateProblems } from './knowledge-map-gate.js'

/** 合并件的文件名（⛔ **不是**全仓唯一一份字面量：`src/` 里另有若干处 `'knowledge-map.json'`，
 *  见 `grep -rn "'knowledge-map.json'" src/`。**权威登记**在 `domain-rules` 的「知识地图」那一行，
 *  路径经 `productFamilyPath('知识地图')` 派生；读侧的唯一出口是 {@link readMergedMap}。 */
export const MERGED_MAP_NAME = 'knowledge-map.json'

/** 「这份图是补的」落 `meta` 的那个键（spec §10：⛔ 不进合并件——写进去下次重拼就丢）。
 *  ⚠️ 这是**下游要读的字段名**（票 12 的「补图」入口、票 15 的抬头那句话按它判「图是补的没」）。 */
export const GRAPH_BACKFILL_META_KEY = 'knowledgeGraphBackfill'

/**
 * 机器派生出来的卡片的把握档：**最弱那一档**（spec §2：它是独立审校的注意力清单第一批）。
 *
 * ⚠️ **取值从词表来**（`PENDING_CONFIDENCE`，声明住 `src/knowledge-confidence.js`；票
 * `depth-round-3/03`）——⛔ 这里不再手抄那个档名：改名第三档时补卡的取值跟着走。
 * ⛔ 机器不替卡判「强／中」——那要真读原文，归票 05 的精读与独立审校。
 */
export const BACKFILL_CARD_CONFIDENCE = PENDING_CONFIDENCE

/**
 * 两档落点的**名字**（票 04 把它显式化）——**唯一出处**：⛔ 别在别处再写这两个字面量。
 *
 * - `shards`：盘上有知识地图分片 ⇒ 两个键补进**各分片**，再由机器**重拼**合并件。
 * - `merged-only`：盘上没有分片 ⇒ 两个键**直接补进合并件**（payload 逐字不变）。
 * - `none`：既没有分片也没有合并件 ⇒ 没有落点（补图无从谈起）。
 */
export const LANDING_MODES = Object.freeze({ shards: 'shards', mergedOnly: 'merged-only', none: 'none' })

/**
 * {@link readMergedMap} 的 `error` 在**解析成功、但解析出来不是对象**时的那一句。
 *
 * ⚠️ 这一格是给「要说为什么」的调用方用的（{@link planKnowledgeGraphBackfill} 与
 * {@link planKnowledgeMapRebuild} 各有一处报错文案）：`已 parse` 但没有对象形状**不是**「不是严格
 * JSON」——`[]`／`42` 都是合法 JSON。两档必须分两句说，⛔ 不许合成一句。
 */
export const MERGED_MAP_NOT_OBJECT_REASON = '解析出来不是 JSON 对象'

/**
 * 一份文本的**输出指纹**（字节数 ＋ sha256 前 16 位十六进制）。
 *
 * ⛔ 别在调用方自己拼一份哈希：重拼幂等（票 04 完成判据第 3 条）与票 12 的读数都吃这一份口径。
 * 前 16 位够「同输入同输出」这类对账用（不是安全用途）。
 *
 * @param {unknown} text
 * @returns {{bytes: number, sha256: string}}
 */
export function outputFingerprint(text) {
  const body = typeof text === 'string' ? text : ''
  return {
    bytes: Buffer.byteLength(body, 'utf8'),
    sha256: createHash('sha256').update(body, 'utf8').digest('hex').slice(0, 16),
  }
}

/** 指纹的人读一行（`1234B／abcdef0123456789`）——CLI 与测试的读数格式也走它。 */
export function fingerprintText(fingerprint) {
  if (fingerprint === null || typeof fingerprint !== 'object') return '（无指纹）'
  return `${fingerprint.bytes}B／${fingerprint.sha256}`
}

/**
 * 书内复合键 `M<材料号>-<片内组:02>-<序号:02>`（spec §3）。
 *
 * ⚠️ **下游（票 05／06／11）必须用这一个函数**，⛔ 别在别处再拼一遍这个格式：
 * spec §3 只标了「片内组:02」，票 01 的夹具里**序号也是两位**（`M1-01-01`）⇒ 本函数两位都补零。
 * 三处不一致的键＝边端指不上卡（本闸当场红），所以格式只此一份。
 *
 * @param {{material: number, group: number, index: number}} parts 三个都是 1 基正整数
 * @returns {string}
 */
export function knowledgeCardKey({ material, group, index }) {
  for (const [name, value] of [['material', material], ['group', group], ['index', index]]) {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new Error(`知识点卡的复合键三段都必须是 1 基正整数，${name}＝${JSON.stringify(value)}`)
    }
  }
  return `M${material}-${String(group).padStart(2, '0')}-${String(index).padStart(2, '0')}`
}

// ── 纯文本小工具（不读盘；口径只此一份）──────────────────────────────────────────

/** 小节名的归一形（比标题用）：NFKC ＋ 去脚注标记 ＋ 去空白 ＋ 去书名号引号 ＋ 小写。
 *  ⛔ 保留 `.`（`1.1.1` 那类编号靠它认）。 */
function normText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/\[\d+\]/gu, '')
    .replace(/[\s\u3000]+/gu, '')
    .replace(/[「」『』《》〈〉“”‘’"']/gu, '')
    .toLowerCase()
}

/** 中文数字（1–99）→ 数；认不出回 `null`。 */
function chineseNumber(text) {
  const digits = '零一二三四五六七八九'
  if (/^\d+$/u.test(text)) return Number(text)
  if (text === '十') return 10
  const tenAt = text.indexOf('十')
  if (tenAt >= 0) {
    const head = text.slice(0, tenAt)
    const tail = text.slice(tenAt + 1)
    const tens = head === '' ? 1 : digits.indexOf(head)
    const ones = tail === '' ? 0 : digits.indexOf(tail)
    if (tens < 1 || ones < 0) return null
    return tens * 10 + ones
  }
  const value = digits.indexOf(text)
  return value > 0 ? value : null
}

/** `资料1：…` / `材料1-…` / `材料1·…` → `{material, tail}`；认不出材料号时 `material` 为 `null`。 */
function splitSource(source) {
  const text = String(source ?? '').trim()
  const hit = /^(?:资料|材料)\s*(\d+)\s*[：:\-·・]?\s*(.*)$/u.exec(text)
  if (hit === null) return { material: null, tail: text }
  return { material: Number(hit[1]), tail: hit[2].trim() }
}

/** 小节名里的章／节序号（`第一节` → `[1]`；`第七、八节` → `[7, 8]`；`第1章1.1.1` → `[1]`）。 */
function sectionOrdinals(tail) {
  const hit = /^第\s*((?:[零一二三四五六七八九十百]+|\d+)(?:\s*[、,，]\s*(?:[零一二三四五六七八九十百]+|\d+))*)\s*(?:节|章)/u.exec(tail)
  if (hit === null) return []
  const out = []
  for (const part of hit[1].split(/[、,，]/u)) {
    const value = chineseNumber(part.trim())
    if (value !== null) out.push(value)
  }
  return out
}

/** 转换稿的标题索引（1 基行号；`####` 以内都算标题）。 */
function headingIndex(markdown) {
  const lines = String(markdown ?? '').split('\n')
  const headings = []
  lines.forEach((line, at) => {
    const hit = /^(#{1,4})\s+(.*)$/u.exec(line)
    if (hit === null) return
    const text = hit[2].trim()
    headings.push({ line: at + 1, level: hit[1].length, text, norm: normText(text) })
  })
  return { lines, headings }
}

/**
 * 标题开头的**编号**（`一、运维服务组织架构` → `[1]`；`1.1 概述` → `[1,1]`；`1.1.1 概念` → `[1,1,1]`）。
 *
 * ⚠️ 两支的判据不同，都是为了不把日期读成层级：**带点的编号**（`4.1数据中心告警统计` 这种后面直接跟
 * 中文的写法）一律认；**光杆数字**必须带分隔符（`1. 工业大数据分析概论` 认，`2025年1月` 不认）。
 * 认不出回 `null`（⇒ 那一支退回落 markdown 层级那条规矩）。
 */
function headingNumber(text) {
  const raw = String(text ?? '')
  const cn = /^([零一二三四五六七八九十]+)\s*[、.．]/u.exec(raw)
  if (cn !== null) {
    const value = chineseNumber(cn[1])
    return value === null ? null : [value]
  }
  const dotted = /^(\d+(?:\.\d+)+)/u.exec(raw)
  if (dotted !== null) return dotted[1].split('.').map(Number)
  const plain = /^(\d+)\s*[、.．]/u.exec(raw)
  if (plain !== null) return [Number(plain[1])]
  return null
}

/** 某条标题那一节的**行段**（尾部空行收干净）。 */
function sectionRange(index, at) {
  const { lines, headings } = index
  const own = headingNumber(headings[at].text)
  const level = headings[at].level
  let end = lines.length
  for (let i = at + 1; i < headings.length; i += 1) {
    const next = headings[i]
    if (own !== null) {
      // 转换稿常把标题层级**拉平**（`一、运维服务组织架构` 与它的 `1.1 日常组织架构` 都是 `##`）
      // ⇒ 有编号时按**文档自己的编号**判深浅：下一个「不比本标题更深」的编号就是下一节。
      const nextNo = headingNumber(next.text)
      const deeper = next.level > level
        || (nextNo !== null && nextNo.length > own.length && own.every((value, k) => nextNo[k] === value))
      if (deeper) continue
      end = next.line - 1
      break
    }
    if (next.level <= level) { end = next.line - 1; break }
  }
  while (end > headings[at].line && String(lines[end - 1] ?? '').trim() === '') end -= 1
  return Math.max(end, headings[at].line)
}

/**
 * 在转换稿里按候选小节名找标题行（**取最具体的那一条**：先整串相等、再「标题被候选包含」、
 * 最后「候选被标题包含」）。
 *
 * ⚠️ 长度下限只管**包含**那两支（挡住 `序言`／`总结` 这类短标题被别的候选串顺带包含而误命中）；
 * **整串相等**任何长度都算（`资料2：总结` 这种小节名就该命中 `## 总结`）。
 *
 * @returns {{at: number, kind: string, candidate: string, score: number}|null}
 */
function matchHeading(index, candidates) {
  let best = null
  for (const { text, kind } of candidates) {
    const norm = normText(text)
    if (norm.length < 2) continue
    index.headings.forEach((heading, at) => {
      if (heading.norm === '') return
      let score = 0
      if (heading.norm === norm) score = 30000 + heading.norm.length
      else if (norm.includes(heading.norm) && heading.norm.length >= 3) score = 20000 + heading.norm.length
      else if (heading.norm.includes(norm) && norm.length >= 4) score = 10000 + norm.length
      if (score > 0 && (best === null || score > best.score)) best = { at, kind, candidate: text, score }
    })
  }
  return best
}

/**
 * 兜底两支（文本对不上时）：**编号**（`1.1.1` 那种小节号，标题以它开头）与**序号标记**
 * （`第七、八节` → 标题以 `七、`／`8.` 开头）。⛔ 两支都只认「标题行」，不猜正文。
 */
function matchByCodeOrOrdinal(index, tail) {
  const codes = String(tail ?? '').match(/\d+(?:\.\d+)+/gu) ?? []
  for (const code of codes) {
    const at = index.headings.findIndex((heading) => heading.norm.startsWith(normText(code)))
    if (at >= 0) return { at, kind: 'code', candidate: code, score: 900 }
  }
  for (const ordinal of sectionOrdinals(tail)) {
    const markers = [`${ordinal}.`, `${ordinal}、`, `第${ordinal}节`, `第${ordinal}章`]
    const cn = '零一二三四五六七八九十'
    if (ordinal >= 1 && ordinal <= 10) markers.push(`${cn[ordinal]}、`, `${cn[ordinal]}.`)
    for (const marker of markers) {
      const normMarker = normText(marker)
      const at = index.headings.findIndex((heading) => heading.norm.startsWith(normMarker))
      if (at >= 0) return { at, kind: 'ordinal', candidate: marker, score: 800 }
    }
  }
  return null
}

/** 细目（`工作区/细目/精读-NN.md`）里「知识点细目」那一节的逐条条目。 */
function parseDetailEntries(markdown) {
  const entries = []
  for (const line of String(markdown ?? '').split('\n')) {
    const hit = /^\s*(\d{1,3})[.、]\s*(.+)$/u.exec(line)
    if (hit === null) continue
    const raw = hit[2].trim()
    const withoutDifficulty = raw.replace(/[—–-]{1,2}\s*(基础|重点|难点|进阶)\s*$/u, '').trim()
    const quoted = [...withoutDifficulty.matchAll(/[「『]([^」』]{2,40})[」』]/gu)].map((m) => m[1])
    entries.push({ order: Number(hit[1]), raw, text: withoutDifficulty, quoted })
  }
  return entries
}

/**
 * 卡片的 `testable`（级联；**来路**由调用方计数）。
 *
 * ⚠️ **级联顺序与票面写的不一样，这里有实测理由**（偏离照实记，见票面 `## Answer`）：票面说
 * 「`testable` 由细目产」，而盘上细目今天**只有** `N. 标题：要点列表（章节）——难度` 这一种形状
 * ——把它切出来的「余段」是**标题那个从句的续写**（实测：知识点「CPTSD 是后天习得的适应方式」
 * 切出来是「不是基因或性格缺陷」），不是一句可判的话。`knowledgePoints[].summary` 才是盘上现成的
 * **一句话**（实测同一条：「CPTSD 由外部创伤环境造成，不是基因或性格缺陷，因此能被改变。」）
 * ⇒ 顺序是 **summary → 细目余段 → 该小节 summary**，来路逐条计数、语义质量仍归票 05 与独立审校。
 */
function testableOf(point, detailEntry, section) {
  if (typeof point?.summary === 'string' && point.summary.trim() !== '') {
    return { value: point.summary.trim(), from: 'summary' }
  }
  if (detailEntry !== null) {
    const title = typeof point?.title === 'string' ? point.title : ''
    const at = title === '' ? -1 : detailEntry.text.indexOf(title)
    if (at >= 0) {
      const rest = detailEntry.text.slice(at + title.length)
        .replace(/^[\s：:，,、；;—–-]+/u, '')
        .replace(/（[^）]*）\s*$/u, '')
        .trim()
      if (rest !== '') return { value: rest, from: 'detail' }
    }
  }
  const sectionSummary = section !== null && typeof section?.summary === 'string' ? section.summary.trim() : ''
  if (sectionSummary !== '') return { value: sectionSummary, from: 'section' }
  return { value: '', from: 'none' }
}

// ── 盘上事实（读侧；⛔ 不建目录）────────────────────────────────────────────────

function readTextIfExists(path) {
  return path !== null && existsSync(path) ? readFileSync(path, 'utf8') : null
}

/**
 * 读一份 JSON 件：**读侧一步都不抛**（票 `graph-read-one-answer` 收口 review 的 blocker）。
 *
 * ⚠️ 四种「读不出来」都折成同一个答复（`value: null` ＋ `error` 说清是哪一种）：
 * 件不在（`error: null`）／**读本身失败**（`EACCES`／`EISDIR`／`existsSync` 与 `readFileSync` 之间
 * 被搬走那个 `ENOENT` 竞态）／不是严格 JSON／解析出来不是对象。
 * 承重的理由：窄出口的调用方（问卷、事件 payload、两处就绪判据）里有几处**今天各自包着 try**
 * ——收口成一处出口之后，那一处必须照样一个都不抛；否则一次 `EACCES` 会把整份 `/textbook/events`
 * 变成 500（这五份手搓读者本来都不会）。⛔ 别把这里的 `catch` 去掉。
 */
function readJsonIfExists(path) {
  let text
  try {
    text = readTextIfExists(path)
  } catch (error) {
    return { text: null, value: null, error: error instanceof Error ? error.message : String(error) }
  }
  if (text === null) return { text: null, value: null, error: null }
  try {
    return { text, value: JSON.parse(text), error: null }
  } catch (error) {
    return { text, value: null, error: error.message }
  }
}

/** 盘上那几片 `knowledge-map-NN.json`（按序号；**只读**目录，不看材料转好没有）。 */
export function readKnowledgeMapShards(projectId) {
  const workPath = bookRelOnDisk(projectId, WORK_DIR_NAME)
  if (!existsSync(workPath)) return []
  const out = []
  for (const name of readdirSync(workPath).slice().sort()) {
    const hit = /^knowledge-map-(\d{2})\.json$/u.exec(name)
    if (hit === null) continue
    const path = join(workPath, name)
    const read = readJsonIfExists(path)
    out.push({ n: Number(hit[1]), name, path, map: read.value, text: read.text, error: read.error })
  }
  return out.sort((a, b) => a.n - b.n)
}

/**
 * 这本书的**合并件**（`工作区/knowledge-map.json`）——「此刻在不在、读出来是什么、原文是什么、
 * 读不出是为什么」**唯一**的那一个答案。
 *
 * 口径**一条**：**严格 JSON 对象，否则算没有**。缺件／不是严格 JSON／解析出来不是对象／是数组
 * ⇒ 同一个答案（`map: null`）。`map !== null` 是**内容面**的判据（「这份地图可不可判」）。
 * 「件在不在」是另一个问题（票 `graph-read-one-answer/08`，`R-03`＝C）：`text !== null || error !== null`
 * ——读盘本身失败也算在；那一句归 `engine.js` 的 `mergedMapPresent`。两个问题都只读这一个出口，
 * ⛔ 别在调用方另写一份读盘（第二个 `stat` 也算第二份）。
 *
 * `error` 承载**三件事**，为的是让要「为什么」的调用方说得准（⛔ 它不改变 `map` 的取值）：
 * - 读本身失败（`EACCES`／`EISDIR`／`existsSync` 与 `readFileSync` 之间那个 `ENOENT` 竞态）⇒ 那句原话；
 * - 解析失败 ⇒ `JSON.parse` 那句原话（「不是严格 JSON」那一档）；
 * - 解析成功但不是对象 ⇒ {@link MERGED_MAP_NOT_OBJECT_REASON}（「不是 JSON 对象」那一档）。
 * 件不在时 `error` 是 `null`——「不在」不是「读不出」。
 *
 * **一个都不抛**（与它取代的那五份手搓读者同一口径）：读侧任何一步失败都折成 `map: null`。
 * 这条是承重的——问卷、事件 payload、两处就绪判据本来各自包着 `try`，收口之后只有这一处能接住。
 *
 * **纯读**：⛔ 不调 `workDir`（会 `mkdirSync`）、⛔ 不走 `engine.js` 的 `workFile`（反向 import 会造环）。
 * 路径走 `projectDir`／`metaPath`／`bookRelOnDisk`——与 {@link readBookGraphInputs} 同一条链。
 * ⚠️ **已知窄处**：`projectDir` 对**未登记**的 projectId 会退到 `projectsRoot()`，而那里有
 * `mkdirSync(textbook/projects)` ⇒ 只有「登记过的书」才谈得上零副作用；`test-knowledge-graph-build.mjs`
 * 的纯读那一格用的是登记过的书（那一格钉的是「不建 `工作区/`」），未登记那一档的副作用另有专门一格。
 *
 * ⚠️ 相对路径从**产物清单派生**（`productFamilyPath('知识地图')`，与 `knowledge-graph-chain.js` 的
 * `KNOWLEDGE_MAP_REL` 同一写法）：⛔ 不在这里再写一份 `'knowledge-map.json'` 字面量。
 *
 * @param {string} projectId
 * @returns {{rel: string, path: string, text: string|null, map: object|null, error: string|null}}
 */
export function readMergedMap(projectId) {
  const rel = productFamilyPath('知识地图')
  const path = bookRelOnDisk(projectId, rel)
  const read = readJsonIfExists(path)
  const parsed = read.value
  const map = parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  return {
    rel,
    path,
    text: read.text,
    map,
    // 解析失败那句原话优先（它才是「不是严格 JSON」）；解析成功但不是对象报**形状**那一句。
    error: read.error ?? (read.text === null || map !== null ? null : MERGED_MAP_NOT_OBJECT_REASON),
  }
}

/**
 * 一本书的在盘形状（两档判定的输入面）。**纯读**：任何一步都不建目录、不写盘。
 *
 * ⚠️ 「合并件那几格」**全部**从 {@link readMergedMap} 取（唯一口径）——本函数退成它的消费者：
 * **键集合与三个档名一个字不变**；`merged`／`mode` 对 `[]`／`42` 是**有意改值**
 * （`[]`→`null`、`merged-only`→`none`，票 `graph-read-one-answer/01` 的行为修正①），其余取值不变。
 */
export function readBookGraphInputs(projectId) {
  const metaRead = readJsonIfExists(metaPath(projectId))
  const mergedRead = readMergedMap(projectId)
  const shardFiles = readKnowledgeMapShards(projectId)
  const shards = shardFiles.filter((shard) => shard.map !== null)
  const workPath = bookRelOnDisk(projectId, WORK_DIR_NAME)
  return {
    projectId,
    meta: metaRead.value,
    metaError: metaRead.error,
    workPath,
    workRel: basename(workPath),
    mergedRel: mergedRead.rel,
    mergedPath: mergedRead.path,
    mergedText: mergedRead.text,
    merged: mergedRead.map,
    mergedError: mergedRead.error,
    shardFiles,
    shards,
    mode: shards.length > 0 ? 'shards' : (mergedRead.map === null ? 'none' : 'merged-only'),
  }
}

/**
 * 这本书该走**哪一档落点**（票 04 把它显式分家）。判据只有一条：**盘上有没有知识地图分片**
 * （`工作区/knowledge-map-NN.json`）——⛔ 不按 `demo`／阶段／状态分档（「演示书补不了」住在界面与
 * 改书守卫那一层，见文件头那句事实）。
 *
 * ⚠️ 我看到的只有**盘上那个形状**：分片在不在、合并件在不在。⛔ 看不见「这一片该不该在」
 * （材料转好了没有）——那是交工验货面。
 *
 * @param {string} projectId
 * @returns {{mode: string, reason: string, shardNumbers: number[], shardFiles: string[], mergedPath: string}}
 */
export function landingOfBook(projectId) {
  return landingTierOfInputs(readBookGraphInputs(projectId))
}

/** 档的判定本体（纯函数；`plan` / `rebuild` / `withdraw` 三处走同一条）。
 *
 * ⚠️ **已知的不一致（有意留着，不是漏改）**：本函数判「有没有合并件」用的是 `mergedText === null`
 * （**件在不在**），而 `readBookGraphInputs().mode` 用的是 `merged === null`（**读出来是什么**）。
 * 于是盘上摆一份 `[]`／`42` 时 `mode === 'none'`、`landing.mode === 'merged-only'`。
 * 这是 spec §3 明写的「`landingTierOfInputs` 的判据一个字不变」——改它属于改判据面，要单独论证。
 * 两条路都不写盘（`planKnowledgeGraphBackfill` 在 `mode === 'none'` 那一支就早退了），所以只是读数怪相。
 */
function landingTierOfInputs(inputs) {
  if (inputs.mode === 'shards') {
    return {
      mode: LANDING_MODES.shards,
      reason: `盘上有 ${inputs.shards.length} 份知识地图分片 ⇒ 两个键补进各分片，再由机器重拼合并件（${inputs.shards.map((shard) => shard.path).join('、')}）`,
      shardNumbers: inputs.shards.map((shard) => shard.n),
      shardFiles: inputs.shards.map((shard) => shard.path),
      mergedPath: inputs.mergedPath,
    }
  }
  if (inputs.mergedText === null) {
    return {
      mode: LANDING_MODES.none,
      reason: '既没有知识地图分片、也没有合并件 ⇒ 没有落点',
      shardNumbers: [],
      shardFiles: [],
      mergedPath: inputs.mergedPath,
    }
  }
  return {
    mode: LANDING_MODES.mergedOnly,
    reason: '盘上没有知识地图分片 ⇒ 两个键直接补进合并件（除两个图键外的每一个键逐字不变）',
    shardNumbers: [],
    shardFiles: [],
    mergedPath: inputs.mergedPath,
  }
}

/** 材料号 → 转换稿正文（`meta.sources[].md`，经读侧兜底落到盘上）。⛔ 不变通读全文。 */
function convertedTexts(projectId, meta) {
  const out = new Map()
  for (const { n, source } of okMaterialShards(meta?.sources)) {
    const relRaw = typeof source?.md === 'string' && source.md.trim() !== '' ? source.md.trim() : null
    if (relRaw === null) continue
    const rel = `${CONVERTED_DIR_REL}/${posixBookRel(relRaw)}`
    const path = bookRelOnDisk(projectId, rel)
    out.set(n, { path, text: readTextIfExists(path) })
  }
  return out
}

/** 细目正文（`工作区/细目/精读-NN.md`，书夹相对形状经读侧兜底）。⛔ 不用 `detailDir`（它会建目录）。 */
function detailText(projectId, n) {
  const path = bookRelOnDisk(projectId, readingRel(n))
  return { path, text: readTextIfExists(path) }
}

// ── 传递约简（存量那一半）─────────────────────────────────────────────────────

/**
 * `prereq` 子图的**传递约简**：凡有 ≥2 步替代路径的 `prereq` 边删掉；`alias`／`see-also` 原样留。
 *
 * ⚠️ 只走票 02 的 `prereqEdges()` 取子集（**唯一入口**）；`kind` 不干净时那一个入口会抛
 * {@link KnowledgeGraphInputError} ⇒ **本函数把它收成 `problems` 返回，⛔ 不抛**（坏边由闸去拒收，
 * 约简这一道只如实说明「没约简」）。
 * ⚠️ 环上的边**一律保留**（环里没有「≥2 步替代路径」可言；有没有环是闸的活）。
 * ⚠️ 「`alias`／`see-also` 原样留」是**按边身份**兑现的：删谁只看**那一条 `prereq` 自己**，
 * ⛔ 不拿 `from␀to` 签名删整张表 ⇒ 同端点的另两类边与它**互不牵连**（同端点不同 `kind` 是合法的，
 * 判重复的是 `knowledge-map-gate` 的 `edge-duplicate`，它按 `from`／`to`／`kind` 三样一起比）。
 *
 * @param {unknown} edges 完整边表（含三类）
 * @returns {{edges: unknown[], removed: Array<{from: string, to: string}>, problems: string[], skipped: boolean}}
 */
export function reduceTransitivePrereqEdges(edges) {
  const list = Array.isArray(edges) ? edges : []
  let prereq
  try {
    prereq = prereqEdges(list)
  } catch (error) {
    if (error instanceof KnowledgeGraphInputError) {
      return { edges: list, removed: [], problems: [`边表读不进图，传递约简没做：${error.message}`], skipped: true }
    }
    throw error
  }
  const out = new Map()
  for (const edge of prereq) {
    if (edge.from === edge.to) continue // 自环不参与可达性（另有形状判据）
    const at = out.get(edge.from) ?? []
    at.push(edge.to)
    out.set(edge.from, at)
  }
  const reachableWithout = (from, to) => {
    const seen = new Set([from])
    const stack = [from]
    while (stack.length > 0) {
      const node = stack.pop()
      for (const next of out.get(node) ?? []) {
        if (next === to) return true
        if (seen.has(next)) continue
        seen.add(next)
        stack.push(next)
      }
    }
    return false
  }
  const removedKeys = new Set()
  const removed = []
  for (const edge of prereq) {
    if (edge.from === edge.to) continue
    const signature = `${edge.from}\u0000${edge.to}`
    if (removedKeys.has(signature)) continue
    // 临时抽掉这条边，看两端还通不通（通了 ⇒ 这条边是冗余的，存量画的是约简）。
    const bucket = out.get(edge.from) ?? []
    const at = bucket.indexOf(edge.to)
    if (at < 0) continue
    bucket.splice(at, 1)
    const stillReachable = reachableWithout(edge.from, edge.to)
    if (!stillReachable) bucket.splice(at, 0, edge.to)
    else {
      removedKeys.add(signature)
      removed.push({ from: edge.from, to: edge.to })
    }
  }
  // ⛔ 不按 `from␀to` 签名过滤**整张表**——那会把同端点、语义完全不同的 `see-also`／`alias` **连坐删掉**
  //    （与文件头「`alias`／`see-also` 原样留」和本函数自己的契约不符）。按**边身份**保：只有走约简的
  //    那几条 `prereq`（{@link prereqEdges} 保原对象引用）有资格进签名那一步，别的边一律原样留。
  const prereqSet = new Set(prereq)
  const kept = list.filter((edge) => {
    if (edge === null || typeof edge !== 'object') return true
    if (!prereqSet.has(edge)) return true
    return !removedKeys.has(`${edge.from}\u0000${edge.to}`)
  })
  return { edges: kept, removed, problems: [], skipped: false }
}

// ── 重拼的原语（票 04 的显式入口与落地两档共用这一份实现）────────────────────────

/**
 * 书级边那一段（**重拼要保住它**）：盘上那份合并件的 `edges`
 * ＝ 各分片声明的边（首尾相接）＋ **书级那一段**（拼装序：分片在前、书级在后，见
 * `src/workflow/knowledge-map-assembly.js` 的族表）。书级那一段**不在别处存**——它只活在合并件里
 * ⇒ 只能**从合并件里减掉各分片声明过的那几条**把它捡回来。
 *
 * ⚠️ **为什么是集合差、不是位置切片**（票 `knowledge-graph-edges-build/05`，与「落盘前恒做传递约简」
 * **捆绑**）：切片假设「合并件的前 N 条逐条等于分片声明的那 N 条」。约简一接进所有写盘点，这条假设
 * 就断了——各写盘点落盘的是**约简后**的边表，分片自己声明的那条冗余 `prereq`（`A→C` 而 `A→B→C`
 * 已在）**在合并件里根本不存在** ⇒ 位置切片会把**书级那条边**当成「分片的」吃掉（重拼少一条）或把
 * 分片的一条当成书级的（重拼多一条），重拼与对账一起错。集合差对顺序不敏感：分片声明过的按**内容**
 * 一条抵一条地抵消，剩下的就是书级那一段。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**（票 `dev-gate-scan/17` 的纪律）：
 * · 抵消按**边的内容**（键序无关的规范化 JSON）判，⛔ 不看对象身份（两侧是分别从盘上解析出来的）；
 * · 它只证明「这条边分片声明过没有」，**不证明**合并件里那几条就是这几片拼出来的——合并件被手改过
 *   （多出一条谁都没声明的边）时，多出来的那条会被算成**书级边**，本函数看不出来（重拼会把它在
 *   书级那一段里保住，于是对账仍相等；这条窄处与「书级边只活在合并件里」同源）。
 * · 分片声明得多、合并件里少（不合契约的形状）时按多重集抵消，抵不掉的都算书级边——⛔ 不猜、也不
 *   回空表把书级边整段丢掉。
 *
 * @param {ReadonlyArray<{n: number, map: unknown}>} shards
 * @param {unknown} mergedEdges 合并件里的 `edges`
 * @returns {unknown[]}
 */
export function bookLevelEdgeTail(shards, mergedEdges) {
  const declared = (Array.isArray(shards) ? shards : [])
    .flatMap((shard) => (Array.isArray(shard?.map?.edges) ? shard.map.edges : []))
  const merged = Array.isArray(mergedEdges) ? mergedEdges : []
  // 分片声明过的边按**内容**记一份多重集（同一条声明过两遍就抵两条），合并件逐条抵掉。
  const pool = new Map()
  for (const edge of declared) {
    const key = edgeIdentityOf(edge)
    pool.set(key, (pool.get(key) ?? 0) + 1)
  }
  const tail = []
  for (const edge of merged) {
    const key = edgeIdentityOf(edge)
    const left = pool.get(key) ?? 0
    if (left > 0) {
      pool.set(key, left - 1)
      continue
    }
    tail.push(edge)
  }
  return tail
}

/**
 * 合并件里的「片」（`readerSlices`，第 4 个书级键）——**只在盘上真是数组时才带回** `bookLevel`。
 *
 * 票 `reader-cognition-boundary-build/01`：重拼／补图这两处是**手写枚举书级键**的地方；⛔ 不认它
 * ⇒ 一本书只要重拼／补图一次，片就**静默消失**（本仓当病治的那种丢）。
 * ⚠️ 与 `bookLevelEdgeTail` 同一条口径：拼接族给了 `undefined` 会被 `bookLevelProblems` 当
 * 「非数组」点名，那是把「这本书没有片（老书／主笔没产）」误判成坏形状 ⇒ 没给就不带这个键。
 * 形状闸归**生产交工那一跳**（`knowledge-map-assembly.readerSliceProblems`），这里只原样搬运。
 *
 * @param {unknown} merged 盘上那份合并件
 * @returns {unknown[]|undefined}
 */
function bookLevelReaderSlices(merged) {
  return merged !== null && typeof merged === 'object' && Array.isArray(merged.readerSlices) ? merged.readerSlices : undefined
}

/**
 * 一条边的**内容身份**（键序排过 ⇒ 同一个对象经一次落盘／解析、键序不同也判同一条）。
 *
 * ⚠️ 它只回答「**是不是同一条边**」，⛔ 不是「同端点」的签名：`alias`／`see-also` 与被删的 `prereq`
 * 可以端点相同、语义不同（票 `knowledge-graph-edges-build/03` 的裁决，见
 * {@link reduceTransitivePrereqEdges} 的 `kept`）——别拿这个键去删整张表。
 */
function edgeIdentityOf(edge) {
  if (edge === null || typeof edge !== 'object' || Array.isArray(edge)) return `\u0000${typeof edge}:${String(edge)}`
  return `\u0000${JSON.stringify(sortedValue(edge))}`
}

/** 递归按键名排序的浅拷贝（只为了**判等**，⛔ 不拿去落盘）。 */
function sortedValue(value) {
  if (Array.isArray(value)) return value.map(sortedValue)
  if (value === null || typeof value !== 'object') return value
  const out = {}
  for (const key of Object.keys(value).sort()) out[key] = sortedValue(value[key])
  return out
}

/**
 * **重拼**的纯函数（**唯一实现**）：各分片 ＋ 书级键 → 合并件的结构，含**一遍 `difficulty` 归一化**
 * （与交工那一跳同一套；`expectedKnowledgeMap` 之后那一遍）。
 *
 * ⛔ 交工那一跳（`src/workflow/actions/chapters.js`）、补图的落地（{@link planKnowledgeGraphBackfill}）
 * 与本票的重拼入口（{@link planKnowledgeMapRebuild}）都走这一条——别在别处再拼一次。
 *
 * ⚠️ 归一化**只动 `difficulty` 一键**，认不出的值**没收成「无难度」**（`domain-rules` 的口径）；
 * 归一化改了什么**逐条返回**（`normalizedEdits`），⛔ 不静默改写。
 *
 * @param {{shards: ReadonlyArray<{n: number, map: unknown}>, bookLevel: object|undefined, normalize?: boolean}} input
 * @returns {{merged: Record<string, unknown>, normalizedEdits: string[]}}
 */
export function rebuildMergedMapFromShards({ shards, bookLevel, normalize = true }) {
  const merged = expectedKnowledgeMap(shards, bookLevel)
  const normalizedEdits = []
  if (normalize && Array.isArray(merged.knowledgePoints)) {
    const { points, edits } = normalizeKnowledgePointDifficulties(merged.knowledgePoints)
    merged.knowledgePoints = points
    for (const edit of edits) normalizedEdits.push(edit.detail)
  }
  return { merged, normalizedEdits }
}

// ── 计划（纯读；dry-run 与写盘共用同一份结果）────────────────────────────────────

/**
 * 盘上那份合并件读不出来时的那**一句**问题话——两处报错（补图／重拼）共用这一份措辞。
 *
 * ⚠️ 两档必须**分两句说**（本 spec 自己会引入的那条假话就住在这里）：`error` 是解析失败的原话
 * ⇒「不是严格 JSON」；`error` 是 {@link MERGED_MAP_NOT_OBJECT_REASON} ⇒「不是 JSON 对象」。
 * `[]`／`42` 是**合法 JSON**，把它们说成「不是严格 JSON」是假话。⛔ 不许两边都写「不是严格 JSON」。
 *
 * @param {string} error {@link readMergedMap} 的 `error`（调用方已判它不是 `null`）
 * @returns {string}
 */
function mergedMapProblemLine(error) {
  // 「读到的是什么」比 `error` 那半句更清楚：`[]`／`42` 是**合法 JSON**，说它们「不是严格 JSON」是假话。
  return error === MERGED_MAP_NOT_OBJECT_REASON
    ? '盘上那份合并件不是 JSON 对象（读到的是数组、数字、字符串或 null）——那份件要重写'
    : `盘上那份合并件不是严格 JSON：${error}`
}

/**
 * 补图计划：读盘 → 派生卡与边 → 跑闸 → 备好要写的两份文本。**一个字节都不写。**
 *
 * @param {string} projectId
 * @param {{edges?: unknown[], detailTargets?: unknown}} [options] `edges` ＝ 显式草稿（优先于盘上声明）
 * @returns {object} 见文件头与 `## Answer` 里那张「形状约定」表
 */
export function planKnowledgeGraphBackfill(projectId, options = {}) {
  const problems = []
  const inputs = readBookGraphInputs(projectId)
  // ⚠️ **先说真话**：合并件在盘上读不出来时，那句「既没有分片也没有合并件」是假的（件明明在盘上）。
  // 判据顺序改的是「先说哪一句」，**拦不拦一个字不改**（两档都拦，`apply` 见 `problems` 非空即拒）。
  if (inputs.mergedError !== null) {
    if (inputs.mode === 'none') {
      return { projectId, mode: 'none', outcome: MERGED_MAP_OUTCOMES.unchanged, problems: [mergedMapProblemLine(inputs.mergedError)], inputs }
    }
    problems.push(mergedMapProblemLine(inputs.mergedError))
  }
  if (inputs.mode === 'none') {
    return {
      projectId,
      mode: 'none',
      outcome: MERGED_MAP_OUTCOMES.unchanged,
      problems: ['这本书既没有知识地图分片（`工作区/knowledge-map-NN.json`）也没有合并件（`工作区/knowledge-map.json`）——补图没有落点'],
      inputs,
    }
  }
  const meta = inputs.meta
  const converted = convertedTexts(projectId, meta)

  // ── 逐「材料面」拟卡：分片那一档每片一份材料；无片那一档按 `source` 里的材料号归堆 ──
  const surfaces = []
  if (inputs.mode === 'shards') {
    for (const shard of inputs.shards) {
      const map = shard.map ?? {}
      const material = Number.isSafeInteger(map?.materials?.[0]?.num) ? map.materials[0].num : shard.n
      surfaces.push({
        n: shard.n,
        material,
        points: Array.isArray(map.knowledgePoints) ? map.knowledgePoints : [],
        sections: Array.isArray(map?.materials?.[0]?.sections) ? map.materials[0].sections : [],
        map,
        path: shard.path,
      })
    }
  } else {
    const points = Array.isArray(inputs.merged?.knowledgePoints) ? inputs.merged.knowledgePoints : []
    const materials = Array.isArray(inputs.merged?.materials) ? inputs.merged.materials : []
    const fallback = materials.length === 1 && Number.isSafeInteger(materials[0]?.num) ? materials[0].num : 1
    const buckets = new Map()
    points.forEach((point, at) => {
      const parsed = splitSource(point?.source)
      const material = parsed.material ?? fallback
      if (!buckets.has(material)) buckets.set(material, [])
      buckets.get(material).push({ point, at })
    })
    for (const [material, rows] of [...buckets.entries()].sort((a, b) => a[0] - b[0])) {
      const materialRow = materials.find((m) => m?.num === material) ?? null
      surfaces.push({
        n: material,
        material,
        points: rows.map((row) => row.point),
        sections: Array.isArray(materialRow?.sections) ? materialRow.sections : [],
        map: null,
        path: null,
      })
    }
  }

  // ── 卡：一条知识点一张，`name` 逐字抄 `title`；`key` 三段＝材料号／片内组／组内序号 ──
  const cards = []
  const cardsBySurface = new Map()
  const testableFrom = { detail: 0, summary: 0, section: 0, none: 0 }
  const anchorKinds = {}
  const unresolved = []
  for (const surface of surfaces) {
    const convertedRow = converted.get(surface.material) ?? null
    const index = convertedRow !== null && convertedRow.text !== null ? headingIndex(convertedRow.text) : null
    if (index === null) {
      problems.push(`材料 ${surface.material} 的转换稿不在盘上（合并件的 materials[].file 与 meta.sources[].md 都指不上）：${convertedRow?.path ?? '（meta.sources 里没有这一份）'}——锚取不到`)
    }
    const detail = inputs.mode === 'shards' ? detailText(projectId, surface.n) : { path: null, text: null }
    const detailEntries = detail.text === null ? [] : parseDetailEntries(detail.text)
    const groups = new Map()
    const groupCounters = new Map()
    const surfaceCards = []
    surface.points.forEach((point, at) => {
      const title = point?.title
      if (typeof title !== 'string' || title === '') {
        problems.push(`材料 ${surface.material} 的第 ${at + 1} 条知识点没有非空 title——1:1 派生不出卡`)
        return
      }
      const parsed = splitSource(point?.source)
      const ordinals = sectionOrdinals(parsed.tail)
      const section = ordinals.length > 0 && Number.isSafeInteger(ordinals[0]) ? surface.sections[ordinals[0] - 1] ?? null : null
      // `testable`：知识点摘要 → 细目条目余段 → 该小节摘要（来路逐条计数；级联顺序的理由见 `testableOf`）
      const detailEntry = detailEntries.find((entry) => {
        const normTitle = normText(title)
        return normTitle !== '' && normText(entry.text).includes(normTitle)
      }) ?? null
      const testable = testableOf(point, detailEntry, section)
      testableFrom[testable.from] += 1
      // 锚：定点回转换稿取行段（按小节名找标题行；候选里也带上细目括注的小节名）
      let anchor = null
      let anchorKind = 'unresolved'
      let sectionText = null
      if (index !== null) {
        const candidates = [
          { text: parsed.tail, kind: 'source' },
          ...parsed.tail.split(/[；;]/u).map((part) => ({ text: part.trim(), kind: 'source-part' })),
          ...(detailEntry?.quoted ?? []).map((text) => ({ text, kind: 'detail-section' })),
        ]
        if (section !== null && typeof section.title === 'string') candidates.push({ text: section.title, kind: 'material-section' })
        const hit = matchHeading(index, candidates.filter((row) => row.text !== '')) ?? matchByCodeOrOrdinal(index, parsed.tail)
        if (hit !== null) {
          anchor = [{ start: index.headings[hit.at].line, end: sectionRange(index, hit.at) }]
          anchorKind = hit.kind
          sectionText = index.headings[hit.at].text
        }
      }
      anchorKinds[anchorKind] = (anchorKinds[anchorKind] ?? 0) + 1
      // ── **片内组** ＝ 这条知识点落在哪一个**小节**（spec §3：分片「只知道本材料与小节」）──
      // 组键取**小节标题的归一形**（⛔ 不取行号：材料重转一次行号就漂，键会跟着漂）；取不到锚时
      // 退回 `source` 逐字。组号按组在片内**首次出现**的次序。
      const groupKey = sectionText !== null
        ? `§${normText(sectionText)}`
        : (typeof point?.source === 'string' && point.source.trim() !== '' ? point.source : `（无 source 第 ${at + 1} 条）`)
      if (!groups.has(groupKey)) groups.set(groupKey, groups.size + 1)
      const group = groups.get(groupKey)
      const seq = (groupCounters.get(group) ?? 0) + 1
      groupCounters.set(group, seq)
      const key = knowledgeCardKey({ material: surface.material, group, index: seq })
      if (testable.value === '') {
        problems.push(`卡 ${key}（知识点「${title}」）取不到一句可判的话：细目没有这一条、knowledgePoints[].summary 与该小节的 summary 都是空的——本模块不编一句（票 05 让精读产卡时才有这一格）`)
      }
      if (anchor === null) {
        unresolved.push({ key, title })
        problems.push(`卡 ${key}（知识点「${title}」）的锚取不到：按小节名「${String(point?.source ?? '')}」在转换稿里找不到标题行——⛔ 本模块不用兜底区间糊过去（锚要能判到区间）`)
      }
      const card = {
        key,
        name: title,
        testable: testable.value,
        anchor: anchor ?? [],
        // `difficulty` 逐字搬（盘上已有）；没写就不带这一个键（「无难度」是合法形状）
        ...(typeof point?.difficulty === 'string' && point.difficulty !== '' ? { difficulty: point.difficulty } : {}),
        confidence: BACKFILL_CARD_CONFIDENCE,
      }
      cards.push(card)
      surfaceCards.push(card)
    })
    cardsBySurface.set(surface.material, surfaceCards)
  }

  // ── 边：显式草稿 → 分片声明（＋合并件的书级那一段）→ 合并件已声明 → 空表 ──
  const declaredShardEdges = inputs.shards.flatMap((shard) => (Array.isArray(shard.map?.edges) ? shard.map.edges : []))
  const mergedEdges = Array.isArray(inputs.merged?.edges) ? inputs.merged.edges : []
  let edges = []
  let edgeSource = 'empty'
  if (Array.isArray(options.edges)) {
    edges = options.edges
    edgeSource = 'explicit'
  } else if (inputs.mode === 'shards') {
    // 书级那一段只活在合并件里 ⇒ 用**集合差**把它捡回来（口径只此一处：`bookLevelEdgeTail`）
    const tail = bookLevelEdgeTail(inputs.shards, mergedEdges)
    edges = [...declaredShardEdges, ...tail]
    edgeSource = declaredShardEdges.length > 0 ? 'shards' : (tail.length > 0 ? 'merged-book-level' : 'empty')
  } else if (mergedEdges.length > 0) {
    edges = mergedEdges
    edgeSource = 'merged'
  }

  // ── 落点：**两档显式分家**（票 04 的主 deliverable）——有分片 ⇒ 补进各分片 ＋ 机器重拼；
  //    没有分片 ⇒ **直接补进合并件**（payload 逐字不变）。档由 `landingTierOfInputs` 一处判。
  const landing = landingTierOfInputs(inputs)
  const materialOfKey = (key) => {
    const hit = /^M(\d+)-/u.exec(String(key ?? ''))
    return hit === null ? null : Number(hit[1])
  }
  /**
   * 由**一张边表**排出这一档的落点：候选合并件 ＋ 各片要写的文本 ＋ 闸要看的各片。
   *
   * ⚠️ 它被调**两次**，这是**顺序契约**的落点（票 `knowledge-graph-edges-build/05`，spec 落地清单
   * 第 8／9 条）：第一次喂**AI 声明的那一份**（闸判它），第二次喂**约简后的那一份**（写盘写它）。
   * 两档落点的排版只此一处，⛔ 别为了「只在写盘那一支加约简」而在这里开参数。
   *
   * @param {unknown[]} edgeTable
   */
  const landEdges = (edgeTable) => {
    const shardWrites = []
    let candidate = null
    let mergedWrite = null
    let normalizedEdits = []
    let gateShards = []
    if (landing.mode === LANDING_MODES.shards) {
      const nextShards = surfaces.map((surface) => {
        const own = edgeTable.filter((edge) => (
          edge !== null && typeof edge === 'object'
          && materialOfKey(edge.from) === surface.material && materialOfKey(edge.to) === surface.material
        ))
        const nextMap = { ...surface.map, cards: cardsBySurface.get(surface.material) ?? [], edges: own }
        return { surface, nextMap }
      })
      const crossEdges = edgeTable.filter((edge) => !(edge !== null && typeof edge === 'object'
        && materialOfKey(edge.from) === materialOfKey(edge.to)))
      const bookSlices = bookLevelReaderSlices(inputs.merged)
      const bookLevel = {
        teachingFocus: inputs.merged?.teachingFocus,
        chapterSuggestion: inputs.merged?.chapterSuggestion,
        edges: crossEdges,
        // 票 `reader-cognition-boundary-build/01`：片（第 4 个书级键）也要原样带回去——
        // 补图这一次是**重拼**（`rebuildMergedMapFromShards`），不认它就会静默丢。
        ...(bookSlices === undefined ? {} : { readerSlices: bookSlices }),
      }
      // 机器重拼走**唯一那一份**实现（`rebuildMergedMapFromShards`：拼装 ＋ 一遍 difficulty 归一化）
      const rebuilt = rebuildMergedMapFromShards({
        shards: nextShards.map(({ surface, nextMap }) => ({ n: surface.n, map: nextMap })),
        bookLevel,
      })
      candidate = rebuilt.merged
      normalizedEdits = rebuilt.normalizedEdits
      for (const { surface, nextMap } of nextShards) {
        shardWrites.push({
          n: surface.n,
          path: surface.path,
          text: renderKnowledgeMap(nextMap),
          roundTripEqual: renderKnowledgeMap(surface.map) === inputs.shardFiles.find((s) => s.n === surface.n)?.text,
        })
      }
      mergedWrite = { path: inputs.mergedPath, text: renderKnowledgeMap(candidate), recreated: inputs.mergedText === null }
      // 闸要看的各片 ＝ 这一趟真的要写的那几张（同一份 `nextMap`，⛔ 不另拼一份可能分叉的）
      gateShards = nextShards.map(({ surface, nextMap }) => ({ n: surface.n, map: nextMap }))
    } else {
      // 无片那一档：**直接补进合并件**。payload 逐字不变 —— 只有 `cards`／`edges` 两个新键，
      // ⛔ 不顺手把盘上那份过一遍 difficulty 归一化（那会改写一本已交付的老书；归一化的读数只在
      //    重拼对账里出，见 `planKnowledgeMapRebuild`）。
      candidate = { ...(inputs.merged ?? {}), cards, edges: edgeTable }
      mergedWrite = { path: inputs.mergedPath, text: renderKnowledgeMap(candidate), recreated: false }
    }
    return { candidate, normalizedEdits, shardWrites, mergedWrite, gateShards }
  }

  // ── 次序编排：**唯一入口**（票 `graph-write-order/03`）────────────────────────────
  // 闸 → 约简 → 渲染 → 写由 `knowledge-map-landing.js` 一处排；本函数仍**纯读**（计划面），
  // `--dry-run` 与真写共用这一份结果（本文件 `:826` 那条不变量）。
  // 闸吃的是**声明的那一份**（`layout` 的第一次调用）：约简会先把「有 ≥2 步替代路径」的冗余
  // `prereq` 删掉，先约简再判 ⇒ `edge-duplicate` 判的是一张已经被擦干净的边表（判据声称的强度 ≠
  // 实现的强度）。
  const hasGraphKeys = carriesGraphKeys(inputs.merged) || inputs.shards.some((shard) => carriesGraphKeys(shard.map))
  const landingPlan = planMergedMapLanding({
    kind: 'backfill',
    projectId,
    edges,
    layout: (edgeTable) => landEdges(edgeTable),
    target: { path: inputs.mergedPath },
    refusal: problems.length > 0 ? [...problems] : null,
    hasGraphKeys,
  })
  const writtenLayout = landingPlan.layout
  const gate = landingPlan.gate === MERGED_MAP_GATE_NOT_RUN ? null : landingPlan.gate
  const reduced = landingPlan.reduced ?? { edges, removed: [], problems: [], skipped: false }
  if (reduced.problems.length > 0) problems.push(...reduced.problems)
  edges = reduced.edges

  // 读数按**落盘的那一份**报（`plan.edges.length` 与 `edgeScanText` 被同一句 hint／同一条 `meta` 念
  // 出来，两处必须是同一张表）：这一次的 `readings.edgeScan` 是**落盘那一份**的扫面读数；**这一次的
  // `problems` 有意丢弃**——闸已经判过「**声明的那一份**」（`layout` 的第一次调用，留在 `gate` 上），
  // `edge-duplicate` 的真实性正靠那个先后（先过闸、后约简）；对落盘那一份再判一遍只会把「约简自己报的
  // 软读数」混进来。票 `knowledge-graph-edges-build/06` 的告知面读 `plan.edgeScanText` 与
  // `plan.edges.length`——它们必须是同一张表的读数。
  const scan = reduced.removed.length > 0 && writtenLayout !== null
    ? knowledgeMapGateProblems({ merged: writtenLayout.candidate, shards: writtenLayout.gateShards }).readings.edgeScan
    : (gate?.readings?.edgeScan ?? null)
  return {
    projectId,
    mode: inputs.mode,
    // 两档落点：档名 ＋ **凭什么**走这一档（票 12 的界面提示直接吃这句人话）
    landing,
    normalizedEdits: writtenLayout.normalizedEdits,
    workRel: inputs.workPath,
    mergedRel: inputs.mergedRel,
    mergedPath: inputs.mergedPath,
    mergedExisted: inputs.mergedText !== null,
    // 写盘前的那一份（**读物自证**要拿它做 payload 逐字对账；⛔ 不留一份多余的备份在用户书里）
    // ⚠️ 无片那一档盘上**没有分片** ⇒ `before.shards` 是空数组（别把「按材料号归堆」出来的
    //    那几个面当成盘上文件，那会让自证去报「某某分片不见了」这种假话）。
    before: {
      merged: inputs.merged,
      shards: inputs.mode === 'shards' ? surfaces.map((surface) => ({ n: surface.n, map: surface.map })) : [],
    },
    shards: surfaces.map((surface) => ({ n: surface.n, material: surface.material, points: surface.points.length, path: surface.path })),
    cards,
    cardsBySurface,
    edges,
    edgeSource,
    reduced,
    testableFrom,
    anchorKinds,
    unresolved,
    zeroEdgeReading: edges.length === 0 ? edgeScanText(scan) : null,
    edgeScanText: edgeScanText(scan),
    gate,
    // 票 `graph-write-order/03`：落盘计划（`applyKnowledgeGraphBackfill` 直接拿它写）＋ 结局名。
    // ⛔ 别在 apply 里另排一遍「写什么」——写面只认这一份计划。
    landingPlan,
    outcome: landingPlan.outcome,
    // 落点文本是**约简后**那一份（`writtenLayout`）：闸判的是**声明的那一份**，写盘写的是这一份。
    candidate: writtenLayout.candidate,
    shardWrites: writtenLayout.shardWrites,
    mergedWrite: writtenLayout.mergedWrite,
    problems,
  }
}

/**
 * **显式的重拼入口**（票 04 定的名字与调用面）：由**盘上各分片** ＋ 书级键（＋ 书级边那一段）
 * 把合并件重拼一遍——**纯读，一个字节都不写**（要写走 {@link applyKnowledgeMapRebuild}）。
 *
 * 重拼面（口径只此一处）：
 * - **有分片的书**：`rebuilt` ＝ 各片 ＋ 书级键（含第 4 个键「片」）＋ 书级边那一段（{@link bookLevelEdgeTail} 切回来）
 *   ＋ **一遍 `difficulty` 归一化**（{@link rebuildMergedMapFromShards}）；`equal` ＝ 它与盘上那份
 *   **逐字相等**（相等 ⇒ 重拼幂等）。
 * - **没有分片的书**：没有分片可拼 ⇒ **不重拼**（`source: 'none'`），只给两条读数：
 *   ① `identityEqual`（同一个渲染器再渲染一遍是否逐字相同）② `difficultyNorm`（归一化会改什么）
 *   ——后者正是「盘上那份本来就不是这个渲染器＋归一化的产物」这个分辨点（spec §10：不相等就把
 *   差异摆出来，⛔ 不抹平）。
 *
 * @param {string} projectId
 * @returns {object} 见票面 `## Answer` 的「形状约定」那张表
 */
export function planKnowledgeMapRebuild(projectId) {
  const inputs = readBookGraphInputs(projectId)
  const landing = landingTierOfInputs(inputs)
  const diskText = inputs.mergedText
  const diskFingerprint = diskText === null ? null : outputFingerprint(diskText)
  const base = {
    projectId,
    mode: inputs.mode,
    landing,
    mergedPath: inputs.mergedPath,
    diskText,
    diskFingerprint,
    shards: inputs.shards.map((shard) => ({ n: shard.n, path: shard.path, fingerprint: shard.text === null ? null : outputFingerprint(shard.text) })),
    bookLevelEdges: 0,
    rebuiltText: null,
    rebuiltFingerprint: null,
    identityText: null,
    identityEqual: null,
    equal: null,
    differences: [],
    normalizedEdits: [],
    difficultyNorm: { edits: [], wouldChange: false },
    problems: [],
    // 票 `graph-write-order/04`：重拼那一档的「闸没跑」由 module **具名**说出来（⛔ 不靠少写一行暗示）。
    outcome: null,
    gate: MERGED_MAP_GATE_NOT_RUN,
    // ⚠️ 这一句只用于**连盘上字节都没有**的早期返回；valid 重拼的理由由 module 的 `REBUILD_GATE_NOTE`
    //    一处给出（⛔ 别把「输入是盘上已经落过的字节」那句话抄到这一档——这里根本没有那些字节）。
    gateNote: '重拼没有可重拼的字节（计划阶段就拒）——闸没有跑',
    landingPlan: null,
  }
  if (landing.mode === LANDING_MODES.none) {
    return { ...base, source: 'none', outcome: MERGED_MAP_OUTCOMES.unchanged, problems: ['这本书既没有知识地图分片、也没有合并件——没有可重拼的东西'] }
  }
  // ⚠️ 窄出口把 `[]`／`42` 折成 `merged === null` 之后这一支才走得到它们（今天走不到）——
  // 所以这句文案必须按 `error` 分两句说：`[]` 是**合法 JSON**，说它「不是严格 JSON」是假话。
  // **拦不拦一个字不改**（两档都拦，`applyKnowledgeMapRebuild` 见 `problems` 非空即一个字节不写）。
  if (inputs.mergedError !== null || inputs.merged === null) {
    return { ...base, source: 'none', outcome: MERGED_MAP_OUTCOMES.unchanged, problems: [mergedMapProblemLine(inputs.mergedError ?? '读不出来')] }
  }
  // 恒等再渲染：⛔ 不带归一化（归一化那一条另算读数，见上）
  const identityText = renderKnowledgeMap(inputs.merged)
  base.identityText = identityText
  base.identityEqual = identityText === diskText
  if (landing.mode === LANDING_MODES.mergedOnly) {
    // 这一档没有分片 ⇒ 重拼**不是一个动作**；只出读数（⛔ 不写盘、⛔ 不顺手改这份老书）
    const { points, edits } = normalizeKnowledgePointDifficulties(
      Array.isArray(inputs.merged.knowledgePoints) ? inputs.merged.knowledgePoints : [],
    )
    const normalizedMap = { ...inputs.merged, knowledgePoints: points }
    // ⚠️ 约简与「有分片那一档」**同一份**、**同一处**做（票 `graph-write-order/04` 起由统一入口做）：
    //    两条分支都过，`equal` 才是同一件事对同一件事。无分片这一档**不写盘**（`write: false`），
    //    只出「恒等再渲染 ＋ 归一化会改什么」两条读数。
    const landingPlan = planMergedMapLanding({
      kind: 'rebuild',
      projectId,
      merged: normalizedMap,
      edges: Array.isArray(normalizedMap.edges) ? normalizedMap.edges : [],
      target: { path: inputs.mergedPath },
      write: false,
    })
    const rebuiltText = landingPlan.text
    const equal = diskText !== null && rebuiltText === diskText
    return {
      ...base,
      source: 'none',
      outcome: landingPlan.outcome,
      gate: landingPlan.gate,
      gateNote: landingPlan.gateNote,
      landingPlan,
      // ⚠️ **强度如实**：约简自己的 `problems`（今天只可能来自「认不出的 `kind`」）在这里被当**硬拒**——
      // `applyKnowledgeMapRebuild` 见 `problems` 非空即 `ok:false`、一个字节都不写。这是**强度升级**：
      // 约简本身把这类问题收成**软读数**返回、⛔ 不抛（`reduceTransitivePrereqEdges` 的 `problems`／`skipped`），
      // 而重拼这一路此前根本不看边表。票 `knowledge-graph-edges-build/05` 的 `## Answer` 偏离 2 已登记，
      // ⛔ 别在别处另写一份。
      problems: landingPlan.problems,
      rebuiltText,
      rebuiltFingerprint: outputFingerprint(rebuiltText),
      equal,
      differences: equal || diskText === null ? [] : mapTextDifferences(diskText, rebuiltText),
      normalizedEdits: edits.map((edit) => edit.detail),
      difficultyNorm: { edits: edits.map((edit) => edit.detail), wouldChange: edits.length > 0 },
    }
  }
  // 有分片那一档：真的重拼
  const tail = Array.isArray(inputs.merged.edges) ? bookLevelEdgeTail(inputs.shards, inputs.merged.edges) : undefined
  const slices = bookLevelReaderSlices(inputs.merged)
  const bookLevel = {
    teachingFocus: inputs.merged.teachingFocus,
    chapterSuggestion: inputs.merged.chapterSuggestion,
    // ⚠️ 书级那一段**只在盘上真有**时才进 `bookLevel`：拼接族给了 `undefined` 会被 `bookLevelProblems`
    //    当成「非数组」点名（票 01 的口径），那是把「盘上没有边的书」误判成坏形状。
    ...(tail === undefined ? {} : { edges: tail }),
    // 票 `reader-cognition-boundary-build/01`：片（第 4 个书级键）同一条「真有才带」口径——
    // 重拼不认它，一本书只要重拼一次片就静默消失。
    ...(slices === undefined ? {} : { readerSlices: slices }),
  }
  let rebuilt = null
  try {
    rebuilt = rebuildMergedMapFromShards({
      shards: inputs.shards.map((shard) => ({ n: shard.n, map: shard.map })),
      bookLevel,
    })
  } catch (error) {
    return { ...base, source: 'shards', outcome: MERGED_MAP_OUTCOMES.unchanged, problems: [`重拼拼不起来：${error.message}`] }
  }
  // ⚠️ 约简在**重拼之后、渲染之前**（票 `graph-write-order/04` 起由统一入口做）：重拼出来的是「各分片
  //    声明的那一份 ＋ 书级那一段」，而盘上那份是**约简后**的 ⇒ 这一遍必须做，`equal` 才不是恒红。
  const landingPlan = planMergedMapLanding({
    kind: 'rebuild',
    projectId,
    merged: rebuilt.merged,
    edges: Array.isArray(rebuilt.merged.edges) ? rebuilt.merged.edges : [],
    target: { path: inputs.mergedPath },
  })
  const rebuiltText = landingPlan.text
  const equal = diskText !== null && rebuiltText === diskText
  return {
    ...base,
    source: 'shards',
    bookLevelEdges: tail?.length ?? 0,
    outcome: landingPlan.outcome,
    gate: landingPlan.gate,
    gateNote: landingPlan.gateNote,
    landingPlan,
    // ⚠️ **同一句强度如实**（⛔ 别在别处另写一份）：`problems` 非空 ⇒ `applyKnowledgeMapRebuild` 判
    // `ok:false`、一个字节都不写——约简自己只把「认不出的 `kind`」收成软读数返回（不抛），这一档把
    // 它当**硬拒**。登记在票 `knowledge-graph-edges-build/05` 的 `## Answer` 偏离 2。
    problems: landingPlan.problems,
    rebuiltText,
    rebuiltFingerprint: outputFingerprint(rebuiltText),
    equal,
    differences: equal || diskText === null ? [] : mapTextDifferences(diskText, rebuiltText),
    normalizedEdits: rebuilt.normalizedEdits,
    difficultyNorm: { edits: rebuilt.normalizedEdits, wouldChange: rebuilt.normalizedEdits.length > 0 },
  }
}

/**
 * 真重拼（**写盘**）：把 {@link planKnowledgeMapRebuild} 那一份写回合并件。
 *
 * **同输入同输出**：连跑两次 ⇒ 两次的 `after` 指纹逐字相同（票 04 完成判据第 3 条）。
 * - **有分片的书**：写盘；`bytesBefore/bytesAfter` 与两个指纹逐条返回（票 12 的读数吃它）。
 * - **没有分片的书**：**不写盘**（没有分片可拼——这一档的合并件是**直接补**上去的，
 *   重拼不是一个动作）；返回 `written: false` 与恒等/归一化两条读数。
 *
 * ⛔ 本入口**不落 `meta`、不记账本事件**：它不是「补图」（图没变），写进去就是一条假历史。
 *
 * @param {string} projectId
 * @returns {{ok: boolean, written: boolean, reason: string, plan: object, before: object|null, after: object|null}}
 */
export function applyKnowledgeMapRebuild(projectId) {
  const plan = planKnowledgeMapRebuild(projectId)
  const gateFields = { outcome: plan.outcome, gate: plan.gate, gateNote: plan.gateNote }
  if (plan.problems.length > 0) {
    return { ...gateFields, ok: false, written: false, reason: '计划阶段没过 ⇒ 一个字节都没写', problems: plan.problems, plan, before: plan.diskFingerprint, after: plan.diskFingerprint }
  }
  if (plan.landing.mode !== LANDING_MODES.shards) {
    return {
      ...gateFields,
      ok: true,
      written: false,
      reason: '这一档没有分片可拼（合并件是**直接补**上去的，重拼不是一个动作）；只出读数：' + (plan.identityEqual === true ? '恒等再渲染逐字相同' : '恒等再渲染逐字不同') + (plan.difficultyNorm.wouldChange ? `；归一化会改 ${plan.difficultyNorm.edits.length} 处` : '；归一化不改任何一处'),
      plan,
      before: plan.diskFingerprint,
      after: plan.diskFingerprint,
    }
  }
  // 票 `graph-write-order/04`：写面只认计划面那一份（重拼不过闸这件事已在 `gateNote` 里具名）。
  // ⚠️ 放在两道「不写」的守卫**之后**：`problems` 非空或没有分片时，一个字节都不写、也不碰写面。
  const applied = plan.landingPlan === null ? null : applyMergedMapLanding(plan.landingPlan)
  const before = plan.diskFingerprint
  const after = outputFingerprint(plan.rebuiltText)
  return {
    ...gateFields,
    ok: true,
    written: applied !== null && applied.written.length > 0,
    reason: `由第 ${plan.landing.shardNumbers.join('、')} 路分片重拼了合并件（含一遍 difficulty 归一化）`,
    plan,
    before,
    after,
    equalBeforeAfter: before !== null && before.sha256 === after.sha256,
  }
}

/** 一份合并件／分片里有没有图键（`cards`／`edges` 任一个在）。 */
function carriesGraphKeys(map) {
  return map !== null && typeof map === 'object' && !Array.isArray(map)
    && (Object.hasOwn(map, 'cards') || Object.hasOwn(map, 'edges'))
}

/**
 * **撤回两个图键**（spec §10 的「失败＝图不落地」那一半，与交工那一跳同一先例）：
 * 把 `cards`／`edges` 从**盘上带着它们的那几份件**里去掉、用**同一个渲染器**写回；
 * ⛔ **没有图键的件一个字节都不碰**（连重排都不做——「回到补图前的样子」是**逐字**的要求，
 * 而老书那份件可能不是这台渲染器排的版）。
 *
 * ⚠️ 两处照实记：
 * ① **撤回不区分那两个键是谁写的**——老书补图前盘上本来没有它们；分片那一档本模块的落地本来就会
 *   重写各片里的卡与边（`nextMap = { ...map, cards, edges }`）⇒ 撤回到「payload-only」是同一口径
 *   的收尾（交工那一跳今天就是这么做的）。⛔ 它**不碰**章产物（`chapter-NN.md`／`book.md`／
 *   `explore.md`）——那两个键是它唯一动的东西。
 * ② `meta` 里**只有本来就有补图记录**时才追加一笔撤回（`withdrawnAt`／`withdrawnReason`）；
 *   ⛔ 不许凭空造一条「这份图是补的」——那是假话。下游读「图在不在」一律看**合并件里有没有那两个键**，
 *   ⛔ 不要只看 `meta`（`withdrawnAt` 在场＝那份被补过的图已经撤回了）。
 *
 * @param {string} projectId
 * @param {{ledger?: {updateMeta: Function}|null, reason?: string, now?: number}} [options]
 * @returns {{withdrawn: boolean, reason: string, mode: string, files: object[], untouched: string[]}}
 */
export function withdrawKnowledgeGraphKeys(projectId, { ledger = null, reason = 'gate', now = Date.now() } = {}) {
  const inputs = readBookGraphInputs(projectId)
  const candidates = []
  if (carriesGraphKeys(inputs.merged)) candidates.push({ kind: 'merged', n: null, path: inputs.mergedPath, text: inputs.mergedText, map: inputs.merged })
  for (const shard of inputs.shards) {
    if (carriesGraphKeys(shard.map)) candidates.push({ kind: 'shard', n: shard.n, path: shard.path, text: shard.text, map: shard.map })
  }
  const untouched = []
  if (carriesGraphKeys(inputs.merged)) { /* 已在 candidates 里 */ } else if (inputs.mergedText !== null) untouched.push(inputs.mergedPath)
  for (const shard of inputs.shards) if (!carriesGraphKeys(shard.map)) untouched.push(shard.path)

  const files = []
  for (const target of candidates) {
    const stripped = ['cards', 'edges'].filter((key) => Object.hasOwn(target.map, key))
    const payloadOnly = { ...target.map }
    for (const key of stripped) delete payloadOnly[key]
    const text = renderKnowledgeMap(payloadOnly)
    writeFileSync(target.path, text, 'utf8')
    files.push({
      kind: target.kind,
      n: target.n,
      path: target.path,
      stripped,
      before: outputFingerprint(target.text),
      after: outputFingerprint(text),
    })
  }
  // meta：只有**本来就有**补图记录时才追加一笔撤回（⛔ 不凭空造「图是补的」）
  const ledgerOk = ledger !== null && typeof ledger === 'object' && typeof ledger.updateMeta === 'function'
  const metaHasRecord = inputs.meta !== null && typeof inputs.meta === 'object'
    && inputs.meta[GRAPH_BACKFILL_META_KEY] !== null && inputs.meta[GRAPH_BACKFILL_META_KEY] !== undefined
  if (ledgerOk && metaHasRecord) {
    ledger.updateMeta(projectId, (state) => {
      const previous = state[GRAPH_BACKFILL_META_KEY]
      if (previous === null || previous === undefined) return
      state[GRAPH_BACKFILL_META_KEY] = { ...previous, withdrawnAt: now, withdrawnReason: reason, withdrawnFiles: files.length }
    })
  }
  return {
    withdrawn: files.length > 0,
    reason: files.length > 0
      ? `撤回了 ${files.length} 份件里的图键（${files.map((file) => file.path).join('、')}）`
      : '盘上没有任何图键——撤回无事可做（一个字节都没写）',
    mode: inputs.mode,
    files,
    untouched,
  }
}

/**
 * 重拼对账（spec §10）：用手上这套重拼把**盘上那份**重算一遍。
 *
 * ⚠️ 本函数是 {@link planKnowledgeMapRebuild} 的**旧签名外壳**（票 02／03 的调用点与 CLI 的
 * `--reconcile` 都在用）——口径只有一份，⛔ 别在这里再实现一遍重拼。
 *
 * @param {string} projectId
 * @returns {{mode: string, diskText: string|null, rebuiltText: string|null, equal: boolean|null, differences: string[], difficultyNorm: {edits: string[], wouldChange: boolean}}}
 */
export function reconcileKnowledgeMapRebuild(projectId) {
  const plan = planKnowledgeMapRebuild(projectId)
  // 没有可对账的东西（既没分片也没合并件／合并件读不出来）：那是**问题**，不是差异清单
  const nothingToCompare = plan.diskText === null && plan.problems.length > 0
  return {
    mode: plan.mode,
    diskText: plan.diskText,
    rebuiltText: plan.rebuiltText,
    equal: nothingToCompare ? null : plan.equal,
    differences: plan.problems.length > 0 ? [...plan.problems, ...plan.differences] : plan.differences,
    difficultyNorm: plan.difficultyNorm,
    fingerprint: { disk: plan.diskFingerprint, rebuilt: plan.rebuiltFingerprint },
  }
}

/** 两份合并件全文的差异清单（**逐键摆出来**，⛔ 不抹平）。 */
function mapTextDifferences(diskText, rebuiltText) {
  const out = []
  let disk = null
  let rebuilt = null
  try { disk = JSON.parse(String(diskText)) } catch { /* 下面按「解析不了」报 */ }
  try { rebuilt = rebuiltText === null ? null : JSON.parse(rebuiltText) } catch { /* 同上 */ }
  if (disk === null || rebuilt === null) {
    out.push('两份里至少一份解析不了，只报「不相等」（`equal: false`）')
    return out
  }
  const keys = [...new Set([...Object.keys(disk), ...Object.keys(rebuilt)])]
  for (const key of keys) {
    if (!Object.hasOwn(disk, key)) { out.push(`重拼多出键「${key}」`); continue }
    if (!Object.hasOwn(rebuilt, key)) { out.push(`重拼少了键「${key}」（盘上有）`); continue }
    const a = disk[key]
    const b = rebuilt[key]
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) out.push(`「${key}」条数：盘上 ${a.length} → 重拼 ${b.length}`)
      const limit = Math.max(a.length, b.length)
      for (let i = 0; i < limit; i += 1) {
        const left = JSON.stringify(a[i])
        const right = JSON.stringify(b[i])
        if (left === right) continue
        const label = (row) => (row !== null && typeof row === 'object' ? (row.title ?? row.key ?? row.id ?? '') : '')
        out.push(`「${key}」第 ${i + 1} 条不同：盘上 ${label(a[i])}${left === undefined ? '（无）' : ''} ${JSON.stringify(left)} → 重拼 ${label(b[i])} ${JSON.stringify(right)}`)
      }
      continue
    }
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      out.push(`「${key}」：盘上 ${JSON.stringify(a)?.slice(0, 120)} → 重拼 ${JSON.stringify(b)?.slice(0, 120)}`)
    }
  }
  return out
}

/**
 * 「传递约简删了几条」那句告知——**唯一措辞出处**（票 `knowledge-graph-edges-build/06`）。
 *
 * ⚠️ 两条路径共用**这一处**的字：**交工那一跳**（`src/workflow/actions/chapters.js` 的 `graphGate` 之后）
 * 与**补图那档**（下面的 {@link backfillHintText}）。⛔ **不许**在别处再写一句「机器改了什么」的措辞
 * ——照 `difficultyEdits` 那套先例，全仓只有一套呈现（`.scratch/knowledge-graph-build/map.md` §11 红②：
 * 措辞抽成函数、锚点才认得住那一处调用）。
 * ⚠️ **只给条数、不给是哪几条**（spec §6 记着的那条债的一半：约简按表序删，且删掉时连同那条边的
 * `reason` 与把握档一起消失）——本行如实留着这个窄处，⛔ 不在这里编一份「是哪几条」的清单。
 * ⚠️ `removed` 是 `reduceTransitivePrereqEdges(...).removed`（`[{from,to}]`）；非数组按 0 条读，
 * ⛔ 不抛（这条路的调用方都在「已经量过关」的位置上）。
 *
 * @param {unknown} removed 被删的那几条（只数条数）
 * @returns {string}
 */
export function reducedPrereqHintText(removed) {
  const n = Array.isArray(removed) ? removed.length : 0
  return `🧭 机器做了一遍传递约简，删掉了 ${n} 条冗余直接边（已有 ≥2 步前置路径的 prereq）——落盘的那份边表里没有它们。`
}

/**
 * 补图那一条留痕的人话（**唯一措辞出处**）。
 *
 * ⚠️ 单独抽出来不是洁癖：账本那一族的元检查（`docs/协作模型.md` §2.8 表 B）按**调用点原文片段**
 * 登记落账点，而泛锚点（`appendEvent(projectId, 'textbook/hint', {` 这种**一行认一堆调用**的写法）
 * 会把新加的同类调用顺手吞掉 ⇒ 每一处新落账点都得有一个**只认它自己**的锚点。
 * 这一处传的是函数名、锚点里不带反引号（模板串的反引号会把 markdown 单元格截断）。
 *
 * ⚠️ 这句是**机器语**：票 12 的界面抬头另有一句人话（spec §10「按已有细目＋回原文补出来的」），
 * 两处别混——这里说的是账本里那一笔。
 *
 * ⚠️ 票 `knowledge-graph-edges-build/06`：约简**真的动过**时，末尾接上 {@link reducedPrereqHintText}
 * ——与交工那一跳**逐字同一句**（「机器改了什么」只有一套呈现）。删 0 条时**一个字都不接**
 * （⛔ 不刷噪声：那时候「没删」是常态，说一句反而让人以为动过）。
 *
 * @param {object} plan `planKnowledgeGraphBackfill` 的结果
 * @param {string} where 落点的人话（哪几片 ＋ 合并件／只有合并件）
 * @returns {string}
 */
function backfillHintText(plan, where) {
  const base = `🧭 这本老书补上了知识点图（按已有细目／摘要 ＋ 回转换稿取的行段锚）：卡 ${plan.cards.length} 张、边 ${plan.edges.length} 条，落在${where}。${plan.edgeScanText}。已写／已交付的章一个字没动。`
  return plan.reduced.removed.length > 0 ? `${base}${reducedPrereqHintText(plan.reduced.removed)}` : base
}

/**
 * 落盘（**唯一写入口**）：补两个键 → 重拼 → `meta` ＋ 一条账本事件。
 *
 * 失败＝**图不落地 ＋ 撤回那两个键**：计划阶段或闸门阶段有任何问题 ⇒ 这一趟的两个键不写；
 * 同时把**盘上带着图键的那几份件**里的两个键撤掉（{@link withdrawKnowledgeGraphKeys}，
 * 口径与交工那一跳同一先例）——盘上不会留着一份「图键指着旧分片／没经过这一道闸」的件。
 * ⛔ 没有图键的件一个字节都不碰；⛔ 章产物碰都不碰（闸只挡「图落地」这一件事）。
 *
 * @param {{projectId: string, ledger: {updateMeta: Function, appendEvent: Function}, edges?: unknown[], now?: number}} input
 *   `ledger` 是**注入的**（`src/workflow/engine.js` 的 `updateMeta`／`appendEvent`）——本模块不 import
 *   engine（那是宿主面，脚本 CLI 才拿得到；⛔ 静态 import 会在插件加载路径上多一条依赖）。
 * @returns {{ok: boolean, stage?: string, outcome?: string, problems?: string[], plan: object, withdrawal?: object|null}}
 */
export function applyKnowledgeGraphBackfill({ projectId, ledger, edges, now = Date.now() }) {
  const plan = planKnowledgeGraphBackfill(projectId, edges === undefined ? {} : { edges })
  // 撤回要用的 ledger 是可选的（meta 里本来没有补图记录时它什么也不写；见 `withdrawKnowledgeGraphKeys`）
  const ledgerForWithdraw = ledger !== null && typeof ledger === 'object' && typeof ledger.updateMeta === 'function' ? ledger : null
  // ⛔ 这一跳要落 `meta` ＋ 一条账本事件：ledger 必须在**写盘之前**就在位（否则写完了才抛，
  //    盘上会留一份「图落了、但没有补图记录」的件）。只在真正要落盘（`landed`）时要求它。
  const ledgerUsable = ledger !== null && typeof ledger === 'object'
    && typeof ledger.updateMeta === 'function' && typeof ledger.appendEvent === 'function'
  // 早期计划（既没有分片、也没有可读的合并件）在计划面就回来了，没有 landingPlan；这一档
  // **盘上没有可解析的图键**（合并件要么不在、要么 `[]`／`42`／坏 JSON）⇒ `unchanged`／零字节，
  // 撤回也无从下手。⚠️ 「计划阶段就拒但盘上已有图键」不在这里：那几档带着 `refusal` 进了
  // `planMergedMapLanding`，结局是 `withdrawn-on-plan`（spec 决策 9 · `W-04`＝A）。
  if (plan.landingPlan === undefined) {
    return {
      ok: false,
      stage: 'plan',
      outcome: plan.outcome ?? MERGED_MAP_OUTCOMES.unchanged,
      problems: plan.problems,
      plan,
      withdrawal: null,
    }
  }
  if (plan.landingPlan.outcome === MERGED_MAP_OUTCOMES.landed && !ledgerUsable) {
    throw new Error('applyKnowledgeGraphBackfill 需要一个 ledger（{updateMeta, appendEvent}）——「这份图是补的」要落 meta ＋ 一条账本事件，⛔ 不许静默跳过')
  }
  // 票 `graph-write-order/03`：写面只认计划面那一份（⛔ 不在这里再排一遍「写什么」）。
  const applied = applyMergedMapLanding(plan.landingPlan, { ledger: ledgerForWithdraw, now })
  if (plan.problems.length > 0) {
    return {
      ok: false,
      stage: 'plan',
      outcome: applied.outcome,
      problems: plan.problems,
      plan,
      withdrawal: applied.withdrawal,
    }
  }
  if (plan.gate !== null && plan.gate.problems.length > 0) {
    return {
      ok: false,
      stage: 'gate',
      outcome: applied.outcome,
      problems: plan.gate.problems.map((problem) => problem.message),
      gate: plan.gate,
      plan,
      withdrawal: applied.withdrawal,
    }
  }
  if (applied.outcome !== MERGED_MAP_OUTCOMES.landed) {
    // 走到这里说明 plan.problems 与 gate.problems 都为空、却既没 landed 也没被上面两档接住——
    // 那是写面/计划面的不变量破了，⛔ 不许静默回 ok:true 当「写了」。
    throw new Error(`补图写面认不出的结局：${applied.outcome}（此时计划问题与闸问题都应为空）`)
  }
  const readings = plan.gate.readings
  // meta 每次都刷（它是「当前状态」：跑了几次、这一次补出来什么）；**账本只记第一条**
  // ——「可重复、同输入同输出」对账本也成立，重跑一次不该多出一条假的历史。
  let firstBackfill = false
  ledger.updateMeta(projectId, (state) => {
    const previous = state[GRAPH_BACKFILL_META_KEY]
    firstBackfill = previous === undefined || previous === null
    state[GRAPH_BACKFILL_META_KEY] = {
      at: now,
      firstAt: firstBackfill ? now : previous.firstAt ?? now,
      runs: firstBackfill ? 1 : (Number.isSafeInteger(previous?.runs) ? previous.runs + 1 : 1),
      mode: plan.mode,
      by: 'script',
      cards: plan.cards.length,
      edges: plan.edges.length,
      edgeSource: plan.edgeSource,
      shards: plan.shards.map((shard) => shard.n),
      edgeScanText: plan.edgeScanText,
      zeroEdgeReading: plan.zeroEdgeReading,
      reducedPrereq: plan.reduced.removed.length,
      testableFrom: plan.testableFrom,
      anchorKinds: plan.anchorKinds,
    }
  })
  const where = plan.landing.mode === LANDING_MODES.shards
    ? `各分片（${plan.shards.map((shard) => shard.n).join('、')}）＋ 重拼的合并件`
    : '合并件'
  if (firstBackfill) {
    ledger.appendEvent(projectId, 'textbook/hint', { text: backfillHintText(plan, where) })
  }
  // 读物自证：写完自己再读回盘上那份、逐项对账（票 03 完成判据第 1 条那句话的落点）。
  const verification = verifyWrittenKnowledgeGraph(projectId, plan.before)
  return { ok: true, outcome: MERGED_MAP_OUTCOMES.landed, plan, readings, verification, written: { shards: plan.shardWrites.map((write) => write.path), merged: plan.mergedWrite.path } }
}

/** 把握档取值域（**转发**，让下游不必同时 import 两个模块）。 */
export { KNOWLEDGE_CONFIDENCE_LEVELS }

/** 两串字**逐字**比（⛔ 不套规范化：`" 甲"` 与 `"甲"` 是两条）——读物自证与判据同一口径。 */
function verbatimTally(list) {
  const map = new Map()
  for (const value of list) {
    const key = typeof value === 'string' ? value : `\u0000非文本(${typeof value}):${String(value)}`
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return map
}

/**
 * **读物自证**（票 03 完成判据第 1 条那句「跑完后自己再读回盘上那份、逐项对账」）：
 * 重新从盘上读回合并件与各分片，逐项核四件——① 图键在不在 ② 卡与知识点**逐字 1:1**（逐项计数）
 * ③ 闸门在**重读回来的那一份**上零问题 ④ payload 有没有被改写（除 `cards`／`edges` 之外，逐键
 * 与 `before` 逐字相同）。
 *
 * ⚠️ 它**不证明**卡讲的是那条知识点的事（只比两串字）；也不证明锚对得上原文。窄处与闸同源。
 *
 * @param {string} projectId
 * @param {{merged?: unknown, shards?: Array<{n: number, map: unknown}>}|null} [before] 写盘前那一份
 * @returns {object}
 */
export function verifyWrittenKnowledgeGraph(projectId, before = null) {
  const inputs = readBookGraphInputs(projectId)
  const merged = inputs.merged
  const cards = Array.isArray(merged?.cards) ? merged.cards : null
  const edges = Array.isArray(merged?.edges) ? merged.edges : null
  const points = Array.isArray(merged?.knowledgePoints) ? merged.knowledgePoints : []
  const names = verbatimTally((cards ?? []).map((card) => card?.name))
  const titles = verbatimTally(points.map((point) => point?.title))
  const missing = []
  for (const [name, count] of names) if ((titles.get(name) ?? 0) < count) missing.push(`卡「${name}」在知识点里没有对应的那一条`)
  for (const [title, count] of titles) if ((names.get(title) ?? 0) < count) missing.push(`知识点「${title}」在图里没有对应的那张卡`)
  const verdict = knowledgeMapGateProblems({ merged, shards: inputs.shards.map((shard) => ({ n: shard.n, map: shard.map })) })
  // ⚠️ 无片那一档**没有分片**：这里给 `null`（「没有可判的对象」），⛔ 不给 `true`
  //    ——空数组的 `every` 恒真，那会把「没有分片」印成「分片都带两键」。
  const shardsWithKeys = inputs.shards.length === 0
    ? null
    : inputs.shards.every((shard) => Array.isArray(shard.map?.cards) && Array.isArray(shard.map?.edges))
  const payloadDiffs = []
  if (before !== null && before !== undefined && before.merged !== null && before.merged !== undefined) {
    for (const key of Object.keys(before.merged)) {
      if (key === 'cards' || key === 'edges') continue
      if (JSON.stringify(before.merged[key]) !== JSON.stringify(merged?.[key])) payloadDiffs.push(`合并件的「${key}」在写盘前后不一致`)
    }
  }
  if (before !== null && before !== undefined && Array.isArray(before.shards)) {
    for (const row of before.shards) {
      const now = inputs.shards.find((shard) => shard.n === row.n)
      if (now === undefined) { payloadDiffs.push(`第 ${row.n} 路分片写盘后不见了`); continue }
      for (const key of Object.keys(row.map ?? {})) {
        if (key === 'cards' || key === 'edges') continue
        if (JSON.stringify(row.map[key]) !== JSON.stringify(now.map?.[key])) payloadDiffs.push(`第 ${row.n} 路分片的「${key}」在写盘前后不一致`)
      }
    }
  }
  return {
    projectId,
    mode: inputs.mode,
    cardsContained: cards !== null,
    edgesContained: edges !== null,
    cards: cards?.length ?? null,
    edges: edges?.length ?? null,
    points: points.length,
    bijectionEqual: missing.length === 0 && cards !== null && cards.length === points.length,
    bijectionProblems: missing,
    gateProblems: verdict.problems,
    edgeScanText: edgeScanText(verdict.readings.edgeScan),
    zeroEdgeReading: edges !== null && edges.length === 0 ? edgeScanText(verdict.readings.edgeScan) : null,
    shardsWithKeys,
    payloadPreserved: before === null || before === undefined ? null : payloadDiffs.length === 0,
    payloadDiffs,
  }
}
