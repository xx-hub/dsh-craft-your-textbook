/**
 * 读者片的**根级读侧窄门**：`effectiveReaderSlices(merged)`（票 `ui-workflow-seam/03`）。
 *
 * ## 它为什么是「再导出」而不是「搬声明」
 *
 * `effectiveReaderSlices` 的实现依赖同文件的 `readerSliceProblems`（`knowledge-map-assembly.js:156`）
 * 与 `normalizeKnowledgePointTitle`（`src/domain-rules.js:1695`）。把它们拆开搬会造出**两份形状
 * 相近的量法**——而那个函数的注释逐字禁止这件事：「**唯一出处**（生产交工那一跳与判据都调它；
 * ⛔ 不在别处另写一份『相似的量法』）」。⇒ 本模块只开一扇窄门，零拷贝。
 *
 * ## 为什么它住 `src/` 根级（⛔ 别造 `src/ui/reader-slices.js`）
 *
 * 转发模块必须自己 import `workflow/`——它若住在 `src/ui/` 里，自己就是第 7 条深层边，
 * 判据永远数不干净（`ADR-0044:43` 同形否决过 `src/ui/words.js`；spec 决策 1）。
 *
 * ## ⚠️ 门**不算**适配器
 *
 * `export … from` 是**同一个绑定**（`test-reader-gap.mjs` 断 `door.effectiveReaderSlices === 原件`）。
 * ⛔ 别包一层 `(merged) => workflowX(merged)`：那会让人以为「门可以改它的语义」。
 *
 * ## ⚠️ 本模块管的面（窄处，照实写）
 *
 * 面＝**这一个名字的出口**。它管不到：① 片的**语义**（片分得好不好、覆盖不覆盖）——那是它注释里
 * 写明的语义边界，本票不扩张它；② `degraded`／`note` 那几条退化口径对不对（归
 * `test-knowledge-map-edges.mjs` 那一族，本门只转发）；③ 界面是否真的经它取词（那是 `src/ui/`
 * 的 import 面，由 `dev/ui-source-gates.mjs` 的 `uiImportDirectionProblems` 量）。
 */
export { effectiveReaderSlices } from './workflow/knowledge-map-assembly.js'
