/**
 * explore 合并件（`工作区/knowledge-map.json`）的**机器按键拼装**
 * （票 `.scratch/context-budget/issues/17` · ADR-0030 决策 2 的延续）。
 *
 * ## 它做什么／不做什么（这一段就是本模块的边界，别在别处另写一句）
 *
 * - **做**：把各精读小助手落盘的分片 `工作区/knowledge-map-NN.json` 按**分片序号顺序**按键拼接
 *   （`materials` / `knowledgePoints` / `teachingMethods` 这类数组键首尾相接），再叠上**主笔交来的书级参数**，
 *   拼成一份固定的 JSON 落 `工作区/knowledge-map.json`。它是**各分片 ＋ 书级参数的确定函数**
 *   ——同一份输入必然逐字同一份输出（不读时钟、不写随机数）。
 * - **书级参数分两族**（族表＝唯一的说法，见 {@link BOOK_LEVEL_FAMILIES}）：**逐字搬运族**
 *   （`teachingFocus` / `chapterSuggestion`：只由主笔产出、机器一个字不改、**逐字相等**是契约）
 *   与**拼接族**（`edges`：分片那份在前、书级那份在**后**，首尾接成一张边表；`readerSlices`（片）：
 *   同一族的第二员——分片侧今天不产它 ⇒ 合并件里就是主笔交的那一份；**缺席合法**，消费侧的
 *   「整书一片」退化由 {@link effectiveReaderSlices} 现算，不写回合并件）。
 *   ⛔ 不在任何一族里的书级参数**不许静默丢**：{@link bookLevelProblems} 逐键点名，
 *   拼装器当场抛、判据当问题返回（两面都走同一份点名）。
 * - **第三个输入**（票 `pre-gold-build/01`）：材料判定给的 `num → {role, basis?}` 表。`role` 的
 *   唯一住处是书级的判定产物 `工作区/材料判定.json`（`domain-rules.materialRoleTable()` 把它收成
 *   那张表），机器按**分片号**把它并进 `materials[]` 条目。**缺就是缺**：表里没有这一号 ⇒ 那条
 *   条目**不长出**这两个键（⛔ 不注空串、⛔ 不回落「学生用书」）。⛔ 它们**不进** {@link BOOK_LEVEL_KEYS}
 *   ——它们是并进 `materials[]` 条目的字段，不是第三、第四个书级键。
 * - **不做**：**不产书级判断**（`teachingFocus` / `chapterSuggestion` 只能由主笔产出，机器一个字都不改），
 *   也**不出裁决**（合并件里多出一个「结论／通过」这类键就是机器越权——判据点名它）。
 *
 * ## 过渡口径（票 `knowledge-graph-build/01` 定 · **老书那一档照旧合法**）
 *
 * 合并件**没有**图键（`cards` / `edges`）＝ **老书那一档**：盘上今天绝大多数书都是这一档
 * （分片契约里根本还没写这两个键），它们照旧合法放行——本模块与它的判据**都不因缺图键判红**
 * （不要求分片补图、不要求主笔补书级边）。一旦图键**出现**（分片或书级任一侧给了 `cards` / `edges`），
 * 才走票 [`03`](.scratch/knowledge-graph-build/issues/03-第一张图落地脚本与形状闸.md) 那套形状闸
 * （键必在、卡与边的字段形状、查环之类——⛔ 那一套不住这里，本票只动拼装与它对账的那一把尺子）。
 * ⇒ 别把「老书还没补图」读成「丢了两条边」。
 *
 * ## 病与先例
 *
 * 实测（`.scratch/context-budget/研究-范例章通过后的注入面.md` 附录 B/C）：主笔为了把一片分片
 * 抄成合并件，`write` 入参 24,025 字符（那一段 write 参数合计的 88%），而两份的差异**只有书级
 * 两个字段**。先例是票 `context-budget/12` 落地的 `final-audit-summary.js`：机器拼一份派生件、
 * 同输入同输出、并集不丢不重、零条目那一路有交代、机器不出裁决。本模块是**同一把刀**用到 explore 段。
 *
 * ⚠️ **这一层只断接线与形状（判据声称的强度＝实现强度）**
 *
 * {@link judgeKnowledgeMapAssembly} 断的是「盘上那份合并件是不是那几片分片 ＋ 书级参数 ＋
 * （给了角色表时的）材料判定那张 `num → {role, basis?}` 表的确定函数」：
 * 键集合与分片一致、按分片序号拼（**顺序即契约**，拼接族里书级那份接在**后**）、不丢不重、
 * 逐字搬运族没被改写、没混进机器裁决，**「片」的片级形状（{@link readerSliceProblems}）**，
 * 以及（给了那张表时）`materials[]` 条目上的 `role`（与有的话 `basis`）逐字就是表里那一行。
 * 它**不证**分片内容对不对、**不证**角色判得对不对、**不证**片的语义（同片是否真不混语域、
 * 片名是否真是读者的话——spec §6.3 第 4 条），也**不证**主笔真读了这份合并件——那两层是真机层（ADR-0005）。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）：那两个字段的核对走的是
 * 与数组键**同一段**逐条比对（条目身份＝逐字相同的 JSON），所以「`role` 被改掉」的表现是
 * 「少了一条／多出一条」那种措辞、而不是一句「role 不对」；那是有意的——⛔ 不另写一份「相似的量法」。
 * 另：调用方不传第三个输入（`roles` 省略／`null`）时，这一层**对这两个字段一个字都不说**（老书、老夹具走这一路）。
 * ⚠️ 它的期望值**从本模块的族表与分片导出**（与被判物同源）⇒
 * 「边被整份丢光」那件事另立一条**不同源**的读数 {@link scanKnowledgeMapEdges}（见本文件末）。
 */
import { knowledgeShardRel, normalizeKnowledgePointTitle } from '../domain-rules.js'

/**
 * 书级参数的**两族**——**唯一的说法**：族成员、族内顺序、以及「拼接族里书级那份接在哪一端」，
 * 全仓只写在这一处；拼装器（{@link expectedKnowledgeMap}）与判据（{@link judgeKnowledgeMapAssembly}）
 * 都从这里读，⛔ 别在别处再列一份白名单（本仓反复出的病：两处各写一套说法，改一处漏一处）。
 *
 * - `verbatim`（**逐字搬运族**）：只由主笔产出、机器一个字不改 ⇒ **逐字相等是契约**。
 *   族内顺序也是契约（合并件的键序固定：先分片数组键、再这一族）。今天＝
 *   `teachingFocus` / `chapterSuggestion`；主笔不交这两键就是交工面那条 400
 *   （`src/workflow/actions/chapters.js` 的交工那一跳），**机器不替它编**。
 * - `concat`（**拼接族**）：分片那份**在前**、书级那份**在后**（首尾相接）——
 *   这一端的顺序是**本模块定的**，判据用同一份表算期望 ⇒ 两处不会各说一套。
 *   今天＝ `edges`（段内边 ＋ 跨材料边合成一张边表）；主笔不交这一键是**合法**的
 *   （老书那一档，见文件头「过渡口径」），交了就必须是数组（见 {@link bookLevelProblems}）。
 *   `readerSlices`（**片**，票 `reader-cognition-boundary-build/01`）是第二员：分片侧**今天不产**
 *   （片是书级聚合、只由探查主笔产），所以「分片在前、书级在后」在这里退化成「合并件里就是
 *   主笔交的那一份」；**缺席同样合法**（老书／主笔没产）——「整书一片」的退化是**消费侧现算**的
 *   {@link effectiveReaderSlices}，⛔ 不往合并件里落第二份、也不由机器替主笔编一片。
 *   为什么进拼接族而不是逐字搬运族：逐字搬运族的判据规则是「**必交且非空**」（{@link judgeKnowledgeMapAssembly}
 *   的 ②），那会把「主笔没产」当场变成硬红——与本票要求的「没产 ⇒ 退化整书一片」正面冲突；
 *   拼接族的「缺席合法」才是退化那一半的机器落点。片的形状另由 {@link readerSliceProblems} 咬。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**（票 `dev-gate-scan/17` 的纪律）：这是一张**固定族表**，
 * 它只认得今天登记进来的这几个键。**新**的书级参数（票 `06` 的对齐结论若走书级，就是下一例）
 * 不在表上 ⇒ 走 {@link bookLevelProblems} 那条「族外键」的点名（红是红的、且点名它），
 * 但**它自己发现不了「调用方压根没把某个书级参数交过来」**——那是交工那一跳的接线面
 * （票 `03` 的射程），本表看不见。
 */
export const BOOK_LEVEL_FAMILIES = Object.freeze({
  verbatim: Object.freeze(['teachingFocus', 'chapterSuggestion']),
  concat: Object.freeze(['edges', 'readerSlices']),
})

/** 书级参数的全集（两族按 `verbatim` → `concat` 的顺序拼）——**键序也是契约**（合并件键序固定）。
 *  ⚠️ 这份常量由 {@link BOOK_LEVEL_FAMILIES} 派生，⛔ 不许手写第二份成员表。 */
export const BOOK_LEVEL_KEYS = Object.freeze([
  ...BOOK_LEVEL_FAMILIES.verbatim,
  ...BOOK_LEVEL_FAMILIES.concat,
])

/**
 * 书级参数本身的问题（空数组＝站得住）——**唯一的点名处**：拼装器与判据都调它。
 *
 * 两件事：① **族外键**不再被静默丢弃（今天以前它们一声不响地消失）；② 拼接族的键**必须是数组**
 * （书级 `edges` 写成对象／字符串时，`[...value]` 要么抛、要么把字符串拆成一个个字——两条都不能发生）。
 *
 * 拼装器拿到非空返回值**当场抛**（编程错误当场响，不给静默丢的机会）；判据拿到它**当问题返回**
 * （判据要能返回 problems，不许抛出去）。⛔「进一族」与「当红」二选一，本函数是「红」那一侧的唯一出口。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**（`dev-gate-scan/17`）：我只看**递到我手上的那个对象**
 * （`Object.keys(bookLevel)`）。调用方若把某个书级参数**在更上游就丢掉**（例如交工请求体里
 * `body.edges` 没人读），我这里一个字都看不到——那一层归票 `03` 的接线。
 */
export function bookLevelProblems(bookLevel) {
  if (bookLevel === null || typeof bookLevel !== 'object' || Array.isArray(bookLevel)) return []
  const known = new Set(BOOK_LEVEL_KEYS)
  const problems = []
  for (const key of Object.keys(bookLevel)) {
    if (!known.has(key)) {
      problems.push(`书级参数里的「${key}」不在任何一族里（逐字搬运族：${BOOK_LEVEL_FAMILIES.verbatim.join('／')}；拼接族：${BOOK_LEVEL_FAMILIES.concat.join('／')}）——机器不静默丢书级参数、也不替它编一份：要么把它登记进一族，要么别交过来`)
      continue
    }
    if (BOOK_LEVEL_FAMILIES.concat.includes(key) && !Array.isArray(bookLevel[key])) {
      problems.push(`书级参数里的「${key}」是拼接族的一员，必须是数组（拼接＝首尾相接，非数组接不起来；实为 ${typeof bookLevel[key]}）`)
    }
  }
  return problems
}

/**
 * 「片」（`readerSlices`）的**形状闸**——**唯一出处**（生产交工那一跳与判据都调它；
 * ⛔ 不在别处另写一份「相似的量法」）。空数组＝站得住。
 *
 * 形状（票 `reader-cognition-boundary-build/01` 固化；spec §3.7／§6.2 F）：
 * `readerSlices: [{ name, description?, members: [知识点 title, …] }, …]`。
 * - **片数 ≥1 且片级非空**：每片都有非空 `name`（用读者的话写）＋ 非空 `members`。
 *   ⚠️ 「3–5 片为目标」**不是硬闸**（语域块多于 5 片时片数可以更多）——这里只咬「0 片」与「空片」。
 * - **成员按 `title` 引用**：与剔除记录同一身份（`normalizeKnowledgePointTitle` 那唯一一份归一化），
 *   ⟂ 必须能在知识点图上对上；⛔ `kp.id` 不能当身份（真书 203 条只有 125 个不同 `kp.id`）。
 * - **缺席合法**：`undefined`／`null` 不判红（老书那一档／主笔没产 ⇒ 退化归
 *   {@link effectiveReaderSlices} 现算），这是「拼接族」语义的必然结果。
 *
 * ⛔ **不验**（spec §6.3 第 4 条）：片名／说明是否真是读者的话、同片是否真不混语域、
 * 片分得好不好、有没有覆盖全部知识点。那些全是语义，机器不猜。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**（票 `dev-gate-scan/17` 的纪律）：
 *  · 只认**这一种**形状（对象数组 ＋ 三格）；`members` 里塞对象／id 字符串的写法都落在
 *    「不是字符串」／「对不上」那两格，⛔ 不去猜它想指哪一条。
 *  · 只看**当前这一份**知识点图的 title 集合：同义词、错别字、语序颠倒都算对不上
 *    （语义真假归真机层 ADR-0005；归一化只做去尾部括注／trim／全半角那三件事）。
 *  · 「没被片收进的条目」**合法**（⛔ 不要求全覆盖）——本函数看不见覆盖率，也不该看。
 *
 * @param {unknown} readerSlices 书级参数里的那一份（缺席＝`undefined`）
 * @param {unknown} knowledgePoints 这一份合并件的知识点（用来建 title 集合）
 * @returns {string[]} 逐条点名的问题（空数组＝站得住）
 */
export function readerSliceProblems(readerSlices, knowledgePoints) {
  if (readerSlices === undefined || readerSlices === null) return []
  if (!Array.isArray(readerSlices)) {
    return [`书级参数里的「readerSlices」（片）必须是数组：每一片是 {name, description?, members:[知识点 title]}（实为 ${typeof readerSlices}）`]
  }
  if (readerSlices.length === 0) {
    return ['书级参数里的「readerSlices」（片）是空数组——每本书至少要有一片（片级非空：有名、有成员）；「3–5 片」是目标不是硬闸，但 0 片不是一种合法的「分不出来」（分不出来请看 {@link effectiveReaderSlices} 的退化）']
  }
  const titles = new Set()
  for (const point of Array.isArray(knowledgePoints) ? knowledgePoints : []) {
    const title = normalizeKnowledgePointTitle(point?.title)
    if (title !== '') titles.add(title)
  }
  const titleCount = titles.size
  const problems = []
  readerSlices.forEach((slice, index) => {
    const at = index + 1
    if (slice === null || typeof slice !== 'object' || Array.isArray(slice)) {
      problems.push(`第 ${at} 片不是对象（形状＝{name, description?, members:[知识点 title]}）`)
      return
    }
    const name = typeof slice.name === 'string' ? slice.name.trim() : ''
    const label = name === '' ? `第 ${at} 片` : `第 ${at} 片（「${name}」）`
    if (name === '') problems.push(`第 ${at} 片没有名字（name 必须是一句用读者的话写的非空字符串）`)
    if (!Array.isArray(slice.members) || slice.members.length === 0) {
      problems.push(`${label}没有成员——片级非空要求每一片都点名它收哪些知识点（members:[知识点 title]）`)
      return
    }
    slice.members.forEach((member, memberIndex) => {
      if (typeof member !== 'string' || member.trim() === '') {
        problems.push(`${label}的第 ${memberIndex + 1} 个成员不是字符串——成员按知识点 title 引用（⛔ 不是 kp.id）`)
        return
      }
      const key = normalizeKnowledgePointTitle(member)
      if (key === '' || !titles.has(key)) {
        problems.push(`${label}的成员「${member}」按 title 归一化后对不上知识点图上的任何一条（成员按 title 引用；⛔ kp.id 不能当身份；这份图上有 ${titleCount} 个知识点 title）——把它改成图上那条知识点的 title`)
      }
    })
  })
  return problems
}

/**
 * **消费侧的退化视图**：把合并件里的「片」折成问卷外层要的那一份——**现算**，⛔ 不落盘第二份。
 *
 * 三档（票 `reader-cognition-boundary-build/01` 的退化口径）：
 * 1. 片在场且形状站得住（{@link readerSliceProblems} 零问题）⇒ **原样**交出主笔那一片表
 *    （`degraded:false`、`note:null`；⛔ 机器不改写、不重排）。
 * 2. 片缺席（老书／主笔没产）或形状坏（只可能来自旧件／别人的手改——新书写入面已 400）⇒
 *    退化成「**整本书一片**」＋ 一句**如实说明**（`note`）：成员＝这一份合并件的全部知识点 `title`。
 *    成员一个都没有（零知识点的书）时交 `slices: []` ＋ 如实说明——⛔ 不造一片空壳。
 * 3. ⚠️ **本函数不替调用方决定「摆不摆问卷」**：老书那一档（spec §3.9：判不出来就不摆）由
 *    问卷那一屏／票 `10` 的那条通路判；这里只保证「读到缺席时不会崩、也不会假装有片」。
 *
 * @param {unknown} merged 合并件（`工作区/knowledge-map.json` 的对象或 `null`）
 * @returns {{slices: Array<{name: string, description?: string, members: string[]}>, degraded: boolean, note: string|null}}
 */
export function effectiveReaderSlices(merged) {
  const map = merged !== null && typeof merged === 'object' && !Array.isArray(merged) ? merged : {}
  const knowledgePoints = Array.isArray(map.knowledgePoints) ? map.knowledgePoints : []
  const problems = readerSliceProblems(map.readerSlices, knowledgePoints)
  // 「产了且站得住」＝数组在、非空、零问题（缺席时 problems 也是空数组，⛔ 别把它读成「交了好的」）。
  if (Array.isArray(map.readerSlices) && map.readerSlices.length > 0 && problems.length === 0) {
    return { slices: map.readerSlices, degraded: false, note: null }
  }
  const members = []
  for (const point of knowledgePoints) {
    const title = typeof point?.title === 'string' ? point.title.trim() : ''
    if (title !== '') members.push(title)
  }
  if (members.length === 0) {
    return { slices: [], degraded: true, note: '这本书还没有知识点——没有可作答的「片」（不造一片空壳）。' }
  }
  const absent = map.readerSlices === undefined || map.readerSlices === null
  const note = absent
    ? '主笔这次没有交「片」（readerSlices）——按「整本书一片」处理。'
    : `主笔交的「片」（readerSlices）形状站不住（${problems[0]}）——按「整本书一片」处理。`
  return {
    slices: [{ name: '整本书', description: '这本书的知识点还没有按你的情况分成片，整本算作一片。', members }],
    degraded: true,
    note,
  }
}

/**
 * 分片契约里**每片都带的数组键**（形状的权威源＝精读派发模板
 * `resources/references/subagent-prompts/close-reading-prompt.md` 的「产出契约二」＋ explore 交办）。
 * ⚠️ 这里再列一遍是**为了零片那一路**：零片时没有任何一片可作依据，合并件仍要交出这几个空数组
 * （把键悄悄省掉等于下游读到的形状变了——那是另一件事，不是「没有内容」）。
 *
 * ⚠️ **三者的「必有」强度不一样**（照实写，别把三个键读成同一档）：
 * - `materials` / `knowledgePoints`：**每片都必须有**（{@link shardShapeProblems} 逐片点名缺 `knowledgePoints`）。
 * - `teachingMethods`（**教法**，「某个知识点怎么讲」那一层）：**缺席或空数组都合法**——学生用书里
 *   可能一条教法都没有，机器⛔ 不因缺它拒交（票 `pre-gold-build/04`；口径住 `CONTEXT.md` 的「教法」词条）。
 *   它进这份常量只为**零片那一路的形状稳定**，不是「每片必须有」。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**（票 `dev-gate-scan/17` 的纪律）:这份常量只列**今天契约里的三个键**。
 * 一片若带了契约没写的**别的数组键**，它照样会被 {@link expectedKnowledgeMap} 从分片里拼进合并件
 * （那里是按分片实际键走的，不受这份常量限制）——所以「窄」的影响面只有**零片**这一档：
 * 零片时合并件只交这三个键，多出来的键只能来自下游读法变更，不来自这里。
 * ⚠️ 另一处更容易读错的窄：**机器对 `teachingMethods` 只拼不校验**（不验条数、不验内容、
 * 不看它有没有对应到某个知识点）——「今天零消费者」是**读数**，不是一句待补的债。
 */
export const SHARD_ARRAY_KEYS = Object.freeze(['materials', 'knowledgePoints', 'teachingMethods'])

/** 分片自己的身份键：不进合并件（它是「这份是第几路」的登记，不是内容）。 */
const SHARD_ID_KEY = 'num'

/** 合并件里**不许**出现的键名——JSON 里的「机器裁决」就是这类多出来的键。
 *
 *  ⚠️ **我的枚举面比现实窄在哪里**（票 `dev-gate-scan/17` 的纪律）:这是一张**固定词表**，
 *  只认得这几种写法。换一个说法的裁决键（如 `result_code`、`machineVerdict`）仍会被判红，
 *  只是文案落在那条更宽的「拼装件只许有分片数组键与书级族里的键」上、不带「机器裁决」四个字
 *  ——**红是红的**，认不认得出来靠人看那句话。词表不追现实，是因为「哪些键算裁决」本身是判断题。 */
const VERDICT_KEY_RE = /^(?:结论|判定|裁决|检查结果|passed|verdict|result|ok)$/u

// ── 形状（交工验货与判据共用这一段：两处不会各写一套说法）──────────────────────

/**
 * 分片的形状问题（空数组＝能拼）。逐条点名**是第几路**（拼不出来时主笔要知道去补哪一片）。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**（票 `dev-gate-scan/17` 的纪律）:这里只点名两件——「整个分片不是
 * 对象」与「某个键不是数组」（后者是通用规则，`teachingMethods` 写成对象／字符串由它兜住，
 * 但**不认它是不是契约里那几个键**），外加「缺 `knowledgePoints` 数组」这一条**必交**。
 * ⇒ 缺 `teachingMethods`、`teachingMethods: []`、`teachingMethods` 里条目形状不对（如少了 `title`），
 * 这里**全部判绿**——教法今天零消费者，机器只拼不校验（口径见 {@link SHARD_ARRAY_KEYS} 那条注）。
 *
 * @param {ReadonlyArray<{n: number, map: unknown}>} shards
 * @returns {string[]}
 */
export function shardShapeProblems(shards) {
  const problems = []
  for (const shard of Array.isArray(shards) ? shards : []) {
    const n = shard?.n
    const map = shard?.map
    const where = Number.isSafeInteger(n) ? knowledgeShardRel(n) : '（序号不明的那一片）'
    if (map === null || typeof map !== 'object' || Array.isArray(map)) {
      problems.push(`第 ${n} 路的分片不是 JSON 对象：${where} —— 机器按键拼装需要它是一个对象`)
      continue
    }
    for (const [key, value] of Object.entries(map)) {
      if (key === SHARD_ID_KEY || Array.isArray(value)) continue
      problems.push(`第 ${n} 路的分片里「${key}」不是数组：${where} —— 按键拼接只能拼数组（这一片的形状与精读契约不一致）`)
    }
    if (!Array.isArray(map.knowledgePoints)) {
      problems.push(`第 ${n} 路的分片没有 knowledgePoints 数组：${where} —— 每片都要带这一份的知识点`)
    }
  }
  return problems
}

// ── 拼装（纯函数：分片 ＋ 书级参数 → 一份，逐字确定）──────────────────────────

/**
/**
 * **一片的某一键在合并件里应该是哪一块**（拼装与判据**共用这一段**——⛔ 不另写一份「相似的量法」）。
 *
 * `materials` 那一键另有一条：这一片对应的**分片号**在 `roles` 表里有那一行时，逐条给条目挂上
 * 表里那两个字段（`role`，以及有的话 `basis`；已有同名键则**以表为准**——判定产物是这两个事实的
 * 唯一住处；键的位置不变）。
 * ⚠️ 按**分片号**取而不是按条目自己写的 `materials[].num`：判定产物的 `num` 对齐的是
 * `okMaterialShards` 的序号，而分片 `工作区/knowledge-map-NN.json` 就是那一号（分片内的条目按
 * 契约同号）；同一条目若自报了一个别的号，那是分片自己的形状问题，不在这里变成「两个口径」。
 * **缺就是缺**：表里没有这一号 ⇒ 条目原样过去，**不长出** `role` 键。
 *
 * @param {string} key 分片里的数组键名
 * @param {{n?: number, map?: unknown}} shard
 * @param {Map<number, {role: string, basis?: string}>|null} roles
 * @returns {unknown[]}
 */
function expectedBlockFor(key, shard, roles) {
  const value = Array.isArray(shard?.map?.[key]) ? shard.map[key] : []
  const cell = key === 'materials' && roles instanceof Map ? roles.get(shard?.n) : undefined
  if (cell === undefined) return value
  return value.map((entry) => (entry !== null && typeof entry === 'object' && !Array.isArray(entry) ? { ...entry, ...cell } : entry))
}

/**
 * 各分片 ＋ 书级参数 ＋（可选）材料判定的 `num → {role, basis?}` 表 → 「应该是那样」的**结构**
 * （拼装与判据共用它，于是判据不是另写一份量法）。
 *
 * 拼接规则（口径只此一份）：
 * - **分片数组键**：按 `shards` 给的顺序（＝ `okMaterialShards` 的序号顺序）逐片取**数组键**，
 *   同名键首尾相接；键序＝该键在分片里**首次出现**的顺序。`num` 不进合并件。
 * - **书级参数**：按 {@link BOOK_LEVEL_FAMILIES} 两族走——`verbatim` 族**逐字搬运**（赋值，
 *   机器一个字不改）；`concat` 族**接在分片那份后面**（分片在前、书级在后，顺序是契约）。
 *   ⛔ 不在任何一族里的书级参数**不许静默丢**：{@link bookLevelProblems} 逐键点名，
 *   拼装器当场抛、判据当问题返回（两面都走同一份点名）。
 * - **材料判定那张表**（第三个输入 `roles`）：只并进 `materials[]` 条目（见 {@link expectedBlockFor}），
 *   ⛔ 不进 {@link BOOK_LEVEL_KEYS}——它是条目上的字段，不是第三、第四个书级键。
 *   ⚠️ `role` 的唯一住处是书级的判定产物 `工作区/材料判定.json`（`domain-rules.materialRoleTable()`
 *   把它收成 `num → {role, basis?}`），机器按**分片号**并进 `materials[]` 条目。**缺就是缺**：表里
 *   没有这一号 ⇒ 那条条目**不长出**这两个键（⛔ 不注空串、⛔ 不回落「学生用书」）。
 *
 * ⚠️ 分片全都没带 `teachingMethods` 时，这里交出的仍是**空数组**（键在、内容空）——与
 * `materials` / `knowledgePoints` 同一条形状稳定口径；「教法一条都没有」是合法内容，不是缺件。
 *
 * ⚠️ 书级参数里有**族外键**（或拼接族给了非数组）时**当场抛**——那两个形状没有「合理输出」可言，
 * 静默丢正是本票要治的病（判据侧由 {@link judgeKnowledgeMapAssembly} 先收成 problems，不抛）。
 *
 * @param {ReadonlyArray<{n: number, map: unknown}>} shards
 * @param {{teachingFocus?: unknown, chapterSuggestion?: unknown, edges?: unknown, readerSlices?: unknown}} bookLevel 主笔交来的书级参数
 * @param {Map<number, {role: string, basis?: string}>|null} [roles] 材料判定给的 `num → {role, basis?}` 表；省略／`null`＝不并角色
 * @returns {Record<string, unknown>}
 */
export function expectedKnowledgeMap(shards, bookLevel, roles = null) {
  const bookProblems = bookLevelProblems(bookLevel)
  if (bookProblems.length > 0) throw new Error(`书级参数拼不进合并件：${bookProblems.join('；')}`)
  const out = {}
  for (const key of SHARD_ARRAY_KEYS) out[key] = [] // 零片那一路也要交出这几个键（见上面那条注记）
  for (const shard of Array.isArray(shards) ? shards : []) {
    const map = shard?.map
    if (map === null || typeof map !== 'object' || Array.isArray(map)) continue
    for (const [key, value] of Object.entries(map)) {
      if (key === SHARD_ID_KEY || !Array.isArray(value)) continue
      const block = expectedBlockFor(key, shard, roles)
      out[key] = Object.hasOwn(out, key) ? [...out[key], ...block] : [...block]
    }
  }
  // 逐字搬运族：赋值（机器不许改写主笔的判断——它们不是「拼接出来的」）。
  for (const key of BOOK_LEVEL_FAMILIES.verbatim) {
    const value = bookLevel === null || typeof bookLevel !== 'object' ? undefined : bookLevel[key]
    // ⚠️ 主笔没交这一键时**不替它编**（交工验货当场 400）；机器只做搬运。
    if (value !== undefined) out[key] = value
  }
  // 拼接族：**分片那份在前、书级那份在后**（顺序是契约：同一份输入必须重跑出逐字同一份输出）。
  for (const key of BOOK_LEVEL_FAMILIES.concat) {
    const value = bookLevel === null || typeof bookLevel !== 'object' ? undefined : bookLevel[key]
    if (value === undefined) continue // 老书那一档：书级没有图键，合并件就不长这个键（合法）
    out[key] = Object.hasOwn(out, key) ? [...out[key], ...value] : [...value]
  }
  return out
}

/** 由结构渲染成全文（**生产落盘与判据核对走同一个渲染器**：缩进与键序都不会两处各写一份）。 */
export function renderKnowledgeMap(map) {
  return JSON.stringify(map, null, 2)
}

/**
 * 分片 ＋ 书级键 ＋（可选）角色表 → 合并件全文。**同输入同输出**（这是本票判据里那句「重拼逐字相同」的被测面）。
 *
 * @param {ReadonlyArray<{n: number, map: unknown}>} shards
 * @param {{teachingFocus?: unknown, chapterSuggestion?: unknown, edges?: unknown, readerSlices?: unknown}} bookLevel
 * @param {Map<number, {role: string, basis?: string}>|null} [roles] 材料判定给的 `num → role` 表（见 {@link expectedKnowledgeMap}）
 * @returns {string}
 */
export function assembleKnowledgeMap(shards, bookLevel, roles = null) {
  return renderKnowledgeMap(expectedKnowledgeMap(shards, bookLevel, roles))
}

// ── 判据（那把尺子；坏形状喂进**同一段**它，不另写一份「相似的量法」）──────────────

/** 一条条目的**可读点名**（id / title 优先，都好让「哪一条」说得出来）。 */
function entryText(value) {
  if (value !== null && typeof value === 'object') {
    const label = value.id ?? value.title ?? value.text
    if (typeof label === 'string' && label.trim() !== '') return label.trim()
    return JSON.stringify(value).slice(0, 60)
  }
  return String(value)
}

/** 条目身份＝逐字相同的 JSON（「同一条」按内容判，不猜语义——猜错就是静默丢条目）。 */
const entryKey = (value) => JSON.stringify(value)

const countOf = (list, entry) => list.filter((value) => entryKey(value) === entryKey(entry)).length

/**
 * 某一个数组键的**顺序与不丢不重**（**逐块**比）：少一条／多印／多出来／顺序被换，各自点名。
 *
 * 块（`blocks`）＝一条来源，**块序就是拼装序**：每个分片一块（标签「第 N 路分片」）；
 * **拼接族**的键再在**末尾**加一块「书级」（分片在前、书级在后，见 {@link BOOK_LEVEL_FAMILIES}）。
 * ⚠️ 这样两端都在同一段对账里：书级那份丢了、重复了、被印到前面去，各自点名（不是只比分片那半）。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**（票 `dev-gate-scan/17` 的纪律）：**逐字**比 `JSON.stringify`
 * 相同的条目——同一条边换个键序（`{from,to}` / `{to,from}`）在我眼里就是两条，则「丢了一条」
 * 会误报、而「同一条印两遍」会漏报。⛔ 这是有意的：机器不猜语义（那条边到底是不是同一条，
 * 归真机层与票 `03`/`11` 的逐边口径）；本条只保「**拼装**没丢没重没换序」。
 *
 * ⚠️ 逐片的期望块走 {@link expectedBlockFor}（**与拼装同一段**）：`materials` 挂角色的那一条
 * 因此在这一格里也生效——给角色表时，条目身份是「带 `role` 的那一份 JSON」。
 *
 * @param {string} key
 * @param {unknown[]} got 合并件里那一键
 * @param {string} key
 * @param {unknown[]} got 合并件里那一键
 * @param {ReadonlyArray<{label: string, entries: unknown[]}>} blocks 各来源块（块序＝拼装序）
 * @returns {string[]}
 */
function judgeKeySequence(key, got, blocks) {
  const problems = []
  const expected = blocks.flatMap(({ entries }) => entries)
  // ⓐ 少了一条：某一块的某条在合并件里一条都没有（点名哪一块 ＋ 那一条）。
  for (const { label, entries } of blocks) {
    for (const entry of entries) {
      if (countOf(got, entry) === 0) {
        problems.push(`${label}的「${entryText(entry)}」没出现在合并件的 ${key} 里（少了一条）`)
      }
    }
  }
  // ⓑ 不重：某条出现了比它该有的次数更多（同一块被印了两遍）。
  for (const { label, entries } of blocks) {
    for (const entry of entries) {
      const times = countOf(got, entry)
      const should = countOf(expected, entry)
      if (times > should) {
        problems.push(`${label}的「${entryText(entry)}」在合并件的 ${key} 里出现了 ${times} 次（应为 ${should} 次——重复印了同一条）`)
      }
    }
  }
  // ⓒ 多出一条：合并件里有、**任何一块**都没有（机器自己编的内容）。
  for (const entry of got) {
    if (countOf(expected, entry) === 0) {
      problems.push(`合并件的 ${key} 里多出一条「${entryText(entry)}」——各块里都没有这一条（机器不许自己编内容）`)
    }
  }
  // ⓓ 顺序：条数与内容都对得上、但位置不对 ⇒ 拼装顺序是契约，不是随缘。
  const sameMultiset = got.length === expected.length
    && expected.every((entry) => countOf(got, entry) === countOf(expected, entry))
  if (sameMultiset && got.length > 0) {
    const at = got.findIndex((entry, i) => entryKey(entry) !== entryKey(expected[i]))
    if (at >= 0) {
      problems.push(`合并件的 ${key} 顺序与拼装顺序不一致（第 ${at + 1} 条应是「${entryText(expected[at])}」，实为「${entryText(got[at])}」）——拼装顺序是契约（分片序号在前、拼接族的书级那份在后）`)
    }
  }
  return problems
}

/**
 * 判一份合并件是不是**那几片分片 ＋ 书级参数 ＋（给了角色表时的）`num → {role, basis?}` 的确定函数**。
 * 返回问题清单，空数组＝站得住。
 *
 * ⚠️ **扫面非空下限**（防空跑）：零片时「键集合与分片一致」这句话恒真，所以这里先断
 * 「至少有一片」与「主笔真交了逐字搬运族那两键」，各自点名；反证正是把这两个形状喂回**这一段**。
 *
 * ⚠️ **本判据的强度＝它实现的强度**（`docs/测试信任边界.md` 总纲）：它断的是**拼装接线与形状**
 * （键集合、拼装序、不丢不重、书级没被改写、没混进机器裁决），**不证**分片内容对不对、
 * 不证主笔真读了这份合并件（真机层 ADR-0005）。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**（票 `dev-gate-scan/17` 的纪律）：
 *  · 期望值**从这个模块自己的族表与分片导出**（{@link expectedKnowledgeMap}）⇒ 它对
 *    「**调用方压根没把某个书级参数交给机器**」是**恒绿**的（我看到的只有递到手的东西）。
 *    正是这个病（期望值与被判物同源）让本判据不能当「边有没有被丢光」的独立对账 ⇒
 *    那一条另立 {@link scanKnowledgeMapEdges}（期望值取自盘上分片自己的声明，与拼装器无关）。
 *  · 逐条对账只认**逐字相同**的条目（见 {@link judgeKeySequence} 的窄处）。
 *  · 键集合那一组只看得见**合并件里多出来的键**；「该有的键没被交过来」得靠族表与分片两头在场
 *    （族外键由 {@link bookLevelProblems} 点名；分片侧没产图键＝老书那一档，见文件头「过渡口径」，
 *    **不判红**）。
 *  · 「片」的片级形状用的是**从分片拼出来的** `knowledgePoints`（`want.knowledgePoints`）：生产交工
 *    那一跳用的是**对齐合并之后**那份 ⇒ 成员若指着一条被对齐合并掉的知识点，判据这里可能绿、
 *    生产那边红（方向是失败关闭：交工闸更严）。
 *
 * ⚠️ 第三个输入与 {@link expectedKnowledgeMap} **同一份**：给了它，`materials[]` 条目上的 `role`
 * 就按它逐字核对（改掉／漏掉都会红——只是措辞落在数组键那一段的「少了一条／多出一条」上）。
 * 省略／`null` ＝ 对 `role` 一个字都不说（老书、老夹具走这一路）。
 *
 * @param {string} text 盘上那份 `工作区/knowledge-map.json` 的全文
 * @param {ReadonlyArray<{n: number, map: unknown}>} shards 盘上那几片（按分片序号）
 * @param {{teachingFocus?: unknown, chapterSuggestion?: unknown, edges?: unknown, readerSlices?: unknown}} bookLevel 主笔交来的书级参数
 * @param {Map<number, {role: string, basis?: string}>|null} [roles] 材料判定给的 `num → {role, basis?}` 表
 * @returns {string[]} 逐条点名的问题
 */
export function judgeKnowledgeMapAssembly(text, shards, bookLevel, roles = null) {
  const problems = []
  const list = Array.isArray(shards) ? shards : []

  // ⓪ 书级参数本身先要站得住：族外键不被静默丢、拼接族必须是数组（唯一出处 `bookLevelProblems`）。
  //    放在最前是因为 {@link expectedKnowledgeMap} 遇到这两个形状**当场抛**——判据要先把它收成
  //    problems 再早退，⛔ 不能让自己抛出去。
  problems.push(...bookLevelProblems(bookLevel))
  // ① 扫面非空：一片都没有时，后面的「键集合与分片一致」全是恒真的空转。
  if (list.length === 0) {
    problems.push('输入的分片只有 0 片（防空跑：一片都没有时「合并件＝各分片的确定函数」这句话恒真）')
  }
  // ② 逐字搬运族必须**由主笔交来**（机器不产书级判断，缺了也不许由机器补）。
  //    ⚠️ 只管 `verbatim` 那一族：拼接族（`edges`／`readerSlices`）**缺席合法**（老书那一档没有
  //    图键／片；片的缺席由消费侧 `effectiveReaderSlices` 退化成整书一片）。
  for (const key of BOOK_LEVEL_FAMILIES.verbatim) {
    const submitted = bookLevel === null || typeof bookLevel !== 'object' ? undefined : bookLevel[key]
    if (!Array.isArray(submitted) || submitted.length === 0) {
      problems.push(`主笔没交「${key}」（书级聚合只能由主笔产出——机器不会替它编一份）`)
    }
  }
  if (problems.length > 0) return problems
  const shapes = shardShapeProblems(list)
  if (shapes.length > 0) return shapes

  // ③ 合并件是机器产物：它的形状就是它的契约（不是严格 JSON 对象就什么都无从谈起）。
  let got = null
  try {
    got = JSON.parse(String(text ?? ''))
  } catch (error) {
    return [`盘上那份合并件不是严格 JSON：${error.message}`]
  }
  if (got === null || typeof got !== 'object' || Array.isArray(got)) {
    return ['盘上那份合并件不是一个 JSON 对象']
  }

  const want = expectedKnowledgeMap(list, bookLevel, roles)
  // ⑤′ 「片」的**片级形状**（票 `rcb-build/01`）：与生产交工那一跳**同一段**（`readerSliceProblems`），
  //     ⛔ 不另写「相似的量法」。只在**有交**时咬（拼接族缺席合法＝老书那一档／退化归消费侧）；
  //     非数组已在 ⓪ `bookLevelProblems` 点名并早退，这里不会重复报。
  if (Array.isArray(bookLevel?.readerSlices)) {
    problems.push(...readerSliceProblems(bookLevel.readerSlices, want.knowledgePoints))
  }
  const wantKeys = Object.keys(want)

  // ④ 键集合：分片数组键的并 ＋ 书级参数的键，多一个少一个都点名。
  //    「多出来的那个键」若是结论／通过那一类，就是**机器裁决**——那正是本族要挡的那一件。
  for (const key of Object.keys(got)) {
    if (wantKeys.includes(key)) continue
    problems.push(VERDICT_KEY_RE.test(key)
      ? `合并件多出一个键「${key}」——机器裁决：裁决归主笔 AI，合并件只许有分片里的数组键与书级参数`
      : `合并件多出一个键「${key}」——拼装件只许有分片里的数组键与书级参数`)
  }
  for (const key of wantKeys) {
    if (!Object.hasOwn(got, key)) problems.push(`合并件少了键「${key}」——分片或主笔交来的那一份里有、拼装件里没有`)
  }

  // ⑤ 逐键对账：**分片的数组键**按分片序号逐片比（顺序是契约）；**逐字搬运族**逐字相等
  //    （机器不许改写主笔的判断——它们不是「拼接出来的」，所以不走顺序那条路）；
  //    **拼接族**两端都要对得上：各分片那一块 ＋ 书级那一块（在**后**）。
  for (const key of wantKeys) {
    if (!Object.hasOwn(got, key)) continue
    if (BOOK_LEVEL_FAMILIES.verbatim.includes(key)) {
      if (entryKey(got[key]) !== entryKey(want[key])) {
        problems.push(`合并件的「${key}」与主笔交来的那一份不一致——书级聚合只由主笔产出，机器不许改写（实为「${entryText(got[key])}」）`)
      }
      continue
    }
    // ⚠️ 逐片那一块走 {@link expectedBlockFor}（**与拼装同一段**）：`materials` 挂角色的那一条
    // 因此在这一格里也生效——给角色表时，条目身份是「带 `role`／`basis` 的那一份 JSON」。
    const blocks = list.map((shard) => ({
      label: `第 ${shard?.n} 路分片`,
      entries: expectedBlockFor(key, shard, roles),
    }))
    // 只有**拼接族**的键才有「书级那一块」（⛔ 别让 `cards` / `materials` 这类分片键凭空多一块）。
    if (BOOK_LEVEL_FAMILIES.concat.includes(key)) {
      const tail = bookLevel === null || typeof bookLevel !== 'object' ? undefined : bookLevel[key]
      if (Array.isArray(tail)) blocks.push({ label: '书级', entries: tail })
    }
    problems.push(...judgeKeySequence(key, Array.isArray(got[key]) ? got[key] : [], blocks))
  }
  return problems
}

// ── 独立读数：边表有没有被**整份丢光**（期望值不取自拼装器）─────────────────────────

/**
 * **独立读数**：合并件的边表有没有被整份丢光——票 `knowledge-graph-build/01` 完成判据第 3 条，
 * 也是 spec §5 守卫 (b)（防静默丢）的落地。
 *
 * **为什么另立一条**（病名：期望值与被判物同源 ⇒ 恒绿；票 `knowledge-graph-step/05` §4(b) 与
 * `dev-gate-scan/17`）：{@link judgeKnowledgeMapAssembly} 的期望值是从**同一份分片**经
 * {@link expectedKnowledgeMap} 导出的——拼装器把整张边表丢了时，它算出来的期望也一起丢，
 * 对账照样绿。这里**不碰拼装器**：期望值＝**盘上那几片自己的声明**（哪几片带了 `edges`、合计几条），
 * 现实＝合并件里 `edges` 的实际条数。两把尺子互不相干。
 *
 * **只有一条红**：分片侧声明过边（合计 > 0）而合并件里**一条边都没有**。其余一律只出读数：
 * `mergedEdges` ＝ **本次扫面几条边**（票 `03` 完成判据第 5 条要的那条非阻断读数；
 * `0` ＝ 数得出、就是零条；`null` ＝ 合并件里根本没有 `edges` 数组／全文解析不了，与 `0` 是两件事）。
 *
 * **过渡口径**（票 01 定，见文件头）：合并件没有图键＝老书那一档 ⇒ 这里**不判红**
 * （`declaredEdges === 0` 时无论合并件有没有边表都是零问题），⛔ 别把老书还没补图读成丢边。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**（`dev-gate-scan/17` 的纪律；spec §5 末尾那段口径逐条照抄）：
 *  · **只抓「全丢」、抓不住「丢一半」**——这是有意的（spec §5 明写）：丢了一半时本条是绿的，
 *    那形状归 {@link judgeKnowledgeMapAssembly} 的逐条对账咬。
 *  · 只看**分片里 `edges` 是非空数组**的那几片：一片把边写在别的键名下、或分片压根没落盘，
 *    都不在我的扫面里（前者是形状病，归票 `03` 的形状闸；后者是「片齐不齐」，归交工验货）。
 *  · 「声明过」＝非空数组：带 `edges: []` 的片**不算声明**——否则「没声明」与「没产出」会被
 *    读成「丢了」，那是冤判。
 *  · 我数的是**条数**，不看内容：边被换成了别的边，只要条数不为零我就绿——
 *    「换成了什么」也归上面那条逐条对账。
 *  · 本读数**不接线、不进闸门**（接线进交工那一跳归票 `03`）；本票只保证它算得出来、有单测。
 *
 * @param {ReadonlyArray<{n: number, map: unknown}>} shards 盘上那几片（按分片序号）
 * @param {unknown} merged 合并件（`JSON.stringify` 出来的全文，或已解析的对象）
 * @returns {{declaredShards: number[], declaredEdges: number, mergedEdges: number|null, problems: string[]}}
 */
export function scanKnowledgeMapEdges(shards, merged) {
  const list = Array.isArray(shards) ? shards : []
  const declaring = []
  for (const shard of list) {
    const entries = Array.isArray(shard?.map?.edges) ? shard.map.edges : []
    if (entries.length === 0) continue
    declaring.push({ n: shard?.n, count: entries.length })
  }
  const declaredEdges = declaring.reduce((sum, { count }) => sum + count, 0)
  const declaredShards = declaring.map(({ n }) => n)

  let map = merged
  if (typeof map === 'string') {
    try {
      map = JSON.parse(map)
    } catch {
      map = null // 读不出＝与「键不在」同一格（本读数的红只有下面那一条，⛔ 不在坏件上另生红）
    }
  }
  const mergedEdges = map !== null && typeof map === 'object' && Array.isArray(map.edges) ? map.edges.length : null

  const problems = []
  if (declaredEdges > 0 && mergedEdges !== null && mergedEdges === 0) {
    problems.push(`分片侧声明过 ${declaredEdges} 条边（${declaring.map(({ n, count }) => `第 ${n} 路 ${count} 条`).join('、')}），合并件里却一条边都没有——边表被整份丢光了`)
  }
  if (declaredEdges > 0 && mergedEdges === null) {
    problems.push(`分片侧声明过 ${declaredEdges} 条边（${declaring.map(({ n, count }) => `第 ${n} 路 ${count} 条`).join('、')}），合并件里连 edges 数组都没有——边表整份不在`)
  }
  return { declaredShards, declaredEdges, mergedEdges, problems }
}
