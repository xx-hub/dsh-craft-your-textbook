/**
 * 造书工作台 · 书夹位置注册表（engine 内部子模块 2/4，票 `depth-review-2026-10/10`）
 *
 * 本簇是**位置**：DSH home、项目根目录、注册表（旧书不动、仍记在默认目录；回收站里的书也记录新位置）、
 * 每本书的账本／状态／过程记录三个固定路径，以及给书名找空位。
 *
 * 依赖图位置：**叶子之上的第一层**——import `./labels.js` 的 `PROJECT_ID_RE` 与
 * `src/domain-rules.js` 的**书夹形状段名常量**（后者是纯模块、无 Node 依赖，方向仍是向上）。
 * ⚠️ `registeredDir` **刻意不导出**（ADR-0016 那一族的防回潮判据按名字钉它不在 engine 导出面上，
 *   见 `test-ledger-seq-integrity.mjs`）：它只是 `projectDir` 的内部一步。
 *
 * ⚠️ 这里**不许**顺手加新的宿主读取：`sessionWorkspace` 读 `ctx.get('sessions')` /
 *   `ctx.get('workspaceRegistry')` 两条既有通道是宿主契约闸门已经认下的；再加一条就是
 *   「用谁不声明谁」（AGENTS.md 宿主契约第一条），闸门会报未登记动态读取。
 */
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { mkdirSync, readFileSync, existsSync, writeFileSync, statSync } from 'node:fs'

import { PROJECT_ID_RE } from './labels.js'
import { isWithin } from '../../path-guard.js'
import {
  WORK_DIR_NAME,
  PROPOSAL_DIR_NAME,
  PROCESS_DIR_NAME,
  ARCHIVE_DIR_NAME,
  MATERIAL_DIR_NAME,
  CONVERTED_DIR_NAME,
  MANIFEST_FILE_NAME,
  REGISTRY_FILE_NAME,
  DETAIL_DIR_NAME,
  REPORT_DIR_NAME,
  CHAPTER_SHARD_DIR_NAME,
  chapterName,
  auditName,
  LEGACY_WORK_DIR_NAME,
  LEGACY_PROPOSAL_DIR_NAME,
  LEGACY_ARCHIVE_DIR_NAME,
  LEGACY_CONVERTED_DIR_NAME,
  LEGACY_DIR_RELS,
  posixBookRel,
} from '../../domain-rules.js'


export function dshHome() {
  const fromEnv = process.env.DSH_HOME
  if (fromEnv !== undefined && fromEnv.trim() !== '') return fromEnv
  return join(homedir(), '.dsh')
}


export function projectsRoot() {
  const root = join(dshHome(), 'textbook', 'projects')
  mkdirSync(root, { recursive: true })
  return root
}


// ── 书夹位置注册表 ───────────────────────────────────────────────────────────
// 新书默认建在"会话的工作区目录"里、文件夹名用书名；注册表记录每个项目
// 当前的实际目录（旧书不动，仍记在默认目录；回收站里的书也记录新位置）。

export function registryPath() { return join(dshHome(), 'textbook', 'registry.json') }


export function readRegistry() {
  const path = registryPath()
  if (!existsSync(path)) return {}
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8'))
    return raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  } catch { return {} }
}


export function writeRegistry(registry) {
  writeFileSync(registryPath(), JSON.stringify(registry, null, 2) + '\n')
}


export function registerProject(projectId, dir) {
  const registry = readRegistry()
  registry[projectId] = { dir }
  writeRegistry(registry)
}


/** 已登记项目的实际目录（没有登记返回 null）。 */
function registeredDir(projectId) {
  const entry = readRegistry()[projectId]
  if (entry !== undefined && typeof entry.dir === 'string' && entry.dir !== '') return entry.dir
  return null
}


/** 会话的工作区目录（会话头里的 cwd；拿不到返回 null）。 */
export function sessionWorkspace(ctx, sessionId) {
  try {
    const session = ctx.get('sessions')?.get?.(sessionId)
    const cwd = session?.header?.cwd
    if (typeof cwd === 'string' && cwd.trim() !== '' && existsSync(cwd) && statSync(cwd).isDirectory()) {
      return cwd
    }
  } catch { /* 走下一通道 */ }
  try {
    const registrySvc = ctx.get('workspaceRegistry')
    const list = typeof registrySvc?.list === 'function' ? registrySvc.list() : []
    for (const ws of list) {
      const members = ws?.sessionIds
      if (!Array.isArray(members)) continue
      const hit = members.find((m) => (m?.id ?? m) === sessionId)
      if (hit !== undefined && typeof hit?.cwd === 'string' && existsSync(hit.cwd) && statSync(hit.cwd).isDirectory()) {
        return hit.cwd
      }
    }
  } catch { /* 保持 null */ }
  return null
}


/** 把书名整理成合法的文件夹名。 */
export function sanitizeFolderName(name) {
  let out = String(name ?? '')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '')
  if (out === '' || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(out)) out = 'book'
  if (out.length > 60) out = out.slice(0, 60).replace(/[. ]+$/g, '')
  return out
}


/** 在工作区里找一个没被占用的书夹名（重名自动加 -2、-3…）。 */
export function freeBookDir(workspace, baseName) {
  let candidate = baseName
  let n = 2
  while (existsSync(join(workspace, candidate))) {
    candidate = `${baseName}-${n}`
    n += 1
  }
  return join(workspace, candidate)
}


export function projectDir(projectId) {
  if (!PROJECT_ID_RE.test(projectId)) throw new Error(`invalid project id: ${JSON.stringify(projectId)}`)
  const registered = registeredDir(projectId)
  if (registered !== null) return registered
  return join(projectsRoot(), projectId)
}


export function timelinePath(projectId) { return join(projectDir(projectId), 'timeline.jsonl') }

export function metaPath(projectId) { return join(projectDir(projectId), 'project.json') }

export function processLogPath(projectId) { return join(projectDir(projectId), '过程记录.md') }

// ── 书夹形状（票 `context-budget/10` 落 · 票 `13` 改名 · ADR-0031 决策 1–3）────────
//
// **为什么这一段单开而不是散进调用点**：书夹形状是**契约**，不是「某处顺手拼的字符串」。
// 段名住在 `domain-rules.js` 的**八个段名常量**里（`工作区`／`方案`／`过程`／`存档`／`材料`／
// `转换稿`／`细目`／`报告`，**另有 2 个文件名常量** `产物清单.json`／`登记.json`；前后端两侧都要知道），
// 本段只把它们**解析成绝对路径**。每一个路径都只有一个构造点，落到代码一律经这里。
//
// ✅ **改名已落**（票 `context-budget/13`）：书夹的四个段名已统一成 `工作区/`、`工作区/方案/`、
// `过程/存档/`、`材料/转换稿/`。
//
// ⚠️ **老书读侧兜底**（票 `13` 的有意取舍**已被维护者推翻**，见下面那几段注释与
// `.scratch/context-budget/issues/13-路径统一改名.md` 第 3 节的改写）：
// **写侧永远用新名；读侧新名优先、老名兜底。** 判法**只此一份**（{@link existingBookDir}）：
// **新名目录存在 ⇒ 用它；不存在而老名目录存在 ⇒ 用老名那个（只读）；都没有 ⇒ 建新名。**
//
// **本文件里参与老名兜底判法的解析函数一共 4 个**（`test-book-dir-rename.mjs` 逐个点名它们
// 都在这个文件里）：
// · **走老名兜底判法的 4 个**——`workDir`（`工作区/`）、`proposalDir`（`工作区/方案/`）、
//   `archiveDir`（`过程/存档/`）、`convertedDir`（`材料/转换稿/`）；
// · **结构上不参与的 5 个**——`processDir`／`materialDir`／`detailDir`／`reportDir`／
//   `chapterShardDir`（`过程/`、`材料/` 是票 10／13 **新建**的那几层，没有老名对应段；
//   `工作区/分片/` 是票 `walkthrough-2026-10/02` 新建的，同样没有老名。把它们算进「都按同一条判法」
//   只会让那句话变成空话）。
// 另有**第 9 个形状** {@link bookRelOnDisk}（书夹相对形状 → 盘上落点）：它跑在四条配对上，
// **同一个判法**。
// 逐字清单见 ADR-0031 的「改名补记」与票 13 落地记录；老名字面量只此一份，在 `domain-rules.js`
// 的 `LEGACY_*_NAME` 那一块（**本文件不手写第二份**，`test-book-dir-rename.mjs` 逐条点名）。
//
// ⚠️ **兜底只读，不搬**（spec 范围外明写「不做一次性搬迁」）：解析到老名时**一个字节都不许动**
// 老目录，也不许顺手把新名那几层建出来——维护者的实测证据就是这一条：
// `workDir('book-…')` 在一本只有老工作区那一段的老书上**当场把空的新目录建了出来**，
// 于是老书在工作台里变成「一本书都没有产物」，而旧目录被空的新目录**遮住**。
// 「先查老名、查不到才建新名」这个次序就是治它的那一刀。
//
// ⚠️ 账本三件里的 `timelinePath`／`processLogPath`（`过程记录.md`）**刻意不在本段重写**：
// 那是**机器身份词改名**，归票 `14`。本段只管上面四个段。

/**
 * 老名兜底的**唯一判法**（票 `15` 收敛）：新名那份在就用它，老名那份在就用老名那个（**只读**），
 * 都没有就返回 `null` 由调用方去建新名。
 *
 * ⚠️ **它不建任何目录**——这是上面那条实测病的治处。建目录这件事单独由调用方在「两个都不在」
 * 的分支里做，所以「查老名」这个次序**结构上**不可能先造出一个空的新目录。
 *
 * ⚠️ **新名优先**：两套都在时返回新名那个（老名那份不认领），并由
 * {@link legacyDirConflicts} 把这件事**显式报出来**——静默取其一就是「老书里少了半本书」
 * 的另一种写法，而没人会知道少的是哪一半。
 *
 * ⚠️ **它只答「该用哪一份」，不答「怎么建」**：所以**调用方自己拿到的判法必须逐字一样**
 * （不许有人把它改写成 `existsSync(legacy) && !existsSync(current)` 那种反向形式再抄一遍——
 * 那是同一个意思的**第二份**，`test-legacy-book-read.mjs` 的「单一判法」那几格专门盯这件事）。
 *
 * @param {string} current 新名那一份的绝对路径
 * @param {string|null} legacy 老名那一份的绝对路径（无老名对应段时传 `null`）
 * @returns {string|null} 该用哪一份；两个都不在时 `null`
 */
function existingBookDir(current, legacy) {
  if (existsSync(current)) return current
  if (legacy !== null && existsSync(legacy)) return legacy
  return null
}

/**
 * 工作区目录——**书夹相对形状的唯一持有者**。
 *
 * 收编前它是 engine.js 里一个私有的 `workDir`，而书夹形状的知识散在十几处手写的旧名路径字面量。
 * 现在它住在 `paths.js`（本簇就是「位置」）并由 engine 再导出：**老调用点一行未改**，
 * 而新形状（清单／登记／细目／报告／方案）与它同源，改目录名时只有一处要动。
 *
 * ⚠️ **老书兜底**：只有老名那一份在时返回它（**不建新名那一份**）；两套都在时返回新名并被点名。
 *
 * @param {string} projectId
 * @returns {string} 绝对路径
 */
export function workDir(projectId) {
  const bookRoot = projectDir(projectId)
  const current = join(bookRoot, WORK_DIR_NAME)
  const hit = existingBookDir(current, join(bookRoot, LEGACY_WORK_DIR_NAME))
  if (hit !== null) return hit
  mkdirSync(current, { recursive: true })
  return current
}

/**
 * 工作区里的一个文件（`工作区/<name>`）——**绝对落点的唯一守卫点**（票 `stage-state-facts/01` 从
 * `engine.js` 搬来；`workFile` 的 55 个调用点一行未改，engine 仍再导出它）。
 *
 * ⚠️ `name` 是**基名**，不是书夹相对路径：`workFile(p, 'chapter-01.md')` ⇒ `工作区/chapter-01.md`
 * （给成 `工作区/chapter-01.md` 会拼成 `工作区/工作区/…`）。
 * ⚠️ 越界守卫只此一处（`docs/测试信任边界.md`；`src/path-guard.js` 的落点表第 4 行）。
 *
 * @param {string} projectId
 * @param {string} name 工作区下的基名
 * @returns {string} 绝对路径
 */
export function workFile(projectId, name) {
  const dir = workDir(projectId)
  const target = resolve(dir, name)
  if (!isWithin(dir, target)) {
    throw new Error(`非法文件路径: ${name}`)
  }
  return target
}

/**
 * 某章的两份产物路径（正文＋同号检查件）——**章级那条路唯一的路径解析**（票
 * `stage-state-facts/01` 从 `engine.js` 搬来，engine 仍再导出；6 个调用点一行未改）。
 *
 * ⚠️ `file`／`audit` 是**基名**（喂给 `workFile`），不是书夹相对路径：给成 `chapterRel` 会读成
 * `工作区/工作区/chapter-NN.md`（票 `depth-review-2026-10/05` 的实撞）。
 * ⚠️ 审计族的基名出口在 `domain-rules.auditName`，本函数不手拼第二份。
 *
 * @param {string} projectId
 * @param {number} n 1 起的章号
 * @returns {{file: string, audit: string, chapterPath: string, auditPath: string}}
 */
export function chapterArtifacts(projectId, n) {
  const file = chapterName(n)
  const audit = auditName(n)
  return { file, audit, chapterPath: workFile(projectId, file), auditPath: workFile(projectId, audit) }
}

/**
 * 方案目录（`工作区/方案/`）：每一次拍板的方案（含修订版）。票 `13` 从书夹根下平级的一层搬进工作区。
 *
 * ⚠️ 老名那一份在**书夹根下**（不是老工作区底下），所以兜底判的是**另一个绝对路径**——
 * `join(projectDir(id), <老名>)`，不是 `join(workDir(id), …)`。
 *
 * ⚠️ **「新名那一份」的落点必须经 {@link workDir} 算**：老书上它返回**老名那一份**
 * （且不建任何目录），直接 `join(projectDir(id), WORK_DIR_NAME, PROPOSAL_DIR_NAME)` 会算错落点。
 */
export function proposalDir(projectId) {
  const currentBase = workDir(projectId)
  const legacy = join(projectDir(projectId), LEGACY_PROPOSAL_DIR_NAME)
  const hit = existingBookDir(join(currentBase, PROPOSAL_DIR_NAME), legacy)
  if (hit !== null) return hit
  return ensureDirUnder(currentBase, PROPOSAL_DIR_NAME)
}

/** 过程目录（`过程/`）：票 `10` 新建（登记），票 `13` 把关键节点存档搬进来。**没有老名对应段**。 */
export function processDir(projectId) {
  const dir = join(projectDir(projectId), PROCESS_DIR_NAME)
  mkdirSync(dir, { recursive: true })
  return dir
}

/**
 * 存档目录（`过程/存档/`）：回退快照与定点修改存档。票 `13` 从书夹根下平级的一层搬进 `过程/`。
 *
 * ⚠️ 老书兜底时**先查老名再谈建 `过程/`**：顺序反了就会在一本老书上凭空长出空的
 * `过程/` 与 `过程/存档/`，而定点修改的存档随后会被写进那个空目录——真书上的存档**读不回来**。
 * 所以 {@link processDir}（它**会**建目录）**只出现在「两个都不在」那一支**，
 * `existingBookDir` 那一行绝不许提前把它调起来。
 */
export function archiveDir(projectId) {
  const bookRoot = projectDir(projectId)
  const legacy = join(bookRoot, LEGACY_ARCHIVE_DIR_NAME)
  const hit = existingBookDir(join(bookRoot, PROCESS_DIR_NAME, ARCHIVE_DIR_NAME), legacy)
  if (hit !== null) return hit
  return ensureDirUnder(processDir(projectId), ARCHIVE_DIR_NAME)
}

/** 材料目录（`材料/`）：票 `13` **新建**（转换稿搬进来才有它）。`材料/原件/` 归票 `14`，本段只建这一层。 */
export function materialDir(projectId) {
  const dir = join(projectDir(projectId), MATERIAL_DIR_NAME)
  mkdirSync(dir, { recursive: true })
  return dir
}

/**
 * 转换稿目录（`材料/转换稿/`）：由原件转出的 Markdown。票 `13` 从书夹根下平级的一层搬进 `材料/`。
 *
 * ⚠️ 同 {@link archiveDir}：{@link materialDir} 会建目录，只许在「两个都不在」那一支里调。
 */
export function convertedDir(projectId) {
  const bookRoot = projectDir(projectId)
  const legacy = join(bookRoot, LEGACY_CONVERTED_DIR_NAME)
  const hit = existingBookDir(join(bookRoot, MATERIAL_DIR_NAME, CONVERTED_DIR_NAME), legacy)
  if (hit !== null) return hit
  return ensureDirUnder(materialDir(projectId), CONVERTED_DIR_NAME)
}

/** `工作区/产物清单.json`：本书**应当有什么**（建档时探形状生成、书内只读）。 */
export function artifactManifestPath(projectId) {
  return resolve(workDir(projectId), MANIFEST_FILE_NAME)
}

/** `过程/登记.json`：本书**实际有什么**（机器每次扫盘写回）。 */
export function artifactRegistryPath(projectId) {
  return resolve(processDir(projectId), REGISTRY_FILE_NAME)
}

/** `工作区/细目/`：小助手产的全文细目（票 `11` 接线落盘）。 */
export function detailDir(projectId) {
  return ensureDirUnder(workDir(projectId), DETAIL_DIR_NAME)
}

/** `工作区/报告/`：审计与检查报告（票 `11`／`12` 接线落盘）。 */
export function reportDir(projectId) {
  return ensureDirUnder(workDir(projectId), REPORT_DIR_NAME)
}

/**
 * `工作区/分片/`：章正文的**分片**（票 `walkthrough-2026-10/02`：子助手只落分片、章正文由机器拼）。
 *
 * ⚠️ **本函数是纯解析，不建目录**（与上面两个不同）：那一层目录里**机器一个字节都不写**——
 * 分片由写作小助手用自己的文件工具落盘，机器只**读**它、然后把拼装件写到工作区根。
 * 读一件事实不许有副作用：本仓已经栽过一次「读的动作把空目录建出来、把老目录遮住」
 * （票 `context-budget/13` 的实测），所以这里连 `ensureDirUnder` 都不走。
 *
 * ⚠️ 它**没有老名对应段**（结构上不参与老书兜底判法），与 `detailDir`／`reportDir` 同一档。
 */
export function chapterShardDir(projectId) {
  return join(workDir(projectId), CHAPTER_SHARD_DIR_NAME)
}

/** 在 `base` 下建并返回一个子目录（形状解析一律走它，不许在别处手写 `join(workDir(...), …)`）。 */
function ensureDirUnder(base, name) {
  const dir = join(base, name)
  mkdirSync(dir, { recursive: true })
  return dir
}

/**
 * 这个书夹里**两套名同时存在**的段——逐条点名，不静默。
 *
 * ⚠️ **为什么必须报出来**：解析层按「新名优先」取其一（{@link existingBookDir}）。
 * 老书接着往下造书时，新产品落进新名那一份，于是两套并存——**这不是兼容层失灵，是「老名读、
 * 新名写」这一层的正常结局**（spec 范围外不做一次性搬迁）。但它必须被说出来：
 * 界面上老的那一份会被新名**遮住**，而用户看到的是「我明明有产物，怎么少了一半」。
 * 不报＝兼容层把「少东西」这件事藏起来了，那比不兼容更坏。
 *
 * ⚠️ 这里只**看目录在不在**，不去碰任何文件，也不建任何目录——报一件事实不许有副作用。
 *
 * ⚠️ **三个键各有各的意思，不许混**（原先 `segment` 与 `current` 同值不同义，是一处神秘命名）：
 * `segmentName` 是**裸段名**（如 `方案`），`currentRel`／`legacyRel` 是**书夹相对形状**
 * （如 `工作区/方案`、`提案`）。取值域闭式，逐条都由 {@link LEGACY_DIR_RELS} 那一族推出来。
 *
 * @param {string} projectId
 * @returns {{segmentName: string, legacyRel: string, currentRel: string}[]} 逐段点名（空数组＝没有并存）
 */
export function legacyDirConflicts(projectId) {
  const bookRoot = projectDir(projectId)
  const probes = [
    { segmentName: WORK_DIR_NAME, legacyRel: LEGACY_WORK_DIR_NAME, currentRel: WORK_DIR_NAME },
    { segmentName: PROPOSAL_DIR_NAME, legacyRel: LEGACY_PROPOSAL_DIR_NAME, currentRel: `${WORK_DIR_NAME}/${PROPOSAL_DIR_NAME}` },
    { segmentName: ARCHIVE_DIR_NAME, legacyRel: LEGACY_ARCHIVE_DIR_NAME, currentRel: `${PROCESS_DIR_NAME}/${ARCHIVE_DIR_NAME}` },
    { segmentName: CONVERTED_DIR_NAME, legacyRel: LEGACY_CONVERTED_DIR_NAME, currentRel: `${MATERIAL_DIR_NAME}/${CONVERTED_DIR_NAME}` },
  ]
  return probes
    .filter(({ legacyRel, currentRel }) => existsSync(join(bookRoot, legacyRel)) && existsSync(join(bookRoot, currentRel)))
    .map(({ segmentName, legacyRel, currentRel }) => ({ segmentName, legacyRel, currentRel }))
}

/**
 * 书夹相对路径（**规范形状**）→ 盘上真实落点；新名那份不在、老名那份在时返回老名那一份。
 *
 * ⚠️ **它不是 {@link normalizeBookRel} 的反向**——归一是单向的分类键转换，纯函数、不碰盘；
 * 这一段是「分类键 → 盘上落点」的第二步，**方向恰好相反，因为它答的是「文件在哪」而不是
 * 「它是什么」**。两条混在一起就会有人拿它去归一，于是新名路径被映成老名。
 * 老名字面量只取 `domain-rules` 的 `LEGACY_DIR_RELS` 那一份配对表，本函数**不另抄**；
 * **斜杠归一那一半也取 `domain-rules.posixBookRel`**（原先在这里手抄了一遍「反斜杠折成 `/`」
 * 加「去 `./` 前缀」两步——归一的**单一出处**在 `domain-rules`，抄第二份就是第二份量法）。
 * 兜底判法**与那四个段解析函数共用 {@link existingBookDir}**：四条配对逐条过它，
 * 命中即返回（`current` 那份在不在由它自己先判，不必在本函数里重写一遍）。
 *
 * **谁用**：读通道（`/textbook/file`）与交办说明里那些指针（`brief.references` 逐字写的是
 * **规范形状**，而老书盘上是老名那一份）——不落这一步，界面上每一条「打开」在老书上都 404。
 *
 * @param {string} projectId
 * @param {string} rel 书夹相对路径（规范形状）
 * @returns {string} 绝对路径（新名那份；不在时退回老名那份）
 */
export function bookRelOnDisk(projectId, rel) {
  const bookRoot = projectDir(projectId)
  const normalized = posixBookRel(rel)
  const current = resolve(bookRoot, normalized)
  for (const pair of LEGACY_DIR_RELS) {
    if (!normalized.startsWith(pair.current)) continue
    const hit = existingBookDir(current, resolve(bookRoot, `${pair.legacy}${normalized.slice(pair.current.length)}`))
    if (hit !== null) return hit
  }
  return current
}