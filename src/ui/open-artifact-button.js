/**
 * 造书工作台 · 「打开这份文件」按钮（中性共用件）
 *
 * 票 09（`workbench-transitions/spec.md` §3 热区表「章节卡」行 / 不变量 5）：全仓只有**一种**
 * 「打开」形态——写着「打开」的显式按钮，点一下把**工作区相对路径**交给 DSH 右栏。阶段页三处
 * （产物行 / 材料行 / 旧稿行）、事件行行内、章节卡非过目态都用它，不许再抄一份实现。
 *
 * ⚠️ 它原住在 `src/ui/phase-page.js`（票 02 把内部件升成具名导出 `OpenArtifactButton`）。
 * 票 09 要章节卡（`chapters-map.js`）也用它，而当时 `phase-page.js` 已经 import 了
 * `chapters-map.js`（为了 `foldKnowledgeMap`）——反过来 import 就成环
 * （`chapters-map → phase-page → chapters-map`），且环上两个文件都是渲染路径上的域文件。
 * 故把这一件搬到**中性模块**：`phase-page.js` 原样再导出它（票 02 的导出表面不变），
 * `chapters-map.js` 从这里 import——两个域都不碰对方的实现，也不引入环。
 *
 * 📌 **那条环今天已经不存在了**（票 `depth-review-2026-10/03`）：`foldKnowledgeMap` 与
 * `foldOutline` 搬去了中性模块 `machine-product-folds.js`，于是 `phase-page → chapters-map`
 * 那条边撤掉了。⚠️ **本文件仍住在中性模块**、两个域仍各自直接 import 它——这已是终局而不是
 * 权宜：它是**渲染路径上的真共用件**（阶段页三处 + 事件行 + 章节卡），搬进任何一个域都会
 * 让另一个域反向 import 它。换句话说，「防成环」不再是理由，但结论不变。
 *
 * prop 契约：`{ item, onOpen, label?, disabled?, title?, style? }`——
 *  - `item.path` 是工作区相对路径，点一下交出 `onOpen(item.path)`；
 *  - `label` 缺省时文案是动词「打开」（左边那一格已经是产物名时用它；没有名字那一格时
 *    调用点写「<产物名> 打开」，见事件行）；
 *  - `disabled` / `title` 给"文件还没写出来"那种置灰用（缺省不置灰、提示一律走产物名）；
 *  - `style` 只给调用点改对齐用（本件默认 `marginLeft:auto`＝在产物行里靠右）。
 *
 * 📌 票 `gold-display-period/05`：**调用点把 `disabled` 当 prop 递进来，所以「置灰」得长在本件
 * 自己身上**——本件的 `disabled` 表达式逐字就是 `props.disabled === true`，置灰走同一处
 * `S.disabled`（`src/ui/styles.js` 的唯一出处）。调用点那一边就不必再套一层（判据认这种透传，
 * 见 `test/test-disabled-visual.mjs` 第 4 条）。
 */
import { createElement as h } from "react";
import { artifactName } from "./view-rules.js";
import { S } from "./styles.js";

export function OpenArtifactButton(props) {
	return h(
		"button",
		{
			style: S.disabled(
				{
					marginLeft: "auto",
					border: "1px solid var(--dsw-alias-border-l2)",
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
				props.disabled === true,
			),
			onClick: () => props.onOpen(props.item.path),
			disabled: props.disabled === true,
			// 票 10（判定三 #1）：这里原来印 `${props.item.path}`（`工作区/explore.md` 这类机器路径）。
			// CONTEXT.md「产物名」明写「产物相对路径原文连按钮的悬浮提示一起不上屏」——名字一律走
			// `artifactName`（票 05 的同一份词表，任何屏同一个名字）。
			title: props.title ?? `在右栏打开「${artifactName(props.item.path)}」`,
		},
		props.label ?? "打开",
	);
}
