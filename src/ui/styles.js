/**
 * 造书工作台 · 共享样式表（S）
 *
 * 全部 UI 域文件共用的内联样式对象。只放数据，不放逻辑、不引 React——
 * 各域从这里拿基础样式，再按需覆盖。
 */

export const S = {
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
		borderRadius: "12px",
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
	bigBtn: (primary) => ({
		border: "none",
		borderRadius: "10px",
		padding: "10px 18px",
		fontSize: "14px",
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
		fontSize: "14px",
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
	seg: (state) => ({
		flex: 1,
		borderRadius: "6px",
		padding: "6px 2px",
		textAlign: "center",
		fontSize: "11px",
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
