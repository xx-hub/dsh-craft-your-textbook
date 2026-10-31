/**
 * 读者边界回填那一笔账的**根级读侧窄门**：`readerBoundaryBackfillActive(meta)`
 * （票 `ui-workflow-seam/03`）。
 *
 * ## 为什么只给这一个名字（⛔ 不是整份文件、⛔ 不是 `export *`）
 *
 * `src/workflow/reader-boundary-backfill.js` 里**不只有读侧**：还有写侧
 * `applyReaderBoundaryBackfillAccount`（`:89`）与三个 meta 键常量。整份搬（或 `export *`）
 * 会把**写侧**放到界面可达的位置——界面不需要它，而「界面拿不到写侧」这一格是有判据的
 * （`test-reader-graph-backfill` 那一族：根级门的导出清单里不许出现写侧名字）。
 *
 * ## ⚠️ `readerBoundaryBackfillOf` 为什么不一起给——**不要**
 *
 * 它是 `readerBoundaryBackfillActive` 的**实现细节**（`:75-78` 就一行：取记录、看 `withdrawnAt`
 * 在不在）。`src/` 里零外部消费者，唯一的仓内消费者是 `test/test-knowledge-map-exclusions.mjs:85`
 * （那个测试从 `../src/workflow/reader-boundary-backfill.js` 取，测的是服务端那笔账，不是界面）。
 * 把「界面也许将来要显示撤回时刻」这种**假设性需求**写进门的导出面，正是 `ADR-0044` 反复
 * 否掉的那个形状（「为将来加导出」）。⇒ 真需要第二个名字时再加，那时它是**有消费者的**。
 *
 * ## 为什么它住 `src/` 根级
 *
 * 同 `src/reader-slices.js`：转发模块住 `src/ui/` 里就是第 7 条深层边（spec 决策 1）。
 *
 * ## ⚠️ 本模块管的面（窄处，照实写）
 *
 * 面＝**这一个名字的出口**。它管不到：① 那笔账的**写侧**（服务端那侧今天就能写，
 * `src/workflow/actions/chapters.js:194`；本门只保证**界面这一侧拿不到写侧**）；
 * ② `withdrawnAt` 在不在盒法（归 `test-knowledge-graph-backfill.mjs` 的四档）；
 * ③ 界面是否真的经它取词（那是 `dev/ui-source-gates.mjs` 的量法）。
 */
export { readerBoundaryBackfillActive } from './workflow/reader-boundary-backfill.js'
