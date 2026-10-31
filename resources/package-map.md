# 模式资产层的包地图（生成物）

> ⛔ **这份文件是生成的**：`node scripts/gen-package-map.mjs --write` 照 `src/domain-rules.js` 的
> `SPEC_ROWS` 与挂载面的一页纸现算。手改它等于改一份下一趟就被覆写的临时件。
> 判据 `test/test-path-index.mjs` 双向对账：地图里每一项都在**可注入的**声明行里、可注入的每一行都在地图里（`never` 不进索引）。
>
> 映射的基准：下面每条 `resources/…` 都相对**运行时**的方法论根目录拼
> ——就是 `brief.resourceRoot` 那一格（交办件里的 `RESOURCE_ROOT_LINE` 也印它，本机绝对路径）。
> ⛔ 这里不印那个绝对路径：印了就是把某台机器的路径写进入库文件。

## 文件

- `resources/SKILL.md`：什么时候该读：不确定这一步在整条链的什么位置、或要卡 Iron Law 判据时｜产出：machine
- `resources/references/source-material.md`：什么时候该读：判断某份材料能不能当真相源、要抽结构或定知识点时｜产出：machine
- `resources/references/patterns/README.md`：什么时候该读：关卡②选教学模式、定每章板块时｜产出：machine
- `resources/references/file-contracts.md`：什么时候该读：写 工作区/style-spec.md 等四件设计产物、或交工前自查格式时｜产出：machine
- `resources/references/audit-and-testing.md`：什么时候该读：派小助手、派审计小助手、暂停、收到驳回意见时｜产出：machine
- `resources/references/delivery-checklist.md`：什么时候该读：最后检查与交付前逐条过｜产出：machine
- `resources/references/invariants.md`：什么时候该读：拿不准某条底线适用哪条路线时｜产出：machine
- `resources/references/subagent-prompts/close-reading-prompt.md`：什么时候该读：探查段派每一路精读时按它填｜产出：machine
- `resources/references/subagent-prompts/material-survey-prompt.md`：什么时候该读：探查段开头派材料判定那一路时按它填｜产出：machine
- `resources/references/subagent-prompts/gold-writing-agent-prompt.md`：什么时候该读：站 8 派范例章执笔小助手时按它填｜产出：machine
- `resources/references/subagent-prompts/writing-agent-prompt.md`：什么时候该读：派写作小助手时按模板填｜产出：machine
- `resources/references/subagent-prompts/audit-agent-prompt.md`：什么时候该读：派章级审计小助手时按模板填｜产出：machine
- `resources/references/subagent-prompts/gold-audit-prompt.md`：什么时候该读：派范例章审计小助手时按模板填｜产出：machine
- `resources/references/subagent-prompts/cross-audit-prompt.md`：什么时候该读：合并前派跨章审计小助手时按模板填｜产出：machine
- `resources/references/subagent-prompts/alignment-prompt.md`：什么时候该读：全部精读分片落盘之后再派对齐小助手时按它填｜产出：machine
- `resources/references/subagent-prompts/graph-review-prompt.md`：什么时候该读：派图审校小助手时按它填｜产出：machine
- `resources/references/workflow-scripts/chapter-audit.md`：什么时候该读：审计那一跳要调 workflow 时｜产出：machine
- `resources/references/anti-patterns.md`：什么时候该读：关卡交办里点名它时、或要判某句话是不是流程级反模式时｜产出：machine
- `resources/references/depth.md`：什么时候该读：判某一条知识点的讲授深度档位时｜产出：machine
- `resources/package-map.md`：什么时候该读：找某一层该读哪份、或要一份按路径的索引时｜产出：machine
