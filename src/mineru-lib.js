/**
 * MinerU PDF→Markdown 在线 API 客户端（纯 Node，免 Python）。
 *
 * 流程（MinerU v4，与 dsh-craft-your-textbook scripts/01_pdf_to_md.py 一致）：
 *  1. POST /api/v4/file-urls/batch  申请批量上传链接（含转换参数）
 *  2. PUT  上传 PDF 到签名 URL
 *  3. 轮询 GET /api/v4/extract-results/batch/{batch_id}
 *  4. 下载结果 zip → 解压 → 写 outDir/full.md
 *
 * Token 读取顺序（票 `token-banner/01` 的用户裁决 D③=A）：$DSH_HOME/textbook/settings.json 的
 * mineruToken 字段（用户在界面里显式保存的，优先） → MINERU_TOKEN 环境变量（宿主注入，兜底） →
 * $DSH_HOME/.credentials.yaml 中 mineru_token 键（历史第三通道，简易扫描）。
 *
 * ⚠️ **读序只有一份**：`findMineruToken()` 既是真正取 Token 的那条路，也是
 * `mineruTokenStatus()`（`/textbook/settings` 与保存回包的判据）的来源。横幅与转换必须看同一份
 * 事实——票前它们各读一路（横幅只看 settings、转换还认 env），于是「env 配好了」的用户成功
 * 转换后还常驻「还差一步」的假警报。
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, mkdtempSync, rmSync, chmodSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join, basename } from 'node:path'
import { execFile as execFileCb } from 'node:child_process'
import { promisify } from 'node:util'
import { isWithin } from './path-guard.js'
import { MINERU_KNOWN_EXTENSIONS, MINERU_MAX_BYTES, isAutoSplittableMaterial } from './domain-rules.js'
import AdmZip from 'adm-zip'

const execFileAsync = promisify(execFileCb)

/**
 * ── 本文件对外的形状（票 `deep-module-scan/21`，票 `token-banner/01` 补一枚）──
 *
 * package 侧只 import **九枚**符号：真正干活的那个 `convertPdfBatch`，加 `readSettings` /
 * `writeSettings`、`stripKnownExtension`、`autoSplitAvailable`、`humanizeMineruError`
 * （它**唯一**一个「测试 import、生产零消费者」却仍然导出的，理由在它自己的 JSDoc里），
 * `mineruTokenStatus`（**唯一**的 Token 判据：`/textbook/settings` 与保存回包都从它取，
 * ⛔ 别在别处重拼一遍 settings/env 的读序——那正是票 `token-banner/01` 的病），
 * 再加两份**原样再导出**的单一真相源（`MINERU_MAX_BYTES` / `MINERU_KNOWN_EXTENSIONS`
 * ——那两份有测试专门钉着，撤掉就毁掉了「只有一份真相」这道防漂移）。
 *
 * 下面这些**一律不导出**：`MINERU_MAX_PAGES`、`countPdfPages`、`planPageChunks`、
 * `planSizeChunks`、`splitPdfBySize`、`mergeSplitParts`、`isEmptyConvertedMd`、
 * `resolveMineruToken`、`findMineruToken`、`maskMineruToken`。它们过去挂着 `export` 只是为了让测试能直接断中间算式，
 * 而生产侧**一个消费者也没有**——那份宽度是白付的：分段算法改一次，那批断言就得跟着改一次，
 * caller 唯一能观察到的（提交给 MinerU 的 `files[]` 与 `page_ranges`）却一条没变。
 *
 * 它们的行为现在**从 `convertPdfBatch` 提交的那条 HTTP 体上断**
 * （`test-mineru-split.mjs` 的「哪些文件会被拆段」与「full.md 零内容判失败」两格），
 * 也就是 interface 真正所在的那一层。
 *
 * ⇒ **别再为了让某条测试穿过去而把 `export` 加回来。** 那条测试要么改写到 interface 上，
 * 要么它断的根本不是 caller 能观察到的行为。
 */

const API_BASE = 'https://mineru.net'

/** MinerU 精准解析 API 单份文件页数上限（官方文档：≤200 页，超页服务端 auto_split）。 */
const MINERU_MAX_PAGES = 200

/**
 * MinerU 云端单份文件大小上限（官方限制项表 ＋ `-60005`）——**单一真相源在 `src/domain-rules.js`**，
 * 这里原样再导出（拆段那条链路的默认值取的就是它）。
 *
 * ⚠️ 票 10 把它从本文件搬去 domain-rules：上传前那道**格式感知**的预检长在浏览器里
 * （`src/ui/event-cards.js` 的 UploadArea），住这里前端就永远拿不到，只能自己抄一个 200 ——
 * 而「自己抄的那份」与「真的那一份」迟早分叉（用户按抄错的那条被拦/放行）。
 * 理由与 `MINERU_KNOWN_EXTENSIONS` 那次搬家逐字同源，详见 `src/domain-rules.js` 那一节。
 */
export { MINERU_MAX_BYTES }

/**
 * MinerU 云端认识的扩展名 —— **单一真相源在 `src/domain-rules.js`**，这里原样再导出。
 *
 * ⚠️ 票 07 把它从本文件搬去 domain-rules：那份表**两侧都要知道**（前端由它判 accept 归属、
 * 服务端由它判受理），而本文件只被 Node 侧 import、`domain-rules.js` 被 esbuild 打进前端
 * bundle——住这里，前端就拿不到「同源」这件事，只能各抄一份（那正是票 07 要治的病）。
 * 它的定义、来源与「已知 ≠ 受理白名单」的告诫，逐字在 `src/domain-rules.js` 那一节。
 */
export { MINERU_KNOWN_EXTENSIONS }

const KNOWN_EXTENSION_RE = new RegExp(`\\.(?:${MINERU_KNOWN_EXTENSIONS.join('|')})$`, 'i')
/** 剥掉末尾的**已知**扩展名；不在名单里的后缀原样留着（`讲义.txt` → `讲义.txt`，`讲义` → `讲义`）。 */
export function stripKnownExtension(name) {
  return String(name ?? '').replace(KNOWN_EXTENSION_RE, '')
}

/** 是不是 .pdf —— **只看后缀**，与 MinerU 的类型判定同构（契约快照 §9：不看 MIME、不做内容嗅探）。 */
function isPdfPath(p) {
  return /\.pdf$/i.test(String(p ?? ''))
}

/**
 * 分段提交名：`${剥掉已知扩展名}.p${idx + 1}.pdf`（`idx` 是 0 基的段序）。
 *
 * ⚠️ 票 05 第 3 项：**显式 gate 住**这一行，不是「反正非 PDF 进不来所以碰巧不触发」。
 * 原来的 `name.replace(/\.pdf$/i,'')` 只认 `.pdf`：一份 docx 走到这里会得到
 * `讲义.docx.p1.pdf`——**谎报后缀**，而 MinerU 的类型判定恰恰按后缀判（契约快照 §9）。
 * 剥的是**已知**扩展名（§8 那份名单），所以即便日后闸门放开，也不会出现 `.p1.pdf` 骑在
 * 一个没剥干净的名字后面。
 *
 * 非 PDF 直接抛错而不是悄悄编一个名字：这一格是 `page_ranges` / 物理切分两条路的**共同出口**，
 * 走到这里说明上游那道 gate 漏了——那时正确的反应是响亮地坏掉，而不是发一份名字说 pdf、
 * 内容不是 pdf 的文件上去（那正是本票要堵的静默错误）。
 */
function splitPartName(name, idx) {
  if (!isPdfPath(name)) {
    throw new Error(`分段提交名只对 PDF 有意义，收到非 PDF：${String(name)}（page_ranges 只认上传文件的后缀，见 docs/reference/mineru-api-contracts.md §6）`)
  }
  const base = stripKnownExtension(name) || 'book'
  return `${base}.p${idx + 1}.pdf`
}

/**
 * 本地轻量页数探测（不依赖第三方 PDF 库）。
 * PDF 的 Pages 树里根节点通常最先出现且带 /Count N（全书总页数）；
 * 先读开头 4MB 找首个 /Count；找不到再全量数 /Type /Page 叶子对象
 * （注意用 [^s] 排除 /Type /Pages 这类树节点）。探测失败返回 null
 * （调用方按"不需要拆分"处理）。
 *
 * ⚠️ 票 05：先自检扩展名再读文件（本函数把**整个文件**转 latin1 正则找 `/Count N`，
 * 而 .docx 是 ZIP、.png 是二进制——**两者都可能偶然含那串字节**）。误命中会算出一个看着很真的
 * 页数，调用方据此给非 PDF 提交带 `page_ranges` 的请求；而 `page_ranges` 官方只认**上传文件的
 * 后缀**（契约快照 §6），最坏是**静默只解析前 N 页**。这里返回 null（调用方按"不拆"处理），
 * 与调用方那道 gate 构成双保险。
 */
function countPdfPages(pdfPath) {
  if (!isPdfPath(pdfPath)) return null
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
function planPageChunks(pageCount, chunkSize = MINERU_MAX_PAGES) {
  const chunks = []
  for (let from = 1; from <= pageCount; from += chunkSize) {
    chunks.push({ from, to: Math.min(from + chunkSize - 1, pageCount) })
  }
  return chunks
}

/** 按大小规划切分段数：已知总字节与页数，估算每段页数使每段 < maxBytes 且 ≤ maxPages。
 *  纯函数（可单测）；返回 [{ from, to }] 连续页区间，或 null（无需按大小切）。
 *  预留 0.9 安全系数：页大小有波动，目标每段 ≈90% maxBytes，避免某段恰好超限被 -60005 拒收。 */
function planSizeChunks(pageCount, bytesPerPage, maxBytes = MINERU_MAX_BYTES, maxPages = MINERU_MAX_PAGES) {
  if (!Number.isFinite(pageCount) || pageCount < 2) return null
  if (!Number.isFinite(bytesPerPage) || bytesPerPage <= 0) return null
  if (bytesPerPage * pageCount <= maxBytes) return null // 总量不超限
  const partBytes = maxBytes * 0.9
  let partPages = Math.floor(partBytes / bytesPerPage)
  if (partPages < 1) partPages = 1
  if (partPages > maxPages) partPages = maxPages
  const chunks = []
  for (let from = 1; from <= pageCount; from += partPages) {
    chunks.push({ from, to: Math.min(from + partPages - 1, pageCount) })
  }
  return chunks
}

/** 探测可用的 Python + PyMuPDF（惰性缓存；不可用返回 null）。 */
let _pythonWithFitz = null
function pythonWithFitz() {
  if (_pythonWithFitz === null) {
    _pythonWithFitz = (async () => {
      for (const cand of ['python', 'python3']) {
        try {
          await execFileAsync(cand, ['-c', 'import fitz'], { timeout: 15_000 })
          return cand
        } catch { /* 试下一个 */ }
      }
      return null
    })()
  }
  return _pythonWithFitz
}

function cleanupTmpDir(dir) {
  try { rmSync(dir, { recursive: true, force: true }) } catch { /* 忽略 */ }
}

/**
 * 本机**真探到**了自动切分能力吗（Python + PyMuPDF）——票 10 那句「会自动拆」的**唯一**依据。
 *
 * ⚠️ 探针**可注入**（默认那份是真的 `pythonWithFitz`）：把「探到没有」与「说了什么」拆开，
 * 好让上传前那道预检的判据能在**不 spawn 任何进程**的自动化里被验（跑一次 `python -c "import fitz"`
 * 是这台机器的事实，桩出来的 true 证明不了真机上那一句不撒谎——那一条留给人工边界）。
 *
 * ⚠️ `pythonWithFitz` 是**惰性缓存**的：本进程里第一次问过就定下答案（null 也是答案），
 * 装了/卸了 PyMuPDF 之后要重开宿主才作数。界面上那一句因此是**开机快照**口径，不是实时体检。
 *
 * @param {() => Promise<string|null>} [probe] 返回可用的解释器名（不可用返回 null）
 * @returns {Promise<boolean>}
 */
export async function autoSplitAvailable(probe = pythonWithFitz) {
  try {
    return (await probe()) !== null
  } catch {
    // 探针自己抛了＝探不到。按「不许承诺」那一档走。
    return false
  }
}

/**
 * 尝试用 Python(PyMuPDF) 把 >maxBytes 的 PDF 物理切成 <maxBytes 的分段。
 * MinerU 的 -60005 是「文件 >200MB 拒收」，page_ranges 只按页解析、救不了上传大小，
 * 必须真的切出小文件。任何一步不可用/失败都返回 null（调用方按不拆处理，交由
 * MinerU 报 -60005 并给人话指引）。
 * @returns { parts: string[], ranges: [{from,to}], tmpDir } | null
 */
async function splitPdfBySize(pdfPath, pageCount, maxBytes = MINERU_MAX_BYTES) {
  let size
  try { size = statSync(pdfPath).size } catch { return null }
  const ranges = planSizeChunks(pageCount, size / pageCount, maxBytes)
  if (ranges === null) return null
  const python = await pythonWithFitz()
  if (python === null) return null
  const tmpDir = mkdtempSync(join(tmpdir(), 'tb-mineru-size-'))
  try {
    const script = [
      'import fitz,sys,os',
      'src,outdir=sys.argv[1],sys.argv[2]',
      'doc=fitz.open(src)',
      'for r in sys.argv[3:]:',
      ' a,b=(int(x) for x in r.split("-"))',
      ' out=fitz.open()',
      ' out.insert_pdf(doc,from_page=a-1,to_page=b-1)',
      ' out.save(os.path.join(outdir,"part_%d_%d.pdf"%(a,b)))',
    ].join('\n')
    await execFileAsync(python, ['-c', script, pdfPath, tmpDir, ...ranges.map((r) => `${r.from}-${r.to}`)], { timeout: 600_000 })
    const parts = []
    for (const r of ranges) {
      const file = join(tmpDir, `part_${r.from}_${r.to}.pdf`)
      if (!existsSync(file)) { cleanupTmpDir(tmpDir); return null }
      parts.push(file)
    }
    return { parts, ranges, tmpDir }
  } catch {
    cleanupTmpDir(tmpDir)
    return null
  }
}

/** 认证类失败的人话（界面那句「重新设置」提示认的就是文案里的「Token」两个字）。 */
const TOKEN_HINT = 'MinerU Token 可能失效或未配置：可到工作台「MinerU Token」处点「重新设置」换新 Token 后重试。'

/**
 * HTTP 层认证类失败的**状态码**（401／403）。
 *
 * ⚠️ 这两个数字**只**在这份清单里出现，且只由 `fetchJson` 的 `res.status` 触发——
 * 解析阶段的 `err_msg` 里根本没有状态码（票 01 实测：那两个阶段的 `err_msg` 只有散文）。
 * 曾经它被写成码表第一条规则里的一段裸数字正则，于是**文件名里含 401／403 的材料**
 * （`第401讲.pdf`、`讲义403.pdf`——讲次编号带 401 是很常见的）会被判成「Token 可能失效」，
 * **编了一条用户没遇到过的原因**（票 08 要求「说清用户能做的下一步」要防的正是这个）。
 */
const AUTH_HTTP_STATUS = new Set([401, 403])

/** 官方文档只列了码、没写含义时的那一句（-60009 / -60017）。不猜原因，只说下一步。 */
function undocumentedCodeText(code) {
  return `MinerU 拒绝处理这份文件，但没说明 ${code} 是什么意思（官方文档里这个码没有说明）。先换一份文件试一次：别的文件能过就是这一份的问题；都过不了就是 MinerU 那边的问题，等一会儿再试。`
}

/** 从 `err_msg` 原文里认出被点名的那份文件（申请阶段会点名；解析阶段由调用方报名字）。 */
function pickedName(msg, re) {
  const m = re.exec(msg)
  return m === null ? '' : m[1]
}

/**
 * 申请阶段被整批打回时，**这一批里哪几份**是被点名的那几份（票 07 的逐文件退避）。
 *
 * 认法只有一条：**上游原文里出现了本批某个提交名，且那一次出现是「整串」的**。
 * 实测原文两种形态都点名到文件——`unsupported file type:probe-plain.txt` 与
 * `model_version 'vlm' cannot process html files: …`（契约快照 §10）——但只认
 * 「出现在原文里」这一条事实，不去猜码的语义。
 *
 * ⚠️ **认不出就返回空表**，调用方据此整批抛：额度类错误（-60018/-60019）不点名任何文件，
 * 那时若硬挑一份去判失败，就是拿猜的名字去顶账。
 *
 * ⚠️ **「整串」是承重的那一半**：短名是长名的子串时（`教材.pdf` 与 `数学教材.pdf` 同批），
 * 裸 `detail.includes(name)` 会把**好文件一起判失败**——用户看到三份红，而上游只点了一份。
 * 本仓的用户文件名什么都可能有（实测连半角空格都有：`probe-中文 文档（副本）.pdf`），
 * 所以边界判的是**分隔符白名单**（见 {@link isNameBoundary}），不是「非字母数字」：
 * 后者会把中文名内部的汉字判成边界，子串照样命中——那正是要治的病。
 *
 * ⚠️ 用**提交名逐个反查**而不是从原文切字符串：中文名里可能有空格（实测上面那个名字就有），
 * 按分隔符切会把名字切碎、切出来的碎片反而不认得。
 *
 * @returns Map<提交名, 原始 detail>（键只在**本批**的文件名里；空表 = 认不出）
 */
function blameBatch(batch, detail) {
  const blamed = new Map()
  for (const item of batch) {
    if (mentionsWholeName(detail, item.name)) blamed.set(item.name, detail)
  }
  return blamed
}

/**
 * 原文里出现这个名字的那几次，**有没有一次是「整串」的**（前后都不是文件名的一部分）。
 *
 * 逐个位置看，不是「字符串在不在」：`数学教材.pdf` 里含 `教材.pdf`，但那一次出现的
 * **左**界是「学」——它是文件名的一部分，不是分隔符 ⇒ 判否；而同一个字符串在
 * `unsupported file type:数学教材.pdf` 里左界是 `:` ⇒ 判是。
 */
function mentionsWholeName(detail, name) {
  if (name === '') return false
  const text = String(detail ?? '')
  let from = 0
  for (;;) {
    const at = text.indexOf(name, from)
    if (at === -1) return false
    const before = at === 0 ? '' : text[at - 1]
    const after = at + name.length >= text.length ? '' : text[at + name.length]
    if (isNameBoundary(before) && isNameBoundary(after)) return true
    from = at + 1
  }
}

/**
 * 这个字符算不算「名字的界」。
 *
 * **分隔符白名单**，不是「非字母数字」黑名单：本仓的用户文件名里汉字、点号、下划线、
 * 短横、空格、圆括号、全角括号**全都可能出现**（实测名 `probe-中文 文档（副本）.pdf`），
 * 所以它们一律**不算界**——把它们算成界就等于放行子串。白名单只收实测原文真用过的分隔形态：
 * `type:名字`、`files: 名字`、`'名字'`、`"名字"`、逗号并列，以及行首/行尾。
 *
 * ⚠️ 宁可**少认**不可多认：界判严了只是退回「整批抛」（票面口径：认不出就不拿猜的名字顶账），
 * 界判松了会把好文件判失败——后者是用户直接看见的错。
 */
function isNameBoundary(char) {
  if (char === '') return true // 行首 / 行尾
  return NAME_BOUNDARY_RE.test(char)
}

/** 名字两侧的分隔符（实测原文形态归纳；汉字/字母/数字/点号/短横/空格/括号**不在**其中）。 */
const NAME_BOUNDARY_RE = /[\s:;,'"!?`。，：；、！？]/

/** 说「这份文件」还是点名：调用方已经报过文件名时不重复报；从原文认出名字才点名。 */
function subjectOf(ctx, picked) {
  return picked !== '' && ctx.fileName === '' ? `《${picked}》` : '这份文件'
}

/**
 * 错误码/原文 → 人话。**顺序即优先级**，先认到的先说。
 *
 * 判据是**说清用户能做的下一步**（换一份 / 拆成几份 / 明天再来 / 改设置），不是把英文翻成中文；
 * 认不出来的原样透出——用户至少能拿原文反馈，我们也不必替上游编原因。
 *
 * ⚠️ 匹配必须认**两路**，因为票 01 实测**拒收发生在两个阶段**：
 *   1. 申请上传地址（`file-urls/batch`）：**HTTP 200 + body `code:-60002`**，**整批打回**；
 *   2. 解析（上传后轮询）：`state: failed` + `err_msg`，**条目里根本没有错误码**。
 * 所以每条规则同时写「错误码」与「已知原文」——第 2 阶段只能靠原文那半。
 * 原文里只有**实测过的**才敢写；官方只给中文描述的那些（-60009 / -60017 等）只认错误码本身。
 *
 * ⚠️ `fileName` 只决定**能不能说「会自动拆」**：自动拆页（`page_ranges`）与物理切开
 * （PyMuPDF）**都只对 PDF 生效**（契约快照 §6：官方只认**上传文件**的后缀），
 * 于是 PDF 保留「会自动拆」那一档、非 PDF 一律说「请自己拆」（票 08 · Q3/Q10）。
 * 拿不到名字时取**不说自动拆**那一档：少说一句只是啰嗦，多说一句就是承诺。
 *
 * ⚠️ **这张表只认错误消息正文，不认 HTTP 状态码**。401／403 那一档由 `httpStatus` 参数
 * 单独判（见 `AUTH_HTTP_STATUS` 与 {@link humanizeMineruError}）：把状态码写成码表里的
 * 一段裸数字正则，会让**文件名里含 401／403** 的材料（`第401讲.pdf`）被编成
 * 「Token 失效」——一条用户没遇到过的原因。HTTP 层那一侧（`fetchJson`）才拿得到状态码。
 */
const MINERU_ERROR_RULES = [
  {
    // A0202/A0211 是**上游认证码**（它们在 `msg` 正文里出现时判的就是认证失败，不是文件名里的数字）。
    match: /A0202|A0211|unauthor|token 错误|token 过期/i,
    human: () => TOKEN_HINT,
  },
  {
    // -10002 **不在官方错误码表里**（票 01 实测拿到的），它是「HTML 必须显式 MinerU-HTML」的机制证据。
    match: /-10002|cannot process html files/i,
    human: (ctx) => `HTML 文件要走 MinerU 的网页专用通道（model_version 必须是 MinerU-HTML），当前这条通道不收${subjectOf(ctx, pickedName(ctx.msg, /html files:\s*(\S+)/i))}。请在浏览器里「打印 → 另存为 PDF」后重新上传。`,
  },
  {
    // 两条上限是两件事：体积这条**排在页数前面**判（`exceeds limit` 认的是页数那条的兜底模式）。
    match: /-60005|file size exceeds|exceeds 200\s*mb|文件大小超过|文件过大|大小超过限制/i,
    human: (ctx) => (ctx.isPdf
      ? '这份 PDF 超过 MinerU 单份 200MB 的上限。会先在本地把它切开再解析（这一步需要本机装有 Python 与 PyMuPDF，没有就跳过）；如果没生效，请把它拆成几份（每份 <200MB）后分别上传，或压缩后再试。'
      : '这份文档超过 MinerU 单份 200MB 的上限。自动切开只对 PDF 生效，这份切不了：请把它拆成几份（每份 <200MB）后分别上传，或压缩后再试。'),
  },
  {
    // -60006 页数超限（无 PDF 限定，对所有格式适用）；-30003 是同义的老码。
    match: /-60006|-30003|page count exceeds|exceeds limit|页数超过限制|文件页数超过限制/i,
    human: (ctx) => (ctx.isPdf
      ? '这份 PDF 超过 MinerU 单份 200 页的上限。会先自动按每份 200 页一段拆开解析；如果这一步没生效，请把它拆成几份（每份 <200 页）后分别上传，或换一本更薄的书。'
      : '这份文档超过 MinerU 单份 200 页的上限。自动拆页只对 PDF 生效，这份拆不了：请把它拆成几份（每份 <200 页）后分别上传，或换一本更薄的书。'),
  },
  {
    // ⚠️ 票 07：**末句按「这次打回了多大范围」分两档**。受理闸门放开之前，所有打回都是整批
    // （申请阶段 `code:-60002` 实测如此），所以那句话只有一档；票 07 让 `convertPdfBatch`
    // 能**逐文件退避**（认出被点名的那份、只判它失败、其余照常走），于是同一句人话有两种
    // 事实，说错任何一档都是在骗人：说「只影响这一份」而其实整批没了＝让用户以为重传一次就好；
    // 说「整批重传」而其实只有一份坏了＝让用户白重传 49 份。
    // 认不出是哪一份（`scope === 'batch'`）时才走整批那档——那时没有「那一份」可退。
    match: /-60002|unsupported file type|不支持的文件类型|文件类型不支持/i,
    human: (ctx) => `MinerU 只按文件后缀判断类型，认不出${subjectOf(ctx, pickedName(ctx.msg, /unsupported file type:\s*(\S+)/i))}。请确认后缀与文件的真实内容一致，或先把它另存为 PDF 再上传。`
      + (ctx.scope === 'batch'
        ? '⚠️ 这一批没能点出是哪一份，官方把整批都打回了——同批的材料都要重传。'
        : '⚠️ 这次只影响这一份，同批的其他材料照常转换。'),
  },
  {
    // 加密/密码保护文件：官方文档**零提及**、无对应错误码，最可能落这一条（那是推断，不许写成事实）。
    match: /-60003|failed to read file|read file failed|file (is )?(damaged|corrupted)|文件读取失败|检查文件是否损坏/i,
    human: (ctx) => `${subjectOf(ctx, '')}读不出来，可能已加密（设了打开密码），也可能已损坏。请先在本机打开确认能正常显示，另存一份副本再上传；如果本机也打不开，那就是文件本身的问题，请换一份。`,
  },
  {
    // ⚠️ 实测 0 字节文件**多半拿不到这个码**（类型检测排在前面），它是兜底那一句。
    match: /-60004|empty file|空文件|文件为空/i,
    human: (ctx) => `${subjectOf(ctx, '')}是空的（0 字节，没有内容）。请确认导出时确实导出了内容，换一份有内容的文件再上传。`,
  },
  {
    match: /-60009/i,
    human: () => undocumentedCodeText('-60009'),
  },
  {
    // -60015 = **输入侧**「云端转不动这份文件」；-60016 = **输出侧**「extra_formats 导出失败」，两回事。
    match: /-60015|convert to pdf|转为\s*pdf|转成\s*pdf/i,
    human: (ctx) => `MinerU 没能把${subjectOf(ctx, '')}转成它能解析的格式。请在本机把它导出为 PDF（Word、PPT、Excel 都能直接导出 PDF）后重新上传。`,
  },
  {
    match: /-60016|extra_formats|转换为指定格式/i,
    human: () => '正文其实已经解析出来了，是导出成指定格式那一步失败（MinerU 的附加格式转换）。请重试一次；反复失败就换一份文件再试，或晚些时候再试。',
  },
  {
    match: /-60017/i,
    human: () => undocumentedCodeText('-60017'),
  },
  {
    // 账号级的**任务数**上限（不是页数）——撞上时今天一份都传不了了，必须说清「明天再来」。
    match: /-60018|每日解析任务数量已达上限|任务数量已达上限/i,
    human: () => '今天的解析额度用完了——MinerU 按账号统计当天的解析任务数（按份数算，不是按页数）。明天额度会重置；今天还想继续的话，可以先把要解析的文件数减下来，分几天做完。',
  },
  {
    match: /-60019|html 文件解析额度不足|html quota/i,
    human: (ctx) => `HTML 文件的解析额度不够了。请明天额度重置后再来；今天就要出内容的话，先把${subjectOf(ctx, '')}在浏览器里「打印 → 另存为 PDF」后重新上传。`,
  },
  {
    match: /-60020|文件拆分失败|split(?:ting)? (?:the )?file.*fail/i,
    human: (ctx) => (ctx.isPdf
      ? '这份 PDF 拆开解析那一步没能成功。请在本地把它拆成几份（每份 <200 页、<200MB）后分别上传。'
      : '这份文档的自动拆分没能成功（自动拆只对 PDF 生效，这份本来就拆不了）。请在本地把它拆成几份（每份 <200 页、<200MB）后分别上传。'),
  },
  {
    match: /-60021|读取文件页数失败/i,
    human: (ctx) => `MinerU 数不出${subjectOf(ctx, '')}有多少页，所以没法判断能不能解析。请在本机打开确认能正常翻页，另存一份副本（最好是 PDF）后重新上传。`,
  },
  {
    match: /-60022|网页读取失败|failed to (?:fetch|read) (?:the )?(?:web)?(?:page|url)/i,
    human: () => 'MinerU 打不开这个网页。请把网页内容存成文件（浏览器「打印 → 另存为 PDF」也行）后上传，不要直接传网址。',
  },
  {
    // ⚠️ 0 字节 PDF：**没有错误码**，只能靠 msg 认（票 01 实测：重试满 5 次才失败，白烧配额）。
    match: /retry limit reached|please replace the file/i,
    human: (ctx) => `${subjectOf(ctx, '')}读不出来，重试 5 次仍然失败（空的或已损坏的文件就是这个样子）。请换一份能正常打开的文件。`,
  },
]

/**
 * 把 MinerU 英文/错误码报错归一成人话（逐码，见 {@link MINERU_ERROR_RULES}）。
 *
 * @param raw 响应体的 `code` + `msg`，或解析阶段条目上的 `err_msg`
 * @param fileName 出错那份文件的名字（**决定能不能说「会自动拆」**；拿不到就不说）
 * @param scope 这次打回**多大范围**（票 07）：`'file'`（默认，只这一份坏了）或 `'batch'`
 *   （没认出是哪一份、整批都废了）。它只被 -60002 那条人话读——那句话在两种事实下**不能一样**。
 * @param httpStatus **真的** HTTP 状态码（只有 `fetchJson` 那一侧拿得到；解析阶段没有）。
 *   401／403 走这一档（`AUTH_HTTP_STATUS`），**不是**拿 `raw` 里的数字去猜——`raw` 里出现的
 *   401／403 完全可能只是**文件名**（`第401讲.pdf`），拿它判「Token 失效」就是替用户编原因。
 *
 * ⚠️ **它是本文件唯一一个「测试 import、生产侧零消费者」却仍然导出的符号，这是有意的**
 * （票 `deep-module-scan/21` 逐个核过引用后的裁决）：它跨在真正的接缝上——
 * **MinerU 的协议词汇 ↔ 用户能懂的话**。契约快照 §10 的码表每补一个新码，
 * 「这个码有没有一句说清下一步的话」这条承诺就窄了一格，而那条闭包判据只能对着快照解析、
 * 经它自己断。绕道 `convertPdfBatch` 断要为 13 个码各跑一次轮询（每次 ≥5 秒），
 * 且只能断出「屏上出现了中文」而不是「这个码拿到了它自己那一句」——那是把一条精确的承诺
 * 换掉成一条粗的。**它不是漏网的 implementation，要收窄也得连着契约闭包一起收。**
 */
export function humanizeMineruError(raw, fileName = '', scope = 'file', httpStatus = null) {
  const msg = String(raw ?? '').trim()
  // ⚠️ 空消息 + 401/403 也要说人话：上游认证失败时 body 常常是空的，状态码才是唯一的信号。
  if (httpStatus !== null && AUTH_HTTP_STATUS.has(httpStatus)) return TOKEN_HINT
  if (msg === '') return msg
  const name = String(fileName ?? '').trim()
  // ⚠️ 「能不能说会自动拆」这一格经 `isAutoSplittableMaterial` 取（code-review P3）——
  // 那是「按格式下判断的唯一入口」（`domain-rules`，票 10）。原先这里内联写
  // `/\.pdf$/i.test(name)`，是同一个领域事实的**第三份**实现：受理名单改一格
  // （或某天 `.pdf` 不再是 PDF 族），这两份就会各说各话，而界面那份判据是对的。
  const ctx = { msg, fileName: name, scope, isPdf: isAutoSplittableMaterial(name) }
  for (const rule of MINERU_ERROR_RULES) {
    if (rule.match.test(ctx.msg)) return rule.human(ctx)
  }
  return msg
}

/** 把同一本书拆出的多个分段 full.md 按页序合并成一份（图片引用改写为各段子目录）。 */
function mergeSplitParts(parts) {
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

/** 设置文件的唯一路径出口（读／写／加固三处共用）。 */
function settingsFile() {
  return join(resolveHome(), 'textbook', 'settings.json')
}

/** 读设置文件（$DSH_HOME/textbook/settings.json），不存在返回 {}。 */
export function readSettings() {
  const path = settingsFile()
  if (!existsSync(path)) return {}
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return {}
  }
}

/**
 * 写设置文件（$DSH_HOME/textbook/settings.json）。
 *
 * ⚠️ **0600 是硬要求**（票 `token-banner/01`）：这份文件里住着用户显式保存的 MinerU Token，
 * 与 `.credentials.yaml` 同级。`mode` 只在**新建**时生效，所以旧文件（可能是 0644）必须再
 * `chmodSync` 一次——否则「从今天起是 0600」只对第一台新机器成立。窗口期里旧权限的那一瞬间
 * 无法用「先 chmod 再写」消除（文件可能还不存在），这里选的是「写完立刻收紧」，与 Node 的
 * 常规做法一致。
 */
export function writeSettings(settings) {
  const dir = join(resolveHome(), 'textbook')
  mkdirSync(dir, { recursive: true })
  const path = settingsFile()
  writeFileSync(path, JSON.stringify(settings, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 })
  chmodSync(path, 0o600)
}

/**
 * 历史文件加固（票 `token-banner/01` 收口 review）：旧版本写下的 settings.json 可能是 0644
 * （那时没有 0600 要求，Token 已经躺在里面）。用户升级后**第一次走到判据**（打开工作台或保存）
 * 就收紧，不必等他再保存一次。
 *
 * ⚠️ 刻意不放进 `readSettings`：转换每处理一份材料都会读一次设置，读路径不该反复写盘。
 * Windows 的 ACL 语义不在这条判据里（`chmod` 只动只读位），直接跳过。
 */
function tightenSettingsFileMode() {
  if (process.platform === 'win32') return
  const path = settingsFile()
  if (!existsSync(path)) return
  try {
    if ((statSync(path).mode & 0o077) !== 0) chmodSync(path, 0o600)
  } catch {
    /* 收紧失败不阻断读取：界面服务照常可用，残余风险如实登记在票与信任边界里。 */
  }
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

/**
 * 找到此刻真正会用的 Token 及其来源——**读序的唯一实现**。
 *
 * 优先级（D③=A）：settings（用户显式保存） → env（宿主注入） → credentials（历史第三通道）。
 * 「来源」的取值是后端词汇（`settings` / `env` / `credentials`），中文标签归界面（`event-cards.js`）。
 *
 * ⚠️ 票面（D③=A）只点名 settings／env 两条通道；credentials 是**既有读序里真实存在的第三条**。
 * 把它排除在判据外，会让「只配了 credentials」的用户重新落回本票要治的那类假警报（横幅说他没配、
 * 转换却跑得通）——所以判据跟**实际转换用的那条读序**走，界面对它单列一个来源标签，⛔ 不假装只有两路。
 *
 * @returns {{ token: string, source: 'settings'|'env'|'credentials' } | null}
 */
function findMineruToken() {
  const fromSettings = readSettings().mineruToken
  if (typeof fromSettings === 'string' && fromSettings.trim() !== '') {
    return { token: fromSettings.trim(), source: 'settings' }
  }
  const fromEnv = process.env.MINERU_TOKEN
  if (fromEnv !== undefined && fromEnv.trim() !== '') return { token: fromEnv.trim(), source: 'env' }
  const fromCredentials = scanCredentialsYaml()
  if (fromCredentials !== undefined && fromCredentials !== '') {
    return { token: fromCredentials, source: 'credentials' }
  }
  return null
}

/**
 * 界面只许看到脱敏值：保留可辨识的前缀（如 `sk-`）与末四位，中间一律 `****`。
 * 短 Token（≤12 字符）连末四位都不露——露了就等于露掉一大截。
 */
function maskMineruToken(token) {
  const text = String(token ?? '').trim()
  if (text === '') return null
  const prefix = /^([A-Za-z]{2,4}-)/.exec(text)?.[1] ?? ''
  const tail = text.length > 12 ? text.slice(-4) : ''
  return `${prefix}****${tail}`
}

/**
 * Token 的**唯一判据**（票 `token-banner/01`）：`/textbook/settings` 与保存回包都从这里取。
 *
 * ⚠️ `configured` 与 `resolveMineruToken` **同一条读序**（都走 `findMineruToken`）：横幅问的
 * 「配好了没有」必须等于转换那一刻「找不找得到」——两者各读一路就是假警报的病因。
 * `masked` 是脱敏值（不是明文）；明文一个字节都不许进回包。
 *
 * @returns {{ configured: boolean, source: 'settings'|'env'|'credentials'|null, masked: string|null }}
 */
export function mineruTokenStatus() {
  tightenSettingsFileMode()
  const found = findMineruToken()
  if (found === null) return { configured: false, source: null, masked: null }
  return { configured: true, source: found.source, masked: maskMineruToken(found.token) }
}

/** 解析 MinerU token；无 token 抛错（含配置引导文案）。 */
function resolveMineruToken() {
  const found = findMineruToken()
  if (found !== null) return found.token
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
    // ⚠️ 认证类失败（401/403）**只有这一层拿得到码**：解析阶段的 err_msg 里没有错误码。
    // 所以状态码作为**独立的判据**递进去（`httpStatus`），而不是混进 `detail` 那串文本里
    // 让码表去猜——那样 `第401讲.pdf` 这种文件名会连带把「Token 失效」编出来。
    if (AUTH_HTTP_STATUS.has(res.status)) {
      throw new Error(`MinerU HTTP ${res.status}: ${humanizeMineruError('', '', 'batch', res.status)}`)
    }
    const detail = json !== null ? JSON.stringify(json).slice(0, 200) : res.statusText
    throw new Error(`MinerU HTTP ${res.status}: ${humanizeMineruError(detail === '' ? String(res.status) : detail)}`)
  }
  return json
}

/**
 * zip 里 full.md 的位置判据（票 06 ①）：**只认根目录那一层**。
 *
 * 为什么不是 `endsWith('full.md')`：那个写法不要求根目录、且后写覆盖先写——
 * 一旦 MinerU 改成返回聚合 zip（多份结果打在一个 zip 里按子目录分组），
 * 我们会**静默取到任意子目录的 full.md**：不报错，只是内容错。
 *
 * ⚠️ 这条断言今天**不是**在修一个已复现的 bug：票 01 真机实测（2026-10-15，
 * `docs/reference/mineru-api-contracts.md` §5）证明本流程是**平铺**的——
 * 单文件批与多文件批都是一份 zip 对一个文件、`full.md` 恒在根目录，
 * 第三方报告的「多文件 zip 按子目录分组」在本流程**不成立**。
 * 所以 `===` 与 `endsWith` 今天等价；留 `===` 是**防御性断言**：成本为零，
 * 挡住的是上游哪天改行为的那一天——那天它把「内容错」变成一条看得见的失败。
 */
function isRootFullMd(entryName) {
  return entryName === 'full.md'
}

/** 子目录里的 full.md（basename 口径）：只在拼错误原因时用，判据本身不据此放行。 */
function isNestedFullMd(entryName) {
  return !isRootFullMd(entryName) && /(^|[/\\])full\.md$/i.test(entryName)
}

/**
 * 一份转换稿算不算「压根没有正文」（票 `mineru-formats/04` 判据 A）。
 *
 * **判据是结构性的、有没有，与篇幅无关**：去空白之后**长度为 0**。
 * ⚠️ **不许做成字数阈值**——`CONTEXT.md`「机器检查契约原则」：字数闸门只判逐章兜底，不判**材料正文**的长短。
 * 同一个道理、`CONTEXT.md`「正文偏少」词条把它写成了红线：某份稿子「转成了但正文很短」
 * 是**一句如实告知**（AI 探查时逐源表态），机器**只判有没有**，一个字的门槛都不设。
 *
 * 为什么必须补这道：原实现只在 zip 里**完全没有** `full.md` 时抛错，于是 MinerU
 * 回一份**空的** `full.md`（扫描件 OCR 失败、纯图无字、加密件）时**静默成功**，
 * `converted: 'ok'`，下游五个阶段就基于一份空材料把整本书跑完——「静默产出垃圾书」。
 *
 * @param fullMd zip 里那份 full.md 的字节（Buffer 或字符串）
 * @returns {boolean} 去空白后没有任何字符 ⇒ true
 */
function isEmptyConvertedMd(fullMd) {
  const text = Buffer.isBuffer(fullMd) ? fullMd.toString('utf8') : String(fullMd ?? '')
  // `\s` 含 BOM（U+FEFF）与全角空格（U+3000）——它们都不是正文，只有真字符才算。
  return text.replace(/\s/g, '') === ''
}

/**
 * 结果 zip 里**拿不出一份可用正文**时的人话原因（票 06 ① ＋ 票 04）。
 * 点名是哪一份、zip 里实际有什么，以及是哪一档形状：
 *   - `absent`：压根没有任何 full.md；
 *   - `nested`：根级没有、只有子目录里那些（聚合包那种形状，票 06 ①）；
 *   - `empty`：根级 full.md 在，但去空白后零内容（票 04 判据 A）。
 *
 * ⚠️ 档序按**事实**排（`empty` 在 `nested` 之前）：根级那份若在，它就是被取的那一份，
 * 子目录里的只是附带产物——先说「没有根目录的」会对着事实说话。
 */
function describeUnusableFullMd(fileName, zip, nestedNames, shape) {
  if (shape === 'empty') {
    const alsoNested = nestedNames.length > 0 ? `（子目录里还有 ${nestedNames.slice(0, 3).join('、')}，那几份本流程不取）` : ''
    return `《${fileName}》的结果 zip 里有一份 full.md，但去掉空白后一个字都没有${alsoNested}——`
      + '这一份没解析出正文（扫描件识别不出字、纯图片无字、文件损坏都可能）。'
      + '请换一份材料或重跑一次转换。⚠️ 机器只判「有没有正文」，不判正文长短：'
      + '转换成功与否和它够不够用是两件事，后者请在读材料挑重点时逐源说明。'
  }
  if (shape === 'nested') {
    const shown = nestedNames.slice(0, 3).join('、')
    return `《${fileName}》的结果 zip 里没有根目录的 full.md，只有子目录里的 ${shown}${nestedNames.length > 3 ? ' 等' : ''}——`
      + '这一份 zip 改成了按子目录分组的聚合包（一份 zip 对多份结果），本流程一份 zip 只认一个文件，'
      + '取不准该取哪一份，所以判失败（不静默拿一份可能错的）。请重跑一次转换；若持续如此，是官方结果包布局变了，需按新布局适配。'
  }
  const top = zip.getEntries()
    .filter((e) => !e.isDirectory && !e.entryName.includes('/') && !e.entryName.endsWith('/'))
    .map((e) => e.entryName)
  return `《${fileName}》的结果 zip 里没有任何 full.md（顶层只有 ${top.slice(0, 4).join('、') || '空文件'}）——`
    + '这一份没解析出正文（空文件、文件损坏、纯图无字都可能）。请换一份材料或重跑一次转换。'
}

/**
 * 提交名在回包里没有对应条目时的人话（票 06 ②：旧写法只有「结果缺少 X」，
 * 看不出是哪一份、也看不出可能为什么）。点名没对上的是**哪一份**、这批回包里
 * 实际回了什么，再列出三种最可能的原因，不静默丢。
 */
function describeMissingResult(name, backNames, namelessCount) {
  const got = backNames.length === 0
    ? '一条结果都没回'
    : `回了 ${backNames.length} 条：${backNames.slice(0, 4).map((n) => `《${n}》`).join('、')}${backNames.length > 4 ? ' 等' : ''}`
  const orphan = namelessCount > 0 ? `，另有 ${namelessCount} 条没带 file_name` : ''
  return `MinerU 说这批都转完了，但回包里没有《${name}》这一条（${got}${orphan}）。`
    + '可能原因：① 官方把内容相同的文件并成一条、只回一份；② 提交名与回包 file_name 对不上（大小写、空格或后缀差异）；'
    + '③ 这一条还在解析、轮询先结束了。请重跑一次转换；若一直这样，把它改名或单独试一次。'
}

/**
 * 批量转换多份 PDF（MinerU v4 批量接口）。
 * 一次申请全部上传链接 → 逐个 PUT → 批量轮询（响应带 file_name，可一一对应）
 * → 每份结果解压到各自 outDir（消除单文件版 full.md 互相覆盖的问题），
 * 且多文件并行解析，比逐本串行快得多。
 *
 * 自动拆段（先按大小、再按页数）：
 *  - >200MB 的书：用 Python(PyMuPDF) 物理切成 <200MB 的分段分别提交
 *    （MinerU 错误码 -60005 对 >200MB 直接拒收，page_ranges 只按页解析救不了大小）；
 *  - >200 页的书：同一份 PDF 按 page_ranges（每段 ≤200 页）提交多份。
 * 两种拆法各段 full.md 都按页序合并成父书一份完整 md（合并结果带 splitParts 字段）。
 *
 * ⚠️ 票 05：**两种拆法只对 PDF**。`page_ranges` 官方只认**上传文件的后缀**（契约快照 §6），
 * 而所有格式云端都会先转成 PDF（§5）——所以非 PDF 走单份提交**不是因为它解析不了**，
 * 是因为「按段重投」这条绕法对它不成立。
 *
 * @param items [{ file, name, outDir }] file=本地路径，name=提交名（与源文件名一致），outDir=结果目录
 * @param opts  { formula?, table?, language?, maxBytes?, pollIntervalMs? } maxBytes 供测试注入（默认 200MB）；
 *              pollIntervalMs 是轮询节拍（毫秒，默认 5000＝本文件里原来写死的那个数），同样供注入——
 *              假传输下的判据走的是**同一条真实轮询循环**，不必真等节拍。
 * @param onStage (stage: string) => void
 * @returns [{ name, ok, mdPath?, error?, splitParts? }] 单本失败不抛（调用方决定重试范围）；申请/上传/轮询整体失败抛错。
 *
 * ⚠️ 「算转成了」的判据有**两道**（都只问「有没有正文」，不问「正文多少」）：
 *   1. 结果 zip 里没有根级 full.md（票 06 ①，含聚合包那种形状）；
 *   2. full.md 在，但去空白后零内容（票 04 判据 A）——原来这条会**静默成功**，
 *      于是扫描件/纯图这类「转出了个空壳」的材料会带着一份空稿跑完下游五个阶段。
 *   **有内容但很短照旧算成功**：那属「正文偏少」（`CONTEXT.md` 词条），由 AI 读材料时如实说，
 *   机器永不按字数/篇幅判成败——两处不许合并成一条阈值判据。
 */
export async function convertPdfBatch(items, opts = {}, onStage = () => {}) {
  const token = resolveMineruToken()
  const formula = opts.formula === true
  const table = opts.table !== false
  const language = opts.language ?? 'ch'
  const maxBytes = Number.isFinite(opts.maxBytes) ? opts.maxBytes : MINERU_MAX_BYTES
  // 批量轮询的节拍（毫秒）。**默认值逐字＝原来写死在轮询循环里的那个 5000**，生产调用点一个都不传
  // 这个键 ⇒ 生产行为一字不变。它与 maxBytes 同属既有的 `opts`，不是新加的第二参／第二接口。
  // 传 0 的语义（票 `test-surface/01` · A）：那次等待**照旧发生**，只是换成 `setTimeout(resolve, 0)`
  // ——仍然异步让出一次（不是忙等），第一次 fetch 照发，240 轮的轮次上限与
  // 「done + failed ≥ 份数」的收口语义一律不变：既不跳过任何一次轮询，也不跳过任何一次
  // 重新申请／上传／下载。
  const pollIntervalMs = Number.isFinite(opts.pollIntervalMs) ? opts.pollIntervalMs : 5000
  const results = []
  const mergeTable = new Map() // 拆分书的分段暂存表（key=原文件名）
  const failedParents = new Set() // 已报过失败的拆分书，避免重复错误行
  const sizeTmpDirs = [] // 按大小切分产生的临时分段目录，收尾统一清理

  try {
    // 预展开：先按大小物理切分，再按页数拆 page_ranges 分段；解析完按页序合并成
    // 一份完整 md——下游源探查看到的仍是一本连续的书。
    const expanded = []
    for (const item of items) {
      // ⚠️ 票 05：整条拆段链路 gate 在 ext === 'pdf'，**三处各守一道**（不是只守入口）——
      // ① countPdfPages 调用点 ② splitPdfBySize 调用点 ③ page_ranges 分支（分段名那格由
      // splitPartName 第四道守）。任何一道漏掉，非 PDF 都会踩到 countPdfPages 的
      // `/Count\s+(\d+)` 误命中。
      //
      // 理由（票面「事实更正」后的口径，**不是**「非 PDF 没有页数」）：所有格式云端都会先转成
      // PDF（契约快照 §5 实测：图片的 zip 里带 `*_origin.pdf`，与 -60015 一致），所以非 PDF
      // 是有页数的；切不动的是 **`page_ranges` 这个参数**——官方 `analyze.py:148-149` 判的是
      // **上传文件的后缀**（`if file_suffix != "pdf" and page_index_map: raise`），
      // 内部转出来的那个 pdf 不算（契约快照 §6）。
      const isPdf = isPdfPath(item.file)
      const pageCount = isPdf ? countPdfPages(item.file) : null                        // 闸门①（函数内另有自检）
      // 1) >maxBytes：物理切成 <maxBytes 的分段（每段也 ≤200 页），临时文件用完即清。
      const sizeSplit = isPdf ? await splitPdfBySize(item.file, pageCount, maxBytes) : null // 闸门②
      if (sizeSplit !== null) {
        sizeTmpDirs.push(sizeSplit.tmpDir)
        const sizeMB = Math.round(statSync(item.file).size / 1048576)
        sizeSplit.ranges.forEach((r, idx) => {
          expanded.push({
            ...item,
            file: sizeSplit.parts[idx],
            name: splitPartName(item.name, idx),                                      // 闸门④：非 PDF 抛错，不谎报后缀
            outDir: join(item.outDir, `_s${idx + 1}`),
            _split: { idx: idx + 1, total: sizeSplit.ranges.length, parentOutDir: item.outDir, parentName: item.name },
          })
        })
        onStage(`《${item.name}》超过 ${Math.round(maxBytes / 1048576)}MB（约 ${sizeMB}MB）：已切成 ${sizeSplit.ranges.length} 份（每份 <${Math.round(maxBytes / 1048576)}MB）分别解析，完成后自动合并`)
        continue
      }
      // 2) >200 页：page_ranges 分段（同一份文件上传多份，每份只解析一段页）。
      //    闸门③：`isPdf` 与否都写出来——即便 countPdfPages 哪天在非 PDF 上误命中了页数，
      //    也**进不了**这个分支。
      if (isPdf && pageCount !== null && pageCount > MINERU_MAX_PAGES) {
        const chunks = planPageChunks(pageCount)
        chunks.forEach((chunk, idx) => {
          expanded.push({
            ...item,
            name: splitPartName(item.name, idx),                                      // 闸门④
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
      const slice = expanded.slice(start, start + batchSize)
      // 记一份「这一份判失败」（父书口径：拆分书的分段不单独报，报它父书那一行）。
      const failItem = (item, message) => {
        const parentKey = item._split !== undefined ? item._split.parentName : item.name
        if (failedParents.has(parentKey)) return
        failedParents.add(parentKey)
        results.push({ name: parentKey, ok: false, error: message })
      }

      // ⚠️ 票 07 · 逐文件退避（申请阶段）：实测（票 01 §10）这一步是 **HTTP 200 + body.code:-60002
      // 且整批打回**——一份非法文件会让同批 50 份全灭。受理白名单放开之后（`.docx` 之类上游只有
      // 散文声明、零成功记录的格式**也**收），这是**常态风险**而不是边角。
      // 所以这里逐个认领上游点名的那几份、只判它们失败、**其余重新申请一次照常走**。
      // 认不出是哪一份（额度类错误、消息里没点名）才整批抛——那时没有「那一份」可退，
      // 硬退就是拿好文件陪葬（那正是旧行为，也是这张票要治的病）。
      let batch = slice
      let urls = null
      let batchId = null
      while (batch.length > 0) {
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
        if (applied.code === 0 && applied.data !== undefined) {
          batchId = applied.data.batch_id
          urls = applied.data.file_urls ?? []
          break
        }
        // 申请阶段：HTTP 200 + body.code（票 01 实测），`-60002` / `-10002` 都发生在这一步。
        // 原来这里把整个 body 原样抛出去，用户看到的是一坨 JSON（票 08 已改成人话）。
        const detail = [applied?.code, applied?.msg]
          .filter((v) => v !== undefined && v !== null && String(v) !== '')
          .join(' ')
        const raw = detail === '' ? JSON.stringify(applied).slice(0, 200) : detail
        const blamed = blameBatch(batch, raw)
        if (blamed.size === 0) {
          // 认不出是哪一份 ⇒ 整批打回是事实，如实说（人话分档见 `humanizeMineruError` 的 scope）。
          throw new Error(`申请上传失败: ${humanizeMineruError(raw, '', 'batch')}`)
        }
        for (const item of batch) {
          const errMsg = blamed.get(item.name)
          if (errMsg === undefined) continue
          failItem(item, humanizeMineruError(errMsg, item.name))
          onStage(`《${item.name}》MinerU 收不了（${humanizeMineruError(errMsg, item.name)}），其余材料继续`)
        }
        // 每轮至少摘掉一份（`blamed` 非空且都取自 `batch`），所以这个循环必然收敛。
        batch = batch.filter((item) => !blamed.has(item.name))
      }
      if (urls === null) continue // 这一批全被点名打回：后面几批照常走
      if (!Array.isArray(urls) || urls.length !== batch.length) {
        throw new Error(`申请上传链接数量不符（${urls.length}/${batch.length}）`)
      }
      for (let i = 0; i < batch.length; i += 1) {
        // 序号取**它在原批次里的位置**（退避之后 batch 是 slice 的子集，直接用 i 会少报）。
        onStage(`上传材料（${start + slice.indexOf(batch[i]) + 1}/${expanded.length} 份）`)
        const first = urls[i]
        const uploadUrl = typeof first === 'string' ? first : first?.url
        if (uploadUrl === undefined) throw new Error('申请上传失败：没有返回上传地址')
        const fileBytes = readFileSync(batch[i].file)
        const put = await fetch(uploadUrl, { method: 'PUT', body: fileBytes, signal: AbortSignal.timeout(300_000) })
        if (!put.ok) throw new Error(`上传 ${batch[i].name} 失败: HTTP ${put.status}`)
      }

      // 批量轮询，直到**每一份都落定**（转成或转败）。
      // ⚠️ 票 07 · 逐文件退避（解析阶段）：这一阶段的失败是**条目级**的（`state: failed` + `err_msg`，
      // 条目里根本没有错误码——契约快照 §10）。旧写法见着一条 failed 就**整批抛**，于是同批好材料
      // 一起陪葬；现在按 `file_name` 认领、只判那一份失败，其余照常下载。
      // **点不出名字的仍整批抛**：归因不了就不假装能归因（也不拿猜的那份去顶账）。
      let polled = null
      let settled = false
      const parseFailed = new Map() // 提交名 → err_msg
      for (let attempt = 0; attempt < 240; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
        polled = await fetchJson(`${API_BASE}/api/v4/extract-results/batch/${batchId}`, {
          headers: headers(token),
          signal: AbortSignal.timeout(60_000),
        })
        const entries = polled.data?.extract_result ?? polled.data?.batch ?? []
        const list = Array.isArray(entries) ? entries : []
        for (const entry of list) {
          if (entry?.state !== 'failed') continue
          const name = typeof entry.file_name === 'string' ? entry.file_name : ''
          const item = name === '' ? undefined : batch.find((b) => b.name === name)
          if (item === undefined) {
            throw new Error(`MinerU 转换失败（${name === '' ? '?' : name}）: ${humanizeMineruError(entry.err_msg, name, 'batch')}`)
          }
          parseFailed.set(item.name, String(entry.err_msg ?? ''))
        }
        const doneCount = list.filter((entry) => entry?.state === 'done').length
        if (doneCount + parseFailed.size >= batch.length) { settled = true; break }
        onStage(`转换中（${doneCount}/${batch.length - parseFailed.size} 份完成）`)
      }
      if (!settled) throw new Error('MinerU 转换超时（20 分钟）')
      for (const [name, errMsg] of parseFailed) {
        const item = batch.find((b) => b.name === name)
        if (item !== undefined) failItem(item, humanizeMineruError(errMsg, name))
      }

      // 下载解压：按 file_name 一一对应到各自子目录。
      //
      // ⚠️ 这个映射有两处会「对不上」，而旧写法两处都是静默的（票 06 ②）：
      //  - **同一个 file_name 出现多条**：Map 后写覆盖先写 ⇒ 一份 zip 被写进两个 outDir，
      //    两份都报成功、内容却是同一份（官方回包按 file_name 认人，重名材料必然撞上）；
      //  - **提交名在回包里根本没有**：旧写法只写「结果缺少 X」，看不出是哪一份、也看不出为什么。
      // 两处都改成：点名 + 说清可能原因 + 判这份失败，其余材料照常走。
      // （注：两份条目**指向同一个 `full_zip_url`** 本身不构成匹配问题——名字对得上就下同一份，
      //  那正是「这两份内容一样」的事实。票 01 实测同内容的两份拿到的是不同 URL。）
      const entries = polled.data?.extract_result ?? polled.data?.batch ?? []
      const byName = new Map()
      const byNameCount = new Map() // file_name → 回包里同名条目数（>1 即映射有歧义）
      let nameless = 0 // 回包里没带 file_name 的条目数（无法归属到任何提交名）
      for (const entry of Array.isArray(entries) ? entries : []) {
        if (typeof entry?.file_name !== 'string' || entry.file_name === '') {
          nameless += 1
          continue
        }
        byNameCount.set(entry.file_name, (byNameCount.get(entry.file_name) ?? 0) + 1)
        byName.set(entry.file_name, entry)
      }
      const backNames = [...byName.keys()]
      for (const item of batch) {
        // 已经在解析阶段判过失败的那份（票 07 逐文件退避）不重复报，也不去下它那份根本不存在的 zip。
        if (parseFailed.has(item.name)) continue
        const parentKey = item._split !== undefined ? item._split.parentName : item.name
        const sameName = byNameCount.get(item.name) ?? 0
        const entry = byName.get(item.name)
        if (sameName > 1) {
          if (!failedParents.has(parentKey)) {
            failedParents.add(parentKey)
            results.push({
              name: parentKey,
              ok: false,
              error: `MinerU 回包里有 ${sameName} 条结果都叫《${item.name}》，分不清哪条对应哪份提交——官方回包按 file_name 认人，`
                + '同一批里多半上传了重名材料（旧写法会让两份各拿同一份结果，不报错）。请把其中一份改名后重跑转换。',
            })
          }
          continue
        }
        if (entry === undefined) {
          if (!failedParents.has(parentKey)) {
            failedParents.add(parentKey)
            results.push({ name: parentKey, ok: false, error: describeMissingResult(item.name, backNames, nameless) })
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
          const nestedFullMd = []
          for (const zipEntry of zip.getEntries()) {
            // 票 06 ①：只认**根目录**的 full.md（旧写法 `endsWith` 会静默取到子目录里任意一份）。
            // ⚠️ 根级那份**不在这里落盘**：判据没过（票 04 零内容）时盘上就不该留一份空稿，
            //   等判据过了再由下面那行 writeFileSync 写。
            if (isRootFullMd(zipEntry.entryName)) { fullMd = zipEntry.getData(); continue }
            if (!zipEntry.isDirectory && isNestedFullMd(zipEntry.entryName)) nestedFullMd.push(zipEntry.entryName)
            if (!zipEntry.isDirectory && !zipEntry.entryName.endsWith('/')) {
              const target = join(item.outDir, zipEntry.entryName)
              if (isWithin(item.outDir, target)) {
                mkdirSync(join(target, '..'), { recursive: true })
                writeFileSync(target, zipEntry.getData())
              }
            }
          }
          if (fullMd === null) {
            throw new Error(describeUnusableFullMd(item.name, zip, nestedFullMd, nestedFullMd.length > 0 ? 'nested' : 'absent'))
          }
          // 票 04 判据 A：full.md 在，但去空白后零内容 ⇒ 同样判失败（逐源结局由调用方接）。
          // ⚠️ 判据只问「有没有」，**不问「有多少」**——有内容但很短的稿子照旧算成功。
          if (isEmptyConvertedMd(fullMd)) throw new Error(describeUnusableFullMd(item.name, zip, nestedFullMd, 'empty'))
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
      writeFileSync(mdPath, `<!-- 本书较大，已自动拆成 ${acc.total} 段解析后合并 -->\n\n${merged}\n`)
      results.push({ name: acc.name, ok: true, mdPath, splitParts: acc.total })
    }
    onStage('完成')
    return results
  } finally {
    // 按大小切分产生的临时分段 PDF 用完即删（正常/异常路径都清理）。
    for (const d of sizeTmpDirs) cleanupTmpDir(d)
  }
}
