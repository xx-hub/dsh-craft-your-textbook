/**
 * 造书工作台 · **知识点图**（票 `.scratch/knowledge-graph-build/issues/07` 画，`08` 划）
 *
 * ## 它是什么
 *
 * 阶段二探查确认卡里那个「▸ 知识点清单（N 个）」折叠块的**第三种读法**：把整张知识点图
 * **一次全画**出来（全量箭头、默认全讲）。它**不是**新的一屏、**不**新开阶段。
 *
 * 票 07 只画；票 08 在图上**划**（同一块，同一份模型）：整张图一次全画 → **只把最前沿那批
 * 交给人数落** → 划一张＝这张**不讲** → **重算前沿**，下一批浮上来 → 逐张判到底。
 * ⛔ **不做硬传播**：划掉一张**不替人把下游一起划**（这些边是 AI 判的、没人核过），
 * 下游**浮上来逐张判**；⛔ 也不做图编辑器（拖拽／手工连边／批量选框一概没有）。
 *
 * ## 四档的差别**只剩画法与动作键**（票 08 定三档；`rcb-build/02` 补上端；票 16 定四档）
 *
 * | 这一张此刻 | 画法 | 对话框里的动作键 |
 * | --- | --- | --- |
 * | **现在轮到**（`frontier`，下沿前沿） | 深绿 ＋ 「轮到第 N 张」 | `🗑 这部分不造进书里`（＝`不需要`）＋ `先不动它` |
 * | **上端**（`upper`，反向前沿） | 蓝底 ＋ 「上端第 N 张」 | **与上一档同一副**（`🗑` 也在这里） |
 * | **还轮不到**（`keep`，中段） | 淡绿（默认） | **只有一颗 `关闭`**（点开只读，⛔ 不能裁） |
 * | **已否**（`dropped`） | 灰 ＋ 划掉 | `↩ 放回来（要讲）` |
 *
 * ⇒ **撤销只在两端**：下沿前沿（`frontier`）与上端前沿（`upper`）。两端都沾时按下沿算（行为等价）。
 * 中段那一档刻意**没有一句解释文字**——它表达的是「能读、能关」，不是「不能裁」；⛔ 别把已退役的
 * 「当前不支持裁决」加回来（那句话写的是另一件事）。
 *
 * ⚠️ **为什么上端仍能裁**（`rcb-build/02` 的 Acceptance）：`不需要`（本书不覆盖这个主题）是
 * **范围轴**的判断；上端那一批正是「这本书要不要覆盖它」的判断面 ⇒ `upper` 与 `frontier` 同一副键。
 * **下沿那一半（`已经会`）仍只经那把划子**（`KG_SCRAPER`，见下），而且划子**只对 `frontier` 生效**：
 * 「已经会」讲的是顺序，不适用上端，更不适用卡在中间的那一批。
 *
 * 对话框内容**仍然只有两行**（卡名 ＋ `testable` 整句给）：第三轮删掉的「为什么轮到它／划掉的
 * 后果／一行来路」、第四轮删掉的「先要定：…」与「待核」**都不许回来**。
 *
 * ## 改动走「意见」这条通路（票 08；⛔ 不做图编辑器）
 *
 * 按下划掉／放回**不是本地改一下就算**：它经 `onVerdict(key, verdict)` 递给壳，壳走
 * **第三条「意见」通路**（`graph-opinion`，`src/workflow/actions/chapters.js`，只认
 * `status === 'awaiting-explore'`）——通路认了（`true`）才翻本地这一份；⛔ 通路没认就什么都不改
 * （这正是「改动走意见通路」这句话的落点：它是**通路**，不是一次本地 state 写）。
 * ⚠️ 本票**不落地人的裁决产物**（`工作区/knowledge-map-exclusions.json` 归票 09）⇒ 这一份划痕
 * 今天只活在**界面上**，刷新就没了。这是**有意**的，票面逐字记着。
 *
 * ## 回执（⛔ 不摆总账）
 *
 * 按下划掉那一刻只给一条回执：`浮上来 N 张：<名字、名字>`（`floatReceiptText()`）——
 * ⛔ 不含机器读数、⛔ 不是「要讲／不讲／挡住」那种总账（后者是票 09 的读数面）。
 *
 * 画法与尺寸**照维护者给的规则原样实现**，出处是原型
 * `.scratch/knowledge-graph-step/prototype/06`（`build.mjs` 的 `layout()`／`edgePath()`／`chainOf()`）：
 * 容器宽是**输入**（每行几张卡现算）、相邻两行恒留 `gapY = 52px`（那是**连线露出来的地方**）、
 * 行高**逐行累加**、标题按容器宽换行且「一个字多宽」**真量**。
 *
 * ## 三处刻意的差别（⛔ 别去「对齐」原型）
 *
 * ① **全量 vs 默认约简**：这里画**全量**边（原型默认约简）；
 * ② **下沿只认「现在轮到的」、上沿按反向剥层**（`rcb-build/02`）：下沿的走法只看
 *   「未判 ∧ 门槛前置都已定」；上沿反过来看「未判 ∧ 它的**后继**都已定」，剥完一层浮上一层。
 *   ⚠️ 但**对话框那颗 `🗑`** 从 `rcb-build/02` 起**不按前沿关门**（`不需要` 是范围轴、与顺序无关）；
 * ③ **只浮上来 vs 派生传播**：前沿只按「未判 ∧ 门槛前置都已定」算，不做传播。
 *
 * ## 数据形状（票 03 定死的那两个键）
 *
 * `cards[] = { key, name, testable, anchor, difficulty?, confidence }`（把握档字段名＝`confidence`）；
 * `edges[] = { from, to, kind, confidence, reason }`，`kind ∈ EDGE_KINDS`。
 * ⚠️ **`kind` 必填**：⛔ 这里**不**套原型那句 `e.kind ?? 'prereq'` 的兜底——那会让「门槛只走
 * `prereq`」这句话声称的边集**悄悄变宽**（spec §5 第 5 条）。缺 `kind` 的边这里当「不算门槛边」
 * 画（它的线型也画不出把握档那三档），形状对不对归形状闸（`src/workflow/knowledge-map-gate.js`）。
 *
 * ## 两条读数（同一区、同一形状，⛔ 都不做硬门、⛔ 都不落交工账本）
 *
 * · 「本次扫面 N 条边（prereq X／alias Y／see-also Z）」——**措辞的唯一出处**是
 *   `src/workflow/knowledge-map-gate.js` 的 `edgeScanText()`，这里**原样吃它**，⛔ 不另写一句。
 * · 量级：`知识点数 ÷（章数 × OUTLINE_POINTS_MAX）`——⚠️「每章 20 条」是**上限、不是预算**，
 *   措辞里必须写清这一层（维护者订正：「应该会少很多」）。
 *
 * ⛔ **机器读数不上用户面**：环、闭包对数、约简条数、审校清单一个字都不许出现在这一屏
 * （它们只在原型的「自查」块里给取证用）。本模块的字符串面里也**不出现**那几个词。
 *
 * ## 假前沿（spec §6 那条形态级教训，票 07 **在图上如实标出来**，不是推迟）
 *
 * 原型那一轮 48 版的初始前沿 **10 张、入边全是 0** ⇒ 它们「轮到」不是因为前置判过了，
 * 而是**我们不知道它们前面是什么**。这里给出一条**块级**的如实说明（`fakeFrontierKeys()` 现算）；
 * ⚠️ 票 08 的走法里**这条口径一个字不改**：它按「这一刻的前沿」现算，划一张之后**新浮上来**的
 * 那些也照同一条尺子算（入边 0 ⇒ 记进假前沿），⛔ 不许一处标了、另一处长得像「前置都判过了」。
 *
 * ## 上沿：反向入场（票 `reader-cognition-boundary-build/02`；决定见 spec §2.3／`ADR-0043` 决策 3）
 *
 * 上沿＝**这本书能教到的知识范围**的上端。形态与下沿**同一把尺子、方向相反**：
 *
 * · `model.gateEdges` 为 **0** ⇒ `form: 'set'`——**一整批、不是顺序**；必须照实说「这批叶子卡
 *   不一定是真的上端，只是没人给它写过后继」（`upperBoundaryReading`），⛔ 不许把集合说成前沿；
 * · **≥1** ⇒ 反向前沿（「**未判 ∧ 它的后继都已定**」那批先交给人数落，剥完一层浮上一层）。
 *   ⛔ **升级触发只认算数的门槛边**：`knowledge-graph-edges/09` 量到有边的书里 46/68 张连一条
 *   `prereq` **入**边都没有 ⇒「有边」不等于能给出顺序，更不等于有人写过「谁是谁的后继」。
 * · 与下沿一样给两件如实读数：形态那一行读数（`data-kg-upper-boundary`）与**假终端**那块
 *   （反向前沿里连一条 `prereq` 出边都没有的那些，`fakeUpperFrontierReading`）。
 *
 * ⚠️ 本模块**不落任何上沿产物**：卡级裁决只有人（`by` 仍只有 `user`），落的是**同一份**
 * `工作区/knowledge-map-exclusions.json`（`reason: 不需要` 那一档）——⛔ 不新开字段／不落镜像。
 * ⚠️ **反向入场的手势**今天落成最小的同义形态：图上标出「上端第 N 张」、那一行读数点明剥层方向，
 * 判决照走对话框那颗 `🗑`（点哪张划哪张）。⛔ 不新增第二个划子、不新开第二条通路。
 *
 * ## 这一层「验不到什么」（`dev-gate-scan/17` 的窄处注释）
 *
 * · **它不判形状**：卡／边的字段合法性归形状闸；本模块把读不懂的项**画不出就不画**，不抛异常。
 * · **链高亮只走 `prereq` 且「待核」两边都不走**（原型 2026-10-13 实撞订正：第一版拿
 *   `childrenOf` 当路，而那张表把 `see-also` 也收了 ⇒ 点一张亮一大片 25／48）；
 *   ⚠️ 所以「点一张亮一条链」**不证明**这条链在语义上真是一条学习路径——那是边本身的事。
 * · **布局是网格不是一张卡一格**（排序键＝上端 → 层号 → key），所以「先学→后学」**不**是从下往上读。
 * · **曲线只保证起止点在卡片边上**（起点＝源卡底边中点、终点＝目标卡顶边中点），中途穿越
 *   别的卡不保证避开。
 * · **几何只在有排版引擎时才是真的**：Node 侧（`react-test-renderer`）一个字也不量，
 *   那一侧 `containerWidth` 落回 `KG_LAYOUT.fallbackWidth`，字号宽度落回 `fallbackCharW`
 *   ——真读数只在真浏览器里读（`node scripts/gallery.mjs read`）。
 * · **「浮上来」只算直接后果**：`floatedBy()` 报的是「划掉这一张之后、**这一刻**新变成前沿的
 *   那几张」，⛔ 不做传递闭包、⛔ 也不报「因此被连累的」——本模块根本不算那件事（不硬传播）。
 * · **本模块不替机器判「该不该裁」**：它只按图结构现算两条界与前沿；`不需要`／`已经会`
 *   都是**人**的取舍（`ADR-0040` 决策 3），服务端那一条通路只验「这张卡在图里」、不重算前沿
 *   （两处不各写一套量法）。
 */

import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
// 票 `ui-workflow-seam/04`：六个名字改从 `src/` 根级取——界面⛔ 不再知道 `workflow/` 的内部路径
// （`AGENTS.md` 的「Frontend layout」）。四个落点各是一条公开出口，值仍是同一份：
// · `EDGE_KINDS`  ← `../knowledge-edge-vocab.js`（声明住在图算法那边，根级只再导出）
// · `prereqEdges`／`edgeScanReading` ← `../knowledge-graph-door.js`（根级门，读数三格＋门槛边）
// · `KNOWLEDGE_CONFIDENCE_LEVELS`／`isDecided` ← `../knowledge-confidence.js`（**本来就住那儿**，
//   闸门只是再导出；这一步顺手把「经闸门取词」那层多余转手去掉）。⚠️ 根级那一份叫 `LEVELS`，
//   本文件沿用它既有那个名字（`as` 是**改名**，不是第二份声明——同一个冻结数组）。
// · `OUTLINE_POINTS_MAX` ← `../outline-limits.js`（那个数不再挂在 `workflow/actions/` 上）
import { EDGE_KINDS } from "../knowledge-edge-vocab.js";
import { edgeScanReading, prereqEdges } from "../knowledge-graph-door.js";
import { LEVELS as KNOWLEDGE_CONFIDENCE_LEVELS, isDecided } from "../knowledge-confidence.js";
import { OUTLINE_POINTS_MAX } from "../outline-limits.js";
// 票 `confirm-points-redesign-build/10`：两档理由常量住在 `domain-rules.js`（那里是它们的登记单点）
// ——本模块⛔ 不手抄第二份字面量（「已经会」／「不需要」两个字都只从那儿来）。
import { EXCLUSION_REASON_ALREADY_KNOWN, EXCLUSION_REASON_NOT_NEEDED } from "../domain-rules.js";
import { S } from "./styles.js";

// ── 四态配色 / 边线型（取值照原型 06 的 CSS 变量，一字不改）─────────────────────

/**
 * 卡片四态。**淡绿**＝要讲（默认）／**深绿**＝现在轮到（白字）／**蓝**＝上端（反向前沿）／
 * **灰＋划掉**＝已否。
 * ⚠️ 上端那一档用**色相不同**的蓝（`state-business-primary`），⛔ 不是深绿再深一度——色相不同；底色取 `business-tertiary`、正文取 `label-primary`，
 * 亮暗两套的计算色与对比度见票 16 的 `## Answer`；两条边界的卡都沾时按下沿算（`stateOf` 的优先级），所以同一张卡不会既深绿又蓝。
 * ⚠️ 本票**只画不改**（票 08 起）⇒ 真书今天产不出「已否」那一档（划掉归票 09 落盘）；它的取值
 * 仍在这里定义，由**图例**（`KG_LEGEND_ORDER`）与组件测试的 `dropped` 入参两条路看得见、量得到。
 * 票 `ui-cleanup/06`（判据 4）：四态只走宿主 `--dsw-alias-*` 语义槽位、不再自带 hex 调色板；
 * 明暗两套取值由宿主主题给，本文件不再写死对比度。
 */
export const KG_CARD_TONES = Object.freeze({
	keep: Object.freeze({
		label: "要讲",
		background: "var(--dsw-alias-state-success-tertiary)",
		border: "var(--dsw-alias-state-success-secondary)",
		color: "var(--dsw-alias-state-success-primary)",
		borderStyle: "solid",
		strike: false,
	}),
	frontier: Object.freeze({
		label: "现在轮到",
		background: "var(--dsw-alias-state-success-primary)",
		border: "var(--dsw-alias-state-success-secondary)",
		color: "var(--dsw-alias-label-primary-foreground)",
		borderStyle: "solid",
		strike: false,
	}),
	upper: Object.freeze({
		label: "上端",
		// 票 16：蓝底 ＋ 正文色 `label-primary`。⛔ 不用 `business-primary` 做底——那一档在亮色下
		// 配白字只有 4.23:1、低于既有那把尺子的 4.39 地板；这一组是一份**机器可量**的对比度读数
		// （亮 16.04／暗 9.79），颜色仍只走宿主 alias 槽位、⛔ 不新造 hex。
		background: "var(--dsw-alias-state-business-tertiary)",
		border: "var(--dsw-alias-state-business-primary)",
		color: "var(--dsw-alias-label-primary)",
		borderStyle: "solid",
		strike: false,
	}),
	dropped: Object.freeze({
		label: "已否",
		background: "var(--dsw-alias-bg-skeleton)",
		border: "var(--dsw-alias-border-l2)",
		color: "var(--dsw-alias-label-secondary)",
		borderStyle: "dashed",
		strike: true,
	}),
});

/** 四态的**图例顺序**（人读那一行按它排）。 */
export const KG_LEGEND_ORDER = Object.freeze(["keep", "frontier", "upper", "dropped"]);

/**
 * 图上那两种裁决（**闭集**，就这两个值）——递出去的那一份走 `onVerdict(key, verdict)`，
 * 到了壳就是第三条「意见」通路 `graph-opinion` 的请求体。
 * ⚠️ 服务端（`src/workflow/actions/chapters.js` 的 `GRAPH_OPINION_VERDICTS`）**另写一份同样的闭集**
 * （有意，见 `AGENTS.md` 那条纪律）——两边真的同值由 `test-collab-backend.mjs` 拿**这一份**逐个
 * 真发一次来断，不靠谁记得同步。
 */
export const KG_VERDICTS = Object.freeze({ drop: "不讲", keep: "要讲" });

/**
 * 对话框里那几颗动作键的**逐字文案**（唯一出口：组件与读数都从这里取，别在各处再手抄一遍）。
 *
 * ⚠️ **`block`（「当前不支持裁决」）已退役**（票 `reader-cognition-boundary-build/02`），⛔ 别再
 * 把它加回来：可见文案里写着「不能裁」、旁边那颗键却真的能裁，那就是一句假话。
 *
 * 票 16 起四档各取几颗：
 * · `frontier`／`upper`（两端前沿）：`drop` ＋ `hold`；
 * · `keep`（中段）：**只有 `close`**——点开能读详情，但这一格不支持裁决；
 * · `dropped`：`restore`。
 */
export const KG_DIALOG_KEYS = Object.freeze({
	drop: "🗑 这部分不造进书里",
	hold: "先不动它",
	restore: "↩ 放回来（要讲）",
	close: "关闭",
});

/**
 * 图上那把**划子**——「划掉」的**第二个入口**（票 `confirm-points-redesign-build/10`）。
 *
 * ## 它与框里那颗键的关系（一个动作、两个理由、两处入口）
 *
 * 票 `confirm-points-redesign-build/10` 与规划票 `confirm-points-redesign/08` §4 的 C5 逐字：
 * 记录仍是 `工作区/knowledge-map-exclusions.json` **那一份**，`reason` 两档今天都已登记且有校验
 * （`domain-rules.js` 的 `EXCLUSION_REASON_NOT_NEEDED`／`EXCLUSION_REASON_ALREADY_KNOWN`），
 * 今天缺的只是**第二个入口**：
 *
 * · **框里那颗键**（点卡 → 对话框 → `🗑 这部分不造进书里`）＝理由 **`不需要`**（本书不覆盖这个主题）；
 * · **划子**（本常量这一颗键）＝理由 **`已经会`**（读者已经会了 ⇒ 下沿那一半）。
 *
 * 两条都走**同一条**通路（`graph-opinion`，载荷 `{key, verdict}` 之外多一个可选的 `reason`）。
 *
 * ## ⚠️ 本票只落**位置 ＋ 容量**（⛔ 不落「划一片」的手势）
 *
 * 维护者原话是「**划掉是从图的起始点开始划，划剩下的最前沿就是"下沿"**」；本票把那个入口的
 * **位置**（图本体上、起点那一片的抬头处）与**理由档**落下来，手势本身落成**最小的同义形态**：
 * 划子亮着的时候点**下沿前沿**那张才划（一张一次、一步一次通路；票 16 起中段／上端带划子去点
 * 只弹框，⛔ 不落「已经会」）。⛔ 「框选／拖拽划一片」今天**没有实现**
 * ——本仓的图**不做图编辑器**（票 07 的既有边界），而无 DOM 的判据层也量不了手势；
 * 这一层差额**如实**记在票 10 的 `## Answer` 与 spec §6 的接口节里，⛔ 不写成「已实现」。
 *
 * ## ⚠️ 0 条边的书（今天＝全部书）上它退化成一个**集合**
 *
 * 没有 `prereq` 边就没有「起点的链」⇒「从起点往下划」划的其实是**全部还没判的那些**（下沿＝集合，
 * 不是一条前沿）。这个退化形态照实实现（读数见 `lowerBoundaryReading`），⛔ 不假装它是一条顺序。
 */
export const KG_SCRAPER = Object.freeze({
	arm: "✂ 从起点往下划这一片（已经会）",
	disarm: "✂ 收起划子（点卡照旧弹「要不要讲」）",
});

/**
 * 一张**冻住的空表**——缺省参数用它，好让「没给预画下沿」这条路每次拿到**同一个引用**
 * （每次现造 `[]` 会让下游那几个 `useMemo` 每轮都重算一遍）。
 */
const NO_KEYS = Object.freeze([]);

/**
 * 边的线型。**把握档承担线型**（强＝深灰实线／中＝灰虚线／待核＝橙色点线）；
 * `alias`／`see-also` 另有两套（它们不主张方向，不归把握档那三档管，取值照原型）。
 *
 * ⚠️ **键从词表派生、样式留在 UI**（票 `depth-round-3/03`）：三档的名字只有
 * `src/knowledge-confidence.js` 一处声明，这里按**档位**（强／中／最弱）给样式——
 * ⛔ 别把档名再抄一遍当键：改名第三档时这张表不跟，线型会**静默落到缺省**
 * （`edgeStrokeOf` 的 `??`），而夹具与实现共用同一个旧字面量 ⇒ 那样改也照样绿。
 * 反证在 `test-knowledge-map-gate.mjs`（改一次声明，这张表的键与取到的线型必须一起变）。
 */
const KG_EDGE_STYLE_BY_LEVEL = Object.freeze({
	strong: Object.freeze({ stroke: "#475569", width: 1.5, dash: null, opacity: 1 }),
	middle: Object.freeze({ stroke: "#94a3b8", width: 1.1, dash: "6 4", opacity: 1 }),
	pending: Object.freeze({ stroke: "#f59e0b", width: 1.3, dash: "2 3", opacity: 0.6 }),
});

/** 键＝三档的**名字**（从声明派生）；值＝上面那三支样式。 */
export const KG_EDGE_STROKES = Object.freeze({
	[KNOWLEDGE_CONFIDENCE_LEVELS[0]]: KG_EDGE_STYLE_BY_LEVEL.strong,
	[KNOWLEDGE_CONFIDENCE_LEVELS[1]]: KG_EDGE_STYLE_BY_LEVEL.middle,
	[KNOWLEDGE_CONFIDENCE_LEVELS[2]]: KG_EDGE_STYLE_BY_LEVEL.pending,
});

/**
 * 非 `prereq` 两类边的线型（同样照原型；`alias` 本票的样本里 0 条，形状留着）。
 *
 * ⚠️ **键从词表派生，样式留在 UI**（与上面那张把握档表同一条纪律，票 `ui-workflow-seam/04`）：
 * 两个键取自 `EDGE_KINDS` 的第 2／3 项，⛔ 不把 `alias`／`see-also` 这两个**边类名**在界面里
 * 再抄一遍当键。语义归属是图算法（`src/workflow/knowledge-graph.js`），界面只按位置取。
 */
export const KG_KIND_STROKES = Object.freeze({
	[EDGE_KINDS[1]]: Object.freeze({ stroke: "#a855f7", width: 1.5, dash: "2 3", opacity: 0.7 }),
	[EDGE_KINDS[2]]: Object.freeze({ stroke: "#a8a29e", width: 1, dash: "1 4", opacity: 0.45 }),
});

/** 链高亮的颜色（与三种状态都不同的蓝，免得跟「深绿＝轮到」「灰＝已否」混）。 */
export const KG_CHAIN_INK = "#2563eb";

/** 选中时的三级层次（原型实测：1 ／ .62（链上）／ .26（其余））。 */
export const KG_CHAIN_OPACITY = Object.freeze({ selected: 1, chain: 0.62, other: 0.26 });

/** 尺寸（原型 `layout()` 的逐字参数；⚠️ 改这里就是改编排规则，先问维护者）。 */
export const KG_LAYOUT = Object.freeze({
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
	charWSafety: 1.12,
});

/**
 * **图放得下的最小视口宽**（票 `ui-display-redesign/12`）：单列画布的最小宽＝左右 pad ＋ 一张最窄
 * 的卡（`KG_LAYOUT.pad × 2 + KG_LAYOUT.minW` ＝ 190）。视口窄过它时画布必然比视口宽（见
 * `knowledgeGraphLayout()` 的 `Math.max(KG_LAYOUT.minW, …)`）⇒ **不硬塞**，切「清单」那一支。
 * ⚠️ 它是**视口**的门槛，不是排版规则的第四档：`KG_LAYOUT` 那几格改这里跟着变（⛔ 不手抄 190）。
 */
export const KG_VIEW_MIN_GRAPH_WIDTH = KG_LAYOUT.pad * 2 + KG_LAYOUT.minW;

// ── 纯函数：模型（前沿 / 门槛边 / 链）────────────────────────────────────────

/** 一句形状描述（⛔ 不 `JSON.stringify` 整份输入）。 */
function shapeOf(value) {
	if (value === null) return "null";
	if (Array.isArray(value)) return `数组(${value.length})`;
	return typeof value;
}

/**
 * 门槛边集＝**显式写着** `kind: 'prereq'` 且把握档**已定**的边（spec §6：
 * 「最弱那一档 ＋ `prereq` 不算前置」那条语义由线型承担）。
 *
 * ⚠️ 取值先走票 02／11 的**唯一入口** `prereqEdges()`；它对着不干净的边表（缺 `kind`／出域）会抛
 * ——本模块**不当闸门**（形状归 `src/workflow/knowledge-map-gate.js`，它在交工那一跳已经把坏图拒了），
 * 所以那一路**退化成「只认显式 `kind: 'prereq'` 的那几条边」**并把 `readable: false` 记在读数里。
 * ⛔ **不套**原型那句 `e.kind ?? 'prereq'` 的兜底（它会让「门槛只走 prereq」这句话声称的边集悄悄变宽）。
 *
 * ⚠️ 「已定」那一句**不在这里手写**（票 `depth-round-3/03`）：走词表的 `isDecided()`。原先它是拿
 * `edge.confidence` 跟一个**手抄的档名**比不等号——改名第三档时那一句不跟，门槛会悄悄变宽
 * （把方向没定的边当成门槛）。
 *
 * @returns {{edges: object[], readable: boolean}}
 */
export function gatePrereqEdges(edges) {
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

/** 全部 `prereq` 边（含「待核」）——只用来数「连一条前置箭头都没有」那件事。同上游的退化口径。 */
export function allPrereqEdges(edges) {
	if (!Array.isArray(edges)) return [];
	try {
		return prereqEdges(edges);
	} catch {
		return edges.filter((edge) => edge !== null && typeof edge === "object" && edge.kind === "prereq");
	}
}

/** 卡键的确定序（材料号 → 片内组 → 序号；非 `M<n>-<n>-<n>` 形排在最后、按字典序）。 */
export function cardSequence(key) {
	const matched = /^M(\d+)-(\d+)-(\d+)$/.exec(String(key));
	if (matched === null) return [99, 99, 99, String(key)];
	return [Number(matched[1]), Number(matched[2]), Number(matched[3]), ""];
}

function compareKeys(a, b) {
	const x = cardSequence(a);
	const y = cardSequence(b);
	return x[0] - y[0] || x[1] - y[1] || x[2] - y[2] || (x[3] < y[3] ? -1 : x[3] > y[3] ? 1 : 0);
}

/**
 * 这张图的**判定面**（与画法无关的那一半）：
 *
 * · `frontierKeys` ＝ **未判 ∧ 它的门槛前置都已定**（「已定」＝被划掉，或本身没有门槛前置）；
 * · `fakeFrontierKeys` ＝ 前沿里**连一条 `prereq` 入边都没有**的那些 ⇒ 「轮到」不是因为前置判过了，
 *   而是这份图还不知道它们前面是什么（spec §6 那条形态级教训）；
 * · `reverseFrontierKeys` ＝ **反向前沿**（票 `rcb-build/02`）：**未判 ∧ 它的门槛后继都已定**
 *   （「已定」与下沿同口径＝被划掉，或本身没有门槛后继）——上端剥层用的那一批，
 *   与 `frontierKeys` 同构、方向相反；
 * · `fakeUpperFrontierKeys` ＝ 反向前沿里**连一条 `prereq` 出边都没有**的那些 ⇒ 它们「在上端」
 *   不是因为后继都判过了，而是**没人给它们写过后继**（ADR-0043 决策 3 那句如实说明的事实面）；
 * · `floatedBy(key)` ＝ **划掉 `key` 之后新浮上来**的那几张（票 08 的走法与回执吃它）——
 *   ⚠️ 只报**直接后果**：这一刻新变成前沿的，⛔ 不做传递闭包、⛔ 不报「被连累的」（本模型不硬传播）；
 * · `chainOf(key)` ＝ 它所在的整条链（`prereq` **上游→下游**双向闭包，⛔ 只走 `prereq`、
 *   ⛔「待核」两边都不走）；链内边数也一并给出（链高亮读数要）。
 *
 * @param {{cards?: object[], edges?: object[], dropped?: string[]}} input
 * @returns {object} 模型（含 `parentsOf`／`childrenOf`／`frontierKeys`／`fakeFrontierKeys`／
 *   `reverseFrontierKeys`／`fakeUpperFrontierKeys`／`floatedBy`／`chainOf`）
 */
export function knowledgeGraphModel(input = {}) {
	const cards = Array.isArray(input.cards) ? input.cards.filter(isCardLike) : [];
	const edges = Array.isArray(input.edges) ? input.edges.filter(isEdgeLike) : [];
	const dropped = new Set(Array.isArray(input.dropped) ? input.dropped : []);
	const ordered = cards.slice().sort((a, b) => compareKeys(a.key, b.key));
	const byKey = new Map(ordered.map((card) => [card.key, card]));
	const gate = gatePrereqEdges(edges);
	const allPrereq = allPrereqEdges(edges);
	const parentsOf = new Map();
	const childrenOf = new Map();
	for (const key of byKey.keys()) {
		parentsOf.set(key, []);
		childrenOf.set(key, []);
	}
	// ⚠️ 边端不在卡表上的一律不画、也不算门槛（那是形状闸的活；界面不替它判）。
	for (const edge of gate.edges) {
		if (!byKey.has(edge.from) || !byKey.has(edge.to)) continue;
		parentsOf.get(edge.to).push(edge.from);
		childrenOf.get(edge.from).push(edge.to);
	}
	const incoming = new Map();
	const outgoing = new Map();
	for (const key of byKey.keys()) {
		incoming.set(key, 0);
		outgoing.set(key, 0);
	}
	// ⚠️ 两张表都数**全部 `prereq`（含「待核」）**：假前沿／假终端问的是「有没有人写过这条箭头」，
	// 不是「那条箭头算不算门槛」——所以与下沿的 `incoming` 同一口径。
	for (const edge of allPrereq) {
		if (!byKey.has(edge.from) || !byKey.has(edge.to)) continue;
		if (edge.from === edge.to) continue;
		incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
		outgoing.set(edge.from, (outgoing.get(edge.from) ?? 0) + 1);
	}
	/** 「此刻轮到」的判据**只此一处**（前沿与「划掉之后新浮上来的」共用它，⛔ 不各写一份）。 */
	const isFrontierUnder = (key, excluded) =>
		!excluded.has(key) && (parentsOf.get(key) ?? []).every((parent) => excluded.has(parent));
	const frontierKeys = ordered.map((card) => card.key).filter((key) => isFrontierUnder(key, dropped));
	const fakeFrontierKeys = frontierKeys.filter((key) => (incoming.get(key) ?? 0) === 0);
	/** 「这一刻在上端剥层里」的判据**只此一处**（与 `isFrontierUnder` 同构、方向相反）。 */
	const isReverseFrontierUnder = (key, excluded) =>
		!excluded.has(key) && (childrenOf.get(key) ?? []).every((child) => excluded.has(child));
	const reverseFrontierKeys = ordered.map((card) => card.key).filter((key) => isReverseFrontierUnder(key, dropped));
	const fakeUpperFrontierKeys = reverseFrontierKeys.filter((key) => (outgoing.get(key) ?? 0) === 0);
	// 判档用的两份集合（`stateOf` 每张卡都要问一次，别在渲染里重复 `includes`）。
	const frontierSet = new Set(frontierKeys);
	const upperFrontierSet = new Set(reverseFrontierKeys);
	/**
	 * 划掉 `key` 之后**新浮上来**的那几张（回执的数与名字都取它）。
	 * ⚠️ 两个口径要点：① 只有**此刻轮到**的卡能动（与界面 `frontier` 那一档同一条口径）⇒ 不在前沿的键进来得 `[]`；
	 * ② 「新」浮上来的＝划掉之后变成前沿、而**划掉之前还不是前沿**的那些（⛔ 不把原本就在前沿里的
	 * 那几张再报一遍——它们没「浮上来」，本来就在上面）。
	 */
	const floatedBy = (key) => {
		if (!isFrontierUnder(key, dropped)) return [];
		const after = new Set(dropped);
		after.add(key);
		const before = new Set(frontierKeys);
		return ordered
			.map((card) => card.key)
			.filter((one) => !before.has(one) && isFrontierUnder(one, after));
	};

	/**
	 * 链（`prereq` 双向闭包）。⚠️ **只走 `prereq`**：`see-also`（只是相关）不算「一根线上的卡」，
	 * 「待核」的 `prereq` 既不是门槛也不是路 ⇒ 两边都不走。
	 */
	const chainOf = (key) => {
		const onChain = new Set();
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
		stateOf: (key) => (dropped.has(key)
			? "dropped"
			: frontierSet.has(key)
				? "frontier"
				: upperFrontierSet.has(key)
					? "upper"
					: "keep"),
	};
}

function isCardLike(card) {
	return card !== null && typeof card === "object" && typeof card.key === "string" && card.key !== "";
}

function isEdgeLike(edge) {
	return (
		edge !== null &&
		typeof edge === "object" &&
		typeof edge.from === "string" &&
		typeof edge.to === "string"
	);
}

// ── 纯函数：折行与布局（宽度是输入）────────────────────────────────────────

/**
 * 按最大像素宽折一行标题（原型 `wrapText` 逐字）。
 * ⚠️ 「一个字多宽」（`perChar`）必须**真量**（见 `measureCharWidth`），拍一个数会让标题溢出卡片。
 * ⚠️ 末行只剩一个字时并回上一行（「孤字行」会让卡框看着只有 2 行、却占着 4 行的行高）。
 */
export function wrapTitle(text, maxPx, perChar) {
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

/**
 * 整张图的几何：**吃一个宽度、吐全部几何**（纯函数 ⇒ Node 侧可断、浏览器侧现算）。
 *
 * 逐条照原型（⛔ 别改这里去「好看一点」）：
 * · `avail = max(minW, width - pad×2)`；`cols = max(1, floor((avail + gapX) / (minW + gapX)))`；
 *   `cardW = min(cardW上限, (avail - (cols-1)×gapX) / cols)`——于是 392→2 张、712→3 张、952→5 张。
 * · 行的 y **逐行累加**（`y += 行高 + gapY`），⛔ 不是「行号 × (本行高 + 行距)」：
 *   那样写时「先一行高的、再来一行矮的」会把矮行叠进高行中间（原型实撞 12px／7px）。
 * · 行高 ＝ `headPx + 本行最多行数 × lineHeight`；`minHeights` 是真量回来的校正量（见组件）。
 *
 * @param {{cards: object[], model: object, width?: number, charW?: number, minHeights?: object|null}} input
 * @returns {{cols: number, cardW: number, rows: object[], pos: object, lines: object, canvasW: number, canvasH: number, layers: object}}
 */
export function knowledgeGraphLayout(input) {
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
	/** 「是不是上端」——只问 `model.stateOf`（没有 model 时退回「都不是」，即旧的层号序）。 */
	const isUpper = (key) => model?.stateOf?.(key) === "upper";
	const ordered = cards
		.slice()
		// 票 18：排序键是**三段**——先「是不是上端」，再层号，再 key。
		// 「是不是上端」只认 `model.stateOf`（与颜色、图例同一条判据；⛔ 不另算一套集合）。
		// 上端排最后 ⇒ `Number(isUpper)` 为 1 时排在后面。
		.sort((a, b) => (Number(isUpper(a.key)) - Number(isUpper(b.key)))
			|| (layers[a.key] ?? 0) - (layers[b.key] ?? 0)
			|| compareKeys(a.key, b.key));
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
				layer: layers[card.key] ?? 0,
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
		width,
	};
}

/**
 * 「层号 ＝ 门槛前置的最长链长」（只在 `prereq` 上算，Kahn）。
 * ⚠️ 层号**只影响排序**，而且**排在上端之后**：整张图的排序键是「**是不是上端 → 层号 → key**」
 * （上端那一批一律在图的最下面，读者不用满图找蓝卡；同一端内部仍按层号升序）。「先学→后学」不是从下往上读。
 */
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

/**
 * 一条边的路径（三次贝塞尔；原型 `edgePath` 逐字）。
 * ⚠️ **不变量：起点＝源卡「底边中点」、终点＝目标卡「顶边中点」**（用布局属性算，⛔ 不用 `getBBox`）。
 */
export function edgePathOf(edge, layout) {
	const from = layout.pos[edge.from];
	const to = layout.pos[edge.to];
	if (from === undefined || to === undefined) return "";
	const sx = from.x + from.width * 0.5;
	const sy = from.y + from.height;
	const tx = to.x + to.width * 0.5;
	const ty = to.y;
	if (Math.abs(sx - tx) < 2) return `M${sx} ${sy}V${ty}`;
	const dy = Math.max(14, Math.min(46, Math.abs(ty - sy) * 0.6));
	return `M${sx} ${sy} C${sx} ${sy + dy} ${tx} ${ty - dy} ${tx} ${ty}`;
}

/** 一条边的线型（把握档优先；`alias`／`see-also` 走各自那两套）。 */
export function edgeStrokeOf(edge) {
	if (edge.kind === "prereq" || edge.kind === undefined) {
		// 认不出的把握档按**第二档**画（键从词表取，⛔ 不手写档名：票 `depth-round-3/03`）。
		return KG_EDGE_STROKES[edge.confidence] ?? KG_EDGE_STROKES[KNOWLEDGE_CONFIDENCE_LEVELS[1]];
	}
	return KG_KIND_STROKES[edge.kind] ?? KG_KIND_STROKES["see-also"];
}

// ── 纯函数：两条读数 ────────────────────────────────────────────────────────

/**
 * 「本次扫面 N 条边」那条读数 —— **原位置再导出**（票 `ui-workflow-seam/02`）。
 *
 * 实现已搬到 `src/knowledge-graph-door.js`（`src/` 根级门）：界面不该知道
 * `workflow/knowledge-map-gate.js` 这个内部路径（`AGENTS.md` 的「Frontend layout」）。
 * ⚠️ **本行不是第二份真值**：`export … from` 是同一个绑定；`src/ui/confirm-cards.js:32` 与
 * `test/test-knowledge-graph-map.mjs:50` 从这个模块取它，**一行都不用改**（搬运票不改 import 面）。
 */
export { edgeScanReading } from "../knowledge-graph-door.js";

/**
 * 量级读数：**留下的卡片数** ÷（章数 × 每章上限）。
 *
 * 票 `knowledge-graph-build/09`（spec §9 逐字）：读数改成对**留下的集合**报数——分子是
 * 「知识点 − 被剔除的」，⛔ 不是图上的卡数（划掉几张之后还拿全量报数就是**骗人**）。
 *
 * ⚠️ **「每章 20 条」是上限、不是预算**（维护者订正：「应该会少很多」）⇒ 措辞里必须带「每章 20 条上限」这一层，
 * ⛔ 不许把它写成预期规模。章数为 0（还没有章节建议）时只报分子与分母的写法，**不**给出比值。
 *
 * @param {{kept: number, chapters: number, perChapterMax?: number}} input
 *   `kept` ＝**留下的**卡片数（＝ `knowledgePoints` 减掉那份人的裁决里还算数的那些）
 * @returns {string}
 */
export function magnitudeReading({ kept, chapters, perChapterMax = OUTLINE_POINTS_MAX }) {
	const kp = Number.isSafeInteger(kept) && kept >= 0 ? kept : 0;
	const nos = Number.isSafeInteger(chapters) && chapters > 0 ? chapters : 0;
	if (nos === 0) return `留下 ${kp} 张，还没有章节建议，每章 ${perChapterMax} 条是上限`;
	const ratio = Math.round((kp / (nos * perChapterMax)) * 100) / 100;
	return `留下 ${kp} 张，${nos} 章 × 每章 ${perChapterMax} 条上限，比值 ${ratio.toFixed(2)}`;
}

/**
 * 「已剔除 N 条／未判 M 条」那一行（票 `knowledge-graph-build/09`；spec §9 逐字的两条读数之一）。
 *
 * ⚠️ 两个数**把图上的卡分成两半**（`已剔除 ＋ 未判 ＝ 全量`）：「未判」＝没被人划掉的那些
 * ——**没判的卡默认要讲**（spec §9），而「先不动它」按票 08 的口径**什么都不改**（这几档里今天
 * 只有「划掉」是一个会被记下来的判定）⇒ 留下的那一批就都在「未判」这一格里。
 *
 * @param {{dropped: number, kept: number}} input
 * @returns {string}
 */
export function exclusionSplitReading({ dropped, kept }) {
	const n = Number.isSafeInteger(dropped) && dropped > 0 ? dropped : 0;
	const m = Number.isSafeInteger(kept) && kept > 0 ? kept : 0;
	return `已剔除 ${n} 条／未判 ${m} 条（没判的默认要讲）`;
}

/**
 * 陈旧那一档的读数（**非阻断**：形状坏了才是硬闸，陈旧只是一条提示）。
 *
 * 「键没了、或键在而 title 变了」⇒ 那一条裁决**不生效**（spec §9 逐字），但⛔ **不整份失效**：
 * 其余条目照旧算数。一条都没有时返回 `null`（没这回事就别摆一句话）。
 *
 * @param {number} stale 失效的条数
 * @returns {string|null}
 */
export function exclusionStaleReading(stale) {
	const n = Number.isSafeInteger(stale) && stale > 0 ? stale : 0;
	if (n === 0) return null;
	return `⚠️ 有 ${n} 条裁决已失效（重造探查之后那张卡没了、或它的标题变了），本次不生效——其余照旧算数`;
}

/** 假前沿那句如实说明（条数为 0 时返回 `null`——没这回事就别摆一句话）。 */
export function fakeFrontierReading(frontierCount, fakeCount) {
	if (!(fakeCount > 0)) return null;
	return `⚠️ 这一批「现在轮到」的 ${frontierCount} 张里，有 ${fakeCount} 张连一条前置箭头都没有：`
		+ `它们不是「前面都判过了」，而是这份图还不知道它们前面是什么。`;
}

/**
 * **下沿**（票 `confirm-points-redesign-build/10`；rcb 那一族的词，spec §6）。
 *
 * 维护者原话逐字（`confirm-points-redesign/08` §1）：「**划掉是从图的起始点开始划，划剩下的最前沿
 * 就是"下沿"**」⇒ 下沿 ＝ **这一刻还没被划掉、且它的门槛前置都已定**的那一批（＝ `model.frontierKeys`
 * 在「人的裁决 ∪ 预画的下沿」之上的现算结果）。
 *
 * ## ⚠️ 退化形态（本票如实实现的那一条）
 *
 * spec §6 的前置条件逐字：「**下沿／上沿依赖图上有 `prereq` 边**。0 条边的书（今天＝全部书）上，
 * 这两条界**退化成「集合」**（勾出来／划出来的那些条），**不是一条前沿**」。
 * ⇒ 形状判据＝**这份图上有没有一条真正算数的门槛边**（`model.gateEdges`，即显式 `prereq` 且把握档
 * 不是「待核」的那些——「待核不算前置」是既有语义）。一条都没有 ⇒ `form: 'set'`。
 *
 * ⚠️ **为什么用 `gateEdges` 而不是 `edges.length`**：全是「待核」的书上，那些边既不构成门槛、
 * 也不给出顺序（线上那三档把握档的语义逐字如此）⇒ 它同样是**集合**那一格，⛔ 不许报成一条前沿。
 * ⚠️ `form` 是**如实读数**，不是错误：0 边时⛔ 不报错、⛔ 不空转（`keys` 照旧给出来）。
 * ⛔ 本函数**不假装它是一条顺序**（`keys` 的次序只是卡键的确定序，不是学序——见 `cardSequence`）。
 *
 * @param {object} model `knowledgeGraphModel()` 的返回
 * @returns {{form: 'front'|'set', keys: string[], count: number, degenerate: boolean}}
 */
export function lowerBoundaryOf(model) {
	const keys = Array.isArray(model?.frontierKeys) ? model.frontierKeys.slice() : [];
	const degenerate = !(Array.isArray(model?.gateEdges) && model.gateEdges.length > 0);
	return { form: degenerate ? "set" : "front", keys, count: keys.length, degenerate };
}

/**
 * 下沿那一行读数（两形态**逐字不同**：一条前沿／一个集合——这一行就是那句话的可读面）。
 *
 * ⚠️ 措辞不许把集合说成前沿（那正是 spec §6 与 R6Q1 那条裁定要挡的形状）；计数为 0 时照旧给一行
 * （「一条都不剩」是**如实**的读数，不是空转——沉默会让人分不清「划完了」与「没画出来」）。
 *
 * @param {{form: 'front'|'set', keys: string[], count: number}} boundary
 * @returns {string}
 */
export function lowerBoundaryReading(boundary) {
	const count = Number.isSafeInteger(boundary?.count) ? boundary.count : 0;
	if (boundary?.form === "set") {
		return `下沿（这本书上一条算数的前置边都没有 ⇒ 它是一个集合、不是一条前沿）：剩下 ${count} 条`
			+ "——这批卡之间没有「谁在前、谁在后」，⛔ 别把它读成一条顺序。";
	}
	return `下沿（划剩下的最前沿）：${count} 张`;
}

/**
 * **上沿**（票 `reader-cognition-boundary-build/02`；决定见 spec §2.3／`ADR-0043` 决策 3）。
 *
 * 上沿＝**这本书能教到的知识范围**的上端。形态与下沿**同一把尺子、方向相反**：
 *
 * · `gateEdges`（显式 `prereq` ∧ 把握档不是「待核」）为 **0** ⇒ `form: 'set'`——一整批、不是顺序；
 * · **≥1** ⇒ `form: 'front'`＝**反向前沿**（`model.reverseFrontierKeys`：「未判 ∧ 它的**后继**
 *   都已定」那批先交给人数落，剥完一层浮上一层）。
 * ⛔ **升级触发只认算数的门槛边**（不是「有边」）：有边的书也可能是一整批「假起点／假终端」
 * （`knowledge-graph-edges/09` 量到 68 卡／37 边的书里 46/68 张连一条 `prereq` 入边都没有）。
 * ⛔ 本函数**不假装集合是一条前沿**（`keys` 的次序只是卡键的确定序，不是学序——见 `cardSequence`）。
 *
 * @param {object} model `knowledgeGraphModel()` 的返回
 * @returns {{form: 'front'|'set', keys: string[], count: number, degenerate: boolean}}
 */
export function upperBoundaryOf(model) {
	const keys = Array.isArray(model?.reverseFrontierKeys) ? model.reverseFrontierKeys.slice() : [];
	const degenerate = !(Array.isArray(model?.gateEdges) && model.gateEdges.length > 0);
	return { form: degenerate ? "set" : "front", keys, count: keys.length, degenerate };
}

/**
 * 上沿那一行读数（两形态**逐字不同**；这一行就是那句话的可读面）。
 *
 * ⚠️ **集合那一格必须带那句如实说明**（spec §2.3 逐字）：「这批**叶子卡不一定是真的上端，
 * 只是没人给它写过后继**」——⛔ 不许把集合说成一条前沿、也不许把它读成一条顺序。
 * 计数为 0 时照旧给一行（「一条都不剩」是如实的读数，不是空转）。
 *
 * @param {{form: 'front'|'set', keys: string[], count: number}} boundary
 * @returns {string}
 */
export function upperBoundaryReading(boundary) {
	const count = Number.isSafeInteger(boundary?.count) ? boundary.count : 0;
	if (boundary?.form === "set") {
		return `上沿（这本书上一条算数的门槛边都没有 ⇒ 它是一个集合、不是一条前沿）：剩下 ${count} 条`
			+ "——这批叶子卡不一定是真的上端，只是没人给它写过后继；⛔ 别把它读成一条顺序。";
	}
	return `上沿（反向前沿：未判、而它的后继都已定）：${count} 张`;
}

/**
 * 上端那一批里的**假终端**那句如实说明（条数为 0 时返回 `null`——没这回事就别摆一句话）。
 *
 * 与 `fakeFrontierReading` 同形、方向相反：反向前沿里**连一条 `prereq` 出边都没有**的那些
 * 「在上端」不是因为后继都判过了，而是**没人给它写过后继**。⛔ 不把它写成「这就是上沿」。
 *
 * @param {number} upperCount 这一刻反向前沿的张数
 * @param {number} fakeCount 其中连一条 `prereq` 出边都没有的张数
 * @returns {string|null}
 */
export function fakeUpperFrontierReading(upperCount, fakeCount) {
	if (!(fakeCount > 0)) return null;
	return `⚠️ 这一批「上端」的 ${upperCount} 张里，有 ${fakeCount} 张连一条后继箭头都没有：`
		+ "它们不一定是真的上端，只是没人给它写过后继。";
}

/**
 * 按下划掉那一刻的**回执**——**只**是「浮上来 N 张」＋名字（spec §6 末条：⛔ 不摆总账）。
 *
 * ⛔ 这里不许出现任何机器读数（环／闭包／约简／审校那几样），也不许写成
 * 「要讲 X／不讲 Y／挡住 Z」那种总账（那是票 09 的读数面）。
 * ⚠️ 一张都没浮上来时只有 `浮上来 0 张`（照样给回执：**沉默**会让人以为这一下没生效）。
 *
 * @param {string[]} floatedKeys 划掉之后新浮上来的卡键（`model.floatedBy(key)`）
 * @param {Map<string, object>} [byKey] 卡键 → 卡（取名字用）
 * @returns {string}
 */
export function floatReceiptText(floatedKeys, byKey) {
	const keys = Array.isArray(floatedKeys) ? floatedKeys : [];
	if (keys.length === 0) return "浮上来 0 张";
	// 票 `ui-systematic-fixes/03`（spec §3·2）：正文只印**人读的那半**（卡名）。名字取不到就只说数量——
	// ⛔ 不退回 `String(key)`：那是书内复合键（`M1-01-01`），人读不出、也拿它做不了什么。
	// 卡键没有丢：它进悬停提示（`floatReceiptTitle`）。
	const names = keys
		.map((key) => byKey?.get?.(key)?.name)
		.filter((name) => typeof name === "string" && name !== "");
	if (names.length === 0) return `浮上来 ${keys.length} 张`;
	return `浮上来 ${keys.length} 张：${names.join("、")}`;
}

/**
 * 回执的**悬停提示**：这一批新浮上来的卡键（票 `ui-systematic-fixes/03` · spec §3·2 ——
 * 机器 id 只许进悬停提示，⛔ 不占正文）。空数组时返回 `undefined`（不留一个空 `title`）。
 *
 * @param {string[]} floatedKeys 划掉之后新浮上来的卡键
 * @returns {string|undefined}
 */
export function floatReceiptTitle(floatedKeys) {
	const keys = Array.isArray(floatedKeys) ? floatedKeys.filter((key) => typeof key === "string" && key !== "") : [];
	if (keys.length === 0) return undefined;
	return `卡键：${keys.join("、")}`;
}

/** 四态图例（一句话，取值从 `KG_CARD_TONES` 派生——⛔ 不手抄第二份配色）。 */
export function legendText() {
	const [keep, frontier, upper, dropped] = KG_LEGEND_ORDER.map((state) => KG_CARD_TONES[state].label);
	return `卡片颜色：淡绿＝${keep}（还没轮到它的那些，默认就是这样）｜深绿＝${frontier}（右上角是顺序号）`
		+ `｜蓝＝${upper}（反向前沿：这一端也能撤，卡头是上端号）`
		+ `｜灰＋划掉＝${dropped}（这条不讲）。`;
}

/** 线型图例（把握档承担线型；「待核」不算前置那句也在这里说清）。 */
export function edgeLegendText() {
	return "线的线型＝这份图判那条前置时的把握：强＝深灰实线／中＝灰虚线／待核＝橙色点线"
		+ "（待核的前置不算前置：有它的卡照样现在就轮到）；另两类：相关＝细点线、同义＝紫色点线。";
}

// ── 真量：一个字多宽 ────────────────────────────────────────────────────────

/**
 * **真量**「卡片标题字体下一个字多宽」（原型 `measureCharW` 同法：造一个 span、量、删掉）。
 * 量不到（Node 侧没有排版引擎）返回 `null`，调用方退回 `KG_LAYOUT.fallbackWidth`／`fallbackCharW`。
 */
export function measureCharWidth(host) {
	if (host === null || host === undefined) return null;
	const doc = host.ownerDocument ?? (typeof document === "undefined" ? null : document);
	if (doc === null || typeof doc.createElement !== "function" || typeof getComputedStyle !== "function") return null;
	const probe = doc.createElement("span");
	probe.textContent = "CPTSD 情绪闪回与五个主要症状";
	probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;"
		+ `font-size:${KG_LAYOUT.titleFontPx}px;font-family:Segoe UI,Microsoft YaHei,system-ui,sans-serif`;
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

/**
 * 往上找**滚动盒**（`[data-kg-view-body]`）——站 2 那一块的视图区，也是本组件量宽的唯一来源。
 * 为什么不再往上找「有边框的那张卡」（票 `ui-display-redesign/12` 之前的写法）：卡的 `clientWidth`
 * **含卡自己的内边距**，照它画图再拿负 margin 把内边距「借」回来，正是横向滚动条的来路。
 * 滚动盒的 `clientWidth` 已经扣掉纵向滚动条那一条 ⇒ 按它画，画布里最宽那一行也不会顶出盒子。
 * ⚠️ 阶段页／补图／读者边界那几处共用本组件、**没有**站 2 那个内滚盒（920 上限／最多 6 层卡）⇒ 返回 `null`，调用方退化成量父容器。
 * ⚠️ 只走 8 层：再往外就是页面壳，那不是这一块自己的视口。
 */
function viewScrollBoxOf(node) {
	let current = node === null || node === undefined ? null : node;
	for (let depth = 0; current !== null && depth < 8; depth += 1) {
		if (typeof current.getAttribute === "function" && current.getAttribute("data-kg-view-body") !== null) return current;
		current = current.parentElement ?? null;
	}
	return null;
}

/** 一个节点的实测宽：`clientWidth` 优先（已扣滚动条），读不到退回边界矩形；都没有 ⇒ `null`。 */
function measuredWidthOf(node) {
	if (node === null || node === undefined) return null;
	const client = Number(node.clientWidth);
	if (Number.isFinite(client) && client > 0) return client;
	const rect = typeof node.getBoundingClientRect === "function" ? node.getBoundingClientRect() : null;
	const rectWidth = rect === null ? 0 : Number(rect.width);
	return Number.isFinite(rectWidth) && rectWidth > 0 ? rectWidth : null;
}

/**
 * **本组件的视口宽**（票 `ui-display-redesign/12`）：滚动盒的 `clientWidth` 优先，
 * 没有滚动盒（阶段页／补图／读者边界）⇒ **退化成量父容器**（同一改法，不额外分支）。
 * 量不到（Node 侧无排版引擎）⇒ `null`，调用方退回 `KG_LAYOUT` 的兜底几何。
 *
 * @param {object|null} node 图本体自己的宿主节点（或它所在的滚动盒）
 * @returns {number|null}
 */
export function measureKgViewportWidth(node) {
	if (node === null || node === undefined) return null;
	const box = viewScrollBoxOf(node);
	if (box !== null) return measuredWidthOf(box);
	return measuredWidthOf(node.parentElement ?? node);
}

/** 视口窄过「单列画布的最小宽」了吗（＝图放不下、该切清单）。量不到宽不算窄。 */
export function kgViewportIsNarrow(measuredWidth) {
	return Number.isFinite(measuredWidth) && measuredWidth > 0 && measuredWidth < KG_VIEW_MIN_GRAPH_WIDTH;
}

/**
 * 知识点那一块这一刻摆哪一支：`graph` 还是 `list`。
 *
 * · 没有图（老书那一档）⇒ 只有清单；
 * · **窄到放不下**（滚动盒 <190px）⇒ 自动切清单，⛔ 不硬塞一张塞不进去的图；
 * · 量不到宽（Node 侧／首帧还没量）⇒ 照请求的那一支（⛔ 不因为「没量到」就冒充窄）；
 * · 其余照人点的那一段。
 *
 * @param {{hasGraph?: boolean, requested?: string, measuredWidth?: number|null}} input
 * @returns {"graph"|"list"}
 */
export function kgPointsView({ hasGraph, requested, measuredWidth } = {}) {
	if (hasGraph !== true) return "list";
	if (kgViewportIsNarrow(measuredWidth)) return "list";
	return requested === "list" ? "list" : "graph";
}

// ── 组件 ────────────────────────────────────────────────────────────────────

/**
 * 知识点图那一块。**同一区、同一形状**：它长在探查确认卡里那个
 * 「▸ 知识点清单（N 个）」折叠块**旁边**，自己也是一个折叠块（都在同一张卡的正文里）。
 *
 * ⚠️ **它是受控的**：`dropped`（哪些卡被判成「不讲」）住在壳里，本块只画、只把裁决递出去
 * （`onVerdict`）——⛔ 不自己在本地记一份（那会让「划痕在谁手上」有两处真相）。
 *
 * @param {object} props
 * @param {object[]} props.cards `cards[]`（票 03 的形状）
 * @param {object[]} props.edges `edges[]`
 * @param {number} props.knowledgePointCount `knowledgePoints` 条数（图上卡数；⛔ 它只是
 *   `exclusions` 缺省时的量级分子——票 09 起量级报的是**留下的**那一批）
 * @param {number} props.chapterCount 「AI 建议的章节安排」章数（量级读数的分母那一半）
 * @param {object|null} props.merged 合并件（喂形状闸的读数；`null` ＝ 拿不到）
 * @param {{kept: number, dropped: number, stale: number}} [props.exclusions]
 *   票 `knowledge-graph-build/09`：那份人的裁决按今天这份图现算出来的三个数——`kept`（留下的卡片数，
 *   量级的分子）／`dropped`（还算数的裁决条数）／`stale`（已失效的条数）。⚠️ **由调用方现算**并
 *   **当值**递进来（它与覆盖闸门、`outline` 交办读的是同一份集合）；缺省（没这一格）时量级退回
 *   「图上卡数就是留下的那批」、且**不摆**「已剔除／未判」与「已失效」两条。
 * @param {string[]} [props.dropped] 「已否」的卡键（票 08；缺省＝一张都没划）
 * @param {(key: string, verdict: string) => Promise<boolean>} [props.onVerdict]
 *   **改动走「意见」这条通路**：`verdict ∈ KG_VERDICTS`（`不讲`／`要讲`），resolve `true` ＝
 *   通路认了（这一刻的划痕作数）、`false` ＝ 没认（⛔ 什么都不改，框也不关）。
 *   ⚠️ 缺省（没接）时三颗动作键**照旧渲染**，只是点了不翻——「接线没了」不该表现成「键没了」。
 * @param {boolean} [props.busy] 通路正在飞（动作键置灰，防连点）
 */
export function KnowledgeGraphBlock(props) {
	const { cards, edges, knowledgePointCount, chapterCount, merged, dropped, predrawn, onVerdict, busy, exclusions } = props;
	const model = useMemo(
		() => knowledgeGraphModel({ cards, edges, dropped }),
		[cards, edges, dropped],
	);
	const [open, setOpen] = useState(false);

	const readings = useMemo(() => edgeScanReading(merged), [merged]);
	// 票 `knowledge-graph-build/09`：量级那条读数改成对**留下的集合**报数，并列「已剔除／未判」
	// 与「已失效」两条。⚠️ 那一份值由**调用方现算**（`ExploreConfirmCard` 读同一对纯函数、
	// 与覆盖闸门和 `outline` 交办同一份集合）——这里不自己再减一遍（那就是第二份口径）。
	// 缺这一格时（例：票 12 补出来的只读图，那一档人根本划不了）退回「图上卡数就是留下的那批」，
	// 且**不摆**另外两条（没有裁决可言）。
	const keptCount = exclusions === null || exclusions === undefined ? knowledgePointCount : exclusions.kept;
	const magnitude = useMemo(
		() => magnitudeReading({ kept: keptCount, chapters: chapterCount }),
		[keptCount, chapterCount],
	);
	const splitNote = exclusions === null || exclusions === undefined
		? null
		: exclusionSplitReading({ dropped: exclusions.dropped, kept: exclusions.kept });
	const staleNote = exclusions === null || exclusions === undefined
		? null
		: exclusionStaleReading(exclusions.stale);

	return createElement(
		"div",
		{ style: { margin: "4px 0 8px" }, "data-kg-block": "1" },
		createElement(
			"button",
			{ style: S.smallLink, onClick: () => setOpen(!open), "aria-expanded": open },
			open
				? `▾ 收起知识点图（${model.cards.length} 张卡，${model.edges.length} 条箭头）`
				: `▸ 知识点图（${model.cards.length} 张卡，${model.edges.length} 条箭头，点开看）`,
		),
		// 两条读数：与「知识点清单（N 个）」**同一区、同一形状**（同一张卡的 12px 小字行）。
		createElement(
			"div",
			{
				style: {
					marginTop: "6px",
					padding: "8px 10px",
					background: "var(--dsw-alias-bg-layer-1)",
					borderRadius: "8px",
					border: "1px solid var(--dsw-alias-border-l2)",
				},
			},
			createElement(
				"div",
				{ style: { fontSize: "12px", margin: "2px 0" }, "data-kg-reading": "edge-scan" },
				`· ${readings.text}`,
			),
			createElement(
				"div",
				{ style: { fontSize: "12px", margin: "2px 0" }, "data-kg-reading": "magnitude" },
				`· ${magnitude}`,
			),
			// 票 `knowledge-graph-build/09`：并列的两条读数（spec §9 逐字）。⛔ 只在调用方把那份集合
			// 递进来时才摆——补出来的只读图（票 12）上没有裁决可言，摆一句「已剔除 0 条」是假读数。
			splitNote === null
				? null
				: createElement(
					"div",
					{ style: { fontSize: "12px", margin: "2px 0" }, "data-kg-reading": "exclusion-split" },
					`· ${splitNote}`,
				),
			staleNote === null
				? null
				: createElement(
					"div",
					{ style: { fontSize: "12px", margin: "2px 0" }, "data-kg-reading": "exclusion-stale" },
					`· ${staleNote}`,
				),
		),
		open
			? createElement(KnowledgeGraphView, { cards, edges, dropped, predrawn, onVerdict, busy })
			: null,
	);
}

/**
 * **图本体**（没有折叠键、没有那两条读数）——「图」这一视图自己那一份。
 *
 * 为什么它与 {@link KnowledgeGraphBlock} 分成两支（票 `confirm-points-redesign-build/04`）：
 * 站 2 那张卡上，「图」与「清单」**合成了一个块**（一颗两分段控件切），而折叠键与那两条读数
 * 归**那个块**的壳；补图那一档（票 `knowledge-graph-build/12`）照旧要一个**自带折叠键的块**。
 * ⇒ 把「块壳」与「图本体」拆开，两边各取所需，⛔ 图本体的形状一个字不动
 * （四态／前沿／链高亮／对话框都还在这一支里）。
 *
 * ⚠️ **它是受控的**：`dropped` 住在壳里，这里只画、只把裁决递出去（`onVerdict`）。
 * ⚠️ 挂载即量、即画（调用方只在「图」这一视图里挂它）——原先那 `open` 开关由调用方取代。
 *
 * @param {object} props
 * @param {object[]} [props.cards] `cards[]`
 * @param {object[]} [props.edges] `edges[]`
 * @param {string[]} [props.dropped] 「已否」的卡键（缺省＝一张都没划）
 * @param {string[]} [props.predrawn] **预画的下沿**（票 `confirm-points-redesign-build/10`）——
 *   问卷／分组面的结果先画到图上的那几条卡键；照「已经会」那一档画，人在图上再调（只读投影）。
 * @param {(key: string, verdict: string, reason?: string) => Promise<boolean>} [props.onVerdict] 见 `KnowledgeGraphBlock`
 * @param {boolean} [props.busy] 通路正在飞（动作键置灰，防连点）
 */
export function KnowledgeGraphView(props) {
	const { cards, edges, dropped, predrawn, onVerdict, busy } = props;
	// 票 `confirm-points-redesign-build/10`：盘上／本会话的划痕 ∪ **预画的下沿**，合成图上那一片
	// 「已经不讲」的卡。⚠️ 预画那一族是**只读投影**（问卷／分组面画上来的），它进模型只为让
	// 「划剩下的最前沿」这句话在图上成立；⛔ 本模块不替它落盘。
	const predrawnKeys = Array.isArray(predrawn) ? predrawn : NO_KEYS;
	const marked = useMemo(
		() => [...new Set([...(Array.isArray(dropped) ? dropped : []), ...predrawnKeys])],
		[dropped, predrawnKeys],
	);
	const model = useMemo(
		() => knowledgeGraphModel({ cards, edges, dropped: marked }),
		[cards, edges, marked],
	);
	const [selected, setSelected] = useState(null);
	// 票 `confirm-points-redesign-build/10`：**划子**（第二个入口）亮着没有。
	// 亮着 = 点卡走「已经会」那一档理由；不亮 = 点卡照旧弹框（框里那颗键走「不需要」）。
	const [armed, setArmed] = useState(false);
	// 回执：按下划掉那一刻给的那一条（换一张卡／放回来就换掉／清掉）。⛔ 不是总账，只这一行。
	const [receipt, setReceipt] = useState(null);
	const hostRef = useRef(null);
	const passesRef = useRef(0);
	const [geometry, setGeometry] = useState({ width: null, charW: null });
	const [minHeights, setMinHeights] = useState(null);

	const layout = useMemo(
		() => knowledgeGraphLayout({
			cards: model.cards,
			model,
			width: geometry.width ?? undefined,
			charW: geometry.charW ?? undefined,
			minHeights,
		}),
		[model, geometry.width, geometry.charW, minHeights],
	);

	// 量**视口宽**（票 `ui-display-redesign/12` 起不再量外层卡框、也不再借卡内边距）：
	// 「容器实宽」＝图所在那个**滚动盒**（`[data-kg-view-body]`）的 `clientWidth`——它已扣掉
	// padding 与纵向滚动条那一条 ⇒ 照它画，最宽那一行也不会顶出盒子、不会出横向滚动条。
	// ⚠️ 阶段页／补图／读者边界那几处没有站 2 那个内滚盒（920 上限／最多 6 层卡）⇒ 同一改法退化成量父容器（不额外分支）。
	// ⚠️ 只在真浏览器里有排版引擎 ⇒ Node 侧这一段不跑，几何落回 `KG_LAYOUT` 的默认值。
	useEffect(() => {
		const node = hostRef.current;
		if (node === null) return undefined;
		const measure = () => {
			const width = measureKgViewportWidth(node);
			const charW = measureCharWidth(node);
			setGeometry((prev) => (prev.width === width && prev.charW === charW ? prev : { width, charW }));
		};
		measure();
		// 盯**量宽那一只盒子**（滚动盒在站 2、父容器在阶段页）：它一变宽就重画。
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
		return undefined;
	}, []);

	// 真量校正：第一遍的高度是**估**的（按量到的字宽折行），这里把浏览器真排版出来的标题高度量回去，
	// 只增不减 ⇒ 最多两遍就收敛（`passesRef` 兜第三遍，防病态输入把渲染拖成死循环）。
	useEffect(() => {
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
		if (any) setMinHeights((prev) => ({ ...(prev ?? {}), ...raised }));
	}, [layout]);

	// 票 `confirm-points-redesign-build/10`：**下沿**（划剩下的最前沿；0 条边的书上退化成集合）。
	const boundary = lowerBoundaryOf(model);
	// 票 `reader-cognition-boundary-build/02`：**上沿**（反向前沿、0 条算数门槛边时是集合）。
	const upper = upperBoundaryOf(model);
	const frontierOrder = useMemo(() => {
		const rank = new Map();
		model.frontierKeys.forEach((key, index) => rank.set(key, index + 1));
		return rank;
	}, [model.frontierKeys]);
	const upperOrder = useMemo(() => {
		const rank = new Map();
		model.reverseFrontierKeys.forEach((key, index) => rank.set(key, index + 1));
		return rank;
	}, [model.reverseFrontierKeys]);
	const chain = selected === null ? null : model.chainOf(selected);
	const chainSet = chain === null ? null : new Set(chain.cards);
	const dimmedCount = chain === null ? 0 : model.cards.length - chain.cards.length;

	/**
	 * 一次裁决：**先递通路、通路认了才翻本地那一份**（⛔ 不做乐观更新——那是「本地改一下就算」，
	 * 正是「改动走意见通路」这句话要挡掉的形状）。
	 * · `不讲`：先按**当下这一份模型**算出划掉之后新浮上来的是谁（回执要它），再递通路；
	 *   通路认了 ⇒ 记下回执 ＋ 关框（灰＋划掉那一档由壳递回来的 `dropped` 画出来）。
	 * · `要讲`：递通路，认了就清回执（放回来**不给**回执：spec 只要求按下划掉那一刻给一条）。
	 * ⚠️ `reason` 是**理由档**（票 `confirm-points-redesign-build/10` 的第二个入口）：框里那颗键传
	 * `不需要`，划子传 `已经会`——两条都走**同一条**通路、落**同一份**剔除记录，只差这一格。
	 */
	const decide = useCallback((key, verdict, reason) => {
		if (typeof onVerdict !== "function") return;
		const floated = verdict === KG_VERDICTS.drop ? model.floatedBy(key) : [];
		const carried = { key, floated };
		Promise.resolve(onVerdict(key, verdict, reason))
			.then((accepted) => {
				if (accepted !== true) return;
				setReceipt(verdict === KG_VERDICTS.drop ? carried : null);
				setSelected(null);
			})
			.catch(() => { /* 通路自己把错误写进工作台错误条（壳那一层）；这里不改任何状态 */ });
	}, [onVerdict, model]);

	const select = useCallback((key) => {
		// 划子亮着 ⇒ 这一下点的是**第二个入口**：记成「已经会」（换一个理由档），⛔ 不弹框。
		// 票 16：**只有下沿前沿（`frontier`）**能被这样划——「已经会」讲的是顺序，不适用上端那批、
		// 更不适用卡在中间的那一批；那些卡带划子去点照旧弹框（中段只读、上端两颗键）。
		// 已划掉的卡也照旧弹框（那颗 `↩ 放回来（要讲）` 是唯一的回头路）。
		if (armed && model.stateOf(key) === "frontier") {
			decide(key, KG_VERDICTS.drop, EXCLUSION_REASON_ALREADY_KNOWN);
			return;
		}
		setSelected((prev) => (prev === key ? null : key));
	}, [armed, model, decide]);

	const canvasStyle = {
		position: "relative",
		width: layout.canvasW,
		height: layout.canvasH,
	};

	return createElement(
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
				border: "1px solid var(--dsw-alias-border-l2)",
			},
		},
		createElement(Legend, { tones: KG_CARD_TONES }),
		// 票 `confirm-points-redesign-build/10`：**下沿**那一行——形态如实（前沿／集合）。
		createElement(
			"div",
			{
				"data-kg-boundary": boundary.form,
				"data-kg-boundary-count": String(boundary.count),
				style: { fontSize: "12px", opacity: 0.85, padding: "0 10px 6px" },
			},
			lowerBoundaryReading(boundary),
		),
		// 票 `rcb-build/02`：**上沿**那一行——与下沿同形（前沿／集合），点明剥层方向。
		createElement(
			"div",
			{
				"data-kg-upper-boundary": upper.form,
				"data-kg-upper-boundary-count": String(upper.count),
				style: { fontSize: "12px", opacity: 0.85, padding: "0 10px 6px" },
			},
			upperBoundaryReading(upper),
		),
		// ── 票 `confirm-points-redesign-build/10`：**划子**（第二个入口）住在图本体的起点那一片 ──
		// 它长在图本体上（⛔ 不是卡上的第二块、⛔ 不是第二个停点）：位置＝起点那一片的抬头处，
		// 理由是「已经会」那一档，落的是**同一份**剔除记录。口径见 `KG_SCRAPER` 那段注释。
		// ⚠️ **只在有裁决通路时出现**（`onVerdict` 接上了）：划子按下去就是一次裁决，而补图那一档
		// （票 `knowledge-graph-backfill/12`）的图**只读** —— 那里摆一颗按了什么都不发生的键，
		// 正是 `test-knowledge-graph-backfill.mjs`「那一块一个回调都不接」那条判据要挡的形状。
		// ⚠️ 这与对话框那几颗动作键的待遇**有意不同**：那几颗在只读档上照旧渲染（既有裁决：键在、点了不翻），
		// 它们的形状由 `KnowledgeGraphView` 的 `decide()` 兜住；划子是新长的一颗，⛔ 不继承那条。
		typeof onVerdict !== "function"
			? null
			: createElement(
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
						background: armed ? "var(--dsw-alias-state-business-tertiary)" : "transparent",
					},
				},
				createElement(
					"button",
					{
						type: "button",
						"data-kg-scraper-key": "1",
						"aria-pressed": armed,
						style: { ...S.smallLink, fontWeight: armed ? 600 : 400 },
						onClick: () => setArmed(!armed),
					},
					armed ? KG_SCRAPER.disarm : KG_SCRAPER.arm,
				),
			),
		// 回执：**按下划掉那一刻**那一条（⛔ 不是总账、⛔ 不含机器读数）。放回来／没划过就没有。
		receipt === null
			? null
			: createElement(
					"div",
					{
						"data-kg-receipt": "1",
						"data-kg-receipt-count": String(receipt.floated.length),
						// 票 `ui-systematic-fixes/03`（spec §3·2）：机器卡键只进悬停提示，正文里只有名字。
						title: floatReceiptTitle(receipt.floated),
						style: { fontSize: "12px", margin: "0 10px 6px", padding: "5px 8px", borderRadius: "4px", background: "var(--dsw-alias-bg-layer-2)" },
					},
					floatReceiptText(receipt.floated, model.byKey),
				),
		createElement(Canvas, {
			model,
			layout,
			canvasStyle,
			selected,
			chainSet,
			frontierOrder,
			upperOrder,
			onSelect: select,
		}),
		selected === null ? null : createElement(Dialog, {
			card: model.byKey.get(selected),
			state: model.stateOf(selected),
			busy: busy === true,
			onDecide: decide,
			onClose: () => setSelected(null),
		}),
	);
}

/** 四态图例（四块**同色**的小方块 —— 真浏览器里量的就是它们自己的计算色）。 */
function Legend({ tones }) {
	return createElement(
		"div",
		{ style: { display: "flex", flexWrap: "wrap", gap: "10px", padding: "2px 10px 6px" } },
		...KG_LEGEND_ORDER.map((state) => {
			const tone = tones[state];
			return createElement(
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
						textDecoration: tone.strike ? "line-through" : "none",
					},
				},
				tone.label,
			);
		}),
	);
}

/** 画布：一层 SVG（边）＋ 绝对定位的卡（HTML 卡，为了拿到真排版出来的文字高度）。 */
function Canvas({ model, layout, canvasStyle, selected, chainSet, frontierOrder, upperOrder, onSelect }) {
	const prereqShown = new Set(model.gateEdges);
	const drawable = model.edges.filter((edge) => layout.pos[edge.from] !== undefined && layout.pos[edge.to] !== undefined);
	return createElement(
		"div",
		{ style: canvasStyle, "data-kg-canvas": "1" },
		createElement(
			"svg",
			{
				width: layout.canvasW,
				height: layout.canvasH,
				style: { position: "absolute", left: 0, top: 0, pointerEvents: "none" },
				"aria-hidden": "true",
			},
			...drawable.map((edge, index) => {
				const stroke = edgeStrokeOf(edge);
				const onChain = selected !== null
					&& prereqShown.has(edge)
					&& chainSet.has(edge.from)
					&& chainSet.has(edge.to);
				const dim = selected !== null && !onChain;
				return createElement("path", {
					key: `${edge.from}->${edge.to}#${index}`,
					"data-kg-edge": `${edge.from}->${edge.to}`,
					d: edgePathOf(edge, layout),
					fill: "none",
					stroke: onChain ? KG_CHAIN_INK : stroke.stroke,
					strokeWidth: onChain ? 2.4 : stroke.width,
					strokeDasharray: onChain ? undefined : (stroke.dash ?? undefined),
					opacity: selected === null ? stroke.opacity : (onChain ? 0.9 : 0.05),
				});
			}),
		),
		...model.cards.map((card) => createElement(CardNode, {
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
			onSelect,
		})),
	);
}

/** 一张卡（`<button>`：点它＝选中／取消选中，浮现那两行对话框）。 */
function CardNode({ card, state, box, rank, upperRank, incoming, selected, onChain, dimmed, onSelect }) {
	if (box === undefined) return null;
	const tone = KG_CARD_TONES[state] ?? KG_CARD_TONES.keep;
	const opacity = selected ? KG_CHAIN_OPACITY.selected : onChain ? KG_CHAIN_OPACITY.chain : dimmed ? KG_CHAIN_OPACITY.other : 1;
	// 票 `ui-systematic-fixes/03`（spec §3·2「机器 id 与路径只许进悬停提示」）：卡头那一行原来逐字印
	// `card.key`——那是**书内复合键**（`M1-01-01`，人拼不出来也记不住），正文只许印人读的那半：
	// 卡名在下面标题行、顺序号在卡头；键只进**悬停提示**（`title`），⛔ 不占正文。
	// ⚠️ 卡头那一行**仍然保留**（空着也占位）：`headPx` 是固定的一行高，抽掉整格会让没有顺序号的
	// 卡把标题顶上去、同一行里的卡标题高低不齐。
	// ⚠️ 与下沿的顺序号可以同时出现在同一张卡上（既没有前置、也没有后继的那张卡）。
	const headText = [rank === null ? null : `轮到第 ${rank} 张`, upperRank === null ? null : `上端第 ${upperRank} 张`]
		.filter((one) => one !== null)
		.join("　");
	return createElement(
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
			title: `卡键：${card.key}`,
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
				boxShadow: selected ? `0 0 7px ${KG_CHAIN_INK}` : undefined,
			},
		},
		createElement(
			"div",
			{ style: { fontSize: "12px", fontWeight: 600, color: tone.color, opacity: 0.85, minHeight: "11px" } },
			headText,
		),
		createElement(
			"div",
			{
				"data-kg-title": "1",
				style: {
					fontSize: `${KG_LAYOUT.titleFontPx}px`,
					lineHeight: `${KG_LAYOUT.lineHeight}px`,
					color: tone.color,
					textDecoration: tone.strike ? "line-through" : "none",
					overflowWrap: "anywhere",
				},
			},
			card.name,
		),
	);
}

/**
 * 点开一张卡浮现的对话框——**只剩两行**：「它是什么」（卡名）＋「它要让人学会的一句话」
 * （`testable`，**整句给、不折**）。
 * ⛔ 第三轮删掉的「为什么轮到它／划掉的后果／一行来路」、第四轮删掉的「先要定：…」与「待核」
 * 两行**都不许回来**。
 *
 * ## 四档的差别**只剩动作键**（票 08 定三档；`rcb-build/02` 补上端；票 16 定四档）
 *
 * · **现在轮到**（`frontier`，下沿前沿）：`🗑 这部分不造进书里`（＝`不需要`）＋ `先不动它`；
 * · **上端**（`upper`，反向前沿）：**同一副两颗键**——`不需要` 是**范围轴**的判断，上端正是
 *   「这本书要不要覆盖它」的判断面（`rcb-build/02` 的 Acceptance：上端仍要能裁）；
 * · **还轮不到**（`keep`，中段）：**只有一颗 `关闭`**——点开能读详情，但这一格不支持裁决；
 *   **下沿那一半（`已经会`）仍只经图上那把划子**（`KG_SCRAPER`），对话框里不给第二个理由档；
 * · **已否**（`dropped`）：`↩ 放回来（要讲）`。
 *
 * ⚠️ **可见文案里没有一句解释**（有意，既有裁决）：理由就是键自己、卡的颜色就是「轮到没轮到」；
 * ⛔ 别把已退役的「当前不支持裁决」加回来（它写的是「不能裁」，而中段那一格现在表达的是
 * 「能读、能关」，两句话不是同一件事）。
 *
 * 四档共用同一段渲染（⛔ 不按档复制四份对话框）。
 */
function Dialog({ card, state, busy, onDecide, onClose }) {
	if (card === undefined) return null;
	/** 一颗动作键（`disabled` 只由通路正在飞那一位决定；⛔ 没有按档写死的 disabled）。 */
	const action = (label, onClick, extra = {}) => createElement(
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
				cursor: "pointer",
			}, busy),
		},
		label,
	);
	const keys = state === "dropped"
		? [action(KG_DIALOG_KEYS.restore, () => onDecide(card.key, KG_VERDICTS.keep), { mark: "restore" })]
		: state === "keep"
			// 票 16：中段卡点开只读——这一颗只关框，⛔ 不发任何裁决（`close` 是唯一的动作键）。
			? [action(KG_DIALOG_KEYS.close, onClose, { mark: "close" })]
			: [
					// 票 `confirm-points-redesign-build/10`：框里这颗键走**「不需要」**那一档理由
					// （本书不覆盖这个主题）；图上那把划子走**「已经会」**那一档。两条落**同一份**记录。
					// 票 16：`frontier` 与 `upper`（两端前沿）共用这一副键——上端也是「范围」判断。
					action(KG_DIALOG_KEYS.drop, () => onDecide(card.key, KG_VERDICTS.drop, EXCLUSION_REASON_NOT_NEEDED), { mark: "drop" }),
					action(KG_DIALOG_KEYS.hold, onClose, { mark: "hold" }),
				];
	return createElement(
		"div",
		{
			"data-kg-dialog": "1",
			"data-kg-dialog-state": state,
			style: { position: "fixed", inset: 0, zIndex: 40 },
		},
		createElement("div", {
			"data-kg-dialog-mask": "1",
			onClick: onClose,
			style: { position: "absolute", inset: 0, background: "rgba(15, 23, 42, .38)" },
		}),
		createElement(
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
					color: "var(--dsw-alias-label-primary)",
				},
			},
			createElement(
				"div",
				{ style: { display: "flex", alignItems: "flex-start", gap: "10px" } },
				createElement(
					"div",
					{
						"data-kg-dialog-title": "1",
						style: { flex: "1 1 auto", fontSize: "13px", fontWeight: 700, lineHeight: 1.45 },
					},
					card.name,
				),
				createElement(
					"button",
					{
						type: "button",
						"data-kg-dialog-close": "1",
						"aria-label": "关掉",
						onClick: onClose,
						style: { flex: "0 0 auto", border: "none", background: "none", fontSize: "16px", lineHeight: 1, cursor: "pointer", color: "inherit" },
					},
					"×",
				),
			),
			createElement(
				"p",
				{
					"data-kg-dialog-testable": "1",
					style: { fontSize: "12px", lineHeight: 1.7, margin: "6px 0 0", whiteSpace: "pre-wrap" },
				},
				String(card.testable ?? ""),
			),
			// 动作键那一排（四档各差一颗，见上面那段）。⛔ 这里不印任何「为什么」的话。
			createElement(
				"div",
				{ "data-kg-dialog-actions": "1", style: { display: "flex", flexWrap: "wrap", gap: "8px", margin: "10px 0 0" } },
				...keys,
			),
		),
	);
}

// ⚠️ 这里原先有一行 `export const KG_KINDS = EDGE_KINDS;`（「本模块认识的边类」）——
// 票 `ui-workflow-seam/04` **删掉了它**：全仓零消费者（取样：
// `grep -rn "KG_KINDS" src/ test/ dev/ scripts/ --include=*.js --include=*.mjs`，只剩声明那一行），
// 而且它的注释与 `EDGE_KINDS` 在根级词表里的注释重复。留着一个零消费者的导出是
// Speculative Generality——正是 `ADR-0044` 反复否掉的那个形状（「为将来加导出」）。
// ⚠️ 但 `EDGE_KINDS` 这条 import **留着**：上面的 `KG_KIND_STROKES` 两个键由它派生，
// 界面靠它才不必把 `alias`／`see-also` 两个边类名再手抄一遍。
