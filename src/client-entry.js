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
// 屏级问句那一行的字号/颜色（票 `ui-display-redesign/21`）：与 8 个决策站的卡头共用同一份冻结常量，
// ⛔ 不在壳里再写一份字号。⚠️ 问句的字面量住在 `src/ui/surface.js`（`src/ui/**` 才在判定线① 的
// 用词扫描面里），这里只负责把它摆到屏上。
import { CARD_HEAD_QUESTION_STYLE } from "./ui/card-head.js";
// 屏级路由（票 `ui-systematic-fixes/05`）：「渲哪一屏」的**唯一判定面**——纯函数、零副作用、
// 不碰 React，壳只消费它的返回值（搬移前那五处就地判据到此为止，见 `src/ui/surface.js` 文件头）。
// 票 06：那颗读面重试的动作名也从这里取（⛔ 不在壳里手抄 `"read-retry"`——抄一份就会漂）。
import { resolveSurface, SURFACE_RETRY_ACTIONS } from "./ui/surface.js";
// 当前书投影（票 01/03 建的内部 module，Candidate 05 / ADR-0021）：六方法 interface，
// 拥有 projects/events/work/process 四条核心读通道、订阅拥有的 2 秒轮询、readiness 与
// 请求顺序。它无 React 依赖；WorkbenchView 只用 useSyncExternalStore 观察它。
import { createBookProjection } from "./workbench-projection.js";
// 工作台动作接缝（票 contract-actions/03，ADR-0017）：动作名与「能发 / 只读展示」这一
// 暴露事实**取自契约面动作目录**，调用点不再自己维护第二份清单。它无 React 依赖，也不碰
// payload / 用户确认 / 宿主形状——那些仍在下面各调用点原样发出。
import { uiCallable, uiReadOnly } from "./workbench-actions.js";
// 「有没有新版本」自检（判据与网络都在这个 module 里）。**请求由 apply(ctx) 在注册时发起**，
// 组件只订阅一个已算好的结果——渲染期零请求，否则会污染首屏那几条读通道的请求计数
// （test-workbench-first-screen.mjs 的 fetch 桩把每次调用都记进 calls，且未 stub 的直接抛）。
import { classifyLayer, INSTALLED_PACKAGE, INSTALLED_VERSION, layerBadge, startUpdateCheck, updateNoticeText, useUpdateNotice } from "./ui/update-notice.js";
// 书级 UI 隔离壳（内部件，不进导出表面）：以 bookKey 为 key，切书/切会话时书级子树整体重挂。
import { BookSessionScope } from "./ui/book-session-scope.js";
// 领域规则与纯函数（rules）：本文件直接用的 + 为保持产物表面而再导出的；
// 双端共享领域件（素材角色、六阶段、范例章号）以 src/domain-rules.js 为源。
import {
	// ⚠️ `formatTime` 随账本回放行搬进 `src/ui/event-cards.js`（票 `deep-module-scan/15`）——
	//   它是「多久之前」那条界面派生，壳里只剩一个调用点，就是那段 inline createElement。
	// ⚠️ 票 stale-detection/01 的判停判定 `deriveStallJudgment` 与进度详情取数
	//   `stageScopedProgressDetail` **随票 `depth-review-2026-10/08` 一起不再由壳直接调**——
	//   壳级派生收进 `view-rules.deriveBookViewFacts`（见下面那次调用），判据与口径一个字没改，
	//   变的只是「谁调」。小助手血缘聚合（三路输入、一个门槛，活性行与状态卡消费同一份结果；
	//   口径与宿主同源，见 docs/reference/dsh-session-contracts.md）仍在壳里直接用。
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
	// 票 28：主 AI 上下文占用。口径与宿主输入区角标同一份数据（`contextPressure` 会话投影），
	// 读数口在 rules.js；读不到就 null，界面那一格不渲染（绝不显示 0%）。
	contextOccupancyPercent,
	// 票 ad-strip-occlusion/01 + workbench-scroll/01（同一个 8px、同一次改动）：工作台底边锚点
	// 取「输入区**容器**的 top」，不取输入元素自身的 top——宿主作曲家卡在输入元素上方还有
	// padding-top / 提示语 / 排队消息行。判据与真机证据见 rules.js 里这一节的注释。
	pickComposerAnchorTop,
	// 票 `walkthrough-2026-10/10`：**谁够格当宿主作曲家**那一刀（工作台自己的输入不算 ＋ 必须在
	// 视口里）。少了它，终检认可那张长卡自己的意见框会被当成锚点，工作台塌成 207px、整块内容被裁。
	isComposerCandidate,
	// 票 24：拍板/认可那两张闸门卡要**自己进视野**（滚到哪 ＋ 这一帧量到了没有）。判据只此一份；
	// 这里只负责量坐标与渲染。
	// ⚠️ 兜底句那个出口（`blankFocusText`）票 `ui-systematic-fixes/05` 起由 `src/ui/surface.js`
	// 调——那一支（非造书会话·无书可画）的屏级判定也搬过去了，壳不再直接引它。
	decisionCardScroll,
} from "./ui/rules.js";
// 展示派生（事件→文件、阶段→产物、stage→界面文案）集中放卡片域 view-rules.js，
// 壳只留薄绑定；领域源仍是 domain-rules。
import {
	focusCardKey,
	// 票 24：这一张主卡要不要被**带进焦点区可视带**（拍板/认可那两张，见上面那条 effect）。
	autoScrollCardKey,
	workEntryAction,
	artifactName,
	// 票 `depth-review-2026-10/08`：壳在渲染体上方现算的那八格派生收进
	// `deriveBookViewFacts` 一处，壳只消费它的返回值（取词出口与判据一个字没改）。
	// `humanTurn` 由它给出但**不进袋**——只喂阶段片 / 状态条 / 活性行三个渲染点。
	deriveBookViewFacts,
	// 「从账本倒找最近一条某类型的事件」那份模板（倒找的实现只此一份）。⚠️ 壳里 `onPickStep`
	// 记进度序号那处**仍读 latest ref**（见那里），只是不再自己抄模板。
	lastEventOfType,
	// ⚠️ 票 `deep-module-scan/15` 把 `workPathForEvent` / `workEntryForEvent` / `eventHuman`
	//   连同账本回放行一起搬进了 `src/ui/event-cards.js`——它们是**判据与词汇**，那条渲染面
	//   现在自己 import（`AGENTS.md`「Frontend layout」：跨域只走 public exports）。
	//   搬走之前它们**只**被那段 inline createElement 用，所以这里随之删掉。
	// 票 `demo-channel-full/26`（清仓）：「🧩 自定义模式」那颗键的 `title` 一族的两个取值
	// （演示书上没有 AI 分析，那一下回的是占位卡）——出口在 view-rules，壳只取句。
	patternPastePlaceholder,
	// 票 `ui-systematic-fixes/08`：演示书的判据只此一份（`meta?.demo === true`）——MinerU 那张卡
	// 在演示书上**不摆**（演示支不转换，见 `demo-exemptions.js` 的 `phase1-no-real-conversion`），
	// 壳里⛔ 不另写一份 `meta?.demo === true`。
	isDemoBook,
} from "./ui/view-rules.js";
// 候选 06：「阶段 / 步」视图模型。WorkbenchView 用 useMemo([meta, processSegs]) 建**一次**
// projector，交给全览条 / 阶段页 / 阶段片接线 / 焦点解析共用——同一份 process/meta 只推导一次。
import { createStageStepProjector } from "./ui/stage-step-model.js";
// 上传体积的**共享判据**与超限文案（前后端共享单一事实源，见 domain-rules.js）。
// ⚠️ 这里**不再**自己写 `file.size > MAX_UPLOAD_BYTES` 那道比较（票 10 的界面层纪律）：
// 写面是「所有上传/选择文件入口」的最后一层，界面层任何第二道体积比较都会让两道上限各走各的。
import {
	judgeMaterialUploadSize,
	// 章节正文路径的构造只此一份（票 `depth-review-2026-10/05`）：产物路径是机器身份词，
	// 壳里原来自带一份 `工作区/chapter-${…}.md` 内联模板，与 `src/ui/**` 那三处各拼各的。
	chapterRel,
	// ⚠️ `EVENT_META` 随账本回放行搬进 `src/ui/event-cards.js`（票 `deep-module-scan/15`）——
	//   它是账本事件类型的契约表，那条渲染面自己 import（双端含义表，两端都要认）。
} from "./domain-rules.js";
// 票 `rcb-build/04`：站 2 确认动作的**载荷唯一写点**——出口闭集（票 11 收窄成两条）／`values`
// 的构造都在那个共享件里（与卡、服务端同一份；⛔ 壳里不再自己拼 `values` 的键）。
import { exploreConfirmPayload } from "./explore-confirm-contract.js";
// 「打开一份文件看看」的地址拼装（dsh-resource://file/…，见 ADR-0010 决策 8）。
import { bookFileAddress } from "./ui/file-address.js";
// 产物读取拥有者（票 workbench-card-contract/03）：`/textbook/file` 与 `/textbook/download`
// 的地址骨架与身份编码只此一份，调用方只给 `rel`。
import { createArtifactReader } from "./ui/artifact-read.js";
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
	// ⚠️ `cardText` / `cardIcon` 随账本回放域搬进 `src/ui/replay-list.js`（票
	//   `depth-review-2026-10/09`），`collapseConversionRuns` / `replayRowSummary` / `replayRowDetail`
	//   更早搬过一次（票 `deep-module-scan/15`）。壳最后一个取词点已改指，垫片随之撤掉。
	PhaseBar,
	WizardCard,
	UploadArea,
	StatusCard,
	DeliveryCard,
	FinalApprovalCard,
	rejectPayload,
	GatePanel,
	MineruTokenCard,
	// 票 `ui-display-redesign/01`：站 0 的推广块已搬出建书卡（默认折、摆在这张卡之后最底）。
	PromoFoldBlock,
	// 票 `workbench-card-contract` 02：卡片 props 契约，**声明在每张卡自己的域文件里**。
	// 票 `focus-card-routing/03`：壳不再 import 这些契约——slot 表与契约的对应只住
	// `src/ui/card-routing.js`（表的一行同时带 slot／组件／契约）。这里留的组件只服务下面的
	// 公开导出面（桶式再导出），不参与焦点区主卡路由。
} from "./ui/event-cards.js";
// 账本回放域（「之前的过程」那块）：卡片本体 + 它那张 props 契约 + 人话词映射
// （票 `depth-review-2026-10/09` 从 `./ui/event-cards.js` 搬出，与焦点卡族零内部共享）。
// 票 09 当时留了一行过渡再导出让壳零改动取词；票 `depth-review-2026-10/05` 收掉那一行，
// 壳与四组测试全部改指到本模块的真正住址。
import {
	cardText,
	cardIcon,
	ReplayList,
} from "./ui/replay-list.js";
// 卡片 props 契约的装配器（中性 module：零 import，不认识任何一张卡）。
import { createCardView } from "./ui/card-view.js";
// 焦点区主卡路由表（票 `focus-card-routing/03`）：一行 = 一个 slot，同时带
// 「由哪个键选中／组件／契约」。壳从这里派生 slot 表与主卡选择，⛔ 不再写第二份字面量。
import { rowFor, slotsFromTable } from "./ui/card-routing.js";
// 书级袋子的**值**（票 `depth-round-3/02`）：这一袋有哪些键由 `src/ui/card-book.js` 的
// `CARD_BOOK_GROUPS` **只声明一处**，值由本模块（`deriveCardBook({snapshot,shellState,wiring})`）
// **只算一处**——少给一个键、或给了声明面之外的键，那一层当场抛并点名
//（画廊的下钻适配器 import 的是**同一个**模块，票 02 起）。
import { deriveCardBook } from "./ui/card-book-derive.js";
// 对话台（与「自动打开页签」共用同一个消息来源推导）。
import { ChatDesk } from "./ui/chat-desk.js";
import {
	deriveChatDeskNodes,
	findQuestionAnswerByCallId,
	isQuestionCallRunning,
} from "./ui/chat-source.js";
// 读面 C（票 `dsh-contract-drift/11`）：宿主的 `ConversationNodeDefinition` 注册面——`tool/result`
// 落库即收到答案，不依赖那条调用还在不在已加载窗口里。Definition 拿不到会话身份，所以这里只把
// `callId → answers` 记进缓存，落账仍在 `WorkbenchView` 里走同一个 `recordQuestionAnswer`。
import {
	clearQuestionAnswerFromFeed,
	createQuestionAnswerDefinition,
	getQuestionAnswerFeedRevision,
	isQuestionCallExpectedInFeed,
	readQuestionAnswerFromFeed,
	subscribeQuestionAnswerFeed,
} from "./ui/question-answer-feed.js";
// 谈判桌。
import {
	GoldOpinionList,
	GoldReader,
	GoldCompare,
	// 票 `confirm-points-redesign-build/08`：站 8（这一稿行不行）那一屏的组件本体。
	GoldDraftStage,
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
	// 票 `focus-card-routing/03`：这两张卡的契约不再从这里进壳——它们只住在
	// `src/ui/card-routing.js` 的 `chapters`／`progressOverview` 两行。
} from "./ui/chapters-map.js";
// 机器产物的人读折叠（知识地图 / 章节安排）——实现在**中性模块**，票 `depth-review-2026-10/03`
// 从 `ui/chapters-map.js` 搬出来（住址与消费方分离的病）。壳原先经 chapters-map 的过渡再导出
// 取它（03 定的收尾那一步不在那张票的文件范围里），今天改指到本模块的真正住址。
import { foldKnowledgeMap } from "./ui/machine-product-folds.js";
// 确认卡。
import {
	ExploreConfirmCard,
	OutlineConfirmCard,
} from "./ui/confirm-cards.js";
// 票 `confirm-points-redesign-build/05`：**站 3 那一屏**（学完能做到什么那 3–5 条目标）。
// ⚠️ 它是**另一张卡**、不是站 2 那张的一个分支：两件事的补救动作不同（站 2 只得整段重跑探查、
// 站 3 只需改那几条），这一屏只装那份目标（⛔ 不列重点难点、⛔ 不加证据栏）。
// 票 `focus-card-routing/03`：壳不再 import 这张卡——它只住在 `src/ui/card-routing.js` 的
// `goals` 那一行；壳从表拿到组件与 slot。
// 知识点图上那两种裁决的**闭集**（票 `knowledge-graph-build/08`）——壳不自己写一份 `不讲`／`要讲`：
// 界面那一侧的唯一出口就是这里，服务端另写一份同样的闭集（两边同值由
// `test-collab-backend.mjs` 拿这一份逐个真发一次来断）。
import { KG_VERDICTS } from "./ui/knowledge-graph-map.js";
// 顶栏、状态条与面板。
import {
	StatusStrip,
	ActivityLine,
	InterruptNote,
	// 票 30②＋票 gold-display-period/01：提示条那一族措辞住在 `panels.js`（组件自己的出口）；
	// 「这一次该弹哪一档」也收进那边的纯函数 `interruptNoteText`。
	interruptNoteText,
	AutoFollowAwaitNote,
	AutoFollowProgressNote,
	TopBar,
	StylePanel,
	IntervenePanel,
	PatternPanel,
	ReaderQuestionnairePanel,
} from "./ui/panels.js";
// 硬依赖（ADR-0010 决策 7）：右侧 Sidebar 的预览服务。解不到就不加载本插件——
// 绝不让「打开一份文件看看」退化成点了没反应的按钮（不写 ctx.get 兜底）。
//
// ⚠️ `uiSession` 是 2026-09-28 新增的硬依赖：工作台页签的**会话级门控**要读「当前会话是谁」，
// 而那个身份只在 `uiSession.current` 上（`sessions.list` 的快照里没有 `current` 字段）。
// 用谁就声明谁——它对应的客户端包 `@deepseek-ai/dsh-client-ui-session` 同步登记进
// `package.json` 的 `dsh.client.inject`。
//
// ⚠️ `uiConversation` 是票 `dsh-contract-drift/11` 新增的硬依赖：读面 C 要在 `apply(ctx)` 里
// 调 `ctx.uiConversation.events.register(...)`。对应的客户端包
// `@deepseek-ai/dsh-client-ui-conversation` **早就在** `package.json` 的 `dsh.client.inject` 里
// （票 06 起），这里补的是**服务级**声明——两层声明缺一不可：服务名不在这个 `inject` 里，
// cordis 对 `ctx.uiConversation` 的属性访问会直接报 `cannot get property … without inject`
// （不是给 undefined）；而声明了服务、宿主组合里却没有它时，本插件根本不会被 apply。
export const inject = ["slots", "sessions", "uiSession", "uiConversation", "sidebarRight"];

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
	// 票 `ui-display-redesign/01`：站 0 的推广块（默认折）也是 `src/ui/` 的导出面之一——
	// 测试与壳取同一条公开出口（见 AGENTS.md「Frontend layout」）。
	PromoFoldBlock,
};
export { ChatDesk };
// ⚠️ 票 `confirm-points-redesign-build/08`：站 8／站 9 拆两屏 ⇒ 两个屏的组件都从这个桶出去
// （`GoldDraftStage`＝站 8、`GoldFinalize`＝站 9、`GoldTable`＝两屏那台总装）。
export { GoldOpinionList, GoldReader, GoldCompare, GoldDraftStage, GoldFinalize, GoldTable };
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
	ReaderQuestionnairePanel,
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
// ⚠️ 票 `depth-round-3/02` 起 `NO_PENDING_REVIEWS` / `NO_CHAPTER_STATUS` / `NO_GOLD_DRAFTS` /
// `NO_WORK_FILES` 那四枚挪进了 `src/ui/card-book-derive.js`——它们只服务「递给卡的那本书」，
// 而那一半的取值口径已经搬到那一处（壳里不再逐格抄一遍）。
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

/**
 * 每个会话「上一张还在等结算的提问卡」（票 `dsh-contract-drift/10`）。
 *
 * 为什么是**模块级** Map 而不是组件 ref：用户完全可能在工作台页签**卸载**期间去答那张卡
 * （提问卡接管的是聊天编辑器，不是工作台）。旧实现把回调挂在宿主的 `result` promise 上，
 * 组件卸载不收回它；新实现走事后回读，就必须把「刚才在等哪张卡」也放在组件外——否则
 * 重挂载时 `pendingInteraction` 已经清了，连 `key`/`callId` 都不知道，这一次作答永远记不上。
 * 按会话索引：宿主口径是**每会话最多一个** `pendingInteraction`，跨会话不许串。
 * 落账成功那一刻就删；失败留着，下次依赖变化（`projectId` / 读面 A）再试。
 */
const LAST_PENDING_QUESTIONS = new Map();

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
	// 读面 A（票 `dsh-contract-drift/10`）：宿主对话区那一份聊天快照。提问卡结算后，
	// 答案在 `ask_user_question` 那次工具调用的结算块里——按 `callId` 回读。
	// 与对话台**共用** `src/ui/chat-source.js` 的推导（`order` + 节点仓），⛔ 不另开一处读法；
	// 顶层 `legacy.nodes` 是宿主自己零消费的兼容投影，工作台不读它。
	const chatSnapshot = props.useChat((s) => s);
	// 读面 C（票 `dsh-contract-drift/11`）：宿主在 `tool/result` 落库那一下把事件交给
	// `question-answer-feed.js` 的 Definition；它拿不到会话身份，只把 `callId → answers` 记进
	// 模块级缓存。这一枚订阅就是「C 来了一条 ⇒ 重渲这一帧」：下面那条落账 effect 的依赖里带着
	// `questionAnswerFeedRevision`，于是它会在同一帧重新按「A 优先、A 读不到才 C」取答案。
	const questionAnswerFeedRevision = useSyncExternalStore(
		subscribeQuestionAnswerFeed,
		getQuestionAnswerFeedRevision,
		getQuestionAnswerFeedRevision,
	);
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
	//    这一路读的是它名下那些自称在跑的里**最新的一次动静**，与 `subagentRuns` 同口径聚合，
	//    只多认一个 `updatedAt`。**任一路在门槛内动过就算在推进**——口径 2026-10-06 由取 min
	//    改成取 max（票 walkthrough-2026-10/01：取 min 时有一路 3 秒前刚写过、屏上仍喊没动静）。
	//    取不到（宿主没给这一位）时是 null，判定照旧走原来三路——
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
	// ⚠️ 票 `ui-systematic-fixes/06`：身份失效（404/403）的信号**不走 snapshot**——投影按
	// ADR-0021 决策 13/16 清身份、重新发现、不留任何错误，于是界面上从前一个字都没有；
	// 注入这个回调让壳能说一句话。⛔ 不进 snapshot 的顶层键集：`test-ui-state-gallery-shape.mjs`
	// 逐字段比夹具录下的形状，多一个键会让每一份**录制基线**当场过期，而重录是人的动作、
	// 且共享基线只在主树上改（`docs/agents/effort-orchestration.md`）。
	// 带 `session` 是防「切会话那一帧读到上一个会话的信号」。
	const [identityLost, setIdentityLost] = useState(null);
	// 「已经等了多久」：`elapsedMs` 由**壳里这一个**计时器给（下面的 effect），
	// `resolveSurface` 是纯函数、只消费它（⛔ 它自己不读时钟，见 `src/ui/surface.js` 文件头）。
	const [elapsedMs, setElapsedMs] = useState(0);
	const loadingStartedAtRef = useRef(0);
	const projection = useMemo(
		() =>
			createBookProjection({
				sessionId: session,
				onIdentityLost: (lost) =>
					setIdentityLost(lost === null ? null : { session, ...lost }),
			}),
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
	// ⚠️ **书级只读数据那十几格（`knowledgeMapText` / `knowledgeMapExclusions` / `readerQuestionnaireReturn` /
	// `outlineText` / `goldAuditText` / `chapterStatus` / `goldDrafts` / `goldDraftVersion` / `exploreSummary` /
	// `workFiles` / `workKnown` / `shapeReport` …）不再在这里逐格抄一遍**（票 `depth-round-3/02`）：
	// 它们与 `pendingReviews` 同属「递给卡的那本书」的只读那一半，取值口径（含 `goldAudit` **有意留住的
	// `undefined` 第三态**、`work.known` 在 ready 与 stale 都为真）现在只写在 `src/ui/card-book-derive.js`
	// ——壳把它读到的那一份 `book` 原样递过去（见下面 `deriveCardBook({ snapshot: book, … })`），
	// 画廊递的是照夹具造的同形状一份。要改这几格的读法，改那一处。
	// ⚠️ 例外的只有 `processToken`：它**不由派生层算**，而是壳那枚 latest-ref 的**推进计数**
	// （成功 ＋ 身份 ＋ 内容确实变化才 ＋1，判据全在下面「process commit token」那一段）——
	// 派生层原样收它当 `shellState` 的一位。
	const pendingStageView = coreData === null ? null : coreData.pending.stage;
	const pendingGateView = coreData === null ? null : coreData.pending.gate;
	// 分段清单是旁支里**壳还要用**的那一条：`stageStepProjector` 的 `useMemo` 依赖它就着。
	// 它的读法照 ADR-0021 决策 11/16：**不从空数组猜**——`data === null` 才是「还没到」。
	const processSegs =
		book.process.data === null ? NO_SEGMENTS : book.process.data.segments;
	// 身份只有这一处：显示与动作请求体都读它（决策 7/8），Workbench 不再自持 activeId/ref。
	const projectId = book.projectId;
	const bookKey = book.bookKey;
	// 身份失效信号只在**本会话**那一份上生效（回调带 `session`，切会话那一帧不串台）。
	const identityLostNow =
		identityLost !== null && identityLost.session === session ? identityLost : null;
	// 票 03：产物读取拥有者。`projectId` 读不到时它**不发请求**（表现为一次 reject），所以
	// 「无当前书」这一支不需要壳再自己判一次。
	// ⚠️ 必须 useMemo：下面几张卡把 `readArtifact` 放进各自 effect 的依赖数组，每次渲染换新引用
	// 会让那些 effect 每渲染都重跑（探查报告与章节正文会被反复取）。
	// 依赖用响应式的 `session`（props 派生）而不是 `sessionRef.current`——ref 读进依赖数组是错的，
	// 切会话时不会重算。
	const artifactReader = useMemo(
		() => createArtifactReader({ sessionId: session, projectId }),
		[session, projectId],
	);
	const readArtifact = artifactReader.readText;
	// ── process commit token（决策 15 / spec §14）──────────────────────────
	// PhasePage 的「我正在做」乐观标记**只由最近一次成功、仍属当前身份、且**规范化内容确实
	// 变化**的那一份 process commit 清除**（ADR-0021 决策 15）。三条各有一格，缺一条就会提前退场：
	//   · 身份：按 bookKey 归零——别的书的提交碰不到这一份（壳也按 bookKey 重挂）。
	//   · 成功：stale/error 保留的是 last-known，不是新的 server truth，不冒充。
	//   · 内容真变了：投影侧成功响应经规范化后没变就**不换引用、不通知**（决策 5）；而「读失败
	//     又恢复成同一份内容」这一路会送来一个新的 `data` 引用 ⇒ 这里再按**内容**判一次身份，
	//     内容一样就不推进 token（旧壳同款：它在提交那一刻把 token 设成内容串，串一样 ⇒ 消费面
	//     的 `useEffect` 依赖不变）。
	// ⚠️ 判据**住在壳里**（这枚 latest-ref 同时记着「上次提交的引用」与「上次提交的内容串」），
	// token 对外是一个**只进不退的推进计数**：它只回答「来没来一份新提交」，不承载内容。
	// ⚠️ 票 `depth-round-3/02` 的收口 review A1：这一位曾被整段搬进派生层、由
	// `JSON.stringify(process.data)` **无条件**签名（不看引用/成功/身份三条里的任何一条）。
	// 现在它回到壳：派生层（`src/ui/card-book-derive.js`）只原样收 `shellState.processToken`，
	// ⛔ 不再自己从 `process.data` 算一份；上面那条内容比较是**这里**的判据，不是派生层的。
	// 它只喂 PhasePage 的一个 `useEffect` 依赖，不参与任何派生渲染——所以新书在它自己的
	// 第一次 process 提交之前拿着旧值也无害（那本壳的 redoKey 本来就是 null）。
	// ⚠️ 渲染期写 ref 是本文件既有的 latest-ref 写法（上面 `bookRef.current = book` 同款）：
	//    同一次渲染里写完即读，值完全由这份 snapshot 决定，重渲与重放都是幂等的。
	const processCommitRef = useRef({ bookKey: null, data: null, signature: null, token: 0 });
	if (processCommitRef.current.bookKey !== bookKey) {
		processCommitRef.current = { bookKey, data: null, signature: null, token: 0 };
	}
	if (
		book.process.status === "ready" &&
		book.process.data !== null &&
		book.process.data !== processCommitRef.current.data
	) {
		// 引用不等＝投影送来了一份新的 process 快照；内容也一样才算真来了一份**新提交**。
		const signature = JSON.stringify(book.process.data);
		const previous = processCommitRef.current;
		processCommitRef.current = {
			bookKey,
			data: book.process.data,
			signature,
			token: signature === previous.signature ? previous.token : previous.token + 1,
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
	// ⚠️ 票 `ui-systematic-fixes/05`：`pickingFirstBook` / `loading` 那两句判据**搬进了**
	// `src/ui/surface.js`（`resolveSurface` 按同一份原始量现算：`projectsStatus` / `projectsCount` /
	// `generation` / `coreStatus`）。壳这一层不再各算一份——「还在读」只由那一个函数回答。
	// 「打开失败」只在**首次** core/projects 失败时可见（status === 'error'）；已有过成功
	// 读取之后的失败一律是 stale，静默（普通轮询抖动不盖满错误条）。**分界判据是
	// `known`**：`error` 恒伴随 `known === false`，`stale` 恒伴随 `known === true` 且保留
	// last-known——所以这一行读 status 就够，不必再问 data 空不空（决策 11/16）。
	// not-found／not-owned 不落这里：它们让身份失效并回到空态，不显示读取错误（决策 16）。
	// work/process 的 `error` 也不落这里：旁支失败不新增错误条、不新增重试入口（决策 16）。
	const readStatus = projectId === null ? book.projectsStatus : book.core.status;
	const readError = projectId === null ? book.projectsError : book.core.error;
	const loadError = readStatus === "error" ? (readError?.message ?? null) : null;

	// ── 壳级派生：这一本书界面上要说的那几句话（票 `depth-review-2026-10/08`）────────────
	// 搬移前这八格是壳在渲染体上方**逐格抄一遍**判据（`lastEvent` / `checks` / `aiReport` /
	// `progressDetail` / `pendingStageLabel` / `humanTurn` / `needsConfig` / `stall`），
	// 「从账本倒找最近一条某类型的事件」那份模板还另抄了三遍。现在判据收进
	// `view-rules.deriveBookViewFacts`，壳只消费它的返回值——**每一个键名与取值一个字没改**。
	//
	// ③ 账本新鲜度（`meta.updatedAt`＝账本最后一次写入的时刻）＋ 门槛这一路也在其中：它就是
	//    `stall` 的第四个输入，由派生层喂给 `deriveStallJudgment`（三路输入、一个门槛）。
	// ⚠️ **绝不 `useMemo` 这一段**：`deriveStallJudgment` 的 `now` 默认 `Date.now()`；
	// 记忆化会把时间基准冻在第一次渲染的那一刻，活性行于是永远停在同一句「N 分钟没动静了」。
	// 搬移前它就是裸调用（票 stale-detection/01），这里必须照旧裸调用。
	// ⚠️ `humanTurn` **不进下面的 `cardBook` 袋**：它只喂阶段片 / 状态条 / 活性行三个渲染点
	// （阶段片那份只是加「⚡」前缀，不是工作台状态词）。
	const { lastEvent, checks, aiReport, progressDetail, pendingStageLabel, humanTurn, needsConfig, stall } =
		deriveBookViewFacts({
			events,
			meta,
			gate,
			pendingStage: pendingStageView,
			pendingGate: pendingGateView,
			mainAiRunning,
			subagentRunningCount: subagentRuns.runningCount,
			subagentActiveSince,
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
	// MinerU 设置**三态**（票 `premature-announce/06`）：`true`＝已设置／`false`＝确实未设置／
	// `null`＝**还没读回**。⚠️ 初值不许是 `true`：那让「还不知道」与「确实设置了」共用同一个
	// 初值，切会话/首屏设置还没回来的那一帧会把未设置的 Token 印成「✅ 已设置（••••）」并
	// 附一颗「重新设置」——在数据到之前替它宣告了结论（本族的病）。`null` 档由卡渲染成空。
	const [mineruSet, setMineruSet] = useState(null);
	// 票 `token-banner/01`：Token 的**来源**（`settings` / `env` / `credentials`）与**脱敏值**随设置快照
	// 一起下发；界面只显示这两格，明文 Token 一个字节都不进前端（用户正在输入的那一格除外）。
	const [mineruSource, setMineruSource] = useState(null);
	const [mineruMasked, setMineruMasked] = useState(null);
	/**
	 * 把服务端那三格 Token 事实一次性落到本地状态（`/textbook/settings` 与保存回包共用，
	 * ⛔ 不在两处各写一遍 typeof 解析）。
	 *
	 * `fallbackConfigured` 只给保存回包用：旧宿主回 `{ok:true}` 而没有 `mineruTokenSet` 时，
	 * 保存已经成功，至少要让横幅本轮消失；首屏读回缺这一格则仍是「未定／未配置」口径。
	 */
	const applyMineruSettings = (settings, fallbackConfigured = false) => {
		const configured =
			typeof settings?.mineruTokenSet === "boolean"
				? settings.mineruTokenSet
				: fallbackConfigured;
		const source = settings?.mineruTokenSource;
		const masked = settings?.mineruTokenMasked;
		setMineruSet(configured);
		setMineruSource(typeof source === "string" ? source : null);
		setMineruMasked(typeof masked === "string" ? masked : null);
	};
	const [mineruToken, setMineruToken] = useState("");
	// 票 10：本机**真探到**了自动切分能力（Python + PyMuPDF）吗？上传前那道预检要靠它决定
	// 「PDF 超 200MB 时能不能说『会先切开』」。⚠️ 缺省 **false**：探不到就不许承诺——
	// 写反了等于给每一台没装 PyMuPDF 的机器发一句没人验过的承诺（比说错更坏：它会让人不再拆）。
	const [autoSplit, setAutoSplit] = useState(false);
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

	// ── 「转换已落终态」：MinerU 红卡什么时候该退场 ────────────────────────────────
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
	// ⚠️ 票 `ui-systematic-fixes/05`：它原来住在下面（建档向导那一支旁边），随屏级路由那一次
	// 搬移**提到 effect 之前**——`resolveSurface` 的入参里要有它，而壳里那几条 effect（例如
	// 「无书进向导时问 AI 建议」）也要先读到屏级判定。判据本身一个字没动。
	const conversionSettled =
		meta !== null && (meta.phase ?? 1) > 1 && meta.converting !== true;

	// ── 屏级路由（票 `ui-systematic-fixes/05`）──────────────────────────────────
	// 「渲哪一屏」收成一个纯函数（`src/ui/surface.js`），壳只消费它的返回值：搬移前那五处就地
	// 判据（预设门、加载/向导三目链、单屏/三区分界、现在/回看分界、建档向导那一支）到这里为止。
	// 为什么在这里算：下面那几条 effect 也要问「是不是无书那一档」，而它们排在渲染体之前。
	//
	// ⚠️ 这一次调用拿不到 `viewPhase` / `browsing` / `showHistory` / 动作级 `error`——它们住在
	// 下面 `BookSessionScope` 里（书级 state）。这里传 `null` 只会得到「有书」那一档（`now`），
	// 正是判「三区还是单屏」需要的；进到壳里面那一处（`projectView`）再拿真值调一次。
	// **判定实现只有 `surface.js` 一份**，壳这两处都只是消费（不是各判各的）。
	const surfaceInput = {
		sessionPreset,
		projectId,
		projectsStatus: book.projectsStatus,
		projectsCount: book.projects.length,
		generation: book.generation,
		coreStatus: book.core.status,
		coreError: book.core.error,
		meta,
		gate,
		viewPhase: null,
		browsing: null,
		showHistory: null,
		paused: meta?.pause != null,
		stall,
		mineruSet,
		conversionSettled,
		uiError: null,
		elapsedMs,
		identityLost: identityLostNow,
	};
	const surface = resolveSurface(surfaceInput);
	// ── 「已经等了多久」（票 06）：计时器**只此一处** ─────────────────────────────
	// 它只服务 `loading` 那一档：读数进 `surface.copy`，超过 30 秒由 `resolveSurface` 追加出口。
	// ⚠️ `elapsedMs` 是**上一帧的读数**（先算出 kind 才能起表），差一帧无害：门槛那一格由
	// 下一秒的 tick 补上。离开 loading 立刻归零（下一段加载重新起表）。
	useEffect(() => {
		if (surface.kind !== "loading") {
			loadingStartedAtRef.current = 0;
			setElapsedMs(0);
			return undefined;
		}
		if (loadingStartedAtRef.current === 0) loadingStartedAtRef.current = Date.now();
		const tick = () => setElapsedMs(Date.now() - loadingStartedAtRef.current);
		tick();
		const handle = setInterval(tick, 1000);
		return () => clearInterval(handle);
	}, [surface.kind]);
	// 有书那三档（`now` / `phase-page` / `browsing`）＝三区布局；其余各档走单滚动内容那一个壳。
	const hasBookSurface =
		surface.kind === "now" ||
		surface.kind === "phase-page" ||
		surface.kind === "browsing";
	// `bare: true`（票 06 起由判定面给这一格，壳⛔ 不再自己判 `sessionPreset`——那会成第二份枚举）
	// ＝**不挂工作台壳**、只画那一句话：今天只有「非造书会话又没有可画的书」那两支。
	// ⚠️ 造书会话的读失败/身份失效**不是** bare：它们要挂壳才有那条红字、那一句告知与那颗重试。
	const bareSurface = surface.bare === true;

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
						// 谁够格当宿主的作曲家：判据只此一份，在 rules.isComposerCandidate。
						// ⚠️ 这里**不许**再写一份「r.bottom > vh - 160」——那一条缺了「在视口里」
						// 与「不在工作台自己里面」两半，终检认可那一屏就靠它把工作台压成 207px
						// （票 walkthrough-2026-10/10 的真机复现，见该函数的注释）。
						if (
							isComposerCandidate(
								{
									top: r.top,
									bottom: r.bottom,
									width: r.width,
									height: r.height,
									insideWorkbench: el.contains(d),
								},
								{ rootTop: rect.top, viewportHeight: vh },
							) &&
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

	// 焦点区滚动容器的 ref：票 24 那条 effect 要量它的高度与滚动位置（把拍板/认可那两张
	// 闸门卡带进可视带）。⚠️ 票 20 曾在这里另挂一个「量焦点区内容有没有超出」的 effect，
	// 那是吸底决策条的接线，**已随那条一起删掉**（票 18 裁决 B：同一屏里那颗推进键渲染了两次，
	// 下面那次孤零零右对齐在卡片外面——用户原话「满意的那行位置不对」）。
	// 无 DOM 的渲染环境（冒烟/单测的 react-test-renderer）量到 null，下面的 effect 原样跳过。
	const focusScrollRef = useRef(null);

	// 票 24 · ①：**拍板 / 认可**那两张闸门卡要自己进焦点区可视带。
	//
	// 病（真机量测，票面表格）：走到第 6 阶段「最后检查」并通过后，那颗「✅ 认可，交付」在
	// 2551px 高的内容列里 `y 1523`，而可视滚动容器只有 700px —— **要滚过 1851px 才摸得到**，
	// 用户那一侧干脆整屏空白。票 20 那一类「再给一颗同一动作的键」的解法治不了这一屏：那里没有
	// 第二颗键可给，「认可，交付」就是唯一定案键，**只能把卡本身带进来**（不是再造一个出口）。
	// ⚠️ 票 20 自己那条解法（焦点区吸底决策条）后来已按 `walkthrough-fixes/18` 整条删掉，
	// 所以现在**连那一类解法都不在了**——「定案键仍只有卡上那一颗」这条更硬了。
	//
	// 什么时候动、什么时候**不动**（这一段是这个接线唯一要紧的地方）：
	//   · `autoScrollCardKey` 说这一张不在那张表里（探索/大纲/定稿/章节/上传/状态/已交付）→ 不动。
	//     每一条的理由写在 `view-rules.autoScrollCardKey` 的注释里（探索那一屏的理由是：底对齐会把
	//     正在读报告的用户一把拽到几千字下面——**那条理由仍然成立**，所以 `explore` 照旧不收；
	//     它那一屏的高度改由「报告默认折叠」治，见票 20 的 2026-10-06 裁决与该处注释）。
	//   · `nowCardRef` 为空（回看态：主卡根本不渲染）→ 不动，并把记账清掉，回到「现在」时重新摆；
	//   · **量不到（`measured: false`）→ 不记账**。这条是首轮实现踩过的坑：页签没激活那一帧
	//     `clientHeight` 是 0，若照样记「已经摆过」，之后每帧都提前返回，**原病原样复发**。
	//   · 记上账之后，**同一张卡、同样的高、同样的位置** → 一像素不再动。2 秒轮询每一帧都
	//     重渲，若每帧都重摆，用户自己往上滚去读报告会被一次次拽回底部。位置也记在账里：
	//     **内容坐标系里的 `cardTop` 不随用户滚动而变**，它变＝卡上方的东西真的长高了
	//     （比如终检的 AI 报告后到、全览条被展开），那种情况要重新摆一次。
	// 滚到哪由纯函数 `decisionCardScroll` 判（`src/ui/rules.js`）；这里只负责量坐标、只写
	// `scrollTop`。无 DOM 的渲染环境（react-test-renderer）量到 null 就原样跳过，不抛、不猜。
	const nowCardRef = useRef(null);
	const autoScrollMemoRef = useRef(null);
	const scrollCardKey = autoScrollCardKey(meta, gate);
	useEffect(() => {
		const card = nowCardRef.current;
		if (scrollCardKey === null || card === null || typeof card.getBoundingClientRect !== "function") {
			// 这一格现在没有那张卡：清记账，免得回到「现在」时拿旧的一份当「已经摆过」。
			autoScrollMemoRef.current = null;
			return;
		}
		const box = focusScrollRef.current;
		if (box === null || typeof box.getBoundingClientRect !== "function") return;
		const cardRect = card.getBoundingClientRect();
		// 换算到**容器的内容坐标系**（不是视口坐标）：卡片离容器顶的距离 ＋ 已经滚过的距离。
		const cardTop = cardRect.top - box.getBoundingClientRect().top + box.scrollTop;
		const memo = autoScrollMemoRef.current;
		if (
			memo !== null &&
			memo.key === scrollCardKey &&
			memo.height === cardRect.height &&
			memo.top === cardTop
		)
			return;
		const { scrollTop, measured } = decisionCardScroll({
			cardTop,
			cardHeight: cardRect.height,
			viewportHeight: box.clientHeight,
			scrollTop: box.scrollTop,
		});
		// 量不到就**不记账**：下一帧量到了还要再摆一次（否则原病复发，见上面第三条）。
		if (measured !== true) return;
		autoScrollMemoRef.current = { key: scrollCardKey, height: cardRect.height, top: cardTop };
		if (scrollTop !== null) box.scrollTop = scrollTop;
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
	//    ⚠️ `工作区/outline.md`（章节安排）也在这一族（票 pipeline-wiring-gaps/09）：名字带 `.md`、
	//    内容是 `{"chapters":[…]}`，与 `工作区/audit-NN.md` 同一条理由判掉右栏通道。
	//  - 'machine'（机器产物/源 PDF）→ 不给人读，什么都不开。
	const openInSidebar = (rel) => {
		const bookUi = bookUiRef.current;
		bookUi?.setError(null);
		try {
			props.openFileInSidebar(bookFileAddress(session, cwd, bookDir, rel));
		} catch (err) {
			// 预览服务解不到时插件根本不会加载（硬依赖）；这里兜的是地址/导航被拒
			// （例如打开了目录地址）——把原因摆到界面上，不留「点了没反应」。
			// 票 10（判定三 #2）：报错里原来印 `${rel}`（`工作区/…` 机器路径）；名字走 `artifactName`
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
				if (alive) {
					// 票 `token-banner/01`：`mineruTokenSet` 现在是**服务端按实际读序算出来的**
					// （settings → env → credentials），不再是「settings 文件里有没有」这一路。
					applyMineruSettings(settings.settings);
					// 票 10：切分能力与 Token 同一次读取下发（同一台机器的事实，不另发一次请求）。
					// 读不到 / 字段缺席一律落 `false`——「探不到」不是「有」。
					setAutoSplit(settings.settings?.autoSplitAvailable === true);
				}
			})
			.catch(() => {
				/* 读不到设置不影响工作台：**保持 `null`（未定）**——读失败既不是「已设置」也不是
				   「确实未设置」，不替它下任何一个结论（票 `premature-announce/06`）。 */
			});
		return () => {
			alive = false;
		};
	}, [session]);

	// 无书进向导时：请求 AI 建议（人类只做确认）。建议清单是**书级 state**（在壳里），但请求
	// 本身是业务动作，仍归这里（ADR-0021 决策 9：壳不做 owner）。
	// 依赖里带 bookKey：换一本/换一个会话时旧的那份壳已经卸载，`alive` 随之作废并重新问一次
	// ——无书会话 A→B 时 A 的建议不会落进 B 的向导（用户故事 5）。
	// ⚠️ 门那一句以前是就地判的 `meta === null && !loading`（票 `ui-systematic-fixes/05` 起改读
	// 屏级判定）：只有 `no-book`（书单读到了、确实为空）才问建议——`unreadable` 那一档压根没挂壳。
	useEffect(() => {
		if (surface.kind !== "no-book") return undefined;
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
	}, [surface.kind, bookKey]);

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
					// 票 `decision-provenance/01` D3=A：工作台是**人**在点——服务端据此先落一条
					// 人工动作事件，动作族再把它作为 `humanEvent` 交给结论件写点。AI 那条通道
					// （`agent-tool.js` 的 fetchJson）**不带**这个头 ⇒ 代拍的结论件落 machine。
					"X-Textbook-Actor": "human",
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
			//    票 gold-display-period/01：**名单留在本文件**（豁免绑的就是本文件），只把
			//    「哪一相位 ＋ 哪一状态 ⇒ 弹哪一档」那张表搬进 `panels.interruptNoteText`——
			//    原式那一格写死 `meta?.phase === 5`，把谈判桌（phase 4）整个排除在外了。
			const noteText =
				json !== null &&
				(["style-note", "intervene", "review"].includes(action) ||
					action === "gold-opinion")
					? interruptNoteText({ action, meta, pendingStage: pendingStageView })
					: null;
			if (noteText !== null) bookUi?.setNoteToast(noteText);
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

	// ── 票 06 ② / 票 `dsh-contract-drift/10`：宿主提问卡的作答 → 书账本 ──────────
	// 通路：宿主 `user-questions/request` → PendingQuestion 经宿主那一侧的
	// `registerPendingInteraction` 发布 → 出现在 `useSessionStatus(session).pendingInteraction`
	// （域键 `question`）→ **卡结算后按 `callId` 从读面 A 回读答案** → POST
	// `/textbook/question` → 服务端 `appendEvent` 落一条账本事件。
	//
	// ⚠️ **0.2.0-rc.2 删掉了 `PendingQuestion.result`**（上游 `lib/client.js` 全文
	//    `get result` / `.result =` 零命中；同文件那枚 `result` 属于另一个类）。旧实现等这枚
	//    promise 兑现，拿到 `undefined` 就静默 return——这正是票 `dsh-contract-drift/05` 那次
	//    「答完不进工作记录」的病。答案没丢：它是 `ask_user_question` 那次工具调用的结算
	//    output，按 `callId` 从聊天快照（读面 A）找回来。事故记录留在注释里，判据只扫
	//    可执行行（快照 §5 的 `pending.result`）。
	//
	// 「收到问题」本身不落账：宿主在提问时就把这次请求挂在会话档案里了，书账本要记的是
	// **那次选择**（票面 §已核实：拿到答案后 AI 连着改稿，一次 workbench_act 都没有）。
	// ⚠️ 失败只记一条控制台告警、绝不打断工作台：这条通路是补记，不是主链路。
	//
	// ⚠️ **记到哪本书必须读「当下」那一份**（`bookRef.current.projectId`），不是挂载时那份
	//    `projectId`：提问卡的答案完全可能**先于**工作台接管这本书结算（刚开页签、切会话在途）。
	//    那时 `projectId` 仍是 null——发了就是 400，而答案已经过去了，**这一笔记不下来**。
	//    所以这里「不发、也不记账」，等 `projectId` 变化把本条 effect 再带起来重试。
	//    （待结算的那张卡留在 ref 里，正是为了这次重试。）

	/** 「怎么落」——与「答案从哪来」分开（票 10）。
	 *
	 *  `answer === null` ⇒ 这一次**读不到答案**：载荷带 `unread: true`（票 09 那一半落
	 *  `textbook/question-unrecorded`），⛔ 不静默、也不编「（没有勾选）」。
	 *  没有书身份时**不发、也不记账**：待结算的那张卡留在 ref 里，等 `projectId` 变化再试。
	 */
	const recordQuestionAnswer = (pending, answer) => {
		const key = pending.key;
		if (RECORDED_QUESTION_KEYS.has(key)) {
			// 已经记过：C 那一份缓存没有存在的必要（它只服务「还没落账」的那一段）。
			clearQuestionAnswerFromFeed(pending.callId);
			return;
		}
		if (QUESTION_ANSWER_INFLIGHT.has(key)) return;
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
				// 缺席 / `false` ＝一次真实作答；`true` ＝这一次读不到答案（缝见票 09/10）。
				...(answer === null ? { unread: true } : {}),
			}),
		}).then(
			// 只有真落进账本了才算「这一次记过了」：失败不记账，于是下次依赖变化还会重试。
			() => {
				RECORDED_QUESTION_KEYS.add(key);
				clearQuestionAnswerFromFeed(pending.callId);
				// 成功即从「等结算」表里摘掉：否则重挂载时还要多跑一轮 RECORDED 清理。
				if (LAST_PENDING_QUESTIONS.get(pending.session)?.key === key) {
					LAST_PENDING_QUESTIONS.delete(pending.session);
				}
			},
			(err) => {
				console.warn("[workbench] 提问卡的作答没能落进书账本", err);
			},
		).finally(() => {
			QUESTION_ANSWER_INFLIGHT.delete(key);
		});
	};

	/** 「答案从哪来」——读面 A 优先（聊天快照的结算块），A 读不到才读读面 C 的注册面缓存。
	 *  两路读的是**同一段 JSON**（`src/ui/chat-source.js` 的 `questionAnswerFromContent`），
	 *  ⛔ 不另起一份解析；`callId` 只用来定位，幂等主键仍是卡上的 `key`。 */
	const readQuestionAnswer = (card) =>
		findQuestionAnswerByCallId(chatSnapshot, card.callId)
		?? readQuestionAnswerFromFeed(card.callId);

	// 上一拍还在等的那张卡（票 10 的「订阅卡片状态变化」兜底）：卡从 `pendingInteraction`
	// 里消失 = 它结算了。timed 型（有 `callId`）从读面 A 回读答案；blocking 型（无 `callId`）
	// 读不到答案 ⇒ 走 `unread` 那一档（⛔ 不为了凑绿造一个读不到的字段，见票面「边界」第 3 条）。
	// ⚠️ 这张卡住在**模块级** `LAST_PENDING_QUESTIONS` 里，不是组件 ref——理由见那个常量的注释。

	/** 卡结算之后怎么收尾：先回读答案；**结算块还没到、而那次工具调用还在跑**就先等
	 *  （真实主路径里 `pendingInteraction` 可能比结算块先消失——两个 store 不是同一拍更新）；
	 *  **C 已经登记「这次调用还欠一个结果」也先等**（窗口外时 `isQuestionCallRunning` 看不见它，
	 *  但注册面看得见 `tool/result`）；确认读不到才发 `unread: true`（⛔ 不静默）。 */
	const settleQuestionCard = (card) => {
		const answer = readQuestionAnswer(card);
		if (answer !== null) {
			recordQuestionAnswer(card, answer);
			return;
		}
		// 同一个 `callId` 的 `RunningToolCall` 还在 ⇒ 结算块还没到，不许抢答 unread。
		if (isQuestionCallRunning(chatSnapshot, card.callId)) return;
		// 读面 C 已登记这次调用（卡结算了、`tool/result` 还没到）⇒ 等结果那一拍，
		// 同样不许抢答。结果到了会由订阅把 effect 带起来：有答案就落答案，没有就落 unread。
		if (isQuestionCallExpectedInFeed(card.callId)) return;
		recordQuestionAnswer(card, null);
	};

	useEffect(() => {
		const pending = pendingQuestion;
		let last = LAST_PENDING_QUESTIONS.get(session) ?? null;
		// 记过的卡不再跟踪：成功之后即使宿主又把它发回来，也由 `RECORDED_QUESTION_KEYS` 挡住、
		// 不会重发。失败不记账，卡留着——下次依赖变化（`projectId` / 读面 A）还会重试。
		if (last !== null && RECORDED_QUESTION_KEYS.has(last.key)) {
			LAST_PENDING_QUESTIONS.delete(session);
			last = null;
		}

		// ① 当前有一张提问卡：记住它（结算那一刻要靠 `key`/`questions` 落账），并试一次
		//    读面 A。读得到＝用户已经答了（结算块只在答完之后才有）；读不到就先不发——
		//    待回答期间一个请求都不发。
		if (pending !== null && typeof pending === "object") {
			// 第二道 domain 守卫（第一道在 `selectPendingQuestionCard` 上，那里才是宿主契约的边界）。
			// 0.1.7 起 `pendingInteraction` 有 `approval` 域（`PendingApproval`）——它**也带
			// `result`**（兑现的是 `'allowed-once' | 'rejected'`，不是答案批次），所以这里既不按
			// 「有没有 questions/result」判、也只按 `kind` 判：它不许被当成提问卡落账，也不许因此抛异常。
			// 两道都留着是有意的：这是记账通路（钱进不进账本那一侧），少一道就少一层。
			// ⚠️ 这道守卫**连 `plan-review` 一起挡**（`kind` 取 `'plan-review'`）——改动前就是这样，
			// 本票没有改动这条口径，两处注释都按它写。
			if (pending.kind !== "question") return;
			const key = pending.key;
			if (typeof key !== "string" || key === "") return;
			const card = {
				session,
				key,
				callId:
					typeof pending.callId === "string" && pending.callId !== ""
						? pending.callId
						: undefined,
				questions: pending.questions ?? [],
			};
			// 换了一张卡：上一张已经不在 `pendingInteraction` 里了。它若答过，结算块就在
			// 读面 A 里——顺手回读一次、读得到才落账；读不到就**不猜**（宿主每会话只保留
			// 一个 pending，旧卡是被取消/接管的，⛔ 不写一笔假的 `unread`）。
			if (last !== null && last.key !== key) {
				const previous = readQuestionAnswer(last);
				if (previous !== null) recordQuestionAnswer(last, previous);
			}
			LAST_PENDING_QUESTIONS.set(session, card);
			if (RECORDED_QUESTION_KEYS.has(key)) {
				LAST_PENDING_QUESTIONS.delete(session);
				return;
			}
			// 正在飞：等它落地（`QUESTION_ANSWER_INFLIGHT` 挡住第二次）；失败不记账，
			// 卡留着，下次依赖变化重试。
			if (QUESTION_ANSWER_INFLIGHT.has(key)) return;
			const answer = readQuestionAnswer(card);
			if (answer !== null) recordQuestionAnswer(card, answer);
			return;
		}

		// ② 当前没有提问卡了：上一拍那张已经结算（用户答了 / 关了 / 被换走）。
		//    按 `callId` 回读一次；读不到就发 `unread: true`（⛔ 不静默）。
		//    ⚠️ 这张卡可能是在**上一次挂载**里看到的（用户去聊天页签答题、工作台被卸载）——
		//    所以它住在模块级 Map 里，重挂载后这一支照样能把它落进账本。
		if (last === null) return;
		settleQuestionCard(last);
		// 依赖里**没有** fetchJson/postAction：它们每帧新建，进依赖会让这条 effect 每帧重跑。
		// 真正要跟的是「当前是谁在等」「当前管着哪本书」「读面 A 更新了没有」与「读面 C 收到了
		// 一条没有」——后两项是结算到达的触发器，第二项是 `projectId` 还没就绪时的重试触发器。
	}, [pendingQuestion, projectId, session, chatSnapshot, questionAnswerFeedRevision]);

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
			// 票 `confirm-points-redesign-build/06`：**站 4（第 1 关）**的「通过」多带一格
			// 「这本书主要怎么学」（`GatePanel` 那一支给的值）——它随裁决在服务端写进
			// `meta.route`，**拍板即锁定**。其余两关与「驳回」都不带它（值照旧不动）。
			// 只有 `human` / `blueprint` 两个生产取值成立；别的一律不交（⛔ 不在这条路上编第三个写法）。
			...(decision.route === "human" || decision.route === "blueprint"
				? { route: decision.route }
				: {}),
		});
	};

	const rollback = () => {
		if (snapshots.length === 0) {
			bookUiRef.current?.setError("还没有可回退的快照");
			return;
		}
		void postAction({ action: "rollback", snapshot: snapshots[0].seq });
	};

	// 票 `walkthrough-fixes/19`②：**拍板之前还能改**的那个旋钮（并发上限）。
	// ⚠️ 票 `confirm-points-redesign-build/03` 起只剩**一个**字段（篇幅档位三档删除），
	// 落盘与落账都在服务端那一处（`actions/books.js`）。
	const setKnobs = (knobs) => {
		if (!Number.isSafeInteger(knobs?.maxConcurrentSubagents)) return;
		void postAction({ action: "book-set-knobs", maxConcurrentSubagents: knobs.maxConcurrentSubagents });
	};

	// 票 `walkthrough-fixes/19`③：**跳过**这一关（把验货推迟并记账，不是取消验货）。
	// 出口在**关卡层**（拍板卡那一层）：它既不是活性行那颗按钮的第二个含义，也不是那一屏的第二颗按钮
	// （`stale-detection/01` 的「这一屏只留一个出口」维持）。
	const skipStep = () => {
		void postAction({ action: "skip-step" });
	};

	const confirmExplore = (approved, feedback) => {
		// 票 `rcb-build/04`：载荷的**字段形状**（`approved`／`reasons`／`note`／`values`，以及 `values`
		// 里那两条出口的闭集）由 `explore-confirm-contract.js` 的 `exploreConfirmPayload()` 造；
		// 票 11：卡那一侧只把 `exit`（两条出口之一）递过来——收卷人已不随这一跳走（回卷动作写 meta）。
		//
		// ⚠️ **`action` 有意写在调用点、且必须是字面量**：`test-contract-action-catalog.mjs` 的
		// `workbenchActionProperty()` 只认「调用实参里唯一一个字面量 `action`」——那是它抓「工作台
		// 调用点 ↔ 契约面动作目录漂移」的全部强度。⛔ 不许把它收进上面的构造器（读不出就失败是那道闸
		// 的本义）；常量 `EXPLORE_CONFIRM_ACTION` 与这个字面量的同值由 `test-explore-points-merge.mjs` 对账。
		void postAction({
			action: "explore-confirm",
			...exploreConfirmPayload({ approved, feedback }),
		});
	};

	// 票 `confirm-points-redesign-build/05`：**站 3 那一个停点**的两颗键（`✅ 就按这几条办`／
	// `🔁 让 AI 重写这几条`）——⛔ 不合成 `confirmExplore`（那是站 2 那件事的另一颗键）。
	//
	// ⚠️ 它发的仍是 `explore-confirm` 这一个动作名，但**带一声 `stage: 'goal'`**：站 2／站 3 共用
	// `awaiting-explore` 这一个状态值，动作层按账本折出「现在是哪一件事」，而那一声是「这是站 3」
	// 的显式标记——不认的话，站 2 那颗键重复发一次就会把 AI 刚拟的几条**默默**认下来。
	// ⚠️ 载荷里的 `goals` 是**人在卡上编过的那一份**：机器用它原地重写 `工作区/目标-vM.md`
	// （下游读到的是人认下来的那一份，不是 AI 的原稿）。
	const confirmGoals = (approved, goals, note) => {
		void postAction({
			action: "explore-confirm",
			stage: "goal",
			approved,
			goals: Array.isArray(goals) ? goals : [],
			note: note ?? "",
		});
	};

	const confirmOutline = (approved, note, goldChapter) => {		void postAction({
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

	/**
	 * 知识点图上那两颗裁决键的入口（票 `knowledge-graph-build/08`）——**第三条「意见」通路**
	 * `graph-opinion` 的唯一工作台调用点。
	 *
	 * ⚠️ **只有通路认了才翻本地那一份划痕**（`json === null` ⇒ 什么都不改，界面那三档回到原样）：
	 * 这一行就是「改动走意见这条通路」这句话的落点——它是一条**通路**，不是一次本地 state 写。
	 * ⚠️ 划痕住在 `BookSessionScope`（书级 UI state）：**今天只活在界面上**——人的裁决产物
	 * （`工作区/knowledge-map-exclusions.json`）与覆盖闸门那两件归票 09，本票不落盘。
	 *
	 * @param {string} key 卡键（`cards[].key`）
	 * @param {string} verdict `KG_VERDICTS` 之一（`不讲` ＝ 划掉／`要讲` ＝ 放回来）
	 * @param {string} [reason] **理由档**（票 `confirm-points-redesign-build/10` 的第二个入口）：
	 *   `EXCLUSION_REASONS` 两档之一。框里那颗键传 `不需要`、图上那把**划子**传 `已经会`；
	 *   不传时服务端按 `不需要` 记（票 08 那条 `{key, verdict}` 载荷一个字不改）。
	 * @returns {Promise<boolean>} 通路认了吗（`KnowledgeGraphBlock` 按它决定改不改屏）
	 */
	const graphOpinion = async (key, verdict, reason) => {
		const guard = projection.capture();
		const json = await postAction({
			action: "graph-opinion",
			key,
			verdict,
			...(typeof reason === "string" && reason !== "" ? { reason } : {}),
		});
		if (json === null) return false;
		// 旧身份的那一次结果不落进新书（与 `postAction` 自己那条守卫同一口径）。
		if (!isBookCurrent(guard)) return false;
		// ⚠️ 划痕住在 `BookSessionScope`（书级 UI state）⇒ 经它的句柄写，与 `rollback` 那一处同一写法
		// （`bookUiRef.current?.set…`）：壳按 bookKey 重挂之后，旧句柄所在的组件早已卸载，迟到的写入
		// 被 React 直接丢弃，落不进新身份。
		bookUiRef.current?.setGraphDropped((prev) =>
			verdict === KG_VERDICTS.keep
				? prev.filter((one) => one !== key)
				: prev.includes(key)
					? prev
					: [...prev, key],
		);
		return true;
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

	/**
	 * 上传一份材料。`asName` 是**补传**那一半（票 `mineru-formats/03`）：用户为一份红源重新
	 * 挑了文件，而这一份要以缺口那一格的名字落上去——换了名字就是新材料，不是补传。
	 *
	 * ⚠️ **票 `pre-gold-build/02`：这里不再有 `role` 参数**（连带那条 `&role=` 查询串一起退役）
	 * ——上传那一刻还没有角色这回事，它由探查段开头的书级材料判定产出。
	 *
	 * ⚠️ **票 `confirm-points-redesign-build/03`：多了 `declared`**——站 1 那句**材料声明**
	 * （用户在这一屏勾的「我只上传有权使用的材料……」）。勾了才发得出去（`UploadArea` 灰着那颗键），
	 * 这里只把它原样交给服务端：由它落 `meta.materialDeclaration` ＋ **一条账**。
	 * ⛔ 本层**不替用户声明**（缺省 false ⇒ URL 上不带 `declared`，服务端一个字的声明都不落）。
	 */
	const uploadSource = async (file, asName = null, declared = false) => {
		// 上传前的最后一道：走**共享判据**（票 10 的 `judgeMaterialUploadSize`），与上传卡、
		// 补传那颗选择器**同一个**判据。本层只负责「拦」（抛错让界面记成失败），
		// 那句「为什么不拦/会先切开」的话由上面两层说——同一件事不许在屏上响两次。
		const verdict = judgeMaterialUploadSize({ name: asName ?? file.name, size: file.size, autoSplit });
		if (verdict.blocked) {
			const err = new Error(verdict.message);
			err.retryable = false;
			throw err;
		}
		// 上传本身**照旧发**：目标是进入时那本书的地址（`projectId` 取自这次 render），
		// 服务端已经收下的材料不会因为用户后来切了会话就不该落盘。守卫只管**之后**那一步：
		// 刷新与它的结果不许落到已经不在这儿的身份上。
		const guard = projection.capture();
		const bytes = await file.arrayBuffer();
		const name = asName ?? file.name;
		const url = `/textbook/upload?${sess()}&project=${encodeURIComponent(projectId)}&name=${encodeURIComponent(name)}`
			+ (declared === true ? "&declared=1" : "");
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

	// ⚠️ 票 `pre-gold-build/02`：这一段（`identifyRoles` ＋ 目录动作 `suggest-roles`）整条退役
	// ——上传屏不再有「角色」这一栏，那路识别只看得到文件名、判不出跨材料的权威层级。
	// 角色改由探查段开头那一趟**书级材料判定**产出（派发档 `material-survey`）。

	const convert = () => {
		void postAction({ action: "convert-start" });
	};
	/**
	 * 「删掉这份」（票 `mineru-formats/03` · `CONTEXT.md`「材料缺口」）：用户对**一份**红源
	 * 表态——承认缺这一份。动作名只此一处，且走 `postAction` 漏斗（它按目录过「工作台可调用」
	 * 那一扇门）；服务端只对 `failed` 的那一格开放，别的材料删不掉。
	 */
	const removeSource = (file) => postAction({ action: "source-remove", file });
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
		}).then((json) => {
			// 票 `token-banner/01`：**按服务端回包重算**横幅，而不是本地一律置 true——
			// 回包给的是同一条读序（settings 优先）算出来的三格，来源与脱敏值也一并对齐；
			// 失败（`postAction` 回 null）已经在动作漏斗上过屏，这里不替它宣告「已设置」。
			if (json === null || json === undefined) return;
			const next = json.settings;
			if (next !== null && typeof next === "object") {
				applyMineruSettings(next, true);
			} else {
				// 旧回包（只有 `{ok:true}`）：保存已经成功，至少要让横幅本轮消失。
				setMineruSet(true);
				setMineruSource(null);
				setMineruMasked(null);
			}
			setMineruResetOpen(false); // F20：保存成功后回到掩码态
			setMineruToken("");
		});
	};

	// 成品预览（交付卡/终检认可卡）：整本走右栏，不再把全文灌进卡片 <pre>
	// （票 03）。卡片的下载动作是另一条路（字节下载），不受影响。
	const previewBook = () => {
		openInSidebar("工作区/book.md");
	};

	// ⚠️ 这一段原先逐格现算的那八格（`lastEvent` / `checks` / `aiReport` / `progressDetail` /
	// `pendingStageLabel` / `humanTurn` / `needsConfig` / `stall`）**已于票
	// `depth-review-2026-10/08` 收进 `view-rules.deriveBookViewFacts`**，现在上面那次调用给出。
	// 取值口径逐字未变——其中进度详情仍只认「当前这一步」内的 progress（以最近一条 stage-start
	// 为界：源探查结束进设计关卡后，探查期的通读进度不再残留到「AI 干活中」状态条）。

	// 票 21 · P4 那条「转换已落终态」的判据随票 `ui-systematic-fixes/05` **搬到了上面**
	// （它要进 `resolveSurface` 的入参，而下面那几条 effect 也要先读到屏级判定）——
	// 判据本身一个字没动，见 `const conversionSettled` 那一处。
	// 候选 06：「阶段 / 步」只推导一次。`useMemo([meta, processSegs])` —— core / process 每次成功
	// commit 都会换新的 `meta` 对象与新的 `processSegs` 数组，对象身份正是「换了一份快照」的
	// 现有信号（两者现在都由同一份 snapshot 派生，所以这个信号只随真实 commit 变）。
	// `workFiles` **不进** projector（阶段/步产物读 `seg.artifacts`），它同样来自 snapshot。
	// ⚠️ 票 20：`subagentRuns.runningCount` 是第三个入参——章那几行凭什么说「我正在做」全由它决定
	// （判据函数与章节卡徽章共用 `view-rules.indexRunningChapterClaims`）。
	// 依赖挂的是**那个数**而不是 `subagentRuns` 对象：挂对象等于宿主每推一次会话摘要就重建整棵
	// 步模型（而那份摘要在轮询里也会换新身份），挂数则只在「在跑的小助手**真的增减了**」时重算。
	// ⚠️ 它必须是依赖、不许省：省了就等于清单比章卡慢一拍，两屏各说各的——正是票 22 记过的那个病。
	const runningSubagentCount = subagentRuns.runningCount;
	const stageStepProjector = useMemo(
		() => createStageStepProjector({ meta, segments: processSegs, runningSubagentCount: runningSubagentCount }),
		[meta, processSegs, runningSubagentCount],
	);
	const stageStepOverview = stageStepProjector.project({ kind: "overview" });

	// 建档向导那一支（旧判据：没有书又不加载）已并进 `surface.kind`：
	// 无书那一档由 `resolveSurface` 给出（`no-book`），下面 `simpleSurface` 按 kind 摆卡。

	// 错误条那句话：动作级错误（壳里那份 `error`）优先，没有才轮首屏的读取错误
	// （`loadError` 从 readiness 派生）。两者共用**同一句** `⚠️ …`，位置与从前一致。
	const visibleError = (ui) => (ui.error !== null ? ui.error : loadError);
	// 收口 review A6：动作级红字旁补一个**最小出口**「知道了」——它只清 `ui.error` 这一条，
	// ⛔ 不重试、不确认、不改任何动作语义。`loadError`（首屏读失败）**没有**这颗键：那条错误
	// 由 readiness 派生、清不掉，它自己的出口是读失败那一屏的「重试」（票 06）。
	const errorLine = (ui) => {
		const text = visibleError(ui);
		if (text === null) return null;
		return createElement(
			"p",
			{ style: S.error },
			`⚠️ ${text}`,
			ui.error !== null
				? createElement(
						"button",
						{
							type: "button",
							style: { ...S.smallLink, marginLeft: "8px" },
							onClick: () => ui.setError(null),
						},
						"知道了",
					)
				: null,
		);
	};
	// 「有新版可升」那一行。与 visibleError 一样**只在有话说的时候渲染**：`behind` 出句子，
	// `up-to-date`／`ahead`／`unreadable` 出 null——「已是最新」和「读不到」都不该占用户的眼睛，
	// 「本地比 registry 新」也没有一句对的话可说（见 `updateNoticeText`）。
	// 「层徽记」是同一处的另一半：跑的不是发布版时出短签（那时上面那句闭嘴，见
	// `updateNoticeText`）。两者**最多同时出一句**——各自的判据在另一档都返回 null。
	// 层由构建期注入的**包名**判（版本号两层都是 1.3.x，分不开），判据在 update-notice.js 里。
	const layer = classifyLayer({ packageName: INSTALLED_PACKAGE, version: INSTALLED_VERSION });
	const badge = layerBadge(layer);
	const updateNotice = updateNoticeText(useUpdateNotice(), layer);
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

	// 票 `reader-cognition-boundary-build/03`：读者情况问卷的两颗键（给出 / 收卷）。
	// ⚠️ 它们**不改书的状态、不推进流程**：只是把两件东西放进书夹（可选动作，⛔ 不是放行条件）。
	// 票 `ui-display-redesign/11`：收卷**此时才问「这份是谁填的」**——`answerer` 随这一发递出去，
	// 服务端写 `meta.answerer`／`meta.answererAt`（写点从 `explore-confirm` 挪来）。
	// 迟到的回包写进旧句柄会被「壳已按 bookKey 重挂」那条判据挡住（与 `graphOpinion` 同一写法）。
	const issueReaderQuestionnaire = async () => {
		const bookUi = bookUiRef.current;
		bookUi?.setReaderQuestionnaireBusy(true);
		// 票 `ui-display-redesign/17`（收口 review S7②）：**发一次新卷 ⇒ 本会话的「已收下」回执归零**
		// （票 11 之前是这么清的；那一行被删掉后未裁 ⇒ 这里恢复）。盘上事实（回卷件＋meta）不归这一发管：
		// 它们由投影快照决定，⛔ 这里不擦任何盘上读数。
		bookUi?.setReaderQuestionnaireSaved(false);
		bookUi?.setReaderQuestionnaireReceipt(null);
		try {
			const json = await postAction({ action: "reader-questionnaire-issue" });
			if (json !== null && typeof json.file === "string" && json.file !== "") {
				bookUi?.setReaderQuestionnaireIssued(json.file);
			}
		} finally {
			bookUi?.setReaderQuestionnaireBusy(false);
		}
	};
	/** 收卷：返回**收下了没有**（面板据此决定清不清输入框；⛔ 不把失败静默装成成功）。 */
	const submitReaderQuestionnaire = async (text, answerer) => {
		const bookUi = bookUiRef.current;
		bookUi?.setReaderQuestionnaireBusy(true);
		try {
			const json = await postAction({ action: "reader-questionnaire-submit", text, answerer });
			if (json === null || json.ok !== true) return false;
			bookUi?.setReaderQuestionnaireSaved(true);
			// 本会话的回执兜底：盘上那份快照会经 `projection.refresh()` 带回 `meta.answerer`／
			// `meta.answererAt`（回执的第一来源）；这一格只在「刷新还没到」的那一帧顶着，
			// ⛔ 不是第二份事实源。
			// 票 `ui-display-redesign/17`（收口 review F2）：回包**缺时刻就如实给 null**——
			// 修前这里 `new Date().toISOString()` 现造一个时刻，面板随即把它印成「今天 14:02」；
			// 「谁填的」也照回包缺就退回本次选的档（那一格用户在面板上亲手选过）。
			bookUi?.setReaderQuestionnaireReceipt({
				answerer: typeof json.answerer === "string" && json.answerer !== "" ? json.answerer : answerer,
				at: typeof json.answererAt === "string" && json.answererAt !== "" ? json.answererAt : null,
			});
			return true;
		} finally {
			bookUi?.setReaderQuestionnaireBusy(false);
		}
	};
	// 票 `ui-display-redesign/11`：「🧭 去看知识点图接着划」——**只做导航**：收起面板、把图上那一块
	// 滚进视野并把焦点交给它（⛔ 不发请求、⛔ 不替用户划任何一张）。目标优先用「清单与图合一」之后
	// 那块的把手 `data-kg-merged`，老版面退回 `data-kg-block`；无 DOM（react-test-renderer）时什么都不做。
	const goToReaderKnowledgeGraph = () => {
		bookUiRef.current?.setReaderQuestionnaireOpen(false);
		if (typeof document === "undefined") return;
		const focusGraph = () => {
			const block =
				document.querySelector("[data-kg-merged]") ?? document.querySelector("[data-kg-block]");
			if (block === null) return;
			if (typeof block.scrollIntoView === "function") block.scrollIntoView({ block: "start" });
			const firstKey = typeof block.querySelector === "function" ? block.querySelector("button") : null;
			if (firstKey !== null && typeof firstKey.focus === "function") firstKey.focus();
		};
		if (typeof requestAnimationFrame === "function") requestAnimationFrame(focusGraph);
		else setTimeout(focusGraph, 0);
	};

	// 门控（防御纵深，2026-09-20 放宽）：动态注册已确保页签只在「造书模式」或「盘上真有书」
	// 的会话出现。这里原来只认 sessionPreset === "textbook"，与注册侧口径不一致——于是老会话
	// （会话记录里没有 agentPreset 投影值、但盘上真有书）会出现「页签在、点进去一片空白」
	// （实测：测试1514《工业大数据分析》）。放宽为：预设名对得上就直接渲染；对不上但书已经
	// 取回来了也渲染。空窗期给一句话，不留空白——空白比「加载中」更让人发毛。
	// 预设门（票 `ui-systematic-fixes/05` 起由 `resolveSurface` 判）：非造书会话又**没有可画的书**
	// ⇒ 屏上只画一句话、**不挂工作台壳**（那一档是 `unreadable`，两句话由 `surface.copy` 给：
	// 在读时说「正在打开这本书…」，否则是那句兜底话）。
	// 票 24 ③ 的来历：这里原来 `return null`——**整块空白**，与上面那句注释自己写的「空窗期给
	// 一句话，不留空白」正相反（走查 2026-09-29 那一屏：用户原话「页面有问题」）。空白与「还在读」
	// 在人眼前分不开，所以宁可多一句：说清没画出来，并给出路（刷新）。**这一支是仓内唯一一处真的
	// 能把整块渲染成空的地方**，也是 `blankFocusText` 唯一的调用点（判据只有一份；那个调用点随本票
	// 搬进 `src/ui/surface.js`，理由见 rules.js 那节注释）。
	// ── 屏级出口（票 06）────────────────────────────────────────────────────────
	// 出口表由 `resolveSurface` 给（`exits`）；壳这一层只做两件事：按 `action` 接上**既有入口**、
	// 把它们画成真按钮。⛔ 不新增契约面业务动作（读面重试不写账本）：`read` 与 `book` 两个动作名
	// 都走书投影**既有的**公开入口——`refresh()`（再读一次）与 `selectProject(id)`（重试同一本），
	// 与动作刷新同一个入口（ADR-0021「动作刷新统一走 refresh() / selectProject(...)」）。
	// `book` 那一支拿不到 `projectId` 时退回 `refresh()`（宁可重读，也不静默换一本）。
	const runSurfaceExit = (exit) => {
		if (exit.action === SURFACE_RETRY_ACTIONS.book) {
			const lost = identityLostNow;
			if (lost !== null && typeof lost.projectId === "string" && lost.projectId !== "") {
				void projection.selectProject(lost.projectId);
				return;
			}
		}
		void projection.refresh();
	};
	/** 把一份出口表画成按钮（`why` 进悬停提示：屏级那一句人话已经在 `copy` 里说清了）。 */
	const surfaceExits = (exits) =>
		exits.length === 0
			? null
			: createElement(
					"div",
					{ style: S.bar },
					exits.map((exit) =>
						createElement(
							"button",
							{
								key: exit.id,
								type: "button",
								title: exit.why,
								style: S.bigBtn(true),
								onClick: () => runSurfaceExit(exit),
							},
							exit.label,
						),
					),
				);

	if (bareSurface) {
		return createElement(
			Fragment,
			null,
			createElement(
				"p",
				{ style: { ...S.hint, padding: "16px" } },
				surface.copy,
			),
			createElement(
				"div",
				{ style: { padding: "0 16px 16px" } },
				surfaceExits(surface.exits),
			),
		);
	}

	// 顶栏介入工具条（布局 A：地图栏与焦点区之上；只在有活动书时出现——无书时是向导/加载态）。
	const topBar = hasBookSurface
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
	const simpleSurface = (ui) => {
		// MinerU Token 卡的**同一份接线**两个位置共用（无书屏在卡片之后；其余单屏保持原位）。
		const mineruCard = (options = {}) =>
			createElement(MineruTokenCard, {
				mineruSet,
				mineruToken,
				mineruSource,
				mineruMasked,
				busy: ui.busy,
				onTokenChange: (e) => setMineruToken(e.target.value),
				onSave: saveMineruToken,
				resetOpen: mineruResetOpen,
				onToggleReset: () => setMineruResetOpen((v) => !v),
				...options,
			});
		return createElement(
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
				// 运行中或有待办时后端一律 409（「我正在做；要改历史请先等交工（或先 ⏸ 暂停）」）。
				// ⚠️ 票 `demo-channel-full/17` 起演示书那颗键**看得见**（原先它整颗不出），但点下去
				// **不会重做任何东西**——拿回的是那句告知（`actions/deep-modify.js` 的
				// `DEMO_DEEP_MODIFY_NOTICE`）。⇒ 下面这句提示里的「等 AI 停手就能改」**只对真书成立**；
				// 演示书上那句话还剩一处候选遗留（要不要也改，见票 17 的 `## Answer`，本票⛔ 没动它）。
				// 文案把出路直接说给用户。
				"一个会话造一本书。轮到你来定的时候，界面会亮 ⚡ 提醒你；定过的都存着，等 AI 停手（或你先点 ⏸ 暂停）就能改。",
			),
			// ⚠️ 票 `ui-display-redesign/01`：**无书那一屏**的 MinerU 卡改由下面那个分支摆在
			// 建书卡之后（spec §2.1 的第 12 块，默认折成一行）——这里只留其余单屏的原位。
			// 票 `ui-display-redesign/21`（spec §2.19–2.21）：其余单屏（加载中／读失败／身份失效）
			// 的 MinerU 卡也**默认折**（今天整张常显）。已设置那一支折成一行脱敏读数＋「重新设置」，
			// 未设置那一支折成一行提示＋`<details>` 里的原表单；展开后的行为一个字不改。
			surface.kind === "no-book" ? null : mineruCard({ collapsed: true }),
			visibleError(ui) !== null
				? errorLine(ui)
				: null,
			updateNotice === null
				? null
				: createElement("p", { style: S.update }, `🆕 ${updateNotice}`),
			// 单屏那几档（票 `ui-systematic-fixes/05` 立，票 `06` 补异常态出口）：无书 ⇒ 向导卡；
			// 其余按 `kind` 摆：有句子就印句子，有出口就摆按钮（读失败/身份失效/加载超时那几档）。
			// ⚠️ 读失败那一屏**不摆向导**（`kind` 不是 `no-book`）——把人引向再建一本正是 06 要治的病。
			surface.kind === "no-book"
				? createElement(
						Fragment,
						null,
						createElement(WizardCard, {
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
						}),
						// 票 `ui-display-redesign/01`：MinerU 卡默认折成一行（**未设置那一支**；
						// 展开仍是今天的完整表单、行为不变），摆在建书卡之后、推广块之前。
						// 票 `token-banner/01`：已设置那一支保留完整卡（它要印来源与「重新设置」），
						// 所以折叠只对未设置生效——阶段一那一处才需要「已设置也折一行」。
						mineruCard({ collapsed: mineruSet !== true }),
						// 推广块默认折、最底那一块（内容与今天逐字相同，只是默认态与位置）。
						createElement(PromoFoldBlock),
					)
				: createElement(
						Fragment,
						null,
						// 票 `ui-display-redesign/21`（spec §2.19–2.21）：屏级问句 → 事实句（`copy`，
						// 加载中那一档带已等秒数）→ 加载中那句说明。问句的字面量住在
						// `src/ui/surface.js`（`src/ui/**` 才在判定线① 的用词扫描面里），这里只摆位置。
						// ⛔ bare 支不经过这一段（那条早退只画一句话＋出口，没有问句、没有壳）。
						surface.question === null
							? null
							: createElement(
									"p",
									{ style: { margin: "0 0 4px" } },
									createElement(
										"strong",
										{ style: CARD_HEAD_QUESTION_STYLE },
										surface.question,
									),
								),
						surface.copy === null
							? null
							: createElement("p", { style: S.hint }, surface.copy),
						surface.note === null
							? null
							: createElement("p", { style: S.hint }, surface.note),
						surfaceExits(surface.exits),
					),
		);
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
							graphDropped,
							showStylePanel,
							showIntervenePanel,
							patternOpen,
							patternBusy,
							patternResult,
							patternList,
							// 票 `reader-cognition-boundary-build/03`：读者情况问卷面板的书级状态。
							readerQuestionnaireOpen,
							readerQuestionnaireBusy,
							readerQuestionnaireIssued,
							readerQuestionnaireSaved,
							// 票 `ui-display-redesign/11`：本会话刚收下那一帧的回执（盘上快照到时由 `meta` 接管）。
							readerQuestionnaireReceipt,
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
							setReaderQuestionnaireOpen,
							setDeletingId,
							// ⚠️ 票 `knowledge-graph-build/08` 的 `setGraphDropped` **刻意不在这里解构**：
							// 它只由 `graphOpinion` 那一处经 `bookUiRef.current?.setGraphDropped(…)` 写
							// （与 `rollback` 同一写法——迟到写入要能被「壳已重挂」那条判据挡住）。
						} = ui;
					// ── 焦点区里这一次屏级判定（票 `ui-systematic-fixes/05`）──────────────
					// 上面壳外那一次拿不到 `viewPhase` / `browsing` / `showHistory` / 动作级 `error`
					// （它们就是这个壳的 state），所以只判到「有书」；这里拿真值再算一次，得到的 `kind`
					// 决定焦点区摆哪一棵（现在／浏览某一步／某一阶段的页面）。
					// ⚠️ 判定实现仍然只有 `src/ui/surface.js` 一份——两处都只是**消费**，不是各判各的。
					const screen = resolveSurface({
						...surfaceInput,
						viewPhase,
						browsing,
						showHistory,
						uiError: ui.error,
					});
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
						// ⚠️ 票 `depth-review-2026-10/08`：判据模板（倒着找最后一条某类型事件）与
						// `view-rules.lastEventOfType` 共用，**但数据源刻意不并进壳级派生**——
						// 渲染期那份 `deriveBookViewFacts` 读的是**当前这一帧的 `events`**，而这里是
						// latest ref（可能已经更新）。改读渲染期那份会引入一个真实的时序差异，
						// 所以「共用判据」不等于「共用数据源」。
						const lastProgress = lastEventOfType(
							bookRef.current.core.data?.events ?? NO_EVENTS,
							"textbook/progress",
						);
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
					// ── 卡片 props 契约（票 `workbench-card-contract` 02）────────────────────────
					//
					// 「这张卡吃什么」写在**卡自己的域文件**里（`src/ui/card-view.js` 的 `defineCardView`），
					// 壳只负责把「当前这本书 + 接线」递过去。下面这一块**就是**那本书的壳侧视图：焦点区 12 张
					// 主卡的 props 袋不再由这个文件逐项手抄。
					//
					// ⚠️ **为什么不 `useMemo`**：这份袋**每帧重建，这是对的、不是偷懒**。
					//   · `postAction` 没有 `useCallback`，每帧新引用，且闭包捕获 `projectId`——记忆化一次，
					//     动作请求就会带上**上一本书**的身份。今天靠「每帧新建」天然免疫，收编后这层免疫消失，
					//     所以**不许**挂 `useMemo`。
					//   · `stageStepProjector` 的 `useMemo` 三依赖之一 `runningSubagentCount` 来自宿主会话状态，
					//     **不在 `book` 里**——`book` 引用没动它就换了身份。
					//   · `busy` 是 `BookSessionScope` 的**可变** UI state，记忆化会把 12 张卡的置灰冻结在第一次
					//     渲染的那个值上。
					// 换句话说「同一个 `View` 上两次取同一 slot 是同一引用」这条记忆化只活在**一次渲染内**，而
					// 一次渲染本来就只需要它一次。今天每次渲染也是新建一个 props 字面量，逐帧重建因此是
					// **行为保持**的。
					//
					// ⚠️ **键名一律用 book 侧的标识符**——这一列是 `card-view.js` 未知键闸认的那一列。
					// **一个名字不许两处来源**：两张卡的 prop 名撞车时（`ExploreConfirmCard` 与
					// `OutlineConfirmCard` 都叫 `onConfirm`，壳里却是两个不同的动作），book 侧用不撞名的键，
					// 卡侧的 prop 名由那张卡的 `derive` 整形出来。
					//
					// ⚠️ **键名表不在这个文件里**（票 `gallery-realign/01`）：这一袋有哪些键由
					// `src/ui/card-book.js` 的 `CARD_BOOK_GROUPS` **只声明一处**。
					// ⚠️ **值也不在这个文件里算**（票 `depth-round-3/02`）：值由 `src/ui/card-book-derive.js`
					// 的 `deriveCardBook` 从**三个命名输入**里算——壳与画廊的下钻适配器递的是**同一份**
					// （同名不同源那一类静默，就是这一条收掉的）。壳这一侧只摆这三样：
					//   · `snapshot`：`book` 这一份投影快照（书级只读数据 ＋ `projectId`）；
					//   · `shellState`：只有壳知道的那几位 ＋ 上面那次 `deriveBookViewFacts` 里进袋的七格；
					//   · `wiring`：回调组与产物读取那三件。
					// 少给一位时 `deriveCardBook` **当场抛并点名**——漏传会读成 `undefined`，
					// 而构造器认显式 `undefined` 为合法（＝「这一位没有」），所以那一侧另有一道闸。
					const cardBook = deriveCardBook({
						snapshot: book,
						shellState: {
							busy,
							// 票 `ui-display-redesign/20`：`deletingId` 已随删书一步退役出卡片袋；
							// 底栏小条自己的两步确认仍读壳里那一格，不进 `deriveCardBook`。
							contextPercent,
							// 票 20：此刻真在跑的小助手有几个（与顶栏「🔎 N 个小助手在跑」同一份读数）。
							runningSubagentCount,
							// 「没在回看任何一步」是**显式的 null**，不是「键不存在」——卡内高亮判据写的正是
							// `browsingKey !== null && browsingKey === row.key`，那个 `!== null` 指的就是这一格。
							browsingKey: browsing,
							gateOpen,
							setGateOpen,
							// 票 `mineru-formats/03` ＋ 票 10：上传卡那两个输入之一（`false` = 不许承诺会自动拆）。
							autoSplit,
							// 票 `knowledge-graph-build/08`：知识点图上那一份划痕（**本会话**的那一段；
							// 票 09 起真正长命的那一份是 `knowledgeMapExclusions`）。
							graphDropped,
							// 票 `confirm-points-redesign-build/10` ＋ `rcb-build/04`：站 2 问卷那一块的两件输入 ──
							// ⚠️ 两件都必须**显式给出**「这一位没有」（`[]`／布尔），⛔ 不是漏传：
							// 卡契约对「袋里压根没有这个键」是响亮拒绝。
							// · `predrawnLowerBoundary`：预画的下沿（问卷／分组面 → 图）。生产上今天**恒为空表**
							//   （回卷那一半归 rcb 的票 06／10）⇒ 给的是同一档真值，不是占位。
							predrawnLowerBoundary: [],
							// · `readerQuestionnaireSaved`：票 03 那个面板是否已收下回卷——**本会话**的回执，
							//   切书／重挂即归零。下钻每张卡都是新挂的一次 ⇒ 那边如实值是 `false`。
							readerQuestionnaireSaved: readerQuestionnaireSaved === true,
							// ── process 提交的清除信号（票 `depth-round-3/02` 收口 review A1）──
							// 它由**壳自己**那枚 latest-ref 推进（上面「process commit token」那一段：
							// 引用不等 ＋ 内容确实变化才 ＋1），派生层原样递进袋子——⛔ 不是按
							// `process.data` 内容无条件签出来的。它只回答「来没来新一份提交」，
							// 所以值域是一个计数、不承载内容。
							processToken,
							// ── 阶段 / 步视图模型与导航：全览条与阶段页共用这一份 projector ──
							// ⚠️ 它**不是**模块级单例：`useMemo` 的三个依赖之一 `runningSubagentCount` 来自
							// 宿主会话状态，**不在 `book` 里**——`book` 引用没动它就换身份。这也是上面「袋每帧重建」
							// 那条理由的一半。
							projector: stageStepProjector,
							// ── 上面那次 `deriveBookViewFacts` 里**进袋**的七格（`humanTurn` 不进袋）──
							// 键名一律用 book 侧的标识符（`card-view.js` 的未知键闸认的就是这一列）；
							// ⚠️ `needsConfig` **不是**壳里那个局部名也无妨：这一位在卡契约里**不**必填，
							// 写错键名不会抛、只会让状态卡那一行静默空着——所以判据是「袋里的键名」。
							checks,
							aiReport,
							lastEvent,
							needsConfig,
							pendingStageLabel,
							progressDetail,
							stall,
						},
						wiring: {
							// ── 回调组（值不共用：画廊那边一律空实现）──
							postAction,
							onDecide: decide,
							onRollback: rollback,
							onAddPattern: analyzePattern,
							// 票 `walkthrough-fixes/19`②③：那个旋钮的现状由派生层从 `meta` 取，
							// 这里只给它的写回口（票 `confirm-points-redesign-build/03` 起没有 `lengthPreset`）。
							onSetKnobs: setKnobs,
							onSkipStep: skipStep,
							onUpload: uploadSource,
							onConvert: convert,
							// ⚠️ 票 `mineru-formats/03`：材料不齐时「补传这一份」沿用上传写面但**以缺口那一格
							// 的名字**落上去，「删掉这一份」走 `source-remove`（只对 `failed` 的那一格开放）。
							onReplaceSource: (file, source) => uploadSource(file, source.file),
							onRemoveSource: removeSource,
							// 票 `demo-channel-full/02`：演示书停在阶段一那一屏的「▶ 开始演示」——**唯一**一处
							// `demo-run` 的**继续**模式调用点（建书那一跳在向导卡上，走默认模式）。
							onDemoNext: () => postAction({ action: "demo-run", mode: "next" }),
							onResume: resume,
							onPreview: previewBook,
							onApprove: () => {
								void postAction({ action: "final-approve", approved: true });
							},
							onReject: (note) => {
								void postAction({ action: "final-approve", approved: false, note });
							},
							onDeleteConfirm: () => deleteBook(projectId),
							// ⚠️ 两个「确认」回调**故意不撞名**：两张卡的 prop 都叫 `onConfirm`，指向的却是两个
							// 不同的动作。合成一个（按 `focusCardKey` 三元挑）等于把一处手对的接线藏进这个文件。
							confirmExplore,
							// 票 `confirm-points-redesign-build/05`：**站 3 那一个停点**那一对键的回调。
							// ⚠️ 与上面那两颗**第三个**「确认」回调同样故意不撞名。
							confirmGoals,
							confirmOutline,
							// 票 `knowledge-graph-build/08`：知识点图上那份划痕唯一的入口（第三条「意见」通路
							// `graph-opinion`）。⛔ 不走 `confirmExplore` 那条闸门线。
							onGraphVerdict: graphOpinion,
							// · `onOpenReaderQuestionnaire`：打开票 03 那个发卷／收卷面板——卡上「答问卷」那条
							//   出口只做**入口**，⛔ 不重做那套通道。
							onOpenReaderQuestionnaire: () => setReaderQuestionnaireOpen(true),
							onViewReport: () => viewWork({ path: "工作区/explore.md", label: "读材料报告" }),
							onSuggestWords: async () => {
								const guard = projection.capture();
								const json = await fetchJson("/textbook/action", {
									method: "POST",
									headers: { "Content-Type": "application/json", Accept: "application/json" },
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
							// ── 产物读取（票 03：地址拼装归 `ui/artifact-read.js`）──
							readArtifact,
							downloadHref: artifactReader.downloadHref,
							// 票 20：`fetchText` 刻意不加 capture 守卫（见 `gold-table.js` 契约那一段）。
							fetchText: artifactReader.readText,
							// ── 章节卡（`ChaptersCard`）：书级数据 ＋ 三条入账出口的接线 ──
							onApproveAll: () => {
								void postAction({
									action: "chapters-review-confirm",
									approved: true,
								});
							},
							// ⚠️ 与源探查那张卡的 `onViewReport` **是两个不同的闭包、两个键**（`工作区/chapter-NN.md`
							// vs `工作区/explore.md`）。不许合并成一个——那会把一处手对的接线藏进壳里。
							onView: (n) =>
								viewWork({
									path: chapterRel(n),
									label: `第 ${n} 章`,
								}),
							submitReview,
							// 账本回放列表（`ReplayList`）：「打开产物」那个收口（产物判据 → DSH 右栏）。
							onViewRow: viewWork,
							// ── 全览条（`ProgressOverview`）的壳-local 导航接线 ──
							onPickStep,
							onPickPhase,
							// ⚠️ 壳里写的是 `onOpen: openInSidebar`：book 侧用壳里那个标识符，卡侧的 prop 名 `onOpen`
							// 由 `phasePageView` 的 `derive` 整形（同一个「打开」语义在这份壳里还有别的闭包）。
							openInSidebar,
							// 定点修改与撤销（票 11：两下都**不换屏**，只就地改／就地撤；撤销那一下同理）。
							onDeepModify: (segKey, note) => {
								void postAction({ action: "deep-modify", segment: segKey, note });
							},
							onDeepUndo: () => {
								void postAction({ action: "deep-undo" });
							},
							// 票 `knowledge-graph-build/12`：老书那颗「补一份知识点图」的键——**唯一的出口**。
							// 发的是契约面动作目录里那个规范名（漏斗 `postAction` 自己过 `uiCallable` 的门），
							// 成功那一趟由漏斗统一 `projection.refresh()` ⇒ 合并件里有图之后，阶段页那张卡
							// 自己就换成「图那一块」（键随之消失）。⛔ 壳里不做第二份可见性判定。
							onBackfillGraph: () => postAction({ action: "knowledge-graph-backfill" }),
						},
					});
					// slot 表只声明一处：`src/ui/card-routing.js` 的 `CARD_ROUTING`（一行 = 一个 slot）。
					// ⚠️ 其中四行 `routedBy: null`（progressOverview／replay／phasePage 两个 mount 点）
					// **不是** `focusCardKey` 路由出来的，但仍是这里的 slot——表上那四行各自写清 `mount`。
					const cardView = createCardView(cardBook, slotsFromTable());
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
// 票 02：`renderPhasePage(overrides)` 这个局部 helper **随本票退役**。
// 它是 props 袋分叉逼出来的补丁：两个 mount 点共用 13 项、差异只有三个键，于是壳把重复那
// 13 项收进一个闭包、把差异当 `...overrides` 摊开——代价是「这张卡吃什么」既不在卡里、也不在
// 一处看得见的表上，而是散在一个 helper 与两行调用点之间。
//
// 现在那 13 项归 `src/ui/phase-page.js` 的 `phasePageView`（**声明在卡自己的文件里**），两个
// mount 点各自 `cardView.phasePageBrowse` / `cardView.phasePagePhase` 登记**同一个** builder，
// 差异三项走 `.with({...})`——那三个键登记在契约的 `defaults` 里，所以 `.with` 改得动它们。
//
// **两个 mount 点仍保留、位置一动不动**（阶段片 → 浏览态页 → 三个展开面板 → 阶段页态页）：
// 面板夹在两页面点之间是 CONTEXT「阶段片」修订③ 与 ADR-0012 末条写下的**位置契约**，
// 合并渲染点＝可观察行为变化。位置由 `test-wording-invariants.mjs` 那组源码级断言钉着。
						// 票 `ad-strip-occlusion/02`：这里返回 **两支**（滚动容器 ＋ 常驻小条），
						// 用一个不产生 DOM 节点的 `Fragment` 包住——小条因此落在滚动容器**外面**，
						// 与下面那条广告同列、排在它之前。为什么不并成一个 div：多那一层就是一次布局层级变化
						// （票 `layer-badge` 那组断言按**直接子节点**排位），`Fragment` 让 DOM 形状一个节点都不多。
						return createElement(
						Fragment,
						null,
						createElement(
						"div",
						{
							// 焦点区滚动容器要能**量**自己（`getBoundingClientRect` / `clientHeight`
							// / `scrollTop`），票 24 的「把那张闸门卡带进可视带」据此写 scrollTop。
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
								// ⚠️ 这一段下边距曾按吸底条自身的高度给过（`stickyBox.paddingBottom + 12`），
								// 随那条一起删掉了（票 18 裁决 B：屏上同一颗推进键渲染了两次）。
								padding: "12px 16px",
							},
						},
						// 全览条：全书几步、还剩几步、现在在第几阶段 + 展开清单（收起时不渲染清单内容）。
						// 只在「现在」那一屏出现——回看某一步时，用户手里已经有那一步了，
						// 再顶一条全览是把"手里的东西"往下挤（展开体会往下顶，别顶两份）。
						// 候选 06：只传 `projector`——抬头 / currentPhaseText / 分组清单全部来自模型的
						// overview projection，组件不再自己推导（旧的 segments/meta/currentPhase props 已迁）。
						screen.kind === "now"
							? createElement(ProgressOverview, cardView.progressOverview)
							: null,
						// 自动跟随横幅（F5 方案 A）：等拍板强制回「现在」（6 秒自清）；浏览历史时 AI 有新进展（点击清浏览回现在）。
						awaitBanner
							? createElement(AutoFollowAwaitNote, {
									onClose: () => setAwaitBanner(false),
								})
							: null,
						progressBanner && screen.kind === "browsing"
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
								{ style: { fontSize: "13px" } },
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
									// 票 `demo-channel-full/26`：这一句对演示书是假话（演示支回的是占位卡，
									// 不是 AI 分析出来的）⇒ 两取值，出口在 `view-rules`。
									title: patternPastePlaceholder(meta),
								},
								"🧩 自定义模式",
							),
							// 票 `reader-cognition-boundary-build/03`：读者情况问卷的常驻入口（同一排小键）。
							// ⚠️ 它**不按书的状态门控**：这是入口不是闸门；没有知识地图的书点下去会拿到一句
							// 说清的 409（「还没有知识地图」），⛔ 不假装发得出去。
							createElement(
								"button",
								{
									style: S.smallLink,
									onClick: () => setReaderQuestionnaireOpen(true),
									title: "给收卷人一份问卷（.md）：可以打印手写、也可以在电脑上改；填完把文字粘回来",
								},
								"🧑‍🎓 读者情况问卷",
							),
						),
						// MinerU Token 卡：**未配置**时是那张「还差一步」的引导（展开填）；
						// 票 `token-banner/01` 起**已配置**时也留一行折叠提示——那一行要说出
						// 「来源：设置 / 环境变量」（D③=A：用户得知道现在用的是哪一路）。折成
						// `<details>` 的一行，不再把首屏让给配置；无书向导那一处仍是完整卡片。
						// 票 21 · P4：转换一落终态（`conversionSettled`）也让这张卡退场——转换成功
						// 本身就是「服务端读得到 token」的证明（`resolveMineruToken` 那条路）。
						// 票 `ui-systematic-fixes/08`：演示书**不摆**（它压根不转换，见
						// `src/demo-exemptions.js` 的 `phase1-no-real-conversion`）。
						// ⛔ 不改转换逻辑、⛔ 不动豁免登记：这里只是「摆不摆、怎么摆」。
						!isDemoBook(meta) && !conversionSettled
							? createElement(MineruTokenCard, {
									mineruSet,
									mineruToken,
									mineruSource,
									mineruMasked,
									busy,
									onTokenChange: (e) => setMineruToken(e.target.value),
									onSave: saveMineruToken,
									resetOpen: mineruResetOpen,
									onToggleReset: () => setMineruResetOpen((v) => !v),
									collapsed: true,
								})
							: null,
						visibleError(ui) !== null
							? errorLine(ui)
							: null,
						updateNotice === null
							? null
							: createElement("p", { style: S.update }, `🆕 ${updateNotice}`),
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
								screen.kind === "browsing"
									? viewPhaseOfBrowsing
									: screen.kind === "phase-page"
										? viewPhase
										: null,
							// 候选 06：阶段片 hover 的「这一步有几份文件」取 overview projection 的
						// `artifactEntryCountByPhase`（按分段条目累计，与阶段页按路径去重的
						// `uniqueFileCount` 是**有意不同的两个事实**——不静默统一，见 spec）。
						// ⚠️ **阶段 1 那一格不吃这一份**：它没有分段，按分段累计恒为 0，于是那一格
						// 此前恒说「还没有文件」而同屏卡上列着材料（票 walkthrough-2026-10/03）。
						// 它数的是材料，读数由 `materialCount` 单独给（同一份 projection 里）。
						artifactCountOf: (n) => stageStepOverview.artifactEntryCountByPhase[n] ?? 0,
						materialCount: stageStepOverview.materialCount ?? 0,
							onSelect: phaseBarSelect,
						}),
						// 右栏挤压时的一句提示（票 26 / P27 ＋ P37）：**纯提示**，不可点、不发动作、
						// 不换屏——收起右栏是宿主顶栏那颗按钮的事，本票只指路，布局一个字不动。
						// 条件＝主区窄于阈值 **且** 主区右边**没有顶到视口右边**（判据在
						// `narrowMainHintShown`，纯函数）。⚠️ 2026-10-06（票 walkthrough-2026-10/08）：
						// 第二个条件**不是**「右栏开着」的判别者——收起态主区被 `W + 32` 封顶又水平居中，
						// 右边也留着 144px（见 `chapters-map.js` 里 `SIDEBAR_OPEN_RIGHT_GAP` 的注释）；
						// 真正的判别者是宽度那一支。
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
						screen.kind === "browsing"
							? createElement(PhasePage, {
									// ⚠️ `key` 写在**袋外面**、与它并列：React 建元素时就把 `key` 摘走，
									// 组件 `props` 上永远没有它——它压根不是这张卡的 props（票 02）。
									// 换个身份（`seg-${browsing}`）是为了让那棵子树整棵重挂，票 05 的隔离边界靠它。
									...cardView.phasePageBrowse.with({
										phase: viewPhaseOfBrowsing,
										focusedStep: browsing,
									}),
									key: `seg-${browsing}`,
								})
							: null,
						// 顶栏 🎨 风格线 / 📮 留言 展开面板（Task 17 常驻入口；点开即见清单，再点或 ✕ 收起）。
						// 它们也算「内容」：一律排在阶段片之后——开一个面板不该把常驻导航面顶下去
						// （票 phase-bar-position/01 顺手把这条顺序收拢；面板的高度不受控，尤其模式库那张）。
						showStylePanel
							? createElement(StylePanel, {
									notes: styleNotes,
									// 票 `demo-channel-full/26`：面板里那两句要认得出演示书（两取值）。
									meta,
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
									// 票 `demo-channel-full/26`：面板里那段说明要认得出演示书（两取值）。
									meta,
									onAnalyze: analyzePattern,
									onClose: () => setPatternOpen(false),
								})
							: null,
						// 票 `reader-cognition-boundary-build/03`：读者情况问卷面板（给出 → 手粘回卷）。
						// 票 `ui-display-redesign/11`：三态（发卷／回卷／已收卷）；回执的第一来源是**盘上事实**
						// ——`returned`（`/textbook/events` 下发的回卷件原文）＋ `meta.answerer`／`meta.answererAt`，
						// 所以刷新/切书回来仍是同一份回执；`receipt` 只兜「本会话刚收下、快照还没到」那一帧。
						// ⚠️ 顺序与上面几个面板同一档：排在阶段片之后（开面板不把常驻导航面顶下去）。
						readerQuestionnaireOpen
							? createElement(ReaderQuestionnairePanel, {
									issued: readerQuestionnaireIssued,
									returned:
										book.core.data !== null
										&& typeof book.core.data.readerQuestionnaireReturn === "string"
										&& book.core.data.readerQuestionnaireReturn.trim() !== "",
									answerer: meta?.answerer ?? null,
									answererAt: meta?.answererAt ?? null,
									receipt: readerQuestionnaireReceipt,
									busy: readerQuestionnaireBusy,
									// 下载地址的拼装归 `ui/artifact-read.js`（通用下载路由），本面板只给一个 rel。
									downloadHref: artifactReader.downloadHref,
									onIssue: issueReaderQuestionnaire,
									onSubmit: submitReaderQuestionnaire,
									// 「去看知识点图接着划」：只做导航（收起面板＋滚到图上那块），⛔ 不发动作。
									onGoToGraph: goToReaderKnowledgeGraph,
									onClose: () => setReaderQuestionnaireOpen(false),
								})
							: null,
						// 阶段页：这一步走到哪、这一阶段有哪几步、每一步产出了哪些文件。
						// 产物一律由卡片里写着「打开」的按钮交给右栏（导航本身不开文件）。
						screen.kind === "phase-page"
							? createElement(
									PhasePage,
									// ⚠️ 这一处**不传 `key`**：它是「阶段页态」那一屏，身份由 `viewPhase` 决定，
									// 与浏览态那处不是同一棵子树（浏览态那处带 `key`，切步即整棵重挂）。
									cardView.phasePagePhase.with({ phase: viewPhase, events }),
								)
							: null,
						// 状态条：spec 不变量 10——回看时不摆"现在"的内容（状态条 / 活性行 /「现在」主卡
						// 一律收起）。2026-09-22 票 03：旧门控只看 `viewPhase`，于是**浏览态**
						// （`browsing` 非空，全览条点一步进来）下状态条还在渲染——补上这一半。
						screen.kind === "now"
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
						screen.kind === "now"
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
						//
						// 票 24：这一格外面那层 `div` **只为挂一个 ref**（量它自己的盒子，好把拍板/认可
						// 那张卡带进焦点区可视带——见上面那条 effect）。它没有样式，布局与从前逐像素相同。
						(() => {
						if (screen.kind !== "now") return null;
						const card = (() => {
							// 焦点区主卡路由（键 → 表上那一行 → 那一行的组件与 slot）。
							// `focusCardKey`（view-rules.js）仍只回答「哪一个键」；「键对应哪张卡」只住
							// `card-routing.js`。⛔ 这里不写兜底分支：`focusCardKey` 是全函数，
							// `rowFor` 未命中时落表上 `arm: "default"` 的 `status` 那一行。
							const row = rowFor(focusCardKey(meta, gate));
							return createElement(row.component, cardView[row.slot]);
						})();
						// 这一层是**纯测量壳**：没有样式、不参与排版之外的任何事（票 24 ①）。
						// ⚠️ 这里**刻意没有**「这一格空了就摆兜底句」的分支：`focusCardKey` 是全函数
						// （十个返回值每一个都有卡——表上 `routedBy` 非 null 的 10 行；取样：
						// `node --input-type=module -e "import {focusCardKey} from './src/ui/view-rules.js'; import {focusCardKeysOf} from './scripts/source-scan-base.mjs'; console.log(new Set(focusCardKeysOf(focusCardKey)).size)"`），
						// 那种分支今天走不到，只会造出一条「形状断言冒充行为断言」的假绿。兜底句只挂在
						// 真正能把整块渲染成空的那一窗（见上面 ③）。
						return createElement("div", { ref: nowCardRef }, card);
					})(),
					// 「之前的过程」是现场的账本回放（与"我正在看哪一步"无关），阶段页上不摆它。
						screen.kind !== "phase-page"
							? createElement(
							"div",
							{ style: { margin: "8px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" } },
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
							// 层徽记的落点（票 layer-badge）：这条小条的**右端**。
							// 位置是按「不让它抢现场」定的，不是按「哪有空位」——原先摆在阶段片下面
							// 第一行时，一句四十来字的话在窄栏里折成三五行，那不是提示是噪声。
							// 现在上屏的只有短签，长解释进 `title`（见 layerBadge 的注释）。
							// 另两条边界写在判据那边：它排在阶段片之后（`smoke-test.mjs` 2d-3d 的
							// SMALL_CHROME 白名单只管阶段片之前的直接子节点），且只在有书的
							// 「现在」那一屏有这一条小条——没建书时没有要提醒的现场。
							badge === null
								? null
								: createElement("span", { style: S.smallLink, title: badge.hint }, badge.label),
						)
							: null,
					screen.kind !== "phase-page" && showHistory
						? createElement(ReplayList, cardView.replay)
						: null,
						// 「📄 第一步 · 材料准备」那张抽屉已并入阶段页（点阶段片第 1 格 ＝ 那一步的页面，
						// 摆材料清单与转换状态）；现场的上传卡仍在（当前阶段那格＝回到现在）。
						// 抽屉的唯一入口正是阶段片第 1 格，入口改道后它成了不可达的死代码，故删除。
						// ⚠️ 底部常驻小条**不在这里**：它是这条滚动容器的**兄弟**（在下面与广告之间），
						// 理由见那一处的注释（票 `ad-strip-occlusion/02`）。
						// 票 20（走查 P3）曾在这里渲染焦点区**吸底决策条**（滚到哪一段都在，就近再给一次那颗推进键）。
						// **已按票 18 的裁决整条删掉**（2026-10-04 用户选 B）：真机走查拍到的那一屏里，卡内那颗推进键与
						// 条上那颗**同名键渲染了两次**，下面那次孤零零地右对齐挂在卡片外面（用户原话：「满意的那行位置不对」）。
						// 落点①要求那颗副本**从 DOM 里删掉**（隐藏或 `visibility` 都不算——那份仍在 DOM 里，键盘 Tab 还能
						// 走到它），所以连条带键一起删，不留空壳：那层 sticky 底栏留着就是另一种噪音。
						// ⚠️ 随之**重新变成未修**的是票 20 那个病本身（那颗键仍在容器内 `top 2926`，要滚过约 2.9 个视口
						// 高度）。**2026-10-06 那一票裁了方向一：读材料报告默认折叠**（保留「👀 看完整报告」），
						// 已落在 `confirm-cards.js` 那张卡自己身上 ⇒ 推进键回首屏，**这里照旧不补任何东西**
						// （不重建吸底条、不把 `explore` 加进自动滚名单）。见票 20 的 `## Comments`。
						),
						// ⚠️ **底部常驻小条现在住在这里**（广告上面、焦点区滚动容器外面）——票 `ad-strip-occlusion/02`。
						// 它原来挂在滚动容器**里面**的最后一个子节点：确认态让它**换行**（标签变长 ＋ 多一颗
						// 「算了」）⇒ 它比滚动视口底边长得更靠下，下半截被 `overflowY: "auto"` **裁掉**，
						// 而 `getBoundingClientRect()` 照旧报未裁的矩形 ⇒ 两颗键的中心点落进**下面那条广告
						// `<a>`** 的地界（广告是滚动容器的兄弟、紧贴它底边）。2026-10-11 活体两帧 ＋
						// 2026-10-25 画廊复现：真鼠标点「算了」中心 → 新标签打开 `socratopia.app`，书没被删。
						// 修法不是「给广告让出空间」（那治不了根：换行量随视口／路径长度／文案变），而是**不让
						// 那颗键住在任何**滚动容器**里**（判据 `smoke-test.mjs` 的 17e 认的就是 `overflowY`／
						// `overflow` 为 auto／scroll 的祖先；`overflow: hidden` 不在面上，理由写在那条判据旁）
						// ——它跟广告一样常驻在焦点区**下方**，两者互不重叠；滚动容器只留「内容」。
						// `FocusFooter` 组件本身一个字没改（它只是不再被塞进滚动流）。
						// ⚠️ 别把它改成 `position: sticky; bottom: 0` 塞回滚动容器：sticky 仍在该容器的裁切／
						// 覆盖区域里，而且它是**另一层吸底**——票 `walkthrough-fixes/18` 已把同一形状的
						// 吸底决策条整条删掉（同屏重复键、层级噪音），别借这一票复活它。
						// ⚠️ 外面这层 `div` 只补回滚动容器原来那圈内边距（`padding: "12px 16px"`）的**横向**那一半
						// ＋ 底部那 12px：小条以前长在容器**里面**，左右缩进与底距都是那圈 padding 给的；搬到外面
						// 之后不补，它的 `borderTop` 会拉满整列、两侧各少 16px（2026-10-25 双轴 review 抓到）。
						// ⛔ 别把这层写成带 `overflow` 的盒子：那等于给它自己造一个裁切祖先，本票的病原地复发。
						createElement(
						"div",
						{ style: { padding: "0 16px 12px" } },
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
						),
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
				// ⚠️ 它上面现在紧挨着那条常驻小条：两者都是焦点区的兄弟、互不重叠，广告仍是最靠底
				// 那一条（「不塞灰字小条、钉在页面底部常驻」不变——这条是 2026-09-21 用户裁决，
				// 出处见 `SocratopiaAd` 的组件注释与 `.scratch/ad-strip-occlusion/issues/01`；
				// ⚠️ `CONTEXT.md` **没有**广告专条，它只在「热区」那一节里顺带引广告当例子）。
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
		// 判据 8（票 07）：整壳基线 13px（原来不写字号、继承页面 14px，与卡片自相矛盾）。
		fontSize: "13px",
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
		// ⚠️ 这里的 `20px`（下面两条之一）是票 04「待定的一个数」：**不是**闭式的 48。真机量到的
		//   严格上限是 718（= W 下限 680 + 48 − 10px 滚动条槽），票面建议取 700 留余量 ⇒ 余量取 20。
		//   ⚠️⚠️ **它与「下面那两条」已于 2026-10-05 一起作废**（票 16）：只写上限不写下限，
		//   整条是空转的。留着上面这几行只为交代**为什么这里会有一个宽度上限**——
		//   手柄几何闭式与票 04 的来历见下一段与那份契约快照。
		//
		// ── 票 16（工作台宽度不跟随对话框宽度）· 2026-10-05 ──────────────────────
		// ⚠️ 上面那个「待定的一个数 20」**到此作废**，连同它想解决的那个空转：只留
		// `max-width` 的时候，宿主把工作台挂在 `.wSkVaW_viewArea`
		// （`display:flex; flex-direction:column`）里，而**跨轴 auto 外边距会取消 flex 项的
		// `align-self:stretch`** ⇒ 工作台退回 shrink-to-fit，实际宽度 =
		// `min(内容的 max-content, W + 20)`。用户原话「页面的宽度在流程进行中老变，并不是
		// 跟着输入框的宽度来的」就是这一条：内容窄的那一屏（材料准备）≈510px，报告宽的那一屏
		// （交付）≈930px，**两屏的天花板一模一样**（票 16 的决定性证据）。
		//
		// 修法：**取宿主的输入框那一套宽度变量**，不自己重算——
		//   输入框本体 = `.pXSMma_stack{width:100%; max-width:var(--dsh-composer-card-max-width)}`
		//     装在 `.uV2eYG_root{padding:0 var(--dsh-composer-side-clearance) 4px}` 里
		//   ⇒ 输入框宽 = `min(列宽 − 2×clearance, W + 32)`
		// 下面这两条逐字就是那个式子（变量与宿主快照见
		// `docs/reference/dsh-chat-width-handle-geometry-contracts.md` §2b/§5）：
		//   `width`   —— **下限**：没有它就还是 shrink-to-fit，票 16 原样复发；
		//   `maxWidth`—— 换成宿主给输入框用的那条（W+32），工作台与输入框于是同宽、同中心线。
		// ⚠️ `W + 32 ≤ W + 48` 恒成立 ⇒ 票 04 承诺的「不落进那两条透明手柄带」**仍然成立**；
		//   而且工作台到带沿的余量（8px）与输入框**一模一样**——两者一起被手柄让开。
		// ⚠️ 读数不到时回落到 `680 + 32 = 712`：那是一条**稳定的**宽度（不再随内容变），
		//   退化方向是安全的。要重新摘这两个变量时改这里 + 那份契约快照（两处一起改）。
		width: "calc(100% - 2 * var(--dsh-composer-side-clearance, 16px))",
		maxWidth: "var(--dsh-composer-card-max-width, 712px)",
		marginInline: "auto",
	};
	// 单屏 / 三区分界（票 `ui-systematic-fixes/05` 起由 `resolveSurface` 判）：没有书那三档
	// （`loading` / `no-book`；`unreadable` 与 `identity-lost` 更早在上面那一支就返回了）
	// 走单滚动内容，其余三档走三区。
	if (!hasBookSurface) {
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
	// 「有没有新版本」：**在注册时**发起，不在渲染时。位置是刻意的——工作台的 fetch 桩会把
	// 每一次调用都记进 calls，且未被 stub 的请求直接抛，所以渲染路径上一次都不能多发。
	// 这里 fire-and-forget：它答不上来（断网、registry 改形状）也只是不显示任何东西，
	// 组件只订阅一个已经算好的快照。
	void startUpdateCheck();
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
	// 读面 C（票 `dsh-contract-drift/11`）：注册一条只认提问调用/结算块（`tool/call` / `tool/result`）
	// 的 `ConversationNodeDefinition`。宿主在事件落库那一下把它交给这里——**不依赖那条调用还在不在
	// 已加载窗口里**（A 的窄处）。
	// Definition 拿不到会话身份（见 `question-answer-feed.js` 文件头），所以它只记
	// `callId → answers`；落账仍在 `WorkbenchView` 里走同一个 `recordQuestionAnswer`。
	ctx.uiConversation.events.register(createQuestionAnswerDefinition());
	ctx.logger.info(
		"[ui-textbook-run] 工作台视图已注册（全览条 + 阶段页 + 对话台 + 自动打开）",
	);
}
