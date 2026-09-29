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
 *  2. WorkbenchView——唯一知道所有卡片的工作台主状态路由（内部实现，暂不拆）；当前书的
 *     事实由 `createBookProjection` 那份 snapshot 提供，这里只做路由与接线（票 04/ADR-0021）
 *  3. apply(ctx)——向宿主组合注册槽位
 *
 * 拆分纪律（见 AGENTS.md）：src/ui/ 各域文件互不 import 对方未导出的符号；
 * 跨域协作只走导出符号或 WorkbenchView 传 props。
 */

import {
	createElement,
	Fragment,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import { S } from "./ui/styles.js";
// 当前书投影（票 01/03 建的内部 module，Candidate 05 / ADR-0021）：六方法 interface，
// 拥有 projects/events/work/process 四条核心读通道、订阅拥有的 2 秒轮询、readiness 与
// 请求顺序。它无 React 依赖；WorkbenchView 只用 useSyncExternalStore 观察它。
import { createBookProjection } from "./workbench-projection.js";
// 工作台动作接缝（票 contract-actions/03，ADR-0017）：动作名与「能发 / 只读展示」这一
// 暴露事实**取自契约面动作目录**，调用点不再自己维护第二份清单。它无 React 依赖，也不碰
// payload / 用户确认 / 宿主形状——那些仍在下面各调用点原样发出。
import { uiCallable, uiReadOnly } from "./workbench-actions.js";
// 书级 UI 隔离壳（内部件，不进导出表面）：以 bookKey 为 key，切书/切会话时书级子树整体重挂。
import { BookSessionScope } from "./ui/book-session-scope.js";
// 领域规则与纯函数（rules）：本文件直接用的 + 为保持产物表面而再导出的；
// 双端共享领域件（素材角色、六阶段、范例章号）以 src/domain-rules.js 为源。
import {
	formatTime,
	// 票 stale-detection/01：「多久没动静」的共用判定 + 小助手血缘聚合（三路输入、一个门槛，
	// 活性行与状态卡消费同一份结果；口径与宿主同源，见 docs/reference/dsh-session-contracts.md）。
	deriveStallJudgment,
	indexSubagentDescendants,
	indexRunningSubagentActivity,
	// F22 那条旧规则已不成立（2026-09-22 票 12）：渲染处不再拿它门控阶段片，只为保住导出表面而再导出。
	mainProgressVisible,
	shouldForceBackToNow,
	chapterBadge,
	deriveDoneSet,
	splitParagraphs,
	paragraphHint,
	diffParagraphs,
	stageScopedProgressDetail,
	// 票 28：主 AI 上下文占用。口径与宿主输入区角标同一份数据（`contextPressure` 会话投影），
	// 读数口在 rules.js；读不到就 null，界面那一格不渲染（绝不显示 0%）。
	contextOccupancyPercent,
	// 票 ad-strip-occlusion/01 + workbench-scroll/01（同一个 8px、同一次改动）：工作台底边锚点
	// 取「输入区**容器**的 top」，不取输入元素自身的 top——宿主作曲家卡在输入元素上方还有
	// padding-top / 提示语 / 排队消息行。判据与真机证据见 rules.js 里这一节的注释。
	pickComposerAnchorTop,
	// 票 20：焦点区吸底决策条的判据（纯函数；「只在内容超出时出现 + 留出等于自身高度的下边距」）。
	stickyDecisionBar,
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
	artifactName,
	// 事件行行首的类型词（票 06）：只出客户端词表，不端服务端 label 上屏。
	eventHuman,
	// 吸底条那颗状态词（票 20）：经 `stepWord` 取，不在壳里另抄一份「轮到你」。
	stepWord,
} from "./ui/view-rules.js";
// 候选 06：「阶段 / 步」视图模型。WorkbenchView 用 useMemo([meta, processSegs]) 建**一次**
// projector，交给全览条 / 阶段页 / 阶段片接线 / 焦点解析共用——同一份 process/meta 只推导一次。
import { createStageStepProjector } from "./ui/stage-step-model.js";
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
	collapseConversionRuns,
	replayRowSummary,
	replayRowDetail,
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
	NarrowMainHint,
	FocusFooter,
	SocratopiaAd,
	foldKnowledgeMap,
} from "./ui/chapters-map.js";
// 确认卡。
import { ExploreConfirmCard, OutlineConfirmCard, EXPLORE_CONFIRM_ACCEPT_LABEL } from "./ui/confirm-cards.js";
// 顶栏、状态条与面板。
import {
	StatusStrip,
	ActivityLine,
	InterruptNote,
	// 票 30②：提示条的两档措辞住在 `panels.js`（组件自己的出口），这里只挑该显示哪一档。
	INTERRUPT_NOTE_TEXT,
	INTERRUPT_NOTE_TEXT_BREAKS_CHAPTER,
	AutoFollowAwaitNote,
	AutoFollowProgressNote,
	TopBar,
	StylePanel,
	IntervenePanel,
	PatternPanel,
} from "./ui/panels.js";
// 硬依赖（ADR-0010 决策 7）：右侧 Sidebar 的预览服务。解不到就不加载本插件——
// 绝不让「打开一份文件看看」退化成点了没反应的按钮（不写 ctx.get 兜底）。
//
// ⚠️ `uiSession` 是 2026-09-28 新增的硬依赖：工作台页签的**会话级门控**要读「当前会话是谁」，
// 而那个身份只在 `uiSession.current` 上（`sessions.list` 的快照里没有 `current` 字段）。
// 用谁就声明谁——它对应的客户端包 `@deepseek-ai/dsh-client-ui-session` 同步登记进
// `package.json` 的 `dsh.client.inject`。
export const inject = ["slots", "sessions", "uiSession", "sidebarRight"];

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

// 「当前书还没有可派生数据」时各字段的占位（票 04 / ADR-0021 决策 8/11）。
// 必须是**模块级同一个引用**：每帧新建空数组会让 `[meta, processSegs]` 这类依赖白重建、
// 让事件相关的 effect 每帧重跑。内容语义与从前逐字段 state 的初值完全一致。
const NO_EVENTS = Object.freeze([]);
const NO_SNAPSHOTS = Object.freeze([]);
const NO_PENDING_REVIEWS = Object.freeze([]);
const NO_CHAPTER_STATUS = Object.freeze([]);
const NO_GOLD_DRAFTS = Object.freeze([]);
const NO_WORK_FILES = Object.freeze([]);
const NO_SEGMENTS = Object.freeze([]);
// 建议/模式卡清单的空值：同上，必须是**模块级同一个引用**（它们由壳持有，WorkbenchView
// 只在异步结果里写回一个空值——每帧新建会让壳里依赖它们的 effect 白跑）。
const NO_SUGGESTIONS = Object.freeze([]);
const NO_PATTERNS = Object.freeze([]);

/**
 * 宿主**没给** `props.useSessionStatus` 时发的那一条诊断原文（票 06 · `.scratch/host-contract-reanchor/` 06）。
 *
 * 此前这里是**恒等兜底**（`props.useSessionPendingInteraction ?? selectNoPending`）：它把
 * 「宿主没给这一位」与「当前没有待回答」折成同一个 `null`。0.1.7 整枚删掉了
 * `useSessionPendingInteraction` 之后，这条兜底正好把产品级漂移吞成「恒为 null」——
 * 不报错、不崩、无告警，提问卡那次选择再也记不进书账本（而「hint 消失」在闸门那一侧
 * 同样没有声音）。**恒等兜底已拆**：现在两档是分开的，这一档发这一条，不再冒充另一档。
 *
 * 逐字是测试的钉子（`test-workbench-first-screen.mjs` 断「没给」时恰好发这一条、
 * 「给了但当前没有待回答」时一条都不发）。
 */
const SESSION_STATUS_PROP_MISSING =
	"[workbench] 宿主没有提供 props.useSessionStatus"
	+ "（@deepseek-ai/dsh-client-ui-session 声明的全局标准 prop，dsh 0.1.7）："
	+ "提问卡的「待回答」订阅在本次会话里是死的，用户在那张卡上的一次选择不会记进书账本。";

/**
 * 从宿主 `SessionStatusSnapshot` 里取当前会话那张**提问卡**；别的域一律不认。
 *
 * 形状逐字段随代码入库：`docs/reference/dsh-user-question-contracts.md`（dsh 0.1.7-rc.2）。
 * 两道 domain 口径写在这里，**不要**散进消费点：
 *  - 值是 `Map<SessionId, SessionStatus>`，每项只带**一个** `pendingInteraction`
 *    （宿主注释逐字：Highest-precedence domain request currently awaiting user interaction）
 *    ——0.1.7 之前那张表的值直接就是 `PendingQuestion`，现在多了一层 `SessionStatus`。
 *  - `pendingInteraction` 的域键表是**声明合并**的：0.1.7 起有 `question` 与
 *    `approval` 两个域。所以**只有 `kind === "question"` 才算提问卡**——`approval`
 *    （`PendingApproval`）既不许被误认，也不许因此抛异常。
 *    ⚠️ 别拿「有没有 `questions`」去分这两个域：`PendingApproval` **也有 `result`**
 *    （兑现一个 `'allowed-once' | 'rejected'` 字符串），`PendingQuestion.result` 兑现的
 *    才是答案批次——两者都有 `result`，**只有 `kind` 分得开**。拿错的后果是审批一兑现，
 *    `answer?.answers ?? []` 静默折成「一条都没勾上」，在书账本上留下一笔不是提问的记录。
 *  - `plan-review` 是 `question` 域**内部**的呈现意图（同一个 `PendingQuestion`，`kind` 取
 *    `'plan-review'`），**落账通路对它不成立**——两道守卫都只认 `kind === "question"`。
 *    这是**改动前就有的口径**（第二道守卫见下方 useEffect），本票没有改变它。
 */
function selectPendingQuestionCard(status, sessionId) {
	const pending = status?.get(sessionId)?.pendingInteraction;
	return pending?.kind === "question" ? pending : null;
}

/**
 * 已经落过账的宿主提问请求键（票 06）。
 *
 * `PendingQuestion.key` 是宿主给的不透明请求身份，**换一个请求必换 key**——这正好是
 * 「同一个提问只记一次」的天然主键。用模块级 Set（而不是组件 ref）是为了跨重挂载幂等：
 * 页签注销/重注册、换书重挂都不会把同一次作答再记一遍。
 * 增长有界：一条 = 用户答过的一次提问。
 */
const RECORDED_QUESTION_KEYS = new Set();

/**
 * 正在发、还没回来的一次作答（票 06）。与 `RECORDED_QUESTION_KEYS` 分开：
 * 那个是「**已经**记进账本了」，这个是「**正在**发」——只有前者才终结重试。
 */
const QUESTION_ANSWER_INFLIGHT = new Set();

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
	// ── 票 06：宿主提问/回答 → 书账本（一条通路，不靠 AI 自觉）────────────────────
	// `ask_user_question` 是**宿主的工具**、提问卡是**宿主的 UI**（`dsh-client-ui-user-questions`
	// 接管聊天编辑器，不是模态弹窗）。答案本来只留在宿主会话档案里，书账本里查不到——
	// 票 06 之前那一次就是这样（`保卫马克思` 拿到答案后连着 read/edit，一次 workbench_act 都没有）。
	//
	// 这里读的是 `@deepseek-ai/dsh-client-ui-session` 的**全局**标准 prop `useSessionStatus`
	// （`GlobalStandardProps`，所以 session 作用域的 `conversation.view` 槽位条目也拿得到）。
	// ⚠️ **0.1.7 换过入口**：那一版的 `useSessionPendingInteraction`（值是
	// `Map<SessionId, PendingQuestion>`）被整枚删掉了——工作台仍在读它，恒等兜底把症状吞成
	// 「恒为 null」，于是这条通路静默死了整整一个大版本。现在改读 0.1.7 的
	// `useSessionStatus` → `SessionStatus.pendingInteraction`，域判据见 `selectPendingQuestionCard`。
	// 形状逐字段随代码入库：`docs/reference/dsh-user-question-contracts.md`。
	//
	// **两档，分开读**（票面点名，别再合回去）：
	//  ① 宿主没给这一位 → `hostGaveSessionStatus === false`：不订阅、下面那条 effect 里
	//     `pendingQuestion` 是 null，但**另有一条看得见的诊断**（`SESSION_STATUS_PROP_MISSING`）。
	//  ② 宿主给了、当前没有待回答 → 正常 null，不发任何诊断。
	// ⚠️ 调用点只有一个，条件是「宿主给不给这枚 prop」，而它在一次挂载里恒定：真宿主上
	//    `useSessionStatus` 是 `GlobalStandardProps` 的一枚（与 `useSession` / `useSessions`
	//    同款，那两枚工作台从来没兜底过），换宿主版本要整页重载。恒等兜底换来的不是安全，
	//    是「把没给伪装成没有」——0.1.7 那次恒空就是这么发生的。
	const hostGaveSessionStatus = props.useSessionStatus !== undefined;
	const pendingQuestion = hostGaveSessionStatus
		? props.useSessionStatus((status) =>
				selectPendingQuestionCard(status, session),
			)
		: null;
	// ① 的诊断：挂在挂载后那一拍（渲染期发告警会跟着重渲刷屏），且**不**影响任何渲染输出。
	useEffect(() => {
		if (hostGaveSessionStatus) return;
		console.warn(SESSION_STATUS_PROP_MISSING);
	}, [hostGaveSessionStatus]);
	const subagentRuns = useMemo(
		() =>
			indexSubagentDescendants(sessionSummaries).get(session) ?? {
				count: 0,
				runningCount: 0,
			},
		[sessionSummaries, session],
	);
	// ④ 小助手「自称在跑、却已经多久没动静」（票 walkthrough-fixes/01 · 走查 P44 的接线半）。
	//    `subagentRuns` 数的是「记录还驻留」——宿主把驻留但空闲的也算在跑，于是**一个早就干完、
	//    结论一直没被消费的小助手会把自己的报警器一直按住**（实测按了 3 小时 34 分）。
	//    这一路读的是它名下那些自称在跑的里**最老的一次动静**，与 `subagentRuns` 同口径聚合，
	//    只多认一个 `updatedAt`。取不到（宿主没给这一位）时是 null，判定照旧走原来三路——
	//    宁可不判，也不拿猜出来的时刻去翻案（理由见 `deriveStallJudgment` 的注释）。
	const subagentActiveSince = useMemo(
		() => indexRunningSubagentActivity(sessionSummaries).get(session) ?? null,
		[sessionSummaries, session],
	);
	// ③ 主 AI 上下文占用（票 28 / 走查 P46）：宿主 `contextPressure` **会话投影**——
	//    与宿主输入区角标「上下文已用 51%」同一份数据（角标就是宿主 `contextOccupancy()` 的产物）。
	//    走 `useSessions` 的 `projectionValues`（`SessionSummary` 上**目录已登记**的那个可选位），
	//    所以这一行**不引入任何新宿主依赖**、不新开 client 包。
	//    ⚠️ 读不到就是 null（没报过用量 / 没适配器报容量 / 投影整个缺席）：下游那一格不渲染，
	//    **绝不显示 0%、绝不编一个百分比**。
	const contextPercent = contextOccupancyPercent(
		props.useSessions(
			(s) => s.byId[session]?.projectionValues?.contextPressure ?? null,
		),
	);
	// ── 当前书投影接线（票 04 / ADR-0021 决策 2/6/8/11）──────────────────────
	// 一个 session 一个 instance，切会话靠**渲染期建新 instance**完成：`useMemo` 在 session
	// 变的那一次 render 就换掉 instance，于是首帧直接读新 instance 的 snapshot——不等任何
	// 「先清空旧 state」的 effect（决策 6：首帧串书正是要消灭的东西）。
	const projection = useMemo(
		() => createBookProjection({ sessionId: session }),
		[session],
	);
	const subscribeBook = useCallback(
		(onStoreChange) => projection.subscribe(onStoreChange),
		[projection],
	);
	// 两次可观察 commit 之间 projection 返回同一个冻结引用，所以这里不需要缓存包装。
	const readBookSnapshot = useCallback(() => projection.snapshot(), [projection]);
	const book = useSyncExternalStore(subscribeBook, readBookSnapshot, readBookSnapshot);
	// 异步回调要读「当前身份 / 当前事件」时只许走这个 latest ref——它**指向同一份 snapshot**，
	// 不是第二份数据副本（决策 8）。
	const bookRef = useRef(book);
	bookRef.current = book;

	// 一份 snapshot 就是当前书的权威：下面每个字段都是**派生**，父层不再逐字段存第二份
	// （`pendingStage/pendingGate/pendingReviews` 直接取 `/events` 顶层这份规范化权威）。
	const coreData = book.core.data;
	const meta = coreData === null ? null : coreData.meta;
	const events = coreData === null ? NO_EVENTS : coreData.events;
	const gate = coreData === null ? null : coreData.gate;
	const snapshots = coreData === null ? NO_SNAPSHOTS : coreData.snapshots;
	const bookDir = coreData === null ? null : coreData.bookDir;
	const knowledgeMapText = coreData === null ? null : coreData.knowledgeMap;
	// 章节安排原文（`work/outline.md`，内容是机器 JSON）：判 `'inline'`、不开右栏
	// （票 pipeline-wiring-gaps/09），人读形态是阶段页第 3 阶段那张就地折叠清单。
	const outlineText = coreData === null ? null : coreData.outline;
	const pendingStageView = coreData === null ? null : coreData.pending.stage;
	const pendingGateView = coreData === null ? null : coreData.pending.gate;
	const pendingReviews = coreData === null ? NO_PENDING_REVIEWS : coreData.pending.reviews;
	const exploreSummary = coreData === null ? null : coreData.exploreSummary;
	const chapterStatus = coreData === null ? NO_CHAPTER_STATUS : coreData.chapterStatus;
	const goldDrafts = coreData === null ? NO_GOLD_DRAFTS : coreData.goldDrafts;
	const goldDraftVersion = coreData === null ? 1 : coreData.goldDraftVersion;
	// 产物清单与分段是两条旁支。它们各有**一句不能省的读法**（ADR-0021 决策 11/15/16）：
	//   ① **不从空数组猜**：成功之前一律「不知道」——`data === null` 才是「还没到」，
	//      空数组是「到了，确实没有」。`work.known` 只在 unknown/error 时为 false，
	//      所以 **ready 与 stale 都算已知**：stale 的 last-known 清单照旧可用（决策 16）。
	//   ② stale/error 时投影把 last-known data 重新深冻结成**新引用**（内容一模一样——
	//      决策 15 明说它不是新的 server truth）。所以凡是「按内容判断」的判据都不能跟着
	//      这个新引用走；下面那个 process commit token 就是这么处理的。
	const workFiles = book.work.data === null ? NO_WORK_FILES : book.work.data.files;
	const workFilesReady = book.work.known;
	const processSegs =
		book.process.data === null ? NO_SEGMENTS : book.process.data.segments;
	// 身份只有这一处：显示与动作请求体都读它（决策 7/8），Workbench 不再自持 activeId/ref。
	const projectId = book.projectId;
	const bookKey = book.bookKey;
	// ── process commit token（决策 15 / spec §14）──────────────────────────
	// PhasePage 的「我正在做」乐观标记**只由最近一次成功、仍属当前身份、且规范化内容确实
	// 变化的 process commit 清除**。三条各有一格，缺一条就会提前退场：
	//   · 身份：按 bookKey 归零——别的书的提交碰不到这一份（壳也按 bookKey 重挂）。
	//   · 成功：stale/error 保留的是 last-known，不是新的 server truth，不冒充。
	//   · 内容真变了：投影侧成功响应经规范化后没变就不换引用、不通知（决策 5），这里再按
	//     **内容**签一次名，连「失败之后立刻恢复成同一份内容」那种也不推进 token。
	// 它只喂 PhasePage 的一个 `useEffect` 依赖，不参与任何派生渲染——所以新书在它自己的
	// 第一次 process 提交之前拿着旧值也无害（那本壳的 redoKey 本来就是 null）。
	// ⚠️ 渲染期写 ref 是本文件既有的 latest-ref 写法（上面 `bookRef.current = book` 同款）：
	//    同一次渲染里写完即读，值完全由这份 snapshot 决定，重渲与重放都是幂等的。
	const processCommitRef = useRef({ bookKey: null, data: null, token: null });
	if (processCommitRef.current.bookKey !== bookKey) {
		processCommitRef.current = { bookKey, data: null, token: null };
	}
	if (
		book.process.status === "ready" &&
		book.process.data !== null &&
		book.process.data !== processCommitRef.current.data
	) {
		processCommitRef.current = {
			bookKey,
			data: book.process.data,
			token: JSON.stringify(book.process.data),
		};
	}
	const processToken = processCommitRef.current.token;

	// 首屏两句话的数据来源是 readiness（决策 11/16），文案一字未改：
	// 无当前书时由 projects 承担发现 readiness，有当前书时由 core 承担；core 停在 unknown
	// 是「还在读」而不是「读失败了」——这正是旧实现把 core 伪造成空书的那处。
	// ⚠️ 「书单非空而 projectId 仍为 null」有两种处境，判据是 generation（顶层 identity 的
	// 第三个字段，只在接管/清空/退订时前进）：
	//   · generation === 0 → **发现过程中的中间帧**（清单已 commit、身份还没落）。
	//     认成「无书」会在那几毫秒里闪出向导、并白发一次 `wizard-suggest`——从前
	//     `setProjects` / `setActiveId` 同一批落地，从来不会有这个中间态。
	//   · generation > 0  → 落定态：刚失效的那本被排除、或清单里的书都读不到
	//     （not-found/not-owned 走同一条失效路径）。这时按 ADR-0021 决策 13/16 回空态。
	const pickingFirstBook =
		book.projectsStatus === "ready" &&
		book.projects.length > 0 &&
		projectId === null &&
		book.generation === 0;
	const loading =
		projectId === null
			? book.projectsStatus === "unknown" || pickingFirstBook
			: book.core.status === "unknown";
	// 「打开失败」只在**首次** core/projects 失败时可见（status === 'error'）；已有过成功
	// 读取之后的失败一律是 stale，静默（普通轮询抖动不盖满错误条）。**分界判据是
	// `known`**：`error` 恒伴随 `known === false`，`stale` 恒伴随 `known === true` 且保留
	// last-known——所以这一行读 status 就够，不必再问 data 空不空（决策 11/16）。
	// not-found／not-owned 不落这里：它们让身份失效并回到空态，不显示读取错误（决策 16）。
	// work/process 的 `error` 也不落这里：旁支失败不新增错误条、不新增重试入口（决策 16）。
	const readStatus = projectId === null ? book.projectsStatus : book.core.status;
	const readError = projectId === null ? book.projectsError : book.core.error;
	const loadError = readStatus === "error" ? (readError?.message ?? null) : null;

	// ③ 账本新鲜度（`meta.updatedAt`＝账本最后一次写入的时刻）＋ 门槛：合成唯一那份判定。
	const stall = deriveStallJudgment({
		mainAiRunning,
		subagentRunningCount: subagentRuns.runningCount,
		subagentActiveSince,
		lastWriteAt: meta?.updatedAt,
	});
	// ── 书级 UI state 归位（票 05 / ADR-0021 决策 9 / spec §8）─────────────────
	// 上一批 state（`viewPhase` / `browsing` / `showHistory` / `gateOpen` / 三个书级面板开关 /
	// 模式库四件 / 两条横幅 / 不打断提示条 / 建议两件 / `deletingId` / 动作级 `error`+`busy`
	// 与两个 ref）连同它们各自的 effect 一起搬进了 `BookSessionScope`：那是**以 bookKey
	// 为 key 的重挂边界**，于是「切会话/切书归零」不再靠一条 `[session]` effect 去清，而是
	// 由 key 驱动（同一本书内部子组件自己的展开/输入/选中也一视同仁地拿到隔离）。
	//
	// 壳在**子组件**里渲染，所以它先于本组件的 effect 把自己那批 setter 句柄发布到这里。
	// 壳不产生任何 DOM 节点，也不拥有业务动作（ADR-0021 决策 9）。
	const bookUiRef = useRef(null);
	// 留在壳外的**全局**状态（切书/切会话都不该跟着重挂，用户故事 31 / 32）：MinerU 设置
	// 三件、对话台两件与两个 ref、根高度与外层布局、宿主状态。
	const [mineruSet, setMineruSet] = useState(true);
	const [mineruToken, setMineruToken] = useState("");
	// F20：已设置时的「重新设置」展开态——点开输入框、保存成功后回到掩码态。
	const [mineruResetOpen, setMineruResetOpen] = useState(false);
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
	// 票 26（P27 ＋ P37）：主区（工作台根容器）的宽 + 它右边缘离视口右边多远——只给
	// `NarrowMainHint` 判断「右栏是不是把这里挤窄了」。与根高度同一趟量、同一个 400ms 轮询，
	// **只读几何、不动任何布局**：不引 min-width、不引浮层（那个 min-width 方案已被走查作者撤回）。
	const [mainBox, setMainBox] = useState({ w: null, rightGap: null });
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
			// 票 26：主区宽度 ＋ 右边缘到视口右边的距离（右栏开着时右边被占一大块）。
			// 量不到（页签没激活、盒子还没长出来）就交 null——提示层据此不显示，不猜。
			const vw = typeof window !== "undefined" ? window.innerWidth || 0 : 0;
			const nextW = Math.round(rect.width);
			const nextGap = vw > 0 ? Math.round(vw - rect.right) : null;
			setMainBox((prev) =>
				prev.w === nextW && prev.rightGap === nextGap ? prev : { w: nextW, rightGap: nextGap },
			);
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
	// 深改用的当前浏览分段 key（步清单点一步由 onPickStep 接线）**归壳所有**了——
	// 那是书级导航/回看态，切书必须归零，所以和 `viewPhase` 一起在 `BookSessionScope` 里。
	// 分段清单本身是旁支，由 projection 的 `process` 资源派生（见上面 `processSegs`），不存第二份。
	const sessionRef = useRef(session);
	sessionRef.current = session;

	// 焦点区吸底决策条（走查 P3 / 票 20）：确认点上的推进键埋在几千字报告底下（真机量到要滚过
	// 约 2.9 个视口高度），补一条**只在内容超出时**出现的吸底条，就近再给一次那颗推进键。
	// 判据是 `stickyDecisionBar`（`src/ui/rules.js` 的纯函数，可独立测）；这里只负责**量**。
	// 无 DOM 的渲染环境（冒烟/单测的 react-test-renderer）量到 null 就原样跳过，不抛、不猜。
	const focusScrollRef = useRef(null);
	const stickyBarRef = useRef(null);
	const [focusOverflow, setFocusOverflow] = useState(false);
	const [stickyBarH, setStickyBarH] = useState(0);
	// 不带依赖数组：每次重渲后重量一次（内容随轮询变长/变短），值不变就不写 state、不重画。
	useEffect(() => {
		const el = focusScrollRef.current;
		if (el === null || typeof el.getBoundingClientRect !== "function") return undefined;
		const measure = () => {
			const overflow = el.scrollHeight > el.clientHeight;
			setFocusOverflow((prev) => (prev === overflow ? prev : overflow));
			const bar = stickyBarRef.current;
			const height =
				bar === null || typeof bar.getBoundingClientRect !== "function"
					? 0
					: Math.round(bar.getBoundingClientRect().height);
			setStickyBarH((prev) => (prev === height ? prev : height));
		};
		measure();
		// 视口改大小那条路也要重量（此时不一定有重渲）。
		if (typeof window === "undefined" || typeof window.addEventListener !== "function")
			return undefined;
		window.addEventListener("resize", measure);
		return () => window.removeEventListener("resize", measure);
	});

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

	// 已完成步骤的结果文件列表（源探查/章节/成书等）由 projection 的 `work` 资源读；
	// 分段清单（`/textbook/process`，含影响预告与撤销窗口）由 `process` 资源读。两者都随
	// events core 一起刷新、独立 settle，本组件不再有各自的 setter 与轮询（ADR-0021 决策 1/5）。
	// ⚠️ 票 stale-detection/01：`/textbook/process` 的响应**不再**带子代理计数（那小助手状态改读
	// 宿主推送的会话摘要了，见组件里那段注释）；端点本身留着，它还返回这份分段清单。

	// ── 「打开一份文件看看」的唯一收口（ADR-0010 决策 1/4）──────────────────────
	// 全部入口（分段清单、阶段片、历史事件行、材料转换内容、探查报告、章节卡
	// 「看看这章」、交付/终检的成品）都走这一个函数；按钮位置与文案一律不动。
	//
	// 两条路按产物判据分岔（domain-rules.productOpenMode，与后端路由同一份清单）：
	//  - 'preview'（有正文的产物）→ DSH 右栏预览：地址用**工作区相对路径**拼，只读、
	//    不进模型上下文（用户在这里读到的东西永不进入模型请求）。
	//  - 'inline'（knowledge-map.json / outline.md）→ 不在这里开：它们的内容是机器 JSON，
	//    人读形态由阶段页 / 确认卡**就地**折叠展示（`KnowledgeMapBlock` / `ExploreConfirmCard`
	//    / `OutlineBlock` / `OutlineConfirmCard`），工作台不再有第二个查看壳。
	//    ⚠️ `work/outline.md`（章节安排）也在这一族（票 pipeline-wiring-gaps/09）：名字带 `.md`、
	//    内容是 `{"chapters":[…]}`，与 `work/audit-NN.md` 同一条理由判掉右栏通道。
	//  - 'machine'（机器产物/源 PDF）→ 不给人读，什么都不开。
	const openInSidebar = (rel) => {
		const bookUi = bookUiRef.current;
		bookUi?.setError(null);
		try {
			props.openFileInSidebar(bookFileAddress(session, cwd, bookDir, rel));
		} catch (err) {
			// 预览服务解不到时插件根本不会加载（硬依赖）；这里兜的是地址/导航被拒
			// （例如打开了目录地址）——把原因摆到界面上，不留「点了没反应」。
			// 票 10（判定三 #2）：报错里原来印 `${rel}`（`work/…` 机器路径）；名字走 `artifactName`
			// （CONTEXT.md「产物名」：相对路径原文连提示一起不上屏）。
			bookUi?.setError(
				`打开「${artifactName(rel)}」失败：${String(err instanceof Error ? err.message : err)}`,
			);
		}
	};

	const viewWork = (file) => {
		if (workEntryAction(file?.path) === "sidebar") openInSidebar(file.path);
	};

	// ── 取数生命周期：轮询与首屏刷新都由 projection 拥有 ──────────────────────
	// 2 秒轮询**不再**由本组件起定时器（ADR-0021 决策 5/41）：订阅数决定它的启停，最后一个
	// 订阅者离开就停表并推进 generation。因此这里既没有第二个 `setInterval`，也没有第二套
	// 「清空 + 全量加载」编排——切会话只是换掉一个 instance（上面 `useMemo([session])`）。
	//
	// 首屏这一次 `refresh()` 是**唯一**的主动读取：它带上刚建好的 instance，在无当前书时
	// 读 projects 并按既有发现顺序接管，有当前书时读它的 core。完成点＝core commit（决策 12），
	// 慢的 work/process 旁支不延长它。
	useEffect(() => {
		void projection.refresh();
	}, [projection]);

	// 切会话时的状态归零现在**由 bookKey 驱动的重挂完成**（票 05 / ADR-0021 决策 9）：
	// 那条 `[session]` effect（清 `error` / `browsing` / `progressSeqRef` / `awaitingSeenRef`）
	// 连同它清的那批 state 一起搬进了 `BookSessionScope`，改由 key 决定何时重来。
	// 顺带修掉从前的半个洞：它按 `sessionId` 归零，而**同一会话内换一本书**（建档成功、删书后
	// 改按另一本）旧实现不清；按 bookKey 重挂两种情形都归零（用户故事 17 / 8）。

	// `/textbook/settings`（MinerU Token）是**全局配置**，不属于当前书投影的四条通道：仍是
	// 这里自己的一次性读取，且刻意**不**串在首屏加载标记上——从前把它串进同一条 try，
	// 那条请求一旦不返回就会让工作台永久停在「加载中…」。
	useEffect(() => {
		let alive = true;
		void fetchJson("/textbook/settings")
			.then((settings) => {
				if (alive) setMineruSet(settings.settings?.mineruTokenSet === true);
			})
			.catch(() => {
				/* 读不到设置不影响工作台（Token 卡显示未设置态） */
			});
		return () => {
			alive = false;
		};
	}, [session]);

	// 无书进向导时：请求 AI 建议（人类只做确认）。建议清单是**书级 state**（在壳里），但请求
	// 本身是业务动作，仍归这里（ADR-0021 决策 9：壳不做 owner）。
	// 依赖里带 bookKey：换一本/换一个会话时旧的那份壳已经卸载，`alive` 随之作废并重新问一次
	// ——无书会话 A→B 时 A 的建议不会落进 B 的向导（用户故事 5）。
	useEffect(() => {
		if (meta !== null || loading) return undefined;
		const bookUi = bookUiRef.current;
		// 非造书会话（门控早退那一支）压根没挂壳，向导屏不在树上，没什么可问的。
		if (bookUi === null) return undefined;
		// 建议清单是书级 state（归壳所有）：离开这一身份之后回来的那份建议不该写进来。
		const guard = projection.capture();
		let alive = true;
		bookUi.setSuggestLoading(true);
		void fetchJson("/textbook/action", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				action: uiCallable("wizard-suggest"),
				session: sessionRef.current,
			}),
		})
			.then((json) => {
				if (alive && projection.isCurrent(guard))
					bookUi.setSuggestions(json.suggestions ?? NO_SUGGESTIONS);
			})
			.catch(() => {
				if (alive && projection.isCurrent(guard)) bookUi.setSuggestions(NO_SUGGESTIONS);
			})
			.finally(() => {
				if (alive && projection.isCurrent(guard)) bookUi.setSuggestLoading(false);
			});
		return () => {
			alive = false;
		};
	}, [meta, loading, bookKey]);

	// ── 业务动作（ADR-0021 决策 9：仍归 WorkbenchView，壳只提供书级 state 的入口）──
	// 下面每个动作在**进入时**捕获一次壳句柄 `bookUi`，之后所有写入都走它。壳按 bookKey
	// 重挂后，旧句柄所在的组件早已卸载——**上一本书的迟到结果落回上一份壳、被 React 直接
	// 丢弃**，不会写进新身份（用户故事 15 / 16）。这样不用第二份状态，也不用额外的清空 effect。
	//
	// ── 显式身份判据（票 06 / ADR-0021 决策 14）────────────────────────────
	// 上面那条是**结构兜底**（「反正那棵子树已经卸载了」），本票把它换成**显式判据**：
	// 每个书级 await 之前 `capture()` 记下「此刻是谁」（session + project + generation +
	// bookKey），await 回来后先问 `isCurrent(guard)`——不是当前身份就整段丢弃：不 refresh、
	// 不写当前书 UI、busy finally 不碰新身份的 busy、toast 不出。
	// 投影只提供这两个**同步**方法（决策 14），动作请求与业务成功语义仍归本组件：
	// `capture`/`isCurrent` 不接管任何动作协议，也不判断「这次动作算不算成功」。
	const isBookCurrent = (guard) => projection.isCurrent(guard);

	// 「✨ AI 建议」与「换一批」：带学习者的背景重新请求建议。
	const requestSuggest = async (hintText) => {
		const guard = projection.capture();
		const bookUi = bookUiRef.current;
		bookUi?.setSuggestLoading(true);
		try {
			const json = await fetchJson("/textbook/action", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({
					action: uiCallable("wizard-suggest"),
					session: sessionRef.current,
					hint: hintText || undefined,
				}),
			});
			if (!isBookCurrent(guard)) return;
			bookUi?.setSuggestions(json.suggestions ?? NO_SUGGESTIONS);
		} catch (err) {
			throw new Error(err instanceof Error ? err.message : String(err));
		} finally {
			if (isBookCurrent(guard)) bookUi?.setSuggestLoading(false);
		}
	};

	const postAction = async (body) => {
		// 规范动作名与「工作台可调用」这一暴露事实由契约面动作目录说了算（票 03）：
		// 这一行是**全部工作台动作的漏斗**——本文件的调用点与 `src/ui/**` 经 props 递下来的
		// 调用都走它，所以「按钮指向目录里没有 / 不对工作台开放的动作」在这里就发不出去，
		// 而不是把一个 `undefined` 悄悄填进请求体。认不出来的名字在这里响着失败（开发错误）。
		const action = uiCallable(body.action);
		const guard = projection.capture();
		const bookUi = bookUiRef.current;
		bookUi?.setBusy(true);
		try {
			const json = await fetchJson("/textbook/action", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({
					project: projectId,
					session: sessionRef.current,
					...body,
					// 写回目录给的规范名：发出去的那一份与目录是同一条身份。
					action,
				}),
			});
			// 旧身份的动作：不刷新、不写当前书 UI、不出提示条，连回包都不往下交
			// （交下去 `book-create` 的 `.then` 会拿它去 `selectProject`，把已经离开的那本书
			// 又接管回来）。失败返回 null 的语义照旧——「不是当前身份的这次结果」同样不是结果。
			if (!isBookCurrent(guard)) return null;
			// 有当前书时，动作成功统一走 projection 的刷新入口（ADR-0021 决策 14）：
			// 事件/产物/分段都从这一份 snapshot 重新来，父层没有第二套 full-load 编排。
			// 无活动项目（如 book-create 之前）时不需要刷新事件。
			if (guard.projectId !== null) await projection.refresh();
			bookUi?.setError(null);
			// 不打断提示条：写完整本阶段（phase 5）里「值得回一句」的提交成功后，焦点区顶部滑入。
			//
			// 票 30②把触发门打开成两处：
			//  ① 动作名单**漏了一支**：段落三键发的是 `gold-opinion`，不在名单里——它**不是**动作
			//     身份问题（那一格仍由 `uiCallable` 从目录过门而来），只是「哪几类提交值得弹提示条」
			//     这条界面规则少写了一个名字。
			//  ② 状态判据原先是 `meta?.status === "running"`，而 `meta` 是**动作发出前**那份快照：
			//     过目态点段落三键时它是 `awaiting-chapters-review`，这条判据当场不成立——门被焊死在
			//     「只在迁移之后才开」。改成按**提交那一刻**的事实判：过目态与铺章途中都值得回一句，
			//     只是两档措辞不同（过目态下恰恰就是打断了正在写的那一章，说「不打断」是说反话）。
			// ⚠️ 那三个名字刻意留字面量且**不并进同一个数组**：契约动作目录那条静态闸把这**一串**
			//   字面量登记成了豁免（绑「文件 + 这串名字 + 写法」），并进去会让它当场红。`gold-opinion`
			//   因此走单独一次比较——它是一个名字，不是第二份动作名清单。
			const wasChaptersReview = meta?.status === "awaiting-chapters-review";
			if (
				json !== null &&
				(["style-note", "intervene", "review"].includes(action) ||
					action === "gold-opinion") &&
				meta?.phase === 5 &&
				(wasChaptersReview || meta?.status === "running")
			) {
				bookUi?.setNoteToast(
					wasChaptersReview
						? INTERRUPT_NOTE_TEXT_BREAKS_CHAPTER
						: INTERRUPT_NOTE_TEXT,
				);
			}
			return json;
		} catch (err) {
			if (isBookCurrent(guard))
				bookUi?.setError(String(err instanceof Error ? err.message : err));
			return null;
		} finally {
			// busy finally 与 toast 分开判：旧动作的 finally 不该把**新身份**那条正在飞的
			// 动作的 busy 清掉（旧壳句柄早已卸载，这里连那一层结构兜底都不必依赖）。
			if (isBookCurrent(guard)) bookUi?.setBusy(false);
		}
	};

	// ── 票 06 ②：宿主提问卡的作答 → 书账本 ────────────────────────────────────
	// 通路：宿主 `user-questions/request` → PendingQuestion 经宿主那一侧的
	// `registerPendingInteraction` 发布 → 出现在 `useSessionStatus(session).pendingInteraction`
	// （域键 `question`）→ 这里的 `result` promise 在**用户提交答案时**兑现
	// → POST `/textbook/question` → 服务端 `appendEvent` 落一条账本事件。
	// 「收到问题」本身不落账：宿主在提问时就把这次请求挂在会话档案里了，书账本要记的是
	// **那次选择**（票面 §已核实：拿到答案后 AI 连着改稿，一次 workbench_act 都没有）。
	// ⚠️ 失败只记一条控制台告警、绝不打断工作台：这条通路是补记，不是主链路。
	//
	// ⚠️ **记到哪本书必须读「当下」那一份**（`bookRef.current.projectId`），不是挂载时那份
	//    `projectId`：提问卡的答案完全可能**先于**工作台接管这本书兑现（刚开页签、切会话在途）。
	//    那时 `projectId` 仍是 null——发了就是 400，而答案已经过去了，**这一笔记不下来**。
	//    所以这里是「不发、也不记账」，等 `projectId` 变化把本条 effect 再带起来重试。
	//    （`result` 是已兑现的 promise，再挂一次 `.then` 会**再回调一次**，正是我们要的重试。）
	const recordQuestionAnswer = (pending, answer) => {
		const key = pending.key;
		if (RECORDED_QUESTION_KEYS.has(key) || QUESTION_ANSWER_INFLIGHT.has(key)) return;
		const project = bookRef.current.projectId;
		if (project === null) return;
		QUESTION_ANSWER_INFLIGHT.add(key);
		void fetchJson(`/textbook/question?${sess()}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				project,
				session: sessionRef.current,
				key,
				questions: pending.questions ?? [],
				answers: answer?.answers ?? [],
			}),
		}).then(
			// 只有真落进账本了才算「这一次记过了」：失败不记账，于是下次依赖变化还会重试。
			() => {
				RECORDED_QUESTION_KEYS.add(key);
			},
			(err) => {
				console.warn("[workbench] 提问卡的作答没能落进书账本", err);
			},
		).finally(() => {
			QUESTION_ANSWER_INFLIGHT.delete(key);
		});
	};

	useEffect(() => {
		const pending = pendingQuestion;
		if (pending === null || typeof pending !== "object") return;
		// 第二道 domain 守卫（第一道在 `selectPendingQuestionCard` 上，那里才是宿主契约的边界）。
		// 0.1.7 起 `pendingInteraction` 有 `approval` 域（`PendingApproval`）——它**也带
		// `result`**（兑现的是 `'allowed-once' | 'rejected'`，不是答案批次），所以这里既不按
		// 「有没有 questions/result」判、也只按 `kind` 判：它不许被当成提问卡落账，也不许因此抛异常。
		// 两道都留着是有意的：这是记账通路（钱进不进账本那一侧），少一道就少一层。
		// ⚠️ 这道守卫**连 `plan-review` 一起挡**（`kind` 取 `'plan-review'`）——改动前就是这样，
		// 本票没有改动这条口径，两处注释都按它写。
		if (pending.kind !== "question") return;
		const key = pending.key;
		if (typeof key !== "string" || key === "" || RECORDED_QUESTION_KEYS.has(key)) return;
		const result = pending.result;
		if (result === undefined || typeof result.then !== "function") return;
		void result.then(
			(answer) => recordQuestionAnswer(pending, answer),
			// 用户关掉提问卡（`ASK_CANCELLED`）或该请求被委派给别人：算「处理过一次」，
			// 不许在同一次请求上反复重试。
			() => {
				RECORDED_QUESTION_KEYS.add(key);
			},
		);
		// 依赖里**没有** fetchJson/postAction：它们每帧新建，进依赖会让这条 effect 每帧重跑。
		// 真正要跟的是「当前是谁在等」与「当前管着哪本书」——后者是上面那个重试的触发器。
	}, [pendingQuestion, projectId, session]);

	const deleteBook = (id) => {
		const guard = projection.capture();
		const bookUi = bookUiRef.current;
		bookUi?.setBusy(true);
		void fetchJson("/textbook/action", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				action: uiCallable("book-delete"),
				project: id,
				session: sessionRef.current,
				confirm: true,
			}),
		})
			.then(async () => {
				if (!isBookCurrent(guard)) return null;
				// 删掉的可能就是当前书：成功的一刻**先把工作台从这本书上摘下来**，再重新发现。
				//
				// 为什么不用 `refresh()` 顶掉（旧实现那条绕路）：`refresh()` 会先拿被删掉的那本 id
				// 去读一次 core，等服务端回 404 才走 not-found 失效路径。那中间这一轮里工作台
				// 仍然占着已删的书（正文/事件/产物/分段都还在树上），而且白白多发一次注定失败的
				// 读取。`selectProject(null)` 是同一件事的**清空**语义：清 commit 之后立即 resolve，
				// 不等重新发现，也一个请求都不发（ADR-0021 决策 4/13）。
				//
				// ⚠️ 确认态（`deletingId`）**不再在这里清**：它归 `BookSessionScope` 所有，清身份
				// 改了 bookKey → 壳整棵重挂 → 确认态自然归零（票 05 决策 9 的那条边界）。原来那句
				// `setDeletingId(null)` 会在清身份**之前**先提交一帧——那一帧里已删的书还整本地
				// 摊在树上，正是本票要消灭的「删了却还占着工作台」。
				await projection.selectProject(null);
				// 随后这一次 `refresh()` 才是重新发现：无当前书时它只读**本会话**的 projects，
				// 按既有顺序接管第一本合法的；书单为空就停在空态/向导。
				// 这里不按错误文案子串猜身份、不在父层判「这本书还在不在」。
				return projection.refresh();
			})
			.catch((err) => {
				if (isBookCurrent(guard))
					bookUi?.setError(String(err instanceof Error ? err.message : err));
			})
			.finally(() => {
				// 清身份已推进 generation，这个守卫从这一刻起恒为 false——这是**有意的**：
				// 新身份（重新发现到的那本，或无书向导）有自己的 busy，旧的收尾不许去碰它；
				// 被清掉的那份壳早已随 bookKey 卸载，busy 也就随之归零。
				if (isBookCurrent(guard)) bookUi?.setBusy(false);
			});
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
			bookUiRef.current?.setError("还没有可回退的快照");
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
		// 守卫住在 `postAction` 里：不是当前身份的那次回包交下来是 `null`，于是这里
		// 不会再拿一个已经离开的身份去 `selectProject`（票 04 定的这条接线本身不动）。
		void postAction({ action: "book-create", ...form }).then((json) => {
			if (json !== null && json.project !== undefined) {
				// 创建成功：立即切换到新书（修复"建完没反应、以为失败又点一次"的问题）。
				// 身份只此一份——接管新书就是让 projection 建立这个身份并读它的 core，
				// 父层不再另存一份 activeId（ADR-0021 决策 7/8）。
				void projection.selectProject(json.project);
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
		// 上传本身**照旧发**：目标是进入时那本书的地址（`projectId` 取自这次 render），
		// 服务端已经收下的材料不会因为用户后来切了会话就不该落盘。守卫只管**之后**那一步：
		// 刷新与它的结果不许落到已经不在这儿的身份上。
		const guard = projection.capture();
		const bytes = await file.arrayBuffer();
		const url = `/textbook/upload?${sess()}&project=${encodeURIComponent(projectId)}&name=${encodeURIComponent(file.name)}&role=${encodeURIComponent(role)}`;
		const res = await fetch(url, { method: "POST", body: bytes });
		let json = null;
		try {
			json = await res.json();
		} catch {
			json = null;
		}
		if (!res.ok)
			throw new Error((json !== null && json.error) || `HTTP ${res.status}`);
		// 上传成功就是成功：身份已经换了也一样**不抛**——抛了会被上传区记成「上传失败」，
		// 待传清单留着不空，用户重传整批，服务端幂等前就会多出重复条目。
		if (!isBookCurrent(guard)) return;
		try {
			// 上传成功后走**同一个**刷新入口（ADR-0021 决策 14）。
			await projection.refresh();
		} catch {
			// 服务端已落盘，刷新失败（如瞬时 Failed to fetch）不当作上传失败，
			// 否则 pending 不清空、用户重传整批 → 后端幂等前会产生重复条目。
		}
	};

	// AI 识别每本 PDF 的角色（一次请求识别全部）。
	const identifyRoles = async (files) => {
		const guard = projection.capture();
		const json = await fetchJson("/textbook/action", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				action: uiCallable("suggest-roles"),
				session: sessionRef.current,
				files,
			}),
		});
		// 旧身份的角色识别结果不往当前书送（退回空清单＝保留规则猜测，与识别失败同一条路）。
		if (!isBookCurrent(guard)) return [];
		return json.roles ?? [];
	};

	const convert = () => {
		void postAction({ action: "convert-start" });
	};
	const resume = () => {
		void postAction({ action: "resume" });
	};
	// 暂停（Task 17 顶栏 ⏸）：记账 → 取消主 AI，绝不 followup（后端契约）。
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
	// 票 20（走查 P3）：吸底决策条出不出、给滚动区留多少下边距——判据是纯函数
	// `stickyDecisionBar`（`src/ui/rules.js`，可独立测）。**只给「读材料挑重点」那个确认点**：
	// 票面「选定主决策按钮是哪一个」定的就是确认点卡上那颗推进键，同一动作在别的阶段另有落点
	// 形态，本票不顺手改全部。量不到（无 DOM 的测试环境 `focusScrollRef.current` 为 null）时
	// 判据返回「不出」，不猜。
	const stickyBox = stickyDecisionBar({
		enabled: meta !== null && focusCardKey(meta, gate) === "explore",
		scrollHeight: focusScrollRef.current?.scrollHeight ?? 0,
		clientHeight: focusScrollRef.current?.clientHeight ?? 0,
		barHeight: stickyBarH,
	});
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
	// 票 21 · P4：「🔑 还差一步：MinerU Token」这张红卡的清除判据**跟着「转换已成功」走**，
	// 不再跟着一份开机快照走（`/textbook/settings` 的 `useEffect` 依赖只有 `[session]`，会话内
	// 从不刷新 ⇒ 卡在转换成功后还挂约 25 分钟，只能靠刷新页面消失）。
	//
	// 「已成功」的口径**与界面既有的转换终态判据同源**，不另写第三份，也不新增任何采集：
	//   ① 已经离开材料准备（`meta.phase !== 1`）——焦点区主卡路由 `focusCardKey` 的同一句
	//      （`phase === 1` 才是上传卡）；服务端 `runPhase1` 只有在**全部材料都转完**时才
	//      `advance(1 → 2)`，所以「离开阶段一」本身就是「转换成功过」的证明。
	//   ② 此刻不在转（`meta.converting !== true`）——转换活动行
	//      `materialConversionActivityText` 的同一句早退。
	// ⚠️ 「已发起转换」**不算成功**：正在转时 `phase` 仍是 1，转换没发起时也还是 1，两种情形
	// 都落不到 ① 上（反例见 test-convert-progress-row.mjs）。
	const conversionSettled =
		meta !== null && (meta.phase ?? 1) > 1 && meta.converting !== true;
	// 候选 06：「阶段 / 步」只推导一次。`useMemo([meta, processSegs])` —— core / process 每次成功
	// commit 都会换新的 `meta` 对象与新的 `processSegs` 数组，对象身份正是「换了一份快照」的
	// 现有信号（两者现在都由同一份 snapshot 派生，所以这个信号只随真实 commit 变）。
	// `workFiles` **不进** projector（阶段/步产物读 `seg.artifacts`），它同样来自 snapshot。
	const stageStepProjector = useMemo(
		() => createStageStepProjector({ meta, segments: processSegs }),
		[meta, processSegs],
	);
	const stageStepOverview = stageStepProjector.project({ kind: "overview" });

	const showWizardForm = meta === null && !loading;

	// 错误条那句话：动作级错误（壳里那份 `error`）优先，没有才轮首屏的读取错误
	// （`loadError` 从 readiness 派生）。两者共用**同一句** `⚠️ …`，位置与从前一致。
	const visibleError = (ui) => (ui.error !== null ? ui.error : loadError);
	// 顶栏介入工具条：风格线/留言清单（旧账本 ?? [] 兜底）与面板开关/暂停入口。
	const styleNotes = (meta?.styleNotes ?? []).filter(
		(n) => n.status === "active",
	);
	const pendingIvs = (meta?.pendingInterventions ?? []).filter(
		(i) => i.status === "pending",
	);
	// 顶栏那两颗面板开关：顶栏入口在壳**之外**（它挂在根容器下），但面板渲染在壳**之内**
	// ——跨边界的那一条线。走壳发布的稳定句柄即可，不需要第二份状态（决策 9）。
	const openStylePanel = () => bookUiRef.current?.toggleStylePanel();
	const openIntervene = () => bookUiRef.current?.toggleIntervenePanel();
	// 🧩 自定义模式库：拉取本书已有模式卡清单 / 分析粘贴文本并加入模式库。
	// 模式库清单是**本书**的卡，跨书没有意义——所以它在壳里；请求本身仍是业务动作。
	const loadPatterns = () => {
		if (projectId === null) return;
		const guard = projection.capture();
		const bookUi = bookUiRef.current;
		void fetchJson("/textbook/action", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				// 只读展示那一路：模式库清单是**读**，目录把它标成 `read-only`，
				// 于是它进不了 `postAction` 那扇可调用的门（票 03）。
				action: uiReadOnly("pattern-list"),
				project: projectId,
				session: sessionRef.current,
			}),
		})
			.then((json) => {
				if (!isBookCurrent(guard)) return;
				if (json?.ok === true) bookUi?.setPatternList(json.patterns ?? NO_PATTERNS);
			})
			.catch(() => {});
	};
	const analyzePattern = async (text) => {
		const guard = projection.capture();
		const bookUi = bookUiRef.current;
		bookUi?.setPatternBusy(true);
		bookUi?.setPatternResult(null);
		try {
			const json = await postAction({ action: "pattern-analyze", text });
			if (!isBookCurrent(guard)) return;
			if (json !== null && json.ok === true) bookUi?.setPatternResult(json.card);
			loadPatterns();
		} finally {
			if (isBookCurrent(guard)) bookUi?.setPatternBusy(false);
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

	// 非项目态（向导/加载/无书）：单滚动内容。整块挂在壳**之内**——向导表单、建议态、
	// 动作级 busy/error 全归壳所有，所以无书会话 A→B 时它们跟着 bookKey 一起归零
	//（用户故事 5：不会把 A 的书名、目标或路线误用到 B）。
	// 写成函数延迟构造（壳以 render prop 调用它）：书级 state 从 `ui` 取。
	const simpleSurface = (ui) =>
		createElement(
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
				busy: ui.busy,
				onTokenChange: (e) => setMineruToken(e.target.value),
				onSave: saveMineruToken,
				resetOpen: mineruResetOpen,
				onToggleReset: () => setMineruResetOpen((v) => !v),
			}),
			visibleError(ui) !== null
				? createElement("p", { style: S.error }, `⚠️ ${visibleError(ui)}`)
				: null,
			loading
				? createElement("p", { style: S.hint }, "加载中…")
				: showWizardForm
					? createElement(WizardCard, {
							onCreate: createBook,
							onCreateDemo: () => {
								void postAction({ action: "demo-run" }).then((json) => {
									// 演示书与建档同一口径：回包指定了 project 就立刻接管那本新书。
									if (json?.project) void projection.selectProject(json.project);
								});
							},
							busy: ui.busy,
							suggestions: ui.suggestions,
							suggestLoading: ui.suggestLoading,
							onSuggest: (hintText) => requestSuggest(hintText),
						})
					: null,
		);
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
				// ── 焦点区（书级子树，壳的**拥有者**）───────────────────────────────
				// 壳不产生 DOM 节点，所以**布局与滚动容器一个像素都不变**；它换来的是：切会话/
				// 切书时这一整块（阶段片、阶段页、当前主卡、书级面板、章节/Gold/确认卡……）连同
				// 各自的书级 UI state 与子组件自己的展开/输入/选中态一起重挂，不跨书存活
				//（ADR-0021 决策 9）。破卷广告与对话台在壳**之外**——它们是全局的。
				// `meta` / `gate` / `events` 传进来只为壳里那两条只读 UI 反应（自动跟随）；
				// 壳**不发任何请求、不持有业务动作**，那两样仍归 WorkbenchView（决策 9）。
				createElement(
					BookSessionScope,
					{ key: bookKey, uiRef: bookUiRef, meta, gate, events },
					(ui) => {
						// 局部名与搬走前逐字同名，便于对照：值全部来自壳（`ui`），
						// 壳按 bookKey 重挂 → 换一本/切一个会话时这一整块连同它们一起归零。
						const {
							viewPhase,
							browsing,
							showHistory,
							gateOpen,
							busy,
							deletingId,
							showStylePanel,
							showIntervenePanel,
							patternOpen,
							patternBusy,
							patternResult,
							patternList,
							awaitBanner,
							progressBanner,
							noteToast,
							progressSeqRef,
							setViewPhase,
							setAwaitBanner,
							setBrowsing,
							setProgressBanner,
							setNoteToast,
							setShowHistory,
							setGateOpen,
							setShowStylePanel,
							setShowIntervenePanel,
							setPatternOpen,
							setDeletingId,
						} = ui;
					// 左栏那套属性的收窄版（2026-09-21 用户裁决「左栏不再要了」）：本来整栏只喂 ProcessMapRail，
					// 现在只剩「点一步 -> 进那一步的回看卡」这一个动作，被全览条的清单复用。
					// 2026-09-24 票 04：全览条清单一行一步，交出来的 key 是**步 key**（`chapter-1:write` 这种）；
					// 有段的那一步走这里，没有段的那一步（材料准备＝第一步）走 `onPickPhase`（见 `StepList`）。
					// 票 05：下面这五个接线搬进了壳的 render prop——它们写的全是**书级**导航/回看态
					//（`viewPhase` / `browsing` / 进度序号记忆），那些 state 归壳所有，所以它们和
					// 焦点区待在一处；`ui` 的解构局部名与搬走前逐字同名，便于对照。
					const onPickStep = (key) => {
						setBrowsing(key); // 点任意一步 -> 焦点区那一步的回看卡
						// 2026-09-21 用户裁决「导航不带副作用」：切步**只换屏**，
						// 不再顺手打开该步第一个产物（那是 F47 的旧行为，正是用户抱怨的
						// 「点一下就跳预览」）。产物一律由卡片里写着「打开」的按钮开。
						// 阶段页与某一步的回看卡互斥：切步就离开阶段页。
						setViewPhase(null);
						// 开始浏览时记住当前进度序号：这之后 AI 再出的 progress 才算「新进展」（方案 A）。
						// 事件列表取**同一份 snapshot**（latest ref），不是另存一份副本。
						const lastProgress = [...(bookRef.current.core.data?.events ?? NO_EVENTS)]
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
					// 点某一步要展示哪一阶段 —— 候选 06：交给模型的 focus projection（`project({kind:"focus"})`）。
					// 它按「精确步 key → 旧段 key（落该段第一步）→ 回退 meta.phase」的顺序解析，并保住
					// first-match 语义；Workbench 不再自己 `stepsOf` / `phaseOfSegment` 找一遍。
					// `browsing` 是**步 key**（票 04）；旧写法（段 key）也认，都认不出才退回 meta.phase。
					const viewPhaseOfBrowsing =
						browsing === null
							? (meta?.phase ?? 1)
							: stageStepProjector.project({ kind: "focus", ref: browsing, fallbackPhase: meta?.phase ?? 1 })
									.phase;
					// 点阶段片一格：点**非当前**格＝去那一阶段的页面（阶段页态）；点**当前**那一格＝**回到现在**
					// （清浏览态与阶段页态）。2026-09-22 票 12 裁决：这就是「回到现在」的唯一入口，回看态下同样成立
					// ——它**只换屏**，不动账本、不发动作、不改结果（spec 不变量 13）。所以这里一行都不用改：
					// 浏览态（`browsing` 非空）下点当前那格照样 `setViewPhase(null)` + `setBrowsing(null)`。
					const phaseBarSelect = (n) => {
						setViewPhase(n === (meta.phase ?? 1) ? null : n);
						setBrowsing(null);
					};
					// 候选 06：两处 `PhasePage` 接线共享一份 props / 回调。**两个 mount 点保留**（阶段片 →
					// 浏览态页 → 三个展开面板 → 阶段页态页）——面板夹在两页面点之间，这段 DOM 顺序是
					// CONTEXT「阶段片」修订③ 与 ADR-0012 末条写下的位置契约，合并渲染点＝可观察行为变化。
					// 这里只把重复的 props 与回调收进 helper；差异（key / focusedStep / events）仍逐处传。
					const renderPhasePage = (overrides) =>
						createElement(PhasePage, {
							projector: stageStepProjector,
							// 候选 06 + 票 08：乐观 redo 的清除信号＝**process commit token**
							// （ADR-0021 决策 15：当前身份 + 成功 + 规范化内容确实变化的那一次
							// process commit），不是 projector 身份——`meta` 与 `process` 独立到达
							// （详见 spec「装配与生命周期」），而 stale 的 last-known 也不是新的
							// server truth，两者都会让「按引用判断」提前清掉标记。
							processToken,
							meta,
							checks,
							aiReport,
							knowledgeMapText,
							outlineText,
							goldDrafts,
							goldDraftVersion,
							onOpen: openInSidebar,
							busy,
							onDeepModify: (segKey, note) => {
								void postAction({ action: "deep-modify", segment: segKey, note });
								// 票 11（spec §3 热区表「就这么改」那行判"不合法"：入口按钮不得替用户换屏）：
								// 提交后**不换屏**——留在这一页，被改的那一段就地标成「我正在做」（乐观标记由
								// `PhasePage` 持有并交给 projection 叠加）。要不要回「现在」由用户自己走阶段片
								// 「当前阶段」那一格（票 12 已裁：它常驻）。
							},
							// 撤销入口（10 分钟窗）在阶段页页脚；它归「刚才那一次定点修改」。
							// 票 11 复核：这一下同样**不换屏**——撤销也是阶段页上的入口按钮，替用户换屏是同一处违规；
							// 撤销后那一行由下一份 `/textbook/process` 还原成真实状态。
							onDeepUndo: () => {
								void postAction({ action: "deep-undo" });
							},
							...overrides,
						});
						return createElement(
						"div",
						{
							// 票 20：焦点区那个滚动容器要能**量**自己（`scrollHeight/clientHeight`
							// 判内容有没有超出），据此决定吸底条出不出。
							ref: focusScrollRef,
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
								// 票 20：吸底条出现时，下边距**等于它自身的高度**（判据见
								// `stickyDecisionBar`）——最后一行可点元素因此不会被它压住。
								padding: `12px 16px ${stickyBox.paddingBottom + 12}px`,
							},
						},
						// 全览条：全书几步、还剩几步、现在在第几阶段 + 展开清单（收起时不渲染清单内容）。
						// 只在「现在」那一屏出现——回看某一步时，用户手里已经有那一步了，
						// 再顶一条全览是把"手里的东西"往下挤（展开体会往下顶，别顶两份）。
						// 候选 06：只传 `projector`——抬头 / currentPhaseText / 分组清单全部来自模型的
						// overview projection，组件不再自己推导（旧的 segments/meta/currentPhase props 已迁）。
						browsing === null && viewPhase === null
							? createElement(ProgressOverview, {
									projector: stageStepProjector,
									browsingKey: browsing,
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
						// 不打断提示条（F17）：写完整本里提交风格线/留言/意见成功后，焦点区顶部滑入、6 秒自清。
						// 票 30②：条上那句字按**提交那一刻**的处境取两档——过目态那一档说「打断了」，
						// 铺章途中那一档仍是原来那句「不打断正在写的这一章」，一个字不变。
						// `noteToast` 这个槽位装的就是**该显示的那句话**（`false` = 不显示）：壳里只判真假
						// 与 6 秒自清，两处都只读真假，所以不用改壳。
						noteToast
							? createElement(InterruptNote, {
									onClose: () => setNoteToast(false),
									text: typeof noteToast === "string" ? noteToast : undefined,
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
								`📖 ${meta.name ?? projectId}`,
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
						// 票 21 · P4：转换一落终态（`conversionSettled`）也让这张卡退场——转换成功本身
						// 就是「服务端读得到 token」的证明（`resolveMineruToken` 那条路），而客户端那份
						// 开机快照会话内从不刷新，再等它就是让一句**假警报**在屏上挂几十分钟。
						mineruSet === false && !conversionSettled
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
						visibleError(ui) !== null
							? createElement("p", { style: S.error }, `⚠️ ${visibleError(ui)}`)
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
							// 候选 06：阶段片 hover 的「这一步有几份文件」取 overview projection 的
						// `artifactEntryCountByPhase`（按分段条目累计，与阶段页按路径去重的
						// `uniqueFileCount` 是**有意不同的两个事实**——不静默统一，见 spec）。
						artifactCountOf: (n) => stageStepOverview.artifactEntryCountByPhase[n] ?? 0,
							onSelect: phaseBarSelect,
						}),
						// 右栏挤压时的一句提示（票 26 / P27 ＋ P37）：**纯提示**，不可点、不发动作、
						// 不换屏——收起右栏是宿主顶栏那颗按钮的事，本票只指路，布局一个字不动。
						// 条件＝主区窄于阈值 **且** 右栏开着（判据在 `narrowMainHintShown`，纯函数）。
						// 落点：**阶段片之后**。阶段片是常驻导航面（「回到现在」长在它当前那一格上），
						// 前面只许站定高小件（smoke-test 2d-3d 的 SMALL_CHROME 白名单），不把它加进去。
						createElement(NarrowMainHint, {
							mainWidth: mainBox.w,
							mainRightGap: mainBox.rightGap,
						}),
						// 阶段页（全览条点一步落到这里；「回到现在」由那排常驻的阶段片承担——票 12 已裁，
						// 入口不随看点深浅消失，spec 不变量 13）。**排在阶段片之后**：理由与实测数字见上面
						// 阶段片那一块（顺序即位置）——两路互斥，但两路都吃同一条顺序。
						// 2026-09-21（用户第 5 条：「这个界面是不是不再必要了，可以直接复用现在的回看页面」）：
						// **不再渲染另一套单卡**，改成复用阶段页那一页、并把焦点定在选中的
						// 那一步——步清单点一步与顶栏点一格从此落到同一种卡。
						browsing != null
							? renderPhasePage({
									key: `seg-${browsing}`,
									phase: viewPhaseOfBrowsing,
									focusedStep: browsing,
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
							? renderPhasePage({
									phase: viewPhase,
									events,
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
							// 票 14：横幅详情行为空**且这一步已经交办出去**时（`stageScopedProgressDetail`
							// 返回 `""`，宿主重启后恢复链只补 `stage-start`、没补 `progress` 的那一段窗口），
							// 这一行不许说没有内容支撑的「🤖 我正在做」——与状态条**同改**、读**同一份判据**。
							// ⚠️ `pendingStageView` 与 `progressDetail` **两个都要传**：判据是两个前提合取，
							// 少传一个范围就会宽一格（跑动中但**尚未交办**那一格，那半句是实话，必须留着）。
							// 取数仍然只算一次（`client-entry.js:1235`），这里只是把同一格递给第二处。
							progressDetail,
							pendingStage: pendingStageView,
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
										project: projectId,
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
											const guard = projection.capture();
											const json = await fetchJson("/textbook/action", {
												method: "POST",
												headers: {
													"Content-Type": "application/json",
													Accept: "application/json",
												},
												body: JSON.stringify({
													action: uiCallable("suggest-words"),
													session: sessionRef.current,
													project: projectId,
													goal: meta.goal,
													route: meta.route,
													science: meta.science,
													chapterCount: (meta.outline?.chapters ?? []).length,
												}),
											});
											// 旧身份的建议不往当前书送（null＝没有建议，与取不到同一条路）。
											if (!isBookCurrent(guard)) return null;
											return json.suggestion ?? null;
										},
										// `fetchText`（最佳范例章正文的文件读取）**刻意不加** capture 守卫：
										// 它由 GoldTable 自己的挂载 effect 发起，而 StrictMode 的 effect 重放
										// 会立刻退订再重订阅——那一次 generation 推进会让「挂载时 capture 的
										// 守卫」当场失效，正文就被换成一条错误条。它的落点是 keyed 壳内的
										// Gold 卡：身份一变那棵子树整棵重挂（票 05 的隔离边界），迟到结果
										// 压根碰不到新身份，与本票要挡的那件事无关。
										fetchText: (path) =>
											fetch(
												`/textbook/file?${sess()}&project=${encodeURIComponent(projectId)}&path=${encodeURIComponent(path)}`,
											).then((res) => {
												if (!res.ok) throw new Error(`HTTP ${res.status}`);
												return res.text();
											}),
									});
								case "final":
									return createElement(FinalApprovalCard, {
										project: projectId,
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
										project: projectId,
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
										// 票 28：主 AI 上下文占用（章节清单头部那一句）。null = 读不到，
										// 组件照此不渲染那一格——不是显示 0%。
										contextPercent,
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
									// 票 10 · P47②：章卡上补一句审计新鲜度，与步清单那份「比正文旧，属于旧稿」同源。
									// 新鲜度是**服务端已判定的事实**（`seg.artifactFacts[].freshness`，出处在
									// `src/workflow.js` 的 `buildArtifactFacts`），浏览器不拿文件时间自己重算——
									// 所以这里只把**已经下发的**分段事实透下去，不新增取数通路。
									chapterSegments: processSegs,
										project: projectId,
										session: sessionRef.current,
										postAction, // F39 过目态内联展开/段级三键
									});
								case "upload":
									return createElement(UploadArea, {
										sources: meta.sources ?? [],
										converting: meta.converting === true,
										conversionStartedAt: meta.updatedAt,
										events,
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
										onDeleteStart: () => setDeletingId(projectId),
										onDeleteConfirm: () => deleteBook(projectId),
										deletingId: deletingId === projectId,
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
							? collapseConversionRuns(events).map((row) => {
								// 票 07（P23）：连续的转换进度**聚合成一条**（16 条一模一样的
								// 「材料转换」占满前 20 行）。聚合**不是丢弃**——`row.events` 留着全部，
								// 那颗纯展开控件展开后逐条可见。
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
											// （服务端按 `EVENT_TYPES` 校验），真账本走不到那一支；真走到了，宁可
											// 这一格不出词，也不把 `textbook/xxx` 这种机器串摆到人眼前
											// （与不变量 7 同一取向：界面不露机器身份词）。
											createElement(
												"strong",
												null,
												eventHuman(event.type, EVENT_META[event.type]?.label ?? ""),
											),
											// 票 07（P28/P11/P57）：摘要**追加在行首之后**（不是把行首换掉——那是
											// `smoke-test.mjs` 行首探针守着的硬天花板）。内容取账本 `data` 里早有
											// 的字段：驳回理由、交工被拒的原因、机器兜底拦下了什么、进度叙述、提示
											// 正文……截断到与行文本上限同口径；没有对应字段的类型整格不出
											// （渲染缺口，不是采集缺口——本票不新增任何采集）。
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
											// （整块热区里嵌行内控件合法），不是"同一热区两个身份"。
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
																			background: "var(--dsw-alias-bg-layer-1)",
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
										// 票 07（P29）：非提案行的展开态——给的是这一行的**全文**
										// （驳回理由原文 / 交工被拒的原因 / 机器兜底那条 / N 条转换进度…）。
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
								})
							: null,
						// 「📄 第一步 · 材料准备」那张抽屉已并入阶段页（点阶段片第 1 格 ＝ 那一步的页面，
						// 摆材料清单与转换状态）；现场的上传卡仍在（当前阶段那格＝回到现在）。
						// 抽屉的唯一入口正是阶段片第 1 格，入口改道后它成了不可达的死代码，故删除。
						// 底部常驻小条：书的进度 / 书文件夹 / 过程记录 / 取消这本书。
						// 2026-09-21 用户裁决「左栏不再要了」——这四样原来挂在左栏底部，
						// 它们跟造书的步骤无关，搬成焦点区底部一条小条（见 FocusFooter）。
						createElement(FocusFooter, {
							status: meta.status ?? null,
							bookDir,
							deleting: deletingId === projectId,
							busy,
							// 票 workbench-transitions/24（ADR-0015）：过程记录是**全局**产物，
							// 入口只在这条小条上。走既有的 openInSidebar（→ 右栏预览、只读），
							// 不新造第二套打开逻辑——它连同其余产物共用同一份 productOpenMode 判据。
							onOpenProcessLog: () => openInSidebar("过程记录.md"),
							onDelete: () => {
								if (deletingId === projectId) deleteBook(projectId);
								else setDeletingId(projectId);
							},
							// 票 12：确认态要有退路——「算了」把 deletingId 收回 null、回到第一态。
							// 两条路都不发动作；`book-delete` 仍然只有第二下（确认那颗）发，且只发一次。
							onCancelDelete: () => setDeletingId(null),
						}),
						// 票 20（走查 P3）：焦点区**吸底决策条**——滚到哪一段都在，就近再给一次那颗推进键
						// （确认点上的「✅ 满意，继续设计」原本在容器内 top 2926，要滚过约 2.9 个视口高度
						// 才摸得到）。四条规矩：
						//   · **只在内容超出时出现**（判据是纯函数 `stickyDecisionBar`）；内容装得下时
						//     凭空插一条纯属噪音。
						//   · 出现时容器已按**它自身的高度**留出下边距（上面那个 `padding`），所以它压住
						//     的只是那一段留白——**最后一行可点元素不会被它压住**。
						//   · **不是容器级 `onClick` 的整块热区**（spec 不变量 2）：条本身不可点，热区是
						//     那颗真按钮，身份＝**发动作**（`explore-confirm`），不掺「展开」——一个热区
						//     只干一件事。
						//   · 「👀 看完整报告」与两个折叠清单**照旧不撤**：吸底是叠加，不是替换。
						stickyBox.show && viewPhase === null && browsing === null
						? createElement(
							"div",
							{
								ref: stickyBarRef,
								style: {
									position: "sticky",
									bottom: 0,
									marginTop: "8px",
									padding: "8px 0 4px",
									display: "flex",
									alignItems: "center",
									justifyContent: "flex-end",
									gap: "8px",
									background: "var(--dsw-alias-bg-layer-1)",
									borderTop: "1px solid var(--dsw-alias-border-l2)",
								},
							},
								createElement(
									"span",
									{ style: { fontSize: "12px", opacity: 0.8 } },
									// 状态词只有那三个（CONTEXT「工作台状态词」），经 `stepWord` 取，这里不另抄一份
									// ——抄一份就会与清单那边漂成两种说法。
									`⚡ ${stepWord("waiting-user")}`,
								),
								createElement(
									"button",
									{
										style: S.bigBtn(true),
										onClick: () => confirmExplore(true),
										disabled: busy,
									},
									// 可见文案取自卡里那个**唯一出口**（同一个动作、同一个名字）。
									EXPLORE_CONFIRM_ACCEPT_LABEL,
								),
							)
						: null,
					);
					},
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
									borderTop: "1px solid var(--dsw-alias-border-l2)",
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
	//
	// 根容器（高度测量）与外层布局留在壳**之外**；书级子树按 ADR-0021 决策 9 挂进
	// BookSessionScope（key ＝ `snapshot.bookKey`）：
	//   · 无书/加载那一屏 —— **一个**壳，同时是书级 state 的**拥有者**（向导表单、建议态、
	//     动作级 busy/error 都在里面）：无书会话 A→B 整棵重挂，填到一半的向导归零。
	//   · 有书 —— 顶栏入口位一个**纯 key 边界**（顶栏没有自己的书级 state，但它是书级入口）；
	//     焦点区那层在 `projectView()` 内部**再挂一个拥有者的壳**，于是破卷广告与对话台留在壳外。
	// ⚠️ 同一个 key 的两个**兄弟**节点会让 React 判重并丢子节点：所以有书分支里那一个是嵌套
	// 关系（`projectView()` 内部的列容器里），两个分支各只有一个拥有者。
	const rootStyle = {
		display: "flex",
		flexDirection: "column",
		height: rootH !== null ? `${rootH}px` : "100%",
		minHeight: 0,
		overflow: "hidden",
		// ── 票 04·方案 B：把工作台收窄到宿主正文宽度以内（用户 2026-09-27 拍板「只做 B」）──
		// 原来这里**通栏填满中心列**，于是宿主那两条透明拖拽手柄正好压在两颗主推进按钮的中心点上
		// （P53/P56：真实用户用鼠标点「✅ 都过了，交工」多半点不到，按下去是开始拖 sidebar）。
		// 手柄的几何闭式（dsh-client-ui-conversation 的 `widthHandle`，逐条对账见
		// `docs/reference/dsh-chat-width-handle-geometry-contracts.md`）：
		//   W = --dsh-chat-content-width ∈ [680, 920]（宿主 clamp 写死在 .wSkVaW_root 上）
		//   h = min(40px, (列宽 - W) / 2 - 48px)   左带 = [中心 - W/2 - 24 - h, 中心 - W/2 - 24]
		//   右带 = [中心 + W/2 + 24, 中心 + W/2 + 24 + h]
		// ⇒ 水平居中的工作台只要 `总宽 ≤ W + 48` 就整体落在带外。
		// ⚠️ 这里的 `20px` 是票 04「待定的一个数」：**不是**闭式的 48。真机量到的严格上限是 718
		//   （= W 下限 680 + 48 − 10px 滚动条槽），票面建议取 700 留余量 ⇒ 余量取 20
		//   （680 + 20 = 700）。因为 W 的下限是宿主 clamp 写死的 680，`W + 20 ≤ W + 48` 恒成立，
		//   **无论用户把正文宽度拖到哪一档，这个约束都不会失效**。真机核过之后再钉死这个数，
		//   届时只改这一行。
		maxWidth: "calc(var(--dsh-chat-content-width, 680px) + 20px)",
		marginInline: "auto",
	};
	if (meta === null || loading) {
		return createElement(
			"div",
			{ ref: rootRef, style: rootStyle },
			createElement(
				BookSessionScope,
				{ key: bookKey, uiRef: bookUiRef, meta, gate, events },
				(ui) =>
					createElement(
						Fragment,
						null,
						topBar,
						createElement(
							"div",
							{ style: { flex: 1, minHeight: 0, overflow: "auto" } },
							simpleSurface(ui),
						),
					),
			),
		);
	}
	return createElement(
		"div",
		{ ref: rootRef, style: rootStyle },
		createElement(BookSessionScope, { key: bookKey }, topBar),
		projectView(),
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
	// 判据（2026-09-20 用户拍板，2026-09-27 票 walkthrough-fixes/03 · P45 补第三个否定条件）：
	// **不是子助手会话，且（造书模式，或这个会话在盘上真有书）**。
	// 原来只认 projectionValues.agentPreset === "textbook"，于是两条老会话（会话记录里没有
	// 该投影值）的成品永远打不开工作台——页签不出现，下载/预览都进不去。而「盘上真有
	// project.json」比「会话元数据里记着预设名」更接近门控的本意。
	// ⚠️ agentPreset 在客户端会话记录里位于 projectionValues（host control 帧镜像），
	// 顶层没有该字段——8-26 版本曾读错字段导致门控永远失效/永远生效。
	// ⚠️ P45：子助手是**从父会话 fork 出来的、agentPreset 原样继承**，所以「会话是造书模式」
	// 这一条对每个子助手都成立，页签必然注册、点进去渲染的还是**一本全新书**的第 1 步表单
	// （实测 37 个子助手每一个都这样）。子助手会话里的工作台没有它自己的书，一律不注册。
	// 判据用 `origin === 'subagent'`，与小助手血缘聚合（`indexSubagentDescendants`）同一口径。
	ctx.slots.inject("conversation.view", () => {
		let disposer = null;
		let probedSession = null; // 已经问过服务端的会话 id（每个会话只问一次）
		let hasBook = false;
		const sync = () => {
		// ⚠️⚠️ **当前会话 id 来自 `uiSession.current`，不是 `sessions.list` 快照上的 `current`。**
		//
		// 2026-09-28 定位到的真病：宿主客户端的 `sessions.list` 快照形状是
		// `{ ids, byId, phase, projectionsBySession }`（`dsh-api-session-controller`
		// `client/sessions/service.js` 的 `createSnapshotStore` 初始值）——**它没有 `current`**。
		// 这里原来读 `snap.current`，恒为 `undefined`：于是 `isTextbook` 恒 false、`id` 恒 null，
		// 连「盘上真有书」那条兜底探测都进不去，**工作台页签在真机上永远注册不上**。
		//
		// 为什么仓里一直是绿的：所有测试的假宿主都写成 `selector({ byId, current: sessionId })`
		// ——`current` 是**按本仓的用法造出来的**，宿主从来没提供过。这正是 AGENTS.md
		// 「宿主契约」那一条说的病：桩的形状跟着代码走，绿就证明不了任何宿主事实。
		// 当前会话身份在 `ctx.uiSession`（`@deepseek-ai/dsh-client-ui-session`）的
		// `current` binding source 上，取 `.key`；缺席时 `key` 是 `undefined`。
			const currentId = ctx.uiSession.current.getSnapshot().key ?? null;
			const current = currentId === null ? undefined : ctx.sessions.list.getSnapshot().byId?.[currentId];
			const id = currentId;
			const isSubagent = current?.origin === "subagent";
			const isTextbook =
				current?.projectionValues?.agentPreset === "textbook";
			const show =
				!isSubagent &&
				(isTextbook || (id !== null && id === probedSession && hasBook));
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
			// ⚠️ P45：子助手会话一律跳过探测——它没有自己的书，问了也只会白问一次。
			if (!isTextbook && !isSubagent && id !== null && id !== probedSession) {
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
		// **两个源都要订阅**：切会话改的是 `uiSession.current`，会话列表刷新（投影值到达、
		// 书建出来）改的是 `sessions.list`——少订一个就会漏掉该重新注册的那一刻。
		sync();
		const unsubscribeSession = ctx.sessions.list.subscribe(sync);
		const unsubscribeCurrent = ctx.uiSession.current.subscribe(sync);
		return () => {
			unsubscribeSession();
			unsubscribeCurrent();
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
