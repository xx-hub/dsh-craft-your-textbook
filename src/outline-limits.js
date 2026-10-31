/**
 * 交工件里「单章知识点条数」的那条**上限**——**零依赖**模块（票 `ui-workflow-seam/01`）。
 *
 * ## 它是什么，不是什么
 *
 * **是**一个数：`OUTLINE_POINTS_MAX = 20`，`outline` 交工时单章知识点清单的条数上限
 * （票 `pipeline-wiring-gaps/13` 裁决：超出按票 01 裁决「放行并记人话提示」处理，不再无声丢弃）。
 * **不是**造书流程的规则、⛔ 不是「每章该写几条」的预算——维护者订正过：「那是上限，实际通常少得多」。
 * 那条语义由消费它的措辞承担（`src/ui/knowledge-graph-map.js` 的 `magnitudeReading` 逐字写着
 * 「每章 N 条是上限、不是预算」，并由 `test-knowledge-graph-map.mjs` 钉着）。
 *
 * ## 为什么它住 `src/` 根级（⛔ 别搬回 `workflow/actions/payload-fields.js`）
 *
 * 界面（`src/ui/knowledge-graph-map.js` 的量级读数）与七处服务端写入口都要这一个数。
 * 它住在 `workflow/actions/` 里时，界面对它的 import 是「**知道服务端内部文件布局**」——
 * 那正是 `AGENTS.md` 的「Frontend layout」要挡的形状（票 `ui-workflow-seam/04` 改路）。
 * ⚠️ **它不进 `src/domain-rules.js`**（spec 决策 5）：那是「服务端载荷的字段上限」，不是造书流程的规则，
 * 而 `domain-rules.js` 已经 3400+ 行、170 个导出，体量本身是被盯着的。
 *
 * ## ⚠️ 本模块管的面（窄处，照实写）
 *
 * 面＝**这个数的声明**。它管不到：① 别处（`test/**`／`dev/**`／文档散文）有没有手抄一个 `20`——
 * 那是「第二份真值」判据的活，由 `test-knowledge-graph-map.mjs` 的措辞那几条承担；
 * ② 各写入口**用不用**它（漏用一个不会让本模块红）；③ 它将来要不要按章类型分档（那是另一票）。
 */

/**
 * `outline` 交工时单章知识点清单的条数上限（票 `pipeline-wiring-gaps/13`；数值沿用原表达式里的 20，逐字没动）。
 *
 * ⚠️ **上限、不是预算**：措辞里必须写清这一层，⛔ 不许把它写成预期规模（判据在
 * `test-knowledge-graph-map.mjs` 的「量级读数」那一格）。
 */
export const OUTLINE_POINTS_MAX = 20;
