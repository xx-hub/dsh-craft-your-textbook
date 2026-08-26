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
		color: "var(--dsw-text, #1f2328)",
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
			? "1px solid var(--dsw-accent, #4f6ef7)"
			: "1px solid var(--dsw-border, #d0d7de)",
		background: active ? "var(--dsw-accent-soft, #eef2ff)" : "transparent",
		borderRadius: "8px",
		padding: "6px 10px",
		fontSize: "13px",
		cursor: "pointer",
	}),
	card: {
		border: "1px solid var(--dsw-border, #d0d7de)",
		borderRadius: "10px",
		padding: "12px 14px",
		marginBottom: "10px",
		background: "var(--dsw-surface, #ffffff)",
		fontSize: "13px",
	},
	focus: {
		border: "1.5px solid var(--dsw-accent, #4f6ef7)",
		borderRadius: "12px",
		padding: "14px 16px",
		marginBottom: "12px",
		background: "var(--dsw-accent-soft, #eef2ff)",
		fontSize: "13px",
	},
	error: {
		color: "var(--dsw-danger, #cf222e)",
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
		color: "#ffffff",
		background: primary
			? "var(--dsw-accent, #4f6ef7)"
			: "var(--dsw-danger, #cf222e)",
	}),
	smallLink: {
		border: "none",
		background: "transparent",
		color: "var(--dsw-accent, #4f6ef7)",
		cursor: "pointer",
		fontSize: "12px",
		textDecoration: "underline",
		padding: "0",
	},
	input: {
		width: "100%",
		borderRadius: "8px",
		border: "1px solid var(--dsw-border, #d0d7de)",
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
		border: "1px solid var(--dsw-border, #d0d7de)",
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
				? "var(--dsw-text, #1f2328)"
				: state === "current"
					? "#ffffff"
					: "var(--dsw-text, #1f2328)",
		background:
			state === "done"
				? "var(--dsw-success-soft, #dafbe1)"
				: state === "current"
					? "var(--dsw-accent, #4f6ef7)"
					: "var(--dsw-border-soft, #eff1f4)",
		border:
			state === "current" ? "none" : "1px solid var(--dsw-border, #d0d7de)",
	}),
};
