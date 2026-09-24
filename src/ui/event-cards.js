/**
 * 造书工作台 · 流程卡片群
 *
 * 焦点区按流水线状态切换的那组卡片：进度条、向导卡、上传区、状态/错误卡、
 * 交付卡、关卡拍板卡，以及 MinerU Token 常驻入口。
 * 还包括事件账本的人话文案映射（cardText/cardIcon）——「之前的过程」列表也用它。
 */

import { createElement, useEffect, useRef, useState } from "react";
import { S } from "./styles.js";
// 双端共享领域件：六阶段全称、素材角色、角色识别兜底、事件含义表、范例章号（单一事实来源）。
import { PHASES, ROLES, guessRoleFromName, EVENT_META, MAX_UPLOAD_BYTES, uploadTooLargeMessage, goldChapterNo } from "../domain-rules.js";
// 界面用词表（批 2）：阶段片不再各写一套短标签，取词只此一处。
import { PHASE_UI, phaseUi, gateHuman, stageLabelHuman, segmentHuman, eventHuman, checkHuman } from "./view-rules.js";
// 章完成度的唯一一份口径（票 14）：章级「交工通过」事件（含最佳范例章那一步）+ 该章无未处置意见。
// 章节卡与状态卡的数字都取它，界面里不许有第二份推导。
import { deriveDoneSet, hasPendingReview, humanDuration } from "./rules.js";

// ── 机器检查清单（批 2，2026-09-20 用户拍板）─────────────────────────────────
// 原来 12 条 ✅ 平铺在卡里，加上 AI 自查 6 条 = 18 行绿勾，把唯一的决策按钮挤出首屏。
// 改成一行摘要 + 折叠细则；**有没过项时不折叠**——失败项不该藏起来。
// 终检认可卡与交付卡共用（原来两处逐字节重复）。
//
// 票 20（2026-09-24 拍板）：终检认可卡对**没过的**检查项给一个「让 AI 按这条去改」入口——
// 指令由机器按该项 `note` 起草（`draftFixInstruction`），用户只点一下，走既有终检修订回路。
// 入口由调用方传 `onFix` 才渲染（交付卡不传：那时清单必然全过）。
export function MachineChecks({ checks, onFix, fixDisabled }) {
	const list = checks ?? [];
	if (list.length === 0) return null;
	const failed = list.filter((check) => check.ok !== true).length;
	// 「提示你看一眼」是第三态：机器不拦交付、但确实发现了东西。
	// 原来这种项也打绿勾 ✅，绿勾与警告同框——现在用 ⚠️ 分开。
	const warned = list.filter((check) => check.ok === true && check.warn === true).length;
	// ⚠️ 票 20 起重复标题**不再是**第三种状态（它是真门槛，没过就是 ❌）——
	// 但第三态的表征留着：`ok:true + warn:true` 的项仍标 ⚠️ 并挂「只是提示，不拦交付」。
	// 这一句必须挂在每一项自己行里——否则用户会把提示当门槛，以为不解决就交付不了。
	const rows = list.map((check) =>
		createElement(
			"div",
			{ key: check.name, style: { margin: "4px 0" } },
			createElement(
				"span",
				null,
				check.ok !== true ? "❌" : check.warn === true ? "⚠️" : "✅",
			),
			` ${checkHuman(check.name)}`,
			check.ok === true && check.warn === true
				? createElement(
						"span",
						{
							style: {
								marginLeft: "6px",
								fontSize: "12px",
								color: "#9a6700",
							},
						},
						"（只是提示，不拦交付）",
					)
				: null,
			createElement(
				"span",
				{ style: { opacity: 0.7, marginLeft: "6px", fontSize: "12px" } },
				check.note ?? "",
			),
			// 票 20：没过的项各给一个「照这条让 AI 去改」的入口（人只点一下，不必自己想改什么）。
			check.ok !== true && typeof onFix === "function"
				? createElement(
						"button",
						{
							style: { ...S.smallLink, marginLeft: "8px" },
							disabled: fixDisabled === true,
							title: "把机器起草的这句话交给 AI，它会照着改整本后重新做最后检查",
							onClick: () => onFix(check),
						},
						"🔁 让 AI 按这条去改",
					)
				: null,
		),
	);
	const summary =
		`🔧 机器也查过了 ${list.length} 项，` +
		(failed === 0 ? "全过" : `有 ${failed} 项没过`) +
		(warned === 0 ? "" : `，另有 ${warned} 项提示你看一眼（只是提示，不拦交付）`);
	// 有没过项或有提示项时不折叠——失败与提示都不该藏起来。
	if (failed > 0 || warned > 0)
		return createElement(
			"div",
			{ style: { margin: "10px 0" } },
			createElement(
				"p",
				{ style: { margin: "0 0 4px", fontSize: "12px", fontWeight: 600 } },
				summary,
			),
			...rows,
		);
	return createElement(
		"details",
		{ style: { margin: "10px 0" } },
		createElement(
			"summary",
			{ style: { cursor: "pointer", fontSize: "12px", opacity: 0.85 } },
			`${summary}（点开看每一项）`,
		),
		createElement("div", { style: { margin: "6px 0 0" } }, ...rows),
	);
}

/**
 * 机器起草的修复指令（票 20，2026-09-24 用户拍板）。
 *
 * 判据来自**该项自己的 `note`**——机器写的那句人话（重复标题那项已把撞车的标题写进句子里），
 * 这里只加一句抬头点到是"哪一项没过"，不新造内容、不猜改法：用户点一下，这句话就作为
 * `final-approve(approved:false, note)` 的 note 提交，走既有终检修订回路（`finalRedoNote`
 * → `handoff('final')`），AI 照着改整本、机器重新做最后检查。
 *
 * 截到 500 字：服务端 `final-approve` 的 note 上限就是 500（`actions/gates.js`），
 * 别让机器起草的句子在门口被静默截断。
 */
export function draftFixInstruction(check) {
	const name = checkHuman(check?.name ?? "");
	const note = String(check?.note ?? "").trim();
	return `机器检查没过「${name}」：${note}`.slice(0, 500);
}

function cardText(event) {
	const data = event.data ?? {};
	switch (event.type) {
		case "textbook/phase-start":
			// ⚠️ data.label 是服务端 PHASE_LABELS（源探查/铺章/终检与交付…）——机器词，
			// 界面按阶段号取词表；取不到才回落服务端 label。
			return `阶段 ${data.phase} 开始：${phaseUi(data.phase) || data.label || ""}`;
		case "textbook/phase-end":
			return `阶段 ${data.phase} 完成：${phaseUi(data.phase) || data.label || ""}`;
		case "textbook/agent-start":
			return `AI 开始：${stageLabelHuman(data.label)}`;
		case "textbook/agent-end":
			return `AI 完成：${stageLabelHuman(data.label)}`;
		case "textbook/gate-proposal":
			return `AI 提案（${gateHuman(data.gate ?? "?")} · v${data.version ?? "?"}）：${data.title ?? ""}`;
		case "textbook/gate-decision":
			return data.approved === true
				? `${gateHuman(data.gate ?? "?")}通过（v${data.version ?? "?"}）`
				: `${gateHuman(data.gate ?? "?")}驳回（v${data.version ?? "?"}）${data.reasons?.length > 0 ? `：${data.reasons.join("、")}` : ""}`;
		case "textbook/mineru-progress":
			return `转换 ${data.file ?? ""}：${data.stage ?? ""}`;
		case "textbook/rollback":
			return `↩️ 已回退到快照 ${data.snapshot ?? "?"}`;
		case "textbook/source-added":
			return `已上传材料：${data.file ?? ""}（${data.role ?? ""}）`;
		case "textbook/hint":
			return `💡 ${data.text ?? ""}`;
		case "textbook/error":
			// data.task 是**机器 label**（引擎传的是「设计提案·关卡N」「源探查」这类），
			// 与《过程记录.md》/播报出口同源，必须过同一层翻译（判定线①；票 01 复审 M1）。
			return `⚠️ 出错（${stageLabelHuman(data.task ?? "")}）：${data.message ?? ""}`;
		case "textbook/quality":
			return `机器检查：${(data.checks ?? []).filter((c) => c.ok === true).length}/${(data.checks ?? []).length} 项通过`;
		case "textbook/delivery":
			return "🎉 交付完成";
		case "textbook/stage-start":
			return `🎯 交给 AI 动手：${stageLabelHuman(data.label ?? data.stage ?? "")}`;
		case "textbook/progress":
			return `⏳ ${data.label ?? ""}${data.detail ? `：${data.detail}` : ""}`;
		case "textbook/review":
			return `👀 抽查意见（${data.title ?? `第${data.chapter ?? "?"}章`}）：${data.comment ?? ""}`;
		case "textbook/ai-report":
			// 票 10（判定三 #10）：界面一律说「检查」，「自查」是机器视角（谁查谁？）。
			return `🛡️ AI 检查报告：${data.report ?? ""}`;
		case "textbook/deep-modify":
			// 票 10（判定三 #3）：`data.segment` 是 seg.key（`gate-1` / `chapter-03`）——机器身份词，
			// 出口处过 `segmentHuman`（domain-rules 的同一份译法，UI 由 view-rules 再导出）。
			return `✏️ 定点修改：${segmentHuman(data.segment)}`;
		case "textbook/deep-undo":
			return `↩️ 撤销定点修改：${segmentHuman(data.segment)}`;
		case "textbook/pattern-added":
			return `📇 已加自定义模式：${data.name ?? ""}`;
		case "textbook/gold-chapter":
			return `👑 最佳范例章：第 ${data.chapter ?? "?"} 章`;
		case "textbook/chapters-review":
			return `🔍 章节过目确认（${data.approved === true ? "通过" : "驳回"}）`;
		case "textbook/final-approve":
			return `✅ 最后检查认可${data.approved === true ? "" : `：${data.note ?? ""}`}`;
		case "textbook/submit-rejected":
			// 交工/提审被拒（票 audit-matrix-contract/01 (d)）：界面上要读得到「交工被拒：<原因>」，
			// 不能只留 label 一行（这正是用户被「机器报错、AI 说没事」卡住的那条信息）。
			return `🚫 交工被拒：${data.reason ?? ""}`;
		default:
			// 兜底读 EVENT_META（label/emoji 双端共用）——绝不回落到 raw 机器串。
			// label 是「机器怎么称呼这件事」，界面仍过一遍词表（关卡/质量门/金标准/终检那几条）。
			return `${EVENT_META[event.type]?.emoji ?? ""} ${eventHuman(event.type, EVENT_META[event.type]?.label ?? event.type)}`.trim();
	}
}

function cardIcon(event) {
	// 「通过/驳回」变体按 data.approved 覆盖基准 emoji（EVENT_META 只放基准）。
	if (event.type === "textbook/gate-decision" || event.type === "textbook/outline-decision")
		return event.data?.approved === true ? "✅" : "↩️";
	return EVENT_META[event.type]?.emoji ?? "•";
}

export { cardText, cardIcon };

// ── 进度条 ──────────────────────────────────────────────────────────────────

// 进度条窄格标签：一律取界面用词表（原来这里另有一套 { 3:"设计", 5:"铺章", 6:"交付" } 短标签，
// 与 PHASES 的 canonical 全称混着用，同一格两套命名法）。
//
// 2026-09-21 用户裁决（经 `/prototype` 三轮）：**阶段片是导航面**——六格全可点，点一格＝去
// 那一步的页面（`ui/phase-page.js`），**不再**直接打开某份文件（旧行为：按"这一步有没有产物"
// 决定能不能点，点开就是预览）。于是：
//   - 可点性不再看产物：有 `onSelect` 就可点（没有则纯指示器，静态渲染/测试走这条）；
//   - `📄` 的含义从"能点开"改成"这一步已经有产物"（只在已完成格出现，纯信息）；
//   - hover 交代**目的地**：去「写完整本」这一步 · 这一步有 3 份文件；
//   - `viewed`＝正在看哪一页，用一圈深色描边标出来——与"书走到哪一步"（蓝底，`S.seg`）区分开。
//
// 2026-09-22 票 12（不变量 13 / ADR-0012 决策 2 同日定稿）：那排六格**常驻**，回看态下
// 「当前阶段」那一格的脸直接写「回到现在」——**可见文字**就是判据（不许只活在悬浮提示里）。
// 于是这一格的两态文案是：
//   "现在"态（`viewed == null`）：`⚡ 写完整本`（轮到你时）/ `写完整本`——阶段名 + 状态色，照旧；
//   回看态（`viewed != null`，即 `browsing` 或 `viewPhase` 非空）：`⚡ 写完整本 · 回到现在`——
//     阶段名仍在（那是这一格的房间身份），另加一个看得见的「回到现在」affordance。
// `viewed` 在这里同时承担"回看态"这一信号：被看的那一步所属的阶段由 `client-entry.js` 传进来
// （浏览态传 `viewPhaseOfBrowsing`，阶段页态传 `viewPhase`），两者非空即"用户不在现在"。
export function PhaseBar(props) {
	const { phase, gate, status, onSelect, viewed, artifactCountOf } = props;
	const doneUpTo = phase - 1;
	const gateAwaiting = gate !== null && gate.status === "awaiting";
	const humanTurn = props.humanTurn === true || (gateAwaiting && phase === 3);
	return createElement(
		"div",
		{ style: S.bar },
		PHASES.map((item) => {
			let state = "pending";
			if (
				item.n < phase ||
				status === "delivered" ||
				(status === "awaiting-explore" && item.n <= 2) ||
				(status === "awaiting-outline" && item.n <= 3) ||
				(status === "awaiting-gold" && item.n <= 4) ||
				(status === "awaiting-chapters-review" && item.n <= 5)
			)
				state = "done";
			else if (item.n === phase) state = "current";
			let label = PHASE_UI[item.n] ?? item.label;
			// 批 4（02 屏判读）：原来这里把当前格的阶段名整个换成「⚡轮到你」——于是「拍板定方案」
			// 那一格只剩「⚡轮到你」，看不出是哪个阶段（用户要的恰恰是"知道自己到哪一步"）。
			// 状态词要带出来，但名字不能丢：用前缀图标，与步清单同款。
			if (item.n === phase && humanTurn) label = `⚡ ${label}`;
			const count =
				typeof artifactCountOf === "function" ? (artifactCountOf(item.n) ?? 0) : 0;
			if (count > 0 && state === "done") label = `${label} 📄`;
			const clickable = typeof onSelect === "function";
			const isViewed = viewed === item.n;
			// 回看态＝用户手里不是"现在"（`viewed` 非空）；此刻「当前阶段」那一格就是「回到现在」。
			const backToNow = viewed != null && item.n === phase;
			if (backToNow) label = `${label} · 回到现在`;
			return createElement(
				"div",
				{
					key: item.n,
					style: {
						...S.seg(state),
						...(clickable ? { cursor: "pointer" } : {}),
						outline: isViewed ? "2px solid var(--dsw-text, #1f2328)" : "none",
						outlineOffset: isViewed ? "-2px" : "0",
					},
					// hover 文案**两态同形**（都写「去「X」这一步 · 有几份文件」）：目的地信息一致，
					// 回看态下"点它其实是回到现在"由那一格脸上的可见文字承担（不靠 hover 才说得清），
					// 也免得同一条 hover 前缀随态变脸（既有断言按 `去「X」` 前缀选格，别让选择器碎掉）。
					title: clickable
						? `去「${PHASE_UI[item.n] ?? item.label}」这一步${count > 0 ? ` · 这一步有 ${count} 份文件` : " · 还没有文件"}`
						: undefined,
					onClick: clickable ? () => onSelect(item.n) : undefined,
				},
				label,
			);
		}),
	);
}

// ── 向导卡 ──────────────────────────────────────────────────────────────────

export function WizardCard(props) {
	const {
		onCreate,
		onCreateDemo,
		busy,
		suggestions,
		suggestLoading,
		onSuggest,
	} = props;
	const [name, setName] = useState("");
	const [goal, setGoal] = useState("");
	const [route, setRoute] = useState("blueprint");
	const [science, setScience] = useState(false);
	const [agree, setAgree] = useState(false);
	const [hint, setHint] = useState("");
	const [error, setError] = useState(null);

	// 书名/目标去前缀（前端兜底）：AI 建议偶尔带「开始：」「书名：」等口水前缀，填入前剥掉。
	// 源头净化在 content-lib.js wizardSuggest（后端），这里防历史/其他来源漏网。
	const stripPrefix = (s) =>
		typeof s === "string"
			? s.replace(/^\s*(?:开始|书名|建议|题目|目标)[:：]\s*/, "")
			: s;

	const pickSuggestion = (suggestion) => {
		setName(stripPrefix(suggestion.name ?? ""));
		setGoal(stripPrefix(suggestion.goal ?? ""));
		setScience(suggestion.science === true);
		setError(null);
	};

	const requestSuggest = () => {
		setError(null);
		void onSuggest(hint.trim()).catch((err) =>
			setError(String(err instanceof Error ? err.message : err)),
		);
	};

	const submit = () => {
		if (name.trim() === "") {
			setError("请填写书名");
			return;
		}
		if (goal.trim() === "") {
			setError("请填一下：这本书学完，学习者要能做到什么？");
			return;
		}
		if (!agree) {
			setError("请先勾选材料声明");
			return;
		}
		onCreate({ name: name.trim(), goal: goal.trim(), route, science });
	};

	return createElement(
		"div",
		{ style: S.focus },
		createElement(
			"div",
			null,
			createElement(
				"strong",
				{ style: { fontSize: "14px" } },
				'📚 第一步 · 材料准备：先填下面几项（10 秒），然后就能上传教材',
			),
		),
		createElement(
			"div",
			{ style: { marginTop: "8px" } },
			createElement(
				"label",
				{ style: { ...S.label, marginTop: "0" } },
				"学习者的背景（选填，让建议更贴切）",
			),
			createElement(
				"div",
				{ style: { display: "flex", gap: "6px" } },
				createElement("input", {
					style: { ...S.input, margin: "4px 0 6px", flex: 1 },
					placeholder: "比如：三年级，想补古诗背诵和作文",
					value: hint,
					onChange: (e) => setHint(e.target.value),
				}),
				createElement(
					"button",
					{
						// 批 4（第一屏判读）：原来「✨ AI 建议」也是 bigBtn(true)，和「创建这本书」
						// 两个一模一样的蓝实心并排——第一屏上"该点哪儿"又糊了。主操作只有一个：创建。
						style: { ...S.ghostBtn(false), padding: "6px 14px", marginTop: "4px" },
						onClick: requestSuggest,
						disabled: suggestLoading,
					},
					"✨ AI 建议",
				),
			),
		),
		suggestions.length > 0
			? createElement(
					"div",
					{ style: { marginTop: "4px" } },
					createElement(
						"p",
						{ style: { margin: "0 0 4px", fontSize: "12px", opacity: 0.7 } },
						"点一个 AI 建议自动填好（可再改）·",
						createElement(
							"button",
							{
								style: { ...S.smallLink, marginLeft: "10px" },
								onClick: requestSuggest,
								disabled: suggestLoading,
							},
							"换一批",
						),
					),
					suggestions.map((suggestion, index) =>
						createElement(
							"button",
							{
								key: index,
								style: {
									...S.projectBtn(false),
									margin: "0 6px 6px 0",
									textAlign: "left",
								},
								onClick: () => pickSuggestion(suggestion),
							},
							`${suggestion.name ?? ""}：${(suggestion.goal ?? "").slice(0, 30)}${(suggestion.goal ?? "").length > 30 ? "…" : ""}`,
						),
					),
				)
			: suggestLoading
				? createElement(
						"p",
						{ style: { margin: "8px 0", fontSize: "12px", opacity: 0.7 } },
						"💡 AI 正在想建议……",
					)
				: null,
		createElement("label", { style: S.label }, "书名"),
		createElement("input", {
			style: S.input,
			placeholder: "比如：初中数学·有理数",
			value: name,
			onChange: (e) => setName(e.target.value),
		}),
		createElement("label", { style: S.label }, "这本书学完，要能做到什么？"),
		createElement("textarea", {
			style: S.textarea,
			placeholder:
				"比如：能独立做对教材配套的基础题，并说出每个概念是什么、为什么、怎么用",
			value: goal,
			onChange: (e) => setGoal(e.target.value),
		}),
		createElement("label", { style: S.label }, "给谁用？"),
		createElement(
			"label",
			{ style: S.checkItem },
			createElement("input", {
				type: "radio",
				name: "route",
				checked: route === "blueprint",
				onChange: () => setRoute("blueprint"),
			}),
			" 给 AI 老师上课用（推荐，教学精度最高）",
		),
		createElement(
			"label",
			{ style: S.checkItem },
			createElement("input", {
				type: "radio",
				name: "route",
				checked: route === "human",
				onChange: () => setRoute("human"),
			}),
			" 给人直接读的教材（AI 也能拿它教）",
		),
		createElement(
			"label",
			{ style: S.checkItem },
			createElement("input", {
				type: "checkbox",
				checked: science,
				onChange: (e) => setScience(e.target.checked),
			}),
			" 理科内容（公式较多，转换时开启公式识别）",
		),
		createElement(
			"label",
			{ style: S.checkItem },
			createElement("input", {
				type: "checkbox",
				checked: agree,
				onChange: (e) => setAgree(e.target.checked),
			}),
			" 我确认：只上传我有权使用的材料；造出来的是教学参考，AI 可能讲错，使用前我会请老师/家长复核",
		),
		error !== null ? createElement("p", { style: S.error }, error) : null,
		createElement(
			"div",
			{ style: { marginTop: "8px" } },
			createElement(
				"button",
				{ style: S.bigBtn(true), onClick: submit, disabled: busy },
				"创建这本书",
			),
		),
		createElement(
			"p",
			{ style: { margin: "10px 0 0", fontSize: "12px", opacity: 0.75 } },
			"还不确定这套流程适不适合你？",
			createElement(
				"button",
				{
					style: { ...S.smallLink, marginLeft: "6px" },
					disabled: busy,
					onClick: () => onCreateDemo(),
				},
				// 票 14（承诺账 D「说不清」第 4 条）：「2 分钟走完全程」查无机制——demo 与真实共用
				// 六个确认闸门，全程要用户逐关拍板，没有任何计时/自动推进。改成能兑现的说法。
				"先建一本演示书试试（不花模型额度，几步就能走完）",
			),
		),
		createElement(
			"div",
			{
				style: {
					marginTop: "12px",
					padding: "8px 10px",
					fontSize: "12px",
					lineHeight: 1.6,
					opacity: 0.75,
					border: "1px solid var(--dsw-border, #d0d7de)",
					borderRadius: "8px",
					background: "var(--dsw-surface, #fff)",
				},
			},
			createElement(
				"p",
				{ style: { margin: "0 0 4px" } },
				"本项目是",
				createElement(
					"a",
					{
						href: "https://www.socratopia.app/r/SCR-FEJXMQ",
						target: "_blank",
						rel: "noopener noreferrer",
						style: {
							color: "var(--dsw-accent, #4f6ef7)",
							textDecoration: "underline",
						},
					},
					"【破卷】",
				),
				"的衍生项目，💡 如果本项目对你有帮助，欢迎填写邀请码：SCR-FEJXMQ，可免费领取 100 万 tokens，全场官方造书免费学习（第三方活动，以对方规则为准）。",
			),
			createElement(
				"p",
				{ style: { margin: "0" } },
				"把造好的书交给",
				createElement(
					"a",
					{
						href: "https://www.socratopia.app/r/SCR-FEJXMQ",
						target: "_blank",
						rel: "noopener noreferrer",
						style: {
							color: "var(--dsw-accent, #4f6ef7)",
							textDecoration: "underline",
						},
					},
					"【破卷】",
				),
				"，即可享受3A游戏的沉浸感以及三倍以上的学习效率。",
			),
		),
	);
}

// ── 上传区（Phase 1） ───────────────────────────────────────────────────────

export function UploadArea(props) {
	const { sources, converting, onUpload, onConvert, onIdentify, busy } = props;
	const [pending, setPending] = useState([]); // [{ name, file, role }]
	const [identifying, setIdentifying] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState(null);
	const dirtyRef = useRef({});

	// 选择文件（可多选）：先按文件名秒猜角色，再让 AI 精识别。
	const pick = (e) => {
		setError(null);
		const files = Array.from(e.target.files ?? []);
		e.target.value = "";
		if (files.length === 0) return;
		const seen = new Set();
		const next = pending.filter(
			(item) => !files.some((f) => f.name === item.name),
		);
		files.forEach((file) => {
			if (seen.has(file.name)) return;
			seen.add(file.name);
			next.push({ name: file.name, file, role: guessRoleFromName(file.name) });
		});
		setPending(next);
		if (next.length > 0) void identify(next);
	};

	const setRole = (name, role) => {
		dirtyRef.current[name] = true; // 用户手动改过：AI 识别结果不再覆盖
		setPending((prev) =>
			prev.map((item) => (item.name === name ? { ...item, role } : item)),
		);
	};

	// AI 识别角色：一次请求识别所有文件；失败就保留规则猜测。
	const identify = async (list) => {
		setIdentifying(true);
		try {
			const roles = await onIdentify(list.map((item) => item.name));
			const byName = new Map(roles.map((r) => [r.file, r.role]));
			setPending((prev) =>
				prev.map((item) =>
					byName.has(item.name) && !dirtyRef.current[item.name]
						? { ...item, role: byName.get(item.name) }
						: item,
				),
			);
		} catch {
			// 保持规则猜测
		} finally {
			setIdentifying(false);
		}
	};

	const uploadAll = async () => {
		if (pending.length === 0) {
			setError("请先选择 PDF 文件");
			return;
		}
		setUploading(true);
		setError(null);
		const failed = [];
		for (const item of pending) {
			// 超限直接标记失败（服务端 413 同一文案），不发起注定失败的大请求。
			if (item.file.size > MAX_UPLOAD_BYTES) {
				failed.push({
					item,
					message: uploadTooLargeMessage(),
					retryable: false,
				});
				continue;
			}
			try {
				await onUpload(item.file, item.role);
			} catch (err) {
				failed.push({
					item,
					message: String(err instanceof Error ? err.message : err),
					retryable: err?.retryable !== false,
				});
			}
		}
		if (failed.length === 0) {
			setPending([]);
			dirtyRef.current = {};
		} else {
			// 只保留失败的项：重试不重传已成功落盘的（服务端已按文件名幂等，重复传也不会再加一条）。
			const failedNames = new Set(failed.map((f) => f.item.name));
			setPending((prev) => prev.filter((i) => failedNames.has(i.name)));
			const first = failed[0];
			// 票 10（判定一 #10）：单本与多本两条分支原来说两句话（「；重试只会重传这一本」/
			// 「，将仅重试失败项」）——同一件事收敛成同一句，两条分支都用它。
			const retryHint =
				first.retryable === false ? "" : "；只会重试失败的那几本";
			const anyRetryable = failed.some((f) => f.retryable !== false);
			setError(
				failed.length === 1
					? `上传失败：${first.item.name}（${first.message}${retryHint}）`
					: `有 ${failed.length} 本上传失败（如 ${first.message}）${anyRetryable ? "；只会重试失败的那几本" : ""}`,
			);
		}
		setUploading(false);
	};

	return createElement(
		"div",
		{ style: S.focus },
		createElement(
			"strong",
			{ style: { fontSize: "14px" } },
			"① 上传教材 PDF（可一次选多本）",
		),
		createElement(
			"p",
			{ style: { margin: "4px 0 8px", fontSize: "12px", opacity: 0.7 } },
			// 票 10（判定四③）：原句 76 字压到 90 字内——删掉与上方 📁 路径行重复的「见上方 📁 路径」
			// 与「都保存在里面」这类可从"文件夹＝书名"推出来的话。
			"书文件夹建在当前工作区目录里（文件夹名＝书名），上传的 PDF 都放里面。每本是什么角色由 AI 自动识别。",
		),
		createElement("label", { style: S.label }, "选择 PDF（可多选）"),
		createElement("input", {
			type: "file",
			accept: ".pdf",
			multiple: true,
			style: S.input,
			onChange: pick,
		}),
		pending.length > 0
			? createElement(
					"div",
					{ style: { marginTop: "8px" } },
					createElement(
						"div",
						{
							style: {
								display: "flex",
								alignItems: "center",
								gap: "6px",
								marginBottom: "4px",
							},
						},
						createElement(
							"span",
							{ style: { fontSize: "12px", fontWeight: 600 } },
							`待上传 ${pending.length} 本：`,
						),
						identifying
							? createElement(
									"span",
									{ style: { fontSize: "12px", opacity: 0.7 } },
									"✨ AI 识别角色中…",
								)
							: createElement(
									"span",
									{ style: { fontSize: "12px", opacity: 0.7 } },
									"✅ 已自动识别，可下拉修改",
								),
					),
					pending.map((item) =>
						createElement(
							"div",
							{
								key: item.name,
								style: {
									display: "flex",
									gap: "8px",
									alignItems: "center",
									margin: "4px 0",
								},
							},
							createElement(
								"span",
								{
									style: {
										flex: 1,
										fontSize: "12px",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									},
								},
								item.name,
							),
							createElement(
								"select",
								{
									style: {
										...S.input,
										width: "108px",
										margin: "0",
										padding: "4px 6px",
									},
									value: item.role,
									onChange: (e) => setRole(item.name, e.target.value),
								},
								ROLES.map((role) =>
									createElement("option", { key: role, value: role }, role),
								),
							),
						),
					),
				)
			: null,
		error !== null ? createElement("p", { style: S.error }, error) : null,
		createElement(
			"div",
			{
				style: {
					marginTop: "8px",
					display: "flex",
					gap: "8px",
					alignItems: "center",
				},
			},
			createElement(
				"button",
				{
					style: { ...S.bigBtn(true), padding: "8px 14px" },
					onClick: uploadAll,
					disabled: busy || uploading || pending.length === 0,
				},
				pending.length > 0 ? `上传这 ${pending.length} 本` : "上传",
			),
		),
		sources.length > 0
			? createElement(
					"div",
					{ style: { marginTop: "8px", fontSize: "12px", opacity: 0.85 } },
					createElement(
						"div",
						{ style: { margin: "0 0 4px" } },
						`已上传 ${sources.length} 本：`,
					),
					sources.map((source) =>
						createElement(
							"div",
							{
								key: source.file,
								style: { wordBreak: "break-all", margin: "2px 0" },
							},
							`${source.converted === true ? "✅" : "⏳"} ${source.file}`,
						),
					),
				)
			: null,
		sources.length > 0
			? createElement(
					"div",
					{ style: { marginTop: "10px" } },
					createElement(
						"button",
						{
							style: S.bigBtn(true),
							onClick: onConvert,
							disabled: busy || converting,
						},
						"② 开始转换（机器自动跑）",
					),
					converting
						? createElement(
								"span",
								{ style: { marginLeft: "8px", fontSize: "12px" } },
								"转换中……",
							)
						: null,
				)
			: null,
	);
}

// ── 状态卡 / 错误卡 ─────────────────────────────────────────────────────────

export function StatusCard(props) {
	const {
		meta,
		lastEvent,
		events,
		needsConfig,
		onResume,
		busy,
		pendingStageLabel,
		progressDetail,
		// 票 stale-detection/01：状态卡不再自己算一遍停顿时长、也不再出黄色警告框与那颗按钮——
		// 这一屏唯一的出口是活性行（每个阶段都在，而状态卡只在兜底那一支才在）。
		// 它消费的**就是活性行那一份判定对象**（`src/ui/rules.js` 的 `deriveStallJudgment`）：
		// 不判停就说「🤖 我正在做 · 这一步已进行 X」，判停就只报时长。
		stall,
		onDeleteStart,
		onDeleteConfirm,
		deletingId,
	} = props;
	const [, tick] = useState(0);
	useEffect(() => {
		const timer = setInterval(() => tick((n) => n + 1), 1000);
		return () => clearInterval(timer);
	}, []);
	if (meta.status === "error") {
		// F26（2026-08-20 走查）：优先显示后端落账的人话错误（meta.lastErrorHuman，页数超限/Token 失效
		// 已归一成人话），否则回退事件消息；下方给「拆 PDF / 换一本 / 删掉重来」引导，错误含 Token
		// 关键词时补 Token 重设提示（入口见 F20 的 MinerU Token 常驻卡）。
		const rawError = lastEvent?.data?.message ?? "未知错误";
		const humanError =
			typeof meta?.lastErrorHuman === "string" && meta.lastErrorHuman !== ""
				? meta.lastErrorHuman
				: rawError;
		const isTokenIssue =
			humanError.includes("Token") || humanError.includes("token");
		return createElement(
			"div",
			{ style: { ...S.focus, borderColor: "var(--dsw-danger, #cf222e)" } },
			createElement(
				"strong",
				{ style: { color: "var(--dsw-danger, #cf222e)" } },
				"⚠️ 这一步出错了",
			),
			createElement("p", { style: { margin: "6px 0" } }, humanError),
			createElement(
				"p",
				{ style: { margin: "6px 0 0", fontSize: "13px", opacity: 0.9 } },
				// 票 10（判定一 #9）：两条上限是**两件事**——500MB 是单份上传体积上限
				// （domain-rules.MAX_UPLOAD_BYTES，前后端共用同一常量），200 页是 MinerU 单次解析的页数上限。
				// 原来这句只说页数、不说体积，用户按 200 页拆完仍可能撞 500MB。这里一并说清。
				"你可以：把 PDF 拆成几份（每份 <200 页、<500MB）后分别上传，或换一本更薄的书，或删掉这本书重新开始。",
			),
			isTokenIssue
				? createElement(
						"p",
						{ style: { margin: "4px 0 0", fontSize: "13px", opacity: 0.9 } },
						"💡 MinerU Token 可能失效，可到工作台「MinerU Token」处点「重新设置」换新 Token。",
					)
				: null,
			createElement(
				"button",
				{ style: S.bigBtn(true), onClick: onResume, disabled: busy },
				// 票 10（判定一 #8）：原来这里说「▶️ 让 AI 接着干」、活性行说「[戳一下 AI]」、
				// 状态卡说「🔁 让 AI 接着干」——同一动作三种说法，统一成这一句。
				"🔁 让 AI 接着干",
			),
			// F28（2026-08-20 走查）：上传错了给「删书重来」入口——两步确认（第一态→确认态），
			// 确认按钮只受 busy 置灰；删除后回向导可马上建一本新书。仅在父级传入删除回调时显示。
			typeof onDeleteStart === "function"
				? createElement(
						"div",
						{
							style: {
								marginTop: "8px",
								paddingTop: "8px",
								borderTop: "1px dashed var(--dsw-border, #d0d7de)",
							},
						},
						createElement(
							"p",
							{ style: { margin: "0 0 6px", fontSize: "13px", opacity: 0.9 } },
							"上传错了？可以删掉这本书重新建一本（旧书进回收站），回到向导马上就能开始新书。",
						),
						deletingId === true
							? createElement(
									"button",
									{
										style: {
											...S.smallLink,
											color: "var(--dsw-danger, #cf222e)",
										},
										onClick: onDeleteConfirm,
										disabled: busy,
									},
									"确认删除这本书（进回收站）",
								)
							: createElement(
									"button",
									{
										style: {
											...S.smallLink,
											color: "var(--dsw-danger, #cf222e)",
										},
										onClick: onDeleteStart,
									},
									"🗑 删除这本书重新建",
								),
					)
				: null,
		);
	}
	if (meta.status === "needs-config") {
		return createElement(
			"div",
			{ style: { ...S.focus, borderColor: "var(--dsw-danger, #cf222e)" } },
			createElement(
				"strong",
				{ style: { color: "var(--dsw-danger, #cf222e)" } },
				"🔑 需要先配置",
			),
			createElement("p", { style: { margin: "6px 0" } }, needsConfig),
			createElement(
				"button",
				{ style: S.bigBtn(true), onClick: onResume, disabled: busy },
				"我配好了，继续",
			),
		);
	}
	// 机器在等主 AI（交办任务）→ 优先显示任务名；否则回退到最近的机器活动。
	let label = "";
	let extra = "";
	if (typeof pendingStageLabel === "string" && pendingStageLabel !== "") {
		label = `我正在做 · ${pendingStageLabel}`;
		extra = typeof progressDetail === "string" ? progressDetail : "";
	} else if (
		lastEvent?.type === "textbook/agent-start" ||
		lastEvent?.type === "textbook/mineru-progress"
	) {
		const data = lastEvent.data ?? {};
		// 服务端 label 是机器词（源探查/铺章/设计提案·第 N 关…），过一遍界面词表；
		// 译不出来（未登记的原样返回）才原样显示——宁可露出机器词，也不猜错。
		const human = stageLabelHuman(data.label);
		if (human !== "") label = human;
		else if (
			data.stage !== undefined &&
			data.stage !== null &&
			data.stage !== ""
		) {
			label =
				data.file !== undefined && data.file !== null && data.file !== ""
					? `${data.file}：${data.stage}`
					: data.stage;
		}
	}
	// 阶段在做什么（让人放心的说明）
	const phase = meta.phase ?? 1;
	const phaseDesc = {
		2: "读材料挑重点：AI 正在通读你的教材（材料多时会派小助手分头读），整理成材料索引",
		3: "拍板定方案：AI 正在起草设计方案（已经拍过板的会自动跳过）",
		4: "最佳范例章：AI 正在写第 1 章给你看效果",
		5: "写完整本：小助手执笔 + 小助手检查 + AI 复核，逐章推进",
		6: "最后检查：AI 亲自做最后检查 + 机器兜底",
	}[phase];

	// 写章进度（phase 5）：已完章数 / 总章数——**口径与过目闸门、章节卡同源**（票 14）：
	// 章级「交工通过」事件（含最佳范例章那一步）且该章没有未处置意见。
	// ⚠️ 不再按 label 里有没有「完成（小助手执笔」这类字形数（那是第二份口径，会与章节卡打架）；
	// 未处置意见取自 meta.pendingReviews（服务端随 /textbook/events 下发的那一份）。
	let chapterProgress = null;
	if (phase === 5) {
		const chapters = meta.outline?.chapters ?? [];
		const total = chapters.length;
		if (total > 0) {
			const doneSet = deriveDoneSet(events ?? [], goldChapterNo(meta));
			const reviews = meta.pendingReviews ?? [];
			const done = chapters.filter(
				(_chapter, index) =>
					doneSet.has(index + 1) &&
					!hasPendingReview(reviews, index + 1),
			).length;
			chapterProgress = { done: Math.min(done, total), total };
		}
	}
	// 计时（F47，2026-08-23 口径；票 stale-detection/01 收敛）：
	//  - 计时按「这一步自己的开始时间」算：最近一条步骤开始事件（stage-start / agent-start）
	//    的时间就是这一步起点，期间不断发 progress/进度事件不会把计时清零、也不会串到上一步。
	//  - 说「我正在做」还是只说时长，由**同一份判定**（`stalled`，归 `deriveStallJudgment`）决定；
	//    这里不再自己算一遍停顿时长、也不再出警告框——那两样已归活性行（这一屏唯一的出口）。
	//  - 格式与停顿时长共用 `humanDuration`（精度到分钟，不显示秒）。
	//  - 只显示一行计时（🤖 / ⏱ 二选一），不再和「AI 正在干活」重复各显一行。
	const stepStart = (() => {
		const list = events ?? [];
		for (let i = list.length - 1; i >= 0; i--) {
			const type = list[i]?.type;
			if (type === "textbook/stage-start" || type === "textbook/agent-start")
				return list[i]?.time;
		}
		return null;
	})();
	const lastTime = lastEvent?.time ?? meta.updatedAt ?? Date.now();
	const stepElapsedMs = Math.max(0, Date.now() - (stepStart ?? lastTime));
	const stalled = (stall ?? {}).stalled === true;
	return createElement(
		"div",
		{ style: S.focus },
		createElement(
			"strong",
			{ style: { fontSize: "14px" } },
			`⏳ ${label || "准备中…"}`,
		),
		extra !== ""
			? createElement(
					"p",
					{ style: { margin: "6px 0 0", opacity: 0.9 } },
					`⏳ ${extra}`,
				)
			: null,
		phaseDesc !== undefined
			? createElement(
					"p",
					{ style: { margin: "6px 0 0", opacity: 0.85 } },
					`📌 ${phaseDesc}`,
				)
			: null,
		chapterProgress !== null
			? createElement(
					"div",
					{ style: { marginTop: "10px" } },
					createElement(
						"div",
						{
							style: {
								display: "flex",
								justifyContent: "space-between",
								fontSize: "12px",
								marginBottom: "4px",
							},
						},
						createElement("span", { style: { opacity: 0.8 } }, "章节写作进度"),
						createElement(
							"span",
							{ style: { opacity: 0.8 } },
							`已完成 ${chapterProgress.done}/${chapterProgress.total} 章`,
						),
					),
					createElement(
						"div",
						{
							style: {
								height: "8px",
								borderRadius: "4px",
								background: "var(--dsw-border, #d0d7de)",
								overflow: "hidden",
							},
						},
						createElement("div", {
							style: {
								height: "100%",
								width: `${Math.round((chapterProgress.done / chapterProgress.total) * 100)}%`,
								background: "var(--dsw-accent, #4f6ef7)",
								borderRadius: "4px",
								transition: "width 0.6s",
							},
						}),
					),
				)
			: null,
		createElement(
			"p",
			{
				style: {
					margin: "6px 0 0",
					fontSize: "12px",
					opacity: stalled ? 0.7 : 0.85,
				},
			},
			// 票 stale-detection/01：这一行照常显示（计时只显示一行），判停时只报时长、不下诊断；
			// 「好一会儿没动静了」那句话与那颗「从断点继续」的按钮归顶上的活性行。
			stalled
				? `⏱ 这一步已进行 ${humanDuration(stepElapsedMs)}`
				: `🤖 我正在做 · 这一步已进行 ${humanDuration(stepElapsedMs)}`,
		),
		createElement(
			"p",
			{ style: { margin: "6px 0 0", opacity: 0.8 } },
			// 票 10（判定四④）：阶段说明（上面 phaseDesc 一句）已经说清"这一步在干什么"，
			// 这句泛泛脚注再讲一遍就是同构重复——压到只留「怎么找它」这一条独有信息。
			"AI 可能亲自做，也可能派一批小助手并行干；要拍板时会亮 ⚡。",
		),
	);
}

// ── 交付卡 ──────────────────────────────────────────────────────────────────

export function DeliveryCard(props) {
	const {
		project,
		session,
		checks,
		onPreview,
		busy,
		meta,
		aiReport,
		styleNotes,
	} = props;
	const bookName = (meta?.name ?? "").trim() || "BOOK";
	// 邀请码可点复制（与步清单同款实现，2026-09）。
	const [copied, setCopied] = useState(false);
	const copyInvite = (e, code) => {
		e.preventDefault();
		e.stopPropagation();
		const done = () => {
			setCopied(true);
			setTimeout(() => setCopied(false), 1600);
		};
		const fallback = () => {
			try {
				const ta = document.createElement("textarea");
				ta.value = code;
				ta.style.position = "fixed";
				ta.style.opacity = "0";
				document.body.appendChild(ta);
				ta.select();
				document.execCommand("copy");
				document.body.removeChild(ta);
				done();
			} catch {
				/* 老浏览器降级：无操作 */
			}
		};
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(code).then(done, fallback);
		} else {
			fallback();
		}
	};
	return createElement(
		"div",
		{ style: S.focus },
		createElement("strong", { style: { fontSize: "14px" } }, "🎉 书做好了！"),
		aiReport !== null && aiReport !== undefined && aiReport !== ""
			? createElement(
					"div",
					{
						style: {
							margin: "10px 0",
							padding: "8px 10px",
							background: "var(--dsw-accent-soft, #eef2ff)",
							borderRadius: "8px",
							fontSize: "12px",
						},
					},
					createElement("strong", null, "🤖 AI 检查说的："),
					createElement(
						"p",
						{ style: { margin: "4px 0 0", whiteSpace: "pre-wrap" } },
						aiReport,
					),
				)
			: null,
		createElement(MachineChecks, { checks }),
		(styleNotes ?? []).length > 0
			? createElement(
					"div",
					{
						style: {
							margin: "10px 0",
							padding: "8px 10px",
							borderRadius: "8px",
							border: "1px solid var(--dsw-border, #d0d7de)",
						},
					},
					createElement(
						"p",
						{ style: { margin: "0 0 6px", fontWeight: 600 } },
						"🎨 你的风格线条条有着落",
					),
					...(styleNotes ?? []).map((note, index) =>
						createElement(
							"div",
							{
								key: note.id ?? index,
								style: { fontSize: "12px", margin: "3px 0" },
							},
							`${note.status === "superseded" ? "·（已收回）" : note.status === "conflict" ? "·（与设计冲突，理由见备注）" : "·"}${note.text}`,
							note.note
								? createElement(
										"span",
										{ style: { opacity: 0.6 } },
										` -- ${note.note}`,
									)
								: null,
						),
					),
				)
			: null,
		createElement(
			"p",
			{ style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
			"AI 亲手做完最后检查，机器也兜底验过；仍建议先让老师/家长复核一遍再用。",
		),
		createElement(
			"div",
			{ style: { display: "flex", gap: "10px", margin: "10px 0" } },
			createElement(
				"button",
				// 批 3 视觉权重：交付屏的"主操作"是下载（用户要的是那本书），预览是次级的。
				// 票 03：预览改成在 DSH 右栏打开成品——卡片里不再灌整本 <pre>，故没有「收起」态。
				{ style: S.ghostBtn(false), onClick: onPreview, disabled: busy },
				// 票 10（判定一 #13）：与终检认可卡统一——同一份 `work/book.md`，名字用产物词表的
				// 「成书」（票 05），动词只有「打开」。
				"👀 打开成书",
			),
			createElement(
				"a",
				{
					style: {
						...S.bigBtn(true),
						textDecoration: "none",
						display: "inline-block",
					},
					href: `/textbook/download?session=${encodeURIComponent(session)}&project=${encodeURIComponent(project)}&path=work/book.md`,
				},
				`⬇️ 下载《${bookName}》.md`,
			),
		),
		createElement(
			"div",
			{ style: { margin: "8px 0 0", opacity: 0.8 } },
			createElement(
				"p",
				{ style: { margin: "0 0 4px", fontWeight: 600 } },
				"💡 这本书怎么用",
			),
			createElement(
				"div",
				{ style: { display: "flex", margin: "0 0 4px" } },
				createElement(
					"span",
					{
						style: {
							flexShrink: 0,
							width: "112px",
							display: "flex",
							justifyContent: "space-between",
							alignItems: "baseline",
						},
					},
					createElement("span", null, "给 AI 老师上课"),
					createElement("span", null, "→"),
				),
				createElement(
					"span",
					{ style: { minWidth: 0 } },
					`把下载的《${bookName}》.md 交给`,
					createElement(
						"a",
						{
							href: "https://www.socratopia.app/r/SCR-FEJXMQ",
							target: "_blank",
							rel: "noopener noreferrer",
							style: {
								color: "var(--dsw-accent, #4f6ef7)",
								textDecoration: "underline",
							},
						},
						"【破卷】",
					),
					"当教材来学。【建议】",
				),
			),
			createElement(
				"div",
				{ style: { display: "flex", margin: "0 0 4px" } },
				createElement(
					"span",
					{
						style: {
							flexShrink: 0,
							width: "112px",
							display: "flex",
							justifyContent: "space-between",
							alignItems: "baseline",
						},
					},
					createElement("span", null, "给人读"),
					createElement("span", null, "→"),
				),
				createElement(
					"span",
					{ style: { minWidth: 0 } },
					// 票 10（判定四①）：卡上那句已经说了「仍建议先让老师/家长复核一遍再用」，
					// 这一行再说一遍就是同屏两行同话——只留「直接阅读或打印」。
					"直接阅读或打印。",
				),
			),
			createElement(
				"p",
				{ style: { margin: "0" } },
				"如果本项目对你有帮助，欢迎填写邀请码：",
				createElement(
					"span",
					{
						onClick: (e) => copyInvite(e, "SCR-FEJXMQ"),
						title: copied ? "已复制" : "点击复制邀请码",
						style: {
							background: "var(--dsw-accent-soft, #eef2ff)",
							borderRadius: "4px",
							padding: "1px 6px",
							letterSpacing: "0.5px",
							cursor: "pointer",
							userSelect: "all",
							color: "var(--dsw-accent, #4f6ef7)",
						},
					},
					copied ? "✓ 已复制" : "SCR-FEJXMQ",
				),
				"，可免费领取 100 万 tokens，官方造书全场免费学（第三方活动，以对方规则为准）。",
			),
		),
	);
}

// ── 终检结果认可卡（2026-08-26 用户拍板：终检 = AI 对全书整体调整 + 用户对整体的最终认可） ──

export function FinalApprovalCard(props) {
	const {
		checks,
		onPreview,
		busy,
		aiReport,
		styleNotes,
		onApprove,
		onReject,
	} = props;
	const [note, setNote] = useState("");
	// 批 3：把「不满意」从「看着能点却点不动」改成「点了告诉你为什么还不能走」。
	const noteRef = useRef(null);
	const [needNote, setNeedNote] = useState(false);
	return createElement(
		"div",
		{ style: S.focus },
		createElement("strong", { style: { fontSize: "14px" } }, "🛡️ 最后检查完成，等你对整本书把关"),
		aiReport !== null && aiReport !== undefined && aiReport !== ""
			? createElement(
					"div",
					{
						style: {
							margin: "10px 0",
							padding: "8px 10px",
							background: "var(--dsw-accent-soft, #eef2ff)",
							borderRadius: "8px",
							fontSize: "12px",
						},
					},
					createElement("strong", null, "🤖 AI 检查说的："),
					createElement(
						"p",
						{ style: { margin: "4px 0 0", whiteSpace: "pre-wrap" } },
						aiReport,
					),
				)
			: null,
		// 票 20：没过的检查项各给一个「让 AI 按这条去改」入口——指令由机器按该项 note 起草，
		// 点一下即走既有的「不满意，让 AI 改」同一条回路（final-approve approved:false + note），
		// 不新开通道。交付卡不传 onFix：交付时清单必然全过，那里没有可改的项。
		createElement(MachineChecks, {
			checks,
			onFix: (check) => onReject(draftFixInstruction(check)),
			fixDisabled: busy,
		}),
		(styleNotes ?? []).length > 0
			? createElement(
					"div",
					{
						style: {
							margin: "10px 0",
							padding: "8px 10px",
							borderRadius: "8px",
							border: "1px solid var(--dsw-border, #d0d7de)",
						},
					},
					createElement(
						"p",
						{ style: { margin: "0 0 6px", fontWeight: 600 } },
						"🎨 你的风格线条条有着落",
					),
					...(styleNotes ?? []).map((note, index) =>
						createElement(
							"div",
							{
								key: note.id ?? index,
								style: { fontSize: "12px", margin: "3px 0" },
							},
							`${note.status === "superseded" ? "·（已收回）" : note.status === "conflict" ? "·（与设计冲突，理由见备注）" : "·"}${note.text}`,
							note.note
								? createElement(
										"span",
										{ style: { opacity: 0.6 } },
										` -- ${note.note}`,
									)
								: null,
						),
					),
				)
			: null,
		createElement(
			"p",
			{ style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
			// 票 10（判定四③）：原句 79 字压到 90 字内——「AI 已整体调整过、机器也兜底验过」与
			// 上面那句（交付卡同款）重复，删掉；保留"这是最后一次把关"与两条出路。
			"这是你对整本书的最后一次把关：满意就认可交付；要改的写一句意见，AI 会照着改整本后重新做最后检查。",
		),
		createElement(
			"textarea",
			{
				ref: noteRef,
				style: {
					width: "100%",
					minHeight: "64px",
					padding: "8px",
					borderRadius: "8px",
					border: needNote
						? "1px solid var(--dsw-danger, #cf222e)"
						: "1px solid var(--dsw-border, #d0d7de)",
					fontSize: "13px",
					boxSizing: "border-box",
				},
				placeholder: "不满意的话，在这里写一句要改什么（写了才能点「不满意」）…",
				value: note,
				onChange: (e) => {
					setNote(e.target.value);
					if (e.target.value.trim() !== "") setNeedNote(false);
				},
			},
		),
		needNote
			? createElement(
					"p",
					{
						style: {
							margin: "6px 0 0",
							fontSize: "12px",
							color: "var(--dsw-danger, #cf222e)",
						},
					},
					"⚠️ 先在上面写一句「要改什么」，再点「不满意」——AI 得照着你这句话改整本。",
				)
			: null,
		createElement(
			"div",
			{ style: { display: "flex", gap: "10px", margin: "10px 0" } },
			createElement(
				"button",
				// 票 03：成品在 DSH 右栏预览（卡片里不再灌整本 <pre>，故无「收起」态）。
				{ style: S.ghostBtn(false), onClick: onPreview, disabled: busy },
				// 票 10（判定一 #13）：与交付卡同一份成品、同一个名字（「成书」）。
				"👀 打开成书",
			),
			createElement(
				"button",
				{
					// 2026-09-20 批 3：三键同权 → 主操作（认可）填色、其余描边。
					// 「不满意」原来在没写意见时直接 disabled，看着能点却点不动；现在让它永远可点，
					// 点了把光标送进输入框并说明原因（后端契约：approved=false 必须带 note）。
					style: { ...S.ghostBtn(true), marginRight: "auto" },
					onClick: () => {
						if (note.trim() === "") {
							setNeedNote(true);
							// 无 DOM 的测试渲染器里 ref.current 没有 focus 方法，防御一下。
							if (typeof noteRef.current?.focus === "function")
								noteRef.current.focus();
							return;
						}
						onReject(note);
					},
					disabled: busy,
					title: "要先写一句改进意见（AI 照着改整本）",
				},
				"❌ 不满意，让 AI 改",
			),
			createElement(
				"button",
				{ style: S.bigBtn(true), onClick: () => onApprove(), disabled: busy },
				"✅ 认可，交付",
			),
		),
	);
}

// ── 关卡卡 ──────────────────────────────────────────────────────────────────

const REASONS = [
	"讲得太深了",
	"讲得太浅了",
	"不是我要的重点",
	"和别的部分重复",
	"换个风格",
];

// 2026-08-21：组装「驳回」提交体——勾选「换个风格」且粘贴了目标文本时，
// 把文本附进 note 交办给 AI（修订时照着改），并保留 reasons 里的「换个风格」。
export function rejectPayload(mode, reasons, note, styleText) {
	const style = (reasons ?? []).includes("换个风格")
		? String(styleText ?? "").trim()
		: "";
	const extraNote = style !== "" ? `\n【你想换的风格/写法】\n${style}` : "";
	return {
		approved: false,
		mode,
		reasons: reasons ?? [],
		note: `${String(note ?? "")}${extraNote}`.trim(),
	};
}

export function GatePanel(props) {
	const { gate, onDecide, onRollback, busy, error, onAddPattern } = props;
	// 2026-08-21 需求：完整方案默认展开展示（用户拍板前先看全），仍可点「收起完整方案」折叠。
	const [showDetail, setShowDetail] = useState(true);
	const [showCompare, setShowCompare] = useState(false);
	const [rejecting, setRejecting] = useState(false);
	const [mode, setMode] = useState("wrong");
	const [reasons, setReasons] = useState([]);
	const [note, setNote] = useState("");
	// 2026-08-21：勾选「换个风格」时出现的粘贴窗口（目标文本 → 本书自定义模式）。
	const [styleText, setStyleText] = useState("");
	// 回退是重操作（会把状态拉回上一个拍板点、重做后续推进）：先确认再执行（A3 快赢）。
	const [confirmRollback, setConfirmRollback] = useState(false);
	const rollbackConfirm = () =>
		createElement(
			"div",
			{
				style: {
					marginTop: "10px",
					borderTop: "1px dashed var(--dsw-border, #d0d7de)",
					paddingTop: "8px",
				},
			},
			createElement(
				"p",
				{ style: { margin: "0 0 6px", fontWeight: 600 } },
				"⏪ 回退到最近一次存档？",
			),
			createElement(
				"p",
				{
					style: {
						margin: "0 0 6px",
						fontSize: "12px",
						color: "var(--dsw-danger, #cf222e)",
					},
				},
				"这一步之后新推进的部分会被重做；回退前会先存一版，之后还能再回退。",
			),
			createElement(
				"div",
				{ style: { display: "flex", gap: "8px" } },
				createElement(
					"button",
					{
						style: { ...S.bigBtn(false), padding: "6px 14px" },
						onClick: () => {
							setConfirmRollback(false);
							onRollback();
						},
						disabled: busy,
					},
					"确认回退",
				),
				createElement(
					"button",
					{ style: S.smallLink, onClick: () => setConfirmRollback(false) },
					"取消",
				),
			),
		);

	if (gate === null) return null;

	if (gate.status !== "awaiting") {
		const decided = gate.status === "approved";
		return createElement(
			"div",
			{ style: S.focus },
			createElement(
				"strong",
				null,
				decided
					? `✅ ${gateHuman(gate.gate)}已通过（v${gate.version}）`
					: `↩️ ${gateHuman(gate.gate)}已驳回（v${gate.version}），等 AI 修订`,
			),
			decided
				? createElement(
						"p",
						{ style: { margin: "6px 0 0", opacity: 0.8 } },
						"之后想改：可回退到最近一次存档；要改更早的决定，等 AI 停手（或先 ⏸ 暂停）后展开上面的步清单点那一步，用「定点修改」。",
					)
				: createElement(
						"p",
						{ style: { margin: "6px 0 0", opacity: 0.8 } },
						"AI 正在按你的意见修改，新版提案会出现在这里。",
					),
			createElement(
				"div",
				{ style: { marginTop: "8px" } },
				createElement(
					"button",
					{
						// 同上：回退做轻（灰色小链接），别和主操作抢眼。
						style: { ...S.smallLink, color: "inherit", opacity: 0.7 },
						onClick: () => setConfirmRollback(true),
						disabled: busy,
					},
					"⏪ 回退到最近一次存档",
				),
				confirmRollback ? rollbackConfirm() : null,
			),
		);
	}

	const toggleReason = (reason) => {
		setReasons((prev) =>
			prev.includes(reason)
				? prev.filter((item) => item !== reason)
				: [...prev, reason],
		);
	};

	// 2026-08-21：勾「换个风格」+ 粘贴目标文本 → 后台分析成自定义模式 + 文本并入驳回 note。
	const submitReject = () => {
		const hasStyle = (reasons ?? []).includes("换个风格");
		const style = hasStyle ? styleText.trim() : "";
		if (hasStyle && style !== "" && typeof onAddPattern === "function") {
			void onAddPattern(style).catch(() => {});
		}
		onDecide(rejectPayload(mode, reasons, note, styleText));
	};

	return createElement(
		"div",
		{ style: S.focus },
		createElement(
			"div",
			null,
			createElement(
				"strong",
				{ style: { fontSize: "14px" } },
				`🚦 ${gateHuman(gate.gate)} · 方案 v${gate.version}`,
			),
			createElement(
				"span",
				{ style: { float: "right", opacity: 0.6, fontSize: "12px" } },
				"这一步你定了，流程才继续",
			),
		),
		createElement("p", { style: { margin: "10px 0 6px" } }, gate.title),
		createElement(
			"p",
			{ style: { margin: "0 0 6px", opacity: 0.9, lineHeight: 1.6 } },
			gate.summary,
		),
		createElement(
			"div",
			{ style: { margin: "6px 0" } },
			createElement(
				"button",
				{ style: S.smallLink, onClick: () => setShowDetail(!showDetail) },
				showDetail ? "收起完整方案" : "展开完整方案",
			),
			gate.prevProposal !== null
				? createElement(
						"span",
						null,
						"　",
						createElement(
							"button",
							{
								style: S.smallLink,
								onClick: () => setShowCompare(!showCompare),
							},
							showCompare
								? "收起对比"
								: `对比上一版（v${gate.prevProposal.version}）`,
						),
					)
				: null,
		),
		showDetail && (gate.detail ?? "") !== ""
			? createElement(
					"pre",
					{
						style: {
							whiteSpace: "pre-wrap",
							background: "var(--dsw-surface, #fff)",
							borderRadius: "8px",
							padding: "10px",
							fontSize: "12px",
							opacity: 0.9,
							maxHeight: "260px",
							overflow: "auto",
						},
					},
					gate.detail,
				)
			: null,
		showCompare && gate.prevProposal !== null
			? createElement(
					"div",
					{
						style: {
							background: "var(--dsw-surface, #fff)",
							borderRadius: "8px",
							padding: "10px",
							fontSize: "12px",
							opacity: 0.9,
						},
					},
					createElement(
						"strong",
						null,
						`上一版 v${gate.prevProposal.version}：`,
					),
					createElement(
						"p",
						{ style: { margin: "4px 0 0" } },
						gate.prevProposal.summary,
					),
				)
			: null,
		error !== null ? createElement("p", { style: S.error }, error) : null,
		rejecting
			? createElement(
					"div",
					{
						style: {
							marginTop: "10px",
							borderTop: "1px dashed var(--dsw-border, #d0d7de)",
							paddingTop: "8px",
						},
					},
					createElement(
						"p",
						{ style: { margin: "0 0 6px", fontWeight: 600 } },
						"驳回原因（选一个，不必打字）",
					),
					createElement(
						"div",
						{ style: { margin: "8px 0" } },
						createElement(
							"label",
							{ style: { display: "block", margin: "4px 0" } },
							createElement("input", {
								type: "radio",
								name: "mode",
								checked: mode === "wrong",
								onChange: () => setMode("wrong"),
							}),
							" 方案不对 —— AI 重做一版",
						),
						createElement(
							"label",
							{ style: { display: "block", margin: "4px 0" } },
							createElement("input", {
								type: "radio",
								name: "mode",
								checked: mode === "confused",
								onChange: () => setMode("confused"),
							}),
							" 我看不懂 / 不是我要的 —— AI 换人话重讲、给例子",
						),
					),
					createElement(
						"p",
						{ style: { margin: "6px 0 4px", fontWeight: 600 } },
						"具体哪里不满意（可多选）",
					),
					REASONS.map((reason) =>
						createElement(
							"label",
							{ key: reason, style: S.checkItem },
							createElement("input", {
								type: "checkbox",
								checked: reasons.includes(reason),
								onChange: () => toggleReason(reason),
							}),
							` ${reason}`,
						),
					),
					// 2026-08-21：勾选「换个风格」→ 弹出粘贴窗口，目标文本由 AI 分析成这本书的自定义模式。
					reasons.includes("换个风格")
						? createElement(
								"div",
								{ style: { marginTop: "4px" } },
								createElement(
									"p",
									{
										style: {
											margin: "0 0 4px",
											fontSize: "12px",
											opacity: 0.8,
										},
									},
									"把你想要的风格/写法粘贴进来，AI 会把它记成这本书的自定义模式，修订时照着改：",
								),
								createElement("textarea", {
									style: {
										...S.textarea,
										borderColor: "var(--dsw-accent, #4f6ef7)",
									},
									placeholder:
										"例：每个知识点先给一个生活中的真实场景引出概念，再配一道由浅入深的例题……",
									value: styleText,
									onChange: (e) => setStyleText(e.target.value),
								}),
							)
						: null,
					createElement("textarea", {
						style: S.textarea,
						placeholder: "想多说一句？在这里写（可选）",
						value: note,
						onChange: (e) => setNote(e.target.value),
					}),
					createElement(
						"div",
						{ style: { marginTop: "8px", display: "flex", gap: "8px" } },
						createElement(
							"button",
							{ style: S.bigBtn(false), onClick: submitReject, disabled: busy },
							"提交驳回",
						),
						createElement(
							"button",
							{
								style: { ...S.smallLink, textDecoration: "none" },
								onClick: () => {
									setRejecting(false);
									setStyleText("");
								},
							},
							"取消",
						),
					),
				)
			: createElement(
					"div",
					{ style: { marginTop: "12px", display: "flex", gap: "10px" } },
					createElement(
						"button",
						{
							style: S.bigBtn(true),
							onClick: () => onDecide({ approved: true }),
							disabled: busy,
						},
						"✅ 通过，继续",
					),
					createElement(
						"button",
						{
							// 批 3：原来「驳回」是整块红实心，和「通过」一样重；改成描边，
							// 让主操作（通过）是唯一填色的那个。
							style: S.ghostBtn(true),
							onClick: () => setRejecting(true),
							disabled: busy,
						},
						"❌ 驳回，提意见",
					),
				),
		createElement(
			"div",
			{ style: { marginTop: "10px" } },
			createElement(
				"button",
				{
					// 批 3 视觉权重三档：通过＝填色（主）、驳回＝描边（次）、回退＝灰色小链接（末）。
					// 原来回退是红描边按钮，和驳回抢眼；回退本身还有二次确认，做轻不会误触。
					style: { ...S.smallLink, color: "inherit", opacity: 0.7 },
					onClick: () => setConfirmRollback(true),
					disabled: busy,
				},
				"⏪ 回退到最近一次存档",
			),
			confirmRollback ? rollbackConfirm() : null,
		),
	);
}

// ── MinerU Token 常驻入口（F20）─────────────────────────────────────────────
// 未设置（mineruSet=false）：原「还差一步」输入卡，现状不变；
// 已设置：常驻显示掩码（••••）+「重新设置」入口，点开（resetOpen）才展开输入框；
// 保存走父级 onSave（既有 settings 动作，后端支持覆盖），保存成功后父级关回掩码态。
export function MineruTokenCard(props) {
	const {
		mineruSet,
		mineruToken,
		busy,
		onTokenChange,
		onSave,
		resetOpen,
		onToggleReset,
	} = props;
	if (mineruSet === false) {
		return createElement(
			"div",
			{ style: { ...S.card, borderColor: "var(--dsw-danger, #cf222e)" } },
			createElement(
				"strong",
				{ style: { color: "var(--dsw-danger, #cf222e)" } },
				"🔑 还差一步：MinerU Token",
			),
			createElement(
				"p",
				{ style: { margin: "4px 0" } },
				"PDF 转换需要 MinerU 的 Token（在 mineru.net 申请；免费额度以对方规则为准）。填在这里即可：",
			),
			createElement("input", {
				style: S.input,
				placeholder: "粘贴 MinerU Token",
				value: mineruToken,
				onChange: onTokenChange,
			}),
			createElement(
				"button",
				{ style: S.bigBtn(true), onClick: onSave, disabled: busy },
				"保存 Token",
			),
		);
	}
	return createElement(
		"div",
		{ style: { ...S.card, borderColor: "var(--dsw-success, #1a7f37)" } },
		createElement(
			"div",
			{
				style: {
					display: "flex",
					gap: "10px",
					alignItems: "center",
					flexWrap: "wrap",
				},
			},
			createElement("strong", {}, "✅ MinerU Token 已设置（••••）"),
			createElement(
				"button",
				{ style: S.smallLink, onClick: onToggleReset },
				"重新设置",
			),
		),
		resetOpen
			? createElement(
					"div",
					{ style: { marginTop: "6px" } },
					createElement(
						"p",
						{ style: { margin: "4px 0" } },
						"填新的 Token 即可覆盖旧的：",
					),
					createElement("input", {
						style: S.input,
						placeholder: "粘贴新的 MinerU Token",
						value: mineruToken,
						onChange: onTokenChange,
					}),
					createElement(
						"button",
						{ style: S.bigBtn(true), onClick: onSave, disabled: busy },
						"保存新 Token",
					),
				)
			: null,
	);
}
