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

/** 判据能产出的三档。**多一档就会有人问它是什么意思**；少一档就会把「不知道」塞进「已是最新」。 */
export const UPDATE_STATES = Object.freeze(["up-to-date", "behind", "unreadable"]);

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
	const behind = from[0] !== to[0] || from[1] !== to[1] || from[2] !== to[2];
	return Object.freeze({
		state: behind ? "behind" : "up-to-date",
		installed: String(installed).trim(),
		latest: String(latest).trim(),
	});
}

/** 构建期注入的版本号。没注入（测试直接 import `src/`）就是 `null`，不是「未知版本号」。 */
export const INSTALLED_VERSION =
	typeof __TEXTBOOK_VERSION__ === "string" ? __TEXTBOOK_VERSION__ : null;

/** 还没问 / 正在问：渲染出来是空的，所以这一档不需要单独一个 state。 */
const PENDING = Object.freeze({ state: "pending", installed: INSTALLED_VERSION, latest: null });

let snapshot = PENDING;
const listeners = new Set();
let started = false;

/** `useSyncExternalStore` 的取数口。**没问过就返回那一个 PENDING 引用**——每次新建对象会让 React 无限重渲染。 */
export function getUpdateSnapshot() {
	return snapshot;
}

/** 订阅口。返回退订函数，形状与 React 要的一致。 */
export function subscribeUpdateNotice(listener) {
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
 * @param installedVersion 覆盖「本地装的是哪一版」。默认取构建期注入的那个；**测试用它
 *   走网络那条路**——不注入时下面那条早退分支会先返回，那条路就永远测不到。
 * @returns {Promise<{state: string, installed: string|null, latest: string|null}>}
 */
export function startUpdateCheck({ fetchImpl = globalThis.fetch, installedVersion = INSTALLED_VERSION } = {}) {
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

/** 只给组件用：一行订阅。判据与网络都在上面，这里不碰。 */
export function useUpdateNotice() {
	return useSyncExternalStore(subscribeUpdateNotice, getUpdateSnapshot, getUpdateSnapshot);
}

/**
 * 档位 → 界面上那一句。**只有 `behind` 有话可说**，其余两档返回 `null`（不渲染）。
 *
 * 顺带把两件用户当下就需要的东西都带出来：他**现在**是哪一版（要能对照着自己看），
 * 以及**装上新版**的那条安装串（带版本号，见 `installSpec` 的注释——只给包名的话，
 * 他会在冷却期里装到同一版，这个提示就白给了）。
 */
export function updateNoticeText(snapshotValue) {
	if (snapshotValue?.state !== "behind") return null;
	return `造书工作台有新版本：v${snapshotValue.latest}（你现在是 v${snapshotValue.installed}）。`
		+ ` 不想开命令行：插件页面「添加插件」里输入 ${installSpec(snapshotValue.latest)} 就能装上这一版；`
		+ ` 或者跑这一条：${UPGRADE_COMMAND} —— 两种装完都要重启 dsh。`;
}

/** 仅供测试把 store 复位用。生产路径不调用。 */
export function __resetUpdateNoticeForTest(next = PENDING) {
	snapshot = next;
	started = false;
	listeners.clear();
}
