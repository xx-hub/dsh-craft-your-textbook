/**
 * 屏级路由（surface）——**「渲哪一屏」的唯一判定面**（票 `ui-systematic-fixes/05` 立，
 * 票 `06` 在这里补异常态的出口）。
 *
 * 它为什么存在：搬移之前，「渲哪一屏」散在壳（`src/client-entry.js`）的**五处就地判据**里
 * ——预设门、加载/向导三目链、单屏/三区分界、现在/回看分界、`showWizardForm`。那五句每一个都
 * 只看得到自己那一小块（`meta === null` 与 `loading` 各自出现在三处），于是「哪些处境存在、各自
 * 有没有出口」只能靠人读代码。收成一个纯函数之后，闸才有东西可枚举（06 的四条不变式按它做表驱动）。
 *
 * **这张表就是实现**：壳只消费返回值，那五处就地判据删掉、不与之并跑——留着就又有了第二份枚举
 * （见 spec 实现决策 §4「判据与被判物共用一份枚举、改坏时恒绿」那个坑）。
 *
 * ## 票 06 改了什么（三处死路的出口）
 *
 * 1. **读失败 ≠ 没书**。`no-book` 收窄成「**书单读到了、且确实为空**」；这一本／这张书单这次没读
 *    回来时落 `unreadable`（一句人话 ＋ 一颗「重试」），**不再摆出建档向导**——那会诱导用户
 *    在盘上那本书还在的情况下再建一本。反向也收紧了：书单读到了、里面有书、只是身份还没落，
 *    今天落 `loading`（从前落向导）。
 * 2. **身份失效（404/403）不再静默**。投影给信号（入参 `identityLost`，由注入回调送到壳）时落
 *    `identity-lost`：必有非空 `copy` ＋ 一颗「重试打开这本书」。⛔ 这一档**不许**有建档键
 *    （书可能还在盘上，只是这个会话读不到）。
 * 3. **加载带读数**。`elapsedMs` **由调用方传**（壳里那一个计时器），本模块只消费它；超过
 *    `LOADING_RETRY_AFTER_MS` 追加一颗「重试」——**不许永久停在没出口的屏上**。不读时钟，
 *    所以判据能在毫秒内把 30 秒那一格走完。
 *
 * ## 本票的边界（票 05 那条边界照旧）
 *
 * - `kind` 的七档是**闭集**（`SURFACE_KINDS`，导出给判据枚举）；`exits` 的字段表同样是导出的
 *   （`SURFACE_EXIT_FIELDS`）。
 * - **有书那三档（`now` / `phase-page` / `browsing`）的出口仍由组件自判**：顶栏的 ⏸/▶（`panels.js`）
 *   与活性行的 🔁。票 06 ⛔ 不把它们搬进这张表——搬一半会让同一件事出现**两份判据**，而两张表
 *   各自漂的时候没人看得见。阶段五出错／待配置那两档归票 07。
 * - `copy` 里那两句过渡话是从壳里搬进来的**同一串字**（「加载中…」／「正在打开这本书…」）；
 *   有书那三档的 `copy` 是 `null`（「轮到你的那件事」由状态条/活性行承担，归 10/11）。
 * - **不读时钟**：`elapsedMs` 由调用方传。零副作用：不碰 React、不碰 DOM、不改入参、
 *   同一份输入两次调用结果相同。
 * - **重试不是契约面业务动作**：它不写账本、不进动作目录，走的是书投影那两条既有公开入口
 *   （`refresh()` / `selectProject(id)`，见 `SURFACE_RETRY_ACTIONS` 的注释）。
 * - ⛔ **不画假的「换一本书」**：今天没有用户面的书单。
 * - ⛔ **不推翻 `ADR-0006`**：向导不可取消照旧——它的前提是「本会话**无书**」，而读不到**不是**无书。
 *
 * ## 各档是什么意思（今天谁会产生它）
 *
 * - `loading`：造书会话、书还没读到（清单在途、或清单已到而身份还没落——后者防中间帧闪向导）。
 * - `no-book`：造书会话、**书单读到了、且确实为空**（06 起只此一支）。
 * - `unreadable`：读失败（这一本或这张书单这次没读回来），以及非造书会话「没有可画的书」那两支。
 * - `identity-lost`：身份失效（404/403），由投影的信号（`identityLost`）认定；必有 `copy` 与重试。
 * - `now` / `phase-page` / `browsing`：有书之后的三档（现在／某一步的浏览／某一阶段的页面）。
 *   ⚠️ 后两档要看 `viewPhase` / `browsing`，而它们住在 `BookSessionScope` 里 ⇒ 壳在**它之外**
 *   那一次调用拿不到（传 `null`，得到 `now`，只用来判「哪一屏的骨架」），进到壳里面再拿真值调一次。
 *   判定实现仍然只有这一份，壳两处都只是消费。
 *
 * ⚠️ **一处有意的形状差**：旧表达式是 `meta === null || loading`，但 `meta` 非 `null` 时 `loading`
 * 恒为假（投影里 `unknown` 那一路的 `data` 是 `null`，见 `workbench-projection.js` 的
 * `failedResource` / `clear`）⇒ 本函数只按「有没有 `meta`」分两支，不再重复问 `loading`。
 * 副作用面：`unreadable` 那一档把**非造书会话的两支**（在读／不在读）与**读失败**都收在同一个
 * `kind` 里，只由 `copy` 分取值——七档里没有「非造书会话」这一档，而壳又必须零 `sessionPreset`
 * 判据才不会变成第二份枚举。读到「`kind === "unreadable"`」时**不要**假定它是读失败：要判读失败
 * 得同时看 `copy`（这也是渲染面按 `exits` 摆键、不按 `kind` 认处境的理由）。
 */

/** `kind` 的**闭集**：壳按它选骨架，判据按它枚举四条不变式。⛔ 不许在别处再写第二份。 */
export const SURFACE_KINDS = Object.freeze([
	"loading",
	"unreadable",
	"identity-lost",
	"no-book",
	"now",
	"phase-page",
	"browsing",
]);

/** 一颗出口的字段表（导出的形状，判据按它逐颗核；`destructive` 是显式布尔，不是「有没有这一格」）。 */
export const SURFACE_EXIT_FIELDS = Object.freeze([
	"id",
	"label",
	"action",
	"why",
	"destructive",
]);

/**
 * **读面重试**的两个动作名（出口的 `action` 字段取值）——⛔ 它们**不是**契约面业务动作：
 * 不写账本、不进动作目录、不走 `/textbook/action`。壳按它们调**书投影的既有公开入口**：
 * `read` → `projection.refresh()`（再读一次：清单在途就重新发现，有书就重读这一本）；
 * `book` → `projection.selectProject(刚失效的那本)`（身份失效那一档：重试**同一本**，
 * 不按发现顺序换一本——那正是「静默接管另一本」的形状）。
 * 判据从这里取这两个名字，⛔ 不在别处手抄。
 */
export const SURFACE_RETRY_ACTIONS = Object.freeze({
	read: "read-retry",
	book: "book-retry",
});

/** 造书会话在读书时那一句（从壳里搬进来的同一串字）。 */
const LOADING_TEXT = "加载中…";

/** 非造书会话在读书时那一句（同上）。 */
const OPENING_TEXT = "正在打开这本书…";

/**
 * 单屏四支的**屏级问句**（票 `ui-display-redesign/21`，spec §2.19–2.21）。
 *
 * ⚠️ 它们**不进** `decisionOf`（那是 8 个决策站既有问句的唯一出口）；这几句是**屏级**的，
 * 与站 0／站 1／交付同档。文案住这里（`src/ui/**`）而不是壳里，理由见票 21 的边界：
 * 搬进 `src/client-entry.js` 就掉出判定线① 的用词扫描面。
 *
 * ⛔ bare 支（非造书会话、没有可画的书）**没有问句**——它连造书工作台的上下文都没有。
 */
const LOADING_QUESTION = "在等什么、等了多久？";
const READ_FAILED_QUESTION = "为什么没读出来、怎么恢复？";
const IDENTITY_LOST_QUESTION = "这本书为什么打不开？";

/**
 * 加载中那一屏的第二句说明（spec §2.19 第 4 块）：说清「不用你做什么」。
 * ⛔ 它不是事实句——事实句是 `copy`（带已等秒数那一句）。
 */
const LOADING_NOTE = "正在读这本书的数据；读回来就会自动进工作台，不用你做什么。";

/**
 * 非造书会话、又没有可画的书时那句**专用人话**（票 `ui-display-redesign/21`，spec §2.20 第 5 块）。
 *
 * ⛔ 与 `BLANK_FOCUS_TEXT` 是两件事：后者是「焦点区该有卡却没有」的**兜底判定线**，语义一个字
 * 不动；这一句只说清「这个会话本来就不是在造书」，不再借用兜底句的「刷新一下试试」。
 */
const BARE_NO_BOOK_TEXT = "这个会话没有在造书，也没有正在读的书。";

/** 读失败（这一本没读回来）：一句人话，说清「不是没了」，并说清重试不会新建任何东西。 */
const READ_FAILED_BOOK_TEXT =
	"这本书这次没读回来——它还在盘上，不是没了。可以重试，重试不会新建任何东西。";

/** 读失败（书单都没读回来）：同上一句，但主语是书单（这一支连「哪一本」都还不知道）。 */
const READ_FAILED_LIST_TEXT = "书单这次没读回来。可以重试，重试不会新建任何东西。";

/** 身份失效（404/403）：今天一个字都没有 ⇒ 这一句是**告知**，不是错误原文。 */
const IDENTITY_LOST_TEXT =
	"刚才那本书打不开了：它可能已被删除，或者不属于当前会话。盘上若还在，重试就能读回来。";

/** 加载多久之后追加出口（spec 实现决策 §4 不变式 4：`elapsedMs > 30_000`）。 */
const LOADING_RETRY_AFTER_MS = 30_000;

/** 空出口表（模块级同一个引用：它被冻结，谁也不许就地往里塞键）。 */
const NO_EXITS = Object.freeze([]);

/**
 * 向导卡上那三颗键（`event-cards.js` 的 `WizardCard`）——**建档那一档的全部出口**。
 *
 * `destructive: true` 的两颗都会**新建一本书**：它们只许出现在 `no-book`（即「书单读到了、
 * 确实为空」）那一档。读不到书时把建档摆出来，正是这张票要治的病（用户会以为「我没有书」，
 * 从而在盘上那本书还在的情况下再建一本）⇒ 不变式 2 按这一格做正/反对照。
 *
 * ⚠️ **收口 review A5 起这是一份「可对账的声明」**：它不再只是告示性死表——`WizardCard` 今天
 * 由壳按 `kind === "no-book"` 直接渲染、**不读这张表**，所以「契约里那三颗」与「屏上那三颗」
 * 是同一个事实的两份。`test/test-surface-routing.mjs` 那条判据把 `WizardCard` 真渲染一次，
 * 逐字断两边相同 ⇒ 任一侧改名而另一侧没跟上，当场红。
 * ⛔ 导出它**只为这条对账**，不新增第七个「消费这张表的渲染点」（那会造第三份枚举）。
 */
export const NO_BOOK_EXITS = Object.freeze([
	Object.freeze({
		id: "create-book",
		label: "创建这本书",
		action: "book-create",
		why: "这一本还不存在：把它建出来就是这一屏要你确认的事",
		destructive: true,
	}),
	Object.freeze({
		id: "create-demo-book",
		label: "先建一本演示书试试（不花模型额度，几步就能走完）",
		action: "demo-run",
		why: "同样会新建一本书，只是走演示通道、不花模型额度",
		destructive: true,
	}),
	Object.freeze({
		id: "suggest-book",
		label: "✨ AI 建议",
		action: "wizard-suggest",
		why: "让 AI 先拟几个书名/目标填进表单，人再改（不建书）",
		destructive: false,
	}),
]);

/**
 * 读失败那一档的唯一出口：再读一次。**非破坏性**——它不新建、不删除、不改任何东西，
 * 只是把这一次没读回来的那一份再要一遍（底层那个 2 秒轮询也照旧自愈，这颗键是给
 * 「用户此刻就想再试一下」用的，⛔ 不替代轮询）。
 */
const READ_RETRY_EXITS = Object.freeze([
	Object.freeze({
		id: "read-retry",
		label: "重试",
		action: SURFACE_RETRY_ACTIONS.read,
		why: "这次没读回来：书还在盘上，再读一次不会新建任何东西",
		destructive: false,
	}),
]);

/** 加载超过上限之后的唯一出口：同上那颗读面重试，只是 `id` 不同（两档各自成表，便于逐档核形状）。 */
const LOADING_RETRY_EXITS = Object.freeze([
	Object.freeze({
		id: "loading-retry",
		label: "重试",
		action: SURFACE_RETRY_ACTIONS.read,
		// 票 `ui-display-redesign/21`（spec §2.19）：屏上不写「30 秒」这个机器口径（门槛仍住
		// `LOADING_RETRY_AFTER_MS`，只是不上人眼——连悬停提示也不写）。
		why: "已经等了一会儿还没回来：再读一次，不必刷新页面",
		destructive: false,
	}),
]);

/**
 * 身份失效那一档的唯一出口：重试**同一本**。
 * ⛔ 不给「换一本书」（今天没有用户面的书单），⛔ 不给建档（书可能还在盘上）。
 */
const IDENTITY_LOST_EXITS = Object.freeze([
	Object.freeze({
		id: "book-retry",
		label: "重试打开这本书",
		action: SURFACE_RETRY_ACTIONS.book,
		why: "刚才那一本读不到（可能已删除或不属于本会话）：再试读同一本，不会新建也不会换书",
		destructive: false,
	}),
]);

/**
 * 组装一份返回值：屏级字段 ＋ 那一格「挂不挂工作台壳」。
 *
 * `question`／`note`（票 `ui-display-redesign/21`，spec §2.19–2.21）：单屏四支的屏级问句与
 * 加载中那句说明。缺省 `null` ＝ 这一档没有这一块（有书三档／`no-book` 都不从这里出问句）。
 */
function surfaceOf(kind, copy, exits, bare = false, question = null, note = null) {
	return { kind, copy, exits, bare, question, note };
}

/** 已等整秒数：非数字／负数一律当 0（首帧传 `null` 时就落回旧句）。 */
function elapsedSeconds(elapsedMs) {
	const ms = typeof elapsedMs === "number" && Number.isFinite(elapsedMs) ? elapsedMs : 0;
	return ms > 0 ? Math.floor(ms / 1000) : 0;
}

/** 在那一句后面缀上已等秒数；不足 1 秒时**逐字**返回原句（首帧与单测里 `elapsedMs: 0`）。 */
function withElapsed(text, elapsedMs) {
	const seconds = elapsedSeconds(elapsedMs);
	return seconds > 0 ? `${text}（已经等了 ${seconds} 秒）` : text;
}

/** 加载那一档：读数照旧带上；超过上限才追加出口（**不许永久停在没出口的屏上**）。 */
function loadingSurface(text, elapsedMs) {
	const waited = typeof elapsedMs === "number" && elapsedMs > LOADING_RETRY_AFTER_MS;
	return surfaceOf(
		"loading",
		withElapsed(text, elapsedMs),
		waited ? LOADING_RETRY_EXITS : NO_EXITS,
		false,
		LOADING_QUESTION,
		LOADING_NOTE,
	);
}

/**
 * 「这一屏该渲什么」——纯函数，零副作用、不碰 React、不读时钟。
 *
 * @param {object} [input] 壳（或画廊/判据）手上那些**原始量**：
 *   `sessionPreset` 会话的模式投影（只有 `'textbook'` 是造书会话）；
 *   `projectId` 当前书身份（`null` ＝ 还没有）；
 *   `projectsStatus` / `projectsCount` / `generation` 书单那三件（现算 `pickingFirstBook`）；
 *   `coreStatus` / `coreError` 那一本书的读状态（`coreError` 今天只收下、不用）；
 *   `meta` / `gate` 当前书的投影（`meta === null` ＝ 还没有可画的书）；
 *   `viewPhase` / `browsing` / `showHistory` 书级导航态（后两个今天只收下、不用）；
 *   `paused` / `stall` / `mineruSet` / `conversionSettled` 屏上那几件事实（今天只收下、不用）；
 *   `uiError` 动作级错误（今天只收下、不用）；
 *   `elapsedMs` 已经等了多久（**由调用方给**，本模块不读时钟）：`loading` 那一档用它出读数与超时出口；
 *   `identityLost` 投影报来的**身份失效信号**（`null` ＝ 没有；非空时 `meta === null` 那一条落
 *     `identity-lost`）——⛔ 只用它的**有无**，不印它的字段（`projectId` 是机器 id）。
 * @returns {{ kind: string, copy: string | null, exits: ReadonlyArray<object>, bare: boolean,
 *   question: string | null, note: string | null }}
 *   `kind` ∈ `SURFACE_KINDS`；`copy` 是屏级那一句人话（没有则不占屏，给 `null`）；
 *   `exits` 是可点出口（有书那三档是空表：出口在组件里，见文件头那节边界）；
 *   `bare: true` ⇒ 这一屏**不挂工作台壳**、只画那一句话（今天只有「非造书会话又没有可画的书」
 *   那两支）。⚠️ **造书会话的读失败/身份失效不是 bare**：它们要挂壳才有红字、告知与那颗重试；
 *   壳按这一格决定挂不挂，⛔ 不再自己判 `sessionPreset`（那会成第二份枚举）。
 *   `question`／`note`（票 `ui-display-redesign/21`）：单屏四支的**屏级问句**与加载中那句说明；
 *   没有这一块时给 `null`（bare 支恒 `null`——它连造书工作台的上下文都没有）。
 */
export function resolveSurface(input) {
	const {
		sessionPreset,
		projectId,
		projectsStatus,
		projectsCount,
		generation,
		coreStatus,
		coreError,
		meta,
		gate,
		viewPhase,
		browsing,
		showHistory,
		paused,
		stall,
		mineruSet,
		conversionSettled,
		uiError,
		elapsedMs,
		identityLost,
	} = input ?? {};

	// 发现过程中的中间帧：清单已 commit、身份还没落。认成「无书」会在那几毫秒里闪出向导
	// （并白发一次建议请求）⇒ 它算「还在读」。判据与旧壳逐字相同（`book.generation` 是顶层
	// identity 的第三个字段，只在接管/清空/退订时前进）。
	const pickingFirstBook =
		projectsStatus === "ready" &&
		projectsCount > 0 &&
		projectId === null &&
		generation === 0;
	const loading =
		projectId === null
			? projectsStatus === "unknown" || pickingFirstBook
			: coreStatus === "unknown";

	if (meta === null || meta === undefined) {
		// ── 预设门（旧壳那一处）：非造书会话又没有可画的书 ⇒ 今天只画一句话、**不挂工作台壳**。
		// 两个子态（在读／不在读）今天共用一条早退、只换那句话；七档里没有「非造书会话」这一档，
		// 所以它们同落 `unreadable`（理由与代价见文件头那一节）。
		// ⚠️ 票 `ui-display-redesign/21`：不在读那一支的句子从「无卡兜底句」（`BLANK_FOCUS_TEXT`）
		// 换成**专用人话** `BARE_NO_BOOK_TEXT`——兜底句的语义（焦点区该有卡却没有）一个字不动，
		// 只是不再借它替这一支说话。bare 支**没有问句**（壳里也不挂造书工作台）。
		if (sessionPreset !== "textbook") {
			return surfaceOf(
				"unreadable",
				loading ? OPENING_TEXT : BARE_NO_BOOK_TEXT,
				READ_RETRY_EXITS,
				true,
			);
		}
		// ── 造书会话、还没有可画的书：票 06 起按「书单读到了没有／读失败了没有／身份刚失效没有」
		// **排序分四档**（旧写法那条三目链把前三档都合成了向导）。
		// ① 身份失效（404/403）：投影报来了信号 ⇒ 必须有告知 ＋ 重试（今天连红字都没有）。
		//    ⛔ 排在 `loading` 之前：清身份之后那一小段「还在读」不该把告知吞掉。
		if (identityLost !== null && identityLost !== undefined) {
			return surfaceOf(
				"identity-lost",
				IDENTITY_LOST_TEXT,
				IDENTITY_LOST_EXITS,
				false,
				IDENTITY_LOST_QUESTION,
			);
		}
		// ② 读失败：这一本没读回来或书单没读回来 ⇒ 一句人话 ＋ 重试，**不摆建档向导**。
		//    `error` 恒伴随 `known === false`（投影的 failedResource），所以它只可能是「从没读到」；
		//    读成功过之后再抖动是 `stale`（保留 last-known），落不到这里。
		const readFailed = projectId === null ? projectsStatus === "error" : coreStatus === "error";
		if (readFailed) {
			return surfaceOf(
				"unreadable",
				projectId === null ? READ_FAILED_LIST_TEXT : READ_FAILED_BOOK_TEXT,
				READ_RETRY_EXITS,
				false,
				READ_FAILED_QUESTION,
			);
		}
		// ③ 书单读到了、确实为空 ⇒ 这一档才摆向导（不变式 2 里唯一许有建档键的 kind）。
		//    `stale` 也算「读到了」：它保留的是 last-known 清单，语义上仍是「上一眼看到的是空的」。
		//    ⚠️ `projectId === null` 这一句不能省：身份已经落下、core 还在读的那一帧里，
		//    「清单是空的」是**上一本书**留下的事实（`selectProject` 刚换台），拿它落向导会让
		//    建档键在「已经在读某一本」时闪一下——`test/smoke-test.mjs` 的「点创建只发一次
		//    book-create」当场逮到过这个形状（它还顺带多问了一次 AI 建议）。
		const listRead = projectsStatus === "ready" || projectsStatus === "stale";
		const emptyBookList = projectId === null && listRead && !(projectsCount > 0);
		if (emptyBookList) return surfaceOf("no-book", null, NO_BOOK_EXITS);
		// ④ 其余都算「还在读」：清单在途、中间帧、或清单里有书而身份还没落（旧写法把它落向导，
		//    于是「盘上有书、界面却请你再建一本」——那是这张票要治的第二个形状）。
		return loadingSurface(LOADING_TEXT, elapsedMs);
	}

	// ── 有书之后的三种看点（旧壳那三处门控）。⚠️ 顺序即语义：`browsing` 排在 `viewPhase` 之前
	// （两个都非空时今天渲的是浏览那一棵）。出口在组件里（顶栏/活性行），本表空表——见文件头。
	if (browsing !== null && browsing !== undefined) return surfaceOf("browsing", null, NO_EXITS);
	if (viewPhase !== null && viewPhase !== undefined) return surfaceOf("phase-page", null, NO_EXITS);
	return surfaceOf("now", null, NO_EXITS);
}
