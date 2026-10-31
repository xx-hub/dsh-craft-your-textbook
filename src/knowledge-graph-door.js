/**
 * 知识点图的**根级门**：界面要知道的那点东西，只从这里过（票 `ui-workflow-seam/02`）。
 *
 * ## 它是什么，不是什么
 *
 * **是**两个名字：`prereqEdges(edges)`（哪些边算前置）与 `edgeScanReading(merged)`（这次扫面读到几条）。
 * 界面在 `src/ui/knowledge-graph-map.js` 里用它们做**同一件事**——`:316-330` 的
 * `gatePrereqEdges`／`allPrereqEdges` 都吃 `prereqEdges`，`:1015` 取读数。它们是一份知识的两个面。
 *
 * **不是**适配器、⛔ 不改语义：`prereqEdges` 是**同一个函数引用**再导出（`export { … as … }`），
 * 不是包一层 `(edges) => workflowPrereqEdges(edges)`——包一层会多一个栈帧，还会让人以为
 * 「门可以改它的语义」（`test-reader-gap.mjs` 的反证逐字断 `door.prereqEdges === 原件`）。
 * `edgeScanReading` 的**函数体逐字**从 `src/ui/knowledge-graph-map.js:666` 搬来：措辞的唯一出处
 * 仍是闸门的 `edgeScanText()`，本模块只是把它从闸门的读数里取出来，⛔ 不重写一句。
 *
 * ## 为什么它住 `src/` 根级（⛔ 别造 `src/ui/knowledge-graph-door.js`）
 *
 * `AGENTS.md` 的「Frontend layout」要求 `src/ui/` 跨域协作只走 public exports。而**转发模块
 * 必须自己 import `workflow/`**——它若住在 `src/ui/` 里，自己就是第 7 条深层边，判据永远数不干净
 * （`ADR-0044:43` 同形否决过 `src/ui/words.js`）。住根级时界面 import 的是 `../knowledge-graph-door.js`
 * （根级单文件，条款允许的形态）。
 *
 * ## ⚠️ 为什么这里**允许** import `./workflow/…`（与同批两个纯词表模块不同）
 *
 * 界面今天**已经**经这扇门把这条 import 闭包整个拖进 bundle 了（`src/ui/knowledge-graph-map.js`
 * 取 `edgeScanReading`；门自己 import `knowledgeMapGateProblems`）。**9** 个文件、**0 条**非相对
 * 说明符 ⇒ 门不新增任何 bundle 成本，只是换一条 import 路径。约束不是「零 import」，而是
 * **闭包不许出现 `node:`／react／第三方**（闭包那半在 `test-reader-gap.mjs`；方向那半在
 * `dev/ui-source-gates.mjs`，⛔ 后者不量裸依赖）。
 * ⚠️ 这个 **9** 是「以本文件为起点」的闭包；spec 写下时量的 **10** 是四落点合并的那一支
 * （含 `payload-fields` 一路；同一个四落点命令今天读 **11**），⛔ 不是同一张点名单。取样：
 * `node --input-type=module -e "import{importClosureOf}from'./scripts/source-scan-base.mjs';import{readFileSync}from'node:fs';console.log(importClosureOf(['src/knowledge-graph-door.js'],f=>{try{return readFileSync(f,'utf8')}catch{return null}}).files.length)"`
 *
 * ## ⚠️ 不搬这两个 workflow 模块（已量，有意不做；spec 决策 2／6）
 *
 * · `knowledge-map-gate.js`（今天 **604** 行；spec 写下时 605。取样：`wc -l src/workflow/knowledge-map-gate.js`）：
 *   界面只要 readings 里的**三格**（`edgeScanText`／`zeroEdges`／`graphPresent`）。为三格把 604 行
 *   搬走，是拿 interface 换位置。
 * · `knowledge-graph.js`（今天 **478** 行；spec 写下时 479；0 import。取样：`wc -l src/workflow/knowledge-graph.js`）：
 *   界面只要一个纯函数与三个字符串。搬它会动 5 个
 *   workflow importer ＋ 4 个测试路径，其中 3 处是**路径敏感的判据**——那类改动最容易做成
 *   「绿着漏」（换个路径，判据仍然绿，因为它们扫的是新位置的同一个文件）。
 *
 * ## ⚠️ 本模块管的面（窄处，照实写）
 *
 * 面＝**这两个导出**。它管不到：① `merged` 的形状合不合法（那是闸门自己的活；本模块拿到坏
 * `merged` 时行为与搬之前一致即可）；② 界面该不该看 `problems`（它今天就不看，本模块让这个
 * 事实变成**结构**——只暴露两个名字）；③ 「这次扫面 N 条边」这句话对不对（措辞归闸门）。
 * ⚠️ 门只有两个导出。将来界面要第三个东西时，**在这扇门里加**，⛔ 不许从 `src/ui/` 直连 `workflow/`。
 */
import { prereqEdges as workflowPrereqEdges } from './workflow/knowledge-graph.js'
import { edgeScanText, knowledgeMapGateProblems } from './workflow/knowledge-map-gate.js'

/**
 * 全部 `prereq` 边（**同一个函数引用**再导出，⛔ 不包一层）。
 *
 * 对它对着不干净的边表（缺 `kind`／出域）会抛 `KnowledgeGraphInputError`——界面那侧**不当闸门**
 * （形状归 `src/workflow/knowledge-map-gate.js`，它在交工那一跳已经把坏图拒了），退化口径在
 * 调用方（`gatePrereqEdges`／`allPrereqEdges` 各自的 `try/catch`）。
 */
export { workflowPrereqEdges as prereqEdges }

/**
 * 「本次扫面 N 条边」那条读数——**措辞的唯一出处**_仍是_形状闸的 `edgeScanText()`
 * （`readings.edgeScanText`），本函数只是把它从闸门的读数里取出来，⛔ 不重写一句。
 *
 * ⚠️ 函数体**逐字**搬自 `src/ui/knowledge-graph-map.js:666`（搬运票的第一条纪律是「零行为变化」）：
 * `merged === null || typeof merged !== "object"` 那个前置判断也照搬——
 * `test-knowledge-graph-map.mjs` 钉着 `edgeScanReading(null).text === edgeScanText(null)`。
 *
 * @param {object|null} merged 合并件（对象）
 * @returns {{text: string, zeroEdges: boolean|null, graphPresent: boolean}}
 */
export function edgeScanReading(merged) {
	if (merged === null || typeof merged !== "object") {
		return { text: edgeScanText(null), zeroEdges: null, graphPresent: false };
	}
	const { readings } = knowledgeMapGateProblems({ merged });
	return {
		text: readings.edgeScanText ?? edgeScanText(null),
		zeroEdges: readings.zeroEdges,
		graphPresent: readings.graphPresent === true,
	};
}
