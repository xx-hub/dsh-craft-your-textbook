/**
 * 通用对象判据 · **零依赖叶子**（票 `quality-review-2026-10-29/07`）。
 *
 * 收编前这一行在仓里有 **7 份逐字相同**的抄件，散在 `src/workflow/` 的
 * `knowledge-map-landing.js`／`knowledge-map-gate.js`／`knowledge-map-merge.js`／
 * `knowledge-graph.js`／`knowledge-graph-chain.js`／`cross-audit-ledger.js`／`reader-boundary.js`。
 * 票面四项之二就是「收成一份」，判据见 `test/test-book-shape.mjs` 的
 * 「单点 · 对象判据 isPlainObject 只有一份定义」那一格（整片扫 `src/**` 的**定义**计数）。
 *
 * ⚠️ **为什么是独立叶子，而不是塞进 `domain-rules.js`**：那是「两侧都必须知道的**领域规则**」的
 * 面（前端 bundle 真的 import 它，头部写着「只放两侧都必须知道的规则」），一个通用对象判据不是
 * 领域规则；塞进去等于给共享面白加一格 interface。本文件与它**同目录**、零 import、零 node
 * 内置依赖——谁 import 它都不会把 I/O 或第三方拖进自己的依赖闭包。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**：同构但**不同名**的抄件今天仍在
 * （`src/ui/card-book-derive.js` 与 `src/workbench-projection.js` 的 `isRecord`，
 * 形态是 `const isRecord = (value) => …` 一行箭头函数）——它们**有意不在**本票射程，
 * 「单点」那一格也不按函数体文本计数（否则会把它们一起算进来）。要收编它们是另一张票的活。
 */

/**
 * 「纯对象」判据：非 `null`、`typeof === 'object'`、且不是数组。
 *
 * ⚠️ 它**不**判「原型是不是 `Object.prototype`」——`Object.create(null)` 与类实例都会返回 `true`。
 * 收编前那 7 份抄件逐字都是这一条口径，收编**只归一写处、不改口径**；要收紧成「原型必须恰好是
 * `Object.prototype`」是另一张票的事（那会改变既有判定的边界）。
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
