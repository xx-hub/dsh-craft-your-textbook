/**
 * 造书工作台 · MinerU PDF→Markdown 转换工具（宿主侧）
 *
 * MinerU v4 在线 API 流程（与 dsh-craft-your-textbook scripts/01_pdf_to_md.py 一致，纯 Node 实现）：
 *  1. POST /api/v4/file-urls/batch 申请批量上传链接
 *  2. PUT 上传 PDF
 *  3. 轮询 GET /api/v4/extract-results/batch/{batch_id}
 *  4. 下载 zip 结果并解压（full.md + 图片）
 *
 * Token 读取：**不在这里**——真取 Token 的那条路只有 `mineru-lib.js` 的 `resolveMineruToken`
 * （读序 settings → env → credentials，票 `token-banner/01`）。本文件是占位插件，只保证插件行可加载。
 */

export const name = 'textbook-mineru'

export function apply(ctx) {
  ctx.logger.info('[textbook-mineru] MinerU 转换工具已加载（占位）')
}
