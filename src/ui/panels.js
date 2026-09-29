/**
 * 造书工作台 · 顶栏、状态条与面板
 *
 * 常驻条/横幅族：协作状态条（现在轮到谁）、主 AI 活性行、不打断提示条、
 * 自动跟随横幅；顶栏介入工具条与其展开面板（风格线/留言/自定义模式库）。
 */

import { createElement, useState } from "react";
import { S } from "./styles.js";
import { formatTime, humanDuration } from "./rules.js";
// 界面用词表（批 2）：六阶段在界面上的字只此一份。
import { phaseUi, gateHuman } from "./view-rules.js";

// ── 协作状态条：现在轮到谁 ───────────────────────────────────────────────────

/**
 * 「这本书被暂停了吗」的唯一判据（票 walkthrough-fixes/22 · P6）。
 *
 * 为什么要单独一份：暂停这件事**三处各判各的**——顶栏判 `meta.pause` 出「⏸ 已暂停 / ▶ 继续」，
 * 状态条与活性行原先**全程不读** `meta.pause`，于是点完暂停同一屏既说「已暂停」又说
 * 「🤖 我正在做」（走查实测，且刷新后照旧）。判据同源，矛盾就没有第二处生长的地方。
 *
 * 判定归属（本票只落这一条）：**暂停优先**——`meta.pause` 一置上，正文这两处就不再说
 * 「我正在做」。⚠️ 「同一屏允许几个状态词」那个上限的裁决属于另一张票
 * （`16-状态词同屏打架.md`），这里不抢、也不新造第四个说法：暂停期间正文让位给顶栏那句。
 */
const pausedNow = (meta) => meta?.pause != null;

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

/** 「这一步**已经交办出去了**吗」——`pendingStage` 非空（`StatusStrip` 与 `ActivityLine` 共用同一份口径）。 */
const handedOverNow = (pendingStage) => pendingStage !== null && pendingStage !== undefined;

/**
 * 「我正在做」这句此刻**没有内容支撑**吗（票 `walkthrough-fixes/14` 的全部判据，**只有这一处**）。
 *
 * ⚠️⚠️ **两个前提缺一不可，少一个就变成「一律闭嘴」，而那不是本票的裁决**：
 *   ① **已交办**（`pendingStage` 非空）——机器已经把某一步交出去了，才谈得上「说了却说不出在做什么」；
 *   ② **零 `progress`**（`stageScopedProgressDetail` 返回 `""`）——详情行整行消失。
 *
 * **只有这两条同时成立**（＝宿主重启后、恢复链补了 `stage-start` 还没补 `progress` 的那一段窗口）
 * 才摘掉那半句。**下面这些一律留着**：
 *   · **跑动中、尚未交办**（`status: "running"`、`updatedAt` 刚动、没判停）：AI **确实在跑**，
 *     「🤖 我正在做」是**实话**；摘掉它等于用一句新的假静默换一句旧的实话（`smoke-test.mjs:5680`
 *     「活性行·回合中态不对」钉的就是这一格，**它是既有事实，不是过期断言**）。
 *   · 有 `progress` 详情：那句**有**支撑。
 * ⚠️ 第一次落地时这里**漏了前提 ①**（只判了 `progressDetail` 空不空），范围比裁决宽了一格，
 * 连带把上面那条老断言炸了——`StatusStrip` 一侧当时是对的。**两处必须走这一个函数**，
 * 不许各写各的（这正是本仓反复治的「一处改、另一处漏」）。
 */
const activityClaimUnsupported = (pendingStage, progressDetail) =>
	handedOverNow(pendingStage) && !hasProgressDetail(progressDetail);

/** 「轮到你」时你到底该做什么——一句大白话，按书的 status 给。
 *  批 1（2026-09-20）：状态词收敛成「轮到你 / 我正在做 / 已完成」，见 CONTEXT.md「工作台状态词」。 */
function humanTurnAction(status, gate, phase) {
	if (status === "awaiting-explore") return "确认读到的材料重点对不对";
	if (status === "awaiting-outline") return "确认章节安排";
	if (status === "awaiting-gold") return "确认最佳范例章";
	if (status === "awaiting-chapters-review") return "逐章过目";
	if (status === "awaiting-final-approval") return "对整本书做最后把关";
	// 批 4：原来写「拍板第 1 关」——同一屏的步清单写「第 1 次拍板 · 学习目标与难点」，两套词。
	if (gate !== null && gate.status === "awaiting")
		return gateHuman(gate.gate);
	if (phase === 1) return "上传教材（开始转换后 AI 会自动接手）";
	return "看一眼下面的卡片";
}

export function StatusStrip(props) {
	const { meta, gate, pendingStage, metaLabel, humanTurn, progressDetail } = props;
	const status = meta?.status ?? "active";
	const phase = meta?.phase ?? 1;
	const paused = pausedNow(meta);
	// 票 14：横幅详情行整格为空时，「我正在做」是**没有内容支撑**的断言 ⇒ 这一支整条不出声。
	// 判据走**唯一那一个函数** `activityClaimUnsupported`（两个前提：已交办 ＋ 零 progress），
	// 与 `ActivityLine` 同一份——**两处各判各的正是本仓反复治的那个病**。
	// `pendingStage` 为空时的「🤖 我正在做 · 准备下一步」是**另一格**、不在本票范围内：
	// 那一格机器压根没交办出去任何一步，它答的是「还没开始」而不是「正在做但说不清在做什么」。
	const detailEmpty = activityClaimUnsupported(pendingStage, progressDetail);
	let text = null;
	let tone = "normal";
	if (status === "delivered") {
		text = `🎉 书做好了 · 可以预览和下载《${meta.name ?? ""}》.md`;
		tone = "ok";
	} else if (status === "error" || status === "needs-config") {
		text =
			status === "error"
				? "⚠️ 轮到你 · 出错了，请看下面的提示"
				: "🔑 轮到你 · 需要配置，请看下面的提示";
		tone = status === "error" ? "error" : "you";
		// ⚡ 批 1 根因修复：原来这里按 status 逐条列举 awaiting-*，漏了 awaiting-outline /
		//    awaiting-chapters-review / awaiting-final-approval，于是终检屏落到 else 说
		//    「AI 正在准备下一步…」——与同屏的「等你把关」直接矛盾。
		//    现在「轮到谁」只在 client-entry 的 humanTurn 里判一次，这里只负责翻译成一句话。
	} else if (humanTurn === true || (gate !== null && gate.status === "awaiting")) {
		text = `⚡ 轮到你 · ${humanTurnAction(status, gate, phase)}`;
		tone = "you";
	} else if (paused) {
		// 票 22：暂停优先于「我正在做」。顶栏那一句「⏸ 已暂停」＋「▶ 继续」已经把状态说全了，
		// 这一条不补第二套说法（也不新造第四个状态词）——整条不出声，而不是留一个只剩边框的空条。
		// ⚠️ 「轮到你 / 出错 / 书做好了」那几支不受影响：它们说的不是「AI 还在跑」这件事。
		text = null;
		tone = "normal";
	} else if (pendingStage !== null && pendingStage !== undefined) {
		// 票 25（走查 P20）：这条横幅**只出状态词那半截**，不再把同一段进度叙述整段搬上来。
		// 那一段（100 多字）本来与焦点区主卡里的 `ChaptersCard` / `StatusCard` 各出一次，
		// 于是同一屏里同一段话渲染两三遍：白占一屏，还让人以为「它卡在同一个地方又说了一遍」
		// ＝进度停滞（恰好加重 P11 那个「看起来卡住了」的错觉）。
		//
		// 选**主卡**当主出口的理由：主卡是用户当下正在看的那一块，叙述放在那里才「就近可读」；
		// 横幅的身份是一行状态词，把一百多字塞进去既挤又吵，而且它会随滚动出屏——真需要时
		// 反而看不见。两张主卡互斥（`focusCardKey` 一次只出一张），所以一屏里必然恰好一次。
		//
		// ⚠️ 取数口径一个字没动：`stageScopedProgressDetail` 仍然只算一次、仍然喂给这三处
		// （票面明写不许为了去重去改它的取数口径）。
		//
		// 票 14：那一格**空**时（`detailEmpty`）整条不出声——横幅详情行整行消失的时候，
		// 这一句是**已知的假话**。见文件上方 `hasProgressDetail` 的注释。
		text = detailEmpty ? null : `🤖 我正在做 · ${metaLabel ?? ""}`;
		tone = "ai";
	} else {
		text = "🤖 我正在做 · 准备下一步";
		tone = "ai";
	}
	// 暂停期间这一条整条不出声（上面那一支的唯一出口）。
	if (text === null) return null;
	const bg = {
		ok: "var(--dsw-alias-state-success-tertiary)",
		you: "var(--dsw-alias-state-warn-tertiary)",
		ai: "var(--dsw-alias-state-business-tertiary)",
		error: "var(--dsw-alias-file-diff-deleted-bg)",
		normal: "transparent",
	}[tone];
	const border = {
		ok: "#1a7f37",
		you: "#d4a72c",
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
 * 判停时这句仍然先说状态词「🤖 我正在做」——照用户上报那屏的原句形态（「🤖 我正在做 · 好像卡住了」），
 * 撤掉的只是那句诊断与重复出口；状态卡那一行的「只报时长」是**另一件事**（它是这一步的计时行）。
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
	// 轮到用户时，状态条已经在说「⚡ 轮到你 · <要你做什么>」，这一行再喊一遍就是两行同话：
	// 只留子代理聚合；连聚合都没有就整行不出现。
	const stalled = (stall ?? {}).stalled === true;
	const paused = pausedNow(meta);
	// 票 22：暂停同理，且必须与状态条同改——只让状态条闭嘴，这一行仍会留着「🤖 我正在做 · 第 N 次拍板」那半句。
	// 暂停**不**掐掉子助手聚合：那一句说的是小助手（它们确实在跑），与「已暂停」（说的是主笔 AI）不是同一件事。
	//
	// 票 14：横幅详情行为空时（`textbook/progress` 一条都还没有，宿主重启后的那一段窗口），
	// 「🤖 我正在做」是**没有内容支撑**的断言——必须与状态条**同改**、读**同一份判据**，
	// 只让状态条闭嘴这一行照旧留着。判的是 `stageScopedProgressDetail` 的**空值**，**不是** `paused`
	// （两件事，理由见文件上方注释）。
	//
	// ⚠️⚠️ **判据带「已交办」前提**（`activityClaimUnsupported`），不是「`progressDetail` 空就摘」：
	// **跑动中、尚未交办**那一格（`status:"running"`、刚动过、没判停）AI **确实在跑**，
	// 那半句是**实话**——摘掉它等于用一句新的假静默换一句旧的实话
	// （`smoke-test.mjs:5680`「活性行·回合中态不对」钉的就是这一格）。第一次落地时这里漏了那个前提，
	// 把范围放宽了一格、连带炸了那条老断言；现在两处走同一个函数。
	//
	// ⚠️「从断点继续」那颗按钮**保留**：它答的是「能不能接着做」，是有内容支撑的（9.4 小时没动静
	// 正是最需要它的时候），把整条收掉等于把那一格唯一可操作的出口一起收走。
	// 收掉的只是那半句没有支撑的状态词——留下的是**纯事实**（多久没动静）与那颗按钮。
	const detailEmpty = activityClaimUnsupported(pendingStage, progressDetail);
	const idlePrefix = detailEmpty
		? `${humanDuration(stall?.idleMs)}没动静了 `
		: `🤖 我正在做 · ${humanDuration(stall?.idleMs)}没动静了 `;
	const content =
		humanTurn === true || paused
			? null
			: // 已交付＝全书完成：此时既不是「轮到你」也不是「我正在做」（真 GUI 判读实测：
				// 已交付的《工业大数据分析》活性行还写着「⚡ 轮到你」，同一屏却在大喊「🎉 书做好了」）。
				meta?.status === "delivered"
				? "✅ 已完成"
				: meta?.status !== "running"
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
						: detailEmpty
							? null
							: "🤖 我正在做";
	// 轮到用户、又没有子代理聚合 → 整行不出现（状态条已经说了「轮到你 · 要你做什么」）。
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
 */
export const INTERRUPT_NOTE_TEXT =
	"💡 已记下；不打断正在写的这一章，AI 到下个停靠点会照办";
export const INTERRUPT_NOTE_TEXT_BREAKS_CHAPTER =
	"💡 已记下；这一章交给 AI 去改了，过目先收起来了——AI 改完会把这一章重新摊开给你过目。";

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
const AUTO_FOLLOW_KEYFRAMES =
	"@keyframes dsh-auto-follow-in { from { transform: translateY(-10px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }";
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
	animation: "dsh-auto-follow-in 0.25s ease",
};

// 等拍板横幅：AI 进入 awaiting-* 且你正在翻历史时强制切回「现在」并亮这一条（6 秒自清由 WorkbenchView 定时器负责）。
export function AutoFollowAwaitNote(props) {
	return createElement(
		"div",
		{ role: "status", style: AUTO_FOLLOW_BANNER_STYLE },
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
						title: "你的风格意见清单（AI 写每一章都会照着办）",
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
						title: "留言稍后处理：不打断 AI，它到下个停靠点会看",
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
	const { notes, onClose } = props;
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
				`🎨 你的风格线（${list.length} 条：AI 写每一章都照着办）`,
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
			"想再记一条？在对话里直接跟 AI 说，它会记成风格线；写每一章都照着办。",
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
			"想给 AI 留言？在对话里直接跟 AI 说，它会记成留言，到下个停靠点处理（不打断它正在写的章）。",
		),
	);
}

// ── 自定义模式库面板（2026-08-21）：粘贴描述 → AI 分析成「模式卡」加入本书 ──────

export function PatternPanel(props) {
	const { patterns, busy, onAnalyze, onClose, result } = props;
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
			"粘贴一段你想要的教法/章节结构描述，AI 会把它提炼成一张「模式卡」加入这本书的模式库；第 2 次拍板「教学方法与板块」和写作规范都会优先参考它。",
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
					style: S.bigBtn(true),
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
