# 编排脚本骨架：一章一审（写完整本里「派审计小助手」那一跳）

> **这份文件管什么**：写完整本（铺章）里**审计那一跳**怎么交给 dsh 宿主的 `workflow` 工具（编排脚本）驱动。
> 口径是**一次运行只审一章**：脚本自己派一个干净上下文的审计小助手，收它的结构化结论，
> 把 `{chapter, passed, auditPath}` 带回给主笔 AI。**脚本不推进阶段、不派修复、也不替机器验货。**
>
> - 谁在用：`case 'chapters'` 的交办说明（`src/workflow/engine.js`）点名这份骨架；
>   主笔 AI 交出的是**照它填好的**一份脚本，不是这份文件本身。
> - 宿主那半边的事实（入参四件套、`meta` 白名单、六个全局、`agent()` 选项、上限、失败语义、成员性质）
>   的随库快照是 `docs/reference/dsh-cordis/workflow-编排工具契约摘录.md`（dsh 0.2.0-rc.2）；
>   「暂停即 kill」那条机器路径的登记在 `src/workflow/jobs-contract.js`。**下面的话都从这两份来，不靠猜。**
> - ⚠️ **本骨架的正文尚未真机试跑**：写它的那一票（票 `chapter-audit-orchestration/03`）只交接线与纪律，
>   真机那一幕归票 `chapter-audit-orchestration/05`。跑过一轮之后**回来订正这一份**，别让它停在首稿。

## 一、调用形状（主笔 AI 调 `workflow` 那一下）

| 入参 | 填什么 |
| --- | --- |
| `script` | 下面「三、脚本正文」那一段：**纯 JavaScript 正文**，不是 TypeScript，**不带** `export const meta`；允许 top-level await；以 `return <值>` 结尾，那个 JSON 可序列化的值就是本次工具结果 |
| `meta` | 「二、`meta`」那一块。字段**只有** `name` / `description` / `whenToUse` / `phases` 四个——多一个键，引擎当场逐条点名并**整次运行失败** |
| `args` | `{"chapter": N}`：本次要审的章号。脚本里由全局 `args` 读；**启动时定死，脚本没有输入通道**（要审第 3 章就单开一次运行） |
| `run_in_background` | `true`。长跑走后台 job，结果随 job 的完成通知回来；**工作台「暂停」时被 kill 的就是它**（见下面「五、成员是什么」末两条） |

## 二、`meta`（数据，不是代码）

```js
{
  name: 'chapter-audit',
  description: '一次运行只审一章：派一个干净上下文的审计小助手，它自己落 工作区/audit-NN.md',
  whenToUse: '写完整本里某一章的分片已拼成章正文之后',
  phases: [{ title: '审一章', detail: '派章级审计小助手、收它的结构化结论' }],
}
```

`phase()` 按**逐字相同**的标题匹配 `meta.phases[].title`——所以正文里那一句写 `phase('审一章')`，
别写带章号的标题（章号在 `args` 里，不在占位符里）。

## 三、脚本正文（骨架）

```js
const chapter = args.chapter
const pad = String(chapter).padStart(2, '0')
phase('审一章')

// ① 派发正文：照 resources/references/subagent-prompts/audit-agent-prompt.md 那一份**逐项填满**
//    （章正文路径、材料小节、写作规范、章节骨架与知识地图、风格线、产出契约……按模板的占位符填）。
//    模板在主笔手上、成员拿不到 ⇒ 正文必须整份写进脚本，别指望成员自己去读模板。
const prompt = `…按 audit-agent-prompt.md 填好的整份派发正文…`

// ② 一个成员只审一章。schema 必须是 object 根，且只认
//    type / properties / required / additionalProperties / items / enum / const / oneOf 这几样。
const audit = await agent(prompt, {
  label: `第${chapter}章·审计`,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['chapter', 'passed', 'auditPath'],
    properties: {
      chapter: { type: 'integer' },
      passed: { type: 'boolean' },
      auditPath: { type: 'string' },
    },
  },
})

// ③ 结构化带回：成员自己把 工作区/audit-NN.md 落在盘上（机器按章验货读的就是它），
//    回报里只带结论，**不许把审计报告正文抄回来**（回灌预算的口径见 audit-and-testing.md §九）。
//    拿不到结构化值（provider 没给）时如实回 null——不要替它编一个通过。
return {
  chapter,
  passed: audit?.passed === true,
  auditPath: typeof audit?.auditPath === 'string' ? audit.auditPath : `工作区/audit-${pad}.md`,
}
```

## 四、三条杠杆（写脚本时一条都不能丢）

1. **一次运行只审一章**——不要把 remaining 里几章塞进同一次运行。
2. **审不过就停**：不自行派修复、不重试、不换写法；把 `{chapter, passed, auditPath}` 原样带回，
   该章定点小修由主笔按点名条目**另派干净上下文的成员**（见 audit-and-testing.md §十一 的降级口径）。
3. **脚本里不许再嵌 `workflow`**：成员继承模式里的**全部**工具集，引擎也不传 depth 限制——
   递归扇出是真实风险。⚠️ 这一条**只有纪律、没有机器强制**（宿主没有按工具名的白/黑名单，
   可用的机制只有「挂不挂」），所以它是软边界，靠这条明文与交办里的杠杆兜。

## 五、成员是什么（照快照抄，别猜）

- **one-shot**：`send_message` 回不去（`NOT_RESUMABLE`，报错逐字是「has no supported continuation state」）；
  `interrupt_agent` 对它是**静默 no-op**——没有报错、也没有回执。⇒ 「唤醒优先于重派」在脚本成员这里
  **自动让位**：没有第二轮可唤醒，只剩「另派一个」。
- **不能反向给主笔发消息**：中间过程一个字都不进主笔会话，成员的话只能经 `agent()` 的返回值回到脚本里。
- **审批钉死 `never`**，且拿到模式里的全部工具集（派发时不传 `toolFilter`）。
- **没有会话级 paused 状态**：宿主侧只有 `idle` / `running`。所以「暂停要真停住它」只有 job 取消这一条路
  （工作台点「暂停」时由插件 kill 掉本书 owner 名下在跑的 workflow job，登记见 `src/workflow/jobs-contract.js`）；
  **kill 只到「停止中」，终态等 producer**。
- **整体没有超时**：一次运行跑到它自己完成、失败或被取消。
- **失败是值不是异常**：fatal 错（选项拼错、撞上限）**炸掉整个脚本**；普通失败（成员自己失败、
  某一段抛普通错）只让那一个值变 `null`——所以取返回值时按 `null` 兜。

## 六、边界（机器证不出来的，别在票面上说大了）

- 机器只断**到达事实**：run 结算、`工作区/audit-NN.md` 落盘、该章 `stage-submit(chapters)` 放行。
  **审得对不对、派发模板忠实不忠实、注入时机赶没赶上**归真机层（ADR-0005 的验收幕）。
- 脚本成员**算进** `pausedSubagentsRunning`（暂停那一刻数得着它们）；但「书真的不再长」与
  「主笔不再去 `interrupt_agent` 一个脚本成员」只有真机能验。
- 这一份的**正文**（尤其派发正文怎么填、`args` 之外还要不要带路径）要真机跑过一轮才算定稿。
