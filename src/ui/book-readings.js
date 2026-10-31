/**
 * 造书工作台 · 书侧读数：**全书汉字数**与**全书知识点条数**（票 `ui-display-redesign/09`）
 *
 * 交付页那两句事实要印「3 章 · 约 4.2 万汉字 · 48 条知识点（按清单计）」，而这两个读数
 * 今天盘上**没有现成的**（`spec.md` §7 缺数据登记 1／6）：
 *   · 全书实际字数：服务端只给范例章一个 `meta.goldMeasuredHanzi`，其余章一个字都没量过；
 *   · 全书知识点数：合并件里有一份清单，但交付页从来没接过线。
 *
 * 本 module 就是那两个读数的**唯一派生处**（⛔ 卡里、壳里不许再写第二份量法）：
 *
 *   · {@link deriveBookReadings} —— **纯**派生：章数 ＋ 逐章正文 ＋ 合并件原文 → 读数对象。
 *     一张卡拿到这三个输入就能同步算出来（画廊夹具、单测都走它）。
 *   · {@link loadBookReadings} —— 同一份派生的**异步**入口：按章读正文
 *     （`ui/artifact-read.js` 的 `readText`，也就是生产壳递下来的 `fetchText`）再调上面的纯派生。
 *   · {@link useBookReadings} —— **交付卡 `DeliveryCard` 的唯一取数口**：挂载后读一次章稿、
 *     读到就换成真读数，读不到停在「未知」。
 *
 * ⚠️ **它不是「两张卡共用的取数口」**（票 `ui-display-redesign/17` · 收口 review F3 订正）：
 * 今天唯一的调用点是 `event-cards.js` 的 `DeliveryCard`（spec §2.11 交付页事实句与读数块）。
 * 终检卡 `FinalApprovalCard` **有意不消费**书侧读数——它的卡头事实句按 spec §2.10 第 2 块是
 * 「机器检查 · 文件对账 · AI 报告」三段（`finalApprovalFacts`），不含章节字数／知识点条数。
 * ⛔ 别把本 hook 再接进终检卡：那会让那张屏印一句 spec 没裁的读数。
 *
 * ## 读数对象（交付卡只认这一个形状）
 *
 * ```
 * {
 *   chapters: 3 | null,                                  // 章数；null ＝ 没有章节安排（空书）
 *   hanzi: { known: true, total: 42000, missing: [] },   // 全书汉字数（照 `domain-rules.countHanzi`）
 *   knowledgePoints: { known: true, count: 48 },         // 合并件清单条数（「按清单计」）
 * }
 * ```
 *
 * **失败态一律 `known: false` ＋ 值 `null`**：任一章正文读不到 ⇒ `hanzi.known === false`
 * （`missing` 里点名是哪几章），**⛔ 绝不退化成 0**——「没读到」与「读到 0 个汉字」是两件事
 * （`spec.md` §7 登记 1 的失败态：「这一章正文读不到，字数未知」）。合并件读不到／形状不对
 * 同理：`knowledgePoints.known === false`。
 *
 * ## 量法（⛔ 不许另写）
 *
 * · 汉字：`domain-rules.countHanzi`（全书唯一的汉字计数判据，与范例章 `goldMeasuredHanzi`
 *   同一条路）——数字、字母、标点、空白都不计。
 * · 章稿路径：`domain-rules.chapterRel(n)`（`工作区/chapter-NN.md`，`/textbook/file` 判 `preview`
 *   ⇒ 读得回来）。章号取 `meta.outline.chapters` 的 1..N（与 `chapterStatus` 同一份章单）。
 * · 知识点条数：合并件（`工作区/knowledge-map.json`，随 `/textbook/events` 下发的
 *   `knowledgeMap` 原文）里 `knowledgePoints[]` 的长度——**按清单计**，不减去人在图上划掉的
 *   （spec §2.11 那句事实句逐字写着「按清单计」）。形状读取走 `machine-product-folds.js` 的
 *   唯一 `JSON.parse` 落点（⛔ 本 module 不自己解析）。
 *
 * ## 接缝为什么是「卡片取数口」而不是书级袋子（照实说）
 *
 * 书级袋子（`ui/card-book.js` 的 `CARD_BOOK_KEYS`）里的值必须**同步**算得出来：画廊适配器
 * （`dev/gallery/cards.js`）在渲染里同步造同一本袋子。而全书字数要真读 N 份章稿（异步），
 * 袋子装不下它。卡里读产物是本仓**既有**的那条缝（`gold-table.js` 的当前稿就是挂载 effect
 * 里经 `fetchText` 读的）——所以两个读数走同一条缝，取数口只此一个。
 *
 * ⚠️ 边界：⛔ 不新增服务端字段、⛔ 不写盘、⛔ 不动 `meta` 账本。
 */

import { useEffect, useMemo, useState } from "react";
import { chapterRel, countHanzi } from "../domain-rules.js";
import { parseKnowledgeMapRaw } from "./machine-product-folds.js";

/** 全书字数读不到时屏上那句（spec §7 登记 1 的失败态；⛔ 不写 0）。 */
export const HANZI_READING_UNKNOWN = "字数未知";

/** 全书知识点条数读不到时屏上那句（⛔ 不写 0）。 */
export const KNOWLEDGE_POINTS_READING_UNKNOWN = "知识点数未知";

/** 交付页事实句里「按清单计」那个括注（措辞与 spec §2.11 逐字一致）。 */
const BY_LIST_NOTE = "按清单计";

/**
 * 章单：`meta.outline.chapters` 的 1..N 章号。
 *
 * @param {object|null} meta 书级账本视图（`/textbook/events` 的 `meta`）
 * @returns {number[]|null} 章号数组；**没有章节安排／0 章 ⇒ null**（空书不摆读数，⛔ 不写 0）。
 */
export function bookChapterNumbers(meta) {
	const chapters = meta?.outline?.chapters;
	if (!Array.isArray(chapters) || chapters.length === 0) return null;
	return chapters.map((_, index) => index + 1);
}

/**
 * 逐章正文 → 全书汉字读数（纯）。
 *
 * @param {object|null|undefined} chapterTexts 章号 → 正文（`{ 1: '…', 2: '…' }`）；
 *   `null`／`undefined`／缺章／某章不是字符串 ⇒ 这一章「读不到」。
 * @returns {{ known: boolean, total: number|null, missing: number[] }}
 */
export function measureBookHanzi({ chapterNumbers, chapterTexts } = {}) {
	const numbers = Array.isArray(chapterNumbers) ? chapterNumbers : [];
	if (numbers.length === 0) {
		// 空书（0 章）：没有可量的正文 ⇒ 读数不可用（⛔ 不是「0 汉字」）。
		return { known: false, total: null, missing: [] };
	}
	const missing = [];
	let total = 0;
	for (const n of numbers) {
		const text = chapterTexts === null || chapterTexts === undefined ? undefined : chapterTexts[n];
		if (typeof text !== "string") {
			missing.push(n);
			continue;
		}
		total += countHanzi(text);
	}
	if (missing.length > 0) return { known: false, total: null, missing };
	return { known: true, total, missing: [] };
}

/**
 * 合并件原文 → 知识点条数读数（纯）。
 *
 * 「按清单计」：数的是 `knowledgePoints[]` 的**条数原文**，不减去图上被划掉的
 * （spec §2.11 的括注；剔除法是覆盖闸门与确认卡那一族的事，不是这个读数）。
 *
 * @param {string|null|undefined} knowledgeMapText `工作区/knowledge-map.json` 的原文
 * @returns {{ known: boolean, count: number|null }}
 */
export function measureBookKnowledgePoints(knowledgeMapText) {
	const raw = parseKnowledgeMapRaw(knowledgeMapText);
	if (raw === null || !Array.isArray(raw.knowledgePoints)) return { known: false, count: null };
	return { known: true, count: raw.knowledgePoints.length };
}

/**
 * 书侧读数的**纯派生**（一张卡拿三个输入就能同步算出来）。
 *
 * @param {object} input
 * @param {object|null} [input.meta] 书级账本视图（章单取 `meta.outline.chapters`）
 * @param {string|null} [input.knowledgeMapText] 合并件原文
 * @param {object|null} [input.chapterTexts] 章号 → 正文；`null` ＝ 还没读到（⇒ 字数未知）
 * @returns {{ chapters: number|null, hanzi: {known: boolean, total: number|null, missing: number[]},
 *   knowledgePoints: {known: boolean, count: number|null} }}
 */
export function deriveBookReadings({ meta = null, knowledgeMapText = null, chapterTexts = null } = {}) {
	const chapterNumbers = bookChapterNumbers(meta);
	return {
		chapters: chapterNumbers === null ? null : chapterNumbers.length,
		hanzi: measureBookHanzi({ chapterNumbers, chapterTexts }),
		knowledgePoints: measureBookKnowledgePoints(knowledgeMapText),
	};
}

/**
 * 按章读正文（一章一份），读失败的章**不塞进结果**——`measureBookHanzi` 会把它记成
 * 「读不到」。读法是并行发出、`allSettled`：一章失败不牵连别的章。
 *
 * @param {object} input
 * @param {number[]} input.chapterNumbers 1..N 章号
 * @param {(rel: string) => Promise<string>} input.readText 产物读取（生产＝`fetchText`）
 * @returns {Promise<object>} 章号 → 正文（读到的章才有键）
 */
async function readChapterTexts({ chapterNumbers, readText }) {
	const settled = await Promise.allSettled(
		chapterNumbers.map((n) => Promise.resolve().then(() => readText(chapterRel(n)))),
	);
	const texts = {};
	settled.forEach((result, index) => {
		if (result.status !== "fulfilled" || typeof result.value !== "string") return;
		texts[chapterNumbers[index]] = result.value;
	});
	return texts;
}

/**
 * 书侧读数的**异步**入口：逐章读正文（`/textbook/file`）后调 {@link deriveBookReadings}。
 *
 * ⚠️ 本函数**不 reject**：读不到的章走「未知」那一档（那是读数的一部分，不是异常）。
 *
 * @param {object} input
 * @param {object|null} [input.meta]
 * @param {string|null} [input.knowledgeMapText]
 * @param {(rel: string) => Promise<string>} input.readText
 * @returns {Promise<object>} 同 {@link deriveBookReadings} 的读数对象
 */
export async function loadBookReadings({ meta = null, knowledgeMapText = null, readText } = {}) {
	const chapterNumbers = bookChapterNumbers(meta);
	if (chapterNumbers === null || typeof readText !== "function") {
		return deriveBookReadings({ meta, knowledgeMapText, chapterTexts: null });
	}
	const chapterTexts = await readChapterTexts({ chapterNumbers, readText });
	return deriveBookReadings({ meta, knowledgeMapText, chapterTexts });
}

/**
 * **交付卡 `DeliveryCard` 的唯一取数口**（React hook；票 17 · 收口 review F3 订正：
 * 今天唯一调用点是交付卡，终检卡按 spec §2.10 不消费书侧读数——见文件头那一段）。
 *
 * 首帧：能同步算的立刻算（知识点条数来自随 payload 下发的合并件原文），章稿还没读回来
 * ⇒ 字数停在「未知」。挂载 effect 里读一次章稿；读到就换成真读数。
 * 读法沿用 `gold-table.js` 的既有一档：`fetchText` 不加身份守卫（壳按书名 keyed、身份一变
 * 整棵重挂），本 hook 自己用一个 `alive` 标记挡住卸载后的 setState。
 *
 * @param {object} input
 * @param {object|null} [input.meta] 书级账本视图
 * @param {string|null} [input.knowledgeMapText] 合并件原文（随 `/textbook/events` 下发）
 * @param {(rel: string) => Promise<string>|null} [input.fetchText] 生产壳的产物读取；缺了就只出「未知」
 * @returns {object} 同 {@link deriveBookReadings} 的读数对象
 */
export function useBookReadings({ meta = null, knowledgeMapText = null, fetchText = null } = {}) {
	const chapterNumbers = bookChapterNumbers(meta);
	// 章单用**值**进依赖：meta 是每帧新对象，按引用依赖会让 effect 每帧重跑。
	const chaptersKey = chapterNumbers === null ? "" : chapterNumbers.join(",");
	const [chapterTexts, setChapterTexts] = useState(null);

	useEffect(() => {
		if (chapterNumbers === null || typeof fetchText !== "function") {
			setChapterTexts(null);
			return undefined;
		}
		let alive = true;
		readChapterTexts({ chapterNumbers, readText: fetchText }).then((texts) => {
			if (alive) setChapterTexts(texts);
		});
		return () => {
			alive = false;
		};
		// `chapterNumbers` 的身份每帧都变，按 `chaptersKey` 判「章单变了没有」。
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [chaptersKey, fetchText]);

	return useMemo(
		() => deriveBookReadings({ meta, knowledgeMapText, chapterTexts }),
		// meta 只贡献章数，已经由 `chaptersKey` 表达；`chapterTexts`／合并件原文一变就重算。
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[chaptersKey, knowledgeMapText, chapterTexts],
	);
}

// ── 格式（交付页那几句的唯一口径；⛔ 卡里不另写一份）────────────────────────────────

/**
 * 万位那一格的数值：`42000` → `'4.2'`，`40000` → `'4'`（交付页样例是「约 4.2 万汉字」）。
 *
 * 只有一万以上才走这一档；留一位小数、`.0` 不印——一万以下照实印整数（范例章那类几百字的
 * 读数不该被说成「0.2 万」）。
 */
function wanText(total) {
	const wan = total / 10000;
	return wan >= 100 ? String(Math.round(wan)) : wan.toFixed(1).replace(/\.0$/, "");
}

/**
 * 全书字数的屏上一句：`'约 4.2 万汉字'`／`'3960 汉字'`／`'字数未知'`。
 *
 * @param {{known: boolean, total: number|null}|null|undefined} reading `deriveBookReadings().hanzi`
 * @returns {string}
 */
export function hanziReadingText(reading) {
	if (!reading || reading.known !== true || !Number.isFinite(reading.total) || reading.total < 0) {
		return HANZI_READING_UNKNOWN;
	}
	const total = Math.round(reading.total);
	return total < 10000 ? `${total} 汉字` : `约 ${wanText(total)} 万汉字`;
}

/**
 * 全书知识点条数的屏上一句：`'48 条知识点（按清单计）'`／`'知识点数未知'`。
 *
 * @param {{known: boolean, count: number|null}|null|undefined} reading `deriveBookReadings().knowledgePoints`
 * @returns {string}
 */
export function knowledgePointsReadingText(reading) {
	if (!reading || reading.known !== true || !Number.isSafeInteger(reading.count) || reading.count < 0) {
		return KNOWLEDGE_POINTS_READING_UNKNOWN;
	}
	return `${reading.count} 条知识点（${BY_LIST_NOTE}）`;
}

/**
 * 交付页那句**事实句**（spec §2.11 逐字：`3 章 · 约 4.2 万汉字 · 48 条知识点（按清单计）。`）。
 *
 * 两个读数各自独立降级：字读不到就只那一格说「字数未知」，知识点照印；反之亦然。
 * ⚠️ 空书（没有章节安排 ⇒ `chapters === null`）**返回 `null`**——没有可说的读数，
 * 那一屏按空态处理（⛔ 不印「0 章 0 汉字」）。
 *
 * @param {object|null|undefined} readings {@link deriveBookReadings} 的返回
 * @returns {string|null}
 */
export function bookReadingsFactSentence(readings) {
	const chapters = readings?.chapters;
	if (!Number.isSafeInteger(chapters) || chapters <= 0) return null;
	return `${chapters} 章，${hanziReadingText(readings.hanzi)}，${knowledgePointsReadingText(readings.knowledgePoints)}。`;
}
