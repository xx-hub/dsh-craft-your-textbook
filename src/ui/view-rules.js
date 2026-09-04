/**
 * 展示派生（view rules）——架构评审候选 4 收口：壳（client-entry WorkbenchView）不养展示派生。
 *
 * 三个映射集中在此，纯函数、显式吃 (meta, workFiles) 输入，可独立测试：
 *   - STAGE_HUMAN / stageHuman：stage（机器内部简称）→ 界面全称
 *   - phaseProduct：阶段 → 产物文件（顶部分段按钮的可点击目标）
 *   - workPathForEvent：事件卡片 → 结果文件（"查看"入口）
 *
 * 双端共享领域件（goldChapterNo 等）以 src/domain-rules.js 为单一事实来源；
 * 本模块只做展示映射，不含业务状态。
 */
import { goldChapterNo } from "../domain-rules.js";

// 阶段（stage）→ 界面全称。⚠️ 与后端 stageLabel 的「范例章」是故意分工：
// 机器内部/账本/文件用简称「范例章」，界面给用户看正式全称「最佳范例章」（见 CONTEXT.md）。
export const STAGE_HUMAN = {
	explore: "源探查",
	outline: "章节骨架",
	gold: "最佳范例章",
	chapters: "铺章",
	merge: "合并成书",
	final: "最后检查",
};

export const stageHuman = (stage) => STAGE_HUMAN[stage] ?? "";

// 焦点区（主卡）选哪张卡：把 WorkbenchView 的内联路由链抽成纯函数，可独立测试。
// ⚠️ 路由顺序即语义顺序（与历史实现一一对应）：拍板关卡 → 各确认闸门 → 交付 →
// 铺章章节卡 → 上传材料 → 状态卡。改了顺序必须同步改这里与调用点。
export function focusCardKey(meta, gate) {
  if (gate !== null && gate !== undefined && gate.status === "awaiting")
    return "gate";
  const status = meta?.status ?? "";
  if (status === "awaiting-explore") return "explore";
  if (status === "awaiting-outline") return "outline";
  if (status === "awaiting-gold") return "gold";
  if (status === "awaiting-final-approval") return "final";
  if (status === "delivered") return "delivered";
  // 铺章章节卡（含全章过目确认）：真实与演示共用——demo 全镜像后演示书也停在
  // awaiting-chapters-review 等人过目（2026-09-03 实测：`demo!==true` 会把演示书踢去
  // StatusCard，没有「都过了，交工」按钮，死在过目闸门）。
  if (meta?.phase === 5) return "chapters";
  if (meta?.phase === 1) return "upload";
  return "status";
}

// 阶段 → 结果（顶部分段按钮可点击查看）。阶段 1 是"材料清单"面板（非文件）。
export const phaseProduct = (phase, meta, workFiles) => {
	if (phase === 1) return { path: "__materials__", label: "第一步·材料" };
	const map = {
		2: "work/explore.md",
		3: "work/outline.md",
		4: `work/chapter-${String(goldChapterNo(meta)).padStart(2, "0")}.md`,
		5: "work/book.md",
		6: "work/book.md",
	};
	const path = map[phase];
	if (path === undefined) return null;
	return workFiles.find((f) => f.path === path) ?? null;
};

// 事件卡片 → 结果文件（只在实际存在的文件上给"查看"入口）。
export const workPathForEvent = (event, meta, workFiles) => {
	const data = event.data ?? {};
	const candidates = [];
	const label = data.label ?? "";
	if (
		event.type === "textbook/agent-end" ||
		event.type === "textbook/agent-start"
	) {
		if (label === "源探查") candidates.push("work/explore.md");
		else if (label === "合并成书" || label === "最后检查（质量门）")
			candidates.push("work/book.md");
		else if (label === "整理章节骨架") candidates.push("work/outline.md");
		else if (label === "最佳范例章" || label.startsWith("最佳范例章"))
			candidates.push(
				`work/chapter-${String(goldChapterNo(meta)).padStart(2, "0")}.md`,
			);
		else if (label.startsWith("写第")) {
			const match = /写第(\d+)章/.exec(label);
			if (match !== null)
				candidates.push(
					`work/chapter-${String(Number(match[1])).padStart(2, "0")}.md`,
				);
		} else if (label.startsWith("自查第")) {
			const match = /自查第(\d+)章/.exec(label);
			if (match !== null)
				candidates.push(
					`work/audit-${String(Number(match[1])).padStart(2, "0")}.md`,
				);
		}
	} else if (event.type === "textbook/phase-end") {
		const phase = Number(data.phase);
		if (phase === 2) candidates.push("work/explore.md");
		else if (phase === 4)
			candidates.push(
				`work/chapter-${String(goldChapterNo(meta)).padStart(2, "0")}.md`,
			);
		else if (phase === 5 || phase === 6) candidates.push("work/book.md");
	}
	const hit = candidates.find((path) =>
		workFiles.some((f) => f.path === path),
	);
	if (hit === undefined) return null;
	return {
		path: hit,
		label: workFiles.find((f) => f.path === hit)?.label ?? hit,
	};
};
