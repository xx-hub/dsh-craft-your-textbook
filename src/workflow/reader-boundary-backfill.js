/**
 * 老书维护通路（票 `reader-cognition-boundary-build/10`）：**补一份读者边界**的那笔独立账。
 *
 * ## 它是哪一件事
 *
 * 边界（下沿／上沿）在站 2 那张知识点图上定（划子递 `已经会`／框里那颗键递 `不需要`，
 * 落 `工作区/knowledge-map-exclusions.json` 那一份**同一份记录**）。本书跑过站 2 之后，
 * 那两张入口都回落（站 2 的卡只在书停在那一步时才在场）⇒ 票 `11`／spec §4.6 给老书开一条
 * **维护通路**：在阶段 2 那一屏再摆一颗「补一份读者边界」的键，人在图上逐卡划，补的是**同一份**
 * 剔除记录。
 *
 * ## 这笔账记什么（⛔ 它不是第二份事实源）
 *
 * 事实源仍是那份剔除记录（`reason` 两档闭集、`by` 只 `user`）＋ 合并件里的图。这笔账只记
 * **「这份边界是补的、从什么时候起生效」**——供界面印那句**独立**抬头记号
 * （与补图那句 `GRAPH_BACKFILL_NOTE` 不共用），⛔ 不复制任何一条裁决。
 *
 * 形状照 `meta.knowledgeGraphBackfill`（票 04 的先例）：
 * ```
 * meta.readerBoundaryBackfill = { at, by }                                  // 补过且生效中
 * meta.readerBoundaryBackfill = { at, by, withdrawnAt, withdrawnReason }   // 撤回之后（键不删）
 * ```
 * · `at` ＝ 最近一次「补」生效的毫秒时刻（再划一条会刷新它）；
 * · `by` ＝ `user`（卡是人划的、键是人按的；本族**没有**代笔——问卷那条路不在这张图上）；
 * · `withdrawnAt` 在场 ＝ **这份补的声明已经撤回**（当前生效集合空了）；键留着、⛔ 不删。
 *
 * ## 撤回的触发（⛔ 不是「只写一个字段、永远没人写」）
 *
 * **全部放回**触发：老书这条入口上把剔除记录还原成空 `items` 的那一刻（`graph-opinion` 的
 * `要讲` 那一跳），由 `applyReaderBoundaryBackfillAccount` 追加 `withdrawnAt`；再划一条
 * （`不讲`）⇒ 重新写成 `{ at, by }`（清掉撤回，重新生效）。**不是**第二个动作，也不另开一笔新账。
 *
 * ## ⚠️ 与补图那块「只读」注释是**两处不同轴**（⛔ 别合成一句）
 *
 * `src/ui/knowledge-graph-backfill.js` 文件头给「老书维护只读」的理由是「**在图上划掉一张卡
 * ＝改前置**，后置（已写的章、章节方案）全都得重做」。本票按票 `06` 的裁决读：这里加的是
 * **一条剔除记录**，⛔ 不改前置、⛔ 不改图、⛔ 不改闸门——它只让**还没跑**的工序（站 3／4／5
 * 的交办件与合并前跨章审计）少讲那些卡，**已写／已交付的章一个字没动**。
 * 两件事都真，但说的不是同一条轴：那边禁止的是「改图」，这边允许的是「补记录」。
 */

/**
 * 那笔独立账在 `meta` 上的键名——**登记单点**（写侧在动作层、读侧在界面都从这里取）。
 *
 * ⛔ **不是** `knowledgeGraphBackfill`（补图那笔账）；两件事的键、记号、撤回各是各的
 * （判据：`test-knowledge-graph-backfill.mjs` 的「边界是补的 ≠ 图是补的」那一节）。
 */
export const READER_BOUNDARY_BACKFILL_META_KEY = 'readerBoundaryBackfill'

/** 谁的意思：人。本族没有代笔（问卷那条路不在这张图上）。 */
export const READER_BOUNDARY_BACKFILL_BY_USER = 'user'

/** 撤回那一格的来由（人读；⛔ 不是第二档状态值）。 */
export const READER_BOUNDARY_BACKFILL_WITHDRAWN_REASON = '全部放回'

/**
 * `meta` 上那笔账（没有就是 `null`）。
 * @param {object|null|undefined} meta 书级 `meta`（`readMeta`／`/textbook/events` 回包里那一份）
 * @returns {{at: number, by: string, withdrawnAt?: number, withdrawnReason?: string}|null}
 */
export function readerBoundaryBackfillOf(meta) {
	const record = meta === null || typeof meta !== 'object'
		? null
		: meta[READER_BOUNDARY_BACKFILL_META_KEY]
	return record !== null && typeof record === 'object' && !Array.isArray(record) ? record : null
}

/**
 * 这份边界**是不是「补的」且此刻生效**（决定界面那个独立抬头记号摆不摆）。
 *
 * `withdrawnAt` 在场 ＝ 已撤回 ⇒ 不算补的（键留在盘上，⛔ 不删）。
 * @param {object|null|undefined} meta
 * @returns {boolean}
 */
export function readerBoundaryBackfillActive(meta) {
	const record = readerBoundaryBackfillOf(meta)
	return record !== null && (record.withdrawnAt === undefined || record.withdrawnAt === null)
}

/**
 * 那笔账的**唯一写侧**（由 `graph-opinion` 在老书那条入口上调用；⛔ 不 appendEvent——那份件
 * 自己带 `by`／`at`，本族同一口径）。
 *
 * @param {object} state 当场新读的 `meta`（`updateMeta` 的改法拿到的那一份）
 * @param {{now: number, added: boolean, recordEmpty: boolean}} input
 *   `added` ＝ 这一次是「划一条」（`不讲`）；`recordEmpty` ＝ 写完之后的剔除记录是不是空 `items`。
 * @returns {object|null} 写完之后那笔账（没写就是原来那份／`null`）
 */
export function applyReaderBoundaryBackfillAccount(state, { now, added, recordEmpty } = {}) {
	if (state === null || typeof state !== 'object') return null
	const previous = readerBoundaryBackfillOf(state)
	if (added === true) {
		// 划一条 ⇒ 这笔账在场且**清掉撤回**（再补一次＝重新生效；⛔ 不另开一笔新账）。
		state[READER_BOUNDARY_BACKFILL_META_KEY] = { at: now, by: READER_BOUNDARY_BACKFILL_BY_USER }
		return state[READER_BOUNDARY_BACKFILL_META_KEY]
	}
	// 全部放回 ⇒ 这份「补的」声明不再存在。**只有本来就有这笔账**才落撤回（⛔ 不凭空开账），
	// 也已经撤回过的就不再刷一次（撤回时刻是那一刻，不是每一次空写的时刻）。
	if (
		recordEmpty === true
		&& previous !== null
		&& (previous.withdrawnAt === undefined || previous.withdrawnAt === null)
	) {
		state[READER_BOUNDARY_BACKFILL_META_KEY] = {
			...previous,
			withdrawnAt: now,
			withdrawnReason: READER_BOUNDARY_BACKFILL_WITHDRAWN_REASON,
		}
		return state[READER_BOUNDARY_BACKFILL_META_KEY]
	}
	return previous
}
