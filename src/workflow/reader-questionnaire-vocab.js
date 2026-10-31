/**
 * 读者情况问卷的态词与归一化 —— **原位置再导出**（票 `ui-workflow-seam/01`）。
 *
 * 声明已搬到 `src/reader-questionnaire-vocab.js`（`src/` 根级、零 import）：界面那一侧
 * （`src/ui/reader-gap.js`）也要读这三样，而界面不该知道 `workflow/` 的内部路径
 * （`AGENTS.md` 的「Frontend layout」；票 `ui-workflow-seam/04` 改路）。
 *
 * ⚠️ **本文件不是第二份真值**：`export * from` 是**同一个绑定**，没有一份拷贝。
 * 既有消费者（`src/workflow/reader-questionnaire.js` 的 `:62-64` 那一行 import 与它自己的
 * `:82` 再导出）**一行都不用改**——这正是「搬运票不改 import 面」那条纪律。
 *
 * ⚠️ 为什么不做成「声明留这儿、根级再导出」（`EDGE_KINDS` 那种特例）：这套态词的语义归属
 * **不在**任何 `workflow/` 模块里（问卷的卷面形状，两侧平等消费），所以它是「真的搬声明」；
 * `EDGE_KINDS` 相反，那三个字符串的语义归属就是图算法（见 `src/knowledge-edge-vocab.js`）。
 * 两个先例**别混用**。
 */
export * from '../reader-questionnaire-vocab.js'
