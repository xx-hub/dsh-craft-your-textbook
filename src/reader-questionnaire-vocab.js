/**
 * 读者情况问卷那一套**态词与归一化**（票 `reader-cognition-boundary-build/03` 的形状面；
 * 票 `09` 起它同时是**缺口那一栏**读回卷件时的解析口径）——**唯一出处**。
 *
 * ## ⚠️ 它为什么住 `src/` 根级（票 `ui-workflow-seam/01` 搬的家）
 *
 * 本模块原先住 `src/workflow/reader-questionnaire-vocab.js`。**三个导出逐字没改**，只是搬到了
 * 根级：它的消费者横跨两侧——服务端（`src/workflow/reader-questionnaire.js`，经原路径那一条
 * **再导出**照旧拿得到，一行 import 不用改）与**浏览器 bundle**（`src/ui/reader-gap.js`）。
 * 住在 `workflow/` 下面时，界面读它是「知道工序层的内部文件布局」，那是 `AGENTS.md` 的
 * 「Frontend layout」要挡的形状（票 `ui-workflow-seam/04` 改路）。
 * ⇒ **语义归属**（两套态词与那把尺子）本来就是问卷的、不属于 `workflow/` 这个目录的布局，
 * 搬出来只是让界面不必知道那个路径。⚠️ 本文件**零 import**（含 `export … from`）是**判据**，
 * 由 `test-reader-gap.mjs` 钉着。
 *
 * ## 它是什么，不是什么
 *
 * **是**三样只在**一处**定义的东西：片级三态（`READER_SLICE_STATES`）、逐条两态
 * （`READER_ITEM_STATES`）、成员身份那一把尺子（`normalizeTitle`）。
 * **不是**：不是第二份事实源（⛔ 不读盘、⛔ 不落件、⛔ 不带状态位）、⛔ 不是判据、
 * ⛔ 不驱动任何放行。
 *
 * ## ⚠️ 为什么它单独住一个文件（⛔ 别把它们搬回 `reader-questionnaire.js`）
 *
 * **本文件必须无 Node 依赖**（⛔ 不 `import 'node:fs'`／`'node:path'`／`engine/paths.js`）：
 * 界面那一侧（`src/ui/reader-gap.js`）也要读这两套态词与 `normalizeTitle`，而 `src/ui/`
 * 进的是**浏览器 bundle**（`build.mjs`：`platform: 'browser'`）。`reader-questionnaire.js`
 * 是要读盘的（`node:fs` ＋ `engine/paths.js` 的 `node:os`）⇒ 从它那一边 import，
 * client bundle 当场解不出 `node:*`（收口修正时实测：`npm run bundle` 五处
 * "Could not resolve"，`engine/paths.js` 与 `reader-questionnaire.js` 各中几处）。
 * ⇒ 定义住这里，`workflow/reader-questionnaire-vocab.js` **原样再导出**（既有消费者一个都不用改）。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）
 *
 * · 片级三态只认这**一个**写法（票 `18` 契约 9）；逐条那层只有两态（票 `15` 第 1 条）。
 * · `normalizeTitle` 只做 `trim()`：它认不出「同一个知识点的两种写法」（全半角、别名、
 *   带序号前缀）——那是「成员身份＝`title`」这条口径的窄处（⛔ `kp.id` 不能当身份）。
 */

/**
 * **片级三态**（逐字，票 `18` 契约 9）：第三档（`这片不是问我的`）与逐条那层的「不确定」
 * **屏上必须分得开**（`ADR-0041` 决策 3）⇒ 片级第二档取「**说不准**」这个写法
 * （盘上两种写法一律按它读），于是「不确定」三个字在卷上只属于逐条那一层。
 */
export const READER_SLICE_STATES = Object.freeze(['这片我基本都会', '说不准', '这片不是问我的'])

/** **逐条那层只有两态**（第三态只在片级，票 `15` 第 1 条）：已会／不确定。 */
export const READER_ITEM_STATES = Object.freeze(['已经会', '不确定'])

/** 归一化一个 title（成员身份＝`title`；⛔ `kp.id` 不能当身份）。 */
export function normalizeTitle(value) {
	return typeof value === 'string' ? value.trim() : ''
}
