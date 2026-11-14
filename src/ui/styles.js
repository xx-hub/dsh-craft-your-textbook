/**
 * 造书工作台 · 共享样式表（S）
 *
 * 全部 UI 域文件共用的内联样式对象。只放数据，不放逻辑、不引 React——
 * 各域从这里拿基础样式，再按需覆盖。
 */

/**
 * **禁用态的视觉**（票 `gold-display-period/05`）：本仓**唯一**一处「置灰」的出处。
 *
 * ## 为什么必须住在内联样式这一层
 *
 * 票 05 的读数（2026-10-11 现采：`src/**` 的 `disabled:` 调用点 **66** 处）：
 *
 * - `src/ui/styles.js` 全文件 **0** 处 `:disabled`／`[disabled]`，四个交互 helper 把
 *   `cursor:"pointer"` **写死**；
 * - 插件**零 `className`**（全仓 `src/**` 0 命中）⇒ 宿主那 22 条 `:disabled` 规则**全是哈希类
 *   选择器**（`._button_…:disabled{opacity:.4}` 一类），一条也匹配不到这些元素；仓里也**没有**
 *   任何 CSS 文件 ⇒ 唯一还可能生效的样式层是浏览器 UA 样式表，而作者内联的 `color`／`background`
 *   会赢它。
 *
 * ⇒ 想让「禁用了」看得出来，只能**每个调用点把自己的 `disabled` 表达式折进内联样式**。
 * 这就是下面这个函数，写法固定为：
 *
 * ```js
 * style: S.disabled(S.bigBtn(true), busy),   // ← 第二个实参逐字就是同一个 disabled 表达式
 * disabled: busy,
 * ```
 *
 * 判据在 `test/test-disabled-visual.mjs`：它逐处断「第二个实参与 `disabled` 的值**逐字同一个
 * 表达式**」——所以那两处必须一起改，抄错一个标识符当场红。
 *
 * ## 两个刻意的选择
 *
 * 1. **`DISABLED_VISUAL` 压在基样式之上**（`{...base, ...DISABLED_VISUAL}`）：基样式里写死的
 *    `opacity`（`event-cards.js` 那几颗 `opacity: 0.7` 的小链接）与 `cursor:"pointer"`（四个 helper）
 *    都**不许**赢过置灰——不然「置灰」在某些键上等于没加。
 * 2. **`=== true` 才算禁用**：与 DOM 的 `disabled` 语义同一口径（`disabled: props.disabled === true`
 *    这种写法全仓都有），`undefined`／`false` 一律**原样返回**基样式那一份对象（不改基样式、
 *    不产生新对象）。
 *
 * ⚠️ 它是**视觉**，不是行为：`disabled` 之后浏览器不响应点击，那由 DOM 属性管，不在这里。
 * ⚠️ 「看得出来／好不好看」仍归人眼（`docs/测试信任边界.md` 的「改完怎么对照」一节（`改了前端` 那一条））——本文件只保证
 * 「禁用了的元素在样式上确实与启用态不同」。
 */
export const DISABLED_VISUAL = Object.freeze({
	opacity: 0.45,
	cursor: "not-allowed",
})

export const S = {
	/**
	 * 把「此刻禁用了」折进样式：真时叠上 `DISABLED_VISUAL`，否则**原样**返回基样式。
	 * 逐处调用点的第二个实参必须与那一颗键的 `disabled` 值逐字相同（判据钉着这件事）。
	 */
	disabled: (base, isDisabled) => (isDisabled === true ? { ...base, ...DISABLED_VISUAL } : base),
	container: {
		padding: "16px 20px",
		fontFamily: "inherit",
		color: "var(--dsw-alias-label-primary)",
	},
	title: { fontSize: "16px", fontWeight: 600, margin: "0 0 4px" },
	hint: { fontSize: "12px", opacity: 0.65, margin: "0 0 12px" },
	projectRow: {
		display: "flex",
		gap: "8px",
		flexWrap: "wrap",
		marginBottom: "12px",
	},
	projectBtn: (active) => ({
		border: active
			? "1px solid var(--dsw-alias-state-business-primary)"
			: "1px solid var(--dsw-alias-border-l2)",
		background: active ? "var(--dsw-alias-state-business-tertiary)" : "transparent",
		borderRadius: "8px",
		padding: "6px 10px",
		fontSize: "13px",
		cursor: "pointer",
	}),
	card: {
		border: "1px solid var(--dsw-alias-border-l2)",
		borderRadius: "10px",
		padding: "12px 14px",
		marginBottom: "10px",
		background: "var(--dsw-alias-bg-layer-1)",
		fontSize: "13px",
	},
	focus: {
		border: "1.5px solid var(--dsw-alias-state-business-primary)",
		// 票 04（判据 5/10）：焦点卡与普通卡两档拉开——16px vs card 的 10px。
		// ⚠️ 这只是「两档拉开」，不是同心公式闭合：padding 仍是 14px 16px，16 − 16 ≠ 10。
		borderRadius: "16px",
		padding: "14px 16px",
		marginBottom: "12px",
		background: "var(--dsw-alias-state-business-tertiary)",
		fontSize: "13px",
	},
	error: {
		color: "var(--dsw-alias-state-error-primary)",
		fontSize: "13px",
		margin: "8px 0",
	},
	// 「有新版可升」那一行。**刻意不是 error 色**：它不是出错了，是一条要人决定的提示，
	// 染成红的会和上面那行真错误抢同一份注意力（用户已经学会忽略红色的那一行）。
	// 次要文字用 `opacity` 而不是写一个色值 token——本文件里其余条目引用的都是宿主
	// **已证明存在**的那些 token，凭空引一个不存在的会让整条 color 声明失效退回继承色。
	update: {
		fontSize: "12px",
		opacity: 0.85,
		margin: "8px 0",
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
		background: primary
			? "var(--dsw-alias-state-business-primary)"
			: "var(--dsw-alias-state-error-primary)",
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
		color: danger ? "var(--dsw-alias-state-error-primary)" : "inherit",
	}),
	smallLink: {
		border: "none",
		background: "transparent",
		color: "var(--dsw-alias-state-business-primary)",
		cursor: "pointer",
		fontSize: "12px",
		textDecoration: "underline",
		padding: "0",
	},
	input: {
		width: "100%",
		borderRadius: "8px",
		border: "1px solid var(--dsw-alias-border-l2)",
		padding: "6px 8px",
		fontSize: "13px",
		boxSizing: "border-box",
		fontFamily: "inherit",
		margin: "4px 0 8px",
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
		margin: "4px 0 8px",
	},
	label: {
		fontSize: "12px",
		fontWeight: 600,
		display: "block",
		marginTop: "6px",
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
		padding: "8px 0",
	},
	seg: (state) => ({
		flex: 1,
		borderRadius: "6px",
		padding: "6px 2px",
		textAlign: "center",
		fontSize: "12px",
		color:
			state === "done"
				? "var(--dsw-alias-label-primary)"
				: state === "current"
					? "var(--dsw-alias-label-primary-foreground)"
					: "var(--dsw-alias-label-primary)",
		background:
			state === "done"
				? "var(--dsw-alias-state-success-tertiary)"
				: state === "current"
					? "var(--dsw-alias-state-business-primary)"
					: "var(--dsw-alias-bg-skeleton)",
		border:
			state === "current" ? "none" : "1px solid var(--dsw-alias-border-l2)",
	}),
};
