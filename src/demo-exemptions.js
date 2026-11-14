/**
 * 造书工作台 · **演示通道豁免面的单点声明**（票 `demo-flow-fidelity/08`）。
 *
 * ── 病 ────────────────────────────────────────────────────────────────────────
 * 演示通道与真实通道的分叉有 20 处（逐条见 `.scratch/demo-flow-fidelity/findings.md` §B）。
 * 病不在「有豁免」——病在**豁免散着**：有的写了理由（`chapters.js` 的几处、`engine.js` 的几处、
 * ADR-0008），有的只写在票面，有的**连注释都没有**（gold 干净审计、`audit-skip`、留言销号、
 * `styleCheck` 那几族）。下一批闸门照这个先例写，就会继续在 demo 上悄悄失效。
 * 本文件把那 20 处（＋ 扫描面里多出来的几处）收成**一份**清单，每条四件：
 * `what`＝豁免什么、`why`＝为什么一句话、`origin`＝出处（票号／代码注释）、`guards`＝守卫点。
 *
 * ── ⚠️ 声明面**只是登记，不放行任何东西** ──────────────────────────────────────
 * 豁免的判据仍在**原处**（`meta.demo !== true`／`subMeta.demo !== true`／演示支早退那些守卫）。
 * 本文件不接进任何生产路径、不改任何一条判定的结果（不放宽、不收紧）——它的唯一消费者是
 * `test-demo-exemptions.mjs` 那道双向元检查。
 *
 * ── 落点为什么是**新模块**而不是 `src/domain-rules.js` ──────────────────────────
 * 先核 import 方向：`domain-rules.js` 零 import，`src/workflow/**` 与 `src/workflow/actions/**`
 * 都在 import 它，所以**从成环角度看它完全能承载**这份表。不能承载的是**职责与打包面**：
 * 它文件头自述「前后端共享的领域常量与纯推导函数……只放『两侧都必须知道』的规则」，而它确实
 * 被 esbuild 打进前端 bundle（`src/ui/chapters-map.js`、`src/ui/confirm-cards.js` 直接 import 它）。
 * 这份表的每一条都指向**后端源码的文件路径与代码子串**，前端一个字节都用不上 ⇒ 放进去等于把
 * 后端守卫的源码片段塞进浏览器产物，并让那句自述失真。
 * ⚠️ **票 06 起有一个例外方向**：`quality-checks-tail` 那条多了一个机器可读字段 `checkNames`
 * （那段检查的项名名单——票 06 收口起是 `engine.js` 那几处 `checks.push({ name })` 的
 * **服务端 `name` 逐字**），而**那份名单常量住在 `src/domain-rules.js`**（前端那句提示句也要读它，
 * 并在上屏前逐项过 `checkHuman`）——
 * 本表**引用**它，不把它抄进来。「表不进前端」这条纪律因此一个字没松：前端读的是
 * `domain-rules` 里那份纯名单，`src/ui/**` 一个字节都不 import 本文件。
 * 本模块**只 import 那一份纯名单**（票 06），其余是纯数据：`src/workflow/**`、
 * `src/workflow/actions/**` 与判据都能 import 它而不引入环（`domain-rules.js` 自己零 import，
 * 方向仍是**向下**的）。
 *
 * ── 守卫点为什么写 `{ file, contains }` 而不是「文件:行号」 ─────────────────────
 * 行号会漂。今天写死的 `chapters.js:923` 在下一票插几行注释之后就指向别处，而元检查只会
 * 「在那一行找到了一个 demo 字面量」——一条**会腐烂的判据输入**：它看起来在守着某个具体守卫，
 * 实际守的是那一行的偶然内容。`{ file, contains }` 要求给出**该守卫的代码子串**（可以跨行），
 * 元检查按文件读文本找 `contains`；行号漂了它照样命中，守卫被改写成别的样子它当场红。
 * 代价：`contains` 必须自己足够特有（同一个文件里五处同形的 `if (meta?.demo !== true) {`
 * 就得把下一行一起写进来），所以下面的片段有的跨两行——这是这个偏离的成本，写在票面 `## Answer` 里。
 *
 * ── ⚠️ 声明面是**一份会被别人扫的文本**（票 08 合入集成分支后整链红的那一课） ────────
 * 它住在 `src/` 下 ⇒ 任何「读 `src/**` 文本再匹配」的判据都把它当输入面。已经在真链上炸过一次、
 * 另有两条**静默**通道（下面第二个 anchor 那种：让一个已被删掉的真实锚点照样「命中」＝假绿）：
 *   · `appendEvent` ＋ 左括号 ⇒ `test-ledger-artifact-fields.mjs` 把那一行当成一处**落账调用点**
 *     做闭包对账 ⇒ 未登记即红（票 08 合入后整链红的就是这三处）；
 *   · `ensureStatus(` ＋ 一个 `'awaiting-…'` 字面量（或 `status =` ＋ 同一个东西）⇒
 *     `test-gate-write-points.mjs` 的写入点扫描把它当成一处「workflow 能设这个值」的**写入点**
 *     ⇒ 真写入点哪天被删，闭包仍绿（本票登记的**假绿**通道，也是这格连注释一起判的原因）；
 *   · 删除原语、状态写入的底层标识符、词表声明、手抄章节路径同理（各有一条判据在扫 `src/**`）。
 * ⇒ **写 `contains` 时从锚点的第二个 token 起**（`'textbook/phase-start', …`、
 * `'awaiting-final-approval', …`），别整行照抄调用表达式。常驻闸（锚点清单 ＋ 反证 ＋ 核过哪些
 * 扫描面）在 `test-demo-exemptions.mjs` 的「声明面是文本」那一格——**加了新 `contains` 之后跑它**。
 *
 * ── ⚠️ 我的枚举面比现实窄在哪里（票 `dev-gate-scan/17` 的纪律） ─────────────────
 * ① 元检查那一侧的 grep 面是**五个字面量写法**（`DEMO_GUARD_LITERALS`），它咬得住的是
 *    「新写了一处这五种写法的守卫却没登记」。**咬不住**的是间接判断：`runtime.demo`
 *    （`content-lib.js` 那条 seam）、把 `demo` 传进别处再判、`goldN(meta)` 那类派生、
 *    以及任何换成别的变量名／别种写法的等价判断——那些今天不在 grep 面内，将来把判据改成
 *    AST 扫描是**升级**，不是本票。
 * ② `contains` 匹配是**原文子串**（去 `\r` 后逐字），不认同义的改写：守卫被重写成
 *    `meta && meta.demo` 这种形状、片段对不上，元检查报的是「声明的守卫点找不到」——
 *    那是**要人来看一眼**的红，不是自动修的红。这正是拆成两向判据的理由（见测试文件头）。
 * ③ 这里登记的是**源码里的分叉**，不是「演示书在盘上实际发生了什么」：行为面由
 *    `test-flow-transitions-matrix.mjs`（票 `test-chain-latency/04` 之前是 `test-flow-transitions.mjs`）、
 *    `test-collab-replay.mjs` 那一族管。
 * ④ ⚠️ 与票 07 的分工：影子对账的**期望值从生产函数派生**（`exploreDepthTier` 等），
 *    这份声明面**只用来排除**（「这处差异是登记过的豁免」），**绝不**当成判据的唯一期望值来源
 *    ——两张票别打架。
 * ⑤ ⚠️ 票 06 给 `quality-checks-tail` 补的 `checkNames` 是**说明文字的数据源，不是判据**：
 *    元检查那四件（`what`/`why`/`origin`/`guards`）一个字没动，`checkNames` 的内容与现实
 *    （`engine.js` 里那几处演示守卫**各推一项**）**没有任何机器闸门**——`engine.js` 多推一项、
 *    这里不补，两边都不响；前端那句提示就跟着少说一项。那正是本文件头部第 ① 条那个窄处的
 *    另一面：**从源导出只保证不抄漏，不保证看到的比现实多**（票 `dev-gate-scan/17`）。
 *    真正被判据钉住的只有：这句提示**上了屏**（演示 payload）与**真书那一侧一个字都没有**。
 *
 * 术语见 `CONTEXT.md`；豁免的账见 `docs/测试信任边界.md` 与 ADR-0008。
 */
import { QUALITY_CHECKS_TAIL_NAMES } from './domain-rules.js'

/**
 * **grep 面**：五条 demo 守卫的字面量写法（票面点名的那五个）。
 *
 * 元检查拿它扫 `src/**`（逐行、跳过注释行），任何一处命中都必须被下面某条声明的 `guards`
 * 覆盖；反过来，这条面上的每个字面量都必须在 `src/**` 里**真的有命中**（空名单当场红）。
 */
export const DEMO_GUARD_LITERALS = [
	'meta?.demo !== true',
	'meta.demo !== true',
	'subMeta.demo !== true',
	'state.demo === true',
	'meta.demo === true',
];

/**
 * 演示通道豁免面的声明清单。
 *
 * 每条：
 * · `id`        —— 稳定 id（元检查按它报红，别改名玩）
 * · `what`      —— 豁免什么（一处分叉的用户可见／机器可见后果）
 * · `why`       —— 为什么（一句话：那条理由本身）
 * · `origin`    —— 出处（票号／代码注释；findings §B 的编号也写在这里）
 * · `guards`    —— 守卫点：`{ file, contains }`（守卫所在的文件 ＋ 该守卫的代码子串）
 * · `guardKind` —— `'demo-guard'`＝守卫本身就是一条 demo 判据（五字面量之一）；
 *                  `'structural'`＝豁免靠结构性事实（演示支早退／演示通道永不交工），
 *                  声明的守卫点是**那道门本身**（它没被放宽，只是演示通道走不到它）
 * · `state`     —— 省略＝还活着；`'closed'`＝这条分叉已被别的票关掉（配 `closedBy`）
 */
export const DEMO_EXEMPTIONS = [
	{
		id: 'content-source-seam',
		what: '内容验证入口（`stage-submit` 逐阶段验货的那一条链）',
		why: '演示通道的内容来自内置回放夹具（`generateContent`），一步都不进 `stage-submit`——验货入口在它身上没有入口点。',
		origin: 'findings §B #1；`src/workflow/engine.js` 的 `demoStep`／`projectRuntime` 自述',
		guardKind: 'demo-guard',
		guards: [
			{ file: 'src/workflow/engine.js', contains: 'demo: meta.demo === true,\n    dir: projectDir(projectId),' },
			{ file: 'src/workflow/engine.js', contains: "const result = await generateContent(runtime, 'explore')" },
		],
	},
	{
		id: 'explore-required-items',
		what: '探查必做项（三／五节）与 `chapterSuggestion` 非空这两道 400',
		why: '演示书的 `explore.md` 与书级 `chapterSuggestion` 都由夹具写、从不经 `stage-submit(explore)`，那两道门读不到它（夹具报告确实缺那三节）。⚠️ 2026-10-27 起章数上下限都不判（票 `stage3-hard-limits/02`），这一族只剩「必做小节在场」与「建议非空」两道形状门。',
		origin: 'findings §B #2；票 `pipeline-wiring-gaps/07`；收窄：票 `stage3-hard-limits/02`',
		guardKind: 'structural',
		guards: [
			{ file: 'src/workflow/engine.js', contains: 'const missingItems = exploreTier.required.filter((item) => !exploreText.includes(item))' },
		],
	},
	{
		id: 'explore-artifact-shards',
		// ⚠️ **已关闭**（票 `demo-channel-full/12`，2026-10-15）：演示支现在**也产**那两份产物。
		// 关闭理由：原分叉是「演示通道没有『精读小助手』这回事——分片与细目在那条路上没有来源」。
		// 票 12 让演示支在源探查那一趟**真写**一片 `工作区/knowledge-map-NN.json`（号按
		// `okMaterialNumbers` 现算）与一份 `工作区/细目/精读-NN.md`，并且合并件改走**生产那一段拼装**
		// （`knowledge-map-assembly.expectedKnowledgeMap`——盘上那几片成了它的真输入）。
		// `exploreArtifactProblems` 里那句 `const demoBook = !atSubmit && state.demo === true` 与
		// `const okNumbers = demoBook ? [] : …` 的 `? [] :` 随之删掉 ⇒ 那两条就绪判据对演示书**照跑、照过**。
		// ⛔ 这一条**不是**还在生效的豁免：`state: 'closed'`，判定面没有任何地方读它。
		what: '源探查就绪判据里「每份转换完成的材料各有一片知识地图分片 ＋ 各一份精读细目」那两条（置态、放行、交工验货三处共用同一份判据）——**已关闭**：演示书从票 `demo-channel-full/12` 起也产这两份',
		why: '（关闭前的分叉）演示通道没有「精读小助手」这回事——分片与细目在那条路上**没有来源**（结构性到不了，不是没做完）。票 `demo-channel-full/12` 之后不成立：演示支真写那两份产物，那两条就绪判据对演示书照跑、照过。',
		origin: '票 `premature-announce/01`（前身：findings §B #3；票 `context-budget/11` · ADR-0030 决策 13 那两条 400）；关闭：票 `demo-channel-full/12`（2026-10-15）',
		// `structural`：它现在是一处**结构**（演示支那两个写盘点），不再是「一句 demo 判据」。
		guardKind: 'structural',
		state: 'closed',
		closedBy: '票 `demo-channel-full/12`（演示支也写分片与细目；`exploreArtifactProblems` 里那句 `demoBook` 分叉已删）',
		guards: [
			// ⚠️ 关了也要留一个**找得到**的守卫点（方向 A 不区分开闭）：钉那两条现在对演示书也跑的检查行。
			{ file: 'src/workflow/engine.js', contains: 'const shardMissing = okNumbers' },
			{ file: 'src/workflow/engine.js', contains: 'const detailMissing = okNumbers' },
		],
	},
	{
		id: 'material-judgment',
		// ⚠️ **已关闭**（票 `demo-channel-full/11`，2026-10-15）：演示支现在**也产**这一份产物。
		// 关闭理由：原分叉是「演示通道没有『材料判定』这回事——它连精读小助手都没有，判定产物在那条路上
		// 没有生产者」。票 11 让演示支在源探查那一趟**真写** `工作区/材料判定.json`（内容由
		// `content-lib.demoMaterialJudgment()` 给，覆盖哪几号按 `okMaterialNumbers` 现算），
		// `exploreArtifactProblems` 里那句 `demoBook ? null : readMaterialJudgment(...)` 与
		// `if (!demoBook) problems.push(...materialJudgmentProblems(...))` 随之删掉 ⇒ 那条硬闸对演示书
		// **照跑**，角色也随合并件 `materials[]` 真上屏（阶段页／探查确认卡那两处读的就是它）。
		// ⛔ 这一条**不是**还在生效的豁免：`state: 'closed'`，判定面没有任何地方读它。
		// ⚠️ 与它相邻的 `explore-artifact-shards`（分片／细目）**也已关闭**（票 `demo-channel-full/12`）——
		// 票 11 落地时那一格确实还没有来源，票 12 把两份产物都补上之后它同样不再生效。
		what: '源探查就绪判据里「材料判定产物（`工作区/材料判定.json`）在场且逐份覆盖转换完成的源」那一条——**已关闭**：演示书从票 `demo-channel-full/11` 起也产这一份',
		why: '（关闭前的分叉）演示通道没有「材料判定」这回事，判定产物在那条路上**没有生产者**。票 `demo-channel-full/11` 之后不成立：演示支在源探查那一趟写它（逐份覆盖按盘上现算），那条硬闸对演示书照跑且通过。',
		origin: '票 `pre-gold-build/01`；口径（⑤格窄处 ③：「演示书照 `explore-artifact-shards` 的先例豁免、登记在同一张表里」）住 `.scratch/pre-gold-processes/issues/11` §4；关闭：票 `demo-channel-full/11`（2026-10-15）',
		// `structural`：它现在是一处**结构**（演示支那个写盘点），不再是「一句 demo 判据」。
		guardKind: 'structural',
		state: 'closed',
		closedBy: '票 `demo-channel-full/11`（演示支也写 `工作区/材料判定.json`；`exploreArtifactProblems` 里那两处 demo 分叉已删）',
		guards: [
			// ⚠️ 关了也要留一个**找得到**的守卫点（方向 A 不区分开闭）：钉那个写盘点现在的样子。
			// ⚠️ 票 `demo-channel-full/12` 顺手订正了这一行的锚点：那一句现在读的是本函数开头现算的
			// `okNums`（分片／细目／判定产物三处共用同一份号），不再是原先内联的
			// `okMaterialNumbers(meta.sources)`——锚点跟盘上事实走，否则方向 A 当场红。
			{ file: 'src/workflow/engine.js', contains: 'JSON.stringify(demoMaterialJudgment(okNums), null, 2)' },
		],
	},
	{
		id: 'final-approve-hard-checks',
		what: '交付放行（`final-approve`）那一刻**当场重算**硬检查那一道闸',
		why: '演示通道的 `awaiting-final-approval` 由 `engine.js` 的演示支直接置下、**有意不判检查结果**（它跑的是内置回放夹具，硬检查里那几项在它身上没有来源）⇒ 放行那一刻重算只会把演示书自己拦住。真书一律当场重算。',
		origin: '票 `premature-announce/01`；与 `quality-checks-tail` 那条豁免同源（演示通道到不了那几项检查）',
		guardKind: 'demo-guard',
		guards: [
			{ file: 'src/workflow/actions/gates.js', contains: 'if (meta?.demo !== true) {' },
		],
	},
	{
		id: 'demo-chapter-skeleton-fixed',
		// ⚠️ **已关闭**（票 `stage3-hard-limits/02`，2026-10-27）：维护者裁决章数上下限都不判
		// （「章节：上限不再限制。」「章数允许只出一章」）⇒ 演示书的 3 章与真书任意章数同样合法，
		// 不再需要任何豁免。⛔ 这一条不是还在生效的豁免：`state: 'closed'`，判定面没有地方读它。
		what: '章节建议的章数区间不约束演示通道——**已关闭**：2026-10-27 起章数上下限都不判，3 章不再需要豁免',
		why: '（关闭前的分叉）演示书走旧全自动通道：章节安排与 `chapterSuggestion` 都由夹具写、从不经 `stage-submit(explore)`，3 章低于当时的默认下限。票 `stage3-hard-limits/02` 之后下限本身不存在，3 章与 1 章、12 章同样合法；骨架仍是 3 章只是演示夹具的有意取值。',
		origin: '票 `demo-flow-fidelity/02`（要做的第 3 条）＋ 票 01 Q2＝乙；关闭：票 `stage3-hard-limits/02`（2026-10-27）',
		guardKind: 'structural',
		state: 'closed',
		closedBy: '票 `stage3-hard-limits/02`（章数上下限都不判；演示骨架 3 章不再触发任何章数闸）',
		guards: [
			// ⚠️ 关了也要留一个**找得到**的守卫点（方向 A 不区分开闭）：钉演示骨架的定义处与
			// 今天唯一还处理 `chapterSuggestion` 的那条交工路径（非空形状门，已不判章数）。
			{ file: 'src/content-lib.js', contains: 'export const DEMO_CHAPTER_COUNT = DEMO_CHAPTERS.length;' },
			{ file: 'src/workflow/actions/chapters.js', contains: 'const chapterSuggestion = Array.isArray(body.chapterSuggestion) ? body.chapterSuggestion : []' },
		],
	},
	{
		id: 'explore-shards-and-readings',
		// ⚠️ **已关闭**（票 `demo-channel-full/12`，2026-10-15）：本条登记的是**那两条要求本身**
		// （分片与细目在场）——要求一个字没动；变的是「演示通道一个分片、一份细目都不产」不再成立。
		// 票 12 让演示支真写这两份（见上一条 `explore-artifact-shards`，那一处的 `demoBook` 分叉已删），
		// 于是这两条要求对演示书**照跑、照过**，本条也不再是任何东西的出处登记。
		// ⛔ 这一条**不是**还在生效的豁免：`state: 'closed'`，判定面没有任何地方读它。
		what: '分片（知识地图每源一片）与精读细目两份在场验货——**已关闭**：演示书从票 `demo-channel-full/12` 起也产这两份',
		why: '（关闭前的分叉）演示通道一个分片、一份细目都不产（`knowledge-map.json` 由引擎一步写好）。票 `demo-channel-full/12` 之后不成立：合并件由引擎按**盘上那几片 ＋ 书级键 ＋ 角色表**现拼（生产那一段拼装），分片与细目都由演示支真写。',
		origin: 'findings §B #3；票 `context-budget/11`（ADR-0030 决策 13）；搬进判据：票 `premature-announce/01`；关闭：票 `demo-channel-full/12`（2026-10-15）',
		guardKind: 'structural',
		state: 'closed',
		closedBy: '票 `demo-channel-full/12`（演示支也写分片与细目；那两条就绪判据对演示书照跑、照过）',
		guards: [
			{ file: 'src/workflow/engine.js', contains: 'const shardMissing = okNumbers' },
			{ file: 'src/workflow/engine.js', contains: 'const detailMissing = okNumbers' },
		],
	},
	{
		id: 'knowledge-coverage-gate',
		what: '知识点覆盖闸门（`knowledgePoints` ↔ `chapters[].points` 互查，失配即 400）',
		why: '演示书的 `outline` 由引擎直接写、不过 `stage-submit(outline)`，覆盖闸门在它身上没有入口点。',
		origin: 'findings §B #4（半——票 `pipeline-wiring-gaps/12` 票面写了「没动 demo 通道」）',
		guardKind: 'structural',
		guards: [
			{ file: 'src/workflow/actions/chapters.js', contains: 'if (okMaterialNumbers(outlineMeta?.sources).length > 0) {' },
		],
	},
	{
		id: 'material-standing',
		// ⚠️ **收窄过一次**（票 `demo-channel-full/13`，2026-10-15）：这一条**没有关闭**——
		// 它说的是 G1／G3／G4 三条验货，而那三条在演示通道里**从不执行**（唯一调用点是真书
		// `stage-submit(explore)` 那一跳）。变的是 `why` 里那句「夹具 `materials` 只有 `{num,sections}`」：
		// 票 11 补了 `role`／`basis`、票 13 补了 `standing`，那一格**今天在盘上、也在屏上**了。
		what: '材料分量声明 `materials[].standing` 的 G1／G3／G4 三条验货',
		why: '演示书只有 1 份转换完成的源 ⇒ 按 G2 单源豁免本就不要求 standing——**更根本的是：G1／G3／G4 这三条验货在演示通道里从不执行**（`standingGate` 的唯一调用点是真书 `stage-submit(explore)` 那一跳，演示书的合并件由引擎直接写、从不经那道门）。⚠️ 票 `demo-channel-full/13` 起合并件 `materials[]` 里**确实带着** `standing`（界面那句「分量声明：…」要看得见）⇒ 本条**不再是**「夹具没有这一格」，而是「那三条验货不跑」。原句里「夹具 `materials` 只有 `{num,sections}`」从票 11 起就已过期。',
		origin: 'findings §B #5 ＋ §C10；`standingGate` 的 G2 注释与票 `pipeline-wiring-gaps/17`；收窄者：票 `demo-channel-full/13`',
		guardKind: 'structural',
		guards: [
			{ file: 'src/domain-rules.js', contains: 'if (count >= 2) {' },
			{ file: 'src/domain-rules.js', contains: '// G1（含 G2 豁免）：≥2 份转换完成的源 ⇒ 逐源都要有一份非空 standing。' },
		],
	},
	{
		id: 'gold-style-spec-sections',
		// ⚠️ **已关闭**（票 `demo-channel-full/19`，2026-10-15）：演示书那份 `style-spec.md` 从票 19 起
		// 按真书**同一套形制**产出（五节标题在场、逐节有正文），而**判定也搬进了 `domain-rules`**
		// （`styleSpecMissingSections`）——真书交工那一跳（`actions/chapters.js`）与演示支写盘之后
		// （`engine.js` 的 `runPhase4`）**共用同一份** ⇒「演示书这一格外放行」这个分叉不存在了。
		// ⛔ 这一条**不是**还在生效的豁免：`state: 'closed'`，判定面没有任何地方读它。
		what: '`style-spec.md` 五节标题在场软验（含「多源同级声明」那一项）——**已关闭**：演示支也过这一格',
		why: '（关闭前的分叉）演示书的占位 `style-spec.md` 没有节标题，且它不交工 ⇒ 这一格在演示通道里结构上不触发。票 `demo-channel-full/19` 之后两句都不成立：节标题表与判定单点在 `domain-rules`，真书交工那一跳与演示支写盘之后共用它，缺节即当场点名（演示支那一支是当场抛）。',
		origin: 'findings §B #6（有：`chapters.js` 那段注释 ＋ 票 26）；关闭：票 `demo-channel-full/19`（2026-10-15）',
		// `structural`：它现在是一处**结构**（那份表的定义处 ＋ 两处调用点），不再是「一句 demo 判据」。
		guardKind: 'structural',
		state: 'closed',
		closedBy: '票 `demo-channel-full/19`（演示支按同一套形制产五节标题；判定与真书共用 `domain-rules.styleSpecMissingSections`）',
		guards: [
			// ⚠️ 关了也要留一个**找得到**的守卫点（方向 A 不区分开闭）：钉那份表的定义处与两处调用点。
			{ file: 'src/domain-rules.js', contains: 'export const STYLE_SPEC_REQUIRED_SECTIONS = Object.freeze([' },
			{ file: 'src/workflow/actions/chapters.js', contains: 'const missingSections = styleSpecMissingSections(spec)' },
			{ file: 'src/workflow/engine.js', contains: 'const specMissing = styleSpecMissingSections(result.styleSpec)' },
		],
	},
	{
		id: 'gold-clean-audit',
		what: '范例章的干净审计 `checkGoldAudit`（5 份必读逐字 quote ＋ `passed`）',
		why: '演示书的范例章正文与审计都由机器写，没有真小助手可审计（夹具自陈「演示章未做真实审计」）。',
		origin: 'findings §B #7（无——相邻注释只说「真实模式」）',
		guardKind: 'demo-guard',
		guards: [
			{ file: 'src/workflow/actions/chapters.js', contains: 'if (subMeta.demo !== true) {\n            const auditText = readFileSync(workFile(project, auditName), \'utf8\')' },
		],
	},
	{
		id: 'chapter-level-inspection-family',
		what: '章级验货族：正文拼装件一致性、审计结论（`passed` 按 issues 现算）、脚手架残留＋练习答案、范例章拼装件、**字数兜底下限**（⚠️ 原来的「抽查意见」那半句**已不再成立**，见 `why`）、**章末带读手册 G1′／G2′／G3′**（票 `chapter-teaching-handbook/03`）',
		why: '演示通道不派真小助手 ⇒ 没有分片可拼、没有审计件，这一族那几格在它身上无对象。⚠️ **票 `word-budget-ineffective/02` 起**多一格「正文汉字数低于 `targetWords` 兜底就拒收」：演示正文由机器确定性生成（几十字，`content-lib.js` 的 `demoChapterWrite`），与真书的兜底不可比 ⇒ 这一格在演示通道同样不判（它落在下面第 4 个守卫 `const chapterText` 那一块里，与本节其余内容验货同一条 `subMeta.demo !== true` 口径）。⚠️ **票 `demo-channel-full/06` 起**演示书**自带一条**抽查意见（落在「已处置」那一档，由 `content-lib.js` 的 `demoChapterReviews` 注入、`engine.seedDemoChapterReviews` 按 id 幂等合入）⇒ 「演示通道没有抽查意见」这半句**不再成立**：那一族在演示书上**看得见、翻得动案**。⚠️ 但用户**自己**写的那条照旧只能撤回——演示通道没有 AI 去改稿后销号，本票没有假装有（`why` 的边界就在这句）。⚠️ **票 `chapter-teaching-handbook/03` 起**又多一格「章末带读手册的三条形状判据」：演示章正文由机器确定性生成、不写带读手册 ⇒ 三条在它身上无对象；它们同样落在第 4 个守卫那一块里（同一句 `subMeta.demo !== true`）。⛔ 本条那四个原守卫点一个都没动：新增的字数下限与手册三条都落在第 4 个守卫那一块里，与抽查意见无关。',
		origin: 'findings §B #8（半：拼装＋脚手架那两格明写为有意，`audit-skip` 那一支原本无注释）；**收窄**：票 `demo-channel-full/06`；**扩一格**：票 `word-budget-ineffective/02`；**再扩一格**：票 `chapter-teaching-handbook/03`',
		guardKind: 'demo-guard',
		guards: [
			{ file: 'src/workflow/actions/chapters.js', contains: 'if (subMeta.demo !== true) {\n            const assembled = verifyChapterAtSubmit(project, gN)' },
			{ file: 'src/workflow/actions/chapters.js', contains: 'if (subMeta.demo !== true) {\n            const assembled = verifyChapterAtSubmit(project, n)' },
			{ file: 'src/workflow/actions/chapters.js', contains: 'if (subMeta.demo !== true) {\n            const audit = readChapterAudit(project, n)' },
			{ file: 'src/workflow/actions/chapters.js', contains: 'if (subMeta.demo !== true) {\n            const chapterText = readFileSync(chapterPath, \'utf8\')' },
			{ file: 'src/workflow/actions/chapters.js', contains: 'const handbook = chapterHandbookReading(project, chapterText, subMeta)' },
		],
	},
	{
		id: 'merge-cross-audit',
		what: '合并前跨章审计 `工作区/audit-cross.md` 的五项核对',
		why: '演示通道不派跨章审计小助手；演示支的合并由机器直接拼装。',
		origin: 'findings §B #9（有）；票 `context-budget/05`（ADR-0030 决策 2）',
		guardKind: 'demo-guard',
		guards: [
			{ file: 'src/workflow/actions/chapters.js', contains: "if (subMeta.demo !== true) {\n            const crossPath = workFile(project, 'audit-cross.md')" },
		],
	},
	{
		id: 'final-gate-family',
		what: '终检族：留言销号、`工作区/progress.md`、五份分查报告、style-spec 指纹（四条收在 `finalDeliveryProblems` 的 demo 早退里）＋ `styleCheck` 处置契约',
		why: '⚠️ **本条守的都是「交工验货那一刻」**，而演示书**从不经真的 `stage-submit(final)` 交工验货**（`content-source-seam` 的同一族）。票 `flow-audit-2026-10/01` 起前四条收进 `finalDeliveryProblems`，它一进门就 `if (subMeta === null || subMeta.demo === true) return []`；`styleCheck` 那一格仍保留原来的 `if (subMeta.demo !== true)` 守卫。⚠️ 但「对象不存在」那半句**已被逐票推翻**，⛔ 别照旧读它：票 `demo-channel-full/08` 起演示书的终检支**真产**五份分查报告与那份派生汇总件；票 `04` 起演示书的铺章那一段**真产**进度账本（`工作区/progress.md`）；票 `10` 起演示书**自带一条示例留言**（建档时注入、终检那一趟按真书契约销号 ⇒ 交付出去的那本书不留挂着的留言）与**三条示例风格线**（终检那一趟逐条交代去向，`adopted`／`conflict`／`superseded` 各一）。变的是「演示书盘上／账上有没有那几样」，不是「那两道门对 demo 开不开」：⛔ 别把这一条读成「哪一票放宽了那道门」。',
		origin: 'findings §B #10（有）；票 `context-budget/11` ⑤ 明写「demo 不因缺五份被拒」；**收窄**：票 `demo-channel-full/08`',
		guardKind: 'demo-guard',
		guards: [
			{ file: 'src/workflow/actions/chapters.js', contains: 'if (subMeta === null || subMeta.demo === true) return []' },
			{ file: 'src/workflow/actions/chapters.js', contains: 'if (subMeta.demo !== true) {\n            const active = (subMeta.styleNotes ?? []).filter((n) => n.status === \'active\')' },
		],
	},
	{
		id: 'quality-checks-tail',
		// 票 `demo-flow-fidelity/06`：`what` 与下面的 `checkNames` 都从**同一个数组**拼出来
		// （`src/domain-rules.js` 的 `QUALITY_CHECKS_TAIL_NAMES`），前端那句提示句
		// （`src/ui/view-rules.js` 的 `demoQualityChecksNote()`）用的也是它——三处一个引用，
		// 谁也别再抄一份。⚠️ 票 06 收口（2026-10-08）：那个数组装的是 `engine.js` 那几处
		// `checks.push({ name })` 的**服务端 `name` 逐字**（9 处——票 `pre-gold-build/16` 补了
		// 交付清单那三道之后是 12 处；这个数会腐烂，逐条以那边为准），所以 `what` 这句里会出现
		// 机器名——这是**对的**：本声明面只给判据读、不上屏（判定线：机器检查 `name` 不改，
		// 翻译发生在界面出口，那句提示句逐项过 `checkHuman`）。
		// ⚠️ 票 `demo-channel-full/04` **收窄**：名单里「进度账本齐全」那一项，演示书**真跑**了
		// （演示书现在真产 `工作区/progress.md`）⇒ 那一处守卫从 `guards` 里删掉、`why` 按新事实改写。
		//   ⚠️ 名单本身（`QUALITY_CHECKS_TAIL_NAMES`）**一个字没动**——它记的是**真书**后半那一段，
		//   那一项真书上照旧跑；「演示通道不跑哪几项」由界面那句提示句**从那名单减去这一屏真跑了的**现算
		//   （`src/ui/view-rules.js` 的 `demoQualityChecksNote`），⛔ 别为了这件事去改那份名单。
		// ⚠️ `checkNames` **不是判据**（窄处见文件头 ⑤）。
		what: `\`runQualityChecks\` 后半 ${QUALITY_CHECKS_TAIL_NAMES.length} 项（${QUALITY_CHECKS_TAIL_NAMES.join('、')}）里，演示通道**不跑**除「进度账本齐全」「风格线条条有着落」以外的那些项`,
		checkNames: QUALITY_CHECKS_TAIL_NAMES,
		why: '演示通道不派真小助手、不花模型额度，这些项的输入（style-spec 清单等）在演示书里没有来源。⚠️ 票 `demo-channel-full/04` 起**「进度账本」不再是理由**：演示书真产 `工作区/progress.md`（铺章那一段落的），那一格检查因此在演示书上真跑（`engine.js` 的 `runQualityChecks`，两处口径同一份判定）。⚠️ 票 `demo-channel-full/10` 起**「风格线条条有着落」也不再是理由**：演示书建档时自带三条示例风格线（`content-lib.js` 的 `DEMO_STYLE_NOTES`），并由演示支的终检那一趟逐条交代去向（`engine.applyStyleDisposals`）⇒ 那一格在演示书上同样是**真读数**（0 条 active ⇒ 通过，把处置拿掉 ⇒ 当场点名）。余下那些项的输入仍然没有来源。',
		origin: 'findings §B #11（半——ADR-0008 与 `engine.js` 有口径，四处守卫本身原本无注释）；清单见 `.scratch/pipeline-wiring-gaps/verification.md`；机器可读的 `checkNames` 由票 `demo-flow-fidelity/06` 补（同一批项名还给前端那句提示句用）；**收窄**：票 `demo-channel-full/04`；**再次收窄**：票 `demo-channel-full/10`',
		guardKind: 'demo-guard',
		guards: [
			{ file: 'src/workflow/engine.js', contains: "if (meta?.demo !== true) {\n    const spec = existsSync(workFile(projectId, 'style-spec.md')) ? readWork(projectId, 'style-spec.md') : ''" },
			{ file: 'src/workflow/engine.js', contains: 'if (meta?.demo !== true) {\n    const chapters = meta?.outline?.chapters ?? []' },
			{ file: 'src/workflow/engine.js', contains: 'if (meta?.demo !== true) {\n    // ① 章名全书唯一：直接读大纲的章名，不经正文' },
		],
	},
	{
		id: 'chapter-pipeline-ledger',
		// ⚠️ **已关闭**（票 `demo-channel-full/03`，2026-10-15）：演示支现在**也落**这一笔。
		// 关闭理由：原分叉是「演示通道不上报 `progress` ⇒ `meta.chapterPipeline` 恒空」。那是**当时**的
		// 事实，而票 03 把「拼数组 ＋ 写 meta」抽成**唯一写入口**（`engine.recordChapterStage`）并让演示支
		// 在它自己真走过的那几步上调它（`writing`／`auditing`／`done`）⇒ 这一格在演示书上**不再恒空**，
		// `progress` 动作里那句 `if (state.demo === true) return` 也随之删掉（同一份上报不再分成两半）。
		// ⛔ 这一条**不是**还在生效的豁免：`state: 'closed'`，判定面没有任何地方读它。
		what: '`meta.chapterPipeline`（每章流水线阶段）落账——**已关闭**：演示支从票 `demo-channel-full/03` 起也落这一笔',
		why: '（关闭前的分叉）演示通道不上报 `progress` ⇒ 这一格恒空。票 `demo-channel-full/03` 之后不成立：写入抽成 `engine.recordChapterStage` 单一出口，真书 `progress` 那一跳与演示支那几步共用它。',
		origin: 'findings §B #12（有）；关闭：票 `demo-channel-full/03`（2026-10-15）',
		// `structural`：它现在是一处**结构**（唯一写入口的定义处），不再是「一句 demo 判据」。
		guardKind: 'structural',
		state: 'closed',
		closedBy: '票 `demo-channel-full/03`（演示支也落 `meta.chapterPipeline`；写入抽成 `recordChapterStage` 单一出口）',
		guards: [
			// ⚠️ 关了也要留一个**找得到**的守卫点（方向 A 不区分开闭）：钉那个唯一写入口现在的定义处
			// ——它替掉了原先那句 `if (state.demo === true) return`。
			{ file: 'src/workflow/engine.js', contains: 'export function recordChapterStage(projectId, chapterN, stage) {' },
		],
	},
	{
		id: 'deep-modify',
		// ⚠️ 票 `demo-channel-full/17`（维护者 2026-10-15 拍板「入口可见 ＋ 点了给明确告知」）：
		// **界面那一半的分叉去掉了**——`src/workflow.js` 的 `seg.canDeepModify` 不再带
		// `&& meta?.demo !== true`，演示书与真书在**同一处**渲染那颗键（同一个 `modify` 目标）。
		// ⇒ 本条现在**只剩动作层那一半**：拦的是「真去归档／截断账本／重做下游」，不是「看得见」。
		// ⛔ 那句 409 的文案变了（改成人话），判定一个字没放宽——文案只有一处持有：
		// `actions/deep-modify.js` 导出的 `DEMO_DEEP_MODIFY_NOTICE`（判据引那一份，不手抄）。
		what: '定点修改／深改的**动作**（演示书上入口可见、点得动，但不会真重做任何东西）',
		why: '演示书走旧全自动通道，没有可回退重做的真实段 ⇒ 动作层照旧整条拒（409），只是文案改成说清「这一步在演示书里只是给你看它长什么样」。⚠️ 入口那一半**从票 17 起不再是分叉**。',
		origin: 'findings §B #13（有：`deep-modify.js:53` 注释）',
		guardKind: 'demo-guard',
		guards: [
			{ file: 'src/workflow/actions/deep-modify.js', contains: 'if (meta.demo === true) { return reject(409, DEMO_DEEP_MODIFY_NOTICE) }' },
			{ file: 'src/workflow/actions/deep-modify.js', contains: 'if (meta.demo !== true) {\n        try { wakeMainAI(ctx, project) } catch { /* 唤醒失败不阻塞深改 */ }' },
		],
	},
	{
		id: 'startup-recovery',
		what: '启动续跑与老书过程记录回填',
		why: '演示书重启后不该自动接着跑（那会凭空烧掉一轮演示），也没有老账本要回填。',
		origin: 'findings §B #14（半——测试写明，产品代码那两行原本无注释）',
		guardKind: 'demo-guard',
		guards: [
			{ file: 'src/workflow.js', contains: "if (meta === null || meta.demo === true) continue\n      if (meta.status === 'running') {" },
			{ file: 'src/workflow.js', contains: 'if (meta === null || meta.demo === true) continue\n      const logPath = processLogPath(id)' },
		],
	},
	{
		id: 'review-drive',
		what: '过目态提意见时的驱动（`handoff()` 不补 kick ⇒ 演示书停在 `running/pendingStage`）',
		why: '票 05 修（把 `chapters.js` 的交办换成 `handoffAndDrive()`）；**本分支尚未落地**——t08 上那行还是 `handoff()`，所以这条分叉此刻还活着，本票只按票面口径登记为「已关闭」。',
		origin: 'findings §B #15（无）；票 05（`.scratch/demo-flow-fidelity/issues/05-过目态提意见不补-kick.md`）',
		guardKind: 'structural',
		state: 'closed',
		closedBy: '票 05（过目态提意见不补 kick）',
		// ⚠️ 守卫点**刻意不钉在 `chapters.js` 那行 `handoff()` 上**：那正是票 05 要改的行，
		// 钉上去等于给票 05 埋一颗必然踩到的红。这里钉的是修好之后仍然存在的**补驱动 seam**。
		guards: [
			{ file: 'src/workflow/engine.js', contains: 'function handoffAndDrive(ctx, projectId, stage, gate = null, snapshotReason = null, options = {}) {' },
		],
	},
	{
		id: 'demo-self-drive',
		what: '交办后唤醒主 AI（演示书没有主 AI 可唤醒 ⇒ 改补一次 `kick`）',
		why: '`wakeMainAI` 对演示书恒 false，不补 kick 则 `pendingStage` 挂着没人推；副作用是确认闸门放行后多一条 `stage-start`／`pendingStage` 残留。',
		origin: 'findings §B #16 ＋ §A；`engine.js` 的 `handoffAndDrive` 函数文档',
		guardKind: 'demo-guard',
		guards: [
			{ file: 'src/workflow/engine.js', contains: 'if (meta === null || meta.demo === true) return false\n  const sessionId = meta.session' },
			{ file: 'src/workflow/engine.js', contains: 'if (woke === false && meta !== null && meta.demo === true) void kick(ctx, projectId)' },
			{ file: 'src/workflow/actions/gold.js', contains: 'else { void kick(ctx, project) }' },
		],
	},
	{
		id: 'dead-condition-and-stale-doc',
		what: '真实支里那条恒真的 demo 判据（死条件），以及它上方那句过期文档',
		why: '它在 `if (meta.demo)` 早退**之后**的真实支里 ⇒ 恒真、无害；同一处函数文档还写着演示支「＋ 交付」，而它实际停在 `awaiting-final-approval`（交付在 `gates.js` 的认可动作里）。**本票只登记、有意不修**（改它属别的边界）。',
		origin: 'findings §B #17（无——文档与代码不一致）',
		guardKind: 'demo-guard',
		guards: [
			{ file: 'src/workflow/engine.js', contains: "if (meta.status !== 'awaiting-chapters-review' && meta.chaptersReviewed !== true && meta.demo !== true) {" },
			// ⚠️ 同上：从 `'awaiting-final-approval'` 起，**不**带上 `ensureStatus(`——
			// 合起来就是一个「workflow 能设这个值」的写入点形状（`test-gate-write-points.mjs` 的
			// `scanAwaitingSetPoints` 会把它算成声明面里的一处写入点 ⇒ 真写入点被删也照样绿）。
			// ⚠️ 票 `demo-channel-full/26` 只订正**这一格锚点**：那一行的 hint 实参由
			// `FINAL_CHECK_DONE_HINT` 换成两取值的 `finalCheckDoneHint(readMeta(projectId))`
			// （本条管的是**那个死条件与过期文档**，与 hint 的取值无关——`what`／`why` 一个字未改）。
			{ file: 'src/workflow/engine.js', contains: "'awaiting-final-approval', finalCheckDoneHint(readMeta(projectId)))" },
		],
	},
	{
		id: 'final-acceptance-card',
		what: '**（已关闭）** 终检认可卡的内容（自查报告全文 ＋ ' + QUALITY_CHECKS_TAIL_NAMES.length + ' 项 ＋ 汇总件指针）',
		why: '原来：演示通道不产 `textbook/ai-report`，认可卡上只有机器质量门那几项。**票 `demo-channel-full/08` 起不再成立**——演示书的终检支也产：自查报告全文（账本事件 `textbook/ai-report`）、五份分查（`工作区/报告/final-NN.md`）与那份**机器拼的**派生汇总件的指针（`meta.finalReport`）⇒ 认可卡上那三件都有了。⚠️ 两边**仍然**不同的只剩两处，各自另有登记：**项数**（演示书 6 项 vs 真书 ' + QUALITY_CHECKS_TAIL_NAMES.length + ' 项 ⇒ `quality-checks-tail`）与**风格线去向那一栏**（⇒ `final-gate-family`）；⛔ 不在本条里再登记一次（同一件事两处口径）。',
		origin: 'findings §B #18（半——`engine.js` 函数文档一句）；票 `context-budget/12` ⑦；**关闭**：票 `demo-channel-full/08`',
		guardKind: 'structural',
		state: 'closed',
		closedBy: '票 `demo-channel-full/08`（演示书的终检那一屏补全：自查报告 ＋ 五份分查 ＋ 派生汇总件）',
		guards: [
			// ⚠️ 片段**刻意从 `appendEvent` 的第一个实参起**——不整行照抄那处调用：
			// 声明面是 `src/**` 下的一份**文本**，`test-ledger-artifact-fields.mjs` 的
			// `findAppendEventCalls` 把「`appendEvent` ＋ 左括号」当落账调用点做闭包对账
			// （票 08 合入后整链红的就是这一处）。同族锚点的**常驻闸**在 `test-demo-exemptions.mjs`。
			// ⚠️ 那处调用**还在**（演示终检支照旧落这一笔质量门账）——本条关闭的是**分叉**，不是删代码。
			{ file: 'src/workflow/engine.js', contains: "{ label: '最后检查（质量门）', outcome: 'ok', ...artifactDataForStage('final') }" },
		],
	},
	{
		id: 'book-shape-reconcile',
		// 票 `demo-channel-full/05`：这条**已经关掉**（演示通道也写那两份形状件，对账不再恒 `null`）。
		// ⚠️ 写这段时**别抄任何落盘件文件名**（连模板写法也不行）：`test-artifact-path.mjs` 那条闸
		// 判的就是「`src/**` 非注释行里不许手写落盘件路径」——落盘件那一族的名字只由 `domain-rules`
		// 的出口持有（细目那一族 `readingRel`／`readingName`，分报告与派生汇总件那一族
		// `finalAuditReportRel`／`finalAuditReportName`／`finalAuditSummaryRel`／`finalAuditSummaryName`）。
		// ⛔ 票 08 与票 05 各在这句 `why` 上撞过一次（本票把两处一起改成现在这样）。
		what: '书夹形状对账（产物清单 ↔ 扫盘登记，缺件清单）——**已关闭，不再是分叉**',
		why: '**票 `demo-channel-full/05` 之前**：`demo-run` 那条路不建形状件 ⇒ 这份对账在演示书上恒 `null`（没有可谈的差集）。**那之后**：`demo-run` 与 `book-create` **同一处两件**（`writeArtifactManifest` ＋ `refreshArtifactRegistry`），于是演示书也有「应当有什么」与「实际有什么」两份、并且**如实列出差集**（演示通道本来就不产的那几族——分片、细目、知识地图分片、前言——会**真的显示成缺件**，那是**读数**，不是缺陷）。⚠️ 两种演示书（`demo-run` 建的那本与 `book-create(demo:true)` 建的那本）在这件事上现在**同一套行为**，本条不再区分它们。',
		origin: 'findings §B #20（无——`manifestRowsFor`／`bookShapeReport` 没有 demo 口径）；关闭者：票 `demo-channel-full/05`',
		guardKind: 'structural',
		state: 'closed',
		closedBy: '票 demo-channel-full/05（演示书也建形状件两件，对账不再恒 null）',
		guards: [
			{ file: 'src/workflow/actions/patterns-ops.js', contains: "case 'demo-run': {" },
			{ file: 'src/workflow/actions/books.js', contains: 'writeArtifactManifest(id, meta)' },
			{ file: 'src/workflow/book-shape.js', contains: 'if (readArtifactManifest(projectId) === null) return null' },
		],
	},
	{
		id: 'phase1-no-real-conversion',
		what: '阶段一的真实转换（MinerU 那一步）',
		why: '演示书的源是一条**占位**（盘上没有 `sources/`）——真跑一次转换要 MinerU Token、要时间、还要处理失败态与重试，与「不花模型额度、几步走完」的入口语义冲突；所以阶段一在演示书里是「已完成」的**展示态**，不是「没做」。',
		origin: '票 01 Q4（2026-10-07 裁决：维持 `demo-run` 伪造「材料准备已完成」这一态）；理由正文在 `patterns-ops.js` 的 `case \'demo-run\'` 旁',
		guardKind: 'structural',
		guards: [
			// ⚠️ 同上：片段从 `appendEvent` 的实参起，目的一样（别把落账调用点抄进声明面）。
			{ file: 'src/workflow/actions/patterns-ops.js', contains: "'textbook/phase-start', { phase: 1, label: PHASE_LABELS[1] })" },
			{ file: 'src/workflow/actions/patterns-ops.js', contains: "'textbook/phase-end', { phase: 1, label: PHASE_LABELS[1] })" },
		],
	},
	{
		id: 'demo-phase1-continue-key',
		what: '演示书的阶段一：**(a)** 卡上那颗「▶ 开始演示（往下走）」的键（只在**演示书 ＋ 阶段一**出现）；**(b)** 引擎侧「`demo-run { mode: \'next\' }` 只认演示书」那一条判据',
		why: '演示书的材料准备是**展示态**（见上面 `phase1-no-real-conversion`）⇒ 它自己**不会**像真书那样在转换完成后自动往前走；没有这颗键与「继续」那一跳，用户就停在那一屏没有出路。真实书的阶段一没有这颗键、也不认这个模式，所以它是**一条显式的分叉**、两半（界面 ＋ 引擎）各一个守卫点。',
		origin: '票 `demo-channel-full/02`；那颗键做的事 ＝ `demo-run { mode: \'next\' }`（见 `src/workflow/actions/patterns-ops.js` 的 `case \'demo-run\'`）',
		guardKind: 'demo-guard',
		guards: [
			// (a) 守卫点＝那颗键的**可见性判据**（`src/ui/event-cards.js` 的 `UploadArea`）。⚠️ 它逐字用
			// 五字面量里的 `meta?.demo !== true`，所以方向 B 会把它扫成一处分叉——本条目就是它的登记。
			{ file: 'src/ui/event-cards.js', contains: 'const demoNextVisible =\n\t\tmeta?.demo !== true ? false : meta.phase === 1 && typeof onDemoNext === "function";' },
			// (b) 守卫点＝「继续」那一跳**挑书**的那一行（只挑演示书；真实书一律落到下面那条 409）。
			{ file: 'src/workflow/actions/patterns-ops.js', contains: 'const heldMeta = listProjects(sessionId).find((meta) => meta !== null && meta.demo === true)' },
		],
	},
	{
		id: 'waiver-mechanism',
		what: '用户豁免口（`waive`：`audit-skip`／`progress-skip`／`scaffold-keep`／`other`／`gold-skip`）在演示书里不生效——**这一下照旧可点**（票 `demo-channel-full/14` 起它拿回一句如实的说明，不再是「点了没反应」），但它**不写** `meta.waivers`、不放行任何东西',
		why: '演示通道不派真小助手，没有「以用户说明为准」的对象，`waived()` 对演示书恒 false。⚠️ 更根本的是：演示通道**从不真跑那些验货**（`stage-submit` 那条链在它身上没有入口点）⇒ 照真书那样记一条豁免，「某条检查被用户放行了」这句话在账上就是**假话**（那条检查在这条通道里根本没跑过）。⇒ 票 `demo-channel-full/14` 的处置是「可点但不算数 ＋ 一句如实告知」（`DEMO_WAIVE_NOTICE`），判定一个字没改。',
		origin: '`engine.js` 的 `waived()` 注释「真实模式 ＋ `userNote` 非空 ＋ **作用域对得上**才算数」；ADR-0008。⚠️ 这句引文原先抄的是「真实模式 ＋ userNote 非空才算数」——票 `walkthrough-fixes/23` 给 `waived()` 加了第三件（作用域）之后它没跟着改（收口 review 的 N5：抄件引文腐烂）；今天逐字对齐 `waived()` 头上那一行。',
		guardKind: 'demo-guard',
		guards: [
			// ⚠️ 票 `walkthrough-fixes/23` 起 `waived()` 多了第三参（作用域：哪一条检查／哪本书／哪一章），
			//    下面这段抄件跟着它改过一次——守卫点必须逐字命中**现行**代码，否则方向 A 会红。
			{ file: 'src/workflow/engine.js', contains: "if (meta === null || meta.demo === true) return false\n  const wantCheck = scope === undefined ? undefined : scope.check" },
			// 票 `kn-unowned-silent/02`：**逐点豁免**那个读取口同样对演示书恒失效（它读的是同一份
			// `meta.waivers`）。⚠️ 这一处是新写的，所以必须同批登记——元检查按
			// `DEMO_GUARD_LITERALS` 逐处数，漏登记当场红（票 08 教训：守卫散着写＝没人知道它存在）。
			{ file: 'src/workflow/engine.js', contains: "if (meta === null || meta.demo === true) {\n    return { waived: [], kept:" },
			// ⚠️ 票 `demo-channel-full/14`：豁免口那一跳**先给一句告知、什么都不写**的那条守卫。
			//    `contains` 从第二个 token 起（别把这一行整句抄成调用表达式形态——声明面是 `src/**`
			//    的一份文本，`return accept(...)` 那种写法会被别的扫描面当成锚点，见本文件头
			//    「声明面是**一份会被别人扫的文本**」那一节）。
			{ file: 'src/workflow/actions/collab-signals.js', contains: "{ project, demo: true, notice: DEMO_WAIVE_NOTICE }" },
		],
	},
	{
		id: 'reader-boundary-backfill-key',
		what: '老书维护通路那颗「补一份读者边界」的键（阶段 2 那一屏；过了站 2 的老书才看得见）',
		why: '演示书补不了读者边界——它那条流程是录好的。⚠️ 它与「补一份知识点图」那颗键的演示守卫是**同族的两个档**（`GRAPH_BACKFILL_HIDDEN.demo` 那一档），但**这一处是另一条判据**（`readerBoundaryBackfillEntry` 的第三条），⛔ 不与补图那条共用一条声明：两条可见性将来分道扬镳时，各自红在自己的文件上，不会一条声明替另一条兜底。',
		origin: '票 `reader-cognition-boundary-build/10`（spec §4.6；票 `reader-cognition-boundary/11` Q3 那格「演示书 ⇒ 不摆」）；守卫点＝`src/ui/reader-boundary-backfill.js` 的 `readerBoundaryBackfillEntry` 第三档',
		guardKind: 'demo-guard',
		guards: [
			// 守卫点逐字用的是五字面量里的 `meta.demo === true`（不是 `meta?.demo`：这一行之前已经
			// 判过 `meta` 是对象），所以方向 B 会把它扫成一处分叉——本条目就是它的登记。
			{ file: 'src/ui/reader-boundary-backfill.js', contains: 'if (meta.demo === true) return { show: false, reason: "demo" };' },
		],
	},
	{
		id: 'demo-error-status',
		what: '出错后的状态归属（`error` 而不是 `needs-config`）',
		why: '演示通道出错是流程 bug 或环境问题（可直接重试）；真实模式的子助手失败多半是 LLM 未配置／欠费，才要配置引导。',
		origin: '`engine.js` 的 `recordAgentError` 注释',
		guardKind: 'demo-guard',
		guards: [
			{ file: 'src/workflow/engine.js', contains: "meta.status = meta.demo === true ? 'error' : 'needs-config'" },
		],
	},
	{
		id: 'gold-chapter-opinions',
		// ⚠️ **收窄过一次**（票 `demo-channel-full/15`，2026-10-15）：这一条**没有关闭**——
		// 「带 `chapter` 的 `gold-opinion` 在演示书上落 `pendingReviews`」这半件事**照旧不成立**
		// （`test-collab-backend.mjs` 的 F39 有一条**红线**正断着「demo 书过目态带 chapter ⇒ 409」，
		// 本票一个字没动它）。变的是**原 `why` 那句话是假的**：它写「演示书的段落意见走 `goldOpinions`
		// 老链路」，而实测（票 15 的探针）带 `chapter` 那一支在演示书上拿回 **409「现在不在最佳范例章确认环节」**、
		// 一个字节都不落，`goldOpinions` 也恒空——「老链路」只对**不带 `chapter`** 的那条路（范例章卡）成立。
		// 另一半变化：票 `demo-channel-full/15` 起演示书**自带一条**示例段落意见（已处置那一档），
		// 于是那一格在演示书上**看得见、翻得动案、撤回得掉**。
		// ⛔ 判定面（那个 `meta.demo !== true` 守卫）与红线判据一个都没动。
		what: '全章过目段的段落意见（带 `chapter` 的 `gold-opinion` 落 `pendingReviews`）在**演示书**上不发生：点了给 409、一个字节都不落——那一格由演示书**自带的示例段落意见**充当（票 `demo-channel-full/15`）',
		why: '这一支的守卫是 `meta.demo !== true` ⇒ 只对真实模式生效（红线判据：`test-collab-backend.mjs` 的 F39「demo 书过目态带 chapter ⇒ 409」）。⚠️ **原句「演示书的段落意见走 `goldOpinions` 老链路」已按盘上事实订正**：带 `chapter` 的那一支在演示书上直接 409、`goldOpinions` 恒空（「老链路」只对**不带 `chapter`** 的范例章卡那条路成立）。⚠️ **票 `demo-channel-full/15` 起**演示书**自带一条**示例**段落意见**（`content-lib.js` 的 `demoChapterOpinions`，`engine.seedDemoChapterReviews` 按 id 幂等合入）：它落在**已处置**那一档 ⇒ 正文装订线上真标出 `#N ✏️`、意见行上真写「已处置 · <怎么处置的>」并给那颗「翻案」，段旁那颗键再点一次＝撤回。⛔ 演示书这一族的边界是「自带的示例在、看得见、翻得动案、撤回得掉」，**不是**「用户自己能在演示书上提一条段落意见」。',
		origin: '`gold.js` 的注释（F39，2026-08-20 走查）——⚠️ findings §B 那 20 条**没有收录它**（它的理由注释本来就写着，属「有」），但它落在五字面量扫描面里，故一并登记：本票的枚举面比 findings §B 宽；**收窄**：票 `demo-channel-full/15`',
		guardKind: 'demo-guard',
		guards: [
			// 守卫点＝**那一支的门**（与真实模式共用同一条条件；`meta.demo !== true` 这一半是它的 demo 面）。
			{ file: 'src/workflow/actions/gold.js', contains: 'if (meta.demo !== true && meta.phase === 5 && chapter !== null && chapter <= chapters.length) {' },
			// 第二个守卫点钉**形状的唯一出口**（票 15 抽出来的那一处：真书那一支与演示书自带的那条示例
			// 都从它派生）——它同时是「演示书上那一格凭什么画得出来」的读数。
			// ⚠️ 片段从第二个 token 起（别把调用表达式整行抄进声明面：那是被别人扫的文本，见本文件头那一节）。
			{ file: 'src/workflow/engine/labels.js', contains: 'export function paragraphOpinion({ id, at, chapter, target, kind, wish }) {' },
		],
	},
	{
		id: 'gold-seal-not-recorded',
		// ⚠️ **已关闭**（票 `demo-channel-full/16`，2026-10-15）：演示书的定稿**也沉淀**了。
		// 关闭理由：原分叉是「演示书的定稿由内置回放夹具走完、每一本都零意见」⇒ 记这一笔就是每本多
		// 一条事件，会把人录的演示基线顶掉，而票 `pre-gold-build/08` 不许改它。**本 effort 的决定 3
		// 推翻了那条理由**（这里的改动就是要改演示产物）⇒ `sealGoldStandard` 里那句
		// `if (state !== null && state.demo === true) return false` 删掉，演示书与真书走**同一处**
		// 沉淀（`meta.goldSealed` ＋ `textbook/gold-seal` ＋ 刷新风格线镜像），零未撤销意见 ⇒
		// 事件里的 `count: 0`。⇒ 那三处承诺面（《过程记录.md》与对话播报那句、`ui/chat-desk.js` 的
		// 回执、`ui/phase-page.js` 的「✅ 已定稿」）在演示书上**从此真出现**。
		// ⚠️ **同一函数里仍留着一处演示分支**（下面第一个守卫点钉的就是它）：它只为
		// `premature-announce/05` 那一笔（`noteStyleSpecUnfrozen`）存在——票 16 复核后**保留**，
		// 但理由**换掉了**：不再是「为保录制基线」，而是那句话对演示书**不成立**（它说「交工时读不到
		// 写作规范那一份文件」，而演示书此刻 `工作区/style-spec.md` 就在盘上、缺的只是
		// `stage-submit gold` 那一跳留下的指纹）⇒ 记它就是响一句假话。那一笔与金标准沉淀无关，
		// 所以本条仍然是**关闭**（⛔ 不是「留着但改理由」那种收窄）。
		what: '**零未撤销意见**的范例章定稿不写 `meta.goldSealed`、不落 `textbook/gold-seal` 事件 ⇒ 三处承诺面（`logEntryText`／`announceText` 的播报句、`ui/chat-desk.js` 的回执、`ui/phase-page.js` 的「✅ 已定稿」）在演示书上都不出现——**已关闭**：演示书从票 `demo-channel-full/16` 起也沉淀（零意见 ⇒ `count: 0`、`version: 1`），三处承诺面真出现',
		why: '（关闭前的分叉）演示书的定稿由内置回放夹具走完、**每一本都零意见**，于是「零意见也沉淀」（票 `pre-gold-build/08` 的补机制）落在演示书上＝每本多一条事件 ＋ 刷新那份风格线镜像 ⇒ 当年认定它会把**人录的**演示基线（`cassettes/demo-full.json` 比对事件类型序列与工作区产物指纹）当场顶掉，而票 08 不许改它。票 `demo-channel-full/16` 的立场与那次相反（地图决定 3：这里的改动就是要改演示产物）⇒ 这条理由不成立，基线由集成分支重录。⚠️ 与它相邻的那一笔（`noteStyleSpecUnfrozen`，票 `premature-announce/05`）**不在本条的射程里**：它另有理由、复核后保留。',
		origin: '票 `pre-gold-build/08`（承诺面④；同一句话写在 `sealGoldStandard` 的函数文档里）；同函数上一笔 `noteStyleSpecUnfrozen` 的先例（票 `premature-announce/05`：为同一条录制基线，把演示通道排除在新事件之外）；关闭：票 `demo-channel-full/16`（2026-10-15，含对 `premature-announce/05` 的复核结论）',
		// `demo-guard`：下面第一个守卫点**就是**五字面量之一的那处演示判据（不是「结构性到不了」）。
		guardKind: 'demo-guard',
		state: 'closed',
		closedBy: '票 `demo-channel-full/16`（演示书的定稿也沉淀：`meta.goldSealed` ＋ `textbook/gold-seal` ＋ 刷新风格线镜像；`sealGoldStandard` 里那句演示早退已删）',
		guards: [
			// ⚠️ 关了也要留一个**找得到**的守卫点（方向 A 不区分开闭）：钉同一函数里仍在的那处演示分支
			// （今天只为「写作规范没定格」那一笔存在）。
			// ⚠️ 这一行也是 `state.demo === true` 在 `src/**` 非注释行里**唯一**的命中——它没了，
			// `test-demo-exemptions.mjs` 的「每个字面量都真的用得着」那一格会红（空名单）。
			{ file: 'src/workflow/engine.js', contains: 'const demoBook = state !== null && state.demo === true' },
			// 第二个守卫点钉**沉淀本体**那一行：它对演示书也跑了（本票之后），照票 12 的先例留一个
			// 「关掉之后这一格仍被谁守着」的读数。
			{ file: 'src/workflow/engine.js', contains: 'meta.goldSealed = { version: Math.max(1, goldVersions), at: Date.now() }' },
		],
	},
];
