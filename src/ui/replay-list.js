/**
 * 造书工作台 · 账本回放列表（焦点区之外那块「之前的过程」）
 *
 * ## 为什么它有自己的文件（票 `depth-review-2026-10/09`）
 *
 * 这一块与焦点区那十几张主卡是**两群观众**：焦点卡族答「此刻走到哪一步、轮到你点哪颗键」，
 * 这一块答「之前都发生过什么」。两者**零内部共享**——焦点卡族不 import 它、也不读它任何一个
 * props；它也不认任何一张焦点主卡，只吃判据与词汇（`view-rules` / `rules` / `domain-rules`）
 * ＋ react 的元素工厂。原先两者同住 `event-cards.js`，于是「回放行的取词 / 展开 / blocked 灰字」
 * 这份知识要在一个三千行文件里找，而它与同文件的焦点卡族毫无关系。
 *
 * 票 `deep-module-scan/15` 是把它从壳里搬出来（**出壳**）——那一张是起点，不是终点；本文件
 * 是那件事的第二段。
 *
 * ## 依赖方向是单向的，这件事本身要守住
 * 本文件**不 import `./event-cards.js`**。反过来那一行过渡再导出**曾经存在过、现已撤掉**
 * （票 `depth-review-2026-10/05` 收尾时壳与四组测试全部改指本文件，垫片连同「改指之后即可删」
 * 的注释一并清掉）——所以今天两个文件**互不引用**，边界是干净的。
 * ⚠️ 这条边界现在是**机器闸**不是注释：`test-card-views-coverage.mjs` 断「本文件不许 import
 * `event-cards.js`」且「`event-cards.js` 里那种过渡垫片**零处**」。
 * 方向一旦反过来——回放域回头引用焦点卡族——这份拆分就只是搬了个文件，混杂原样留着。
 *
 * ## 界面词仍走原路径
 * 上屏的字一律经 `./view-rules.js` 取（票 `deep-module-scan/05` 的取词路径闸门：界面不许从
 * `domain-rules` 直连界面词）。这里从 `../domain-rules.js` 只取 `EVENT_META`——那是**事件含义表**
 * （emoji 与机器 label），属机器身份，与界面词区不是同一区。
 *
 * ## 仍在判定线① 的扫描面内（所以搬完**不许**去改任何一份界面文件清单）
 * 本文件在 `src/ui/` 下 ⇒ `dev/ui-source-gates.mjs` 的 `uiScanSurface()`（`walk(src/ui)` 递归**算**
 * 出来，不是手写清单）自动把它收进界面用词闸 / accept 闸 / 体积比较闸的扫描面。手抄第二份
 * 文件清单正是「新增文件必逃」的成因——那三条闸今天的绿，靠的就是没有那份清单。
 */

import { createElement } from "react";
import { S } from "./styles.js";
// 事件含义表（emoji / 机器 label）——**机器身份**，不是界面词区：行首与 `cardIcon` 都取它。
import { EVENT_META } from "../domain-rules.js";
// 界面用词表：上屏的字一律经它取（票 `deep-module-scan/05` 的取词路径闸门）。
import { phaseUi, gateHuman, stageLabelHuman, segmentHuman, eventHuman, checkHuman, STAGE_HUMAN, artifactName, workPathForEvent, workEntryForEvent } from "./view-rules.js";
import { formatTime } from "./rules.js";
// 正文出口（票 `ui-systematic-fixes/01`／`03` · spec §3·1）：一段以上的正文只有一个入口。
// 本文件接的是「提案正文」那一处（`gate.detail` 的**同源第二出口**，焦点区那张关卡卡已由票 01 接上）。
import { bodyOf, BODY_KIND_MARKDOWN } from "./md-render.js";
// 卡片 props 契约（票 `workbench-card-contract/02`）：声明在**卡自己的域文件**里。
import { defineCardView } from "./card-view.js";
// 回放行的「打开」按钮（票 `deep-module-scan/15`）：只依赖 react 与 view-rules，
// **不反向依赖 `event-cards.js`** ⇒ 两个文件互不成环。
import { OpenArtifactButton } from "./open-artifact-button.js";

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
			return `AI 提案（${gateHuman(data.gate ?? "?")}，v${data.version ?? "?"}）：${data.title ?? ""}`;
		case "textbook/gate-decision":
			return data.approved === true
				? `${gateHuman(data.gate ?? "?")}通过（v${data.version ?? "?"}）`
				: `${gateHuman(data.gate ?? "?")}驳回（v${data.version ?? "?"}）${data.reasons?.length > 0 ? `：${data.reasons.join("、")}` : ""}`;
		case "textbook/mineru-progress":
			return `转换 ${data.file ?? ""}：${data.stage ?? ""}`;
		case "textbook/rollback":
			// 票 `ui-systematic-fixes/03`（spec §3·2）：原来这里插 `data.snapshot`——那是账本快照的
			// **文件名序号**（`过程/存档/<N>.json`，号只增、永不复用），机器账，人拿它做不了什么。
			// 这一句没有可用的「人读那半」⇒ **不印那个号**（说不清就不印），⛔ 也不印一个「?」占位。
			return "↩️ 已回退到更早的一份存档";
		case "textbook/source-added": {
			// ⚠️ 票 `pre-gold-build/02`：**老事件照旧渲染**（老账本里那一行本来就带角色，⛔ 不改写
			// 老书的历史）；新事件不再带角色（上传那一刻还没有角色）⇒ 没有值时**整块括号不印**，
			// 不上屏一个空的「（）」。
			const role = typeof data.role === "string" && data.role !== "" ? `（${data.role}）` : "";
			return `已上传材料：${data.file ?? ""}${role}`;
		}
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
			//
			// ⚠️ **这里不印阶段**（票 `audit-matrix-contract/06`，2026-09-29 用户拍板选 ②）。
			// 四个出口的逐个点名结论是「三个不印、只有 `replayRowDetail` 印」；这里是**第一个**
			// 不印的出口。**不印的理由**：这一行是**概览行**——同一屏的横幅与状态条已经说出了
			// 「此刻在哪一步」，这里再加一个阶段标签只是多一处要跟着改的真相；而且票 02 铺满的
			// 20 条拒收里绝大多数 `reason` 本身就带着阶段线索（「范例章审计不合格」「合并前缺跨章
			// 审计记录」…），少数不带的那几条由展开详情补上。**这不是漏了，是有意的不对称。**
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

// ── 「之前的过程」回放行：摘要 / 全文 / 重复聚合（票 07，P11·P23·P25·P28·P29·P57）──
//
// 病灶是**渲染缺口**不是采集缺口：账本 `data` 里早就写好了原因文案（`engine.js` 里的
// 「交工被拒：<原因>」「出错：<message>」「驳回理由」），人话映射 `cardText()` 早就在，
// 而回放行体只出 `EVENT_META.label` 兜底、**根本不渲染 `data`**。故这里**不新增任何采集**，
// 只把已有的字段露出来。
//
// 🔴 硬天花板（团队踩过一次，`smoke-test.mjs` 的行首探针）：**行首不许换成 `cardText`**——
// 行首只出客户端词表的事件类型词，摘要作为 `<strong>` **之后**的一个 span 追加。
// 下面每条取词都遵守同一条取向：服务端 label 一律经 `stageLabelHuman` 译，**译不动就不出**
// （宁可这一格不出词，也不把 `源探查`／某个没登记的机器串摆到人眼前——与行首同一口径）。

/** 摘要的字数上限：同口径收窄（`smoke-test.mjs` 靠行文本长度唯一定位那两条样张行，
 *  摘要不收窄会把它们顶出那个上限、让定位失败）。 */
export const REPLAY_SUMMARY_MAX = 60;

/** 压成一行、超长截断（截断号即 `engine.js` 那句 `.slice(0, 200)` 的同一口径）。 */
const clipText = (raw, max = REPLAY_SUMMARY_MAX) => {
	const oneLine = String(raw ?? "").replace(/\s+/g, " ").trim();
	return oneLine.length <= max ? oneLine : `${oneLine.slice(0, max)}…`;
};

/** 交办阶段标签 → 界面词；**译不动（未登记）就不出**——不猜、不露机器串。 */
const stageNameFromLabel = (label) => {
	const raw = String(label ?? "");
	if (raw === "") return "";
	const human = stageLabelHuman(raw);
	// `stageLabelHuman` 对未登记的原样返回（那一句是它自己的既定取向：宁可露机器词也不猜错）；
	// 但在**回放摘要**这一层我们反过来：出错了就整格不出，别让机器串混进行首那一行里。
	return human === raw ? "" : human;
};

const goldOpinionVerbs = { dislike: "不喜欢", drop: "不需要", change: "要改成" };

/**
 * 连续同型的转换进度 → 一条（票 07 的 P23：16 条一模一样的「材料转换」占满前 20 行）。
 * 只合并**相邻**的连续段（别的类型夹在中间就断开）；每条仍带 `events`，供摘要与展开用。
 * 合成一行不是把中间那些进度丢掉——`event` 取首条、`events` 留全部，展开看得到每一条。
 */
export function collapseConversionRuns(events) {
	const list = Array.isArray(events) ? events : [];
	const rows = [];
	let run = null;
	for (const event of list) {
		if (event?.type === "textbook/mineru-progress") {
			if (run !== null) run.events.push(event);
			else run = { event, events: [event] };
			continue;
		}
		if (run !== null) {
			rows.push(run);
			run = null;
		}
		rows.push({ event, events: [event] });
	}
	if (run !== null) rows.push(run);
	return rows.map((row, index) => ({ ...row, isLast: index === rows.length - 1 }));
}

/**
 * 回放行的摘要（`<strong>` 行首**之后**的那一段）。
 * 逐条对应走查 P29 的对照表：账本 `data` 里早有的字段，这里只负责露出来。
 */
export function replayRowSummary(row, ctx = {}) {
	const event = row?.event ?? null;
	if (event === null || typeof event !== "object") return "";
	const data = event.data ?? {};
	const run = Array.isArray(row.events) ? row.events : [event];
	// 转换进度聚合成一条：给时间跨度 + 次数（不说"已完成"——那一段若是被打回后重来的，
	// 说"已完成"就是句假话；只说机器自己的 `converting` 仍为真的那一次还在进行）。
	if (event.type === "textbook/mineru-progress") {
		if (run.length < 2) return clipText(String(data.stage ?? ""));
		const from = formatTime(run[0].time);
		const to = formatTime(run[run.length - 1].time);
		const tail = ctx.converting === true && row.isLast === true ? "，进行中" : "";
		return clipText(`（${from}–${to}，${run.length} 次进度${tail}）`);
	}
	switch (event.type) {
		// 阶段名按**阶段号**取词表（`data.label` 是服务端 PHASE_LABELS，机器词）——
		// 走查 P29 记的「连阶段名都丢了」就是这里。取不到号就整格不出，不回落机器 label。
		case "textbook/phase-start":
		case "textbook/phase-end":
			return phaseUi(data.phase);
		case "textbook/stage-start":
		case "textbook/agent-start":
		case "textbook/agent-end":
			return stageNameFromLabel(data.label ?? data.stage);
		// 进度叙述：这一行原来只有「⏳ 进度」三个字，叙述本身没人看得见。
		case "textbook/progress":
			return clipText(
				`${data.label ?? ""}${data.detail ? `：${data.detail}` : ""}`,
			);
		// 拍板结果：通过的那一档行首已经说完了；驳回要把**理由与用户整段 note**露出来。
		case "textbook/gate-decision":
		case "textbook/outline-decision":
			if (data.approved === true) return "";
			return clipText(
				[...(data.reasons ?? [])].join("、") + (data.note ? `：${data.note}` : ""),
			);
		// P11：交工被拒的原因（机器解析到的行键/样例/契约行形状都在这一句里）。
		//
		// ⚠️ **这里也不印阶段**（票 `audit-matrix-contract/06`，2026-09-29 用户拍板选 ②）。
		// **不印的理由**：摘要是**折叠行**——60 字上限、且行首那截类型词已经在说「这是一次交工被拒」；
		// 阶段词塞进来要么把真正要说的原因挤出上限，要么逼它另起一段前缀，折叠态下读起来更挤。
		// 阶段词落在**展开详情**那一层（`replayRowDetail`），那里用户是主动点开要读全文的。
		// **这不是漏了，是有意的不对称。**
		case "textbook/submit-rejected":
			return clipText(data.reason);
		// P57：机器兜底那一次的 `message` 本身就以「机器兜底发现 N 项没过：」开头
		//（`workflow/actions/chapters.js` 落账时的原话），整句露出来＝这一行自己就说清了
		// 是机器兜的底；不再另加一句前缀，免得同一行里把「机器兜底」说两遍。
		case "textbook/error":
			return clipText(data.message);
		case "textbook/hint":
			return clipText(data.text);
		case "textbook/review":
			return clipText(data.comment);
		case "textbook/ai-report":
			return clipText(data.report);
		case "textbook/deep-modify":
			return clipText(data.note);
		case "textbook/quality": {
			const checks = Array.isArray(data.checks) ? data.checks : [];
			const failed = checks.filter((check) => check.ok !== true);
			if (failed.length === 0) return "";
			return clipText(
				`${failed.length} 项没过：${failed
					.map((check) => `${checkHuman(check.name)}（${check.note ?? "没写原因"}）`)
					.join("；")}`,
			);
		}
		// P25：意见的落点/类型/内容都在 `data.opinion` 里（原来的渲染读错了字段、印出 #undefined）。
		case "textbook/gold-opinion": {
			const opinion = data.opinion ?? {};
			const verb = goldOpinionVerbs[opinion.kind] ?? opinion.kind ?? "";
			return clipText(
				`${opinion.target ?? "笼统"}，${verb}${opinion.wish ? `：${opinion.wish}` : ""}`,
			);
		}
		case "textbook/style-note":
			return clipText(data.styleNote?.text);
		case "textbook/intervention":
			return clipText(data.text);
		default:
			// 没登记取法的类型整格不出摘要——宁可少说一句，也不摆一句猜出来的话。
			return "";
	}
}

/**
 * 账本 `data.stage`（**机器阶段名**：`explore`／`gate`／`outline`／`gold`／`chapters`／`merge`／`final`）
 * → 界面人话阶段词。
 *
 * ⚠️ 票 `audit-matrix-contract/06`（2026-09-29 用户拍板选 ②）**唯一的印字出口**就是下面
 * `replayRowDetail` 这一处；`cardText`／`replayRowSummary`／引擎侧 `announceText` 三处一律不印
 * （各处理由写在那三处的注释里，**别当成漏了去补**）。
 *
 * 取词只用**票 05 补齐的那张表**（`view-rules.STAGE_HUMAN` ＝ domain-rules「界面词」区再导出的
 * 同一份），**不另建一份**、也不走 `stageHuman()` 的兜底：
 *   · `stageHuman()` 对**未登记**的阶段**原样返回那个机器串**（那是 `client-entry.js` 渲染路径上
 *     「宁可露出机器词，也不猜错」的有意取向，见 view-rules 注释）；但这一格是**拼给人看的正文**，
 *     摆一个 `gates` 进去就是把机器身份词端上屏——与同文件 `stageNameFromLabel()`「译不动就整格不出」
 *     同一口径。⇒ 这里查表查不到就**不出这一格**。
 *   · 于是「把 `STAGE_HUMAN.gate` 改回 `gate`」这类改坏**两条判据都会红**（票 05 逐格那条 + 票 06
 *     正向那条），不存在「改坏了照样出词」的缝。
 */
const stageWordForEvent = (data) => {
	const raw = typeof data?.stage === "string" ? data.stage : "";
	if (raw === "") return "";
	return Object.hasOwn(STAGE_HUMAN, raw) ? STAGE_HUMAN[raw] : "";
};

/** 展开详情的第一行补上「这一步卡在哪个阶段」——票 06 的全部落点就是这里。 */
const withStageWord = (body, data) => {
	const word = stageWordForEvent(data);
	if (word === "") return String(body ?? "");
	const text = String(body ?? "").trim();
	return `阶段：${word}${text === "" ? "" : `\n${text}`}`;
};

/**
 * 回放行的**全文**（行内那颗纯展开控件展开后给的东西）。
 * 「有超出摘要之外的全文才给展开控件」：没有全文的行（阶段开始、豁免放行……）一个控件都不长，
 * 既不摆死按钮，也不撞「同一排可点性一致」。
 */
export function replayRowDetail(row) {
	const event = row?.event ?? null;
	if (event === null || typeof event !== "object") return "";
	const data = event.data ?? {};
	const run = Array.isArray(row.events) ? row.events : [event];
	// 聚合行展开＝那 N 条进度逐条（票面：至少折叠成「展开 N 条进度」）。
	if (event.type === "textbook/mineru-progress")
		return run
			.map(
				(item) =>
					`${formatTime(item.time)}　${String(item.data?.stage ?? "")}${
						item.data?.file ? `（${item.data.file}）` : ""
					}`,
			)
			.join("\n");
	switch (event.type) {
		case "textbook/submit-rejected":
			// 票 06：**唯一印阶段词的那一格**。票 02 把 `rejectSubmit(stage, reason)` 铺到 20 条
			// 拒收路径，其中 6 条 `reason` 本身不带阶段线索（「章节缺少 title」「需要 preface」
			// 「需要 report」「方案不完整…」「styleCheck 的 status 只能…」「conflict（冲突）必须写一句
			// 理由…」）——用户在概览行看到这几条，看不出卡在合并还是最后检查。展开详情里补上人话
			// 阶段词，缺口就在那里补齐；概览行维持现状（理由见上面 `cardText` / `replayRowSummary`
			// 两处注释）。**印的是人话词、不是机器阶段名**——判据在 `test-wording-invariants.mjs`。
			return withStageWord(data.reason, data);
		case "textbook/error":
			return String(data.message ?? "");
		case "textbook/hint":
			return String(data.text ?? "");
		case "textbook/review":
			return String(data.comment ?? "");
		case "textbook/ai-report":
			return String(data.report ?? "");
		case "textbook/deep-modify":
			return String(data.note ?? "");
		case "textbook/gold-opinion":
			return String(data.opinion?.wish ?? "");
		case "textbook/gate-decision":
		case "textbook/outline-decision":
			return [data.note ?? "", [...(data.reasons ?? [])].join("、")]
				.filter((part) => String(part).trim() !== "")
				.join("\n");
		case "textbook/quality":
			return (Array.isArray(data.checks) ? data.checks : [])
				.filter((check) => check.ok !== true)
				.map((check) => `${checkHuman(check.name)}：${check.note ?? "没写原因"}`)
				.join("\n");
		default:
			return "";
	}
}

export { cardText, cardIcon };

// ── 账本回放列表（焦点区之外那块「之前的过程」）────────────────────────────────────
//
// 票 `deep-module-scan/15`：这段此前是 `client-entry.js` 里约 230 行 inline `createElement`，
// 是**焦点区 12 个 slot 之外唯一一个「这张东西吃什么」住在壳里的渲染单元**——同屏 12 张卡都有
// props 契约（声明在卡自己的文件里），唯独这块没有。⇒ 测试只能各测一头：
// `test-component-cards.mjs` 只测三个纯函数（`replayRowSummary` / `replayRowDetail` /
// `collapseConversionRuns`），**渲染那半从来没穿过 interface 被测过**。
//
// 现在三条判据（行身份规则、展开门、blocked 灰字）与它们的理由注释**一并搬到这里**，与
// 派生函数（`replayRowSummary` / `replayRowDetail` / `collapseConversionRuns`，本来就在本文件）
// 住进同一处——`map.md` 记的泄漏点「同一件事的知识被切成两半」到此闭合。
//
// ⚠️ **它不是 `focusCardKey` 路由出来的「焦点区主卡」**，是回看态才出现的一块 ⇒ slot 语义不同，
//   但 `card-view.js` 的未登记 slot 守卫照样适用（这是好处不是问题）：漏登记当场响，今天不会。
//
// ⚠️ **契约只声明 7 项，不是票面数的 15 项**：`artifactName` / `formatTime` / `cardIcon` /
//   `eventHuman` / `EVENT_META` / `workPathForEvent` / `workEntryForEvent` 这些是**判据与词汇**，
//   本 module 直接 import，不进 props 袋（`AGENTS.md`「Frontend layout」：跨域只走 public exports）。
//   袋里只放**只有壳才知道的东西**：账本数据、产物清单的到位口径、展开态、以及那颗「打开」。
export const replayListView = defineCardView({
	card: "ReplayList",
	fromBook: [
		"events",
		"meta",
		"workFiles",
		"workKnown",
		"gateOpen",
		"setGateOpen",
		"onViewRow",
	],
	required: ["events", "meta", "workFiles", "gateOpen", "setGateOpen", "onViewRow"],
	// 没有任何「现算表达式」：本卡**全部消费**都落在 `fromBook` 那七项上，所以
	// `test-card-views-coverage.mjs` 的豁免表**该行为空**（不是靠加豁免通过）。
	derive: () => ({}),
});

export function ReplayList(props) {
	const {
		events,
		meta,
		workFiles,
		workKnown,
		gateOpen,
		setGateOpen,
		onViewRow,
	} = props;
	// 票 07（P23）：连续的转换进度**聚合成一条**（16 条一模一样的「材料转换」占满前 20 行）。
	// 聚合**不是丢弃**——`row.events` 留着全部，那颗纯展开控件展开后逐条可见。
	return collapseConversionRuns(events).map((row) => {
		const event = row.event;
		const isRun = row.events.length > 1;
		const product = workPathForEvent(event, meta, workFiles);
		// 票 08（`event-row-entries/spec.md` 决策 8；`workbench-transitions/spec.md`
		// 不变量 14）：判据认得出候选、但那份文件**还没在产物清单里**的行，
		// 与「本来就没有候选」的行是两种处境——前者给一行灰字，后者什么都不长。
		// 判据在 `view-rules.workEntryForEvent`（单一出处）：`blocked` 恒不带
		// `path`/`label`，所以这里**给不出名字**（决策 8「不起名」在判据层就成立）。
		// ⚠️ 还没拿到产物清单时（首屏 / 切书后）**不判** `blocked`：那时 `workFiles`
		// 是空数组，"文件不在清单里"与"清单还没到"不可分，判了就会闪一句假灰字。
		// 票 08 把这格钉在 `work.known` 上（ADR-0021 决策 11/16）：`known` 恒在
		// **ready 与 stale** 时为 true——stale 只是这一轮没读到，last-known 清单
		// 照旧是真的，所以「结果还没生成」在 stale 下**照判**；只有 unknown（还没到）
		// 与 error（第一次就没到、没有 last-known）不判。
		// ⚠️ prop 名此前是 `workFilesReady`，那是壳里 projection 的 `work.known` 口径
		//   泄漏（壳自己的注释就承认过）；搬过来时改成 `workKnown`——搬走时顺手改准，
		//   因为要改的只有这个 prop 名与它那一个读取点。
		const blocked =
			workKnown &&
			workEntryForEvent(event, meta, workFiles).kind === "blocked";
		const isGate = event.type === "textbook/gate-proposal";
		// **这一行就是展开态的键**（`key` 与 `detailOpen` 都取它，只此一处）。
		// 票 07（`event-row-entries/spec.md` 决策 12；`workbench-transitions/spec.md`
		// 不变量 2）：不能拿 `event.seq` 当键——真账本里 `seq` **不唯一**
		//（`restoreSnapshot` 把 `meta.eventCount` 写回 `events.length`、
		// `deep-modify` 写回 `kept.length`，见 `workflow/engine.js` 与
		// `workflow/actions/deep-modify.js`，于是同一个 `seq` 在新一轮里被复用：
		// 一本书里 9 条事件同为 `seq=54`），点一行会连带展开/收起同号的行。
		// 取 `seq`+`type`+`time` 而不是列表下标：下标是**位置**、不是行的身份——
		// 工作台每 2s 重取 `/textbook/events`，同一个 WorkbenchView 里还会切书
		//（`setActiveId`），位置键在重取/切书后会落到"恰好坐在那个位置的另一行"，
		// 把同一个毛病换个方式复现（跨书泄漏一颗展开态）。同号事件是不同轮次
		// 写下的，`appendEvent` 恒写新的 `time: Date.now()`，故这个组合在真账本里唯一。
		const rowKey = `${event.seq}::${event.type}::${event.time}${isRun ? `::run${row.events.length}` : ""}`;
		const detailOpen = gateOpen === rowKey;
		// 票 07（P28/P29/P57）：行首（`<strong>`，事件类型词）**一个字没动**——
		// 硬天花板见 `smoke-test.mjs` 的行首探针（把行首换回 `cardText` 会立刻红）。
		// 摘要取账本 `data` 里**早就有**的字段（`label`/`reason`/`reasons`/`note`/
		// `detail`/`text`…），作为行首**之后**的一个 span 追加；没有对应字段的
		// 类型整格不出（这是渲染缺口，不是采集缺口——不新增任何采集）。
		const rowSummary = replayRowSummary(row, {
			converting: meta?.converting === true,
		});
		// 票 07（P29）：展开门**按事件类型放开**——原来只认提案行（`isGate`），
		// 于是「交工被拒 / 出错 / 拍板驳回 / 提示」那几行彻底惰性（行内按钮数 0、
		// `cursor: auto`、无兄弟节点＝不是折叠了，是不可点、看不全）。
		// 判据：**摘要之外还有全文**才长那颗纯展开控件（纯展开收起热区，不发动作、
		// 不开右栏）——没有全文的行（阶段开始、豁免放行…）一个控件都不长，
		// 不摆死按钮，也不撞「同一排可点性一致」。
		const rowFull = replayRowDetail(row);
		const expandable =
			!isGate && rowFull !== "" && rowFull !== rowSummary;
		const toggleLabel = isRun
			? `▸ 看 ${row.events.length} 条进度`
			: "▸ 看详情";
		// 「查看中」高亮不做了：产物现在开在 DSH 右栏（那份内容不经过本组件，
		// 工作台也无从知道用户关没关它），硬留一个对不上的状态反而骗人。
		return createElement(
			"div",
			{
				key: rowKey,
				// 票 06（`event-row-entries/spec.md` 决策 7；`workbench-transitions/spec.md`
				// 不变量 2）：**整行不可点**。原来这条行挂着一个容器级 `onClick`，把
				// 「开产物 / 展开提案」两个身份缝在同一条行上、还带 `cursor: pointer` 的
				// 可点暗示——一个热区只干一件事，行里从此只留行内显式控件（下面那两颗按钮：
				// 提案行的「▸ 提案详情 / ▾ 收起」与有产物行的「打开」）。
				style: S.card,
			},
			createElement(
				"div",
				null,
				createElement("span", null, cardIcon(event)),
				" ",
				// 票 06（`event-row-entries/spec.md` 决策 10「名字由客户端出」；
				// `workbench-transitions/spec.md` 不变量 7「UI 不渲染服务端 label」）：
				// 行首只出**客户端词表**的事件类型词：`EVENT_UI`（界面覆盖）优先、
				// `EVENT_META.label`（双端含义表）兜底。
				// ⚠️ 兜底与 `cardText` 的 `default:` 分支**并不逐字相同**（2026-09-23 代码审查
				// 修正了这里原先"同源"的说法）：`cardText` 最后退回 `event.type`，这里退回
				// 空串。差别只在**未登记的类型**上——`EVENT_META` 是账本事件类型的契约表
				//（服务端按 `EVENT_TYPES` 校验），真账本走不到那一支；真走到了，宁可
				// 这一格不出词，也不把 `textbook/xxx` 这种机器串摆到人眼前
				//（与不变量 7 同一取向：界面不露机器身份词）。
				createElement(
					"strong",
					null,
					eventHuman(event.type, EVENT_META[event.type]?.label ?? ""),
				),
				// 票 07（P28/P11/P57）：摘要**追加在行首之后**（不是把行首换掉——那是
				// `smoke-test.mjs` 行首探针守着的硬天花板）。内容取账本 `data` 里早有
				// 的字段：驳回理由、交工被拒的原因、机器兜底拦下了什么、进度叙述、提示
				// 正文……截断到与行文本上限同口径；没有对应字段的类型整格不出
				//（渲染缺口，不是采集缺口——本票不新增任何采集）。
				rowSummary !== ""
					? createElement(
							"span",
							{
								style: {
									marginLeft: "8px",
									opacity: 0.82,
									fontSize: "12px",
								},
							},
							rowSummary,
						)
					: null,
				// 票 07（`event-row-entries/spec.md` 决策 7；`workbench-transitions/spec.md`
				// 不变量 2）：行内那颗**纯展开**控件——只干一件事（改展开态），
				// **不发动作、不开右栏**。它与同行的「打开」是"两个控件、各一个身份"
				//（整块热区里嵌行内控件合法），不是"同一热区两个身份"。
				// 必须是真 `<button>` 且文字挂在**第一个文本子节点**上：按文本找按钮的
				// 辅助件只认这个形状（`assertion-plan.md` §2「findButton」）。
				// 提案行照旧说「▸ 提案详情」；其余**有全文**的行说「▸ 看详情」/「▸ 看 N 条
				// 进度」——票 07 把展开门从"只认提案行"按事件类型放开（判据见上面
				// `expandable` 那几行）。热区身份＝**纯展开收起**（不变量 2）。
				isGate || expandable
					? createElement(
							"button",
							{
								style: { ...S.smallLink, marginLeft: "10px" },
								onClick: () =>
									setGateOpen(detailOpen ? null : rowKey),
								// 悬浮提示只说这颗控件干的那一件事（不变量 12：文案不承诺没有
								// 机制的）——说「详情」不说「全文」。
								title: detailOpen
									? "收起这一条的详情"
									: isGate
										? "就地展开这份提案的详情（不打开右栏）"
										: "就地展开这一条的详情（不打开右栏，也不发动作）",
							},
							detailOpen
								? "▾ 收起"
								: isGate
									? "▸ 提案详情"
									: toggleLabel,
						)
					: null,
				product !== null
					? createElement(OpenArtifactButton, {
							// 票 02 导出的同一颗按钮（spec 决策 9：不新造控件）。
							// 名字取**客户端按路径判**的 `artifactName`（票 05）：不读服务端
							// label、不把路径原文摆上屏；悬浮提示同源——按钮内部自己按
							// `artifactName(item.path)` 拼（票 06 第 5 条：不另造第二套提示语）。
							item: product,
							label: `${artifactName(product.path)} 打开`,
							// 只开这一个：交给既有收口 `viewWork`（产物判据 → DSH 右栏），
							// 不在事件行里另写第二条打开路径。
							onOpen: () => onViewRow(product),
						})
					: blocked
						? // 票 08（决策 8）：**灰字，不是灰按钮**。三条理由（spec 原文）：
							// ①不可点的控件摆进可点那一列会撞不变量 2 的「同一排可点性一致」；
							// ②它要给**还不存在的产物**起名字，与「产物名」口径别扭；
							// ③真账本上这事只发生在一本书、而且是同一对控件重复 195 次。
							// `<span>` 不是 `<button>`＝不进热区、不参与点击、不发动作。
							createElement("span", { style: S.hint }, "结果还没生成")
						: null,
				createElement(
					"span",
					{
						style: {
							float: "right",
							opacity: 0.6,
							fontSize: "12px",
						},
					},
					formatTime(event.time),
				),
			),
			isGate
				? detailOpen
					? createElement(
							"div",
							{
								style: {
									marginTop: "6px",
									fontSize: "12px",
									opacity: 0.9,
								},
							},
							createElement(
								"p",
								{ style: { margin: "0 0 4px" } },
								event.data?.summary ?? "",
							),
							(event.data?.detail ?? "") !== ""
								? createElement(
										"div",
										{ style: { margin: "4px 0 0" } },
										// 票 `ui-systematic-fixes/03`（spec §3·1／§3·2）：这一份是 AI 交的**提案正文**
										// （md：`## 标题`／`**加粗**`／`- 列表`），⛔ 不再 `pre-wrap` 逐字吃原文。
										// 票 01 已把焦点区关卡卡上的**同一份** `gate.detail` 接进正文出口，这里是
										// 它的同源第二出口 ⇒ 走**同一条路**（`bodyOf` 的 md 那档）。
										...bodyOf(event.data.detail, BODY_KIND_MARKDOWN),
									)
								: null,
						)
					: (event.data?.summary ?? "") !== ""
						? createElement(
								"div",
								{ style: { marginTop: "6px", opacity: 0.85 } },
								event.data.summary,
							)
						: null
				: null,
			// 票 07（P29）：非提案行的展开态——给的是这一行的**全文**
			//（驳回理由原文 / 交工被拒的原因 / 机器兜底那条 / N 条转换进度…）。
			// 纯展开收起：只改这一行的可见性，不发动作、不开右栏、不换屏。
			expandable && detailOpen
				? createElement(
						"pre",
						{
							style: {
								whiteSpace: "pre-wrap",
								wordBreak: "break-word",
								background: "var(--dsw-alias-bg-layer-1)",
								borderRadius: "6px",
								padding: "8px",
								fontSize: "12px",
								margin: "4px 0 0",
							},
						},
						rowFull,
					)
				: null,
		);
	});
}
