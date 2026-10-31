<!-- 生成物，勿手改；改机器请改 src/ 的声明面，再跑 node scripts/gen-skill-mechanism.mjs --write -->
来源：`src/domain-rules.js`、`src/workflow/engine.js`、`src/workflow/engine/labels.js`、`src/ui/view-rules.js`、`src/contract-actions.js`、`src/workflow/dispatch-assembly.js`、`src/workflow/artifact-fields.js`、`src/agent-tool.js`
判据：`test/test-skill-mechanism-drift.mjs`（`npm test` main 段）

## 工具面
- 共 2 个工具；参数键取自注册后的定义，不执行 execute、不联网。
- `workbench_status`：查看造书工作台当前的真实状态：有没有书、进行到第几步、机器在等谁、当前交给你 AI 的任务（pendingStage）、是否在等你拍板、抽查意见、各章进度、书…；参数：无
- `workbench_act`：与造书工作台交互；参数：`action`、`approved`、`auditJson`、`chapter`、`chapterSuggestion`、`chaptersJson`、`detail`、`dispatchKind`、`gate`、`goal`、`goals`、`goldChapter`、`goldChapterReason`、`handledReviews`、`hint`、`id`、`item`、`key`、`kind`、`label`、`material`、`maxConcurrentSubagents`、`name`、`note`、`para`、`preface`、`readerSlices`、`reason`、`redoCheck`、`redoItems`、`report`、`route`、`science`、`scope`、`segment`、`shard`、`snapshot`、`source`、`stage`、`styleCheck`、`summary`、`target`、`teachingFocus`、`text`、`title`、`userNote`、`verdict`、`verdictReason`、`version`、`waivedPoints`、`wish`
- 动作目录（listContractActions()）共 53 项：AI 可调用 36 项（`agentCallable=true`）；AI 不可调用 17 项：`wizard-suggest`、`convert-start`、`retry-convert`、`source-remove`、`skip-step`、`gold-target-words-set`、`review`、`review-revoke`、`suggest-words`、`pattern-analyze`、`pattern-list`、`settings`、`demo-run`、`debug-spawn`、`knowledge-graph-backfill`、`reader-questionnaire-issue`、`reader-questionnaire-submit`。
- `workbenchExposure` 三档：`callable` 34 项、`read-only` 1 项、`null` 18 项；`null` ＝「不在工作台直调面」。
- 「需用户明确同意」今天不是动作目录的声明字段（它散在个别动作的约束散文里），本投影不替你判。

## 阶段表
- 六阶段（6）：1 材料准备；2 源探查；3 教学设计；4 范例章；5 全章写作；6 终检与交付
- 交办成员（handoff，7）：`explore`、`gate`、`outline`、`gold`、`chapters`、`merge`、`final`
- 标签面（label，7）：`explore`、`goal`、`outline`、`gold`、`chapters`、`merge`、`final`
- 交工分支（submit，8）：`explore`、`gate`、`outline`、`gold`、`chapters`、`merge`、`final`、`goal`
- 界面面（ui，7）：`explore`、`gate`、`outline`、`gold`、`chapters`、`merge`、`final`

按阶段一行（`handoff ∪ label`，8 个；列＝机器 label／界面 label／输入／产物／推进）：

| 阶段 id | 机器 label | 界面 label | 输入 | 产物 | 推进 |
| --- | --- | --- | --- | --- | --- |
| `explore` | `源探查` | `读材料挑重点` | 无产物 | `工作区/explore.md`、`工作区/knowledge-map.json` | `outline` |
| `gate` | 未登记 | `拍板定方案` | 无产物 | 无产物 | `outline` |
| `outline` | `章节骨架` | `章节安排` | `工作区/knowledge-map.json`、`工作区/explore.md` | `工作区/outline.md` | `gold` |
| `gold` | `范例章` | `最佳范例章` | `工作区/outline.md` | `工作区/chapter-{n}.md` | `chapters` |
| `chapters` | `铺章` | `写完整本` | `工作区/style-spec.md`、`工作区/outline.md` | 按章产出（per-chapter） | `merge` |
| `merge` | `合并成书` | `合并成书` | 声明面为空（已知缺口）、`工作区/outline.md` | `工作区/book.md`、`工作区/preface.md` | `final` |
| `final` | `最后检查` | `最后检查` | `工作区/book.md` | `工作区/book.md` | `final` |
| `goal` | `学完能做到什么` | 未登记 | 未登记 | 未登记 | 未登记 |

## 三表对账
- 三张表分别读、不合并：`ACT_STAGES` 管交办成员，`STAGE_LABELS` 管人话标签，`STAGE_HUMAN` 管界面词；差异只记在缺口里。
- 已知缺口（gaps，1 项）：
  - `goal`：label=有、submit=有、handoff=无、ui=无、tool=无。
- 缺口不抹平：`goal` 出现在某些声明面、却不在工具 stage 枚举里；本投影不替它选边。

## 产物路径
- 产物族（16）：
  - 写作规范 → `工作区/style-spec.md`（producer=ai、scope=book、disclose=pointer）
  - 章节安排 → `工作区/outline.md`（producer=machine、scope=book、disclose=pointer）
  - 章节正文 → `工作区/chapter-{n}.md`（producer=machine、scope=chapter、disclose=pointer）
  - 章节正文分片 → `工作区/分片/*`（producer=subagent、scope=chapter、disclose=pointer）
  - 前言 → `工作区/preface.md`（producer=ai、scope=book、disclose=pointer）
  - 成品 → `工作区/book.md`（producer=machine、scope=book、disclose=pointer）
  - 细目 → `工作区/细目/*`（producer=subagent、scope=book、disclose=pointer）
  - 报告 → `工作区/报告/*`（producer=subagent、scope=book、disclose=pointer）
  - 探查报告 → `工作区/explore.md`（producer=ai、scope=book、disclose=pointer）
  - 知识地图 → `工作区/knowledge-map.json`（producer=machine、scope=book、disclose=pointer）
  - 知识地图分片 → `工作区/knowledge-map-{n}.json`（producer=subagent、scope=book、disclose=pointer）
  - 章审计 → `工作区/audit-{n}.md`（producer=subagent、scope=chapter、disclose=pointer）
  - 审计读数 → `工作区/审计读数.json`（producer=machine、scope=book、disclose=never）
  - 跨章审计 → `工作区/audit-cross.md`（producer=subagent、scope=book、disclose=pointer）
  - 风格线 → `工作区/style-line.md`（producer=user、scope=book、disclose=pointer）
  - 材料判定 → `工作区/材料判定.json`（producer=subagent、scope=book、disclose=pointer）
- 阶段输入行（STEP_INPUT_ROWS）：
  - `explore`：无产物
  - `gate`：无产物
  - `outline`：`工作区/knowledge-map.json`、`工作区/explore.md`
  - `gold`：`工作区/outline.md`
  - `chapters`：`工作区/style-spec.md`、`工作区/outline.md`
  - `merge`：声明面为空（已知缺口）、`工作区/outline.md`
  - `final`：`工作区/book.md`
- 阶段产物行（STEP_OUTPUT_ROWS）：
  - `explore`：`工作区/explore.md`、`工作区/knowledge-map.json`
  - `gate`：无产物
  - `outline`：`工作区/outline.md`
  - `gold`：`工作区/chapter-{n}.md`
  - `chapters`：按章产出（`per-chapter`）
  - `merge`：`工作区/book.md`、`工作区/preface.md`
  - `final`：`工作区/book.md`
- 派出产物行（STEP_SUB_OUTPUT_ROWS）：
  - `explore`：`工作区/细目/*`、`工作区/knowledge-map-{n}.json`、`工作区/材料判定.json`
  - `gate`：无产物
  - `outline`：无产物
  - `gold`：`工作区/分片/*`、`工作区/audit-{n}.md`
  - `chapters`：`工作区/分片/*`、`工作区/audit-{n}.md`
  - `merge`：`工作区/audit-cross.md`
  - `final`：`工作区/报告/*`
- 方案件：`工作区/方案/关卡1-v1.md`（`artifactDataForGate()` 的 v1 形状）
- 老名（只读兼容，4 组；写侧永远用新名）：逐字清单只许住 `src/domain-rules.js` 的改名记账区（与 `docs/adr/0031`），本生成物不复写。
- 推进次序：`explore`→`outline`；`gate`→`outline`；`outline`→`gold`；`gold`→`chapters`；`chapters`→`merge`；`merge`→`final`；`final`→`final`

## 闸门与推进
- 三次设计关卡（3）：第 1 次拍板 · 学习目标与难点；第 2 次拍板 · 教学方法与板块；第 3 次拍板 · 全书架构与章节
- 进度账本：机器只报数——最后一条进度记录落在多久前、此后又交工了几章；不拦交工，够不够勤由人看。
- 推进次序（NEXT_STAGE_VALUES）：`explore`→`outline`；`gate`→`outline`；`outline`→`gold`；`gold`→`chapters`；`chapters`→`merge`；`merge`→`final`；`final`→`final`
- 停点与放行由 `gateHuman()` 的主题词与 `STAGE_LABELS` 呈现；本投影只说声明面里的事实，不判语义。

## 质量门
- 权威入口：`runQualityChecks`
- 尾段名单（15 项，QUALITY_CHECKS_TAIL_NAMES）：`风格线条条有着落`、`进度账本齐全`、`成品无乱码（U+FFFD）`、`章节数符合大纲`、`成品与各章正文一致`、`成品里没有已划掉的知识点`、`必含板块齐全（契约项）`、`无禁用词（契约项）`、`拆脚手架八类残留`、`正文无元指令残留（human-readable）`、`章节引用可追溯（无引用矛盾）`、`交叉引用指向真实存在的章`、`章名全书唯一`、`无重复标题`、`字数兜底读数`
- 尾段只是尾段，权威是 `runQualityChecks`；条件项与 style-spec 追加的 0–2 项不在名单里。

## 派发
- 派发档（10）：`writing`、`gold-writing`、`audit`、`gold-audit`、`material-survey`、`close-reading`、`alignment`、`graph-review`、`cross-audit`、`final-check`
- 模板落点（`dispatchKindSpec(kind).shapeRel`）：`writing`→`references/subagent-prompts/writing-agent-prompt.md`、`gold-writing`→`references/subagent-prompts/gold-writing-agent-prompt.md`、`audit`→`references/subagent-prompts/audit-agent-prompt.md`、`gold-audit`→`references/subagent-prompts/gold-audit-prompt.md`、`material-survey`→`references/subagent-prompts/material-survey-prompt.md`、`close-reading`→`references/subagent-prompts/close-reading-prompt.md`、`alignment`→`references/subagent-prompts/alignment-prompt.md`、`graph-review`→`references/subagent-prompts/graph-review-prompt.md`、`cross-audit`→`references/subagent-prompts/cross-audit-prompt.md`、`final-check`→`references/audit-and-testing.md`
- 这十档的派单正文由机器按模板代填（`workbench_act(action=agent-assign, dispatchKind=…)`）。
- 主笔可调用动作（36）：`create`、`rename`、`set_goal`、`set-knobs`、`delete`、`nudge`、`resume`、`gate`、`explore-confirm`、`outline-confirm`、`chapters-review-confirm`、`final-approve`、`final-redo-items`、`rollback`、`gold-opinion`、`gold-opinion-revoke`、`gold-revise`、`gold-chapter-set`、`gold-draft-approve`、`gold-approve`、`deep-modify`、`deep-undo`、`style-note`、`style-note-revoke`、`intervene`、`intervene-done`、`waive`、`waive-revoke`、`pause`、`graph-opinion`、`audit-submit`、`chapter-assemble`、`stage-submit`、`stage-brief`、`agent-assign`、`progress`
- 用户操作、AI 不可调用的 17 个动作见 §工具面。

## 窄处
- 读了哪些声明面：
  - src/domain-rules.js：ACT_STAGES、PHASES、GATE_TOPIC、gateHuman()、BOOK_PRODUCT_FAMILIES、QUALITY_CHECKS_TAIL_NAMES、LEGACY_DIR_RELS
  - src/workflow/engine.js：PER_CHAPTER、STEP_INPUT_ROWS、STEP_OUTPUT_ROWS、STEP_SUB_OUTPUT_ROWS、NEXT_STAGE_VALUES
  - src/workflow/engine/labels.js：STAGE_LABELS、stageLabel()
  - src/ui/view-rules.js：STAGE_HUMAN（界面 label）
  - src/contract-actions.js：listContractActions()／listAgentActionInputs()
  - src/workflow/dispatch-assembly.js：dispatchKinds()／dispatchKindSpec()
  - src/workflow/artifact-fields.js：artifactDataForGate()
  - src/agent-tool.js：apply() 注册的两个工具定义
- 看不见什么：
  - 只看得见声明面：没进这些常量的代码分支看不见；靠源码字面闭包交叉核对，而它只认 `case '…'` 与 `ctx.tools.register(...name: '…')` 两种形状。
  - 动态构造的名字看不见：变量拼出的 stage、从配置读出的工具名、跨文件别名、helper 返回的分支都不在扫面。
  - `goal` 今天就是缺口：它在 `STAGE_LABELS` 与 `stage-submit`，不在 `ACT_STAGES`／工具 `stage` 枚举／`STAGE_HUMAN`；本投影只把差异钉住，不替它选边。
  - `merge` 的输入行混着一条函数键（`chapterRel`，给小助手的 `auditScope.chapters`），渲染成「声明面为空（已知缺口）」，同格的字符串路径照常渲染；`gate` 的空数组渲染成「无产物」；两者不混，也不手补路径。
  - 质量门名单只是尾段（今天 15 项，现算）：不含条件项、不含 style-spec 追加的 0–2 项；权威是 `runQualityChecks`。
  - UI 面只到 `STAGE_HUMAN`：卡片组件、画廊屏 id、按钮文案不在生成面。
  - 进度账本的边界句是散文：抄自 `src/workflow/engine.js` 的 `progressFreshnessNote()` 口径，不是从声明面派生的——机器改那句时本投影不会自动跟着变。
  - `stages.submit` 是派生的：读不到 `actions/chapters.js` 的 switch，按交办成员 ∪ 标签面求并集；只在 switch 里新增的分支这里看不见。`gaps` 只记「出现在标签/界面面、却不在 `ACT_STAGES`／工具枚举」的阶段。
  - 42 份 references 的散文、`preset/`、`docs/`、`AGENTS.md` 不在面内；老名的逐字清单只许住 `src/domain-rules.js` 的改名记账区（与 `docs/adr/0031`），本投影只给指针。
  - 比较前行尾归一（`\r\n?`→`\n`）；反证只证「比较器会咬」，不证「扫面全」。
- 本次投影里：空产物行＝`gate`（渲染为「无产物」）；非字符串输入行＝`merge`（渲染为「声明面为空（已知缺口）」）。
