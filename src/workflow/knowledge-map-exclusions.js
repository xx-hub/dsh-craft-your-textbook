/**
 * 那份**人的裁决产物**的读写侧（票 `.scratch/knowledge-graph-build/issues/09`；口径来源
 * `.scratch/knowledge-graph-step/spec.md` §9、不变量见 `docs/adr/0039-被剔除的知识点怎样离开覆盖闸门的判据面.md`）。
 *
 * ## 它是什么
 *
 * 用户在知识点图上按下「🗑 这部分不造进书里」（票 08 的第三条「意见」通路 `graph-opinion`）时，
 * 那一笔裁决落到 `工作区/knowledge-map-exclusions.json`（形状 `{ items: [{ key, title, reason, by, at }] }`）。
 * ⛔ **不落进 `工作区/knowledge-map.json`**：那份合并件由机器重拼（探查交工／重做探查／老书补图），
 * 手写进去的标记下一次重拼就没了（ADR-0039 决策 3）。
 *
 * ## 边界（这一段就是本模块的边界，别在别处另写一句）
 *
 * · **做**：读那份件（{@link readExclusions}）、写那份件（{@link writeExclusions}）、把「那份件 ＋ 合并件」
 *   读成**喂给覆盖闸门的那一份集合**（{@link readCoverageCollection}，唯一读侧入口）。
 * · **不做**：⛔ 不判形状的对错（那把尺子是 `domain-rules.exclusionProblems`，本模块只把
 *   「读不出／不是 JSON」翻成同一条 problem 再交给它）、⛔ 不改覆盖闸门（`outlinePointsCoverage`
 *   一个字不改，本模块只换**喂给它的集合**）、⛔ 不删文件（「全部放回来」＝写一份 `items: []`，
 *   理由见票 09 的 `## Answer`）。
 *
 * ## 陈旧在**读取侧**现算，⛔ 不写回文件
 *
 * 「键没了 / 键在而 title 变了」由 `liveExclusionsOf` 在每次读的时候现算 ⇒ 文件里**永远**只有人按下
 * 那一下的原始记录（史实），而「今天还算不算数」是派生的。⇒ 一次重造探查**不会**把人几十次判断清零
 * （⛔ 不整份失效），代价只是一条非阻断读数「已失效 N 条」。
 *
 * ## 谁写它：**一律是代笔**（票 `rcb-build/06`；口径见 `ADR-0040` 决策 2）
 *
 * 两类落笔方式，走的是**同一条**写路（本模块的 {@link writeExclusions}，唯一调用点＝
 * `src/workflow/actions/chapters.js` 的 `case 'graph-opinion'`）：
 *   · **人的一次按键**——站 2 图上那把**划子**（`reason: 已经会`）／框里那颗 `🗑`（`reason: 不需要`）；
 *   · **AI 读回卷件代笔**——读者情况问卷回卷之后，AI 逐条读那份 `.md`，对**明确勾了「已经会」**
 *     的条目发同一支动作（`reason: 已经会`）；「不确定」与未勾**一条都不落**。
 * `by` 因此仍**只有一个值** `user`（⛔ 不加 `user-transcribed`）：它记的是**谁的意思**，不是谁敲的键；
 * 代笔的出处＝书夹里那份回卷 `.md`（`READER_QUESTIONNAIRE_RETURNED_REL`）。界面那句如实说明
 * （「这 N 条是照你回卷件上的勾选记的」）由两张确认卡那一块现算，⛔ 不给条目加归属字段。
 *
 * ## 回退下场：**边界裁决不随回退走**（票 `rcb-build/06` 二选一里选定的那一条）
 *
 * 快照只装 `meta` ＋账本、**一个产物文件都不装**；回退按**时间**搬走的只有
 * `工作区/决策/NN.json` 那一族（`engine.js` 的 `archiveDecisionRecordsAfter`）⇒ 这份件**既不被还原、
 * 也不被归档**：回退之后它照旧留在书夹里，每条自带的 `by`／`at` 就是它的追溯。
 *
 * ⚠️ 另一条路（把它纳入那道时间判据）**有意不选**，理由是它做不到「不改写人写的件」：快照里没有
 * 这份件（还原不了），而按 `at > 快照时刻` 归档要么整份搬走（连快照**之前**那些裁决一起丢）、
 * 要么只搬其中几条（＝**机器重写人写的件**）——两条都与本仓「⛔ 不覆盖人写的东西」正面相撞。
 * ⇒ 边缘代价如实认下：回退后可能出现「账本说没拍过、这份件还在原地」——**这一条是选定的口径**，
 * 不是漏接线；界面（那张图上那一块的读数旁）与本节都如实写出这一句。判据＝
 * `test/test-knowledge-map-exclusions.mjs` 第 ⑩ 节那一条**真跑一次回退**的格子（件逐字节不动 ＋
 * 账本照旧落 `textbook/rollback`）。
 *
 * @module workflow/knowledge-map-exclusions
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  KNOWLEDGE_MAP_EXCLUSIONS_FILE_NAME,
  KNOWLEDGE_MAP_EXCLUSIONS_REL,
  effectiveKnowledgePoints,
  exclusionItemsOf,
  exclusionProblems,
  liveExclusionsOf,
  renderExclusions,
} from '../domain-rules.js'
import { bookRelOnDisk, workDir } from './engine/paths.js'
import { readBookGraphInputs } from './knowledge-graph-build.js'

export { KNOWLEDGE_MAP_EXCLUSIONS_REL }

/**
 * 读那份人产物（**只读**；不在场也是一种如实的读数）。
 *
 * ⚠️ 读不出来／不是 JSON **不当成「没有」**：它是一条 problem（形状坏了＝硬闸，票 09 §A），
 * 与「这份件不在场」（合法：还没划过任何卡）是两件事。
 *
 * @param {string} projectId
 * @returns {{present: boolean, path: string|null, text: string|null, document: unknown, items: object[], problems: string[]}}
 */
export function readExclusions(projectId) {
  const rel = bookRelOnDisk(projectId, KNOWLEDGE_MAP_EXCLUSIONS_REL)
  if (rel === null || !existsSync(rel)) {
    return { present: false, path: rel, text: null, document: null, items: [], problems: [] }
  }
  let text = null
  try {
    text = readFileSync(rel, 'utf8')
  } catch (error) {
    return {
      present: true, path: rel, text: null, document: null, items: [],
      problems: [`读不出 \`${KNOWLEDGE_MAP_EXCLUSIONS_REL}\`：${String(error instanceof Error ? error.message : error)}`],
    }
  }
  let document = null
  try {
    document = JSON.parse(text)
  } catch {
    return {
      present: true, path: rel, text, document: null, items: [],
      problems: [`\`${KNOWLEDGE_MAP_EXCLUSIONS_REL}\` 不是 JSON（这份件是人写的，改好或删掉它再交工）`],
    }
  }
  return { present: true, path: rel, text, document, items: exclusionItemsOf(document), problems: exclusionProblems(document) }
}

/**
 * 落盘（**唯一写侧入口**：动作层按用户那一下裁决调用它）。
 *
 * ⚠️ 路径不经过 `engine.writeWork`（那一份会 import 本模块，往返就是循环依赖）：本模块自己
 * `mkdirSync` ＋ `writeFileSync`。文件名是**常量**（⛔ 没有用户输入），所以 `writeWork` 里那道
 * 「越界即抛」在这里不可能被触发——把它写成一句，是为了将来有人往里塞变量路径时看得见。
 *
 * @param {string} projectId
 * @param {object[]} items
 * @returns {string} 落盘路径
 */
export function writeExclusions(projectId, items) {
  const dir = workDir(projectId)
  mkdirSync(dir, { recursive: true })
  const path = join(dir, KNOWLEDGE_MAP_EXCLUSIONS_FILE_NAME)
  writeFileSync(path, renderExclusions(items), 'utf8')
  return path
}

/**
 * **唯一读侧入口**：把「那份人的裁决 ＋ 合并件」读成喂给覆盖闸门的那一份集合。
 *
 * 三处读者（spec §9 的「一处口径、三处读者」）都从这里或它的纯函数孪生拿数：
 * ① 覆盖闸门与 ③ `outline` 交办走本函数；② 两张确认卡在浏览器里读**同一对纯函数**
 * （`liveExclusionsOf` ＋ `effectiveKnowledgePoints`）——那一侧的数据由 `/textbook/events` 随 payload 下发。
 *
 * @param {string} projectId
 * @param {unknown} [merged] 已经在手上的合并件对象（省一次读；不传就现读 `工作区/knowledge-map.json`）
 * @returns {{present: boolean, problems: string[], items: object[], live: object[], stale: object[],
 *   points: object[], cards: object[], effective: object[], merged: unknown}}
 */
export function readCoverageCollection(projectId, merged = undefined) {
  const exclusions = readExclusions(projectId)
  const map = merged === undefined ? readBookGraphInputs(projectId).merged : merged
  const record = map !== null && typeof map === 'object' && !Array.isArray(map) ? map : null
  const points = Array.isArray(record?.knowledgePoints) ? record.knowledgePoints : []
  const cards = Array.isArray(record?.cards) ? record.cards : []
  const { live, stale } = liveExclusionsOf(exclusions.items, cards)
  return {
    present: exclusions.present,
    problems: exclusions.problems,
    items: exclusions.items,
    live,
    stale,
    points,
    cards,
    effective: effectiveKnowledgePoints(points, live),
    merged: record,
  }
}
