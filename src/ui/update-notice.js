/**
 * 造书工作台 · 「有没有新版本」自检
 *
 * ## 它要解决的那个病：**装到的不是最新版**，而症状长得像「装好了」
 *
 * 工作台界面能开、三个组件都在跑，只是「造书模式」那个下拉里没有它——用户看着像装成功了。
 * 这背后是**两个各自独立、都让人装到旧版**的原因，只讲一个就会漏掉另一个：
 *
 * ① **记死的版本号**（`①` 下面第一条纪律说的那件事）：dsh 装插件时把版本号**记死**在用户
 *    profile 的 `package.json` 里（`"dsh-craft-your-textbook": "^1.2.0"`），包管理器认这一行、
 *    不回头看有没有新的。所以「卸载再装一次」永远停在原地。
 * ② **包管理器的新版本冷却**（2026-10-03 实测钉住）：pnpm 11 的 `minimum-release-age`
 *    默认 **1440 分钟（24 小时）**——发布不到一天的版本**不会被装上**，它静默挑「最新的、
 *    够老的那一版」。所以**发布当天**装的用户拿到的是上一版，而插件页对话框里那行版本
 *    （来自 `pnpm view`，不受这条策略限制）显示的是新的：两边天然对不上。
 *    实测（2026-10-03，1.3.1 发布约 10 小时后）：
 *      `pnpm add <包名>`                → 1.2.0（裸包名、裸 latest 都被冷却）
 *      `pnpm add <包名>@latest`         → 1.2.0（tag 也走同一套解析）
 *      `pnpm add <包名>@^1`             → 1.2.0（范围不够具体，一样落到够老的那版）
 *      `pnpm add <包名>@^1.3.1`         → **1.3.1** ✅（**指到具体版本**才穿透）
 *    ⇒ 结论：**只有「带具体版本的 spec」能当场装上刚发布的那一版**。这就是下面那句文案里
 *    为什么一定要给 `installSpec()` 而不是只给包名。
 *
 * 这一条把「我落后了」从**要靠读文档才能发现**变成**自己会开口**，并且开口时**直接给出
 * 那条当场能用的安装串**——用户不该为了装上最新版先去理解冷却机制。
 *
 * ## 三条纪律（照本仓既有口径，不是新发明的）
 *
 * 1. **读不出就说读不出。** registry 连不上、返回里没有 `version`、本地版本注入失败——
 *   三种都落 `unreadable`，界面**一个字都不显示**。拿「大概是最新」冒充「已是最新」，
 *   比不提示坏得多：它会让一个真落后的人以为自己没问题。
 * 2. **请求不许从渲染路径里发。** 工作台的 `fetch` 桩会把每一次调用都记进 `calls`
 *   （首屏那几条读通道的顺序与次数是 `test-workbench-first-screen.mjs` 的主要观察口，
 *   未被 stub 的请求直接抛）。所以 `startUpdateCheck()` 由 `apply(ctx)` 在**注册时**发起，
 *   组件只 `subscribe` 一个已经算好的结果——渲染期零请求。
 * 3. **它只提示，不自己升级。** 真去改用户的 profile 再 shell out 跑包管理器，是在
 *   dsh 正跑着的时候动它的配置。修法有两条**当场可用**的：插件页面里照抄那条带版本的
 *   安装串，或跑 `npx dsh-craft-your-textbook --upgrade`。
 *
 * ## 无 React 依赖的部分是判据，有 React 依赖的只有最后那个 hook
 *
 * 判据（`classifyUpdate`）与 store 是纯 JS，可以被单独喂读数钉住；hook 薄到只有一行
 * `useSyncExternalStore`——它要求 `getSnapshot` **每次返回同一个引用**，否则 React 会
 * 无限重渲染，所以快照只在结果真的变了时才换新对象。
 */
import { useSyncExternalStore } from "react";

/**
 * npm 上的**发布包名**，逐字写全，不靠构建期替换。
 *
 * 为什么不写开发板名（`dsh-craft-your-textbook`）：npm 上**同名但另一个包**是上游 skill
 * 那个产品，拿它比会得出与本插件无关的结论。这里的名字必须是发布包名。
 *
 * `scripts/release.mjs` 的包名改写带负向后顾（`(?<!dsh-)`），所以这一行原样发布，
 * 不会被再套一层前缀变成 `dsh-dsh-craft-your-textbook`。
 */
export const PUBLISHED_PACKAGE = "dsh-craft-your-textbook";

/** 本包在 npm 上的最新一版。一次检查一个会话只问一次。 */
const REGISTRY_LATEST_URL = `https://registry.npmjs.org/${PUBLISHED_PACKAGE}/latest`;

/** 装完记得重启：换掉的是 dsh 启动时读进来的那一份，跑着的进程不会自己换。 */
export const UPGRADE_COMMAND = "npx dsh-craft-your-textbook --upgrade";

/**
 * 插件页面里**照抄就能用**的安装串：`<包名>@^<版本>`。
 *
 * ## 为什么必须是「带具体版本的 spec」，而不是包名
 *
 * 包管理器对新发布的版本有一层冷却（pnpm 11 的 `minimum-release-age`，默认 24 小时，见文件头
 * 那个病）。裸包名、`@latest`、`@^1` 全都会被它挡回上一版——**只有指到具体版本的 spec 才
 * 穿透**。所以这一行是把「我发现落后了」变成「你现在就能装上」的那一步，版本号取自
 * **运行时刚读到的那一版**，不写死在源码里（写死就会和发版节奏各走各的）。
 */
export function installSpec(version) {
	return `${PUBLISHED_PACKAGE}@^${version}`;
}

/**
 * 判据能产出的**四档**。**多一档就会有人问它是什么意思**——所以 `ahead` 的意思就写在它自己这一行：
 *
 * `ahead` ＝ **本地装的比 registry 上的 `latest` 还新**（正式版也会走到这一档：刚发布、
 * dist-tag 回退、或那一版被撤回）。它是一个**已知事实**，不是「不知道」——所以
 * ① 不许塞进 `up-to-date`（他不是「最新」——他手上那份比 `latest` 还新；塞进去就是拿
 *    「已是最新」冒充事实，见文件头纪律 1）；
 * ② 也不许说成 `behind`（旧口径只判两边**是否相等**，于是本地 1.4.0 对上 registry 1.3.1 被说成
 *    「有新版本 v1.3.1（你现在是 v1.4.0）」——那句是自相矛盾的）；
 * ③ 它的正确界面行为是**不出话**：`updateNoticeText` 只认 `behind`，所以 `ahead` 一个字都不显示
 *    （「不许说『已是最新』」这条纪律于是住在文案函数那一层）。
 * 少一档就会把「不知道」塞进「已是最新」。
 */
export const UPDATE_STATES = Object.freeze(["up-to-date", "behind", "ahead", "unreadable"]);

/**
 * 一个版本号 → 三个发布号。**只认 `数字.数字.数字`**，别的形状一律读不出。
 *
 * 预发布号按**发布号**比（`1.4.0-rc.1` 与 `1.4.0` 同档）——与 `scripts/setup.mjs`
 * 的 `parseHostVersion` 同一口径：判的是「有没有新的一版」，不是「rc 够不够稳」。
 */
export function parseReleaseVersion(raw) {
	const matched = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+][^\s]*)?$/u.exec(String(raw ?? "").trim());
	if (matched === null) return null;
	return [Number(matched[1]), Number(matched[2]), Number(matched[3])];
}

/**
 * 两边读数 → 档位。**纯函数**：不联网、不碰全局，所以能被逐档喂读数钉住。
 *
 * 比较是**三向**的（`installed` 相对 `latest`：旧 ⇒ `behind`／同 ⇒ `up-to-date`／新 ⇒ `ahead`）。
 * 旧口径只判两边**是否相等**，于是「本地比 registry 新」也落 `behind`——那正是 `ahead` 这一档
 * 存在的理由，逐档含义见 `UPDATE_STATES`。
 *
 * @param installed 本地装的是哪一版（构建期注入的那个）
 * @param latest registry 上最新的是哪一版
 */
export function classifyUpdate({ installed, latest }) {
	const from = parseReleaseVersion(installed);
	const to = parseReleaseVersion(latest);
	// 任一边读不出就是 `unreadable`——**不许**退回「已是最新」。这是本模块最重要的一条。
	if (from === null || to === null) {
		return Object.freeze({ state: "unreadable", installed: null, latest: null });
	}
	// 逐段比到第一位不等为止，取那个方向：`from` 大 ⇒ `ahead`，`to` 大 ⇒ `behind`。
	// （两边都是 `parseReleaseVersion` 吐的三元组，等长——上面那两行早退保证了这一点。）
	let direction = 0;
	for (let index = 0; index < from.length; index += 1) {
		if (from[index] === to[index]) continue;
		direction = from[index] < to[index] ? -1 : 1;
		break;
	}
	return Object.freeze({
		state: direction < 0 ? "behind" : direction > 0 ? "ahead" : "up-to-date",
		installed: String(installed).trim(),
		latest: String(latest).trim(),
	});
}

/** 构建期注入的版本号。没注入（测试直接 import `src/`）就是 `null`，不是「未知版本号」。 */
export const INSTALLED_VERSION =
	typeof __TEXTBOOK_VERSION__ === "string" ? __TEXTBOOK_VERSION__ : null;

/**
 * 构建期注入的**包名**。同样读不出就是 `null`——不是猜一个，也不是拿 `PUBLISHED_PACKAGE` 顶上。
 *
 * 为什么非要它：**版本号分不出跑的是哪一层**。开发版与发布版现在都是 `1.3.2`，能分开的
 * 只有包名（`dsh-craft-your-textbook` ／ `dsh-craft-your-textbook`）。少了这一项，「我现在验的
 * 是不是用户装到的那一份」就只能靠人去记自己上次切过哪一层——今天开头那个病正是这么来的。
 */
export const INSTALLED_PACKAGE =
	typeof __TEXTBOOK_PACKAGE__ === "string" ? __TEXTBOOK_PACKAGE__ : null;

/** 「跑的是哪一层」判据能产出的三档。与 `UPDATE_STATES` 同一条纪律：多一档就会有人问它是什么意思。 */
export const LAYER_STATES = Object.freeze(["published", "not-published", "unreadable"]);

/**
 * 跑的是不是发布版——判据本体。**纯函数**，与 `classifyUpdate` 同一形状的读数。
 *
 * ## 为什么三档而不是两档
 *
 * `unreadable`（包名没注入进来，测试直接 import `src/` 时就是这个）**必须**单独一档，
 * 且它落 `null` 不落 `not-published`：判据分不出「这不是发布版」与「不知道是不是发布版」，
 * 把后者塞进前者，界面就会对着一个它其实不知道的事实开口。`updateNoticeText` 收到
 * `unreadable` 时**照旧按发布版那条路走**——那是改动之前的行为，不因为多了这一档就变。
 *
 * @param packageName 构建期注入的包名
 * @param version 构建期注入的版本号（读不出就是 `null`，那一档只影响话里带不带版本）
 */
export function classifyLayer({ packageName, version } = {}) {
	const name = typeof packageName === "string" ? packageName.trim() : "";
	if (name === "") {
		return Object.freeze({ state: "unreadable", packageName: null, version: null });
	}
	const parsed = typeof version === "string" && version.trim() !== "" ? version.trim() : null;
	return Object.freeze({
		state: name === PUBLISHED_PACKAGE ? "published" : "not-published",
		packageName: name,
		version: parsed,
	});
}

/**
 * 层徽记 → 界面上那两样东西（短签 + 悬浮说明）。**只有「不是发布版」才有话说**，
 * 其余两档返回 `null`（不渲染）。
 *
 * ## 为什么拆成 label / hint 两半
 *
 * 徽记摆在焦点区底部那条「之前的过程」小条的**右端**，那儿的宽度是按一行小字留的；
 * 一句四十来字的话放进去会折成三五行，那不是提示是噪声。所以上屏的只有包身份那几个字，
 * **「你验的不是用户装到的那一份」这句解释进 `title`（悬浮才看）**——它是对那句话的
 * 注解，不该按字宽占着现场。
 *
 * ⚠️ **2026-10-12 上屏那半多了一句「改仓里立刻生效」**：短签原样只有包身份，而这一档
 * （`not-published`＝跑的不是发布版）**真正的操作含义**恰恰是「这一份是活的」——
 * `docs/dsh-模式改进手册.md` 那句「Junction 部署是活的（改仓里立刻见效）」就是它，
 * 而 `node scripts/dsh-layer.mjs status` 只在仓外回答同一件事。短签上写明它，
 * 省掉的就是「刷新没反应时先怀疑哪一层」那一步（票 `preset-declaration-row/02` 的验收点）。
 *
 * ## 为什么发布版自己那一份不显示
 *
 * 终端用户装的就是发布版，那一行对他**零信息量**却常年占着位置；而它真正要挡的那个病是
 * 「我以为在验开发版，其实在验发布版」——后者只有跑在别的包上时才看得见。
 * ⚠️ 这条判据**只抓一个方向**：跑在发布版上时它一声不吭。那是本判据已知的边界，
 * 写在这里而不是留给下一个人猜——另一个方向由 `npm run layer` 那条命令在仓外回答。
 *
 * @returns `{label, hint, packageName}` | null
 */
export function layerBadge(layer) {
	if (layer?.state !== "not-published") return null;
	const version = layer.version === null ? "" : ` v${layer.version}`;
	return Object.freeze({
		label: `🧪 开发版${version}，改仓里立刻生效`,
		hint: `你验的不是用户装到的那一份发布版（${layer.packageName}${layer.version === null ? "" : ` v${layer.version}`}）。`,
		packageName: layer.packageName,
	});
}

/** 还没问 / 正在问：渲染出来是空的，所以这一档不需要单独一个 state。 */
const pendingFor = (installedVersion) => Object.freeze({ state: "pending", installed: installedVersion, latest: null });

/**
 * 造一个「更新自检」的 store（票 `deep-module-scan/08` 丙）。
 *
 * ## 为什么从模块单例改成工厂
 *
 * 原来 `snapshot` / `listeners` / `started` 是**模块级变量**，为了让 `test-plugin-upgrade-path`
 * 的每条用例能从头开始，模块上留了一个 `__resetUpdateNoticeForTest` 逃生舱——全 `src/**`
 * **唯一**一个测试专用导出，被那个测试调了 9 次。代价有两样：
 * ① interface 被测试撑宽了一条；② **用例之间有状态泄漏**，每条用例都**必须记得**先 reset，
 * 忘了就是一条假红或假绿，取决于前一条留下了什么。
 *
 * 工厂把那个「记得 reset」从**人的纪律**变成**结构上不可能**：`fetchImpl` 与 `installedVersion`
 * 在**构造时**注入，每个用例造自己那一个 store，两个用例之间没有任何共享状态可泄漏。
 * 形状照仓里已有的正例 `ui/artifact-read.js` 的 `createArtifactReader({ fetchImpl })`。
 *
 * ## 但生产那一个**仍然是单例**，而且必须是
 *
 * `useSyncExternalStore` 要一个**稳定引用**的 store。所以模块底部建一个 `defaultStore`，
 * `startUpdateCheck` / `useUpdateNotice` 绑在它上面——**生产那一侧的调用点一个字没变**
 * （`client-entry.js:2554` 的 `void startUpdateCheck()`，另有
 * `test-plugin-upgrade-path.mjs:604` 那条源码级闸钉着它）。
 *
 * ⇒ 变的只有一件事：**测试不再伸手进 module 的内部状态**。
 *
 * @param fetchImpl 注入的取数口（生产取 `globalThis.fetch`）。
 * @param installedVersion 覆盖「本地装的是哪一版」。没注入（直接跑 `src/` 的测试）就是 `null`，
 *   而 `null` 时下面那条早退分支**根本不发请求**——没有左半边，这次比较问不出任何东西。
 */
export function createUpdateNoticeStore({
	fetchImpl = globalThis.fetch,
	installedVersion = INSTALLED_VERSION,
} = {}) {
	let snapshot = pendingFor(installedVersion);
	const listeners = new Set();
	let started = false;

	/** `useSyncExternalStore` 的取数口。**没问过就返回那一个 PENDING 引用**——每次新建对象会让 React 无限重渲染。 */
	function getUpdateSnapshot() {
		return snapshot;
	}

	/** 订阅口。返回退订函数，形状与 React 要的一致。 */
	function subscribeUpdateNotice(listener) {
		listeners.add(listener);
		return () => listeners.delete(listener);
	}

	/** 换快照 + 通知。**只在真的变了时换引用**（同一条纪律，见文件头）。 */
	function publish(next) {
		if (
			next.state === snapshot.state &&
			next.installed === snapshot.installed &&
			next.latest === snapshot.latest
		) {
			return;
		}
		snapshot = next;
		for (const listener of [...listeners]) listener();
	}

/**
	 * 发起一次检查。**幂等**：一个页面生命周期里只问一次，重复调用直接返回同一个 promise。
	 *
	 * 它是 fire-and-forget：返回的 promise 只给测试 await 用，调用方**不阻塞**任何东西。
	 * 失败一律落 `unreadable`，**不抛**——一条提示功能不该有能力把界面带崩。
	 *
	 * @returns {Promise<{state: string, installed: string|null, latest: string|null}>}
	 */
	function startUpdateCheck() {
		if (started) return Promise.resolve(snapshot);
		started = true;

		// 本地版本注入不进来（直接跑 `src/` 的测试）时**根本不发请求**：没有左半边，
		// 这次比较问不出任何东西。
		if (installedVersion === null) {
			publish(Object.freeze({ state: "unreadable", installed: null, latest: null }));
			return Promise.resolve(snapshot);
		}
		if (typeof fetchImpl !== "function") {
			publish(Object.freeze({ state: "unreadable", installed: installedVersion, latest: null }));
			return Promise.resolve(snapshot);
		}

		return fetchImpl(REGISTRY_LATEST_URL)
			.then((response) => {
				if (response?.ok !== true) throw new Error(`HTTP ${response?.status ?? "?"}`);
				return response.json();
			})
			.then((body) => {
				publish(classifyUpdate({ installed: installedVersion, latest: body?.version }));
			})
			.catch(() => {
				// 断网、被墙、registry 改了形状——都落同一档。**不区分**，因为对用户是同一句话。
				publish(Object.freeze({ state: "unreadable", installed: installedVersion, latest: null }));
			})
			.then(() => snapshot);
	}

	return Object.freeze({ getUpdateSnapshot, subscribeUpdateNotice, startUpdateCheck });
}

/** 生产用的那一个（理由见上面「但生产那一个仍然是单例」那节）。 */
const defaultStore = createUpdateNoticeStore();

/**
 * 生产侧取数口：绑在 `defaultStore` 上，**调用形状不变**——`client-entry.js:2554` 仍是无参调用，
 * 另有 `test-plugin-upgrade-path.mjs:604` 那条源码级闸钉着那个调用点。
 */
export function startUpdateCheck() {
	return defaultStore.startUpdateCheck();
}

/** 只给组件用：一行订阅。判据与网络都在上面，这里不碰。 */
export function useUpdateNotice() {
	return useSyncExternalStore(
		defaultStore.subscribeUpdateNotice,
		defaultStore.getUpdateSnapshot,
		defaultStore.getUpdateSnapshot,
	);
}

/**
 * 档位 → 界面上那一句。**只有 `behind` 有话可说**，其余三档（`up-to-date`／`ahead`／`unreadable`）
 * 返回 `null`（不渲染）。
 *
 * `ahead`（本地比 registry 新）没有句子**不是遗漏，是它的正确行为**：它能说的两句都错——
 * 「有新版本」自相矛盾（他手上的比 registry 新，那句给的安装串要么解析回他自己那一版、要么在
 * 撤回场景里真把他降级），「已是最新」则是拿一个判据没证明的结论冒充事实。
 *
 * 顺带把两件用户当下就需要的东西都带出来：他**现在**是哪一版（要能对照着自己看），
 * 以及**装上新版**的那条安装串（带版本号，见 `installSpec` 的注释——只给包名的话，
 * 他会在冷却期里装到同一版，这个提示就白给了）。
 *
 * @param snapshotValue store 的快照
 * @param layer `classifyLayer` 的结果；**不传**按 `unreadable` 处理（既有调用点形状照旧可用）
 */
export function updateNoticeText(snapshotValue, layer) {
	// 跑的不是发布版时这句话必须闭嘴：拿 registry 的 latest 去比**开发版**的版本号，比出来的结论
	// 与「用户装到的那一份」无关。⚠️ `ahead` 那一档只堵住其中一个方向——开发版比 npm 新时它
	// 本来就不出话；**反方向仍然由这一格承重**：开发树在改 1.3.3、npm 的 `latest` 已经是 1.5.0 时，
	// `classifyUpdate` 照旧判 `behind`，界面就会劝一个跑着仓里最新代码的人去装「新版本」——
	// 而那与他手上这一份没有关系。那一行由层徽记顶上。
	// `unreadable`（判不出是不是发布版）**不闭嘴**：那正是改动之前的行为。
	if (layer?.state === "not-published") return null;
	if (snapshotValue?.state !== "behind") return null;
	return `造书工作台有新版本：v${snapshotValue.latest}（你现在是 v${snapshotValue.installed}）。`
		+ ` 不想开命令行：插件页面「添加插件」里输入 ${installSpec(snapshotValue.latest)} 就能装上这一版；`
		+ ` 或者跑这一条：${UPGRADE_COMMAND} —— 两种装完都要重启 dsh。`;
}

// ⚠️ 这里原来还挂着一个 `__resetUpdateNoticeForTest`——全 `src/**` 唯一的测试专用导出。
// **它已经不在了，理由与替代物见上面 `createUpdateNoticeStore` 的注释**：要复位就造一个新
// store，不需要伸手进 module 的内部状态。真要加回来之前，先读那段——那正是「interface 被
// 测试撑宽」的定义。
