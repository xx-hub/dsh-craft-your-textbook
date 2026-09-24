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
  GoldFinalize: () => GoldFinalize,
  GoldOpinionList: () => GoldOpinionList,
  GoldReader: () => GoldReader,
  GoldTable: () => GoldTable,
  InterruptNote: () => InterruptNote,
  IntervenePanel: () => IntervenePanel,
  MineruTokenCard: () => MineruTokenCard,
  OpenArtifactButton: () => OpenArtifactButton,
  OutlineConfirmCard: () => OutlineConfirmCard,
  PatternPanel: () => PatternPanel,
  PhaseBar: () => PhaseBar,
  ProgressOverview: () => ProgressOverview,
  READER_PARA_STYLE: () => READER_PARA_STYLE,
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
var import_react10 = require("react");

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
  // 次级按钮（批 3，2026-09-20）：原来「预览/不满意/认可」三键都是 bigBtn(true)，
  // 三个一模一样的蓝实心并排，用户看不出该点哪儿。主操作填色，其余描边。
  ghostBtn: (danger) => ({
    border: `1px solid ${danger ? "var(--dsw-danger, #cf222e)" : "var(--dsw-border, #d0d7de)"}`,
    borderRadius: "10px",
    padding: "10px 18px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    background: "transparent",
    color: danger ? "var(--dsw-danger, #cf222e)" : "inherit"
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
  const { mainAiRunning, subagentRunningCount, lastWriteAt, now } = input ?? {};
  const at = Number.isFinite(lastWriteAt) && lastWriteAt > 0 ? lastWriteAt : null;
  const idleMs = at === null ? 0 : Math.max(0, (Number.isFinite(now) ? now : Date.now()) - at);
  const subagentsRunning = Number.isSafeInteger(subagentRunningCount) && subagentRunningCount > 0;
  return {
    stalled: at !== null && mainAiRunning !== true && !subagentsRunning && idleMs >= STALL_THRESHOLD_MS,
    idleMs
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
function isReviewPending(review) {
  return review?.status === "pending";
}
function hasPendingReview(pendingReviews, n) {
  return (pendingReviews ?? []).some(
    (r) => Number(r.chapter) === Number(n) && isReviewPending(r)
  );
}
function chapterBadge(row, pendingReviews, doneSet, pipelineStage) {
  const hasReview = hasPendingReview(pendingReviews, row.n);
  const settled = () => hasReview ? { icon: "\u{1F4DD}", text: "\u8F6E\u5230\u4F60 \xB7 \u6709\u610F\u89C1\u5F85\u4FEE\u8BA2", tone: "#cf222e" } : { icon: "\u{1F6E1}\uFE0F", text: "\u5DF2\u5B8C\u6210 \xB7 \u5BA1\u8FC7", tone: "#1a7f37" };
  if (doneSet.has(row.n)) return settled();
  if (pipelineStage === "writing")
    return { icon: "\u23F3", text: "\u6211\u6B63\u5728\u505A \xB7 \u6267\u7B14", tone: "#e3b341" };
  if (pipelineStage === "auditing")
    return { icon: "\u{1F50D}", text: "\u6211\u6B63\u5728\u505A \xB7 \u68C0\u67E5", tone: "#0969da" };
  if (pipelineStage === "audited")
    return { icon: "\u{1F50E}", text: "\u6211\u6B63\u5728\u505A \xB7 \u7B49\u590D\u6838", tone: "#0969da" };
  if (pipelineStage === "finalizing")
    return { icon: "\u{1F441}", text: "\u6211\u6B63\u5728\u505A \xB7 \u590D\u6838", tone: "#57606a" };
  if (pipelineStage === "done") return settled();
  if (row.written && row.audited)
    return { icon: "\u{1F441}", text: "\u6211\u6B63\u5728\u505A \xB7 \u590D\u6838", tone: "#57606a" };
  if (row.written)
    return { icon: "\u{1F50D}", text: "\u6211\u6B63\u5728\u505A \xB7 \u68C0\u67E5", tone: "#0969da" };
  return { icon: "\u23F3", text: "\u6211\u6B63\u5728\u505A \xB7 \u6267\u7B14", tone: "#e3b341" };
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
function reviewState(review) {
  if (review?.status === "applied") {
    const how = typeof review.how === "string" ? review.how.trim() : "";
    return {
      key: "applied",
      text: how === "" ? "\u5DF2\u5904\u7F6E\uFF08AI \u6CA1\u5199\u8BF4\u660E\uFF09" : `\u5DF2\u5904\u7F6E \xB7 ${how}`,
      revocable: true
    };
  }
  if (review?.status === "revoked")
    return { key: "revoked", text: "\u5DF2\u4F5C\u5E9F", revocable: false };
  if (review?.status === "pending")
    return {
      key: "pending",
      text: "\u8FD8\u6CA1\u5904\u7F6E \xB7 \u8FD9\u4E00\u7AE0\u4EA4\u5DE5\u524D\u8981\u5148\u5904\u7F6E\u5B83",
      revocable: false
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
  return raw;
}
var NUMBERED_CHAPTER_FILE_RE = /^work\/chapter-\d{2}\.md$/;
var ARCHIVED_CHAPTER_RE = /^work\/_旧版产物\/chapter-\d{2}\.md\.[0-9a-z]+$/;
var GATE_PROPOSAL_RE = /^提案\/关卡[123]-v\d+\.md$/;
var CONVERTED_SOURCE_RE = /^sources-md\/.+\.md$/;
function productOpenMode(rel) {
  const path = String(rel ?? "").replace(/\\/g, "/").replace(/^(?:\.\/)+/, "");
  if (path === "work/knowledge-map.json") return "inline";
  if (NUMBERED_CHAPTER_FILE_RE.test(path) || ARCHIVED_CHAPTER_RE.test(path) || GATE_PROPOSAL_RE.test(path) || CONVERTED_SOURCE_RE.test(path) || path === "work/explore.md" || // 探查报告
  path === "work/outline.md" || // 章节安排（设计关卡定下来的方案）
  path === "work/style-spec.md" || // 写作规范（同为设计文档，步清单把它当产物列出）
  path === "work/book.md") {
    return "preview";
  }
  return "machine";
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
  "textbook/submit-rejected": { label: "\u4EA4\u5DE5\u88AB\u62D2", emoji: "\u{1F6AB}" }
});

// src/ui/view-rules.js
var PHASE_UI = PHASE_UI_SOURCE;
var phaseUi = (n) => PHASE_UI[n] ?? "";
var STAGE_HUMAN = {
  explore: "\u8BFB\u6750\u6599\u6311\u91CD\u70B9",
  outline: "\u7AE0\u8282\u5B89\u6392",
  gold: "\u6700\u4F73\u8303\u4F8B\u7AE0",
  chapters: "\u5199\u5B8C\u6574\u672C",
  merge: "\u5408\u5E76\u6210\u4E66",
  final: "\u6700\u540E\u68C0\u67E5"
};
var stageHuman = (stage) => STAGE_HUMAN[stage] ?? "";
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
  "\u6240\u6709\u7AE0\u8282\u90FD\u6709\u5BA1\u8BA1\u8BB0\u5F55": "\u6BCF\u7AE0\u90FD\u6709\u68C0\u67E5\u8BB0\u5F55",
  "\u6CA1\u6709\u9057\u7559\u7684 AI \u7B14\u8BB0/\u811A\u624B\u67B6": "\u6CA1\u6709\u7559\u4E0B AI \u7684\u8349\u7A3F\u75D5\u8FF9",
  "\u7EC3\u4E60\u4E0E\u7B54\u6848\u9F50\u5168": "\u7EC3\u4E60\u548C\u7B54\u6848\u90FD\u5728",
  "\u4E0E\u5DF2\u62CD\u677F\u7684\u8BBE\u8BA1\u4E00\u81F4": "\u548C\u4F60\u8BF4\u5B9A\u7684\u8BBE\u8BA1\u4E00\u81F4",
  // ⚠️ 票 14（承诺账 E）：这两条白话名原来把机制说大了——
  //   「源材料引用可追溯」的机器判据只是 `sourceCount > 0`（用上了至少一份材料），不验任何一处内容；
  //   「进度账本齐全」只验 `work/progress.md` 存在，不验「每一步」都有行。
  // 名字即承诺，所以按机制收（收名，不动服务端判据）。
  "\u6E90\u6750\u6599\u5F15\u7528\u53EF\u8FFD\u6EAF": "\u7528\u4E0A\u4E86\u4F60\u4E0A\u4F20\u7684\u6750\u6599",
  "\u98CE\u683C\u7EBF\u6761\u6761\u6709\u7740\u843D": "\u4F60\u63D0\u7684\u98CE\u683C\u8981\u6C42\u90FD\u5904\u7406\u4E86",
  "\u8FDB\u5EA6\u8D26\u672C\u9F50\u5168": "\u6709\u5DE5\u4F5C\u8BB0\u5F55\u53EF\u67E5",
  "\u6210\u54C1\u65E0\u4E71\u7801\uFF08U+FFFD\uFF09": "\u6CA1\u6709\u4E71\u7801",
  "\u7AE0\u8282\u6570\u7B26\u5408\u5927\u7EB2": "\u7AE0\u8282\u6570\u548C\u8BF4\u597D\u7684\u4E00\u81F4",
  "\u5FC5\u542B\u677F\u5757\u9F50\u5168\uFF08\u5951\u7EA6\u9879\uFF09": "\u8BE5\u6709\u7684\u677F\u5757\u90FD\u5728",
  "\u65E0\u7981\u7528\u8BCD\uFF08\u5951\u7EA6\u9879\uFF09": "\u6CA1\u6709\u51FA\u73B0\u4E0D\u8BE5\u7528\u7684\u8BCD",
  "\u7AE0\u8282\u5F15\u7528\u53EF\u8FFD\u6EAF\uFF08\u65E0\u5F15\u7528\u77DB\u76FE\uFF09": "\u6BCF\u7AE0\u6807\u7684\u6750\u6599\u51FA\u5904\u90FD\u771F\u5B9E\u5B58\u5728",
  // 票 20：这一项从线索级警示改成**真门槛**（有重复标题即拦交付），白话名跟着写实——
  // 机器查的是**全书**标题去重（同章内重复也算），不是只查「跨章」，所以按判据收成这一句。
  "\u65E0\u91CD\u590D\u6807\u9898": "\u6574\u672C\u4E66\u91CC\u6CA1\u6709\u91CD\u590D\u7684\u6807\u9898"
};
var checkHuman = (name) => CHECK_UI[name] ?? name;
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
function workEntryAction(rel) {
  const mode = productOpenMode(rel);
  if (mode === "preview") return "sidebar";
  if (mode === "inline") return "inline";
  return "none";
}
var chapterRel = (n) => `work/chapter-${String(n).padStart(2, "0")}.md`;
var GATE_PROPOSAL_DIR = "\u63D0\u6848/";
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
  if (label.startsWith("\u6E90\u63A2\u67E5")) out.push("work/explore.md");
  if (label.includes("\u7AE0\u8282\u9AA8\u67B6") || label.includes("\u7AE0\u8282\u5B89\u6392")) out.push("work/outline.md");
  if (label.includes("\u6700\u4F73\u8303\u4F8B\u7AE0")) out.push(chapterRel(goldChapterNo(meta)));
  if (label.startsWith("\u5408\u5E76\u6210\u4E66") || label.startsWith("\u6700\u540E\u68C0\u67E5")) out.push("work/book.md");
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
    if (phase === 2) candidates.push("work/explore.md");
    else if (phase === 4) candidates.push(chapterRel(goldChapterNo(meta)));
    else if (phase === 5 || phase === 6) candidates.push("work/book.md");
  }
  return candidates;
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
var phaseSegments = (segments, phase) => (segments ?? []).filter((seg) => phaseOfSegment(seg) === phase);
function relPath(rel) {
  return String(rel ?? "").replace(/\\/g, "/").replace(/^(?:\.\/)+/, "");
}
var CHAPTER_NAME_RE = /^work\/chapter-(\d+)\.md$/;
var ARCHIVED_NAME_RE = /^work\/_旧版产物\/(?:[^/]+\/)?(.+)$/;
var GATE_PROPOSAL_NAME_RE = /^提案\/关卡(\d+)-v(\d+)\.md$/;
var CONVERTED_SOURCE_NAME_RE = /^sources-md\/(.+)$/;
var DRAFT_STAMP_RE = /\.[0-9a-z]+$/i;
function artifactKind(rel) {
  const path = relPath(rel);
  if (CHAPTER_NAME_RE.test(path)) return "\u6B63\u6587";
  if (/^work\/_旧版产物\//.test(path)) return "\u65E7\u7A3F";
  if (/^提案\//.test(path)) return "\u62CD\u677F\u65B9\u6848";
  if (/^sources-md\//.test(path)) return "\u6750\u6599\u8F6C\u6362\u7A3F";
  if (path === "work/explore.md") return "\u6311\u91CD\u70B9\u7684\u7ED3\u679C";
  if (path === "work/outline.md") return "\u7AE0\u8282\u5B89\u6392";
  if (path === "work/style-spec.md") return "\u5199\u4F5C\u89C4\u8303";
  if (path === "work/book.md") return "\u6210\u4E66";
  return "\u6587\u4EF6";
}
function draftBaseName(file) {
  const stripped = file.replace(DRAFT_STAMP_RE, "");
  return stripped.endsWith(".md") ? stripped : file;
}
function nameForRel(path) {
  const chapter = CHAPTER_NAME_RE.exec(path);
  if (chapter !== null) return `\u7B2C ${Number(chapter[1])} \u7AE0`;
  const archived = ARCHIVED_NAME_RE.exec(path);
  if (archived !== null) {
    const base = nameForRel(`work/${draftBaseName(archived[1])}`);
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
  if (path === "work/explore.md") return "\u8BFB\u6750\u6599\u6311\u91CD\u70B9\u7684\u7ED3\u679C";
  if (path === "work/outline.md") return "\u7AE0\u8282\u5B89\u6392";
  if (path === "work/style-spec.md") return "\u5199\u4F5C\u89C4\u8303";
  if (path === "work/book.md") return "\u6210\u4E66";
  return "";
}
function artifactName(rel) {
  const path = relPath(rel);
  const name = nameForRel(path);
  return name === "" ? artifactKind(path) : name;
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
  const verdict = decision.approved === true ? "\u2705 \u901A\u8FC7" : "\u274C \u9A73\u56DE";
  return decision.note ? `${verdict}\uFF08${decision.note}\uFF09` : verdict;
}
function phaseSummary(segments, phase, workFiles) {
  const segs = phaseSegments(segments, phase).map((seg) => ({
    key: seg.key,
    title: segmentHuman(seg),
    status: seg.status,
    statusWord: stepWord(seg.status),
    decision: decisionText(seg),
    canDeepModify: seg.canDeepModify === true,
    artifacts: openableArtifacts(seg, workFiles)
  }));
  const artifacts = segs.flatMap(
    (row) => row.artifacts.map((item) => ({ ...item, step: row.title, stepKey: row.key }))
  );
  return {
    phase,
    name: PHASE_UI[phase] ?? String(phase),
    intro: PHASE_INTRO[phase] ?? "",
    segs,
    artifacts,
    doneCount: segs.filter((row) => row.status === "done").length
  };
}
function phaseSteps(payload, phase, workFiles) {
  const { segments } = stepPayloadOf(payload);
  return stepsOf(payload).filter((step) => step.phase === phase).map((step) => ({
    key: step.key,
    title: stepLabel(step),
    status: step.status,
    // 四态词取自步模型自己算好的那一份（它就是 stepWord 的结果，不在这里第二次数）。
    statusWord: step.statusWord,
    chapter: step.chapter,
    // 定点修改的粒度是**段**：提交时把段 key 交出去，不是步 key（`chapter-1:write` 后端不认）。
    segmentKey: step.segmentKey,
    canDeepModify: step.canDeepModify === true,
    decision: decisionText(step.segment),
    artifacts: openableArtifacts(step.segment, workFiles),
    // 影响预告（票 11）：这一步改了会连带重做哪些**下游**，出口已经是人读名字。
    downstream: downstreamNames(step, segments)
  }));
}
function downstreamNames(step, segments) {
  const keys = Array.isArray(step.segment?.downstream) ? step.segment.downstream : [];
  const byKey = /* @__PURE__ */ new Map();
  for (const seg of segments)
    if (seg?.key !== void 0 && seg?.key !== null) byKey.set(String(seg.key), seg);
  const names = [];
  const seen = /* @__PURE__ */ new Set();
  for (const raw of keys) {
    const key = String(raw ?? "");
    if (key === "" || key === step.segmentKey) continue;
    const seg = byKey.get(key);
    const name = seg === void 0 ? segmentHuman(key) : segmentHuman(seg);
    if (name === "" || name === key) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names;
}
var CHAPTER_STEPS = Object.freeze([
  { key: "write", name: "\u5199" },
  { key: "audit", name: "\u5BA1" },
  { key: "finalize", name: "\u590D\u6838" }
]);
var SEGMENT_STEP_TITLE = Object.freeze({ final: "\u6700\u540E\u68C0\u67E5\u4E0E\u4EA4\u4ED8" });
var MATERIAL_STEP_KEY = "material";
var chapterStepKey = (segmentKey, stepKey) => `${segmentKey}:${stepKey}`;
function chapterStepStatuses(stage, segStatus) {
  if (stage === "writing") return ["active", "pending", "pending"];
  if (stage === "auditing") return ["done", "active", "pending"];
  if (stage === "audited") return ["done", "done", "pending"];
  if (stage === "finalizing") return ["done", "done", "active"];
  if (stage === "done") return ["done", "done", "done"];
  if (segStatus === "done") return ["done", "done", "done"];
  if (segStatus === "waiting-user") return ["waiting-user", "pending", "pending"];
  if (segStatus === "active") return ["active", "pending", "pending"];
  return ["pending", "pending", "pending"];
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
function stepPayloadOf(payload) {
  if (Array.isArray(payload)) return { segments: payload, meta: void 0 };
  return {
    segments: Array.isArray(payload?.segments) ? payload.segments : [],
    meta: payload?.meta ?? void 0
  };
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
function chapterStepPhase(seg) {
  const phase = seg === null || seg === void 0 ? null : phaseOfSegment(seg);
  return Number.isInteger(phase) ? phase : SEGMENT_PHASE.chapter;
}
function stepsOf(payload) {
  const { segments, meta } = stepPayloadOf(payload);
  const steps = [];
  const pushMaterialStep = () => {
    const status = materialStepStatus(meta, segments);
    steps.push({
      key: MATERIAL_STEP_KEY,
      title: PHASE_UI[1] ?? "",
      phase: 1,
      status,
      statusWord: stepWord(status),
      chapter: null,
      segmentKey: null,
      segment: null,
      canDeepModify: false
    });
  };
  const pushChapterSteps = (n, seg) => {
    const stage = seg?.stage ?? chapterPipelineStage(meta, n);
    const statuses = chapterStepStatuses(stage, seg?.status);
    const segmentKey = seg?.key ?? `chapter-${n}`;
    for (let i = 0; i < CHAPTER_STEPS.length; i += 1) {
      steps.push({
        key: chapterStepKey(segmentKey, CHAPTER_STEPS[i].key),
        title: `\u7B2C ${n} \u7AE0 \xB7 ${CHAPTER_STEPS[i].name}`,
        phase: chapterStepPhase(seg),
        status: statuses[i],
        statusWord: stepWord(statuses[i]),
        chapter: n,
        segmentKey: seg?.key ?? null,
        segment: seg ?? null,
        canDeepModify: seg?.canDeepModify === true
      });
    }
  };
  const pushSegmentStep = (seg) => {
    steps.push({
      key: String(seg?.key ?? ""),
      title: SEGMENT_STEP_TITLE[seg?.key] ?? segmentHuman(seg),
      phase: phaseOfSegment(seg),
      status: seg?.status ?? "pending",
      statusWord: stepWord(seg?.status),
      chapter: null,
      segmentKey: seg?.key ?? null,
      segment: seg ?? null,
      canDeepModify: seg?.canDeepModify === true
    });
  };
  pushMaterialStep();
  const chapterSegs = segments.filter((seg) => seg?.kind === "chapter").map((seg, index) => ({ seg, n: chapterNoOfSegment(seg, index + 1) })).sort((a, b) => a.n - b.n);
  const byChapterNo = new Map(chapterSegs.map((row) => [row.n, row.seg]));
  const chapterTotal = chapterCountOf(segments, meta);
  for (let phase = 2; phase <= 6; phase += 1) {
    const rows = segments.filter((seg) => phaseOfSegment(seg) === phase);
    if (phase === 5) {
      for (let n = 1; n <= chapterTotal; n += 1)
        pushChapterSteps(n, byChapterNo.get(n));
      for (const seg of rows) if (seg?.kind !== "chapter") pushSegmentStep(seg);
      continue;
    }
    for (const seg of rows) pushSegmentStep(seg);
  }
  for (const seg of segments) if (phaseOfSegment(seg) === null) pushSegmentStep(seg);
  return steps.map((step, index) => ({ no: index + 1, ...step }));
}
function stepCount(payload) {
  const { segments, meta } = stepPayloadOf(payload);
  const steps = stepsOf(payload);
  const chapters = chapterCountOf(segments, meta);
  return {
    chapters,
    chaptersPlanned: chapters > 0,
    known: steps.length,
    total: chapters > 0 ? 3 * chapters + 10 : null,
    remaining: steps.filter((step) => step.status !== "done").length
  };
}
function stepLabel(step) {
  return String(step?.title ?? "");
}
function stepWord(status) {
  if (status === "done") return "\u5DF2\u5B8C\u6210";
  if (status === "waiting-user") return "\u8F6E\u5230\u4F60";
  if (status === "active") return "\u6211\u6B63\u5728\u505A";
  return "\u8FD8\u6CA1\u5230\u8FD9\u4E00\u6B65";
}
var PHASE_INTRO = Object.freeze({
  1: "\u4F60\u628A\u6559\u6750 PDF \u4F20\u4E0A\u6765\uFF0C\u673A\u5668\u628A\u5B83\u8F6C\u6210\u80FD\u8BFB\u7684\u6B63\u6587\u3002",
  2: "AI \u8BFB\u5B8C\u6750\u6599\u3001\u6311\u51FA\u91CD\u70B9\uFF0C\u7B49\u4F60\u786E\u8BA4\u3002",
  3: "\u4E09\u6B21\u62CD\u677F\uFF1A\u5B9A\u4E0B\u5B66\u4E60\u76EE\u6807\u4E0E\u96BE\u70B9\u3001\u6559\u5B66\u65B9\u6CD5\u4E0E\u677F\u5757\u3001\u5168\u4E66\u67B6\u6784\u4E0E\u7AE0\u8282\uFF0C\u518D\u6392\u597D\u7AE0\u8282\u3002",
  4: "\u5148\u5199\u4E00\u7AE0\u7ED9\u4F60\u8FC7\u76EE\uFF0C\u5B9A\u4E0B\u5168\u4E66\u98CE\u683C\u3002",
  5: "\u4E00\u7AE0\u4E00\u7AE0\u5199\uFF0C\u6BCF\u7AE0\u673A\u5668\u68C0\u67E5\u8FC7\uFF0C\u4F60\u968F\u65F6\u80FD\u62BD\u67E5\u63D0\u610F\u89C1\u3002",
  6: "AI \u628A\u5168\u4E66\u6574\u4F53\u8C03\u6574\u4E00\u904D + \u673A\u5668\u786C\u68C0\u67E5\uFF0C\u4F60\u8BA4\u53EF\u540E\u4EA4\u4ED8\u3002"
});

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

// src/ui/phase-page.js
var import_react5 = require("react");

// src/ui/open-artifact-button.js
var import_react2 = require("react");
function OpenArtifactButton(props) {
  return (0, import_react2.createElement)(
    "button",
    {
      style: {
        marginLeft: "auto",
        border: "1px solid var(--dsw-border, #d0d7de)",
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
      onClick: () => props.onOpen(props.item.path),
      disabled: props.disabled === true,
      // 票 10（判定三 #1）：这里原来印 `${props.item.path}`（`work/explore.md` 这类机器路径）。
      // CONTEXT.md「产物名」明写「产物相对路径原文连按钮的悬浮提示一起不上屏」——名字一律走
      // `artifactName`（票 05 的同一份词表，任何屏同一个名字）。
      title: props.title ?? `\u5728\u53F3\u680F\u6253\u5F00\u300C${artifactName(props.item.path)}\u300D`
    },
    props.label ?? "\u6253\u5F00"
  );
}

// src/ui/chapters-map.js
var import_react4 = require("react");

// src/ui/gold-table.js
var import_react3 = require("react");
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
    return (0, import_react3.createElement)(
      "div",
      { style: { ...S.card, opacity: 0.85 } },
      (0, import_react3.createElement)(
        "p",
        { style: { margin: "0" } },
        "\u{1F4CB} \u672C\u7A3F\u610F\u89C1\u5355\u8FD8\u7A7A\u7740\uFF1A\u8BFB\u4E0B\u9762\u7684\u7A3F\u5B50\u968F\u624B\u6807\u8BB0\uFF0C\u6216\u7528\u6700\u5E95\u4E0B\u7684\u300C\u7B3C\u7EDF\u63D0\u4E00\u6761\u300D\u3002"
      )
    );
  }
  let seq = 0;
  const rows = list.map((o) => {
    if (o.status === "revoked") {
      return (0, import_react3.createElement)(
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
    return (0, import_react3.createElement)(
      "div",
      { key: o.id, style: { ...S.card, marginBottom: "6px" } },
      (0, import_react3.createElement)(
        "div",
        {
          style: {
            display: "flex",
            gap: "8px",
            alignItems: "baseline",
            flexWrap: "wrap"
          }
        },
        (0, import_react3.createElement)("strong", null, `#${seq}`),
        (0, import_react3.createElement)("span", null, OPINION_KIND_TEXT[o.kind] ?? o.kind),
        (0, import_react3.createElement)(
          "span",
          { style: { opacity: 0.75, fontSize: "12px" } },
          target
        ),
        o.wish ? (0, import_react3.createElement)("span", null, o.wish) : null,
        (0, import_react3.createElement)(
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
          (0, import_react3.createElement)(
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
  return (0, import_react3.createElement)(
    "div",
    null,
    (0, import_react3.createElement)(
      "p",
      { style: { margin: "0 0 6px", fontWeight: 600 } },
      `\u{1F4CB} \u672C\u7A3F\u610F\u89C1\u5355\uFF08${seq} \u6761\uFF09`
    ),
    ...rows,
    onRevise !== void 0 ? (0, import_react3.createElement)(
      "div",
      { style: { margin: "8px 0" } },
      (0, import_react3.createElement)(
        "button",
        {
          style: S.bigBtn(true),
          onClick: onRevise,
          disabled: busy || pendingCount === 0
        },
        pendingCount > 0 ? `\u{1F501} \u8BA9 AI \u7167\u8FD9\u4E9B\u6539\uFF08${pendingCount} \u6761\uFF09` : "\u{1F501} \u8BA9 AI \u7167\u8FD9\u4E9B\u6539"
      ),
      pendingCount === 0 ? (0, import_react3.createElement)(
        "span",
        {
          style: { marginLeft: "8px", fontSize: "12px", opacity: 0.7 }
        },
        "\u5148\u6807\u8BB0\u81F3\u5C11\u4E00\u6761\u610F\u89C1\uFF08\u6BB5\u65C1\u4E09\u952E\u6216\u7B3C\u7EDF\u4FBF\u7B7E\uFF09"
      ) : null,
      (0, import_react3.createElement)(
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
  const [hover, setHover] = (0, import_react3.useState)(null);
  const [formPara, setFormPara] = (0, import_react3.useState)(null);
  const [wishText, setWishText] = (0, import_react3.useState)("");
  const [wishError, setWishError] = (0, import_react3.useState)(null);
  const [generalKind, setGeneralKind] = (0, import_react3.useState)("change");
  const [generalText, setGeneralText] = (0, import_react3.useState)("");
  const [generalError, setGeneralError] = (0, import_react3.useState)(null);
  const [pulsePhase, setPulsePhase] = (0, import_react3.useState)(null);
  (0, import_react3.useEffect)(() => {
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
  return (0, import_react3.createElement)(
    "div",
    { style: { paddingLeft: "34px", paddingRight: "68px" } },
    !readOnly ? (0, import_react3.createElement)(
      "p",
      { style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
      // 票 10（判定四③）：原句 69 字本就在 90 字内，只删了「提完」前那个句号造成的断句
      // （同一句连着读更省字），信息一条不丢。
      "\u6807\u8BB0\u65B9\u6CD5\uFF1A\u9F20\u6807\u505C\u5728\u54EA\u4E00\u6BB5\uFF0C\u90A3\u6BB5\u53F3\u4FA7\u5C31\u4EAE\u51FA\u4E09\u4E2A\u952E \u{1F615}\u{1F5D1}\u270F\uFE0F\uFF1B\u4E0D\u6307\u54EA\u6BB5\u5C31\u7528\u6700\u5E95\u4E0B\u300C\u7B3C\u7EDF\u63D0\u4E00\u6761\u300D\uFF0C\u63D0\u5B8C\u70B9\u610F\u89C1\u5355\u91CC\u7684\u3010\u8BA9 AI \u7167\u8FD9\u4E9B\u6539\u3011\u3002"
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
      return (0, import_react3.createElement)(
        "div",
        {
          key: n,
          // 段容器相对定位：装订线、三键浮出都以它为参照，正文不占这些位置。
          style: { position: "relative" },
          onMouseEnter: () => setHover(n),
          onMouseLeave: () => setHover((cur) => cur === n ? null : cur)
        },
        // 左侧装订线：段号 + 已标 #N 标签（不指段时淡出到 0.35，指到时亮起）。
        (0, import_react3.createElement)(
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
          marks.length > 0 ? (0, import_react3.createElement)(
            "span",
            { style: { display: "block" } },
            marks.join(" ")
          ) : null
        ),
        // 正文段落：纯流式 + markdown 最小渲染（标题/加粗/列表行）。
        (0, import_react3.createElement)("p", { style: READER_PARA_STYLE }, ...renderInline(para)),
        formPara === n ? (0, import_react3.createElement)(
          "div",
          { style: { margin: "-4px 0 8px" } },
          (0, import_react3.createElement)("textarea", {
            style: { ...S.input, width: "100%", boxSizing: "border-box" },
            rows: 2,
            placeholder: "\u5199\u4E00\u53E5\u4F60\u60F3\u8BA9\u5B83\u53D8\u6210\u4EC0\u4E48\u6837\uFF08\u4F8B\uFF1A\u5F00\u5934\u522B\u53CD\u95EE\uFF0C\u76F4\u63A5\u8BB2\u9053\u7406\uFF09",
            value: wishText,
            onChange: (e) => {
              setWishText(e.target.value);
              setWishError(null);
            }
          }),
          (0, import_react3.createElement)(
            "div",
            {
              style: { display: "flex", gap: "8px", alignItems: "center" }
            },
            (0, import_react3.createElement)(
              "button",
              {
                style: S.bigBtn(true),
                onClick: submitWish,
                disabled: busy
              },
              "\u2705 \u8BB0\u4E0B\u8FD9\u6761"
            ),
            (0, import_react3.createElement)(
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
            wishError !== null ? (0, import_react3.createElement)("span", { style: S.error }, wishError) : null
          )
        ) : null,
        // 三键浮出（absolute 定在段右上角、不占正文宽度）：F36 常显淡态 0.3（可感知、不占位），
        // 悬停或首段引导脉冲时全亮；键始终可点（悬停键本身也算悬停该段）。
        !readOnly ? (0, import_react3.createElement)(
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
              return (0, import_react3.createElement)(
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
    !readOnly ? (0, import_react3.createElement)(
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
      (0, import_react3.createElement)(
        "span",
        { style: { fontSize: "12px", opacity: 0.75 } },
        "\u7B3C\u7EDF\u63D0\u4E00\u6761\uFF08\u4E0D\u6307\u54EA\u6BB5\u4E5F\u884C\uFF09\uFF1A"
      ),
      ["dislike", "drop", "change"].map(
        (k) => (0, import_react3.createElement)(
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
      (0, import_react3.createElement)("input", {
        style: { ...S.input, flex: "1 1 160px", minWidth: "120px" },
        placeholder: "\u4F8B\uFF1A\u6574\u4F53\u8BED\u6C14\u518D\u4EB2\u5207\u4E00\u70B9",
        value: generalText,
        onChange: (e) => {
          setGeneralText(e.target.value);
          setGeneralError(null);
        }
      }),
      (0, import_react3.createElement)(
        "button",
        { style: S.bigBtn(true), onClick: submitGeneral, disabled: busy },
        "\u7B3C\u7EDF\u63D0\u4E00\u6761"
      ),
      generalError !== null ? (0, import_react3.createElement)("span", { style: S.error }, generalError) : null
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
  const chipSpan = (n) => (0, import_react3.createElement)(
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
      return (0, import_react3.createElement)(
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
    return (0, import_react3.createElement)(
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
  return (0, import_react3.createElement)(
    "div",
    null,
    (0, import_react3.createElement)(
      "p",
      { style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
      // 票 10（判定四③）：原句 96 字压到 90 字内——「AI 会对号入座」属客套（意见单里就写着哪条
      // 是哪条），删掉后只留三种颜色/编号各自什么意思。
      `\u5BF9\u7167\u65B9\u5F0F\uFF1A\u7EA2\u5E95\u5212\u6389\u7684\u662F\u65E7\u7A3F\u5220\u6389\u7684\uFF1B\u7EFF\u5E95\u662F\u65B0\u7A3F\u6539\u6210\u7684\uFF1B#\u53F7\u5BF9\u5E94\u610F\u89C1\u5355\u91CC\u7684\u7B2C\u51E0\u6761${generalCount > 0 ? `\uFF08\u53E6\u6709 ${generalCount} \u6761\u7B3C\u7EDF\u610F\u89C1\uFF09` : ""}\u3002`
    ),
    ...blocks
  );
}
function GoldFinalize(props) {
  const { meta, opinions, busy, onApprove, onSuggestWords } = props;
  const [targetWords, setTargetWords] = (0, import_react3.useState)("");
  const [suggesting, setSuggesting] = (0, import_react3.useState)(false);
  const [suggestion, setSuggestion] = (0, import_react3.useState)(null);
  const [error, setError] = (0, import_react3.useState)(null);
  const [confirming, setConfirming] = (0, import_react3.useState)(null);
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
  return (0, import_react3.createElement)(
    "div",
    { style: S.card },
    (0, import_react3.createElement)(
      "p",
      { style: { margin: "0 0 6px", fontWeight: 600 } },
      // 票 10（判定一 #4）：「样板」是界面词表外的第三套叫法，统一成「最佳范例章」。
      "\u2705 \u6EE1\u610F\u4E86\u5C31\u5B9A\u7A3F\uFF08\u8FD9\u4E00\u7AE0\u5C31\u662F\u5168\u4E66\u7684\u6700\u4F73\u8303\u4F8B\u7AE0\uFF09"
    ),
    (0, import_react3.createElement)(
      "div",
      { style: { margin: "6px 0" } },
      (0, import_react3.createElement)(
        "p",
        { style: { margin: "0 0 4px", fontSize: "12px", opacity: 0.8 } },
        "\u6BCF\u7AE0\u5B57\u6570\uFF08\u6765\u81EA\u7AE0\u8282\u5B89\u6392\uFF0C\u53EF\u53EA\u8C03\u8FD9\u4E00\u7AE0\uFF09\uFF1A"
      ),
      (meta.outline?.chapters ?? []).map(
        (chapter, index) => (0, import_react3.createElement)(
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
          (0, import_react3.createElement)(
            "span",
            { style: { opacity: 0.6 } },
            Number.isFinite(chapter.targetWords) ? `\u7EA6 ${chapter.targetWords} \u5B57` : "\u672A\u5B9A\uFF0CAI \u5199\u6574\u672C\u65F6\u81EA\u5B9A"
          ),
          chapter.volumeReason ? (0, import_react3.createElement)(
            "span",
            { style: { opacity: 0.5 } },
            `\uFF08${chapter.volumeReason}\uFF09`
          ) : null
        )
      ),
      Number.isFinite(meta.targetWords) ? (0, import_react3.createElement)(
        "p",
        { style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.6 } },
        `\u515C\u5E95\u7EDF\u4E00\u503C\uFF1A${meta.targetWords} \u5B57\uFF08\u4EC5\u672A\u586B\u7AE0\u4F7F\u7528\uFF09`
      ) : null
    ),
    (0, import_react3.createElement)(
      "div",
      {
        style: {
          display: "flex",
          gap: "6px",
          alignItems: "center",
          flexWrap: "wrap"
        }
      },
      (0, import_react3.createElement)(
        "label",
        { style: S.label },
        "\u515C\u5E95\u7EDF\u4E00\u5B57\u6570\uFF08\u53EF\u9009\uFF0C\u4EC5\u672A\u586B\u7AE0\u4F7F\u7528\uFF09"
      ),
      (0, import_react3.createElement)("input", {
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
      (0, import_react3.createElement)(
        "button",
        {
          style: { ...S.bigBtn(true), padding: "6px 14px" },
          onClick: requestSuggestion,
          disabled: suggesting || busy
        },
        suggesting ? "AI \u601D\u8003\u4E2D\u2026" : "\u2728 AI \u5EFA\u8BAE"
      )
    ),
    suggestion !== null ? (0, import_react3.createElement)(
      "div",
      { style: { margin: "4px 0", fontSize: "12px", opacity: 0.8 } },
      (0, import_react3.createElement)(
        "p",
        { style: { margin: "0 0 4px" } },
        `\u{1F916} AI \u5EFA\u8BAE\uFF1A\u6BCF\u7AE0 ${suggestion.suggested} \u5B57\uFF08${suggestion.range ?? ""}\uFF09\u3002${suggestion.reason ?? ""}`
      ),
      (suggestion.perChapter ?? []).length > 0 ? (0, import_react3.createElement)(
        "div",
        null,
        (suggestion.perChapter ?? []).map(
          (item) => (0, import_react3.createElement)(
            "div",
            { key: item.n, style: { margin: "1px 0" } },
            `${item.n}. ${item.title ?? ""}\uFF1A${Number.isFinite(item.words) ? `\u7EA6 ${item.words} \u5B57` : "\u672A\u5B9A\uFF0CAI \u5199\u6574\u672C\u65F6\u81EA\u5B9A"}${item.reason ? `\uFF08${item.reason}\uFF09` : ""}`
          )
        )
      ) : null
    ) : null,
    !wordsEmpty && !wordsOk ? (0, import_react3.createElement)(
      "p",
      { style: S.error },
      "\u515C\u5E95\u5B57\u6570\u8BF7\u5728 500-50000 \u4E4B\u95F4\uFF0C\u6216\u7559\u7A7A\u53EA\u7528\u6BCF\u7AE0\u6E05\u5355"
    ) : null,
    error !== null ? (0, import_react3.createElement)("p", { style: S.error }, `\u26A0\uFE0F ${error}`) : null,
    (0, import_react3.createElement)(
      "div",
      {
        style: {
          display: "flex",
          gap: "8px",
          marginTop: "8px",
          alignItems: "center"
        }
      },
      (0, import_react3.createElement)(
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
      (0, import_react3.createElement)(
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
    (0, import_react3.createElement)(
      "p",
      { style: S.hint },
      // 票 14（承诺账 A2）：机制只透出 `pending`/`sent` 的意见（engine.js 的 gold 分支）——
      // 已经点过「让 AI 照这些改」的那批不再随整版重写下发，所以限定成「还没处理的意见」。
      "\u4ECE\u5934\u91CD\u5199\u8FD9\u4E00\u7AE0\uFF1B\u8FD8\u6CA1\u5904\u7406\u7684\u610F\u89C1\u4F1A\u4E00\u5E76\u5E26\u7ED9 AI \u5F53\u65B9\u5411"
    ),
    confirming === "seal" ? (0, import_react3.createElement)(
      "div",
      {
        style: {
          ...S.card,
          borderColor: "var(--dsw-accent, #4f6ef7)",
          marginTop: "8px"
        }
      },
      (0, import_react3.createElement)(
        "p",
        { style: { margin: "0 0 4px", fontWeight: 600 } },
        // 票 14（承诺账 A2）：「永久生效」与机制自相矛盾——风格线可被收回
        // （collab-signals 的 style-note-revoke 置 superseded，界面自己也渲染「·（已收回）」）。
        // 改成「会生效」＋把收回的路说给用户（收回入口在对话侧，界面没有）。
        "\u5B9A\u7A3F\u524D\u786E\u8BA4\uFF1A\u4E0B\u9762\u8FD9\u4E9B\u4F1A\u751F\u6548\uFF08\u60F3\u6536\u56DE\uFF0C\u53EF\u4EE5\u5728\u5BF9\u8BDD\u91CC\u8DDF AI \u8BF4\uFF09"
      ),
      (0, import_react3.createElement)(
        "p",
        { style: { margin: "0 0 4px", fontSize: "12px", opacity: 0.85 } },
        "\u2460 \u4F60\u7684\u610F\u89C1\u8F6C\u6210\u300C\u98CE\u683C\u7EBF\u300D\uFF0C\u540E\u9762\u6BCF\u4E00\u7AE0\u90FD\u7167\u6B64\u6267\u884C\uFF1A"
      ),
      live.map(
        (o, i) => (0, import_react3.createElement)(
          "p",
          {
            key: o.id,
            style: { margin: "0 2px 2px 12px", fontSize: "12px" }
          },
          `#${i + 1} ${OPINION_KIND_TEXT[o.kind] ?? o.kind}${o.wish ? `\uFF1A${o.wish}` : ""}`
        )
      ),
      (0, import_react3.createElement)(
        "p",
        { style: { margin: "4px 0", fontSize: "12px", opacity: 0.85 } },
        // 票 10（判定一 #4）：同上，「样板」→「最佳范例章」。
        "\u2461 \u8FD9\u4E00\u7A3F\u5B9A\u4E0B\u6765\u5F53\u6700\u4F73\u8303\u4F8B\u7AE0\uFF0CAI \u5199\u6574\u672C\u65F6\u90FD\u7167\u7740\u5B83\u3002"
      ),
      (0, import_react3.createElement)(
        "div",
        { style: { display: "flex", gap: "8px", marginTop: "6px" } },
        (0, import_react3.createElement)(
          "button",
          {
            style: S.bigBtn(true),
            onClick: () => onApprove(true, targetToSend),
            disabled: busy || !wordsOk
          },
          "\u786E\u8BA4\uFF0C\u5B9A\u7A3F"
        ),
        (0, import_react3.createElement)(
          "button",
          { style: S.smallLink, onClick: () => setConfirming(null) },
          "\u518D\u60F3\u60F3"
        )
      )
    ) : null,
    confirming === "rewrite" ? (0, import_react3.createElement)(
      "div",
      {
        style: {
          ...S.card,
          borderColor: "var(--dsw-danger, #cf222e)",
          marginTop: "8px"
        }
      },
      (0, import_react3.createElement)(
        "p",
        { style: { margin: "0 0 6px" } },
        // 票 14（承诺账 A2）：归档是「尽力」语义（gold.js 的 `try { renameSync } catch {}`），
        // 「不丢」是全集承诺——收掉。
        "\u6574\u7A3F\u4E22\u5F03\u91CD\u5199\uFF1A\u8FD9\u4E00\u7A3F\u4F1A\u5F52\u6863\u7559\u5E95\uFF0CAI \u4ECE\u5934\u518D\u5199\u4E00\u7248\u3002"
      ),
      (0, import_react3.createElement)(
        "div",
        { style: { display: "flex", gap: "8px" } },
        (0, import_react3.createElement)(
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
        (0, import_react3.createElement)(
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
  const [texts, setTexts] = (0, import_react3.useState)({});
  const [view, setView] = (0, import_react3.useState)({ tab: goldDraftVersion, mode: "read" });
  const [auditText, setAuditText] = (0, import_react3.useState)(void 0);
  const [loadError, setLoadError] = (0, import_react3.useState)(null);
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
  (0, import_react3.useEffect)(() => {
    load(currentPath);
    fetchText(`work/audit-${String(goldNo).padStart(2, "0")}.md`).then(setAuditText).catch(() => setAuditText(null));
  }, []);
  const showTab = Math.min(view.tab, goldDraftVersion);
  const showPath = pathOf(showTab);
  (0, import_react3.useEffect)(() => {
    if (showPath !== null) load(showPath);
  }, [showPath]);
  const showText = showPath === null ? null : texts[showPath] ?? null;
  const compareWith = view.mode === "compare" ? showTab === goldDraftVersion ? showTab - 1 : showTab + 1 : null;
  const comparePath = compareWith !== null ? pathOf(compareWith) : null;
  (0, import_react3.useEffect)(() => {
    if (comparePath !== null) load(comparePath);
  }, [comparePath]);
  const compareText = comparePath === null ? null : texts[comparePath] ?? null;
  let auditBadge = "\u{1F9EA} \u68C0\u67E5\uFF1A\u5DF2\u9644\u68C0\u67E5\u8BB0\u5F55";
  if (auditText != null) {
    try {
      const audit = JSON.parse(auditText);
      auditBadge = typeof audit.passed === "boolean" ? audit.passed === true ? "\u{1F9EA} \u68C0\u67E5\uFF1A\u901A\u8FC7\uFF08\u6CA1\u6709\u5F85\u5B8C\u5584\u9879\uFF09" : "\u{1F9EA} \u68C0\u67E5\uFF1A\u6709\u51E0\u5904\u5F85\u5B8C\u5584\uFF08\u53EF\u4EE5\u8BA9 AI \u6539\uFF09" : "\u{1F9EA} \u68C0\u67E5\uFF1A\u8BB0\u5F55\u683C\u5F0F\u5F85\u5B8C\u5584";
    } catch {
      auditBadge = "\u{1F9EA} \u68C0\u67E5\uFF1A\u8BB0\u5F55\u683C\u5F0F\u5F85\u5B8C\u5584";
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
  const tabBtn = (v) => (0, import_react3.createElement)(
    "button",
    {
      key: v,
      style: S.projectBtn(view.tab === v),
      onClick: () => setView({ tab: v, mode: "read" })
    },
    `\u7B2C ${v} \u7A3F${v === goldDraftVersion ? "\uFF08\u6700\u65B0\uFF09" : ""}`
  );
  return (0, import_react3.createElement)(
    "div",
    { style: S.focus },
    (0, import_react3.createElement)(
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
      (0, import_react3.createElement)(
        "strong",
        { style: { fontSize: "14px" } },
        "\u{1F91D} \u6700\u4F73\u8303\u4F8B\u7AE0 \xB7 \u4E00\u8D77\u5B9A\u98CE\u683C"
      ),
      (0, import_react3.createElement)(
        "span",
        { style: { fontSize: "12px", opacity: 0.8 } },
        auditBadge
      )
    ),
    goldDraftVersion > 1 ? (0, import_react3.createElement)(
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
      showTab === goldDraftVersion ? (0, import_react3.createElement)(
        "button",
        {
          style: S.smallLink,
          onClick: () => setView({
            tab: showTab,
            mode: view.mode === "compare" ? "read" : "compare"
          })
        },
        view.mode === "compare" ? "\u53EA\u770B\u8FD9\u4E00\u7A3F" : `\u548C\u7B2C ${goldDraftVersion - 1} \u7A3F\u5BF9\u6BD4`
      ) : (0, import_react3.createElement)(
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
    loadError !== null ? (0, import_react3.createElement)("p", { style: S.error }, `\u7A3F\u5B50\u6253\u5F00\u5931\u8D25\uFF1A${loadError}`) : null,
    (0, import_react3.createElement)(
      "div",
      { style: { margin: "6px 0" } },
      showText === null ? (0, import_react3.createElement)("p", { style: S.hint }, "\u52A0\u8F7D\u4E2D\u2026") : view.mode === "compare" && compareText !== null ? (0, import_react3.createElement)(
        "div",
        null,
        (0, import_react3.createElement)(
          "p",
          { style: S.hint },
          "\u60F3\u5728\u8FD9\u4E00\u7A3F\u4E0A\u7EE7\u7EED\u6311\u6BDB\u75C5\uFF1F\u70B9\u300C\u53EA\u770B\u8FD9\u4E00\u7A3F\u300D\u3002"
        ),
        (0, import_react3.createElement)(GoldCompare, {
          oldText: showTab === goldDraftVersion ? compareText : showText,
          newText: showTab === goldDraftVersion ? showText : compareText,
          opinions
        })
      ) : (0, import_react3.createElement)(GoldReader, {
        text: showText,
        opinions,
        busy,
        onOpinion: addOpinion,
        onRevokeOpinion: (id) => {
          void postAction({ action: "gold-opinion-revoke", id });
        },
        readOnly: showTab !== goldDraftVersion
      }),
      showTab !== goldDraftVersion && view.mode === "read" ? (0, import_react3.createElement)(
        "p",
        { style: { fontSize: "12px", opacity: 0.7, margin: "4px 0" } },
        // 票 10（判定四①）：与上面「想在这一稿上继续挑毛病？点『只看这一稿』」是同一件事
        // 的两种说法（一条讲怎么改、一条讲为什么不能改），收敛成这一句——它信息量大
        // （说清了"旧稿只能回顾"这个原因）。两处不会同屏（mode 互斥），故只留一份字。
        "\u8FD9\u662F\u65E7\u7A3F\uFF0C\u53EA\u80FD\u56DE\u987E\uFF1B\u8981\u6311\u6BDB\u75C5\u8BF7\u56DE\u5230\u300C\u6700\u65B0\u300D\u90A3\u7A3F\u3002"
      ) : null
    ),
    (0, import_react3.createElement)(GoldOpinionList, {
      opinions,
      busy,
      onRevoke: (id) => {
        void postAction({ action: "gold-opinion-revoke", id });
      },
      onRevise: () => {
        void postAction({ action: "gold-revise" });
      }
    }),
    (0, import_react3.createElement)(GoldFinalize, {
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
var chapterRel2 = (n) => `work/chapter-${String(n).padStart(2, "0")}.md`;
function ChapterReviewLine(props) {
  const { review, busy, onRevoke } = props;
  const state = reviewState(review);
  const text = reviewText(review);
  const canRevoke = state.revocable && typeof review?.id === "string" && review.id !== "";
  return (0, import_react4.createElement)(
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
    (0, import_react4.createElement)("span", { style: { opacity: 0.6 } }, "\xB7"),
    (0, import_react4.createElement)(
      "span",
      { style: { flex: "1 1 160px", wordBreak: "break-word" } },
      text
    ),
    (0, import_react4.createElement)(
      "span",
      {
        style: {
          color: state.key === "pending" ? "#cf222e" : state.key === "applied" ? "#1a7f37" : "var(--dsw-text, #1f2328)",
          opacity: state.key === "revoked" ? 0.55 : 1
        }
      },
      state.text
    ),
    canRevoke ? (0, import_react4.createElement)(
      "button",
      {
        style: S.smallLink,
        onClick: onRevoke,
        disabled: busy,
        title: "\u628A\u8FD9\u6761\u610F\u89C1\u9000\u56DE\u672A\u5904\u7F6E\uFF1A\u8FD9\u4E00\u7AE0\u7684\u4EA4\u5DE5\u4F1A\u91CD\u65B0\u88AB\u5B83\u62E6\u4F4F"
      },
      "\u7FFB\u6848"
    ) : null
  );
}
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
  const [reviewing, setReviewing] = (0, import_react4.useState)(null);
  const [comment, setComment] = (0, import_react4.useState)("");
  const [openChapter, setOpenChapter] = (0, import_react4.useState)(
    () => Number.isSafeInteger(initialOpenChapter) && initialOpenChapter >= 1 ? initialOpenChapter : null
  );
  const [chapterText, setChapterText] = (0, import_react4.useState)(null);
  const [chapterError, setChapterError] = (0, import_react4.useState)(null);
  (0, import_react4.useEffect)(() => {
    let alive = true;
    setChapterText(null);
    setChapterError(null);
    if (openChapter === null || openChapter === void 0) return void 0;
    if (project === null || project === void 0) return void 0;
    const rel = chapterRel2(openChapter);
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
  const doneSet = (0, import_react4.useMemo)(
    () => deriveDoneSet(events, goldChapterNo(meta)),
    [events, meta]
  );
  const hasChapterFile = (n) => {
    const files = workFiles ?? [];
    if (files.length === 0) return true;
    return files.some((f) => f.path === chapterRel2(n));
  };
  const done = rows.filter((row) => {
    const found = (chapterStatus ?? []).find(
      (r) => Number(r.n) === row.n
    );
    if (typeof found?.done === "boolean") return found.done;
    return doneSet.has(row.n) && !hasPendingReview(pendingReviews, row.n);
  }).length;
  const prepared = (chapterStatus ?? []).length > 0;
  const sendReview = (n) => {
    if (comment.trim() === "") return;
    void onReview(n, comment.trim()).then(() => {
      setReviewing(null);
      setComment("");
    });
  };
  return (0, import_react4.createElement)(
    "div",
    { style: S.focus },
    reviewMode ? (0, import_react4.createElement)(
      "div",
      {
        style: {
          margin: "0 0 10px",
          padding: "8px 10px",
          borderRadius: "8px",
          background: "var(--dsw-accent-soft, #eef2ff)"
        }
      },
      (0, import_react4.createElement)("strong", null, "\u{1F4DA} \u5168\u90E8\u7AE0\u8282\u5199\u597D\u4E86\uFF0C\u8BF7\u4F60\u8FC7\u76EE"),
      (0, import_react4.createElement)(
        "p",
        { style: { margin: "4px 0", fontSize: "12px", opacity: 0.8 } },
        "\u60F3\u7EC6\u770B\u70B9\u300C\u770B\u770B\u8FD9\u7AE0\u300D\uFF1B\u6709\u610F\u89C1\u76F4\u63A5\u5199\uFF0CAI \u7167\u6539\uFF1B\u90FD\u6EE1\u610F\u5C31\u4EA4\u5DE5\u5408\u5E76\u3002"
      ),
      (0, import_react4.createElement)(
        "button",
        { style: S.bigBtn(true), onClick: onApproveAll, disabled: busy },
        "\u2705 \u90FD\u8FC7\u4E86\uFF0C\u4EA4\u5DE5"
      )
    ) : null,
    (0, import_react4.createElement)(
      "strong",
      { style: { fontSize: "14px" } },
      "\u{1F4DA} \u5199\u5B8C\u6574\u672C \xB7 \u7AE0\u8282\u6E05\u5355"
    ),
    (0, import_react4.createElement)(
      "p",
      { style: { margin: "4px 0 8px", fontSize: "12px", opacity: 0.75 } },
      // 票 10：①「审计」→「检查」（判定三 #8，界面一律说检查）；②判定四③ 原句 117 字压到 90 字内，
      // 删掉与全览条重复的步数解释与「与过目同一口径」这类内部口径说明，保留用户要做的事。
      `\u6BCF\u7AE0\u6D41\u7A0B\uFF1A\u5C0F\u52A9\u624B\u6267\u7B14 \u2192 \u5C0F\u52A9\u624B\u68C0\u67E5 \u2192 AI \u6700\u540E\u628A\u5173\u3002\u5DF2\u5B8C\u6210 ${done}/${rows.length} \u7AE0\uFF1B\u60F3\u7EC6\u770B\u70B9\u300C\u770B\u770B\u8FD9\u7AE0\u300D\uFF0C\u6709\u610F\u89C1\u76F4\u63A5\u5199\uFF0CAI \u7167\u6539\uFF0C\u5904\u7F6E\u8FC7\u7684\u610F\u89C1\u80FD\u7FFB\u6848\u3002`
    ),
    progressDetail !== null && progressDetail !== void 0 && progressDetail !== "" ? (0, import_react4.createElement)(
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
      const rowReviews = (pendingReviews ?? []).filter(
        (r) => Number(r.chapter) === Number(row.n)
      );
      const shownText = typeof chapterTextOverride === "string" && chapterTextOverride !== "" ? chapterTextOverride : chapterText;
      const sourceIndex = [
        row.source !== void 0 && row.source !== "" && row.source !== null ? `\u6E90\uFF1A${row.source}` : null,
        row.points.length > 0 ? `\u8986\u76D6\u77E5\u8BC6\u70B9 ${row.points.length} \u4E2A` : null,
        row.volumeReason !== "" ? `\u4F53\u91CF\u4F9D\u636E\uFF1A${row.volumeReason}` : null
      ].filter(Boolean).join(" \xB7 ");
      return (0, import_react4.createElement)(
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
        (0, import_react4.createElement)(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap"
            }
          },
          (0, import_react4.createElement)(
            "span",
            { style: { flex: 1, fontSize: "13px", fontWeight: 600 } },
            `\u7B2C ${row.n} \u7AE0\u300A${row.title}\u300B`
          ),
          !prepared ? (0, import_react4.createElement)(
            "span",
            { style: { fontSize: "12px", color: badge.tone } },
            `${badge.icon} \u51C6\u5907\u4E2D`
          ) : (0, import_react4.createElement)(
            "span",
            { style: { fontSize: "12px", color: badge.tone } },
            `${badge.icon} ${badge.text}`
          )
        ),
        sourceIndex !== "" ? (0, import_react4.createElement)(
          "div",
          { style: { margin: "2px 0 0", fontSize: "11px", opacity: 0.6 } },
          sourceIndex
        ) : null,
        (0, import_react4.createElement)(
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
            (0, import_react4.createElement)(
              "button",
              {
                style: S.smallLink,
                onClick: () => {
                  setOpenChapter(chapterOpen ? null : row.n);
                  setChapterText(null);
                  setChapterError(null);
                },
                disabled: fileMissing,
                title: fileMissing ? "\u8FD9\u4E00\u7AE0\u8FD8\u6CA1\u5199\u51FA\u6765\uFF08\u6216\u6587\u4EF6\u6539\u540D\u4E86\uFF09\uFF0C\u6682\u65F6\u770B\u4E0D\u4E86" : chapterOpen ? "\u6536\u8D77\u8FD9\u4E00\u7AE0\u6B63\u6587\uFF08\u6B63\u6587\u5C31\u5728\u8FD9\u5F20\u5361\u91CC\uFF09" : "\u5C31\u5730\u5C55\u5F00\u8FD9\u4E00\u7AE0\u6B63\u6587\uFF08\u5728\u8FD9\u5F20\u5361\u91CC\u770B\uFF0C\u4E0D\u5F00\u53F3\u680F\uFF09"
              },
              chapterOpen ? "\u25BE \u6536\u8D77" : `\u25B8 \u5C55\u5F00\u7B2C ${row.n} \u7AE0\u6B63\u6587`
            )
          ) : (
            // 非过目态：共用那颗「打开」——可见文案「<产物名> 打开」自证目的地（产物名走
            // 「产物名」词表＝「第 N 章」，与事件行行内那颗同形），点它只开右栏。
            (0, import_react4.createElement)(OpenArtifactButton, {
              item: { path: chapterRel2(row.n) },
              onOpen: () => onView(row.n),
              label: `${artifactName(chapterRel2(row.n))} \u6253\u5F00`,
              disabled: fileMissing,
              title: fileMissing ? "\u8FD9\u4E00\u7AE0\u8FD8\u6CA1\u5199\u51FA\u6765\uFF08\u6216\u6587\u4EF6\u6539\u540D\u4E86\uFF09\uFF0C\u6682\u65F6\u770B\u4E0D\u4E86" : void 0,
              // 这一排按钮照旧左对齐（本件默认 `marginLeft:auto` 是给产物行靠右用的）。
              style: { marginLeft: 0 }
            })
          ),
          prepared ? (0, import_react4.createElement)(
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
        // 票 10：该章的意见就在「写意见」这一区下面逐条列出来。未处置的（正拦着这章交工）
        // 照旧显示；已处置的显示「已处置 · <how>」+ 同行「翻案」；已作废的显示「已作废」。
        rowReviews.length > 0 ? (0, import_react4.createElement)(
          "div",
          {
            style: {
              marginTop: "6px",
              paddingTop: "4px",
              borderTop: "1px dashed var(--dsw-border, #d0d7de)"
            }
          },
          (0, import_react4.createElement)(
            "p",
            {
              style: {
                margin: "0 0 2px",
                fontSize: "11px",
                opacity: 0.6
              }
            },
            "\u4F60\u5728\u8FD9\u4E00\u7AE0\u63D0\u7684\u610F\u89C1\uFF1A"
          ),
          ...rowReviews.map(
            (review, index) => (0, import_react4.createElement)(ChapterReviewLine, {
              key: typeof review.id === "string" && review.id !== "" ? review.id : `review-${row.n}-${index}`,
              review,
              busy,
              onRevoke: () => {
                if (postAction === void 0) return;
                void postAction({
                  action: "review-revoke",
                  reviewId: review.id
                });
              }
            })
          )
        ) : null,
        open ? (0, import_react4.createElement)(
          "div",
          { style: { marginTop: "6px" } },
          (0, import_react4.createElement)("textarea", {
            style: S.textarea,
            placeholder: "\u4F60\u5BF9\u8FD9\u7AE0\u7684\u610F\u89C1\uFF08\u6BD4\u5982\uFF1A\u4F8B\u5B50\u592A\u96BE\u3001\u591A\u7ED9\u51E0\u9053\u7EC3\u4E60\u3001\u98CE\u683C\u6362\u6210\u66F4\u53E3\u8BED\uFF09",
            value: comment,
            onChange: (e) => setComment(e.target.value)
          }),
          (0, import_react4.createElement)(
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
        chapterOpen ? (0, import_react4.createElement)(
          "div",
          {
            style: {
              marginTop: "8px",
              borderTop: "1px dashed var(--dsw-border, #d0d7de)",
              paddingTop: "8px"
            }
          },
          chapterError !== null ? (0, import_react4.createElement)(
            "p",
            { style: S.error },
            `\u6253\u5F00\u5931\u8D25\uFF1A${chapterError}`
          ) : shownText === null ? (0, import_react4.createElement)("p", { style: S.hint }, "\u52A0\u8F7D\u4E2D\u2026") : (0, import_react4.createElement)(
            "div",
            null,
            (0, import_react4.createElement)(
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
            (0, import_react4.createElement)(GoldReader, {
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
    (0, import_react4.createElement)(
      "p",
      { style: { margin: "8px 0 0", fontSize: "12px", opacity: 0.7 } },
      // 票 14（承诺账 B，来源票 15-Q2 的裁决）：全仓 `writeSnapshot(` 只有四个写点
      // （阶段交办 / 每关首次与修订提案 / 回退前），**没有「每章」写点**；reason 也不是拍板点
      // （阶段交办类写的是「交办「写完整本」之前」）。所以这里改说「关键节点自动存档」＋
      // 「最近一次存档」——机制侧「seq 不再覆盖旧版本」由票 19 落地。
      "\u{1F4CC} \u5173\u952E\u8282\u70B9\u4F1A\u81EA\u52A8\u5B58\u6863\uFF0C\u968F\u65F6\u80FD\u56DE\u5230\u6700\u8FD1\u4E00\u6B21\u5B58\u6863\uFF1B\u60F3\u6539\u66F4\u65E9\u7684\u51B3\u5B9A\uFF0C\u5C55\u5F00\u4E0A\u9762\u7684\u6B65\u6E05\u5355\u70B9\u90A3\u4E00\u6B65\uFF0C\u7528\u300C\u5B9A\u70B9\u4FEE\u6539\u300D\u3002"
    )
  );
}
var STEP_ICON = Object.freeze({ done: "\xB7", "waiting-user": "\u26A1", active: "\u25B6", pending: "\u25CB" });
function stepIcon(state) {
  return STEP_ICON[state] ?? STEP_ICON.pending;
}
function stepRowText(row) {
  if (row === null || row === void 0 || typeof row !== "object")
    throw new Error("stepRowText \u8981\u4E00\u884C\uFF08\u4E00\u6B65\uFF0F\u9636\u6BB5\u9875\u7684\u4E00\u884C\uFF09\uFF0C\u4E0D\u7ED9\u7A7A\u503C");
  const word = typeof row.statusWord === "string" && row.statusWord !== "" ? row.statusWord : stepWord(row.status);
  return `${stepIcon(row.status)} ${row.title ?? ""}\uFF08${word}\uFF09`;
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
    background: isViewed ? "var(--dsw-accent-soft, #eef2ff)" : state === "active" ? "var(--dsw-surface, #fff)" : state === "waiting-user" ? "#fff8e6" : "transparent",
    opacity: state === "pending" ? 0.45 : state === "done" ? 0.75 : 1,
    border: isViewed ? "1px solid var(--dsw-text, #1f2328)" : state === "waiting-user" ? "1px solid #e3b341" : "1px solid transparent"
  };
}
function GroupHead(props) {
  return (0, import_react4.createElement)(
    "p",
    {
      style: {
        margin: "2px 0 3px",
        fontSize: "11px",
        fontWeight: 700,
        opacity: 0.55,
        letterSpacing: "0.02em"
      }
    },
    Number.isInteger(props.phase) ? `\u7B2C ${props.phase} \u9636\u6BB5 \xB7 ${PHASE_UI[props.phase] ?? ""}` : (
      // 阶段号认不出的分段（旧 payload 连 kind 都没有）：`stepsOf` 把它们挂在末尾、
      // `phase` 为 null——**不静默丢**，给一个说得出口的组名（票 04）。
      "\u9636\u6BB5\u5F85\u5B9A"
    )
  );
}
function StepList(props) {
  const { steps, browsingKey, onPickStep, onPickPhase } = props;
  const rows = Array.isArray(steps) ? steps : [];
  const groups = [];
  for (const step of rows) {
    const phase = step?.phase ?? null;
    const last = groups[groups.length - 1];
    if (last !== void 0 && last.phase === phase) last.rows.push(step);
    else groups.push({ phase, rows: [step] });
  }
  return (0, import_react4.createElement)(
    "div",
    null,
    ...groups.map(
      (group) => (0, import_react4.createElement)(
        "div",
        { key: `g-${group.phase ?? "other"}`, style: { marginBottom: "6px" } },
        (0, import_react4.createElement)(GroupHead, { phase: group.phase }),
        ...group.rows.map(
          (step) => (0, import_react4.createElement)(
            "button",
            {
              key: step.key,
              // 全览条只在"现在"那一屏渲染，点任何一行立刻换屏，所以这一圈高亮其实看不到；
              // 仍按「正在看的那一步」算（`browsing` 就是步 key，票 04）。
              style: stepStyle(browsingKey !== null && browsingKey === step.key, step.status),
              // 有段的行交**步 key**（阶段页自己认得出焦点落在哪一步；`viewPhaseOfBrowsing`
              // 也从步反查阶段）；没有段的行（材料准备＝第一步、旧 payload 补出来的章步）走
              // `onPickPhase`——落到那一阶段的清单页，**不是**浏览态（票 04 明写）。
              onClick: () => step.segmentKey === null ? onPickPhase?.(step.phase) : onPickStep?.(step.key),
              title: stepWord(step.status)
            },
            stepRowText(step)
          )
        )
      )
    )
  );
}
function ProgressOverview(props) {
  const [open, setOpen] = (0, import_react4.useState)(false);
  const { segments, meta, browsingKey, currentPhase } = props;
  const steps = stepsOf({ segments, meta });
  const count = stepCount({ segments, meta });
  const headline = count.chaptersPlanned ? `\u5168\u4E66 ${count.total} \u6B65 \xB7 ${count.remaining === 0 ? "\u5DF2\u5168\u90E8\u5B8C\u6210" : `\u8FD8\u5269 ${count.remaining} \u6B65`}` : `\u5DF2\u77E5 ${count.known} \u6B65 \xB7 \u7AE0\u8282\u6392\u5B9A\u540E\u8865\u9F50`;
  return (0, import_react4.createElement)(
    "div",
    { style: { marginBottom: "10px" } },
    (0, import_react4.createElement)(
      "div",
      {
        style: {
          border: "1px solid var(--dsw-border, #d0d7de)",
          borderRadius: "10px",
          padding: "8px 10px",
          background: "var(--dsw-bg, #fff)"
        }
      },
      (0, import_react4.createElement)(
        "div",
        { style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } },
        (0, import_react4.createElement)("strong", { style: { fontSize: "13px" } }, `\u{1F5FA} ${headline}`),
        (0, import_react4.createElement)(
          "span",
          { style: { fontSize: "12px", opacity: 0.65 } },
          `\u73B0\u5728\u5728\u7B2C ${currentPhase ?? 1} \u9636\u6BB5 \xB7 ${PHASE_UI[currentPhase ?? 1] ?? ""}`
        ),
        (0, import_react4.createElement)(
          "button",
          {
            style: { ...S.smallLink, marginLeft: "auto" },
            onClick: () => setOpen((v) => !v)
          },
          open ? "\u6536\u8D77\u6E05\u5355" : "\u5C55\u5F00\u6E05\u5355"
        )
      )
    ),
    open ? (0, import_react4.createElement)(
      "div",
      {
        style: {
          marginTop: "6px",
          border: "1px solid var(--dsw-border, #d0d7de)",
          borderRadius: "10px",
          padding: "10px 12px",
          background: "var(--dsw-bg, #fff)",
          boxShadow: "0 10px 28px rgba(0,0,0,.16)",
          maxHeight: "46vh",
          overflowY: "auto",
          // 两栏：18 行一栏太长，两栏一屏装得下，也不至于铺满整页。
          columns: "2",
          columnGap: "18px"
        }
      },
      (0, import_react4.createElement)(StepList, {
        steps,
        browsingKey,
        onPickStep: props.onPickStep,
        onPickPhase: props.onPickPhase
      })
    ) : null
  );
}
function FocusFooter(props) {
  const { status, onDelete, deleting, busy, bookDir, onCancelDelete } = props;
  return (0, import_react4.createElement)(
    "div",
    {
      style: {
        marginTop: "10px",
        paddingTop: "8px",
        borderTop: "1px solid var(--dsw-border, #d0d7de)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
        fontSize: "11px"
      }
    },
    (0, import_react4.createElement)(
      "span",
      { style: { opacity: 0.55 } },
      `\u4E66\u7684\u8FDB\u5EA6\uFF1A${status ?? "\u2014"}`
    ),
    bookDir !== null && bookDir !== void 0 ? (0, import_react4.createElement)(
      "span",
      { style: { opacity: 0.55, wordBreak: "break-all" } },
      `\u{1F4C1} ${bookDir}`
    ) : null,
    (0, import_react4.createElement)("span", { style: { flex: 1 } }),
    typeof onDelete === "function" ? (0, import_react4.createElement)(
      "button",
      {
        style: {
          ...S.smallLink,
          fontSize: "11px",
          opacity: deleting === true ? 1 : 0.5,
          ...deleting === true ? { color: "var(--dsw-danger, #cf222e)" } : {}
        },
        onClick: onDelete,
        disabled: busy === true,
        title: "\u628A\u8FD9\u672C\u4E66\u79FB\u8FDB\u56DE\u6536\u7AD9"
      },
      deleting === true ? "\u786E\u8BA4\u53D6\u6D88\u8FD9\u672C\u4E66\uFF08\u8FDB\u56DE\u6536\u7AD9\uFF09" : "\u53D6\u6D88\u8FD9\u672C\u4E66"
    ) : null,
    // 票 12：确认态的退路（见组件顶部说明）。只在确认态出现、且父级给了回调才渲染；
    // 它只改本地确认态、**不发任何动作**（破坏性动作仍然只有确认那颗发）。
    deleting === true && typeof onCancelDelete === "function" ? (0, import_react4.createElement)(
      "button",
      {
        style: {
          ...S.smallLink,
          fontSize: "11px",
          opacity: 0.6
        },
        onClick: onCancelDelete,
        disabled: busy === true,
        title: "\u5148\u4E0D\u5220\uFF0C\u56DE\u5230\u4E0A\u4E00\u6B65"
      },
      "\u7B97\u4E86"
    ) : null
  );
}
function SocratopiaAd() {
  const [copied, setCopied] = (0, import_react4.useState)(false);
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
  return (0, import_react4.createElement)(
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
        fontSize: "11px",
        lineHeight: 1.5,
        textDecoration: "none",
        borderTop: "1px solid rgba(255, 255, 255, 0.25)"
      }
    },
    (0, import_react4.createElement)("span", { style: { fontSize: "15px" } }, "\u{1F4DA}"),
    (0, import_react4.createElement)("strong", { style: { fontSize: "12px" } }, "\u3010\u7834\u5377\u3011"),
    (0, import_react4.createElement)(
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
    ),
    (0, import_react4.createElement)("span", null, "\u628A\u9020\u597D\u7684\u4E66\u4EA4\u7ED9\u3010\u7834\u5377\u3011\uFF0C\u5F53\u6559\u6750\u6765\u5B66"),
    (0, import_react4.createElement)(
      "span",
      { style: { opacity: 0.85 } },
      "3A \u6C89\u6D78\u611F \xB7 3 \u500D\u5B66\u4E60\u6548\u7387"
    ),
    (0, import_react4.createElement)(
      "span",
      { style: { marginLeft: "auto", fontSize: "10px" } },
      "\u586B\u9080\u8BF7\u7801 ",
      (0, import_react4.createElement)(
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

// src/ui/phase-page.js
var PHASE_LAYOUT = Object.freeze({
  1: "materials",
  2: "stack",
  3: "stack",
  4: "stack",
  5: "split",
  6: "stack"
});
var P = {
  head: { display: "flex", alignItems: "baseline", gap: "10px", margin: "0 0 2px" },
  headTitle: { fontSize: "17px", fontWeight: 700 },
  headMeta: { fontSize: "12px", opacity: 0.7 },
  intro: { fontSize: "12px", opacity: 0.7, margin: "4px 0 12px" },
  sectionLabel: { fontSize: "12px", fontWeight: 600, opacity: 0.75, margin: "0 0 6px" },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 10px",
    borderRadius: "8px",
    border: "1px solid var(--dsw-border, #d0d7de)",
    marginBottom: "6px",
    background: "var(--dsw-bg, #fff)",
    fontSize: "13px"
  },
  kindTag: {
    fontSize: "11px",
    padding: "1px 6px",
    borderRadius: "999px",
    background: "var(--dsw-border-soft, #eff1f4)",
    opacity: 0.85,
    whiteSpace: "nowrap"
  },
  empty: { fontSize: "12px", opacity: 0.65, margin: "6px 0" },
  pre: {
    whiteSpace: "pre-wrap",
    margin: "8px 0 0",
    padding: "8px 10px",
    borderRadius: "8px",
    background: "var(--dsw-border-soft, #eff1f4)",
    fontSize: "12px",
    maxHeight: "260px",
    overflow: "auto",
    fontFamily: "inherit"
  }
};
function ArtifactList(props) {
  const { artifacts, onOpen, emptyText } = props;
  if (artifacts.length === 0)
    return (0, import_react5.createElement)("p", { style: P.empty }, emptyText ?? "\u8FD9\u4E00\u6B65\u6CA1\u6709\u7559\u6587\u4EF6\u3002");
  return (0, import_react5.createElement)(
    "div",
    { style: { marginTop: "8px" } },
    (0, import_react5.createElement)("p", { style: P.sectionLabel }, "\u8FD9\u4E00\u6B65\u7684\u6587\u4EF6\uFF1A"),
    // 2026-09-21 用户要求：文件是开在**右边**的，卡片上得先说一句，否则点完不知道内容去哪了。
    (0, import_react5.createElement)(
      "p",
      { style: { ...P.empty, margin: "0 0 6px" } },
      "\u70B9\u300C\u6253\u5F00\u300D\uFF0C\u5185\u5BB9\u4F1A\u5728\u53F3\u4FA7\u6253\u5F00\u7ED9\u4F60\u770B\uFF08\u53EA\u8BFB\uFF0C\u4E0D\u5F71\u54CD\u9020\u4E66\uFF09\u3002"
    ),
    ...artifacts.map(
      (item) => (0, import_react5.createElement)(
        "div",
        { key: `${item.stepKey ?? ""}::${item.path}`, style: P.row },
        (0, import_react5.createElement)("span", { style: P.kindTag }, item.kind),
        (0, import_react5.createElement)("strong", { style: { fontSize: "13px" } }, item.label),
        (0, import_react5.createElement)(OpenArtifactButton, { item, onOpen })
      )
    )
  );
}
function DeepModifyLink(props) {
  const { row, onDeepModify, busy, openKey, onOpenKey } = props;
  const [note, setNote] = (0, import_react5.useState)("");
  if (row.canDeepModify !== true) return null;
  const open = openKey === row.key;
  const close = () => {
    onOpenKey(null);
    setNote("");
  };
  if (!open) {
    return (0, import_react5.createElement)(
      "button",
      {
        style: { ...S.smallLink, marginTop: "8px" },
        onClick: () => onOpenKey(row.key),
        disabled: busy === true,
        title: "\u5C31\u5730\u6539\u51B3\u5B9A\u5E76\u91CD\u505A\u4E0B\u6E38\uFF08\u4E0D\u79BB\u5F00\u8FD9\u4E00\u6B65\uFF09"
      },
      "\u270D\uFE0F \u5B9A\u70B9\u4FEE\u6539\u8FD9\u4E00\u6B65"
    );
  }
  const downstream = row.downstream ?? [];
  return (0, import_react5.createElement)(
    "div",
    { style: { marginTop: "8px", borderTop: "1px dashed var(--dsw-border, #d0d7de)", paddingTop: "8px" } },
    (0, import_react5.createElement)("p", { style: { margin: "0 0 6px", fontWeight: 600 } }, `\u270D\uFE0F \u5B9A\u70B9\u4FEE\u6539\u300C${row.title}\u300D`),
    (0, import_react5.createElement)(
      "p",
      { style: { margin: "0 0 6px", fontSize: "12px", color: "var(--dsw-danger, #cf222e)" } },
      downstream.length === 0 ? "\u5F71\u54CD\u9884\u544A\uFF1A\u8FD9\u4E00\u6B65\u4E4B\u540E\u6CA1\u6709\u4E0B\u6E38\u8981\u91CD\u505A\u3002" : `\u5F71\u54CD\u9884\u544A\uFF1A\u8FD9\u4E00\u6B65\u6539\u4E86\uFF0C\u8FD9\u4E9B\u8981\u4E00\u8D77\u91CD\u505A\uFF1A${downstream.join("\u3001")}\u3002`
    ),
    (0, import_react5.createElement)(
      "p",
      { style: { margin: "0 0 6px", fontSize: "12px", opacity: 0.75 } },
      "\u4F60\u7684\u98CE\u683C\u7EBF\u548C\u8C41\u514D\u539F\u6837\u4FDD\u7559\uFF1B\u8BE5\u62CD\u677F\u7684\u6B65\u4ECD\u4F1A\u6765\u8BF7\u4F60\u62CD\u677F\uFF1B\u65E7\u7248\u672C\u4F1A\u5F52\u6863\u7559\u5E95\uFF1B\u6700\u8FD1\u4E00\u6B21\u4FEE\u6539\uFF0C10 \u5206\u949F\u5185\u53EF\u4EE5\u4E00\u952E\u64A4\u9500\u3002"
    ),
    // 同屏一次只能改一处：说清为什么，别让用户以为是界面坏了。
    // ⚠️ 票 14（承诺账 A1/A2，来源票 09 的裁决）：原来那句「一次只能改一步——先提交这一处，
    // 再改下一处」**做不到**——提交后守卫立刻挡住第二笔（深改结尾把 meta.status='running'、
    // pendingStage 指回被改段），得等整轮重做跑完、或先 ⏸ 暂停。这里改成能兑现的说法并指路。
    (0, import_react5.createElement)(
      "p",
      { style: { margin: "0 0 6px", fontSize: "12px", opacity: 0.6 } },
      "\u4E00\u6B21\u53EA\u6539\u4E00\u5904\uFF1A\u63D0\u4EA4\u540E AI \u4F1A\u5148\u91CD\u505A\u8FD9\u4E00\u6B65\uFF1B\u60F3\u63A5\u7740\u6539\u4E0B\u4E00\u5904\uFF0C\u7B49\u5B83\u505A\u5B8C\uFF0C\u6216\u5148 \u23F8 \u6682\u505C\u3002"
    ),
    // 票 14（来源票 09）：撤销单位＝**最近一次提交**（`lastDeepModify` 只记一条）——在撤销窗内
    // 再改一处，上一笔的撤销入口就失效了。提交第二笔前先把代价说清（不许等用户撞上才发现）。
    (0, import_react5.createElement)(
      "p",
      { style: { margin: "0 0 6px", fontSize: "12px", opacity: 0.6 } },
      "\u64A4\u9500\u53EA\u8986\u76D6\u6700\u8FD1\u4E00\u6B21\u63D0\u4EA4\u2014\u2014\u63D0\u4EA4\u8FD9\u4E00\u5904\u540E\uFF0C\u4E0A\u4E00\u6B21\u7684\u64A4\u9500\u5165\u53E3\u4F1A\u5931\u6548\u3002"
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
          disabled: busy === true || note.trim() === "",
          onClick: () => {
            onDeepModify?.(row.segmentKey ?? row.key, note.trim());
            onOpenKey(null);
            setNote("");
          }
        },
        "\u270D\uFE0F \u5C31\u8FD9\u4E48\u6539\uFF0C\u91CD\u505A\u4E0B\u6E38"
      ),
      (0, import_react5.createElement)("button", { style: S.smallLink, onClick: close }, "\u53D6\u6D88")
    )
  );
}
function StackBody(props) {
  const { steps, onOpen, onDeepModify, busy } = props;
  const [openKey, setOpenKey] = (0, import_react5.useState)(null);
  return (0, import_react5.createElement)(
    "div",
    null,
    ...steps.map(
      (row) => (0, import_react5.createElement)(
        "div",
        {
          key: row.key,
          style: {
            ...S.card,
            // 从步清单点进来的那一步：描一圈，指明"你点的是这一个"。
            ...row.key === props.focusedStepKey ? { outline: "2px solid var(--dsw-text, #1f2328)", outlineOffset: "-2px" } : {}
          }
        },
        (0, import_react5.createElement)(
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
          // `stepRowText`，本页不再自己拼一份。
          (0, import_react5.createElement)("strong", { style: { fontSize: "14px" } }, stepRowText(row))
        ),
        row.decision !== null ? (0, import_react5.createElement)("p", { style: { margin: "6px 0 0", fontSize: "12px" } }, `\u62CD\u677F\uFF1A${row.decision}`) : null,
        (0, import_react5.createElement)(ArtifactList, {
          artifacts: row.artifacts.map((item) => ({ ...item, stepKey: row.key })),
          onOpen,
          emptyText: row.status === "pending" ? "\u8FD8\u6CA1\u5230\u8FD9\u4E00\u6B65\u3002" : void 0
        }),
        (0, import_react5.createElement)(DeepModifyLink, {
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
function SplitBody(props) {
  const { steps, onOpen, onDeepModify, busy } = props;
  const [openKey, setOpenKey] = (0, import_react5.useState)(null);
  const focusedIndex = steps.findIndex((row2) => row2.key === props.focusedStepKey);
  const [picked, setPicked] = (0, import_react5.useState)(focusedIndex >= 0 ? focusedIndex : 0);
  const row = steps[Math.min(picked, steps.length - 1)] ?? null;
  if (row === null) return null;
  return (0, import_react5.createElement)(
    "div",
    { style: { display: "flex", gap: "10px", alignItems: "flex-start" } },
    (0, import_react5.createElement)(
      "div",
      {
        style: {
          width: "190px",
          flexShrink: 0,
          border: "1px solid var(--dsw-border, #d0d7de)",
          borderRadius: "10px",
          padding: "6px",
          maxHeight: "360px",
          overflowY: "auto"
        }
      },
      ...steps.map(
        (item, index) => (0, import_react5.createElement)(
          "button",
          {
            key: item.key,
            style: {
              display: "block",
              width: "100%",
              textAlign: "left",
              border: "1px solid transparent",
              borderRadius: "7px",
              padding: "6px 8px",
              margin: "0 0 2px",
              fontSize: "12px",
              cursor: "pointer",
              color: "inherit",
              background: index === picked ? "var(--dsw-accent-soft, #eef2ff)" : "transparent",
              opacity: item.status === "pending" ? 0.55 : 1
            },
            onClick: () => setPicked(index)
          },
          // 四态行（票 04 抽出、票 05 接线）：左栏一行一步，与全览条清单同一份 `stepRowText`。
          stepRowText(item)
        )
      )
    ),
    (0, import_react5.createElement)(
      "div",
      { style: { ...S.card, flex: 1, marginBottom: 0 } },
      (0, import_react5.createElement)(
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
        (0, import_react5.createElement)("strong", { style: { fontSize: "14px" } }, stepRowText(row))
      ),
      row.decision !== null ? (0, import_react5.createElement)("p", { style: { margin: "6px 0 0", fontSize: "12px" } }, `\u62CD\u677F\uFF1A${row.decision}`) : null,
      (0, import_react5.createElement)(ArtifactList, {
        artifacts: row.artifacts.map((item) => ({ ...item, stepKey: row.key })),
        onOpen,
        emptyText: row.status === "pending" ? "\u8FD8\u6CA1\u5230\u8FD9\u4E00\u6B65\u3002" : void 0
      }),
      (0, import_react5.createElement)(DeepModifyLink, {
        row,
        onDeepModify,
        busy,
        openKey,
        onOpenKey: setOpenKey
      })
    )
  );
}
function MaterialsBody(props) {
  const sources = props.sources ?? [];
  const step = props.step;
  return (0, import_react5.createElement)(
    "div",
    { style: S.card },
    (0, import_react5.createElement)(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "10px"
        }
      },
      // 四态行（票 04 抽出、票 05 接线）：材料准备那一步的名字与四态词走全览条清单同一份
      // `stepRowText`。
      // ⚠️ 兜底那一支**不许手写**「材料准备」（2026-09-23 代码审查）：界面上的字只此一份
      // （CONTEXT.md「界面用词表」），组件里手写阶段短标签正是它点名要避免的。而且这一支
      // 事实上到不了——`stepsOf` 无条件 push 材料准备那一步（`view-rules.js:755`），
      // 它的 `title` 就是 `PHASE_UI[1]`。留兜底只为不崩，词一律从表里取。
      (0, import_react5.createElement)(
        "strong",
        { style: { fontSize: "14px" } },
        step === null || step === void 0 ? PHASE_UI[1] ?? "" : stepRowText(step)
      )
    ),
    sources.length === 0 ? (0, import_react5.createElement)("p", { style: { margin: "6px 0 0", fontSize: "13px" } }, "\u8FD8\u6CA1\u6709\u4E0A\u4F20\u6750\u6599\u3002") : (0, import_react5.createElement)(
      "div",
      { style: { marginTop: "6px" } },
      ...sources.map(
        (source) => (0, import_react5.createElement)(
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
          (0, import_react5.createElement)(
            "span",
            { style: { flex: 1, fontSize: "13px", wordBreak: "break-all" } },
            `${source.converted === true ? "\u2705" : "\u23F3"} ${source.file}\uFF08${source.role ?? ""}\uFF09`
          ),
          source.converted === true && typeof source.md === "string" && source.md !== "" ? (0, import_react5.createElement)(OpenArtifactButton, {
            item: { path: `sources-md/${source.md}` },
            onOpen: props.onOpen
            // 票 10（判定一 #14）：行的形状是 **[名字] + [打开]**（CONTEXT.md「产物名」）
            // ——左边那格已经是这份材料的名字（`source.file`），所以按钮只说动词「打开」，
            // 不再自造「查看转换内容」这种说法；这一份叫什么由按钮 tooltip 给出
            // （`artifactName` →「x 的转换稿」）。
          }) : (0, import_react5.createElement)(
            "span",
            { style: { fontSize: "12px", opacity: 0.6 } },
            "\u8F6C\u6362\u4E2D"
          )
        )
      )
    )
  );
}
function KnowledgeMapBlock(props) {
  const [open, setOpen] = (0, import_react5.useState)(false);
  const text = typeof props.text === "string" && props.text !== "" ? props.text : null;
  if (text === null)
    return (0, import_react5.createElement)(
      "div",
      { style: S.card },
      (0, import_react5.createElement)("p", { style: { margin: 0, fontSize: "12px", opacity: 0.7 } }, "\u8FD8\u6CA1\u6709\u6311\u91CD\u70B9\u7684\u7ED3\u679C\u3002")
    );
  const folded = foldKnowledgeMap(text);
  const body = folded ?? text;
  return (0, import_react5.createElement)(
    "div",
    { style: S.card },
    (0, import_react5.createElement)(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" } },
      (0, import_react5.createElement)("strong", { style: { fontSize: "13px" } }, "AI \u6311\u51FA\u6765\u7684\u91CD\u70B9"),
      (0, import_react5.createElement)(
        "button",
        { style: S.smallLink, onClick: () => setOpen((v) => !v) },
        open ? "\u6536\u8D77" : "\u5C55\u5F00\u770B\u6E05\u5355"
      )
    ),
    open ? (0, import_react5.createElement)("pre", { style: P.pre }, body) : null
  );
}
function GoldBlock(props) {
  const drafts = props.goldDrafts ?? [];
  const sealed = props.goldSealed ?? null;
  return (0, import_react5.createElement)(
    "div",
    { style: S.card },
    (0, import_react5.createElement)(
      "div",
      { style: { display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" } },
      (0, import_react5.createElement)("strong", { style: { fontSize: "13px" } }, "\u8FD9\u4E00\u7AE0\u7684\u7A3F\u5B50"),
      (0, import_react5.createElement)(
        "span",
        { style: { fontSize: "12px", opacity: 0.75 } },
        sealed !== null ? `\u2705 \u5DF2\u5B9A\u7A3F\uFF08\u7B2C ${sealed.version ?? "?"} \u7A3F\uFF09` : `\u73B0\u5728\u662F\u7B2C ${props.goldDraftVersion ?? 1} \u7A3F\uFF0C\u7B49\u4F60\u8FC7\u76EE`
      )
    ),
    drafts.length === 0 ? null : (0, import_react5.createElement)(
      "div",
      { style: { marginTop: "8px" } },
      (0, import_react5.createElement)("p", { style: P.sectionLabel }, "\u65E7\u7A3F\uFF1A"),
      ...drafts.map(
        (draft) => (0, import_react5.createElement)(
          "div",
          { key: draft.path, style: P.row },
          (0, import_react5.createElement)("span", { style: P.kindTag }, "\u65E7\u7A3F"),
          (0, import_react5.createElement)("strong", { style: { fontSize: "13px" } }, `\u7B2C ${draft.version} \u7A3F`),
          (0, import_react5.createElement)(OpenArtifactButton, { item: draft, onOpen: props.onOpen })
        )
      )
    )
  );
}
function FinalChecksBlock(props) {
  const checks = props.checks ?? [];
  const report = typeof props.aiReport === "string" && props.aiReport !== "" ? props.aiReport : null;
  return (0, import_react5.createElement)(
    "div",
    { style: S.card },
    (0, import_react5.createElement)("strong", { style: { fontSize: "13px" } }, "\u673A\u5668\u9010\u9879\u68C0\u67E5"),
    checks.length === 0 ? (0, import_react5.createElement)("p", { style: P.empty }, "\u8FD8\u6CA1\u6709\u68C0\u67E5\u7ED3\u679C\u3002") : (0, import_react5.createElement)(
      "div",
      { style: { marginTop: "6px" } },
      ...checks.map(
        (check) => (0, import_react5.createElement)(
          "div",
          { key: check.name, style: { fontSize: "12px", padding: "2px 0" } },
          // 票 20：加 ❌——真门槛（如重复标题）失败时不能再显示成 ⚠️ 那种"提示"，
          // 与「拦交付」自相矛盾；⚠️ 仍留给第三态（`ok:true + warn:true`，只提示不拦）。
          `${check.ok !== true ? "\u274C" : check.warn === true ? "\u26A0\uFE0F" : "\u2705"} ${checkHuman(check.name)}${check.note ? `\uFF08${check.note}\uFF09` : ""}`
        )
      )
    ),
    report !== null ? (0, import_react5.createElement)(
      "div",
      { style: { marginTop: "10px" } },
      // 票 10（判定三 #10）：界面一律说「检查」——「自查」是机器视角（谁查谁？）。
      (0, import_react5.createElement)("p", { style: { ...P.sectionLabel, margin: "0 0 4px" } }, "AI \u68C0\u67E5\u62A5\u544A"),
      (0, import_react5.createElement)("p", { style: { margin: 0, fontSize: "12px", opacity: 0.85 } }, report)
    ) : null
  );
}
function UndoButton(props) {
  return (0, import_react5.createElement)(
    "div",
    { style: { marginTop: "10px" } },
    (0, import_react5.createElement)(
      "button",
      {
        style: { ...S.smallLink, textDecoration: "none" },
        disabled: props.busy === true,
        onClick: () => props.onDeepUndo?.()
      },
      "\u21A9\uFE0F \u64A4\u9500\u521A\u624D\u7684\u5B9A\u70B9\u4FEE\u6539\uFF0810 \u5206\u949F\u5185\uFF09"
    )
  );
}
function PhasePage(props) {
  const { phase, meta, segments, workFiles, onOpen } = props;
  const [redoKey, setRedoKey] = (0, import_react5.useState)(null);
  (0, import_react5.useEffect)(() => {
    setRedoKey(null);
  }, [segments]);
  const modProps = {
    // 提交那一下先把这一段标成「我正在做」（乐观），再交给接线层发 `deep-modify`。
    onDeepModify: (segKey, note) => {
      setRedoKey(segKey);
      props.onDeepModify?.(segKey, note);
    },
    busy: props.busy
  };
  const page = phaseSummary(segments, phase, workFiles);
  const steps = phaseSteps({ segments, meta }, phase, workFiles).map(
    (row) => (
      // 乐观标记只覆写四态词/状态：行是**段**级的活（章内三步共属一段，整章一起重做，
      // 所以章段的三行会一起说「我正在做」——那正是事实）。
      redoKey !== null && row.segmentKey === redoKey ? { ...row, status: "active", statusWord: stepWord("active") } : row
    )
  );
  const currentPhase = meta?.phase ?? 1;
  const layout = PHASE_LAYOUT[phase] ?? "stack";
  const focusedStepKey = (() => {
    const focused = props.focusedSegment;
    if (focused === null || focused === void 0) return null;
    const hit = steps.find((row) => row.key === focused || row.segmentKey === focused);
    return hit?.key ?? null;
  })();
  const doneSteps = steps.filter((row) => row.status === "done").length;
  const fileCount = new Set(
    steps.flatMap((row) => row.artifacts.map((item) => item.path))
  ).size;
  const head = (0, import_react5.createElement)(
    "div",
    null,
    (0, import_react5.createElement)(
      "div",
      { style: P.head },
      (0, import_react5.createElement)("strong", { style: P.headTitle }, page.name),
      // 票 10（判定一 #11）：这一处原来手写「轮到你 / 已完成 / 还没到这一步」——
      // 与 view-rules.stepWord 是同一组状态词的第二份实现（「界面上的字只此一份」）。
      // ⚠️ 阶段 1 不再在这里报状态：那一步的四态词由它自己那张卡承担（见 MaterialsBody），
      // 同屏说两遍同一件事没必要。其余阶段按**步**计数（票 05 起行单位是步，不再数分段）。
      // 「N/M 小步已完成」里的「小步」是退役词（票 01 / spec 不变量 7 / §6 越界清单），
      // 本票改成「N/M 步已完成」；「份文件」按**路径去重**（`fileCount`），不把一章正文数三遍。
      phase === 1 ? null : (0, import_react5.createElement)(
        "span",
        { style: P.headMeta },
        steps.length > 0 ? `${doneSteps}/${steps.length} \u6B65\u5DF2\u5B8C\u6210 \xB7 ${fileCount} \u4EFD\u6587\u4EF6` : stepWord(phase < currentPhase ? "done" : "pending")
      )
    ),
    (0, import_react5.createElement)("p", { style: P.intro }, page.intro)
  );
  const body = layout === "materials" ? (0, import_react5.createElement)(MaterialsBody, {
    step: steps.find((row) => row.key === MATERIAL_STEP_KEY) ?? null,
    sources: meta?.sources ?? [],
    onOpen
  }) : layout === "split" ? (0, import_react5.createElement)(SplitBody, { steps, onOpen, focusedStepKey, ...modProps }) : (0, import_react5.createElement)(StackBody, { steps, onOpen, focusedStepKey, ...modProps });
  const extras = [];
  if (phase === 2)
    extras.push((0, import_react5.createElement)(KnowledgeMapBlock, { key: "km", text: props.knowledgeMapText }));
  if (phase === 4)
    extras.push(
      (0, import_react5.createElement)(GoldBlock, {
        key: "gold",
        goldSealed: meta?.goldSealed ?? null,
        goldDrafts: props.goldDrafts,
        goldDraftVersion: props.goldDraftVersion,
        onOpen
      })
    );
  if (phase === 6)
    extras.push(
      (0, import_react5.createElement)(FinalChecksBlock, { key: "checks", checks: props.checks, aiReport: props.aiReport })
    );
  if (steps.length === 0 && layout !== "materials") {
    return (0, import_react5.createElement)(
      "div",
      null,
      head,
      // 「小步」是退役词（spec 不变量 7 / §6 越界清单），旧的「这一步没有小步，还没到它。」
      // 一并退役；而且这一页是**阶段页**：空的是"这一阶段还没有能摆的步"。
      // ⚠️ 句子不能说"这个阶段还没到"：抬头那一格的词可能是「已完成」（看的是**过去**的阶段，
      // 只是这份 payload 里没有它那几段——老宿主），两句会当场打架。所以取一句两头都成立的。
      (0, import_react5.createElement)("div", { style: S.card }, (0, import_react5.createElement)("p", { style: { margin: 0 } }, "\u8FD9\u4E2A\u9636\u6BB5\u8FD8\u6CA1\u6709\u53EF\u770B\u7684\u6B65\u3002"))
    );
  }
  const last = meta?.lastDeepModify ?? null;
  const lastOnThisPage = last !== null && steps.some((row) => row.segmentKey === last.segment);
  const inUndoWindow = last !== null && Date.now() - last.at <= 10 * 60 * 1e3;
  const ledgerAdvanced = last !== null && (meta?.eventCount ?? 0) !== last.eventCountAfter;
  const undoable = inUndoWindow && lastOnThisPage && !ledgerAdvanced;
  const undoClosed = inUndoWindow && lastOnThisPage && ledgerAdvanced;
  return (0, import_react5.createElement)(
    "div",
    null,
    head,
    body,
    ...extras,
    undoable ? (0, import_react5.createElement)(UndoButton, { onDeepUndo: props.onDeepUndo, busy: props.busy }) : null,
    undoClosed ? (0, import_react5.createElement)(
      "p",
      { style: { marginTop: "10px", marginBottom: 0, fontSize: "12px", opacity: 0.85 } },
      "\u8FD9\u4E00\u6B65\u5DF2\u7ECF\u5F00\u59CB\u91CD\u505A\uFF0C\u64A4\u9500\u5DF2\u5173\u95ED"
    ) : null
  );
}

// src/ui/event-cards.js
var import_react6 = require("react");
function MachineChecks({ checks, onFix, fixDisabled }) {
  const list = checks ?? [];
  if (list.length === 0) return null;
  const failed = list.filter((check) => check.ok !== true).length;
  const warned = list.filter((check) => check.ok === true && check.warn === true).length;
  const rows = list.map(
    (check) => (0, import_react6.createElement)(
      "div",
      { key: check.name, style: { margin: "4px 0" } },
      (0, import_react6.createElement)(
        "span",
        null,
        check.ok !== true ? "\u274C" : check.warn === true ? "\u26A0\uFE0F" : "\u2705"
      ),
      ` ${checkHuman(check.name)}`,
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
      ),
      // 票 20：没过的项各给一个「照这条让 AI 去改」的入口（人只点一下，不必自己想改什么）。
      check.ok !== true && typeof onFix === "function" ? (0, import_react6.createElement)(
        "button",
        {
          style: { ...S.smallLink, marginLeft: "8px" },
          disabled: fixDisabled === true,
          title: "\u628A\u673A\u5668\u8D77\u8349\u7684\u8FD9\u53E5\u8BDD\u4EA4\u7ED9 AI\uFF0C\u5B83\u4F1A\u7167\u7740\u6539\u6574\u672C\u540E\u91CD\u65B0\u505A\u6700\u540E\u68C0\u67E5",
          onClick: () => onFix(check)
        },
        "\u{1F501} \u8BA9 AI \u6309\u8FD9\u6761\u53BB\u6539"
      ) : null
    )
  );
  const summary = `\u{1F527} \u673A\u5668\u4E5F\u67E5\u8FC7\u4E86 ${list.length} \u9879\uFF0C` + (failed === 0 ? "\u5168\u8FC7" : `\u6709 ${failed} \u9879\u6CA1\u8FC7`) + (warned === 0 ? "" : `\uFF0C\u53E6\u6709 ${warned} \u9879\u63D0\u793A\u4F60\u770B\u4E00\u773C\uFF08\u53EA\u662F\u63D0\u793A\uFF0C\u4E0D\u62E6\u4EA4\u4ED8\uFF09`);
  if (failed > 0 || warned > 0)
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
    { style: { margin: "10px 0" } },
    (0, import_react6.createElement)(
      "summary",
      { style: { cursor: "pointer", fontSize: "12px", opacity: 0.85 } },
      `${summary}\uFF08\u70B9\u5F00\u770B\u6BCF\u4E00\u9879\uFF09`
    ),
    (0, import_react6.createElement)("div", { style: { margin: "6px 0 0" } }, ...rows)
  );
}
function draftFixInstruction(check) {
  const name = checkHuman(check?.name ?? "");
  const note = String(check?.note ?? "").trim();
  return `\u673A\u5668\u68C0\u67E5\u6CA1\u8FC7\u300C${name}\u300D\uFF1A${note}`.slice(0, 500);
}
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
      return `AI \u63D0\u6848\uFF08${gateHuman(data.gate ?? "?")} \xB7 v${data.version ?? "?"}\uFF09\uFF1A${data.title ?? ""}`;
    case "textbook/gate-decision":
      return data.approved === true ? `${gateHuman(data.gate ?? "?")}\u901A\u8FC7\uFF08v${data.version ?? "?"}\uFF09` : `${gateHuman(data.gate ?? "?")}\u9A73\u56DE\uFF08v${data.version ?? "?"}\uFF09${data.reasons?.length > 0 ? `\uFF1A${data.reasons.join("\u3001")}` : ""}`;
    case "textbook/mineru-progress":
      return `\u8F6C\u6362 ${data.file ?? ""}\uFF1A${data.stage ?? ""}`;
    case "textbook/rollback":
      return `\u21A9\uFE0F \u5DF2\u56DE\u9000\u5230\u5FEB\u7167 ${data.snapshot ?? "?"}`;
    case "textbook/source-added":
      return `\u5DF2\u4E0A\u4F20\u6750\u6599\uFF1A${data.file ?? ""}\uFF08${data.role ?? ""}\uFF09`;
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
function PhaseBar(props) {
  const { phase, gate, status, onSelect, viewed, artifactCountOf } = props;
  const doneUpTo = phase - 1;
  const gateAwaiting = gate !== null && gate.status === "awaiting";
  const humanTurn = props.humanTurn === true || gateAwaiting && phase === 3;
  return (0, import_react6.createElement)(
    "div",
    { style: S.bar },
    PHASES.map((item) => {
      let state = "pending";
      if (item.n < phase || status === "delivered" || status === "awaiting-explore" && item.n <= 2 || status === "awaiting-outline" && item.n <= 3 || status === "awaiting-gold" && item.n <= 4 || status === "awaiting-chapters-review" && item.n <= 5)
        state = "done";
      else if (item.n === phase) state = "current";
      let label = PHASE_UI[item.n] ?? item.label;
      if (item.n === phase && humanTurn) label = `\u26A1 ${label}`;
      const count = typeof artifactCountOf === "function" ? artifactCountOf(item.n) ?? 0 : 0;
      if (count > 0 && state === "done") label = `${label} \u{1F4C4}`;
      const clickable = typeof onSelect === "function";
      const isViewed = viewed === item.n;
      const backToNow = viewed != null && item.n === phase;
      if (backToNow) label = `${label} \xB7 \u56DE\u5230\u73B0\u5728`;
      return (0, import_react6.createElement)(
        "div",
        {
          key: item.n,
          style: {
            ...S.seg(state),
            ...clickable ? { cursor: "pointer" } : {},
            outline: isViewed ? "2px solid var(--dsw-text, #1f2328)" : "none",
            outlineOffset: isViewed ? "-2px" : "0"
          },
          // hover 文案**两态同形**（都写「去「X」这一步 · 有几份文件」）：目的地信息一致，
          // 回看态下"点它其实是回到现在"由那一格脸上的可见文字承担（不靠 hover 才说得清），
          // 也免得同一条 hover 前缀随态变脸（既有断言按 `去「X」` 前缀选格，别让选择器碎掉）。
          title: clickable ? `\u53BB\u300C${PHASE_UI[item.n] ?? item.label}\u300D\u8FD9\u4E00\u6B65${count > 0 ? ` \xB7 \u8FD9\u4E00\u6B65\u6709 ${count} \u4EFD\u6587\u4EF6` : " \xB7 \u8FD8\u6CA1\u6709\u6587\u4EF6"}` : void 0,
          onClick: clickable ? () => onSelect(item.n) : void 0
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
  const [name, setName] = (0, import_react6.useState)("");
  const [goal, setGoal] = (0, import_react6.useState)("");
  const [route, setRoute] = (0, import_react6.useState)("blueprint");
  const [science, setScience] = (0, import_react6.useState)(false);
  const [agree, setAgree] = (0, import_react6.useState)(false);
  const [hint, setHint] = (0, import_react6.useState)("");
  const [error, setError] = (0, import_react6.useState)(null);
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
  return (0, import_react6.createElement)(
    "div",
    { style: S.focus },
    (0, import_react6.createElement)(
      "div",
      null,
      (0, import_react6.createElement)(
        "strong",
        { style: { fontSize: "14px" } },
        "\u{1F4DA} \u7B2C\u4E00\u6B65 \xB7 \u6750\u6599\u51C6\u5907\uFF1A\u5148\u586B\u4E0B\u9762\u51E0\u9879\uFF0810 \u79D2\uFF09\uFF0C\u7136\u540E\u5C31\u80FD\u4E0A\u4F20\u6559\u6750"
      )
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
            style: { ...S.ghostBtn(false), padding: "6px 14px", marginTop: "4px" },
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
        "\u70B9\u4E00\u4E2A AI \u5EFA\u8BAE\u81EA\u52A8\u586B\u597D\uFF08\u53EF\u518D\u6539\uFF09\xB7",
        (0, import_react6.createElement)(
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
    (0, import_react6.createElement)("label", { style: S.label }, "\u4E66\u540D"),
    (0, import_react6.createElement)("input", {
      style: S.input,
      placeholder: "\u6BD4\u5982\uFF1A\u521D\u4E2D\u6570\u5B66\xB7\u6709\u7406\u6570",
      value: name,
      onChange: (e) => setName(e.target.value)
    }),
    (0, import_react6.createElement)("label", { style: S.label }, "\u8FD9\u672C\u4E66\u5B66\u5B8C\uFF0C\u8981\u80FD\u505A\u5230\u4EC0\u4E48\uFF1F"),
    (0, import_react6.createElement)("textarea", {
      style: S.textarea,
      placeholder: "\u6BD4\u5982\uFF1A\u80FD\u72EC\u7ACB\u505A\u5BF9\u6559\u6750\u914D\u5957\u7684\u57FA\u7840\u9898\uFF0C\u5E76\u8BF4\u51FA\u6BCF\u4E2A\u6982\u5FF5\u662F\u4EC0\u4E48\u3001\u4E3A\u4EC0\u4E48\u3001\u600E\u4E48\u7528",
      value: goal,
      onChange: (e) => setGoal(e.target.value)
    }),
    (0, import_react6.createElement)("label", { style: S.label }, "\u7ED9\u8C01\u7528\uFF1F"),
    (0, import_react6.createElement)(
      "label",
      { style: S.checkItem },
      (0, import_react6.createElement)("input", {
        type: "radio",
        name: "route",
        checked: route === "blueprint",
        onChange: () => setRoute("blueprint")
      }),
      " \u7ED9 AI \u8001\u5E08\u4E0A\u8BFE\u7528\uFF08\u63A8\u8350\uFF0C\u6559\u5B66\u7CBE\u5EA6\u6700\u9AD8\uFF09"
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
      " \u7ED9\u4EBA\u76F4\u63A5\u8BFB\u7684\u6559\u6750\uFF08AI \u4E5F\u80FD\u62FF\u5B83\u6559\uFF09"
    ),
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
    (0, import_react6.createElement)(
      "label",
      { style: S.checkItem },
      (0, import_react6.createElement)("input", {
        type: "checkbox",
        checked: agree,
        onChange: (e) => setAgree(e.target.checked)
      }),
      " \u6211\u786E\u8BA4\uFF1A\u53EA\u4E0A\u4F20\u6211\u6709\u6743\u4F7F\u7528\u7684\u6750\u6599\uFF1B\u9020\u51FA\u6765\u7684\u662F\u6559\u5B66\u53C2\u8003\uFF0CAI \u53EF\u80FD\u8BB2\u9519\uFF0C\u4F7F\u7528\u524D\u6211\u4F1A\u8BF7\u8001\u5E08/\u5BB6\u957F\u590D\u6838"
    ),
    error !== null ? (0, import_react6.createElement)("p", { style: S.error }, error) : null,
    (0, import_react6.createElement)(
      "div",
      { style: { marginTop: "8px" } },
      (0, import_react6.createElement)(
        "button",
        { style: S.bigBtn(true), onClick: submit, disabled: busy },
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
          style: { ...S.smallLink, marginLeft: "6px" },
          disabled: busy,
          onClick: () => onCreateDemo()
        },
        // 票 14（承诺账 D「说不清」第 4 条）：「2 分钟走完全程」查无机制——demo 与真实共用
        // 六个确认闸门，全程要用户逐关拍板，没有任何计时/自动推进。改成能兑现的说法。
        "\u5148\u5EFA\u4E00\u672C\u6F14\u793A\u4E66\u8BD5\u8BD5\uFF08\u4E0D\u82B1\u6A21\u578B\u989D\u5EA6\uFF0C\u51E0\u6B65\u5C31\u80FD\u8D70\u5B8C\uFF09"
      )
    ),
    (0, import_react6.createElement)(
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
              color: "var(--dsw-accent, #4f6ef7)",
              textDecoration: "underline"
            }
          },
          "\u3010\u7834\u5377\u3011"
        ),
        "\u7684\u884D\u751F\u9879\u76EE\uFF0C\u{1F4A1} \u5982\u679C\u672C\u9879\u76EE\u5BF9\u4F60\u6709\u5E2E\u52A9\uFF0C\u6B22\u8FCE\u586B\u5199\u9080\u8BF7\u7801\uFF1ASCR-FEJXMQ\uFF0C\u53EF\u514D\u8D39\u9886\u53D6 100 \u4E07 tokens\uFF0C\u5168\u573A\u5B98\u65B9\u9020\u4E66\u514D\u8D39\u5B66\u4E60\uFF08\u7B2C\u4E09\u65B9\u6D3B\u52A8\uFF0C\u4EE5\u5BF9\u65B9\u89C4\u5219\u4E3A\u51C6\uFF09\u3002"
      ),
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "0" } },
        "\u628A\u9020\u597D\u7684\u4E66\u4EA4\u7ED9",
        (0, import_react6.createElement)(
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
  const [pending, setPending] = (0, import_react6.useState)([]);
  const [identifying, setIdentifying] = (0, import_react6.useState)(false);
  const [uploading, setUploading] = (0, import_react6.useState)(false);
  const [error, setError] = (0, import_react6.useState)(null);
  const dirtyRef = (0, import_react6.useRef)({});
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
      const retryHint = first.retryable === false ? "" : "\uFF1B\u53EA\u4F1A\u91CD\u8BD5\u5931\u8D25\u7684\u90A3\u51E0\u672C";
      const anyRetryable = failed.some((f) => f.retryable !== false);
      setError(
        failed.length === 1 ? `\u4E0A\u4F20\u5931\u8D25\uFF1A${first.item.name}\uFF08${first.message}${retryHint}\uFF09` : `\u6709 ${failed.length} \u672C\u4E0A\u4F20\u5931\u8D25\uFF08\u5982 ${first.message}\uFF09${anyRetryable ? "\uFF1B\u53EA\u4F1A\u91CD\u8BD5\u5931\u8D25\u7684\u90A3\u51E0\u672C" : ""}`
      );
    }
    setUploading(false);
  };
  return (0, import_react6.createElement)(
    "div",
    { style: S.focus },
    (0, import_react6.createElement)(
      "strong",
      { style: { fontSize: "14px" } },
      "\u2460 \u4E0A\u4F20\u6559\u6750 PDF\uFF08\u53EF\u4E00\u6B21\u9009\u591A\u672C\uFF09"
    ),
    (0, import_react6.createElement)(
      "p",
      { style: { margin: "4px 0 8px", fontSize: "12px", opacity: 0.7 } },
      // 票 10（判定四③）：原句 76 字压到 90 字内——删掉与上方 📁 路径行重复的「见上方 📁 路径」
      // 与「都保存在里面」这类可从"文件夹＝书名"推出来的话。
      "\u4E66\u6587\u4EF6\u5939\u5EFA\u5728\u5F53\u524D\u5DE5\u4F5C\u533A\u76EE\u5F55\u91CC\uFF08\u6587\u4EF6\u5939\u540D\uFF1D\u4E66\u540D\uFF09\uFF0C\u4E0A\u4F20\u7684 PDF \u90FD\u653E\u91CC\u9762\u3002\u6BCF\u672C\u662F\u4EC0\u4E48\u89D2\u8272\u7531 AI \u81EA\u52A8\u8BC6\u522B\u3002"
    ),
    (0, import_react6.createElement)("label", { style: S.label }, "\u9009\u62E9 PDF\uFF08\u53EF\u591A\u9009\uFF09"),
    (0, import_react6.createElement)("input", {
      type: "file",
      accept: ".pdf",
      multiple: true,
      style: S.input,
      onChange: pick
    }),
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
          `\u5F85\u4E0A\u4F20 ${pending.length} \u672C\uFF1A`
        ),
        identifying ? (0, import_react6.createElement)(
          "span",
          { style: { fontSize: "12px", opacity: 0.7 } },
          "\u2728 AI \u8BC6\u522B\u89D2\u8272\u4E2D\u2026"
        ) : (0, import_react6.createElement)(
          "span",
          { style: { fontSize: "12px", opacity: 0.7 } },
          "\u2705 \u5DF2\u81EA\u52A8\u8BC6\u522B\uFF0C\u53EF\u4E0B\u62C9\u4FEE\u6539"
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
          ),
          (0, import_react6.createElement)(
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
              (role) => (0, import_react6.createElement)("option", { key: role, value: role }, role)
            )
          )
        )
      )
    ) : null,
    error !== null ? (0, import_react6.createElement)("p", { style: S.error }, error) : null,
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
          style: { ...S.bigBtn(true), padding: "8px 14px" },
          onClick: uploadAll,
          disabled: busy || uploading || pending.length === 0
        },
        pending.length > 0 ? `\u4E0A\u4F20\u8FD9 ${pending.length} \u672C` : "\u4E0A\u4F20"
      )
    ),
    sources.length > 0 ? (0, import_react6.createElement)(
      "div",
      { style: { marginTop: "8px", fontSize: "12px", opacity: 0.85 } },
      (0, import_react6.createElement)(
        "div",
        { style: { margin: "0 0 4px" } },
        `\u5DF2\u4E0A\u4F20 ${sources.length} \u672C\uFF1A`
      ),
      sources.map(
        (source) => (0, import_react6.createElement)(
          "div",
          {
            key: source.file,
            style: { wordBreak: "break-all", margin: "2px 0" }
          },
          `${source.converted === true ? "\u2705" : "\u23F3"} ${source.file}`
        )
      )
    ) : null,
    sources.length > 0 ? (0, import_react6.createElement)(
      "div",
      { style: { marginTop: "10px" } },
      (0, import_react6.createElement)(
        "button",
        {
          style: S.bigBtn(true),
          onClick: onConvert,
          disabled: busy || converting
        },
        "\u2461 \u5F00\u59CB\u8F6C\u6362\uFF08\u673A\u5668\u81EA\u52A8\u8DD1\uFF09"
      ),
      converting ? (0, import_react6.createElement)(
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
    // 票 stale-detection/01：状态卡不再自己算一遍停顿时长、也不再出黄色警告框与那颗按钮——
    // 这一屏唯一的出口是活性行（每个阶段都在，而状态卡只在兜底那一支才在）。
    // 它消费的**就是活性行那一份判定对象**（`src/ui/rules.js` 的 `deriveStallJudgment`）：
    // 不判停就说「🤖 我正在做 · 这一步已进行 X」，判停就只报时长。
    stall,
    onDeleteStart,
    onDeleteConfirm,
    deletingId
  } = props;
  const [, tick] = (0, import_react6.useState)(0);
  (0, import_react6.useEffect)(() => {
    const timer = setInterval(() => tick((n) => n + 1), 1e3);
    return () => clearInterval(timer);
  }, []);
  if (meta.status === "error") {
    const rawError = lastEvent?.data?.message ?? "\u672A\u77E5\u9519\u8BEF";
    const humanError = typeof meta?.lastErrorHuman === "string" && meta.lastErrorHuman !== "" ? meta.lastErrorHuman : rawError;
    const isTokenIssue = humanError.includes("Token") || humanError.includes("token");
    return (0, import_react6.createElement)(
      "div",
      { style: { ...S.focus, borderColor: "var(--dsw-danger, #cf222e)" } },
      (0, import_react6.createElement)(
        "strong",
        { style: { color: "var(--dsw-danger, #cf222e)" } },
        "\u26A0\uFE0F \u8FD9\u4E00\u6B65\u51FA\u9519\u4E86"
      ),
      (0, import_react6.createElement)("p", { style: { margin: "6px 0" } }, humanError),
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "6px 0 0", fontSize: "13px", opacity: 0.9 } },
        // 票 10（判定一 #9）：两条上限是**两件事**——500MB 是单份上传体积上限
        // （domain-rules.MAX_UPLOAD_BYTES，前后端共用同一常量），200 页是 MinerU 单次解析的页数上限。
        // 原来这句只说页数、不说体积，用户按 200 页拆完仍可能撞 500MB。这里一并说清。
        "\u4F60\u53EF\u4EE5\uFF1A\u628A PDF \u62C6\u6210\u51E0\u4EFD\uFF08\u6BCF\u4EFD <200 \u9875\u3001<500MB\uFF09\u540E\u5206\u522B\u4E0A\u4F20\uFF0C\u6216\u6362\u4E00\u672C\u66F4\u8584\u7684\u4E66\uFF0C\u6216\u5220\u6389\u8FD9\u672C\u4E66\u91CD\u65B0\u5F00\u59CB\u3002"
      ),
      isTokenIssue ? (0, import_react6.createElement)(
        "p",
        { style: { margin: "4px 0 0", fontSize: "13px", opacity: 0.9 } },
        "\u{1F4A1} MinerU Token \u53EF\u80FD\u5931\u6548\uFF0C\u53EF\u5230\u5DE5\u4F5C\u53F0\u300CMinerU Token\u300D\u5904\u70B9\u300C\u91CD\u65B0\u8BBE\u7F6E\u300D\u6362\u65B0 Token\u3002"
      ) : null,
      (0, import_react6.createElement)(
        "button",
        { style: S.bigBtn(true), onClick: onResume, disabled: busy },
        // 票 10（判定一 #8）：原来这里说「▶️ 让 AI 接着干」、活性行说「[戳一下 AI]」、
        // 状态卡说「🔁 让 AI 接着干」——同一动作三种说法，统一成这一句。
        "\u{1F501} \u8BA9 AI \u63A5\u7740\u5E72"
      ),
      // F28（2026-08-20 走查）：上传错了给「删书重来」入口——两步确认（第一态→确认态），
      // 确认按钮只受 busy 置灰；删除后回向导可马上建一本新书。仅在父级传入删除回调时显示。
      typeof onDeleteStart === "function" ? (0, import_react6.createElement)(
        "div",
        {
          style: {
            marginTop: "8px",
            paddingTop: "8px",
            borderTop: "1px dashed var(--dsw-border, #d0d7de)"
          }
        },
        (0, import_react6.createElement)(
          "p",
          { style: { margin: "0 0 6px", fontSize: "13px", opacity: 0.9 } },
          "\u4E0A\u4F20\u9519\u4E86\uFF1F\u53EF\u4EE5\u5220\u6389\u8FD9\u672C\u4E66\u91CD\u65B0\u5EFA\u4E00\u672C\uFF08\u65E7\u4E66\u8FDB\u56DE\u6536\u7AD9\uFF09\uFF0C\u56DE\u5230\u5411\u5BFC\u9A6C\u4E0A\u5C31\u80FD\u5F00\u59CB\u65B0\u4E66\u3002"
        ),
        deletingId === true ? (0, import_react6.createElement)(
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
        ) : (0, import_react6.createElement)(
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
    return (0, import_react6.createElement)(
      "div",
      { style: { ...S.focus, borderColor: "var(--dsw-danger, #cf222e)" } },
      (0, import_react6.createElement)(
        "strong",
        { style: { color: "var(--dsw-danger, #cf222e)" } },
        "\u{1F511} \u9700\u8981\u5148\u914D\u7F6E"
      ),
      (0, import_react6.createElement)("p", { style: { margin: "6px 0" } }, needsConfig),
      (0, import_react6.createElement)(
        "button",
        { style: S.bigBtn(true), onClick: onResume, disabled: busy },
        "\u6211\u914D\u597D\u4E86\uFF0C\u7EE7\u7EED"
      )
    );
  }
  let label = "";
  let extra = "";
  if (typeof pendingStageLabel === "string" && pendingStageLabel !== "") {
    label = `\u6211\u6B63\u5728\u505A \xB7 ${pendingStageLabel}`;
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
    4: "\u6700\u4F73\u8303\u4F8B\u7AE0\uFF1AAI \u6B63\u5728\u5199\u7B2C 1 \u7AE0\u7ED9\u4F60\u770B\u6548\u679C",
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
        (_chapter, index) => doneSet.has(index + 1) && !hasPendingReview(reviews, index + 1)
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
    (0, import_react6.createElement)(
      "strong",
      { style: { fontSize: "14px" } },
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
            background: "var(--dsw-border, #d0d7de)",
            overflow: "hidden"
          }
        },
        (0, import_react6.createElement)("div", {
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
      stalled ? `\u23F1 \u8FD9\u4E00\u6B65\u5DF2\u8FDB\u884C ${humanDuration(stepElapsedMs)}` : `\u{1F916} \u6211\u6B63\u5728\u505A \xB7 \u8FD9\u4E00\u6B65\u5DF2\u8FDB\u884C ${humanDuration(stepElapsedMs)}`
    ),
    (0, import_react6.createElement)(
      "p",
      { style: { margin: "6px 0 0", opacity: 0.8 } },
      // 票 10（判定四④）：阶段说明（上面 phaseDesc 一句）已经说清"这一步在干什么"，
      // 这句泛泛脚注再讲一遍就是同构重复——压到只留「怎么找它」这一条独有信息。
      "AI \u53EF\u80FD\u4EB2\u81EA\u505A\uFF0C\u4E5F\u53EF\u80FD\u6D3E\u4E00\u6279\u5C0F\u52A9\u624B\u5E76\u884C\u5E72\uFF1B\u8981\u62CD\u677F\u65F6\u4F1A\u4EAE \u26A1\u3002"
    )
  );
}
function DeliveryCard(props) {
  const {
    project,
    session,
    checks,
    onPreview,
    busy,
    meta,
    aiReport,
    styleNotes
  } = props;
  const bookName = (meta?.name ?? "").trim() || "BOOK";
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
    (0, import_react6.createElement)("strong", { style: { fontSize: "14px" } }, "\u{1F389} \u4E66\u505A\u597D\u4E86\uFF01"),
    aiReport !== null && aiReport !== void 0 && aiReport !== "" ? (0, import_react6.createElement)(
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
      (0, import_react6.createElement)("strong", null, "\u{1F916} AI \u68C0\u67E5\u8BF4\u7684\uFF1A"),
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "4px 0 0", whiteSpace: "pre-wrap" } },
        aiReport
      )
    ) : null,
    (0, import_react6.createElement)(MachineChecks, { checks }),
    (styleNotes ?? []).length > 0 ? (0, import_react6.createElement)(
      "div",
      {
        style: {
          margin: "10px 0",
          padding: "8px 10px",
          borderRadius: "8px",
          border: "1px solid var(--dsw-border, #d0d7de)"
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
          `${note.status === "superseded" ? "\xB7\uFF08\u5DF2\u6536\u56DE\uFF09" : note.status === "conflict" ? "\xB7\uFF08\u4E0E\u8BBE\u8BA1\u51B2\u7A81\uFF0C\u7406\u7531\u89C1\u5907\u6CE8\uFF09" : "\xB7"}${note.text}`,
          note.note ? (0, import_react6.createElement)(
            "span",
            { style: { opacity: 0.6 } },
            ` -- ${note.note}`
          ) : null
        )
      )
    ) : null,
    (0, import_react6.createElement)(
      "p",
      { style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
      "AI \u4EB2\u624B\u505A\u5B8C\u6700\u540E\u68C0\u67E5\uFF0C\u673A\u5668\u4E5F\u515C\u5E95\u9A8C\u8FC7\uFF1B\u4ECD\u5EFA\u8BAE\u5148\u8BA9\u8001\u5E08/\u5BB6\u957F\u590D\u6838\u4E00\u904D\u518D\u7528\u3002"
    ),
    (0, import_react6.createElement)(
      "div",
      { style: { display: "flex", gap: "10px", margin: "10px 0" } },
      (0, import_react6.createElement)(
        "button",
        // 批 3 视觉权重：交付屏的"主操作"是下载（用户要的是那本书），预览是次级的。
        // 票 03：预览改成在 DSH 右栏打开成品——卡片里不再灌整本 <pre>，故没有「收起」态。
        { style: S.ghostBtn(false), onClick: onPreview, disabled: busy },
        // 票 10（判定一 #13）：与终检认可卡统一——同一份 `work/book.md`，名字用产物词表的
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
          href: `/textbook/download?session=${encodeURIComponent(session)}&project=${encodeURIComponent(project)}&path=work/book.md`
        },
        `\u2B07\uFE0F \u4E0B\u8F7D\u300A${bookName}\u300B.md`
      )
    ),
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
                color: "var(--dsw-accent, #4f6ef7)",
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
      ),
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "0" } },
        "\u5982\u679C\u672C\u9879\u76EE\u5BF9\u4F60\u6709\u5E2E\u52A9\uFF0C\u6B22\u8FCE\u586B\u5199\u9080\u8BF7\u7801\uFF1A",
        (0, import_react6.createElement)(
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
        "\uFF0C\u53EF\u514D\u8D39\u9886\u53D6 100 \u4E07 tokens\uFF0C\u5B98\u65B9\u9020\u4E66\u5168\u573A\u514D\u8D39\u5B66\uFF08\u7B2C\u4E09\u65B9\u6D3B\u52A8\uFF0C\u4EE5\u5BF9\u65B9\u89C4\u5219\u4E3A\u51C6\uFF09\u3002"
      )
    )
  );
}
function FinalApprovalCard(props) {
  const {
    checks,
    onPreview,
    busy,
    aiReport,
    styleNotes,
    onApprove,
    onReject
  } = props;
  const [note, setNote] = (0, import_react6.useState)("");
  const noteRef = (0, import_react6.useRef)(null);
  const [needNote, setNeedNote] = (0, import_react6.useState)(false);
  return (0, import_react6.createElement)(
    "div",
    { style: S.focus },
    (0, import_react6.createElement)("strong", { style: { fontSize: "14px" } }, "\u{1F6E1}\uFE0F \u6700\u540E\u68C0\u67E5\u5B8C\u6210\uFF0C\u7B49\u4F60\u5BF9\u6574\u672C\u4E66\u628A\u5173"),
    aiReport !== null && aiReport !== void 0 && aiReport !== "" ? (0, import_react6.createElement)(
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
      (0, import_react6.createElement)("strong", null, "\u{1F916} AI \u68C0\u67E5\u8BF4\u7684\uFF1A"),
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "4px 0 0", whiteSpace: "pre-wrap" } },
        aiReport
      )
    ) : null,
    // 票 20：没过的检查项各给一个「让 AI 按这条去改」入口——指令由机器按该项 note 起草，
    // 点一下即走既有的「不满意，让 AI 改」同一条回路（final-approve approved:false + note），
    // 不新开通道。交付卡不传 onFix：交付时清单必然全过，那里没有可改的项。
    (0, import_react6.createElement)(MachineChecks, {
      checks,
      onFix: (check) => onReject(draftFixInstruction(check)),
      fixDisabled: busy
    }),
    (styleNotes ?? []).length > 0 ? (0, import_react6.createElement)(
      "div",
      {
        style: {
          margin: "10px 0",
          padding: "8px 10px",
          borderRadius: "8px",
          border: "1px solid var(--dsw-border, #d0d7de)"
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
          `${note2.status === "superseded" ? "\xB7\uFF08\u5DF2\u6536\u56DE\uFF09" : note2.status === "conflict" ? "\xB7\uFF08\u4E0E\u8BBE\u8BA1\u51B2\u7A81\uFF0C\u7406\u7531\u89C1\u5907\u6CE8\uFF09" : "\xB7"}${note2.text}`,
          note2.note ? (0, import_react6.createElement)(
            "span",
            { style: { opacity: 0.6 } },
            ` -- ${note2.note}`
          ) : null
        )
      )
    ) : null,
    (0, import_react6.createElement)(
      "p",
      { style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
      // 票 10（判定四③）：原句 79 字压到 90 字内——「AI 已整体调整过、机器也兜底验过」与
      // 上面那句（交付卡同款）重复，删掉；保留"这是最后一次把关"与两条出路。
      "\u8FD9\u662F\u4F60\u5BF9\u6574\u672C\u4E66\u7684\u6700\u540E\u4E00\u6B21\u628A\u5173\uFF1A\u6EE1\u610F\u5C31\u8BA4\u53EF\u4EA4\u4ED8\uFF1B\u8981\u6539\u7684\u5199\u4E00\u53E5\u610F\u89C1\uFF0CAI \u4F1A\u7167\u7740\u6539\u6574\u672C\u540E\u91CD\u65B0\u505A\u6700\u540E\u68C0\u67E5\u3002"
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
          border: needNote ? "1px solid var(--dsw-danger, #cf222e)" : "1px solid var(--dsw-border, #d0d7de)",
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
          color: "var(--dsw-danger, #cf222e)"
        }
      },
      "\u26A0\uFE0F \u5148\u5728\u4E0A\u9762\u5199\u4E00\u53E5\u300C\u8981\u6539\u4EC0\u4E48\u300D\uFF0C\u518D\u70B9\u300C\u4E0D\u6EE1\u610F\u300D\u2014\u2014AI \u5F97\u7167\u7740\u4F60\u8FD9\u53E5\u8BDD\u6539\u6574\u672C\u3002"
    ) : null,
    (0, import_react6.createElement)(
      "div",
      { style: { display: "flex", gap: "10px", margin: "10px 0" } },
      (0, import_react6.createElement)(
        "button",
        // 票 03：成品在 DSH 右栏预览（卡片里不再灌整本 <pre>，故无「收起」态）。
        { style: S.ghostBtn(false), onClick: onPreview, disabled: busy },
        // 票 10（判定一 #13）：与交付卡同一份成品、同一个名字（「成书」）。
        "\u{1F440} \u6253\u5F00\u6210\u4E66"
      ),
      (0, import_react6.createElement)(
        "button",
        {
          // 2026-09-20 批 3：三键同权 → 主操作（认可）填色、其余描边。
          // 「不满意」原来在没写意见时直接 disabled，看着能点却点不动；现在让它永远可点，
          // 点了把光标送进输入框并说明原因（后端契约：approved=false 必须带 note）。
          style: { ...S.ghostBtn(true), marginRight: "auto" },
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
        "\u274C \u4E0D\u6EE1\u610F\uFF0C\u8BA9 AI \u6539"
      ),
      (0, import_react6.createElement)(
        "button",
        { style: S.bigBtn(true), onClick: () => onApprove(), disabled: busy },
        "\u2705 \u8BA4\u53EF\uFF0C\u4EA4\u4ED8"
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
function GatePanel(props) {
  const { gate, onDecide, onRollback, busy, error, onAddPattern } = props;
  const [showDetail, setShowDetail] = (0, import_react6.useState)(true);
  const [showCompare, setShowCompare] = (0, import_react6.useState)(false);
  const [rejecting, setRejecting] = (0, import_react6.useState)(false);
  const [mode, setMode] = (0, import_react6.useState)("wrong");
  const [reasons, setReasons] = (0, import_react6.useState)([]);
  const [note, setNote] = (0, import_react6.useState)("");
  const [styleText, setStyleText] = (0, import_react6.useState)("");
  const [confirmRollback, setConfirmRollback] = (0, import_react6.useState)(false);
  const rollbackConfirm = () => (0, import_react6.createElement)(
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
      "\u23EA \u56DE\u9000\u5230\u6700\u8FD1\u4E00\u6B21\u5B58\u6863\uFF1F"
    ),
    (0, import_react6.createElement)(
      "p",
      {
        style: {
          margin: "0 0 6px",
          fontSize: "12px",
          color: "var(--dsw-danger, #cf222e)"
        }
      },
      "\u8FD9\u4E00\u6B65\u4E4B\u540E\u65B0\u63A8\u8FDB\u7684\u90E8\u5206\u4F1A\u88AB\u91CD\u505A\uFF1B\u56DE\u9000\u524D\u4F1A\u5148\u5B58\u4E00\u7248\uFF0C\u4E4B\u540E\u8FD8\u80FD\u518D\u56DE\u9000\u3002"
    ),
    (0, import_react6.createElement)(
      "div",
      { style: { display: "flex", gap: "8px" } },
      (0, import_react6.createElement)(
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
        "\u4E4B\u540E\u60F3\u6539\uFF1A\u53EF\u56DE\u9000\u5230\u6700\u8FD1\u4E00\u6B21\u5B58\u6863\uFF1B\u8981\u6539\u66F4\u65E9\u7684\u51B3\u5B9A\uFF0C\u7B49 AI \u505C\u624B\uFF08\u6216\u5148 \u23F8 \u6682\u505C\uFF09\u540E\u5C55\u5F00\u4E0A\u9762\u7684\u6B65\u6E05\u5355\u70B9\u90A3\u4E00\u6B65\uFF0C\u7528\u300C\u5B9A\u70B9\u4FEE\u6539\u300D\u3002"
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
            style: { ...S.smallLink, color: "inherit", opacity: 0.7 },
            onClick: () => setConfirmRollback(true),
            disabled: busy
          },
          "\u23EA \u56DE\u9000\u5230\u6700\u8FD1\u4E00\u6B21\u5B58\u6863"
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
    (0, import_react6.createElement)(
      "div",
      null,
      (0, import_react6.createElement)(
        "strong",
        { style: { fontSize: "14px" } },
        `\u{1F6A6} ${gateHuman(gate.gate)} \xB7 \u65B9\u6848 v${gate.version}`
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
    showCompare && gate.prevProposal !== null ? (0, import_react6.createElement)(
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
    error !== null ? (0, import_react6.createElement)("p", { style: S.error }, error) : null,
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
          " \u65B9\u6848\u4E0D\u5BF9 \u2014\u2014 AI \u91CD\u505A\u4E00\u7248"
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
          " \u6211\u770B\u4E0D\u61C2 / \u4E0D\u662F\u6211\u8981\u7684 \u2014\u2014 AI \u6362\u4EBA\u8BDD\u91CD\u8BB2\u3001\u7ED9\u4F8B\u5B50"
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
            borderColor: "var(--dsw-accent, #4f6ef7)"
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
          { style: S.bigBtn(false), onClick: submitReject, disabled: busy },
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
      "div",
      { style: { marginTop: "12px", display: "flex", gap: "10px" } },
      (0, import_react6.createElement)(
        "button",
        {
          style: S.bigBtn(true),
          onClick: () => onDecide({ approved: true }),
          disabled: busy
        },
        "\u2705 \u901A\u8FC7\uFF0C\u7EE7\u7EED"
      ),
      (0, import_react6.createElement)(
        "button",
        {
          // 批 3：原来「驳回」是整块红实心，和「通过」一样重；改成描边，
          // 让主操作（通过）是唯一填色的那个。
          style: S.ghostBtn(true),
          onClick: () => setRejecting(true),
          disabled: busy
        },
        "\u274C \u9A73\u56DE\uFF0C\u63D0\u610F\u89C1"
      )
    ),
    (0, import_react6.createElement)(
      "div",
      { style: { marginTop: "10px" } },
      (0, import_react6.createElement)(
        "button",
        {
          // 批 3 视觉权重三档：通过＝填色（主）、驳回＝描边（次）、回退＝灰色小链接（末）。
          // 原来回退是红描边按钮，和驳回抢眼；回退本身还有二次确认，做轻不会误触。
          style: { ...S.smallLink, color: "inherit", opacity: 0.7 },
          onClick: () => setConfirmRollback(true),
          disabled: busy
        },
        "\u23EA \u56DE\u9000\u5230\u6700\u8FD1\u4E00\u6B21\u5B58\u6863"
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
    return (0, import_react6.createElement)(
      "div",
      { style: { ...S.card, borderColor: "var(--dsw-danger, #cf222e)" } },
      (0, import_react6.createElement)(
        "strong",
        { style: { color: "var(--dsw-danger, #cf222e)" } },
        "\u{1F511} \u8FD8\u5DEE\u4E00\u6B65\uFF1AMinerU Token"
      ),
      (0, import_react6.createElement)(
        "p",
        { style: { margin: "4px 0" } },
        "PDF \u8F6C\u6362\u9700\u8981 MinerU \u7684 Token\uFF08\u5728 mineru.net \u7533\u8BF7\uFF1B\u514D\u8D39\u989D\u5EA6\u4EE5\u5BF9\u65B9\u89C4\u5219\u4E3A\u51C6\uFF09\u3002\u586B\u5728\u8FD9\u91CC\u5373\u53EF\uFF1A"
      ),
      (0, import_react6.createElement)("input", {
        style: S.input,
        placeholder: "\u7C98\u8D34 MinerU Token",
        value: mineruToken,
        onChange: onTokenChange
      }),
      (0, import_react6.createElement)(
        "button",
        { style: S.bigBtn(true), onClick: onSave, disabled: busy },
        "\u4FDD\u5B58 Token"
      )
    );
  }
  return (0, import_react6.createElement)(
    "div",
    { style: { ...S.card, borderColor: "var(--dsw-success, #1a7f37)" } },
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
      (0, import_react6.createElement)("strong", {}, "\u2705 MinerU Token \u5DF2\u8BBE\u7F6E\uFF08\u2022\u2022\u2022\u2022\uFF09"),
      (0, import_react6.createElement)(
        "button",
        { style: S.smallLink, onClick: onToggleReset },
        "\u91CD\u65B0\u8BBE\u7F6E"
      )
    ),
    resetOpen ? (0, import_react6.createElement)(
      "div",
      { style: { marginTop: "6px" } },
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
        { style: S.bigBtn(true), onClick: onSave, disabled: busy },
        "\u4FDD\u5B58\u65B0 Token"
      )
    ) : null
  );
}

// src/ui/chat-desk.js
var import_react7 = require("react");

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

// src/ui/chat-desk.js
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
  return (0, import_react7.createElement)(
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
  const name = root?.name ?? root?.call?.name ?? "\u5DE5\u5177";
  if (root?.kind === "tool-result") {
    const text = contentBlocksText(root?.content).replace(/\s+/g, " ").slice(0, 120);
    return `\u{1F527} ${name} \xB7 ${root?.isError === true ? "\u51FA\u9519" : "\u5B8C\u6210"}${text !== "" ? `\uFF1A${text}` : ""}`;
  }
  return `\u{1F527} ${name} \xB7 \u6267\u884C\u4E2D\u2026`;
}
function muted(text) {
  return (0, import_react7.createElement)(
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
  "textbook/gate-decision": (d) => `\u2713 \u7B2C ${d?.gate ?? "?"} \u6B21\u62CD\u677F${d?.approved === true ? "\u901A\u8FC7" : "\u9A73\u56DE"}`,
  "textbook/gold-seal": () => "\u2713 \u6700\u4F73\u8303\u4F8B\u7AE0\u5DF2\u5B9A\u7A3F\uFF08\u540E\u9762\u7684\u7AE0\u8282\u7167\u5B83\u5199\uFF09",
  "textbook/pattern-added": (d) => `\u2713 \u5DF2\u52A0\u81EA\u5B9A\u4E49\u6A21\u5F0F${d?.name ? `\uFF1A${String(d.name).slice(0, 20)}` : ""}`
};
function badgeSpan(text) {
  return (0, import_react7.createElement)(
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
  const nodes = deriveChatDeskNodes(props.useChat((s) => s));
  const lastNode = nodes.length > 0 ? nodes[nodes.length - 1] : null;
  const events = props.events ?? [];
  const onNudge = props.onNudge ?? (() => {
  });
  const onCollapse = props.onCollapse ?? null;
  const deskScrollRef = (0, import_react7.useRef)(null);
  (0, import_react7.useEffect)(() => {
    const el = deskScrollRef.current;
    if (el === null) return void 0;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (nearBottom) el.scrollTop = el.scrollHeight;
    return void 0;
  }, [nodes.length, lastNode]);
  (0, import_react7.useEffect)(() => {
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
  return (0, import_react7.createElement)(
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
    onCollapse !== null ? (0, import_react7.createElement)(
      "div",
      {
        style: {
          position: "sticky",
          top: 0,
          background: "inherit",
          textAlign: "right"
        }
      },
      (0, import_react7.createElement)(
        "button",
        { style: S.smallLink, onClick: onCollapse },
        "\u6536\u6210\u4E00\u6761"
      )
    ) : null,
    (0, import_react7.createElement)(
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
      (0, import_react7.createElement)(
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
        "\u23F0 \u63D0\u9192 AI \u8BB0\u4E0B\u6765"
      )
    )
  );
}

// src/ui/confirm-cards.js
var import_react8 = require("react");
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
    knowledgeMapText,
    project,
    session,
    onConfirm,
    onViewReport,
    busy,
    reportText
  } = props;
  const sum = exploreSummary ?? {};
  const focus = normalizeTeachingFocus(sum.teachingFocus);
  const [showPoints, setShowPoints] = (0, import_react8.useState)(false);
  const [showSections, setShowSections] = (0, import_react8.useState)(false);
  const [rejecting, setRejecting] = (0, import_react8.useState)(false);
  const [reasons, setReasons] = (0, import_react8.useState)([]);
  const [rejectNote, setRejectNote] = (0, import_react8.useState)("");
  let km = null;
  if (typeof knowledgeMapText === "string" && knowledgeMapText !== "") {
    try {
      const parsed = JSON.parse(knowledgeMapText);
      if (parsed !== null && typeof parsed === "object") km = parsed;
    } catch {
    }
  }
  const [report, setReport] = (0, import_react8.useState)(
    () => typeof reportText === "string" && reportText !== "" ? reportText : null
  );
  (0, import_react8.useEffect)(() => {
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
  return (0, import_react8.createElement)(
    "div",
    { style: S.focus },
    reportBlocks.length > 0 ? (0, import_react8.createElement)(
      "div",
      { style: { ...S.card, marginBottom: "10px" } },
      (0, import_react8.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontSize: "12px", opacity: 0.8 } },
        "\u{1F4CB} \u8BFB\u6750\u6599\u62A5\u544A\uFF08AI \u901A\u8BFB\u540E\u7684\u5B8C\u6574\u8BB0\u5F55\uFF09\uFF1A"
      ),
      ...reportBlocks
    ) : null,
    (0, import_react8.createElement)(
      "strong",
      { style: { fontSize: "14px" } },
      "\u{1F50D} \u6750\u6599\u8BFB\u5B8C\u4E86\uFF01"
    ),
    (0, import_react8.createElement)(
      "p",
      { style: { margin: "6px 0" } },
      `AI \u5DF2\u901A\u8BFB\u4F60\u7684\u6559\u6750\uFF0C\u6574\u7406\u51FA\uFF1A\u6765\u6E90\u6750\u6599 ${sum.sources ?? 0} \u4EFD \xB7 \u77E5\u8BC6\u70B9 ${sum.knowledgePoints ?? 0} \u4E2A \xB7 \u5EFA\u8BAE\u5206 ${sum.chapterSuggestion ?? 0} \u7AE0\u3002`
    ),
    focus.length > 0 ? (0, import_react8.createElement)(
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
      (0, import_react8.createElement)(
        "p",
        { style: { margin: "0 0 4px", fontSize: "12px", opacity: 0.8 } },
        "AI \u5224\u65AD\u7684\u91CD\u70B9/\u96BE\u70B9\uFF1A"
      ),
      focus.map(
        (item, index) => (0, import_react8.createElement)(
          "div",
          { key: index, style: { fontSize: "12px", margin: "2px 0" } },
          `\xB7 ${item}`
        )
      )
    ) : null,
    chapters.length > 0 ? (0, import_react8.createElement)(
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
      (0, import_react8.createElement)(
        "p",
        { style: { margin: "0 0 4px", fontSize: "12px", opacity: 0.8 } },
        "\u{1F4DA} AI \u5EFA\u8BAE\u7684\u7AE0\u8282\u5B89\u6392\uFF08\u540E\u7EED\u53EF\u518D\u8C03\uFF09\uFF1A"
      ),
      chapters.map(
        (chapter, index) => (0, import_react8.createElement)(
          "div",
          { key: index, style: { fontSize: "12px", margin: "2px 0" } },
          `${index + 1}. ${chapter.title ?? ""}`,
          chapter.source !== void 0 && chapter.source !== "" && chapter.source !== null ? (0, import_react8.createElement)(
            "span",
            { style: { opacity: 0.6 } },
            `\u3000\u2190 ${chapter.source}`
          ) : null
        )
      )
    ) : null,
    kps.length > 0 ? (0, import_react8.createElement)(
      "div",
      { style: { margin: "4px 0 8px" } },
      (0, import_react8.createElement)(
        "button",
        { style: S.smallLink, onClick: () => setShowPoints(!showPoints) },
        showPoints ? `\u25BE \u6536\u8D77\u77E5\u8BC6\u70B9\u6E05\u5355\uFF08${kps.length} \u4E2A\uFF09` : `\u25B8 \u77E5\u8BC6\u70B9\u6E05\u5355\uFF08${kps.length} \u4E2A\uFF0C\u70B9\u5F00\u770B\uFF09`
      ),
      showPoints ? (0, import_react8.createElement)(
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
          (point, index) => (0, import_react8.createElement)(
            "div",
            {
              key: index,
              style: { fontSize: "12px", margin: "2px 0" }
            },
            `\xB7 ${point.title ?? ""}`,
            point.difficulty !== void 0 && point.difficulty !== "" && point.difficulty !== null ? (0, import_react8.createElement)(
              "span",
              {
                style: {
                  color: DIFF_COLORS[point.difficulty] ?? "#57606a"
                }
              },
              `\uFF08${point.difficulty}\uFF09`
            ) : null,
            point.source !== void 0 && point.source !== "" && point.source !== null ? (0, import_react8.createElement)(
              "span",
              { style: { opacity: 0.5 } },
              ` ${point.source}`
            ) : null
          )
        )
      ) : null
    ) : null,
    sections.length > 0 ? (0, import_react8.createElement)(
      "div",
      { style: { margin: "4px 0 8px" } },
      (0, import_react8.createElement)(
        "button",
        {
          style: S.smallLink,
          onClick: () => setShowSections(!showSections)
        },
        showSections ? "\u25BE \u6536\u8D77\u6BCF\u672C\u6750\u6599\u91CC\u8BFB\u5230\u7684\u5C0F\u8282" : "\u25B8 \u6BCF\u672C\u6750\u6599\u91CC\u8BFB\u5230\u7684\u5C0F\u8282\uFF08\u70B9\u5F00\u770B\uFF09"
      ),
      showSections ? (0, import_react8.createElement)(
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
          return (0, import_react8.createElement)(
            "div",
            {
              key: index,
              style: { fontSize: "12px", margin: "2px 0" }
            },
            `\u8D44\u6599${material?.num ?? index + 1}\uFF1A`,
            (0, import_react8.createElement)(
              "span",
              { style: { opacity: 0.8 } },
              titles.join(" / ") || "\uFF08\u672A\u8BFB\u5230\u5C0F\u8282\u6807\u9898\uFF09"
            )
          );
        })
      ) : null
    ) : null,
    (0, import_react8.createElement)(
      "p",
      { style: { margin: "0 0 8px", fontSize: "12px", opacity: 0.75 } },
      "\u8FD9\u662F\u540E\u9762\u6240\u6709\u8BBE\u8BA1\u7684\u57FA\u7840\u3002\u6EE1\u610F\u5C31\u7EE7\u7EED\uFF1B\u4E0D\u6EE1\u610F\u70B9\u300C\u91CD\u505A\u300D\uFF0C\u52FE\u4E2A\u7406\u7531\u6216\u5199\u4E00\u53E5\u54EA\u91CC\u4E0D\u6EE1\u610F\uFF0CAI \u4F1A\u7167\u7740\u6539\uFF08\u4E0D\u586B\u4E5F\u80FD\u91CD\u505A\uFF09\u3002"
    ),
    rejecting ? (0, import_react8.createElement)(
      "div",
      {
        style: {
          marginTop: "10px",
          borderTop: "1px dashed var(--dsw-border, #d0d7de)",
          paddingTop: "8px"
        }
      },
      (0, import_react8.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontWeight: 600 } },
        // 票 14（承诺账 D「说不清」第 7 条）：「10 秒」估的是用户自己的操作成本、
        // 不是系统耗时，代码里断不了真假——收掉这个数字（点选或写一句本身已经够短）。
        "\u54EA\u91CC\u4E0D\u6EE1\u610F\uFF1F\uFF08\u70B9\u9009\u6216\u5199\u4E00\u53E5\uFF09"
      ),
      (0, import_react8.createElement)(
        "div",
        { style: { margin: "6px 0" } },
        RE_EXPLORE_REASONS.map(
          (reason) => (0, import_react8.createElement)(
            "label",
            { key: reason, style: S.checkItem },
            (0, import_react8.createElement)("input", {
              type: "checkbox",
              checked: reasons.includes(reason),
              onChange: () => toggleReason(reason)
            }),
            ` ${reason}`
          )
        )
      ),
      (0, import_react8.createElement)("textarea", {
        style: S.textarea,
        placeholder: "\u60F3\u591A\u8BF4\u4E00\u53E5\uFF1F\u5728\u8FD9\u91CC\u5199\uFF08\u53EF\u9009\uFF09",
        value: rejectNote,
        onChange: (e) => setRejectNote(e.target.value)
      }),
      (0, import_react8.createElement)(
        "div",
        { style: { marginTop: "8px", display: "flex", gap: "8px" } },
        (0, import_react8.createElement)(
          "button",
          {
            style: S.bigBtn(false),
            onClick: () => onConfirm(false, { reasons, note: rejectNote }),
            disabled: busy
          },
          "\u{1F501} \u5C31\u8FD9\u6837\u91CD\u505A"
        ),
        (0, import_react8.createElement)(
          "button",
          {
            style: { ...S.smallLink, textDecoration: "none" },
            onClick: cancelReject
          },
          "\u53D6\u6D88"
        )
      )
    ) : (0, import_react8.createElement)(
      "div",
      { style: { display: "flex", gap: "8px", flexWrap: "wrap" } },
      (0, import_react8.createElement)(
        "button",
        {
          style: S.bigBtn(true),
          onClick: () => onConfirm(true),
          disabled: busy
        },
        "\u2705 \u6EE1\u610F\uFF0C\u7EE7\u7EED\u8BBE\u8BA1"
      ),
      (0, import_react8.createElement)(
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
      (0, import_react8.createElement)(
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
  const [rejecting, setRejecting] = (0, import_react8.useState)(false);
  const [note, setNote] = (0, import_react8.useState)("");
  const chapters = meta?.outline?.chapters ?? [];
  const totalWords = chapters.reduce(
    (sum, chapter) => sum + (Number.isFinite(chapter?.targetWords) ? chapter.targetWords : 0),
    0
  );
  const [goldPick, setGoldPick] = (0, import_react8.useState)(() => {
    const initial = Number(meta?.goldChapter ?? 1);
    return Number.isSafeInteger(initial) && initial >= 1 && initial <= chapters.length ? initial : 1;
  });
  const goldReason = typeof meta?.goldChapterReason === "string" ? meta.goldChapterReason : "";
  const safePick = Number.isSafeInteger(Number(goldPick)) && Number(goldPick) >= 1 && Number(goldPick) <= chapters.length ? Number(goldPick) : 1;
  return (0, import_react8.createElement)(
    "div",
    { style: S.focus },
    (0, import_react8.createElement)(
      "strong",
      { style: { fontSize: "14px" } },
      "\u{1F4D0} \u7AE0\u8282\u5B89\u6392\u51FA\u6765\u4E86\uFF01"
    ),
    (0, import_react8.createElement)(
      "p",
      { style: { margin: "6px 0" } },
      `AI \u8BA1\u5212\u628A\u8FD9\u672C\u4E66\u5206\u6210 ${chapters.length} \u7AE0${totalWords > 0 ? `\uFF0C\u5168\u4E66\u5927\u7EA6 ${totalWords} \u5B57` : ""}\u3002\u6BCF\u7AE0\u6807\u597D\u4E86\u7528\u6750\u6599\u7684\u54EA\u4E00\u5757\u3001\u8986\u76D6\u54EA\u4E9B\u77E5\u8BC6\u70B9\u3001\u5927\u6982\u5199\u591A\u957F\u3002\u6EE1\u610F\u70B9\u300C\u901A\u8FC7\u300D\uFF0CAI \u5148\u628A\u7B2C ${safePick} \u7AE0\u5F53\u6700\u4F73\u8303\u4F8B\u7AE0\u5199\u51FA\u6765\u7ED9\u4F60\u8FC7\u76EE\uFF1B\u8981\u8C03\u5C31\u70B9\u300C\u8BA9 AI \u91CD\u505A\u300D\u3002`
    ),
    (0, import_react8.createElement)(
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
        return (0, import_react8.createElement)(
          "div",
          { key: index, style: { fontSize: "12px", margin: "4px 0" } },
          `${index + 1}. ${chapter.title ?? ""}`,
          chapter.outline !== void 0 && chapter.outline !== "" && chapter.outline !== null ? (0, import_react8.createElement)(
            "span",
            { style: { opacity: 0.6 } },
            `\u3000${chapter.outline}`
          ) : null,
          (0, import_react8.createElement)(
            "div",
            { style: { opacity: 0.6, margin: "1px 0 0" } },
            [
              chapter.source !== void 0 && chapter.source !== "" && chapter.source !== null ? `\u6E90\uFF1A${chapter.source}` : null,
              Number.isFinite(chapter.targetWords) ? `\u7EA6 ${chapter.targetWords} \u5B57` : null
            ].filter(Boolean).join(" \xB7 ")
          ),
          pointsArr.length > 0 ? (0, import_react8.createElement)(
            "div",
            { style: { opacity: 0.6, margin: "1px 0 0" } },
            `\u8986\u76D6\u77E5\u8BC6\u70B9 ${pointsArr.length} \u4E2A${points !== "" ? `\uFF1A${points}` : ""}`
          ) : null,
          volumeReason !== "" ? (0, import_react8.createElement)(
            "div",
            {
              style: { opacity: 0.5, fontSize: "11px", margin: "1px 0 0" }
            },
            `\u4F53\u91CF\u4F9D\u636E\uFF1A${volumeReason}`
          ) : null
        );
      })
    ),
    (0, import_react8.createElement)(
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
      (0, import_react8.createElement)(
        "span",
        { style: { fontSize: "12px" } },
        // 票 10（判定一 #3）：「样例章」与同一张卡下面按钮上的「最佳范例章」是同一件事两种叫法，
        // 统一取界面词表定的「最佳范例章」（CONTEXT.md「范例章」词条：对外统一为最佳范例章）。
        `\u{1F4D0} AI \u5EFA\u8BAE\u7528\u7B2C ${safePick} \u7AE0\u5F53\u6700\u4F73\u8303\u4F8B\u7AE0\uFF1A${goldReason !== "" ? goldReason : "\uFF08\u672A\u7ED9\u7406\u7531\uFF09"}`
      ),
      chapters.length > 1 ? (0, import_react8.createElement)(
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
          (chapter, index) => (0, import_react8.createElement)(
            "option",
            { key: index, value: index + 1 },
            `${index + 1}. ${chapter.title ?? ""}`
          )
        )
      ) : null,
      chapters.length > 1 ? (0, import_react8.createElement)(
        "span",
        { style: { fontSize: "11px", opacity: 0.6 } },
        "\uFF08\u53EF\u6539\u9009\uFF09"
      ) : null
    ),
    rejecting ? (0, import_react8.createElement)(
      "div",
      {
        style: {
          marginTop: "10px",
          borderTop: "1px dashed var(--dsw-border, #d0d7de)",
          paddingTop: "8px"
        }
      },
      (0, import_react8.createElement)(
        "p",
        { style: { margin: "0 0 6px", fontWeight: 600 } },
        "\u6539\u54EA\u91CC\uFF1F\u5199\u4E00\u53E5\uFF08\u6BD4\u5982\uFF1A\u7B2C3\u7AE0\u62C6\u6210\u4E24\u7AE0 / \u6BCF\u7AE0\u5B57\u6570\u592A\u591A\uFF09"
      ),
      (0, import_react8.createElement)("textarea", {
        style: S.textarea,
        placeholder: "\u60F3\u600E\u4E48\u8C03\uFF0C\u5199\u5728\u8FD9\u91CC\uFF08\u53EF\u4E0D\u586B\uFF0CAI \u4F1A\u81EA\u5DF1\u91CD\u65B0\u5B89\u6392\uFF09",
        value: note,
        onChange: (e) => setNote(e.target.value)
      }),
      (0, import_react8.createElement)(
        "div",
        { style: { marginTop: "8px", display: "flex", gap: "8px" } },
        (0, import_react8.createElement)(
          "button",
          {
            style: S.bigBtn(false),
            onClick: () => onConfirm(false, note.trim()),
            disabled: busy
          },
          "\u{1F501} \u5C31\u8FD9\u6837\u91CD\u65B0\u5B89\u6392"
        ),
        (0, import_react8.createElement)(
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
    ) : (0, import_react8.createElement)(
      "div",
      { style: { display: "flex", gap: "8px", flexWrap: "wrap" } },
      (0, import_react8.createElement)(
        "button",
        {
          style: S.bigBtn(true),
          onClick: () => onConfirm(true, note, safePick),
          disabled: busy
        },
        "\u2705 \u901A\u8FC7\uFF0C\u5F00\u59CB\u5199\u6700\u4F73\u8303\u4F8B\u7AE0"
      ),
      (0, import_react8.createElement)(
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
        // 票 10（判定一 #7）：与另一张确认卡的「🔁 让 AI 重做」是同一动作，统一成这一句
        // （引擎播报里告诉用户点哪个按钮的话也同步改了）。
        "\u{1F501} \u8BA9 AI \u91CD\u505A"
      )
    )
  );
}

// src/ui/panels.js
var import_react9 = require("react");
function humanTurnAction(status, gate, phase) {
  if (status === "awaiting-explore") return "\u786E\u8BA4\u8BFB\u5230\u7684\u6750\u6599\u91CD\u70B9\u5BF9\u4E0D\u5BF9";
  if (status === "awaiting-outline") return "\u786E\u8BA4\u7AE0\u8282\u5B89\u6392";
  if (status === "awaiting-gold") return "\u786E\u8BA4\u6700\u4F73\u8303\u4F8B\u7AE0";
  if (status === "awaiting-chapters-review") return "\u9010\u7AE0\u8FC7\u76EE";
  if (status === "awaiting-final-approval") return "\u5BF9\u6574\u672C\u4E66\u505A\u6700\u540E\u628A\u5173";
  if (gate !== null && gate.status === "awaiting")
    return gateHuman(gate.gate);
  if (phase === 1) return "\u4E0A\u4F20\u6559\u6750\uFF08\u5F00\u59CB\u8F6C\u6362\u540E AI \u4F1A\u81EA\u52A8\u63A5\u624B\uFF09";
  return "\u770B\u4E00\u773C\u4E0B\u9762\u7684\u5361\u7247";
}
function StatusStrip(props) {
  const { meta, gate, pendingStage, progressDetail, metaLabel, humanTurn } = props;
  const status = meta?.status ?? "active";
  const phase = meta?.phase ?? 1;
  let text = null;
  let tone = "normal";
  if (status === "delivered") {
    text = `\u{1F389} \u4E66\u505A\u597D\u4E86 \xB7 \u53EF\u4EE5\u9884\u89C8\u548C\u4E0B\u8F7D\u300A${meta.name ?? ""}\u300B.md`;
    tone = "ok";
  } else if (status === "error" || status === "needs-config") {
    text = status === "error" ? "\u26A0\uFE0F \u8F6E\u5230\u4F60 \xB7 \u51FA\u9519\u4E86\uFF0C\u8BF7\u770B\u4E0B\u9762\u7684\u63D0\u793A" : "\u{1F511} \u8F6E\u5230\u4F60 \xB7 \u9700\u8981\u914D\u7F6E\uFF0C\u8BF7\u770B\u4E0B\u9762\u7684\u63D0\u793A";
    tone = status === "error" ? "error" : "you";
  } else if (humanTurn === true || gate !== null && gate.status === "awaiting") {
    text = `\u26A1 \u8F6E\u5230\u4F60 \xB7 ${humanTurnAction(status, gate, phase)}`;
    tone = "you";
  } else if (pendingStage !== null && pendingStage !== void 0) {
    text = `\u{1F916} \u6211\u6B63\u5728\u505A \xB7 ${metaLabel ?? ""}${progressDetail ? `\u3000\u23F3 ${progressDetail}` : ""}`;
    tone = "ai";
  } else {
    text = "\u{1F916} \u6211\u6B63\u5728\u505A \xB7 \u51C6\u5907\u4E0B\u4E00\u6B65";
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
  return (0, import_react9.createElement)(
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
  const { meta, stall, subagents, humanTurn, onResume } = props;
  const runs = { count: 0, runningCount: 0, ...subagents ?? {} };
  const aggText = Number.isSafeInteger(runs.runningCount) && runs.runningCount > 0 ? `\u{1F50E} ${runs.runningCount} \u4E2A\u5C0F\u52A9\u624B\u5728\u8DD1` : "";
  const stalled = (stall ?? {}).stalled === true;
  const content = humanTurn === true ? null : (
    // 已交付＝全书完成：此时既不是「轮到你」也不是「我正在做」（真 GUI 判读实测：
    // 已交付的《工业大数据分析》活性行还写着「⚡ 轮到你」，同一屏却在大喊「🎉 书做好了」）。
    meta?.status === "delivered" ? "\u2705 \u5DF2\u5B8C\u6210" : meta?.status !== "running" ? "\u26A1 \u8F6E\u5230\u4F60" : stalled ? (0, import_react9.createElement)(
      "span",
      null,
      `\u{1F916} \u6211\u6B63\u5728\u505A \xB7 ${humanDuration(stall.idleMs)}\u6CA1\u52A8\u9759\u4E86 `,
      (0, import_react9.createElement)(
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
    ) : "\u{1F916} \u6211\u6B63\u5728\u505A"
  );
  if (content === null && aggText === "") return null;
  return (0, import_react9.createElement)(
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
    aggText !== "" ? (0, import_react9.createElement)(
      "span",
      { style: { fontWeight: 600, color: "#0969da" } },
      aggText
    ) : null,
    content
  );
}
function InterruptNote(props) {
  return (0, import_react9.createElement)(
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
    (0, import_react9.createElement)(
      "span",
      { style: { flex: 1 } },
      "\u{1F4A1} \u5DF2\u8BB0\u4E0B\uFF1B\u4E0D\u6253\u65AD\u6B63\u5728\u5199\u7684\u8FD9\u4E00\u7AE0\uFF0CAI \u5230\u4E0B\u4E2A\u505C\u9760\u70B9\u4F1A\u7167\u529E"
    ),
    (0, import_react9.createElement)(
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
  return (0, import_react9.createElement)(
    "div",
    { role: "status", style: AUTO_FOLLOW_BANNER_STYLE },
    (0, import_react9.createElement)("style", null, AUTO_FOLLOW_KEYFRAMES),
    (0, import_react9.createElement)(
      "span",
      { style: { flex: 1 } },
      "\u26A1 \u8F6E\u5230\u4F60\uFF0C\u5DF2\u5207\u56DE\u73B0\u5728"
    ),
    (0, import_react9.createElement)(
      "button",
      { style: S.smallLink, onClick: props.onClose },
      "\u2715"
    )
  );
}
function AutoFollowProgressNote(props) {
  const onDismiss = props.onDismiss ?? (() => {
  });
  return (0, import_react9.createElement)(
    "div",
    {
      role: "status",
      style: { ...AUTO_FOLLOW_BANNER_STYLE, cursor: "pointer" },
      onClick: props.onJump
    },
    (0, import_react9.createElement)("style", null, AUTO_FOLLOW_KEYFRAMES),
    (0, import_react9.createElement)("span", { style: { flex: 1 } }, "\u25B6 \u6211\u6B63\u5728\u505A\uFF0C\u70B9\u6B64\u8DF3\u8FC7\u53BB"),
    (0, import_react9.createElement)(
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
  return (0, import_react9.createElement)(
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
    (0, import_react9.createElement)("strong", null, `\u300A${meta?.name ?? ""}\u300B`),
    (0, import_react9.createElement)(
      "span",
      { style: { fontSize: "12px", opacity: 0.75 } },
      `\u4E00\u8D77\u505A\u5230\uFF1A${phaseUi(meta?.phase)}`
    ),
    (0, import_react9.createElement)("span", { style: { flex: 1 } }),
    styleCount > 0 ? (0, import_react9.createElement)(
      "button",
      {
        style: S.smallLink,
        onClick: openStylePanel,
        title: "\u4F60\u7684\u98CE\u683C\u610F\u89C1\u6E05\u5355\uFF08AI \u5199\u6BCF\u4E00\u7AE0\u90FD\u4F1A\u7167\u7740\u529E\uFF09"
      },
      `\u{1F3A8} \u98CE\u683C\u7EBF(${styleCount})`
    ) : null,
    pendingCount > 0 ? (0, import_react9.createElement)(
      "button",
      {
        style: S.smallLink,
        onClick: openIntervene,
        title: "\u7559\u8A00\u7A0D\u540E\u5904\u7406\uFF1A\u4E0D\u6253\u65AD AI\uFF0C\u5B83\u5230\u4E0B\u4E2A\u505C\u9760\u70B9\u4F1A\u770B"
      },
      `\u{1F4EE} \u7559\u8A00(${pendingCount})`
    ) : null,
    meta?.pause != null ? [
      // 票 10（spec §3 热区表把「顶栏 ⏸ 暂停 / ▶ 已暂停·点继续」判**不合法**；不变量 2
      // 「一个热区只干一件事」）：**状态归状态**——「已暂停」是纯指示，不是 `<button>`、
      // 没有 onClick、不替用户发动作；也故意不借 `S.smallLink`（那套带 `cursor:pointer`
      // ＋下划线，会让纯指示看着像能点）。旧文案「▶ 已暂停·点继续」把状态陈述与动作
      // 缝进同一句话、还与「⏸ 暂停」共用位置，已退役。
      (0, import_react9.createElement)(
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
      (0, import_react9.createElement)(
        "button",
        {
          key: "resume-button",
          style: { ...S.smallLink, color: "#1a7f37" },
          onClick: resume,
          title: "\u7EE7\u7EED\u4ECE\u65AD\u70B9\u63A5\u7740\u5199"
        },
        "\u25B6 \u7EE7\u7EED"
      )
    ] : (0, import_react9.createElement)(
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
  return (0, import_react9.createElement)(
    "div",
    {
      style: {
        ...S.card,
        borderColor: "var(--dsw-accent, #4f6ef7)",
        marginTop: "8px"
      }
    },
    (0, import_react9.createElement)(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px"
        }
      },
      (0, import_react9.createElement)(
        "strong",
        { style: { fontSize: "13px" } },
        `\u{1F3A8} \u4F60\u7684\u98CE\u683C\u7EBF\uFF08${list.length} \u6761\uFF1AAI \u5199\u6BCF\u4E00\u7AE0\u90FD\u7167\u7740\u529E\uFF09`
      ),
      (0, import_react9.createElement)(
        "button",
        { style: S.smallLink, onClick: onClose },
        "\u2715 \u6536\u8D77"
      )
    ),
    list.length === 0 ? (0, import_react9.createElement)(
      "p",
      { style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
      "\u8FD8\u6CA1\u6709\u98CE\u683C\u610F\u89C1\u3002"
    ) : list.map(
      (note, index) => (0, import_react9.createElement)(
        "div",
        {
          key: note.id,
          style: { margin: "6px 0", fontSize: "13px", lineHeight: 1.55 }
        },
        (0, import_react9.createElement)(
          "span",
          { style: { fontWeight: 600 } },
          `#${index + 1}`
        ),
        ` ${note.text ?? ""}`,
        note.note != null && note.note !== "" ? (0, import_react9.createElement)(
          "span",
          { style: { opacity: 0.6, fontSize: "12px" } },
          `\uFF08${note.note}\uFF09`
        ) : null
      )
    ),
    (0, import_react9.createElement)(
      "p",
      { style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
      "\u60F3\u518D\u8BB0\u4E00\u6761\uFF1F\u5728\u5BF9\u8BDD\u91CC\u76F4\u63A5\u8DDF AI \u8BF4\uFF0C\u5B83\u4F1A\u8BB0\u6210\u98CE\u683C\u7EBF\uFF1B\u5199\u6BCF\u4E00\u7AE0\u90FD\u7167\u7740\u529E\u3002"
    )
  );
}
function IntervenePanel(props) {
  const { items, onClose } = props;
  const list = items ?? [];
  return (0, import_react9.createElement)(
    "div",
    { style: { ...S.card, borderColor: "#e3b341", marginTop: "8px" } },
    (0, import_react9.createElement)(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px"
        }
      },
      (0, import_react9.createElement)(
        "strong",
        { style: { fontSize: "13px" } },
        `\u{1F4EE} \u4F60\u7684\u7559\u8A00\uFF08${list.length} \u6761\u5F85\u5904\u7406\uFF09`
      ),
      (0, import_react9.createElement)(
        "button",
        { style: S.smallLink, onClick: onClose },
        "\u2715 \u6536\u8D77"
      )
    ),
    list.length === 0 ? (0, import_react9.createElement)(
      "p",
      { style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
      "\u6CA1\u6709\u5F85\u5904\u7406\u7684\u7559\u8A00\u3002"
    ) : list.map(
      (item) => (0, import_react9.createElement)(
        "div",
        {
          key: item.id,
          style: { margin: "6px 0", fontSize: "13px", lineHeight: 1.55 }
        },
        (0, import_react9.createElement)(
          "span",
          { style: { opacity: 0.6, fontSize: "12px" } },
          formatTime(item.at)
        ),
        item.target != null && item.target !== "" ? (0, import_react9.createElement)(
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
        (0, import_react9.createElement)("div", null, item.text ?? "")
      )
    ),
    (0, import_react9.createElement)(
      "p",
      { style: { margin: "6px 0 0", fontSize: "12px", opacity: 0.7 } },
      "\u60F3\u7ED9 AI \u7559\u8A00\uFF1F\u5728\u5BF9\u8BDD\u91CC\u76F4\u63A5\u8DDF AI \u8BF4\uFF0C\u5B83\u4F1A\u8BB0\u6210\u7559\u8A00\uFF0C\u5230\u4E0B\u4E2A\u505C\u9760\u70B9\u5904\u7406\uFF08\u4E0D\u6253\u65AD\u5B83\u6B63\u5728\u5199\u7684\u7AE0\uFF09\u3002"
    )
  );
}
function PatternPanel(props) {
  const { patterns, busy, onAnalyze, onClose, result } = props;
  const [text, setText] = (0, import_react9.useState)("");
  const list = patterns ?? [];
  return (0, import_react9.createElement)(
    "div",
    {
      style: {
        ...S.card,
        borderColor: "var(--dsw-accent, #4f6ef7)",
        marginTop: "8px"
      }
    },
    (0, import_react9.createElement)(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px"
        }
      },
      (0, import_react9.createElement)(
        "strong",
        { style: { fontSize: "13px" } },
        "\u{1F9E9} \u81EA\u5B9A\u4E49\u6A21\u5F0F\u5E93"
      ),
      (0, import_react9.createElement)(
        "button",
        { style: S.smallLink, onClick: onClose },
        "\u2715 \u6536\u8D77"
      )
    ),
    (0, import_react9.createElement)(
      "p",
      {
        style: {
          margin: "6px 0",
          fontSize: "12px",
          opacity: 0.75,
          lineHeight: 1.6
        }
      },
      "\u7C98\u8D34\u4E00\u6BB5\u4F60\u60F3\u8981\u7684\u6559\u6CD5/\u7AE0\u8282\u7ED3\u6784\u63CF\u8FF0\uFF0CAI \u4F1A\u628A\u5B83\u63D0\u70BC\u6210\u4E00\u5F20\u300C\u6A21\u5F0F\u5361\u300D\u52A0\u5165\u8FD9\u672C\u4E66\u7684\u6A21\u5F0F\u5E93\uFF1B\u7B2C 2 \u6B21\u62CD\u677F\u300C\u6559\u5B66\u65B9\u6CD5\u4E0E\u677F\u5757\u300D\u548C\u5199\u4F5C\u89C4\u8303\u90FD\u4F1A\u4F18\u5148\u53C2\u8003\u5B83\u3002"
    ),
    (0, import_react9.createElement)("textarea", {
      style: { ...S.textarea, minHeight: "64px" },
      placeholder: "\u4F8B\uFF1A\u6BCF\u4E2A\u77E5\u8BC6\u70B9\u5148\u7ED9\u4E00\u4E2A\u751F\u6D3B\u4E2D\u7684\u771F\u5B9E\u573A\u666F\u5F15\u51FA\u6982\u5FF5\uFF0C\u518D\u914D\u4E00\u9053\u7531\u6D45\u5165\u6DF1\u7684\u4F8B\u9898\uFF0C\u6700\u540E\u653E\u4E00\u9053\u6613\u9519\u5224\u65AD\u9898\u2026\u2026",
      value: text,
      onChange: (e) => setText(e.target.value)
    }),
    (0, import_react9.createElement)(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "10px" } },
      (0, import_react9.createElement)(
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
      busy ? (0, import_react9.createElement)(
        "span",
        { style: { fontSize: "12px", opacity: 0.7 } },
        "AI \u5206\u6790\u4E2D\u2026"
      ) : null
    ),
    result !== null ? (0, import_react9.createElement)(
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
      (0, import_react9.createElement)(
        "strong",
        null,
        `\u2705 \u5DF2\u52A0\u5165\u6A21\u5F0F\u5E93\uFF1A${result.name ?? ""}`
      ),
      result.problem != null && result.problem !== "" ? (0, import_react9.createElement)(
        "p",
        { style: { margin: "4px 0 0" } },
        `\u89E3\u51B3\uFF1A${result.problem}`
      ) : null,
      result.blocks != null && result.blocks !== "" ? (0, import_react9.createElement)(
        "p",
        { style: { margin: "2px 0 0" } },
        `\u843D\u5730\uFF1A${result.blocks}`
      ) : null
    ) : null,
    (0, import_react9.createElement)(
      "p",
      { style: { margin: "8px 0 4px", fontSize: "12px", opacity: 0.7 } },
      list.length === 0 ? "\u8FD9\u672C\u4E66\u8FD8\u6CA1\u6709\u81EA\u5B9A\u4E49\u6A21\u5F0F\u3002" : `\u5DF2\u5728\u8FD9\u672C\u4E66\u7684\u6A21\u5F0F\u5E93\u91CC\uFF08${list.length} \u5F20\uFF09\uFF1A`
    ),
    list.map(
      (p, index) => (0, import_react9.createElement)(
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
var inject = ["slots", "sessions", "sidebarRight"];
function AutoOpenWorkbench(props) {
  const isTextbook = props.useSessions(
    (s) => s.byId[props.sessionId]?.projectionValues?.agentPreset
  ) === "textbook";
  const messageCount = deriveChatDeskNodes(props.useChat((s) => s)).length;
  const doneRef = (0, import_react10.useRef)(false);
  (0, import_react10.useEffect)(() => {
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
    (s) => s.byId[props.sessionId]?.projectionValues?.agentPreset ?? null
  );
  const session = props.sessionId;
  const cwd = props.useSessions((s) => s.byId[props.sessionId]?.cwd ?? null);
  const mainAiRunning = props.useSession((s) => s?.running === true);
  const sessionSummaries = props.useSessions((s) => s.byId);
  const subagentRuns = (0, import_react10.useMemo)(
    () => indexSubagentDescendants(sessionSummaries).get(session) ?? {
      count: 0,
      runningCount: 0
    },
    [sessionSummaries, session]
  );
  const [projects, setProjects] = (0, import_react10.useState)([]);
  const [activeId, setActiveId] = (0, import_react10.useState)(null);
  const [meta, setMeta] = (0, import_react10.useState)(null);
  const stall = deriveStallJudgment({
    mainAiRunning,
    subagentRunningCount: subagentRuns.runningCount,
    lastWriteAt: meta?.updatedAt
  });
  const [gate, setGate] = (0, import_react10.useState)(null);
  const [snapshots, setSnapshots] = (0, import_react10.useState)([]);
  const [events, setEvents] = (0, import_react10.useState)([]);
  const [error, setError] = (0, import_react10.useState)(null);
  const [busy, setBusy] = (0, import_react10.useState)(false);
  const [loading, setLoading] = (0, import_react10.useState)(true);
  const [showHistory, setShowHistory] = (0, import_react10.useState)(false);
  const [suggestions, setSuggestions] = (0, import_react10.useState)([]);
  const [suggestLoading, setSuggestLoading] = (0, import_react10.useState)(false);
  const [deletingId, setDeletingId] = (0, import_react10.useState)(null);
  const [mineruSet, setMineruSet] = (0, import_react10.useState)(true);
  const [mineruToken, setMineruToken] = (0, import_react10.useState)("");
  const [mineruResetOpen, setMineruResetOpen] = (0, import_react10.useState)(false);
  const [bookDir, setBookDir] = (0, import_react10.useState)(null);
  const [knowledgeMapText, setKnowledgeMapText] = (0, import_react10.useState)(null);
  const [workFiles, setWorkFiles] = (0, import_react10.useState)([]);
  const [workFilesReady, setWorkFilesReady] = (0, import_react10.useState)(false);
  const [pendingStageView, setPendingStageView] = (0, import_react10.useState)(null);
  const [pendingGateView, setPendingGateView] = (0, import_react10.useState)(null);
  const [pendingReviews, setPendingReviews] = (0, import_react10.useState)([]);
  const [exploreSummary, setExploreSummary] = (0, import_react10.useState)(null);
  const [chapterStatus, setChapterStatus] = (0, import_react10.useState)([]);
  const [goldDrafts, setGoldDrafts] = (0, import_react10.useState)([]);
  const [goldDraftVersion, setGoldDraftVersion] = (0, import_react10.useState)(1);
  const [gateOpen, setGateOpen] = (0, import_react10.useState)(null);
  const [viewPhase, setViewPhase] = (0, import_react10.useState)(null);
  const [showStylePanel, setShowStylePanel] = (0, import_react10.useState)(false);
  const [showIntervenePanel, setShowIntervenePanel] = (0, import_react10.useState)(false);
  const [patternOpen, setPatternOpen] = (0, import_react10.useState)(false);
  const [patternBusy, setPatternBusy] = (0, import_react10.useState)(false);
  const [patternResult, setPatternResult] = (0, import_react10.useState)(null);
  const [patternList, setPatternList] = (0, import_react10.useState)([]);
  const [deskHeight, setDeskHeight] = (0, import_react10.useState)(220);
  const [deskCollapsed, setDeskCollapsed] = (0, import_react10.useState)(true);
  const deskRef = (0, import_react10.useRef)(null);
  const deskLiveRef = (0, import_react10.useRef)(null);
  const rootRef = (0, import_react10.useRef)(null);
  const [rootH, setRootH] = (0, import_react10.useState)(null);
  (0, import_react10.useEffect)(() => {
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
            if (!(r.width > 0 && r.height > 0)) continue;
            if (r.top > rect.top && r.bottom > vh - 160 && r.bottom > maxBottom) {
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
  const [processSegs, setProcessSegs] = (0, import_react10.useState)([]);
  const [browsing, setBrowsing] = (0, import_react10.useState)(null);
  const [noteToast, setNoteToast] = (0, import_react10.useState)(false);
  const [awaitBanner, setAwaitBanner] = (0, import_react10.useState)(false);
  const [progressBanner, setProgressBanner] = (0, import_react10.useState)(false);
  const progressSeqRef = (0, import_react10.useRef)(-1);
  const activeRef = (0, import_react10.useRef)(null);
  const lastSeqRef = (0, import_react10.useRef)(-1);
  const eventsRef = (0, import_react10.useRef)([]);
  const awaitingSeenRef = (0, import_react10.useRef)(false);
  const sessionRef = (0, import_react10.useRef)(session);
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
    setKnowledgeMapText(
      typeof json.knowledgeMap === "string" ? json.knowledgeMap : null
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
      setWorkFilesReady(true);
    } catch {
    }
  }
  async function refreshProcess(projectId) {
    try {
      const json = await fetchJson(
        `/textbook/process?${sess()}&project=${encodeURIComponent(projectId)}`
      );
      setProcessSegs(json.segments ?? []);
    } catch {
    }
  }
  const openInSidebar = (rel) => {
    setError(null);
    try {
      props.openFileInSidebar(bookFileAddress(session, cwd, bookDir, rel));
    } catch (err) {
      setError(
        `\u6253\u5F00\u300C${artifactName(rel)}\u300D\u5931\u8D25\uFF1A${String(err instanceof Error ? err.message : err)}`
      );
    }
  };
  const viewWork = (file) => {
    if (workEntryAction(file?.path) === "sidebar") openInSidebar(file.path);
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
      setKnowledgeMapText(
        typeof json.knowledgeMap === "string" ? json.knowledgeMap : null
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
        setKnowledgeMapText(null);
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
  (0, import_react10.useEffect)(() => {
    let alive = true;
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
    setBrowsing(null);
    setLoading(true);
    (async () => {
      try {
        await loadProjects();
        if (activeRef.current !== null) await loadAll(activeRef.current);
      } catch (err) {
        if (alive) setError(String(err instanceof Error ? err.message : err));
      } finally {
        if (alive) setLoading(false);
      }
      try {
        const settings = await fetchJson("/textbook/settings");
        if (alive) setMineruSet(settings.settings?.mineruTokenSet === true);
      } catch {
      }
    })();
    return () => {
      alive = false;
    };
  }, [session]);
  (0, import_react10.useEffect)(() => {
    const timer = setInterval(() => {
      void poll();
    }, 2e3);
    return () => clearInterval(timer);
  }, [session]);
  (0, import_react10.useEffect)(() => {
    if (!noteToast) return void 0;
    const timer = setTimeout(() => setNoteToast(false), 6e3);
    return () => clearTimeout(timer);
  }, [noteToast]);
  (0, import_react10.useEffect)(() => {
    const st = meta?.status;
    const awaiting = typeof st === "string" && st.startsWith("awaiting-") || gate !== null && gate.status === "awaiting";
    if (shouldForceBackToNow(awaitingSeenRef.current, awaiting, browsing !== null)) {
      setBrowsing(null);
      setAwaitBanner(true);
    }
    awaitingSeenRef.current = awaiting;
  }, [meta?.status, browsing, gate]);
  (0, import_react10.useEffect)(() => {
    if (browsing === null) return void 0;
    const lastProgress = [...events].reverse().find((e) => e.type === "textbook/progress");
    if (lastProgress !== void 0 && lastProgress.seq > progressSeqRef.current) {
      progressSeqRef.current = lastProgress.seq;
      setProgressBanner(true);
    }
    return void 0;
  }, [events, browsing]);
  (0, import_react10.useEffect)(() => {
    if (!awaitBanner) return void 0;
    const timer = setTimeout(() => setAwaitBanner(false), 6e3);
    return () => clearTimeout(timer);
  }, [awaitBanner]);
  (0, import_react10.useEffect)(() => {
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
  const previewBook = () => {
    openInSidebar("work/book.md");
  };
  const lastEvent = events.length > 0 ? events[events.length - 1] : null;
  const qualityEvent = [...events].reverse().find((event) => event.type === "textbook/quality");
  const checks = qualityEvent?.data?.checks ?? [];
  const aiReportEvent = [...events].reverse().find((event) => event.type === "textbook/ai-report");
  const aiReport = aiReportEvent?.data?.report ?? null;
  const progressDetail = stageScopedProgressDetail(events);
  const pendingStageLabel = pendingStageView === "gate" ? gateHuman(pendingGateView ?? "?") : stageHuman(pendingStageView);
  const humanTurn = meta !== null && (meta.status === "awaiting-explore" || meta.status === "awaiting-outline" || meta.status === "awaiting-gold" || meta.status === "awaiting-chapters-review" || meta.status === "awaiting-final-approval" || gate !== null && gate.status === "awaiting" || meta.phase === 1 && gate === null);
  const needsConfigText = lastEvent?.type === "textbook/error" ? `${lastEvent.data?.task ?? ""}\u5931\u8D25\uFF1A${lastEvent.data?.message ?? ""}` : '\u8BF7\u5148\u914D\u7F6E\u5927\u6A21\u578B\u63A5\u53E3\uFF08\u53F3\u4E0A\u89D2\u8BBE\u7F6E \u2192 \u6A21\u578B\uFF09\uFF0C\u914D\u597D\u540E\u70B9"\u7EE7\u7EED"\u3002';
  const openableCountByPhase = (() => {
    const counts = {};
    for (const seg of processSegs ?? []) {
      const phase = phaseOfSegment(seg);
      if (phase === null) continue;
      counts[phase] = (counts[phase] ?? 0) + openableArtifacts(seg, workFiles).length;
    }
    return counts;
  })();
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
    if (meta === null) {
      return loading ? (0, import_react10.createElement)(
        "p",
        { style: { ...S.hint, padding: "16px" } },
        "\u6B63\u5728\u6253\u5F00\u8FD9\u672C\u4E66\u2026"
      ) : null;
    }
  }
  const topBar = meta !== null && !loading ? (0, import_react10.createElement)(TopBar, {
    meta,
    openStylePanel,
    openIntervene,
    pause,
    resume
  }) : null;
  const simpleContent = (0, import_react10.createElement)(
    "div",
    { style: S.container },
    (0, import_react10.createElement)("p", { style: S.title }, "\u9020\u4E66\u5DE5\u4F5C\u53F0"),
    (0, import_react10.createElement)(
      "p",
      { style: S.hint },
      // 第一屏判读（2026-09-20）：原文是「本会话独立使用，一个会话只造一本书。主 AI 统筹
      // 推进流水线（亲自做或派小助手分头干），轮到你要拍板/确认时亮起 ⚡；每个拍板点都
      // 自动存档，随时能改。」——陌生人打开第一屏先读到的是系统实现（主 AI/流水线/派小助手
      // 分头干），不是"要我干什么"。压成两句话。
      // 票 14（承诺账 B「随时前置」）：定过的决定都存着，但**改**有两条硬前置——
      // 运行中或有待办时后端一律 409（「我正在做；要改历史请先等交工（或先 ⏸ 暂停）」），
      // 演示书也不支持定点修改。文案把出路直接说给用户。
      "\u4E00\u4E2A\u4F1A\u8BDD\u9020\u4E00\u672C\u4E66\u3002\u8F6E\u5230\u4F60\u6765\u5B9A\u7684\u65F6\u5019\uFF0C\u754C\u9762\u4F1A\u4EAE \u26A1 \u63D0\u9192\u4F60\uFF1B\u5B9A\u8FC7\u7684\u90FD\u5B58\u7740\uFF0C\u7B49 AI \u505C\u624B\uFF08\u6216\u4F60\u5148\u70B9 \u23F8 \u6682\u505C\uFF09\u5C31\u80FD\u6539\u3002"
    ),
    (0, import_react10.createElement)(MineruTokenCard, {
      mineruSet,
      mineruToken,
      busy,
      onTokenChange: (e) => setMineruToken(e.target.value),
      onSave: saveMineruToken,
      resetOpen: mineruResetOpen,
      onToggleReset: () => setMineruResetOpen((v) => !v)
    }),
    error !== null ? (0, import_react10.createElement)("p", { style: S.error }, `\u26A0\uFE0F ${error}`) : null,
    loading ? (0, import_react10.createElement)("p", { style: S.hint }, "\u52A0\u8F7D\u4E2D\u2026") : showWizardForm ? (0, import_react10.createElement)(WizardCard, {
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
  const onPickStep = (key) => {
    setBrowsing(key);
    setViewPhase(null);
    const lastProgress = [...eventsRef.current].reverse().find((e) => e.type === "textbook/progress");
    progressSeqRef.current = lastProgress?.seq ?? -1;
    setProgressBanner(false);
  };
  const onPickPhase = (n) => {
    setViewPhase(n);
    setBrowsing(null);
  };
  const browsingStep = browsing === null ? null : stepsOf({ segments: processSegs, meta }).find((step) => step.key === browsing) ?? null;
  const viewPhaseOfBrowsing = browsingStep?.phase ?? phaseOfSegment((processSegs ?? []).find((seg) => seg.key === browsing) ?? null) ?? (meta?.phase ?? 1);
  const phaseBarSelect = (n) => {
    setViewPhase(n === (meta.phase ?? 1) ? null : n);
    setBrowsing(null);
  };
  const projectView = () => (0, import_react10.createElement)(
    "div",
    { style: { display: "flex", flex: 1, minHeight: 0, overflow: "hidden" } },
    (0, import_react10.createElement)(
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
      // ── 焦点区 ──────────────────────────────────────────────────────
      (0, import_react10.createElement)(
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
            padding: "12px 16px"
          }
        },
        // 全览条：全书几步、还剩几步、现在在第几阶段 + 展开清单（收起时不渲染清单内容）。
        // 只在「现在」那一屏出现——回看某一步时，用户手里已经有那一步了，
        // 再顶一条全览是把"手里的东西"往下挤（展开体会往下顶，别顶两份）。
        // 2026-09-24 票 04：抬头按**步**数，所以要把 `meta` 一并给它（步的口径在
        // `view-rules.stepsOf` / `stepCount`，界面不自己数）。
        browsing === null && viewPhase === null ? (0, import_react10.createElement)(ProgressOverview, {
          segments: processSegs,
          meta,
          browsingKey: browsing,
          viewedPhase: viewPhase,
          currentPhase: meta.phase ?? 1,
          onPickStep,
          onPickPhase
        }) : null,
        // 自动跟随横幅（F5 方案 A）：等拍板强制回「现在」（6 秒自清）；浏览历史时 AI 有新进展（点击清浏览回现在）。
        awaitBanner ? (0, import_react10.createElement)(AutoFollowAwaitNote, {
          onClose: () => setAwaitBanner(false)
        }) : null,
        progressBanner && browsing !== null ? (0, import_react10.createElement)(AutoFollowProgressNote, {
          onJump: () => {
            setBrowsing(null);
            setProgressBanner(false);
          },
          onDismiss: () => setProgressBanner(false)
        }) : null,
        // 不打断提示条（F17）：铺章中提交风格线/留言/意见成功后，焦点区顶部滑入、6 秒自清。
        noteToast ? (0, import_react10.createElement)(InterruptNote, {
          onClose: () => setNoteToast(false)
        }) : null,
        // 业务头（原 workbenchContent 头部迁入焦点区顶）：书名/取消书、MinerU、错误。
        (0, import_react10.createElement)(
          "div",
          {
            style: {
              display: "flex",
              gap: "10px",
              alignItems: "center",
              marginBottom: "10px"
            }
          },
          (0, import_react10.createElement)(
            "strong",
            { style: { fontSize: "15px" } },
            `\u{1F4D6} ${meta.name ?? activeId}`
          ),
          // 「取消这本书」不在主视野里（2026-09-20 用户拍板：破坏性操作别抢眼）；
          // 2026-09-21 左栏删掉后它搬到焦点区底部的常驻小条（FocusFooter）。
          (0, import_react10.createElement)(
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
        mineruSet === false ? (0, import_react10.createElement)(MineruTokenCard, {
          mineruSet,
          mineruToken,
          busy,
          onTokenChange: (e) => setMineruToken(e.target.value),
          onSave: saveMineruToken,
          resetOpen: mineruResetOpen,
          onToggleReset: () => setMineruResetOpen((v) => !v)
        }) : null,
        error !== null ? (0, import_react10.createElement)("p", { style: S.error }, `\u26A0\uFE0F ${error}`) : null,
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
        (0, import_react10.createElement)(PhaseBar, {
          phase: meta.phase ?? 1,
          gate,
          status: meta.status,
          humanTurn,
          // 被看的那一步所属的阶段（描边标记），与"当前阶段"那一格是**两件事**、不许混：
          // 浏览态取 `viewPhaseOfBrowsing`（点的是全览条里的一步），阶段页态取 `viewPhase`
          // （点的是阶段片一格）；在"现在"两侧都为空 → 不描任何格（2026-09-22 票 12 裁决 4）。
          viewed: browsing != null ? viewPhaseOfBrowsing : viewPhase !== null ? viewPhase : null,
          artifactCountOf: (n) => openableCountByPhase[n] ?? 0,
          onSelect: phaseBarSelect
        }),
        // 阶段页（全览条点一步落到这里；「回到现在」由那排常驻的阶段片承担——票 12 已裁，
        // 入口不随看点深浅消失，spec 不变量 13）。**排在阶段片之后**：理由与实测数字见上面
        // 阶段片那一块（顺序即位置）——两路互斥，但两路都吃同一条顺序。
        // 2026-09-21（用户第 5 条：「这个界面是不是不再必要了，可以直接复用现在的回看页面」）：
        // **不再渲染另一套单卡**，改成复用阶段页那一页、并把焦点定在选中的
        // 那一步——步清单点一步与顶栏点一格从此落到同一种卡。
        browsing != null ? (0, import_react10.createElement)(PhasePage, {
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
          },
          // 撤销入口（10 分钟窗）在阶段页页脚；它归「刚才那一次定点修改」。
          // 票 11 复核：这一下同样**不换屏**——撤销也是阶段页上的入口按钮，替用户换屏
          // 是同一处违规；撤销后那一行由下一份 `/textbook/process` 还原成真实状态。
          onDeepUndo: () => {
            void postAction({ action: "deep-undo" });
          }
        }) : null,
        // 顶栏 🎨 风格线 / 📮 留言 展开面板（Task 17 常驻入口；点开即见清单，再点或 ✕ 收起）。
        // 它们也算「内容」：一律排在阶段片之后——开一个面板不该把常驻导航面顶下去
        // （票 phase-bar-position/01 顺手把这条顺序收拢；面板的高度不受控，尤其模式库那张）。
        showStylePanel ? (0, import_react10.createElement)(StylePanel, {
          notes: styleNotes,
          onClose: () => setShowStylePanel(false)
        }) : null,
        showIntervenePanel ? (0, import_react10.createElement)(IntervenePanel, {
          items: pendingIvs,
          onClose: () => setShowIntervenePanel(false)
        }) : null,
        // 🧩 自定义模式库面板（2026-08-21）：粘贴描述 → AI 分析成「模式卡」加入本书。
        patternOpen ? (0, import_react10.createElement)(PatternPanel, {
          patterns: patternList,
          busy: patternBusy,
          result: patternResult,
          onAnalyze: analyzePattern,
          onClose: () => setPatternOpen(false)
        }) : null,
        // 阶段页：这一步走到哪、这一阶段有哪几步、每一步产出了哪些文件。
        // 产物一律由卡片里写着「打开」的按钮交给右栏（导航本身不开文件）。
        viewPhase !== null ? (0, import_react10.createElement)(PhasePage, {
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
          }
        }) : null,
        // 状态条：spec 不变量 10——回看时不摆"现在"的内容（状态条 / 活性行 /「现在」主卡
        // 一律收起）。2026-09-22 票 03：旧门控只看 `viewPhase`，于是**浏览态**
        // （`browsing` 非空，全览条点一步进来）下状态条还在渲染——补上这一半。
        viewPhase === null && browsing === null ? (0, import_react10.createElement)(StatusStrip, {
          meta,
          gate,
          pendingStage: pendingStageView,
          progressDetail,
          metaLabel: pendingStageLabel,
          // 批 1：把「轮到谁」的唯一真值交给状态条，避免横幅与阶段片各说一套。
          humanTurn
        }) : null,
        // 主 AI 活性行（F17）：常驻一行——「🤖 我正在做」/ 好一会儿没动静了 [🔁 从断点继续] /
        // 「⚡ 轮到你」。票 stale-detection/01 起它是这一屏**唯一**的停顿出口（状态卡那张
        // 黄色警告框已撤），判定与措辞都归 `src/ui/rules.js` + `src/ui/panels.js`。
        // 阶段页与分段回看都是"回看/前瞻"，不摆"现在"的活性（它和这一步的历史无关）——
        // 用户原话「回看时不要再展示当前步骤的内容」。spec 不变量 10 把状态条、活性行与
        // 「现在」主卡并列为"浏览态一律收起"的三样（2026-09-22 票 03 复核：这里的门控
        // 本来就带 `browsing === null`，与状态条那处不一致的写法一并统一）。
        viewPhase === null && browsing === null ? (0, import_react10.createElement)(ActivityLine, {
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
          subagents: subagentRuns
        }) : null,
        // 「现在」那张主卡只属于现场：在看某一阶段的页面时，页面自己交代
        // "这一步的书夹产物在哪"，别再叠一张能操作的卡进去
        // （2026-09-21 用户裁决：回看页只读，能改结果的动作只出现在「现在」）。
        viewPhase !== null || browsing !== null ? null : (() => {
          switch (focusCardKey(meta, gate)) {
            case "gate":
              return (0, import_react10.createElement)(GatePanel, {
                gate,
                onDecide: decide,
                onRollback: rollback,
                busy,
                error: null,
                onAddPattern: analyzePattern
              });
            case "explore":
              return (0, import_react10.createElement)(ExploreConfirmCard, {
                meta,
                exploreSummary,
                // 知识地图（机器产物）原文：卡片内联人读清单用它，不再走文件接口。
                knowledgeMapText,
                project: activeId,
                session: sessionRef.current,
                onConfirm: confirmExplore,
                onViewReport: () => viewWork({ path: "work/explore.md", label: "\u8BFB\u6750\u6599\u62A5\u544A" }),
                busy
              });
            case "outline":
              return (0, import_react10.createElement)(OutlineConfirmCard, {
                meta,
                busy,
                onConfirm: confirmOutline
              });
            case "gold":
              return (0, import_react10.createElement)(GoldTable, {
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
              return (0, import_react10.createElement)(FinalApprovalCard, {
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
                }
              });
            case "delivered":
              return (0, import_react10.createElement)(DeliveryCard, {
                project: activeId,
                session: sessionRef.current,
                checks,
                onPreview: previewBook,
                busy,
                meta,
                aiReport,
                styleNotes: meta.styleNotes
                // 风格线落实清单：从 meta 传入，内部 ?? [] 兜底（旧账本无此字段）
              });
            case "chapters":
              return (0, import_react10.createElement)(ChaptersCard, {
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
              return (0, import_react10.createElement)(UploadArea, {
                sources: meta.sources ?? [],
                converting: meta.converting === true,
                onUpload: uploadSource,
                onConvert: convert,
                onIdentify: identifyRoles,
                busy
              });
            default:
              return (0, import_react10.createElement)(StatusCard, {
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
                deletingId: deletingId === activeId
              });
          }
        })(),
        // 「之前的过程」是现场的账本回放（与"我正在看哪一步"无关），阶段页上不摆它。
        viewPhase === null ? (0, import_react10.createElement)(
          "div",
          { style: { margin: "8px 0" } },
          (0, import_react10.createElement)(
            "button",
            {
              style: S.smallLink,
              onClick: () => setShowHistory(!showHistory)
            },
            showHistory ? "\u25BE \u6536\u8D77\u4E4B\u524D\u7684\u8FC7\u7A0B" : "\u25B8 \u4E4B\u524D\u7684\u8FC7\u7A0B\uFF08\u70B9\u5F00\u53EF\u56DE\u653E\u62BD\u67E5\uFF09"
          )
        ) : null,
        viewPhase === null && showHistory ? events.map((event) => {
          const product = workPathForEvent(event, meta, workFiles);
          const blocked = workFilesReady && workEntryForEvent(event, meta, workFiles).kind === "blocked";
          const isGate = event.type === "textbook/gate-proposal";
          const rowKey = `${event.seq}::${event.type}::${event.time}`;
          const detailOpen = gateOpen === rowKey;
          return (0, import_react10.createElement)(
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
            (0, import_react10.createElement)(
              "div",
              null,
              (0, import_react10.createElement)("span", null, cardIcon(event)),
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
              (0, import_react10.createElement)(
                "strong",
                null,
                eventHuman(event.type, EVENT_META[event.type]?.label ?? "")
              ),
              // 票 07（`event-row-entries/spec.md` 决策 7；`workbench-transitions/spec.md`
              // 不变量 2）：拍板提案行的**纯展开**控件——行内第一颗真按钮，只干一件事
              // （改展开态），**不发动作、不开右栏**。它与同行的「打开」是"两个控件、
              // 各一个身份"（整块热区里嵌行内控件合法），不是"同一热区两个身份"。
              // 必须是真 `<button>` 且文字挂在**第一个文本子节点**上：按文本找按钮的
              // 辅助件只认这个形状（`assertion-plan.md` §2「findButton」）。
              isGate ? (0, import_react10.createElement)(
                "button",
                {
                  style: { ...S.smallLink, marginLeft: "10px" },
                  onClick: () => setGateOpen(detailOpen ? null : rowKey),
                  // 悬浮提示只说这颗控件干的那一件事（不变量 12：文案不承诺没有
                  // 机制的）——说「详情」不说「全文」：这里渲染的是账本事件带的
                  // `summary`/`detail`，与关卡卡「展开完整方案」同一份字。
                  title: detailOpen ? "\u6536\u8D77\u8FD9\u4EFD\u63D0\u6848\u7684\u8BE6\u60C5" : "\u5C31\u5730\u5C55\u5F00\u8FD9\u4EFD\u63D0\u6848\u7684\u8BE6\u60C5\uFF08\u4E0D\u6253\u5F00\u53F3\u680F\uFF09"
                },
                detailOpen ? "\u25BE \u6536\u8D77" : "\u25B8 \u63D0\u6848\u8BE6\u60C5"
              ) : null,
              product !== null ? (0, import_react10.createElement)(OpenArtifactButton, {
                // 票 02 导出的同一颗按钮（spec 决策 9：不新造控件）。
                // 名字取**客户端按路径判**的 `artifactName`（票 05）：不读服务端
                // label、不把路径原文摆上屏；悬浮提示同源——按钮内部自己按
                // `artifactName(item.path)` 拼（票 06 第 5 条：不另造第二套提示语）。
                item: product,
                label: `${artifactName(product.path)} \u6253\u5F00`,
                // 只开这一个：交给既有收口 `viewWork`（产物判据 → DSH 右栏），
                // 不在事件行里另写第二条打开路径。
                onOpen: () => viewWork(product)
              }) : blocked ? (
                // 票 08（决策 8）：**灰字，不是灰按钮**。三条理由（spec 原文）：
                // ①不可点的控件摆进可点那一列会撞不变量 2 的「同一排可点性一致」；
                // ②它要给**还不存在的产物**起名字，与「产物名」口径别扭；
                // ③真账本上这事只发生在一本书、而且是同一对控件重复 195 次。
                // `<span>` 不是 `<button>`＝不进热区、不参与点击、不发动作。
                (0, import_react10.createElement)("span", { style: S.hint }, "\u7ED3\u679C\u8FD8\u6CA1\u751F\u6210")
              ) : null,
              (0, import_react10.createElement)(
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
            isGate ? detailOpen ? (0, import_react10.createElement)(
              "div",
              {
                style: {
                  marginTop: "6px",
                  fontSize: "12px",
                  opacity: 0.9
                }
              },
              (0, import_react10.createElement)(
                "p",
                { style: { margin: "0 0 4px" } },
                event.data?.summary ?? ""
              ),
              (event.data?.detail ?? "") !== "" ? (0, import_react10.createElement)(
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
            ) : (event.data?.summary ?? "") !== "" ? (0, import_react10.createElement)(
              "div",
              { style: { marginTop: "6px", opacity: 0.85 } },
              event.data.summary
            ) : null : null
          );
        }) : null,
        // 「📄 第一步 · 材料准备」那张抽屉已并入阶段页（点阶段片第 1 格 ＝ 那一步的页面，
        // 摆材料清单与转换状态）；现场的上传卡仍在（当前阶段那格＝回到现在）。
        // 抽屉的唯一入口正是阶段片第 1 格，入口改道后它成了不可达的死代码，故删除。
        // 底部常驻小条：书的进度 / 书文件夹 / 取消这本书。
        // 2026-09-21 用户裁决「左栏不再要了」——这四样原来挂在左栏底部，
        // 它们跟造书的步骤无关，搬成焦点区底部一条小条（见 FocusFooter）。
        (0, import_react10.createElement)(FocusFooter, {
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
          onCancelDelete: () => setDeletingId(null)
        })
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
      (0, import_react10.createElement)(SocratopiaAd),
      // 下：对话台（右下镜像宿主对话；分界可拖）。焦点区在它上面独立滚动。
      // ⚠️ 2026-09-21 用户裁决：「展开对话台」不再需要——要对话去官方的「对话」页签。
      // 收起态（默认）整块**不渲染**（原来是一条 32px 的入口条）；展开态仍渲染对话台本体，
      // 谁把它展开没有变（宿主的自动展开逻辑仍在）。
      deskCollapsed ? null : (0, import_react10.createElement)(
        "div",
        {
          ref: deskRef,
          style: {
            height: `${deskLiveRef.current ?? deskHeight}px`,
            flexShrink: 0,
            borderTop: "1px solid var(--dsw-border, #d0d7de)",
            position: "relative"
          }
        },
        (0, import_react10.createElement)("div", {
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
        (0, import_react10.createElement)(ChatDesk, {
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
  return (0, import_react10.createElement)(
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
    meta !== null && !loading ? projectView() : (0, import_react10.createElement)(
      "div",
      { style: { flex: 1, minHeight: 0, overflow: "auto" } },
      simpleContent
    )
  );
}
function apply(ctx) {
  const openFileInSidebar = (address) => {
    ctx.sidebarRight.openResource(address, { revealIfOpened: true });
  };
  ctx.slots.inject("conversation.view", () => {
    let disposer = null;
    let probedSession = null;
    let hasBook = false;
    const sync = () => {
      const snap = ctx.sessions.list.getSnapshot();
      const current = snap.byId?.[snap.current];
      const id = snap.current ?? null;
      const isTextbook = current?.projectionValues?.agentPreset === "textbook";
      const show = isTextbook || id !== null && id === probedSession && hasBook;
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
      if (!isTextbook && id !== null && id !== probedSession) {
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
    "[ui-textbook-run] \u5DE5\u4F5C\u53F0\u89C6\u56FE\u5DF2\u6CE8\u518C\uFF08\u5168\u89C8\u6761 + \u9636\u6BB5\u9875 + \u5BF9\u8BDD\u53F0 + \u81EA\u52A8\u6253\u5F00\uFF09"
  );
}
return module.exports; } });
