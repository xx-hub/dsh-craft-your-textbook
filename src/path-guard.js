/**
 * 路径越界守卫（跨平台）——术语见 CONTEXT.md。
 *
 * 判断 target 是否落在 root（含 root 本身）之内。用 path.relative 判定，
 * 分隔符无关：POSIX（/）与 Windows（\）都成立，且天然规避前缀陷阱
 * （/a/book 不是 /a/book2 的子路径）、驱动盘差异（C:\ 与 D:\ 判为界外）。
 *
 * ⚠️ 历史坑（2026-08-26 Linux/macOS 无法运行修复）：早期实现是
 * `target.startsWith(root + '\\')` 硬编码 Windows 反斜杠，Linux/macOS 上
 * 永远为假，导致全部 work 文件读写、预览、下载被误判「越界」而抛错/403。
 * 若日后要在此处再动分隔符逻辑，先看 test-path-guard.mjs 的 POSIX 用例。
 *
 * @param {string} root   基准目录（调用方应传 resolve() 后的绝对路径）
 * @param {string} target 待判定路径
 * @param {object} [p=path] 可注入的路径模块（测试用 path.posix 模拟 POSIX）
 */
import path from 'node:path'

export function isWithin(root, target, p = path) {
  const rel = p.relative(root, target)
  if (rel === '') return true // target 即 root
  if (p.isAbsolute(rel)) return false // 不同盘符/根，relative 给绝对路径
  return rel !== '..' && !rel.startsWith('..' + p.sep)
}
