/**
 * 工作台动作接缝（票 contract-actions/03，ADR-0017 决策 7 的第三步）。
 *
 * 规范动作名与「工作台能发 / 只读展示」这一暴露事实的唯一出处是契约面动作目录
 * （`src/contract-actions.js`）。工作台这一侧因此**不再持有第二份动作名清单**：
 *   · 发动作的那条路只收目录标成 `callable` 的名字；
 *   · 只读展示那条路只收 `read-only` 的名字（今天只有 `pattern-list`）——
 *     进入目录不等于变成可调用，这一格由两扇门各自钉住。
 *
 * 本 module 只做**身份与暴露范围**这一跳：它不认识 payload、不发请求、不做用户确认、
 * 也不认识宿主形状（那些仍归各自那份流程与接线）。认不出来的名字在这里**响着失败**
 * （开发错误），不会把一个 `undefined` 悄悄填进请求体。
 *
 * 与 `src/ui/**` 的关系：工作台各域组件不 import 本文件——它们经 `WorkbenchView` 递下来的
 * `postAction` 发动作，那条漏斗在这里把关（见 `client-entry.js`）。
 */
import { getContractAction } from "./contract-actions.js";

/** 目录里的暴露事实在报错里怎么说（人话，不是机器身份词）。 */
const EXPOSURE_WORD = Object.freeze({
	callable: "可调用",
	"read-only": "只读展示",
});

/**
 * 工作台发一个动作前要过的那扇门。
 * 返回目录给的**规范动作名**（与传入的名字逐字相同——它就是同一份身份）。
 */
export function uiCallable(name) {
	const action = getContractAction(name);
	if (action === null) throw new Error(`工作台不能发「${name}」：它不在契约面动作目录里`);
	const word = EXPOSURE_WORD[action.workbenchExposure];
	if (action.workbenchExposure !== "callable")
		throw new Error(`工作台不能发「${name}」：目录里它是${word ?? "不对工作台开放"}`);
	return action.name;
}

/** 工作台读一个动作的结果时走的那扇门（只读展示，今天只有模式库清单）。 */
export function uiReadOnly(name) {
	const action = getContractAction(name);
	if (action === null) throw new Error(`工作台读不了「${name}」：它不在契约面动作目录里`);
	if (action.workbenchExposure !== "read-only") {
		const word = EXPOSURE_WORD[action.workbenchExposure];
		throw new Error(
			`工作台的只读那一路只收只读展示动作，「${name}」在目录里是${word ?? "不对工作台开放"}`,
		);
	}
	return action.name;
}
