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
 * ## 落点协议（票 `depth-round-3/07`）：调用方给的相对名怎么安全落到书夹内
 *
 * 本 module 只提供**一个谓词**（`isWithin`）。「安全落点」这件事在仓里其实有**两套**用法，
 * 此前只写在 `src/workflow.js` 一条读取路由上方的注释里——别的调用点各按自己的理解走。
 * 本节把两套写成明文，并**逐个核过五个调用行**（2026-10-19）。
 * ⚠️ 本节是**现状描述**，不是新接口：`isWithin(root, target, p)` 的名字与签名被
 * `docs/adr/0032-书夹形状收口.md` 的波及面表 B9 行与 `test/test-path-guard.mjs` 钉着（⛔ 不许动），
 * 也⛔ 不引入 `resolveInside(root, rel)` 那种新形状（理由见「那个盖不住的形状」）。
 *
 * ### 两道
 *
 * 1. **第一道（词法）**：`resolve`／`join` 归一之后调一次 `isWithin(root, target)`。
 *    它只回答「按字符串算，落点是不是在 root 底下」；**不碰盘**，target 不必存在。
 * 2. **第二道（实物）**：对**已存在**的落点做 `realpathSync`，再判一次
 *    `isWithin(realpathSync(root), realpathSync(target))`。它回答第一道答不了的那件事：
 *    路径上任意一段是符号链接时，**真实落点**还在不在 root 里。
 *    （落点尚不存在的写盘路径：第二道只能对**最近已存在的祖先**做——今天仓里没有这样一处实现。）
 *
 * 第一道**永远要在**；第二道**不是**第一道的替代，是追加。
 *
 * ### 什么时候必须做第二道
 *
 * - **不碰盘**（只拿名字做判断、算地址、拼回包）⇒ 只做第一道。第二道此时**做不到**：
 *   target 不存在，`realpathSync` 会抛。
 * - **碰盘（读或写）且名字来自用户输入**（HTTP query／body、任何用户可写的名字面）⇒ **必须**第二道。
 *   读已存在的件：`realpath(root)` ＋ `realpath(target)`；写尚不存在的件：`realpath(root)`
 *   ＋ **最近已存在祖先**的 `realpath`。
 * - **碰盘但名字来自内部派生**（常量名、编号派生名 `chapter-NN.md`、`basename`／白名单／正则
 *   收窄过的名字）⇒ 只做第一道。第二道此刻不是「更安全一点」：它守的前提是
 *   「用户能把符号链接塞进书夹」，内部派生的名字给不出这个前提；而它要付一次 `realpath`，
 *   对写盘路径还**不成立**。
 *
 * 分界不是「谁把名字传进来的」，是**这个名字面用户能不能自己造**。拿不准时按「用户输入」算
 * （做第二道，或先把名字收窄成白名单／正则再进来）。
 *
 * ### 五个调用行各属于哪一档（`src/` 全域逐行数过，`isWithin` 只有这五处调用）
 *
 * 五个**调用行**落在**四处**代码位置：`workflow.js` 的两条路由占三行（`handleFile` 两道 ＋
 * `handleDownload` 一道）——票面写「两处」说的是路由，命令数出来的是行。
 *
 * | # | 位置（函数名 ＋ 代码原文锚；⛔ 不写行号——行号会漂） | rel／target 从哪来 | 该走几道 | 今天走几道 |
 * | --- | --- | --- | --- | --- |
 * | 1 | `src/workflow.js` 的 `handleFile` 里第一处 `if (!isWithin(root, target))` | 同一函数里的 `const rel = url.searchParams.get('path')` ⇒ **用户输入**；`target = bookRelOnDisk(project, rel)`（老名兜底也只换书夹内的段名） | 两道 | **两道** |
 * | 2 | `src/workflow.js` 的 `handleFile` 里第二处 `if (!isWithin(realpathSync(root), realpathSync(target)))` | 同一函数里那个 `rel`；对 `realpathSync(root)`／`realpathSync(target)` 再判一次（同一函数里上面那处 `existsSync(target)` 已确认 target 存在） | 两道 | **两道** |
 * | 3 | `src/workflow.js` 的 `handleDownload` 里 `if (!isWithin(root, target))` | 同一函数里的 `const rel = url.searchParams.get('path')` ⇒ **用户输入**；`target = resolve(root, rel)`（`root = resolve(projectDir(project))`） | 两道 | **两道**（票 `depth-round-3/09` 补上第二道：`existsSync` 之后按 `realpathSync` 再判一次） |
 * | 4 | `src/workflow/engine/paths.js` 的 `workFile`（`function workFile(projectId, name)`）里 `if (!isWithin(dir, target))` | **内部派生**：常量名（`'book.md'` 等）、`chapterName(n)`／`auditName(n)`／`goldAuditName(n)`、`basename(productRel)`（产物表）；唯一受外部文本影响的一处是 `src/workflow/actions/chapters.js` 里取 `proposal-[\w.-]+\.md` 的那条正则（「见／详见」两选一打头），只可能在 `工作区/` 下给出一个固定形状的名字 | 一道 | **一道** |
 * | 5 | `src/mineru-lib.js` 结果 zip 解包里 `const target = join(item.outDir, zipEntry.entryName)` ＋ `if (isWithin(item.outDir, target))` | **算好的绝对路径**；`entryName` 来自远端 zip 回包（非用户输入），`outDir` 是当场 `mkdirSync` 的新目录、目录名由 `sanitizeFolderName` 收成单段 | 一道 | **一道** |
 *
 * 取样（⚠️ 先跑命令再读这一节；**本表故意不写行号**——位置一律是「函数名 ＋ 代码原文锚」，
 * 行号由下面这些命令现取；「五处」以第一条命令的输出为准）：
 *
 * ```powershell
 * # ① 五个调用行一共几处（每个 isWithin( 调用都在这一条的输出里）
 * Select-String -Path src\workflow.js,src\workflow\engine\paths.js,src\mineru-lib.js -Pattern 'isWithin\('
 * # ② 第 1／2 行：handleFile 的两道 ＋ 它的 rel 来源
 * Select-String -Path src\workflow.js -Pattern 'function handleFile','if \(!isWithin\(root, target\)\)','isWithin\(realpathSync'
 * # ③ 第 3 行：handleDownload 那一处
 * Select-String -Path src\workflow.js -Pattern 'function handleDownload','if \(!isWithin\(root, target\)\)'
 * # ④ 第 4 行：workFile 那一处 ＋ 那个受外部文本影响的正则
 * Select-String -Path src\workflow\engine\paths.js -Pattern 'function workFile','if \(!isWithin\(dir, target\)\)'
 * Select-String -Path src\workflow\actions\chapters.js -Pattern 'proposal-'
 * # ⑤ 第 5 行：解包那一处的 target 拼法与判定
 * Select-String -Path src\mineru-lib.js -Pattern 'join\(item\.outDir, zipEntry\.entryName\)','isWithin\(item\.outDir'
 * ```
 *
 * 钉住这个谓词的两处（⛔ 改名前先看这里）：
 * `Select-String -Path docs\adr\0032-书夹形状收口.md,test\test-path-guard.mjs -Pattern 'isWithin'`
 * ⚠️ **别拿 `test-book-shape-closure.mjs` 证这件事**：那份文件里 `isWithin` 零命中
 * （取样：`Select-String -Path test\test-book-shape-closure.mjs -Pattern 'isWithin'` → 空）；
 * 它的相关面是**把 `docs/adr/0032` 当判据输入**，不是钉这个符号。
 *
 * ### 那个盖不住的形状：`mineru-lib.js` 解包收的是**算好的绝对路径**
 *
 * 五个调用行收的是**两种**输入：多数传 `rel` 再自己归一成绝对路径，解包那一处直接传
 * `join(outDir, entryName)`。所以 `resolveInside(root, rel)` **盖不住**它——它不是「少一个参数」，
 * 是**两种输入**。`isWithin(root, target)` 对两者都成立（target 本来就可以是绝对路径），
 * 落点协议因此记在**调用点**上，而不是收进一个新接口。
 * ⛔ 不要为了「五个调用点各缩成一行」去加那个接口：它会把「名字从哪来、该走几道」
 * 这个判断藏进一个看起来更安全的函数里，而五行的差别恰恰在**那个判断**上。
 * 解包那一处也不该补第二道：`entryName` 不是用户能造的名字面，解包只写普通文件
 * （`writeFileSync` 不会造符号链接），`outDir` 是当场新建的单段目录。
 * 若日后有人把 `outDir` 换成用户可造的路径，这一行要**重新判**（那时它就从「一道」变成「必须两道」）。
 *
 * ### 边界照实说（别把这一节读成一道闸）
 *
 * - 本节列的是 **`isWithin` 的调用点**，不是「仓里所有拼路径的地方」。不经 `isWithin` 的拼装
 *   （例如 `engine.js` 的 `archiveWorkArtifacts` 对 `{rel}` 用 `join(bookRoot, ...rel.split('/'))`）
 *   不在这份协议里——它们的名字来自内部产物清单，判据归各自那一处。
 * - 本节**不产判据**：`test/test-path-guard.mjs` 只证谓词本身（POSIX 模拟 ＋ 本平台两档），
 *   **不证**上面五个调用行真的按这一节走；「逐个核过」是 2026-10-19 的一次人工核对，不是一道闸
 *   （票 `depth-round-3/07` 的判据强度声明）。
 * - 读侧兜底（`bookRelOnDisk` 的「新名 → 盘上老名」）**不是**越界旁路：它返回的落点照样过
 *   `handleFile` 的那两道判定（那条路由的注释与此处同一口径）。
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
