/**
 * 造书工作台 · 领域规则单一事实来源
 *
 * 前后端共享的领域常量与纯推导函数：素材角色、范例章、六阶段、账本事件类型。
 * 双端约束（架构评审候选 3 敲定）：本文件被 esbuild 打进前端 bundle
 * （入口 src/client-entry.js），也被 node ESM 后端直接 import——
 * 必须保持零 node 内置依赖、零 react 依赖、零第三方依赖；
 * 只放「两侧都必须知道」的规则，单侧展示文案（进度条短标签等）不进这里。
 * 术语见 CONTEXT.md（素材角色 / 范例章 / 金标准）。
 *
 * 2026-09-01 增补（架构评审候选 1 拍板）：EVENT_META 是「账本事件的双端含义表」
 * （label/emoji/announce 沉默策略）——账本事件双端都要渲染（后端过程记录与播报、
 * 前端账本列表），属于两侧共有知识，故入本文件；各端自己的句子行文
 * （logEntryText / announceText / cardText 各自的措辞与冗长）仍是单侧展示，不进这里。
 */

// ── 书夹形状 · 段名常量（票 `context-budget/10` 落 · 票 `13` 改名 · ADR-0031 决策 1）──
//
// ✅ **双轨命名已经结束**（票 `context-budget/13` · spec 实现决策 24–26）：
// 阶段一（票 `10`／`11`／`12`）代码里的字面名是旧英文名、文档写目标名；票 `13` 把**字面名**
// 一并改成目标名，于是下面这些常量就是**书夹当前形状的唯一一份**——文档、判据、模板、派发文案
// 逐字写的都是它们拼出来的形状。四个旧段名的**逐字清单**在 ADR-0031 的「改名补记」与
// 票 `13` 的落地记录里（**本文件刻意不重写一遍**：重写一遍就是第二份会漂的清单）；
// 旧形状的**唯一例外**是下面「老段名」那一组常量（读侧兼容**必须**逐字认得它们），
// `test-book-dir-rename.mjs` 逐条点名这三块记账区，块数被钉死；
// 再一个例外是 `skill/SKILL-APPENDIX.md`（上游 skill 侧、不在本仓维护面，见票 13 落地记录）。
//
// ⚠️ **老书读侧兜底**（票 `context-budget/13` 的有意取舍**已被维护者推翻**，见下面「老段名」一段）：
// 改名只对**新书**生效（**写侧永远用新名**），但**读侧认得老名**——老书照常打开，
// **不做一次性搬迁**（spec「范围外」明写「不做一次性搬迁」）。
//
// 段名住在**这个**纯模块（不是 `engine/paths.js`）是因为它两侧都要知道：
// 后端用它拼路径（`paths.js`），前端用它按路径形状分类产物（`productOpenMode`）。
// 「一个名字一处来源」——写成第二份就是 `test-artifact-path.mjs` 治的那个病。

/** 工作区目录名（书夹形状轴之一；票 `13` 由旧英文名改成这个）。 */
export const WORK_DIR_NAME = "工作区";
/** 方案目录名（拍板方案；**工作区下的子目录**；票 `13` 从书夹根下平级的一层搬进来）。 */
export const PROPOSAL_DIR_NAME = "方案";
/** 过程目录名（账本登记与关键节点存档；阶段一由票 `10` 新建，票 `13` 把存档搬进来）。 */
export const PROCESS_DIR_NAME = "过程";
/** 存档目录名（回退快照与定点修改存档；票 `13` 从书夹根下平级的一层搬进 `过程/`）。 */
export const ARCHIVE_DIR_NAME = "存档";
/** 材料目录名（原件与转换稿分列其下；票 `13` 只把转换稿搬进来，原件仍在根下平级的 `sources/`——
 *  `sources/` → `材料/原件/` 归票 `14`，本票一件都不许做）。 */
export const MATERIAL_DIR_NAME = "材料";
/** 转换稿目录名（由原件转出的 Markdown；票 `13` 从书夹根下平级的一层搬进 `材料/`）。 */
export const CONVERTED_DIR_NAME = "转换稿";
/** 产物清单文件名：**应当有什么**（建档时探形状生成、书内只读）。 */
export const MANIFEST_FILE_NAME = "产物清单.json";

/**
 * 逐章审计读数（`工作区/审计读数.json`）——**机器**从各章 `audit-NN.md` 现算后落盘的快照。
 *
 * 票 `audit-gate-semantics/01`：审计产物必须给出可复算的读数行
 * `{errors_open, warnings_open, fixed, accepted}`，并进 `产物清单.json`（本常量是路径的单一出处，
 * 清单那一行按它派生）。⚠️ 它是**派生的读数**，不是审计结论本身：闸门每次都从 `audit-NN.md`
 * 现算，⛔ 不拿这份快照当判据（过期快照不许把红的说成绿的）。
 * ⚠️ 必须定义在 `BOOK_PRODUCT_FAMILIES` 之前：那一族的 `path` 直接取本常量（ESM 的 TDZ）。
 */
export const AUDIT_READINGS_FILE_NAME = "审计读数.json";
export const AUDIT_READINGS_REL = `工作区/${AUDIT_READINGS_FILE_NAME}`;

/** 登记文件名：**实际有什么**（机器每次扫盘写回）。 */
export const REGISTRY_FILE_NAME = "登记.json";
/** 细目目录名：小助手产的全文细目（票 `11` 接线落盘）。 */
export const DETAIL_DIR_NAME = "细目";
/** 章正文分片目录名（票 `walkthrough-2026-10/02`：子助手**只落分片**，`工作区/chapter-NN.md` 由机器拼）。 */
export const CHAPTER_SHARD_DIR_NAME = "分片";
/** 报告目录名：审计与检查报告（票 `11`／`12` 接线落盘）。 */
export const REPORT_DIR_NAME = "报告";
/**
 * 那份**人的裁决产物**的文件名（票 `knowledge-graph-build/09`；⛔ 与 `工作区/knowledge-map.json`
 * 分家：机器重拼会冲掉合并件里的任何手写标记）。口径与判据住在下面「被剔除的知识点」那一节；
 * 常量放这里是因为 {@link SWEEP_EXCLUDED} 在模块初始化时就要引用它。
 */
export const KNOWLEDGE_MAP_EXCLUSIONS_FILE_NAME = "knowledge-map-exclusions.json";
/** 那份人产物的**书夹相对**路径（唯一出处；⛔ 别在别处手拼第二份）。 */
export const KNOWLEDGE_MAP_EXCLUSIONS_REL = `${WORK_DIR_NAME}/${KNOWLEDGE_MAP_EXCLUSIONS_FILE_NAME}`;

// ── 材料判定产物：「应当有什么」在模块初始化时就要引用它（`BOOK_PRODUCT_FAMILIES`）──────
//
// ⚠️ **常量放这里、判据留在下面「材料判定」那一节**：本表（`BOOK_PRODUCT_FAMILIES`）在模块初始化
// 时就要拼那一族的 `path`，而 `const` 有 TDZ ⇒ 常量必须先于那张表定义（与
// `KNOWLEDGE_MAP_EXCLUSIONS_REL`／`DECISION_DIR_REL` 同一条理由）。判定那一半的注释与口径
// 仍住在 `materialJudgmentProblems()` 上方，⛔ 不在这里复述第二份。
/** 判定产物的基名（`工作区/材料判定.json`）——**判定小助手是它唯一的写入者**。 */
export const MATERIAL_JUDGMENT_NAME = "材料判定.json";
/** 与 {@link MATERIAL_JUDGMENT_NAME} 同一份契约的书夹相对形（`工作区/材料判定.json`）。 */
export const MATERIAL_JUDGMENT_REL = `${WORK_DIR_NAME}/${MATERIAL_JUDGMENT_NAME}`;

// ── 读者情况问卷（票 `reader-cognition-boundary-build/03`）────────────────────
//
// 一次异步往返的两个落点，都在 `工作区/` 根下（与 `style-line.md` 同一层）：
// · **问卷件**＝「给出那一份」在盘上的副本（服务端动作写件 → 造书用户经通用下载路由交给收卷人）；
// · **回卷件**＝造书用户从收卷人那里**手粘回来**的原文（⛔ 不是从材料上传通道进来的，也⛔ 不是
//   从 `note` 那种 200–500 字字段收的——那样会**静默截断**）。
//
// ⚠️ 两份都是**可选动作**的产物：没发过卷的书本来就不该有它们。所以它们**不进**
// `BOOK_PRODUCT_FAMILIES`（「应当有什么」），而是进 `SWEEP_EXCLUDED`（扫盘排除表）——
// 声明进「应当有什么」会给每一本新书凭空多一条**恒缺件**（同 `knowledge-map-exclusions.json`
// 那一行的理由）；不排掉又会让盘上真多出来的这两份以「多件」身份把形状对账**永远弄红**。
// 它们**不是第二份事实源**：问卷件只是给出那一刻的抄本，回卷件是人的输入原文（下游由 AI 逐条读、
// 代笔落剔除记录，归票 `06`），形状判据见 `src/workflow/reader-questionnaire.js`。
/** 「给出那一份」的文件名（书夹 `工作区/` 下）。 */
export const READER_QUESTIONNAIRE_ISSUED_FILE_NAME = "读者情况问卷.md";
/** 回卷件的文件名（书夹 `工作区/` 下）。 */
export const READER_QUESTIONNAIRE_RETURNED_FILE_NAME = "读者情况回卷.md";
/** 「给出那一份」的**书夹相对**路径（唯一出处；动作回包/下载/判据都引它）。 */
export const READER_QUESTIONNAIRE_ISSUED_REL = `${WORK_DIR_NAME}/${READER_QUESTIONNAIRE_ISSUED_FILE_NAME}`;
/** 回卷件的**书夹相对**路径（唯一出处；形状判据与下游代笔都引它）。 */
export const READER_QUESTIONNAIRE_RETURNED_REL = `${WORK_DIR_NAME}/${READER_QUESTIONNAIRE_RETURNED_FILE_NAME}`;

/**
 * 结论件（每个确认点一份「站结论」）所在的那一层目录名（票 `confirm-points-redesign-build/01`）。
 * ⛔ **不拿主题当文件名**——主题名已经改过一次（给谁用 → 这本书怎么学），站号才稳。
 * 常量放这里是因为 {@link SWEEP_EXCLUDED} 在模块初始化时就要引用它（与上面那份人产物同一条理由）。
 */
export const DECISION_DIR_NAME = "决策";
/** 结论件目录的**书夹相对**路径（唯一出处；⛔ 别在别处手拼第二份）。 */
export const DECISION_DIR_REL = `${WORK_DIR_NAME}/${DECISION_DIR_NAME}`;

/** 方案目录的**书夹相对**形状（`工作区/方案`）——正则／账本 `data.path`／模板都引它。 */
export const PROPOSAL_DIR_REL = `${WORK_DIR_NAME}/${PROPOSAL_DIR_NAME}`;
/** 存档目录的**书夹相对**形状（`过程/存档`）。 */
export const ARCHIVE_DIR_REL = `${PROCESS_DIR_NAME}/${ARCHIVE_DIR_NAME}`;
/** 转换稿目录的**书夹相对**形状（`材料/转换稿`）。 */
export const CONVERTED_DIR_REL = `${MATERIAL_DIR_NAME}/${CONVERTED_DIR_NAME}`;

// ── 改名记账区 · BEGIN ───────────────────────────────────────────────────
// 老段名只允许出现在下面这个块与 `test-book-dir-rename.mjs` 的记账区里（判据逐字点名）。
// ⚠️ **注意这一块是普通 `//` 注释，不是 `<!-- -->`**：ES module 里不许 HTML 注释
// （`scripts/check-syntax.mjs` 会当场报「Legacy HTML single-line comments」）。
// ── 老段名（**只为读侧兼容存在；写侧永远用新名**）──────────────────────────────
//
// ⚠️ **这四个字面量是 2026-10-04 票 `context-budget/13` 之前的老名，只为读侧兼容存在；
// 写侧永远用上面那组新名常量。** 全仓**只有这一份**——`engine/paths.js`、正则、文案、注释
// 都不许手写第二份（`test-book-dir-rename.mjs` 的记账区**三块**里，这一块是第三块）。
//
// | 老名 | 现在的段名 | 谁定的 |
// | --- | --- | --- |
// | `work/` | `工作区/` | `LEGACY_WORK_DIR_NAME` |
// | `提案/` | `工作区/方案/` | `LEGACY_PROPOSAL_DIR_NAME` |
// | `snapshots/` | `过程/存档/` | `LEGACY_ARCHIVE_DIR_NAME` |
// | `sources-md/` | `材料/转换稿/` | `LEGACY_CONVERTED_DIR_NAME` |
//
// **为什么要有这一层**（维护者复核票 13 后**推翻**了「老书不兜底」那条裁决）：spec 那两句是冲突的——
// 「范围外」写「老书的自动迁移（读侧兜底，不做一次性搬迁）」，实现决策 26 写「老书迁移策略：读侧兼容旧名优先」。
// 实测证据（真书 `当代中国政府与政治精要`）：老书盘上是 `work/`＋`提案/`＋…，
// 而新代码的 `workDir('book-…')` 解析成 `…/工作区`，**并当场把这个空目录建了出来**——
// 于是老书在工作台里变成「一本书都没有产物」，而旧目录被新目录**遮住**。裁法是
// **冲突时选可逆的那一半**：读侧兜底是加法、可撤；让现存书夹静默变空既不可逆也最伤。
//
// ⚠️ **只读不搬**：解析到老名时**不许顺手把内容搬过去**——spec 范围外明写「不做一次性搬迁」。
// 老书因此永远是「老名读、新名写」；哪天它重新落一份新产品，新旧两套就会并存
// （解析层的判法：新名优先，并把这件事显式报出来，见 `paths.legacyDirConflicts`）。
//
// ⚠️ **与组件编码的先后**：归一发生在**解码之后**（本仓的路径判据一律吃**书夹相对、未编码**的形状，
// 与 `CONTEXT.md`「界面用词表」判定线⑤「产物路径」同一口径）。`encodeURIComponent` 出来的
// 百分号形态**不在**这一层的射程——它在传输层，进判据之前必须先 `decodeURIComponent`。
// 反过来在这里加一次 `decodeURIComponent` 就会把「编码错了」当成「老名」静默兜底掉。

/** 工作区目录的老名（票 `13` 之前）——**只读兼容**，写侧一律用 {@link WORK_DIR_NAME}。 */
export const LEGACY_WORK_DIR_NAME = "work";
/** 拍板方案目录的老名（票 `13` 之前在书夹根下平级）——**只读兼容**。 */
export const LEGACY_PROPOSAL_DIR_NAME = "提案";
/** 存档目录的老名（票 `13` 之前在书夹根下平级）——**只读兼容**。 */
export const LEGACY_ARCHIVE_DIR_NAME = "snapshots";
/** 转换稿目录的老名（票 `13` 之前在书夹根下平级）——**只读兼容**。 */
export const LEGACY_CONVERTED_DIR_NAME = "sources-md";

// ── 改名记账区 · END ─────────────────────────────────────────────────────

/**
 * 老前缀 → 新前缀的四条配对（**归一的唯一一份**；四个老名逐字取自上面那组常量，不重抄）。
 *
 * ⚠️ **只此一份**：任何地方要判「这条书夹相对路径是不是老形状」都引它，
 * 不许在调用点写 `rel.replace(<老名>, <新名>)` 那种就地替换——
 * 那正是 `test-artifact-path.mjs` 治的病（构造点散在十几处，改目录名只改得动一半）。
 */
export const LEGACY_DIR_RELS = Object.freeze([
  { legacy: `${LEGACY_WORK_DIR_NAME}/`, current: `${WORK_DIR_NAME}/` },
  { legacy: `${LEGACY_PROPOSAL_DIR_NAME}/`, current: `${PROPOSAL_DIR_REL}/` },
  { legacy: `${LEGACY_ARCHIVE_DIR_NAME}/`, current: `${ARCHIVE_DIR_REL}/` },
  { legacy: `${LEGACY_CONVERTED_DIR_NAME}/`, current: `${CONVERTED_DIR_REL}/` },
].map(Object.freeze));

/**
 * 书夹相对路径 → **斜杠归一后的形状**（Windows 反斜杠折成 `/`、去掉 `./` 前缀）。
 *
 * ⚠️ **只做这一步**：它**不做**老名→新名的映射（那是 {@link normalizeBookRel} 的另一半）。
 * 单独拆出来，是因为「盘上定位」那一侧（`engine/paths.js` 的 `bookRelOnDisk`）要的是**归一之前**
 * 的形状——它答的是「这条路径在盘上落在哪」，把老名映成新名就答反了。
 * ⚠️ **归一的单一出处是本文件**：两个方向各要一步时，两边都引它，不各写一遍斜杠替换
 * （手抄一份就是「第二份量法」，改归一口径时会只改掉一半）。
 *
 * @param {string} rel 书夹相对路径（**未组件编码**）
 * @returns {string} 斜杠已归一的形状（段名仍可能是老名）
 */
export function posixBookRel(rel) {
	return String(rel ?? "")
		.replace(/\\/g, "/")
		.replace(/^(?:\.\/)+/, "");
}

/**
 * 书夹相对路径 → **规范形状**（老名前缀映成新名）。
 *
 * ⚠️ **单向**：老名 → 新名；**新名原样返回**（不做任何反向映射）。
 * 反向的那一步（「这条新名形状在盘上落在哪个老名目录里」）**不是归一**，
 * 它住在 `engine/paths.js` 的盘上定位里（要 `existsSync` 才答得出来，纯函数答不了）。
 * 两条方向混在一起就会有人拿反向映射去归一，于是老书里的新名路径被映成老名。
 *
 * **谁该调它**：凡是拿**书夹相对路径**去**分类／匹配**的地方——`productOpenMode`、
 * `isSweepExcluded`／`manifestPathMatches` 的输入、扫盘产出的行——都先过这里。
 * 只做斜杠归一不做老名归一，等于老书的每一行都判成「机器件／认不出」。
 *
 * @param {string} rel 书夹相对路径（**未组件编码**）
 * @returns {string} 规范形状（新名）
 */
export function normalizeBookRel(rel) {
	const path = posixBookRel(rel);
	for (const pair of LEGACY_DIR_RELS) {
		if (path.startsWith(pair.legacy)) return `${pair.current}${path.slice(pair.legacy.length)}`;
	}
	return path;
}

// ── 产物清单的行形状（六问 · 取值域闭式 · ADR-0031 决策 2）───────────────────
//
// 一行答六问：`role`／`path`／`producer`／`scope`／`disclose`／`deliverable`。
// ⚠️ **`status` 不进清单**（handoff §4.2 · Q10）：清单的定义是「应当有什么」，建档时生成、
// 书内只读；而**状态会过期**——一份建档当天就写死的文件装不下它（写完的当天「已审计」就已经是假的）。
// 状态是**派生视图**，见下面「环节状态」那一段。
//
// 取值域**闭式**：注入面（票 `02`）把 `disclose` 当成唯一判据，枚举不封闭就没有「注入件集合」可言。
//
// `role` 的取值域来自 `docs/共用层产物对照表.md` 的产物角色（那是共用层判定器
// `test-shared-artifacts.mjs` 的唯一期望值来源），外加**规范行**固定的那一个 `规范`。
// ⚠️ **本票不改那份对照表**——改它就是改判据的期望值（它自己的「加新行 / 改行的规矩」第 1 条）。
// 对照表**没有**登记的几类本仓自产产物（章节正文、检查记录、报告）按「职责最贴近的一条」挂靠，
// 逐条理由写在 ADR-0031 的挂靠表里。

/** 规范行的固定角色名（文档名放 `path`；**不改对照表**——见上）。 */
export const SPEC_ROLE = "规范";

/**
 * 披露档位——「这一步该给 AI 多少」。
 *
 * · `never`：一个字都不给（机器件、过程记录）；
 * · `pointer`：只给**一行**＋路径（要读时自己去读）；
 * · `inline`：**摘要常驻**（今天只有 §九 的 `residentLines`；正文按指针回读，handoff §4.6）。
 *
 * ⚠️ 「**什么时候**给」**不在这一列**——那是票 `02` 的「状态迁移 → 节」注入表。
 * 两件事混在一列，注入面就没法按状态重算。
 */
export const DISCLOSE_MODES = Object.freeze(["never", "pointer", "inline"]);

/** 产物的粒度：一个 `book` 级、`chapter` 级、`material` 级，或一份 `reference`（规范）。 */
export const ARTIFACT_SCOPES = Object.freeze(["book", "chapter", "material", "reference"]);

/** 谁写它：`ai`（主笔）／`subagent`（小助手）／`machine`（机器自己）／`user`（用户）。 */
export const ARTIFACT_PRODUCERS = Object.freeze(["ai", "subagent", "machine", "user"]);

/** 清单一行的**键集合**：六问，少一个都不是清单行（多一个同样不是——`status` 不在这里）。 */
export const MANIFEST_ROW_KEYS = Object.freeze([
	"role",
	"path",
	"producer",
	"scope",
	"disclose",
	"deliverable",
]);

// ── 环节状态（handoff §4.6 · ADR-0031 决策 4）────────────────────────────────
//
// `状态 = f(产物, 审计件, 人工确认事件)`，四档 `missing`／`stale`／`unconfirmed`／`ready`。
// ⚠️ **取值域沿用既有的四档判据，不新造词**：`chapterDone`／`chapterGateMiss` 今天已经在这四档上
// 做闸门（过目闸门与它共用同一份），而 `src/workflow.js` 里那句「写第二份就是本程要消灭的
// 『两个数字打架』」的注释早就把它写死了。所以本段是那一份的**搬移**，不是新增。
// ⚠️ 值是**机器身份词**（`CONTEXT.md`「界面用词表」判定线）：界面要说人话就翻译，
// 不拿界面词当状态值。
//
// ⚠️ **「这一行有没有配对检查件」的那一份事实住在文件末尾的「产物行的配对检查件」一节**
// （`pairedAuditRels`）——它要用五份分报告的名字，那几个出口声明在后面；按符号引用，不按行号。

/** 环节状态的四档取值域（机器身份词，注入面的触发词表取的就是这一份）。 */
export const STAGE_STATES = Object.freeze(["missing", "stale", "unconfirmed", "ready"]);

/**
 * 既有四档判据的 `reason` → 四档状态的映射。**沿用既有 reason 词、不新造**：
 * `artifact`（产物不在）⇒ `missing`；`stale`（审计/确认早于产物）⇒ `stale`；
 * `review`／`submit`（人工确认没到位）⇒ `unconfirmed`；满足（`reason === null`）⇒ `ready`。
 */
export const STAGE_STATE_BY_REASON = Object.freeze({
	artifact: "missing",
	stale: "stale",
	review: "unconfirmed",
	submit: "unconfirmed",
});

/**
 * 「这份检查记录审的是不是当前这份产物」——**指纹优先、时序兜底**。
 *
 * 为什么指纹优先：mtime 会被 `git checkout`、复制、跨盘搬运整体推后，一份**对旧稿**的检查记录
 * 因此可能「看起来比正文新」。指纹（内容摘要）没有这个毛病。
 * 时序兜底是因为**老账本没有指纹**：那批书只能按 mtime 判。
 *
 * ⚠️ **读不出就不判旧**（两个时间戳都拿不到 ⇒ `true`）：「读不出」当成「有问题」会让一本正常书
 * 凭空被拦住。两份产物在不在由上一层判据扛住，那才是最要紧的那一半。
 *
 * @param {object} facts
 * @param {string} [facts.productRevision] 产物指纹/版本（账本记的）
 * @param {string} [facts.auditedRevision] 检查记录记下的那份指纹
 * @param {number} [facts.productModifiedAt] 产物 mtime（毫秒）
 * @param {number} [facts.auditedModifiedAt] 检查记录 mtime（毫秒）
 * @returns {boolean} true = 审的就是当前这份
 */
export function auditCoversProduct({ productRevision, auditedRevision, productModifiedAt, auditedModifiedAt } = {}) {
	const hasRevision = (v) => typeof v === "string" && v !== "";
	if (hasRevision(productRevision) && hasRevision(auditedRevision)) return productRevision === auditedRevision;
	const productAt = Number(productModifiedAt);
	const auditedAt = Number(auditedModifiedAt);
	if (Number.isFinite(productAt) && Number.isFinite(auditedAt)) return auditedAt >= productAt;
	return true;
}

/**
 * 环节状态——**只此一份实现**（服务端／前端／注入面都读它）。
 *
 * 四个输入都是**事实**，本函数不读盘、不读账本：调用方把事实取来，这里只判档。
 * 判据的**顺序**就是既有的 `chapterGateMiss` 那一串（产物不在 → 审的是旧稿 → 人工没到位 → 齐了），
 * 顺序不能换：换了，「产物不在」就会被后面的判据说成别的意思。
 *
 * ⚠️ **`ready` 不是终态**：产物一动（指纹变了或 mtime 推后）就回 `stale`，它会被重新捞回来，
 * 不会「消失即遗忘」（借 `.scratch` issue 仓库那条先例：`deferred` 故意不做终态）。
 *
 * @param {object} facts
 * @param {boolean} [facts.artifactPresent] 产物与它的检查件都在不在
 * @param {boolean} [facts.auditFresh] 检查记录审的是不是当前这份
 * @param {boolean} [facts.reviewPending] 有没有未处置的抽查意见
 * @param {boolean} [facts.submitRecorded] 有没有机器记下的交工
 * @returns {{state: string, reason: string|null}} `reason` 沿用既有的四个词
 */
export function stageStateOf({ artifactPresent, auditFresh, reviewPending, submitRecorded } = {}) {
	if (artifactPresent !== true) return { state: "missing", reason: "artifact" };
	if (auditFresh === false) return { state: "stale", reason: "stale" };
	if (reviewPending === true) return { state: "unconfirmed", reason: "review" };
	if (submitRecorded !== true) return { state: "unconfirmed", reason: "submit" };
	return { state: "ready", reason: null };
}

// ── 两份表的对账（handoff §4.2 · ADR-0031 决策 3）───────────────────────────
//
// 「**应当有什么**」与「**实际有什么**」分两份（本仓处理「权威源 vs 生成物」的既有手法）：
// · `工作区/产物清单.json` —— 建档时**探本书形状**生成、书内只读；
// · `过程/登记.json` —— 机器每次扫盘写回；
// · **门禁 = 两者对账**：`清单 ∖ 登记` ＝ 缺件；`登记 ∖ 清单` ＝ 多件，各自点名。
//
// ⚠️ **对账的域是「产物」**，不是整个书夹：规范行（`scope === 'reference'`）指向
// `resources/references/**`，那不是书夹里的文件，进差集等于让它**永远缺件**。
// 而机器自己的中间件（检查记录 JSON、进度账本、清单自身、归档旧稿）按 `productOpenMode`
// 判成 `'machine'`／被排除表收掉——**它们不是产物**，那一族归「环节状态」管。

/** 路径里代表「一个序号」的占位段（`工作区/chapter-{n}.md` 那一族）。 */
const NUMBERED_SEGMENT = "{n}";

/**
 * 本书产物的**族声明**——清单行的唯一来源（下游票 11／12／13／14 都往这张表加行，不另写清单）。
 *
 * `onlyWhen: 'sources'` ＝ 只在**有源材料**的书上生成（无源的书不探查，也就没有探查那一族）。
 * ⚠️ `route`／`science` **今天不改变行集合**，它们只进清单头部的 `book` 段——理由见 ADR-0031：
 * 这两个探针今天改变的是**产物内容与注入时机**，不是**盘上多一件**；凭空给它们安一个行集合差异
 * 就是编事实。它们是票 `02`（按 `disclose` 切片注入）的探针入口。
 *
 * ⚠️ `role` 的挂靠理由逐条写在 ADR-0031 的挂靠表里；其中三格（章节正文／报告／前言）
 * 是**待维护者裁决**的——`docs/共用层产物对照表.md` 今天没有对应角色，而本票不改那份表
 * （改它＝改 `test-shared-artifacts.mjs` 的期望值）。
 */
export const BOOK_PRODUCT_FAMILIES = Object.freeze([
	{
		family: "写作规范",
		role: "写作规范",
		path: `${WORK_DIR_NAME}/style-spec.md`,
		producer: "ai",
		scope: "book",
		disclose: "pointer",
		deliverable: false,
	},
	{
		family: "章节安排",
		role: "章节骨架",
		path: `${WORK_DIR_NAME}/outline.md`,
		producer: "machine",
		scope: "book",
		disclose: "pointer",
		deliverable: false,
	},
	{
		family: "章节正文",
		// ⚠️ 对照表没有「章节正文」这一角色，暂按「它由 merge 拼进成品书」挂到成品书（待裁决）。
		role: "成品书",
		path: `${WORK_DIR_NAME}/chapter-${NUMBERED_SEGMENT}.md`,
		// ⚠️ **票 `walkthrough-2026-10/02` 把这里的 `producer` 从 `subagent` 改成 `machine`**：
		// 这一族原先由执笔小助手**直接写**，于是「拆两半派」时两个写者写同一个文件、零互斥零合并
		// （走后查 A10）。换协议之后章正文**由机器从分片拼**（唯一写入者），小助手写的是下面那一族。
		producer: "machine",
		scope: "chapter",
		disclose: "pointer",
		deliverable: true,
	},
	{
		family: "章节正文分片",
		role: "成品书",
		// 挂靠理由同「章节正文」：对照表没有这一角色，按「它被拼进那份交付物」挂。
		// ⚠️ **目录族**（与「细目」「报告」同款）：一份分片叫什么、有几份，由派工那一路决定
		// （一路一个号），清单不该手抄。落在这族内 ⇒ 对账自动对上（ADR-0031 的接口清单口径）。
		path: `${WORK_DIR_NAME}/${CHAPTER_SHARD_DIR_NAME}/*`,
		producer: "subagent",
		scope: "chapter",
		disclose: "pointer",
		deliverable: false,
	},
	{
		family: "前言",
		role: "成品书",
		path: `${WORK_DIR_NAME}/preface.md`,
		producer: "ai",
		scope: "book",
		disclose: "pointer",
		deliverable: true,
	},
	{
		family: "成品",
		role: "成品书",
		path: `${WORK_DIR_NAME}/book.md`,
		producer: "machine",
		scope: "book",
		disclose: "pointer",
		deliverable: true,
	},
	{
		family: "细目",
		role: "源材料索引",
		// ⚠️ 票 11 把**精读细目本身**收编进这一族（它原先单独占一行 `工作区/reading-{n}.md`）。
		// **那一行随票退役，不留第二份**：同一族既声明 `工作区/细目/*` 又声明一个更窄的具体名，
		// 「缺件」就会把同一件事点名两次（目录族已覆盖），而「多件」判定又不受影响——
		// 两头都不划算。收窄形状的合法改法写在 ADR-0031「给下游票的接口清单 · 票 11」那一节。
		path: `${WORK_DIR_NAME}/${DETAIL_DIR_NAME}/*`,
		producer: "subagent",
		scope: "book",
		disclose: "pointer",
		deliverable: false,
	},
	{
		family: "报告",
		role: "成品书",
		path: `${WORK_DIR_NAME}/${REPORT_DIR_NAME}/*`,
		producer: "subagent",
		scope: "book",
		disclose: "pointer",
		deliverable: false,
	},
	{
		family: "探查报告",
		role: "源材料索引",
		path: `${WORK_DIR_NAME}/explore.md`,
		producer: "ai",
		scope: "book",
		disclose: "pointer",
		deliverable: false,
		onlyWhen: "sources",
	},
	{
		family: "知识地图",
		role: "知识地图",
		path: `${WORK_DIR_NAME}/knowledge-map.json`,
		producer: "machine",
		scope: "book",
		disclose: "pointer",
		deliverable: false,
		onlyWhen: "sources",
	},
	{
		family: "知识地图分片",
		role: "知识地图",
		path: `${WORK_DIR_NAME}/knowledge-map-${NUMBERED_SEGMENT}.json`,
		producer: "subagent",
		scope: "book",
		disclose: "pointer",
		deliverable: false,
		onlyWhen: "sources",
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
		family: "章审计",
		role: "成品书",
		// 挂靠理由同「章节正文」：对照表没有「检查记录」这一角色，按「它服务于交付物」挂。
		path: `${WORK_DIR_NAME}/audit-${NUMBERED_SEGMENT}.md`,
		producer: "subagent",
		scope: "chapter",
		disclose: "pointer",
		deliverable: false,
	},
	{
		// 票 `audit-gate-semantics/01`：审计读数行（`{errors_open, warnings_open, fixed, accepted}`）
		// 的落点。它由**机器**从各章 `audit-NN.md` 现算写回（`refreshAuditReadings`），不是审计员交的件。
		// ⚠️ 它是**派生快照**：闸门只从 `audit-NN.md` 现算，不读这份文件当判据（⛔ 过期快照不许洗绿）。
		// 为什么仍要进「应当有什么」：它落在书夹里；不声明就会被盘面对账报成「多件」，而多件恒红。
		family: "审计读数",
		role: "成品书",
		path: AUDIT_READINGS_REL,
		producer: "machine",
		scope: "book",
		disclose: "never",
		deliverable: false,
	},
	{
		family: "跨章审计",
		role: "成品书",
		path: `${WORK_DIR_NAME}/audit-cross.md`,
		producer: "subagent",
		scope: "book",
		disclose: "pointer",
		deliverable: false,
	},
	{
		family: "风格线",
		role: "风格与语法",
		// 风格线是**真产物**（gold/chapters 的 `brief.references` 必读件），今天不开预览只是
		// `productOpenMode` 白名单里没有它——那是界面取词那一面的事，不该由清单替它回避。
		path: `${WORK_DIR_NAME}/style-line.md`,
		producer: "user",
		scope: "book",
		disclose: "pointer",
		deliverable: false,
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
		family: "材料判定",
		role: "源材料索引",
		path: MATERIAL_JUDGMENT_REL,
		producer: "subagent",
		scope: "book",
		disclose: "pointer",
		deliverable: false,
		onlyWhen: "sources",
	},
	// ⚠️ **这里曾经有一族「大纲契约」`工作区/outline-contract.md`**——票 `premature-announce/02`
	// 把它**退役**了，理由是**它没有任何生产者**：`src/**` 里除本表之外零处提到这一族
	// （票面第 3 条要的「死条目不许静静躺着」，判据见 `test-premature-announce.mjs` 的 ④′
	// `deadDeclarationFamilies`）。它当年的职责（机器写的章节契约）今天由 `workflow/actions/chapters.js`
	// 的 `outline` 那一支在**交工那一刻**落进 `工作区/outline.md`（契约字段 `chapters[].points` /
	// `volumeReason` 就在那一份里），所以「契约」不再是**另一份文件**，而是那份大纲的一个字段面。
	// ⚠️ 留这句注释是刻意的（与「细目」那一族退役 `reading-{n}.md` 同一纪律）：哪天有人以为
	// 「大纲契约该有自己的文件」而加回来，上面那条判据会**当场点名**——声明一族就得有生产者。
]);

/**
 * 产物行里找一族**共用的那一份文件**的书夹相对路径（`写作规范` / `章节安排` / `跨章审计` …）。
 *
 * ⚠️ 找不到就**抛**，不给兜底路径：这一族的路径是产物契约（改名＝改契约），兜一个「看起来对」的
 * 路径出来，读的人会以为它就是契约里的那一份。票 `context-budget/18` 收口前，`artifact-fields`
 * 写的是 `find(...) ?? '工作区/audit-cross.md'`（静默兜底 ＋ 手抄第二份），`dispatch-assembly`
 * 又自己写了一遍同样的查找 ⇒ 合成这一个出口（见那张票落地记录的「复核 findings」一节）。
 *
 * @param {string} family 产物族的族名（逐字，见 `BOOK_PRODUCT_FAMILIES`）
 * @returns {string} 形如 `工作区/audit-cross.md`
 */
export function productFamilyPath(family) {
	const row = BOOK_PRODUCT_FAMILIES.find((candidate) => candidate.family === family);
	if (row === undefined) throw new Error(`产物清单里没有「${family}」这一族——路径读不出来`);
	return row.path;
}

/**
 * 方法论规范行（指向 `resources/**` 的共用层）——与产物行**共用 `role` 与 `disclose` 两列**，
 * 一份登记表同时管产物与规范（handoff §4.2）。
 *
 * ⚠️ `scope` 恒为 `reference`，所以它们**不进对账差集**（不在书夹里）。
 * `deliverable` 恒 `false`：共用层不是交付物，它是**方法论**。
 *
 * ── 票 02 第 1 层之后，`disclose` 这一列是**注入的唯一判据**（ADR-0031「给下游票的接口清单 → 票 02」）──
 * 注入件集合＝这些行里 `disclose !== "never"` 的切片，**一份一行登记（一句话 ＋ 路径）**。
 * 逐档口径（与 `CONTEXT.md`「disclose」词条同文）：
 * · `pointer` —— 只给**一行** ＋ 精确路径，正文要读时自己回读（注入面那一行是
 *   `engine.onepagerLine()` 的「管什么 ＋ 何时需要」，指针兜底块另给节号台账）。
 * · `inline`  —— **摘要常驻 ＋ 正文按指针回读**（2026-10-29 · 票 `nine-resident-downgrade/01`）。
 *   今天**只有一份**：`audit-and-testing.md` 的 **§九**；它常驻的是那一行声明的
 *   `residentLines`（两行规则 ＋ 两条内容词），§九 正文留在 `resources/references/` 当单一事实源。
 *   ⚠️ 它管的是**那一节**，不是整份文档：同一份文档的其余小节仍走 pointer／状态迁移→节表。
 *   ⚠️ 旧口径是「整节正文常驻」（约 5 千字符）；真机读数证明宿主剪枝把中段剪掉、到达率只有 17.9%
 *   ⇒ 声明面把交付形态从「整节」改成「摘要」，`disclose` 这一档仍叫 `inline`（不新增档位）。
 * · `never`   —— 一个字都不给，连指针都没有。今天这一档收着**模式卡那一族**（`patterns/` 下 21 张）：
 *   它们只能经 `patterns/README.md`（那一行是 pointer，行 ＋ 路径）按教学问题翻，不进任何交办说明。
 *
 * ⚠️ **为什么 `patterns/` 的卡判 never、README 判 pointer**：判据是「这一步的 brief 要不要给」，
 * 不是「仓里有没有这份文件」。入口那一行必须始终是 pointer，否则那 21 张就真的成了死文件。
 *
 * ⚠️ **上一版有一行指向不存在的文件**（`references/tool-discipline.md`）：工具纪律那一页纸住在
 * `audit-and-testing.md` 的 §九 里（`engine.pickSections()` 按层级切出来——票 `context-budget/16`
 * 起认 `##`／`###` 两级，对 `##` 锚点与旧口径逐字等价），共用层并没有那份独立文件。
 * 它当时是绿的，因为判据只断「行数 ≥3」。按 `disclose` 切片注入之后这种悬空声明会取到空气，
 * 所以 `test-book-shape.mjs` 现在断「每条非 never 声明至少解析得出一份盘上真在的文件」。
 */
export const SPEC_ROWS = Object.freeze([
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
		sections: ["## 九、"],
		residentLines: [
			"工具纪律：文件 I/O 只用文件工具（read／write／edit／glob／grep），不用 shell（工具纪律见 audit-and-testing.md §九，跨平台一致）。",
			"回灌：子代理回报 ≤1K token，超出就写产物文件、只回路径（逐类一档表见 audit-and-testing.md §九「回灌三件套」）。",
			"判某条知识点该讲到多深时，用「深度四维承诺表」逐维自问（判定问题在 resources/references/depth.md）。",
			"拿不准某条「不变量底线 I1-I4」适用哪条路线时，回读 resources/references/invariants.md 的编号。",
		],
		deliverable: false,
	},
	{ role: SPEC_ROLE, path: "resources/references/delivery-checklist.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false },
	{ role: SPEC_ROLE, path: "resources/references/invariants.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false },
	// ⚠️ **票 `confirm-points-redesign-build/13`：`manages` 那一格的口径**——
	// 一行要么在**挂载面的一页纸登记表**（`engine.METHODOLOGY_ONEPAGE`，＝这一步真的会挂它）里有条目，
	// 要么**自己带 `manages`**（管什么 ＋ 什么时候该读），**两样不许同时有**（那才是「手写第二份」）。
	// 包地图（`resources/package-map.md`）逐行照这两处取，所以「一份文档管什么」永远只有一个说法。
	{ role: SPEC_ROLE, path: "resources/references/subagent-prompts/close-reading-prompt.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false, manages: { what: "精读小助手派发模板（细目落盘 ＋ ≤2K token 回灌四段）", when: "探查段派每一路精读时按它填" } },
	// 票 `pre-gold-build/01`：探查段开头那一趟**书级材料判定**的派发模板（角色不再在上传那一刻猜）。
	// 它进这张清单不是因为「要注入给某一步」——而是**派发面的形状出处**（`dispatch-assembly.js` 的
	// `manifestRel()` 按这张清单逐字解析模板路径，且 explore 交办里点名了它）。
	{ role: SPEC_ROLE, path: "resources/references/subagent-prompts/material-survey-prompt.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false, manages: { what: "书级材料判定派发模板（逐份一个 role ＋ 一句 basis）", when: "探查段开头派材料判定那一路时按它填" } },
	{ role: SPEC_ROLE, path: "resources/references/subagent-prompts/gold-writing-agent-prompt.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false, manages: { what: "金标准章执笔派发模板（章骨架 ＋ 知识点清单 ＋ 材料定位）", when: "站 8 派范例章执笔小助手时按它填" } },
	{ role: SPEC_ROLE, path: "resources/references/subagent-prompts/writing-agent-prompt.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false },
	{ role: SPEC_ROLE, path: "resources/references/subagent-prompts/audit-agent-prompt.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false },
	{ role: SPEC_ROLE, path: "resources/references/subagent-prompts/gold-audit-prompt.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false },
	{ role: SPEC_ROLE, path: "resources/references/subagent-prompts/cross-audit-prompt.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false },
	// 票 `knowledge-graph-build/06`：**跨材料对齐**那一档的派发模板（探索段内再派的一路：
	// 读全部卡片、产跨材料的边与「同一件事」的合并结论）。判 `pointer` 与另六份同档——
	// 它是**派发面代填的形状出处**（`dispatch-assembly.js` 的 `templateRel()` 按这一行取 rel，
	// 这一行不在就当场抛「产物清单里没有这一行」），不是给主笔常驻读的正文。
	{ role: SPEC_ROLE, path: "resources/references/subagent-prompts/alignment-prompt.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false, manages: { what: "跨材料对齐派发模板（读全部卡片，产跨材料的边与合并结论）", when: "全部精读分片落盘之后再派对齐小助手时按它填" } },
	// 票 `knowledge-graph-build/13`：**知识点图审校**那一档的派发模板（独立审校小助手——
	// 图的语义那一半的唯一读者：读全部卡片与边，收下机器现算的两条软读数）。判 `pointer` 与另几份同档
	// ——它同样是**派发面代填的形状出处**（`dispatch-assembly.js` 的 `templateRel()` 按这一行取 rel，
	// 这一行不在就当场抛「产物清单里没有这一行」），不是给主笔常驻读的正文。
	{ role: SPEC_ROLE, path: "resources/references/subagent-prompts/graph-review-prompt.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false, manages: { what: "知识点图审校派发模板（图的语义那一半的唯一读者）", when: "派图审校小助手时按它填" } },
	// 编排脚本骨架（票 `chapter-audit-orchestration/03`）：铺章那一跳的审计改由宿主 `workflow` 工具驱动，
	// 主笔照这一份填脚本。判 `pointer`——它**不是**给成员读的派发模板，而是主笔「写脚本时回读一次」的
	// 形状出处；正文不常驻（常驻那一档仍然只有工具纪律 §九 那一页纸）。
	{ role: SPEC_ROLE, path: "resources/references/workflow-scripts/chapter-audit.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false },
	// ⚠️ 补登记（2026-10-08，票 `.scratch/retro-env-friction/03`）：`anti-patterns.md` 一直被 **gate 交办正文
	// 点名**（「纪律见 resources/references/anti-patterns.md 的流程级反模式」），却从没进过这张清单 ⇒
	// 「注入件集合＝清单里 `disclose` 命中的切片」这条不变量有个缺口：**task／hints 正文里的字面量
	// 可以点名清单外的文档**，注入纪律（`disclose`）管不到它。判据是 `test-tool-discipline.mjs` 的
	// 全文点面扫描：每条被点名的 `resources/…` 都要「已登记 ＋ 从那份 brief 声明的根读得到」。
	{ role: SPEC_ROLE, path: "resources/references/anti-patterns.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false, manages: { what: "流程级反模式（agent 的逐字供述 ＋ 该怎么做）", when: "关卡交办里点名它时、或要判某句话是不是流程级反模式时" } },
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
	{ role: SPEC_ROLE, path: "resources/references/depth.md", producer: "machine", scope: "reference", disclose: "pointer", deliverable: false, manages: { what: "四维深度判定问题（边界／反例／前置／迁移）", when: "判某一条知识点的讲授深度档位时" } },
	{ role: SPEC_ROLE, path: "resources/references/two-routes.md", producer: "machine", scope: "reference", disclose: "never", deliverable: false, manages: { what: "两条路线（blueprint／human）的差异与各自铁律", when: "要判某条纪律／产物在两套路线上是不是同一件事时" } },
	{ role: SPEC_ROLE, path: "resources/references/chapter-grammar-starter.md", producer: "machine", scope: "reference", disclose: "never", deliverable: false, manages: { what: "从模式卡组合章节语法的走查示例", when: "关卡②做教学模式选型、要一份板块语法的起步样例时" } },
	{ role: SPEC_ROLE, path: "resources/references/auditor-prompt-template.md", producer: "machine", scope: "reference", disclose: "never", deliverable: false, manages: { what: "通用审计 prompt 模板 A／B（审计小助手的通用参考）", when: "要看不分档的审计提问形状时" } },
	// ── 票 `skill-catchup/02`（spec §4.4）：**机器事实对照件**（生成物，判据守它不漂） ──
	// 它是唯一允许写精确机器名的 reference：阶段／产物／闸门／工具动作／质量门今天是什么，由
	// `src/workflow/mechanism-facts.js` 从声明面现算、`scripts/gen-skill-mechanism.mjs --write` 落盘。
	// ⚠️ **判 `never`、带 `manages`，不进 `METHODOLOGY_ONEPAGE`**：2026-10-28 的真 brief 取证里它零命中
	// （票 `inject-face-prune/02`），按裁决 §5 从注入面降级；带 `manages` 仍只为保留「管什么」的唯一说法
	// （两处都写就是第二份，判据在 `test/test-path-index.mjs` 与包地图的互斥断）。
	{ role: SPEC_ROLE, path: "resources/references/mechanism.md", producer: "machine", scope: "reference", disclose: "never", deliverable: false, manages: { what: "工作台机器事实对照件：阶段/产物/闸门/工具动作/质量门", when: "需要精确机器名或路径时" } },
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
	{ role: SPEC_ROLE, path: "resources/references/patterns/*/*.md", producer: "machine", scope: "reference", disclose: "never", deliverable: false, manages: { what: "21 张教学板块模式卡（按教学问题翻，经 patterns/README.md 那一行进）", when: "关卡②选教学模式、给每章设计板块结构时（经 README 那一行，卡本身不进上下文）" } },
]);

/**
 * `path` → 清单行（**视图，不是第二份来源**）：注入面要按路径问「这一份该给多少」，
 * 每次线性扫会逼调用点自己判「没找到怎么办」——那正是第二份默认值的温床。
 * @type {Readonly<Record<string, object>>}
 */
export const SPEC_ROW_BY_PATH = Object.freeze(
	Object.fromEntries(SPEC_ROWS.map((row) => [row.path, Object.freeze({ ...row })])),
);

/**
 * 路径 → 清单行（**带通配的那一族也认**）：`SPEC_ROW_BY_PATH` 只认逐字相等的键，
 * 而清单里有一行是**声明式的族**（`resources/references/patterns/＜组＞/＜卡＞.md` 那一行）。
 * 判据侧要问「这条被点名的路径在不在声明面上」时，逐字查会把那一族的成员全判成「没登记」。
 *
 * ⚠️ **通配的语义就一种**：`*` 匹配**一段**（不含 `/`），与 `manifestPathMatches` 的 `/*` 尾巴**不是同一件事**
 * （那一份答「书夹里这条实际路径属不属于这条声明」，本函数答「这条共用层路径解析到哪一行」）。
 * ⛔ 不合并两者：一个是书夹对账、一个是声明面查表，混起来会让「老名归一」被套到共用层路径上。
 *
 * @param {string} path `resources/…` 形态或包内 rel
 * @returns {object|null} 命中的那一行（逐字命中优先），没有＝`null`
 */
export function specRowFor(path) {
	const text = String(path ?? "");
	const exact = SPEC_ROW_BY_PATH[text] ?? SPEC_ROW_BY_PATH[`resources/${text}`] ?? null;
	if (exact !== null) return exact;
	const rel = text.replace(/^resources\//, "");
	for (const row of SPEC_ROWS) {
		const declared = row.path.replace(/^resources\//, "");
		if (!declared.includes("*")) continue;
		const pattern = `^${declared.split("/").map((seg) => seg.split("*").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[^/]*")).join("/")}$`;
		if (new RegExp(pattern).test(rel)) return row;
	}
	return null;
}

/**
 * 声明面里**判 `inline` 的那几行**（＝唯一常驻的正文面），逐行连它声明的**节号**与**摘要行**一起给出来。
 *
 * 病（spec §5.4 D1）：声明面原先只有**文件粒度**（整份 `audit-and-testing.md` 判 inline），
 * 而实现常驻的只有 `## 九、` 那一节约 5 千字符 ⇒ **声明面比实现面宽了两万多字符**。
 * 这一份就是「声明面自己说常驻哪几节」，注入面照它取正文（⛔ 不许在代码里再写一个节号字面量）。
 *
 * 2026-10-29（票 `nine-resident-downgrade/01`）：返回形状加一格 `lines`——
 * `sections` 仍声明**来源**，`lines` 声明**交付形态**（摘要）。`lines` 为空时注入面退回按
 * `sections` 取节正文；四行文本的单一出处仍是 `SPEC_ROWS`，本函数只给副本。
 *
 * @returns {Array<{path: string, rel: string, sections: string[], lines: string[]}>}
 */
export function residentDeclaration() {
	return SPEC_ROWS.filter((row) => row.disclose === "inline").map((row) => ({
		path: row.path,
		rel: row.path.replace(/^resources\//, ""),
		sections: [...(row.sections ?? [])],
		lines: [...(row.residentLines ?? [])],
	}));
}

/** 一份包内 rel 的**声明面 rel**（清单行以 `resources/` 起头，挂载面与一页纸登记表用裸 rel）。 */
export const specRelOf = (path) => String(path ?? "").replace(/^resources\//, "");

/**
 * 声明面上每一行**路径里的目录**（去重、按层级升序）。
 *
 * ⚠️ 票 `inject-face-prune/01` 起**包地图不再渲染文件夹**（目录树是宿主一眼可查的事实）——
 * 本函数保留导出，供需要「声明面派生出哪些目录」的调用点用；⛔ 删它是另一件清理，不顺手做。
 *
 * ⚠️ **带通配的段不进目录面**（`patterns/＜组＞/` 那种不是真目录）；根 `resources/` 也在里面
 * （它是模式资产层的入口，映射的基准由 `RESOURCE_ROOT_LINE` 给）。
 *
 * @param {string[]} paths 清单行路径
 * @returns {string[]} 形如 `resources/`、`resources/references/subagent-prompts/`
 */
export function packageDirsOf(paths) {
	const dirs = new Set()
	for (const path of paths) {
		const segments = String(path ?? "").split("/").filter((s) => s !== "")
		for (let i = 1; i <= segments.length - 1; i += 1) {
			const head = segments.slice(0, i)
			if (head.some((s) => s.includes("*"))) continue
			dirs.add(`${head.join("/")}/`)
		}
	}
	return [...dirs].sort((a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b))
}

/**
 * 模式资产层**目录**的一行说明（每个文件夹「管什么 ＋ 什么时候该读」）。
 *
 * ⚠️ 票 `inject-face-prune/01` 起它**不再参与包地图渲染**：包地图只登记可注入的**文件**行，
 * 目录树是宿主一眼可查的事实。这一份留给**书夹投影**（`bookDirExplanationOf()`）解释
 * `resources/…` 那几族登记行落到的目录。
 */
export const PACKAGE_DIR_ROWS = Object.freeze({
	"resources/": { what: "模式资产层的根（入口 SKILL.md ＋ 这份包地图 ＋ references/）", when: "任何时候——先在这里认清哪一层管什么，再按需下钻" },
	"resources/references/": { what: "共用的方法论文档（规范、契约、清单、不变量、审计细则）", when: "要判某一步该按哪条规矩做、或产物的字段契约长什么样时" },
	"resources/references/patterns/": { what: "内置教学模式库（README 是入口，21 张卡按教学问题翻）", when: "关卡②选教学模式、给每章设计板块结构时" },
	"resources/references/subagent-prompts/": { what: "小助手派发模板（一档一份：写、审、对齐、图审校…）", when: "要派哪一档小助手时按对应那一份填" },
	"resources/references/workflow-scripts/": { what: "编排脚本骨架（主笔照它填宿主 workflow 的那一跳）", when: "要把某一跳改成宿主 workflow 驱动时" },
});

/**
 * **包地图**（spec §5.5 E1；票 `inject-face-prune/01` 去缓存）：模式资产层里每个**可注入**文件
 * 「什么时候该读 ＋ 谁产出它」。
 *
 * ⚠️ **只登记 `disclose !== "never"` 的行**：包地图是**注入索引**，`never` 一个字都不给、
 * 也不进索引（文件本体仍可按路径人工查）。目录树与每份的「管什么」都是 AI 一眼能查到的宿主事实，
 * 不再抄进地图；真正查不到的三件事——路径、什么时候该读、谁产出它——才是这张表的内容。
 *
 * ⚠️ **由声明面生成，⛔ 不手写第二份**：`when` 只认两处——`onepage`（挂载面那一页纸登记表）
 * 或那一行自己的 `manages`（**互斥**，判据断「两样不许同时有、也不许都没有」）；
 * `producer` 逐行取自声明面那一格。
 *
 * @param {Record<string, {what: string, when: string}>} onepage 挂载面的一页纸登记表（`METHODOLOGY_ONEPAGE`）
 * @returns {{path: string, when: string, producer: string}[]}
 */
export function packageMapRows(onepage = {}) {
	return SPEC_ROWS
		.filter((row) => row.disclose !== "never")
		.map((row) => {
			const rel = specRelOf(row.path);
			const entry = onepage[rel];
			return {
				path: row.path,
				when: entry?.when ?? row.manages?.when ?? "",
				producer: row.producer ?? "",
			};
		});
}

/** 包地图的 Markdown 渲染（生成物 `resources/package-map.md` 的正文；判据拿它与生成结果逐字比）。
 *
 * ⚠️ **⛔ 不落任何本机绝对路径**（spec §5.5 E1 点名的第三个来源 `RESOURCE_ROOT_LINE` 只取它的**形式**）：
 * 把某台机器的 `RESOURCES_DIR` 写进一份入库文件，正是 `.scratch/dsh-contract-drift/issues/03` 那个病
 * （代码里出现某台机器的路径）。基准那一行改成**说清它是运行时的哪一格**，值由运行时的 `brief.resourceRoot` 给。
 */
export function packageMapMarkdown(onepage = {}) {
	const rows = packageMapRows(onepage)
	const line = (row) => `- \`${row.path}\`：什么时候该读：${row.when}｜产出：${row.producer}`
	return [
		"# 模式资产层的包地图（生成物）",
		"",
		"> ⛔ **这份文件是生成的**：`node scripts/gen-package-map.mjs --write` 照 `src/domain-rules.js` 的",
		"> `SPEC_ROWS` 与挂载面的一页纸现算。手改它等于改一份下一趟就被覆写的临时件。",
		"> 判据 `test/test-path-index.mjs` 双向对账：地图里每一项都在**可注入的**声明行里、可注入的每一行都在地图里（`never` 不进索引）。",
		">",
		"> 映射的基准：下面每条 `resources/…` 都相对**运行时**的方法论根目录拼",
		"> ——就是 `brief.resourceRoot` 那一格（交办件里的 `RESOURCE_ROOT_LINE` 也印它，本机绝对路径）。",
		"> ⛔ 这里不印那个绝对路径：印了就是把某台机器的路径写进入库文件。",
		"",
		"## 文件",
		"",
		...rows.map(line),
		"",
	].join("\n")
}

/**
 * 书夹（书里的那一层）每个目录的**一行解释**——「讲这类活 ⇒ 模式的资产」，所以它住在模式这一侧。
 *
 * ⚠️ 与包地图的分工（spec §5.5 的载体归属判据）：**讲这本书 ⇒ 书里的产物；讲这类活 ⇒ 模式的资产**。
 * `工作区/`「里头是这本书的产物」是**这类活**的规矩（每本书都一样）⇒ 归这里；
 * 而「这本书的 12 个目录到底是什么」随流程在变 ⇒ 由 {@link bookDirIndex} **现算**，
 * ⛔ **不落「每本书的说明书」**（书夹 `README.md` 只在建档写一次，实测真书 12 个目录里 5 个没被解释）。
 */
export const BOOK_DIR_ROWS = Object.freeze({
	// ⚠️ 路径由**目录名常量**现拼（⛔ 不用 `PROPOSAL_DIR_REL` 那几个 `_REL`）：
	// 那几条 `_REL` 在本文件里定义在**下面**（票 11 的那一节附近），模块初始化时还在 TDZ
	// ⇒ 这里引它们会当场 `ReferenceError`。目录名这一层仍是**同一份常量**（名字没有第二处）。
	".": { what: "书夹根：这本书的说明书 README.md、账本 project.json／timeline.jsonl 与原件目录", when: "要知道这本书从哪来、改过什么时" },
	"sources": { what: "你上传的原件（从未被机器改过）", when: "要回看原件、或核对转换稿有没有失真时" },
	[MATERIAL_DIR_NAME]: { what: "材料层：原件转出的转换稿", when: "读材料、抽结构、定知识点时" },
	[`${MATERIAL_DIR_NAME}/${CONVERTED_DIR_NAME}`]: { what: "每份材料的 Markdown 转换稿", when: "精读、抽结构、抽知识点时（真相源）" },
	[WORK_DIR_NAME]: { what: "机器写出来的内容（书里的产物都在它下面）", when: "找这本书的任何产物时先来这里" },
	[`${WORK_DIR_NAME}/${PROPOSAL_DIR_NAME}`]: { what: "每一次拍板的设计方案（含修订版次）", when: "要看某一关当时凭什么拍板、或回看上一版方案时" },
	[`${WORK_DIR_NAME}/${DECISION_DIR_NAME}`]: { what: "确认点的结论件（每站一份，机器读的下游输入）", when: "要判「上一站拍了什么」、或下游要拿结论时" },
	[`${WORK_DIR_NAME}/${CHAPTER_SHARD_DIR_NAME}`]: { what: "章正文分片（小助手一人一片，章正文由机器拼）", when: "要看某一路执笔写了什么、或重拼章正文时" },
	[`${WORK_DIR_NAME}/${DETAIL_DIR_NAME}`]: { what: "精读小助手落的全文细目（每份材料一份）", when: "要看某份材料读出来的细节原文时" },
	[`${WORK_DIR_NAME}/${REPORT_DIR_NAME}`]: { what: "审计与检查报告（机器按落盘件读）", when: "要看某一章／某一趟审计查出了什么时" },
	[`${WORK_DIR_NAME}/_旧版产物`]: { what: "归档的旧稿（深改／重做把上一版搬进来留底）", when: "要回看被替换掉的那一版时" },
	"模式库": { what: "这本书自己的模式卡（与内置模式库同等地位）", when: "关卡②模式选型、写写作规范时" },
	"模式库/自定义": { what: "用户粘贴描述、AI 提炼出来的模式卡", when: "同上——它必须与内置卡一起被逐张读过" },
	[PROCESS_DIR_NAME]: { what: "过程层：账本登记与关键节点存档", when: "要回退到最近一次存档、或看登记账时" },
	[`${PROCESS_DIR_NAME}/${ARCHIVE_DIR_NAME}`]: { what: "关键节点自动存的档（可回退）", when: "回退、或定点修改前留底时" },
	// ── 老书只读兼容（写侧永远用新名；票 `context-budget/13` 只读不搬）──
	[LEGACY_WORK_DIR_NAME]: { what: "老书的工作区（老名，只读兼容）", when: "翻阅票 13 之前建的书时才可能碰到" },
	[LEGACY_PROPOSAL_DIR_NAME]: { what: "老书的方案目录（老名，只读兼容）", when: "同上" },
	[LEGACY_ARCHIVE_DIR_NAME]: { what: "老书的存档目录（老名，只读兼容）", when: "同上" },
	[LEGACY_CONVERTED_DIR_NAME]: { what: "老书的转换稿目录（老名，只读兼容）", when: "同上" },
});

/** 书夹相对路径所属的**目录**（`a/b/c.md` → `a/b`；根下的文件 → `.`）。 */
export function bookDirOf(path) {
	const segments = posixBookRel(path).split("/").filter((s) => s !== "")
	return segments.length <= 1 ? "." : segments.slice(0, -1).join("/")
}

/**
 * 目录 → 一行解释。「书夹那一层」与「模式资产层」各有一份表，**同一个目录只从一份里取**
 * （⛔ 不合并成一张大表：那会把「这本里的产物」与「这类活的资产」混成一份，判据再也分不开两者）。
 * @param {string} dir 书夹相对或包内相对的目录（根为 `.`）
 */
export function bookDirExplanationOf(dir) {
	// ⚠️ 两个键形都要试：包地图的文件夹键带尾斜杠（`resources/references/`），
	// 而书夹这边由 `bookDirOf()` 派生出来的是**不带尾斜杠**的形状（`resources/references`）。
	return BOOK_DIR_ROWS[dir] ?? PACKAGE_DIR_ROWS[dir] ?? PACKAGE_DIR_ROWS[`${dir}/`] ?? null
}

/**
 * **书夹现算投影**（spec §5.5 E2）：把这一本书**此刻**的目录面算成一份索引，
 * 每个目录一行解释，并把 `outputs`／`references`／`materials`／`registry` 那几族登记行**合并进来**
 * （同一事实只落一处：登记行在投影里**逐行归到自己那个目录下**，不再散在四处）。
 *
 * ⚠️ **不落新件**：它是**投影**，随流程现算——书夹的形状每走一步都在变，
 * 落盘的地图一天就烂（书夹 `README.md` 的实证：真书 12 个目录里 5 个没被解释，四条目录的时间都晚于它）。
 * ⛔ **也不改成「每次注入」**：这一份进的是结构化字段（`brief.bookDirs`），
 * 与「交办件正文」是两回事，常驻面的体积不受它影响。
 *
 * ⚠️ **共享层那几族（`registry`）的路径以 `resources/` 起头**——它们不在书夹里，所以
 * 它们归到的是**模式资产层**那几个目录（解释取自 `PACKAGE_DIR_ROWS`）。两层的解释各出一份表，
 * 而「哪个目录由哪一份解释」是**确定的**（不是二选一兜底）：`resources/…` 归模式层，其余归书夹层。
 *
 * @param {{dirs?: string[], rows?: {family: string, path: string}[]}} input
 *   `dirs` ＝ **盘上真的建出来的**目录（书夹相对）；`rows` ＝ 四族登记行（已归一成 `{family, path}`）
 * @returns {{dir: string, what: string, when: string, rows: object[]}[]}
 */
export function bookDirIndex({ dirs = [], rows = [] } = {}) {
	const all = new Set([".", ...dirs.map((d) => posixBookRel(d)).filter((d) => d !== "")])
	// ⚠️ **同一事实只落一处**：同一个路径在四族里会重复出现（`brief.registry` 由未去重的挂载面派生；
	// chapters 那一段的 `references` 里也点着同一批共用层文档）⇒ 照单全收会让投影里同一行出现两次，
	// 那正是「同一事实落两处」的形状。**按路径去重**（先到的那一族留下，⛔ 不是按 `(family, path)`——
	// 那样同一个文件仍会以两族身份各占一行）。
	const uniqueRows = []
	const seen = new Set()
	for (const row of rows) {
		if (typeof row?.path !== "string" || row.path === "") continue
		if (seen.has(row.path)) continue
		seen.add(row.path)
		uniqueRows.push(row)
	}
	for (const row of uniqueRows) all.add(bookDirOf(row.path))
	return [...all]
		.sort((a, b) => (a === "." ? -1 : b === "." ? 1 : a.split("/").length - b.split("/").length || a.localeCompare(b)))
		.map((dir) => {
			const line = bookDirExplanationOf(dir)
			return {
				dir,
				what: line?.what ?? "",
				when: line?.when ?? "",
				rows: uniqueRows.filter((row) => bookDirOf(row.path) === dir),
			}
		})
}

/**
 * 扫盘写登记时的**排除表**：这些路径不是「产物」，不进登记。
 *
 * ⚠️ **这一份判据刻意不引用 `productOpenMode`**（2026-10-04 复核改）。原先扫盘用
 * 「`productOpenMode(rel) === 'machine'` 就跳过」当「这是不是产物」的判据——那是**两个不同的问题**：
 * `productOpenMode` 答的是「这份东西怎么给人看」（白名单之外的**默认**是 machine），
 * 扫盘答的是「工作区里有没有产物」。拿前者当前者会连坐：**凡是不开预览的产物都进不了登记**，
 * 而清单照样声明着它们 ⇒ 「前言」「知识地图分片」两族恒缺件。真书
 * `当代中国政府与政治精要/工作区/` 的盘上清单证实了这件事（`preface.md`、
 * `knowledge-map-01.json`、`audit-01.md`、`style-line.md` 全在，都点不出「在」）。
 * 一个恒红的判据比没有判据更坏——它教人忽略缺件那一半。
 *
 * 逐条带理由，是因为「排除」是把红变绿的方向——一条没有理由的排除就是给自己开后门。
 * 与 `test-contract-action-catalog.mjs` 的 `GATE_EXCLUDED_SOURCES` 同一纪律。
 */
export const SWEEP_EXCLUDED = Object.freeze([
	{
		path: `${WORK_DIR_NAME}/_旧版产物/*`,
		reason: "归档的旧稿：深改/重做把上一版搬走留底（`deep-modify.js`）。它已经**不再是应当有的产物**，"
			+ "留在登记里会让「多件」永远红。",
	},
	{
		path: `${WORK_DIR_NAME}/${MANIFEST_FILE_NAME}`,
		reason: "产物清单自己：它是**应当有什么**那一半，让它进「实际有什么」等于自己对自己对账。",
	},
	{
		path: `${WORK_DIR_NAME}/progress.md`,
		reason: "进度账本：它是**协调用的中间件**（谁做到哪一步），不是给读者看的产物。"
			+ "那一族归「环节状态」管——按 ADR-0031 决策 4，状态是**派生**的，不从产物里数。",
	},
	{
		// 票 `knowledge-graph-build/09`（§C10 那条「人的产物在产物清单那一层没有类目」的落地）。
		path: KNOWLEDGE_MAP_EXCLUSIONS_REL,
		reason: "**人的裁决记录**（图上划掉的那几条，票 09 那份件）：它是**追溯与协调用的中间件**，"
			+ "不是「应当有」的读者产物——**没划过任何卡的书本来就不该有它**，把它声明进"
			+ "「应当有什么」（`BOOK_PRODUCT_FAMILIES`）会给每一本新书凭空多一条**恒缺件**"
			+ "（一个恒红的判据比没有判据更坏）。而它今天真的会落到 `工作区/` 里 ⇒ 不进这张排除表，"
			+ "它就会以「多件」的身份让形状对账**永远红**（「多件任何时候都是红的」，见"
			+ "`book-shape.js` 文件头）。⇒ 排除掉它，两半都对。"
			+ "⚠️ 「人的产物」那一档今天**不叫 `human`、叫 `user`**（`ARTIFACT_PRODUCERS` 里已在册，"
			+ "`style-line.md` 就是同一档）⇒ 本票**不给 producer 加档**（加一个同义的 `human` 只会让"
			+ "同一档有两个名字）。",
	},
	{
		// 票 `confirm-points-redesign-build/01`：结论件（确认点的拍板结论，`工作区/决策/NN.json`）。
		path: `${DECISION_DIR_REL}/*`,
		reason: "**确认点的拍板结论**（一站一份，含驳回也留的那一份）：它是**追溯与协调用的中间件**，"
			+ "不是「应当有」的读者产物——**跳过的站本来就不该有它**，声明进「应当有什么」会给每一本"
			+ "跳站的书凭空多一条**恒缺件**；而它今天真的会落到 `工作区/` 里 ⇒ 不进这张排除表，"
			+ "它就会以「多件」的身份让产物形状对账**永远红**（「多件任何时候都是红的」，见"
			+ "`book-shape.js` 文件头）。⚠️ 目录族按 `*` 前缀匹配（见下面 {@link isSweepExcluded}）。",
	},
	{
		// 票 `reader-cognition-boundary-build/03`：「给出那一份」在书夹里的副本。
		path: READER_QUESTIONNAIRE_ISSUED_REL,
		reason: "**可选动作「发一份读者情况问卷」写出的那一份**（票 rcb/03，纸屏两用的 `.md` 抄本）："
			+ "没发过卷的书本来就不该有它 ⇒ 声明进「应当有什么」会给每一本新书凭空多一条**恒缺件**"
			+ "（一个恒红的判据比没有判据更坏）；而它真的会落到 `工作区/` 里 ⇒ 不进这张排除表，"
			+ "它就会以「多件」的身份让产物形状对账**永远红**。⚠️ 它**不是**第二份事实源：只是给出那一刻的"
			+ "抄本（收卷人拿到的就是它，经通用下载路由）。它是否在盘上**不作任何放行条件**。",
	},
	{
		// 票 `reader-cognition-boundary-build/03`：造书用户手粘回来的回卷原文。
		path: READER_QUESTIONNAIRE_RETURNED_REL,
		reason: "**人粘回来的回卷原件**（票 rcb/03）：它是人的输入与追溯证据，不是「应当有」的读者产物"
			+ "——没发过卷／还没回卷的书本来就不该有它，声明进「应当有什么」会凭空多一条**恒缺件**；"
			+ "而它真的会落到 `工作区/` 里 ⇒ 不进这张排除表，它就会以「多件」的身份让产物形状对账"
			+ "**永远红**。⚠️ 它的形状判据只在**有件时**生效（件在就要非空；无件＝不适用，"
			+ "⛔ 不是违约、⛔ 不是放行条件）——判据住 `src/workflow/reader-questionnaire.js`，"
			+ "下游（AI 逐条读、代笔落剔除记录）归票 `06`。",
	},
	{
		// 票 `premature-announce/02`：**已退役的产物族**在盘上的遗留副本。
		path: `${WORK_DIR_NAME}/outline-contract.md`,
		reason: "**老书里那份已退役的「大纲契约」遗留件**（票 `premature-announce/02` 把它从"
			+ "`BOOK_PRODUCT_FAMILIES` 退役：`src/**` 里零生产者，它当年的职责已并进 `工作区/outline.md`"
			+ " 的 `chapters[].points`／`volumeReason` 字段面）。老书盘上真可能还留着这一份"
			+ "（真书取样见 `docs/测试信任边界.md` 的故事 04 一节）⇒ 不进这张排除表，它就会以「多件」的"
			+ "身份让那本书的产物形状对账**永远红**（「多件任何时候都是红的」，见 `book-shape.js` 文件头），"
			+ "而那是**改名/退役留下的痕迹**，不是这本书做错了什么。⚠️ 排除它≠假装没有过：退役这件事与"
			+ "「它为什么不再声明」逐字写在这一条里；新书不会再产出它。",
	},
]);

/**
 * 该路径是否被排除表收掉（登记扫盘面用；目录族按 `*` 之前的那个前缀匹配）。
 *
 * ⚠️ **输入先过 {@link normalizeBookRel}**：老书扫出来的行带的是老名前缀（老名那一段的进度账本），
 * 不归一的话排除表一条都对不上——`progress.md` 会以「多件」的身份永远红着，
 * 而它明明是中间件（下面那条理由白写了）。
 */
export function isSweepExcluded(rel) {
	const path = normalizeBookRel(rel);
	return SWEEP_EXCLUDED.some((entry) =>
		entry.path.endsWith("/*")
			? path === entry.path.slice(0, -2) || path.startsWith(entry.path.slice(0, -1))
			: path === entry.path,
	);
}

/**
 * 一个清单行的 `path` 声明**匹配**哪些实际路径。
 *
 * 三种声明形状（各有各的必要，不是一份正则硬套）：
 * · 逐字（`工作区/book.md`）：只匹配那一个；
 * · **序号族**（`工作区/chapter-{n}.md`）：一段 `\d+` ——章节数是**排定之后**才知道的，
 *   清单在建档时就写死它，所以只能按族声明；
 * · **目录族**（`工作区/细目/*`）：该前缀下的任意路径 ——那一族里有多少件、叫什么，
 *   由**谁产出**决定（票 11 的每份细目按材料分号），清单不该手抄。
 *
 * ⚠️ 路径一律是**书夹相对**（带 `工作区/` 前缀），不是工作区相对——那是 `productOpenMode`
 * 与清单两边的共同口径；写成工作区相对的话 `productOpenMode` 会把每一行都判成 `'machine'`。
 *
 * ⚠️ **两侧都先过 {@link normalizeBookRel}**：老书的登记行带老名前缀（老名那一段的章节正文），
 * 而清单声明的永远是新名（`工作区/chapter-{n}.md`）——不归一的话老书**每一族都恒缺件**，
 * 而「多件」那一族还会在同一次对账里把它们逐条点名两次。归一是单向的，新名原样穿过。
 *
 * @param {string} declared - 清单行声明的 path
 * @param {string} actual - 登记行里的实际路径
 * @returns {boolean}
 */
export function manifestPathMatches(declared, actual) {
	const a = normalizeBookRel(declared);
	const b = normalizeBookRel(actual);
	if (a === "") return false;
	if (a.endsWith("/*")) {
		const prefix = a.slice(0, -1);
		return b === prefix.slice(0, -1) || b.startsWith(prefix);
	}
	if (!a.includes(NUMBERED_SEGMENT)) return a === b;
	// `{n}` 是**段内的一个占位**（`chapter-{n}.md`），必须逐段替换：整段换成 `\d+` 认不出带前缀的段名，
	// 而只认「整段等于 `{n}`」会让 `chapter-{n}.md` 永远匹配不上（第一版就是这么写的，见本函数上方注记）。
	const pattern = a
		.split("/")
		.map((segment) =>
			segment
				.split(NUMBERED_SEGMENT)
				.map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
				.join("\\d+"),
		)
		.join("/");
	return new RegExp(`^${pattern}$`).test(b);
}

/**
 * 本书**应当有什么**的清单行——按本书形状**探出来**（handoff §4.2）。
 *
 * @param {{route?: string, science?: boolean, hasSources?: boolean}} bookShape 建档时的探针结果
 * @returns {object[]} 清单行（六问齐全）
 */
export function manifestRowsFor({ hasSources = false } = {}) {
	// ⚠️ **票 `chain-red/01`：产物行也必须显式投影成「清单那六问」**——
	// `BOOK_PRODUCT_FAMILIES` 是**声明面**，它另带自己的过滤列（`onlyWhen: "sources"`，见那一族的注记）。
	// 原先这里写的是 `({ family, ...six }) => ({ family, ...six })`，于是带 `onlyWhen` 的那几族
	// 把**过滤输入**漏进了书里：`产物清单.json` 是**键闭集**（`family` ＋ 六问，见上面的
	// `MANIFEST_ROW_KEYS`），多一个键就是违约。这条病是**既存**的（票 `63ee200` 那次合并带进来），
	// 不是 `premature-announce/02` 造的——那一票只是让它在演示书上显形。
	// 既往没被抓住，是因为 `test-book-shape.mjs` 的键闭包那一格只喂**无源**夹具：`hasSources === false`
	// ⇒ 带 `onlyWhen` 的四族全被过滤掉，那一格永远看不到多余键。判据已随本票补上**有源**那一档 ＋ 反证。
	// ⇒ `onlyWhen` 只做**过滤输入**，不进输出（⛔ 不是写侧删字段：那样读侧与写侧各存一份形状，
	// 而 `engine.declaredStageRowsMissingFromManifest` 与 `test-tool-discipline.mjs` 拿到的仍是脏行）。
	// ⚠️ **列名从 `MANIFEST_ROW_KEYS` 现取，不手抄第三份**（收口 review）：键集合的唯一出处是上面
	// 那个常量；手抄一份「相似的六问」在键集变了时不会自己红。列序 ＝ `family` ＋ 那个常量的顺序，
	// 与原先手写的顺序**逐字节相同**（所以这一改动不动盘上那份清单的一个字节）。
	const productRows = BOOK_PRODUCT_FAMILIES.filter((entry) => entry.onlyWhen !== "sources" || hasSources === true).map(
		(entry) => Object.fromEntries(["family", ...MANIFEST_ROW_KEYS].map((key) => [key, entry[key]])),
	);
	// ⚠️ **票 `confirm-points-redesign-build/13`：规范行要显式投影成「清单那六问」**——
	// `SPEC_ROWS` 那一份现在另带声明面自己的列（`sections`／`manages`，见那两处的注记），
	// 而写入书夹的 `产物清单.json` 是一个**键闭集**（`test-book-shape.mjs` 的
	// `MANIFEST_ROW_KEYS` 断「多了哪一列」）。`...row` 直铺会把声明面的列带进书里，
	// 那既不是产物清单该装的东西，也会把「多了『manages』」判红。
	// ⇒ 这里把**清单那六问**逐列取出来（⛔ 不是删字段：那两列仍住在 `SPEC_ROWS` 上给注入面与包地图用）。
	// ⚠️ 这一支的列序与上面那一支**不同**（`deliverable` 在 `disclose` 前）：那是既存字节形状，
	// 本票**有意不动**——改成统一列序会让录制里那 9 行规范行的字节一起变，而本票要求的解释形态是
	// 「与 `76bd43e` 的差只剩族替换」。列序是 JSON 对象里**无语义**的差异，故不值得为它再动一次基线。
	return [...productRows, ...SPEC_ROWS.map((row) => ({
		family: "规范",
		role: row.role,
		path: row.path,
		producer: row.producer,
		scope: row.scope,
		deliverable: row.deliverable,
		disclose: row.disclose,
	}))];
}

/**
 * 两份表对账：`清单 ∖ 登记` ＝ 缺件、`登记 ∖ 清单` ＝ 多件，**各自点名**。
 *
 * ⚠️ **域**：`scope === 'reference'` 的规范行不进差集（它们指向共用层，不在书夹里）；
 * 排除表收掉的路径也不进差集（归档旧稿与清单自身不是产物）。
 *
 * ⚠️ **防空跑**：两侧各解析出 0 行时差集恒为空、这道判据恒绿。所以调用方（与判据）必须各自
 * 带**下限**——两侧行数下限、每类产物的份数下限。先例：`test-shared-artifacts.mjs:41`。
 *
 * @param {object[]} manifestRows
 * @param {object[]} registryRows
 * @returns {{missing: object[], extra: object[]}}
 */
export function reconcileManifestRows(manifestRows, registryRows) {
	const manifest = Array.isArray(manifestRows) ? manifestRows : [];
	const registry = (Array.isArray(registryRows) ? registryRows : []).filter((row) => !isSweepExcluded(row?.path));
	const targets = manifest.filter((row) => row?.scope !== "reference");
	const covered = (path) => targets.some((row) => manifestPathMatches(row.path, path));
	const missing = targets
		.filter((row) => !registry.some((found) => manifestPathMatches(row.path, found?.path)))
		.map((row) => ({ family: row.family, role: row.role, path: row.path, scope: row.scope }));
	const extra = registry
		.filter((row) => !covered(row?.path))
		.map((row) => ({ path: row.path, open: row.open ?? null }));
	return { missing, extra };
}

// ── 字数口径 ────────────────────────────────────────────────────────────────

/**
 * 全书唯一的汉字计数判据（CONTEXT.md「字数」词条）：只数 CJK 统一汉字，
 * 数字、字母、标点、空白均不计。展示与派生都调用这里，禁止别处再写一份量法。
 */
const HANZI_RE = /[\u4e00-\u9fff]/g;

/** 统计文本中的汉字数；非字符串按空文本处理。 */
export function countHanzi(text) {
	return String(text ?? "").match(HANZI_RE)?.length ?? 0;
}

/**
 * 某一章的**字数兜底**（汉字）——`targetWords` 自票 `word-budget-ineffective/02` 起是
 * 「至少要有这么多」，⛔ 不再是上限/参考区间。
 *
 * 取值顺序与交办说明同一个口径（`engine.js` 的铺章 brief）：本章 `targetWords` →
 * 旧书书级 `meta.targetWords`。**两处都没有 ⇒ `null`（没有兜底，不判）**：
 * 老书没填过这个字段时不许凭空造一个 6000 去拦它——那是把「没预算」读成「预算 6000」。
 * 真书/新书在 outline 交工时已把逐章目标归一成 ≥500 的数（`actions/chapters.js`），
 * 所以 `null` 只落在没走过那一跳的老账本上。
 *
 * ⚠️ 这是全仓唯一的兜底口径：交工闸门、交付清单与章节面板都读它，⛔ 别处不再拼一份
 * 「`targetWords ?? meta.targetWords ?? 6000`」。
 *
 * @param {object|null|undefined} meta 书级账本
 * @param {number} n 1 基章号
 * @returns {number|null} 兜底汉字数；没有目标值时为 `null`
 */
export function chapterWordsFloor(meta, n) {
	const chapters = Array.isArray(meta?.outline?.chapters) ? meta.outline.chapters : [];
	const chapter = chapters[Number(n) - 1];
	for (const value of [chapter?.targetWords, meta?.targetWords]) {
		const words = Number(value);
		if (Number.isFinite(words) && words > 0) return Math.round(words);
	}
	return null;
}

// ── 主 AI 上下文占用（宿主会话投影）──────────────────────────────────────────────
//
// 折算口径为何在这里而不在 UI 侧（票 `walkthrough-fixes/28`）：**a 两侧都必须知道的规则**。
// 界面那一半要把宿主的 `contextPressure` 投影值折成百分比，
// 领任务说明那一半也要折同一份数（否则同一个数在两屏上说两个话）——
// 所以口径只有这里一份。只有“界面那句话怎么写”（`contextOccupancySentence`）
// 才算单侧展示文案，它留在 `src/ui/rules.js`。
//
// 数据源：宿主 `@deepseek-ai/dsh-token-meter` 的 `contextPressure` 会话投影
// （与宿主输入区角标「上下文已用 51%」同一份数据）。快照与来源路径见
// `docs/reference/dsh-context-occupancy-contracts.md`。

/**
 * 宿主 `contextPressure` 投影值 → 占用百分比（0-100 的整数）。
 *
 * 口径逐字照宿主 `@deepseek-ai/dsh-client-ui-conversation` 的 `contextOccupancy()`：
 *   分子 = `projectedTokens ?? pressureTokens`（下一个请求真正要花多少，不是上一次报的）
 *   分母 = `contextWindow`（最新一条路由容量）
 *   结果 = `Math.min(100, Math.round(分子 / 分母 * 100))`
 *   **任一缺失 → null**。
 *
 * ⚠️ 宿主自陈这三个字段各自 last-wins、**不是一次原子观测**：
 * 换模型时可能配成「新容量 + 旧用量」直到下一次请求报用量。
 * 它是**u7ed9人看的参考，不是计费或闸门输入**（上游逐字说法见快照）。
 *
 * **读不到就返回 null**：没报过用量、没适配器报容量、投影整个缺席，一律 null；
 * 调用方必须照此**不渲染**（不显示 0%、不编一个百分比）。
 * @param {unknown} pressure 宿主会话投影值 `ContextPressureProjection | undefined`
 * @returns {number | null} 占用百分比，或 null（读不到）
 */
export function contextOccupancyPercent(pressure) {
	if (pressure === null || typeof pressure !== "object") return null
	const used = pressure.projectedTokens ?? pressure.pressureTokens
	const capacity = pressure.contextWindow
	if (!Number.isFinite(used) || !Number.isFinite(capacity) || capacity <= 0) {
		return null
	}
	return Math.min(100, Math.round((used / capacity) * 100))
}


// ── 素材角色 ────────────────────────────────────────────────────────────────

/** 素材角色五分类（canonical 集合；顺序即上传区下拉顺序）。 */
export const ROLES = Object.freeze([
	"学生用书",
	"教师用书",
	"考纲",
	"讲义",
	"真题",
]);

/** 按文件名猜素材角色（规则兜底，AI 识别失败时用）。 */
export function guessRoleFromName(name) {
	const n = String(name ?? "").toLowerCase();
	if (/(教师|教参|teacher|教学参考|教师用书)/.test(n)) return "教师用书";
	if (/(考纲|大纲|课标|syllabus|课程标准)/.test(n)) return "考纲";
	if (/(真题|试卷|试题|卷子|exam|paper|test)/.test(n)) return "真题";
	if (/(讲义|教案|课件|笔记|handout|notes)/.test(n)) return "讲义";
	return "学生用书";
}

// ── 材料格式（受理白名单）─────────────────────────────────────────────────────
//
// 票 `depth-review-2026-10/14`（票 12 裁决：只先拆这一档）：整段搬进**零依赖**的 `./material-formats.js`，
// 本处**原样再导出**这些名字（票 14 的 13 个 ＋ 票 `upload-formats/01` 的 3 个）——7 个 `src/`
// 消费点与既有测试的 import 面一行不改。该档的解释与
// 裁决记录（第三方事实镜像、白名单的代价、「别只改名单不改那份 `## Comments`」）跟着搬去了那一边，
// 本处不复述。
//
// ⚠️ `export … from` **不建本地绑定**：本文件其余段落里还在用的那个名字（`judgeMaterialUploadSize`
// 那一档调 `isAutoSplittableMaterial`）必须**单独 import 一次**，否则是运行期 ReferenceError
// ——票 `depth-review-2026-10/14` 实施时实测撞到过一次（`test-upload-size-precheck.mjs` 与
// `test-material-gap-stance.mjs` 当场红），而这条路径没有静态闸能提前看见。
import { isAutoSplittableMaterial } from "./material-formats.js";
// 票 `goals-handoff-missing/01`：站 3 正文文件名那一族的**唯一判据**（`goal-doc-format.js` 零依赖、
// 双侧可用）。⚠️ 写侧 `workflow/goal-doc.js` 的**读**用的是同一个文件的 `GOAL_DOC_RE`（不是这个谓词），
// 界面那张卡引的是 `renderGoalDoc`／`readGoalDoc`／`goalDocRel`——三处**共用同一份文件名形状**，
// 但**只有本文件与 `ui/view-rules.js` 这两个消费点**调 `isGoalDocRel`。
import { isGoalDocRel } from "./goal-doc-format.js";
export {
	MINERU_KNOWN_EXTENSIONS,
	MATERIAL_FORMATS,
	MATERIAL_FORMAT_EXCLUSIONS,
	MATERIAL_FORMAT_EXTENSIONS,
	// 票 `upload-formats/01`：云端通道不收的那几档（epub）＋ 两侧共用的受理判定 ＋ 四档结局。
	MATERIAL_FORMAT_OFF_CHANNEL,
	MATERIAL_INTAKE,
	judgeMaterialFileIntake,
	materialExtensionOf,
	isAcceptedMaterialFormat,
	materialFormatOf,
	originalSourceRel,
	originalPreviewOpenable,
	materialFormatFamily,
	isAutoSplittableMaterial,
	materialFormatAccept,
	unsupportedMaterialFormatMessage,
} from "./material-formats.js";

// ── 材料转换结局（per-source 三值）────────────────────────────────────────────
//
// 票 `mineru-formats/02` ＋ ADR-0028 决策 1：`meta.sources[].converted` 从布尔升成三值枚举
// `'pending' | 'ok' | 'failed'`，且**只有一个真相源**——不另开 `error` 字段（两个真相源必然不一致：
// 「转成了但报错」这种事一旦有两个字段可写，就迟早出现一个说 ok 一个说 failed）。
//
// 这份归一住在**读侧**：老书（`converted` 还是布尔）照 `=== true ? 'ok' : 'pending'` 读，
// **只读归一、不回写**——回写等于凭代码改用户那份账，而老书的两种写法读出来本来就等价。
// 写入面（上传新建、转换落定）一律直接写三值字符串，于是 `project.json` 里新老两代并存是常态。
//
// ⚠️ **「正文偏少」不是第四个态**（`CONTEXT.md`「机器检查契约原则」：字数闸门只判逐章兜底，不判**材料正文**的长短）。
// 某份「转成了、但正文很短」照旧是 `ok`；空产物（full.md 零内容）判失败是 04 的机器闸门，不是这里。

/** 材料转换结局的三个取值（canonical 集合；判定一律经 `convertedState`，别处不另写三元判据）。 */
export const CONVERTED_STATES = Object.freeze(["pending", "ok", "failed"]);

/**
 * 一份材料的转换结局 → 三值枚举。
 *
 * - 已是三个枚举值之一：原样返回；
 * - 老书布尔：`true → 'ok'`，其余（`false`／字段缺席）→ `'pending'`；
 * - 其余（不认识的值／写坏的数据）：一律 `'pending'`。
 *   ⚠️ 这个兜底方向是**故意的**：不认识的当 pending 意味着「还会被重新挑去转」，
 *   当 failed 则是「永远不动、静默消失」——后者正是这张票要治的病。
 *
 * @param {unknown} source `meta.sources[]` 的一格
 * @returns {"pending"|"ok"|"failed"}
 */
export function convertedState(source) {
	const value = source?.converted;
	if (CONVERTED_STATES.includes(value)) return value;
	return value === true ? "ok" : "pending";
}

// ── 范例章 ──────────────────────────────────────────────────────────────────

/** 范例章章号（1 基；旧账本/缺省 = 1）。meta 字段名 goldChapter 为历史遗留。 */
export function goldChapterNo(meta) {
	return Number.isSafeInteger(meta?.goldChapter) && meta.goldChapter >= 1
		? meta.goldChapter
		: 1;
}

// ── 交办阶段（ACT_STAGES）────────────────────────────────────────────────────

/**
 * 交办的 7 个阶段名 —— **本仓唯一一份手写处**（票 `depth-review-2026-10/13` 落，票 11 归属裁决）。
 *
 * 消费点**全部从它派生**，各自不许再抄一遍：`agent-tool.js` 的 `ACT_STAGES`／`ACT_STAGE_ENUM`
 * （模型看到的那句枚举）与 `workflow/engine.js` 的两张 7 键映射（段 key、推进次序）。
 * 判据：`test-agent-tool.mjs` 那道全 `src/**` 的扫描闸——第二份手写处当场红。
 *
 * ⚠️ **成员面与标签面是两个面，别合并**：
 *   · **成员面**＝本表（7 项，**含 `gate`**）。`gate` 在里面是刻意的，不是遗留：`stage-submit`
 *     有正式的 `gate` 分支，主笔要为它交出完整方案（票 11 · 2026-10-05 裁决）；
 *   · **标签面**＝`workflow/engine/labels.js` 的 `STAGE_LABELS`（**6 键、无 `gate`**）与
 *     `stageLabel()` 对 `gate` 的**特判**（标签要带关卡号）——本表**不喂**标签面，`STAGE_LABELS`
 *     也不许补 `gate`（那会造出第二个 `gate` 标签来源，与那个特判打架）。
 *   · `PHASES`／`SEGMENT_PHASE`（皆上文）与 `CHAPTER_PROGRESS_STAGES`（章节流水线那 5 个）
 *     也是**别的面**，不在这里合并。
 *
 * ⚠️ 上面那条判据的**枚举面比现实窄**（票 `dev-gate-scan/17` 的纪律）：它数的是「`src/**` 里
 * **数组字面量**形状的手写清单」，**对象键形状**（`{ explore: …, gate: …, … }`）够不着——
 * 谁把第二份清单改写成对象键，那道闸不响。engine 那两处今天正是对象键形状（本票改成派生）。
 * 反过来，**次序**同样是契约：它是 `stage-submit` 那句枚举文案里的次序（`ACT_STAGE_ENUM` 逐字）。
 */
export const ACT_STAGES = Object.freeze([
	"explore",
	"gate",
	"outline",
	"gold",
	"chapters",
	"merge",
	"final",
]);

/**
 * 最后检查被驳回之后，重新交工时**逐条交代去向**的取值域（票 `walkthrough-fixes/37`）。
 *
 * 与风格线那条 `styleCheck` 的 `adopted`／`conflict`／`superseded` **不是同一张表**，别合并：
 * 那一条答的是「你说的这条风格我怎么办」，这一条答的是「你说的这条意见我办了没有」——
 * `done`（办了）／`not-done`（没办，要一句原因）／`superseded`（不适用了）。
 *
 * ⚠️ 机器只断「**有没有逐条交代**」，⛔ **不断「交代得对不对」**——后者是维护者的手感题
 * （`docs/adr/0005` §「这条没改什么」第 2 条：没人做出的判断仍然是空的）。
 * 服务端（`src/workflow/final-redo.js`）与界面（`src/ui/view-rules.js`）都从这一份取值，
 * ⛔ 不许各抄一份枚举。
 */
export const FINAL_REDO_STATUSES = Object.freeze([
	"done",
	"not-done",
	"superseded",
]);

// ── 六阶段 ──────────────────────────────────────────────────────────────────

/**
 * 六阶段流水线（canonical 全称；进度条等窄处的短标签由各端显式派生，勿回写此处）。
 */
export const PHASES = Object.freeze([
	{ n: 1, label: "材料准备" },
	{ n: 2, label: "源探查" },
	{ n: 3, label: "教学设计" },
	{ n: 4, label: "范例章" },
	{ n: 5, label: "全章写作" },
	{ n: 6, label: "终检与交付" },
]);

/** 六阶段标签：按阶段号取 canonical 全称（未知返回空串）。 */
export function phaseLabel(n) {
	return PHASES.find((p) => p.n === n)?.label ?? "";
}

/**
 * 分段（`/textbook/process` 那批）kind → 阶段号：阶段片一格＝一个阶段＝若干分段/步；
 * 「材料准备」（阶段 1）没有分段，故本表没有 1（它就是一步）。
 * 后端 buildProcessMap（src/workflow.js）给每个分段打 phase 用它，前端把分段按阶段分组
 * 也用它——阶段片归属是双端共用的知识，两侧不许各写一份映射（单一事实源）。
 * 2026-09-21 起界面把分段读成「步」，但本表仍按机器词分段工作（见 CONTEXT.md「阶段与步」）。
 */
export const SEGMENT_PHASE = Object.freeze({
	explore: 2,
	gate: 3,
	outline: 3,
	gold: 4,
	chapter: 5,
	review: 5,
	merge: 6,
	final: 6,
});

// ── 章节流水线进度 ──────────────────────────────────────────────────────────

/**
 * Machine-valid-stage single source（机器合法 stage 的单一事实源）。
 * ui/view-rules.js 与 ui/rules.js 的展示映射有意留在各自语义层，不在这里合并。
 */
export const CHAPTER_PROGRESS_STAGES = Object.freeze([
	"writing",
	"auditing",
	"audited",
	"finalizing",
	"done",
]);

const CHAPTER_PROGRESS_LABELS = Object.freeze({
	writing: "写",
	auditing: "审",
	audited: "审完待复核",
	finalizing: "复核",
	done: "交工",
});

export const CHAPTER_PROGRESS_REQUIREMENT =
	`按章上报 progress：chapter=N；stage=${CHAPTER_PROGRESS_STAGES
		.map((stage) => `${stage}（${CHAPTER_PROGRESS_LABELS[stage]}）`)
		.join("|")}`;

/**
 * `progress` 的 `chapter`／`stage` 形状判据（票 `pre-gold-build/12` · **债-11 的单一出处**）。
 *
 * 病（改之前）：两条路都把越界 `chapter`／枚举外 `stage` **静默丢**——AI 工具面把它展开成
 * `{}` **不转发**（`agent-tool.js` 的 `progress` 分支）、HTTP 面把它判成 `null`（`chapters.js`）。
 * 不拒收、不提示、不记账：AI 写错了自己看不见，账上也没有这一笔，界面上挂的仍是旧闻。
 *
 * 今天：**拒收并点名**——返回的这句话就是 AI 看到的那条错误（工具面在发请求之前就抛、
 * HTTP 面 `reject(400, …)`）。⛔ 不改事件类型、不新开通道（沿用既有的 B 类「调用方自己把请求
 * 写错」处置：裸 400，不落「交工被拒」那条账——见 `chapters.js` 那段分类注释）。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**（照票 `dev-gate-scan/17` 的纪律写在旁边）：
 *   ① `stage` 那一半只认 `CHAPTER_PROGRESS_STAGES` 这 5 个值，**不是**「stage-brief／stage-submit
 *      的那 7 个阶段名」（那是 `ACT_STAGES`，另一张表、另一个动作族）；拿阶段名当章流水线阶段
 *      （如 `stage=explore`）在这里是越界。
 *   ② `chapter` 那一半：形状（≥1 的整数）恒判；**上限只有调用方把「这本书共几章」传进来时才判**
 *      （工具面离线早退时读不到书，只能判形状）——传 0／省略＝不判上限。
 *   ③ 它**不**判「这一章现在到底走到哪一步了」（越报阶段＝进度线漂移）——机器没有这条判据，
 *      也不假装有：那条是 `chapterPipeline` 的消费面（界面）与 AI 自查的事。
 *   ④ 它**不**判 label／detail 的语义（那是下面 `progressLineShapeProblem` 那一层）。
 *
 * @param {unknown} chapter 原始 chapter（`'3'` 这类数字字符串照旧归一化后判——归一化口径不变）
 * @param {unknown} stage   原始 stage
 * @param {number} [chapterTotal] 这本书的章数（0／省略＝不知道，不判上限）
 * @returns {string|null} `null`＝合法；否则一句话＝拒收理由（逐字点名越界的值 ＋ 合法取值）
 */
export function progressFieldProblem(chapter, stage, chapterTotal = 0) {
	const stageGiven = stage !== undefined && stage !== null;
	const chapterGiven = chapter !== undefined && chapter !== null;
	if (stageGiven && !CHAPTER_PROGRESS_STAGES.includes(String(stage))) {
		return `progress 的 stage 不在本章流水线的取值里：「${String(stage)}」——只能是 ${CHAPTER_PROGRESS_STAGES.join("|")}（要报阶段就得连 chapter=N 一起报）`;
	}
	if (chapterGiven) {
		const n = Number(chapter);
		if (!Number.isSafeInteger(n) || n < 1) {
			return `progress 的 chapter 要是第几章（1 起的整数），实得「${String(chapter)}」`;
		}
		if (Number.isSafeInteger(chapterTotal) && chapterTotal > 0 && n > chapterTotal) {
			return `progress 报的第 ${n} 章超出了这本书的章数（这本书共 ${chapterTotal} 章）`;
		}
	}
	if (stageGiven && !chapterGiven) {
		// 只报 stage 不带 chapter：以前 stage 被**静默丢**（流水线那一格收不到任何东西），
		// 现在点名——它是同一条「一起来了才有意义」的形状（`CHAPTER_PROGRESS_REQUIREMENT`）。
		return "progress 带了 stage 却没带 chapter：两者要一起报才有意义（chapter=N；stage=…）";
	}
	return null;
}

/**
 * `progress` 那一行的**最薄形状判据**（票 `pre-gold-build/12` · 债-13）。
 *
 * 病：`label`／`detail` **原样入账、原样上屏**（`src/ui/event-cards.js` 的 `⏳ ${extra}`），
 * 而 2026-10-05 走查 BUG-4① 实撞过一次——屏上写着「你已点继续」，而那一屏**根本没有**
 * 「继续」按钮（`.scratch/walkthrough-fixes/issues/19` 有记录）。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**（这一条尤其要说清，它是「最薄」的代价）：
 *   ① 它按**词形**判，不按语义判：「这句话是不是真发生过」机器判不了（要读盘／读账本），
 *      所以「说话人换一种写法」就绕过去了——真值这一半仍归 AI 自查与用户。
 *   ② 「界面上没有的动作」那一半今天只覆盖**替用户记动作**（`你已…`／`用户已…`）这一种句式；
 *      界面按钮名**没有一份机器可读的清单**接进这里（今天不新增第二份清单，指涉词只取那几个
 *      走查实撞过、且 §11.5 已逐字禁止的写法）。
 *   ③ 「承诺还没发生的事」那一半同样只有几个**最常见**的承诺词形（下一步／接下来／将要／
 *      即将／我会／计划…），「我打算」「我先去」这类近义写法不在面内。
 *   ⇒ 命中即 400 拒收并点名；**没命中不等于这句话合规**（判据只挡它看得见的那几种形状）。
 *
 * @param {string} text `label` ＋ `detail` 拼起来的那一行（原样上屏的那一份）
 * @returns {string|null} `null`＝没命中已知坏形状；否则一句话＝拒收理由（点名命中的字）
 */
export const PROGRESS_LINE_SHAPE_RULES = Object.freeze([
	{
		id: "user-action",
		re: /(?:你|您|用户)\s*已\s*(?:点|按|选|确认|认可|通过|同意|批准|暂停|继续|操作)/u,
		why: "别替用户记动作（用户动作有自己的通道：拍板／认可／留言／暂停）",
	},
	{
		id: "promise",
		re: /下一步|接下来|将要|即将|我(?:会|将)|计划(?:要|去)/u,
		why: "只说已经发生过的事，不许承诺还没发生的事",
	},
]);

export function progressLineShapeProblem(text) {
	const s = typeof text === "string" ? text : "";
	for (const rule of PROGRESS_LINE_SHAPE_RULES) {
		const hit = rule.re.exec(s);
		if (hit !== null) return `progress 那一行只叙述已经发生的事实：${rule.why}（命中的字：「${hit[0]}」）`;
	}
	return null;
}

// ── 探查教学重点/难点（teachingFocus）────────────────────────────────────────

/**
 * 单条 teachingFocus 条目 → 可读字符串（2026-09 修复 [object Object] 泄漏）。
 * 契约是 teachingFocus:[string]（见 engine.js 的 stage-brief）；但 schema 曾只写
 * `teachingFocus:[]`、未定元素形状，AI 因此偶发产出对象数组（{title/text/…} 等）。
 * 这里把常见对象形状摊平成一句话：优先取 title/text/label/content/name/item/重点/难点
 * 字段；difficulty 若存在且正文未包含则补 `（难点）`；字符串原样 trim；其余返回 ""（由调用方过滤）。
 */
export function teachingFocusText(item) {
	if (typeof item === "string") return item.trim();
	if (item === null || typeof item !== "object") return "";
	const text = [
		item.title,
		item.text,
		item.label,
		item.content,
		item.name,
		item.item,
		item.重点,
		item.难点,
	]
		.map((v) => (typeof v === "string" ? v.trim() : ""))
		.find((v) => v !== "");
	if (text === undefined) return "";
	const diff =
		typeof item.difficulty === "string" ? item.difficulty.trim() : "";
	return diff !== "" && !text.includes(diff) ? `${text}（${diff}）` : text;
}

/**
 * teachingFocus 归一化为纯字符串数组（契约形状）。
 * 非数组返回 []；空串丢弃。UI 渲染与机器验货（explore 交工）共用此函数，
 * 保证「落盘文件 / 摘要 / 页面」三处看到的都是同一份干净形状。
 */
export function normalizeTeachingFocus(items) {
	if (!Array.isArray(items)) return [];
	const out = [];
	for (const item of items) {
		const text = teachingFocusText(item);
		if (text !== "") out.push(text);
	}
	return out;
}

// ── 知识点难度（knowledgePoints[].difficulty）的取值域 ─────────────────────────
//
// 票 06 · pipeline-wiring-gaps：难度此前是自由文本——出域值不被拦、不被归一化，界面上色靠
// `confirm-cards.js` 里一张散落前端的上色表 ＋ 一个兜底灰兜着，demo 夹具里的「低」就这样
// 无声降级成灰字。同文件里 teachingFocus 因「契约写了形状」而有归一化回写，知识点没有——
// 差别就在那份契约有形状、这份没有。这里把形状补上：**取值域与归一化只此一份**（登记单点），
// 交工验货（`actions/chapters.js` explore 分支）与前端上色表都从这里取，不许各写一份。
//
// ⚠️ **四档的裁定**（票 06）：取值域 = 上色表那四格（基础/重点/难点/进阶），而不是精读契约
// 旧例的「基础|进阶|挑战」——上色表四档全有色，旧例的「挑战」没有界面承载；且「重点/难点」
// 正是主笔聚合 teachingFocus 时要的那两档，知识点初判与书级聚合同一副词才接得上。
// 旧例的「挑战」按别名收进「进阶」（旧契约写法不因改契约定成非法——归一化兜住它）。
//
// ⚠️ **id 的约定**（票 06，落档）：`knowledgePoints[].id` **非必填**。机器没有任何消费者
// 依赖它（points 比对按票 01 裁决走 title 口径；归一化点名优先用 id、没有就退 title、再退序号）；
// 精读契约里它保持示例字段而非必需项——要求一个没人用的必填键等于凭空添一道拒收。

/**
 * 知识点难度的取值域（**登记单点**）。顺序即档位序（基础→重点→难点→进阶）；
 * 前端上色表的键必须恰好是这四档（对账判据在 `test-knowledge-difficulty.mjs`）。
 */
export const KNOWLEDGE_POINT_DIFFICULTY = Object.freeze(["基础", "重点", "难点", "进阶"]);

/** 出域值的**固定别名表**（trim 后整词相等才命中）。
 *  ⚠️ **我的枚举面比现实窄在哪里**（票 `dev-gate-scan/17` 的纪律）：只认得表上这几个写法；
 *  「较难」「偏易」这类变体不命中别名、也不在取值域 ⇒ 走「认不出→没收」那一格。
 *  机器不猜语义（把「较难」猜成「难点」是在替 AI 下判断）；语义真假归真机层（ADR-0005）。 */
const KNOWLEDGE_POINT_DIFFICULTY_ALIASES = Object.freeze({
	挑战: "进阶",
	低: "基础",
	简单: "基础",
	容易: "基础",
	高: "难点",
	困难: "难点",
});

/** 归一化记录里的**原值**展示：字符串带引号、其余 JSON 化、超 60 字截断（票 13）。
 *  人读提示，不承载数据。难度归一化与章字段机器改写提示（`workflow/actions/chapters.js`）
 *  消费**同一实现**——各写一份「同一口径」正是总纲点名的自称病，引号/截断那几行只此一份。
 *  `missing` 是 undefined 的叫法，语境不同不替调用方统一：难度说「没写」，章字段说「没交」。 */
export function rawValueText(v, missing = "没写") {
	if (v === undefined) return missing;
	const text = typeof v === "string" ? `「${v}」` : (JSON.stringify(v) ?? String(v));
	return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

/**
 * 单个难度值 → 取值域内的值（或 "" ＝无难度）。
 *
 * 返回 `{ value, detail }`：`value` 是归一化后的值（取值域之一或 ""）；`detail` 是**人话改动
 * 记录**（null ＝ 没改东西，不记）。裁决顺序：在域原样 → trim（与 teachingFocus 同口径：
 * trim 不是改档，不记）→ 别名收编 → 认不出没收（`value` 落 ""，difficulty 键将被移除——
 * 「无难度」是合法形状，机器不替 AI 猜一个）。undefined/null/空串本来就是「无难度」，不算改动。
 *
 * @param {unknown} raw
 * @returns {{value: string, detail: string|null}}
 */
export function normalizeKnowledgePointDifficulty(raw) {
	if (raw === undefined || raw === null) return { value: "", detail: null };
	if (typeof raw !== "string") {
		return {
			value: "",
			detail: `难度 ${rawValueText(raw)} 不是文本、也不在取值域（${KNOWLEDGE_POINT_DIFFICULTY.join("/")}），机器没收这个难度（按无难度收）`,
		};
	}
	const text = raw.trim();
	if (text === "") return { value: "", detail: null };
	if (KNOWLEDGE_POINT_DIFFICULTY.includes(text)) return { value: text, detail: null };
	const alias = KNOWLEDGE_POINT_DIFFICULTY_ALIASES[text];
	if (alias !== undefined) {
		return {
			value: alias,
			detail: `难度 ${rawValueText(raw)} 不在取值域（${KNOWLEDGE_POINT_DIFFICULTY.join("/")}），机器按「${alias}」收下`,
		};
	}
	return {
		value: "",
		detail: `难度 ${rawValueText(raw)} 认不出（取值域：${KNOWLEDGE_POINT_DIFFICULTY.join("/")}），机器不猜语义、没收这个难度（按无难度收）`,
	};
}

/**
 * 一列知识点 → difficulty 归一化后的新数组 ＋ 改动记录。
 *
 * 只动 `difficulty` 一键：认不出/非文本时**移除**该键（落成合法的「无难度」），其余字段一字
 * 不动（机器只搬难度，不越权改写内容）；不是对象的条目原样通过。改动记录的**点名**优先
 * `id`、退 `title`、再退「第 N 条」（id 非必填——见上方的约定）。
 *
 * @param {unknown[]} rows
 * @returns {{points: unknown[], edits: Array<{point: string, field: "difficulty", detail: string}>}}
 */
export function normalizeKnowledgePointDifficulties(rows) {
	if (!Array.isArray(rows)) return { points: [], edits: [] };
	const points = [];
	const edits = [];
	for (let i = 0; i < rows.length; i += 1) {
		const row = rows[i];
		if (row === null || typeof row !== "object" || Array.isArray(row)) {
			points.push(row);
			continue;
		}
		if (!Object.hasOwn(row, "difficulty")) {
			points.push(row);
			continue;
		}
		const { value, detail } = normalizeKnowledgePointDifficulty(row.difficulty);
		const next = { ...row };
		if (value === "") delete next.difficulty;
		else next.difficulty = value;
		points.push(next);
		if (detail !== null) {
			const label = typeof row.id === "string" && row.id.trim() !== ""
				? row.id.trim()
				: typeof row.title === "string" && row.title.trim() !== ""
					? row.title.trim()
					: `第 ${i + 1} 条`;
			edits.push({ point: label, field: "difficulty", detail: `知识点「${label}」：${detail}` });
		}
	}
	return { points, edits };
}

// ── 知识点覆盖闸门的口径单点（票 12 · pipeline-wiring-gaps）────────────────────
//
// 病（verification.md 第 8、11 条）：知识地图的 knowledgePoints 与章节骨架的 points 之间
// 没有任何机器约束——「每个知识点都要在骨架里找到归属」全靠 AI 自查或用户人眼，14 项质量门
// 无一项触碰这两个字段。
//
// ⚠️ **口径全部来自票 01 的裁决（2026-09-29 用户拍板，见该票 `## Comments`），不在这里另裁**：
//   · `points` 按 **title 单键**与知识地图比对，`knowledgePoints[].id` 不接进比对环
//     （id 在 src/ 里是只写字段，实测 54 条 id 口径 0 命中）；
//   · 匹配前**先规范化**：去尾部括注、trim、全半角——真书 54 条里唯一的失配就是尾部括注
//     （outline 写「马克思的双重发现」，词条标题「马克思的双重发现（历史问题）」），
//     且那处失配在同一源内部 ⇒ 复合键 `(source, title)` 对它无效，规范化才对症（裁决原文）。
//
// ⚠️ **我的枚举面比现实窄在哪里**（票 `dev-gate-scan/17` 的纪律）：规范化只做裁决点名的三件事
// （尾部括注/trim/全半角）。中间空格差异、同义词、错别字、语序颠倒都不在枚举面内——它们
// 规范化后仍不相等，会走「失配」那一格。机器不猜语义，语义真假归真机层（ADR-0005）；
// 失配的后果由闸门另一侧的豁免出口（`other`）承接，不靠放宽口径。

/**
 * 知识点 title 的**比对键**：去尾部括注（可叠层，全角半角括号在 NFKC 后同形）→ trim。
 * 非字符串落空串（调用方把空串当「进不了比对环」处理，不冒充命中也不冒充失配）。
 *
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizeKnowledgePointTitle(raw) {
	if (typeof raw !== "string") return "";
	// NFKC：全角字母数字/括号/空格折成半角；CJK 字符不变。裁决说的「全半角」就落在这里。
	let text = raw.normalize("NFKC").trim();
	// 尾部括注可叠层（「负载率（基础）(补充)」）——循环剥到剥不动为止。
	for (;;) {
		const stripped = text.replace(/\s*\([^()]*\)$/, "").trim();
		if (stripped === text) break;
		text = stripped;
	}
	return text;
}

/**
 * 知识点覆盖比对（**两头都查**，票 12）：知识地图里每个知识点都要在骨架 `chapters[].points`
 * （title 口径）里找到归属；骨架 points 里出现知识地图没有的条目同样要点名。
 *
 * 只比 title 键：`knowledgePoints[].source` 与骨架 `chapters[].source` 不进比对环
 * （票 01 裁决——同名知识点跨源同名是合法的，单键口径下无需区分）。
 *
 * @param {unknown[]} knowledgePoints 知识地图的 `knowledgePoints`
 * @param {unknown[]} chapters 章节骨架（`{points: [...]}` 或等价形状）
 * @returns {{claims: Array<{title: string, chapters: number[]}>, unclaimed: string[], foreign: Array<{chapter: number, title: string}>}}
 *   `claims`：每个知识点（title 原样）被哪几章认领（章号 1 基、升序；界面「必须覆盖 ↔ 已认领」对应关系吃它）；
 *   `unclaimed`：没被任何一章认领的知识点（title 原样，供拒交文案点名）；
 *   `foreign`：骨架里知识地图没有的条目（原样 trim 后的写法 ＋ 章号）。
 */
export function outlinePointsCoverage(knowledgePoints, chapters) {
	const kps = Array.isArray(knowledgePoints) ? knowledgePoints : [];
	const rows = Array.isArray(chapters) ? chapters : [];
	// 归一化键 → 首个原样 title（点名用原样写法，不拿归一化串糊人）。
	const byKey = new Map();
	for (const kp of kps) {
		const title = typeof kp?.title === "string" ? kp.title : "";
		const key = normalizeKnowledgePointTitle(title);
		if (key !== "" && !byKey.has(key)) byKey.set(key, title);
	}
	// 章节侧的归一化键**一次算好**：foreign 与 claims 两面消费同一份，同一个串不归一化两遍
	// （归一化含 NFKC 与剥括注循环，对每个知识点把全部章节重扫重算是白付的代价；两面共用一份
	// 也免去「同一章在两圈里算出不同键」的可能）。
	const chapterKeys = rows.map((chapter) => {
		const pts = Array.isArray(chapter?.points) ? chapter.points : [];
		const entries = [];
		for (const pt of pts) {
			if (typeof pt !== "string") continue; // 非字符串进不了比对环（outline 归一化早已强转过）
			const key = normalizeKnowledgePointTitle(pt);
			if (key === "") continue;
			entries.push({ key, raw: pt.trim() });
		}
		return entries;
	});
	const claimedKeys = new Set();
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

// ── 被剔除的知识点：那份**人的裁决产物**（票 `knowledge-graph-build/09` · spec §9 · ADR-0039）──
//
// 「在图上划掉一张」＝「这本书不需要这个主题」⇒ 那一条**离开覆盖闸门的判据面**。ADR-0039 决策 2 把
// 这件事钉死：闸门的规则／实现／豁免**一个字不改**，变的是**喂给它的集合**＝「知识点 − 被剔除的」。
// ⇒ 本段是那一份集合的**唯一出处**（纯函数：不读盘、不写盘、不读时钟）：
//   ① 那份人产物的**形状**（{@link exclusionProblems}）；
//   ② 哪些裁决**今天还算数**（{@link liveExclusionsOf}：键没了、或键在而 title 变了 ⇒ 陈旧）；
//   ③ 喂给闸门的那一份（{@link effectiveKnowledgePoints}）。
// 读盘那一半住 `workflow/knowledge-map-exclusions.js`（唯一读侧入口）；界面与交办读**同一对纯函数**
// ——spec §9 的「一处口径、三处读者」（①覆盖闸门 ②两张确认卡 ③`outline` 交办）就是靠这一句成立的。
//
// ⚠️ **为什么 `key` 与 `title` 两样都记**（spec §9 逐字）：合并件是机器重拼的产物（重做探查／老书补图
// 都会重拼），重拼之后卡的 `key` 可能没了、也可能键还在而 `name` 改了。只记 `key` 分不出「这一张换
// 了标题」；只记 `title` 认不出「卡没了」。⇒ 两样都记，**陈旧在读取侧现算、⛔ 不写回文件**：
// 「已失效 N 条」是一条非阻断读数（形状坏了才是硬闸），⛔ 不整份失效——一次重造把人几十次判断清零
// ＝劝人别判。

// ⚠️ 那两个常量住在文件顶部（`SWEEP_EXCLUDED` 在模块初始化时就要引用它，放这里会踩 TDZ）。

/** `reason` 的一档：**本书不覆盖这个主题**（归本 effort 的 `knowledge-graph-build`）。 */
export const EXCLUSION_REASON_NOT_NEEDED = "不需要";

/** `reason` 的另一档：**读者已经会了**（下沿，归 `reader-cognition-boundary`；本 effort 只留这一格）。 */
export const EXCLUSION_REASON_ALREADY_KNOWN = "已经会";

/**
 * `reason` 的闭式取值域——**两种语义共用这一份记录**（ADR-0039 决策 3 逐字）：
 * `不需要`（本书不覆盖这个主题，归本 effort）与 `已经会`（下沿，归邻居那族），差别只在这一格。
 * ⚠️ 邻居那族今天**还没有入口**（问卷那一半归 `reader-cognition-boundary`）⇒ 本 effort 只写
 * `不需要`；这一格留在这儿，是为了两族收口时**按 `reason` 分区**而不是长成两份产物（见票 09 的 `## Answer`)。
 */
export const EXCLUSION_REASONS = Object.freeze([EXCLUSION_REASON_NOT_NEEDED, EXCLUSION_REASON_ALREADY_KNOWN]);

/** 谁裁的：这份件上**只有人的裁决**（机器只是代笔落盘）⇒ `by` 今天只有一个值。 */
export const EXCLUSION_BY_USER = "user";

/**
 * **写作面**那一档的标记（spec §9 逐字）：被剔除的卡正好是留下卡的前置时，它**留在图上与链上**、
 * 只是带这一句「这本书不造它」。⛔ 不剪、不硬传播、不提前拦。
 *
 * ⚠️ **本票只落「那句话的出处 ＋ 读侧」**（{@link notInBookMarkOf}）：真正的接线归票 `10`
 * （写作面两个既有槽），那时它读同一份件、用这一个常量。它与跨章审计那一句
 * （住 `workflow/cross-audit-ledger.js` 的 `UNCLAIMED_DROPPED_TEXT`：没被任何章认领的卡在
 * **人已划掉**时的那一版）是**同一份事实的两个读者面**，⛔ 不是两句话各说一半。
 * ⚠️ 这两句字面量在 `src/` 里**各只许有一处声明**（判据逐份数：写作面这一句只住本文件）。
 */
export const NOT_IN_BOOK_MARK = "本书不造（人已划掉）";

function isPlainRecord(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyText(value) {
	return typeof value === "string" && value.trim() !== "";
}

/**
 * 那份人产物的**形状判据**（票 09 §A：形状坏了＝**硬闸**）。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**（票 `dev-gate-scan/17` 的纪律）：它只看得见
 * `{ items: [{ key, title, reason, by, at }] }` 这**一层**——`key` 是否真在合并件的图上、
 * `title` 是否与今天那张卡同名，**不在**这里（那是 {@link liveExclusionsOf} 的活，且是软读数）。
 * 它**不读盘**：坏 JSON 由调用方（读侧）翻成一条 problem 再进来。
 *
 * @param {unknown} document
 * @returns {string[]} 逐条点名的问题（空数组＝形状成立）
 */
export function exclusionProblems(document) {
	if (!isPlainRecord(document)) return ["那份人写的裁决件不是一个 JSON 对象"];
	if (!Array.isArray(document.items)) return ["那份人写的裁决件里没有 `items` 数组"];
	const problems = [];
	const seen = new Set();
	document.items.forEach((item, index) => {
		const at = `items[${index}]`;
		if (!isPlainRecord(item)) {
			problems.push(`${at} 不是一条记录`);
			return;
		}
		if (!nonEmptyText(item.key)) problems.push(`${at} 缺 \`key\`（或不是非空文本）`);
		if (!nonEmptyText(item.title)) problems.push(`${at} 缺 \`title\`（或不是非空文本）`);
		if (!EXCLUSION_REASONS.includes(item.reason)) {
			problems.push(`${at} 的 \`reason\` 是 ${JSON.stringify(item.reason)}，不在「${EXCLUSION_REASONS.join("／")}」里`);
		}
		if (!nonEmptyText(item.by)) problems.push(`${at} 缺 \`by\`（谁裁的）`);
		if (!Number.isSafeInteger(item.at) || item.at <= 0) problems.push(`${at} 缺 \`at\`（裁决时刻，毫秒时间戳）`);
		if (nonEmptyText(item.key)) {
			if (seen.has(item.key)) problems.push(`${at} 的 \`key\` ${JSON.stringify(item.key)} 在这一份里出现了两次（同一张卡只该有一条裁决）`);
			seen.add(item.key);
		}
	});
	return problems;
}

/**
 * 那份件里的条目（形状坏了返回空数组——**坏形状要报就走 {@link exclusionProblems}**，
 * 这里不冒充「一条都没有」）。
 *
 * @param {unknown} document
 * @returns {object[]}
 */
export function exclusionItemsOf(document) {
	if (exclusionProblems(document).length > 0) return [];
	return document.items.map((item) => ({
		key: item.key,
		title: item.title,
		reason: item.reason,
		by: item.by,
		at: item.at,
	}));
}

/**
 * 从一份**文本**里解析那份人产物（界面侧用：那份件的原文随 `/textbook/events` 下发）。
 *
 * ⚠️ 「读不出」与「不在场」是两件事，这里分得开：空／非字符串 ⇒ `items: []` 且**没有问题**
 * （＝这本书上还没有裁决）；不是 JSON ⇒ 一条 problem（形状坏了＝硬闸，票 09 §A）。
 *
 * @param {unknown} text
 * @returns {{items: object[], problems: string[]}}
 */
export function parseExclusionsDocument(text) {
	if (typeof text !== "string" || text.trim() === "") return { items: [], problems: [] };
	let document = null;
	try {
		document = JSON.parse(text);
	} catch {
		return { items: [], problems: [`\`${KNOWLEDGE_MAP_EXCLUSIONS_REL}\` 不是 JSON`] };
	}
	return { items: exclusionItemsOf(document), problems: exclusionProblems(document) };
}

/**
 * 从一份解析好的件里取**被剔除的卡键**（**读侧前向兼容**：坏形状／键认不出 ⇒ 空集）。
 *
 * ⚠️ 这一支是给「只想知道哪些卡被人划掉了」的读者用的（跨章审计那一句人话）：它**不问陈旧**
 * ——陈旧那一档（键没了／title 变了）由 {@link liveExclusionsOf} 判，两个问题不许混成一个。
 *
 * @param {unknown} document
 * @returns {Set<string>}
 */
export function exclusionKeysOf(document) {
	const keys = new Set();
	for (const item of Array.isArray(document?.items) ? document.items : []) {
		if (nonEmptyText(item?.key)) keys.add(item.key);
	}
	return keys;
}

/**
 * 把那份裁决按**今天这份合并件**分成两档：还算数的（`live`）与陈旧的（`stale`）。
 *
 * 还算数 ＝ 图上**真有这个键**的那张卡，且它的 `name` 与记下的 `title` 归一化后**相等**。
 * 键没了、或键在而 title 变了 ⇒ 陈旧（spec §9 逐字）⇒ **该条不生效**，但它**不整份失效**：
 * 其余条目照旧算数，`stale` 只是一条非阻断读数。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：它只看得见 `cards[].key` 与 `cards[].name` 两样——
 * 卡上别的字段（`anchor`／`locations`／`difficulty`）动了**不算陈旧**（那是同一张卡的修订，
 * 不是「换了一条知识点」）；`name` 缺／非文本的卡与它配不上，按陈旧处理（宁可报失效，不硬认）。
 *
 * @param {object[]} items 那份件里的条目
 * @param {object[]} cards 合并件的 `cards[]`
 * @returns {{live: object[], stale: object[]}} 两档都保持原顺序
 */
export function liveExclusionsOf(items, cards) {
	const rows = Array.isArray(items) ? items.filter(isPlainRecord) : [];
	const byKey = new Map();
	for (const card of Array.isArray(cards) ? cards : []) {
		if (!isPlainRecord(card) || !nonEmptyText(card.key)) continue;
		if (!byKey.has(card.key)) byKey.set(card.key, card);
	}
	const live = [];
	const stale = [];
	for (const item of rows) {
		const card = byKey.get(item.key);
		const cardKey = card === undefined ? "" : normalizeKnowledgePointTitle(card.name);
		const titleKey = normalizeKnowledgePointTitle(item.title);
		if (card !== undefined && cardKey !== "" && cardKey === titleKey) live.push(item);
		else stale.push(item);
	}
	return { live, stale };
}

/**
 * **喂给覆盖闸门与 `outline` 交办的那一份集合**（ADR-0039 决策 1：判据面＝`knowledgePoints` 减掉
 * 那份人的裁决）。闸门自己一个字不改——`outlinePointsCoverage(这份, chapters)` 照旧只比 title 单键。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：剔除按 **title 归一化后的相等**走（与闸门同一把尺子），
 * ⇒ 同一个 title 的多条知识点会**一起**被剔掉——title 是闸门唯一的比对键，这里也只能按 title 剔
 * （想逐条剔就得先给闸门加第二个键，那正是 ADR-0039 说「先回来重画 Destination」的事）。
 * 归一化后为空串的 title 不进剔除环（它本来就进不了闸门的比对环）。
 *
 * @param {unknown[]} knowledgePoints 合并件的 `knowledgePoints`
 * @param {object[]} live {@link liveExclusionsOf} 里还算数的那一档
 * @returns {object[]} 留下的知识点（原样条目，顺序不变）
 */
export function effectiveKnowledgePoints(knowledgePoints, live) {
	const dropped = new Set();
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

/**
 * **逐点豁免**：这笔豁免到底**点名放弃**了哪几条点（票 `kn-unowned-silent/02`，维护者 2026-10-27
 * 「按推荐」：上限 20 保留，越界不许静默丢；豁免必须结构化到点）。
 *
 * 纯函数（不读盘、不读时钟）：喂进来一份「豁免记录的形状」，回一份**点名清单**——
 * 于是三个读者（服务端闸门、`outline` 交办、界面卡片）读的是同一份判据，⛔ 不各写一份 `filter`。
 *
 * ⚠️ **形状只认两种条目**：非空字符串（title）与 `{id?, title, chapter?}`（`title` 非空才算）。
 * ⚠️ **我的枚举面比现实窄在哪里**：比对键是 **title 归一化**（与 {@link outlinePointsCoverage}
 * 同一把尺子：去尾部括注/trim/全半角）——同一个 title 的多条点会**一起**被放行，`id` 只进记录
 * 不进比对环（想按 id 判就得先给覆盖闸门加第二个键，那是 ADR-0039 说的「先回来重画 Destination」）。
 * 它也不判「这个点该不该放弃」：那是人的意思，机器只读他点过的名。
 *
 * @param {unknown} waiver 一条豁免记录（`meta.waivers[]` 的元素）
 * @returns {{id?: string, title: string, chapter?: number}[]} 点名清单（原顺序、原样 title）
 */
export function waivedPointsOf(waiver) {
	if (!isPlainRecord(waiver)) return [];
	const rows = Array.isArray(waiver.waivedPoints) ? waiver.waivedPoints : [];
	const out = [];
	for (const raw of rows) {
		const title = typeof raw === "string"
			? raw
			: (isPlainRecord(raw) && typeof raw.title === "string" ? raw.title : "");
		const trimmed = title.trim();
		if (trimmed === "") continue;
		const point = { title: trimmed };
		if (isPlainRecord(raw) && typeof raw.id === "string" && raw.id.trim() !== "") point.id = raw.id.trim();
		if (isPlainRecord(raw) && Number.isSafeInteger(raw.chapter) && raw.chapter >= 1) point.chapter = raw.chapter;
		out.push(point);
	}
	return out;
}

/**
 * 这一条检查上、这一本书**适用**的豁免记录（票 `kn-unowned-silent/02`）。
 *
 * 作用域口径与 `engine.js` 的 `waived()` 同源（那条是布尔闸，这条要读出**记录本身**）：
 * `item` 必须是 `other`、`userNote` 非空、`scope{book, check}` 逐字相等。
 *
 * ⚠️ **章不在这里判**：`scope.chapter` 的语义是「这条记录在哪一章的上限那一步减负」，
 * 而 `waivedPoints[]` 的每个条目自己也可能带章号——两者合成一个「这个点归哪一章」的答案，
 * 那件事只住 {@link waivedPointsFor} 一处。⛔ 别在这里再判一次章：两层章过滤里总有一层是死代码，
 * 而死的那层会让「删掉它也不红」看起来像判据——变异测试实测过这个形状。
 *
 * ⚠️ 它是「逐点豁免」在**读取面**的唯一匹配处：`waivedPointsFor` 从它出发，
 * ⛔ 不各写一份 `item/scope` 过滤（两份必然漂，而漂了没人看得见）。
 *
 * @param {object[]} waivers `meta.waivers[]`
 * @param {{book: string, check: string}} scope
 * @returns {object[]} 命中的记录（原顺序）
 */
export function waiversForCheck(waivers, scope) {
	const wantBook = typeof scope?.book === "string" ? scope.book : "";
	const wantCheck = typeof scope?.check === "string" ? scope.check : "";
	if (wantBook === "" || wantCheck === "") return [];
	return (Array.isArray(waivers) ? waivers : []).filter((waiver) => {
		if (!isPlainRecord(waiver) || waiver.item !== "other") return false;
		if (typeof waiver.userNote !== "string" || waiver.userNote.trim() === "") return false;
		const s = waiver.scope;
		if (!isPlainRecord(s)) return false;
		return s.book === wantBook && s.check === wantCheck;
	});
}

/**
 * 这一条检查上**算在这一章头上**的点名清单（票 `kn-unowned-silent/02`；服务端与界面共用）。
 *
 * 章归属的**唯一判法**（⛔ 别在调用点各写一遍——两处漂了，屏上印的数就与机器少收的数对不上）：
 *   · 点条目自己带 `chapter` ⇒ 用它（迁移真书时就是这么逐条记的）；
 *   · 否则落到**记录自己**的章号（`scope.chapter`，按章记录）；
 *   · 两处都没有章号（书级记录 ＋ 条目没写章号）⇒ 这一条**不归任何章**：只有**问哪几章带着它**时
 *     才算（`{ chapter, points }` 给了候选点，那就按 title 是否在场判定；见 {@link splitWaivedPoints}）。
 *     为什么这样：书级记录从来不知道「这个点属于哪一章」，替它猜一个章号就等于让屏与机器各说一套。
 *
 * @param {object[]} waivers `meta.waivers[]`
 * @param {{book: string, check: string, chapter?: number}} scope 见 {@link waiversForCheck}
 * @returns {{id?: string, title: string, chapter: number|null}[]}
 *   `chapter` 是**解析后**的归属（可能是 `null` ＝ 不知道，⛔ 不是「全书」）
 */
export function waivedPointsFor(waivers, scope) {
	const wantChapter = Number.isSafeInteger(scope?.chapter) ? scope.chapter : undefined;
	const out = [];
	for (const waiver of waiversForCheck(waivers, scope)) {
		const scopeChapter = Number.isSafeInteger(waiver?.scope?.chapter) ? waiver.scope.chapter : null;
		for (const point of waivedPointsOf(waiver)) {
			const chapter = Number.isSafeInteger(point.chapter) ? point.chapter : scopeChapter;
			// 问的是某一章 ⇒ 别的章的点**不算**（同一条书级记录在另一章点数上不许减负）。
			if (wantChapter !== undefined && chapter !== null && chapter !== wantChapter) continue;
			out.push({ ...point, chapter });
		}
	}
	return out;
}

/**
 * 把一组点按「**被点名放弃**的」与「没点名的」分开（票 `kn-unowned-silent/02`）。
 *
 * 三处覆盖判据（`outline` 交工的未认领点、单章缺覆盖、单章写进已划掉的点）与单章上限那一步
 * 都走这一个函数——⛔ 不许在调用点各自 `filter` 一遍（那会长出第二份「怎么算被点名」）。
 *
 * @param {object[]} waivers `meta.waivers[]`
 * @param {{book: string, check: string, chapter?: number}} scope 见 {@link waiversForCheck}
 * @param {unknown[]} titles 待分类的点（原样写法）
 * @returns {{waived: string[], kept: string[]}} 两个数组都保留**原样写法、原顺序**
 */
export function splitWaivedPoints(waivers, scope, titles) {
	const keys = new Set();
	for (const point of waivedPointsFor(waivers, scope)) {
		const key = normalizeKnowledgePointTitle(point.title);
		if (key !== "") keys.add(key);
	}
	const waived = [];
	const kept = [];
	for (const raw of Array.isArray(titles) ? titles : []) {
		const title = String(raw ?? "").trim();
		if (title === "") continue;
		const key = normalizeKnowledgePointTitle(title);
		if (key !== "" && keys.has(key)) waived.push(title);
		else kept.push(title);
	}
	return { waived, kept };
}

/**
 * **本章该写哪些点**：章 `points` 与 `effective` 的交集（spec `exclusion-flow` 决策 1；F1 的「减」那一半）。
 *
 * 划卡**从不改 `meta.outline`**（史实不改），所以「本章覆盖判据该读哪一份」必须在**判据面**上现算：
 * 喂进来的是本章 `points` 与 {@link effectiveKnowledgePoints} 给出的 `effective`，留下归一化后仍在
 * `effective` 里的那些条目（原顺序、原样写法）。
 *
 * ⚠️ **这是「本章 points ∩ effective」在 `src/` 里的唯一实现**（spec 决策 1 的判据）：四处消费者
 * 不许各自 `points.filter(...)` 一遍——四份里任何一份漂了都不会红，正是本 effort 要治的病。
 * ⚠️ **我的枚举面比现实窄在哪里**：与 {@link effectiveKnowledgePoints} 同一把尺子，只看得见 **title**；
 * 同一个 title 的多条 points 会**一起**留下／一起走。归一化后为空串的条目**原样留下**（它本来就进不了
 * 闸门的比对环，不能在这里被冒充成「被划掉」）。它不判「讲透了没有」——留下的仍要过
 * `missingChapterPoints` 那道形状级判据，一个字不放宽。
 * ⚠️ **调用方的前置条件**：只有那份件里有 `live` 裁决时才调它。原因是老书／无知识地图的书
 * `effective` 可能是空数组——无条件求交会把覆盖闸整个关掉；调用点的那条守卫（`live.length === 0`
 * 时一个字节都不改）是「老书行为逐字相同」的保证。代价如实记：有 live 裁决时，points 里**地图外**
 * 的条目也会被这条交集吞掉（它本来就该在 `outline` 那一跳被点名，不属于本判据的射程）。
 *
 * @param {unknown[]} chapterPoints 本章 `outline.chapters[n-1].points`
 * @param {unknown[]} effective {@link effectiveKnowledgePoints} 给出的那一份
 * @returns {unknown[]} 留下条目的原样写法（顺序不变）
 */
export function effectiveChapterPoints(chapterPoints, effective) {
	const kept = new Set();
	for (const kp of Array.isArray(effective) ? effective : []) {
		const key = normalizeKnowledgePointTitle(typeof kp?.title === "string" ? kp.title : "");
		if (key !== "") kept.add(key);
	}
	const points = Array.isArray(chapterPoints) ? chapterPoints : [];
	return points.filter((entry) => {
		const raw = typeof entry === "string" ? entry : "";
		const key = normalizeKnowledgePointTitle(raw);
		return key === "" || kept.has(key);
	});
}

/**
 * **一段正文里出现了哪些「人已划掉」的 title**（F1 的「加」那一半与 F3 的成品判据共用这一把尺子）。
 *
 * 判据与 `missingChapterPoints`（`actions/chapters.js`）**同一把尺子**：正文原样含这一条，或
 * 正文与该条走**同一份规范化**（{@link normalizeKnowledgePointTitle}）之后含它。问的是**反问题**
 * ——「不该有的有没有」。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：只判 **title 在场**，而且扫的是**喂进来的整段文本**（章正文
 * 含 loader 区块与练习/答案；成品只喂**切出来的每一章那一段**——书名/前言/loader 段不在扫面）；
 * 单字 title 还会命中更长词里的子串（「甲」命中
 * 「甲骨文」「甲方案」）。正文里出现一个被划掉的 title 也完全可能是**正常行文引用**——机器分不出
 * 「引用 vs 讲解」，所以它只会报「这一串在不在」，⛔ 不证「这一段真的在讲它」。这就是两条消费者
 * **都必须可豁免**的原因（F1 走「其他 · 知识点覆盖齐全」按章点名；F3 走它自己那条检查名）。
 *
 * @param {unknown[]} titles 那份件里「今天还算数」的裁决（`live`）的 title
 * @param {unknown} text 要扫的正文（读不到就传空串）
 * @returns {string[]} 命中的 title（trim 后的原样写法，去重、保持传入顺序）
 */
export function excludedTitlesInText(titles, text) {
	const body = typeof text === "string" ? text : "";
	const bodyNorm = normalizeKnowledgePointTitle(body);
	const hits = [];
	const seen = new Set();
	for (const entry of Array.isArray(titles) ? titles : []) {
		const raw = typeof entry === "string" ? entry.trim() : "";
		if (raw === "" || seen.has(raw)) continue;
		if (!body.includes(raw)) {
			const key = normalizeKnowledgePointTitle(raw);
			if (key === "" || !bodyNorm.includes(key)) continue;
		}
		seen.add(raw);
		hits.push(raw);
	}
	return hits;
}

/**
 * 记一条裁决（**纯函数**：新数组，同 `key` 覆盖旧的——同一张卡只留最新那一条）。
 *
 * @param {object[]} items
 * @param {{key: string, title: string, reason: string, by: string, at: number}} entry
 * @returns {object[]}
 */
export function addExclusion(items, entry) {
	const rows = (Array.isArray(items) ? items : []).filter((item) => isPlainRecord(item) && item.key !== entry?.key);
	return [...rows, { key: entry.key, title: entry.title, reason: entry.reason, by: entry.by, at: entry.at }];
}

/**
 * 放回来（「↩ 放回来（要讲）」）：把这一条从那份件里去掉（**纯函数**）。
 *
 * ⚠️ 全部放回来之后那份件**仍然在盘上、只是 `items: []`**（有意，见票 09 的 `## Answer`）：
 * 「删文件」是一次不可逆的删除，而「这一本书上人判过、现在没有一条不讲」本身就是一条事实。
 *
 * @param {object[]} items
 * @param {string} key
 * @returns {object[]}
 */
export function removeExclusion(items, key) {
	return (Array.isArray(items) ? items : []).filter((item) => isPlainRecord(item) && item.key !== key);
}

/** 落盘形态（**唯一渲染器**：与人读的那份逐字一致）。 */
export function renderExclusions(items) {
	return `${JSON.stringify({ items: Array.isArray(items) ? items : [] }, null, 2)}\n`;
}

/**
 * **写作面**那一档的标记（票 `10` 的出口）：这张卡被人划掉了就返回 {@link NOT_IN_BOOK_MARK}，否则空串。
 *
 * ⚠️ 问的是「键在不在那份件里」（前向兼容口径），⛔ **不问陈旧**：陈旧那一档是读取侧的软读数
 * （重造探查之后），而写作面要的是「人划过它没有」这个史实。两张面各自如实报，谁都不替对方改口径。
 *
 * @param {string} key
 * @param {Iterable<string>|null} [excludedKeys]
 * @returns {string}
 */
export function notInBookMarkOf(key, excludedKeys = null) {
	if (excludedKeys === null || excludedKeys === undefined) return "";
	for (const one of excludedKeys) if (one === key) return NOT_IN_BOOK_MARK;
	return "";
}

// ── 上传上限（**两条是两件事**）────────────────────────────────────────────────
//
// 票 10：仓门 500MB 与 MinerU 200MB 是**两个不同的事实**，各有各的出处与后果，
// 合成一句就是在骗人——所以它们各有各的常量、各有各的人话，判据一次只说一句。
//
//   · `MAX_UPLOAD_BYTES`（500MB）：**本仓自己**的闸门。前端预检与后端 `readRawBody`
//     （`src/workflow.js` 的 413）共用同一常量，两侧不许各写一份（202-09 上传幂等/413 修复收拢）。
//   · `MINERU_MAX_BYTES`（200MB）：**第三方**的限制，官方限制项表 ＋ 错误码 `-60005`。
//     票 10 把它从 `src/mineru-lib.js` 搬到这里，原因与票 07 搬 `MINERU_KNOWN_EXTENSIONS` 同源：
//     **上传前那道预检长在浏览器里**（`src/ui/event-cards.js` 的 UploadArea），而 `mineru-lib.js`
//     只被 Node 侧 import、住那边前端就永远拿不到，只能自己抄一个 200 —— 那正是本票要治的病。

/**
 * 单份材料上传上限（用户拍板 500MB）。前端预检、后端 readRawBody 强制共用同一常量，
 * 两侧不许各写一份（2026-09 上传幂等/413 修复收拢）。
 */
export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

/**
 * MinerU 云端单份文件大小上限（官方限制项表 ＋ `-60005`：>200MB 拒收）。
 *
 * ⚠️ 它与上面那道**不是一回事**：过了这道（≤500MB）照样可能在 MinerU 那一侧撞墙。
 * `src/mineru-lib.js` 原样再导出它（拆段那条链路的默认值取的就是这一份，全仓只有这一处字面量）。
 */
export const MINERU_MAX_BYTES = 200 * 1024 * 1024

/** 超限人话提示（前端预检与后端 413 同一文案，避免两处措辞漂移）。票 09：原件不叫「PDF」。 */
export function uploadTooLargeMessage() {
	return `这份材料超过 500MB 上传上限，请拆成多份（每份 <500MB）后分别上传`;
}

/** MinerU 200MB 那道 · 非 PDF：自动切开对它不生效 ⇒ **一律**请用户自己拆，不许暗示会自动拆。 */
export function mineruTooLargeManualSplitMessage() {
	return `这份材料超过 MinerU 单份 200MB 的上限。请把它拆成几份（每份 <200MB）后分别上传，或先压缩再传。`;
}

/** MinerU 200MB 那道 · PDF 但**本机切不开**（没探到 Python + PyMuPDF）：如实说切不了，不许承诺。 */
export function mineruTooLargeNoAutoSplitMessage() {
	return `这份 PDF 超过 MinerU 单份 200MB 的上限，但本机没装切分用的 Python 与 PyMuPDF，切不开：请把它拆成几份（每份 <200MB）后分别上传，或先压缩再传。`;
}

/** MinerU 200MB 那道 · PDF 且**本机切得开**：只有这一档才许说「会先切开」。 */
export function mineruTooLargeAutoSplitMessage() {
	return `这份 PDF 超过 MinerU 单份 200MB 的上限：会先在本地把它切开成几段（每段 <200MB）再分别解析，不用你手动拆。`;
}

/** 预检判定的两个出口（界面上分别说，别合成一句；值本身即「撞的是哪一道」）。 */
export const UPLOAD_SIZE_LIMIT = Object.freeze({
	/** 500MB 那道：本仓仓门。 */
	DEPOT: "depot-500mb",
	/** 200MB 那道：MinerU 云端。 */
	MINERU: "mineru-200mb",
});

/**
 * 上传前按格式判体积（票 10 的第二道判据）——**纯函数**，前端预检直接调它。
 *
 * 一次判定只给**一句**文案，因为那是**一道**上限；两道的差别由 `limit` 字段带出去，
 * 调用方要两句时（把「为什么」也说清）自己拼，判据层不替它合并。
 *
 * ⚠️ **`blocked: false` 不等于「没话说」**：PDF 超 200MB 时 `message` 仍可能非空——
 * 那是一句**说明**（会自动切 / 本机切不开），不是拦路的话。把 `blocked` 与 `message` 分成两格，
 * 就是为了让「拦」与「说」这两件事不被一个布尔糊在一起。
 *
 * @param {object} input
 * @param {string} input.name 材料文件名（**只认后缀**，与上游类型判定同构）
 * @param {number} input.size 字节数
 * @param {boolean} [input.autoSplit] 本机**真探到**了切分能力（Python + PyMuPDF）才许传 true
 * @returns {{blocked: boolean, limit: string|null, message: string}}
 */
export function judgeMaterialUploadSize({ name, size, autoSplit = false } = {}) {
	if (!Number.isFinite(size) || size < 0) {
		// 读不出体积就不下判断（少说一句只是啰嗦，编一个数字就是在骗人）。
		return { blocked: false, limit: null, message: "" };
	}
	// 500MB 那道在前：它比 200MB 更早撞上，且撞上时那句「拆成多份」对两种格式都成立。
	if (size > MAX_UPLOAD_BYTES) {
		return { blocked: true, limit: UPLOAD_SIZE_LIMIT.DEPOT, message: uploadTooLargeMessage() };
	}
	if (size <= MINERU_MAX_BYTES) return { blocked: false, limit: null, message: "" };
	// 200MB 那道：**按格式**分档（`MATERIAL_FORMATS` 的 `family` 派生，不自己判后缀）。
	// 非 PDF（`page_ranges` 官方只对 PDF 生效、本机物理切也只对 PDF 跑得起来）⇒ 拦下并请用户自己拆。
	if (!isAutoSplittableMaterial(name)) {
		return {
			blocked: true,
			limit: UPLOAD_SIZE_LIMIT.MINERU,
			message: mineruTooLargeManualSplitMessage(),
		};
	}
	// PDF 超 200MB：**不拦**（本地切得开就切得开），但只在**真探到**切分能力时才许说「会先切开」。
	return {
		blocked: false,
		limit: UPLOAD_SIZE_LIMIT.MINERU,
		message: autoSplit === true ? mineruTooLargeAutoSplitMessage() : mineruTooLargeNoAutoSplitMessage(),
	};
}

// ── 界面词（两侧共用部分）──────────────────────────────────────────────────
//
// 2026-09-20 拍板（grill Q24）：界面上的字只此一份，但**服务端也要产出人话文本**——
// 《过程记录.md》、交办唤醒消息（「【工作台派任务 · X】」）、提案正文的一级标题都是给人读的。
// 所以「两侧都必须知道」的那部分界面词落在这里；纯 UI 专属映射（PHASE_UI / STAGE_HUMAN /
// CHECK_UI / EVENT_UI）留在 src/ui/view-rules.js，由它把这里的共用件再导出给组件取词。
// 分工与本文件头部原则一致：**词表共享，句子行文各端自己写**（logEntryText / announceText /
// cardText 各自的措辞与冗长仍是单侧展示）。
//
// ⚠️ 服务端**机器身份词**一律不动：账本 label、STAGE_LABELS、PHASE_LABELS、事件 type、
// 文件名、产物路径、正则锚点。界面词只在「说给人听 / 写给人读」的出口处替换。
// 依据：CONTEXT.md「界面用词表」。

/** 三次设计关卡的**主题**（界面词；与 engine.js 的机器 label `GATE_LABELS` 同值但不同用途）。 */
export const GATE_TOPIC = Object.freeze({
	1: "学习目标与难点",
	2: "教学方法与板块",
	3: "全书架构与章节",
});

/**
 * 设计关卡 → 界面词「第 N 次拍板 · <主题>」（CONTEXT.md：界面**不叫**「第 N 关」）。
 * 分段界面词、状态条、事件卡、账本播报、《过程记录.md》、提案正文标题共用这一份。
 */
export function gateHuman(n) {
	const topic = GATE_TOPIC[String(n)];
	return topic === undefined ? `第 ${n} 次拍板` : `第 ${n} 次拍板 · ${topic}`;
}

/**
 * 六阶段（按阶段号）→ 界面词。
 * 阶段片那 6 个窄格、「一起做到：X」、以及六阶段 canonical 全称的翻译共用这一份。
 * ⚠️ 两侧共用件，住这一层（CONTEXT.md「界面上的字只此一份」）：展示派生模块**再导出**供 UI 取词。
 */
export const PHASE_UI_SOURCE = Object.freeze({
	1: "材料准备",
	2: "读材料挑重点",
	3: "拍板定方案",
	4: "最佳范例章",
	5: "写完整本",
	6: "最后检查",
});

/**
 * 分段键（`seg.key`）→ 界面词。
 * ⚠️ `seg.key`（`gate-1` / `explore` / `chapter-03`…）与 `seg.label`（服务端 label）都是**机器身份词**，
 * 账本里就这么存的、一个字不改；这里只负责在**出口处**译成人话——步清单/阶段页（UI）与
 * 《过程记录.md》的「定点修改」条目（服务端）共用这一份（2026-09-20 复审 a-4：
 * 原先引擎把 seg.key 直接印进人读流水账，UI 侧另有一份 `segmentHuman`）。
 * 译不出来原样显示：宁可露出机器词，也不猜错。
 */
export function segmentHuman(seg) {
	const key = typeof seg === "string" ? seg : (seg?.key ?? "");
	if (key === "explore") return PHASE_UI_SOURCE[2];
	if (key.startsWith("gate-")) return gateHuman(key.slice("gate-".length));
	if (key === "outline") return "章节安排";
	if (key === "gold") return PHASE_UI_SOURCE[4];
	if (key === "chapters-review") return "全章过目";
	if (key === "merge") return "合并成书";
	if (key === "final") return PHASE_UI_SOURCE[6];
	// 第 N 章 <标题>：标题来自已拍板的大纲，原样保留。
	if (key.startsWith("chapter-")) return (typeof seg === "object" && seg?.label) || key;
	if (typeof seg === "object" && seg?.label) return seg.label;
	return key;
}

/**
 * 交办阶段标签 → 界面词（`agent-start` / `agent-end` / `stage-start` 事件带的 `data.label`）。
 * ⚠️ 服务端 `STAGE_LABELS` / `stageLabel()` 是**机器身份词**（账本里就这么存的，不动它），
 * 由这一层翻译。未登记的原样显示——宁可露出机器词，也不猜错。
 */
const STAGE_LABEL_UI = Object.freeze({
	// 六阶段的 canonical 全称（domain-rules PHASES）也走这一张表：账本事件带的 data.label 就是
	// 它，出口（《过程记录.md》/对话播报）必须译成界面词，否则「同一件事说两种话」的病会复发。
	// ⚠️ 值不再手抄——直接取 PHASE_UI_SOURCE，两处逐字相同过的副本已合并（2026-09-20 复审 M5）。
	"材料准备": PHASE_UI_SOURCE[1],
	"源探查": PHASE_UI_SOURCE[2],
	"教学设计": PHASE_UI_SOURCE[3],
	"范例章": PHASE_UI_SOURCE[4],
	"全章写作": PHASE_UI_SOURCE[5],
	"终检与交付": PHASE_UI_SOURCE[6],
	// 交办阶段标签（engine STAGE_LABELS / stageLabel）的简写形态。
	"章节骨架": "章节安排",
	"整理章节骨架": "章节安排",
	"铺章": "写完整本",
	"合并成书": "合并成书",
	"最后检查": "最后检查",
	"最后检查（质量门）": "最后检查",
});

export function stageLabelHuman(label) {
	const raw = String(label ?? "");
	if (raw === "") return "";
	const direct = STAGE_LABEL_UI[raw];
	if (direct !== undefined) return direct;
	// 服务端有两种拼法，都是**机器身份词**、都不许出现在人眼前：
	//   stageLabel('gate', n) →「设计提案·第 N 关」（stage-start 事件）；runGate →「设计提案·关卡N」
	//   （agent-start 事件，修订版再带「·修订vM」后缀）。两种都译成界面词的「第 N 次拍板 · <主题>」。
	const gate = /^设计提案·(?:第\s*([0-9]+)\s*关|关卡\s*([0-9]+))(·.*)?$/.exec(raw);
	if (gate !== null) return `${gateHuman(gate[1] ?? gate[2])}${gate[3] ?? ""}`;
	// 「写第 3 章」已是人话；「自查第 3 章」的「自查」是机器视角（谁查谁？）→「检查」。
	if (raw.startsWith("写第")) return raw;
	if (raw.startsWith("自查第")) return raw.replace(/^自查/, "检查");
	// 章级交工的真实形态（chapters.js stage-submit chapters 拼：「第N章《标题》完成（小助手执笔
	// + 小助手审计 + 机器验货）」）——括号里的工序清单（谁执笔/谁检查/谁验货）是机器视角，人眼
	// 不需要，整段吞掉；译法取「第 N 章《标题》完成」，章标题原样保留（与 segmentHuman 保留
	// chapter- 前缀的口径同源，票 workbench-transitions/21 的裁决）。
	const chapterDone = /^第\s*([0-9]+)\s*章《(.+?)》完成/.exec(raw);
	if (chapterDone !== null) return `第 ${chapterDone[1]} 章《${chapterDone[2]}》完成`;
	// 「批量转换 N 本 PDF」（material-convert 事件带的那句）——**机器身份词，账本里就这么存，
	// 一个字不改**（票 09 裁决；同面先例见 `CONTEXT.md`「界面用词表」章级完成行）。
	//
	// ⚠️ 它必须译，原因是受理闸门开过之后这句**不再是事实**：票 07 放开了 14 种材料格式，
	// 一本全是 .docx 的书照旧会记「批量转换 3 本 PDF」——**照原样渲染就是把格式说给了用户听**。
	// 「宁可露出机器词也不猜错」（本函数既定取向）在这里**不适用**：译文不是猜的，
	// 「N 份材料」对那 N 份**任何格式**的原件都成立。
	//
	// ⚠️ 追溯生效**不是代价，是纠正**：旧书那 N 份确实就是 N 份材料，所以同一条译法对旧书
	// 同样成立——「同一本书新旧两段用两套词」是**改 label** 才有的后果，补译法恰恰消掉它。
	// （`CONTEXT.md`「量词『份』」词条里曾把这条记成待决代价，已由票 13 改写。）
	const bulkConvert = /^批量转换\s*([0-9]+)\s*本\s*PDF$/.exec(raw);
	if (bulkConvert !== null) return `批量转换 ${bulkConvert[1]} 份材料`;
	return raw;
}

// ── 正式拍板卡入参的「测试/占位」词表（内容真实性 · 票 `walkthrough-2026-10/06`）──────────
//
// 病因（2026-10-03 清单 A3）：第 3 次拍板卡的内容是「测试标题／测试摘要。／测试正文是否可提交
// （稍后重发完整版）」——**占位文本进了一个要用户拍板的正式界面**。已核事实：那不是仓内预置
// （全仓 grep 零命中），是 AI 当场写进 `stage-submit` 入参的自由文本；而当时机器唯一的闸门是
// 「三个字段非空」（`actions/chapters.js` 的 gate 分支），**那次三个字段都是非空的**。
// ⇒ 所以这条判据必须比「非空」多咬一口，且打回要**可行动**（点明命中哪个词、在哪个字段）。
//
// ⚠️ **判据的性质是「内容真实性」，不是界面用词**（`CONTEXT.md`「界面用词表」判定线①-④）：
// 它**不进** `test-wording-invariants.mjs` 的界面禁词表——两条判定线不同，混成一条会让
// 「界面词收口」这条纪律背上一个它管不着的事实问题（票面 `:52-53`／`:80-81`）。
//
// ⚠️ **词表只此一份**（票面 `:22` 的红线）：出口（`actions/chapters.js` 的 gate 分支）与判据
// 都只许走下面这一个出口，测试也不许手抄第二份——手抄一份就是会漂的平行清单。
//
// ⚠️ **刻意不收裸「测试」两个字**：本仓的领域里「测试」是真词（教学测试、试教、
// `references/audit-and-testing.md` 就叫「审校与教学测试」），一次设计关卡的方案里出现
// 「随堂测试」「测试题」是正经内容。下面收的一律是**能指认它是在写占位件**的那个组合。
export const PLACEHOLDER_WORDING = Object.freeze([
  // 那次上屏的三种形态（「测试标题／测试摘要／测试正文」）＋ 同族的两种写法。
  "测试标题",
  "测试摘要",
  "测试正文",
  "测试内容",
  "测试文本",
  "测试用",
  // 票面点名的另一半：「占位」（覆盖「占位符」「占位文本」这类写法）。
  "占位",
  // 那次正文括号里的那句，本身就是「这份东西还没写完」的声明。
  "稍后重发",
  // 通用占位标记（写法不分大小写，判据里归一）。
  "TODO",
  "TBD",
  "Lorem ipsum",
]);

/**
 * 一次正式拍板卡交工的三个入参里命中的测试/占位词 —— **判据本体**（出口与判据共用这一段）。
 *
 * ⚠️ **词表是把双刃剑**：它只认得 `PLACEHOLDER_WORDING` 里那几串字，**认不出**换一种写法的占位件
 * （「待补」「示例文本」…今天不在表里）——所以它证明的是「命中表里那几个词会被拦并被点名」，
 * **不证明**「占位文本从此进不了正式拍板卡」（票面 `:57` 明写不证那一件）。要加词就改上面那一份表。
 *
 * @param {{title?: unknown, summary?: unknown, detail?: unknown}} fields
 *   `stage-submit(stage=gate)` 的三个入参原文（**未**做指针内联之前的那一份：判的是 AI 交上来的字）。
 * @returns {{field: string, word: string}[]} 逐条命中（空数组＝干净）。
 *   `field` 是给人读的字段名（标题／摘要／正文），打回文案据此点名；`word` 是命中的那一词。
 */
export function placeholderWordingHits(fields) {
  const problems = [];
  for (const [field, raw] of [
    ["标题", fields?.title],
    ["摘要", fields?.summary],
    ["正文", fields?.detail],
  ]) {
    const text = typeof raw === "string" ? raw : "";
    if (text === "") continue;
    // ASCII 词（TODO／TBD／Lorem ipsum）按大小写不敏感判——AI 写 `todo` 与 `TODO` 是同一件事；
    // 中文词没有大小写，原样判。
    const lower = text.toLowerCase();
    for (const word of PLACEHOLDER_WORDING) {
      const ascii = /^[\x00-\x7F]+$/.test(word);
      const hit = ascii ? lower.includes(word.toLowerCase()) : text.includes(word);
      if (hit) problems.push({ field, word });
    }
  }
  return problems;
}

// ── 产物：给人读的正文 vs 机器产物 ──────────────────────────────────────────
//
// 单一判据（ADR-0010 决策 2 与「有正文的产物」条；票 04/05 共用）：
//   'preview' 有正文的产物 —— 「打开一份文件看看」交 DSH 右栏预览；
//   'inline'  机器产物但有卡片内联人读形态 —— 工作区/knowledge-map.json 折成清单（不进右栏）；
//   'machine' 机器产物（project.json / timeline.jsonl / 源 PDF / 工作区/audit-NN.md…）—— 不给人读。
//
// ⚠️ **「过程记录」已从这一族挪走**（票 workbench-transitions/24 / ADR-0015 决策 1）：它是从建书到
// 交付、写给人读的流水账，判为 'preview'。上面这行枚举是照 2026-08 的旧分类写的，别再把它并列回来。
//
// ⚠️ 判据是**显式清单**，不是扩展名、也不是「在项目目录里」：
// 扩展名判据会把 knowledge-map.json 之外的机器产物一并放进来（票 04 收窄的正是这件事）。
// ⚠️ `工作区/audit-NN.md` 看着像 Markdown，实际是机器审计 JSON（`{"passed":…,"issues":[…]}`，
// 见 actions/chapters.js 的 JSON.parse）——名字里的 `.md` 是历史遗留，**不是有正文的产物**。
// ADR-0010 决策 2 里「自查报告」指的是给人读的 AI 自查报告，不是这个文件；把原始 JSON 送进
// 右栏等于让家长读 JSON（与它自己否掉「knowledge-map.json 也进右栏」是同一条理由）。
// ⚠️ **`工作区/outline.md`（章节安排）也在这一族**（票 pipeline-wiring-gaps/09）：它是 JSON。
// 双端分工：前端「有正文的产物」开右栏（不经 /textbook/file）；后端该路由按同一判据放行，
// 所以两端读的是同一份清单，改这里即两端同时改。

/** 工作区/ 下按序号命名的章节正文。 */
const NUMBERED_CHAPTER_FILE_RE = /^工作区\/chapter-\d{2}\.md$/;

/**
 * 章号 → 章节正文的**书夹相对路径**（两位序号是产物契约）。
 *
 * 收编前这个形状以模板串手抄了 20 余处（客户端两份逐字相同的本地 `chapterRel` ＋ 两处内联模板
 * ＋ 服务端各处）——契约没有单点，改章号位数/改路径格式要改一屏。这与上面那条识别正则同居：
 * **写侧**是这一对函数，**读侧**是 `NUMBERED_CHAPTER_FILE_RE` 与 `productOpenMode`。
 *
 * ⚠️ **一定要先分清自己要的是哪一种形状**：
 *   - 要**书夹相对路径**（前端拿它去读产物、账本 `data.path` 记它）→ `chapterRel`
 *   - 要**基名**（服务端 `workFile` / `writeWork` 收的是基名）→ `chapterName`
 *
 *   给一个产出基名的调用点塞 `chapterRel`，会一路拼成 `工作区/工作区/chapter-01.md`——真的把文件
 *   写坏或读坏。仓里产出基名的生产点有一半以上（引擎的 `chapterArtifacts` 源头、三个归档循环、
 *   数已有章数、读范例章实测……），所以这两个出口必须同时存在、且各自说清自己是什么。
 *
 * @param {number|string} n - 章号（1 起）。
 * @returns {string} 形如 `工作区/chapter-01.md`。
 */
export function chapterRel(n) {
	return `工作区/chapter-${String(n).padStart(2, "0")}.md`;
}

/**
 * 与 {@link chapterRel} **同一份契约**的基名形（`chapter-NN.md`）。
 * 两者恒满足 `chapterRel(n) === "工作区/" + chapterName(n)`。
 *
 * ⚠️ 见 {@link chapterRel} 的注记：给要基名的调用点用这一个，给要相对路径的用那一个。
 * 产物路径是**机器身份词**（`CONTEXT.md`「界面用词表」判定线：文件名、产物路径一个字不改）——
 * 改这一对＝改契约。
 *
 * @param {number|string} n - 章号（1 起）。
 * @returns {string} 形如 `chapter-01.md`。
 */
export function chapterName(n) {
	return `chapter-${String(n).padStart(2, "0")}.md`;
}

/**
 * 章审计记录（`工作区/audit-NN.md`）的**书夹相对路径**——与 {@link chapterRel} 同一套两位序号契约。
 *
 * ⚠️ **为什么补这一对出口**（票 `.scratch/context-budget/issues/18`）：派单要按章把审计落盘点交给
 * 子代理（「你的审计记录（你自己落盘）：`工作区/audit-NN.md`」），而这条路径此前**没有出口**——
 * 盘上有五处各自手拼 `audit-${String(n).padStart(2, '0')}.md`（`engine.js` 的 `chapterArtifacts`、
 * `workflow.js` 的过程图谱、`chapters.js` 的验货、`ui/gold-table.js`、本模块的调用方）。
 * 五处各拼一份＝改序号位数要改五处，而这是**产物契约**（改名＝改契约）。
 *
 * ⚠️ **我这条例外没有全收**（复核 findings ⑥ 之后逐一核过，`grep -n 'audit-${' src/` 现在只剩
 * 本函数的定义处与上面那张清单行的模板形）：**识别**正则不是构造——`engine.js` 的
 * `/^audit-\d+\.(md|json)$/` 与 `workflow.js` 的 `/^audit-(\d+)\.md$/`、`/^工作区\/audit-(\d{2})\.md$/`
 * 那几条（`exec`／`test`，且比构造面宽：`.json` 也认，抄成一个构造反倒更窄）；`ui/*` 那几处
 * 只出现在注释里；`cross-audit.js` 的 `CROSS_AUDIT_REPORT_REL` 与 `engine.js` 的两条
 * `references/…` 资源 rel 属**别的族**（跨章审计 / 方法论规范行），本函数不管。
 *
 * @param {number|string} n 章号（1 起）
 * @returns {string} 形如 `工作区/audit-01.md`
 */
export function auditRel(n) {
	return `工作区/${auditName(n)}`;
}

/**
 * 与 {@link auditRel} **同一份契约**的基名形（`audit-NN.md`）——喂 `workFile` / `writeWork`
 * 那一族要基名（它们自己拼 `工作区/`），喂相对路径会拼成 `工作区/工作区/audit-01.md`。
 *
 * @param {number|string} n 章号（1 起）
 * @returns {string} 形如 `audit-01.md`
 */
export function auditName(n) {
	return `audit-${String(n).padStart(2, "0")}.md`;
}

// ── 章正文分片（票 `walkthrough-2026-10/02` · 机器成为章正文的唯一写者）────────────
//
// 病（2026-10-03 真机走查 A10）：主笔把一章**拆两半派**给两个执笔小助手，两个写者写**同一个**
// `工作区/chapter-08.md`——零互斥、零合并，谁后落盘谁说了算（后半段的助手报「已落盘、前半段未改动
// 一字」的时间早于前半段报「已落盘 455 行」）。盘上那次没丢字，兜住它的是**主 AI 事后自己读全章补齐**，
// 不是任何机制。裁决（`issues/02` 2026-10-06）走的不是「加一把锁」（仓里没有可加的锁，加也锁不住
// 别人的写工具），而是**换协议**：子助手**只落分片**，章正文 `工作区/chapter-NN.md` **由机器拼**。
//
// 与 `chapterRel`／`chapterName` 同一套纪律：**两个出口（相对路径／基名）各自说清自己是什么**，
// 而拼绝对路径时基名接在 `paths.chapterShardDir()` 底下（它**不在工作区根**，同细目那一族）。

/** 章正文分片目录的**书夹相对**形状（`工作区/分片`）——相对路径出口与 `paths.chapterShardDir()` 同源的另一半。 */
export const CHAPTER_SHARD_DIR_REL = `${WORK_DIR_NAME}/${CHAPTER_SHARD_DIR_NAME}`;

/**
 * 章号 ＋ 分片号 → 该分片（`工作区/分片/chapter-NN-MM.md`）的**基名**（`chapter-NN-MM.md`）。
 *
 * ⚠️ 两个序号都是**两位补零的产物契约**（与正文那一族同款：`chapterRel(100)` 是「至少两位」）。
 * `MM` 从 `01` 起、**一路一个号**：主笔把一章拆成 N 路（含只派一路那一种）时，每一路拿自己的号写
 * 自己的分片，**谁也不碰别人的分片**；机器按 `MM` 升序拼成章正文。
 *
 * @param {number|string} n 章号（1 起）
 * @param {number|string} m 分片号（1 起）
 * @returns {string} 形如 `chapter-01-02.md`
 */
export function chapterShardName(n, m) {
	return `chapter-${String(n).padStart(2, "0")}-${String(m).padStart(2, "0")}.md`;
}

/**
 * 与 {@link chapterShardName} **同一份契约**的书夹相对路径形（`工作区/分片/chapter-NN-MM.md`）。
 * 两者恒满足 `chapterShardRel(n, m) === CHAPTER_SHARD_DIR_REL + "/" + chapterShardName(n, m)`。
 *
 * @param {number|string} n 章号（1 起）
 * @param {number|string} m 分片号（1 起）
 * @returns {string}
 */
export function chapterShardRel(n, m) {
	return `${CHAPTER_SHARD_DIR_REL}/${chapterShardName(n, m)}`;
}

/**
 * 分片基名 → `{n, m}`；**不是分片名时返回 `null`**。
 *
 * ⚠️ **判据的形状从 {@link chapterShardName} 现算**，不在这里手写第二份正则：
 * 「生产者按新名写、认领归档的判据还认旧名」是本仓已经栽过一次的形状（票 11 的探查重做归档正则），
 * 而改一次分片命名只该改一处。防空跑：`chapterShardName(n, m)` 哪天不再按那个形状拼，
 * 这里算出来的正则也跟着变（`test-artifact-path.mjs` 对这一点有反证）。
 *
 * ⚠️ **识别面比 {@link chapterShardName} 产出面宽一格**（有意，写在判据注释里）：两个序号位都是
 * `\d+`（一位以上）而不是「恰好两位」——写者少补一个零（`chapter-2-1.md`）照样被认出来、被拼进正文，
 * 而不是静默判成「一片分片都没有」。窄的那一侧（补零位数的契约）由
 * `test-artifact-path.mjs` 的**字面量**断言钉住，不靠这里。
 *
 * @param {string} name 分片基名（如 `chapter-01-02.md`）
 * @returns {{n: number, m: number}|null}
 */
export function parseChapterShardName(name) {
	const match = CHAPTER_SHARD_NAME_RE.exec(String(name ?? ""));
	if (match === null) return null;
	return { n: Number(match[1]), m: Number(match[2]) };
}

/** 由 {@link chapterShardName} 的**字面量样本**算出来的识别正则（形状只此一份）。 */
const CHAPTER_SHARD_NAME_RE = (() => {
	// 样本取 `chapter-00-00.md`：两个序号位各是一个「全 0」的两位组，逐个换成捕捕获组 `(\d+)` 即可。
	// 先把正则元字符全部转义（`.` 是这里唯一一个），再按序替换两个序号位。
	const escaped = chapterShardName(0, 0).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const placeholders = escaped.split("00");
	// ⚠️ 形状变了（不再是「恰好两个独立的两位序号位」）时返回一个**永不匹配**的正则，而不是猜一种新形状：
	// 猜错的后果是「生产者按新名写、机器按旧名认」——那正是本函数要防的那种静默失配。永不匹配会让
	// 「一片分片都没有」当场响出来（机器拒收），比静默认错强。
	if (placeholders.length !== 3) return /$^/u;
	return new RegExp(`^${placeholders[0]}(\\d+)${placeholders[1]}(\\d+)${placeholders[2]}$`, "u");
})();

// ── 精读派发（票 03 落的形状 ＋ 票 11 收编落盘路径）──────────────────────────────
//
// 一个精读小助手只读**一份**材料，落下两件按材料分号的产物；主笔只合并这些分片。
// 与 `chapterRel`／`chapterName` 同一套纪律：**两个出口（相对路径／基名）各自说清自己是什么**。
//
// ⚠️ **票 11 改了落盘目录，所以两个出口的关系式也变了**（ticket 11 · ADR-0031 决策 1）：
// 细目从工作区根搬进了 `工作区/细目/`，于是恒等式由 `readingRel(n) === "工作区/" + readingName(n)`
// 变成 **`readingRel(n) === \`${WORK_DIR_NAME}/${DETAIL_DIR_NAME}/\` + readingName(n)`**——
// 段名由两个常量拼出来，别处不写第二份（`paths.detailDir()` 是绝对路径那一半的出口）。
// ⚠️ **给 `workFile`／`writeWork` 的是基名，而基名带目录就不再是基名了**：细目落在子目录里，
// 所以拼绝对路径一律走 `join(paths.detailDir(id), readingName(n))`，
// 喂 `workFile(project, readingName(n))` 会拼出 `工作区/精读-01.md`（工作区根，不是细目目录）——
// 那正是本段开头警告过的「给错出口真把文件写坏」。
/** 细目目录的**书夹相对**形状（`工作区/细目`）——相对路径出口与 `paths.detailDir()` 同源的另一半。 */
export const DETAIL_DIR_REL = `${WORK_DIR_NAME}/${DETAIL_DIR_NAME}`;
/** 报告目录的**书夹相对**形状（`工作区/报告`）。 */
export const REPORT_DIR_REL = `${WORK_DIR_NAME}/${REPORT_DIR_NAME}`;

/** 材料在「转换完成」清单里的序号（1 基，两位补零）→ 精读细目（`工作区/细目/精读-NN.md`）书夹相对路径。 */
export function readingRel(n) {
	return `${DETAIL_DIR_REL}/${readingName(n)}`;
}

/** 与 {@link readingRel} 同一份契约的基名形（`精读-NN.md`）——拼绝对路径时它接在 `paths.detailDir()` 底下。 */
export function readingName(n) {
	return `精读-${String(n).padStart(2, "0")}.md`;
}

/** 材料序号 → 知识地图分片（`工作区/knowledge-map-NN.json`）书夹相对路径。 */
export function knowledgeShardRel(n) {
	return `${WORK_DIR_NAME}/knowledge-map-${String(n).padStart(2, "0")}.json`;
}

/** 与 {@link knowledgeShardRel} 同一份契约的基名形（`knowledge-map-NN.json`）。 */
export function knowledgeShardName(n) {
	return `knowledge-map-${String(n).padStart(2, "0")}.json`;
}

/**
 * `meta.sources` 里**转换完成**那几份，**连同它们的序号**（1 基，按原顺序）——
 * 「几路精读」的**唯一算法**，序号与材料**成对产出**。
 *
 * ⚠️ 为什么序号与条目要**成对**而不是分开两个函数（票 03 尾账 · code-review S1）：
 * 分开就会退回「`n` 从这里数、`file/role/md` 从那里按 `sources[i]` **位置**对齐」——
 * 位置对齐只在两处过滤口径恰好相同时成立，而那正是注释自称「口径只此一份」却**实际有两处**
 * 的那种形状（`buildStageBrief` 的 explore 支曾私滤一遍 `convertedState(...) === 'ok'`）。
 * 成对产出之后，「第 n 路精读是哪一份材料」由**这一份**说了算，那个洞不复存在。
 *
 * 零份转换完成 ⇒ 空数组（新材料没转好时不许拿旧分片顶账）。
 *
 * @param {unknown} sources `meta.sources`
 * @returns {{n: number, source: object}[]} 如 `[{n: 1, source: {…}}, {n: 2, source: {…}}]`
 */
export function okMaterialShards(sources) {
	if (!Array.isArray(sources)) return [];
	const out = [];
	for (const source of sources) if (convertedState(source) === "ok") out.push({ n: out.length + 1, source });
	return out;
}

/**
 * 「几路精读」的序号们——**只此一份**口径的下半截。
 * 判定条件取自 {@link okMaterialShards}（本函数是它的薄包装，不另写一遍 `convertedState` 比较）。
 *
 * `buildStageBrief` 的 explore 支（`brief.parallelReads[].n`）与 `stage-submit(explore)` 的验货
 * **都从这里取**；而 `brief.materials` 那几条 `file/role/md` 取自**同一个** `okMaterialShards()`
 * 的配对条目——两处各数一遍的话，一处按 `converted === true` 过滤、另一处把 `'ok'` 漏掉，
 * 主笔交了 3 片而机器要 4 片——那种 400 谁都看不懂。
 *
 * @param {unknown} sources `meta.sources`
 * @returns {number[]} 如 `[1, 2, 3]`
 */
export function okMaterialNumbers(sources) {
	return okMaterialShards(sources).map((shard) => shard.n);
}

// ── 材料判定（探查段开头那一趟书级判定；票 `pre-gold-build/01`）────────────────────
//
// 病：`role` 是**上传那一刻**由文件名猜出来的三层产物（`guessRoleFromName` → AI 识别 → 用户手改），
// 而「哪一份在冲突时更权威」这种**跨材料**判断在上传那一刻无处可做。口径（票
// `.scratch/pre-gold-processes/issues/11` 的 `## Answer` §1／§2）把 `role` 的唯一住处改成
// **判定产物** `工作区/材料判定.json`——它由探查段开头那一趟**书级材料判定**（派发档
// `material-survey`）产出，`num` 对齐 {@link okMaterialShards} 的序号（与分片／细目／档位同一份口径），
// `role ∈ {@link ROLES}`，`basis` 是人读的一行而**机器不验它**。
//
// 机器在这一趟里只做**两个纯机械动作**（本段就是那两件的唯一出处，别处不另写一份抽法）：
//   ① 每份转换稿的**开头 N 字符**（{@link MATERIAL_SURVEY_HEAD_CHARS}，与 `maxConcurrentSubagents`
//      同类的**登记常量**）；② `^#{1,6} ` 的**标题行清单**（{@link MATERIAL_SURVEY_HEADING_RE}）。
//   ⛔ 机器**不试图识别「目录」**——那是语义判断；抽不到标题行就**照实说**「这份没有可用的标题行」，
//   兜底＝开头片段 ＋ 路径（照实说是正常分支，不是异常）。
//
// ⚠️ **我的枚举面比现实窄在哪里**（{@link materialJudgmentProblems} 的注释里逐条写）：
// 这一段只出**常量与纯函数**，「盘上那份文件读不读得出来」那半归调用点（`exploreArtifactProblems`）。

/**
 * 抽片段旋钮之一：每份转换稿给判定小助手的**开头 N 字符**。
 *
 * ⚠️ 初值 800 是**推荐初值**（口径来自票 11 §1），不是量出来的最优值：判定小助手拿不准时
 * 自己按派单里给的路径再读该份的前 M 行——所以这个数只决定「第一眼看到多少」。
 * ⚠️ `MATERIAL_JUDGMENT_NAME`／`MATERIAL_JUDGMENT_REL` 两个常量住在本文件顶部（那张产物族表
 * 在模块初始化时就要拼它的路径，`const` 的 TDZ 不许它们留在这里）——判定口径本身仍在这一节。
 */
export const MATERIAL_SURVEY_HEAD_CHARS = 800;

/**
 * 抽片段旋钮之二：**标题行**的判据（`^#{1,6} `，行首一到六级标题 ＋ 一个空格）。
 *
 * ⚠️ 它只认这一种写法：真实转换稿里标题行的**保有率未核**（本机 `~/.dsh/textbook/projects`
 * 下 0 个 `full.md`，仓里夹具不是真实转换稿）⇒ 抽不到**不是**异常，是正常分支（照实说）。
 * 锚 `^`（行首）是要的：正文里出现的 `# 标签` 之类不该被当成标题。
 */
export const MATERIAL_SURVEY_HEADING_RE = /^#{1,6} /u;

/**
 * 机器给判定小助手抽的**读物**（纯函数：一份转换稿正文 → 开头片段 ＋ 标题行清单）。
 *
 * 派的单里还要给**路径**（那是调用点的事，见 `engine.materialSurveyInput`）——这个函数不碰盘。
 *
 * @param {unknown} text 转换稿正文
 * @param {number} [headChars] 开头取多少字符（默认 {@link MATERIAL_SURVEY_HEAD_CHARS}）
 * @returns {{head: string, headings: string[]}} `headings` 为空数组＝**这份没有可用的标题行**（照实说）
 */
export function materialSurveyReadings(text, headChars = MATERIAL_SURVEY_HEAD_CHARS) {
	const raw = String(text ?? "");
	const size = Number.isSafeInteger(headChars) && headChars >= 0 ? headChars : MATERIAL_SURVEY_HEAD_CHARS;
	const headings = [];
	for (const line of raw.split(/\r?\n/u)) {
		if (MATERIAL_SURVEY_HEADING_RE.test(line)) headings.push(line.replace(/\s+$/u, ""));
	}
	return { head: raw.slice(0, size), headings };
}

/** 判定产物里那一行行「材料」条目（拿不出这个数组时返回 null——判据据此点名「产物读不出」）。 */
function materialJudgmentRows(judgment) {
	if (judgment === null || typeof judgment !== "object" || Array.isArray(judgment)) return null;
	return Array.isArray(judgment.materials) ? judgment.materials : null;
}

/**
 * **那一条硬闸**（单点判据：交工／置态／放行三处共用，⛔ 不另开第二份「相似的量法」）。
 *
 * 断三件：判定产物**在场**（调用点读盘，拿不到就传 `null`）＋ **逐份覆盖** `converted === 'ok'`
 * 的源（`num` 对得上）＋ 每一条的 `role ∈ {@link ROLES}`（⛔ 不新造角色词）。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）
 *
 * ① **只验「每份 `ok` 源有一条、且 `role` 是合法枚举值」**——不验 `basis` 写没写、不验判定**对不对**
 *    （「这份到底是教材还是讲义」是真机层，ADR-0005）。写了合法 `role` 而判错，这道闸照样绿。
 * ② **零源书**（`okMaterialNumbers` 为空）**不要求**这份产物——凭空要一份不存在的东西就是
 *    「判据比现实严」（零源旧书没有材料，也就没有角色可判）。
 * ③ ~~**演示书**没有这条来源~~ ——⚠️ **这一条已作废**（票 `demo-channel-full/11`／`12`）：演示支现在
 *    真产这份判定产物、也真产分片与细目，`exploreArtifactProblems` 里**一处 demo 分叉都没有了**
 *    ⇒ 这道闸对演示书**照跑、照过**。留这一行是让下一个人看到「这里曾经有一条演示豁免、它去哪了」，
 *    对应的两条登记（`material-judgment`／`explore-artifact-shards`）都已在 `src/demo-exemptions.js` 里 `closed`。
 * ④ 闸读的是**盘上那一份文件**（调用点读一次、原样传进来）——票 11 §1「允许在探查段内改写」
 *    意味着改过后按改后的算，那不是漏洞。
 * ⑤ **只验覆盖方向**：判定产物里多出来的号（如某份没转成的源也写了一条）**不点名**——
 *    它没有分片，并进合并件那条路按分片号取，多出来的号影响不到任何下游读数。
 *
 * @param {unknown} sources `meta.sources`
 * @param {unknown} judgment 盘上那份 `工作区/材料判定.json` 解析出来的对象；**读不出就传 `null`**
 * @returns {string[]} 逐条点名的问题（空数组＝站得住）
 */
export function materialJudgmentProblems(sources, judgment) {
	const wants = okMaterialNumbers(sources);
	// ② 零源书：没有材料就没有角色可判，凭空要一份不存在的产物就是判据比现实严。
	if (wants.length === 0) return [];
	const rows = materialJudgmentRows(judgment);
	if (rows === null) {
		return [
			`材料判定产物不在或读不出：${MATERIAL_JUDGMENT_REL} 要是 {"materials":[{"num":1,"role":"…","basis":"…"}]} 的严格 JSON 对象`
			+ `——本次有 ${wants.length} 份转换完成的源，角色由探查段开头那一趟书级材料判定（派发档 material-survey）产出。`,
		];
	}
	const byNum = new Map();
	for (const row of rows) {
		if (row !== null && typeof row === "object" && !Array.isArray(row) && Number.isSafeInteger(row.num)) {
			byNum.set(row.num, row);
		}
	}
	const problems = [];
	for (const n of wants) {
		const row = byNum.get(n);
		if (row === undefined) {
			problems.push(`材料判定里没有第 ${n} 号源——${MATERIAL_JUDGMENT_REL} 要**逐份覆盖**转换完成的源（num 与分片／细目／档位同一份口径）`);
			continue;
		}
		if (!ROLES.includes(row.role)) {
			problems.push(`材料判定的第 ${n} 号源 role 是 ${JSON.stringify(row.role ?? null)}，不在 ROLES 五分类里（${ROLES.join("／")}）`);
		}
	}
	return problems;
}

/**
 * 判定产物 → `num → {role, basis?}` 的表（**机器并进合并件**用的那一份，与那条硬闸读的是同一份产物）。
 *
 * 只收「`num` 是安全整数**且** `role ∈ {@link ROLES}`」的行——非法值当场落空，
 * 于是 {@link expectedKnowledgeMap} 那一边**缺就是缺**：没有这一号就**不长出**这两个键
 * （⛔ 不注空串、⛔ 不回落「学生用书」）。
 *
 * ⚠️ **票 `pre-gold-build/02` 把这一格的值从 `role` 字符串扩成 `{role, basis?}`**：探查确认卡的
 * 材料行要显示「角色：〈分类〉＋依据」（票 11 §8 逐字「借已有的 `materials[]` 自然显示」），
 * 而 `basis` 与 `role` 住在**同一份判定产物**的同一行里 ⇒ 一起并进 `materials[]`，
 * ⛔ 不新开第二个输入、⛔ 不另读一遍盘（「同一份输入」是这一段自己的纪律）。
 * `basis` 缺席／不是非空字符串时**这一键不并**（机器不验它写没写，见 {@link materialJudgmentProblems} 窄处①）。
 *
 * ⚠️ 这里与 {@link materialJudgmentProblems} 是**两个方向**、不是两份量法：判据点名「缺了谁／哪条非法」，
 * 这张表只回答「能并进合并件的是哪些」。同一条非法行在两边都到不了合并件（判据会先拒交）。
 *
 * @param {unknown} judgment 盘上那份判定产物（读不出时传 `null`）
 * @returns {Map<number, {role: string, basis?: string}>} 序号 → 角色（＋有的话，那句人读依据）
 */
export function materialRoleTable(judgment) {
	const table = new Map();
	for (const row of materialJudgmentRows(judgment) ?? []) {
		if (row === null || typeof row !== "object" || Array.isArray(row)) continue;
		if (!Number.isSafeInteger(row.num)) continue;
		if (!ROLES.includes(row.role)) continue;
		const basis = typeof row.basis === "string" && row.basis.trim() !== "" ? row.basis.trim() : null;
		table.set(row.num, basis === null ? { role: row.role } : { role: row.role, basis });
	}
	return table;
}

// ── 探查交工必做项（票 07 · pipeline-wiring-gaps）──────────────────────────────
//
// 病：探查交工只验「explore.md 非空 ＋ 两个数组非空」，方法论文档
// （`resources/references/source-material.md` §二第一层）点名的必做产物——源文件简码表、
// 真相校准、全书通用锚点——机器一个都不看；章节建议的章数当时写在交办里也从不被查
// （2026-10-27 起上下限都取消，见下面 `CHAPTER_COUNT_POLICY_TEXT`，那一句才是今天的判据面）。
//
// ⚠️ **这里的五个词是「任务说明 ↔ 机器验」共用的唯一一份词表**：
// `buildStageBrief` 的 explore 支把 `required` 里那几个词**逐字**写进交办（并要求小节名原样含这些词），
// `stage-submit(explore)` 的验货按**同一些词**在 explore.md 里找——两边各写一份词表就会漂，
// 漂了之后 AI 按交办写的、机器按自己的找，交工永远 400。改词只改这里。
//
// ⚠️ **我的枚举面比现实窄在哪里**（票 `dev-gate-scan/17` 的纪律）：
// ① 机器按「explore.md 里逐字含这个词」判在场——它验的是**词**不是**义**：AI 写了同义的另一套词
//    （如「简码表」少了「源文件」前缀）会被误判缺席。收窄的补法恰好是本票的另一半：交办明说
//    「小节名逐字含这些词」，把枚举面从「AI 会怎么写」收成「交办让它怎么写」——语义对不对
//    （真翻了源没有、锚点是不是真的跨章共享）仍是真机层，机器不冒充。
// ② 档位判据枚举的触发条件只有「份数 ≥4」与「任一源角色为考纲」两条；方法论原文的「或有 syllabus
//    的认证类」在 dsh 形态只落到「考纲」这一个角色上（七分类的角色词对 dsh 不是取值来源，见
//    source-material.md §一）。师生合版的「教师用书独有内容粗比对」**有意不进**这份枚举——
//    票面点名的机器判据只有三项基线 ＋ 完整版两加项，粗比对留在方法学层（人看）。
export const EXPLORE_ITEM_CODE_TABLE = "源文件简码表";
export const EXPLORE_ITEM_TRUTH_CALIBRATION = "真相校准";
export const EXPLORE_ITEM_COMMON_ANCHORS = "全书通用锚点";
export const EXPLORE_ITEM_PER_SOURCE_STRUCTURE = "每源结构探查";
export const EXPLORE_ITEM_TRAP_FORECAST = "高频陷阱预判";

/**
 * 师生合版独有内容比对的小节名（source-material.md §三：比对结果写入源材料索引第一层的
 * 「教师用书独有内容」小节，供 Phase 3 设计板块语法时取用）。
 *
 * ⚠️ **有意不在** {@link exploreDepthTier} 的 `required` 里（票 07 的裁决：粗比对留在方法学层，
 * 机器不因缺它拒交）。⚠️ 票 `ui-display-redesign/03` 起探查确认卡**不再单列**这一节的折叠块
 * （spec §2.3 第 8 行：那一块删了）——内容仍在那份「读材料报告」的全文里，随报告一起读；
 * 界面侧因此**没有**第二个解析器（原先那个提取器随块退役）。词面仍留在这里，因为它是
 * AI 写报告那一侧的体例登记（source-material.md §三），不因界面换了读法而改名。
 */
export const EXPLORE_TEACHER_UNIQUE_SECTION = "教师用书独有内容";

/**
 * 全书章数政策（**唯一一份**；2026-10-27 维护者裁决逐字：
 * 「章节：上限不再限制。」「章数允许只出一章，这是我做知识点图的目的之一。」）
 *
 * ⇒ 上下限都不判：交 12 章不拒收，交 1 章也算合格交付。交办说明、工具说明与交工文案
 * 都引用这一句，⛔ 不各写一份旧区间；也⛔ 不新造「建议区间」的软读数去顶替硬闸
 * （那就等于把闸换个名字留着）。
 */
export const CHAPTER_COUNT_POLICY_TEXT = "章数不限：1 章也可交付，多章不设上限";

/**
 * 考纲角色词（dsh 五分类，`ROLES` 里那一个）——它在**声明面**里在场即升「完整版」档
 * （source-material.md §二三档）。
 *
 * ⚠️ 票 `pre-gold-build/03` 起它是**声明面**的判据词：升档看的是 {@link exploreDepthTier} 第二个
 * 输入里有没有它——那一份 role 集来自 `工作区/材料判定.json`（探查段开头那一趟书级材料判定），
 * ⛔ 不再是上传那一刻由文件名猜出来、存在 `meta.sources[].role` 上的那一层。
 */
export const SYLLABUS_ROLE = "考纲";

/**
 * 探查深度档与当次必做项——**任务说明与机器验共用的同一份算法**（票 `pre-gold-build/03` 的**两段式**）。
 *
 * 份数按 {@link okMaterialShards}（转换完成那几份）计，与分片/细目义务**同一份口径**：
 * 没转成的那几份不在探查面里，也不该把它们的必做项算到主笔头上。
 * 零份转换完成 ⇒ `required` 为空——**零源旧书**那一档，凭空要「源文件简码表」等于
 * 要一份不存在的东西（与同函数 explore 验货里「零片不要求 knowledgePoints」同一口径）。
 * ⚠️ **演示书不在这条零源路上**（票 `demo-flow-fidelity/08` ③ 按盘上事实订正）：它的 `sources`
 * 是 1 份 `converted: 'ok'` 的占位源（`actions/patterns-ops.js` 的 `case 'demo-run'`），
 * 按本函数是「轻量档、三项必做」——旧措辞把两种前提混成一句，已改。
 *
 * ## 两个输入与**两段式**
 *
 *   第一输入 `sources`＝`meta.sources`（份数口径）；
 *   第二输入 `declaredRoles`＝**声明面**（`工作区/材料判定.json` 里那份 `role` 集，机器按 `num`
 *   收成表用的是 {@link materialRoleTable}）。档位怎么读它：
 *   · **写了第二个实参** ⇒ 只认它：`完整版` ＝ 份数 ≥4 **或** 声明里含 {@link SYLLABUS_ROLE}；
 *   · **不传第二输入** ⇒ 与票 03 之前**逐字同形**：退回源上那个历史字段 `meta.sources[].role`
 *     （兼容默认值，不是第二条量法）。⚠️ **生产三处调用点都不走这一路**：交办那一跳显式给 `[]`
 *     （那时判定产物还不存在 ⇒ 交办给的是**基线档**），置态／放行／交工三处由
 *     `engine.exploreArtifactProblems` 显式给**同一份**判定产物的 role 集
 *     ⇒ `meta.sources[].role` 在**生产判据面上零读取**（那八处读侧的改造归票 `pre-gold-build/02`）。
 *   ⚠️ **允许不一致**：交办那一句「基线档」与交工那一刻实算的档**可以不一样**——不一致不是 bug，
 *   正是两段式的设计（交办那一刻判定还不存在；机器承诺的只是「交工时按你那份声明重算一遍再验」）。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）
 *
 *   ① **这是自证**：机器验的是「AI **自己声明的**角色推出来的档位」——**不是**「机器发现这真是考纲」。
 *      声明成考纲 ⇒ 按完整版验；声明错、整份不认，机器都照样按那份声明算（判定对不对是真机层，ADR-0005）。
 *   ② 升档只认 {@link SYLLABUS_ROLE} **这一个词**：方法论原文的「或有 syllabus 的认证类」在 dsh 形态
 *      只落到「考纲」这一个角色上（⛔ 不新造角色词，取值域就是 {@link ROLES}）。
 *   ③ 触发条件只有「份数 ≥4」与「声明里含考纲」两条：师生合版的「教师用书独有内容粗比对」**有意不进**
 *      这份枚举（票 07 的裁决，见 {@link EXPLORE_TEACHER_UNIQUE_SECTION} 的注释）。
 *   ④ 档位**改不了现实**：它只决定必做小节的**词**，机器只按小节名子串找在场
 *      （`engine.exploreArtifactProblems`）——小节里写没写真东西，本函数一个字都不看。
 *
 * @param {unknown} sources `meta.sources`
 * @param {readonly string[]} [declaredRoles] 声明面（材料判定给的 role 集）；**不传**＝沿用历史字段
 * @returns {{count: number, tier: "轻量"|"中量"|"完整版", required: string[]}}
 */
export function exploreDepthTier(sources, declaredRoles = []) {
	const shards = okMaterialShards(sources);
	const count = shards.length;
	const baseline = [
		EXPLORE_ITEM_CODE_TABLE,
		EXPLORE_ITEM_TRUTH_CALIBRATION,
		EXPLORE_ITEM_COMMON_ANCHORS,
	];
	if (count === 0) return { count, tier: "轻量", required: [] };
	// 声明面：调用点**写了第二个实参**就只认它（显式 `[]` ＝ 没有任何声明）；没写才走兼容默认值。
	const declared = arguments.length >= 2
		? (Array.isArray(declaredRoles) ? declaredRoles : [])
		: shards.map(({ source }) => source?.role);
	const isFull = count >= 4 || declared.includes(SYLLABUS_ROLE);
	if (!isFull) return { count, tier: count === 1 ? "轻量" : "中量", required: baseline };
	return {
		count,
		tier: "完整版",
		required: [...baseline, EXPLORE_ITEM_PER_SOURCE_STRUCTURE, EXPLORE_ITEM_TRAP_FORECAST],
	};
}

// ── 材料分量（standing）逐源表态的交工闸门（票 17 · pipeline-wiring-gaps · ADR-0023）──
//
// 「这份材料在什么问题上说了算、在什么问题上不算数」由主笔 AI **逐源**写一句自然语言声明，
// 落各精读分片的 `materials[].standing`（结构化字段是**唯一出口**——gate/gold 两关读不到
// explore.md 散文；交办里散文那份「权威层级」要求已随本票退役，见 ADR-0023 决策 4）。
//
// 四条机器闸门（G1–G4），**判据与反例口径都在 standingGate 这一份里**，动作层（chapters.js
// 的 explore 分支）只接线：
// · G1 —— ≥2 份转换完成的源：每份材料都要有非空字符串 standing，缺了拒收。
// · G2 —— 单源豁免：只有一份转换完成的源时不要求 standing（最常见的单本教材，声明无信息量；
//   豁免写进了交办契约文本，不装作「每源必写」）。口径按**转换完成**的源数（与分片/细目/
//   探查档位同一份 `okMaterialShards`），不是登记的源数——没转成的那份没有分片、没有可挂
//   声明的 materials 条目。
// · G3 —— ≥2 份时 standing 去重后条数 == 源数，不满足**只记 hint 不拒交**：两份材料地位
//   确实可能相同，硬拦必假红。
// · G4 —— **声明为「真题」的源**（票 `pre-gold-build/03` 起触发面＝合并件 `materials[].role`，
//   见下）：standing 必须非空、且显式写出有无配套答案与评分标准（去重那一半归 G3 的 hint）。
//   ⚠️ **机器只验「表态了没有」，不验「带没带」**：机器手上只有产物的形状，判定「带没带」是
//   判断不是判据——文件名启发式（「含答案的真题解析.pdf」假阳、答案在书末附录的假阴）双向都会错。
//   **这是能力上限**：这里验的是「答案/评分 字根出现在声明里」，语义真假归真机层（ADR-0005）与人工。
//
// ⚠️ **为什么按源配对而不按「km.materials 每项」盲扫**（判据声称的强度＝实现强度）：
// 盲扫在 materials 整个缺失（分片没写）时扫到零条、恒真——那正是「空转闸门」。按源配对后，
// 「缺整份条目」与「缺 standing」都咬得住。代价（窄处）：num 对不上号的多余条目不进射程
// ——那是分片内容问题，归抽查面，不是这道闸的活。

/** 真题角色词（dsh 五分类，`ROLES` 里那一个）——G4 的**触发词**（票 `pre-gold-build/03` 起读的是
 * 合并件 `materials[].role`，不是 `meta.sources[].role`），与 `SYLLABUS_ROLE` 同一份登记面的另一个值。 */
export const REAL_EXAM_ROLE = "真题";

/**
 * G4 的表态字根：真题源的分量声明里必须出现其中之一，才算「显式表态了有无配套答案与评分标准」。
 * ⚠️ 只验**词在不在**（表态了没有），不验**事真不真**（带没带）——见上面 G4 那段能力上限。
 */
const ANSWER_STANCE_RE = /答案|评分/;

/**
 * 材料分量四条闸门（G1–G4）——**explore 交工验货的判据单点**。
 *
 * @param {unknown} sources `meta.sources`（配对与计数取自 {@link okMaterialShards}）
 * @param {unknown} materials 合并件/分片里的 `materials`（按 `materials[].num` 配到源）——
 *   ⚠️ 票 `pre-gold-build/03` 起它**还是 G4 的触发面**（那一条的 `role` 由材料判定并进来）
 * @returns {{rejects: string[], hints: string[]}} rejects 非空 ⇒ 拒收（逐条可点名的 400 文案）；
 *   hints 是「放行但要告知」那一路（G3 去重不足）。
 */
export function standingGate(sources, materials) {
	const shards = okMaterialShards(sources);
	const count = shards.length;
	const rejects = [];
	const hints = [];
	if (count === 0) return { rejects, hints }; // 零源旧书没有材料（演示书有 1 份 converted:'ok' 的源，不走这一路）：与「零片不要求 knowledgePoints」同口径
	const mats = Array.isArray(materials)
		? materials.filter((m) => m !== null && typeof m === "object" && !Array.isArray(m))
		: [];
	const numOf = (m) => {
		const x = Number(m?.num);
		return Number.isSafeInteger(x) ? x : null;
	};
	const materialOf = (n) => mats.find((m) => numOf(m) === n);
	const standingOf = (n) => {
		const m = materialOf(n);
		return typeof m?.standing === "string" ? m.standing.trim() : "";
	};
	// G1（含 G2 豁免）：≥2 份转换完成的源 ⇒ 逐源都要有一份非空 standing。
	// 单源不要求——单本教材的声明无信息量（豁免也写进了交办契约文本，见 explore outputs）。
	if (count >= 2) {
		const missing = shards
			.filter(({ n }) => standingOf(n) === "")
			.map(({ n, source }) => `第 ${n} 份材料（${source?.file ?? "?"}）`);
		if (missing.length > 0) {
			rejects.push(
				`${missing.join("、")}没有分量声明（standing）——多源书要逐源写一句「这份材料在什么问题上说了算、在什么问题上不算数」（落在各自分片 ${knowledgeShardRel("NN")} 的 materials[].standing）。`,
			);
		}
		// G3：去重后条数 == 源数只作 hint（两份材料地位确实可能相同，硬拦必假红）。
		// 有缺声明时拒收已经发生、hint 不再另发（chapters 只在无 rejects 时消费 hints）。
		if (missing.length === 0) {
			const distinct = new Set(shards.map(({ n }) => standingOf(n))).size;
			if (distinct !== count) {
				hints.push(
					`有材料写了同一句分量声明（去重后 ${distinct} 条 ≠ 源数 ${count}）——分量声明要逐源写「这份材料在什么问题上说了算」，两份一字不差的声明多半没逐源想过；两份材料地位确实可能相同，机器只提醒不拒收。`,
				);
			}
		}
	}
	// G4（真题源，单源也不豁免——豁免针对的是「单本教材声明无信息量」，真题的「有无答案」
	// 表态在哪都有信息量）：非空 ＋ 显式表态。去重那一半归 G3 的 hint，不在这里硬拦。
	// ── G4 的触发面：**合并件里那一句声明**（票 `pre-gold-build/03`）─────────────────────────────
	// 票 01 已把材料判定判出来的 role 按 `num` 并进合并件 `materials[]`，于是 G4 与 G1／G3 读的是
	// **同一处盘上产物**——⛔ 不再读 `meta.sources[].role`（那一处从此不参与任何判据；票 02 改的是
	// 它的八处 UI 读侧，与本闸无关）。
	//
	// ⚠️ **我的枚举面比现实窄在哪里**（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）：
	//   ① **这是自证**：真不真题由**合并件里那一句声明**说了算（声明来自 AI 自己写的那份材料判定）。
	//      `materials[]` 那一条没有 `role` 键／`role` 不是「真题」⇒ **这一份不进本闸的射程**：
	//      机器认不出「它其实是真题」，也不该装认得（判定对不对是真机层，ADR-0005）。
	//      ⇒ 本闸咬的是「**声明了是真题**却没表态有无配套答案」，不是「所有真题都表了态」。
	//   ② 只验**表态字根**在不在（`答案|评分`），不验「带没带」、不验答案在哪、够不够（见上一段）。
	//   ③ 配对按 `num`（与 G1／G3 同一份口径）：合并件里对不上号的条目**不进射程**——那是分片内容
	//      问题，归抽查面（同上面那段「为什么按源配对而不按 materials 每项盲扫」）。
	//   ④ 源上那个历史字段（`meta.sources[].role`）**一个字节都不看**：老书写着「真题」而判定没判成
	//      真题 ⇒ 不触发；判定判成真题而源上写着别的 ⇒ 照旧触发。
	for (const { n, source } of shards.filter(({ n }) => materialOf(n)?.role === REAL_EXAM_ROLE)) {
		const standing = standingOf(n);
		if (standing === "") {
			rejects.push(
				`第 ${n} 份材料（${source?.file ?? "?"}，角色「${REAL_EXAM_ROLE}」）没有分量声明（standing）——${REAL_EXAM_ROLE}源必须写，且要显式写明有无配套答案与评分标准（机器只验表态了没有；带没带以实际文件为准）。`,
			);
		} else if (!ANSWER_STANCE_RE.test(standing)) {
			rejects.push(
				`第 ${n} 份材料（${source?.file ?? "?"}，角色「${REAL_EXAM_ROLE}」）的分量声明没有显式表态「有无配套答案与评分标准」——写明有还是没有（如「自带答案与评分标准」或「无配套答案，仅题干」）。`,
			);
		}
	}
	return { rejects, hints };
}

// ── 终检五份分查（票 11 · ADR-0030 决策 13 · ADR-0027）──────────────────────────
//
// 病是**只活在一次对话里**：终检那五份分报告在方法论文档里被逐字写死成「这一层不落盘」，
// 于是 5 份实测 0 份落盘、合计四万多字符的回灌没有任何实物可查。票 11 把它们接上落盘线。
//
// ⚠️ **报告人自落，不是协调员转写**（用户故事 26）：落盘者是**写那份报告的那个小助手**。
// 「产出 ≠ 改被审文件」——保住终检「只报告不改文件」那条铁律，
// 否则「自落」会被读成「顺手把书改了」，而那正是 §10.d 之外不许有的动作。
//
// 五路的**范围**取自 `resources/references/audit-and-testing.md` §10.a 的建议切法（按判据分、
// 不按章数分）；落盘点由这里**单一持有**（与 `paths.reportDir()` 同源），派发模板与
// 交办说明只**引**它，不各写一份文件名——`§九 回灌三件套`那张表里的「细目落盘点」列
// 与 §10.b 的正文都要跟着这一份走（`test-subagent-report-budget.mjs` 两边逐字对账）。

/**
 * 终检五路的范围与序号（**份数固定是五**——这不是配置项，是 ADR-0027 决策 1 的口径）。
 *
 * @type {ReadonlyArray<{n: number, scope: string}>}
 */
export const FINAL_AUDIT_SCOPES = Object.freeze([
	{ n: 1, scope: "成品完整与每章自查记录" },
	{ n: 2, scope: "AI 脚手架残留、练习与答案齐全" },
	{ n: 3, scope: "与已拍板设计一致" },
	{ n: 4, scope: "材料可追溯、引用矛盾" },
	{ n: 5, scope: "事实与跨章一致性" },
].map(Object.freeze));

// ⚠️ **文件名取机器词 `final`（分段键 `SEGMENT_PHASE.final`），不取「最后检查」也不取「终检」**
// （票 `context-budget/11` 收尾 · 维护者裁决 2026-10-04）。
//
// 这三个词各有一半是对的，合起来才不打架：
// · `CONTEXT.md`「界面用词表」判定线**④** 说 brief 任务说明是界面出口、要改；**⑤** 说
//   **文件名与产物路径是机器身份词、一个字不改**。所以「brief 里不许出现 `终检`」是真的，
//   「产物路径该用机器词」也是真的——**冲突只发生在「把路径逐字印进 brief」这一个动作上**。
// · 处置有三条，只有一条不违背判定线：**文件名保持机器词，且那个机器词不含界面避免词**。
//   `final` 是第六阶段的**分段机器键**（`SEGMENT_PHASE.final`），与 `audit-NN.md`／
//   `chapter-NN.md` 同一族命名法，ASCII、不含任何界面避免词 ⇒ 逐字印进 brief 也不判红。
// · 另两条为什么**不**选：①把文件名改成界面词「最后检查」＝**拿界面词写进机器身份词那一列**，
//   是把判定线⑤倒过来用；②保留 `终检-NN.md` ＋ 给 brief 开豁免＝让一道「brief 不含避免词」
//   的门从此有一个洞，而门的作用正是防界面词回流。
// · 界面上这一族叫什么**不归文件名管**：那是 `ui/view-rules.js` 的 `nameForRel`（界面取词）那一层的事。
//
// 已实测：把 `finalAuditReportName` 的字面量改回 `终检-NN.md`，`test-wording-invariants.mjs`
// 的「brief 任务说明（判定线④）不含避免词」当场判红（2026-10-04）。

/** 第 n 份分报告的**基名**（`final-NN.md`）——拼绝对路径时接在 `paths.reportDir()` 底下。 */
export function finalAuditReportName(n) {
	return `final-${String(n).padStart(2, "0")}.md`;
}

/** 第 n 份分报告的**书夹相对路径**（`工作区/报告/final-NN.md`）——brief 与 400 文案交出去的那一份。 */
export function finalAuditReportRel(n) {
	return `${REPORT_DIR_REL}/${finalAuditReportName(n)}`;
}

/** 五份分报告的**基名清单**（验货用；顺序＝派发顺序，缺失时逐份点名）。 */
export function finalAuditReportNames() {
	return FINAL_AUDIT_SCOPES.map((row) => finalAuditReportName(row.n));
}

/** 五份分报告的**书夹相对路径**清单（交办说明与拒收文案用）。 */
export function finalAuditReportRels() {
	return FINAL_AUDIT_SCOPES.map((row) => finalAuditReportRel(row.n));
}

// ── 产物行的**配对检查件**（票 `context-budget/15` · ADR-0031 决策 4 补记）──────────
//
// **病（这节存在的理由）**：`engine.stepRowState` 曾用「把产物文件名就地改成检查件名」
// （`chapter-NN.md` → `audit-NN.md`）去找配对检查件。对 `工作区/book.md`、`explore.md`、
// `outline.md` 这些**不带章号前缀**的行，那次替换**原样返回**，于是 `auditPath === productPath`
// ⇒ `hasAudit` 恒等于「产物在」、`chapterAuditOlderThanChapter(x, x)` **自己跟自己比**恒真
// ⇒ **`stale` 档在这些工序结构性不可达**，而代码注释却写着「**没有**配对检查件 ⇒ 这一项不适用」。
// **注释与实现分家：实现是「拿自己当检查件」，不是「没有检查件」。**
//
// ⚠️ **它住在 `domain-rules` 而不是 `engine`**：与 `finalAuditReportRels()` 那几个出口同源，
// 而「这一行有没有配对检查件」是**两侧都要知道的事实**（注入面日后要按它判档）。
//
// ⚠️ **查过盘上事实才这么写**（不是按名字猜）：
// · **最佳范例章（gold）**：产物是范例章正文 `工作区/chapter-NN.md`，配对检查件是**同号**的
//   `工作区/audit-NN.md`（audit 族的同款契约，`goldAuditName()` 那个写入点即其定义点）。
// · **最后检查（final）**：产物是 `工作区/book.md`，配对检查件是**五份分报告**
//   （`工作区/报告/final-NN.md`）——它们**读的是这一份成品书、且晚于它落盘**，所以接得上。
// · **读材料挑重点（explore）／章节安排（outline）／合并成书（merge）**：**结构上没有配对检查件**
//   ⇒ `stale` 档对这三族**不适用**（注册表里也没有对应的「检查记录」族）。
//   ⚠️ **合并成书（merge）那一族要特别点名**：`工作区/audit-cross.md`（跨章审计）**确实存在**，
//   但它是**输入侧**的关卡——它在 `book.md` 由机器拼出来**之前**落盘（`stage-submit merge`
//   的验货硬门槛）。把它配成 `book.md` 的检查件，`book.md` 必然恒比它新 ⇒ `stale` 恒真
//   ⇒ `merge` 永远到不了 `ready`——**那正是这次要治的病的另一种写法**。所以这里刻意**不配**。
//
// **空数组不是「兜底蒙过去」**：调用方据它**结构上**表达「这一行没有配对检查件 ⇒ 这一项不适用」，
// 而不是靠一次自比较恒真蒙过去（判据 `test-tool-discipline.mjs` 的「配对检查件」那几格反证这一点）。
export const PAIRED_AUDIT_ROWS = Object.freeze([
	Object.freeze({
		stage: "gold",
		// 产物名带 `chapter-` 前缀，检查件名是同款前缀 `audit-`，**序号逐字不变**。
		productPrefix: `${WORK_DIR_NAME}/chapter-`,
		productSuffix: ".md",
		auditPrefix: `${WORK_DIR_NAME}/audit-`,
		auditSuffix: ".md",
		auditRels: null,
		why: "范例章正文与它的检查记录是同一对序号（audit 族的同款契约）",
	}),
	Object.freeze({
		stage: "final",
		productPrefix: null,
		productSuffix: null,
		auditPrefix: null,
		auditSuffix: null,
		productRel: `${WORK_DIR_NAME}/book.md`,
		auditRels: finalAuditReportRels(),
		why: "五份分报告读的就是这一份成品书、且晚于它落盘",
	}),
].map(Object.freeze));

/**
 * 这一行（某一步的某个产物行）的**配对检查件**——**空数组＝结构上就没有配对检查件**。
 *
 * @param {string} stage 分段机器键（`STEP_OUTPUT_ROWS` 那一列的键）
 * @param {string} productRel 产物行的**书夹相对**形状（规范形状）
 * @returns {string[]} 配对检查件的书夹相对形状；**没有配对检查件时是空数组**
 */
export function pairedAuditRels(stage, productRel) {
	for (const row of PAIRED_AUDIT_ROWS) {
		if (row.stage !== stage) continue;
		if (row.productRel !== undefined) return row.productRel === productRel ? [...row.auditRels] : [];
		const name = String(productRel ?? "");
		if (!name.startsWith(row.productPrefix) || !name.endsWith(row.productSuffix)) continue;
		const stem = name.slice(row.productPrefix.length, name.length - row.productSuffix.length);
		return [`${row.auditPrefix}${stem}${row.auditSuffix}`];
	}
	return [];
}

// ── 终检五份的**派生汇总件**（票 `context-budget/12` · ADR-0030 决策 18–20）────────
//
// 机器在五份分报告齐了之后，按**固定形状**把它们逐条点名条目的**并集（去重）**拼成一份，
// 落在同一目录里；主笔读这一份、按条目改，不通读全书。
//
// ⚠️ **它是派生的，不是第六份报告**：五份各自的结论**一份都不合并、不替代**，
// 机器也**不出裁决**（不出「通过／不通过」）——裁决仍归主笔。所以这份件里逐字没有结论行，
// 它的正文只有「哪几路各点了哪些条目」。
// ⚠️ 措辞纪律与 {@link finalAuditReportName} 那条同源：`final` 是分段机器键、
// `summary` 是 ASCII 机器词，两个都不含界面避免词 ⇒ 路径逐字印进 brief 也不判红。
// 界面上这一族叫什么不归文件名管（那是 `ui/view-rules.js` 的 `nameForRel` 那一层）。
export const FINAL_AUDIT_SUMMARY_NAME = "final-summary.md";

/** 汇总件的**基名**（`final-summary.md`）——拼绝对路径时接在 `paths.reportDir()` 底下。 */
export function finalAuditSummaryName() {
	return FINAL_AUDIT_SUMMARY_NAME;
}

/** 汇总件的**书夹相对路径**（`工作区/报告/final-summary.md`）——brief／指针／判据都引它。 */
export function finalAuditSummaryRel() {
	return `${REPORT_DIR_REL}/${finalAuditSummaryName()}`;
}
/** 谈判桌归档的旧稿章节（`chapter-01.md.3f2k` 这种带时间戳后缀的名字，故不能按扩展名判）。 */
const ARCHIVED_CHAPTER_RE = /^工作区\/_旧版产物\/chapter-\d{2}\.md\.[0-9a-z]+$/;
/** 三次设计关卡的提案（设计关卡方案）。 */
const GATE_PROPOSAL_RE = /^工作区\/方案\/关卡[123]-v\d+\.md$/;
/** 材料转换出的 Markdown（MinerU 产物，给人读原料）。 */
const CONVERTED_SOURCE_RE = /^材料\/转换稿\/.+\.md$/;
/** 老形状的精读细目（票 `context-budget/03` 的 `工作区/reading-NN.md`）——**只读兼容**。
 *  ⚠️ 票 11 之后**不再有生产点**写这一族（新落点是 `工作区/细目/`，走 {@link DETAIL_NOTE_RE}）；
 *  留着它只为 spec 决策 26「读侧兼容旧名优先」——极老的书若自发落过一份，预览通道仍认得它。
 *  ⚠️ 它**不在** {@link BOOK_PRODUCT_FAMILIES} 里（那份表只声明「应当有什么」，老形状已不是
 *  应当有的产物），所以它在盘上时会被对账判成「多件」——那是正确的：那是改名改漏的痕迹。 */
const READING_NOTE_RE = /^工作区\/reading-\d{2}\.md$/;
/** `工作区/细目/` 下的全文细目（票 `context-budget/11` 接线后的家；阶段一只加不改）。 */
const DETAIL_NOTE_RE = /^工作区\/细目\/.+\.md$/;
/** `工作区/报告/` 下的审计与检查报告（票 `context-budget/11`／`12` 接线后的家）。 */
const REPORT_NOTE_RE = /^工作区\/报告\/.+\.md$/;

/**
 * 这份产物该怎么给人看。
 *
 * ⚠️ **输入先过 {@link normalizeBookRel}**：老书扫出来的行带老名前缀（老名那一段的章节正文、
 * 老名那一段的拍板方案），不归一的话**每一份老书产物都判成 `'machine'`**——界面上「打开」全没了、
 * `/textbook/file` 逐条 403，而这份判据正是那两处的共同白名单。归一单向，新名原样穿过。
 *
 * @param {string} rel - 书文件夹相对路径（形如 `工作区/chapter-01.md`；老名形状也认）。
 * @returns {'preview'|'inline'|'machine'}
 */
export function productOpenMode(rel) {
	const path = normalizeBookRel(rel);
	if (path === "工作区/knowledge-map.json") return "inline";
	// ⚠️ `工作区/outline.md`（章节安排）**是同一族**（票 pipeline-wiring-gaps/09）：名字带 `.md`，
	// 内容是机器 JSON（`{"chapters":[…]}`，见 actions/chapters.js 的 JSON.stringify 落盘），
	// 与 `工作区/audit-NN.md` 同一个判据——不是「有正文的产物」。它比 audit 那一族多一件东西：
	// **有人读**，所以不判 `'machine'`（那会把人读出口整个砸掉），而判 `'inline'`——
	// 人读形态由**就地折叠清单**承担：确认卡（`OutlineConfirmCard`，拍板前就在屏上）
	// 与阶段页第 3 阶段的 `OutlineBlock`（`machine-product-folds.foldOutline`）两处，与知识地图同一条路。
	// 判据是**显式清单**，不是「后缀是 .md 就当正文」——那份清单才是这一族唯一的分界。
	if (path === "工作区/outline.md") return "inline";
	if (
		NUMBERED_CHAPTER_FILE_RE.test(path) ||
		ARCHIVED_CHAPTER_RE.test(path) ||
		GATE_PROPOSAL_RE.test(path) ||
		CONVERTED_SOURCE_RE.test(path) ||
		READING_NOTE_RE.test(path) || // 老形状的精读细目（**只读兼容**，新落点见下一行）
		DETAIL_NOTE_RE.test(path) || // 精读细目的家（票 `context-budget/11` 接线）
		// 报告目录（票 `context-budget/11`／`12`）：⚠️ 这一族是**目录族**判据，
		// 所以五份分报告**与那份派生汇总件**（`final-summary.md`）一并落在 `'preview'`——
		// 票 12 的「新增产物必须回答预览准入」是这一行答的，不另开一条判据（另开一条就会
		// 出现「目录族已经认了、单独那行漏了」这种两条清单互相矛盾的状态）。
		REPORT_NOTE_RE.test(path) ||
		path === "工作区/explore.md" || // 探查报告
		// ── 票 `goals-handoff-missing/01`：站 3 那份正文（`工作区/目标-vM.md`）───────────────
		// 病（真宿主 2026-10-26）：它既不在本清单也不在排除表里 ⇒ 落到 `'machine'` ⇒ `/textbook/file`
		// 403 ⇒ 站 3 那张卡读不到自己那一份，「0 条」＋主键恒灰（演示书与真书两条独立证据；
		// `.scratch/gallery-realign/map.md:102` 把那条债记在案）。它**不是**机器件：版式是
		// `1. ` 起首的编号行（`goal-doc-format.renderGoalDoc`），读者就是那一屏上逐条改／删／加的人。
		// ⚠️ 判据走**那一族的唯一出口** `isGoalDocRel`（`goal-doc-format.js` 的 `GOAL_DOC_RE` 就是
		// 写侧 `workflow/goal-doc.js` 读目录时用的同一个正则），⛔ 不在这里手抄第二份「目标-v\d+.md」
		// ——抄一份就多一处会与写侧漂的枚举。
		isGoalDocRel(path) || // 站 3「学完能做到什么」的正文（带版本号）
		path === "工作区/style-spec.md" || // 写作规范（同为设计文档，步清单把它当产物列出）
		path === "工作区/book.md" || // 成品
		path === "过程记录.md" // 流水账（写给人读的全局产物；ADR-0015 决策 1：从「不给人读」那一族挪回这里）
	) {
		return "preview";
	}
	// 机器产物与源 PDF 不开预览（ADR-0010 决策 2/3）：project.json、timeline.jsonl、源 PDF、
	// 机器审计 JSON（工作区/audit-NN.md，名字带 .md 也一样）、工作区/progress.md、工作区/style-line.md。
	// ⚠️ 别把「过程记录」再并列回这里——它写给人读，ADR-0015 已把判据改回 `preview`。
	// ⚠️ 上面两处 `'inline'`（知识地图、章节安排）才是「机器产物但有人读形态」那一档：
	// 它们既不进右栏，也不落回 `'machine'`，人读形态是卡片内联折叠清单。
	return "machine";
}

/** 是否「打开一份文件看看」的产物（有正文 → 右栏预览）。 */
export function isPreviewProduct(rel) {
	return productOpenMode(rel) === "preview";
}

/** 产物路径归一化：反斜杠与 `./` 前缀不参与分类，**老名前缀也一并映成新名**（见 {@link normalizeBookRel}）。 */
function artifactPath(rel) {
	return normalizeBookRel(rel);
}

/**
 * 产物的人读类型词（按路径形状判，不按扩展名猜）。
 *
 * ⚠️ 章节序号在名字层是宽松的（`\d+`），这与 productOpenMode 的严格两位白名单不同：
 * 这里只负责给路径起一个类型词，不能因为旧书路径形状略有差异就退回「文件」。
 * 双端共用的纯规则，不带 Node/React 依赖。
 */
const ARTIFACT_CHAPTER_NAME_RE = /^工作区\/chapter-(\d+)\.md$/;
const ARTIFACT_ARCHIVED_RE = /^工作区\/_旧版产物\//;
const ARTIFACT_GATE_PROPOSAL_RE = /^工作区\/方案\//;
const ARTIFACT_CONVERTED_SOURCE_RE = /^材料\/转换稿\//;
/** 用户上传的原件（`sources/<文件名>`，原样保留扩展名——它是**上传物**，不是一个待读的产物）。 */
const ARTIFACT_ORIGINAL_RE = /^sources\//;

/** 产物路径 → 人读类型词；认不出时返回「文件」。 */
export function artifactKind(rel) {
	const path = artifactPath(rel);
	if (ARTIFACT_CHAPTER_NAME_RE.test(path)) return "正文";
	if (ARTIFACT_ARCHIVED_RE.test(path)) return "旧稿";
	if (ARTIFACT_GATE_PROPOSAL_RE.test(path)) return "拍板方案";
	if (ARTIFACT_CONVERTED_SOURCE_RE.test(path)) return "材料转换稿";
	// 原件（票 `mineru-formats/11`）：类型词就是登记词「原件」，不退成「文件」——
	// 材料行那个「打开原件」入口的悬浮提示按名字取（`artifactName`），不许退化。
	if (ARTIFACT_ORIGINAL_RE.test(path)) return "原件";
	if (path === "工作区/explore.md") return "挑重点的结果";
	if (path === "工作区/outline.md") return "章节安排";
	if (path === "工作区/style-spec.md") return "写作规范";
	if (path === "工作区/book.md") return "成书";
	return "文件";
}

// ── 写作规范里**机器逐字软验的那五节**（票 `demo-channel-full/19` 起单点持有）──────────────
//
// 真书 `stage-submit(gold)` 那一跳会逐字查这份规范里**五节的标题在场**（缺了拦下让 AI 补全）。
// 演示通道的范例章由机器**直接写盘**（`engine.js` 的 `runPhase4` 演示支）、**不经那个动作**，
// 于是票 19 让两侧**共用同一份判定**：本文件出表与判定，`actions/chapters.js`（真书交工那一跳）
// 与 `engine.js`（演示支写盘之后）各调一次。⚠️ 票 19 之前这份数组**只活在** `chapters.js` 里。
//
// ⚠️ 这五个词的**词形不是本文件的自由**：第四、第五项必须与契约正本
// `resources/references/subagent-prompts/gold-writing-agent-prompt.md` 里那两项的节标题**逐字一致**
// （历史上「列表 vs 清单」两词并存过，代价是范例章交工恒被拒）——对账面在
// `test-scaffold-declaration.mjs`：它从**契约源文**解析出词来比，⛔ 不硬编码第二份词表。
// ⚠️ **我的枚举面比现实窄在哪里**：契约一共十九项，**机器只逐字查这五节**，其余十四项一个字都不读
// （那句话在派发模板与 `chapters.js` 那段注释里都写着）——别把这份表读成「十九项都在这里」。
// ⚠️ 它查的是**节标题的子串在场**，**不查内容合不合理**（软验的已知失效路径，注释在 `chapters.js`）。
export const STYLE_SPEC_REQUIRED_SECTIONS = Object.freeze([
	"模式选型",
	"板块语法",
	"深度四维承诺",
	"脚手架标题列表",
	"多源同级声明",
]);

/** 一份写作规范**缺哪几节标题**（按 {@link STYLE_SPEC_REQUIRED_SECTIONS} 的顺序点名；齐全时返回空数组）。 */
export function styleSpecMissingSections(specText) {
	const text = typeof specText === "string" ? specText : "";
	return STYLE_SPEC_REQUIRED_SECTIONS.filter((heading) => !text.includes(heading));
}

// ── 最后检查（质量门）清单后半那一段的**项名单点**（票 `demo-flow-fidelity/06`）──────────
//
// 这份名单是 `runQualityChecks` **后半那一段**（`engine.js` 里被 `meta?.demo !== true` 挡住的
// 那几处 `checks.push`）的**服务端 `name` 逐字**——不是人读短名：上屏前**逐项过 `checkHuman`**
// （`src/ui/view-rules.js` 的 `CHECK_UI`，那张表的键就是服务端 `name`）。它服务两个出口，
// **只此一份**：
//   ① `src/ui/view-rules.js` 的 `demoQualityChecksNote()`——演示书的终检认可卡
//      （`event-cards.js`）与阶段页第 6 阶段那块（`phase-page.js`）上那句
//      「真书上这里还会跑『…』这些项」；屏上是**界面词**（如「有工作记录可查」）；
//   ② `src/demo-exemptions.js` 的 `quality-checks-tail` 声明——它的机器可读元数据
//      `checkNames` **就是这个数组**（票 08 的豁免面），`what` 那句也从它拼出来。
//      那份声明面只给判据读、**不上屏**，所以它留服务端 `name` 是对的（判定线：机器检查
//      `name` 是机器身份词，一个字不改；翻译发生在界面出口）。
// 两处是同一个引用 ⇒ 不存在「声明面自己内部先漂一份」。
//
// ⚠️ **这份名单从哪几处现读、为什么不是手抄**（票 06 的
// `## code-review 双轴收口（2026-10-08）` 订正过一版）：逐条取自 `src/workflow/engine.js`
// 的 `runQualityChecks` 里**被 `meta?.demo !== true` 守卫挡住的那几处 `checks.push({ name })`**
// ——今天 15 处（顺序＝代码里的先后）：风格线条条有着落／进度账本齐全／成品无乱码（U+FFFD）／
// 章节数符合大纲／成品与各章正文一致／成品里没有已划掉的知识点／必含板块齐全（契约项）／
// 无禁用词（契约项）／拆脚手架八类残留／正文无元指令残留（human-readable）／章节引用可追溯（无引用矛盾）／
// 交叉引用指向真实存在的章／章名全书唯一／无重复标题／字数兜底读数。**逐字以那几处 `name` 为准**；那边增删一处，回来同步这一份
// （票 06 原版是**人读短名**、还把「章名全书唯一」与「无重复标题」合成一格，共 8 项——
// 收口时按服务端 `name` 改成 9 项，因为上屏要过 `checkHuman`，而那张表的键必须是服务端名；
// 票 `pre-gold-build/16` 补了交付清单那三道，于是 9 → 12；票 `walkthrough-fixes/36` 补了
// 「成品与各章正文一致」，于是 12 → 13；票 `word-budget-ineffective/02` 补了
// 「字数兜底读数」，于是 13 → 14；票 `exclusion-flow/03` 补了
// 「成品里没有已划掉的知识点」，于是 14 → 15）。
//
// ⚠️ **它是说明文字、不是判据**（票 06 要做的第 3 条）。这份名单比现实**窄**在哪，写清楚：
//   · 现实里那一段是**条件式**的——「正文无元指令残留（human-readable）」只有
//     `meta.route === 'human'`（人读路线）才 push——那一路线的正文可以含元指令块与章级
//     yaml frontmatter（`two-routes.md` 两路线对照表）；「成品与各章正文一致」只有
//     **机器合并过的书**（账本里有合并交工，票 `walkthrough-fixes/36`）才 push——回退残留的
//     `book.md` 机器还没拼过它，那一刻无从判；「成品里没有已划掉的知识点」只有那份件里有
//     **今天还算数的裁决**（`readCoverageCollection().live` 非空，票 `exclusion-flow/03`）才 push
//     ——没有那份件的老书不凭空多一行。**票 `flow-audit-2026-10/03` 起**「必含板块齐全（契约项）」
//     与「无禁用词（契约项）」**不再**按声明行出现/消失：基线由机器定，没有基线时也 push 一行
//     `state:'not-checked'`（既不折进「全过」、也不算「没过」）。名单把它们连同其余那几处一起列出，
//     意思是「真书上**会**跑这些项」，不是「每一项都必然跑」。
//   · 现实里 `runQualityChecks` 还会按 `style-spec` 的脚手架标题声明追加 0–2 项——那两项
//     **不在本名单里**（真实与演示**都会**跑它们，不属「演示少跑的那一段」）。
//   ⇒ 演示通道哪天多跑/少跑一项，**没有任何机器闸门会响**：这份名单与 08 的声明面都要人来
//     改一次（票 `dev-gate-scan/17` 那条纪律：判据与被判物共用一份枚举时，改坏是恒绿的）。
//   ⇒ 名单里每个名字都必须能在 `CHECK_UI` 里查到（查不到时 `checkHuman` **原样返回机器名**，
//     那就是屏上一次静默泄漏）。收口时逐项核过：名单上的每一项都有条目，另修掉一条**过期键**。
/** `runQualityChecks` 后半那一段的**服务端 `name`**（今天 15 处 `checks.push`；顺序＝代码里的先后）。 */
export const QUALITY_CHECKS_TAIL_NAMES = Object.freeze([
	"风格线条条有着落",
	"进度账本齐全",
	"成品无乱码（U+FFFD）",
	"章节数符合大纲",
	// 票 `walkthrough-fixes/36`：成品＝各章正文的拼装件（只在机器合并过的书上 push，见 `engine.js` 那一处）。
	"成品与各章正文一致",
	// 票 `exclusion-flow/03`：成品里不出现「人已划掉」的知识点（只有那份件里有 live 裁决时才 push，
	// 与上面那一格同一段；可走「其他」豁免，见 `engine.js` 那一处）。
	"成品里没有已划掉的知识点",
	"必含板块齐全（契约项）",
	"无禁用词（契约项）",
	"拆脚手架八类残留",
	"正文无元指令残留（human-readable）",
	"章节引用可追溯（无引用矛盾）",
	"交叉引用指向真实存在的章",
	"章名全书唯一",
	"无重复标题",
	// 票 `word-budget-ineffective/02`：字数兜底下限（低于不过；达到/超过一律通过，不设上限）。
	"字数兜底读数",
]);

/**
 * 「不算没过」的检查状态闭集（票 `flow-audit-2026-10/03` 的 `not-checked` ＋ 票 `01` 的
 * `not-rechecked` ＋ 既有的 `skipped`）。**判据只此一份**：交工放行、认可交付、界面三处
 * 都从这里取，⛔ 不许在各处再手写一串 `state !== …`。
 */
export const NON_BLOCKING_CHECK_STATES = Object.freeze(["skipped", "not-checked", "not-rechecked"]);

/** 这个 `state` 是否属于「不算没过」的那一档。 */
export function checkStateIsNonBlocking(state) {
	return NON_BLOCKING_CHECK_STATES.includes(state);
}

/** 这条检查是否真的挡住交付：`ok` 不是 `true`，且 `state` 不在「不算没过」闭集里。 */
export function checkBlocksDelivery(check) {
	return check?.ok !== true && !checkStateIsNonBlocking(check?.state);
}

// ── 账本事件类型 ────────────────────────────────────────────────────────────

/** 账本合法事件类型（appendEvent 落账校验；前端对照防拼错）。勿在运行期增删。 */
export const EVENT_TYPES = new Set([
	"textbook/phase-start",
	"textbook/phase-end",
	"textbook/agent-start",
	"textbook/agent-end",
	"textbook/gate-proposal",
	"textbook/gate-decision",
	"textbook/mineru-progress",
	"textbook/rollback",
	"textbook/source-added",
	"textbook/hint",
	"textbook/quality",
	"textbook/delivery",
	"textbook/error",
	"textbook/stage-start",
	"textbook/progress",
	"textbook/review",
	"textbook/ai-report",
	"textbook/style-note",
	"textbook/intervention",
	"textbook/intervention-done",
	"textbook/waiver",
	"textbook/waiver-revoke",
	"textbook/pause",
	"textbook/resume",
	"textbook/outline-decision",
	"textbook/gold-opinion",
	"textbook/gold-seal",
	"textbook/gold-chapter",
	"textbook/chapters-review",
	"textbook/final-approve",
	"textbook/deep-modify",
	"textbook/deep-undo",
	"textbook/pattern-added",
	"textbook/submit-rejected",
	"textbook/style-spec-change",
	// 票 dsh-contract-drift/09：客户端确认提问卡结算了、却从读面回读不到答案（`unread: true`）。
	// 这一笔说的是「这次提问**没有记上**、需要重新问用户」——不是一次作答（别把两档混成
	// 「（没有勾选）」那笔假话）。
	"textbook/question-unrecorded",
]);

/**
 * 账本事件的「双端含义表」（key 集合必须 === EVENT_TYPES，测试以双向闭包钉死）。
 *
 * - label：短人话含义（前端账本列表的兜底文案与图标来源；过程记录/播报的句子行文不在此）。
 * - emoji：该事件的图标（沿用前端 cardIcon 的既有约定；gate-decision / outline-decision
 *   的「通过/驳回」变体由消费端按 data.approved 覆盖，此处只放基准 emoji）。
 * - announce: false = 该型事件机器在主对话不播报（沉默策略，见 CONTEXT.md 工作台提示与
 *   验货频率收紧）：主 AI 现场已讲的过程性事件、用户自己刚做的动作、纯机器内部事件。
 *   缺省（未声明）即开口；hint / style-note 两个「看 data 再决定」的类型不在此列，
 *   留在 announceText 内特判。
 */
export const EVENT_META = Object.freeze({
	"textbook/phase-start": { label: "阶段开始", emoji: "▶️" },
	"textbook/phase-end": { label: "阶段完成", emoji: "🏁" },
	"textbook/agent-start": { label: "AI 开始", emoji: "🤖", announce: false },
	"textbook/agent-end": { label: "AI 完成", emoji: "🤖", announce: false },
	"textbook/gate-proposal": { label: "关卡提案", emoji: "📋" },
	"textbook/gate-decision": { label: "关卡拍板", emoji: "✅" },
	"textbook/mineru-progress": { label: "材料转换", emoji: "📄", announce: false },
	"textbook/rollback": { label: "回退快照", emoji: "⏪" },
	"textbook/source-added": { label: "上传材料", emoji: "📎", announce: false },
	"textbook/hint": { label: "提示", emoji: "💡" },
	"textbook/quality": { label: "质量门检查", emoji: "🛡️" },
	"textbook/delivery": { label: "交付完成", emoji: "🎉" },
	"textbook/error": { label: "出错", emoji: "⚠️" },
	"textbook/stage-start": { label: "交给 AI 动手", emoji: "🤖", announce: false },
	"textbook/progress": { label: "进度", emoji: "⏳", announce: false },
	"textbook/review": { label: "抽查意见", emoji: "👀", announce: false },
	// ⚠️ 票 10（判定三 #10）**不动本行**：本表是 ADR-0009 决策 1 的**双端含义表**（机器身份词，
	// 与「源探查」「铺章」同族），ui-wording 那批已把「事件含义表一律不改」写成决定（spec 的
	// Implementation Decisions）。界面上说「AI 检查报告」由 `src/ui/view-rules.js` 的 `EVENT_UI`
	// 覆盖（UI 取词只走那里）；服务端写给人读的出口（`logEntryText` / `announceText` / hint）
	// 各自在出口处翻译——「机器身份词不动、界面词只在出口处替换」正是那条决定的形态。
	"textbook/ai-report": { label: "AI 自查报告", emoji: "🛡️", announce: false },
	"textbook/style-note": { label: "风格线", emoji: "🎨" },
	"textbook/intervention": { label: "留言", emoji: "📮" },
	"textbook/intervention-done": { label: "留言已处理", emoji: "📮", announce: false },
	"textbook/waiver": { label: "豁免放行", emoji: "🛟" },
	"textbook/waiver-revoke": { label: "豁免收回", emoji: "🛟", announce: false },
	"textbook/pause": { label: "暂停", emoji: "⏸" },
	"textbook/resume": { label: "继续", emoji: "▶" },
	"textbook/outline-decision": { label: "章节安排拍板", emoji: "📋" },
	"textbook/gold-opinion": { label: "金标准意见", emoji: "✍️", announce: false },
	"textbook/gold-seal": { label: "金标准定稿", emoji: "🏆" },
	"textbook/gold-chapter": { label: "金标准章", emoji: "👑", announce: false },
	"textbook/chapters-review": { label: "章节过目确认", emoji: "🔍", announce: false },
	"textbook/final-approve": { label: "终检认可", emoji: "✅", announce: false },
	"textbook/deep-modify": { label: "定点修改", emoji: "✏️", announce: false },
	"textbook/deep-undo": { label: "撤销定点修改", emoji: "↩️", announce: false },
	"textbook/pattern-added": { label: "自定义模式", emoji: "📇", announce: false },
	// 交工/提审被拒（票 audit-matrix-contract/01 (d)）：机器把拒收与原因入账——用户与下一个接手的人
	// 不必再翻对话轨迹才知道这道闸门响过。**要开口**（用户正是被「机器报错、AI 说没事」卡住的人）。
	"textbook/submit-rejected": { label: "交工被拒", emoji: "🚫" },
	// 写作规范在范例章定稿之后被改过（票 `walkthrough-fixes/12` · 用户 2026-09-29 拍板选 ①）。
	// **机器替 AI 记这一笔**：原来只有终检交工那一刻的一次对账（改了又不声明就打回 400），
	// 于是「范例章定稿 88 分钟后规范被改、这 88 分钟里第 1–12 章全部照旧版落盘」这件事，
	// 账本里一个字都没有、界面上也看不出来——**机器有判据、界面看不出来、账本里也没有**。
	// 与 P31（「每章一个检查文件」被悄悄换成「每批一份」）同一个源簇，形状也同源：
	// **留痕而不禁止**——改规范本身是 AI 在样章执行中的正常收敛，直接拒收会变成死结。
	"textbook/style-spec-change": { label: "写作规范变更", emoji: "📝" },
	// 票 `dsh-contract-drift/09`：提问卡结算了、可这次的答案**没记上**（`unread: true`）。
	// `announce: false`——协调员每轮都读工作记录，这一句是留给它「需要重新问用户」的账，
	// 不在对话流里替它喊（与 `textbook/ai-report` 那类同口径）。
	"textbook/question-unrecorded": { label: "提问没记上", emoji: "📝", announce: false },
});
