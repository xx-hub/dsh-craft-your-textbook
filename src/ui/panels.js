/**
 * 造书工作台 · 顶栏、状态条与面板
 *
 * 常驻条/横幅族：协作状态条（现在轮到谁）、主 AI 活性行、不打断提示条、
 * 自动跟随横幅；顶栏介入工具条与其展开面板（风格线/留言/自定义模式库）。
 */

import { createElement, useState } from "react";
import { S } from "./styles.js";
import { formatTime, humanDuration } from "./rules.js";
// 票 `ui-display-redesign/11`：问卷面板的三选一收卷人（闭集唯一出处＝探索确认契约；⛔ 不手抄名单）
// 与下载地址要的书夹路径常量（发卷件的落点，⛔ 不在面板里手拼文件名）。
import { EXPLORE_CONFIRM_ANSWERERS } from "../explore-confirm-contract.js";
import { READER_QUESTIONNAIRE_ISSUED_REL } from "../domain-rules.js";
// 界面用词表（批 2）：六阶段在界面上的字只此一份。
import { phaseUi, goldDraftDisplayed } from "./view-rules.js";
// 票 `ui-systematic-fixes/02`：状态 → 人话只在**值出口**翻译一次；「轮到你该干什么」与
// 「这本书被暂停了吗」两个判据也住在那里（本文件只取用，⛔ 不各判各的）。
import { statusHuman, withPendingStage, turnOwnerOf, pausedNow } from "./view-rules.js";
// 票 `demo-channel-full/26`（清仓）：这一族「AI 会／正在…」句子的两个取值（真书／演示书）。
// 出口收在 `view-rules.js`（⛔ 本文件不拼第二份措辞），判据见 view-rules 那一节的注释。
import {
	styleNotesPanelTitle,
	styleLinePanelHeading,
	styleLinePanelHint,
	patternPasteHint,
} from "./view-rules.js";

// ── 协作状态条：现在轮到谁 ───────────────────────────────────────────────────

// 「这本书被暂停了吗」的唯一判据（票 walkthrough-fixes/22 · P6）**已搬进值出口模块**
// `view-rules.js`（票 `ui-systematic-fixes/02`：状态条要它判「整条不出声」那一支）。
// 票 `ui-systematic-fixes/11`：暂停那一档并进了「轮到谁」的**唯一判定**（`turnOwnerOf` 回 null），
// 所以本文件不再直接调 `pausedNow`——两处（状态条／活性行）仍由同一个判定说话。

/**
 * 「这一步**有**内容支撑吗」的唯一判据（票 `walkthrough-fixes/14` · 走查 P40 那一格）。
 *
 * 读的是 `stageScopedProgressDetail`（`src/ui/rules.js`）算出来的那一格——**取数口径一个字没动**，
 * 这里只判它的**空值**。
 *
 * 为什么要这张判据：宿主重启后，启动恢复链只补一条 `textbook/stage-start`、**不补 `textbook/progress`**
 * （那是路线 A「落账侧」，代价是「谁替 AI 说这句话」＝机器代 AI 说话，2026-09-29 用户拍板**不选**），
 * 于是那一格取数返回 `""`、横幅**详情行整行消失**；可同一屏上那句「🤖 我正在做 · 写完整本」照旧一字未改
 * ——没有运行中的小助手、没有可停的回合、没有计时、没有一句说明它在做什么。**那是一句纯粹的断言，
 * 而且已知为假。**（数据一件没丢：走查实测 13 章正文 / 3 份合并审计 / 15 个存档 / 70 条账本事件全在，
 * 坏的只是横幅的形态——不要把它记成「恢复链坏了」。）
 *
 * ⚠️ **它与 `pausedNow` 是两件事，不许合并**：
 *   · `pausedNow`＝用户自己按了暂停，顶栏那句「⏸ 已暂停」**有内容支撑**（票 22 已收口）；
 *   · 本条＝机器**什么都没开始**却仍在说「我正在做」，是**没有支撑**的（票 14）。
 * 合并成一条判据就会得到「一律闭嘴」那种定位不了的假绿。
 *
 * ⚠️ 为什么不落成「⚡ 轮到你」：用户此刻**没有任何事要做**（没到拍板点、没到确认点），
 * 说「轮到你」是拿一句假话换另一句假话。**这一格选了「不出声」**——与暂停那一支同一形态：
 * 整条不出声，而不是留一个只剩边框的空条，也**不是**新造第四个状态词。
 * （「progress 为空不算第四个状态词」那句边界说明由兄弟票 `16-状态词同屏打架.md` 落笔到 CONTEXT.md。）
 */
const hasProgressDetail = (detail) => typeof detail === "string" && detail.trim() !== "";

/** 「这一步**已经交办出去了**吗」——`pendingStage` 非空（状态条那一格用它判「有没有内容支撑」）。 */
const handedOverNow = (pendingStage) => pendingStage !== null && pendingStage !== undefined;

/**
 * 状态条那一格「我正在做」此刻**没有内容支撑**吗（票 `walkthrough-fixes/14` 的判据）。
 *
 * ⚠️⚠️ **两个前提缺一不可，少一个就变成「一律闭嘴」，而那不是本票的裁决**：
 *   ① **已交办**（`pendingStage` 非空）——机器已经把某一步交出去了，才谈得上「说了却说不出在做什么」；
 *   ② **零 `progress`**（`stageScopedProgressDetail` 返回 `""`）——详情行整行消失。
 *
 * **只有这两条同时成立**（＝宿主重启后、恢复链补了 `stage-start` 还没补 `progress` 的那一段窗口）
 * 才把状态条整条收掉。**跑动中、尚未交办**（`status: "running"`、`pendingStage` 为空）那一格
 * 不在判据里：AI **确实在跑**，状态条那句「🤖 我正在做：准备下一步」是实话。
 *
 * ⚠️ 票 `ui-display-redesign/20` 起这条判据**只归 `StatusStrip`**：活性行未判停本来就整行不出声
 * （状态词只留状态条一处），不再需要第二个「没有支撑就闭嘴」的分支。⛔ 不要把 ActivityLine
 * 重新接回这个函数——两处各判各的正是本仓反复治的病。
 */
const activityClaimUnsupported = (pendingStage, progressDetail) =>
	handedOverNow(pendingStage) && !hasProgressDetail(progressDetail);

// 「轮到你该干什么」那一句**已收进展示派生模块** `view-rules.js` 的拍板契约 `decisionOf`
// （票 `ui-systematic-fixes/02` 先把旧出口搬过去；票 10 把它 reshape 成 `{ question, decisionKey }`，
// `question` 从「话题名」改成问句）。⛔ 本文件不留第二份措辞。
// ⚠️ 票 `ui-display-redesign/16` 起**状态条不再渲染它**（问句归卡头）：值出口那一格照旧是
// `decisionOf(...).question`（契约一字未改），只是 `StatusStrip` 在「轮到你」态只印状态词。

/**
 * 取色档 → 状态词前面那个图标（票 `ui-systematic-fixes/02`）。
 *
 * 分工：**词归值出口、图标归渲染**——`statusHuman.word` 是裸词（别处要「一句话里的状态词」时
 * 也能直接取），图标只在这里按 `tone` 贴。`config`（待配置）与 `you`（轮到你）同色、只差图标 🔑／⚡。
 */
const STATUS_TONE_ICON = Object.freeze({
	ok: "🎉",
	error: "⚠️",
	you: "⚡",
	config: "🔑",
	ai: "🤖",
});

export function StatusStrip(props) {
	const { meta, gate, pendingStage, metaLabel, progressDetail } = props;
	// 票 `ui-systematic-fixes/02`：状态 → `{ word, tone, action }` **只在值出口翻译一次**
	// （`view-rules.statusHuman`）。状态条自己**不再比较 status**——收出口之前那 7 个分支的取值
	// 全部由它给，渲染结果逐字不变（判据见 `test-wording-invariants.mjs` 的「状态条那 7 个分支」）。
	// 票 `ui-systematic-fixes/10`：「轮到你」那半句现在来自拍板契约 `view-rules.decisionOf`
	// （`{ question, decisionKey }`，`question` 是问句、`decisionKey` 取「用户正看着哪张卡」）。
	// ⇒ 本组件**只渲染**，⛔ 不拼那句话、也⛔ 不按 `status` 另判一次（站 2／3、站 8／9 的错位
	// 就是在那里治掉的）。活性行与阶段片读**同一份判定**是票 11 做的（`turnOwnerOf`／`humanTurn`），
	// 本组件那一侧一格没改。
	//
	// 票 `ui-display-redesign/16`：**问句归卡头**（01–10 各票已把 8 个决策站的问句搬上卡）⇒
	// 「轮到你」这一格**不再渲染** `human.action` 那半句：只印 `⚡ 轮到你`，同一句问句不在
	// 一屏出现两次。`statusHuman`／`decisionOf` 两个出口**一字未改**（问句仍同源取自
	// `decisionOf(...).question`，只是状态条不再拿它拼字）；站 1 的
	// 「上传教材（开始转换后 AI 会自动接手）」同属这半句，随之不上屏（若维护者要保留，另登记）。
	// ⚠️ 「我正在做／已完成」两态的动作说明**保留不动**——它们说的不是问句、卡头也没有；
	// 出错／待配置那两格的「请看下面的提示」同样不是问句，照旧保留。
	//
	// `pendingStage` 住在 payload 顶层、壳已经把它拆开了，这里并回投影：展示期
	// （`awaiting-gold` ＋ `pendingStage === 'gold'`）只有它才判得准（那一档归「我正在做」）。
	// ⚠️ 壳还会传一个 `humanTurn` prop——本组件**不再消费它**：同一个值现在由 `statusHuman`
	// 算（`deriveBookViewFacts` 的 `humanTurn` 已经是它的返回值），两处各判各的那条病根被拔掉。
	const human = statusHuman(withPendingStage(meta, pendingStage), gate);
	// 票 14：横幅详情行整格为空时，「我正在做」是**没有内容支撑**的断言 ⇒ 这一支整条不出声。
	// 判据走**唯一那一个函数** `activityClaimUnsupported`（两个前提：已交办 ＋ 零 progress），
	// 与 `ActivityLine` 同一份——**两处各判各的正是本仓反复治的那个病**。
	// `pendingStage` 为空时的「🤖 我正在做 · 准备下一步」是**另一格**：那一格机器压根没交办出去
	// 任何一步，它答的是「还没开始」而不是「正在做但说不清在做什么」。
	const handedOver = handedOverNow(pendingStage);
	const busy = human.humanTurn !== true && human.tone === "ai";
	const detailEmpty = activityClaimUnsupported(pendingStage, progressDetail);
	// 暂停（`word === null`）与「已交办却零进度」两支：整条不出声（不是留一个只剩边框的空条）。
	if (human.word === null || (busy && handedOver && detailEmpty)) return null;
	// 票 25（走查 P20）：已交办那一格**只出状态词那半截 ＋ 壳递进来的阶段名**，不再把同一段进度
	// 叙述整段搬上来（那一段与焦点区主卡里的 `ChaptersCard` / `StatusCard` 各出一次，白占一屏，
	// 还让人以为「它卡在同一个地方又说了一遍」）。阶段名的唯一出处仍是 `deriveBookViewFacts`。
	const tone = human.tone;
	// 词与图标拼在这里（词归值出口、图标归渲染，见 `STATUS_TONE_ICON` 的说明）。
	// 票 `ui-display-redesign/16`：「轮到你」只印状态词（问句归卡头，⛔ 不再 `⚡ 轮到你 · <问句>`）；
	// 其余各档的行文**逐字不变**（「我正在做」可能带壳递进来的阶段名，「已完成」带成品入口说明，
	// 出错／待配置那两句「请看下面的提示」不是问句、卡头没有 ⇒ 照旧保留）。
	// ⚠️ 判「轮到你」这一格认的是 `tone === "you"`（＝`turnKindOf` 的 `turn` 那一档），**不是**
	// `humanTurn`：阶段一出错／待配置时 `humanTurnOf` 也会回 true（`phase === 1 && gate === null`），
	// 但那两格的 tone 是 error／config、那半句必须留着（实测：用 `humanTurn` 会把
	// 「出错了，请看下面的提示」一起摘掉）。
	// 票 `ui-display-redesign/20`（`design-draft.md` §7.14 第 1 条，2026-10-29 裁决）：
	// 「我正在做」那一格的中点按 `ui-cleanup` 判据 1 改冒号——`🤖 我正在做：<阶段名>`。
	// 票 `ui-cleanup/03`（2026-10-30）起**所有**句内显示分隔符都按判据 1 改标点：
	// running 走冒号，其余档走逗号（`test-wording-invariants.mjs` 的 11 格期望值同批钉着）。
	const joiner = tone === "ai" ? "：" : "，";
	const text = tone === "you"
		? `${STATUS_TONE_ICON[tone]} ${human.word}`
		: `${STATUS_TONE_ICON[tone]} ${human.word}${joiner}${busy && handedOver ? (metaLabel ?? "") : human.action}`;
	const bg = {
		ok: "var(--dsw-alias-state-success-tertiary)",
		you: "var(--dsw-alias-state-warn-tertiary)",
		config: "var(--dsw-alias-state-warn-tertiary)",
		ai: "var(--dsw-alias-state-business-tertiary)",
		error: "var(--dsw-alias-file-diff-deleted-bg)",
		normal: "transparent",
	}[tone];
	const border = {
		ok: "#1a7f37",
		you: "#d4a72c",
		config: "#d4a72c",
		ai: "var(--dsw-alias-state-business-primary)",
		error: "var(--dsw-alias-state-error-primary)",
		normal: "transparent",
	}[tone];
	return createElement(
		"div",
		{
			style: {
				borderRadius: "8px",
				padding: "8px 12px",
				margin: "0 0 10px",
				fontSize: "13px",
				background: bg,
				border: `1px solid ${border}`,
				fontWeight: 600,
			},
		},
		text,
	);
}

// ── 主 AI 活性行（F17）：AI 回合进行中 / N 分钟没动静了 [🔁 从断点继续] / 轮到你 ─────

/**
 * 活性行是「多久没动静」这一屏**唯一的出口**（票 stale-detection/01）。
 *
 * 判定不在这里算：`stall` 是 `src/ui/rules.js` 的 `deriveStallJudgment` 算出来的**同一份**结果
 * （三路输入：主 AI 在跑 / 账本新鲜度 / 有小助手在跑，门槛 5 分钟），状态卡消费的也是它——
 * 两处逐字抄过一遍算式，正是这次「同一行自己打自己」的根因。
 *
 * 措辞只说**可见事实**（`N 分钟没动静了`），不下「卡住了」这个诊断：机器只看得到账本，
 * 看不到 AI 内部。停顿时长按分钟说（`humanDuration`，与状态卡计时共用一份格式化）。
 * 票 `ui-display-redesign/20` 起判停时只说 `⏱ N 分钟没动静了`（不再先说状态词「我正在做」）：
 * 状态词只留状态条那一处，这一行说的是「停了多久」这个可见事实；状态卡那行的「只报时长」是
 * **另一件事**（它是这一步的计时行）。
 *
 * 小助手状态来自宿主推送的会话摘要（`indexSubagentDescendants` 的口径），**不再自己轮询计数**：
 * 这里只说「N 个小助手在跑」；「📥 N 个完成待收」已撤——它的真身是「记录只存在于磁盘上」，
 * 每一条曾经创建过的子代理都算，跟「干完了等你收」没有关系，对用户也没有可操作性。
 */
export function ActivityLine(props) {
	const { meta, stall, subagents, humanTurn, onResume, progressDetail, pendingStage } = props;
	const runs = { count: 0, runningCount: 0, ...(subagents ?? {}) };
	const aggText =
		Number.isSafeInteger(runs.runningCount) && runs.runningCount > 0
			? `🔎 ${runs.runningCount} 个小助手在跑`
			: "";
	// 三态词（2026-09-20 用户拍板）：轮到你 / 我正在做 / 已完成。
	// 「轮到谁」先看 humanTurn，再看状态与活性（2026-09-20 02 屏判读实测的矛盾：那个会话
	// status=running 但第 1 次拍板正等用户定，状态条写「⚡ 轮到你」、活性行却说「我正在做」）。
	// 轮到用户时，状态条已经在说「⚡ 轮到你」（票 `ui-display-redesign/16` 起问句归卡头、
	// 状态条不再带那半句），这一行再喊一遍就是两行同话：
	// 只留子代理聚合；连聚合都没有就整行不出现。
	const stalled = (stall ?? {}).stalled === true;
	// 票 22：暂停**不**掐掉子助手聚合：那一句说的是小助手（它们确实在跑），与「已暂停」（说的是
	// 主笔 AI）不是同一件事。暂停在「轮到谁」那一层就是「这一刻不说话」（`turnOwnerOf` 回 null）。
	//
	// 票 `ui-display-redesign/20`：「我正在做」四处收到一处（只留状态条那句）⇒ 这一行**未判停时
	// 整行不出声**（有子助手聚合时只留聚合那一半）；判停时才说 `⏱ N 分钟没动静了` ＋ 那颗
	// 「🔁 从断点继续」。⛔ 别把状态词前缀加回来：同一句「我正在做」一屏只说一次。
	// ⚠️「从断点继续」那颗按钮**保留**：它答的是「能不能接着做」，是这一格唯一可操作的出口。
	// 票 `ui-systematic-fixes/11`：**「轮到谁」不在这里判**——判定只有一份（`view-rules.turnOwnerOf`），
	// 状态条与阶段片读的也是它。这一行只保留自己的**行文**：轮到用户时整行不出声（状态条已经在说
	// 「⚡ 轮到你」——票 16 起不带问句）、已交付说「✅ 已完成」、其余不出声。
	// ⚠️ 退场的是这一处自己的第二架梯子：`meta.status === "delivered"`、`meta.status !== "running"`
	// 与 `goldDraftDisplayed` 那一格（展示期现在由共享判定给「我正在做」）。
	// ⚠️ **暂停仍是这一行自己的先行条件**（不是「轮到谁」的一部分）：暂停时整行不出声——顶栏已经
	// 写着「⏸ 已暂停」。同屏「出错 ＋ 暂停」那一格，状态条照旧说「⚠️ 轮到你 · 出错了」（那是书的状态），
	// 这一行闭嘴；两件事各归各的（票 22 的裁决原样保留，判据 `test-wording-invariants.mjs` 钉着）。
	const paused = pausedNow(meta);
	const owner = turnOwnerOf(withPendingStage(meta, pendingStage), null);
	const idlePrefix = `⏱ ${humanDuration(stall?.idleMs)}没动静了 `;
	const content =
		humanTurn === true || paused || owner === null
			? null
			: // 已交付＝全书完成：此时既不是「轮到你」也不是「我正在做」（真 GUI 判读实测：
				// 已交付的《工业大数据分析》活性行还写着「⚡ 轮到你」，同一屏却在大喊「🎉 书做好了」）。
				owner === "done"
				? "✅ 已完成"
				: owner === "you"
					? "⚡ 轮到你"
					: stalled
						? createElement(
								"span",
								null,
								idlePrefix,
								createElement(
									"button",
									{
										style: S.smallLink,
										onClick: onResume,
										// 票 stale-detection/01：原来那颗写着「让 AI 接着干」、做的只是「催一句」
										// （标签与动作本身对不上），而且没有活着的主 AI 时直接报错。
										// 现在发「从断点继续」：会写状态、清暂停标记、必要时重新交办，
										// 没有活的主 AI 时还能退回推状态机这条路。
										title:
											"让 AI 从断点接着做完这一步（不重做已完成的部分；它没在跑时也能把它叫起来）",
									},
									"🔁 从断点继续",
								),
							)
						: null;
	// 轮到用户、又没有子代理聚合 → 整行不出现（状态条已经说了「⚡ 轮到你」）。
	if (content === null && aggText === "") return null;
	return createElement(
		"div",
		{
			style: {
				margin: "0 0 10px",
				fontSize: "12px",
				opacity: 0.85,
				display: "flex",
				alignItems: "center",
				gap: "6px",
				flexWrap: "wrap",
			},
		},
		aggText !== ""
			? createElement(
					"span",
					{ style: { fontWeight: 600, color: "#0969da" } },
					aggText,
				)
			: null,
		content,
	);
}

// ── 不打断提示条（F17）：铺章中提交风格线/留言/意见成功后，焦点区顶部滑入、6 秒自清 ──

/**
 * 提示条的两档措辞（票 30②）——**它们不是同一句话的两种说法**。
 *
 * 「不打断正在写的这一章」这句在铺章途中成立：提交一条意见，机器没停，那一章还在写。
 * 但全章过目态下提交一条意见，服务端会把这本书从「请你过目」翻回「我正在做」并交办修订
 * （闸门消失、这一章被收起来）——**恰恰就是打断了**。原样复用那一档就是说反话，
 * 而用户读到一句与屏幕上发生的事相反的话，下一步就是「我是不是点坏了」。
 *
 * ⚠️ 票 `walkthrough-fixes/21`（2026-10-06 裁决「甲」）改的是**后半句那个时机承诺**，
 * **不是「机器没停」这个事实**：原句尾「AI 到下个停靠点会照办」与机器行为相反——实测主 AI
 * **当轮**就把这条叮嘱转达给了正在写那一章的小助手（§11.2 硬触发）。⇒ 「不打断正在写的这一章」
 * 这半句**逐字保留**（它是真话，且已被 `test-component-cards.mjs`「票 30② 两档措辞」逐字钉住），
 * 换掉的只是后半句。判据面见 `test-wording-invariants.mjs` 的「票 21」那条（禁词面＝**时机承诺**，
 * 不是 blanket ban「不打断」）。
 */
export const INTERRUPT_NOTE_TEXT =
	"💡 已记下；不打断正在写的这一章，AI 当轮就叮嘱正在写它的小助手。";
export const INTERRUPT_NOTE_TEXT_BREAKS_CHAPTER =
	"💡 已记下；这一章交给 AI 去改了，过目先收起来了——AI 改完会把这一章重新摊开给你过目。";

/**
 * 谈判桌那两档措辞（票 `gold-display-period/01`）——与上面两档**并列**，不是它们的替身。
 *
 * 上面那两句管**铺章**（phase 5）：提交那一刻机器没停、或者恰恰打断了正在写的那一章。
 * 谈判桌活在 **phase 4**（`awaiting-gold`），两件都成立不了：那里没有「正在写的这一章」，
 * 而意见的消费方是**下一轮**——正在跑的那一轮检查**读不到**它（审计的必读矩阵里没有意见通道），
 * 正在跑的主笔 AI 也读不到它（意见透给 AI 的唯一出口是 brief 构造时刻）。
 * 所以原样复用「不打断正在写的这一章」这一档是说反话：用户读到一句与屏幕上发生的事相反的话，
 * 下一步就是「我是不是点坏了」。
 *
 * ⚠️ 与卡内那句常驻提示（`gold-table.DISPLAY_PERIOD_PENDING_HINT`）**说的是同一件事实**，
 * 措辞必须一致（两处都在说「这一轮检查不会读它」＋「等检查收工」）——**不许**一处说「没人读」、
 * 另一处说「AI 马上改」。分工是：这一句答「**记下了**」（6 秒自清），卡内那句答
 * 「**什么时候会被读到、下一步点什么**」（常驻）。
 */
export const GOLD_NOTE_DISPLAY_PERIOD =
	"💡 记下了；这一轮检查不会读它，等检查收工再点【让 AI 照这些改】。";
export const GOLD_NOTE_AWAITING_SEAL =
	"💡 记下了；点【让 AI 照这些改】，AI 才会照它改。";

/**
 * 这一次提交该弹哪一档提示条（纯函数，唯一出口）——票 `gold-display-period/01`。
 *
 * 原式把这份判据**内联**在 `client-entry.js` 的 `postAction` 里，且相位那一格写死
 * `meta?.phase === 5`。票 `walkthrough-fixes/30②` 打开过它一轮——**只打开了动作名单那一半**
 * （把 `gold-opinion` 加进名单，注释逐字记着「动作名单**漏了一支**」），**相位那一半没动**；
 * 而谈判桌只活在 phase 4 ⇒ gold 的意见**结构上**拿不到提示条。这不是文案漏写，
 * 是**判据的枚举面比现实窄了一格**。
 *
 * ⚠️ **调用方先过「这一次动作值不值得回一句」那一关**：那串名单
 * （`["style-note", "intervene", "review"]` ＋ 单独比较的 `gold-opinion`）**必须留在
 * `client-entry.js`**——契约面动作目录那条静态闸把「文件 ＋ 这一串名字 ＋ 写法」绑成一条豁免
 * （见 `test/test-contract-action-catalog.mjs` 的 `UI_RULE_LITERALS`），搬到本文件会让它当场红。
 * 所以本函数只吃「名字里**单独一个** `gold-opinion`」这一位（单个名字的比较不是「第二份动作名
 * 清单」，那条闸管的是成串的 ≥3 个）。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：本函数只认「哪一相位 ＋ 哪一状态」这几位，
 * **不认**「这一次提交是不是真成功了」——那一半留在壳里（`json !== null` 才出条），
 * 也不认「用户有没有在看这一屏」（横幅自己会自清，那是另一件事）。
 *
 * @param {{ action?: string, meta?: object | null, pendingStage?: unknown }} facts
 * @returns {string | null} `null`＝这一次不弹（不是「弹一句空话」）
 */
export function interruptNoteText({ action, meta, pendingStage } = {}) {
	if (action === "gold-opinion") {
		// 展示期（章稿在盘、这一步还没交工）：立刻回一句「记下了」，并且**如实说**这一轮没人读它。
		if (goldDraftDisplayed(meta, pendingStage)) return GOLD_NOTE_DISPLAY_PERIOD;
		// 交工之后（`awaiting-gold` 而待办已清）：此刻 AI 不会自己动，改不改由用户点那颗键决定。
		if (meta?.status === "awaiting-gold") return GOLD_NOTE_AWAITING_SEAL;
		// 其余（**带 chapter 的** `gold-opinion`：它走 `pendingReviews` 那条路，不是谈判桌）
		// 落到下面铺章那一档，照旧。
	}
	if (meta?.phase !== 5) return null;
	if (meta?.status === "awaiting-chapters-review") return INTERRUPT_NOTE_TEXT_BREAKS_CHAPTER;
	if (meta?.status === "running") return INTERRUPT_NOTE_TEXT;
	return null;
}

/**
 * 不打断提示条。`text` 缺省就是「不打断」那一档（**铺章途中的行为一个字不变**）；
 * 过目态那一条由调用方显式传另一句进来。
 */
export function InterruptNote(props) {
	return createElement(
		"div",
		{
			role: "status",
			style: {
				position: "sticky",
				top: 0,
				zIndex: 20,
				margin: "0 0 10px",
				padding: "8px 12px",
				borderRadius: "8px",
				fontSize: "13px",
				background: "var(--dsw-alias-state-business-tertiary)",
				border: "1px solid var(--dsw-alias-state-business-primary)",
				boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
				display: "flex",
				alignItems: "center",
				gap: "8px",
			},
		},
		createElement(
			"span",
			{ style: { flex: 1 } },
			props.text ?? INTERRUPT_NOTE_TEXT,
		),
		createElement(
			"button",
			{ style: S.smallLink, onClick: props.onClose },
			"✕",
		),
	);
}

// ── 自动跟随横幅（F5/Task 20 方案 A）：等拍板回现在 / AI 干活跳过去 ─────────────

// 顶部滑入动画（横幅共用，一次定义到处引用）。
// 判据 7（票 05）：统一 250ms ease-out；系统设了「减少动态效果」时关掉位移。
// ⚠️ 本仓零 CSS 文件、样式只走内联对象 ⇒ 这条 @media 只能落在同一条 <style> 注入里，
//    用 `[data-auto-follow]` + `!important` 盖过内联的 animation。
const AUTO_FOLLOW_KEYFRAMES =
	"@keyframes dsh-auto-follow-in { from { transform: translateY(-10px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }" +
	" @media (prefers-reduced-motion: reduce) { [data-auto-follow] { animation: none !important; } }";
// 横幅共用样式：粘顶（内容滚它不滚）、顶部滑入、与 F17 不打断提示条同一视觉语言。
const AUTO_FOLLOW_BANNER_STYLE = {
	position: "sticky",
	top: 0,
	zIndex: 20,
	margin: "0 0 10px",
	padding: "8px 12px",
	borderRadius: "8px",
	fontSize: "13px",
	background: "var(--dsw-alias-state-business-tertiary)",
	border: "1px solid var(--dsw-alias-state-business-primary)",
	boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
	display: "flex",
	alignItems: "center",
	gap: "8px",
	animation: "dsh-auto-follow-in 250ms ease-out",
};

// 等拍板横幅：AI 进入 awaiting-* 且你正在翻历史时强制切回「现在」并亮这一条（6 秒自清由 WorkbenchView 定时器负责）。
export function AutoFollowAwaitNote(props) {
	return createElement(
		"div",
		{ role: "status", "data-auto-follow": "1", style: AUTO_FOLLOW_BANNER_STYLE },
		createElement("style", null, AUTO_FOLLOW_KEYFRAMES),
		createElement(
			"span",
			{ style: { flex: 1 } },
			"⚡ 轮到你，已切回现在",
		),
		createElement(
			"button",
			{ style: S.smallLink, onClick: props.onClose },
			"✕",
		),
	);
}

// AI 干活跳过去横幅：浏览历史时 AI 出了新进展，整条可点（点击清浏览、回「现在」）。
export function AutoFollowProgressNote(props) {
	const onDismiss = props.onDismiss ?? (() => {});
	return createElement(
		"div",
		{
			role: "status",
			"data-auto-follow": "1",
			style: { ...AUTO_FOLLOW_BANNER_STYLE, cursor: "pointer" },
			onClick: props.onJump,
		},
		createElement("style", null, AUTO_FOLLOW_KEYFRAMES),
		createElement("span", { style: { flex: 1 } }, "▶ 我正在做，点此跳过去"),
		createElement(
			"button",
			{
				style: S.smallLink,
				onClick: (e) => {
					e.stopPropagation();
					onDismiss();
				},
			},
			"✕",
		),
	);
}

// ── 顶栏介入工具条（常驻：书名 + 当前阶段 + 🎨风格线 / 📮留言 / ⏸暂停） ─────────

export function TopBar(props) {
	const { meta, openStylePanel, openIntervene, pause, resume } = props;
	// 计数从 meta 现算（旧账本 ?? [] 兜底）：风格线数=active 条数，留言数=pending 条数。
	const styleCount = (meta?.styleNotes ?? []).filter(
		(n) => n.status === "active",
	).length;
	const pendingCount = (meta?.pendingInterventions ?? []).filter(
		(i) => i.status === "pending",
	).length;
	return createElement(
		"div",
		{
			style: {
				display: "flex",
				alignItems: "center",
				gap: "8px",
				padding: "6px 8px",
				borderBottom: "1px solid var(--dsw-alias-border-l2)",
				flexWrap: "wrap",
			},
		},
		createElement("strong", null, `《${meta?.name ?? ""}》`),
		createElement(
			"span",
			{ style: { fontSize: "12px", opacity: 0.75 } },
			`一起做到：${phaseUi(meta?.phase)}`,
		),
		createElement("span", { style: { flex: 1 } }),
		styleCount > 0
			? createElement(
					"button",
					{
						style: S.smallLink,
						onClick: openStylePanel,
						// 票 `demo-channel-full/26`：这一句对演示书是假话（章正文是固定内容，
						// ⛔ 没有「写每一章都照着办」这回事）⇒ 两取值，出口在 view-rules。
						title: styleNotesPanelTitle(meta),
					},
					`🎨 风格线(${styleCount})`,
				)
			: null,
		pendingCount > 0
			? createElement(
					"button",
					{
						style: S.smallLink,
						onClick: openIntervene,
						// 票 `walkthrough-fixes/21`：原来是「留言稍后处理：不打断 AI，它到下个停靠点会看」——
						// 那句时机承诺是假话（当轮就转达）。且这颗键**所有相位都在**，而「不打断」只在
						// 铺章途中成立 ⇒ 这里只留两态事实，不说「不打断」。
						title: "留言：有 AI 在跑时当轮转达，没有 AI 在跑时等到下一站",
					},
					`📮 留言(${pendingCount})`,
				)
			: null,
		meta?.pause != null
			? [
					// 票 10（spec §3 热区表把「顶栏 ⏸ 暂停 / ▶ 已暂停·点继续」判**不合法**；不变量 2
					// 「一个热区只干一件事」）：**状态归状态**——「已暂停」是纯指示，不是 `<button>`、
					// 没有 onClick、不替用户发动作；也故意不借 `S.smallLink`（那套带 `cursor:pointer`
					// ＋下划线，会让纯指示看着像能点）。旧文案「▶ 已暂停·点继续」把状态陈述与动作
					// 缝进同一句话、还与「⏸ 暂停」共用位置，已退役。
					createElement(
						"span",
						{
							key: "paused-indicator",
							style: { fontSize: "12px", opacity: 0.75 },
							title: "这本书现在是暂停的",
						},
						"⏸ 已暂停",
					),
					// **动作归动作**：独立的「▶ 继续」，独占自己的热区；文案只说动作、不说状态
					// （spec §3 热区表：改法＝一颗显式按钮「▶ 继续」）。
					createElement(
						"button",
						{
							key: "resume-button",
							style: { ...S.smallLink, color: "#1a7f37" },
							onClick: resume,
							title: "继续从断点接着写",
						},
						"▶ 继续",
					),
				]
			: createElement(
					"button",
					{
						style: S.smallLink,
						onClick: pause,
						title: "暂停：这次先停下手里的活，听我的",
					},
					"⏸ 暂停",
				),
	);
}

// ── 顶栏展开面板：🎨 风格线清单 / 📮 留言清单（点开即见，✕ 收起） ───────────────

export function StylePanel(props) {
	// 票 `demo-channel-full/26`：面板里那两句话对演示书是假话（同 `StylePanel` 上方那颗键的理由）
	// ⇒ 认得出演示书要 `meta`（出口＝`view-rules.styleLinePanelHeading`／`styleLinePanelHint`）。
	const { notes, onClose, meta } = props;
	const list = notes ?? [];
	return createElement(
		"div",
		{
			style: {
				...S.card,
				borderColor: "var(--dsw-alias-state-business-primary)",
				marginTop: "8px",
			},
		},
		createElement(
			"div",
			{
				style: {
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: "8px",
				},
			},
			createElement(
				"strong",
				{ style: { fontSize: "13px" } },
				`${styleLinePanelHeading(meta, list.length)}`,
			),
			createElement(
				"button",
				{ style: S.smallLink, onClick: onClose },
				"✕ 收起",
			),
		),
		list.length === 0
			? createElement(
					"p",
					{ style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
					"还没有风格意见。",
				)
			: list.map((note, index) =>
					createElement(
						"div",
						{
							key: note.id,
							style: { margin: "6px 0", fontSize: "13px", lineHeight: 1.55 },
						},
						createElement(
							"span",
							{ style: { fontWeight: 600 } },
							`#${index + 1}`,
						),
						` ${note.text ?? ""}`,
						note.note != null && note.note !== ""
							? createElement(
									"span",
									{ style: { opacity: 0.6, fontSize: "12px" } },
									`（${note.note}）`,
								)
							: null,
					),
				),
		createElement(
			"p",
			{ style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
			styleLinePanelHint(meta),
		),
	);
}

export function IntervenePanel(props) {
	const { items, onClose } = props;
	const list = items ?? [];
	return createElement(
		"div",
		{ style: { ...S.card, borderColor: "#e3b341", marginTop: "8px" } },
		createElement(
			"div",
			{
				style: {
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: "8px",
				},
			},
			createElement(
				"strong",
				{ style: { fontSize: "13px" } },
				`📮 你的留言（${list.length} 条待处理）`,
			),
			createElement(
				"button",
				{ style: S.smallLink, onClick: onClose },
				"✕ 收起",
			),
		),
		list.length === 0
			? createElement(
					"p",
					{ style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
					"没有待处理的留言。",
				)
			: list.map((item) =>
					createElement(
						"div",
						{
							key: item.id,
							style: { margin: "6px 0", fontSize: "13px", lineHeight: 1.55 },
						},
						createElement(
							"span",
							{ style: { opacity: 0.6, fontSize: "12px" } },
							formatTime(item.at),
						),
						item.target != null && item.target !== ""
							? createElement(
									"span",
									{
										style: {
											opacity: 0.7,
											fontSize: "12px",
											marginLeft: "6px",
										},
									},
									`（${item.target}）`,
								)
							: null,
						createElement("div", null, item.text ?? ""),
					),
				),
		createElement(
			"p",
			{ style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
			// 票 `walkthrough-fixes/21`（2026-10-06 裁决「甲」）：原句「…到下个停靠点处理（不打断它正在写的章）」
			// 是一句**与机器行为相反的承诺**——实测主 AI **当轮**就把意见转达给了正在写的那一章
			//（`resources/references/audit-and-testing.md` §11.2 的硬触发，那是仓里早写下的规则）。
			// 换成**只说可见事实 ＋ 两态**：有 AI 在跑 → 当轮叮嘱（可见证据＝账本那行「转达第 N 章…」）；
			// 没有 AI 在跑 → 它躺在待处理清单里，等到下一站。行为一个字没动。
			"想给 AI 留言？在对话里直接说，它会记成留言。有 AI 在跑时会被当轮叮嘱，你会看到『转达第 N 章…』那一行；没有 AI 在跑时它等到下一站。",
		),
	);
}

// ── 自定义模式库面板（2026-08-21）：粘贴描述 → AI 分析成「模式卡」加入本书 ──────

export function PatternPanel(props) {
	// 票 `demo-channel-full/26`：这一段说明对演示书是假话（演示支回的是**占位卡**，
	// 见 `view-rules.patternPasteHint` 的读数）⇒ 认得出演示书要 `meta`。
	const { patterns, busy, onAnalyze, onClose, result, meta } = props;
	const [text, setText] = useState("");
	const list = patterns ?? [];
	return createElement(
		"div",
		{
			style: {
				...S.card,
				borderColor: "var(--dsw-alias-state-business-primary)",
				marginTop: "8px",
			},
		},
		createElement(
			"div",
			{
				style: {
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: "8px",
				},
			},
			createElement(
				"strong",
				{ style: { fontSize: "13px" } },
				"🧩 自定义模式库",
			),
			createElement(
				"button",
				{ style: S.smallLink, onClick: onClose },
				"✕ 收起",
			),
		),
		createElement(
			"p",
			{
				style: {
					margin: "6px 0",
					fontSize: "12px",
					opacity: 0.75,
					lineHeight: 1.6,
				},
			},
			patternPasteHint(meta),
		),
		createElement("textarea", {
			style: { ...S.textarea, minHeight: "64px" },
			placeholder:
				"例：每个知识点先给一个生活中的真实场景引出概念，再配一道由浅入深的例题，最后放一道易错判断题……",
			value: text,
			onChange: (e) => setText(e.target.value),
		}),
		createElement(
			"div",
			{ style: { display: "flex", alignItems: "center", gap: "10px" } },
			createElement(
				"button",
				{
					style: S.disabled(S.bigBtn(true), busy || text.trim() === ""),
					disabled: busy || text.trim() === "",
					onClick: () => {
						onAnalyze(text.trim());
						setText("");
					},
				},
				"🤖 让 AI 分析并加入模式库",
			),
			busy
				? createElement(
						"span",
						{ style: { fontSize: "12px", opacity: 0.7 } },
						"AI 分析中…",
					)
				: null,
		),
		result !== null
			? createElement(
					"div",
					{
						style: {
							marginTop: "8px",
							padding: "8px 10px",
							borderRadius: "8px",
							background: "var(--dsw-alias-state-success-tertiary)",
							fontSize: "12px",
							lineHeight: 1.6,
						},
					},
					createElement(
						"strong",
						null,
						`✅ 已加入模式库：${result.name ?? ""}`,
					),
					result.problem != null && result.problem !== ""
						? createElement(
								"p",
								{ style: { margin: "4px 0 0" } },
								`解决：${result.problem}`,
							)
						: null,
					result.blocks != null && result.blocks !== ""
						? createElement(
								"p",
								{ style: { margin: "2px 0 0" } },
								`落地：${result.blocks}`,
							)
						: null,
				)
			: null,
		createElement(
			"p",
			{ style: { margin: "8px 0 4px", fontSize: "12px", opacity: 0.7 } },
			list.length === 0
				? "这本书还没有自定义模式。"
				: `已在这本书的模式库里（${list.length} 张）：`,
		),
		list.map((p, index) =>
			createElement(
				"div",
				{
					key: p.file ?? index,
					style: { margin: "3px 0", fontSize: "12px", lineHeight: 1.5 },
				},
				`· ${p.title ?? p.name ?? ""}${p.problem != null && p.problem !== "" ? ` — ${p.problem}` : ""}`,
			),
		),
	);
}

// ── 读者情况问卷面板（票 `reader-cognition-boundary-build/03`；票 `ui-display-redesign/11` 三态）──
//
// 这条通道只有一次往返：**给出一份 `.md`**（服务端写进书夹 → 这里给一颗下载键，走通用下载路由）
// → 收卷人填 → **造书用户把整段文字手粘回这个框**（无长度上限）→ 服务端逐字落成书夹一份 `.md`。
//
// 票 `ui-display-redesign/11` 把面板拆成**三个互斥态**（spec §4；ADR-0038 决策 3 的「收卷人第一问点选
// ＋三版问法」由本票取代）：
//   · 发卷（默认）：说明 ＋ `📄 生成问卷`／`⬇️ 下载问卷（.md）`；**零收卷人控件、零系统默认**。
//   · 回卷：无上限粘贴框 ＋ **此时才问** `这份是谁填的？` `本人／监护人／老师`（必选、无系统默认）
//     ＋ `📥 收下这份回卷`（粘贴有字且选了人才亮）。收卷人随 `reader-questionnaire-submit` 一起发出去，
//     服务端写 `meta.answerer`（写点从 `explore-confirm` 挪来）。
//   · 已收卷：回执（谁填的＋时间）＋ `🧭 去看知识点图接着划` ＋ `再粘一份`／「重新下载」。
//     ⚠️ 回执的**第一来源是盘上事实**：`returned`（`/textbook/events` 下发的回卷件原文）＋
//     `meta.answerer`／`meta.answererAt`——刷新／切书回来仍是同一份；`receipt` 只是本会话刚收下那一帧的
//     兜底（刷新后由盘上两格接管，⛔ 不是第二份事实源）。
//
// ⚠️ 为什么这个框**不许有** `maxLength`：本仓 note 类字段是 `trim().slice(0, max)`（200–500 字），
// 塞一份答卷进去会被**静默截断**——那正是这条通路要绕开的形状。粘进来的内容不要求合格式
// （跑题散文、只答一半都收），映射到上沿／下沿是 AI 的活。
// ⚠️ 它**不承诺**实时、多轮或协作面：表单只有「给出」和「收回卷」两下，人不在线也照旧。
// ⚠️ 发卷 / 收卷都不改书的状态、不推进流程：它们只是把两件东西放进书夹（可选动作，不做放行条件）。

/** 回执时刻的人话：`今天 14:02`／`10月20日 09:05`／`2025年12月31日 23:07`；解析不了 ⇒ `null`。
 *
 * ⚠️ `now` 只给判据喂固定的「今天」（生产不传＝`Date.now()`）——不传时看的是**浏览器本地时区**。
 * 跨天/跨年都带日期，⛔ 不把旧回卷说成「今天」。
 *
 * @param {unknown} at  ISO 时刻（`meta.answererAt`）
 * @param {number} [now] 「今天」的参照时刻（毫秒）
 * @returns {string|null}
 */
export function receiptTimeText(at, now = Date.now()) {
	if (at === null || at === undefined || at === "") return null;
	const time = new Date(at);
	const stamp = time.getTime();
	if (!Number.isFinite(stamp) || !Number.isFinite(now)) return null;
	const reference = new Date(now);
	const pad = (value) => String(value).padStart(2, "0");
	const clock = `${pad(time.getHours())}:${pad(time.getMinutes())}`;
	const sameDay =
		time.getFullYear() === reference.getFullYear()
		&& time.getMonth() === reference.getMonth()
		&& time.getDate() === reference.getDate();
	if (sameDay) return `今天 ${clock}`;
	const monthDay = `${time.getMonth() + 1}月${time.getDate()}日`;
	return time.getFullYear() === reference.getFullYear()
		? `${monthDay} ${clock}`
		: `${time.getFullYear()}年${monthDay} ${clock}`;
}

/** 回卷态那一行策略说明（逐字，spec §4；⛔ 与 brief 里那三档策略句混用——那份是给 AI 的指令）。 */
const READER_QUESTIONNAIRE_STRATEGY_NOTE =
	"AI 按「谁填的」采取不同策略：本人＝自评证据；监护人＝第三方观察（只采明确项）；老师＝教学判断（可把重点/难点意见带进下一步 brief）。";

/** 三态都常显的尾注（逐字沿用；⛔ 不改强度：它只留证、不自动改已定内容）。 */
const READER_QUESTIONNAIRE_FOOT_NOTE =
	"这份回卷只是收进书夹留证：AI 会逐条读它，再回到图上核对；它不会自动改变任何已经定下的内容。";

export function ReaderQuestionnairePanel(props) {
	const {
		issued,
		returned,
		answerer,
		answererAt,
		receipt,
		busy,
		downloadHref,
		onIssue,
		onSubmit,
		onGoToGraph,
		onClose,
	} = props;
	// 「回卷」是本会话的**展开态**（默认折起：打开面板先看发卷那一态）。
	const [pasting, setPasting] = useState(false);
	const [text, setText] = useState("");
	// 收卷人**无系统默认**：`null` ＝ 还没选（回卷时才问、必选）。
	const [chosenAnswerer, setChosenAnswerer] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	// 回执的第一来源是盘上事实；`receipt`（本会话刚收下的那一帧）只是兜底。
	const sessionReceipt = receipt !== null && typeof receipt === "object" ? receipt : null;
	const diskReceipt = returned === true
		? {
			answerer: typeof answerer === "string" && answerer !== "" ? answerer : null,
			at: typeof answererAt === "string" && answererAt !== "" ? answererAt : null,
		}
		: null;
	// 票 `ui-display-redesign/17`（收口 review S7①）：**盘上事实优先**——`returned`＋`meta.answerer`
	// /`meta.answererAt` 是长命的真事实，会话态 `receipt` 只作「刚收下、快照还没到」那一帧的兜底；
	// 两格同时在场时按盘上那份说（⛔ 不让短命状态盖掉长命事实）。判据见 `test-component-cards.mjs`。
	const effectiveReceipt = diskReceipt !== null ? diskReceipt : sessionReceipt;
	const done = effectiveReceipt !== null;
	// 互斥三态：**回卷态优先**（从已收卷态点「再粘一份」要能回到表单），其次已收卷，最后发卷。
	const showBack = pasting === true;
	const showReceipt = done && showBack === false;
	const busyAll = busy === true || submitting === true;
	// 下载地址只给「发过卷」或「已有回卷」两档（发卷前那颗键不出现——文件还不存在）。
	const downloadRel = issued !== null && issued !== undefined ? issued : READER_QUESTIONNAIRE_ISSUED_REL;
	const downloadVisible = (typeof issued === "string" && issued !== "") || done;
	const downloadHrefValue = downloadVisible && typeof downloadHref === "function" ? downloadHref(downloadRel) : null;
	const receiptAnswerer = effectiveReceipt?.answerer ?? null;
	const receiptClock = effectiveReceipt === null ? null : receiptTimeText(effectiveReceipt.at);
	const canSubmit = busyAll === false && text.trim() !== "" && chosenAnswerer !== null;
	const submitReturn = async () => {
		if (!canSubmit) return;
		setSubmitting(true);
		try {
			const accepted = await onSubmit(text, chosenAnswerer);
			// 壳收下（真写成功）才清空输入；失败时留着——别让用户白粘一遍。
			if (accepted !== false) {
				setText("");
				setChosenAnswerer(null);
				setPasting(false);
			}
		} finally {
			setSubmitting(false);
		}
	};
	return createElement(
		"div",
		{
			style: {
				...S.card,
				borderColor: "var(--dsw-alias-state-business-primary)",
				marginTop: "8px",
			},
		},
		createElement(
			"div",
			{
				style: {
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: "8px",
				},
			},
			createElement("strong", { style: { fontSize: "13px" } }, "🧑‍🎓 读者情况问卷"),
			createElement("button", { style: S.smallLink, onClick: onClose }, "✕ 收起"),
		),
		createElement(
			"p",
			{ style: { margin: "6px 0", fontSize: "12px", opacity: 0.75, lineHeight: 1.6 } },
			"给收卷人的是一份 .md：可以打印出来手写、可以在电脑上直接改、也可以口头让人代填。"
				+ "填完把整段文字粘回下面这个框——多长都行，跑题、只答一半也可以。",
		),
		// ── 发卷键（三态常显；下载只在发过卷/已有回卷时出现）──────────────────────────
		createElement(
			"div",
			{ style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } },
			createElement(
				"button",
				{
					style: S.disabled(S.bigBtn(true), busyAll),
					disabled: busyAll,
					onClick: () => onIssue(),
				},
				"📄 生成问卷",
			),
			downloadHrefValue !== null
				? createElement(
						"a",
						{
							href: downloadHrefValue,
							style: { fontSize: "12px" },
							download: "",
						},
						"⬇️ 下载问卷（.md）",
					)
				: null,
		),
		// ── 已收卷：回执（谁填的＋时间，盘上事实优先）＋ 主路径 ＋ 再粘一份 ────────────
		showReceipt
			? createElement(
					"div",
					{ style: { margin: "10px 0 0" } },
					createElement(
						"p",
						{ style: { margin: "0 0 6px", fontSize: "12px", lineHeight: 1.6 } },
						// ⚠️ 整句放进**同一个文本节点**：屏幕上的人读、屏外的判据（`expectText`）都按连续文案认，
						// 拆成 `strong` ＋ 兄弟文本会让「已收下……（老师」跨节点、读起来像两句话。
						createElement(
							"strong",
							null,
							`✅ 已收下，存在书夹里了${receiptAnswerer === null ? "" : `（${receiptAnswerer}${receiptClock === null ? "" : `，${receiptClock}`}）`}`,
						),
					),
					createElement(
						"div",
						{ style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } },
						createElement(
							"button",
							{ style: S.smallLink, onClick: () => onGoToGraph() },
							"🧭 去看知识点图接着划",
						),
						createElement(
							"button",
							{
								style: S.smallLink,
								onClick: () => {
									setPasting(true);
									setText("");
									setChosenAnswerer(null);
								},
							},
							"再粘一份",
						),
					),
				)
			: null,
		// ── 回卷态（收卷人此时才问；必选、无系统默认）────────────────────────────────
		showBack
			? createElement(
						"div",
						{ style: { margin: "10px 0 0" } },
						// ⚠️ **无长度上限**：不写 `maxLength`（见上面那条注释）。
						createElement("textarea", {
							style: { ...S.textarea, minHeight: "160px" },
							placeholder: "把收卷人填好的整段文字粘到这里（多长都行，不用管格式）",
							value: text,
							onChange: (e) => setText(e.target.value),
						}),
						createElement(
							"p",
							{ style: { margin: "10px 0 6px", fontSize: "12px", fontWeight: 600 } },
							"这份是谁填的？",
						),
						createElement(
							"div",
							{ style: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" } },
							// ⚠️ 三选一用**键**而不是 radio：面板的驱动面（画廊 `ui.drive` 的 click）只认
							// `<button>`，radio 会让「回卷 → 选人 → 收下」那条链在画廊/走查里造不出来。
							// 「必选、无系统默认」由 `chosenAnswerer === null` 现算（⛔ 不预选任何一档）。
							...EXPLORE_CONFIRM_ANSWERERS.map((one) =>
								createElement(
									"button",
									{
										key: one,
										style: {
											fontSize: "12px",
											padding: "2px 10px",
											borderRadius: "6px",
											cursor: "pointer",
											border: chosenAnswerer === one
												? "1px solid var(--dsw-alias-state-business-primary)"
												: "1px solid var(--dsw-alias-border-l2)",
											background: chosenAnswerer === one
												? "var(--dsw-alias-state-business-tertiary)"
												: "transparent",
										},
										"aria-pressed": chosenAnswerer === one,
										onClick: () => setChosenAnswerer(one),
									},
									one,
								),
							),
						),
						createElement(
							"p",
							{ style: { margin: "6px 0", fontSize: "12px", opacity: 0.7, lineHeight: 1.6 } },
							READER_QUESTIONNAIRE_STRATEGY_NOTE,
						),
						createElement(
							"div",
							{ style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } },
							createElement(
								"button",
								{
									style: S.disabled(S.bigBtn(true), !canSubmit),
									disabled: !canSubmit,
									onClick: () => {
										void submitReturn();
									},
								},
								"📥 收下这份回卷",
							),
							busyAll ? createElement("span", { style: { fontSize: "12px", opacity: 0.7 } }, "处理中…") : null,
						),
					)
				: // ── 发卷态本态：只多一颗「粘一份回卷」的入口（⛔ 不在这里选收卷人）──────
					// （已收卷态不再重复摆它——那里已经有「再粘一份」那颗了。）
					showReceipt
						? null
						: createElement(
						"div",
						{ style: { margin: "10px 0 0" } },
						createElement(
							"button",
							{
								style: S.smallLink,
								onClick: () => {
									setPasting(true);
									setText("");
									setChosenAnswerer(null);
								},
							},
							"📥 粘一份回卷",
						),
					),
		createElement(
			"p",
			{ style: { margin: "8px 0 0", fontSize: "12px", opacity: 0.7 } },
			READER_QUESTIONNAIRE_FOOT_NOTE,
		),
	);
}

