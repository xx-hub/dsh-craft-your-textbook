# 写作 subagent prompt 模板（Phase 5 并行铺章）

> 主 agent 在每个写作 subagent 的 dispatch 前，用本书的实际值填 `{{占位符}}`。模板即契约——缺项 = 该 agent 开工前看不到关键约束。
> 本模板是 `audit-and-testing.md §九` 的单一事实源；改契约改这里，别改两处。
> 占位符里的路径都以本项目在 `work/`、`sources-md/` 下的实际产物为准（下面每条都给了"通常是"的路径）。

## 必带内容（按顺序）

1. **金标准章全文**（作为范例）——`{{金标准章路径}}`（即范例章，通常是 `work/chapter-{{范例章号}}.md`）。让 agent 先读它，作为"这书长什么样"的锚。
2. **四份约束文件全文**——给全文，别只给摘要：
   - `{{style-spec.md 路径}}`（写作规范：模式选型结论、章内板块语法、叙事约定、正文语言风格、深度四维承诺表、防幻觉铁律、写作纪律、脚手架标题清单）——通常是 `work/style-spec.md`
   - `{{outline.md 路径}}`（章节骨架：每章的 title/outline/source/targetWords/points/体量依据 + 范例章号）——通常是 `work/outline.md`
   - `{{explore.md 路径}}`（源探查报告：材料清单+角色标签、结构观察、教学线索）——通常是 `work/explore.md`
   - `{{knowledge-map.json 路径}}`（结构化知识地图：materials/knowledgePoints/chapterSuggestion）——通常是 `work/knowledge-map.json`
3. **本章源材料映射**：outline 里本章的 `source` 字段指向哪本材料的哪一节，定位到 `sources-md/{{材料文件}}.md` 的对应小节，精确到小节标题/行号——`{{sources-md 材料路径}}` 的 `{{本章源材料小节}}`。
4. **防幻觉铁律完整 4 条**（`audit-and-testing.md §6.4`）：打赌测试 / 追不到源就降级 / 最危险条目逐字回源 / 偏好断言必标判断根。
5. **不变量底线**：从 `references/invariants.md` 读适用本路线的编号——`{{pure-blueprint: I1-I9}}` / `{{human-readable: I1-I4 + I7-I9 + H1-H3}}`。
6. **本章在知识链中的位置 + 跨章引用指向**：前面哪章讲过什么、后面哪章会用到这里——`{{本章知识链位置说明}}`。
7. **本章深度承诺 + 四维自问**：从 `{{style-spec.md 路径}}` §深度四维承诺表摘出本章相关承诺给 agent。写作完成时，对本章核心概念逐个过 `references/depth.md` 判定问题自问（读者能回答"为什么"吗 / 知道它从哪来、有何争议吗 / 知道边界吗 / 像内行写的吗），自问结果写进完工回报。
8. **本章知识点清单 + 前向引用粒度规则**：
   - 从 `{{outline.md 路径}}` 里本章的 `points` 字段读出本章必须覆盖的知识点清单（一个知识点一条），写完逐条打钩，不能有知识点遗漏。
   - **前向引用粒度规则**：正文里提到还没写的章节时，只引用大纲已承诺的范围（如"第 X 章会展开 Y"），**禁止编造未写章节的具体数字、结论、例题**；拿不准就写"后面章节会展开"或干脆不写，绝不用编的细节填空。

## 纪律要点（必告知 agent）

- **工具纪律（跨平台）**：文件 I/O 用文件工具（read / write / edit / glob / grep），shell 只留给真需要 shell 的场景且用前说明理由；规则对 Windows / macOS / Linux 完全一致，不点名单一 shell 名。单一事实源 `audit-and-testing.md §九 工具纪律`（别处不另写一份）。
- **写作 agent 的自审不算审计**：完工后独立审计由主 agent 另派（普通章用 `subagent-prompts/audit-agent-prompt.md`；金标准章用 `subagent-prompts/gold-audit-prompt.md`）。你的自报清单不能替代独立审计。
- **模型**：写作 = 标准档。聚焦本章，不做全书级判断。
- **完工回报契约**：返回时写清楚——写了哪些文件、每章板块是否齐全、知识点清单是否全部打钩、对 style-spec 的遵守情况、有没有跳过/改动的板块、有没有需要主 agent 注意的存疑点。**不要在回报里写"已审计通过"。**
- **深度自问不算审计**：深度四维自问写进完工回报，但独立审计由主 agent 另派——自问只是让写作者留意，不能替代审计。

## 填好的 dispatch = 模板 + 实际值

主 agent 按上述 8 项填入本书实际值后，直接作为写作 subagent 的 prompt 使用。
