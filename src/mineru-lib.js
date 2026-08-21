/**
 * MinerU PDF→Markdown 在线 API 客户端（纯 Node，免 Python）。
 *
 * 流程（MinerU v4，与 dsh-craft-your-textbook scripts/01_pdf_to_md.py 一致）：
 *  1. POST /api/v4/file-urls/batch  申请批量上传链接（含转换参数）
 *  2. PUT  上传 PDF 到签名 URL
 *  3. 轮询 GET /api/v4/extract-results/batch/{batch_id}
 *  4. 下载结果 zip → 解压 → 写 outDir/full.md
 *
 * Token 读取顺序：MINERU_TOKEN 环境变量 → $DSH_HOME/textbook/settings.json 的
 * mineruToken 字段 → $DSH_HOME/.credentials.yaml 中 mineru_token 键（简易扫描）。
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, basename } from 'node:path'
import AdmZip from 'adm-zip'

const API_BASE = 'https://mineru.net'

/** MinerU 精准解析 API 单份文件页数上限（官方文档：≤200 页）。 */
export const MINERU_MAX_PAGES = 200

/**
 * 本地轻量页数探测（不依赖第三方 PDF 库）。
 * PDF 的 Pages 树里根节点通常最先出现且带 /Count N（全书总页数）；
 * 先读开头 4MB 找首个 /Count；找不到再全量数 /Type /Page 叶子对象
 * （注意用 [^s] 排除 /Type /Pages 这类树节点）。探测失败返回 null
 * （调用方按"不需要拆分"处理）。
 */
export function countPdfPages(pdfPath) {
  let bytes
  try {
    bytes = readFileSync(pdfPath)
  } catch {
    return null
  }
  const head = bytes.subarray(0, 4 * 1024 * 1024).toString('latin1')
  const countMatch = /\/Count\s+(\d+)/.exec(head)
  if (countMatch !== null) {
    const n = Number(countMatch[1])
    if (Number.isFinite(n) && n >= 1) return n
  }
  const pageLeaves = (bytes.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length
  return pageLeaves >= 1 ? pageLeaves : null
}

/** 把 1..pageCount 切成每段 ≤ chunkSize 页的连续区间（从第 1 页起）。 */
export function planPageChunks(pageCount, chunkSize = MINERU_MAX_PAGES) {
  const chunks = []
  for (let from = 1; from <= pageCount; from += chunkSize) {
    chunks.push({ from, to: Math.min(from + chunkSize - 1, pageCount) })
  }
  return chunks
}

/** 把 MinerU 英文/错误码报错归一成人话（页数超限 / Token 失效 / 其他原样）。 */
export function humanizeMineruError(raw) {
  const msg = String(raw ?? '').trim()
  if (/exceeds limit|page count exceeds|页数超过限制|文件页数超过限制|-60006|-30003/i.test(msg)) {
    return '这份 PDF 超过 MinerU 单份 200 页上限；若自动拆页解析未生效，请把 PDF 拆成几份（每份 <200 页）后分别上传，或换一本更薄的书。'
  }
  if (/A0202|A0211|401|403|unauthor|token 错误|token 过期/i.test(msg)) {
    return 'MinerU Token 可能失效或未配置：可到工作台「MinerU Token」处点「重新设置」换新 Token 后重试。'
  }
  return msg
}

/** 把同一本书拆出的多个分段 full.md 按页序合并成一份（图片引用改写为各段子目录）。 */
export function mergeSplitParts(parts) {
  const sorted = [...parts].sort((a, b) => a.idx - b.idx)
  const blocks = []
  for (const part of sorted) {
    let text = readFileSync(part.mdPath, 'utf8')
    const prefix = basename(part.outDir) // 段子目录名（如 _c1）
    if (prefix !== '') text = text.replace(/\]\(\s*images\//g, `](${prefix}/images/`)
    blocks.push(text.trim())
  }
  return blocks.join('\n\n')
}

/** 读设置文件（$DSH_HOME/textbook/settings.json），不存在返回 {}。 */
export function readSettings() {
  const path = join(resolveHome(), 'textbook', 'settings.json')
  if (!existsSync(path)) return {}
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return {}
  }
}

/** 写设置文件（$DSH_HOME/textbook/settings.json）。 */
export function writeSettings(settings) {
  const dir = join(resolveHome(), 'textbook')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'settings.json'), JSON.stringify(settings, null, 2) + '\n')
}

function resolveHome() {
  const fromEnv = process.env.DSH_HOME
  if (fromEnv !== undefined && fromEnv.trim() !== '') return fromEnv
  return join(homedir(), '.dsh')
}

/** 简易扫描 .credentials.yaml 里的 `mineru_token:` 值（引号可选）。 */
function scanCredentialsYaml() {
  const path = join(resolveHome(), '.credentials.yaml')
  if (!existsSync(path)) return undefined
  try {
    const text = readFileSync(path, 'utf8')
    const match = /^\s*mineru_token\s*:\s*["']?([^"'\s#]+)/m.exec(text)
    return match === null ? undefined : match[1]
  } catch {
    return undefined
  }
}

/** 解析 MinerU token；无 token 抛错（含配置引导文案）。 */
export function resolveMineruToken() {
  const fromEnv = process.env.MINERU_TOKEN
  if (fromEnv !== undefined && fromEnv.trim() !== '') return fromEnv.trim()
  const fromSettings = readSettings().mineruToken
  if (typeof fromSettings === 'string' && fromSettings.trim() !== '') return fromSettings.trim()
  const fromCredentials = scanCredentialsYaml()
  if (fromCredentials !== undefined && fromCredentials !== '') return fromCredentials
  throw new Error('未配置 MinerU Token：请在设置里填写（设置页 → 造书工作台 → MinerU Token），或设置环境变量 MINERU_TOKEN')
}

function headers(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function fetchJson(url, options) {
  const res = await fetch(url, options)
  let json = null
  try { json = await res.json() } catch { json = null }
  if (!res.ok) {
    throw new Error(`MinerU HTTP ${res.status}: ${json !== null ? JSON.stringify(json).slice(0, 200) : res.statusText}`)
  }
  return json
}

/**
 * 批量转换多份 PDF（MinerU v4 批量接口）。
 * 一次申请全部上传链接 → 逐个 PUT → 批量轮询（响应带 file_name，可一一对应）
 * → 每份结果解压到各自 outDir（消除单文件版 full.md 互相覆盖的问题），
 * 且多文件并行解析，比逐本串行快得多。
 *
 * 超 200 页的书自动拆段：同一份 PDF 按 page_ranges（每段 ≤200 页）提交多份，
 * 各段 full.md 按页序合并成父书一份完整 md（合并结果带 splitParts 字段）。
 *
 * @param items [{ file, name, outDir }] file=本地路径，name=提交名（与源文件名一致），outDir=结果目录
 * @param opts  { formula?, table?, language? }
 * @param onStage (stage: string) => void
 * @returns [{ name, ok, mdPath?, error?, splitParts? }] 单本失败不抛（调用方决定重试范围）；申请/上传/轮询整体失败抛错。
 */
export async function convertPdfBatch(items, opts = {}, onStage = () => {}) {
  const token = resolveMineruToken()
  const formula = opts.formula === true
  const table = opts.table !== false
  const language = opts.language ?? 'ch'
  const results = []
  const mergeTable = new Map() // 拆分书的分段暂存表（key=原文件名）
  const failedParents = new Set() // 已报过失败的拆分书，避免重复错误行

  // 预展开：>200 页的 PDF 拆成多个 page_ranges 分段（同一份文件上传多份，每份只解析一段页），
  // 解析完再把各段 full.md 按页序合并成一份完整 md——下游源探查看到的仍是一本连续的书。
  const expanded = []
  for (const item of items) {
    const pageCount = countPdfPages(item.file)
    if (pageCount !== null && pageCount > MINERU_MAX_PAGES) {
      const chunks = planPageChunks(pageCount)
      const base = String(item.name ?? '').replace(/\.pdf$/i, '') || 'book'
      chunks.forEach((chunk, idx) => {
        expanded.push({
          ...item,
          name: `${base}.p${idx + 1}.pdf`,
          pageRanges: `${chunk.from}-${chunk.to}`,
          outDir: join(item.outDir, `_c${idx + 1}`),
          _split: { idx: idx + 1, total: chunks.length, parentOutDir: item.outDir, parentName: item.name },
        })
      })
      onStage(`《${item.name}》共 ${pageCount} 页，超过 200 页：已拆成 ${chunks.length} 份解析（每份 ≤200 页，完成后自动合并）`)
    } else {
      expanded.push({ ...item })
    }
  }

  // MinerU 单批申请上限 50 个；超出分多批串行处理。
  const batchSize = 50
  for (let start = 0; start < expanded.length; start += batchSize) {
    const batch = expanded.slice(start, start + batchSize)
    onStage(`申请上传通道（${start + 1}-${start + batch.length}/${expanded.length} 份）`)
    const applied = await fetchJson(`${API_BASE}/api/v4/file-urls/batch`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({
        files: batch.map((item) => {
          const entry = { name: item.name, data_id: 'book-src' }
          if (typeof item.pageRanges === 'string' && item.pageRanges !== '') entry.page_ranges = item.pageRanges
          return entry
        }),
        model_version: 'vlm',
        enable_formula: formula,
        enable_table: table,
        language,
      }),
      signal: AbortSignal.timeout(60_000),
    })
    if (applied.code !== 0 || applied.data === undefined) {
      throw new Error(`申请上传失败: ${JSON.stringify(applied).slice(0, 200)}`)
    }
    const batchId = applied.data.batch_id
    const urls = applied.data.file_urls ?? []
    if (!Array.isArray(urls) || urls.length !== batch.length) {
      throw new Error(`申请上传链接数量不符（${urls.length}/${batch.length}）`)
    }
    for (let i = 0; i < batch.length; i += 1) {
      onStage(`上传 PDF（${start + i + 1}/${expanded.length} 份）`)
      const first = urls[i]
      const uploadUrl = typeof first === 'string' ? first : first?.url
      if (uploadUrl === undefined) throw new Error('申请上传失败：没有返回上传地址')
      const pdfBytes = readFileSync(batch[i].file)
      const put = await fetch(uploadUrl, { method: 'PUT', body: pdfBytes, signal: AbortSignal.timeout(300_000) })
      if (!put.ok) throw new Error(`上传 ${batch[i].name} 失败: HTTP ${put.status}`)
    }

    // 批量轮询，直到全部完成或出现失败。
    let polled = null
    let done = false
    for (let attempt = 0; attempt < 240; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 5000))
      polled = await fetchJson(`${API_BASE}/api/v4/extract-results/batch/${batchId}`, {
        headers: headers(token),
        signal: AbortSignal.timeout(60_000),
      })
      const entries = polled.data?.extract_result ?? polled.data?.batch ?? []
      const list = Array.isArray(entries) ? entries : []
      const failed = list.find((entry) => entry?.state === 'failed')
      if (failed !== undefined) {
        throw new Error(`MinerU 转换失败（${failed.file_name ?? '?'}）: ${humanizeMineruError(failed.err_msg)}`)
      }
      const doneCount = list.filter((entry) => entry?.state === 'done').length
      if (doneCount === batch.length) { done = true; break }
      onStage(`转换中（${doneCount}/${batch.length} 份完成）`)
    }
    if (!done) throw new Error('MinerU 转换超时（20 分钟）')

    // 下载解压：按 file_name 一一对应到各自子目录。
    const entries = polled.data?.extract_result ?? polled.data?.batch ?? []
    const byName = new Map()
    for (const entry of Array.isArray(entries) ? entries : []) {
      if (typeof entry?.file_name === 'string') byName.set(entry.file_name, entry)
    }
    for (const item of batch) {
      const parentKey = item._split !== undefined ? item._split.parentName : item.name
      const entry = byName.get(item.name)
      if (entry === undefined) {
        if (!failedParents.has(parentKey)) {
          failedParents.add(parentKey)
          results.push({ name: parentKey, ok: false, error: `结果缺少 ${item.name}` })
        }
        continue
      }
      const fileUrl = typeof entry.full_zip_url === 'string' ? entry.full_zip_url
        : typeof entry.file_url === 'string' ? entry.file_url : entry.url
      if (fileUrl === undefined) {
        if (!failedParents.has(parentKey)) {
          failedParents.add(parentKey)
          results.push({ name: parentKey, ok: false, error: '转换完成但没有结果文件' })
        }
        continue
      }
      try {
        onStage(`下载结果（${item.name}）`)
        const zipRes = await fetch(fileUrl, { signal: AbortSignal.timeout(300_000) })
        if (!zipRes.ok) throw new Error(`下载结果失败: HTTP ${zipRes.status}`)
        const zipBytes = Buffer.from(await zipRes.arrayBuffer())
        onStage(`解压整理（${item.name}）`)
        mkdirSync(item.outDir, { recursive: true })
        const zip = new AdmZip(zipBytes)
        let fullMd = null
        for (const zipEntry of zip.getEntries()) {
          if (zipEntry.entryName.endsWith('full.md')) fullMd = zipEntry.getData()
          if (!zipEntry.isDirectory && !zipEntry.entryName.endsWith('/')) {
            const target = join(item.outDir, zipEntry.entryName)
            if (target.startsWith(item.outDir + '\\') || target.startsWith(item.outDir + '/')) {
              mkdirSync(join(target, '..'), { recursive: true })
              writeFileSync(target, zipEntry.getData())
            }
          }
        }
        if (fullMd === null) throw new Error('结果 zip 中没有 full.md')
        writeFileSync(join(item.outDir, 'full.md'), fullMd)
        if (item._split !== undefined) {
          // 分段结果暂存，全部批次完成后按页序合并成父书。
          let acc = mergeTable.get(parentKey)
          if (acc === undefined) {
            acc = { name: parentKey, ok: true, parts: [], parentOutDir: item._split.parentOutDir, total: item._split.total }
            mergeTable.set(parentKey, acc)
          }
          acc.parts.push({ idx: item._split.idx, mdPath: join(item.outDir, 'full.md'), outDir: item.outDir })
        } else {
          results.push({ name: item.name, ok: true, mdPath: join(item.outDir, 'full.md') })
        }
      } catch (error) {
        if (!failedParents.has(parentKey)) {
          failedParents.add(parentKey)
          results.push({ name: parentKey, ok: false, error: String(error instanceof Error ? error.message : error) })
        }
      }
    }
  }

  // 合并拆分书的分段结果（按页序），写回父目录 full.md。
  for (const acc of mergeTable.values()) {
    if (acc.parts.length === 0 || acc.parts.length !== acc.total) {
      results.push({ name: acc.name, ok: false, error: `《${acc.name}》分段解析未完成` })
      continue
    }
    const merged = mergeSplitParts(acc.parts)
    const mdPath = join(acc.parentOutDir, 'full.md')
    mkdirSync(acc.parentOutDir, { recursive: true })
    writeFileSync(mdPath, `<!-- 本书超过 200 页，已自动拆成 ${acc.total} 段解析后合并 -->\n\n${merged}\n`)
    results.push({ name: acc.name, ok: true, mdPath, splitParts: acc.total })
  }
  onStage('完成')
  return results
}

/**
 * 转换一份 PDF → outDir/full.md（含图片目录），全程回调进度 stage。
 * @param pdfPath  PDF 绝对路径
 * @param outDir   输出目录（自动创建）
 * @param opts     { formula?: boolean, table?: boolean, language?: string }
 * @param onStage  (stage: string) => void  进度回调
 * @returns full.md 绝对路径
 */
export async function convertPdf(pdfPath, outDir, opts = {}, onStage = () => {}) {
  const token = resolveMineruToken()
  const fileName = basename(pdfPath)
  const formula = opts.formula === true
  const table = opts.table !== false
  const language = opts.language ?? 'ch'

  onStage('申请上传通道')
  const applied = await fetchJson(`${API_BASE}/api/v4/file-urls/batch`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      files: [{ name: fileName, data_id: 'book-src' }],
      model_version: 'vlm',
      enable_formula: formula,
      enable_table: table,
      language,
    }),
    signal: AbortSignal.timeout(60_000),
  })
  if (applied.code !== 0 || applied.data === undefined) {
    throw new Error(`申请上传失败: ${JSON.stringify(applied).slice(0, 200)}`)
  }
  const batchId = applied.data.batch_id
  // file_urls 是字符串数组（直接是 URL）；兼容个别版本的对象数组。
  const firstUrl = applied.data.file_urls?.[0]
  const uploadUrl = typeof firstUrl === 'string' ? firstUrl : firstUrl?.url
  if (uploadUrl === undefined) throw new Error('申请上传失败：没有返回上传地址')

  onStage('上传 PDF')
  const pdfBytes = readFileSync(pdfPath)
  const put = await fetch(uploadUrl, { method: 'PUT', body: pdfBytes, signal: AbortSignal.timeout(300_000) })
  if (!put.ok) throw new Error(`上传 PDF 失败: HTTP ${put.status}`)

  onStage('等待转换')
  let result = null
  for (let attempt = 0; attempt < 240; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    const polled = await fetchJson(`${API_BASE}/api/v4/extract-results/batch/${batchId}`, {
      headers: headers(token),
      signal: AbortSignal.timeout(60_000),
    })
    // 兼容 v4 的 extract_result 与旧版 batch 两种响应结构。
    const entries = polled.data?.extract_result ?? polled.data?.batch ?? []
    const entry = Array.isArray(entries) ? entries[0] : undefined
    const state = typeof entry === 'object' && entry !== null ? entry.state : undefined
    if (state === undefined && attempt >= 3) {
      // 轮询结构对不上：别傻等 20 分钟，直接报错并带原始响应。
      throw new Error(`MinerU 轮询响应结构异常: ${JSON.stringify(polled).slice(0, 300)}`)
    }
    if (state === 'done') { result = polled; break }
    if (state === 'failed') {
      const errMsg = typeof entry?.err_msg === 'string' && entry.err_msg !== '' ? entry.err_msg : JSON.stringify(polled.data)
      throw new Error(`MinerU 转换失败: ${String(errMsg).slice(0, 200)}`)
    }
    if (attempt % 6 === 0) onStage(`转换中（${Math.round((attempt * 5) / 60)} 分钟）`)
  }
  if (result === null) throw new Error('MinerU 转换超时（20 分钟）')

  onStage('下载结果')
  const doneEntries = result.data?.extract_result ?? result.data?.batch ?? []
  const doneEntry = Array.isArray(doneEntries) ? doneEntries[0] : undefined
  const fileUrl = typeof doneEntry === 'object' && doneEntry !== null
    ? (typeof doneEntry.full_zip_url === 'string' ? doneEntry.full_zip_url
        : typeof doneEntry.file_url === 'string' ? doneEntry.file_url
          : doneEntry.url)
    : undefined
  if (fileUrl === undefined) throw new Error('转换完成但没有结果文件')
  const zipRes = await fetch(fileUrl, { signal: AbortSignal.timeout(300_000) })
  if (!zipRes.ok) throw new Error(`下载结果失败: HTTP ${zipRes.status}`)
  const zipBytes = Buffer.from(await zipRes.arrayBuffer())

  onStage('解压整理')
  mkdirSync(outDir, { recursive: true })
  const zip = new AdmZip(zipBytes)
  let fullMd = null
  for (const entry of zip.getEntries()) {
    if (entry.entryName.endsWith('full.md')) fullMd = entry.getData()
    if (!entry.isDirectory && !entry.entryName.endsWith('/')) {
      // 图片等资源展开到 outDir，保持 zip 内相对路径。
      const target = join(outDir, entry.entryName)
      if (target.startsWith(outDir + '\\') || target.startsWith(outDir + '/')) {
        mkdirSync(join(target, '..'), { recursive: true })
        writeFileSync(target, entry.getData())
      }
    }
  }
  if (fullMd === null) throw new Error('结果 zip 中没有 full.md')
  const mdPath = join(outDir, 'full.md')
  writeFileSync(mdPath, fullMd)
  onStage('完成')
  return mdPath
}
