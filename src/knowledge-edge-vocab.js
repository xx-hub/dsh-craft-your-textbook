/**
 * 知识点图**认得的边类**那三个字 —— `src/` 根级公开出口（票 `ui-workflow-seam/01`）。
 *
 * ## 它是什么，不是什么
 *
 * **是**一把词表：`prereq`（有方向主张）／`alias`（同一件事两个名字）／`see-also`（只是相关）。
 * **不是**第二份真值、⛔ 不是判据、⛔ 不是「新加一类边」的开口。
 *
 * ## ⚠️ 特例：声明**留在** `src/workflow/knowledge-graph.js`，这里只再导出
 *
 * 与同批的 `src/reader-questionnaire-vocab.js`／`src/outline-limits.js`（**真的**把声明搬到了
 * 根级）**不同**，这一个的语义归属就是那个模块——它是「图算法认得的边类」，`prereq` 是查环与
 * 闭包唯一走的那一类。搬声明的代价有两条，都实测过：
 *
 * 1. **`knowledge-graph.js` 的纯函数纪律是链上判据**（`test/test-knowledge-graph.mjs` 断
 *    「源码面零 import」），而那条正则是 `/^\s*import\s/mu`——**它只认行首 `import`，看不见
 *    `export … from` 形状的再导出**。实测：把「一行再导出」那句喂进那条正则得 `false` ⇒
 *    把声明搬走、在原位置加一行再导出，**依赖加上了而闸门一声不响**。
 *    那正是本 effort 要治的那个病（判据声称的强度 ≠ 实现的强度）的同一个形状。
 * 2. 「两份声明逐字相等」那条补丁更贵：两份都过得了 `[...EDGE_KINDS] === [...]` 那条既有断言，
 *    于是「唯一出处」这条性质**被放弃**了，而没有任何东西会响。
 *
 * ⇒ 声明留在 `src/workflow/knowledge-graph.js:63`（**那个文件一个字节没动**），本模块只做
 * `export { … } from`。代价如实记账：**本模块不是零 import**，所以它按「门」的纪律验收——
 * 它的 import 闭包不许出现 `node:`／react／第三方（`build.mjs` 单入口、`platform: 'browser'`）。
 * 判据在 `test-reader-gap.mjs`（同批那一族判据的落点），断三件：
 * 闭包无裸依赖、导出的 `EDGE_KINDS` 与 `knowledge-graph.js` 那份是**同一个数组**、以及「它没有
 * 变成第二份声明」。
 *
 * ## ⚠️ 本模块管的面（窄处，照实写）
 *
 * 面＝**这一个名字的出口**。它管不到：① 界面是否真的经它取词（那是 `src/ui/` 的 import 面，
 * 由 `dev/ui-source-gates.mjs` 的 `uiImportDirectionProblems` 量）；② `alias`／`see-also`
 * 这两个值在界面里还有没有别的手抄（线型表按值取键，那是另一条既有判据的面）；
 * ③ 将来若 `EDGE_KINDS` 要长第四类——那是改 `knowledge-graph.js` 的一票，本模块不替它挡。
 */
export { EDGE_KINDS } from './workflow/knowledge-graph.js'
