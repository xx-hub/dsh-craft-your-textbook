/**
 * 造书工作台 · 书级 UI 隔离壳（BookSessionScope）
 *
 * 它**不是**一张卡片，也不是一个新的业务 module：它是 ADR-0021 决策 9 / spec §8 说的那层
 * 「以稳定 bookKey 为 key 的隔离机制」——切会话或切书时，它整棵重挂，于是向导表单、
 * 阶段页、章节卡 / Gold 卡 / 确认卡各自的展开、输入、选中与乐观标记都不会跨书存活
 * （用户故事 17 / 5）。业务动作仍由 WorkbenchView 拥有，本壳一行业务逻辑都没有。
 *
 * 用法（WorkbenchView 里的接线点）：
 *   createElement(BookSessionScope, { key: bookKey }, (ui) => …)
 * **key 由调用方传**（值＝`snapshot.bookKey`）：React 只在父层给出的元素上比 key，
 * 放在壳内部就不生效。无书会话同样有非 null 的 bookKey（决策 7），所以「无书 A→B
 * 向导归零」也表达得出来——这也是不许用 `null` 当 key 的原因。
 *
 * ## 它现在**拥有**什么（票 05 起）
 *
 * 上一版它只是个透传 children 的 Fragment，于是那批书级 UI state 还住在 WorkbenchView 里、
 * 靠一条 `[session]` effect 归零。现在它们连同各自的 effect 一起搬进来了：
 *   - 导航/回看态：`viewPhase`（停在哪一阶段的页面）、`browsing`（在看哪一步）、`showHistory`
 *   - 账本回放里提案行的展开态 `gateOpen`
 *   - 三个书级展开面板的开关（🎨 风格线 / 📮 留言 / 🧩 模式库）与模式库三件
 *   - 自动跟随的两条横幅、6 秒自清定时器、不打断提示条
 *   - 无书向导的建议态（AI 建议清单 + 建议中）
 *   - 删书两步确认态 `deletingId`
 *   - 书级 action 的 `busy` / `error`
 *   - 两个书级 ref（浏览时记住的进度序号、等拍板「新到达」那一帧）
 * 留在壳**外面**的是：根高度、外层布局、对话台（高度与展开态）、破卷常驻广告、MinerU 设置
 * 与宿主状态（它们是全局的，不该被 bookKey 带着重挂——用户故事 31 / 32）。
 *
 * 壳**不产生任何 DOM 节点**（只透传 children），所以布局、间距与滚动容器一个像素都不变。
 *
 * ## children 的两种形态
 *
 * 1. **函数** `(ui) => node`：书级状态的**拥有者**。`ui` 是这一份壳的「值 + setter」，
 *    每次渲染重建；只有书级状态真在这棵树上时才用这种形态。
 * 2. **节点**：纯 key 边界。顶栏入口位用它——顶栏没有自己的书级 UI state，但它是**书级**
 *    入口（显示的是这一本书的阶段与动作），跟着 bookKey 重挂才对。
 *
 * ## 壳里只允许出现两样东西
 *
 * 书级 UI state，和**只读的 UI 反应**（横幅自清、自动跟随这两条纯客户端判据）。
 * 一切网络请求与业务动作仍在 WorkbenchView——壳不做 owner（决策 9）。
 */

import { createElement, Fragment, useEffect, useMemo, useRef, useState } from "react";
// 自动跟随的判据（纯函数，规则域的公开导出；`client-entry.js` 用的是同一份）。
import { shouldForceBackToNow } from "./rules.js";

// 空值必须是**模块级同一个引用**：每帧新建空数组会让下面两条 effect 白跑。
const NO_SUGGESTIONS = Object.freeze([]);
const NO_PATTERNS = Object.freeze([]);
const NO_EVENTS = Object.freeze([]);

export function BookSessionScope({ children, uiRef = null, meta = null, gate = null, events = NO_EVENTS }) {
	// ── 书级 UI state（ADR-0021 决策 9）─────────────────────────────────────
	// 「正在看哪一页阶段」（null＝「现在」）与「在看哪一步」是两件事，**都**是书级：
	// 阶段片是导航面，点一格＝去那一步的页面；点「当前阶段」那一格＝回到现在。
	const [viewPhase, setViewPhase] = useState(null);
	const [browsing, setBrowsing] = useState(null);
	// 「之前的过程」的展开态，以及里面拍板提案行的展开态（值＝那一行的行键，空＝全部收起）。
	const [showHistory, setShowHistory] = useState(false);
	const [gateOpen, setGateOpen] = useState(null);
	// 顶栏 🎨 风格线 / 📮 留言、🧩 自定义模式库三个书级展开面板的开关。
	const [showStylePanel, setShowStylePanel] = useState(false);
	const [showIntervenePanel, setShowIntervenePanel] = useState(false);
	const [patternOpen, setPatternOpen] = useState(false);
	// 模式库：拉回来的清单 / 分析中的忙碌 / 分析结果。
	const [patternBusy, setPatternBusy] = useState(false);
	const [patternResult, setPatternResult] = useState(null);
	const [patternList, setPatternList] = useState(NO_PATTERNS);
	// 自动跟随（方案 A）：等拍板强制回「现在」的横幅 + 浏览历史时 AI 有新进展的「跳过去」横幅。
	const [awaitBanner, setAwaitBanner] = useState(false);
	const [progressBanner, setProgressBanner] = useState(false);
	// 不打断提示条（F17）：铺章中提交风格线/留言/意见成功后，焦点区顶部滑入、6 秒自清。
	const [noteToast, setNoteToast] = useState(false);
	// 无书向导的 AI 建议态（人类只做确认）。
	const [suggestions, setSuggestions] = useState(NO_SUGGESTIONS);
	const [suggestLoading, setSuggestLoading] = useState(false);
	// 删书的两步确认态（第一步「取消这本书」把 id 收进来，第二下确认才发 `book-delete`）。
	const [deletingId, setDeletingId] = useState(null);
	// 书级 action 的忙碌与错误。**首屏的读取错误不在这里**——它从 readiness 派生，由
	// WorkbenchView 传进来（决策 11/16）；两者共用同一句 `⚠️ …`，位置与从前一致。
	const [error, setError] = useState(null);
	const [busy, setBusy] = useState(false);
	// 两个书级记忆：浏览时记住的进度序号（AI 再出的 progress 才算「新进展」），
	// 以及「等拍板状态新到达」那一帧（自动跟随只拉回一次）。
	const progressSeqRef = useRef(-1);
	const awaitingSeenRef = useRef(false);

	// 稳定命令句柄：WorkbenchView 的业务动作与顶栏入口在**壳外**，需要一条入口改这批
	// 书级 state。**它不是第二份状态**——就是上面这些 setter 本身（`useState` 的 setter
	// 引用不变），整个壳生命周期内是同一个对象。所以业务动作在进入时捕获它就能白拿一条
	// 「我还是当前身份吗」的判据：壳按 bookKey 重挂后，旧句柄所在的组件早已卸载，迟到写入
	// 被 React 直接丢弃，落不进新身份（用户故事 15 / 16）。
	const commands = useMemo(
		() => ({
			setViewPhase,
			setBrowsing,
			setShowHistory,
			setGateOpen,
			setShowStylePanel,
			setShowIntervenePanel,
			setPatternOpen,
			setAwaitBanner,
			setProgressBanner,
			setError,
			setBusy,
			setNoteToast,
			setDeletingId,
			setSuggestions,
			setSuggestLoading,
			setPatternBusy,
			setPatternResult,
			setPatternList,
			toggleStylePanel: () => setShowStylePanel((v) => !v),
			toggleIntervenePanel: () => setShowIntervenePanel((v) => !v),
		}),
		[],
	);
	// 渲染期发布（与 WorkbenchView 里 `bookRef.current = book` 同一款 latest-ref 写法）：
	// 子组件的 render 早于父组件的 effect，所以 WorkbenchView 的 effect 拿得到它。
	if (uiRef !== null) uiRef.current = commands;

	// 不打断提示条 6 秒自清（提交成功后亮起，到时自动收起；重渲/重挂前清掉旧定时器）。
	useEffect(() => {
		if (!noteToast) return undefined;
		const timer = setTimeout(() => setNoteToast(false), 6000);
		return () => clearTimeout(timer);
	}, [noteToast]);

	// 等拍板横幅 6 秒自清（到时自动收起；重渲/重挂前清掉旧定时器）。
	useEffect(() => {
		if (!awaitBanner) return undefined;
		const timer = setTimeout(() => setAwaitBanner(false), 6000);
		return () => clearTimeout(timer);
	}, [awaitBanner]);

	// 自动跟随（方案 A）：AI 开始等人类拍板时，若正在翻历史，强制切回「现在」并顶部亮
	// 「已切回现在」横幅（不打扰、不弹窗）。等拍板分两种：meta.status 变成 awaiting-*；
	// 或设计关卡等你拍板——此时 meta.status 仍是 running（proposeGate 不切状态），
	// 由 gate.status==='awaiting' 兜住（Task 24 回归发现：关卡拍板是主决策面，之前漏拉回）。
	// F33 修复（2026-08-20 走查）：只在该状态「新到达」那一刻拉回一次；之后用户已处于等拍板
	// 态、再主动点地图历史段 = 有意浏览/定点修改，不再强制打断——否则 awaiting-* 下永远进不了
	// 历史浏览，定点修改入口被堵死（与「随时能改」承诺冲突，实书走查实测）。
	//
	// ⚠️ 这条 effect 与它记的 `awaitingSeenRef` **一起**归本壳所有：换书时「刚到达那一刻」
	// 的记忆必须重来，否则新书第一次进入等拍板态不会拉回（那正是用户故事 17 说的事）。
	useEffect(() => {
		const st = meta?.status;
		const awaiting =
			(typeof st === "string" && st.startsWith("awaiting-")) ||
			(gate !== null && gate.status === "awaiting");
		if (shouldForceBackToNow(awaitingSeenRef.current, awaiting, browsing !== null)) {
			setBrowsing(null);
			setAwaitBanner(true);
		}
		awaitingSeenRef.current = awaiting;
	}, [meta?.status, browsing, gate]);

	// 自动跟随（方案 A）：浏览历史时 AI 出了「新」progress 事件 → 顶部滑入「AI 正在干活--点此跳过去」。
	// 新 = seq 大于开始浏览那一刻记住的进度序号（progressSeqRef），避免一进历史就把旧进展翻出来。
	useEffect(() => {
		if (browsing === null) return undefined;
		const lastProgress = [...events].reverse().find((e) => e.type === "textbook/progress");
		if (lastProgress !== undefined && lastProgress.seq > progressSeqRef.current) {
			progressSeqRef.current = lastProgress.seq;
			setProgressBanner(true);
		}
		return undefined;
	}, [events, browsing]);

	const ui = {
		...commands,
		viewPhase,
		browsing,
		showHistory,
		gateOpen,
		showStylePanel,
		showIntervenePanel,
		patternOpen,
		patternBusy,
		patternResult,
		patternList,
		awaitBanner,
		progressBanner,
		noteToast,
		suggestions,
		suggestLoading,
		deletingId,
		error,
		busy,
		progressSeqRef,
		awaitingSeenRef,
	};
	return createElement(Fragment, null, typeof children === "function" ? children(ui) : children);
}
