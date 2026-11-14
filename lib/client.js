window.__ModuleLoader__.load({ id: "dsh-craft-your-textbook", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client-entry.js
var client_entry_exports = {};
__export(client_entry_exports, {
  ActivityLine: () => ActivityLine,
  AutoFollowAwaitNote: () => AutoFollowAwaitNote,
  AutoFollowProgressNote: () => AutoFollowProgressNote,
  AutoOpenWorkbench: () => AutoOpenWorkbench,
  ChaptersCard: () => ChaptersCard,
  ChatDesk: () => ChatDesk,
  DeliveryCard: () => DeliveryCard,
  ExploreConfirmCard: () => ExploreConfirmCard,
  FinalApprovalCard: () => FinalApprovalCard,
  FocusFooter: () => FocusFooter,
  GatePanel: () => GatePanel,
  GoldCompare: () => GoldCompare,
  GoldDraftStage: () => GoldDraftStage,
  GoldFinalize: () => GoldFinalize,
  GoldOpinionList: () => GoldOpinionList,
  GoldReader: () => GoldReader,
  GoldTable: () => GoldTable,
  IdentityTakeoverNote: () => IdentityTakeoverNote,
  InterruptNote: () => InterruptNote,
  IntervenePanel: () => IntervenePanel,
  MineruTokenCard: () => MineruTokenCard,
  OpenArtifactButton: () => OpenArtifactButton,
  OutlineConfirmCard: () => OutlineConfirmCard,
  PatternPanel: () => PatternPanel,
  PhaseBar: () => PhaseBar,
  ProgressOverview: () => ProgressOverview,
  PromoFoldBlock: () => PromoFoldBlock,
  READER_PARA_STYLE: () => READER_PARA_STYLE,
  ReaderQuestionnairePanel: () => ReaderQuestionnairePanel,
  SocratopiaAd: () => SocratopiaAd,
  StatusCard: () => StatusCard,
  StatusStrip: () => StatusStrip,
  StylePanel: () => StylePanel,
  TopBar: () => TopBar,
  UploadArea: () => UploadArea,
  WizardCard: () => WizardCard,
  WorkbenchView: () => WorkbenchView,
  apply: () => apply,
  cardIcon: () => cardIcon,
  cardText: () => cardText,
  chapterBadge: () => chapterBadge,
  deriveDoneSet: () => deriveDoneSet,
  diffParagraphs: () => diffParagraphs,
  exploreReportBlocks: () => exploreReportBlocks,
  foldKnowledgeMap: () => foldKnowledgeMap,
  inject: () => inject,
  mainProgressVisible: () => mainProgressVisible,
  paragraphHint: () => paragraphHint,
  rejectPayload: () => rejectPayload,
  renderInline: () => renderInline,
  shouldForceBackToNow: () => shouldForceBackToNow,
  splitParagraphs: () => splitParagraphs
});
module.exports = __toCommonJS(client_entry_exports);
var import_react21 = require("react");

// src/ui/styles.js
var DISABLED_VISUAL = Object.freeze({
  opacity: 0.45,
  cursor: "not-allowed"
});
var S = {
  /**
   * 把「此刻禁用了」折进样式：真时叠上 `DISABLED_VISUAL`，否则**原样**返回基样式。
   * 逐处调用点的第二个实参必须与那一颗键的 `disabled` 值逐字相同（判据钉着这件事）。
   */
  disabled: (base, isDisabled) => isDisabled === true ? { ...base, ...DISABLED_VISUAL } : base,
  container: {
    padding: "16px 20px",
    fontFamily: "inherit",
    color: "var(--dsw-alias-label-primary)"
  },
  title: { fontSize: "16px", fontWeight: 600, margin: "0 0 4px" },
  hint: { fontSize: "12px", opacity: 0.65, margin: "0 0 12px" },
  projectRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "12px"
  },
  projectBtn: (active) => ({
    border: active ? "1px solid var(--dsw-alias-state-business-primary)" : "1px solid var(--dsw-alias-border-l2)",
    background: active ? "var(--dsw-alias-state-business-tertiary)" : "transparent",
    borderRadius: "8px",
    padding: "6px 10px",
    fontSize: "13px",
    cursor: "pointer"
  }),
  card: {
    border: "1px solid var(--dsw-alias-border-l2)",
    borderRadius: "10px",
    padding: "12px 14px",
    marginBottom: "10px",
    background: "var(--dsw-alias-bg-layer-1)",
    fontSize: "13px"
  },
  focus: {
    border: "1.5px solid var(--dsw-alias-state-business-primary)",
    // 票 04（判据 5/10）：焦点卡与普通卡两档拉开——16px vs card 的 10px。
    // ⚠️ 这只是「两档拉开」，不是同心公式闭合：padding 仍是 14px 16px，16 − 16 ≠ 10。
    borderRadius: "16px",
    padding: "14px 16px",
    marginBottom: "12px",
    background: "var(--dsw-alias-state-business-tertiary)",
    fontSize: "13px"
  },
  error: {
    color: "var(--dsw-alias-state-error-primary)",
    fontSize: "13px",
    margin: "8px 0"
  },
  // 「有新版可升」那一行。**刻意不是 error 色**：它不是出错了，是一条要人决定的提示，
  // 染成红的会和上面那行真错误抢同一份注意力（用户已经学会忽略红色的那一行）。
  // 次要文字用 `opacity` 而不是写一个色值 token——本文件里其余条目引用的都是宿主
  // **已证明存在**的那些 token，凭空引一个不存在的会让整条 color 声明失效退回继承色。
  update: {
    fontSize: "12px",
    opacity: 0.85,
    margin: "8px 0"
  },
  bigBtn: (primary) => ({
    border: "none",
    borderRadius: "10px",
    padding: "10px 18px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    // 压在强调色实心底上的字：跟主题一起翻的「反色前景」，不再写死 #ffffff
    // （强调色接宿主之后暗色是浅蓝，白字压上去正是票 19 说的那种不可读）。
    color: "var(--dsw-alias-label-primary-foreground)",
    background: primary ? "var(--dsw-alias-state-business-primary)" : "var(--dsw-alias-state-error-primary)"
  }),
  // 次级按钮（批 3，2026-09-20）：原来「预览/不满意/认可」三键都是 bigBtn(true)，
  // 三个一模一样的蓝实心并排，用户看不出该点哪儿。主操作填色，其余描边。
  ghostBtn: (danger) => ({
    border: `1px solid ${danger ? "var(--dsw-alias-state-error-primary)" : "var(--dsw-alias-border-l2)"}`,
    borderRadius: "10px",
    padding: "10px 18px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    background: "transparent",
    color: danger ? "var(--dsw-alias-state-error-primary)" : "inherit"
  }),
  smallLink: {
    border: "none",
    background: "transparent",
    color: "var(--dsw-alias-state-business-primary)",
    cursor: "pointer",
    fontSize: "12px",
    textDecoration: "underline",
    padding: "0"
  },
  input: {
    width: "100%",
    borderRadius: "8px",
    border: "1px solid var(--dsw-alias-border-l2)",
    padding: "6px 8px",
    fontSize: "13px",
    boxSizing: "border-box",
    fontFamily: "inherit",
    margin: "4px 0 8px"
  },
  textarea: {
    width: "100%",
    minHeight: "56px",
    borderRadius: "8px",
    border: "1px solid var(--dsw-alias-border-l2)",
    padding: "6px 8px",
    fontSize: "13px",
    boxSizing: "border-box",
    fontFamily: "inherit",
    margin: "4px 0 8px"
  },
  label: {
    fontSize: "12px",
    fontWeight: 600,
    display: "block",
    marginTop: "6px"
  },
  checkItem: { display: "block", margin: "4px 0", fontSize: "13px" },
  bar: { display: "flex", gap: "4px", margin: "0 0 12px" },
  /**
   * 焦点卡**最后那一行动作键**（主推进键那一行）的常驻带（票 `walkthrough-fixes/38`）。
   *
   * ## 它治的是什么
   *
   * 站 2 读材料那屏（`demo-phase-2`）与站 8 范例章那屏（`demo-phase-4`）的**初始、不滚动**读数里，
   * 主推进键整颗落在焦点区可视带**之下**（1280×720、亮暗一致：`data-explore-confirm` 键顶距带顶
   * 914px／`data-gold-approve` 679.7px，而带高只有 425.5px）。走查的判据是「主推进键整颗在带内」，
   * 于是那两屏每主题各一条红（票 `walkthrough-fixes/38` 的 gate）。
   *
   * 实测**靠削内容治不了**：要把那颗键整颗塞进 425.5px 的带里，得把它上方的内容削掉
   * **527.5px**（站 2）／**293.1px**（站 8）——而站 2 上方那块正是 spec §2.3 第 4 块的「知识点图·清单」
   * （349px）、站 8 上方正是 §2.7 第 6 块「正文（首屏，不折叠）」（426px）⇒ 削它们就是推翻 spec。
   *
   * ## ⛔ 它不是票 18 删掉的那条「吸底决策条」
   *
   * 票 20 当年在焦点区**底部另起一条**，条上是卡内那颗键的**副本**——同一动作同屏两颗，用户原话
   * 「满意的那行位置不对」，2026-10-04 整条删掉（`walkthrough-fixes/18`）。本格**不新增任何可点区域**：
   * 它盖的是卡内**本来那一行**（同一颗 `<button>`、同一句文案、同一个 `onClick`），只是让这一行在
   * 卡片滚动时贴在带底。**「同一个放行动作同屏只许一颗键」那条判据照旧成立**（判据在
   * `test-layout-anchors.mjs` 与 `test-workbench-first-screen.mjs`）。
   * ⛔ 也不是「把卡自动滚进去」（票 20 的方向二，已否）：那会把正在读报告/读稿的用户一把拽到
   * 几千字下面，而底对齐正是「键在卡最下面」时唯一能把它带进来的对齐方式（同上那条票面理由）。
   *
   * ## 三条落地口径
   *
   * ① **底色必须不透明**：`var(--dsw-alias-state-business-tertiary)` ＝ 焦点卡（`S.focus`）自己的底色，
   *    所以贴上去时看不出第二层，也**不会漏出**从它下面滚过的正文（透明会让字透上来，正是
   *    `.scratch/ad-strip-occlusion/` 那一族治的形状）。
   * ② **上下各 8px 内边距**归这一格：贴住时按钮不贴带边，滚过去时那段留白也是它自己的底。
   * ③ **装得下时它什么也不做**：内容没超出一屏 ⇒ `bottom:0` 的 sticky 元素就停在自然位置，
   *    不产生任何位移（不靠 JS 判「要不要吸」，也就不存在「哪一帧算超出」这种第二套判据）。
   *
   * ⚠️ 真几何（贴住之后键落在带内、有没有压住别的可点键）**node 侧量不到**——它由
   * `node scripts/walkthrough.mjs --screens=demo-phase-2,demo-phase-4` 在真浏览器里逐颗判；
   * 本格只给数据，不声称量过。
   */
  stickyActions: {
    position: "sticky",
    bottom: 0,
    // 与宿主那几处 sticky 小条同一档（`panels.js` 的提示条 / `chat-desk.js` 的输入区都是 20）：
    // 这一行要压在自己卡内滚过去的正文之上，但**不许**盖到卡外的顶栏与底部小条。
    zIndex: 20,
    background: "var(--dsw-alias-state-business-tertiary)",
    padding: "8px 0"
  },
  seg: (state) => ({
    flex: 1,
    borderRadius: "6px",
    padding: "6px 2px",
    textAlign: "center",
    fontSize: "12px",
    color: state === "done" ? "var(--dsw-alias-label-primary)" : state === "current" ? "var(--dsw-alias-label-primary-foreground)" : "var(--dsw-alias-label-primary)",
    background: state === "done" ? "var(--dsw-alias-state-success-tertiary)" : state === "current" ? "var(--dsw-alias-state-business-primary)" : "var(--dsw-alias-bg-skeleton)",
    border: state === "current" ? "none" : "1px solid var(--dsw-alias-border-l2)"
  })
};

// src/ui/card-head.js
var import_react = require("react");
var CARD_HEAD_QUESTION_STYLE = Object.freeze({
  fontSize: "16px",
  fontWeight: 700,
  lineHeight: 1.35
});
var CARD_HEAD_FACT_STYLE = Object.freeze({
  margin: "4px 0 0",
  fontSize: "12px",
  opacity: 0.8
});
var CARD_HEAD_ROW_STYLE = Object.freeze({
  margin: "0 0 10px",
  paddingBottom: "8px",
  borderBottom: "1px dashed var(--dsw-alias-border-l2)"
});
function CardHead(props) {
  const { question, lead, facts } = props;
  return (0, import_react.createElement)(
    "div",
    { style: CARD_HEAD_ROW_STYLE },
    question,
    lead ?? null,
    // 票 `ui-display-redesign/17`（收口 review S4）：事实句**可选**——读盘期／读失败时
    // 「还没有读数」不该被印成一句带数的假事实（站 3 修前会印「0 条」）。空串也算没有。
    typeof facts === "string" && facts.trim() !== "" ? (0, import_react.createElement)("p", { style: CARD_HEAD_FACT_STYLE }, facts) : null
  );
}

// src/ui/surface.js
var SURFACE_KINDS = Object.freeze([
  "loading",
  "unreadable",
  "identity-lost",
  "no-book",
  "now",
  "phase-page",
  "browsing"
]);
var SURFACE_EXIT_FIELDS = Object.freeze([
  "id",
  "label",
  "action",
  "why",
  "destructive"
]);
var SURFACE_RETRY_ACTIONS = Object.freeze({
  read: "read-retry",
  book: "book-retry"
});
var LOADING_TEXT = "\u52A0\u8F7D\u4E2D\u2026";
var OPENING_TEXT = "\u6B63\u5728\u6253\u5F00\u8FD9\u672C\u4E66\u2026";
var LOADING_QUESTION = "\u5728\u7B49\u4EC0\u4E48\u3001\u7B49\u4E86\u591A\u4E45\uFF1F";
var READ_FAILED_QUESTION = "\u4E3A\u4EC0\u4E48\u6CA1\u8BFB\u51FA\u6765\u3001\u600E\u4E48\u6062\u590D\uFF1F";
var IDENTITY_LOST_QUESTION = "\u8FD9\u672C\u4E66\u4E3A\u4EC0\u4E48\u6253\u4E0D\u5F00\uFF1F";
var LOADING_NOTE = "\u6B63\u5728\u8BFB\u8FD9\u672C\u4E66\u7684\u6570\u636E\uFF1B\u8BFB\u56DE\u6765\u5C31\u4F1A\u81EA\u52A8\u8FDB\u5DE5\u4F5C\u53F0\uFF0C\u4E0D\u7528\u4F60\u505A\u4EC0\u4E48\u3002";
var BARE_NO_BOOK_TEXT = "\u8FD9\u4E2A\u4F1A\u8BDD\u6CA1\u6709\u5728\u9020\u4E66\uFF0C\u4E5F\u6CA1\u6709\u6B63\u5728\u8BFB\u7684\u4E66\u3002";
var READ_FAILED_BOOK_TEXT = "\u8FD9\u672C\u4E66\u8FD9\u6B21\u6CA1\u8BFB\u56DE\u6765\u2014\u2014\u5B83\u8FD8\u5728\u76D8\u4E0A\uFF0C\u4E0D\u662F\u6CA1\u4E86\u3002\u53EF\u4EE5\u91CD\u8BD5\uFF0C\u91CD\u8BD5\u4E0D\u4F1A\u65B0\u5EFA\u4EFB\u4F55\u4E1C\u897F\u3002";
var READ_FAILED_LIST_TEXT = "\u4E66\u5355\u8FD9\u6B21\u6CA1\u8BFB\u56DE\u6765\u3002\u53EF\u4EE5\u91CD\u8BD5\uFF0C\u91CD\u8BD5\u4E0D\u4F1A\u65B0\u5EFA\u4EFB\u4F55\u4E1C\u897F\u3002";
var IDENTITY_LOST_TEXT = "\u521A\u624D\u90A3\u672C\u4E66\u6253\u4E0D\u5F00\u4E86\uFF1A\u5B83\u53EF\u80FD\u5DF2\u88AB\u5220\u9664\uFF0C\u6216\u8005\u4E0D\u5C5E\u4E8E\u5F53\u524D\u4F1A\u8BDD\u3002\u76D8\u4E0A\u82E5\u8FD8\u5728\uFF0C\u91CD\u8BD5\u5C31\u80FD\u8BFB\u56DE\u6765\u3002";
function identityTakeoverNotice(name) {
  const title = typeof name === "string" ? name.trim() : "";
  return title === "" ? "\u521A\u624D\u90A3\u672C\u6253\u4E0D\u5F00\u4E86\uFF0C\u73B0\u5728\u6253\u5F00\u7684\u662F\u53E6\u4E00\u672C" : `\u521A\u624D\u90A3\u672C\u6253\u4E0D\u5F00\u4E86\uFF0C\u73B0\u5728\u6253\u5F00\u7684\u662F\u300A${title}\u300B`;
}
var LOADING_RETRY_AFTER_MS = 3e4;
var NO_EXITS = Object.freeze([]);
var NO_BOOK_EXITS = Object.freeze([
  Object.freeze({
    id: "create-book",
    label: "\u521B\u5EFA\u8FD9\u672C\u4E66",
    action: "book-create",
    why: "\u8FD9\u4E00\u672C\u8FD8\u4E0D\u5B58\u5728\uFF1A\u628A\u5B83\u5EFA\u51FA\u6765\u5C31\u662F\u8FD9\u4E00\u5C4F\u8981\u4F60\u786E\u8BA4\u7684\u4E8B",
    destructive: true
  }),
  Object.freeze({
    id: "create-demo-book",
    label: "\u5148\u5EFA\u4E00\u672C\u6F14\u793A\u4E66\u8BD5\u8BD5\uFF08\u4E0D\u82B1\u6A21\u578B\u989D\u5EA6\uFF0C\u51E0\u6B65\u5C31\u80FD\u8D70\u5B8C\uFF09",
    action: "demo-run",
    why: "\u540C\u6837\u4F1A\u65B0\u5EFA\u4E00\u672C\u4E66\uFF0C\u53EA\u662F\u8D70\u6F14\u793A\u901A\u9053\u3001\u4E0D\u82B1\u6A21\u578B\u989D\u5EA6",
    destructive: true
  }),
  Object.freeze({
    id: "suggest-book",
    label: "\u2728 AI \u5EFA\u8BAE",
    action: "wizard-suggest",
    why: "\u8BA9 AI \u5148\u62DF\u51E0\u4E2A\u4E66\u540D/\u76EE\u6807\u586B\u8FDB\u8868\u5355\uFF0C\u4EBA\u518D\u6539\uFF08\u4E0D\u5EFA\u4E66\uFF09",
    destructive: false
  })
]);
var READ_RETRY_EXITS = Object.freeze([
  Object.freeze({
    id: "read-retry",
    label: "\u91CD\u8BD5",
    action: SURFACE_RETRY_ACTIONS.read,
    why: "\u8FD9\u6B21\u6CA1\u8BFB\u56DE\u6765\uFF1A\u4E66\u8FD8\u5728\u76D8\u4E0A\uFF0C\u518D\u8BFB\u4E00\u6B21\u4E0D\u4F1A\u65B0\u5EFA\u4EFB\u4F55\u4E1C\u897F",
    destructive: false
  })
]);
var LOADING_RETRY_EXITS = Object.freeze([
  Object.freeze({
    id: "loading-retry",
    label: "\u91CD\u8BD5",
    action: SURFACE_RETRY_ACTIONS.read,
    // 票 `ui-display-redesign/21`（spec §2.19）：屏上不写「30 秒」这个机器口径（门槛仍住
    // `LOADING_RETRY_AFTER_MS`，只是不上人眼——连悬停提示也不写）。
    why: "\u5DF2\u7ECF\u7B49\u4E86\u4E00\u4F1A\u513F\u8FD8\u6CA1\u56DE\u6765\uFF1A\u518D\u8BFB\u4E00\u6B21\uFF0C\u4E0D\u5FC5\u5237\u65B0\u9875\u9762",
    destructive: false
  })
]);
var IDENTITY_LOST_EXITS = Object.freeze([
  Object.freeze({
    id: "book-retry",
    label: "\u91CD\u8BD5\u6253\u5F00\u8FD9\u672C\u4E66",
    action: SURFACE_RETRY_ACTIONS.book,
    why: "\u521A\u624D\u90A3\u4E00\u672C\u8BFB\u4E0D\u5230\uFF08\u53EF\u80FD\u5DF2\u5220\u9664\u6216\u4E0D\u5C5E\u4E8E\u672C\u4F1A\u8BDD\uFF09\uFF1A\u518D\u8BD5\u8BFB\u540C\u4E00\u672C\uFF0C\u4E0D\u4F1A\u65B0\u5EFA\u4E5F\u4E0D\u4F1A\u6362\u4E66",
    destructive: false
  })
]);
function surfaceOf(kind, copy, exits, bare = false, question = null, note = null) {
  return { kind, copy, exits, bare, question, note };
}
function elapsedSeconds(elapsedMs) {
  const ms = typeof elapsedMs === "number" && Number.isFinite(elapsedMs) ? elapsedMs : 0;
  return ms > 0 ? Math.floor(ms / 1e3) : 0;
}
function withElapsed(text, elapsedMs) {
  const seconds = elapsedSeconds(elapsedMs);
  return seconds > 0 ? `${text}\uFF08\u5DF2\u7ECF\u7B49\u4E86 ${seconds} \u79D2\uFF09` : text;
}
function loadingSurface(text, elapsedMs) {
  const waited = typeof elapsedMs === "number" && elapsedMs > LOADING_RETRY_AFTER_MS;
  return surfaceOf(
    "loading",
    withElapsed(text, elapsedMs),
    waited ? LOADING_RETRY_EXITS : NO_EXITS,
    false,
    LOADING_QUESTION,
    LOADING_NOTE
  );
}
function resolveSurface(input) {
  const {
    sessionPreset,
    projectId,
    projectsStatus,
    projectsCount,
    generation,
    coreStatus,
    coreError,
    meta,
    gate,
    viewPhase,
    browsing,
    showHistory,
    paused,
    stall,
    mineruSet,
    conversionSettled,
    uiError,
    elapsedMs,
    identityLost
  } = input ?? {};
  const pickingFirstBook = projectsStatus === "ready" && projectsCount > 0 && projectId === null && generation === 0;
  const loading = projectId === null ? projectsStatus === "unknown" || pickingFirstBook : coreStatus === "unknown";
  if (meta === null || meta === void 0) {
    if (sessionPreset !== "textbook") {
      return surfaceOf(
        "unreadable",
        loading ? OPENING_TEXT : BARE_NO_BOOK_TEXT,
        READ_RETRY_EXITS,
        true
      );
    }
    if (identityLost !== null && identityLost !== void 0) {
      return surfaceOf(
        "identity-lost",
        IDENTITY_LOST_TEXT,
        IDENTITY_LOST_EXITS,
        false,
        IDENTITY_LOST_QUESTION
      );
    }
    const readFailed = projectId === null ? projectsStatus === "error" : coreStatus === "error";
    if (readFailed) {
      return surfaceOf(
        "unreadable",
        projectId === null ? READ_FAILED_LIST_TEXT : READ_FAILED_BOOK_TEXT,
        READ_RETRY_EXITS,
        false,
        READ_FAILED_QUESTION
      );
    }
    const listRead = projectsStatus === "ready" || projectsStatus === "stale";
    const emptyBookList = projectId === null && listRead && !(projectsCount > 0);
    if (emptyBookList) return surfaceOf("no-book", null, NO_BOOK_EXITS);
    return loadingSurface(LOADING_TEXT, elapsedMs);
  }
  if (browsing !== null && browsing !== void 0) return surfaceOf("browsing", null, NO_EXITS);
  if (viewPhase !== null && viewPhase !== void 0) return surfaceOf("phase-page", null, NO_EXITS);
  return surfaceOf("now", null, NO_EXITS);
}

// src/workbench-projection.js
var POLL_INTERVAL_MS = 2e3;
var IDENTITY_FAILURE_KINDS = /* @__PURE__ */ new Set(["not-found", "not-owned"]);
var READ_TIMEOUT_MS = 1e4;
var POLL_STUCK_MS = 6e4;
var UNKNOWN_RESOURCE = Object.freeze({
  status: "unknown",
  known: false,
  data: null,
  error: null
});
var EMPTY_PROJECTS = Object.freeze([]);
function bookKeyFor(sessionId, projectId) {
  return JSON.stringify([sessionId, projectId]);
}
function projectionFailure(kind, message, status = null) {
  const error = new Error(message);
  error.projectionKind = kind;
  if (status !== null) error.status = status;
  return error;
}
function malformed(message) {
  return projectionFailure("malformed", message);
}
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function stableValue(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(stableValue));
  if (!isRecord(value)) return value;
  const copy = {};
  for (const [key, item] of Object.entries(value)) copy[key] = stableValue(item);
  return Object.freeze(copy);
}
function sameValue(a, b) {
  if (a === b) return true;
  if (!isRecord(a) && !Array.isArray(a)) return a === b;
  if (!isRecord(b) && !Array.isArray(b)) return b === a;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let index = 0; index < a.length; index += 1) {
      if (!sameValue(a[index], b[index])) return false;
    }
    return true;
  }
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!sameValue(a[key], b[key])) return false;
  }
  return true;
}
function errorSnapshot(error) {
  return {
    kind: typeof error?.projectionKind === "string" ? error.projectionKind : "transport",
    message: error instanceof Error ? error.message : String(error),
    status: Number.isSafeInteger(error?.status) ? error.status : null
  };
}
function failedResource(previous, error) {
  return stableValue({
    status: previous.known ? "stale" : "error",
    known: previous.known,
    data: previous.data,
    error: errorSnapshot(error)
  });
}
function readyResource(data) {
  return stableValue({ status: "ready", known: true, data, error: null });
}
function normalizeProjects(payload) {
  if (!isRecord(payload) || !Array.isArray(payload.projects)) {
    throw malformed("projects \u54CD\u5E94\u5F62\u72B6\u4E0D\u5408\u6CD5");
  }
  for (const project of payload.projects) {
    if (!isRecord(project) || typeof project.id !== "string" || project.id === "") {
      throw malformed("projects \u54CD\u5E94\u5305\u542B\u975E\u6CD5 project");
    }
  }
  return payload.projects;
}
function listOrEmpty(payload, key, label) {
  const value = payload[key];
  if (value === void 0 || value === null) return [];
  if (!Array.isArray(value)) throw malformed(`${label} \u5FC5\u987B\u662F\u6570\u7EC4`);
  return value;
}
function normalizeCore(payload, { base = null, delta = false } = {}) {
  if (!isRecord(payload) || !isRecord(payload.meta) || !Array.isArray(payload.events)) {
    throw malformed("events \u54CD\u5E94\u7684 meta/events \u5F62\u72B6\u4E0D\u5408\u6CD5");
  }
  if (payload.dir !== void 0 && payload.dir !== null && typeof payload.dir !== "string") {
    throw malformed("events \u54CD\u5E94\u7684 dir \u5FC5\u987B\u662F\u5B57\u7B26\u4E32");
  }
  if (payload.knowledgeMap !== void 0 && payload.knowledgeMap !== null && typeof payload.knowledgeMap !== "string") {
    throw malformed("events \u54CD\u5E94\u7684 knowledgeMap \u5FC5\u987B\u662F\u5B57\u7B26\u4E32");
  }
  if (payload.knowledgeMapExclusions !== void 0 && payload.knowledgeMapExclusions !== null && typeof payload.knowledgeMapExclusions !== "string") {
    throw malformed("events \u54CD\u5E94\u7684 knowledgeMapExclusions \u5FC5\u987B\u662F\u5B57\u7B26\u4E32");
  }
  if (payload.readerQuestionnaireReturn !== void 0 && payload.readerQuestionnaireReturn !== null && typeof payload.readerQuestionnaireReturn !== "string") {
    throw malformed("events \u54CD\u5E94\u7684 readerQuestionnaireReturn \u5FC5\u987B\u662F\u5B57\u7B26\u4E32");
  }
  if (payload.outline !== void 0 && payload.outline !== null && typeof payload.outline !== "string") {
    throw malformed("events \u54CD\u5E94\u7684 outline \u5FC5\u987B\u662F\u5B57\u7B26\u4E32");
  }
  if (payload.goldAudit !== void 0 && payload.goldAudit !== null && typeof payload.goldAudit !== "string") {
    throw malformed("events \u54CD\u5E94\u7684 goldAudit \u5FC5\u987B\u662F\u5B57\u7B26\u4E32");
  }
  const incoming = payload.events;
  for (const event of incoming) {
    if (!isRecord(event) || !Number.isSafeInteger(event.seq) || event.seq < 0) {
      throw malformed("events \u54CD\u5E94\u5305\u542B\u975E\u6CD5\u4E8B\u4EF6\u6216 cursor");
    }
  }
  const events = delta && base !== null ? base.events.concat(incoming) : incoming;
  const last = events[events.length - 1];
  const cursor = last === void 0 ? -1 : last.seq;
  const dir = typeof payload.dir === "string" ? payload.dir : null;
  return {
    meta: payload.meta,
    events,
    gate: payload.gate ?? null,
    snapshots: listOrEmpty(payload, "snapshots", "events.snapshots"),
    dir,
    bookDir: dir,
    pending: {
      stage: payload.pendingStage ?? null,
      gate: payload.pendingGate ?? null,
      reviews: listOrEmpty(payload, "pendingReviews", "events.pendingReviews")
    },
    knowledgeMap: typeof payload.knowledgeMap === "string" ? payload.knowledgeMap : null,
    // 那份**人的裁决产物**原文（`工作区/knowledge-map-exclusions.json`，票 `knowledge-graph-build/09`）：
    // 与 `knowledgeMap` 同一条路（不经 `/textbook/file`），null ＝「这本书上还没有裁决」。
    knowledgeMapExclusions: typeof payload.knowledgeMapExclusions === "string" ? payload.knowledgeMapExclusions : null,
    // 书夹里那份**回卷原件**的原文（`工作区/读者情况回卷.md`，票 `reader-cognition-boundary-build/09`）：
    // 与上面那份同一条路（不经 `/textbook/file`），null ＝「这本书还没有回卷」——
    // 站 2 那一栏「缺口」据它 ＋ 合并件的 `readerSlices` ＋ 剔除记录**现算**（⛔ 不落第二份）。
    readerQuestionnaireReturn: typeof payload.readerQuestionnaireReturn === "string" ? payload.readerQuestionnaireReturn : null,
    // 章节安排原文（`工作区/outline.md`，内容是机器 JSON）：与 knowledgeMap 同一条路——
    // 不经 /textbook/file（那条路由按 'preview' 收窄），人读形态由阶段页就地折叠。
    outline: typeof payload.outline === "string" ? payload.outline : null,
    // 当前范例章的检查记录原文（`工作区/audit-NN.md`，严格 JSON 的机器产物）：同 outline 一条路
    // ——不经 `/textbook/file`（那条路由按 'preview' 收窄，对它必然 403），改随 payload 下发。
    // 判据是**那一份**（服务端按 `meta.goldChapter` 取），前端不再自己拼路径去读。
    // ⚠️ **三态里「还没读到」（`undefined`）那一格必须留得住**——这一格与上面几格不同：
    // 它**驱动一颗键的能力**（`goldDisplayPeriod`：`null` ⇒ 挂展示期、把定稿键禁掉）。
    // 所以服务端**没有这一格**时要读成 `undefined`（＝还没读到 ⇒ 照旧放行），**不是** `null`：
    // 判成 `null` 就是让卡断言「这一稿的检查记录还没出来」——那是关于**文件**的断言，
    // 而客户端此刻并不知道（老宿主／半更新时这一格就是缺的），两颗键于是又灰回去，
    // 正是票 `gold-finalize-blocked/01` 那个形状。上面几格用 `?? null` 是因为它们只影响显示。
    goldAudit: payload.goldAudit === void 0 ? void 0 : typeof payload.goldAudit === "string" ? payload.goldAudit : null,
    chapterStatus: listOrEmpty(payload, "chapterStatus", "events.chapterStatus"),
    goldDrafts: listOrEmpty(payload, "goldDrafts", "events.goldDrafts"),
    goldDraftVersion: Number.isSafeInteger(payload.goldDraftVersion) ? payload.goldDraftVersion : 1,
    cursor,
    exploreSummary: payload.exploreSummary ?? null,
    pendingInterventions: listOrEmpty(
      payload,
      "pendingInterventions",
      "events.pendingInterventions"
    ),
    finalReport: payload.finalReport ?? null,
    work: payload.work ?? null
  };
}
function normalizeWork(payload) {
  if (!isRecord(payload) || !Array.isArray(payload.files)) {
    throw malformed("work \u54CD\u5E94\u5F62\u72B6\u4E0D\u5408\u6CD5");
  }
  return { files: payload.files };
}
function normalizeProcess(payload) {
  if (!isRecord(payload) || !Array.isArray(payload.segments)) {
    throw malformed("process \u54CD\u5E94\u5F62\u72B6\u4E0D\u5408\u6CD5");
  }
  return { segments: payload.segments, shape: isRecord(payload.shape) ? payload.shape : null };
}
function classifyHttpFailure(status, message) {
  if (status === 404 || /项目不存在|not found/i.test(message)) {
    return projectionFailure("not-found", message, status);
  }
  if (status === 403 || /不属于当前会话|not[- ]owned/i.test(message)) {
    return projectionFailure("not-owned", message, status);
  }
  return projectionFailure("http", message, status);
}
function withReadTimeout(promise, timeoutMs) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return promise;
  if (typeof globalThis.setTimeout !== "function") return promise;
  return new Promise((resolve, reject) => {
    const waited = timeoutMs >= 1e3 ? `${Math.round(timeoutMs / 1e3)} \u79D2` : `${timeoutMs} \u6BEB\u79D2`;
    const handle = globalThis.setTimeout(() => {
      reject(projectionFailure("timeout", `\u8FD9\u6B21\u8BFB\u6CA1\u56DE\u6765\uFF08\u8D85\u8FC7 ${waited}\uFF09`));
    }, timeoutMs);
    if (handle !== null && typeof handle === "object" && typeof handle.unref === "function") {
      handle.unref();
    }
    promise.then(
      (value) => {
        if (typeof globalThis.clearTimeout === "function") globalThis.clearTimeout(handle);
        resolve(value);
      },
      (error) => {
        if (typeof globalThis.clearTimeout === "function") globalThis.clearTimeout(handle);
        reject(error);
      }
    );
  });
}
async function requestBookJson(pathname, params, timeoutMs = READ_TIMEOUT_MS) {
  const fetchNow = globalThis.fetch;
  if (typeof fetchNow !== "function") {
    throw projectionFailure("transport", "\u5F53\u524D\u73AF\u5883\u6CA1\u6709\u53EF\u7528\u7684 fetch");
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) search.set(key, value);
  const url = `${pathname}?${search.toString()}`;
  return withReadTimeout(readJsonResponse(fetchNow, url, pathname), timeoutMs);
}
async function readJsonResponse(fetchNow, url, pathname) {
  let response;
  try {
    response = await fetchNow.call(globalThis, url, {
      headers: { Accept: "application/json" }
    });
  } catch (error) {
    throw projectionFailure(
      "transport",
      error instanceof Error ? error.message : String(error)
    );
  }
  let payload = null;
  let parseFailed = false;
  try {
    payload = await response.json();
  } catch {
    parseFailed = true;
  }
  const status = Number.isSafeInteger(response.status) ? response.status : null;
  if (!response.ok) {
    const message = isRecord(payload) && typeof payload.error === "string" && payload.error !== "" ? payload.error : `HTTP ${status ?? "\u9519\u8BEF"}`;
    throw classifyHttpFailure(status, message);
  }
  if (parseFailed) throw malformed(`${pathname} \u54CD\u5E94\u4E0D\u662F\u5408\u6CD5 JSON`);
  return payload;
}
function createProductionBookSource({ timeoutMs = READ_TIMEOUT_MS } = {}) {
  return {
    projects(sessionId) {
      return requestBookJson("/textbook/projects", { session: sessionId }, timeoutMs);
    },
    // `after` 为 null 时是全量读取（不带该参数）；带数字时是沿用现有 cursor 口径的增量轮询。
    events(sessionId, projectId, after) {
      const params = { session: sessionId, project: projectId };
      if (Number.isSafeInteger(after)) params.after = after;
      return requestBookJson("/textbook/events", params, timeoutMs);
    },
    work(sessionId, projectId) {
      return requestBookJson("/textbook/work", { session: sessionId, project: projectId }, timeoutMs);
    },
    process(sessionId, projectId) {
      return requestBookJson("/textbook/process", { session: sessionId, project: projectId }, timeoutMs);
    }
  };
}
function createBrowserScheduler() {
  return {
    setInterval(callback, delay) {
      const setIntervalNow = globalThis.setInterval;
      if (typeof setIntervalNow !== "function") {
        throw projectionFailure("transport", "\u5F53\u524D\u73AF\u5883\u6CA1\u6709\u53EF\u7528\u7684 setInterval");
      }
      return setIntervalNow.call(globalThis, callback, delay);
    },
    clearInterval(handle) {
      const clearIntervalNow = globalThis.clearInterval;
      if (typeof clearIntervalNow === "function") clearIntervalNow.call(globalThis, handle);
    }
  };
}
function createBookProjection({
  sessionId,
  source,
  scheduler = createBrowserScheduler(),
  now = () => Date.now(),
  readTimeoutMs = READ_TIMEOUT_MS,
  onIdentityLost = null,
  onIdentityTakeover = null
}) {
  if (typeof sessionId !== "string" || sessionId === "") {
    throw new TypeError("createBookProjection \u9700\u8981 sessionId");
  }
  const bookSource = source === void 0 ? createProductionBookSource({ timeoutMs: readTimeoutMs }) : source;
  if (bookSource === null || typeof bookSource !== "object") {
    throw new TypeError("createBookProjection \u9700\u8981\u5185\u90E8 source adapter");
  }
  if (scheduler === null || typeof scheduler !== "object" || typeof scheduler.setInterval !== "function" || typeof scheduler.clearInterval !== "function") {
    throw new TypeError("createBookProjection \u9700\u8981\u5185\u90E8 scheduler adapter");
  }
  if (typeof now !== "function") {
    throw new TypeError("createBookProjection \u7684 now \u5FC5\u987B\u662F\u51FD\u6570\uFF08\u9ED8\u8BA4 Date.now\uFF09");
  }
  if (!Number.isFinite(readTimeoutMs) || readTimeoutMs <= 0) {
    throw new TypeError("createBookProjection \u7684 readTimeoutMs \u5FC5\u987B\u662F\u6B63\u6570");
  }
  if (onIdentityLost !== null && typeof onIdentityLost !== "function") {
    throw new TypeError("createBookProjection \u7684 onIdentityLost \u5FC5\u987B\u662F\u51FD\u6570\u6216 null");
  }
  if (onIdentityTakeover !== null && typeof onIdentityTakeover !== "function") {
    throw new TypeError("createBookProjection \u7684 onIdentityTakeover \u5FC5\u987B\u662F\u51FD\u6570\u6216 null");
  }
  const state = {
    projectId: null,
    generation: 0,
    projects: EMPTY_PROJECTS,
    projectsStatus: "unknown",
    projectsError: null,
    core: UNKNOWN_RESOURCE,
    work: UNKNOWN_RESOURCE,
    process: UNKNOWN_RESOURCE
  };
  const listeners = /* @__PURE__ */ new Set();
  const epochs = { projects: 0, events: 0, work: 0, process: 0 };
  let snapshotRef = buildSnapshot2();
  let pollHandle = null;
  let pollInFlight = 0;
  let pollSeq = 0;
  let pollStartedAt = 0;
  let identityLost = null;
  function reportIdentityLost(next) {
    if (onIdentityLost === null) return;
    if (next === identityLost) return;
    if (next !== null && identityLost !== null && next.projectId === identityLost.projectId && next.kind === identityLost.kind && next.message === identityLost.message) {
      return;
    }
    identityLost = next;
    try {
      onIdentityLost(next);
    } catch {
    }
  }
  function reportIdentityTakeover({ from, to }) {
    if (onIdentityTakeover === null) return;
    const coreName = state.core.data?.meta?.name;
    const picked = state.projects.find((project) => project.id === to);
    const fromCore = typeof coreName === "string" ? coreName.trim() : "";
    const fromList = picked !== void 0 && typeof picked.name === "string" ? picked.name.trim() : "";
    const name = fromCore !== "" ? fromCore : fromList;
    try {
      onIdentityTakeover(Object.freeze({ from, to, name }));
    } catch {
    }
  }
  function capture() {
    return {
      sessionId,
      projectId: state.projectId,
      generation: state.generation,
      bookKey: bookKeyFor(sessionId, state.projectId)
    };
  }
  function isCurrent(guard) {
    if (guard === null || typeof guard !== "object") return false;
    const current = capture();
    return guard.sessionId === current.sessionId && guard.projectId === current.projectId && guard.generation === current.generation && guard.bookKey === current.bookKey;
  }
  function buildSnapshot2() {
    return Object.freeze({
      sessionId,
      projectId: state.projectId,
      generation: state.generation,
      bookKey: bookKeyFor(sessionId, state.projectId),
      projects: state.projects,
      projectsStatus: state.projectsStatus,
      projectsKnown: state.projectsStatus === "ready" || state.projectsStatus === "stale",
      projectsError: state.projectsError,
      core: state.core,
      work: state.work,
      process: state.process
    });
  }
  function snapshot() {
    return snapshotRef;
  }
  function notify() {
    for (const listener of [...listeners]) {
      try {
        listener(snapshotRef);
      } catch {
      }
    }
  }
  function publish2() {
    const next = buildSnapshot2();
    if (sameValue(next, snapshotRef)) return snapshotRef;
    snapshotRef = next;
    notify();
    return snapshotRef;
  }
  function commit(patch) {
    if (patch.projects !== void 0) state.projects = patch.projects;
    if (patch.projectsStatus !== void 0) state.projectsStatus = patch.projectsStatus;
    if (patch.projectsError !== void 0) state.projectsError = patch.projectsError;
    if (patch.core !== void 0) state.core = patch.core;
    if (patch.work !== void 0) state.work = patch.work;
    if (patch.process !== void 0) state.process = patch.process;
    return publish2();
  }
  function startRequest(channel) {
    epochs[channel] += 1;
    return { channel, epoch: epochs[channel], guard: capture() };
  }
  function tokenAlive(token) {
    return epochs[token.channel] === token.epoch && isCurrent(token.guard);
  }
  function projectsKnownNow() {
    return state.projectsStatus === "ready" || state.projectsStatus === "stale";
  }
  function resetBookResources() {
    state.core = UNKNOWN_RESOURCE;
    state.work = UNKNOWN_RESOURCE;
    state.process = UNKNOWN_RESOURCE;
  }
  function takeIdentity(nextProjectId) {
    if (nextProjectId === state.projectId) return false;
    state.projectId = nextProjectId;
    state.generation += 1;
    resetBookResources();
    return true;
  }
  function clearBookState() {
    state.projectId = null;
    state.generation += 1;
    state.projects = EMPTY_PROJECTS;
    state.projectsStatus = "unknown";
    state.projectsError = null;
    resetBookResources();
  }
  function handleFailure(channel, token, error, { exclude } = {}) {
    if (!tokenAlive(token)) return;
    const kind = typeof error?.projectionKind === "string" ? error.projectionKind : "transport";
    if (channel !== "projects" && IDENTITY_FAILURE_KINDS.has(kind)) {
      const lost = Object.freeze({
        projectId: token.guard.projectId,
        kind,
        message: error instanceof Error ? error.message : String(error)
      });
      clearBookState();
      publish2();
      reportIdentityLost(lost);
      void discoverAndReadCore(exclude);
      return;
    }
    if (channel === "projects") {
      commit({
        projects: projectsKnownNow() ? state.projects : EMPTY_PROJECTS,
        projectsStatus: projectsKnownNow() ? "stale" : "error",
        projectsError: errorSnapshot(error)
      });
      return;
    }
    commit({ [channel]: failedResource(state[channel], error) });
  }
  async function readProjects({ discover = false, exclude = null } = {}) {
    const token = startRequest("projects");
    let list = null;
    try {
      list = normalizeProjects(await bookSource.projects(sessionId));
    } catch (error) {
      handleFailure("projects", token, error);
      return false;
    }
    if (!tokenAlive(token)) return false;
    commit({ projects: stableValue(list), projectsStatus: "ready", projectsError: null });
    if (!discover || state.projectId !== null || list.length === 0) return false;
    const picked = exclude === null ? list[0] : list.find((project) => project.id !== exclude);
    if (picked === void 0) return false;
    takeIdentity(picked.id);
    publish2();
    return true;
  }
  async function readCore(mode) {
    const token = startRequest("events");
    const projectId = token.guard.projectId;
    if (projectId === null) return false;
    const base = state.core.known ? state.core.data : null;
    const delta = mode === "delta" && base !== null;
    let payload = null;
    try {
      payload = await bookSource.events(sessionId, projectId, delta ? base.cursor : null);
    } catch (error) {
      handleFailure("core", token, error, { exclude: projectId });
      return false;
    }
    if (!tokenAlive(token)) return false;
    let data = null;
    try {
      data = stableValue(normalizeCore(payload, { base, delta }));
    } catch (error) {
      handleFailure("core", token, error, { exclude: projectId });
      return false;
    }
    commit({ core: readyResource(data) });
    reportIdentityLost(null);
    return true;
  }
  async function readSidecar(channel) {
    const token = startRequest(channel);
    const projectId = token.guard.projectId;
    if (projectId === null) return;
    let payload = null;
    try {
      payload = await bookSource[channel](sessionId, projectId);
    } catch (error) {
      handleFailure(channel, token, error, { exclude: projectId });
      return;
    }
    if (!tokenAlive(token)) return;
    let data = null;
    try {
      data = stableValue(channel === "work" ? normalizeWork(payload) : normalizeProcess(payload));
    } catch (error) {
      handleFailure(channel, token, error, { exclude: projectId });
      return;
    }
    commit({ [channel]: readyResource(data) });
  }
  function startSidecars() {
    void readSidecar("work");
    void readSidecar("process");
  }
  async function discoverAndReadCore(exclude = null) {
    const discovered = await readProjects({ discover: true, exclude });
    if (!discovered) return;
    if (!await readCore("full")) return;
    if (exclude !== null) reportIdentityTakeover({ from: exclude, to: state.projectId });
    startSidecars();
  }
  async function refresh() {
    reportIdentityLost(null);
    let needsCore = state.projectId !== null;
    if (!needsCore) needsCore = await readProjects({ discover: true });
    if (!needsCore) return snapshotRef;
    const committed = await readCore("full");
    if (committed) startSidecars();
    return snapshotRef;
  }
  function selectProject(nextProjectId) {
    if (nextProjectId !== null && (typeof nextProjectId !== "string" || nextProjectId === "")) {
      throw new TypeError("projectId \u5FC5\u987B\u662F\u975E\u7A7A\u5B57\u7B26\u4E32\u6216 null");
    }
    if (nextProjectId === null) {
      clearBookState();
      publish2();
      reportIdentityLost(null);
      return Promise.resolve(snapshotRef);
    }
    if (takeIdentity(nextProjectId)) publish2();
    return refresh();
  }
  async function runPoll() {
    if (state.projectId === null) {
      await discoverAndReadCore();
      return;
    }
    if (await readCore(state.core.known ? "delta" : "full")) startSidecars();
  }
  function pollTick() {
    if (pollInFlight !== 0 && now() - pollStartedAt < POLL_STUCK_MS) return;
    const seq = pollSeq += 1;
    pollInFlight = seq;
    pollStartedAt = now();
    void runPoll().finally(() => {
      if (pollInFlight === seq) pollInFlight = 0;
    });
  }
  function tickSafely() {
    try {
      pollTick();
    } catch {
    }
  }
  function startScheduler() {
    if (pollHandle !== null) return;
    pollHandle = scheduler.setInterval(tickSafely, POLL_INTERVAL_MS);
  }
  function stopScheduler() {
    if (pollHandle === null) return;
    scheduler.clearInterval(pollHandle);
    pollHandle = null;
  }
  function teardown() {
    stopScheduler();
    pollInFlight = 0;
    pollStartedAt = 0;
    state.generation += 1;
    publish2();
  }
  function subscribe(listener) {
    if (typeof listener !== "function") {
      throw new TypeError("subscribe \u9700\u8981 listener \u51FD\u6570");
    }
    listeners.add(listener);
    if (listeners.size === 1) startScheduler();
    let disposed = false;
    return function dispose() {
      if (disposed) return;
      disposed = true;
      listeners.delete(listener);
      if (listeners.size === 0) teardown();
    };
  }
  return { snapshot, refresh, selectProject, capture, isCurrent, subscribe };
}

// src/contract-actions.js
var ACTION_FAMILIES = Object.freeze([
  "books",
  "wizard",
  "convert",
  "gates",
  "gold",
  "deep-modify",
  "collab-signals",
  "chapters",
  "patterns-ops"
]);
var ACTION_DEFINITIONS = [
  ["book-create", "books", "no-book", "callable", true, "create", null],
  ["book-rename", "books", "session-book", null, true, "rename", null],
  ["book-set-goal", "books", "session-book", null, true, "set_goal", null],
  // 票 `walkthrough-fixes/19`①②：工作台那两个**用户可拧的旋钮**——篇幅档位（速览/标准/精读，
  // 由它派生章节数上限与每章字数目标）与并发上限（一次最多派几个小助手）。
  // 它是**代用户操作**那一类（与改书名/改目标同族），所以进 AI 闭包：用户在对话里说「写成小书」
  // 时，AI 引导用户拍板后替他把这一格落下。
  ["book-set-knobs", "books", "session-book", "callable", true, "set-knobs", null],
  ["book-delete", "books", "session-book", "callable", true, "delete", null],
  ["wizard-suggest", "wizard", "no-book", "callable", false, null, null],
  // ⚠️ 票 `pre-gold-build/02`：同族的 `suggest-roles`（上传那一刻的角色识别）**退役**——
  // 上传屏不再有「角色」这一栏，角色改由探查段开头那一趟书级材料判定产出。
  ["convert-start", "convert", "session-book", "callable", false, null, null],
  ["retry-convert", "convert", "session-book", null, false, null, "compatibility"],
  // 票 `mineru-formats/03`（CONTEXT.md「材料缺口」）：材料不齐时书停在材料准备，用户对
  // 每一份红源逐个表态——「补传」走既有的上传写面，「删掉这份」只有这一个动作。
  // **只对 `failed` 的那一格开放**（判在 handler），所以它不是「随便删一份材料」的后门。
  ["source-remove", "convert", "session-book", "callable", false, null, null],
  ["nudge", "convert", "session-book", "callable", true, "nudge", null],
  ["resume", "convert", "session-book", "callable", true, "resume", null],
  ["gate-decide", "gates", "session-book", "callable", true, "gate", null, true],
  // 走查票 09（2026-10-06 裁决①）：`explore-confirm` 是**挡在相位上的硬闸门**
  // （`advance(project, 2, 3)`，`actions/gates.js`），同类兄弟 `outline-confirm` /
  // `chapters-review-confirm` / `final-approve` 全是 `agentCallable: true`——它此前够不着
  // 属于**漏登记**，不是「闸门不该给 AI」，所以补进 AI 闭包（agentInput 与规范名同名）。
  ["explore-confirm", "gates", "session-book", "callable", true, "explore-confirm", null, true],
  ["outline-confirm", "gates", "session-book", "callable", true, "outline-confirm", null, true],
  ["chapters-review-confirm", "gates", "session-book", "callable", true, "chapters-review-confirm", null],
  ["final-approve", "gates", "session-book", "callable", true, "final-approve", null],
  // 票 `walkthrough-fixes/37`：终检驳回意见的**拆条落账**（驳回那一刻由主笔调用，`redoItems` 每段
  // 必须是那句意见的连续子串）——重新交工的 `redoCheck` 与这一份条目集逐条对齐，漏一条拒收。
  // ⚠️ `workbenchExposure: null`：用户不按这颗键（他只在最后检查结果卡上写一句意见），
  // 拆条是主笔自己的活 ⇒ 它不进工作台可调用那一批，但进 AI 闭包（`agentInput` 与规范名同名）。
  ["final-redo-items", "gates", "session-book", null, true, "final-redo-items", null],
  ["rollback", "gates", "session-book", "callable", true, "rollback", null],
  // 票 `walkthrough-fixes/19`③：**跳过**那一格。它与既有四类豁免（`gate-skip` / `audit-skip` /
  // `progress-skip` / `other`）**不是一回事**：那四类经 `waived()` 读 `meta.waivers`，是**取消该检查**；
  // 这一格走 `meta.skippedSteps` ＋ 一条账，是**把验货推迟并记账**（第三态「已跳过（未验）」）。
  // ⚠️ `agentCallable: false` 是**有意的**：裁决写着「谁跳的＝用户」，而豁免那条路已经明文规定
  // 「主笔 AI 不能自己豁免」——跳过若让 AI 自己发，账上那句「用户跳的」就成了假话。
  // ⇒ 它和 `review` / `gold-target-words-set` 同类：只在工作台界面由用户自己点。
  ["skip-step", "gates", "session-book", "callable", false, null, null],
  ["gold-opinion", "gold", "session-book", "callable", true, "gold-opinion", null],
  ["gold-opinion-revoke", "gold", "session-book", "callable", true, "gold-opinion-revoke", null],
  ["gold-revise", "gold", "session-book", "callable", true, "gold-revise", null],
  ["gold-chapter-set", "gold", "session-book", null, true, "gold-chapter-set", null],
  // 票 `confirm-points-redesign-build/08`（站 8／站 9 拆屏）：**站 8 的两颗键**——
  // 「✅ 就用这一稿」（approved:true）与「🔁 不满意，重写这一章」（approved:false）是**同一个动作**
  // 的两个出口，两支都落 `工作区/决策/08.json`（「驳回也留」，规划票 04 §1）。
  // ⚠️ **能力档照 `gold-approve` 先例**（规划票 07 Q10 甲）：AI 可代操作、**但需用户明确同意**
  // ——它替用户对「这一稿行不行」表态，问不出这句同意就不许代按。
  // ⚠️ 它**不是**定稿键：定稿仍是 `gold-approve`（站 9 之后那一下，行为一个字没动）。
  ["gold-draft-approve", "gold", "session-book", "callable", true, "gold-draft-approve", null, true],
  ["gold-target-words-set", "gold", "session-book", "callable", false, null, null, true],
  // 走查票 09（2026-10-06 裁决①）：`gold-approve` 是范例章定稿的**唯一放行键**，此前
  // `agentCallable: false` ——与 `gold-opinion` / `gold-revise` / `gold-chapter-set` 那三个
  // 兄弟不一致，且 `agent-tool.js` 的工具描述当时把「gold 定稿类」写成可调用（描述与闭包
  // 不一致，AI 照描述调它却撞「未知操作」）⇒ 同样是**漏登记**，补进 AI 闭包。
  ["gold-approve", "gold", "session-book", "callable", true, "gold-approve", null],
  ["deep-modify", "deep-modify", "session-book", "callable", true, "deep-modify", null],
  ["deep-undo", "deep-modify", "session-book", "callable", true, "deep-undo", null],
  ["style-note", "collab-signals", "session-book", null, true, "style-note", null],
  ["style-note-revoke", "collab-signals", "session-book", null, true, "style-note-revoke", null],
  ["intervene", "collab-signals", "session-book", null, true, "intervene", null],
  ["intervene-done", "collab-signals", "session-book", null, true, "intervene-done", null],
  ["waive", "collab-signals", "session-book", null, true, "waive", null],
  ["waive-revoke", "collab-signals", "session-book", null, true, "waive-revoke", null],
  ["pause", "collab-signals", "session-book", "callable", true, "pause", null],
  ["review", "chapters", "session-book", "callable", false, null, null],
  ["review-revoke", "chapters", "session-book", "callable", false, null, null],
  // 票 `knowledge-graph-build/08`：**第三条「意见」通路**——知识点图上「🗑 这部分不造进书里」／
  // 「↩ 放回来（要讲）」（`src/ui/knowledge-graph-map.js` 的对话框）。
  // ⚠️ 既有两条「意见」通路**各自绑死阶段**（`gold-opinion` 只认 `awaiting-gold`／`pendingStage==='gold'`；
  // `review`／带 `chapter` 的 `gold-opinion` 只认 `phase===5`），这一屏在**阶段二探查确认卡**上
  // （`status === 'awaiting-explore'`）⇒ 那两条都够不着它，只能**新开这一条**（spec §6 末段那条
  // 落地代价）。三条**互不认领**：各认各的 status／phase，谁都不认领别人的那一档（判据在
  // `test-collab-backend.mjs`，两个方向的反例都在）。
  // ⚠️ **2026-10-17 · 票 `reader-cognition-boundary-build/06` 改判：`agentCallable` false → true**
  //    （`agentInput` 与规范名同名）。原注逐字是「与 `review` 同类——『谁划的＝用户』，主笔 AI
  //    不能替人把这本书的内容判掉」——那一半**今天仍然成立**，变的只是「谁敲的键」这一格：
  //    `ADR-0040` 决策 2 选了「**AI 读回卷件、代笔落同一支动作**」（下沿那一档）⇒ 那一跳要 AI
  //    真够得着这条通路，而写侧形状**一个字不动**（唯一调用点仍是 `actions/chapters.js` 的
  //    `case 'graph-opinion'`、`by` 仍只有 `EXCLUSION_BY_USER`＝`user`、`reason` 仍两档闭集、
  //    那份件仍**不** `appendEvent`）。「谁的意思＝用户」由 `by` 与回卷件本身追溯，
  //    ⛔ 不给 `by` 加第二个值、⛔ 不新开动作。判据与那条「唯一写侧」的对账住
  //    `test/test-knowledge-map-exclusions.mjs` 第 ⑩ 节与 `test/test-contract-action-catalog.mjs`。
  ["graph-opinion", "chapters", "session-book", "callable", true, "graph-opinion", null],
  ["audit-submit", "chapters", "session-book", null, true, "audit-submit", null],
  // 票 `walkthrough-2026-10/02`（走查 A10「同一文件多写者」的裁决）：**机器拼章正文**。
  // 子助手只落分片（`工作区/分片/chapter-NN-MM.md`），这一步按分片号拼出 `工作区/chapter-NN.md`；
  // 审计小助手读的就是机器拼出来的那一份（所以它必须在派审计**之前**被叫到）。
  // 它不是用户按的键（`workbenchExposure: null`）：用户看到的是章正文本身，拼装是内务。
  ["chapter-assemble", "chapters", "session-book", null, true, "chapter-assemble", null],
  ["stage-submit", "chapters", "session-book", null, true, "stage-submit", null],
  ["stage-brief", "chapters", "session-book", null, true, "stage-brief", null],
  // 票 `context-budget/18`：**派单正文改机器代填**——主笔只给「哪一档 ＋ 章号 ＋ 一句叮嘱」，
  // 机器按九份派发模板（＋ 终检那一节方法论文档）与这一段 brief／meta 的实际值拼好整份 prompt，
  // 由插件起子代理、把 id 回给主笔。
  // ⚠️ **名字有意不叫 `dispatch`**：`brief.dispatch` 已经占了那个词（票 02，含义是「该读／该产出的
  // 登记行」），一词两义正是 `CONTEXT.md` 里被当病治的「一号三用」（票 18 裁决条件 (a)）。
  // ⚠️ **归 `chapters` 族**：它派出去的活横跨五段（explore/gold/chapters/merge/final），但族是
  // 「实现单位」不是「只能管章」——`stage-brief` / `stage-submit` / `progress` / `chapter-assemble`
  // 那一族正是主笔在各工序里推流水线用的那一批，派单与它们同属一处；另立一个族只会多一处
  // 「族 id ≡ 文件名」的承重件而不多一分信息。
  // `workbenchExposure: null`：这不是用户按的键（用户看到的是章／报告本身），照 `stage-submit` 那一档。
  ["agent-assign", "chapters", "session-book", null, true, "agent-assign", null],
  ["progress", "chapters", "session-book", null, true, "progress", null],
  ["suggest-words", "patterns-ops", "session-book", "callable", false, null, null],
  ["pattern-analyze", "patterns-ops", "session-book", "callable", false, null, null],
  ["pattern-list", "patterns-ops", "session-book", "read-only", false, null, null],
  ["settings", "patterns-ops", "global", "callable", false, null, null],
  ["demo-run", "patterns-ops", "no-book", "callable", false, null, null],
  ["debug-spawn", "patterns-ops", "session-book", null, false, null, "internal-debug"],
  // 票 `knowledge-graph-build/12`：老书那颗「补一份知识点图」的键（补齐：已交出过材料报告、
  // 合并件里还没有图、且不是演示书的那本书）。机制全在 `src/workflow/knowledge-graph-build.js`
  // （票 04 的 `applyKnowledgeGraphBackfill`），这一条只是它的**身份**。
  // ⚠️ `agentCallable: false` 是**有意的**：这是「这本书要不要补一张图」的**用户表态**
  //（与 `review`／`skip-step`／`gold-target-words-set` 同类）——主笔 AI 不该替用户按这颗键。
  // `workbenchExposure: 'callable'`：它只在工作台界面由用户点（那张屏由票 12 落在阶段页）。
  ["knowledge-graph-backfill", "chapters", "session-book", "callable", false, null, null],
  // 票 `reader-cognition-boundary-build/03`：**读者情况问卷的往返通道**——`issue` 给出那一份
  // （服务端把屏一用的 `.md` 写进书夹，界面再走通用下载路由交给收卷人）、`submit` 收回卷
  // （造书用户把整段文字手粘回来，内容逐字落成书夹一份 `.md`）。
  // ⚠️ 两条都 `agentCallable: false`：发卷／粘回卷是**造书用户本人**的动作（与 `review`／
  //    `skip-step` 同一条理由——谁填的／谁粘的＝人，AI 不能代）。
  //    ⚠️ **2026-10-17（票 `rcb-build/06`）**：这一行原先还点着 `graph-opinion`，它已经**改判**为
  //    `agentCallable: true`（AI 读回卷件代笔那一条要够得着它）⇒ 这里把那个名字撤掉，⛔ 别照旧句读。
  // ⚠️ `workbenchExposure: 'callable'`：两颗键都在工作台界面上（问卷面板）。
  // ⚠️ 归 `chapters` 族：与站 2 的 `graph-opinion` 同一批「工序里由人动手」的动作，⛔ 不新开动作族
  //    （新族＝新 module ＋ 族闭包三处同改，而语义上它并不比 `chapters` 更窄）。
  ["reader-questionnaire-issue", "chapters", "session-book", "callable", false, null, null],
  ["reader-questionnaire-submit", "chapters", "session-book", "callable", false, null, null],
  // 票 `reader-questionnaire-ai-authoring/05`：**读卷那一路的派单**（回卷件落盘之后由主笔叫）：
  // 先冷恢复 `meta.questionnaireAgentId` 那一个子助手（`resumed`），唤不醒就新起一路上下文干净的
  // 读卷子代理（`rehydrated`，三件注入补齐），哪一档走过写进 `meta.questionnaireAgentResume`。
  // ⚠️ `agentCallable: true`：这是主笔自己的内务（与 `agent-assign` 同一档），不是用户按的键。
  // ⚠️ `workbenchExposure: null`：用户看到的不是这颗键，而是它派出去的那一路回来后的读数。
  ["reader-questionnaire-analyze", "chapters", "session-book", null, true, "reader-questionnaire-analyze", null]
];
function validateContractActionDefinition(definition) {
  if (!Array.isArray(definition?.actions) || !Array.isArray(definition?.families))
    throw new TypeError("\u52A8\u4F5C\u76EE\u5F55\u5B9A\u4E49\u5FC5\u987B\u5305\u542B actions \u4E0E families \u6570\u7EC4");
  const familyNames = new Set(definition.families);
  const canonicalNames = /* @__PURE__ */ new Set();
  for (const action of definition.actions) {
    if (typeof action?.name !== "string" || action.name === "")
      throw new TypeError("\u52A8\u4F5C\u76EE\u5F55\u542B\u65E0\u6548 canonical name");
    if (canonicalNames.has(action.name))
      throw new Error(`\u91CD\u590D canonical action: ${action.name}`);
    if (!familyNames.has(action.family))
      throw new Error(`\u672A\u77E5\u52A8\u4F5C\u65CF: ${action.family}`);
    canonicalNames.add(action.name);
  }
  const aliases = /* @__PURE__ */ new Set();
  for (const action of definition.actions) {
    if (action.agentInput == null) continue;
    if (typeof action.agentInput !== "string" || action.agentInput === "")
      throw new TypeError(`\u52A8\u4F5C ${action.name} \u7684 AI input \u65E0\u6548`);
    if (action.agentInput === action.name) continue;
    if (canonicalNames.has(action.agentInput))
      throw new Error(`AI input \u4E0E canonical action \u51B2\u7A81: ${action.agentInput}`);
    if (aliases.has(action.agentInput))
      throw new Error(`\u91CD\u590D AI alias: ${action.agentInput}`);
    aliases.add(action.agentInput);
  }
}
var CONTRACT_ACTIONS = Object.freeze(
  ACTION_DEFINITIONS.map(
    ([name, family, projectScope, workbenchExposure, agentCallable, agentInput, mark, writesStationDecision]) => Object.freeze({
      name,
      family,
      projectScope,
      workbenchExposure,
      agentCallable,
      agentInput,
      mark,
      writesStationDecision: writesStationDecision === true
    })
  )
);
validateContractActionDefinition({ actions: CONTRACT_ACTIONS, families: ACTION_FAMILIES });
var ACTION_BY_NAME = new Map(CONTRACT_ACTIONS.map((action) => [action.name, action]));
var STATION_DECISION_ACTION_NAMES = Object.freeze(
  CONTRACT_ACTIONS.filter((action) => action.writesStationDecision).map((action) => action.name)
);
var AGENT_ACTION_INPUTS = Object.freeze(
  CONTRACT_ACTIONS.filter((action) => action.agentCallable).map((action) => action.agentInput)
);
var ACTION_BY_AGENT_INPUT = new Map(
  CONTRACT_ACTIONS.filter((action) => action.agentCallable).map((action) => [action.agentInput, action])
);
function getContractAction(name) {
  return ACTION_BY_NAME.get(name) ?? null;
}

// src/workbench-actions.js
var EXPOSURE_WORD = Object.freeze({
  callable: "\u53EF\u8C03\u7528",
  "read-only": "\u53EA\u8BFB\u5C55\u793A"
});
function uiCallable(name) {
  const action = getContractAction(name);
  if (action === null) throw new Error(`\u5DE5\u4F5C\u53F0\u4E0D\u80FD\u53D1\u300C${name}\u300D\uFF1A\u5B83\u4E0D\u5728\u5951\u7EA6\u9762\u52A8\u4F5C\u76EE\u5F55\u91CC`);
  const word = EXPOSURE_WORD[action.workbenchExposure];
  if (action.workbenchExposure !== "callable")
    throw new Error(`\u5DE5\u4F5C\u53F0\u4E0D\u80FD\u53D1\u300C${name}\u300D\uFF1A\u76EE\u5F55\u91CC\u5B83\u662F${word ?? "\u4E0D\u5BF9\u5DE5\u4F5C\u53F0\u5F00\u653E"}`);
  return action.name;
}
function uiReadOnly(name) {
  const action = getContractAction(name);
  if (action === null) throw new Error(`\u5DE5\u4F5C\u53F0\u8BFB\u4E0D\u4E86\u300C${name}\u300D\uFF1A\u5B83\u4E0D\u5728\u5951\u7EA6\u9762\u52A8\u4F5C\u76EE\u5F55\u91CC`);
  if (action.workbenchExposure !== "read-only") {
    const word = EXPOSURE_WORD[action.workbenchExposure];
    throw new Error(
      `\u5DE5\u4F5C\u53F0\u7684\u53EA\u8BFB\u90A3\u4E00\u8DEF\u53EA\u6536\u53EA\u8BFB\u5C55\u793A\u52A8\u4F5C\uFF0C\u300C${name}\u300D\u5728\u76EE\u5F55\u91CC\u662F${word ?? "\u4E0D\u5BF9\u5DE5\u4F5C\u53F0\u5F00\u653E"}`
    );
  }
  return action.name;
}

// src/ui/update-notice.js
var import_react2 = require("react");
var PUBLISHED_PACKAGE = "dsh-craft-your-textbook";
var REGISTRY_LATEST_URL = `https://registry.npmjs.org/${PUBLISHED_PACKAGE}/latest`;
var UPGRADE_COMMAND = "npx dsh-craft-your-textbook --upgrade";
function installSpec(version) {
  return `${PUBLISHED_PACKAGE}@^${version}`;
}
var UPDATE_STATES = Object.freeze(["up-to-date", "behind", "ahead", "unreadable"]);
function parseReleaseVersion(raw) {
  const matched = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+][^\s]*)?$/u.exec(String(raw ?? "").trim());
  if (matched === null) return null;
  return [Number(matched[1]), Number(matched[2]), Number(matched[3])];
}
function classifyUpdate({ installed, latest }) {
  const from = parseReleaseVersion(installed);
  const to = parseReleaseVersion(latest);
  if (from === null || to === null) {
    return Object.freeze({ state: "unreadable", installed: null, latest: null });
  }
  let direction = 0;
  for (let index = 0; index < from.length; index += 1) {
    if (from[index] === to[index]) continue;
    direction = from[index] < to[index] ? -1 : 1;
    break;
  }
  return Object.freeze({
    state: direction < 0 ? "behind" : direction > 0 ? "ahead" : "up-to-date",
    installed: String(installed).trim(),
    latest: String(latest).trim()
  });
}
var INSTALLED_VERSION = true ? "2.0.1" : null;
var INSTALLED_PACKAGE = true ? "dsh-craft-your-textbook" : null;
var LAYER_STATES = Object.freeze(["published", "not-published", "unreadable"]);
function classifyLayer({ packageName, version } = {}) {
  const name = typeof packageName === "string" ? packageName.trim() : "";
  if (name === "") {
    return Object.freeze({ state: "unreadable", packageName: null, version: null });
  }
  const parsed = typeof version === "string" && version.trim() !== "" ? version.trim() : null;
  return Object.freeze({
    state: name === PUBLISHED_PACKAGE ? "published" : "not-published",
    packageName: name,
    version: parsed
  });
}
function layerBadge(layer) {
  if (layer?.state !== "not-published") return null;
  const version = layer.version === null ? "" : ` v${layer.version}`;
  return Object.freeze({
    label: `\u{1F9EA} \u5F00\u53D1\u7248${version}\uFF0C\u6539\u4ED3\u91CC\u7ACB\u523B\u751F\u6548`,
    hint: `\u4F60\u9A8C\u7684\u4E0D\u662F\u7528\u6237\u88C5\u5230\u7684\u90A3\u4E00\u4EFD\u53D1\u5E03\u7248\uFF08${layer.packageName}${layer.version === null ? "" : ` v${layer.version}`}\uFF09\u3002`,
    packageName: layer.packageName
  });
}
var pendingFor = (installedVersion) => Object.freeze({ state: "pending", installed: installedVersion, latest: null });
function createUpdateNoticeStore({
  fetchImpl = globalThis.fetch,
  installedVersion = INSTALLED_VERSION
} = {}) {
  let snapshot = pendingFor(installedVersion);
  const listeners = /* @__PURE__ */ new Set();
  let started = false;
  function getUpdateSnapshot() {
    return snapshot;
  }
  function subscribeUpdateNotice(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
  function publish2(next) {
    if (next.state === snapshot.state && next.installed === snapshot.installed && next.latest === snapshot.latest) {
      return;
    }
    snapshot = next;
    for (const listener of [...listeners]) listener();
  }
  function startUpdateCheck2() {
    if (started) return Promise.resolve(snapshot);
    started = true;
    if (installedVersion === null) {
      publish2(Object.freeze({ state: "unreadable", installed: null, latest: null }));
      return Promise.resolve(snapshot);
    }
    if (typeof fetchImpl !== "function") {
      publish2(Object.freeze({ state: "unreadable", installed: installedVersion, latest: null }));
      return Promise.resolve(snapshot);
    }
    return fetchImpl(REGISTRY_LATEST_URL).then((response) => {
      if (response?.ok !== true) throw new Error(`HTTP ${response?.status ?? "?"}`);
      return response.json();
    }).then((body) => {
      publish2(classifyUpdate({ installed: installedVersion, latest: body?.version }));
    }).catch(() => {
      publish2(Object.freeze({ state: "unreadable", installed: installedVersion, latest: null }));
    }).then(() => snapshot);
  }
  return Object.freeze({ getUpdateSnapshot, subscribeUpdateNotice, startUpdateCheck: startUpdateCheck2 });
}
var defaultStore = createUpdateNoticeStore();
function startUpdateCheck() {
  return defaultStore.startUpdateCheck();
}
function useUpdateNotice() {
  return (0, import_react2.useSyncExternalStore)(
    defaultStore.subscribeUpdateNotice,
    defaultStore.getUpdateSnapshot,
    defaultStore.getUpdateSnapshot
  );
}
function updateNoticeText(snapshotValue, layer) {
  if (layer?.state === "not-published") return null;
  if (snapshotValue?.state !== "behind") return null;
  return `\u9020\u4E66\u5DE5\u4F5C\u53F0\u6709\u65B0\u7248\u672C\uFF1Av${snapshotValue.latest}\uFF08\u4F60\u73B0\u5728\u662F v${snapshotValue.installed}\uFF09\u3002 \u4E0D\u60F3\u5F00\u547D\u4EE4\u884C\uFF1A\u63D2\u4EF6\u9875\u9762\u300C\u6DFB\u52A0\u63D2\u4EF6\u300D\u91CC\u8F93\u5165 ${installSpec(snapshotValue.latest)} \u5C31\u80FD\u88C5\u4E0A\u8FD9\u4E00\u7248\uFF1B \u6216\u8005\u8DD1\u8FD9\u4E00\u6761\uFF1A${UPGRADE_COMMAND} \u2014\u2014 \u4E24\u79CD\u88C5\u5B8C\u90FD\u8981\u91CD\u542F dsh\u3002`;
}

// src/ui/book-session-scope.js
var import_react14 = require("react");

// src/material-formats.js
var MINERU_KNOWN_EXTENSIONS = Object.freeze([
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "jp2",
  "webp",
  "gif",
  "bmp",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "html"
]);
var MATERIAL_FORMATS = Object.freeze([
  { ext: "pdf", family: "PDF", calibrated: true },
  { ext: "png", family: "\u56FE\u7247", calibrated: true },
  { ext: "jpg", family: "\u56FE\u7247", calibrated: false },
  { ext: "jpeg", family: "\u56FE\u7247", calibrated: false },
  { ext: "jp2", family: "\u56FE\u7247", calibrated: false },
  { ext: "webp", family: "\u56FE\u7247", calibrated: false },
  { ext: "gif", family: "\u56FE\u7247", calibrated: false },
  { ext: "bmp", family: "\u56FE\u7247", calibrated: false },
  { ext: "doc", family: "Word", calibrated: false },
  { ext: "docx", family: "Word", calibrated: true },
  { ext: "ppt", family: "\u5E7B\u706F\u7247", calibrated: false },
  { ext: "pptx", family: "\u5E7B\u706F\u7247", calibrated: false },
  { ext: "xls", family: "\u8868\u683C", calibrated: false },
  { ext: "xlsx", family: "\u8868\u683C", calibrated: false }
].map(Object.freeze));
var MATERIAL_FORMAT_EXCLUSIONS = Object.freeze([
  {
    ext: "html",
    why: "\u5B9E\u6D4B -10002 \u8BC1\u660E model_version \u662F\u8BF7\u6C42\u7EA7 \u21D2 html \u4E0D\u80FD\u4E0E\u975E HTML \u540C\u6279\uFF08\u5951\u7EA6\u5FEB\u7167 \xA74\uFF09\uFF0C\u800C\u672C\u4ED3 convertPdfBatch \u53EA\u6709\u4E00\u6761 model_version:'vlm' \u7684\u901A\u9053\uFF1B\u4E14\u672C\u4ED3\u5BF9 MinerU-HTML \u96F6\u6210\u529F\u8BB0\u5F55\u3002\u26A0\uFE0F \u6392\u9664\u7406\u7531**\u4E0D\u662F**\u300C\u5B83\u6709\u72EC\u7ACB\u989D\u5EA6\uFF08-60019\uFF09\u300D\u2014\u2014\u7968\u9762\u70B9\u540D\u5426\u6389\u8FC7\u90A3\u4E2A\u8BBA\u636E\uFF1A\u72EC\u7ACB\u989D\u5EA6\u6070\u6070\u662F\u5B83\u8BE5\u5355\u72EC\u6210\u6279\u7684\u8BC1\u636E\u3002\u8981\u6536\u5B83\uFF1A\u6539\u8FD9\u4E00\u884C\u4E4B\u5916\uFF0C\u8FD8\u987B\u7ED9 convertPdfBatch \u8865\u4E00\u6761 MinerU-HTML \u901A\u9053\uFF08\u4E24\u6279\u5404\u53D1\u4E00\u6B21\u7533\u8BF7\uFF09\u3002"
  }
].map(Object.freeze));
var MATERIAL_FORMAT_EXTENSIONS = Object.freeze(MATERIAL_FORMATS.map((f) => f.ext));
var MATERIAL_FORMAT_OFF_CHANNEL = Object.freeze([
  {
    ext: "epub",
    why: "\u4E91\u7AEF\u901A\u9053\uFF08file-urls/batch \uFF0B extract/task\uFF09\u7684\u683C\u5F0F\u6E05\u5355\u4E0D\u542B epub\u2014\u2014\u5B83\u662F MinerU 4.0 \u672C\u5730\u5F15\u64CE\u624D\u5403\u7684\u683C\u5F0F\uFF08\u5951\u7EA6\u5FEB\u7167 \xA78\uFF09\u3002\u767D\u540D\u5355\u662F\u901A\u9053\u80FD\u529B\u7684\u955C\u50CF\uFF0C\u653E\u4E0D\u653E\u5F00\u4E0D\u5F52\u672C\u4ED3\u51B3\u5B9A\u3002",
    // 「坏件探针怎么查」是**这一格**的事，不是「通道外」这个类别的隐含假设：epub 是 zip 容器
    // ⇒ 可以读它的中央目录。⚠️ 日后登记一个**不是 zip** 的通道外格式（票面设想过 md 也要出路）
    // 时，这一格若是 `"zip"`，一份**好** .md 会被判成「文件已损坏」——所以它必须逐条写清。
    container: "zip",
    // 上传区常显的那一行：只答「要不要转换、转成什么」，**短**（它紧贴「支持格式」那行，
    // 一长就会把同一屏下面的键继续往下推）。两条出路的具体命令在 `guidance` 里。
    hint: "epub \u9700\u5148\u8F6C\u6362\u624D\u80FD\u4E0A\u4F20\uFF1A\u7528 calibre \u6216 pandoc \u8F6C\u6210 PDF \u6216 .docx\uFF08\u9009\u5230\u5B83\u4F1A\u7ED9\u51FA\u5B8C\u6574\u505A\u6CD5\uFF09\u3002",
    // 选到它时那条红字：**可执行**到能照着敲（票面原话「不是只列白名单让人自己猜」）。
    guidance: "epub \u6682\u4E0D\u652F\u6301\u4E91\u7AEF\u89E3\u6790\u3002\u4E24\u6761\u51FA\u8DEF\uFF1A\u2460 \u7528 calibre \u6216 pandoc \u628A\u5B83\u8F6C\u6210 PDF \u540E\u4E0A\u4F20\uFF1B\u2461 \u6216\u7528\u672C\u5730 MinerU 4.0\uFF08\u547D\u4EE4\uFF1Amineru parse \u8FD9\u672C\u4E66.epub\uFF09\u89E3\u6790\u6210 Markdown\uFF0C\u518D\u7528 pandoc \u8F6C\u6210 .docx \u4E0A\u4F20\u3002"
  }
].map(Object.freeze));
var MATERIAL_FORMAT_OFF_CHANNEL_BY_EXT = new Map(MATERIAL_FORMAT_OFF_CHANNEL.map((f) => [f.ext, f]));
function materialFormatOffChannelOf(name) {
  return MATERIAL_FORMAT_OFF_CHANNEL_BY_EXT.get(materialExtensionOf(name)) ?? null;
}
var MATERIAL_INTAKE = Object.freeze({
  ACCEPTED: "accepted",
  UNSUPPORTED: "unsupported",
  OFF_CHANNEL: "off-channel",
  CORRUPT: "corrupt"
});
var MATERIAL_INTAKE_CODE = Object.freeze({
  UNSUPPORTED: "unsupported-material-format",
  OFF_CHANNEL: "material-channel-unavailable",
  CORRUPT: "material-file-corrupt"
});
function corruptOffChannelMaterialMessage(ext) {
  return `\u8FD9\u4EFD\u6587\u4EF6\u5DF2\u635F\u574F\uFF08${ext} \u7684 zip \u7ED3\u6784\u4E0D\u5B8C\u6574\uFF1A\u8BFB\u4E0D\u51FA\u53EF\u7528\u7684\u4E2D\u592E\u76EE\u5F55\uFF09\u3002\u8BF7\u91CD\u65B0\u83B7\u53D6\u4E00\u4EFD\u80FD\u6B63\u5E38\u6253\u5F00\u7684\u526F\u672C\u518D\u4E0A\u4F20\u3002`;
}
var ZIP_EOCD_SIGNATURE = Object.freeze([80, 75, 5, 6]);
var ZIP_CENTRAL_SIGNATURE = Object.freeze([80, 75, 1, 2]);
var ZIP_EOCD_MIN_BYTES = 22;
var ZIP_EOCD_MAX_COMMENT = 65535;
function zipBytesOf(bytes) {
  if (bytes === null || bytes === void 0) return null;
  if (bytes instanceof Uint8Array) return bytes;
  if (bytes instanceof ArrayBuffer) return new Uint8Array(bytes);
  if (ArrayBuffer.isView(bytes)) return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return null;
}
function zipU32(view, at) {
  return (view[at] | view[at + 1] << 8 | view[at + 2] << 16 | view[at + 3] << 24) >>> 0;
}
function zipStructureLooksBroken(bytes) {
  const view = zipBytesOf(bytes);
  if (view === null) return false;
  if (view.length < ZIP_EOCD_MIN_BYTES) return true;
  const earliest = Math.max(0, view.length - ZIP_EOCD_MIN_BYTES - ZIP_EOCD_MAX_COMMENT);
  let eocd = -1;
  for (let at = view.length - ZIP_EOCD_MIN_BYTES; at >= earliest; at -= 1) {
    if (view[at] !== ZIP_EOCD_SIGNATURE[0] || view[at + 1] !== ZIP_EOCD_SIGNATURE[1] || view[at + 2] !== ZIP_EOCD_SIGNATURE[2] || view[at + 3] !== ZIP_EOCD_SIGNATURE[3]) continue;
    const commentLength = view[at + 20] | view[at + 21] << 8;
    if (at + ZIP_EOCD_MIN_BYTES + commentLength === view.length) {
      eocd = at;
      break;
    }
  }
  if (eocd < 0) return true;
  const entries = view[eocd + 10] | view[eocd + 11] << 8;
  const dirSize = zipU32(view, eocd + 12);
  const dirOffset = zipU32(view, eocd + 16);
  if (entries === 65535 || dirSize === 4294967295 || dirOffset === 4294967295) return false;
  if (entries === 0) return false;
  if (dirOffset >= eocd || dirOffset + dirSize > eocd) return true;
  return !(view[dirOffset] === ZIP_CENTRAL_SIGNATURE[0] && view[dirOffset + 1] === ZIP_CENTRAL_SIGNATURE[1] && view[dirOffset + 2] === ZIP_CENTRAL_SIGNATURE[2] && view[dirOffset + 3] === ZIP_CENTRAL_SIGNATURE[3]);
}
function judgeMaterialFileIntake({ name, bytes = null } = {}) {
  if (isAcceptedMaterialFormat(name)) {
    return { status: MATERIAL_INTAKE.ACCEPTED, code: null, message: "", needsBytes: false };
  }
  const entry = materialFormatOffChannelOf(name);
  if (entry === null) {
    return {
      status: MATERIAL_INTAKE.UNSUPPORTED,
      code: MATERIAL_INTAKE_CODE.UNSUPPORTED,
      message: unsupportedMaterialFormatMessage(),
      needsBytes: false
    };
  }
  if (entry.container === "zip" && bytes !== null && bytes !== void 0 && zipStructureLooksBroken(bytes)) {
    return {
      status: MATERIAL_INTAKE.CORRUPT,
      code: MATERIAL_INTAKE_CODE.CORRUPT,
      message: corruptOffChannelMaterialMessage(entry.ext),
      needsBytes: true
    };
  }
  return {
    status: MATERIAL_INTAKE.OFF_CHANNEL,
    code: MATERIAL_INTAKE_CODE.OFF_CHANNEL,
    message: entry.guidance,
    needsBytes: true
  };
}
var MATERIAL_FORMAT_SET = new Set(MATERIAL_FORMAT_EXTENSIONS);
function materialExtensionOf(name) {
  const match = /\.([A-Za-z0-9]+)$/.exec(String(name ?? "").trim());
  return match === null ? "" : match[1].toLowerCase();
}
function isAcceptedMaterialFormat(name) {
  return MATERIAL_FORMAT_SET.has(materialExtensionOf(name));
}
var MATERIAL_FORMAT_BY_EXT = new Map(MATERIAL_FORMATS.map((f) => [f.ext, f]));
function materialFormatOf(name) {
  return MATERIAL_FORMAT_BY_EXT.get(materialExtensionOf(name)) ?? null;
}
var ORIGINAL_SOURCE_DIR = "sources";
function originalSourceRel(file) {
  return `${ORIGINAL_SOURCE_DIR}/${String(file ?? "")}`;
}
function originalPreviewOpenable(name) {
  const format = materialFormatOf(name);
  return format !== null && format.family !== "PDF";
}
function materialFormatFamily(name) {
  return materialFormatOf(name)?.family ?? "";
}
var AUTO_SPLIT_FAMILY = MATERIAL_FORMATS.find((f) => f.ext === "pdf")?.family ?? "";
function isAutoSplittableMaterial(name) {
  return AUTO_SPLIT_FAMILY !== "" && materialFormatFamily(name) === AUTO_SPLIT_FAMILY;
}
function materialFormatAccept() {
  return MATERIAL_FORMAT_EXTENSIONS.map((ext) => `.${ext}`).join(",");
}
function unsupportedMaterialFormatMessage() {
  const list = MATERIAL_FORMAT_EXTENSIONS.map((ext) => `.${ext}`).join("\u3001");
  return `\u8BF7\u9009\u62E9\u6750\u6599\u6587\u4EF6\uFF08\u652F\u6301\u7684\u540E\u7F00\uFF1A${list}\uFF09`;
}

// src/goal-doc-format.js
var GOAL_DOC_RE = /^目标-v([1-9]\d*)\.md$/u;
var GOAL_DOC_DIR_REL = "\u5DE5\u4F5C\u533A";
function goalDocName(version) {
  return `\u76EE\u6807-v${Number(version)}.md`;
}
function goalDocRel(version) {
  return `${GOAL_DOC_DIR_REL}/${goalDocName(version)}`;
}
function isGoalDocRel(rel) {
  const path = String(rel ?? "");
  if (!path.startsWith(`${GOAL_DOC_DIR_REL}/`)) return false;
  return GOAL_DOC_RE.test(path.slice(GOAL_DOC_DIR_REL.length + 1));
}
function readGoalDoc(text) {
  const goals = [];
  for (const line of String(text ?? "").split(/\r?\n/u)) {
    const match = /^\s*\d+[.、]\s*(.+?)\s*$/u.exec(line);
    if (match === null) continue;
    if (match[1] !== "") goals.push(match[1]);
  }
  return goals;
}

// src/domain-rules.js
var WORK_DIR_NAME = "\u5DE5\u4F5C\u533A";
var PROPOSAL_DIR_NAME = "\u65B9\u6848";
var PROCESS_DIR_NAME = "\u8FC7\u7A0B";
var ARCHIVE_DIR_NAME = "\u5B58\u6863";
var MATERIAL_DIR_NAME = "\u6750\u6599";
var CONVERTED_DIR_NAME = "\u8F6C\u6362\u7A3F";
var MANIFEST_FILE_NAME = "\u4EA7\u7269\u6E05\u5355.json";
var AUDIT_READINGS_FILE_NAME = "\u5BA1\u8BA1\u8BFB\u6570.json";
var AUDIT_READINGS_REL = `\u5DE5\u4F5C\u533A/${AUDIT_READINGS_FILE_NAME}`;
var DETAIL_DIR_NAME = "\u7EC6\u76EE";
var CHAPTER_SHARD_DIR_NAME = "\u5206\u7247";
var REPORT_DIR_NAME = "\u62A5\u544A";
var KNOWLEDGE_MAP_EXCLUSIONS_FILE_NAME = "knowledge-map-exclusions.json";
var KNOWLEDGE_MAP_EXCLUSIONS_REL = `${WORK_DIR_NAME}/${KNOWLEDGE_MAP_EXCLUSIONS_FILE_NAME}`;
var MATERIAL_JUDGMENT_NAME = "\u6750\u6599\u5224\u5B9A.json";
var MATERIAL_JUDGMENT_REL = `${WORK_DIR_NAME}/${MATERIAL_JUDGMENT_NAME}`;
var READER_QUESTIONNAIRE_ISSUED_FILE_NAME = "\u8BFB\u8005\u60C5\u51B5\u95EE\u5377.md";
var READER_QUESTIONNAIRE_RETURNED_FILE_NAME = "\u8BFB\u8005\u60C5\u51B5\u56DE\u5377.md";
var READER_QUESTIONNAIRE_ISSUED_REL = `${WORK_DIR_NAME}/${READER_QUESTIONNAIRE_ISSUED_FILE_NAME}`;
var READER_QUESTIONNAIRE_RETURNED_REL = `${WORK_DIR_NAME}/${READER_QUESTIONNAIRE_RETURNED_FILE_NAME}`;
var READER_QUESTIONNAIRE_TEXT_FILE_NAME = "\u95EE\u5377\u9898\u9762.json";
var READER_QUESTIONNAIRE_TEXT_REL = `${WORK_DIR_NAME}/${READER_QUESTIONNAIRE_TEXT_FILE_NAME}`;
var READER_QUESTIONNAIRE_INTENT_FILE_NAME = "\u95EE\u5377\u610F\u56FE.md";
var READER_QUESTIONNAIRE_INTENT_REL = `${WORK_DIR_NAME}/${READER_QUESTIONNAIRE_INTENT_FILE_NAME}`;
var READER_QUESTIONNAIRE_VERDICT_FILE_NAME = "\u95EE\u5377\u5224\u65AD.json";
var READER_QUESTIONNAIRE_VERDICT_REL = `${WORK_DIR_NAME}/${READER_QUESTIONNAIRE_VERDICT_FILE_NAME}`;
var DECISION_DIR_NAME = "\u51B3\u7B56";
var DECISION_DIR_REL = `${WORK_DIR_NAME}/${DECISION_DIR_NAME}`;
var PROPOSAL_DIR_REL = `${WORK_DIR_NAME}/${PROPOSAL_DIR_NAME}`;
var ARCHIVE_DIR_REL = `${PROCESS_DIR_NAME}/${ARCHIVE_DIR_NAME}`;
var CONVERTED_DIR_REL = `${MATERIAL_DIR_NAME}/${CONVERTED_DIR_NAME}`;
var LEGACY_WORK_DIR_NAME = "work";
var LEGACY_PROPOSAL_DIR_NAME = "\u63D0\u6848";
var LEGACY_ARCHIVE_DIR_NAME = "snapshots";
var LEGACY_CONVERTED_DIR_NAME = "sources-md";
var LEGACY_DIR_RELS = Object.freeze([
  { legacy: `${LEGACY_WORK_DIR_NAME}/`, current: `${WORK_DIR_NAME}/` },
  { legacy: `${LEGACY_PROPOSAL_DIR_NAME}/`, current: `${PROPOSAL_DIR_REL}/` },
  { legacy: `${LEGACY_ARCHIVE_DIR_NAME}/`, current: `${ARCHIVE_DIR_REL}/` },
  { legacy: `${LEGACY_CONVERTED_DIR_NAME}/`, current: `${CONVERTED_DIR_REL}/` }
].map(Object.freeze));
function posixBookRel(rel) {
  return String(rel ?? "").replace(/\\/g, "/").replace(/^(?:\.\/)+/, "");
}
function normalizeBookRel(rel) {
  const path = posixBookRel(rel);
  for (const pair of LEGACY_DIR_RELS) {
    if (path.startsWith(pair.legacy)) return `${pair.current}${path.slice(pair.legacy.length)}`;
  }
  return path;
}
var SPEC_ROLE = "\u89C4\u8303";
var DISCLOSE_MODES = Object.freeze(["never", "pointer", "inline"]);
var ARTIFACT_SCOPES = Object.freeze(["book", "chapter", "material", "reference"]);
var ARTIFACT_PRODUCERS = Object.freeze(["ai", "subagent", "machine", "user"]);
var MANIFEST_ROW_KEYS = Object.freeze([
  "role",
  "path",
  "producer",
  "scope",
  "disclose",
  "deliverable"
]);
var STAGE_STATES = Object.freeze(["missing", "stale", "unconfirmed", "ready"]);
var STAGE_STATE_BY_REASON = Object.freeze({
  artifact: "missing",
  stale: "stale",
  review: "unconfirmed",
  submit: "unconfirmed"
});
var NUMBERED_SEGMENT = "{n}";
var BOOK_PRODUCT_FAMILIES = Object.freeze([
  {
    family: "\u5199\u4F5C\u89C4\u8303",
    role: "\u5199\u4F5C\u89C4\u8303",
    path: `${WORK_DIR_NAME}/style-spec.md`,
    producer: "ai",
    scope: "book",
    disclose: "pointer",
    deliverable: false
  },
  {
    family: "\u7AE0\u8282\u5B89\u6392",
    role: "\u7AE0\u8282\u9AA8\u67B6",
    path: `${WORK_DIR_NAME}/outline.md`,
    producer: "machine",
    scope: "book",
    disclose: "pointer",
    deliverable: false
  },
  {
    family: "\u7AE0\u8282\u6B63\u6587",
    // ⚠️ 对照表没有「章节正文」这一角色，暂按「它由 merge 拼进成品书」挂到成品书（待裁决）。
    role: "\u6210\u54C1\u4E66",
    path: `${WORK_DIR_NAME}/chapter-${NUMBERED_SEGMENT}.md`,
    // ⚠️ **票 `walkthrough-2026-10/02` 把这里的 `producer` 从 `subagent` 改成 `machine`**：
    // 这一族原先由执笔小助手**直接写**，于是「拆两半派」时两个写者写同一个文件、零互斥零合并
    // （走后查 A10）。换协议之后章正文**由机器从分片拼**（唯一写入者），小助手写的是下面那一族。
    producer: "machine",
    scope: "chapter",
    disclose: "pointer",
    deliverable: true
  },
  {
    family: "\u7AE0\u8282\u6B63\u6587\u5206\u7247",
    role: "\u6210\u54C1\u4E66",
    // 挂靠理由同「章节正文」：对照表没有这一角色，按「它被拼进那份交付物」挂。
    // ⚠️ **目录族**（与「细目」「报告」同款）：一份分片叫什么、有几份，由派工那一路决定
    // （一路一个号），清单不该手抄。落在这族内 ⇒ 对账自动对上（ADR-0031 的接口清单口径）。
    path: `${WORK_DIR_NAME}/${CHAPTER_SHARD_DIR_NAME}/*`,
    producer: "subagent",
    scope: "chapter",
    disclose: "pointer",
    deliverable: false
  },
  {
    family: "\u524D\u8A00",
    role: "\u6210\u54C1\u4E66",
    path: `${WORK_DIR_NAME}/preface.md`,
    producer: "ai",
    scope: "book",
    disclose: "pointer",
    deliverable: true
  },
  {
    family: "\u6210\u54C1",
    role: "\u6210\u54C1\u4E66",
    path: `${WORK_DIR_NAME}/book.md`,
    producer: "machine",
    scope: "book",
    disclose: "pointer",
    deliverable: true
  },
  {
    family: "\u7EC6\u76EE",
    role: "\u6E90\u6750\u6599\u7D22\u5F15",
    // ⚠️ 票 11 把**精读细目本身**收编进这一族（它原先单独占一行 `工作区/reading-{n}.md`）。
    // **那一行随票退役，不留第二份**：同一族既声明 `工作区/细目/*` 又声明一个更窄的具体名，
    // 「缺件」就会把同一件事点名两次（目录族已覆盖），而「多件」判定又不受影响——
    // 两头都不划算。收窄形状的合法改法写在 ADR-0031「给下游票的接口清单 · 票 11」那一节。
    path: `${WORK_DIR_NAME}/${DETAIL_DIR_NAME}/*`,
    producer: "subagent",
    scope: "book",
    disclose: "pointer",
    deliverable: false
  },
  {
    family: "\u62A5\u544A",
    role: "\u6210\u54C1\u4E66",
    path: `${WORK_DIR_NAME}/${REPORT_DIR_NAME}/*`,
    producer: "subagent",
    scope: "book",
    disclose: "pointer",
    deliverable: false
  },
  {
    family: "\u63A2\u67E5\u62A5\u544A",
    role: "\u6E90\u6750\u6599\u7D22\u5F15",
    path: `${WORK_DIR_NAME}/explore.md`,
    producer: "ai",
    scope: "book",
    disclose: "pointer",
    deliverable: false,
    onlyWhen: "sources"
  },
  {
    family: "\u77E5\u8BC6\u5730\u56FE",
    role: "\u77E5\u8BC6\u5730\u56FE",
    path: `${WORK_DIR_NAME}/knowledge-map.json`,
    producer: "machine",
    scope: "book",
    disclose: "pointer",
    deliverable: false,
    onlyWhen: "sources"
  },
  {
    // 票 `.scratch/chapter-teaching-handbook/issues/05`：**章级切片**的伴生交付件。
    // 机器从知识地图 ＋ 章节安排确定性派生（零 LLM，见 `workflow/knowledge-structure.js`），
    // 跟着 book.md 一起交付，但⛔ **不拼进 book.md**（书的正文边界不变）。
    // `onlyWhen: 'sources'`：没有知识地图的书本来就没有可派生的结构 ⇒ 不凭空多一条恒缺件。
    family: "\u77E5\u8BC6\u7ED3\u6784",
    role: "\u77E5\u8BC6\u5730\u56FE",
    path: `${WORK_DIR_NAME}/\u77E5\u8BC6\u7ED3\u6784.md`,
    producer: "machine",
    scope: "book",
    disclose: "pointer",
    deliverable: true,
    onlyWhen: "sources"
  },
  {
    family: "\u77E5\u8BC6\u5730\u56FE\u5206\u7247",
    role: "\u77E5\u8BC6\u5730\u56FE",
    path: `${WORK_DIR_NAME}/knowledge-map-${NUMBERED_SEGMENT}.json`,
    producer: "subagent",
    scope: "book",
    disclose: "pointer",
    deliverable: false,
    onlyWhen: "sources"
  },
  // ⚠️ **这里曾经有一行 `工作区/reading-${NUMBERED_SEGMENT}.md`（family「精读细目」），
  // 票 11 把它并进上面的「细目」目录族了**——退役理由见那一行的注记。
  // 留这句注释是刻意的：哪天有人以为「精读细目该有自己的行」而加回来，
  // 「缺件点名两次」这件事就在注记里等着他。
  // ── 下面四行是 **2026-10-04 复核补的**：扫盘面原先用 `productOpenMode(...) === 'machine'`
  // 当「这是不是产物」的判据，于是**所有不开预览的产物都进不了登记**，而它们又在清单里被声明着
  // ⇒ 「前言」「知识地图分片」两族**恒缺件**（真书 `当代中国政府与政治精要/工作区/` 里
  // `preface.md` 与 `knowledge-map-01.json` 都在盘上，却永远点不出「在」）。
  // 一个恒红的判据比没有判据更坏（它教人忽略缺件那一半）。根因见 `SWEEP_EXCLUDED` 上方注记。
  {
    family: "\u7AE0\u5BA1\u8BA1",
    role: "\u6210\u54C1\u4E66",
    // 挂靠理由同「章节正文」：对照表没有「检查记录」这一角色，按「它服务于交付物」挂。
    path: `${WORK_DIR_NAME}/audit-${NUMBERED_SEGMENT}.md`,
    producer: "subagent",
    scope: "chapter",
    disclose: "pointer",
    deliverable: false
  },
  {
    // 票 `audit-gate-semantics/01`：审计读数行（`{errors_open, warnings_open, fixed, accepted}`）
    // 的落点。它由**机器**从各章 `audit-NN.md` 现算写回（`refreshAuditReadings`），不是审计员交的件。
    // ⚠️ 它是**派生快照**：闸门只从 `audit-NN.md` 现算，不读这份文件当判据（⛔ 过期快照不许洗绿）。
    // 为什么仍要进「应当有什么」：它落在书夹里；不声明就会被盘面对账报成「多件」，而多件恒红。
    family: "\u5BA1\u8BA1\u8BFB\u6570",
    role: "\u6210\u54C1\u4E66",
    path: AUDIT_READINGS_REL,
    producer: "machine",
    scope: "book",
    disclose: "never",
    deliverable: false
  },
  {
    family: "\u8DE8\u7AE0\u5BA1\u8BA1",
    role: "\u6210\u54C1\u4E66",
    path: `${WORK_DIR_NAME}/audit-cross.md`,
    producer: "subagent",
    scope: "book",
    disclose: "pointer",
    deliverable: false
  },
  {
    family: "\u98CE\u683C\u7EBF",
    role: "\u98CE\u683C\u4E0E\u8BED\u6CD5",
    // 风格线是**真产物**（gold/chapters 的 `brief.references` 必读件），今天不开预览只是
    // `productOpenMode` 白名单里没有它——那是界面取词那一面的事，不该由清单替它回避。
    path: `${WORK_DIR_NAME}/style-line.md`,
    producer: "user",
    scope: "book",
    disclose: "pointer",
    deliverable: false
  },
  {
    // 票 `premature-announce/02`：**材料判定产物**从这一票起进「应当有什么」。
    //
    // 病（同票 ④′ 那条判据实测）：`工作区/材料判定.json` 是**探查段交工验货要的一件**
    // （`exploreArtifactProblems` → `materialJudgmentProblems`，缺了当场 400），却既不在本表、
    // 也不在 `SWEEP_EXCLUDED` ⇒ 它以「**多件**」的身份进每一本真书的产物对账
    // （「多件任何时候都是红的」，见 `book-shape.js` 文件头），而恒红那一半没人再看。
    // 同形实测见 `docs/测试信任边界.md` 演示通道那一行：真书今天同一形状。
    //
    // ⚠️ **只声明「有源的书」要它**（`onlyWhen: 'sources'`）：零源的书不探查、没有角色可判，
    // 凭空要一份等于给每一本零源书多一条**恒缺件**（`materialJudgmentProblems` 窄处②同一条理由）。
    // ⚠️ **不是读者成品**（`deliverable: false`）：它是机器与判定小助手之间的中间产物；
    // `producer` 取 `subagent`——写入者是那一趟书级材料判定小助手（派发档 `material-survey`），
    // 不是 `machine`（机器只读它、并进合并件）。
    family: "\u6750\u6599\u5224\u5B9A",
    role: "\u6E90\u6750\u6599\u7D22\u5F15",
    path: MATERIAL_JUDGMENT_REL,
    producer: "subagent",
    scope: "book",
    disclose: "pointer",
    deliverable: false,
    onlyWhen: "sources"
  }
  // ⚠️ **这里曾经有一族「大纲契约」`工作区/outline-contract.md`**——票 `premature-announce/02`
  // 把它**退役**了，理由是**它没有任何生产者**：`src/**` 里除本表之外零处提到这一族
  // （票面第 3 条要的「死条目不许静静躺着」，判据见 `test-premature-announce.mjs` 的 ④′
  // `deadDeclarationFamilies`）。它当年的职责（机器写的章节契约）今天由 `workflow/actions/chapters.js`
  // 的 `outline` 那一支在**交工那一刻**落进 `工作区/outline.md`（契约字段 `chapters[].points` /
  // `volumeReason` 就在那一份里），所以「契约」不再是**另一份文件**，而是那份大纲的一个字段面。
  // ⚠️ 留这句注释是刻意的（与「细目」那一族退役 `reading-{n}.md` 同一纪律）：哪天有人以为
  // 「大纲契约该有自己的文件」而加回来，上面那条判据会**当场点名**——声明一族就得有生产者。
]);
var SPEC_ROWS = Object.freeze([
  // ── 挂载面／派发面真的要用到的（`disclose ≠ "never"`）──
  { role: SPEC_ROLE, path: "resources/SKILL.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false },
  { role: SPEC_ROLE, path: "resources/references/source-material.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false },
  { role: SPEC_ROLE, path: "resources/references/patterns/README.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false },
  { role: SPEC_ROLE, path: "resources/references/file-contracts.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false },
  // `inline` 的**唯一**一行：§九。其余小节走 pointer／状态迁移→节表。
  // ⚠️ **票 `confirm-points-redesign-build/13`（spec §5.4 D1）：声明面从文件粒度收到节粒度。**
  // 那一列原先只有「整份 `disclose: inline`」这一种写法，而实现常驻的只有 `## 九、` 那一节
  // ⇒ 声明面比实现面宽了两万多字符（清单表达不了「只常驻一节」）。`sections` 就是那一格：
  // **`inline` 的行必须说清常驻的是哪几节**（来源与指针仍由它说，⛔ 不在代码里另写一个节号字面量）。
  // ⚠️ **票 `nine-resident-downgrade/01`（2026-10-29）：交付形态从「整节正文」改成「摘要」。**
  // `sections` 原样保留（来源不变）；**新增** `residentLines` 声明注入面真的交出去的那四行
  // （两行规则 ＋ 两条内容词）。四行**只住在这里**：`engine.js` 只消费
  // `residentDeclaration()` 的返回值，⛔ 不硬写节号、⛔ 不另写一份四行字面量。
  // `lines` 为空数组时注入面退回按 `sections` 取正文（给「将来另一份文档真要整节常驻」留同一条接口）。
  {
    role: SPEC_ROLE,
    path: "resources/references/audit-and-testing.md",
    producer: "machine",
    scope: "reference",
    disclose: "inline",
    sections: ["## \u4E5D\u3001"],
    residentLines: [
      "\u5DE5\u5177\u7EAA\u5F8B\uFF1A\u6587\u4EF6 I/O \u53EA\u7528\u6587\u4EF6\u5DE5\u5177\uFF08read\uFF0Fwrite\uFF0Fedit\uFF0Fglob\uFF0Fgrep\uFF09\uFF0C\u4E0D\u7528 shell\uFF08\u5DE5\u5177\u7EAA\u5F8B\u89C1 audit-and-testing.md \xA7\u4E5D\uFF0C\u8DE8\u5E73\u53F0\u4E00\u81F4\uFF09\u3002",
      "\u56DE\u704C\uFF1A\u5B50\u4EE3\u7406\u56DE\u62A5 \u22641K token\uFF0C\u8D85\u51FA\u5C31\u5199\u4EA7\u7269\u6587\u4EF6\u3001\u53EA\u56DE\u8DEF\u5F84\uFF08\u9010\u7C7B\u4E00\u6863\u8868\u89C1 audit-and-testing.md \xA7\u4E5D\u300C\u56DE\u704C\u4E09\u4EF6\u5957\u300D\uFF09\u3002",
      "\u5224\u67D0\u6761\u77E5\u8BC6\u70B9\u8BE5\u8BB2\u5230\u591A\u6DF1\u65F6\uFF0C\u7528\u300C\u6DF1\u5EA6\u56DB\u7EF4\u627F\u8BFA\u8868\u300D\u9010\u7EF4\u81EA\u95EE\uFF08\u5224\u5B9A\u95EE\u9898\u5728 resources/references/depth.md\uFF09\u3002",
      "\u62FF\u4E0D\u51C6\u67D0\u6761\u300C\u4E0D\u53D8\u91CF\u5E95\u7EBF I1-I4\u300D\u9002\u7528\u54EA\u6761\u8DEF\u7EBF\u65F6\uFF0C\u56DE\u8BFB resources/references/invariants.md \u7684\u7F16\u53F7\u3002"
    ],
    deliverable: false
  },
  { role: SPEC_ROLE, path: "resources/references/delivery-checklist.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false },
  { role: SPEC_ROLE, path: "resources/references/invariants.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false },
  // ⚠️ **票 `confirm-points-redesign-build/13`：`manages` 那一格的口径**——
  // 一行要么在**挂载面的一页纸登记表**（`engine.METHODOLOGY_ONEPAGE`，＝这一步真的会挂它）里有条目，
  // 要么**自己带 `manages`**（管什么 ＋ 什么时候该读），**两样不许同时有**（那才是「手写第二份」）。
  // 包地图（`resources/package-map.md`）逐行照这两处取，所以「一份文档管什么」永远只有一个说法。
  { role: SPEC_ROLE, path: "resources/references/subagent-prompts/close-reading-prompt.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false, manages: { what: "\u7CBE\u8BFB\u5C0F\u52A9\u624B\u6D3E\u53D1\u6A21\u677F\uFF08\u7EC6\u76EE\u843D\u76D8 \uFF0B \u22642K token \u56DE\u704C\u56DB\u6BB5\uFF09", when: "\u63A2\u67E5\u6BB5\u6D3E\u6BCF\u4E00\u8DEF\u7CBE\u8BFB\u65F6\u6309\u5B83\u586B" } },
  // 票 `pre-gold-build/01`：探查段开头那一趟**书级材料判定**的派发模板（角色不再在上传那一刻猜）。
  // 它进这张清单不是因为「要注入给某一步」——而是**派发面的形状出处**（`dispatch-assembly.js` 的
  // `manifestRel()` 按这张清单逐字解析模板路径，且 explore 交办里点名了它）。
  { role: SPEC_ROLE, path: "resources/references/subagent-prompts/material-survey-prompt.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false, manages: { what: "\u4E66\u7EA7\u6750\u6599\u5224\u5B9A\u6D3E\u53D1\u6A21\u677F\uFF08\u9010\u4EFD\u4E00\u4E2A role \uFF0B \u4E00\u53E5 basis\uFF09", when: "\u63A2\u67E5\u6BB5\u5F00\u5934\u6D3E\u6750\u6599\u5224\u5B9A\u90A3\u4E00\u8DEF\u65F6\u6309\u5B83\u586B" } },
  { role: SPEC_ROLE, path: "resources/references/subagent-prompts/gold-writing-agent-prompt.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false, manages: { what: "\u91D1\u6807\u51C6\u7AE0\u6267\u7B14\u6D3E\u53D1\u6A21\u677F\uFF08\u7AE0\u9AA8\u67B6 \uFF0B \u77E5\u8BC6\u70B9\u6E05\u5355 \uFF0B \u6750\u6599\u5B9A\u4F4D\uFF09", when: "\u7AD9 8 \u6D3E\u8303\u4F8B\u7AE0\u6267\u7B14\u5C0F\u52A9\u624B\u65F6\u6309\u5B83\u586B" } },
  { role: SPEC_ROLE, path: "resources/references/subagent-prompts/writing-agent-prompt.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false },
  { role: SPEC_ROLE, path: "resources/references/subagent-prompts/audit-agent-prompt.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false },
  { role: SPEC_ROLE, path: "resources/references/subagent-prompts/gold-audit-prompt.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false },
  { role: SPEC_ROLE, path: "resources/references/subagent-prompts/cross-audit-prompt.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false },
  // 票 `knowledge-graph-build/06`：**跨材料对齐**那一档的派发模板（探索段内再派的一路：
  // 读全部卡片、产跨材料的边与「同一件事」的合并结论）。判 `pointer` 与另六份同档——
  // 它是**派发面代填的形状出处**（`dispatch-assembly.js` 的 `templateRel()` 按这一行取 rel，
  // 这一行不在就当场抛「产物清单里没有这一行」），不是给主笔常驻读的正文。
  { role: SPEC_ROLE, path: "resources/references/subagent-prompts/alignment-prompt.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false, manages: { what: "\u8DE8\u6750\u6599\u5BF9\u9F50\u6D3E\u53D1\u6A21\u677F\uFF08\u8BFB\u5168\u90E8\u5361\u7247\uFF0C\u4EA7\u8DE8\u6750\u6599\u7684\u8FB9\u4E0E\u5408\u5E76\u7ED3\u8BBA\uFF09", when: "\u5168\u90E8\u7CBE\u8BFB\u5206\u7247\u843D\u76D8\u4E4B\u540E\u518D\u6D3E\u5BF9\u9F50\u5C0F\u52A9\u624B\u65F6\u6309\u5B83\u586B" } },
  // 票 `knowledge-graph-build/13`：**知识点图审校**那一档的派发模板（独立审校小助手——
  // 图的语义那一半的唯一读者：读全部卡片与边，收下机器现算的两条软读数）。判 `pointer` 与另几份同档
  // ——它同样是**派发面代填的形状出处**（`dispatch-assembly.js` 的 `templateRel()` 按这一行取 rel，
  // 这一行不在就当场抛「产物清单里没有这一行」），不是给主笔常驻读的正文。
  { role: SPEC_ROLE, path: "resources/references/subagent-prompts/graph-review-prompt.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false, manages: { what: "\u77E5\u8BC6\u70B9\u56FE\u5BA1\u6821\u6D3E\u53D1\u6A21\u677F\uFF08\u56FE\u7684\u8BED\u4E49\u90A3\u4E00\u534A\u7684\u552F\u4E00\u8BFB\u8005\uFF09", when: "\u6D3E\u56FE\u5BA1\u6821\u5C0F\u52A9\u624B\u65F6\u6309\u5B83\u586B" } },
  // 票 `reader-questionnaire-ai-authoring/04`：**写卷**那一档的派发模板（探查交工之后、发卷之前派一路
  // 续接型小助手，交题面 JSON ＋ 意图 `.md`，`childId` 记进 `meta.questionnaireAgentId`）。
  // 判 `pointer` 与另几份同档——它同样是**派发面代填的形状出处**（`dispatch-assembly.js` 的
  // `templateRel()` 按这一行取 rel，这一行不在就当场抛「产物清单里没有这一行」），不是给主笔常驻读的正文。
  { role: SPEC_ROLE, path: "resources/references/subagent-prompts/questionnaire-author-prompt.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false, manages: { what: "\u5199\u5377\u5C0F\u52A9\u624B\u6D3E\u53D1\u6A21\u677F\uFF08\u628A\u77E5\u8BC6\u70B9\u6807\u7B7E\u9010\u6761\u7FFB\u6210\u6536\u5377\u4EBA\u81EA\u7B54\u5F97\u4E86\u7684\u95EE\u8BDD\uFF09", when: "\u63A2\u67E5\u4EA4\u5DE5\u4E4B\u540E\u3001\u53D1\u5377\u4E4B\u524D\u6D3E\u5199\u5377\u5C0F\u52A9\u624B\u65F6\u6309\u5B83\u586B" } },
  // 票 `reader-questionnaire-ai-authoring/05`：**读卷**那一档的派发模板（回卷件落盘之后，冷恢复同一个
  // 写卷人；唤不醒就新起一路上下文干净的读卷子代理）。判 `pointer` 与另几份同档——它同样是**派发面
  // 代填的形状出处**（`dispatch-assembly.js` 的 `templateRel()` 按这一行取 rel，这一行不在就当场抛
  // 「产物清单里没有这一行」），不是给主笔常驻读的正文。
  { role: SPEC_ROLE, path: "resources/references/subagent-prompts/questionnaire-analyze-prompt.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false, manages: { what: "\u8BFB\u5377\u5C0F\u52A9\u624B\u6D3E\u53D1\u6A21\u677F\uFF08\u8BFB\u5B8C\u56DE\u5377\u4EF6\u5224\u300C\u54EA\u51E0\u6761\u53EF\u4EE5\u4E0D\u8BB2\u300D\u7684\u6761\u76EE\u7EA7\u7ED3\u8BBA\uFF09", when: "\u95EE\u5377\u56DE\u5377\u4EF6\u843D\u76D8\u4E4B\u540E\u6D3E\u8BFB\u5377\u5C0F\u52A9\u624B\u65F6\u6309\u5B83\u586B" } },
  // 编排脚本骨架（票 `chapter-audit-orchestration/03`）：铺章那一跳的审计改由宿主 `workflow` 工具驱动，
  // 主笔照这一份填脚本。判 `pointer`——它**不是**给成员读的派发模板，而是主笔「写脚本时回读一次」的
  // 形状出处；正文不常驻（常驻那一档仍然只有工具纪律 §九 那一页纸）。
  { role: SPEC_ROLE, path: "resources/references/workflow-scripts/chapter-audit.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false },
  // ⚠️ 补登记（2026-10-08，票 `.scratch/retro-env-friction/03`）：`anti-patterns.md` 一直被 **gate 交办正文
  // 点名**（「纪律见 resources/references/anti-patterns.md 的流程级反模式」），却从没进过这张清单 ⇒
  // 「注入件集合＝清单里 `disclose` 命中的切片」这条不变量有个缺口：**task／hints 正文里的字面量
  // 可以点名清单外的文档**，注入纪律（`disclose`）管不到它。判据是 `test-tool-discipline.mjs` 的
  // 全文点面扫描：每条被点名的 `resources/…` 都要「已登记 ＋ 从那份 brief 声明的根读得到」。
  { role: SPEC_ROLE, path: "resources/references/anti-patterns.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false, manages: { what: "\u6D41\u7A0B\u7EA7\u53CD\u6A21\u5F0F\uFF08agent \u7684\u9010\u5B57\u4F9B\u8FF0 \uFF0B \u8BE5\u600E\u4E48\u505A\uFF09", when: "\u5173\u5361\u4EA4\u529E\u91CC\u70B9\u540D\u5B83\u65F6\u3001\u6216\u8981\u5224\u67D0\u53E5\u8BDD\u662F\u4E0D\u662F\u6D41\u7A0B\u7EA7\u53CD\u6A21\u5F0F\u65F6" } },
  // ── 票 `confirm-points-redesign-build/13`（spec §5.4 D2）补登记；票 `inject-face-prune/02` 按真跑取证处置 ──
  // 先例＝`anti-patterns.md` 当年正是「一直被交办正文点名、却从没进过清单」那一件（上面那段注记）。
  // 这一族被 `resources/SKILL.md` 的「参考文件按需加载」表与 `audit-and-testing.md` 等
  // **注入得到的正文**点名（点名处实测：`depth.md` 8 份文档、`auditor-prompt-template.md` 1 份、
  // `two-routes.md` 2 份、`chapter-grammar-starter.md` 1 份）。
  // 2026-10-28 逐份拼九份真 brief 取证（`.scratch/inject-face-prune/evidence/brief-mentions.txt`）：
  //   · `depth.md` 在 7 份 brief 的 `methodology` 里命中（它住在 `audit-and-testing.md` §九 常驻块正文）
  //     ⇒ **保留 `pointer`**；删它会撞裁决 D 的「§九 不动」。
  //   · `two-routes.md`／`chapter-grammar-starter.md`／`auditor-prompt-template.md`（＋下一段的
  //     `mechanism.md`）在 `task`／`hints`／`outputs`／`references`／`methodology` 里**零命中**
  //     ⇒ 按裁决 §5「证明不了的一律删」降为 `never`（既有档位，语义＝一个字都不给）。
  // ⛔ 不删行、不删文件、不改 `manages`；文件本体与 SKILL.md 的手工导航仍可按路径人工查。
  // ⚠️ `never` 行不进包地图（地图是注入索引）；落盘存在性由 `test-book-shape.mjs` 断，
  // 「brief 里零出现」由 `test-tool-discipline.mjs` 断。
  { role: SPEC_ROLE, path: "resources/references/depth.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false, manages: { what: "\u56DB\u7EF4\u6DF1\u5EA6\u5224\u5B9A\u95EE\u9898\uFF08\u8FB9\u754C\uFF0F\u53CD\u4F8B\uFF0F\u524D\u7F6E\uFF0F\u8FC1\u79FB\uFF09", when: "\u5224\u67D0\u4E00\u6761\u77E5\u8BC6\u70B9\u7684\u8BB2\u6388\u6DF1\u5EA6\u6863\u4F4D\u65F6" } },
  { role: SPEC_ROLE, path: "resources/references/two-routes.md", producer: "machine", scope: "reference", disclose: "never", deliverable: false, manages: { what: "\u4E24\u6761\u8DEF\u7EBF\uFF08blueprint\uFF0Fhuman\uFF09\u7684\u5DEE\u5F02\u4E0E\u5404\u81EA\u94C1\u5F8B", when: "\u8981\u5224\u67D0\u6761\u7EAA\u5F8B\uFF0F\u4EA7\u7269\u5728\u4E24\u5957\u8DEF\u7EBF\u4E0A\u662F\u4E0D\u662F\u540C\u4E00\u4EF6\u4E8B\u65F6" } },
  { role: SPEC_ROLE, path: "resources/references/chapter-grammar-starter.md", producer: "machine", scope: "reference", disclose: "never", deliverable: false, manages: { what: "\u4ECE\u6A21\u5F0F\u5361\u7EC4\u5408\u7AE0\u8282\u8BED\u6CD5\u7684\u8D70\u67E5\u793A\u4F8B", when: "\u5173\u5361\u2461\u505A\u6559\u5B66\u6A21\u5F0F\u9009\u578B\u3001\u8981\u4E00\u4EFD\u677F\u5757\u8BED\u6CD5\u7684\u8D77\u6B65\u6837\u4F8B\u65F6" } },
  { role: SPEC_ROLE, path: "resources/references/auditor-prompt-template.md", producer: "machine", scope: "reference", disclose: "never", deliverable: false, manages: { what: "\u901A\u7528\u5BA1\u8BA1 prompt \u6A21\u677F A\uFF0FB\uFF08\u5BA1\u8BA1\u5C0F\u52A9\u624B\u7684\u901A\u7528\u53C2\u8003\uFF09", when: "\u8981\u770B\u4E0D\u5206\u6863\u7684\u5BA1\u8BA1\u63D0\u95EE\u5F62\u72B6\u65F6" } },
  // ── 票 `skill-catchup/02`（spec §4.4）：**机器事实对照件**（生成物，判据守它不漂） ──
  // 它是唯一允许写精确机器名的 reference：阶段／产物／闸门／工具动作／质量门今天是什么，由
  // `src/workflow/mechanism-facts.js` 从声明面现算、`scripts/gen-skill-mechanism.mjs --write` 落盘。
  // ⚠️ **判 `never`、带 `manages`，不进 `METHODOLOGY_ONEPAGE`**：2026-10-28 的真 brief 取证里它零命中
  // （票 `inject-face-prune/02`），按裁决 §5 从注入面降级；带 `manages` 仍只为保留「管什么」的唯一说法
  // （两处都写就是第二份，判据在 `test/test-path-index.mjs` 与包地图的互斥断）。
  { role: SPEC_ROLE, path: "resources/references/mechanism.md", producer: "machine", scope: "reference", disclose: "never", deliverable: false, manages: { what: "\u5DE5\u4F5C\u53F0\u673A\u5668\u4E8B\u5B9E\u5BF9\u7167\u4EF6\uFF1A\u9636\u6BB5/\u4EA7\u7269/\u95F8\u95E8/\u5DE5\u5177\u52A8\u4F5C/\u8D28\u91CF\u95E8", when: "\u9700\u8981\u7CBE\u786E\u673A\u5668\u540D\u6216\u8DEF\u5F84\u65F6" } },
  // ── 票 `confirm-points-redesign-build/13`（spec §5.5 E1）：**包地图**（模式资产层） ──
  // 「哪个文件能读／什么时候该读／谁产出它」的**生成物**：`node scripts/gen-package-map.mjs --write`
  // 照**本清单**（＋ 挂载面的一页纸登记表 ＋ `RESOURCE_ROOT_LINE`）现算出来，⛔ **不手写第二份**。
  // ⚠️ 它自己判 `pointer`：注入面给**一行**（路径 ＋ 它管什么），要读全文时按路径回读——
  // 这正是「常驻面只剩一行路径 ＋ 一句它管什么」那一格（整份地图不进上下文）。
  // ⚠️ 「管什么」取自**挂载面那一页纸登记表**（`METHODOLOGY_ONEPAGE` 的 `package-map.md` 那一格），
  // 所以这一行**不带 `manages`**——两处都有就是本票要消灭的「手写第二份」（判据逐行断「只有一个说法」）。
  { role: SPEC_ROLE, path: "resources/package-map.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false },
  // ── 本仓判它不进上下文的（`disclose === "never"`）──
  // ⚠️ 这一族**不进对账差集**（`scope === "reference"`），所以这里的 `*` 是**声明**、不是匹配器；
  // 判据（`test-book-shape.mjs`）断的是「每个 `never` 声明至少解析得出一份真文件」，防它腐烂成死声明。
  // 票 `skill-sync-from-hermes/01`：从技能库收回来的两份造书方法（D 档、整份直通发布包）。
  // 它们**不进注入面**（`never`）：没有哪一份 brief 需要常驻读它；读者按 `resources/SKILL.md`
  // 的「参考文件按需加载」表点名时按路径回读——与模式卡同一档（入口 pointer、本体 never）。
  { role: SPEC_ROLE, path: "resources/references/knowledge-list-organization.md", producer: "machine", scope: "reference", disclose: "never", deliverable: false, manages: { what: "\u300A\u77E5\u8BC6\u70B9\u6E05\u5355\u300B\u7684\u5408\u5E76\u65B9\u6CD5\uFF08\u4F55\u65F6\u505A\u3001\u56DB\u6B65\u7EC4\u7EC7\u3001\u4E09\u9053\u81EA\u68C0\uFF09", when: "\u5168\u90E8\u7CBE\u8BFB\u56DE\u6765\u4E4B\u540E\u3001\u7AE0\u8282\u9AA8\u67B6\u4E4B\u524D\uFF0C\u8981\u628A\u8BC1\u636E\u5408\u5E76\u6210\u4E00\u5F20\u6E05\u5355\u65F6" } },
  { role: SPEC_ROLE, path: "resources/references/novel-mode.md", producer: "machine", scope: "reference", disclose: "never", deliverable: false, manages: { what: "\u5C0F\u8BF4\u4F53\u6559\u6750\u5199\u6CD5\uFF08\u56DB\u4EF6\u5951\u7EA6\u3001\u6BCF\u7AE0\u4E09\u4EF6\u3001\u5206\u6279\u6D3E\u6D3B\u3001\u4E09\u7EA7\u5BA1\u8BA1\uFF09", when: "\u7528\u6237\u8981\u300C\u4F01\u4E1A\u804C\u5458\u89C6\u89D2\u8BB2\u77E5\u8BC6\u3001\u5168\u865A\u6784\u300D\u7684\u5C0F\u8BF4\u4F53\u65F6\uFF08human \u8DEF\u7EBF\u4E0B\u7684\u4E00\u79CD\u5199\u6CD5\uFF09" } },
  { role: SPEC_ROLE, path: "resources/references/patterns/*/*.md", producer: "machine", scope: "reference", disclose: "never", deliverable: false, manages: { what: "21 \u5F20\u6559\u5B66\u677F\u5757\u6A21\u5F0F\u5361\uFF08\u6309\u6559\u5B66\u95EE\u9898\u7FFB\uFF0C\u7ECF patterns/README.md \u90A3\u4E00\u884C\u8FDB\uFF09", when: "\u5173\u5361\u2461\u9009\u6559\u5B66\u6A21\u5F0F\u3001\u7ED9\u6BCF\u7AE0\u8BBE\u8BA1\u677F\u5757\u7ED3\u6784\u65F6\uFF08\u7ECF README \u90A3\u4E00\u884C\uFF0C\u5361\u672C\u8EAB\u4E0D\u8FDB\u4E0A\u4E0B\u6587\uFF09" } }
]);
var SPEC_ROW_BY_PATH = Object.freeze(
  Object.fromEntries(SPEC_ROWS.map((row) => [row.path, Object.freeze({ ...row })]))
);
var PACKAGE_DIR_ROWS = Object.freeze({
  "resources/": { what: "\u6A21\u5F0F\u8D44\u4EA7\u5C42\u7684\u6839\uFF08\u5165\u53E3 SKILL.md \uFF0B \u8FD9\u4EFD\u5305\u5730\u56FE \uFF0B references/\uFF09", when: "\u4EFB\u4F55\u65F6\u5019\u2014\u2014\u5148\u5728\u8FD9\u91CC\u8BA4\u6E05\u54EA\u4E00\u5C42\u7BA1\u4EC0\u4E48\uFF0C\u518D\u6309\u9700\u4E0B\u94BB" },
  "resources/references/": { what: "\u5171\u7528\u7684\u65B9\u6CD5\u8BBA\u6587\u6863\uFF08\u89C4\u8303\u3001\u5951\u7EA6\u3001\u6E05\u5355\u3001\u4E0D\u53D8\u91CF\u3001\u5BA1\u8BA1\u7EC6\u5219\uFF09", when: "\u8981\u5224\u67D0\u4E00\u6B65\u8BE5\u6309\u54EA\u6761\u89C4\u77E9\u505A\u3001\u6216\u4EA7\u7269\u7684\u5B57\u6BB5\u5951\u7EA6\u957F\u4EC0\u4E48\u6837\u65F6" },
  "resources/references/patterns/": { what: "\u5185\u7F6E\u6559\u5B66\u6A21\u5F0F\u5E93\uFF08README \u662F\u5165\u53E3\uFF0C21 \u5F20\u5361\u6309\u6559\u5B66\u95EE\u9898\u7FFB\uFF09", when: "\u5173\u5361\u2461\u9009\u6559\u5B66\u6A21\u5F0F\u3001\u7ED9\u6BCF\u7AE0\u8BBE\u8BA1\u677F\u5757\u7ED3\u6784\u65F6" },
  "resources/references/subagent-prompts/": { what: "\u5C0F\u52A9\u624B\u6D3E\u53D1\u6A21\u677F\uFF08\u4E00\u6863\u4E00\u4EFD\uFF1A\u5199\u3001\u5BA1\u3001\u5BF9\u9F50\u3001\u56FE\u5BA1\u6821\u2026\uFF09", when: "\u8981\u6D3E\u54EA\u4E00\u6863\u5C0F\u52A9\u624B\u65F6\u6309\u5BF9\u5E94\u90A3\u4E00\u4EFD\u586B" },
  "resources/references/workflow-scripts/": { what: "\u7F16\u6392\u811A\u672C\u9AA8\u67B6\uFF08\u4E3B\u7B14\u7167\u5B83\u586B\u5BBF\u4E3B workflow \u7684\u90A3\u4E00\u8DF3\uFF09", when: "\u8981\u628A\u67D0\u4E00\u8DF3\u6539\u6210\u5BBF\u4E3B workflow \u9A71\u52A8\u65F6" }
});
var BOOK_DIR_ROWS = Object.freeze({
  // ⚠️ 路径由**目录名常量**现拼（⛔ 不用 `PROPOSAL_DIR_REL` 那几个 `_REL`）：
  // 那几条 `_REL` 在本文件里定义在**下面**（票 11 的那一节附近），模块初始化时还在 TDZ
  // ⇒ 这里引它们会当场 `ReferenceError`。目录名这一层仍是**同一份常量**（名字没有第二处）。
  ".": { what: "\u4E66\u5939\u6839\uFF1A\u8FD9\u672C\u4E66\u7684\u8BF4\u660E\u4E66 README.md\u3001\u8D26\u672C project.json\uFF0Ftimeline.jsonl \u4E0E\u539F\u4EF6\u76EE\u5F55", when: "\u8981\u77E5\u9053\u8FD9\u672C\u4E66\u4ECE\u54EA\u6765\u3001\u6539\u8FC7\u4EC0\u4E48\u65F6" },
  "sources": { what: "\u4F60\u4E0A\u4F20\u7684\u539F\u4EF6\uFF08\u4ECE\u672A\u88AB\u673A\u5668\u6539\u8FC7\uFF09", when: "\u8981\u56DE\u770B\u539F\u4EF6\u3001\u6216\u6838\u5BF9\u8F6C\u6362\u7A3F\u6709\u6CA1\u6709\u5931\u771F\u65F6" },
  [MATERIAL_DIR_NAME]: { what: "\u6750\u6599\u5C42\uFF1A\u539F\u4EF6\u8F6C\u51FA\u7684\u8F6C\u6362\u7A3F", when: "\u8BFB\u6750\u6599\u3001\u62BD\u7ED3\u6784\u3001\u5B9A\u77E5\u8BC6\u70B9\u65F6" },
  [`${MATERIAL_DIR_NAME}/${CONVERTED_DIR_NAME}`]: { what: "\u6BCF\u4EFD\u6750\u6599\u7684 Markdown \u8F6C\u6362\u7A3F", when: "\u7CBE\u8BFB\u3001\u62BD\u7ED3\u6784\u3001\u62BD\u77E5\u8BC6\u70B9\u65F6\uFF08\u771F\u76F8\u6E90\uFF09" },
  [WORK_DIR_NAME]: { what: "\u673A\u5668\u5199\u51FA\u6765\u7684\u5185\u5BB9\uFF08\u4E66\u91CC\u7684\u4EA7\u7269\u90FD\u5728\u5B83\u4E0B\u9762\uFF09", when: "\u627E\u8FD9\u672C\u4E66\u7684\u4EFB\u4F55\u4EA7\u7269\u65F6\u5148\u6765\u8FD9\u91CC" },
  [`${WORK_DIR_NAME}/${PROPOSAL_DIR_NAME}`]: { what: "\u6BCF\u4E00\u6B21\u62CD\u677F\u7684\u8BBE\u8BA1\u65B9\u6848\uFF08\u542B\u4FEE\u8BA2\u7248\u6B21\uFF09", when: "\u8981\u770B\u67D0\u4E00\u5173\u5F53\u65F6\u51ED\u4EC0\u4E48\u62CD\u677F\u3001\u6216\u56DE\u770B\u4E0A\u4E00\u7248\u65B9\u6848\u65F6" },
  [`${WORK_DIR_NAME}/${DECISION_DIR_NAME}`]: { what: "\u786E\u8BA4\u70B9\u7684\u7ED3\u8BBA\u4EF6\uFF08\u6BCF\u7AD9\u4E00\u4EFD\uFF0C\u673A\u5668\u8BFB\u7684\u4E0B\u6E38\u8F93\u5165\uFF09", when: "\u8981\u5224\u300C\u4E0A\u4E00\u7AD9\u62CD\u4E86\u4EC0\u4E48\u300D\u3001\u6216\u4E0B\u6E38\u8981\u62FF\u7ED3\u8BBA\u65F6" },
  [`${WORK_DIR_NAME}/${CHAPTER_SHARD_DIR_NAME}`]: { what: "\u7AE0\u6B63\u6587\u5206\u7247\uFF08\u5C0F\u52A9\u624B\u4E00\u4EBA\u4E00\u7247\uFF0C\u7AE0\u6B63\u6587\u7531\u673A\u5668\u62FC\uFF09", when: "\u8981\u770B\u67D0\u4E00\u8DEF\u6267\u7B14\u5199\u4E86\u4EC0\u4E48\u3001\u6216\u91CD\u62FC\u7AE0\u6B63\u6587\u65F6" },
  [`${WORK_DIR_NAME}/${DETAIL_DIR_NAME}`]: { what: "\u7CBE\u8BFB\u5C0F\u52A9\u624B\u843D\u7684\u5168\u6587\u7EC6\u76EE\uFF08\u6BCF\u4EFD\u6750\u6599\u4E00\u4EFD\uFF09", when: "\u8981\u770B\u67D0\u4EFD\u6750\u6599\u8BFB\u51FA\u6765\u7684\u7EC6\u8282\u539F\u6587\u65F6" },
  [`${WORK_DIR_NAME}/${REPORT_DIR_NAME}`]: { what: "\u5BA1\u8BA1\u4E0E\u68C0\u67E5\u62A5\u544A\uFF08\u673A\u5668\u6309\u843D\u76D8\u4EF6\u8BFB\uFF09", when: "\u8981\u770B\u67D0\u4E00\u7AE0\uFF0F\u67D0\u4E00\u8D9F\u5BA1\u8BA1\u67E5\u51FA\u4E86\u4EC0\u4E48\u65F6" },
  [`${WORK_DIR_NAME}/_\u65E7\u7248\u4EA7\u7269`]: { what: "\u5F52\u6863\u7684\u65E7\u7A3F\uFF08\u6DF1\u6539\uFF0F\u91CD\u505A\u628A\u4E0A\u4E00\u7248\u642C\u8FDB\u6765\u7559\u5E95\uFF09", when: "\u8981\u56DE\u770B\u88AB\u66FF\u6362\u6389\u7684\u90A3\u4E00\u7248\u65F6" },
  "\u6A21\u5F0F\u5E93": { what: "\u8FD9\u672C\u4E66\u81EA\u5DF1\u7684\u6A21\u5F0F\u5361\uFF08\u4E0E\u5185\u7F6E\u6A21\u5F0F\u5E93\u540C\u7B49\u5730\u4F4D\uFF09", when: "\u5173\u5361\u2461\u6A21\u5F0F\u9009\u578B\u3001\u5199\u5199\u4F5C\u89C4\u8303\u65F6" },
  "\u6A21\u5F0F\u5E93/\u81EA\u5B9A\u4E49": { what: "\u7528\u6237\u7C98\u8D34\u63CF\u8FF0\u3001AI \u63D0\u70BC\u51FA\u6765\u7684\u6A21\u5F0F\u5361", when: "\u540C\u4E0A\u2014\u2014\u5B83\u5FC5\u987B\u4E0E\u5185\u7F6E\u5361\u4E00\u8D77\u88AB\u9010\u5F20\u8BFB\u8FC7" },
  [PROCESS_DIR_NAME]: { what: "\u8FC7\u7A0B\u5C42\uFF1A\u8D26\u672C\u767B\u8BB0\u4E0E\u5173\u952E\u8282\u70B9\u5B58\u6863", when: "\u8981\u56DE\u9000\u5230\u6700\u8FD1\u4E00\u6B21\u5B58\u6863\u3001\u6216\u770B\u767B\u8BB0\u8D26\u65F6" },
  [`${PROCESS_DIR_NAME}/${ARCHIVE_DIR_NAME}`]: { what: "\u5173\u952E\u8282\u70B9\u81EA\u52A8\u5B58\u7684\u6863\uFF08\u53EF\u56DE\u9000\uFF09", when: "\u56DE\u9000\u3001\u6216\u5B9A\u70B9\u4FEE\u6539\u524D\u7559\u5E95\u65F6" },
  // ── 老书只读兼容（写侧永远用新名；票 `context-budget/13` 只读不搬）──
  [LEGACY_WORK_DIR_NAME]: { what: "\u8001\u4E66\u7684\u5DE5\u4F5C\u533A\uFF08\u8001\u540D\uFF0C\u53EA\u8BFB\u517C\u5BB9\uFF09", when: "\u7FFB\u9605\u7968 13 \u4E4B\u524D\u5EFA\u7684\u4E66\u65F6\u624D\u53EF\u80FD\u78B0\u5230" },
  [LEGACY_PROPOSAL_DIR_NAME]: { what: "\u8001\u4E66\u7684\u65B9\u6848\u76EE\u5F55\uFF08\u8001\u540D\uFF0C\u53EA\u8BFB\u517C\u5BB9\uFF09", when: "\u540C\u4E0A" },
  [LEGACY_ARCHIVE_DIR_NAME]: { what: "\u8001\u4E66\u7684\u5B58\u6863\u76EE\u5F55\uFF08\u8001\u540D\uFF0C\u53EA\u8BFB\u517C\u5BB9\uFF09", when: "\u540C\u4E0A" },
  [LEGACY_CONVERTED_DIR_NAME]: { what: "\u8001\u4E66\u7684\u8F6C\u6362\u7A3F\u76EE\u5F55\uFF08\u8001\u540D\uFF0C\u53EA\u8BFB\u517C\u5BB9\uFF09", when: "\u540C\u4E0A" }
});
var SWEEP_EXCLUDED = Object.freeze([
  {
    path: `${WORK_DIR_NAME}/_\u65E7\u7248\u4EA7\u7269/*`,
    reason: "\u5F52\u6863\u7684\u65E7\u7A3F\uFF1A\u6DF1\u6539/\u91CD\u505A\u628A\u4E0A\u4E00\u7248\u642C\u8D70\u7559\u5E95\uFF08`deep-modify.js`\uFF09\u3002\u5B83\u5DF2\u7ECF**\u4E0D\u518D\u662F\u5E94\u5F53\u6709\u7684\u4EA7\u7269**\uFF0C\u7559\u5728\u767B\u8BB0\u91CC\u4F1A\u8BA9\u300C\u591A\u4EF6\u300D\u6C38\u8FDC\u7EA2\u3002"
  },
  {
    path: `${WORK_DIR_NAME}/${MANIFEST_FILE_NAME}`,
    reason: "\u4EA7\u7269\u6E05\u5355\u81EA\u5DF1\uFF1A\u5B83\u662F**\u5E94\u5F53\u6709\u4EC0\u4E48**\u90A3\u4E00\u534A\uFF0C\u8BA9\u5B83\u8FDB\u300C\u5B9E\u9645\u6709\u4EC0\u4E48\u300D\u7B49\u4E8E\u81EA\u5DF1\u5BF9\u81EA\u5DF1\u5BF9\u8D26\u3002"
  },
  {
    path: `${WORK_DIR_NAME}/progress.md`,
    reason: "\u8FDB\u5EA6\u8D26\u672C\uFF1A\u5B83\u662F**\u534F\u8C03\u7528\u7684\u4E2D\u95F4\u4EF6**\uFF08\u8C01\u505A\u5230\u54EA\u4E00\u6B65\uFF09\uFF0C\u4E0D\u662F\u7ED9\u8BFB\u8005\u770B\u7684\u4EA7\u7269\u3002\u90A3\u4E00\u65CF\u5F52\u300C\u73AF\u8282\u72B6\u6001\u300D\u7BA1\u2014\u2014\u6309 ADR-0031 \u51B3\u7B56 4\uFF0C\u72B6\u6001\u662F**\u6D3E\u751F**\u7684\uFF0C\u4E0D\u4ECE\u4EA7\u7269\u91CC\u6570\u3002"
  },
  {
    // 票 `knowledge-graph-build/09`（§C10 那条「人的产物在产物清单那一层没有类目」的落地）。
    path: KNOWLEDGE_MAP_EXCLUSIONS_REL,
    reason: "**\u4EBA\u7684\u88C1\u51B3\u8BB0\u5F55**\uFF08\u56FE\u4E0A\u5212\u6389\u7684\u90A3\u51E0\u6761\uFF0C\u7968 09 \u90A3\u4EFD\u4EF6\uFF09\uFF1A\u5B83\u662F**\u8FFD\u6EAF\u4E0E\u534F\u8C03\u7528\u7684\u4E2D\u95F4\u4EF6**\uFF0C\u4E0D\u662F\u300C\u5E94\u5F53\u6709\u300D\u7684\u8BFB\u8005\u4EA7\u7269\u2014\u2014**\u6CA1\u5212\u8FC7\u4EFB\u4F55\u5361\u7684\u4E66\u672C\u6765\u5C31\u4E0D\u8BE5\u6709\u5B83**\uFF0C\u628A\u5B83\u58F0\u660E\u8FDB\u300C\u5E94\u5F53\u6709\u4EC0\u4E48\u300D\uFF08`BOOK_PRODUCT_FAMILIES`\uFF09\u4F1A\u7ED9\u6BCF\u4E00\u672C\u65B0\u4E66\u51ED\u7A7A\u591A\u4E00\u6761**\u6052\u7F3A\u4EF6**\uFF08\u4E00\u4E2A\u6052\u7EA2\u7684\u5224\u636E\u6BD4\u6CA1\u6709\u5224\u636E\u66F4\u574F\uFF09\u3002\u800C\u5B83\u4ECA\u5929\u771F\u7684\u4F1A\u843D\u5230 `\u5DE5\u4F5C\u533A/` \u91CC \u21D2 \u4E0D\u8FDB\u8FD9\u5F20\u6392\u9664\u8868\uFF0C\u5B83\u5C31\u4F1A\u4EE5\u300C\u591A\u4EF6\u300D\u7684\u8EAB\u4EFD\u8BA9\u5F62\u72B6\u5BF9\u8D26**\u6C38\u8FDC\u7EA2**\uFF08\u300C\u591A\u4EF6\u4EFB\u4F55\u65F6\u5019\u90FD\u662F\u7EA2\u7684\u300D\uFF0C\u89C1`book-shape.js` \u6587\u4EF6\u5934\uFF09\u3002\u21D2 \u6392\u9664\u6389\u5B83\uFF0C\u4E24\u534A\u90FD\u5BF9\u3002\u26A0\uFE0F \u300C\u4EBA\u7684\u4EA7\u7269\u300D\u90A3\u4E00\u6863\u4ECA\u5929**\u4E0D\u53EB `human`\u3001\u53EB `user`**\uFF08`ARTIFACT_PRODUCERS` \u91CC\u5DF2\u5728\u518C\uFF0C`style-line.md` \u5C31\u662F\u540C\u4E00\u6863\uFF09\u21D2 \u672C\u7968**\u4E0D\u7ED9 producer \u52A0\u6863**\uFF08\u52A0\u4E00\u4E2A\u540C\u4E49\u7684 `human` \u53EA\u4F1A\u8BA9\u540C\u4E00\u6863\u6709\u4E24\u4E2A\u540D\u5B57\uFF09\u3002"
  },
  {
    // 票 `confirm-points-redesign-build/01`：结论件（确认点的拍板结论，`工作区/决策/NN.json`）。
    path: `${DECISION_DIR_REL}/*`,
    reason: "**\u786E\u8BA4\u70B9\u7684\u62CD\u677F\u7ED3\u8BBA**\uFF08\u4E00\u7AD9\u4E00\u4EFD\uFF0C\u542B\u9A73\u56DE\u4E5F\u7559\u7684\u90A3\u4E00\u4EFD\uFF09\uFF1A\u5B83\u662F**\u8FFD\u6EAF\u4E0E\u534F\u8C03\u7528\u7684\u4E2D\u95F4\u4EF6**\uFF0C\u4E0D\u662F\u300C\u5E94\u5F53\u6709\u300D\u7684\u8BFB\u8005\u4EA7\u7269\u2014\u2014**\u8DF3\u8FC7\u7684\u7AD9\u672C\u6765\u5C31\u4E0D\u8BE5\u6709\u5B83**\uFF0C\u58F0\u660E\u8FDB\u300C\u5E94\u5F53\u6709\u4EC0\u4E48\u300D\u4F1A\u7ED9\u6BCF\u4E00\u672C\u8DF3\u7AD9\u7684\u4E66\u51ED\u7A7A\u591A\u4E00\u6761**\u6052\u7F3A\u4EF6**\uFF1B\u800C\u5B83\u4ECA\u5929\u771F\u7684\u4F1A\u843D\u5230 `\u5DE5\u4F5C\u533A/` \u91CC \u21D2 \u4E0D\u8FDB\u8FD9\u5F20\u6392\u9664\u8868\uFF0C\u5B83\u5C31\u4F1A\u4EE5\u300C\u591A\u4EF6\u300D\u7684\u8EAB\u4EFD\u8BA9\u4EA7\u7269\u5F62\u72B6\u5BF9\u8D26**\u6C38\u8FDC\u7EA2**\uFF08\u300C\u591A\u4EF6\u4EFB\u4F55\u65F6\u5019\u90FD\u662F\u7EA2\u7684\u300D\uFF0C\u89C1`book-shape.js` \u6587\u4EF6\u5934\uFF09\u3002\u26A0\uFE0F \u76EE\u5F55\u65CF\u6309 `*` \u524D\u7F00\u5339\u914D\uFF08\u89C1\u4E0B\u9762 {@link isSweepExcluded}\uFF09\u3002"
  },
  {
    // 票 `reader-cognition-boundary-build/03`：「给出那一份」在书夹里的副本。
    path: READER_QUESTIONNAIRE_ISSUED_REL,
    reason: "**\u53EF\u9009\u52A8\u4F5C\u300C\u53D1\u4E00\u4EFD\u8BFB\u8005\u60C5\u51B5\u95EE\u5377\u300D\u5199\u51FA\u7684\u90A3\u4E00\u4EFD**\uFF08\u7968 rcb/03\uFF0C\u5C4F\u4E00\u7528\u7684 `.md` \u6284\u672C\uFF09\uFF1A\u6CA1\u53D1\u8FC7\u5377\u7684\u4E66\u672C\u6765\u5C31\u4E0D\u8BE5\u6709\u5B83 \u21D2 \u58F0\u660E\u8FDB\u300C\u5E94\u5F53\u6709\u4EC0\u4E48\u300D\u4F1A\u7ED9\u6BCF\u4E00\u672C\u65B0\u4E66\u51ED\u7A7A\u591A\u4E00\u6761**\u6052\u7F3A\u4EF6**\uFF08\u4E00\u4E2A\u6052\u7EA2\u7684\u5224\u636E\u6BD4\u6CA1\u6709\u5224\u636E\u66F4\u574F\uFF09\uFF1B\u800C\u5B83\u771F\u7684\u4F1A\u843D\u5230 `\u5DE5\u4F5C\u533A/` \u91CC \u21D2 \u4E0D\u8FDB\u8FD9\u5F20\u6392\u9664\u8868\uFF0C\u5B83\u5C31\u4F1A\u4EE5\u300C\u591A\u4EF6\u300D\u7684\u8EAB\u4EFD\u8BA9\u4EA7\u7269\u5F62\u72B6\u5BF9\u8D26**\u6C38\u8FDC\u7EA2**\u3002\u26A0\uFE0F \u5B83**\u4E0D\u662F**\u7B2C\u4E8C\u4EFD\u4E8B\u5B9E\u6E90\uFF1A\u53EA\u662F\u7ED9\u51FA\u90A3\u4E00\u523B\u7684\u6284\u672C\uFF08\u6536\u5377\u4EBA\u62FF\u5230\u7684\u5C31\u662F\u5B83\uFF0C\u7ECF\u901A\u7528\u4E0B\u8F7D\u8DEF\u7531\uFF09\u3002\u5B83\u662F\u5426\u5728\u76D8\u4E0A**\u4E0D\u4F5C\u4EFB\u4F55\u653E\u884C\u6761\u4EF6**\u3002"
  },
  {
    // 票 `reader-cognition-boundary-build/03`：造书用户手粘回来的回卷原文。
    path: READER_QUESTIONNAIRE_RETURNED_REL,
    reason: "**\u4EBA\u7C98\u56DE\u6765\u7684\u56DE\u5377\u539F\u4EF6**\uFF08\u7968 rcb/03\uFF09\uFF1A\u5B83\u662F\u4EBA\u7684\u8F93\u5165\u4E0E\u8FFD\u6EAF\u8BC1\u636E\uFF0C\u4E0D\u662F\u300C\u5E94\u5F53\u6709\u300D\u7684\u8BFB\u8005\u4EA7\u7269\u2014\u2014\u6CA1\u53D1\u8FC7\u5377\uFF0F\u8FD8\u6CA1\u56DE\u5377\u7684\u4E66\u672C\u6765\u5C31\u4E0D\u8BE5\u6709\u5B83\uFF0C\u58F0\u660E\u8FDB\u300C\u5E94\u5F53\u6709\u4EC0\u4E48\u300D\u4F1A\u51ED\u7A7A\u591A\u4E00\u6761**\u6052\u7F3A\u4EF6**\uFF1B\u800C\u5B83\u771F\u7684\u4F1A\u843D\u5230 `\u5DE5\u4F5C\u533A/` \u91CC \u21D2 \u4E0D\u8FDB\u8FD9\u5F20\u6392\u9664\u8868\uFF0C\u5B83\u5C31\u4F1A\u4EE5\u300C\u591A\u4EF6\u300D\u7684\u8EAB\u4EFD\u8BA9\u4EA7\u7269\u5F62\u72B6\u5BF9\u8D26**\u6C38\u8FDC\u7EA2**\u3002\u26A0\uFE0F \u5B83\u7684\u5F62\u72B6\u5224\u636E\u53EA\u5728**\u6709\u4EF6\u65F6**\u751F\u6548\uFF08\u4EF6\u5728\u5C31\u8981\u975E\u7A7A\uFF1B\u65E0\u4EF6\uFF1D\u4E0D\u9002\u7528\uFF0C\u26D4 \u4E0D\u662F\u8FDD\u7EA6\u3001\u26D4 \u4E0D\u662F\u653E\u884C\u6761\u4EF6\uFF09\u2014\u2014\u5224\u636E\u4F4F `src/workflow/reader-questionnaire.js`\uFF0C\u4E0B\u6E38\uFF08AI \u9010\u6761\u8BFB\u3001\u4EE3\u7B14\u843D\u5254\u9664\u8BB0\u5F55\uFF09\u5F52\u7968 `06`\u3002"
  },
  {
    // 票 `reader-questionnaire-ai-authoring/02`：AI 写的那份**题面**（`工作区/问卷题面.json`）。
    path: READER_QUESTIONNAIRE_TEXT_REL,
    reason: "**\u53EF\u9009\u4EF6\uFF1AAI \u5199\u7684\u8BFB\u8005\u95EE\u5377\u9898\u9762**\uFF08\u7968 `reader-questionnaire-ai-authoring/02`\uFF09\uFF1A\n\u5B83\u53EA\u5728**\u63A2\u67E5\u4EA4\u5DE5**\u90A3\u4E00\u6761\u8DEF\u4E0A\u88AB\u5199\uFF08`stage-submit` \u7684 `stage=explore`\uFF0C\u5F62\u72B6\u95F8\n`readerQuestionnaireProblem` \u662F\u552F\u4E00\u5224\u636E\uFF09\uFF0C\u800C**\u4E0D\u4EA4\u4E5F\u5408\u6CD5**\uFF08\u5377\u5B50\u9000\u56DE\u4ECA\u5929\u7684\u786E\u5B9A\u6027\u7248\uFF09\u21D2\n\u58F0\u660E\u8FDB\u300C\u5E94\u5F53\u6709\u4EC0\u4E48\u300D\u4F1A\u7ED9\u6BCF\u4E00\u672C\u6CA1\u5199\u9898\u9762\u7684\u4E66\u51ED\u7A7A\u591A\u4E00\u6761**\u6052\u7F3A\u4EF6**\uFF08\u4E00\u4E2A\u6052\u7EA2\u7684\u5224\u636E\u6BD4\u6CA1\u6709\n\u5224\u636E\u66F4\u574F\uFF09\uFF1B\u800C\u5B83\u771F\u7684\u4F1A\u843D\u5230 `\u5DE5\u4F5C\u533A/` \u91CC \u21D2 \u4E0D\u8FDB\u8FD9\u5F20\u6392\u9664\u8868\uFF0C\u5B83\u5C31\u4F1A\u4EE5\u300C\u591A\u4EF6\u300D\u7684\u8EAB\u4EFD\u8BA9\n\u4EA7\u7269\u5F62\u72B6\u5BF9\u8D26**\u6C38\u8FDC\u7EA2**\uFF08\u300C\u591A\u4EF6\u4EFB\u4F55\u65F6\u5019\u90FD\u662F\u7EA2\u7684\u300D\uFF0C\u89C1 `book-shape.js` \u6587\u4EF6\u5934\uFF09\u3002\n\u26A0\uFE0F \u5B83**\u4E0D\u662F**\u7B2C\u4E8C\u4EFD\u4E8B\u5B9E\u6E90\uFF1A\u9898\u9762\u5199\u7684\u662F\u300C\u600E\u4E48\u95EE\u300D\uFF0C\u673A\u5668\u5370\u7684\u884C\u578B\u4E0E\u56DE\u5377\u89E3\u6790\u4E00\u4E2A\u5B57\u4E0D\u52A8\uFF1B\n\u5B83\u662F\u5426\u5728\u76D8\u4E0A**\u4E0D\u4F5C\u4EFB\u4F55\u653E\u884C\u6761\u4EF6**\uFF08\u4E0D\u5728\uFF1D\u6309\u6761\u9000\u56DE\u5E72\u6E05\u5355\u5370\uFF09\u3002"
  },
  {
    // 票 `reader-questionnaire-ai-authoring/04`：写卷小助手交的**意图件**（`工作区/问卷意图.md`）。
    path: READER_QUESTIONNAIRE_INTENT_REL,
    reason: "**\u53EF\u9009\u4EF6\uFF1A\u5199\u5377\u5C0F\u52A9\u624B\u4EA4\u7684\u90A3\u4EFD\u610F\u56FE\u4EF6**\uFF08\u7968 `reader-questionnaire-ai-authoring/04`\uFF09\uFF1A\n\u5B83\u662F\u5199\u5377\u4E0E\u8BFB\u5377\u4E4B\u95F4\u552F\u4E00\u80FD\u5E26\u8FC7\u53BB\u7684\u4E1C\u897F\uFF08\u4E24\u8005\u4E4B\u95F4\u9694\u7740\u771F\u4EBA\u586B\u5199\uFF09\u2014\u2014\u53EA\u6709\u6D3E\u8FC7\u5199\u5377\u5C0F\u52A9\u624B\u3001\n\u4E14\u5B83\u771F\u4EA4\u4E86\u8FD9\u4E00\u4EFD\u7684\u4E66\u624D\u6709\u5B83\u3002\u21D2 \u58F0\u660E\u8FDB\u300C\u5E94\u5F53\u6709\u4EC0\u4E48\u300D\u4F1A\u7ED9\u6BCF\u4E00\u672C\u6CA1\u6D3E\u8FC7\u5199\u5377\u5C0F\u52A9\u624B\u7684\u4E66\u51ED\u7A7A\n\u591A\u4E00\u6761**\u6052\u7F3A\u4EF6**\uFF1B\u4E0D\u8FDB\u8FD9\u5F20\u6392\u9664\u8868\uFF0C\u5B83\u5C31\u4F1A\u4EE5\u300C\u591A\u4EF6\u300D\u7684\u8EAB\u4EFD\u8BA9\u4EA7\u7269\u5F62\u72B6\u5BF9\u8D26**\u6C38\u8FDC\u7EA2**\u3002\n\u26A0\uFE0F \u673A\u5668**\u4E00\u4E2A\u5B57\u90FD\u4E0D\u8BFB**\u5B83\u7684\u5185\u5BB9\uFF08\u5B83\u4E0D\u662F\u5224\u636E\u7684\u8F93\u5165\u9762\uFF09\uFF1B\u5B83\u5728\u4E0D\u5728\u4E5F\u4E0D\u4F5C\u4EFB\u4F55\u653E\u884C\u6761\u4EF6\u2014\u2014\n\u7F3A\u5B83\u65F6\u8BFB\u5377\u90A3\u4E00\u8DEF\u4E0D\u8DD1\uFF08\u9000\u56DE\u4ECA\u5929\u7684\u6559\u5B66\u53E5\uFF09\uFF0C\u26D4 \u4E0D\u62FF\u7A7A\u610F\u56FE\u786C\u8BFB\u3002"
  },
  {
    // 票 `reader-questionnaire-ai-authoring/05`：读卷子代理交的**问卷判断**（`工作区/问卷判断.json`）。
    path: READER_QUESTIONNAIRE_VERDICT_REL,
    reason: "**\u53EF\u9009\u4EF6\uFF1A\u8BFB\u5377\u5B50\u4EE3\u7406\u4EA4\u7684\u90A3\u4EFD\u95EE\u5377\u5224\u65AD**\uFF08\u7968 `reader-questionnaire-ai-authoring/05`\uFF09\uFF1A\n\u53EA\u6709\u300C\u56DE\u5377\u4EF6\u5728\u76D8\u4E0A\uFF0B\u610F\u56FE\u4EF6\u5728\u76D8\u4E0A\uFF0B\u6D3E\u8FC7\u5199\u5377\u5C0F\u52A9\u624B\u300D\u4E09\u4E2A\u6761\u4EF6\u540C\u65F6\u6210\u7ACB\u3001\u4E14\u90A3\u4E00\u8DEF\u771F\u4EA4\u4E86\n\u8FD9\u4E00\u4EFD\u7684\u4E66\u624D\u6709\u5B83\u3002\u21D2 \u58F0\u660E\u8FDB\u300C\u5E94\u5F53\u6709\u4EC0\u4E48\u300D\u4F1A\u7ED9\u6BCF\u4E00\u672C\u6CA1\u8D70\u8FC7\u8BFB\u5377\u90A3\u6761\u8DEF\u7684\u4E66\u51ED\u7A7A\u591A\u4E00\u6761\n**\u6052\u7F3A\u4EF6**\uFF1B\u4E0D\u8FDB\u8FD9\u5F20\u6392\u9664\u8868\uFF0C\u5B83\u5C31\u4F1A\u4EE5\u300C\u591A\u4EF6\u300D\u7684\u8EAB\u4EFD\u8BA9\u4EA7\u7269\u5F62\u72B6\u5BF9\u8D26**\u6C38\u8FDC\u7EA2**\u3002\n\u26A0\uFE0F \u673A\u5668\u53EA\u9A8C\u5F62\u72B6\uFF08`drop`\uFF0F`skip` \u4E24\u6761\u6570\u7EC4\uFF09\uFF0C\u26D4 \u4E0D\u9A8C\u5B83\u8BFB\u5F97\u5BF9\u4E0D\u5BF9\uFF1B\u5B83\u4E5F\u4E0D\u4F5C\u4EFB\u4F55\u653E\u884C\u6761\u4EF6\n\uFF08\u843D\u8BB0\u5F55\u4ECD\u7531\u4E3B\u7B14\u53D1 `graph-opinion`\uFF0C\u90A3\u4EFD\u4EF6\u53EA\u5F53\u8BFB\u6570\u7684\u51FA\u5904\uFF09\u3002"
  },
  {
    path: `${WORK_DIR_NAME}/outline-contract.md`,
    reason: "**\u8001\u4E66\u91CC\u90A3\u4EFD\u5DF2\u9000\u5F79\u7684\u300C\u5927\u7EB2\u5951\u7EA6\u300D\u9057\u7559\u4EF6**\uFF08\u7968 `premature-announce/02` \u628A\u5B83\u4ECE`BOOK_PRODUCT_FAMILIES` \u9000\u5F79\uFF1A`src/**` \u91CC\u96F6\u751F\u4EA7\u8005\uFF0C\u5B83\u5F53\u5E74\u7684\u804C\u8D23\u5DF2\u5E76\u8FDB `\u5DE5\u4F5C\u533A/outline.md` \u7684 `chapters[].points`\uFF0F`volumeReason` \u5B57\u6BB5\u9762\uFF09\u3002\u8001\u4E66\u76D8\u4E0A\u771F\u53EF\u80FD\u8FD8\u7559\u7740\u8FD9\u4E00\u4EFD\uFF08\u771F\u4E66\u53D6\u6837\u89C1 `docs/\u6D4B\u8BD5\u4FE1\u4EFB\u8FB9\u754C.md` \u7684\u6545\u4E8B 04 \u4E00\u8282\uFF09\u21D2 \u4E0D\u8FDB\u8FD9\u5F20\u6392\u9664\u8868\uFF0C\u5B83\u5C31\u4F1A\u4EE5\u300C\u591A\u4EF6\u300D\u7684\u8EAB\u4EFD\u8BA9\u90A3\u672C\u4E66\u7684\u4EA7\u7269\u5F62\u72B6\u5BF9\u8D26**\u6C38\u8FDC\u7EA2**\uFF08\u300C\u591A\u4EF6\u4EFB\u4F55\u65F6\u5019\u90FD\u662F\u7EA2\u7684\u300D\uFF0C\u89C1 `book-shape.js` \u6587\u4EF6\u5934\uFF09\uFF0C\u800C\u90A3\u662F**\u6539\u540D/\u9000\u5F79\u7559\u4E0B\u7684\u75D5\u8FF9**\uFF0C\u4E0D\u662F\u8FD9\u672C\u4E66\u505A\u9519\u4E86\u4EC0\u4E48\u3002\u26A0\uFE0F \u6392\u9664\u5B83\u2260\u5047\u88C5\u6CA1\u6709\u8FC7\uFF1A\u9000\u5F79\u8FD9\u4EF6\u4E8B\u4E0E\u300C\u5B83\u4E3A\u4EC0\u4E48\u4E0D\u518D\u58F0\u660E\u300D\u9010\u5B57\u5199\u5728\u8FD9\u4E00\u6761\u91CC\uFF1B\u65B0\u4E66\u4E0D\u4F1A\u518D\u4EA7\u51FA\u5B83\u3002"
  }
]);
var HANZI_RE = /[\u4e00-\u9fff]/g;
function countHanzi(text) {
  return String(text ?? "").match(HANZI_RE)?.length ?? 0;
}
function contextOccupancyPercent(pressure) {
  if (pressure === null || typeof pressure !== "object") return null;
  const used = pressure.projectedTokens ?? pressure.pressureTokens;
  const capacity = pressure.contextWindow;
  if (!Number.isFinite(used) || !Number.isFinite(capacity) || capacity <= 0) {
    return null;
  }
  return Math.min(100, Math.round(used / capacity * 100));
}
var ROLES = Object.freeze([
  "\u5B66\u751F\u7528\u4E66",
  "\u6559\u5E08\u7528\u4E66",
  "\u8003\u7EB2",
  "\u8BB2\u4E49",
  "\u771F\u9898"
]);
var CONVERTED_STATES = Object.freeze(["pending", "ok", "failed"]);
function convertedState(source) {
  const value = source?.converted;
  if (CONVERTED_STATES.includes(value)) return value;
  return value === true ? "ok" : "pending";
}
function goldChapterNo(meta) {
  return Number.isSafeInteger(meta?.goldChapter) && meta.goldChapter >= 1 ? meta.goldChapter : 1;
}
var ACT_STAGES = Object.freeze([
  "explore",
  "gate",
  "outline",
  "gold",
  "chapters",
  "merge",
  "final"
]);
var FINAL_REDO_STATUSES = Object.freeze([
  "done",
  "not-done",
  "superseded"
]);
var PHASES = Object.freeze([
  { n: 1, label: "\u6750\u6599\u51C6\u5907" },
  { n: 2, label: "\u6E90\u63A2\u67E5" },
  { n: 3, label: "\u6559\u5B66\u8BBE\u8BA1" },
  { n: 4, label: "\u8303\u4F8B\u7AE0" },
  { n: 5, label: "\u5168\u7AE0\u5199\u4F5C" },
  { n: 6, label: "\u7EC8\u68C0\u4E0E\u4EA4\u4ED8" }
]);
var SEGMENT_PHASE = Object.freeze({
  explore: 2,
  gate: 3,
  outline: 3,
  gold: 4,
  chapter: 5,
  review: 5,
  merge: 6,
  final: 6
});
var CHAPTER_PROGRESS_STAGES = Object.freeze([
  "writing",
  "auditing",
  "audited",
  "finalizing",
  "done"
]);
var CHAPTER_PROGRESS_LABELS = Object.freeze({
  writing: "\u5199",
  auditing: "\u5BA1",
  audited: "\u5BA1\u5B8C\u5F85\u590D\u6838",
  finalizing: "\u590D\u6838",
  done: "\u4EA4\u5DE5"
});
var CHAPTER_PROGRESS_REQUIREMENT = `\u6309\u7AE0\u4E0A\u62A5 progress\uFF1Achapter=N\uFF1Bstage=${CHAPTER_PROGRESS_STAGES.map((stage) => `${stage}\uFF08${CHAPTER_PROGRESS_LABELS[stage]}\uFF09`).join("|")}`;
var PROGRESS_LINE_SHAPE_RULES = Object.freeze([
  {
    id: "user-action",
    re: /(?:你|您|用户)\s*已\s*(?:点|按|选|确认|认可|通过|同意|批准|暂停|继续|操作)/u,
    why: "\u522B\u66FF\u7528\u6237\u8BB0\u52A8\u4F5C\uFF08\u7528\u6237\u52A8\u4F5C\u6709\u81EA\u5DF1\u7684\u901A\u9053\uFF1A\u62CD\u677F\uFF0F\u8BA4\u53EF\uFF0F\u7559\u8A00\uFF0F\u6682\u505C\uFF09"
  },
  {
    id: "promise",
    re: /下一步|接下来|将要|即将|我(?:会|将)|计划(?:要|去)/u,
    why: "\u53EA\u8BF4\u5DF2\u7ECF\u53D1\u751F\u8FC7\u7684\u4E8B\uFF0C\u4E0D\u8BB8\u627F\u8BFA\u8FD8\u6CA1\u53D1\u751F\u7684\u4E8B"
  }
]);
function teachingFocusText(item) {
  if (typeof item === "string") return item.trim();
  if (item === null || typeof item !== "object") return "";
  const text = [
    item.title,
    item.text,
    item.label,
    item.content,
    item.name,
    item.item,
    item.\u91CD\u70B9,
    item.\u96BE\u70B9
  ].map((v) => typeof v === "string" ? v.trim() : "").find((v) => v !== "");
  if (text === void 0) return "";
  const diff = typeof item.difficulty === "string" ? item.difficulty.trim() : "";
  return diff !== "" && !text.includes(diff) ? `${text}\uFF08${diff}\uFF09` : text;
}
function normalizeTeachingFocus(items) {
  if (!Array.isArray(items)) return [];
  const out = [];
  for (const item of items) {
    const text = teachingFocusText(item);
    if (text !== "") out.push(text);
  }
  return out;
}
var KNOWLEDGE_POINT_DIFFICULTY = Object.freeze(["\u57FA\u7840", "\u91CD\u70B9", "\u96BE\u70B9", "\u8FDB\u9636"]);
var KNOWLEDGE_POINT_DIFFICULTY_ALIASES = Object.freeze({
  \u6311\u6218: "\u8FDB\u9636",
  \u4F4E: "\u57FA\u7840",
  \u7B80\u5355: "\u57FA\u7840",
  \u5BB9\u6613: "\u57FA\u7840",
  \u9AD8: "\u96BE\u70B9",
  \u56F0\u96BE: "\u96BE\u70B9"
});
function normalizeKnowledgePointTitle(raw) {
  if (typeof raw !== "string") return "";
  let text = raw.normalize("NFKC").trim();
  for (; ; ) {
    const stripped = text.replace(/\s*\([^()]*\)$/, "").trim();
    if (stripped === text) break;
    text = stripped;
  }
  return text;
}
function outlinePointsCoverage(knowledgePoints, chapters) {
  const kps = Array.isArray(knowledgePoints) ? knowledgePoints : [];
  const rows = Array.isArray(chapters) ? chapters : [];
  const byKey = /* @__PURE__ */ new Map();
  for (const kp of kps) {
    const title = typeof kp?.title === "string" ? kp.title : "";
    const key = normalizeKnowledgePointTitle(title);
    if (key !== "" && !byKey.has(key)) byKey.set(key, title);
  }
  const chapterKeys = rows.map((chapter) => {
    const pts = Array.isArray(chapter?.points) ? chapter.points : [];
    const entries = [];
    for (const pt of pts) {
      if (typeof pt !== "string") continue;
      const key = normalizeKnowledgePointTitle(pt);
      if (key === "") continue;
      entries.push({ key, raw: pt.trim() });
    }
    return entries;
  });
  const claimedKeys = /* @__PURE__ */ new Set();
  const foreign = [];
  chapterKeys.forEach((entries, i) => {
    for (const { key, raw } of entries) {
      if (byKey.has(key)) claimedKeys.add(key);
      else foreign.push({ chapter: i + 1, title: raw });
    }
  });
  const claims = [];
  const unclaimed = [];
  for (const [key, title] of byKey) {
    const claimedBy = [];
    chapterKeys.forEach((entries, i) => {
      if (entries.some((entry) => entry.key === key)) claimedBy.push(i + 1);
    });
    claims.push({ title, chapters: claimedBy });
    if (!claimedKeys.has(key)) unclaimed.push(title);
  }
  return { claims, unclaimed, foreign };
}
var EXCLUSION_REASON_NOT_NEEDED = "\u4E0D\u9700\u8981";
var EXCLUSION_REASON_ALREADY_KNOWN = "\u5DF2\u7ECF\u4F1A";
var EXCLUSION_REASONS = Object.freeze([EXCLUSION_REASON_NOT_NEEDED, EXCLUSION_REASON_ALREADY_KNOWN]);
function isPlainRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function nonEmptyText(value) {
  return typeof value === "string" && value.trim() !== "";
}
function exclusionProblems(document2) {
  if (!isPlainRecord(document2)) return ["\u90A3\u4EFD\u4EBA\u5199\u7684\u88C1\u51B3\u4EF6\u4E0D\u662F\u4E00\u4E2A JSON \u5BF9\u8C61"];
  if (!Array.isArray(document2.items)) return ["\u90A3\u4EFD\u4EBA\u5199\u7684\u88C1\u51B3\u4EF6\u91CC\u6CA1\u6709 `items` \u6570\u7EC4"];
  const problems = [];
  const seen = /* @__PURE__ */ new Set();
  document2.items.forEach((item, index) => {
    const at = `items[${index}]`;
    if (!isPlainRecord(item)) {
      problems.push(`${at} \u4E0D\u662F\u4E00\u6761\u8BB0\u5F55`);
      return;
    }
    if (!nonEmptyText(item.key)) problems.push(`${at} \u7F3A \`key\`\uFF08\u6216\u4E0D\u662F\u975E\u7A7A\u6587\u672C\uFF09`);
    if (!nonEmptyText(item.title)) problems.push(`${at} \u7F3A \`title\`\uFF08\u6216\u4E0D\u662F\u975E\u7A7A\u6587\u672C\uFF09`);
    if (!EXCLUSION_REASONS.includes(item.reason)) {
      problems.push(`${at} \u7684 \`reason\` \u662F ${JSON.stringify(item.reason)}\uFF0C\u4E0D\u5728\u300C${EXCLUSION_REASONS.join("\uFF0F")}\u300D\u91CC`);
    }
    if (!nonEmptyText(item.by)) problems.push(`${at} \u7F3A \`by\`\uFF08\u8C01\u88C1\u7684\uFF09`);
    if (!Number.isSafeInteger(item.at) || item.at <= 0) problems.push(`${at} \u7F3A \`at\`\uFF08\u88C1\u51B3\u65F6\u523B\uFF0C\u6BEB\u79D2\u65F6\u95F4\u6233\uFF09`);
    if (nonEmptyText(item.key)) {
      if (seen.has(item.key)) problems.push(`${at} \u7684 \`key\` ${JSON.stringify(item.key)} \u5728\u8FD9\u4E00\u4EFD\u91CC\u51FA\u73B0\u4E86\u4E24\u6B21\uFF08\u540C\u4E00\u5F20\u5361\u53EA\u8BE5\u6709\u4E00\u6761\u88C1\u51B3\uFF09`);
      seen.add(item.key);
    }
  });
  return problems;
}
function exclusionItemsOf(document2) {
  if (exclusionProblems(document2).length > 0) return [];
  return document2.items.map((item) => ({
    key: item.key,
    title: item.title,
    reason: item.reason,
    by: item.by,
    at: item.at
  }));
}
function parseExclusionsDocument(text) {
  if (typeof text !== "string" || text.trim() === "") return { items: [], problems: [] };
  let document2 = null;
  try {
    document2 = JSON.parse(text);
  } catch {
    return { items: [], problems: [`\`${KNOWLEDGE_MAP_EXCLUSIONS_REL}\` \u4E0D\u662F JSON`] };
  }
  return { items: exclusionItemsOf(document2), problems: exclusionProblems(document2) };
}
function exclusionKeysOf(document2) {
  const keys = /* @__PURE__ */ new Set();
  for (const item of Array.isArray(document2?.items) ? document2.items : []) {
    if (nonEmptyText(item?.key)) keys.add(item.key);
  }
  return keys;
}
function liveExclusionsOf(items, cards) {
  const rows = Array.isArray(items) ? items.filter(isPlainRecord) : [];
  const byKey = /* @__PURE__ */ new Map();
  for (const card of Array.isArray(cards) ? cards : []) {
    if (!isPlainRecord(card) || !nonEmptyText(card.key)) continue;
    if (!byKey.has(card.key)) byKey.set(card.key, card);
  }
  const live = [];
  const stale = [];
  for (const item of rows) {
    const card = byKey.get(item.key);
    const cardKey = card === void 0 ? "" : normalizeKnowledgePointTitle(card.name);
    const titleKey = normalizeKnowledgePointTitle(item.title);
    if (card !== void 0 && cardKey !== "" && cardKey === titleKey) live.push(item);
    else stale.push(item);
  }
  return { live, stale };
}
function effectiveKnowledgePoints(knowledgePoints, live) {
  const dropped = /* @__PURE__ */ new Set();
  for (const item of Array.isArray(live) ? live : []) {
    const key = normalizeKnowledgePointTitle(item?.title);
    if (key !== "") dropped.add(key);
  }
  const rows = Array.isArray(knowledgePoints) ? knowledgePoints : [];
  if (dropped.size === 0) return rows.slice();
  return rows.filter((kp) => {
    const key = normalizeKnowledgePointTitle(typeof kp?.title === "string" ? kp.title : "");
    return key === "" || !dropped.has(key);
  });
}
var MAX_UPLOAD_BYTES = 500 * 1024 * 1024;
var MINERU_MAX_BYTES = 200 * 1024 * 1024;
function uploadTooLargeMessage() {
  return `\u8FD9\u4EFD\u6750\u6599\u8D85\u8FC7 500MB \u4E0A\u4F20\u4E0A\u9650\uFF0C\u8BF7\u62C6\u6210\u591A\u4EFD\uFF08\u6BCF\u4EFD <500MB\uFF09\u540E\u5206\u522B\u4E0A\u4F20`;
}
function mineruTooLargeManualSplitMessage() {
  return `\u8FD9\u4EFD\u6750\u6599\u8D85\u8FC7 MinerU \u5355\u4EFD 200MB \u7684\u4E0A\u9650\u3002\u8BF7\u628A\u5B83\u62C6\u6210\u51E0\u4EFD\uFF08\u6BCF\u4EFD <200MB\uFF09\u540E\u5206\u522B\u4E0A\u4F20\uFF0C\u6216\u5148\u538B\u7F29\u518D\u4F20\u3002`;
}
function mineruTooLargeNoAutoSplitMessage() {
  return `\u8FD9\u4EFD PDF \u8D85\u8FC7 MinerU \u5355\u4EFD 200MB \u7684\u4E0A\u9650\uFF0C\u4F46\u672C\u673A\u6CA1\u88C5\u5207\u5206\u7528\u7684 Python \u4E0E PyMuPDF\uFF0C\u5207\u4E0D\u5F00\uFF1A\u8BF7\u628A\u5B83\u62C6\u6210\u51E0\u4EFD\uFF08\u6BCF\u4EFD <200MB\uFF09\u540E\u5206\u522B\u4E0A\u4F20\uFF0C\u6216\u5148\u538B\u7F29\u518D\u4F20\u3002`;
}
function mineruTooLargeAutoSplitMessage() {
  return `\u8FD9\u4EFD PDF \u8D85\u8FC7 MinerU \u5355\u4EFD 200MB \u7684\u4E0A\u9650\uFF1A\u4F1A\u5148\u5728\u672C\u5730\u628A\u5B83\u5207\u5F00\u6210\u51E0\u6BB5\uFF08\u6BCF\u6BB5 <200MB\uFF09\u518D\u5206\u522B\u89E3\u6790\uFF0C\u4E0D\u7528\u4F60\u624B\u52A8\u62C6\u3002`;
}
var UPLOAD_SIZE_LIMIT = Object.freeze({
  /** 500MB 那道：本仓仓门。 */
  DEPOT: "depot-500mb",
  /** 200MB 那道：MinerU 云端。 */
  MINERU: "mineru-200mb"
});
function judgeMaterialUploadSize({ name, size, autoSplit = false } = {}) {
  if (!Number.isFinite(size) || size < 0) {
    return { blocked: false, limit: null, message: "" };
  }
  if (size > MAX_UPLOAD_BYTES) {
    return { blocked: true, limit: UPLOAD_SIZE_LIMIT.DEPOT, message: uploadTooLargeMessage() };
  }
  if (size <= MINERU_MAX_BYTES) return { blocked: false, limit: null, message: "" };
  if (!isAutoSplittableMaterial(name)) {
    return {
      blocked: true,
      limit: UPLOAD_SIZE_LIMIT.MINERU,
      message: mineruTooLargeManualSplitMessage()
    };
  }
  return {
    blocked: false,
    limit: UPLOAD_SIZE_LIMIT.MINERU,
    message: autoSplit === true ? mineruTooLargeAutoSplitMessage() : mineruTooLargeNoAutoSplitMessage()
  };
}
var GATE_TOPIC = Object.freeze({
  1: "\u5B66\u4E60\u76EE\u6807\u4E0E\u96BE\u70B9",
  2: "\u6559\u5B66\u65B9\u6CD5\u4E0E\u677F\u5757",
  3: "\u5168\u4E66\u67B6\u6784\u4E0E\u7AE0\u8282"
});
function gateHuman(n) {
  const topic = GATE_TOPIC[String(n)];
  return topic === void 0 ? `\u7B2C ${n} \u6B21\u62CD\u677F` : `\u7B2C ${n} \u6B21\u62CD\u677F \xB7 ${topic}`;
}
var PHASE_UI_SOURCE = Object.freeze({
  1: "\u6750\u6599\u51C6\u5907",
  2: "\u8BFB\u6750\u6599\u6311\u91CD\u70B9",
  3: "\u62CD\u677F\u5B9A\u65B9\u6848",
  4: "\u6700\u4F73\u8303\u4F8B\u7AE0",
  5: "\u5199\u5B8C\u6574\u672C",
  6: "\u6700\u540E\u68C0\u67E5"
});
function segmentHuman(seg) {
  const key = typeof seg === "string" ? seg : seg?.key ?? "";
  if (key === "explore") return PHASE_UI_SOURCE[2];
  if (key.startsWith("gate-")) return gateHuman(key.slice("gate-".length));
  if (key === "outline") return "\u7AE0\u8282\u5B89\u6392";
  if (key === "gold") return PHASE_UI_SOURCE[4];
  if (key === "chapters-review") return "\u5168\u7AE0\u8FC7\u76EE";
  if (key === "merge") return "\u5408\u5E76\u6210\u4E66";
  if (key === "final") return PHASE_UI_SOURCE[6];
  if (key.startsWith("chapter-")) return typeof seg === "object" && seg?.label || key;
  if (typeof seg === "object" && seg?.label) return seg.label;
  return key;
}
var STAGE_LABEL_UI = Object.freeze({
  // 六阶段的 canonical 全称（domain-rules PHASES）也走这一张表：账本事件带的 data.label 就是
  // 它，出口（《过程记录.md》/对话播报）必须译成界面词，否则「同一件事说两种话」的病会复发。
  // ⚠️ 值不再手抄——直接取 PHASE_UI_SOURCE，两处逐字相同过的副本已合并（2026-09-20 复审 M5）。
  "\u6750\u6599\u51C6\u5907": PHASE_UI_SOURCE[1],
  "\u6E90\u63A2\u67E5": PHASE_UI_SOURCE[2],
  "\u6559\u5B66\u8BBE\u8BA1": PHASE_UI_SOURCE[3],
  "\u8303\u4F8B\u7AE0": PHASE_UI_SOURCE[4],
  "\u5168\u7AE0\u5199\u4F5C": PHASE_UI_SOURCE[5],
  "\u7EC8\u68C0\u4E0E\u4EA4\u4ED8": PHASE_UI_SOURCE[6],
  // 交办阶段标签（engine STAGE_LABELS / stageLabel）的简写形态。
  "\u7AE0\u8282\u9AA8\u67B6": "\u7AE0\u8282\u5B89\u6392",
  "\u6574\u7406\u7AE0\u8282\u9AA8\u67B6": "\u7AE0\u8282\u5B89\u6392",
  "\u94FA\u7AE0": "\u5199\u5B8C\u6574\u672C",
  "\u5408\u5E76\u6210\u4E66": "\u5408\u5E76\u6210\u4E66",
  "\u6700\u540E\u68C0\u67E5": "\u6700\u540E\u68C0\u67E5",
  "\u6700\u540E\u68C0\u67E5\uFF08\u8D28\u91CF\u95E8\uFF09": "\u6700\u540E\u68C0\u67E5"
});
function stageLabelHuman(label) {
  const raw = String(label ?? "");
  if (raw === "") return "";
  const direct = STAGE_LABEL_UI[raw];
  if (direct !== void 0) return direct;
  const gate = /^设计提案·(?:第\s*([0-9]+)\s*关|关卡\s*([0-9]+))(·.*)?$/.exec(raw);
  if (gate !== null) return `${gateHuman(gate[1] ?? gate[2])}${gate[3] ?? ""}`;
  if (raw.startsWith("\u5199\u7B2C")) return raw;
  if (raw.startsWith("\u81EA\u67E5\u7B2C")) return raw.replace(/^自查/, "\u68C0\u67E5");
  const chapterDone = /^第\s*([0-9]+)\s*章《(.+?)》完成/.exec(raw);
  if (chapterDone !== null) return `\u7B2C ${chapterDone[1]} \u7AE0\u300A${chapterDone[2]}\u300B\u5B8C\u6210`;
  const bulkConvert = /^批量转换\s*([0-9]+)\s*本\s*PDF$/.exec(raw);
  if (bulkConvert !== null) return `\u6279\u91CF\u8F6C\u6362 ${bulkConvert[1]} \u4EFD\u6750\u6599`;
  return raw;
}
var PLACEHOLDER_WORDING = Object.freeze([
  // 那次上屏的三种形态（「测试标题／测试摘要／测试正文」）＋ 同族的两种写法。
  "\u6D4B\u8BD5\u6807\u9898",
  "\u6D4B\u8BD5\u6458\u8981",
  "\u6D4B\u8BD5\u6B63\u6587",
  "\u6D4B\u8BD5\u5185\u5BB9",
  "\u6D4B\u8BD5\u6587\u672C",
  "\u6D4B\u8BD5\u7528",
  // 票面点名的另一半：「占位」（覆盖「占位符」「占位文本」这类写法）。
  "\u5360\u4F4D",
  // 那次正文括号里的那句，本身就是「这份东西还没写完」的声明。
  "\u7A0D\u540E\u91CD\u53D1",
  // 通用占位标记（写法不分大小写，判据里归一）。
  "TODO",
  "TBD",
  "Lorem ipsum"
]);
var NUMBERED_CHAPTER_FILE_RE = /^工作区\/chapter-\d{2}\.md$/;
function chapterRel(n) {
  return `\u5DE5\u4F5C\u533A/chapter-${String(n).padStart(2, "0")}.md`;
}
var CHAPTER_SHARD_DIR_REL = `${WORK_DIR_NAME}/${CHAPTER_SHARD_DIR_NAME}`;
function chapterShardName(n, m) {
  return `chapter-${String(n).padStart(2, "0")}-${String(m).padStart(2, "0")}.md`;
}
var CHAPTER_SHARD_NAME_RE = (() => {
  const escaped = chapterShardName(0, 0).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const placeholders = escaped.split("00");
  if (placeholders.length !== 3) return /$^/u;
  return new RegExp(`^${placeholders[0]}(\\d+)${placeholders[1]}(\\d+)${placeholders[2]}$`, "u");
})();
var DETAIL_DIR_REL = `${WORK_DIR_NAME}/${DETAIL_DIR_NAME}`;
var REPORT_DIR_REL = `${WORK_DIR_NAME}/${REPORT_DIR_NAME}`;
function okMaterialShards(sources) {
  if (!Array.isArray(sources)) return [];
  const out = [];
  for (const source of sources) if (convertedState(source) === "ok") out.push({ n: out.length + 1, source });
  return out;
}
function okMaterialNumbers(sources) {
  return okMaterialShards(sources).map((shard) => shard.n);
}
var FINAL_AUDIT_SCOPES = Object.freeze([
  { n: 1, scope: "\u6210\u54C1\u5B8C\u6574\u4E0E\u6BCF\u7AE0\u81EA\u67E5\u8BB0\u5F55" },
  { n: 2, scope: "AI \u811A\u624B\u67B6\u6B8B\u7559\u3001\u7EC3\u4E60\u4E0E\u7B54\u6848\u9F50\u5168" },
  { n: 3, scope: "\u4E0E\u5DF2\u62CD\u677F\u8BBE\u8BA1\u4E00\u81F4" },
  { n: 4, scope: "\u6750\u6599\u53EF\u8FFD\u6EAF\u3001\u5F15\u7528\u77DB\u76FE" },
  { n: 5, scope: "\u4E8B\u5B9E\u4E0E\u8DE8\u7AE0\u4E00\u81F4\u6027" }
].map(Object.freeze));
function finalAuditReportName(n) {
  return `final-${String(n).padStart(2, "0")}.md`;
}
function finalAuditReportRel(n) {
  return `${REPORT_DIR_REL}/${finalAuditReportName(n)}`;
}
function finalAuditReportRels() {
  return FINAL_AUDIT_SCOPES.map((row) => finalAuditReportRel(row.n));
}
var PAIRED_AUDIT_ROWS = Object.freeze([
  Object.freeze({
    stage: "gold",
    // 产物名带 `chapter-` 前缀，检查件名是同款前缀 `audit-`，**序号逐字不变**。
    productPrefix: `${WORK_DIR_NAME}/chapter-`,
    productSuffix: ".md",
    auditPrefix: `${WORK_DIR_NAME}/audit-`,
    auditSuffix: ".md",
    auditRels: null,
    why: "\u8303\u4F8B\u7AE0\u6B63\u6587\u4E0E\u5B83\u7684\u68C0\u67E5\u8BB0\u5F55\u662F\u540C\u4E00\u5BF9\u5E8F\u53F7\uFF08audit \u65CF\u7684\u540C\u6B3E\u5951\u7EA6\uFF09"
  }),
  Object.freeze({
    stage: "final",
    productPrefix: null,
    productSuffix: null,
    auditPrefix: null,
    auditSuffix: null,
    productRel: `${WORK_DIR_NAME}/book.md`,
    auditRels: finalAuditReportRels(),
    why: "\u4E94\u4EFD\u5206\u62A5\u544A\u8BFB\u7684\u5C31\u662F\u8FD9\u4E00\u4EFD\u6210\u54C1\u4E66\u3001\u4E14\u665A\u4E8E\u5B83\u843D\u76D8"
  })
].map(Object.freeze));
var FINAL_AUDIT_SUMMARY_NAME = "final-summary.md";
function finalAuditSummaryName() {
  return FINAL_AUDIT_SUMMARY_NAME;
}
function finalAuditSummaryRel() {
  return `${REPORT_DIR_REL}/${finalAuditSummaryName()}`;
}
var ARCHIVED_CHAPTER_RE = /^工作区\/_旧版产物\/chapter-\d{2}\.md\.[0-9a-z]+$/;
var GATE_PROPOSAL_RE = /^工作区\/方案\/关卡[123]-v\d+\.md$/;
var CONVERTED_SOURCE_RE = /^材料\/转换稿\/.+\.md$/;
var READING_NOTE_RE = /^工作区\/reading-\d{2}\.md$/;
var DETAIL_NOTE_RE = /^工作区\/细目\/.+\.md$/;
var REPORT_NOTE_RE = /^工作区\/报告\/.+\.md$/;
function productOpenMode(rel) {
  const path = normalizeBookRel(rel);
  if (path === "\u5DE5\u4F5C\u533A/knowledge-map.json") return "inline";
  if (path === "\u5DE5\u4F5C\u533A/outline.md") return "inline";
  if (NUMBERED_CHAPTER_FILE_RE.test(path) || ARCHIVED_CHAPTER_RE.test(path) || GATE_PROPOSAL_RE.test(path) || CONVERTED_SOURCE_RE.test(path) || READING_NOTE_RE.test(path) || // 老形状的精读细目（**只读兼容**，新落点见下一行）
  DETAIL_NOTE_RE.test(path) || // 精读细目的家（票 `context-budget/11` 接线）
  // 报告目录（票 `context-budget/11`／`12`）：⚠️ 这一族是**目录族**判据，
  // 所以五份分报告**与那份派生汇总件**（`final-summary.md`）一并落在 `'preview'`——
  // 票 12 的「新增产物必须回答预览准入」是这一行答的，不另开一条判据（另开一条就会
  // 出现「目录族已经认了、单独那行漏了」这种两条清单互相矛盾的状态）。
  REPORT_NOTE_RE.test(path) || path === "\u5DE5\u4F5C\u533A/explore.md" || // 探查报告
  // ── 票 `goals-handoff-missing/01`：站 3 那份正文（`工作区/目标-vM.md`）───────────────
  // 病（真宿主 2026-10-26）：它既不在本清单也不在排除表里 ⇒ 落到 `'machine'` ⇒ `/textbook/file`
  // 403 ⇒ 站 3 那张卡读不到自己那一份，「0 条」＋主键恒灰（演示书与真书两条独立证据；
  // `.scratch/gallery-realign/map.md:102` 把那条债记在案）。它**不是**机器件：版式是
  // `1. ` 起首的编号行（`goal-doc-format.renderGoalDoc`），读者就是那一屏上逐条改／删／加的人。
  // ⚠️ 判据走**那一族的唯一出口** `isGoalDocRel`（`goal-doc-format.js` 的 `GOAL_DOC_RE` 就是
  // 写侧 `workflow/goal-doc.js` 读目录时用的同一个正则），⛔ 不在这里手抄第二份「目标-v\d+.md」
  // ——抄一份就多一处会与写侧漂的枚举。
  isGoalDocRel(path) || // 站 3「学完能做到什么」的正文（带版本号）
  path === "\u5DE5\u4F5C\u533A/style-spec.md" || // 写作规范（同为设计文档，步清单把它当产物列出）
  path === "\u5DE5\u4F5C\u533A/book.md" || // 成品
  path === "\u5DE5\u4F5C\u533A/\u77E5\u8BC6\u7ED3\u6784.md" || // 章级切片（给 AI 老师备课先看的那一层）
  path === "\u8FC7\u7A0B\u8BB0\u5F55.md") {
    return "preview";
  }
  return "machine";
}
function artifactPath(rel) {
  return normalizeBookRel(rel);
}
var ARTIFACT_CHAPTER_NAME_RE = /^工作区\/chapter-(\d+)\.md$/;
var ARTIFACT_ARCHIVED_RE = /^工作区\/_旧版产物\//;
var ARTIFACT_GATE_PROPOSAL_RE = /^工作区\/方案\//;
var ARTIFACT_CONVERTED_SOURCE_RE = /^材料\/转换稿\//;
var ARTIFACT_ORIGINAL_RE = /^sources\//;
function artifactKind(rel) {
  const path = artifactPath(rel);
  if (ARTIFACT_CHAPTER_NAME_RE.test(path)) return "\u6B63\u6587";
  if (ARTIFACT_ARCHIVED_RE.test(path)) return "\u65E7\u7A3F";
  if (ARTIFACT_GATE_PROPOSAL_RE.test(path)) return "\u62CD\u677F\u65B9\u6848";
  if (ARTIFACT_CONVERTED_SOURCE_RE.test(path)) return "\u6750\u6599\u8F6C\u6362\u7A3F";
  if (ARTIFACT_ORIGINAL_RE.test(path)) return "\u539F\u4EF6";
  if (path === "\u5DE5\u4F5C\u533A/explore.md") return "\u6311\u91CD\u70B9\u7684\u7ED3\u679C";
  if (path === "\u5DE5\u4F5C\u533A/outline.md") return "\u7AE0\u8282\u5B89\u6392";
  if (path === "\u5DE5\u4F5C\u533A/style-spec.md") return "\u5199\u4F5C\u89C4\u8303";
  if (path === "\u5DE5\u4F5C\u533A/book.md") return "\u6210\u4E66";
  return "\u6587\u4EF6";
}
var STYLE_SPEC_REQUIRED_SECTIONS = Object.freeze([
  "\u6A21\u5F0F\u9009\u578B",
  "\u677F\u5757\u8BED\u6CD5",
  "\u6DF1\u5EA6\u56DB\u7EF4\u627F\u8BFA",
  "\u811A\u624B\u67B6\u6807\u9898\u5217\u8868",
  "\u591A\u6E90\u540C\u7EA7\u58F0\u660E"
]);
var QUALITY_CHECKS_TAIL_NAMES = Object.freeze([
  "\u98CE\u683C\u7EBF\u6761\u6761\u6709\u7740\u843D",
  "\u8FDB\u5EA6\u8D26\u672C\u9F50\u5168",
  "\u6210\u54C1\u65E0\u4E71\u7801\uFF08U+FFFD\uFF09",
  "\u7AE0\u8282\u6570\u7B26\u5408\u5927\u7EB2",
  // 票 `walkthrough-fixes/36`：成品＝各章正文的拼装件（只在机器合并过的书上 push，见 `engine.js` 那一处）。
  "\u6210\u54C1\u4E0E\u5404\u7AE0\u6B63\u6587\u4E00\u81F4",
  // 票 `exclusion-flow/03`：成品里不出现「人已划掉」的知识点（只有那份件里有 live 裁决时才 push，
  // 与上面那一格同一段；可走「其他」豁免，见 `engine.js` 那一处）。
  "\u6210\u54C1\u91CC\u6CA1\u6709\u5DF2\u5212\u6389\u7684\u77E5\u8BC6\u70B9",
  "\u5FC5\u542B\u677F\u5757\u9F50\u5168\uFF08\u5951\u7EA6\u9879\uFF09",
  "\u65E0\u7981\u7528\u8BCD\uFF08\u5951\u7EA6\u9879\uFF09",
  "\u62C6\u811A\u624B\u67B6\u516B\u7C7B\u6B8B\u7559",
  "\u6B63\u6587\u65E0\u5143\u6307\u4EE4\u6B8B\u7559\uFF08human-readable\uFF09",
  "\u7AE0\u8282\u5F15\u7528\u53EF\u8FFD\u6EAF\uFF08\u65E0\u5F15\u7528\u77DB\u76FE\uFF09",
  "\u4EA4\u53C9\u5F15\u7528\u6307\u5411\u771F\u5B9E\u5B58\u5728\u7684\u7AE0",
  "\u7AE0\u540D\u5168\u4E66\u552F\u4E00",
  "\u65E0\u91CD\u590D\u6807\u9898",
  // 票 `word-budget-ineffective/02`：字数兜底下限（低于不过；达到/超过一律通过，不设上限）。
  "\u5B57\u6570\u515C\u5E95\u8BFB\u6570"
]);
var NON_BLOCKING_CHECK_STATES = Object.freeze(["skipped", "not-checked", "not-rechecked"]);
function checkStateIsNonBlocking(state) {
  return NON_BLOCKING_CHECK_STATES.includes(state);
}
function checkBlocksDelivery(check) {
  return check?.ok !== true && !checkStateIsNonBlocking(check?.state);
}
var EVENT_META = Object.freeze({
  "textbook/phase-start": { label: "\u9636\u6BB5\u5F00\u59CB", emoji: "\u25B6\uFE0F" },
  "textbook/phase-end": { label: "\u9636\u6BB5\u5B8C\u6210", emoji: "\u{1F3C1}" },
  "textbook/agent-start": { label: "AI \u5F00\u59CB", emoji: "\u{1F916}", announce: false },
  "textbook/agent-end": { label: "AI \u5B8C\u6210", emoji: "\u{1F916}", announce: false },
  "textbook/gate-proposal": { label: "\u5173\u5361\u63D0\u6848", emoji: "\u{1F4CB}" },
  "textbook/gate-decision": { label: "\u5173\u5361\u62CD\u677F", emoji: "\u2705" },
  "textbook/mineru-progress": { label: "\u6750\u6599\u8F6C\u6362", emoji: "\u{1F4C4}", announce: false },
  "textbook/rollback": { label: "\u56DE\u9000\u5FEB\u7167", emoji: "\u23EA" },
  "textbook/source-added": { label: "\u4E0A\u4F20\u6750\u6599", emoji: "\u{1F4CE}", announce: false },
  "textbook/hint": { label: "\u63D0\u793A", emoji: "\u{1F4A1}" },
  "textbook/quality": { label: "\u8D28\u91CF\u95E8\u68C0\u67E5", emoji: "\u{1F6E1}\uFE0F" },
  "textbook/delivery": { label: "\u4EA4\u4ED8\u5B8C\u6210", emoji: "\u{1F389}" },
  "textbook/error": { label: "\u51FA\u9519", emoji: "\u26A0\uFE0F" },
  "textbook/stage-start": { label: "\u4EA4\u7ED9 AI \u52A8\u624B", emoji: "\u{1F916}", announce: false },
  "textbook/progress": { label: "\u8FDB\u5EA6", emoji: "\u23F3", announce: false },
  "textbook/review": { label: "\u62BD\u67E5\u610F\u89C1", emoji: "\u{1F440}", announce: false },
  // ⚠️ 票 10（判定三 #10）**不动本行**：本表是 ADR-0009 决策 1 的**双端含义表**（机器身份词，
  // 与「源探查」「铺章」同族），ui-wording 那批已把「事件含义表一律不改」写成决定（spec 的
  // Implementation Decisions）。界面上说「AI 检查报告」由 `src/ui/view-rules.js` 的 `EVENT_UI`
  // 覆盖（UI 取词只走那里）；服务端写给人读的出口（`logEntryText` / `announceText` / hint）
  // 各自在出口处翻译——「机器身份词不动、界面词只在出口处替换」正是那条决定的形态。
  "textbook/ai-report": { label: "AI \u81EA\u67E5\u62A5\u544A", emoji: "\u{1F6E1}\uFE0F", announce: false },
  "textbook/style-note": { label: "\u98CE\u683C\u7EBF", emoji: "\u{1F3A8}" },
  "textbook/intervention": { label: "\u7559\u8A00", emoji: "\u{1F4EE}" },
  "textbook/intervention-done": { label: "\u7559\u8A00\u5DF2\u5904\u7406", emoji: "\u{1F4EE}", announce: false },
  "textbook/waiver": { label: "\u8C41\u514D\u653E\u884C", emoji: "\u{1F6DF}" },
  "textbook/waiver-revoke": { label: "\u8C41\u514D\u6536\u56DE", emoji: "\u{1F6DF}", announce: false },
  "textbook/pause": { label: "\u6682\u505C", emoji: "\u23F8" },
  "textbook/resume": { label: "\u7EE7\u7EED", emoji: "\u25B6" },
  "textbook/outline-decision": { label: "\u7AE0\u8282\u5B89\u6392\u62CD\u677F", emoji: "\u{1F4CB}" },
  "textbook/gold-opinion": { label: "\u91D1\u6807\u51C6\u610F\u89C1", emoji: "\u270D\uFE0F", announce: false },
  "textbook/gold-seal": { label: "\u91D1\u6807\u51C6\u5B9A\u7A3F", emoji: "\u{1F3C6}" },
  "textbook/gold-chapter": { label: "\u91D1\u6807\u51C6\u7AE0", emoji: "\u{1F451}", announce: false },
  "textbook/chapters-review": { label: "\u7AE0\u8282\u8FC7\u76EE\u786E\u8BA4", emoji: "\u{1F50D}", announce: false },
  "textbook/final-approve": { label: "\u7EC8\u68C0\u8BA4\u53EF", emoji: "\u2705", announce: false },
  "textbook/deep-modify": { label: "\u5B9A\u70B9\u4FEE\u6539", emoji: "\u270F\uFE0F", announce: false },
  "textbook/deep-undo": { label: "\u64A4\u9500\u5B9A\u70B9\u4FEE\u6539", emoji: "\u21A9\uFE0F", announce: false },
  "textbook/pattern-added": { label: "\u81EA\u5B9A\u4E49\u6A21\u5F0F", emoji: "\u{1F4C7}", announce: false },
  // 交工/提审被拒（票 audit-matrix-contract/01 (d)）：机器把拒收与原因入账——用户与下一个接手的人
  // 不必再翻对话轨迹才知道这道闸门响过。**要开口**（用户正是被「机器报错、AI 说没事」卡住的人）。
  "textbook/submit-rejected": { label: "\u4EA4\u5DE5\u88AB\u62D2", emoji: "\u{1F6AB}" },
  // 写作规范在范例章定稿之后被改过（票 `walkthrough-fixes/12` · 用户 2026-09-29 拍板选 ①）。
  // **机器替 AI 记这一笔**：原来只有终检交工那一刻的一次对账（改了又不声明就打回 400），
  // 于是「范例章定稿 88 分钟后规范被改、这 88 分钟里第 1–12 章全部照旧版落盘」这件事，
  // 账本里一个字都没有、界面上也看不出来——**机器有判据、界面看不出来、账本里也没有**。
  // 与 P31（「每章一个检查文件」被悄悄换成「每批一份」）同一个源簇，形状也同源：
  // **留痕而不禁止**——改规范本身是 AI 在样章执行中的正常收敛，直接拒收会变成死结。
  "textbook/style-spec-change": { label: "\u5199\u4F5C\u89C4\u8303\u53D8\u66F4", emoji: "\u{1F4DD}" },
  // 票 `dsh-contract-drift/09`：提问卡结算了、可这次的答案**没记上**（`unread: true`）。
  // `announce: false`——协调员每轮都读工作记录，这一句是留给它「需要重新问用户」的账，
  // 不在对话流里替它喊（与 `textbook/ai-report` 那类同口径）。
  "textbook/question-unrecorded": { label: "\u63D0\u95EE\u6CA1\u8BB0\u4E0A", emoji: "\u{1F4DD}", announce: false }
});

// src/ui/rules.js
function formatTime(time) {
  return new Date(time).toLocaleTimeString("zh-CN", { hour12: false });
}
var FALLBACK_CLOSED = "closed";
var FALLBACK_FREE = "free";
function fallbackWord(map, value, orientation = FALLBACK_CLOSED) {
  const registered = map !== null && typeof map === "object" && value !== null && value !== void 0 && Object.hasOwn(map, value);
  if (registered) return map[value];
  return orientation === FALLBACK_FREE ? value : null;
}
var STALL_THRESHOLD_MS = 5 * 60 * 1e3;
function humanDuration(ms) {
  const value = Number.isFinite(ms) ? Math.max(0, ms) : 0;
  const minutes = Math.floor(value / 6e4);
  if (minutes < 1) return "\u4E0D\u5230 1 \u5206\u949F";
  if (minutes < 60) return `${minutes} \u5206\u949F`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)
    return minutes % 60 === 0 ? `${hours} \u5C0F\u65F6` : `${hours} \u5C0F\u65F6 ${minutes % 60} \u5206\u949F`;
  const days = Math.floor(hours / 24);
  return hours % 24 === 0 ? `${days} \u5929` : `${days} \u5929 ${hours % 24} \u5C0F\u65F6`;
}
function deriveStallJudgment(input) {
  const { mainAiRunning, subagentRunningCount, subagentActiveSince, lastWriteAt, now } = input ?? {};
  const at = Number.isFinite(lastWriteAt) && lastWriteAt > 0 ? lastWriteAt : null;
  const clock = Number.isFinite(now) ? now : Date.now();
  const idleMs = at === null ? 0 : Math.max(0, clock - at);
  const subagentsRunning = Number.isSafeInteger(subagentRunningCount) && subagentRunningCount > 0;
  const activeSince = Number.isFinite(subagentActiveSince) && subagentActiveSince > 0 ? subagentActiveSince : null;
  const progressing = subagentsRunning && (activeSince === null || clock - activeSince < STALL_THRESHOLD_MS);
  return {
    stalled: at !== null && mainAiRunning !== true && !progressing && idleMs >= STALL_THRESHOLD_MS,
    idleMs,
    // 票 `real-machine-walkthrough-20261114/05`：**有子助手在跑**这件事要跟着判定一起出去。
    // 真机那一屏同时写着「🔎 5 个小助手在跑」与「⏱ 8 分钟没动静了 🔁 从断点继续」——
    // 两句各自都真（子助手在跑是真的；账本 8 分钟没写也是真的），但**摆在一起就自相矛盾**，
    // 而且那颗「从断点继续」在有人干活时点下去会**与正在跑的子助手撞车**（重复派章、重复写）。
    // ⇒ 判定里带上 `subagentsRunning`，由活性行决定「说不说那颗键」（见 `ActivityLine`）。
    subagentsRunning
  };
}
function indexSubagentDescendants(summaries) {
  const indexed = /* @__PURE__ */ new Map();
  for (const descendant of Object.values(summaries ?? {})) {
    if (descendant?.origin !== "subagent") continue;
    const seen = /* @__PURE__ */ new Set();
    let current = descendant;
    while (current?.origin === "subagent" && current.parentId !== void 0 && !seen.has(current.id)) {
      seen.add(current.id);
      const aggregate = indexed.get(current.parentId);
      if (aggregate === void 0) {
        indexed.set(current.parentId, {
          count: 1,
          runningCount: descendant.running ? 1 : 0
        });
      } else {
        aggregate.count += 1;
        if (descendant.running) aggregate.runningCount += 1;
      }
      current = summaries[current.parentId];
    }
  }
  return indexed;
}
function indexRunningSubagentActivity(summaries) {
  const indexed = /* @__PURE__ */ new Map();
  for (const descendant of Object.values(summaries ?? {})) {
    if (descendant?.origin !== "subagent" || descendant.running !== true) continue;
    const since = descendant.updatedAt;
    if (!Number.isFinite(since) || since <= 0) continue;
    const seen = /* @__PURE__ */ new Set();
    let current = descendant;
    while (current?.origin === "subagent" && current.parentId !== void 0 && !seen.has(current.id)) {
      seen.add(current.id);
      const known = indexed.get(current.parentId);
      if (known === void 0 || since > known) indexed.set(current.parentId, since);
      current = summaries[current.parentId];
    }
  }
  return indexed;
}
function isReviewPending(review) {
  return review?.status === "pending";
}
function hasPendingReview(pendingReviews, n) {
  return (pendingReviews ?? []).some(
    (r) => Number(r.chapter) === Number(n) && isReviewPending(r)
  );
}
var CHAPTER_OPERATION = Object.freeze({
  writing: { icon: "\u23F3", tone: "var(--dsw-alias-state-warn-label)", text: "\u6267\u7B14", agent: "\u5199\u4F5C\u5C0F\u52A9\u624B" },
  auditing: { icon: "\u{1F50D}", tone: "var(--dsw-alias-state-business-primary)", text: "\u68C0\u67E5", agent: "\u68C0\u67E5\u5C0F\u52A9\u624B" },
  audited: { icon: "\u{1F50E}", tone: "var(--dsw-alias-state-business-primary)", text: "\u7B49\u590D\u6838", agent: "\u590D\u6838\u5C0F\u52A9\u624B" },
  finalizing: { icon: "\u{1F441}", tone: "var(--dsw-alias-label-secondary)", text: "\u590D\u6838", agent: "\u590D\u6838\u5C0F\u52A9\u624B" }
});
var CHAPTER_ATTRIBUTION_ICON = "\u{1F6E0}\uFE0F";
var CHAPTER_ATTRIBUTION_TONE = "var(--dsw-alias-label-secondary)";
function chapterBadge(row, pendingReviews, doneSet, pipelineStage, auditStale = false, claimed = false, serverDone = null) {
  const hasReview = hasPendingReview(pendingReviews, row.n);
  const settled = () => hasReview ? { icon: "\u{1F4DD}", text: "\u8F6E\u5230\u4F60\uFF1A\u6709\u610F\u89C1\u5F85\u4FEE\u8BA2", tone: "var(--dsw-alias-state-error-primary)" } : auditStale ? { icon: "\u26A0\uFE0F", text: "\u8F6E\u5230\u4F60\uFF1A\u8FD8\u6CA1\u5BA1\u8FC7", tone: "var(--dsw-alias-state-warn-label)" } : serverDone === false ? { icon: "\u26A0\uFE0F", text: "\u8F6E\u5230\u4F60\uFF1A\u8FD8\u6CA1\u5B8C\u6210", tone: "var(--dsw-alias-state-warn-label)" } : { icon: "\u{1F6E1}\uFE0F", text: "\u5DF2\u5B8C\u6210\uFF0C\u5BA1\u8FC7", tone: "var(--dsw-alias-state-success-primary)" };
  if (serverDone === true) return settled();
  if (auditStale && (doneSet.has(row.n) || row.audited === true)) return settled();
  if (doneSet.has(row.n)) {
    if (serverDone !== false || !claimed) return settled();
  }
  if (pipelineStage === "done" && (hasReview || auditStale || serverDone === false)) return settled();
  if (claimed) {
    const operation = CHAPTER_OPERATION[pipelineStage];
    return operation === void 0 ? { icon: "\u23F3", text: "\u6211\u6B63\u5728\u505A", tone: "var(--dsw-alias-state-warn-label)" } : { icon: operation.icon, text: `\u6211\u6B63\u5728\u505A\uFF1A${operation.text}`, tone: operation.tone };
  }
  return null;
}
function chapterAttribution(claimed, pipelineStage) {
  if (claimed !== true) return null;
  const operation = CHAPTER_OPERATION[pipelineStage];
  return {
    icon: CHAPTER_ATTRIBUTION_ICON,
    text: operation === void 0 ? "\u5C0F\u52A9\u624B" : operation.agent,
    tone: CHAPTER_ATTRIBUTION_TONE
  };
}
function deriveDoneSet(events, goldChapter) {
  const gold = Number(goldChapter);
  const set = /* @__PURE__ */ new Set();
  for (const event of events ?? []) {
    if (event.type !== "textbook/agent-end") continue;
    if (event.data?.outcome !== "ok") continue;
    const label = String(event.data?.label ?? "");
    const match = /第(\d+)章/.exec(label);
    if (match !== null) {
      set.add(Number(match[1]));
      continue;
    }
    if (label.includes("\u6700\u4F73\u8303\u4F8B\u7AE0") && Number.isSafeInteger(gold) && gold >= 1)
      set.add(gold);
  }
  return set;
}
function chapterIsDone(chapterStatus, doneSet, pendingReviews, n) {
  const found = (chapterStatus ?? []).find((r) => Number(r?.n) === Number(n));
  if (typeof found?.done === "boolean") return found.done;
  return doneSet.has(Number(n)) && !hasPendingReview(pendingReviews, n);
}
var REVIEW_KIND_TEXT = {
  dislike: "\u{1F615} \u4E0D\u559C\u6B22\u8FD9\u79CD\u5199\u6CD5",
  drop: "\u{1F5D1} \u8FD9\u7C7B\u5185\u5BB9\u4E0D\u9700\u8981",
  change: "\u270F\uFE0F \u8981\u6539\u6210"
};
function reviewText(review) {
  const comment = typeof review?.comment === "string" ? review.comment.trim() : "";
  if (comment !== "") return comment;
  const kind = REVIEW_KIND_TEXT[review?.kind];
  const wish = typeof review?.wish === "string" ? review.wish.trim() : "";
  if (kind !== void 0) return wish === "" ? kind : `${kind}\uFF1A${wish}`;
  return wish === "" ? "\uFF08\u8FD9\u6761\u610F\u89C1\u6CA1\u5199\u5185\u5BB9\uFF09" : wish;
}
var REVIEW_REVOKED_TEXT = "\u5DF2\u64A4\u56DE";
function reviewState(review) {
  if (review?.status === "applied") {
    const how = typeof review.how === "string" ? review.how.trim() : "";
    return {
      key: "applied",
      text: how === "" ? "\u5DF2\u5904\u7F6E\uFF08AI \u6CA1\u5199\u8BF4\u660E\uFF09" : `\u5DF2\u5904\u7F6E\uFF1A${how}`,
      revocable: true
    };
  }
  if (review?.status === "revoked")
    return { key: "revoked", text: REVIEW_REVOKED_TEXT, revocable: false };
  if (review?.status === "pending")
    return {
      key: "pending",
      text: "\u8FD8\u6CA1\u5904\u7F6E\uFF1A\u8FD9\u4E00\u7AE0\u4EA4\u5DE5\u524D\u8981\u5148\u5904\u7F6E\u5B83",
      // 票 09：还没处置的意见也能**撤回**（`gold-opinion-revoke` 置 `revoked`）。原先这里
      // 是 false，于是这一态在界面上**一个按钮都没有**——唯一那条反悔路是「重置重做」，
      // 代价是整本书推倒重来（而那时这一章已经被 AI 改完了）。
      revocable: true
    };
  return { key: "legacy", text: "\u65E9\u5148\u7684\u610F\u89C1\uFF08\u4E0D\u518D\u62E6\u4EA4\u5DE5\uFF09", revocable: false };
}
function mainProgressVisible() {
  return true;
}
function shouldForceBackToNow(prevAwaiting, awaiting, browsing) {
  return awaiting && !prevAwaiting && browsing;
}
function stageScopedProgressDetail(events) {
  const list = events ?? [];
  let boundary = -1;
  for (const event of list) {
    if (event.type === "textbook/stage-start") boundary = event.seq;
  }
  if (boundary === -1) return "";
  let progress = null;
  for (const event of list) {
    if (event.type === "textbook/progress" && event.seq > boundary)
      progress = event;
  }
  if (progress === null) return "";
  return `${progress.data?.label ?? ""}${progress.data?.detail ? `\uFF1A${progress.data.detail}` : ""}`;
}
function splitParagraphs(text) {
  return String(text ?? "").split(/\n\s*\n/).map((para) => para.trim()).filter((para) => para !== "");
}
function paragraphHint(para) {
  return String(para ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
}
function pickComposerAnchorTop(chain) {
  const list = Array.isArray(chain) ? chain : [];
  const self = list[0];
  if (self === void 0 || !Number.isFinite(self.top)) return null;
  const above = list.slice(1).filter(
    (box) => box !== null && typeof box === "object" && box.width > 0 && box.height > 0 && box.top < self.top
  );
  const card = above.find((box) => isRoundedOpaqueBox(box));
  const anchor = card ?? above[0];
  return anchor === void 0 ? null : anchor.top;
}
var COMPOSER_BOTTOM_BAND = 160;
function isComposerCandidate(box, frame) {
  const b = box ?? {};
  const f = frame ?? {};
  const top = Number(b.top);
  const bottom = Number(b.bottom);
  const width = Number(b.width);
  const height = Number(b.height);
  const rootTop = Number(f.rootTop);
  const vh = Number(f.viewportHeight);
  if (![top, bottom, width, height, rootTop, vh].every(Number.isFinite)) return false;
  if (!(width > 0 && height > 0)) return false;
  if (b.insideWorkbench === true) return false;
  if (!(bottom <= vh)) return false;
  if (!(bottom > vh - COMPOSER_BOTTOM_BAND)) return false;
  return top > rootTop;
}
function isRoundedOpaqueBox(box) {
  if (!(parseFloat(box.borderRadius) > 8)) return false;
  const bg = typeof box.backgroundColor === "string" ? box.backgroundColor.trim().toLowerCase() : "";
  if (bg === "" || bg === "transparent") return false;
  const rgba = bg.match(/^rgba?\(([^)]+)\)$/);
  if (rgba === null) return true;
  const parts = rgba[1].split(",").map((part) => parseFloat(part));
  if (parts.length < 4) return true;
  return Number.isFinite(parts[3]) ? parts[3] > 0 : true;
}
var DECISION_CARD_MARGIN = 12;
var CARD_SCROLL_NOT_MEASURED = Object.freeze({ scrollTop: null, measured: false });
function decisionCardScroll(input) {
  const { cardTop, cardHeight, viewportHeight, scrollTop } = input ?? {};
  const top = Number(cardTop);
  const height = Number(cardHeight);
  const view = Number(viewportHeight);
  const from = Number(scrollTop);
  if (![top, height, view, from].every(Number.isFinite)) return CARD_SCROLL_NOT_MEASURED;
  if (view <= 0 || height <= 0) return CARD_SCROLL_NOT_MEASURED;
  const bottom = top + height;
  if (top >= from + DECISION_CARD_MARGIN && bottom <= from + view - DECISION_CARD_MARGIN)
    return { scrollTop: null, measured: true };
  const fits = height + DECISION_CARD_MARGIN * 2 <= view;
  const next = Math.max(
    0,
    Math.round(
      fits ? top - DECISION_CARD_MARGIN : bottom + DECISION_CARD_MARGIN - view
    )
  );
  return { scrollTop: next === from ? null : next, measured: true };
}
function diffParagraphs(oldParas, newParas) {
  const n = oldParas.length;
  const m = newParas.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i2 = n - 1; i2 >= 0; i2 -= 1) {
    for (let j2 = m - 1; j2 >= 0; j2 -= 1) {
      dp[i2][j2] = oldParas[i2] === newParas[j2] ? dp[i2 + 1][j2 + 1] + 1 : Math.max(dp[i2 + 1][j2], dp[i2][j2 + 1]);
    }
  }
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (oldParas[i] === newParas[j]) {
      ops.push({ type: "same", old: i, new: j });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "del", old: i });
      i += 1;
    } else {
      ops.push({ type: "add", new: j });
      j += 1;
    }
  }
  while (i < n) {
    ops.push({ type: "del", old: i });
    i += 1;
  }
  while (j < m) {
    ops.push({ type: "add", new: j });
    j += 1;
  }
  return ops;
}
function contextOccupancySentence(percent) {
  if (!Number.isFinite(percent)) return "";
  return `\u4E0A\u4E0B\u6587\u5DF2\u7528 ${percent}%`;
}
function materialFormatHint() {
  const groups = [];
  for (const { ext, family } of MATERIAL_FORMATS) {
    const last = groups[groups.length - 1];
    if (last !== void 0 && last.family === family) last.exts.push(ext);
    else groups.push({ family, exts: [ext] });
  }
  return `\u652F\u6301\u683C\u5F0F\uFF1A${groups.map(
    (g) => g.exts.length === 1 ? g.family : `${g.family}\uFF08${g.exts.join("/")}\uFF09`
  ).join("\u3001")}`;
}
function offChannelMaterialFormatNote() {
  return MATERIAL_FORMAT_OFF_CHANNEL.map((one) => one.hint).join(" ");
}

// src/ui/event-cards.js
var import_react6 = require("react");

// src/ui/book-readings.js
var import_react3 = require("react");

// src/ui/machine-product-folds.js
function parseKnowledgeMap(text) {
  const data = parseKnowledgeMapRaw(text);
  if (data === null) return null;
  return {
    chapters: Array.isArray(data.chapterSuggestion) ? data.chapterSuggestion : [],
    kps: Array.isArray(data.knowledgePoints) ? data.knowledgePoints : [],
    // 键序＝读者取用序（知识那一族挨着），不是 JSON 原文的键序。
    methods: Array.isArray(data.teachingMethods) ? data.teachingMethods : [],
    materials: Array.isArray(data.materials) ? data.materials : [],
    graph: knowledgeGraphOf(data)
  };
}
function parseKnowledgeMapRaw(text) {
  if (typeof text !== "string" || text === "") return null;
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (data === null || typeof data !== "object") return null;
  return data;
}
function knowledgeGraphOf(data) {
  if (!Array.isArray(data.cards) || !Array.isArray(data.edges)) return null;
  return { cards: data.cards, edges: data.edges };
}
function foldKnowledgeMap(text) {
  const km = parseKnowledgeMap(text);
  if (km === null) return null;
  const lines = [];
  const { chapters, kps, methods, materials } = km;
  if (chapters.length > 0) {
    lines.push(`\u{1F4DA} \u7AE0\u8282\u5EFA\u8BAE\uFF08${chapters.length} \u7AE0\uFF09`);
    chapters.forEach((chapter, index) => {
      const title = String(chapter?.title ?? "").trim();
      const src = String(chapter?.source ?? "").trim();
      lines.push(`${index + 1}. ${title}${src !== "" ? `\u3000\u2190 ${src}` : ""}`);
    });
    lines.push("");
  }
  if (kps.length > 0) {
    lines.push(`\u{1F3AF} \u77E5\u8BC6\u70B9\u6E05\u5355\uFF08${kps.length} \u4E2A\uFF09`);
    for (const point of kps) {
      const title = String(point?.title ?? "").trim();
      if (title === "") continue;
      const diff = String(point?.difficulty ?? "").trim();
      const src = String(point?.source ?? "").trim();
      lines.push(
        `\xB7 ${title}${diff !== "" ? `\uFF08${diff}\uFF09` : ""}${src !== "" ? ` ${src}` : ""}`
      );
    }
    lines.push("");
  }
  if (methods.length > 0) {
    lines.push(`\u{1F9ED} \u6559\u6CD5\uFF08${methods.length} \u6761\uFF09`);
    for (const method of methods) {
      const title = String(method?.title ?? "").trim();
      if (title === "") continue;
      const src = String(method?.source ?? "").trim();
      lines.push(`\xB7 ${title}${src !== "" ? ` ${src}` : ""}`);
    }
    lines.push("");
  }
  if (materials.length > 0) {
    lines.push(`\u{1F4C4} \u6750\u6599\u5C0F\u8282\uFF08${materials.length} \u4EFD\uFF09`);
    materials.forEach((material, index) => {
      const title = String(material?.title ?? "").trim();
      const sections = Array.isArray(material?.sections) ? material.sections.map((s) => String(s?.title ?? "").trim()).filter((t) => t !== "") : [];
      lines.push(
        `\u8D44\u6599${material?.num ?? index + 1}${title !== "" ? `\uFF08${title}\uFF09` : ""}\uFF1A${sections.join(" / ") || "\uFF08\u672A\u8BFB\u5230\u5C0F\u8282\u6807\u9898\uFF09"}`
      );
    });
    lines.push("");
  }
  if (lines.length === 0) return null;
  return lines.join("\n").replace(/\n+$/, "");
}
function foldOutline(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (data === null || typeof data !== "object") return null;
  const chapters = Array.isArray(data.chapters) ? data.chapters : [];
  if (chapters.length === 0) return null;
  const lines = [`\u{1F4D0} \u7AE0\u8282\u5B89\u6392\uFF08${chapters.length} \u7AE0\uFF09`];
  chapters.forEach((chapter, index) => {
    const title = String(chapter?.title ?? "").trim();
    lines.push(`${index + 1}. ${title}`);
    const summary = String(chapter?.outline ?? "").trim();
    if (summary !== "") lines.push(`\u3000${summary}`);
    const source = String(chapter?.source ?? "").trim();
    if (source !== "") lines.push(`\u3000\u6E90\uFF1A${source}`);
    const points = (Array.isArray(chapter?.points) ? chapter.points : []).map((pt) => String(pt ?? "").trim()).filter((pt) => pt !== "");
    if (points.length > 0) lines.push(`\u3000\u8986\u76D6\u77E5\u8BC6\u70B9 ${points.length} \u4E2A\uFF1A${points.join(" / ")}`);
  });
  return lines.join("\n");
}

// src/ui/book-readings.js
var HANZI_READING_UNKNOWN = "\u5B57\u6570\u672A\u77E5";
var KNOWLEDGE_POINTS_READING_UNKNOWN = "\u77E5\u8BC6\u70B9\u6570\u672A\u77E5";
var BY_LIST_NOTE = "\u6309\u6E05\u5355\u8BA1";
function bookChapterNumbers(meta) {
  const chapters = meta?.outline?.chapters;
  if (!Array.isArray(chapters) || chapters.length === 0) return null;
  return chapters.map((_, index) => index + 1);
}
function measureBookHanzi({ chapterNumbers, chapterTexts } = {}) {
  const numbers = Array.isArray(chapterNumbers) ? chapterNumbers : [];
  if (numbers.length === 0) {
    return { known: false, total: null, missing: [] };
  }
  const missing = [];
  let total = 0;
  for (const n of numbers) {
    const text = chapterTexts === null || chapterTexts === void 0 ? void 0 : chapterTexts[n];
    if (typeof text !== "string") {
      missing.push(n);
      continue;
    }
    total += countHanzi(text);
  }
  if (missing.length > 0) return { known: false, total: null, missing };
  return { known: true, total, missing: [] };
}
function measureBookKnowledgePoints(knowledgeMapText) {
  const raw = parseKnowledgeMapRaw(knowledgeMapText);
  if (raw === null || !Array.isArray(raw.knowledgePoints)) return { known: false, count: null };
  return { known: true, count: raw.knowledgePoints.length };
}
function deriveBookReadings({ meta = null, knowledgeMapText = null, chapterTexts = null } = {}) {
  const chapterNumbers = bookChapterNumbers(meta);
  return {
    chapters: chapterNumbers === null ? null : chapterNumbers.length,
    hanzi: measureBookHanzi({ chapterNumbers, chapterTexts }),
    knowledgePoints: measureBookKnowledgePoints(knowledgeMapText)
  };
}
async function readChapterTexts({ chapterNumbers, readText }) {
  const settled = await Promise.allSettled(
    chapterNumbers.map((n) => Promise.resolve().then(() => readText(chapterRel(n))))
  );
  const texts = {};
  settled.forEach((result, index) => {
    if (result.status !== "fulfilled" || typeof result.value !== "string") return;
    texts[chapterNumbers[index]] = result.value;
  });
  return texts;
}
function useBookReadings({ meta = null, knowledgeMapText = null, fetchText = null } = {}) {
  const chapterNumbers = bookChapterNumbers(meta);
  const chaptersKey = chapterNumbers === null ? "" : chapterNumbers.join(",");
  const [chapterTexts, setChapterTexts] = (0, import_react3.useState)(null);
  (0, import_react3.useEffect)(() => {
    if (chapterNumbers === null || typeof fetchText !== "function") {
      setChapterTexts(null);
      return void 0;
    }
    let alive = true;
    readChapterTexts({ chapterNumbers, readText: fetchText }).then((texts) => {
      if (alive) setChapterTexts(texts);
    });
    return () => {
      alive = false;
    };
  }, [chaptersKey, fetchText]);
  return (0, import_react3.useMemo)(
    () => deriveBookReadings({ meta, knowledgeMapText, chapterTexts }),
    // meta 只贡献章数，已经由 `chaptersKey` 表达；`chapterTexts`／合并件原文一变就重算。
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chaptersKey, knowledgeMapText, chapterTexts]
  );
}
function wanText(total) {
  const wan = total / 1e4;
  return wan >= 100 ? String(Math.round(wan)) : wan.toFixed(1).replace(/\.0$/, "");
}
function hanziReadingText(reading) {
  if (!reading || reading.known !== true || !Number.isFinite(reading.total) || reading.total < 0) {
    return HANZI_READING_UNKNOWN;
  }
  const total = Math.round(reading.total);
  return total < 1e4 ? `${total} \u6C49\u5B57` : `\u7EA6 ${wanText(total)} \u4E07\u6C49\u5B57`;
}
function knowledgePointsReadingText(reading) {
  if (!reading || reading.known !== true || !Number.isSafeInteger(reading.count) || reading.count < 0) {
    return KNOWLEDGE_POINTS_READING_UNKNOWN;
  }
  return `${reading.count} \u6761\u77E5\u8BC6\u70B9\uFF08${BY_LIST_NOTE}\uFF09`;
}
function bookReadingsFactSentence(readings) {
  const chapters = readings?.chapters;
  if (!Number.isSafeInteger(chapters) || chapters <= 0) return null;
  return `${chapters} \u7AE0\uFF0C${hanziReadingText(readings.hanzi)}\uFF0C${knowledgePointsReadingText(readings.knowledgePoints)}\u3002`;
}

// src/ui/material-gap.js
var import_react4 = require("react");
function gapLine(source) {
  return `${convertedIcon(source)} ${source.file} \u2014\u2014 \u8FD9\u4E00\u4EFD\u6CA1\u8F6C\u6210\uFF0C\u8FD9\u672C\u4E66\u6682\u65F6\u7F3A\u5B83\u3002`;
}
function MaterialGapList(props) {
  const { sources, onReplaceSource, onRemoveSource, busy = false, autoSplit = false } = props;
  const gaps = (sources ?? []).filter((source) => convertedState(source) === "failed");
  const [working, setWorking] = (0, import_react4.useState)(null);
  const [confirming, setConfirming] = (0, import_react4.useState)(null);
  const [error, setError] = (0, import_react4.useState)(null);
  const [notice, setNotice] = (0, import_react4.useState)(null);
  if (gaps.length === 0) return null;
  const run = async (file, action, pendingNotice = null) => {
    setWorking(file);
    setError(null);
    setNotice(pendingNotice);
    try {
      await action();
      setConfirming(null);
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setWorking(null);
    }
  };
  const pick = (source) => (event) => {
    const picked = event.target.files?.[0] ?? null;
    if (event.target) event.target.value = "";
    if (picked === null) return;
    setError(null);
    setNotice(null);
    const verdict = judgeMaterialUploadSize({ name: picked.name, size: picked.size, autoSplit });
    if (verdict.blocked) {
      setError(verdict.message);
      setNotice(null);
      return;
    }
    const said = verdict.message === "" ? null : verdict.message;
    void run(source.file, () => onReplaceSource(picked, source), said);
  };
  return (0, import_react4.createElement)(
    "div",
    {
      style: {
        marginTop: "10px",
        padding: "8px 10px",
        borderRadius: "10px",
        border: "1px solid var(--dsw-alias-state-error-primary)"
      }
    },
    (0, import_react4.createElement)(
      "div",
      { style: { fontSize: "13px", fontWeight: 600 } },
      "\u26A0\uFE0F \u6750\u6599\u8FD8\u6CA1\u9F50\uFF0C\u4E0B\u9762\u6BCF\u4E00\u4EFD\u90FD\u8981\u4F60\u8868\u4E2A\u6001"
    ),
    (0, import_react4.createElement)(
      "p",
      { style: { margin: "4px 0 6px", fontSize: "12px", opacity: 0.8 } },
      "\u4E66\u505C\u5728\u8FD9\u4E00\u6B65\u7B49\u4F60\u2014\u2014\u5904\u7406\u5B8C\u6BCF\u4E00\u4EFD\uFF0C\u624D\u4F1A\u5F80\u4E0B\u8D70\u3002"
    ),
    ...gaps.map(
      (source) => (0, import_react4.createElement)(
        "div",
        {
          key: source.file,
          style: {
            padding: "6px 0",
            borderTop: "1px solid var(--dsw-alias-border-l2)",
            fontSize: "13px"
          }
        },
        (0, import_react4.createElement)("div", null, gapLine(source)),
        // 补传：一个真文件选择器（不是「重试」那种把同一份原件再跑一遍的假补传）。
        (0, import_react4.createElement)(
          "label",
          { style: { ...S.label, display: "inline-block", marginRight: "10px" } },
          "\u8865\u4F20\u8FD9\u4E00\u4EFD\uFF1A",
          (0, import_react4.createElement)("input", {
            type: "file",
            // ⚠️ **从受理白名单派生，不写死扩展名**（票 `mineru-formats/07`）：写死
            // `".pdf"` 时，一份转失败的 `.docx`／`.pptx`／`.png` 在这里**连选都选不到**，
            // 而服务端闸门是收的 ⇒ 对那份红源彻底无路可走（票 03 的硬要求）。
            accept: materialFormatAccept(),
            disabled: busy || working !== null,
            style: S.disabled({ ...S.input, display: "inline-block", width: "auto", margin: "2px 0" }, busy || working !== null),
            onChange: pick(source)
          })
        ),
        confirming === source.file ? (0, import_react4.createElement)(
          "span",
          { style: { fontSize: "12px" } },
          "\u5220\u4E86\u539F\u4EF6\u5C31\u627E\u4E0D\u56DE\u6765\u4E86\u3002",
          (0, import_react4.createElement)(
            "button",
            {
              style: S.disabled({ ...S.ghostBtn(true), padding: "2px 8px", fontSize: "12px", margin: "0 6px" }, busy || working !== null),
              disabled: busy || working !== null,
              onClick: () => void run(source.file, () => onRemoveSource(source.file))
            },
            "\u786E\u8BA4\u5220\u6389\u8FD9\u4EFD"
          ),
          (0, import_react4.createElement)(
            "button",
            {
              style: { ...S.smallLink, marginLeft: "4px" },
              onClick: () => setConfirming(null)
            },
            "\u7B97\u4E86"
          )
        ) : (0, import_react4.createElement)(
          "button",
          {
            style: S.disabled({ ...S.smallLink }, busy || working !== null),
            disabled: busy || working !== null,
            onClick: () => setConfirming(source.file)
          },
          "\u5220\u6389\u8FD9\u4EFD"
        )
      )
    ),
    error === null ? null : (0, import_react4.createElement)("p", { style: S.error }, error),
    // 「不拦但要说」那一档（票 10）：说明的话不该长得像一次失败，所以不走 error 那一格
    // ——措辞与配色承 `UploadArea` 那一档（同一份判据，同一句话）。
    notice === null ? null : (0, import_react4.createElement)(
      "p",
      { style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.85 } },
      `\u2139\uFE0F ${notice}`
    )
  );
}

// src/ui/md-render.js
var import_react5 = require("react");
var BODY_MEASURE_MAX_WIDTH = "36em";
var READER_PARA_STYLE = {
  margin: "0 0 0.75em",
  fontSize: "13px",
  lineHeight: 1.7,
  maxWidth: BODY_MEASURE_MAX_WIDTH
};
function renderInline(text) {
  const str = String(text ?? "");
  const head = /^(#{1,2})\s+(.+)$/.exec(str);
  if (head !== null)
    return [
      (0, import_react5.createElement)(
        "strong",
        { style: { fontSize: "16px" } },
        ...inlineBold(head[2])
      )
    ];
  const list = /^[-*]\s+(.+)$/.exec(str);
  if (list !== null)
    return [
      (0, import_react5.createElement)(
        "span",
        { style: { display: "block" } },
        "\u2022 ",
        ...inlineBold(list[1])
      )
    ];
  return inlineBold(str);
}
function inlineBold(s) {
  const parts = String(s).split(/(\*\*.+?\*\*)/g);
  const nodes = [];
  for (let i = 0; i < parts.length; i += 1) {
    if (parts[i] === "") continue;
    nodes.push(
      i % 2 === 1 ? (0, import_react5.createElement)("strong", { key: i }, parts[i].slice(2, -2)) : parts[i]
    );
  }
  return nodes;
}
function exploreReportBlocks(mdText) {
  const paras = splitParagraphs(mdText);
  const blocks = [];
  for (const para of paras) {
    blocks.push(
      /^#{1,2}\s+/.test(para) ? (0, import_react5.createElement)(
        "div",
        {
          key: blocks.length,
          style: { margin: "0 0 0.6em", maxWidth: BODY_MEASURE_MAX_WIDTH }
        },
        ...renderInline(para)
      ) : (0, import_react5.createElement)(
        "p",
        { key: blocks.length, style: READER_PARA_STYLE },
        ...renderInline(para)
      )
    );
  }
  return blocks;
}
var BODY_KIND_MARKDOWN = "markdown";
var BODY_KIND_MACHINE_JSON = "machine-json";
var BODY_KINDS = Object.freeze([BODY_KIND_MARKDOWN, BODY_KIND_MACHINE_JSON]);
function bodyOf(text, kind) {
  if (kind === BODY_KIND_MARKDOWN) return exploreReportBlocks(text);
  if (kind === BODY_KIND_MACHINE_JSON) return machineJsonBlocks(text);
  return [];
}
var MACHINE_JSON_FOLD_SUMMARY = "\u25B8 \u5C55\u5F00\u539F\u6587\uFF08\u673A\u5668 JSON\uFF09";
function machineJsonBlocks(text) {
  const raw = String(text ?? "");
  return [
    (0, import_react5.createElement)(
      "details",
      { key: "machine-json", style: { margin: "4px 0 0" } },
      (0, import_react5.createElement)(
        "summary",
        { style: { cursor: "pointer", fontSize: "12px", opacity: 0.85 } },
        MACHINE_JSON_FOLD_SUMMARY
      ),
      (0, import_react5.createElement)(
        "pre",
        {
          style: {
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            background: "var(--dsw-alias-bg-layer-1)",
            borderRadius: "6px",
            padding: "8px",
            fontSize: "12px",
            margin: "4px 0 0"
          }
        },
        raw
      )
    )
  ];
}
var RICH_SLOTS = Object.freeze([
  Object.freeze({
    file: "src/ui/md-render.js",
    slot: "\u673A\u5668 JSON \u6298\u53E0\u4EF6\u91CC\u7684\u539F\u6587\uFF08\u672C\u51FA\u53E3\u7684 machine-json \u90A3\u4E00\u6863\uFF09",
    reason: "\u673A\u5668\u4EA7\u7269\u7684**\u539F\u6587**\u5C31\u662F\u5B83\u8BE5\u6709\u7684\u6837\u5B50\uFF1A\u4EBA\u8BFB\u5F62\u6001\u7531\u5404\u57DF\u81EA\u5DF1\u7684\u6298\u53E0\u4EF6\u8D1F\u8D23\uFF08\u6570\u636E\u540C\u6E90\u3001\u63AA\u8F9E\u5404\u81EA\u6210\u7BC7\uFF09\uFF0C\u800C\u88C1\u51B3\u660E\u786E\u628A\u6298\u53E0\u6E05\u5355\u6392\u9664\u5728\u6B63\u6587\u5757\u4E4B\u5916\u2014\u2014\u4E8C\u6B21\u6392\u7248\u53EA\u4F1A\u6539\u6389\u5B83\u9010\u5B57\u7684\u6027\u8D28\u3002"
  }),
  Object.freeze({
    file: "src/ui/chat-desk.js",
    slot: "\u5BF9\u8BDD\u6C14\u6CE1\u6B63\u6587\uFF08\u7528\u6237\u4E0E AI \u7684\u81EA\u7531\u6587\u672C\uFF09",
    reason: "\u5BF9\u8BDD\u53F0\u6E32\u67D3\u7684\u662F**\u5BBF\u4E3B\u5BF9\u8BDD\u8282\u70B9**\u7684\u81EA\u7531\u6587\u672C\uFF0C\u4E0D\u662F\u672C\u4ED3\u4EA7\u51FA\u7684\u6B63\u6587\uFF1B\u6C14\u6CE1\u662F\u300C88% \u5BBD \uFF0B \u9760\u8FB9\u5BF9\u9F50\u300D\u7684\u7248\u9762\uFF0C\u8D70\u6B63\u6587\u5757\u4F1A\u628A\u5B83\u6539\u6210\u957F\u6BB5\u843D\uFF08\u90A3\u662F\u53E6\u4E00\u79CD\u4E1C\u897F\uFF09\u3002"
  }),
  Object.freeze({
    file: "src/ui/chat-desk.js",
    slot: "\u7CFB\u7EDF\u7070\u5B57\u5C0F\u884C\uFF08\u91CD\u8BD5/\u547D\u4EE4/\u538B\u7F29\u7B49\u63D0\u793A\uFF09",
    reason: "\u4E00\u884C\u4E00\u6761\u7684\u7CFB\u7EDF\u63D0\u793A\uFF08`muted`\uFF09\uFF0C\u6CA1\u6709\u6BB5\u843D\u7ED3\u6784\uFF1B\u5B83\u7684\u5B57\u53F7\u4E0E\u900F\u660E\u5EA6\u5C31\u662F\u300C\u4E0D\u6253\u6270\u4E3B\u5BF9\u8BDD\u300D\u90A3\u4E00\u6863\u3002"
  }),
  Object.freeze({
    file: "src/ui/chat-desk.js",
    slot: "\u843D\u8D26\u56DE\u6267\u5FBD\u7AE0",
    reason: "\u4E00\u884C\u4E00\u6761\u7684\u56DE\u6267\uFF08\u300C\u2713 \u5DF2\u8BB0\u5165\u2026\u300D\uFF09\uFF0C\u9010\u6761\u5DE6\u7F29\u8FDB\u5BF9\u9F50\u6C14\u6CE1\u5185\u6587\u2014\u2014\u5B83\u662F\u8D26\u672C\u843D\u70B9\u7684\u56DE\u58F0\uFF0C\u4E0D\u662F\u6B63\u6587\u3002"
  }),
  Object.freeze({
    file: "src/ui/knowledge-graph-map.js",
    slot: "\u77E5\u8BC6\u70B9\u5361\u5BF9\u8BDD\u6846\u91CC\u7684\u300C\u53EF\u68C0\u9A8C\u300D\u90A3\u4E00\u53E5",
    reason: "\u77E5\u8BC6\u5730\u56FE\u91CC\u7684\u4E00\u53E5\u8BDD\uFF08\u81EA\u7531\u6587\u672C\u3001\u5355\u53E5\uFF09\uFF0C\u4F4F\u5728\u90A3\u5F20\u5361\u7684\u5BF9\u8BDD\u6846\u91CC\uFF1B\u8FD9\u91CC\u8981\u7684\u662F\u300C\u8FD9\u53E5\u8BDD\u8BE5\u600E\u4E48\u9A8C\u300D\u7684\u539F\u6587\uFF0C\u6392\u7248\u6539\u4E0D\u52A8\u5B83\u7684\u4FE1\u606F\u91CF\u3002"
  }),
  Object.freeze({
    file: "src/ui/phase-page.js",
    slot: "\u9636\u6BB5\u9875\u5404\u300C\u5C31\u5730\u6298\u53E0\u6E05\u5355\u300D\u7684\u539F\u6587\uFF08`P.pre`\uFF09",
    reason: "\u88C1\u51B3\u660E\u786E\u628A**\u6298\u53E0\u6E05\u5355**\u6392\u9664\u5728\u6B63\u6587\u5757\u4E4B\u5916\uFF08\u89C1\u672C\u6A21\u5757\u6587\u4EF6\u5934\u90A3\u6BB5\uFF09\uFF1A\u5B83\u9010\u5B57\u5370\u673A\u5668\u4EA7\u7269\u7684\u539F\u6587\uFF0C\u4EBA\u8BFB\u5F62\u6001\u7531\u5404\u57DF\u6298\u53E0\u4EF6\uFF08`machine-product-folds`\uFF09\u8D1F\u8D23\u3002"
  }),
  Object.freeze({
    file: "src/ui/replay-list.js",
    slot: "\u56DE\u653E\u884C\u5C55\u5F00\u7684\u5168\u6587\uFF08\u9A73\u56DE\u7406\u7531/\u62D2\u4EA4\u539F\u56E0/\u673A\u5668\u515C\u5E95\u2026\uFF09",
    reason: "\u8FD9\u4E00\u683C\u7ED9\u7684\u662F\u90A3\u4E00\u884C**\u5168\u6587**\uFF08\u7968 07 \u7684\u7EAF\u5C55\u5F00\u6536\u8D77\uFF0C\u4F9B\u6838\u5BF9\u5F53\u65F6\u5199\u4E86\u4EC0\u4E48\uFF09\uFF1B\u8FD9\u4E00\u5C4F\u7684\u804C\u8D23\u662F\u6838\u5BF9\uFF0C\u9010\u5B57\u4F18\u5148\u4E8E\u597D\u770B\uFF0C\u26D4 \u4E0D\u5728\u8FD9\u91CC\u505A\u7B2C\u4E8C\u5957\u6392\u7248\u3002\uFF08\u540C\u4E00\u884C\u91CC\u539F\u5148\u90A3\u4EFD\u300C\u63D0\u6848\u6B63\u6587\u300D\u7531\u7968 `ui-systematic-fixes/03` \u63A5\u8FDB\u4E86 `bodyOf`\uFF0C\u767B\u8BB0\u968F\u4E4B\u5220\u6389\u3002\uFF09"
  })
]);

// src/ui/card-view.js
var HOST_HOOK = /^use[A-Z]/;
var PASSTHROUGH = /* @__PURE__ */ new Set([
  "then",
  "catch",
  "finally",
  "toJSON",
  "constructor",
  "inspect",
  "nodeType",
  "$$typeof"
]);
var CardViewError = class extends TypeError {
};
function defineCardView(spec) {
  if (spec === null || typeof spec !== "object") {
    throw new CardViewError("defineCardView \u7684 spec \u5FC5\u987B\u662F\u4E00\u4E2A\u5BF9\u8C61\u3002");
  }
  const { card, fromBook = [], required = [], defaults = {}, derive = null } = spec;
  if (typeof card !== "string" || card === "") {
    throw new CardViewError(
      "defineCardView \u7684 spec.card \u5FC5\u586B\u4E14\u975E\u7A7A\uFF1A\u5B83\u53EA\u8FDB\u9519\u8BEF\u539F\u6587\uFF0C\u4F46\u6CA1\u6709\u5B83\uFF0C\u88C5\u914D\u9519\u4E86\u6CA1\u4EBA\u8BF4\u5F97\u6E05\u662F\u54EA\u5F20\u5361\u3002"
    );
  }
  if (!Array.isArray(fromBook) || !Array.isArray(required)) {
    throw new CardViewError(`[${card}] fromBook \u4E0E required \u5FC5\u987B\u662F\u6570\u7EC4\uFF08\u952E\u540D\uFF0C\u4E0D\u662F\u503C\uFF09\u3002`);
  }
  if (defaults === null || typeof defaults !== "object" || Array.isArray(defaults)) {
    throw new CardViewError(`[${card}] defaults \u5FC5\u987B\u662F\u4E00\u4E2A\u300C\u952E \u2192 \u7F3A\u7701\u503C\u300D\u7684\u5BF9\u8C61\u3002`);
  }
  const bookKeys = Object.freeze([...new Set(fromBook)]);
  const requiredKeys = Object.freeze([...new Set(required)]);
  const defaultKeys = Object.freeze(Object.keys(defaults));
  for (const key of [...bookKeys, ...requiredKeys, ...defaultKeys]) {
    if (HOST_HOOK.test(key)) {
      throw new CardViewError(
        `[${card}] \u5951\u7EA6\u91CC\u51FA\u73B0\u4E86\u5BBF\u4E3B\u94A9\u5B50\u5B57\u6BB5\u300C${key}\u300D\uFF1A\u5BBF\u4E3B\u94A9\u5B50\u7559\u5728\u58F3\u91CC\uFF0C\u4E0D\u8BB8\u4E0B\u6C89\u6210\u5361\u7247 props\u3002`
      );
    }
  }
  const bookSet = new Set(bookKeys);
  const defaultSet = new Set(defaultKeys);
  for (const key of requiredKeys) {
    if (defaultSet.has(key)) {
      throw new CardViewError(
        `[${card}] \u300C${key}\u300D\u65E2\u662F\u5FC5\u586B\u53C8\u7ED9\u4E86\u7F3A\u7701\uFF1A\u7F3A\u7701\u53EA\u5728\u503C\u4E3A undefined \u65F6\u751F\u6548\uFF0C\u6240\u4EE5\u8FD9\u6761\u300C\u5FC5\u586B\u300D\u6C38\u8FDC\u4E0D\u4F1A\u88AB\u89E6\u53D1\u3002\u8981\u4E48\u53BB\u6389 defaults \u91CC\u90A3\u4E00\u6761\uFF0C\u8981\u4E48\u522B\u58F0\u660E\u5FC5\u586B\u3002`
      );
    }
    if (!bookSet.has(key)) {
      throw new CardViewError(
        `[${card}] \u5FC5\u586B\u952E\u300C${key}\u300D\u65E2\u4E0D\u5728 fromBook \u91CC\u3001\u4E5F\u4E0D\u5728 defaults \u91CC\uFF0C\u6CA1\u6709\u4EFB\u4F55\u5730\u65B9\u80FD\u7ED9\u5B83\u503C\u2014\u2014\u8FD9\u6761\u300C\u5FC5\u586B\u300D\u6C38\u8FDC\u4E0D\u6210\u7ACB\u3002`
      );
    }
  }
  function build(base, delta) {
    const src = base === null || base === void 0 ? {} : base;
    const bag = {};
    for (const key of bookKeys) bag[key] = src[key];
    for (const key of defaultKeys) {
      if (bag[key] === void 0) bag[key] = defaults[key];
    }
    if (delta !== null && delta !== void 0) {
      const allowed = /* @__PURE__ */ new Set([...bookKeys, ...defaultKeys]);
      for (const key of Object.keys(delta)) {
        if (HOST_HOOK.test(key)) {
          throw new CardViewError(
            `[${card}] delta \u91CC\u585E\u4E86\u5BBF\u4E3B\u94A9\u5B50\u5B57\u6BB5\u300C${key}\u300D\uFF1A\u5BBF\u4E3B\u94A9\u5B50\u7559\u5728\u58F3\u91CC\uFF0C\u4E0D\u8BB8\u4E0B\u6C89\u6210\u5361\u7247 props\uFF08\u58F3\u91CC\u90A3 11 \u5904\u8BFB\u53D6\u70B9\u662F\u5B83\u7684\u5BB6\uFF09\u3002`
          );
        }
        if (!allowed.has(key)) {
          throw new CardViewError(
            `[${card}] delta \u91CC\u6709\u5951\u7EA6\u6CA1\u58F0\u660E\u7684\u952E\u300C${key}\u300D\u3002\u8FD9\u5F20\u5361\u5403\u4EC0\u4E48\u5199\u5728\u5B83\u81EA\u5DF1\u7684\u6587\u4EF6\u91CC\uFF08${card} \u7684 defineCardView\uFF09\uFF0C\u4E0D\u5728\u8C03\u7528\u5904\u4E34\u65F6\u52A0\u2014\u2014\u5199\u9519\u4E86\u7684\u540D\u5B57\u5C31\u662F\u6052\u7A7A\u3002\u5DF2\u58F0\u660E\u7684\u952E\uFF1A${[...allowed].join("\u3001")}\u3002`
          );
        }
        if (delta[key] !== void 0) bag[key] = delta[key];
      }
    }
    if (derive !== null) {
      const extra = derive(bag);
      if (extra === null || typeof extra !== "object") {
        throw new CardViewError(`[${card}] derive \u5FC5\u987B\u8FD4\u56DE\u4E00\u4E2A\u300C\u952E \u2192 \u503C\u300D\u7684\u5BF9\u8C61\u3002`);
      }
      for (const key of Object.keys(extra)) {
        if (HOST_HOOK.test(key)) {
          throw new CardViewError(
            `[${card}] derive \u4EA7\u51FA\u4E86\u5BBF\u4E3B\u94A9\u5B50\u5B57\u6BB5\u300C${key}\u300D\uFF1A\u5BBF\u4E3B\u94A9\u5B50\u7559\u5728\u58F3\u91CC\u3002`
          );
        }
        bag[key] = extra[key];
      }
    }
    for (const key of requiredKeys) {
      if (bag[key] === void 0) {
        throw new CardViewError(
          `[${card}] \u5FC5\u586B\u8F93\u5165\u300C${key}\u300D\u662F undefined\u3002\u8FD9\u5F20\u5361\u7684\u5951\u7EA6\u58F0\u660E\u4E86\u5B83\uFF0C\u6CA1\u6709\u5B83\u5361\u7247\u53EA\u4F1A\u9759\u9ED8\u964D\u7EA7\uFF08\u90A3\u9897\u952E\u70B9\u4E86\u4EC0\u4E48\u90FD\u6CA1\u53D1\u751F\uFF0C\u754C\u9762\u4E0A\u770B\u4E0D\u51FA\u6765\uFF09\u2014\u2014\u8981\u4E48\u8865\u4E0A\uFF0C\u8981\u4E48\u4ECE\u5951\u7EA6\u91CC\u53BB\u6389\u3002`
        );
      }
    }
    Object.defineProperty(bag, "with", {
      enumerable: false,
      value: (next) => next === null || next === void 0 ? bag : build(src, next)
    });
    return Object.freeze(bag);
  }
  return Object.defineProperties(build, {
    card: { enumerable: true, value: card },
    fromBook: { enumerable: true, value: bookKeys },
    required: { enumerable: true, value: requiredKeys },
    __cardViewBuild: { enumerable: false, value: true }
  });
}
function createCardView(book, slots) {
  if (slots === null || typeof slots !== "object" || Array.isArray(slots)) {
    throw new CardViewError("createCardView \u7684 slots \u5FC5\u987B\u662F\u4E00\u4E2A\u300Cslot \u540D \u2192 \u88C5\u914D\u5668\u300D\u7684\u5BF9\u8C61\u3002");
  }
  const cache = /* @__PURE__ */ new Map();
  const view = {};
  const names = [];
  for (const [slot, build] of Object.entries(slots)) {
    if (typeof build !== "function" || build.__cardViewBuild !== true) {
      throw new CardViewError(
        `createCardView \u7684 slot\u300C${slot}\u300D\u4E0D\u662F\u4E00\u4E2A defineCardView \u7684\u8FD4\u56DE\u503C\u3002`
      );
    }
    names.push(slot);
    Object.defineProperty(view, slot, {
      enumerable: true,
      configurable: false,
      get() {
        if (cache.has(slot)) return cache.get(slot);
        const base = {};
        for (const key of build.fromBook) {
          if (book !== null && book !== void 0 && !Object.hasOwn(book, key)) {
            throw new CardViewError(
              `[${build.card}]\uFF08slot\u300C${slot}\u300D\uFF09\u8981\u7684\u4E66\u7EA7\u8F93\u5165\u300C${key}\u300D\u5728 book \u91CC**\u538B\u6839\u6CA1\u6709\u8FD9\u4E2A\u952E**\u3002\u8FD9\u4E0D\u662F\u300C\u503C\u662F undefined\u300D\u2014\u2014\u540E\u8005\u662F\u58F3\u8BF4\u4E86\u300C\u8FD9\u4E00\u4F4D\u6CA1\u6709\u300D\uFF0C\u5408\u6CD5\uFF1B\u524D\u8005\u662F\u58F3\u6CA1\u7ED9\u8FD9\u4E00\u9879\u8D77\u540D\u5B57\u3002\u628A\u5B83\u8865\u8FDB\u58F3\u7684\u90A3\u672C book\u3002`
            );
          }
          base[key] = book === null || book === void 0 ? void 0 : book[key];
        }
        const bag = build(base, void 0);
        cache.set(slot, bag);
        return bag;
      }
    });
  }
  const listed = names.join("\u3001");
  return new Proxy(view, {
    get(target, prop) {
      if (typeof prop === "string" && !(prop in target) && !(prop in Object.prototype) && !PASSTHROUGH.has(prop)) {
        throw new CardViewError(
          `\u58F3\u5F15\u7528\u4E86\u4E00\u4E2A\u6CA1\u767B\u8BB0\u7684\u5361\u7247 slot\u300C${prop}\u300D\u3002\u5DF2\u767B\u8BB0\u7684\u662F\uFF1A${listed}\u3002\u52A0\u4E00\u5F20\u5361\u8981\u540C\u65F6\u767B\u8BB0 slot \u4E0E\u5B83\u5728\u5361\u65C1\u58F0\u660E\u7684\u5951\u7EA6\u3002`
        );
      }
      return target[prop];
    }
  });
}

// src/workbench-knobs.js
var DEFAULT_MAX_CONCURRENT_SUBAGENTS = 5;
var MAX_CONCURRENT_SUBAGENTS_CEILING = 8;

// src/ui/event-cards.js
var NO_SOURCES = Object.freeze([]);
function MachineChecks({ checks, openByDefault = false }) {
  const list = checks ?? [];
  if (list.length === 0) return null;
  const skipped = list.filter((check) => check.state === "skipped").length;
  const notChecked = list.filter((check) => checkStateIsNonBlocking(check.state) && check.state !== "skipped").length;
  const failed = list.filter(checkBlocksDelivery).length;
  const warned = list.filter((check) => check.ok === true && check.warn === true).length;
  const rows = list.map(
    (check) => (0, import_react6.createElement)(
      "div",
      { key: check.name, style: { margin: "4px 0" } },
      (0, import_react6.createElement)(
        "span",
        null,
        check.state === "skipped" ? "\u23ED" : check.state === "not-checked" || check.state === "not-rechecked" ? "\u2754" : check.ok !== true ? "\u274C" : check.warn === true ? "\u26A0\uFE0F" : "\u2705"
      ),
      ` ${checkHuman(check.name)}`,
      check.state === "skipped" ? (0, import_react6.createElement)(
        "span",
        {
          style: {
            marginLeft: "6px",
            fontSize: "12px",
            color: "#9a6700"
          }
        },
        "\uFF08\u5DF2\u8DF3\u8FC7\uFF0C\u672A\u9A8C\uFF0C\u4E0D\u62E6\u4EA4\u4ED8\uFF09"
      ) : check.state === "not-checked" ? (0, import_react6.createElement)(
        "span",
        {
          style: {
            marginLeft: "6px",
            fontSize: "12px",
            color: "#9a6700"
          }
        },
        check.state === "not-rechecked" ? "\uFF08\u672A\u91CD\u8DD1\uFF0C\u672A\u68C0\u67E5\uFF0C\u4E0D\u7B97\u901A\u8FC7\uFF09" : "\uFF08\u672A\u68C0\u67E5\uFF0C\u6CA1\u6709\u53E3\u5F84\uFF0C\u4E0D\u7B97\u901A\u8FC7\uFF09"
      ) : null,
      check.ok === true && check.warn === true ? (0, import_react6.createElement)(
        "span",
        {
          style: {
            marginLeft: "6px",
            fontSize: "12px",
            color: "#9a6700"
          }
        },
        "\uFF08\u53EA\u662F\u63D0\u793A\uFF0C\u4E0D\u62E6\u4EA4\u4ED8\uFF09"
      ) : null,
      (0, import_react6.createElement)(
        "span",
        { style: { opacity: 0.7, marginLeft: "6px", fontSize: "12px" } },
        check.note ?? ""
      )
    )
  );
  const summary = `\u{1F527} \u673A\u5668\u4E5F\u67E5\u8FC7\u4E86 ${list.length} \u9879\uFF0C` + // ⚠️ 有跳过项/未检查项时**不许说「全过」**（票 19③／票 `flow-audit-2026-10/03`）：
  // 全过＝每一项都验过了，而跳过的那些**没验**、未检查的那些**不知道**。
  (failed > 0 ? `\u6709 ${failed} \u9879\u6CA1\u8FC7` : skipped > 0 || notChecked > 0 ? "\u6CA1\u6709\u6CA1\u8FC7\u9879" : "\u5168\u8FC7") + (skipped === 0 ? "" : `\uFF0C\u53E6\u6709 ${skipped} \u9879\u662F\u4F60\u8DF3\u8FC7\u7684\uFF08\u672A\u9A8C\uFF0C\u6CA1\u7B97\u8FDB\u300C\u5DF2\u901A\u8FC7\u300D\uFF09`) + (notChecked === 0 ? "" : `\uFF0C\u53E6\u6709 ${notChecked} \u9879\u6807\u4E3A\u300C\u672A\u68C0\u67E5\u300D\uFF08\u6CA1\u7B97\u8FDB\u300C\u5DF2\u901A\u8FC7\u300D\uFF09`) + (warned === 0 ? "" : `\uFF0C\u53E6\u6709 ${warned} \u9879\u63D0\u793A\u4F60\u770B\u4E00\u773C\uFF08\u53EA\u662F\u63D0\u793A\uFF0C\u4E0D\u62E6\u4EA4\u4ED8\uFF09`);
  if (failed > 0 || warned > 0 || skipped > 0 || notChecked > 0)
    return (0, import_react6.createElement)(
      "div",
      { style: { margin: "10px 0" } },
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "0 0 4px", fontSize: "12px", fontWeight: 600 } },
        summary
      ),
      ...rows
    );
  return (0, import_react6.createElement)(
    "details",
    // 票 `ui-display-redesign/10`：交付页那两块要**默认打开**（可收）——`openByDefault` 只影响
    // 全过那一支；有失败/提示/跳过时本来就不折（那三档不藏）。终检卡不传它 ⇒ 全过照旧折。
    {
      style: { margin: "10px 0" },
      ...openByDefault === true ? { open: true } : {}
    },
    (0, import_react6.createElement)(
      "summary",
      { style: { cursor: "pointer", fontSize: "12px", opacity: 0.85 } },
      `${summary}\uFF08\u70B9\u5F00\u770B\u6BCF\u4E00\u9879\uFF09`
    ),
    (0, import_react6.createElement)("div", { style: { margin: "6px 0 0" } }, ...rows)
  );
}
var MATERIAL_PHASE = 1;
function PhaseBar(props) {
  const { phase, gate, status, onSelect, viewed, artifactCountOf } = props;
  const doneUpTo = phase - 1;
  const gateAwaiting = gate !== null && gate.status === "awaiting";
  const humanTurn = props.humanTurn === true || gateAwaiting && phase === 3;
  return (0, import_react6.createElement)(
    "div",
    { style: S.bar },
    PHASES.map((item) => {
      const isMaterialPhase = item.n === MATERIAL_PHASE;
      let state = "pending";
      if (item.n < phase || status === "delivered" || status === "awaiting-explore" && item.n <= 2 || status === "awaiting-outline" && item.n <= 3 || status === "awaiting-gold" && item.n <= 4 || status === "awaiting-chapters-review" && item.n <= 5)
        state = "done";
      else if (item.n === phase) state = "current";
      let label = PHASE_UI[item.n] ?? item.label;
      if (item.n === phase && humanTurn) label = `\u26A1 ${label}`;
      const count = isMaterialPhase ? Number.isSafeInteger(props.materialCount) ? props.materialCount : 0 : typeof artifactCountOf === "function" ? artifactCountOf(item.n) ?? 0 : 0;
      if (count > 0 && state === "done" && !isMaterialPhase) label = `${label} \u{1F4C4}`;
      const clickable = typeof onSelect === "function";
      const isViewed = viewed === item.n;
      const backToNow = viewed != null && item.n === phase;
      if (backToNow) label = `${label}\uFF0C\u56DE\u5230\u73B0\u5728`;
      return (0, import_react6.createElement)(
        "div",
        {
          key: item.n,
          style: {
            ...S.seg(state),
            ...clickable ? { cursor: "pointer" } : {},
            outline: isViewed ? "2px solid var(--dsw-alias-label-primary)" : "none",
            outlineOffset: isViewed ? "-2px" : "0"
          },
          // hover 文案**两态同形**（都写「去「X」这一步 · 有几份…」）：目的地信息一致，
          // 回看态下"点它其实是回到现在"由那一格脸上的可见文字承担（不靠 hover 才说得清），
          // 也免得同一条 hover 前缀随态变脸（既有断言按 `去「X」` 前缀选格，别让选择器碎掉）。
          // ⚠️ 前缀**不在这里手写**（票 17 · 收口 review F5）：`phaseChipTitlePrefix` 是唯一出处，
          // 画廊驱动器（`dev/gallery/knobs.js`）按同一个函数拼前缀选格。
          // ⚠️ 量词按阶段分：阶段 1 说「份材料」，其余说「份文件」（票 walkthrough-2026-10/03）——
          // 「份」是材料的量词，说阶段 1「还没有文件」是把材料说成了产物。
          title: clickable ? `${phaseChipTitlePrefix(PHASE_UI[item.n] ?? item.label)}\u8FD9\u4E00\u6B65${count > 0 ? `\uFF1A\u6709 ${count} ${isMaterialPhase ? "\u4EFD\u6750\u6599" : "\u4EFD\u6587\u4EF6"}` : `\uFF1A\u8FD8\u6CA1\u6709${isMaterialPhase ? "\u6750\u6599" : "\u6587\u4EF6"}`}` : void 0,
          onClick: clickable ? () => onSelect(item.n) : void 0
        },
        label
      );
    })
  );
}
var WIZARD_CARD_QUESTION = "\u8FD9\u662F\u4E00\u672C\u4EC0\u4E48\u4E66\uFF0C\u5B66\u5B8C\u8981\u80FD\u505A\u5230\u4EC0\u4E48\uFF1F";
var WIZARD_CARD_FACTS = "\u8FD8\u6CA1\u6709\u4E66\uFF0C\u5EFA\u51FA\u6765\u5C31\u80FD\u4E0A\u4F20\u6750\u6599\uFF0C\u4E00\u4E2A\u4F1A\u8BDD\u53EA\u9020\u4E00\u672C\u3002";
function WizardCard(props) {
  const {
    onCreate,
    onCreateDemo,
    busy,
    suggestions,
    suggestLoading,
    onSuggest
  } = props;
  const [name, setName] = (0, import_react6.useState)("");
  const [goal, setGoal] = (0, import_react6.useState)("");
  const [science, setScience] = (0, import_react6.useState)(false);
  const [hint, setHint] = (0, import_react6.useState)("");
  const [error, setError] = (0, import_react6.useState)(null);
  const edit = (setter) => (next) => {
    setError(null);
    setter(next);
  };
  const stripPrefix = (s) => typeof s === "string" ? s.replace(/^\s*(?:开始|书名|建议|题目|目标)[:：]\s*/, "") : s;
  const pickSuggestion = (suggestion) => {
    setName(stripPrefix(suggestion.name ?? ""));
    setGoal(stripPrefix(suggestion.goal ?? ""));
    setScience(suggestion.science === true);
    setError(null);
  };
  const requestSuggest = () => {
    setError(null);
    void onSuggest(hint.trim()).catch(
      (err) => setError(String(err instanceof Error ? err.message : err))
    );
  };
  const submit = () => {
    if (name.trim() === "") {
      setError("\u8BF7\u586B\u5199\u4E66\u540D");
      return;
    }
    if (goal.trim() === "") {
      setError("\u8BF7\u586B\u4E00\u4E0B\uFF1A\u8FD9\u672C\u4E66\u5B66\u5B8C\uFF0C\u5B66\u4E60\u8005\u8981\u80FD\u505A\u5230\u4EC0\u4E48\uFF1F");
      return;
    }
    onCreate({ name: name.trim(), goal: goal.trim(), science });
  };
  return (0, import_react6.createElement)(
    "div",
    { style: S.focus },
    (0, import_react6.createElement)(CardHead, {
      question: (0, import_react6.createElement)(
        "strong",
        { style: CARD_HEAD_QUESTION_STYLE },
        WIZARD_CARD_QUESTION
      ),
      facts: WIZARD_CARD_FACTS
    }),
    (0, import_react6.createElement)("label", { style: S.label }, "\u4E66\u540D"),
    (0, import_react6.createElement)("input", {
      style: S.input,
      placeholder: "\u6BD4\u5982\uFF1A\u521D\u4E2D\u6570\u5B66\uFF1A\u6709\u7406\u6570",
      value: name,
      onChange: (e) => edit(setName)(e.target.value)
    }),
    (0, import_react6.createElement)("label", { style: S.label }, "\u8FD9\u672C\u4E66\u5B66\u5B8C\uFF0C\u8981\u80FD\u505A\u5230\u4EC0\u4E48\uFF1F"),
    (0, import_react6.createElement)("textarea", {
      style: S.textarea,
      placeholder: "\u6BD4\u5982\uFF1A\u80FD\u72EC\u7ACB\u505A\u5BF9\u6559\u6750\u914D\u5957\u7684\u57FA\u7840\u9898\uFF0C\u5E76\u8BF4\u51FA\u6BCF\u4E2A\u6982\u5FF5\u662F\u4EC0\u4E48\u3001\u4E3A\u4EC0\u4E48\u3001\u600E\u4E48\u7528",
      value: goal,
      onChange: (e) => edit(setGoal)(e.target.value)
    }),
    // 票 `confirm-points-redesign-build/03`：这句预告**逐字照裁**（ADR-0037 决策 5 那一句
    // 「文案要预告『先写个大概，后面有一张卡跟你细化』」的落地写法）。它把这一格从一句空要求
    // 变成一个有下文的约定：粗档先写个大概，读过材料后由站 3 那张卡陪着细成 3–5 条。
    (0, import_react6.createElement)(
      "p",
      { style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.75 } },
      "\u5148\u5199\u4E2A\u5927\u6982\u5C31\u884C\u2014\u2014\u8BFB\u8FC7\u6750\u6599\u540E\u6709\u4E00\u5F20\u5361\u966A\u4F60\u628A\u5B83\u7EC6\u6210 3\u20135 \u6761"
    ),
    (0, import_react6.createElement)(
      "div",
      { style: { marginTop: "8px" } },
      (0, import_react6.createElement)(
        "label",
        { style: { ...S.label, marginTop: "0" } },
        "\u5B66\u4E60\u8005\u7684\u80CC\u666F\uFF08\u9009\u586B\uFF0C\u8BA9\u5EFA\u8BAE\u66F4\u8D34\u5207\uFF09"
      ),
      (0, import_react6.createElement)(
        "div",
        { style: { display: "flex", gap: "6px" } },
        (0, import_react6.createElement)("input", {
          style: { ...S.input, margin: "4px 0 6px", flex: 1 },
          placeholder: "\u6BD4\u5982\uFF1A\u4E09\u5E74\u7EA7\uFF0C\u60F3\u8865\u53E4\u8BD7\u80CC\u8BF5\u548C\u4F5C\u6587",
          value: hint,
          onChange: (e) => setHint(e.target.value)
        }),
        (0, import_react6.createElement)(
          "button",
          {
            // 批 4（第一屏判读）：原来「✨ AI 建议」也是 bigBtn(true)，和「创建这本书」
            // 两个一模一样的蓝实心并排——第一屏上"该点哪儿"又糊了。主操作只有一个：创建。
            style: S.disabled({ ...S.ghostBtn(false), padding: "6px 14px", marginTop: "4px" }, suggestLoading),
            onClick: requestSuggest,
            disabled: suggestLoading
          },
          "\u2728 AI \u5EFA\u8BAE"
        )
      )
    ),
    suggestions.length > 0 ? (0, import_react6.createElement)(
      "div",
      { style: { marginTop: "4px" } },
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "0 0 4px", fontSize: "12px", opacity: 0.7 } },
        "\u70B9\u4E00\u4E2A AI \u5EFA\u8BAE\u81EA\u52A8\u586B\u597D\uFF08\u53EF\u518D\u6539\uFF09",
        (0, import_react6.createElement)(
          "button",
          {
            style: S.disabled({ ...S.smallLink, marginLeft: "10px" }, suggestLoading),
            onClick: requestSuggest,
            disabled: suggestLoading
          },
          "\u6362\u4E00\u6279"
        )
      ),
      suggestions.map(
        (suggestion, index) => (0, import_react6.createElement)(
          "button",
          {
            key: index,
            style: {
              ...S.projectBtn(false),
              margin: "0 6px 6px 0",
              textAlign: "left"
            },
            onClick: () => pickSuggestion(suggestion)
          },
          `${suggestion.name ?? ""}\uFF1A${(suggestion.goal ?? "").slice(0, 30)}${(suggestion.goal ?? "").length > 30 ? "\u2026" : ""}`
        )
      )
    ) : suggestLoading ? (0, import_react6.createElement)(
      "p",
      { style: { margin: "8px 0", fontSize: "12px", opacity: 0.7 } },
      "\u{1F4A1} AI \u6B63\u5728\u60F3\u5EFA\u8BAE\u2026\u2026"
    ) : null,
    // ⚠️ 票 `confirm-points-redesign-build/06`：「给谁用？」那两颗 radio 整块**搬去站 4**
    // （第 1 关那张卡），措辞与预选都换了——见 `GatePanel` 里 `gate === "1"` 那一支。
    // 这里连标签一起不留：建书那一刻还没有「学习目标」可跟它一起拍，问了也只是替用户先选一次。
    (0, import_react6.createElement)(
      "label",
      { style: S.checkItem },
      (0, import_react6.createElement)("input", {
        type: "checkbox",
        checked: science,
        onChange: (e) => setScience(e.target.checked)
      }),
      " \u7406\u79D1\u5185\u5BB9\uFF08\u516C\u5F0F\u8F83\u591A\uFF0C\u8F6C\u6362\u65F6\u5F00\u542F\u516C\u5F0F\u8BC6\u522B\uFF09"
    ),
    // ⚠️ 那句**材料声明**原先长在这里，票 `confirm-points-redesign-build/03` 把它搬到了
    // **站 1 的上传卡**（`UploadArea`）——真正要上传材料的那一步。建书屏不再问它：
    // 那时还没有材料可传，勾了也只是走过场。
    error !== null ? (0, import_react6.createElement)("p", { style: S.error }, error) : null,
    (0, import_react6.createElement)(
      "div",
      { style: { marginTop: "8px" } },
      (0, import_react6.createElement)(
        "button",
        { style: S.disabled(S.bigBtn(true), busy), onClick: submit, disabled: busy },
        "\u521B\u5EFA\u8FD9\u672C\u4E66"
      )
    ),
    (0, import_react6.createElement)(
      "p",
      { style: { margin: "10px 0 0", fontSize: "12px", opacity: 0.75 } },
      "\u8FD8\u4E0D\u786E\u5B9A\u8FD9\u5957\u6D41\u7A0B\u9002\u4E0D\u9002\u5408\u4F60\uFF1F",
      (0, import_react6.createElement)(
        "button",
        {
          style: S.disabled({ ...S.smallLink, marginLeft: "6px" }, busy),
          disabled: busy,
          onClick: () => onCreateDemo()
        },
        // 票 14（承诺账 D「说不清」第 4 条）：「2 分钟走完全程」查无机制——demo 与真实共用
        // 同一套确认点（口径见 `CONTEXT.md` 的「确认点」词条），全程要用户在每一个停点上拍板，
        // 没有任何计时/自动推进。改成能兑现的说法。
        "\u5148\u5EFA\u4E00\u672C\u6F14\u793A\u4E66\u8BD5\u8BD5\uFF08\u4E0D\u82B1\u6A21\u578B\u989D\u5EA6\uFF0C\u51E0\u6B65\u5C31\u80FD\u8D70\u5B8C\uFF09"
      )
    )
  );
}
var PROMO_FOLD_SUMMARY = "\u{1F4A1} \u5173\u4E8E\u672C\u9879\u76EE\uFF08\u9080\u8BF7\u7801 / \u7834\u5377\uFF09";
function PromoFoldBlock() {
  return (0, import_react6.createElement)(
    "details",
    { style: { margin: "10px 0" } },
    (0, import_react6.createElement)(
      "summary",
      {
        style: { cursor: "pointer", fontSize: "12px", opacity: 0.75 }
      },
      PROMO_FOLD_SUMMARY
    ),
    (0, import_react6.createElement)(
      "div",
      {
        style: {
          marginTop: "8px",
          padding: "8px 10px",
          fontSize: "12px",
          lineHeight: 1.6,
          opacity: 0.75,
          border: "1px solid var(--dsw-alias-border-l2)",
          borderRadius: "8px",
          background: "var(--dsw-alias-bg-layer-1)"
        }
      },
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "0 0 4px" } },
        "\u672C\u9879\u76EE\u662F",
        (0, import_react6.createElement)(
          "a",
          {
            href: "https://www.socratopia.app/r/SCR-FEJXMQ",
            target: "_blank",
            rel: "noopener noreferrer",
            style: {
              color: "var(--dsw-alias-state-business-primary)",
              textDecoration: "underline"
            }
          },
          "\u3010\u7834\u5377\u3011"
        ),
        "\u7684\u884D\u751F\u9879\u76EE\uFF0C\u9080\u8BF7\u7801\uFF1ASCR-FEJXMQ\u3002"
      )
    )
  );
}
var ERROR_HEADING = "\u26A0\uFE0F \u8FD9\u4E00\u6B65\u51FA\u9519\u4E86";
var TOKEN_HINT = "\u{1F4A1} MinerU Token \u53EF\u80FD\u5931\u6548\uFF0C\u53EF\u5230\u5DE5\u4F5C\u53F0\u300CMinerU Token\u300D\u5904\u70B9\u300C\u91CD\u65B0\u8BBE\u7F6E\u300D\u6362\u65B0 Token\u3002";
function humanErrorOf(meta, fallbackMessage) {
  if (typeof meta?.lastErrorHuman === "string" && meta.lastErrorHuman !== "")
    return meta.lastErrorHuman;
  if (typeof fallbackMessage === "string" && fallbackMessage !== "") return fallbackMessage;
  return "\u672A\u77E5\u9519\u8BEF";
}
function lastErrorEventMessage(events) {
  const list = Array.isArray(events) ? events : [];
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const one = list[i];
    if (one?.type === "textbook/error") return one?.data?.message;
  }
  return void 0;
}
var isTokenIssueOf = (text) => text.includes("Token") || text.includes("token");
var uploadAreaView = defineCardView({
  card: "UploadArea",
  fromBook: [
    "meta",
    "events",
    "onUpload",
    "onConvert",
    // 票 `mineru-formats/03`：补传这一份（沿用上传写面，但**以缺口那一格的名字**落上去）。
    "onReplaceSource",
    // 票 `mineru-formats/03`：删掉这一份（走 `source-remove`；只对 `failed` 的那一格开放）。
    "onRemoveSource",
    // 票 10：上传前那道按格式的体积预检（`false` = 不许承诺会自动拆）。**由内层组件消费**。
    "autoSplit",
    "busy",
    // 票 `demo-channel-full/02`：**演示书**那一屏才有的一颗键（阶段一的「▶ 开始演示」）。
    // ⛔ 不列 `required`：真实书的阶段一没有它，列必填会让所有既有的渲染夹具当场缺项；
    // 缺省 `null` ＝ 这颗键不渲染（见下面 `defaults`）。
    "onDemoNext"
  ],
  required: ["meta", "onUpload", "onConvert"],
  defaults: {
    // 票 `demo-channel-full/02`：缺省 `null`——只有演示书那一屏传它。
    onDemoNext: null
  },
  derive: (book) => ({
    sources: book.meta?.sources ?? NO_SOURCES,
    converting: book.meta?.converting === true,
    conversionStartedAt: book.meta?.updatedAt,
    // 见上方契约注释：非 error 态给 `null`（整条不出声），error 态给那一句正文。
    errorText: book.meta?.status === "error" ? humanErrorOf(book.meta, lastErrorEventMessage(book.events)) : null
  })
});
var UPLOAD_CARD_QUESTION = "\u6750\u6599\u9F50\u4E86\u3001\u53EF\u4EE5\u5F00\u5DE5\u5417\uFF1F";
var UPLOAD_ROLE_FOLD_SUMMARY = "\u8FD9\u4E9B\u6750\u6599\u653E\u5728\u54EA\uFF1F\u6BCF\u4EFD\u662F\u4EC0\u4E48\u89D2\u8272\uFF1F";
var UPLOAD_EXIT_NOTE = "\u8FD9\u4E00\u5C4F\u53EA\u62A5\u72B6\u6001\uFF1B\u9010\u4EFD\u7684\u8F6C\u6362\u7A3F\uFF0F\u539F\u4EF6\u53BB\u9636\u6BB5\u9875\u7684\u6750\u6599\u6E05\u5355\u770B\u3002";
function uploadCardFacts({ sources, pending, agree }) {
  const uploaded = Array.isArray(sources) ? sources.length : 0;
  const waiting = Array.isArray(pending) ? pending.length : 0;
  const head = `\u5DF2\u4F20 ${uploaded} \u4EFD`;
  const tail = waiting > 0 ? `\u8FD8\u6709 ${waiting} \u4EFD\u5F85\u4E0A\u4F20` : "\u8FD8\u6CA1\u6709\u9009\u6750\u6599";
  return `${head}\uFF0C${tail}\uFF0C\u6750\u6599\u58F0\u660E${agree === true ? "\u5DF2\u52FE" : "\u8FD8\u6CA1\u52FE"}\u3002`;
}
function uploadDisabledReason({ busy, uploading, pendingCount, agree }) {
  if (uploading === true) return "\u6B63\u5728\u4E0A\u4F20\u8FD9\u51E0\u4EFD\uFF0C\u4F20\u5B8C\u5C31\u80FD\u7EE7\u7EED\u3002";
  if (busy === true) return "\u6B63\u5728\u5FD9\u522B\u7684\uFF0C\u7B49\u5B83\u505C\u624B\u518D\u4F20\u3002";
  const waiting = Number.isSafeInteger(pendingCount) ? pendingCount : 0;
  const needFiles = waiting === 0;
  const needAgree = agree !== true;
  if (needFiles && needAgree) return "\u5148\u9009\u6750\u6599\u3001\u52FE\u4E0A\u58F0\u660E\uFF0C\u624D\u80FD\u4E0A\u4F20\u3002";
  if (needFiles) return "\u5148\u9009\u6750\u6599\uFF0C\u624D\u80FD\u4E0A\u4F20\u3002";
  if (needAgree) return "\u52FE\u4E0A\u4E0A\u9762\u7684\u58F0\u660E\uFF0C\u624D\u80FD\u4E0A\u4F20\u3002";
  return null;
}
async function readBytesOf(file) {
  if (file === null || file === void 0 || typeof file.arrayBuffer !== "function") return null;
  try {
    return new Uint8Array(await file.arrayBuffer());
  } catch {
    return null;
  }
}
function UploadArea(props) {
  const {
    meta,
    sources,
    converting,
    conversionStartedAt,
    events,
    errorText = null,
    onUpload,
    onConvert,
    onReplaceSource,
    onRemoveSource,
    busy,
    // 票 10：本机**真探到**了自动切分能力（Python + PyMuPDF）吗？由 `/textbook/settings`
    // 下发（`mineru-lib` 的探针）。⚠️ 缺省是 **false** —— 「探不到」必须落到「不许承诺会自动拆」
    // 那一档，写成 true 就等于给一句没人验过的承诺。
    autoSplit = false,
    // 票 `demo-channel-full/02`：演示书那一屏的「往下走」那颗键。缺省 `null` ＝ 不渲染。
    onDemoNext = null
  } = props;
  const demoNextVisible = meta?.demo !== true ? false : meta.phase === 1 && typeof onDemoNext === "function";
  const [pending, setPending] = (0, import_react6.useState)([]);
  const [uploading, setUploading] = (0, import_react6.useState)(false);
  const [error, setError] = (0, import_react6.useState)(null);
  const [agree, setAgree] = (0, import_react6.useState)(false);
  const [notice, setNotice] = (0, import_react6.useState)(null);
  const applyPicked = (judged) => {
    const rejected = judged.filter((one) => one.verdict.status !== MATERIAL_INTAKE.ACCEPTED);
    const accepted = judged.filter((one) => one.verdict.status === MATERIAL_INTAKE.ACCEPTED);
    if (rejected.length > 0) {
      setError(
        rejected.map(({ file, verdict }) => `\u300A${file.name}\u300B${verdict.message}`).join("\uFF1B")
      );
    }
    if (accepted.length === 0) return;
    setPending((prev) => {
      const seen = /* @__PURE__ */ new Set();
      const next = prev.filter(
        (item) => !accepted.some(({ file }) => file.name === item.name)
      );
      accepted.forEach(({ file }) => {
        if (seen.has(file.name)) return;
        seen.add(file.name);
        next.push({ name: file.name, file });
      });
      return next;
    });
  };
  const pick = (e) => {
    setError(null);
    setNotice(null);
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    const byName = files.map((file) => ({ file, verdict: judgeMaterialFileIntake({ name: file.name }) }));
    if (byName.every((one) => one.verdict.needsBytes === false)) {
      applyPicked(byName);
      return;
    }
    void (async () => {
      const judged = await Promise.all(byName.map(async ({ file, verdict }) => verdict.needsBytes === true ? { file, verdict: judgeMaterialFileIntake({ name: file.name, bytes: await readBytesOf(file) }) } : { file, verdict }));
      applyPicked(judged);
    })();
  };
  const uploadAll = async () => {
    if (pending.length === 0) {
      setError("\u8BF7\u5148\u9009\u62E9\u6750\u6599\u6587\u4EF6");
      return;
    }
    if (!agree) {
      setError("\u8BF7\u5148\u52FE\u9009\u6750\u6599\u58F0\u660E");
      return;
    }
    setUploading(true);
    setError(null);
    setNotice(null);
    const failed = [];
    const notes = [];
    for (const item of pending) {
      const verdict = judgeMaterialUploadSize({ name: item.name, size: item.file.size, autoSplit });
      if (verdict.blocked) {
        failed.push({
          item,
          message: verdict.message,
          retryable: false
        });
        continue;
      }
      if (verdict.message !== "") notes.push(`${item.name}\uFF1A${verdict.message}`);
      try {
        await onUpload(item.file, null, agree);
      } catch (err) {
        failed.push({
          item,
          message: String(err instanceof Error ? err.message : err),
          retryable: err?.retryable !== false
        });
      }
    }
    if (failed.length === 0) {
      setPending([]);
    } else {
      const failedNames = new Set(failed.map((f) => f.item.name));
      setPending((prev) => prev.filter((i) => failedNames.has(i.name)));
      const first = failed[0];
      const retryHint = first.retryable === false ? "" : "\uFF1B\u53EA\u4F1A\u91CD\u8BD5\u5931\u8D25\u7684\u90A3\u51E0\u4EFD";
      const anyRetryable = failed.some((f) => f.retryable !== false);
      setError(
        failed.length === 1 ? `\u4E0A\u4F20\u5931\u8D25\uFF1A${first.item.name}\uFF08${first.message}${retryHint}\uFF09` : `\u6709 ${failed.length} \u4EFD\u4E0A\u4F20\u5931\u8D25\uFF08\u5982 ${first.message}\uFF09${anyRetryable ? "\uFF1B\u53EA\u4F1A\u91CD\u8BD5\u5931\u8D25\u7684\u90A3\u51E0\u4EFD" : ""}`
      );
    }
    if (notes.length > 0) setNotice(notes.join("\n"));
    setUploading(false);
  };
  const conversionText = materialConversionActivityText(
    { converting: converting === true, updatedAt: conversionStartedAt },
    events
  );
  const cardFacts = uploadCardFacts({ sources, pending, agree });
  const disabledReason = uploadDisabledReason({
    busy,
    uploading,
    pendingCount: pending.length,
    agree
  });
  const offChannelNote = offChannelMaterialFormatNote();
  return (0, import_react6.createElement)(
    "div",
    { style: S.focus },
    // ⚠️ 出错这一段**排在①之前**：状态条那句「出错了，请看下面的提示」指的就是它，
    // 而 phase 1 的焦点主卡就是这张卡（错不到 `StatusCard` 去——见上方契约注释）。
    // 非 error 态 `errorText` 是 `null` ⇒ 整条不渲染，不上屏一个空框。
    errorText === null ? null : (0, import_react6.createElement)(
      "div",
      {
        style: {
          margin: "0 0 10px",
          padding: "8px 10px",
          borderRadius: "8px",
          border: "1px solid var(--dsw-alias-state-error-primary)"
        }
      },
      (0, import_react6.createElement)(
        "strong",
        { style: { color: "var(--dsw-alias-state-error-primary)" } },
        ERROR_HEADING
      ),
      (0, import_react6.createElement)("p", { style: { margin: "6px 0 0" } }, errorText),
      isTokenIssueOf(errorText) ? (0, import_react6.createElement)(
        "p",
        { style: { margin: "4px 0 0", fontSize: "13px", opacity: 0.9 } },
        TOKEN_HINT
      ) : null
    ),
    // 票 `ui-display-redesign/02`：卡头行（屏级问句＋派生事实句）是这一屏的第一块，
    // 排在「① 上传材料」之前；问句节点就地造（理由见 `UPLOAD_CARD_QUESTION` 上面那段）。
    (0, import_react6.createElement)(CardHead, {
      question: (0, import_react6.createElement)(
        "strong",
        { style: CARD_HEAD_QUESTION_STYLE },
        UPLOAD_CARD_QUESTION
      ),
      facts: cardFacts
    }),
    (0, import_react6.createElement)(
      "strong",
      { style: { fontSize: "13px" } },
      "\u2460 \u4E0A\u4F20\u6750\u6599\uFF08\u53EF\u4E00\u6B21\u9009\u591A\u4EFD\uFF09"
    ),
    // 票 `ui-display-redesign/02`：这条长说明默认**折成一行**（今天常显占首屏）——
    // 展开内容就是今天那一句，逐字不变（`materialRoleNote` 的两取值也没动）。
    (0, import_react6.createElement)(
      "details",
      { style: { margin: "4px 0 8px" } },
      (0, import_react6.createElement)(
        "summary",
        { style: { cursor: "pointer", fontSize: "12px", opacity: 0.7 } },
        UPLOAD_ROLE_FOLD_SUMMARY
      ),
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
        // 票 10（判定四③）：原句 76 字压到 90 字内——删掉与上方 📁 路径行重复的「见上方 📁 路径」
        // 与「都保存在里面」这类可从"文件夹＝书名"推出来的话。
        // 票 09：退役「教材 PDF／上传的 PDF」，数材料说「份」。
        // 票 `pre-gold-build/02`：这一屏不再有「角色」这一栏，那句「每份是什么角色由 AI 自动识别」
        // 随之退役——角色改由**探查段开头那一趟书级材料判定**产出（那时它才读得到材料内容）。
        // 票 `demo-channel-full/26`：这句的「由 AI …判定」对演示书是假话（那份判定由机器写，
        // 见 `view-rules.materialRoleNote` 的读数）⇒ 两取值。
        materialRoleNote(meta)
      )
    ),
    // 票 `ui-display-redesign/02`：**演示书的阶段一**那一块（「▶ 开始演示」＋说明）按 spec §2.2
    // 的块序摆在**这一屏最末**（第 17 块，材料缺口块之后）——实现见本卡返回值的末尾。
    (0, import_react6.createElement)("label", { style: S.label }, "\u9009\u62E9\u6750\u6599\uFF08\u53EF\u591A\u9009\uFF09"),
    (0, import_react6.createElement)("input", {
      type: "file",
      // ⚠️ 票 07：由 `MATERIAL_FORMATS` 派生（与**服务端那道受理闸门同一份常量**）。
      // 原来这里写死 `".pdf"`，用户连 docx 都选不到；写死与后端手抄的 `/\.pdf$/i`
      // 各改一处就会分叉（前端放行、后端拒收）。改名单时这一行自动跟随。
      accept: materialFormatAccept(),
      multiple: true,
      style: S.input,
      onChange: pick
    }),
    (0, import_react6.createElement)(
      "p",
      { style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
      materialFormatHint()
    ),
    // 票 `upload-formats/01`：「支持格式」下面另起一行，说清**云端通道不收、但有一条路**的那几档
    // （今天只有 epub）。为什么必须常显：`<input accept>` 本来就列不出 `.epub`（那是云端通道的
    // 事实），只靠「选到才提示」等于提示永远不出现——而票面「现象」那一句说的正是
    // 「只列白名单让人自己猜」。
    // ⚠️ 这一行取的是表里的 `hint`（短句：要转换、转成什么）；**完整出路**（含命令）是
    // `guidance`，由**选到它时**那条红字说。两处都从同一张表取，只是各取一格——⛔ 不在渲染里另写。
    offChannelNote === "" ? null : (0, import_react6.createElement)(
      "p",
      { style: { margin: "2px 0 0", fontSize: "12px", opacity: 0.7 } },
      offChannelNote
    ),
    // ⚠️ 票 `ui-display-redesign/02`（spec §2.2 第 8 块「已删」）：那句**格式标定**说明
    // （「已实测可用…其余 N 种未标定」）**不再上屏**——它那个函数与实测闭包判据都留着
    // （`test-material-format.mjs`），只是界面上不摆这一行。
    pending.length > 0 ? (0, import_react6.createElement)(
      "div",
      { style: { marginTop: "8px" } },
      (0, import_react6.createElement)(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "4px"
          }
        },
        (0, import_react6.createElement)(
          "span",
          { style: { fontSize: "12px", fontWeight: 600 } },
          `\u5F85\u4E0A\u4F20 ${pending.length} \u4EFD\uFF1A`
        )
      ),
      pending.map(
        (item) => (0, import_react6.createElement)(
          "div",
          {
            key: item.name,
            style: {
              display: "flex",
              gap: "8px",
              alignItems: "center",
              margin: "4px 0"
            }
          },
          (0, import_react6.createElement)(
            "span",
            {
              style: {
                flex: 1,
                fontSize: "12px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }
            },
            item.name
          )
        )
      )
    ) : null,
    // 票 10：说明与错是两件事——`notice`（不拦，只说）用中性色，`error`（拦）用错色。
    // 把「不拦但要说」的那几句混进红字里，用户会以为上传失败了。
    notice !== null ? (0, import_react6.createElement)(
      "p",
      { style: { margin: "6px 0 0", fontSize: "12px", whiteSpace: "pre-line", opacity: 0.85 } },
      `\u2139\uFE0F ${notice}`
    ) : null,
    error !== null ? (0, import_react6.createElement)("p", { style: S.error }, error) : null,
    // 票 `confirm-points-redesign-build/03`：**材料声明**（从建书屏搬到真正要上传的这一站）。
    // 位置：上传按钮**正上方**——它是那一颗按钮的前置，不是这一屏的装饰。
    (0, import_react6.createElement)(
      "label",
      { style: S.checkItem },
      (0, import_react6.createElement)("input", {
        type: "checkbox",
        checked: agree,
        onChange: (e) => {
          setError(null);
          setAgree(e.target.checked);
        }
      }),
      " \u6211\u786E\u8BA4\uFF1A\u53EA\u4E0A\u4F20\u6211\u6709\u6743\u4F7F\u7528\u7684\u6750\u6599\uFF1B\u9020\u51FA\u6765\u7684\u662F\u6559\u5B66\u53C2\u8003\uFF0CAI \u53EF\u80FD\u8BB2\u9519\uFF0C\u4F7F\u7528\u524D\u6211\u4F1A\u8BF7\u8001\u5E08/\u5BB6\u957F\u590D\u6838"
    ),
    (0, import_react6.createElement)(
      "div",
      {
        style: {
          marginTop: "8px",
          display: "flex",
          gap: "8px",
          alignItems: "center"
        }
      },
      (0, import_react6.createElement)(
        "button",
        {
          // 没勾声明时这颗键灰着（与 `uploadAll` 里那条校验同一件事的两面）。
          style: S.disabled({ ...S.bigBtn(true), padding: "8px 14px" }, busy || uploading || pending.length === 0 || !agree),
          onClick: uploadAll,
          disabled: busy || uploading || pending.length === 0 || !agree
        },
        pending.length > 0 ? `\u4E0A\u4F20\u8FD9 ${pending.length} \u4EFD` : "\u4E0A\u4F20"
      )
    ),
    // 票 `ui-display-redesign/02`：键灰着时理由**就在键旁边**（三种原因都有一句）；键可点时
    // 整条不渲染。唯一出口是 `uploadDisabledReason`（⛔ 不在渲染里再拼第二份措辞）。
    disabledReason === null ? null : (0, import_react6.createElement)(
      "p",
      { style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.8 } },
      disabledReason
    ),
    sources.length > 0 ? (0, import_react6.createElement)(
      "div",
      { style: { marginTop: "8px", fontSize: "12px", opacity: 0.85 } },
      (0, import_react6.createElement)(
        "div",
        { style: { margin: "0 0 4px" } },
        `\u5DF2\u4E0A\u4F20 ${sources.length} \u4EFD\uFF1A`
      ),
      sources.map(
        (source) => (0, import_react6.createElement)(
          "div",
          {
            key: source.file,
            style: { wordBreak: "break-all", margin: "2px 0" }
          },
          `${convertedIcon(source)} ${source.file}`
        )
      )
    ) : null,
    // 票 `ui-display-redesign/02`（spec §2.2 第 14 块）：主出口一行小字——这一屏只报状态，
    // 逐份的转换稿／原件去阶段页的材料清单看（⛔ 不在本屏新增那两颗入口，ADR-0034 的
    // 「材料清单主出口＝阶段页」照旧）。
    (0, import_react6.createElement)(
      "p",
      { style: { margin: "8px 0 0", fontSize: "12px", opacity: 0.75 } },
      UPLOAD_EXIT_NOTE
    ),
    sources.length > 0 ? (0, import_react6.createElement)(
      "div",
      { style: { marginTop: "10px" } },
      (0, import_react6.createElement)(
        "button",
        {
          style: S.disabled(S.bigBtn(true), busy || converting),
          onClick: onConvert,
          disabled: busy || converting
        },
        "\u2461 \u5F00\u59CB\u8F6C\u6362\uFF08\u673A\u5668\u81EA\u52A8\u8DD1\uFF09"
      ),
      converting ? (0, import_react6.createElement)(
        "p",
        { style: { margin: "8px 0 0", fontSize: "12px" } },
        `\u{1F916} ${conversionText}`
      ) : null
    ) : null,
    // 票 `mineru-formats/03`：材料不齐时书**停在这一步**（ADR-0028 决策 3），于是这一张
    // 卡片就是那个红的**唯一可行动出口**——每一份红源在这里有补传／删掉两条路。
    // 没有缺口时整块不渲染（不是渲染一块空的）。
    (0, import_react6.createElement)(MaterialGapList, {
      sources,
      busy,
      onReplaceSource,
      onRemoveSource,
      // 票 10：补传那颗选择器背后那道**按格式**的体积预检与上传卡**用同一个事实**
      // （`/textbook/settings` 的 `autoSplitAvailable` 经 `client-entry` 透传下来）。
      // 不透传的话它只能取缺省 false＝「探不到」，那句话会与上传卡那一屏不一致。
      autoSplit
    }),
    // 票 `ui-display-redesign/02`：**演示书的阶段一**那一块按 spec §2.2 的块序摆在**最末**
    // （第 17 块）。它是这一屏唯一属于演示通道的分叉，守卫与文案一个字未动（票
    // `demo-channel-full/02`）：只在演示书 ＋ 阶段一 ＋ 壳递了回调时出现。
    // ⛔ 它不叫「开始转换」：那会承诺一件这条通道有意不做的事。
    demoNextVisible ? (0, import_react6.createElement)(
      "div",
      {
        style: {
          margin: "10px 0",
          padding: "10px 12px",
          borderRadius: "10px",
          border: "1px solid var(--dsw-alias-border-l2)"
        }
      },
      (0, import_react6.createElement)(
        "div",
        { style: { fontSize: "13px", marginBottom: "8px", opacity: 0.85 } },
        "\u8FD9\u662F\u6F14\u793A\u4E66\uFF1A\u6750\u6599\u51C6\u5907\u5DF2\u5B8C\u6210\uFF08\u5C55\u793A\u6001\u2014\u2014\u6F14\u793A\u6A21\u5F0F\u4E0D\u771F\u505A\u8F6C\u6362\uFF0C\u4E5F\u4E0D\u82B1\u6A21\u578B\u989D\u5EA6\uFF09\u3002"
      ),
      (0, import_react6.createElement)(
        "button",
        {
          style: S.disabled(S.bigBtn(true), busy === true),
          disabled: busy === true,
          // 票 `auto-walkthrough/04`：关键键的语义钩子（D17；⛔ 不是 test id 全量体系）。
          "data-demo-start": "1",
          onClick: onDemoNext
        },
        "\u25B6 \u5F00\u59CB\u6F14\u793A\uFF08\u5F80\u4E0B\u8D70\uFF09"
      )
    ) : null
  );
}
var ERROR_CARD_QUESTION = "\u51FA\u4E86\u4EC0\u4E48\u4E8B\u3001\u4F60\u80FD\u505A\u4EC0\u4E48\uFF1F";
var ERROR_CARD_FACTS = "\u51FA\u9519\u505C\u5728\u8FD9\u4E00\u6B65\uFF1B\u4E66\u548C\u5DF2\u7ECF\u4E0A\u4F20\u7684\u6750\u6599\u90FD\u8FD8\u5728\u3002";
var NEEDS_CONFIG_CARD_QUESTION = "\u9700\u8981\u5148\u914D\u7F6E\u4EC0\u4E48\uFF1F";
var NEEDS_CONFIG_CARD_FACTS = "\u7F3A\u7684\u662F\u4E00\u9879\u914D\u7F6E\uFF1B\u914D\u597D\u70B9\u300C\u7EE7\u7EED\u300D\u5C31\u80FD\u5F80\u4E0B\u8D70\u3002";
var RUNNING_CARD_QUESTION = "\u73B0\u5728\u5728\u505A\u4EC0\u4E48\u3001\u7B49\u4E86\u591A\u4E45\uFF1F";
var statusCardView = defineCardView({
  card: "StatusCard",
  fromBook: [
    "meta",
    "lastEvent",
    "events",
    // 票 `audit-state-regression/01`：阶段五「已完成 N/M 章」与章节卡、交付闸读**同一份**
    // 服务端派生 `chapterStatus[].done`（它含检查记录新鲜度）——缺了它这里就会退回本地账本
    // 口径，正文返工后仍报「十章已完成」的假信号正是这么来的。
    "chapterStatus",
    "needsConfig",
    "onResume",
    "busy",
    "pendingStageLabel",
    "progressDetail",
    "stall",
    "onDeleteConfirm"
  ],
  required: ["meta", "onResume"]
});
function StatusCard(props) {
  const {
    meta,
    lastEvent,
    events,
    // 票 `audit-state-regression/01`：阶段五计数的**主来源**——与章节卡同读服务端
    // `chapterStatus[].done`（含检查记录新鲜度）。缺了它才退回本地账本口径。
    chapterStatus,
    needsConfig,
    onResume,
    busy,
    pendingStageLabel,
    progressDetail,
    // 票 stale-detection/01：状态卡不再自己算一遍停顿时长、也不再出黄色警告框与那颗按钮——
    // 这一屏唯一的出口是活性行（每个阶段都在，而状态卡只在兜底那一支才在）。
    // 它消费的**就是活性行那一份判定对象**（`src/ui/rules.js` 的 `deriveStallJudgment`）：
    // 票 `ui-display-redesign/20` 起卡内计时行只报时长（「⏱ 这一步已进行 X」），
    // 「我正在做」那半句只留状态条一处。
    stall,
    onDeleteConfirm
  } = props;
  const [, tick] = (0, import_react6.useState)(0);
  (0, import_react6.useEffect)(() => {
    const timer = setInterval(() => tick((n) => n + 1), 1e3);
    return () => clearInterval(timer);
  }, []);
  if (meta.status === "error") {
    const humanError = humanErrorOf(meta, lastEvent?.data?.message);
    const isTokenIssue = isTokenIssueOf(humanError);
    return (0, import_react6.createElement)(
      "div",
      { style: { ...S.focus, borderColor: "var(--dsw-alias-state-error-primary)" } },
      // 票 `ui-display-redesign/20`：卡头问句＋事实句在红标题**上面**（红标题保留：判据按它找）。
      (0, import_react6.createElement)(CardHead, {
        question: (0, import_react6.createElement)(
          "strong",
          { style: CARD_HEAD_QUESTION_STYLE },
          ERROR_CARD_QUESTION
        ),
        facts: ERROR_CARD_FACTS
      }),
      (0, import_react6.createElement)(
        "strong",
        { style: { color: "var(--dsw-alias-state-error-primary)" } },
        ERROR_HEADING
      ),
      (0, import_react6.createElement)("p", { style: { margin: "6px 0" } }, humanError),
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "6px 0 0", fontSize: "13px", opacity: 0.9 } },
        // 票 10（判定一 #9）：两条上限是**两件事**——500MB 是单份上传体积上限
        // （domain-rules.MAX_UPLOAD_BYTES，前后端共用同一常量），200 页是 MinerU 单次解析的页数上限。
        // 原来这句只说页数、不说体积，用户按 200 页拆完仍可能撞 500MB。这里一并说清。
        // 票 09：原件不再被叫成「教材 PDF」，材料按份数说；「换一本更薄的书」
        // 里的「本」是数**书**，保留（CONTEXT.md「量词『份』」）。
        "\u4F60\u53EF\u4EE5\uFF1A\u628A\u8FD9\u4EFD\u6750\u6599\u62C6\u6210\u51E0\u4EFD\uFF08\u6BCF\u4EFD <200 \u9875\u3001<500MB\uFF09\u540E\u5206\u522B\u4E0A\u4F20\uFF0C\u6216\u6362\u4E00\u672C\u66F4\u8584\u7684\u4E66\uFF0C\u6216\u5220\u6389\u8FD9\u672C\u4E66\u91CD\u65B0\u5F00\u59CB\u3002"
      ),
      isTokenIssue ? (0, import_react6.createElement)(
        "p",
        { style: { margin: "4px 0 0", fontSize: "13px", opacity: 0.9 } },
        TOKEN_HINT
      ) : null,
      (0, import_react6.createElement)(
        "button",
        { style: S.disabled(S.bigBtn(true), busy), onClick: onResume, disabled: busy },
        // 票 10（判定一 #8）：原来这里说「▶️ 让 AI 接着干」、活性行说「[戳一下 AI]」、
        // 状态卡说「🔁 让 AI 接着干」——同一动作三种说法，统一成这一句。
        "\u{1F501} \u8BA9 AI \u63A5\u7740\u5E72"
      ),
      // F28 → 票 `ui-display-redesign/20`：上传错了给「删书重来」入口。原来是两步确认
      // （第一态纯展开、确认态才删）；本票改**一步**——点一下直接发 `book-delete`，旧书进
      // 回收站可找回（F28 的两步确认被本票取代，spec §2.16 第 9 块）。仅在父级传入删除
      // 回调时显示；忙时置灰（否则会和正在飞的那一笔抢同一本书）。
      typeof onDeleteConfirm === "function" ? (0, import_react6.createElement)(
        "div",
        {
          style: {
            marginTop: "8px",
            paddingTop: "8px",
            borderTop: "1px dashed var(--dsw-alias-border-l2)"
          }
        },
        (0, import_react6.createElement)(
          "p",
          { style: { margin: "0 0 6px", fontSize: "13px", opacity: 0.9 } },
          "\u4E0A\u4F20\u9519\u4E86\uFF1F\u53EF\u4EE5\u5220\u6389\u8FD9\u672C\u4E66\u91CD\u65B0\u5EFA\u4E00\u672C\uFF08\u65E7\u4E66\u8FDB\u56DE\u6536\u7AD9\uFF09\uFF0C\u56DE\u5230\u5411\u5BFC\u9A6C\u4E0A\u5C31\u80FD\u5F00\u59CB\u65B0\u4E66\u3002"
        ),
        (0, import_react6.createElement)(
          "button",
          {
            style: S.disabled(
              {
                ...S.smallLink,
                color: "var(--dsw-alias-state-error-primary)"
              },
              busy
            ),
            onClick: onDeleteConfirm,
            disabled: busy
          },
          "\u{1F5D1} \u5220\u9664\u8FD9\u672C\u4E66\u91CD\u65B0\u5EFA"
        )
      ) : null
    );
  }
  if (meta.status === "needs-config") {
    return (0, import_react6.createElement)(
      "div",
      { style: { ...S.focus, borderColor: "var(--dsw-alias-state-error-primary)" } },
      // 票 `ui-display-redesign/20`：卡头问句＋事实句在红标题上面；红标题保留（判据按它找）。
      (0, import_react6.createElement)(CardHead, {
        question: (0, import_react6.createElement)(
          "strong",
          { style: CARD_HEAD_QUESTION_STYLE },
          NEEDS_CONFIG_CARD_QUESTION
        ),
        facts: NEEDS_CONFIG_CARD_FACTS
      }),
      (0, import_react6.createElement)(
        "strong",
        { style: { color: "var(--dsw-alias-state-error-primary)" } },
        "\u{1F511} \u9700\u8981\u5148\u914D\u7F6E"
      ),
      (0, import_react6.createElement)("p", { style: { margin: "6px 0" } }, needsConfig),
      (0, import_react6.createElement)(
        "button",
        { style: S.disabled(S.bigBtn(true), busy), onClick: onResume, disabled: busy },
        "\u6211\u914D\u597D\u4E86\uFF0C\u7EE7\u7EED"
      )
    );
  }
  let label = "";
  let extra = "";
  if (typeof pendingStageLabel === "string" && pendingStageLabel !== "") {
    label = pendingStageLabel;
    extra = typeof progressDetail === "string" ? progressDetail : "";
  } else if (lastEvent?.type === "textbook/agent-start" || lastEvent?.type === "textbook/mineru-progress") {
    const data = lastEvent.data ?? {};
    const human = stageLabelHuman(data.label);
    if (human !== "") label = human;
    else if (data.stage !== void 0 && data.stage !== null && data.stage !== "") {
      label = data.file !== void 0 && data.file !== null && data.file !== "" ? `${data.file}\uFF1A${data.stage}` : data.stage;
    }
  }
  const phase = meta.phase ?? 1;
  const phaseDesc = {
    2: "\u8BFB\u6750\u6599\u6311\u91CD\u70B9\uFF1AAI \u6B63\u5728\u901A\u8BFB\u4F60\u7684\u6559\u6750\uFF08\u6750\u6599\u591A\u65F6\u4F1A\u6D3E\u5C0F\u52A9\u624B\u5206\u5934\u8BFB\uFF09\uFF0C\u6574\u7406\u6210\u6750\u6599\u7D22\u5F15",
    3: "\u62CD\u677F\u5B9A\u65B9\u6848\uFF1AAI \u6B63\u5728\u8D77\u8349\u8BBE\u8BA1\u65B9\u6848\uFF08\u5DF2\u7ECF\u62CD\u8FC7\u677F\u7684\u4F1A\u81EA\u52A8\u8DF3\u8FC7\uFF09",
    4: `\u6700\u4F73\u8303\u4F8B\u7AE0\uFF1AAI \u6B63\u5728\u5199\u7B2C ${goldChapterNo(meta)} \u7AE0\u7ED9\u4F60\u770B\u6548\u679C`,
    5: "\u5199\u5B8C\u6574\u672C\uFF1A\u5C0F\u52A9\u624B\u6267\u7B14 + \u5C0F\u52A9\u624B\u68C0\u67E5 + AI \u590D\u6838\uFF0C\u9010\u7AE0\u63A8\u8FDB",
    6: "\u6700\u540E\u68C0\u67E5\uFF1AAI \u4EB2\u81EA\u505A\u6700\u540E\u68C0\u67E5 + \u673A\u5668\u515C\u5E95"
  }[phase];
  let chapterProgress = null;
  if (phase === 5) {
    const chapters = meta.outline?.chapters ?? [];
    const total = chapters.length;
    if (total > 0) {
      const doneSet = deriveDoneSet(events ?? [], goldChapterNo(meta));
      const reviews = meta.pendingReviews ?? [];
      const done = chapters.filter(
        (_chapter, index) => chapterIsDone(chapterStatus, doneSet, reviews, index + 1)
      ).length;
      chapterProgress = { done: Math.min(done, total), total };
    }
  }
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
  return (0, import_react6.createElement)(
    "div",
    { style: S.focus },
    // 票 `ui-display-redesign/20`：running 卡头**只放问句、不放事实句**（spec §2.18 第 3 块）。
    // 事实句在这里会与 progressDetail／计时行撞车：那两样全屏各只许出现 1 处。
    (0, import_react6.createElement)(CardHead, {
      question: (0, import_react6.createElement)(
        "strong",
        { style: CARD_HEAD_QUESTION_STYLE },
        RUNNING_CARD_QUESTION
      )
    }),
    (0, import_react6.createElement)(
      "strong",
      { style: { fontSize: "13px" } },
      `\u23F3 ${label || "\u51C6\u5907\u4E2D\u2026"}`
    ),
    extra !== "" ? (0, import_react6.createElement)(
      "p",
      { style: { margin: "6px 0 0", opacity: 0.9 } },
      `\u23F3 ${extra}`
    ) : null,
    phaseDesc !== void 0 ? (0, import_react6.createElement)(
      "p",
      { style: { margin: "6px 0 0", opacity: 0.85 } },
      `\u{1F4CC} ${phaseDesc}`
    ) : null,
    chapterProgress !== null ? (0, import_react6.createElement)(
      "div",
      { style: { marginTop: "10px" } },
      (0, import_react6.createElement)(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
            marginBottom: "4px"
          }
        },
        (0, import_react6.createElement)("span", { style: { opacity: 0.8 } }, "\u7AE0\u8282\u5199\u4F5C\u8FDB\u5EA6"),
        (0, import_react6.createElement)(
          "span",
          { style: { opacity: 0.8 } },
          `\u5DF2\u5B8C\u6210 ${chapterProgress.done}/${chapterProgress.total} \u7AE0`
        )
      ),
      (0, import_react6.createElement)(
        "div",
        {
          style: {
            height: "8px",
            borderRadius: "4px",
            background: "var(--dsw-alias-border-l2)",
            overflow: "hidden"
          }
        },
        (0, import_react6.createElement)("div", {
          style: {
            height: "100%",
            width: `${Math.round(chapterProgress.done / chapterProgress.total * 100)}%`,
            background: "var(--dsw-alias-state-business-primary)",
            borderRadius: "4px"
            // 判据 7「少动」：宽度过渡已删（票 05；原缺省 ease 先慢后快）。
          }
        })
      )
    ) : null,
    (0, import_react6.createElement)(
      "p",
      {
        style: {
          margin: "6px 0 0",
          fontSize: "12px",
          opacity: stalled ? 0.7 : 0.85
        }
      },
      // 票 stale-detection/01：这一行照常显示（计时只显示一行），判停时只报时长、不下诊断；
      // 「好一会儿没动静了」那句话与那颗「从断点继续」的按钮归顶上的活性行。
      // 票 `ui-display-redesign/20`：计时行**不带**「我正在做 · 」前缀——那句话全屏只留
      // 状态条一处；判停与不判停都只说时长（判停时活性行另说「N 分钟没动静了」）。
      `\u23F1 \u8FD9\u4E00\u6B65\u5DF2\u8FDB\u884C ${humanDuration(stepElapsedMs)}`
    )
  );
}
var DELIVERY_CARD_QUESTION = "\u4E66\u505A\u597D\u4E86\uFF0C\u63A5\u4E0B\u6765\u600E\u4E48\u7528\uFF1F";
var DELIVERY_READINGS_PENDING = "\u4E66\u7684\u7BC7\u5E45\u8BFB\u6570\u8FD8\u6CA1\u5230\u3002";
var AI_REPORT_FOLD_SUMMARY = "\u25B8 \u5C55\u5F00\u5B8C\u6574\u62A5\u544A";
function aiReportSummary(report) {
  if (typeof report !== "string" || report.trim() === "") return null;
  for (const block of report.replace(/\r\n?/g, "\n").split(/\n[ \t]*\n/)) {
    const line = block.split("\n").map((one) => one.trim()).find((one) => one !== "");
    if (line === void 0) continue;
    const text = line.replace(/^#{1,6}\s+/, "").replace(/^[>*+-]\s+/, "").replace(/\*\*/g, "").trim();
    if (text !== "") return text;
  }
  return null;
}
var deliveryCardView = defineCardView({
  card: "DeliveryCard",
  // 票 `ui-display-redesign/10`：09 的取数口要的两个**既有袋键**（⛔ 不新增袋键；
  // `knowledgeMapText`／`fetchText` 早就在 `CARD_BOOK_KEYS` 里，只是这张卡以前不取）。
  fromBook: ["downloadHref", "checks", "onPreview", "busy", "meta", "aiReport", "styleNotes", "knowledgeMapText", "fetchText"],
  required: ["downloadHref", "onPreview", "meta"]
});
function DeliveryCard(props) {
  const {
    // 票 03：下载地址的拼装归 `ui/artifact-read.js`（`downloadHref`），本卡只给一个 `rel`。
    // `project` / `session` 两个身份 prop 随之退休——它们原先**只**被用于下面那一条 href。
    downloadHref,
    checks,
    onPreview,
    busy,
    meta,
    aiReport,
    styleNotes,
    // 票 `ui-display-redesign/10`：09 那个取数口要的两个**既有袋键**（合并件原文 ＋ 产物读取）。
    // ⛔ 不是新增袋键：`knowledgeMapText`／`fetchText` 早就在 `CARD_BOOK_KEYS` 里，只是这张卡以前不取。
    knowledgeMapText = null,
    fetchText = null
  } = props;
  const bookName = (meta?.name ?? "").trim() || "BOOK";
  const readings = useBookReadings({ meta, knowledgeMapText, fetchText });
  const facts = bookReadingsFactSentence(readings) ?? DELIVERY_READINGS_PENDING;
  const [copied, setCopied] = (0, import_react6.useState)(false);
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
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(done, fallback);
    } else {
      fallback();
    }
  };
  return (0, import_react6.createElement)(
    "div",
    { style: S.focus },
    // 票 `ui-display-redesign/10`：卡头行（屏级问句＋09 读数事实句）放在第一块，排 `🎉` 标题之前。
    (0, import_react6.createElement)(CardHead, {
      question: (0, import_react6.createElement)(
        "strong",
        { style: CARD_HEAD_QUESTION_STYLE },
        DELIVERY_CARD_QUESTION
      ),
      facts
    }),
    (0, import_react6.createElement)("strong", { style: { fontSize: "13px" } }, "\u{1F389} \u4E66\u505A\u597D\u4E86\uFF01"),
    // 票 `ui-display-redesign/10`（spec §2.11 第 4 块）：**成品入口在标题下**（原先埋在卡尾）。
    (0, import_react6.createElement)(
      "div",
      { style: { display: "flex", gap: "10px", margin: "10px 0" } },
      (0, import_react6.createElement)(
        "button",
        // 票 03：预览改成在 DSH 右栏打开成品——卡片里不再灌整本 <pre>，故没有「收起」态。
        {
          style: S.disabled(S.ghostBtn(false), busy),
          onClick: onPreview,
          disabled: busy
        },
        // 票 10（判定一 #13）：与终检认可卡统一——同一份 `工作区/book.md`，名字用产物词表的
        // 「成书」（票 05），动词只有「打开」。
        "\u{1F440} \u6253\u5F00\u6210\u4E66"
      ),
      (0, import_react6.createElement)(
        "a",
        {
          style: {
            ...S.bigBtn(true),
            textDecoration: "none",
            display: "inline-block"
          },
          // 票 03：地址由 `ui/artifact-read.js` 拼（`/textbook/download`）。
          // ⚠️ 「导航 vs 读取」是**两件不同的事**：这里是 `<a href>`——浏览器导航，**没有** `res.ok`
          // 检查、**不产生**错误条，下载失败由浏览器自己那一屏负责。别顺手给它补一套 fetch 语义。
          // 「无当前书」时 `downloadHref` 返回 null ⇒ 不渲染那颗下载键（这一支在生产里走不到：
          // 本卡只在 `case "delivered"` 渲染，而那要求 `meta.status === "delivered"` ⇒ 有书）。
          href: downloadHref("\u5DE5\u4F5C\u533A/book.md") ?? null
        },
        `\u2B07\uFE0F \u4E0B\u8F7D\u300A${bookName}\u300B.md`
      )
    ),
    // 票 `ui-display-redesign/10`（spec §2.11 第 5 块）：全书读数（章数／字数／知识点）；
    // ⛔ **没有件数、没有对账**（书只有一本；工作文件对账归站 11 的「文件对账」）。
    readings.chapters === null ? null : (0, import_react6.createElement)(
      "div",
      {
        style: {
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          margin: "0 0 8px",
          fontSize: "13px"
        }
      },
      (0, import_react6.createElement)("span", null, (0, import_react6.createElement)("strong", null, String(readings.chapters)), " \u7AE0"),
      (0, import_react6.createElement)("span", null, (0, import_react6.createElement)("strong", null, hanziReadingText(readings.hanzi))),
      (0, import_react6.createElement)(
        "span",
        null,
        (0, import_react6.createElement)("strong", null, knowledgePointsReadingText(readings.knowledgePoints))
      )
    ),
    // 怎么用（spec §2.11 第 7 块；文案一个字不动）。
    (0, import_react6.createElement)(
      "div",
      { style: { margin: "8px 0 0", opacity: 0.8 } },
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "0 0 4px", fontWeight: 600 } },
        "\u{1F4A1} \u8FD9\u672C\u4E66\u600E\u4E48\u7528"
      ),
      (0, import_react6.createElement)(
        "div",
        { style: { display: "flex", margin: "0 0 4px" } },
        (0, import_react6.createElement)(
          "span",
          {
            style: {
              flexShrink: 0,
              width: "112px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline"
            }
          },
          (0, import_react6.createElement)("span", null, "\u7ED9 AI \u8001\u5E08\u4E0A\u8BFE"),
          (0, import_react6.createElement)("span", null, "\u2192")
        ),
        (0, import_react6.createElement)(
          "span",
          { style: { minWidth: 0 } },
          `\u628A\u4E0B\u8F7D\u7684\u300A${bookName}\u300B.md \u4EA4\u7ED9`,
          (0, import_react6.createElement)(
            "a",
            {
              href: "https://www.socratopia.app/r/SCR-FEJXMQ",
              target: "_blank",
              rel: "noopener noreferrer",
              style: {
                color: "var(--dsw-alias-state-business-primary)",
                textDecoration: "underline"
              }
            },
            "\u3010\u7834\u5377\u3011"
          ),
          "\u5F53\u6559\u6750\u6765\u5B66\u3002\u3010\u5EFA\u8BAE\u3011"
        )
      ),
      (0, import_react6.createElement)(
        "div",
        { style: { display: "flex", margin: "0 0 4px" } },
        (0, import_react6.createElement)(
          "span",
          {
            style: {
              flexShrink: 0,
              width: "112px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline"
            }
          },
          (0, import_react6.createElement)("span", null, "\u7ED9\u4EBA\u8BFB"),
          (0, import_react6.createElement)("span", null, "\u2192")
        ),
        (0, import_react6.createElement)(
          "span",
          { style: { minWidth: 0 } },
          // 票 10（判定四①）：卡上那句已经说了「仍建议先让老师/家长复核一遍再用」，
          // 这一行再说一遍就是同屏两行同话——只留「直接阅读或打印」。
          "\u76F4\u63A5\u9605\u8BFB\u6216\u6253\u5370\u3002"
        )
      )
    ),
    // 复核提示（spec §2.11 第 8 块）。
    (0, import_react6.createElement)(
      "p",
      { style: { margin: "8px 0 0", fontSize: "12px", opacity: 0.75 } },
      "AI \u4EB2\u624B\u505A\u5B8C\u6700\u540E\u68C0\u67E5\uFF0C\u673A\u5668\u4E5F\u515C\u5E95\u9A8C\u8FC7\uFF1B\u4ECD\u5EFA\u8BAE\u5148\u8BA9\u8001\u5E08/\u5BB6\u957F\u590D\u6838\u4E00\u904D\u518D\u7528\u3002"
    ),
    // AI 报告：交付页**默认打开**（spec §2.11 第 9 块；不折——折的是站 11 那张卡）。
    aiReport !== null && aiReport !== void 0 && aiReport !== "" ? (0, import_react6.createElement)(
      "div",
      {
        style: {
          margin: "10px 0",
          padding: "8px 10px",
          background: "var(--dsw-alias-state-business-tertiary)",
          borderRadius: "8px",
          fontSize: "12px"
        }
      },
      (0, import_react6.createElement)("strong", null, "\u{1F916} AI \u68C0\u67E5\u8BF4\u7684\uFF1A"),
      // 报告正文那一块：它是**连续正文**，走**正文出口**（票 `ui-systematic-fixes/01`）
      // ——md 正文经 `exploreReportBlocks` 排成块（`# `/`**`/`- ` 不再原样上屏）。
      // ⚠️ 容器这一层仍套工作台唯一那条量宽上限（票 `walkthrough-fixes/17`）：
      // 出口吐出来的标题支继承的是这一层的字号，所以这里连 `fontSize` 一起给成正文档
      // （14px）——`36em` 要是「正文自己的 36em」，不是容器 12px 的。
      // **卡盒宽度一点不动**（票 16 的「工作台＝输入框」那条式子照旧）。
      (0, import_react6.createElement)(
        "div",
        {
          style: {
            margin: "4px 0 0",
            fontSize: "13px",
            maxWidth: BODY_MEASURE_MAX_WIDTH
          }
        },
        ...bodyOf(aiReport, BODY_KIND_MARKDOWN)
      )
    ) : null,
    // 机器检查：交付页**默认打开**（可收）——spec §2.11 第 9 块。
    (0, import_react6.createElement)(MachineChecks, { checks, openByDefault: true }),
    // 风格线：默认打开（有条件才出现）。
    (styleNotes ?? []).length > 0 ? (0, import_react6.createElement)(
      "div",
      {
        style: {
          margin: "10px 0",
          padding: "8px 10px",
          borderRadius: "8px",
          border: "1px solid var(--dsw-alias-border-l2)"
        }
      },
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontWeight: 600 } },
        "\u{1F3A8} \u4F60\u7684\u98CE\u683C\u7EBF\u6761\u6761\u6709\u7740\u843D"
      ),
      ...(styleNotes ?? []).map(
        (note, index) => (0, import_react6.createElement)(
          "div",
          {
            key: note.id ?? index,
            style: { fontSize: "12px", margin: "3px 0" }
          },
          `${note.status === "superseded" ? "\xB7 \uFF08\u5DF2\u6536\u56DE\uFF09" : note.status === "conflict" ? "\xB7 \uFF08\u4E0E\u8BBE\u8BA1\u51B2\u7A81\uFF0C\u7406\u7531\u89C1\u5907\u6CE8\uFF09" : "\xB7 "}${note.text}`,
          note.note ? (0, import_react6.createElement)(
            "span",
            { style: { opacity: 0.6 } },
            ` -- ${note.note}`
          ) : null
        )
      )
    ) : null,
    // 邀请码（spec §2.11 第 10 块）：常显、**最底**、文案一个字不动。
    (0, import_react6.createElement)(
      "p",
      { style: { margin: "10px 0 0" } },
      "\u5982\u679C\u672C\u9879\u76EE\u5BF9\u4F60\u6709\u5E2E\u52A9\uFF0C\u6B22\u8FCE\u586B\u5199\u9080\u8BF7\u7801\uFF1A",
      (0, import_react6.createElement)(
        "span",
        {
          onClick: (e) => copyInvite(e, "SCR-FEJXMQ"),
          title: copied ? "\u5DF2\u590D\u5236" : "\u70B9\u51FB\u590D\u5236\u9080\u8BF7\u7801",
          style: {
            background: "var(--dsw-alias-state-business-tertiary)",
            borderRadius: "4px",
            padding: "1px 6px",
            letterSpacing: "0.5px",
            cursor: "pointer",
            userSelect: "all",
            color: "var(--dsw-alias-state-business-primary)"
          }
        },
        copied ? "\u2713 \u5DF2\u590D\u5236" : "SCR-FEJXMQ"
      ),
      "\uFF0C\u53EF\u514D\u8D39\u9886\u53D6 100 \u4E07 tokens\uFF0C\u5B98\u65B9\u9020\u4E66\u5168\u573A\u514D\u8D39\u5B66\uFF08\u7B2C\u4E09\u65B9\u6D3B\u52A8\uFF0C\u4EE5\u5BF9\u65B9\u89C4\u5219\u4E3A\u51C6\uFF09\u3002"
    )
  );
}
var finalApprovalCardView = defineCardView({
  card: "FinalApprovalCard",
  fromBook: ["checks", "onPreview", "busy", "aiReport", "styleNotes", "onApprove", "onReject", "meta", "shapeReport"],
  required: ["onPreview", "onApprove", "onReject"]
});
function finalApprovalFacts({ checks, shapeReport, aiReport } = {}) {
  const list = Array.isArray(checks) ? checks : [];
  const failed = list.filter(checkBlocksDelivery).length;
  const warned = list.filter((check) => check.ok === true && check.warn === true).length;
  const skipped = list.filter((check) => check.state === "skipped").length;
  const notChecked = list.filter((check) => checkStateIsNonBlocking(check.state) && check.state !== "skipped").length;
  const machine = list.length === 0 ? "\u673A\u5668\u68C0\u67E5\u7ED3\u679C\u8FD8\u6CA1\u5230" : failed === 0 && warned === 0 && skipped === 0 && notChecked === 0 ? `${list.length} \u9879\u673A\u5668\u68C0\u67E5\u5168\u8FC7` : `\u673A\u5668\u68C0\u67E5 ${list.length} \u9879\u91CC\u6709\u9700\u8981\u4F60\u770B\u7684`;
  const missingKnown = Array.isArray(shapeReport?.missing);
  const missing = missingKnown ? shapeReport.missing.length : null;
  const files = shapeReport === null || shapeReport === void 0 ? "\u6CA1\u6709\u6587\u4EF6\u5BF9\u8D26\u6E05\u5355" : missingKnown === false ? "\u6587\u4EF6\u5BF9\u8D26\u8BFB\u6570\u4E0D\u53EF\u7528" : missing > 0 ? `\u8FD8\u7F3A ${missing} \u4EF6\u5DE5\u4F5C\u6587\u4EF6` : "\u6CA1\u6709\u7F3A\u4EF6";
  const report = typeof aiReport === "string" && aiReport !== "" ? "AI \u62A5\u544A 1 \u4EFD" : "\u8FD8\u6CA1\u6709 AI \u62A5\u544A";
  return `${machine}\uFF0C${files}\uFF0C${report}\u3002`;
}
function FinalApprovalCard(props) {
  const {
    checks,
    onPreview,
    busy,
    aiReport,
    styleNotes,
    onApprove,
    onReject,
    meta,
    // 票 `demo-channel-full/05`：**文件对账**（`/textbook/process` 的 `shape`，随书级只读数据下发）。
    // 票 `ui-display-redesign/10`：有清单就**常显一行**（没缺件印「没缺」）；没有清单（null）才不摆。
    shapeReport = null
  } = props;
  const shapeMissingKnown = Array.isArray(shapeReport?.missing);
  const shapeMissing = shapeMissingKnown ? shapeReport.missing : [];
  const cardFacts = finalApprovalFacts({ checks, shapeReport, aiReport });
  const aiSummary = aiReportSummary(aiReport);
  const redoRows = finalRedoRows(meta);
  const [note, setNote] = (0, import_react6.useState)("");
  const noteRef = (0, import_react6.useRef)(null);
  const [needNote, setNeedNote] = (0, import_react6.useState)(false);
  return (0, import_react6.createElement)(
    "div",
    { style: S.focus },
    // 票 `ui-display-redesign/10`：卡头行（存量问句 `DECISION_QUESTION.final` ＋派生事实句）
    // 是这一屏第一块，排在 `🛡️` 标题之前。问句节点就地造（理由同 `UPLOAD_CARD_QUESTION` 那段）。
    (0, import_react6.createElement)(CardHead, {
      question: (0, import_react6.createElement)(
        "strong",
        { style: CARD_HEAD_QUESTION_STYLE },
        DECISION_QUESTION.final
      ),
      facts: cardFacts
    }),
    (0, import_react6.createElement)("strong", { style: { fontSize: "13px" } }, "\u{1F6E1}\uFE0F \u6700\u540E\u68C0\u67E5\u5B8C\u6210\uFF0C\u7B49\u4F60\u5BF9\u6574\u672C\u4E66\u628A\u5173"),
    aiReport !== null && aiReport !== void 0 && aiReport !== "" ? (0, import_react6.createElement)(
      "div",
      {
        style: {
          margin: "10px 0",
          padding: "8px 10px",
          background: "var(--dsw-alias-state-business-tertiary)",
          borderRadius: "8px",
          fontSize: "12px"
        }
      },
      (0, import_react6.createElement)("strong", null, "\u{1F916} AI \u68C0\u67E5\u8BF4\u7684\uFF1A"),
      // 票 `ui-display-redesign/10`（spec §2.10 第 4 块）：**摘要〔首〕＋全文〔折〕**。
      // 摘要＝报告第一段（`aiReportSummary` 的唯一口径）；全文收进默认折的 `<details>`，
      // 展开仍是原来那份**正文出口**排版（`bodyOf`，⛔ 卡里不另写第二份渲染）。
      aiSummary === null ? null : (0, import_react6.createElement)(
        "p",
        { style: { margin: "4px 0 0", fontSize: "13px", lineHeight: 1.6 } },
        aiSummary
      ),
      (0, import_react6.createElement)(
        "details",
        { style: { margin: "6px 0 0" } },
        (0, import_react6.createElement)(
          "summary",
          { style: { cursor: "pointer", fontSize: "12px", opacity: 0.75 } },
          AI_REPORT_FOLD_SUMMARY
        ),
        (0, import_react6.createElement)(
          "div",
          {
            style: {
              margin: "4px 0 0",
              fontSize: "13px",
              maxWidth: BODY_MEASURE_MAX_WIDTH
            }
          },
          ...bodyOf(aiReport, BODY_KIND_MARKDOWN)
        )
      )
    ) : null,
    // 票 `demo-flow-fidelity/06`（票 01 Q5＝乙：卡上明写差在哪一块）：
    // ⚠️ **票 `demo-channel-full/08` 起演示书在这张卡上只比真书少一块**——机器检查跑不满真书后半那些项
    // （⚠️ 票 `demo-channel-full/04` 起「进度账本」那一项**也真跑了**，所以那句提示里的项名是
    // **从这一屏真跑了的清单现算**的：⛔ 这里不抄一份数、也不再说「前 N 项」）；
    // 「没有 AI 检查报告」与「没有那五份分查／汇总件指针」那两块**已经补上了**（同一支终检支产），
    // 所以那句提示里原来结尾的「并附一份 AI 检查报告」也一并删了（留着就是**说假话**）。
    // 句子的出处只此一处（`view-rules.demoQualityChecksNote()`，阶段页那块调
    // 同一个函数），演示与否只看 `meta.demo`（`isDemoBook`），**不拿检查条数反推**
    // ——递进去的 `checks` 只用来叙述「这一屏真的列了几项」（票 06 收口，2026-10-08）。
    // ⚠️ 它必须留在下面三键那一排**之前**：票 24 的滚动判据以「卡的最后一行是那颗定案键」
    // 为承重前提（`test-layout-anchors.mjs` 源码级钉着这个顺序）。
    isDemoBook(meta) ? (0, import_react6.createElement)(
      "p",
      { style: { margin: "8px 0 0", fontSize: "12px", opacity: 0.75 } },
      demoQualityChecksNote(checks)
    ) : null,
    // 票 26：机器检查清单（失败项显示 ❌，票 20 成果）。原票 20 的修复按钮已收——
    // 没过时不走这卡，指令由机器自动随 issues 送回主 AI；自由文本驳回（onReject）照旧。
    (0, import_react6.createElement)(MachineChecks, { checks }),
    // 票 `demo-channel-full/05`：**文件对账**那一块——「该有 N 件工作文件」（`工作区/产物清单.json`）
    // 与「盘上 M 件」（扫盘登记）的对照。
    // ⚠️ **只列缺件，⛔ 不列「多出」那一半**：演练实测 `工作区/方案/`（三次设计关卡的提案）
    // **压根没进**生产那份产物族表 ⇒ 每本写过提案的书（演示书与真书一样）都会报出三五条
    // 「清单里没有声明」——那是**表**的缺口，不是用户的盘被弄脏了。把表缺口摆到用户脸上，
    // 等于拿一条假警报换掉这条真信号（读数与后续见票 `demo-channel-full/05` 的 `## Answer`）。
    // ⚠️ 这一块**只如实列差集**，不做判决、也不拦交付：「什么时候缺件该拦住」归产物清单
    // 那两族自己的票（出处见 `src/workflow/book-shape.js` 文件头「边界」那一节）——所以下面
    // 那句「不拦交付」是**事实陈述**，⛔ 别在这里加任何「点它去补」的承诺。
    // 票 `ui-display-redesign/10`（spec §2.10 第 7 块）：**有清单就常显一行**——没缺件印「没缺」，
    // 有缺件逐条点名；只有没有清单（老书 null）才整块不摆。
    // 票 17（收口 review S5）：清单在、但「缺件」那一格读不到（不是数组）⇒ 印「缺件读数不可用」，
    // ⛔ 不说「没缺」（「没数据」不是「没有缺件」）。
    shapeReport === null || shapeReport === void 0 ? null : (0, import_react6.createElement)(
      "div",
      {
        style: {
          margin: "10px 0",
          padding: "8px 10px",
          borderRadius: "8px",
          border: "1px solid var(--dsw-alias-border-l2)"
        }
      },
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "0 0 4px", fontWeight: 600 } },
        `\u{1F4E6} \u6587\u4EF6\u5BF9\u8D26\uFF1A\u8BE5\u6709 ${shapeReport.manifestRows ?? 0} \u4EF6\u5DE5\u4F5C\u6587\u4EF6\uFF0C\u76D8\u4E0A ${shapeReport.registryRows ?? 0} \u4EF6` + (shapeMissingKnown === false ? "\uFF0C\u7F3A\u4EF6\u8BFB\u6570\u4E0D\u53EF\u7528" : shapeMissing.length > 0 ? `\uFF0C\u8FD8\u7F3A ${shapeMissing.length} \u4EF6` : "\uFF0C\u6CA1\u7F3A")
      ),
      ...shapeMissing.map(
        (row, index) => (0, import_react6.createElement)(
          "div",
          { key: `miss-${index}`, style: { fontSize: "12px", margin: "3px 0", opacity: 0.85 } },
          // ⚠️ **只报族名，不报机器路径**——`CONTEXT.md`「产物名」那条判据：产物相对路径的
          // 原文不上屏（`test-wording-invariants.mjs` 那条「含中文的字面量不许把机器路径
          // 拼进可见文本」会当场逮住）。族名本身就是人写的词（生产族表的 `family`），
          // 够答「缺哪一件」这个问题。
          `\xB7 \u8FD8\u7F3A\uFF1A${row?.family ?? "\uFF08\u8BA4\u4E0D\u51FA\u662F\u54EA\u4E00\u65CF\uFF09"}`
        )
      ),
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.75 } },
        "\u8FD9\u4E00\u680F\u53EA\u662F\u628A\u7F3A\u4EF6\u5982\u5B9E\u5217\u51FA\u6765\uFF0C\u4E0D\u62E6\u4EA4\u4ED8\u3002"
      )
    ),
    (styleNotes ?? []).length > 0 ? (0, import_react6.createElement)(
      "div",
      {
        style: {
          margin: "10px 0",
          padding: "8px 10px",
          borderRadius: "8px",
          border: "1px solid var(--dsw-alias-border-l2)"
        }
      },
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontWeight: 600 } },
        "\u{1F3A8} \u4F60\u7684\u98CE\u683C\u7EBF\u6761\u6761\u6709\u7740\u843D"
      ),
      ...(styleNotes ?? []).map(
        (note2, index) => (0, import_react6.createElement)(
          "div",
          {
            key: note2.id ?? index,
            style: { fontSize: "12px", margin: "3px 0" }
          },
          `${note2.status === "superseded" ? "\xB7 \uFF08\u5DF2\u6536\u56DE\uFF09" : note2.status === "conflict" ? "\xB7 \uFF08\u4E0E\u8BBE\u8BA1\u51B2\u7A81\uFF0C\u7406\u7531\u89C1\u5907\u6CE8\uFF09" : "\xB7 "}${note2.text}`,
          note2.note ? (0, import_react6.createElement)(
            "span",
            { style: { opacity: 0.6 } },
            ` -- ${note2.note}`
          ) : null
        )
      )
    ) : null,
    // 票 `walkthrough-fixes/37`：用户上一轮写的那句意见，**逐条列出去向**——认可之前一眼看得见哪条没办。
    // ⚠️ 这一块是 AI 的自述，不是机器结论（尾注 `FINAL_REDO_FOOT` 就写着这条边界，⛔ 别改成「已验过」）。
    redoRows !== null ? (0, import_react6.createElement)(
      "div",
      {
        style: {
          margin: "10px 0",
          padding: "8px 10px",
          borderRadius: "8px",
          border: "1px solid var(--dsw-alias-border-l2)"
        }
      },
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontWeight: 600 } },
        FINAL_REDO_HEADING
      ),
      ...redoRows.map(
        (row) => (0, import_react6.createElement)(
          "div",
          { key: `redo-${row.index}`, style: { fontSize: "12px", margin: "3px 0" } },
          `${row.mark} \u7B2C ${row.index ?? "?"} \u6761\u300C${row.quote}\u300D\uFF1A${row.statusText}`,
          row.where !== "" ? (0, import_react6.createElement)("span", { style: { opacity: 0.6 } }, `\uFF0C${row.where}`) : null,
          row.note !== "" ? (0, import_react6.createElement)("span", { style: { opacity: 0.6 } }, `\uFF0C${row.note}`) : null
        )
      ),
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.75 } },
        FINAL_REDO_FOOT
      )
    ) : null,
    (0, import_react6.createElement)(
      "p",
      { style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
      // 票 10（判定四③）：原句 79 字压到 90 字内——「AI 已整体调整过、机器也兜底验过」与
      // 上面那句（交付卡同款）重复，删掉；保留"这是最后一次把关"与两条出路。
      // 票 `demo-channel-full/26`：末句「AI 会照着改整本」对演示书是假话（报告六件逐字未变，
      // 那句意见只落 `meta.finalRedoNote`）⇒ 两取值，出口在 `view-rules.finalApprovalNote`。
      finalApprovalNote(meta)
    ),
    (0, import_react6.createElement)(
      "textarea",
      {
        ref: noteRef,
        style: {
          width: "100%",
          minHeight: "64px",
          padding: "8px",
          borderRadius: "8px",
          border: needNote ? "1px solid var(--dsw-alias-state-error-primary)" : "1px solid var(--dsw-alias-border-l2)",
          fontSize: "13px",
          boxSizing: "border-box"
        },
        placeholder: "\u4E0D\u6EE1\u610F\u7684\u8BDD\uFF0C\u5728\u8FD9\u91CC\u5199\u4E00\u53E5\u8981\u6539\u4EC0\u4E48\uFF08\u5199\u4E86\u624D\u80FD\u70B9\u300C\u4E0D\u6EE1\u610F\u300D\uFF09\u2026",
        value: note,
        onChange: (e) => {
          setNote(e.target.value);
          if (e.target.value.trim() !== "") setNeedNote(false);
        }
      }
    ),
    needNote ? (0, import_react6.createElement)(
      "p",
      {
        style: {
          margin: "6px 0 0",
          fontSize: "12px",
          color: "var(--dsw-alias-state-error-primary)"
        }
      },
      // 票 `demo-channel-full/26`：这句说的是「这句话会被拿去改整本」——演示书上
      // 那句话的用途只是过 400 那道闸 ⇒ 两取值（出口 `view-rules.finalApprovalNeedNote`）。
      finalApprovalNeedNote(meta)
    ) : null,
    (0, import_react6.createElement)(
      "div",
      { style: { display: "flex", gap: "10px", margin: "10px 0" } },
      (0, import_react6.createElement)(
        "button",
        // 票 03：成品在 DSH 右栏预览（卡片里不再灌整本 <pre>，故无「收起」态）。
        {
          style: S.disabled(S.ghostBtn(false), busy),
          onClick: onPreview,
          disabled: busy
        },
        // 票 10（判定一 #13）：与交付卡同一份成品、同一个名字（「成书」）。
        "\u{1F440} \u6253\u5F00\u6210\u4E66"
      ),
      (0, import_react6.createElement)(
        "button",
        {
          // 2026-09-20 批 3：三键同权 → 主操作（认可）填色、其余描边。
          // 「不满意」原来在没写意见时直接 disabled，看着能点却点不动；现在让它永远可点，
          // 点了把光标送进输入框并说明原因（后端契约：approved=false 必须带 note）。
          style: S.disabled({ ...S.ghostBtn(true), marginRight: "auto" }, busy),
          onClick: () => {
            if (note.trim() === "") {
              setNeedNote(true);
              if (typeof noteRef.current?.focus === "function")
                noteRef.current.focus();
              return;
            }
            onReject(note);
          },
          disabled: busy,
          title: "\u8981\u5148\u5199\u4E00\u53E5\u6539\u8FDB\u610F\u89C1\uFF08AI \u7167\u7740\u6539\u6574\u672C\uFF09"
        },
        FINAL_REJECT_LABEL
      ),
      (0, import_react6.createElement)(
        "button",
        {
          style: S.disabled(S.bigBtn(true), busy),
          onClick: () => onApprove(),
          disabled: busy,
          // 票 `auto-walkthrough/04`：关键键的语义钩子（D17）。
          "data-final-approve": "1"
        },
        FINAL_APPROVE_LABEL
      )
    )
  );
}
var REASONS = [
  "\u8BB2\u5F97\u592A\u6DF1\u4E86",
  "\u8BB2\u5F97\u592A\u6D45\u4E86",
  "\u4E0D\u662F\u6211\u8981\u7684\u91CD\u70B9",
  "\u548C\u522B\u7684\u90E8\u5206\u91CD\u590D",
  "\u6362\u4E2A\u98CE\u683C"
];
function rejectPayload(mode, reasons, note, styleText) {
  const style = (reasons ?? []).includes("\u6362\u4E2A\u98CE\u683C") ? String(styleText ?? "").trim() : "";
  const extraNote = style !== "" ? `
\u3010\u4F60\u60F3\u6362\u7684\u98CE\u683C/\u5199\u6CD5\u3011
${style}` : "";
  return {
    approved: false,
    mode,
    reasons: reasons ?? [],
    note: `${String(note ?? "")}${extraNote}`.trim()
  };
}
var GATE_PASS_EFFECT = "\u70B9\u4E86\u5B83\u8FD9\u4EFD\u65B9\u6848\u5C31\u6B64\u5B9A\u4E0B\uFF1AAI \u63A5\u7740\u5F80\u4E0B\u5E72\uFF0C\u4E0D\u7528\u4F60\u518D\u70B9\u4E00\u6B21\uFF1B\u4E4B\u540E\u60F3\u6539\uFF0C\u56DE\u9000\u5230\u6700\u8FD1\u4E00\u6B21\u5B58\u6863\u3002";
function gatePassEffect() {
  return GATE_PASS_EFFECT;
}
var GATE_PASS_LABEL = "\u2705 \u901A\u8FC7\uFF0C\u7EE7\u7EED";
var GATE_REJECT_LABEL = "\u274C \u9A73\u56DE\uFF0C\u63D0\u610F\u89C1";
var GATE_SKIP_LABEL = "\u23ED \u5148\u8DF3\u8FC7\u8FD9\u4E00\u5173\uFF08\u672A\u9A8C\uFF09";
var GATE_ROLLBACK_LABEL = "\u23EA \u56DE\u9000\u5230\u6700\u8FD1\u4E00\u6B21\u5B58\u6863";
var GATE_REJECT_MODE_WRONG_LABEL = "\u65B9\u6848\u4E0D\u5BF9 \u2014\u2014 AI \u91CD\u505A\u4E00\u7248";
var GATE_REJECT_MODE_CONFUSED_LABEL = "\u6211\u770B\u4E0D\u61C2 / \u4E0D\u662F\u6211\u8981\u7684 \u2014\u2014 AI \u6362\u4EBA\u8BDD\u91CD\u8BB2\u3001\u7ED9\u4F8B\u5B50";
var GATE_REJECT_EFFECT = `${GATE_REJECT_MODE_WRONG_LABEL}\uFF1B${GATE_REJECT_MODE_CONFUSED_LABEL}\u3002`;
var GATE_SKIP_EFFECT = "\u4E0D\u60F3\u5728\u8FD9\u513F\u7B49\uFF1F\u53EF\u4EE5\u5148\u8DF3\u8FC7\u8FD9\u4E00\u5173\uFF1A\u6D41\u7A0B\u7167\u5E38\u5F80\u4E0B\u8D70\uFF0C\u4F46\u8FD9\u4E00\u5173\u7684\u9A8C\u8D27\u7ED3\u8BBA\u4F1A\u8BB0\u6210\u300C\u672A\u77E5\u300D\u2014\u2014\u4EA4\u4ED8\u4E0E\u6700\u540E\u68C0\u67E5\u7684\u6E05\u5355\u91CC\u9010\u6761\u5217\u7740\u5B83\uFF0C\u4E0D\u4F1A\u88AB\u7B97\u8FDB\u300C\u5DF2\u901A\u8FC7\u300D\uFF0C\u4F60\u4E4B\u540E\u60F3\u8865\u9A8C\u968F\u65F6\u56DE\u6765\u8865\u62CD\u4E00\u6B21\u3002";
var GATE_ROLLBACK_EFFECT = "\u8FD9\u4E00\u6B65\u4E4B\u540E\u65B0\u63A8\u8FDB\u7684\u90E8\u5206\u4F1A\u88AB\u91CD\u505A\uFF1B\u56DE\u9000\u524D\u4F1A\u5148\u5B58\u4E00\u7248\uFF0C\u4E4B\u540E\u8FD8\u80FD\u518D\u56DE\u9000\u3002";
var GATE_CARD_FACTS = "\u901A\u8FC7\u540E\u4E0D\u7528\u518D\u70B9\uFF1B\u60F3\u6539\u53EA\u80FD\u56DE\u9000\u5230\u6700\u8FD1\u4E00\u6B21\u5B58\u6863\u3002";
var GATE_CONCURRENCY_FOLD_SUMMARY = "\u{1F39A} \u5E76\u53D1\uFF08\u73B0\u5728\u6539\u8FD8\u6765\u5F97\u53CA\uFF09";
var GATE_OTHER_FOLD_SUMMARY = "\u5176\u4ED6\u9009\u62E9\uFF08\u8DF3\u8FC7\u8FD9\u4E00\u5173 / \u56DE\u9000\u5230\u6700\u8FD1\u4E00\u6B21\u5B58\u6863\uFF09";
var FINAL_APPROVE_LABEL = "\u2705 \u8BA4\u53EF\uFF0C\u4EA4\u4ED8";
var FINAL_REJECT_LABEL = "\u274C \u4E0D\u6EE1\u610F\uFF0C\u8BA9 AI \u6539";
var FINAL_APPROVE_EFFECT = "\u70B9\u4E86\u5B83\u5C31\u662F\u8BA4\u53EF\u4EA4\u4ED8\uFF1B\u4E4B\u540E\u8FD9\u672C\u4E66\u4E0D\u518D\u6539\u52A8\uFF0C\u60F3\u6539\u53EA\u80FD\u8D70\u5B9A\u70B9\u4FEE\u6539\u3002";
var gatePanelView = defineCardView({
  card: "GatePanel",
  // 票 `walkthrough-fixes/19`②③：那个旋钮的现状（`maxConcurrentSubagents`）
  // 与两个回调（`onSetKnobs` 改旋钮、`onSkipStep` 跳过这一关）都从壳上取。
  // ⚠️ 票 `confirm-points-redesign-build/03` 起**没有** `lengthPreset` 这一位（篇幅档位删除）。
  fromBook: ["gate", "onDecide", "onRollback", "busy", "onAddPattern", "maxConcurrentSubagents", "onSetKnobs", "onSkipStep", "meta"],
  required: ["gate", "onDecide", "onRollback"],
  defaults: { error: null }
});
function GatePanel(props) {
  const {
    gate,
    onDecide,
    onRollback,
    busy,
    error,
    onAddPattern,
    maxConcurrentSubagents,
    onSetKnobs,
    onSkipStep,
    meta
  } = props;
  const decidedNote = gateDecidedNote(meta);
  const [showDetail, setShowDetail] = (0, import_react6.useState)(true);
  const [showCompare, setShowCompare] = (0, import_react6.useState)(false);
  const [rejecting, setRejecting] = (0, import_react6.useState)(false);
  const [mode, setMode] = (0, import_react6.useState)("wrong");
  const [reasons, setReasons] = (0, import_react6.useState)([]);
  const [note, setNote] = (0, import_react6.useState)("");
  const [styleText, setStyleText] = (0, import_react6.useState)("");
  const [route, setRoute] = (0, import_react6.useState)("human");
  const isStation4 = String(gate?.gate ?? "") === "1";
  const [confirmRollback, setConfirmRollback] = (0, import_react6.useState)(false);
  const [otherOpen, setOtherOpen] = (0, import_react6.useState)(false);
  const rollbackConfirm = () => (0, import_react6.createElement)(
    "div",
    {
      style: {
        marginTop: "10px",
        borderTop: "1px dashed var(--dsw-alias-border-l2)",
        paddingTop: "8px"
      }
    },
    (0, import_react6.createElement)(
      "p",
      { style: { margin: "0 0 6px", fontWeight: 600 } },
      "\u23EA \u56DE\u9000\u5230\u6700\u8FD1\u4E00\u6B21\u5B58\u6863\uFF1F"
    ),
    (0, import_react6.createElement)(
      "p",
      {
        style: {
          margin: "0 0 6px",
          fontSize: "12px",
          color: "var(--dsw-alias-state-error-primary)"
        }
      },
      // 票 11：这段说明的**唯一出处**是 `GATE_ROLLBACK_EFFECT`（契约的 `options[].effect`
      // 取的也是它）——⛔ 别在这儿再写一遍原文。
      GATE_ROLLBACK_EFFECT
    ),
    (0, import_react6.createElement)(
      "div",
      { style: { display: "flex", gap: "8px" } },
      (0, import_react6.createElement)(
        "button",
        {
          style: S.disabled({ ...S.bigBtn(false), padding: "6px 14px" }, busy),
          onClick: () => {
            setConfirmRollback(false);
            onRollback();
          },
          disabled: busy
        },
        "\u786E\u8BA4\u56DE\u9000"
      ),
      (0, import_react6.createElement)(
        "button",
        { style: S.smallLink, onClick: () => setConfirmRollback(false) },
        "\u53D6\u6D88"
      )
    )
  );
  if (gate === null) return null;
  if (gate.status !== "awaiting") {
    const decided = gate.status === "approved";
    return (0, import_react6.createElement)(
      "div",
      { style: S.focus },
      (0, import_react6.createElement)(
        "strong",
        null,
        decided ? `\u2705 ${gateHuman(gate.gate)}\u5DF2\u901A\u8FC7\uFF08v${gate.version}\uFF09` : `\u21A9\uFE0F ${gateHuman(gate.gate)}\u5DF2\u9A73\u56DE\uFF08v${gate.version}\uFF09\uFF0C\u7B49 AI \u4FEE\u8BA2`
      ),
      decided ? (0, import_react6.createElement)(
        "p",
        { style: { margin: "6px 0 0", opacity: 0.8 } },
        decidedNote
      ) : (0, import_react6.createElement)(
        "p",
        { style: { margin: "6px 0 0", opacity: 0.8 } },
        "AI \u6B63\u5728\u6309\u4F60\u7684\u610F\u89C1\u4FEE\u6539\uFF0C\u65B0\u7248\u63D0\u6848\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002"
      ),
      (0, import_react6.createElement)(
        "div",
        { style: { marginTop: "8px" } },
        (0, import_react6.createElement)(
          "button",
          {
            // 同上：回退做轻（灰色小链接），别和主操作抢眼。
            // 🎯 票 `gold-display-period/05`：这颗**有意不禁用**（#2 的逐处复核）——它只
            // `setConfirmRollback(true)`（开自己那张确认层，不发动作，`smoke-test.mjs` 自己就断着
            // 「点它第一下不该发动作」）⇒ `busy` 里挡住它只会造出「看着能点却点不动」的键。
            style: { ...S.smallLink, color: "inherit", opacity: 0.7 },
            onClick: () => setConfirmRollback(true)
          },
          GATE_ROLLBACK_LABEL
        ),
        confirmRollback ? rollbackConfirm() : null
      )
    );
  }
  const toggleReason = (reason) => {
    setReasons(
      (prev) => prev.includes(reason) ? prev.filter((item) => item !== reason) : [...prev, reason]
    );
  };
  const submitReject = () => {
    const hasStyle = (reasons ?? []).includes("\u6362\u4E2A\u98CE\u683C");
    const style = hasStyle ? styleText.trim() : "";
    if (hasStyle && style !== "" && typeof onAddPattern === "function") {
      void onAddPattern(style).catch(() => {
      });
    }
    onDecide(rejectPayload(mode, reasons, note, styleText));
  };
  return (0, import_react6.createElement)(
    "div",
    { style: S.focus },
    // 票 `ui-display-redesign/05`：卡头行（存量问句＋新写事实句）是这一屏第一块，
    // 排在 `🚦 …` 抬头之前。问句节点就地造（理由同 `WIZARD_CARD_QUESTION` 那段：人设逐字
    // 取证面只读 `src/ui/**` 里 `<strong>` 上的字面量／同文件 const；这里取的是 view-rules 的
    // 存量常量，三关共用同一句）。
    (0, import_react6.createElement)(CardHead, {
      question: (0, import_react6.createElement)(
        "strong",
        { style: CARD_HEAD_QUESTION_STYLE },
        DECISION_QUESTION.gate
      ),
      facts: GATE_CARD_FACTS
    }),
    (0, import_react6.createElement)(
      "div",
      null,
      (0, import_react6.createElement)(
        "strong",
        { style: { fontSize: "13px" } },
        `\u{1F6A6} ${gateHuman(gate.gate)}\uFF0C\u65B9\u6848 v${gate.version}`
      ),
      (0, import_react6.createElement)(
        "span",
        { style: { float: "right", opacity: 0.6, fontSize: "12px" } },
        "\u8FD9\u4E00\u6B65\u4F60\u5B9A\u4E86\uFF0C\u6D41\u7A0B\u624D\u7EE7\u7EED"
      )
    ),
    (0, import_react6.createElement)("p", { style: { margin: "10px 0 6px" } }, gate.title),
    (0, import_react6.createElement)(
      "p",
      { style: { margin: "0 0 6px", opacity: 0.9, lineHeight: 1.6 } },
      gate.summary
    ),
    (0, import_react6.createElement)(
      "div",
      { style: { margin: "6px 0" } },
      (0, import_react6.createElement)(
        "button",
        { style: S.smallLink, onClick: () => setShowDetail(!showDetail) },
        showDetail ? "\u6536\u8D77\u5B8C\u6574\u65B9\u6848" : "\u5C55\u5F00\u5B8C\u6574\u65B9\u6848"
      ),
      gate.prevProposal !== null ? (0, import_react6.createElement)(
        "span",
        null,
        "\u3000",
        (0, import_react6.createElement)(
          "button",
          {
            style: S.smallLink,
            onClick: () => setShowCompare(!showCompare)
          },
          showCompare ? "\u6536\u8D77\u5BF9\u6BD4" : `\u5BF9\u6BD4\u4E0A\u4E00\u7248\uFF08v${gate.prevProposal.version}\uFF09`
        )
      ) : null
    ),
    showDetail && (gate.detail ?? "") !== "" ? (0, import_react6.createElement)(
      "div",
      {
        // 票 `ui-systematic-fixes/01`：这份「完整方案」是**正文**，走正文出口
        // （原来是一个 `pre-wrap` 的 `<pre>`：`# 标题`、`**加粗**` 逐字印在屏上）。
        // 容器保留原来的底色／内边距／内滚封顶，排版交给 `exploreReportBlocks`
        // （它自己带那条唯一的量宽上限与正文档字号）；`bodyOf` 恒返回节点数组。
        style: {
          background: "var(--dsw-alias-bg-layer-1)",
          borderRadius: "8px",
          padding: "10px",
          opacity: 0.9,
          maxHeight: "260px",
          overflow: "auto"
        }
      },
      ...bodyOf(gate.detail, BODY_KIND_MARKDOWN)
    ) : null,
    showCompare && gate.prevProposal !== null ? (0, import_react6.createElement)(
      "div",
      {
        style: {
          background: "var(--dsw-alias-bg-layer-1)",
          borderRadius: "8px",
          padding: "10px",
          fontSize: "12px",
          opacity: 0.9
        }
      },
      (0, import_react6.createElement)(
        "strong",
        null,
        `\u4E0A\u4E00\u7248 v${gate.prevProposal.version}\uFF1A`
      ),
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "4px 0 0" } },
        gate.prevProposal.summary
      )
    ) : null,
    // ── 票 `confirm-points-redesign-build/06`：**站 4（第 1 关）在这里问「这本书主要怎么学」** ──
    // 位置：紧挨着拍板那两颗键——它是这一步**最先要定**的那一件（spec 站 4 的①），拍板那一刻
    // 随裁决一起写进书里（`gate-decide` 的 `route`）。⛔ 措辞逐字：题面「这本书主要怎么学？」、
    // 选项「自己也要读」/「只让 AI 老师带着学」（票 `ui-display-redesign/05`：只把这一个词
    // 从「就让」改成「只让」），**预选前者**；选项上⛔ 不挂「推荐」字样、⛔ 不挂说明性括注
    // （维护者原话：「不要那个括号里的字，太冗长了」）。
    // ⛔ 只有**第 1 关**问它：第 2／3 关这一格整块不渲染——「拍板之后不作为可改项出现」这句话
    // 在界面上的落法就是「除了站 4 那一张卡，全仓没有第二处渲染它」；要改＝驳回第 1 关重拍。
    isStation4 ? (0, import_react6.createElement)(
      "div",
      {
        style: {
          marginTop: "12px",
          padding: "8px 10px",
          border: "1px solid var(--dsw-alias-border-l2)",
          borderRadius: "8px",
          background: "var(--dsw-alias-bg-layer-1)"
        }
      },
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontSize: "13px", fontWeight: 600 } },
        "\u8FD9\u672C\u4E66\u4E3B\u8981\u600E\u4E48\u5B66\uFF1F"
      ),
      (0, import_react6.createElement)(
        "label",
        { style: S.checkItem },
        (0, import_react6.createElement)("input", {
          type: "radio",
          name: "route",
          checked: route === "human",
          onChange: () => setRoute("human")
        }),
        " \u81EA\u5DF1\u4E5F\u8981\u8BFB"
      ),
      (0, import_react6.createElement)(
        "label",
        { style: S.checkItem },
        (0, import_react6.createElement)("input", {
          type: "radio",
          name: "route",
          checked: route === "blueprint",
          onChange: () => setRoute("blueprint")
        }),
        " \u53EA\u8BA9 AI \u8001\u5E08\u5E26\u7740\u5B66"
      ),
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.8 } },
        // ⚠️ 措辞里⛔ 不写「第 N 关」（那是机器词，`test-wording-invariants` 判红）——
        // 用这张卡自己的词「这一步」（同上面那句「这一步你定了，流程才继续」）。
        "\u8FD9\u4E00\u9879\u62CD\u677F\u4E4B\u540E\u5C31\u5B9A\u4E86\uFF0C\u4E0D\u518D\u4F5C\u4E3A\u53EF\u6539\u9879\u51FA\u73B0\uFF1B\u8981\u6539\u5C31\u9A73\u56DE\u8FD9\u4E00\u6B65\u91CD\u505A\u3002"
      )
    ) : null,
    // ── 票 `ui-display-redesign/05`：**并发旋钮只在第 1 关、默认折**（spec §2.5 第 8 块）────────
    // 一次性设定：之后要改走对话（`book-set-knobs` 仍可由 AI 改），不在每关重复摆。
    // ⛔ 第 2／3 关整块不渲染（票面逐关断：路线与并发都只属于第 1 关）。
    isStation4 ? (0, import_react6.createElement)(
      "details",
      { style: { marginTop: "10px" } },
      (0, import_react6.createElement)(
        "summary",
        { style: { cursor: "pointer", fontSize: "12px", opacity: 0.8 } },
        GATE_CONCURRENCY_FOLD_SUMMARY
      ),
      (0, import_react6.createElement)(
        "div",
        {
          style: {
            marginTop: "6px",
            padding: "8px 10px",
            border: "1px solid var(--dsw-alias-border-l2)",
            borderRadius: "8px",
            background: "var(--dsw-alias-bg-layer-1)"
          }
        },
        (0, import_react6.createElement)(
          "label",
          { style: { ...S.label, marginTop: "0" } },
          "\u4E00\u6B21\u6700\u591A\u6D3E\u51E0\u4E2A\u5C0F\u52A9\u624B"
        ),
        (0, import_react6.createElement)(
          "select",
          {
            style: S.disabled({ ...S.input, margin: "4px 0 0" }, busy),
            value: String(maxConcurrentSubagents ?? DEFAULT_MAX_CONCURRENT_SUBAGENTS),
            onChange: (e) => onSetKnobs?.({ maxConcurrentSubagents: Number(e.target.value) }),
            disabled: busy,
            // 票 `auto-walkthrough/04`：`book-set-knobs` 的可见控件是一个 `<select>`（**不是**按钮），
            // 它不在走查器的可点面（D2）里 ⇒ 位置锚点只能靠这枚钩子找到它；点击/效果仍不归它。
            "data-book-knobs": "1"
          },
          Array.from(
            { length: MAX_CONCURRENT_SUBAGENTS_CEILING },
            (_v, i) => (0, import_react6.createElement)("option", { key: i + 1, value: String(i + 1) }, `${i + 1} \u4E2A`)
          )
        ),
        (0, import_react6.createElement)(
          "p",
          { style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.8 } },
          `\u9ED8\u8BA4 ${DEFAULT_MAX_CONCURRENT_SUBAGENTS} \u4E2A\u3002\u6539\u5B8C\u8FC7\u7A0B\u8BB0\u5F55\u91CC\u4F1A\u7559\u4E00\u884C\uFF0C\u6D3E\u5355\u6A21\u677F\u91CC\u4E5F\u7167\u8FD9\u4E2A\u6570\u3002`
        )
      )
    ) : null,
    // ── 票 `ui-display-redesign/05`：**其他选择**（跳过／回退＋各自后果句）——**每关都折** ────────
    // 定义一句话：**跳过 ＝ 把验货推迟并记账，不是取消验货。** 回退是重操作，先确认再执行。
    // 两项每关都有效、但都低频 ⇒ 收成一个默认折的出口（spec §2.5 第 9 块）。
    // ⛔ 内容（两段后果句与两颗键）一个字没改：它们仍取 `GATE_SKIP_EFFECT`／`GATE_ROLLBACK_EFFECT`
    // 与既有键文案（契约的 `options[].effect` 取的也是那两个常量）。
    (0, import_react6.createElement)(
      "details",
      {
        style: {
          marginTop: "10px",
          borderTop: "1px dashed var(--dsw-alias-border-l2)",
          paddingTop: "8px"
        },
        // 票 `ui-display-redesign/05`：原生开合驱动 React 状态（折叠态不挂内容，见 state 旁注释）。
        onToggle: (e) => setOtherOpen(e.currentTarget.open === true)
      },
      (0, import_react6.createElement)(
        "summary",
        { style: { cursor: "pointer", fontSize: "12px", opacity: 0.8 } },
        GATE_OTHER_FOLD_SUMMARY
      ),
      otherOpen ? (0, import_react6.createElement)(
        "div",
        { style: { marginTop: "6px" } },
        (0, import_react6.createElement)(
          "p",
          { style: { margin: "0 0 6px", fontSize: "12px", opacity: 0.85 } },
          // 票 11：这段说明的**唯一出处**是 `GATE_SKIP_EFFECT`（契约的 `options[].effect`
          // 取的也是它）——⛔ 别在这儿再写一遍原文。
          GATE_SKIP_EFFECT
        ),
        (0, import_react6.createElement)(
          "button",
          {
            style: S.disabled({ ...S.smallLink, textDecoration: "none" }, busy),
            onClick: () => onSkipStep?.(),
            disabled: busy
          },
          GATE_SKIP_LABEL
        ),
        (0, import_react6.createElement)(
          "p",
          { style: { margin: "8px 0 6px", fontSize: "12px", opacity: 0.85 } },
          // 票 11：这段说明的唯一出处同样是 `GATE_ROLLBACK_EFFECT`。
          GATE_ROLLBACK_EFFECT
        ),
        (0, import_react6.createElement)(
          "div",
          null,
          (0, import_react6.createElement)(
            "button",
            {
              // 批 3 视觉权重三档：通过＝填色（主）、驳回＝描边（次）、回退＝灰色小链接（末）。
              // 🎯 票 `gold-display-period/05`：这颗**有意不禁用**（#2 的逐处复核）——
              // 它只开确认层（与关卡卡那一颗同形）。
              style: { ...S.smallLink, color: "inherit", opacity: 0.7 },
              onClick: () => setConfirmRollback(true)
            },
            GATE_ROLLBACK_LABEL
          ),
          confirmRollback ? rollbackConfirm() : null
        )
      ) : null
    ),
    error !== null ? (0, import_react6.createElement)("p", { style: S.error }, error) : null,
    rejecting ? (0, import_react6.createElement)(
      "div",
      {
        style: {
          marginTop: "10px",
          borderTop: "1px dashed var(--dsw-alias-border-l2)",
          paddingTop: "8px"
        }
      },
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontWeight: 600 } },
        "\u9A73\u56DE\u539F\u56E0\uFF08\u9009\u4E00\u4E2A\uFF0C\u4E0D\u5FC5\u6253\u5B57\uFF09"
      ),
      (0, import_react6.createElement)(
        "div",
        { style: { margin: "8px 0" } },
        (0, import_react6.createElement)(
          "label",
          { style: { display: "block", margin: "4px 0" } },
          (0, import_react6.createElement)("input", {
            type: "radio",
            name: "mode",
            checked: mode === "wrong",
            onChange: () => setMode("wrong")
          }),
          ` ${GATE_REJECT_MODE_WRONG_LABEL}`
        ),
        (0, import_react6.createElement)(
          "label",
          { style: { display: "block", margin: "4px 0" } },
          (0, import_react6.createElement)("input", {
            type: "radio",
            name: "mode",
            checked: mode === "confused",
            onChange: () => setMode("confused")
          }),
          ` ${GATE_REJECT_MODE_CONFUSED_LABEL}`
        )
      ),
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "6px 0 4px", fontWeight: 600 } },
        "\u5177\u4F53\u54EA\u91CC\u4E0D\u6EE1\u610F\uFF08\u53EF\u591A\u9009\uFF09"
      ),
      REASONS.map(
        (reason) => (0, import_react6.createElement)(
          "label",
          { key: reason, style: S.checkItem },
          (0, import_react6.createElement)("input", {
            type: "checkbox",
            checked: reasons.includes(reason),
            onChange: () => toggleReason(reason)
          }),
          ` ${reason}`
        )
      ),
      // 2026-08-21：勾选「换个风格」→ 弹出粘贴窗口，目标文本由 AI 分析成这本书的自定义模式。
      reasons.includes("\u6362\u4E2A\u98CE\u683C") ? (0, import_react6.createElement)(
        "div",
        { style: { marginTop: "4px" } },
        (0, import_react6.createElement)(
          "p",
          {
            style: {
              margin: "0 0 4px",
              fontSize: "12px",
              opacity: 0.8
            }
          },
          "\u628A\u4F60\u60F3\u8981\u7684\u98CE\u683C/\u5199\u6CD5\u7C98\u8D34\u8FDB\u6765\uFF0CAI \u4F1A\u628A\u5B83\u8BB0\u6210\u8FD9\u672C\u4E66\u7684\u81EA\u5B9A\u4E49\u6A21\u5F0F\uFF0C\u4FEE\u8BA2\u65F6\u7167\u7740\u6539\uFF1A"
        ),
        (0, import_react6.createElement)("textarea", {
          style: {
            ...S.textarea,
            borderColor: "var(--dsw-alias-state-business-primary)"
          },
          placeholder: "\u4F8B\uFF1A\u6BCF\u4E2A\u77E5\u8BC6\u70B9\u5148\u7ED9\u4E00\u4E2A\u751F\u6D3B\u4E2D\u7684\u771F\u5B9E\u573A\u666F\u5F15\u51FA\u6982\u5FF5\uFF0C\u518D\u914D\u4E00\u9053\u7531\u6D45\u5165\u6DF1\u7684\u4F8B\u9898\u2026\u2026",
          value: styleText,
          onChange: (e) => setStyleText(e.target.value)
        })
      ) : null,
      (0, import_react6.createElement)("textarea", {
        style: S.textarea,
        placeholder: "\u60F3\u591A\u8BF4\u4E00\u53E5\uFF1F\u5728\u8FD9\u91CC\u5199\uFF08\u53EF\u9009\uFF09",
        value: note,
        onChange: (e) => setNote(e.target.value)
      }),
      (0, import_react6.createElement)(
        "div",
        { style: { marginTop: "8px", display: "flex", gap: "8px" } },
        (0, import_react6.createElement)(
          "button",
          { style: S.disabled(S.bigBtn(false), busy), onClick: submitReject, disabled: busy },
          "\u63D0\u4EA4\u9A73\u56DE"
        ),
        (0, import_react6.createElement)(
          "button",
          {
            style: { ...S.smallLink, textDecoration: "none" },
            onClick: () => {
              setRejecting(false);
              setStyleText("");
            }
          },
          "\u53D6\u6D88"
        )
      )
    ) : (0, import_react6.createElement)(
      // 票 `ui-display-redesign/05`（spec §2.5 第 10 块）：主键上方那句**通过后果句已删**
      // ——后果并进了卡头事实句；契约里的 `effect` 文本仍是 `GATE_PASS_EFFECT`，只是不上屏。
      // ⇒ 两颗键直接落在卡底（这一段设计上就只该有键排）。⛔ 别把那句说明加回来。
      "div",
      { style: { marginTop: "12px" } },
      (0, import_react6.createElement)(
        "div",
        { style: { display: "flex", gap: "10px" } },
        (0, import_react6.createElement)(
          "button",
          {
            style: S.disabled(S.bigBtn(true), busy),
            // 票 cprb/06：第 1 关的「通过」把**这一项**一并拍定（`route` 随裁决交上去）。
            // 其余两关不带这一格——它们那一步不问路线，带上就等于替用户又定了一次。
            onClick: () => onDecide({ approved: true, ...isStation4 ? { route } : {} }),
            disabled: busy,
            // 票 `auto-walkthrough/04`：关键键的语义钩子（三个设计关共用这一颗文案）。
            "data-gate-pass": "1"
          },
          GATE_PASS_LABEL
        ),
        (0, import_react6.createElement)(
          "button",
          {
            // 批 3：原来「驳回」是整块红实心，和「通过」一样重；改成描边，
            // 让主操作（通过）是唯一填色的那个。
            // 🎯 票 `gold-display-period/05`：这颗**有意不禁用**（#2 的逐处复核）——
            // 它只 `setRejecting(true)`（展开这张卡自己的表单），提交那一笔在表单里。
            style: S.ghostBtn(true),
            onClick: () => setRejecting(true)
          },
          GATE_REJECT_LABEL
        )
      )
    )
  );
}
var MINERU_TOKEN_FOLD_SUMMARY = "\u{1F511} \u8FD8\u5DEE\u4E00\u6B65\uFF1AMinerU Token\uFF08\u70B9\u5F00\u586B\uFF09";
var MINERU_TOKEN_SOURCE_LABEL = Object.freeze({
  settings: "\u8BBE\u7F6E",
  env: "\u73AF\u5883\u53D8\u91CF",
  credentials: "\u51ED\u636E\u6587\u4EF6"
});
function mineruSourceLabel(source) {
  return Object.hasOwn(MINERU_TOKEN_SOURCE_LABEL, source) ? MINERU_TOKEN_SOURCE_LABEL[source] : null;
}
function MineruTokenCard(props) {
  const {
    mineruSet,
    mineruToken,
    busy,
    onTokenChange,
    onSave,
    resetOpen,
    onToggleReset,
    // 票 `token-banner/01`：来源与脱敏值由服务端随设置快照下发（`mineruTokenStatus`）。
    mineruSource,
    mineruMasked,
    // 票 `usf/08`：真书阶段一那一处折成一行（见本节头注）。
    collapsed
  } = props;
  if (mineruSet !== true && mineruSet !== false) return null;
  if (mineruSet === false) {
    const form = [
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "4px 0" } },
        "\u6750\u6599\u8F6C\u6362\u9700\u8981 MinerU \u7684 Token\uFF08\u5728 mineru.net \u7533\u8BF7\uFF1B\u514D\u8D39\u989D\u5EA6\u4EE5\u5BF9\u65B9\u89C4\u5219\u4E3A\u51C6\uFF09\u3002\u586B\u5728\u8FD9\u91CC\u5373\u53EF\uFF1A"
      ),
      (0, import_react6.createElement)("input", {
        style: S.input,
        placeholder: "\u7C98\u8D34 MinerU Token",
        value: mineruToken,
        onChange: onTokenChange
      }),
      (0, import_react6.createElement)(
        "button",
        { style: S.disabled(S.bigBtn(true), busy), onClick: onSave, disabled: busy },
        "\u4FDD\u5B58 Token"
      )
    ];
    if (collapsed === true)
      return (0, import_react6.createElement)(
        "details",
        { style: { margin: "0 0 10px" } },
        (0, import_react6.createElement)(
          "summary",
          {
            style: {
              cursor: "pointer",
              fontSize: "12px",
              color: "var(--dsw-alias-state-error-primary)"
            }
          },
          MINERU_TOKEN_FOLD_SUMMARY
        ),
        (0, import_react6.createElement)(
          "div",
          {
            style: {
              ...S.card,
              borderColor: "var(--dsw-alias-state-error-primary)",
              marginTop: "6px"
            }
          },
          ...form
        )
      );
    return (0, import_react6.createElement)(
      "div",
      { style: { ...S.card, borderColor: "var(--dsw-alias-state-error-primary)" } },
      (0, import_react6.createElement)(
        "strong",
        { style: { color: "var(--dsw-alias-state-error-primary)" } },
        "\u{1F511} \u8FD8\u5DEE\u4E00\u6B65\uFF1AMinerU Token"
      ),
      ...form
    );
  }
  const masked = typeof mineruMasked === "string" && mineruMasked !== "" ? mineruMasked : "\u2022\u2022\u2022\u2022";
  const sourceLabel = mineruSourceLabel(mineruSource);
  const setLine = `\u2705 MinerU Token \u5DF2\u8BBE\u7F6E\uFF08${masked}\uFF09`;
  const resetDisabled = busy || mineruToken.trim() === "";
  const resetForm = [
    (0, import_react6.createElement)(
      "p",
      { style: { margin: "4px 0" } },
      "\u586B\u65B0\u7684 Token \u5373\u53EF\u8986\u76D6\u65E7\u7684\uFF1A"
    ),
    (0, import_react6.createElement)("input", {
      style: S.input,
      placeholder: "\u7C98\u8D34\u65B0\u7684 MinerU Token",
      value: mineruToken,
      onChange: onTokenChange
    }),
    (0, import_react6.createElement)(
      "button",
      { style: S.disabled(S.bigBtn(true), resetDisabled), onClick: onSave, disabled: resetDisabled },
      "\u4FDD\u5B58\u65B0 Token"
    )
  ];
  if (collapsed === true)
    return (0, import_react6.createElement)(
      "div",
      { style: { margin: "0 0 10px" } },
      (0, import_react6.createElement)(
        "div",
        {
          style: {
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap"
          }
        },
        (0, import_react6.createElement)(
          "span",
          {
            style: {
              fontSize: "12px",
              color: "var(--dsw-alias-state-success-primary)"
            }
          },
          `${setLine}${sourceLabel === null ? "" : `\uFF0C\u6765\u6E90\uFF1A${sourceLabel}`}`
        ),
        (0, import_react6.createElement)(
          "button",
          { style: S.smallLink, onClick: onToggleReset },
          "\u91CD\u65B0\u8BBE\u7F6E"
        )
      ),
      // ⚠️ 表单只在**点了「重新设置」之后**才渲染：这里没有原生 `<details>` 的收起态可借，
      // 若一直渲染，屏上会多一颗不可见的保存键（走查器会把它读成死键）。
      resetOpen ? (0, import_react6.createElement)("div", { style: { marginTop: "6px" } }, ...resetForm) : null
    );
  return (0, import_react6.createElement)(
    "div",
    { style: { ...S.card, borderColor: "var(--dsw-alias-state-success-primary)" } },
    (0, import_react6.createElement)(
      "div",
      {
        style: {
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap"
        }
      },
      (0, import_react6.createElement)("strong", {}, setLine),
      sourceLabel === null ? null : (0, import_react6.createElement)(
        "span",
        { style: { fontSize: "12px", opacity: 0.65 } },
        `\u6765\u6E90\uFF1A${sourceLabel}`
      ),
      (0, import_react6.createElement)(
        "button",
        { style: S.smallLink, onClick: onToggleReset },
        "\u91CD\u65B0\u8BBE\u7F6E"
      )
    ),
    resetOpen ? (0, import_react6.createElement)("div", { style: { marginTop: "6px" } }, ...resetForm) : null
  );
}

// src/ui/confirm-cards.js
var import_react9 = require("react");

// src/ui/knowledge-graph-map.js
var import_react7 = require("react");

// src/plain-object.js
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// src/workflow/knowledge-graph.js
var EDGE_KINDS = Object.freeze(["prereq", "alias", "see-also"]);
var PREREQ_KIND = "prereq";
var ALIAS_KIND = "alias";
var SEE_ALSO_KIND = "see-also";
var KnowledgeGraphInputError = class extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "KnowledgeGraphInputError";
    this.code = code;
    this.details = details;
  }
};
function shapeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return `\u6570\u7EC4(${value.length})`;
  if (typeof value === "string") return value === "" ? "\u7A7A\u4E32" : `\u5B57\u7B26\u4E32(${value.length} \u5B57)`;
  return typeof value;
}
function endpointOf(edge, field) {
  const value = edge[field];
  return typeof value === "string" && value !== "" ? value : null;
}
function edgeDefect(edge) {
  if (!isPlainObject(edge)) return { code: "edge-not-object" };
  const from = endpointOf(edge, "from");
  const to = endpointOf(edge, "to");
  if (from === null || to === null) {
    return { code: "edge-endpoint-missing", from, to, missing: [from === null ? "from" : null, to === null ? "to" : null].filter(Boolean) };
  }
  const kind = Object.hasOwn(edge, "kind") ? edge.kind : void 0;
  if (kind === void 0) return { code: "edge-kind-missing", from, to };
  if (!EDGE_KINDS.includes(kind)) return { code: "edge-kind-unknown", from, to, kind };
  return null;
}
function namesOf(cards) {
  const names = /* @__PURE__ */ new Map();
  for (const card of Array.isArray(cards) ? cards : []) {
    if (!isPlainObject(card)) continue;
    if (typeof card.key === "string" && card.key !== "" && typeof card.name === "string" && card.name !== "") {
      names.set(card.key, card.name);
    }
  }
  return names;
}
function labelFor(key, names) {
  const name = names.get(key);
  return name === void 0 ? key : `${key}\u300C${name}\u300D`;
}
function edgeLabelOf(edge) {
  return `${edge.from} \u2192 ${edge.to}\uFF08\u8FB9 #${edge.index}\uFF09`;
}
function defectTextOf(defect, edge, index) {
  if (defect.code === "edge-not-object") return `\u8FB9 #${index} \u4E0D\u662F\u5BF9\u8C61\uFF08${shapeOf(edge)}\uFF09`;
  if (defect.code === "edge-endpoint-missing") return `\u8FB9 #${index} \u7684 ${defect.missing.join("\uFF0F")} \u4E0D\u662F\u975E\u7A7A\u5B57\u7B26\u4E32`;
  if (defect.code === "edge-kind-missing") return `\u8FB9 #${index}\uFF08${edge.from} \u2192 ${edge.to}\uFF09\u6CA1\u6709\u663E\u5F0F\u7684 kind`;
  return `\u8FB9 #${index}\uFF08${edge.from} \u2192 ${edge.to}\uFF09\u7684 kind \u662F ${shapeOf(defect.kind)}\uFF0C\u4E0D\u5728 ${EDGE_KINDS.join("\uFF0F")} \u4E4B\u5185`;
}
function readEdgeTable(edges) {
  if (!Array.isArray(edges)) {
    throw new KnowledgeGraphInputError(
      "edges-not-array",
      `\u8FB9\u8868\u5FC5\u987B\u662F\u4E00\u4EFD\u6570\u7EC4\uFF0C\u62FF\u5230\u7684\u662F ${shapeOf(edges)}\u2014\u2014\u672C\u6A21\u5757\u5403\u7684\u662F\u7968 01 \u4E4B\u540E\u5408\u5E76\u4EF6\u91CC\u7684 \`edges[]\`\uFF08\u5B83\u4E0D\u66FF\u8C03\u7528\u65B9\u53BB\u627E\u76D8\u4E0A\u7684\u6587\u4EF6\uFF09\u3002`
    );
  }
  const scan = {
    edges: edges.length,
    notObject: 0,
    endpointMissing: 0,
    kindMissing: 0,
    kindUnknown: 0,
    prereq: 0,
    alias: 0,
    seeAlso: 0,
    nodes: 0,
    selfLoops: 0,
    antisymmetricPairs: 0,
    cycles: 0
  };
  const prereq = [];
  const defects = [];
  const nodeSet = /* @__PURE__ */ new Set();
  edges.forEach((edge, index) => {
    const defect = edgeDefect(edge);
    if (defect !== null) {
      defects.push({ index, ...defect });
      if (defect.code === "edge-not-object") scan.notObject += 1;
      else if (defect.code === "edge-endpoint-missing") scan.endpointMissing += 1;
      else if (defect.code === "edge-kind-missing") scan.kindMissing += 1;
      else scan.kindUnknown += 1;
      return;
    }
    if (edge.kind === PREREQ_KIND) {
      scan.prereq += 1;
      prereq.push({ from: edge.from, to: edge.to, index, edge });
      nodeSet.add(edge.from);
      nodeSet.add(edge.to);
    } else if (edge.kind === ALIAS_KIND) scan.alias += 1;
    else if (edge.kind === SEE_ALSO_KIND) scan.seeAlso += 1;
  });
  scan.nodes = nodeSet.size;
  return { prereq, defects, scan };
}
function requireCleanEdgeTable(edges, defects) {
  if (defects.length === 0) return;
  const first = defects[0];
  const text = defects.map((defect) => defectTextOf(defect, edges[defect.index], defect.index)).join("\uFF1B");
  throw new KnowledgeGraphInputError(
    first.code,
    `\u8FB9\u8868\u91CC\u6709 ${defects.length} \u6761\u8FB9\u4E0D\u80FD\u8FDB\u56FE\uFF1A${text}\u3002\u672C\u6A21\u5757**\u4E0D\u628A\u7F3A\u7701\u7684 kind \u8BFB\u6210 prereq**\u2014\u2014\u539F\u578B\u90A3\u53E5 \`e.kind ?? 'prereq'\` \u4F1A\u8BA9\u300C\u67E5\u73AF\u53EA\u8D70 prereq\u300D\u8FD9\u53E5\u58F0\u79F0\u7684\u8FB9\u96C6\u6084\u6084\u53D8\u5BBD\uFF1B\u8BF7\u628A kind \u663E\u5F0F\u5199\u6210 ${EDGE_KINDS.join("\uFF0F")} \u4E4B\u4E00\u3002`,
    { defects }
  );
}
function adjacencyOf(prereq) {
  const nodes = [];
  const seenNode = /* @__PURE__ */ new Set();
  for (const edge of prereq) {
    for (const node of [edge.from, edge.to]) {
      if (seenNode.has(node)) continue;
      seenNode.add(node);
      nodes.push(node);
    }
  }
  const out = new Map(nodes.map((node) => [node, []]));
  const into = new Map(nodes.map((node) => [node, []]));
  const seenEdge = /* @__PURE__ */ new Set();
  for (const edge of prereq) {
    if (edge.from === edge.to) continue;
    const signature = `${edge.from}\0${edge.to}`;
    if (seenEdge.has(signature)) continue;
    seenEdge.add(signature);
    out.get(edge.from).push(edge.to);
    into.get(edge.to).push(edge.from);
  }
  return { nodes, out, into };
}
function prereqShapeProblems(edges, options = {}) {
  const { prereq, defects, scan } = readEdgeTable(edges);
  const names = namesOf(options?.cards);
  const problems = [];
  for (const defect of defects) {
    const edge = edges[defect.index];
    const base = {
      code: defect.code,
      edgeIndex: defect.index,
      message: defectTextOf(defect, edge, defect.index)
    };
    if (defect.code === "edge-kind-missing") {
      problems.push({
        ...base,
        from: defect.from,
        to: defect.to,
        message: `${base.message}\uFF1A\u672C\u6A21\u5757\u4E0D\u628A\u5B83\u8BFB\u6210 ${PREREQ_KIND}\uFF08\u90A3\u4F1A\u8BA9\u300C\u67E5\u73AF\u53EA\u8D70 ${PREREQ_KIND}\u300D\u8FD9\u53E5\u58F0\u79F0\u7684\u8FB9\u96C6\u6084\u6084\u53D8\u5BBD\uFF09\u2014\u2014\u8BF7\u628A kind \u663E\u5F0F\u5199\u6210 ${EDGE_KINDS.join("\uFF0F")} \u4E4B\u4E00\u3002`
      });
    } else if (defect.code === "edge-kind-unknown") {
      problems.push({ ...base, from: defect.from, to: defect.to, kind: defect.kind });
    } else {
      problems.push(base);
    }
  }
  const selfLoops = prereq.filter((edge) => edge.from === edge.to);
  scan.selfLoops = selfLoops.length;
  for (const edge of selfLoops) {
    problems.push({
      code: "edge-self-loop",
      edgeIndex: edge.index,
      node: edge.from,
      from: edge.from,
      to: edge.to,
      message: `\u81EA\u73AF\uFF1A\u5361 ${labelFor(edge.from, names)}\u6709\u4E00\u6761\u6307\u5411\u81EA\u5DF1\u7684 ${PREREQ_KIND} \u8FB9\uFF08${edgeLabelOf(edge)}\uFF09\u2014\u2014\u524D\u7F6E\u5173\u7CFB\u91CC\u4E00\u5F20\u5361\u4E0D\u80FD\u662F\u81EA\u5DF1\u7684\u524D\u7F6E\u3002`
    });
  }
  const directed = /* @__PURE__ */ new Set();
  const firstIndexOf = /* @__PURE__ */ new Map();
  for (const edge of prereq) {
    if (edge.from === edge.to) continue;
    const signature = `${edge.from}\0${edge.to}`;
    if (!directed.has(signature)) {
      directed.add(signature);
      firstIndexOf.set(signature, edge.index);
    }
  }
  const pairSeen = /* @__PURE__ */ new Set();
  for (const edge of prereq) {
    if (edge.from === edge.to) continue;
    const forward = `${edge.from}\0${edge.to}`;
    const backward = `${edge.to}\0${edge.from}`;
    if (!directed.has(backward)) continue;
    const pair = [edge.from, edge.to].slice().sort();
    const pairKey = pair.join("\0");
    if (pairSeen.has(pairKey)) continue;
    pairSeen.add(pairKey);
    const edgeIndexes = [firstIndexOf.get(forward), firstIndexOf.get(backward)].slice().sort((a, b) => a - b);
    problems.push({
      code: "edge-antisymmetric",
      pair,
      edgeIndexes,
      message: `\u53CD\u5BF9\u79F0\uFF1A\u5361 ${labelFor(pair[0], names)}\u4E0E\u5361 ${labelFor(pair[1], names)}\u4E4B\u95F4\u540C\u65F6\u6709 ${pair[0]} \u2192 ${pair[1]} \u4E0E ${pair[1]} \u2192 ${pair[0]} \u4E24\u6761 ${PREREQ_KIND} \u8FB9\uFF08\u8FB9 #${edgeIndexes[0]}\u3001#${edgeIndexes[1]}\uFF09\u2014\u2014\u524D\u7F6E\u53EA\u8BA4\u4E00\u4E2A\u65B9\u5411\uFF0C\u4E24\u8005\u4E0D\u80FD\u540C\u65F6\u6210\u7ACB\u3002`
    });
  }
  scan.antisymmetricPairs = pairSeen.size;
  const { nodes, out } = adjacencyOf(prereq);
  const cycles = findCycles(nodes, out);
  scan.cycles = cycles.length;
  for (const chain of cycles) {
    const edgeIndexes = [];
    for (let i = 0; i + 1 < chain.length; i += 1) {
      const hit = prereq.find((edge) => edge.from === chain[i] && edge.to === chain[i + 1]);
      if (hit !== void 0) edgeIndexes.push(hit.index);
    }
    const onCycle = chain.slice(0, -1);
    problems.push({
      code: "prereq-cycle",
      cycle: chain,
      nodes: onCycle,
      edgeIndexes,
      message: `\u73AF\uFF1A${chain.map((key) => labelFor(key, names)).join(" \u2192 ")}\u2014\u2014\u8FD9 ${onCycle.length} \u5F20\u5361\u4E92\u76F8\u6210\u4E3A\u524D\u7F6E\uFF08\u524D\u7F6E\u5173\u7CFB\u5FC5\u987B\u65E0\u73AF\uFF0C\u8BF7\u81F3\u5C11\u6539\u6389\u5176\u4E2D\u4E00\u6761\u8FB9${edgeIndexes.length === onCycle.length ? `\uFF1A#${edgeIndexes.join("\u3001#")}` : ""}\uFF09\u3002`
    });
  }
  return { problems, scan };
}
function findCycles(nodes, out) {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map(nodes.map((node) => [node, WHITE]));
  const found = [];
  const reportedGroups = /* @__PURE__ */ new Set();
  for (const root of nodes) {
    if (color.get(root) !== WHITE) continue;
    const path = [root];
    const positionOnPath = /* @__PURE__ */ new Map([[root, 0]]);
    color.set(root, GRAY);
    const stack = [{ node: root, next: 0 }];
    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      const successors = out.get(frame.node) ?? [];
      if (frame.next >= successors.length) {
        color.set(frame.node, BLACK);
        positionOnPath.delete(frame.node);
        path.pop();
        stack.pop();
        continue;
      }
      const to = successors[frame.next];
      frame.next += 1;
      const state = color.get(to) ?? WHITE;
      if (state === WHITE) {
        color.set(to, GRAY);
        positionOnPath.set(to, path.length);
        path.push(to);
        stack.push({ node: to, next: 0 });
      } else if (state === GRAY) {
        const chain = path.slice(positionOnPath.get(to)).concat([to]);
        if (chain.length - 1 < 3) continue;
        const group = chain.slice(0, -1).slice().sort().join("\0");
        if (reportedGroups.has(group)) continue;
        reportedGroups.add(group);
        found.push(chain);
      }
    }
  }
  return found;
}
function prereqEdges(edges) {
  const { prereq, defects } = readEdgeTable(edges);
  requireCleanEdgeTable(edges, defects);
  return prereq.map((entry) => entry.edge);
}

// src/knowledge-confidence.js
var LEVELS = Object.freeze(["\u5F3A", "\u4E2D", "\u5F85\u6838"]);
var PENDING = LEVELS[2];
var CROSS_MATERIAL_PREREQ_LEVELS = Object.freeze([LEVELS[1], PENDING]);
function isDecided(confidence) {
  return confidence !== PENDING;
}

// src/workflow/knowledge-map-assembly.js
var BOOK_LEVEL_FAMILIES = Object.freeze({
  verbatim: Object.freeze(["teachingFocus", "chapterSuggestion"]),
  concat: Object.freeze(["edges", "readerSlices"])
});
var BOOK_LEVEL_KEYS = Object.freeze([
  ...BOOK_LEVEL_FAMILIES.verbatim,
  ...BOOK_LEVEL_FAMILIES.concat
]);
function readerSliceProblems(readerSlices, knowledgePoints) {
  if (readerSlices === void 0 || readerSlices === null) return [];
  if (!Array.isArray(readerSlices)) {
    return [`\u4E66\u7EA7\u53C2\u6570\u91CC\u7684\u300CreaderSlices\u300D\uFF08\u7247\uFF09\u5FC5\u987B\u662F\u6570\u7EC4\uFF1A\u6BCF\u4E00\u7247\u662F {name, description?, members:[\u77E5\u8BC6\u70B9 title]}\uFF08\u5B9E\u4E3A ${typeof readerSlices}\uFF09`];
  }
  if (readerSlices.length === 0) {
    return ["\u4E66\u7EA7\u53C2\u6570\u91CC\u7684\u300CreaderSlices\u300D\uFF08\u7247\uFF09\u662F\u7A7A\u6570\u7EC4\u2014\u2014\u6BCF\u672C\u4E66\u81F3\u5C11\u8981\u6709\u4E00\u7247\uFF08\u7247\u7EA7\u975E\u7A7A\uFF1A\u6709\u540D\u3001\u6709\u6210\u5458\uFF09\uFF1B\u300C3\u20135 \u7247\u300D\u662F\u76EE\u6807\u4E0D\u662F\u786C\u95F8\uFF0C\u4F46 0 \u7247\u4E0D\u662F\u4E00\u79CD\u5408\u6CD5\u7684\u300C\u5206\u4E0D\u51FA\u6765\u300D\uFF08\u5206\u4E0D\u51FA\u6765\u8BF7\u770B {@link effectiveReaderSlices} \u7684\u9000\u5316\uFF09"];
  }
  const titles = /* @__PURE__ */ new Set();
  for (const point of Array.isArray(knowledgePoints) ? knowledgePoints : []) {
    const title = normalizeKnowledgePointTitle(point?.title);
    if (title !== "") titles.add(title);
  }
  const titleCount = titles.size;
  const problems = [];
  readerSlices.forEach((slice, index) => {
    const at = index + 1;
    if (slice === null || typeof slice !== "object" || Array.isArray(slice)) {
      problems.push(`\u7B2C ${at} \u7247\u4E0D\u662F\u5BF9\u8C61\uFF08\u5F62\u72B6\uFF1D{name, description?, members:[\u77E5\u8BC6\u70B9 title]}\uFF09`);
      return;
    }
    const name = typeof slice.name === "string" ? slice.name.trim() : "";
    const label = name === "" ? `\u7B2C ${at} \u7247` : `\u7B2C ${at} \u7247\uFF08\u300C${name}\u300D\uFF09`;
    if (name === "") problems.push(`\u7B2C ${at} \u7247\u6CA1\u6709\u540D\u5B57\uFF08name \u5FC5\u987B\u662F\u4E00\u53E5\u7528\u8BFB\u8005\u7684\u8BDD\u5199\u7684\u975E\u7A7A\u5B57\u7B26\u4E32\uFF09`);
    if (!Array.isArray(slice.members) || slice.members.length === 0) {
      problems.push(`${label}\u6CA1\u6709\u6210\u5458\u2014\u2014\u7247\u7EA7\u975E\u7A7A\u8981\u6C42\u6BCF\u4E00\u7247\u90FD\u70B9\u540D\u5B83\u6536\u54EA\u4E9B\u77E5\u8BC6\u70B9\uFF08members:[\u77E5\u8BC6\u70B9 title]\uFF09`);
      return;
    }
    slice.members.forEach((member, memberIndex) => {
      if (typeof member !== "string" || member.trim() === "") {
        problems.push(`${label}\u7684\u7B2C ${memberIndex + 1} \u4E2A\u6210\u5458\u4E0D\u662F\u5B57\u7B26\u4E32\u2014\u2014\u6210\u5458\u6309\u77E5\u8BC6\u70B9 title \u5F15\u7528\uFF08\u26D4 \u4E0D\u662F kp.id\uFF09`);
        return;
      }
      const key = normalizeKnowledgePointTitle(member);
      if (key === "" || !titles.has(key)) {
        problems.push(`${label}\u7684\u6210\u5458\u300C${member}\u300D\u6309 title \u5F52\u4E00\u5316\u540E\u5BF9\u4E0D\u4E0A\u77E5\u8BC6\u70B9\u56FE\u4E0A\u7684\u4EFB\u4F55\u4E00\u6761\uFF08\u6210\u5458\u6309 title \u5F15\u7528\uFF1B\u26D4 kp.id \u4E0D\u80FD\u5F53\u8EAB\u4EFD\uFF1B\u8FD9\u4EFD\u56FE\u4E0A\u6709 ${titleCount} \u4E2A\u77E5\u8BC6\u70B9 title\uFF09\u2014\u2014\u628A\u5B83\u6539\u6210\u56FE\u4E0A\u90A3\u6761\u77E5\u8BC6\u70B9\u7684 title`);
      }
    });
  });
  return problems;
}
function effectiveReaderSlices(merged) {
  const map = merged !== null && typeof merged === "object" && !Array.isArray(merged) ? merged : {};
  const knowledgePoints = Array.isArray(map.knowledgePoints) ? map.knowledgePoints : [];
  const problems = readerSliceProblems(map.readerSlices, knowledgePoints);
  if (Array.isArray(map.readerSlices) && map.readerSlices.length > 0 && problems.length === 0) {
    return { slices: map.readerSlices, degraded: false, note: null };
  }
  const members = [];
  for (const point of knowledgePoints) {
    const title = typeof point?.title === "string" ? point.title.trim() : "";
    if (title !== "") members.push(title);
  }
  if (members.length === 0) {
    return { slices: [], degraded: true, note: "\u8FD9\u672C\u4E66\u8FD8\u6CA1\u6709\u77E5\u8BC6\u70B9\u2014\u2014\u6CA1\u6709\u53EF\u4F5C\u7B54\u7684\u300C\u7247\u300D\uFF08\u4E0D\u9020\u4E00\u7247\u7A7A\u58F3\uFF09\u3002" };
  }
  const absent = map.readerSlices === void 0 || map.readerSlices === null;
  const note = absent ? "\u4E3B\u7B14\u8FD9\u6B21\u6CA1\u6709\u4EA4\u300C\u7247\u300D\uFF08readerSlices\uFF09\u2014\u2014\u6309\u300C\u6574\u672C\u4E66\u4E00\u7247\u300D\u5904\u7406\u3002" : `\u4E3B\u7B14\u4EA4\u7684\u300C\u7247\u300D\uFF08readerSlices\uFF09\u5F62\u72B6\u7AD9\u4E0D\u4F4F\uFF08${problems[0]}\uFF09\u2014\u2014\u6309\u300C\u6574\u672C\u4E66\u4E00\u7247\u300D\u5904\u7406\u3002`;
  return {
    slices: [{ name: "\u6574\u672C\u4E66", description: "\u8FD9\u672C\u4E66\u7684\u77E5\u8BC6\u70B9\u8FD8\u6CA1\u6709\u6309\u4F60\u7684\u60C5\u51B5\u5206\u6210\u7247\uFF0C\u6574\u672C\u7B97\u4F5C\u4E00\u7247\u3002", members }],
    degraded: true,
    note
  };
}
var SHARD_ARRAY_KEYS = Object.freeze(["materials", "knowledgePoints", "teachingMethods"]);
function scanKnowledgeMapEdges(shards, merged) {
  const list = Array.isArray(shards) ? shards : [];
  const declaring = [];
  for (const shard of list) {
    const entries = Array.isArray(shard?.map?.edges) ? shard.map.edges : [];
    if (entries.length === 0) continue;
    declaring.push({ n: shard?.n, count: entries.length });
  }
  const declaredEdges = declaring.reduce((sum, { count }) => sum + count, 0);
  const declaredShards = declaring.map(({ n }) => n);
  let map = merged;
  if (typeof map === "string") {
    try {
      map = JSON.parse(map);
    } catch {
      map = null;
    }
  }
  const mergedEdges = map !== null && typeof map === "object" && Array.isArray(map.edges) ? map.edges.length : null;
  const problems = [];
  if (declaredEdges > 0 && mergedEdges !== null && mergedEdges === 0) {
    problems.push(`\u5206\u7247\u4FA7\u58F0\u660E\u8FC7 ${declaredEdges} \u6761\u8FB9\uFF08${declaring.map(({ n, count }) => `\u7B2C ${n} \u8DEF ${count} \u6761`).join("\u3001")}\uFF09\uFF0C\u5408\u5E76\u4EF6\u91CC\u5374\u4E00\u6761\u8FB9\u90FD\u6CA1\u6709\u2014\u2014\u8FB9\u8868\u88AB\u6574\u4EFD\u4E22\u5149\u4E86`);
  }
  if (declaredEdges > 0 && mergedEdges === null) {
    problems.push(`\u5206\u7247\u4FA7\u58F0\u660E\u8FC7 ${declaredEdges} \u6761\u8FB9\uFF08${declaring.map(({ n, count }) => `\u7B2C ${n} \u8DEF ${count} \u6761`).join("\u3001")}\uFF09\uFF0C\u5408\u5E76\u4EF6\u91CC\u8FDE edges \u6570\u7EC4\u90FD\u6CA1\u6709\u2014\u2014\u8FB9\u8868\u6574\u4EFD\u4E0D\u5728`);
  }
  return { declaredShards, declaredEdges, mergedEdges, problems };
}

// src/workflow/knowledge-map-merge.js
var MERGED_FROM_FIELD = "mergedFrom";
var LOCATIONS_FIELD = "locations";
var ALIGNMENT_KEYS = Object.freeze(["merges"]);
var MATERIAL_KEY_RE = /^M(\d+)-/u;
var CONSUMED_KINDS = Object.freeze(["alias", "see-also"]);
var ALIGNMENT_PROBLEM_CODES = Object.freeze([
  "alignment-not-object",
  "alignment-key-unknown",
  "alignment-merges-shape",
  "alignment-group-shape",
  "alignment-key-unknown-card",
  "alignment-key-reused",
  "alignment-group-not-cross-material",
  "alignment-card-material-unknown",
  "alignment-card-point-missing"
]);
function nonEmptyText2(value) {
  return typeof value === "string" && value.trim() !== "";
}
function materialOfCardKey(key) {
  if (!nonEmptyText2(key)) return null;
  const match = MATERIAL_KEY_RE.exec(key.trim());
  if (match === null) return null;
  const n = Number(match[1]);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}
function materialNumbersOfCard(card) {
  const found = /* @__PURE__ */ new Set();
  const eat = (key) => {
    const n = materialOfCardKey(key);
    if (n !== null) found.add(n);
  };
  eat(card?.key);
  for (const row of Array.isArray(card?.[MERGED_FROM_FIELD]) ? card[MERGED_FROM_FIELD] : []) {
    eat(row?.key);
  }
  return [...found].sort((a, b) => a - b);
}
function cardMaterialIndex(cards) {
  const index = /* @__PURE__ */ new Map();
  for (const card of Array.isArray(cards) ? cards : []) {
    if (!isPlainObject(card) || !nonEmptyText2(card.key)) continue;
    index.set(card.key, materialNumbersOfCard(card));
  }
  return index;
}
function isCrossMaterialEdge(edge, index) {
  const from = index.get(edge?.from) ?? [];
  const to = index.get(edge?.to) ?? [];
  if (from.length === 0 || to.length === 0) return true;
  return !from.some((n) => to.includes(n));
}

// src/workflow/knowledge-map-gate.js
var KNOWLEDGE_CONFIDENCE_LEVELS = LEVELS;
var GRAPH_KEYS = Object.freeze(["cards", "edges"]);
var CARD_REQUIRED_FIELDS = Object.freeze(["key", "name", "testable", "anchor", "confidence"]);
var EDGE_REQUIRED_FIELDS = Object.freeze(["from", "to", "kind", "confidence", "reason"]);
var GATE_PROBLEM_CODES = Object.freeze([
  "graph-keys-missing",
  "graph-key-not-array",
  "cards-empty",
  "card-not-object",
  "card-field-missing",
  "card-confidence-out-of-domain",
  "card-key-duplicate",
  "card-anchor-shape",
  "cards-points-bijection",
  "edge-not-object",
  "edge-field-missing",
  "edge-confidence-out-of-domain",
  "edge-duplicate",
  "edge-endpoint-unknown",
  // 以下六个由票 02 的 `prereqShapeProblems` 原样透传（口径只此一处）：
  "edge-kind-missing",
  "edge-kind-unknown",
  "edge-endpoint-missing",
  "edge-self-loop",
  "edge-antisymmetric",
  "prereq-cycle",
  // 票 06：位置索引与 `mergedFrom`（spec §5 第 6 条）与**跨材料的边**（第 8 条）
  "card-locations-shape",
  "card-locations-material-unknown",
  "card-merged-from-shape",
  "merged-card-not-absorbed",
  "merged-card-as-edge-endpoint",
  "merged-card-locations-too-few",
  "cross-material-prereq-confidence",
  // 守卫 (b)：票 01 的独立读数
  "edges-lost"
]);
function nonEmptyText3(value) {
  return typeof value === "string" && value.trim() !== "";
}
function shapeOf2(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return `\u6570\u7EC4(${value.length})`;
  if (typeof value === "string") return value === "" ? "\u7A7A\u4E32" : `\u5B57\u7B26\u4E32(${value.length} \u5B57)`;
  if (value === void 0) return "\u6CA1\u8FD9\u4E2A\u952E";
  return typeof value;
}
function cardLabel(card, index) {
  const key = nonEmptyText3(card?.key) ? card.key : `\u7B2C ${index + 1} \u5F20\u5361`;
  const name = nonEmptyText3(card?.name) ? `\u300C${card.name}\u300D` : "";
  return `${key}${name}`;
}
function edgeLabel(edge, index) {
  const from = nonEmptyText3(edge?.from) ? edge.from : "\uFF08\u7F3A from\uFF09";
  const to = nonEmptyText3(edge?.to) ? edge.to : "\uFF08\u7F3A to\uFF09";
  return `${from} \u2192 ${to}\uFF08\u8FB9 #${index}\uFF09`;
}
function anchorProblems(card, index) {
  const label = cardLabel(card, index);
  const anchor = card?.anchor;
  if (!Array.isArray(anchor) || anchor.length === 0) {
    return [{ code: "card-anchor-shape", cardIndex: index, message: `\u5361 ${label} \u7684 anchor \u5FC5\u987B\u662F\u975E\u7A7A\u6570\u7EC4\uFF08\u9010\u9879 {start,end} \u7684 1 \u57FA\u884C\u53F7\u533A\u95F4\uFF09\uFF0C\u5B9E\u4E3A ${shapeOf2(anchor)}\u2014\u2014\u300C\u884C 609\u2013617\uFF08\u2026\uFF09\u300D\u90A3\u79CD\u6563\u6587\u951A\u673A\u5668\u5224\u4E0D\u4E86\u533A\u95F4\uFF0C\u8BF4\u660E\u5199\u8FDB testable\u3002` }];
  }
  const problems = [];
  let previousEnd = null;
  anchor.forEach((item, at) => {
    const where = `\u5361 ${label} \u7684 anchor \u7B2C ${at + 1} \u9879`;
    if (!isPlainObject(item)) {
      problems.push({ code: "card-anchor-shape", cardIndex: index, anchorIndex: at, message: `${where} \u4E0D\u662F {start,end} \u5BF9\u8C61\uFF08\u5B9E\u4E3A ${shapeOf2(item)}\uFF09` });
      previousEnd = null;
      return;
    }
    const { start, end } = item;
    const badStart = !Number.isSafeInteger(start) || start < 1;
    const badEnd = !Number.isSafeInteger(end) || end < 1;
    if (badStart || badEnd) {
      problems.push({ code: "card-anchor-shape", cardIndex: index, anchorIndex: at, message: `${where} \u7684 start\uFF0Fend \u5FC5\u987B\u662F\u8BE5\u6750\u6599\u8F6C\u6362\u7A3F\u91CC\u7684 1 \u57FA\u884C\u53F7\uFF08\u6B63\u6574\u6570\uFF09\uFF0C\u5B9E\u4E3A start=${shapeOf2(start)}\u3001end=${shapeOf2(end)}` });
      previousEnd = null;
      return;
    }
    if (start > end) {
      problems.push({ code: "card-anchor-shape", cardIndex: index, anchorIndex: at, message: `${where} \u7684 start(${start}) \u5927\u4E8E end(${end})\u2014\u2014\u884C\u6BB5\u5FC5\u987B start \u2264 end` });
      previousEnd = null;
      return;
    }
    if (previousEnd !== null && start <= previousEnd) {
      problems.push({ code: "card-anchor-shape", cardIndex: index, anchorIndex: at, message: `${where}\uFF08${start}\u2013${end}\uFF09\u4E0E\u524D\u4E00\u9879\uFF08\u2026\u2013${previousEnd}\uFF09\u91CD\u53E0\u6216\u6CA1\u6309 start \u5347\u5E8F\u2014\u2014\u9879\u95F4\u4E0D\u91CD\u53E0\u4E14\u6309 start \u5347\u5E8F\u662F \xA78.1 \u7684\u5F62\u72B6` });
    }
    previousEnd = end;
  });
  return problems;
}
function cardProblems(cards) {
  const problems = [];
  const seen = /* @__PURE__ */ new Map();
  cards.forEach((card, index) => {
    if (!isPlainObject(card)) {
      problems.push({ code: "card-not-object", cardIndex: index, message: `cards \u7B2C ${index + 1} \u9879\u4E0D\u662F\u5BF9\u8C61\uFF08\u5B9E\u4E3A ${shapeOf2(card)}\uFF09` });
      return;
    }
    const label = cardLabel(card, index);
    for (const field of CARD_REQUIRED_FIELDS) {
      const value = card[field];
      if (field === "anchor") continue;
      if (!nonEmptyText3(value)) {
        problems.push({ code: "card-field-missing", cardIndex: index, field, message: `\u5361 ${label} \u7684 ${field} \u5FC5\u987B\u662F\u975E\u7A7A\u5B57\u7B26\u4E32\uFF08\u5B9E\u4E3A ${shapeOf2(value)}\uFF09` });
      }
    }
    if (nonEmptyText3(card.confidence) && !KNOWLEDGE_CONFIDENCE_LEVELS.includes(card.confidence.trim())) {
      problems.push({ code: "card-confidence-out-of-domain", cardIndex: index, field: "confidence", message: `\u5361 ${label} \u7684\u628A\u63E1\u6863\u662F\u300C${card.confidence}\u300D\uFF0C\u4E0D\u5728\u53D6\u503C\u57DF ${KNOWLEDGE_CONFIDENCE_LEVELS.join("\uFF0F")} \u4E4B\u5185` });
    }
    problems.push(...anchorProblems(card, index));
    if (nonEmptyText3(card.key)) {
      const key = card.key;
      if (seen.has(key)) {
        problems.push({ code: "card-key-duplicate", cardIndex: index, key, message: `\u5361 ${label} \u7684 key\u300C${key}\u300D\u5728\u672C\u56FE\u91CC\u51FA\u73B0\u4E86\u4E0D\u6B62\u4E00\u6B21\uFF08\u7B2C ${seen.get(key) + 1} \u9879\u4E0E\u7B2C ${index + 1} \u9879\uFF09\u2014\u2014key \u662F\u4E66\u5185\u590D\u5408\u952E\uFF0C\u91CD\u590D\u4F1A\u8BA9\u8FB9\u7AEF\u6307\u8C01\u6709\u6B67\u4E49` });
      } else {
        seen.set(key, index);
      }
    }
  });
  return { problems, keys: seen };
}
function edgeProblems(edges, cardKeys) {
  const problems = [];
  const seen = /* @__PURE__ */ new Set();
  edges.forEach((edge, index) => {
    if (!isPlainObject(edge)) {
      problems.push({ code: "edge-not-object", edgeIndex: index, message: `edges \u7B2C ${index + 1} \u9879\u4E0D\u662F\u5BF9\u8C61\uFF08\u5B9E\u4E3A ${shapeOf2(edge)}\uFF09` });
      return;
    }
    const label = edgeLabel(edge, index);
    for (const field of EDGE_REQUIRED_FIELDS) {
      if (field === "kind") continue;
      if (!nonEmptyText3(edge[field])) {
        problems.push({ code: "edge-field-missing", edgeIndex: index, field, message: `\u8FB9 #${index}\uFF08${label}\uFF09\u7684 ${field} \u5FC5\u987B\u662F\u975E\u7A7A\u5B57\u7B26\u4E32\uFF08\u5B9E\u4E3A ${shapeOf2(edge[field])}\uFF09` });
      }
    }
    if (nonEmptyText3(edge.confidence) && !KNOWLEDGE_CONFIDENCE_LEVELS.includes(edge.confidence.trim())) {
      problems.push({ code: "edge-confidence-out-of-domain", edgeIndex: index, field: "confidence", message: `\u8FB9 #${index}\uFF08${label}\uFF09\u7684\u628A\u63E1\u6863\u662F\u300C${edge.confidence}\u300D\uFF0C\u4E0D\u5728\u53D6\u503C\u57DF ${KNOWLEDGE_CONFIDENCE_LEVELS.join("\uFF0F")} \u4E4B\u5185` });
    }
    for (const side of ["from", "to"]) {
      const value = edge[side];
      if (!nonEmptyText3(value)) continue;
      if (!cardKeys.has(value)) {
        problems.push({ code: "edge-endpoint-unknown", edgeIndex: index, side, message: `\u8FB9 #${index}\uFF08${label}\uFF09\u7684 ${side}\u300C${value}\u300D\u4E0D\u5728 cards \u7684 key \u91CC\u2014\u2014\u8FB9\u7684\u4E24\u7AEF\u5FC5\u987B\u662F\u5361\uFF08\u4E66\u5185\u590D\u5408\u952E\uFF09` });
      }
    }
    if (nonEmptyText3(edge.from) && nonEmptyText3(edge.to) && nonEmptyText3(edge.kind)) {
      const signature = `${edge.from}\0${edge.to}\0${edge.kind}`;
      if (seen.has(signature)) {
        problems.push({ code: "edge-duplicate", edgeIndex: index, message: `\u8FB9 #${index}\uFF08${label}\uFF09\u4E0E\u524D\u9762\u90A3\u6761 from\uFF0Fto\uFF0Fkind \u5B8C\u5168\u76F8\u540C\u2014\u2014\u540C\u4E00\u4EF6\u4E8B\u5199\u4E86\u4E24\u904D\uFF08\u540C\u4E00\u5BF9\u5361\u4E0A\u7684\u4E0D\u540C kind \u662F\u5408\u6CD5\u7684\uFF0C\u91CD\u590D\u7684\u662F\u8FD9\u4E09\u6837\u90FD\u4E00\u6837\u7684\u90A3\u6761\uFF09` });
      } else {
        seen.add(signature);
      }
    }
  });
  return problems;
}
function bijectionProblems(cards, points) {
  const problems = [];
  const text = (value) => typeof value === "string" ? value : `\0\u975E\u6587\u672C(${typeof value}):${String(value)}`;
  const tally = (list, side, pick) => {
    const map = /* @__PURE__ */ new Map();
    for (const item of list) {
      const value = pick(item);
      const key = text(value);
      const row = map.get(key) ?? { value, card: 0, point: 0 };
      row[side] += 1;
      map.set(key, row);
    }
    return map;
  };
  const cardCounts = tally(cards, "card", (card) => card?.name);
  const pointCounts = tally(points, "point", (point) => point?.title);
  const allKeys = [.../* @__PURE__ */ new Set([...cardCounts.keys(), ...pointCounts.keys()])].sort();
  for (const key of allKeys) {
    const card = cardCounts.get(key)?.card ?? 0;
    const point = pointCounts.get(key)?.point ?? 0;
    if (card === point) continue;
    const value = (cardCounts.get(key) ?? pointCounts.get(key)).value;
    if (point === 0) {
      problems.push({ code: "cards-points-bijection", value, card, point, message: `\u5361\u300C${String(value)}\u300D\u51FA\u73B0\u4E86 ${card} \u5F20\uFF0C\u77E5\u8BC6\u70B9\u91CC\u4E00\u6761\u90FD\u6CA1\u6709\u2014\u2014\u5361\u5FC5\u987B 1:1 \u4ECE\u77E5\u8BC6\u70B9\u6D3E\u751F\uFF08\u5361\u7684 name \u9010\u5B57\u7B49\u4E8E knowledgePoints[].title\uFF09` });
    } else if (card === 0) {
      problems.push({ code: "cards-points-bijection", value, card, point, message: `\u77E5\u8BC6\u70B9\u300C${String(value)}\u300D\u6709 ${point} \u6761\uFF0C\u56FE\u91CC\u4E00\u5F20\u5361\u90FD\u6CA1\u6709\u2014\u2014\u6BCF\u6761\u77E5\u8BC6\u70B9\u90FD\u8981\u6709\u4E00\u5F20\u5361\uFF081:1 \u6D3E\u751F\uFF09` });
    } else {
      problems.push({ code: "cards-points-bijection", value, card, point, message: `\u300C${String(value)}\u300D\u5728\u56FE\u4E0A\u51FA\u73B0 ${card} \u6B21\u3001\u5728\u77E5\u8BC6\u70B9\u91CC\u51FA\u73B0 ${point} \u6761\u2014\u2014\u9010\u9879\u8BA1\u6570\u5BF9\u4E0D\u4E0A\uFF08\u96C6\u5408\u53E3\u5F84\u4F1A\u628A\u8FD9\u79CD\u300C\u4E00\u5F20\u5361\u91CD\u590D\u4E24\u6B21\u3001\u53E6\u4E00\u6761\u6CA1\u6709\u5361\u300D\u4E92\u76F8\u62B5\u6389\uFF0C\u6240\u4EE5\u8FD9\u91CC\u6309\u9010\u9879\u8BA1\u6570\u5224\uFF09` });
    }
  }
  if (problems.length === 0 && cards.length !== points.length) {
    problems.push({ code: "cards-points-bijection", value: null, card: cards.length, point: points.length, message: `\u5361 ${cards.length} \u5F20\u3001\u77E5\u8BC6\u70B9 ${points.length} \u6761\uFF0C\u6761\u6570\u4E0D\u76F8\u7B49\uFF08\u9010\u9879\u8BA1\u6570\u6CA1\u67E5\u51FA\u5DEE\u5F02\u2014\u2014\u8BF7\u8FDE\u540C\u8FD9\u4E00\u6761\u4E00\u8D77\u62A5\uFF0C\u522B\u9759\u9ED8\uFF09` });
  }
  return problems;
}
function mergeShapeProblems({ cards, edges, materialNumbers }) {
  const problems = [];
  const readings = { locationCards: 0, mergedCards: 0, absorbedCards: 0 };
  const cardKeys = /* @__PURE__ */ new Set();
  for (const card of cards) if (isPlainObject(card) && nonEmptyText3(card.key)) cardKeys.add(card.key);
  const absorbedKeys = /* @__PURE__ */ new Set();
  for (const card of cards) {
    if (!isPlainObject(card)) continue;
    for (const row of Array.isArray(card[MERGED_FROM_FIELD]) ? card[MERGED_FROM_FIELD] : []) {
      if (isPlainObject(row) && nonEmptyText3(row.key)) absorbedKeys.add(row.key);
    }
  }
  readings.absorbedCards = absorbedKeys.size;
  const materialsText = [...materialNumbers].sort((a, b) => a - b).join("\uFF0F");
  cards.forEach((card, index) => {
    if (!isPlainObject(card)) return;
    const label = cardLabel(card, index);
    if (Object.hasOwn(card, LOCATIONS_FIELD)) {
      const locations = card[LOCATIONS_FIELD];
      if (!Array.isArray(locations) || locations.length === 0) {
        problems.push({ code: "card-locations-shape", cardIndex: index, message: `\u5361 ${label} \u7684 locations \u5FC5\u987B\u662F\u975E\u7A7A\u6570\u7EC4\uFF08\u9010\u9879 {material,start,end} \u7684\u4F4D\u7F6E\u7D22\u5F15\uFF1B\u5B9E\u4E3A ${shapeOf2(locations)}\uFF09\u2014\u2014\u5B83\u7531\u5408\u5E76\u90A3\u4E00\u6B65\u4EA7\u51FA\uFF0C\u7A7A\u6570\u7EC4\u7B49\u4E8E\u300C\u8FD9\u4E00\u6761\u539F\u6587\u5728\u54EA\u300D\u8FD9\u4E00\u680F\u6CA1\u7ED9` });
      } else {
        readings.locationCards += 1;
        locations.forEach((item, at) => {
          const where = `\u5361 ${label} \u7684 locations \u7B2C ${at + 1} \u9879`;
          if (!isPlainObject(item)) {
            problems.push({ code: "card-locations-shape", cardIndex: index, locationIndex: at, message: `${where} \u4E0D\u662F {material,start,end} \u5BF9\u8C61\uFF08\u5B9E\u4E3A ${shapeOf2(item)}\uFF09` });
            return;
          }
          const { material, start, end } = item;
          if (!Number.isSafeInteger(material) || !materialNumbers.has(material)) {
            problems.push({ code: "card-locations-material-unknown", cardIndex: index, locationIndex: at, material, message: `${where} \u7684\u6750\u6599\u53F7\u662F ${shapeOf2(material)}\uFF0C\u4E0D\u5728 materials[].num\uFF08${materialsText === "" ? "\u4E00\u4E2A\u90FD\u6CA1\u6709" : materialsText}\uFF09\u91CC\u2014\u2014\u4F4D\u7F6E\u7D22\u5F15\u53EA\u5BF9**\u6750\u6599\u53F7**\u8D1F\u8D23\uFF0C\u6253\u4E0D\u4E2D\u5C31\u7B49\u4E8E\u8FD9\u6761\u7D22\u5F15\u6307\u4E0D\u5230\u4EFB\u4F55\u4E00\u4EFD\u6750\u6599` });
          }
          if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end < 1 || start > end) {
            problems.push({ code: "card-locations-shape", cardIndex: index, locationIndex: at, message: `${where} \u7684\u884C\u6BB5\u5FC5\u987B\u662F\u8BE5\u6750\u6599\u8F6C\u6362\u7A3F\u91CC\u7684 1 \u57FA\u884C\u53F7\u4E14 start \u2264 end\uFF08\u5B9E\u4E3A start=${shapeOf2(start)}\u3001end=${shapeOf2(end)}\uFF09` });
          }
        });
      }
    }
    if (!Object.hasOwn(card, MERGED_FROM_FIELD)) return;
    const rows = card[MERGED_FROM_FIELD];
    if (!Array.isArray(rows) || rows.length === 0) {
      problems.push({ code: "card-merged-from-shape", cardIndex: index, message: `\u5361 ${label} \u7684 ${MERGED_FROM_FIELD} \u5FC5\u987B\u662F\u975E\u7A7A\u6570\u7EC4\uFF08\u88AB\u5E76\u7684\u90A3\u6761**\u6574\u5F20**\u8BB0\u5728\u8FD9\u91CC\uFF1Akey\uFF0Fname\uFF0Ftestable\uFF0Fanchor \u90FD\u5728\u3001\u53EF\u56DE\u6EDA\uFF1B\u5B9E\u4E3A ${shapeOf2(rows)}\uFF09` });
      return;
    }
    readings.mergedCards += 1;
    rows.forEach((row, at) => {
      const where = `\u5361 ${label} \u7684 ${MERGED_FROM_FIELD} \u7B2C ${at + 1} \u9879\uFF08\u88AB\u5E76\u7684\u90A3\u4E00\u6761\uFF09`;
      if (!isPlainObject(row)) {
        problems.push({ code: "card-merged-from-shape", cardIndex: index, mergedFromIndex: at, message: `${where} \u4E0D\u662F\u4E00\u5F20\u5361\u7684\u5BF9\u8C61\uFF08\u5B9E\u4E3A ${shapeOf2(row)}\uFF09\u2014\u2014\u88AB\u5E76\u7684\u90A3\u6761\u8981\u6574\u5F20\u7559\u7740\uFF0C\u624D\u80FD\u56DE\u6EDA` });
        return;
      }
      for (const field of ["key", "name", "testable"]) {
        if (!nonEmptyText3(row[field])) {
          problems.push({ code: "card-merged-from-shape", cardIndex: index, mergedFromIndex: at, field, message: `${where} \u7684 ${field} \u5FC5\u987B\u662F\u975E\u7A7A\u5B57\u7B26\u4E32\uFF08\u5B9E\u4E3A ${shapeOf2(row[field])}\uFF09\u2014\u2014\u300C\u6574\u5F20\u8BB0\u8FDB mergedFrom\u300D\u7684\u5F3A\u5EA6\u5C31\u662F\u8FD9\u51E0\u6837\u90FD\u5728` });
        }
      }
      const anchorHit = anchorProblems({ key: nonEmptyText3(row.key) ? row.key : `\u7B2C ${at + 1} \u9879`, name: row.name, anchor: row.anchor }, index);
      if (anchorHit.length > 0) {
        problems.push({ code: "card-merged-from-shape", cardIndex: index, mergedFromIndex: at, message: `${where} \u7684\u539F\u6587\u951A\u4E0D\u6210\u5F62\u72B6\uFF1A${anchorHit[0].message}` });
      }
    });
    const locationCount = Array.isArray(card[LOCATIONS_FIELD]) ? card[LOCATIONS_FIELD].length : 0;
    if (locationCount < 2) {
      problems.push({ code: "merged-card-locations-too-few", cardIndex: index, locations: locationCount, message: `\u5361 ${label} \u5E26\u4E86 ${MERGED_FROM_FIELD}\uFF08\u5E76\u4E86 ${rows.length} \u5F20\uFF09\u5374\u53EA\u6709 ${locationCount} \u6761\u4F4D\u7F6E\u7D22\u5F15\u2014\u2014\u5408\u5E76\u4E0D\u662F\u65AD\u6599\uFF1A\u7559\u4E0B\u7684\u8FD9\u4E00\u6761\u81F3\u5C11\u8981\u6307\u5F97\u56DE 2 \u5904\u539F\u6587\uFF08\u5B83\u81EA\u5DF1\u90A3\u4EFD \uFF0B \u88AB\u5E76\u7684\u5404\u6761\u81F3\u5C11\u4E00\u5904\uFF09` });
    }
  });
  for (const key of absorbedKeys) {
    if (cardKeys.has(key)) {
      problems.push({ code: "merged-card-not-absorbed", key, message: `\u5361\u300C${key}\u300D\u5DF2\u7ECF\u88AB\u5E76\u8FDB survivor \u7684 ${MERGED_FROM_FIELD} \u91CC\uFF0C\u5374\u8FD8\u7559\u5728 cards \u91CC\u2014\u2014\u5408\u5E76\u4E4B\u540E\u5B83\u4E0D\u518D\u662F\u4E00\u5F20\u5361\uFF08\u7559\u7740\u5B83\uFF0C1:1 \u53CC\u5C04\u4E0E\u8FB9\u7AEF\u90FD\u4F1A\u6307\u9519\u4EBA\uFF09` });
    }
    edges.forEach((edge, index) => {
      if (!isPlainObject(edge)) return;
      for (const side of ["from", "to"]) {
        if (edge[side] !== key) continue;
        problems.push({ code: "merged-card-as-edge-endpoint", edgeIndex: index, side, key, message: `\u8FB9 #${index}\uFF08${edgeLabel(edge, index)}\uFF09\u7684 ${side}\u300C${key}\u300D\u662F\u4E00\u5F20**\u5DF2\u88AB\u5E76\u6389**\u7684\u5361\u2014\u2014\u5B83\u7684\u8FB9\u8981\u6539\u6307 survivor\uFF08\u5408\u5E76\u662F\u5E76\u96C6\uFF0C\u26D4 \u4E0D\u662F\u628A\u8FB9\u4E22\u6389\uFF09` });
      }
    });
  }
  return { problems, readings };
}
function crossMaterialProblems(edges, materialIndex) {
  const problems = [];
  const readings = { crossMaterialEdges: 0, crossMaterialPrereq: 0 };
  edges.forEach((edge, index) => {
    if (!isPlainObject(edge)) return;
    if (!isCrossMaterialEdge(edge, materialIndex)) return;
    readings.crossMaterialEdges += 1;
    if (edge.kind !== "prereq") return;
    readings.crossMaterialPrereq += 1;
    if (!nonEmptyText3(edge.confidence)) return;
    if (!CROSS_MATERIAL_PREREQ_LEVELS.includes(edge.confidence.trim())) {
      problems.push({ code: "cross-material-prereq-confidence", edgeIndex: index, confidence: edge.confidence, message: `\u8FB9 #${index}\uFF08${edgeLabel(edge, index)}\uFF09\u662F**\u8DE8\u6750\u6599**\u7684 ${edge.kind}\uFF0C\u628A\u63E1\u6863\u5374\u5199\u7740\u300C${edge.confidence}\u300D\u2014\u2014\u4E24\u4EFD\u6750\u6599\u4E4B\u95F4\u7684\u5148\u540E\u5173\u7CFB\u6CA1\u4EBA\u6838\u8FC7\uFF0C\u53EA\u80FD\u5199 ${CROSS_MATERIAL_PREREQ_LEVELS.join("\uFF0F")}\uFF08\u26D4 \u8FD9\u6761\u4E0A\u9650**\u53EA\u538B ${edge.kind}**\uFF1A\u8DE8\u6750\u6599\u7684 see-also \u4E0D\u4E3B\u5F20\u65B9\u5411\u3001\u4E0D\u53D7\u5B83\u7EA6\u675F\uFF09` });
    }
  });
  return { problems, readings };
}
function edgeScanText(scan) {
  if (scan === null || typeof scan !== "object") return "\u672C\u6B21\u626B\u9762 0 \u6761\u8FB9";
  const total = Number.isSafeInteger(scan.edges) ? scan.edges : 0;
  return `\u672C\u6B21\u626B\u9762 ${total} \u6761\u8FB9\uFF08prereq ${scan.prereq ?? 0}\uFF0Falias ${scan.alias ?? 0}\uFF0Fsee-also ${scan.seeAlso ?? 0}\uFF09`;
}
function knowledgeMapGateProblems({ merged, shards = [] } = {}) {
  const readings = {
    graphPresent: false,
    cards: null,
    edges: null,
    edgeScan: null,
    edgeScanText: null,
    zeroEdges: null,
    declaredShards: [],
    declaredEdges: 0,
    mergedEdges: null,
    // 票 06：位置索引／合并／跨材料那三组各一条读数（⛔ 都是**非阻断读数**：闸只按 problems 拒收）。
    locationCards: 0,
    mergedCards: 0,
    absorbedCards: 0,
    crossMaterialEdges: 0,
    crossMaterialPrereq: 0
  };
  if (!isPlainObject(merged)) {
    return { problems: [{ code: "graph-keys-missing", message: `\u5408\u5E76\u4EF6\u4E0D\u662F\u4E00\u4E2A JSON \u5BF9\u8C61\uFF08\u5B9E\u4E3A ${shapeOf2(merged)}\uFF09\u2014\u2014\u5F62\u72B6\u95F8\u65E0\u4ECE\u8C08\u8D77` }], readings };
  }
  const hasCards = Object.hasOwn(merged, "cards");
  const hasEdges = Object.hasOwn(merged, "edges");
  if (!hasCards && !hasEdges) return { problems: [], readings };
  readings.graphPresent = true;
  const problems = [];
  for (const key of GRAPH_KEYS) {
    if (!Object.hasOwn(merged, key)) {
      problems.push({ code: "graph-keys-missing", key, message: `\u5408\u5E76\u4EF6\u91CC\u51FA\u73B0\u4E86\u56FE\u952E\uFF0C\u4F46\u5C11\u4E86\u300C${key}\u300D\u2014\u2014${GRAPH_KEYS.join("\uFF0F")} \u4E24\u4E2A\u952E\u8981\u4E48\u90FD\u5728\u3001\u8981\u4E48\u90FD\u4E0D\u5728\uFF08\u53EA\u6709\u4E00\u4E2A\u7684\u90A3\u4E00\u4EFD\u6CA1\u6CD5\u5224\uFF09` });
      continue;
    }
    if (!Array.isArray(merged[key])) {
      problems.push({ code: "graph-key-not-array", key, message: `\u5408\u5E76\u4EF6\u7684\u300C${key}\u300D\u5FC5\u987B\u662F\u6570\u7EC4\uFF0C\u5B9E\u4E3A ${shapeOf2(merged[key])}` });
    }
  }
  if (problems.length > 0) return { problems, readings };
  const cards = merged.cards;
  const edges = merged.edges;
  readings.cards = cards.length;
  readings.edges = edges.length;
  const cardGroup = cardProblems(cards);
  problems.push(...cardGroup.problems);
  problems.push(...edgeProblems(edges, cardGroup.keys));
  const shape = prereqShapeProblems(edges, { cards });
  readings.edgeScan = shape.scan;
  readings.edgeScanText = edgeScanText(shape.scan);
  readings.zeroEdges = shape.scan.edges === 0;
  problems.push(...shape.problems);
  const points = Array.isArray(merged.knowledgePoints) ? merged.knowledgePoints : [];
  problems.push(...bijectionProblems(cards, points));
  const materialNumbers = new Set((Array.isArray(merged.materials) ? merged.materials : []).map((row) => isPlainObject(row) ? row.num : void 0).filter((n) => Number.isSafeInteger(n)));
  const mergeGroup = mergeShapeProblems({ cards, edges, materialNumbers });
  problems.push(...mergeGroup.problems);
  readings.locationCards = mergeGroup.readings.locationCards;
  readings.mergedCards = mergeGroup.readings.mergedCards;
  readings.absorbedCards = mergeGroup.readings.absorbedCards;
  const crossGroup = crossMaterialProblems(edges, cardMaterialIndex(cards));
  problems.push(...crossGroup.problems);
  readings.crossMaterialEdges = crossGroup.readings.crossMaterialEdges;
  readings.crossMaterialPrereq = crossGroup.readings.crossMaterialPrereq;
  if (cards.length === 0) {
    problems.push({ code: "cards-empty", message: "\u5408\u5E76\u4EF6\u7684 cards \u662F\u7A7A\u6570\u7EC4\u2014\u2014\u56FE\u952E\u5728\u3001\u4E00\u5F20\u5361\u90FD\u6CA1\u6709\uFF0C\u8FD9\u4E00\u9053\u7684\u5176\u4F59\u5224\u636E\u5168\u6210\u4E86\u7A7A\u8F6C\uFF08\u7A7A\u626B\u5B88\u536B\uFF09\uFF1B\u8981\u4E48\u522B\u843D\u56FE\u952E\uFF08\u8001\u4E66\u90A3\u4E00\u6863\uFF09\uFF0C\u8981\u4E48\u628A\u5361\u4EA7\u51FA\u6765" });
  }
  const scan = scanKnowledgeMapEdges(shards, merged);
  readings.declaredShards = scan.declaredShards;
  readings.declaredEdges = scan.declaredEdges;
  readings.mergedEdges = scan.mergedEdges;
  for (const text of scan.problems) problems.push({ code: "edges-lost", message: text });
  return { problems, readings };
}

// src/knowledge-graph-door.js
function edgeScanReading(merged) {
  if (merged === null || typeof merged !== "object") {
    return { text: edgeScanText(null), zeroEdges: null, graphPresent: false };
  }
  const { readings } = knowledgeMapGateProblems({ merged });
  return {
    text: readings.edgeScanText ?? edgeScanText(null),
    zeroEdges: readings.zeroEdges,
    graphPresent: readings.graphPresent === true
  };
}

// src/outline-limits.js
var OUTLINE_POINTS_MAX = 20;

// src/ui/knowledge-graph-map.js
var KG_CARD_TONES = Object.freeze({
  keep: Object.freeze({
    label: "\u8981\u8BB2",
    background: "var(--dsw-alias-state-success-tertiary)",
    border: "var(--dsw-alias-state-success-secondary)",
    color: "var(--dsw-alias-state-success-primary)",
    borderStyle: "solid",
    strike: false
  }),
  frontier: Object.freeze({
    label: "\u73B0\u5728\u8F6E\u5230",
    background: "var(--dsw-alias-state-success-primary)",
    border: "var(--dsw-alias-state-success-secondary)",
    color: "var(--dsw-alias-label-primary-foreground)",
    borderStyle: "solid",
    strike: false
  }),
  upper: Object.freeze({
    label: "\u4E0A\u7AEF",
    // 票 16：蓝底 ＋ 正文色 `label-primary`。⛔ 不用 `business-primary` 做底——那一档在亮色下
    // 配白字只有 4.23:1、低于既有那把尺子的 4.39 地板；这一组是一份**机器可量**的对比度读数
    // （亮 16.04／暗 9.79），颜色仍只走宿主 alias 槽位、⛔ 不新造 hex。
    background: "var(--dsw-alias-state-business-tertiary)",
    border: "var(--dsw-alias-state-business-primary)",
    color: "var(--dsw-alias-label-primary)",
    borderStyle: "solid",
    strike: false
  }),
  dropped: Object.freeze({
    label: "\u5DF2\u5426",
    background: "var(--dsw-alias-bg-skeleton)",
    border: "var(--dsw-alias-border-l2)",
    color: "var(--dsw-alias-label-secondary)",
    borderStyle: "dashed",
    strike: true
  })
});
var KG_LEGEND_ORDER = Object.freeze(["keep", "frontier", "upper", "dropped"]);
var KG_VERDICTS = Object.freeze({ drop: "\u4E0D\u8BB2", keep: "\u8981\u8BB2" });
var KG_DIALOG_KEYS = Object.freeze({
  drop: "\u{1F5D1} \u8FD9\u90E8\u5206\u4E0D\u9020\u8FDB\u4E66\u91CC",
  hold: "\u5148\u4E0D\u52A8\u5B83",
  restore: "\u21A9 \u653E\u56DE\u6765\uFF08\u8981\u8BB2\uFF09",
  close: "\u5173\u95ED"
});
var KG_SCRAPER = Object.freeze({
  arm: "\u2702 \u4ECE\u8D77\u70B9\u5F80\u4E0B\u5212\u8FD9\u4E00\u7247\uFF08\u5DF2\u7ECF\u4F1A\uFF09",
  disarm: "\u2702 \u6536\u8D77\u5212\u5B50\uFF08\u70B9\u5361\u7167\u65E7\u5F39\u300C\u8981\u4E0D\u8981\u8BB2\u300D\uFF09"
});
var NO_KEYS = Object.freeze([]);
var KG_EDGE_STYLE_BY_LEVEL = Object.freeze({
  strong: Object.freeze({ stroke: "#475569", width: 1.5, dash: null, opacity: 1 }),
  middle: Object.freeze({ stroke: "#94a3b8", width: 1.1, dash: "6 4", opacity: 1 }),
  pending: Object.freeze({ stroke: "#f59e0b", width: 1.3, dash: "2 3", opacity: 0.6 })
});
var KG_EDGE_STROKES = Object.freeze({
  [LEVELS[0]]: KG_EDGE_STYLE_BY_LEVEL.strong,
  [LEVELS[1]]: KG_EDGE_STYLE_BY_LEVEL.middle,
  [LEVELS[2]]: KG_EDGE_STYLE_BY_LEVEL.pending
});
var KG_KIND_STROKES = Object.freeze({
  [EDGE_KINDS[1]]: Object.freeze({ stroke: "#a855f7", width: 1.5, dash: "2 3", opacity: 0.7 }),
  [EDGE_KINDS[2]]: Object.freeze({ stroke: "#a8a29e", width: 1, dash: "1 4", opacity: 0.45 })
});
var KG_CHAIN_INK = "#2563eb";
var KG_CHAIN_OPACITY = Object.freeze({ selected: 1, chain: 0.62, other: 0.26 });
var KG_LAYOUT = Object.freeze({
  cardW: 190,
  minW: 170,
  gapX: 16,
  gapY: 52,
  pad: 10,
  // 判据 8（票 07）：标题从 10.5px 提到三档里的 12px；lineHeight 同时是**布局算高**的输入
  // （`headPx + maxLines * lineHeight`），所以 13→15 会让每张卡变高——改后必须跑 gallery smoke。
  lineHeight: 15,
  headPx: 32,
  titleFontPx: 12,
  // 量不到宽度时按 712 算——那是 1280 右栏收起时的真机宽度
  // （出处：`src/ui/chapters-map.js` 的 `NARROW_MAIN_WIDTH` 注释）。写 0 会让布局退化成每行 1 张。
  fallbackWidth: 712,
  // Node 侧没有排版引擎 ⇒ 「一个字多宽」按实测中位 8.5px 当默认（原型那一轮的取值）。
  fallbackCharW: 8.5,
  // 安全带：量到的字宽 × 1.12（原型实测：打满余量 0 会顶边，保守到 11px 又会少放一张）。
  charWSafety: 1.12
});
var KG_VIEW_MIN_GRAPH_WIDTH = KG_LAYOUT.pad * 2 + KG_LAYOUT.minW;
function gatePrereqEdges(edges) {
  if (!Array.isArray(edges)) return { edges: [], readable: false };
  let all;
  let readable = true;
  try {
    all = prereqEdges(edges);
  } catch {
    readable = false;
    all = edges.filter((edge) => edge !== null && typeof edge === "object" && edge.kind === "prereq");
  }
  return { edges: all.filter((edge) => isDecided(edge.confidence)), readable };
}
function allPrereqEdges(edges) {
  if (!Array.isArray(edges)) return [];
  try {
    return prereqEdges(edges);
  } catch {
    return edges.filter((edge) => edge !== null && typeof edge === "object" && edge.kind === "prereq");
  }
}
function cardSequence(key) {
  const matched = /^M(\d+)-(\d+)-(\d+)$/.exec(String(key));
  if (matched === null) return [99, 99, 99, String(key)];
  return [Number(matched[1]), Number(matched[2]), Number(matched[3]), ""];
}
function compareKeys(a, b) {
  const x = cardSequence(a);
  const y = cardSequence(b);
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2] || (x[3] < y[3] ? -1 : x[3] > y[3] ? 1 : 0);
}
function knowledgeGraphModel(input = {}) {
  const cards = Array.isArray(input.cards) ? input.cards.filter(isCardLike) : [];
  const edges = Array.isArray(input.edges) ? input.edges.filter(isEdgeLike) : [];
  const dropped = new Set(Array.isArray(input.dropped) ? input.dropped : []);
  const ordered = cards.slice().sort((a, b) => compareKeys(a.key, b.key));
  const byKey = new Map(ordered.map((card) => [card.key, card]));
  const gate = gatePrereqEdges(edges);
  const allPrereq = allPrereqEdges(edges);
  const parentsOf = /* @__PURE__ */ new Map();
  const childrenOf = /* @__PURE__ */ new Map();
  for (const key of byKey.keys()) {
    parentsOf.set(key, []);
    childrenOf.set(key, []);
  }
  for (const edge of gate.edges) {
    if (!byKey.has(edge.from) || !byKey.has(edge.to)) continue;
    parentsOf.get(edge.to).push(edge.from);
    childrenOf.get(edge.from).push(edge.to);
  }
  const incoming = /* @__PURE__ */ new Map();
  const outgoing = /* @__PURE__ */ new Map();
  for (const key of byKey.keys()) {
    incoming.set(key, 0);
    outgoing.set(key, 0);
  }
  for (const edge of allPrereq) {
    if (!byKey.has(edge.from) || !byKey.has(edge.to)) continue;
    if (edge.from === edge.to) continue;
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
    outgoing.set(edge.from, (outgoing.get(edge.from) ?? 0) + 1);
  }
  const isFrontierUnder = (key, excluded) => !excluded.has(key) && (parentsOf.get(key) ?? []).every((parent) => excluded.has(parent));
  const frontierKeys = ordered.map((card) => card.key).filter((key) => isFrontierUnder(key, dropped));
  const fakeFrontierKeys = frontierKeys.filter((key) => (incoming.get(key) ?? 0) === 0);
  const isReverseFrontierUnder = (key, excluded) => !excluded.has(key) && (childrenOf.get(key) ?? []).every((child) => excluded.has(child));
  const reverseFrontierKeys = ordered.map((card) => card.key).filter((key) => isReverseFrontierUnder(key, dropped));
  const fakeUpperFrontierKeys = reverseFrontierKeys.filter((key) => (outgoing.get(key) ?? 0) === 0);
  const frontierSet = new Set(frontierKeys);
  const upperFrontierSet = new Set(reverseFrontierKeys);
  const floatedBy = (key) => {
    if (!isFrontierUnder(key, dropped)) return [];
    const after = new Set(dropped);
    after.add(key);
    const before = new Set(frontierKeys);
    return ordered.map((card) => card.key).filter((one) => !before.has(one) && isFrontierUnder(one, after));
  };
  const chainOf = (key) => {
    const onChain = /* @__PURE__ */ new Set();
    if (!byKey.has(key)) return { cards: [], edges: 0 };
    onChain.add(key);
    for (const table of [parentsOf, childrenOf]) {
      const queue = [key];
      while (queue.length > 0) {
        const current = queue.shift();
        for (const next of table.get(current) ?? []) {
          if (onChain.has(next)) continue;
          onChain.add(next);
          queue.push(next);
        }
      }
    }
    let inside = 0;
    for (const edge of gate.edges) {
      if (onChain.has(edge.from) && onChain.has(edge.to)) inside += 1;
    }
    return { cards: [...onChain].sort(compareKeys), edges: inside };
  };
  return {
    cards: ordered,
    edges,
    byKey,
    dropped,
    prereqReadable: gate.readable,
    gateEdges: gate.edges,
    parentsOf,
    childrenOf,
    incoming,
    outgoing,
    frontierKeys,
    fakeFrontierKeys,
    reverseFrontierKeys,
    fakeUpperFrontierKeys,
    floatedBy,
    chainOf,
    /**
     * 一张卡此刻属于哪一档（三级层次的那一档由选中态另算，不在这里）。
     * `dropped` > `frontier` > `upper` > `keep`——一条卡既被划掉又在前沿是不可能的（前沿要求未判）；
     * 两端都沾时按下沿算（两端都可撤，行为等价）⇒ `frontier` 先于 `upper`。
     */
    stateOf: (key) => dropped.has(key) ? "dropped" : frontierSet.has(key) ? "frontier" : upperFrontierSet.has(key) ? "upper" : "keep"
  };
}
function isCardLike(card) {
  return card !== null && typeof card === "object" && typeof card.key === "string" && card.key !== "";
}
function isEdgeLike(edge) {
  return edge !== null && typeof edge === "object" && typeof edge.from === "string" && typeof edge.to === "string";
}
function wrapTitle(text, maxPx, perChar) {
  const chars = Array.from(String(text ?? ""));
  const lines = [];
  let current = "";
  for (const char of chars) {
    if (current !== "" && (current.length + 1) * perChar > maxPx) {
      lines.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  if (current !== "") lines.push(current);
  if (lines.length > 1 && lines[lines.length - 1].length === 1) {
    const last = lines.pop();
    lines[lines.length - 1] += last;
  }
  return lines.length === 0 ? [""] : lines;
}
function knowledgeGraphLayout(input) {
  const { cards, model } = input;
  const width = Number.isFinite(input.width) && input.width > 0 ? input.width : KG_LAYOUT.fallbackWidth;
  const charW = Number.isFinite(input.charW) && input.charW > 3 ? input.charW : KG_LAYOUT.fallbackCharW;
  const minHeights = input.minHeights ?? null;
  const perChar = charW * KG_LAYOUT.charWSafety;
  const avail = Math.max(KG_LAYOUT.minW, width - KG_LAYOUT.pad * 2);
  const cols = Math.max(1, Math.floor((avail + KG_LAYOUT.gapX) / (KG_LAYOUT.minW + KG_LAYOUT.gapX)));
  const cardW = Math.min(KG_LAYOUT.cardW, (avail - (cols - 1) * KG_LAYOUT.gapX) / cols);
  const canvasW = KG_LAYOUT.pad * 2 + cols * cardW + (cols - 1) * KG_LAYOUT.gapX;
  const linesAvail = Math.max(30, cardW - 18 - 2);
  const lines = {};
  for (const card of cards) lines[card.key] = wrapTitle(card.name, linesAvail, perChar);
  const layers = layerOfCards(cards, model);
  const isUpper = (key) => model?.stateOf?.(key) === "upper";
  const ordered = cards.slice().sort((a, b) => Number(isUpper(a.key)) - Number(isUpper(b.key)) || (layers[a.key] ?? 0) - (layers[b.key] ?? 0) || compareKeys(a.key, b.key));
  const position = {};
  const rows = [];
  const rowHeightOf = {};
  let y = KG_LAYOUT.pad;
  const rowCount = Math.ceil(ordered.length / cols);
  for (let index = 0; index < rowCount; index += 1) {
    const slice = ordered.slice(index * cols, index * cols + cols);
    let maxLines = 1;
    let measured = 0;
    for (const card of slice) {
      maxLines = Math.max(maxLines, (lines[card.key] ?? [""]).length);
      measured = Math.max(measured, minHeights?.[card.key] ?? 0);
    }
    const estimated = KG_LAYOUT.headPx + maxLines * Math.max(12, KG_LAYOUT.lineHeight);
    const height = Math.max(estimated, measured);
    slice.forEach((card, column) => {
      position[card.key] = {
        x: KG_LAYOUT.pad + column * (cardW + KG_LAYOUT.gapX),
        y,
        row: index,
        column,
        width: cardW,
        height,
        layer: layers[card.key] ?? 0
      };
      rowHeightOf[card.key] = height;
    });
    rows.push({ index, y, height, keys: slice.map((card) => card.key) });
    y += height + KG_LAYOUT.gapY;
  }
  return {
    cols,
    cardW,
    rows,
    pos: position,
    lines,
    rowHeightOf,
    layers,
    canvasW,
    canvasH: rowCount === 0 ? KG_LAYOUT.pad * 2 : y - KG_LAYOUT.gapY + KG_LAYOUT.pad,
    charW,
    width
  };
}
function layerOfCards(cards, model) {
  const layers = {};
  const indegree = {};
  for (const card of cards) {
    layers[card.key] = 0;
    indegree[card.key] = 0;
  }
  for (const card of cards) {
    for (const child of model?.childrenOf?.get(card.key) ?? []) {
      if (child in indegree) indegree[child] += 1;
    }
  }
  const queue = cards.filter((card) => indegree[card.key] === 0).map((card) => card.key);
  const seen = new Set(queue);
  while (queue.length > 0) {
    const key = queue.shift();
    for (const child of model?.childrenOf?.get(key) ?? []) {
      if (!(child in indegree)) continue;
      layers[child] = Math.max(layers[child] ?? 0, (layers[key] ?? 0) + 1);
      indegree[child] -= 1;
      if (indegree[child] === 0 && !seen.has(child)) {
        seen.add(child);
        queue.push(child);
      }
    }
  }
  return layers;
}
function edgePathOf(edge, layout) {
  const from = layout.pos[edge.from];
  const to = layout.pos[edge.to];
  if (from === void 0 || to === void 0) return "";
  const sx = from.x + from.width * 0.5;
  const sy = from.y + from.height;
  const tx = to.x + to.width * 0.5;
  const ty = to.y;
  if (Math.abs(sx - tx) < 2) return `M${sx} ${sy}V${ty}`;
  const dy = Math.max(14, Math.min(46, Math.abs(ty - sy) * 0.6));
  return `M${sx} ${sy} C${sx} ${sy + dy} ${tx} ${ty - dy} ${tx} ${ty}`;
}
function edgeStrokeOf(edge) {
  if (edge.kind === "prereq" || edge.kind === void 0) {
    return KG_EDGE_STROKES[edge.confidence] ?? KG_EDGE_STROKES[LEVELS[1]];
  }
  return KG_KIND_STROKES[edge.kind] ?? KG_KIND_STROKES["see-also"];
}
function magnitudeReading({ kept, chapters, perChapterMax = OUTLINE_POINTS_MAX }) {
  const kp = Number.isSafeInteger(kept) && kept >= 0 ? kept : 0;
  const nos = Number.isSafeInteger(chapters) && chapters > 0 ? chapters : 0;
  if (nos === 0) return `\u7559\u4E0B ${kp} \u5F20\uFF0C\u8FD8\u6CA1\u6709\u7AE0\u8282\u5EFA\u8BAE\uFF0C\u6BCF\u7AE0 ${perChapterMax} \u6761\u662F\u4E0A\u9650`;
  const ratio = Math.round(kp / (nos * perChapterMax) * 100) / 100;
  return `\u7559\u4E0B ${kp} \u5F20\uFF0C${nos} \u7AE0 \xD7 \u6BCF\u7AE0 ${perChapterMax} \u6761\u4E0A\u9650\uFF0C\u6BD4\u503C ${ratio.toFixed(2)}`;
}
function exclusionSplitReading({ dropped, kept }) {
  const n = Number.isSafeInteger(dropped) && dropped > 0 ? dropped : 0;
  const m = Number.isSafeInteger(kept) && kept > 0 ? kept : 0;
  return `\u5DF2\u5254\u9664 ${n} \u6761\uFF0F\u672A\u5224 ${m} \u6761\uFF08\u6CA1\u5224\u7684\u9ED8\u8BA4\u8981\u8BB2\uFF09`;
}
function exclusionStaleReading(stale) {
  const n = Number.isSafeInteger(stale) && stale > 0 ? stale : 0;
  if (n === 0) return null;
  return `\u26A0\uFE0F \u6709 ${n} \u6761\u88C1\u51B3\u5DF2\u5931\u6548\uFF08\u91CD\u9020\u63A2\u67E5\u4E4B\u540E\u90A3\u5F20\u5361\u6CA1\u4E86\u3001\u6216\u5B83\u7684\u6807\u9898\u53D8\u4E86\uFF09\uFF0C\u672C\u6B21\u4E0D\u751F\u6548\u2014\u2014\u5176\u4F59\u7167\u65E7\u7B97\u6570`;
}
function lowerBoundaryOf(model) {
  const keys = Array.isArray(model?.frontierKeys) ? model.frontierKeys.slice() : [];
  const degenerate = !(Array.isArray(model?.gateEdges) && model.gateEdges.length > 0);
  return { form: degenerate ? "set" : "front", keys, count: keys.length, degenerate };
}
function lowerBoundaryReading(boundary) {
  const count = Number.isSafeInteger(boundary?.count) ? boundary.count : 0;
  if (boundary?.form === "set") {
    return `\u4E0B\u6CBF\uFF08\u8FD9\u672C\u4E66\u4E0A\u4E00\u6761\u7B97\u6570\u7684\u524D\u7F6E\u8FB9\u90FD\u6CA1\u6709 \u21D2 \u5B83\u662F\u4E00\u4E2A\u96C6\u5408\u3001\u4E0D\u662F\u4E00\u6761\u524D\u6CBF\uFF09\uFF1A\u5269\u4E0B ${count} \u6761\u2014\u2014\u8FD9\u6279\u5361\u4E4B\u95F4\u6CA1\u6709\u300C\u8C01\u5728\u524D\u3001\u8C01\u5728\u540E\u300D\uFF0C\u26D4 \u522B\u628A\u5B83\u8BFB\u6210\u4E00\u6761\u987A\u5E8F\u3002`;
  }
  return `\u4E0B\u6CBF\uFF08\u5212\u5269\u4E0B\u7684\u6700\u524D\u6CBF\uFF09\uFF1A${count} \u5F20`;
}
function upperBoundaryOf(model) {
  const keys = Array.isArray(model?.reverseFrontierKeys) ? model.reverseFrontierKeys.slice() : [];
  const degenerate = !(Array.isArray(model?.gateEdges) && model.gateEdges.length > 0);
  return { form: degenerate ? "set" : "front", keys, count: keys.length, degenerate };
}
function upperBoundaryReading(boundary) {
  const count = Number.isSafeInteger(boundary?.count) ? boundary.count : 0;
  if (boundary?.form === "set") {
    return `\u4E0A\u6CBF\uFF08\u8FD9\u672C\u4E66\u4E0A\u4E00\u6761\u7B97\u6570\u7684\u95E8\u69DB\u8FB9\u90FD\u6CA1\u6709 \u21D2 \u5B83\u662F\u4E00\u4E2A\u96C6\u5408\u3001\u4E0D\u662F\u4E00\u6761\u524D\u6CBF\uFF09\uFF1A\u5269\u4E0B ${count} \u6761\u2014\u2014\u8FD9\u6279\u53F6\u5B50\u5361\u4E0D\u4E00\u5B9A\u662F\u771F\u7684\u4E0A\u7AEF\uFF0C\u53EA\u662F\u6CA1\u4EBA\u7ED9\u5B83\u5199\u8FC7\u540E\u7EE7\uFF1B\u26D4 \u522B\u628A\u5B83\u8BFB\u6210\u4E00\u6761\u987A\u5E8F\u3002`;
  }
  return `\u4E0A\u6CBF\uFF08\u53CD\u5411\u524D\u6CBF\uFF1A\u672A\u5224\u3001\u800C\u5B83\u7684\u540E\u7EE7\u90FD\u5DF2\u5B9A\uFF09\uFF1A${count} \u5F20`;
}
function floatReceiptText(floatedKeys, byKey) {
  const keys = Array.isArray(floatedKeys) ? floatedKeys : [];
  if (keys.length === 0) return "\u6D6E\u4E0A\u6765 0 \u5F20";
  const names = keys.map((key) => byKey?.get?.(key)?.name).filter((name) => typeof name === "string" && name !== "");
  if (names.length === 0) return `\u6D6E\u4E0A\u6765 ${keys.length} \u5F20`;
  return `\u6D6E\u4E0A\u6765 ${keys.length} \u5F20\uFF1A${names.join("\u3001")}`;
}
function floatReceiptTitle(floatedKeys) {
  const keys = Array.isArray(floatedKeys) ? floatedKeys.filter((key) => typeof key === "string" && key !== "") : [];
  if (keys.length === 0) return void 0;
  return `\u5361\u952E\uFF1A${keys.join("\u3001")}`;
}
function measureCharWidth(host) {
  if (host === null || host === void 0) return null;
  const doc = host.ownerDocument ?? (typeof document === "undefined" ? null : document);
  if (doc === null || typeof doc.createElement !== "function" || typeof getComputedStyle !== "function") return null;
  const probe = doc.createElement("span");
  probe.textContent = "CPTSD \u60C5\u7EEA\u95EA\u56DE\u4E0E\u4E94\u4E2A\u4E3B\u8981\u75C7\u72B6";
  probe.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-size:${KG_LAYOUT.titleFontPx}px;font-family:Segoe UI,Microsoft YaHei,system-ui,sans-serif`;
  host.appendChild(probe);
  let width = 0;
  try {
    width = probe.getBoundingClientRect().width / Array.from(probe.textContent).length;
  } catch {
    width = 0;
  }
  host.removeChild(probe);
  return width > 3 ? width : null;
}
function viewScrollBoxOf(node) {
  let current = node === null || node === void 0 ? null : node;
  for (let depth = 0; current !== null && depth < 8; depth += 1) {
    if (typeof current.getAttribute === "function" && current.getAttribute("data-kg-view-body") !== null) return current;
    current = current.parentElement ?? null;
  }
  return null;
}
function measuredWidthOf(node) {
  if (node === null || node === void 0) return null;
  const client = Number(node.clientWidth);
  if (Number.isFinite(client) && client > 0) return client;
  const rect = typeof node.getBoundingClientRect === "function" ? node.getBoundingClientRect() : null;
  const rectWidth = rect === null ? 0 : Number(rect.width);
  return Number.isFinite(rectWidth) && rectWidth > 0 ? rectWidth : null;
}
function measureKgViewportWidth(node) {
  if (node === null || node === void 0) return null;
  const box = viewScrollBoxOf(node);
  if (box !== null) return measuredWidthOf(box);
  return measuredWidthOf(node.parentElement ?? node);
}
function kgViewportIsNarrow(measuredWidth) {
  return Number.isFinite(measuredWidth) && measuredWidth > 0 && measuredWidth < KG_VIEW_MIN_GRAPH_WIDTH;
}
function kgPointsView({ hasGraph, requested, measuredWidth } = {}) {
  if (hasGraph !== true) return "list";
  if (kgViewportIsNarrow(measuredWidth)) return "list";
  return requested === "list" ? "list" : "graph";
}
function KnowledgeGraphBlock(props) {
  const { cards, edges, knowledgePointCount, chapterCount, merged, dropped, predrawn, onVerdict, busy, exclusions } = props;
  const model = (0, import_react7.useMemo)(
    () => knowledgeGraphModel({ cards, edges, dropped }),
    [cards, edges, dropped]
  );
  const [open, setOpen] = (0, import_react7.useState)(false);
  const readings = (0, import_react7.useMemo)(() => edgeScanReading(merged), [merged]);
  const keptCount = exclusions === null || exclusions === void 0 ? knowledgePointCount : exclusions.kept;
  const magnitude = (0, import_react7.useMemo)(
    () => magnitudeReading({ kept: keptCount, chapters: chapterCount }),
    [keptCount, chapterCount]
  );
  const splitNote = exclusions === null || exclusions === void 0 ? null : exclusionSplitReading({ dropped: exclusions.dropped, kept: exclusions.kept });
  const staleNote = exclusions === null || exclusions === void 0 ? null : exclusionStaleReading(exclusions.stale);
  return (0, import_react7.createElement)(
    "div",
    { style: { margin: "4px 0 8px" }, "data-kg-block": "1" },
    (0, import_react7.createElement)(
      "button",
      { style: S.smallLink, onClick: () => setOpen(!open), "aria-expanded": open },
      open ? `\u25BE \u6536\u8D77\u77E5\u8BC6\u70B9\u56FE\uFF08${model.cards.length} \u5F20\u5361\uFF0C${model.edges.length} \u6761\u7BAD\u5934\uFF09` : `\u25B8 \u77E5\u8BC6\u70B9\u56FE\uFF08${model.cards.length} \u5F20\u5361\uFF0C${model.edges.length} \u6761\u7BAD\u5934\uFF0C\u70B9\u5F00\u770B\uFF09`
    ),
    // 两条读数：与「知识点清单（N 个）」**同一区、同一形状**（同一张卡的 12px 小字行）。
    (0, import_react7.createElement)(
      "div",
      {
        style: {
          marginTop: "6px",
          padding: "8px 10px",
          background: "var(--dsw-alias-bg-layer-1)",
          borderRadius: "8px",
          border: "1px solid var(--dsw-alias-border-l2)"
        }
      },
      (0, import_react7.createElement)(
        "div",
        { style: { fontSize: "12px", margin: "2px 0" }, "data-kg-reading": "edge-scan" },
        `\xB7 ${readings.text}`
      ),
      (0, import_react7.createElement)(
        "div",
        { style: { fontSize: "12px", margin: "2px 0" }, "data-kg-reading": "magnitude" },
        `\xB7 ${magnitude}`
      ),
      // 票 `knowledge-graph-build/09`：并列的两条读数（spec §9 逐字）。⛔ 只在调用方把那份集合
      // 递进来时才摆——补出来的只读图（票 12）上没有裁决可言，摆一句「已剔除 0 条」是假读数。
      splitNote === null ? null : (0, import_react7.createElement)(
        "div",
        { style: { fontSize: "12px", margin: "2px 0" }, "data-kg-reading": "exclusion-split" },
        `\xB7 ${splitNote}`
      ),
      staleNote === null ? null : (0, import_react7.createElement)(
        "div",
        { style: { fontSize: "12px", margin: "2px 0" }, "data-kg-reading": "exclusion-stale" },
        `\xB7 ${staleNote}`
      )
    ),
    open ? (0, import_react7.createElement)(KnowledgeGraphView, { cards, edges, dropped, predrawn, onVerdict, busy }) : null
  );
}
function KnowledgeGraphView(props) {
  const { cards, edges, dropped, predrawn, onVerdict, busy } = props;
  const predrawnKeys = Array.isArray(predrawn) ? predrawn : NO_KEYS;
  const marked = (0, import_react7.useMemo)(
    () => [.../* @__PURE__ */ new Set([...Array.isArray(dropped) ? dropped : [], ...predrawnKeys])],
    [dropped, predrawnKeys]
  );
  const model = (0, import_react7.useMemo)(
    () => knowledgeGraphModel({ cards, edges, dropped: marked }),
    [cards, edges, marked]
  );
  const [selected, setSelected] = (0, import_react7.useState)(null);
  const [armed, setArmed] = (0, import_react7.useState)(false);
  const [receipt, setReceipt] = (0, import_react7.useState)(null);
  const hostRef = (0, import_react7.useRef)(null);
  const passesRef = (0, import_react7.useRef)(0);
  const [geometry, setGeometry] = (0, import_react7.useState)({ width: null, charW: null });
  const [minHeights, setMinHeights] = (0, import_react7.useState)(null);
  const layout = (0, import_react7.useMemo)(
    () => knowledgeGraphLayout({
      cards: model.cards,
      model,
      width: geometry.width ?? void 0,
      charW: geometry.charW ?? void 0,
      minHeights
    }),
    [model, geometry.width, geometry.charW, minHeights]
  );
  (0, import_react7.useEffect)(() => {
    const node = hostRef.current;
    if (node === null) return void 0;
    const measure = () => {
      const width = measureKgViewportWidth(node);
      const charW = measureCharWidth(node);
      setGeometry((prev) => prev.width === width && prev.charW === charW ? prev : { width, charW });
    };
    measure();
    const box = viewScrollBoxOf(node) ?? node.parentElement ?? node;
    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(measure);
      observer.observe(box);
      return () => observer.disconnect();
    }
    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    return void 0;
  }, []);
  (0, import_react7.useEffect)(() => {
    if (passesRef.current >= 3) return;
    const node = hostRef.current;
    if (node === null || typeof node.querySelectorAll !== "function") return;
    const raised = {};
    let any = false;
    for (const element of node.querySelectorAll("[data-kg-card]")) {
      const title = element.querySelector("[data-kg-title]");
      if (title === null) continue;
      const allotted = Number(element.getAttribute("data-kg-height")) || 0;
      const needed = KG_LAYOUT.headPx + title.scrollHeight;
      if (needed > allotted + 0.5) {
        raised[element.getAttribute("data-kg-card")] = needed;
        any = true;
      }
    }
    passesRef.current += 1;
    if (any) setMinHeights((prev) => ({ ...prev ?? {}, ...raised }));
  }, [layout]);
  const boundary = lowerBoundaryOf(model);
  const upper = upperBoundaryOf(model);
  const frontierOrder = (0, import_react7.useMemo)(() => {
    const rank = /* @__PURE__ */ new Map();
    model.frontierKeys.forEach((key, index) => rank.set(key, index + 1));
    return rank;
  }, [model.frontierKeys]);
  const upperOrder = (0, import_react7.useMemo)(() => {
    const rank = /* @__PURE__ */ new Map();
    model.reverseFrontierKeys.forEach((key, index) => rank.set(key, index + 1));
    return rank;
  }, [model.reverseFrontierKeys]);
  const chain = selected === null ? null : model.chainOf(selected);
  const chainSet = chain === null ? null : new Set(chain.cards);
  const dimmedCount = chain === null ? 0 : model.cards.length - chain.cards.length;
  const decide = (0, import_react7.useCallback)((key, verdict, reason) => {
    if (typeof onVerdict !== "function") return;
    const floated = verdict === KG_VERDICTS.drop ? model.floatedBy(key) : [];
    const carried = { key, floated };
    Promise.resolve(onVerdict(key, verdict, reason)).then((accepted) => {
      if (accepted !== true) return;
      setReceipt(verdict === KG_VERDICTS.drop ? carried : null);
      setSelected(null);
    }).catch(() => {
    });
  }, [onVerdict, model]);
  const select = (0, import_react7.useCallback)((key) => {
    if (armed && model.stateOf(key) === "frontier") {
      decide(key, KG_VERDICTS.drop, EXCLUSION_REASON_ALREADY_KNOWN);
      return;
    }
    setSelected((prev) => prev === key ? null : key);
  }, [armed, model, decide]);
  const canvasStyle = {
    position: "relative",
    width: layout.canvasW,
    height: layout.canvasH
  };
  return (0, import_react7.createElement)(
    "div",
    {
      ref: hostRef,
      "data-kg-root": "1",
      "data-kg-width": String(Math.round(layout.width)),
      "data-kg-char-w": String(layout.charW),
      "data-kg-cols": String(layout.cols),
      "data-kg-rows": String(layout.rows.length),
      "data-kg-cards": String(model.cards.length),
      "data-kg-edges": String(model.edges.length),
      "data-kg-frontier": String(model.frontierKeys.length),
      "data-kg-fake-frontier": String(model.fakeFrontierKeys.length),
      // 票 `reader-cognition-boundary-build/02`：上沿的读数把手（张数／假终端张数；
      // 形态与那个数住下面那一行读数上，与下沿的 `data-kg-boundary*` 同形）。
      "data-kg-upper-frontier": String(model.reverseFrontierKeys.length),
      "data-kg-fake-upper-frontier": String(model.fakeUpperFrontierKeys.length),
      // 票 08：这一份划痕的盘上读数把手（「不讲」在界面上成立、在盘上还没有家）
      "data-kg-dropped": String(model.dropped.size),
      // 票 `confirm-points-redesign-build/10`：承接下来的预画下沿有几条 ＋ 划子亮着没有。
      "data-kg-predrawn": String(predrawnKeys.length),
      "data-kg-scraper": armed ? "armed" : "idle",
      "data-kg-selected": selected ?? "",
      "data-kg-chain-cards": chain === null ? "" : String(chain.cards.length),
      "data-kg-chain-edges": chain === null ? "" : String(chain.edges),
      "data-kg-dimmed": chain === null ? "" : String(dimmedCount),
      style: {
        marginTop: "6px",
        // 票 `ui-display-redesign/12`：宽度已按**滚动盒实宽**量（`measureKgViewportWidth()`）⇒
        // ⛔ 不再借卡的内边距（旧写法那对 `-bleed` 负 margin 正是横向滚动条的来路），
        // 也显式禁横滚——纵向仍由站 2 那个内滚盒负责（920 上限／最多 6 层卡，票 `knowledge-graph-step/17`）。
        overflowX: "hidden",
        padding: "8px 0",
        background: "var(--dsw-alias-bg-layer-1)",
        borderRadius: "8px",
        border: "1px solid var(--dsw-alias-border-l2)"
      }
    },
    (0, import_react7.createElement)(Legend, { tones: KG_CARD_TONES }),
    // 票 `confirm-points-redesign-build/10`：**下沿**那一行——形态如实（前沿／集合）。
    (0, import_react7.createElement)(
      "div",
      {
        "data-kg-boundary": boundary.form,
        "data-kg-boundary-count": String(boundary.count),
        style: { fontSize: "12px", opacity: 0.85, padding: "0 10px 6px" }
      },
      lowerBoundaryReading(boundary)
    ),
    // 票 `rcb-build/02`：**上沿**那一行——与下沿同形（前沿／集合），点明剥层方向。
    (0, import_react7.createElement)(
      "div",
      {
        "data-kg-upper-boundary": upper.form,
        "data-kg-upper-boundary-count": String(upper.count),
        style: { fontSize: "12px", opacity: 0.85, padding: "0 10px 6px" }
      },
      upperBoundaryReading(upper)
    ),
    // ── 票 `confirm-points-redesign-build/10`：**划子**（第二个入口）住在图本体的起点那一片 ──
    // 它长在图本体上（⛔ 不是卡上的第二块、⛔ 不是第二个停点）：位置＝起点那一片的抬头处，
    // 理由是「已经会」那一档，落的是**同一份**剔除记录。口径见 `KG_SCRAPER` 那段注释。
    // ⚠️ **只在有裁决通路时出现**（`onVerdict` 接上了）：划子按下去就是一次裁决，而补图那一档
    // （票 `knowledge-graph-backfill/12`）的图**只读** —— 那里摆一颗按了什么都不发生的键，
    // 正是 `test-knowledge-graph-backfill.mjs`「那一块一个回调都不接」那条判据要挡的形状。
    // ⚠️ 这与对话框那几颗动作键的待遇**有意不同**：那几颗在只读档上照旧渲染（既有裁决：键在、点了不翻），
    // 它们的形状由 `KnowledgeGraphView` 的 `decide()` 兜住；划子是新长的一颗，⛔ 不继承那条。
    typeof onVerdict !== "function" ? null : (0, import_react7.createElement)(
      "div",
      {
        "data-kg-scraper-bar": "1",
        style: {
          display: "flex",
          gap: "8px",
          alignItems: "baseline",
          flexWrap: "wrap",
          margin: "0 10px 6px",
          padding: "5px 8px",
          borderRadius: "6px",
          border: `1px ${armed ? "solid" : "dashed"} var(--dsw-alias-border-l2)`,
          background: armed ? "var(--dsw-alias-state-business-tertiary)" : "transparent"
        }
      },
      (0, import_react7.createElement)(
        "button",
        {
          type: "button",
          "data-kg-scraper-key": "1",
          "aria-pressed": armed,
          style: { ...S.smallLink, fontWeight: armed ? 600 : 400 },
          onClick: () => setArmed(!armed)
        },
        armed ? KG_SCRAPER.disarm : KG_SCRAPER.arm
      )
    ),
    // 回执：**按下划掉那一刻**那一条（⛔ 不是总账、⛔ 不含机器读数）。放回来／没划过就没有。
    receipt === null ? null : (0, import_react7.createElement)(
      "div",
      {
        "data-kg-receipt": "1",
        "data-kg-receipt-count": String(receipt.floated.length),
        // 票 `ui-systematic-fixes/03`（spec §3·2）：机器卡键只进悬停提示，正文里只有名字。
        title: floatReceiptTitle(receipt.floated),
        style: { fontSize: "12px", margin: "0 10px 6px", padding: "5px 8px", borderRadius: "4px", background: "var(--dsw-alias-bg-layer-2)" }
      },
      floatReceiptText(receipt.floated, model.byKey)
    ),
    (0, import_react7.createElement)(Canvas, {
      model,
      layout,
      canvasStyle,
      selected,
      chainSet,
      frontierOrder,
      upperOrder,
      onSelect: select
    }),
    selected === null ? null : (0, import_react7.createElement)(Dialog, {
      card: model.byKey.get(selected),
      state: model.stateOf(selected),
      busy: busy === true,
      onDecide: decide,
      onClose: () => setSelected(null)
    })
  );
}
function Legend({ tones }) {
  return (0, import_react7.createElement)(
    "div",
    { style: { display: "flex", flexWrap: "wrap", gap: "10px", padding: "2px 10px 6px" } },
    ...KG_LEGEND_ORDER.map((state) => {
      const tone = tones[state];
      return (0, import_react7.createElement)(
        "span",
        {
          key: state,
          "data-kg-legend": state,
          style: {
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: "6px",
            fontSize: "12px",
            background: tone.background,
            border: `1px ${tone.borderStyle} ${tone.border}`,
            color: tone.color,
            textDecoration: tone.strike ? "line-through" : "none"
          }
        },
        tone.label
      );
    })
  );
}
function Canvas({ model, layout, canvasStyle, selected, chainSet, frontierOrder, upperOrder, onSelect }) {
  const prereqShown = new Set(model.gateEdges);
  const drawable = model.edges.filter((edge) => layout.pos[edge.from] !== void 0 && layout.pos[edge.to] !== void 0);
  return (0, import_react7.createElement)(
    "div",
    { style: canvasStyle, "data-kg-canvas": "1" },
    (0, import_react7.createElement)(
      "svg",
      {
        width: layout.canvasW,
        height: layout.canvasH,
        style: { position: "absolute", left: 0, top: 0, pointerEvents: "none" },
        "aria-hidden": "true"
      },
      ...drawable.map((edge, index) => {
        const stroke = edgeStrokeOf(edge);
        const onChain = selected !== null && prereqShown.has(edge) && chainSet.has(edge.from) && chainSet.has(edge.to);
        const dim = selected !== null && !onChain;
        return (0, import_react7.createElement)("path", {
          key: `${edge.from}->${edge.to}#${index}`,
          "data-kg-edge": `${edge.from}->${edge.to}`,
          d: edgePathOf(edge, layout),
          fill: "none",
          stroke: onChain ? KG_CHAIN_INK : stroke.stroke,
          strokeWidth: onChain ? 2.4 : stroke.width,
          strokeDasharray: onChain ? void 0 : stroke.dash ?? void 0,
          opacity: selected === null ? stroke.opacity : onChain ? 0.9 : 0.05
        });
      })
    ),
    ...model.cards.map((card) => (0, import_react7.createElement)(CardNode, {
      key: card.key,
      card,
      state: model.stateOf(card.key),
      box: layout.pos[card.key],
      rank: frontierOrder.get(card.key) ?? null,
      // 票 `rcb-build/02`：这一张在上端那批里排第几（反向前沿的顺序号；不在那批里＝`null`）。
      upperRank: upperOrder.get(card.key) ?? null,
      // 票 08：这一张有几条 `prereq` 入边（**含「待核」**——「连一条前置箭头都没有」那条
      // 假前沿读数就是按它算的）。它是**读数把手**（`data-*`），⛔ 不上屏、⛔ 不是逐卡标记。
      incoming: model.incoming.get(card.key) ?? 0,
      selected: selected === card.key,
      onChain: chainSet !== null && chainSet.has(card.key),
      dimmed: selected !== null && chainSet !== null && !chainSet.has(card.key),
      onSelect
    }))
  );
}
function CardNode({ card, state, box, rank, upperRank, incoming, selected, onChain, dimmed, onSelect }) {
  if (box === void 0) return null;
  const tone = KG_CARD_TONES[state] ?? KG_CARD_TONES.keep;
  const opacity = selected ? KG_CHAIN_OPACITY.selected : onChain ? KG_CHAIN_OPACITY.chain : dimmed ? KG_CHAIN_OPACITY.other : 1;
  const headText = [rank === null ? null : `\u8F6E\u5230\u7B2C ${rank} \u5F20`, upperRank === null ? null : `\u4E0A\u7AEF\u7B2C ${upperRank} \u5F20`].filter((one) => one !== null).join("\u3000");
  return (0, import_react7.createElement)(
    "button",
    {
      type: "button",
      "data-kg-card": card.key,
      "data-kg-state": state,
      "data-kg-row": String(box.row),
      "data-kg-height": String(Math.round(box.height)),
      "data-kg-incoming": String(incoming ?? 0),
      // 票 `rcb-build/02`：上端顺序号的读数把手（空串＝不在反向前沿里，与 `data-kg-selected` 同形）。
      "data-kg-upper-rank": upperRank === null ? "" : String(upperRank),
      "data-kg-chain": onChain ? "1" : "0",
      "data-kg-selected": selected ? "1" : "0",
      // 机器键的**唯一**上屏出口：悬停提示（spec §3·2；读数把手 `data-kg-card` 不是给人看的字）。
      title: `\u5361\u952E\uFF1A${card.key}`,
      onClick: () => onSelect(card.key),
      style: {
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
        boxSizing: "border-box",
        textAlign: "left",
        padding: "5px 8px",
        borderRadius: "8px",
        cursor: "pointer",
        opacity,
        background: tone.background,
        border: `${selected ? 3 : onChain ? 1.8 : 1}px ${tone.borderStyle} ${selected ? "#111827" : onChain ? KG_CHAIN_INK : tone.border}`,
        boxShadow: selected ? `0 0 7px ${KG_CHAIN_INK}` : void 0
      }
    },
    (0, import_react7.createElement)(
      "div",
      { style: { fontSize: "12px", fontWeight: 600, color: tone.color, opacity: 0.85, minHeight: "11px" } },
      headText
    ),
    (0, import_react7.createElement)(
      "div",
      {
        "data-kg-title": "1",
        style: {
          fontSize: `${KG_LAYOUT.titleFontPx}px`,
          lineHeight: `${KG_LAYOUT.lineHeight}px`,
          color: tone.color,
          textDecoration: tone.strike ? "line-through" : "none",
          overflowWrap: "anywhere"
        }
      },
      card.name
    )
  );
}
function Dialog({ card, state, busy, onDecide, onClose }) {
  if (card === void 0) return null;
  const action = (label, onClick, extra = {}) => (0, import_react7.createElement)(
    "button",
    {
      type: "button",
      disabled: busy,
      onClick,
      title: extra.title,
      "data-kg-dialog-action": extra.mark,
      style: S.disabled({
        fontSize: "12px",
        padding: "5px 10px",
        borderRadius: "6px",
        border: "1px solid var(--dsw-alias-border-l2)",
        background: "var(--dsw-alias-bg-layer-2)",
        color: "inherit",
        cursor: "pointer"
      }, busy)
    },
    label
  );
  const keys = state === "dropped" ? [action(KG_DIALOG_KEYS.restore, () => onDecide(card.key, KG_VERDICTS.keep), { mark: "restore" })] : state === "keep" ? [action(KG_DIALOG_KEYS.close, onClose, { mark: "close" })] : [
    // 票 `confirm-points-redesign-build/10`：框里这颗键走**「不需要」**那一档理由
    // （本书不覆盖这个主题）；图上那把划子走**「已经会」**那一档。两条落**同一份**记录。
    // 票 16：`frontier` 与 `upper`（两端前沿）共用这一副键——上端也是「范围」判断。
    action(KG_DIALOG_KEYS.drop, () => onDecide(card.key, KG_VERDICTS.drop, EXCLUSION_REASON_NOT_NEEDED), { mark: "drop" }),
    action(KG_DIALOG_KEYS.hold, onClose, { mark: "hold" })
  ];
  return (0, import_react7.createElement)(
    "div",
    {
      "data-kg-dialog": "1",
      "data-kg-dialog-state": state,
      style: { position: "fixed", inset: 0, zIndex: 40 }
    },
    (0, import_react7.createElement)("div", {
      "data-kg-dialog-mask": "1",
      onClick: onClose,
      style: { position: "absolute", inset: 0, background: "rgba(15, 23, 42, .38)" }
    }),
    (0, import_react7.createElement)(
      "div",
      {
        style: {
          position: "relative",
          margin: "6vh auto 0",
          width: "min(520px, calc(100vw - 32px))",
          maxHeight: "84vh",
          overflow: "auto",
          background: "var(--dsw-alias-bg-layer-1)",
          border: "1px solid var(--dsw-alias-border-l2)",
          borderRadius: "12px",
          padding: "14px 16px 12px",
          boxShadow: "0 12px 32px rgba(15, 23, 42, .25)",
          color: "var(--dsw-alias-label-primary)"
        }
      },
      (0, import_react7.createElement)(
        "div",
        { style: { display: "flex", alignItems: "flex-start", gap: "10px" } },
        (0, import_react7.createElement)(
          "div",
          {
            "data-kg-dialog-title": "1",
            style: { flex: "1 1 auto", fontSize: "13px", fontWeight: 700, lineHeight: 1.45 }
          },
          card.name
        ),
        (0, import_react7.createElement)(
          "button",
          {
            type: "button",
            "data-kg-dialog-close": "1",
            "aria-label": "\u5173\u6389",
            onClick: onClose,
            style: { flex: "0 0 auto", border: "none", background: "none", fontSize: "16px", lineHeight: 1, cursor: "pointer", color: "inherit" }
          },
          "\xD7"
        )
      ),
      (0, import_react7.createElement)(
        "p",
        {
          "data-kg-dialog-testable": "1",
          style: { fontSize: "12px", lineHeight: 1.7, margin: "6px 0 0", whiteSpace: "pre-wrap" }
        },
        String(card.testable ?? "")
      ),
      // 动作键那一排（四档各差一颗，见上面那段）。⛔ 这里不印任何「为什么」的话。
      (0, import_react7.createElement)(
        "div",
        { "data-kg-dialog-actions": "1", style: { display: "flex", flexWrap: "wrap", gap: "8px", margin: "10px 0 0" } },
        ...keys
      )
    )
  );
}

// src/explore-confirm-contract.js
var EXPLORE_CONFIRM_EXITS = Object.freeze({
  /** 答问卷（收卷人交回的问卷回来了）。 */
  questionnaire: "questionnaire",
  /** 没人动过（那一版仍成文，但身份是 AI 先验）。 */
  untouched: "untouched"
});
var EXPLORE_CONFIRM_EXIT_VALUES = Object.freeze(Object.values(EXPLORE_CONFIRM_EXITS));
var EXPLORE_CONFIRM_ANSWERERS = Object.freeze(["\u672C\u4EBA", "\u76D1\u62A4\u4EBA", "\u8001\u5E08"]);
var EXPLORE_CONFIRM_AI_PRIOR_STATEMENT = "\u672C\u6B21\u6309 AI \u5148\u9A8C\u6267\u884C";
var EXPLORE_CONFIRM_STANCE_KINDS = Object.freeze({
  /** 有一个人的动作（答问卷）。 */
  human: "human",
  /** 没人动过：仍成文，但那一版是 AI 先验（未经确认）。 */
  aiPrior: "ai-prior",
  /** 没有 `values.exit` 可读（`agent-tool` 那条窄路／旧调用／退役的 ai-draft）——⛔ 不声称身份。 */
  unrecorded: "unrecorded"
});
function exploreConfirmValues({ exit } = {}) {
  return { exit };
}
function exploreConfirmPayload({ approved, feedback = {} } = {}) {
  const payload = {
    approved: approved === true,
    reasons: Array.isArray(feedback?.reasons) ? feedback.reasons : [],
    note: typeof feedback?.note === "string" ? feedback.note : ""
  };
  const values = valuesFromFeedback(feedback);
  if (values !== void 0) payload.values = values;
  return payload;
}
function valuesFromFeedback(feedback) {
  if (feedback === null || typeof feedback !== "object") return void 0;
  if (feedback.values !== void 0 && feedback.values !== null) return feedback.values;
  if (typeof feedback.exit !== "string" || feedback.exit === "") return void 0;
  return exploreConfirmValues({ exit: feedback.exit });
}

// src/ui/reader-gap.js
var import_react8 = require("react");

// src/reader-questionnaire-vocab.js
var READER_SLICE_STATES = Object.freeze(["\u8FD9\u7247\u6211\u57FA\u672C\u90FD\u4F1A", "\u8BF4\u4E0D\u51C6", "\u8FD9\u7247\u4E0D\u662F\u95EE\u6211\u7684"]);
var READER_ITEM_STATES = Object.freeze(["\u5DF2\u7ECF\u4F1A", "\u4E0D\u786E\u5B9A"]);
function normalizeTitle(value) {
  return typeof value === "string" ? value.trim() : "";
}

// src/ui/reader-gap.js
var READER_GAP_KINDS = Object.freeze({
  /** ① 没答：问了他没回（含「卷上没列到」的那些成员）。 */
  unanswered: "unanswered",
  /** ② 答了「不确定」（片级「说不准」＝同一档在片粒度上的形态）。 */
  unsure: "unsure",
  /** ③ 问了不适配：「这片不是问我的」——归票 `15` 的那一档。 */
  unfit: "unfit"
});
var READER_GAP_LABELS = Object.freeze({
  [READER_GAP_KINDS.unanswered]: "\u2460 \u6CA1\u7B54\u7684\u7247",
  [READER_GAP_KINDS.unsure]: "\u2461 \u7B54\u4E86\u300C\u4E0D\u786E\u5B9A\u300D\u7684\u7247",
  [READER_GAP_KINDS.unfit]: "\u2462 \u95EE\u4E86\u4E0D\u9002\u914D\uFF08\u300C\u8FD9\u7247\u4E0D\u662F\u95EE\u6211\u7684\u300D\uFF09\u7684\u7247"
});
var READER_GAP_NOTES = Object.freeze({
  [READER_GAP_KINDS.unanswered]: "\u8FD9\u4E9B\u6761\u76EE\u6CA1\u4EBA\u7B54\u8FC7\uFF1A\u6309\u300C\u6CA1\u8868\u6001\u4E00\u5F8B\u7167\u5E38\u8BB2\u300D\u5904\u7406\u2014\u2014\u60F3\u8BA9\u5B83\u4EEC\u4E0D\u8BB2\uFF0C\u53EA\u80FD\u9760\u4EBA\u5728\u56FE\u4E0A\u9010\u5361\u5212\u3002",
  [READER_GAP_KINDS.unsure]: "\u8FD9\u4E9B\u6761\u76EE\u8BFB\u8005\u7B54\u4E86\u300C\u4E0D\u786E\u5B9A\u300D\uFF1A\u540C\u6837\u7167\u5E38\u8BB2\u3002\u60F3\u5C11\u8BB2\uFF0C\u53EA\u80FD\u9760\u4EBA\u5728\u56FE\u4E0A\u9010\u5361\u5212\u3002",
  [READER_GAP_KINDS.unfit]: "\u8FD9\u4E9B\u7247\u8BFB\u8005\u7B54\u4E86\u300C\u8FD9\u7247\u4E0D\u662F\u95EE\u6211\u7684\u300D\uFF1A\u8FD9\u6279\u6761\u76EE\u9ED8\u8BA4\u8BB2\uFF08\u6362\u4E3B\u8BED\u91CD\u5199\u53D1\u751F\u5728\u4E66\u91CC\uFF0C\u95EE\u5377\u4E0D\u518D\u95EE\u7B2C\u4E8C\u904D\uFF09\u3002\u26A0\uFE0F \u8FD9\u610F\u5473\u7740\u5B83\u4EEC\u53EF\u80FD\u6C38\u8FDC\u62FF\u4E0D\u5230\u8BFB\u8005\u8F93\u5165\u2014\u2014\u60F3\u780D\u6389\u5B83\u4EEC\uFF0C\u53EA\u80FD\u9760\u4EBA\u5728\u56FE\u4E0A\u9010\u5361\u5212\u3002"
});
var READER_GAP_UNFIT_COST = "\u26A0\uFE0F \u8FD9\u6279\u6761\u76EE\u53EF\u80FD\u6C38\u8FDC\u62FF\u4E0D\u5230\u8BFB\u8005\u8F93\u5165\uFF1A\u60F3\u780D\uFF0C\u53EA\u80FD\u9760\u4EBA\u5728\u56FE\u4E0A\u9010\u5361\u5212\u3002";
var READER_GAP_ACTION_TEXT = "\u5728\u56FE\u4E0A\u9010\u5361\u5212\uFF08\u53BB\u56FE\u90A3\u4E00\u5757\uFF09";
var READER_GAP_ACTION_TARGET = "data-kg-block";
var READER_GAP_ACTION_HREF = `#${READER_GAP_ACTION_TARGET}`;
function markedStateOf(line, states) {
  const hits = states.filter((state) => line.startsWith(`- [x] ${state}`));
  return hits.length === 1 ? hits[0] : null;
}
function parseItemLine(line, itemStates) {
  const row = /^- \[( |x)\] (已经会|不确定)　- \[( |x)\] (已经会|不确定) —— (.+)$/.exec(line);
  if (row === null) return null;
  const first = row[1] === "x" ? row[2] : null;
  const second = row[3] === "x" ? row[4] : null;
  if (first !== null && second !== null) return null;
  const state = first ?? second;
  if (state === null || !itemStates.includes(state)) return null;
  const member = normalizeTitle(row[5]);
  if (member === "") return null;
  return { state, member };
}
function readerGapReading({
  returnedText,
  slices,
  exclusions,
  states = { sliceStates: READER_SLICE_STATES, itemStates: READER_ITEM_STATES }
} = {}) {
  if (typeof returnedText !== "string" || returnedText.trim() === "") return null;
  const list = Array.isArray(slices) ? slices : slices !== null && typeof slices === "object" && Array.isArray(slices.slices) ? slices.slices : [];
  if (list.length === 0) return null;
  const { sliceStates, itemStates } = states;
  const excluded = new Set(
    (Array.isArray(exclusions) ? exclusions : []).map((item) => normalizeTitle(item?.title)).filter((title) => title !== "")
  );
  const HEADING_RE = /^## 第 \d+ 问 · (.+)$/;
  const answered = /* @__PURE__ */ new Map();
  let current = null;
  for (const line of returnedText.split(/\r?\n/)) {
    const heading = HEADING_RE.exec(line);
    if (heading !== null) {
      const name = normalizeTitle(heading[1]);
      current = name === "" ? null : { sliceState: null, items: /* @__PURE__ */ new Map() };
      if (current !== null && !answered.has(name)) answered.set(name, current);
      continue;
    }
    if (current === null) continue;
    if (line.startsWith("- [x] ")) {
      const sliceState = markedStateOf(line, sliceStates);
      if (sliceState !== null && current.sliceState === null) {
        current.sliceState = sliceState;
        continue;
      }
    }
    const item = parseItemLine(line, itemStates);
    if (item !== null && !current.items.has(item.member)) current.items.set(item.member, item.state);
  }
  const unanswered = [];
  const unsure = [];
  const unfit = [];
  for (const slice of list) {
    const name = normalizeTitle(slice?.name) === "" ? "\uFF08\u672A\u547D\u540D\u7684\u4E00\u7247\uFF09" : normalizeTitle(slice.name);
    const members = (Array.isArray(slice?.members) ? slice.members : []).map(normalizeTitle).filter((title) => title !== "");
    const sheet = answered.get(normalizeTitle(slice?.name)) ?? null;
    if (sheet !== null && sheet.sliceState === sliceStates[2]) {
      const gaps = members.filter((member) => !excluded.has(member)).length;
      if (gaps > 0) unfit.push({ kind: READER_GAP_KINDS.unfit, slice: name, gaps });
      continue;
    }
    if (sheet !== null && sheet.sliceState === sliceStates[1]) {
      const gaps = members.filter((member) => !excluded.has(member)).length;
      if (gaps > 0) unsure.push({ kind: READER_GAP_KINDS.unsure, slice: name, gaps });
      continue;
    }
    const written = sheet === null ? /* @__PURE__ */ new Map() : sheet.items;
    const noAnswer = members.filter(
      (member) => !excluded.has(member) && written.get(member) !== itemStates[0] && written.get(member) !== itemStates[1]
    ).length;
    if (noAnswer > 0) unanswered.push({ kind: READER_GAP_KINDS.unanswered, slice: name, gaps: noAnswer });
    const unsureItems = members.filter(
      (member) => !excluded.has(member) && written.get(member) === itemStates[1]
    ).length;
    if (unsureItems > 0) unsure.push({ kind: READER_GAP_KINDS.unsure, slice: name, gaps: unsureItems });
  }
  const reading = [...unanswered, ...unsure, ...unfit];
  return reading.length === 0 ? null : reading;
}
function goToGraphVerdicts() {
  if (typeof document === "undefined") return;
  const block = document.querySelector(`[${READER_GAP_ACTION_TARGET}]`);
  if (block === null) return;
  if (typeof block.scrollIntoView === "function") block.scrollIntoView({ block: "start" });
  const firstKey = typeof block.querySelector === "function" ? block.querySelector("[data-kg-card], button") : null;
  if (firstKey !== null && typeof firstKey.focus === "function") firstKey.focus();
}
function ReaderGapBlock({ reading }) {
  if (!Array.isArray(reading) || reading.length === 0) return null;
  return (0, import_react8.createElement)(
    "div",
    {
      style: {
        marginTop: "10px",
        padding: "8px 10px",
        borderRadius: "10px",
        border: "1px solid var(--dsw-alias-border-l2)",
        background: "var(--dsw-alias-bg-layer-1)"
      },
      "data-reader-gap": "1"
    },
    (0, import_react8.createElement)(
      "div",
      { style: { fontSize: "13px", fontWeight: 600 } },
      "\u26A0\uFE0F \u8FD9\u6279\u6761\u76EE\u62FF\u4E0D\u5230\u8BFB\u8005\u8F93\u5165"
    ),
    (0, import_react8.createElement)(
      "p",
      { style: { margin: "4px 0 6px", fontSize: "12px", opacity: 0.8 } },
      "\u4E0B\u9762\u6309\u4E09\u7C7B\u5206\u5F00\u8BB0\u8D26\uFF1A\u6BCF\u4E00\u884C\u53EA\u8BB2\u8FD9\u4E00\u7247\uFF0C\u5E76\u5982\u5B9E\u5199\u51FA\u8FD9\u4E00\u7247\u6709\u591A\u5C11\u6761\u62FF\u4E0D\u5230\u8F93\u5165\u3002"
    ),
    ...Object.values(READER_GAP_KINDS).map((kind) => {
      const lines = reading.filter((line) => line?.kind === kind);
      if (lines.length === 0) return null;
      return (0, import_react8.createElement)(
        "div",
        {
          key: kind,
          "data-reader-gap-kind": kind,
          style: {
            padding: "6px 0",
            borderTop: "1px solid var(--dsw-alias-border-l2)",
            fontSize: "13px"
          }
        },
        (0, import_react8.createElement)("div", { style: { fontWeight: 600 } }, READER_GAP_LABELS[kind]),
        (0, import_react8.createElement)(
          "p",
          { style: { margin: "2px 0 4px", fontSize: "12px", opacity: 0.75 } },
          READER_GAP_NOTES[kind]
        ),
        ...lines.map(
          (line) => (0, import_react8.createElement)(
            "div",
            {
              key: `${kind}:${line.slice}`,
              "data-reader-gap-line": kind,
              "data-reader-gap-slice": line.slice,
              "data-reader-gap-count": String(line.gaps),
              style: {
                display: "flex",
                alignItems: "baseline",
                gap: "10px",
                flexWrap: "wrap",
                padding: "2px 0"
              }
            },
            (0, import_react8.createElement)("span", null, `${line.slice}\uFF1A\u672C\u7247 ${line.gaps} \u6761`),
            // 那一颗**能走的动作**：⛔ 不是新按钮、⛔ 不是第二次发卷——
            // 它就是把用户送到本卡图那一块（`graph-opinion` 那条既有通路的入口）。
            (0, import_react8.createElement)(
              "a",
              {
                "data-reader-gap-action": kind,
                "data-reader-gap-action-kind": "graph-verdict",
                "data-reader-gap-action-target": READER_GAP_ACTION_TARGET,
                href: READER_GAP_ACTION_HREF,
                style: { fontSize: "12px" },
                onClick: (event) => {
                  if (event !== null && typeof event.preventDefault === "function") event.preventDefault();
                  goToGraphVerdicts();
                }
              },
              READER_GAP_ACTION_TEXT
            )
          )
        ),
        kind === READER_GAP_KINDS.unfit ? (0, import_react8.createElement)(
          "p",
          {
            "data-reader-gap-cost": "1",
            style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.75 }
          },
          READER_GAP_UNFIT_COST
        ) : null
      );
    })
  );
}

// src/ui/confirm-cards.js
var DIFF_TONES = {
  \u57FA\u7840: "var(--dsw-alias-state-success-primary)",
  \u91CD\u70B9: "var(--dsw-alias-state-warn-label)",
  \u96BE\u70B9: "var(--dsw-alias-state-error-primary)",
  \u8FDB\u9636: "var(--dsw-alias-state-business-primary)"
};
var DIFF_COLORS = Object.fromEntries(
  KNOWLEDGE_POINT_DIFFICULTY.map((d) => [d, DIFF_TONES[d]])
);
var RE_EXPLORE_REASONS = [
  "\u6709\u7684\u6750\u6599\u6CA1\u8BFB\u5168",
  "\u77E5\u8BC6\u70B9\u6574\u7406\u5F97\u592A\u7C97",
  "\u7AE0\u8282\u5EFA\u8BAE\u4E0D\u5408\u7406",
  "\u91CD\u70B9\u96BE\u70B9\u5224\u65AD\u4E0D\u5BF9"
];
var EXPLORE_CONFIRM_ACCEPT_LABEL = "\u2705 \u6EE1\u610F\uFF0C\u7EE7\u7EED\u8BBE\u8BA1";
var EXPLORE_CONFIRM_REWRITE_LABEL = "\u{1F501} \u8BA9 AI \u91CD\u505A";
var EXPLORE_CONFIRM_REWRITE_CONFIRM_LABEL = "\u{1F501} \u5C31\u8FD9\u6837\u91CD\u505A";
var OUTLINE_CONFIRM_ACCEPT_LABEL = "\u2705 \u901A\u8FC7\uFF0C\u5F00\u59CB\u5199\u6700\u4F73\u8303\u4F8B\u7AE0";
var OUTLINE_CARD_QUESTION = "\u8FD9\u4EFD\u7AE0\u8282\u5B89\u6392\u80FD\u901A\u8FC7\u5417\uFF1F";
function outlineCardFacts(chapterCount, unclaimedCount, hasCoverage) {
  const claim = !hasCoverage ? "\u6CA1\u6709\u77E5\u8BC6\u70B9\u8986\u76D6\u53EF\u6838\u5BF9" : unclaimedCount === 0 ? "\u6BCF\u6761\u77E5\u8BC6\u70B9\u90FD\u6709\u7AE0\u8282\u8BA4\u9886" : `${unclaimedCount} \u6761\u77E5\u8BC6\u70B9\u8FD8\u6CA1\u6709\u7AE0\u8282\u8BA4\u9886`;
  const pick = chapterCount > 1 ? "\u8303\u4F8B\u7AE0\u53EF\u6539\u9009" : "\u8303\u4F8B\u7AE0\u5C31\u662F\u8FD9\u4E00\u7AE0";
  return `${chapterCount} \u7AE0\uFF0C${claim}\uFF0C${pick}\u3002`;
}
function chaptersWaivedPoints(meta, chapterNo) {
  if (!Number.isSafeInteger(chapterNo) || chapterNo < 1) return { chapter: chapterNo, points: [] };
  const rows = Array.isArray(meta?.waivedPointDrops) ? meta.waivedPointDrops : [];
  for (const row of rows) {
    if (row === null || typeof row !== "object") continue;
    if (row.chapter !== chapterNo) continue;
    const points = Array.isArray(row.points) ? row.points.filter((t) => typeof t === "string" && t !== "") : [];
    return { chapter: chapterNo, points };
  }
  return { chapter: chapterNo, points: [] };
}
var OUTLINE_COVERAGE_FOLD_SUMMARY = "\u5FC5\u987B\u8986\u76D6 \u2194 \u5DF2\u8BA4\u9886\uFF08\u70B9\u5F00\u6838\u5BF9\uFF09";
var OUTLINE_COVERAGE_VIEW_MAX_HEIGHT = 240;
var EXPLORE_PASS_EFFECT = "\u70B9\u4E86\u5B83\u8FD9\u4EFD\u62A5\u544A\u5C31\u6B64\u5B9A\u4E0B\uFF1A\u4E66\u5F80\u524D\u8D70\u4E00\u6B65\uFF0CAI \u7167\u7740\u5B83\u8D77\u8349\u90A3\u51E0\u6761\u5B66\u4E60\u76EE\u6807\uFF0C\u5199\u597D\u8FD8\u8981\u4F60\u786E\u8BA4\u3002";
var OUTLINE_PASS_EFFECT = "\u70B9\u4E86\u5B83\u8FD9\u4EFD\u5B89\u6392\u5C31\u6B64\u5B9A\u4E0B\uFF1A\u4E66\u5F80\u524D\u8D70\u4E00\u6B65\uFF0CAI \u5148\u628A\u6700\u4F73\u8303\u4F8B\u7AE0\u5199\u51FA\u6765\u7ED9\u4F60\u8FC7\u76EE\u3002";
var EXPLORE_CARD_QUESTION = "AI \u8BFB\u5230\u7684\u6750\u6599\u91CD\u70B9\u5BF9\u4E0D\u5BF9\uFF1F";
var EXPLORE_READER_STANCE_GOTO_LABEL = "\u53BB\u7B54\u95EE\u5377";
var exploreConfirmCardView = defineCardView({
  card: "ExploreConfirmCard",
  fromBook: [
    // 票 `demo-channel-full/26`：本卡尾那句「不满意会怎样」要认得出演示书（两取值，
    // 出口＝`view-rules.exploreConfirmNote`）⇒ `meta` **重新进契约**。
    // ⚠️ 票 02 当年把它判成**死 prop**（函数体可执行代码零命中）是对的；本票让卡真读了它，
    // 那句「本卡不使用 meta」的注释同时作废（契约与卡体不许留一句与代码矛盾的注释）。
    "meta",
    "exploreSummary",
    "knowledgeMapText",
    "readArtifact",
    "confirmExplore",
    "onViewReport",
    "busy",
    // 票 `knowledge-graph-build/08`：图上那两颗裁决键的**接线**（这一块唯一会改状态的东西）。
    // ⚠️ 两个都是**必填的活口**、卡内没有兜底：`graphDropped` 是壳手上那一份划痕（缺了＝每张卡
    // 都画成「要讲」，与用户刚划过的事实相反），`onGraphVerdict` 是第三条「意见」通路的入口
    // （缺了＝三颗键点了什么都不发生——`KnowledgeGraphBlock` 那一侧对「没接」的表现是
    // **键照旧在、点了不翻**，不静默把键撤掉）。⇒ 它们列进 `fromBook`，壳漏传由
    // `test-card-views-coverage.mjs` 的契约×消费对账点名。
    "graphDropped",
    "onGraphVerdict",
    // 票 `knowledge-graph-build/09`：盘上那份**人的裁决产物**的原文（`工作区/knowledge-map-exclusions.json`，
    // 随 `/textbook/events` 下发）。它是「已经划掉了哪几条」的**史实**（壳手上那份 `graphDropped`
    // 只是本会话的快照，刷新就没了）⇒ 下面那一栏与两条读数都从它现算。
    "knowledgeMapExclusions",
    // 票 `confirm-points-redesign-build/10`：**预画的下沿**（问卷／分组面的结果先画到图上的
    // 那几条卡键）。它是**容量**不是内容——本卡只把它原样递给图那块（照「已经会」画出来，
    // 人在图上再调）；⚠️ 今天**生产上没有生产者**（回卷那一半归 rcb 的票 06／10）
    // ⇒ 壳不传、这一格恒缺省，图上照旧只有人自己划的那些。缺省时行为与今天逐字相同。
    "predrawnLowerBoundary",
    // 票 `rcb-build/04`：**本会话刚收下回卷**那一位（面板收卷成功那一刻由壳置 true）。
    // 票 `ui-display-redesign/03` 起它只服务卡底那一行「这一版按什么成文」＋推进键的出口判定
    // （与盘上那份回卷件是**同一件事的两个来源**：本会话刚收下、或刷新后仍躺在书夹里）。
    // ⚠️ 它只是**本会话**的回执（切书即归零）⇒ 「有回卷」还要看 `readerQuestionnaireReturn`，
    // 两件任一为真都按 `exit=questionnaire` 成文。
    "readerQuestionnaireSaved",
    // 票 `rcb-build/04`：「**去答问卷**」那一行的入口——打开顶栏那块「🧑‍🎓 读者情况问卷」面板
    // （⛔ 本卡不重做那套通道，只做入口；票 03 起只在「还没有回卷」那一态出现）。
    // 缺了＝那颗入口点了什么都不发生，所以列进必填。
    "onOpenReaderQuestionnaire",
    // 票 `rcb-build/09`：书夹里那份**回卷原件**（`工作区/读者情况回卷.md`）的原文——
    // 卡尾那一栏「这批条目拿不到读者输入」的**唯一新输入**（缺口＝从它 ＋ 合并件的
    // `readerSlices` ＋ 图上的裁决**现算**的派生读数）；票 `ui-display-redesign/03` 起它同时是
    // 卡底那一行「有回卷」的判据（spec §2.3 第 10 行的数据来源就是回卷件）。与
    // `knowledgeMapExclusions` 同一条路（⛔ 不经 `/textbook/file`）。
    // `null` ＝ 这本书还没有回卷 ⇒ 那一栏整块不渲染、卡底那行走「AI 先验」那一支。
    "readerQuestionnaireReturn"
  ],
  required: ["confirmExplore", "onViewReport", "readArtifact", "onOpenReaderQuestionnaire"],
  defaults: {
    /**
     * `reportText` —— **只由测试注入的口子**（`smoke-test.mjs:6020` 的 SSR 那一节：
     * `renderToStaticMarkup` 跑不了 `useEffect`/fetch，于是把报告经这个 prop 注进去，断言
     * 「报告区排在摘要行之前」）。
     *
     * ⚠️ **壳从不传它**（`client-entry.js` 的 `case "explore"` 那一整块没有这一项）。于是生产恒为
     * 缺省值 `null`，`:165` 的 `useState` 初值与 `:169-171` 的 effect 早退**每次都不命中**，那个
     * effect 每次跑都真的去读一次 `readArtifact("工作区/explore.md")`——**这不是 bug**，是那条
     * 降级路径本来就该走的（票 03 之后 `project`/`session` 已退休，判据归 `artifact-read`）。
     *
     * 之所以**登记成 `defaults`、绝不列 `required`**：列了必填就是**逼壳去传它**，那才是行为
     * 变更（凭空多出一个恒空的 prop，正是 `.scratch/dsh-contract-drift/` 记的那个形状）。
     * 之所以**不把这个 prop 删掉**：删了会让冒烟那一节的报告置顶断言失真——那条断言证的是
     * 「报告区早于摘要行」，它需要一条不联网的注入口。**登记比删除更有价值**。
     *
     * 缺省取 `null`（不是 `undefined`）：`:165` / `:169` 的判据都是
     * `typeof … === "string" && … !== ""`，两种取值行为逐字一致，而只有 `null` 能把
     * 「生产恒无、只此一处注入」这件事**写进契约本身**。
     */
    reportText: null
  },
  // 整形：壳里不撞名的 `confirmExplore` → 卡片真正消费的那个 `onConfirm`。理由见上面那一节。
  // ⚠️ `derive` **只拿得到一个参数**（此刻的袋子，`build` 的 ④）：delta 已排在它之前，所以从袋
  // 里读到的就是**最终值**，也是唯一正确的读法（拿不到「原始书切片」，两个读法会打架）。
  // 除此之外没有现算表达式——`onViewReport` 的闭包在壳里，不在这里重写：`viewWork` 不是卡片该
  // 认识的东西，袋里其余每一项都是壳原样递过来的值。
  derive: (bag) => ({ onConfirm: bag.confirmExplore })
});
function ExploreConfirmCard(props) {
  const {
    meta,
    exploreSummary,
    knowledgeMapText,
    readArtifact,
    onConfirm,
    onViewReport,
    busy,
    reportText,
    // 票 `knowledge-graph-build/08`：图上那一份划痕（壳手上的）与它的入口。
    graphDropped,
    onGraphVerdict,
    // 票 `knowledge-graph-build/09`：盘上那份人的裁决的原文。
    knowledgeMapExclusions,
    // 票 `confirm-points-redesign-build/10`：**预画的下沿**（问卷／分组面 → 图）。原样转给图那块。
    predrawnLowerBoundary,
    // 票 `rcb-build/04`：回卷是否已收下（决定通用推进键走哪条出口）＋「答问卷」入口。
    readerQuestionnaireSaved,
    onOpenReaderQuestionnaire,
    // 票 `rcb-build/09`：书夹里那份**回卷原件**的原文（卡尾那一栏缺口的唯一新输入）。
    readerQuestionnaireReturn
  } = props;
  const sum = exploreSummary ?? {};
  const focus = normalizeTeachingFocus(sum.teachingFocus);
  const [showSections, setShowSections] = (0, import_react9.useState)(false);
  const [showReport, setShowReport] = (0, import_react9.useState)(false);
  const [rejecting, setRejecting] = (0, import_react9.useState)(false);
  const [reasons, setReasons] = (0, import_react9.useState)([]);
  const [rejectNote, setRejectNote] = (0, import_react9.useState)("");
  const km = parseKnowledgeMap(knowledgeMapText);
  const [report, setReport] = (0, import_react9.useState)(
    () => typeof reportText === "string" && reportText !== "" ? reportText : null
  );
  (0, import_react9.useEffect)(() => {
    let alive = true;
    if (typeof reportText === "string" && reportText !== "") {
      setReport(reportText);
      return void 0;
    }
    setReport(null);
    readArtifact("\u5DE5\u4F5C\u533A/explore.md").then((text) => {
      if (alive) setReport(text);
    }).catch(() => {
    });
    return () => {
      alive = false;
    };
  }, [readArtifact, reportText]);
  const reportBlocks = report !== null && report !== "" ? exploreReportBlocks(report) : [];
  const kps = km === null ? [] : km.kps;
  const chapters = km === null ? [] : km.chapters;
  const exclusions = parseExclusionsDocument(knowledgeMapExclusions);
  const graphCards = km !== null && km.graph !== null ? km.graph.cards : [];
  const exclusionSplit = liveExclusionsOf(exclusions.items, graphCards);
  const keptPoints = effectiveKnowledgePoints(kps, exclusionSplit.live);
  const keptCount = keptPoints.length;
  const droppedKeys = [
    .../* @__PURE__ */ new Set([
      ...exclusionKeysOf({ items: exclusionSplit.live }),
      ...Array.isArray(graphDropped) ? graphDropped : []
    ])
  ];
  const sections = km === null ? [] : km.materials;
  const gapMerged = parseKnowledgeMapRaw(knowledgeMapText);
  const readerGap = readerGapReading({
    returnedText: readerQuestionnaireReturn,
    slices: effectiveReaderSlices(gapMerged).slices,
    exclusions: exclusionSplit.live
  });
  const questionnaireReturned = readerQuestionnaireSaved === true || typeof readerQuestionnaireReturn === "string" && readerQuestionnaireReturn.trim() !== "";
  const advanceExit = questionnaireReturned ? EXPLORE_CONFIRM_EXITS.questionnaire : EXPLORE_CONFIRM_EXITS.untouched;
  const advanceKind = questionnaireReturned ? EXPLORE_CONFIRM_STANCE_KINDS.human : EXPLORE_CONFIRM_STANCE_KINDS.aiPrior;
  const recordedAnswerer = EXPLORE_CONFIRM_ANSWERERS.includes(meta?.answerer) ? meta.answerer : null;
  const summaryLine = `AI \u5DF2\u5904\u7406\u5B8C\u6750\u6599\uFF0C\u6574\u7406\u51FA\uFF1A\u8F6C\u6362\u6210\u529F\u7684\u6750\u6599 ${sum.sources ?? 0} \u4EFD\uFF0C\u77E5\u8BC6\u70B9 ${sum.knowledgePoints ?? 0} \u4E2A\uFF0C\u5EFA\u8BAE\u5206 ${sum.chapterSuggestion ?? 0} \u7AE0\u3002`;
  const methods = km === null ? [] : km.methods;
  const sectionTitles = (material) => Array.isArray(material?.sections) ? material.sections.map((s) => String(s?.title ?? "")).filter((t) => t !== "") : [];
  const standingText = (material) => typeof material?.standing === "string" && material.standing.trim() !== "" ? material.standing.trim() : null;
  const roleText = (material) => typeof material?.role === "string" && material.role.trim() !== "" ? material.role.trim() : null;
  const basisText = (material) => typeof material?.basis === "string" && material.basis.trim() !== "" ? material.basis.trim() : null;
  const toggleReason = (reason) => {
    setReasons(
      (prev) => prev.includes(reason) ? prev.filter((item) => item !== reason) : [...prev, reason]
    );
  };
  const cancelReject = () => {
    setRejecting(false);
    setReasons([]);
    setRejectNote("");
  };
  return (0, import_react9.createElement)(
    "div",
    { style: S.focus },
    // ── 卡头行（共用小件，票 01）：问句 → 里程碑标题（可选中间行 `lead`）→ 事实句 ─────────
    // 票 `ui-display-redesign/03` 的块序（spec §2.3 第 1–3 块）：
    // ① 卡头问句＝这一屏的主问题（**存量句**，逐字沿用 `decisionOf("explore").question`）；
    // ② 里程碑标题 `🔍 材料读完了！`＝存量抬头（6 处判据锚在它上面，⛔ 本票不改一个字）；
    // ③ 事实句＝卡内摘要那一句（⛔ 不另立第二条统计行）。
    // ⚠️ 问句字面量住在**本文件**（票 01 的 API 约定：人设取证面只读卡片自己文件的 `<strong>`）；
    // 字号/间距/颜色归共用件，⛔ 不在这里另写一份。
    (0, import_react9.createElement)(CardHead, {
      question: (0, import_react9.createElement)("strong", { style: CARD_HEAD_QUESTION_STYLE }, EXPLORE_CARD_QUESTION),
      lead: (0, import_react9.createElement)("strong", { style: { fontSize: "13px" } }, "\u{1F50D} \u6750\u6599\u8BFB\u5B8C\u4E86\uFF01"),
      facts: summaryLine
    }),
    // ── 票 `confirm-points-redesign-build/04`：`📚 AI 建议的章节安排（后续可再调）`那一块**删了** ──
    // 逐章安排归站 7、几章归站 6（06 §2 与 spec §3.2 站 2 逐字）——留在这儿就是**第三处真相**。
    // ⚠️ 那个数据字段（合并件的 `chapterSuggestion`）**没有变成孤儿**：它照旧有读者——
    //   ① 阶段页那份**就地折叠**（`machine-product-folds.foldKnowledgeMap` 的「📚 章节建议（N 章）」，
    //      另一副说法、另一处读法，措辞本来就与这张卡有意不同）；
    //   ② 上面那一块的**量级读数**（分母＝章数）与 `workflow.js` 给 `exploreSummary.chapterSuggestion`
    //      算的那个数（摘要句「建议分 N 章」）；
    //   ③ 合并件那一侧（`knowledge-map-assembly` 的逐字搬运族、形状闸、补图那一档的搬运）。
    // ⇒ 删的是这一块的**渲染**，⛔ 不是那个字段。
    // ── 合一（票 `confirm-points-redesign-build/04`）──────────────────────────────
    // 今天那两颗**并列的折叠键**（「▸ 知识点清单（N 个，点开看）」＋「▸ 知识点图（…）」）
    // 并成**一个块**：块里一颗两分段控件（`图｜清单`，**默认图**），图是主视图。
    // ⚠️ 那栏「本书必须覆盖的知识点」也并进同一个块（合一之前它与上面两处同屏三块）。
    // 详细口径与「为什么」写在下面 `ExplorePointsBlock` 的注释里。
    // ⚠️ 老书那一档（合并件没有图的两个键）照旧看得见清单：块在、只是没有「图」那一段。
    // 票 `ui-display-redesign/03`：整块**提到 AI 重点/难点之前**（spec §2.3 第 4 块）——
    // 先给「本书要覆盖哪些知识点」，再给 AI 自己挑的重点。
    kps.length > 0 || methods.length > 0 || km !== null && km.graph !== null ? (0, import_react9.createElement)(ExplorePointsBlock, {
      key: "points",
      kps,
      methods,
      graph: km === null ? null : km.graph,
      // 合并件（喂那条「本次扫面 N 条边」的读数；`null` ＝ 拿不到）
      merged: km === null || km.graph === null ? null : {
        knowledgePoints: kps,
        materials: km.materials,
        chapterSuggestion: chapters,
        cards: km.graph.cards,
        edges: km.graph.edges
      },
      // 票 09：量级／「已剔除·已失效」三条读数的**现算值**——与覆盖闸门、
      // `outline` 交办读的是同一份集合（`keptCount` 就是那个 N）。
      keptCount,
      live: exclusionSplit.live,
      stale: exclusionSplit.stale,
      problems: exclusions.problems,
      chapterCount: chapters.length,
      // 票 08：图上／清单上那两颗裁决键的**同一个入口**（两条走同一条 `graph-opinion`）。
      droppedKeys,
      // 票 `confirm-points-redesign-build/10`：承接下来、先画到图上的那条下沿。
      predrawn: Array.isArray(predrawnLowerBoundary) ? predrawnLowerBoundary : [],
      onVerdict: onGraphVerdict,
      busy
    }) : null,
    // ── AI 重点/难点（〔首〕）：票 `ui-display-redesign/03` 跟着知识点那一块（第 5 块）──────
    focus.length > 0 ? (0, import_react9.createElement)(
      "div",
      {
        style: {
          margin: "4px 0 8px",
          padding: "8px 10px",
          background: "var(--dsw-alias-bg-layer-1)",
          borderRadius: "8px",
          border: "1px solid var(--dsw-alias-border-l2)"
        }
      },
      (0, import_react9.createElement)(
        "p",
        { style: { margin: "0 0 4px", fontSize: "12px", opacity: 0.8 } },
        "AI \u5224\u65AD\u7684\u91CD\u70B9/\u96BE\u70B9\uFF1A"
      ),
      focus.map(
        (item, index) => (0, import_react9.createElement)(
          "div",
          { key: index, style: { fontSize: "12px", margin: "2px 0" } },
          `\xB7 ${item}`
        )
      )
    ) : null,
    // ── 读材料报告〔折〕：票 `ui-display-redesign/03` 把这一块从「置顶」移到第 6 块──────
    // 票 20（裁决 2026-10-06）：报告**默认收起**——那一行小标题照旧在（收起态也看得见
    // 「这一屏有一份读材料报告」），正文要那一颗**纯展开收起**的键点开才铺出来。
    reportBlocks.length > 0 ? (0, import_react9.createElement)(
      "div",
      { style: { ...S.card, marginBottom: "10px" } },
      (0, import_react9.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontSize: "12px", opacity: 0.8 } },
        "\u{1F4CB} \u8BFB\u6750\u6599\u62A5\u544A\uFF08AI \u901A\u8BFB\u540E\u7684\u5B8C\u6574\u8BB0\u5F55\uFF09\uFF1A"
      ),
      (0, import_react9.createElement)(
        "button",
        {
          style: S.smallLink,
          onClick: () => setShowReport(!showReport),
          "aria-expanded": showReport
        },
        showReport ? "\u25BE \u6536\u8D77\u5168\u6587" : "\u25B8 \u5C55\u5F00\u5168\u6587"
      ),
      showReport ? (0, import_react9.createElement)("div", { style: { marginTop: "6px" } }, ...reportBlocks) : null
    ) : null,
    sections.length > 0 ? (0, import_react9.createElement)(
      "div",
      { style: { margin: "4px 0 8px" } },
      (0, import_react9.createElement)(
        "button",
        {
          style: S.smallLink,
          onClick: () => setShowSections(!showSections)
        },
        // 票 09：量词「份」只管材料，「本」留给「书」——这两句数的是材料。
        showSections ? "\u25BE \u6536\u8D77\u6BCF\u4EFD\u6750\u6599\u91CC\u8BFB\u5230\u7684\u5C0F\u8282" : "\u25B8 \u6BCF\u4EFD\u6750\u6599\u91CC\u8BFB\u5230\u7684\u5C0F\u8282\uFF08\u70B9\u5F00\u770B\uFF09"
      ),
      showSections ? (0, import_react9.createElement)(
        "div",
        {
          style: {
            marginTop: "6px",
            padding: "8px 10px",
            background: "var(--dsw-alias-bg-layer-1)",
            borderRadius: "8px",
            border: "1px solid var(--dsw-alias-border-l2)"
          }
        },
        sections.map((material, index) => {
          const titles = sectionTitles(material);
          const standing = standingText(material);
          const role = roleText(material);
          const basis = basisText(material);
          return (0, import_react9.createElement)(
            "div",
            {
              key: index,
              style: { fontSize: "12px", margin: "2px 0" }
            },
            `\u8D44\u6599${material?.num ?? index + 1}\uFF1A`,
            (0, import_react9.createElement)(
              "span",
              { style: { opacity: 0.8 } },
              titles.join(" / ") || "\uFF08\u672A\u8BFB\u5230\u5C0F\u8282\u6807\u9898\uFF09"
            ),
            // 票 `pre-gold-build/02`：**角色 ＋ 依据**落在这**同一行**里
            // （⛔ 不新增折叠块——这一屏的容量问题在 `seams.md` §C4 记过）。
            // ⚠️ 措辞与折叠那一份（`foldKnowledgeMap` 的「📄 材料小节」）
            // 有意不同：「数据同源、措辞各自成篇」是既有裁决。
            role !== null ? (0, import_react9.createElement)(
              "div",
              { style: { opacity: 0.75, marginTop: "1px" } },
              `\u89D2\u8272\uFF1A${role}${basis === null ? "" : `\uFF08\u4F9D\u636E\uFF1A${basis}\uFF09`}`
            ) : null,
            standing !== null ? (0, import_react9.createElement)(
              "div",
              { style: { opacity: 0.75, marginTop: "1px" } },
              `\u5206\u91CF\u58F0\u660E\uFF1A${standing}`
            ) : null
          );
        })
      ) : null
    ) : null,
    // 票 `ui-display-redesign/03`：~~师生合版独有内容比对~~折叠块**删除**（spec §2.3 第 8 行）——
    // 内容**不丢**：它仍在那份「读材料报告」的全文里（`工作区/explore.md` 的「教师用书独有内容」
    // 小节；报告折叠块与「👀 看完整报告」都能看到）。原来那一块是「长报告之外的第二个出口」，
    // 票 03 把报告移到这里之后两处读法已经相邻，再单列一块就是同一件事说两遍。
    // ── 票 `ui-display-redesign/03`：卡底前那一行「这一版按什么成文」──────────────────
    // 卡内问卷块**整块移出**（spec §2.3 第 9 行）：收卷人第一问、AI 起草稿那一格、
    // 「照 AI 起草的办」、身份自述全随块离开；卡底只剩这一行（入口只在顶栏面板）。
    // · 没有回卷：`本次按 AI 先验执行（还没有人答问卷）· 去答问卷`（入口仍走既有
    //   `onOpenReaderQuestionnaire`，⛔ 不新开可点区域、不重做通道）；
    // · 有回卷：`按回卷成文（X 填的）`（X＝书上记着的收卷人；没记下就只说「按回卷成文」）。
    // 把手两格：`data-reader-stance`＝推进键那一跳会走的**出口**（untouched／questionnaire），
    // `data-reader-stance-kind`＝身份档（ai-prior／human）——与 `advanceExit` **同源**，
    // ⛔ 不是第二套判据。
    (0, import_react9.createElement)(
      "p",
      {
        "data-reader-stance": advanceExit,
        "data-reader-stance-kind": advanceKind,
        style: { margin: "6px 0 4px", fontSize: "12px", fontWeight: 600, opacity: 0.9 }
      },
      questionnaireReturned ? `\u6309\u56DE\u5377\u6210\u6587${recordedAnswerer === null ? "" : `\uFF08${recordedAnswerer}\u586B\u7684\uFF09`}` : `${EXPLORE_CONFIRM_AI_PRIOR_STATEMENT}\uFF08\u8FD8\u6CA1\u6709\u4EBA\u7B54\u95EE\u5377\uFF09`,
      questionnaireReturned ? null : "\uFF0C",
      questionnaireReturned ? null : (0, import_react9.createElement)(
        "button",
        {
          "data-open-reader-questionnaire": "1",
          style: S.disabled(S.smallLink, busy),
          disabled: busy,
          onClick: onOpenReaderQuestionnaire
        },
        EXPLORE_READER_STANCE_GOTO_LABEL
      )
    ),
    (0, import_react9.createElement)(
      "p",
      { style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
      // 票 `demo-channel-full/26`：末句「AI 会照着改」对演示书是假话（同探针 `acts` 段①：
      // 报告 mtime 变了、sha 前后一致，用户那句只落 `meta.exploreRedoNote`）⇒ 两取值。
      exploreConfirmNote(meta)
    ),
    rejecting ? (0, import_react9.createElement)(
      "div",
      {
        style: {
          marginTop: "10px",
          borderTop: "1px dashed var(--dsw-alias-border-l2)",
          paddingTop: "8px"
        }
      },
      (0, import_react9.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontWeight: 600 } },
        // 票 14（承诺账 D「说不清」第 7 条）：「10 秒」估的是用户自己的操作成本、
        // 不是系统耗时，代码里断不了真假——收掉这个数字（点选或写一句本身已经够短）。
        "\u54EA\u91CC\u4E0D\u6EE1\u610F\uFF1F\uFF08\u70B9\u9009\u6216\u5199\u4E00\u53E5\uFF09"
      ),
      (0, import_react9.createElement)(
        "div",
        { style: { margin: "6px 0" } },
        RE_EXPLORE_REASONS.map(
          (reason) => (0, import_react9.createElement)(
            "label",
            { key: reason, style: S.checkItem },
            (0, import_react9.createElement)("input", {
              type: "checkbox",
              checked: reasons.includes(reason),
              onChange: () => toggleReason(reason)
            }),
            ` ${reason}`
          )
        )
      ),
      (0, import_react9.createElement)("textarea", {
        style: S.textarea,
        placeholder: "\u60F3\u591A\u8BF4\u4E00\u53E5\uFF1F\u5728\u8FD9\u91CC\u5199\uFF08\u53EF\u9009\uFF09",
        value: rejectNote,
        onChange: (e) => setRejectNote(e.target.value)
      }),
      (0, import_react9.createElement)(
        "div",
        { style: { marginTop: "8px", display: "flex", gap: "8px" } },
        (0, import_react9.createElement)(
          "button",
          {
            style: S.disabled(S.bigBtn(false), busy),
            // 票 `rcb-build/04`：驳回那一支**不**带出口读数——它不是一次放行；那一次
            // 表态（含收卷人）若已发生，仍留在结论件与 `meta.answerer` 的既有位置上
            // （「驳回也留」那条纪律管的是结论件本身，⛔ 不把驳回冒充成一条放行出口）。
            onClick: () => onConfirm(false, { reasons, note: rejectNote }),
            disabled: busy
          },
          EXPLORE_CONFIRM_REWRITE_CONFIRM_LABEL
        ),
        (0, import_react9.createElement)(
          "button",
          {
            style: { ...S.smallLink, textDecoration: "none" },
            onClick: cancelReject
          },
          "\u53D6\u6D88"
        )
      )
    ) : (0, import_react9.createElement)(
      "div",
      // 票 `walkthrough-fixes/38`：这三颗（确认／重做／看完整报告）是**这一屏的主推进键行**——
      // 它们跟着卡片滚，卡片一高出焦点区可视带，主推进键就整颗掉到带外（实测键顶距带顶 914px、
      // 带高只有 425.5px）。⇒ 用公共那一格 `S.stickyActions` 贴住带底。
      // ⚠️ 同屏**不新增**任何可点区域：贴上来的就是**本来这三颗**，只是让这一行在卡滚时停在带底。
      // ⛔ 不是票 18 删掉的那条「在卡外另起一条、条上放同名副本」的吸底条（同屏两颗同名键）。
      // 口径与「为什么不是把卡自动滚进去」写在 `styles.js` 那一格的头注释里。
      // ⚠️ 本票只给站 2 这一屏上（票 20 那句「不要一次改全部」照旧成立）：章节安排那一张（本文件
      // 后面 `OUTLINE_CONFIRM_ACCEPT_LABEL` 那一支）不动。
      { style: { ...S.stickyActions, display: "flex", gap: "8px", flexWrap: "wrap" } },
      (0, import_react9.createElement)(
        "button",
        {
          style: S.disabled(S.bigBtn(true), busy),
          // 票 `ui-display-redesign/03`：拍板这一跳带上**这一次表态的出口读数**（`feedback.exit`）——
          // 壳经共享件的 `exploreConfirmPayload()` 把它落成 `values`，服务端再写进既有结论件
          // 的 `values`（⛔ 不新产物、⛔ 不新 meta 键）。
          // ⚠️ 出口与卡底那一行**同源**（`advanceExit`）：盘上有回卷 ⇒ `questionnaire`，否则
          // `untouched`。收卷人那一格**不随这一跳走**——卡内已没有收卷人选择，旧的
          // `values.answerer` 发射点随问卷块一起离开（写点挪到回卷动作归票 11）。
          onClick: () => onConfirm(true, { exit: advanceExit }),
          disabled: busy,
          // 票 `auto-walkthrough/04`：关键键的语义钩子（票 20／18 的事故键，文案重名）。
          "data-explore-confirm": "1"
        },
        EXPLORE_CONFIRM_ACCEPT_LABEL
      ),
      (0, import_react9.createElement)(
        "button",
        {
          style: S.disabled({
            ...S.bigBtn(true),
            background: "transparent",
            color: "var(--dsw-alias-state-error-primary)"
          }, busy),
          onClick: () => setRejecting(true),
          disabled: busy
        },
        EXPLORE_CONFIRM_REWRITE_LABEL
      ),
      (0, import_react9.createElement)(
        "button",
        {
          style: S.disabled({ ...S.smallLink, textDecoration: "none" }, busy),
          onClick: onViewReport,
          disabled: busy
        },
        "\u{1F440} \u770B\u5B8C\u6574\u62A5\u544A"
      )
    ),
    // ── 票 `rcb-build/09`：卡尾那一栏「缺口」（**独立一块**，⛔ 不住上面问卷那一块里）──────
    // 它是**派生读数**的呈现：片级一条 ＋「本片 N 条」，三类各占各的区，每条旁挂
    // **图上逐卡划**那颗能走的动作。没有缺口 ⇒ 那个组件自己 `return null`（整块不渲染）。
    // ⚠️ 它**不是闸、不是出口**：不落剔除记录、不触发剔除、不拦放行（读数的下游只有人眼）。
    (0, import_react9.createElement)(ReaderGapBlock, { key: "reader-gap", reading: readerGap })
  );
}
var EXPLORE_POINTS_VIEWS = Object.freeze([
  Object.freeze({ id: "graph", label: "\u56FE" }),
  Object.freeze({ id: "list", label: "\u6E05\u5355" })
]);
var EXPLORE_POINTS_VIEW_MAX_HEIGHT = 920;
function ExplorePointsBlock(props) {
  const {
    kps,
    methods,
    graph,
    merged,
    keptCount,
    live,
    stale,
    problems,
    chapterCount,
    droppedKeys,
    // 票 `confirm-points-redesign-build/10`：预画的下沿（问卷／分组面画上来的那几条卡键）。
    predrawn,
    onVerdict,
    busy
  } = props;
  const cards = graph === null || graph === void 0 ? [] : graph.cards;
  const edges = graph === null || graph === void 0 ? [] : graph.edges;
  const hasGraph = graph !== null && graph !== void 0;
  const [view, setView] = (0, import_react9.useState)(hasGraph ? "graph" : "list");
  const bodyRef = (0, import_react9.useRef)(null);
  const [viewWidth, setViewWidth] = (0, import_react9.useState)(null);
  (0, import_react9.useEffect)(() => {
    const node = bodyRef.current;
    if (node === null) return void 0;
    const measure = () => setViewWidth(measureKgViewportWidth(node));
    measure();
    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      return () => observer.disconnect();
    }
    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    return void 0;
  }, []);
  const narrow = hasGraph && kgViewportIsNarrow(viewWidth);
  const shown = kgPointsView({ hasGraph, requested: view, measuredWidth: viewWidth });
  const rows = Array.isArray(kps) ? kps : [];
  const methodRows = Array.isArray(methods) ? methods : [];
  const dropped = Array.isArray(droppedKeys) ? droppedKeys : [];
  const cardKeyOfTitle = /* @__PURE__ */ new Map();
  for (const card of cards) {
    const key = normalizeKnowledgePointTitle(typeof card?.name === "string" ? card.name : "");
    if (key !== "" && !cardKeyOfTitle.has(key)) cardKeyOfTitle.set(key, card.key);
  }
  const liveKeys = new Set(exclusionKeysOf({ items: Array.isArray(live) ? live : [] }));
  const liveTitles = new Set(
    (Array.isArray(live) ? live : []).map((item) => normalizeKnowledgePointTitle(item?.title)).filter((t) => t !== "")
  );
  const isDropped = (cardKey, titleKey) => cardKey !== void 0 && (liveKeys.has(cardKey) || dropped.includes(cardKey)) || titleKey !== "" && liveTitles.has(titleKey);
  const droppedForModel = cards.filter((card) => isDropped(card.key, normalizeKnowledgePointTitle(card.name))).map((card) => card.key);
  const graphModel = hasGraph ? knowledgeGraphModel({ cards, edges, dropped: droppedForModel }) : null;
  const rowAction = (cardKey, droppedRow, rowState) => {
    if (cardKey === void 0) return null;
    const restoring = droppedRow === true;
    if (!restoring && graphModel !== null && rowState !== "frontier" && rowState !== "upper") return null;
    const verdict = restoring ? KG_VERDICTS.keep : KG_VERDICTS.drop;
    return (0, import_react9.createElement)(
      "button",
      {
        type: "button",
        style: S.disabled(S.smallLink, busy === true),
        disabled: busy === true,
        "data-kg-point-key": cardKey,
        onClick: () => {
          if (typeof onVerdict !== "function") return;
          Promise.resolve(onVerdict(cardKey, verdict, EXCLUSION_REASON_NOT_NEEDED)).catch(() => {
          });
        }
      },
      restoring ? KG_DIALOG_KEYS.restore : KG_DIALOG_KEYS.drop
    );
  };
  const readings = edgeScanReading(merged);
  const magnitude = magnitudeReading({ kept: keptCount, chapters: chapterCount });
  const staleNote = exclusionStaleReading(stale);
  const alreadyKnownLive = (Array.isArray(live) ? live : []).filter((item) => item?.reason === EXCLUSION_REASON_ALREADY_KNOWN);
  const segStyle = (active) => ({
    border: active ? "none" : "1px solid var(--dsw-alias-border-l2)",
    borderRadius: "6px",
    padding: "4px 14px",
    fontSize: "12px",
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    background: active ? "var(--dsw-alias-state-business-primary)" : "transparent",
    color: active ? "var(--dsw-alias-label-primary-foreground)" : "inherit"
  });
  const rowStyle = (droppedRow) => ({
    fontSize: "12px",
    margin: "2px 0",
    padding: "3px 6px",
    borderRadius: "6px",
    display: "flex",
    gap: "8px",
    alignItems: "baseline",
    justifyContent: "space-between",
    // 「已否」那一档的形状：灰 ＋ 虚线 ＋ 删除线（与图上的 `KG_CARD_TONES.dropped` 同一副样子）。
    background: droppedRow ? "var(--dsw-alias-bg-skeleton)" : "transparent",
    border: droppedRow ? "1px dashed var(--dsw-alias-border-l2)" : "1px solid transparent",
    opacity: droppedRow ? 0.65 : 1,
    textDecoration: droppedRow ? "line-through" : "none"
  });
  return (0, import_react9.createElement)(
    "div",
    {
      style: {
        margin: "4px 0 8px",
        padding: "8px 10px",
        background: "var(--dsw-alias-bg-layer-1)",
        borderRadius: "8px",
        border: "1px solid var(--dsw-alias-border-l2)",
        fontSize: "12px"
      },
      "data-kg-merged": "1",
      "data-kg-view": shown,
      "data-kg-exclusions": "1",
      "data-kg-exclusions-kept": String(keptCount),
      "data-kg-exclusions-dropped": String(Array.isArray(live) ? live.length : 0),
      "data-kg-exclusions-stale": String(Array.isArray(stale) ? stale.length : 0)
    },
    (0, import_react9.createElement)(
      "div",
      { style: { fontWeight: 600, margin: "0 0 4px" }, "data-kg-heading": "1" },
      // 票 `confirm-points-redesign-build/04`：那一块**只报一个数**——`还剩 K 个`（＝覆盖闸门读的
      // 同一份集合）＋`共 N 个`（这份合并件上有几条知识点）＋`已划掉 M 条`（那份件里还算数的条目）。
      // ⚠️ 合一之前这里是两处**不同源**的读数（清单那颗折叠键报 `kps.length`、
      // 这一栏报 `keptCount`）⇒ 现在只有这一处。
      `\u{1F9ED} \u672C\u4E66\u5FC5\u987B\u8986\u76D6\u7684\u77E5\u8BC6\u70B9\uFF08\u8FD8\u5269 ${keptCount} \u4E2A\uFF0C\u5171 ${rows.length} \u4E2A\uFF0C\u5DF2\u5212\u6389 ${Array.isArray(live) ? live.length : 0} \u6761\uFF09\u2014\u2014\u6BCF\u6761\u90FD\u8981\u6709\u7AE0\u8282\u8BA4\u9886\uFF1A`
    ),
    // 两颗分段键：一颗控件、两段。⛔ 今天那两颗**并列的折叠键不再存在**。
    (0, import_react9.createElement)(
      "div",
      { style: { display: "flex", gap: "4px", margin: "4px 0 6px" }, role: "group", "data-kg-view-switch": "1" },
      ...EXPLORE_POINTS_VIEWS.filter((one) => one.id === "list" || hasGraph && !narrow).map(
        (one) => (0, import_react9.createElement)(
          "button",
          {
            key: one.id,
            type: "button",
            style: segStyle(shown === one.id),
            "data-kg-view-option": one.id,
            "aria-pressed": shown === one.id,
            onClick: () => setView(one.id)
          },
          one.label
        )
      )
    ),
    (0, import_react9.createElement)(
      "div",
      { style: { margin: "2px 0", opacity: 0.85 }, "data-kg-exclusions-note": "1" },
      Array.isArray(live) && live.length === 0 ? "\xB7 \u8FD8\u6CA1\u6709\u4EBA\u5212\u6389\u4EFB\u4F55\u4E00\u6761\u3002" : `\xB7 \u4EBA\u5DF2\u5212\u6389 ${Array.isArray(live) ? live.length : 0} \u6761\uFF0C\u5B83\u4EEC\u4E0D\u5728\u8FD9 ${keptCount} \u6761\u91CC\uFF1A${(Array.isArray(live) ? live : []).map((item) => item.title).join("\u3001")}`
    ),
    // ── 票 `rcb-build/06`：三条如实说明（⛔ 都不是新事实源，全是**现算**读数）──────────────
    // ⚠️ 票 `ui-systematic-fixes/01` 起这三条走**正文出口**（`bodyOf` · spec §3）：`**重点**`
    //    变成真加粗（原来连着星号一起印在屏上），而**机器路径不占正文**——它只进悬停提示
    //    （见下面第三条那个 `title`；§3·2「机器 id 与路径只许进悬停提示」）。
    // ① 出处那一句（ADR-0040 决策 3 的第 3 条护栏）：N ＝ 还算数的「已经会」条数。
    //    ⛔ 不冒充「你在这张图上点过」；同时把那条**无法区分**的窄处说出来——记录里
    //    **有意**没有「哪条从哪来」这一格（⛔ 不给条目加归属字段），所以这一行**不替它们分归属**。
    alreadyKnownLive.length === 0 ? null : (0, import_react9.createElement)(
      "div",
      { style: { margin: "2px 0", opacity: 0.85 }, "data-kg-exclusions-source-note": "1" },
      ...bodyOf(
        `\xB7 \u8FD9 ${alreadyKnownLive.length} \u6761\uFF08\u7406\u7531\uFF1D\u300C${EXCLUSION_REASON_ALREADY_KNOWN}\u300D\uFF09\u662F**\u7167\u4F60\u56DE\u5377\u4EF6\u4E0A\u7684\u52FE\u9009**\u8BB0\u7684\u2014\u2014\u26D4 \u4E0D\u662F\u300C\u4F60\u5728\u8FD9\u5F20\u56FE\u4E0A\u70B9\u8FC7\u300D\u3002\u56FE\u4E0A\u4F60\u81EA\u5DF1\u5212\u7684\u90A3\u6279\u4E5F\u843D\u5728\u540C\u4E00\u4EFD\u8BB0\u5F55\u91CC\uFF0C\u8FD9\u4E00\u884C\u4E0D\u66FF\u5B83\u4EEC\u5206\u5F52\u5C5E\uFF08\u8BB0\u5F55\u91CC\u6709\u610F\u4E0D\u5B58\u300C\u54EA\u6761\u4ECE\u54EA\u6765\u300D\u8FD9\u4E00\u683C\uFF09\u3002`,
        BODY_KIND_MARKDOWN
      )
    ),
    // ② 已知窄处（spec §2.2／ADR-0040 决策 1 的自陈）：剔除按 `title` 归一化后相等判。
    Array.isArray(live) && live.length > 0 ? (0, import_react9.createElement)(
      "div",
      { style: { margin: "2px 0", opacity: 0.85 }, "data-kg-exclusions-title-note": "1" },
      ...bodyOf(
        "\xB7 \u5DF2\u77E5\u7A84\u5904\uFF1A\u5254\u9664\u6309\u77E5\u8BC6\u70B9 title \u5F52\u4E00\u5316\u540E\u76F8\u7B49\u5224 \u21D2 **\u540C\u4E00\u4E2A title \u7684\u591A\u6761\u4F1A\u4E00\u8D77\u88AB\u5254**\uFF08\u95F8\u95E8\u552F\u4E00\u90A3\u628A\u5C3A\u5B50\u5C31\u662F title\uFF1B\u60F3\u9010\u6761\u5254\u5F97\u5148\u7ED9\u8986\u76D6\u95F8\u95E8\u52A0\u7B2C\u4E8C\u4E2A\u952E\uFF09\u3002",
        BODY_KIND_MARKDOWN
      )
    ) : null,
    // ③ 回退下场（票 `rcb-build/06` 二选一选定「**不随回退走**」）：如实说出后果与代价。
    //    ⚠️ 叙述里**不写机器路径**（§3·2 正文只印人读的那半）：两个件名进 `title` 悬停。
    Array.isArray(live) && live.length > 0 ? (0, import_react9.createElement)(
      "div",
      {
        style: { margin: "2px 0", opacity: 0.85 },
        "data-kg-exclusions-rollback-note": "1",
        title: `\u673A\u5668\u4EF6\uFF1A${DECISION_DIR_REL}/NN.json\uFF08\u56DE\u9000\u642C\u8D70\u7684\u90A3\u4E00\u65CF\uFF09\uFF1B${KNOWLEDGE_MAP_EXCLUSIONS_REL}\uFF08\u4E0D\u968F\u56DE\u9000\u8D70\uFF09`
      },
      ...bodyOf(
        "\xB7 \u56DE\u9000\u4E0B\u573A\uFF08\u5982\u5B9E\uFF09\uFF1A\u8FD9\u4EFD\u88C1\u51B3**\u4E0D\u968F\u56DE\u9000\u8D70**\u2014\u2014\u56DE\u9000\u7167\u65E7\u53EA\u642C\u62CD\u677F\u5B58\u6863\u90A3\u4E00\u65CF\uFF1B\u8FD9\u4E00\u4EFD\u4F1A**\u7167\u65E7\u7559\u5728\u4E66\u5939\u91CC**\uFF0C\u6BCF\u6761\u81EA\u5E26\u7684\u8BB0\u5F55\u65F6\u95F4\u5C31\u662F\u5B83\u81EA\u5DF1\u7684\u8FFD\u6EAF\uFF08\u56DE\u9000\u540E\u8D26\u672C\u4E0A\u4E0D\u518D\u6709\u5B83\u5BF9\u5E94\u7684\u90A3\u4E00\u7B14\uFF09\u3002",
        BODY_KIND_MARKDOWN
      )
    ) : null,
    (0, import_react9.createElement)(
      "div",
      { style: { margin: "2px 0" }, "data-kg-reading": "edge-scan" },
      `\xB7 ${readings.text}`
    ),
    (0, import_react9.createElement)(
      "div",
      { style: { margin: "2px 0" }, "data-kg-reading": "magnitude" },
      `\xB7 ${magnitude}`
    ),
    staleNote === null ? null : (0, import_react9.createElement)(
      "div",
      { style: { margin: "2px 0" }, "data-kg-reading": "exclusion-stale" },
      `\xB7 ${staleNote}`
    ),
    // 形状坏了＝硬闸（票 09 §A）：这里只说清「会被拦下」，真正拦的那一处是 outline 交工。
    Array.isArray(problems) && problems.length > 0 ? (0, import_react9.createElement)(
      "div",
      { style: { margin: "2px 0", color: "var(--dsw-alias-state-error-primary)" }, "data-kg-exclusions-problems": "1" },
      `\u26A0\uFE0F \u90A3\u4EFD\u4EBA\u5199\u7684\u88C1\u51B3\u8BB0\u5F55\u8BFB\u4E0D\u51FA\uFF08${problems[0]}\uFF09\u2014\u2014\u4EA4\u5DE5\u65F6\u4F1A\u88AB\u673A\u5668\u62E6\u4E0B\uFF0C\u5148\u4FEE\u597D\u5B83\u6216\u5220\u6389\u5B83\u3002`
    ) : null,
    (0, import_react9.createElement)(
      "div",
      {
        ref: bodyRef,
        // 内滚封顶：只封**视图区**，抬头／控件／读数不进这个盒。
        // 上限 920 ＝ 最多完整放下 6 层卡；它是 `maxHeight`，短书仍贴着内容收（票 `knowledge-graph-step/17`）。
        // 票 `ui-display-redesign/12`：**显式禁横滚**——纵向一封顶它就成了滚动盒，横向默认跟着
        // 变成 `auto`，内容宽一点点就出一条横滚条。宽度已按这只盒子的 `clientWidth` 量
        // （图本体与「窄到放不下就切清单」量的是同一只），这里再把横滚这一条**显式**关掉。
        style: {
          marginTop: "4px",
          maxHeight: `${EXPLORE_POINTS_VIEW_MAX_HEIGHT}px`,
          overflowY: "auto",
          overflowX: "hidden"
        },
        "data-kg-view-body": "1"
      },
      shown === "graph" ? (0, import_react9.createElement)(KnowledgeGraphView, { key: "kg", cards, edges, dropped, predrawn, onVerdict, busy }) : (0, import_react9.createElement)(
        "div",
        { "data-kg-list": "1" },
        rows.length === 0 ? (0, import_react9.createElement)("div", { style: { opacity: 0.7 } }, "\uFF08\u8FD9\u4EFD\u5408\u5E76\u4EF6\u91CC\u6CA1\u6709\u77E5\u8BC6\u70B9\uFF09") : rows.map((point, index) => {
          const title = typeof point?.title === "string" ? point.title : "";
          const titleKey = normalizeKnowledgePointTitle(title);
          const cardKey = cardKeyOfTitle.get(titleKey);
          const droppedRow = isDropped(cardKey, titleKey);
          const rowState = cardKey === void 0 || graphModel === null ? null : graphModel.stateOf(cardKey);
          return (0, import_react9.createElement)(
            "div",
            {
              key: `kp-${index}`,
              style: rowStyle(droppedRow),
              "data-kg-point-row": titleKey === "" ? String(index) : titleKey,
              "data-kg-point-dropped": droppedRow ? "1" : "0"
            },
            (0, import_react9.createElement)(
              "span",
              null,
              `\xB7 ${title}`,
              point?.difficulty !== void 0 && point.difficulty !== "" && point.difficulty !== null ? (0, import_react9.createElement)(
                "span",
                {
                  style: {
                    // 票 06：不配兜底灰——上色从登记取值域派生（见 DIFF_COLORS 上方的注），
                    // 出域残值落成默认正文色，不再被「万能灰」兜成看不出问题。
                    color: DIFF_COLORS[point.difficulty]
                  }
                },
                `\uFF08${point.difficulty}\uFF09`
              ) : null,
              point?.source !== void 0 && point.source !== "" && point.source !== null ? (0, import_react9.createElement)("span", { style: { opacity: 0.5 } }, ` ${point.source}`) : null
            ),
            // 每行一颗键：没划掉的给「划掉」，已否的给「放回来」——两处同一条 `graph-opinion`。
            // ⚠️ 配不上卡键的那一行**不摆键**（机器那边没有这张卡，点了必 400）；
            // 票 16：有图的书上只有两端摆「划掉」，中段（`keep`）不摆（见 `rowAction`）。
            rowAction(cardKey, droppedRow, rowState)
          );
        }),
        // 票 pgb04/04：**教法**照旧住在清单这一支里（⛔ 不新开块）；一条都没有时整段不渲染。
        // 措辞与折叠那一份（`machine-product-folds.foldKnowledgeMap` 的「🧭 教法（N 条）」）
        // **有意不同**——「数据同源、措辞各自成篇」是既有裁决，两处不许互相改文案。
        methodRows.length === 0 ? null : (0, import_react9.createElement)(
          "div",
          {
            style: {
              marginTop: "8px",
              paddingTop: "6px",
              borderTop: "1px solid var(--dsw-alias-border-l2)"
            }
          },
          (0, import_react9.createElement)(
            "div",
            { style: { opacity: 0.8, marginBottom: "2px" } },
            `\u{1F6E0} \u6559\u6CD5\uFF08${methodRows.length} \u6761\uFF09\uFF1A`
          ),
          methodRows.map(
            (method, index) => (0, import_react9.createElement)(
              "div",
              { key: `method-${index}`, style: { fontSize: "12px", margin: "2px 0" } },
              `\xB7 ${method?.title ?? ""}`,
              method?.source !== void 0 && method.source !== "" && method.source !== null ? (0, import_react9.createElement)("span", { style: { opacity: 0.5 } }, ` ${method.source}`) : null
            )
          )
        )
      )
    )
  );
}
var outlineConfirmCardView = defineCardView({
  card: "OutlineConfirmCard",
  // 票 `knowledge-graph-build/09`：多一位 `knowledgeMapExclusions`（那份人的裁决的原文）——
  // 「本书必须覆盖的知识点（N 个）」那一栏从它现算，与覆盖闸门、探查确认卡**同一个 N**。
  fromBook: ["meta", "knowledgeMapText", "knowledgeMapExclusions", "busy", "confirmOutline"],
  required: ["meta", "confirmOutline"],
  defaults: {},
  // 整形：壳里不撞名的 `confirmOutline` → 卡片消费的那个 `onConfirm`；「第 N 章」那类派生全在
  // 卡内按 `meta` 现算（`:578-582`），不进这里。⚠️ `derive` 只拿得到一个参数（此刻的袋子，
  // `build` 的 ④）：delta 已排在它之前，从袋里读到的就是最终值。
  derive: (bag) => ({ onConfirm: bag.confirmOutline })
});
function OutlineConfirmCard(props) {
  const { meta, knowledgeMapText, knowledgeMapExclusions, busy, onConfirm } = props;
  const [rejecting, setRejecting] = (0, import_react9.useState)(false);
  const [note, setNote] = (0, import_react9.useState)("");
  const chapters = meta?.outline?.chapters ?? [];
  const [goldPick, setGoldPick] = (0, import_react9.useState)(() => {
    const initial = Number(meta?.goldChapter ?? 1);
    return Number.isSafeInteger(initial) && initial >= 1 && initial <= chapters.length ? initial : 1;
  });
  const goldReason = typeof meta?.goldChapterReason === "string" ? meta.goldChapterReason : "";
  const safePick = Number.isSafeInteger(Number(goldPick)) && Number(goldPick) >= 1 && Number(goldPick) <= chapters.length ? Number(goldPick) : 1;
  const knowledgeMap = parseKnowledgeMap(knowledgeMapText);
  const exclusions = parseExclusionsDocument(knowledgeMapExclusions);
  const graphCards = knowledgeMap !== null && knowledgeMap.graph !== null ? knowledgeMap.graph.cards : [];
  const exclusionSplit = liveExclusionsOf(exclusions.items, graphCards);
  const effectivePoints = effectiveKnowledgePoints(
    knowledgeMap === null ? [] : knowledgeMap.kps,
    exclusionSplit.live
  );
  const coverage = okMaterialNumbers(meta?.sources).length > 0 && knowledgeMap !== null && knowledgeMap.kps.length > 0 ? outlinePointsCoverage(effectivePoints, chapters) : null;
  const unclaimedCount = coverage === null ? 0 : coverage.claims.filter((claim) => claim.chapters.length === 0).length;
  const cardFacts = outlineCardFacts(chapters.length, unclaimedCount, coverage !== null);
  return (0, import_react9.createElement)(
    "div",
    { style: S.focus },
    // ── 卡头行（共用小件，票 01）：问句 → 事实句（票 `ui-display-redesign/06` 块序第 1–2 块）──
    // 问句＝这一屏的主问题（**存量句**，逐字沿用 `decisionOf("outline").question`）；事实句＝
    // 章数／覆盖认领状态／范例章可改选，三个都现算（⛔ 不写死「3 章」）。
    // ⚠️ 问句字面量住在**本文件**（票 01 的 API 约定：人设取证面只读卡片自己文件的 `<strong>`）。
    (0, import_react9.createElement)(CardHead, {
      question: (0, import_react9.createElement)("strong", { style: CARD_HEAD_QUESTION_STYLE }, OUTLINE_CARD_QUESTION),
      facts: cardFacts
    }),
    // ── 块序第 3 块：标题＋说明段（常显；说明段本身是存量句，两取值见 `outlineCardLead`）──────
    (0, import_react9.createElement)(
      "strong",
      { style: { fontSize: "13px" } },
      "\u{1F4D0} \u7AE0\u8282\u5B89\u6392\u51FA\u6765\u4E86\uFF01"
    ),
    (0, import_react9.createElement)(
      "p",
      { style: { margin: "6px 0" } },
      // 票 31 / ADR-0026（grilling Q1 选 B）：不印「全书大约 X 汉字」，也不印逐章字数。
      // 如实告知它为什么不在这里——等最佳范例章写完、实测之后再定（谈判桌上只报那一次）。
      // 票 `demo-channel-full/26`：「AI 计划…／AI 先把…写出来给你过目」两句对演示书的前半是假话
      // （章节安排来自零入参的 `demoOutline()`），后半是真的（演示书真写出那一章）⇒ 两取值。
      outlineCardLead(meta, chapters.length, safePick)
    ),
    (0, import_react9.createElement)(
      "div",
      {
        style: {
          margin: "4px 0 8px",
          padding: "8px 10px",
          background: "var(--dsw-alias-bg-layer-1)",
          borderRadius: "8px",
          border: "1px solid var(--dsw-alias-border-l2)"
        }
      },
      chapters.map((chapter, index) => {
        const pointsArr = Array.isArray(chapter?.points) ? chapter.points.map((pt) => String(pt ?? "").trim()).filter((pt) => pt !== "") : [];
        const points = pointsArr.join(" / ");
        const waived = chaptersWaivedPoints(meta, index + 1);
        const waivedCount = waived.points.length;
        return (0, import_react9.createElement)(
          "div",
          { key: index, style: { fontSize: "12px", margin: "4px 0" } },
          `${index + 1}. ${chapter.title ?? ""}`,
          chapter.outline !== void 0 && chapter.outline !== "" && chapter.outline !== null ? (0, import_react9.createElement)(
            "span",
            { style: { opacity: 0.6 } },
            `\u3000${chapter.outline}`
          ) : null,
          // 票 31 / ADR-0026：逐章那行原来的「约 N 汉字」也一并撤掉
          //（第 3 阶段不假装字数是承诺）；数据仍在 outline.chapters[].targetWords。
          chapter.source !== void 0 && chapter.source !== "" && chapter.source !== null ? (0, import_react9.createElement)(
            "div",
            { style: { opacity: 0.6, margin: "1px 0 0" } },
            `\u6E90\uFF1A${chapter.source}`
          ) : null,
          // 票 `kn-unowned-silent/02`：上限／实际／豁免放弃三个数**接在原来的那一行后面**——
          // 不另起一行：这一卡下面就是「选范例章」与两颗拍板键，多一行就多推 60px（走查读数
          // `demo-phase-3-outline` 的主推进键因此更容易掉出焦点带；基线本来就红，⛔ 不去加剧它）。
          // 三个数常显（不折）——它正是「本章有没有点数被放弃」这个问题的答案；有点被放弃时
          // 把它们的名字也点出来。
          pointsArr.length > 0 || waivedCount > 0 ? (0, import_react9.createElement)(
            "div",
            { style: { opacity: 0.6, margin: "1px 0 0" }, "data-outline-points-cap": "1" },
            pointsArr.length > 0 ? `\u8986\u76D6\u77E5\u8BC6\u70B9 ${pointsArr.length} \u4E2A${points !== "" ? `\uFF1A${points}` : ""}\uFF1B` : "",
            `\u77E5\u8BC6\u70B9\uFF1A\u4E0A\u9650 ${OUTLINE_POINTS_MAX} \u6761 / \u5B9E\u9645 ${pointsArr.length} \u6761 / \u8C41\u514D\u653E\u5F03 ${waivedCount} \u6761` + (waivedCount > 0 ? `\uFF08\u653E\u5F03\u7684\u662F\uFF1A${waived.points.join("\u3001")}\uFF09` : "")
          ) : null
        );
      })
    ),
    // ── 块序第 5 块〔折＋内滚〕：票 `ui-display-redesign/06`（spec §2.6）────────────────────
    // 票 `pipeline-wiring-gaps/12`：「必须覆盖 ↔ 已认领」对应清单——知识地图里每条知识点
    // 出一行，认领了的标章号，没认领的点名（用户拍板前自己核；漏了交工也会被机器拒并点名）。
    // 骨架里知识地图没有的条目同样点出（反向也是拒交项）。没有对照面时整节不渲染。
    // ⚠️ 默认**折起**：清单随知识点条数变长（几十条常见），常显会把「选范例章」与两颗拍板键
    // 一路推走；展开后清单那一块自己有内滚封顶。
    // 票 `ui-display-redesign/17`（收口 review S6）：折叠口是**原生 `<details>/<summary>`**——
    // spec §1 不许新增可点区域（票 06 那一版是一颗新增 `<button>`，同批同类折叠都是 `<details>`）。
    // 收起/展开由浏览器管：零动作、零组件状态；`<summary>` 文案静态（不换词）。
    coverage === null ? null : (0, import_react9.createElement)(
      "details",
      { style: { margin: "0 0 8px" }, "data-outline-coverage": "1" },
      (0, import_react9.createElement)(
        "summary",
        { style: { ...S.smallLink, cursor: "pointer" } },
        OUTLINE_COVERAGE_FOLD_SUMMARY
      ),
      (0, import_react9.createElement)(
        "div",
        {
          style: {
            marginTop: "6px",
            padding: "8px 10px",
            background: "var(--dsw-alias-bg-layer-1)",
            borderRadius: "8px",
            border: "1px solid var(--dsw-alias-border-l2)",
            fontSize: "12px"
          }
        },
        (0, import_react9.createElement)(
          "div",
          { style: { fontWeight: 600, margin: "0 0 4px" } },
          `\u{1F9ED} \u672C\u4E66\u5FC5\u987B\u8986\u76D6\u7684\u77E5\u8BC6\u70B9\uFF08${coverage.claims.length} \u4E2A\uFF09\u2014\u2014\u6BCF\u6761\u90FD\u8981\u6709\u7AE0\u8282\u8BA4\u9886\uFF1A`
        ),
        exclusionSplit.live.length === 0 ? null : (0, import_react9.createElement)(
          "div",
          { style: { margin: "0 0 4px", opacity: 0.8 }, "data-kg-exclusions-note": "1" },
          `\xB7 \u4EBA\u5DF2\u5212\u6389 ${exclusionSplit.live.length} \u6761\uFF0C\u5B83\u4EEC\u4E0D\u5728\u8FD9 ${coverage.claims.length} \u6761\u91CC\uFF1A${exclusionSplit.live.map((item) => item.title).join("\u3001")}`
        ),
        // 内滚只封**清单那一块**（抬头与折叠口不进滚动盒）：清单再长也不把
        // 下面的「选范例章」与两颗拍板键推走。
        (0, import_react9.createElement)(
          "div",
          {
            style: {
              maxHeight: `${OUTLINE_COVERAGE_VIEW_MAX_HEIGHT}px`,
              overflowY: "auto",
              overflowX: "hidden"
            },
            "data-outline-coverage-body": "1"
          },
          ...coverage.claims.map(
            ({ title, chapters: claimedBy }) => (0, import_react9.createElement)(
              "div",
              {
                key: title,
                style: {
                  margin: "2px 0",
                  color: claimedBy.length > 0 ? void 0 : "var(--dsw-alias-state-error-primary)"
                }
              },
              claimedBy.length > 0 ? `\u2713 ${title} \u2014\u2014 \u5DF2\u8BA4\u9886\uFF1A${claimedBy.map((n) => `\u7B2C${n}\u7AE0`).join("\u3001")}` : `\u2717 ${title} \u2014\u2014 \u8FD8\u6CA1\u6709\u7AE0\u8282\u8BA4\u9886`
            )
          ),
          coverage.foreign.length > 0 ? (0, import_react9.createElement)(
            "div",
            {
              key: "foreign",
              style: {
                margin: "4px 0 0",
                color: "var(--dsw-alias-state-error-primary)"
              }
            },
            `\u26A0\uFE0F \u9AA8\u67B6\u91CC\u6709\u77E5\u8BC6\u5730\u56FE\u6CA1\u6709\u7684\u6761\u76EE\uFF08\u4EA4\u5DE5\u4F1A\u88AB\u673A\u5668\u62D2\uFF09\uFF1A${coverage.foreign.map((f) => `\u7B2C${f.chapter}\u7AE0\u300C${f.title}\u300D`).join("\u3001")}`
          ) : null
        )
      )
    ),
    (0, import_react9.createElement)(
      "div",
      {
        style: {
          margin: "4px 0 10px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flexWrap: "wrap"
        }
      },
      (0, import_react9.createElement)(
        "span",
        { style: { fontSize: "12px" } },
        // 票 10（判定一 #3）：「样例章」与同一张卡下面按钮上的「最佳范例章」是同一件事两种叫法，
        // 统一取界面词表定的「最佳范例章」（CONTEXT.md「范例章」词条：对外统一为最佳范例章）。
        `\u{1F4D0} AI \u5EFA\u8BAE\u7528\u7B2C ${safePick} \u7AE0\u5F53\u6700\u4F73\u8303\u4F8B\u7AE0\uFF1A${goldReason !== "" ? goldReason : "\uFF08\u672A\u7ED9\u7406\u7531\uFF09"}`
      ),
      chapters.length > 1 ? (0, import_react9.createElement)(
        "select",
        {
          style: S.disabled({
            fontSize: "12px",
            padding: "2px 4px",
            borderRadius: "6px",
            border: "1px solid var(--dsw-alias-border-l2)",
            background: "var(--dsw-alias-bg-layer-1)"
          }, busy),
          value: safePick,
          onChange: (e) => setGoldPick(Number(e.target.value)),
          disabled: busy
        },
        chapters.map(
          (chapter, index) => (0, import_react9.createElement)(
            "option",
            { key: index, value: index + 1 },
            `${index + 1}. ${chapter.title ?? ""}`
          )
        )
      ) : null,
      chapters.length > 1 ? (0, import_react9.createElement)(
        "span",
        { style: { fontSize: "12px", opacity: 0.6 } },
        "\uFF08\u53EF\u6539\u9009\uFF09"
      ) : null
    ),
    rejecting ? (0, import_react9.createElement)(
      "div",
      {
        style: {
          marginTop: "10px",
          borderTop: "1px dashed var(--dsw-alias-border-l2)",
          paddingTop: "8px"
        }
      },
      (0, import_react9.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontWeight: 600 } },
        "\u6539\u54EA\u91CC\uFF1F\u5199\u4E00\u53E5\uFF08\u6BD4\u5982\uFF1A\u7B2C3\u7AE0\u62C6\u6210\u4E24\u7AE0 / \u6BCF\u7AE0\u5B57\u6570\u592A\u591A\uFF09"
      ),
      (0, import_react9.createElement)("textarea", {
        style: S.textarea,
        // 票 `demo-channel-full/24`：这一行在演示书上换如实的那一句（唯一出口在
        // `view-rules.outlineRejectPlaceholder`，复用现成的 `isDemoBook`）。
        placeholder: outlineRejectPlaceholder(meta),
        value: note,
        onChange: (e) => setNote(e.target.value)
      }),
      (0, import_react9.createElement)(
        "div",
        { style: { marginTop: "8px", display: "flex", gap: "8px" } },
        (0, import_react9.createElement)(
          "button",
          {
            style: S.disabled(S.bigBtn(false), busy),
            onClick: () => onConfirm(false, note.trim()),
            disabled: busy
          },
          // 票 `demo-channel-full/24`：这颗键的面文**有意没换**——键本身就是那个动作的
          // 名字，改它＝改产品面（改键名／改键的行为／容忍这句话三选一）；票面明令
          // 「停下来说清楚，别硬改」，读数与三个候选处置见本票 `## Comments`。
          "\u{1F501} \u5C31\u8FD9\u6837\u91CD\u65B0\u5B89\u6392"
        ),
        (0, import_react9.createElement)(
          "button",
          {
            // 🎯 票 `gold-display-period/05`：这颗**有意不禁用**（#2 的逐处复核）——
            // `onClick` 只收起这张表单（两个 setState，不发任何东西）⇒ `busy` 里挡住它
            // 只会造出「看着能点却点不动」的键（先例见 `event-cards.js` 的
            // 「❌ 不满意，让 AI 改」上方）。
            style: { ...S.smallLink, textDecoration: "none" },
            onClick: () => {
              setRejecting(false);
              setNote("");
            }
          },
          "\u53D6\u6D88"
        )
      )
    ) : (0, import_react9.createElement)(
      "div",
      { style: { display: "flex", gap: "8px", flexWrap: "wrap" } },
      (0, import_react9.createElement)(
        "button",
        {
          style: S.disabled(S.bigBtn(true), busy),
          onClick: () => onConfirm(true, note, safePick),
          disabled: busy,
          // 票 `auto-walkthrough/04`：关键键的语义钩子（章节安排确认，六闸门之一）。
          "data-outline-confirm": "1"
        },
        OUTLINE_CONFIRM_ACCEPT_LABEL
      ),
      (0, import_react9.createElement)(
        "button",
        {
          style: S.disabled({
            ...S.bigBtn(true),
            background: "transparent",
            color: "var(--dsw-alias-state-error-primary)"
          }, busy),
          onClick: () => setRejecting(true),
          disabled: busy
        },
        // 票 10（判定一 #7）：与另一张确认卡的「🔁 让 AI 重做」是同一动作，统一成这一句
        // （引擎播报里告诉用户点哪个按钮的话也同步改了）。
        EXPLORE_CONFIRM_REWRITE_LABEL
      )
    )
  );
}

// src/ui/goal-cards.js
var import_react10 = require("react");
var GOAL_CONFIRM_ACCEPT_LABEL = "\u2705 \u5C31\u6309\u8FD9\u51E0\u6761\u529E";
var GOAL_CONFIRM_REWRITE_LABEL = "\u{1F501} \u8BA9 AI \u91CD\u5199\u8FD9\u51E0\u6761";
var GOAL_CONFIRM_QUESTION = "\u8FD9\u51E0\u6761\u5B66\u4E60\u76EE\u6807\u53EF\u4EE5\u5B9A\u4E0B\u6765\u4E86\u5417\uFF1F";
function goalConfirmFacts(count) {
  return `${count} \u6761\uFF0C\u9010\u6761\u53EF\u6539\u53EF\u5220\u53EF\u52A0\uFF0C\u5B9A\u4E0B\u540E AI \u63A5\u7740\u8D77\u8349\u4E0B\u4E00\u7248\u65B9\u6848\u3002`;
}
var GOAL_CARD_NOTE = "\u8FD9\u4E00\u8D9F\u662F\u4E0A\u4E00\u7AD9\u62CD\u677F\u4E4B\u540E\u53E6\u8DD1\u7684\uFF1A\u5B83\u8BFB\u8FC7\u90A3\u4EFD\u6750\u6599\u62A5\u544A\u3001\u4E5F\u8BA4\u4E86\u4F60\u5728\u56FE\u4E0A\u5212\u6389\u7684\u90A3\u51E0\u6761\u3002";
var GOAL_EMPTY_NOTE = "\u8FD9\u6B21\u6CA1\u4ECE\u62A5\u544A\u91CC\u8BFB\u51FA\u5B66\u4E60\u76EE\u6807\u2014\u2014\u8981\u4E48\u70B9\u4E0B\u9762\u300C\u{1F501} \u8BA9 AI \u91CD\u5199\u8FD9\u51E0\u6761\u300D\uFF0C\u8981\u4E48\u81EA\u5DF1\u52A0\u4E00\u6761\u3002";
var GOAL_CONFIRM_PASS_EFFECT = "\u70B9\u4E86\u5B83\u8FD9\u51E0\u6761\u5C31\u6B64\u5B9A\u4E0B\uFF1A\u4E66\u5F80\u524D\u8D70\u4E00\u6B65\uFF0CAI \u63A5\u7740\u8D77\u8349\u300C\u5B66\u4E60\u76EE\u6807\u4E0E\u96BE\u70B9\u300D\u90A3\u4E00\u7248\u65B9\u6848\uFF0C\u5199\u597D\u8FD8\u8981\u4F60\u62CD\u677F\u3002";
function goalConfirmPassEffect() {
  return GOAL_CONFIRM_PASS_EFFECT;
}
var GOAL_REWRITE_EFFECT = "\u54EA\u91CC\u4E0D\u884C\uFF1F\uFF08\u53EF\u7559\u7A7A\uFF0CAI \u4F1A\u7167\u8FD9\u53E5\u91CD\u62DF\uFF09";
var goalConfirmCardView = defineCardView({
  card: "GoalsConfirmCard",
  // 壳那一侧不撞名的标识符 → 卡片真正的 prop 名由 `derive` 整形（与 `exploreConfirmCardView`
  // 同一条纪律：两个「确认」回调不许在壳里合成一个）。
  fromBook: ["meta", "readArtifact", "confirmGoals", "busy"],
  required: ["readArtifact", "confirmGoals"],
  // ⚠️ `derive` 只拿得到一个参数（此刻的袋子）：整形出来的 `onDecide` 就是卡片消费的那一个。
  derive: (bag) => ({ onDecide: bag.confirmGoals })
});
function GoalsConfirmCard(props) {
  const { meta, readArtifact, onDecide, busy } = props;
  const version = Number.isFinite(Number(meta?.goalDocVersion)) && Number(meta.goalDocVersion) > 0 ? Number(meta.goalDocVersion) : 1;
  const [docText, setDocText] = (0, import_react10.useState)(null);
  const [items, setItems] = (0, import_react10.useState)([]);
  const [rewriting, setRewriting] = (0, import_react10.useState)(false);
  const [note, setNote] = (0, import_react10.useState)("");
  (0, import_react10.useEffect)(() => {
    let alive = true;
    setDocText(null);
    readArtifact(goalDocRel(version)).then((text) => {
      if (!alive) return;
      setDocText(text);
      setItems(readGoalDoc(text));
    }).catch(() => {
      if (alive) setDocText("");
    });
    return () => {
      alive = false;
    };
  }, [version, readArtifact]);
  const setAt = (index, value) => setItems((prev) => prev.map((item, i) => i === index ? value : item));
  const removeAt = (index) => setItems((prev) => prev.filter((_, i) => i !== index));
  const addOne = () => setItems((prev) => [...prev, ""]);
  const cleaned = items.map((item) => String(item ?? "").trim()).filter((item) => item !== "");
  const rows = items.map(
    (item, index) => (0, import_react10.createElement)(
      "div",
      { key: `goal-${index}`, style: { display: "flex", gap: "6px", alignItems: "center", margin: "4px 0" } },
      (0, import_react10.createElement)("span", { style: { opacity: 0.6, minWidth: "18px" } }, `${index + 1}.`),
      (0, import_react10.createElement)("input", {
        type: "text",
        value: item,
        disabled: busy,
        "data-goal-item": String(index + 1),
        // 置灰跟着**它自己那个** disabled 表达式走（逐字同一个 `busy`）：
        // 与同族（`gold-table.js` 的 `S.disabled({ ...S.input, … }, busy || writing)`）同一口径。
        style: S.disabled({ flex: "1 1 auto", minWidth: "120px", padding: "4px 6px" }, busy),
        onChange: (event) => setAt(index, event.target.value)
      }),
      (0, import_react10.createElement)(
        "button",
        {
          type: "button",
          style: S.disabled({ ...S.smallLink, textDecoration: "none" }, busy),
          disabled: busy,
          "data-goal-remove": String(index + 1),
          onClick: () => removeAt(index)
        },
        "\u{1F5D1} \u5220\u6389\u8FD9\u6761"
      )
    )
  );
  const headFacts = docText === null || docText === "" ? void 0 : goalConfirmFacts(cleaned.length);
  return (0, import_react10.createElement)(
    "div",
    { style: S.focus, "data-goal-card": "1", "data-goal-version": String(version) },
    // ── 卡头：问句（存量句）＋事实句（条数现算、后果并进后半句）────────────────────────
    (0, import_react10.createElement)(CardHead, {
      question: (0, import_react10.createElement)(
        "strong",
        { style: CARD_HEAD_QUESTION_STYLE },
        GOAL_CONFIRM_QUESTION
      ),
      facts: headFacts
    }),
    // ── 说明句（存量句 − 机器路径半句）────────────────────────────────────────────────
    (0, import_react10.createElement)(
      "p",
      { style: { margin: "6px 0", fontSize: "12px", opacity: 0.8 } },
      GOAL_CARD_NOTE
    ),
    // ── 首屏必须看见的那一块：那几条（逐条可改／删／加）────────────────────────────────
    docText === null ? (0, import_react10.createElement)("p", { style: { margin: "6px 0", opacity: 0.8 } }, "\u6B63\u5728\u8BFB\u90A3\u51E0\u6761\u76EE\u6807\u2026\u2026") : (0, import_react10.createElement)(
      "div",
      { style: { ...S.card, marginBottom: "10px" }, "data-goal-items": "1" },
      (0, import_react10.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontWeight: 600 } },
        `\u5B66\u5B8C\u8981\u80FD\u505A\u5230\u4EC0\u4E48\uFF08${cleaned.length} \u6761\uFF09\u2014\u2014\u9010\u6761\u53EF\u6539\u3001\u53EF\u5220\uFF0C\u4E5F\u53EF\u4EE5\u81EA\u5DF1\u52A0\u4E00\u6761\uFF1A`
      ),
      rows.length === 0 ? (0, import_react10.createElement)(
        "p",
        { style: { margin: "4px 0", color: "var(--dsw-alias-state-error-primary)" } },
        GOAL_EMPTY_NOTE
      ) : rows,
      (0, import_react10.createElement)(
        "button",
        {
          type: "button",
          style: S.disabled({ ...S.smallLink, textDecoration: "none" }, busy),
          disabled: busy,
          "data-goal-add": "1",
          onClick: addOne
        },
        "\u2795 \u52A0\u4E00\u6761"
      )
    ),
    // ── 两颗键（整批一次过；卡底）────────────────────────────────────────────────────
    // ⚠️ 票 `ui-display-redesign/04`：原先这两颗键紧上方那段通过后果句**已删**（后果并进卡头事实句）。
    // 契约里的 `GOAL_CONFIRM_PASS_EFFECT` 文本保留、只是不再由本卡渲染——⛔ 别搬回来。
    (0, import_react10.createElement)(
      "div",
      { style: { display: "flex", gap: "8px", flexWrap: "wrap" } },
      (0, import_react10.createElement)(
        "button",
        {
          style: S.disabled(S.bigBtn(true), busy || cleaned.length === 0),
          disabled: busy || cleaned.length === 0,
          "data-goal-accept": "1",
          onClick: () => onDecide(true, cleaned, "")
        },
        GOAL_CONFIRM_ACCEPT_LABEL
      ),
      (0, import_react10.createElement)(
        "button",
        {
          style: S.disabled({
            ...S.bigBtn(true),
            background: "transparent",
            color: "var(--dsw-alias-state-error-primary)"
          }, busy),
          disabled: busy,
          "data-goal-rewrite": "1",
          onClick: () => setRewriting(true)
        },
        GOAL_CONFIRM_REWRITE_LABEL
      )
    ),
    // 驳回那一支：**整份**重拟（⛔ 不逐条否）——所以这里只有一句话 ＋ 可选的一句意见。
    rewriting ? (0, import_react10.createElement)(
      "div",
      {
        style: {
          marginTop: "10px",
          borderTop: "1px dashed var(--dsw-alias-border-l2)",
          paddingTop: "8px"
        },
        "data-goal-rewrite-note": "1"
      },
      (0, import_react10.createElement)("p", { style: { margin: "0 0 6px", fontWeight: 600 } }, GOAL_REWRITE_EFFECT),
      (0, import_react10.createElement)("input", {
        type: "text",
        value: note,
        disabled: busy,
        // 同一口径：这一处的置灰是它自己那个 `busy` 的函数。
        style: S.disabled({ width: "100%", padding: "4px 6px" }, busy),
        onChange: (event) => setNote(event.target.value)
      }),
      (0, import_react10.createElement)(
        "div",
        { style: { display: "flex", gap: "8px", marginTop: "6px" } },
        (0, import_react10.createElement)(
          "button",
          {
            style: S.disabled(S.bigBtn(true), busy),
            disabled: busy,
            "data-goal-rewrite-send": "1",
            onClick: () => onDecide(false, cleaned, note.trim())
          },
          "\u5C31\u8FD9\u4E48\u91CD\u5199"
        ),
        (0, import_react10.createElement)(
          "button",
          { style: S.disabled({ ...S.smallLink, textDecoration: "none" }, busy), disabled: busy, onClick: () => setRewriting(false) },
          "\u53D6\u6D88"
        )
      )
    ) : null
  );
}

// src/ui/gold-table.js
var import_react11 = require("react");

// src/audit-semantics.js
var AUDIT_LEVELS = Object.freeze(["\u9519\u8BEF", "\u8B66\u544A", "\u63D0\u793A"]);
var AUDIT_STATUSES = Object.freeze(["open", "fixed", "accepted-risk"]);
var AUDIT_WARNINGS_OPEN_MAX = 0;
var AUDIT_READING_KEYS = Object.freeze(["errors_open", "warnings_open", "fixed", "accepted"]);
function auditIssuesOf(audit) {
  return Array.isArray(audit?.issues) ? audit.issues : [];
}
function auditIssueProblems(audit) {
  const problems = [];
  if (typeof audit?.passed !== "boolean") {
    problems.push("\u7F3A passed \u5E03\u5C14\uFF08\u8FD9\u4E2A\u5B57\u6BB5\u8981\u4FDD\u7559\u4F9B\u4EBA\u8BFB\uFF1B\u673A\u5668\u4E0D\u91C7\u4FE1\u5B83\uFF0C\u4F46\u5951\u7EA6\u8981\u6C42\u5B83\u5728\uFF09");
  }
  const raw = audit?.issues;
  if (raw !== void 0 && raw !== null && !Array.isArray(raw)) {
    problems.push("issues \u4E0D\u662F\u6570\u7EC4\uFF08\u5951\u7EA6\u8981\u6C42 issues: [] \u6216\u6BCF\u6761 issue \u7684\u6570\u7EC4\uFF09");
    return problems;
  }
  const issues = Array.isArray(raw) ? raw : [];
  issues.forEach((issue, index) => {
    const at = `\u7B2C ${index + 1} \u6761 issue`;
    if (issue === null || typeof issue !== "object" || Array.isArray(issue)) {
      problems.push(`${at}\u4E0D\u662F\u5BF9\u8C61`);
      return;
    }
    if (typeof issue.text !== "string" || issue.text.trim() === "") {
      problems.push(`${at}\u7F3A text\uFF08\u8981\u5199\u6E05\u54EA\u4EFD\u6587\u4EF6\u54EA\u4E00\u8282\u3001\u4EC0\u4E48\u95EE\u9898\u3001\u4E3A\u4EC0\u4E48\u3001\u5EFA\u8BAE\u600E\u4E48\u6539\uFF09`);
    }
    if (!AUDIT_LEVELS.includes(issue.level)) {
      problems.push(`${at}\u7684 level \u662F ${JSON.stringify(issue.level)}\uFF08\u53EA\u80FD\u662F ${AUDIT_LEVELS.join("\uFF0F")}\uFF09`);
    }
    if (!AUDIT_STATUSES.includes(issue.status)) {
      problems.push(`${at}\u7F3A status\uFF08\u6BCF\u6761\u5FC5\u987B\u5199 status=${AUDIT_STATUSES.join("|")}\uFF09`);
    }
    if (issue.status === "accepted-risk") {
      if (typeof issue.reason !== "string" || issue.reason.trim() === "") {
        problems.push(`${at}\u662F accepted-risk\uFF0C\u5FC5\u987B\u5199 reason\uFF08\u4E3A\u4EC0\u4E48\u53EF\u4EE5\u63A5\u53D7\u8FD9\u4E2A\u98CE\u9669\uFF09`);
      }
      if (typeof issue.confirmedBy !== "string" || issue.confirmedBy.trim() === "") {
        problems.push(`${at}\u662F accepted-risk\uFF0C\u5FC5\u987B\u5199 confirmedBy\uFF08\u8C01\u786E\u8BA4\u63A5\u53D7\u8FD9\u4E2A\u98CE\u9669\uFF09`);
      }
    }
  });
  return problems;
}
function auditReadings(audit) {
  const issues = auditIssuesOf(audit);
  const count = (level, status) => issues.filter((issue) => issue?.level === level && issue?.status === status).length;
  return {
    errors_open: count("\u9519\u8BEF", "open"),
    warnings_open: count("\u8B66\u544A", "open"),
    fixed: issues.filter((issue) => issue?.status === "fixed").length,
    accepted: issues.filter((issue) => issue?.status === "accepted-risk").length
  };
}
function auditVerdict(audit) {
  const problems = auditIssueProblems(audit);
  const readings = auditReadings(audit);
  const declaredPassed = audit?.passed === true ? true : audit?.passed === false ? false : null;
  const computedPassed = problems.length === 0 && readings.errors_open === 0 && readings.warnings_open <= AUDIT_WARNINGS_OPEN_MAX;
  return { problems, readings, declaredPassed, computedPassed, passed: computedPassed };
}

// src/ui/gold-table.js
var OPINION_STATUS_TEXT = {
  pending: "\u5F85\u5904\u7406",
  sent: "AI \u4FEE\u8BA2\u4E2D",
  applied: "AI \u5DF2\u6539",
  // 票 09：`revoked` 一个状态在界面上**只此一种说法**（`CONTEXT.md`「撤回（意见）」的正名）。
  // 取词走 `rules.js` 那一个出口，不在本文件另写一份（此前意见单与章节卡各写了一份同义说法）。
  revoked: REVIEW_REVOKED_TEXT
};
var DELIVERED_AWAITING_SEAL_TEXT = "\u5DF2\u4EA4\u4ED8\xB7\u5F85\u5B9A\u7A3F";
function opinionStatusText(status, { draftLanded = false } = {}) {
  if (status === "sent" && draftLanded === true) return DELIVERED_AWAITING_SEAL_TEXT;
  return fallbackWord(OPINION_STATUS_TEXT, status);
}
var DISPLAY_PERIOD_PENDING_HINT = "\u8BB0\u4E0B\u4E86\uFF1B\u8FD9\u4E00\u8F6E\u68C0\u67E5\u4E0D\u4F1A\u8BFB\u8FD9\u4E9B\u610F\u89C1\uFF0C\u7B49\u68C0\u67E5\u6536\u5DE5\u5C31\u80FD\u70B9\u8FD9\u9897\u952E\u8BA9 AI \u7167\u5B83\u4EEC\u6539";
var APPLIED_HINT_TEXT = "\u8FD9\u4E9B\u610F\u89C1\u8FD9\u4E00\u7A3F\u90FD\u5904\u7F6E\u8FC7\u4E86\uFF08AI \u4EA4\u56DE\u4E86\u65B0\u7A3F\uFF1B\u6539\u6CA1\u6539\u5230\u673A\u5668\u4E0D\u6838\uFF09";
function opinionActionHint(list, { draftLanded = false, displayPeriod = null } = {}) {
  const pending = list.filter((o) => o.status === "pending").length;
  const sent = list.filter((o) => o.status === "sent").length;
  const applied = list.filter((o) => o.status === "applied").length;
  const revoked = list.filter((o) => o.status === "revoked").length;
  if (pending > 0) return displayPeriod !== null ? DISPLAY_PERIOD_PENDING_HINT : null;
  if (sent > 0)
    return draftLanded === true ? "\u8FD9\u4E00\u7A3F\u5DF2\u7ECF\u6539\u56DE\u6765\u4E86\uFF0C\u8FD8\u6CA1\u5B9A\u7A3F" : "\u8FD9\u4E00\u8F6E\u5DF2\u7ECF\u4EA4\u7ED9 AI \u4E86\uFF0C\u7B49\u5B83\u6539\u5B8C";
  if (applied > 0) return APPLIED_HINT_TEXT;
  if (revoked > 0) return "\u8FD9\u4E9B\u610F\u89C1\u90FD\u64A4\u56DE\u4E86\uFF1B\u8981\u63D0\u65B0\u7684\uFF0C\u8BFB\u5230\u54EA\u6807\u5230\u54EA";
  return "\u5148\u6807\u8BB0\u81F3\u5C11\u4E00\u6761\u610F\u89C1\uFF08\u6BB5\u65C1\u4E09\u952E\u6216\u7B3C\u7EDF\u4FBF\u7B7E\uFF09";
}
function GoldOpinionList(props) {
  const { opinions, busy, onRevoke, onRevise, draftLanded = false, displayPeriod = null } = props;
  const list = opinions ?? [];
  if (list.length === 0) {
    return (0, import_react11.createElement)(
      "div",
      { style: { ...S.card, opacity: 0.85 } },
      (0, import_react11.createElement)(
        "p",
        { style: { margin: "0" } },
        // 票 gold-revision-flow/01：空态也不许用「本稿」限定——这份清单是历次累积的。
        "\u{1F4CB} \u610F\u89C1\u5355\u8FD8\u7A7A\u7740\uFF1A\u8BFB\u4E0B\u9762\u7684\u7A3F\u5B50\u968F\u624B\u6807\u8BB0\uFF0C\u6216\u7528\u6700\u5E95\u4E0B\u7684\u300C\u7B3C\u7EDF\u63D0\u4E00\u6761\u300D\u3002"
      )
    );
  }
  let seq = 0;
  const rows = list.map((o) => {
    const kindText = fallbackWord(REVIEW_KIND_TEXT, o.kind);
    if (o.status === "revoked") {
      return (0, import_react11.createElement)(
        "div",
        {
          key: o.id,
          style: {
            ...S.card,
            opacity: 0.45,
            textDecoration: "line-through",
            marginBottom: "6px"
          }
        },
        `${REVIEW_REVOKED_TEXT}${kindText === null ? "" : `\uFF1A${kindText}`}${o.wish ? ` ${o.wish}` : ""}`
      );
    }
    seq += 1;
    const target = o.target == null ? "\u7B3C\u7EDF\uFF08\u4E0D\u6307\u54EA\u6BB5\uFF09" : `\u7B2C${o.target.para}\u6BB5${o.target.hint ? `\u300C${o.target.hint}\u300D` : ""}`;
    if (o.status === "applied") {
      return (0, import_react11.createElement)(
        "details",
        { key: o.id, style: { ...S.card, marginBottom: "6px" } },
        (0, import_react11.createElement)(
          "summary",
          { style: { cursor: "pointer", fontSize: "12px", opacity: 0.75 } },
          `#${seq}${kindText === null ? "" : ` ${kindText}`}${o.wish ? `\uFF0C${o.wish}` : ""} \u2014\u2014 AI \u5DF2\u6539`
        ),
        (0, import_react11.createElement)(
          "div",
          {
            style: {
              marginTop: "6px",
              display: "flex",
              gap: "8px",
              alignItems: "baseline",
              flexWrap: "wrap"
            }
          },
          (0, import_react11.createElement)(
            "span",
            { style: { opacity: 0.75, fontSize: "12px" } },
            target
          ),
          (0, import_react11.createElement)(
            "button",
            { style: S.disabled(S.smallLink, busy), onClick: () => onRevoke(o.id), disabled: busy },
            "\u64A4\u56DE\u8FD9\u6761\u610F\u89C1"
          ),
          (0, import_react11.createElement)(
            "span",
            { style: { fontSize: "12px", opacity: 0.7 } },
            "\u64A4\u56DE\u53EA\u4F5C\u5E9F\u8FD9\u6761\u610F\u89C1\uFF08\u5B9A\u7A3F\u65F6\u4E0D\u751F\u6548\uFF09\uFF0C\u4E0D\u56DE\u6EDA\u5DF2\u7ECF\u6539\u597D\u7684\u6B63\u6587"
          )
        )
      );
    }
    return (0, import_react11.createElement)(
      "div",
      { key: o.id, style: { ...S.card, marginBottom: "6px" } },
      (0, import_react11.createElement)(
        "div",
        {
          style: {
            display: "flex",
            gap: "8px",
            alignItems: "baseline",
            flexWrap: "wrap"
          }
        },
        (0, import_react11.createElement)("strong", null, `#${seq}`),
        (0, import_react11.createElement)("span", null, kindText),
        (0, import_react11.createElement)(
          "span",
          { style: { opacity: 0.75, fontSize: "12px" } },
          target
        ),
        o.wish ? (0, import_react11.createElement)("span", null, o.wish) : null,
        (0, import_react11.createElement)(
          "span",
          {
            style: {
              marginLeft: "auto",
              fontSize: "12px",
              whiteSpace: "nowrap"
            }
          },
          opinionStatusText(o.status, { draftLanded }),
          " ",
          (0, import_react11.createElement)(
            "button",
            {
              style: S.disabled(S.smallLink, busy),
              onClick: () => onRevoke(o.id),
              disabled: busy
            },
            "\u64A4\u9500"
          )
        )
      )
    );
  });
  const pendingCount = list.filter((o) => o.status === "pending").length;
  const hint = opinionActionHint(list, { draftLanded, displayPeriod });
  const activeCount = list.filter((o) => o.status !== "revoked").length;
  return (0, import_react11.createElement)(
    "div",
    null,
    (0, import_react11.createElement)(
      "p",
      { style: { margin: "0 0 6px", fontWeight: 600 } },
      // 票 gold-revision-flow/01：标题改成如实说法——`meta.goldOpinions` 是**全书累积**、
      // 不分稿的（`gold-revise` 只追加、不记稿号），写「本稿」是名不副实，
      // 也正是"最新版还带着上一轮意见单"的直接来源。
      `\u{1F4CB} \u5386\u6B21\u610F\u89C1\uFF08${activeCount} \u6761${pendingCount > 0 ? `\uFF0C${pendingCount} \u6761\u5F85\u5904\u7406` : ""}\uFF09`
    ),
    ...rows,
    onRevise !== void 0 ? (0, import_react11.createElement)(
      "div",
      { style: { margin: "8px 0" } },
      (0, import_react11.createElement)(
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
          disabled: busy || pendingCount === 0 || displayPeriod !== null
        },
        pendingCount > 0 ? `\u{1F501} \u8BA9 AI \u7167\u8FD9\u4E9B\u6539\uFF08${pendingCount} \u6761\uFF09` : "\u{1F501} \u8BA9 AI \u7167\u8FD9\u4E9B\u6539"
      ),
      // 票 gold-revision-flow/01：提示按**真实状态**分四种说法（意见ActionHint），
      // 只有真的空手（连一条都没有）才说「先标记至少一条意见」。
      hint !== null ? (0, import_react11.createElement)(
        "span",
        {
          style: { marginLeft: "8px", fontSize: "12px", opacity: 0.7 }
        },
        hint
      ) : null,
      (0, import_react11.createElement)(
        "p",
        { style: S.hint },
        // 票 14（承诺账 A2）：机器**没有段落级校验**（只把标过的意见交给 AI，
        // 见 engine.js 的 gold 分支）——「只改你标过的地方，其余原样保留」是结果承诺，
        // 查无机制；收成机制真做的那件事。
        "\u53EA\u628A\u4F60\u6807\u8FC7\u7684\u610F\u89C1\u4EA4\u7ED9 AI"
      )
    ) : null
  );
}
function GoldReader(props) {
  const {
    text,
    opinions,
    busy,
    onOpinion,
    readOnly,
    onRevokeOpinion = () => {
    },
    // 票 `demo-channel-full/25`：确认层那句话的取值只看「这是不是演示书」（`view-rules.paraMarkConfirmNote`
    // 里复用现成的 `isDemoBook`）。缺省 `undefined` ⇒ 按**真书**那一句渲染（本文件与
    // `smoke-test.mjs` 里那些只喂正文的渲染点照旧说真书的话，一个字未变）。
    meta
  } = props;
  const [hover, setHover] = (0, import_react11.useState)(null);
  const [formPara, setFormPara] = (0, import_react11.useState)(null);
  const [wishText, setWishText] = (0, import_react11.useState)("");
  const [wishError, setWishError] = (0, import_react11.useState)(null);
  const [generalKind, setGeneralKind] = (0, import_react11.useState)("change");
  const [generalText, setGeneralText] = (0, import_react11.useState)("");
  const [generalError, setGeneralError] = (0, import_react11.useState)(null);
  const [markConfirm, setMarkConfirm] = (0, import_react11.useState)(null);
  const [markWish, setMarkWish] = (0, import_react11.useState)("");
  const paras = splitParagraphs(text);
  const marked = /* @__PURE__ */ new Map();
  let seq = 0;
  for (const o of opinions ?? []) {
    if (o.status === "revoked") continue;
    seq += 1;
    if (o.target != null && Number.isSafeInteger(o.target.para)) {
      const arr = marked.get(o.target.para) ?? [];
      arr.push(
        `#${seq} ${o.kind === "dislike" ? "\u{1F615}" : o.kind === "drop" ? "\u{1F5D1}" : "\u270F\uFE0F"}`
      );
      marked.set(o.target.para, arr);
    }
  }
  const submitWish = () => {
    const wish = wishText.trim();
    if (wish === "") {
      setWishError("\u5199\u4E00\u53E5\u4F60\u60F3\u8BA9\u5B83\u53D8\u6210\u4EC0\u4E48\u6837");
      return;
    }
    onOpinion(
      "change",
      wish,
      formPara,
      paragraphHint(paras[formPara - 1] ?? "")
    );
    setFormPara(null);
    setWishText("");
    setWishError(null);
  };
  const submitGeneral = () => {
    const wish = generalText.trim();
    if (generalKind === "change" && wish === "") {
      setGeneralError("\u300C\u8981\u6539\u6210\u300D\u8BF7\u5199\u4E00\u53E5\u8BDD");
      return;
    }
    onOpinion(generalKind, wish, null, "");
    setGeneralText("");
    setGeneralError(null);
  };
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
    onOpinion(target.kind, markWish.trim(), target.para, target.hint);
    closeMarkConfirm();
  };
  const markConfirmKind = markConfirm === null ? null : fallbackWord(REVIEW_KIND_TEXT, markConfirm.kind);
  return (0, import_react11.createElement)(
    "div",
    { style: { paddingLeft: "34px", paddingRight: "68px" } },
    // 票 08：确认层摆在正文**顶部**（不是贴着被点的那一段）——用户读的是一整章，
    // 刚点的那段可能在第 188 段，贴着它弹等于弹到屏幕外。
    markConfirm !== null ? (0, import_react11.createElement)(
      "div",
      {
        style: {
          ...S.card,
          borderColor: "var(--dsw-alias-state-business-primary)",
          margin: "0 0 10px"
        }
      },
      (0, import_react11.createElement)(
        "p",
        { style: { margin: "0 0 4px", fontWeight: 600 } },
        `\u786E\u8BA4\uFF1A\u628A\u7B2C ${markConfirm.para} \u6BB5${markConfirmKind === null ? "\u8BB0\u4E00\u6761\u610F\u89C1" : `\u8BB0\u6210\u300C${markConfirmKind}\u300D`}\uFF1F`
      ),
      (0, import_react11.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontSize: "12px", opacity: 0.85 } },
        // 真书那一句（＝出口里的 `PARA_MARK_CONFIRM_NOTE`）是**兑现的**、不是承诺
        // （`CONTEXT.md`「承诺过度」那条账）：AI 真的会照这条改这一章（这段意见随交办
        // 任务送给主笔 AI），这一章交工前也真的必须先处置它（交工校验会直接拒收没处置的
        // pending 意见）。
        // ⚠️ 票 `demo-channel-full/25`：**这两句对演示书都不成立**（演示通道零 LLM ＋
        // 过目态提不出段落意见，读数见那个出口的注释）⇒ 取值改由
        // `view-rules.paraMarkConfirmNote(meta)` 给，本行不再持有措辞；真书那一句逐字未变。
        paraMarkConfirmNote(meta)
      ),
      (0, import_react11.createElement)("textarea", {
        style: { ...S.input, width: "100%", boxSizing: "border-box" },
        rows: 2,
        // 提示走 placeholder、**不预填进值里**：预填会让「留空也能提交」这条硬约束
        // 变成「用户得先自己把它删掉才成立」，那就把快速标记这条路又堵回去了。
        placeholder: "\u60F3\u8BF4\u4E3A\u4EC0\u4E48\u5C31\u5199\u4E00\u53E5\uFF08\u53EF\u4EE5\u4E0D\u586B\uFF09",
        value: markWish,
        onChange: (e) => setMarkWish(e.target.value)
      }),
      (0, import_react11.createElement)(
        "div",
        {
          style: {
            display: "flex",
            gap: "8px",
            alignItems: "center",
            marginTop: "6px"
          }
        },
        // 两个热区各干一件事：提交＝发动作；再想想＝纯收起（不发任何东西）。
        (0, import_react11.createElement)(
          "button",
          { style: S.disabled(S.bigBtn(true), busy), onClick: submitMark, disabled: busy },
          "\u2705 \u63D0\u4EA4\u8FD9\u6761"
        ),
        (0, import_react11.createElement)(
          "button",
          // 🎯 票 `gold-display-period/05`：这一颗**有意不禁用**（#2 的逐处复核）——
          // `onClick` 只收起这张表单（`closeMarkConfirm()`＝两个 setState），**不发任何东西**，
          // 所以 `busy` 里挡住它只会造出一个「看着能点却点不动」的键（先例见 `event-cards.js`
          // 的「❌ 不满意，让 AI 改」上方）。逐处理由登记在 `D-禁用不给理由.md` 的「票 05 #2」那一节。
          { style: S.smallLink, onClick: closeMarkConfirm },
          "\u518D\u60F3\u60F3"
        )
      )
    ) : null,
    paras.map((para, idx) => {
      const n = idx + 1;
      const marks = marked.get(n) ?? [];
      return (0, import_react11.createElement)(
        "div",
        {
          key: n,
          // 段容器相对定位：装订线、三键浮出都以它为参照，正文不占这些位置。
          style: { position: "relative" },
          onMouseEnter: () => setHover(n),
          onMouseLeave: () => setHover((cur) => cur === n ? null : cur)
        },
        // 左侧装订线：段号 + 已标 #N 标签（不指段时淡出到 0.35，指到时亮起）。
        (0, import_react11.createElement)(
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
              transition: "opacity 250ms ease-out"
            }
          },
          String(n),
          marks.length > 0 ? (0, import_react11.createElement)(
            "span",
            { style: { display: "block" } },
            marks.join(" ")
          ) : null
        ),
        // 正文段落：纯流式 + markdown 最小渲染（标题/加粗/列表行）。
        (0, import_react11.createElement)("p", { style: READER_PARA_STYLE }, ...renderInline(para)),
        formPara === n ? (0, import_react11.createElement)(
          "div",
          { style: { margin: "-4px 0 8px" } },
          (0, import_react11.createElement)("textarea", {
            style: { ...S.input, width: "100%", boxSizing: "border-box" },
            rows: 2,
            placeholder: "\u5199\u4E00\u53E5\u4F60\u60F3\u8BA9\u5B83\u53D8\u6210\u4EC0\u4E48\u6837\uFF08\u4F8B\uFF1A\u5F00\u5934\u522B\u53CD\u95EE\uFF0C\u76F4\u63A5\u8BB2\u9053\u7406\uFF09",
            value: wishText,
            onChange: (e) => {
              setWishText(e.target.value);
              setWishError(null);
            }
          }),
          (0, import_react11.createElement)(
            "div",
            {
              style: { display: "flex", gap: "8px", alignItems: "center" }
            },
            (0, import_react11.createElement)(
              "button",
              {
                style: S.disabled(S.bigBtn(true), busy),
                onClick: submitWish,
                disabled: busy
              },
              "\u2705 \u8BB0\u4E0B\u8FD9\u6761"
            ),
            (0, import_react11.createElement)(
              "button",
              {
                style: S.smallLink,
                onClick: () => {
                  setFormPara(null);
                  setWishError(null);
                }
              },
              "\u6536\u8D77"
            ),
            wishError !== null ? (0, import_react11.createElement)("span", { style: S.error }, wishError) : null
          )
        ) : null,
        // 三键浮出（absolute 定在段右上角、不占正文宽度）：F36 常显淡态 0.3（可感知、不占位），
        // 悬停时全亮；三键常显淡态 0.55（票 05：删掉首段脉冲，键始终可点）。
        !readOnly ? (0, import_react11.createElement)(
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
              pointerEvents: "auto"
            }
          },
          (() => {
            const activeOf = (kind) => (opinions ?? []).find(
              (o) => o.status !== "revoked" && o.target != null && o.target.para === n && o.kind === kind
            );
            const keyWith = (label, kind, title, onClick, toggle = true) => {
              const active = toggle ? activeOf(kind) : null;
              const labelText = active != null ? `${title}\uFF08\u5DF2\u6807\uFF1A\u518D\u70B9\u4E00\u6B21=\u64A4\u9500\uFF09` : title;
              return (0, import_react11.createElement)(
                "button",
                {
                  key: label,
                  "aria-label": labelText,
                  style: S.disabled({
                    ...S.smallLink,
                    fontSize: "13px",
                    padding: "2px 4px",
                    whiteSpace: "nowrap",
                    ...active != null ? {
                      background: "var(--dsw-alias-state-business-tertiary)",
                      borderRadius: "6px"
                    } : {}
                  }, busy),
                  title: labelText,
                  onClick: () => {
                    if (active != null) onRevokeOpinion(active.id);
                    else onClick();
                  },
                  disabled: busy
                },
                label
              );
            };
            return [
              // 票 08：这两个键**不再一击直发**——只打开确认层；确认层里点「提交这条」
              // 才真正调 `onOpinion`（理由可留空，留空发空串＝今天的行为）。
              keyWith(
                "\u{1F615}",
                "dislike",
                "\u8FD9\u79CD\u5199\u6CD5\u4E0D\u559C\u6B22",
                () => openMarkConfirm("dislike", n, para)
              ),
              keyWith(
                "\u{1F5D1}",
                "drop",
                "\u8FD9\u7C7B\u5185\u5BB9\u4E0D\u9700\u8981",
                () => openMarkConfirm("drop", n, para)
              ),
              keyWith(
                "\u270F\uFE0F",
                "change",
                "\u8981\u6539\u6210\uFF08\u5199\u4E00\u53E5\u8BDD\uFF09",
                () => {
                  setFormPara(n);
                  setWishText("");
                },
                false
              )
            ];
          })()
        ) : null
      );
    }),
    !readOnly ? (0, import_react11.createElement)(
      "div",
      {
        style: {
          ...S.card,
          display: "flex",
          gap: "8px",
          alignItems: "center",
          flexWrap: "wrap"
        }
      },
      (0, import_react11.createElement)(
        "span",
        { style: { fontSize: "12px", opacity: 0.75 } },
        "\u7B3C\u7EDF\u63D0\u4E00\u6761\uFF08\u4E0D\u6307\u54EA\u6BB5\u4E5F\u884C\uFF09\uFF1A"
      ),
      ["dislike", "drop", "change"].map(
        (k) => (0, import_react11.createElement)(
          "button",
          {
            key: k,
            style: S.disabled(S.projectBtn(generalKind === k), busy),
            onClick: () => setGeneralKind(k),
            disabled: busy
          },
          REVIEW_KIND_TEXT[k]
        )
      ),
      (0, import_react11.createElement)("input", {
        style: { ...S.input, flex: "1 1 160px", minWidth: "120px" },
        placeholder: "\u4F8B\uFF1A\u6574\u4F53\u8BED\u6C14\u518D\u4EB2\u5207\u4E00\u70B9",
        value: generalText,
        onChange: (e) => {
          setGeneralText(e.target.value);
          setGeneralError(null);
        }
      }),
      (0, import_react11.createElement)(
        "button",
        { style: S.disabled(S.bigBtn(true), busy), onClick: submitGeneral, disabled: busy },
        "\u7B3C\u7EDF\u63D0\u4E00\u6761"
      ),
      generalError !== null ? (0, import_react11.createElement)("span", { style: S.error }, generalError) : null
    ) : null
  );
}
function GoldCompare(props) {
  const { oldText, newText, opinions } = props;
  const oldParas = splitParagraphs(oldText);
  const newParas = splitParagraphs(newText);
  const ops = diffParagraphs(oldParas, newParas);
  const chipsByNewPara = /* @__PURE__ */ new Map();
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
  const chipSpan = (n) => (0, import_react11.createElement)(
    "span",
    {
      key: `c${n}`,
      style: {
        fontWeight: 700,
        marginRight: "6px",
        color: "var(--dsw-alias-state-business-primary)",
        whiteSpace: "nowrap"
      }
    },
    `#${n}`
  );
  const blocks = ops.map((op, idx) => {
    if (op.type === "del") {
      return (0, import_react11.createElement)(
        "p",
        {
          key: `d${idx}`,
          style: {
            ...READER_PARA_STYLE,
            textDecoration: "line-through",
            background: "var(--dsw-alias-file-diff-deleted-bg)",
            opacity: 0.75
          }
        },
        oldParas[op.old]
      );
    }
    const paraNo = op.new + 1;
    const chips = chipsByNewPara.get(paraNo) ?? [];
    return (0, import_react11.createElement)(
      "p",
      {
        key: `n${idx}`,
        style: op.type === "add" ? {
          ...READER_PARA_STYLE,
          background: "var(--dsw-alias-state-success-tertiary)",
          borderColor: "var(--dsw-alias-state-success-primary)"
        } : READER_PARA_STYLE
      },
      chips.map((n) => chipSpan(n)),
      " ",
      newParas[op.new]
    );
  });
  return (0, import_react11.createElement)(
    "div",
    null,
    (0, import_react11.createElement)(
      "p",
      { style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
      // 票 10（判定四③）：原句 96 字压到 90 字内——「AI 会对号入座」属客套（意见单里就写着哪条
      // 是哪条），删掉后只留三种颜色/编号各自什么意思。
      `\u5BF9\u7167\u65B9\u5F0F\uFF1A\u7EA2\u5E95\u5212\u6389\u7684\u662F\u65E7\u7A3F\u5220\u6389\u7684\uFF1B\u7EFF\u5E95\u662F\u65B0\u7A3F\u6539\u6210\u7684\uFF1B#\u53F7\u5BF9\u5E94\u610F\u89C1\u5355\u91CC\u7684\u7B2C\u51E0\u6761${generalCount > 0 ? `\uFF08\u53E6\u6709 ${generalCount} \u6761\u7B3C\u7EDF\u610F\u89C1\uFF09` : ""}\u3002`
    ),
    ...blocks
  );
}
var DRAFT_CHANGED_HINT = "\u8FD9\u4E00\u7A3F\u6362\u4E86\uFF0C\u4F53\u91CF\u5F97\u91CD\u62CD\u4E00\u6B21\uFF08\u6539\u5B8C\u5B57\u6570\u518D\u70B9\u4E00\u6B21\u300C\u{1F4BE} \u4FDD\u5B58\u5404\u7AE0\u5B57\u6570\u300D\uFF1B\u4E0D\u6539\u4E5F\u8D70\u5F97\u4E0B\u53BB\u2014\u2014\u673A\u5668\u4E0D\u62E6\uFF09\u3002";
var GOLD_STATION9_NOT_DECIDED = "\u5B9A\u7A3F\u7684\u524D\u7F6E\u662F\u7AD9 9 \u5DF2\u62CD\u677F\uFF1A\u5148\u53BB\u7AD9 9 \u70B9\u300C\u{1F4BE} \u4FDD\u5B58\u5404\u7AE0\u5B57\u6570\u300D\u628A\u5404\u7AE0\u5B57\u6570\u5B9A\u4E0B\u6765\u3002";
var GOLD_DRAFT_ACCEPT_LABEL = "\u2705 \u5C31\u7528\u8FD9\u4E00\u7A3F";
var GOLD_DRAFT_REWRITE_LABEL = "\u{1F501} \u4E0D\u6EE1\u610F\uFF0C\u91CD\u5199\u8FD9\u4E00\u7AE0";
var GOLD_SEAL_LABEL = "\u2705 \u5C31\u6309\u8FD9\u7AE0\u7684\u98CE\u683C\u5199\u5168\u4E66";
var GOLD_WRITE_TARGETS_LABEL = "\u{1F4BE} \u4FDD\u5B58\u5404\u7AE0\u5B57\u6570";
var GOLD_WRITE_TARGETS_HINT = "\u624B\u52A8\u6539\u52A8\u4E0E AI \u5EFA\u8BAE\u90FD\u5148\u9884\u586B\uFF1B\u70B9\u300C\u4FDD\u5B58\u300D\u624D\u843D\u76D8\u3002";
var GOLD_DRAFT_PASS_EFFECT = "\u70B9\u4E86\u5B83\u8FD9\u4E00\u7A3F\u5C31\u6B64\u5B9A\u4E0B\uFF0C\u5F53\u5168\u4E66\u7684\u6700\u4F73\u8303\u4F8B\u7AE0\uFF1B\u5404\u7AE0\u5B57\u6570\u8FD8\u8981\u5728\u4E0B\u4E00\u5C4F\u53E6\u5B9A\u4E00\u6B21\u3002";
var GOLD_SEAL_EFFECT = "\u70B9\u4E86\u5B83\u8FD9\u4E00\u7AE0\u5C31\u6B64\u5B9A\u7A3F\uFF0CAI \u7167\u8FD9\u4E00\u7AE0\u7684\u98CE\u683C\u4E0E\u4F53\u91CF\u5199\u5B8C\u6574\u672C\u3002";
function GoldFinalize(props) {
  const {
    meta,
    busy,
    onApprove,
    onSuggestWords,
    onWriteTargets,
    displayPeriod = null,
    station9Decided = false,
    draftChanged = false,
    onReviewDraft
  } = props;
  const [targetDrafts, setTargetDrafts] = (0, import_react11.useState)(
    () => Object.fromEntries(
      (meta?.outline?.chapters ?? []).map((chapter, index) => [
        index + 1,
        Number.isFinite(chapter.targetWords) ? String(chapter.targetWords) : ""
      ])
    )
  );
  const [suggesting, setSuggesting] = (0, import_react11.useState)(false);
  const [writing, setWriting] = (0, import_react11.useState)(false);
  const [suggestion, setSuggestion] = (0, import_react11.useState)(null);
  const [error, setError] = (0, import_react11.useState)(null);
  const chapters = meta?.outline?.chapters ?? [];
  const goldNo = goldChapterNo(meta);
  const canEditTargets = meta?.canEditTargetWords === true;
  const targetEditHint = (() => {
    if (canEditTargets) return null;
    const phase = Number(meta?.phase ?? 0);
    if (phase >= 5) return "\u5199\u5B8C\u6574\u672C\u5DF2\u7ECF\u5F00\u59CB\uFF0C\u9010\u7AE0\u76EE\u6807\u8BF7\u5230\u300C\u5B9A\u70B9\u4FEE\u6539\uFF1A\u7AE0\u8282\u5B89\u6392\u300D\u8C03\u6574\u3002";
    if (meta?.goldSealed != null) return "\u8FD9\u4E00\u7AE0\u5DF2\u5B9A\u7A3F\uFF1B\u9010\u7AE0\u76EE\u6807\u8BF7\u5230\u300C\u5B9A\u70B9\u4FEE\u6539\uFF1A\u7AE0\u8282\u5B89\u6392\u300D\u8C03\u6574\u3002";
    return "\u6B63\u5728\u5199/\u6539\u6700\u4F73\u8303\u4F8B\u7AE0\uFF1B\u9010\u7AE0\u76EE\u6807\u7B49\u8FD9\u4E00\u7AE0\u5B9A\u7A3F\u540E\u518D\u8C03\uFF08\u6216\u8D70\u300C\u5B9A\u70B9\u4FEE\u6539\uFF1A\u7AE0\u8282\u5B89\u6392\u300D\uFF09\u3002";
  })();
  const targetSignature = chapters.map((chapter, index) => `${index + 1}:${chapter.targetWords ?? ""}`).join("|");
  const calibratedLine = (() => {
    const projection = goldRestProjection(meta);
    if (projection === null) return null;
    return `\u6700\u4F73\u8303\u4F8B\u7AE0\u5B9E\u6D4B ${projection.measured} \u6C49\u5B57\u3002\u6309\u6700\u4F73\u8303\u4F8B\u7AE0\u5B9E\u6D4B\u4E0E\u539F\u5B9A\u7684\u6BD4\u4F8B\u5916\u63A8\uFF0C\u5176\u4F59 ${projection.restCount} \u7AE0\u5408\u8BA1\u7EA6 ${projection.projected} \u6C49\u5B57\u2014\u2014\u8981\u8C03\u5417\uFF1F`;
  })();
  (0, import_react11.useEffect)(() => {
    setTargetDrafts(
      Object.fromEntries(
        chapters.map((chapter, index) => [
          index + 1,
          Number.isFinite(chapter.targetWords) ? String(chapter.targetWords) : ""
        ])
      )
    );
  }, [targetSignature]);
  const editableRows = chapters.map((chapter, index) => ({ chapter, n: index + 1 })).filter(({ n }) => n !== goldNo);
  const targetRowsOk = editableRows.every(({ n }) => {
    const raw = String(targetDrafts[n] ?? "").trim();
    if (raw === "") return true;
    const words = Number(raw);
    return Number.isFinite(words) && words >= 500 && words <= 5e4;
  });
  const targetsToWrite = editableRows.flatMap(({ n }) => {
    const raw = String(targetDrafts[n] ?? "").trim();
    if (raw === "") return [];
    const words = Number(raw);
    return Number.isFinite(words) && words >= 500 && words <= 5e4 ? [{ n, targetWords: Math.round(words) }] : [];
  });
  const targetsDirty = editableRows.some(({ chapter, n }) => {
    const raw = String(targetDrafts[n] ?? "").trim();
    if (raw === "") return Number.isFinite(chapter.targetWords);
    return Number.isFinite(chapter.targetWords) ? Math.round(Number(raw)) !== chapter.targetWords : true;
  });
  const requestSuggestion = () => {
    setSuggesting(true);
    setError(null);
    Promise.resolve(onSuggestWords()).then((result) => {
      if (result === null || !Array.isArray(result.perChapter)) {
        setError("AI \u5EFA\u8BAE\u6CA1\u6709\u5E26\u56DE\u9010\u7AE0\u5EFA\u8BAE\uFF0C\u8BF7\u518D\u8BD5\u4E00\u6B21");
        return;
      }
      const perChapter = result.perChapter.filter((item) => Number(item?.n) !== goldNo);
      setTargetDrafts((prev) => {
        const next = { ...prev };
        for (const item of perChapter) {
          const n = Number(item?.n);
          const words = Number(item?.words);
          if (!Number.isSafeInteger(n) || n < 1 || n > chapters.length) continue;
          if (Number.isFinite(words) && words >= 500 && words <= 5e4) {
            next[n] = String(Math.round(words));
          }
        }
        return next;
      });
      setSuggestion({ ...result, perChapter });
    }).catch(
      (err) => setError(String(err instanceof Error ? err.message : err))
    ).finally(() => setSuggesting(false));
  };
  const writeTargets = () => {
    if (!canEditTargets || !targetRowsOk || targetsToWrite.length === 0) return;
    setWriting(true);
    setError(null);
    Promise.resolve(onWriteTargets(targetsToWrite)).then((result) => {
      if (result === null) {
        setError("\u9010\u7AE0\u76EE\u6807\u6CA1\u6709\u5199\u56DE\uFF0C\u8BF7\u68C0\u67E5\u63D0\u793A\u540E\u91CD\u8BD5");
        return;
      }
      setSuggestion(null);
    }).catch((err) => setError(String(err instanceof Error ? err.message : err))).finally(() => setWriting(false));
  };
  return (0, import_react11.createElement)(
    "div",
    { style: S.card },
    (0, import_react11.createElement)(
      "p",
      { style: { margin: "0 0 6px", fontWeight: 600 } },
      // 票 10（判定一 #4）：「样板」是界面词表外的第三套叫法，统一成「最佳范例章」。
      // 票 `confirm-points-redesign-build/08`：抬头从「满意了就定稿」改成**站 9** 的名字——
      // 「这一稿行不行」已经在上一屏拍过（`GoldDraftStage`），这一屏只管**体量**。
      "\u{1F4D0} \u5B9A\u4F53\u91CF\uFF08\u8FD9\u4E00\u7AE0\u5C31\u662F\u5168\u4E66\u7684\u6700\u4F73\u8303\u4F8B\u7AE0\uFF09"
    ),
    (0, import_react11.createElement)(
      "div",
      { style: { display: "flex", gap: "8px", alignItems: "center", margin: "0 0 6px", flexWrap: "wrap" } },
      // 票 07 §2：站 9 屏**不放全文**；要看正文走这个入口——它点开的就是站 8 那一套
      // 读／对比区（⛔ 不复制正文，一个入口而已）。
      (0, import_react11.createElement)("button", { style: S.smallLink, onClick: onReviewDraft }, "\u{1F4D6} \u56DE\u770B\u8FD9\u4E00\u7A3F")
    ),
    draftChanged ? (0, import_react11.createElement)(
      "p",
      { style: { ...S.hint, margin: "0 0 6px" } },
      // ⚠️ **软提示，机器不给硬边**（票 07 §4，Q14 甲）：站 8 重拍之后站 9 那份结论
      // 在界面上只是提醒重拍一次，⛔ 不打回、不拦（「重做上游把下游打回」那一档已裁不做）。
      DRAFT_CHANGED_HINT
    ) : null,
    (0, import_react11.createElement)(
      "div",
      { style: { margin: "6px 0" } },
      // 票 31 / ADR-0026：那句点破「实测」与「逐章目标」关系的话独立占一整行，
      // 不塞进下面输入区的标题（那是「只在样章后报一次」的那一次，塞进去会像输入框的标签）。
      // 读不到标定所需数据时 calibratedLine 为 null ⇒ 退回旧两行，不留空句。
      calibratedLine !== null ? (0, import_react11.createElement)(
        "p",
        {
          style: {
            margin: "0 0 6px",
            padding: "6px 8px",
            background: "var(--dsw-alias-bg-layer-1)",
            borderRadius: "8px",
            border: "1px solid var(--dsw-alias-border-l2)",
            fontSize: "12px"
          }
        },
        calibratedLine
      ) : null,
      (0, import_react11.createElement)(
        "p",
        { style: { margin: "0 0 4px", fontSize: "12px", opacity: 0.8 } },
        "\u9010\u7AE0\u81F3\u5C11\u5199\u5230\uFF08\u5355\u4F4D\uFF1A\u6C49\u5B57\uFF1B\u6765\u81EA\u7AE0\u8282\u5B89\u6392\uFF0C\u53EA\u5728\u5199\u5B8C\u6574\u672C\u5F00\u59CB\u524D\u53EF\u8C03\u3002\u8FD9\u662F\u6700\u4F4E\u7EBF\uFF0C\u5199\u591A\u4E0D\u9650\u2014\u2014\u6700\u540E\u68C0\u67E5\u53EA\u5224\u6709\u6CA1\u6709\u8FBE\u5230\uFF0C\u4E0D\u5224\u8D85\u4E86\u591A\u5C11\uFF09\uFF1A"
      ),
      chapters.map((chapter, index) => {
        const n = index + 1;
        const isGold = n === goldNo;
        const original = Number.isFinite(chapter.targetWords) ? `\u539F\u5B9A ${chapter.targetWords}` : "\u539F\u5B9A\u672A\u5B9A";
        const measured = calibratedLine !== null ? "" : Number.isFinite(meta?.goldMeasuredHanzi) ? `\uFF0C\u5B9E\u6D4B ${meta.goldMeasuredHanzi} \u6C49\u5B57` : "\uFF0C\u5B9E\u6D4B\u6682\u4E0D\u53EF\u7528";
        return (0, import_react11.createElement)(
          "div",
          {
            key: n,
            style: {
              fontSize: "12px",
              margin: "2px 0",
              display: "flex",
              gap: "6px",
              alignItems: "center",
              flexWrap: "wrap"
            }
          },
          (0, import_react11.createElement)("span", null, `${n}. ${chapter.title ?? ""}`),
          isGold ? (0, import_react11.createElement)(
            "strong",
            { style: { color: "var(--dsw-alias-state-business-primary)" } },
            `${original}${measured}`
          ) : canEditTargets ? (0, import_react11.createElement)(
            "input",
            {
              "aria-label": `\u7B2C ${n} \u7AE0\u76EE\u6807\u6C49\u5B57\u6570`,
              style: S.disabled({ ...S.input, width: "92px" }, busy || writing),
              type: "number",
              min: 500,
              max: 5e4,
              step: 100,
              value: targetDrafts[n] ?? "",
              disabled: busy || writing,
              onChange: (e) => {
                setTargetDrafts((prev) => ({ ...prev, [n]: e.target.value }));
                setSuggestion(null);
              }
            }
          ) : (0, import_react11.createElement)(
            "span",
            { style: { opacity: 0.6 } },
            Number.isFinite(chapter.targetWords) ? `\u76EE\u6807 ${chapter.targetWords} \u6C49\u5B57` : "\u76EE\u6807\u672A\u5B9A"
          ),
          !isGold && canEditTargets ? (0, import_react11.createElement)("span", { style: { opacity: 0.6 } }, "\u6C49\u5B57") : null,
          chapter.volumeReason ? (0, import_react11.createElement)(
            "span",
            { style: { opacity: 0.5 } },
            `\uFF08${chapter.volumeReason}\uFF09`
          ) : null
        );
      }),
      // 票 `ui-display-redesign/07`（spec §2.8 第 8 块）：**保存各章字数**（由「写回章节安排」
      // 改名）＋ **AI 建议挪到它旁边**（原先住在兜底区）＋「点『保存』才落盘」一行提示。
      canEditTargets && onWriteTargets !== void 0 ? (0, import_react11.createElement)(
        "div",
        {
          style: {
            display: "flex",
            gap: "8px",
            alignItems: "center",
            marginTop: "6px",
            flexWrap: "wrap"
          }
        },
        (0, import_react11.createElement)(
          "button",
          {
            style: S.disabled({ ...S.bigBtn(true), padding: "6px 12px" }, busy || writing || !targetRowsOk || targetsToWrite.length === 0),
            onClick: writeTargets,
            disabled: busy || writing || !targetRowsOk || targetsToWrite.length === 0
          },
          writing ? "\u6B63\u5728\u4FDD\u5B58\u2026" : GOLD_WRITE_TARGETS_LABEL
        ),
        (0, import_react11.createElement)(
          "button",
          {
            style: S.disabled({ ...S.bigBtn(true), padding: "6px 12px" }, suggesting || writing || busy),
            onClick: requestSuggestion,
            disabled: suggesting || writing || busy
          },
          suggesting ? "AI \u601D\u8003\u4E2D\u2026" : "\u2728 AI \u5EFA\u8BAE"
        ),
        (0, import_react11.createElement)(
          "span",
          { style: { fontSize: "12px", opacity: 0.65 } },
          GOLD_WRITE_TARGETS_HINT
        )
      ) : (0, import_react11.createElement)(
        "p",
        { style: { ...S.hint, margin: "6px 0 0" } },
        // 票 gold-revision-flow/03 复审：文案按**真实状态**说，别把「不可编辑」
        // 一律说成「写完整本已经开始」——阶段 4 改稿、刚定稿那几态铺章都还没开始。
        targetEditHint
      ),
      // 票 `ui-display-redesign/07`（spec §2.8 第 8 块）：建议结果〔折〕——它只是预填的
      // 依据，不该把主键推走；`<details>` 默认不展开。
      suggestion !== null ? (0, import_react11.createElement)(
        "details",
        { style: { margin: "6px 0 0" } },
        (0, import_react11.createElement)(
          "summary",
          { style: { cursor: "pointer", fontSize: "12px", opacity: 0.8 } },
          // 建议结果〔折〕的折叠口文案（票 07 新写）。
          "\u{1F916} AI \u5EFA\u8BAE\u7ED3\u679C\uFF08\u8FD8\u6CA1\u4FDD\u5B58\uFF09"
        ),
        (0, import_react11.createElement)(
          "div",
          { style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.8 } },
          (0, import_react11.createElement)(
            "p",
            { style: { margin: "0 0 4px" } },
            `\u{1F916} AI \u5EFA\u8BAE\u5DF2\u9884\u586B\uFF0C\u8FD8\u6CA1\u4FDD\u5B58\uFF1A\u6574\u4F53\u6BCF\u7AE0\u7EA6 ${suggestion.suggested} \u6C49\u5B57\uFF08${suggestion.range ?? ""}\uFF09\u3002${suggestion.reason ?? ""}`
          ),
          (suggestion.perChapter ?? []).length > 0 ? (0, import_react11.createElement)(
            "div",
            null,
            (suggestion.perChapter ?? []).map(
              (item) => (0, import_react11.createElement)(
                "div",
                { key: item.n, style: { margin: "1px 0" } },
                `${item.n}. ${item.title ?? ""}\uFF1A${Number.isFinite(item.words) ? `\u7EA6 ${item.words} \u6C49\u5B57` : "\u672A\u5B9A\uFF0CAI \u5199\u6574\u672C\u65F6\u81EA\u5B9A"}${item.reason ? `\uFF08${item.reason}\uFF09` : ""}`
              )
            )
          ) : null
        )
      ) : null,
      // 票 `ui-display-redesign/07`（spec §2.8 第 10 块 −1 句）：兜底那句校验随兜底块删除。
      !targetRowsOk ? (0, import_react11.createElement)(
        "p",
        { style: S.error },
        "\u9010\u7AE0\u76EE\u6807\u8BF7\u586B 500-50000 \u6C49\u5B57\uFF0C\u6216\u7559\u7A7A\u6CBF\u7528\u672A\u5B9A\u3002"
      ) : null
    ),
    // 票 `ui-display-redesign/07`（spec §2.8 第 11 块）：未拍板提示整句删除——写回键自身可用
    // 就是软提示（设计稿 §7.7#5）。`GOLD_STATION9_NOT_DECIDED` 只给契约面（`blocked.reason`）。
    error !== null ? (0, import_react11.createElement)("p", { style: S.error }, `\u26A0\uFE0F ${error}`) : null,
    (0, import_react11.createElement)(
      "div",
      {
        style: {
          display: "flex",
          gap: "8px",
          marginTop: "8px",
          alignItems: "center"
        }
      },
      (0, import_react11.createElement)(
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
          "data-gold-seal": "1"
        },
        GOLD_SEAL_LABEL
      )
    )
  );
}
function auditBadgeText(auditText) {
  switch (auditDisplayState(auditText)) {
    case "unknown":
      return "\u{1F9EA} \u68C0\u67E5\u8BB0\u5F55\uFF1A\u672A\u77E5";
    case "missing":
      return "\u{1F9EA} \u68C0\u67E5\uFF1A\u8FD9\u4E00\u7A3F\u8FD8\u6CA1\u6709\u68C0\u67E5\u8BB0\u5F55";
    case "passed":
      return "\u{1F9EA} \u68C0\u67E5\uFF1A\u901A\u8FC7\uFF08\u6CA1\u6709\u5F85\u5B8C\u5584\u9879\uFF09";
    case "issues":
      return "\u{1F9EA} \u68C0\u67E5\uFF1A\u6709\u51E0\u5904\u5F85\u5B8C\u5584\uFF08\u53EF\u4EE5\u8BA9 AI \u6539\uFF09";
    default:
      return "\u{1F9EA} \u68C0\u67E5\uFF1A\u8BB0\u5F55\u683C\u5F0F\u5F85\u5B8C\u5584";
  }
}
function auditDisplayState(auditText) {
  if (auditText === void 0) return "unknown";
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
function measuredHanziOf(meta) {
  const raw = meta?.goldMeasuredHanzi;
  if (raw === null || raw === void 0 || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}
function goldRestProjection(meta = {}) {
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
    0
  );
  if (restOriginal <= 0) return null;
  return { measured, restCount: rest.length, projected: Math.round(restOriginal * measured / goldOriginal) };
}
function goldDraftHeadFacts({ goldDraftVersion, goldAuditText, opinions } = {}) {
  const versionKnown = Number.isSafeInteger(goldDraftVersion) && goldDraftVersion > 0;
  const pending = (opinions ?? []).filter((o) => o?.status === "pending").length;
  const conclusion = {
    unknown: "\u672A\u77E5",
    missing: "\u68C0\u67E5\u8BB0\u5F55\u8FD8\u6CA1\u51FA\u6765",
    malformed: "\u68C0\u67E5\u8BB0\u5F55\u683C\u5F0F\u5F85\u5B8C\u5584",
    passed: "\u68C0\u67E5\u901A\u8FC7",
    issues: "\u6709\u51E0\u5904\u5F85\u5B8C\u5584"
  }[auditDisplayState(goldAuditText)] ?? "\u672A\u77E5";
  return `${versionKnown ? `\u7B2C ${goldDraftVersion} \u7A3F\uFF0C` : ""}${conclusion}\uFF0C${pending} \u6761\u5F85\u5904\u7406\u610F\u89C1\u3002`;
}
function goldMeasureHeadFacts(meta = {}) {
  const measured = measuredHanziOf(meta);
  const projection = goldRestProjection(meta);
  const parts = [];
  if (measured !== null) parts.push(`\u6700\u4F73\u8303\u4F8B\u7AE0\u5B9E\u6D4B ${measured} \u6C49\u5B57`);
  if (projection !== null) parts.push(`\u5176\u4F59 ${projection.restCount} \u7AE0\u5408\u8BA1\u7EA6 ${projection.projected} \u6C49\u5B57`);
  parts.push("\u8FD8\u6CA1\u5B9A\u7A3F");
  return `${parts.join("\uFF0C")}\u3002`;
}
function goldDraftLanded(draftText) {
  return typeof draftText === "string" && draftText.trim() !== "";
}
function goldDisplayPeriod({ draftText, auditText } = {}) {
  if (!goldDraftLanded(draftText)) return null;
  if (auditText !== null) return null;
  return { factLine: "\u8FD9\u4E00\u7A3F\u7684\u68C0\u67E5\u8BB0\u5F55\u8FD8\u6CA1\u51FA\u6765\uFF0C\u6682\u4E0D\u53EF\u5B9A\u7A3F" };
}
var goldTableView = defineCardView({
  card: "GoldTable",
  fromBook: [
    "meta",
    "goldDrafts",
    "goldDraftVersion",
    "goldAuditText",
    "busy",
    "postAction",
    "fetchText",
    "onSuggestWords"
  ],
  required: ["meta", "goldDraftVersion", "postAction", "fetchText", "onSuggestWords"],
  defaults: {},
  // 这张卡同样没有需要现算的表达式：`onSuggestWords` 那个动作信封（`uiCallable`、capture 守卫）
  // 留在壳里——`src/ui/` 跨域协作只走 public exports（AGENTS.md「Frontend layout」），不把它拖进来。
  derive: () => ({})
});
function GoldDraftStage(props) {
  const {
    meta,
    goldDrafts,
    goldDraftVersion,
    goldAuditText,
    busy,
    postAction,
    fetchText,
    // 站 8 拍板之后这一屏还能回来（「📖 回看这一稿」）——`reviewing` 只影响抬头那半句。
    reviewing = false
  } = props;
  const auditText = goldAuditText;
  const [texts, setTexts] = (0, import_react11.useState)({});
  const [view, setView] = (0, import_react11.useState)({ tab: goldDraftVersion, mode: "read" });
  const [loadError, setLoadError] = (0, import_react11.useState)(null);
  const [confirming, setConfirming] = (0, import_react11.useState)(null);
  const opinions = meta.goldOpinions ?? [];
  const goldNo = goldChapterNo(meta);
  const currentPath = chapterRel(goldNo);
  const pathOf = (version) => version === goldDraftVersion ? currentPath : (goldDrafts ?? []).find((d) => d.version === version)?.path ?? null;
  const load = (path) => {
    if (texts[path] !== void 0) return;
    fetchText(path).then((t) => setTexts((prev) => ({ ...prev, [path]: t }))).catch(
      (err) => setLoadError(String(err instanceof Error ? err.message : err))
    );
  };
  (0, import_react11.useEffect)(() => {
    load(currentPath);
  }, []);
  const showTab = Math.min(view.tab, goldDraftVersion);
  const showPath = pathOf(showTab);
  (0, import_react11.useEffect)(() => {
    if (showPath !== null) load(showPath);
  }, [showPath]);
  const showText = showPath === null ? null : texts[showPath] ?? null;
  const compareWith = view.mode === "compare" ? showTab === goldDraftVersion ? showTab - 1 : showTab + 1 : null;
  const comparePath = compareWith !== null ? pathOf(compareWith) : null;
  (0, import_react11.useEffect)(() => {
    if (comparePath !== null) load(comparePath);
  }, [comparePath]);
  const compareText = comparePath === null ? null : texts[comparePath] ?? null;
  const auditBadge = auditBadgeText(auditText);
  const draftLanded = goldDraftLanded(texts[currentPath]);
  const displayPeriod = goldDisplayPeriod({ draftText: texts[currentPath], auditText });
  const addOpinion = (kind, wish, para, hint) => {
    void postAction({
      action: "gold-opinion",
      kind,
      wish,
      ...para !== null ? { para } : {},
      ...hint ? { hint } : {}
    });
  };
  const tabBtn = (v) => (0, import_react11.createElement)(
    "button",
    {
      key: v,
      style: S.projectBtn(view.tab === v),
      onClick: () => setView({ tab: v, mode: "read" })
    },
    `\u7B2C ${v} \u7A3F${v === goldDraftVersion ? "\uFF08\u6700\u65B0\uFF09" : ""}`
  );
  return (0, import_react11.createElement)(
    "div",
    null,
    // 展示期那句**明确状态**（票 walkthrough-2026-10/04 裁决甲）——它现在住在**站 8 这一屏**
    // （票 07 §5：展示期落在站 8 之前：这一屏可见、两颗键禁用 ＋ 理由写在脸上）。
    displayPeriod !== null ? (0, import_react11.createElement)(
      "p",
      {
        style: {
          margin: "0 0 6px",
          padding: "4px 8px",
          background: "var(--dsw-alias-bg-layer-1)",
          borderRadius: "8px",
          border: "1px solid var(--dsw-alias-border-l2)",
          fontSize: "12px"
        }
      },
      displayPeriod.factLine
    ) : null,
    goldDraftVersion > 1 ? (0, import_react11.createElement)(
      "div",
      {
        style: {
          display: "flex",
          gap: "6px",
          flexWrap: "wrap",
          marginBottom: "6px"
        }
      },
      Array.from({ length: goldDraftVersion }, (_, i) => tabBtn(i + 1)),
      showTab === goldDraftVersion ? (0, import_react11.createElement)(
        "button",
        {
          style: S.smallLink,
          onClick: () => setView({
            tab: showTab,
            mode: view.mode === "compare" ? "read" : "compare"
          })
        },
        view.mode === "compare" ? "\u53EA\u770B\u8FD9\u4E00\u7A3F" : `\u548C\u7B2C ${goldDraftVersion - 1} \u7A3F\u5BF9\u6BD4`
      ) : (0, import_react11.createElement)(
        "button",
        {
          style: S.smallLink,
          onClick: () => setView({
            tab: showTab,
            mode: view.mode === "compare" ? "read" : "compare"
          })
        },
        view.mode === "compare" ? "\u53EA\u770B\u8FD9\u4E00\u7A3F" : `\u548C\u7B2C ${showTab + 1} \u7A3F\u5BF9\u6BD4`
      )
    ) : null,
    loadError !== null ? (0, import_react11.createElement)("p", { style: S.error }, `\u7A3F\u5B50\u6253\u5F00\u5931\u8D25\uFF1A${loadError}`) : null,
    (0, import_react11.createElement)(
      "div",
      { style: { margin: "6px 0" } },
      showText === null ? (0, import_react11.createElement)("p", { style: S.hint }, "\u52A0\u8F7D\u4E2D\u2026") : view.mode === "compare" && compareText !== null ? (0, import_react11.createElement)(
        "div",
        null,
        (0, import_react11.createElement)(
          "p",
          { style: S.hint },
          "\u60F3\u5728\u8FD9\u4E00\u7A3F\u4E0A\u7EE7\u7EED\u6311\u6BDB\u75C5\uFF1F\u70B9\u300C\u53EA\u770B\u8FD9\u4E00\u7A3F\u300D\u3002"
        ),
        (0, import_react11.createElement)(GoldCompare, {
          oldText: showTab === goldDraftVersion ? compareText : showText,
          newText: showTab === goldDraftVersion ? showText : compareText,
          opinions
        })
      ) : (0, import_react11.createElement)(GoldReader, {
        text: showText,
        opinions,
        busy,
        onOpinion: addOpinion,
        onRevokeOpinion: (id) => {
          void postAction({ action: "gold-opinion-revoke", id });
        },
        readOnly: showTab !== goldDraftVersion,
        // 票 `demo-channel-full/25`：确认层那句话的取值要认得出演示书（本卡手上的就是这一份）。
        meta
      }),
      showTab !== goldDraftVersion && view.mode === "read" ? (0, import_react11.createElement)(
        "p",
        { style: { fontSize: "12px", opacity: 0.7, margin: "4px 0" } },
        // 票 10（判定四①）：与上面「想在这一稿上继续挑毛病？点『只看这一稿』」是同一件事
        // 的两种说法（一条讲怎么改、一条讲为什么不能改），收敛成这一句——它信息量大
        // （说清了"旧稿只能回顾"这个原因）。两处不会同屏（mode 互斥），故只留一份字。
        "\u8FD9\u662F\u65E7\u7A3F\uFF0C\u53EA\u80FD\u56DE\u987E\uFF1B\u8981\u6311\u6BDB\u75C5\u8BF7\u56DE\u5230\u300C\u6700\u65B0\u300D\u90A3\u7A3F\u3002"
      ) : null
    ),
    (0, import_react11.createElement)(GoldOpinionList, {
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
      }
    }),
    // ── 拆屏小字〔常显／两键上方〕（票 `ui-display-redesign/07` §2.7 第 9 块）──────────────
    // ⚠️ **有意付的代价**照实说在界面上（票 07 §8 末）：拆开之后要两屏各点一下。
    (0, import_react11.createElement)(
      "p",
      { style: { ...S.hint, margin: "8px 0 0" } },
      "\u300C\u5C31\u7528\u8FD9\u4E00\u7A3F\u300D\u53EA\u8868\u6001\u8FD9\u4E00\u7A3F\u884C\uFF1B\u5B57\u6570\u8FD8\u8981\u5728\u4E0B\u4E00\u5C4F\u53E6\u62CD\u4E00\u6B21\u3002"
    ),
    // ── 站 8 的两颗键（票 07 §3；⛔ 文案不带「定稿」二字——定稿是站 9 之后那一下）──────────
    // 展示期禁用面**同时**盖住这两颗 ＋ 下面重写那层的「确认重写」＝三处，⛔ 不许漏出一个
    // 能点的窗口（票面点名的那条实现面）。
    // 票 `ui-display-redesign/07`（spec §2.7 第 8 块，取代 `gold-display-period/02` 的 UI 落法）：
    // 原先分挂两颗的按键盘理由**整段删除**——禁用的唯一解释是顶部那条 fact line。
    (0, import_react11.createElement)(
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
      (0, import_react11.createElement)(
        "button",
        {
          style: S.disabled(S.bigBtn(true), busy || displayPeriod !== null),
          onClick: () => void postAction({ action: "gold-draft-approve", approved: true }),
          disabled: busy || displayPeriod !== null,
          // 票 `auto-walkthrough/04`：关键键的语义钩子（站 8 这一稿行不行）。
          "data-gold-approve": "1"
        },
        GOLD_DRAFT_ACCEPT_LABEL
      ),
      (0, import_react11.createElement)(
        "button",
        {
          style: S.disabled(
            {
              ...S.bigBtn(true),
              background: "transparent",
              color: "var(--dsw-alias-state-error-primary)",
              padding: "8px 10px"
            },
            busy || displayPeriod !== null
          ),
          onClick: () => setConfirming("rewrite"),
          disabled: busy || displayPeriod !== null
        },
        GOLD_DRAFT_REWRITE_LABEL
      )
    ),
    // ── 重写后果＋确认层〔隐〕（票 `ui-display-redesign/07` §2.7 第 11 块）──────────────
    // 后果句原先常显在两键下方；票 07 把它收进确认层——没点重写键时整块不出现。
    confirming === "rewrite" ? (0, import_react11.createElement)(
      "div",
      {
        style: {
          ...S.card,
          borderColor: "var(--dsw-alias-state-error-primary)",
          marginTop: "8px"
        }
      },
      (0, import_react11.createElement)(
        "p",
        { style: { ...S.hint, margin: "0 0 6px" } },
        // 票 14（承诺账 A2）＋票 `demo-channel-full/26`：两取值，出口＝`view-rules.goldRewriteHint`。
        goldRewriteHint(meta)
      ),
      (0, import_react11.createElement)(
        "p",
        { style: { margin: "0 0 6px" } },
        // 票 14（承诺账 A2）：归档是「尽力」语义，「不丢」是全集承诺——收掉。
        // 票 `demo-channel-full/26`：演示取值只把「AI」换成「演示书自己」（重写真发生）。
        goldRewriteConfirmNote(meta)
      ),
      (0, import_react11.createElement)(
        "div",
        { style: { display: "flex", gap: "8px" } },
        (0, import_react11.createElement)(
          "button",
          {
            style: S.disabled(
              {
                ...S.bigBtn(true),
                background: "transparent",
                color: "var(--dsw-alias-state-error-primary)"
              },
              busy || displayPeriod !== null
            ),
            onClick: () => void postAction({ action: "gold-draft-approve", approved: false }),
            // 展示期里确认层这颗与外面那颗同一件事实（`rewriteReason`）。
            disabled: busy || displayPeriod !== null
          },
          "\u786E\u8BA4\u91CD\u5199"
        ),
        (0, import_react11.createElement)(
          "button",
          { style: S.smallLink, onClick: () => setConfirming(null) },
          "\u518D\u60F3\u60F3"
        )
      )
    ) : null
  );
}
function GoldTable(props) {
  const {
    meta,
    goldDrafts,
    goldDraftVersion,
    goldAuditText,
    busy,
    postAction,
    fetchText,
    onSuggestWords
  } = props;
  const decisions = meta?.stationDecisions ?? {};
  const draft = decisions[8] ?? decisions["8"] ?? null;
  const measured = decisions[9] ?? decisions["9"] ?? null;
  const draftApproved = draft?.approved === true;
  const station9Decided = measured?.approved === true;
  const draftChanged = station9Decided && draftApproved && typeof draft?.decidedAt === "string" && typeof measured?.decidedAt === "string" && draft.decidedAt > measured.decidedAt;
  const [reviewing, setReviewing] = (0, import_react11.useState)(false);
  const showStation9 = draftApproved && !reviewing;
  const auditText = goldAuditText;
  const headFactsBase = showStation9 ? goldMeasureHeadFacts(meta) : goldDraftHeadFacts({
    goldDraftVersion,
    goldAuditText: auditText,
    opinions: meta?.goldOpinions ?? []
  });
  const provenanceText = (showStation9 ? measured : draft)?.provenanceText ?? "";
  const headFacts = `${headFactsBase}${provenanceText === "" ? "" : ` ${provenanceText}`}`;
  return (0, import_react11.createElement)(
    "div",
    { style: S.focus },
    // ── 卡头行（票 `ui-display-redesign/07`；spec §2.7 第 1／2 块、§2.8 第 1／2 块）──────────
    // 问句＝存量 `decisionOf` 那句（逐字不改，⛔ 不进 `decisionOf` 的第二份）；事实句按这一屏的
    // 现有读数现算。⚠️ 问句的 `<strong>` **字面量必须写在本文件里**再作为 `question` 传给共用件
    // （理由见 `card-head.js` 文件头「API」：焦点区卡标题的取证面只认卡片自己文件里的字面量）。
    (0, import_react11.createElement)(CardHead, {
      question: showStation9 ? (0, import_react11.createElement)(
        "strong",
        { style: CARD_HEAD_QUESTION_STYLE },
        "\u5176\u4F59\u5404\u7AE0\u7684\u5B57\u6570\u5C31\u6309\u8FD9\u4E2A\u5B9A\u5417\uFF1F"
      ) : (0, import_react11.createElement)(
        "strong",
        { style: CARD_HEAD_QUESTION_STYLE },
        "\u8FD9\u4E00\u7A3F\u80FD\u5F53\u5168\u4E66\u7684\u6700\u4F73\u8303\u4F8B\u7AE0\u5417\uFF1F"
      ),
      facts: headFacts
    }),
    (0, import_react11.createElement)(
      "div",
      {
        style: {
          display: "flex",
          gap: "8px",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: "6px"
        }
      },
      // ⚠️ **这一段是纯字面量、⛔ 不许写成条件表达式、也不许在实参里夹注释**：
      // `test-context-vocabulary.mjs` 的逐字性判据（票 07 契约①）从源码里抠**焦点区卡标题**
      // ——它认的是「`<strong>` 的最后一个实参是**一个**字符串字面量」且祖先是卡根（`S.focus`）。
      // 写成 `cond ? "a" : "b"`、或在实参里夹一句注释，这一串就从清单里消失（那一格当场红）。
      // 「现在是哪一屏」另起一格说（下面那个 span）。
      (0, import_react11.createElement)("strong", { style: { fontSize: "13px" } }, "\u{1F91D} \u6700\u4F73\u8303\u4F8B\u7AE0\uFF1A\u4E00\u8D77\u5B9A\u98CE\u683C"),
      (0, import_react11.createElement)(
        "span",
        { style: { fontSize: "12px", opacity: 0.8 } },
        showStation9 ? "\u7AD9 9\uFF1A\u5B9A\u4F53\u91CF" : "\u7AD9 8\uFF1A\u8FD9\u4E00\u7A3F\u884C\u4E0D\u884C"
      ),
      (0, import_react11.createElement)(
        "span",
        { style: { fontSize: "12px", opacity: 0.8 } },
        auditBadgeText(auditText)
      )
    ),
    showStation9 ? (0, import_react11.createElement)(GoldFinalize, {
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
      onWriteTargets: (targets) => postAction({ action: "gold-target-words-set", targets })
    }) : (0, import_react11.createElement)(GoldDraftStage, {
      meta,
      goldDrafts,
      goldDraftVersion,
      goldAuditText,
      busy,
      postAction,
      fetchText,
      reviewing
    })
  );
}

// src/ui/chapters-map.js
var import_react13 = require("react");

// src/ui/open-artifact-button.js
var import_react12 = require("react");
function OpenArtifactButton(props) {
  return (0, import_react12.createElement)(
    "button",
    {
      style: S.disabled(
        {
          marginLeft: "auto",
          border: "1px solid var(--dsw-alias-border-l2)",
          borderRadius: "8px",
          padding: "4px 12px",
          fontSize: "12px",
          fontWeight: 600,
          background: "transparent",
          color: "inherit",
          cursor: "pointer",
          whiteSpace: "nowrap",
          ...props.style ?? {}
        },
        props.disabled === true
      ),
      onClick: () => props.onOpen(props.item.path),
      disabled: props.disabled === true,
      // 票 10（判定三 #1）：这里原来印 `${props.item.path}`（`工作区/explore.md` 这类机器路径）。
      // CONTEXT.md「产物名」明写「产物相对路径原文连按钮的悬浮提示一起不上屏」——名字一律走
      // `artifactName`（票 05 的同一份词表，任何屏同一个名字）。
      title: props.title ?? `\u5728\u53F3\u680F\u6253\u5F00\u300C${artifactName(props.item.path)}\u300D`
    },
    props.label ?? "\u6253\u5F00"
  );
}

// src/ui/chapters-map.js
var CHAPTER_NOT_READY = Object.freeze({ icon: "\u23F3", tone: "#57606a" });
var NO_WORK_FILES = Object.freeze([]);
var DRAFT_QUALIFIER = "\uFF08\u672A\u5B9A\u7A3F\uFF09";
var CHAPTERS_APPROVE_LABEL = "\u2705 \u90FD\u8FC7\u4E86\uFF0C\u8FDB\u5165\u6700\u540E\u68C0\u67E5";
var CHAPTERS_REVIEW_LABEL = "\u270D\uFE0F \u5199\u610F\u89C1";
var CHAPTERS_CARD_QUESTION = "\u5168\u4E66\u90FD\u8FC7\u76EE\u4E86\u3001\u53EF\u4EE5\u4EA4\u5DE5\u5417\uFF1F";
function chaptersCardFacts(done, total, pendingCount) {
  const opinions = pendingCount === 0 ? "\u6CA1\u6709\u672A\u5904\u7F6E\u7684\u610F\u89C1" : `${pendingCount} \u6761\u610F\u89C1\u5F85\u5904\u7F6E`;
  return `${done}/${total} \u7AE0\u5DF2\u5B8C\u6210\uFF0C${opinions}\uFF1B\u4EA4\u5DE5\u540E\u5408\u5E76\u6210\u4E66\u3002`;
}
var CHAPTERS_EMPTY_NOTE = "\u8FD8\u6CA1\u6709\u7AE0\u8282\u2014\u2014\u7B49\u7AE0\u8282\u5B89\u6392\u5B9A\u4E0B\u6765\uFF0C\u8FD9\u91CC\u4F1A\u9010\u7AE0\u5217\u51FA\u6765\u3002";
var CHAPTERS_FOOTER_FOLD_SUMMARY = "\u{1F4CC} \u5B58\u6863\u8BF4\u660E";
var CHAPTERS_APPROVE_EFFECT = "\u70B9\u4E86\u5B83\u5C31\u662F\u628A\u8FD9\u672C\u4E66\u4EA4\u51FA\u53BB\u5408\u5E76\u6210\u4E66\uFF1B\u4E4B\u540E\u60F3\u6539\uFF0C\u56DE\u5230\u6700\u8FD1\u4E00\u6B21\u5B58\u6863\u6216\u5C31\u5730\u5199\u4E00\u6761\u610F\u89C1\u3002";
var CHAPTER_FILE_MISSING_REASON = "\u8FD9\u4E00\u7AE0\u8FD8\u6CA1\u5199\u51FA\u6765\uFF08\u6216\u6587\u4EF6\u6539\u540D\u4E86\uFF09\uFF0C\u6682\u65F6\u770B\u4E0D\u4E86";
var draftOpenTitle = (name) => `\u5728\u53F3\u680F\u6253\u5F00\u300C${name}\u300D\uFF1B\u8FD9\u4E00\u7AE0\u8FD8\u6CA1\u5B9A\u7A3F\uFF0CAI \u8FD8\u53EF\u80FD\u518D\u6539\u5B83\uFF0C\u73B0\u5728\u8BFB\u5230\u7684\u5185\u5BB9\u4E0D\u4FDD\u8BC1\u662F\u6700\u540E\u7684\u6837\u5B50`;
function reviewProgressByChapter(events) {
  const byChapter = /* @__PURE__ */ new Map();
  for (const event of events ?? []) {
    if (event?.type !== "textbook/progress") continue;
    const text = `${event.data?.label ?? ""}\u3000${event.data?.detail ?? ""}`.trim();
    if (!text.includes("\u5DF2\u6309\u62BD\u67E5\u610F\u89C1\u4FEE\u8BA2")) continue;
    const match = /第\s*(\d+)\s*章/.exec(text);
    if (match === null) continue;
    byChapter.set(Number(match[1]), text.replace(/\s+/g, " "));
  }
  return byChapter;
}
function ChapterReviewLine(props) {
  const { review, busy, onRevoke, progressText } = props;
  const state = reviewState(review);
  const text = reviewText(review);
  const canRevoke = state.revocable && typeof review?.id === "string" && review.id !== "";
  const withdrawing = state.key === "pending";
  const showProgress = state.key === "pending" && typeof progressText === "string" && progressText !== "";
  return (0, import_react13.createElement)(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: "6px",
        flexWrap: "wrap",
        margin: "3px 0",
        fontSize: "12px"
      }
    },
    (0, import_react13.createElement)("span", { style: { opacity: 0.6 } }, "\xB7 "),
    (0, import_react13.createElement)(
      "span",
      { style: { flex: "1 1 160px", wordBreak: "break-word" } },
      text
    ),
    (0, import_react13.createElement)(
      "span",
      {
        style: {
          color: state.key === "pending" ? "#cf222e" : state.key === "applied" ? "#1a7f37" : "var(--dsw-alias-label-primary)",
          opacity: state.key === "revoked" ? 0.55 : 1
        }
      },
      state.text
    ),
    showProgress ? (0, import_react13.createElement)(
      "span",
      {
        style: {
          flex: "1 1 100%",
          marginLeft: "14px",
          color: "var(--dsw-alias-label-primary)",
          opacity: 0.75
        }
      },
      `AI \u8BF4\u5B83\u6539\u597D\u4E86\uFF0C\u7B49\u4F60\u786E\u8BA4\uFF1A${progressText}\uFF08\u8FD9\u53E5\u662F AI \u81EA\u8FF0\uFF0C\u4F60\u70B9\u5934\u624D\u9500\u53F7\uFF09`
    ) : null,
    canRevoke ? (0, import_react13.createElement)(
      "button",
      {
        style: S.disabled(S.smallLink, busy),
        onClick: () => onRevoke(state.key, review),
        disabled: busy,
        title: withdrawing ? "\u64A4\u56DE\u8FD9\u6761\u610F\u89C1\uFF1AAI \u4E0D\u518D\u7167\u5B83\u6539\uFF0C\u8FD9\u4E00\u7AE0\u4E5F\u4E0D\u518D\u88AB\u5B83\u62E6\u7740\u4EA4\u5DE5\uFF08\u4E0D\u56DE\u6EDA\u5DF2\u7ECF\u6539\u597D\u7684\u6B63\u6587\uFF09" : "\u628A\u8FD9\u6761\u610F\u89C1\u9000\u56DE\u672A\u5904\u7F6E\uFF1A\u8FD9\u4E00\u7AE0\u7684\u4EA4\u5DE5\u4F1A\u91CD\u65B0\u88AB\u5B83\u62E6\u4F4F"
      },
      withdrawing ? "\u64A4\u56DE" : "\u7FFB\u6848"
    ) : null
  );
}
var chaptersCardView = defineCardView({
  card: "ChaptersCard",
  fromBook: [
    // ── 书级只读数据（`client-entry.js` 里同名或近似名的局部量）
    "meta",
    "chapterStatus",
    "pendingReviews",
    "progressDetail",
    "contextPercent",
    "events",
    "workFiles",
    // ⚠️ 壳里写的是 `chapterSegments: processSegs`（`/textbook/process` 的分段事实；票 20
    //    「谁在写哪一章」与徽章新鲜度都吃它）。book 侧用壳里那个标识符，卡侧由 derive 整形。
    "processSegs",
    // 票 20：此刻**真在跑**的小助手有几个（与顶栏「🔎 N 个小助手在跑」同一份读数）。
    // ⚠️ 刻意**不给**缺省 0：卡内的 `view-rules.indexRunningChapterClaims` 自己按 0 算
    //    （注释逐字写着「缺这一格按 0 算，不是缺省成『全都在写』」），那句话留在判据那边。
    "runningSubagentCount",
    "busy",
    // ── 壳注入的接线（回调与读取口，不是界面词）
    "readArtifact",
    "postAction",
    // 壳里是就地箭头：`() => void postAction({action:"chapters-review-confirm", approved:true})`
    // ——它没有自己的局部标识符，prop 名就是它在壳里写的名字（`client-entry.js` 的
    // `onApproveAll`）。与 final 卡那颗 `onApprove`（壳里的 `onApprove` 键）是两个键，不撞名。
    "onApproveAll",
    // 壳里是就地箭头：`(n) => viewWork({path: "工作区/chapter-NN.md", label: 第 n 章})`。
    // ⚠️ 撞名核查：`onView` 在壳里只出现在**这一处**；源探查确认卡那一处叫
    //    `onViewReport`（`viewWork({path:"工作区/explore.md"})`），是两个不同的闭包、两个键。
    "onView",
    // 壳里写的是 `onReview: submitReview`（`client-entry.js` 的 `submitReview` 本名）。
    "submitReview"
  ],
  required: ["postAction", "readArtifact", "onView"],
  defaults: {
    // 「产物清单还没读到」＝「读到一份空清单」，在卡里是同一句话（`hasChapterFile` 里
    // `files.length === 0` ⇒ 一律不置灰，旧账本口径）。空引用必须是模块级同一引用 ⇒
    // `NO_WORK_FILES`。壳照旧传 `workFiles`，这一格只在**书没给**时补。
    workFiles: NO_WORK_FILES,
    // 票 28：主 AI 上下文占用读不到就是「不显示这一格」，**绝不显示 0%**。
    // 缺省只在 `undefined` 时填——书上给 `null` 原样保住（缺省三规则第 2 条）。
    contextPercent: null,
    // ⚠️ 下面两个是 **SSR 专用开口**，不是「让测试偷懒的旁门」（票 03 裁决 A，2026-10）：
    //    壳**从不**传它们；全仓唯一注入点是 `smoke-test.mjs` 第 24 节，那一节用
    //    `renderToStaticMarkup` **直接渲这张卡**——正文是卡内 effect 取回来的，SSR 跑不了
    //    effect，不靠这两个 prop 就无法呈现「章节已展开」这一态。定性：**给一个客户端状态
    //    补的 SSR 渲染路径**（真实取数那条路仍由组件测试钉着，两处并存，不是二选一）。
    //    将来冒烟那一节若改用客户端渲染，这两个 prop 随之删除——**记在这里，别让它们
    //    悄悄长成别的东西**（destructure 处 `:326-336` 那段说明是它的原文）。
    // 复核「`null` 作缺省安全」（两处用法逐字）：`:350` 的
    // `Number.isSafeInteger(initialOpenChapter) && initialOpenChapter >= 1`
    // 对 `null` 与 `undefined` 同为 `false`（不预开初始态）；`:599-602` 的
    // `typeof chapterTextOverride === "string" && chapterTextOverride !== ""`
    // 对 `null`（`typeof` 得 `"object"`）与 `undefined` 同为 `false`（回落
    // `chapterText`）。⇒ 两者逐字同路，不需要另找缺省值。
    initialOpenChapter: null,
    chapterTextOverride: null
  },
  // 壳里的现算表达式 ＋ book 侧键 → 卡片 prop 名的整形。**无条件**给出下面每一个键。
  derive: (bag) => ({
    chapterSegments: bag.processSegs,
    onReview: bag.submitReview,
    // 过目态（票 10）：壳里就是这一句 `meta.status === "awaiting-chapters-review"`。
    // 收进契约是为了**只此一份**——留在壳里各写一份，正是本票要收的「接线住在壳里」。
    reviewMode: bag.meta?.status === "awaiting-chapters-review"
  })
});
function ChaptersCard(props) {
  const {
    meta,
    chapterStatus,
    pendingReviews,
    progressDetail,
    onView,
    onReview,
    busy,
    reviewMode,
    onApproveAll,
    events,
    workFiles,
    chapterSegments,
    // 票 20：此刻**真在跑**的小助手有几个（`indexSubagentDescendants()` 那个 `runningCount`，与顶栏
    // 「🔎 N 个小助手在跑」同一份读数）。它决定「我正在做」有几个名额——章卡与归属都经它，
    // 所以屏上「说我在做的行数」**≤**「几个小助手在跑」，候选够时两者相等（票面 :63/:103）。
    // ⚠️ 缺这一格按 0 算（不是缺省成「全都在写」）：少说一次「我正在做」收得回来，
    // 多说一次就是票 20 那个病本身。
    runningSubagentCount,
    // 票 03：产物读取归 `ui/artifact-read.js`（`createArtifactReader(...).readText`），
    // 本卡只给一个 `rel`。`project` / `session` 两个身份 prop 因此**退休**——它们原先只被用来
    // 拼那一条 URL（收编前全卡对这两个名字的引用只有 destructure、那道 `project == null` 早退、
    // 那条 URL、以及依赖数组里的它们）。
    readArtifact,
    // ⚠️ 下面两个是 **SSR 专用开口**，不是「让测试偷懒的旁门」（票 03 裁决 A，2026-10）。
    //
    // 收编时本想一并删掉，理由是它们违反 `dead-gates` 不变量 7「断言必须经产品代码的路径把
    // 字段喂进去」。**那个理由只对客户端测试成立**——`test-component-cards.mjs` 那三条已改走
    // 真实点击（从收起态点「▸ 展开第 N 章正文」取正文），比原来更强，不退回。
    //
    // **但 `smoke-test.mjs` 第 24 节用的是 `renderToStaticMarkup`（SSR）**：正文是**卡内 effect
    // 取回来**的（`client-entry.js:6072` 记着「SSR 跑不了 useEffect/fetch」），SSR 不跑 effect ⇒
    // 不靠这两个 prop，**SSR 就无法呈现「章节已展开」这一态**。这不是豁免一条业务判据，是给一个
    // 客户端状态补一条 SSR 渲染路径；真实取数那条路仍由组件测试钉着（两处并存，不是二选一）。
    // 将来若冒烟那一节改用客户端渲染，这两个 prop 即可随之删除——**记在这里，别让它们悄悄长成别的东西**。
    initialOpenChapter,
    chapterTextOverride,
    // 票 28：主 AI 上下文占用百分比（null = 宿主读不到，界面不显示这一格）。
    contextPercent,
    postAction
  } = props;
  const [reviewing, setReviewing] = (0, import_react13.useState)(null);
  const [comment, setComment] = (0, import_react13.useState)("");
  const [openChapter, setOpenChapter] = (0, import_react13.useState)(
    () => Number.isSafeInteger(initialOpenChapter) && initialOpenChapter >= 1 ? initialOpenChapter : null
  );
  const [keepOpenChapter, setKeepOpenChapter] = (0, import_react13.useState)(null);
  const [chapterText, setChapterText] = (0, import_react13.useState)(null);
  const [chapterError, setChapterError] = (0, import_react13.useState)(null);
  (0, import_react13.useEffect)(() => {
    let alive = true;
    setChapterText(null);
    setChapterError(null);
    if (openChapter === null || openChapter === void 0) return void 0;
    readArtifact(chapterRel(openChapter)).then((text) => {
      if (alive) setChapterText(text);
    }).catch((err) => {
      if (alive)
        setChapterError(String(err instanceof Error ? err.message : err));
    });
    return () => {
      alive = false;
    };
  }, [openChapter, readArtifact]);
  const rows = (meta?.outline?.chapters ?? []).map((chapter, index) => {
    const found = (chapterStatus ?? []).find(
      (row) => Number(row.n) === index + 1
    );
    const foundSource = found != null ? found.source ?? "" : "";
    return {
      n: index + 1,
      title: found?.title ?? chapter.title ?? `\u7B2C${index + 1}\u7AE0`,
      source: foundSource !== "" ? foundSource : chapter.source ?? "",
      // F38（2026-08-20 走查）：每章「源材料索引」的覆盖知识点与体量依据，取自确认过的大纲。
      points: Array.isArray(chapter?.points) ? chapter.points.map((pt) => String(pt ?? "").trim()).filter((pt) => pt !== "") : [],
      volumeReason: typeof chapter?.volumeReason === "string" ? chapter.volumeReason : "",
      // 票 `word-budget-ineffective/02`：字数兜底与当前实际汉字数**只消费服务端下发的那两格**
      // （`engine.chapterWordReading` 的单点读数）。⛔ 界面这一侧不再拼
      // 「chapter.targetWords ?? meta.targetWords」——那是第二份兜底口径。
      wordsFloor: Number.isFinite(found?.wordsFloor) ? found.wordsFloor : null,
      actualHanzi: Number.isFinite(found?.actualHanzi) ? found.actualHanzi : null,
      written: found?.written === true || (chapterStatus ?? []).length === 0,
      audited: found?.audited === true || (chapterStatus ?? []).length === 0
    };
  });
  const doneSet = (0, import_react13.useMemo)(
    () => deriveDoneSet(events, goldChapterNo(meta)),
    [events, meta]
  );
  const reviewProgress = (0, import_react13.useMemo)(() => reviewProgressByChapter(events), [events]);
  const hasChapterFile = (n) => {
    const files = workFiles ?? [];
    if (files.length === 0) return true;
    return files.some((f) => f.path === chapterRel(n));
  };
  const chapterIsDoneAt = (n) => chapterIsDone(chapterStatus, doneSet, pendingReviews, n);
  const serverDoneOf = (n) => {
    const found = (chapterStatus ?? []).find((r) => Number(r?.n) === Number(n));
    return typeof found?.done === "boolean" ? found.done : null;
  };
  const done = rows.filter((row) => chapterIsDoneAt(row.n)).length;
  const pendingReviewCount = (pendingReviews ?? []).filter((review) => isReviewPending(review)).length;
  const prepared = (chapterStatus ?? []).length > 0;
  const pendingByChapter = rows.filter((row) => hasPendingReview(pendingReviews, row.n)).map((row) => ({
    n: row.n,
    count: (pendingReviews ?? []).filter(
      (review) => Number(review.chapter) === Number(row.n) && isReviewPending(review)
    ).length
  }));
  const pendingExplain = pendingByChapter.length === 0 ? "" : `\uFF08${pendingByChapter.map((item) => `\u7B2C ${item.n} \u7AE0\u6709 ${item.count} \u6761\u610F\u89C1\u5F85\u4FEE\u8BA2`).join("\uFF1B")}\uFF09`;
  const contextNote = contextOccupancySentence(contextPercent);
  const contextNoteText = contextNote === "" ? "" : `\uFF08${contextNote}\uFF09`;
  const chapterClaims = (0, import_react13.useMemo)(
    () => indexRunningChapterClaims(chapterSegments, runningSubagentCount),
    [chapterSegments, runningSubagentCount]
  );
  const sendReview = (n) => {
    if (comment.trim() === "") return;
    void onReview(n, comment.trim()).then(() => {
      setReviewing(null);
      setComment("");
      setKeepOpenChapter(n);
    });
  };
  return (0, import_react13.createElement)(
    "div",
    { style: S.focus },
    // ── 卡头：问句（存量句）＋事实句（已完成章数／未处置意见数现算）──────────────────────
    (0, import_react13.createElement)(CardHead, {
      question: (0, import_react13.createElement)(
        "strong",
        { style: CARD_HEAD_QUESTION_STYLE },
        CHAPTERS_CARD_QUESTION
      ),
      facts: chaptersCardFacts(done, rows.length, pendingReviewCount)
    }),
    reviewMode ? (0, import_react13.createElement)(
      "div",
      {
        style: {
          margin: "0 0 10px",
          padding: "8px 10px",
          borderRadius: "8px",
          background: "var(--dsw-alias-state-business-tertiary)"
        }
      },
      (0, import_react13.createElement)("strong", null, "\u{1F4DA} \u5168\u90E8\u7AE0\u8282\u5199\u597D\u4E86\uFF0C\u8BF7\u4F60\u8FC7\u76EE"),
      (0, import_react13.createElement)(
        "p",
        { style: { margin: "4px 0", fontSize: "12px", opacity: 0.8 } },
        // 票 `demo-channel-full/26`：「AI 照改」对演示书是假话（用户那条只能撤回）
        // ⇒ 两取值，出口＝`view-rules.chaptersReviewLead`。
        // 票 `ui-display-redesign/08`：导语里失效旧词「看看这章」与「交工合并」同批退役。
        chaptersReviewLead(meta)
      ),
      (0, import_react13.createElement)(
        "button",
        {
          style: S.disabled(S.bigBtn(true), busy),
          onClick: onApproveAll,
          disabled: busy,
          // 票 `auto-walkthrough/04`：关键键的语义钩子（全章过目交工，六闸门之一）。
          "data-chapters-approve": "1"
        },
        CHAPTERS_APPROVE_LABEL
      )
    ) : null,
    (0, import_react13.createElement)(
      "strong",
      { style: { fontSize: "13px" } },
      "\u{1F4DA} \u5199\u5B8C\u6574\u672C\uFF1A\u7AE0\u8282\u6E05\u5355"
    ),
    (0, import_react13.createElement)(
      "p",
      { style: { margin: "4px 0 8px", fontSize: "12px", opacity: 0.75 } },
      // 票 10：①「审计」→「检查」（判定三 #8，界面一律说检查）；②判定四③ 原句 117 字压到 90 字内，
      // 删掉与全览条重复的步数解释与「与过目同一口径」这类内部口径说明，保留用户要做的事。
      // 两处并排是**两次独立票据**落在同一句话上，不是二选一：pendingExplain 解释的是
      // 紧邻其左的那个「已完成 N/M 章」为什么会倒退（票 30），contextNoteText 是一个独立计量
      // （票 28，不占状态词位）。两段各自要么是空串、要么是自带括号的一整段，串起来不会出现
      // 半截括号，也不需要第三种分隔符。
      // 票 `demo-channel-full/26`：开头那句「小助手执笔 → 小助手检查 → AI 最后把关」在演示书上
      // 三件都不成立（演示支全流程零小助手、零 AI 把关）⇒ 两个取值（后半句的「AI 照改」同
      // `chaptersReviewLead`）。两个后缀由调用方现算，⛔ 出口那一侧不碰它们。
      `${chaptersFlowLead(meta)}\u5DF2\u5B8C\u6210 ${done}/${rows.length} \u7AE0${pendingExplain}${contextNoteText}\uFF1B\u60F3\u7EC6\u770B\u70B9\u6BCF\u7AE0\u7684\u300C\u25B8 \u5C55\u5F00\u7B2C N \u7AE0\u6B63\u6587\u300D\uFF0C\u6709\u610F\u89C1\u76F4\u63A5\u5199\uFF0C${chaptersFlowOpinionClause(meta)}\u5904\u7F6E\u8FC7\u7684\u610F\u89C1\u80FD\u7FFB\u6848\u3002`
    ),
    // 票 25（走查 P20）：这一块是进度叙述的**主出口**（第 5 阶段）——同一段叙述曾经在这里
    // 与顶部横幅各出一遍，一屏渲染两遍。既定分工：叙述在主卡（就近可读）出全文，
    // 横幅只出状态词那半截（见 `panels.js` 的 `StatusStrip`）。
    // ⚠️ 不搬进折叠区、不截断、不改写原文——长叙述恰恰要就地看得见。
    progressDetail !== null && progressDetail !== void 0 && progressDetail !== "" ? (0, import_react13.createElement)(
      "div",
      {
        style: {
          margin: "0 0 8px",
          padding: "6px 10px",
          borderRadius: "8px",
          background: "var(--dsw-alias-state-business-tertiary)",
          fontSize: "12px"
        }
      },
      `\u{1F916} ${progressDetail}`
    ) : null,
    rows.map((row) => {
      const pipelineStage = (meta?.chapterPipeline ?? [])[row.n - 1]?.stage ?? null;
      const auditStale = chapterAuditIsStale(chapterSegments, row.n);
      const claimed = chapterClaims.has(row.n);
      const doneNow = chapterIsDoneAt(row.n);
      const badge = chapterBadge(
        row,
        pendingReviews,
        doneSet,
        pipelineStage,
        auditStale,
        claimed,
        serverDoneOf(row.n)
      );
      const attribution = chapterAttribution(claimed, pipelineStage);
      const open = reviewing === row.n;
      const fileMissing = !hasChapterFile(row.n);
      const chapterOpen = (reviewMode || keepOpenChapter === row.n) && openChapter === row.n;
      const rowOpinions = (pendingReviews ?? []).filter(
        (r) => Number(r.chapter) === Number(row.n) && r.kind != null && r.status !== "revoked"
      );
      const rowReviews = (pendingReviews ?? []).filter(
        (r) => Number(r.chapter) === Number(row.n)
      );
      const demoReviewsOnly = rowReviews.length > 0 && rowReviews.every((r) => r?.origin === "demo");
      const shownText = typeof chapterTextOverride === "string" && chapterTextOverride !== "" ? chapterTextOverride : chapterText;
      const sourceIndex = [
        row.source !== void 0 && row.source !== "" && row.source !== null ? `\u6E90\uFF1A${row.source}` : null,
        row.points.length > 0 ? `\u8986\u76D6\u77E5\u8BC6\u70B9 ${row.points.length} \u4E2A` : null
      ].filter(Boolean).join("\uFF0C");
      const auditFreshness = chapterAuditFreshnessText(chapterSegments, row.n);
      const wordsReading = row.wordsFloor === null && row.actualHanzi === null ? "" : [
        row.wordsFloor !== null ? `\u515C\u5E95 ${row.wordsFloor} \u6C49\u5B57` : "\u8FD9\u672C\u4E66\u6CA1\u8BBE\u515C\u5E95",
        row.actualHanzi !== null ? `\u5B9E\u9645 ${row.actualHanzi} \u6C49\u5B57` : "\u5B9E\u9645\u5B57\u6570\u8FD8\u6CA1\u91CF\u5230"
      ].join("\uFF0C");
      return (0, import_react13.createElement)(
        "div",
        {
          key: row.n,
          style: {
            margin: "6px 0",
            padding: "8px 10px",
            background: "var(--dsw-alias-bg-layer-1)",
            borderRadius: "8px",
            border: "1px solid var(--dsw-alias-border-l2)"
          }
        },
        (0, import_react13.createElement)(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap"
            }
          },
          (0, import_react13.createElement)(
            "span",
            { style: { flex: 1, fontSize: "13px", fontWeight: 600 } },
            `\u7B2C ${row.n} \u7AE0\u300A${row.title}\u300B`
          ),
          !prepared ? (
            // 「准备中」答的是**这一屏的账还没读回来**（`chapterStatus` 一个都没有），
            // 不是某一章的状态，所以它不占章徽章那一格、也不占状态词三词。
            // ⚠️ 逐字保持票 20 之前的样子（图标 ⏳ ＋ 中性色），本票只把**有账可读**那一格换成判据。
            (0, import_react13.createElement)(
              "span",
              { style: { fontSize: "12px", color: CHAPTER_NOT_READY.tone } },
              `${CHAPTER_NOT_READY.icon} \u51C6\u5907\u4E2D`
            )
          ) : (
            // 票 20：徽章**可以没有**——没人在写这一章、它也还没定稿，这一格整颗不出声
            // （不是空徽章，也不是拿「排队中」之类的说法顶上）。
            badge === null ? null : (0, import_react13.createElement)(
              "span",
              { style: { fontSize: "12px", color: badge.tone } },
              `${badge.icon} ${badge.text}`
            )
          ),
          // 票 20 · 归属栏（「谁在写这一章」，与状态分开的一栏）：认领才说话，
          // 空着就**整格不渲染**——不留占位、不写「排队中」。
          attribution === null ? null : (0, import_react13.createElement)(
            "span",
            {
              style: { fontSize: "12px", color: attribution.tone, opacity: 0.85 },
              title: "\u8FD9\u4E00\u7AE0\u6B64\u523B\u662F\u8C01\u5728\u5199"
            },
            `${attribution.icon} ${attribution.text}`
          )
        ),
        sourceIndex !== "" ? (0, import_react13.createElement)(
          "div",
          { style: { margin: "2px 0 0", fontSize: "12px", opacity: 0.6 } },
          sourceIndex
        ) : null,
        wordsReading !== "" ? (0, import_react13.createElement)(
          "div",
          { style: { margin: "2px 0 0", fontSize: "12px", opacity: 0.6 } },
          wordsReading
        ) : null,
        auditFreshness !== "" ? (0, import_react13.createElement)(
          "div",
          { style: { margin: "2px 0 0", fontSize: "12px", opacity: 0.6 } },
          auditFreshness
        ) : null,
        (0, import_react13.createElement)(
          "div",
          {
            style: {
              marginTop: "6px",
              display: "flex",
              gap: "10px",
              alignItems: "center"
            }
          },
          reviewMode ? (
            // 过目态：纯展开控件。一个热区只干一件事——只改这一章正文的可见性。
            // 文案照 spec 定的「▸ 展开第 N 章正文 / ▾ 收起」；悬浮提示补一句"不开右栏"。
            (0, import_react13.createElement)(
              "button",
              {
                style: S.disabled(S.smallLink, fileMissing),
                onClick: () => {
                  setOpenChapter(chapterOpen ? null : row.n);
                  setKeepOpenChapter(null);
                  setChapterText(null);
                  setChapterError(null);
                },
                disabled: fileMissing,
                title: fileMissing ? CHAPTER_FILE_MISSING_REASON : chapterOpen ? "\u6536\u8D77\u8FD9\u4E00\u7AE0\u6B63\u6587\uFF08\u6B63\u6587\u5C31\u5728\u8FD9\u5F20\u5361\u91CC\uFF09" : "\u5C31\u5730\u5C55\u5F00\u8FD9\u4E00\u7AE0\u6B63\u6587\uFF08\u5728\u8FD9\u5F20\u5361\u91CC\u770B\uFF0C\u4E0D\u5F00\u53F3\u680F\uFF09"
              },
              chapterOpen ? "\u25BE \u6536\u8D77" : `\u25B8 \u5C55\u5F00\u7B2C ${row.n} \u7AE0\u6B63\u6587`
            )
          ) : (
            // 非过目态：共用那颗「打开」——可见文案「<产物名> 打开」自证目的地（产物名走
            // 「产物名」词表＝「第 N 章」，与事件行行内那颗同形），点它只开右栏。
            // 票 27 · P38 ①：没定稿的章那颗「打开」**自己说清这一点**——标签加「（未定稿）」、
            // 悬浮提示说清后果（读到的东西还会被变）；**定稿的章逐字保持原样，一个字不加**。
            // ⚠️ 判据取 `doneNow`（与上面「已完成 X/Y 章」**同一份**，不另写一条）。
            // ⚠️ `fileMissing` 那一支优先级更高：文件都还没出来，谈不上定没定稿，保持原样。
            // ⚠️ `open-artifact-button.js` 的默认值一个字不动（中性件，阶段页与事件行共用）。
            (0, import_react13.createElement)(OpenArtifactButton, {
              item: { path: chapterRel(row.n) },
              onOpen: () => onView(row.n),
              label: doneNow ? `${artifactName(chapterRel(row.n))} \u6253\u5F00` : `${artifactName(chapterRel(row.n))} \u6253\u5F00${DRAFT_QUALIFIER}`,
              disabled: fileMissing,
              title: fileMissing ? CHAPTER_FILE_MISSING_REASON : doneNow ? void 0 : draftOpenTitle(artifactName(chapterRel(row.n))),
              // 这一排按钮照旧左对齐（本件默认 `marginLeft:auto` 是给产物行靠右用的）。
              // ⚠️ 票 `gold-display-period/05`：这里**不**套 `S.disabled`——`disabled` 是当 prop
              // 递给 `OpenArtifactButton` 的，置灰长在**那一件自己**身上（同一个表达式），
              // 判据认这种透传（`test/test-disabled-visual.mjs` 第 4 条）。
              style: { marginLeft: 0 }
            })
          ),
          prepared ? (0, import_react13.createElement)(
            "button",
            {
              style: S.disabled(S.smallLink, fileMissing),
              onClick: () => {
                setReviewing(open ? null : row.n);
                setComment("");
              },
              // 票 10 · P13：同一排里可点性必须一致（CONTEXT.md「热区」第 2 条）。旁边那颗「打开」
              // 对没写出来的章已经 disabled，这颗原来 13 章全 enabled——于是能给还没写出来的那一章
              // 提意见，承诺的兑现时点根本不存在（账本照收）。置灰判据与悬浮提示都与「打开」同源。
              disabled: fileMissing,
              title: fileMissing ? "\u8FD9\u4E00\u7AE0\u8FD8\u6CA1\u5199\u51FA\u6765\uFF08\u6216\u6587\u4EF6\u6539\u540D\u4E86\uFF09\uFF0C\u6682\u65F6\u63D0\u4E0D\u4E86\u610F\u89C1" : open ? "\u6536\u8D77\u8FD9\u4E00\u7AE0\u7684\u610F\u89C1\u8F93\u5165\u6846" : reviewWriteHint(meta)
            },
            open ? "\u6536\u8D77" : CHAPTERS_REVIEW_LABEL
          ) : null,
          // 票 `ui-systematic-fixes/11` 的第二件：**灰键的理由写在脸上**。
          // 这一排三颗键（展开／打开／写意见）判据同一个 `fileMissing`，而此前理由只活在
          // `title` 属性里——触屏点不出悬停、键盘也读不到（`inv-decisions.md` §2 的档三）。
          // 纯文字、⛔ 不是热区、⛔ 不加新键、⛔ 不改那三颗键的任何一行字。
          fileMissing ? (0, import_react13.createElement)(
            "span",
            { style: { fontSize: "12px", opacity: 0.75 } },
            CHAPTER_FILE_MISSING_REASON
          ) : null
        ),
        // 票 10：该章的意见就在「写意见」这一区下面逐条列出来。未处置的（正拦着这章交工）
        // 照旧显示、并给「撤回」；已处置的显示「已处置 · <how>」+ 同行「翻案」；
        // 已撤回的显示「已撤回」（票 09 统一措辞，正名取 `rules.js` 的 `REVIEW_REVOKED_TEXT`）。
        rowReviews.length > 0 ? (0, import_react13.createElement)(
          "div",
          {
            style: {
              marginTop: "6px",
              paddingTop: "4px",
              borderTop: "1px dashed var(--dsw-alias-border-l2)"
            }
          },
          (0, import_react13.createElement)(
            "p",
            {
              style: {
                margin: "0 0 2px",
                fontSize: "12px",
                opacity: 0.6
              }
            },
            demoReviewsOnly ? "\u6F14\u793A\u901A\u9053\u81EA\u5E26\u7684\u793A\u4F8B\u610F\u89C1\uFF08\u4E0D\u662F\u4F60\u63D0\u7684\uFF09\uFF1A" : "\u4F60\u5728\u8FD9\u4E00\u7AE0\u63D0\u7684\u610F\u89C1\uFF1A"
          ),
          ...rowReviews.map(
            (review, index) => (0, import_react13.createElement)(ChapterReviewLine, {
              key: typeof review.id === "string" && review.id !== "" ? review.id : `review-${row.n}-${index}`,
              review,
              busy,
              progressText: reviewProgress.get(row.n) ?? null,
              onRevoke: (key, review2) => {
                if (key === "pending") {
                  void postAction({
                    action: "gold-opinion-revoke",
                    id: review2.id
                  });
                  return;
                }
                void postAction({
                  action: "review-revoke",
                  reviewId: review2.id
                });
              }
            })
          )
        ) : null,
        open ? (0, import_react13.createElement)(
          "div",
          { style: { marginTop: "6px" } },
          (0, import_react13.createElement)("textarea", {
            style: S.textarea,
            placeholder: "\u4F60\u5BF9\u8FD9\u7AE0\u7684\u610F\u89C1\uFF08\u6BD4\u5982\uFF1A\u4F8B\u5B50\u592A\u96BE\u3001\u591A\u7ED9\u51E0\u9053\u7EC3\u4E60\u3001\u98CE\u683C\u6362\u6210\u66F4\u53E3\u8BED\uFF09",
            value: comment,
            onChange: (e) => setComment(e.target.value)
          }),
          (0, import_react13.createElement)(
            "button",
            {
              style: S.disabled({ ...S.bigBtn(true), padding: "6px 14px" }, busy || comment.trim() === ""),
              onClick: () => sendReview(row.n),
              disabled: busy || comment.trim() === ""
            },
            "\u628A\u610F\u89C1\u4EA4\u7ED9 AI \u4FEE\u8BA2"
          )
        ) : null,
        // F39：过目态内联展开——章正文 md 渲染（GoldReader 的段落流式排版 + renderInline），
        // 段落旁复用 GoldReader 段级三键（😕/🗑/✏️），意见走 gold-opinion 带 chapter 落 pendingReviews。
        chapterOpen ? (0, import_react13.createElement)(
          "div",
          {
            style: {
              marginTop: "8px",
              borderTop: "1px dashed var(--dsw-alias-border-l2)",
              paddingTop: "8px"
            }
          },
          chapterError !== null ? (0, import_react13.createElement)(
            "p",
            { style: S.error },
            `\u6253\u5F00\u5931\u8D25\uFF1A${chapterError}`
          ) : shownText === null ? (0, import_react13.createElement)("p", { style: S.hint }, "\u52A0\u8F7D\u4E2D\u2026") : (0, import_react13.createElement)(
            "div",
            null,
            (0, import_react13.createElement)(
              "div",
              {
                style: {
                  margin: "0 0 6px",
                  fontSize: "12px",
                  opacity: 0.75,
                  display: "flex",
                  alignItems: "baseline",
                  gap: "8px",
                  flexWrap: "wrap"
                }
              },
              `\u7B2C ${row.n} \u7AE0\u6B63\u6587\uFF08\u9F20\u6807\u505C\u5728\u54EA\u4E00\u6BB5\uFF0C\u90A3\u6BB5\u53F3\u4FA7\u4EAE\u51FA \u{1F615}\u{1F5D1}\u270F\uFE0F \u63D0\u610F\u89C1\uFF09\uFF1A`,
              // 票 30①：被钉住的那一章此刻不是过目态，卡片上那颗按钮已经是「打开」
              // （它只开右栏），于是**收起**这条路上没有控件了。补这一颗：
              // 身份＝纯展开收起，不发动作、不开右栏，与「打开」各干一件事。
              !reviewMode ? (0, import_react13.createElement)(
                "button",
                {
                  style: S.disabled(S.smallLink, fileMissing),
                  onClick: () => {
                    setOpenChapter(null);
                    setKeepOpenChapter(null);
                    setChapterText(null);
                    setChapterError(null);
                  },
                  disabled: fileMissing,
                  title: "\u6536\u8D77\u8FD9\u4E00\u7AE0\u6B63\u6587\uFF08\u6B63\u6587\u5C31\u5728\u8FD9\u5F20\u5361\u91CC\uFF09"
                },
                "\u25BE \u6536\u8D77\u8FD9\u4E00\u7AE0\u6B63\u6587"
              ) : null
            ),
            (0, import_react13.createElement)(GoldReader, {
              text: shownText,
              opinions: rowOpinions,
              busy,
              // 票 `demo-channel-full/25`：段落三键确认层那句话的取值要认得出演示书
              // （`view-rules.paraMarkConfirmNote(meta)`）；本卡手上的就是这一份 `meta`。
              meta,
              onOpinion: (kind, wish, para, hint) => {
                setKeepOpenChapter(row.n);
                void postAction({
                  action: "gold-opinion",
                  kind,
                  wish,
                  ...para !== null ? { para } : {},
                  ...hint ? { hint } : {},
                  chapter: row.n
                });
              },
              onRevokeOpinion: (id) => {
                void postAction({
                  action: "gold-opinion-revoke",
                  id
                });
              }
            })
          )
        ) : null
      );
    }),
    // ── ⑩存档说明〔折〕：长承诺句默认收成一行，展开体仍是原来的那句话（一字不改）──────
    (0, import_react13.createElement)(
      "details",
      { style: { margin: "8px 0 0" } },
      (0, import_react13.createElement)(
        "summary",
        { style: { cursor: "pointer", fontSize: "12px", opacity: 0.7 } },
        CHAPTERS_FOOTER_FOLD_SUMMARY
      ),
      (0, import_react13.createElement)(
        "p",
        { style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.7 } },
        // 票 14（承诺账 B，来源票 15-Q2 的裁决）：这里原来只能说「关键节点自动存档」＋「最近一次存档」，
        // 因为全仓 `writeSnapshot(` 只有四个写点（阶段交办 / 每关首次与修订提案 / 回退前），
        // **没有「每章」写点**；reason 也不是拍板点（阶段交办类写的是「交办「写完整本」之前」）。
        // 票 05 / P36（2026-09-27 用户拍板「逐章交工各存一次」）：逐章交工成功路径补上了第五个写点
        // （`chapters.js` 的 `writeSnapshot(project, '交工「第 N 章《标题》」之后')`），于是「最近一次存档」
        // 在写完整本那段时间里**不再停在整段之前**，而是停在上一章交完的地方——这句承诺因此第一次说得准，
        // 也照票面记档把「随时能回到最近一次存档」原样留着（密度已修好，不再欠账）。
        // 🚫 不在这句里加「最近一次存档：xx 时间」：用户 2026-09-27 明确**没选**显示存档时间与数量。
        //
        // 票 `demo-channel-full/22`：这一句的**两个取值**（真书／演示书）收进
        // `view-rules.chaptersFooterNote`——原句对演示书不成立（那个文件里逐条写着读数出处），
        // ⛔ 本文件不自己拼措辞。它在屏上的那一帧就是**本卡**（`demo-phase-5`）。
        // 票 `ui-display-redesign/08`：这句话**默认折**（块序 ⑩），展开体照旧。
        chaptersFooterNote(meta)
      )
    ),
    // ── ⑪0 章空态：补一句人话，不再只有「已完成 0/0 章」那格计数──────────────────────
    rows.length === 0 ? (0, import_react13.createElement)(
      "p",
      { style: { margin: "8px 0 0", fontSize: "12px", opacity: 0.8 } },
      CHAPTERS_EMPTY_NOTE
    ) : null
  );
}
function stepStyle(isViewed, state) {
  return {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "5px 8px",
    margin: "2px 0",
    fontSize: "12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontFamily: "inherit",
    color: "inherit",
    // 「你正在看这一步」优先于状态底色：否则一个 waiting-user 行的金边会盖掉回看高亮
    // （第 4 轮原型实测抓到的排序 bug，别改回去）。
    background: isViewed ? "var(--dsw-alias-state-business-tertiary)" : state === "active" ? "var(--dsw-alias-bg-layer-1)" : state === "waiting-user" ? "var(--dsw-alias-state-warn-tertiary)" : "transparent",
    opacity: state === "pending" ? 0.45 : state === "done" ? 0.75 : 1,
    border: isViewed ? "1px solid var(--dsw-alias-label-primary)" : state === "waiting-user" ? "1px solid var(--dsw-alias-state-warn-secondary)" : "1px solid transparent"
  };
}
function GroupHead(props) {
  return (0, import_react13.createElement)(
    "p",
    {
      style: {
        margin: "2px 0 3px",
        fontSize: "12px",
        fontWeight: 700,
        opacity: 0.55,
        letterSpacing: "0.02em"
      }
    },
    Number.isInteger(props.phase) ? `\u7B2C ${props.phase} \u9636\u6BB5\uFF1A${PHASE_UI[props.phase] ?? ""}` : (
      // 阶段号认不出的分段（旧 payload 连 kind 都没有）：模型把它们挂在末尾、
      // `phase` 为 null——**不静默丢**，给一个说得出口的组名（票 04）。
      "\u9636\u6BB5\u5F85\u5B9A"
    )
  );
}
function StepList(props) {
  const { groups, browsingKey, onPickStep, onPickPhase } = props;
  const list = Array.isArray(groups) ? groups : [];
  return (0, import_react13.createElement)(
    "div",
    null,
    ...list.map(
      (group) => (0, import_react13.createElement)(
        "div",
        { key: `g-${group.phase ?? "other"}`, style: { marginBottom: "6px" } },
        (0, import_react13.createElement)(GroupHead, { phase: group.phase }),
        ...group.rows.map(
          (row) => (0, import_react13.createElement)(
            "button",
            {
              key: row.key,
              // 全览条只在"现在"那一屏渲染，点任何一行立刻换屏，所以这一圈高亮其实看不到；
              // 仍按「正在看的那一步」算（`browsing` 就是步 key，票 04）。
              style: stepStyle(browsingKey !== null && browsingKey === row.key, row.status),
              // 行自带 `target`（候选 06）：`step` 目标交**步 key**（阶段页自己认得出焦点
              // 落在哪一步；工作台焦点也从步反查阶段）；`phase` 目标（材料准备＝第一步、旧
              // payload 补出来的章步）走 `onPickPhase`——落到那一阶段的清单页，**不是**
              // 浏览态（票 04 明写）。UI 不再看 `segmentKey` / `MATERIAL_STEP_KEY`。
              onClick: () => row.target?.kind === "step" ? onPickStep?.(row.target.ref) : onPickPhase?.(row.target?.phase ?? row.phase),
              title: row.statusWord
            },
            row.rowText,
            ...(row.detailLines ?? []).map(
              (line, index) => (0, import_react13.createElement)(
                "span",
                {
                  key: `detail-${index}`,
                  style: {
                    display: "block",
                    marginTop: "2px",
                    fontSize: "12px",
                    lineHeight: "1.35",
                    fontWeight: "normal",
                    opacity: 0.72
                  }
                },
                line
              )
            )
          )
        )
      )
    )
  );
}
var progressOverviewView = defineCardView({
  card: "ProgressOverview",
  fromBook: ["projector", "browsingKey", "onPickStep", "onPickPhase"],
  // `projector` 在**每次渲染**都被无条件调用（`project({kind:"overview"})`）——缺了它不是
  // 「点一下没反应」，是这张卡当场渲不出来。所以它是必填。
  // ⚠️ 反过来 `onPickStep` / `onPickPhase` **不列必填**：卡内是 `onPickStep?.(…)` 的可选调用
  // （清单行点不动时的合法状态），声明成必填等于把一件合法的事写成接线事故。
  required: ["projector"],
  defaults: {
    // 「没在回看任何一步」是**显式的 null**，不是「键不存在」：`StepList` 的高亮判据
    // （`:1073`）是 `browsingKey !== null && browsingKey === row.key`，
    // 那个 `!== null` 写的就是这一格。
    browsingKey: null
  }
});
function ProgressOverview(props) {
  const [open, setOpen] = (0, import_react13.useState)(false);
  const { projector, browsingKey, onPickStep, onPickPhase } = props;
  const overview = projector.project({ kind: "overview" });
  return (0, import_react13.createElement)(
    "div",
    { style: { marginBottom: "10px" } },
    (0, import_react13.createElement)(
      "div",
      {
        style: {
          border: "1px solid var(--dsw-alias-border-l2)",
          borderRadius: "10px",
          padding: "8px 10px",
          background: "var(--dsw-alias-bg-base)"
        }
      },
      (0, import_react13.createElement)(
        "div",
        { style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } },
        (0, import_react13.createElement)("strong", { style: { fontSize: "13px" } }, `\u{1F5FA} ${overview.headline}`),
        (0, import_react13.createElement)(
          "span",
          { style: { fontSize: "12px", opacity: 0.65 } },
          overview.currentPhaseText
        ),
        (0, import_react13.createElement)(
          "button",
          {
            style: { ...S.smallLink, marginLeft: "auto" },
            onClick: () => setOpen((v) => !v)
          },
          open ? "\u6536\u8D77\u6E05\u5355" : "\u5C55\u5F00\u6E05\u5355"
        )
      )
    ),
    open ? (0, import_react13.createElement)(
      "div",
      {
        style: {
          marginTop: "6px",
          border: "1px solid var(--dsw-alias-border-l2)",
          borderRadius: "10px",
          padding: "10px 12px",
          background: "var(--dsw-alias-bg-base)",
          boxShadow: "0 10px 28px rgba(0,0,0,.16)",
          maxHeight: "46vh",
          overflowY: "auto",
          // 两栏：18 行一栏太长，两栏一屏装得下，也不至于铺满整页。
          columns: "2",
          columnGap: "18px"
        }
      },
      (0, import_react13.createElement)(StepList, {
        groups: overview.groups,
        browsingKey,
        onPickStep,
        onPickPhase
      })
    ) : null
  );
}
var NARROW_MAIN_WIDTH = 700;
var SIDEBAR_OPEN_RIGHT_GAP = 64;
var NARROW_MAIN_HINT_TEXT = "\u{1F449} \u6B63\u6587\u533A\u592A\u7A84\u4E86\u3002\u70B9\u9876\u680F\u90A3\u9897\u300C\u6536\u8D77\u53F3\u4FA7\u8FB9\u680F\u300D\uFF08\u6536\u8D77\u53F3\u680F\uFF09\uFF0C\u8FD9\u91CC\u80FD\u5BBD\u4E00\u500D\uFF0C\u6B63\u6587\u884C\u4E5F\u4E0D\u4F1A\u592A\u957F\u3002";
function narrowMainHintShown(mainWidth, mainRightGap) {
  if (!Number.isFinite(mainWidth) || mainWidth <= 0) return false;
  if (!Number.isFinite(mainRightGap) || mainRightGap < SIDEBAR_OPEN_RIGHT_GAP) return false;
  return mainWidth < NARROW_MAIN_WIDTH;
}
function NarrowMainHint(props) {
  const { mainWidth, mainRightGap } = props ?? {};
  if (!narrowMainHintShown(mainWidth, mainRightGap)) return null;
  return (0, import_react13.createElement)(
    "p",
    {
      style: {
        margin: "0 0 8px",
        padding: "6px 10px",
        fontSize: "12px",
        lineHeight: "1.5",
        borderRadius: "8px",
        border: "1px solid var(--dsw-alias-border-l2)",
        background: "var(--dsw-alias-bg-base)",
        opacity: 0.85
      }
    },
    NARROW_MAIN_HINT_TEXT
  );
}
function footerProgressWord(status) {
  if (typeof status !== "string" || status === "") return null;
  return statusHuman({ status }, null).word;
}
function FocusFooter(props) {
  const { status, onDelete, deleting, busy, bookDir, onCancelDelete, onOpenProcessLog } = props;
  const progressWord = footerProgressWord(status);
  return (0, import_react13.createElement)(
    "div",
    {
      style: {
        marginTop: "10px",
        paddingTop: "8px",
        borderTop: "1px solid var(--dsw-alias-border-l2)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
        fontSize: "12px"
      }
    },
    progressWord === null ? null : (0, import_react13.createElement)(
      "span",
      { style: { opacity: 0.55 } },
      `\u4E66\u7684\u8FDB\u5EA6\uFF1A${progressWord}`
    ),
    bookDir !== null && bookDir !== void 0 ? (0, import_react13.createElement)(
      "span",
      { style: { opacity: 0.55, wordBreak: "break-all" } },
      `\u{1F4C1} ${bookDir}`
    ) : null,
    (0, import_react13.createElement)("span", { style: { flex: 1 } }),
    // 票 workbench-transitions/24（ADR-0015 决策 2）：《过程记录.md》判成「有正文的产物」，
    // 入口摆在这条**常驻小条**上——它是全局产物、不属任何一步，所以不进任何一步的文件清单。
    // 走父级给的同一个打开回调（→ DSH 右栏预览、只读），小条因此从「状态 + 危险操作」
    // 变成「状态 + 只读入口 + 危险操作」，这代价 ADR-0015 有意接受。
    typeof onOpenProcessLog === "function" ? (0, import_react13.createElement)(
      "button",
      {
        style: { ...S.smallLink, fontSize: "12px", opacity: 0.55 },
        onClick: onOpenProcessLog,
        title: "\u5728\u53F3\u680F\u67E5\u770B\u300C\u8FC7\u7A0B\u8BB0\u5F55\u300D\uFF08\u8FD9\u4E00\u672C\u4E66\u4ECE\u5EFA\u6863\u5230\u73B0\u5728\u7684\u6D41\u6C34\u8D26\uFF0C\u53EA\u8BFB\uFF09"
      },
      "\u8FC7\u7A0B\u8BB0\u5F55"
    ) : null,
    typeof onDelete === "function" ? (0, import_react13.createElement)(
      "button",
      {
        style: S.disabled({
          ...S.smallLink,
          fontSize: "12px",
          opacity: deleting === true ? 1 : 0.5,
          ...deleting === true ? { color: "var(--dsw-alias-state-error-primary)" } : {}
        }, busy === true),
        onClick: onDelete,
        disabled: busy === true,
        title: "\u628A\u8FD9\u672C\u4E66\u79FB\u8FDB\u56DE\u6536\u7AD9"
      },
      deleting === true ? "\u786E\u8BA4\u53D6\u6D88\u8FD9\u672C\u4E66\uFF08\u8FDB\u56DE\u6536\u7AD9\uFF09" : "\u53D6\u6D88\u8FD9\u672C\u4E66"
    ) : null,
    // 票 12：确认态的退路（见组件顶部说明）。只在确认态出现、且父级给了回调才渲染；
    // 它只改本地确认态、**不发任何动作**（破坏性动作仍然只有确认那颗发）。
    // 🎯 票 `gold-display-period/05`：正因为这句「只改本地确认态、不发任何动作」，它**不许禁用**
    // （#2 的逐处复核：`busy` 里挡住一条退路 ＝ 造一个「看着能点却点不动」的键）。
    deleting === true && typeof onCancelDelete === "function" ? (0, import_react13.createElement)(
      "button",
      {
        style: {
          ...S.smallLink,
          fontSize: "12px",
          opacity: 0.6
        },
        onClick: onCancelDelete,
        title: "\u5148\u4E0D\u5220\uFF0C\u56DE\u5230\u4E0A\u4E00\u6B65"
      },
      "\u7B97\u4E86"
    ) : null
  );
}
function SocratopiaAd() {
  const [copied, setCopied] = (0, import_react13.useState)(false);
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
        done();
      }
    };
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText !== void 0) {
      navigator.clipboard.writeText(code).then(done, fallback);
    } else {
      fallback();
    }
  };
  return (0, import_react13.createElement)(
    "a",
    {
      href: "https://www.socratopia.app/r/SCR-FEJXMQ",
      target: "_blank",
      rel: "noopener noreferrer",
      // 焦点区的兄弟节点：固定在它下面（对话台上面），不参与滚动流、不浮动。
      style: {
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
        padding: "7px 14px",
        background: "linear-gradient(135deg, #4f6ef7 0%, #7a5cff 55%, #c04df7 100%)",
        color: "#ffffff",
        fontSize: "12px",
        lineHeight: 1.5,
        textDecoration: "none",
        borderTop: "1px solid rgba(255, 255, 255, 0.25)"
      }
    },
    (0, import_react13.createElement)("span", { style: { fontSize: "13px" } }, "\u{1F4DA}"),
    (0, import_react13.createElement)("strong", { style: { fontSize: "12px" } }, "\u3010\u7EBF\u56E2\u9020\u4E66\u5DE5\u4F5C\u53F0\u3011"),
    (0, import_react13.createElement)("span", null, "\u662F"),
    (0, import_react13.createElement)("span", { style: { fontWeight: 600 } }, "\u3010\u7834\u5377\u3011"),
    (0, import_react13.createElement)(
      "span",
      {
        style: {
          fontSize: "12px",
          background: "rgba(255,255,255,0.22)",
          borderRadius: "4px",
          padding: "0 5px",
          lineHeight: "15px"
        }
      },
      "\u884D\u751F\u9879\u76EE"
    ),
    (0, import_react13.createElement)(
      "span",
      { style: { marginLeft: "auto", fontSize: "12px" } },
      "\u586B\u9080\u8BF7\u7801 ",
      (0, import_react13.createElement)(
        "span",
        {
          onClick: (e) => copyInvite(e, "SCR-FEJXMQ"),
          title: copied ? "\u5DF2\u590D\u5236" : "\u70B9\u51FB\u590D\u5236\u9080\u8BF7\u7801",
          style: {
            background: "rgba(255,255,255,0.28)",
            borderRadius: "5px",
            padding: "1px 6px",
            letterSpacing: "0.5px",
            cursor: "pointer",
            userSelect: "all"
          }
        },
        copied ? "\u2713 \u5DF2\u590D\u5236" : "SCR-FEJXMQ"
      ),
      " \u9886 100 \u4E07 tokens \u2192"
    )
  );
}

// src/ui/view-rules.js
var PHASE_UI = PHASE_UI_SOURCE;
var phaseUi = (n) => PHASE_UI[n] ?? "";
function phaseChipTitlePrefix(label) {
  return `\u53BB\u300C${label}\u300D`;
}
var STAGE_HUMAN = {
  explore: "\u8BFB\u6750\u6599\u6311\u91CD\u70B9",
  gate: "\u62CD\u677F\u5B9A\u65B9\u6848",
  outline: "\u7AE0\u8282\u5B89\u6392",
  gold: "\u6700\u4F73\u8303\u4F8B\u7AE0",
  chapters: "\u5199\u5B8C\u6574\u672C",
  merge: "\u5408\u5E76\u6210\u4E66",
  final: "\u6700\u540E\u68C0\u67E5"
};
var stageHuman = (stage) => {
  const key = typeof stage === "string" ? stage : "";
  return STAGE_HUMAN[key] ?? (key === "" ? "" : key);
};
var EVENT_UI = {
  "textbook/gate-proposal": "\u62CD\u677F\u65B9\u6848",
  "textbook/gate-decision": "\u62CD\u677F\u7ED3\u679C",
  "textbook/quality": "\u673A\u5668\u68C0\u67E5",
  "textbook/gold-opinion": "\u6700\u4F73\u8303\u4F8B\u7AE0\u610F\u89C1",
  "textbook/gold-seal": "\u6700\u4F73\u8303\u4F8B\u7AE0\u5B9A\u7A3F",
  "textbook/gold-chapter": "\u6700\u4F73\u8303\u4F8B\u7AE0",
  "textbook/final-approve": "\u6700\u540E\u68C0\u67E5\u8BA4\u53EF",
  // 票 10（判定三 #10）：服务端 EVENT_META 的 label 是「AI 自查报告」——「自查」是机器视角
  // （谁查谁？），界面一律说「检查」。这条覆盖让兜底分支也走同一份词。
  "textbook/ai-report": "AI \u68C0\u67E5\u62A5\u544A"
};
var eventHuman = (type, fallback) => EVENT_UI[type] ?? fallback ?? "";
var CHECK_UI = {
  "\u6210\u54C1\u6587\u4EF6\u9F50\u5168": "\u6574\u672C\u4E66\u6587\u4EF6\u9F50\u5168",
  // 票 `audit-state-regression/01`：机器名「所有章节都有审计记录」不改（`CONTEXT.md` 判定线：
  // 机器检查 `name` 是机器身份词），改的是它背后那条判据——从「有检查记录」变成「有且不过期」。
  // 界面词跟着判据说全：只说「都有」会漏掉「旧稿」那一半。
  "\u6240\u6709\u7AE0\u8282\u90FD\u6709\u5BA1\u8BA1\u8BB0\u5F55": "\u6BCF\u7AE0\u7684\u68C0\u67E5\u8BB0\u5F55\u90FD\u5728\u4E14\u4E0D\u8FC7\u671F",
  // ⚠️ 票 06 收口（2026-10-08）订正：这一格的键原来是「没有遗留的 AI 笔记/脚手架」——
  // `engine.js` 在票 20 把那条 check 的 `name` 改成了「没有遗留的通用脚手架标记」，这张表的键
  // 没跟着改，于是 `checkHuman` 认不出它、**屏上原样印机器名**（键必须是服务端 `name`，
  // 见本表上面那段注释）。值一个字没动。
  "\u6CA1\u6709\u9057\u7559\u7684\u901A\u7528\u811A\u624B\u67B6\u6807\u8BB0": "\u6CA1\u6709\u7559\u4E0B AI \u7684\u8349\u7A3F\u75D5\u8FF9",
  "\u7EC3\u4E60\u4E0E\u7B54\u6848\u9F50\u5168": "\u7EC3\u4E60\u548C\u7B54\u6848\u90FD\u5728",
  // 票 `chapter-teaching-handbook/03`：章交工验里的章末带读手册三条（G1′／G2′／G3′）。
  // ⚠️ 它们**不在** `QUALITY_CHECKS_TAIL_NAMES`（那一份是 `runQualityChecks` 尾段的项名）；
  // 三条只住在章交工验，⛔ 不挂终检。界面词按判据写实：只判形状与在场，不判教得好不好。
  "\u7AE0\u672B\u6559\u5B66\u533A\u5728\u573A\u4E14\u4F4D\u7F6E\u4E00\u81F4": "\u6BCF\u7AE0\u90FD\u6709\u7AE0\u672B\u6559\u5B66\u533A\uFF0C\u4F4D\u7F6E\u548C\u5199\u4F5C\u89C4\u8303\u8BF4\u7684\u4E00\u81F4",
  "\u5E26\u8BFB\u624B\u518C\u5F62\u6001\u9F50\u5168": "\u7AE0\u672B\u5E26\u8BFB\u624B\u518C\u7684\u5757\u90FD\u5728",
  "\u6B63\u6587\u6CA1\u6709\u677F\u5757\u8868\u5916\u7684\u5757\u5934": "\u6B63\u6587\u6CA1\u6709\u88AB\u5199\u6210\u8868\u5355",
  "\u4E0E\u5DF2\u62CD\u677F\u7684\u8BBE\u8BA1\u4E00\u81F4": "\u548C\u4F60\u8BF4\u5B9A\u7684\u8BBE\u8BA1\u4E00\u81F4",
  // ⚠️ 票 14（承诺账 E）：这两条白话名原来把机制说大了——
  //   「源材料引用可追溯」的机器判据只是 `sourceCount > 0`（用上了至少一份材料），不验任何一处内容；
  //   「进度账本齐全」只验 `工作区/progress.md` 存在，不验「每一步」都有行。
  // 名字即承诺，所以按机制收（收名，不动服务端判据）。
  "\u6E90\u6750\u6599\u5F15\u7528\u53EF\u8FFD\u6EAF": "\u7528\u4E0A\u4E86\u4F60\u4E0A\u4F20\u7684\u6750\u6599",
  "\u98CE\u683C\u7EBF\u6761\u6761\u6709\u7740\u843D": "\u4F60\u63D0\u7684\u98CE\u683C\u8981\u6C42\u90FD\u5904\u7406\u4E86",
  "\u8FDB\u5EA6\u8D26\u672C\u9F50\u5168": "\u6709\u5DE5\u4F5C\u8BB0\u5F55\u53EF\u67E5",
  "\u6210\u54C1\u65E0\u4E71\u7801\uFF08U+FFFD\uFF09": "\u6CA1\u6709\u4E71\u7801",
  "\u7AE0\u8282\u6570\u7B26\u5408\u5927\u7EB2": "\u7AE0\u8282\u6570\u548C\u8BF4\u597D\u7684\u4E00\u81F4",
  // 票 `walkthrough-fixes/36`：机器判据是「成品逐字等于各章正文拼出来的那一份」。界面词按机制写实
  // （不说「没有手抄痕迹」那种猜测），点名第几章不一致那一半由服务端 note 承担。
  "\u6210\u54C1\u4E0E\u5404\u7AE0\u6B63\u6587\u4E00\u81F4": "\u6210\u54C1\u548C\u6BCF\u7AE0\u6B63\u6587\u5BF9\u5F97\u4E0A",
  // 票 `exclusion-flow/03`（F3）：机器判据只是「那一串 title 在不在成品里」（同一份规范化），
  // ⛔ 不证「这一段真的在讲它」——所以界面词按机制写实：说「没有你不让写的那几条」，
  // 不说「没有越界内容」那种猜语义的话；点名第几章、哪一条由服务端 note 承担。
  "\u6210\u54C1\u91CC\u6CA1\u6709\u5DF2\u5212\u6389\u7684\u77E5\u8BC6\u70B9": "\u6210\u54C1\u91CC\u6CA1\u6709\u4F60\u5212\u6389\u7684\u77E5\u8BC6\u70B9",
  "\u5FC5\u542B\u677F\u5757\u9F50\u5168\uFF08\u5951\u7EA6\u9879\uFF09": "\u8BE5\u6709\u7684\u677F\u5757\u90FD\u5728",
  "\u65E0\u7981\u7528\u8BCD\uFF08\u5951\u7EA6\u9879\uFF09": "\u6CA1\u6709\u51FA\u73B0\u4E0D\u8BE5\u7528\u7684\u8BCD",
  // ⚠️ 票 `pre-gold-build/16` 补的三条（键＝服务端 `name` 逐字，见 `domain-rules.js` 的
  // `QUALITY_CHECKS_TAIL_NAMES`）：界面词按机制写实——「八类」在机器那一侧是 6 类硬查、
  // 2 类只提示，所以界面词只说「造书的草稿痕迹」这个用户看得懂的结果，不承诺「八类都查了」。
  "\u62C6\u811A\u624B\u67B6\u516B\u7C7B\u6B8B\u7559": "\u6CA1\u6709\u7559\u4E0B\u9020\u4E66\u7684\u8349\u7A3F\u75D5\u8FF9",
  "\u6B63\u6587\u65E0\u5143\u6307\u4EE4\u6B8B\u7559\uFF08human-readable\uFF09": "\u6B63\u6587\u91CC\u6CA1\u6709\u7ED9\u673A\u5668\u770B\u7684\u6307\u4EE4\u5757",
  "\u7AE0\u8282\u5F15\u7528\u53EF\u8FFD\u6EAF\uFF08\u65E0\u5F15\u7528\u77DB\u76FE\uFF09": "\u6BCF\u7AE0\u6807\u7684\u6750\u6599\u51FA\u5904\u90FD\u771F\u5B9E\u5B58\u5728",
  "\u4EA4\u53C9\u5F15\u7528\u6307\u5411\u771F\u5B9E\u5B58\u5728\u7684\u7AE0": "\u6B63\u6587\u91CC\u63D0\u5230\u7684\u7AE0\u90FD\u771F\u7684\u5B58\u5728",
  // 2026-09-30 诊断后按判据写实：这一项现在只查**同一章内**的小节标题重名（跨章同名多半是
  // 每章都有的板块名，只提示不拦，见 ADR-0008 修订 2026-09-30）；章名唯一性单独立下一条。
  "\u65E0\u91CD\u590D\u6807\u9898": "\u540C\u4E00\u7AE0\u91CC\u6CA1\u6709\u91CD\u540D\u7684\u5C0F\u8282",
  "\u7AE0\u540D\u5168\u4E66\u552F\u4E00": "\u6BCF\u7AE0\u7684\u7AE0\u540D\u5728\u5168\u4E66\u4E2D\u90FD\u4E0D\u4E00\u6837",
  // 票 `word-budget-ineffective/02`：字数兜底（低于不过、超过不限）——界面词不承诺上限。
  "\u5B57\u6570\u515C\u5E95\u8BFB\u6570": "\u6BCF\u7AE0\u7684\u515C\u5E95\u5B57\u6570\u4E0E\u5B9E\u9645\u5B57\u6570",
  // 票 `flow-audit-2026-10/01`：演示书在认可交付那一跳按登记豁免不重跑硬检查；交付账上那一行
  // 是**显式的「未检查」**（不是通过）。界面词说清楚它是什么。
  "\u8BA4\u53EF\u4EA4\u4ED8\u5F53\u573A\u91CD\u8DD1": "\u4EA4\u4ED8\u65F6\u91CD\u8DD1\u673A\u5668\u68C0\u67E5"
};
var checkHuman = (name) => fallbackWord(CHECK_UI, name, FALLBACK_FREE);
function demoQualityChecksNote(checksShown) {
  const shown = Array.isArray(checksShown) ? checksShown : [];
  const ran = new Set(shown.map((check) => check?.name).filter((name) => typeof name === "string"));
  const notRun = QUALITY_CHECKS_TAIL_NAMES.filter((name) => !ran.has(name));
  const tail = notRun.map((name) => checkHuman(name)).join("\uFF0F");
  return `\u6F14\u793A\u6A21\u5F0F\uFF1A\u8FD9\u4E00\u5C4F\u5217\u4E86 ${shown.length} \u9879\u673A\u5668\u68C0\u67E5\u3002` + (notRun.length === 0 ? "\u771F\u4E66\u4E0A\u8FD9\u91CC\u8981\u8DD1\u7684\u9879\u8FD9\u4E00\u5C4F\u90FD\u8DD1\u4E86\u3002" : `\u771F\u4E66\u4E0A\u8FD9\u91CC\u8FD8\u4F1A\u8DD1\u300C${tail}\u300D\u8FD9\u4E9B\u9879\u3002`);
}
var isDemoBook = (meta) => meta?.demo === true;
function lastEventOfType(events, type) {
  const list = events ?? [];
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (list[i]?.type === type) return list[i];
  }
  return void 0;
}
function goldDraftDisplayed(meta, pendingStage) {
  return meta?.status === "awaiting-gold" && pendingStage === "gold";
}
var pausedNow = (meta) => meta?.pause != null;
var TURN_WORD = "\u8F6E\u5230\u4F60";
var BUSY_WORD = "\u6211\u6B63\u5728\u505A";
var READY_NEXT_ACTION = "\u51C6\u5907\u4E0B\u4E00\u6B65";
var deliveredAction = (meta) => `\u53EF\u4EE5\u9884\u89C8\u548C\u4E0B\u8F7D\u300A${meta?.name ?? ""}\u300B.md`;
var STATUS_HUMAN = Object.freeze({
  active: Object.freeze({ word: BUSY_WORD, tone: "ai", kind: "busy" }),
  running: Object.freeze({ word: BUSY_WORD, tone: "ai", kind: "busy" }),
  "awaiting-explore": Object.freeze({ word: TURN_WORD, tone: "you", kind: "turn" }),
  "awaiting-outline": Object.freeze({ word: TURN_WORD, tone: "you", kind: "turn" }),
  "awaiting-gold": Object.freeze({ word: TURN_WORD, tone: "you", kind: "turn" }),
  "awaiting-chapters-review": Object.freeze({ word: TURN_WORD, tone: "you", kind: "turn" }),
  "awaiting-final-approval": Object.freeze({ word: TURN_WORD, tone: "you", kind: "turn" }),
  delivered: Object.freeze({ word: "\u4E66\u505A\u597D\u4E86", tone: "ok", kind: "done" }),
  error: Object.freeze({
    word: TURN_WORD,
    tone: "error",
    kind: "error",
    action: "\u51FA\u9519\u4E86\uFF0C\u8BF7\u770B\u4E0B\u9762\u7684\u63D0\u793A"
  }),
  "needs-config": Object.freeze({
    word: TURN_WORD,
    tone: "config",
    kind: "config",
    action: "\u9700\u8981\u914D\u7F6E\uFF0C\u8BF7\u770B\u4E0B\u9762\u7684\u63D0\u793A"
  })
});
function humanOfKind(kind) {
  for (const entry of Object.values(STATUS_HUMAN)) {
    if (entry.kind === kind) return entry;
  }
  return null;
}
function turnKindOf(meta, gate) {
  const status = meta?.status ?? "active";
  const entry = STATUS_HUMAN[status];
  if (entry === void 0) return "unregistered";
  if (entry.kind === "done") return "done";
  if (entry.kind === "error") return "error";
  if (entry.kind === "config") return "config";
  if (humanTurnOf(meta, gate)) return "turn";
  if (pausedNow(meta)) return "paused";
  return "busy";
}
function turnOwnerOf(meta, gate) {
  const kind = turnKindOf(meta, gate);
  if (kind === "done") return "done";
  if (kind === "turn" || kind === "error" || kind === "config") return "you";
  if (kind === "busy") return "ai";
  return null;
}
var DECISION_QUESTION = Object.freeze({
  // 站 2（探查）：AI 读到的重点对不对（两路：满意继续／让 AI 重做）。
  explore: "AI \u8BFB\u5230\u7684\u6750\u6599\u91CD\u70B9\u5BF9\u4E0D\u5BF9\uFF1F",
  // 站 3（学习目标）：原来状态条在这里说的是站 2 的话（本票修掉的错位之一）。
  goals: "\u8FD9\u51E0\u6761\u5B66\u4E60\u76EE\u6807\u53EF\u4EE5\u5B9A\u4E0B\u6765\u4E86\u5417\uFF1F",
  // 站 4／5／6（三次拍板）：同一张卡、同一件事（这份方案能不能开工），故三档共用一句。
  gate: "\u8FD9\u4EFD\u65B9\u6848\u80FD\u7167\u5B83\u5F00\u5DE5\u5417\uFF1F",
  // 站 7（章节安排）。
  outline: "\u8FD9\u4EFD\u7AE0\u8282\u5B89\u6392\u80FD\u901A\u8FC7\u5417\uFF1F",
  // 站 8（这一稿行不行）：`gold` 折出来的第一档。
  "gold-draft": "\u8FD9\u4E00\u7A3F\u80FD\u5F53\u5168\u4E66\u7684\u6700\u4F73\u8303\u4F8B\u7AE0\u5417\uFF1F",
  // 站 9（定体量）：`gold` 折出来的第二档——原来它说的是站 8 的话（本票修掉的错位之二）。
  "gold-measure": "\u5176\u4F59\u5404\u7AE0\u7684\u5B57\u6570\u5C31\u6309\u8FD9\u4E2A\u5B9A\u5417\uFF1F",
  // 站 10（全章过目）。
  chapters: "\u5168\u4E66\u90FD\u8FC7\u76EE\u4E86\u3001\u53EF\u4EE5\u4EA4\u5DE5\u5417\uFF1F",
  // 站 11（终检）。
  final: "\u6574\u672C\u4E66\u80FD\u4EA4\u4ED8\u5417\uFF1F"
});
var FALLBACK_QUESTION = "\u770B\u4E00\u773C\u4E0B\u9762\u7684\u5361\u7247";
function decisionKeyOf(meta, gate) {
  const key = focusCardKey(meta, gate);
  if (key !== "gold") return key;
  const draft = meta?.stationDecisions?.[8] ?? meta?.stationDecisions?.["8"] ?? null;
  return draft?.approved === true ? "gold-measure" : "gold-draft";
}
function decisionOptionsOf(decisionKey, meta) {
  switch (decisionKey) {
    case "explore":
      return [
        {
          label: EXPLORE_CONFIRM_ACCEPT_LABEL,
          meaning: "\u7167\u8FD9\u4EFD\u62A5\u544A\u5F80\u4E0B\u8BBE\u8BA1",
          effect: EXPLORE_PASS_EFFECT
        },
        {
          label: EXPLORE_CONFIRM_REWRITE_LABEL,
          meaning: "\u4E0D\u6EE1\u610F\uFF0C\u8BA9 AI \u91CD\u505A\u4E00\u7248",
          // ⚠️ 这个取值按书分叉（真书／演示书）——沿用卡上那一句的**同一个出口**，⛔ 不抄第二份。
          effect: exploreConfirmNote(meta)
        }
      ];
    case "goals":
      return [
        {
          label: GOAL_CONFIRM_ACCEPT_LABEL,
          meaning: "\u8FD9\u51E0\u6761\u5C31\u6B64\u5B9A\u4E0B",
          effect: goalConfirmPassEffect()
        },
        {
          label: GOAL_CONFIRM_REWRITE_LABEL,
          meaning: "\u6253\u56DE\u53BB\u8BA9 AI \u91CD\u62DF",
          effect: GOAL_REWRITE_EFFECT
        }
      ];
    case "gate":
      return [
        { label: GATE_PASS_LABEL, meaning: "\u8FD9\u4EFD\u65B9\u6848\u5C31\u6B64\u5B9A\u4E0B", effect: gatePassEffect() },
        { label: GATE_REJECT_LABEL, meaning: "\u6253\u56DE\u8FD9\u4E00\u7248\u91CD\u505A", effect: GATE_REJECT_EFFECT },
        { label: GATE_SKIP_LABEL, meaning: "\u5148\u4E0D\u9A8C\u8FD9\u4E00\u5173\uFF0C\u5F80\u4E0B\u8D70", effect: GATE_SKIP_EFFECT },
        { label: GATE_ROLLBACK_LABEL, meaning: "\u9000\u56DE\u4E0A\u4E00\u4E2A\u5B58\u6863\u70B9", effect: GATE_ROLLBACK_EFFECT }
      ];
    case "outline":
      return [
        {
          label: OUTLINE_CONFIRM_ACCEPT_LABEL,
          meaning: "\u7167\u8FD9\u4EFD\u5B89\u6392\u5F00\u5DE5",
          effect: OUTLINE_PASS_EFFECT
        },
        {
          label: EXPLORE_CONFIRM_REWRITE_LABEL,
          meaning: "\u6253\u56DE\u53BB\u91CD\u65B0\u5B89\u6392",
          effect: outlineRejectPlaceholder(meta)
        }
      ];
    case "gold-draft":
      return [
        {
          label: GOLD_DRAFT_ACCEPT_LABEL,
          meaning: "\u8FD9\u4E00\u7A3F\u5C31\u662F\u5168\u4E66\u7684\u6700\u4F73\u8303\u4F8B\u7AE0",
          effect: GOLD_DRAFT_PASS_EFFECT
        },
        {
          label: GOLD_DRAFT_REWRITE_LABEL,
          meaning: "\u8FD9\u4E00\u7A3F\u4F5C\u5E9F\uFF0C\u91CD\u5199\u4E00\u7AE0",
          effect: goldRewriteHint(meta)
        }
      ];
    case "gold-measure":
      return [
        { label: GOLD_SEAL_LABEL, meaning: "\u5B9A\u7A3F\uFF0C\u6309\u8FD9\u4E00\u7AE0\u5199\u5168\u4E66", effect: GOLD_SEAL_EFFECT },
        {
          label: GOLD_WRITE_TARGETS_LABEL,
          meaning: "\u628A\u9010\u7AE0\u5B57\u6570\u5199\u56DE\u5B89\u6392",
          // 票 `ui-display-redesign/07`：保存键改名后，这句提示与卡上逐字同一份
          // （`gold-table.js` 的出口）——「点『保存』才落盘」。
          effect: GOLD_WRITE_TARGETS_HINT
        }
      ];
    case "chapters":
      return [
        { label: CHAPTERS_APPROVE_LABEL, meaning: "\u4EA4\u5DE5\uFF0C\u5408\u5E76\u6210\u4E66", effect: CHAPTERS_APPROVE_EFFECT },
        {
          label: CHAPTERS_REVIEW_LABEL,
          meaning: "\u6709\u610F\u89C1\u5C31\u5730\u5199\u4E00\u6761",
          effect: chaptersReviewLead(meta)
        }
      ];
    case "final":
      return [
        { label: FINAL_APPROVE_LABEL, meaning: "\u8BA4\u53EF\uFF0C\u4EA4\u4ED8\u8FD9\u672C\u4E66", effect: FINAL_APPROVE_EFFECT },
        {
          label: FINAL_REJECT_LABEL,
          meaning: "\u5199\u4E00\u53E5\u8981\u6539\u4EC0\u4E48\uFF0CAI \u6539\u6574\u672C",
          effect: finalApprovalNote(meta)
        }
      ];
    default:
      return [];
  }
}
function blockedOf(decisionKey, meta) {
  if (decisionKey !== "gold-measure") return null;
  const measured = meta?.stationDecisions?.[9] ?? meta?.stationDecisions?.["9"] ?? null;
  if (measured?.approved === true) return null;
  return { reason: GOLD_STATION9_NOT_DECIDED };
}
function decisionOf(meta, gate) {
  const decisionKey = decisionKeyOf(meta, gate);
  const question = decisionKey === "upload" ? phase1TurnAction(meta) : decisionKey === "status" ? FALLBACK_QUESTION : DECISION_QUESTION[decisionKey] ?? null;
  const options = decisionOptionsOf(decisionKey, meta);
  return {
    question,
    decisionKey,
    options,
    // 「本卡最下面」那颗定案键的文案＝主键那一条路的 label（同一个绑定，⛔ 不另写一份）。
    keysAt: options[0]?.label ?? "",
    blocked: blockedOf(decisionKey, meta)
  };
}
function humanTurnOf(meta, gate) {
  if (meta === null || meta === void 0) return false;
  const status = meta.status;
  if (status === "awaiting-explore" || status === "awaiting-outline" || status === "awaiting-gold" && !goldDraftDisplayed(meta, meta.pendingStage) || status === "awaiting-chapters-review" || status === "awaiting-final-approval")
    return true;
  if (gate !== null && gate !== void 0 && gate.status === "awaiting") return true;
  return meta.phase === 1 && gate === null;
}
function withPendingStage(meta, pendingStage) {
  if (meta === null || meta === void 0) return meta;
  if (meta.pendingStage === pendingStage) return meta;
  return { ...meta, pendingStage };
}
function statusHuman(meta, gate) {
  const humanTurn = humanTurnOf(meta, gate);
  const kind = turnKindOf(meta, gate);
  if (kind === "unregistered") return { word: null, tone: "normal", action: null, humanTurn };
  if (kind === "paused") return { word: null, tone: "normal", action: null, humanTurn: false };
  const said = humanOfKind(kind);
  if (said === null) return { word: null, tone: "normal", action: null, humanTurn };
  if (kind === "done") return { word: said.word, tone: said.tone, action: deliveredAction(meta), humanTurn };
  if (kind === "error") return { word: said.word, tone: said.tone, action: said.action ?? null, humanTurn };
  if (kind === "config") return { word: said.word, tone: said.tone, action: said.action ?? null, humanTurn };
  if (kind === "turn")
    return {
      word: said.word,
      tone: said.tone,
      action: decisionOf(meta, gate).question,
      humanTurn: true
    };
  return { word: said.word, tone: said.tone, action: READY_NEXT_ACTION, humanTurn: false };
}
function deriveBookViewFacts(input) {
  const {
    events,
    meta = null,
    gate = null,
    pendingStage = null,
    pendingGate = null,
    mainAiRunning,
    subagentRunningCount,
    subagentActiveSince
  } = input ?? {};
  const list = events ?? [];
  const lastEvent = list.length > 0 ? list[list.length - 1] : null;
  const pendingStageLabel = pendingStage === "gate" ? gateHuman(pendingGate ?? "?") : stageHuman(pendingStage);
  const humanTurn = statusHuman(withPendingStage(meta, pendingStage), gate).humanTurn;
  return {
    lastEvent,
    checks: lastEventOfType(list, "textbook/quality")?.data?.checks ?? [],
    aiReport: lastEventOfType(list, "textbook/ai-report")?.data?.report ?? null,
    progressDetail: stageScopedProgressDetail(list),
    pendingStageLabel,
    humanTurn,
    // 两个分支都带兜底文案、恒为非空串（`StatusCard` 只把它当纯显示值印一行）。
    needsConfig: lastEvent?.type === "textbook/error" ? `${lastEvent.data?.task ?? ""}\u5931\u8D25\uFF1A${lastEvent.data?.message ?? ""}` : '\u8BF7\u5148\u914D\u7F6E\u5927\u6A21\u578B\u63A5\u53E3\uFF08\u53F3\u4E0A\u89D2\u8BBE\u7F6E \u2192 \u6A21\u578B\uFF09\uFF0C\u914D\u597D\u540E\u70B9"\u7EE7\u7EED"\u3002',
    stall: deriveStallJudgment({
      mainAiRunning,
      subagentRunningCount,
      subagentActiveSince,
      lastWriteAt: meta?.updatedAt
    })
  };
}
function focusCardKey(meta, gate) {
  if (gate !== null && gate !== void 0 && gate.status === "awaiting")
    return "gate";
  const status = meta?.status ?? "";
  if (status === "error" && meta?.phase !== 1) return "status";
  if (status === "needs-config") return "status";
  if (status === "awaiting-explore") return meta?.exploreConfirmed === true ? "goals" : "explore";
  if (status === "awaiting-outline") return "outline";
  if (status === "awaiting-gold") return "gold";
  if (status === "awaiting-final-approval") return "final";
  if (status === "delivered") return "delivered";
  if (meta?.phase === 5) return "chapters";
  if (meta?.phase === 1) return "upload";
  return "status";
}
var AUTO_SCROLL_CARD_KEYS = Object.freeze(["gate", "final"]);
function autoScrollCardKey(meta, gate) {
  const key = focusCardKey(meta, gate);
  return AUTO_SCROLL_CARD_KEYS.includes(key) ? key : null;
}
function workEntryAction(rel) {
  const mode = productOpenMode(rel);
  if (mode === "preview") return "sidebar";
  if (mode === "inline") return "inline";
  return "none";
}
var GATE_PROPOSAL_DIR = "\u5DE5\u4F5C\u533A/\u65B9\u6848/";
var GATE_PROPOSAL_PREFIX = "\u5173\u5361";
var gateProposalRel = (gate, version) => `${GATE_PROPOSAL_DIR}${GATE_PROPOSAL_PREFIX}${gate}-v${version}.md`;
function structuredEventArtifacts(data) {
  const out = [];
  if (typeof data?.path === "string" && data.path !== "") out.push(data.path);
  if (Array.isArray(data?.artifacts)) {
    for (const rel of data.artifacts)
      if (typeof rel === "string" && rel !== "") out.push(rel);
  }
  return out;
}
function eventLabelArtifacts(label, meta) {
  const out = [];
  if (label === "") return out;
  const write = /写第\s*(\d+)\s*章/.exec(label);
  if (write !== null) out.push(chapterRel(Number(write[1])));
  else if (label.includes("\u5B8C\u6210")) {
    const done = /第\s*(\d+)\s*章/.exec(label);
    if (done !== null) out.push(chapterRel(Number(done[1])));
  }
  if (label.startsWith("\u6E90\u63A2\u67E5")) out.push("\u5DE5\u4F5C\u533A/explore.md");
  if (label.includes("\u7AE0\u8282\u9AA8\u67B6") || label.includes("\u7AE0\u8282\u5B89\u6392")) out.push("\u5DE5\u4F5C\u533A/outline.md");
  if (label.includes("\u6700\u4F73\u8303\u4F8B\u7AE0")) out.push(chapterRel(goldChapterNo(meta)));
  if (label.startsWith("\u5408\u5E76\u6210\u4E66") || label.startsWith("\u6700\u540E\u68C0\u67E5")) out.push("\u5DE5\u4F5C\u533A/book.md");
  const gate = /设计提案·(?:第\s*(\d+)\s*关|关卡\s*(\d+))(?:·修订\s*v\s*(\d+))?/.exec(label);
  if (gate !== null)
    out.push(gateProposalRel(gate[1] ?? gate[2], gate[3] === void 0 ? 1 : Number(gate[3])));
  return out;
}
var LABEL_EVENT_TYPES = /* @__PURE__ */ new Set([
  "textbook/agent-start",
  "textbook/agent-end",
  "textbook/stage-start"
]);
function eventArtifactCandidates(event, meta) {
  const data = event?.data ?? {};
  const candidates = [];
  for (const rel of structuredEventArtifacts(data))
    if (workEntryAction(rel) === "sidebar") candidates.push(rel);
  if (event?.type === "textbook/gate-proposal") {
    const gate = String(data.gate ?? "").trim();
    const version = Number(data.version);
    if (/^[1-9]\d*$/.test(gate) && Number.isInteger(version) && version >= 1)
      candidates.push(gateProposalRel(gate, version));
  } else if (LABEL_EVENT_TYPES.has(event?.type)) {
    const label = String(data.label ?? "");
    for (const rel of eventLabelArtifacts(label, meta)) candidates.push(rel);
  } else if (event?.type === "textbook/phase-end") {
    const phase = Number(data.phase);
    if (phase === 2) candidates.push("\u5DE5\u4F5C\u533A/explore.md");
    else if (phase === 4) candidates.push(chapterRel(goldChapterNo(meta)));
    else if (phase === 5 || phase === 6) candidates.push("\u5DE5\u4F5C\u533A/book.md");
  }
  return candidates.filter((rel) => workEntryAction(rel) === "sidebar");
}
function candidateExists(rel, files) {
  return rel.startsWith(GATE_PROPOSAL_DIR) || files.some((f) => f?.path === rel);
}
function workEntryForEvent(event, meta, workFiles) {
  const files = Array.isArray(workFiles) ? workFiles : [];
  const candidates = eventArtifactCandidates(event, meta);
  const hit = candidates.find((rel) => candidateExists(rel, files));
  if (hit !== void 0) return { kind: "open", path: hit, label: artifactName(hit) };
  return candidates.length > 0 ? { kind: "blocked" } : { kind: "none" };
}
var workPathForEvent = (event, meta, workFiles) => {
  const entry = workEntryForEvent(event, meta, workFiles);
  return entry.kind === "open" ? { path: entry.path, label: entry.label } : null;
};
function phaseOfSegment(seg) {
  if (Number.isInteger(seg?.phase)) return seg.phase;
  const byKind = SEGMENT_PHASE[seg?.kind];
  return Number.isInteger(byKind) ? byKind : null;
}
function relPath(rel) {
  return String(rel ?? "").replace(/\\/g, "/").replace(/^(?:\.\/)+/, "");
}
var CHAPTER_NAME_RE = /^工作区\/chapter-(\d+)\.md$/;
var ARCHIVED_NAME_RE = /^工作区\/_旧版产物\/(?:[^/]+\/)?(.+)$/;
var GATE_PROPOSAL_NAME_RE = /^工作区\/方案\/关卡(\d+)-v(\d+)\.md$/;
var CONVERTED_SOURCE_NAME_RE = /^材料\/转换稿\/(.+)$/;
var DETAIL_NOTE_NAME_RE = /^工作区\/细目\/精读-(\d+)\.md$/;
var FINAL_REPORT_NAME_RE = /^工作区\/报告\/final-(\d+)\.md$/;
var FINAL_SUMMARY_NAME = finalAuditSummaryRel();
var ORIGINAL_NAME_RE = /^sources\/(.+)$/;
var NAME_EXTENSION_RE = /\.[A-Za-z0-9]+$/;
var DRAFT_STAMP_RE = /\.[0-9a-z]+$/i;
function draftBaseName(file) {
  const stripped = file.replace(DRAFT_STAMP_RE, "");
  return stripped.endsWith(".md") ? stripped : file;
}
function nameForRel(path) {
  const chapter = CHAPTER_NAME_RE.exec(path);
  if (chapter !== null) return `\u7B2C ${Number(chapter[1])} \u7AE0`;
  const archived = ARCHIVED_NAME_RE.exec(path);
  if (archived !== null) {
    const base = nameForRel(`\u5DE5\u4F5C\u533A/${draftBaseName(archived[1])}`);
    return base === "" ? "" : `${base}\xB7\u65E7\u7A3F`;
  }
  const gate = GATE_PROPOSAL_NAME_RE.exec(path);
  if (gate !== null) {
    const name = `${gateHuman(gate[1])}\u7684\u65B9\u6848`;
    const version = Number(gate[2]);
    return version >= 2 ? `${name}\uFF08\u7B2C ${version} \u7248\uFF09` : name;
  }
  const source = CONVERTED_SOURCE_NAME_RE.exec(path);
  if (source !== null) {
    const material = source[1].split("/")[0].replace(/\.md$/i, "");
    return material === "" ? "\u6750\u6599\u8F6C\u6362\u7A3F" : `${material}\u7684\u8F6C\u6362\u7A3F`;
  }
  const original = ORIGINAL_NAME_RE.exec(path);
  if (original !== null) {
    const material = original[1].split("/")[0].replace(NAME_EXTENSION_RE, "");
    return material === "" ? "\u539F\u4EF6" : `${material}\u7684\u539F\u4EF6`;
  }
  if (path === "\u5DE5\u4F5C\u533A/explore.md") return "\u8BFB\u6750\u6599\u6311\u91CD\u70B9\u7684\u7ED3\u679C";
  if (path === "\u5DE5\u4F5C\u533A/outline.md") return "\u7AE0\u8282\u5B89\u6392";
  if (path === "\u5DE5\u4F5C\u533A/style-spec.md") return "\u5199\u4F5C\u89C4\u8303";
  if (path === "\u5DE5\u4F5C\u533A/book.md") return "\u6210\u4E66";
  if (isGoalDocRel(path)) return "\u5B66\u5B8C\u8981\u80FD\u505A\u5230\u4EC0\u4E48";
  const detailNote = DETAIL_NOTE_NAME_RE.exec(path);
  if (detailNote !== null) return `\u7B2C ${Number(detailNote[1])} \u4EFD\u6750\u6599\u7684\u7CBE\u8BFB\u7EC6\u76EE`;
  const finalReport = FINAL_REPORT_NAME_RE.exec(path);
  if (finalReport !== null) return `\u6700\u540E\u68C0\u67E5\xB7\u7B2C ${Number(finalReport[1])} \u8DEF\u5206\u62A5\u544A`;
  if (path === FINAL_SUMMARY_NAME) return "\u6700\u540E\u68C0\u67E5\xB7\u4E94\u4EFD\u5206\u62A5\u544A\u7684\u6C47\u603B";
  if (path === "\u8FC7\u7A0B\u8BB0\u5F55.md") return "\u8FC7\u7A0B\u8BB0\u5F55";
  return "";
}
function artifactName(rel) {
  const path = relPath(rel);
  const name = nameForRel(path);
  return name === "" ? artifactKind(path) : name;
}
var AUDIT_FACT_PATH_RE = /^工作区\/audit(?:-[^/]+)?\.md$/i;
function artifactFactTime(modifiedAt) {
  const at = artifactFactTimestamp(modifiedAt);
  return at === null ? "" : formatTime(new Date(at));
}
function artifactFactTimestamp(modifiedAt) {
  if (modifiedAt === null || modifiedAt === void 0 || modifiedAt === "") return null;
  const ms = modifiedAt instanceof Date ? modifiedAt.getTime() : new Date(modifiedAt).getTime();
  return Number.isFinite(ms) ? ms : null;
}
function artifactFactKind(fact, path) {
  const serverKind = String(fact?.kind ?? "").trim();
  if (serverKind === "\u68C0\u67E5\u8BB0\u5F55" || AUDIT_FACT_PATH_RE.test(path)) return "\u68C0\u67E5\u8BB0\u5F55";
  if (serverKind === "\u6B63\u6587" || artifactKind(path) === "\u6B63\u6587") return "\u6B63\u6587";
  return "";
}
function artifactFactText(seg) {
  const facts = Array.isArray(seg?.artifactFacts) ? seg.artifactFacts : [];
  const lines = [];
  for (const fact of facts) {
    if (fact === null || typeof fact !== "object") continue;
    const path = relPath(fact.path);
    const kind = artifactFactKind(fact, path);
    const time = artifactFactTime(fact.modifiedAt);
    if (kind === "\u68C0\u67E5\u8BB0\u5F55") {
      lines.push(auditFactText(fact, time));
      continue;
    }
    const name = artifactName(path);
    if (kind === "\u6B63\u6587")
      lines.push(time === "" ? `\u6B63\u6587\uFF1A${name}` : `\u6B63\u6587\uFF1A${name}\uFF08${time}\uFF09`);
    else lines.push(time === "" ? name : `${name}\uFF08${time}\uFF09`);
  }
  return lines.join("\uFF0C");
}
function auditFactText(fact, time) {
  const suffix = fact.freshness === "stale" ? time === "" ? "\u6BD4\u6B63\u6587\u65E7\uFF0C\u5C5E\u4E8E\u65E7\u7A3F" : `${time}\uFF0C\u6BD4\u6B63\u6587\u65E7\uFF0C\u5C5E\u4E8E\u65E7\u7A3F` : time;
  return suffix === "" ? "\u68C0\u67E5\u8BB0\u5F55" : `\u68C0\u67E5\u8BB0\u5F55\uFF08${suffix}\uFF09`;
}
function chapterAuditFreshnessText(segments, n) {
  const fact = chapterAuditFact(segments, n);
  return fact === null ? "" : auditFactText(fact, artifactFactTime(fact.modifiedAt));
}
function chapterAuditIsStale(segments, n) {
  const fact = chapterAuditFact(segments, n);
  return fact !== null && fact.freshness === "stale";
}
function chapterNoOfSeg(seg) {
  const match = /^chapter-(\d+)$/.exec(String(seg?.key ?? ""));
  return match === null ? null : Number(match[1]);
}
function segmentArtifactTouchedAt(seg) {
  const facts = Array.isArray(seg?.artifactFacts) ? seg.artifactFacts : [];
  let latest = null;
  for (const fact of facts) {
    const at = artifactFactTimestamp(fact?.modifiedAt);
    if (at === null) continue;
    if (latest === null || at > latest) latest = at;
  }
  return latest;
}
function chapterStageInFlight(seg) {
  return typeof seg?.stage === "string" && seg.stage !== "" && seg.stage !== "done";
}
function indexRunningChapterClaims(segments, runningSubagentCount) {
  const claims = /* @__PURE__ */ new Set();
  const slots = Number.isSafeInteger(runningSubagentCount) && runningSubagentCount > 0 ? runningSubagentCount : 0;
  if (slots === 0) return claims;
  const candidates = [];
  for (const seg of Array.isArray(segments) ? segments : []) {
    const n = chapterNoOfSeg(seg);
    if (n === null) continue;
    if (seg?.status === "done") continue;
    const touchedAt = segmentArtifactTouchedAt(seg);
    if (touchedAt === null) continue;
    if (!chapterStageInFlight(seg)) continue;
    candidates.push({ n, touchedAt });
  }
  candidates.sort((a, b) => b.touchedAt - a.touchedAt || a.n - b.n);
  for (const candidate of candidates.slice(0, slots)) claims.add(candidate.n);
  return claims;
}
function chapterAuditFact(segments, n) {
  const list = Array.isArray(segments) ? segments : [];
  const seg = list.find((row) => row?.key === `chapter-${n}`);
  if (seg === void 0) return null;
  const facts = Array.isArray(seg.artifactFacts) ? seg.artifactFacts : [];
  for (const fact of facts) {
    if (fact === null || typeof fact !== "object") continue;
    const path = relPath(fact.path);
    if (artifactFactKind(fact, path) !== "\u68C0\u67E5\u8BB0\u5F55") continue;
    return fact;
  }
  return null;
}
function artifactLabel(workFiles, path, seg) {
  return artifactName(path);
}
function openableArtifacts(seg, workFiles) {
  return (seg?.artifacts ?? []).filter((rel) => typeof rel === "string" && workEntryAction(rel) === "sidebar").map((rel) => ({
    path: rel,
    label: artifactLabel(workFiles, rel, seg),
    kind: artifactKind(rel)
  }));
}
function decisionText(seg) {
  const decision = seg?.decision;
  if (decision == null) return null;
  const versionSuffix = (raw) => {
    const version = Number(raw);
    return Number.isInteger(version) && version >= 2 ? `\uFF0C\u7B2C ${version} \u7248` : "";
  };
  if (decision.status === "awaiting") return `\u5F85\u62CD\u677F${versionSuffix(decision.proposalVersion)}`;
  const verdict = decision.approved === true ? "\u2705 \u901A\u8FC7" : "\u274C \u9A73\u56DE";
  return `${verdict}${versionSuffix(decision.version)}${decision.note ? `\uFF08${decision.note}\uFF09` : ""}`;
}
function stepWord(status) {
  if (status === "done") return "\u5DF2\u5B8C\u6210";
  if (status === "waiting-user") return "\u8F6E\u5230\u4F60";
  if (status === "active") return "\u6211\u6B63\u5728\u505A";
  return "\u8FD8\u6CA1\u5230\u8FD9\u4E00\u6B65";
}
var CONVERSION_RUN_BOUNDARIES = /* @__PURE__ */ new Set([
  "textbook/stage-start",
  "textbook/agent-start",
  "textbook/agent-end",
  "textbook/error",
  "textbook/rollback",
  "textbook/source-added"
]);
function currentConversionProgress(events) {
  const list = Array.isArray(events) ? events : [];
  let runStart = 0;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (CONVERSION_RUN_BOUNDARIES.has(list[i]?.type)) {
      runStart = i + 1;
      break;
    }
  }
  const progress = [];
  for (let i = runStart; i < list.length; i += 1) {
    const event = list[i];
    const stage = typeof event?.data?.stage === "string" ? event.data.stage.trim() : "";
    if (event?.type === "textbook/mineru-progress" && stage !== "") progress.push(event);
  }
  return { first: progress[0] ?? null, last: progress[progress.length - 1] ?? null };
}
function eventTime(event) {
  return Number.isFinite(event?.time) && event.time > 0 ? event.time : null;
}
var CONVERTED_ICON = Object.freeze({
  pending: "\u23F3",
  ok: "\u2705",
  failed: "\u274C"
});
var convertedIcon = (source) => CONVERTED_ICON[convertedState(source)];
function materialConversionActivityText(meta, events, now = Date.now()) {
  if (meta?.converting !== true) return null;
  const { first, last } = currentConversionProgress(events);
  const stage = typeof last?.data?.stage === "string" ? last.data.stage.trim() : "";
  const startedAt = eventTime(first) ?? eventTime({ time: meta?.updatedAt });
  const parts = [stepWord("active"), stage === "" ? "\u8F6C\u6362\u6750\u6599" : stage];
  if (startedAt !== null) parts.push(`\u5DF2\u7528 ${humanDuration(now - startedAt)}`);
  return parts.join("\uFF0C");
}
var PHASE_INTRO = Object.freeze({
  1: "\u4F60\u628A\u6750\u6599\u4F20\u4E0A\u6765\uFF0C\u673A\u5668\u628A\u5B83\u8F6C\u6210\u80FD\u8BFB\u7684\u6B63\u6587\u3002",
  2: "AI \u8BFB\u5B8C\u6750\u6599\u3001\u6311\u51FA\u91CD\u70B9\uFF0C\u7B49\u4F60\u786E\u8BA4\u3002",
  3: "\u4E09\u6B21\u62CD\u677F\uFF1A\u5B9A\u4E0B\u5B66\u4E60\u76EE\u6807\u4E0E\u96BE\u70B9\u3001\u6559\u5B66\u65B9\u6CD5\u4E0E\u677F\u5757\u3001\u5168\u4E66\u67B6\u6784\u4E0E\u7AE0\u8282\uFF0C\u518D\u6392\u597D\u7AE0\u8282\u3002",
  4: "\u5148\u5199\u4E00\u7AE0\u7ED9\u4F60\u8FC7\u76EE\uFF0C\u5B9A\u4E0B\u5168\u4E66\u98CE\u683C\u3002",
  5: "\u4E00\u7AE0\u4E00\u7AE0\u5199\uFF0C\u6BCF\u7AE0\u673A\u5668\u68C0\u67E5\u8FC7\uFF0C\u4F60\u968F\u65F6\u80FD\u62BD\u67E5\u63D0\u610F\u89C1\u3002",
  6: "AI \u628A\u5168\u4E66\u6574\u4F53\u8C03\u6574\u4E00\u904D + \u673A\u5668\u786C\u68C0\u67E5\uFF0C\u4F60\u8BA4\u53EF\u540E\u4EA4\u4ED8\u3002"
});
var auditSkipWaived = (meta) => (meta?.waivers ?? []).some(
  (w) => w?.item === "audit-skip" && typeof w?.userNote === "string" && w.userNote.trim() !== ""
);
var DEMO_PHASE5_INTRO = "\u4E00\u7AE0\u4E00\u7AE0\u5199\uFF0C\u4F60\u968F\u65F6\u80FD\u62BD\u67E5\u63D0\u610F\u89C1\u3002\u6F14\u793A\u6A21\u5F0F\uFF1A\u6BCF\u7AE0\u4E0D\u8DD1\u673A\u5668\u68C0\u67E5\u3002";
var AUDIT_SKIP_PHASE5_INTRO = "\u4E00\u7AE0\u4E00\u7AE0\u5199\uFF0C\u4F60\u968F\u65F6\u80FD\u62BD\u67E5\u63D0\u610F\u89C1\u3002\u4F60\u5DF2\u540C\u610F\u4E0D\u8981\u6C42\u6BCF\u7AE0\u90FD\u6709\u72EC\u7ACB\u5BA1\u67E5\uFF1A\u6BCF\u7AE0\u90A3\u9053\u673A\u5668\u68C0\u67E5\u4E0D\u8DD1\u3002";
function phaseIntro(phase, meta) {
  if (phase !== 5) return PHASE_INTRO[phase] ?? "";
  if (isDemoBook(meta)) return DEMO_PHASE5_INTRO;
  if (auditSkipWaived(meta)) return AUDIT_SKIP_PHASE5_INTRO;
  return PHASE_INTRO[5];
}
var GATE_DECIDED_NOTE = "\u4E4B\u540E\u60F3\u6539\uFF1A\u53EF\u56DE\u9000\u5230\u6700\u8FD1\u4E00\u6B21\u5B58\u6863\uFF1B\u8981\u6539\u66F4\u65E9\u7684\u51B3\u5B9A\uFF0C\u7B49 AI \u505C\u624B\uFF08\u6216\u5148 \u23F8 \u6682\u505C\uFF09\u540E\u5C55\u5F00\u4E0A\u9762\u7684\u6B65\u6E05\u5355\u70B9\u90A3\u4E00\u6B65\uFF0C\u7528\u300C\u5B9A\u70B9\u4FEE\u6539\u300D\u3002";
var DEMO_GATE_DECIDED_NOTE = "\u4E4B\u540E\u60F3\u6539\uFF1A\u53EF\u56DE\u9000\u5230\u6700\u8FD1\u4E00\u6B21\u5B58\u6863\u3002\u6F14\u793A\u4E66\u6CA1\u6709 AI \u5728\u8DD1\uFF0C\u6240\u4EE5\u6CA1\u6709\u300C\u7B49\u5B83\u505C\u624B\u300D\u8FD9\u56DE\u4E8B\uFF1B\u8981\u6539\u66F4\u65E9\u7684\u51B3\u5B9A\uFF0C\u5C55\u5F00\u4E0A\u9762\u7684\u6B65\u6E05\u5355\u70B9\u90A3\u4E00\u6B65\u3001\u7528\u300C\u5B9A\u70B9\u4FEE\u6539\u300D\u2014\u2014\u90A3\u4E00\u6B65\u5728\u6F14\u793A\u4E66\u91CC\u53EA\u662F\u7ED9\u4F60\u770B\u5B83\u957F\u4EC0\u4E48\u6837\uFF0C\u70B9\u4E0B\u53BB\u4E0D\u4F1A\u91CD\u505A\u4EFB\u4F55\u4E1C\u897F\u3002";
function gateDecidedNote(meta) {
  if (isDemoBook(meta)) return DEMO_GATE_DECIDED_NOTE;
  return GATE_DECIDED_NOTE;
}
var CHAPTERS_FOOTER_NOTE = "\u{1F4CC} \u6BCF\u4EA4\u5B8C\u4E00\u7AE0\u3001\u6BCF\u6B21\u4EA4\u529E\u6216\u62CD\u677F\u524D\u90FD\u4F1A\u81EA\u52A8\u5B58\u6863\uFF1B\u968F\u65F6\u80FD\u56DE\u5230\u6700\u8FD1\u4E00\u6B21\u5B58\u6863\u2014\u2014\u5199\u5B8C\u6574\u672C\u90A3\u6BB5\u65F6\u95F4\u91CC\uFF0C\u5B83\u5C31\u505C\u5728\u4E0A\u4E00\u7AE0\u4EA4\u5B8C\u7684\u5730\u65B9\u3002\u60F3\u6539\u66F4\u65E9\u7684\u51B3\u5B9A\uFF0C\u5C55\u5F00\u4E0A\u9762\u7684\u6B65\u6E05\u5355\u70B9\u90A3\u4E00\u6B65\uFF0C\u7528\u300C\u5B9A\u70B9\u4FEE\u6539\u300D\u3002";
var DEMO_CHAPTERS_FOOTER_NOTE = "\u{1F4CC} \u6F14\u793A\u4E66\u4F1A\u5728\u6BCF\u6B21\u4EA4\u529E\u6216\u62CD\u677F\u524D\u81EA\u52A8\u5B58\u6863\uFF08\u6CA1\u6709\u300C\u6BCF\u4EA4\u5B8C\u4E00\u7AE0\u300D\u90A3\u4E00\u79CD\uFF09\uFF1B\u60F3\u6539\u66F4\u65E9\u7684\u51B3\u5B9A\uFF0C\u5C55\u5F00\u4E0A\u9762\u7684\u6B65\u6E05\u5355\u70B9\u90A3\u4E00\u6B65\u3001\u7528\u300C\u5B9A\u70B9\u4FEE\u6539\u300D\u2014\u2014\u90A3\u4E00\u6B65\u5728\u6F14\u793A\u4E66\u91CC\u53EA\u662F\u7ED9\u4F60\u770B\u5B83\u957F\u4EC0\u4E48\u6837\uFF0C\u70B9\u4E0B\u53BB\u4E0D\u4F1A\u91CD\u505A\u4EFB\u4F55\u4E1C\u897F\u3002";
function chaptersFooterNote(meta) {
  if (isDemoBook(meta)) return DEMO_CHAPTERS_FOOTER_NOTE;
  return CHAPTERS_FOOTER_NOTE;
}
var OUTLINE_REJECT_PLACEHOLDER = "\u60F3\u600E\u4E48\u8C03\uFF0C\u5199\u5728\u8FD9\u91CC\uFF08\u53EF\u4E0D\u586B\uFF0CAI \u4F1A\u81EA\u5DF1\u91CD\u65B0\u5B89\u6392\uFF09";
var DEMO_OUTLINE_REJECT_PLACEHOLDER = "\u60F3\u600E\u4E48\u8C03\uFF0C\u5199\u5728\u8FD9\u91CC\uFF08\u53EF\u4E0D\u586B\uFF1B\u6F14\u793A\u4E66\u4F1A\u628A\u540C\u4E00\u4EFD\u5B89\u6392\u539F\u6837\u518D\u5199\u4E00\u904D\uFF0C\u4F60\u5199\u7684\u8BDD\u4E0D\u4F1A\u8FDB\u53BB\uFF09";
var PARA_MARK_CONFIRM_NOTE = "AI \u4F1A\u7167\u8FD9\u6761\u6539\u8FD9\u4E00\u7AE0\uFF1B\u8FD9\u4E00\u7AE0\u4EA4\u5DE5\u524D\u5FC5\u987B\u5148\u5904\u7F6E\u5B83\u3002";
var DEMO_PARA_MARK_CONFIRM_NOTE = "\u6F14\u793A\u4E66\u91CC\u6CA1\u6709 AI\uFF1A\u8FD9\u4E00\u6761\u4E0D\u4F1A\u4EA4\u7ED9\u8C01\u53BB\u6539\u8FD9\u4E00\u7AE0\u3002";
function outlineRejectPlaceholder(meta) {
  if (isDemoBook(meta)) return DEMO_OUTLINE_REJECT_PLACEHOLDER;
  return OUTLINE_REJECT_PLACEHOLDER;
}
function paraMarkConfirmNote(meta) {
  if (isDemoBook(meta)) return DEMO_PARA_MARK_CONFIRM_NOTE;
  return PARA_MARK_CONFIRM_NOTE;
}
var PHASE1_TURN_ACTION = "\u4E0A\u4F20\u6559\u6750\uFF08\u5F00\u59CB\u8F6C\u6362\u540E AI \u4F1A\u81EA\u52A8\u63A5\u624B\uFF09";
var DEMO_PHASE1_TURN_ACTION = "\u4E0A\u4F20\u6559\u6750\uFF08\u6F14\u793A\u4E66\u4E0D\u771F\u8DD1\u8F6C\u6362\uFF1B\u70B9\u300C\u25B6 \u5F00\u59CB\u6F14\u793A\u300D\u5F80\u4E0B\u8D70\uFF09";
function phase1TurnAction(meta) {
  if (isDemoBook(meta)) return DEMO_PHASE1_TURN_ACTION;
  return PHASE1_TURN_ACTION;
}
var MATERIAL_ROLE_NOTE = "\u4E66\u6587\u4EF6\u5939\u5EFA\u5728\u5F53\u524D\u5DE5\u4F5C\u533A\u76EE\u5F55\u91CC\uFF08\u6587\u4EF6\u5939\u540D\uFF1D\u4E66\u540D\uFF09\uFF0C\u4E0A\u4F20\u7684\u6750\u6599\u90FD\u653E\u91CC\u9762\u3002\u6BCF\u4EFD\u6750\u6599\u662F\u4EC0\u4E48\u89D2\u8272\uFF0C\u7531 AI \u5728\u300C\u8BFB\u6750\u6599\u6311\u91CD\u70B9\u300D\u90A3\u4E00\u6B65\u8BFB\u5B8C\u6750\u6599\u540E\u5224\u5B9A\u3002";
var DEMO_MATERIAL_ROLE_NOTE = "\u4E66\u6587\u4EF6\u5939\u5EFA\u5728\u5F53\u524D\u5DE5\u4F5C\u533A\u76EE\u5F55\u91CC\uFF08\u6587\u4EF6\u5939\u540D\uFF1D\u4E66\u540D\uFF09\uFF0C\u4E0A\u4F20\u7684\u6750\u6599\u90FD\u653E\u91CC\u9762\u3002\u6BCF\u4EFD\u6750\u6599\u662F\u4EC0\u4E48\u89D2\u8272\uFF0C\u7531\u673A\u5668\u5728\u300C\u8BFB\u6750\u6599\u6311\u91CD\u70B9\u300D\u90A3\u4E00\u6B65\u6309\u6F14\u793A\u5939\u5177\u5199\u5B9A\uFF08\u6F14\u793A\u4E66\u91CC\u6CA1\u6709 AI\uFF09\u3002";
function materialRoleNote(meta) {
  if (isDemoBook(meta)) return DEMO_MATERIAL_ROLE_NOTE;
  return MATERIAL_ROLE_NOTE;
}
var EXPLORE_CONFIRM_NOTE = "\u8FD9\u662F\u540E\u9762\u6240\u6709\u8BBE\u8BA1\u7684\u57FA\u7840\u3002\u6EE1\u610F\u5C31\u7EE7\u7EED\uFF1B\u4E0D\u6EE1\u610F\u70B9\u300C\u91CD\u505A\u300D\uFF0C\u52FE\u4E2A\u7406\u7531\u6216\u5199\u4E00\u53E5\u54EA\u91CC\u4E0D\u6EE1\u610F\uFF0CAI \u4F1A\u7167\u7740\u6539\uFF08\u4E0D\u586B\u4E5F\u80FD\u91CD\u505A\uFF09\u3002";
var DEMO_EXPLORE_CONFIRM_NOTE = "\u8FD9\u662F\u540E\u9762\u6240\u6709\u8BBE\u8BA1\u7684\u57FA\u7840\u3002\u6EE1\u610F\u5C31\u7EE7\u7EED\uFF1B\u4E0D\u6EE1\u610F\u70B9\u300C\u91CD\u505A\u300D\uFF0C\u52FE\u4E2A\u7406\u7531\u6216\u5199\u4E00\u53E5\u54EA\u91CC\u4E0D\u6EE1\u610F\u2014\u2014\u6F14\u793A\u4E66\u4F1A\u628A\u540C\u4E00\u4EFD\u63A2\u67E5\u62A5\u544A\u539F\u6837\u518D\u5199\u4E00\u904D\uFF08\u6CA1\u6709 AI \u53C2\u4E0E\uFF1B\u4F60\u5199\u7684\u90A3\u53E5\u4E0D\u4F1A\u8FDB\u53BB\uFF09\u3002";
function exploreConfirmNote(meta) {
  if (isDemoBook(meta)) return DEMO_EXPLORE_CONFIRM_NOTE;
  return EXPLORE_CONFIRM_NOTE;
}
function outlineCardLead(meta, chapterCount, pick) {
  if (isDemoBook(meta)) {
    return `\u8FD9\u672C\u4E66\u6309\u6F14\u793A\u5939\u5177\u6392\u6210 ${chapterCount} \u7AE0\u3002\u6BCF\u7AE0\u6807\u597D\u4E86\u7528\u6750\u6599\u7684\u54EA\u4E00\u5757\u3001\u8986\u76D6\u54EA\u4E9B\u77E5\u8BC6\u70B9\u3002\u6BCF\u7AE0\u591A\u5C11\u5B57\uFF0C\u7B49\u6700\u4F73\u8303\u4F8B\u7AE0\u5199\u5B8C\u3001\u5B9E\u6D4B\u4E4B\u540E\u4E00\u8D77\u5B9A\u3002\u6EE1\u610F\u70B9\u300C\u901A\u8FC7\u300D\uFF0C\u6F14\u793A\u4E66\u63A5\u7740\u628A\u7B2C ${pick} \u7AE0\u5F53\u6700\u4F73\u8303\u4F8B\u7AE0\u5199\u51FA\u6765\u7ED9\u4F60\u8FC7\u76EE\uFF1B\u8981\u8C03\u5C31\u70B9\u300C\u8BA9 AI \u91CD\u505A\u300D\u3002`;
  }
  return `AI \u8BA1\u5212\u628A\u8FD9\u672C\u4E66\u5206\u6210 ${chapterCount} \u7AE0\u3002\u6BCF\u7AE0\u6807\u597D\u4E86\u7528\u6750\u6599\u7684\u54EA\u4E00\u5757\u3001\u8986\u76D6\u54EA\u4E9B\u77E5\u8BC6\u70B9\u3002\u6BCF\u7AE0\u591A\u5C11\u5B57\uFF0C\u7B49\u6700\u4F73\u8303\u4F8B\u7AE0\u5199\u5B8C\u3001\u5B9E\u6D4B\u4E4B\u540E\u4E00\u8D77\u5B9A\u3002\u6EE1\u610F\u70B9\u300C\u901A\u8FC7\u300D\uFF0CAI \u5148\u628A\u7B2C ${pick} \u7AE0\u5F53\u6700\u4F73\u8303\u4F8B\u7AE0\u5199\u51FA\u6765\u7ED9\u4F60\u8FC7\u76EE\uFF1B\u8981\u8C03\u5C31\u70B9\u300C\u8BA9 AI \u91CD\u505A\u300D\u3002`;
}
var CHAPTERS_REVIEW_LEAD = "\u70B9\u6BCF\u7AE0\u7684\u300C\u25B8 \u5C55\u5F00\u7B2C N \u7AE0\u6B63\u6587\u300D\uFF1B\u6709\u610F\u89C1\u76F4\u63A5\u5199\uFF0CAI \u7167\u6539\uFF1B\u90FD\u6EE1\u610F\u5C31\u5408\u5E76\u6210\u4E66\u3001\u8FDB\u5165\u6700\u540E\u68C0\u67E5\u3002";
var DEMO_CHAPTERS_REVIEW_LEAD = "\u70B9\u6BCF\u7AE0\u7684\u300C\u25B8 \u5C55\u5F00\u7B2C N \u7AE0\u6B63\u6587\u300D\uFF1B\u6709\u610F\u89C1\u76F4\u63A5\u5199\uFF08\u6F14\u793A\u4E66\u91CC\u6CA1\u6709 AI \u7167\u5B83\u6539\uFF1A\u4F60\u81EA\u5DF1\u5199\u7684\u90A3\u6761\u8981\u653E\u884C\uFF0C\u5F97\u5148\u628A\u5B83\u64A4\u56DE\uFF09\uFF1B\u90FD\u6EE1\u610F\u5C31\u5408\u5E76\u6210\u4E66\u3001\u8FDB\u5165\u6700\u540E\u68C0\u67E5\u3002";
function chaptersReviewLead(meta) {
  if (isDemoBook(meta)) return DEMO_CHAPTERS_REVIEW_LEAD;
  return CHAPTERS_REVIEW_LEAD;
}
var CHAPTERS_FLOW_LEAD = "\u6BCF\u7AE0\u6D41\u7A0B\uFF1A\u5C0F\u52A9\u624B\u6267\u7B14 \u2192 \u5C0F\u52A9\u624B\u68C0\u67E5 \u2192 AI \u6700\u540E\u628A\u5173\u3002";
var DEMO_CHAPTERS_FLOW_LEAD = "\u6BCF\u7AE0\u6D41\u7A0B\uFF1A\u6F14\u793A\u4E66\u81EA\u5DF1\u628A\u8FD9\u4E00\u7AE0\u5199\u4E00\u904D\u3001\u518D\u68C0\u67E5\u4E00\u904D\uFF08\u8FD9\u91CC\u6CA1\u6709\u5C0F\u52A9\u624B\u3001\u4E5F\u6CA1\u6709 AI \u628A\u5173\uFF09\u3002";
function chaptersFlowLead(meta) {
  if (isDemoBook(meta)) return DEMO_CHAPTERS_FLOW_LEAD;
  return CHAPTERS_FLOW_LEAD;
}
var CHAPTERS_FLOW_OPINION_CLAUSE = "AI \u7167\u6539\uFF0C";
var DEMO_CHAPTERS_FLOW_OPINION_CLAUSE = "\u6F14\u793A\u4E66\u91CC\u6CA1\u6709 AI \u7167\u5B83\u6539\uFF0C";
function chaptersFlowOpinionClause(meta) {
  if (isDemoBook(meta)) return DEMO_CHAPTERS_FLOW_OPINION_CLAUSE;
  return CHAPTERS_FLOW_OPINION_CLAUSE;
}
var REVIEW_WRITE_HINT = "\u7ED9\u8FD9\u4E00\u7AE0\u5199\u4E00\u6761\u62BD\u67E5\u610F\u89C1\uFF0CAI \u7167\u6539\u540E\u7531\u4F60\u786E\u8BA4";
var DEMO_REVIEW_WRITE_HINT = "\u7ED9\u8FD9\u4E00\u7AE0\u5199\u4E00\u6761\u62BD\u67E5\u610F\u89C1\uFF08\u6F14\u793A\u4E66\u91CC\u6CA1\u6709 AI \u7167\u5B83\u6539\uFF1B\u8981\u653E\u884C\u5F97\u5148\u628A\u8FD9\u6761\u64A4\u56DE\uFF09";
function reviewWriteHint(meta) {
  if (isDemoBook(meta)) return DEMO_REVIEW_WRITE_HINT;
  return REVIEW_WRITE_HINT;
}
var FINAL_REDO_HEADING = "\u{1F9FE} \u4F60\u4E0A\u4E00\u8F6E\u7684\u610F\u89C1\uFF0C\u9010\u6761\u53BB\u5411";
var FINAL_REDO_FOOT = "\u8FD9\u4E9B\u53BB\u5411\u662F AI \u81EA\u5DF1\u4EA4\u4EE3\u7684\uFF1A\u673A\u5668\u53EA\u6838\u5BF9\u5B83\u6709\u6CA1\u6709\u9010\u6761\u4EA4\u4EE3\uFF0C\u4E0D\u6838\u5BF9\u529E\u5F97\u5BF9\u4E0D\u5BF9\u3002\u54EA\u4E00\u6761\u6CA1\u529E\uFF0C\u4F60\u5728\u8FD9\u91CC\u4E00\u773C\u770B\u5F97\u5230\u3002";
var FINAL_REDO_STATUS_UI = Object.freeze({
  done: { mark: "\u2705", text: "\u5DF2\u529E" },
  "not-done": { mark: "\u26A0\uFE0F", text: "\u6CA1\u529E" },
  superseded: { mark: "\u23ED", text: "\u4E0D\u9002\u7528\u4E86" }
});
var FINAL_REDO_MISSING = Object.freeze({ mark: "\u2753", text: "\u4EA4\u5DE5\u65F6\u6CA1\u6709\u4EA4\u4EE3" });
function finalRedoRows(meta) {
  const items = Array.isArray(meta?.finalRedoItems) ? meta.finalRedoItems : [];
  if (items.length === 0) return null;
  const check = Array.isArray(meta?.finalRedoCheck) ? meta.finalRedoCheck : [];
  const byIndex = /* @__PURE__ */ new Map();
  for (const entry of check) {
    if (Number.isSafeInteger(entry?.index)) byIndex.set(entry.index, entry);
  }
  return items.map((item) => {
    const entry = byIndex.get(item?.index) ?? null;
    const ui = entry === null ? FINAL_REDO_MISSING : FINAL_REDO_STATUS_UI[entry.status] ?? {
      mark: "\u2753",
      text: typeof entry.status === "string" ? entry.status : "\u53BB\u5411\u8BFB\u4E0D\u51FA\u6765"
    };
    return {
      index: Number.isSafeInteger(item?.index) ? item.index : null,
      quote: typeof item?.quote === "string" ? item.quote : "",
      status: entry === null ? null : entry.status ?? null,
      mark: ui.mark,
      statusText: ui.text,
      note: typeof entry?.note === "string" ? entry.note : "",
      where: typeof entry?.where === "string" ? entry.where : ""
    };
  });
}
var FINAL_APPROVAL_NOTE = "\u8FD9\u662F\u4F60\u5BF9\u6574\u672C\u4E66\u7684\u6700\u540E\u4E00\u6B21\u628A\u5173\uFF1A\u6EE1\u610F\u5C31\u8BA4\u53EF\u4EA4\u4ED8\uFF1B\u8981\u6539\u7684\u5199\u4E00\u53E5\u610F\u89C1\uFF0CAI \u4F1A\u7167\u7740\u6539\u6574\u672C\u540E\u91CD\u65B0\u505A\u6700\u540E\u68C0\u67E5\u3002";
var DEMO_FINAL_APPROVAL_NOTE = "\u8FD9\u662F\u4F60\u5BF9\u6574\u672C\u4E66\u7684\u6700\u540E\u4E00\u6B21\u628A\u5173\uFF1A\u6EE1\u610F\u5C31\u8BA4\u53EF\u4EA4\u4ED8\uFF1B\u8981\u6539\u7684\u5199\u4E00\u53E5\u610F\u89C1\u2014\u2014\u6F14\u793A\u4E66\u4F1A\u628A\u6700\u540E\u68C0\u67E5\u539F\u6837\u91CD\u8DD1\u4E00\u904D\uFF08\u6CA1\u6709 AI \u53C2\u4E0E\uFF1B\u4F60\u5199\u7684\u90A3\u53E5\u4E0D\u4F1A\u8FDB\u53BB\uFF09\u3002";
function finalApprovalNote(meta) {
  if (isDemoBook(meta)) return DEMO_FINAL_APPROVAL_NOTE;
  return FINAL_APPROVAL_NOTE;
}
var FINAL_APPROVAL_NEED_NOTE = "\u26A0\uFE0F \u5148\u5728\u4E0A\u9762\u5199\u4E00\u53E5\u300C\u8981\u6539\u4EC0\u4E48\u300D\uFF0C\u518D\u70B9\u300C\u4E0D\u6EE1\u610F\u300D\u2014\u2014AI \u5F97\u7167\u7740\u4F60\u8FD9\u53E5\u8BDD\u6539\u6574\u672C\u3002";
var DEMO_FINAL_APPROVAL_NEED_NOTE = "\u26A0\uFE0F \u5148\u5728\u4E0A\u9762\u5199\u4E00\u53E5\u300C\u8981\u6539\u4EC0\u4E48\u300D\uFF0C\u518D\u70B9\u300C\u4E0D\u6EE1\u610F\u300D\u2014\u2014\u6F14\u793A\u4E66\u8981\u6709\u4E00\u53E5\u8BDD\u624D\u4F1A\u628A\u6700\u540E\u68C0\u67E5\u91CD\u8DD1\u4E00\u904D\u3002";
function finalApprovalNeedNote(meta) {
  if (isDemoBook(meta)) return DEMO_FINAL_APPROVAL_NEED_NOTE;
  return FINAL_APPROVAL_NEED_NOTE;
}
var GOLD_REWRITE_HINT = "\u4ECE\u5934\u91CD\u5199\u8FD9\u4E00\u7AE0\uFF1B\u8FD8\u6CA1\u5904\u7406\u7684\u610F\u89C1\u4F1A\u4E00\u5E76\u5E26\u7ED9 AI \u5F53\u65B9\u5411";
var DEMO_GOLD_REWRITE_HINT = "\u4ECE\u5934\u91CD\u5199\u8FD9\u4E00\u7AE0\uFF08\u6F14\u793A\u4E66\u91CC\u6CA1\u6709 AI\uFF09\uFF1B\u8FD8\u6CA1\u5904\u7406\u7684\u610F\u89C1\u4F1A\u4E00\u5E76\u7EC7\u8FDB\u65B0\u7A3F";
function goldRewriteHint(meta) {
  if (isDemoBook(meta)) return DEMO_GOLD_REWRITE_HINT;
  return GOLD_REWRITE_HINT;
}
var GOLD_REWRITE_CONFIRM_NOTE = "\u6574\u7A3F\u4E22\u5F03\u91CD\u5199\uFF1A\u8FD9\u4E00\u7A3F\u4F1A\u5F52\u6863\u7559\u5E95\uFF0CAI \u4ECE\u5934\u518D\u5199\u4E00\u7248\u3002";
var DEMO_GOLD_REWRITE_CONFIRM_NOTE = "\u6574\u7A3F\u4E22\u5F03\u91CD\u5199\uFF1A\u8FD9\u4E00\u7A3F\u4F1A\u5F52\u6863\u7559\u5E95\uFF0C\u6F14\u793A\u4E66\u4F1A\u81EA\u5DF1\u4ECE\u5934\u518D\u5199\u4E00\u7248\uFF08\u6CA1\u6709 AI \u53C2\u4E0E\uFF09\u3002";
function goldRewriteConfirmNote(meta) {
  if (isDemoBook(meta)) return DEMO_GOLD_REWRITE_CONFIRM_NOTE;
  return GOLD_REWRITE_CONFIRM_NOTE;
}
var STYLE_NOTES_PANEL_TITLE = "\u4F60\u7684\u98CE\u683C\u610F\u89C1\u6E05\u5355\uFF08AI \u5199\u6BCF\u4E00\u7AE0\u90FD\u4F1A\u7167\u7740\u529E\uFF09";
var DEMO_STYLE_NOTES_PANEL_TITLE = "\u4F60\u7684\u98CE\u683C\u610F\u89C1\u6E05\u5355\uFF08\u6F14\u793A\u4E66\u91CC\u6CA1\u6709 AI \u5199\u7AE0\uFF1B\u8FD9\u51E0\u6761\u53EA\u8BB0\u5728\u8FD9\u91CC\uFF09";
function styleNotesPanelTitle(meta) {
  if (isDemoBook(meta)) return DEMO_STYLE_NOTES_PANEL_TITLE;
  return STYLE_NOTES_PANEL_TITLE;
}
var STYLE_LINE_PANEL_HEADING = (count) => `\u{1F3A8} \u4F60\u7684\u98CE\u683C\u7EBF\uFF08${count} \u6761\uFF1AAI \u5199\u6BCF\u4E00\u7AE0\u90FD\u7167\u7740\u529E\uFF09`;
var DEMO_STYLE_LINE_PANEL_HEADING = (count) => `\u{1F3A8} \u4F60\u7684\u98CE\u683C\u7EBF\uFF08${count} \u6761\uFF1A\u6F14\u793A\u4E66\u91CC\u6CA1\u6709 AI \u5199\u7AE0\uFF0C\u8FD9\u51E0\u6761\u53EA\u8BB0\u5728\u8FD9\u91CC\uFF09`;
function styleLinePanelHeading(meta, count) {
  if (isDemoBook(meta)) return DEMO_STYLE_LINE_PANEL_HEADING(count);
  return STYLE_LINE_PANEL_HEADING(count);
}
var STYLE_LINE_PANEL_HINT = "\u60F3\u518D\u8BB0\u4E00\u6761\uFF1F\u5728\u5BF9\u8BDD\u91CC\u76F4\u63A5\u8DDF AI \u8BF4\uFF0C\u5B83\u4F1A\u8BB0\u6210\u98CE\u683C\u7EBF\uFF1B\u5199\u6BCF\u4E00\u7AE0\u90FD\u7167\u7740\u529E\u3002";
var DEMO_STYLE_LINE_PANEL_HINT = "\u60F3\u518D\u8BB0\u4E00\u6761\uFF1F\u6F14\u793A\u4E66\u91CC\u6CA1\u6709 AI \u66FF\u4F60\u8BB0\u98CE\u683C\u7EBF\uFF1A\u4E0B\u9762\u8FD9\u51E0\u6761\u662F\u6F14\u793A\u901A\u9053\u81EA\u5E26\u7684\u793A\u4F8B\u3002";
function styleLinePanelHint(meta) {
  if (isDemoBook(meta)) return DEMO_STYLE_LINE_PANEL_HINT;
  return STYLE_LINE_PANEL_HINT;
}
var PATTERN_PASTE_HINT = "\u7C98\u8D34\u4E00\u6BB5\u4F60\u60F3\u8981\u7684\u6559\u6CD5/\u7AE0\u8282\u7ED3\u6784\u63CF\u8FF0\uFF0CAI \u4F1A\u628A\u5B83\u63D0\u70BC\u6210\u4E00\u5F20\u300C\u6A21\u5F0F\u5361\u300D\u52A0\u5165\u8FD9\u672C\u4E66\u7684\u6A21\u5F0F\u5E93\uFF1B\u7B2C 2 \u6B21\u62CD\u677F\u300C\u6559\u5B66\u65B9\u6CD5\u4E0E\u677F\u5757\u300D\u548C\u5199\u4F5C\u89C4\u8303\u90FD\u4F1A\u4F18\u5148\u53C2\u8003\u5B83\u3002";
var DEMO_PATTERN_PASTE_HINT = "\u7C98\u8D34\u4E00\u6BB5\u4F60\u60F3\u8981\u7684\u6559\u6CD5/\u7AE0\u8282\u7ED3\u6784\u63CF\u8FF0\uFF1A\u6F14\u793A\u4E66\u91CC\u6CA1\u6709 AI\uFF0C\u5B83\u4F1A\u6309\u5360\u4F4D\u9020\u4E00\u5F20\u6F14\u793A\u6A21\u5F0F\u5361\u52A0\u8FDB\u8FD9\u672C\u4E66\u7684\u6A21\u5F0F\u5E93\uFF08\u90A3\u5F20\u5361\u4E0A\u81EA\u5DF1\u5199\u7740\u300C\u771F\u5B9E\u6A21\u5F0F\u7531 AI \u5206\u6790\u751F\u6210\u300D\uFF09\u3002";
function patternPasteHint(meta) {
  if (isDemoBook(meta)) return DEMO_PATTERN_PASTE_HINT;
  return PATTERN_PASTE_HINT;
}
var PATTERN_PASTE_PLACEHOLDER = "\u7C98\u8D34\u4E00\u6BB5\u4F60\u60F3\u8981\u7684\u6559\u6CD5/\u7ED3\u6784\u63CF\u8FF0\uFF0CAI \u4F1A\u628A\u5B83\u52A0\u8FDB\u8FD9\u672C\u4E66\u7684\u6A21\u5F0F\u5E93";
var DEMO_PATTERN_PASTE_PLACEHOLDER = "\u7C98\u8D34\u4E00\u6BB5\u4F60\u60F3\u8981\u7684\u6559\u6CD5/\u7ED3\u6784\u63CF\u8FF0\uFF08\u6F14\u793A\u4E66\u4F1A\u6309\u5360\u4F4D\u9020\u4E00\u5F20\u6F14\u793A\u6A21\u5F0F\u5361\uFF09";
function patternPastePlaceholder(meta) {
  if (isDemoBook(meta)) return DEMO_PATTERN_PASTE_PLACEHOLDER;
  return PATTERN_PASTE_PLACEHOLDER;
}

// src/ui/book-session-scope.js
var NO_SUGGESTIONS = Object.freeze([]);
var NO_PATTERNS = Object.freeze([]);
var NO_DROPPED = Object.freeze([]);
var NO_EVENTS = Object.freeze([]);
function BookSessionScope({ children, uiRef = null, meta = null, gate = null, events = NO_EVENTS }) {
  const [viewPhase, setViewPhase] = (0, import_react14.useState)(null);
  const [browsing, setBrowsing] = (0, import_react14.useState)(null);
  const [showHistory, setShowHistory] = (0, import_react14.useState)(false);
  const [gateOpen, setGateOpen] = (0, import_react14.useState)(null);
  const [showStylePanel, setShowStylePanel] = (0, import_react14.useState)(false);
  const [showIntervenePanel, setShowIntervenePanel] = (0, import_react14.useState)(false);
  const [patternOpen, setPatternOpen] = (0, import_react14.useState)(false);
  const [patternBusy, setPatternBusy] = (0, import_react14.useState)(false);
  const [patternResult, setPatternResult] = (0, import_react14.useState)(null);
  const [patternList, setPatternList] = (0, import_react14.useState)(NO_PATTERNS);
  const [readerQuestionnaireOpen, setReaderQuestionnaireOpen] = (0, import_react14.useState)(false);
  const [readerQuestionnaireBusy, setReaderQuestionnaireBusy] = (0, import_react14.useState)(false);
  const [readerQuestionnaireIssued, setReaderQuestionnaireIssued] = (0, import_react14.useState)(null);
  const [readerQuestionnaireSaved, setReaderQuestionnaireSaved] = (0, import_react14.useState)(false);
  const [readerQuestionnaireReceipt, setReaderQuestionnaireReceipt] = (0, import_react14.useState)(null);
  const [awaitBanner, setAwaitBanner] = (0, import_react14.useState)(false);
  const [progressBanner, setProgressBanner] = (0, import_react14.useState)(false);
  const [noteToast, setNoteToast] = (0, import_react14.useState)(false);
  const [suggestions, setSuggestions] = (0, import_react14.useState)(NO_SUGGESTIONS);
  const [suggestLoading, setSuggestLoading] = (0, import_react14.useState)(false);
  const [deletingId, setDeletingId] = (0, import_react14.useState)(null);
  const [graphDropped, setGraphDropped] = (0, import_react14.useState)(NO_DROPPED);
  const [error, setError] = (0, import_react14.useState)(null);
  const [busy, setBusy] = (0, import_react14.useState)(false);
  const progressSeqRef = (0, import_react14.useRef)(-1);
  const awaitingSeenRef = (0, import_react14.useRef)(false);
  const commands = (0, import_react14.useMemo)(
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
      setGraphDropped,
      setSuggestions,
      setSuggestLoading,
      setPatternBusy,
      setPatternResult,
      setPatternList,
      setReaderQuestionnaireOpen,
      setReaderQuestionnaireBusy,
      setReaderQuestionnaireIssued,
      setReaderQuestionnaireSaved,
      setReaderQuestionnaireReceipt,
      toggleStylePanel: () => setShowStylePanel((v) => !v),
      toggleIntervenePanel: () => setShowIntervenePanel((v) => !v)
    }),
    []
  );
  if (uiRef !== null) uiRef.current = commands;
  (0, import_react14.useEffect)(() => {
    if (!noteToast) return void 0;
    const timer = setTimeout(() => setNoteToast(false), 6e3);
    return () => clearTimeout(timer);
  }, [noteToast]);
  (0, import_react14.useEffect)(() => {
    if (!awaitBanner) return void 0;
    const timer = setTimeout(() => setAwaitBanner(false), 6e3);
    return () => clearTimeout(timer);
  }, [awaitBanner]);
  (0, import_react14.useEffect)(() => {
    const st = meta?.status;
    const awaiting = typeof st === "string" && st.startsWith("awaiting-") || gate !== null && gate.status === "awaiting";
    if (shouldForceBackToNow(awaitingSeenRef.current, awaiting, browsing !== null)) {
      setBrowsing(null);
      setAwaitBanner(true);
    }
    awaitingSeenRef.current = awaiting;
  }, [meta?.status, browsing, gate]);
  (0, import_react14.useEffect)(() => {
    if (browsing === null) return void 0;
    const lastProgress = lastEventOfType(events, "textbook/progress");
    if (lastProgress !== void 0 && lastProgress.seq > progressSeqRef.current) {
      progressSeqRef.current = lastProgress.seq;
      setProgressBanner(true);
    }
    return void 0;
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
    readerQuestionnaireOpen,
    readerQuestionnaireBusy,
    readerQuestionnaireIssued,
    readerQuestionnaireSaved,
    readerQuestionnaireReceipt,
    awaitBanner,
    progressBanner,
    noteToast,
    suggestions,
    suggestLoading,
    deletingId,
    graphDropped,
    error,
    busy,
    progressSeqRef,
    awaitingSeenRef
  };
  return (0, import_react14.createElement)(import_react14.Fragment, null, typeof children === "function" ? children(ui) : children);
}

// src/ui/stage-step-model.js
function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const key of Object.keys(value)) deepFreeze(value[key]);
  return value;
}
var CHAPTER_STEPS = Object.freeze([
  { key: "write", name: "\u5199" },
  { key: "audit", name: "\u5BA1" },
  { key: "finalize", name: "\u590D\u6838" }
]);
var SEGMENT_STEP_TITLE = Object.freeze({ final: "\u6700\u540E\u68C0\u67E5\u4E0E\u4EA4\u4ED8" });
var MATERIAL_STEP_KEY = "material";
var GOLD_SOURCE_NOTE = "\u6700\u4F73\u8303\u4F8B\u7AE0\uFF0C\u7B2C 4 \u9636\u6BB5\u5DF2\u5199";
var chapterStepKey = (segmentKey, stepKey) => `${segmentKey}:${stepKey}`;
var STEP_ICON = Object.freeze({ done: "\u2713", "waiting-user": "\u26A1", active: "\u25B6", pending: "\u25CB" });
var stepIcon = (state) => STEP_ICON[state] ?? STEP_ICON.pending;
var buildRowText = (title, status, statusWord) => {
  const word = typeof statusWord === "string" && statusWord !== "" ? statusWord : stepWord(status);
  return `${stepIcon(status)} ${title ?? ""}\uFF08${word}\uFF09`;
};
var CHAPTER_STAGE_STEPS = Object.freeze({
  writing: Object.freeze(["active", "pending", "pending"]),
  auditing: Object.freeze(["done", "active", "pending"]),
  audited: Object.freeze(["done", "done", "pending"]),
  finalizing: Object.freeze(["done", "done", "active"])
});
var CHAPTER_STEPS_UNPLACED = Object.freeze(["active", "pending", "pending"]);
function chapterStepStatuses(stage, segStatus, claimed) {
  if (segStatus === "done") return ["done", "done", "done"];
  if (stage === "done") return ["done", "done", "done"];
  if (segStatus === "waiting-user") return ["waiting-user", "pending", "pending"];
  if (claimed !== true) return ["pending", "pending", "pending"];
  return CHAPTER_STAGE_STEPS[stage] ?? CHAPTER_STEPS_UNPLACED;
}
function materialStepStatus(meta, segments) {
  const phase = Number.isInteger(meta?.phase) ? meta.phase : null;
  if (phase !== null) {
    if (phase >= 2) return "done";
    return phase === 1 && meta?.status === "running" ? "active" : "waiting-user";
  }
  const explore = segments.find((seg) => seg?.key === "explore");
  return explore !== void 0 && explore.status !== "pending" ? "done" : "pending";
}
function chapterCountOf(segments, meta) {
  const planned = Array.isArray(meta?.outline?.chapters) ? meta.outline.chapters.length : 0;
  const fromSegments = segments.filter((seg) => seg?.kind === "chapter").length;
  return Math.max(planned, fromSegments);
}
function chapterNoOfSegment(seg, ordinal) {
  const match = /^chapter-(\d+)$/.exec(String(seg?.key ?? ""));
  return match === null ? ordinal : Number(match[1]);
}
function chapterPipelineStage(meta, chapterNo) {
  const pipeline = Array.isArray(meta?.chapterPipeline) ? meta.chapterPipeline : [];
  const entry = pipeline[chapterNo - 1];
  return entry !== null && typeof entry === "object" ? entry.stage ?? null : null;
}
var CHAPTER_NOT_DONE_YET_WORD = "\u8FD8\u6CA1\u5B8C\u6210";
function chapterStartedOnDisk(seg) {
  if (seg === null || seg === void 0) return false;
  if (Array.isArray(seg.artifactFacts) && seg.artifactFacts.some((fact) => fact !== null && typeof fact === "object" && fact.path !== void 0)) return true;
  const artifacts = Array.isArray(seg.artifacts) ? seg.artifacts : [];
  return artifacts.some((rel) => typeof rel === "string" && rel !== "");
}
function chapterStatusWord(status, stage, seg, claimed) {
  if (status !== "pending") return null;
  if (claimed === true && typeof stage === "string" && stage !== "") return null;
  if (chapterStartedOnDisk(seg)) return CHAPTER_NOT_DONE_YET_WORD;
  return null;
}
function chapterStepPhase(seg) {
  const phase = seg === null || seg === void 0 ? null : phaseOfSegment(seg);
  return Number.isInteger(phase) ? phase : SEGMENT_PHASE.chapter;
}
function stepDetailFields(step, meta) {
  let sourceNote = null;
  const chapterStep = Number.isSafeInteger(step?.chapter) && step.chapter >= 1;
  const writeStep = chapterStep && String(step?.key ?? "").endsWith(":write");
  const factText = chapterStep && !writeStep ? "" : artifactFactText(step?.segment);
  const explicitlyGold = Number.isSafeInteger(meta?.goldChapter) && meta.goldChapter >= 1 && meta.goldChapter === step?.chapter;
  const phaseAtOrAfterGold = Number.isInteger(meta?.phase) && meta.phase >= 4;
  if (writeStep && explicitlyGold && phaseAtOrAfterGold) sourceNote = GOLD_SOURCE_NOTE;
  const detailLines = [];
  if (sourceNote !== null) detailLines.push(sourceNote);
  if (factText !== "") detailLines.push(factText);
  return { detailLines, factText, sourceNote };
}
function downstreamNames(seg, segments) {
  const keys = Array.isArray(seg?.downstream) ? seg.downstream : [];
  const byKey = /* @__PURE__ */ new Map();
  for (const s of segments)
    if (s?.key !== void 0 && s?.key !== null) byKey.set(String(s.key), s);
  const selfKey = seg?.key === void 0 || seg?.key === null ? null : String(seg.key);
  const names = [];
  const seen = /* @__PURE__ */ new Set();
  for (const raw of keys) {
    const key = String(raw ?? "");
    if (key === "" || key === selfKey) continue;
    const s = byKey.get(key);
    const name = s === void 0 ? segmentHuman(key) : segmentHuman(s);
    if (name === "" || name === key) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names;
}
function makeRow(step, segments, enriched) {
  const status = step.status;
  const statusWord = typeof step.statusWord === "string" && step.statusWord !== "" ? step.statusWord : stepWord(status);
  const segmentKey = step.segmentKey ?? null;
  const validSegment = typeof segmentKey === "string" && segmentKey !== "";
  const canModify = validSegment && step.canDeepModify === true;
  const base = {
    key: step.key,
    no: step.no,
    phase: step.phase,
    title: step.title,
    status,
    statusWord,
    rowText: buildRowText(step.title, status, statusWord),
    // 只读导航目标：有真实段 → 步 key；材料准备 / 合成章步 → 阶段号。
    target: validSegment ? { kind: "step", ref: step.key } : { kind: "phase", phase: step.phase },
    // 写意图：只有「有真实段 且 段允许定点修改」才给 modify 目标（ADR-0014 粒度＝分段）。
    modify: canModify ? { segmentKey } : null,
    detailLines: step.detailLines ?? [],
    factText: step.factText ?? "",
    sourceNote: step.sourceNote ?? null
  };
  if (!enriched) return base;
  return {
    ...base,
    chapter: step.chapter,
    segmentKey,
    canDeepModify: canModify,
    auditSummary: step.segment?.auditSummary ?? null,
    decision: decisionText(step.segment),
    artifacts: openableArtifacts(step.segment),
    downstream: downstreamNames(step.segment, segments)
  };
}
function deriveSteps(meta, segments, chapterClaims) {
  const steps = [];
  const pushMaterialStep = () => {
    const status = materialStepStatus(meta, segments);
    const step = {
      key: MATERIAL_STEP_KEY,
      no: 0,
      title: PHASE_UI[1] ?? "",
      phase: 1,
      status,
      chapter: null,
      segmentKey: null,
      segment: null,
      canDeepModify: false
    };
    steps.push({ ...step, ...stepDetailFields(step, meta) });
  };
  const pushChapterSteps = (n, seg) => {
    const stage = seg?.stage ?? chapterPipelineStage(meta, n);
    const claimed = chapterClaims.has(n);
    const statuses = chapterStepStatuses(stage, seg?.status, claimed);
    const segmentKey = seg?.key ?? `chapter-${n}`;
    for (let i = 0; i < CHAPTER_STEPS.length; i += 1) {
      const step = {
        key: chapterStepKey(segmentKey, CHAPTER_STEPS[i].key),
        no: 0,
        title: `\u7B2C ${n} \u7AE0 ${CHAPTER_STEPS[i].name}`,
        phase: chapterStepPhase(seg),
        status: statuses[i],
        // 票 24（P17）：这一档的说法由「产物在不在盘上」决定，不让 UI 自己猜。
        statusWord: chapterStatusWord(statuses[i], stage, seg, claimed),
        chapter: n,
        segmentKey: seg?.key ?? null,
        segment: seg ?? null,
        canDeepModify: seg?.canDeepModify === true
      };
      steps.push({ ...step, ...stepDetailFields(step, meta) });
    }
  };
  const pushSegmentStep = (seg) => {
    const step = {
      key: String(seg?.key ?? ""),
      no: 0,
      title: SEGMENT_STEP_TITLE[seg?.key] ?? segmentHuman(seg),
      phase: phaseOfSegment(seg),
      status: seg?.status ?? "pending",
      chapter: null,
      segmentKey: seg?.key ?? null,
      segment: seg ?? null,
      canDeepModify: seg?.canDeepModify === true
    };
    steps.push({ ...step, ...stepDetailFields(step, meta) });
  };
  pushMaterialStep();
  const chapterSegs = segments.filter((seg) => seg?.kind === "chapter").map((seg, index) => ({ seg, n: chapterNoOfSegment(seg, index + 1) })).sort((a, b) => a.n - b.n);
  const byChapterNo = new Map(chapterSegs.map((row) => [row.n, row.seg]));
  const chapterTotal = chapterCountOf(segments, meta);
  for (let phase = 2; phase <= 6; phase += 1) {
    const rows = segments.filter((seg) => phaseOfSegment(seg) === phase);
    if (phase === 5) {
      for (let n = 1; n <= chapterTotal; n += 1) pushChapterSteps(n, byChapterNo.get(n));
      for (const seg of rows) if (seg?.kind !== "chapter") pushSegmentStep(seg);
      continue;
    }
    for (const seg of rows) pushSegmentStep(seg);
  }
  for (const seg of segments) if (phaseOfSegment(seg) === null) pushSegmentStep(seg);
  return steps.map((step, index) => ({ ...step, no: index + 1 }));
}
function buildSnapshot({ meta, segments, runningSubagentCount }) {
  const normMeta = meta ?? void 0;
  const normSegments = Array.isArray(segments) ? segments : [];
  const chapterClaims = indexRunningChapterClaims(normSegments, runningSubagentCount);
  const steps = deriveSteps(normMeta, normSegments, chapterClaims);
  const overviewRows = steps.map((step) => makeRow(step, normSegments, false));
  const phaseRows = steps.map((step) => makeRow(step, normSegments, true));
  const rowByStepKey = /* @__PURE__ */ new Map();
  const rowBySegmentKey = /* @__PURE__ */ new Map();
  for (const row of phaseRows) {
    if (!rowByStepKey.has(row.key)) rowByStepKey.set(row.key, row);
    if (row.segmentKey !== null && !rowBySegmentKey.has(row.segmentKey))
      rowBySegmentKey.set(row.segmentKey, row);
  }
  const chapters = chapterCountOf(normSegments, normMeta);
  const counts = {
    chapters,
    chaptersPlanned: chapters > 0,
    known: steps.length,
    total: chapters > 0 ? 3 * chapters + 10 : null,
    remaining: steps.filter((step) => step.status !== "done").length
  };
  const artifactEntryCountByPhase = {};
  for (const seg of normSegments) {
    const phase = phaseOfSegment(seg);
    if (phase === null) continue;
    artifactEntryCountByPhase[phase] = (artifactEntryCountByPhase[phase] ?? 0) + openableArtifacts(seg).length;
  }
  const materialCount = Array.isArray(normMeta?.sources) ? normMeta.sources.length : 0;
  return {
    meta: normMeta,
    segments: normSegments,
    steps,
    overviewRows,
    phaseRows,
    rowByStepKey,
    rowBySegmentKey,
    counts,
    artifactEntryCountByPhase,
    materialCount
  };
}
function groupRows(overviewRows) {
  const groups = [];
  for (const row of overviewRows) {
    const phase = row.phase ?? null;
    const last = groups[groups.length - 1];
    if (last !== void 0 && last.phase === phase) last.rows.push(row);
    else groups.push({ phase, rows: [row] });
  }
  return groups;
}
function projectOverview(snapshot) {
  const { counts } = snapshot;
  const headline = counts.chaptersPlanned ? `\u5168\u4E66 ${counts.total} \u6B65\uFF0C${counts.remaining === 0 ? "\u5DF2\u5168\u90E8\u5B8C\u6210" : `\u8FD8\u5269 ${counts.remaining} \u6B65`}` : `\u5DF2\u77E5 ${counts.known} \u6B65\uFF0C\u7AE0\u8282\u6392\u5B9A\u540E\u8865\u9F50`;
  const currentPhase = Number.isInteger(snapshot.meta?.phase) ? snapshot.meta.phase : 1;
  const currentPhaseText = `\u73B0\u5728\u5728\u7B2C ${currentPhase} \u9636\u6BB5\uFF1A${PHASE_UI[currentPhase] ?? ""}`;
  return {
    kind: "overview",
    headline,
    currentPhaseText,
    counts: { ...counts },
    groups: groupRows(snapshot.overviewRows),
    artifactEntryCountByPhase: { ...snapshot.artifactEntryCountByPhase },
    // 阶段 1 那一格要的读数（材料清单的份数），与上面那份产物计数**并列而不同源**
    // （票 walkthrough-2026-10/03）：那一格没有分段，靠上面那份表恒为 0。
    materialCount: snapshot.materialCount
  };
}
function projectPhase(snapshot, request) {
  const phase = request.phase;
  const focus = request.focus ?? null;
  const optimistic = typeof request.optimisticSegmentKey === "string" && request.optimisticSegmentKey !== "" ? request.optimisticSegmentKey : null;
  let rows = snapshot.phaseRows.filter((row) => row.phase === phase);
  if (optimistic !== null) {
    rows = rows.map((row) => {
      if (row.segmentKey !== optimistic) return row;
      const statusWord = stepWord("active");
      return {
        ...row,
        status: "active",
        statusWord,
        rowText: buildRowText(row.title, "active", statusWord)
      };
    });
  }
  const focusedStepKey = (() => {
    if (focus === null || focus === void 0) return null;
    const key = String(focus);
    const byStep = snapshot.rowByStepKey.get(key);
    if (byStep !== void 0) return byStep.phase === phase ? byStep.key : null;
    const bySegment = snapshot.rowBySegmentKey.get(key);
    return bySegment !== void 0 && bySegment.phase === phase ? bySegment.key : null;
  })();
  const doneCount = rows.filter((row) => row.status === "done").length;
  const uniqueFileCount = new Set(rows.flatMap((row) => row.artifacts.map((item) => item.path))).size;
  return {
    kind: "phase",
    phase,
    name: PHASE_UI[phase] ?? String(phase),
    // ⚠️ 抬头那一句**带生效条件**（票 `pre-gold-build/08` 的承诺面②）：阶段 5 的「每章机器检查过」
    // 在演示书与勾过 `audit-skip` 豁免的书上**零判据**，`phaseIntro` 在那两支换一句实话。
    // 唯一出口就是这里——阶段页只摆 `page.intro`，⛔ 别处不许自己拼这句。
    intro: phaseIntro(phase, snapshot.meta),
    rows,
    focusedStepKey,
    doneCount,
    uniqueFileCount
  };
}
function projectFocus(snapshot, request) {
  const fallbackPhase = Number.isInteger(request.fallbackPhase) ? request.fallbackPhase : 1;
  const ref = request.ref ?? null;
  if (ref === null || ref === void 0) {
    return { kind: "focus", phase: fallbackPhase, stepKey: null, segmentKey: null, matchedBy: "none" };
  }
  const key = String(ref);
  const byStep = snapshot.rowByStepKey.get(key);
  if (byStep !== void 0) {
    return {
      kind: "focus",
      phase: byStep.phase,
      stepKey: byStep.key,
      segmentKey: byStep.segmentKey,
      matchedBy: "step"
    };
  }
  const bySegment = snapshot.rowBySegmentKey.get(key);
  if (bySegment !== void 0) {
    return {
      kind: "focus",
      phase: bySegment.phase,
      stepKey: bySegment.key,
      segmentKey: bySegment.segmentKey,
      matchedBy: "segment"
    };
  }
  return { kind: "focus", phase: fallbackPhase, stepKey: null, segmentKey: null, matchedBy: "fallback" };
}
function createStageStepProjector(input) {
  const snapshot = buildSnapshot(input ?? {});
  const project = (request) => {
    if (request === null || typeof request !== "object") {
      throw new Error("project(request) \u8981\u4E00\u4E2A\u5E26 kind \u7684 request");
    }
    let result;
    if (request.kind === "overview") result = projectOverview(snapshot);
    else if (request.kind === "phase") result = projectPhase(snapshot, request);
    else if (request.kind === "focus") result = projectFocus(snapshot, request);
    else throw new Error(`project \u6536\u5230\u4E0D\u8BA4\u8BC6\u7684 kind\uFF1A${String(request.kind)}`);
    return deepFreeze(result);
  };
  return Object.freeze({ project });
}

// src/ui/file-address.js
var FILE_ADDRESS_PREFIX = "dsh-resource://file/";
function encodeSegment(segment) {
  return encodeURIComponent(segment).replace(/%3A/gi, ":");
}
function sessionFileAddress(sessionId, path) {
  const normalized = String(path ?? "").replace(/\\/g, "/").replace(/^(?:\.\/)+/, "");
  return `${FILE_ADDRESS_PREFIX}session/${encodeSegment(String(sessionId ?? ""))}/${normalized.split("/").map(encodeSegment).join("/")}`;
}
function fileAddressFor(sessionId, cwd, path) {
  const normalized = String(path ?? "").replace(/\\/g, "/");
  const root = typeof cwd === "string" && cwd !== "" ? cwd.replace(/\\/g, "/").replace(/\/+$/, "") : "";
  if (root !== "" && (normalized.startsWith(`${root}/`) || normalized === root)) {
    const rel = normalized.slice(root.length).replace(/^\/+/, "");
    return sessionFileAddress(sessionId, rel);
  }
  return sessionFileAddress(sessionId, normalized);
}
function bookFileAddress(sessionId, cwd, bookDir, rel) {
  const inner = String(rel ?? "").replace(/\\/g, "/").replace(/^(?:\.\/)+/, "");
  const dir = typeof bookDir === "string" ? bookDir.replace(/\\/g, "/").replace(/\/+$/, "") : "";
  const absolute = dir === "" ? inner : `${dir}/${inner}`;
  return fileAddressFor(sessionId, cwd, absolute);
}

// src/ui/artifact-read.js
function identityOf(sessionId, projectId) {
  if (projectId === null || projectId === void 0) return null;
  return `session=${encodeURIComponent(sessionId)}&project=${encodeURIComponent(projectId)}`;
}
function createArtifactReader({
  sessionId,
  projectId,
  fetchImpl = globalThis.fetch
}) {
  const href = (route, rel) => {
    const identity = identityOf(sessionId, projectId);
    if (identity === null) return null;
    return `/textbook/${route}?${identity}&path=${encodeURIComponent(rel)}`;
  };
  return {
    /**
     * 读一份产物的正文。
     *
     * 非 2xx → `reject(new Error("HTTP <status>"))`（**错误原文是调用点与测试都认的那一句**，
     * 收编前三条实现逐字相同，不许改写）。网络失败 → 原样 reject。
     * 「读不到怎么办」不由本函数决定，见文件头「刻意不做的事」。
     *
     * @param {string} rel 书文件夹相对路径（形如 `工作区/chapter-01.md`）
     * @returns {Promise<string>}
     */
    readText(rel) {
      const url = href("file", rel);
      if (url === null) {
        return Promise.reject(new Error("\u6CA1\u6709\u5F53\u524D\u4E66\uFF0C\u8BFB\u4E0D\u4E86\u4EA7\u7269"));
      }
      return fetchImpl(url).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      });
    },
    /**
     * 附件下载的地址（给 `<a href>` 用，**不是** fetch——没有 `res.ok`、没有错误条）。
     *
     * @param {string} rel 书文件夹相对路径
     * @returns {string|null} 无当前书时返回 null（调用点据此不渲染那颗下载键）
     */
    downloadHref(rel) {
      return href("download", rel);
    }
  };
}

// src/ui/phase-page.js
var import_react17 = require("react");

// src/ui/knowledge-graph-backfill.js
var import_react15 = require("react");
var GRAPH_BACKFILL_KEY_TEXT = "\u8865\u4E00\u4EFD\u77E5\u8BC6\u70B9\u56FE";
var GRAPH_BACKFILL_NOTE = "\u6309\u5DF2\u6709\u7EC6\u76EE\uFF0B\u56DE\u539F\u6587\u8865\u51FA\u6765\u7684\uFF1B\u5DF2\u5199\uFF0F\u5DF2\u4EA4\u4ED8\u7684\u7AE0\u4E00\u4E2A\u5B57\u6CA1\u52A8";
var GRAPH_BACKFILL_RECEIPT = "\u2705 \u8865\u597D\u4E86\u3002\u8FD9\u4EFD\u56FE\u53EA\u8BFB\u2014\u2014\u770B\u5F97\u5230\u4E09\u6001\u4E0E\u7BAD\u5934\uFF0C\u6539\u4E0D\u4E86\uFF1B\u8981\u6539\u524D\u7F6E\uFF0C\u5F97\u91CD\u5F00\u4E00\u672C\u4E66\u3002";
var GRAPH_BACKFILL_FAILED = "\u26A0\uFE0F \u6CA1\u80FD\u8865\u51FA\u56FE\u3002\u539F\u6765\u90A3\u4E9B\u4E1C\u897F\u4E00\u4E2A\u5B57\u6CA1\u52A8\u3002";
var GRAPH_BACKFILL_HIDDEN = Object.freeze({
  exploring: "\u8FD9\u672C\u4E66\u8FD8\u6CA1\u4EA4\u51FA\u8FC7\u6750\u6599\u62A5\u544A \u21D2 \u8FD8\u4E0D\u7B97\u8001\u4E66",
  graphPresent: "\u5408\u5E76\u4EF6\u91CC\u5DF2\u7ECF\u6709\u56FE\u4E86 \u21D2 \u4E0D\u7528\u8865",
  demo: "\u6F14\u793A\u4E66\u8865\u4E0D\u4E86\uFF08\u5B83\u90A3\u6761\u6D41\u7A0B\u662F\u5F55\u597D\u7684\uFF09 \u21D2 \u4E0D\u63D0\u793A",
  noMergedMap: "\u76D8\u4E0A\u8FD8\u6CA1\u6709\u5408\u5E76\u4EF6 \u21D2 \u8865\u56FE\u6CA1\u6709\u843D\u70B9"
});
function graphBackfillEntry({ meta, knowledgeMapText } = {}) {
  const text = typeof knowledgeMapText === "string" && knowledgeMapText !== "" ? knowledgeMapText : null;
  if (text === null) return { show: false, reason: "noMergedMap" };
  if (meta?.exploreConfirmed !== true) return { show: false, reason: "exploring" };
  if (graphOf(text) !== null) return { show: false, reason: "graphPresent" };
  if (meta?.demo === true) return { show: false, reason: "demo" };
  return { show: true, reason: null };
}
function graphOf(knowledgeMapText) {
  const parsed = parseKnowledgeMap(typeof knowledgeMapText === "string" ? knowledgeMapText : "");
  return parsed !== null && parsed.graph !== null ? parsed.graph : null;
}
function graphIsBackfilled(meta) {
  const backfill = meta?.knowledgeGraphBackfill;
  if (backfill === null || typeof backfill !== "object") return false;
  return backfill.withdrawnAt === void 0 || backfill.withdrawnAt === null;
}
function KnowledgeGraphBackfillKey(props) {
  const [state, setState] = (0, import_react15.useState)("idle");
  const entry = graphBackfillEntry({ meta: props.meta, knowledgeMapText: props.knowledgeMapText });
  const receipt = state === "done" ? GRAPH_BACKFILL_RECEIPT : state === "failed" ? GRAPH_BACKFILL_FAILED : null;
  if (!entry.show && receipt === null) return null;
  const press = () => {
    if (state === "working") return;
    setState("working");
    Promise.resolve().then(() => typeof props.onBackfill === "function" ? props.onBackfill({}) : null).then(
      (json) => setState(json === null ? "failed" : "done"),
      () => setState("failed")
    );
  };
  return (0, import_react15.createElement)(
    "span",
    { style: { display: "inline-flex", alignItems: "center", gap: "8px" }, "data-kgb-key-row": "1" },
    entry.show ? (0, import_react15.createElement)(
      "button",
      {
        style: S.disabled(S.smallLink, state === "working"),
        onClick: press,
        disabled: state === "working",
        "data-kgb-key": "1"
      },
      state === "working" ? "\u6B63\u5728\u8865\u2026" : GRAPH_BACKFILL_KEY_TEXT
    ) : null,
    receipt === null ? null : (0, import_react15.createElement)("span", { style: { fontSize: "12px", opacity: 0.85 }, "data-kgb-receipt": "1" }, receipt)
  );
}
function KnowledgeGraphBackfillBody(props) {
  const graph = graphOf(props.knowledgeMapText);
  if (graph === null || !graphIsBackfilled(props.meta)) return null;
  const parsed = parseKnowledgeMap(props.knowledgeMapText) ?? { kps: [], chapters: [], materials: [] };
  return (0, import_react15.createElement)(
    "div",
    { style: { marginTop: "6px" }, "data-kgb-block": "1" },
    (0, import_react15.createElement)(
      "div",
      { style: { fontSize: "12px", opacity: 0.85 }, "data-kgb-note": "1" },
      GRAPH_BACKFILL_NOTE
    ),
    // 只读那一块照票 07 原样复用：`dropped` 不给（老书这条维护动作上不改前置）。
    (0, import_react15.createElement)(KnowledgeGraphBlock, {
      cards: graph.cards,
      edges: graph.edges,
      knowledgePointCount: parsed.kps.length,
      chapterCount: parsed.chapters.length,
      merged: {
        knowledgePoints: parsed.kps,
        materials: parsed.materials,
        chapterSuggestion: parsed.chapters,
        cards: graph.cards,
        edges: graph.edges
      }
    })
  );
}

// src/ui/reader-boundary-backfill.js
var import_react16 = require("react");

// src/workflow/reader-boundary-backfill.js
var READER_BOUNDARY_BACKFILL_META_KEY = "readerBoundaryBackfill";
function readerBoundaryBackfillOf(meta) {
  const record = meta === null || typeof meta !== "object" ? null : meta[READER_BOUNDARY_BACKFILL_META_KEY];
  return record !== null && typeof record === "object" && !Array.isArray(record) ? record : null;
}
function readerBoundaryBackfillActive(meta) {
  const record = readerBoundaryBackfillOf(meta);
  return record !== null && (record.withdrawnAt === void 0 || record.withdrawnAt === null);
}

// src/ui/reader-boundary-backfill.js
var READER_BOUNDARY_BACKFILL_KEY_TEXT = "\u8865\u4E00\u4EFD\u8BFB\u8005\u8FB9\u754C";
var READER_BOUNDARY_BACKFILL_PROMISE = "\u53EA\u5BF9\u8FD8\u6CA1\u5199\u7684\u7AE0\u751F\u6548\uFF1B\u5DF2\u5199\uFF0F\u5DF2\u4EA4\u4ED8\u7684\u7AE0\u4E00\u4E2A\u5B57\u6CA1\u52A8";
var READER_BOUNDARY_BACKFILL_NOTE = "\u8FD9\u4EFD\u8BFB\u8005\u8FB9\u754C\u662F\u8865\u7684\uFF1A\u6309\u4F60\u5728\u56FE\u4E0A\u9010\u5361\u5212\u7684\u8FDB\u540C\u4E00\u4EFD\u5254\u9664\u8BB0\u5F55\uFF08\u53EA\u5F71\u54CD\u8FD8\u6CA1\u8DD1\u7684\u5DE5\u5E8F\uFF09\u3002";
var READER_BOUNDARY_BACKFILL_HIDDEN = Object.freeze({
  exploring: "\u8FD9\u672C\u4E66\u8FD8\u6CA1\u8FC7\u300CAI \u6311\u51FA\u6765\u7684\u91CD\u70B9\u300D\u90A3\u4E00\u6B65 \u21D2 \u8D70\u5230\u7AD9 2 \u65F6\u5212\u5B50\u4E0E\u95EE\u5377\u672C\u6765\u5C31\u5728\u90A3\u5F20\u5361\u4E0A",
  graphMissing: "\u76D8\u4E0A\u8FD8\u6CA1\u6709\u77E5\u8BC6\u70B9\u56FE \u21D2 \u6CA1\u6709\u4E00\u5F20\u5361\u53EF\u5212\uFF08\u5148\u8865\u4E00\u4EFD\u77E5\u8BC6\u70B9\u56FE\uFF09",
  demo: "\u6F14\u793A\u4E66\u8865\u4E0D\u4E86\uFF08\u5B83\u90A3\u6761\u6D41\u7A0B\u662F\u5F55\u597D\u7684\uFF09 \u21D2 \u4E0D\u63D0\u793A",
  noReaders: "\u8BFB\u8FD9\u4EFD\u8FB9\u754C\u7684\u5DE5\u5E8F\u90FD\u5DF2\u7ECF\u8DD1\u5B8C\uFF08\u7AE0\u5199\u5B8C\u4E86\u3001\u6700\u540E\u90A3\u9053\u8DE8\u7AE0\u68C0\u67E5\u4E5F\u8FC7\u4E86\uFF09 \u21D2 \u8865\u4E86\u96F6\u6548\u679C",
  unknown: "\u7AE0\u8FDB\u5EA6\u8BFB\u4E0D\u5230 \u21D2 \u5224\u4E0D\u51FA\u6765\uFF0C\u5B81\u53EF\u4E0D\u6446\uFF08\u5B83\u662F\u5165\u53E3\u4E0D\u662F\u95F8\u95E8\uFF09"
});
function readerBoundaryReadersRemain({ meta, chapterStatus, processSegs } = {}) {
  if (meta === null || typeof meta !== "object") return null;
  if (meta.status === "delivered" || meta.finalApprovedAt !== void 0 && meta.finalApprovedAt !== null) {
    return false;
  }
  const chapters = Array.isArray(meta.outline?.chapters) ? meta.outline.chapters : null;
  if (chapters === null || chapters.length === 0) return true;
  if (!Array.isArray(chapterStatus) || chapterStatus.length === 0) return null;
  if (chapterStatus.some((one) => one === null || typeof one !== "object" || one.written !== true)) return true;
  const segments = Array.isArray(processSegs) ? processSegs : [];
  const merge = segments.find((seg) => seg !== null && typeof seg === "object" && seg.key === "merge");
  if (merge === void 0) return null;
  return merge.status !== "done";
}
function readerBoundaryBackfillEntry({ meta, knowledgeMapText, chapterStatus, processSegs } = {}) {
  if (meta === null || typeof meta !== "object") return { show: false, reason: "unknown" };
  if (meta.exploreConfirmed !== true) return { show: false, reason: "exploring" };
  if (graphOfText(knowledgeMapText) === null) return { show: false, reason: "graphMissing" };
  if (meta.demo === true) return { show: false, reason: "demo" };
  const remain = readerBoundaryReadersRemain({ meta, chapterStatus, processSegs });
  if (remain === true) return { show: true, reason: null };
  return { show: false, reason: remain === false ? "noReaders" : "unknown" };
}
function graphOfText(knowledgeMapText) {
  const parsed = parseKnowledgeMap(typeof knowledgeMapText === "string" ? knowledgeMapText : "");
  return parsed !== null && parsed.graph !== null ? parsed.graph : null;
}
function ReaderBoundaryBackfillBlock(props) {
  const [open, setOpen] = (0, import_react16.useState)(false);
  const entry = readerBoundaryBackfillEntry({
    meta: props.meta,
    knowledgeMapText: props.knowledgeMapText,
    chapterStatus: props.chapterStatus,
    processSegs: props.processSegs
  });
  if (!entry.show) return null;
  const graph = graphOfText(props.knowledgeMapText);
  const exclusions = parseExclusionsDocument(props.knowledgeMapExclusions);
  const live = liveExclusionsOf(exclusions.items, graph === null ? [] : graph.cards);
  const dropped = [
    .../* @__PURE__ */ new Set([
      ...exclusionKeysOf({ items: live.live }),
      ...Array.isArray(props.graphDropped) ? props.graphDropped : []
    ])
  ];
  const active = readerBoundaryBackfillActive(props.meta);
  return (0, import_react16.createElement)(
    "div",
    { "data-rbb-block": "1", style: { marginTop: "6px" } },
    (0, import_react16.createElement)(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } },
      (0, import_react16.createElement)(
        "button",
        {
          type: "button",
          "data-rbb-key": "1",
          "aria-expanded": open,
          style: S.smallLink,
          onClick: () => setOpen((value) => !value)
        },
        open ? "\u6536\u8D77\u56FE" : READER_BOUNDARY_BACKFILL_KEY_TEXT
      )
    ),
    // 那句核心承诺（票面逐字）——界在这儿：只对还没跑的工序生效。
    (0, import_react16.createElement)(
      "p",
      { "data-rbb-promise": "1", style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.85 } },
      READER_BOUNDARY_BACKFILL_PROMISE
    ),
    // 补过之后的**独立**抬头记号（账在场且未撤回才出现；⛔ 与补图那句不共用）。
    active ? (0, import_react16.createElement)(
      "div",
      { "data-rbb-note": "1", style: { marginTop: "4px", fontSize: "12px", opacity: 0.85 } },
      READER_BOUNDARY_BACKFILL_NOTE
    ) : null,
    open && graph !== null ? (0, import_react16.createElement)(KnowledgeGraphView, {
      cards: graph.cards,
      edges: graph.edges,
      dropped,
      onVerdict: props.onVerdict
    }) : null
  );
}

// src/ui/phase-page.js
var PHASE_LAYOUT = Object.freeze({
  1: "materials",
  2: "stack",
  3: "stack",
  4: "stack",
  5: "split",
  6: "stack"
});
var PHASE_PAGE_QUESTION = "\u8FD9\u4E00\u9636\u6BB5\u8D70\u5230\u4E86\u54EA\u3001\u4EA7\u51FA\u4E86\u4EC0\u4E48\uFF1F";
var BROWSE_QUESTION = "\u8FD9\u4E00\u6B65\u662F\u4EC0\u4E48\u3001\u4EA7\u51FA\u4E86\u4EC0\u4E48\u3001\u4F60\u5B9A\u8FC7\u4EC0\u4E48\uFF1F";
var BROWSE_BLOCKS = Object.freeze({
  what: "\u2460 \u8FD9\u4E00\u6B65\u662F\u4EC0\u4E48",
  produced: "\u2461 \u4EA7\u51FA\u4E86\u4EC0\u4E48",
  judged: "\u2462 \u5224\u4E86\u4EC0\u4E48",
  decided: "\u2463 \u4F60\u5B9A\u8FC7\u4EC0\u4E48"
});
var BROWSE_NO_AUDIT = "\u8FD9\u4E00\u6B65\u6CA1\u6709\u673A\u5668\u68C0\u67E5\u3002";
var BROWSE_NO_DECISION = "\u6CA1\u6709\u8981\u4F60\u62CD\u677F\u7684\u4E8B\u3002";
var BROWSE_DECISION_POINTER = "\u5F53\u65F6\u7684\u8BB0\u5F55\u5728\u4E0B\u9762\u7684\u300C\u25B8 \u4E4B\u524D\u7684\u8FC7\u7A0B\u300D\u91CC\u3002";
var P = {
  head: { display: "flex", alignItems: "baseline", gap: "10px", margin: "0 0 2px" },
  // 票 18（spec §2.14 第 5 块）：阶段 5 的「打开」要留在 1280×720 首屏内。行高从默认 1.6
  // 收到 1.25、intro 下边距与几处小间距各收 2–4px——**字号一个没动**（这是压缩间距，不是换字号档）。
  // 读数（`.scratch/gallery-readings/uib2-phase-readings.json`）：「打开」y≈683.8、盒底 710.8 < 720；
  // 旧读数 y≈737.7。
  headTitle: { fontSize: "16px", fontWeight: 700, lineHeight: 1.25 },
  intro: { fontSize: "12px", opacity: 0.7, margin: "4px 0 4px" },
  sectionLabel: { fontSize: "12px", fontWeight: 600, opacity: 0.75, margin: "0 0 6px" },
  // 票 19：浏览态四块各自的块名一档——与阶段页的 `sectionLabel` 分开，因为四块是**卡级**
  // 结构（每块一张卡），不是卡内小标签。字号/颜色仍只在这一处定义。
  browseBlockTitle: { fontSize: "13px", fontWeight: 600, margin: "0 0 6px" },
  browseMeta: { fontSize: "12px", opacity: 0.65, margin: "2px 0 0" },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 10px",
    borderRadius: "8px",
    border: "1px solid var(--dsw-alias-border-l2)",
    marginBottom: "6px",
    background: "var(--dsw-alias-bg-base)",
    fontSize: "13px"
  },
  kindTag: {
    fontSize: "12px",
    padding: "1px 6px",
    borderRadius: "999px",
    background: "var(--dsw-alias-bg-skeleton)",
    opacity: 0.85,
    whiteSpace: "nowrap"
  },
  empty: { fontSize: "12px", opacity: 0.65, margin: "6px 0" },
  pre: {
    whiteSpace: "pre-wrap",
    margin: "8px 0 0",
    padding: "8px 10px",
    borderRadius: "8px",
    // 产物代码块走宿主自己的「代码块底色」语义，不复用通用骨架底色（票 19 路线 A；
    // 取值见 docs/reference/dsh-theme-token-contracts.md §2）。
    background: "var(--dsw-alias-markdown-code-block)",
    fontSize: "12px",
    maxHeight: "260px",
    overflow: "auto",
    fontFamily: "inherit"
  }
};
function StepDetailLines(props) {
  const lines = Array.isArray(props.step?.detailLines) ? props.step.detailLines : [];
  if (lines.length === 0) return null;
  return (0, import_react17.createElement)(
    "div",
    { style: { marginTop: "2px" } },
    ...lines.map(
      (line, index) => (0, import_react17.createElement)(
        "span",
        {
          key: `detail-${index}`,
          style: {
            display: "block",
            fontSize: "12px",
            lineHeight: "1.35",
            opacity: 0.72
          }
        },
        line
      )
    )
  );
}
var OPEN_NOTE = "\u70B9\u300C\u6253\u5F00\u300D\uFF0C\u5185\u5BB9\u4F1A\u5728\u53F3\u4FA7\u6253\u5F00\u7ED9\u4F60\u770B\uFF08\u53EA\u8BFB\uFF0C\u4E0D\u5F71\u54CD\u9020\u4E66\uFF09\u3002";
function ArtifactChip(props) {
  const { item, onOpen } = props;
  return (0, import_react17.createElement)(
    "span",
    { style: { display: "inline-flex", alignItems: "center", gap: "6px" } },
    (0, import_react17.createElement)("span", { style: P.kindTag }, item.kind),
    (0, import_react17.createElement)("strong", { style: { fontSize: "12px" } }, item.label),
    // 「打开」跟在自己那份产物名字后面（不是被推到行尾）：`marginLeft:auto` 是「产物行」
    // 那种整行只放一颗按钮时的对齐，这里要显式归零。
    (0, import_react17.createElement)(OpenArtifactButton, { item, onOpen, style: { marginLeft: 0 } })
  );
}
var artifactsOf = (row) => row.artifacts.map((item) => ({ ...item, stepKey: row.key }));
function StepFileRow(props) {
  const { artifacts, onOpen, emptyText, row, onDeepModify, busy, openKey, onOpenKey } = props;
  const items = artifacts.map(
    (item) => (0, import_react17.createElement)(ArtifactChip, { key: `${item.stepKey ?? ""}::${item.path}`, item, onOpen })
  );
  return (0, import_react17.createElement)(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "8px",
        marginTop: "4px",
        fontSize: "12px"
      }
    },
    (0, import_react17.createElement)("span", { style: { ...P.sectionLabel, margin: 0 } }, "\u8FD9\u4E00\u6B65\u7684\u6587\u4EF6\uFF1A"),
    items.length === 0 ? (0, import_react17.createElement)("span", { style: { ...P.empty, margin: 0 } }, emptyText ?? "\u8FD9\u4E00\u6B65\u6CA1\u6709\u7559\u6587\u4EF6\u3002") : items,
    // 同屏只能开一个确认框（见 `DeepModifyLink` 顶部说明）：状态提到布局那一层，兄弟卡才互斥。
    (0, import_react17.createElement)(DeepModifyLink, { row, onDeepModify, busy, openKey, onOpenKey })
  );
}
function DeepModifyLink(props) {
  const { row, onDeepModify, busy, openKey, onOpenKey } = props;
  const [note, setNote] = (0, import_react17.useState)("");
  if (row.modify === null || row.modify === void 0) return null;
  const open = openKey === row.key;
  const close = () => {
    onOpenKey(null);
    setNote("");
  };
  if (!open) {
    return (0, import_react17.createElement)(
      "button",
      {
        // 🎯 票 `gold-display-period/05`：这颗**有意不禁用**（#2 的逐处复核）——它只
        // `onOpenKey(row.key)`（`StackBody` 的 `setOpenKey`，展开就地改的那张表单），
        // 提交那一笔在表单里（下面那颗「✍️ 就这么改，重做下游」照旧禁用）。
        // 票 18：它固定在文件行右端（唯一调用点在 `StepFileRow`）；展开后的确认框另起一行。
        style: { ...S.smallLink, marginTop: 0, marginLeft: "auto" },
        onClick: () => onOpenKey(row.key),
        title: "\u5C31\u5730\u6539\u51B3\u5B9A\u5E76\u91CD\u505A\u4E0B\u6E38\uFF08\u4E0D\u79BB\u5F00\u8FD9\u4E00\u6B65\uFF09"
      },
      "\u270D\uFE0F \u5B9A\u70B9\u4FEE\u6539\u8FD9\u4E00\u6B65"
    );
  }
  const downstream = row.downstream ?? [];
  return (0, import_react17.createElement)(
    "div",
    {
      style: {
        marginTop: "8px",
        borderTop: "1px dashed var(--dsw-alias-border-l2)",
        paddingTop: "8px",
        // 展开后的确认框**独占一行**：文件行是 flex，`flexBasis:100%` 让它换行铺满。
        flexBasis: "100%"
      }
    },
    (0, import_react17.createElement)("p", { style: { margin: "0 0 6px", fontWeight: 600 } }, `\u270D\uFE0F \u5B9A\u70B9\u4FEE\u6539\u300C${row.title}\u300D`),
    (0, import_react17.createElement)(
      "p",
      { style: { margin: "0 0 6px", fontSize: "12px", color: "var(--dsw-alias-state-error-primary)" } },
      downstream.length === 0 ? "\u5F71\u54CD\u9884\u544A\uFF1A\u8FD9\u4E00\u6B65\u4E4B\u540E\u6CA1\u6709\u4E0B\u6E38\u8981\u91CD\u505A\u3002" : `\u5F71\u54CD\u9884\u544A\uFF1A\u8FD9\u4E00\u6B65\u6539\u4E86\uFF0C\u8FD9\u4E9B\u8981\u4E00\u8D77\u91CD\u505A\uFF1A${downstream.join("\u3001")}\u3002`
    ),
    (0, import_react17.createElement)(
      "p",
      { style: { margin: "0 0 6px", fontSize: "12px", opacity: 0.75 } },
      "\u4F60\u7684\u98CE\u683C\u7EBF\u548C\u8C41\u514D\u539F\u6837\u4FDD\u7559\uFF1B\u8BE5\u62CD\u677F\u7684\u6B65\u4ECD\u4F1A\u6765\u8BF7\u4F60\u62CD\u677F\uFF1B\u65E7\u7248\u672C\u4F1A\u5F52\u6863\u7559\u5E95\uFF1B\u6700\u8FD1\u4E00\u6B21\u4FEE\u6539\uFF0C10 \u5206\u949F\u5185\u53EF\u4EE5\u4E00\u952E\u64A4\u9500\u3002"
    ),
    // 同屏一次只能改一处：说清为什么，别让用户以为是界面坏了。
    // ⚠️ 票 14（承诺账 A1/A2，来源票 09 的裁决）：原来那句「一次只能改一步——先提交这一处，
    // 再改下一处」**做不到**——提交后守卫立刻挡住第二笔（深改结尾把 meta.status='running'、
    // pendingStage 指回被改段），得等整轮重做跑完、或先 ⏸ 暂停。这里改成能兑现的说法并指路。
    (0, import_react17.createElement)(
      "p",
      { style: { margin: "0 0 6px", fontSize: "12px", opacity: 0.6 } },
      "\u4E00\u6B21\u53EA\u6539\u4E00\u5904\uFF1A\u63D0\u4EA4\u540E AI \u4F1A\u5148\u91CD\u505A\u8FD9\u4E00\u6B65\uFF1B\u60F3\u63A5\u7740\u6539\u4E0B\u4E00\u5904\uFF0C\u7B49\u5B83\u505A\u5B8C\uFF0C\u6216\u5148 \u23F8 \u6682\u505C\u3002"
    ),
    // 票 14（来源票 09）：撤销单位＝**最近一次提交**（`lastDeepModify` 只记一条）——在撤销窗内
    // 再改一处，上一笔的撤销入口就失效了。提交第二笔前先把代价说清（不许等用户撞上才发现）。
    (0, import_react17.createElement)(
      "p",
      { style: { margin: "0 0 6px", fontSize: "12px", opacity: 0.6 } },
      "\u64A4\u9500\u53EA\u8986\u76D6\u6700\u8FD1\u4E00\u6B21\u63D0\u4EA4\u2014\u2014\u63D0\u4EA4\u8FD9\u4E00\u5904\u540E\uFF0C\u4E0A\u4E00\u6B21\u7684\u64A4\u9500\u5165\u53E3\u4F1A\u5931\u6548\u3002"
    ),
    (0, import_react17.createElement)("textarea", {
      style: S.textarea,
      placeholder: "\u8FD9\u6B21\u8981\u6539\u6210\u4EC0\u4E48\uFF1F\u5199\u4E00\u53E5\uFF08\u5FC5\u586B\uFF09",
      value: note,
      onChange: (e) => setNote(e.target.value)
    }),
    (0, import_react17.createElement)(
      "div",
      { style: { marginTop: "8px", display: "flex", gap: "8px" } },
      (0, import_react17.createElement)(
        "button",
        {
          style: S.disabled(S.bigBtn(false), busy === true || note.trim() === ""),
          disabled: busy === true || note.trim() === "",
          onClick: () => {
            onDeepModify?.(row.modify.segmentKey, note.trim());
            onOpenKey(null);
            setNote("");
          }
        },
        "\u270D\uFE0F \u5C31\u8FD9\u4E48\u6539\uFF0C\u91CD\u505A\u4E0B\u6E38"
      ),
      (0, import_react17.createElement)("button", { style: S.smallLink, onClick: close }, "\u53D6\u6D88")
    )
  );
}
function StackBody(props) {
  const { steps, onOpen, onDeepModify, busy } = props;
  const [openKey, setOpenKey] = (0, import_react17.useState)(null);
  return (0, import_react17.createElement)(
    "div",
    null,
    ...steps.map(
      (row) => (0, import_react17.createElement)(
        "div",
        {
          key: row.key,
          // 票 19：焦点描边已随浏览态独立四块退役（`browsing` 不再渲染这一支；
          // 阶段页态从来不带 `focusedStep`）。⛔ 别再在这里加回「你点的是这一个」的圈。
          style: S.card
        },
        (0, import_react17.createElement)(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: "10px"
            }
          },
          // 四态行（票 04 抽出、票 05 接线）：图标 + 步名 + 状态词走全览条清单同一份
          // 行上的 `row.rowText`，本页不再自己拼一份。
          (0, import_react17.createElement)("strong", { style: { fontSize: "13px" } }, row.rowText)
        ),
        (0, import_react17.createElement)(StepDetailLines, { step: row }),
        row.decision !== null ? (0, import_react17.createElement)("p", { style: { margin: "6px 0 0", fontSize: "12px" } }, `\u62CD\u677F\uFF1A${row.decision}`) : null,
        // 票 18（spec §2.13 第 7 块）：文件行压成一行，「定点修改」并进同一行右端。
        (0, import_react17.createElement)(StepFileRow, {
          artifacts: artifactsOf(row),
          onOpen,
          emptyText: row.status === "pending" ? "\u8FD8\u6CA1\u5230\u8FD9\u4E00\u6B65\u3002" : void 0,
          row,
          onDeepModify,
          busy,
          openKey,
          onOpenKey: setOpenKey
        })
      )
    )
  );
}
function ChapterAuditSummary(props) {
  const summary = props.summary ?? null;
  const label = (0, import_react17.createElement)("span", { style: { opacity: 0.75 } }, "\u673A\u5668\u68C0\u67E5\u7ED3\u8BBA\uFF1A");
  if (summary === null)
    return (0, import_react17.createElement)(
      "div",
      { style: { marginTop: "6px" } },
      (0, import_react17.createElement)("p", { style: { ...P.sectionLabel, margin: "0 0 2px" } }, "\u673A\u5668\u68C0\u67E5\u7ED3\u8BBA"),
      (0, import_react17.createElement)("p", { style: { ...P.empty, margin: 0 } }, "\u8FD8\u6CA1\u6709\u68C0\u67E5\u7ED3\u8BBA\u3002")
    );
  const passed = summary.passed === true;
  const issues = Array.isArray(summary.issues) ? summary.issues : [];
  const issueCount = Number.isSafeInteger(summary.issueCount) ? summary.issueCount : issues.length;
  const countLabel = passed ? `\u53E6\u6709 ${issueCount} \u5904\u63D0\u9192\uFF1A` : `\u5361\u5728 ${issueCount} \u5904\uFF1A`;
  return (0, import_react17.createElement)(
    "div",
    { style: { marginTop: "4px" } },
    // 结论与标题同一行（省一行；色只落在结论那半句上，标题仍是弱化的标签）。
    (0, import_react17.createElement)(
      "p",
      { style: { margin: 0, fontSize: "12px", fontWeight: 600 } },
      label,
      (0, import_react17.createElement)(
        "span",
        { style: { color: passed ? "var(--dsw-alias-state-success-primary)" : "var(--dsw-alias-state-error-primary)" } },
        passed ? "\u2705 \u8FD9\u4E00\u7AE0\u901A\u8FC7\u4E86" : "\u274C \u8FD9\u4E00\u7AE0\u8FD8\u6CA1\u901A\u8FC7"
      )
    ),
    issueCount === 0 ? (0, import_react17.createElement)(
      "p",
      { style: { ...P.empty, margin: "2px 0 0" } },
      passed ? "\u6CA1\u6709\u5361\u70B9\u3002" : "\u68C0\u67E5\u8BB0\u5F55\u6CA1\u6709\u5217\u51FA\u5177\u4F53\u95EE\u9898\u3002"
    ) : issues.length === 0 ? (0, import_react17.createElement)(
      "p",
      { style: { margin: "2px 0 0", fontSize: "12px" } },
      `${countLabel}\u68C0\u67E5\u8BB0\u5F55\u6CA1\u6709\u5217\u51FA\u5177\u4F53\u95EE\u9898\u3002`
    ) : issues.map(
      (issue, index) => (0, import_react17.createElement)(
        "p",
        {
          key: `${index}:${issue.text}`,
          style: { margin: 0, fontSize: "12px" }
        },
        // 条数标签与第一条并排（不再单占一行）：`卡在 2 处：1. …`／`另有 1 处提醒：1. …`。
        index === 0 ? `${countLabel}${index + 1}. ${issue.text}` : `${index + 1}. ${issue.text}`
      )
    )
  );
}
function BrowseBody(props) {
  const { row, phase, phaseName, intro, stepIndex, stepTotal, onOpen, onDeepModify, busy } = props;
  const [openKey, setOpenKey] = (0, import_react17.useState)(null);
  const artifacts = artifactsOf(row);
  const phaseNo = Number.isInteger(phase) ? String(phase) : "?";
  const facts = `\u7B2C ${phaseNo} \u9636\u6BB5\uFF1A\u7B2C ${stepIndex} \u6B65 / \u5171 ${stepTotal} \u6B65\uFF0C${row.statusWord}\u3002`;
  return (0, import_react17.createElement)(
    "div",
    null,
    (0, import_react17.createElement)(CardHead, {
      question: (0, import_react17.createElement)("strong", { style: CARD_HEAD_QUESTION_STYLE }, BROWSE_QUESTION),
      facts
    }),
    // ① 这一步是什么：四态行（与全览条同一份 `rowText`）＋ 所属阶段 ＋ 这一阶段做什么。
    // 「这一步做什么」取 stage intro（存量、`projection` 已算好的那句）——⛔ 不新写一句按步的描述；
    // 步/第几步由上面的事实句说一次，这里不重复印（原型 `?screen=browse` 同形）。
    (0, import_react17.createElement)(
      "div",
      { style: S.card },
      (0, import_react17.createElement)("p", { style: P.browseBlockTitle }, BROWSE_BLOCKS.what),
      (0, import_react17.createElement)("strong", { style: { fontSize: "13px" } }, row.rowText),
      (0, import_react17.createElement)("p", { style: P.browseMeta }, `\u6240\u5C5E\u9636\u6BB5\uFF1A${phaseName}\uFF08\u7B2C ${phaseNo} \u9636\u6BB5\uFF09`),
      (0, import_react17.createElement)("p", { style: { margin: "6px 0 0", fontSize: "12px" } }, intro),
      row.sourceNote === null || row.sourceNote === void 0 ? null : (0, import_react17.createElement)("p", { style: { ...P.empty, margin: "4px 0 0" } }, row.sourceNote)
    ),
    // ② 产出了什么：可打开产物按钮 ＋ 产物事实；没有可打开产物时一句空态。
    (0, import_react17.createElement)(
      "div",
      { style: S.card },
      (0, import_react17.createElement)("p", { style: P.browseBlockTitle }, BROWSE_BLOCKS.produced),
      artifacts.length === 0 ? (0, import_react17.createElement)("p", { style: { ...P.empty, margin: 0 } }, "\u8FD9\u4E00\u6B65\u6CA1\u6709\u7559\u53EF\u6253\u5F00\u7684\u6587\u4EF6\u3002") : (0, import_react17.createElement)(
        "div",
        null,
        (0, import_react17.createElement)(
          "div",
          { style: { display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" } },
          ...artifacts.map(
            (item) => (0, import_react17.createElement)(ArtifactChip, { key: `${item.stepKey ?? ""}::${item.path}`, item, onOpen })
          )
        ),
        row.factText === "" || row.factText === void 0 ? null : (0, import_react17.createElement)("p", { style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.72 } }, row.factText),
        // 与阶段页同一句「打开」说明；只有这一块真的摆了「打开」才印（⛔ 不在页尾再印一份）。
        (0, import_react17.createElement)("p", { style: { ...P.empty, margin: "6px 0 0" } }, OPEN_NOTE)
      )
    ),
    // ③ 判了什么：章段＝机器检查结论（`ChapterAuditSummary` 与阶段 5 右卡同一份组件）；
    // 非章段＝明说「这一步没有机器检查」。
    (0, import_react17.createElement)(
      "div",
      { style: S.card },
      (0, import_react17.createElement)("p", { style: P.browseBlockTitle }, BROWSE_BLOCKS.judged),
      row.chapter !== null ? (0, import_react17.createElement)(ChapterAuditSummary, { summary: row.auditSummary }) : (0, import_react17.createElement)("p", { style: { margin: 0, fontSize: "12px" } }, BROWSE_NO_AUDIT)
    ),
    // ④ 你定过什么：拍板结论只有关卡/gold 段有（`row.decision`）；其它段指到屏下的过程回放。
    (0, import_react17.createElement)(
      "div",
      { style: S.card },
      (0, import_react17.createElement)("p", { style: P.browseBlockTitle }, BROWSE_BLOCKS.decided),
      row.decision !== null ? (0, import_react17.createElement)("p", { style: { margin: 0, fontSize: "13px" } }, `\u62CD\u677F\uFF1A${row.decision}`) : (0, import_react17.createElement)(
        "div",
        null,
        (0, import_react17.createElement)("p", { style: { margin: 0, fontSize: "12px" } }, BROWSE_NO_DECISION),
        (0, import_react17.createElement)("p", { style: { ...P.empty, margin: "4px 0 0" } }, BROWSE_DECISION_POINTER)
      )
    ),
    // ⑦ 定点修改这一步（条件＝`row.modify`）；⑧「▸ 之前的过程」由壳接在本页之后，不在这里。
    (0, import_react17.createElement)(DeepModifyLink, { row, onDeepModify, busy, openKey, onOpenKey: setOpenKey })
  );
}
function SplitBody(props) {
  const { steps, onOpen, onDeepModify, busy } = props;
  const [openKey, setOpenKey] = (0, import_react17.useState)(null);
  const [picked, setPicked] = (0, import_react17.useState)(0);
  const row = steps[Math.min(picked, steps.length - 1)] ?? null;
  if (row === null) return null;
  return (0, import_react17.createElement)(
    "div",
    { style: { display: "flex", gap: "10px", alignItems: "flex-start" } },
    (0, import_react17.createElement)(
      "div",
      {
        style: {
          width: "190px",
          flexShrink: 0,
          border: "1px solid var(--dsw-alias-border-l2)",
          borderRadius: "10px",
          padding: "6px",
          maxHeight: "360px",
          overflowY: "auto"
        }
      },
      ...steps.map(
        (item, index) => (0, import_react17.createElement)(
          "button",
          {
            key: item.key,
            style: {
              display: "block",
              width: "100%",
              textAlign: "left",
              border: "1px solid transparent",
              // 判据 5（票 04）：嵌套同心圆角 = 外层 10px − 间距 6px（外框 padding）＝ 4px。
              // ⚠️ 改外框 padding（上面 `padding: "6px"`）就要同批重算这里。
              borderRadius: "4px",
              padding: "6px 8px",
              margin: "0 0 2px",
              fontSize: "12px",
              cursor: "pointer",
              color: "inherit",
              background: index === picked ? "var(--dsw-alias-state-business-tertiary)" : "transparent",
              opacity: item.status === "pending" ? 0.55 : 1
            },
            onClick: () => setPicked(index)
          },
          // 四态行（候选 06 收进模型）：左栏一行一步，与全览条清单同一份 `row.rowText`。
          item.rowText
        )
      )
    ),
    (0, import_react17.createElement)(
      "div",
      // 票 18（spec §2.14 第 5 块）：「打开」必须在 1280×720 首屏内（旧读数 y≈737.7 掉出）。
      // 文件行压成一行是主要手段，右卡的内边距再收一点（12px → 8px）。
      { style: { ...S.card, flex: 1, marginBottom: 0, padding: "8px 12px" } },
      (0, import_react17.createElement)(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: "10px"
          }
        },
        // 右栏那一行（四态行，与全览条同一份）：状态词在行文里，不再另起一格。
        (0, import_react17.createElement)("strong", { style: { fontSize: "13px" } }, row.rowText)
      ),
      (0, import_react17.createElement)(StepDetailLines, { step: row }),
      row.decision !== null ? (0, import_react17.createElement)("p", { style: { margin: "6px 0 0", fontSize: "12px" } }, `\u62CD\u677F\uFF1A${row.decision}`) : null,
      row.chapter !== null ? (0, import_react17.createElement)(ChapterAuditSummary, { summary: row.auditSummary }) : null,
      // 票 18（spec §2.14 第 4–5 块）：右卡的文件行同样压成一行，让「打开」留在首屏。
      (0, import_react17.createElement)(StepFileRow, {
        artifacts: artifactsOf(row),
        onOpen,
        emptyText: row.status === "pending" ? "\u8FD8\u6CA1\u5230\u8FD9\u4E00\u6B65\u3002" : void 0,
        row,
        onDeepModify,
        busy,
        openKey,
        onOpenKey: setOpenKey
      })
    )
  );
}
function convertedOpenable(source) {
  return convertedState(source) === "ok" && typeof source.md === "string" && source.md !== "";
}
function MaterialsBody(props) {
  const sources = props.sources ?? [];
  const step = props.step;
  const conversionText = materialConversionActivityText(props.meta, props.events);
  const km = parseKnowledgeMap(props.knowledgeMapText);
  const roleByNum = new Map(
    (km === null ? [] : km.materials).map((material) => [
      material?.num,
      typeof material?.role === "string" && material.role !== "" ? material.role : null
    ])
  );
  const numBySource = new Map(okMaterialShards(sources).map(({ n, source }) => [source, n]));
  const roleOf = (source) => {
    const n = numBySource.get(source);
    return n === void 0 ? null : roleByNum.get(n) ?? null;
  };
  const entriesFor = (source) => {
    const buttons = [];
    if (originalPreviewOpenable(source.file))
      buttons.push(
        (0, import_react17.createElement)(OpenArtifactButton, {
          item: { path: originalSourceRel(source.file) },
          // 与转换稿**同一个** `onOpen`（同一个 DSH 右栏通道），不另写第二条打开路径。
          onOpen: props.onOpen,
          // 词仍只来自登记词表：「打开」＋「原件」。⚠️ 这一行有两个入口了，两颗都只写
          // 「打开」分不清谁是谁——转换稿那颗按票 10 保持原样（一个字不动），新那颗自带
          // 限定语。tooltip 由 `artifactName` 出（「x 的原件」，`CONTEXT.md`「产物名」）。
          label: "\u6253\u5F00\u539F\u4EF6",
          style: { marginLeft: 0 }
        })
      );
    if (convertedOpenable(source))
      buttons.push(
        (0, import_react17.createElement)(OpenArtifactButton, {
          item: { path: `\u6750\u6599/\u8F6C\u6362\u7A3F/${source.md}` },
          onOpen: props.onOpen
          // 票 10（判定一 #14）：行的形状是 **[名字] + [打开]**（CONTEXT.md「产物名」）
          // ——左边那格已经是这份材料的名字（`source.file`），所以按钮只说动词「打开」，
          // 不再自造「查看转换内容」这种说法；这一份叫什么由按钮 tooltip 给出
          // （`artifactName` →「x 的转换稿」）。
        })
      );
    return buttons.length === 0 ? null : (0, import_react17.createElement)(
      "div",
      { style: { display: "flex", gap: "8px", alignItems: "center", marginLeft: "auto" } },
      ...buttons
    );
  };
  return (0, import_react17.createElement)(
    "div",
    { style: S.card },
    (0, import_react17.createElement)(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "10px"
        }
      },
      // 四态行（候选 06）：材料准备那一步的名字与四态词吃行上算好的 `rowText`。
      // ⚠️ 兜底那一支**不许手写**「材料准备」（2026-09-23 代码审查）：界面上的字只此一份
      // （CONTEXT.md「界面用词表」）。而且这一支事实上到不了——模型无条件 push 材料准备
      // 那一步，它的 `title` 就是 `PHASE_UI[1]`。留兜底只为不崩，词一律从表里取。
      (0, import_react17.createElement)(
        "strong",
        { style: { fontSize: "13px" } },
        step === null || step === void 0 ? PHASE_UI[1] ?? "" : step.rowText
      )
    ),
    conversionText !== null ? (0, import_react17.createElement)(
      "p",
      { style: { margin: "6px 0 0", fontSize: "12px" } },
      `\u{1F916} ${conversionText}`
    ) : null,
    sources.length === 0 ? (0, import_react17.createElement)("p", { style: { margin: "6px 0 0", fontSize: "13px" } }, "\u8FD8\u6CA1\u6709\u4E0A\u4F20\u6750\u6599\u3002") : (0, import_react17.createElement)(
      "div",
      { style: { marginTop: "6px" } },
      ...sources.map((source) => {
        const role = roleOf(source);
        return (0, import_react17.createElement)(
          "div",
          {
            key: source.file,
            style: {
              display: "flex",
              gap: "8px",
              alignItems: "center",
              padding: "5px 0"
            }
          },
          (0, import_react17.createElement)(
            "span",
            { style: { flex: 1, fontSize: "13px", wordBreak: "break-all" } },
            `${convertedIcon(source)} ${source.file}${role === null ? "" : `\uFF08${role}\uFF09`}`
          ),
          entriesFor(source)
        );
      })
    ),
    ...sources.filter((source) => convertedState(source) === "failed").map(
      (source) => (0, import_react17.createElement)(
        "p",
        {
          key: `gap-${source.file}`,
          style: { margin: "6px 0 0", fontSize: "12px" }
        },
        `${source.file}\uFF1A\u8FD9\u4E00\u4EFD\u6CA1\u8F6C\u6210\uFF0C\u8FD9\u672C\u4E66\u6682\u65F6\u7F3A\u5B83\uFF1B\u5230\u300C\u6750\u6599\u51C6\u5907\u300D\u90A3\u4E00\u6B65\u8865\u4F20\u6216\u5220\u6389\u5B83\u3002`
      )
    )
  );
}
function KnowledgeMapBlock(props) {
  const [open, setOpen] = (0, import_react17.useState)(false);
  const text = typeof props.text === "string" && props.text !== "" ? props.text : null;
  if (text === null)
    return (0, import_react17.createElement)(
      "div",
      { style: S.card },
      (0, import_react17.createElement)("p", { style: { margin: 0, fontSize: "12px", opacity: 0.7 } }, "\u8FD8\u6CA1\u6709\u6311\u91CD\u70B9\u7684\u7ED3\u679C\u3002")
    );
  const folded = foldKnowledgeMap(text);
  const body = folded ?? text;
  return (0, import_react17.createElement)(
    "div",
    { style: S.card },
    (0, import_react17.createElement)(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } },
      (0, import_react17.createElement)("strong", { style: { fontSize: "13px" } }, "AI \u6311\u51FA\u6765\u7684\u91CD\u70B9"),
      (0, import_react17.createElement)(
        "button",
        { style: S.smallLink, onClick: () => setOpen((v) => !v) },
        open ? "\u6536\u8D77" : "\u5C55\u5F00\u770B\u6E05\u5355"
      ),
      // 票 `knowledge-graph-build/12`：老书那颗「补一份知识点图」的键——**与抬头同一行**
      // （这一屏是老书唯一走得到、且今天就印着知识点清单的那一屏：阶段片六格常驻可点、
      // 无 status 守卫）。可见性三条与回执都住在它自己的域文件里，这里只把三样递下去。
      (0, import_react17.createElement)(KnowledgeGraphBackfillKey, {
        key: "backfill",
        meta: props.meta,
        knowledgeMapText: text,
        onBackfill: props.onBackfillGraph
      })
    ),
    // 图那一块（补出来的那份图的抬头 ＋ 只读图）：**只有「这份图是补的」且图键都在**才出。
    (0, import_react17.createElement)(KnowledgeGraphBackfillBody, {
      key: "backfill-body",
      meta: props.meta,
      knowledgeMapText: text
    }),
    // 票 `reader-cognition-boundary-build/10`：老书那条「补一份读者边界」的通路（**能划**）。
    // ⚠️ 与上面那块是两个物：那块是补出来的**只读图**，这块是逐卡裁的**边界入口**——
    // 各自有独立抬头记号与独立 meta 账，⛔ 别混成一个。可见性四档在它自己的域文件里。
    (0, import_react17.createElement)(ReaderBoundaryBackfillBlock, {
      key: "reader-boundary",
      meta: props.meta,
      knowledgeMapText: text,
      knowledgeMapExclusions: props.knowledgeMapExclusions,
      chapterStatus: props.chapterStatus,
      processSegs: props.processSegs,
      graphDropped: props.graphDropped,
      onVerdict: props.onGraphVerdict
    }),
    open ? (0, import_react17.createElement)("pre", { style: P.pre }, body) : null
  );
}
function OutlineBlock(props) {
  const [open, setOpen] = (0, import_react17.useState)(false);
  const text = typeof props.text === "string" && props.text !== "" ? props.text : null;
  if (text === null)
    return (0, import_react17.createElement)(
      "div",
      { style: S.card },
      (0, import_react17.createElement)("p", { style: { margin: 0, fontSize: "12px", opacity: 0.7 } }, "\u8FD8\u6CA1\u6709\u7AE0\u8282\u5B89\u6392\u3002")
    );
  const folded = foldOutline(text);
  const body = folded ?? text;
  return (0, import_react17.createElement)(
    "div",
    { style: S.card },
    (0, import_react17.createElement)(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } },
      (0, import_react17.createElement)("strong", { style: { fontSize: "13px" } }, "\u7AE0\u8282\u5B89\u6392"),
      (0, import_react17.createElement)(
        "button",
        { style: S.smallLink, onClick: () => setOpen((v) => !v) },
        open ? "\u6536\u8D77" : "\u5C55\u5F00\u770B\u6E05\u5355"
      )
    ),
    open ? (0, import_react17.createElement)("pre", { style: P.pre }, body) : null
  );
}
function GoldBlock(props) {
  const drafts = props.goldDrafts ?? [];
  const sealed = props.goldSealed ?? null;
  const revising = sealed === null && props.status === "running" && props.pendingStage === "gold";
  return (0, import_react17.createElement)(
    "div",
    { style: S.card },
    (0, import_react17.createElement)(
      "div",
      { style: { display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" } },
      (0, import_react17.createElement)("strong", { style: { fontSize: "13px" } }, "\u8FD9\u4E00\u7AE0\u7684\u7A3F\u5B50"),
      (0, import_react17.createElement)(
        "span",
        { style: { fontSize: "12px", opacity: 0.75 } },
        sealed !== null ? `\u2705 \u5DF2\u5B9A\u7A3F\uFF08\u7B2C ${sealed.version ?? "?"} \u7A3F\uFF09` : revising ? `\u6211\u6B63\u5728\u505A\uFF1A\u6539\u7B2C ${props.goldDraftVersion ?? 1} \u7A3F\uFF0C\u6539\u5B8C\u5C31\u8BF7\u4F60\u8FC7\u76EE` : `\u73B0\u5728\u662F\u7B2C ${props.goldDraftVersion ?? 1} \u7A3F\uFF0C\u7B49\u4F60\u8FC7\u76EE`
      )
    ),
    drafts.length === 0 ? null : (0, import_react17.createElement)(
      "div",
      { style: { marginTop: "8px" } },
      (0, import_react17.createElement)("p", { style: P.sectionLabel }, "\u65E7\u7A3F\uFF1A"),
      ...drafts.map(
        (draft) => (0, import_react17.createElement)(
          "div",
          { key: draft.path, style: P.row },
          (0, import_react17.createElement)("span", { style: P.kindTag }, "\u65E7\u7A3F"),
          (0, import_react17.createElement)("strong", { style: { fontSize: "13px" } }, `\u7B2C ${draft.version} \u7A3F`),
          (0, import_react17.createElement)(OpenArtifactButton, { item: draft, onOpen: props.onOpen })
        )
      )
    )
  );
}
function checkStateOf(check) {
  if (check?.state === "skipped") return "skipped";
  if (checkStateIsNonBlocking(check?.state)) return "not-checked";
  if (check?.ok !== true) return "failed";
  if (check?.warn === true) return "warned";
  return "passed";
}
var CHECK_STATE_ICON = Object.freeze({
  skipped: "\u23ED",
  "not-checked": "\u2754",
  failed: "\u274C",
  warned: "\u26A0\uFE0F",
  passed: "\u2705"
});
function FinalChecksBlock(props) {
  const checks = props.checks ?? [];
  const report = typeof props.aiReport === "string" && props.aiReport !== "" ? props.aiReport : null;
  const counts = { passed: 0, skipped: 0, "not-checked": 0, failed: 0, warned: 0 };
  for (const check of checks) counts[checkStateOf(check)] += 1;
  const folded = checks.length > 0 && counts.failed === 0 && counts.warned === 0;
  const foldSummary = `\u673A\u5668\u68C0\u67E5\uFF1A\u901A\u8FC7 ${counts.passed} \u9879\uFF0C\u8DF3\u8FC7 ${counts.skipped} \u9879\uFF0C\u672A\u68C0\u67E5 ${counts["not-checked"]} \u9879\uFF08\u70B9\u5F00\u770B\u660E\u7EC6\uFF09`;
  const rows = checks.length === 0 ? [(0, import_react17.createElement)("p", { key: "empty", style: P.empty }, "\u8FD8\u6CA1\u6709\u68C0\u67E5\u7ED3\u679C\u3002")] : checks.map((check) => {
    const state = checkStateOf(check);
    return (0, import_react17.createElement)(
      "div",
      { key: check.name, style: { fontSize: "12px", padding: "2px 0" } },
      // 票 20：加 ❌——真门槛（如重复标题）失败时不能再显示成 ⚠️ 那种"提示"，
      // 与「拦交付」自相矛盾；⚠️ 仍留给第三态（`ok:true + warn:true`，只提示不拦）。
      // 票 `flow-audit-2026-10/03`：`state:'not-checked'`（没有口径、未检查）用 ❔，
      // ⛔ 不许渲染成 ❌ 也不许渲染成 ✅——它既不是失败、也不是通过。
      `${CHECK_STATE_ICON[state]} ${checkHuman(check.name)}${state === "skipped" ? "\uFF08\u5DF2\u8DF3\u8FC7\uFF0C\u672A\u9A8C\uFF0C\u4E0D\u62E6\u4EA4\u4ED8\uFF09" : state === "not-checked" ? check.state === "not-rechecked" ? "\uFF08\u672A\u91CD\u8DD1\uFF0C\u672A\u68C0\u67E5\uFF0C\u4E0D\u7B97\u901A\u8FC7\uFF09" : "\uFF08\u672A\u68C0\u67E5\uFF0C\u6CA1\u6709\u53E3\u5F84\uFF0C\u4E0D\u7B97\u901A\u8FC7\uFF09" : check.note ? `\uFF08${check.note}\uFF09` : ""}`
    );
  });
  const aiSummary = aiReportSummary(report);
  return (0, import_react17.createElement)(
    "div",
    { style: S.card },
    (0, import_react17.createElement)("strong", { style: { fontSize: "13px" } }, "\u673A\u5668\u9010\u9879\u68C0\u67E5"),
    props.demo === true ? (0, import_react17.createElement)(
      "p",
      { style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.75 } },
      demoQualityChecksNote(checks)
    ) : null,
    folded ? (0, import_react17.createElement)(
      "details",
      { style: { margin: "6px 0 0" } },
      (0, import_react17.createElement)(
        "summary",
        { style: { cursor: "pointer", fontSize: "12px", opacity: 0.85 } },
        foldSummary
      ),
      (0, import_react17.createElement)("div", { style: { marginTop: "6px" } }, ...rows)
    ) : (0, import_react17.createElement)("div", { style: { marginTop: "6px" } }, ...rows),
    report !== null ? (0, import_react17.createElement)(
      "div",
      { style: { marginTop: "10px" } },
      // 票 10（判定三 #10）：界面一律说「检查」——「自查」是机器视角（谁查谁？）。
      (0, import_react17.createElement)("p", { style: { ...P.sectionLabel, margin: "0 0 4px" } }, "AI \u68C0\u67E5\u62A5\u544A"),
      aiSummary === null ? null : (0, import_react17.createElement)("p", { style: { margin: 0, fontSize: "12px", opacity: 0.85 } }, aiSummary),
      // 全文〔折〕：与站 11 同一句折叠口（`AI_REPORT_FOLD_SUMMARY`）。
      (0, import_react17.createElement)(
        "details",
        { style: { margin: "4px 0 0" } },
        (0, import_react17.createElement)(
          "summary",
          { style: { cursor: "pointer", fontSize: "12px", opacity: 0.75 } },
          AI_REPORT_FOLD_SUMMARY
        ),
        (0, import_react17.createElement)("p", { style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.85 } }, report)
      )
    ) : null
  );
}
function UndoButton(props) {
  return (0, import_react17.createElement)(
    "div",
    { style: { marginTop: "10px" } },
    (0, import_react17.createElement)(
      "button",
      {
        style: S.disabled({ ...S.smallLink, textDecoration: "none" }, props.busy === true),
        disabled: props.busy === true,
        onClick: () => props.onDeepUndo?.()
      },
      "\u21A9\uFE0F \u64A4\u9500\u521A\u624D\u7684\u5B9A\u70B9\u4FEE\u6539\uFF0810 \u5206\u949F\u5185\uFF09"
    )
  );
}
var phasePageView = defineCardView({
  card: "PhasePage",
  fromBook: [
    // ⚠️ 壳里写的是 `projector: stageStepProjector`——**原样转发**，不经 derive。
    "projector",
    // 票 11 + ADR-0021 决策 15：乐观 redo 的清除信号 ＝ 当前 `segments` 数组的 commit token。
    "processToken",
    "meta",
    "checks",
    "aiReport",
    "knowledgeMapText",
    "outlineText",
    "goldDrafts",
    "goldDraftVersion",
    "busy",
    // ⚠️ 壳里写的是 `onOpen: openInSidebar`。**book 侧刻意用壳里那个标识符**：同一个
    //    「打开」语义在这份壳里还有别的闭包（事件行那颗 `onOpen: () => viewWork(product)`、
    //    源探查卡的 `onViewReport`），一个扁平的 book 上撞了名就说不清谁是谁。
    "openInSidebar",
    // 这两个是壳里的就地箭头（`postAction({action:"deep-modify"|"deep-undo"})`），没有自己的
    // 局部标识符，prop 名就是它们在壳里写的名字。
    "onDeepModify",
    "onDeepUndo",
    // 票 `knowledge-graph-build/12`：壳里那颗「发动作并刷新」的漏斗（`onBackfillGraph` 里包着
    // `postAction({action:"knowledge-graph-backfill"})`）。**老书那颗补图键唯一的出口**——
    // 卡侧只把它原样递给 `KnowledgeGraphBackfillKey`，⛔ 卡里不自己 fetch、不自己拼动作名。
    "onBackfillGraph",
    // ── 票 `reader-cognition-boundary-build/10`：老书「补一份读者边界」那五样 ──────────────
    // 壳里都已经在 `cardBook` 上（`knowledgeMapExclusions` 与 `knowledgeMapText` 同一条路随
    // payload 下发；`chapterStatus`／`processSegs` 是书级派生；`graphDropped`／`onGraphVerdict`
    // 是图上划痕与那条「意见」通路的唯一出口）⇒ 这里只是**声明**这张卡也吃它们。
    "knowledgeMapExclusions",
    "chapterStatus",
    "processSegs",
    "graphDropped",
    "onGraphVerdict"
  ],
  required: ["projector"],
  defaults: {
    // 三个「每个 mount 点各自说」的键（见上方那张表）。壳的两个 mount 点都**显式**给，
    // 这里的缺省只是让「没给」有话说，而不是让它安静地渲出一页空阶段。
    phase: null,
    focusedStep: null,
    events: null
  },
  // book 侧键 → 卡片 prop 名。壳里是 `onOpen: openInSidebar`，卡里叫 `onOpen`。
  derive: (bag) => ({ onOpen: bag.openInSidebar })
});
function PhasePage(props) {
  const { phase, meta, onOpen } = props;
  const [redoKey, setRedoKey] = (0, import_react17.useState)(null);
  const processToken = props.processToken ?? null;
  (0, import_react17.useEffect)(() => {
    setRedoKey(null);
  }, [processToken]);
  const modProps = {
    // 提交那一下先把这一段标成「我正在做」（乐观），再交给接线层发 `deep-modify`。
    onDeepModify: (segKey, note) => {
      setRedoKey(segKey);
      props.onDeepModify?.(segKey, note);
    },
    busy: props.busy
  };
  const page = props.projector.project({
    kind: "phase",
    phase,
    focus: props.focusedStep ?? null,
    optimisticSegmentKey: redoKey
  });
  const steps = page.rows;
  const layout = PHASE_LAYOUT[phase] ?? "stack";
  const currentPhase = meta?.phase ?? 1;
  const focusedStepKey = page.focusedStepKey;
  const doneSteps = page.doneCount;
  const fileCount = page.uniqueFileCount;
  const browseRow = focusedStepKey === null ? null : steps.find((row) => row.key === focusedStepKey) ?? null;
  if (browseRow !== null) {
    return (0, import_react17.createElement)(BrowseBody, {
      row: browseRow,
      phase,
      phaseName: page.name,
      intro: page.intro,
      // 第几步按**本阶段**的步序（与卡头事实句同一口径：`第 N 阶段：第 M 步 / 共 K 步`）。
      stepIndex: steps.findIndex((row) => row.key === browseRow.key) + 1,
      stepTotal: steps.length,
      onOpen,
      onDeepModify: modProps.onDeepModify,
      busy: modProps.busy
    });
  }
  const materialSources = meta?.sources ?? [];
  const facts = phase === 1 ? `\u5DF2\u4F20 ${materialSources.length} \u4EFD\u6750\u6599\uFF0C\u8F6C\u6362\u6210\u529F ${okMaterialShards(materialSources).length} \u4EFD\u3002` : steps.length > 0 ? `${doneSteps}/${steps.length} \u6B65\u5DF2\u5B8C\u6210\uFF0C${fileCount} \u4EFD\u6587\u4EF6\u3002` : stepWord(phase < currentPhase ? "done" : "pending");
  const head = (0, import_react17.createElement)(
    "div",
    null,
    // 屏级问句＋事实句（spec §2.12–2.14 第 1–2 块）。问句**不进** `decisionOf`：阶段页没有
    // 「要你拍板」的那一问，它问的是「走到了哪、产出了什么」。
    (0, import_react17.createElement)(CardHead, {
      question: (0, import_react17.createElement)("strong", { style: CARD_HEAD_QUESTION_STYLE }, PHASE_PAGE_QUESTION),
      facts
    }),
    // 阶段头只留**阶段名与 intro**（计数已经进事实句；stage 1 的步数本来就不印）。
    (0, import_react17.createElement)(
      "div",
      { style: P.head },
      (0, import_react17.createElement)("strong", { style: P.headTitle }, page.name)
    ),
    (0, import_react17.createElement)("p", { style: P.intro }, page.intro)
  );
  const body = layout === "materials" ? (0, import_react17.createElement)(MaterialsBody, {
    // 候选 06：材料准备那一步是 phase-1 里 `target.kind === "phase"` 的**唯一**行
    // ——不再拿 `MATERIAL_STEP_KEY` 机器 key 找（key 泄漏已从 UI 移除）。
    step: steps.find((row) => row.phase === 1 && row.target?.kind === "phase") ?? null,
    sources: meta?.sources ?? [],
    // 票 `pre-gold-build/02`：材料行上的**角色**读合并件（`materials[].role`）——
    // 这就是这一页本来就有的那一份原文（第 2 阶段那块折叠读的也是它）。
    knowledgeMapText: props.knowledgeMapText,
    meta,
    events: props.events,
    onOpen
  }) : layout === "split" ? (0, import_react17.createElement)(SplitBody, { steps, onOpen, ...modProps }) : (0, import_react17.createElement)(StackBody, { steps, onOpen, ...modProps });
  const extras = [];
  if (phase === 2)
    extras.push(
      (0, import_react17.createElement)(KnowledgeMapBlock, {
        key: "km",
        text: props.knowledgeMapText,
        // 票 `knowledge-graph-build/12`：老书那颗补图键要看的三样——书级 `meta`（可见性三条）
        // 与壳里那个「发动作并刷新」的漏斗（`postAction`，原样转发，本页自己不发动作）。
        meta,
        onBackfillGraph: props.onBackfillGraph,
        // 票 `reader-cognition-boundary-build/10`：老书那颗「补一份读者边界」的键要看五样——
        // 可见性细档（`chapterStatus` ＋ `processSegs`）、图上「已否」那一档（盘上那份剔除记录
        // ∪ 本会话划痕）、以及那颗键唯一的出口（壳的 `graphOpinion`）。**原样转发**，⛔ 本页不重算。
        knowledgeMapExclusions: props.knowledgeMapExclusions,
        chapterStatus: props.chapterStatus,
        processSegs: props.processSegs,
        graphDropped: props.graphDropped,
        onGraphVerdict: props.onGraphVerdict
      })
    );
  if (phase === 3)
    extras.push((0, import_react17.createElement)(OutlineBlock, { key: "outline", text: props.outlineText }));
  if (phase === 4)
    extras.push(
      (0, import_react17.createElement)(GoldBlock, {
        key: "gold",
        goldSealed: meta?.goldSealed ?? null,
        goldDrafts: props.goldDrafts,
        goldDraftVersion: props.goldDraftVersion,
        // 票 gold-revision-flow/02：把「这一稿处在哪一态」传进去（`meta.status` + 待办阶段），
        // 调用点不替组件推导状态——组件自己按真实状态选词。
        status: meta?.status ?? null,
        pendingStage: meta?.pendingStage ?? null,
        onOpen
      })
    );
  if (phase === 6)
    extras.push(
      (0, import_react17.createElement)(FinalChecksBlock, {
        key: "checks",
        checks: props.checks,
        aiReport: props.aiReport,
        // 票 `demo-flow-fidelity/06`：演示与否只有 `meta.demo` 一个来源（`card-view.js` 的
        // 契约里 `meta` 早就在 `fromBook` 里），**不**拿检查条数去猜。
        demo: isDemoBook(meta)
      })
    );
  if (steps.length === 0 && layout !== "materials") {
    return (0, import_react17.createElement)(
      "div",
      null,
      head,
      // 「小步」是退役词（spec 不变量 7 / §6 越界清单），旧的「这一步没有小步，还没到它。」
      // 一并退役；而且这一页是**阶段页**：空的是"这一阶段还没有能摆的步"。
      // ⚠️ 句子不能说"这个阶段还没到"：抬头那一格的词可能是「已完成」（看的是**过去**的阶段，
      // 只是这份 payload 里没有它那几段——老宿主），两句会当场打架。所以取一句两头都成立的。
      (0, import_react17.createElement)("div", { style: S.card }, (0, import_react17.createElement)("p", { style: { margin: 0 } }, "\u8FD9\u4E2A\u9636\u6BB5\u8FD8\u6CA1\u6709\u53EF\u770B\u7684\u6B65\u3002"))
    );
  }
  const last = meta?.lastDeepModify ?? null;
  const lastOnThisPage = last !== null && steps.some((row) => row.segmentKey === last.segment);
  const inUndoWindow = last !== null && Date.now() - last.at <= 10 * 60 * 1e3;
  const ledgerAdvanced = last !== null && (meta?.eventCount ?? 0) !== last.eventCountAfter;
  const undoable = inUndoWindow && lastOnThisPage && !ledgerAdvanced;
  const undoClosed = inUndoWindow && lastOnThisPage && ledgerAdvanced;
  const materialOpenable = materialSources.some(
    (source) => originalPreviewOpenable(source.file) || convertedOpenable(source)
  );
  const hasOpenButton = layout === "materials" ? materialOpenable : steps.some((row) => row.artifacts.length > 0) || phase === 4 && (props.goldDrafts ?? []).length > 0;
  return (0, import_react17.createElement)(
    "div",
    null,
    head,
    ...extras,
    body,
    hasOpenButton ? (0, import_react17.createElement)("p", { style: { ...P.empty, margin: "8px 0 0" } }, OPEN_NOTE) : null,
    // 撤销点保留在**页面最底**（spec §2.13 第 9 块；裁决 §7.12 Q8「保持最底」）。
    undoable ? (0, import_react17.createElement)(UndoButton, { onDeepUndo: props.onDeepUndo, busy: props.busy }) : null,
    undoClosed ? (0, import_react17.createElement)(
      "p",
      { style: { marginTop: "10px", marginBottom: 0, fontSize: "12px", opacity: 0.85 } },
      "\u8FD9\u4E00\u6B65\u5DF2\u7ECF\u5F00\u59CB\u91CD\u505A\uFF0C\u64A4\u9500\u5DF2\u5173\u95ED"
    ) : null
  );
}

// src/ui/replay-list.js
var import_react18 = require("react");
function cardText(event) {
  const data = event.data ?? {};
  switch (event.type) {
    case "textbook/phase-start":
      return `\u9636\u6BB5 ${data.phase} \u5F00\u59CB\uFF1A${phaseUi(data.phase) || data.label || ""}`;
    case "textbook/phase-end":
      return `\u9636\u6BB5 ${data.phase} \u5B8C\u6210\uFF1A${phaseUi(data.phase) || data.label || ""}`;
    case "textbook/agent-start":
      return `AI \u5F00\u59CB\uFF1A${stageLabelHuman(data.label)}`;
    case "textbook/agent-end":
      return `AI \u5B8C\u6210\uFF1A${stageLabelHuman(data.label)}`;
    case "textbook/gate-proposal":
      return `AI \u63D0\u6848\uFF08${gateHuman(data.gate ?? "?")}\uFF0Cv${data.version ?? "?"}\uFF09\uFF1A${data.title ?? ""}`;
    case "textbook/gate-decision":
      return data.approved === true ? `${gateHuman(data.gate ?? "?")}\u901A\u8FC7\uFF08v${data.version ?? "?"}\uFF09` : `${gateHuman(data.gate ?? "?")}\u9A73\u56DE\uFF08v${data.version ?? "?"}\uFF09${data.reasons?.length > 0 ? `\uFF1A${data.reasons.join("\u3001")}` : ""}`;
    case "textbook/mineru-progress":
      return `\u8F6C\u6362 ${data.file ?? ""}\uFF1A${data.stage ?? ""}`;
    case "textbook/rollback":
      return "\u21A9\uFE0F \u5DF2\u56DE\u9000\u5230\u66F4\u65E9\u7684\u4E00\u4EFD\u5B58\u6863";
    case "textbook/source-added": {
      const role = typeof data.role === "string" && data.role !== "" ? `\uFF08${data.role}\uFF09` : "";
      return `\u5DF2\u4E0A\u4F20\u6750\u6599\uFF1A${data.file ?? ""}${role}`;
    }
    case "textbook/hint":
      return `\u{1F4A1} ${data.text ?? ""}`;
    case "textbook/error":
      return `\u26A0\uFE0F \u51FA\u9519\uFF08${stageLabelHuman(data.task ?? "")}\uFF09\uFF1A${data.message ?? ""}`;
    case "textbook/quality":
      return `\u673A\u5668\u68C0\u67E5\uFF1A${(data.checks ?? []).filter((c) => c.ok === true).length}/${(data.checks ?? []).length} \u9879\u901A\u8FC7`;
    case "textbook/delivery":
      return "\u{1F389} \u4EA4\u4ED8\u5B8C\u6210";
    case "textbook/stage-start":
      return `\u{1F3AF} \u4EA4\u7ED9 AI \u52A8\u624B\uFF1A${stageLabelHuman(data.label ?? data.stage ?? "")}`;
    case "textbook/progress":
      return `\u23F3 ${data.label ?? ""}${data.detail ? `\uFF1A${data.detail}` : ""}`;
    case "textbook/review":
      return `\u{1F440} \u62BD\u67E5\u610F\u89C1\uFF08${data.title ?? `\u7B2C${data.chapter ?? "?"}\u7AE0`}\uFF09\uFF1A${data.comment ?? ""}`;
    case "textbook/ai-report":
      return `\u{1F6E1}\uFE0F AI \u68C0\u67E5\u62A5\u544A\uFF1A${data.report ?? ""}`;
    case "textbook/deep-modify":
      return `\u270F\uFE0F \u5B9A\u70B9\u4FEE\u6539\uFF1A${segmentHuman(data.segment)}`;
    case "textbook/deep-undo":
      return `\u21A9\uFE0F \u64A4\u9500\u5B9A\u70B9\u4FEE\u6539\uFF1A${segmentHuman(data.segment)}`;
    case "textbook/pattern-added":
      return `\u{1F4C7} \u5DF2\u52A0\u81EA\u5B9A\u4E49\u6A21\u5F0F\uFF1A${data.name ?? ""}`;
    case "textbook/gold-chapter":
      return `\u{1F451} \u6700\u4F73\u8303\u4F8B\u7AE0\uFF1A\u7B2C ${data.chapter ?? "?"} \u7AE0`;
    case "textbook/chapters-review":
      return `\u{1F50D} \u7AE0\u8282\u8FC7\u76EE\u786E\u8BA4\uFF08${data.approved === true ? "\u901A\u8FC7" : "\u9A73\u56DE"}\uFF09`;
    case "textbook/final-approve":
      return `\u2705 \u6700\u540E\u68C0\u67E5\u8BA4\u53EF${data.approved === true ? "" : `\uFF1A${data.note ?? ""}`}`;
    case "textbook/submit-rejected":
      return `\u{1F6AB} \u4EA4\u5DE5\u88AB\u62D2\uFF1A${data.reason ?? ""}`;
    default:
      return `${EVENT_META[event.type]?.emoji ?? ""} ${eventHuman(event.type, EVENT_META[event.type]?.label ?? event.type)}`.trim();
  }
}
function cardIcon(event) {
  if (event.type === "textbook/gate-decision" || event.type === "textbook/outline-decision")
    return event.data?.approved === true ? "\u2705" : "\u21A9\uFE0F";
  return EVENT_META[event.type]?.emoji ?? "\u2022";
}
var REPLAY_SUMMARY_MAX = 60;
var clipText = (raw, max = REPLAY_SUMMARY_MAX) => {
  const oneLine = String(raw ?? "").replace(/\s+/g, " ").trim();
  return oneLine.length <= max ? oneLine : `${oneLine.slice(0, max)}\u2026`;
};
var stageNameFromLabel = (label) => {
  const raw = String(label ?? "");
  if (raw === "") return "";
  const human = stageLabelHuman(raw);
  return human === raw ? "" : human;
};
var goldOpinionVerbs = { dislike: "\u4E0D\u559C\u6B22", drop: "\u4E0D\u9700\u8981", change: "\u8981\u6539\u6210" };
function collapseConversionRuns(events) {
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
function replayRowSummary(row, ctx = {}) {
  const event = row?.event ?? null;
  if (event === null || typeof event !== "object") return "";
  const data = event.data ?? {};
  const run = Array.isArray(row.events) ? row.events : [event];
  if (event.type === "textbook/mineru-progress") {
    if (run.length < 2) return clipText(String(data.stage ?? ""));
    const from = formatTime(run[0].time);
    const to = formatTime(run[run.length - 1].time);
    const tail = ctx.converting === true && row.isLast === true ? "\uFF0C\u8FDB\u884C\u4E2D" : "";
    return clipText(`\uFF08${from}\u2013${to}\uFF0C${run.length} \u6B21\u8FDB\u5EA6${tail}\uFF09`);
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
        `${data.label ?? ""}${data.detail ? `\uFF1A${data.detail}` : ""}`
      );
    // 拍板结果：通过的那一档行首已经说完了；驳回要把**理由与用户整段 note**露出来。
    case "textbook/gate-decision":
    case "textbook/outline-decision":
      if (data.approved === true) return "";
      return clipText(
        [...data.reasons ?? []].join("\u3001") + (data.note ? `\uFF1A${data.note}` : "")
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
        `${failed.length} \u9879\u6CA1\u8FC7\uFF1A${failed.map((check) => `${checkHuman(check.name)}\uFF08${check.note ?? "\u6CA1\u5199\u539F\u56E0"}\uFF09`).join("\uFF1B")}`
      );
    }
    // P25：意见的落点/类型/内容都在 `data.opinion` 里（原来的渲染读错了字段、印出 #undefined）。
    case "textbook/gold-opinion": {
      const opinion = data.opinion ?? {};
      const verb = goldOpinionVerbs[opinion.kind] ?? opinion.kind ?? "";
      return clipText(
        `${opinion.target ?? "\u7B3C\u7EDF"}\uFF0C${verb}${opinion.wish ? `\uFF1A${opinion.wish}` : ""}`
      );
    }
    case "textbook/style-note":
      return clipText(data.styleNote?.text);
    case "textbook/intervention":
      return clipText(data.text);
    default:
      return "";
  }
}
var stageWordForEvent = (data) => {
  const raw = typeof data?.stage === "string" ? data.stage : "";
  if (raw === "") return "";
  return Object.hasOwn(STAGE_HUMAN, raw) ? STAGE_HUMAN[raw] : "";
};
var withStageWord = (body, data) => {
  const word = stageWordForEvent(data);
  if (word === "") return String(body ?? "");
  const text = String(body ?? "").trim();
  return `\u9636\u6BB5\uFF1A${word}${text === "" ? "" : `
${text}`}`;
};
function replayRowDetail(row) {
  const event = row?.event ?? null;
  if (event === null || typeof event !== "object") return "";
  const data = event.data ?? {};
  const run = Array.isArray(row.events) ? row.events : [event];
  if (event.type === "textbook/mineru-progress")
    return run.map(
      (item) => `${formatTime(item.time)}\u3000${String(item.data?.stage ?? "")}${item.data?.file ? `\uFF08${item.data.file}\uFF09` : ""}`
    ).join("\n");
  switch (event.type) {
    case "textbook/submit-rejected":
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
      return [data.note ?? "", [...data.reasons ?? []].join("\u3001")].filter((part) => String(part).trim() !== "").join("\n");
    case "textbook/quality":
      return (Array.isArray(data.checks) ? data.checks : []).filter((check) => check.ok !== true).map((check) => `${checkHuman(check.name)}\uFF1A${check.note ?? "\u6CA1\u5199\u539F\u56E0"}`).join("\n");
    default:
      return "";
  }
}
var replayListView = defineCardView({
  card: "ReplayList",
  fromBook: [
    "events",
    "meta",
    "workFiles",
    "workKnown",
    "gateOpen",
    "setGateOpen",
    "onViewRow"
  ],
  required: ["events", "meta", "workFiles", "gateOpen", "setGateOpen", "onViewRow"],
  // 没有任何「现算表达式」：本卡**全部消费**都落在 `fromBook` 那七项上，所以
  // `test-card-views-coverage.mjs` 的豁免表**该行为空**（不是靠加豁免通过）。
  derive: () => ({})
});
function ReplayList(props) {
  const {
    events,
    meta,
    workFiles,
    workKnown,
    gateOpen,
    setGateOpen,
    onViewRow
  } = props;
  return collapseConversionRuns(events).map((row) => {
    const event = row.event;
    const isRun = row.events.length > 1;
    const product = workPathForEvent(event, meta, workFiles);
    const blocked = workKnown && workEntryForEvent(event, meta, workFiles).kind === "blocked";
    const isGate = event.type === "textbook/gate-proposal";
    const rowKey = `${event.seq}::${event.type}::${event.time}${isRun ? `::run${row.events.length}` : ""}`;
    const detailOpen = gateOpen === rowKey;
    const rowSummary = replayRowSummary(row, {
      converting: meta?.converting === true
    });
    const rowFull = replayRowDetail(row);
    const expandable = !isGate && rowFull !== "" && rowFull !== rowSummary;
    const toggleLabel = isRun ? `\u25B8 \u770B ${row.events.length} \u6761\u8FDB\u5EA6` : "\u25B8 \u770B\u8BE6\u60C5";
    return (0, import_react18.createElement)(
      "div",
      {
        key: rowKey,
        // 票 06（`event-row-entries/spec.md` 决策 7；`workbench-transitions/spec.md`
        // 不变量 2）：**整行不可点**。原来这条行挂着一个容器级 `onClick`，把
        // 「开产物 / 展开提案」两个身份缝在同一条行上、还带 `cursor: pointer` 的
        // 可点暗示——一个热区只干一件事，行里从此只留行内显式控件（下面那两颗按钮：
        // 提案行的「▸ 提案详情 / ▾ 收起」与有产物行的「打开」）。
        style: S.card
      },
      (0, import_react18.createElement)(
        "div",
        null,
        (0, import_react18.createElement)("span", null, cardIcon(event)),
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
        (0, import_react18.createElement)(
          "strong",
          null,
          eventHuman(event.type, EVENT_META[event.type]?.label ?? "")
        ),
        // 票 07（P28/P11/P57）：摘要**追加在行首之后**（不是把行首换掉——那是
        // `smoke-test.mjs` 行首探针守着的硬天花板）。内容取账本 `data` 里早有
        // 的字段：驳回理由、交工被拒的原因、机器兜底拦下了什么、进度叙述、提示
        // 正文……截断到与行文本上限同口径；没有对应字段的类型整格不出
        //（渲染缺口，不是采集缺口——本票不新增任何采集）。
        rowSummary !== "" ? (0, import_react18.createElement)(
          "span",
          {
            style: {
              marginLeft: "8px",
              opacity: 0.82,
              fontSize: "12px"
            }
          },
          rowSummary
        ) : null,
        // 票 07（`event-row-entries/spec.md` 决策 7；`workbench-transitions/spec.md`
        // 不变量 2）：行内那颗**纯展开**控件——只干一件事（改展开态），
        // **不发动作、不开右栏**。它与同行的「打开」是"两个控件、各一个身份"
        //（整块热区里嵌行内控件合法），不是"同一热区两个身份"。
        // 必须是真 `<button>` 且文字挂在**第一个文本子节点**上：按文本找按钮的
        // 辅助件只认这个形状（`assertion-plan.md` §2「findButton」）。
        // 提案行照旧说「▸ 提案详情」；其余**有全文**的行说「▸ 看详情」/「▸ 看 N 条
        // 进度」——票 07 把展开门从"只认提案行"按事件类型放开（判据见上面
        // `expandable` 那几行）。热区身份＝**纯展开收起**（不变量 2）。
        isGate || expandable ? (0, import_react18.createElement)(
          "button",
          {
            style: { ...S.smallLink, marginLeft: "10px" },
            onClick: () => setGateOpen(detailOpen ? null : rowKey),
            // 悬浮提示只说这颗控件干的那一件事（不变量 12：文案不承诺没有
            // 机制的）——说「详情」不说「全文」。
            title: detailOpen ? "\u6536\u8D77\u8FD9\u4E00\u6761\u7684\u8BE6\u60C5" : isGate ? "\u5C31\u5730\u5C55\u5F00\u8FD9\u4EFD\u63D0\u6848\u7684\u8BE6\u60C5\uFF08\u4E0D\u6253\u5F00\u53F3\u680F\uFF09" : "\u5C31\u5730\u5C55\u5F00\u8FD9\u4E00\u6761\u7684\u8BE6\u60C5\uFF08\u4E0D\u6253\u5F00\u53F3\u680F\uFF0C\u4E5F\u4E0D\u53D1\u52A8\u4F5C\uFF09"
          },
          detailOpen ? "\u25BE \u6536\u8D77" : isGate ? "\u25B8 \u63D0\u6848\u8BE6\u60C5" : toggleLabel
        ) : null,
        product !== null ? (0, import_react18.createElement)(OpenArtifactButton, {
          // 票 02 导出的同一颗按钮（spec 决策 9：不新造控件）。
          // 名字取**客户端按路径判**的 `artifactName`（票 05）：不读服务端
          // label、不把路径原文摆上屏；悬浮提示同源——按钮内部自己按
          // `artifactName(item.path)` 拼（票 06 第 5 条：不另造第二套提示语）。
          item: product,
          label: `${artifactName(product.path)} \u6253\u5F00`,
          // 只开这一个：交给既有收口 `viewWork`（产物判据 → DSH 右栏），
          // 不在事件行里另写第二条打开路径。
          onOpen: () => onViewRow(product)
        }) : blocked ? (
          // 票 08（决策 8）：**灰字，不是灰按钮**。三条理由（spec 原文）：
          // ①不可点的控件摆进可点那一列会撞不变量 2 的「同一排可点性一致」；
          // ②它要给**还不存在的产物**起名字，与「产物名」口径别扭；
          // ③真账本上这事只发生在一本书、而且是同一对控件重复 195 次。
          // `<span>` 不是 `<button>`＝不进热区、不参与点击、不发动作。
          (0, import_react18.createElement)("span", { style: S.hint }, "\u7ED3\u679C\u8FD8\u6CA1\u751F\u6210")
        ) : null,
        (0, import_react18.createElement)(
          "span",
          {
            style: {
              float: "right",
              opacity: 0.6,
              fontSize: "12px"
            }
          },
          formatTime(event.time)
        )
      ),
      isGate ? detailOpen ? (0, import_react18.createElement)(
        "div",
        {
          style: {
            marginTop: "6px",
            fontSize: "12px",
            opacity: 0.9
          }
        },
        (0, import_react18.createElement)(
          "p",
          { style: { margin: "0 0 4px" } },
          event.data?.summary ?? ""
        ),
        (event.data?.detail ?? "") !== "" ? (0, import_react18.createElement)(
          "div",
          { style: { margin: "4px 0 0" } },
          ...bodyOf(event.data.detail, BODY_KIND_MARKDOWN)
        ) : null
      ) : (event.data?.summary ?? "") !== "" ? (0, import_react18.createElement)(
        "div",
        { style: { marginTop: "6px", opacity: 0.85 } },
        event.data.summary
      ) : null : null,
      // 票 07（P29）：非提案行的展开态——给的是这一行的**全文**
      //（驳回理由原文 / 交工被拒的原因 / 机器兜底那条 / N 条转换进度…）。
      // 纯展开收起：只改这一行的可见性，不发动作、不开右栏、不换屏。
      expandable && detailOpen ? (0, import_react18.createElement)(
        "pre",
        {
          style: {
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            background: "var(--dsw-alias-bg-layer-1)",
            borderRadius: "6px",
            padding: "8px",
            fontSize: "12px",
            margin: "4px 0 0"
          }
        },
        rowFull
      ) : null
    );
  });
}

// src/ui/card-routing.js
var CARD_ROUTING = Object.freeze([
  Object.freeze({
    slot: "gate",
    routedBy: "gate",
    arm: "case",
    component: GatePanel,
    build: gatePanelView,
    module: "./src/ui/event-cards.js"
  }),
  Object.freeze({
    slot: "explore",
    routedBy: "explore",
    arm: "case",
    component: ExploreConfirmCard,
    build: exploreConfirmCardView,
    module: "./src/ui/confirm-cards.js"
  }),
  Object.freeze({
    slot: "goals",
    // `awaiting-explore` 下的**第二个停点**（站 3）：同一个状态值，由 `meta.exploreConfirmed` 折出。
    routedBy: "goals",
    arm: "case",
    component: GoalsConfirmCard,
    build: goalConfirmCardView,
    module: "./src/ui/goal-cards.js"
  }),
  Object.freeze({
    slot: "outline",
    routedBy: "outline",
    arm: "case",
    component: OutlineConfirmCard,
    build: outlineConfirmCardView,
    module: "./src/ui/confirm-cards.js"
  }),
  Object.freeze({
    slot: "gold",
    routedBy: "gold",
    arm: "case",
    component: GoldTable,
    build: goldTableView,
    module: "./src/ui/gold-table.js"
  }),
  Object.freeze({
    slot: "upload",
    routedBy: "upload",
    arm: "case",
    component: UploadArea,
    build: uploadAreaView,
    module: "./src/ui/event-cards.js"
  }),
  Object.freeze({
    slot: "status",
    // 兜底臂：`focusCardKey` 是全函数，凡没被专门路由的状态都落它。
    routedBy: "status",
    arm: "default",
    component: StatusCard,
    build: statusCardView,
    module: "./src/ui/event-cards.js"
  }),
  Object.freeze({
    slot: "delivered",
    routedBy: "delivered",
    arm: "case",
    component: DeliveryCard,
    build: deliveryCardView,
    module: "./src/ui/event-cards.js"
  }),
  Object.freeze({
    slot: "final",
    routedBy: "final",
    arm: "case",
    component: FinalApprovalCard,
    build: finalApprovalCardView,
    module: "./src/ui/event-cards.js"
  }),
  Object.freeze({
    slot: "chapters",
    routedBy: "chapters",
    arm: "case",
    component: ChaptersCard,
    build: chaptersCardView,
    module: "./src/ui/chapters-map.js"
  }),
  Object.freeze({
    slot: "progressOverview",
    routedBy: null,
    component: ProgressOverview,
    build: progressOverviewView,
    module: "./src/ui/chapters-map.js",
    mount: "\u300C\u73B0\u5728\u300D\u90A3\u4E00\u5C4F\u7684\u5168\u89C8\u6761\uFF08\u7126\u70B9\u533A\u4E3B\u5361\u4E0A\u65B9\u7684\u8FDB\u5EA6\u6761\uFF0C\u4E0D\u662F\u7126\u70B9\u533A\u4E3B\u5361\uFF09"
  }),
  Object.freeze({
    slot: "replay",
    routedBy: null,
    component: ReplayList,
    build: replayListView,
    module: "./src/ui/replay-list.js",
    mount: "\u300C\u4E4B\u524D\u7684\u8FC7\u7A0B\u300D\u65C1\u6302\u7684\u8D26\u672C\u56DE\u653E\u5217\u8868\uFF08\u56DE\u770B\u6001\uFF0F\u5C55\u5F00\u65F6\u51FA\u73B0\uFF0C\u4E0D\u5360\u7126\u70B9\u533A\uFF09"
  }),
  Object.freeze({
    slot: "phasePageBrowse",
    routedBy: null,
    component: PhasePage,
    build: phasePageView,
    module: "./src/ui/phase-page.js",
    mount: "\u6D4F\u89C8\u6001\u9636\u6BB5\u9875\uFF08\u9636\u6BB5\u7247\u70B9\u4E00\u6B65\u843D\u5230\u90A3\u4E00\u9875\uFF1B\u4E0E phasePagePhase \u5171\u7528\u4E00\u4EFD\u5951\u7EA6\uFF09"
  }),
  Object.freeze({
    slot: "phasePagePhase",
    routedBy: null,
    component: PhasePage,
    build: phasePageView,
    module: "./src/ui/phase-page.js",
    mount: "\u9636\u6BB5\u9875\u6001\u9636\u6BB5\u9875\uFF08\u9876\u680F\u70B9\u4E00\u683C\u843D\u5230\u90A3\u4E00\u9875\uFF1B\u4F4D\u7F6E\u5939\u5728\u4E09\u4E2A\u5C55\u5F00\u9762\u677F\u4E4B\u95F4\uFF09"
  })
]);
var ROUTED_ROWS = new Map(
  CARD_ROUTING.filter((row) => row.routedBy !== null && row.arm === "case").map((row) => [row.routedBy, row])
);
var DEFAULT_ROW = CARD_ROUTING.find((row) => row.arm === "default");
function rowFor(key) {
  return ROUTED_ROWS.get(key) ?? DEFAULT_ROW;
}
var SLOTS_FROM_TABLE = Object.freeze(
  Object.fromEntries(CARD_ROUTING.map((row) => [row.slot, row.build]))
);
function slotsFromTable() {
  return SLOTS_FROM_TABLE;
}

// src/ui/card-book.js
var CardBookError = class extends TypeError {
};
var CARD_BOOK_GROUPS = Object.freeze({
  /** 书级只读数据：`/textbook/events` 等那份 snapshot 与它的现算派生（壳级 `deriveBookViewFacts`）。 */
  bookData: Object.freeze([
    "meta",
    "gate",
    "events",
    "checks",
    "aiReport",
    "lastEvent",
    "exploreSummary",
    "knowledgeMapText",
    "outlineText",
    "goldAuditText",
    "goldDrafts",
    "goldDraftVersion",
    "shapeReport",
    // ⚠️ 未过滤的 `meta.styleNotes`（壳里那个同名局部量是给 `StylePanel` 用的 active 过滤版，
    // 两者不是同一份）：卡读的是**全量**那份。
    "styleNotes"
  ]),
  /** 产物读取通道：地址拼装归 `ui/artifact-read.js`，画廊只换 `fetchImpl`。 */
  products: Object.freeze([
    "readArtifact",
    "fetchText",
    "downloadHref",
    "knowledgeMapExclusions",
    "readerQuestionnaireReturn"
  ]),
  /** 壳注入的接线：回调、导航目标、动作出口（值不共用，画廊那边一律空实现）。 */
  shellWiring: Object.freeze([
    "busy",
    "postAction",
    "onDecide",
    "onRollback",
    "onAddPattern",
    "maxConcurrentSubagents",
    "onSetKnobs",
    "onSkipStep",
    "onUpload",
    "onConvert",
    "onReplaceSource",
    "onRemoveSource",
    "autoSplit",
    "onDemoNext",
    "onResume",
    "onPreview",
    "onApprove",
    "onReject",
    // 票 `ui-display-redesign/20`：删书改**一步**（点一下直接发 `book-delete`）⇒ 卡袋只剩
    // 那颗真正发动作的回调；两步确认的「先进确认态」`onDeleteStart` 已从卡面退役（底栏那条
    // 小条自己的两步确认走壳里的 `deletingId`，不进卡片袋）。
    "onDeleteConfirm",
    // ⚠️ 三个「确认」各自不撞名：几张卡的 prop 都叫 `onConfirm`／`onDecide` 一族，指向的却是
    // 不同的事；合成一个会把一处手对的接线藏进壳里（见 `card-view.js` 的 delta 闭集那段）。
    "confirmExplore",
    "confirmGoals",
    "confirmOutline",
    "graphDropped",
    "onGraphVerdict",
    "predrawnLowerBoundary",
    "readerQuestionnaireSaved",
    "onOpenReaderQuestionnaire",
    "onViewReport",
    "onSuggestWords"
  ]),
  /** 壳已经算好的派生／书级 UI state：原样递下去，卡里不重算。 */
  derived: Object.freeze([
    "needsConfig",
    "pendingStageLabel",
    "progressDetail",
    "stall",
    "contextPercent",
    "runningSubagentCount",
    "gateOpen",
    "setGateOpen",
    // 「没在回看任何一步」是**显式的 null**，不是「键不存在」（卡内高亮判据写着 `!== null`）。
    "browsingKey",
    "workKnown"
  ]),
  /** 章节卡与账本回放列表：书级数据 ＋ 入账／打开的接线。 */
  chapters: Object.freeze([
    "chapterStatus",
    "pendingReviews",
    "workFiles",
    "submitReview",
    "onView",
    "onApproveAll",
    "onViewRow"
  ]),
  /** 阶段／步视图模型与导航：两处 mount 点共用同一份 projector 与其接线。 */
  stageStep: Object.freeze([
    "processSegs",
    "processToken",
    "projector",
    "onPickStep",
    "onPickPhase",
    "openInSidebar",
    "onDeepModify",
    "onDeepUndo",
    "onBackfillGraph"
  ])
});
var CARD_BOOK_KEYS = Object.freeze(Object.values(CARD_BOOK_GROUPS).flat());
function createCardBook(valueSource) {
  if (valueSource === null || typeof valueSource !== "object" || Array.isArray(valueSource)) {
    throw new CardBookError(
      "createCardBook \u7684\u503C\u6765\u6E90\u5FC5\u987B\u662F\u4E00\u4E2A\u300C\u952E \u2192 \u503C\u300D\u7684\u5BF9\u8C61\uFF08\u751F\u4EA7\u58F3\uFF0F\u753B\u5ECA\u5404\u81EA\u9012\u7ED9\u5B83\u7684\u90A3\u672C values\uFF0C\u4E0D\u662F\u888B\u5B50\u672C\u8EAB\uFF09\uFF1A\u8981\u4E48\u5FD8\u4E86\u4F20\uFF0C\u8981\u4E48\u4F20\u6210\u4E86\u6570\u7EC4\u3002"
    );
  }
  const missing = CARD_BOOK_KEYS.filter((key) => !Object.hasOwn(valueSource, key));
  if (missing.length > 0) {
    throw new CardBookError(
      `\u4E66\u7EA7\u888B\u5B50\uFF1A\u58F0\u660E\u4E86\u4F46\u6CA1\u7ED9\u503C\u7684\u952E\u2014\u2014${missing.join("\u3001")}\u3002\u8FD9\u4E9B\u952E\u5728 src/ui/card-book.js \u7684 CARD_BOOK_GROUPS \u91CC\u58F0\u660E\uFF0C\u58F0\u660E\u4E86\u5C31\u5FC5\u987B\u7ED9\u503C\u3002\u26A0\uFE0F \u663E\u5F0F\u4F20 undefined \u662F\u5408\u6CD5\u7684\u300C\u8FD9\u4E00\u4F4D\u6CA1\u6709\u300D\uFF0C\u522B\u62FF\u5B83\u6765\u7CCA\u8FD9\u4E00\u629B\uFF1A\u952E\u538B\u6839\u4E0D\u5728\u8BF4\u660E\u9012\u503C\u7684\u90A3\u4E00\u4FA7\u6CA1\u7ED9\u8FD9\u4E00\u9879\u8D77\u540D\u5B57\uFF08\u751F\u4EA7\u58F3\u6F0F\u63A5\uFF0C\u6216\u753B\u5ECA\u9002\u914D\u5668\u65E7\u4E86\uFF09\u3002`
    );
  }
  const declared = new Set(CARD_BOOK_KEYS);
  const extra = Object.keys(valueSource).filter((key) => !declared.has(key));
  if (extra.length > 0) {
    throw new CardBookError(
      `\u4E66\u7EA7\u888B\u5B50\uFF1A\u7ED9\u4E86\u4F46\u6CA1\u6709\u58F0\u660E\u7684\u952E\u2014\u2014${extra.join("\u3001")}\u3002\u503C\u6765\u6E90\u91CC\u6709\u58F0\u660E\u9762\u4E4B\u5916\u7684\u952E\uFF1A\u8981\u4E48\u4ECE\u503C\u6765\u6E90\u91CC\u5220\u6389\uFF08\u65E7\u952E\u9000\u5F79\u4E86\uFF1F\uFF09\uFF0C\u8981\u4E48\u5728 src/ui/card-book.js \u7684 CARD_BOOK_GROUPS \u91CC\u628A\u5B83\u767B\u8BB0\u6210\u8FD9\u4E00\u888B\u7684\u952E\uFF08\u62FC\u9519\u7684\u540D\u5B57\u5C31\u662F\u6052\u7A7A\uFF09\u3002`
    );
  }
  const bag = {};
  for (const key of CARD_BOOK_KEYS) bag[key] = valueSource[key];
  return Object.freeze(bag);
}

// src/ui/card-book-derive.js
var NO_EVENTS2 = Object.freeze([]);
var NO_PENDING_REVIEWS = Object.freeze([]);
var NO_CHAPTER_STATUS = Object.freeze([]);
var NO_GOLD_DRAFTS = Object.freeze([]);
var NO_WORK_FILES2 = Object.freeze([]);
var NO_SEGMENTS = Object.freeze([]);
var SHELL_STATE_KEYS = Object.freeze([
  // ── 只有壳知道的那几位
  "busy",
  "contextPercent",
  "runningSubagentCount",
  "browsingKey",
  "gateOpen",
  "setGateOpen",
  "autoSplit",
  "graphDropped",
  "predrawnLowerBoundary",
  "readerQuestionnaireSaved",
  "projector",
  // ⚠️ `processToken` 是**壳推进的那一位**（不是从快照内容派生的）：原样收、原样递（收口 review A1）。
  "processToken",
  // ── 壳级派生 `deriveBookViewFacts` 那八格里、进袋的七格（算在壳那一侧，本模块不认识 view-rules）
  "checks",
  "aiReport",
  "lastEvent",
  "needsConfig",
  "pendingStageLabel",
  "progressDetail",
  "stall"
]);
var WIRING_KEYS = Object.freeze([
  "postAction",
  "onDecide",
  "onRollback",
  "onAddPattern",
  "onSetKnobs",
  "onSkipStep",
  "onUpload",
  "onConvert",
  "onReplaceSource",
  "onRemoveSource",
  "onDemoNext",
  "onResume",
  "onPreview",
  "onApprove",
  "onReject",
  // 票 `ui-display-redesign/20`：删书一步 ⇒ 只留真正发动作的那颗回调。
  "onDeleteConfirm",
  "confirmExplore",
  "confirmGoals",
  "confirmOutline",
  "onGraphVerdict",
  "onOpenReaderQuestionnaire",
  "onViewReport",
  "onSuggestWords",
  "readArtifact",
  "fetchText",
  "downloadHref",
  "onView",
  "submitReview",
  "onApproveAll",
  "onViewRow",
  "onPickStep",
  "onPickPhase",
  "openInSidebar",
  "onDeepModify",
  "onDeepUndo",
  "onBackfillGraph"
]);
var isRecord2 = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
var PROJECTION_REQUIRED_FIELDS = Object.freeze(["projectId", "core", "work", "process"]);
function takeNamed(target, source, keys, label) {
  const missing = keys.filter((key) => !Object.hasOwn(source, key));
  if (missing.length > 0) {
    throw new CardBookError(
      `\u4E66\u7EA7\u888B\u5B50\u7684\u503C\uFF1A${label} \u91CC\u6CA1\u6709\u7ED9\u8FD9\u4E9B\u952E\u2014\u2014${missing.join("\u3001")}\u3002\u5B83\u4EEC\u7531 src/ui/card-book-derive.js \u7684 ${label} \u540D\u5355\u58F0\u660E\u3001\u672C\u6A21\u5757\u9010\u4E2A\u6309\u540D\u53D6\uFF1B\u26A0\uFE0F \u6F0F\u4F20\u5728\u8FD9\u91CC**\u4E0D\u662F**\u300C\u8FD9\u4E00\u4F4D\u6CA1\u6709\u300D\uFF08\u90A3\u8981\u663E\u5F0F\u5199 undefined\uFF09\uFF1A\u6F0F\u4F20\u7684\u503C\u4F1A\u8BFB\u6210 undefined\uFF0C\u800C\u6784\u9020\u5668\u8BA4\u663E\u5F0F undefined \u4E3A\u5408\u6CD5\uFF0C\u4E8E\u662F\u5B83\u4F1A\u9759\u9ED8\u5730\u4F20\u4E0B\u53BB\u3002\u8865\u4E0A\uFF0C\u6216\u4ECE\u540D\u5355\u91CC\u53BB\u6389\u3002`
    );
  }
  for (const key of keys) target[key] = source[key];
}
function deriveCardBook({ snapshot, shellState, wiring } = {}) {
  if (!isRecord2(snapshot)) {
    throw new CardBookError(
      `deriveCardBook \u7684 snapshot \u5FC5\u987B\u662F createBookProjection(...).snapshot() \u90A3\u4E00\u4EFD\uFF08\u4E66\u7EA7\u53EA\u8BFB\u6570\u636E\uFF09\uFF1B\u5B9E\u5F97 ${snapshot === null ? "null" : typeof snapshot}\u3002`
    );
  }
  const missingFields = PROJECTION_REQUIRED_FIELDS.filter((field) => !Object.hasOwn(snapshot, field));
  if (missingFields.length > 0) {
    throw new CardBookError(
      `deriveCardBook \u7684 snapshot \u7F3A\u8FD9\u51E0\u683C\u2014\u2014${missingFields.join("\u3001")}\u3002\u5B83\u4E0D\u662F\u6295\u5F71\u90A3\u4E00\u4EFD snapshot\uFF08\`src/client-entry.js\` \u4F20\u7684\u662F \`useSyncExternalStore\` \u8BFB\u51FA\u6765\u7684 \`book\`\uFF1B\u753B\u5ECA\u90A3\u4E00\u4EFD\u5728 \`dev/gallery/cards.js\` \u7684 \`snapshotOfRoutes\`\uFF09\uFF1A\u522B\u628A \`snapshot.core\` \u6216 \`core.data\` \u9012\u8FDB\u6765\u3002`
    );
  }
  if (!isRecord2(shellState)) {
    throw new CardBookError(
      `deriveCardBook \u7684 shellState \u5FC5\u987B\u662F\u300C\u53EA\u6709\u58F3\u77E5\u9053\u7684\u90A3\u51E0\u4F4D\u300D\u90A3\u4E2A\u5BF9\u8C61\uFF08busy\uFF0FcontextPercent\uFF0FbrowsingKey\uFF0FgateOpen\uFF0F\u2026\uFF09\uFF1B\u5B9E\u5F97 ${shellState === null ? "null" : typeof shellState}\u3002`
    );
  }
  if (!isRecord2(wiring)) {
    throw new CardBookError(
      `deriveCardBook \u7684 wiring \u5FC5\u987B\u662F\u56DE\u8C03\u7EC4\u90A3\u4E2A\u5BF9\u8C61\uFF08postAction\uFF0FonDecide\uFF0F\u5404 on*\uFF0FreadArtifact\u2026\uFF09\uFF1B\u5B9E\u5F97 ${wiring === null ? "null" : typeof wiring}\u3002`
    );
  }
  const core = isRecord2(snapshot.core) ? snapshot.core.data ?? null : null;
  const work = isRecord2(snapshot.work) ? snapshot.work : null;
  const process = isRecord2(snapshot.process) ? snapshot.process : null;
  const meta = core === null ? null : core.meta;
  const workData = work === null ? null : work.data ?? null;
  const processData = process === null ? null : process.data ?? null;
  const values = {
    // ── 书级只读数据（逐格照 `src/client-entry.js` 那份等价写法取）
    meta,
    gate: core === null ? null : core.gate,
    events: core === null ? NO_EVENTS2 : core.events,
    exploreSummary: core === null ? null : core.exploreSummary,
    knowledgeMapText: core === null ? null : core.knowledgeMap,
    outlineText: core === null ? null : core.outline,
    // 检查记录原文：`undefined` 是**有意留住的第三态**（＝还没读到），不是漏格——
    // `normalizeCore` 的注释写着为什么（它驱动 `goldDisplayPeriod` 那颗键的能力）。
    goldAuditText: core === null ? void 0 : core.goldAudit,
    goldDrafts: core === null ? NO_GOLD_DRAFTS : core.goldDrafts,
    goldDraftVersion: core === null ? 1 : core.goldDraftVersion,
    // 产物对账（`/textbook/process` 的 `shape`）：`null` ＝ 老书没有清单／读侧兜底判它不可谈。
    shapeReport: processData === null ? null : processData.shape,
    // ⚠️ **未过滤**的 `meta.styleNotes`（壳里那个同名局部量是给 `StylePanel` 用的 active 过滤版）：
    //   卡读的是**全量**那份，且契约**不给**它缺省（消费点自己写 `?? []`）——所以这里原样递。
    styleNotes: meta === null ? void 0 : meta.styleNotes,
    knowledgeMapExclusions: core === null ? null : core.knowledgeMapExclusions,
    readerQuestionnaireReturn: core === null ? null : core.readerQuestionnaireReturn,
    chapterStatus: core === null ? NO_CHAPTER_STATUS : core.chapterStatus,
    pendingReviews: core === null ? NO_PENDING_REVIEWS : core.pending.reviews,
    maxConcurrentSubagents: meta === null ? null : meta.maxConcurrentSubagents ?? null,
    // ── 产物清单与分段（`ADR-0021` 决策 11/15/16：`known` 恒在 ready 与 stale 时为真）
    workFiles: workData === null ? NO_WORK_FILES2 : workData.files,
    workKnown: work !== null && work.known === true,
    processSegs: processData === null ? NO_SEGMENTS : processData.segments
    // `processToken` **不在这里**算：它是 `shellState` 那一位（壳那枚 ref 的推进计数，原样递进袋子），
    // 见上面 `SHELL_STATE_KEYS` 与文件头那条。⛔ 不许按 `processData` 内容签名。
  };
  takeNamed(values, shellState, SHELL_STATE_KEYS, "shellState");
  takeNamed(values, wiring, WIRING_KEYS, "wiring");
  return createCardBook(values);
}

// src/ui/chat-desk.js
var import_react19 = require("react");

// src/ui/chat-source.js
var CHAT_DESK_FOOTER_KINDS = /* @__PURE__ */ new Set(["turn-tail"]);
function deriveChatDeskNodes(chat) {
  const order = chat?.order;
  const store = chat?.nodes;
  if (!Array.isArray(order) || store === null || store === void 0) return [];
  const get = typeof store.get === "function" ? store.get.bind(store) : null;
  if (get === null) return [];
  const nodes = [];
  for (const key of order) {
    const node = get(key);
    if (node === null || node === void 0) continue;
    if (node.visibility !== "visible") continue;
    if (CHAT_DESK_FOOTER_KINDS.has(node.kind)) continue;
    nodes.push(node);
  }
  return nodes;
}
function toolResultText(content) {
  const parts = [];
  for (const block of content ?? []) {
    if (block?.type === "text" && typeof block.text === "string") parts.push(block.text);
  }
  return parts.join("\n");
}
function parseQuestionAnswerText(text) {
  if (typeof text !== "string" || text === "") return null;
  try {
    const parsed = JSON.parse(text);
    if (parsed !== null && typeof parsed === "object" && Array.isArray(parsed.answers)) {
      return parsed;
    }
  } catch {
  }
  return null;
}
function questionAnswerFromContent(content) {
  return parseQuestionAnswerText(toolResultText(content));
}
function* questionCallRoots(chat, callId) {
  if (typeof callId !== "string" || callId === "") return;
  for (const node of deriveChatDeskNodes(chat)) {
    if (node.kind !== "tool-call") continue;
    const root = node.data?.root;
    if (root?.callId === callId) yield root;
  }
}
function findQuestionAnswerByCallId(chat, callId) {
  for (const root of questionCallRoots(chat, callId)) {
    if (root.kind !== "tool-result") continue;
    const answer = questionAnswerFromContent(root.content);
    if (answer !== null) return answer;
  }
  return null;
}
function isQuestionCallRunning(chat, callId) {
  for (const root of questionCallRoots(chat, callId)) {
    if (root.kind !== "tool-result") return true;
  }
  return false;
}

// src/ui/chat-desk.js
var CHAT_NUDGE_LABEL = "\u23F0 \u63D0\u9192 AI \u8BB0\u4E0B\u6765";
function blockText(block) {
  if (block === null || block === void 0) return "";
  if (typeof block.text === "string") return block.text;
  return "";
}
function assistantBlocks(blocks) {
  const parts = [];
  for (const block of blocks ?? []) {
    if (block?.kind === "text") parts.push(blockText(block));
    else if (block?.kind === "tool-call")
      parts.push(`\u{1F527} \u8C03\u7528\u5DE5\u5177\uFF1A${block.name ?? ""}`);
    else if (block?.kind === "reasoning") parts.push("\uFF08\u601D\u8003\u4E2D\u2026\uFF09");
  }
  return parts.join("\n");
}
function contentBlocksText(blocks) {
  const parts = [];
  for (const block of blocks ?? []) {
    if (block?.type === "text") parts.push(blockText(block));
    else if (block?.type === "tool_use")
      parts.push(`\u{1F527} \u8C03\u7528\u5DE5\u5177\uFF1A${block.name ?? ""}`);
  }
  return parts.join("\n");
}
function bubble(side, text, extraStyle) {
  return (0, import_react19.createElement)(
    "div",
    {
      style: {
        maxWidth: "88%",
        margin: "6px 0",
        padding: "8px 10px",
        borderRadius: "10px",
        fontSize: "13px",
        lineHeight: 1.55,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        alignSelf: side === "user" ? "flex-end" : "flex-start",
        background: side === "user" ? "var(--dsw-alias-state-business-tertiary)" : "var(--dsw-alias-bg-layer-1)",
        border: "1px solid var(--dsw-alias-border-l2)",
        ...extraStyle ?? {}
      }
    },
    text
  );
}
function toolLine(root) {
  const name = root?.name ?? root?.call?.name ?? "\u5DE5\u5177";
  if (root?.kind === "tool-result") {
    const text = contentBlocksText(root?.content).replace(/\s+/g, " ").slice(0, 120);
    return `\u{1F527} ${name} ${root?.isError === true ? "\u51FA\u9519" : "\u5B8C\u6210"}${text !== "" ? `\uFF1A${text}` : ""}`;
  }
  return `\u{1F527} ${name} \u6267\u884C\u4E2D\u2026`;
}
function muted(text) {
  return (0, import_react19.createElement)(
    "p",
    {
      style: {
        margin: "3px 0",
        fontSize: "12px",
        opacity: 0.55,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word"
      }
    },
    text
  );
}
var RECEIPT_TEXT = {
  "textbook/style-note": (d) => `\u2713 \u5DF2\u8BB0\u5165\u98CE\u683C\u7EBF${d?.styleNote?.text ? `\uFF1A${String(d.styleNote.text).slice(0, 20)}\u2026` : ""}`,
  // 票 `walkthrough-fixes/21`（2026-10-06 裁决「甲」）：原来是「（下个停靠点处理）」——与机器行为相反
  // （实测主 AI 当轮就转达给了正在写的那一章）。回执只说两态事实，不承诺时机。
  "textbook/intervention": () => "\u2713 \u5DF2\u8BB0\u5165\u7559\u8A00\uFF08\u6709 AI \u5728\u8DD1\u65F6\u5F53\u8F6E\u8F6C\u8FBE\uFF1B\u6CA1\u6709 AI \u5728\u8DD1\u65F6\u7B49\u5230\u4E0B\u4E00\u7AD9\uFF09",
  "textbook/intervention-done": () => "\u2713 \u7559\u8A00\u5DF2\u5904\u7406",
  "textbook/pause": () => "\u2713 \u5DF2\u6682\u505C",
  "textbook/resume": () => "\u2713 \u5DF2\u7EE7\u7EED",
  "textbook/outline-decision": (d) => `\u2713 \u7AE0\u8282\u5B89\u6392${d?.approved === true ? "\u5DF2\u901A\u8FC7" : "\u5DF2\u9A73\u56DE"}`,
  "textbook/gate-decision": (d) => `\u2713 \u7B2C ${d?.gate ?? "?"} \u6B21\u62CD\u677F${d?.approved === true ? "\u901A\u8FC7" : "\u9A73\u56DE"}`,
  "textbook/gold-seal": () => "\u2713 \u6700\u4F73\u8303\u4F8B\u7AE0\u5DF2\u5B9A\u7A3F\uFF08\u540E\u9762\u7684\u7AE0\u8282\u7167\u5B83\u5199\uFF09",
  "textbook/pattern-added": (d) => `\u2713 \u5DF2\u52A0\u81EA\u5B9A\u4E49\u6A21\u5F0F${d?.name ? `\uFF1A${String(d.name).slice(0, 20)}` : ""}`
};
function badgeSpan(text) {
  return (0, import_react19.createElement)(
    "div",
    {
      style: {
        margin: "2px 0 6px 12px",
        fontSize: "12px",
        color: "var(--dsw-alias-state-success-primary)",
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word"
      }
    },
    text
  );
}
function assistantBubbleText(node) {
  const data = node?.data ?? node ?? {};
  const fromBlocks = Array.isArray(data.blocks) && data.blocks.length > 0 ? assistantBlocks(data.blocks) : "";
  const fromContent = fromBlocks !== "" ? "" : contentBlocksText(node?.content) || contentBlocksText(data.content);
  const text = fromBlocks || fromContent;
  const mark = data.status === "running" ? "\u258D" : data.status === "interrupted" ? "\uFF08\u5DF2\u4E2D\u65AD\uFF09" : "";
  return `${text}${mark}`;
}
function ChatDesk(props) {
  const nodes = deriveChatDeskNodes(props.useChat((s) => s));
  const lastNode = nodes.length > 0 ? nodes[nodes.length - 1] : null;
  const events = props.events ?? [];
  const onNudge = props.onNudge ?? (() => {
  });
  const onCollapse = props.onCollapse ?? null;
  const deskScrollRef = (0, import_react19.useRef)(null);
  (0, import_react19.useEffect)(() => {
    const el = deskScrollRef.current;
    if (el === null) return void 0;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (nearBottom) el.scrollTop = el.scrollHeight;
    return void 0;
  }, [nodes.length, lastNode]);
  (0, import_react19.useEffect)(() => {
    const el = deskScrollRef.current;
    if (el !== null) el.scrollTop = el.scrollHeight;
    return void 0;
  }, []);
  const items = [];
  const push = (el) => items.push(el);
  const assistantTimes = [];
  for (const node of nodes ?? []) {
    if (node.kind !== "assistant-step" && node.kind !== "assistant") continue;
    if (assistantBubbleText(node) !== "")
      assistantTimes.push(Number(node.data?.time ?? node.time));
  }
  const badgeByAssistant = /* @__PURE__ */ new Map();
  for (const e of events) {
    const textOf = RECEIPT_TEXT[e.type];
    if (textOf === void 0 || typeof e.time !== "number") continue;
    let best = -1;
    for (let i = 0; i < assistantTimes.length; i += 1) {
      const t = assistantTimes[i];
      if (Number.isFinite(t) && e.time >= t && e.time - t < 5 * 60 * 1e3)
        best = i;
    }
    if (best >= 0) {
      const arr = badgeByAssistant.get(best) ?? [];
      arr.push(badgeSpan(textOf(e.data)));
      badgeByAssistant.set(best, arr);
    }
  }
  let assistantOrdinal = -1;
  for (const node of nodes ?? []) {
    const data = node.data ?? {};
    switch (node.kind) {
      case "user":
      case "steering": {
        const text = contentBlocksText(node.data?.content) || contentBlocksText(node.content);
        if (text !== "") push(bubble("user", text));
        break;
      }
      // F29 修复（2026-08-20 实书走查）：真实 ChatNodeKind 是 assistant-step/tool-call/
      // model-retry/command-input/manual-compaction/unknown（Inspect conversation.chat.node
      // key 域）；旧代码用 assistant/tool/retry/command/compaction/fallback 对不上，
      // 导致 AI 消息/工具卡被静默丢弃（用户消息 kind=user 恰好匹配所以能显示）。
      // 主用真实名，保留旧名作兼容。
      case "assistant-step":
      case "assistant": {
        const text = assistantBubbleText(node);
        if (text !== "") {
          assistantOrdinal += 1;
          push(bubble("assistant", text));
          const badges = badgeByAssistant.get(assistantOrdinal);
          if (badges !== void 0) for (const b of badges) push(b);
        }
        break;
      }
      case "tool-call":
      case "tool":
        push(toolLine(data.root));
        break;
      case "turn-error":
        push(
          bubble(
            "assistant",
            `\u26A0\uFE0F \u51FA\u9519\u4E86\uFF1A${data.message ?? node.message ?? ""}`,
            { color: "var(--dsw-alias-state-error-primary)" }
          )
        );
        break;
      case "model-retry":
      case "retry":
        push(
          muted(`\u21BB \u6A21\u578B\u81EA\u52A8\u91CD\u8BD5\uFF08\u7B2C ${(data.attempts ?? []).length + 1} \u6B21\uFF09`)
        );
        break;
      case "command":
      case "command-input":
        push(muted(`\u2318 /${data.command?.name ?? data.name ?? "\u547D\u4EE4"} \u5DF2\u6267\u884C`));
        break;
      case "compaction":
      case "manual-compaction":
        push(muted("\u{1F9F9} \u65E9\u671F\u5BF9\u8BDD\u5DF2\u538B\u7F29\uFF08\u5185\u5BB9\u8981\u70B9\u4FDD\u7559\uFF09"));
        break;
      case "turn-max-tokens":
        push(muted("\u26A0\uFE0F \u8FD9\u4E00\u8F6E\u5199\u5230\u957F\u5EA6\u4E0A\u9650\u88AB\u622A\u65AD"));
        break;
      case "unknown":
      case "fallback":
        push(muted(data.message ?? "\uFF08\u4E00\u6BB5\u672A\u8BC6\u522B\u7684\u8BB0\u5F55\uFF09"));
        break;
      // F29：context 是「注入的上下文」消息（system-reminder/上下文快照等），正文在 data.content，
      // 灰字折行显示（会很长，截断到 200 字提示即可，别刷屏）。
      case "context": {
        const ctxText = (contentBlocksText(data.content) || String(data.text ?? data.message ?? "")).replace(/\s+/g, " ").trim();
        push(
          muted(
            ctxText !== "" ? `\uFF08\u4E0A\u4E0B\u6587\uFF09${ctxText.slice(0, 200)}${ctxText.length > 200 ? "\u2026" : ""}` : "\uFF08\u4E0A\u4E0B\u6587\u63D0\u793A\uFF09"
          )
        );
        break;
      }
      case "workflow-run":
        push(muted("\uFF08\u5DE5\u4F5C\u6D41\u8FD0\u884C\uFF09"));
        break;
      default:
        break;
    }
  }
  if (items.length === 0)
    push(muted("\u5BF9\u8BDD\u4F1A\u5B9E\u65F6\u663E\u793A\u5728\u8FD9\u91CC\uFF1B\u4F60\u5BF9 AI \u8BF4\u8BDD\u7528\u9875\u9762\u5E95\u4E0B\u7684\u8F93\u5165\u6761\u3002"));
  return (0, import_react19.createElement)(
    "div",
    {
      ref: deskScrollRef,
      style: {
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box"
      }
    },
    onCollapse !== null ? (0, import_react19.createElement)(
      "div",
      {
        style: {
          position: "sticky",
          top: 0,
          background: "inherit",
          textAlign: "right"
        }
      },
      (0, import_react19.createElement)(
        "button",
        { style: S.smallLink, onClick: onCollapse },
        "\u6536\u6210\u4E00\u6761"
      )
    ) : null,
    (0, import_react19.createElement)(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          padding: "10px 12px",
          minHeight: "100%",
          boxSizing: "border-box"
        }
      },
      ...items,
      // 漏账催办（F5/Task 20）：对话台底部常驻小按钮，一键催主 AI 落账（nudge 动作）。
      (0, import_react19.createElement)(
        "button",
        {
          style: { ...S.smallLink, margin: "6px 0" },
          title: "AI \u5728\u5BF9\u8BDD\u91CC\u7B54\u5E94/\u8BF4\u8FC7\u7684\u4E8B\uFF0C\u5982\u679C\u5DE5\u4F5C\u53F0\u8FD8\u6CA1\u663E\u793A\uFF0C\u70B9\u8FD9\u4E2A\u63D0\u9192\u5B83\u8BB0\u4E0B\u6765",
          onClick: () => (
            // 票 10（判定三 #5）：原来写 `（style-note/progress 等）`——事件 type 是机器身份词，
            // 不该出现在发给 AI 的人话里；这句与 client-entry.js 的那处逐字相同，两处一起改。
            onNudge(
              "\u5DE5\u4F5C\u53F0\u8FD8\u6CA1\u8DDF\u4E0A\uFF0C\u8BF7\u628A\u521A\u624D\u7B54\u5E94\u7684\u4E8B\u843D\u8D26\uFF08\u6BD4\u5982\u98CE\u683C\u7EBF\u3001\u8FDB\u5EA6\uFF09"
            )
          )
        },
        CHAT_NUDGE_LABEL
      )
    )
  );
}

// src/ui/question-answer-feed.js
var QUESTION_ANSWER_DEFINITION_KIND = "textbook-question-answer";
var QUESTION_TOOL_NAME = "ask_user_question";
var PENDING_CALLS = /* @__PURE__ */ new Map();
var MAX_PENDING_CALLS = 200;
var QUESTION_ANSWER_STALL_GRACE_MS = 3e4;
var STALL_TIMERS = /* @__PURE__ */ new Map();
var LISTENERS = /* @__PURE__ */ new Set();
var PARSED_EVENTS = /* @__PURE__ */ new WeakMap();
var revision = 0;
function looksLikeAnswerBatch(content) {
  for (const block of content ?? []) {
    if (block?.type !== "text" || typeof block.text !== "string") continue;
    const text = block.text.trimStart();
    if (text.startsWith("{") && text.includes('"answers"')) return true;
  }
  return false;
}
function eventFactOf(event) {
  if (event === null || typeof event !== "object") return null;
  const cached = PARSED_EVENTS.get(event);
  if (cached !== void 0) return cached;
  let fact = null;
  if (event.type === "tool/call") {
    const callId = event.data?.callId;
    if (event.data?.name === QUESTION_TOOL_NAME && typeof callId === "string" && callId !== "") {
      fact = { callId, kind: "call" };
    }
  } else if (event.type === "tool/result") {
    const message = event.data?.message;
    const callId = typeof message?.toolCallId === "string" ? message.toolCallId : message?.source?.callId;
    if (typeof callId === "string" && callId !== "") {
      const known = PENDING_CALLS.has(callId);
      const answer = known || looksLikeAnswerBatch(message?.content) ? questionAnswerFromContent(message?.content) : null;
      if (known || answer !== null) fact = { callId, kind: "result", answer };
    }
  }
  PARSED_EVENTS.set(event, fact);
  return fact;
}
function publish() {
  revision += 1;
  for (const listener of [...LISTENERS]) {
    try {
      listener();
    } catch (err) {
      console.warn("[workbench] \u63D0\u95EE\u7B54\u6848\u7F13\u5B58\u7684\u8BA2\u9605\u8005\u629B\u9519", err);
    }
  }
}
function callEntryCount() {
  return PENDING_CALLS.size;
}
function trimCalls() {
  while (callEntryCount() > MAX_PENDING_CALLS) {
    const oldest = PENDING_CALLS.keys().next().value;
    if (oldest === void 0) return;
    clearQuestionAnswerFromFeed(oldest);
  }
}
function rememberCall(callId) {
  if (PENDING_CALLS.has(callId)) return;
  PENDING_CALLS.set(callId, { status: "pending" });
  const timer = setTimeout(() => {
    STALL_TIMERS.delete(callId);
    if (PENDING_CALLS.get(callId)?.status !== "pending") return;
    rememberResult(callId, null);
  }, QUESTION_ANSWER_STALL_GRACE_MS);
  if (typeof timer?.unref === "function") timer.unref();
  STALL_TIMERS.set(callId, timer);
  trimCalls();
}
function clearStallTimer(callId) {
  const timer = STALL_TIMERS.get(callId);
  if (timer === void 0) return;
  STALL_TIMERS.delete(callId);
  clearTimeout(timer);
}
function rememberResult(callId, answer) {
  clearStallTimer(callId);
  const previous = PENDING_CALLS.get(callId);
  PENDING_CALLS.set(callId, { status: "settled", answer });
  trimCalls();
  if (previous?.status === "settled" && previous.answer === answer) return;
  publish();
}
function absorb(match) {
  const fact = eventFactOf(match?.event);
  if (fact === null) return;
  if (fact.kind === "call") rememberCall(fact.callId);
  else rememberResult(fact.callId, fact.answer);
}
function createQuestionAnswerDefinition() {
  return {
    kind: QUESTION_ANSWER_DEFINITION_KIND,
    match(event) {
      const fact = eventFactOf(event);
      return fact === null ? null : { id: fact.callId, role: "start" };
    },
    start(_context, match) {
      absorb(match);
      return true;
    },
    update(_context, match) {
      absorb(match);
      return true;
    }
  };
}
function readQuestionAnswerFromFeed(callId) {
  if (typeof callId !== "string" || callId === "") return null;
  const entry = PENDING_CALLS.get(callId);
  return entry?.status === "settled" && entry.answer !== null ? entry.answer : null;
}
function isQuestionCallExpectedInFeed(callId) {
  if (typeof callId !== "string" || callId === "") return false;
  return PENDING_CALLS.get(callId)?.status === "pending";
}
function subscribeQuestionAnswerFeed(listener) {
  if (typeof listener !== "function") return () => {
  };
  LISTENERS.add(listener);
  return () => {
    LISTENERS.delete(listener);
  };
}
function getQuestionAnswerFeedRevision() {
  return revision;
}
function clearQuestionAnswerFromFeed(callId) {
  if (typeof callId !== "string" || callId === "") return;
  PENDING_CALLS.delete(callId);
  clearStallTimer(callId);
}

// src/ui/panels.js
var import_react20 = require("react");
var hasProgressDetail = (detail) => typeof detail === "string" && detail.trim() !== "";
var handedOverNow = (pendingStage) => pendingStage !== null && pendingStage !== void 0;
var activityClaimUnsupported = (pendingStage, progressDetail) => handedOverNow(pendingStage) && !hasProgressDetail(progressDetail);
var STATUS_TONE_ICON = Object.freeze({
  ok: "\u{1F389}",
  error: "\u26A0\uFE0F",
  you: "\u26A1",
  config: "\u{1F511}",
  ai: "\u{1F916}"
});
function StatusStrip(props) {
  const { meta, gate, pendingStage, metaLabel, progressDetail } = props;
  const human = statusHuman(withPendingStage(meta, pendingStage), gate);
  const handedOver = handedOverNow(pendingStage);
  const busy = human.humanTurn !== true && human.tone === "ai";
  const detailEmpty = activityClaimUnsupported(pendingStage, progressDetail);
  if (human.word === null || busy && handedOver && detailEmpty) return null;
  const tone = human.tone;
  const joiner = tone === "ai" ? "\uFF1A" : "\uFF0C";
  const text = tone === "you" ? `${STATUS_TONE_ICON[tone]} ${human.word}` : `${STATUS_TONE_ICON[tone]} ${human.word}${joiner}${busy && handedOver ? metaLabel ?? "" : human.action}`;
  const bg = {
    ok: "var(--dsw-alias-state-success-tertiary)",
    you: "var(--dsw-alias-state-warn-tertiary)",
    config: "var(--dsw-alias-state-warn-tertiary)",
    ai: "var(--dsw-alias-state-business-tertiary)",
    error: "var(--dsw-alias-file-diff-deleted-bg)",
    normal: "transparent"
  }[tone];
  const border = {
    ok: "#1a7f37",
    you: "#d4a72c",
    config: "#d4a72c",
    ai: "var(--dsw-alias-state-business-primary)",
    error: "var(--dsw-alias-state-error-primary)",
    normal: "transparent"
  }[tone];
  return (0, import_react20.createElement)(
    "div",
    {
      style: {
        borderRadius: "8px",
        padding: "8px 12px",
        margin: "0 0 10px",
        fontSize: "13px",
        background: bg,
        border: `1px solid ${border}`,
        fontWeight: 600
      }
    },
    text
  );
}
function IdentityTakeoverNote(props) {
  const { text, onClose } = props;
  if (typeof text !== "string" || text === "") return null;
  return (0, import_react20.createElement)(
    "div",
    {
      role: "status",
      // 走查器与判据都按这一个属性认这一条（⛔ 与自动跟随横幅共用 `data-auto-follow`）。
      "data-identity-takeover": "1",
      style: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        margin: "0 0 10px",
        padding: "8px 12px",
        borderRadius: "8px",
        fontSize: "13px",
        background: "var(--dsw-alias-state-warn-tertiary)",
        border: "1px solid #d4a72c"
      }
    },
    (0, import_react20.createElement)("span", { style: { flex: 1 } }, text),
    (0, import_react20.createElement)(
      "button",
      {
        type: "button",
        style: S.smallLink,
        title: "\u5173\u6389\u8FD9\u6761\u544A\u77E5\uFF08\u53EA\u662F\u4E0D\u518D\u663E\u793A\uFF0C\u4E0D\u4F1A\u6362\u56DE\u90A3\u672C\u4E66\uFF09",
        onClick: onClose
      },
      "\u2715"
    )
  );
}
function ActivityLine(props) {
  const { meta, stall, subagents, humanTurn, onResume, progressDetail, pendingStage } = props;
  const runs = { count: 0, runningCount: 0, ...subagents ?? {} };
  const aggText = Number.isSafeInteger(runs.runningCount) && runs.runningCount > 0 ? `\u{1F50E} ${runs.runningCount} \u4E2A\u5C0F\u52A9\u624B\u5728\u8DD1` : "";
  const stalled = (stall ?? {}).stalled === true;
  const paused = pausedNow(meta);
  const owner = turnOwnerOf(withPendingStage(meta, pendingStage), null);
  const idlePrefix = `\u23F1 ${humanDuration(stall?.idleMs)}\u6CA1\u52A8\u9759\u4E86 `;
  const content = humanTurn === true || paused || owner === null ? null : (
    // 已交付＝全书完成：此时既不是「轮到你」也不是「我正在做」（真 GUI 判读实测：
    // 已交付的《工业大数据分析》活性行还写着「⚡ 轮到你」，同一屏却在大喊「🎉 书做好了」）。
    owner === "done" ? "\u2705 \u5DF2\u5B8C\u6210" : owner === "you" ? "\u26A1 \u8F6E\u5230\u4F60" : stalled ? (0, import_react20.createElement)(
      "span",
      null,
      idlePrefix,
      // 票 `real-machine-walkthrough-20261114/05`：**有子助手在跑时不摆那颗键**。
      // 真机那一屏同时写「5 个小助手在跑」与「8 分钟没动静了 🔁 从断点继续」——
      // 两颗事实各自成立，但「从断点继续」在有人干活时点下去会与正在跑的子助手
      // 撞车（重复派章、重复写）。⇒ 这一档只说「在等谁」，不给那颗键。
      runs.runningCount > 0 || (stall ?? {}).subagentsRunning === true ? (0, import_react20.createElement)(
        "span",
        { title: "\u5B83\u4EEC\u8FD8\u5728\u5199\uFF0C\u7B49\u5B83\u4EEC\u4EA4\u56DE\u518D\u5224\u65AD\u8981\u4E0D\u8981\u7EE7\u7EED" },
        `\xB7 \u7B49 ${Math.max(runs.runningCount, 1)} \u4E2A\u5C0F\u52A9\u624B\u4EA4\u56DE`
      ) : (0, import_react20.createElement)(
        "button",
        {
          style: S.smallLink,
          onClick: onResume,
          // 票 stale-detection/01：原来那颗写着「让 AI 接着干」、做的只是「催一句」
          // （标签与动作本身对不上），而且没有活着的主 AI 时直接报错。
          // 现在发「从断点继续」：会写状态、清暂停标记、必要时重新交办，
          // 没有活的主 AI 时还能退回推状态机这条路。
          title: "\u8BA9 AI \u4ECE\u65AD\u70B9\u63A5\u7740\u505A\u5B8C\u8FD9\u4E00\u6B65\uFF08\u4E0D\u91CD\u505A\u5DF2\u5B8C\u6210\u7684\u90E8\u5206\uFF1B\u5B83\u6CA1\u5728\u8DD1\u65F6\u4E5F\u80FD\u628A\u5B83\u53EB\u8D77\u6765\uFF09"
        },
        "\u{1F501} \u4ECE\u65AD\u70B9\u7EE7\u7EED"
      )
    ) : null
  );
  if (content === null && aggText === "") return null;
  return (0, import_react20.createElement)(
    "div",
    {
      style: {
        margin: "0 0 10px",
        fontSize: "12px",
        opacity: 0.85,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        flexWrap: "wrap"
      }
    },
    aggText !== "" ? (0, import_react20.createElement)(
      "span",
      { style: { fontWeight: 600, color: "#0969da" } },
      aggText
    ) : null,
    content
  );
}
var INTERRUPT_NOTE_TEXT = "\u{1F4A1} \u5DF2\u8BB0\u4E0B\uFF1B\u4E0D\u6253\u65AD\u6B63\u5728\u5199\u7684\u8FD9\u4E00\u7AE0\uFF0CAI \u5F53\u8F6E\u5C31\u53EE\u5631\u6B63\u5728\u5199\u5B83\u7684\u5C0F\u52A9\u624B\u3002";
var INTERRUPT_NOTE_TEXT_BREAKS_CHAPTER = "\u{1F4A1} \u5DF2\u8BB0\u4E0B\uFF1B\u8FD9\u4E00\u7AE0\u4EA4\u7ED9 AI \u53BB\u6539\u4E86\uFF0C\u8FC7\u76EE\u5148\u6536\u8D77\u6765\u4E86\u2014\u2014AI \u6539\u5B8C\u4F1A\u628A\u8FD9\u4E00\u7AE0\u91CD\u65B0\u644A\u5F00\u7ED9\u4F60\u8FC7\u76EE\u3002";
var GOLD_NOTE_DISPLAY_PERIOD = "\u{1F4A1} \u8BB0\u4E0B\u4E86\uFF1B\u8FD9\u4E00\u8F6E\u68C0\u67E5\u4E0D\u4F1A\u8BFB\u5B83\uFF0C\u7B49\u68C0\u67E5\u6536\u5DE5\u518D\u70B9\u3010\u8BA9 AI \u7167\u8FD9\u4E9B\u6539\u3011\u3002";
var GOLD_NOTE_AWAITING_SEAL = "\u{1F4A1} \u8BB0\u4E0B\u4E86\uFF1B\u70B9\u3010\u8BA9 AI \u7167\u8FD9\u4E9B\u6539\u3011\uFF0CAI \u624D\u4F1A\u7167\u5B83\u6539\u3002";
function interruptNoteText({ action, meta, pendingStage } = {}) {
  if (action === "gold-opinion") {
    if (goldDraftDisplayed(meta, pendingStage)) return GOLD_NOTE_DISPLAY_PERIOD;
    if (meta?.status === "awaiting-gold") return GOLD_NOTE_AWAITING_SEAL;
  }
  if (meta?.phase !== 5) return null;
  if (meta?.status === "awaiting-chapters-review") return INTERRUPT_NOTE_TEXT_BREAKS_CHAPTER;
  if (meta?.status === "running") return INTERRUPT_NOTE_TEXT;
  return null;
}
function InterruptNote(props) {
  return (0, import_react20.createElement)(
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
        gap: "8px"
      }
    },
    (0, import_react20.createElement)(
      "span",
      { style: { flex: 1 } },
      props.text ?? INTERRUPT_NOTE_TEXT
    ),
    (0, import_react20.createElement)(
      "button",
      { style: S.smallLink, onClick: props.onClose },
      "\u2715"
    )
  );
}
var AUTO_FOLLOW_KEYFRAMES = "@keyframes dsh-auto-follow-in { from { transform: translateY(-10px); opacity: 0 } to { transform: translateY(0); opacity: 1 } } @media (prefers-reduced-motion: reduce) { [data-auto-follow] { animation: none !important; } }";
var AUTO_FOLLOW_BANNER_STYLE = {
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
  animation: "dsh-auto-follow-in 250ms ease-out"
};
function AutoFollowAwaitNote(props) {
  return (0, import_react20.createElement)(
    "div",
    { role: "status", "data-auto-follow": "1", style: AUTO_FOLLOW_BANNER_STYLE },
    (0, import_react20.createElement)("style", null, AUTO_FOLLOW_KEYFRAMES),
    (0, import_react20.createElement)(
      "span",
      { style: { flex: 1 } },
      "\u26A1 \u8F6E\u5230\u4F60\uFF0C\u5DF2\u5207\u56DE\u73B0\u5728"
    ),
    (0, import_react20.createElement)(
      "button",
      { style: S.smallLink, onClick: props.onClose },
      "\u2715"
    )
  );
}
function AutoFollowProgressNote(props) {
  const onDismiss = props.onDismiss ?? (() => {
  });
  return (0, import_react20.createElement)(
    "div",
    {
      role: "status",
      "data-auto-follow": "1",
      style: { ...AUTO_FOLLOW_BANNER_STYLE, cursor: "pointer" },
      onClick: props.onJump
    },
    (0, import_react20.createElement)("style", null, AUTO_FOLLOW_KEYFRAMES),
    (0, import_react20.createElement)("span", { style: { flex: 1 } }, "\u25B6 \u6211\u6B63\u5728\u505A\uFF0C\u70B9\u6B64\u8DF3\u8FC7\u53BB"),
    (0, import_react20.createElement)(
      "button",
      {
        style: S.smallLink,
        onClick: (e) => {
          e.stopPropagation();
          onDismiss();
        }
      },
      "\u2715"
    )
  );
}
function TopBar(props) {
  const { meta, openStylePanel, openIntervene, pause, resume } = props;
  const styleCount = (meta?.styleNotes ?? []).filter(
    (n) => n.status === "active"
  ).length;
  const pendingCount = (meta?.pendingInterventions ?? []).filter(
    (i) => i.status === "pending"
  ).length;
  return (0, import_react20.createElement)(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 8px",
        borderBottom: "1px solid var(--dsw-alias-border-l2)",
        flexWrap: "wrap"
      }
    },
    (0, import_react20.createElement)("strong", null, `\u300A${meta?.name ?? ""}\u300B`),
    (0, import_react20.createElement)(
      "span",
      { style: { fontSize: "12px", opacity: 0.75 } },
      `\u4E00\u8D77\u505A\u5230\uFF1A${phaseUi(meta?.phase)}`
    ),
    (0, import_react20.createElement)("span", { style: { flex: 1 } }),
    styleCount > 0 ? (0, import_react20.createElement)(
      "button",
      {
        style: S.smallLink,
        onClick: openStylePanel,
        // 票 `demo-channel-full/26`：这一句对演示书是假话（章正文是固定内容，
        // ⛔ 没有「写每一章都照着办」这回事）⇒ 两取值，出口在 view-rules。
        title: styleNotesPanelTitle(meta)
      },
      `\u{1F3A8} \u98CE\u683C\u7EBF(${styleCount})`
    ) : null,
    pendingCount > 0 ? (0, import_react20.createElement)(
      "button",
      {
        style: S.smallLink,
        onClick: openIntervene,
        // 票 `walkthrough-fixes/21`：原来是「留言稍后处理：不打断 AI，它到下个停靠点会看」——
        // 那句时机承诺是假话（当轮就转达）。且这颗键**所有相位都在**，而「不打断」只在
        // 铺章途中成立 ⇒ 这里只留两态事实，不说「不打断」。
        title: "\u7559\u8A00\uFF1A\u6709 AI \u5728\u8DD1\u65F6\u5F53\u8F6E\u8F6C\u8FBE\uFF0C\u6CA1\u6709 AI \u5728\u8DD1\u65F6\u7B49\u5230\u4E0B\u4E00\u7AD9"
      },
      `\u{1F4EE} \u7559\u8A00(${pendingCount})`
    ) : null,
    meta?.pause != null ? [
      // 票 10（spec §3 热区表把「顶栏 ⏸ 暂停 / ▶ 已暂停·点继续」判**不合法**；不变量 2
      // 「一个热区只干一件事」）：**状态归状态**——「已暂停」是纯指示，不是 `<button>`、
      // 没有 onClick、不替用户发动作；也故意不借 `S.smallLink`（那套带 `cursor:pointer`
      // ＋下划线，会让纯指示看着像能点）。旧文案「▶ 已暂停·点继续」把状态陈述与动作
      // 缝进同一句话、还与「⏸ 暂停」共用位置，已退役。
      (0, import_react20.createElement)(
        "span",
        {
          key: "paused-indicator",
          style: { fontSize: "12px", opacity: 0.75 },
          title: "\u8FD9\u672C\u4E66\u73B0\u5728\u662F\u6682\u505C\u7684"
        },
        "\u23F8 \u5DF2\u6682\u505C"
      ),
      // **动作归动作**：独立的「▶ 继续」，独占自己的热区；文案只说动作、不说状态
      // （spec §3 热区表：改法＝一颗显式按钮「▶ 继续」）。
      (0, import_react20.createElement)(
        "button",
        {
          key: "resume-button",
          style: { ...S.smallLink, color: "#1a7f37" },
          onClick: resume,
          title: "\u7EE7\u7EED\u4ECE\u65AD\u70B9\u63A5\u7740\u5199"
        },
        "\u25B6 \u7EE7\u7EED"
      )
    ] : (0, import_react20.createElement)(
      "button",
      {
        style: S.smallLink,
        onClick: pause,
        title: "\u6682\u505C\uFF1A\u8FD9\u6B21\u5148\u505C\u4E0B\u624B\u91CC\u7684\u6D3B\uFF0C\u542C\u6211\u7684"
      },
      "\u23F8 \u6682\u505C"
    )
  );
}
function StylePanel(props) {
  const { notes, onClose, meta } = props;
  const list = notes ?? [];
  return (0, import_react20.createElement)(
    "div",
    {
      style: {
        ...S.card,
        borderColor: "var(--dsw-alias-state-business-primary)",
        marginTop: "8px"
      }
    },
    (0, import_react20.createElement)(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px"
        }
      },
      (0, import_react20.createElement)(
        "strong",
        { style: { fontSize: "13px" } },
        `${styleLinePanelHeading(meta, list.length)}`
      ),
      (0, import_react20.createElement)(
        "button",
        { style: S.smallLink, onClick: onClose },
        "\u2715 \u6536\u8D77"
      )
    ),
    list.length === 0 ? (0, import_react20.createElement)(
      "p",
      { style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
      "\u8FD8\u6CA1\u6709\u98CE\u683C\u610F\u89C1\u3002"
    ) : list.map(
      (note, index) => (0, import_react20.createElement)(
        "div",
        {
          key: note.id,
          style: { margin: "6px 0", fontSize: "13px", lineHeight: 1.55 }
        },
        (0, import_react20.createElement)(
          "span",
          { style: { fontWeight: 600 } },
          `#${index + 1}`
        ),
        ` ${note.text ?? ""}`,
        note.note != null && note.note !== "" ? (0, import_react20.createElement)(
          "span",
          { style: { opacity: 0.6, fontSize: "12px" } },
          `\uFF08${note.note}\uFF09`
        ) : null
      )
    ),
    (0, import_react20.createElement)(
      "p",
      { style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
      styleLinePanelHint(meta)
    )
  );
}
function IntervenePanel(props) {
  const { items, onClose } = props;
  const list = items ?? [];
  return (0, import_react20.createElement)(
    "div",
    { style: { ...S.card, borderColor: "#e3b341", marginTop: "8px" } },
    (0, import_react20.createElement)(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px"
        }
      },
      (0, import_react20.createElement)(
        "strong",
        { style: { fontSize: "13px" } },
        `\u{1F4EE} \u4F60\u7684\u7559\u8A00\uFF08${list.length} \u6761\u5F85\u5904\u7406\uFF09`
      ),
      (0, import_react20.createElement)(
        "button",
        { style: S.smallLink, onClick: onClose },
        "\u2715 \u6536\u8D77"
      )
    ),
    list.length === 0 ? (0, import_react20.createElement)(
      "p",
      { style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
      "\u6CA1\u6709\u5F85\u5904\u7406\u7684\u7559\u8A00\u3002"
    ) : list.map(
      (item) => (0, import_react20.createElement)(
        "div",
        {
          key: item.id,
          style: { margin: "6px 0", fontSize: "13px", lineHeight: 1.55 }
        },
        (0, import_react20.createElement)(
          "span",
          { style: { opacity: 0.6, fontSize: "12px" } },
          formatTime(item.at)
        ),
        item.target != null && item.target !== "" ? (0, import_react20.createElement)(
          "span",
          {
            style: {
              opacity: 0.7,
              fontSize: "12px",
              marginLeft: "6px"
            }
          },
          `\uFF08${item.target}\uFF09`
        ) : null,
        (0, import_react20.createElement)("div", null, item.text ?? "")
      )
    ),
    (0, import_react20.createElement)(
      "p",
      { style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
      // 票 `walkthrough-fixes/21`（2026-10-06 裁决「甲」）：原句「…到下个停靠点处理（不打断它正在写的章）」
      // 是一句**与机器行为相反的承诺**——实测主 AI **当轮**就把意见转达给了正在写的那一章
      //（`resources/references/audit-and-testing.md` §11.2 的硬触发，那是仓里早写下的规则）。
      // 换成**只说可见事实 ＋ 两态**：有 AI 在跑 → 当轮叮嘱（可见证据＝账本那行「转达第 N 章…」）；
      // 没有 AI 在跑 → 它躺在待处理清单里，等到下一站。行为一个字没动。
      "\u60F3\u7ED9 AI \u7559\u8A00\uFF1F\u5728\u5BF9\u8BDD\u91CC\u76F4\u63A5\u8BF4\uFF0C\u5B83\u4F1A\u8BB0\u6210\u7559\u8A00\u3002\u6709 AI \u5728\u8DD1\u65F6\u4F1A\u88AB\u5F53\u8F6E\u53EE\u5631\uFF0C\u4F60\u4F1A\u770B\u5230\u300E\u8F6C\u8FBE\u7B2C N \u7AE0\u2026\u300F\u90A3\u4E00\u884C\uFF1B\u6CA1\u6709 AI \u5728\u8DD1\u65F6\u5B83\u7B49\u5230\u4E0B\u4E00\u7AD9\u3002"
    )
  );
}
function PatternPanel(props) {
  const { patterns, busy, onAnalyze, onClose, result, meta } = props;
  const [text, setText] = (0, import_react20.useState)("");
  const list = patterns ?? [];
  return (0, import_react20.createElement)(
    "div",
    {
      style: {
        ...S.card,
        borderColor: "var(--dsw-alias-state-business-primary)",
        marginTop: "8px"
      }
    },
    (0, import_react20.createElement)(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px"
        }
      },
      (0, import_react20.createElement)(
        "strong",
        { style: { fontSize: "13px" } },
        "\u{1F9E9} \u81EA\u5B9A\u4E49\u6A21\u5F0F\u5E93"
      ),
      (0, import_react20.createElement)(
        "button",
        { style: S.smallLink, onClick: onClose },
        "\u2715 \u6536\u8D77"
      )
    ),
    (0, import_react20.createElement)(
      "p",
      {
        style: {
          margin: "6px 0",
          fontSize: "12px",
          opacity: 0.75,
          lineHeight: 1.6
        }
      },
      patternPasteHint(meta)
    ),
    (0, import_react20.createElement)("textarea", {
      style: { ...S.textarea, minHeight: "64px" },
      placeholder: "\u4F8B\uFF1A\u6BCF\u4E2A\u77E5\u8BC6\u70B9\u5148\u7ED9\u4E00\u4E2A\u751F\u6D3B\u4E2D\u7684\u771F\u5B9E\u573A\u666F\u5F15\u51FA\u6982\u5FF5\uFF0C\u518D\u914D\u4E00\u9053\u7531\u6D45\u5165\u6DF1\u7684\u4F8B\u9898\uFF0C\u6700\u540E\u653E\u4E00\u9053\u6613\u9519\u5224\u65AD\u9898\u2026\u2026",
      value: text,
      onChange: (e) => setText(e.target.value)
    }),
    (0, import_react20.createElement)(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "10px" } },
      (0, import_react20.createElement)(
        "button",
        {
          style: S.disabled(S.bigBtn(true), busy || text.trim() === ""),
          disabled: busy || text.trim() === "",
          onClick: () => {
            onAnalyze(text.trim());
            setText("");
          }
        },
        "\u{1F916} \u8BA9 AI \u5206\u6790\u5E76\u52A0\u5165\u6A21\u5F0F\u5E93"
      ),
      busy ? (0, import_react20.createElement)(
        "span",
        { style: { fontSize: "12px", opacity: 0.7 } },
        "AI \u5206\u6790\u4E2D\u2026"
      ) : null
    ),
    result !== null ? (0, import_react20.createElement)(
      "div",
      {
        style: {
          marginTop: "8px",
          padding: "8px 10px",
          borderRadius: "8px",
          background: "var(--dsw-alias-state-success-tertiary)",
          fontSize: "12px",
          lineHeight: 1.6
        }
      },
      (0, import_react20.createElement)(
        "strong",
        null,
        `\u2705 \u5DF2\u52A0\u5165\u6A21\u5F0F\u5E93\uFF1A${result.name ?? ""}`
      ),
      result.problem != null && result.problem !== "" ? (0, import_react20.createElement)(
        "p",
        { style: { margin: "4px 0 0" } },
        `\u89E3\u51B3\uFF1A${result.problem}`
      ) : null,
      result.blocks != null && result.blocks !== "" ? (0, import_react20.createElement)(
        "p",
        { style: { margin: "2px 0 0" } },
        `\u843D\u5730\uFF1A${result.blocks}`
      ) : null
    ) : null,
    (0, import_react20.createElement)(
      "p",
      { style: { margin: "8px 0 4px", fontSize: "12px", opacity: 0.7 } },
      list.length === 0 ? "\u8FD9\u672C\u4E66\u8FD8\u6CA1\u6709\u81EA\u5B9A\u4E49\u6A21\u5F0F\u3002" : `\u5DF2\u5728\u8FD9\u672C\u4E66\u7684\u6A21\u5F0F\u5E93\u91CC\uFF08${list.length} \u5F20\uFF09\uFF1A`
    ),
    list.map(
      (p, index) => (0, import_react20.createElement)(
        "div",
        {
          key: p.file ?? index,
          style: { margin: "3px 0", fontSize: "12px", lineHeight: 1.5 }
        },
        `\xB7 ${p.title ?? p.name ?? ""}${p.problem != null && p.problem !== "" ? ` \u2014 ${p.problem}` : ""}`
      )
    )
  );
}
function receiptTimeText(at, now = Date.now()) {
  if (at === null || at === void 0 || at === "") return null;
  const time = new Date(at);
  const stamp = time.getTime();
  if (!Number.isFinite(stamp) || !Number.isFinite(now)) return null;
  const reference = new Date(now);
  const pad = (value) => String(value).padStart(2, "0");
  const clock = `${pad(time.getHours())}:${pad(time.getMinutes())}`;
  const sameDay = time.getFullYear() === reference.getFullYear() && time.getMonth() === reference.getMonth() && time.getDate() === reference.getDate();
  if (sameDay) return `\u4ECA\u5929 ${clock}`;
  const monthDay = `${time.getMonth() + 1}\u6708${time.getDate()}\u65E5`;
  return time.getFullYear() === reference.getFullYear() ? `${monthDay} ${clock}` : `${time.getFullYear()}\u5E74${monthDay} ${clock}`;
}
var READER_QUESTIONNAIRE_STRATEGY_NOTE = "AI \u6309\u300C\u8C01\u586B\u7684\u300D\u91C7\u53D6\u4E0D\u540C\u7B56\u7565\uFF1A\u672C\u4EBA\uFF1D\u81EA\u8BC4\u8BC1\u636E\uFF1B\u76D1\u62A4\u4EBA\uFF1D\u7B2C\u4E09\u65B9\u89C2\u5BDF\uFF08\u53EA\u91C7\u660E\u786E\u9879\uFF09\uFF1B\u8001\u5E08\uFF1D\u6559\u5B66\u5224\u65AD\uFF08\u53EF\u628A\u91CD\u70B9/\u96BE\u70B9\u610F\u89C1\u5E26\u8FDB\u4E0B\u4E00\u6B65 brief\uFF09\u3002";
var READER_QUESTIONNAIRE_FOOT_NOTE = "\u8FD9\u4EFD\u56DE\u5377\u53EA\u662F\u6536\u8FDB\u4E66\u5939\u7559\u8BC1\uFF1AAI \u4F1A\u9010\u6761\u8BFB\u5B83\uFF0C\u518D\u56DE\u5230\u56FE\u4E0A\u6838\u5BF9\uFF1B\u5B83\u4E0D\u4F1A\u81EA\u52A8\u6539\u53D8\u4EFB\u4F55\u5DF2\u7ECF\u5B9A\u4E0B\u7684\u5185\u5BB9\u3002";
function ReaderQuestionnairePanel(props) {
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
    onClose
  } = props;
  const [pasting, setPasting] = (0, import_react20.useState)(false);
  const [text, setText] = (0, import_react20.useState)("");
  const [chosenAnswerer, setChosenAnswerer] = (0, import_react20.useState)(null);
  const [submitting, setSubmitting] = (0, import_react20.useState)(false);
  const sessionReceipt = receipt !== null && typeof receipt === "object" ? receipt : null;
  const diskReceipt = returned === true ? {
    answerer: typeof answerer === "string" && answerer !== "" ? answerer : null,
    at: typeof answererAt === "string" && answererAt !== "" ? answererAt : null
  } : null;
  const effectiveReceipt = diskReceipt !== null ? diskReceipt : sessionReceipt;
  const done = effectiveReceipt !== null;
  const showBack = pasting === true;
  const showReceipt = done && showBack === false;
  const busyAll = busy === true || submitting === true;
  const downloadRel = issued !== null && issued !== void 0 ? issued : READER_QUESTIONNAIRE_ISSUED_REL;
  const downloadVisible = typeof issued === "string" && issued !== "" || done;
  const downloadHrefValue = downloadVisible && typeof downloadHref === "function" ? downloadHref(downloadRel) : null;
  const receiptAnswerer = effectiveReceipt?.answerer ?? null;
  const receiptClock = effectiveReceipt === null ? null : receiptTimeText(effectiveReceipt.at);
  const canSubmit = busyAll === false && text.trim() !== "" && chosenAnswerer !== null;
  const submitReturn = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const accepted = await onSubmit(text, chosenAnswerer);
      if (accepted !== false) {
        setText("");
        setChosenAnswerer(null);
        setPasting(false);
      }
    } finally {
      setSubmitting(false);
    }
  };
  return (0, import_react20.createElement)(
    "div",
    {
      style: {
        ...S.card,
        borderColor: "var(--dsw-alias-state-business-primary)",
        marginTop: "8px"
      }
    },
    (0, import_react20.createElement)(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px"
        }
      },
      (0, import_react20.createElement)("strong", { style: { fontSize: "13px" } }, "\u{1F9D1}\u200D\u{1F393} \u8BFB\u8005\u60C5\u51B5\u95EE\u5377"),
      (0, import_react20.createElement)("button", { style: S.smallLink, onClick: onClose }, "\u2715 \u6536\u8D77")
    ),
    (0, import_react20.createElement)(
      "p",
      { style: { margin: "6px 0", fontSize: "12px", opacity: 0.75, lineHeight: 1.6 } },
      "\u7ED9\u6536\u5377\u4EBA\u7684\u662F\u4E00\u4EFD .md\uFF08\u7535\u5B50\u586B\uFF0C\u53EA\u6B64\u4E00\u6761\u8DEF\uFF09\uFF1A\u4E0B\u8F7D\u4E0B\u6765\u3001\u628A\u8BE5\u52FE\u7684\u52FE\u4E0A\u3001\u8981\u8BF4\u7684\u5199\u5728\u9898\u4E0B\uFF0C\u518D\u5168\u9009\u590D\u5236\u7C98\u56DE\u4E0B\u9762\u8FD9\u4E2A\u6846\u2014\u2014\u591A\u957F\u90FD\u884C\uFF0C\u8DD1\u9898\u3001\u53EA\u7B54\u4E00\u534A\u4E5F\u53EF\u4EE5\u3002"
    ),
    // ── 发卷键（三态常显；下载只在发过卷/已有回卷时出现）──────────────────────────
    (0, import_react20.createElement)(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } },
      (0, import_react20.createElement)(
        "button",
        {
          style: S.disabled(S.bigBtn(true), busyAll),
          disabled: busyAll,
          onClick: () => onIssue()
        },
        "\u{1F4C4} \u751F\u6210\u95EE\u5377"
      ),
      downloadHrefValue !== null ? (0, import_react20.createElement)(
        "a",
        {
          href: downloadHrefValue,
          style: { fontSize: "12px" },
          download: ""
        },
        "\u2B07\uFE0F \u4E0B\u8F7D\u95EE\u5377\uFF08.md\uFF09"
      ) : null
    ),
    // ── 已收卷：回执（谁填的＋时间，盘上事实优先）＋ 主路径 ＋ 再粘一份 ────────────
    showReceipt ? (0, import_react20.createElement)(
      "div",
      { style: { margin: "10px 0 0" } },
      (0, import_react20.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontSize: "12px", lineHeight: 1.6 } },
        // ⚠️ 整句放进**同一个文本节点**：屏幕上的人读、屏外的判据（`expectText`）都按连续文案认，
        // 拆成 `strong` ＋ 兄弟文本会让「已收下……（老师」跨节点、读起来像两句话。
        (0, import_react20.createElement)(
          "strong",
          null,
          `\u2705 \u5DF2\u6536\u4E0B\uFF0C\u5B58\u5728\u4E66\u5939\u91CC\u4E86${receiptAnswerer === null ? "" : `\uFF08${receiptAnswerer}${receiptClock === null ? "" : `\uFF0C${receiptClock}`}\uFF09`}`
        )
      ),
      (0, import_react20.createElement)(
        "div",
        { style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } },
        (0, import_react20.createElement)(
          "button",
          { style: S.smallLink, onClick: () => onGoToGraph() },
          "\u{1F9ED} \u53BB\u770B\u77E5\u8BC6\u70B9\u56FE\u63A5\u7740\u5212"
        ),
        (0, import_react20.createElement)(
          "button",
          {
            style: S.smallLink,
            onClick: () => {
              setPasting(true);
              setText("");
              setChosenAnswerer(null);
            }
          },
          "\u518D\u7C98\u4E00\u4EFD"
        )
      )
    ) : null,
    // ── 回卷态（收卷人此时才问；必选、无系统默认）────────────────────────────────
    showBack ? (0, import_react20.createElement)(
      "div",
      { style: { margin: "10px 0 0" } },
      // ⚠️ **无长度上限**：不写 `maxLength`（见上面那条注释）。
      (0, import_react20.createElement)("textarea", {
        style: { ...S.textarea, minHeight: "160px" },
        placeholder: "\u628A\u6536\u5377\u4EBA\u586B\u597D\u7684\u6574\u6BB5\u6587\u5B57\u7C98\u5230\u8FD9\u91CC\uFF08\u591A\u957F\u90FD\u884C\uFF0C\u4E0D\u7528\u7BA1\u683C\u5F0F\uFF09",
        value: text,
        onChange: (e) => setText(e.target.value)
      }),
      (0, import_react20.createElement)(
        "p",
        { style: { margin: "10px 0 6px", fontSize: "12px", fontWeight: 600 } },
        "\u8FD9\u4EFD\u662F\u8C01\u586B\u7684\uFF1F"
      ),
      (0, import_react20.createElement)(
        "div",
        { style: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" } },
        ...EXPLORE_CONFIRM_ANSWERERS.map(
          (one) => (0, import_react20.createElement)(
            "button",
            {
              key: one,
              style: {
                fontSize: "12px",
                padding: "2px 10px",
                borderRadius: "6px",
                cursor: "pointer",
                border: chosenAnswerer === one ? "1px solid var(--dsw-alias-state-business-primary)" : "1px solid var(--dsw-alias-border-l2)",
                background: chosenAnswerer === one ? "var(--dsw-alias-state-business-tertiary)" : "transparent"
              },
              "aria-pressed": chosenAnswerer === one,
              onClick: () => setChosenAnswerer(one)
            },
            one
          )
        )
      ),
      (0, import_react20.createElement)(
        "p",
        { style: { margin: "6px 0", fontSize: "12px", opacity: 0.7, lineHeight: 1.6 } },
        READER_QUESTIONNAIRE_STRATEGY_NOTE
      ),
      (0, import_react20.createElement)(
        "div",
        { style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } },
        (0, import_react20.createElement)(
          "button",
          {
            style: S.disabled(S.bigBtn(true), !canSubmit),
            disabled: !canSubmit,
            onClick: () => {
              void submitReturn();
            }
          },
          "\u{1F4E5} \u6536\u4E0B\u8FD9\u4EFD\u56DE\u5377"
        ),
        busyAll ? (0, import_react20.createElement)("span", { style: { fontSize: "12px", opacity: 0.7 } }, "\u5904\u7406\u4E2D\u2026") : null
      )
    ) : (
      // ── 发卷态本态：只多一颗「粘一份回卷」的入口（⛔ 不在这里选收卷人）──────
      // （已收卷态不再重复摆它——那里已经有「再粘一份」那颗了。）
      showReceipt ? null : (0, import_react20.createElement)(
        "div",
        { style: { margin: "10px 0 0" } },
        (0, import_react20.createElement)(
          "button",
          {
            style: S.smallLink,
            onClick: () => {
              setPasting(true);
              setText("");
              setChosenAnswerer(null);
            }
          },
          "\u{1F4E5} \u7C98\u4E00\u4EFD\u56DE\u5377"
        )
      )
    ),
    (0, import_react20.createElement)(
      "p",
      { style: { margin: "8px 0 0", fontSize: "12px", opacity: 0.7 } },
      READER_QUESTIONNAIRE_FOOT_NOTE
    )
  );
}

// src/client-entry.js
var inject = ["slots", "sessions", "uiSession", "uiConversation", "sidebarRight"];
function AutoOpenWorkbench(props) {
  const isTextbook = props.useSessions(
    (s) => s.byId[props.sessionId]?.projectionValues?.agentPreset
  ) === "textbook";
  const messageCount = deriveChatDeskNodes(props.useChat((s) => s)).length;
  const doneRef = (0, import_react21.useRef)(false);
  (0, import_react21.useEffect)(() => {
    if (doneRef.current || !isTextbook || messageCount === 0) return;
    const target = [...document.querySelectorAll('[role="tab"]')].find(
      (el) => (el.textContent ?? "").trim() === "\u5DE5\u4F5C\u53F0"
    );
    if (target === void 0) return;
    doneRef.current = true;
    if (target.getAttribute("aria-selected") === "true") return;
    target.click();
  }, [isTextbook, messageCount]);
  return null;
}
var NO_EVENTS3 = Object.freeze([]);
var NO_SNAPSHOTS = Object.freeze([]);
var NO_SEGMENTS2 = Object.freeze([]);
var NO_SUGGESTIONS2 = Object.freeze([]);
var NO_PATTERNS2 = Object.freeze([]);
var SESSION_STATUS_PROP_MISSING = "[workbench] \u5BBF\u4E3B\u6CA1\u6709\u63D0\u4F9B props.useSessionStatus\uFF08@deepseek-ai/dsh-client-ui-session \u58F0\u660E\u7684\u5168\u5C40\u6807\u51C6 prop\uFF0Cdsh 0.1.7\uFF09\uFF1A\u63D0\u95EE\u5361\u7684\u300C\u5F85\u56DE\u7B54\u300D\u8BA2\u9605\u5728\u672C\u6B21\u4F1A\u8BDD\u91CC\u662F\u6B7B\u7684\uFF0C\u7528\u6237\u5728\u90A3\u5F20\u5361\u4E0A\u7684\u4E00\u6B21\u9009\u62E9\u4E0D\u4F1A\u8BB0\u8FDB\u4E66\u8D26\u672C\u3002";
function selectPendingQuestionCard(status, sessionId) {
  const pending = status?.get(sessionId)?.pendingInteraction;
  return pending?.kind === "question" ? pending : null;
}
var RECORDED_QUESTION_KEYS = /* @__PURE__ */ new Set();
var QUESTION_ANSWER_INFLIGHT = /* @__PURE__ */ new Set();
var LAST_PENDING_QUESTIONS = /* @__PURE__ */ new Map();
function WorkbenchView(props) {
  const sessionPreset = props.useSessions(
    (s) => s.byId[props.sessionId]?.projectionValues?.agentPreset ?? null
  );
  const session = props.sessionId;
  const cwd = props.useSessions((s) => s.byId[props.sessionId]?.cwd ?? null);
  const mainAiRunning = props.useSession((s) => s?.running === true);
  const sessionSummaries = props.useSessions((s) => s.byId);
  const hostGaveSessionStatus = props.useSessionStatus !== void 0;
  const pendingQuestion = hostGaveSessionStatus ? props.useSessionStatus(
    (status) => selectPendingQuestionCard(status, session)
  ) : null;
  const chatSnapshot = props.useChat((s) => s);
  const questionAnswerFeedRevision = (0, import_react21.useSyncExternalStore)(
    subscribeQuestionAnswerFeed,
    getQuestionAnswerFeedRevision,
    getQuestionAnswerFeedRevision
  );
  (0, import_react21.useEffect)(() => {
    if (hostGaveSessionStatus) return;
    console.warn(SESSION_STATUS_PROP_MISSING);
  }, [hostGaveSessionStatus]);
  const subagentRuns = (0, import_react21.useMemo)(
    () => indexSubagentDescendants(sessionSummaries).get(session) ?? {
      count: 0,
      runningCount: 0
    },
    [sessionSummaries, session]
  );
  const subagentActiveSince = (0, import_react21.useMemo)(
    () => indexRunningSubagentActivity(sessionSummaries).get(session) ?? null,
    [sessionSummaries, session]
  );
  const contextPercent = contextOccupancyPercent(
    props.useSessions((s) => {
      const fromProjections = s.projectionsBySession?.[session]?.values?.contextPressure;
      if (fromProjections !== void 0) return fromProjections;
      return s.byId[session]?.projectionValues?.contextPressure ?? null;
    })
  );
  const [identityLost, setIdentityLost] = (0, import_react21.useState)(null);
  const [takeoverNotice, setTakeoverNotice] = (0, import_react21.useState)(null);
  const [elapsedMs, setElapsedMs] = (0, import_react21.useState)(0);
  const loadingStartedAtRef = (0, import_react21.useRef)(0);
  const projection = (0, import_react21.useMemo)(
    () => createBookProjection({
      sessionId: session,
      onIdentityLost: (lost) => setIdentityLost(lost === null ? null : { session, ...lost }),
      // 接管**真发生**才送：投影侧只送「刚失效那一本的重新发现、另一本 core 真读回来」那一帧
      // （见 `src/workbench-projection.js` 文件头票 13 那一节）。初始发现、用户自己点的
      // `refresh()`／`selectProject(...)` 都不送。
      onIdentityTakeover: (taken) => setTakeoverNotice(taken === null ? null : { session, ...taken })
    }),
    [session]
  );
  const subscribeBook = (0, import_react21.useCallback)(
    (onStoreChange) => projection.subscribe(onStoreChange),
    [projection]
  );
  const readBookSnapshot = (0, import_react21.useCallback)(() => projection.snapshot(), [projection]);
  const book = (0, import_react21.useSyncExternalStore)(subscribeBook, readBookSnapshot, readBookSnapshot);
  const bookRef = (0, import_react21.useRef)(book);
  bookRef.current = book;
  const coreData = book.core.data;
  const meta = coreData === null ? null : coreData.meta;
  const events = coreData === null ? NO_EVENTS3 : coreData.events;
  const gate = coreData === null ? null : coreData.gate;
  const snapshots = coreData === null ? NO_SNAPSHOTS : coreData.snapshots;
  const bookDir = coreData === null ? null : coreData.bookDir;
  const pendingStageView = coreData === null ? null : coreData.pending.stage;
  const pendingGateView = coreData === null ? null : coreData.pending.gate;
  const processSegs = book.process.data === null ? NO_SEGMENTS2 : book.process.data.segments;
  const projectId = book.projectId;
  const bookKey = book.bookKey;
  const identityLostNow = identityLost !== null && identityLost.session === session ? identityLost : null;
  const takeoverNoticeNow = takeoverNotice !== null && takeoverNotice.session === session && takeoverNotice.to === projectId && identityLostNow === null ? takeoverNotice : null;
  const artifactReader = (0, import_react21.useMemo)(
    () => createArtifactReader({ sessionId: session, projectId }),
    [session, projectId]
  );
  const readArtifact = artifactReader.readText;
  const processCommitRef = (0, import_react21.useRef)({ bookKey: null, data: null, signature: null, token: 0 });
  if (processCommitRef.current.bookKey !== bookKey) {
    processCommitRef.current = { bookKey, data: null, signature: null, token: 0 };
  }
  if (book.process.status === "ready" && book.process.data !== null && book.process.data !== processCommitRef.current.data) {
    const signature = JSON.stringify(book.process.data);
    const previous = processCommitRef.current;
    processCommitRef.current = {
      bookKey,
      data: book.process.data,
      signature,
      token: signature === previous.signature ? previous.token : previous.token + 1
    };
  }
  const processToken = processCommitRef.current.token;
  const readStatus = projectId === null ? book.projectsStatus : book.core.status;
  const readError = projectId === null ? book.projectsError : book.core.error;
  const loadError = readStatus === "error" ? readError?.message ?? null : null;
  const { lastEvent, checks, aiReport, progressDetail, pendingStageLabel, humanTurn, needsConfig, stall } = deriveBookViewFacts({
    events,
    meta,
    gate,
    pendingStage: pendingStageView,
    pendingGate: pendingGateView,
    mainAiRunning,
    subagentRunningCount: subagentRuns.runningCount,
    subagentActiveSince
  });
  const bookUiRef = (0, import_react21.useRef)(null);
  const [mineruSet, setMineruSet] = (0, import_react21.useState)(null);
  const [mineruSource, setMineruSource] = (0, import_react21.useState)(null);
  const [mineruMasked, setMineruMasked] = (0, import_react21.useState)(null);
  const applyMineruSettings = (settings, fallbackConfigured = false) => {
    const configured = typeof settings?.mineruTokenSet === "boolean" ? settings.mineruTokenSet : fallbackConfigured;
    const source = settings?.mineruTokenSource;
    const masked = settings?.mineruTokenMasked;
    setMineruSet(configured);
    setMineruSource(typeof source === "string" ? source : null);
    setMineruMasked(typeof masked === "string" ? masked : null);
  };
  const [mineruToken, setMineruToken] = (0, import_react21.useState)("");
  const [autoSplit, setAutoSplit] = (0, import_react21.useState)(false);
  const [mineruResetOpen, setMineruResetOpen] = (0, import_react21.useState)(false);
  const [deskHeight, setDeskHeight] = (0, import_react21.useState)(220);
  const [deskCollapsed, setDeskCollapsed] = (0, import_react21.useState)(true);
  const deskRef = (0, import_react21.useRef)(null);
  const deskLiveRef = (0, import_react21.useRef)(null);
  const rootRef = (0, import_react21.useRef)(null);
  const [rootH, setRootH] = (0, import_react21.useState)(null);
  const [mainBox, setMainBox] = (0, import_react21.useState)({ w: null, rightGap: null });
  const conversionSettled = meta !== null && (meta.phase ?? 1) > 1 && meta.converting !== true;
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
    identityLost: identityLostNow
  };
  const surface = resolveSurface(surfaceInput);
  (0, import_react21.useEffect)(() => {
    if (surface.kind !== "loading") {
      loadingStartedAtRef.current = 0;
      setElapsedMs(0);
      return void 0;
    }
    if (loadingStartedAtRef.current === 0) loadingStartedAtRef.current = Date.now();
    const tick = () => setElapsedMs(Date.now() - loadingStartedAtRef.current);
    tick();
    const handle = setInterval(tick, 1e3);
    return () => clearInterval(handle);
  }, [surface.kind]);
  const hasBookSurface = surface.kind === "now" || surface.kind === "phase-page" || surface.kind === "browsing";
  const bareSurface = surface.bare === true;
  (0, import_react21.useEffect)(() => {
    const el = rootRef.current;
    if (el === null || el.parentElement === null) return;
    const composerChain = (input) => {
      const chain = [];
      for (let node = input, i = 0; node !== null && i <= 4; node = node.parentElement, i += 1) {
        const box = node.getBoundingClientRect();
        const style = window.getComputedStyle(node);
        chain.push({
          top: box.top,
          width: box.width,
          height: box.height,
          borderRadius: style.borderRadius,
          backgroundColor: style.backgroundColor
        });
      }
      return chain;
    };
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const vh = typeof window !== "undefined" ? window.innerHeight || 0 : 0;
      const vw = typeof window !== "undefined" ? window.innerWidth || 0 : 0;
      const nextW = Math.round(rect.width);
      const nextGap = vw > 0 ? Math.round(vw - rect.right) : null;
      setMainBox(
        (prev) => prev.w === nextW && prev.rightGap === nextGap ? prev : { w: nextW, rightGap: nextGap }
      );
      let bottomBound = vh;
      try {
        if (typeof document !== "undefined") {
          let picked = null;
          let maxBottom = -1;
          const cands = document.querySelectorAll(
            'textarea, input, [role="textbox"], [contenteditable="true"]'
          );
          for (const d of cands) {
            const r = d.getBoundingClientRect();
            if (isComposerCandidate(
              {
                top: r.top,
                bottom: r.bottom,
                width: r.width,
                height: r.height,
                insideWorkbench: el.contains(d)
              },
              { rootTop: rect.top, viewportHeight: vh }
            ) && r.bottom > maxBottom) {
              maxBottom = r.bottom;
              picked = d;
            }
          }
          if (picked !== null) {
            bottomBound = pickComposerAnchorTop(composerChain(picked)) ?? picked.getBoundingClientRect().top;
          }
        }
      } catch {
      }
      const usable = Math.max(0, bottomBound - Math.max(0, rect.top));
      if (usable > 200) {
        const next = Math.round(usable);
        setRootH((prev) => prev === next ? prev : next);
      }
    };
    measure();
    const timer = setInterval(measure, 400);
    return () => clearInterval(timer);
  }, []);
  const sessionRef = (0, import_react21.useRef)(session);
  sessionRef.current = session;
  const focusScrollRef = (0, import_react21.useRef)(null);
  const nowCardRef = (0, import_react21.useRef)(null);
  const autoScrollMemoRef = (0, import_react21.useRef)(null);
  const scrollCardKey = autoScrollCardKey(meta, gate);
  (0, import_react21.useEffect)(() => {
    const card = nowCardRef.current;
    if (scrollCardKey === null || card === null || typeof card.getBoundingClientRect !== "function") {
      autoScrollMemoRef.current = null;
      return;
    }
    const box = focusScrollRef.current;
    if (box === null || typeof box.getBoundingClientRect !== "function") return;
    const cardRect = card.getBoundingClientRect();
    const cardTop = cardRect.top - box.getBoundingClientRect().top + box.scrollTop;
    const memo = autoScrollMemoRef.current;
    if (memo !== null && memo.key === scrollCardKey && memo.height === cardRect.height && memo.top === cardTop)
      return;
    const { scrollTop, measured } = decisionCardScroll({
      cardTop,
      cardHeight: cardRect.height,
      viewportHeight: box.clientHeight,
      scrollTop: box.scrollTop
    });
    if (measured !== true) return;
    autoScrollMemoRef.current = { key: scrollCardKey, height: cardRect.height, top: cardTop };
    if (scrollTop !== null) box.scrollTop = scrollTop;
  });
  const startDeskDrag = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = deskLiveRef.current ?? deskHeight;
    const clamp = (v) => Math.max(120, Math.min(window.innerHeight / 2, v));
    const onMove = (ev) => {
      const next = clamp(startH - (ev.clientY - startY));
      deskLiveRef.current = next;
      if (deskRef.current !== null) deskRef.current.style.height = `${next}px`;
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      const h3 = deskLiveRef.current ?? deskHeight;
      deskLiveRef.current = null;
      if (Number.isFinite(h3) && h3 > 0) setDeskHeight(h3);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  const sess = () => `session=${encodeURIComponent(sessionRef.current)}`;
  async function fetchJson(url, options) {
    const res = await fetch(
      url,
      options ?? { headers: { Accept: "application/json" } }
    );
    let json = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    if (!res.ok)
      throw new Error(json !== null && json.error || `HTTP ${res.status}`);
    return json;
  }
  const openInSidebar = (rel) => {
    const bookUi = bookUiRef.current;
    bookUi?.setError(null);
    try {
      props.openFileInSidebar(bookFileAddress(session, cwd, bookDir, rel));
    } catch (err) {
      bookUi?.setError(
        `\u6253\u5F00\u300C${artifactName(rel)}\u300D\u5931\u8D25\uFF1A${String(err instanceof Error ? err.message : err)}`
      );
    }
  };
  const viewWork = (file) => {
    if (workEntryAction(file?.path) === "sidebar") openInSidebar(file.path);
  };
  (0, import_react21.useEffect)(() => {
    void projection.refresh();
  }, [projection]);
  (0, import_react21.useEffect)(() => {
    let alive = true;
    void fetchJson("/textbook/settings").then((settings) => {
      if (alive) {
        applyMineruSettings(settings.settings);
        setAutoSplit(settings.settings?.autoSplitAvailable === true);
      }
    }).catch(() => {
    });
    return () => {
      alive = false;
    };
  }, [session]);
  (0, import_react21.useEffect)(() => {
    if (surface.kind !== "no-book") return void 0;
    const bookUi = bookUiRef.current;
    if (bookUi === null) return void 0;
    const guard = projection.capture();
    let alive = true;
    bookUi.setSuggestLoading(true);
    void fetchJson("/textbook/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        action: uiCallable("wizard-suggest"),
        session: sessionRef.current
      })
    }).then((json) => {
      if (alive && projection.isCurrent(guard))
        bookUi.setSuggestions(json.suggestions ?? NO_SUGGESTIONS2);
    }).catch(() => {
      if (alive && projection.isCurrent(guard)) bookUi.setSuggestions(NO_SUGGESTIONS2);
    }).finally(() => {
      if (alive && projection.isCurrent(guard)) bookUi.setSuggestLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [surface.kind, bookKey]);
  const isBookCurrent = (guard) => projection.isCurrent(guard);
  const requestSuggest = async (hintText) => {
    const guard = projection.capture();
    const bookUi = bookUiRef.current;
    bookUi?.setSuggestLoading(true);
    try {
      const json = await fetchJson("/textbook/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          action: uiCallable("wizard-suggest"),
          session: sessionRef.current,
          hint: hintText || void 0
        })
      });
      if (!isBookCurrent(guard)) return;
      bookUi?.setSuggestions(json.suggestions ?? NO_SUGGESTIONS2);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : String(err));
    } finally {
      if (isBookCurrent(guard)) bookUi?.setSuggestLoading(false);
    }
  };
  const postAction = async (body) => {
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
          "X-Textbook-Actor": "human"
        },
        body: JSON.stringify({
          project: projectId,
          session: sessionRef.current,
          ...body,
          // 写回目录给的规范名：发出去的那一份与目录是同一条身份。
          action
        })
      });
      if (!isBookCurrent(guard)) return null;
      if (guard.projectId !== null) await projection.refresh();
      bookUi?.setError(null);
      const noteText = json !== null && (["style-note", "intervene", "review"].includes(action) || action === "gold-opinion") ? interruptNoteText({ action, meta, pendingStage: pendingStageView }) : null;
      if (noteText !== null) bookUi?.setNoteToast(noteText);
      return json;
    } catch (err) {
      if (isBookCurrent(guard))
        bookUi?.setError(String(err instanceof Error ? err.message : err));
      return null;
    } finally {
      if (isBookCurrent(guard)) bookUi?.setBusy(false);
    }
  };
  const recordQuestionAnswer = (pending, answer) => {
    const key = pending.key;
    if (RECORDED_QUESTION_KEYS.has(key)) {
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
        Accept: "application/json"
      },
      body: JSON.stringify({
        project,
        session: sessionRef.current,
        key,
        questions: pending.questions ?? [],
        answers: answer?.answers ?? [],
        // 缺席 / `false` ＝一次真实作答；`true` ＝这一次读不到答案（缝见票 09/10）。
        ...answer === null ? { unread: true } : {}
      })
    }).then(
      // 只有真落进账本了才算「这一次记过了」：失败不记账，于是下次依赖变化还会重试。
      () => {
        RECORDED_QUESTION_KEYS.add(key);
        clearQuestionAnswerFromFeed(pending.callId);
        if (LAST_PENDING_QUESTIONS.get(pending.session)?.key === key) {
          LAST_PENDING_QUESTIONS.delete(pending.session);
        }
      },
      (err) => {
        console.warn("[workbench] \u63D0\u95EE\u5361\u7684\u4F5C\u7B54\u6CA1\u80FD\u843D\u8FDB\u4E66\u8D26\u672C", err);
      }
    ).finally(() => {
      QUESTION_ANSWER_INFLIGHT.delete(key);
    });
  };
  const readQuestionAnswer = (card) => findQuestionAnswerByCallId(chatSnapshot, card.callId) ?? readQuestionAnswerFromFeed(card.callId);
  const settleQuestionCard = (card) => {
    const answer = readQuestionAnswer(card);
    if (answer !== null) {
      recordQuestionAnswer(card, answer);
      return;
    }
    if (isQuestionCallRunning(chatSnapshot, card.callId)) return;
    if (isQuestionCallExpectedInFeed(card.callId)) return;
    recordQuestionAnswer(card, null);
  };
  (0, import_react21.useEffect)(() => {
    const pending = pendingQuestion;
    let last = LAST_PENDING_QUESTIONS.get(session) ?? null;
    if (last !== null && RECORDED_QUESTION_KEYS.has(last.key)) {
      LAST_PENDING_QUESTIONS.delete(session);
      last = null;
    }
    if (pending !== null && typeof pending === "object") {
      if (pending.kind !== "question") return;
      const key = pending.key;
      if (typeof key !== "string" || key === "") return;
      const card = {
        session,
        key,
        callId: typeof pending.callId === "string" && pending.callId !== "" ? pending.callId : void 0,
        questions: pending.questions ?? []
      };
      if (last !== null && last.key !== key) {
        const previous = readQuestionAnswer(last);
        if (previous !== null) recordQuestionAnswer(last, previous);
      }
      LAST_PENDING_QUESTIONS.set(session, card);
      if (RECORDED_QUESTION_KEYS.has(key)) {
        LAST_PENDING_QUESTIONS.delete(session);
        return;
      }
      if (QUESTION_ANSWER_INFLIGHT.has(key)) return;
      const answer = readQuestionAnswer(card);
      if (answer !== null) recordQuestionAnswer(card, answer);
      return;
    }
    if (last === null) return;
    settleQuestionCard(last);
  }, [pendingQuestion, projectId, session, chatSnapshot, questionAnswerFeedRevision]);
  const deleteBook = (id) => {
    const guard = projection.capture();
    const bookUi = bookUiRef.current;
    bookUi?.setBusy(true);
    void fetchJson("/textbook/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        action: uiCallable("book-delete"),
        project: id,
        session: sessionRef.current,
        confirm: true
      })
    }).then(async () => {
      if (!isBookCurrent(guard)) return null;
      await projection.selectProject(null);
      return projection.refresh();
    }).catch((err) => {
      if (isBookCurrent(guard))
        bookUi?.setError(String(err instanceof Error ? err.message : err));
    }).finally(() => {
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
      ...decision.route === "human" || decision.route === "blueprint" ? { route: decision.route } : {}
    });
  };
  const rollback = () => {
    if (snapshots.length === 0) {
      bookUiRef.current?.setError("\u8FD8\u6CA1\u6709\u53EF\u56DE\u9000\u7684\u5FEB\u7167");
      return;
    }
    void postAction({ action: "rollback", snapshot: snapshots[0].seq });
  };
  const setKnobs = (knobs) => {
    if (!Number.isSafeInteger(knobs?.maxConcurrentSubagents)) return;
    void postAction({ action: "book-set-knobs", maxConcurrentSubagents: knobs.maxConcurrentSubagents });
  };
  const skipStep = () => {
    void postAction({ action: "skip-step" });
  };
  const confirmExplore = (approved, feedback) => {
    void postAction({
      action: "explore-confirm",
      ...exploreConfirmPayload({ approved, feedback })
    });
  };
  const confirmGoals = (approved, goals, note) => {
    void postAction({
      action: "explore-confirm",
      stage: "goal",
      approved,
      goals: Array.isArray(goals) ? goals : [],
      note: note ?? ""
    });
  };
  const confirmOutline = (approved, note, goldChapter) => {
    void postAction({
      action: "outline-confirm",
      approved,
      note: note ?? "",
      ...goldChapter != null && Number.isSafeInteger(Number(goldChapter)) ? { goldChapter: Number(goldChapter) } : {}
    });
  };
  const submitReview = async (chapter, comment) => {
    const json = await postAction({ action: "review", chapter, comment });
    return json;
  };
  const graphOpinion = async (key, verdict, reason) => {
    const guard = projection.capture();
    const json = await postAction({
      action: "graph-opinion",
      key,
      verdict,
      ...typeof reason === "string" && reason !== "" ? { reason } : {}
    });
    if (json === null) return false;
    if (!isBookCurrent(guard)) return false;
    bookUiRef.current?.setGraphDropped(
      (prev) => verdict === KG_VERDICTS.keep ? prev.filter((one) => one !== key) : prev.includes(key) ? prev : [...prev, key]
    );
    return true;
  };
  const createBook = (form) => {
    void postAction({ action: "book-create", ...form }).then((json) => {
      if (json !== null && json.project !== void 0) {
        void projection.selectProject(json.project);
      }
    });
  };
  const uploadSource = async (file, asName = null, declared = false) => {
    const verdict = judgeMaterialUploadSize({ name: asName ?? file.name, size: file.size, autoSplit });
    if (verdict.blocked) {
      const err = new Error(verdict.message);
      err.retryable = false;
      throw err;
    }
    const guard = projection.capture();
    const bytes = await file.arrayBuffer();
    const name = asName ?? file.name;
    const url = `/textbook/upload?${sess()}&project=${encodeURIComponent(projectId)}&name=${encodeURIComponent(name)}` + (declared === true ? "&declared=1" : "");
    const res = await fetch(url, { method: "POST", body: bytes });
    let json = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    if (!res.ok)
      throw new Error(json !== null && json.error || `HTTP ${res.status}`);
    if (!isBookCurrent(guard)) return;
    try {
      await projection.refresh();
    } catch {
    }
  };
  const convert = () => {
    void postAction({ action: "convert-start" });
  };
  const removeSource = (file) => postAction({ action: "source-remove", file });
  const resume = () => {
    void postAction({ action: "resume" });
  };
  const pause = () => {
    void postAction({ action: "pause" });
  };
  const saveMineruToken = () => {
    if (mineruToken.trim() === "") return;
    void postAction({
      action: "settings",
      mineruToken: mineruToken.trim()
    }).then((json) => {
      if (json === null || json === void 0) return;
      const next = json.settings;
      if (next !== null && typeof next === "object") {
        applyMineruSettings(next, true);
      } else {
        setMineruSet(true);
        setMineruSource(null);
        setMineruMasked(null);
      }
      setMineruResetOpen(false);
      setMineruToken("");
    });
  };
  const previewBook = () => {
    openInSidebar("\u5DE5\u4F5C\u533A/book.md");
  };
  const runningSubagentCount = subagentRuns.runningCount;
  const stageStepProjector = (0, import_react21.useMemo)(
    () => createStageStepProjector({ meta, segments: processSegs, runningSubagentCount }),
    [meta, processSegs, runningSubagentCount]
  );
  const stageStepOverview = stageStepProjector.project({ kind: "overview" });
  const visibleError = (ui) => ui.error !== null ? ui.error : loadError;
  const errorLine = (ui) => {
    const text = visibleError(ui);
    if (text === null) return null;
    return (0, import_react21.createElement)(
      "p",
      { style: S.error },
      `\u26A0\uFE0F ${text}`,
      ui.error !== null ? (0, import_react21.createElement)(
        "button",
        {
          type: "button",
          style: { ...S.smallLink, marginLeft: "8px" },
          onClick: () => ui.setError(null)
        },
        "\u77E5\u9053\u4E86"
      ) : null
    );
  };
  const layer = classifyLayer({ packageName: INSTALLED_PACKAGE, version: INSTALLED_VERSION });
  const badge = layerBadge(layer);
  const updateNotice = updateNoticeText(useUpdateNotice(), layer);
  const styleNotes = (meta?.styleNotes ?? []).filter(
    (n) => n.status === "active"
  );
  const pendingIvs = (meta?.pendingInterventions ?? []).filter(
    (i) => i.status === "pending"
  );
  const openStylePanel = () => bookUiRef.current?.toggleStylePanel();
  const openIntervene = () => bookUiRef.current?.toggleIntervenePanel();
  const loadPatterns = () => {
    if (projectId === null) return;
    const guard = projection.capture();
    const bookUi = bookUiRef.current;
    void fetchJson("/textbook/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        // 只读展示那一路：模式库清单是**读**，目录把它标成 `read-only`，
        // 于是它进不了 `postAction` 那扇可调用的门（票 03）。
        action: uiReadOnly("pattern-list"),
        project: projectId,
        session: sessionRef.current
      })
    }).then((json) => {
      if (!isBookCurrent(guard)) return;
      if (json?.ok === true) bookUi?.setPatternList(json.patterns ?? NO_PATTERNS2);
    }).catch(() => {
    });
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
  const issueReaderQuestionnaire = async () => {
    const bookUi = bookUiRef.current;
    bookUi?.setReaderQuestionnaireBusy(true);
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
  const submitReaderQuestionnaire = async (text, answerer) => {
    const bookUi = bookUiRef.current;
    bookUi?.setReaderQuestionnaireBusy(true);
    try {
      const json = await postAction({ action: "reader-questionnaire-submit", text, answerer });
      if (json === null || json.ok !== true) return false;
      bookUi?.setReaderQuestionnaireSaved(true);
      bookUi?.setReaderQuestionnaireReceipt({
        answerer: typeof json.answerer === "string" && json.answerer !== "" ? json.answerer : answerer,
        at: typeof json.answererAt === "string" && json.answererAt !== "" ? json.answererAt : null
      });
      return true;
    } finally {
      bookUi?.setReaderQuestionnaireBusy(false);
    }
  };
  const goToReaderKnowledgeGraph = () => {
    bookUiRef.current?.setReaderQuestionnaireOpen(false);
    if (typeof document === "undefined") return;
    const focusGraph = () => {
      const block = document.querySelector("[data-kg-merged]") ?? document.querySelector("[data-kg-block]");
      if (block === null) return;
      if (typeof block.scrollIntoView === "function") block.scrollIntoView({ block: "start" });
      const firstKey = typeof block.querySelector === "function" ? block.querySelector("button") : null;
      if (firstKey !== null && typeof firstKey.focus === "function") firstKey.focus();
    };
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(focusGraph);
    else setTimeout(focusGraph, 0);
  };
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
  const surfaceExits = (exits) => exits.length === 0 ? null : (0, import_react21.createElement)(
    "div",
    { style: S.bar },
    exits.map(
      (exit) => (0, import_react21.createElement)(
        "button",
        {
          key: exit.id,
          type: "button",
          title: exit.why,
          style: S.bigBtn(true),
          onClick: () => runSurfaceExit(exit)
        },
        exit.label
      )
    )
  );
  if (bareSurface) {
    return (0, import_react21.createElement)(
      import_react21.Fragment,
      null,
      (0, import_react21.createElement)(
        "p",
        { style: { ...S.hint, padding: "16px" } },
        surface.copy
      ),
      (0, import_react21.createElement)(
        "div",
        { style: { padding: "0 16px 16px" } },
        surfaceExits(surface.exits)
      )
    );
  }
  const topBar = hasBookSurface ? (0, import_react21.createElement)(TopBar, {
    meta,
    openStylePanel,
    openIntervene,
    pause,
    resume
  }) : null;
  const simpleSurface = (ui) => {
    const mineruCard = (options = {}) => (0, import_react21.createElement)(MineruTokenCard, {
      mineruSet,
      mineruToken,
      mineruSource,
      mineruMasked,
      busy: ui.busy,
      onTokenChange: (e) => setMineruToken(e.target.value),
      onSave: saveMineruToken,
      resetOpen: mineruResetOpen,
      onToggleReset: () => setMineruResetOpen((v) => !v),
      ...options
    });
    return (0, import_react21.createElement)(
      "div",
      { style: S.container },
      (0, import_react21.createElement)("p", { style: S.title }, "\u9020\u4E66\u5DE5\u4F5C\u53F0"),
      (0, import_react21.createElement)(
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
        "\u4E00\u4E2A\u4F1A\u8BDD\u9020\u4E00\u672C\u4E66\u3002\u8F6E\u5230\u4F60\u6765\u5B9A\u7684\u65F6\u5019\uFF0C\u754C\u9762\u4F1A\u4EAE \u26A1 \u63D0\u9192\u4F60\uFF1B\u5B9A\u8FC7\u7684\u90FD\u5B58\u7740\uFF0C\u7B49 AI \u505C\u624B\uFF08\u6216\u4F60\u5148\u70B9 \u23F8 \u6682\u505C\uFF09\u5C31\u80FD\u6539\u3002"
      ),
      // ⚠️ 票 `ui-display-redesign/01`：**无书那一屏**的 MinerU 卡改由下面那个分支摆在
      // 建书卡之后（spec §2.1 的第 12 块，默认折成一行）——这里只留其余单屏的原位。
      // 票 `ui-display-redesign/21`（spec §2.19–2.21）：其余单屏（加载中／读失败／身份失效）
      // 的 MinerU 卡也**默认折**（今天整张常显）。已设置那一支折成一行脱敏读数＋「重新设置」，
      // 未设置那一支折成一行提示＋`<details>` 里的原表单；展开后的行为一个字不改。
      surface.kind === "no-book" ? null : mineruCard({ collapsed: true }),
      visibleError(ui) !== null ? errorLine(ui) : null,
      updateNotice === null ? null : (0, import_react21.createElement)("p", { style: S.update }, `\u{1F195} ${updateNotice}`),
      // 单屏那几档（票 `ui-systematic-fixes/05` 立，票 `06` 补异常态出口）：无书 ⇒ 向导卡；
      // 其余按 `kind` 摆：有句子就印句子，有出口就摆按钮（读失败/身份失效/加载超时那几档）。
      // ⚠️ 读失败那一屏**不摆向导**（`kind` 不是 `no-book`）——把人引向再建一本正是 06 要治的病。
      surface.kind === "no-book" ? (0, import_react21.createElement)(
        import_react21.Fragment,
        null,
        (0, import_react21.createElement)(WizardCard, {
          onCreate: createBook,
          onCreateDemo: () => {
            void postAction({ action: "demo-run" }).then((json) => {
              if (json?.project) void projection.selectProject(json.project);
            });
          },
          busy: ui.busy,
          suggestions: ui.suggestions,
          suggestLoading: ui.suggestLoading,
          onSuggest: (hintText) => requestSuggest(hintText)
        }),
        // 票 `ui-display-redesign/01`：MinerU 卡默认折成一行（**未设置那一支**；
        // 展开仍是今天的完整表单、行为不变），摆在建书卡之后、推广块之前。
        // 票 `token-banner/01`：已设置那一支保留完整卡（它要印来源与「重新设置」），
        // 所以折叠只对未设置生效——阶段一那一处才需要「已设置也折一行」。
        mineruCard({ collapsed: mineruSet !== true }),
        // 推广块默认折、最底那一块（内容与今天逐字相同，只是默认态与位置）。
        (0, import_react21.createElement)(PromoFoldBlock)
      ) : (0, import_react21.createElement)(
        import_react21.Fragment,
        null,
        // 票 `ui-display-redesign/21`（spec §2.19–2.21）：屏级问句 → 事实句（`copy`，
        // 加载中那一档带已等秒数）→ 加载中那句说明。问句的字面量住在
        // `src/ui/surface.js`（`src/ui/**` 才在判定线① 的用词扫描面里），这里只摆位置。
        // ⛔ bare 支不经过这一段（那条早退只画一句话＋出口，没有问句、没有壳）。
        surface.question === null ? null : (0, import_react21.createElement)(
          "p",
          { style: { margin: "0 0 4px" } },
          (0, import_react21.createElement)(
            "strong",
            { style: CARD_HEAD_QUESTION_STYLE },
            surface.question
          )
        ),
        surface.copy === null ? null : (0, import_react21.createElement)("p", { style: S.hint }, surface.copy),
        surface.note === null ? null : (0, import_react21.createElement)("p", { style: S.hint }, surface.note),
        surfaceExits(surface.exits)
      )
    );
  };
  const projectView = () => (0, import_react21.createElement)(
    "div",
    { style: { display: "flex", flex: 1, minHeight: 0, overflow: "hidden" } },
    (0, import_react21.createElement)(
      "div",
      {
        style: {
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: 0
        }
      },
      // ── 焦点区（书级子树，壳的**拥有者**）───────────────────────────────
      // 壳不产生 DOM 节点，所以**布局与滚动容器一个像素都不变**；它换来的是：切会话/
      // 切书时这一整块（阶段片、阶段页、当前主卡、书级面板、章节/Gold/确认卡……）连同
      // 各自的书级 UI state 与子组件自己的展开/输入/选中态一起重挂，不跨书存活
      //（ADR-0021 决策 9）。破卷广告与对话台在壳**之外**——它们是全局的。
      // `meta` / `gate` / `events` 传进来只为壳里那两条只读 UI 反应（自动跟随）；
      // 壳**不发任何请求、不持有业务动作**，那两样仍归 WorkbenchView（决策 9）。
      (0, import_react21.createElement)(
        BookSessionScope,
        { key: bookKey, uiRef: bookUiRef, meta, gate, events },
        (ui) => {
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
            setDeletingId
            // ⚠️ 票 `knowledge-graph-build/08` 的 `setGraphDropped` **刻意不在这里解构**：
            // 它只由 `graphOpinion` 那一处经 `bookUiRef.current?.setGraphDropped(…)` 写
            // （与 `rollback` 同一写法——迟到写入要能被「壳已重挂」那条判据挡住）。
          } = ui;
          const screen = resolveSurface({
            ...surfaceInput,
            viewPhase,
            browsing,
            showHistory,
            uiError: ui.error
          });
          const onPickStep = (key) => {
            setBrowsing(key);
            setViewPhase(null);
            const lastProgress = lastEventOfType(
              bookRef.current.core.data?.events ?? NO_EVENTS3,
              "textbook/progress"
            );
            progressSeqRef.current = lastProgress?.seq ?? -1;
            setProgressBanner(false);
          };
          const onPickPhase = (n) => {
            setViewPhase(n);
            setBrowsing(null);
          };
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
              stall
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
              onViewReport: () => viewWork({ path: "\u5DE5\u4F5C\u533A/explore.md", label: "\u8BFB\u6750\u6599\u62A5\u544A" }),
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
                    chapterCount: (meta.outline?.chapters ?? []).length
                  })
                });
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
                  approved: true
                });
              },
              // ⚠️ 与源探查那张卡的 `onViewReport` **是两个不同的闭包、两个键**（`工作区/chapter-NN.md`
              // vs `工作区/explore.md`）。不许合并成一个——那会把一处手对的接线藏进壳里。
              onView: (n) => viewWork({
                path: chapterRel(n),
                label: `\u7B2C ${n} \u7AE0`
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
              onBackfillGraph: () => postAction({ action: "knowledge-graph-backfill" })
            }
          });
          const cardView = createCardView(cardBook, slotsFromTable());
          const viewPhaseOfBrowsing = browsing === null ? meta?.phase ?? 1 : stageStepProjector.project({ kind: "focus", ref: browsing, fallbackPhase: meta?.phase ?? 1 }).phase;
          const phaseBarSelect = (n) => {
            setViewPhase(n === (meta.phase ?? 1) ? null : n);
            setBrowsing(null);
          };
          return (0, import_react21.createElement)(
            import_react21.Fragment,
            null,
            (0, import_react21.createElement)(
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
                  padding: "12px 16px"
                }
              },
              // 全览条：全书几步、还剩几步、现在在第几阶段 + 展开清单（收起时不渲染清单内容）。
              // 只在「现在」那一屏出现——回看某一步时，用户手里已经有那一步了，
              // 再顶一条全览是把"手里的东西"往下挤（展开体会往下顶，别顶两份）。
              // 候选 06：只传 `projector`——抬头 / currentPhaseText / 分组清单全部来自模型的
              // overview projection，组件不再自己推导（旧的 segments/meta/currentPhase props 已迁）。
              screen.kind === "now" ? (0, import_react21.createElement)(ProgressOverview, cardView.progressOverview) : null,
              // 自动跟随横幅（F5 方案 A）：等拍板强制回「现在」（6 秒自清）；浏览历史时 AI 有新进展（点击清浏览回现在）。
              awaitBanner ? (0, import_react21.createElement)(AutoFollowAwaitNote, {
                onClose: () => setAwaitBanner(false)
              }) : null,
              progressBanner && screen.kind === "browsing" ? (0, import_react21.createElement)(AutoFollowProgressNote, {
                onJump: () => {
                  setBrowsing(null);
                  setProgressBanner(false);
                },
                onDismiss: () => setProgressBanner(false)
              }) : null,
              // 不打断提示条（F17）：写完整本里提交风格线/留言/意见成功后，焦点区顶部滑入、6 秒自清。
              // 票 30②：条上那句字按**提交那一刻**的处境取两档——过目态那一档说「打断了」，
              // 铺章途中那一档仍是原来那句「不打断正在写的这一章」，一个字不变。
              // `noteToast` 这个槽位装的就是**该显示的那句话**（`false` = 不显示）：壳里只判真假
              // 与 6 秒自清，两处都只读真假，所以不用改壳。
              noteToast ? (0, import_react21.createElement)(InterruptNote, {
                onClose: () => setNoteToast(false),
                text: typeof noteToast === "string" ? noteToast : void 0
              }) : null,
              // 业务头（原 workbenchContent 头部迁入焦点区顶）：书名/取消书、MinerU、错误。
              (0, import_react21.createElement)(
                "div",
                {
                  style: {
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    marginBottom: "10px"
                  }
                },
                (0, import_react21.createElement)(
                  "strong",
                  { style: { fontSize: "13px" } },
                  `\u{1F4D6} ${meta.name ?? projectId}`
                ),
                // 「取消这本书」不在主视野里（2026-09-20 用户拍板：破坏性操作别抢眼）；
                // 2026-09-21 左栏删掉后它搬到焦点区底部的常驻小条（FocusFooter）。
                (0, import_react21.createElement)(
                  "button",
                  {
                    style: S.smallLink,
                    onClick: () => {
                      setPatternOpen(true);
                      loadPatterns();
                    },
                    // 票 `demo-channel-full/26`：这一句对演示书是假话（演示支回的是占位卡，
                    // 不是 AI 分析出来的）⇒ 两取值，出口在 `view-rules`。
                    title: patternPastePlaceholder(meta)
                  },
                  "\u{1F9E9} \u81EA\u5B9A\u4E49\u6A21\u5F0F"
                ),
                // 票 `reader-cognition-boundary-build/03`：读者情况问卷的常驻入口（同一排小键）。
                // ⚠️ 它**不按书的状态门控**：这是入口不是闸门；没有知识地图的书点下去会拿到一句
                // 说清的 409（「还没有知识地图」），⛔ 不假装发得出去。
                (0, import_react21.createElement)(
                  "button",
                  {
                    style: S.smallLink,
                    onClick: () => setReaderQuestionnaireOpen(true),
                    title: "\u7ED9\u6536\u5377\u4EBA\u4E00\u4EFD\u95EE\u5377\uFF08.md\uFF0C\u7535\u5B50\u586B\uFF09\uFF1A\u4E0B\u8F7D\u4E0B\u6765\u628A\u8BE5\u52FE\u7684\u52FE\u4E0A\uFF0C\u586B\u5B8C\u518D\u5168\u9009\u590D\u5236\u7C98\u56DE\u5DE5\u4F5C\u53F0"
                  },
                  "\u{1F9D1}\u200D\u{1F393} \u8BFB\u8005\u60C5\u51B5\u95EE\u5377"
                )
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
              !isDemoBook(meta) && !conversionSettled ? (0, import_react21.createElement)(MineruTokenCard, {
                mineruSet,
                mineruToken,
                mineruSource,
                mineruMasked,
                busy,
                onTokenChange: (e) => setMineruToken(e.target.value),
                onSave: saveMineruToken,
                resetOpen: mineruResetOpen,
                onToggleReset: () => setMineruResetOpen((v) => !v),
                collapsed: true
              }) : null,
              visibleError(ui) !== null ? errorLine(ui) : null,
              updateNotice === null ? null : (0, import_react21.createElement)("p", { style: S.update }, `\u{1F195} ${updateNotice}`),
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
              (0, import_react21.createElement)(PhaseBar, {
                phase: meta.phase ?? 1,
                gate,
                status: meta.status,
                humanTurn,
                // 被看的那一步所属的阶段（描边标记），与"当前阶段"那一格是**两件事**、不许混：
                // 浏览态取 `viewPhaseOfBrowsing`（点的是全览条里的一步），阶段页态取 `viewPhase`
                // （点的是阶段片一格）；在"现在"两侧都为空 → 不描任何格（2026-09-22 票 12 裁决 4）。
                viewed: screen.kind === "browsing" ? viewPhaseOfBrowsing : screen.kind === "phase-page" ? viewPhase : null,
                // 候选 06：阶段片 hover 的「这一步有几份文件」取 overview projection 的
                // `artifactEntryCountByPhase`（按分段条目累计，与阶段页按路径去重的
                // `uniqueFileCount` 是**有意不同的两个事实**——不静默统一，见 spec）。
                // ⚠️ **阶段 1 那一格不吃这一份**：它没有分段，按分段累计恒为 0，于是那一格
                // 此前恒说「还没有文件」而同屏卡上列着材料（票 walkthrough-2026-10/03）。
                // 它数的是材料，读数由 `materialCount` 单独给（同一份 projection 里）。
                artifactCountOf: (n) => stageStepOverview.artifactEntryCountByPhase[n] ?? 0,
                materialCount: stageStepOverview.materialCount ?? 0,
                onSelect: phaseBarSelect
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
              (0, import_react21.createElement)(NarrowMainHint, {
                mainWidth: mainBox.w,
                mainRightGap: mainBox.rightGap
              }),
              // 阶段页（全览条点一步落到这里；「回到现在」由那排常驻的阶段片承担——票 12 已裁，
              // 入口不随看点深浅消失，spec 不变量 13）。**排在阶段片之后**：理由与实测数字见上面
              // 阶段片那一块（顺序即位置）——两路互斥，但两路都吃同一条顺序。
              // 2026-09-21（用户第 5 条：「这个界面是不是不再必要了，可以直接复用现在的回看页面」）：
              // **不再渲染另一套单卡**，改成复用阶段页那一页、并把焦点定在选中的
              // 那一步——步清单点一步与顶栏点一格从此落到同一种卡。
              screen.kind === "browsing" ? (0, import_react21.createElement)(PhasePage, {
                // ⚠️ `key` 写在**袋外面**、与它并列：React 建元素时就把 `key` 摘走，
                // 组件 `props` 上永远没有它——它压根不是这张卡的 props（票 02）。
                // 换个身份（`seg-${browsing}`）是为了让那棵子树整棵重挂，票 05 的隔离边界靠它。
                ...cardView.phasePageBrowse.with({
                  phase: viewPhaseOfBrowsing,
                  focusedStep: browsing
                }),
                key: `seg-${browsing}`
              }) : null,
              // 顶栏 🎨 风格线 / 📮 留言 展开面板（Task 17 常驻入口；点开即见清单，再点或 ✕ 收起）。
              // 它们也算「内容」：一律排在阶段片之后——开一个面板不该把常驻导航面顶下去
              // （票 phase-bar-position/01 顺手把这条顺序收拢；面板的高度不受控，尤其模式库那张）。
              showStylePanel ? (0, import_react21.createElement)(StylePanel, {
                notes: styleNotes,
                // 票 `demo-channel-full/26`：面板里那两句要认得出演示书（两取值）。
                meta,
                onClose: () => setShowStylePanel(false)
              }) : null,
              showIntervenePanel ? (0, import_react21.createElement)(IntervenePanel, {
                items: pendingIvs,
                onClose: () => setShowIntervenePanel(false)
              }) : null,
              // 🧩 自定义模式库面板（2026-08-21）：粘贴描述 → AI 分析成「模式卡」加入本书。
              patternOpen ? (0, import_react21.createElement)(PatternPanel, {
                patterns: patternList,
                busy: patternBusy,
                result: patternResult,
                // 票 `demo-channel-full/26`：面板里那段说明要认得出演示书（两取值）。
                meta,
                onAnalyze: analyzePattern,
                onClose: () => setPatternOpen(false)
              }) : null,
              // 票 `reader-cognition-boundary-build/03`：读者情况问卷面板（给出 → 手粘回卷）。
              // 票 `ui-display-redesign/11`：三态（发卷／回卷／已收卷）；回执的第一来源是**盘上事实**
              // ——`returned`（`/textbook/events` 下发的回卷件原文）＋ `meta.answerer`／`meta.answererAt`，
              // 所以刷新/切书回来仍是同一份回执；`receipt` 只兜「本会话刚收下、快照还没到」那一帧。
              // ⚠️ 顺序与上面几个面板同一档：排在阶段片之后（开面板不把常驻导航面顶下去）。
              readerQuestionnaireOpen ? (0, import_react21.createElement)(ReaderQuestionnairePanel, {
                issued: readerQuestionnaireIssued,
                returned: book.core.data !== null && typeof book.core.data.readerQuestionnaireReturn === "string" && book.core.data.readerQuestionnaireReturn.trim() !== "",
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
                onClose: () => setReaderQuestionnaireOpen(false)
              }) : null,
              // 阶段页：这一步走到哪、这一阶段有哪几步、每一步产出了哪些文件。
              // 产物一律由卡片里写着「打开」的按钮交给右栏（导航本身不开文件）。
              screen.kind === "phase-page" ? (0, import_react21.createElement)(
                PhasePage,
                // ⚠️ 这一处**不传 `key`**：它是「阶段页态」那一屏，身份由 `viewPhase` 决定，
                // 与浏览态那处不是同一棵子树（浏览态那处带 `key`，切步即整棵重挂）。
                cardView.phasePagePhase.with({ phase: viewPhase, events })
              ) : null,
              // 状态条：spec 不变量 10——回看时不摆"现在"的内容（状态条 / 活性行 /「现在」主卡
              // 一律收起）。2026-09-22 票 03：旧门控只看 `viewPhase`，于是**浏览态**
              // （`browsing` 非空，全览条点一步进来）下状态条还在渲染——补上这一半。
              // 票 `ui-systematic-fixes/13`：接管了另一本时，**状态条那一格**多一行告知
              // （ADR-0021 决策 13 修订：告知、不拦；可关）。它排在状态条之后、活性行之前
              // ——同属「现在」这一屏的 chrome，回看态照旧一律收起。
              screen.kind === "now" ? (0, import_react21.createElement)(StatusStrip, {
                meta,
                gate,
                pendingStage: pendingStageView,
                progressDetail,
                metaLabel: pendingStageLabel,
                // 批 1：把「轮到谁」的唯一真值交给状态条，避免横幅与阶段片各说一套。
                humanTurn
              }) : null,
              screen.kind === "now" && takeoverNoticeNow !== null ? (0, import_react21.createElement)(IdentityTakeoverNote, {
                // 文案**只**从这里出去（`surface.js` 的 `identityTakeoverNotice`）：
                // ⛔ 不在壳里拼第二份、也⛔ 不把投影送来的机器 id 印上屏。
                text: identityTakeoverNotice(takeoverNoticeNow.name),
                onClose: () => setTakeoverNotice(null)
              }) : null,
              // 主 AI 活性行（F17）：常驻一行——「🤖 我正在做」/ 好一会儿没动静了 [🔁 从断点继续] /
              // 「⚡ 轮到你」。票 stale-detection/01 起它是这一屏**唯一**的停顿出口（状态卡那张
              // 黄色警告框已撤），判定与措辞都归 `src/ui/rules.js` + `src/ui/panels.js`。
              // 阶段页与分段回看都是"回看/前瞻"，不摆"现在"的活性（它和这一步的历史无关）——
              // 用户原话「回看时不要再展示当前步骤的内容」。spec 不变量 10 把状态条、活性行与
              // 「现在」主卡并列为"浏览态一律收起"的三样（2026-09-22 票 03 复核：这里的门控
              // 本来就带 `browsing === null`，与状态条那处不一致的写法一并统一）。
              screen.kind === "now" ? (0, import_react21.createElement)(ActivityLine, {
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
                subagents: subagentRuns
              }) : null,
              // 「现在」那张主卡只属于现场：在看某一阶段的页面时，页面自己交代
              // "这一步的书夹产物在哪"，别再叠一张能操作的卡进去
              // （2026-09-21 用户裁决：回看页只读，能改结果的动作只出现在「现在」）。
              //
              // 票 24：这一格外面那层 `div` **只为挂一个 ref**（量它自己的盒子，好把拍板/认可
              // 那张卡带进焦点区可视带——见上面那条 effect）。它没有样式，布局与从前逐像素相同。
              (() => {
                if (screen.kind !== "now") return null;
                const card = (() => {
                  const row = rowFor(focusCardKey(meta, gate));
                  return (0, import_react21.createElement)(row.component, cardView[row.slot]);
                })();
                return (0, import_react21.createElement)("div", { ref: nowCardRef }, card);
              })(),
              // 「之前的过程」是现场的账本回放（与"我正在看哪一步"无关），阶段页上不摆它。
              screen.kind !== "phase-page" ? (0, import_react21.createElement)(
                "div",
                { style: { margin: "8px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" } },
                (0, import_react21.createElement)(
                  "button",
                  {
                    style: S.smallLink,
                    onClick: () => setShowHistory(!showHistory)
                  },
                  showHistory ? "\u25BE \u6536\u8D77\u4E4B\u524D\u7684\u8FC7\u7A0B" : "\u25B8 \u4E4B\u524D\u7684\u8FC7\u7A0B\uFF08\u70B9\u5F00\u53EF\u56DE\u653E\u62BD\u67E5\uFF09"
                ),
                // 层徽记的落点（票 layer-badge）：这条小条的**右端**。
                // 位置是按「不让它抢现场」定的，不是按「哪有空位」——原先摆在阶段片下面
                // 第一行时，一句四十来字的话在窄栏里折成三五行，那不是提示是噪声。
                // 现在上屏的只有短签，长解释进 `title`（见 layerBadge 的注释）。
                // 另两条边界写在判据那边：它排在阶段片之后（`smoke-test.mjs` 2d-3d 的
                // SMALL_CHROME 白名单只管阶段片之前的直接子节点），且只在有书的
                // 「现在」那一屏有这一条小条——没建书时没有要提醒的现场。
                badge === null ? null : (0, import_react21.createElement)("span", { style: S.smallLink, title: badge.hint }, badge.label)
              ) : null,
              screen.kind !== "phase-page" && showHistory ? (0, import_react21.createElement)(ReplayList, cardView.replay) : null
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
            (0, import_react21.createElement)(
              "div",
              { style: { padding: "0 16px 12px" } },
              (0, import_react21.createElement)(FocusFooter, {
                status: meta.status ?? null,
                bookDir,
                deleting: deletingId === projectId,
                busy,
                // 票 workbench-transitions/24（ADR-0015）：过程记录是**全局**产物，
                // 入口只在这条小条上。走既有的 openInSidebar（→ 右栏预览、只读），
                // 不新造第二套打开逻辑——它连同其余产物共用同一份 productOpenMode 判据。
                onOpenProcessLog: () => openInSidebar("\u8FC7\u7A0B\u8BB0\u5F55.md"),
                onDelete: () => {
                  if (deletingId === projectId) deleteBook(projectId);
                  else setDeletingId(projectId);
                },
                // 票 12：确认态要有退路——「算了」把 deletingId 收回 null、回到第一态。
                // 两条路都不发动作；`book-delete` 仍然只有第二下（确认那颗）发，且只发一次。
                onCancelDelete: () => setDeletingId(null)
              })
            )
          );
        }
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
      (0, import_react21.createElement)(SocratopiaAd),
      // 下：对话台（右下镜像宿主对话；分界可拖）。焦点区在它上面独立滚动。
      // ⚠️ 2026-09-21 用户裁决：「展开对话台」不再需要——要对话去官方的「对话」页签。
      // 收起态（默认）整块**不渲染**（原来是一条 32px 的入口条）；展开态仍渲染对话台本体，
      // 谁把它展开没有变（宿主的自动展开逻辑仍在）。
      deskCollapsed ? null : (0, import_react21.createElement)(
        "div",
        {
          ref: deskRef,
          style: {
            height: `${deskLiveRef.current ?? deskHeight}px`,
            flexShrink: 0,
            borderTop: "1px solid var(--dsw-alias-border-l2)",
            position: "relative"
          }
        },
        (0, import_react21.createElement)("div", {
          // 拖拽分界手柄
          style: {
            position: "absolute",
            top: "-4px",
            left: 0,
            right: 0,
            height: "8px",
            cursor: "ns-resize"
          },
          onMouseDown: startDeskDrag
        }),
        // 对话台的滚动容器移进 ChatDesk 自己（钉底滚动回归修复在组件内）。
        (0, import_react21.createElement)(ChatDesk, {
          useChat: props.useChat,
          events,
          // Task 20 回执徽章用（workbench 事件数组）
          onNudge: () => {
            void postAction({
              action: "nudge",
              text: "\u5DE5\u4F5C\u53F0\u8FD8\u6CA1\u8DDF\u4E0A\uFF0C\u8BF7\u628A\u521A\u624D\u7B54\u5E94\u7684\u4E8B\u843D\u8D26\uFF08\u6BD4\u5982\u98CE\u683C\u7EBF\u3001\u8FDB\u5EA6\uFF09"
            });
          },
          onCollapse: () => setDeskCollapsed(true)
        })
      )
    )
  );
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
    marginInline: "auto"
  };
  if (!hasBookSurface) {
    return (0, import_react21.createElement)(
      "div",
      { ref: rootRef, style: rootStyle },
      (0, import_react21.createElement)(
        BookSessionScope,
        { key: bookKey, uiRef: bookUiRef, meta, gate, events },
        (ui) => (0, import_react21.createElement)(
          import_react21.Fragment,
          null,
          topBar,
          (0, import_react21.createElement)(
            "div",
            { style: { flex: 1, minHeight: 0, overflow: "auto" } },
            simpleSurface(ui)
          )
        )
      )
    );
  }
  return (0, import_react21.createElement)(
    "div",
    { ref: rootRef, style: rootStyle },
    (0, import_react21.createElement)(BookSessionScope, { key: bookKey }, topBar),
    projectView()
  );
}
function apply(ctx) {
  void startUpdateCheck();
  const openFileInSidebar = (address) => {
    ctx.sidebarRight.openResource(address, { revealIfOpened: true });
  };
  ctx.slots.inject("conversation.view", () => {
    let disposer = null;
    let probedSession = null;
    let hasBook = false;
    const sync = () => {
      const currentId = ctx.uiSession.current.getSnapshot().key ?? null;
      const current = currentId === null ? void 0 : ctx.sessions.list.getSnapshot().byId?.[currentId];
      const id = currentId;
      const isSubagent = current?.origin === "subagent";
      const isTextbook = current?.projectionValues?.agentPreset === "textbook";
      const show = !isSubagent && (isTextbook || id !== null && id === probedSession && hasBook);
      if (show && disposer === null) {
        disposer = ctx.slots.register(
          {
            name: "conversation.view",
            id: "dsh-craft-your-textbook",
            order: 20,
            label: () => "\u5DE5\u4F5C\u53F0",
            // 预览入口以 props 注入（组件不持 ctx）：见上方 openFileInSidebar。
            inject: () => ({ openFileInSidebar })
          },
          WorkbenchView
        );
      } else if (!show && disposer !== null) {
        disposer();
        disposer = null;
      }
      if (!isTextbook && !isSubagent && id !== null && id !== probedSession) {
        probedSession = id;
        hasBook = false;
        void fetch(`/textbook/projects?session=${encodeURIComponent(id)}`).then((res) => res.ok ? res.json() : null).then((json) => {
          if (probedSession !== id) return;
          hasBook = (json?.projects ?? []).length > 0;
          if (hasBook) sync();
        }).catch(() => {
        });
      }
    };
    sync();
    const unsubscribeSession = ctx.sessions.list.subscribe(sync);
    const unsubscribeCurrent = ctx.uiSession.current.subscribe(sync);
    return () => {
      unsubscribeSession();
      unsubscribeCurrent();
      if (disposer !== null) disposer();
    };
  });
  ctx.slots.inject(
    "conversation.session.header.utilities",
    () => ctx.slots.register(
      {
        name: "conversation.session.header.utilities",
        id: "textbook-autoopen",
        order: 99
      },
      AutoOpenWorkbench
    )
  );
  ctx.uiConversation.events.register(createQuestionAnswerDefinition());
  ctx.logger.info(
    "[ui-textbook-run] \u5DE5\u4F5C\u53F0\u89C6\u56FE\u5DF2\u6CE8\u518C\uFF08\u5168\u89C8\u6761 + \u9636\u6BB5\u9875 + \u5BF9\u8BDD\u53F0 + \u81EA\u52A8\u6253\u5F00\uFF09"
  );
}
return module.exports; } });
