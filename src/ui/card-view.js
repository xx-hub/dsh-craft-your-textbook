/**
 * 造书工作台 · 卡片 props 契约（票 `workbench-card-contract` 02）
 *
 * 这个 module 回答一句话：**「这张卡吃什么？」**——答案写在**卡自己的域文件**里（locality），
 * 壳只负责把「当前这本书」递过来。`src/client-entry.js` 里 12 个 `createElement(主卡, {…})`
 * 的 props 袋从此不再由壳逐项手抄。
 *
 * 三个外部 interface：
 *   createCardView(book, slots) -> View     壳登记一张 slot 表，取哪张取哪张（懒 + 记忆）
 *   defineCardView(spec)          -> build  声明一张卡的契约，**声明在卡自己的文件里**
 *   CardViewError                 ->         装配错了当场响（不伪装成一次用户可见的降级）
 *
 * ⚠️ **它为什么必须中性**：零 import——不引 react（不碰渲染）、不引 `view-rules`／`domain-rules`
 * （不认识界面词）、不认识任何一张卡。理由是它站在**每一张卡**的 props 缝上，一旦它认出某张卡，
 * 加卡就得改它，locality 当场退化回中央文件。形态对标 `stage-step-model.js`（同样是零依赖
 * 的只读模型 module）。
 *
 * 它治的病（票 01 查出来的）：卡片在给自己防「壳忘了传」——**6 处静默守卫**（其中 1 处经查证
 * 不是病，是正常状态机分支，结构上不是 prop，本 module 碰不到它）。5 处守卫在生产里**不可达**，
 * 真正的用途是让组件测试能省略 props 才长出来的（`dead-gates` 不变量 7 禁的形状）。
 * 收编之后，契约在**装配期**校验：漏传当场抛并点名是哪张卡、缺哪个字段，不等到用户点那颗键。
 *
 * ⚠️ **白屏级崩是已裁决的代价**（票面 `## Comments`，2026-10）：与
 * `src/workflow/registration.js:8-9` 同一条道理——「装配错了就在这里响着抛，而不是等到某个
 * 动作在生产里回一个 400」。静默降级在这个仓里有前科（`.scratch/dsh-contract-drift/` 两次
 * 界面零变化、某条通路悄悄死掉）。**但只对「装配期」生效**：卡片体内**运行时**的静默降级
 * （`confirm-cards.js` 读不到报告就不显示、`chapters-map.js` 读不到正文就显示错误条）**一个字
 * 不许动**——那是两条正当的、逐字不同的错误策略，不归这里统一。
 *
 * 继承的不变量（只编码、不重决）：
 *   · 缺省三规则：`undefined` 才走缺省；**`null` 是显式的「没有」，永不被缺省覆盖**（票 28：
 *     上下文占用读不到就绝不显示 0%）；空引用是**模块级同一引用**。
 *   · 袋是**扁平**的——卡片体内 `const { … } = props` 一行不改（`test-component-cards.mjs`
 *     70 例 / `test-phase-page.mjs` 32 例照旧跑）。
 *   · 袋**浅**冻结（深冻结会伤到宿主给的活 `meta`）。
 *   · 界面词不在袋里；值域只有「快照数据 + 壳注入的回调」。宿主钩子（`useXxx`）不许下沉。
 */

// ── 形状常量 ──────────────────────────────────────────────────────────────

/**
 * 宿主钩子不许下沉成卡片 props（不变量 5）。
 *
 * 判据要机器化而不是靠自觉：壳里 11 处读宿主钩子，其中 7 处带契约漂移票的疤。
 * 谁一旦把 `useSessionStatus` 之类塞进卡片的 props 袋，宿主契约就在 props 这一层被悄悄改写，
 * 而那一层的漂移**没有任何测试会响**。
 */
const HOST_HOOK = /^use[A-Z]/;

/**
 * Proxy 上要放行的属性名——它们是**运行时**在问「你是不是个 thenable / 怎么打印你」，
 * 不是在问某个 slot。不放行会让 `await view`、`console.log(view)` 这类无害操作炸掉。
 */
const PASSTHROUGH = new Set([
	"then",
	"catch",
	"finally",
	"toJSON",
	"constructor",
	"inspect",
	"nodeType",
	"$$typeof",
]);

/**
 * 装配期抛错。
 *
 * 继承 `TypeError`：`CardViewError` 说的全是「这个 module 收到的形状不对」，不是「某本书的
 * 用户操作失败了」。⚠️ 上层**不许** `catch` 它再降级——那正是本 module 要拆掉的那种静默。
 */
export class CardViewError extends TypeError {}

/** 一个键是不是宿主钩子（导出仅为可测，避免测试里各写一份正则）。 */
export const isHostHookKey = (key) => HOST_HOOK.test(key);

// ── 声明：defineCardView ──────────────────────────────────────────────────

/**
 * 声明一张卡的 props 契约。
 *
 * `spec`：
 *   · `card`     —— 卡的名字，**必填**。没有它出了错没人知道是哪张卡；它只进错误原文。
 *   · `fromBook` —— 这张卡从**书**上取哪几个键（`["meta", "busy", …]`）。
 *   · `required` —— 缺了就不该渲的键。缺任一个 → **抛**（不是静默降级）。
 *   · `defaults` —— 键在**袋里是 `undefined`** 时才填的缺省（装饰性兜底）。
 *   · `derive`   —— `(bag) => ({…})`，把**书侧的键**整形成**卡片消费的 prop 名**。
 *                   ⚠️ **只有一个参数**（此刻的袋子）：见 `build` 里那一节的理由——给它两个
 *                   读法，delta 覆盖 book 键时它们会给出不同的值。
 *
 * ⚠️ **`fromBook` 取键名数组而不是函数**（与票面 Interface 一节的写法不同，这是本 module 的
 * 核心决定，不是笔误）：函数形态没法在装配期**静态**算出「这张卡允许哪些键」，而「允许哪些键」
 * 正是这张票要拦的东西——`.scratch/dsh-contract-drift/` 那两次事故的形状就是恒空，恒空的前提
 * 永远是一个**没人认领的键**。取数组，键集合在定义期就闭合；需要改形状的归 `derive`。
 *
 * 返回一个**可调用**的 `build(base, delta)`（挂了三只读元数据供 `createCardView` 读）。
 * 日常从 `createCardView` 走；测试要一张袋而不建整张 View 时可以直接调它。
 *
 * @param {object} spec 契约声明（字段见上）
 * @returns {(base?: object, delta?: object) => object} 装配器
 */
export function defineCardView(spec) {
	if (spec === null || typeof spec !== "object") {
		throw new CardViewError("defineCardView 的 spec 必须是一个对象。");
	}
	const { card, fromBook = [], required = [], defaults = {}, derive = null } = spec;
	if (typeof card !== "string" || card === "") {
		throw new CardViewError(
			"defineCardView 的 spec.card 必填且非空：它只进错误原文，但没有它，"
				+ "装配错了没人说得清是哪张卡。",
		);
	}
	if (!Array.isArray(fromBook) || !Array.isArray(required)) {
		throw new CardViewError(`[${card}] fromBook 与 required 必须是数组（键名，不是值）。`);
	}
	if (defaults === null || typeof defaults !== "object" || Array.isArray(defaults)) {
		throw new CardViewError(`[${card}] defaults 必须是一个「键 → 缺省值」的对象。`);
	}

	const bookKeys = Object.freeze([...new Set(fromBook)]);
	const requiredKeys = Object.freeze([...new Set(required)]);
	const defaultKeys = Object.freeze(Object.keys(defaults));

	// 定义期三道闸（不变量 4、5）。它们都在**声明**时就响，而不是等到装配。
	for (const key of [...bookKeys, ...requiredKeys, ...defaultKeys]) {
		if (HOST_HOOK.test(key)) {
			throw new CardViewError(
				`[${card}] 契约里出现了宿主钩子字段「${key}」：宿主钩子留在壳里，不许下沉成卡片 props。`,
			);
		}
	}
	const bookSet = new Set(bookKeys);
	const defaultSet = new Set(defaultKeys);
	for (const key of requiredKeys) {
		if (defaultSet.has(key)) {
			// 给了缺省就永远不缺 ⇒ 「必填」是空话。这类声明会让人以为漏传会被拦。
			throw new CardViewError(
				`[${card}] 「${key}」既是必填又给了缺省：缺省只在值为 undefined 时生效，`
					+ `所以这条「必填」永远不会被触发。要么去掉 defaults 里那一条，要么别声明必填。`,
			);
		}
		if (!bookSet.has(key)) {
			throw new CardViewError(
				`[${card}] 必填键「${key}」既不在 fromBook 里、也不在 defaults 里，`
					+ `没有任何地方能给它值——这条「必填」永远不成立。`,
			);
		}
	}
	// ⚠️ 这里**曾经**还有第三道闸「`fromBook` 与 `defaults` 不得同键」，理由是「两个来源 =
	// 两处都得记住更新」。**那道闸是错的，已拆**（2026-10，测试子代理取证）：它让缺省三规则的
	// 第 2 条变成空转——两个集合不相交 ⇒ 缺省键压根不进 ① 那一步 ⇒ 「只在 undefined 时填」
	// 恒真。于是「书给 null 就原样保留 null」这件事**没法声明**，而它恰恰是票面验收判据 6
	// 的字面形状（`defaults: { contextPercent: 50 }` ＋ 书上的 `null` ⇒ 袋里必须是 `null`，
	// 绝不显示 0%，票 28）。
	//
	// 重名**不是**第二来源：`defaults` 在这里是显式的「书上没给才用这个」，与壳里今天写的
	// `sources: meta.sources ?? []` 是同一句话，只是从内联挪到了契约里。
	// 真正要防的「凭空造书级数据」由 required 那一组闸管（`:133-145`）。

	function build(base, delta) {
		const src = base === null || base === undefined ? {} : base;
		const bag = {};

		// ① 书级数据（浅抄一层：袋是新的、可冻结的，不把宿主给的活对象当袋本身）。
		for (const key of bookKeys) bag[key] = src[key];

		// ② 缺省：**只**在 undefined 时填。`null` 是显式的「没有」——
		//    票 28（`contextPercent: null` 绝不显示 0%）就靠这一格成立。
		for (const key of defaultKeys) {
			if (bag[key] === undefined) bag[key] = defaults[key];
		}

		// ③ 这一次的 delta（`.with({…})`，两个 PhasePage mount 点与 SSR 渲染开口走它）。
		//
		// ⚠️ **闭集只认「声明过的键」**（`fromBook` ∪ `defaults`），**不含 `derive` 产出的键**。
		// 这是一道闸，不是一条纪律（2026-10，子代理纠我）：`derive` 的职责是把 book 侧的键
		// **整形成卡片的 prop 名**——`ExploreConfirmCard` 与 `OutlineConfirmCard` 的 prop 都叫
		// `onConfirm`，指向的却是壳里两个不同的动作，于是 book 侧用不撞名的 `confirmExplore` /
		// `confirmOutline`，由各自的 `derive` 整形。若 `.with` 改得动整形出来的那一位，
		// 同一个名字就有两处来源了，而那正是这张票要消灭的形状（「恒空」的前身是没人认领的键）。
		// ⇒ 需要在调用处覆盖的值必须**声明**在 `fromBook` 或 `defaults` 里（两个 PhasePage
		// mount 点那几个值就是这样登记的），而不是靠 derive 顺带产出再被 `.with` 改掉。
		//
		// ⚠️ delta 排在 derive **之前**（2026-10，子代理纠我第二处）：否则 `.with` 覆盖了一个
		// book 键之后，整形出来的 prop 仍停在**旧**的那个值上（`phase` 变成 4、`phaseLabel`
		// 还写着「阶段 3」）——同一个袋里两处自相矛盾。排在这里，derive 看到的就是**最终值**。
		if (delta !== null && delta !== undefined) {
			const allowed = new Set([...bookKeys, ...defaultKeys]);
			for (const key of Object.keys(delta)) {
				// 宿主钩子**先**判：它当然进不了 `allowed`，但「把宿主钩子下沉成 props」与
				// 「名字拼错了」是两回事，要给的修法也不同——前者要把这行从接线里删掉，
				// 后者要改契约。混进「契约没声明的键」那句话里，下一个人会照着改契约。
				if (HOST_HOOK.test(key)) {
					throw new CardViewError(
						`[${card}] delta 里塞了宿主钩子字段「${key}」：宿主钩子留在壳里，`
							+ `不许下沉成卡片 props（壳里那 11 处读取点是它的家）。`,
					);
				}
				if (!allowed.has(key)) {
					throw new CardViewError(
						`[${card}] delta 里有契约没声明的键「${key}」。这张卡吃什么写在它自己的`
							+ `文件里（${card} 的 defineCardView），不在调用处临时加——`
							+ `写错了的名字就是恒空。已声明的键：${[...allowed].join("、")}。`,
					);
				}
				// delta 里的 `undefined` 视为「没写」，让缺省与 derive 接着生效；
				// 显式的 `null` 原样落下。
				if (delta[key] !== undefined) bag[key] = delta[key];
			}
		}

		// ④ 壳里的现算表达式：把**书侧的键**整形成**卡片消费的 prop 名**。
		//
		// ⚠️ 它**只拿得到一个参数**（此刻的袋子），这是有意的：`derive` 若能同时看到「原始书切片」
		// 与「袋子」，就会有两个读法，而 delta 覆盖 book 键时这两个读法给出**不同的值**——写出
		// 读错那一个的人会得到一个自相矛盾的袋，而且没有任何测试会响。袋子里已经有 book 键、
		// 缺省与 delta 覆盖后的**全部最终值**，从它读就是唯一正确的读法。
		//
		// ⚠️ 它**无条件**给出它声明的每一个键。（⚠️ 别照着「键集随数据飘会让同一个 delta 在某本书上
		//    抛、另一本上不抛」那句话把它的输出键加回 ③ 的闭集——那条顾虑是旧闭集
		//    （含 `Object.keys(bag)`）才有的。现在的闭集只看**声明过的键**，与 derive 无关，
		//    所以同一个 delta 在任何一本书上的判词逐字相同。`test-card-view.mjs` 有机器证据。）
		if (derive !== null) {
			const extra = derive(bag);
			if (extra === null || typeof extra !== "object") {
				throw new CardViewError(`[${card}] derive 必须返回一个「键 → 值」的对象。`);
			}
			for (const key of Object.keys(extra)) {
				if (HOST_HOOK.test(key)) {
					throw new CardViewError(
						`[${card}] derive 产出了宿主钩子字段「${key}」：宿主钩子留在壳里。`,
					);
				}
				bag[key] = extra[key];
			}
		}

		// ⑤ 必填校验：**这一条是本 module 存在的理由**。今天缺了它，卡片用
		//    `if (postAction === undefined) return;` 自己吞掉——用户在界面上点一颗键，
		//    什么都没发生，没人看得见（票 01 查实：5 处守卫生产不可达，纯粹是为测试省略
		//    props 而长出来的）。改成装配期抛，当场可见、并且点名是谁、缺哪个字段。
		//
		// ⚠️ 原文说的是「必填输入」而不是「必填 props」：`required` 装的是**契约声明的键名**，
		// 多数就是卡片消费的 prop 名，但 `derive` 整形的那几位装的是**书侧的键**——
		// 报 `confirmExplore` 而不是 `onConfirm` 是有意的：那是真正没有值的那一位，
		// 报 prop 名会把人引到一张根本没出错的卡上去找。
		for (const key of requiredKeys) {
			if (bag[key] === undefined) {
				throw new CardViewError(
					`[${card}] 必填输入「${key}」是 undefined。这张卡的契约声明了它，`
						+ `没有它卡片只会静默降级（那颗键点了什么都没发生，界面上看不出来）——`
						+ `要么补上，要么从契约里去掉。`,
				);
			}
		}

		// `with` **不可枚举**：React 建元素时按可枚举自有键拷 props，它若是可枚举的，
		// 每张卡的 props 里就会多一个叫 `with` 的函数。
		// ⚠️ 必须**先**定义再冻结——冻结后的对象上再 defineProperty 会抛（模块是严格模式）。
		Object.defineProperty(bag, "with", {
			enumerable: false,
			value: (next) => (next === null || next === undefined ? bag : build(src, next)),
		});
		return Object.freeze(bag);
	}

	return Object.defineProperties(build, {
		card: { enumerable: true, value: card },
		fromBook: { enumerable: true, value: bookKeys },
		required: { enumerable: true, value: requiredKeys },
		__cardViewBuild: { enumerable: false, value: true },
	});
}

// ── 装配：createCardView ──────────────────────────────────────────────────

/**
 * 装一张 slot 表。壳用它取代 12 处手抄的 props 袋。
 *
 * **懒**：没取过的 slot 不建、不校验（那 12 张卡一次只渲一两张）。
 * **记忆**：同一个 `View` 上两次取同一个 slot 拿到**同一引用**。
 *
 * @param {object} book 当前书 + 壳注入的回调（`{ meta, gate, events, busy, postAction, … }`）。
 *   ⚠️ 契约里 `fromBook` 点过名的键**必须都在 `book` 上**（哪怕值是 `undefined`）：缺一个当场抛。
 * @param {object} slots slot 名 → `defineCardView` 的返回值
 * @returns {object} View
 */
export function createCardView(book, slots) {
	if (slots === null || typeof slots !== "object" || Array.isArray(slots)) {
		throw new CardViewError("createCardView 的 slots 必须是一个「slot 名 → 装配器」的对象。");
	}
	const cache = new Map();
	const view = {};
	const names = [];

	for (const [slot, build] of Object.entries(slots)) {
		if (typeof build !== "function" || build.__cardViewBuild !== true) {
			throw new CardViewError(
				`createCardView 的 slot「${slot}」不是一个 defineCardView 的返回值。`,
			);
		}
		names.push(slot);
		Object.defineProperty(view, slot, {
			enumerable: true,
			configurable: false,
			get() {
				if (cache.has(slot)) return cache.get(slot);
				const base = {};
				for (const key of build.fromBook) {
					// ⚠️ **键在 `book` 里压根没出现** ⇒ 壳压根没提这一项，当场响。
					// 这与「壳显式传了 `undefined`」是两件事：后者是壳**说了**「这一位没有」
					//（`browsingKey: null`、`contextPercent: undefined` 那种），是合法接线。
					// 前者意味着这张卡要的输入，壳里压根没有名字——收编时真漏过一次
					// （`outlineText`：阶段页第 3 阶段的章节安排清单，而 `foldOutline` 的 try/catch
					// 会把解析失败吞成 `null`，于是那张清单静默不渲染，冒烟与全部既有测试照旧绿）。
					// 缺省补位救不了它（`undefined` 走缺省），必填校验也只在声明了必填时才响。
					// 所以这道闸在 `createCardView` 这一侧，不在契约里。
					if (book !== null && book !== undefined && !Object.hasOwn(book, key)) {
						throw new CardViewError(
							`[${build.card}]（slot「${slot}」）要的书级输入「${key}」在 book 里`
								+ `**压根没有这个键**。这不是「值是 undefined」——后者是壳说了「这一位没有」，`
								+ `合法；前者是壳没给这一项起名字。把它补进壳的那本 book。`,
						);
					}
					base[key] = book === null || book === undefined ? undefined : book[key];
				}
				const bag = build(base, undefined);
				cache.set(slot, bag);
				return bag;
			},
		});
	}

	// 「壳引用了一个没登记的 slot」当场响。生产侧加一张焦点区主卡＝在 `src/ui/card-routing.js`
	// 加一行（路由键、slot 登记与卡旁的契约都从那一行读到）；若它由 `focusCardKey` 路由，
	// 整壳探针那份**人写的可见串取证表**会醒、提醒补一条——「漏了一处没人发现」由那张表的
	// 两侧闭包、整壳探针与这里**引用它的那一行**一起报。
	//
	// ⚠️ 放行 `Object.prototype` 上的名字（`toString` / `valueOf` / `hasOwnProperty` …）与
	// 运行时探针（`then` / `inspect` …）：它们是「怎么把你打印/展开」的问题，不是「哪个 slot」。
	const listed = names.join("、");
	return new Proxy(view, {
		get(target, prop) {
			if (
				typeof prop === "string"
				&& !(prop in target)
				&& !(prop in Object.prototype)
				&& !PASSTHROUGH.has(prop)
			) {
				throw new CardViewError(
					`壳引用了一个没登记的卡片 slot「${prop}」。已登记的是：${listed}。`
						+ `加一张卡要同时登记 slot 与它在卡旁声明的契约。`,
				);
			}
			return target[prop];
		},
	});
}
