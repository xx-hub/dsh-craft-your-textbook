/**
 * 动作族 → handler 的**注册表装配**（票 contract-actions/04）。
 *
 * 本 module 只做一件事：把 workflow 手里那张「族 → handler」的实现表，装配成
 * 「动作 → handler」的分发表，并当场验两边的闭包。它不含任何 handler 实现，
 * 也不把 payload / 授权 / 用户确认 / 账本 / 错误语义搬进来——那些仍归各动作族与 engine。
 *
 * 装配是**纯函数**（输入一张族表，输出一张动作表）：装配错了就在这里响着抛错，
 * 而不是等到某个动作在生产里回一个 400。「装配对不对」因此可被测试直接用坏数据验到
 * （`test-contract-action-catalog.mjs`），不必去改 `workflow.js` 的源码。
 */
import { listActionFamilies, listContractActions } from '../contract-actions.js'


/**
 * 装配动作分发表。两种装配错误都在这里直接失败（它们是**开发/构建错误**，
 * 不该伪装成某本书的一次用户可见 400）：
 *   · 目录里的某个族没有注册 handler —— 漏实现；
 *   · 注册了目录里没有的族        —— 悬空注册（没人会用到它）。
 *
 * @param {Map<string, Function>} handlerOfFamily 族 id → 该族的 handler
 * @returns {Map<string, Function>} 动作规范名 → handler
 */
export function buildActionFamilyTable(handlerOfFamily) {
  if (!(handlerOfFamily instanceof Map)) {
    throw new TypeError('动作族 handler 注册表必须是一张 Map')
  }
  const known = new Set(listActionFamilies())
  for (const family of handlerOfFamily.keys()) {
    if (!known.has(family)) {
      throw new Error(`handler 注册了契约面动作目录里没有的动作族: ${family}`)
    }
  }
  return new Map(listContractActions().map((action) => {
    const handler = handlerOfFamily.get(action.family)
    if (handler === undefined) {
      throw new Error(`动作族没有注册 handler: ${action.family}（动作 ${action.name}）`)
    }
    return [action.name, handler]
  }))
}
