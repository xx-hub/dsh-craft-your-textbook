/**
 * 把握档（知识点的「这一条判得有多实」）—— **零依赖**模块（票 `depth-round-3/03`）。
 *
 * 三档 `强`／`中`／`待核`，**唯一声明处就是本文件**。它从 `src/workflow/knowledge-map-gate.js`
 * 整段搬来（`LEVELS` ← `KNOWLEDGE_CONFIDENCE_LEVELS`、`PENDING` ← `PENDING_CONFIDENCE`），
 * gate 在原位置**再导出**这两个名字——`knowledge-graph-chain.js`／审校面那一路与
 * 既有测试的 import 面**一行不改**，与本仓 `src/material-formats.js` 同一条先例
 * （那条「只许一个 import 入口」的判据在 `test-material-format.mjs`；本模块的同一件事由
 * `test-knowledge-map-gate.mjs` 钉着：**全仓只有 `src/workflow/knowledge-map-gate.js` import 本模块**）。
 *
 * ## 为什么它必须住 `src/` 根级
 *
 * 两侧都要知道这三档：Node 侧（形状闸、写作面的链、审校面）与**前端 bundle**（知识点图的门槛与线型）
 * ——UI 侧经 gate 取词。所以它**不许** import `node:` 内置／react／任何第三方，也**不许** import
 * `src/workflow/**`（那会把前端拖下水）：只住「两侧都必须知道的纯事实与派生」。
 *
 * ## 派生，不是第二份真值
 *
 * `PENDING`、`CROSS_MATERIAL_PREREQ_LEVELS`、`isDecided()` 三样全部**从 `LEVELS` 算出来**：
 * 改第三档的名字时（`LEVELS[2]`），gate 的跨材料上限、build 补的卡、chain 的「已定」过滤、
 * review 的注意力清单、UI 的门槛与线型**一起跟着走**——这条由 `test-knowledge-map-gate.mjs` 的
 * 反证钉着（把声明在内存里改一个名字，五处各跑一遍生产函数，读数必须一致地变；一个字节都不写盘）。
 *
 * ## ⚠️ 本模块管的面（窄处，照实写）
 *
 * 面＝「**用作判据／阈值／取值键**的字面量」。**不含**：夹具数据（`dev/gallery/fixtures/*.json` 里
 * `待核` 是**值**，不是判据——当时读数是 57 份里 25 处）、演示数据（`src/content-lib.js` 的合并件样例）、
 * 派单模板散文（`resources/references/subagent-prompts/*`）、文档与 ADR 引文（`docs/**`）、注释散文。
 * 那些地方改名后**不会**跟着变，也不该由本模块的判据去管（`CONTEXT.md`「把握档」词条是词义的出处）。
 */

/**
 * 把握档的三档（顺序是契约：强 → 中 → 待核；spec §2 的行文顺序，重排会让下游的取档下标错位）。
 *
 * ⚠️ **本仓唯一一份三档字面量**：别处一律从这里取（gate 再导出 `KNOWLEDGE_CONFIDENCE_LEVELS`）。
 * `test-knowledge-map-gate.mjs` 把三档逐项钉着，且把「另写一份」这件事做成反证（改一次名字，
 * 五个消费点必须一致跟着变）。
 */
export const LEVELS = Object.freeze(['强', '中', '待核'])

/**
 * 把握档里「**方向都没定**」的那一档（spec §2／§4）：审校面的注意力清单（先复核它）与写作面的
 * 「它不算前置，一条都不进」都读这一个名字。
 *
 * ⚠️ **从三档表里取**（⛔ 这里不另写一个同义字面量：那一档的名字只有上面那一处声明）。
 */
export const PENDING = LEVELS[2]

/**
 * 跨材料 `prereq` 的把握档上限（spec §5 第 8 条／§7：两份材料之间的先后没人核过）——
 * **第二档 ＋ 最弱一档**，派生自 `LEVELS`（⛔ 不是手抄的 `['中','待核']`）。
 *
 * 它只压跨材料的 `prereq`：跨材料的 `see-also` 不主张方向、不受它约束（那条语义住 gate）。
 */
export const CROSS_MATERIAL_PREREQ_LEVELS = Object.freeze([LEVELS[1], PENDING])

/**
 * 这一条把握档**算不算「已定」**——门槛过滤那**一句**（写作面的链、审校面与知识点图共用同一句）。
 *
 * 语义：方向已定 ⇔ 不是最弱那一档。缺字段／认不出的值（`undefined` 等）**算已定**——与搬家前
 * `edge.confidence !== PENDING_CONFIDENCE` 逐字等价，本函数是**纯等价**的那一句，不改口径。
 *
 * ⚠️ **不做 `trim`**（与搬家前一致）：形状闸按 `trim()` 后的值判入域，所以 `" 待核 "` 能过闸，
 * 而这里会把它当成已定的一档——那是**既有**的粗处，本票只搬不改；要治它得先裁决「谁负责规范化」。
 */
export function isDecided(confidence) {
  return confidence !== PENDING
}
