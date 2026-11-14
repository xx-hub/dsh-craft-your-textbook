/**
 * payload 字段词汇层 · 层一（票 `deep-module-scan/18`）
 *
 * ## 它是什么，不是什么
 *
 * **是**一组共用函数 ＋ **一份具名上限**。<!--r:catalog.canonical-->54<!--/r--> 个动作的 payload 契约写着两处（`agent-tool.js`
 * 的 `preValidate` 与 `actions/*` 各 case），而「**哪些数是 interface 事实**」此前**没有任何
 * 一处清单**——风格意见 300 字、驳回说明 500 字、进度叙述 60 字……caller 只能从代码里读出来。
 *
 * **不是** seam。**它只有一个 implementation**（`actions/*` 那一份），所以按「一个 adapter 就是
 * 假 seam」的纪律，**不包装成 port/interface**——那是给纯函数套壳。加这层是为了**收口**，
 * 不是为了架构对称。
 *
 * ## ⚠️ 三个函数**不是**同一件事的三个写法，合并它们会**静默改行为**
 *
 * | 函数 | 语义 | 非字符串时 |
 * | --- | --- | --- |
 * | `textField` | `typeof v === 'string' ? v.trim().slice(0, max) : ''` | 落 `''` |
 * | `textFieldRaw` | `typeof v === 'string' ? v.slice(0, max) : fallback` | 落 `fallback` |
 * | `textCoerced` | `String(v ?? '')[.trim()].slice(0, max)` | **`String()` 强制** |
 *
 * `textField(null)` 落 `''`，而 `textCoerced(null)` 也落 `''`——但 `textCoerced(123)` 落
 * `'123'`，`textField(123)` 落 `''`。**这个差别在 HTTP 直发时可观察**（AI 工具那侧
 * `preValidate` 会先拦掉非字符串，直发不会）。⇒ 搬动时**按原表达式选函数**，不要「统一」成
 * 一个。仓库里两种写法原本就并存，那是**事实**，不是笔误。
 *
 * `trim` 同理：有的字段裁空白后再截断、有的不裁（截断到上限之后尾部空白会留着）。
 *
 * ## 上限为什么逐字段起名，而不是按数值归类
 *
 * 「300」在本仓出现 7 次，但那是**五个不同字段**的契约恰好同值（风格意见 / 豁免说明 /
 * 意见愿望 / 备注 / 进度详述）。按数值归类会把五件事写成一个名字——**那才是把复制变成
 * 耦合**。⇒ **一个字段一个名字**，同名字段在多个 case 出现才共用那一个常量（如 `GATE_NOTE_MAX`）。
 *
 * ## 边界
 *
 * **本层只管「怎么读一个字段」**，不管「这次动作算不算成功」——400/409 的分工、落账与否、
 * `rejectSubmit` 的纪律全部不动（`agent-tool.js` 的 `preValidate` 也**仍在**：它存在的理由是
 * 「**不联网即可拦下明显错参**」，错误信息要能指导 AI 引导用户）。
 */

/** 风格意见正文。 */
export const STYLE_NOTE_TEXT_MAX = 300;
/** 撤销风格线时的那句备注。 */
export const STYLE_NOTE_REVOKE_NOTE_MAX = 300;
/** 协作留言正文（`intervene`）。 */
export const INTERVENE_TEXT_MAX = 500;
/** 留言指向（如「第4章」）。 */
export const INTERVENE_TARGET_MAX = 60;
/** 豁免时用户手输的原因（放行必要条件）。 */
export const WAIVER_NOTE_MAX = 300;
/** 豁免作用域里「哪一条检查」那一格（票 `walkthrough-fixes/23`）：`other` 点名放行的那条检查项名，
 *  形如「无重复标题」「必含板块齐全（契约项）」——按检查项自己的名字逐字比，所以给足一个中文名的长度。 */
export const WAIVER_CHECK_MAX = 60;
/**
 * 一次逐点豁免**最多点名几条**（票 `kn-unowned-silent/02`）。
 *
 * 它是「放弃哪几条点」的清单，不是整本书的图谱 ⇒ 上限取单章上限的十倍（200）：一本书十章、
 * 每章都顶格 20 条也只有 200 条可放弃，超过这个数就是错把整张图谱塞进来了。
 */
export const WAIVER_POINTS_MAX = 200;
/** 逐点豁免里一条知识点的 title 上限（与 `CHAPTER_SIDE_REASON_MAX` 同档：人读句子）。
 *  ⚠️ 调用点（`collab-signals.js` 的 `waive`）**不裁**超长的 title（超了是 400，不是悄悄截断）：
 *  截断后的 title 与图上那条对不上，豁免会静默失效。 */
export const WAIVER_POINT_TITLE_MAX = 200;
/** 逐点豁免里一条知识点的 `id` 上限（`kp-a-01` 这一族，给足余量）。 */
export const WAIVER_POINT_ID_MAX = 60;
/** 暂停原因（落账与恢复上下文）。 */
export const PAUSE_REASON_MAX = 200;
/** 拍板/重做时那句话（`gate-decide` 与两条重做路径共用）。 */
export const GATE_NOTE_MAX = 500;
/** 段落意见的一句话说明。 */
export const GOLD_WISH_MAX = 300;
/** 段落意见的定位提示（如「开头那段」）。 */
export const GOLD_HINT_MAX = 60;
/** 让 AI 照改的改进方向。 */
export const GOLD_REVISE_NOTE_MAX = 500;
/** 建议样例章的理由 / 交接体积依据 / 抽查意见处置说明（同一档长度，取人读句子）。 */
export const CHAPTER_SIDE_REASON_MAX = 200;
/**
 * outline 交工时单章知识点清单的条数上限 —— **原位置再导出**（票 `ui-workflow-seam/01`）。
 * 声明已搬到 `src/outline-limits.js`（`src/` 根级、零 import）：界面（`magnitudeReading` 的
 * 分母）也要这一个数，而它不该知道 `workflow/actions/` 这种内部路径。
 * ⚠️ **本行不是第二份真值**：`export … from` 是同一个绑定，没有拷贝；下面 6 个本目录 importer
 * （`convert`／`collab-signals`／`chapters`／`deep-modify`／`gold`／`gates`）与 `engine.js`
 * 的 import **一行都不用改**——「搬运票不改 import 面」。
 */
export { OUTLINE_POINTS_MAX } from '../../outline-limits.js';
/** 进度叙述的一行标签。 */
export const PROGRESS_LABEL_MAX = 60;
/** 进度叙述的展开说明。 */
export const PROGRESS_DETAIL_MAX = 300;
/** 定点修改的说明（落账与 AI 的改进方向）。 */
export const DEEP_MODIFY_NOTE_MAX = 500;
/** 材料转换进度回放行的摘要上限。 */
export const CONVERT_TEXT_MAX = 200;
/** 派单时主笔给的那一句叮嘱（`agent-assign`；判断的唯一出口，与「改进方向」同档长度）。 */
export const AGENT_ASSIGN_NOTE_MAX = 500;

/**
 * 严格读一个文本字段：**只认字符串**，裁掉首尾空白，再截到上限。非字符串落 `''`。
 * @param {unknown} value 请求体里那一位。
 * @param {number} max 上限（字符数）。**逐字沿用原表达式里的数字。**
 * @returns {string}
 */
export function textField(value, max) {
	return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * 同上但**不裁空白**，且非字符串时落调用方给的那一个缺省（可缺省为 `''`）。
 * @param {unknown} value
 * @param {number} max
 * @param {string} [fallback]
 * @returns {string}
 */
export function textFieldRaw(value, max, fallback = "") {
	return typeof value === "string" ? value.slice(0, max) : fallback;
}

/**
 * `String(value ?? '')` 那个形状：**先强制成字符串**再截断。
 *
 * ⚠️ 与 `textField` **不是**一回事——`textCoerced(123)` 是 `'123'`，`textField(123)` 是 `''`。
 * 仓库里两处并存是**事实**，不是笔误；搬动时按原表达式选。
 *
 * @param {unknown} value
 * @param {number} max
 * @param {boolean} [trim] 是否裁首尾空白（默认否）。
 * @returns {string}
 */
export function textCoerced(value, max, trim = false) {
	const text = String(value ?? "");
	return (trim ? text.trim() : text).slice(0, max);
}