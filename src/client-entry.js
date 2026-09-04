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

import { createElement, useEffect, useRef, useState } from "react";
import { S } from "./ui/styles.js";
// 领域规则与纯函数（rules）：本文件直接用的 + 为保持产物表面而再导出的；
// 双端共享领域件（素材角色、六阶段、范例章号）以 src/domain-rules.js 为源。
import {
	formatTime,
	mainProgressVisible,
	shouldForceBackToNow,
	chapterBadge,
	deriveDoneSet,
	splitParagraphs,
	paragraphHint,
	diffParagraphs,
	stageScopedProgressDetail,
} from "./ui/rules.js";
// 展示派生（事件→文件、阶段→产物、stage→界面文案）集中放卡片域 view-rules.js，
// 壳只留薄绑定；领域源仍是 domain-rules。
import { stageHuman, phaseProduct, workPathForEvent, focusCardKey } from "./ui/view-rules.js";
// 上传上限与超限文案（前后端共享单一事实源，见 domain-rules.js）。
import { MAX_UPLOAD_BYTES, uploadTooLargeMessage } from "./domain-rules.js";
// 最小 markdown 渲染。
import {
	READER_PARA_STYLE,
	renderInline,
	exploreReportBlocks,
} from "./ui/md-render.js";
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
// 对话台。
import { ChatDesk } from "./ui/chat-desk.js";
// 谈判桌。
import {
	GoldOpinionList,
	GoldReader,
	GoldCompare,
	GoldFinalize,
	GoldTable,
} from "./ui/gold-table.js";
// 章节清单与过程地图。
import {
	ChaptersCard,
	ProcessMapRail,
	HistoryBrowser,
	foldKnowledgeMap,
	FileViewer,
	BrowseSection,
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

export const inject = ["slots", "sessions"];

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
	ProcessMapRail,
	HistoryBrowser,
	foldKnowledgeMap,
	FileViewer,
	BrowseSection,
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

export function AutoOpenWorkbench(props) {
	const isTextbook =
		props.useSessions((s) => s.byId[props.sessionId]?.agentPreset) ===
		"textbook";
	const messageCount = props.useSession((s) => s.nodes.length);
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

function WorkbenchView(props) {
	// 会话模式门控：只在「造书模式」显示工作台（useSessions 选择器返回稳定值，安全）。
	const sessionPreset = props.useSessions(
		(s) => s.byId[props.sessionId]?.agentPreset ?? null,
	);
	const session = props.sessionId;
	// 主 AI 活性（F17）：浏览器侧流式正在吐半个回合（partial!=null）即算「AI 回合进行中」。
	const partialActive = props.useSession((s) => s.partial) != null;
	const [projects, setProjects] = useState([]);
	const [activeId, setActiveId] = useState(null);
	const [meta, setMeta] = useState(null);
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
	const [preview, setPreview] = useState(null);
	const [bookDir, setBookDir] = useState(null);
	const [workFiles, setWorkFiles] = useState([]);
	const [pendingStageView, setPendingStageView] = useState(null);
	const [pendingGateView, setPendingGateView] = useState(null);
	const [pendingReviews, setPendingReviews] = useState([]);
	const [exploreSummary, setExploreSummary] = useState(null);
	const [chapterStatus, setChapterStatus] = useState([]);
	const [goldDrafts, setGoldDrafts] = useState([]);
	const [goldDraftVersion, setGoldDraftVersion] = useState(1);
	const [viewing, setViewing] = useState(null);
	const [viewText, setViewText] = useState(null);
	const [gateOpen, setGateOpen] = useState(null);
	const [showMaterials, setShowMaterials] = useState(false);
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
		const measure = () => {
			const rect = el.getBoundingClientRect();
			const vh = typeof window !== "undefined" ? window.innerHeight || 0 : 0;
			// 实机证据（2026-08-21）：工作台根容器的父容器是 display:contents（无盒子，
			// getBoundingClientRect 全 0），量父容器拿不到高度。改用根容器自身的位置算可用高度；
			// 且不能把底部 DSH 作曲家输入框盖住——找到最靠底部的文本输入元素，工作台在它上方结束。
			let bottomBound = vh;
			try {
				if (typeof document !== "undefined") {
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
							bottomBound = r.top;
						}
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
	// 深改过程地图：历史分段列表（含影响预告/撤销窗口）+ 当前浏览的分段 key（地图栏点击由 Task 15 接线）。
	const [processSegs, setProcessSegs] = useState([]);
	// F35：/textbook/process 响应里的子代理聚合状态（running=审计/写作在跑、inactive=完成待收），喂活性行。
	const [processSubagents, setProcessSubagents] = useState({
		running: 0,
		inactive: 0,
	});
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
		} catch {
			/* 结果列表失败不影响主界面 */
		}
	}

	// 深改过程地图（历史分段 + 影响预告 + 撤销窗口）：与事件同节奏刷新。
	async function refreshProcess(projectId) {
		try {
			const json = await fetchJson(
				`/textbook/process?${sess()}&project=${encodeURIComponent(projectId)}`,
			);
			setProcessSegs(json.segments ?? []);
			// F35：子代理聚合状态随过程地图一起刷新；后端降级/缺失时兜底为 0。
			const sub = json.subagents ?? {};
			setProcessSubagents({
				running: Number.isSafeInteger(sub.running) ? sub.running : 0,
				inactive: Number.isSafeInteger(sub.inactive) ? sub.inactive : 0,
			});
		} catch {
			/* 过程地图失败不影响主界面 */
		}
	}

	const viewWork = async (file) => {
		setViewing(file);
		setViewText(null);
		try {
			const res = await fetch(
				`/textbook/file?${sess()}&project=${encodeURIComponent(activeRef.current)}&path=${encodeURIComponent(file.path)}`,
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			setViewText(await res.text());
		} catch (err) {
			setViewText(
				`（打开失败：${String(err instanceof Error ? err.message : err)}）`,
			);
		}
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

	useEffect(() => {
		let alive = true;
		(async () => {
			try {
				await loadProjects();
				if (activeRef.current !== null) await loadAll(activeRef.current);
				const settings = await fetchJson("/textbook/settings");
				if (alive) setMineruSet(settings.settings?.mineruTokenSet === true);
			} catch (err) {
				if (alive) setError(String(err instanceof Error ? err.message : err));
			} finally {
				if (alive) setLoading(false);
			}
		})();
		return () => {
			alive = false;
		};
	}, []);

	useEffect(() => {
		const timer = setInterval(() => {
			void poll();
		}, 2000);
		return () => clearInterval(timer);
	}, []);

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

	const selectProject = (id) => {
		activeRef.current = id;
		setActiveId(id);
		setError(null);
		setGate(null);
		setPreview(null);
		// 换书时把自动跟随的两条横幅和进度序号一并归零，避免旧书的残留状态串台。
		setAwaitBanner(false);
		setProgressBanner(false);
		progressSeqRef.current = -1;
		void loadAll(id).catch((err) =>
			setError(String(err instanceof Error ? err.message : err)),
		);
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
	// 强制中断（Task 17 顶栏 ⏸）：记账 → 取消主 AI → 逐个中断子代理，绝不 followup（后端契约）。
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

	const togglePreview = () => {
		if (preview !== null) {
			setPreview(null);
			return;
		}
		void fetch(
			`/textbook/file?${sess()}&project=${encodeURIComponent(activeRef.current)}&path=work/book.md`,
		)
			.then((res) => res.text())
			.then((text) => setPreview(text))
			.catch((err) =>
				setError(String(err instanceof Error ? err.message : err)),
			);
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
			? `设计提案·第 ${pendingGateView ?? "?"} 关`
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

	// 门控（防御纵深）：动态注册已确保页签只在造书会话出现；组件内再兜底——
	// sessionPreset !== "textbook" 一律不渲染真实工作台（含 null 未解析窗口，杜绝闪现）。
	if (sessionPreset !== "textbook") {
		return null;
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
			"本会话独立使用，一个会话只造一本书。主 AI 统筹推进流水线（亲自做或派小助手分头干），轮到你要拍板/确认时亮起 ⚡；每个拍板点都自动存档，随时能改。",
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
	// 有书时的三区主体：左地图栏 | 右列（上焦点区独立滚动 + 下对话台固定底部）。
	// 写成函数延迟构造：meta 为 null（向导/加载态）时不该碰 meta 字段，避免空指针。
	const projectView = () =>
		createElement(
			"div",
			{ style: { display: "flex", flex: 1, minHeight: 0, overflow: "hidden" } },
			// 左：过程地图栏（Task 15 三区骨架 P3；点任意段 -> 焦点区切浏览视图）。
			createElement(ProcessMapRail, {
				segments: processSegs,
				status: meta?.status ?? null,
				browsingKey: browsing,
				onSelect: (key) => {
					setBrowsing(key); // 点任意段 -> 焦点区浏览视图（Task 10 HistoryBrowser）
					// F47（2026-08-20）：切段清掉上一个段的产物查看，并自动打开该段第一个产物。
					setViewing(null);
					setViewText(null);
					const seg = processSegs.find((s) => s.key === key);
					const first = seg?.artifacts?.[0];
					if (typeof first === "string" && first !== "")
						void viewWork({ path: first, label: first });
					// 开始浏览时记住当前进度序号：这之后 AI 再出的 progress 才算「新进展」（方案 A）。
					const lastProgress = [...eventsRef.current]
						.reverse()
						.find((e) => e.type === "textbook/progress");
					progressSeqRef.current = lastProgress?.seq ?? -1;
					setProgressBanner(false);
				},
			}),
			// 右：上=焦点区（统一滚动容器，浏览/各状态卡/面板整体迁入），下=对话台（固定底部）。
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
				createElement(
					"div",
					{
						style: {
							position: "relative",
							flex: 1,
							minHeight: 0,
							overflowY: "auto",
							padding: "12px 16px",
						},
					},
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
						deletingId === activeId
							? createElement(
									"button",
									{
										style: {
											...S.smallLink,
											color: "var(--dsw-danger, #cf222e)",
										},
										onClick: () => deleteBook(activeId),
										disabled: busy,
									},
									"确认取消这本书（进回收站）",
								)
							: createElement(
									"button",
									{
										style: S.smallLink,
										onClick: () => setDeletingId(activeId),
									},
									"取消这本书",
								),
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
					// 浏览态：优先历史分段回看（「回到现在」回到现场，Task 10 提供，保持原位）。
					// F22：浏览态下该段「产物」查看内容渲染在卡片正下方（BrowseSection 内）；
					// 主进度条（PhaseBar）隐藏，回到现在（browsing=null）后才显示。
					browsing != null
						? createElement(BrowseSection, {
								segment:
									(processSegs ?? []).find((seg) => seg.key === browsing) ??
									null,
								meta,
								busy,
								viewing,
								viewText,
								onBack: () => setBrowsing(null),
								onView: (rel) => viewWork({ path: rel, label: rel }),
								onDeepModify: (segmentKey, note) => {
									void postAction({
										action: "deep-modify",
										segment: segmentKey,
										note,
									});
									setBrowsing(null);
								},
								onDeepUndo: () => {
									void postAction({ action: "deep-undo" });
								},
								onCloseView: () => setViewing(null),
							})
						: null,
					// 顶栏 🎨 风格线 / 📮 留言 展开面板（Task 17 常驻入口；点开即见清单，再点或 ✕ 收起）。
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
					// F22：主进度条（顶部阶段卡）在浏览态（browsing 非空）隐藏，回到现在才显示。
					mainProgressVisible(browsing)
						? createElement(PhaseBar, {
								phase: meta.phase ?? 1,
								gate,
								status: meta.status,
								humanTurn,
								onSelect: (phase) => {
									const product = phaseProduct(phase, meta, workFiles);
									if (product === null) return;
									if (phase === 1) {
										setShowMaterials(true);
										setViewing(null);
										return;
									}
									viewWork(product);
								},
								productOf: (p) => phaseProduct(p, meta, workFiles),
							})
						: null,
					createElement(StatusStrip, {
						meta,
						gate,
						pendingStage: pendingStageView,
						progressDetail,
						metaLabel: pendingStageLabel,
					}),
					// 主 AI 活性行（F17）：常驻一行——AI 回合进行中 / 账面 N 分钟没动静[戳一下 AI] / 等你拍板。
					createElement(ActivityLine, {
						meta,
						aiActive:
							partialActive ||
							(meta?.status === "running" &&
								Date.now() - (meta.updatedAt ?? 0) < 3 * 60 * 1000),
						onNudge: () => {
							void postAction({
								action: "nudge",
								text: "账面有一会没动了，请查状态继续推进",
							});
						},
						subagents: processSubagents,
					}),
					bookDir !== null
						? createElement(
								"p",
								{
									style: {
										margin: "6px 0 0",
										fontSize: "12px",
										opacity: 0.6,
										wordBreak: "break-all",
									},
								},
								`📁 书文件夹：${bookDir}`,
							)
						: null,
					(() => {
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
									project: activeId,
									session: sessionRef.current,
									onConfirm: confirmExplore,
									onViewReport: () =>
										viewWork({ path: "work/explore.md", label: "源探查报告" }),
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
									onPreview: togglePreview,
									preview,
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
									onPreview: togglePreview,
									preview,
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
									// F31：AI 流式干活（partialActive）或账本 3 分钟内有动 → 抑制「可能卡住了」误报（口径同活性行 L2759）。
									aiActive:
										partialActive ||
										(meta?.status === "running" &&
											Date.now() - (meta.updatedAt ?? 0) <
												3 * 60 * 1000),
									// F28：error 态删书重来入口——复用既有 deletingId/deleteBook 两步删除机制（与业务头同源）。
									onDeleteStart: () => setDeletingId(activeId),
									onDeleteConfirm: () => deleteBook(activeId),
									deletingId: deletingId === activeId,
								});
						}
					})(),
					createElement(
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
					),
					showHistory
						? events.map((event) => {
								const product = workPathForEvent(event, meta, workFiles);
								const isGate = event.type === "textbook/gate-proposal";
								const detailOpen = gateOpen === event.seq;
								const clickable = product !== null || isGate;
								const viewingThis =
									product !== null &&
									viewing !== null &&
									viewing.path === product.path;
								return createElement(
									"div",
									{
										key: event.seq,
										style: {
											...S.card,
											...(clickable ? { cursor: "pointer" } : {}),
											...(viewingThis
												? { borderColor: "var(--dsw-accent, #4f6ef7)" }
												: {}),
										},
										onClick: clickable
											? () => {
													if (product !== null) viewWork(product);
													else if (isGate)
														setGateOpen(detailOpen ? null : event.seq);
												}
											: undefined,
									},
									createElement(
										"div",
										null,
										createElement("span", null, cardIcon(event)),
										" ",
										createElement("strong", null, cardText(event)),
										product !== null
											? createElement(
													"span",
													{
														style: {
															marginLeft: "8px",
															fontSize: "12px",
															color: "var(--dsw-accent, #4f6ef7)",
														},
													},
													viewingThis ? "👁️ 查看中" : "📄 查看结果",
												)
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
					showMaterials
						? createElement(
								"div",
								{
									style: {
										marginTop: "8px",
										border: "1px solid var(--dsw-border, #d0d7de)",
										borderRadius: "8px",
										padding: "10px",
									},
								},
								createElement(
									"div",
									{
										style: {
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
										},
									},
									createElement(
										"strong",
										{ style: { fontSize: "13px" } },
										"📄 第一步 · 材料准备",
									),
									createElement(
										"button",
										{
											style: S.smallLink,
											onClick: () => setShowMaterials(false),
										},
										"✕ 收起",
									),
								),
								(meta.sources ?? []).length === 0
									? createElement(
											"p",
											{
												style: {
													margin: "6px 0 0",
													fontSize: "12px",
													opacity: 0.7,
												},
											},
											"还没有上传材料。",
										)
									: (meta.sources ?? []).map((source) =>
											createElement(
												"div",
												{
													key: source.file,
													style: {
														margin: "6px 0",
														display: "flex",
														gap: "8px",
														alignItems: "center",
													},
												},
												createElement(
													"span",
													{
														style: {
															flex: 1,
															fontSize: "12px",
															wordBreak: "break-all",
														},
													},
													`${source.converted === true ? "✅" : "⏳"} ${source.file}（${source.role ?? ""}）`,
												),
												source.converted === true &&
													typeof source.md === "string" &&
													source.md !== ""
													? createElement(
															"button",
															{
																style: S.smallLink,
																onClick: () =>
																	viewWork({
																		path: `sources-md/${source.md}`,
																		label: `转换内容：${source.file}`,
																	}),
															},
															"查看转换内容",
														)
													: null,
											),
										),
							)
						: null,
					// F22：文件查看器——浏览态下已在 BrowseSection 里紧贴段卡片渲染，这里只在
					// 「现在」视图（browsing=null，顶栏/事件卡/材料入口打开）渲染，避免同一内容两处出现。
					browsing === null && viewing !== null && viewText !== null
						? createElement(FileViewer, {
								viewing,
								viewText,
								onClose: () => setViewing(null),
							})
						: null,
				),
				// 下：对话台（右下镜像宿主对话；分界可拖、可收成一条）。焦点区在它上面独立滚动。
				// 收起态（默认）压成单行高，只留「展开对话台」入口；展开态才是对话区本体。
				createElement(
					"div",
					{
						ref: deskRef,
						style: {
							height: deskCollapsed
								? "32px"
								: `${deskLiveRef.current ?? deskHeight}px`,
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
					deskCollapsed
						? createElement(
								"button",
								{
									style: {
										...S.smallLink,
										margin: "6px auto",
										display: "block",
									},
									onClick: () => setDeskCollapsed(false),
								},
								"🤝 展开对话台",
							)
						: // 对话台的滚动容器移进 ChatDesk 自己（钉底滚动回归修复在组件内），展开态直接渲染组件。
							createElement(ChatDesk, {
								useSession: props.useSession,
								events, // Task 20 回执徽章用（workbench 事件数组）
								onNudge: () => {
									void postAction({
										action: "nudge",
										text: "工作台还没跟上，请把刚才答应的事落账（style-note/progress 等）",
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
	// 工作台页签「会话级门控」：宿主 conversation.view 页签列表是全局投影、无 per-session
	// 可见性选项，故订阅 sessions.list——当前会话是造书模式（agentPreset === "textbook"）
	// 才注册页签，否则注销；null/非 textbook 一律不注册，杜绝闪现。
	ctx.slots.inject("conversation.view", () => {
		let disposer = null;
		const sync = () => {
			const snap = ctx.sessions.list.getSnapshot();
			const current = snap.byId?.[snap.current];
			const isTextbook = current?.agentPreset === "textbook";
			if (isTextbook && disposer === null) {
				disposer = ctx.slots.register(
					{
						name: "conversation.view",
						id: "dsh-craft-your-textbook",
						order: 20,
						label: () => "工作台",
						inject: () => ({}),
					},
					WorkbenchView,
				);
			} else if (!isTextbook && disposer !== null) {
				disposer();
				disposer = null;
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
		"[ui-textbook-run] 工作台视图已注册（过程地图 + 对话台 + 自动打开）",
	);
}
