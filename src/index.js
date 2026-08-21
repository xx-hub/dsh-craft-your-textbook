/**
 * 造书工作台 · node 半部入口
 *
 * roster 行（ui-textbook-run）以裸包名导入本模块；浏览器端另有 ./client 入口
 * （lib/client.js），由 dsh-client-modules 以 /plugins/dsh-craft-your-textbook/client.js 服务。
 */

export const name = 'textbook-bundle-node-half'

export function apply(ctx) {
  // node 半部无需业务逻辑：宿主能力在 ./workflow 与 ./mineru 两个子路径插件里。
  void ctx
}
