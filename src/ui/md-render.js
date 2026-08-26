/**
 * 造书工作台 · 最小 markdown 渲染
 *
 * 正文流式阅读用的行内/分块渲染：不引依赖，全用 React.createElement。
 * 服务谈判桌（GoldReader/GoldCompare）、探查报告、章节内联展开等所有「读稿」场景。
 */

import { createElement } from "react";
import { splitParagraphs } from "./rules.js";

// 正文流式排版（F11）：像读书一样一段段往下流，不做卡片框。
export const READER_PARA_STYLE = {
	margin: "0 0 0.75em",
	fontSize: "14px",
	lineHeight: 1.7,
	maxWidth: "42em",
};

/**
 * 行内最小 markdown 渲染（正文流式阅读用，不引依赖，全用 React.createElement）：
 * - `**加粗**` -> <strong>；
 * - `#`/`##` 开头 -> 加粗标题段；
 * - `- ` 开头 -> 列表行（前面加项目符号）；
 * - 其余原样当纯文本。
 * 恒返回节点数组（文本 + 元素混排），可直接 ... 展开成 createElement 的 children。
 */
export function renderInline(text) {
	const str = String(text ?? "");
	const head = /^(#{1,2})\s+(.+)$/.exec(str);
	if (head !== null)
		return [
			createElement(
				"strong",
				{ style: { fontSize: "16px" } },
				...inlineBold(head[2]),
			),
		];
	const list = /^[-*]\s+(.+)$/.exec(str);
	if (list !== null)
		return [
			createElement(
				"span",
				{ style: { display: "block" } },
				"• ",
				...inlineBold(list[1]),
			),
		];
	return inlineBold(str);
}

/** 把 `**加粗**` 切成 [文本, strong, 文本, ...] 的节点数组：odd 下标是加粗段。 */
function inlineBold(s) {
	const parts = String(s).split(/(\*\*.+?\*\*)/g);
	const nodes = [];
	for (let i = 0; i < parts.length; i += 1) {
		if (parts[i] === "") continue;
		nodes.push(
			i % 2 === 1
				? createElement("strong", { key: i }, parts[i].slice(2, -2))
				: parts[i],
		);
	}
	return nodes;
}

// F30（2026-08-20 走查）：源探查报告（work/explore.md）的 md 最小渲染。
// 按空行切段：`## ` 开头当标题（renderInline 自带加粗样式），普通段用正文流式排版
// （READER_PARA_STYLE），`- ` 列表行由 renderInline 转成带项目符号的块。
// 恒返回节点数组，可直接 ... 展开成 createElement 的 children；空/异常输入返回空数组。
export function exploreReportBlocks(mdText) {
	const paras = splitParagraphs(mdText);
	const blocks = [];
	for (const para of paras) {
		blocks.push(
			/^#{1,2}\s+/.test(para)
				? createElement(
						"div",
						{ key: blocks.length, style: { margin: "0 0 0.6em" } },
						...renderInline(para),
					)
				: createElement(
						"p",
						{ key: blocks.length, style: READER_PARA_STYLE },
						...renderInline(para),
					),
		);
	}
	return blocks;
}
