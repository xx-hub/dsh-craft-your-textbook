/**
 * 造书工作台 · 对话侧工具（agent 预设行）
 *
 * 让"造书模式"的主笔 AI 真正执行流水线：
 *  - workbench_status：只读，查看当前进度/交办任务/关卡/材料/抽查意见/章节状态
 *  - workbench_act：
 *       · stage-brief   —— 领取机器派给主 AI 的阶段任务（说明 + 方法论 + 产物要求）
 *       · stage-submit  —— 交工（机器逐项验货，合格才放行）
 *       · progress      —— 上报进度（工作台状态卡实时显示）
 *       · 其余为用户代操作（改名/改目标/建书/拍板/回退/重试/删除），
 *         人设要求"用户明确同意后才调用"。
 *
 * 通过本地 webServer 的 /textbook/* 接口与宿主交互（与前端同一通道）。
 * 不 import @deepseek-ai/dsh-tools：agent 上下文可能解析不到，这里自带
 * 参数简写 → JSON Schema 的转换（与 defineTool 等价的最小实现）。
 */
import { appendFileSync } from 'node:fs'
import { join } from 'node:path'
import { CHAPTER_PROGRESS_STAGES, ACT_STAGES, convertedState, progressFieldProblem, CHAPTER_COUNT_POLICY_TEXT } from './domain-rules.js'
import { resolveAgentAction, listAgentActionInputs } from './contract-actions.js'
import { artifactDataForGate } from './workflow/artifact-fields.js'
// 票 `context-budget/18`：`agent-assign` 的档位枚举**逐字从拼装器的数据表派生**——
// 在这里手抄一份「十档」就是第二份会漂的清单（与下面动作名枚举同一条纪律）。
// ⚠️ 2026-10-14 两条 effort 合并：`main` 票 `pre-gold-build/01` 的 `material-survey` 与本 effort
// 票 `knowledge-graph-build/06` 的 `alignment`、票 13 的 `graph-review` **三档都在**（十档）。
import { dispatchKinds } from './workflow/dispatch-assembly.js'

// ── `action` 取值的**枚举骨架从契约面动作目录派生**（票 `deep-module-scan/14`）───────────────
//
// 病：一个工具里并存两份动作清单。顶层 `description` 是提到 28 项的**散文**，而 `action`
// 参数那一格（**模型选值时真正读的那一格**）曾是一份**手写的 16 项**枚举——目录有 28 个
// `agentInput`，两份清单之间**零闭包检查**，目录加一个动作它不会自己长出来。
//
// 「**派生骨架 + 手写散文注解**」两段，注解**留在原处、不在这里重抄**：
//   · 骨架 = 下面这个 join（今天 **36** 项，逐字来自 `agentCallable` 全集）；
//     ⚠️ 这一行的数**曾经漂过**：`gold-draft-approve`（cprb/08）进闭包时它没跟着改，一直写着 33；
//     `rcb-build/06` 把 `graph-opinion` 放进闭包时一并订正（33→35：+`gold-draft-approve`、+`graph-opinion`）；
//     票 `walkthrough-fixes/37` 再加 `final-redo-items`（驳回意见拆条落账）⇒ 36。
//   · 注解 = 工具顶层 `description` 里的两类用法与各动作语义 ＋ 下面各字段自己的说明。
// ⚠️ **不要把它改成别的东西**：派生让「漏抄」不可能，但那**不替代**闸门——
//   `test-agent-tool.mjs` 读**注册后的 def**（不是源码文本）断闭包项数，
//   有人把手写的换回去、或目录加了动作，那道闸当场红。派生与闸门**两道都要**。
// ⚠️ 走查票 09（2026-10-06）另补了**反方向**那一道：描述里**点名的**动作，要么在闭包里、
//   要么在同一处明写「需用户操作，AI 不可调用」——「gold 定稿类」那种含糊点名就是漏过
//   它的形状（同一份判据也在 `test-agent-tool.mjs`）。
const AGENT_ACTION_NAMES = Object.freeze([...listAgentActionInputs()])

/** `agent-assign` 的档位取值（十档；逐字来自拼装器的表，见上面的 import 注释）。参数名 `dispatchKind`。 */
const DISPATCH_KIND_ENUM = dispatchKinds().join('|')

/**
 * `stage-brief`/`stage-submit` 的阶段名（**派生，不是权威源**）。
 *
 * 它此前在本文件里**逐字写了两遍**（`:275` 的参数描述与 `:394` 的早退文案各一份），
 * 改一处忘另一处、模型看到的两句话就会对不上——那次只做了**纯去重**。
 *
 * ⚠️ **权威源今天在 `domain-rules.js`**（票 `depth-review-2026-10/13`）：7 项的唯一手写处是
 *   那边导出的 `ACT_STAGES`，本文件的 `ACT_STAGES`／`ACT_STAGE_ENUM` 都从它派生。
 *   ⚠️ 这里原来那句「**它还不是权威源**」已删——它描述的成因（`domain-rules.js` 里没有可共享
 *   声明、`gate` 归属未定）**今天不成立**；留着会字面变真但仍在说谎。
 *   **别把清单抄回来**：`test-agent-tool.mjs` 那道闸扫整个 `src/**`，第二份手写处当场红
 *   （那道闸的位置与「它够不着什么」写在 `domain-rules.js` 的 `ACT_STAGES` 上面）。
 */
const ACT_STAGE_ENUM = ACT_STAGES.join('|')

export const name = 'textbook-agent-tool'
// ⚠️ 宿主地址那一格读的是**可选**服务 `ctx.get('webApp')`（票 `dsh-contract-drift/14`），
// **不**写进 inject：纯 CLI／headless 面没有它，进了 inject 会让整行工具等一个永远不来的服务、
// 工具直接从模型目录里消失（同一平面纪律见 `src/workflow/actions/books.js` 的 `sessionTitle`）。
export const inject = ['tools']

/** 诊断日志：设置 TEXTBOOK_TOOL_DEBUG=1 时写入 $DSH_HOME/tool-debug.log。 */
function debugLog(payload) {
  try {
    if (typeof process === 'undefined' || process.env === undefined || process.env.TEXTBOOK_TOOL_DEBUG !== '1') return
    const home = process.env.DSH_HOME
    if (typeof home !== 'string' || home === '') return
    appendFileSync(join(home, 'tool-debug.log'), `${new Date().toISOString()} ${JSON.stringify(payload)}\n`)
  } catch { /* 诊断失败不影响功能 */ }
}

/** 参数简写（{ key: {type, required?, description?, enum?, items?} }）→ JSON Schema。 */
function shorthandToJsonSchema(spec) {
  const properties = {}
  const required = []
  for (const [key, def] of Object.entries(spec ?? {})) {
    const prop = { type: def.type }
    if (def.description !== undefined) prop.description = def.description
    if (def.enum !== undefined) prop.enum = def.enum
    if (def.items !== undefined) prop.items = def.items
    properties[key] = prop
    if (def.required === true) required.push(key)
  }
  return {
    type: 'object',
    properties,
    ...(required.length > 0 ? { required } : {}),
    additionalProperties: false,
  }
}

/** 与 defineTool 等价的最小注册形态。 */
function defineToolLocal(options) {
  const userExecute = options.execute
  const userRender = options.output.render
  return {
    name: options.name,
    description: options.description,
    parameters: shorthandToJsonSchema(options.parameters),
    output: {
      schema: options.output.schema,
      render(args, value) { return userRender(args, value) },
    },
    async execute(args, exec) { return userExecute(args, exec) },
  }
}
/**
 * 工作台 base 从哪来：`DSH_WEB_URL`（宿主给受管 shell 的那个变量）> 预设行 `config.baseUrl`
 * > 宿主 `webApp` 服务的 `getAdvertisedUrl()`（票 `dsh-contract-drift/14`）> **不知道**。
 *
 * ⚠️ **票 `dsh-contract-drift/08`（2026-10-29 改）**：第三段原来是**写死的
 * `http://127.0.0.1:3080`**。在 `dsh web` 默认端口那台宿主上它恰好是对的（所以一路活着），
 * 在**非 3080** 的宿主上它会把请求静默发给**另一个宿主或死端口**。桌面版的宿主端口是系统
 * 随机分配的（`--port 0`），2026-10-29 一条造书会话里 `workbench_status` 回的就是
 * `Error: fetch failed`（`fetch` 打到死端口 3080）。
 *
 * ⚠️ **票 `dsh-contract-drift/14`（2026-10-31）**：08 之后桌面版不再静默发错，但**工具整条不可用**——
 * 因为 `process.env.DSH_WEB_URL` 在宿主进程里**从来没有值**（票 08 的根因表：它是 web-app 行
 * 注册进 `shellEnv` 的受管 shell 变量，每次 shell 调用才解析），而预设行也没有 `baseUrl`。
 * 宿主其实**知道自己的地址**：Web 面由 `web-runtime` 行
 * `ctx.provide('webApp', { getAdvertisedUrl })`（dsh `0.2.1-rc.5`，
 * `resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-web-app/lib/index.js`；
 * 取值 `publicUrl ?? webServer.getOrigin()`，与 `DSH_WEB_URL` **同源**）⇒ 第三段改读它。
 *
 * ⇒ 今天**不再猜端口**：三段都拿不到就返回 `null`，由 `requireBaseUrl` 响亮失败。
 * ⛔ 不是「改成 3080 的另一个默认值」，是**承认自己不知道**——判据见 `test-agent-tool.mjs`
 * 「票08／票14」两节（没有 base 时零请求 ＋ 一句说得清的原因）。
 *
 * @param {object} [config] 预设行配置（宿主给的 `config`）
 * @param {object} [ctx] 宿主 ctx（只读 `ctx.get`；可选服务见 {@link advertisedBaseUrl}）
 * @returns {string|null} 去掉尾部斜杠的 base，或 `null`（不知道工作台在哪）
 */
function resolveBaseUrl(config, ctx) {
  if (typeof process !== 'undefined' && process.env !== undefined) {
    const env = process.env.DSH_WEB_URL
    if (typeof env === 'string' && env.trim() !== '') {
      const clean = env.trim().replace(/\/+$/, '')
      if (/^https?:\/\//.test(clean)) return clean
    }
  }
  if (config !== undefined && typeof config.baseUrl === 'string' && config.baseUrl.trim() !== '') {
    return config.baseUrl.trim().replace(/\/+$/, '')
  }
  return advertisedBaseUrl(ctx)
}

/**
 * 宿主自己报出的地址：`webApp.getAdvertisedUrl()`（票 `dsh-contract-drift/14`）。
 *
 * ⚠️ `webApp` 是**可选**宿主服务（Web／桌面面有，纯 CLI／headless 面没有）：⛔ 不进插件的
 * `inject` 声明——与 `sessionTitle`（`src/workflow/actions/books.js:83`）同一条纪律：
 * 进了 inject，整行工具会等一个可能永远不来的服务，工具直接消失。服务缺席、抛错、
 * 或给出的不是 http(s) 地址 ⇒ 返回 `null`，交回 {@link requireBaseUrl} 响亮失败。
 *
 * ⚠️ **两拍解析**：`apply` 那一刻先读一次（离线夹具与探针依赖这一点把请求钉在闭端口上）；
 * 那次没拿到，才在每次 `execute` 重读——服务可能在 preset 行激活之后才就绪。
 *
 * @param {object} [ctx] 宿主 ctx（只读 `ctx.get`）
 * @returns {string|null} 去掉尾部斜杠的 base，或 `null`
 */
function advertisedBaseUrl(ctx) {
  try {
    if (typeof ctx?.get !== 'function') return null
    const webApp = ctx.get('webApp')
    if (webApp === undefined || webApp === null) return null
    const url = typeof webApp.getAdvertisedUrl === 'function' ? webApp.getAdvertisedUrl() : null
    if (typeof url !== 'string' || url.trim() === '') return null
    const clean = url.trim().replace(/\/+$/, '')
    return /^https?:\/\//.test(clean) ? clean : null
  } catch {
    // 宿主服务读失败不许盖过「没配置宿主地址」这句：两种都是「不知道工作台在哪」。
    return null
  }
}

/** 没有 base 时那一句：说清「没配置宿主地址」＋ 三个来源都没给，并点明这不是书的问题。 */
function noBaseUrlMessage() {
  return '没配置宿主地址：宿主进程没有给出 DSH_WEB_URL，宿主 webApp 服务也没有给出地址，预设行也没有配 baseUrl。'
    + '⛔ 不再回落到写死的默认端口 —— 在非默认端口的宿主上那是另一个宿主或死端口。'
    + '这是宿主／配置层的缺口，不是这本书的问题：请把这句话转告维护者。'
}

/** 取 base；拿不到就**响亮失败**（⛔ 不回落到任何端口）。 */
function requireBaseUrl(base) {
  if (base === null) throw new Error(noBaseUrlMessage())
  return base
}

// ── 协作动作的参数规则：**一张表 ＋ 一组取值函数**（票 `depth-review-2026-10/06`）──────────────
//
// 病（票面）：下面那个 `preValidate` 自称「协作动作参数的**单一校验落点**」，而 `stage-submit`
// 六个分支与建书／改名／改目标／拍板／回退五个动作仍把参数校验内联写在 `execute` 的 switch 里。
// 那段代码跑在 `GET /textbook/projects`（switch **之前**那一行）**之后**，于是两件事同时成立：
//   ① 错参要付一次网络往返才失败——「离线早退」在这几类动作上不成立（报错更晚，还白花一次往返）；
//   ② 同一份参数规则写在两处（`preValidate` 的表 ＋ switch 内联），**改一处漏一处是结构性的**。
//
// 现在：**表说「哪些字段必填／可选」，取值函数说「这一格怎么取、怎么归一、不合法抛哪句」**，
// 而这一段**只有一处实现、被调两次**：
//   · `preValidate` 调一次（产物丢掉）——**校验就是「把同一段组装跑一遍」**；
//   · `execute` 的 switch 调一次——组 body。
// ⇒「校验过了但组包缺项」没有第二处可漏（不是纪律，是没有第二个地方可写）。
//
// ⚠️ **报错文案逐字保留**（本票一句都没改）：文案住在各格的 `msg` 里，是从 switch 里搬过来的原文。
// ⚠️ **本表的枚举面比现实窄**，写在这里免得下一个人把它当成全量参数契约：
//   · 只登记**本票从 switch 收上来的**那一族：`stage-submit` 的各分支 ＋ 建书／改名／改目标／
//     拍板／回退。其余动作的校验**早已**住在下面 `preValidate` 的 switch 里（含 `final-approve`
//     那条「approved=false 才要 note」的**条件必填**——它不是一张字段清单能表达的形状），本票不动。
//   · `stage-submit` 的 stage 键**就是 switch 今天那几个分支**（`goal` 那一格由票
//     `goals-handoff-missing/01` 补进来；加它之前 `goals` 在工具这一层根本不存在，见 `fields.goals`
//     那段注记）。`ACT_STAGES` 有 7 项（多一个 `gold`），但 `gold` **没有** stage-submit 分支
//     ⇒ 给它补一条校验＝**新增行为**，不在本票射程。
//     所以未登记的 stage（含 `gold`）照旧**不拦**、原样转发给服务端判——这一格是**故意窄的**。
//   · 表只管**必填／可选与归一**，不管 JSON Schema 的型别声明：那在 `parameters` 那一格，是另一个面。
//   · 服务端那份校验**不删**：离线早退是给 AI 的延迟与引导特性，服务端才是唯一权威（已定案的分层）。
//
// 一格 = `{ msg?, write(body, args) }`：
//   · `write` **合法**时把要转发的值写进 `body`；可选字段缺席时**什么都不写**（＝不进 body）；
//   · 必填那一格缺席／不合法**由运行器按 `msg` 抛**——于是「哪些字段必填」只在 `required` 里说一次，
//     那句原文只在这格的 `msg` 里说一次；
//   · ⚠️ 少数格子**在写但型别不对**要当场抛（`handledReviews`／`styleCheck`）：那是型别错、不是缺席，
//     运行器分不出来，所以它们自己抛。
/**
 * 「一段文本参数」这一格的**同一段判据**（收口 review 规范轴 #6）：谓词 `typeof x === 'string'`
 * ＋ `trim() !== ''`、写法 `trim()` 后赋值，只在这里写一遍；表里那十格与下面 `preValidate` 的
 * 几处都从它派生——原先这一串手抄了 10+ 遍（`git grep -c "trim() !== ''" src/agent-tool.js` ⇒ 21），
 * 改一处漏一处是结构性的。
 *
 * ⚠️ **报错文案逐字不变**：这里只产出一个**写**函数（合法时写进 body、非法时**什么都不写**），
 * 文案仍住在各格自己的 `msg` 里、由 `runParamRow` 按 `required` 抛——本函数一个字都不抛，
 * 免得同一句文案在这里与表里各有一份（那正是这次要消掉的东西）。
 * ⚠️ 判据的实现强度没动：非字符串（数字、对象）依旧不合法；`String()` 那种「先转再看」的写法
 * 会把 `123` 收成 `'123'`，比原先**宽**，所以刻意不这么写。
 */
function trimmedText(body, args, key) {
  const value = args[key]
  // 谓词就一次：复用 {@link hasTrimmedText}，所以「什么算一段文本」在这里与 `preValidate` 同源。
  if (!hasTrimmedText(value)) return
  body[key] = value.trim()
}

/** 「这是不是一段非空文本」——{@link trimmedText} 的谓词那一半。单独取名字是为了让 `preValidate`
 *  里那几处 `need(…)` 复用**同一段判据**（原先手抄 10+ 遍）。两者永远同源：改这里两处一起变。 */
function hasTrimmedText(value) {
  return typeof value === 'string' && value.trim() !== ''
}

/**
 * 一格的取值函数：`write(body, args)` 就是 {@link trimmedText} 那一格（表里的十处共用同一段）。
 * 与 `field.write` 的形状逐字同形，直接放进表里；`required` 那一格缺席／不合法时
 * `body[key]` 仍是 `undefined` ⇒ `runParamRow` 按 `msg` 抛（文案一个字未动）。
 */
function textField(key) {
  return { write: (body, args) => trimmedText(body, args, key) }
}

const ACTION_PARAM_RULES = Object.freeze({
  // ── stage-submit：一张 `stage → { required, optional }` 表（分支逐行见下）＋ 一组取值函数 ──────
  'stage-submit': {
    required: ['stage'],
    fields: {
      stage: {
        msg: `stage-submit 需要 stage（${ACT_STAGE_ENUM}）`,
        write(body, args) {
          const stage = String(args.stage ?? '')
          if (stage !== '') body.stage = stage
        },
      },
      // ── 票 `goals-handoff-missing/01`：站 3 那 3–5 条「学完能做到什么」──────────────────────
      // 病（真宿主 2026-10-26 实测）：服务端 `actions/chapters.js` 的 `case 'goal'` 从
      // `body.goals` 收内容，而**这一张表**（`byStage`）与 `parameters` 里都没有 `goals`
      // ⇒ 工具把它从请求体里丢干净 ⇒ 服务端只看到「没拿到 goals」而 400。主笔在同一格上
      // 重试 37 分钟、145 步、16.2M tokens；另一条独立证据是演示书第 3 站也是 0 条。
      // 强度＝**只验形状**：写了的型别错当场抛（同 `handledReviews`／`styleCheck`，⛔ 不静默不带）；
      // 「一条一句」「够不够可检验」归服务端与人，这里一个字不读。
      goals: {
        msg: '交工 goal 需要 goals（字符串数组，一条一句：学完要能做到什么）',
        write(body, args) {
          if (args.goals === undefined) return
          if (!Array.isArray(args.goals)) {
            throw new Error('goals 需要数组（一条一句的字符串数组，⛔ 不是 JSON 串）')
          }
          body.goals = args.goals
        },
      },
      teachingFocus: {
        msg: '交工 explore 需要 teachingFocus（书级教学重点/难点，纯字符串一条一句）',
        write(body, args) {
          if (Array.isArray(args.teachingFocus) && args.teachingFocus.length > 0) body.teachingFocus = args.teachingFocus
        },
      },
      // 票 `context-budget/17`：主笔只交**书级键**（合并件由机器按各分片拼装，它不是交工输入）。
      // 两件都要非空：本地先拦一次、省一轮往返，并把「该交什么」当场说清（服务端同样 400）。
      chapterSuggestion: {
        msg: `交工 explore 需要 chapterSuggestion（书级章节建议 [{title, source, points}]，${CHAPTER_COUNT_POLICY_TEXT}）`,
        write(body, args) {
          if (Array.isArray(args.chapterSuggestion) && args.chapterSuggestion.length > 0) body.chapterSuggestion = args.chapterSuggestion
        },
      },
      // 票 `reader-cognition-boundary-build/01`：第 4 个书级键「片」（拼接族）。**可选**——
      // 主笔没产也合法（老书／没产那一档 ⇒ 消费侧退化成整书一片，⛔ 不在这里 400）；
      // 但**写了的型别错当场抛**（同 `handledReviews`／`styleCheck` 的先例）：静默不带会让 AI
      // 以为自己交成功了，而片上那条「读者情况」问卷就永远拿不到输入。
      readerSlices: {
        write(body, args) {
          if (args.readerSlices === undefined) return
          if (!Array.isArray(args.readerSlices)) {
            throw new Error('readerSlices（片）需要数组 [{name, description?, members:[知识点 title]}]（每本 ≥1 片、片级非空；成员按 title 引用）')
          }
          body.readerSlices = args.readerSlices
        },
      },
      // gate 三段共用一句文案（今天就是一句：缺哪一段报的都是它）。
      title: { msg: '交工 gate 需要 title/summary/detail 三段', ...textField('title') },
      summary: { msg: '交工 gate 需要 title/summary/detail 三段', ...textField('summary') },
      detail: { msg: '交工 gate 需要 title/summary/detail 三段', ...textField('detail') },
      chaptersJson: {
        msg: '交工 outline 需要 chaptersJson（JSON 数组字符串）',
        ...textField('chaptersJson'),
      },
      // 服务端收 JSON 字符串；样例章建议与理由（下面两格）一并带上。
      // ⚠️ `goldChapter`／`goldChapterReason` 是**可选**（票面曾把这两格写成必填，盘上不是）：
      // 不成形状就整格不转发——**今天就是「静默不带」**，本票不动它（收严＝行为变化）。
      goldChapter: {
        write(body, args) {
          if (Number.isSafeInteger(Number(args.goldChapter))) body.goldChapter = Number(args.goldChapter)
        },
      },
      goldChapterReason: textField('goldChapterReason'),
      // ⚠️ 这里**没有** `>= 1`：同形的 `chapter-assemble`／`gold-chapter-set` 两处有下界，而交工
      // chapters 这一格今天只判「是不是安全整数」。**按现状保留**——收紧是一次行为变化，不在本票。
      chapter: {
        msg: '交工 chapters 需要 chapter（第几章）',
        write(body, args) {
          if (Number.isSafeInteger(Number(args.chapter))) body.chapter = Number(args.chapter)
        },
      },
      handledReviews: {
        // 票 09：交工点名销号——把 handledReviews **原样**透传给服务端（机器只给点名的置为已处置）。
        // 必须是真数组：服务端按 `Array.isArray` 判真假，字符串会被当成「一条都没点名」⇒
        // 这一格**在写但型别不对当场抛**，不是静默不带（缺席才是「不点名」，那是合法的）。
        write(body, args) {
          if (args.handledReviews === undefined) return
          if (!Array.isArray(args.handledReviews)) {
            throw new Error('handledReviews 需要数组 [{id, how}]（每条点名一条抽查意见）')
          }
          body.handledReviews = args.handledReviews
        },
      },
      preface: {
        msg: '交工 merge 需要 preface（前言文本）',
        ...textField('preface'),
      },
      report: {
        msg: '交工 final 需要 report（自查报告）',
        ...textField('report'),
      },
      styleCheck: {
        // 票 08：终检交工转发 styleCheck——这是这条契约的**产品侧唯一发送点**（此前只有测试会写它）。
        // 判据一个字不放宽：漏一条 active 风格线照样由服务端 400 打回；型别不对当场抛（同 handledReviews）。
        write(body, args) {
          if (args.styleCheck === undefined) return
          if (!Array.isArray(args.styleCheck)) {
            throw new Error('styleCheck 需要数组 [{id, status, note?, chapter?}]（每条生效中的风格线一条去向）')
          }
          body.styleCheck = args.styleCheck
        },
      },
      redoCheck: {
        // 票 `walkthrough-fixes/37`：驳回意见的**逐条交代**（与 `styleCheck` 同一形状、同一强度）。
        // 与 styleCheck 一样：缺席不在这里判（拆条没落账时由服务端点名拒收），但**写了的型别错当场抛**
        // ——静默不带会让 AI 以为自己交代过了，而服务端报的是另一件事。
        write(body, args) {
          if (args.redoCheck === undefined) return
          if (!Array.isArray(args.redoCheck)) {
            throw new Error('redoCheck 需要数组 [{item, status, note?, where?}]（对落账的每条驳回意见一条去向）')
          }
          body.redoCheck = args.redoCheck
        },
      },
    },
    // `stage → { required, optional }`：**这一张表**同时决定校验哪几格与组 body 时取哪几格。
    byStage: {
      // 票 `reader-cognition-boundary-build/01`：`readerSlices`（片）是**可选**书级键——
      // 「主笔没产」合法（退化归消费侧现算），所以不进 `required`；交了的形状由服务端 400。
      explore: { required: ['teachingFocus', 'chapterSuggestion'], optional: ['readerSlices'] },
      gate: { required: ['title', 'summary', 'detail'] },
      outline: { required: ['chaptersJson'], optional: ['goldChapter', 'goldChapterReason'] },
      // 票 `goals-handoff-missing/01`：**站 3 这一格此前整行缺席**（`byStage` 里没有 `goal`）
      // ⇒ `body.goals` 既不校验也不转发，服务端永远收不到。它与 `explore` 同一条形状：
      // 内容是主笔唯一的产物，缺了就是「没得可落盘」，必须本地先拦、并把该交什么说清。
      goal: { required: ['goals'] },
      chapters: { required: ['chapter'], optional: ['handledReviews'] },
      merge: { required: ['preface'] },
      final: { required: ['report'], optional: ['styleCheck', 'redoCheck'] },
    },
  },
  // ── 代用户操作：本票从 switch 收上来的五条 ──────────────────────────────────────────────
  'book-create': {
    required: ['name', 'goal'],
    fields: {
      name: { msg: '建书需要书名 name', ...textField('name') },
      goal: { msg: '建书需要学习目标 goal', ...textField('goal') },
    },
  },
  'book-rename': {
    required: ['name'],
    fields: {
      name: { msg: '改名需要新书名 name', ...textField('name') },
    },
  },
  'book-set-goal': {
    required: ['goal'],
    fields: {
      goal: { msg: '改目标需要 goal', ...textField('goal') },
    },
  },
  'gate-decide': {
    required: ['gate', 'version', 'approved'],
    fields: {
      gate: {
        msg: '拍板需要 gate 拍板序号',
        write(body, args) {
          if (args.gate !== undefined && args.gate !== null && args.gate !== '') body.gate = String(args.gate)
        },
      },
      version: {
        msg: '拍板需要 version 版本号',
        write(body, args) {
          if (typeof args.version === 'number') body.version = args.version
        },
      },
      approved: {
        msg: '拍板需要 approved（true=通过/false=驳回）',
        write(body, args) {
          if (typeof args.approved === 'boolean') body.approved = args.approved
        },
      },
    },
  },
  rollback: {
    required: ['snapshot'],
    fields: {
      snapshot: {
        msg: '回退需要 snapshot 序号',
        write(body, args) {
          if (Number.isSafeInteger(Number(args.snapshot))) body.snapshot = Number(args.snapshot)
        },
      },
    },
  },
  // ── 票 `walkthrough-fixes/37`：驳回意见的拆条落账 ──────────────────────────────────────
  // 只做**参数形状**（`redoItems` 必须是数组）；「每段是不是意见原文的连续一段」「顺序对不对」
  // 由服务端那一处判（`src/workflow/final-redo.js`）——⛔ 不在这里手抄第二份判据。
  'final-redo-items': {
    required: ['redoItems'],
    fields: {
      redoItems: {
        msg: 'final-redo-items 需要 redoItems（数组：把用户那句意见拆成若干段，每段是意见原文的连续一段）',
        write(body, args) {
          if (args.redoItems === undefined) return
          if (!Array.isArray(args.redoItems)) {
            throw new Error('redoItems 需要数组（每段是意见原文里的连续一段）')
          }
          body.redoItems = args.redoItems
        },
      },
    },
  },
  // ── 票 `reader-cognition-boundary-build/06`：图上「意见」通路进 AI 闭包的那一格 ────────────────
  // 只做**参数形状**（必填 `key`／`verdict`）：取值域（`不讲`／`要讲`、两档理由）仍由服务端那
  // 唯一一处判（`actions/chapters.js` 的 `case 'graph-opinion'`）——⛔ 不在这里手抄第二份闭集。
  // ⚠️ 理由档那一格**叫 `verdictReason`**（映回载荷的 `reason`）：`reason` 今天归 `pause`，
  //    复用会把「中断原因」与「排除理由」记成同一个词（`CONTEXT.md` 一号三用那条纪律）。
  'graph-opinion': {
    required: ['key', 'verdict'],
    fields: {
      key: { msg: '图上意见需要 key（知识地图上那张卡的卡键）', ...textField('key') },
      verdict: {
        msg: '图上意见需要 verdict（不讲／要讲）',
        write(body, args) {
          if (hasTrimmedText(args.verdict)) body.verdict = args.verdict.trim()
        },
      },
      verdictReason: {
        // 可选：不写＝服务端按缺省那一档（`不需要`）记；代笔那一跳**必须**显式写 `已经会`。
        write(body, args) {
          if (hasTrimmedText(args.verdictReason)) body.reason = args.verdictReason.trim()
        },
      },
    },
  },
})

/**
 * 跑一行的字段规则：`required` 里的格子缺席／不合法 ⇒ 按该格的 `msg` 抛；
 * `optional` 里的格子缺席就**不进 body**（＝今天那些 `...(cond ? { k: v } : {})`）。
 */
function runParamRow(fields, row, body, args) {
  for (const key of [...row.required, ...(row.optional ?? [])]) fields[key].write(body, args)
  for (const key of row.required) {
    if (body[key] === undefined) throw new Error(fields[key].msg)
  }
  return body
}

/** 组一条代用户操作动作的 body（值全由表给；`preValidate` 跑的就是这一段）。 */
function actionParamsBody(actionName, args) {
  const rule = ACTION_PARAM_RULES[actionName]
  if (rule === undefined) throw new Error(`参数规则表里没有登记的动作: ${actionName}`)
  return runParamRow(rule.fields, rule, {}, args)
}

/** 组 `stage-submit` 的 body：先 `stage`（必填），再按 stage 那一行取字段（同一张表的第二层）。 */
function stageSubmitBody(args) {
  const rule = ACTION_PARAM_RULES['stage-submit']
  const body = runParamRow(rule.fields, rule, {}, args)
  const row = rule.byStage[body.stage]
  // 未登记的 stage（含 `gold`）：**照今天**——不拦、原样转发给服务端判（表故意比现实窄）。
  return row === undefined ? body : runParamRow(rule.fields, row, body, args)
}

/**
 * 协作动作的本地预校验：不联网即可拦下明显错参（也便于测试；错误信息要能指导 AI 下一步怎么引导用户）。
 * 这是协作动作参数的**单一校验落点**：execute switch 只负责组 body、不再重复校验——改参数规则只改这一处。
 *
 * ⚠️ 票 `depth-review-2026-10/06` **之前**这句话不成立：`stage-submit` 六个分支与建书／改名／
 *   改目标／拍板／回退把参数校验内联写在 switch 里（跑在 `GET /textbook/projects` **之后**）。
 *   那几族现在收进上面那张 `ACTION_PARAM_RULES` 表——本函数跑的就是 switch 组 body 的**同一段**。
 * ⚠️ 仍住在本函数下面那个 switch 里的：`final-approve` 的**条件必填**（表表达不了的形状）等。
 * ⚠️ **状态**错不在这里：`这个会话还没有书` 在 `execute` 里、projects 查询**之后**报出——
 *   它是状态错不是参数错，本票没动它（离线早退只覆盖参数错）。
 */
function preValidate(actionName, args) {
  // 表驱动的那一族（票 `depth-review-2026-10/06`）：跑的就是 execute 组 body 的**同一段代码**
  // ——产物丢掉、校验留下。所以「校验过了但组包缺项」在这里没有第二处可漏。
  if (actionName === 'stage-submit') { stageSubmitBody(args); return }
  if (ACTION_PARAM_RULES[actionName] !== undefined) { actionParamsBody(actionName, args); return }
  const need = (cond, msg) => { if (!cond) throw new Error(msg) }
  switch (actionName) {
    case 'agent-assign': {
      // 票 `context-budget/18`：派单的形状与本书实际值都由机器代填 ⇒ 缺档位／缺对应的号
      // 必须在**发出第一个请求之前**就被拦下（服务端同样会拒，但那一轮往返是白花的）。
      // ⚠️ 参数名是 `dispatchKind`（**不是** `kind`）：`kind` 已被 `gold-opinion` 占（意见类型），
      // 一词两义正是本票 `(a)` 要治的病（code-review 规范轴 findings ⑦）。
      const kinds = dispatchKinds()
      need(typeof args.dispatchKind === 'string' && kinds.includes(args.dispatchKind),
        `agent-assign 需要 dispatchKind（${kinds.join('|')}）`)
      const positive = (value) => Number.isSafeInteger(Number(value)) && Number(value) >= 1
      if (args.dispatchKind === 'writing' || args.dispatchKind === 'audit') {
        need(positive(args.chapter), `agent-assign(dispatchKind=${args.dispatchKind}) 需要 chapter（第几章，1 起）`)
      }
      // ⚠️ `shard` 是**可选**的，但填了就必须合法：它决定落盘分片号，静默归一成 1 会把两路
      // 写进同一片（服务端同样按「缺＝1、填错＝400」断，这里是同一个口径的本地早退）。
      if (args.shard !== undefined && args.shard !== null && args.dispatchKind === 'writing') {
        need(positive(args.shard), 'agent-assign(shard) 需要第几号分片（1 起；不拆成多路就不用填）')
      }
      if (args.dispatchKind === 'close-reading') need(positive(args.material), 'agent-assign(dispatchKind=close-reading) 需要 material（材料序号，1 起）')
      if (args.dispatchKind === 'final-check') need(positive(args.scope), 'agent-assign(dispatchKind=final-check) 需要 scope（分路序号，1 起）')
      break
    }
    case 'progress': {
      // 票 `pre-gold-build/12` · 债-11：越界 `chapter`／枚举外 `stage` 以前**静默丢**
      // （展开成 `{}` 不转发），AI 看不见自己写错了。今天**离线拒收并点名**——
      // 判据的单一出处是 `domain-rules.progressFieldProblem`（上限那一半要读书，这里读不到，
      // 所以工具面只判形状、上限由服务端在同一条判据上补）。一个请求都不发。
      const problem = progressFieldProblem(args.chapter, args.stage)
      need(problem === null, problem ?? '')
      break
    }
    case 'style-note':
      need(hasTrimmedText(args.text), 'style-note 需要 text（风格意见内容）')
      break
    case 'intervene':
      need(hasTrimmedText(args.text), 'intervene 需要 text（留言内容）')
      break
    case 'waive':
      need(typeof args.item === 'string' && args.item !== '', 'waive 需要 item（豁免项）')
      need(hasTrimmedText(args.userNote),
        '豁免必须由用户手输原因（userNote）才能放行；请用户在对话里直接说明，你转交后再调用')
      // 票 `walkthrough-fixes/23`（2026-10-06 裁决）：豁免作用域＝**哪一条检查／哪本书／哪一章**。
      // `item=other` 时机器不知道该放行哪一条 ⇒ 本地先拦（不联网、一个请求都不发），
      // 理由与 `explore-confirm` 那一格同：缺参的服务端行为要么静默、要么让人多跑一趟。
      need(args.item !== 'other' || (typeof args.note === 'string' && args.note.trim() !== ''),
        '豁免「其他」必须点名放行的是哪一条检查（note，如「无重复标题」）——一次只放行点名的那一条，不知道是哪一条就别用它')
      break
    case 'style-note-revoke':
    case 'waive-revoke':
    case 'intervene-done':
    case 'gold-opinion-revoke':
      need(typeof args.id === 'string' && args.id !== '', `${actionName} 需要 id`)
      break
    case 'gold-opinion':
      need(['dislike', 'drop', 'change'].includes(args.kind), 'gold-opinion 需要 kind（dislike|drop|change）')
      need(hasTrimmedText(args.wish), 'gold-opinion 需要 wish（一句话说明）')
      break
    case 'gold-chapter-set':
      need(Number.isSafeInteger(Number(args.chapter)) && Number(args.chapter) >= 1, 'gold-chapter-set 需要 chapter（目标样例章章号，1 基）')
      break
    case 'outline-confirm':
      need(typeof args.approved === 'boolean', 'outline-confirm 需要 approved（true/false）')
      break
    case 'explore-confirm':
      // 走查票 09：探查结果确认（true=进设计；false=归档重做、可带一句哪里不满意）。
      // ⚠️ 这一格**必须**有：服务端 `gates.js` 那一支是 `body.approved === true`，
      // 缺参**静默按「驳回重做」**走——本地先拦，免得 AI 漏参把用户的探查结果归档掉。
      // ⚠️ code-review 规格轴 C1（2026-10-06）：这里**只断 `approved`**，`note` 是**可选**的
      // ——工作台那条路故意允许不填（`src/ui/confirm-cards.js` 逐字写着「不填也能重做」，
      // `client-entry.js` 也照旧发 `note: ""`）。所以**文案必须与这条实现等强**：
      // 原先那句「必带一句哪里不满意」是**声称比实现强**（code-review 对票 `walkthrough-2026-10/09` 的 C1）。
      // ⛔ 没有把它改成「真拦」：那要服务端也把 note 断成非空，等于**收掉一条界面已承诺的通路**。
      need(typeof args.approved === 'boolean', 'explore-confirm 需要 approved（true=满意继续，false=让 AI 重做；note 是可选的一句哪里不满意，不填也能重做）')
      break
    case 'gold-draft-approve':
      // 票 `confirm-points-redesign-build/08`：站 8「这一稿行不行」的表态
      // （true=「就用这一稿」；false=「不满意，重写这一章」）。两支都落 `工作区/决策/08.json`，
      // ⛔ 都不推进阶段——定稿仍是 `gold-approve`（站 9 之后那一下）。
      need(typeof args.approved === 'boolean', 'gold-draft-approve 需要 approved（true=就用这一稿，false=不满意，重写这一章）')
      break
    case 'gold-approve':
      // 走查票 09：范例章定稿确认（true=继续写全书；false=推翻重写）。
      need(typeof args.approved === 'boolean', 'gold-approve 需要 approved（true=定稿继续，false=推翻重写）')
      break
    case 'chapters-review-confirm':
      need(typeof args.approved === 'boolean', 'chapters-review-confirm 需要 approved（true=都过了，开始合并）')
      break
    case 'final-approve':
      need(typeof args.approved === 'boolean', 'final-approve 需要 approved（true=认可最后检查结果，交付；false=驳回，需 note）')
      if (args.approved === false) need(hasTrimmedText(args.note), 'final-approve approved=false 需要 note（对整本书的改进意见）')
      break
    case 'deep-modify':
      need(typeof args.segment === 'string' && args.segment !== '', 'deep-modify 需要 segment（历史段 key，如 outline/chapter-2）')
      need(hasTrimmedText(args.note), 'deep-modify 需要 note（这次要改什么）')
      break
    case 'audit-submit':
      // 不带 auditJson 就验书里那份 工作区/audit-NN.md；带了必须是 JSON 字符串（服务端按字符串判真假）。
      need(args.auditJson === undefined || typeof args.auditJson === 'string',
        'audit-submit 的 auditJson 必须是 JSON 字符串（或省略——机器直接验书里的 工作区/audit-NN.md）')
      break
    case 'chapter-assemble':
      // 票 `walkthrough-2026-10/02`：机器拼章正文。缺 chapter 本地就拦（一个请求都不发）。
      need(Number.isSafeInteger(Number(args.chapter)) && Number(args.chapter) >= 1,
        'chapter-assemble 需要 chapter（让机器拼第几章的正文，1 基）')
      break
    default:
      break
  }
}

async function fetchJson(fetchImpl, url, options) {
  debugLog({ stage: 'fetch', url })
  let res
  try {
    res = await fetchImpl(url, options ?? { headers: { Accept: 'application/json' } })
  } catch (error) {
    debugLog({ stage: 'fetch-error', url, message: String(error?.message ?? error) })
    throw error
  }
  let json = null
  try { json = await res.json() } catch { json = null }
  debugLog({ stage: 'fetch-done', url, status: res.status, json })
  if (!res.ok) throw new Error((json !== null && typeof json.error === 'string' ? json.error : '') || `HTTP ${res.status}`)
  return json
}

function sessionIdOf(exec) {
  const id = exec?.agent?.session?.id
  if (typeof id !== 'string' || id === '') throw new Error('拿不到当前会话，请确认在造书模式会话里使用')
  return id
}

function renderText(args, value) {
  return [{ type: 'text', text: JSON.stringify(value, null, 1) }]
}

// ── `workbench_status` 按工序切片（票 `context-budget/09` · spec 实现决策 15）──────────────
//
// 病：这一份返回把整本书的快照每次都整份回给主笔 AI。15 次调用的回包**正文**合计 70,178 字符，
// 而单次最大那一回里「整份关卡方案」与「整份自查报告」两件**一旦定下就不再变**的东西占了
// 65.6%–66.5%。数字与三档口径（正文／整条消息／字段级 pretty+compact）见
// `.scratch/context-budget/evidence/workbench-status-session-98d830e6.json`。
//
// 下面三件事各改一刀：**大件改指针**（`gateDetailPointer`）、**按工序投影**（`STATUS_SLICE`）、
// **顺手按条目状态过滤**（`liveItems`）。其余 19 个键常驻。
//
// ⚠️ **判定用阶段号，不用 `pendingStage`**：后者只是「机器此刻派了哪一步活」，等用户拍板／
//   等机器跑的时候它是 null，而切片要答的是「这本书现在走到哪一段」——阶段号在那一刻照样在
//   （六阶段的权威表是 `domain-rules.PHASES`，状态返回里已有 `project.phase`）。
const STATUS_SLICE = Object.freeze([
  { key: 'sources', phases: [1, 2], why: '材料清单只在材料准备／读材料挑重点这两段要用来派精读；后面几段的交办说明自己带 `materials`' },
  { key: 'pendingReviews', phases: [5], why: '要销号的工序是章交工（写完整本），机器也只在这一步按 status 为 pending 的那批拦' },
  { key: 'styleNotes', phases: [6], why: '要交代去向的工序是最后检查，机器也只在这一步按 status 为 active 的那批拦' },
])

/** 当前阶段用不用某个切片键。表里没有登记的键一律当常驻键（漏登记＝照旧给，不是照旧不给）。 */
function sliceIncludes(key, phase) {
  const row = STATUS_SLICE.find((entry) => entry.key === key)
  return row !== undefined && row.phases.includes(phase)
}

/**
 * 按条目 `status` 取「还活着的那一批」。
 *
 * ⚠️ **过滤只能按条目状态，不能按「读过没读过」**：`ADR-0010` 明写状态面永远不会有
 * 「用户看没看过」字段，全仓也没有读取游标 ⇒ 引入「已读」语义就是凭空造一个不存在的事实。
 */
function liveItems(list, status) {
  return (Array.isArray(list) ? list : []).filter((item) => item?.status === status)
}

/**
 * 关卡方案改**指针**：路径 ＋ 字符数，不再把整份 Markdown 内联回主笔 AI 的上下文。
 *
 * 路径**不在本文件手写**——它从 `artifactDataForGate`（账本事件产物字段的单一出处）派生，
 * 再拼到读通道随包给的那个真实书夹目录上，所以主笔 AI 可以直接拿它去 `read` 全文。
 * ⚠️ 拿不到书夹目录、或提案号／版次不成形状（老书／坏数据）时给 `null`：
 *   返回一个自己并不存在的地址，比不给更坏（那正是「指针指向不存在的文件」这个病的形状）。
 */
function gateDetailPointer(gate, bookDir) {
  const text = typeof gate.detail === 'string' ? gate.detail : ''
  if (text === '') return null
  if (typeof bookDir !== 'string' || bookDir === '') return null
  const { path: rel } = artifactDataForGate(gate.gate, gate.version)
  if (rel === undefined) return null
  return { path: join(bookDir, rel).replace(/\\/g, '/'), chars: text.length }
}

/**
 * 最后检查的自查报告改**指针** ＋ 摘要（票 `context-budget/12` · 承接票 `09` 让出的那一步）。
 *
 * ⚠️ **顺序不能反**（票 09 的原话）：这份指针指向的是**机器拼出来的那份条目并集**，
 * 落盘发生在 `stage-submit final`／`stage-brief` 两个面（`final-audit-summary.js`）——
 * 票 09 若先改，它会指向一个还不存在的文件。
 *
 * 三档形状，**逐档说清**（判据逐条点名，不合并成一句「形状不对」）：
 * · `null` —— 还没到最后检查这一步（`meta.finalReport` 是空的）。
 * · 指针 —— `{ path, chars, summary }`。`path` 是**书夹相对路径**（逐字取自
 *   `domain-rules.finalAuditSummaryRel`，本文件不手写文件名）；`chars` 是那份文件的字符数；
 *   `summary` 是人话摘要（**不含全文**）。
 * · 老书那一档 —— 票 12 之前 `meta.finalReport` 是**整份全文字符串**。那一份全文仍在账本事件
 *   `textbook/ai-report` 里（那本来就是展示面的来源），所以这里给一个 `path: null` 的指针 ＋ 一句
 *   「全文在账本事件里」的摘要，**不把老书那份全文又内联回上下文**——那正是这一刀要砍掉的东西。
 *
 * @param unknown stored `meta.finalReport`
 * @returns {{path: string|null, chars: number|null, summary: string}|null}
 */
function finalReportPointer(stored) {
  if (stored === null || stored === undefined) return null
  if (typeof stored === 'object' && !Array.isArray(stored)) {
    const path = typeof stored.path === 'string' && stored.path !== '' ? stored.path : null
    const chars = Number.isSafeInteger(stored.chars) ? stored.chars : null
    const summary = typeof stored.summary === 'string' ? stored.summary : ''
    return { path, chars, summary }
  }
  return {
    path: null,
    chars: null,
    summary: '最后检查自查报告（这本书交工时还没有拼装条目并集那份；全文在账本事件里）',
  }
}

/** 从 events 接口取项目详情（含交办/章节/探查摘要等）。 */
async function fetchProjectDetail(fetchImpl, base, sessionId, projectId) {
  return fetchJson(
    fetchImpl,
    `${base}/textbook/events?session=${encodeURIComponent(sessionId)}&project=${encodeURIComponent(projectId)}`)
}

/**
 * 注册本插件的工具行。
 *
 * @param ctx 宿主 ctx（只读 `ctx.tools`；另读**可选**服务 `ctx.get('webApp')`，见 {@link advertisedBaseUrl}）。
 * @param config 宿主给的配置；`baseUrl` 是**回落链的一环**，不是唯一出处。
 * @param deps **internal seam**（票 `deep-module-scan/17`）：`deps.fetchImpl` 让测试把自己那张
 *   传输递进来，而不是替换 `globalThis.fetch`。**不进任何 caller 要知道的 interface**——
 *   照 `src/ui/artifact-read.js:35-36` 的既有口径（`createArtifactReader({ fetchImpl })`）。
 *
 *   ⚠️ **`resolveBaseUrl` 的优先级链今天是 `DSH_WEB_URL` > `config.baseUrl`
 *   > 宿主 `webApp.getAdvertisedUrl()` > 响亮失败**（票 `dsh-contract-drift/08`，2026-10-29；
 *   第三段由票 `dsh-contract-drift/14` 补上）：最后那句「回落到写死的 `3080`」不再有了——那在
 *   桌面版（随机端口）上是另一个宿主／死端口。拿不到 base 时**一次请求都不发**、回一句说清原因
 *   的错误。判据是 `test-agent-tool.mjs` 「票08／票14」两节（零请求 ＋ 原因句）。
 *
 *   ⚠️ **地址分两拍解析**（票 14）：`apply` 时先解析一次（探针／离线夹具靠这一刻的 env 把请求
 *   钉在闭端口上）；**那一刻拿不到**才在每次 `execute` 重试——宿主 `webApp` 服务可能比 preset 行
 *   晚就绪，抓一次会把地址永久冻成 `null`。两拍都拿不到 ⇒ 零请求 ＋ 响亮失败。
 *
 *   ⚠️ **`workbench_act` 里目录认得的动作先跑本地入参校验、再取 base**（票 `dsh-contract-drift/13`）：
 *   地址缺失不许把「缺 userNote」这类本地错参遮住；反过来「入参合法 ＋ 地址缺失」仍是零请求的
 *   响亮失败。那一格同时钉在 `test-agent-tool.mjs`「票08」第 ⑦ 条与 `test-collab-backend.mjs` 的两条原判据上。
 *
 *   ⚠️ **每次调用时才解析 transport**，不是在 `apply` 里抓一次：那才是今天的行为
 *   （`fetch(...)` 读的是**调用那一刻**的全局）。若在这里抓一次引用，`apply` 之后才替换
 *   `globalThis.fetch` 的那批测试会全部失灵——而那正是本仓最常见的那种替换。
 */
function apply(ctx, config, deps) {
  // 地址先在这里解析一次：探针／离线夹具靠「apply 那一刻的 env」把请求钉在闭端口上
  //（`dev/host-contract-gate/web-target.js` 那一段就是读完立刻恢复 env 的）。apply 那一刻
  // 拿不到（null）才在每次 `execute` 重试——宿主 `webApp` 服务可能比 preset 行晚就绪。
  const baseUrlAtApply = resolveBaseUrl(config, ctx)
  const transport = (url, options) => (deps?.fetchImpl ?? globalThis.fetch)(url, options)

  ctx.tools.register(defineToolLocal({
    name: 'workbench_status',
    description: '查看造书工作台当前的真实状态：有没有书、进行到第几步、机器在等谁、当前交给你 AI 的任务（pendingStage）、是否在等你拍板、抽查意见、各章进度、书文件夹在哪。回答用户关于"现在进行到哪一步/面板上是什么"的问题前必查（尤其交工前查一遍有没有新抽查意见），不要凭记忆猜。⚠️ 返回按**当前工序**切片：sources 只在材料准备／读材料挑重点给，pendingReviews 只在写完整本给，styleNotes 只在最后检查给——某个键缺席说明这一段用不到它，不是读取失败，也不要为了找它反复调本工具。gate.detail 是指针（{path, chars}），要方案全文自己 read 那个 path。',
    parameters: {},
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: renderText,
    },
    async execute(args, exec) {
      const sessionId = sessionIdOf(exec)
      const base = requireBaseUrl(baseUrlAtApply ?? resolveBaseUrl(config, ctx))
      debugLog({ stage: 'status-start', base, sessionId, agent: exec?.agent?.id ?? exec?.agent?.session?.id })
      const list = await fetchJson(transport, `${base}/textbook/projects?session=${encodeURIComponent(sessionId)}`)
      const projects = list.projects ?? []
      debugLog({ stage: 'status-projects', count: projects.length })
      if (projects.length === 0) {
        const out = { hasBook: false, sessionId, message: '这个会话还没有书，工作台已打开建档向导（书名 + 学习目标必填），引导用户在向导里建书或先建演示书。' }
        debugLog({ stage: 'status-return', out })
        return out
      }
      const meta = projects[0]
      const detail = await fetchProjectDetail(transport, base, sessionId, meta.id)
      const events = detail.events ?? []
      const last = events.length > 0 ? events[events.length - 1] : null
      const gate = detail.gate ?? null
      const bookDir = detail.dir ?? null
      const phase = Number.isSafeInteger(meta.phase) ? meta.phase : 1
      return {
        hasBook: true,
        sessionId,
        project: {
          id: meta.id,
          name: meta.name,
          goal: meta.goal ?? '',
          phase,
          status: meta.status ?? 'active',
          route: meta.route ?? 'blueprint',
          science: meta.science === true,
          folder: meta.folder ?? null,
          dir: bookDir,
        },
        // 切片 ①：材料清单只在材料准备／读材料挑重点（理由见 STATUS_SLICE）。
        // ⚠️ 票 `pre-gold-build/02`：这里**不再下发 `role`**——角色的唯一住处是探查段开头那一趟
        // 书级材料判定产出的 `工作区/材料判定.json`（⛔ 不回落 `meta.sources[].role`：老书留下的
        // 老值只读、不冒充新事实）。主笔拿到角色有两条路：自己读那份判定产物，或看 brief 的
        // `materials[].role`／`parallelReads[].role`（都由机器按判定产物并进去）。
        ...(sliceIncludes('sources', phase) ? {
          sources: (meta.sources ?? []).map((source) => ({
            file: source.file,
            // 三值枚举投影（票 `mineru-formats/02`）：主笔 AI 看得见「转失败了」这件事，
            // 不再像从前那样只拿到一个「转没转成」的真假。老书布尔由 convertedState 只读归一。
            converted: convertedState(source),
          })),
        } : {}),
        // 机器在等谁：pendingStage != null → 等你 AI 动手；awaiting-explore/awaiting-gold/awaiting-chapters-review/awaiting-final-approval → 等用户；关卡 awaiting → 等用户拍板。
        pendingStage: detail.pendingStage ?? null,
        pendingGate: detail.pendingGate ?? null,
        stageLabel: detail.pendingStage ?? null,
        awaitingUser: ['awaiting-explore', 'awaiting-gold', 'awaiting-chapters-review', 'awaiting-final-approval'].includes(meta.status)
          || (gate !== null && gate.status === 'awaiting'),
        gate: gate === null ? null : {
          gate: gate.gate,
          version: gate.version,
          status: gate.status,
          title: gate.title ?? '',
          // 摘要原样保留：它就是给「要不要读全文」这一句判断用的（票 09 决策 15「大件改摘要＋路径」）。
          summary: gate.summary ?? '',
          // 方案全文改指针 `{ path, chars }`（票 09）：要全文自己 `read` 那个路径。
          detail: gateDetailPointer(gate, bookDir),
          awaiting: gate.status === 'awaiting',
          rejected: gate.status === 'rejected',
          reasons: gate.decision?.reasons ?? [],
          note: gate.decision?.note ?? '',
        },
        // 切片 ②：抽查意见只在写完整本（要销号的那一步），且只给**待处置**那批。
        ...(sliceIncludes('pendingReviews', phase) ? {
          pendingReviews: liveItems(detail.pendingReviews, 'pending'),
        } : {}),
        chapterStatus: Array.isArray(detail.chapterStatus) ? detail.chapterStatus : [],
        exploreSummary: detail.exploreSummary ?? null,
        // ⚠️ `finalReport` **已指针化**（票 `context-budget/12` 承接票 `09` 让出的那一步）：
        // 回包只给「路径 ＋ 字符数 ＋ 摘要」，要全文自己去 `read` 那个路径。
        // 指向的是**机器拼的那份条目并集**（五份分查的点名条目，去重不丢不重），
        // 不是自查报告本身——自查报告全文随交工上送、逐字进账本事件 `textbook/ai-report`，
        // 而给用户看的那份仍然是五份的汇总（`CONTEXT.md`「终检结果认可」，用户故事 36）。
        finalReport: finalReportPointer(detail.finalReport ?? null),
        lastEvent: last === null ? null : { type: last.type, text: last.data?.text ?? last.data?.label ?? last.data?.title ?? '' },
        paused: detail.meta?.pause != null ? { ...detail.meta.pause } : null,
        // 票 dsh-contract-drift/01 的载体：**按下暂停时还有几条子会话在跑**这个事实（暂停那一刻记下的）。
        // 只有那个数，不含名字/编号——要看是哪几个，你自己有 list_agents。
        // ⚠️ 票 `chapter-audit-orchestration/04` 查实的口径：这个数**比「小助手」宽**——它**含编排脚本
        // 的成员**（脚本成员在宿主的 `listDescendants` 眼里与小助手同形：同 `parentSession`、
        // 同 `origin: 'subagent'`、活的时候同 `activity: 'running'`），而 `interrupt_agent` 对脚本成员
        // 是**静默空操作**。票 04 起暂停自己会 kill 掉那些脚本（连带 abort 成员），所以对着这个数去
        // `list_agents` 时看到脚本成员**不必**去收（口径见 `CONTEXT.md`「暂停」词条）。它记的是
        // kill **之前**那一刻的数（「先数、再 kill」是口径的一部分）。
        // 取值只有两种：**0**＝数出来了、确实一条都没在跑；**null**＝没暂停过，或**当时数不出来**
        // （宿主小助手服务缺席 / 调用抛错，见 `workflow/actions/collab-signals.js` 的 `countRunningSubagents`）。
        // 拿不准就查一遍 `list_agents`，别把「没显示」当「没有」。
        // ⚠️ 它**常驻**：暂停时该不该收回小助手是判据，票 09 的切片不许碰它（handoff §5.4 第 ③ 条）。
        pausedSubagentsRunning: detail.meta?.pause?.subagentsRunning ?? null,
        // 切片 ③：风格线只在最后检查（要逐条交代去向的那一步），且只给**生效中**那批——
        // 机器的终检验货也是按 `status === 'active'` 点名要交代的那几条（`chapters.js` 的 final 分支），
        // 两边同口径，AI 照这一份点名就够。`superseded`（用户收回）与已翻转的 `adopted`／`conflict` 挡掉。
        ...(sliceIncludes('styleNotes', phase) ? {
          styleNotes: liveItems(detail.meta?.styleNotes, 'active')
            .map((n) => ({ id: n.id, text: n.text, status: n.status, note: n.note ?? null })),
        } : {}),
        waivers: detail.meta?.waivers ?? [],
        // ⚠️ 留言**常驻**：它是「许愿级的协作信号」，交办说明（brief.hints）在铺章与最后检查两段
        // 都要靠它提醒「先处理再继续」（`engine.js` 的两处 hint），而那是状态返回之外的载体。
        // 读通道那一侧已经按 `status === 'pending'` 过滤过（`workflow.js` 的 `/textbook/events`），
        // 本工具原样透传，不自己再写一份口径。
        pendingInterventions: detail.pendingInterventions ?? [],
        outline: { awaiting: detail.meta?.status === 'awaiting-outline', redoNote: detail.meta?.outlineRedoNote ?? null },
        gold: {
          awaiting: detail.meta?.status === 'awaiting-gold',
          opinions: (detail.meta?.goldOpinions ?? []).filter((o) => o.status !== 'revoked'),
          sealed: detail.meta?.goldSealed ?? null,
        },
        // 全章过目闸门（F18）：全章写完后等用户过目；chaptersReviewed 旧书无字段按 false 兜底。
        chapters: {
          awaitingReview: detail.meta?.status === 'awaiting-chapters-review',
          reviewed: (detail.meta?.chaptersReviewed ?? false) === true,
        },
      }
    },
  }))

  ctx.tools.register(defineToolLocal({
    name: 'workbench_act',
    description: '与造书工作台交互。三类用法：① 流水线内务（机器派给你的活）：stage-brief 领任务说明、progress 上报进度、audit-submit 把范例章审计结论交给机器即时验形状、chapter-assemble 让机器把这一章的分片拼成正文（写作小助手只落分片，章正文由机器拼；**派审计小助手之前**先叫这一步，审计读的就是拼出来的那一份）、agent-assign **派单**（九份派发模板 ＋ 最后检查分查那一档对应的那一族小助手：你只给 dispatchKind ＋ 章号/材料号/分路号 ＋ 一句叮嘱，**整份派单 prompt 由机器按模板与本书实际值代填**，你不再自己手抄——`tool/call` 的入参永不被剪枝，所以那一笔是整场永久占着上下文的）、stage-submit 交工——这几类直接调用，不需要征求用户同意；② 代用户操作（改书名/改目标/改并发上限/建书/拍板/探查确认/范例章定稿/回退/重试/删除/最后检查认可）——仅在用户明确同意后调用。③ **代笔**（`graph-opinion`）：读者情况问卷回卷之后，把回卷件（工作区/读者情况回卷.md）上**明确勾了「已经会」**的条目逐条落进那份**人的**剔除记录（`verdict=不讲`、`verdictReason=已经会`）——与用户在工作台图上那把划子**同一支动作、同一份记录**；⛔「不确定」与未勾一律不落、⛔ 不自己手写那份 JSON。action 取值：stage-brief、stage-submit、progress、chapter-assemble、audit-submit（真实模式下，范例章审计结论落盘后先交这里：机器当场验 5 个必读文件各一行 {file, quote} 与 quote 逐字、passed 判定，不合格当场把机器看到的行键/样例/缺口说清；可带 auditJson 正文由机器落盘，不带就验书里那份 工作区/audit-NN.md）、final-redo-items（最后检查被用户驳回后**先**做这一步：把用户那句意见拆成条目落账 `redoItems:[…]`，每段照原文逐字抄、按原文顺序；拆好后交工时用 redoCheck 逐条交代去向）、agent-assign（派单：dispatchKind=writing|gold-writing|audit|gold-audit|material-survey|close-reading|alignment|graph-review|cross-audit|final-check；只有这十档走机器代填，改章小助手那类模板没覆盖的派单仍用你自己的 subagent 工具派）、create（建书，需 name/goal，可选 route/science/maxConcurrentSubagents）、rename（改书名，需 name）、set_goal（改学习目标，需 goal）、set-knobs（改并发上限 maxConcurrentSubagents——用户在拍板前想改这个旋钮时替他落；篇幅档位已删除，⛔ 不再有 length）、gate（拍板，需 gate/version/approved，可选 note）、rollback（回退，需 snapshot 序号）、resume（重试/继续）、delete（删除这本书）。协作动作：style-note（记风格线）、intervene（留言）、pause（暂停）、nudge（催办：把用户一句话以 notice 唤醒主 AI，不中断不 cancel）为内务可直接调用；waive（豁免，必须先引导用户在界面手输原因；豁免「其他」还要点名放行的是哪一条检查）、explore-confirm（探查结果确认：用户在探查结果卡点「满意，继续设计」时用，需 approved=true；approved=false 是让 AI 重做，**可带**一句哪里不满意（note，可选——用户在工作台里就是「勾个理由或写一句，不填也能重做」））、outline-confirm、chapters-review-confirm（全章过目确认：全章写完后替用户点「都过了」时用，需 approved=true）、final-approve（最后检查结果认可：最后检查全过后用户在最后检查结果卡点「认可/不满意」时用，需 approved=true/false；approved=false 必须带 note 改进意见）、gold-opinion/gold-revise/gold-chapter-set/gold-draft-approve（站 8「这一稿行不行」：用户点「✅ 就用这一稿」时 approved=true、点「🔁 不满意，重写这一章」时 approved=false；两支都只落站 8 的结论件，⛔ 不定稿）、gold-approve（范例章定稿确认：用户在谈判桌点「确认，定稿」时用，需 approved=true/false；approved=false 是推翻重写）必须用户明确同意后调用。以下动作需用户操作，AI 不可调用：review、review-revoke、gold-target-words-set（抽查／撤销抽查／定每章目标字数）——它们只在工作台界面由用户自己点。定点修改（改历史）：deep-modify（用户在界面上点定点修改时走这条，需 segment/note）、deep-undo（撤销最近一次深改）；对话里用户说改历史也必须引导走工作台的定点修改流程，不要自己改账本或产物。',
    parameters: {
      action: {
        type: 'string', required: true,
        // 33 项**逐字从契约面动作目录派生**（见文件头那节）。两个用法分两类、每个动作要带哪些
        // 参数，见工具顶层说明与下面各字段自己的说明——**枚举那一格不重抄一遍**。
        description: `${AGENT_ACTION_NAMES.join(' | ')} —— 共 ${AGENT_ACTION_NAMES.length} 项，逐字取自契约面动作目录（contract-actions.js 里 agentCallable 的全集）；每个动作该带哪些参数见下面各字段说明。`,
      },
      stage: { type: 'string', description: `stage-brief/stage-submit 用的阶段名：${ACT_STAGE_ENUM}；progress 时（写完整本阶段可选）：本章流水线阶段 ${CHAPTER_PROGRESS_STAGES.join('|')}——progress 时取值不在这一列、或只给 stage 不给 chapter，都会被当场拒收并点名（不再静默丢掉）` },
      segment: { type: 'string', description: 'deep-modify 时：要定点修改的历史段 key（explore|gate-1|gate-2|gate-3|outline|gold|chapter-N|merge|final）' },
      // —— stage-submit 各阶段的交付内容 ——
      title: { type: 'string', description: '交工 gate 时：一句话标题' },
      summary: { type: 'string', description: '交工 gate 时：给用户看的人话摘要（约 300 汉字以内；软目标，机器不验字数）' },
      detail: { type: 'string', description: '按动作取义：交工 gate（stage-submit）时必填——**页面载荷用全文**（用户只在页面上看方案、不会去文件夹翻；所以这里写完整方案 Markdown，也可以写「见文件」样的指针，机器会检出被指文件、把它的正文自动内联进页面与落盘镜像，被指文件不存在则原样放行、不打回）；**给 AI 的那一栏给指针**（票 confirm-points-redesign-build/12：你自己要回看就按有界读法去读那一份，别把整份方案再内联一遍进上下文）；progress 时可选——更细的一句话说明' },
      // —— stage-submit goal 的交付内容（票 `goals-handoff-missing/01`）——
      //    站 3「学完能做到什么」那 3–5 条：**它们的载体是 `工作区/目标-vM.md`，而写侧是机器**
      //    （交工那一刻按 `nextGoalDocVersion()` 现算版本号再落盘）。所以这一格交的是**内容**，
      //    ⛔ 不是文件名、也不是版本号——AI 不指定落点，也就无从指着上一版。
      goals: {
        type: 'array',
        items: { type: 'string' },
        description: '交工 goal 时：那 3–5 条「学完要能做到什么」，一条一句纯字符串（学完能独立做到什么，不是这本书讲了什么）。机器把它落成 工作区/目标-v<版本>.md，再停在那一屏等用户逐条改／删／加之后整批一次过。⚠️ 「3–5 条」是提示不是硬拦：材料只撑得起 2 条就写 2 条，⛔ 不为凑数编。',
      },
      // —— stage-submit explore 的交付内容（票 `context-budget/17`：合并件改机器拼装，主笔只交书级键）——
      //    票 `reader-cognition-boundary-build/01` 起书级聚合是**三件**：teachingFocus／chapterSuggestion
      //    （逐字搬运族）＋ readerSlices（片，拼接族、**可选**）。
      teachingFocus: {
        type: 'array',
        items: { type: 'string' },
        description: '交工 explore 时：书级的教学重点/难点，一条一句纯字符串（如「重点：分数运算」「难点：应用题建模」）。机器把它叠进 工作区/knowledge-map.json——合并件由机器按各分片拼装，你不用交它；这一件只有你能产出。',
      },
      chapterSuggestion: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            source: { type: 'string' },
            points: { type: 'array', items: { type: 'string' } },
          },
          required: ['title'],
          additionalProperties: false,
        },
        description: `交工 explore 时：书级的章节建议 [{title, source, points}]（${CHAPTER_COUNT_POLICY_TEXT}；points ＝这一章认领的知识点，按 title 与 knowledgePoints[].title／卡名**逐字**比对，id 不接进比对环）。机器把它叠进 工作区/knowledge-map.json；这一件只有你能产出。`,
      },
      readerSlices: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            members: { type: 'array', items: { type: 'string' } },
          },
          required: ['name', 'members'],
          additionalProperties: false,
        },
        description: '交工 explore 时：书级的「片」`readerSlices: [{name, description?, members:[知识点 title]}]`——把这本书按**读者语域**切成几块（读者情况问卷外层的作答单位）。每本 3–5 片为目标；**同片不混语域**是硬约束（语域块多于 5 片时片数可以更多）；片名与说明用读者的话写；`members` 按知识点 `title` 引用（⛔ 不能写 kp.id）。⛔ 不要求覆盖全部知识点、⛔ 不设「其他」垃圾桶片。机器只验形状（片数 ≥1 且每片有名有成员、members 按 title 归一化能在知识点图上对上），对了形状的坏值会 400 点名；**不交这一件也合法**（问卷侧会退化成「整本书一片」并如实说明）。',
      },
      chaptersJson: { type: 'string', description: '交工 outline 时：JSON 数组字符串 [{"title":"…","outline":"…","source":"资料N：…","targetWords":6000,"points":["知识点…"],"volumeReason":"体量依据"}]；targetWords 是**字数兜底下限**（至少要有这么多汉字，低于它交工会被拒收；不设上限）' },
      goldChapter: { type: 'number', description: '交工 outline 时：建议的样例章章号（1 基，默认 1）；outline-confirm 时：用户改选的样例章章号' },
      goldChapterReason: { type: 'string', description: '交工 outline 时：一句理由（哪章最能代表全书风格/结构最完整/材料最充分）' },
      chapter: { type: 'number', description: '交工 chapters 时：第几章；chapter-assemble 时：让机器拼第几章的正文（分片落齐之后、派审计小助手之前叫它）；agent-assign 时：dispatchKind 为 writing / audit 时的章号（1 基；gold-writing / gold-audit 自动取范例章号、不用填）；gold-chapter-set 时：目标样例章章号（1 基）；progress 时：正在汇报的是第几章（1 基，与 stage 一起进章节流水线账本，工作台章节卡显示流水灯）；waive 且 item=other 时：这条豁免只管到第几章（不填＝全书/不限）；交工 chapters 时机器按该章 audit-NN.md 的 issues（每条带 status）现算 passed（错误/open 或警告/open 超阈值即拒；自报 passed 不采信）、并验无未处置抽查意见、无脚手架残留，且正文汉字数不低于该章 targetWords（字数兜底下限）才放行' },
      shard: { type: 'number', description: 'agent-assign(dispatchKind=writing) 时：这一路写第几号分片 MM（1 基、默认 1）。一章只派一路就是 1；拆两半派就是 1 和 2（各写各的分片，谁也不碰别人的号；章正文由机器按号拼）。填了非法值（0／小数）会当场被拒，不会静默当成 1' },
      material: { type: 'number', description: 'agent-assign(dispatchKind=close-reading) 时：给第几份**转换完成**的材料派精读小助手（1 基，序号见 brief.parallelReads[].n）' },
      scope: { type: 'number', description: 'agent-assign(dispatchKind=final-check) 时：给最后检查的第几路派分查小助手（1 基，范围与报告落点见 brief.finalScopes[]）' },
      handledReviews: {
        type: 'array',
        items: {
          type: 'object',
          properties: { id: { type: 'string' }, how: { type: 'string' } },
          required: ['id', 'how'],
          additionalProperties: false,
        },
        description: '交工 chapters 时：本回合处置过的本章抽查意见，逐条点名 [{id: 意见 id（见 workbench_status 的 pendingReviews / brief.pendingReviews）, how: 一句人话说明这条你怎么处置的}]。机器只给点名的置为已处置，没点名的继续拦；该章意见未处置机器会拒收这章交工。',
      },
      preface: { type: 'string', description: '交工 merge 时：书的前言/使用说明（约 300 汉字，通俗；软目标，机器不验字数）。注意：交工 merge 前必须先有一个上下文干净的跨章审计小助手读完全部章做完跨章审计，把报告落盘 工作区/audit-cross.md（按 resources/references/subagent-prompts/cross-audit-prompt.md 派，那份模板里的五项核对每项都要有交代）——机器逐项验货才放行合并，缺项会 400 拒收并点名缺哪一项' },
      auditJson: { type: 'string', description: 'audit-submit 时：范例章审计 JSON 的正文（可省——省了就验书里已有的 工作区/audit-NN.md）。带了必须是一整份严格 JSON，机器验形状合格后由机器落盘；不合格当场 400，报错里带机器解析到的行键与样例、契约行形状与 5 个必读文件、以及差在哪一项' },
      report: { type: 'string', description: '交工 final 时：你的最后检查报告（人话）' },
      // 票 `walkthrough-fixes/37`：驳回意见的**拆条**与**逐条交代**（两件事、两个字段，别混）。
      redoItems: {
        type: 'array',
        items: { type: 'string' },
        description: 'final-redo-items 时：把用户那句驳回意见拆成若干段，每段是意见原文里的**连续一段**（照原句逐字抄，别改写、别编；按原文先后顺序排，一段只拆一次）。机器逐段验「是不是原文的连续子串」，编造／改写／重复的当场拒收；拆出来的条目落账后，下一次 `stage-brief` 的 `redoItems` 里读得到。',
      },
      redoCheck: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            item: { type: 'number' },
            status: { type: 'string', enum: ['done', 'not-done', 'superseded'] },
            note: { type: 'string' },
            where: { type: 'string' },
          },
          required: ['item', 'status'],
          additionalProperties: false,
        },
        description: '交工 final 时（这一轮是照用户的驳回意见改的）：对**落账的每一条**驳回意见逐条交代去向 [{item: 条目编号（1 起，见 brief.redoItems）, status: done（办了）/ not-done（没办，note 必写一句原因）/ superseded（已不适用了）, note: 一句说明, where: 办在哪（章/文件/位置）}]。漏一条机器会 400 拒收并点名漏的是哪一条；⚠️ 机器只核对「有没有逐条交代」，不核对「办得对不对」。',
      },
      styleCheck: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string', enum: ['adopted', 'conflict', 'superseded'] },
            note: { type: 'string' },
            chapter: { type: 'string' },
          },
          required: ['id', 'status'],
          additionalProperties: false,
        },
        description: '交工 final 时：对每条生效中的风格线逐条交代去向 [{id: 风格线 id（见 workbench_status 的 styleNotes 里 status 为 active 的）, status: adopted（已落实）/ conflict（与某章冲突）/ superseded（已不再适用）, note: conflict 必写一句冲突理由, chapter: 落实在哪章（可选）}]。漏一条机器会 400 拒收；**adopted／conflict 的每一条还要在五份分报告之一里有原文为据**（那一路把这条风格线的原文逐字写进它那份报告，或写它的 id）——找不到出处机器同样 400（去向由读过正文的那一路交代，协调员只汇总）；一条风格线都没有时可以不传。',
      },
      // —— progress ——
      label: { type: 'string', description: 'progress 时：正在做什么（如「写第3章」）' },
      // —— 代用户操作 ——
      name: { type: 'string', description: 'create/rename 时的书名' },
      goal: { type: 'string', description: 'create/set_goal 时的学习目标' },
      route: { type: 'string', description: 'create 时：blueprint=给 AI 老师上课用（推荐），human=给人直接读的教材' },
      science: { type: 'boolean', description: 'create 时：理科内容（公式较多）为 true' },
      // ⚠️ 票 `confirm-points-redesign-build/03`：原先还有一个 `length`（篇幅档位：速览/标准/精读）
      // ——三档删除，这一格随之撤掉（建书不再问、书里不再有那个字段；章节数改由站 6 拍板）。
      maxConcurrentSubagents: { type: 'number', description: 'create/set-knobs 时：一次最多派几个小助手（1-8；不传＝默认 5）。用户拧过之后账本里会有一条对应的账' },
      gate: { type: 'string', description: 'gate 时的拍板序号' },
      version: { type: 'number', description: 'gate 时的版本号' },
      approved: { type: 'boolean', description: 'gate 时：true=通过，false=驳回；explore-confirm 时：true=满意继续，false=让 AI 重做；chapters-review-confirm 时：true=全章都过了，开始合并；gold-approve 时：true=范例章定稿继续，false=推翻重写' },
      snapshot: { type: 'number', description: 'rollback 时回退到的快照序号' },
      // ── 票 `reader-cognition-boundary-build/06`：读回卷件代笔（既有那条图上「意见」通路）────────
      // ⚠️ 名字有意**不叫 `reason`**：那一格今天归 `pause`（中断原因）。一词一义 ⇒ 排除理由档这一格
      // 另起名 `verdictReason`，落地时由适配层映回服务端载荷的 `reason`（HTTP 体一个字不改）。
      key: { type: 'string', description: 'graph-opinion 时：知识地图上那张卡的**卡键**（`cards[].key`，如 M1-01-2；⛔ 不是知识点 title、也不是 kp.id——服务端只按卡键找卡）' },
      verdict: { type: 'string', description: 'graph-opinion 时：不讲（把这张卡划掉／记进剔除记录）| 要讲（把它放回来）。与用户在工作台图上按的是同一支动作、同一份记录' },
      verdictReason: { type: 'string', description: 'graph-opinion 时：可选的理由档——不需要（本书不覆盖这个主题，图上「🗑 这部分不造进书里」那一档）| 已经会（读者已经会了，图上那把划子那一档）。⚠️ 代笔落回卷件的勾选时**一律**填「已经会」；出域值服务端当场 400' },
      // -- 协作动作 --
      text: { type: 'string', description: 'style-note/intervene 时：意见或留言内容；nudge 时：催办语（一句话，可省）' },
      source: { type: 'string', description: 'style-note 时：wizard|ui|chat（对话里识别的用 chat）' },
      id: { type: 'string', description: 'style-note-revoke/intervene-done/gold-opinion-revoke/waive-revoke 时：条目 id' },
      item: { type: 'string', description: 'waive 时：豁免项枚举（gate-skip 跳过「请你拍板」的设计环节 / outline-skip 跳过「章节安排」确认 / gold-skip 跳过「最佳范例章」确认 / audit-skip 不要求每章都有独立审查 / scaffold-keep 保留 AI 的笔记不删 / progress-skip 跳过「进度账本」检查 / other 其他——**最后手段**，单条误报要点名到那一条，见 note）' },
      userNote: { type: 'string', description: 'waive 时：用户在界面手输的原因（放行必要条件）' },
      // 票 `kn-unowned-silent/02`：逐点豁免那一格。裁决：「豁免必须结构化到点」——书级那条只写散文的
      // 记录**一条点也放行不了**，要少收哪几条知识点就必须在这里逐条点名（title 与工作区/outline.md
      // 的 points 同一写法；形状 `{id?, title, chapter?}` 或纯 title 字符串都收）。
      waivedPoints: {
        // ⚠️ **schema 必须与实现同宽**：服务端两种写法都收（纯 title 字符串、`{id?, title, chapter?}`），
        // 所以这里不能只声明 `items: {type:'string'}` —— 那会让模型拿不到 `chapter`，而面板与「哪一章被
        // 减负」都按条目上的章号认（`items` 收窄过一次，症状是「闸门放行、面板印 0」）。
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            chapter: { type: 'number' },
          },
          required: ['title'],
          additionalProperties: false,
        },
        description: 'waive 且 item=other 时：这条豁免**逐条点名放弃**哪些知识点 `[{title, id?, chapter?}]`'
          + '（`title` 必填，与工作区/outline.md 的 points 同一写法；`chapter` 是这条点归哪一章，'
          + '按章放行时**务必给**——面板的「豁免放弃 M」按它现算；不给就走这条豁免自己 scope.chapter）。'
          + '覆盖闸门与单章上限只放行这里点到的点，没点名的照旧拒收（⛔ 不再有一票放行整族/整本）。'
          + '典型用法：某章 points 超过 20 条上限时，经用户明确同意后点名放弃其中几条，再交工。',
      },
      reason: { type: 'string', description: 'pause 时：中断原因（给账本与恢复上下文）' },
      target: { type: 'string', description: 'intervene 时：留言指向（如「第4章」）' },
      kind: { type: 'string', description: 'gold-opinion 时：dislike|drop|change（意见类型）' },
      dispatchKind: { type: 'string', description: `agent-assign 时：派哪一档单（${DISPATCH_KIND_ENUM}）——机器按那一档的派发模板代填整份派单，你只给数值与一句叮嘱。⚠️ 与 gold-opinion 的 \`kind\` 是两件事，所以名字不同（一处一词一义）` },
      wish: { type: 'string', description: 'gold-opinion 时：一句话说明' },
      para: { type: 'number', description: 'gold-opinion 时：段落序号（可省）' },
      hint: { type: 'string', description: 'gold-opinion 时：段落描述（如「开头那段」）' },
      note: { type: 'string', description: '按动作取义：gate 驳回时——驳回说明或备注；explore-confirm 驳回时——一句哪里不满意（可选；填了重做时 AI 会读到）；outline-confirm 驳回 / gold-revise 时——给 AI 的改进方向；deep-modify 时——这次要改什么（必填）；agent-assign 时——你给这一路小助手的一句叮嘱（可选；形状与本书实际值由机器代填，**判断只从这里出**）；waive 且 item=other 时——**点名放行的是哪一条机器检查项**（用检查结果里的项名，如「无重复标题」；一次只放行点名的那一条，必填）' },
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: renderText,
    },
    async execute(args, exec) {
      const sessionId = sessionIdOf(exec)
      const inputName = String(args.action ?? '')
      // 契约面动作目录（票 contract-actions/02）：主笔 AI 认哪 31 个输入名、哪 5 个是
      // 别名，全部由目录说了算，这里只做一次单向解析。别名只在主笔 AI 这一侧解析——
      // 目录里存在 canonical name 不会让工具多收一个输入名，HTTP 也不因此接受别名。
      const action = resolveAgentAction(inputName)
      // ⚠️ 顺序是判据（票 `dsh-contract-drift/13`，病因见票面）：**先**跑目录认得的动作的本地
      // 入参校验，**再**取 base——反过来会让「没配置宿主地址」遮住「缺 userNote」这类本地错参。
      // 地址缺失仍是**零请求 ＋ 响亮失败**（下一行），只是不再抢在错参前面。
      if (action !== null) preValidate(action.name, args)
      // 取 base 仍在**任何网络之前**：拿不到就零请求地响亮失败（票 `dsh-contract-drift/08`；
      // 第三来源宿主 `webApp` 见票 `dsh-contract-drift/14`）。
      const base = requireBaseUrl(baseUrlAtApply ?? resolveBaseUrl(config, ctx))
      const projects = await fetchJson(transport, `${base}/textbook/projects?session=${encodeURIComponent(sessionId)}`)
      const meta = (projects.projects ?? [])[0]
      // 建书是主笔 AI 能调的动作里唯一不需要已有书的那一个（目录的 projectScope 事实）。
      const createsBook = action?.projectScope === 'no-book'
      if (!createsBook && meta === undefined) {
        throw new Error('这个会话还没有书：要么先让用户在工作台建书，要么用 create 直接建')
      }
      const project = createsBook ? undefined : meta.id
      let body
      // 分支标签一律是规范动作名：主笔 AI 写下的输入名（create / rename / set_goal / gate /
      // delete 等 5 个别名）在上面已经单向解析过来，解析不出这个动作就进不了任何分支。
      switch (action?.name) {
        // ── 流水线内务（不需要征求用户同意） ─────────────────────────────
        case 'stage-brief':
          body = {
            action: 'stage-brief',
            ...(typeof args.stage === 'string' && args.stage !== '' ? { stage: args.stage } : {}),
          }
          break
        case 'progress':
          // 契约面审计（2026-08-26）：补转发 chapter/stage。之前只转 label/detail，
          // 后端 meta.chapterPipeline 永远收不到结构化数据（休眠），前端章节卡只能靠事件兜底推导。
          // ⚠️ 票 `demo-channel-full/03`（2026-10-15）：那一格现在**真书与演示书都写**——写入抽成
          // `engine.recordChapterStage` 单一出口（演示支铺章那几步也调它）。上面那句「休眠」说的是
          // 2026-08-26 补转发**之前**的状态，留作历史，⛔ 别读成「今天还没有人写这一格」。
          // ⚠️ 票 `pre-gold-build/12` · 债-11：这两个键以前是**静默丢**（越界就展开成 `{}`），
          // 今天非法值在 `preValidate` 就被点名拒收（判据单一出处 `progressFieldProblem`）⇒
          // 这一支只做归一化，不再自己判一次（第二份判据必然与第一份漂）。
          body = {
            action: 'progress',
            label: typeof args.label === 'string' ? args.label : '',
            detail: typeof args.detail === 'string' ? args.detail : '',
            ...(args.chapter === undefined || args.chapter === null ? {} : { chapter: Number(args.chapter) }),
            ...(args.stage === undefined || args.stage === null ? {} : { stage: args.stage }),
          }
          break
        case 'audit-submit':
          // 写入侧校验（票 audit-matrix-contract/01 (b)）：范例章审计结论先交这里让机器即时验形状。
          // 不带 auditJson 就验书里那份 工作区/audit-NN.md；带了原样转发进 HTTP 体，由服务端验并落盘。
          body = {
            action: 'audit-submit',
            ...(hasTrimmedText(args.auditJson) ? { auditJson: args.auditJson } : {}),
          }
          break
        case 'chapter-assemble':
          // 票 `walkthrough-2026-10/02`：写作小助手只落分片，**章正文由机器拼**。
          // 主笔在「分片落齐之后、派审计小助手之前」叫这一步。
          // ⚠️ 票 `depth-review-2026-10/06`：`chapter` 的校验**只在 `preValidate`**——这里原本
          // 内联又判了一遍，与 `preValidate` 那条**同形**（判据一模一样，只差文案），是**死代码**
          // （`preValidate` 先跑、先抛）。收掉它，不改变任何可观测行为。
          body = { action: 'chapter-assemble', chapter: Number(args.chapter) }
          break
        case 'agent-assign':
          // 票 `context-budget/18`：派单正文改**机器代填**——主笔只给「哪一档 ＋ 章号 ＋ 一句叮嘱」，
          // 机器按九份派发模板（＋ 终检那一节）拼好整份 prompt 并起子代理，把 `agentId` 回给主笔。
          // 参数校验的单一落点仍是 preValidate（缺档位／缺章号在**发出第一个请求之前**就被拦下）。
          // ⚠️ `dispatchKind`（不是 `kind`）：`kind` 是 gold-opinion 的意见类型，两者互不相干。
          // ⚠️ `shard` 原样转发（**不在这里悄悄丢**）：丢了它服务端就按「没填＝1」收下，
          // 而「填了 0／小数」本该是 400——早退在 preValidate，这里不替服务端做归一化。
          body = {
            action: 'agent-assign',
            dispatchKind: String(args.dispatchKind),
            ...(Number.isSafeInteger(Number(args.chapter)) ? { chapter: Number(args.chapter) } : {}),
            ...(args.shard === undefined || args.shard === null ? {} : { shard: args.shard }),
            ...(Number.isSafeInteger(Number(args.material)) ? { material: Number(args.material) } : {}),
            ...(Number.isSafeInteger(Number(args.scope)) ? { scope: Number(args.scope) } : {}),
            ...(typeof args.note === 'string' && args.note.trim() !== '' ? { note: args.note.trim() } : {}),
          }
          break
        case 'stage-submit': {
          // 参数规则只有一处（`ACTION_PARAM_RULES`）：`preValidate` 刚才跑的就是这一段，
          // 这里再跑一次是**取组包要用的值**——校验过的值就是转发的值，两处不可能对不上。
          body = { action: 'stage-submit', ...stageSubmitBody(args) }
          break
        }
        // ── 代用户操作（必须先得到用户明确同意） ────────────────────────
        // 分支标签是规范动作名：主笔 AI 那边写的输入名（create / rename / set_goal / gate /
        // delete）由目录单向解析过来，解析不出这个动作就进不了这里。
        // ⚠️ 下面五条的**参数校验与取值都在 `ACTION_PARAM_RULES` 那一张表里**（票
        // `depth-review-2026-10/06` 从本 switch 收上去的）：`action.name` 就是本 case 的标签
        // （switch 判的就是它），所以表键与分支标签不会各写一遍。
        case 'book-create':
          body = {
            action: 'book-create',
            ...actionParamsBody(action.name, args),
            route: args.route === 'human' ? 'human' : 'blueprint',
            science: args.science === true,
          }
          break
        case 'book-rename':
          body = { action: 'book-rename', ...actionParamsBody(action.name, args) }
          break
        case 'book-set-goal':
          body = { action: 'book-set-goal', ...actionParamsBody(action.name, args) }
          break
        // 票 `walkthrough-fixes/19`②：并发上限那个旋钮（代用户操作）。
        // ⚠️ 票 `confirm-points-redesign-build/03` 起只剩它一个（篇幅档位三档删除）：
        // **不在这里替产品编字段**——并发数原样转发，合法性由服务端那一处判。
        case 'book-set-knobs':
          body = {
            action: 'book-set-knobs',
            ...(args.maxConcurrentSubagents === undefined || args.maxConcurrentSubagents === null
              ? {} : { maxConcurrentSubagents: args.maxConcurrentSubagents }),
          }
          if (body.maxConcurrentSubagents === undefined) {
            throw new Error('改并发上限：要给 maxConcurrentSubagents（篇幅档位已删除）')
          }
          break
        case 'gate-decide':
          body = {
            action: 'gate-decide',
            ...actionParamsBody(action.name, args),
            note: typeof args.note === 'string' ? args.note : '',
          }
          break
        case 'rollback':
          body = { action: 'rollback', ...actionParamsBody(action.name, args) }
          break
        // ── 协作动作 ──────────────────────────────────────────────────────
        case 'style-note':
          body = { action: 'style-note', text: args.text.trim(), source: typeof args.source === 'string' ? args.source : 'chat' }
          break
        case 'style-note-revoke':
          body = { action: 'style-note-revoke', id: args.id }
          break
        case 'waive': {
          // 票 `walkthrough-fixes/23`：豁免记录必须带作用域（哪一条检查／哪本书／哪一章）。
          // `note` 这一格就是「哪一条检查」——`other` 点名到具体那一条（服务端按它逐条放行）；
          // 非 other 的豁免项由服务端按 item 派生，这里不另填。章号只在 `other` 上适用，不填＝全书。
          const namedCheck = args.item === 'other' && typeof args.note === 'string' ? args.note.trim() : ''
          const waiveChapter = Number(args.chapter)
          const scope = namedCheck === ''
            ? undefined
            : {
              check: namedCheck,
              ...(args.item === 'other' && Number.isSafeInteger(waiveChapter) && waiveChapter >= 1 ? { chapter: waiveChapter } : {}),
            }
          // 票 `kn-unowned-silent/02`：逐点豁免**原样透传**（形状校验在服务端——那里是唯一权威；
          // 这里只挡「写了个非数组」这种一眼错的，与 `handledReviews` 同一强度）。
          // ⚠️ 空数组**也转发**：那不是「忘了带」，是「一条都不点名」——服务端把它当没点名处理，
          // 与缺席同一条路（⛔ 不在这里替它编一个默认值）。
          if (args.waivedPoints !== undefined && !Array.isArray(args.waivedPoints)) {
            throw new Error('waivedPoints 需要数组：[{title, id?, chapter?}]（逐条点名要放弃的那几条；title 必填）')
          }
          body = {
            action: 'waive', item: args.item, userNote: args.userNote.trim(), source: 'chat',
            ...(scope === undefined ? {} : { scope }),
            ...(Array.isArray(args.waivedPoints) ? { waivedPoints: args.waivedPoints } : {}),
          }
          break
        }
        case 'waive-revoke':
          body = { action: 'waive-revoke', id: args.id }
          break
        case 'pause':
          body = { action: 'pause', reason: typeof args.reason === 'string' ? args.reason : '主 AI 侧发起的中断' }
          break
        case 'intervene':
          body = { action: 'intervene', text: args.text.trim(), ...(typeof args.target === 'string' ? { target: args.target } : {}) }
          break
        case 'intervene-done':
          body = { action: 'intervene-done', id: args.id }
          break
        case 'outline-confirm':
          body = {
            action: 'outline-confirm', approved: args.approved,
            ...(typeof args.note === 'string' ? { note: args.note } : {}),
            ...(Number.isSafeInteger(Number(args.goldChapter)) ? { goldChapter: Number(args.goldChapter) } : {}),
          }
          break
        case 'explore-confirm':
          // 走查票 09（裁决①：漏登记，补进 AI 闭包）：用户在探查结果卡点「满意，继续设计」
          // 时由 AI 代点。approved=false 就是「让 AI 重做」，服务端把产物归档后重新交办。
          body = {
            action: 'explore-confirm', approved: args.approved,
            ...(typeof args.note === 'string' ? { note: args.note } : {}),
          }
          break
        case 'gold-draft-approve':
          // 票 `confirm-points-redesign-build/08`：站 8 那一屏的两颗键（「✅ 就用这一稿」／
          // 「🔁 不满意，重写这一章」）走这一支。⚠️ 它**不**替用户顺手定稿：定稿是站 9
          // 之后那一下（`gold-approve`），两件事拆开正是这张票要的形状。
          body = { action: 'gold-draft-approve', approved: args.approved }
          break
        case 'gold-approve':
          // 走查票 09（裁决①：漏登记，补进 AI 闭包）：范例章定稿的唯一放行键——此前它
          // 只能在工作台谈判桌上点，界面一旦不可用，AI 又没这条通路，整条流水线停住。
          // ⚠️ 只转 approved，**不替产品代码编字段**：`targetWords`（旧单值兜底）在工作台上
          // 由谈判桌那一格发；AI 这条路的目标字数走交工 outline 的 `chaptersJson[].targetWords`
          // （ADR-0026 决策 5），这里不另开第二个入口。
          body = { action: 'gold-approve', approved: args.approved }
          break
        case 'chapters-review-confirm':
          body = { action: 'chapters-review-confirm', approved: args.approved }
          break
        case 'final-approve':
          // 终检结果认可：用户在终检结果卡点「认可/不满意」时由 AI 代点（须用户明确同意）。
          // approved=false 必带 note 由 preValidate 拦（单一校验落点）。
          body = {
            action: 'final-approve', approved: args.approved,
            ...(typeof args.note === 'string' ? { note: args.note.trim() } : {}),
          }
          break
        // 票 `walkthrough-fixes/37`：驳回意见的拆条落账（驳回那一刻先做这一步，再动正文）。
        case 'final-redo-items':
          body = { action: 'final-redo-items', ...actionParamsBody(action.name, args) }
          break
        case 'deep-modify':
          // 定点修改（改历史）：用户在界面上点定点修改时走这条；对话里说改历史也必须
          // 引导用户去工作台点定点修改，不要自己动账本/产物。需用户明确同意后才调用。
          body = { action: 'deep-modify', segment: args.segment, note: args.note.trim() }
          break
        case 'deep-undo':
          body = { action: 'deep-undo' }
          break
        case 'gold-opinion':
          body = {
            action: 'gold-opinion', kind: args.kind, wish: args.wish.trim(),
            ...(Number.isSafeInteger(args.para) ? { para: args.para } : {}),
            ...(typeof args.hint === 'string' ? { hint: args.hint } : {}),
          }
          break
        case 'gold-opinion-revoke':
          body = { action: 'gold-opinion-revoke', id: args.id }
          break
        // ── 票 `reader-cognition-boundary-build/06`：读回卷件代笔（**既有**那条图上「意见」通路）──
        // ⚠️ **不新开动作**：载荷就是服务端那支既有动作认的那三格（`{key, verdict, reason?}`），
        //    参数规则与校验都在 `ACTION_PARAM_RULES['graph-opinion']`（上面那张表：`key`／`verdict`
        //    必填、`verdictReason` 可选并映回 `reason`）。
        // ⚠️ 「谁划的＝用户」那半没变：`by` 仍由服务端写成 `user`——AI 这一路是**代笔**
        //    （把人回卷件上的勾选读进来），不是替人做判断。
        case 'graph-opinion':
          body = { action: 'graph-opinion', ...actionParamsBody(action.name, args) }
          break
        case 'gold-revise':
          body = { action: 'gold-revise', ...(typeof args.note === 'string' ? { note: args.note } : {}) }
          break
        case 'gold-chapter-set':
          body = { action: 'gold-chapter-set', chapter: Number(args.chapter), ...(typeof args.reason === 'string' ? { reason: args.reason } : {}) }
          break
        case 'resume':
          body = { action: 'resume' }
          break
        case 'nudge':
          // 催办：把用户的一句话以 notice 唤醒主 AI（不中断、不 cancel）；留空则用默认催办语。
          body = { action: 'nudge', ...(hasTrimmedText(args.text) ? { text: args.text.trim().slice(0, 200) } : {}) }
          break
        case 'book-delete':
          body = { action: 'book-delete', confirm: true }
          break
        default:
          // 解析不出来的输入名（拼错的、AI 没暴露的动作名、canonical name 本身）
          // 都在这里被拒——报错说的是主笔 AI 写下的那个输入名。
          throw new Error(`未知操作: ${inputName}`)
      }
      const json = await fetchJson(transport, `${base}/textbook/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ session: sessionId, ...(project !== undefined ? { project } : {}), ...body }),
      })
      return json
    },
  }))
}

export { apply }
