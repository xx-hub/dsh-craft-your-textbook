/**
 * 造书工作台 · 前端插件（浏览器侧，入口薄壳）
 *
 * 定稿方案 B 的界面：顶部书名 + 六格进度条（⚡轮到你高亮）→ 单张焦点卡
 * （现在该做什么）→ "▸ 之前的过程"可展开时间线。
 *
 * 焦点卡按状态切换：
 *  - 没有项目/新建 → 向导卡（书名/目标/路线/理科/合规声明）
 *  - Phase 1 → 上传区（PDF + 角色标签）＋ 开始转换
 *  - 关卡等待 → 关卡卡（通过/驳回+分流+预置理由+版本对比）
 *  - 机器运行 → 状态卡（"AI 正在……"实时更新）
 *  - 出错/缺配置 → 红色提示 + 重试
 *  - 交付 → 交付卡（质量门打勾 + 预览 + 下载 + 怎么用）
 *
 * 本文件只保留三样东西：
 *  1. 各 UI 域 module 的装配（import）+ 原有导出表面的桶式再导出（lib/client.js 表面不变）
 *  2. WorkbenchView——唯一知道所有卡片的工作台主状态路由（内部实现，暂不拆）
 *  3. apply(ctx)——向宿主组合注册槽位
 *
 * 拆分纪律（见 AGENTS.md）：src/ui/ 各域文件互不 import 对方未导出的符号；
 * 跨域协作只走导出符号或 WorkbenchView 传 props。
 */

import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { S } from "./ui/styles.js";
// 领域规则与纯函数（rules）：本文件直接用的 + 为保持产物表面而再导出的；
// 双端共享领域件（素材角色、六阶段、范例章号）以 src/domain-rules.js 为源。
import {
	formatTime,
	// 票 stale-detection/01：「多久没动静」的共用判定 + 小助手血缘聚合（三路输入、一个门槛，
	// 活性行与状态卡消费同一份结果；口径与宿主同源，见 docs/reference/dsh-session-contracts.md）。
	deriveStallJudgment,
	indexSubagentDescendants,
	// F22 已撤销（2026-09-22 票 12）：渲染处不再拿它门控阶段片，只为保住导出表面而再导出。
	mainProgressVisible,
	shouldForceBackToNow,
	chapterBadge,
	deriveDoneSet,
	splitParagraphs,
	paragraphHint,
	diffParagraphs,
	stageScopedProgressDetail,
	// 票 ad-strip-occlusion/01 + workbench-scroll/01（同一个 8px、同一次改动）：工作台底边锚点
	// 取「输入区**容器**的 top」，不取输入元素自身的 top——宿主作曲家卡在输入元素上方还有
	// padding-top / 提示语 / 排队消息行。判据与真机证据见 rules.js 里这一节的注释。
	pickComposerAnchorTop,
} from "./ui/rules.js";
// 展示派生（事件→文件、阶段→产物、stage→界面文案）集中放卡片域 view-rules.js，
// 壳只留薄绑定；领域源仍是 domain-rules。
import {
	stageHuman,
	gateHuman,
	workPathForEvent,
	// 事件行入口判据的三种处境（票 08）：open / blocked（给灰字）/ none（什么都不长）。
	workEntryForEvent,
	focusCardKey,
	workEntryAction,
	openableArtifacts,
	phaseOfSegment,
	stepsOf,
	artifactName,
	// 事件行行首的类型词（票 06）：只出客户端词表，不端服务端 label 上屏。
	eventHuman,
} from "./ui/view-rules.js";
// 上传上限与超限文案（前后端共享单一事实源，见 domain-rules.js）。
import {
	MAX_UPLOAD_BYTES,
	uploadTooLargeMessage,
	EVENT_META,
} from "./domain-rules.js";
// 「打开一份文件看看」的地址拼装（dsh-resource://file/…，见 ADR-0010 决策 8）。
import { bookFileAddress } from "./ui/file-address.js";
// 最小 markdown 渲染。
import {
	READER_PARA_STYLE,
	renderInline,
	exploreReportBlocks,
} from "./ui/md-render.js";
// 阶段页（点阶段片落到的那一页）：按每一步的天性定制布局，见该文件顶部说明。
import { PhasePage, OpenArtifactButton } from "./ui/phase-page.js";
// 流程卡片群。
import {
	cardText,
	cardIcon,
	PhaseBar,
	WizardCard,
	UploadArea,
	StatusCard,
	DeliveryCard,
	FinalApprovalCard,
	rejectPayload,
	GatePanel,
	MineruTokenCard,
} from "./ui/event-cards.js";
// 对话台（与「自动打开页签」共用同一个消息来源推导）。
import { ChatDesk } from "./ui/chat-desk.js";
import { deriveChatDeskNodes } from "./ui/chat-source.js";
// 谈判桌。
import {
	GoldOpinionList,
	GoldReader,
	GoldCompare,
	GoldFinalize,
	GoldTable,
} from "./ui/gold-table.js";
// 章节清单与步清单（全览条 / 底部常驻小条 / 右下角广告卡）。
// ⚠️ 旧的「分段单卡」三件套（`BrowseSection` / `HistoryBrowser` / `FileViewer`）2026-09-21 已删：
// 合并后焦点区只剩阶段页一种页面，它们既不在渲染路径上、又是同一件事的第二份实现（详见
// `.scratch/workbench-transitions/issues/02-焦点区只有一种页面.md`）。
import {
	ChaptersCard,
	ProgressOverview,
	FocusFooter,
	SocratopiaAd,
	foldKnowledgeMap,
} from "./ui/chapters-map.js";
// 确认卡。
import { ExploreConfirmCard, OutlineConfirmCard } from "./ui/confirm-cards.js";
// 顶栏、状态条与面板。
import {
	StatusStrip,
	ActivityLine,
	InterruptNote,
	AutoFollowAwaitNote,
	AutoFollowProgressNote,
	TopBar,
	StylePanel,
	IntervenePanel,
	PatternPanel,
} from "./ui/panels.js";
// 硬依赖（ADR-0010 决策 7）：右侧 Sidebar 的预览服务。解不到就不加载本插件——
// 绝不让「打开一份文件看看」退化成点了没反应的按钮（不写 ctx.get 兜底）。
export const inject = ["slots", "sessions", "sidebarRight"];

// ── 导出表面（与拆分前 lib/client.js 完全一致，冒烟测试穿过这些名字）────────

export {
	chapterBadge,
	deriveDoneSet,
	mainProgressVisible,
	shouldForceBackToNow,
	splitParagraphs,
	paragraphHint,
	diffParagraphs,
};
export { READER_PARA_STYLE, renderInline, exploreReportBlocks };
// 产物行按钮（票 02）：阶段页三处调用点与事件行共用**同一个**具名导出件，
// 跨域协作只走导出符号（见 AGENTS.md「Frontend layout」）——别再抄第二份按钮实现。
export { OpenArtifactButton };
export {
	cardText,
	cardIcon,
	PhaseBar,
	WizardCard,
	UploadArea,
	StatusCard,
	DeliveryCard,
	FinalApprovalCard,
	rejectPayload,
	GatePanel,
	MineruTokenCard,
};
export { ChatDesk };
export { GoldOpinionList, GoldReader, GoldCompare, GoldFinalize, GoldTable };
export {
	ChaptersCard,
	ProgressOverview,
	FocusFooter,
	SocratopiaAd,
	foldKnowledgeMap,
};
export { ExploreConfirmCard, OutlineConfirmCard };
export {
	StatusStrip,
	ActivityLine,
	InterruptNote,
	AutoFollowAwaitNote,
	AutoFollowProgressNote,
	TopBar,
	StylePanel,
	IntervenePanel,
	PatternPanel,
};

// ── 自动打开器：造书会话首次对话后，自动切到"工作台"页签 ────────────────────
// ⚠️ 行为变更（票 dsh-contract-drift/02）：这条行为此前**从未生效**（判据读在会话快照上、
// 恒为 0）。修好后它是**第一次真正生效**——造书会话里发出第一条消息即自动切到「工作台」页签
// （仅一次；用户手动切回「对话」后不再打扰）。

export function AutoOpenWorkbench(props) {
	// 真实契约：会话列表记录的 agentPreset 在 projectionValues 里（host 经
	// control 帧镜像），顶层没有该字段——读错会导致永远非 textbook。
	const isTextbook =
		props.useSessions(
			(s) => s.byId[props.sessionId]?.projectionValues?.agentPreset,
		) === "textbook";
	// 消息来源＝宿主对话区用的那一份（聊天快照的节点仓 + 它给的顺序），与对话台**共用**
	// `src/ui/chat-source.js` 的同一个推导（票 dsh-contract-drift/02：原来读会话快照的 `nodes`，
	// 那个字段不在它身上 → 计数恒 0 → 这条行为自上线起从未触发过）。
	// ⚠️ 老会话记录（磁盘上只有旧版 session.jsonl.zstd、没有 v3 日志）可能给不出聊天快照，
	// 推导取不到就返回空清单，绝不抛——这个槽位条目崩掉会让整个页头小工具位失败。
	const messageCount = deriveChatDeskNodes(props.useChat((s) => s)).length;
	const doneRef = useRef(false);

	useEffect(() => {
		if (doneRef.current || !isTextbook || messageCount === 0) return;
		// 找到"工作台"页签并激活（仅一次；用户手动切回"对话"后不再打扰）。
		const target = [...document.querySelectorAll('[role="tab"]')].find(
			(el) => (el.textContent ?? "").trim() === "工作台",
		);
		if (target === undefined) return;
		doneRef.current = true;
		if (target.getAttribute("aria-selected") === "true") return;
		target.click();
	}, [isTextbook, messageCount]);

	return null;
}

// ── 工作台主视图 ────────────────────────────────────────────────────────────

// 导出仅为可测（票 05）：冒烟测试用 renderToStaticMarkup 渲不动它（带 useSession/轮询
// effect），切会话归零那条断言需要**真渲染**这个组件——test-session-switch-reset.mjs
// 用 react-test-renderer + 桩 props 驱动它。组件本身仍是内部实现、不拆。
export function WorkbenchView(props) {
	// 会话模式门控：只在「造书模式」显示工作台（useSessions 选择器返回稳定值，安全）。
	const sessionPreset = props.useSessions(
		(s) => s.byId[props.sessionId]?.projectionValues?.agentPreset ?? null,
	);
	const session = props.sessionId;
	// 会话工作区根（客户端会话记录里的 cwd）：右栏预览的地址以它为基准折成相对路径。
	const cwd = props.useSessions((s) => s.byId[props.sessionId]?.cwd ?? null);
	// 「多久没动静」的判定（票 stale-detection/01）：三路输入——主 AI 在不在跑、账本新鲜度、
	// 有没有小助手在跑；算式与门槛归 `src/ui/rules.js`，这一屏的显示只消费它算出来的同一份结果。
	//
	// ① 主 AI 在不在跑：**照宿主自己的判法**读会话快照的 `running` 位（DSH 自己的对话区/目标/
	//    工作区都用它）。原来读的是 `s.partial`——那是聊天快照里那层自称「兼容投影」的
	//    `legacy.partial`，会话快照里根本没有这个字段，于是这一路**恒为 false**（钩子接错了；
	//    宿主自己一处都没消费过 `partial`）。也就是说「AI 在干活时别误报」这条输入从来没生效过。
	//    两路深浅不同：`partial` 精确到「正在吐字」，`running` 只到「回合在跑」——本票的抑制目标
	//    是「AI 在干活时别误报」，取宿主自己的判法（粗位抑制得更多，也不会再指一条没人走的路）。
	const mainAiRunning = props.useSession((s) => s?.running === true);
	// ② 小助手在跑：折 DSH 会话摘要里的 `running` 位（与 DSH 自己的页头谱系计数**同口径、同来源
	//    ＝推送**）。前端本来就在订阅这份状态（下面那道页签门控用的就是它），换过来不需要新增
	//    管道。原来那条路径是「服务端自己列一遍子代理 → 插件自己的 HTTP 端点 → 前端每 2 秒轮询」，
	//    它**拉取失败时静默保留旧值**——一旦参与抑制就是永久消音器（真卡住也永远不报警）。
	const sessionSummaries = props.useSessions((s) => s.byId);
	const subagentRuns = useMemo(
		() =>
			indexSubagentDescendants(sessionSummaries).get(session) ?? {
				count: 0,
				runningCount: 0,
			},
		[sessionSummaries, session],
	);
	const [projects, setProjects] = useState([]);
	const [activeId, setActiveId] = useState(null);
	const [meta, setMeta] = useState(null);
	// ③ 账本新鲜度（`meta.updatedAt`＝账本最后一次写入的时刻）＋ 门槛：合成唯一那份判定。
	const stall = deriveStallJudgment({
		mainAiRunning,
		subagentRunningCount: subagentRuns.runningCount,
		lastWriteAt: meta?.updatedAt,
	});
	const [gate, setGate] = useState(null);
	const [snapshots, setSnapshots] = useState([]);
	const [events, setEvents] = useState([]);
	const [error, setError] = useState(null);
	const [busy, setBusy] = useState(false);
	const [loading, setLoading] = useState(true);
	const [showHistory, setShowHistory] = useState(false);
	const [suggestions, setSuggestions] = useState([]);
	const [suggestLoading, setSuggestLoading] = useState(false);
	const [deletingId, setDeletingId] = useState(null);
	const [mineruSet, setMineruSet] = useState(true);
	const [mineruToken, setMineruToken] = useState("");
	// F20：已设置时的「重新设置」展开态——点开输入框、保存成功后回到掩码态。
	const [mineruResetOpen, setMineruResetOpen] = useState(false);
	const [bookDir, setBookDir] = useState(null);
	// 知识地图原文（工作/knowledge-map.json）：机器产物，但人读形态是**卡片内联**折叠清单，
	// 故不进右栏预览（ADR-0010 决策 2）；原文随 /textbook/events 一起取回（见 workflow.js），
	// 不再走 /textbook/file——那条路由按「给人读的产物」收窄后拒绝机器产物（票 04）。
	const [knowledgeMapText, setKnowledgeMapText] = useState(null);
	const [workFiles, setWorkFiles] = useState([]);
	// 产物清单**加载好了没有**（票 08 复审修正）：`workFiles` 初值/切书时都是 `[]`，而
	// `loadAll` 里 `refreshWork` 是 `void`（不 await）——在它回来之前，"认得出候选但清单里没有"
	// 与"清单还没到"长得一模一样，于是每一行有产物的行都会闪一句「结果还没生成」＝**说假话**。
	// 灰字只许在**确实知道清单**之后出现（`workEntryForEvent` 的判据本身没错，缺的是"清单是否已知")。
	const [workFilesReady, setWorkFilesReady] = useState(false);
	const [pendingStageView, setPendingStageView] = useState(null);
	const [pendingGateView, setPendingGateView] = useState(null);
	const [pendingReviews, setPendingReviews] = useState([]);
	const [exploreSummary, setExploreSummary] = useState(null);
	const [chapterStatus, setChapterStatus] = useState([]);
	const [goldDrafts, setGoldDrafts] = useState([]);
	const [goldDraftVersion, setGoldDraftVersion] = useState(1);
	// 「之前的过程」里拍板提案行的展开态（值＝那一行的行键，见下面 `rowKey`；空＝全部收起）。
	// 写它的**只有**行内那颗「▸ 提案详情 / ▾ 收起」（纯展开、不发动作、不开右栏，票 07）；
	// 渲染那一半（`detailOpen`）在下面。
	// 票 07（`event-row-entries/spec.md` 决策 12）：值不许拿 `seq` 单独当键——真账本里 `seq`
	// **不唯一**（`restoreSnapshot` 把 `meta.eventCount` 写回 `events.length`、`deep-modify`
	// 写回 `kept.length`，同一个 `seq` 在新一轮里被复用：一本书里 9 条事件同为 `seq=54`），
	// 拿它当键会连带展开同号的行。行键的口径与理由写在 `rowKey` 那一行。
	const [gateOpen, setGateOpen] = useState(null);
	// 正在看哪一页阶段（null＝「现在」）。阶段片是导航面：点一格＝去那一步的页面，
	// 不是打开某份文件（2026-09-21 用户裁决，见 ui/phase-page.js 顶部）。
	const [viewPhase, setViewPhase] = useState(null);
	// 顶栏 🎨 风格线 / 📮 留言 展开面板开关（Task 17 常驻入口；点开、再点或 ✕ 收起）。
	const [showStylePanel, setShowStylePanel] = useState(false);
	const [showIntervenePanel, setShowIntervenePanel] = useState(false);
	// 🧩 自定义模式库（2026-08-21）：粘贴描述 → AI 分析成「模式卡」加入本书。
	const [patternOpen, setPatternOpen] = useState(false);
	const [patternBusy, setPatternBusy] = useState(false);
	const [patternResult, setPatternResult] = useState(null);
	const [patternList, setPatternList] = useState([]);
	// 对话台：下区高度（拖分界可调，默认 220）、是否收成一条。
	// 拖分界期间直改 DOM（见 startDeskDrag），不逐帧重渲整棵工作台组件树，保证跟手。
	const [deskHeight, setDeskHeight] = useState(220);
	const [deskCollapsed, setDeskCollapsed] = useState(true);
	const deskRef = useRef(null);
	// 拖拽中的实时对话台高度：直接改 DOM 的同时记进 ref，渲染高度读「ref ?? 状态」，
	// 这样拖拽期间被轮询/事件重渲时不会把高度打回旧状态（分界线不会弹回/反向）。
	const deskLiveRef = useRef(null);
	// F43（2026-08-20）：工作台根容器高度——槽位若不约束高度，页面整体滚动、地图栏会随右列
	// 内容拉伸（拖对话台分割线时广告被带着走、地图内容多时广告被挤出窗口）。实测父容器可用
	// 高度并钉到根容器；只在父容器真实可见且有合理尺寸时落地，否则保持 height:100% 基线
	// （页签未激活/隐藏时 rect 是 0/负值，跳过不动，绝不压塌界面）。
	const rootRef = useRef(null);
	const [rootH, setRootH] = useState(null);
	useEffect(() => {
		const el = rootRef.current;
		if (el === null || el.parentElement === null) return;
		// 输入元素的祖先盒子（自身 + 最多向上 4 层）：喂 pickComposerAnchorTop 的纯数据。
		// 只读几何/外观，不发动作、不改 DOM。
		const composerChain = (input) => {
			const chain = [];
			for (
				let node = input, i = 0;
				node !== null && i <= 4;
				node = node.parentElement, i += 1
			) {
				const box = node.getBoundingClientRect();
				const style = window.getComputedStyle(node);
				chain.push({
					top: box.top,
					width: box.width,
					height: box.height,
					borderRadius: style.borderRadius,
					backgroundColor: style.backgroundColor,
				});
			}
			return chain;
		};
		const measure = () => {
			const rect = el.getBoundingClientRect();
			const vh = typeof window !== "undefined" ? window.innerHeight || 0 : 0;
			// 实机证据（2026-08-21）：工作台根容器的父容器是 display:contents（无盒子，
			// getBoundingClientRect 全 0），量父容器拿不到高度。改用根容器自身的位置算可用高度；
			// 且不能把底部 DSH 作曲家输入框盖住——找到最靠底部的文本输入元素，工作台在它上方结束。
			let bottomBound = vh;
			try {
				if (typeof document !== "undefined") {
					let picked = null;
					let maxBottom = -1;
					const cands = document.querySelectorAll(
						'textarea, input, [role="textbox"], [contenteditable="true"]',
					);
					for (const d of cands) {
						const r = d.getBoundingClientRect();
						if (!(r.width > 0 && r.height > 0)) continue;
						// 只认「接近视口底部」的输入（DSH 作曲家）；工作台内部表单/顶部搜索框不算。
						if (
							r.top > rect.top &&
							r.bottom > vh - 160 &&
							r.bottom > maxBottom
						) {
							maxBottom = r.bottom;
							picked = d;
						}
					}
					// 锚点＝**输入区容器**的 top，不是输入元素自身的 top（2026-09-24 真机，
					// 票 ad-strip-occlusion/01）：宿主的作曲家是一张卡，输入元素上方还有卡自己的
					// padding-top、提示语、排队消息行。量元素自身会让工作台底边落进卡里——实测吃掉
					// 广告横条下沿 8px（≈21%），并把**宿主页签容器**（根容器往上第 4 层那个
					// overflow-y:auto 的 div）撑出一条 8px 的外层滚动条（票 workbench-scroll/01，
					// 同一个 8px、同一次改动）。判据与理由在 src/ui/rules.js 的
					// pickComposerAnchorTop（纯函数，test-layout-anchors.mjs 直穿它断言）；
					// 找不到容器时退回现行为，不硬猜、不压塌界面。
					if (picked !== null) {
						bottomBound =
							pickComposerAnchorTop(composerChain(picked)) ??
							picked.getBoundingClientRect().top;
					}
				}
			} catch {
				/* 找不到作曲家就退回视口高度 */
			}
			const usable = Math.max(0, bottomBound - Math.max(0, rect.top));
			if (usable > 200) {
				const next = Math.round(usable);
				setRootH((prev) => (prev === next ? prev : next));
			}
		};
		measure();
		// 页签可能后激活：短周期重测，直到拿到合理值并持续跟随（值不变不触发重渲）。
		const timer = setInterval(measure, 400);
		return () => clearInterval(timer);
	}, []);
	// 深改用的分段清单（含影响预告/撤销窗口）+ 当前浏览的分段 key（步清单点一步由 onPickStep 接线）。
	const [processSegs, setProcessSegs] = useState([]);
	const [browsing, setBrowsing] = useState(null);
	// 不打断提示条（F17）：铺章中提交风格线/留言/意见成功后，焦点区顶部滑入、6 秒自清。
	const [noteToast, setNoteToast] = useState(false);
	// 自动跟随（F5/Task 20 方案 A）：等拍板强制回「现在」的横幅 + 浏览历史时 AI 有新进展的「跳过去」横幅。
	const [awaitBanner, setAwaitBanner] = useState(false);
	const [progressBanner, setProgressBanner] = useState(false);
	const progressSeqRef = useRef(-1); // 上次见过的 progress 事件 seq（浏览时新 seq 才触发「跳过去」横幅）
	const activeRef = useRef(null);
	const lastSeqRef = useRef(-1);
	const eventsRef = useRef([]);
	const awaitingSeenRef = useRef(false); // F33：只记录「等拍板状态新到达」那一帧，用于自动跟随只拉回一次
	const sessionRef = useRef(session);
	sessionRef.current = session;

	// 拖分界（2026-08-21 修「不跟手」）：旧实现每帧 mousemove 都 setDeskHeight，
	// 触发整棵工作台重渲（对话台要重扫整段对话），渲染跟不上鼠标就发飘。
	// 现在拖拽期间直接改容器 DOM 高度（不重渲），松手才把最终高度交回 React 状态。
	const startDeskDrag = (e) => {
		e.preventDefault();
		const startY = e.clientY;
		const startH = deskLiveRef.current ?? deskHeight;
		const clamp = (v) => Math.max(120, Math.min(window.innerHeight / 2, v));
		const onMove = (ev) => {
			// 对话台贴底部：高度增大其上边缘（分界线）上移。要让分界线跟手（上拖→线上移），
			// 增量必须取反——往上拖（clientY 减小）→ 高度增大。
			const next = clamp(startH - (ev.clientY - startY));
			deskLiveRef.current = next;
			if (deskRef.current !== null) deskRef.current.style.height = `${next}px`;
		};
		const onUp = () => {
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
			const h = deskLiveRef.current ?? deskHeight;
			deskLiveRef.current = null;
			if (Number.isFinite(h) && h > 0) setDeskHeight(h);
		};
		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", onUp);
	};

	const sess = () => `session=${encodeURIComponent(sessionRef.current)}`;

	async function fetchJson(url, options) {
		const res = await fetch(
			url,
			options ?? { headers: { Accept: "application/json" } },
		);
		let json = null;
		try {
			json = await res.json();
		} catch {
			json = null;
		}
		if (!res.ok)
			throw new Error((json !== null && json.error) || `HTTP ${res.status}`);
		return json;
	}

	async function loadProjects() {
		const json = await fetchJson(`/textbook/projects?${sess()}`);
		setProjects(json.projects ?? []);
		if (activeRef.current === null && (json.projects ?? []).length > 0) {
			activeRef.current = json.projects[0].id;
			setActiveId(activeRef.current);
		}
	}
	async function loadAll(projectId) {
		const json = await fetchJson(
			`/textbook/events?${sess()}&project=${encodeURIComponent(projectId)}`,
		);
		eventsRef.current = json.events ?? [];
		lastSeqRef.current =
			json.events && json.events.length > 0
				? json.events[json.events.length - 1].seq
				: -1;
		setEvents(eventsRef.current);
		setMeta(json.meta ?? null);
		setGate(json.gate ?? null);
		setSnapshots(json.snapshots ?? []);
		setBookDir(json.dir ?? null);
		setPendingStageView(json.pendingStage ?? null);
		setPendingGateView(json.pendingGate ?? null);
		setPendingReviews(
			Array.isArray(json.pendingReviews) ? json.pendingReviews : [],
		);
		setExploreSummary(json.exploreSummary ?? null);
		setChapterStatus(
			Array.isArray(json.chapterStatus) ? json.chapterStatus : [],
		);
		setGoldDrafts(Array.isArray(json.goldDrafts) ? json.goldDrafts : []);
		setGoldDraftVersion(
			Number.isSafeInteger(json.goldDraftVersion) ? json.goldDraftVersion : 1,
		);
		setKnowledgeMapText(
			typeof json.knowledgeMap === "string" ? json.knowledgeMap : null,
		);
		void refreshWork(projectId);
		void refreshProcess(projectId);
	}

	// 已完成步骤的结果文件列表（源探查/章节/成书等，点开可看）。
	async function refreshWork(projectId) {
		try {
			const json = await fetchJson(
				`/textbook/work?${sess()}&project=${encodeURIComponent(projectId)}`,
			);
			setWorkFiles(json.files ?? []);
			// 只有**成功拿到**清单才算"已知"；拉取失败时保持未知 → 不冒灰字（宁可不说，也不说错的）。
			setWorkFilesReady(true);
		} catch {
			/* 结果列表失败不影响主界面 */
		}
	}

	// 分段清单（`/textbook/process`）：历史分段 + 影响预告 + 撤销窗口，与事件同节奏刷新。
	// ⚠️ 票 stale-detection/01：这条响应**不再**带子代理计数（那小助手状态改读宿主推送的会话
	// 摘要了，见组件里那段注释）；端点本身留着，它还返回这份分段清单。
	async function refreshProcess(projectId) {
		try {
			const json = await fetchJson(
				`/textbook/process?${sess()}&project=${encodeURIComponent(projectId)}`,
			);
			setProcessSegs(json.segments ?? []);
		} catch {
			/* 分段清单拉取失败不影响主界面 */
		}
	}

	// ── 「打开一份文件看看」的唯一收口（ADR-0010 决策 1/4）──────────────────────
	// 全部入口（分段清单、阶段片、历史事件行、材料转换内容、探查报告、章节卡
	// 「看看这章」、交付/终检的成品）都走这一个函数；按钮位置与文案一律不动。
	//
	// 两条路按产物判据分岔（domain-rules.productOpenMode，与后端路由同一份清单）：
	//  - 'preview'（有正文的产物）→ DSH 右栏预览：地址用**工作区相对路径**拼，只读、
	//    不进模型上下文（用户在这里读到的东西永不进入模型请求）。
	//  - 'inline'（knowledge-map.json）→ 不在这里开：它的人读形态由阶段页 / 确认卡**就地**
	//    折叠展示（`KnowledgeMapBlock` / `ExploreConfirmCard`），工作台不再有第二个查看壳。
	//  - 'machine'（机器产物/源 PDF）→ 不给人读，什么都不开。
	const openInSidebar = (rel) => {
		setError(null);
		try {
			props.openFileInSidebar(bookFileAddress(session, cwd, bookDir, rel));
		} catch (err) {
			// 预览服务解不到时插件根本不会加载（硬依赖）；这里兜的是地址/导航被拒
			// （例如打开了目录地址）——把原因摆到界面上，不留「点了没反应」。
			// 票 10（判定三 #2）：报错里原来印 `${rel}`（`work/…` 机器路径）；名字走 `artifactName`
			// （CONTEXT.md「产物名」：相对路径原文连提示一起不上屏）。
			setError(
				`打开「${artifactName(rel)}」失败：${String(err instanceof Error ? err.message : err)}`,
			);
		}
	};

	const viewWork = (file) => {
		if (workEntryAction(file?.path) === "sidebar") openInSidebar(file.path);
	};

	async function poll() {
		const projectId = activeRef.current;
		if (projectId === null) {
			// 向导态：AI 可能刚在对话里建了书，主动发现新项目并切过去（双向同步）。
			try {
				const json = await fetchJson(`/textbook/projects?${sess()}`);
				const list = json.projects ?? [];
				setProjects(list);
				if (list.length > 0 && activeRef.current === null) {
					activeRef.current = list[0].id;
					setActiveId(list[0].id);
					await loadAll(list[0].id);
				}
			} catch {
				/* 网络抖动忽略 */
			}
			return;
		}
		try {
			const json = await fetchJson(
				`/textbook/events?${sess()}&project=${encodeURIComponent(projectId)}&after=${lastSeqRef.current}`,
			);
			if ((json.events ?? []).length > 0) {
				const next = eventsRef.current.concat(json.events);
				eventsRef.current = next;
				lastSeqRef.current = json.events[json.events.length - 1].seq;
				setEvents(next);
			}
			setMeta(json.meta ?? null);
			setGate(json.gate ?? null);
			setSnapshots(json.snapshots ?? []);
			setBookDir(json.dir ?? null);
			setPendingStageView(json.pendingStage ?? null);
			setPendingGateView(json.pendingGate ?? null);
			setPendingReviews(
				Array.isArray(json.pendingReviews) ? json.pendingReviews : [],
			);
			setExploreSummary(json.exploreSummary ?? null);
			setChapterStatus(
				Array.isArray(json.chapterStatus) ? json.chapterStatus : [],
			);
			setGoldDrafts(Array.isArray(json.goldDrafts) ? json.goldDrafts : []);
			setGoldDraftVersion(
				Number.isSafeInteger(json.goldDraftVersion) ? json.goldDraftVersion : 1,
			);
			setKnowledgeMapText(
				typeof json.knowledgeMap === "string" ? json.knowledgeMap : null,
			);
			void refreshWork(projectId);
			void refreshProcess(projectId);
		} catch (err) {
			// 项目可能被 AI 删除/移走了：回到向导态并重新拉列表。
			const message = String(err instanceof Error ? err.message : err);
			if (message.includes("不存在") || message.includes("不属于")) {
				activeRef.current = null;
				setActiveId(null);
				setMeta(null);
				setGate(null);
				setSnapshots([]);
				setBookDir(null);
				setEvents([]);
				setPendingStageView(null);
				setPendingGateView(null);
				setPendingReviews([]);
				setExploreSummary(null);
				setChapterStatus([]);
				setKnowledgeMapText(null);
				setProcessSegs([]);
				setBrowsing(null);
				setAwaitBanner(false);
				setProgressBanner(false);
				progressSeqRef.current = -1;
				eventsRef.current = [];
				lastSeqRef.current = -1;
				void loadProjects().catch(() => {});
			}
		}
	}

	// ⚠️ 依赖是 [session]，不是 []（2026-09-20 修）：宿主在同一个页面里切会话时会复用
	// WorkbenchView 实例，空依赖数组意味着这套取数**永不重跑**——activeRef 还攥着上一个
	// 会话的 project id，轮询也一直挂在旧会话上，实测表现为「先点过别的会话，再打开工作台
	// 就永久停在『加载中…』」（events/work/process 全 200，就是不渲染）。
	useEffect(() => {
		let alive = true;
		// 切会话 = 整套状态归零，别把上一个会话的书带到这个会话里。
		activeRef.current = null;
		lastSeqRef.current = -1;
		eventsRef.current = [];
		progressSeqRef.current = -1;
		awaitingSeenRef.current = false;
		setProjects([]);
		setActiveId(null);
		setMeta(null);
		setGate(null);
		setSnapshots([]);
		setEvents([]);
		setWorkFiles([]);
		setWorkFilesReady(false);
		setProcessSegs([]);
		setPendingStageView(null);
		setPendingGateView(null);
		setPendingReviews([]);
		setExploreSummary(null);
		setChapterStatus([]);
		setGoldDrafts([]);
		setError(null);
		// 浏览态（processSegs 的分类回看）是「上一个会话的书」的一部分——不归零就会在切会话后
		// 继续渲染上一本的浏览段（processSegs 已清空，连段都对不上）。
		setBrowsing(null);
		setLoading(true);
		(async () => {
			try {
				await loadProjects();
				if (activeRef.current !== null) await loadAll(activeRef.current);
			} catch (err) {
				if (alive) setError(String(err instanceof Error ? err.message : err));
			} finally {
				// ⚠️ 加载标记必须紧跟主线（projects + events）放下，**不能被旁支拖住**：
				// 原式把 /textbook/settings 也串在 try 里，那条请求一旦不返回，
				// finally 永不执行 → 永久「加载中…」。
				if (alive) setLoading(false);
			}
			try {
				const settings = await fetchJson("/textbook/settings");
				if (alive) setMineruSet(settings.settings?.mineruTokenSet === true);
			} catch {
				/* 读不到设置不影响工作台（Token 卡显示未设置态） */
			}
		})();
		return () => {
			alive = false;
		};
	}, [session]);

	useEffect(() => {
		const timer = setInterval(() => {
			void poll();
		}, 2000);
		return () => clearInterval(timer);
	}, [session]);

	// 不打断提示条 6 秒自清（提交成功后亮起，到时自动收起；组件卸载/重渲前清掉旧定时器）。
	useEffect(() => {
		if (!noteToast) return undefined;
		const timer = setTimeout(() => setNoteToast(false), 6000);
		return () => clearTimeout(timer);
	}, [noteToast]);

	// 自动跟随（方案 A）：AI 开始等人类拍板时，若正在翻历史，强制切回「现在」并顶部亮
	// 「已切回现在」横幅（不打扰、不弹窗）。等拍板分两种：meta.status 变成 awaiting-*；
	// 或设计关卡等你拍板——此时 meta.status 仍是 running（proposeGate 不切状态），
	// 由 gate.status==='awaiting' 兜住（Task 24 回归发现：关卡拍板是主决策面，之前漏拉回）。
	// F33 修复（2026-08-20 走查）：只在该状态「新到达」那一刻拉回一次；之后用户已处于等拍板
	// 态、再主动点地图历史段 = 有意浏览/定点修改，不再强制打断——否则 awaiting-* 下永远进不了
	// 历史浏览，定点修改入口被堵死（与「随时能改」承诺冲突，实书走查实测）。
	useEffect(() => {
		const st = meta?.status;
		const awaiting =
			(typeof st === "string" && st.startsWith("awaiting-")) ||
			(gate !== null && gate.status === "awaiting");
		if (
			shouldForceBackToNow(awaitingSeenRef.current, awaiting, browsing !== null)
		) {
			setBrowsing(null);
			setAwaitBanner(true);
		}
		awaitingSeenRef.current = awaiting;
	}, [meta?.status, browsing, gate]);

	// 自动跟随（方案 A）：浏览历史时 AI 出了「新」progress 事件 → 顶部滑入「AI 正在干活--点此跳过去」。
	// 新 = seq 大于开始浏览那一刻记住的进度序号（progressSeqRef），避免一进历史就把旧进展翻出来。
	useEffect(() => {
		if (browsing === null) return undefined;
		const lastProgress = [...events]
			.reverse()
			.find((e) => e.type === "textbook/progress");
		if (
			lastProgress !== undefined &&
			lastProgress.seq > progressSeqRef.current
		) {
			progressSeqRef.current = lastProgress.seq;
			setProgressBanner(true);
		}
		return undefined;
	}, [events, browsing]);

	// 等拍板横幅 6 秒自清（到时自动收起；组件卸载/重渲前清掉旧定时器）。
	useEffect(() => {
		if (!awaitBanner) return undefined;
		const timer = setTimeout(() => setAwaitBanner(false), 6000);
		return () => clearTimeout(timer);
	}, [awaitBanner]);

	// 无书进向导时：请求 AI 建议（人类只做确认）。
	useEffect(() => {
		if (meta !== null || loading) return;
		let alive = true;
		setSuggestLoading(true);
		fetchJson("/textbook/action", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				action: "wizard-suggest",
				session: sessionRef.current,
			}),
		})
			.then((json) => {
				if (alive) setSuggestions(json.suggestions ?? []);
			})
			.catch(() => {
				if (alive) setSuggestions([]);
			})
			.finally(() => {
				if (alive) setSuggestLoading(false);
			});
		return () => {
			alive = false;
		};
	}, [meta, loading]);

	// 「✨ AI 建议」与「换一批」：带学习者的背景重新请求建议。
	const requestSuggest = async (hintText) => {
		setSuggestLoading(true);
		try {
			const json = await fetchJson("/textbook/action", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({
					action: "wizard-suggest",
					session: sessionRef.current,
					hint: hintText || undefined,
				}),
			});
			setSuggestions(json.suggestions ?? []);
		} catch (err) {
			throw new Error(err instanceof Error ? err.message : String(err));
		} finally {
			setSuggestLoading(false);
		}
	};

	const postAction = async (body) => {
		setBusy(true);
		try {
			const json = await fetchJson("/textbook/action", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({
					project: activeRef.current,
					session: sessionRef.current,
					...body,
				}),
			});
			// 无活动项目（如 book-create 之前）时不需要刷新事件。
			if (activeRef.current !== null) await loadAll(activeRef.current);
			setError(null);
			// 不打断提示条：铺章（phase 5）且机器在跑（running）时，风格线/留言/意见提交成功 → 顶部提示。
			// 注：目前前端只经 review（章节卡写意见）走到这里；style-note/intervene 尚无前端入口，见 Task 19 报告。
			if (
				json !== null &&
				["style-note", "intervene", "review"].includes(body.action) &&
				meta?.status === "running" &&
				meta?.phase === 5
			) {
				setNoteToast(true);
			}
			return json;
		} catch (err) {
			setError(String(err instanceof Error ? err.message : err));
			return null;
		} finally {
			setBusy(false);
		}
	};

	const deleteBook = (id) => {
		setBusy(true);
		fetchJson("/textbook/action", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				action: "book-delete",
				project: id,
				session: sessionRef.current,
				confirm: true,
			}),
		})
			.then(() => {
				setDeletingId(null);
				if (activeRef.current === id) {
					activeRef.current = null;
					setActiveId(null);
					setMeta(null);
					setGate(null);
					setEvents([]);
				}
				return fetchJson(`/textbook/projects?${sess()}`);
			})
			.then((json) => setProjects(json.projects ?? []))
			.catch((err) =>
				setError(String(err instanceof Error ? err.message : err)),
			)
			.finally(() => setBusy(false));
	};

	const decide = (decision) => {
		if (gate === null) return;
		void postAction({
			action: "gate-decide",
			gate: gate.gate,
			version: gate.version,
			approved: decision.approved,
			mode: decision.mode ?? null,
			reasons: decision.reasons ?? [],
			note: decision.note ?? "",
		});
	};

	const rollback = () => {
		if (snapshots.length === 0) {
			setError("还没有可回退的快照");
			return;
		}
		void postAction({ action: "rollback", snapshot: snapshots[0].seq });
	};

	const confirmExplore = (approved, feedback) => {
		void postAction({
			action: "explore-confirm",
			approved,
			reasons: feedback?.reasons ?? [],
			note: feedback?.note ?? "",
		});
	};

	const confirmOutline = (approved, note, goldChapter) => {
		void postAction({
			action: "outline-confirm",
			approved,
			note: note ?? "",
			...(goldChapter != null && Number.isSafeInteger(Number(goldChapter))
				? { goldChapter: Number(goldChapter) }
				: {}),
		});
	};

	const submitReview = async (chapter, comment) => {
		const json = await postAction({ action: "review", chapter, comment });
		return json;
	};

	const createBook = (form) => {
		void postAction({ action: "book-create", ...form }).then((json) => {
			if (json !== null && json.project !== undefined) {
				// 创建成功：立即切换到新书（修复"建完没反应、以为失败又点一次"的问题）。
				activeRef.current = json.project;
				setActiveId(json.project);
				void loadAll(json.project).catch((err) =>
					setError(String(err instanceof Error ? err.message : err)),
				);
				void fetchJson(`/textbook/projects?${sess()}`)
					.then((list) => setProjects(list.projects ?? []))
					.catch(() => {});
			}
		});
	};

	const uploadSource = async (file, role) => {
		// 超限直接拒（服务端会回 413；先在这里拦，避免白传一份注定失败的大文件）。
		if (file.size > MAX_UPLOAD_BYTES) {
			const err = new Error(uploadTooLargeMessage());
			err.retryable = false;
			throw err;
		}
		const bytes = await file.arrayBuffer();
		const url = `/textbook/upload?${sess()}&project=${encodeURIComponent(activeRef.current)}&name=${encodeURIComponent(file.name)}&role=${encodeURIComponent(role)}`;
		const res = await fetch(url, { method: "POST", body: bytes });
		let json = null;
		try {
			json = await res.json();
		} catch {
			json = null;
		}
		if (!res.ok)
			throw new Error((json !== null && json.error) || `HTTP ${res.status}`);
		try {
			await loadAll(activeRef.current);
		} catch {
			// 服务端已落盘，刷新失败（如瞬时 Failed to fetch）不当作上传失败，
			// 否则 pending 不清空、用户重传整批 → 后端幂等前会产生重复条目。
		}
	};

	// AI 识别每本 PDF 的角色（一次请求识别全部）。
	const identifyRoles = async (files) => {
		const json = await fetchJson("/textbook/action", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				action: "suggest-roles",
				session: sessionRef.current,
				files,
			}),
		});
		return json.roles ?? [];
	};

	const convert = () => {
		void postAction({ action: "convert-start" });
	};
	const resume = () => {
		void postAction({ action: "resume" });
	};
	// 强制中断（Task 17 顶栏 ⏸）：记账 → 取消主 AI，绝不 followup（后端契约）。
	// 工作台**不碰小助手**（票 dsh-contract-drift/01）：「已暂停」说的是主 AI，不是整条流水线。
	const pause = () => {
		void postAction({ action: "pause" });
	};

	const saveMineruToken = () => {
		if (mineruToken.trim() === "") return;
		void postAction({
			action: "settings",
			mineruToken: mineruToken.trim(),
		}).then(() => {
			setMineruSet(true);
			setMineruResetOpen(false); // F20：保存成功后回到掩码态
			setMineruToken("");
		});
	};

	// 成品预览（交付卡/终检认可卡）：整本走右栏，不再把全文灌进卡片 <pre>
	// （票 03）。卡片的下载动作是另一条路（字节下载），不受影响。
	const previewBook = () => {
		openInSidebar("work/book.md");
	};

	const lastEvent = events.length > 0 ? events[events.length - 1] : null;
	const qualityEvent = [...events]
		.reverse()
		.find((event) => event.type === "textbook/quality");
	const checks = qualityEvent?.data?.checks ?? [];
	const aiReportEvent = [...events]
		.reverse()
		.find((event) => event.type === "textbook/ai-report");
	const aiReport = aiReportEvent?.data?.report ?? null;
	// 进度详情只认「当前这一步」内的 progress（以最近一条 stage-start 为界）：
	// 源探查结束进设计关卡后，探查期的通读进度不再残留到「AI 干活中」状态条。
	const progressDetail = stageScopedProgressDetail(events);
	const pendingStageLabel =
		pendingStageView === "gate"
			? gateHuman(pendingGateView ?? "?")
			: stageHuman(pendingStageView);
	const humanTurn =
		meta !== null &&
		(meta.status === "awaiting-explore" ||
			meta.status === "awaiting-outline" ||
			meta.status === "awaiting-gold" ||
			meta.status === "awaiting-chapters-review" ||
			meta.status === "awaiting-final-approval" ||
			(gate !== null && gate.status === "awaiting") ||
			(meta.phase === 1 && gate === null));
	const needsConfigText =
		lastEvent?.type === "textbook/error"
			? `${lastEvent.data?.task ?? ""}失败：${lastEvent.data?.message ?? ""}`
			: '请先配置大模型接口（右上角设置 → 模型），配好后点"继续"。';
	// 阶段片那排要的「这一步有几份文件」：按阶段把分段的可打开产物数加起来。
	// ⚠️ 判据与阶段页**同一份**（view-rules.openableArtifacts → workEntryAction）：机器产物与
	// 走卡片内联的知识地图都不算——否则阶段片上会显示点了没反应/会把 JSON 塞进右栏的入口。
	// ⚠️ 阶段号走 phaseOfSegment（服务端给了就用，缺了按 kind 查表兜底）：老宿主不发 `phase`，
	// 若在这里直接读 seg.phase，整排格子都会说"还没有文件"。
	const openableCountByPhase = (() => {
		const counts = {};
		for (const seg of processSegs ?? []) {
			const phase = phaseOfSegment(seg);
			if (phase === null) continue;
			counts[phase] =
				(counts[phase] ?? 0) + openableArtifacts(seg, workFiles).length;
		}
		return counts;
	})();

	const showWizardForm = meta === null && !loading;

	// 顶栏介入工具条：风格线/留言清单（旧账本 ?? [] 兜底）与面板开关/暂停入口。
	const styleNotes = (meta?.styleNotes ?? []).filter(
		(n) => n.status === "active",
	);
	const pendingIvs = (meta?.pendingInterventions ?? []).filter(
		(i) => i.status === "pending",
	);
	const openStylePanel = () => setShowStylePanel((v) => !v);
	const openIntervene = () => setShowIntervenePanel((v) => !v);
	// 🧩 自定义模式库：拉取本书已有模式卡清单 / 分析粘贴文本并加入模式库。
	const loadPatterns = () => {
		if (activeRef.current === null) return;
		void fetchJson("/textbook/action", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				action: "pattern-list",
				project: activeRef.current,
				session: sessionRef.current,
			}),
		})
			.then((json) => {
				if (json?.ok === true) setPatternList(json.patterns ?? []);
			})
			.catch(() => {});
	};
	const analyzePattern = async (text) => {
		setPatternBusy(true);
		setPatternResult(null);
		try {
			const json = await postAction({ action: "pattern-analyze", text });
			if (json !== null && json.ok === true) setPatternResult(json.card);
			loadPatterns();
		} finally {
			setPatternBusy(false);
		}
	};

	// 门控（防御纵深，2026-09-20 放宽）：动态注册已确保页签只在「造书模式」或「盘上真有书」
	// 的会话出现。这里原来只认 sessionPreset === "textbook"，与注册侧口径不一致——于是老会话
	// （会话记录里没有 agentPreset 投影值、但盘上真有书）会出现「页签在、点进去一片空白」
	// （实测：测试1514《工业大数据分析》）。放宽为：预设名对得上就直接渲染；对不上但书已经
	// 取回来了也渲染。空窗期给一句话，不留空白——空白比「加载中」更让人发毛。
	if (sessionPreset !== "textbook") {
		if (meta === null) {
			return loading
				? createElement(
						"p",
						{ style: { ...S.hint, padding: "16px" } },
						"正在打开这本书…",
					)
				: null;
		}
	}

	// 顶栏介入工具条（布局 A：地图栏与焦点区之上；只在有活动书时出现——无书时是向导/加载态）。
	const topBar =
		meta !== null && !loading
			? createElement(TopBar, {
					meta,
					openStylePanel,
					openIntervene,
					pause,
					resume,
				})
			: null;

	// 非项目态（向导/加载/无书）：单滚动内容。
	const simpleContent = createElement(
		"div",
		{ style: S.container },
		createElement("p", { style: S.title }, "造书工作台"),
		createElement(
			"p",
			{ style: S.hint },
			// 第一屏判读（2026-09-20）：原文是「本会话独立使用，一个会话只造一本书。主 AI 统筹
			// 推进流水线（亲自做或派小助手分头干），轮到你要拍板/确认时亮起 ⚡；每个拍板点都
			// 自动存档，随时能改。」——陌生人打开第一屏先读到的是系统实现（主 AI/流水线/派小助手
			// 分头干），不是"要我干什么"。压成两句话。
			// 票 14（承诺账 B「随时前置」）：定过的决定都存着，但**改**有两条硬前置——
			// 运行中或有待办时后端一律 409（「我正在做；要改历史请先等交工（或先 ⏸ 暂停）」），
			// 演示书也不支持定点修改。文案把出路直接说给用户。
			"一个会话造一本书。轮到你来定的时候，界面会亮 ⚡ 提醒你；定过的都存着，等 AI 停手（或你先点 ⏸ 暂停）就能改。",
		),
		createElement(MineruTokenCard, {
			mineruSet,
			mineruToken,
			busy,
			onTokenChange: (e) => setMineruToken(e.target.value),
			onSave: saveMineruToken,
			resetOpen: mineruResetOpen,
			onToggleReset: () => setMineruResetOpen((v) => !v),
		}),
		error !== null
			? createElement("p", { style: S.error }, `⚠️ ${error}`)
			: null,
		loading
			? createElement("p", { style: S.hint }, "加载中…")
			: showWizardForm
				? createElement(WizardCard, {
						onCreate: createBook,
						onCreateDemo: () => {
							void postAction({ action: "demo-run" }).then((json) => {
								if (json?.project) {
									activeRef.current = json.project;
									setActiveId(json.project);
									void loadAll(json.project);
								}
							});
						},
						busy,
						suggestions,
						suggestLoading,
						onSuggest: (hintText) => requestSuggest(hintText),
					})
				: null,
	);
	// 左栏那套属性的收窄版（2026-09-21 用户裁决「左栏不再要了」）：本来整栏只喂 ProcessMapRail，
	// 现在只剩「点一步 -> 进那一步的回看卡」这一个动作，被全览条的清单复用。
	// 2026-09-24 票 04：全览条清单一行一步，交出来的 key 是**步 key**（`chapter-1:write` 这种）；
	// 有段的那一步走这里，没有段的那一步（材料准备＝第一步）走 `onPickPhase`（见 `StepList`）。
	const onPickStep = (key) => {
		setBrowsing(key); // 点任意一步 -> 焦点区那一步的回看卡
		// 2026-09-21 用户裁决「导航不带副作用」：切步**只换屏**，
		// 不再顺手打开该步第一个产物（那是 F47 的旧行为，正是用户抱怨的
		// 「点一下就跳预览」）。产物一律由卡片里写着「打开」的按钮开。
		// 阶段页与某一步的回看卡互斥：切步就离开阶段页。
		setViewPhase(null);
		// 开始浏览时记住当前进度序号：这之后 AI 再出的 progress 才算「新进展」（方案 A）。
		const lastProgress = [...eventsRef.current]
			.reverse()
			.find((e) => e.type === "textbook/progress");
		progressSeqRef.current = lastProgress?.seq ?? -1;
		setProgressBanner(false);
	};
	// 点全览条里**没有段**的那一行（材料准备＝第一步、旧 payload 补出来的章步）：落到那一阶段的
	// 清单页，**不是**浏览态（票 04 明写「材料准备」那一行走 `onPickPhase`）。
	const onPickPhase = (n) => {
		setViewPhase(n);
		setBrowsing(null);
	};
	// 点某一步时要展示哪一阶段：这一步自己带的阶段号（`stepsOf` 已算好：服务端 `phase` 优先、
	// 缺了按 kind 查表兜底，见 view-rules.phaseOfSegment——客户端兜底不变量 1）。
	// `browsing` 是**步 key**（票 04）；旧写法（段 key）也认，都认不出才退回 meta.phase。
	const browsingStep =
		browsing === null
			? null
			: (stepsOf({ segments: processSegs, meta }).find((step) => step.key === browsing) ?? null);
	const viewPhaseOfBrowsing =
		browsingStep?.phase ??
		phaseOfSegment((processSegs ?? []).find((seg) => seg.key === browsing) ?? null) ??
		(meta?.phase ?? 1);
	// 点阶段片一格：点**非当前**格＝去那一阶段的页面（阶段页态）；点**当前**那一格＝**回到现在**
	// （清浏览态与阶段页态）。2026-09-22 票 12 裁决：这就是「回到现在」的唯一入口，回看态下同样成立
	// ——它**只换屏**，不动账本、不发动作、不改结果（spec 不变量 13）。所以这里一行都不用改：
	// 浏览态（`browsing` 非空）下点当前那格照样 `setViewPhase(null)` + `setBrowsing(null)`。
	const phaseBarSelect = (n) => {
		setViewPhase(n === (meta.phase ?? 1) ? null : n);
		setBrowsing(null);
	};
	// 有书时的主体：焦点区（独立滚动）+ 下对话台（固定底部）。
	// 2026-09-21 用户裁决「左栏不再要了」：那份步清单搬进焦点区顶部的全览条
	// （见 ProgressOverview），左栏整栏连同 ProcessMapRail 一起不再渲染。
	// 写成函数延迟构造：meta 为 null（向导/加载态）时不该碰 meta 字段，避免空指针。
	const projectView = () =>
		createElement(
			"div",
			{ style: { display: "flex", flex: 1, minHeight: 0, overflow: "hidden" } },
			createElement(
				"div",
				{
					style: {
						flex: 1,
						minWidth: 0,
						display: "flex",
						flexDirection: "column",
						minHeight: 0,
					},
				},
				// ── 焦点区 ──────────────────────────────────────────────────────
				createElement(
					"div",
					{
						style: {
							position: "relative",
							flex: 1,
							minHeight: 0,
							overflowY: "auto",
							// 谁该滚（票 workbench-scroll/01）：**工作台内部滚、宿主页签容器不滚**。
							// 焦点区是工作台唯一的滚动面；到底之后不再把余量交给外层——没有这条时，
							// 滚动链会把「内层滚到底」变成「整个工作台平移」（外层那条挂在宿主页签容器
							// 上，见 measure() 的注释）。断言见 test-layout-anchors.mjs。
							overscrollBehavior: "contain",
							padding: "12px 16px",
						},
					},
					// 全览条：全书几步、还剩几步、现在在第几阶段 + 展开清单（收起时不渲染清单内容）。
					// 只在「现在」那一屏出现——回看某一步时，用户手里已经有那一步了，
					// 再顶一条全览是把"手里的东西"往下挤（展开体会往下顶，别顶两份）。
					// 2026-09-24 票 04：抬头按**步**数，所以要把 `meta` 一并给它（步的口径在
					// `view-rules.stepsOf` / `stepCount`，界面不自己数）。
					browsing === null && viewPhase === null
						? createElement(ProgressOverview, {
								segments: processSegs,
								meta,
								browsingKey: browsing,
								viewedPhase: viewPhase,
								currentPhase: meta.phase ?? 1,
								onPickStep,
								onPickPhase,
							})
						: null,
					// 自动跟随横幅（F5 方案 A）：等拍板强制回「现在」（6 秒自清）；浏览历史时 AI 有新进展（点击清浏览回现在）。
					awaitBanner
						? createElement(AutoFollowAwaitNote, {
								onClose: () => setAwaitBanner(false),
							})
						: null,
					progressBanner && browsing !== null
						? createElement(AutoFollowProgressNote, {
								onJump: () => {
									setBrowsing(null);
									setProgressBanner(false);
								},
								onDismiss: () => setProgressBanner(false),
							})
						: null,
					// 不打断提示条（F17）：铺章中提交风格线/留言/意见成功后，焦点区顶部滑入、6 秒自清。
					noteToast
						? createElement(InterruptNote, {
								onClose: () => setNoteToast(false),
							})
						: null,
					// 业务头（原 workbenchContent 头部迁入焦点区顶）：书名/取消书、MinerU、错误。
					createElement(
						"div",
						{
							style: {
								display: "flex",
								gap: "10px",
								alignItems: "center",
								marginBottom: "10px",
							},
						},
						createElement(
							"strong",
							{ style: { fontSize: "15px" } },
							`📖 ${meta.name ?? activeId}`,
						),
						// 「取消这本书」不在主视野里（2026-09-20 用户拍板：破坏性操作别抢眼）；
						// 2026-09-21 左栏删掉后它搬到焦点区底部的常驻小条（FocusFooter）。
						createElement(
							"button",
							{
								style: S.smallLink,
								onClick: () => {
									setPatternOpen(true);
									loadPatterns();
								},
								title:
									"粘贴一段你想要的教法/结构描述，AI 会把它加进这本书的模式库",
							},
							"🧩 自定义模式",
						),
					),
					// MinerU Token 卡只在该配置「还没完成」时留在有书面板（「还差一步」引导）；
					// 已设置后只在无书向导（定书名）页出现，不再占面板空间（2026-08-21 需求）。
					mineruSet === false
						? createElement(MineruTokenCard, {
								mineruSet,
								mineruToken,
								busy,
								onTokenChange: (e) => setMineruToken(e.target.value),
								onSave: saveMineruToken,
								resetOpen: mineruResetOpen,
								onToggleReset: () => setMineruResetOpen((v) => !v),
							})
						: null,
					error !== null
						? createElement("p", { style: S.error }, `⚠️ ${error}`)
						: null,
					// 阶段片（焦点区顶部那排六格）＝**常驻导航面**：有书就渲染，浏览某一步 / 停在阶段页
					// 时照常在。2026-09-22 票 12（spec 不变量 13 / ADR-0012 决策 2）：旧规则 F22
					// 「浏览历史时主进度条隐藏」**撤销**——那正是"回看时找不到回到现在"的成因；
					// 回看态下「当前阶段」那一格脸上直接写「回到现在」（见 `ui/event-cards.js` PhaseBar）。
					// 六格全可点，点一格＝去那一阶段的页面；点「当前阶段」那一格＝回到现在。
					// 2026-09-24 票 phase-bar-position/01（用户上报：「在清单里点击后，状态条去到最下面了？」）：
					// **顺序就是位置**——焦点区是**同一个滚动容器**，里面兄弟节点的 DOM 序就是 top 序。所以这一块
					// 要排在它下面**所有内容**（两个阶段页渲染点、三个展开面板）之前；排在后面时，长阶段页会把它
					// 顶出可视范围（真机实测：阶段片 top 988 / 可视带底 762.5 / 折线以下 225px，「回到现在」要滚到
					// 底才找得到）。这里只钉「谁在谁前面」那一半——`smoke-test.mjs` 2d-3d 是**顺序级**断言；真几何
					// 那一半由票里的 Chromium 探针复量（node 侧没有排版引擎，断 `getBoundingClientRect()` 只会量到
					// 0＝假绿，见 `test-layout-anchors.mjs` 头顶那句）。
					createElement(PhaseBar, {
						phase: meta.phase ?? 1,
						gate,
						status: meta.status,
						humanTurn,
						// 被看的那一步所属的阶段（描边标记），与"当前阶段"那一格是**两件事**、不许混：
						// 浏览态取 `viewPhaseOfBrowsing`（点的是全览条里的一步），阶段页态取 `viewPhase`
						// （点的是阶段片一格）；在"现在"两侧都为空 → 不描任何格（2026-09-22 票 12 裁决 4）。
						viewed:
							browsing != null
								? viewPhaseOfBrowsing
								: viewPhase !== null
									? viewPhase
									: null,
						artifactCountOf: (n) => openableCountByPhase[n] ?? 0,
						onSelect: phaseBarSelect,
					}),
					// 阶段页（全览条点一步落到这里；「回到现在」由那排常驻的阶段片承担——票 12 已裁，
					// 入口不随看点深浅消失，spec 不变量 13）。**排在阶段片之后**：理由与实测数字见上面
					// 阶段片那一块（顺序即位置）——两路互斥，但两路都吃同一条顺序。
					// 2026-09-21（用户第 5 条：「这个界面是不是不再必要了，可以直接复用现在的回看页面」）：
					// **不再渲染另一套单卡**，改成复用阶段页那一页、并把焦点定在选中的
					// 那一步——步清单点一步与顶栏点一格从此落到同一种卡。
					browsing != null
						? createElement(PhasePage, {
								key: `seg-${browsing}`,
								phase: viewPhaseOfBrowsing,
								meta,
								segments: processSegs,
								workFiles,
								checks,
								aiReport,
								knowledgeMapText,
								goldDrafts,
								goldDraftVersion,
								onOpen: openInSidebar,
								focusedSegment: browsing,
								inlineDeepModify: true,
								busy,
								onLocate: (segKey) => setBrowsing(segKey),
								onDeepModify: (segKey, note) => {
									void postAction({ action: "deep-modify", segment: segKey, note });
									// 票 11（spec §3 热区表「就这么改」那行判"不合法"：入口按钮不得替用户
									// 换屏）：提交后**不换屏**——留在这一页，被改的那一段就地标成「我正在做」
									// （乐观标记由 `PhasePage` 持有）。要不要回「现在」由用户自己走阶段片
									// 「当前阶段」那一格（票 12 已裁：它常驻）。
								},
								// 撤销入口（10 分钟窗）在阶段页页脚；它归「刚才那一次定点修改」。
								// 票 11 复核：这一下同样**不换屏**——撤销也是阶段页上的入口按钮，替用户换屏
								// 是同一处违规；撤销后那一行由下一份 `/textbook/process` 还原成真实状态。
								onDeepUndo: () => {
									void postAction({ action: "deep-undo" });
								},
							})
						: null,
					// 顶栏 🎨 风格线 / 📮 留言 展开面板（Task 17 常驻入口；点开即见清单，再点或 ✕ 收起）。
					// 它们也算「内容」：一律排在阶段片之后——开一个面板不该把常驻导航面顶下去
					// （票 phase-bar-position/01 顺手把这条顺序收拢；面板的高度不受控，尤其模式库那张）。
					showStylePanel
						? createElement(StylePanel, {
								notes: styleNotes,
								onClose: () => setShowStylePanel(false),
							})
						: null,
					showIntervenePanel
						? createElement(IntervenePanel, {
								items: pendingIvs,
								onClose: () => setShowIntervenePanel(false),
							})
						: null,
					// 🧩 自定义模式库面板（2026-08-21）：粘贴描述 → AI 分析成「模式卡」加入本书。
					patternOpen
						? createElement(PatternPanel, {
								patterns: patternList,
								busy: patternBusy,
								result: patternResult,
								onAnalyze: analyzePattern,
								onClose: () => setPatternOpen(false),
							})
						: null,
					// 阶段页：这一步走到哪、这一阶段有哪几步、每一步产出了哪些文件。
					// 产物一律由卡片里写着「打开」的按钮交给右栏（导航本身不开文件）。
					viewPhase !== null
						? createElement(PhasePage, {
								phase: viewPhase,
								meta,
								segments: processSegs,
								workFiles,
								checks,
								aiReport,
								knowledgeMapText,
								goldDrafts,
								goldDraftVersion,
								onOpen: openInSidebar,
								// 就地定点修改：按钮不再把人送去另一个界面，就在这张卡上展开确认框。
								inlineDeepModify: true,
								busy,
								onDeepModify: (segKey, note) => {
									void postAction({ action: "deep-modify", segment: segKey, note });
									// 票 11（spec §3 热区表「就这么改」那行判"不合法"）：提交后不换屏——
									// 阶段页态与浏览态**两处接线同一条规矩**，都不许把人挪走；被改的那一段
									// 就地标成「我正在做」（乐观标记由 `PhasePage` 持有）。要回「现在」走
									// 阶段片「当前阶段」那一格。
								},
								// 撤销入口（10 分钟窗）在阶段页页脚；它归「刚才那一次定点修改」。
								// 票 11 复核：撤销同样不换屏（理由见浏览态那处注释）。
								onDeepUndo: () => {
									void postAction({ action: "deep-undo" });
								},
								// 「定点修改」就地展开确认框，不再换屏。
								onLocate: (segKey) => {
									setViewPhase(null);
									setBrowsing(segKey);
								},
							})
						: null,
					// 状态条：spec 不变量 10——回看时不摆"现在"的内容（状态条 / 活性行 /「现在」主卡
					// 一律收起）。2026-09-22 票 03：旧门控只看 `viewPhase`，于是**浏览态**
					// （`browsing` 非空，全览条点一步进来）下状态条还在渲染——补上这一半。
					viewPhase === null && browsing === null
						? createElement(StatusStrip, {
								meta,
								gate,
								pendingStage: pendingStageView,
								progressDetail,
								metaLabel: pendingStageLabel,
								// 批 1：把「轮到谁」的唯一真值交给状态条，避免横幅与阶段片各说一套。
								humanTurn,
							})
						: null,
					// 主 AI 活性行（F17）：常驻一行——「🤖 我正在做」/ 好一会儿没动静了 [🔁 从断点继续] /
					// 「⚡ 轮到你」。票 stale-detection/01 起它是这一屏**唯一**的停顿出口（状态卡那张
					// 黄色警告框已撤），判定与措辞都归 `src/ui/rules.js` + `src/ui/panels.js`。
					// 阶段页与分段回看都是"回看/前瞻"，不摆"现在"的活性（它和这一步的历史无关）——
					// 用户原话「回看时不要再展示当前步骤的内容」。spec 不变量 10 把状态条、活性行与
					// 「现在」主卡并列为"浏览态一律收起"的三样（2026-09-22 票 03 复核：这里的门控
					// 本来就带 `browsing === null`，与状态条那处不一致的写法一并统一）。
					viewPhase === null && browsing === null
						? createElement(ActivityLine, {
						meta,
						// 「轮到谁」以 humanTurn 为准（02 屏判读实测：status=running 但拍板正等用户时，
						// 活性行原来说「我正在做·卡住了」，与同屏状态条的「轮到你」打架）。
						humanTurn,
						// 这一屏唯一的出口：判定结果是共用那一份（三路输入、一个门槛），
						// 措辞与时长格式化都归它（见 `src/ui/rules.js`）。
						stall,
						// 唯一那颗按钮发「从断点继续」（写状态、清暂停、必要时重新交办；
						// 没有活的主 AI 时退回推状态机）。原来发的是「催一句」——写着「接着干」、
						// 做的只是催一下，而且没有活着的主 AI 时直接报错。
						onResume: () => {
							void postAction({ action: "resume" });
						},
						// 小助手状态：宿主推送的会话摘要聚合（{count, runningCount}），不再自己轮询数。
						subagents: subagentRuns,
					})
						: null,
					// 「现在」那张主卡只属于现场：在看某一阶段的页面时，页面自己交代
					// "这一步的书夹产物在哪"，别再叠一张能操作的卡进去
					// （2026-09-21 用户裁决：回看页只读，能改结果的动作只出现在「现在」）。
					viewPhase !== null || browsing !== null
						? null
						: (() => {
						// 焦点区主卡路由（抽成 focusCardKey 纯函数：view-rules.js，可独立测试）。
						switch (focusCardKey(meta, gate)) {
							case "gate":
								return createElement(GatePanel, {
									gate,
									onDecide: decide,
									onRollback: rollback,
									busy,
									error: null,
									onAddPattern: analyzePattern,
								});
							case "explore":
								return createElement(ExploreConfirmCard, {
									meta,
									exploreSummary,
									// 知识地图（机器产物）原文：卡片内联人读清单用它，不再走文件接口。
									knowledgeMapText,
									project: activeId,
									session: sessionRef.current,
									onConfirm: confirmExplore,
									onViewReport: () =>
										viewWork({ path: "work/explore.md", label: "读材料报告" }),
									busy,
								});
							case "outline":
								return createElement(OutlineConfirmCard, {
									meta,
									busy,
									onConfirm: confirmOutline,
								});
							case "gold":
								return createElement(GoldTable, {
									meta,
									busy,
									goldDrafts,
									goldDraftVersion,
									postAction,
									onSuggestWords: async () => {
										const json = await fetchJson("/textbook/action", {
											method: "POST",
											headers: {
												"Content-Type": "application/json",
												Accept: "application/json",
											},
											body: JSON.stringify({
												action: "suggest-words",
												session: sessionRef.current,
												project: activeRef.current,
												goal: meta.goal,
												route: meta.route,
												science: meta.science,
												chapterCount: (meta.outline?.chapters ?? []).length,
											}),
										});
										return json.suggestion ?? null;
									},
									fetchText: (path) =>
										fetch(
											`/textbook/file?${sess()}&project=${encodeURIComponent(activeRef.current)}&path=${encodeURIComponent(path)}`,
										).then((res) => {
											if (!res.ok) throw new Error(`HTTP ${res.status}`);
											return res.text();
										}),
								});
							case "final":
								return createElement(FinalApprovalCard, {
									project: activeId,
									session: sessionRef.current,
									checks,
									onPreview: previewBook,
									busy,
									meta,
									aiReport,
									styleNotes: meta.styleNotes,
									onApprove: () => {
										void postAction({ action: "final-approve", approved: true });
									},
									onReject: (note) => {
										void postAction({ action: "final-approve", approved: false, note });
									},
								});
							case "delivered":
								return createElement(DeliveryCard, {
									project: activeId,
									session: sessionRef.current,
									checks,
									onPreview: previewBook,
									busy,
									meta,
									aiReport,
									styleNotes: meta.styleNotes, // 风格线落实清单：从 meta 传入，内部 ?? [] 兜底（旧账本无此字段）
								});
							case "chapters":
								return createElement(ChaptersCard, {
									meta,
									chapterStatus,
									pendingReviews,
									progressDetail,
									reviewMode:
										meta.status === "awaiting-chapters-review",
									onApproveAll: () => {
										void postAction({
											action: "chapters-review-confirm",
											approved: true,
										});
									},
									onView: (n) =>
										viewWork({
											path: `work/chapter-${String(n).padStart(2, "0")}.md`,
											label: `第 ${n} 章`,
										}),
									onReview: submitReview,
									busy,
									events, // F17 章级「完成」态推导用（agent-end 事件 → 第N章）
									workFiles, // F17 「看看这章」置灰用（chapter 文件不在产物清单就禁用）
									project: activeId,
									session: sessionRef.current,
									postAction, // F39 过目态内联展开/段级三键
								});
							case "upload":
								return createElement(UploadArea, {
									sources: meta.sources ?? [],
									converting: meta.converting === true,
									onUpload: uploadSource,
									onConvert: convert,
									onIdentify: identifyRoles,
									busy,
								});
							default:
								return createElement(StatusCard, {
									meta,
									lastEvent,
									events,
									needsConfig: needsConfigText,
									onResume: resume,
									busy,
									pendingStageLabel,
									progressDetail,
									// 票 stale-detection/01：状态卡不再自己算一遍停顿时长、也不再出黄色警告框
									// 与那颗按钮（那两样归顶上那行活性行——它每个阶段都在，而状态卡只在兜底
									// 这一支才在）。它消费的**就是活性行那一份判定对象**，只用其中一位来决定
									// 计时那行说「我正在做」还是只说时长。
									stall,
									// F28：error 态删书重来入口——复用既有 deletingId/deleteBook 两步删除机制（与业务头同源）。
									onDeleteStart: () => setDeletingId(activeId),
									onDeleteConfirm: () => deleteBook(activeId),
									deletingId: deletingId === activeId,
								});
						}
					})(),
					// 「之前的过程」是现场的账本回放（与"我正在看哪一步"无关），阶段页上不摆它。
					viewPhase === null
						? createElement(
						"div",
						{ style: { margin: "8px 0" } },
						createElement(
							"button",
							{
								style: S.smallLink,
								onClick: () => setShowHistory(!showHistory),
							},
							showHistory
								? "▾ 收起之前的过程"
								: "▸ 之前的过程（点开可回放抽查）",
						),
					)
						: null,
					viewPhase === null && showHistory
						? events.map((event) => {
								const product = workPathForEvent(event, meta, workFiles);
								// 票 08（`event-row-entries/spec.md` 决策 8；`workbench-transitions/spec.md`
								// 不变量 14）：判据认得出候选、但那份文件**还没在产物清单里**的行，
								// 与「本来就没有候选」的行是两种处境——前者给一行灰字，后者什么都不长。
								// 判据在 `view-rules.workEntryForEvent`（单一出处）：`blocked` 恒不带
								// `path`/`label`，所以这里**给不出名字**（决策 8「不起名」在判据层就成立）。
								// ⚠️ 还没拿到产物清单时（首屏 / 切书后）**不判** `blocked`：那时 `workFiles`
								// 是空数组，"文件不在清单里"与"清单还没到"不可分，判了就会闪一句假灰字。
								const blocked =
									workFilesReady &&
									workEntryForEvent(event, meta, workFiles).kind === "blocked";
								const isGate = event.type === "textbook/gate-proposal";
								// **这一行就是展开态的键**（`key` 与 `detailOpen` 都取它，只此一处）。
								// 票 07（`event-row-entries/spec.md` 决策 12；`workbench-transitions/spec.md`
								// 不变量 2）：不能拿 `event.seq` 当键——真账本里 `seq` **不唯一**
								// （`restoreSnapshot` 把 `meta.eventCount` 写回 `events.length`、
								// `deep-modify` 写回 `kept.length`，见 `workflow/engine.js` 与
								// `workflow/actions/deep-modify.js`，于是同一个 `seq` 在新一轮里被复用：
								// 一本书里 9 条事件同为 `seq=54`），点一行会连带展开/收起同号的行。
								// 取 `seq`+`type`+`time` 而不是列表下标：下标是**位置**、不是行的身份——
								// 工作台每 2s 重取 `/textbook/events`，同一个 WorkbenchView 里还会切书
								// （`setActiveId`），位置键在重取/切书后会落到"恰好坐在那个位置的另一行"，
								// 把同一个毛病换个方式复现（跨书泄漏一颗展开态）。同号事件是不同轮次
								// 写下的，`appendEvent` 恒写新的 `time: Date.now()`，故这个组合在真账本里唯一。
								const rowKey = `${event.seq}::${event.type}::${event.time}`;
								const detailOpen = gateOpen === rowKey;
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
										// （服务端按 `EVENT_TYPES` 校验），真账本走不到那一支；真走到了，宁可
										// 这一格不出词，也不把 `textbook/xxx` 这种机器串摆到人眼前
										// （与不变量 7 同一取向：界面不露机器身份词）。
										createElement(
											"strong",
											null,
											eventHuman(event.type, EVENT_META[event.type]?.label ?? ""),
										),
										// 票 07（`event-row-entries/spec.md` 决策 7；`workbench-transitions/spec.md`
										// 不变量 2）：拍板提案行的**纯展开**控件——行内第一颗真按钮，只干一件事
										// （改展开态），**不发动作、不开右栏**。它与同行的「打开」是"两个控件、
										// 各一个身份"（整块热区里嵌行内控件合法），不是"同一热区两个身份"。
										// 必须是真 `<button>` 且文字挂在**第一个文本子节点**上：按文本找按钮的
										// 辅助件只认这个形状（`assertion-plan.md` §2「findButton」）。
										isGate
											? createElement(
													"button",
													{
														style: { ...S.smallLink, marginLeft: "10px" },
														onClick: () =>
															setGateOpen(detailOpen ? null : rowKey),
														// 悬浮提示只说这颗控件干的那一件事（不变量 12：文案不承诺没有
														// 机制的）——说「详情」不说「全文」：这里渲染的是账本事件带的
														// `summary`/`detail`，与关卡卡「展开完整方案」同一份字。
														title: detailOpen
															? "收起这份提案的详情"
															: "就地展开这份提案的详情（不打开右栏）",
													},
													detailOpen ? "▾ 收起" : "▸ 提案详情",
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
													onOpen: () => viewWork(product),
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
																"pre",
																{
																	style: {
																		whiteSpace: "pre-wrap",
																		wordBreak: "break-word",
																		background: "var(--dsw-surface, #fff)",
																		borderRadius: "6px",
																		padding: "8px",
																		fontSize: "12px",
																		margin: "4px 0 0",
																	},
																},
																event.data.detail,
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
								);
							})
						: null,
					// 「📄 第一步 · 材料准备」那张抽屉已并入阶段页（点阶段片第 1 格 ＝ 那一步的页面，
					// 摆材料清单与转换状态）；现场的上传卡仍在（当前阶段那格＝回到现在）。
					// 抽屉的唯一入口正是阶段片第 1 格，入口改道后它成了不可达的死代码，故删除。
					// 底部常驻小条：书的进度 / 书文件夹 / 取消这本书。
					// 2026-09-21 用户裁决「左栏不再要了」——这四样原来挂在左栏底部，
					// 它们跟造书的步骤无关，搬成焦点区底部一条小条（见 FocusFooter）。
					createElement(FocusFooter, {
						status: meta.status ?? null,
						bookDir,
						deleting: deletingId === activeId,
						busy,
						onDelete: () => {
							if (deletingId === activeId) deleteBook(activeId);
							else setDeletingId(activeId);
						},
						// 票 12：确认态要有退路——「算了」把 deletingId 收回 null、回到第一态。
						// 两条路都不发动作；`book-delete` 仍然只有第二下（确认那颗）发，且只发一次。
						onCancelDelete: () => setDeletingId(null),
					}),
				),
				// 破卷常驻广告：钉在焦点区**下方、对话台之上**的一条固定横条。
				//
				// 用户 2026-09-21 裁决（推翻我前两版）：
				//   「可以挡字，放在页面最下面（dsh 的输入栏上面），
				//     这样当用户滚动滚动条时，被挡住的字会显示出来」
				//
				// 这一句点破了我没想清的地方：**浮动的卡会挡住"永远露不出来"的字**——
				// 它随视口走，压在它下面的内容再怎么滚也滚不出来（我上一版就压住了
				// 「认可，交付」和「之前的过程」）。而钉在**页面底部**的横条，
				// 压住的是"当前滚到那一段"的字，用户一滚就把它让出来了。
				//
				// 它不参与焦点区的滚动流（是它的兄弟节点），所以永远可见——
				// 2026-08-21「造书进程中一直可见」那条需求仍然成立。
				createElement(SocratopiaAd),
				// 下：对话台（右下镜像宿主对话；分界可拖）。焦点区在它上面独立滚动。
				// ⚠️ 2026-09-21 用户裁决：「展开对话台」不再需要——要对话去官方的「对话」页签。
				// 收起态（默认）整块**不渲染**（原来是一条 32px 的入口条）；展开态仍渲染对话台本体，
				// 谁把它展开没有变（宿主的自动展开逻辑仍在）。
				deskCollapsed
					? null
					: createElement(
							"div",
							{
								ref: deskRef,
								style: {
									height: `${deskLiveRef.current ?? deskHeight}px`,
									flexShrink: 0,
									borderTop: "1px solid var(--dsw-border, #d0d7de)",
									position: "relative",
								},
							},
							createElement("div", {
								// 拖拽分界手柄
								style: {
									position: "absolute",
									top: "-4px",
									left: 0,
									right: 0,
									height: "8px",
									cursor: "ns-resize",
								},
								onMouseDown: startDeskDrag,
							}),
							// 对话台的滚动容器移进 ChatDesk 自己（钉底滚动回归修复在组件内）。
							createElement(ChatDesk, {
								useChat: props.useChat,
								events, // Task 20 回执徽章用（workbench 事件数组）
								onNudge: () => {
									void postAction({
										action: "nudge",
										text: "工作台还没跟上，请把刚才答应的事落账（比如风格线、进度）",
									});
								},
								onCollapse: () => setDeskCollapsed(true),
							}),
						),
			),
		);

	// 三区布局（布局 A）：顶栏常驻其上；主体=有书时三区（地图栏+焦点区+对话台）、无书时单滚动内容。
	// 外层 overflow:hidden 保证只有焦点区/地图栏在滚，不带动页面。
	return createElement(
		"div",
		{
			ref: rootRef,
			style: {
				display: "flex",
				flexDirection: "column",
				height: rootH !== null ? `${rootH}px` : "100%",
				minHeight: 0,
				overflow: "hidden",
			},
		},
		topBar,
		meta !== null && !loading
			? projectView()
			: createElement(
					"div",
					{ style: { flex: 1, minHeight: 0, overflow: "auto" } },
					simpleContent,
				),
	);
}

export function apply(ctx) {
	// 「打开一份文件看看」的服务入口：交给右侧 Sidebar 的导航面（上下文服务，
	// 见 ADR-0010 决策 1/7）。工作台组件只拿这一个函数，不直接碰 ctx。
	// ⚠️ sidebarRight 是硬依赖（inject 里已声明）：解不到就没有这个函数，
	// 工作台不会被挂上——绝不退化成「按钮点了没反应」。
	const openFileInSidebar = (address) => {
		ctx.sidebarRight.openResource(address, { revealIfOpened: true });
	};
	// 工作台页签「会话级门控」：宿主 conversation.view 页签列表是全局投影、无 per-session
	// 可见性选项，故订阅 sessions.list 自行注册/注销。
	// 判据（2026-09-20 用户拍板）：**造书模式**，或**这个会话在盘上真有书**。
	// 原来只认 projectionValues.agentPreset === "textbook"，于是两条老会话（会话记录里没有
	// 该投影值）的成品永远打不开工作台——页签不出现，下载/预览都进不去。而「盘上真有
	// project.json」比「会话元数据里记着预设名」更接近门控的本意。
	// ⚠️ agentPreset 在客户端会话记录里位于 projectionValues（host control 帧镜像），
	// 顶层没有该字段——8-26 版本曾读错字段导致门控永远失效/永远生效。
	ctx.slots.inject("conversation.view", () => {
		let disposer = null;
		let probedSession = null; // 已经问过服务端的会话 id（每个会话只问一次）
		let hasBook = false;
		const sync = () => {
			const snap = ctx.sessions.list.getSnapshot();
			const current = snap.byId?.[snap.current];
			const id = snap.current ?? null;
			const isTextbook =
				current?.projectionValues?.agentPreset === "textbook";
			const show = isTextbook || (id !== null && id === probedSession && hasBook);
			if (show && disposer === null) {
				disposer = ctx.slots.register(
					{
						name: "conversation.view",
						id: "dsh-craft-your-textbook",
						order: 20,
						label: () => "工作台",
						// 预览入口以 props 注入（组件不持 ctx）：见上方 openFileInSidebar。
						inject: () => ({ openFileInSidebar }),
					},
					WorkbenchView,
				);
			} else if (!show && disposer !== null) {
				disposer();
				disposer = null;
			}
			// 非造书模式：问一次服务端「这个会话有没有书」，有就补注册页签。
			if (!isTextbook && id !== null && id !== probedSession) {
				probedSession = id;
				hasBook = false;
				void fetch(`/textbook/projects?session=${encodeURIComponent(id)}`)
					.then((res) => (res.ok ? res.json() : null))
					.then((json) => {
						if (probedSession !== id) return; // 期间用户又切走了
						hasBook = (json?.projects ?? []).length > 0;
						if (hasBook) sync();
					})
					.catch(() => {
						/* 问不到就按没有书处理（不注册页签，行为同旧版） */
					});
			}
		};
		// subscribe 不会立即触发一次（zustand 语义），先手动同步一次再订阅。
		sync();
		const unsubscribe = ctx.sessions.list.subscribe(sync);
		return () => {
			unsubscribe();
			if (disposer !== null) disposer();
		};
	});
	// 造书会话首次对话后自动打开工作台页签（头部小工具位，常驻但不占视觉空间）。
	ctx.slots.inject("conversation.session.header.utilities", () =>
		ctx.slots.register(
			{
				name: "conversation.session.header.utilities",
				id: "textbook-autoopen",
				order: 99,
			},
			AutoOpenWorkbench,
		),
	);
	ctx.logger.info(
		"[ui-textbook-run] 工作台视图已注册（全览条 + 阶段页 + 对话台 + 自动打开）",
	);
}
