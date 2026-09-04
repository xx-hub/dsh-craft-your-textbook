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
  BrowseSection: () => BrowseSection,
  ChaptersCard: () => ChaptersCard,
  ChatDesk: () => ChatDesk,
  DeliveryCard: () => DeliveryCard,
  ExploreConfirmCard: () => ExploreConfirmCard,
  FileViewer: () => FileViewer,
  FinalApprovalCard: () => FinalApprovalCard,
  GatePanel: () => GatePanel,
  GoldCompare: () => GoldCompare,
  GoldFinalize: () => GoldFinalize,
  GoldOpinionList: () => GoldOpinionList,
  GoldReader: () => GoldReader,
  GoldTable: () => GoldTable,
  HistoryBrowser: () => HistoryBrowser,
  InterruptNote: () => InterruptNote,
  IntervenePanel: () => IntervenePanel,
  MineruTokenCard: () => MineruTokenCard,
  OutlineConfirmCard: () => OutlineConfirmCard,
  PatternPanel: () => PatternPanel,
  PhaseBar: () => PhaseBar,
  ProcessMapRail: () => ProcessMapRail,
  READER_PARA_STYLE: () => READER_PARA_STYLE,
  StatusCard: () => StatusCard,
  StatusStrip: () => StatusStrip,
  StylePanel: () => StylePanel,
  TopBar: () => TopBar,
  UploadArea: () => UploadArea,
  WizardCard: () => WizardCard,
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
var import_react8 = require("react");

// src/ui/styles.js
var S = {
  container: {
    padding: "16px 20px",
    fontFamily: "inherit",
    color: "var(--dsw-text, #1f2328)"
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
    border: active ? "1px solid var(--dsw-accent, #4f6ef7)" : "1px solid var(--dsw-border, #d0d7de)",
    background: active ? "var(--dsw-accent-soft, #eef2ff)" : "transparent",
    borderRadius: "8px",
    padding: "6px 10px",
    fontSize: "13px",
    cursor: "pointer"
  }),
  card: {
    border: "1px solid var(--dsw-border, #d0d7de)",
    borderRadius: "10px",
    padding: "12px 14px",
    marginBottom: "10px",
    background: "var(--dsw-surface, #ffffff)",
    fontSize: "13px"
  },
  focus: {
    border: "1.5px solid var(--dsw-accent, #4f6ef7)",
    borderRadius: "12px",
    padding: "14px 16px",
    marginBottom: "12px",
    background: "var(--dsw-accent-soft, #eef2ff)",
    fontSize: "13px"
  },
  error: {
    color: "var(--dsw-danger, #cf222e)",
    fontSize: "13px",
    margin: "8px 0"
  },
  bigBtn: (primary) => ({
    border: "none",
    borderRadius: "10px",
    padding: "10px 18px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    color: "#ffffff",
    background: primary ? "var(--dsw-accent, #4f6ef7)" : "var(--dsw-danger, #cf222e)"
  }),
  smallLink: {
    border: "none",
    background: "transparent",
    color: "var(--dsw-accent, #4f6ef7)",
    cursor: "pointer",
    fontSize: "12px",
    textDecoration: "underline",
    padding: "0"
  },
  input: {
    width: "100%",
    borderRadius: "8px",
    border: "1px solid var(--dsw-border, #d0d7de)",
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
    border: "1px solid var(--dsw-border, #d0d7de)",
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
  seg: (state) => ({
    flex: 1,
    borderRadius: "6px",
    padding: "6px 2px",
    textAlign: "center",
    fontSize: "11px",
    color: state === "done" ? "var(--dsw-text, #1f2328)" : state === "current" ? "#ffffff" : "var(--dsw-text, #1f2328)",
    background: state === "done" ? "var(--dsw-success-soft, #dafbe1)" : state === "current" ? "var(--dsw-accent, #4f6ef7)" : "var(--dsw-border-soft, #eff1f4)",
    border: state === "current" ? "none" : "1px solid var(--dsw-border, #d0d7de)"
  })
};

// src/ui/rules.js
function formatTime(time) {
  return new Date(time).toLocaleTimeString("zh-CN", { hour12: false });
}
function chapterBadge(row, pendingReviews, doneSet, pipelineStage) {
  const hasReview = (pendingReviews ?? []).some(
    (r) => Number(r.chapter) === Number(row.n)
  );
  if (doneSet.has(row.n)) {
    return hasReview ? { icon: "\u{1F4DD}", text: "\u6709\u610F\u89C1\u5F85 AI \u4FEE\u8BA2", tone: "#cf222e" } : { icon: "\u{1F6E1}\uFE0F", text: "\u5199\u5B8C\xB7\u5BA1\u8FC7\xB7AI \u628A\u8FC7\u5173", tone: "#1a7f37" };
  }
  if (pipelineStage === "writing")
    return { icon: "\u23F3", text: "\u6267\u7B14\u4E2D", tone: "#e3b341" };
  if (pipelineStage === "auditing")
    return { icon: "\u{1F50D}", text: "\u5BA1\u8BA1\u4E2D", tone: "#0969da" };
  if (pipelineStage === "audited")
    return { icon: "\u{1F50E}", text: "\u5BA1\u8BA1\u5B8C\u6210\uFF0C\u7B49 AI \u7EC8\u5BA1", tone: "#0969da" };
  if (pipelineStage === "finalizing")
    return { icon: "\u{1F441}", text: "AI \u7EC8\u5BA1\u4E2D", tone: "#57606a" };
  if (pipelineStage === "done") {
    return hasReview ? { icon: "\u{1F4DD}", text: "\u6709\u610F\u89C1\u5F85 AI \u4FEE\u8BA2", tone: "#cf222e" } : { icon: "\u{1F6E1}\uFE0F", text: "\u5199\u5B8C\xB7\u5BA1\u8FC7\xB7AI \u628A\u8FC7\u5173", tone: "#1a7f37" };
  }
  if (row.written && row.audited)
    return { icon: "\u{1F441}", text: "AI \u7EC8\u5BA1\u4E2D", tone: "#57606a" };
  if (row.written)
    return { icon: "\u{1F50D}", text: "\u5199\u597D\u4E86\uFF0C\u5BA1\u8BA1\u4E2D", tone: "#0969da" };
  return { icon: "\u23F3", text: "\u6267\u7B14\u4E2D", tone: "#e3b341" };
}
function deriveDoneSet(events) {
  const set = /* @__PURE__ */ new Set();
  for (const event of events ?? []) {
    if (event.type !== "textbook/agent-end") continue;
    const label = String(event.data?.label ?? "");
    if (!label.includes("\u5B8C\u6210")) continue;
    const match = /第(\d+)章/.exec(label);
    if (match !== null) set.add(Number(match[1]));
  }
  return set;
}
function mainProgressVisible(browsing) {
  return browsing === null;
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

// src/domain-rules.js
var ROLES = Object.freeze([
  "\u5B66\u751F\u7528\u4E66",
  "\u6559\u5E08\u7528\u4E66",
  "\u8003\u7EB2",
  "\u8BB2\u4E49",
  "\u771F\u9898"
]);
function guessRoleFromName(name) {
  const n = String(name ?? "").toLowerCase();
  if (/(教师|教参|teacher|教学参考|教师用书)/.test(n)) return "\u6559\u5E08\u7528\u4E66";
  if (/(考纲|大纲|课标|syllabus|课程标准)/.test(n)) return "\u8003\u7EB2";
  if (/(真题|试卷|试题|卷子|exam|paper|test)/.test(n)) return "\u771F\u9898";
  if (/(讲义|教案|课件|笔记|handout|notes)/.test(n)) return "\u8BB2\u4E49";
  return "\u5B66\u751F\u7528\u4E66";
}
function goldChapterNo(meta) {
  return Number.isSafeInteger(meta?.goldChapter) && meta.goldChapter >= 1 ? meta.goldChapter : 1;
}
var PHASES = Object.freeze([
  { n: 1, label: "\u6750\u6599\u51C6\u5907" },
  { n: 2, label: "\u6E90\u63A2\u67E5" },
  { n: 3, label: "\u6559\u5B66\u8BBE\u8BA1" },
  { n: 4, label: "\u8303\u4F8B\u7AE0" },
  { n: 5, label: "\u5168\u7AE0\u5199\u4F5C" },
  { n: 6, label: "\u7EC8\u68C0\u4E0E\u4EA4\u4ED8" }
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
var MAX_UPLOAD_BYTES = 500 * 1024 * 1024;
function uploadTooLargeMessage() {
  return `\u8FD9\u4EFD PDF \u8D85\u8FC7 500MB \u4E0A\u4F20\u4E0A\u9650\uFF0C\u8BF7\u62C6\u6210\u591A\u4EFD\uFF08\u6BCF\u4EFD <500MB\uFF09\u540E\u5206\u522B\u4E0A\u4F20`;
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
  "textbook/pattern-added": { label: "\u81EA\u5B9A\u4E49\u6A21\u5F0F", emoji: "\u{1F4C7}", announce: false }
});

// src/ui/view-rules.js
var STAGE_HUMAN = {
  explore: "\u6E90\u63A2\u67E5",
  outline: "\u7AE0\u8282\u9AA8\u67B6",
  gold: "\u6700\u4F73\u8303\u4F8B\u7AE0",
  chapters: "\u94FA\u7AE0",
  merge: "\u5408\u5E76\u6210\u4E66",
  final: "\u6700\u540E\u68C0\u67E5"
};
var stageHuman = (stage) => STAGE_HUMAN[stage] ?? "";
function focusCardKey(meta, gate) {
  if (gate !== null && gate !== void 0 && gate.status === "awaiting")
    return "gate";
  const status = meta?.status ?? "";
  if (status === "awaiting-explore") return "explore";
  if (status === "awaiting-outline") return "outline";
  if (status === "awaiting-gold") return "gold";
  if (status === "awaiting-final-approval") return "final";
  if (status === "delivered") return "delivered";
  if (meta?.phase === 5) return "chapters";
  if (meta?.phase === 1) return "upload";
  return "status";
}
var phaseProduct = (phase, meta, workFiles) => {
  if (phase === 1) return { path: "__materials__", label: "\u7B2C\u4E00\u6B65\xB7\u6750\u6599" };
  const map = {
    2: "work/explore.md",
    3: "work/outline.md",
    4: `work/chapter-${String(goldChapterNo(meta)).padStart(2, "0")}.md`,
    5: "work/book.md",
    6: "work/book.md"
  };
  const path = map[phase];
  if (path === void 0) return null;
  return workFiles.find((f) => f.path === path) ?? null;
};
var workPathForEvent = (event, meta, workFiles) => {
  const data = event.data ?? {};
  const candidates = [];
  const label = data.label ?? "";
  if (event.type === "textbook/agent-end" || event.type === "textbook/agent-start") {
    if (label === "\u6E90\u63A2\u67E5") candidates.push("work/explore.md");
    else if (label === "\u5408\u5E76\u6210\u4E66" || label === "\u6700\u540E\u68C0\u67E5\uFF08\u8D28\u91CF\u95E8\uFF09")
      candidates.push("work/book.md");
    else if (label === "\u6574\u7406\u7AE0\u8282\u9AA8\u67B6") candidates.push("work/outline.md");
    else if (label === "\u6700\u4F73\u8303\u4F8B\u7AE0" || label.startsWith("\u6700\u4F73\u8303\u4F8B\u7AE0"))
      candidates.push(
        `work/chapter-${String(goldChapterNo(meta)).padStart(2, "0")}.md`
      );
    else if (label.startsWith("\u5199\u7B2C")) {
      const match = /写第(\d+)章/.exec(label);
      if (match !== null)
        candidates.push(
          `work/chapter-${String(Number(match[1])).padStart(2, "0")}.md`
        );
    } else if (label.startsWith("\u81EA\u67E5\u7B2C")) {
      const match = /自查第(\d+)章/.exec(label);
      if (match !== null)
        candidates.push(
          `work/audit-${String(Number(match[1])).padStart(2, "0")}.md`
        );
    }
  } else if (event.type === "textbook/phase-end") {
    const phase = Number(data.phase);
    if (phase === 2) candidates.push("work/explore.md");
    else if (phase === 4)
      candidates.push(
        `work/chapter-${String(goldChapterNo(meta)).padStart(2, "0")}.md`
      );
    else if (phase === 5 || phase === 6) candidates.push("work/book.md");
  }
  const hit = candidates.find(
    (path) => workFiles.some((f) => f.path === path)
  );
  if (hit === void 0) return null;
  return {
    path: hit,
    label: workFiles.find((f) => f.path === hit)?.label ?? hit
  };
};

// src/ui/md-render.js
var import_react = require("react");
var READER_PARA_STYLE = {
  margin: "0 0 0.75em",
  fontSize: "14px",
  lineHeight: 1.7,
  maxWidth: "42em"
};
function renderInline(text) {
  const str = String(text ?? "");
  const head = /^(#{1,2})\s+(.+)$/.exec(str);
  if (head !== null)
    return [
      (0, import_react.createElement)(
        "strong",
        { style: { fontSize: "16px" } },
        ...inlineBold(head[2])
      )
    ];
  const list = /^[-*]\s+(.+)$/.exec(str);
  if (list !== null)
    return [
      (0, import_react.createElement)(
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
      i % 2 === 1 ? (0, import_react.createElement)("strong", { key: i }, parts[i].slice(2, -2)) : parts[i]
    );
  }
  return nodes;
}
function exploreReportBlocks(mdText) {
  const paras = splitParagraphs(mdText);
  const blocks = [];
  for (const para of paras) {
    blocks.push(
      /^#{1,2}\s+/.test(para) ? (0, import_react.createElement)(
        "div",
        { key: blocks.length, style: { margin: "0 0 0.6em" } },
        ...renderInline(para)
      ) : (0, import_react.createElement)(
        "p",
        { key: blocks.length, style: READER_PARA_STYLE },
        ...renderInline(para)
      )
    );
  }
  return blocks;
}

// src/ui/event-cards.js
var import_react2 = require("react");
function cardText(event) {
  const data = event.data ?? {};
  switch (event.type) {
    case "textbook/phase-start":
      return `\u9636\u6BB5 ${data.phase} \u5F00\u59CB\uFF1A${data.label ?? ""}`;
    case "textbook/phase-end":
      return `\u9636\u6BB5 ${data.phase} \u5B8C\u6210\uFF1A${data.label ?? ""}`;
    case "textbook/agent-start":
      return `AI \u5F00\u59CB\uFF1A${data.label ?? ""}`;
    case "textbook/agent-end":
      return `AI \u5B8C\u6210\uFF1A${data.label ?? ""}`;
    case "textbook/gate-proposal":
      return `AI \u63D0\u6848\uFF08\u7B2C ${data.gate ?? "?"} \u5173 \xB7 v${data.version ?? "?"}\uFF09\uFF1A${data.title ?? ""}`;
    case "textbook/gate-decision":
      return data.approved === true ? `\u7B2C ${data.gate ?? "?"} \u5173\u901A\u8FC7\uFF08v${data.version ?? "?"}\uFF09` : `\u7B2C ${data.gate ?? "?"} \u5173\u9A73\u56DE\uFF08v${data.version ?? "?"}\uFF09${data.reasons?.length > 0 ? `\uFF1A${data.reasons.join("\u3001")}` : ""}`;
    case "textbook/mineru-progress":
      return `\u8F6C\u6362 ${data.file ?? ""}\uFF1A${data.stage ?? ""}`;
    case "textbook/rollback":
      return `\u21A9\uFE0F \u5DF2\u56DE\u9000\u5230\u5FEB\u7167 ${data.snapshot ?? "?"}`;
    case "textbook/source-added":
      return `\u5DF2\u4E0A\u4F20\u6750\u6599\uFF1A${data.file ?? ""}\uFF08${data.role ?? ""}\uFF09`;
    case "textbook/hint":
      return `\u{1F4A1} ${data.text ?? ""}`;
    case "textbook/error":
      return `\u26A0\uFE0F \u51FA\u9519\uFF08${data.task ?? ""}\uFF09\uFF1A${data.message ?? ""}`;
    case "textbook/quality":
      return `\u8D28\u91CF\u95E8\uFF1A${(data.checks ?? []).filter((c) => c.ok === true).length}/${(data.checks ?? []).length} \u9879\u901A\u8FC7`;
    case "textbook/delivery":
      return "\u{1F389} \u4EA4\u4ED8\u5B8C\u6210";
    case "textbook/stage-start":
      return `\u{1F3AF} \u4EA4\u7ED9 AI \u52A8\u624B\uFF1A${data.label ?? data.stage ?? ""}`;
    case "textbook/progress":
      return `\u23F3 ${data.label ?? ""}${data.detail ? `\uFF1A${data.detail}` : ""}`;
    case "textbook/review":
      return `\u{1F440} \u62BD\u67E5\u610F\u89C1\uFF08${data.title ?? `\u7B2C${data.chapter ?? "?"}\u7AE0`}\uFF09\uFF1A${data.comment ?? ""}`;
    case "textbook/ai-report":
      return `\u{1F6E1}\uFE0F AI \u81EA\u67E5\u62A5\u544A\uFF1A${data.report ?? ""}`;
    case "textbook/deep-modify":
      return `\u270F\uFE0F \u5B9A\u70B9\u4FEE\u6539\uFF1A${data.segment ?? ""}`;
    case "textbook/deep-undo":
      return `\u21A9\uFE0F \u64A4\u9500\u5B9A\u70B9\u4FEE\u6539\uFF1A${data.segment ?? ""}`;
    case "textbook/pattern-added":
      return `\u{1F4C7} \u5DF2\u52A0\u81EA\u5B9A\u4E49\u6A21\u5F0F\uFF1A${data.name ?? ""}`;
    case "textbook/gold-chapter":
      return `\u{1F451} \u91D1\u6807\u51C6\u7AE0\uFF1A\u7B2C ${data.chapter ?? "?"} \u7AE0`;
    case "textbook/chapters-review":
      return `\u{1F50D} \u7AE0\u8282\u8FC7\u76EE\u786E\u8BA4\uFF08${data.approved === true ? "\u901A\u8FC7" : "\u9A73\u56DE"}\uFF09`;
    case "textbook/final-approve":
      return `\u2705 \u7EC8\u68C0\u8BA4\u53EF${data.approved === true ? "" : `\uFF1A${data.note ?? ""}`}`;
    default:
      return `${EVENT_META[event.type]?.emoji ?? ""} ${EVENT_META[event.type]?.label ?? event.type}`.trim();
  }
}
function cardIcon(event) {
  if (event.type === "textbook/gate-decision" || event.type === "textbook/outline-decision")
    return event.data?.approved === true ? "\u2705" : "\u21A9\uFE0F";
  return EVENT_META[event.type]?.emoji ?? "\u2022";
}
var SHORT_PHASE_LABELS = { 3: "\u8BBE\u8BA1", 5: "\u94FA\u7AE0", 6: "\u4EA4\u4ED8" };
function PhaseBar(props) {
  const { phase, gate, status, onSelect, productOf } = props;
  const doneUpTo = phase - 1;
  const gateAwaiting = gate !== null && gate.status === "awaiting";
  const humanTurn = props.humanTurn === true || gateAwaiting && phase === 3;
  return (0, import_react2.createElement)(
    "div",
    { style: S.bar },
    PHASES.map((item) => {
      let state = "pending";
      if (item.n < phase || status === "delivered" || status === "awaiting-explore" && item.n <= 2 || status === "awaiting-outline" && item.n <= 3 || status === "awaiting-gold" && item.n <= 4 || status === "awaiting-chapters-review" && item.n <= 5)
        state = "done";
      else if (item.n === phase) state = "current";
      let label = SHORT_PHASE_LABELS[item.n] ?? item.label;
      if (item.n === phase && humanTurn) label = "\u26A1\u8F6E\u5230\u4F60";
      const product = typeof productOf === "function" ? productOf(item.n) : null;
      if (product !== null && state === "done") label = `${label} \u{1F4C4}`;
      const clickable = product !== null;
      return (0, import_react2.createElement)(
        "div",
        {
          key: item.n,
          style: {
            ...S.seg(state),
            ...clickable ? { cursor: "pointer" } : {}
          },
          title: clickable ? `\u67E5\u770B\u300C${product.label}\u300D` : void 0,
          onClick: clickable && typeof onSelect === "function" ? () => onSelect(item.n) : void 0
        },
        label
      );
    })
  );
}
function WizardCard(props) {
  const {
    onCreate,
    onCreateDemo,
    busy,
    suggestions,
    suggestLoading,
    onSuggest
  } = props;
  const [name, setName] = (0, import_react2.useState)("");
  const [goal, setGoal] = (0, import_react2.useState)("");
  const [route, setRoute] = (0, import_react2.useState)("blueprint");
  const [science, setScience] = (0, import_react2.useState)(false);
  const [agree, setAgree] = (0, import_react2.useState)(false);
  const [hint, setHint] = (0, import_react2.useState)("");
  const [error, setError] = (0, import_react2.useState)(null);
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
    if (!agree) {
      setError("\u8BF7\u5148\u52FE\u9009\u6750\u6599\u58F0\u660E");
      return;
    }
    onCreate({ name: name.trim(), goal: goal.trim(), route, science });
  };
  return (0, import_react2.createElement)(
    "div",
    { style: S.focus },
    (0, import_react2.createElement)(
      "div",
      null,
      (0, import_react2.createElement)(
        "strong",
        { style: { fontSize: "14px" } },
        '\u{1F4DA} \u7B2C\u4E00\u6B65 \xB7 \u6750\u6599\u51C6\u5907\uFF1A\u5148\u7ED9\u4E66"\u5EFA\u6863"\uFF0810 \u79D2\uFF09\uFF0C\u7136\u540E\u5C31\u80FD\u4E0A\u4F20\u6559\u6750'
      )
    ),
    (0, import_react2.createElement)(
      "div",
      { style: { marginTop: "8px" } },
      (0, import_react2.createElement)(
        "label",
        { style: { ...S.label, marginTop: "0" } },
        "\u5B66\u4E60\u8005\u7684\u80CC\u666F\uFF08\u9009\u586B\uFF0C\u8BA9\u5EFA\u8BAE\u66F4\u8D34\u5207\uFF09"
      ),
      (0, import_react2.createElement)(
        "div",
        { style: { display: "flex", gap: "6px" } },
        (0, import_react2.createElement)("input", {
          style: { ...S.input, margin: "4px 0 6px", flex: 1 },
          placeholder: "\u6BD4\u5982\uFF1A\u4E09\u5E74\u7EA7\uFF0C\u60F3\u8865\u53E4\u8BD7\u80CC\u8BF5\u548C\u4F5C\u6587",
          value: hint,
          onChange: (e) => setHint(e.target.value)
        }),
        (0, import_react2.createElement)(
          "button",
          {
            style: { ...S.bigBtn(true), padding: "6px 14px", marginTop: "4px" },
            onClick: requestSuggest,
            disabled: suggestLoading
          },
          "\u2728 AI \u5EFA\u8BAE"
        )
      )
    ),
    suggestions.length > 0 ? (0, import_react2.createElement)(
      "div",
      { style: { marginTop: "4px" } },
      (0, import_react2.createElement)(
        "p",
        { style: { margin: "0 0 4px", fontSize: "12px", opacity: 0.7 } },
        "\u70B9\u4E00\u4E2A AI \u5EFA\u8BAE\u81EA\u52A8\u586B\u597D\uFF08\u53EF\u518D\u6539\uFF09",
        (0, import_react2.createElement)(
          "button",
          {
            style: { ...S.smallLink, marginLeft: "10px" },
            onClick: requestSuggest,
            disabled: suggestLoading
          },
          "\u6362\u4E00\u6279"
        )
      ),
      suggestions.map(
        (suggestion, index) => (0, import_react2.createElement)(
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
    ) : suggestLoading ? (0, import_react2.createElement)(
      "p",
      { style: { margin: "8px 0", fontSize: "12px", opacity: 0.7 } },
      "\u{1F4A1} AI \u6B63\u5728\u60F3\u5EFA\u8BAE\u2026\u2026"
    ) : null,
    (0, import_react2.createElement)("label", { style: S.label }, "\u4E66\u540D"),
    (0, import_react2.createElement)("input", {
      style: S.input,
      placeholder: "\u6BD4\u5982\uFF1A\u521D\u4E2D\u6570\u5B66\xB7\u6709\u7406\u6570",
      value: name,
      onChange: (e) => setName(e.target.value)
    }),
    (0, import_react2.createElement)("label", { style: S.label }, "\u8FD9\u672C\u4E66\u5B66\u5B8C\uFF0C\u8981\u80FD\u505A\u5230\u4EC0\u4E48\uFF1F"),
    (0, import_react2.createElement)("textarea", {
      style: S.textarea,
      placeholder: "\u6BD4\u5982\uFF1A\u80FD\u72EC\u7ACB\u505A\u5BF9\u6559\u6750\u914D\u5957\u7684\u57FA\u7840\u9898\uFF0C\u5E76\u8BF4\u51FA\u6BCF\u4E2A\u6982\u5FF5\u662F\u4EC0\u4E48\u3001\u4E3A\u4EC0\u4E48\u3001\u600E\u4E48\u7528",
      value: goal,
      onChange: (e) => setGoal(e.target.value)
    }),
    (0, import_react2.createElement)("label", { style: S.label }, "\u7ED9\u8C01\u7528\uFF1F"),
    (0, import_react2.createElement)(
      "label",
      { style: S.checkItem },
      (0, import_react2.createElement)("input", {
        type: "radio",
        name: "route",
        checked: route === "blueprint",
        onChange: () => setRoute("blueprint")
      }),
      " \u7ED9 AI \u8001\u5E08\u4E0A\u8BFE\u7528\uFF08\u63A8\u8350\uFF0C\u6559\u5B66\u7CBE\u5EA6\u6700\u9AD8\uFF09"
    ),
    (0, import_react2.createElement)(
      "label",
      { style: S.checkItem },
      (0, import_react2.createElement)("input", {
        type: "radio",
        name: "route",
        checked: route === "human",
        onChange: () => setRoute("human")
      }),
      " \u7ED9\u4EBA\u76F4\u63A5\u8BFB\u7684\u6559\u6750\uFF08AI \u4E5F\u80FD\u62FF\u5B83\u6559\uFF09"
    ),
    (0, import_react2.createElement)(
      "label",
      { style: S.checkItem },
      (0, import_react2.createElement)("input", {
        type: "checkbox",
        checked: science,
        onChange: (e) => setScience(e.target.checked)
      }),
      " \u7406\u79D1\u5185\u5BB9\uFF08\u516C\u5F0F\u8F83\u591A\uFF0C\u8F6C\u6362\u65F6\u5F00\u542F\u516C\u5F0F\u8BC6\u522B\uFF09"
    ),
    (0, import_react2.createElement)(
      "label",
      { style: S.checkItem },
      (0, import_react2.createElement)("input", {
        type: "checkbox",
        checked: agree,
        onChange: (e) => setAgree(e.target.checked)
      }),
      " \u6211\u786E\u8BA4\uFF1A\u53EA\u4E0A\u4F20\u6211\u6709\u6743\u4F7F\u7528\u7684\u6750\u6599\uFF1B\u9020\u51FA\u6765\u7684\u662F\u6559\u5B66\u53C2\u8003\uFF0CAI \u53EF\u80FD\u8BB2\u9519\uFF0C\u4F7F\u7528\u524D\u6211\u4F1A\u8BF7\u8001\u5E08/\u5BB6\u957F\u590D\u6838"
    ),
    error !== null ? (0, import_react2.createElement)("p", { style: S.error }, error) : null,
    (0, import_react2.createElement)(
      "div",
      { style: { marginTop: "8px" } },
      (0, import_react2.createElement)(
        "button",
        { style: S.bigBtn(true), onClick: submit, disabled: busy },
        "\u521B\u5EFA\u8FD9\u672C\u4E66"
      )
    ),
    (0, import_react2.createElement)(
      "p",
      { style: { margin: "10px 0 0", fontSize: "12px", opacity: 0.75 } },
      "\u8FD8\u4E0D\u786E\u5B9A\u8FD9\u5957\u6D41\u7A0B\u9002\u4E0D\u9002\u5408\u4F60\uFF1F",
      (0, import_react2.createElement)(
        "button",
        {
          style: { ...S.smallLink, marginLeft: "6px" },
          disabled: busy,
          onClick: () => onCreateDemo()
        },
        "\u5148\u5EFA\u4E00\u672C\u6F14\u793A\u4E66\u8BD5\u8BD5\uFF08\u4E0D\u82B1\u6A21\u578B\u989D\u5EA6\uFF0C2 \u5206\u949F\u8D70\u5B8C\u5168\u7A0B\uFF09"
      )
    ),
    (0, import_react2.createElement)(
      "div",
      {
        style: {
          marginTop: "12px",
          padding: "8px 10px",
          fontSize: "12px",
          lineHeight: 1.6,
          opacity: 0.75,
          border: "1px solid var(--dsw-border, #d0d7de)",
          borderRadius: "8px",
          background: "var(--dsw-surface, #fff)"
        }
      },
      (0, import_react2.createElement)(
        "p",
        { style: { margin: "0 0 4px" } },
        "\u672C\u9879\u76EE\u662F",
        (0, import_react2.createElement)(
          "a",
          {
            href: "https://www.socratopia.app/r/SCR-FEJXMQ",
            target: "_blank",
            rel: "noopener noreferrer",
            style: {
              color: "var(--dsw-accent, #4f6ef7)",
              textDecoration: "underline"
            }
          },
          "\u3010\u7834\u5377\u3011"
        ),
        "\u7684\u884D\u751F\u9879\u76EE\uFF0C\u{1F4A1} \u5982\u679C\u672C\u9879\u76EE\u5BF9\u4F60\u6709\u5E2E\u52A9\uFF0C\u6B22\u8FCE\u586B\u5199\u9080\u8BF7\u7801\uFF1ASCR-FEJXMQ\uFF0C\u53EF\u514D\u8D39\u9886\u53D6 100 \u4E07 tokens\uFF0C\u5168\u573A\u5B98\u65B9\u9020\u4E66\u514D\u8D39\u5B66\u4E60\u3002"
      ),
      (0, import_react2.createElement)(
        "p",
        { style: { margin: "0" } },
        "\u628A\u9020\u597D\u7684\u4E66\u4EA4\u7ED9",
        (0, import_react2.createElement)(
          "a",
          {
            href: "https://www.socratopia.app/r/SCR-FEJXMQ",
            target: "_blank",
            rel: "noopener noreferrer",
            style: {
              color: "var(--dsw-accent, #4f6ef7)",
              textDecoration: "underline"
            }
          },
          "\u3010\u7834\u5377\u3011"
        ),
        "\uFF0C\u5373\u53EF\u4EAB\u53D73A\u6E38\u620F\u7684\u6C89\u6D78\u611F\u4EE5\u53CA\u4E09\u500D\u4EE5\u4E0A\u7684\u5B66\u4E60\u6548\u7387\u3002"
      )
    )
  );
}
function UploadArea(props) {
  const { sources, converting, onUpload, onConvert, onIdentify, busy } = props;
  const [pending, setPending] = (0, import_react2.useState)([]);
  const [identifying, setIdentifying] = (0, import_react2.useState)(false);
  const [uploading, setUploading] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)(null);
  const dirtyRef = (0, import_react2.useRef)({});
  const pick = (e) => {
    setError(null);
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    const seen = /* @__PURE__ */ new Set();
    const next = pending.filter(
      (item) => !files.some((f) => f.name === item.name)
    );
    files.forEach((file) => {
      if (seen.has(file.name)) return;
      seen.add(file.name);
      next.push({ name: file.name, file, role: guessRoleFromName(file.name) });
    });
    setPending(next);
    if (next.length > 0) void identify(next);
  };
  const setRole = (name, role) => {
    dirtyRef.current[name] = true;
    setPending(
      (prev) => prev.map((item) => item.name === name ? { ...item, role } : item)
    );
  };
  const identify = async (list) => {
    setIdentifying(true);
    try {
      const roles = await onIdentify(list.map((item) => item.name));
      const byName = new Map(roles.map((r) => [r.file, r.role]));
      setPending(
        (prev) => prev.map(
          (item) => byName.has(item.name) && !dirtyRef.current[item.name] ? { ...item, role: byName.get(item.name) } : item
        )
      );
    } catch {
    } finally {
      setIdentifying(false);
    }
  };
  const uploadAll = async () => {
    if (pending.length === 0) {
      setError("\u8BF7\u5148\u9009\u62E9 PDF \u6587\u4EF6");
      return;
    }
    setUploading(true);
    setError(null);
    const failed = [];
    for (const item of pending) {
      if (item.file.size > MAX_UPLOAD_BYTES) {
        failed.push({
          item,
          message: uploadTooLargeMessage(),
          retryable: false
        });
        continue;
      }
      try {
        await onUpload(item.file, item.role);
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
      dirtyRef.current = {};
    } else {
      const failedNames = new Set(failed.map((f) => f.item.name));
      setPending((prev) => prev.filter((i) => failedNames.has(i.name)));
      const first = failed[0];
      const retryHint = first.retryable === false ? "" : "\uFF1B\u91CD\u8BD5\u53EA\u4F1A\u91CD\u4F20\u8FD9\u4E00\u672C";
      const anyRetryable = failed.some((f) => f.retryable !== false);
      setError(
        failed.length === 1 ? `\u4E0A\u4F20\u5931\u8D25\uFF1A${first.item.name}\uFF08${first.message}${retryHint}\uFF09` : `\u6709 ${failed.length} \u672C\u4E0A\u4F20\u5931\u8D25\uFF08\u5982 ${first.message}\uFF09${anyRetryable ? "\uFF0C\u5C06\u4EC5\u91CD\u8BD5\u5931\u8D25\u9879" : ""}`
      );
    }
    setUploading(false);
  };
  return (0, import_react2.createElement)(
    "div",
    { style: S.focus },
    (0, import_react2.createElement)(
      "strong",
      { style: { fontSize: "14px" } },
      "\u2460 \u4E0A\u4F20\u6559\u6750 PDF\uFF08\u53EF\u4E00\u6B21\u9009\u591A\u672C\uFF09"
    ),
    (0, import_react2.createElement)(
      "p",
      { style: { margin: "4px 0 8px", fontSize: "12px", opacity: 0.7 } },
      "\u4E66\u6587\u4EF6\u5939\u5EFA\u5728\u5F53\u524D\u5DE5\u4F5C\u533A\u76EE\u5F55\u91CC\uFF08\u6587\u4EF6\u5939\u540D\uFF1D\u4E66\u540D\uFF0C\u89C1\u4E0A\u65B9 \u{1F4C1} \u8DEF\u5F84\uFF09\uFF0C\u4E0A\u4F20\u7684 PDF \u90FD\u4FDD\u5B58\u5728\u91CC\u9762\u3002\u6BCF\u672C\u662F\u4EC0\u4E48\u89D2\u8272\u7531 AI \u81EA\u52A8\u8BC6\u522B\uFF0C\u4F60\u53EA\u9700\u8981\u786E\u8BA4\u3002"
    ),
    (0, import_react2.createElement)("label", { style: S.label }, "\u9009\u62E9 PDF\uFF08\u53EF\u591A\u9009\uFF09"),
    (0, import_react2.createElement)("input", {
      type: "file",
      accept: ".pdf",
      multiple: true,
      style: S.input,
      onChange: pick
    }),
    pending.length > 0 ? (0, import_react2.createElement)(
      "div",
      { style: { marginTop: "8px" } },
      (0, import_react2.createElement)(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "4px"
          }
        },
        (0, import_react2.createElement)(
          "span",
          { style: { fontSize: "12px", fontWeight: 600 } },
          `\u5F85\u4E0A\u4F20 ${pending.length} \u672C\uFF1A`
        ),
        identifying ? (0, import_react2.createElement)(
          "span",
          { style: { fontSize: "12px", opacity: 0.7 } },
          "\u2728 AI \u8BC6\u522B\u89D2\u8272\u4E2D\u2026"
        ) : (0, import_react2.createElement)(
          "span",
          { style: { fontSize: "12px", opacity: 0.7 } },
          "\u2705 \u5DF2\u81EA\u52A8\u8BC6\u522B\uFF0C\u53EF\u4E0B\u62C9\u4FEE\u6539"
        )
      ),
      pending.map(
        (item) => (0, import_react2.createElement)(
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
          (0, import_react2.createElement)(
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
          ),
          (0, import_react2.createElement)(
            "select",
            {
              style: {
                ...S.input,
                width: "108px",
                margin: "0",
                padding: "4px 6px"
              },
              value: item.role,
              onChange: (e) => setRole(item.name, e.target.value)
            },
            ROLES.map(
              (role) => (0, import_react2.createElement)("option", { key: role, value: role }, role)
            )
          )
        )
      )
    ) : null,
    error !== null ? (0, import_react2.createElement)("p", { style: S.error }, error) : null,
    (0, import_react2.createElement)(
      "div",
      {
        style: {
          marginTop: "8px",
          display: "flex",
          gap: "8px",
          alignItems: "center"
        }
      },
      (0, import_react2.createElement)(
        "button",
        {
          style: { ...S.bigBtn(true), padding: "8px 14px" },
          onClick: uploadAll,
          disabled: busy || uploading || pending.length === 0
        },
        pending.length > 0 ? `\u4E0A\u4F20\u8FD9 ${pending.length} \u672C` : "\u4E0A\u4F20"
      )
    ),
    sources.length > 0 ? (0, import_react2.createElement)(
      "div",
      { style: { marginTop: "8px", fontSize: "12px", opacity: 0.85 } },
      (0, import_react2.createElement)(
        "div",
        { style: { margin: "0 0 4px" } },
        `\u5DF2\u4E0A\u4F20 ${sources.length} \u672C\uFF1A`
      ),
      sources.map(
        (source) => (0, import_react2.createElement)(
          "div",
          {
            key: source.file,
            style: { wordBreak: "break-all", margin: "2px 0" }
          },
          `${source.converted === true ? "\u2705" : "\u23F3"} ${source.file}`
        )
      )
    ) : null,
    sources.length > 0 ? (0, import_react2.createElement)(
      "div",
      { style: { marginTop: "10px" } },
      (0, import_react2.createElement)(
        "button",
        {
          style: S.bigBtn(true),
          onClick: onConvert,
          disabled: busy || converting
        },
        "\u2461 \u5F00\u59CB\u8F6C\u6362\uFF08\u673A\u5668\u81EA\u52A8\u8DD1\uFF09"
      ),
      converting ? (0, import_react2.createElement)(
        "span",
        { style: { marginLeft: "8px", fontSize: "12px" } },
        "\u8F6C\u6362\u4E2D\u2026\u2026"
      ) : null
    ) : null
  );
}
function StatusCard(props) {
  const {
    meta,
    lastEvent,
    events,
    needsConfig,
    onResume,
    busy,
    pendingStageLabel,
    progressDetail,
    aiActive,
    onDeleteStart,
    onDeleteConfirm,
    deletingId
  } = props;
  const [, tick] = (0, import_react2.useState)(0);
  (0, import_react2.useEffect)(() => {
    const timer = setInterval(() => tick((n) => n + 1), 1e3);
    return () => clearInterval(timer);
  }, []);
  if (meta.status === "error") {
    const rawError = lastEvent?.data?.message ?? "\u672A\u77E5\u9519\u8BEF";
    const humanError = typeof meta?.lastErrorHuman === "string" && meta.lastErrorHuman !== "" ? meta.lastErrorHuman : rawError;
    const isTokenIssue = humanError.includes("Token") || humanError.includes("token");
    return (0, import_react2.createElement)(
      "div",
      { style: { ...S.focus, borderColor: "var(--dsw-danger, #cf222e)" } },
      (0, import_react2.createElement)(
        "strong",
        { style: { color: "var(--dsw-danger, #cf222e)" } },
        "\u26A0\uFE0F \u8FD9\u4E00\u6B65\u51FA\u9519\u4E86"
      ),
      (0, import_react2.createElement)("p", { style: { margin: "6px 0" } }, humanError),
      (0, import_react2.createElement)(
        "p",
        { style: { margin: "6px 0 0", fontSize: "13px", opacity: 0.9 } },
        "\u4F60\u53EF\u4EE5\uFF1A\u628A PDF \u62C6\u6210\u51E0\u4EFD\uFF08\u6BCF\u4EFD <200 \u9875\uFF09\u540E\u5206\u522B\u4E0A\u4F20\uFF0C\u6216\u6362\u4E00\u672C\u66F4\u8584\u7684\u4E66\uFF0C\u6216\u5220\u6389\u8FD9\u672C\u4E66\u91CD\u65B0\u5F00\u59CB\u3002"
      ),
      isTokenIssue ? (0, import_react2.createElement)(
        "p",
        { style: { margin: "4px 0 0", fontSize: "13px", opacity: 0.9 } },
        "\u{1F4A1} MinerU Token \u53EF\u80FD\u5931\u6548\uFF0C\u53EF\u5230\u5DE5\u4F5C\u53F0\u300CMinerU Token\u300D\u5904\u70B9\u300C\u91CD\u65B0\u8BBE\u7F6E\u300D\u6362\u65B0 Token\u3002"
      ) : null,
      (0, import_react2.createElement)(
        "button",
        { style: S.bigBtn(true), onClick: onResume, disabled: busy },
        "\u25B6\uFE0F \u8BA9 AI \u63A5\u7740\u5E72"
      ),
      // F28（2026-08-20 走查）：上传错了给「删书重来」入口——两步确认（第一态→确认态），
      // 确认按钮只受 busy 置灰；删除后回向导可马上建一本新书。仅在父级传入删除回调时显示。
      typeof onDeleteStart === "function" ? (0, import_react2.createElement)(
        "div",
        {
          style: {
            marginTop: "8px",
            paddingTop: "8px",
            borderTop: "1px dashed var(--dsw-border, #d0d7de)"
          }
        },
        (0, import_react2.createElement)(
          "p",
          { style: { margin: "0 0 6px", fontSize: "13px", opacity: 0.9 } },
          "\u4E0A\u4F20\u9519\u4E86\uFF1F\u53EF\u4EE5\u5220\u6389\u8FD9\u672C\u4E66\u91CD\u65B0\u5EFA\u4E00\u672C\uFF08\u65E7\u4E66\u8FDB\u56DE\u6536\u7AD9\uFF09\uFF0C\u56DE\u5230\u5411\u5BFC\u9A6C\u4E0A\u5C31\u80FD\u5F00\u59CB\u65B0\u4E66\u3002"
        ),
        deletingId === true ? (0, import_react2.createElement)(
          "button",
          {
            style: {
              ...S.smallLink,
              color: "var(--dsw-danger, #cf222e)"
            },
            onClick: onDeleteConfirm,
            disabled: busy
          },
          "\u786E\u8BA4\u5220\u9664\u8FD9\u672C\u4E66\uFF08\u8FDB\u56DE\u6536\u7AD9\uFF09"
        ) : (0, import_react2.createElement)(
          "button",
          {
            style: {
              ...S.smallLink,
              color: "var(--dsw-danger, #cf222e)"
            },
            onClick: onDeleteStart
          },
          "\u{1F5D1} \u5220\u9664\u8FD9\u672C\u4E66\u91CD\u65B0\u5EFA"
        )
      ) : null
    );
  }
  if (meta.status === "needs-config") {
    return (0, import_react2.createElement)(
      "div",
      { style: { ...S.focus, borderColor: "var(--dsw-danger, #cf222e)" } },
      (0, import_react2.createElement)(
        "strong",
        { style: { color: "var(--dsw-danger, #cf222e)" } },
        "\u{1F511} \u9700\u8981\u5148\u914D\u7F6E"
      ),
      (0, import_react2.createElement)("p", { style: { margin: "6px 0" } }, needsConfig),
      (0, import_react2.createElement)(
        "button",
        { style: S.bigBtn(true), onClick: onResume, disabled: busy },
        "\u6211\u914D\u597D\u4E86\uFF0C\u7EE7\u7EED"
      )
    );
  }
  let label = "";
  let extra = "";
  if (typeof pendingStageLabel === "string" && pendingStageLabel !== "") {
    label = `AI \u5E72\u6D3B\u4E2D \xB7 ${pendingStageLabel}`;
    extra = typeof progressDetail === "string" ? progressDetail : "";
  } else if (lastEvent?.type === "textbook/agent-start" || lastEvent?.type === "textbook/mineru-progress") {
    const data = lastEvent.data ?? {};
    if (data.label !== void 0 && data.label !== null && data.label !== "")
      label = data.label;
    else if (data.stage !== void 0 && data.stage !== null && data.stage !== "") {
      label = data.file !== void 0 && data.file !== null && data.file !== "" ? `${data.file}\uFF1A${data.stage}` : data.stage;
    }
  }
  const phase = meta.phase ?? 1;
  const phaseDesc = {
    2: "\u6E90\u63A2\u67E5\uFF1AAI \u6B63\u5728\u901A\u8BFB\u4F60\u7684\u6559\u6750\uFF08\u6750\u6599\u591A\u65F6\u4F1A\u6D3E\u5C0F\u52A9\u624B\u5206\u5934\u8BFB\uFF09\uFF0C\u6574\u7406\u6210\u6E90\u6750\u6599\u7D22\u5F15",
    3: "\u6559\u5B66\u8BBE\u8BA1\uFF1A\u4E3B AI \u6B63\u5728\u8D77\u8349\u8BBE\u8BA1\u5173\u5361\u65B9\u6848\uFF08\u5DF2\u901A\u8FC7\u8FC7\u7684\u4F1A\u81EA\u52A8\u8DF3\u8FC7\uFF09",
    4: "\u6700\u4F73\u8303\u4F8B\u7AE0\uFF1A\u4E3B AI \u6B63\u5728\u5199\u7B2C 1 \u7AE0\u7ED9\u4F60\u770B\u6548\u679C",
    5: "\u5168\u7AE0\u5199\u4F5C\uFF1A\u5C0F\u52A9\u624B\u6267\u7B14 + \u5C0F\u52A9\u624B\u81EA\u67E5 + \u4E3B AI \u7EC8\u5BA1\uFF0C\u9010\u7AE0\u63A8\u8FDB",
    6: "\u7EC8\u68C0\u4E0E\u4EA4\u4ED8\uFF1A\u4E3B AI \u4EB2\u81EA\u505A\u6700\u540E\u68C0\u67E5 + \u673A\u5668\u515C\u5E95"
  }[phase];
  let chapterProgress = null;
  if (phase === 5) {
    const total = (meta.outline?.chapters ?? []).length;
    if (total > 0) {
      const done = (events ?? []).filter(
        (e) => e.type === "textbook/agent-end" && typeof e.data?.label === "string" && e.data.label.includes("\u5B8C\u6210\uFF08\u5C0F\u52A9\u624B\u6267\u7B14")
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
  const idleMs = Math.max(0, Date.now() - lastTime);
  const fmt = (ms) => {
    const s = Math.floor(ms / 1e3);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const parts = [];
    if (h > 0) parts.push(`${h} \u5C0F\u65F6`);
    if (m % 60 > 0 || h > 0) parts.push(`${m % 60} \u5206`);
    parts.push(`${s % 60} \u79D2`);
    return parts.join(" ");
  };
  const stale = !aiActive && idleMs > 8 * 60 * 1e3;
  return (0, import_react2.createElement)(
    "div",
    { style: S.focus },
    (0, import_react2.createElement)(
      "strong",
      { style: { fontSize: "14px" } },
      `\u23F3 ${label || "\u51C6\u5907\u4E2D\u2026"}`
    ),
    extra !== "" ? (0, import_react2.createElement)(
      "p",
      { style: { margin: "6px 0 0", opacity: 0.9 } },
      `\u23F3 ${extra}`
    ) : null,
    phaseDesc !== void 0 ? (0, import_react2.createElement)(
      "p",
      { style: { margin: "6px 0 0", opacity: 0.85 } },
      `\u{1F4CC} ${phaseDesc}`
    ) : null,
    chapterProgress !== null ? (0, import_react2.createElement)(
      "div",
      { style: { marginTop: "10px" } },
      (0, import_react2.createElement)(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
            marginBottom: "4px"
          }
        },
        (0, import_react2.createElement)("span", { style: { opacity: 0.8 } }, "\u7AE0\u8282\u5199\u4F5C\u8FDB\u5EA6"),
        (0, import_react2.createElement)(
          "span",
          { style: { opacity: 0.8 } },
          `\u5DF2\u5B8C\u6210 ${chapterProgress.done}/${chapterProgress.total} \u7AE0`
        )
      ),
      (0, import_react2.createElement)(
        "div",
        {
          style: {
            height: "8px",
            borderRadius: "4px",
            background: "var(--dsw-border, #d0d7de)",
            overflow: "hidden"
          }
        },
        (0, import_react2.createElement)("div", {
          style: {
            height: "100%",
            width: `${Math.round(chapterProgress.done / chapterProgress.total * 100)}%`,
            background: "var(--dsw-accent, #4f6ef7)",
            borderRadius: "4px",
            transition: "width 0.6s"
          }
        })
      )
    ) : null,
    stale ? (0, import_react2.createElement)(
      "div",
      {
        style: {
          marginTop: "8px",
          padding: "8px 10px",
          border: "1px solid #d4a72c",
          borderRadius: "8px",
          background: "var(--dsw-warn-soft, #fff8e1)"
        }
      },
      (0, import_react2.createElement)(
        "span",
        { style: { fontSize: "13px" } },
        `\u26A0\uFE0F \u5DF2\u7ECF ${fmt(idleMs)} \u6CA1\u6709\u65B0\u52A8\u9759\u4E86\uFF0C\u53EF\u80FD\u5361\u4F4F\u4E86\u3002\u5230\u5BF9\u8BDD\u9875\u786E\u8BA4\u4E00\u4E0B\uFF1A\u5982\u679C\u771F\u5361\u4F4F\u4E86\uFF0C\u5728\u5BF9\u8BDD\u91CC\u53D1\u4E00\u53E5\u300C\u7EE7\u7EED\u300D\uFF0C\u6216\u70B9\u53F3\u8FB9\u8BA9 AI \u63A5\u7740\u5E72\uFF08\u5B83\u53EA\u4F1A\u4ECE\u65AD\u70B9\u7EE7\u7EED\uFF0C\u4E0D\u4F1A\u91CD\u505A\u5DF2\u5B8C\u6210\u7684\u90E8\u5206\uFF09\u3002`
      ),
      (0, import_react2.createElement)(
        "button",
        {
          style: {
            ...S.bigBtn(true),
            marginLeft: "8px",
            padding: "4px 12px"
          },
          onClick: onResume,
          disabled: busy
        },
        "\u{1F501} \u8BA9 AI \u63A5\u7740\u5E72"
      )
    ) : (0, import_react2.createElement)(
      "p",
      {
        style: {
          margin: "6px 0 0",
          fontSize: "12px",
          opacity: aiActive ? 0.85 : 0.7
        }
      },
      aiActive ? `\u{1F916} AI \u6B63\u5728\u5E72\u6D3B \xB7 \u8FD9\u4E00\u6B65\u5DF2\u8FDB\u884C ${fmt(stepElapsedMs)}` : `\u23F1 \u8FD9\u4E00\u6B65\u5DF2\u8FDB\u884C ${fmt(stepElapsedMs)}`
    ),
    (0, import_react2.createElement)(
      "p",
      { style: { margin: "6px 0 0", opacity: 0.8 } },
      "AI \u6B63\u5728\u63A8\u8FDB\u8FD9\u4E00\u6B65\uFF08\u53EF\u80FD\u4EB2\u81EA\u505A\uFF0C\u4E5F\u53EF\u80FD\u6D3E\u4E00\u6279\u5C0F\u52A9\u624B\u5728\u540E\u53F0\u5E76\u884C\u5E72\uFF0C\u4E0D\u4E00\u5B9A\u4F1A\u9010\u6761\u5237\u5230\u4E0B\u65B9\u5BF9\u8BDD\u53F0\u91CC\uFF09\uFF1B\u8F6E\u5230\u4F60\u9700\u8981\u62CD\u677F/\u786E\u8BA4\u65F6\u4F1A\u4EAE\u8D77 \u26A1\uFF0C\u968F\u65F6\u53EF\u4EE5\u5728\u5BF9\u8BDD\u91CC\u95EE\u5B83\u3002"
    )
  );
}
function DeliveryCard(props) {
  const {
    project,
    session,
    checks,
    onPreview,
    preview,
    busy,
    meta,
    aiReport,
    styleNotes
  } = props;
  const bookName = (meta?.name ?? "").trim() || "BOOK";
  const [copied, setCopied] = (0, import_react2.useState)(false);
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
  return (0, import_react2.createElement)(
    "div",
    { style: S.focus },
    (0, import_react2.createElement)("strong", { style: { fontSize: "14px" } }, "\u{1F389} \u4E66\u505A\u597D\u4E86\uFF01"),
    aiReport !== null && aiReport !== void 0 && aiReport !== "" ? (0, import_react2.createElement)(
      "div",
      {
        style: {
          margin: "10px 0",
          padding: "8px 10px",
          background: "var(--dsw-accent-soft, #eef2ff)",
          borderRadius: "8px",
          fontSize: "12px"
        }
      },
      (0, import_react2.createElement)("strong", null, "\u{1F916} AI \u81EA\u67E5\u8BF4\u7684\uFF1A"),
      (0, import_react2.createElement)(
        "p",
        { style: { margin: "4px 0 0", whiteSpace: "pre-wrap" } },
        aiReport
      )
    ) : null,
    (0, import_react2.createElement)(
      "div",
      { style: { margin: "10px 0" } },
      (checks ?? []).map(
        (check) => (0, import_react2.createElement)(
          "div",
          { key: check.name, style: { margin: "4px 0" } },
          (0, import_react2.createElement)("span", null, check.ok === true ? "\u2705" : "\u274C"),
          ` ${check.name}`,
          (0, import_react2.createElement)(
            "span",
            { style: { opacity: 0.7, marginLeft: "6px", fontSize: "12px" } },
            check.note ?? ""
          )
        )
      )
    ),
    (styleNotes ?? []).length > 0 ? (0, import_react2.createElement)(
      "div",
      {
        style: {
          margin: "10px 0",
          padding: "8px 10px",
          borderRadius: "8px",
          border: "1px solid var(--dsw-border, #d0d7de)"
        }
      },
      (0, import_react2.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontWeight: 600 } },
        "\u{1F3A8} \u4F60\u7684\u98CE\u683C\u7EBF\u6761\u6761\u6709\u7740\u843D"
      ),
      ...(styleNotes ?? []).map(
        (note, index) => (0, import_react2.createElement)(
          "div",
          {
            key: note.id ?? index,
            style: { fontSize: "12px", margin: "3px 0" }
          },
          `${note.status === "superseded" ? "\xB7\uFF08\u5DF2\u6536\u56DE\uFF09" : note.status === "conflict" ? "\xB7\uFF08\u4E0E\u8BBE\u8BA1\u51B2\u7A81\uFF0C\u7406\u7531\u89C1\u5907\u6CE8\uFF09" : "\xB7"}${note.text}`,
          note.note ? (0, import_react2.createElement)(
            "span",
            { style: { opacity: 0.6 } },
            ` -- ${note.note}`
          ) : null
        )
      )
    ) : null,
    (0, import_react2.createElement)(
      "p",
      { style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
      "AI \u4EB2\u624B\u505A\u5B8C\u6700\u540E\u68C0\u67E5\uFF0C\u673A\u5668\u4E5F\u515C\u5E95\u9A8C\u8FC7\uFF1B\u4F60\u4ECD\u5EFA\u8BAE\u5148\u8BA9\u8001\u5E08/\u5BB6\u957F\u590D\u6838\u4E00\u904D\u518D\u7528\u3002"
    ),
    (0, import_react2.createElement)(
      "div",
      { style: { display: "flex", gap: "10px", margin: "10px 0" } },
      (0, import_react2.createElement)(
        "button",
        { style: S.bigBtn(true), onClick: onPreview, disabled: busy },
        preview === null ? "\u{1F440} \u9884\u89C8\u6210\u54C1" : "\u6536\u8D77\u9884\u89C8"
      ),
      (0, import_react2.createElement)(
        "a",
        {
          style: {
            ...S.bigBtn(true),
            textDecoration: "none",
            display: "inline-block"
          },
          href: `/textbook/download?session=${encodeURIComponent(session)}&project=${encodeURIComponent(project)}&path=work/book.md`
        },
        `\u2B07\uFE0F \u4E0B\u8F7D\u300A${bookName}\u300B.md`
      )
    ),
    preview !== null ? (0, import_react2.createElement)(
      "pre",
      {
        style: {
          whiteSpace: "pre-wrap",
          background: "var(--dsw-surface, #fff)",
          borderRadius: "8px",
          padding: "10px",
          maxHeight: "300px",
          overflow: "auto",
          fontSize: "12px"
        }
      },
      preview
    ) : null,
    (0, import_react2.createElement)(
      "div",
      { style: { margin: "8px 0 0", opacity: 0.8 } },
      (0, import_react2.createElement)(
        "p",
        { style: { margin: "0 0 4px", fontWeight: 600 } },
        "\u{1F4A1} \u8FD9\u672C\u4E66\u600E\u4E48\u7528"
      ),
      (0, import_react2.createElement)(
        "div",
        { style: { display: "flex", margin: "0 0 4px" } },
        (0, import_react2.createElement)(
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
          (0, import_react2.createElement)("span", null, "\u7ED9 AI \u8001\u5E08\u4E0A\u8BFE"),
          (0, import_react2.createElement)("span", null, "\u2192")
        ),
        (0, import_react2.createElement)(
          "span",
          { style: { minWidth: 0 } },
          `\u628A\u4E0B\u8F7D\u7684\u300A${bookName}\u300B.md \u4EA4\u7ED9`,
          (0, import_react2.createElement)(
            "a",
            {
              href: "https://www.socratopia.app/r/SCR-FEJXMQ",
              target: "_blank",
              rel: "noopener noreferrer",
              style: {
                color: "var(--dsw-accent, #4f6ef7)",
                textDecoration: "underline"
              }
            },
            "\u3010\u7834\u5377\u3011"
          ),
          "\u5F53\u6559\u6750\u6765\u5B66\u3002\u3010\u5EFA\u8BAE\u3011"
        )
      ),
      (0, import_react2.createElement)(
        "div",
        { style: { display: "flex", margin: "0 0 4px" } },
        (0, import_react2.createElement)(
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
          (0, import_react2.createElement)("span", null, "\u7ED9\u4EBA\u8BFB"),
          (0, import_react2.createElement)("span", null, "\u2192")
        ),
        (0, import_react2.createElement)(
          "span",
          { style: { minWidth: 0 } },
          "\u76F4\u63A5\u9605\u8BFB\u6216\u6253\u5370\u3002\u5EFA\u8BAE\u5148\u590D\u6838\u4E00\u904D\u518D\u7528\u3002"
        )
      ),
      (0, import_react2.createElement)(
        "p",
        { style: { margin: "0" } },
        "\u5982\u679C\u672C\u9879\u76EE\u5BF9\u4F60\u6709\u5E2E\u52A9\uFF0C\u6B22\u8FCE\u586B\u5199\u9080\u8BF7\u7801\uFF1A",
        (0, import_react2.createElement)(
          "span",
          {
            onClick: (e) => copyInvite(e, "SCR-FEJXMQ"),
            title: copied ? "\u5DF2\u590D\u5236" : "\u70B9\u51FB\u590D\u5236\u9080\u8BF7\u7801",
            style: {
              background: "var(--dsw-accent-soft, #eef2ff)",
              borderRadius: "4px",
              padding: "1px 6px",
              letterSpacing: "0.5px",
              cursor: "pointer",
              userSelect: "all",
              color: "var(--dsw-accent, #4f6ef7)"
            }
          },
          copied ? "\u2713 \u5DF2\u590D\u5236" : "SCR-FEJXMQ"
        ),
        "\uFF0C\u53EF\u514D\u8D39\u9886\u53D6 100 \u4E07 tokens\uFF0C\u5B98\u65B9\u9020\u4E66\u5168\u573A\u514D\u8D39\u5B66\u3002"
      )
    )
  );
}
function FinalApprovalCard(props) {
  const {
    checks,
    onPreview,
    preview,
    busy,
    aiReport,
    styleNotes,
    onApprove,
    onReject
  } = props;
  const [note, setNote] = (0, import_react2.useState)("");
  return (0, import_react2.createElement)(
    "div",
    { style: S.focus },
    (0, import_react2.createElement)("strong", { style: { fontSize: "14px" } }, "\u{1F6E1}\uFE0F \u7EC8\u68C0\u5B8C\u6210\uFF0C\u7B49\u4F60\u5BF9\u6574\u672C\u4E66\u628A\u5173"),
    aiReport !== null && aiReport !== void 0 && aiReport !== "" ? (0, import_react2.createElement)(
      "div",
      {
        style: {
          margin: "10px 0",
          padding: "8px 10px",
          background: "var(--dsw-accent-soft, #eef2ff)",
          borderRadius: "8px",
          fontSize: "12px"
        }
      },
      (0, import_react2.createElement)("strong", null, "\u{1F916} AI \u81EA\u67E5\u8BF4\u7684\uFF1A"),
      (0, import_react2.createElement)(
        "p",
        { style: { margin: "4px 0 0", whiteSpace: "pre-wrap" } },
        aiReport
      )
    ) : null,
    (0, import_react2.createElement)(
      "div",
      { style: { margin: "10px 0" } },
      (checks ?? []).map(
        (check) => (0, import_react2.createElement)(
          "div",
          { key: check.name, style: { margin: "4px 0" } },
          (0, import_react2.createElement)("span", null, check.ok === true ? "\u2705" : "\u274C"),
          ` ${check.name}`,
          (0, import_react2.createElement)(
            "span",
            { style: { opacity: 0.7, marginLeft: "6px", fontSize: "12px" } },
            check.note ?? ""
          )
        )
      )
    ),
    (styleNotes ?? []).length > 0 ? (0, import_react2.createElement)(
      "div",
      {
        style: {
          margin: "10px 0",
          padding: "8px 10px",
          borderRadius: "8px",
          border: "1px solid var(--dsw-border, #d0d7de)"
        }
      },
      (0, import_react2.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontWeight: 600 } },
        "\u{1F3A8} \u4F60\u7684\u98CE\u683C\u7EBF\u6761\u6761\u6709\u7740\u843D"
      ),
      ...(styleNotes ?? []).map(
        (note2, index) => (0, import_react2.createElement)(
          "div",
          {
            key: note2.id ?? index,
            style: { fontSize: "12px", margin: "3px 0" }
          },
          `${note2.status === "superseded" ? "\xB7\uFF08\u5DF2\u6536\u56DE\uFF09" : note2.status === "conflict" ? "\xB7\uFF08\u4E0E\u8BBE\u8BA1\u51B2\u7A81\uFF0C\u7406\u7531\u89C1\u5907\u6CE8\uFF09" : "\xB7"}${note2.text}`,
          note2.note ? (0, import_react2.createElement)(
            "span",
            { style: { opacity: 0.6 } },
            ` -- ${note2.note}`
          ) : null
        )
      )
    ) : null,
    (0, import_react2.createElement)(
      "p",
      { style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
      "\u8FD9\u662F\u4F60\u5BF9\u6574\u672C\u4E66\u7684\u6700\u540E\u4E00\u6B21\u628A\u5173\uFF1AAI \u5DF2\u6574\u4F53\u8C03\u6574\u8FC7\u3001\u673A\u5668\u4E5F\u515C\u5E95\u9A8C\u8FC7\u3002\u6EE1\u610F\u5C31\u8BA4\u53EF\u4EA4\u4ED8\uFF1B\u8981\u6539\u7684\u5199\u4E00\u53E5\u610F\u89C1\uFF0CAI \u4F1A\u7167\u7740\u6539\u6574\u672C\u540E\u91CD\u65B0\u7EC8\u68C0\u3002"
    ),
    (0, import_react2.createElement)(
      "textarea",
      {
        style: {
          width: "100%",
          minHeight: "64px",
          padding: "8px",
          borderRadius: "8px",
          border: "1px solid var(--dsw-border, #d0d7de)",
          fontSize: "13px",
          boxSizing: "border-box"
        },
        placeholder: "\u4E0D\u6EE1\u610F\u7684\u8BDD\uFF0C\u5728\u8FD9\u91CC\u5199\u4E00\u53E5\u6539\u8FDB\u610F\u89C1\uFF08\u53EF\u9009\uFF0C\u5199\u4E86\u624D\u4F1A\u8D70\u300C\u4E0D\u6EE1\u610F\u300D\u5206\u652F\uFF09\u2026",
        value: note,
        onChange: (e) => setNote(e.target.value)
      }
    ),
    (0, import_react2.createElement)(
      "div",
      { style: { display: "flex", gap: "10px", margin: "10px 0" } },
      (0, import_react2.createElement)(
        "button",
        { style: S.bigBtn(true), onClick: onPreview, disabled: busy },
        preview === null ? "\u{1F440} \u9884\u89C8\u6574\u672C\u4E66" : "\u6536\u8D77\u9884\u89C8"
      ),
      (0, import_react2.createElement)(
        "button",
        {
          style: { ...S.bigBtn(true), marginRight: "auto" },
          onClick: () => onReject(note),
          disabled: busy || note.trim() === "",
          title: "\u5199\u4E86\u6539\u8FDB\u610F\u89C1\u624D\u80FD\u8D70\u300C\u4E0D\u6EE1\u610F\u300D"
        },
        "\u274C \u4E0D\u6EE1\u610F\uFF0C\u8BA9 AI \u6539"
      ),
      (0, import_react2.createElement)(
        "button",
        { style: S.bigBtn(true), onClick: () => onApprove(), disabled: busy },
        "\u2705 \u8BA4\u53EF\uFF0C\u4EA4\u4ED8"
      )
    ),
    preview !== null ? (0, import_react2.createElement)(
      "pre",
      {
        style: {
          whiteSpace: "pre-wrap",
          background: "var(--dsw-surface, #fff)",
          borderRadius: "8px",
          padding: "10px",
          maxHeight: "300px",
          overflow: "auto",
          fontSize: "12px"
        }
      },
      preview
    ) : null
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
function GatePanel(props) {
  const { gate, onDecide, onRollback, busy, error, onAddPattern } = props;
  const [showDetail, setShowDetail] = (0, import_react2.useState)(true);
  const [showCompare, setShowCompare] = (0, import_react2.useState)(false);
  const [rejecting, setRejecting] = (0, import_react2.useState)(false);
  const [mode, setMode] = (0, import_react2.useState)("wrong");
  const [reasons, setReasons] = (0, import_react2.useState)([]);
  const [note, setNote] = (0, import_react2.useState)("");
  const [styleText, setStyleText] = (0, import_react2.useState)("");
  const [confirmRollback, setConfirmRollback] = (0, import_react2.useState)(false);
  const rollbackConfirm = () => (0, import_react2.createElement)(
    "div",
    {
      style: {
        marginTop: "10px",
        borderTop: "1px dashed var(--dsw-border, #d0d7de)",
        paddingTop: "8px"
      }
    },
    (0, import_react2.createElement)(
      "p",
      { style: { margin: "0 0 6px", fontWeight: 600 } },
      "\u23EA \u56DE\u9000\u5230\u4E0A\u4E00\u4E2A\u62CD\u677F\u70B9\uFF1F"
    ),
    (0, import_react2.createElement)(
      "p",
      {
        style: {
          margin: "0 0 6px",
          fontSize: "12px",
          color: "var(--dsw-danger, #cf222e)"
        }
      },
      "\u8FD9\u4E00\u6B65\u4E4B\u540E\u65B0\u63A8\u8FDB\u7684\u90E8\u5206\u4F1A\u88AB\u91CD\u505A\uFF0C\u4F46\u6BCF\u4E2A\u7248\u672C\u90FD\u7559\u6863\u3001\u4E4B\u540E\u8FD8\u80FD\u518D\u56DE\u9000\u3002"
    ),
    (0, import_react2.createElement)(
      "div",
      { style: { display: "flex", gap: "8px" } },
      (0, import_react2.createElement)(
        "button",
        {
          style: { ...S.bigBtn(false), padding: "6px 14px" },
          onClick: () => {
            setConfirmRollback(false);
            onRollback();
          },
          disabled: busy
        },
        "\u786E\u8BA4\u56DE\u9000"
      ),
      (0, import_react2.createElement)(
        "button",
        { style: S.smallLink, onClick: () => setConfirmRollback(false) },
        "\u53D6\u6D88"
      )
    )
  );
  if (gate === null) return null;
  if (gate.status !== "awaiting") {
    const decided = gate.status === "approved";
    return (0, import_react2.createElement)(
      "div",
      { style: S.focus },
      (0, import_react2.createElement)(
        "strong",
        null,
        decided ? `\u2705 \u7B2C ${gate.gate} \u5173\u5DF2\u901A\u8FC7\uFF08v${gate.version}\uFF09` : `\u21A9\uFE0F \u7B2C ${gate.gate} \u5173\u5DF2\u9A73\u56DE\uFF08v${gate.version}\uFF09\uFF0C\u7B49 AI \u4FEE\u8BA2`
      ),
      decided ? (0, import_react2.createElement)(
        "p",
        { style: { margin: "6px 0 0", opacity: 0.8 } },
        "\u4E4B\u540E\u968F\u65F6\u80FD\u6539\uFF1A\u53EF\u56DE\u9000\u5230\u4E0A\u4E00\u4E2A\u62CD\u677F\u70B9\uFF0C\u6216\u53BB\u5DE6\u4FA7\u8FC7\u7A0B\u5730\u56FE\u300C\u5B9A\u70B9\u4FEE\u6539\u300D\u8FD9\u4E00\u5173\u3002"
      ) : (0, import_react2.createElement)(
        "p",
        { style: { margin: "6px 0 0", opacity: 0.8 } },
        "AI \u6B63\u5728\u6309\u4F60\u7684\u610F\u89C1\u4FEE\u6539\uFF0C\u65B0\u7248\u63D0\u6848\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002"
      ),
      (0, import_react2.createElement)(
        "div",
        { style: { marginTop: "8px" } },
        (0, import_react2.createElement)(
          "button",
          {
            style: {
              ...S.projectBtn(false),
              color: "var(--dsw-danger, #cf222e)",
              borderColor: "var(--dsw-danger, #cf222e)"
            },
            onClick: () => setConfirmRollback(true),
            disabled: busy
          },
          "\u23EA \u56DE\u9000\u5230\u4E0A\u4E00\u4E2A\u62CD\u677F\u70B9"
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
  return (0, import_react2.createElement)(
    "div",
    { style: S.focus },
    (0, import_react2.createElement)(
      "div",
      null,
      (0, import_react2.createElement)(
        "strong",
        { style: { fontSize: "14px" } },
        `\u{1F6A6} \u8BF7\u4F60\u62CD\u677F \xB7 \u7B2C ${gate.gate} \u5173 \xB7 \u65B9\u6848 v${gate.version}`
      ),
      (0, import_react2.createElement)(
        "span",
        { style: { float: "right", opacity: 0.6, fontSize: "12px" } },
        "\u8FD9\u4E00\u5173\u4E0D\u8FC7\uFF0C\u6D41\u7A0B\u4E0D\u4F1A\u7EE7\u7EED"
      )
    ),
    (0, import_react2.createElement)("p", { style: { margin: "10px 0 6px" } }, gate.title),
    (0, import_react2.createElement)(
      "p",
      { style: { margin: "0 0 6px", opacity: 0.9, lineHeight: 1.6 } },
      gate.summary
    ),
    (0, import_react2.createElement)(
      "div",
      { style: { margin: "6px 0" } },
      (0, import_react2.createElement)(
        "button",
        { style: S.smallLink, onClick: () => setShowDetail(!showDetail) },
        showDetail ? "\u6536\u8D77\u5B8C\u6574\u65B9\u6848" : "\u5C55\u5F00\u5B8C\u6574\u65B9\u6848"
      ),
      gate.prevProposal !== null ? (0, import_react2.createElement)(
        "span",
        null,
        "\u3000",
        (0, import_react2.createElement)(
          "button",
          {
            style: S.smallLink,
            onClick: () => setShowCompare(!showCompare)
          },
          showCompare ? "\u6536\u8D77\u5BF9\u6BD4" : `\u5BF9\u6BD4\u4E0A\u4E00\u7248\uFF08v${gate.prevProposal.version}\uFF09`
        )
      ) : null
    ),
    showDetail && (gate.detail ?? "") !== "" ? (0, import_react2.createElement)(
      "pre",
      {
        style: {
          whiteSpace: "pre-wrap",
          background: "var(--dsw-surface, #fff)",
          borderRadius: "8px",
          padding: "10px",
          fontSize: "12px",
          opacity: 0.9,
          maxHeight: "260px",
          overflow: "auto"
        }
      },
      gate.detail
    ) : null,
    showCompare && gate.prevProposal !== null ? (0, import_react2.createElement)(
      "div",
      {
        style: {
          background: "var(--dsw-surface, #fff)",
          borderRadius: "8px",
          padding: "10px",
          fontSize: "12px",
          opacity: 0.9
        }
      },
      (0, import_react2.createElement)(
        "strong",
        null,
        `\u4E0A\u4E00\u7248 v${gate.prevProposal.version}\uFF1A`
      ),
      (0, import_react2.createElement)(
        "p",
        { style: { margin: "4px 0 0" } },
        gate.prevProposal.summary
      )
    ) : null,
    error !== null ? (0, import_react2.createElement)("p", { style: S.error }, error) : null,
    rejecting ? (0, import_react2.createElement)(
      "div",
      {
        style: {
          marginTop: "10px",
          borderTop: "1px dashed var(--dsw-border, #d0d7de)",
          paddingTop: "8px"
        }
      },
      (0, import_react2.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontWeight: 600 } },
        "\u9A73\u56DE\u539F\u56E0\uFF08\u9009\u4E00\u4E2A\uFF0C\u4E0D\u5FC5\u6253\u5B57\uFF09"
      ),
      (0, import_react2.createElement)(
        "div",
        { style: { margin: "8px 0" } },
        (0, import_react2.createElement)(
          "label",
          { style: { display: "block", margin: "4px 0" } },
          (0, import_react2.createElement)("input", {
            type: "radio",
            name: "mode",
            checked: mode === "wrong",
            onChange: () => setMode("wrong")
          }),
          " \u65B9\u6848\u4E0D\u5BF9 \u2014\u2014 AI \u91CD\u505A\u4E00\u7248"
        ),
        (0, import_react2.createElement)(
          "label",
          { style: { display: "block", margin: "4px 0" } },
          (0, import_react2.createElement)("input", {
            type: "radio",
            name: "mode",
            checked: mode === "confused",
            onChange: () => setMode("confused")
          }),
          " \u6211\u770B\u4E0D\u61C2 / \u4E0D\u662F\u6211\u8981\u7684 \u2014\u2014 AI \u6362\u4EBA\u8BDD\u91CD\u8BB2\u3001\u7ED9\u4F8B\u5B50"
        )
      ),
      (0, import_react2.createElement)(
        "p",
        { style: { margin: "6px 0 4px", fontWeight: 600 } },
        "\u5177\u4F53\u54EA\u91CC\u4E0D\u6EE1\u610F\uFF08\u53EF\u591A\u9009\uFF09"
      ),
      REASONS.map(
        (reason) => (0, import_react2.createElement)(
          "label",
          { key: reason, style: S.checkItem },
          (0, import_react2.createElement)("input", {
            type: "checkbox",
            checked: reasons.includes(reason),
            onChange: () => toggleReason(reason)
          }),
          ` ${reason}`
        )
      ),
      // 2026-08-21：勾选「换个风格」→ 弹出粘贴窗口，目标文本由 AI 分析成这本书的自定义模式。
      reasons.includes("\u6362\u4E2A\u98CE\u683C") ? (0, import_react2.createElement)(
        "div",
        { style: { marginTop: "4px" } },
        (0, import_react2.createElement)(
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
        (0, import_react2.createElement)("textarea", {
          style: {
            ...S.textarea,
            borderColor: "var(--dsw-accent, #4f6ef7)"
          },
          placeholder: "\u4F8B\uFF1A\u6BCF\u4E2A\u77E5\u8BC6\u70B9\u5148\u7ED9\u4E00\u4E2A\u751F\u6D3B\u4E2D\u7684\u771F\u5B9E\u573A\u666F\u5F15\u51FA\u6982\u5FF5\uFF0C\u518D\u914D\u4E00\u9053\u7531\u6D45\u5165\u6DF1\u7684\u4F8B\u9898\u2026\u2026",
          value: styleText,
          onChange: (e) => setStyleText(e.target.value)
        })
      ) : null,
      (0, import_react2.createElement)("textarea", {
        style: S.textarea,
        placeholder: "\u60F3\u591A\u8BF4\u4E00\u53E5\uFF1F\u5728\u8FD9\u91CC\u8865\u5145\uFF08\u53EF\u9009\uFF09",
        value: note,
        onChange: (e) => setNote(e.target.value)
      }),
      (0, import_react2.createElement)(
        "div",
        { style: { marginTop: "8px", display: "flex", gap: "8px" } },
        (0, import_react2.createElement)(
          "button",
          { style: S.bigBtn(false), onClick: submitReject, disabled: busy },
          "\u63D0\u4EA4\u9A73\u56DE"
        ),
        (0, import_react2.createElement)(
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
    ) : (0, import_react2.createElement)(
      "div",
      { style: { marginTop: "12px", display: "flex", gap: "10px" } },
      (0, import_react2.createElement)(
        "button",
        {
          style: S.bigBtn(true),
          onClick: () => onDecide({ approved: true }),
          disabled: busy
        },
        "\u2705 \u901A\u8FC7\uFF0C\u7EE7\u7EED"
      ),
      (0, import_react2.createElement)(
        "button",
        {
          style: S.bigBtn(false),
          onClick: () => setRejecting(true),
          disabled: busy
        },
        "\u274C \u9A73\u56DE\uFF0C\u63D0\u610F\u89C1"
      )
    ),
    (0, import_react2.createElement)(
      "div",
      { style: { marginTop: "10px" } },
      (0, import_react2.createElement)(
        "button",
        {
          style: {
            ...S.projectBtn(false),
            color: "var(--dsw-danger, #cf222e)",
            borderColor: "var(--dsw-danger, #cf222e)"
          },
          onClick: () => setConfirmRollback(true),
          disabled: busy
        },
        "\u23EA \u56DE\u9000\u5230\u4E0A\u4E00\u4E2A\u62CD\u677F\u70B9"
      ),
      confirmRollback ? rollbackConfirm() : null
    )
  );
}
function MineruTokenCard(props) {
  const {
    mineruSet,
    mineruToken,
    busy,
    onTokenChange,
    onSave,
    resetOpen,
    onToggleReset
  } = props;
  if (mineruSet === false) {
    return (0, import_react2.createElement)(
      "div",
      { style: { ...S.card, borderColor: "var(--dsw-danger, #cf222e)" } },
      (0, import_react2.createElement)(
        "strong",
        { style: { color: "var(--dsw-danger, #cf222e)" } },
        "\u{1F511} \u8FD8\u5DEE\u4E00\u6B65\uFF1AMinerU Token"
      ),
      (0, import_react2.createElement)(
        "p",
        { style: { margin: "4px 0" } },
        "PDF \u8F6C\u6362\u9700\u8981 MinerU \u7684\u514D\u8D39 Token\uFF08mineru.net \u7533\u8BF7\uFF09\u3002\u586B\u5728\u8FD9\u91CC\u5373\u53EF\uFF1A"
      ),
      (0, import_react2.createElement)("input", {
        style: S.input,
        placeholder: "\u7C98\u8D34 MinerU Token",
        value: mineruToken,
        onChange: onTokenChange
      }),
      (0, import_react2.createElement)(
        "button",
        { style: S.bigBtn(true), onClick: onSave, disabled: busy },
        "\u4FDD\u5B58 Token"
      )
    );
  }
  return (0, import_react2.createElement)(
    "div",
    { style: { ...S.card, borderColor: "var(--dsw-success, #1a7f37)" } },
    (0, import_react2.createElement)(
      "div",
      {
        style: {
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap"
        }
      },
      (0, import_react2.createElement)("strong", {}, "\u2705 MinerU Token \u5DF2\u8BBE\u7F6E\uFF08\u2022\u2022\u2022\u2022\uFF09"),
      (0, import_react2.createElement)(
        "button",
        { style: S.smallLink, onClick: onToggleReset },
        "\u91CD\u65B0\u8BBE\u7F6E"
      )
    ),
    resetOpen ? (0, import_react2.createElement)(
      "div",
      { style: { marginTop: "6px" } },
      (0, import_react2.createElement)(
        "p",
        { style: { margin: "4px 0" } },
        "\u586B\u65B0\u7684 Token \u5373\u53EF\u8986\u76D6\u65E7\u7684\uFF1A"
      ),
      (0, import_react2.createElement)("input", {
        style: S.input,
        placeholder: "\u7C98\u8D34\u65B0\u7684 MinerU Token",
        value: mineruToken,
        onChange: onTokenChange
      }),
      (0, import_react2.createElement)(
        "button",
        { style: S.bigBtn(true), onClick: onSave, disabled: busy },
        "\u4FDD\u5B58\u65B0 Token"
      )
    ) : null
  );
}

// src/ui/chat-desk.js
var import_react3 = require("react");
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
  return (0, import_react3.createElement)(
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
        background: side === "user" ? "var(--dsw-accent-soft, #eef2ff)" : "var(--dsw-surface, #ffffff)",
        border: "1px solid var(--dsw-border, #d0d7de)",
        ...extraStyle ?? {}
      }
    },
    text
  );
}
function toolLine(root) {
  const name = root?.name ?? root?.toolName ?? "\u5DE5\u5177";
  if (root?.kind === "tool-result") {
    const text = String(root?.result?.text ?? root?.text ?? "").replace(/\s+/g, " ").slice(0, 120);
    const ok = root?.result?.isError !== true && root?.isError !== true;
    return `\u{1F527} ${name} \xB7 ${ok ? "\u5B8C\u6210" : "\u51FA\u9519"}${text !== "" ? `\uFF1A${text}` : ""}`;
  }
  return `\u{1F527} ${name} \xB7 \u6267\u884C\u4E2D\u2026`;
}
function muted(text) {
  return (0, import_react3.createElement)(
    "p",
    {
      style: {
        margin: "3px 0",
        fontSize: "11px",
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
  "textbook/intervention": () => "\u2713 \u5DF2\u8BB0\u5165\u7559\u8A00\uFF08\u4E0B\u4E2A\u505C\u9760\u70B9\u5904\u7406\uFF09",
  "textbook/intervention-done": () => "\u2713 \u7559\u8A00\u5DF2\u5904\u7406",
  "textbook/pause": () => "\u2713 \u5DF2\u6682\u505C",
  "textbook/resume": () => "\u2713 \u5DF2\u7EE7\u7EED",
  "textbook/outline-decision": (d) => `\u2713 \u7AE0\u8282\u5B89\u6392${d?.approved === true ? "\u5DF2\u901A\u8FC7" : "\u5DF2\u9A73\u56DE"}`,
  "textbook/gate-decision": (d) => `\u2713 \u7B2C ${d?.gate ?? "?"} \u5173${d?.approved === true ? "\u901A\u8FC7" : "\u9A73\u56DE"}`,
  "textbook/gold-seal": () => "\u2713 \u91D1\u6807\u51C6\u5DF2\u5B9A\u7A3F\u4E3A\u98CE\u683C\u6BCD\u7248",
  "textbook/pattern-added": (d) => `\u2713 \u5DF2\u52A0\u81EA\u5B9A\u4E49\u6A21\u5F0F${d?.name ? `\uFF1A${String(d.name).slice(0, 20)}` : ""}`
};
function badgeSpan(text) {
  return (0, import_react3.createElement)(
    "div",
    {
      style: {
        margin: "2px 0 6px 12px",
        fontSize: "11px",
        color: "var(--dsw-success, #1a7f37)",
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
  const nodes = props.useSession((s) => s.nodes) ?? [];
  const partial = props.useSession((s) => s.partial);
  const events = props.events ?? [];
  const onNudge = props.onNudge ?? (() => {
  });
  const onCollapse = props.onCollapse ?? null;
  const deskScrollRef = (0, import_react3.useRef)(null);
  (0, import_react3.useEffect)(() => {
    const el = deskScrollRef.current;
    if (el === null) return void 0;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (nearBottom) el.scrollTop = el.scrollHeight;
    return void 0;
  }, [nodes.length, partial]);
  (0, import_react3.useEffect)(() => {
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
        const text = contentBlocksText(node.content);
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
            { color: "var(--dsw-danger, #cf222e)" }
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
        push(muted(`\u2318 /${data.command?.name ?? "\u547D\u4EE4"} \u5DF2\u6267\u884C`));
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
  if (partial != null && partial.blocks != null) {
    const text = assistantBlocks(partial.blocks);
    if (text !== "") push(bubble("assistant", `${text}\u258D`));
  }
  if (items.length === 0)
    push(muted("\u5BF9\u8BDD\u4F1A\u5B9E\u65F6\u663E\u793A\u5728\u8FD9\u91CC\uFF1B\u4F60\u5BF9 AI \u8BF4\u8BDD\u7528\u9875\u9762\u5E95\u4E0B\u7684\u8F93\u5165\u6761\u3002"));
  return (0, import_react3.createElement)(
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
    onCollapse !== null ? (0, import_react3.createElement)(
      "div",
      {
        style: {
          position: "sticky",
          top: 0,
          background: "inherit",
          textAlign: "right"
        }
      },
      (0, import_react3.createElement)(
        "button",
        { style: S.smallLink, onClick: onCollapse },
        "\u6536\u6210\u4E00\u6761"
      )
    ) : null,
    (0, import_react3.createElement)(
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
      (0, import_react3.createElement)(
        "button",
        {
          style: { ...S.smallLink, margin: "6px 0" },
          title: "AI \u5728\u5BF9\u8BDD\u91CC\u7B54\u5E94/\u8BF4\u8FC7\u7684\u4E8B\uFF0C\u5982\u679C\u5DE5\u4F5C\u53F0\u8FD8\u6CA1\u663E\u793A\uFF0C\u70B9\u8FD9\u4E2A\u63D0\u9192\u5B83\u8BB0\u4E0B\u6765",
          onClick: () => onNudge(
            "\u5DE5\u4F5C\u53F0\u8FD8\u6CA1\u8DDF\u4E0A\uFF0C\u8BF7\u628A\u521A\u624D\u7B54\u5E94\u7684\u4E8B\u843D\u8D26\uFF08style-note/progress \u7B49\uFF09"
          )
        },
        "\u23F0 \u63D0\u9192 AI \u8BB0\u4E0B\u6765"
      )
    )
  );
}

// src/ui/gold-table.js
var import_react4 = require("react");
var OPINION_KIND_TEXT = {
  dislike: "\u{1F615} \u4E0D\u559C\u6B22\u8FD9\u79CD\u5199\u6CD5",
  drop: "\u{1F5D1} \u8FD9\u7C7B\u5185\u5BB9\u4E0D\u9700\u8981",
  change: "\u270F\uFE0F \u8981\u6539\u6210"
};
var OPINION_STATUS_TEXT = {
  pending: "\u5F85\u5904\u7406",
  sent: "AI \u4FEE\u8BA2\u4E2D",
  applied: "AI \u5DF2\u6539",
  revoked: "\u5DF2\u64A4\u9500"
};
function GoldOpinionList(props) {
  const { opinions, busy, onRevoke, onRevise } = props;
  const list = opinions ?? [];
  if (list.length === 0) {
    return (0, import_react4.createElement)(
      "div",
      { style: { ...S.card, opacity: 0.85 } },
      (0, import_react4.createElement)(
        "p",
        { style: { margin: "0" } },
        "\u{1F4CB} \u672C\u7A3F\u610F\u89C1\u5355\u8FD8\u7A7A\u7740\uFF1A\u8BFB\u4E0B\u9762\u7684\u7A3F\u5B50\u968F\u624B\u6807\u8BB0\uFF0C\u6216\u7528\u6700\u5E95\u4E0B\u7684\u300C\u7B3C\u7EDF\u63D0\u4E00\u6761\u300D\u3002"
      )
    );
  }
  let seq = 0;
  const rows = list.map((o) => {
    if (o.status === "revoked") {
      return (0, import_react4.createElement)(
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
        `\u5DF2\u64A4\u9500\uFF1A${OPINION_KIND_TEXT[o.kind] ?? o.kind}${o.wish ? ` ${o.wish}` : ""}`
      );
    }
    seq += 1;
    const target = o.target == null ? "\u7B3C\u7EDF\uFF08\u4E0D\u6307\u54EA\u6BB5\uFF09" : `\u7B2C${o.target.para}\u6BB5${o.target.hint ? `\u300C${o.target.hint}\u300D` : ""}`;
    return (0, import_react4.createElement)(
      "div",
      { key: o.id, style: { ...S.card, marginBottom: "6px" } },
      (0, import_react4.createElement)(
        "div",
        {
          style: {
            display: "flex",
            gap: "8px",
            alignItems: "baseline",
            flexWrap: "wrap"
          }
        },
        (0, import_react4.createElement)("strong", null, `#${seq}`),
        (0, import_react4.createElement)("span", null, OPINION_KIND_TEXT[o.kind] ?? o.kind),
        (0, import_react4.createElement)(
          "span",
          { style: { opacity: 0.75, fontSize: "12px" } },
          target
        ),
        o.wish ? (0, import_react4.createElement)("span", null, o.wish) : null,
        (0, import_react4.createElement)(
          "span",
          {
            style: {
              marginLeft: "auto",
              fontSize: "12px",
              whiteSpace: "nowrap"
            }
          },
          OPINION_STATUS_TEXT[o.status] ?? o.status,
          " ",
          (0, import_react4.createElement)(
            "button",
            {
              style: S.smallLink,
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
  return (0, import_react4.createElement)(
    "div",
    null,
    (0, import_react4.createElement)(
      "p",
      { style: { margin: "0 0 6px", fontWeight: 600 } },
      `\u{1F4CB} \u672C\u7A3F\u610F\u89C1\u5355\uFF08${seq} \u6761\uFF09`
    ),
    ...rows,
    onRevise !== void 0 ? (0, import_react4.createElement)(
      "div",
      { style: { margin: "8px 0" } },
      (0, import_react4.createElement)(
        "button",
        {
          style: S.bigBtn(true),
          onClick: onRevise,
          disabled: busy || pendingCount === 0
        },
        pendingCount > 0 ? `\u{1F501} \u8BA9 AI \u7167\u8FD9\u4E9B\u6539\uFF08${pendingCount} \u6761\uFF09` : "\u{1F501} \u8BA9 AI \u7167\u8FD9\u4E9B\u6539"
      ),
      pendingCount === 0 ? (0, import_react4.createElement)(
        "span",
        {
          style: { marginLeft: "8px", fontSize: "12px", opacity: 0.7 }
        },
        "\u5148\u6807\u8BB0\u81F3\u5C11\u4E00\u6761\u610F\u89C1\uFF08\u6BB5\u65C1\u4E09\u952E\u6216\u7B3C\u7EDF\u4FBF\u7B7E\uFF09"
      ) : null,
      (0, import_react4.createElement)(
        "p",
        { style: S.hint },
        "\u53EA\u6539\u4F60\u6807\u8FC7\u7684\u5730\u65B9\uFF0C\u5176\u4F59\u539F\u6837\u4FDD\u7559"
      )
    ) : null
  );
}
var goldFirstPulseDone = false;
function GoldReader(props) {
  const {
    text,
    opinions,
    busy,
    onOpinion,
    readOnly,
    onRevokeOpinion = () => {
    }
  } = props;
  const [hover, setHover] = (0, import_react4.useState)(null);
  const [formPara, setFormPara] = (0, import_react4.useState)(null);
  const [wishText, setWishText] = (0, import_react4.useState)("");
  const [wishError, setWishError] = (0, import_react4.useState)(null);
  const [generalKind, setGeneralKind] = (0, import_react4.useState)("change");
  const [generalText, setGeneralText] = (0, import_react4.useState)("");
  const [generalError, setGeneralError] = (0, import_react4.useState)(null);
  const [pulsePhase, setPulsePhase] = (0, import_react4.useState)(null);
  (0, import_react4.useEffect)(() => {
    if (readOnly || goldFirstPulseDone) return void 0;
    goldFirstPulseDone = true;
    const timers = [
      setTimeout(() => setPulsePhase("on1"), 250),
      setTimeout(() => setPulsePhase("off"), 750),
      setTimeout(() => setPulsePhase("on2"), 1150),
      setTimeout(() => setPulsePhase("done"), 1650)
    ];
    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [readOnly]);
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
  return (0, import_react4.createElement)(
    "div",
    { style: { paddingLeft: "34px", paddingRight: "68px" } },
    !readOnly ? (0, import_react4.createElement)(
      "p",
      { style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
      "\u6807\u8BB0\u65B9\u6CD5\uFF1A\u9F20\u6807\u505C\u5728\u54EA\u4E00\u6BB5\uFF0C\u90A3\u6BB5\u53F3\u4FA7\u5C31\u4EAE\u51FA\u4E09\u4E2A\u952E \u{1F615}\u{1F5D1}\u270F\uFE0F\uFF1B\u4E0D\u6307\u54EA\u6BB5\u5C31\u7528\u6700\u5E95\u4E0B\u300C\u7B3C\u7EDF\u63D0\u4E00\u6761\u300D\u3002\u63D0\u5B8C\u70B9\u610F\u89C1\u5355\u91CC\u7684\u3010\u8BA9 AI \u7167\u8FD9\u4E9B\u6539\u3011\u3002"
    ) : null,
    paras.map((para, idx) => {
      const n = idx + 1;
      const marks = marked.get(n) ?? [];
      const pulsing = n === 1 && (pulsePhase === "on1" || pulsePhase === "on2");
      const pulseBtnStyle = pulsing ? {
        background: "var(--dsw-accent-soft, #eef2ff)",
        borderRadius: "6px",
        boxShadow: "0 0 0 2px var(--dsw-accent, #4f6ef7)",
        transform: "scale(1.15)",
        transition: "transform 0.2s, boxShadow 0.2s, background 0.2s"
      } : null;
      return (0, import_react4.createElement)(
        "div",
        {
          key: n,
          // 段容器相对定位：装订线、三键浮出都以它为参照，正文不占这些位置。
          style: { position: "relative" },
          onMouseEnter: () => setHover(n),
          onMouseLeave: () => setHover((cur) => cur === n ? null : cur)
        },
        // 左侧装订线：段号 + 已标 #N 标签（不指段时淡出到 0.35，指到时亮起）。
        (0, import_react4.createElement)(
          "span",
          {
            style: {
              position: "absolute",
              left: "-34px",
              top: "0",
              fontSize: "11px",
              lineHeight: 1.6,
              whiteSpace: "nowrap",
              color: "var(--dsw-accent, #4f6ef7)",
              opacity: hover === n ? 1 : 0.35,
              transition: "opacity 0.15s"
            }
          },
          String(n),
          marks.length > 0 ? (0, import_react4.createElement)(
            "span",
            { style: { display: "block" } },
            marks.join(" ")
          ) : null
        ),
        // 正文段落：纯流式 + markdown 最小渲染（标题/加粗/列表行）。
        (0, import_react4.createElement)("p", { style: READER_PARA_STYLE }, ...renderInline(para)),
        formPara === n ? (0, import_react4.createElement)(
          "div",
          { style: { margin: "-4px 0 8px" } },
          (0, import_react4.createElement)("textarea", {
            style: { ...S.input, width: "100%", boxSizing: "border-box" },
            rows: 2,
            placeholder: "\u5199\u4E00\u53E5\u4F60\u60F3\u8BA9\u5B83\u53D8\u6210\u4EC0\u4E48\u6837\uFF08\u4F8B\uFF1A\u5F00\u5934\u522B\u53CD\u95EE\uFF0C\u76F4\u63A5\u8BB2\u9053\u7406\uFF09",
            value: wishText,
            onChange: (e) => {
              setWishText(e.target.value);
              setWishError(null);
            }
          }),
          (0, import_react4.createElement)(
            "div",
            {
              style: { display: "flex", gap: "8px", alignItems: "center" }
            },
            (0, import_react4.createElement)(
              "button",
              {
                style: S.bigBtn(true),
                onClick: submitWish,
                disabled: busy
              },
              "\u2705 \u8BB0\u4E0B\u8FD9\u6761"
            ),
            (0, import_react4.createElement)(
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
            wishError !== null ? (0, import_react4.createElement)("span", { style: S.error }, wishError) : null
          )
        ) : null,
        // 三键浮出（absolute 定在段右上角、不占正文宽度）：F36 常显淡态 0.3（可感知、不占位），
        // 悬停或首段引导脉冲时全亮；键始终可点（悬停键本身也算悬停该段）。
        !readOnly ? (0, import_react4.createElement)(
          "div",
          {
            style: {
              position: "absolute",
              top: "-2px",
              right: "-64px",
              display: "flex",
              gap: "2px",
              opacity: hover === n || pulsing ? 1 : 0.3,
              transition: "opacity 0.15s",
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
              return (0, import_react4.createElement)(
                "button",
                {
                  key: label,
                  "aria-label": labelText,
                  style: {
                    ...S.smallLink,
                    fontSize: "15px",
                    padding: "2px 4px",
                    whiteSpace: "nowrap",
                    transition: "transform 0.2s, boxShadow 0.2s, background 0.2s",
                    ...active != null ? {
                      background: "var(--dsw-accent-soft, #eef2ff)",
                      borderRadius: "6px"
                    } : {},
                    ...pulseBtnStyle ?? {}
                  },
                  title: labelText,
                  onClick: () => {
                    if (pulsing) setPulsePhase("done");
                    if (active != null) onRevokeOpinion(active.id);
                    else onClick();
                  },
                  disabled: busy
                },
                label
              );
            };
            return [
              keyWith(
                "\u{1F615}",
                "dislike",
                "\u8FD9\u79CD\u5199\u6CD5\u4E0D\u559C\u6B22",
                () => onOpinion("dislike", "", n, paragraphHint(para))
              ),
              keyWith(
                "\u{1F5D1}",
                "drop",
                "\u8FD9\u7C7B\u5185\u5BB9\u4E0D\u9700\u8981",
                () => onOpinion("drop", "", n, paragraphHint(para))
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
    !readOnly ? (0, import_react4.createElement)(
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
      (0, import_react4.createElement)(
        "span",
        { style: { fontSize: "12px", opacity: 0.75 } },
        "\u7B3C\u7EDF\u63D0\u4E00\u6761\uFF08\u4E0D\u6307\u54EA\u6BB5\u4E5F\u884C\uFF09\uFF1A"
      ),
      ["dislike", "drop", "change"].map(
        (k) => (0, import_react4.createElement)(
          "button",
          {
            key: k,
            style: S.projectBtn(generalKind === k),
            onClick: () => setGeneralKind(k),
            disabled: busy
          },
          OPINION_KIND_TEXT[k]
        )
      ),
      (0, import_react4.createElement)("input", {
        style: { ...S.input, flex: "1 1 160px", minWidth: "120px" },
        placeholder: "\u4F8B\uFF1A\u6574\u4F53\u8BED\u6C14\u518D\u4EB2\u5207\u4E00\u70B9",
        value: generalText,
        onChange: (e) => {
          setGeneralText(e.target.value);
          setGeneralError(null);
        }
      }),
      (0, import_react4.createElement)(
        "button",
        { style: S.bigBtn(true), onClick: submitGeneral, disabled: busy },
        "\u7B3C\u7EDF\u63D0\u4E00\u6761"
      ),
      generalError !== null ? (0, import_react4.createElement)("span", { style: S.error }, generalError) : null
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
  const chipSpan = (n) => (0, import_react4.createElement)(
    "span",
    {
      key: `c${n}`,
      style: {
        fontWeight: 700,
        marginRight: "6px",
        color: "var(--dsw-accent, #4f6ef7)",
        whiteSpace: "nowrap"
      }
    },
    `#${n}`
  );
  const blocks = ops.map((op, idx) => {
    if (op.type === "del") {
      return (0, import_react4.createElement)(
        "p",
        {
          key: `d${idx}`,
          style: {
            ...READER_PARA_STYLE,
            textDecoration: "line-through",
            background: "var(--dsw-danger-soft, #ffebe9)",
            opacity: 0.75
          }
        },
        oldParas[op.old]
      );
    }
    const paraNo = op.new + 1;
    const chips = chipsByNewPara.get(paraNo) ?? [];
    return (0, import_react4.createElement)(
      "p",
      {
        key: `n${idx}`,
        style: op.type === "add" ? {
          ...READER_PARA_STYLE,
          background: "var(--dsw-success-soft, #dafbe1)",
          borderColor: "var(--dsw-success, #2da44e)"
        } : READER_PARA_STYLE
      },
      chips.map((n) => chipSpan(n)),
      " ",
      newParas[op.new]
    );
  });
  return (0, import_react4.createElement)(
    "div",
    null,
    (0, import_react4.createElement)(
      "p",
      { style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
      `\u5BF9\u7167\u65B9\u5F0F\uFF1A\u7EA2\u5E95\u5212\u6389\u7684\u662F\u65E7\u7A3F\u5220\u6389\u7684\uFF1B\u7EFF\u5E95\u662F\u65B0\u7A3F\u6539\u6210\u7684\uFF1B#\u53F7\u5BF9\u5E94\u610F\u89C1\u5355\u91CC\u7684\u7B2C\u51E0\u6761${generalCount > 0 ? `\uFF08\u53E6\u6709 ${generalCount} \u6761\u7B3C\u7EDF\u610F\u89C1\uFF0CAI \u4F1A\u5BF9\u53F7\u5165\u5EA7\uFF09` : ""}\u3002`
    ),
    ...blocks
  );
}
function GoldFinalize(props) {
  const { meta, opinions, busy, onApprove, onSuggestWords } = props;
  const [targetWords, setTargetWords] = (0, import_react4.useState)("");
  const [suggesting, setSuggesting] = (0, import_react4.useState)(false);
  const [suggestion, setSuggestion] = (0, import_react4.useState)(null);
  const [error, setError] = (0, import_react4.useState)(null);
  const [confirming, setConfirming] = (0, import_react4.useState)(null);
  const requestSuggestion = () => {
    setSuggesting(true);
    setError(null);
    Promise.resolve(onSuggestWords()).then((result) => {
      if (result === null) return;
      setSuggestion(result);
      if (Number.isFinite(Number(result.suggested)) && Number(result.suggested) >= 500) {
        setTargetWords(String(Math.round(Number(result.suggested))));
      }
    }).catch(
      (err) => setError(String(err instanceof Error ? err.message : err))
    ).finally(() => setSuggesting(false));
  };
  const wordsRaw = String(targetWords ?? "").trim();
  const wordsEmpty = wordsRaw === "";
  const words = Number(wordsRaw);
  const wordsOk = wordsEmpty || Number.isFinite(words) && words >= 500 && words <= 5e4;
  const targetToSend = wordsEmpty ? null : Number.isFinite(words) && words >= 500 && words <= 5e4 ? Math.round(words) : null;
  const live = (opinions ?? []).filter((o) => o.status !== "revoked");
  return (0, import_react4.createElement)(
    "div",
    { style: S.card },
    (0, import_react4.createElement)(
      "p",
      { style: { margin: "0 0 6px", fontWeight: 600 } },
      "\u2705 \u6EE1\u610F\u4E86\u5C31\u5B9A\u7A3F\uFF08\u8FD9\u4E00\u7AE0\u5C31\u662F\u5168\u4E66\u7684\u6837\u677F\uFF09"
    ),
    (0, import_react4.createElement)(
      "div",
      { style: { margin: "6px 0" } },
      (0, import_react4.createElement)(
        "p",
        { style: { margin: "0 0 4px", fontSize: "12px", opacity: 0.8 } },
        "\u6BCF\u7AE0\u5B57\u6570\uFF08\u6765\u81EA\u7AE0\u8282\u5B89\u6392\uFF0C\u53EF\u53EA\u8C03\u8FD9\u4E00\u7AE0\uFF09\uFF1A"
      ),
      (meta.outline?.chapters ?? []).map(
        (chapter, index) => (0, import_react4.createElement)(
          "div",
          {
            key: index,
            style: {
              fontSize: "12px",
              margin: "2px 0",
              display: "flex",
              gap: "6px",
              alignItems: "baseline"
            }
          },
          `${index + 1}. ${chapter.title ?? ""}`,
          (0, import_react4.createElement)(
            "span",
            { style: { opacity: 0.6 } },
            Number.isFinite(chapter.targetWords) ? `\u7EA6 ${chapter.targetWords} \u5B57` : "\u672A\u5B9A\uFF0CAI \u94FA\u7AE0\u65F6\u81EA\u5B9A"
          ),
          chapter.volumeReason ? (0, import_react4.createElement)(
            "span",
            { style: { opacity: 0.5 } },
            `\uFF08${chapter.volumeReason}\uFF09`
          ) : null
        )
      ),
      Number.isFinite(meta.targetWords) ? (0, import_react4.createElement)(
        "p",
        { style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.6 } },
        `\u515C\u5E95\u7EDF\u4E00\u503C\uFF1A${meta.targetWords} \u5B57\uFF08\u4EC5\u672A\u586B\u7AE0\u4F7F\u7528\uFF09`
      ) : null
    ),
    (0, import_react4.createElement)(
      "div",
      {
        style: {
          display: "flex",
          gap: "6px",
          alignItems: "center",
          flexWrap: "wrap"
        }
      },
      (0, import_react4.createElement)(
        "label",
        { style: S.label },
        "\u515C\u5E95\u7EDF\u4E00\u5B57\u6570\uFF08\u53EF\u9009\uFF0C\u4EC5\u672A\u586B\u7AE0\u4F7F\u7528\uFF09"
      ),
      (0, import_react4.createElement)("input", {
        style: { ...S.input, width: "110px" },
        type: "number",
        min: 500,
        max: 5e4,
        step: 500,
        value: targetWords,
        onChange: (e) => {
          setTargetWords(e.target.value);
          setSuggestion(null);
        }
      }),
      (0, import_react4.createElement)(
        "button",
        {
          style: { ...S.bigBtn(true), padding: "6px 14px" },
          onClick: requestSuggestion,
          disabled: suggesting || busy
        },
        suggesting ? "AI \u601D\u8003\u4E2D\u2026" : "\u2728 AI \u5EFA\u8BAE"
      )
    ),
    suggestion !== null ? (0, import_react4.createElement)(
      "div",
      { style: { margin: "4px 0", fontSize: "12px", opacity: 0.8 } },
      (0, import_react4.createElement)(
        "p",
        { style: { margin: "0 0 4px" } },
        `\u{1F916} AI \u5EFA\u8BAE\uFF1A\u6BCF\u7AE0 ${suggestion.suggested} \u5B57\uFF08${suggestion.range ?? ""}\uFF09\u3002${suggestion.reason ?? ""}`
      ),
      (suggestion.perChapter ?? []).length > 0 ? (0, import_react4.createElement)(
        "div",
        null,
        (suggestion.perChapter ?? []).map(
          (item) => (0, import_react4.createElement)(
            "div",
            { key: item.n, style: { margin: "1px 0" } },
            `${item.n}. ${item.title ?? ""}\uFF1A${Number.isFinite(item.words) ? `\u7EA6 ${item.words} \u5B57` : "\u672A\u5B9A\uFF0CAI \u94FA\u7AE0\u65F6\u81EA\u5B9A"}${item.reason ? `\uFF08${item.reason}\uFF09` : ""}`
          )
        )
      ) : null
    ) : null,
    !wordsEmpty && !wordsOk ? (0, import_react4.createElement)(
      "p",
      { style: S.error },
      "\u515C\u5E95\u5B57\u6570\u8BF7\u5728 500-50000 \u4E4B\u95F4\uFF0C\u6216\u7559\u7A7A\u53EA\u7528\u6BCF\u7AE0\u6E05\u5355"
    ) : null,
    error !== null ? (0, import_react4.createElement)("p", { style: S.error }, `\u26A0\uFE0F ${error}`) : null,
    (0, import_react4.createElement)(
      "div",
      {
        style: {
          display: "flex",
          gap: "8px",
          marginTop: "8px",
          alignItems: "center"
        }
      },
      (0, import_react4.createElement)(
        "button",
        {
          style: S.bigBtn(true),
          onClick: () => {
            if (live.length > 0) setConfirming("seal");
            else onApprove(true, targetToSend);
          },
          disabled: busy || !wordsOk
        },
        "\u2705 \u5C31\u6309\u8FD9\u7AE0\u7684\u98CE\u683C\u5199\u5168\u4E66"
      ),
      (0, import_react4.createElement)(
        "button",
        {
          style: {
            ...S.bigBtn(true),
            background: "transparent",
            color: "var(--dsw-danger, #cf222e)",
            padding: "8px 10px"
          },
          onClick: () => setConfirming("rewrite"),
          disabled: busy || !wordsOk
        },
        "\u274C \u8FD9\u7248\u6574\u4E2A\u4E0D\u8981\uFF0C\u91CD\u5199"
      )
    ),
    (0, import_react4.createElement)(
      "p",
      { style: S.hint },
      "\u4ECE\u5934\u91CD\u5199\u8FD9\u4E00\u7AE0\uFF1B\u4F60\u6807\u8FC7\u7684\u610F\u89C1\u4ECD\u4F1A\u5E26\u7ED9 AI \u5F53\u65B9\u5411"
    ),
    confirming === "seal" ? (0, import_react4.createElement)(
      "div",
      {
        style: {
          ...S.card,
          borderColor: "var(--dsw-accent, #4f6ef7)",
          marginTop: "8px"
        }
      },
      (0, import_react4.createElement)(
        "p",
        { style: { margin: "0 0 4px", fontWeight: 600 } },
        "\u5B9A\u7A3F\u524D\u786E\u8BA4\uFF1A\u4E0B\u9762\u8FD9\u4E9B\u4F1A\u6C38\u4E45\u751F\u6548"
      ),
      (0, import_react4.createElement)(
        "p",
        { style: { margin: "0 0 4px", fontSize: "12px", opacity: 0.85 } },
        "\u2460 \u4F60\u7684\u610F\u89C1\u8F6C\u6210\u300C\u98CE\u683C\u7EBF\u300D\uFF0C\u540E\u9762\u6BCF\u4E00\u7AE0\u90FD\u7167\u6B64\u6267\u884C\uFF1A"
      ),
      live.map(
        (o, i) => (0, import_react4.createElement)(
          "p",
          {
            key: o.id,
            style: { margin: "0 2px 2px 12px", fontSize: "12px" }
          },
          `#${i + 1} ${OPINION_KIND_TEXT[o.kind] ?? o.kind}${o.wish ? `\uFF1A${o.wish}` : ""}`
        )
      ),
      (0, import_react4.createElement)(
        "p",
        { style: { margin: "4px 0", fontSize: "12px", opacity: 0.85 } },
        "\u2461 \u8FD9\u4E00\u7A3F\u51BB\u7ED3\u4E3A\u300C\u98CE\u683C\u6BCD\u7248\u300D\uFF0CAI \u94FA\u5168\u4E66\u65F6\u90FD\u62FF\u5B83\u5F53\u6837\u677F\u3002"
      ),
      (0, import_react4.createElement)(
        "div",
        { style: { display: "flex", gap: "8px", marginTop: "6px" } },
        (0, import_react4.createElement)(
          "button",
          {
            style: S.bigBtn(true),
            onClick: () => onApprove(true, targetToSend),
            disabled: busy || !wordsOk
          },
          "\u786E\u8BA4\uFF0C\u5B9A\u7A3F"
        ),
        (0, import_react4.createElement)(
          "button",
          { style: S.smallLink, onClick: () => setConfirming(null) },
          "\u518D\u60F3\u60F3"
        )
      )
    ) : null,
    confirming === "rewrite" ? (0, import_react4.createElement)(
      "div",
      {
        style: {
          ...S.card,
          borderColor: "var(--dsw-danger, #cf222e)",
          marginTop: "8px"
        }
      },
      (0, import_react4.createElement)(
        "p",
        { style: { margin: "0 0 6px" } },
        "\u6574\u7A3F\u4E22\u5F03\u91CD\u5199\uFF1A\u8FD9\u4E00\u7A3F\u4F1A\u5B58\u6863\u7559\u5E95\uFF08\u4E0D\u4E22\uFF09\uFF0CAI \u4ECE\u5934\u518D\u5199\u4E00\u7248\u3002"
      ),
      (0, import_react4.createElement)(
        "div",
        { style: { display: "flex", gap: "8px" } },
        (0, import_react4.createElement)(
          "button",
          {
            style: {
              ...S.bigBtn(true),
              background: "transparent",
              color: "var(--dsw-danger, #cf222e)"
            },
            onClick: () => onApprove(false, targetToSend),
            disabled: busy || !wordsOk
          },
          "\u786E\u8BA4\u91CD\u5199"
        ),
        (0, import_react4.createElement)(
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
    busy,
    postAction,
    fetchText,
    onSuggestWords
  } = props;
  const [texts, setTexts] = (0, import_react4.useState)({});
  const [view, setView] = (0, import_react4.useState)({ tab: goldDraftVersion, mode: "read" });
  const [auditText, setAuditText] = (0, import_react4.useState)(void 0);
  const [loadError, setLoadError] = (0, import_react4.useState)(null);
  const opinions = meta.goldOpinions ?? [];
  const goldNo = goldChapterNo(meta);
  const currentPath = `work/chapter-${String(goldNo).padStart(2, "0")}.md`;
  const pathOf = (version) => version === goldDraftVersion ? currentPath : (goldDrafts ?? []).find((d) => d.version === version)?.path ?? null;
  const load = (path) => {
    if (texts[path] !== void 0) return;
    fetchText(path).then((t) => setTexts((prev) => ({ ...prev, [path]: t }))).catch(
      (err) => setLoadError(String(err instanceof Error ? err.message : err))
    );
  };
  (0, import_react4.useEffect)(() => {
    load(currentPath);
    fetchText(`work/audit-${String(goldNo).padStart(2, "0")}.md`).then(setAuditText).catch(() => setAuditText(null));
  }, []);
  const showTab = Math.min(view.tab, goldDraftVersion);
  const showPath = pathOf(showTab);
  const showText = showPath === null ? null : texts[showPath] ?? null;
  const compareWith = view.mode === "compare" ? showTab === goldDraftVersion ? showTab - 1 : showTab + 1 : null;
  const comparePath = compareWith !== null ? pathOf(compareWith) : null;
  (0, import_react4.useEffect)(() => {
    if (comparePath !== null) load(comparePath);
  }, [comparePath]);
  const compareText = comparePath === null ? null : texts[comparePath] ?? null;
  let auditBadge = "\u{1F9EA} \u8D28\u68C0\uFF1A\u5DF2\u9644\u81EA\u67E5\u8BB0\u5F55";
  if (auditText != null) {
    try {
      const audit = JSON.parse(auditText);
      auditBadge = typeof audit.passed === "boolean" ? audit.passed === true ? "\u{1F9EA} \u8D28\u68C0\uFF1A\u901A\u8FC7\uFF08\u81EA\u67E5\u65E0\u5F85\u5B8C\u5584\u9879\uFF09" : "\u{1F9EA} \u8D28\u68C0\uFF1A\u6709\u51E0\u5904\u5F85\u5B8C\u5584\uFF08\u53EF\u4EE5\u8BA9 AI \u6539\uFF09" : "\u{1F9EA} \u8D28\u68C0\uFF1A\u8BB0\u5F55\u683C\u5F0F\u5F85\u5B8C\u5584";
    } catch {
      auditBadge = "\u{1F9EA} \u8D28\u68C0\uFF1A\u8BB0\u5F55\u683C\u5F0F\u5F85\u5B8C\u5584";
    }
  }
  const addOpinion = (kind, wish, para, hint) => {
    void postAction({
      action: "gold-opinion",
      kind,
      wish,
      ...para !== null ? { para } : {},
      ...hint ? { hint } : {}
    });
  };
  const tabBtn = (v) => (0, import_react4.createElement)(
    "button",
    {
      key: v,
      style: S.projectBtn(view.tab === v),
      onClick: () => setView({ tab: v, mode: "read" })
    },
    `\u7B2C ${v} \u7A3F${v === goldDraftVersion ? "\uFF08\u6700\u65B0\uFF09" : ""}`
  );
  return (0, import_react4.createElement)(
    "div",
    { style: S.focus },
    (0, import_react4.createElement)(
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
      (0, import_react4.createElement)(
        "strong",
        { style: { fontSize: "14px" } },
        "\u{1F91D} \u6700\u4F73\u8303\u4F8B\u7AE0 \xB7 \u98CE\u683C\u8C08\u5224\u684C"
      ),
      (0, import_react4.createElement)(
        "span",
        { style: { fontSize: "12px", opacity: 0.8 } },
        auditBadge
      )
    ),
    goldDraftVersion > 1 ? (0, import_react4.createElement)(
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
      showTab === goldDraftVersion ? (0, import_react4.createElement)(
        "button",
        {
          style: S.smallLink,
          onClick: () => setView({
            tab: showTab,
            mode: view.mode === "compare" ? "read" : "compare"
          })
        },
        view.mode === "compare" ? "\u53EA\u770B\u8FD9\u4E00\u7A3F" : `\u548C\u7B2C ${goldDraftVersion - 1} \u7A3F\u5BF9\u6BD4`
      ) : (0, import_react4.createElement)(
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
    loadError !== null ? (0, import_react4.createElement)("p", { style: S.error }, `\u7A3F\u5B50\u6253\u5F00\u5931\u8D25\uFF1A${loadError}`) : null,
    (0, import_react4.createElement)(
      "div",
      { style: { margin: "6px 0" } },
      showText === null ? (0, import_react4.createElement)("p", { style: S.hint }, "\u52A0\u8F7D\u4E2D\u2026") : view.mode === "compare" && compareText !== null ? (0, import_react4.createElement)(
        "div",
        null,
        (0, import_react4.createElement)(
          "p",
          { style: S.hint },
          "\u60F3\u5728\u8FD9\u4E00\u7A3F\u4E0A\u7EE7\u7EED\u6311\u6BDB\u75C5\uFF1F\u70B9\u300C\u53EA\u770B\u8FD9\u4E00\u7A3F\u300D\u3002"
        ),
        (0, import_react4.createElement)(GoldCompare, {
          oldText: showTab === goldDraftVersion ? compareText : showText,
          newText: showTab === goldDraftVersion ? showText : compareText,
          opinions
        })
      ) : (0, import_react4.createElement)(GoldReader, {
        text: showText,
        opinions,
        busy,
        onOpinion: addOpinion,
        onRevokeOpinion: (id) => {
          void postAction({ action: "gold-opinion-revoke", id });
        },
        readOnly: showTab !== goldDraftVersion
      }),
      showTab !== goldDraftVersion && view.mode === "read" ? (0, import_react4.createElement)(
        "p",
        { style: { fontSize: "12px", opacity: 0.7, margin: "4px 0" } },
        "\u8FD9\u662F\u65E7\u7A3F\uFF0C\u53EA\u80FD\u56DE\u987E\uFF1B\u8981\u6311\u6BDB\u75C5\u8BF7\u56DE\u5230\u300C\u6700\u65B0\u300D\u90A3\u7A3F\u3002"
      ) : null
    ),
    (0, import_react4.createElement)(GoldOpinionList, {
      opinions,
      busy,
      onRevoke: (id) => {
        void postAction({ action: "gold-opinion-revoke", id });
      },
      onRevise: () => {
        void postAction({ action: "gold-revise" });
      }
    }),
    (0, import_react4.createElement)(GoldFinalize, {
      meta,
      opinions,
      busy,
      onApprove: (approved, targetWords) => {
        void postAction({ action: "gold-approve", approved, targetWords });
      },
      onSuggestWords
    })
  );
}

// src/ui/chapters-map.js
var import_react5 = require("react");
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
    project,
    session,
    postAction,
    initialOpenChapter,
    chapterTextOverride
  } = props;
  const [reviewing, setReviewing] = (0, import_react5.useState)(null);
  const [comment, setComment] = (0, import_react5.useState)("");
  const [openChapter, setOpenChapter] = (0, import_react5.useState)(
    () => Number.isSafeInteger(initialOpenChapter) && initialOpenChapter >= 1 ? initialOpenChapter : null
  );
  const [chapterText, setChapterText] = (0, import_react5.useState)(null);
  const [chapterError, setChapterError] = (0, import_react5.useState)(null);
  (0, import_react5.useEffect)(() => {
    let alive = true;
    setChapterText(null);
    setChapterError(null);
    if (openChapter === null || openChapter === void 0) return void 0;
    if (project === null || project === void 0) return void 0;
    const rel = `work/chapter-${String(openChapter).padStart(2, "0")}.md`;
    fetch(
      `/textbook/file?session=${encodeURIComponent(session)}&project=${encodeURIComponent(project)}&path=${encodeURIComponent(rel)}`
    ).then(
      (res) => res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`))
    ).then((text) => {
      if (alive) setChapterText(text);
    }).catch((err) => {
      if (alive)
        setChapterError(String(err instanceof Error ? err.message : err));
    });
    return () => {
      alive = false;
    };
  }, [openChapter, project, session]);
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
      written: found?.written === true || (chapterStatus ?? []).length === 0,
      audited: found?.audited === true || (chapterStatus ?? []).length === 0
    };
  });
  const doneSet = (0, import_react5.useMemo)(() => deriveDoneSet(events), [events]);
  const hasChapterFile = (n) => {
    const files = workFiles ?? [];
    if (files.length === 0) return true;
    return files.some(
      (f) => f.path === `work/chapter-${String(n).padStart(2, "0")}.md`
    );
  };
  const done = rows.filter((row) => row.written && row.audited).length;
  const prepared = (chapterStatus ?? []).length > 0;
  const sendReview = (n) => {
    if (comment.trim() === "") return;
    void onReview(n, comment.trim()).then(() => {
      setReviewing(null);
      setComment("");
    });
  };
  return (0, import_react5.createElement)(
    "div",
    { style: S.focus },
    reviewMode ? (0, import_react5.createElement)(
      "div",
      {
        style: {
          margin: "0 0 10px",
          padding: "8px 10px",
          borderRadius: "8px",
          background: "var(--dsw-accent-soft, #eef2ff)"
        }
      },
      (0, import_react5.createElement)("strong", null, "\u{1F4DA} \u5168\u90E8\u7AE0\u8282\u5199\u597D\u4E86\uFF0C\u8BF7\u4F60\u8FC7\u76EE"),
      (0, import_react5.createElement)(
        "p",
        { style: { margin: "4px 0", fontSize: "12px", opacity: 0.8 } },
        "\u60F3\u7EC6\u770B\u70B9\u300C\u770B\u770B\u8FD9\u7AE0\u300D\uFF1B\u6709\u610F\u89C1\u76F4\u63A5\u5199\uFF0CAI \u7167\u6539\uFF1B\u90FD\u6EE1\u610F\u5C31\u4EA4\u5DE5\u5408\u5E76\u3002"
      ),
      (0, import_react5.createElement)(
        "button",
        { style: S.bigBtn(true), onClick: onApproveAll, disabled: busy },
        "\u2705 \u90FD\u8FC7\u4E86\uFF0C\u4EA4\u5DE5"
      )
    ) : null,
    (0, import_react5.createElement)(
      "strong",
      { style: { fontSize: "14px" } },
      "\u{1F4DA} \u94FA\u7AE0 \xB7 \u7AE0\u8282\u6E05\u5355"
    ),
    (0, import_react5.createElement)(
      "p",
      { style: { margin: "4px 0 8px", fontSize: "12px", opacity: 0.75 } },
      `\u6BCF\u7AE0\u6D41\u7A0B\uFF1A\u5C0F\u52A9\u624B\u6267\u7B14 \u2192 \u5C0F\u52A9\u624B\u5BA1\u8BA1 \u2192 AI \u6700\u540E\u628A\u5173\u3002\u5DF2\u5B8C\u6210 ${done}/${rows.length} \u7AE0\uFF1B\u4F60\u968F\u65F6\u53EF\u4EE5"\u770B\u770B\u8FD9\u7AE0"\u5E76\u5199\u610F\u89C1\uFF0CAI \u4F1A\u7167\u610F\u89C1\u4FEE\u8BA2\u3002`
    ),
    progressDetail !== null && progressDetail !== void 0 && progressDetail !== "" ? (0, import_react5.createElement)(
      "div",
      {
        style: {
          margin: "0 0 8px",
          padding: "6px 10px",
          borderRadius: "8px",
          background: "var(--dsw-accent-soft, #eef2ff)",
          fontSize: "12px"
        }
      },
      `\u{1F916} ${progressDetail}`
    ) : null,
    rows.map((row) => {
      const pipelineStage = (meta?.chapterPipeline ?? [])[row.n - 1]?.stage ?? null;
      const badge = chapterBadge(row, pendingReviews, doneSet, pipelineStage);
      const open = reviewing === row.n;
      const fileMissing = !hasChapterFile(row.n);
      const chapterOpen = reviewMode && openChapter === row.n;
      const rowOpinions = (pendingReviews ?? []).filter(
        (r) => Number(r.chapter) === Number(row.n) && r.kind != null && r.status !== "revoked"
      );
      const shownText = typeof chapterTextOverride === "string" && chapterTextOverride !== "" ? chapterTextOverride : chapterText;
      const sourceIndex = [
        row.source !== void 0 && row.source !== "" && row.source !== null ? `\u6E90\uFF1A${row.source}` : null,
        row.points.length > 0 ? `\u8986\u76D6\u77E5\u8BC6\u70B9 ${row.points.length} \u4E2A` : null,
        row.volumeReason !== "" ? `\u4F53\u91CF\u4F9D\u636E\uFF1A${row.volumeReason}` : null
      ].filter(Boolean).join(" \xB7 ");
      return (0, import_react5.createElement)(
        "div",
        {
          key: row.n,
          style: {
            margin: "6px 0",
            padding: "8px 10px",
            background: "var(--dsw-surface, #fff)",
            borderRadius: "8px",
            border: "1px solid var(--dsw-border, #d0d7de)"
          }
        },
        (0, import_react5.createElement)(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap"
            }
          },
          (0, import_react5.createElement)(
            "span",
            { style: { flex: 1, fontSize: "13px", fontWeight: 600 } },
            `\u7B2C ${row.n} \u7AE0\u300A${row.title}\u300B`
          ),
          !prepared ? (0, import_react5.createElement)(
            "span",
            { style: { fontSize: "12px", color: badge.tone } },
            `${badge.icon} \u51C6\u5907\u4E2D`
          ) : (0, import_react5.createElement)(
            "span",
            { style: { fontSize: "12px", color: badge.tone } },
            `${badge.icon} ${badge.text}`
          )
        ),
        sourceIndex !== "" ? (0, import_react5.createElement)(
          "div",
          { style: { margin: "2px 0 0", fontSize: "11px", opacity: 0.6 } },
          sourceIndex
        ) : null,
        (0, import_react5.createElement)(
          "div",
          {
            style: {
              marginTop: "6px",
              display: "flex",
              gap: "10px",
              alignItems: "center"
            }
          },
          (0, import_react5.createElement)(
            "button",
            {
              style: S.smallLink,
              onClick: () => {
                if (reviewMode) {
                  setOpenChapter(chapterOpen ? null : row.n);
                  setChapterText(null);
                  setChapterError(null);
                } else onView(row.n);
              },
              disabled: fileMissing,
              title: fileMissing ? "\u8FD9\u4E00\u7AE0\u8FD8\u6CA1\u5199\u51FA\u6765\uFF08\u6216\u6587\u4EF6\u6539\u540D\u4E86\uFF09\uFF0C\u6682\u65F6\u770B\u4E0D\u4E86" : void 0
            },
            chapterOpen ? "\u6536\u8D77" : "\u{1F440} \u770B\u770B\u8FD9\u7AE0"
          ),
          prepared ? (0, import_react5.createElement)(
            "button",
            {
              style: S.smallLink,
              onClick: () => {
                setReviewing(open ? null : row.n);
                setComment("");
              }
            },
            open ? "\u6536\u8D77" : "\u270D\uFE0F \u5199\u610F\u89C1"
          ) : null
        ),
        open ? (0, import_react5.createElement)(
          "div",
          { style: { marginTop: "6px" } },
          (0, import_react5.createElement)("textarea", {
            style: S.textarea,
            placeholder: "\u4F60\u5BF9\u8FD9\u7AE0\u7684\u610F\u89C1\uFF08\u6BD4\u5982\uFF1A\u4F8B\u5B50\u592A\u96BE\u3001\u591A\u7ED9\u51E0\u9053\u7EC3\u4E60\u3001\u98CE\u683C\u6362\u6210\u66F4\u53E3\u8BED\uFF09",
            value: comment,
            onChange: (e) => setComment(e.target.value)
          }),
          (0, import_react5.createElement)(
            "button",
            {
              style: { ...S.bigBtn(true), padding: "6px 14px" },
              onClick: () => sendReview(row.n),
              disabled: busy || comment.trim() === ""
            },
            "\u628A\u610F\u89C1\u4EA4\u7ED9 AI \u4FEE\u8BA2"
          )
        ) : null,
        // F39：过目态内联展开——章正文 md 渲染（GoldReader 的段落流式排版 + renderInline），
        // 段落旁复用 GoldReader 段级三键（😕/🗑/✏️），意见走 gold-opinion 带 chapter 落 pendingReviews。
        chapterOpen ? (0, import_react5.createElement)(
          "div",
          {
            style: {
              marginTop: "8px",
              borderTop: "1px dashed var(--dsw-border, #d0d7de)",
              paddingTop: "8px"
            }
          },
          chapterError !== null ? (0, import_react5.createElement)(
            "p",
            { style: S.error },
            `\u6253\u5F00\u5931\u8D25\uFF1A${chapterError}`
          ) : shownText === null ? (0, import_react5.createElement)("p", { style: S.hint }, "\u52A0\u8F7D\u4E2D\u2026") : (0, import_react5.createElement)(
            "div",
            null,
            (0, import_react5.createElement)(
              "p",
              {
                style: {
                  margin: "0 0 6px",
                  fontSize: "12px",
                  opacity: 0.75
                }
              },
              `\u7B2C ${row.n} \u7AE0\u6B63\u6587\uFF08\u9F20\u6807\u505C\u5728\u54EA\u4E00\u6BB5\uFF0C\u90A3\u6BB5\u53F3\u4FA7\u4EAE\u51FA \u{1F615}\u{1F5D1}\u270F\uFE0F \u63D0\u610F\u89C1\uFF09\uFF1A`
            ),
            (0, import_react5.createElement)(GoldReader, {
              text: shownText,
              opinions: rowOpinions,
              busy,
              onOpinion: (kind, wish, para, hint) => {
                if (postAction === void 0) return;
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
                if (postAction === void 0) return;
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
    (0, import_react5.createElement)(
      "p",
      { style: { margin: "8px 0 0", fontSize: "12px", opacity: 0.7 } },
      "\u{1F4CC} \u6BCF\u7AE0\u90FD\u81EA\u52A8\u5B58\u6863\uFF0C\u968F\u65F6\u80FD\u56DE\u5230\u4E0A\u4E00\u4E2A\u62CD\u677F\u70B9\uFF1B\u60F3\u6539\u66F4\u65E9\u7684\u51B3\u5B9A\uFF0C\u53BB\u5DE6\u4FA7\u8FC7\u7A0B\u5730\u56FE\u7528\u300C\u5B9A\u70B9\u4FEE\u6539\u300D\u3002"
    )
  );
}
function ProcessMapRail(props) {
  const { segments, status, browsingKey, onSelect } = props;
  const [copied, setCopied] = (0, import_react5.useState)(false);
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
  const row = (seg) => {
    const state = seg.status;
    const isCurrent = browsingKey === seg.key;
    return (0, import_react5.createElement)(
      "button",
      {
        key: seg.key,
        style: {
          display: "block",
          width: "100%",
          textAlign: "left",
          padding: "5px 8px",
          margin: "2px 0",
          fontSize: "12px",
          borderRadius: "6px",
          cursor: "pointer",
          background: isCurrent ? "var(--dsw-accent-soft, #eef2ff)" : state === "active" ? "var(--dsw-surface, #fff)" : state === "waiting-user" ? "#fff8e6" : "transparent",
          opacity: state === "pending" ? 0.45 : state === "done" ? 0.75 : 1,
          border: state === "waiting-user" ? "1px solid #e3b341" : "1px solid transparent",
          color: "inherit"
        },
        onClick: () => onSelect(seg.key),
        title: state === "waiting-user" ? "\u5728\u7B49\u4F60\u62CD\u677F/\u786E\u8BA4" : state === "active" ? "\u6B63\u5728\u505A" : state === "done" ? "\u5DF2\u5B8C\u6210\uFF0C\u70B9\u5F00\u56DE\u770B" : "\u8FD8\u6CA1\u5230\u8FD9\u4E00\u6B65"
      },
      `${state === "waiting-user" ? "\u26A1" : state === "done" ? "\xB7" : state === "active" ? "\u25B6" : "\u25CB"} ${seg.label}`,
      seg.status === "waiting-user" ? "\uFF08\u8F6E\u5230\u4F60\uFF09" : ""
    );
  };
  return (0, import_react5.createElement)(
    "div",
    {
      style: {
        width: "220px",
        flexShrink: 0,
        borderRight: "1px solid var(--dsw-border, #d0d7de)",
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }
    },
    (0, import_react5.createElement)(
      "div",
      { style: { flex: 1, minHeight: 0, overflowY: "auto" } },
      (0, import_react5.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontSize: "12px", opacity: 0.7 } },
        "\u{1F5FA} \u8FC7\u7A0B\u5730\u56FE\uFF08\u70B9\u4EFB\u610F\u4E00\u6B65\uFF1A\u56DE\u770B\uFF0C\u6216\u6539\u8FD9\u4E00\u6B65\u7684\u51B3\u5B9A\uFF09"
      ),
      ...(segments ?? []).map(row),
      (0, import_react5.createElement)(
        "p",
        { style: { margin: "8px 0 0", fontSize: "11px", opacity: 0.55 } },
        "\u26A1=\u5728\u7B49\u4F60 \xB7 \u25B6=\u6B63\u5728\u505A \xB7 \xB7=\u5DF2\u5B8C\u6210"
      )
    ),
    // 破卷常驻广告（2026-08-21 需求）：醒目好看、整块可点，造书进程中始终可见。
    (0, import_react5.createElement)(
      "a",
      {
        href: "https://www.socratopia.app/r/SCR-FEJXMQ",
        target: "_blank",
        rel: "noopener noreferrer",
        // F43（2026-08-20）：广告卡 flexShrink:0 常驻 rail 底部，地图滚动只滚自己的滚动条。
        style: {
          display: "block",
          marginTop: "6px",
          padding: "10px 10px 9px",
          borderRadius: "10px",
          flexShrink: 0,
          background: "linear-gradient(135deg, #4f6ef7 0%, #7a5cff 55%, #c04df7 100%)",
          color: "#ffffff",
          fontSize: "11px",
          lineHeight: 1.55,
          textDecoration: "none",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          boxShadow: "0 3px 10px rgba(79, 110, 247, 0.35)"
        }
      },
      (0, import_react5.createElement)(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "5px"
          }
        },
        (0, import_react5.createElement)("span", { style: { fontSize: "16px" } }, "\u{1F4DA}"),
        (0, import_react5.createElement)("strong", { style: { fontSize: "13px" } }, "\u3010\u7834\u5377\u3011"),
        (0, import_react5.createElement)(
          "span",
          {
            style: {
              fontSize: "10px",
              background: "rgba(255,255,255,0.22)",
              borderRadius: "4px",
              padding: "0 5px",
              lineHeight: "15px"
            }
          },
          "\u884D\u751F\u9879\u76EE"
        )
      ),
      (0, import_react5.createElement)("div", null, "\u628A\u9020\u597D\u7684\u4E66\u4EA4\u7ED9\u3010\u7834\u5377\u3011"),
      (0, import_react5.createElement)("div", null, "3A \u6C89\u6D78\u611F \xB7 3 \u500D\u5B66\u4E60\u6548\u7387"),
      (0, import_react5.createElement)(
        "div",
        { style: { marginTop: "5px", fontSize: "10px" } },
        "\u586B\u9080\u8BF7\u7801 ",
        (0, import_react5.createElement)(
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
    )
  );
}
function HistoryBrowser(props) {
  const { segment, meta, onDeepModify, onDeepUndo, busy } = props;
  const [confirming, setConfirming] = (0, import_react5.useState)(false);
  const [note, setNote] = (0, import_react5.useState)("");
  const undoable = meta?.lastDeepModify != null && Date.now() - meta.lastDeepModify.at <= 10 * 60 * 1e3;
  if (segment == null) return null;
  const downstreamText = (segment.downstream ?? []).length === 0 ? "\u8FD9\u4E00\u6B65\u4E4B\u540E\u6CA1\u6709\u4E0B\u6E38\u8981\u91CD\u505A" : `\u8981\u91CD\u505A\uFF1A${(segment.downstream ?? []).join(" -> ")}`;
  return (0, import_react5.createElement)(
    "div",
    { style: S.focus },
    (0, import_react5.createElement)(
      "strong",
      { style: { fontSize: "14px" } },
      `\u{1F5C2} \u56DE\u770B\uFF1A${segment.label ?? segment.key}`
    ),
    (0, import_react5.createElement)(
      "p",
      { style: { margin: "6px 0", fontSize: "12px", opacity: 0.75 } },
      `\u73B0\u5728\uFF1A${segment.status === "done" ? "\u5DF2\u5B8C\u6210" : segment.status === "waiting-user" ? "\u5728\u7B49\u4F60" : segment.status === "active" ? "\u8FDB\u884C\u4E2D" : "\u8FD8\u6CA1\u5230"}`,
      segment.decision != null ? ` \xB7 \u62CD\u677F\uFF1A${segment.decision.approved === true ? "\u2705 \u901A\u8FC7" : "\u274C \u9A73\u56DE"}${segment.decision.note ? `\uFF08${segment.decision.note}\uFF09` : ""}` : ""
    ),
    (segment.artifacts ?? []).length > 0 ? (0, import_react5.createElement)(
      "div",
      { style: { margin: "4px 0 8px" } },
      (0, import_react5.createElement)(
        "p",
        { style: { margin: "0 0 4px", fontSize: "12px", opacity: 0.8 } },
        "\u8FD9\u4E00\u6B65\u7684\u4EA7\u7269\uFF1A"
      ),
      ...(segment.artifacts ?? []).map(
        (rel) => (0, import_react5.createElement)(
          "button",
          {
            key: rel,
            style: { ...S.smallLink, display: "block", margin: "2px 0" },
            onClick: () => props.onView(rel),
            title: "\u70B9\u5F00\u770B\u5185\u5BB9"
          },
          `\u{1F4C4} ${rel}`
        )
      )
    ) : (0, import_react5.createElement)(
      "p",
      { style: { margin: "4px 0 8px", fontSize: "12px", opacity: 0.6 } },
      "\u8FD9\u4E00\u6B65\u6CA1\u6709\u7559\u4EA7\u7269\u3002"
    ),
    segment.key !== "chapters-review" && segment.canDeepModify === true ? confirming ? (0, import_react5.createElement)(
      "div",
      {
        style: {
          marginTop: "8px",
          borderTop: "1px dashed var(--dsw-border, #d0d7de)",
          paddingTop: "8px"
        }
      },
      (0, import_react5.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontWeight: 600 } },
        `\u270D\uFE0F \u5B9A\u70B9\u4FEE\u6539\u300C${segment.label}\u300D`
      ),
      (0, import_react5.createElement)(
        "p",
        {
          style: {
            margin: "0 0 6px",
            fontSize: "12px",
            color: "var(--dsw-danger, #cf222e)"
          }
        },
        `\u5F71\u54CD\u9884\u544A\uFF1A${downstreamText}\u3002`
      ),
      (0, import_react5.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontSize: "12px", opacity: 0.75 } },
        "\u4F60\u7684\u98CE\u683C\u7EBF\u548C\u8C41\u514D\u539F\u6837\u4FDD\u7559\uFF1B\u6BCF\u4E00\u6B65\u4ECD\u4F1A\u6765\u8BF7\u4F60\u62CD\u677F\uFF1B\u65E7\u7248\u672C\u5168\u90E8\u7559\u6863\uFF1B10 \u5206\u949F\u5185\u53EF\u4E00\u952E\u64A4\u9500\u3002"
      ),
      (0, import_react5.createElement)("textarea", {
        style: S.textarea,
        placeholder: "\u8FD9\u6B21\u8981\u6539\u6210\u4EC0\u4E48\uFF1F\u5199\u4E00\u53E5\uFF08\u5FC5\u586B\uFF09",
        value: note,
        onChange: (e) => setNote(e.target.value)
      }),
      (0, import_react5.createElement)(
        "div",
        { style: { marginTop: "8px", display: "flex", gap: "8px" } },
        (0, import_react5.createElement)(
          "button",
          {
            style: S.bigBtn(false),
            disabled: busy || note.trim() === "",
            onClick: () => {
              onDeepModify(segment.key, note.trim());
              setConfirming(false);
              setNote("");
            }
          },
          "\u270D\uFE0F \u5C31\u8FD9\u4E48\u6539\uFF0C\u91CD\u505A\u4E0B\u6E38"
        ),
        (0, import_react5.createElement)(
          "button",
          {
            style: S.smallLink,
            onClick: () => {
              setConfirming(false);
              setNote("");
            }
          },
          "\u53D6\u6D88"
        )
      )
    ) : (0, import_react5.createElement)(
      "div",
      null,
      (0, import_react5.createElement)(
        "p",
        {
          style: {
            margin: "4px 0 6px",
            fontSize: "12px",
            opacity: 0.7
          }
        },
        "\u60F3\u6539\u8FD9\u4E00\u6B65\u5F53\u65F6\u600E\u4E48\u5B9A\u7684\uFF1FAI \u4F1A\u4ECE\u8FD9\u91CC\u91CD\u505A\u540E\u9762\u53D7\u5F71\u54CD\u7684\u90E8\u5206\uFF0C\u65E7\u7248\u672C\u90FD\u7559\u6863\u3002"
      ),
      (0, import_react5.createElement)(
        "button",
        {
          style: {
            ...S.bigBtn(true),
            background: "transparent",
            color: "var(--dsw-danger, #cf222e)"
          },
          onClick: () => setConfirming(true),
          disabled: busy
        },
        "\u270D\uFE0F \u5B9A\u70B9\u4FEE\u6539\u8FD9\u4E00\u6B65"
      )
    ) : null,
    undoable ? (0, import_react5.createElement)(
      "button",
      {
        style: { ...S.smallLink, textDecoration: "none", marginTop: "8px" },
        disabled: busy,
        onClick: onDeepUndo
      },
      "\u21A9\uFE0F \u64A4\u9500\u521A\u624D\u7684\u5B9A\u70B9\u4FEE\u6539\uFF0810 \u5206\u949F\u5185\uFF09"
    ) : null,
    (0, import_react5.createElement)(
      "p",
      { style: { margin: "10px 0 0", fontSize: "12px", opacity: 0.7 } },
      "\u60F3\u95EE\u300E\u5F53\u65F6\u4E3A\u4EC0\u4E48\u8FD9\u4E48\u5B9A\u300F\uFF1F\u5728\u5BF9\u8BDD\u91CC\u544A\u8BC9 AI \u4F60\u6B63\u5728\u770B\u54EA\u4E00\u6B65\uFF08\u6BD4\u5982\u300E\u7B2C 2 \u5173\u4E3A\u4EC0\u4E48\u8FD9\u4E48\u5B9A\u300F\uFF09\uFF0C\u5B83\u4F1A\u7FFB\u8D26\u672C\u7528\u5927\u767D\u8BDD\u7B54\u3002"
    )
  );
}
function foldKnowledgeMap(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (data === null || typeof data !== "object") return null;
  const lines = [];
  const chapters = Array.isArray(data.chapterSuggestion) ? data.chapterSuggestion : [];
  if (chapters.length > 0) {
    lines.push(`\u{1F4DA} \u7AE0\u8282\u5EFA\u8BAE\uFF08${chapters.length} \u7AE0\uFF09`);
    chapters.forEach((chapter, index) => {
      const title = String(chapter?.title ?? "").trim();
      const src = String(chapter?.source ?? "").trim();
      lines.push(`${index + 1}. ${title}${src !== "" ? `\u3000\u2190 ${src}` : ""}`);
    });
    lines.push("");
  }
  const kps = Array.isArray(data.knowledgePoints) ? data.knowledgePoints : [];
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
  const materials = Array.isArray(data.materials) ? data.materials : [];
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
function FileViewer(props) {
  const { viewing, viewText, onClose } = props;
  const isKm = typeof viewing?.path === "string" && viewing.path.endsWith("knowledge-map.json");
  const folded = isKm ? foldKnowledgeMap(viewText) : null;
  return (0, import_react5.createElement)(
    "div",
    {
      style: {
        marginTop: "8px",
        border: "1px solid var(--dsw-border, #d0d7de)",
        borderRadius: "8px",
        padding: "10px"
      }
    },
    (0, import_react5.createElement)(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }
      },
      (0, import_react5.createElement)(
        "strong",
        { style: { fontSize: "13px" } },
        `\u{1F4C4} ${viewing.label}`
      ),
      (0, import_react5.createElement)(
        "button",
        { style: S.smallLink, onClick: onClose },
        "\u2715 \u6536\u8D77"
      )
    ),
    (0, import_react5.createElement)(
      "pre",
      {
        style: {
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          background: "var(--dsw-surface, #fff)",
          borderRadius: "8px",
          padding: "10px",
          maxHeight: "320px",
          overflow: "auto",
          fontSize: "12px",
          marginTop: "6px"
        }
      },
      folded !== null ? folded : viewText
    )
  );
}
function BrowseSection(props) {
  const {
    segment,
    meta,
    busy,
    viewing,
    viewText,
    onBack,
    onView,
    onDeepModify,
    onDeepUndo,
    onCloseView
  } = props;
  return (0, import_react5.createElement)(
    "div",
    { style: { marginBottom: "8px" } },
    (0, import_react5.createElement)(
      "button",
      { style: S.smallLink, onClick: onBack },
      "\u23EA \u56DE\u5230\u73B0\u5728"
    ),
    (0, import_react5.createElement)(HistoryBrowser, {
      segment,
      meta,
      busy,
      onView,
      onDeepModify,
      onDeepUndo
    }),
    viewing !== null && viewText !== null ? (0, import_react5.createElement)(FileViewer, { viewing, viewText, onClose: onCloseView }) : null
  );
}

// src/ui/confirm-cards.js
var import_react6 = require("react");
var DIFF_COLORS = {
  \u57FA\u7840: "#1a7f37",
  \u91CD\u70B9: "#9a6700",
  \u96BE\u70B9: "#cf222e",
  \u8FDB\u9636: "#8250df"
};
var RE_EXPLORE_REASONS = [
  "\u6709\u7684\u6750\u6599\u6CA1\u8BFB\u5168",
  "\u77E5\u8BC6\u70B9\u6574\u7406\u5F97\u592A\u7C97",
  "\u7AE0\u8282\u5EFA\u8BAE\u4E0D\u5408\u7406",
  "\u91CD\u70B9\u96BE\u70B9\u5224\u65AD\u4E0D\u5BF9"
];
function ExploreConfirmCard(props) {
  const {
    exploreSummary,
    project,
    session,
    onConfirm,
    onViewReport,
    busy,
    reportText
  } = props;
  const sum = exploreSummary ?? {};
  const focus = normalizeTeachingFocus(sum.teachingFocus);
  const [showPoints, setShowPoints] = (0, import_react6.useState)(false);
  const [showSections, setShowSections] = (0, import_react6.useState)(false);
  const [rejecting, setRejecting] = (0, import_react6.useState)(false);
  const [reasons, setReasons] = (0, import_react6.useState)([]);
  const [rejectNote, setRejectNote] = (0, import_react6.useState)("");
  const [km, setKm] = (0, import_react6.useState)(null);
  (0, import_react6.useEffect)(() => {
    let alive = true;
    setKm(null);
    if (project === null || project === void 0) return void 0;
    fetch(
      `/textbook/file?session=${encodeURIComponent(session)}&project=${encodeURIComponent(project)}&path=${encodeURIComponent("work/knowledge-map.json")}`
    ).then(
      (res) => res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`))
    ).then((text) => {
      try {
        const parsed = JSON.parse(text);
        if (alive) setKm(parsed);
      } catch {
      }
    }).catch(() => {
    });
    return () => {
      alive = false;
    };
  }, [project, session]);
  const [report, setReport] = (0, import_react6.useState)(
    () => typeof reportText === "string" && reportText !== "" ? reportText : null
  );
  (0, import_react6.useEffect)(() => {
    let alive = true;
    if (typeof reportText === "string" && reportText !== "") {
      setReport(reportText);
      return void 0;
    }
    setReport(null);
    if (project === null || project === void 0) return void 0;
    fetch(
      `/textbook/file?session=${encodeURIComponent(session)}&project=${encodeURIComponent(project)}&path=${encodeURIComponent("work/explore.md")}`
    ).then(
      (res) => res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`))
    ).then((text) => {
      if (alive) setReport(text);
    }).catch(() => {
    });
    return () => {
      alive = false;
    };
  }, [project, session, reportText]);
  const reportBlocks = report !== null && report !== "" ? exploreReportBlocks(report) : [];
  const kps = Array.isArray(km?.knowledgePoints) ? km.knowledgePoints : [];
  const chapters = Array.isArray(km?.chapterSuggestion) ? km.chapterSuggestion : [];
  const sections = Array.isArray(km?.materials) ? km.materials : [];
  const sectionTitles = (material) => Array.isArray(material?.sections) ? material.sections.map((s) => String(s?.title ?? "")).filter((t) => t !== "") : [];
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
  return (0, import_react6.createElement)(
    "div",
    { style: S.focus },
    reportBlocks.length > 0 ? (0, import_react6.createElement)(
      "div",
      { style: { ...S.card, marginBottom: "10px" } },
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontSize: "12px", opacity: 0.8 } },
        "\u{1F4CB} \u6E90\u63A2\u67E5\u62A5\u544A\uFF08AI \u901A\u8BFB\u540E\u7684\u5B8C\u6574\u8BB0\u5F55\uFF09\uFF1A"
      ),
      ...reportBlocks
    ) : null,
    (0, import_react6.createElement)(
      "strong",
      { style: { fontSize: "14px" } },
      "\u{1F50D} \u6E90\u63A2\u67E5\u505A\u5B8C\u4E86\uFF01"
    ),
    (0, import_react6.createElement)(
      "p",
      { style: { margin: "6px 0" } },
      `AI \u5DF2\u901A\u8BFB\u4F60\u7684\u6559\u6750\uFF0C\u6574\u7406\u51FA\uFF1A\u6765\u6E90\u6750\u6599 ${sum.sources ?? 0} \u4EFD \xB7 \u77E5\u8BC6\u70B9 ${sum.knowledgePoints ?? 0} \u4E2A \xB7 \u5EFA\u8BAE\u5206 ${sum.chapterSuggestion ?? 0} \u7AE0\u3002`
    ),
    focus.length > 0 ? (0, import_react6.createElement)(
      "div",
      {
        style: {
          margin: "4px 0 8px",
          padding: "8px 10px",
          background: "var(--dsw-surface, #fff)",
          borderRadius: "8px",
          border: "1px solid var(--dsw-border, #d0d7de)"
        }
      },
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "0 0 4px", fontSize: "12px", opacity: 0.8 } },
        "AI \u5224\u65AD\u7684\u91CD\u70B9/\u96BE\u70B9\uFF1A"
      ),
      focus.map(
        (item, index) => (0, import_react6.createElement)(
          "div",
          { key: index, style: { fontSize: "12px", margin: "2px 0" } },
          `\xB7 ${item}`
        )
      )
    ) : null,
    chapters.length > 0 ? (0, import_react6.createElement)(
      "div",
      {
        style: {
          margin: "4px 0 8px",
          padding: "8px 10px",
          background: "var(--dsw-surface, #fff)",
          borderRadius: "8px",
          border: "1px solid var(--dsw-border, #d0d7de)"
        }
      },
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "0 0 4px", fontSize: "12px", opacity: 0.8 } },
        "\u{1F4DA} AI \u5EFA\u8BAE\u7684\u7AE0\u8282\u5B89\u6392\uFF08\u540E\u7EED\u53EF\u518D\u8C03\uFF09\uFF1A"
      ),
      chapters.map(
        (chapter, index) => (0, import_react6.createElement)(
          "div",
          { key: index, style: { fontSize: "12px", margin: "2px 0" } },
          `${index + 1}. ${chapter.title ?? ""}`,
          chapter.source !== void 0 && chapter.source !== "" && chapter.source !== null ? (0, import_react6.createElement)(
            "span",
            { style: { opacity: 0.6 } },
            `\u3000\u2190 ${chapter.source}`
          ) : null
        )
      )
    ) : null,
    kps.length > 0 ? (0, import_react6.createElement)(
      "div",
      { style: { margin: "4px 0 8px" } },
      (0, import_react6.createElement)(
        "button",
        { style: S.smallLink, onClick: () => setShowPoints(!showPoints) },
        showPoints ? `\u25BE \u6536\u8D77\u77E5\u8BC6\u70B9\u6E05\u5355\uFF08${kps.length} \u4E2A\uFF09` : `\u25B8 \u77E5\u8BC6\u70B9\u6E05\u5355\uFF08${kps.length} \u4E2A\uFF0C\u70B9\u5F00\u770B\uFF09`
      ),
      showPoints ? (0, import_react6.createElement)(
        "div",
        {
          style: {
            marginTop: "6px",
            padding: "8px 10px",
            background: "var(--dsw-surface, #fff)",
            borderRadius: "8px",
            border: "1px solid var(--dsw-border, #d0d7de)"
          }
        },
        kps.map(
          (point, index) => (0, import_react6.createElement)(
            "div",
            {
              key: index,
              style: { fontSize: "12px", margin: "2px 0" }
            },
            `\xB7 ${point.title ?? ""}`,
            point.difficulty !== void 0 && point.difficulty !== "" && point.difficulty !== null ? (0, import_react6.createElement)(
              "span",
              {
                style: {
                  color: DIFF_COLORS[point.difficulty] ?? "#57606a"
                }
              },
              `\uFF08${point.difficulty}\uFF09`
            ) : null,
            point.source !== void 0 && point.source !== "" && point.source !== null ? (0, import_react6.createElement)(
              "span",
              { style: { opacity: 0.5 } },
              ` ${point.source}`
            ) : null
          )
        )
      ) : null
    ) : null,
    sections.length > 0 ? (0, import_react6.createElement)(
      "div",
      { style: { margin: "4px 0 8px" } },
      (0, import_react6.createElement)(
        "button",
        {
          style: S.smallLink,
          onClick: () => setShowSections(!showSections)
        },
        showSections ? "\u25BE \u6536\u8D77\u6BCF\u672C\u6750\u6599\u91CC\u8BFB\u5230\u7684\u5C0F\u8282" : "\u25B8 \u6BCF\u672C\u6750\u6599\u91CC\u8BFB\u5230\u7684\u5C0F\u8282\uFF08\u70B9\u5F00\u770B\uFF09"
      ),
      showSections ? (0, import_react6.createElement)(
        "div",
        {
          style: {
            marginTop: "6px",
            padding: "8px 10px",
            background: "var(--dsw-surface, #fff)",
            borderRadius: "8px",
            border: "1px solid var(--dsw-border, #d0d7de)"
          }
        },
        sections.map((material, index) => {
          const titles = sectionTitles(material);
          return (0, import_react6.createElement)(
            "div",
            {
              key: index,
              style: { fontSize: "12px", margin: "2px 0" }
            },
            `\u8D44\u6599${material?.num ?? index + 1}\uFF1A`,
            (0, import_react6.createElement)(
              "span",
              { style: { opacity: 0.8 } },
              titles.join(" / ") || "\uFF08\u672A\u8BFB\u5230\u5C0F\u8282\u6807\u9898\uFF09"
            )
          );
        })
      ) : null
    ) : null,
    (0, import_react6.createElement)(
      "p",
      { style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
      "\u8FD9\u662F\u540E\u9762\u6240\u6709\u8BBE\u8BA1\u7684\u57FA\u7840\u3002\u6EE1\u610F\u5C31\u7EE7\u7EED\uFF1B\u4E0D\u6EE1\u610F\u70B9\u300C\u91CD\u505A\u300D\uFF0C\u52FE\u4E2A\u7406\u7531\u6216\u5199\u4E00\u53E5\u54EA\u91CC\u4E0D\u6EE1\u610F\uFF0CAI \u4F1A\u7167\u7740\u6539\uFF08\u4E0D\u586B\u4E5F\u80FD\u91CD\u505A\uFF09\u3002"
    ),
    rejecting ? (0, import_react6.createElement)(
      "div",
      {
        style: {
          marginTop: "10px",
          borderTop: "1px dashed var(--dsw-border, #d0d7de)",
          paddingTop: "8px"
        }
      },
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontWeight: 600 } },
        "\u54EA\u91CC\u4E0D\u6EE1\u610F\uFF1F\uFF08\u70B9\u9009\u6216\u5199\u4E00\u53E5\uFF0C10 \u79D2\u5185\u641E\u5B9A\uFF09"
      ),
      (0, import_react6.createElement)(
        "div",
        { style: { margin: "6px 0" } },
        RE_EXPLORE_REASONS.map(
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
        )
      ),
      (0, import_react6.createElement)("textarea", {
        style: S.textarea,
        placeholder: "\u60F3\u591A\u8BF4\u4E00\u53E5\uFF1F\u5728\u8FD9\u91CC\u5199\uFF08\u53EF\u9009\uFF09",
        value: rejectNote,
        onChange: (e) => setRejectNote(e.target.value)
      }),
      (0, import_react6.createElement)(
        "div",
        { style: { marginTop: "8px", display: "flex", gap: "8px" } },
        (0, import_react6.createElement)(
          "button",
          {
            style: S.bigBtn(false),
            onClick: () => onConfirm(false, { reasons, note: rejectNote }),
            disabled: busy
          },
          "\u{1F501} \u5C31\u8FD9\u6837\u91CD\u505A"
        ),
        (0, import_react6.createElement)(
          "button",
          {
            style: { ...S.smallLink, textDecoration: "none" },
            onClick: cancelReject
          },
          "\u53D6\u6D88"
        )
      )
    ) : (0, import_react6.createElement)(
      "div",
      { style: { display: "flex", gap: "8px", flexWrap: "wrap" } },
      (0, import_react6.createElement)(
        "button",
        {
          style: S.bigBtn(true),
          onClick: () => onConfirm(true),
          disabled: busy
        },
        "\u2705 \u6EE1\u610F\uFF0C\u7EE7\u7EED\u8BBE\u8BA1"
      ),
      (0, import_react6.createElement)(
        "button",
        {
          style: {
            ...S.bigBtn(true),
            background: "transparent",
            color: "var(--dsw-danger, #cf222e)"
          },
          onClick: () => setRejecting(true),
          disabled: busy
        },
        "\u{1F501} \u8BA9 AI \u91CD\u505A"
      ),
      (0, import_react6.createElement)(
        "button",
        {
          style: { ...S.smallLink, textDecoration: "none" },
          onClick: onViewReport,
          disabled: busy
        },
        "\u{1F440} \u770B\u5B8C\u6574\u62A5\u544A"
      )
    )
  );
}
function OutlineConfirmCard(props) {
  const { meta, busy, onConfirm } = props;
  const [rejecting, setRejecting] = (0, import_react6.useState)(false);
  const [note, setNote] = (0, import_react6.useState)("");
  const chapters = meta?.outline?.chapters ?? [];
  const totalWords = chapters.reduce(
    (sum, chapter) => sum + (Number.isFinite(chapter?.targetWords) ? chapter.targetWords : 0),
    0
  );
  const [goldPick, setGoldPick] = (0, import_react6.useState)(() => {
    const initial = Number(meta?.goldChapter ?? 1);
    return Number.isSafeInteger(initial) && initial >= 1 && initial <= chapters.length ? initial : 1;
  });
  const goldReason = typeof meta?.goldChapterReason === "string" ? meta.goldChapterReason : "";
  const safePick = Number.isSafeInteger(Number(goldPick)) && Number(goldPick) >= 1 && Number(goldPick) <= chapters.length ? Number(goldPick) : 1;
  return (0, import_react6.createElement)(
    "div",
    { style: S.focus },
    (0, import_react6.createElement)(
      "strong",
      { style: { fontSize: "14px" } },
      "\u{1F4D0} \u7AE0\u8282\u5B89\u6392\u51FA\u6765\u4E86\uFF01"
    ),
    (0, import_react6.createElement)(
      "p",
      { style: { margin: "6px 0" } },
      `AI \u8BA1\u5212\u628A\u8FD9\u672C\u4E66\u5206\u6210 ${chapters.length} \u7AE0${totalWords > 0 ? `\uFF0C\u5168\u4E66\u5927\u7EA6 ${totalWords} \u5B57` : ""}\u3002\u6BCF\u7AE0\u6807\u597D\u4E86\u7528\u6750\u6599\u7684\u54EA\u4E00\u5757\u3001\u8986\u76D6\u54EA\u4E9B\u77E5\u8BC6\u70B9\u3001\u5927\u6982\u5199\u591A\u957F\u3002\u6EE1\u610F\u70B9\u300C\u901A\u8FC7\u300D\uFF0CAI \u5148\u5199\u6700\u4F73\u8303\u4F8B\u7AE0\uFF08\u7B2C ${safePick} \u7AE0\u5F53\u5168\u4E66\u6837\u677F\uFF09\u7ED9\u4F60\u8FC7\u76EE\uFF1B\u8981\u8C03\u5C31\u70B9\u300C\u63D0\u6539\u8FDB\u65B9\u5411\u300D\u3002`
    ),
    (0, import_react6.createElement)(
      "div",
      {
        style: {
          margin: "4px 0 8px",
          padding: "8px 10px",
          background: "var(--dsw-surface, #fff)",
          borderRadius: "8px",
          border: "1px solid var(--dsw-border, #d0d7de)"
        }
      },
      chapters.map((chapter, index) => {
        const pointsArr = Array.isArray(chapter?.points) ? chapter.points.map((pt) => String(pt ?? "").trim()).filter((pt) => pt !== "") : [];
        const points = pointsArr.join(" / ");
        const volumeReason = typeof chapter?.volumeReason === "string" ? chapter.volumeReason : "";
        return (0, import_react6.createElement)(
          "div",
          { key: index, style: { fontSize: "12px", margin: "4px 0" } },
          `${index + 1}. ${chapter.title ?? ""}`,
          chapter.outline !== void 0 && chapter.outline !== "" && chapter.outline !== null ? (0, import_react6.createElement)(
            "span",
            { style: { opacity: 0.6 } },
            `\u3000${chapter.outline}`
          ) : null,
          (0, import_react6.createElement)(
            "div",
            { style: { opacity: 0.6, margin: "1px 0 0" } },
            [
              chapter.source !== void 0 && chapter.source !== "" && chapter.source !== null ? `\u6E90\uFF1A${chapter.source}` : null,
              Number.isFinite(chapter.targetWords) ? `\u7EA6 ${chapter.targetWords} \u5B57` : null
            ].filter(Boolean).join(" \xB7 ")
          ),
          pointsArr.length > 0 ? (0, import_react6.createElement)(
            "div",
            { style: { opacity: 0.6, margin: "1px 0 0" } },
            `\u8986\u76D6\u77E5\u8BC6\u70B9 ${pointsArr.length} \u4E2A${points !== "" ? `\uFF1A${points}` : ""}`
          ) : null,
          volumeReason !== "" ? (0, import_react6.createElement)(
            "div",
            {
              style: { opacity: 0.5, fontSize: "11px", margin: "1px 0 0" }
            },
            `\u4F53\u91CF\u4F9D\u636E\uFF1A${volumeReason}`
          ) : null
        );
      })
    ),
    (0, import_react6.createElement)(
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
      (0, import_react6.createElement)(
        "span",
        { style: { fontSize: "12px" } },
        `\u{1F4D0} AI \u5EFA\u8BAE\u7528\u7B2C ${safePick} \u7AE0\u5F53\u6837\u4F8B\u7AE0\uFF1A${goldReason !== "" ? goldReason : "\uFF08\u672A\u7ED9\u7406\u7531\uFF09"}`
      ),
      chapters.length > 1 ? (0, import_react6.createElement)(
        "select",
        {
          style: {
            fontSize: "12px",
            padding: "2px 4px",
            borderRadius: "6px",
            border: "1px solid var(--dsw-border, #d0d7de)",
            background: "var(--dsw-surface, #fff)"
          },
          value: safePick,
          onChange: (e) => setGoldPick(Number(e.target.value)),
          disabled: busy
        },
        chapters.map(
          (chapter, index) => (0, import_react6.createElement)(
            "option",
            { key: index, value: index + 1 },
            `${index + 1}. ${chapter.title ?? ""}`
          )
        )
      ) : null,
      chapters.length > 1 ? (0, import_react6.createElement)(
        "span",
        { style: { fontSize: "11px", opacity: 0.6 } },
        "\uFF08\u53EF\u6539\u9009\uFF09"
      ) : null
    ),
    rejecting ? (0, import_react6.createElement)(
      "div",
      {
        style: {
          marginTop: "10px",
          borderTop: "1px dashed var(--dsw-border, #d0d7de)",
          paddingTop: "8px"
        }
      },
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontWeight: 600 } },
        "\u6539\u54EA\u91CC\uFF1F\u5199\u4E00\u53E5\uFF08\u6BD4\u5982\uFF1A\u7B2C3\u7AE0\u62C6\u6210\u4E24\u7AE0 / \u6BCF\u7AE0\u5B57\u6570\u592A\u591A\uFF09"
      ),
      (0, import_react6.createElement)("textarea", {
        style: S.textarea,
        placeholder: "\u60F3\u600E\u4E48\u8C03\uFF0C\u5199\u5728\u8FD9\u91CC\uFF08\u53EF\u4E0D\u586B\uFF0CAI \u4F1A\u81EA\u5DF1\u91CD\u65B0\u5B89\u6392\uFF09",
        value: note,
        onChange: (e) => setNote(e.target.value)
      }),
      (0, import_react6.createElement)(
        "div",
        { style: { marginTop: "8px", display: "flex", gap: "8px" } },
        (0, import_react6.createElement)(
          "button",
          {
            style: S.bigBtn(false),
            onClick: () => onConfirm(false, note.trim()),
            disabled: busy
          },
          "\u{1F501} \u5C31\u8FD9\u6837\u91CD\u65B0\u5B89\u6392"
        ),
        (0, import_react6.createElement)(
          "button",
          {
            style: { ...S.smallLink, textDecoration: "none" },
            onClick: () => {
              setRejecting(false);
              setNote("");
            },
            disabled: busy
          },
          "\u53D6\u6D88"
        )
      )
    ) : (0, import_react6.createElement)(
      "div",
      { style: { display: "flex", gap: "8px", flexWrap: "wrap" } },
      (0, import_react6.createElement)(
        "button",
        {
          style: S.bigBtn(true),
          onClick: () => onConfirm(true, note, safePick),
          disabled: busy
        },
        "\u2705 \u901A\u8FC7\uFF0C\u5F00\u59CB\u5199\u8303\u4F8B\u7AE0"
      ),
      (0, import_react6.createElement)(
        "button",
        {
          style: {
            ...S.bigBtn(true),
            background: "transparent",
            color: "var(--dsw-danger, #cf222e)"
          },
          onClick: () => setRejecting(true),
          disabled: busy
        },
        "\u{1F501} \u63D0\u6539\u8FDB\u65B9\u5411"
      )
    )
  );
}

// src/ui/panels.js
var import_react7 = require("react");
function StatusStrip(props) {
  const { meta, gate, pendingStage, progressDetail, metaLabel } = props;
  const status = meta?.status ?? "active";
  const phase = meta?.phase ?? 1;
  let text = null;
  let tone = "normal";
  if (status === "delivered") {
    text = `\u{1F389} \u4E66\u505A\u597D\u4E86 \xB7 \u53EF\u4EE5\u9884\u89C8\u548C\u4E0B\u8F7D\u300A${meta.name ?? ""}\u300B.md`;
    tone = "ok";
  } else if (status === "error" || status === "needs-config") {
    text = status === "error" ? "\u26A0\uFE0F \u51FA\u9519\u4E86 \xB7 \u8BF7\u770B\u4E0B\u9762\u7684\u63D0\u793A" : "\u{1F511} \u9700\u8981\u914D\u7F6E \xB7 \u8BF7\u770B\u4E0B\u9762\u7684\u63D0\u793A";
    tone = "error";
  } else if (gate !== null && gate.status === "awaiting") {
    text = `\u26A1 \u8F6E\u5230\u4F60 \xB7 \u62CD\u677F\u7B2C ${gate.gate} \u5173`;
    tone = "you";
  } else if (status === "awaiting-gold") {
    text = "\u26A1 \u8F6E\u5230\u4F60 \xB7 \u786E\u8BA4\u6700\u4F73\u8303\u4F8B\u7AE0";
    tone = "you";
  } else if (status === "awaiting-explore") {
    text = "\u26A1 \u8F6E\u5230\u4F60 \xB7 \u786E\u8BA4\u63A2\u67E5\u7ED3\u679C";
    tone = "you";
  } else if (phase === 1) {
    text = "\u{1F4E4} \u8F6E\u5230\u4F60 \xB7 \u4E0A\u4F20\u6559\u6750\uFF08\u5F00\u59CB\u8F6C\u6362\u540E AI \u4F1A\u81EA\u52A8\u63A5\u624B\uFF09";
    tone = "you";
  } else if (pendingStage !== null && pendingStage !== void 0) {
    text = `\u{1F916} AI \u5E72\u6D3B\u4E2D \xB7 ${metaLabel ?? ""}${progressDetail ? `\u3000\u23F3 ${progressDetail}` : ""}`;
    tone = "ai";
  } else {
    text = "\u{1F916} AI \u6B63\u5728\u51C6\u5907\u4E0B\u4E00\u6B65\u2026";
    tone = "ai";
  }
  const bg = {
    ok: "var(--dsw-success-soft, #dafbe1)",
    you: "var(--dsw-warn-soft, #fff8e1)",
    ai: "var(--dsw-accent-soft, #eef2ff)",
    error: "var(--dsw-danger-soft, #ffebe9)",
    normal: "transparent"
  }[tone];
  const border = {
    ok: "#1a7f37",
    you: "#d4a72c",
    ai: "var(--dsw-accent, #4f6ef7)",
    error: "var(--dsw-danger, #cf222e)",
    normal: "transparent"
  }[tone];
  return (0, import_react7.createElement)(
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
function ActivityLine(props) {
  const { meta, aiActive, onNudge, subagents } = props;
  const staleMs = meta != null ? Date.now() - (meta.updatedAt ?? 0) : 0;
  const agg = { running: 0, inactive: 0, ...subagents ?? {} };
  const aggText = [
    agg.running > 0 ? `\u{1F50E} ${agg.running} \u4E2A\u5BA1\u8BA1\u5728\u8DD1` : null,
    agg.inactive > 0 ? `\u{1F4E5} ${agg.inactive} \u4E2A\u5B8C\u6210\u5F85\u6536` : null
  ].filter(Boolean).join(" \xB7 ");
  const content = aiActive ? "\u{1F916} AI \u56DE\u5408\u8FDB\u884C\u4E2D" : meta?.status === "running" ? (0, import_react7.createElement)(
    "span",
    null,
    `\u23F1 \u8D26\u9762 ${Math.round(staleMs / 6e4)} \u5206\u949F\u6CA1\u52A8\u9759 `,
    (0, import_react7.createElement)(
      "button",
      {
        style: S.smallLink,
        onClick: onNudge,
        title: "\u7ED9\u4E3B AI \u53D1\u4E00\u6761\u63D0\u9192\uFF0C\u8BA9\u5B83\u7EE7\u7EED\u63A8\u8FDB\uFF08\u4E0D\u6253\u65AD\u5B83\u6B63\u5728\u505A\u7684\u4E8B\uFF0C\u4E5F\u4E0D\u4F1A\u53D6\u6D88\uFF09"
      },
      "[\u6233\u4E00\u4E0B AI]"
    )
  ) : "\u26A1 \u7B49\u4F60\u62CD\u677F/\u786E\u8BA4";
  return (0, import_react7.createElement)(
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
    aggText !== "" ? (0, import_react7.createElement)(
      "span",
      { style: { fontWeight: 600, color: "#0969da" } },
      aggText
    ) : null,
    content
  );
}
function InterruptNote(props) {
  return (0, import_react7.createElement)(
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
        background: "var(--dsw-accent-soft, #eef2ff)",
        border: "1px solid var(--dsw-accent, #4f6ef7)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }
    },
    (0, import_react7.createElement)(
      "span",
      { style: { flex: 1 } },
      "\u{1F4A1} \u5DF2\u8BB0\u4E0B\uFF1B\u4E0D\u6253\u65AD\u6B63\u5728\u5199\u7684\u8FD9\u4E00\u7AE0\uFF0CAI \u5230\u4E0B\u4E2A\u505C\u9760\u70B9\u4F1A\u7167\u529E"
    ),
    (0, import_react7.createElement)(
      "button",
      { style: S.smallLink, onClick: props.onClose },
      "\u2715"
    )
  );
}
var AUTO_FOLLOW_KEYFRAMES = "@keyframes dsh-auto-follow-in { from { transform: translateY(-10px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }";
var AUTO_FOLLOW_BANNER_STYLE = {
  position: "sticky",
  top: 0,
  zIndex: 20,
  margin: "0 0 10px",
  padding: "8px 12px",
  borderRadius: "8px",
  fontSize: "13px",
  background: "var(--dsw-accent-soft, #eef2ff)",
  border: "1px solid var(--dsw-accent, #4f6ef7)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  animation: "dsh-auto-follow-in 0.25s ease"
};
function AutoFollowAwaitNote(props) {
  return (0, import_react7.createElement)(
    "div",
    { role: "status", style: AUTO_FOLLOW_BANNER_STYLE },
    (0, import_react7.createElement)("style", null, AUTO_FOLLOW_KEYFRAMES),
    (0, import_react7.createElement)(
      "span",
      { style: { flex: 1 } },
      "\u26A1 AI \u5728\u7B49\u4F60\u62CD\u677F\uFF0C\u5DF2\u5207\u56DE\u73B0\u5728"
    ),
    (0, import_react7.createElement)(
      "button",
      { style: S.smallLink, onClick: props.onClose },
      "\u2715"
    )
  );
}
function AutoFollowProgressNote(props) {
  const onDismiss = props.onDismiss ?? (() => {
  });
  return (0, import_react7.createElement)(
    "div",
    {
      role: "status",
      style: { ...AUTO_FOLLOW_BANNER_STYLE, cursor: "pointer" },
      onClick: props.onJump
    },
    (0, import_react7.createElement)("style", null, AUTO_FOLLOW_KEYFRAMES),
    (0, import_react7.createElement)("span", { style: { flex: 1 } }, "\u25B6 AI \u6B63\u5728\u5E72\u6D3B--\u70B9\u6B64\u8DF3\u8FC7\u53BB"),
    (0, import_react7.createElement)(
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
  return (0, import_react7.createElement)(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 8px",
        borderBottom: "1px solid var(--dsw-border, #d0d7de)",
        flexWrap: "wrap"
      }
    },
    (0, import_react7.createElement)("strong", null, `\u300A${meta?.name ?? ""}\u300B`),
    (0, import_react7.createElement)(
      "span",
      { style: { fontSize: "12px", opacity: 0.75 } },
      `\u4E00\u8D77\u505A\u5230\uFF1A${PHASES.find((x) => x.n === meta?.phase)?.label ?? ""}`
    ),
    (0, import_react7.createElement)("span", { style: { flex: 1 } }),
    styleCount > 0 ? (0, import_react7.createElement)(
      "button",
      {
        style: S.smallLink,
        onClick: openStylePanel,
        title: "\u4F60\u7684\u98CE\u683C\u610F\u89C1\u6E05\u5355\uFF08AI \u5199\u6BCF\u4E00\u7AE0\u90FD\u4F1A\u7167\u7740\u529E\uFF09"
      },
      `\u{1F3A8} \u98CE\u683C\u7EBF(${styleCount})`
    ) : null,
    pendingCount > 0 ? (0, import_react7.createElement)(
      "button",
      {
        style: S.smallLink,
        onClick: openIntervene,
        title: "\u7559\u8A00\u7A0D\u540E\u5904\u7406\uFF1A\u4E0D\u6253\u65AD AI\uFF0C\u5B83\u5230\u4E0B\u4E2A\u505C\u9760\u70B9\u4F1A\u770B"
      },
      `\u{1F4EE} \u7559\u8A00(${pendingCount})`
    ) : null,
    meta?.pause != null ? (0, import_react7.createElement)(
      "button",
      {
        style: { ...S.smallLink, color: "#1a7f37" },
        onClick: resume,
        title: "\u7EE7\u7EED\u4ECE\u65AD\u70B9\u63A5\u7740\u5199"
      },
      "\u25B6 \u5DF2\u6682\u505C\xB7\u70B9\u7EE7\u7EED"
    ) : (0, import_react7.createElement)(
      "button",
      {
        style: S.smallLink,
        onClick: pause,
        title: "\u6682\u505C\uFF1A\u8FD9\u6B21\u5148\u505C\u4E0B\u624B\u91CC\u7684\u6D3B\uFF0C\u542C\u6211\u7684\uFF08\u5305\u62EC\u5C0F\u52A9\u624B\uFF09"
      },
      "\u23F8 \u6682\u505C"
    )
  );
}
function StylePanel(props) {
  const { notes, onClose } = props;
  const list = notes ?? [];
  return (0, import_react7.createElement)(
    "div",
    {
      style: {
        ...S.card,
        borderColor: "var(--dsw-accent, #4f6ef7)",
        marginTop: "8px"
      }
    },
    (0, import_react7.createElement)(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px"
        }
      },
      (0, import_react7.createElement)(
        "strong",
        { style: { fontSize: "13px" } },
        `\u{1F3A8} \u4F60\u7684\u98CE\u683C\u7EBF\uFF08${list.length} \u6761\uFF1AAI \u5199\u6BCF\u4E00\u7AE0\u90FD\u7167\u7740\u529E\uFF09`
      ),
      (0, import_react7.createElement)(
        "button",
        { style: S.smallLink, onClick: onClose },
        "\u2715 \u6536\u8D77"
      )
    ),
    list.length === 0 ? (0, import_react7.createElement)(
      "p",
      { style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
      "\u8FD8\u6CA1\u6709\u98CE\u683C\u610F\u89C1\u3002"
    ) : list.map(
      (note, index) => (0, import_react7.createElement)(
        "div",
        {
          key: note.id,
          style: { margin: "6px 0", fontSize: "13px", lineHeight: 1.55 }
        },
        (0, import_react7.createElement)(
          "span",
          { style: { fontWeight: 600 } },
          `#${index + 1}`
        ),
        ` ${note.text ?? ""}`,
        note.note != null && note.note !== "" ? (0, import_react7.createElement)(
          "span",
          { style: { opacity: 0.6, fontSize: "12px" } },
          `\uFF08${note.note}\uFF09`
        ) : null
      )
    ),
    (0, import_react7.createElement)(
      "p",
      { style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
      "\u60F3\u518D\u8BB0\u4E00\u6761\uFF1F\u5728\u5BF9\u8BDD\u91CC\u76F4\u63A5\u8DDF AI \u8BF4\uFF0C\u5B83\u4F1A\u8BB0\u6210\u98CE\u683C\u7EBF\uFF1B\u5199\u6BCF\u4E00\u7AE0\u90FD\u7167\u7740\u529E\u3002"
    )
  );
}
function IntervenePanel(props) {
  const { items, onClose } = props;
  const list = items ?? [];
  return (0, import_react7.createElement)(
    "div",
    { style: { ...S.card, borderColor: "#e3b341", marginTop: "8px" } },
    (0, import_react7.createElement)(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px"
        }
      },
      (0, import_react7.createElement)(
        "strong",
        { style: { fontSize: "13px" } },
        `\u{1F4EE} \u4F60\u7684\u7559\u8A00\uFF08${list.length} \u6761\u5F85\u5904\u7406\uFF09`
      ),
      (0, import_react7.createElement)(
        "button",
        { style: S.smallLink, onClick: onClose },
        "\u2715 \u6536\u8D77"
      )
    ),
    list.length === 0 ? (0, import_react7.createElement)(
      "p",
      { style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
      "\u6CA1\u6709\u5F85\u5904\u7406\u7684\u7559\u8A00\u3002"
    ) : list.map(
      (item) => (0, import_react7.createElement)(
        "div",
        {
          key: item.id,
          style: { margin: "6px 0", fontSize: "13px", lineHeight: 1.55 }
        },
        (0, import_react7.createElement)(
          "span",
          { style: { opacity: 0.6, fontSize: "12px" } },
          formatTime(item.at)
        ),
        item.target != null && item.target !== "" ? (0, import_react7.createElement)(
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
        (0, import_react7.createElement)("div", null, item.text ?? ""),
        (0, import_react7.createElement)(
          "p",
          { style: { margin: "2px 0 0", fontSize: "12px", opacity: 0.6 } },
          "AI \u5230\u4E0B\u4E2A\u505C\u9760\u70B9\u4F1A\u770B\u5230\u5E76\u5904\u7406\uFF0C\u4E0D\u6253\u65AD\u5B83\u624B\u91CC\u7684\u6D3B\u3002"
        )
      )
    ),
    (0, import_react7.createElement)(
      "p",
      { style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
      "\u60F3\u7ED9 AI \u7559\u8A00\uFF1F\u5728\u5BF9\u8BDD\u91CC\u76F4\u63A5\u8DDF AI \u8BF4\uFF0C\u5B83\u4F1A\u8BB0\u6210\u7559\u8A00\uFF0C\u5230\u4E0B\u4E2A\u505C\u9760\u70B9\u5904\u7406\uFF08\u4E0D\u6253\u65AD\u5B83\u6B63\u5728\u5199\u7684\u7AE0\uFF09\u3002"
    )
  );
}
function PatternPanel(props) {
  const { patterns, busy, onAnalyze, onClose, result } = props;
  const [text, setText] = (0, import_react7.useState)("");
  const list = patterns ?? [];
  return (0, import_react7.createElement)(
    "div",
    {
      style: {
        ...S.card,
        borderColor: "var(--dsw-accent, #4f6ef7)",
        marginTop: "8px"
      }
    },
    (0, import_react7.createElement)(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px"
        }
      },
      (0, import_react7.createElement)(
        "strong",
        { style: { fontSize: "13px" } },
        "\u{1F9E9} \u81EA\u5B9A\u4E49\u6A21\u5F0F\u5E93"
      ),
      (0, import_react7.createElement)(
        "button",
        { style: S.smallLink, onClick: onClose },
        "\u2715 \u6536\u8D77"
      )
    ),
    (0, import_react7.createElement)(
      "p",
      {
        style: {
          margin: "6px 0",
          fontSize: "12px",
          opacity: 0.75,
          lineHeight: 1.6
        }
      },
      "\u7C98\u8D34\u4E00\u6BB5\u4F60\u60F3\u8981\u7684\u6559\u6CD5/\u7AE0\u8282\u7ED3\u6784\u63CF\u8FF0\uFF0CAI \u4F1A\u628A\u5B83\u63D0\u70BC\u6210\u4E00\u5F20\u300C\u6A21\u5F0F\u5361\u300D\u52A0\u5165\u8FD9\u672C\u4E66\u7684\u6A21\u5F0F\u5E93\uFF1B\u7B2C 2 \u5173\u300C\u6559\u5B66\u6A21\u5F0F\u9009\u578B\u300D\u548C\u5199\u4F5C\u89C4\u8303\u90FD\u4F1A\u4F18\u5148\u53C2\u8003\u5B83\u3002"
    ),
    (0, import_react7.createElement)("textarea", {
      style: { ...S.textarea, minHeight: "64px" },
      placeholder: "\u4F8B\uFF1A\u6BCF\u4E2A\u77E5\u8BC6\u70B9\u5148\u7ED9\u4E00\u4E2A\u751F\u6D3B\u4E2D\u7684\u771F\u5B9E\u573A\u666F\u5F15\u51FA\u6982\u5FF5\uFF0C\u518D\u914D\u4E00\u9053\u7531\u6D45\u5165\u6DF1\u7684\u4F8B\u9898\uFF0C\u6700\u540E\u653E\u4E00\u9053\u6613\u9519\u5224\u65AD\u9898\u2026\u2026",
      value: text,
      onChange: (e) => setText(e.target.value)
    }),
    (0, import_react7.createElement)(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "10px" } },
      (0, import_react7.createElement)(
        "button",
        {
          style: S.bigBtn(true),
          disabled: busy || text.trim() === "",
          onClick: () => {
            onAnalyze(text.trim());
            setText("");
          }
        },
        "\u{1F916} \u8BA9 AI \u5206\u6790\u5E76\u52A0\u5165\u6A21\u5F0F\u5E93"
      ),
      busy ? (0, import_react7.createElement)(
        "span",
        { style: { fontSize: "12px", opacity: 0.7 } },
        "AI \u5206\u6790\u4E2D\u2026"
      ) : null
    ),
    result !== null ? (0, import_react7.createElement)(
      "div",
      {
        style: {
          marginTop: "8px",
          padding: "8px 10px",
          borderRadius: "8px",
          background: "var(--dsw-success-soft, #dafbe1)",
          fontSize: "12px",
          lineHeight: 1.6
        }
      },
      (0, import_react7.createElement)(
        "strong",
        null,
        `\u2705 \u5DF2\u52A0\u5165\u6A21\u5F0F\u5E93\uFF1A${result.name ?? ""}`
      ),
      result.problem != null && result.problem !== "" ? (0, import_react7.createElement)(
        "p",
        { style: { margin: "4px 0 0" } },
        `\u89E3\u51B3\uFF1A${result.problem}`
      ) : null,
      result.blocks != null && result.blocks !== "" ? (0, import_react7.createElement)(
        "p",
        { style: { margin: "2px 0 0" } },
        `\u843D\u5730\uFF1A${result.blocks}`
      ) : null
    ) : null,
    (0, import_react7.createElement)(
      "p",
      { style: { margin: "8px 0 4px", fontSize: "12px", opacity: 0.7 } },
      list.length === 0 ? "\u8FD9\u672C\u4E66\u8FD8\u6CA1\u6709\u81EA\u5B9A\u4E49\u6A21\u5F0F\u3002" : `\u5DF2\u5728\u8FD9\u672C\u4E66\u7684\u6A21\u5F0F\u5E93\u91CC\uFF08${list.length} \u5F20\uFF09\uFF1A`
    ),
    list.map(
      (p, index) => (0, import_react7.createElement)(
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

// src/client-entry.js
var inject = ["slots", "sessions"];
function AutoOpenWorkbench(props) {
  const isTextbook = props.useSessions((s) => s.byId[props.sessionId]?.agentPreset) === "textbook";
  const messageCount = props.useSession((s) => s.nodes.length);
  const doneRef = (0, import_react8.useRef)(false);
  (0, import_react8.useEffect)(() => {
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
function WorkbenchView(props) {
  const sessionPreset = props.useSessions(
    (s) => s.byId[props.sessionId]?.agentPreset ?? null
  );
  const session = props.sessionId;
  const partialActive = props.useSession((s) => s.partial) != null;
  const [projects, setProjects] = (0, import_react8.useState)([]);
  const [activeId, setActiveId] = (0, import_react8.useState)(null);
  const [meta, setMeta] = (0, import_react8.useState)(null);
  const [gate, setGate] = (0, import_react8.useState)(null);
  const [snapshots, setSnapshots] = (0, import_react8.useState)([]);
  const [events, setEvents] = (0, import_react8.useState)([]);
  const [error, setError] = (0, import_react8.useState)(null);
  const [busy, setBusy] = (0, import_react8.useState)(false);
  const [loading, setLoading] = (0, import_react8.useState)(true);
  const [showHistory, setShowHistory] = (0, import_react8.useState)(false);
  const [suggestions, setSuggestions] = (0, import_react8.useState)([]);
  const [suggestLoading, setSuggestLoading] = (0, import_react8.useState)(false);
  const [deletingId, setDeletingId] = (0, import_react8.useState)(null);
  const [mineruSet, setMineruSet] = (0, import_react8.useState)(true);
  const [mineruToken, setMineruToken] = (0, import_react8.useState)("");
  const [mineruResetOpen, setMineruResetOpen] = (0, import_react8.useState)(false);
  const [preview, setPreview] = (0, import_react8.useState)(null);
  const [bookDir, setBookDir] = (0, import_react8.useState)(null);
  const [workFiles, setWorkFiles] = (0, import_react8.useState)([]);
  const [pendingStageView, setPendingStageView] = (0, import_react8.useState)(null);
  const [pendingGateView, setPendingGateView] = (0, import_react8.useState)(null);
  const [pendingReviews, setPendingReviews] = (0, import_react8.useState)([]);
  const [exploreSummary, setExploreSummary] = (0, import_react8.useState)(null);
  const [chapterStatus, setChapterStatus] = (0, import_react8.useState)([]);
  const [goldDrafts, setGoldDrafts] = (0, import_react8.useState)([]);
  const [goldDraftVersion, setGoldDraftVersion] = (0, import_react8.useState)(1);
  const [viewing, setViewing] = (0, import_react8.useState)(null);
  const [viewText, setViewText] = (0, import_react8.useState)(null);
  const [gateOpen, setGateOpen] = (0, import_react8.useState)(null);
  const [showMaterials, setShowMaterials] = (0, import_react8.useState)(false);
  const [showStylePanel, setShowStylePanel] = (0, import_react8.useState)(false);
  const [showIntervenePanel, setShowIntervenePanel] = (0, import_react8.useState)(false);
  const [patternOpen, setPatternOpen] = (0, import_react8.useState)(false);
  const [patternBusy, setPatternBusy] = (0, import_react8.useState)(false);
  const [patternResult, setPatternResult] = (0, import_react8.useState)(null);
  const [patternList, setPatternList] = (0, import_react8.useState)([]);
  const [deskHeight, setDeskHeight] = (0, import_react8.useState)(220);
  const [deskCollapsed, setDeskCollapsed] = (0, import_react8.useState)(true);
  const deskRef = (0, import_react8.useRef)(null);
  const deskLiveRef = (0, import_react8.useRef)(null);
  const rootRef = (0, import_react8.useRef)(null);
  const [rootH, setRootH] = (0, import_react8.useState)(null);
  (0, import_react8.useEffect)(() => {
    const el = rootRef.current;
    if (el === null || el.parentElement === null) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const vh = typeof window !== "undefined" ? window.innerHeight || 0 : 0;
      let bottomBound = vh;
      try {
        if (typeof document !== "undefined") {
          let maxBottom = -1;
          const cands = document.querySelectorAll(
            'textarea, input, [role="textbox"], [contenteditable="true"]'
          );
          for (const d of cands) {
            const r = d.getBoundingClientRect();
            if (!(r.width > 0 && r.height > 0)) continue;
            if (r.top > rect.top && r.bottom > vh - 160 && r.bottom > maxBottom) {
              maxBottom = r.bottom;
              bottomBound = r.top;
            }
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
  const [processSegs, setProcessSegs] = (0, import_react8.useState)([]);
  const [processSubagents, setProcessSubagents] = (0, import_react8.useState)({
    running: 0,
    inactive: 0
  });
  const [browsing, setBrowsing] = (0, import_react8.useState)(null);
  const [noteToast, setNoteToast] = (0, import_react8.useState)(false);
  const [awaitBanner, setAwaitBanner] = (0, import_react8.useState)(false);
  const [progressBanner, setProgressBanner] = (0, import_react8.useState)(false);
  const progressSeqRef = (0, import_react8.useRef)(-1);
  const activeRef = (0, import_react8.useRef)(null);
  const lastSeqRef = (0, import_react8.useRef)(-1);
  const eventsRef = (0, import_react8.useRef)([]);
  const awaitingSeenRef = (0, import_react8.useRef)(false);
  const sessionRef = (0, import_react8.useRef)(session);
  sessionRef.current = session;
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
      `/textbook/events?${sess()}&project=${encodeURIComponent(projectId)}`
    );
    eventsRef.current = json.events ?? [];
    lastSeqRef.current = json.events && json.events.length > 0 ? json.events[json.events.length - 1].seq : -1;
    setEvents(eventsRef.current);
    setMeta(json.meta ?? null);
    setGate(json.gate ?? null);
    setSnapshots(json.snapshots ?? []);
    setBookDir(json.dir ?? null);
    setPendingStageView(json.pendingStage ?? null);
    setPendingGateView(json.pendingGate ?? null);
    setPendingReviews(
      Array.isArray(json.pendingReviews) ? json.pendingReviews : []
    );
    setExploreSummary(json.exploreSummary ?? null);
    setChapterStatus(
      Array.isArray(json.chapterStatus) ? json.chapterStatus : []
    );
    setGoldDrafts(Array.isArray(json.goldDrafts) ? json.goldDrafts : []);
    setGoldDraftVersion(
      Number.isSafeInteger(json.goldDraftVersion) ? json.goldDraftVersion : 1
    );
    void refreshWork(projectId);
    void refreshProcess(projectId);
  }
  async function refreshWork(projectId) {
    try {
      const json = await fetchJson(
        `/textbook/work?${sess()}&project=${encodeURIComponent(projectId)}`
      );
      setWorkFiles(json.files ?? []);
    } catch {
    }
  }
  async function refreshProcess(projectId) {
    try {
      const json = await fetchJson(
        `/textbook/process?${sess()}&project=${encodeURIComponent(projectId)}`
      );
      setProcessSegs(json.segments ?? []);
      const sub = json.subagents ?? {};
      setProcessSubagents({
        running: Number.isSafeInteger(sub.running) ? sub.running : 0,
        inactive: Number.isSafeInteger(sub.inactive) ? sub.inactive : 0
      });
    } catch {
    }
  }
  const viewWork = async (file) => {
    setViewing(file);
    setViewText(null);
    try {
      const res = await fetch(
        `/textbook/file?${sess()}&project=${encodeURIComponent(activeRef.current)}&path=${encodeURIComponent(file.path)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setViewText(await res.text());
    } catch (err) {
      setViewText(
        `\uFF08\u6253\u5F00\u5931\u8D25\uFF1A${String(err instanceof Error ? err.message : err)}\uFF09`
      );
    }
  };
  async function poll() {
    const projectId = activeRef.current;
    if (projectId === null) {
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
      }
      return;
    }
    try {
      const json = await fetchJson(
        `/textbook/events?${sess()}&project=${encodeURIComponent(projectId)}&after=${lastSeqRef.current}`
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
        Array.isArray(json.pendingReviews) ? json.pendingReviews : []
      );
      setExploreSummary(json.exploreSummary ?? null);
      setChapterStatus(
        Array.isArray(json.chapterStatus) ? json.chapterStatus : []
      );
      setGoldDrafts(Array.isArray(json.goldDrafts) ? json.goldDrafts : []);
      setGoldDraftVersion(
        Number.isSafeInteger(json.goldDraftVersion) ? json.goldDraftVersion : 1
      );
      void refreshWork(projectId);
      void refreshProcess(projectId);
    } catch (err) {
      const message = String(err instanceof Error ? err.message : err);
      if (message.includes("\u4E0D\u5B58\u5728") || message.includes("\u4E0D\u5C5E\u4E8E")) {
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
        void loadProjects().catch(() => {
        });
      }
    }
  }
  (0, import_react8.useEffect)(() => {
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
  (0, import_react8.useEffect)(() => {
    const timer = setInterval(() => {
      void poll();
    }, 2e3);
    return () => clearInterval(timer);
  }, []);
  (0, import_react8.useEffect)(() => {
    if (!noteToast) return void 0;
    const timer = setTimeout(() => setNoteToast(false), 6e3);
    return () => clearTimeout(timer);
  }, [noteToast]);
  (0, import_react8.useEffect)(() => {
    const st = meta?.status;
    const awaiting = typeof st === "string" && st.startsWith("awaiting-") || gate !== null && gate.status === "awaiting";
    if (shouldForceBackToNow(awaitingSeenRef.current, awaiting, browsing !== null)) {
      setBrowsing(null);
      setAwaitBanner(true);
    }
    awaitingSeenRef.current = awaiting;
  }, [meta?.status, browsing, gate]);
  (0, import_react8.useEffect)(() => {
    if (browsing === null) return void 0;
    const lastProgress = [...events].reverse().find((e) => e.type === "textbook/progress");
    if (lastProgress !== void 0 && lastProgress.seq > progressSeqRef.current) {
      progressSeqRef.current = lastProgress.seq;
      setProgressBanner(true);
    }
    return void 0;
  }, [events, browsing]);
  (0, import_react8.useEffect)(() => {
    if (!awaitBanner) return void 0;
    const timer = setTimeout(() => setAwaitBanner(false), 6e3);
    return () => clearTimeout(timer);
  }, [awaitBanner]);
  (0, import_react8.useEffect)(() => {
    if (meta !== null || loading) return;
    let alive = true;
    setSuggestLoading(true);
    fetchJson("/textbook/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        action: "wizard-suggest",
        session: sessionRef.current
      })
    }).then((json) => {
      if (alive) setSuggestions(json.suggestions ?? []);
    }).catch(() => {
      if (alive) setSuggestions([]);
    }).finally(() => {
      if (alive) setSuggestLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [meta, loading]);
  const requestSuggest = async (hintText) => {
    setSuggestLoading(true);
    try {
      const json = await fetchJson("/textbook/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          action: "wizard-suggest",
          session: sessionRef.current,
          hint: hintText || void 0
        })
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
    setAwaitBanner(false);
    setProgressBanner(false);
    progressSeqRef.current = -1;
    void loadAll(id).catch(
      (err) => setError(String(err instanceof Error ? err.message : err))
    );
  };
  const postAction = async (body) => {
    setBusy(true);
    try {
      const json = await fetchJson("/textbook/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          project: activeRef.current,
          session: sessionRef.current,
          ...body
        })
      });
      if (activeRef.current !== null) await loadAll(activeRef.current);
      setError(null);
      if (json !== null && ["style-note", "intervene", "review"].includes(body.action) && meta?.status === "running" && meta?.phase === 5) {
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
        Accept: "application/json"
      },
      body: JSON.stringify({
        action: "book-delete",
        project: id,
        session: sessionRef.current,
        confirm: true
      })
    }).then(() => {
      setDeletingId(null);
      if (activeRef.current === id) {
        activeRef.current = null;
        setActiveId(null);
        setMeta(null);
        setGate(null);
        setEvents([]);
      }
      return fetchJson(`/textbook/projects?${sess()}`);
    }).then((json) => setProjects(json.projects ?? [])).catch(
      (err) => setError(String(err instanceof Error ? err.message : err))
    ).finally(() => setBusy(false));
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
      note: decision.note ?? ""
    });
  };
  const rollback = () => {
    if (snapshots.length === 0) {
      setError("\u8FD8\u6CA1\u6709\u53EF\u56DE\u9000\u7684\u5FEB\u7167");
      return;
    }
    void postAction({ action: "rollback", snapshot: snapshots[0].seq });
  };
  const confirmExplore = (approved, feedback) => {
    void postAction({
      action: "explore-confirm",
      approved,
      reasons: feedback?.reasons ?? [],
      note: feedback?.note ?? ""
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
  const createBook = (form) => {
    void postAction({ action: "book-create", ...form }).then((json) => {
      if (json !== null && json.project !== void 0) {
        activeRef.current = json.project;
        setActiveId(json.project);
        void loadAll(json.project).catch(
          (err) => setError(String(err instanceof Error ? err.message : err))
        );
        void fetchJson(`/textbook/projects?${sess()}`).then((list) => setProjects(list.projects ?? [])).catch(() => {
        });
      }
    });
  };
  const uploadSource = async (file, role) => {
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
      throw new Error(json !== null && json.error || `HTTP ${res.status}`);
    try {
      await loadAll(activeRef.current);
    } catch {
    }
  };
  const identifyRoles = async (files) => {
    const json = await fetchJson("/textbook/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        action: "suggest-roles",
        session: sessionRef.current,
        files
      })
    });
    return json.roles ?? [];
  };
  const convert = () => {
    void postAction({ action: "convert-start" });
  };
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
    }).then(() => {
      setMineruSet(true);
      setMineruResetOpen(false);
      setMineruToken("");
    });
  };
  const togglePreview = () => {
    if (preview !== null) {
      setPreview(null);
      return;
    }
    void fetch(
      `/textbook/file?${sess()}&project=${encodeURIComponent(activeRef.current)}&path=work/book.md`
    ).then((res) => res.text()).then((text) => setPreview(text)).catch(
      (err) => setError(String(err instanceof Error ? err.message : err))
    );
  };
  const lastEvent = events.length > 0 ? events[events.length - 1] : null;
  const qualityEvent = [...events].reverse().find((event) => event.type === "textbook/quality");
  const checks = qualityEvent?.data?.checks ?? [];
  const aiReportEvent = [...events].reverse().find((event) => event.type === "textbook/ai-report");
  const aiReport = aiReportEvent?.data?.report ?? null;
  const progressDetail = stageScopedProgressDetail(events);
  const pendingStageLabel = pendingStageView === "gate" ? `\u8BBE\u8BA1\u63D0\u6848\xB7\u7B2C ${pendingGateView ?? "?"} \u5173` : stageHuman(pendingStageView);
  const humanTurn = meta !== null && (meta.status === "awaiting-explore" || meta.status === "awaiting-outline" || meta.status === "awaiting-gold" || meta.status === "awaiting-chapters-review" || meta.status === "awaiting-final-approval" || gate !== null && gate.status === "awaiting" || meta.phase === 1 && gate === null);
  const needsConfigText = lastEvent?.type === "textbook/error" ? `${lastEvent.data?.task ?? ""}\u5931\u8D25\uFF1A${lastEvent.data?.message ?? ""}` : '\u8BF7\u5148\u914D\u7F6E\u5927\u6A21\u578B\u63A5\u53E3\uFF08\u53F3\u4E0A\u89D2\u8BBE\u7F6E \u2192 \u6A21\u578B\uFF09\uFF0C\u914D\u597D\u540E\u70B9"\u7EE7\u7EED"\u3002';
  const showWizardForm = meta === null && !loading;
  const styleNotes = (meta?.styleNotes ?? []).filter(
    (n) => n.status === "active"
  );
  const pendingIvs = (meta?.pendingInterventions ?? []).filter(
    (i) => i.status === "pending"
  );
  const openStylePanel = () => setShowStylePanel((v) => !v);
  const openIntervene = () => setShowIntervenePanel((v) => !v);
  const loadPatterns = () => {
    if (activeRef.current === null) return;
    void fetchJson("/textbook/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        action: "pattern-list",
        project: activeRef.current,
        session: sessionRef.current
      })
    }).then((json) => {
      if (json?.ok === true) setPatternList(json.patterns ?? []);
    }).catch(() => {
    });
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
  if (sessionPreset !== "textbook") {
    return null;
  }
  const topBar = meta !== null && !loading ? (0, import_react8.createElement)(TopBar, {
    meta,
    openStylePanel,
    openIntervene,
    pause,
    resume
  }) : null;
  const simpleContent = (0, import_react8.createElement)(
    "div",
    { style: S.container },
    (0, import_react8.createElement)("p", { style: S.title }, "\u9020\u4E66\u5DE5\u4F5C\u53F0"),
    (0, import_react8.createElement)(
      "p",
      { style: S.hint },
      "\u672C\u4F1A\u8BDD\u72EC\u7ACB\u4F7F\u7528\uFF0C\u4E00\u4E2A\u4F1A\u8BDD\u53EA\u9020\u4E00\u672C\u4E66\u3002\u4E3B AI \u7EDF\u7B79\u63A8\u8FDB\u6D41\u6C34\u7EBF\uFF08\u4EB2\u81EA\u505A\u6216\u6D3E\u5C0F\u52A9\u624B\u5206\u5934\u5E72\uFF09\uFF0C\u8F6E\u5230\u4F60\u8981\u62CD\u677F/\u786E\u8BA4\u65F6\u4EAE\u8D77 \u26A1\uFF1B\u6BCF\u4E2A\u62CD\u677F\u70B9\u90FD\u81EA\u52A8\u5B58\u6863\uFF0C\u968F\u65F6\u80FD\u6539\u3002"
    ),
    (0, import_react8.createElement)(MineruTokenCard, {
      mineruSet,
      mineruToken,
      busy,
      onTokenChange: (e) => setMineruToken(e.target.value),
      onSave: saveMineruToken,
      resetOpen: mineruResetOpen,
      onToggleReset: () => setMineruResetOpen((v) => !v)
    }),
    error !== null ? (0, import_react8.createElement)("p", { style: S.error }, `\u26A0\uFE0F ${error}`) : null,
    loading ? (0, import_react8.createElement)("p", { style: S.hint }, "\u52A0\u8F7D\u4E2D\u2026") : showWizardForm ? (0, import_react8.createElement)(WizardCard, {
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
      onSuggest: (hintText) => requestSuggest(hintText)
    }) : null
  );
  const projectView = () => (0, import_react8.createElement)(
    "div",
    { style: { display: "flex", flex: 1, minHeight: 0, overflow: "hidden" } },
    // 左：过程地图栏（Task 15 三区骨架 P3；点任意段 -> 焦点区切浏览视图）。
    (0, import_react8.createElement)(ProcessMapRail, {
      segments: processSegs,
      status: meta?.status ?? null,
      browsingKey: browsing,
      onSelect: (key) => {
        setBrowsing(key);
        setViewing(null);
        setViewText(null);
        const seg = processSegs.find((s) => s.key === key);
        const first = seg?.artifacts?.[0];
        if (typeof first === "string" && first !== "")
          void viewWork({ path: first, label: first });
        const lastProgress = [...eventsRef.current].reverse().find((e) => e.type === "textbook/progress");
        progressSeqRef.current = lastProgress?.seq ?? -1;
        setProgressBanner(false);
      }
    }),
    // 右：上=焦点区（统一滚动容器，浏览/各状态卡/面板整体迁入），下=对话台（固定底部）。
    (0, import_react8.createElement)(
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
      (0, import_react8.createElement)(
        "div",
        {
          style: {
            position: "relative",
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "12px 16px"
          }
        },
        // 自动跟随横幅（F5 方案 A）：等拍板强制回「现在」（6 秒自清）；浏览历史时 AI 有新进展（点击清浏览回现在）。
        awaitBanner ? (0, import_react8.createElement)(AutoFollowAwaitNote, {
          onClose: () => setAwaitBanner(false)
        }) : null,
        progressBanner && browsing !== null ? (0, import_react8.createElement)(AutoFollowProgressNote, {
          onJump: () => {
            setBrowsing(null);
            setProgressBanner(false);
          },
          onDismiss: () => setProgressBanner(false)
        }) : null,
        // 不打断提示条（F17）：铺章中提交风格线/留言/意见成功后，焦点区顶部滑入、6 秒自清。
        noteToast ? (0, import_react8.createElement)(InterruptNote, {
          onClose: () => setNoteToast(false)
        }) : null,
        // 业务头（原 workbenchContent 头部迁入焦点区顶）：书名/取消书、MinerU、错误。
        (0, import_react8.createElement)(
          "div",
          {
            style: {
              display: "flex",
              gap: "10px",
              alignItems: "center",
              marginBottom: "10px"
            }
          },
          (0, import_react8.createElement)(
            "strong",
            { style: { fontSize: "15px" } },
            `\u{1F4D6} ${meta.name ?? activeId}`
          ),
          deletingId === activeId ? (0, import_react8.createElement)(
            "button",
            {
              style: {
                ...S.smallLink,
                color: "var(--dsw-danger, #cf222e)"
              },
              onClick: () => deleteBook(activeId),
              disabled: busy
            },
            "\u786E\u8BA4\u53D6\u6D88\u8FD9\u672C\u4E66\uFF08\u8FDB\u56DE\u6536\u7AD9\uFF09"
          ) : (0, import_react8.createElement)(
            "button",
            {
              style: S.smallLink,
              onClick: () => setDeletingId(activeId)
            },
            "\u53D6\u6D88\u8FD9\u672C\u4E66"
          ),
          (0, import_react8.createElement)(
            "button",
            {
              style: S.smallLink,
              onClick: () => {
                setPatternOpen(true);
                loadPatterns();
              },
              title: "\u7C98\u8D34\u4E00\u6BB5\u4F60\u60F3\u8981\u7684\u6559\u6CD5/\u7ED3\u6784\u63CF\u8FF0\uFF0CAI \u4F1A\u628A\u5B83\u52A0\u8FDB\u8FD9\u672C\u4E66\u7684\u6A21\u5F0F\u5E93"
            },
            "\u{1F9E9} \u81EA\u5B9A\u4E49\u6A21\u5F0F"
          )
        ),
        // MinerU Token 卡只在该配置「还没完成」时留在有书面板（「还差一步」引导）；
        // 已设置后只在无书向导（定书名）页出现，不再占面板空间（2026-08-21 需求）。
        mineruSet === false ? (0, import_react8.createElement)(MineruTokenCard, {
          mineruSet,
          mineruToken,
          busy,
          onTokenChange: (e) => setMineruToken(e.target.value),
          onSave: saveMineruToken,
          resetOpen: mineruResetOpen,
          onToggleReset: () => setMineruResetOpen((v) => !v)
        }) : null,
        error !== null ? (0, import_react8.createElement)("p", { style: S.error }, `\u26A0\uFE0F ${error}`) : null,
        // 浏览态：优先历史分段回看（「回到现在」回到现场，Task 10 提供，保持原位）。
        // F22：浏览态下该段「产物」查看内容渲染在卡片正下方（BrowseSection 内）；
        // 主进度条（PhaseBar）隐藏，回到现在（browsing=null）后才显示。
        browsing != null ? (0, import_react8.createElement)(BrowseSection, {
          segment: (processSegs ?? []).find((seg) => seg.key === browsing) ?? null,
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
              note
            });
            setBrowsing(null);
          },
          onDeepUndo: () => {
            void postAction({ action: "deep-undo" });
          },
          onCloseView: () => setViewing(null)
        }) : null,
        // 顶栏 🎨 风格线 / 📮 留言 展开面板（Task 17 常驻入口；点开即见清单，再点或 ✕ 收起）。
        showStylePanel ? (0, import_react8.createElement)(StylePanel, {
          notes: styleNotes,
          onClose: () => setShowStylePanel(false)
        }) : null,
        showIntervenePanel ? (0, import_react8.createElement)(IntervenePanel, {
          items: pendingIvs,
          onClose: () => setShowIntervenePanel(false)
        }) : null,
        // 🧩 自定义模式库面板（2026-08-21）：粘贴描述 → AI 分析成「模式卡」加入本书。
        patternOpen ? (0, import_react8.createElement)(PatternPanel, {
          patterns: patternList,
          busy: patternBusy,
          result: patternResult,
          onAnalyze: analyzePattern,
          onClose: () => setPatternOpen(false)
        }) : null,
        // F22：主进度条（顶部阶段卡）在浏览态（browsing 非空）隐藏，回到现在才显示。
        mainProgressVisible(browsing) ? (0, import_react8.createElement)(PhaseBar, {
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
          productOf: (p) => phaseProduct(p, meta, workFiles)
        }) : null,
        (0, import_react8.createElement)(StatusStrip, {
          meta,
          gate,
          pendingStage: pendingStageView,
          progressDetail,
          metaLabel: pendingStageLabel
        }),
        // 主 AI 活性行（F17）：常驻一行——AI 回合进行中 / 账面 N 分钟没动静[戳一下 AI] / 等你拍板。
        (0, import_react8.createElement)(ActivityLine, {
          meta,
          aiActive: partialActive || meta?.status === "running" && Date.now() - (meta.updatedAt ?? 0) < 3 * 60 * 1e3,
          onNudge: () => {
            void postAction({
              action: "nudge",
              text: "\u8D26\u9762\u6709\u4E00\u4F1A\u6CA1\u52A8\u4E86\uFF0C\u8BF7\u67E5\u72B6\u6001\u7EE7\u7EED\u63A8\u8FDB"
            });
          },
          subagents: processSubagents
        }),
        bookDir !== null ? (0, import_react8.createElement)(
          "p",
          {
            style: {
              margin: "6px 0 0",
              fontSize: "12px",
              opacity: 0.6,
              wordBreak: "break-all"
            }
          },
          `\u{1F4C1} \u4E66\u6587\u4EF6\u5939\uFF1A${bookDir}`
        ) : null,
        (() => {
          switch (focusCardKey(meta, gate)) {
            case "gate":
              return (0, import_react8.createElement)(GatePanel, {
                gate,
                onDecide: decide,
                onRollback: rollback,
                busy,
                error: null,
                onAddPattern: analyzePattern
              });
            case "explore":
              return (0, import_react8.createElement)(ExploreConfirmCard, {
                meta,
                exploreSummary,
                project: activeId,
                session: sessionRef.current,
                onConfirm: confirmExplore,
                onViewReport: () => viewWork({ path: "work/explore.md", label: "\u6E90\u63A2\u67E5\u62A5\u544A" }),
                busy
              });
            case "outline":
              return (0, import_react8.createElement)(OutlineConfirmCard, {
                meta,
                busy,
                onConfirm: confirmOutline
              });
            case "gold":
              return (0, import_react8.createElement)(GoldTable, {
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
                      Accept: "application/json"
                    },
                    body: JSON.stringify({
                      action: "suggest-words",
                      session: sessionRef.current,
                      project: activeRef.current,
                      goal: meta.goal,
                      route: meta.route,
                      science: meta.science,
                      chapterCount: (meta.outline?.chapters ?? []).length
                    })
                  });
                  return json.suggestion ?? null;
                },
                fetchText: (path) => fetch(
                  `/textbook/file?${sess()}&project=${encodeURIComponent(activeRef.current)}&path=${encodeURIComponent(path)}`
                ).then((res) => {
                  if (!res.ok) throw new Error(`HTTP ${res.status}`);
                  return res.text();
                })
              });
            case "final":
              return (0, import_react8.createElement)(FinalApprovalCard, {
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
                }
              });
            case "delivered":
              return (0, import_react8.createElement)(DeliveryCard, {
                project: activeId,
                session: sessionRef.current,
                checks,
                onPreview: togglePreview,
                preview,
                busy,
                meta,
                aiReport,
                styleNotes: meta.styleNotes
                // 风格线落实清单：从 meta 传入，内部 ?? [] 兜底（旧账本无此字段）
              });
            case "chapters":
              return (0, import_react8.createElement)(ChaptersCard, {
                meta,
                chapterStatus,
                pendingReviews,
                progressDetail,
                reviewMode: meta.status === "awaiting-chapters-review",
                onApproveAll: () => {
                  void postAction({
                    action: "chapters-review-confirm",
                    approved: true
                  });
                },
                onView: (n) => viewWork({
                  path: `work/chapter-${String(n).padStart(2, "0")}.md`,
                  label: `\u7B2C ${n} \u7AE0`
                }),
                onReview: submitReview,
                busy,
                events,
                // F17 章级「完成」态推导用（agent-end 事件 → 第N章）
                workFiles,
                // F17 「看看这章」置灰用（chapter 文件不在产物清单就禁用）
                project: activeId,
                session: sessionRef.current,
                postAction
                // F39 过目态内联展开/段级三键
              });
            case "upload":
              return (0, import_react8.createElement)(UploadArea, {
                sources: meta.sources ?? [],
                converting: meta.converting === true,
                onUpload: uploadSource,
                onConvert: convert,
                onIdentify: identifyRoles,
                busy
              });
            default:
              return (0, import_react8.createElement)(StatusCard, {
                meta,
                lastEvent,
                events,
                needsConfig: needsConfigText,
                onResume: resume,
                busy,
                pendingStageLabel,
                progressDetail,
                // F31：AI 流式干活（partialActive）或账本 3 分钟内有动 → 抑制「可能卡住了」误报（口径同活性行 L2759）。
                aiActive: partialActive || meta?.status === "running" && Date.now() - (meta.updatedAt ?? 0) < 3 * 60 * 1e3,
                // F28：error 态删书重来入口——复用既有 deletingId/deleteBook 两步删除机制（与业务头同源）。
                onDeleteStart: () => setDeletingId(activeId),
                onDeleteConfirm: () => deleteBook(activeId),
                deletingId: deletingId === activeId
              });
          }
        })(),
        (0, import_react8.createElement)(
          "div",
          { style: { margin: "8px 0" } },
          (0, import_react8.createElement)(
            "button",
            {
              style: S.smallLink,
              onClick: () => setShowHistory(!showHistory)
            },
            showHistory ? "\u25BE \u6536\u8D77\u4E4B\u524D\u7684\u8FC7\u7A0B" : "\u25B8 \u4E4B\u524D\u7684\u8FC7\u7A0B\uFF08\u70B9\u5F00\u53EF\u56DE\u653E\u62BD\u67E5\uFF09"
          )
        ),
        showHistory ? events.map((event) => {
          const product = workPathForEvent(event, meta, workFiles);
          const isGate = event.type === "textbook/gate-proposal";
          const detailOpen = gateOpen === event.seq;
          const clickable = product !== null || isGate;
          const viewingThis = product !== null && viewing !== null && viewing.path === product.path;
          return (0, import_react8.createElement)(
            "div",
            {
              key: event.seq,
              style: {
                ...S.card,
                ...clickable ? { cursor: "pointer" } : {},
                ...viewingThis ? { borderColor: "var(--dsw-accent, #4f6ef7)" } : {}
              },
              onClick: clickable ? () => {
                if (product !== null) viewWork(product);
                else if (isGate)
                  setGateOpen(detailOpen ? null : event.seq);
              } : void 0
            },
            (0, import_react8.createElement)(
              "div",
              null,
              (0, import_react8.createElement)("span", null, cardIcon(event)),
              " ",
              (0, import_react8.createElement)("strong", null, cardText(event)),
              product !== null ? (0, import_react8.createElement)(
                "span",
                {
                  style: {
                    marginLeft: "8px",
                    fontSize: "12px",
                    color: "var(--dsw-accent, #4f6ef7)"
                  }
                },
                viewingThis ? "\u{1F441}\uFE0F \u67E5\u770B\u4E2D" : "\u{1F4C4} \u67E5\u770B\u7ED3\u679C"
              ) : null,
              (0, import_react8.createElement)(
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
            isGate ? detailOpen ? (0, import_react8.createElement)(
              "div",
              {
                style: {
                  marginTop: "6px",
                  fontSize: "12px",
                  opacity: 0.9
                }
              },
              (0, import_react8.createElement)(
                "p",
                { style: { margin: "0 0 4px" } },
                event.data?.summary ?? ""
              ),
              (event.data?.detail ?? "") !== "" ? (0, import_react8.createElement)(
                "pre",
                {
                  style: {
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    background: "var(--dsw-surface, #fff)",
                    borderRadius: "6px",
                    padding: "8px",
                    fontSize: "12px",
                    margin: "4px 0 0"
                  }
                },
                event.data.detail
              ) : null
            ) : (event.data?.summary ?? "") !== "" ? (0, import_react8.createElement)(
              "div",
              { style: { marginTop: "6px", opacity: 0.85 } },
              event.data.summary
            ) : null : null
          );
        }) : null,
        showMaterials ? (0, import_react8.createElement)(
          "div",
          {
            style: {
              marginTop: "8px",
              border: "1px solid var(--dsw-border, #d0d7de)",
              borderRadius: "8px",
              padding: "10px"
            }
          },
          (0, import_react8.createElement)(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }
            },
            (0, import_react8.createElement)(
              "strong",
              { style: { fontSize: "13px" } },
              "\u{1F4C4} \u7B2C\u4E00\u6B65 \xB7 \u6750\u6599\u51C6\u5907"
            ),
            (0, import_react8.createElement)(
              "button",
              {
                style: S.smallLink,
                onClick: () => setShowMaterials(false)
              },
              "\u2715 \u6536\u8D77"
            )
          ),
          (meta.sources ?? []).length === 0 ? (0, import_react8.createElement)(
            "p",
            {
              style: {
                margin: "6px 0 0",
                fontSize: "12px",
                opacity: 0.7
              }
            },
            "\u8FD8\u6CA1\u6709\u4E0A\u4F20\u6750\u6599\u3002"
          ) : (meta.sources ?? []).map(
            (source) => (0, import_react8.createElement)(
              "div",
              {
                key: source.file,
                style: {
                  margin: "6px 0",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center"
                }
              },
              (0, import_react8.createElement)(
                "span",
                {
                  style: {
                    flex: 1,
                    fontSize: "12px",
                    wordBreak: "break-all"
                  }
                },
                `${source.converted === true ? "\u2705" : "\u23F3"} ${source.file}\uFF08${source.role ?? ""}\uFF09`
              ),
              source.converted === true && typeof source.md === "string" && source.md !== "" ? (0, import_react8.createElement)(
                "button",
                {
                  style: S.smallLink,
                  onClick: () => viewWork({
                    path: `sources-md/${source.md}`,
                    label: `\u8F6C\u6362\u5185\u5BB9\uFF1A${source.file}`
                  })
                },
                "\u67E5\u770B\u8F6C\u6362\u5185\u5BB9"
              ) : null
            )
          )
        ) : null,
        // F22：文件查看器——浏览态下已在 BrowseSection 里紧贴段卡片渲染，这里只在
        // 「现在」视图（browsing=null，顶栏/事件卡/材料入口打开）渲染，避免同一内容两处出现。
        browsing === null && viewing !== null && viewText !== null ? (0, import_react8.createElement)(FileViewer, {
          viewing,
          viewText,
          onClose: () => setViewing(null)
        }) : null
      ),
      // 下：对话台（右下镜像宿主对话；分界可拖、可收成一条）。焦点区在它上面独立滚动。
      // 收起态（默认）压成单行高，只留「展开对话台」入口；展开态才是对话区本体。
      (0, import_react8.createElement)(
        "div",
        {
          ref: deskRef,
          style: {
            height: deskCollapsed ? "32px" : `${deskLiveRef.current ?? deskHeight}px`,
            flexShrink: 0,
            borderTop: "1px solid var(--dsw-border, #d0d7de)",
            position: "relative"
          }
        },
        (0, import_react8.createElement)("div", {
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
        deskCollapsed ? (0, import_react8.createElement)(
          "button",
          {
            style: {
              ...S.smallLink,
              margin: "6px auto",
              display: "block"
            },
            onClick: () => setDeskCollapsed(false)
          },
          "\u{1F91D} \u5C55\u5F00\u5BF9\u8BDD\u53F0"
        ) : (
          // 对话台的滚动容器移进 ChatDesk 自己（钉底滚动回归修复在组件内），展开态直接渲染组件。
          (0, import_react8.createElement)(ChatDesk, {
            useSession: props.useSession,
            events,
            // Task 20 回执徽章用（workbench 事件数组）
            onNudge: () => {
              void postAction({
                action: "nudge",
                text: "\u5DE5\u4F5C\u53F0\u8FD8\u6CA1\u8DDF\u4E0A\uFF0C\u8BF7\u628A\u521A\u624D\u7B54\u5E94\u7684\u4E8B\u843D\u8D26\uFF08style-note/progress \u7B49\uFF09"
              });
            },
            onCollapse: () => setDeskCollapsed(true)
          })
        )
      )
    )
  );
  return (0, import_react8.createElement)(
    "div",
    {
      ref: rootRef,
      style: {
        display: "flex",
        flexDirection: "column",
        height: rootH !== null ? `${rootH}px` : "100%",
        minHeight: 0,
        overflow: "hidden"
      }
    },
    topBar,
    meta !== null && !loading ? projectView() : (0, import_react8.createElement)(
      "div",
      { style: { flex: 1, minHeight: 0, overflow: "auto" } },
      simpleContent
    )
  );
}
function apply(ctx) {
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
            label: () => "\u5DE5\u4F5C\u53F0",
            inject: () => ({})
          },
          WorkbenchView
        );
      } else if (!isTextbook && disposer !== null) {
        disposer();
        disposer = null;
      }
    };
    sync();
    const unsubscribe = ctx.sessions.list.subscribe(sync);
    return () => {
      unsubscribe();
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
  ctx.logger.info(
    "[ui-textbook-run] \u5DE5\u4F5C\u53F0\u89C6\u56FE\u5DF2\u6CE8\u518C\uFF08\u8FC7\u7A0B\u5730\u56FE + \u5BF9\u8BDD\u53F0 + \u81EA\u52A8\u6253\u5F00\uFF09"
  );
}
return module.exports; } });
