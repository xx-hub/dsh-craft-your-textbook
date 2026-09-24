/**
 * 造书工作台 · 「打开这份文件」按钮（中性共用件）
 *
 * 票 09（`workbench-transitions/spec.md` §3 热区表「章节卡」行 / 不变量 5）：全仓只有**一种**
 * 「打开」形态——写着「打开」的显式按钮，点一下把**工作区相对路径**交给 DSH 右栏。阶段页三处
 * （产物行 / 材料行 / 旧稿行）、事件行行内、章节卡非过目态都用它，不许再抄一份实现。
 *
 * ⚠️ 它原住在 `src/ui/phase-page.js`（票 02 把内部件升成具名导出 `OpenArtifactButton`）。
 * 票 09 要章节卡（`chapters-map.js`）也用它，而 `phase-page.js` 已经 import 了 `chapters-map.js`
 * （`foldKnowledgeMap` / `stepRowText`）——反过来 import 就成环
 * （`chapters-map → phase-page → chapters-map`），且环上两个文件都是渲染路径上的域文件。
 * 故把这一件搬到**中性模块**：`phase-page.js` 原样再导出它（票 02 的导出表面不变），
 * `chapters-map.js` 从这里 import——两个域都不碰对方的实现，也不引入环。
 *
 * prop 契约：`{ item, onOpen, label?, disabled?, title?, style? }`——
 *  - `item.path` 是工作区相对路径，点一下交出 `onOpen(item.path)`；
 *  - `label` 缺省时文案是动词「打开」（左边那一格已经是产物名时用它；没有名字那一格时
 *    调用点写「<产物名> 打开」，见事件行）；
 *  - `disabled` / `title` 给"文件还没写出来"那种置灰用（缺省不置灰、提示一律走产物名）；
 *  - `style` 只给调用点改对齐用（本件默认 `marginLeft:auto`＝在产物行里靠右）。
 */
import { createElement as h } from "react";
import { artifactName } from "./view-rules.js";

export function OpenArtifactButton(props) {
	return h(
		"button",
		{
			style: {
				marginLeft: "auto",
				border: "1px solid var(--dsw-border, #d0d7de)",
				borderRadius: "8px",
				padding: "4px 12px",
				fontSize: "12px",
				fontWeight: 600,
				background: "transparent",
				color: "inherit",
				cursor: "pointer",
				whiteSpace: "nowrap",
				...(props.style ?? {}),
			},
			onClick: () => props.onOpen(props.item.path),
			disabled: props.disabled === true,
			// 票 10（判定三 #1）：这里原来印 `${props.item.path}`（`work/explore.md` 这类机器路径）。
			// CONTEXT.md「产物名」明写「产物相对路径原文连按钮的悬浮提示一起不上屏」——名字一律走
			// `artifactName`（票 05 的同一份词表，任何屏同一个名字）。
			title: props.title ?? `在右栏打开「${artifactName(props.item.path)}」`,
		},
		props.label ?? "打开",
	);
}
