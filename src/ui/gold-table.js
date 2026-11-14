/**
 * 造书工作台 · 谈判桌（最佳范例章 · 风格谈判）
 *
 * Gold 系列组件：意见单、阅读与标记（段旁三键 + 笼统便签）、稿间内联对比、
 * 定稿沉淀、总装（稿页签 + 读/对比 + 意见单 + 定稿区）。
 */

import { createElement, useEffect, useState } from "react";
import { defineCardView } from "./card-view.js";
import { S } from "./styles.js";
// 票 `ui-display-redesign/07`：两屏的卡头问句＋派生事实句复用票 01 落的共用卡头行小件。
// ⚠️ 问句那一行必须在本文件里用 `<strong>` 字面量构造好再传进去（理由见 `card-head.js` 文件头：
// `test-context-vocabulary` 的焦点区卡标题取证面只认卡片自己文件里的 `<strong>` 字面量）。
import { CardHead, CARD_HEAD_QUESTION_STYLE } from "./card-head.js";
import {
	splitParagraphs,
	paragraphHint,
	diffParagraphs,
	REVIEW_REVOKED_TEXT,
	// 票 02：意见 kind 词的**唯一一份**正名在 `rules.js`——谈判桌与章节卡说同一件事，不各写一份
	// （此前这里逐字抄了一份，与 `rules.js` 的 `REVIEW_KIND_TEXT` 恒等）。
	REVIEW_KIND_TEXT,
	// 票 `ui-systematic-fixes/02`：兜底方向只在一处决定（spec §2）——意见 kind／状态两张表都走它。
	fallbackWord,
} from "./rules.js";
import { chapterRel, goldChapterNo } from "../domain-rules.js";
// 票 `audit-gate-semantics/01`：审计结论的**唯一计算**（issues 的 level＋status 现算）。
// 徽章与卡头事实句都读它，⛔ 不在这里再判一次 `audit.passed`（那份自报值机器不采信）。
import { auditVerdict } from "../audit-semantics.js";
import { READER_PARA_STYLE, renderInline } from "./md-render.js";
// 票 `demo-channel-full/25`：段落三键确认层那句「这一下会发生什么」的**两个取值**收在 view-rules
// （唯一出口），本文件只渲染它、⛔ 不自己拼措辞。`GoldReader` 因此要吃 `meta`（两个宿主
// ——谈判桌 `GoldTable` 与过目态章节卡 `ChaptersCard`——手上都有 `meta`，各传一次）。
import { paraMarkConfirmNote, goldRewriteHint, goldRewriteConfirmNote } from "./view-rules.js";

// ── 谈判桌·意见单 ───────────────────────────────────────────────────────────

/**
 * 意见状态 → 界面词（**唯一一份**）。键＝机器状态值（`pending`／`sent`／`applied`／`revoked`，
 * 由本仓代码产生 ⇒ **闭集**）；未登记的一档**不印**（`fallbackWord` 的缺省方向，spec §2）。
 *
 * 导出只为判据（G3 逐表枚举）能直调这张表——⛔ 不是给调用点绕过 `opinionStatusText` 的入口。
 */
export const OPINION_STATUS_TEXT = {
	pending: "待处理",
	sent: "AI 修订中",
	applied: "AI 已改",
	// 票 09：`revoked` 一个状态在界面上**只此一种说法**（`CONTEXT.md`「撤回（意见）」的正名）。
	// 取词走 `rules.js` 那一个出口，不在本文件另写一份（此前意见单与章节卡各写了一份同义说法）。
	revoked: REVIEW_REVOKED_TEXT,
};

/**
 * 一条 `sent` 意见在**第 N 稿已经回到盘上、还没交工**时的那句话（票 `walkthrough-2026-10/04`，B6）。
 *
 * 病（票面 :22-:23）：`sent → applied` 的**唯一**写回点在交工那一刻
 * （`actions/chapters.js` 的 `stage-submit gold`：`if (o.status === 'sent') o.status = 'applied'`），
 * 所以「第 2 稿已经交付、按钮区已经回到等我」时，标签**必然**停在「AI 修订中」——AI 明明已经
 * 交回稿了，屏上还在说它在改（走查 B6）。
 *
 * 前置条件就是那份事实：**这一稿在不在盘上**。
 *   · 不在盘上（AI 真在改：`gold-revise` 会先把旧稿归档挪走）⇒ 照旧「AI 修订中」；
 *   · 已在盘上（改完了、只差交工/定稿）⇒ 「已交付·待定稿」。
 * 裁决甲的原话：**`sent` 这个标签只在 AI 真在改时出现**。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：判据只有「读到了这一稿的正文」这一位（`draftLanded`），
 * 它**不区分**「AI 还在改」与「正文读不到」——两种都落回旧词「AI 修订中」。宁可退回旧词，
 * 也不把读不到当成已交付（那是替一件没看见的事作证）。
 * ⚠️ 这张卡今天**只在 `awaiting-gold` 上屏**（`focusCardKey`），所以生产上走得通的是
 * 「已交付·待定稿」那一支；旧词那一支留在函数里，供 `status: running` 的旧快照与直调断言。
 */
export const DELIVERED_AWAITING_SEAL_TEXT = "已交付·待定稿";

/**
 * 意见单里那一条的**状态词**（唯一出口）。
 *
 * @param {string} status `pending`／`sent`／`applied`／`revoked`
 * @param {{ draftLanded?: boolean }} [facts] `draftLanded`＝这一稿的正文已经在盘上
 */
export function opinionStatusText(status, { draftLanded = false } = {}) {
	if (status === "sent" && draftLanded === true) return DELIVERED_AWAITING_SEAL_TEXT;
	// 票 `ui-systematic-fixes/02`：闭集未登记 ⇒ `null`＝不印（不再是 `?? status` 那种原样露值）。
	return fallbackWord(OPINION_STATUS_TEXT, status);
}

/**
 * 展示期里、有意见躺在「待处理」时那句提示（唯一出口）——票 `gold-display-period/01`。
 *
 * 病：`gold-opinion` 提交后**只是落盘排队**（`meta.goldOpinions` 追加 `status:'pending'`），
 * 而消费它的那一轮**已经定死了**——正在跑的那一轮检查读不到它（审计的必读矩阵里没有意见通道，
 * 见 `resources/references/subagent-prompts/gold-audit-prompt.md`），正在跑的主笔 AI 也读不到它
 * （意见透给 AI 的唯一出口是 brief 构造时刻，`workflow/engine.js` 的 `brief.goldOpinions`）。
 * 界面却把「提意见」画成一个当即生效的动作，而提完之后屏上**什么解释都没有**（原式在
 * `pending > 0` 时返回 `null`）——用户以为有人接了。
 *
 * 措辞里那句「等检查收工就能点这颗键」不是客套：那颗键此刻**正禁着**（票 `.../02` 的展示期闸），
 * 所以这句话必须说成「等」，不能说成「点」。
 */
export const DISPLAY_PERIOD_PENDING_HINT =
	"记下了；这一轮检查不会读这些意见，等检查收工就能点这颗键让 AI 照它们改";

/**
 * 意见全是 `applied` 时那句提示（票 `pre-gold-build/08` 的承诺面③）——**唯一出口**。
 *
 * ── 病（依据 `.scratch/pre-gold-processes/spec.md` 债-25，弱候选）──────────────────
 * **承诺面**：界面文案（给用户）。原句是「这些意见这一稿**都改过了**」。
 * **实现面今天判什么**：这一屏的 `applied` 只有**一个**机器写入点——`stage-submit gold` 那一刻把
 * 本轮交办出去的那批**整批翻转**（`actions/chapters.js`：`for (const o of state.goldOpinions)
 * if (o.status === 'sent') o.status = 'applied'`；演示通道同形在 `engine.js` 的 gold 分支）。
 * 它**不读**这条意见是**怎么**被处置的，也**不验「改没改到」**——机器人根本不看正文与意见的对应。
 * ⚠️ 收窄一档说清：spec 债-25 引的那条「主笔交工时**逐条点名处置**过」（`handledReviews` 的
 * `{id, how}`，一条不点名 400 打回）走的是**章级抽查意见**那条路（`meta.pendingReviews`，屏在章节卡），
 * **不是这一屏**（`meta.goldOpinions`，且 gold 意见条目**不带 `how` 字段**）⇒ 这一屏的机器判据比
 * 债-25 写的还弱：连「逐条点名」都没有。
 *
 * ── 口径（票面完成判据第 3 条要求写进注释）──────────────────────────────────────
 * **给了可核的原话 ≠ 有判据**。判据＝**机器拦**（收口票 10 裁的口径）：一条意见满足什么条件会被
 * 机器打回／不推进，才叫判据。屏上给一句「AI 怎么改的」原话，只是让**用户能自己核**——它**只降低
 * 严重度**，不改变「承诺面说『改到了』、机器判的是『状态被翻过了』」这个落差。这一屏连那句原话都
 * 没有（`how` 不在 gold 意见上），所以连「降低严重度」都不成立 ⇒ 句子必须降到机器真判得到的强度。
 *
 * ── 处置（票面二选一：收敛文案／补足机制）＝收敛文案 ────────────────────────────
 * 补足机制要真的验「这一稿有没有改到这条意见上」（读正文与 `target` 的对应），那是**另一件事、
 * 另一个 effort 的面**（票 08 的射程是「承诺面与实现面对齐」，不是新增内容判据）。
 * ⚠️ 同屏的状态词「AI 已改」（`OPINION_STATUS_TEXT.applied`）**不在本票射程**：它是 `CONTEXT.md`
 * 「界面用词表」登记在册的**条目状态词**（与「待处理／AI 修订中／已撤回」同一栏），改它＝改一个
 * 登记过的词，须另一张票裁决；本票只动这一句「这一稿都改过了」。
 */
export const APPLIED_HINT_TEXT = "这些意见这一稿都处置过了（AI 交回了新稿；改没改到机器不核）";

/**
 * 意见单旁的**状态提示**（票 gold-revision-flow/01）：按真实状态说话。
 *
 * 原式只有一种话——`pendingCount === 0` 就说「先标记至少一条意见（段旁三键或笼统便签）」。
 * 可屏上明明挂着意见：只是它们已经「AI 修订中」/「AI 已改」/「已撤回」，按钮该灰（服务端只把
 * `pending` 交给 AI），提示却像在问用户「你还没标意见」。四态各说一句，**真空手时**才说「先标记」。
 *
 * 票 `walkthrough-2026-10/04`（B6）给 `sent` 那一支补了同一件事实：这一稿**已经在盘上**时，
 * 「等它改完」与前一行那个「已交付·待定稿」自相矛盾——说这一稿改回来了、只差定稿。
 *
 * 票 `gold-display-period/01` 给 `pending > 0` 那一支补了**第二件事实**：展示期里那句话必须说，
 * 因为此刻没有任何人读得到这些意见（见 `DISPLAY_PERIOD_PENDING_HINT` 的注释）。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：`displayPeriod` 这一位只覆盖「章稿在盘、检查记录读不到」，
 * **不覆盖**「文件在盘但内容为空」与「读到了但格式坏」——那两格与 `goldDisplayPeriod` 同一口径
 * （本函数不自己另判一格）。
 *
 * @param {Array<{status?: string}>} list 意见单
 * @param {{ draftLanded?: boolean, displayPeriod?: object | null }} [facts]
 *   `draftLanded` 与 `opinionStatusText` 吃**同一件事实**（一处定义）；
 *   `displayPeriod` 是 `goldDisplayPeriod()` 的返回值（`null`＝不是展示期）——展示期里
 *   「待处理」那一支**不再闭嘴**。
 */
export function opinionActionHint(list, { draftLanded = false, displayPeriod = null } = {}) {
	const pending = list.filter((o) => o.status === "pending").length;
	const sent = list.filter((o) => o.status === "sent").length;
	const applied = list.filter((o) => o.status === "applied").length;
	const revoked = list.filter((o) => o.status === "revoked").length;
	// 有待办：平时按钮自己写着几条，不必再补一句；**展示期例外**——那颗键此刻禁着，
	// 而「提完什么都没有」正是这一票的病，所以这一格必须说话。
	if (pending > 0) return displayPeriod !== null ? DISPLAY_PERIOD_PENDING_HINT : null;
	if (sent > 0)
		return draftLanded === true
			? "这一稿已经改回来了，还没定稿"
			: "这一轮已经交给 AI 了，等它改完";
	if (applied > 0) return APPLIED_HINT_TEXT;
	// 票面 AC 点名的那一支：清单里只剩「已撤回」时**也不许**说「先标记」——屏上明明挂着意见
	//（划线的那几条），那句话仍像在问用户"你还没标意见"。说清真实状态并指出下一步。
	if (revoked > 0) return "这些意见都撤回了；要提新的，读到哪标到哪";
	return "先标记至少一条意见（段旁三键或笼统便签）";
}

export function GoldOpinionList(props) {
	const { opinions, busy, onRevoke, onRevise, draftLanded = false, displayPeriod = null } = props;
	const list = opinions ?? [];
	if (list.length === 0) {
		return createElement(
			"div",
			{ style: { ...S.card, opacity: 0.85 } },
			createElement(
				"p",
				{ style: { margin: "0" } },
				// 票 gold-revision-flow/01：空态也不许用「本稿」限定——这份清单是历次累积的。
				"📋 意见单还空着：读下面的稿子随手标记，或用最底下的「笼统提一条」。",
			),
		);
	}
	let seq = 0;
	const rows = list.map((o) => {
		// 票 `ui-systematic-fixes/02`：意见 kind 的词走兜底出口（spec §2 的**闭集**那一半）——
		// 未登记 ⇒ `null`＝**不印**（不是原样露机器词）；登记过的一格措辞不变。
		const kindText = fallbackWord(REVIEW_KIND_TEXT, o.kind);
		if (o.status === "revoked") {
			return createElement(
				"div",
				{
					key: o.id,
					style: {
						...S.card,
						opacity: 0.45,
						textDecoration: "line-through",
						marginBottom: "6px",
					},
				},
				`${REVIEW_REVOKED_TEXT}${kindText === null ? "" : `：${kindText}`}${o.wish ? ` ${o.wish}` : ""}`,
			);
		}
		seq += 1;
		const target =
			o.target == null
				? "笼统（不指哪段）"
				: `第${o.target.para}段${o.target.hint ? `「${o.target.hint}」` : ""}`;
		// 票 gold-revision-flow/01：已改过的条目**默认收成一行摘要**（可展开）——它不再是待办，
		// 占着一整张卡只会让人以为还要再点一次「让 AI 照这些改」。
		// 「撤销」在这条上改叫「撤回这条意见」并说清它不回滚正文（原词很容易被读成"撤销那次修改"）。
		if (o.status === "applied") {
			return createElement(
				"details",
				{ key: o.id, style: { ...S.card, marginBottom: "6px" } },
				createElement(
					"summary",
					{ style: { cursor: "pointer", fontSize: "12px", opacity: 0.75 } },
					`#${seq}${kindText === null ? "" : ` ${kindText}`}${o.wish ? `，${o.wish}` : ""} —— AI 已改`,
				),
				createElement(
					"div",
					{
						style: {
							marginTop: "6px",
							display: "flex",
							gap: "8px",
							alignItems: "baseline",
							flexWrap: "wrap",
						},
					},
					createElement(
						"span",
						{ style: { opacity: 0.75, fontSize: "12px" } },
						target,
					),
					createElement(
						"button",
						{ style: S.disabled(S.smallLink, busy), onClick: () => onRevoke(o.id), disabled: busy },
						"撤回这条意见",
					),
					createElement(
						"span",
						{ style: { fontSize: "12px", opacity: 0.7 } },
						"撤回只作废这条意见（定稿时不生效），不回滚已经改好的正文",
					),
				),
			);
		}
		return createElement(
			"div",
			{ key: o.id, style: { ...S.card, marginBottom: "6px" } },
			createElement(
				"div",
				{
					style: {
						display: "flex",
						gap: "8px",
						alignItems: "baseline",
						flexWrap: "wrap",
					},
				},
				createElement("strong", null, `#${seq}`),
				createElement("span", null, kindText),
				createElement(
					"span",
					{ style: { opacity: 0.75, fontSize: "12px" } },
					target,
				),
				o.wish ? createElement("span", null, o.wish) : null,
				createElement(
					"span",
					{
						style: {
							marginLeft: "auto",
							fontSize: "12px",
							whiteSpace: "nowrap",
						},
					},
					opinionStatusText(o.status, { draftLanded }),
					" ",
					createElement(
						"button",
						{
							style: S.disabled(S.smallLink, busy),
							onClick: () => onRevoke(o.id),
							disabled: busy,
						},
						"撤销",
					),
				),
			),
		);
	});
	const pendingCount = list.filter((o) => o.status === "pending").length;
	const hint = opinionActionHint(list, { draftLanded, displayPeriod });
	const activeCount = list.filter((o) => o.status !== "revoked").length;
	return createElement(
		"div",
		null,
		createElement(
			"p",
			{ style: { margin: "0 0 6px", fontWeight: 600 } },
			// 票 gold-revision-flow/01：标题改成如实说法——`meta.goldOpinions` 是**全书累积**、
			// 不分稿的（`gold-revise` 只追加、不记稿号），写「本稿」是名不副实，
			// 也正是"最新版还带着上一轮意见单"的直接来源。
			`📋 历次意见（${activeCount} 条${pendingCount > 0 ? `，${pendingCount} 条待处理` : ""}）`,
		),
		...rows,
		onRevise !== undefined
			? createElement(
					"div",
					{ style: { margin: "8px 0" } },
					createElement(
						"button",
						{
							style: S.disabled(S.bigBtn(true), busy || pendingCount === 0 || displayPeriod !== null),
							onClick: onRevise,
							// 票 gold-display-period/02（展示期的闸）：这一颗**会作废在跑的工作**——
							// `gold-revise` 先把 `chapter-NN.md`/`style-spec.md`/`audit-NN.md` 三份归档挪走、
							// 再重开一轮 gold，而对**正在读这一份稿**的检查小助手没有任何 `interrupt`
							// （全仓 `src/**` 零处生产调用 `interrupt_agent`）⇒ 这一轮检查的产出当场作废。
							// 拦法与裁决甲给定稿键定的那条同形：**禁用 ＋ 把理由写在脸上**（此刻禁着，
							// 所以理由那一句（`DISPLAY_PERIOD_PENDING_HINT`）说的是「等检查收工就能点」）。
							disabled: busy || pendingCount === 0 || displayPeriod !== null,
						},
						pendingCount > 0
							? `🔁 让 AI 照这些改（${pendingCount} 条）`
							: "🔁 让 AI 照这些改",
					),
					// 票 gold-revision-flow/01：提示按**真实状态**分四种说法（意见ActionHint），
					// 只有真的空手（连一条都没有）才说「先标记至少一条意见」。
					hint !== null
						? createElement(
								"span",
								{
									style: { marginLeft: "8px", fontSize: "12px", opacity: 0.7 },
								},
								hint,
							)
						: null,
					createElement(
						"p",
						{ style: S.hint },
						// 票 14（承诺账 A2）：机器**没有段落级校验**（只把标过的意见交给 AI，
						// 见 engine.js 的 gold 分支）——「只改你标过的地方，其余原样保留」是结果承诺，
						// 查无机制；收成机制真做的那件事。
						"只把你标过的意见交给 AI",
					),
				)
			: null,
	);
}

// ── 谈判桌·阅读与标记（段旁三键 + 笼统便签） ───────────────────────────────

export function GoldReader(props) {
	const {
		text,
		opinions,
		busy,
		onOpinion,
		readOnly,
		onRevokeOpinion = () => {},
		// 票 `demo-channel-full/25`：确认层那句话的取值只看「这是不是演示书」（`view-rules.paraMarkConfirmNote`
		// 里复用现成的 `isDemoBook`）。缺省 `undefined` ⇒ 按**真书**那一句渲染（本文件与
		// `smoke-test.mjs` 里那些只喂正文的渲染点照旧说真书的话，一个字未变）。
		meta,
	} = props;
	const [hover, setHover] = useState(null);
	const [formPara, setFormPara] = useState(null);
	const [wishText, setWishText] = useState("");
	const [wishError, setWishError] = useState(null);
	const [generalKind, setGeneralKind] = useState("change");
	const [generalText, setGeneralText] = useState("");
	const [generalError, setGeneralError] = useState(null);
	// 票 08：段落三键（😕/🗑）的**提交前确认层**。这两个键原先一击直发（handler 直接调
	// `onOpinion`），而它们恰恰是这 13 章里唯一会被连点几十次的那一类动作——误点一次，
	// AI 就已经收到并在处理这条意见了。
	// ⚠️ 这里**另起一个 state**，不复用 `GoldFinalize` 那个 `confirming`：定稿/重写的渲染块
	// 讲的是「会把意见变成全书风格线」，对一条段落意见完全不成立（段落意见不进风格线）。
	// `markConfirm = { kind, para, hint } | null`；`markWish` 是那一句**可选**理由。
	// ✏️ change 键**已经有**理由框（`formPara` + `submitWish`），本票不给它再加一层。
	const [markConfirm, setMarkConfirm] = useState(null);
	const [markWish, setMarkWish] = useState("");
	// 判据 7（票 05）：首段三键的首次引导脉冲已删——三键安静常显（悬停才亮），
	// 不再 setTimeout 闪两下、放大、套 2px 光环。状态靠 hover 与「已选」底色表达。
	const paras = splitParagraphs(text);
	// 段号 -> 已挂意见的标签（#N 表情），给人看「这段已标过」。
	const marked = new Map();
	let seq = 0;
	for (const o of opinions ?? []) {
		if (o.status === "revoked") continue;
		seq += 1;
		if (o.target != null && Number.isSafeInteger(o.target.para)) {
			const arr = marked.get(o.target.para) ?? [];
			arr.push(
				`#${seq} ${o.kind === "dislike" ? "😕" : o.kind === "drop" ? "🗑" : "✏️"}`,
			);
			marked.set(o.target.para, arr);
		}
	}
	const submitWish = () => {
		const wish = wishText.trim();
		if (wish === "") {
			setWishError("写一句你想让它变成什么样");
			return;
		}
		onOpinion(
			"change",
			wish,
			formPara,
			paragraphHint(paras[formPara - 1] ?? ""),
		);
		setFormPara(null);
		setWishText("");
		setWishError(null);
	};
	const submitGeneral = () => {
		const wish = generalText.trim();
		if (generalKind === "change" && wish === "") {
			setGeneralError("「要改成」请写一句话");
			return;
		}
		onOpinion(generalKind, wish, null, "");
		setGeneralText("");
		setGeneralError(null);
	};
	// 票 08：点键只**记下待提交的那一条**（不发动作），确认层里才真正发出去。
	const openMarkConfirm = (kind, n, para) => {
		setMarkConfirm({ kind, para: n, hint: paragraphHint(para) });
		setMarkWish("");
	};
	const closeMarkConfirm = () => {
		setMarkConfirm(null);
		setMarkWish("");
	};
	const submitMark = () => {
		const target = markConfirm;
		if (target === null) return;
		// 🔴 留空照样提交（＝今天一击直发那条路的逐字行为）：理由栏解决的是「用户想说更多」，
		// 不是「用户必须交代」。服务端也只对 `change` 强制要 wish（gold.js 的校验原文
		// 「不喜欢/不需要可以只点一下」就是这条硬约束的服务端一侧）。
		onOpinion(target.kind, markWish.trim(), target.para, target.hint);
		closeMarkConfirm();
	};
	// 票 `ui-systematic-fixes/02`：确认层那句里的 kind 词同走兜底出口（未登记 ⇒ 不印机器值）。
	const markConfirmKind = markConfirm === null ? null : fallbackWord(REVIEW_KIND_TEXT, markConfirm.kind);
	// 左右留白：右 68px 给三键浮出腾地方，左 34px 给段号/已标标签的装订线腾地方。
	return createElement(
		"div",
		{ style: { paddingLeft: "34px", paddingRight: "68px" } },
		// 票 08：确认层摆在正文**顶部**（不是贴着被点的那一段）——用户读的是一整章，
		// 刚点的那段可能在第 188 段，贴着它弹等于弹到屏幕外。
		markConfirm !== null
			? createElement(
					"div",
					{
						style: {
							...S.card,
							borderColor: "var(--dsw-alias-state-business-primary)",
							margin: "0 0 10px",
						},
					},
					createElement(
						"p",
						{ style: { margin: "0 0 4px", fontWeight: 600 } },
						`确认：把第 ${markConfirm.para} 段${markConfirmKind === null ? "记一条意见" : `记成「${markConfirmKind}」`}？`,
					),
					createElement(
						"p",
						{ style: { margin: "0 0 6px", fontSize: "12px", opacity: 0.85 } },
						// 真书那一句（＝出口里的 `PARA_MARK_CONFIRM_NOTE`）是**兑现的**、不是承诺
						// （`CONTEXT.md`「承诺过度」那条账）：AI 真的会照这条改这一章（这段意见随交办
						// 任务送给主笔 AI），这一章交工前也真的必须先处置它（交工校验会直接拒收没处置的
						// pending 意见）。
						// ⚠️ 票 `demo-channel-full/25`：**这两句对演示书都不成立**（演示通道零 LLM ＋
						// 过目态提不出段落意见，读数见那个出口的注释）⇒ 取值改由
						// `view-rules.paraMarkConfirmNote(meta)` 给，本行不再持有措辞；真书那一句逐字未变。
						paraMarkConfirmNote(meta),
					),
					createElement("textarea", {
						style: { ...S.input, width: "100%", boxSizing: "border-box" },
						rows: 2,
						// 提示走 placeholder、**不预填进值里**：预填会让「留空也能提交」这条硬约束
						// 变成「用户得先自己把它删掉才成立」，那就把快速标记这条路又堵回去了。
						placeholder: "想说为什么就写一句（可以不填）",
						value: markWish,
						onChange: (e) => setMarkWish(e.target.value),
					}),
					createElement(
						"div",
						{
							style: {
								display: "flex",
								gap: "8px",
								alignItems: "center",
								marginTop: "6px",
							},
						},
						// 两个热区各干一件事：提交＝发动作；再想想＝纯收起（不发任何东西）。
						createElement(
							"button",
							{ style: S.disabled(S.bigBtn(true), busy), onClick: submitMark, disabled: busy },
							"✅ 提交这条",
						),
						createElement(
							"button",
							// 🎯 票 `gold-display-period/05`：这一颗**有意不禁用**（#2 的逐处复核）——
							// `onClick` 只收起这张表单（`closeMarkConfirm()`＝两个 setState），**不发任何东西**，
							// 所以 `busy` 里挡住它只会造出一个「看着能点却点不动」的键（先例见 `event-cards.js`
							// 的「❌ 不满意，让 AI 改」上方）。逐处理由登记在 `D-禁用不给理由.md` 的「票 05 #2」那一节。
							{ style: S.smallLink, onClick: closeMarkConfirm },
							"再想想",
						),
					),
				)
			: null,
		paras.map((para, idx) => {
			const n = idx + 1;
			const marks = marked.get(n) ?? [];
			return createElement(
				"div",
				{
					key: n,
					// 段容器相对定位：装订线、三键浮出都以它为参照，正文不占这些位置。
					style: { position: "relative" },
					onMouseEnter: () => setHover(n),
					onMouseLeave: () => setHover((cur) => (cur === n ? null : cur)),
				},
				// 左侧装订线：段号 + 已标 #N 标签（不指段时淡出到 0.35，指到时亮起）。
				createElement(
					"span",
					{
						style: {
							position: "absolute",
							left: "-34px",
							top: "0",
							fontSize: "12px",
							lineHeight: 1.6,
							whiteSpace: "nowrap",
							color: "var(--dsw-alias-state-business-primary)",
							opacity: hover === n ? 1 : 0.35,
							transition: "opacity 250ms ease-out",
						},
					},
					String(n),
					marks.length > 0
						? createElement(
								"span",
								{ style: { display: "block" } },
								marks.join(" "),
							)
						: null,
				),
				// 正文段落：纯流式 + markdown 最小渲染（标题/加粗/列表行）。
				createElement("p", { style: READER_PARA_STYLE }, ...renderInline(para)),
				formPara === n
					? createElement(
							"div",
							{ style: { margin: "-4px 0 8px" } },
							createElement("textarea", {
								style: { ...S.input, width: "100%", boxSizing: "border-box" },
								rows: 2,
								placeholder:
									"写一句你想让它变成什么样（例：开头别反问，直接讲道理）",
								value: wishText,
								onChange: (e) => {
									setWishText(e.target.value);
									setWishError(null);
								},
							}),
							createElement(
								"div",
								{
									style: { display: "flex", gap: "8px", alignItems: "center" },
								},
								createElement(
									"button",
									{
										style: S.disabled(S.bigBtn(true), busy),
										onClick: submitWish,
										disabled: busy,
									},
									"✅ 记下这条",
								),
								createElement(
									"button",
									{
										style: S.smallLink,
										onClick: () => {
											setFormPara(null);
											setWishError(null);
										},
									},
									"收起",
								),
								wishError !== null
									? createElement("span", { style: S.error }, wishError)
									: null,
							),
						)
					: null,
				// 三键浮出（absolute 定在段右上角、不占正文宽度）：F36 常显淡态 0.3（可感知、不占位），
				// 悬停时全亮；三键常显淡态 0.55（票 05：删掉首段脉冲，键始终可点）。
				!readOnly
					? createElement(
							"div",
							{
								style: {
									position: "absolute",
									top: "-2px",
									right: "-64px",
									display: "flex",
									gap: "2px",
									opacity: hover === n ? 1 : 0.55,
									transition: "opacity 250ms ease-out",
									pointerEvents: "auto",
								},
							},
							(() => {
								const activeOf = (kind) =>
									(opinions ?? []).find(
										(o) =>
											o.status !== "revoked" &&
											o.target != null &&
											o.target.para === n &&
											o.kind === kind,
									);
								// toggle=true 的两态键：同段同类型已有未撤销意见 -> 再点=revoke（防误触，F14 裁决）。
								// ✏️ 传 toggle=false：点开的是改写框、本身不落账、无误触问题，行为不变（F14 裁决第 3 条）。
								const keyWith = (
									label,
									kind,
									title,
									onClick,
									toggle = true,
								) => {
									const active = toggle ? activeOf(kind) : null;
									// aria-label 与 title 同文案：让读屏用户也知道「再点=撤销」。
									const labelText =
										active != null ? `${title}（已标：再点一次=撤销）` : title;
									return createElement(
										"button",
										{
											key: label,
											"aria-label": labelText,
											style: S.disabled({
												...S.smallLink,
												fontSize: "13px",
												padding: "2px 4px",
												whiteSpace: "nowrap",
												...(active != null
													? {
															background: "var(--dsw-alias-state-business-tertiary)",
															borderRadius: "6px",
														}
													: {}),
											}, busy),
											title: labelText,
											onClick: () => {
												if (active != null) onRevokeOpinion(active.id);
												else onClick();
											},
											disabled: busy,
										},
										label,
									);
								};
								return [
									// 票 08：这两个键**不再一击直发**——只打开确认层；确认层里点「提交这条」
								// 才真正调 `onOpinion`（理由可留空，留空发空串＝今天的行为）。
								keyWith("😕", "dislike", "这种写法不喜欢", () =>
										openMarkConfirm("dislike", n, para),
									),
									keyWith("🗑", "drop", "这类内容不需要", () =>
										openMarkConfirm("drop", n, para),
									),
									keyWith(
										"✏️",
										"change",
										"要改成（写一句话）",
										() => {
											setFormPara(n);
											setWishText("");
										},
										false,
									),
								];
							})(),
						)
					: null,
			);
		}),
		!readOnly
			? createElement(
					"div",
					{
						style: {
							...S.card,
							display: "flex",
							gap: "8px",
							alignItems: "center",
							flexWrap: "wrap",
						},
					},
					createElement(
						"span",
						{ style: { fontSize: "12px", opacity: 0.75 } },
						"笼统提一条（不指哪段也行）：",
					),
					["dislike", "drop", "change"].map((k) =>
						createElement(
							"button",
							{
								key: k,
								style: S.disabled(S.projectBtn(generalKind === k), busy),
								onClick: () => setGeneralKind(k),
								disabled: busy,
							},
							REVIEW_KIND_TEXT[k],
						),
					),
					createElement("input", {
						style: { ...S.input, flex: "1 1 160px", minWidth: "120px" },
						placeholder: "例：整体语气再亲切一点",
						value: generalText,
						onChange: (e) => {
							setGeneralText(e.target.value);
							setGeneralError(null);
						},
					}),
					createElement(
						"button",
						{ style: S.disabled(S.bigBtn(true), busy), onClick: submitGeneral, disabled: busy },
						"笼统提一条",
					),
					generalError !== null
						? createElement("span", { style: S.error }, generalError)
						: null,
				)
			: null,
	);
}

// ── 谈判桌·稿间内联对比（删除线旧文 + 绿底新文 + 意见号） ──────────────────

export function GoldCompare(props) {
	const { oldText, newText, opinions } = props;
	const oldParas = splitParagraphs(oldText);
	const newParas = splitParagraphs(newText);
	const ops = diffParagraphs(oldParas, newParas);
	// 新稿段号(1 基) -> 意见号数组；笼统意见只计数。
	const chipsByNewPara = new Map();
	let generalCount = 0;
	let seq = 0;
	for (const o of opinions ?? []) {
		if (o.status === "revoked") continue;
		seq += 1;
		if (o.target != null && Number.isSafeInteger(o.target.para)) {
			const arr = chipsByNewPara.get(o.target.para) ?? [];
			arr.push(seq);
			chipsByNewPara.set(o.target.para, arr);
		} else generalCount += 1;
	}
	const chipSpan = (n) =>
		createElement(
			"span",
			{
				key: `c${n}`,
				style: {
					fontWeight: 700,
					marginRight: "6px",
					color: "var(--dsw-alias-state-business-primary)",
					whiteSpace: "nowrap",
				},
			},
			`#${n}`,
		);
	const blocks = ops.map((op, idx) => {
		if (op.type === "del") {
			return createElement(
				"p",
				{
					key: `d${idx}`,
					style: {
						...READER_PARA_STYLE,
						textDecoration: "line-through",
						background: "var(--dsw-alias-file-diff-deleted-bg)",
						opacity: 0.75,
					},
				},
				oldParas[op.old],
			);
		}
		// same 与 add 都按新稿渲染；挂到该段的意见号亮出来（same 段挂了意见=AI 在别处落实，也给人看见）。
		const paraNo = op.new + 1;
		const chips = chipsByNewPara.get(paraNo) ?? [];
		return createElement(
			"p",
			{
				key: `n${idx}`,
				style:
					op.type === "add"
						? {
								...READER_PARA_STYLE,
								background: "var(--dsw-alias-state-success-tertiary)",
								borderColor: "var(--dsw-alias-state-success-primary)",
							}
						: READER_PARA_STYLE,
			},
			chips.map((n) => chipSpan(n)),
			" ",
			newParas[op.new],
		);
	});
	return createElement(
		"div",
		null,
		createElement(
			"p",
			{ style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
			// 票 10（判定四③）：原句 96 字压到 90 字内——「AI 会对号入座」属客套（意见单里就写着哪条
			// 是哪条），删掉后只留三种颜色/编号各自什么意思。
			`对照方式：红底划掉的是旧稿删掉的；绿底是新稿改成的；#号对应意见单里的第几条${generalCount > 0 ? `（另有 ${generalCount} 条笼统意见）` : ""}。`,
		),
		...blocks,
	);
}

// ── 谈判桌·定稿沉淀（字数 + AI 建议 + 定稿/重写确认层） ─────────────────────

/**
 * 站 9 的**软提示**：站 8 重拍之后，这一屏那份体量结论就旧了（票 `confirm-points-redesign-build/08`
 * ／规划票 07 §4，Q14 甲）。
 * ⚠️ **只有这一句**：⛔ 机器不给硬边——不打回、不拦、不把站 9 那份结论删掉。
 * 「重做上游把下游打回」那一档（Q17 甲）**已裁不做**，所以这里不许长出第二道闸。
 * 票 `ui-display-redesign/07`：保存键改名后，句子里点名的键名跟着改（否则指向一颗不存在的键）。
 */
export const DRAFT_CHANGED_HINT =
	"这一稿换了，体量得重拍一次（改完字数再点一次「💾 保存各章字数」；不改也走得下去——机器不拦）。";

/**
 * 定稿键的前置（票 08 逐条落点：从「先写回再定稿」换成「**站 9 已拍板**」）——**只给契约面**。
 *
 * 票 `ui-display-redesign/07`（spec §7.7#5）把卡上那句「站 9 还没拍板：先在下面点…」整句删了：
 * 写回键（现已改名「保存各章字数」）自身可用就是软提示，定稿键灰着不再另给一句。
 * ⇒ 这句只剩一个消费点：`view-rules.blockedOf` 的 `blocked.reason`（AI 工具面／下一层渲染的输入）。
 * ⛔ 别把它当成卡上可见文案（`test-component-cards` 反过来钉住它**不在**屏上）。
 */
export const GOLD_STATION9_NOT_DECIDED =
	"定稿的前置是站 9 已拍板：先去站 9 点「💾 保存各章字数」把各章字数定下来。";

// ── 票 `ui-systematic-fixes/11`：谈判桌两站那四颗键的**文案出口**（拍板契约的 `options[].label`／
// `keysAt` 取这几个绑定）＋ 两站各一句后果说明。⛔ 不在 `view-rules.js` 再抄一份原文。
export const GOLD_DRAFT_ACCEPT_LABEL = "✅ 就用这一稿";
export const GOLD_DRAFT_REWRITE_LABEL = "🔁 不满意，重写这一章";
export const GOLD_SEAL_LABEL = "✅ 就按这章的风格写全书";
// 票 `ui-display-redesign/07`（spec §2.8 第 8 块）：站 9 的保存键改名——它写的是「各章字数」，
// 不是抽象地「写回章节安排」；`meta.targetWords` 兜底字段保留、界面不再编辑它。
export const GOLD_WRITE_TARGETS_LABEL = "💾 保存各章字数";
// 同一块的提示（唯一出口：卡上那句与 `view-rules` 契约的 effect 都取它）。
export const GOLD_WRITE_TARGETS_HINT =
	"手动改动与 AI 建议都先预填；点「保存」才落盘。";

/**
 * 「✅ 就用这一稿」那颗主键的**后果说明**（票 11 补的六句之一 · 站 8）。
 *
 * ⚠️ 与卡上既有那句小字（「「就用这一稿」只表态这一稿行；字数还要在下一屏另拍一次。」）
 * **不是同一句**：那句讲的是**这一次表态的范围**（哪一半被定了），本句讲的是**点时会发生什么**。
 * 两句都在，各答一件事——⛔ 不要把两句合成一句（那会删掉卡上那句已经上屏的话）。
 */
export const GOLD_DRAFT_PASS_EFFECT =
	"点了它这一稿就此定下，当全书的最佳范例章；各章字数还要在下一屏另定一次。";

/**
 * 「✅ 就按这章的风格写全书」那颗主键的**后果说明**（票 11 补的六句之一 · 站 9）。
 *
 * ⚠️ 它说的是**这一步**的后果；「之后还能不能改」不在本句（那由定点修改与回退那两张卡各说各的）。
 */
export const GOLD_SEAL_EFFECT =
	"点了它这一章就此定稿，AI 照这一章的风格与体量写完整本。";

export function GoldFinalize(props) {
	const {
		meta, busy, onApprove, onSuggestWords, onWriteTargets,
		displayPeriod = null, station9Decided = false, draftChanged = false, onReviewDraft,
	} = props;
	const [targetDrafts, setTargetDrafts] = useState(() =>
		Object.fromEntries(
			(meta?.outline?.chapters ?? []).map((chapter, index) => [
				index + 1,
				Number.isFinite(chapter.targetWords) ? String(chapter.targetWords) : "",
			]),
		),
	);
	const [suggesting, setSuggesting] = useState(false);
	const [writing, setWriting] = useState(false);
	const [suggestion, setSuggestion] = useState(null);
	const [error, setError] = useState(null);
	const chapters = meta?.outline?.chapters ?? [];
	const goldNo = goldChapterNo(meta);
	const canEditTargets = meta?.canEditTargetWords === true;
	/**
	 * 不能就地调逐章目标时，**为什么**不能（票 gold-revision-flow/03 的「承诺过度」修法）。
	 *
	 * 原式只有一句「写完整本已经开始，逐章目标请到「定点修改：章节安排」调整」，可它在
	 * **最佳范例章生成/修订**（阶段 4、铺章根本没开始）与**已定稿**那一瞬也说这句——
	 * 那是在替一个没发生的事实作证（CONTEXT「承诺过度」）。按真实状态分三句：
	 *  - 铺章已开始（phase ≥ 5）：原句照旧，那才是真话；
	 *  - 已定稿：定稿之后目标就归全书节奏管，走定点修改；
	 *  - 还在改/写这一章：这一章还没定稿，逐章目标等定稿后再调（或走定点修改）。
	 * 兜底给中性的一句，不把「不可编辑」一律说成「已经开始了」。
	 */
	const targetEditHint = (() => {
		if (canEditTargets) return null;
		const phase = Number(meta?.phase ?? 0);
		if (phase >= 5) return "写完整本已经开始，逐章目标请到「定点修改：章节安排」调整。";
		if (meta?.goldSealed != null) return "这一章已定稿；逐章目标请到「定点修改：章节安排」调整。";
		return "正在写/改最佳范例章；逐章目标等这一章定稿后再调（或走「定点修改：章节安排」）。";
	})();
	const targetSignature = chapters
		.map((chapter, index) => `${index + 1}:${chapter.targetWords ?? ""}`)
		.join("|");

	/**
	 * 票 31 / ADR-0026（grilling Q2 ＋ Q3）：谈判桌上把「实测」与「逐章目标」点破成
	 * **独立一整行**的一句话：
	 *
	 *   样章实测 10,119 汉字。按样章实测与原定的比例外推，其余 12 章合计约 149,000 汉字——要调吗？
	 *
	 * 「按样章实测与原定的比例外推」＝把最佳范例章的**实测/原定之比**乘到其余各章的现有目标上：
	 * 母版章实际写了多少，其余章就照这个比例算——这样那个 +69% 的超标基准第一次被摆到台面上。
	 * 字数一律标「汉字」口径（CONTEXT.md「字数」词条，grilling Q3）。
	 *
	 * ⚠️ 票 31 的代理判读（2026-10-12，第 3 条）补的那半句：原句只写「按这个标定」，
	 * **没说按什么推**——读者看不出这个数是外推的、更看不出推的是哪两个数的比。
	 * 所以「按这个标定」改成逐字点明两个操作数的「按样章实测与原定的比例外推」；
	 * ⛔ 别把它写回「实测」二字（2026-10-12 读数：其余 11 章口径低报 ≈19.7%／全书口径 ≈17.8%，
	 * 说成实测就是编数）。
	 *
	 * 读不到标定所需的数据时（`goldMeasuredHanzi` 不可用、母版章原定未定、只有母版章一章）
	 * **退回旧两行**（母版行里「原定 · 实测」那个既有形状）：不要空句，
	 * 旧形状不需要新词表，也少一处「界面上凭空少了一句话」说不清的差异。
	 *
	 * ⚠️ 票 `ui-display-redesign/17`（收口 review S2）：派生**只此一处**——本行与卡头事实句都调
	 * {@link goldRestProjection}（`实测 / 母版原定 × 其余原定`），⛔ 不许任一处在本地再算一份
	 * （修前事实句拿「当前目标之和」冒充，同屏两个「合计约」打架）。
	 */
	const calibratedLine = (() => {
		const projection = goldRestProjection(meta);
		if (projection === null) return null;
		return `最佳范例章实测 ${projection.measured} 汉字。按最佳范例章实测与原定的比例外推，其余 ${projection.restCount} 章合计约 ${projection.projected} 汉字——要调吗？`;
	})();
	useEffect(() => {
		setTargetDrafts(
			Object.fromEntries(
				chapters.map((chapter, index) => [
					index + 1,
					Number.isFinite(chapter.targetWords) ? String(chapter.targetWords) : "",
				]),
			),
		);
	}, [targetSignature]);

	const editableRows = chapters
		.map((chapter, index) => ({ chapter, n: index + 1 }))
		.filter(({ n }) => n !== goldNo);
	const targetRowsOk = editableRows.every(({ n }) => {
		const raw = String(targetDrafts[n] ?? "").trim();
		if (raw === "") return true;
		const words = Number(raw);
		return Number.isFinite(words) && words >= 500 && words <= 50000;
	});
	const targetsToWrite = editableRows.flatMap(({ n }) => {
		const raw = String(targetDrafts[n] ?? "").trim();
		if (raw === "") return [];
		const words = Number(raw);
		return Number.isFinite(words) && words >= 500 && words <= 50000
			? [{ n, targetWords: Math.round(words) }]
			: [];
	});
	const targetsDirty = editableRows.some(({ chapter, n }) => {
		const raw = String(targetDrafts[n] ?? "").trim();
		if (raw === "") return Number.isFinite(chapter.targetWords);
		return Number.isFinite(chapter.targetWords)
			? Math.round(Number(raw)) !== chapter.targetWords
			: true;
	});
	const requestSuggestion = () => {
		setSuggesting(true);
		setError(null);
		Promise.resolve(onSuggestWords())
			.then((result) => {
				if (result === null || !Array.isArray(result.perChapter)) {
					setError("AI 建议没有带回逐章建议，请再试一次");
					return;
				}
				const perChapter = result.perChapter.filter((item) => Number(item?.n) !== goldNo);
				setTargetDrafts((prev) => {
					const next = { ...prev };
					for (const item of perChapter) {
						const n = Number(item?.n);
						const words = Number(item?.words);
						if (!Number.isSafeInteger(n) || n < 1 || n > chapters.length) continue;
						if (Number.isFinite(words) && words >= 500 && words <= 50000) {
							next[n] = String(Math.round(words));
						}
					}
					return next;
				});
				setSuggestion({ ...result, perChapter });
			})
			.catch((err) =>
				setError(String(err instanceof Error ? err.message : err)),
			)
			.finally(() => setSuggesting(false));
	};
	const writeTargets = () => {
		if (!canEditTargets || !targetRowsOk || targetsToWrite.length === 0) return;
		setWriting(true);
		setError(null);
		Promise.resolve(onWriteTargets(targetsToWrite))
			.then((result) => {
				if (result === null) {
					setError("逐章目标没有写回，请检查提示后重试");
					return;
				}
				setSuggestion(null);
			})
			.catch((err) => setError(String(err instanceof Error ? err.message : err)))
			.finally(() => setWriting(false));
	};
	// 票 `ui-display-redesign/07`（spec §2.8 第 9 块）：兜底统一值那一整块删除——只用逐章目标。
	// `meta.targetWords` 字段**保留**（旧书仍可用：标定行与卡头事实句对未填章沿用它的值），
	// 但界面不再编辑、不再单独显示那一行、也不再随定稿一起发出去。
	return createElement(
		"div",
		{ style: S.card },
		createElement(
			"p",
			{ style: { margin: "0 0 6px", fontWeight: 600 } },
			// 票 10（判定一 #4）：「样板」是界面词表外的第三套叫法，统一成「最佳范例章」。
			// 票 `confirm-points-redesign-build/08`：抬头从「满意了就定稿」改成**站 9** 的名字——
			// 「这一稿行不行」已经在上一屏拍过（`GoldDraftStage`），这一屏只管**体量**。
			"📐 定体量（这一章就是全书的最佳范例章）",
		),
		createElement(
			"div",
			{ style: { display: "flex", gap: "8px", alignItems: "center", margin: "0 0 6px", flexWrap: "wrap" } },
			// 票 07 §2：站 9 屏**不放全文**；要看正文走这个入口——它点开的就是站 8 那一套
			// 读／对比区（⛔ 不复制正文，一个入口而已）。
			createElement("button", { style: S.smallLink, onClick: onReviewDraft }, "📖 回看这一稿"),
		),
		draftChanged
			? createElement(
					"p",
					{ style: { ...S.hint, margin: "0 0 6px" } },
					// ⚠️ **软提示，机器不给硬边**（票 07 §4，Q14 甲）：站 8 重拍之后站 9 那份结论
					// 在界面上只是提醒重拍一次，⛔ 不打回、不拦（「重做上游把下游打回」那一档已裁不做）。
					DRAFT_CHANGED_HINT,
				)
			: null,
		createElement(
			"div",
			{ style: { margin: "6px 0" } },
			// 票 31 / ADR-0026：那句点破「实测」与「逐章目标」关系的话独立占一整行，
			// 不塞进下面输入区的标题（那是「只在样章后报一次」的那一次，塞进去会像输入框的标签）。
			// 读不到标定所需数据时 calibratedLine 为 null ⇒ 退回旧两行，不留空句。
			calibratedLine !== null
				? createElement(
						"p",
						{
							style: {
								margin: "0 0 6px",
								padding: "6px 8px",
								background: "var(--dsw-alias-bg-layer-1)",
								borderRadius: "8px",
								border: "1px solid var(--dsw-alias-border-l2)",
								fontSize: "12px",
							},
						},
						calibratedLine,
					)
				: null,
			createElement(
				"p",
				{ style: { margin: "0 0 4px", fontSize: "12px", opacity: 0.8 } },
				"逐章至少写到（单位：汉字；来自章节安排，只在写完整本开始前可调。这是最低线，写多不限——最后检查只判有没有达到，不判超了多少）：",
			),
			chapters.map((chapter, index) => {
				const n = index + 1;
				const isGold = n === goldNo;
				const original = Number.isFinite(chapter.targetWords)
					? `原定 ${chapter.targetWords}`
					: "原定未定";
				// 票 31 / ADR-0026：独立那一行已经说过实测了，母版行这里只留「原定」
				// （不再把两个数字并排摆着、也不说它们的关系）；读不到时退回旧两行。
				const measured =
					calibratedLine !== null
						? ""
						: Number.isFinite(meta?.goldMeasuredHanzi)
							? `，实测 ${meta.goldMeasuredHanzi} 汉字`
							: "，实测暂不可用";
				return createElement(
					"div",
					{
						key: n,
						style: {
							fontSize: "12px",
							margin: "2px 0",
							display: "flex",
							gap: "6px",
							alignItems: "center",
							flexWrap: "wrap",
						},
					},
					createElement("span", null, `${n}. ${chapter.title ?? ""}`),
					isGold
						? createElement(
								"strong",
								{ style: { color: "var(--dsw-alias-state-business-primary)" } },
								`${original}${measured}`,
							)
						: canEditTargets
							? createElement(
									"input",
									{
										"aria-label": `第 ${n} 章目标汉字数`,
										style: S.disabled({ ...S.input, width: "92px" }, busy || writing),
										type: "number",
										min: 500,
										max: 50000,
										step: 100,
										value: targetDrafts[n] ?? "",
										disabled: busy || writing,
										onChange: (e) => {
											setTargetDrafts((prev) => ({ ...prev, [n]: e.target.value }));
											setSuggestion(null);
										},
									},
								)
							: createElement(
									"span",
									{ style: { opacity: 0.6 } },
									Number.isFinite(chapter.targetWords)
										? `目标 ${chapter.targetWords} 汉字`
										: "目标未定",
								),
					!isGold && canEditTargets
						? createElement("span", { style: { opacity: 0.6 } }, "汉字")
						: null,
					chapter.volumeReason
						? createElement(
								"span",
								{ style: { opacity: 0.5 } },
								`（${chapter.volumeReason}）`,
							)
						: null,
				);
			}),
			// 票 `ui-display-redesign/07`（spec §2.8 第 8 块）：**保存各章字数**（由「写回章节安排」
			// 改名）＋ **AI 建议挪到它旁边**（原先住在兜底区）＋「点『保存』才落盘」一行提示。
			canEditTargets && onWriteTargets !== undefined
				? createElement(
						"div",
						{
							style: {
								display: "flex",
								gap: "8px",
								alignItems: "center",
								marginTop: "6px",
								flexWrap: "wrap",
							},
						},
						createElement(
							"button",
							{
								style: S.disabled({ ...S.bigBtn(true), padding: "6px 12px" }, busy || writing || !targetRowsOk || targetsToWrite.length === 0),
								onClick: writeTargets,
								disabled: busy || writing || !targetRowsOk || targetsToWrite.length === 0,
							},
							writing ? "正在保存…" : GOLD_WRITE_TARGETS_LABEL,
						),
						createElement(
							"button",
							{
								style: S.disabled({ ...S.bigBtn(true), padding: "6px 12px" }, suggesting || writing || busy),
								onClick: requestSuggestion,
								disabled: suggesting || writing || busy,
							},
							suggesting ? "AI 思考中…" : "✨ AI 建议",
						),
						createElement(
							"span",
							{ style: { fontSize: "12px", opacity: 0.65 } },
							GOLD_WRITE_TARGETS_HINT,
						),
					)
				: createElement(
						"p",
						{ style: { ...S.hint, margin: "6px 0 0" } },
						// 票 gold-revision-flow/03 复审：文案按**真实状态**说，别把「不可编辑」
						// 一律说成「写完整本已经开始」——阶段 4 改稿、刚定稿那几态铺章都还没开始。
						targetEditHint,
					),
			// 票 `ui-display-redesign/07`（spec §2.8 第 8 块）：建议结果〔折〕——它只是预填的
			// 依据，不该把主键推走；`<details>` 默认不展开。
			suggestion !== null
				? createElement(
						"details",
						{ style: { margin: "6px 0 0" } },
						createElement(
							"summary",
							{ style: { cursor: "pointer", fontSize: "12px", opacity: 0.8 } },
							// 建议结果〔折〕的折叠口文案（票 07 新写）。
							"🤖 AI 建议结果（还没保存）",
						),
						createElement(
							"div",
							{ style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.8 } },
							createElement(
								"p",
								{ style: { margin: "0 0 4px" } },
								`🤖 AI 建议已预填，还没保存：整体每章约 ${suggestion.suggested} 汉字（${suggestion.range ?? ""}）。${suggestion.reason ?? ""}`,
							),
							(suggestion.perChapter ?? []).length > 0
								? createElement(
										"div",
										null,
										(suggestion.perChapter ?? []).map((item) =>
											createElement(
												"div",
												{ key: item.n, style: { margin: "1px 0" } },
												`${item.n}. ${item.title ?? ""}：${Number.isFinite(item.words) ? `约 ${item.words} 汉字` : "未定，AI 写整本时自定"}${item.reason ? `（${item.reason}）` : ""}`,
											),
										),
									)
								: null,
						),
					)
				: null,
			// 票 `ui-display-redesign/07`（spec §2.8 第 10 块 −1 句）：兜底那句校验随兜底块删除。
			!targetRowsOk
				? createElement(
						"p",
						{ style: S.error },
						"逐章目标请填 500-50000 汉字，或留空沿用未定。",
					)
				: null,
		),
		// 票 `ui-display-redesign/07`（spec §2.8 第 11 块）：未拍板提示整句删除——写回键自身可用
		// 就是软提示（设计稿 §7.7#5）。`GOLD_STATION9_NOT_DECIDED` 只给契约面（`blocked.reason`）。
		error !== null
			? createElement("p", { style: S.error }, `⚠️ ${error}`)
			: null,
		createElement(
			"div",
			{
				style: {
					display: "flex",
					gap: "8px",
					marginTop: "8px",
					alignItems: "center",
				},
			},
			createElement(
				"button",
				{
					// 前置＝**站 9 已拍板**（那颗「💾 保存各章字数」落 `决策/09.json`），
					// 外加同一条路的安全网「没有未保存的改动」。
					// 票 `ui-display-redesign/07`（spec §2.8 第 14 块）：**定稿键直接生效**——
					// 不再弹确认层（代价已由设计稿 §7.6#6 登记：有未处置意见时那句预告不再出现）。
					style: S.disabled(S.bigBtn(true), busy || writing || !targetRowsOk || targetsDirty || !station9Decided),
					onClick: () => onApprove(true, null),
					disabled: busy || writing || !targetRowsOk || targetsDirty || !station9Decided,
					// 票 `auto-walkthrough/04`：关键键的语义钩子（站 9 定稿／六闸门之一）。
					"data-gold-seal": "1",
				},
				GOLD_SEAL_LABEL,
			),
		),
	);
}

// ── 谈判桌·检查徽章（票 gold-revision-flow/02：从 GoldTable 里抽出的纯函数） ─────
// ⚠️ 票面勘误②：初值**不许**落在「已附检查记录」上。原式只在 `auditText != null` 时改写，于是三种
// "其实没有"的情形全落在默认句上——① 还没读到（undefined 初值）② 读不到/没有（拉取失败 → null）
// ③ 拿到但形状不对。三种都不许说「已附」。抽成纯函数是为了能直调断言（渲染级要 stub fetchText + 异步 effect）。
// `auditText` 形状：**undefined = 还没读到**、null = 没有／读不到、string = 读到了（内容自己判）。
export function auditBadgeText(auditText) {
	// 票 10（判定三 #9）：界面一律说「检查」——「质检」（质量门系机器词）与「自查」（机器视角）
	// 都不上人眼。文件仍是 `工作区/audit-NN.md`（机器身份词，不改）。
	// 票 gold-display-period/01：这一格说的是**本卡**在拉这个文件，不是「检查小助手正在读」——
	// 原句「正在读这一稿的检查记录」紧挨着顶栏那句「🔎 N 个小助手在跑」，读者只会读成后者。
	// 2026-10-12 代理判读（3 个独立观察者 **3/3**）把 2026-10-08 那版「记录读取中…」也否了——
	// 判据逐字指着三样：**进行时动词 ＋ 无主语 ＋ 省略号**。
	// 2026-10-25 第二轮代理判读又咬出两处，都是**词法歧义**，不是口味：
	//   ① 动词留在 `检查：` 标签**后面** ⇒ 3 个观察者里 1 个读成「**检查**还在读」（标签在左、
	//      动词在右，读者分不出谁是主语）；
	//   ② 去掉动词后写「`检查：记录未知`」⇒ 另一个观察者把 **`记录` 读成了动词**（「检查正在记录」）——
	//      「记录」在中文里名动同形，紧跟在一个标签后面时动词读法更顺手。
	// ⇒ 两处一起治：**标签用词表里的复合名词**（`CONTEXT.md`「界面用词表」：`审计文件` → **检查记录**），
	// 于是「检查记录：」整体是名词、后面紧跟的 `未知` 只能是状态词，没有动词可挂。
	// 用「未知」这一档而不是「未到/还没有」——后两种都带「在等它来」的意思，而本仓已经有一族
	// 同形的读数（`book-readings.js` 的「字数未知」「知识点数未知」：读不到就停在未知，⛔ 不写 0）。
	// 与下一格（`null` ＝「这一稿还没有检查记录」）仍是两种可分辨的事实：
	// 这一格是「还不知道有没有」，那一格是「这一稿没有」——⛔ 不许合并（合并＝替文件下断言）。
	switch (auditDisplayState(auditText)) {
		case "unknown": return "🧪 检查记录：未知";
		case "missing": return "🧪 检查：这一稿还没有检查记录";
		case "passed": return "🧪 检查：通过（没有待完善项）";
		case "issues": return "🧪 检查：有几处待完善（可以让 AI 改）";
		default: return "🧪 检查：记录格式待完善";
	}
}

/**
 * 审计记录 → 界面那五档**唯一判据**（徽章 `auditBadgeText` 与卡头事实句 `goldDraftHeadFacts` 共用）。
 *
 * 票 `audit-gate-semantics/01`：**不再读 `audit.passed` 自报值**——它由 `auditVerdict` 从 issues
 * （level＋status）现算；缺 status／accepted-risk 缺理由的旧记录归 `malformed`（说「记录格式待完善」，
 * ⛔ 不许说「通过」）。五档：`unknown`（还没读到）／`missing`（没有记录）／`malformed`（格式待完善）／
 * `passed`／`issues`（现算未通过）。
 *
 * @param {string|undefined|null} auditText
 * @returns {'unknown'|'missing'|'malformed'|'passed'|'issues'}
 */
function auditDisplayState(auditText) {
	if (auditText === undefined) return "unknown";
	if (auditText === null) return "missing";
	if (typeof auditText !== "string") return "malformed";
	try {
		const audit = JSON.parse(auditText);
		if (audit === null || typeof audit !== "object" || Array.isArray(audit)) return "malformed";
		if (typeof audit.passed !== "boolean" || !Array.isArray(audit.issues)) return "malformed";
		const verdict = auditVerdict(audit);
		if (verdict.problems.length > 0) return "malformed";
		return verdict.passed === true ? "passed" : "issues";
	} catch {
		return "malformed";
	}
}

// ── 票 `ui-display-redesign/07`：两屏卡头的**派生事实句**（纯函数，判据直调）──────────────

// ── 票 `ui-display-redesign/17`（收口 review S1／S2）：站 9 那两个读数的**唯一派生**──────────
//
// 病（S1）：`Number(null) === 0` ⇒ `goldMeasuredHanzi` 读不到时印成「样章实测 0 汉字」——
//   spec §7「缺数据登记 1」逐字写着 ⛔ 不显示 0；0 是**一个读数**，不是「没读到」。
// 病（S2）：事实句的 P 取「其余章现有目标之和」，而同屏标定行的 P 取「按实测比例外推」——
//   同一个屏上两个「合计约」，数不一样（画廊实读 11000 vs 162）。spec §2.8 的示例
//   （1980 → 3960）明写那是**实测×章数外推** ⇒ 两处必须同一来源；拿现有目标之和冒充它是编数。

/** `meta.goldMeasuredHanzi` → 实测汉字数；**读不到（null／undefined／空串／非有限数）⇒ `null`**。
 *  ⚠️ 这是 S1 的唯一修法：`Number(null)` 是 0，不能拿它当「读到了 0 个汉字」。 */
function measuredHanziOf(meta) {
	const raw = meta?.goldMeasuredHanzi;
	if (raw === null || raw === undefined || raw === "") return null;
	const value = Number(raw);
	return Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * 站 9 的「按实测标定外推」读数——**事实句与标定行共用的唯一派生**（票 17 · 收口 review S2）。
 *
 * `projected ＝ round(其余各章现有目标之和 × 实测 / 母版章原定)`：母版章实际写了多少，其余章就
 * 照这个比例算（与标定行逐字同一句口径）。**任一前提不成立 ⇒ `null`**（⛔ 不拿现有目标之和顶替、
 * ⛔ 不编数）：读不到实测／母版章原定未定或 ≤0／只有母版章一章／其余章目标合计 ≤0。
 *
 * @param {object} meta 书级账本视图
 * @returns {{measured: number, restCount: number, projected: number}|null}
 */
export function goldRestProjection(meta = {}) {
	const chapters = Array.isArray(meta?.outline?.chapters) ? meta.outline.chapters : [];
	const measured = measuredHanziOf(meta);
	if (measured === null) return null;
	const goldNo = goldChapterNo(meta);
	const goldOriginal = Number(chapters[goldNo - 1]?.targetWords);
	if (!Number.isFinite(goldOriginal) || goldOriginal <= 0) return null;
	const rest = chapters.filter((_, index) => index + 1 !== goldNo);
	if (rest.length === 0) return null;
	const fallback = Number.isFinite(meta?.targetWords) ? Number(meta.targetWords) : 0;
	const restOriginal = rest.reduce(
		(sum, chapter) => sum + (Number.isFinite(chapter?.targetWords) ? chapter.targetWords : fallback),
		0,
	);
	if (restOriginal <= 0) return null;
	return { measured, restCount: rest.length, projected: Math.round((restOriginal * measured) / goldOriginal) };
}

/**
 * 站 8 卡头事实句：`第 N 稿 · <检查结论> ·<N> 条待处理意见。`（spec §2.7 第 2 块）。
 *
 * 三件事实都是**现算**的：稿次＝`goldDraftVersion`、检查结论＝`goldAuditText` 的既有三态口径
 * （与 `auditBadgeText` 同一份输入、同一套「没读到／没有／读到了但格式坏」的分档）、
 * 待处理意见数＝`meta.goldOpinions` 里 `status === 'pending'` 的条数。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：`goldAuditText` 只认「读到了的字符串」这一档里的
 * `passed` 布尔；`null`／`undefined` 各自一格（与徽章口径相同）。检查结论的措辞与徽章**有意
 * 各写一份**——徽章是「🧪 检查：…」前缀的读数，事实句是屏级一句摘要，两处都不是词表出口。
 * ⚠️ 但「各写一份」只指**句式**，不指**事实**：`undefined` 那一格 2026-10-25 起两处都是
 * 「未知」这一档（词序按各自句式调），因为它们是同一屏、同一份输入的同一件事实——
 * 一处说「读取中」、一处说「未知」，同屏就是自相矛盾。
 * ⚠️ 那一格**一个动词都不留**（理由见 `auditBadgeText` 上方那段：`检查：` 标签后面的动词
 * 会被读成「检查在做那件事」）。
 *
 * @param {{ goldDraftVersion?: number, goldAuditText?: string|null, opinions?: Array<{status?: string}> }} [facts]
 * @returns {string}
 */
export function goldDraftHeadFacts({ goldDraftVersion, goldAuditText, opinions } = {}) {
	// 票 `ui-display-redesign/17`（收口 review S3）：稿次**不是正安全整数时不编数**——
	// 修前默认印成「第 1 稿」（编一个不存在的稿次）；现在整段省掉，保留检查结论与意见数。
	const versionKnown = Number.isSafeInteger(goldDraftVersion) && goldDraftVersion > 0;
	const pending = (opinions ?? []).filter((o) => o?.status === "pending").length;
	// 票 gold-display-period/01（2026-10-25）：`undefined` 那格与徽章 `auditBadgeText(undefined)`
	// **同一口径**——原句「检查记录读取中」是进行时＋无主语（3/3 判「读者会等」）；中间两版分别被
	// 读成「检查还在读」（动词在标签后）与「检查正在记录」（`记录` 名动同形）⇒ 这一版走同族既有那一档
	// （「未知」：读不到就停在未知，⛔ 不编一个状态），且**一个动词都不留**。
	const conclusion =
		{
			unknown: "未知",
			missing: "检查记录还没出来",
			malformed: "检查记录格式待完善",
			passed: "检查通过",
			issues: "有几处待完善",
		}[auditDisplayState(goldAuditText)] ?? "未知";
	return `${versionKnown ? `第 ${goldDraftVersion} 稿，` : ""}${conclusion}，${pending} 条待处理意见。`;
}

/**
 * 站 9 卡头事实句：`样章实测 N 汉字 · 其余 M 章合计约 P 汉字 · 还没定稿。`（spec §2.8 第 2 块）。
 *
 * 数字**全部现算**，⛔ 不抄示例：
 *  · N＝`meta.goldMeasuredHanzi`（**读不到 ⇒ 整段省掉**，⛔ 不印「0 汉字」——收口 review S1）；
 *  · M／P＝除母版章（`goldChapterNo`）以外的章数与**按实测比例外推**的合计
 *    （`goldRestProjection`：与同屏标定行**同一个派生来源**——收口 review S2；前提不成立 ⇒ 整段省掉，
 *    ⛔ 不拿「其余章现有目标之和」冒充外推值）。
 * 读不到哪件就不说哪半句（不编数）：最后永远以「还没定稿。」收尾（这一屏就是定稿之前的那一步）。
 *
 * ⚠️ 与下面「标定行」（`样章实测 N 汉字。按样章实测与原定的比例外推，其余 M 章合计约 P 汉字——要调吗？`）
 * **是同一个 P**（票 17）：两处都调 {@link goldRestProjection}，所以同屏不会出现两个不同的
 * 「合计约」。
 */
export function goldMeasureHeadFacts(meta = {}) {
	const measured = measuredHanziOf(meta);
	const projection = goldRestProjection(meta);
	const parts = [];
	if (measured !== null) parts.push(`最佳范例章实测 ${measured} 汉字`);
	if (projection !== null) parts.push(`其余 ${projection.restCount} 章合计约 ${projection.projected} 汉字`);
	parts.push("还没定稿");
	return `${parts.join("，")}。`;
}

// ── 谈判桌·展示期（票 walkthrough-2026-10/04，2026-10-06 裁决甲） ───────────────
//
// **展示期**：这一章的稿子已经在盘上（`engine.js:1730-1733` 只看文件在不在就置 `awaiting-gold`，
// 于是稿子连同验收面一起提前亮给用户——这一步**是有意的**，出处 `gold-revision-flow/02` 的
// Out of scope：它逐字把「未审稿不进阅读器」那道门判为不可达、不新增），**而这一稿的检查记录
// 还没落盘**（审计小助手还在跑）。
//
// 裁决甲要的两件事都落在这里：
//   ① 一句**明确状态**（不新造第四个状态词：状态词那一半归状态条／活性行出「我正在做」，
//      判据 `view-rules.goldDraftDisplayed`；这一句是**不占三词名额的 fact line**，
//      与「上下文已用 51%」同一类登记，见 `CONTEXT.md`「工作台状态词」）；
//   ② 「暂不可定稿」落在**定稿键的能力**上：禁用 ＋ 把理由写在脸上（⛔ 不许亮着点了无效）。
//
// ⛔ 这里**不是**乙：判据只问「这份检查记录读得到／读不到」，**不比任何文件时间**，
// 也**不改** `engine.js:1730-1733` 那一道闸门（乙要先推翻本裁决）。

/** 「这一稿已经在盘上」的**唯一判据**（读回来了、且不是空文件）——展示期那句与意见单标签共用它。 */
export function goldDraftLanded(draftText) {
	return typeof draftText === "string" && draftText.trim() !== "";
}

/**
 * 展示期那句**唯一**的状态：卡内 fact line（票 `walkthrough-2026-10/04` 裁决甲）。
 *
 * ⚠️ 票 `ui-display-redesign/07`（spec §7.7#4）**取代** `gold-display-period/02` 的 UI 落法：
 * 原先返回的 `finalizeReason`／`rewriteReason` 两句按键盘理由**整段删除**——两颗键仍禁用，
 * 但禁用的**唯一解释**是这一句 fact line。所以本函数只回 `{ factLine }`；⛔ 别再长出第二句。
 *
 * `auditText` 的形状沿用同一条通道的既有口径（见 `auditBadgeText` 上方那段）：
 * `undefined`＝还没读到、`null`＝没有／读不到、字符串＝读到了。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：`null` 这一格把「文件不在盘上」与「这次读失败」算成同一件事
 * （与徽章「这一稿还没有检查记录」同一口径）；「文件在盘但内容为空」**不算**展示期——那一格
 * 徽章说的是「记录格式待完善」，两句话不许在同一张卡上各说各的。
 *
 * @param {{ draftText?: unknown, auditText?: unknown }} facts
 * @returns {{ factLine: string } | null} 不是展示期时回 `null`（照旧放行）
 */
export function goldDisplayPeriod({ draftText, auditText } = {}) {
	if (!goldDraftLanded(draftText)) return null; // 还没稿子：验收面此刻也没东西可展
	if (auditText !== null) return null; // 记录在盘（或还没读到）⇒ 照旧放行，不加任何新闸
	// 票 gold-display-period/01：原句「**这一稿还在检查**，暂不可定稿」是**关于进程的断言**，
	// 而这条判据只问**文件**（检查记录读不到）——检查小助手崩了、被暂停收走了、或这本书走了
	// `engine.js` 的 `auditWaived` 豁免时，它照旧说「还在检查」，用户会一直等一个不存在的人。
	// 改成它真知道的那件事（记录还没出来）。
	return { factLine: "这一稿的检查记录还没出来，暂不可定稿" };
}

// ── 谈判桌·总装（稿页签 + 读/对比 + 意见单 + 定稿区） ────────────────────────

/**
 * 谈判桌总装（`GoldTable`）的 props 契约（票 `workbench-card-contract` 02）
 *
 * **这张卡吃什么**：八件——书级只读两件（`meta` / `goldDrafts`）、书级派生两件
 * （`goldDraftVersion` / `goldAuditText`）、壳级可变一件（`busy`）、壳注入的回调三件
 * （`postAction` / `fetchText` / `onSuggestWords`）。
 * 收编前由 `client-entry.js:1929-1964` 逐项手抄。
 *
 * ⚠️ **票 `gold-finalize-blocked/01` 从这里拿掉了一件、又加回了一件**：原先本卡在挂载 effect 里
 * 自己去读 `工作区/audit-NN.md`（经 `fetchText` → `/textbook/file`），而那份文件被判 `'machine'`
 * ⇒ 该路由对它**必然 403**，检查记录被记成「没有」，卡永远停在展示期、两颗键永远灰、刷新无效。
 * 现在检查记录原文由壳随 payload 递进来（`goldAuditText`），本卡**不再读机器产物**；
 * `fetchText` 仍然留着，但只服务正文（当前稿与旧稿页签、对比对象）。
 *
 * ### 必填五项的判据：卡内**没有兜底**
 *
 * · `meta` —— `:1404` 的 `meta.goldOpinions` 与 `:1405` 的 `goldChapterNo(meta)` 都**没有** `?.`：
 *   缺了当场 TypeError，连降级的机会都没有。
 * · `goldDraftVersion` —— 缺了 `Math.min`（`:1427`）算出 `NaN`，`pathOf` 找不到路径，`:1438` 永远
 *   是「加载中…」——**不崩，但整张卡的主区静默死在加载态**，而这正是本票要拆的那个形状。
 * · `postAction` —— 本卡所有业务动作都从它发：`:1456`（gold-opinion）、`:1571` 与 `:1590`
 *   （gold-opinion-revoke）、`:1593`（gold-revise）、`:1601`（gold-approve）、`:1605`
 *   （gold-target-words-set）。⚠️ **本文件里没有一处 `if (postAction === undefined)` 守卫**——
 *   `grep -n "postAction" src/ui/gold-table.js` 的 7 处命中里，1 处是解构、6 处是调用，**没有一处
 *   是守卫**。（票 01 查实的那三处 `=== undefined` 守卫在 `chapters-map.js:671/780/793`，
 *   **不在本文件**；那张卡才需要「守卫保留」的说明，本卡没有守卫可保留。）缺了它 = 用户点段旁那颗
 *   键当场 TypeError。
 * · `fetchText` —— 挂载 effect 里发一次（`:1413` 当前稿），换页签/对比态各再发一次。缺了当场
 *   TypeError，屏上永远停在「加载中…」。
 * · `onSuggestWords` —— 它不是本卡调的，是**转手**给 `GoldFinalize`（`:1603`），而那边 `:850`
 *   在「✨ AI 建议」那颗键的点击回调里 `Promise.resolve(onSuggestWords())`，**同样没有守卫**。
 *   缺了它 = 那颗键一点就崩。
 *
 * ### 不列必填的三件，漏了会怎样静默降级
 *
 * · `goldDrafts` —— `:1410` 的 `?? []` 兜底。漏了不崩，是**旧稿页签点了停不住**：`:1448` 算出的
 *   路径是 `null`，正文又回到「加载中…」。壳那一份在无当前书时是模块级单例 `NO_GOLD_DRAFTS`
 *   （`client-entry.js:467`），缺省三规则第 3 条要的正是这个「模块级同一引用」。
 * · `busy` —— 只作 `disabled` 用（`:1568` / `:1588` / `:1599` 三处转手给下游）。漏了 = 三处下游
 *   都不置灰，AI 还在写的时候用户能重复发意见、重复定稿。
 * · `goldAuditText` —— **三态里 `undefined` 那一格**（＝还没读到）**照旧放行**：漏了不崩、也不挂
 *   展示期，是**定稿键照旧可点**。这是有意的取舍（与 `goldDisplayPeriod` 的既有口径同源：
 *   读不出不是「没有」）——漏传的代价落在服务端那道就绪判据上（真缺检查记录时 `gold-approve`
 *   当场拒收并说明缺哪份文件），**不是**一颗永远灰着、用户猜不出为什么的键。壳侧
 *   `client-entry.js` 的 `goldAuditText` 在无当前书时传 `undefined`。
 *
 * ### 两处不许被「顺手统一」的地方
 *
 * 1. **`fetchText` 是产物读取，不是宿主钩子。** 它就是 `ui/artifact-read.js` 的 `readText`
 *    （票 03 收编的那一份），照常进 `fromBook`；它不匹配 `/^use[A-Z]/`，这份契约里也没有任何
 *    宿主钩子下沉。⚠️ 壳那侧 `client-entry.js:1957-1962`「`fetchText` 刻意不加 capture 守卫」
 *    那段注释是**契约的一部分**（票 05 的隔离边界：StrictMode 的 effect 重放会让「挂载时 capture
 *    的守卫」当场失效，正文被换成一条错误条），**一个字不许动、也不许因为收编而顺手统一掉**。
 * 2. **段旁那些键（标意见／撤回／让 AI 改／定稿／写逐章字数）不是本卡的 props。** 它们是本卡用
 *    `postAction` 包出来的闭包（`:1455-1462` 的 `addOpinion` 等），壳只递一个会发动作的函数进来
 *    ——这正是收编想要的形状：壳那份袋子从「逐项抄」变成「递一个发动作的函数」。
 */
export const goldTableView = defineCardView({
	card: "GoldTable",
	fromBook: [
		"meta",
		"goldDrafts",
		"goldDraftVersion",
		"goldAuditText",
		"busy",
		"postAction",
		"fetchText",
		"onSuggestWords",
	],
	required: ["meta", "goldDraftVersion", "postAction", "fetchText", "onSuggestWords"],
	defaults: {},
	// 这张卡同样没有需要现算的表达式：`onSuggestWords` 那个动作信封（`uiCallable`、capture 守卫）
	// 留在壳里——`src/ui/` 跨域协作只走 public exports（AGENTS.md「Frontend layout」），不把它拖进来。
	derive: () => ({}),
});

// ── 站 8 屏：这一稿行不行（票 `confirm-points-redesign-build/08`）──────────────
/**
 * 站 8「这一稿行不行」**一屏**（口径出处＝规划票 `confirm-points-redesign/07` 的 `## Answer`
 * §2／§3／§5；拆屏的实现落在 [`GoldTable`] 那个总装那一层）。
 *
 * **这一屏装什么**：稿页签（第 N 稿／旧稿）· 正文（读）· 对比 · 意见单（整章意见／段落意见／
 * 撤回）·「让 AI 改」，**键行＝「✅ 就用这一稿」＋「🔁 不满意，重写这一章」**两颗。
 * 谈判桌（定体量）与定稿键**不在这里**——它们住站 9 那一屏（[`GoldFinalize`]）。
 *
 * ⚠️ **为什么拆**（票 07 §0／§1）：今天这两件事同屏同卡，且时序是「谈判桌（写回）→ 定稿」；
 * 新结构是「**这一稿行 → 谈判桌 → 定稿**」——倒置是「站 9 吃 `决策/08.json`」那张边表的必然结果。
 * **有意付的代价**：用户要**两屏各点一下**，换来的是「**稿子行、但字数还要调**」这个中间态。
 * 本屏把这句话**写在界面上**（见下面那两行小字），⛔ 不藏进文档。
 *
 * ⚠️ **展示期**（票 07 §5）：`goldDisplayPeriod` 一个字不改，落在**这一屏**——
 * 稿子已在盘上、检查记录还没出来时，这一屏照旧可见（读／对比／意见单都能用），
 * 只是**两颗键都禁用 ＋ 理由写在脸上**（`finalizeReason` 挂拍板键、`rewriteReason` 挂重写键）。
 * ⚠️ 票面点名的那条实现面：⛔ **不许漏出一个能点的窗口**——两颗键、以及重写那层的「确认重写」，
 * 共**三处**全部吃同一个 `displayPeriod !== null`。
 */
export function GoldDraftStage(props) {
	const {
		meta,
		goldDrafts,
		goldDraftVersion,
		goldAuditText,
		busy,
		postAction,
		fetchText,
		// 站 8 拍板之后这一屏还能回来（「📖 回看这一稿」）——`reviewing` 只影响抬头那半句。
		reviewing = false,
	} = props;
	// 这一稿的检查记录原文：**随 payload 下发**，不再由本卡去读。
	// ⚠️ 原先这里是挂载 effect 里的一次 `fetchText('工作区/audit-NN.md')`——那条路走
	// `/textbook/file`，而该路由只放行 `productOpenMode === 'preview'` 的产物，`工作区/audit-NN.md`
	// 被判 `'machine'` ⇒ **每次必然 403**，`.catch` 把它记成 `null`，卡于是永远停在展示期、
	// 两颗键永远灰、**刷新无效**（票 `gold-finalize-blocked/01` 的病因，2026-02-11 真机实撞）。
	// 现在它和知识地图／章节安排同一条路（`/textbook/events` 的 `goldAudit`）。
	// 三态口径一个字不改：`undefined`＝还没读到、`null`＝没有／读不到、字符串＝读到了。
	const auditText = goldAuditText;
	const [texts, setTexts] = useState({});
	const [view, setView] = useState({ tab: goldDraftVersion, mode: "read" });
	const [loadError, setLoadError] = useState(null);
	// 站 8 的负向出口那层**确认**（「🔁 不满意，重写这一章」→「确认重写」）。
	// ⚠️ 票 07 §3：重写＝站 8 **内部**再拍一次（`决策/08.json` 的 `version` ＋1），⛔ 不新开确认点。
	const [confirming, setConfirming] = useState(null); // 'rewrite' | null
	const opinions = meta.goldOpinions ?? [];
	const goldNo = goldChapterNo(meta);
	// 当前稿路径（票 `depth-review-2026-10/05`：构造只此一份，住在 `domain-rules.chapterRel`；
	// 此前这里内联一份模板，与客户端另外三处各拼各的）。⚠️ `工作区/audit-NN.md` 那一行**还没有**
	// 收编（它是 `audit` 族的契约，不是本章正文的形状），两行别看成同一件事。
	const currentPath = chapterRel(goldNo);
	const pathOf = (version) =>
		version === goldDraftVersion
			? currentPath
			: ((goldDrafts ?? []).find((d) => d.version === version)?.path ?? null);
	const load = (path) => {
		if (texts[path] !== undefined) return;
		fetchText(path)
			.then((t) => setTexts((prev) => ({ ...prev, [path]: t })))
			.catch((err) =>
				setLoadError(String(err instanceof Error ? err.message : err)),
			);
	};
	useEffect(() => {
		load(currentPath);
		// ⚠️ 这里**原先还有一次** `fetchText('工作区/audit-NN.md')`（把结果写进 `setAuditText`）——
		// 那正是票 `gold-finalize-blocked/01` 的病因那一步：该路径被判 `'machine'`，
		// `/textbook/file` 对它必然 403，于是这次读取**每次都失败**（不是缓存、刷新没用），
		// 检查记录被记成「没有」⇒ 卡永远停在展示期。现在它随 payload 来（见函数头 `goldAuditText`），
		// 本卡不再自己去读机器产物。
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	// 展示稿：当前稿或旧稿
	const showTab = Math.min(view.tab, goldDraftVersion);
	const showPath = pathOf(showTab);
	// 换稿也要**加载**（2026-09-23 代码审查补）：原来只有挂载时加载当前稿（上面那个 effect 的
	// `load(currentPath)`）与对比态加载对照稿（下面那个 effect），谁都没加载"切过去的那一稿"——
	// 于是点「第 N 稿」切到旧稿后 `showText` 恒为 `undefined`，正文永远停在「加载中…」。
	// spec §3 转场矩阵的 `E 焦点区·「现在」 × 页内换内容` 格（「点 `第 N 稿` → 正文换成那一稿」）
	// 此前只有渲染级覆盖（只断稿页签在不在），这条漏网正是"渲染级冒充点击级"的典型。
	useEffect(() => {
		if (showPath !== null) load(showPath);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [showPath]);
	const showText = showPath === null ? null : (texts[showPath] ?? null);
	// 对比对象：当前稿比上一稿；旧稿比它的下一稿
	const compareWith =
		view.mode === "compare"
			? showTab === goldDraftVersion
				? showTab - 1
				: showTab + 1
			: null;
	const comparePath = compareWith !== null ? pathOf(compareWith) : null;
	useEffect(() => {
		if (comparePath !== null) load(comparePath);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [comparePath]);
	const compareText =
		comparePath === null ? null : (texts[comparePath] ?? null);
	// 票 gold-revision-flow/02：徽章取词走那个纯函数（三态如实说，缺文件不说「已附」）。
	const auditBadge = auditBadgeText(auditText);
	// 票 walkthrough-2026-10/04（裁决甲）：展示期那两件事取一次、共用一处判据——
	// `draftLanded`（这一稿在不在盘上）既喂展示期那句，也喂意见单那条标签（B6）；
	// ⚠️ 只看**当前稿**这一格（`currentPath`），不看用户翻到的旧稿页签。
	const draftLanded = goldDraftLanded(texts[currentPath]);
	const displayPeriod = goldDisplayPeriod({ draftText: texts[currentPath], auditText });
	const addOpinion = (kind, wish, para, hint) => {
		void postAction({
			action: "gold-opinion",
			kind,
			wish,
			...(para !== null ? { para } : {}),
			...(hint ? { hint } : {}),
		});
	};
	const tabBtn = (v) =>
		createElement(
			"button",
			{
				key: v,
				style: S.projectBtn(view.tab === v),
				onClick: () => setView({ tab: v, mode: "read" }),
			},
			`第 ${v} 稿${v === goldDraftVersion ? "（最新）" : ""}`,
		);
	return createElement(
		"div",
		null,
		// 展示期那句**明确状态**（票 walkthrough-2026-10/04 裁决甲）——它现在住在**站 8 这一屏**
		// （票 07 §5：展示期落在站 8 之前：这一屏可见、两颗键禁用 ＋ 理由写在脸上）。
		displayPeriod !== null
			? createElement(
					"p",
					{
						style: {
							margin: "0 0 6px",
							padding: "4px 8px",
							background: "var(--dsw-alias-bg-layer-1)",
							borderRadius: "8px",
							border: "1px solid var(--dsw-alias-border-l2)",
							fontSize: "12px",
						},
					},
					displayPeriod.factLine,
				)
			: null,
		goldDraftVersion > 1
			? createElement(
					"div",
					{
						style: {
							display: "flex",
							gap: "6px",
							flexWrap: "wrap",
							marginBottom: "6px",
						},
					},
					Array.from({ length: goldDraftVersion }, (_, i) => tabBtn(i + 1)),
					showTab === goldDraftVersion
						? createElement(
								"button",
								{
									style: S.smallLink,
									onClick: () =>
										setView({
											tab: showTab,
											mode: view.mode === "compare" ? "read" : "compare",
										}),
								},
								view.mode === "compare"
									? "只看这一稿"
									: `和第 ${goldDraftVersion - 1} 稿对比`,
							)
						: createElement(
								"button",
								{
									style: S.smallLink,
									onClick: () =>
										setView({
											tab: showTab,
											mode: view.mode === "compare" ? "read" : "compare",
										}),
								},
								view.mode === "compare"
									? "只看这一稿"
									: `和第 ${showTab + 1} 稿对比`,
							),
				)
			: null,
		loadError !== null
			? createElement("p", { style: S.error }, `稿子打开失败：${loadError}`)
			: null,
		createElement(
			"div",
			{ style: { margin: "6px 0" } },
			showText === null
				? createElement("p", { style: S.hint }, "加载中…")
				: view.mode === "compare" && compareText !== null
					? createElement(
							"div",
							null,
							createElement(
								"p",
								{ style: S.hint },
								"想在这一稿上继续挑毛病？点「只看这一稿」。",
							),
							createElement(GoldCompare, {
								oldText: showTab === goldDraftVersion ? compareText : showText,
								newText: showTab === goldDraftVersion ? showText : compareText,
								opinions,
							}),
						)
					: createElement(GoldReader, {
							text: showText,
							opinions,
							busy,
							onOpinion: addOpinion,
							onRevokeOpinion: (id) => {
								void postAction({ action: "gold-opinion-revoke", id });
							},
							readOnly: showTab !== goldDraftVersion,
							// 票 `demo-channel-full/25`：确认层那句话的取值要认得出演示书（本卡手上的就是这一份）。
							meta,
						}),
			showTab !== goldDraftVersion && view.mode === "read"
				? createElement(
						"p",
						{ style: { fontSize: "12px", opacity: 0.7, margin: "4px 0" } },
						// 票 10（判定四①）：与上面「想在这一稿上继续挑毛病？点『只看这一稿』」是同一件事
						// 的两种说法（一条讲怎么改、一条讲为什么不能改），收敛成这一句——它信息量大
						// （说清了"旧稿只能回顾"这个原因）。两处不会同屏（mode 互斥），故只留一份字。
						"这是旧稿，只能回顾；要挑毛病请回到「最新」那稿。",
					)
				: null,
		),
		createElement(GoldOpinionList, {
			opinions,
			busy,
			// 票 walkthrough-2026-10/04（B6）：标签与提示吃的是**同一件事实**（这一稿在不在盘上）
			draftLanded,
			// 票 gold-display-period/01＋02：展示期**两件事共用这一位**——① `pending > 0` 时
			// 提示那一句必须说话（`DISPLAY_PERIOD_PENDING_HINT`）；②「让 AI 照这些改」那颗键禁用。
			displayPeriod,
			onRevoke: (id) => {
				void postAction({ action: "gold-opinion-revoke", id });
			},
			onRevise: () => {
				void postAction({ action: "gold-revise" });
			},
		}),
		// ── 拆屏小字〔常显／两键上方〕（票 `ui-display-redesign/07` §2.7 第 9 块）──────────────
		// ⚠️ **有意付的代价**照实说在界面上（票 07 §8 末）：拆开之后要两屏各点一下。
		createElement(
			"p",
			{ style: { ...S.hint, margin: "8px 0 0" } },
			"「就用这一稿」只表态这一稿行；字数还要在下一屏另拍一次。",
		),
		// ── 站 8 的两颗键（票 07 §3；⛔ 文案不带「定稿」二字——定稿是站 9 之后那一下）──────────
		// 展示期禁用面**同时**盖住这两颗 ＋ 下面重写那层的「确认重写」＝三处，⛔ 不许漏出一个
		// 能点的窗口（票面点名的那条实现面）。
		// 票 `ui-display-redesign/07`（spec §2.7 第 8 块，取代 `gold-display-period/02` 的 UI 落法）：
		// 原先分挂两颗的按键盘理由**整段删除**——禁用的唯一解释是顶部那条 fact line。
		createElement(
			"div",
			// 票 `walkthrough-fixes/38`：这两颗（就用这一稿／不满意重写）是站 8 的**主推进键行**——
			// 它跟着卡片滚，而站 8 的正文（spec §2.7 第 6 块「首屏、不折叠」426px）一铺，初始不滚动时
			// 主键就整颗落在焦点区可视带下方（实测键顶距带顶 679.7px、带高 425.5px）。
			// ⇒ 用公共那一格 `S.stickyActions` 贴住带底。
			// ⚠️ 同屏**不新增**任何可点区域：贴上来的就是**本来这两颗**（同一颗 `<button>`、同一句文案、
			// 同一个 `onClick`），只是让这一行在卡滚时停在带底。⛔ 不是票 18 删掉的那条「在卡外另起一条、
			// 条上放同名副本」的吸底条——「同一个放行动作同屏只许一颗键」那条判据照旧成立。
			// 口径与「为什么不是把卡自动滚进去」（底对齐会把读稿的用户拽到几千字下面）写在 `styles.js`
			// 的 `stickyActions` 头注释里。
			{ style: { ...S.stickyActions, display: "flex", gap: "8px", marginTop: "8px", alignItems: "center", flexWrap: "wrap" } },
			createElement(
				"button",
				{
					style: S.disabled(S.bigBtn(true), busy || displayPeriod !== null),
					onClick: () => void postAction({ action: "gold-draft-approve", approved: true }),
					disabled: busy || displayPeriod !== null,
					// 票 `auto-walkthrough/04`：关键键的语义钩子（站 8 这一稿行不行）。
					"data-gold-approve": "1",
				},
				GOLD_DRAFT_ACCEPT_LABEL,
			),
			createElement(
				"button",
				{
					style: S.disabled(
						{
							...S.bigBtn(true),
							background: "transparent",
							color: "var(--dsw-alias-state-error-primary)",
							padding: "8px 10px",
						},
						busy || displayPeriod !== null,
					),
					onClick: () => setConfirming("rewrite"),
					disabled: busy || displayPeriod !== null,
				},
				GOLD_DRAFT_REWRITE_LABEL,
			),
		),
		// ── 重写后果＋确认层〔隐〕（票 `ui-display-redesign/07` §2.7 第 11 块）──────────────
		// 后果句原先常显在两键下方；票 07 把它收进确认层——没点重写键时整块不出现。
		confirming === "rewrite"
			? createElement(
					"div",
					{
						style: {
							...S.card,
							borderColor: "var(--dsw-alias-state-error-primary)",
							marginTop: "8px",
						},
					},
					createElement(
						"p",
						{ style: { ...S.hint, margin: "0 0 6px" } },
						// 票 14（承诺账 A2）＋票 `demo-channel-full/26`：两取值，出口＝`view-rules.goldRewriteHint`。
						goldRewriteHint(meta),
					),
					createElement(
						"p",
						{ style: { margin: "0 0 6px" } },
						// 票 14（承诺账 A2）：归档是「尽力」语义，「不丢」是全集承诺——收掉。
						// 票 `demo-channel-full/26`：演示取值只把「AI」换成「演示书自己」（重写真发生）。
						goldRewriteConfirmNote(meta),
					),
					createElement(
						"div",
						{ style: { display: "flex", gap: "8px" } },
						createElement(
							"button",
							{
								style: S.disabled(
									{
										...S.bigBtn(true),
										background: "transparent",
										color: "var(--dsw-alias-state-error-primary)",
									},
									busy || displayPeriod !== null,
								),
								onClick: () => void postAction({ action: "gold-draft-approve", approved: false }),
								// 展示期里确认层这颗与外面那颗同一件事实（`rewriteReason`）。
								disabled: busy || displayPeriod !== null,
							},
							"确认重写",
						),
						createElement(
							"button",
							{ style: S.smallLink, onClick: () => setConfirming(null) },
							"再想想",
						),
					),
				)
			: null,
	);
}

// ── 谈判桌·总装（站 8／站 9 **两屏**的切换） ─────────────────────────────────
/**
 * 总装：**站 8 一屏、站 9 一屏**（票 `confirm-points-redesign-build/08`）。
 *
 * ## 两屏怎么切换（机器上**没有**新状态值）
 *
 * ⛔ **不加新的 `awaiting-*` 值**（票 07 §4，Q11 甲）：`awaiting-gold` 照旧一个值覆盖两站，
 * 两站的区分由**账本折出**——服务端把 `工作区/决策/08.json`／`09.json` 折成
 * `meta.stationDecisions`（`workflow.js` 的 `stationDecisionsOf`，照关卡 `foldGate` 那一档先例）。
 *   · **站 8 未拍板**（`决策/08.json` 不在，或 `approved !== true`）⇒ 只出**站 8 那一屏**，
 *     站 9 屏（含定稿键）**整块不出现**。
 *   · **站 8 已拍板** ⇒ 出**站 9 那一屏**；「📖 回看这一稿」把站 8 那一屏拉回来
 *     （同一个组件、同一套读／对比区，⛔ 不复制正文）——站 8 **可重拍**（再拍一次就是
 *     `决策/08.json` 的 `version` ＋1，⛔ 不新开确认点）。
 *
 * ## 「这一稿换了」只是**软提示**
 *
 * 站 8 重拍之后站 9 那份体量结论就旧了——界面提示一句（`DRAFT_CHANGED_HINT`），
 * ⛔ **机器不给硬边**：不打回、不拦（票 07 §4，Q14 甲档；「重做上游把下游打回」已裁不做）。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：`meta.stationDecisions` 今天只折**站 8／9**（本票射程）；
 * 这个键不在 ⇒ 一律读成「**没拍过板**」（拦着不放行，不会误判成拍过）。
 */
export function GoldTable(props) {
	const {
		meta,
		goldDrafts,
		goldDraftVersion,
		goldAuditText,
		busy,
		postAction,
		fetchText,
		onSuggestWords,
	} = props;
	const decisions = meta?.stationDecisions ?? {};
	const draft = decisions[8] ?? decisions["8"] ?? null;
	const measured = decisions[9] ?? decisions["9"] ?? null;
	const draftApproved = draft?.approved === true;
	const station9Decided = measured?.approved === true;
	// 站 8 重拍过（`decidedAt` 比站 9 那份晚）⇒ 站 9 的体量得重拍一次（软提示）。
	const draftChanged =
		station9Decided &&
		draftApproved &&
		typeof draft?.decidedAt === "string" &&
		typeof measured?.decidedAt === "string" &&
		draft.decidedAt > measured.decidedAt;
	// 「📖 回看这一稿」：站 9 屏上的入口，把站 8 那一屏拉回来（本地态，⛔ 不发动作、⛔ 不改盘）。
	const [reviewing, setReviewing] = useState(false);
	const showStation9 = draftApproved && !reviewing;
	const auditText = goldAuditText;
	const headFactsBase = showStation9
		? goldMeasureHeadFacts(meta)
		: goldDraftHeadFacts({
				goldDraftVersion,
				goldAuditText: auditText,
				opinions: meta?.goldOpinions ?? [],
			});
	// 票 `decision-provenance/01`：把服务端 apply 过纠偏的那一句「谁拍的」接在事实句后面。
	// 服务端给空／旧投影没有这一格 ⇒ **一个字不加**（既有夹具与旧书的长相不变）。
	const provenanceText = (showStation9 ? measured : draft)?.provenanceText ?? "";
	const headFacts = `${headFactsBase}${provenanceText === "" ? "" : ` ${provenanceText}`}`;
	return createElement(
		"div",
		{ style: S.focus },
		// ── 卡头行（票 `ui-display-redesign/07`；spec §2.7 第 1／2 块、§2.8 第 1／2 块）──────────
		// 问句＝存量 `decisionOf` 那句（逐字不改，⛔ 不进 `decisionOf` 的第二份）；事实句按这一屏的
		// 现有读数现算。⚠️ 问句的 `<strong>` **字面量必须写在本文件里**再作为 `question` 传给共用件
		// （理由见 `card-head.js` 文件头「API」：焦点区卡标题的取证面只认卡片自己文件里的字面量）。
		createElement(CardHead, {
			question: showStation9
				? createElement(
						"strong",
						{ style: CARD_HEAD_QUESTION_STYLE },
						"其余各章的字数就按这个定吗？",
					)
				: createElement(
						"strong",
						{ style: CARD_HEAD_QUESTION_STYLE },
						"这一稿能当全书的最佳范例章吗？",
					),
			facts: headFacts,
		}),
		createElement(
			"div",
			{
				style: {
					display: "flex",
					gap: "8px",
					alignItems: "center",
					flexWrap: "wrap",
					marginBottom: "6px",
				},
			},
			// ⚠️ **这一段是纯字面量、⛔ 不许写成条件表达式、也不许在实参里夹注释**：
			// `test-context-vocabulary.mjs` 的逐字性判据（票 07 契约①）从源码里抠**焦点区卡标题**
			// ——它认的是「`<strong>` 的最后一个实参是**一个**字符串字面量」且祖先是卡根（`S.focus`）。
			// 写成 `cond ? "a" : "b"`、或在实参里夹一句注释，这一串就从清单里消失（那一格当场红）。
			// 「现在是哪一屏」另起一格说（下面那个 span）。
			createElement("strong", { style: { fontSize: "13px" } }, "🤝 最佳范例章：一起定风格"),
			createElement(
				"span",
				{ style: { fontSize: "12px", opacity: 0.8 } },
				showStation9 ? "站 9：定体量" : "站 8：这一稿行不行",
			),
			createElement(
				"span",
				{ style: { fontSize: "12px", opacity: 0.8 } },
				auditBadgeText(auditText),
			),
		),
		showStation9
			? createElement(GoldFinalize, {
					meta,
					busy,
					// 票 07 §5：展示期落在**站 8 之前**——站 9 屏到得了就说明这一稿早过了检查，
					// 所以这一屏不再吃 `displayPeriod`（那颗键的能力改由 `station9Decided` 说话）。
					station9Decided,
					draftChanged,
					onReviewDraft: () => setReviewing(true),
					onApprove: (approved, targetWords) => {
						void postAction({ action: "gold-approve", approved, targetWords });
					},
					onSuggestWords,
					onWriteTargets: (targets) =>
						postAction({ action: "gold-target-words-set", targets }),
				})
			: createElement(GoldDraftStage, {
					meta,
					goldDrafts,
					goldDraftVersion,
					goldAuditText,
					busy,
					postAction,
					fetchText,
					reviewing,
				}),
	);
}
