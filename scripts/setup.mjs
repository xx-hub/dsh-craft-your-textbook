#!/usr/bin/env node
/**
 * 造书工作台 · 一键安装脚本（给安装方用）
 *
 * 用法：
 *   npx dsh-craft-your-textbook              用默认 web profile 安装
 *   npx dsh-craft-your-textbook --profile tui 装到别的 profile
 *
 * 做五件事：
 *   0. **先探测宿主版本**——低于最低支持版本就**明确报错并以非零退出，一个文件都不写**
 *   1. 用 `dsh plugin` 把本插件装进 profile（等价于 pnpm add）——**装的是带版本号的 spec**，
 *      所以发布当天也不会被包管理器的新版本冷却挡回上一版（见 `planInstallSpec`）
 *   2. 把 dsh-craft-your-textbook 写进 profile 的 bundles 列表（没有它宿主不会挂载）
 *   3. **检测**宿主组合树里造书模式的那一行，与本包携带的声明补丁逐项比对并如实报告
 *   4. 提醒重启并**新开会话**，并给出「怎么确认真的注册上了」的那条命令
 *
 * ── 第 0 步：为什么它在**装之前**，而不是第 3 步顺便看一眼 ──────────────────────
 *
 * ADR-0022 决策 1：**不回头，不双轨**。0.1.7 之前的宿主用的是**另一套**模式机制
 * （扫 `<DSH_HOME>/.agent-presets/` 目录），而本包发出的是**一条普通 Loader 行**
 * （bundle 补丁层）。两者**不同形**，装上去的结果是「看起来装好了、模式选择器里没有
 * 造书模式」——那正是 1.2.0 那次发布的事故本身。
 *
 * 所以这一档必须在**任何写动作之前**判：第 1 步会把插件装进 profile、第 2 步会把本包写进
 * bundles，那两步都**留痕**。等第 3 步才发现宿主太老，用户手上已经多了一个装不上的部署。
 * 判出来就 `return 1`，**一个文件都不写**——「不装」是这一档的字面意思。
 *
 * **探测不猜**：`readHostVersion` 只报 `dsh --version` 自己印出来的那一串；读不出就说
 * 读不出（`unreadable` 那一档），**不拿默认值糊过去**，也不拿「装下去看看」代替判断。
 * 读不出时本安装器**不拦你**，但也**不当它通过了**——第 3 步会自己去读组合树如实报告。
 *
 * ── 第 3 步：它**不写任何文件**（ADR-0022 决策 3）────────────────────────────
 *
 * 造书模式现在是一条**普通 Loader 行**，由本插件包随 bundle 发出的
 * `preset/textbook.patch.yml` 声明。宿主**每次启动**重算组合树（用户 profile 层的
 * 覆盖排在最后、永远赢，ADR-0022 决策 4），所以：
 *
 *   - 盘上**没有**一份「安装副本」可写——0.1.7 之后宿主不再扫 `.agent-presets/`；
 *   - 这一行**没有任何机制能保护**，它只能被**检测**；
 *   - 因此第 3 步是**读 + 比 + 说**：一致就确认（不宣称「装了什么」，因为不是它装的），
 *     偏离就**点名差在哪**并以非零退出。
 *
 * ## 这一层的档位为什么是五档，不是 install-sync.js 的五档加一档
 *
 * `dev/mode-capability-baseline/install-sync.js` 那套五态分类**仍然完整地活着**，在**维护者
 * 路径**上（`cli.mjs sync`）：它读的是一份**文件**，所以「文件在但不是一份可读的模式声明」
 * （`unreadable`）是一个真实存在的第五种现状。
 *
 * 本安装器读的是**一次 `dsh --dump-config` 的输出**——「文件在不在」这件事在它这里根本不是
 * 判据。读不出只有两种，两种修法也各不相同：
 *   - **整棵树没取到**（dsh 跑不起来／返回非零／根本没有 dsh）→ `not-judged`：**证据压根没
 *     拿到**，这一轮**没有判定**。空差异不等于一致。
 *   - **树取到了，里面没有那一行**（插件没装进 profile／装的是不带补丁的旧版本）→ `absent`。
 *
 * 所以这里**删掉**了 `unreadable`：留着一条产不出它的分支，下一个人会以为它在防什么，而
 * 它其实什么都不防（2026-09-28 实测 `classifyModeInstall` 的可达集合只有
 * `in-sync` / `drifted` / `user-modified` / `absent` / `not-judged`）。**这不是「五档塌了」**
 * ——五档分类在维护者路径上一档没少；是**这一层的主体换了**，档位按它拿得到的信息量重新分。
 *
 * ## 报告的深度：哪些是这里算的，哪些不是
 *
 * 三类差异**分开命名**，因为它们的修法完全不同：
 *   - **显示元数据差异**：声明行上那几项标量，逐字段点名（这里算得了）；
 *   - **结构差异**：实现条目的集合／次序／配置（这里算得了，逐行启发式）；
 *   - **能力差异**：**本安装器算不了**——能力身份归一化与折叠块标量正文都要 DSH 的
 *     loader 方言，而那套判据住在 `dev/`，**不进 npm 成品**。所以这里**不报空清单**，
 *     而是报「本安装器算不出」＋它能算的那条命令。报空清单就是「有结论、没清单」。
 *
 * 只用到 Node 内置模块，不依赖任何第三方包。
 *
 * ## 硬要求：任何输入下都不吐 Node 堆栈
 *
 * 发布包坏了、dsh 跑不起来、`--dump-config` 输出不是它该有的样子——这些都必须变成
 * **一句说人话的错误 ＋ 非零退出**，不是未处理的 `ENOENT`。`main()` 整段被
 * `runInstaller` 包住，任何漏出去的异常都在那里变成人话。
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG_DIR = join(HERE, '..')

/**
 * 造书模式的四个身份事实。**它们不是一回事**，混淆任何一个都会出具体的病：
 *
 *  - `MODE_ID`（`textbook`）是 `config.id`——**模式身份**，会话保存的是它；
 *  - `MODE_ROW_ID`（`preset-textbook`）是行上的 `id`——**Loader 编辑地址**，
 *    用户 profile 层按它覆盖，插件包出的就是这一行；
 *  - `MODE_DECLARATION_MODULE` 是行上的 `name`——挂的哪个插件（改错它就不注册成模式）；
 *  - `PRESET_PATCH_FILE` 是本包携带的那份声明补丁（生成物，登记在 `dsh.bundle.patch`）。
 */
export const MODE_ID = 'textbook'
export const MODE_ROW_ID = 'preset-textbook'
export const MODE_DECLARATION_MODULE = '@deepseek-ai/dsh-agent-preset'
export const PRESET_PATCH_FILE = 'textbook.patch.yml'

/**
 * 最低支持宿主版本（ADR-0022 决策 1：`<0.1.7` 明确报错退出，不双轨）。
 *
 * ## 最低版本**从哪来**：这里硬编码，判据是「机制在这一版换掉了」
 *
 * 候选有三条，选了第一条：
 *
 *  1. **硬编码在这里（本文件）**。`dev/mode-capability-baseline/preset-registration.js`
 *     里有**同一个常量**（`MINIMUM_HOST_VERSION`），那一份是注册门禁的判据层，按纪律
 *     **不许有任何 I/O**（`test-preset-registration-gate.mjs` 的「接缝闭包」钉着），
 *     所以它也没法从 `package.json` 读。剩下能跨层复用的只有**硬编码**。
 *     两份之间的漂移由 `test-mode-capability-baseline.mjs` 里一条**指名两处**的断言
 *     兜住：任一份单独改，另一份立刻红。
 *  2. 从 `package.json` 读 → 判据层要做 I/O，破坏「判据不许碰盘」这条纪律；而且
 *     `dsh` 那个命名空间是**宿主契约**，往里加自己的键等于给宿主递一份没打过招呼的形状。
 *  3. 运行时去读 DSH 安装根的 manifest → 用户手上未必装得出那个形状（全局 shim、
 *     pnpm store、corepack 各不相同），那是一条**要猜**的读法，正是本票要治的病。
 *
 * 预发布号按**发布号**比：`0.1.7-rc.2` 与 `0.1.7` 同档——rc 是 0.1.7 的候选，不是 0.1.6。
 */
export const MINIMUM_HOST_VERSION = '0.1.7'

/** 0.1.7 之前宿主扫的那个目录。**宿主已经不读它了**（ADR-0022 决策 1／6）。 */
export const LEGACY_PRESET_DIR_SEGMENTS = Object.freeze(['.agent-presets', 'textbook'])

/** 旧目录退役后的备份落点：同级的 `<目录名>.retired`。见 `retireLegacyPresetDir`。 */
const LEGACY_RETIRED_SUFFIX = '.retired'

function usage() {
  console.log(`造书工作台 · 一键安装

用法：
  npx dsh-craft-your-textbook               安装到默认的 web profile
  npx dsh-craft-your-textbook --profile tui 安装到指定 profile
  npx dsh-craft-your-textbook --upgrade     升级到当前最新的一版

第 3 步**不再往任何目录写文件**——造书模式现在由本插件包随 bundle 发出的
preset/textbook.patch.yml 声明，宿主每次启动重算组合树。旧机制留下的
~/.dsh/.agent-presets/textbook/ 会被改名为 <目录名>.retired 保留下来（宿主已不再读它）。

装之前会先读宿主版本：低于 ${MINIMUM_HOST_VERSION} 会**直接报错退出、一个文件都不写**
（那一版的宿主用的是另一套模式机制，本包不双轨）。

── 为什么要有 --upgrade ──
dsh 装插件时把你的 profile 记成 \`"<包名>": "^<装上的那一版>"\`。这个范围本来允许装更新的，
但包管理器**认已经记下来的那一版**，不会自己回头去看有没有新的——所以「卸载再装一次」
也升不了级。--upgrade 就是先把那一行改掉，再让 dsh 重新装一次。

安装后请重启 dsh 并**新开**一个会话（已经开着的会话不会换组合）：
  新会话 → 模式选「造书模式」→ 中间会出现「工作台」页签。`)
}

/* ── 第 0 步：宿主版本探测（只读，一个文件都不写） ──────────────────────────── */

/** 这一层能产出的三档。**多一档就会有人问它是什么意思**；少一档就会把「不知道」塞进
 * 「够／不够」里——那正是 1.2.0 那句「✅ 造书模式已就位」的形状。 */
const HOST_VERSION_STATES = new Set(['meets-minimum', 'below-minimum', 'unreadable'])

/**
 * 一段文本 → 宿主版本读数。**只认 `v?数字.数字.数字` 那一个形状**，别的（`dsh 0.1.7`、
 * `unknown`、`1.2`）一律**照实说读不出**——判据不猜。
 *
 * `0.1.7-rc.2` 与 `0.1.7` 归成**同一档**（`release` 是三个发布号），判的是「机制换没换」，
 * 不是「rc 够不够稳」（与 `preset-registration.js` 的 `parseHostVersion` 同一口径）。
 */
export function parseHostVersion(raw) {
  const text = String(raw ?? '').trim()
  const matched = /v?(\d+)\.(\d+)\.(\d+)(?:[-+][^\s]*)?/u.exec(text)
  if (matched === null) {
    return { ok: false, code: 'host-version-unreadable', raw: text, detail: `读不出宿主版本号：${text === '' ? '(空)' : text}` }
  }
  return { ok: true, raw: matched[0], release: [Number(matched[1]), Number(matched[2]), Number(matched[3])] }
}

/** 两个读数比大小：`-1 / 0 / 1`。任一读不出就抛——判据不猜。 */
export function compareHostVersions(left, right) {
  const a = parseHostVersion(left)
  const b = parseHostVersion(right)
  if (a.ok === false) throw new TypeError(a.detail)
  if (b.ok === false) throw new TypeError(b.detail)
  for (let index = 0; index < 3; index += 1) {
    if (a.release[index] !== b.release[index]) return a.release[index] < b.release[index] ? -1 : 1
  }
  return 0
}

/**
 * Windows 上全局 shim 是 `dsh.cmd`，**不经 shell 根本 spawn 不起来**。
 *
 * 实测（2026-09-28，本机 Node）：`spawnSync('dsh.cmd', ['--version'])` 恒定返回
 * `error.code === 'EINVAL'`、`status === null`；加上 `shell: true` 才跑得起来。
 * 所以宿主版本这一条**必须**走 shell，否则它在每一台 Windows 机器上都恒为「读不出」。
 *
 * 这么做的**安全前提**：这里传的参数是**写死的** `['--version']`，一个字节都不来自用户
 * 输入，所以不存在「参数拼进命令行」的注入面。与第 1 步不同——那一步的 `--profile` 来自
 * 命令行，**不许**照抄这个写法。
 *
 * 顺带把带 shell 元字符的 `dshBin` 拒掉：它不是 dsh 命令，跑了也只会得到一句看不懂的报错。
 */
/**
 * 「这个 bin 要不要经 shell」——**一处**判定，三处调用共用。
 *
 * ## 为什么要有这一处
 *
 * Node 在 Windows 上**不经 shell 跑不了** `.cmd`／`.bat` shim：
 * `spawnSync('dsh.cmd', …)` 恒返回 `EINVAL`。而宿主 CLI 在 Windows 上正是 npm/pnpm 装的
 * 那层 shim，所以不经 shell 就等于「装不上插件、读不到组合树」，而这两种失败长得**都不像**
 * 宿主的问题：第 1 步落进「请手动执行」的兜底分支（用户以为装完了，其实没有），第 3 步报
 * `not-judged` 非零退出（装对了也报红）。
 *
 * 经 shell 就意味着**那串 bin 会被命令解释器读一遍**，所以带 shell 元字符
 * （`&` `|` `<` `>` `^` `%` `!` `(` `)` `"` 换行）的 bin 一律**拒绝执行**——不猜、不清洗，
 * 直接不做。
 *
 * ⚠️ **三处调用不许各写一遍**（票 `ship-mode-installable/01`）：版本探测早就有这个形状，
 * 第 1 步与第 3 步漏了，于是同一个缺陷在一次安装里出现两次、修的时候又得改两处。
 * `test-mode-capability-baseline.mjs` 有一条断言钉着「本文件里 `spawnSync(` 只出现一处」。
 */
export function isWindowsShimBin(bin, platform = process.platform) {
  return platform === 'win32' && /\.(cmd|bat)$/iu.test(String(bin))
}

/** 带 shell 元字符的 bin → 拒绝执行。返回人话原因，不抛。 */
function rejectReasonOf(bin) {
  return /[&|<>^%!()"\n\r]/u.test(String(bin))
    ? `dsh 命令路径里有 shell 元字符，拒绝执行：${bin}`
    : null
}

/** 一处 shell 引号：参数里可能有空格（`--profile` 的值、路径），不做引号就会被拆成两个词。 */
function quoteForShell(value) {
  return `"${String(value).replace(/"/gu, '""')}"`
}

/** 宿主 CLI 的唯一出口：拒绝判定与 Windows shim 判定都在这里，别处不许直接 spawn。 */
function spawnHost(bin, args, spawnOptions = {}) {
  const rejected = rejectReasonOf(bin)
  if (rejected !== null) {
    return { error: Object.assign(new Error(rejected), { code: 'host-cli-rejected' }) }
  }
  if (!isWindowsShimBin(bin)) return spawnSync(bin, args, spawnOptions)
  // 走 shell 时**自己把命令行拼好并逐个加引号**，而不是把 args 数组交给 Node：
  // ① 那样会触发 DEP0190（args 不转义、直接拼接），用户终端上多一行安全警告；
  // ② 参数里的空格会被拆成两个词（`--profile` 的值、含空格的路径都会中招）。
  return spawnSync([bin, ...args].map(quoteForShell).join(' '), { ...spawnOptions, shell: true })
}

function spawnHostCli(bin, args, spawnOptions = {}) {
  return spawnHost(bin, args, { encoding: 'utf8', timeout: 60000, ...spawnOptions })
}

/**
 * 读宿主版本：`dsh --version` 自己印出来的那一串。
 *
 * **读得到什么算什么**——这是票面点名的那条纪律：
 *   - stdout 里有版本号就用它（哪怕返回码非零，那串仍然是它自己报的版本）；
 *   - stdout 没有再看 stderr（有些 CLI 把版本印在警告后面）；
 *   - 两处都没有 / 跑不起来 → `unreadable`，**如实报**，并把命令与输出原样带出去，
 *     让用户能自己跑一遍。**任何情况下都不塞一个默认版本。**
 *
 * 为什么只有这一个来源：读宿主安装根的 manifest 要先从全局 shim 反推安装根，
 * 全局 shim／pnpm store／corepack 各不相同——那是一条**要猜**的读法。
 * 判据层（`dev/mode-capability-baseline/preset-registration.js`）走的是 manifest，
 * 因为它拿得到 `dshRoot` 这个入参；本安装器**没有**那个入参，CLI 是它唯一诚实的来源。
 */
export function readHostVersion({ dshBin, run = spawnHostCli } = {}) {
  if (typeof dshBin !== 'string' || dshBin === '') {
    return {
      ok: false, code: 'host-cli-unavailable', source: 'dsh --version（这台机器上没找到 dsh 命令）', raw: '',
      detail: '找不到 dsh 命令，本安装器读不到宿主版本',
    }
  }
  const command = `\`${dshBin} --version\``
  let result
  try {
    result = run(dshBin, ['--version'])
  } catch (error) {
    return {
      ok: false, code: 'host-version-unreadable', source: command, raw: '',
      detail: `跑 ${command} 失败：${error?.message ?? String(error)}`,
    }
  }
  if (result?.error) {
    return {
      ok: false, code: 'host-version-unreadable', source: command, raw: '',
      detail: `跑 ${command} 失败：${result.error.message ?? result.error.code ?? '未知原因'}`,
    }
  }
  const stdout = String(result?.stdout ?? '').trim()
  const stderr = String(result?.stderr ?? '').trim()
  const fromStdout = parseHostVersion(stdout)
  if (fromStdout.ok) return { ok: true, source: command, version: fromStdout.raw, status: result?.status ?? null }
  const fromStderr = parseHostVersion(stderr)
  if (fromStderr.ok) return { ok: true, source: command, version: fromStderr.raw, status: result?.status ?? null }
  return {
    ok: false, code: 'host-version-unreadable', source: command, raw: '',
    detail: `跑 ${command} 没有读到版本号（返回码 ${result?.status ?? '(无)'}）`
      + `${stdout === '' ? '，stdout 是空的' : `，stdout 印的是「${firstLine(stdout)}」`}`
      + `${stderr === '' ? '' : `，stderr 印的是「${firstLine(stderr)}」`}`,
  }
}

function firstLine(text) {
  const line = String(text).split(/\r?\n/u)[0]
  return line.length > 80 ? `${line.slice(0, 80)}…` : line
}

/**
 * 探测读数 → 档位。**纯函数**：不 spawn、不碰盘——所以它能被单独喂读数钉住。
 *
 * 三档与三种修法：够 → 往下装；不够 → **报错退出，一个文件都不写**；读不出 → 说清读不出，
 * 往下走但**不当它通过了**（第 3 步是那一层真正的判据）。
 */
export function judgeHostVersion(probe, { minimum = MINIMUM_HOST_VERSION } = {}) {
  if (!isRecord(probe) || probe.ok !== true) {
    return finishHostVersion('unreadable', {
      version: null, minimum, source: probe?.source ?? 'dsh --version',
      detail: probe?.detail ?? '读不出宿主版本',
    })
  }
  const parsed = parseHostVersion(probe.version)
  if (parsed.ok === false) {
    return finishHostVersion('unreadable', {
      version: null, minimum, source: probe.source, detail: parsed.detail,
    })
  }
  const state = compareHostVersions(parsed.raw, minimum) < 0 ? 'below-minimum' : 'meets-minimum'
  return finishHostVersion(state, {
    version: parsed.raw, minimum, source: probe.source, detail: null,
  })
}

/** 判定的**唯一出口**：档名在册才放行——非法档名在这里就抛。 */
function finishHostVersion(state, rest) {
  if (!HOST_VERSION_STATES.has(state)) throw new Error(`内部错误：非法宿主版本档位 ${state}`)
  return Object.freeze({ ...rest, state })
}

/** 档位 → 人话。`below-minimum` 那一段是**报错**，其余两段是提示。 */
export function formatHostVersionNotice(verdict) {
  if (verdict.state === 'meets-minimum') {
    return [
      `宿主版本 ${verdict.version}（${verdict.source}）≥ 最低支持版本 ${verdict.minimum}：可以装。`,
    ]
  }
  if (verdict.state === 'below-minimum') {
    return [
      `❌ 宿主版本 ${verdict.version} 低于本包要求的最低版本 ${verdict.minimum}，**装不下去**。`,
      '   这一版的 DSH 用的是**另一套模式机制**（扫 <DSH_HOME>/.agent-presets/ 目录），',
      '   而本包发出去的是**一条普通 Loader 行**（随 bundle 发出的声明补丁）——两者不同形。',
      '   本包**不做双轨**：硬装的结果是「看起来装好了，模式选择器里没有造书模式」，',
      '   也就是 1.2.0 那次发布的事故本身（ADR-0022 决策 1）。',
      `   怎么办：把宿主升到 ${verdict.minimum} 或更高（现在这版是 ${verdict.version}），然后重跑一次。`,
      '   本次**一个文件都没有写**：装插件与登记 bundles 那两步都还没开始。',
    ]
  }
  return [
    `⚠️ 读不出宿主版本（${verdict.detail}）。`,
    '   本安装器**不拿「大概够」糊过去**：它不知道这台机器上是哪一版。',
    '   这一轮**不拦你**，但也**不当它通过了**——第 3 步会自己去读组合树并如实报告：',
    '   宿主太老的话那一行压根不会出现，它会以非零退出。',
    `   想自己确认：${verdict.source}`,
  ]
}

/* ── 逐行读法：从一份声明补丁或一份组合树里读出「声明行 + 实现条目」 ─────────── */

/**
 * 找出**声明行的位置**。
 *
 * 为什么按缩进走而不是按固定列：`--dump-config` 的输出里行在顶格、config 键在四空格；
 * 本包携带的补丁里行在四空格、config 键在八空格。两份文本的形状不同、读法必须一样，
 * 所以这里**先量出行自身的缩进**，后面每一层都相对它推。
 *
 * 认出那一行的办法是「`- id:` 之后、同一块里紧跟着 `name: '@deepseek-ai/dsh-agent-preset'`」——
 * 只看 `config.id` 会把用户自己在别处声明的同名模式认成我们这一行。
 *
 * **返回全部**符合条件的行（一份组合树里可以有好几行：插件包那一行 + 用户自己派生出来的）。
 * 定制模板的两个 id 改错一个就会多出第二行（`Duplicate agent preset: …`），那一档**只有**
 * 在「把所有行都读出来」时才看得见——只看第一行时它和正常情况长得一模一样。
 *
 * ⚠️ **这是逐行读法，不是 loader 方言**：`plugins:` 里面一个字节都不解释（那里有
 * `!!js` 条件表达式与折叠块标量）。够回答部署层的问题（「这一行在不在、它的显示元数据
 * 是什么、里面多了哪几个实现条目」）；要能力身份与块标量正文，那是 loader 方言那一面。
 */
function locateDeclarationRows(text) {
  const lines = String(text ?? '').split(/\r?\n/u)
  const found = []
  for (let index = 0; index < lines.length; index += 1) {
    const rowAt = /^(\s*)- id:[ ]?(.*)$/u.exec(lines[index])
    if (rowAt === null) continue
    const rowIndent = rowAt[1].length
    const row = {
      rowId: stripScalar(rowAt[2]),
      moduleName: null,
      configIndent: null,
      pluginsIndent: null,
      // `plugins:` 那一行的**行下标**。下面两个读法要的是行下标，不是缩进宽度——
      // 曾经把 `pluginsIndent`（补丁里 8、dump-config 里 4）当行下标传进去，于是每次
      // 都从「行号 = 缩进宽度」那一行起步，撞上 `indent <= pluginsIndent` 立刻 break，
      // 实现条目恒为空（2026-09-28 实测）。两个数都记着，各给各的用途。
      pluginsLine: null,
    }
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const line = lines[cursor]
      if (/^- /u.test(line)) break
      if (line.trim() === '') continue
      const indent = /^(\s*)/u.exec(line)[1].length
      if (indent <= rowIndent) break
      if (indent !== rowIndent + 2) continue
      const key = /^([A-Za-z][A-Za-z0-9]*):(?:[ ]?(.*))?$/u.exec(line.trim())
      if (key === null) continue
      if (key[1] === 'name' && row.moduleName === null) row.moduleName = stripScalar(key[2] ?? '')
      if (key[1] === 'config') {
        row.configIndent = indent + 2
        // config 之下：逐个标量键，`plugins:` 之后交给条目读法。
        for (let inner = cursor + 1; inner < lines.length; inner += 1) {
          const innerLine = lines[inner]
          if (/^- /u.test(innerLine)) break
          if (innerLine.trim() === '') continue
          const innerIndent = /^(\s*)/u.exec(innerLine)[1].length
          if (innerIndent <= indent) break
          if (innerIndent !== indent + 2) continue
          const innerKey = /^([A-Za-z][A-Za-z0-9]*):(?:[ ]?(.*))?$/u.exec(innerLine.trim())
          if (innerKey === null) break
          if (innerKey[1] === 'plugins') {
            row.pluginsIndent = innerIndent
            row.pluginsLine = inner
            break
          }
          row[innerKey[1]] = scalarOf(innerKey[2] ?? '')
        }
        break
      }
    }
    if (row.moduleName !== MODE_DECLARATION_MODULE) continue
    found.push({ lines, index, rowIndent, row })
  }
  return found
}

/** 全部声明行里的**第一**行。只在「本包携带的那份补丁」与「报告里点出读到的是哪一行」用。 */
function locateDeclarationRow(text) {
  return locateDeclarationRows(text)[0] ?? null
}

/**
 * 声明 `config.id: MODE_ID` 的那一行——**逐行找，不是「第一行」**。
 *
 * ## 为什么不能用「第一行」
 *
 * 一份真实组合树里声明行**永远不止一行**：出货的 `standard`／`ptc`／`minimal`／`cordis`
 * 由 `@deepseek-ai/dsh-web-app` 发出，排在插件包发出的那一行**前面**。拿第一行当造书
 * 模式去比，装对了也会报出一整屏假差异（2026-09-28 本机实测：17 条，主体是 `standard`
 * 的实现条目）。身份那两档（`Duplicate agent preset`／插件包那一行被顶掉）早就按
 * `config.id` 在 `rows` 里数了——比对那两段当时没跟上（票 `ship-mode-installable/02`）。
 *
 * 找不到 → null（那是「组合树里没有造书模式」这件事，由调用方如实报，不在这里编一行）。
 */
function locateModeItem(text) {
  return locateDeclarationRows(text).find((item) => scalarValue(item.row.id) === MODE_ID) ?? null
}

function stripScalar(value) {
  const trimmed = String(value ?? '').trim()
  const quoted = /^(['"])([\s\S]*)\1$/u.exec(trimmed)
  if (quoted !== null) return quoted[2]
  return trimmed
}

/** 标量值：块标量（`>-` / `|` …）读不出正文，**照实说读不出**，不猜。 */
function scalarOf(raw) {
  const trimmed = raw.trim()
  if (/^[>|][-+]?$/u.test(trimmed)) return { unreadable: trimmed }
  if (trimmed === '') return { unreadable: 'empty' }
  return { value: stripScalar(trimmed) }
}

/**
 * 一份文本 → `{ declaration, rows, entries }`。
 *
 * 返回 `{ ok: false, code, detail }` 是**读不出**；`{ ok: true, declaration: null }`
 * 是**读得出、但没有那一行**。这两件事的修法完全不同，不许混。
 *
 * `rows` 是**全部**声明行（插件包那一行 + 用户自己派生的那几行）。`declaration` 仍是
 * 第一行，为的是既有读法一个字不用改；判定要用的「哪几行声明了 `textbook`」从 `rows` 数。
 */
export function readDeclarationRow({ text, origin }) {
  const locatedAll = locateDeclarationRows(text)
  if (locatedAll.length === 0) {
    return {
      ok: true,
      declaration: null,
      rows: [],
      entries: [],
      modeRow: null,
      origin,
      detail: '读得出文本，但里面没有一行 `@deepseek-ai/dsh-agent-preset` 声明行',
    }
  }
  const { lines, row } = locatedAll[0]
  const entries = row.pluginsLine === null ? [] : readEntryIdentities(lines, row.pluginsLine, row.pluginsIndent)
  const modeItem = locateModeItem(text)
  return {
    ok: true,
    declaration: toDeclarationOf(row),
    rows: locatedAll.map((item) => toDeclarationOf(item.row)),
    entries,
    /** 声明 `config.id: MODE_ID` 的那一行；组合树里没有 → null。逐行找，**不是第一行**。 */
    modeRow: modeItem === null ? null : toDeclarationOf(modeItem.row),
    origin,
  }
}

/** 一行声明行 → 行地址 + 五项显示元数据。`rows`／`declaration`／模式那一行共用它。 */
function toDeclarationOf(row) {
  return {
    rowId: row.rowId,
    moduleName: row.moduleName,
    id: scalarValue(row.id),
    name: scalarValue(row.name),
    description: scalarValue(row.description),
    order: orderValue(row.order),
  }
}

/**
 * 造书模式那一行的**全套读数**：显示元数据 ＋ 实现条目 ＋ 条目配置指纹。
 *
 * 比对与报告都问**它**，不许谁再去取「第一行」——三处各取一次就会出现「拿 A 行的显示
 * 元数据去比 B 行的实现条目」这种拼接（票 `ship-mode-installable/02`）。组合树里没有
 * 那一行 → null，由调用方如实报 `absent`，**不**退回第一行冒充。
 */
function readModeEvidence(text) {
  const item = locateModeItem(text)
  if (item === null) return null
  const { lines, row } = item
  return {
    declaration: toDeclarationOf(row),
    entries: row.pluginsLine === null ? [] : readEntryIdentities(lines, row.pluginsLine, row.pluginsIndent),
    configs: readEntryConfigFingerprints({ text, located: item }),
  }
}

function scalarNumber(value) {
  const trimmed = String(value ?? '').trim()
  return /^-?\d+$/u.test(trimmed) ? Number(trimmed) : trimmed
}

/**
 * 标量读数 → 值。**分辨 `scalarOf` 的两种返回**，而不是一刀切。
 *
 * `{value: X}` 是**读到了**，`{unreadable: …}` 才是**真读不出**（块标量／空值）。
 *
 * ⚠️ 这里原来写的是 `typeof scalar === 'object' && scalar !== null ? null : scalar`。
 * 可 `scalarOf` 的**两个返回值都是对象**，于是「读到了」也被一起丢成 `null`：
 * `declaration.id` 恒为 null → `classifyModeInstall` 恒走「那一行声明的不是 textbook」
 * → **恒 `absent`**，第 3 步永远报不出「一致」，显示元数据漂移也永远列不出清单。
 * 2026-09-28 拿仓内真生成物 `preset/textbook.patch.yml` 实测：id/name/description/order
 * 全为 null、实现条目全为空。「读不出」要照实说读不出，但不能把「读到了」也说成读不出。
 */
function scalarValue(scalar) {
  if (!isRecord(scalar)) return scalar === undefined ? null : scalar
  return 'value' in scalar ? scalar.value : null
}

/** `order` 走同一条分辨，只是读到了还要把「3」变成 `3`（次序是数字，不是字符串）。 */
function orderValue(scalar) {
  const value = scalarValue(scalar)
  return typeof value === 'string' ? scalarNumber(value) : value
}

/**
 * `plugins:` 之下**展平**的实现条目身份清单（`entryId` 或 `moduleName`，取先出现的那个）。
 *
 * ⚠️ **`pluginsLine` 是行下标，`pluginsIndent` 是缩进宽度**，两个不是一回事：补丁里
 * `plugins:` 在第 13 行、缩进 8；dump-config 里在第 12 行、缩进 4。参数名必须说清自己收
 * 哪一个——早先这里叫 `from`（看着像行号）却也收过缩进宽度，于是「从第 8 行起步」撞上
 * 第 9 行的 `id: textbook`（缩进正好 8）立刻 break，条目恒空（2026-09-28 实测）。
 *
 * 展平是故意的：组里的成员也是这一行提供的实现条目，用户在组里加一个工具同样是他自己的
 * 定制，只看顶层会漏掉。
 *
 * 读法是**启发式**（按行读 `- id:` / `- name:`），方向**保守**：宁可多认几条，
 * 也不要把一次定制当成版本落后。配置指纹同样只读**一层标量**——
 * 折叠块标量（persona 那段 `prefix: >-`）的正文读不了，所以只记键名。
 */
function readEntryIdentities(lines, pluginsLine, pluginsIndent) {
  const identities = []
  const configs = new Map()
  let current = null
  for (let index = pluginsLine + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (line.trim() === '') continue
    const indent = /^(\s*)/u.exec(line)[1].length
    if (/^- /u.test(line) === false && indent <= pluginsIndent) break
    if (indent <= pluginsIndent) break
    const matched = /^\s*-\s+(id|name)\s*:[ ]?(.*)$/u.exec(line)
    if (matched !== null) {
      if (current !== null) identities.push(current)
      current = { entryId: stripScalar(matched[2]), indent: null, config: null, configIndent: null }
      if (matched[1] === 'name') current.entryId = stripScalar(matched[2])
      continue
    }
    if (current === null) continue
    const key = /^([A-Za-z][A-Za-z0-9]*):(?:[ ]?(.*))?$/u.exec(line.trim())
    if (key === null) continue
    if (key[1] !== 'config' || current.configIndent !== null) continue
    const entryIndent = /^(\s*)/u.exec(line)[1].length
    current.configIndent = entryIndent + 2
    const config = new Map()
    for (let inner = index + 1; inner < lines.length; inner += 1) {
      const innerLine = lines[inner]
      if (innerLine.trim() === '') continue
      const innerIndent = /^(\s*)/u.exec(innerLine)[1].length
      if (innerIndent <= entryIndent) break
      if (innerIndent !== entryIndent + 2) continue
      const innerKey = /^([A-Za-z][A-Za-z0-9]*):(?:[ ]?(.*))?$/u.exec(innerLine.trim())
      if (innerKey === null) break
      config.set(innerKey[1], scalarOf(innerKey[2] ?? ''))
    }
    current.config = config
  }
  if (current !== null) identities.push(current)
  for (const entry of identities) {
    configs.set(entry.entryId, entry.config === null ? null : [...entry.config.entries()].map(
      ([key, scalar]) => [key, 'value' in scalar ? scalar.value : null],
    ))
  }
  return identities.map((entry) => entry.entryId)
    .filter((id) => id !== '')
}

/**
 * 条目配置指纹：实现条目 id → 排序后的 `[键, 值或 null]` 列表（`null` = 折叠块，正文读不出）。
 *
 * `located` 让调用方**指名要哪一行**——组合树里声明行不止一行（出货的 `standard`／`ptc`／
 * `minimal`／`cordis` 排在插件包那一行前面），只按「第一行」算指纹就会把别人的那一行
 * 当成造书模式（票 `ship-mode-installable/02`）。
 */
function readEntryConfigFingerprints({ text, origin, located: givenLocated }) {
  const located = givenLocated ?? locateDeclarationRow(text)
  if (located === null || located.row.pluginsLine === null) return new Map()
  const { lines, row } = located
  const collected = []
  let current = null
  // 起点的行下标是 `pluginsLine`，`pluginsIndent` 只用来判断「这一行还出不出去」。
  for (let index = row.pluginsLine + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (line.trim() === '') continue
    const indent = /^(\s*)/u.exec(line)[1].length
    if (indent <= row.pluginsIndent) break
    const matched = /^\s*-\s+(id|name)\s*:[ ]?(.*)$/u.exec(line)
    if (matched !== null) {
      if (current !== null) collected.push(current)
      current = { entryId: stripScalar(matched[2]), config: null, configIndent: null, entryIndent: indent }
      continue
    }
    if (current === null) continue
    const key = /^([A-Za-z][A-Za-z0-9]*):(?:[ ]?(.*))?$/u.exec(line.trim())
    if (key === null || key[1] !== 'config' || current.configIndent !== null) continue
    current.configIndent = indent + 2
    const config = new Map()
    for (let inner = index + 1; inner < lines.length; inner += 1) {
      const innerLine = lines[inner]
      if (innerLine.trim() === '') continue
      const innerIndent = /^(\s*)/u.exec(innerLine)[1].length
      if (innerIndent <= indent) break
      if (innerIndent !== indent + 2) continue
      const innerKey = /^([A-Za-z][A-Za-z0-9]*):(?:[ ]?(.*))?$/u.exec(innerLine.trim())
      if (innerKey === null) break
      config.set(innerKey[1], scalarOf(innerKey[2] ?? ''))
    }
    current.config = config
  }
  if (current !== null) collected.push(current)
  const out = new Map()
  for (const entry of collected) {
    out.set(entry.entryId, entry.config === null
      ? []
      : [...entry.config.entries()].map(([key, scalar]) => [key, 'value' in scalar ? scalar.value : null]))
  }
  return out
}

/* ── 读盘：本包携带的生成物 ／ 实际组合树 ──────────────────────────────────── */

/**
 * 本包携带的那份声明补丁。
 *
 * 读不到**不抛**——发布包坏了是运维事实，要变成一句说人话的错误，不是 `ENOENT` 堆栈。
 * 判据码 `shipped-artifact-unreadable` 的说法就是票面点名的那句「本包没有可对照的生成物」。
 */
export async function readShippedDeclaration({ presetDir = join(PKG_DIR, 'preset') } = {}) {
  const path = join(presetDir, PRESET_PATCH_FILE)
  let text
  try {
    text = await readFile(path, 'utf8')
  } catch (error) {
    return {
      ok: false,
      path,
      code: 'shipped-artifact-unreadable',
      detail: `${path} 读不出来（${error?.code ?? String(error)}）`,
    }
  }
  const read = readDeclarationRow({ text, origin: path })
  const mode = readModeEvidence(text)
  if (read.declaration === null || mode === null) {
    return {
      ok: false,
      path,
      code: 'shipped-artifact-unreadable',
      detail: `${path} 里没有一行声明 \`config.id: ${MODE_ID}\` 的 \`name: '${MODE_DECLARATION_MODULE}'\` 行——这份文件不是造书模式的声明补丁`,
    }
  }
  return {
    ok: true,
    path,
    text,
    declaration: mode.declaration,
    rows: read.rows,
    entries: mode.entries,
    configs: mode.configs,
  }
}

/**
 * 实际组合树：`dsh --profile <profile> --dump-config`。
 *
 * 真的那一次是 spawn dsh（这也是它**能**回答「宿主认不认这一行」的唯一办法）。
 * 读不出来同样是**说人话**的一条，不是异常：`dsh` 跑不起来、返回非零、输出里一行
 * Loader 行都没有——三种都归到「证据没取到」。
 */
export function readCompositionTree({ dshBin, profile, env = process.env, run = spawnHostCli } = {}) {
  if (typeof dshBin !== 'string' || dshBin === '') {
    return { ok: false, code: 'composition-tree-unreadable', detail: '找不到 dsh 命令，本安装器读不到实际组合树' }
  }
  let result
  try {
    result = run(dshBin, ['--profile', profile, '--dump-config'], {
      encoding: 'utf8',
      env,
      maxBuffer: 64 * 1024 * 1024,
    })
  } catch (error) {
    return {
      ok: false,
      code: 'composition-tree-unreadable',
      detail: `跑 \`${dshBin} --profile ${profile} --dump-config\` 失败：${error?.message ?? String(error)}`,
    }
  }
  if (result?.error) {
    return {
      ok: false,
      code: 'composition-tree-unreadable',
      detail: `跑 \`${dshBin} --profile ${profile} --dump-config\` 失败：${result.error.message}`,
    }
  }
  if (result?.status !== 0) {
    return {
      ok: false,
      code: 'composition-tree-unreadable',
      detail: `\`${dshBin} --profile ${profile} --dump-config\` 返回了 ${result?.status ?? '(无退出码)'}；`
        + `看上面它自己打印的报错（最常见的是这个 profile 还没初始化过）`,
    }
  }
  const text = `${result.stdout ?? ''}`
  const read = readDeclarationRow({ text, origin: `${dshBin} --profile ${profile} --dump-config` })
  const mode = readModeEvidence(text)
  return {
    ok: true,
    text,
    declared: read.declaration,
    rows: read.rows,
    /** 造书模式那一行的全套读数；组合树里没有它 → null（那一档叫 `absent`，不是报错）。 */
    mode,
    entries: read.entries,
    configs: readEntryConfigFingerprints({ text }),
  }
}

/* ── 判定：纯函数，不碰磁盘 ────────────────────────────────────────────────── */

/**
 * 本安装器能产出的**全部**状态。多一档就会有人问「这一档是什么意思」；少一档就会有人拿
 * 别的层的档位来套（见文件头那一节：维护者路径的 `unreadable` 在这一层不成立）。
 *
 * `finish` 既是**唯一的出口**也是**活着的守卫**：非法状态在这里就抛，而不是等报告发出去。
 */
const INSTALL_STATES = new Set(['in-sync', 'absent', 'drifted', 'user-modified', 'not-judged', 'conflicted'])

/** 显示元数据要逐字段点名的那几项。`rowId`／`moduleName` 也在内——它们同样是声明行的身份。 */
const DECLARATION_FIELDS = Object.freeze([
  ['rowId', '行 id（Loader 编辑地址）'],
  ['moduleName', '行 name（挂的插件）'],
  ['id', 'config.id（模式身份）'],
  ['name', 'config.name（显示名）'],
  ['description', 'config.description（描述）'],
  ['order', 'config.order（次序）'],
])

/**
 * 「能力差异」这一档在本安装器里**恒为「算不出」**。
 *
 * 它不是空清单：空清单会被读成「两侧能力一模一样」，而事实是**没人比过**。能力身份
 * 归一化与折叠块标量正文都要 DSH 的 loader 方言，而那套判据在 `dev/` 里、**不进 npm
 * 成品**——用户手上这个安装器拿不到它。所以这里报「算不出」＋它能算的那条命令。
 */
function capabilityCheck() {
  return {
    computed: false,
    entries: [
      '能力身份归一化（哪些实现条目合成哪项能力）',
      '折叠块标量的正文（persona 那段 prefix: >- 的实际文本）',
    ],
    why: '本安装器只逐行读形状，不解释 loader 方言；那套判据住在 dev/，不进 npm 成品',
    command: 'node dev/mode-capability-baseline/cli.mjs check',
  }
}

/**
 * 判定宿主组合树里造书模式那一行的现状。
 *
 * 档名沿用 `install-sync.js` 的那一套，一个字没改（`in-sync` / `absent` / `drifted` /
 * `user-modified`），另加本层特有的两档：`not-judged`（**证据压根没读到**）与
 * `conflicted`（**定制模板的某一个 id 没改，组合树里多出/顶掉了一行**）。主体从「盘上
 * 那份文件」换成「组合树里那一行」，判据是同一套——换的只是**读法**（票 01 的 prefactor
 * 结论：五态分类可整份复用）。`unreadable` 为什么不在这一层，见文件头那一节。
 *
 * 三类差异分开命名，因为它们的修法完全不同：
 * `declarationDifferences`（显示元数据，逐字段）／`structureDifferences`（实现条目）／
 * `capabilityCheck`（本安装器算不出，不报空清单）。
 */
export function classifyModeInstall({ shipped, tree }) {
  const capability = capabilityCheck()
  const base = { capability, declarationDifferences: [], structureDifferences: [], entries: { shipped: [], tree: [] } }
  if (!isRecord(shipped) || shipped.ok !== true) {
    return finish('not-judged', {
      ...base,
      reasons: [shipped?.code ?? 'shipped-artifact-unreadable'],
      detail: shipped?.detail ?? '本包没有可对照的生成物',
      shippedPath: shipped?.path ?? null,
      treeSource: null,
    })
  }
  if (!isRecord(tree) || tree.ok !== true) {
    return finish('not-judged', {
      ...base,
      reasons: [tree?.code ?? 'composition-tree-unreadable'],
      detail: tree?.detail ?? '读不到实际组合树',
      shippedPath: shipped.path,
      treeSource: null,
    })
  }

  const rows = Array.isArray(tree.rows) ? tree.rows : []
  // 比对的对象是**声明 `config.id: MODE_ID` 的那一行**（`readCompositionTree.mode`），
  // 不是「第一行」——一份真组合树里第一行恒是出货的 `preset-standard`。拿它比就是
  // 装对了也报一屏假差异（票 `ship-mode-installable/02`）。读不到模式那一行时**不退回**
  // 第一行冒充：下面那两档身份检查会先把它说成 `conflicted`／`absent`。
  const mode = isRecord(tree.mode) ? tree.mode : null
  const firstRow = tree.declared
  const installed = {
    declaration: mode?.declaration ?? firstRow,
    rows,
    entries: mode?.entries ?? tree.entries,
    configs: mode?.configs ?? tree.configs,
    firstRow,
  }
  const report = { ...base, installed, shippedPath: shipped.path, treeSource: tree.origin ?? null }
  if (installed.declaration === null) {
    return finish('absent', {
      ...report,
      reasons: ['declaration-absent'],
      detail: installed.detail ?? `组合树里没有一行 \`name: '${MODE_DECLARATION_MODULE}'\` 的声明行`,
    })
  }

  // ── 定制模板改错一个 id 的两种形状（票 07） ──────────────────────────────────
  // 这一段要在**任何比对之前**判：它们不是「漂移」，是**身份撞了**——用户想要的那个模式
  // 要么压根没注册出来，要么注册不起来。混进 drifted 就会得到一句「有差异、去看哪几项」，
  // 而真正的修法是回去改那一行的两个 id 之一。
  const declaringMode = rows.filter((row) => row.id === MODE_ID)
  if (declaringMode.length > 1) {
    return finish('conflicted', {
      ...report,
      reasons: ['duplicate-mode-identity'],
      detail: `组合树里有 ${declaringMode.length} 行都声明 config.id: ${MODE_ID}`
        + `（行 id：${declaringMode.map((row) => row.rowId).join('、')}）：`
        + `宿主只会注册其中一个，另一行起不来（症状是 \`Duplicate agent preset: ${MODE_ID}\`）`,
    })
  }
  if (declaringMode.length === 0) {
    const atPackageAddress = rows.find((row) => row.rowId === MODE_ROW_ID) ?? null
    if (atPackageAddress !== null) {
      return finish('conflicted', {
        ...report,
        reasons: ['package-row-overridden'],
        detail: `插件包那一行（行 id: ${MODE_ROW_ID}）现在声明的是 `
          + `config.id: ${atPackageAddress.id ?? '(读不出)'}，不是 ${MODE_ID}——`
          + '你的 profile 层覆盖排在最后、永远赢，**它把插件包那一行顶掉了**，'
          + `所以宿主不会注册出造书模式`,
      })
    }
    // 组合树里读到几行就点名几行——真宿主上第一行恒是出货的 `preset-standard`，只说
    // 「那一行」会让用户去查一个他根本没装的东西（票 `ship-mode-installable/02`）。
    const readRows = rows.length === 0
      ? '组合树里一行声明行都没有'
      : `组合树里读到 ${rows.length} 行声明行（config.id：${rows.map((row) => row.id ?? '(读不出)').join('、')}），`
        + `没有一行声明 ${MODE_ID}`
    return finish('absent', {
      ...report,
      reasons: ['declaration-absent'],
      detail: `${readRows}——造书模式没注册出来`
        + `（插件没装进这个 profile，或装的是不带声明补丁的旧版本）`,
    })
  }

  // ① 显示元数据：逐字段点名。**这一档是票 06 明确要求的**——组合行一条没动、能力一模
  //    一样，模式在名单上却显示成另一个样子，那也是漂移，而它的修法与「接线错了」不同。
  const declarationDifferences = []
  for (const [field, label] of DECLARATION_FIELDS) {
    const from = shipped.declaration[field] ?? null
    const to = installed.declaration[field] ?? null
    if (from !== to) declarationDifferences.push({ field, label, shipped: from, tree: to })
  }

  // ② 结构：实现条目的集合／次序／配置。
  const shippedEntries = [...shipped.entries]
  const treeEntries = [...installed.entries]
  const structureDifferences = []
  const shippedSet = new Set(shippedEntries)
  const treeSet = new Set(treeEntries)
  for (const id of treeEntries.filter((item) => !shippedSet.has(item))) {
    structureDifferences.push({ kind: 'only-in-tree', entry: id, detail: '这一行里有本包声明补丁不会产生的实现条目' })
  }
  for (const id of shippedEntries.filter((item) => !treeSet.has(item))) {
    structureDifferences.push({ kind: 'only-in-package', entry: id, detail: '本包声明补丁里有、这一行里没有的实现条目' })
  }
  if (structureDifferences.length === 0 && treeEntries.join(' ') !== shippedEntries.join(' ')) {
    structureDifferences.push({
      kind: 'order',
      entry: null,
      detail: '实现条目集合一样，次序不一样（工具目录的呈现次序会变）',
      shipped: shippedEntries,
      tree: treeEntries,
    })
  }
  for (const id of shippedEntries.filter((item) => treeSet.has(item))) {
    const from = shipped.configs?.get(id) ?? null
    const to = installed.configs?.get(id) ?? null
    if (JSON.stringify(from) === JSON.stringify(to)) continue
    structureDifferences.push({
      kind: 'config',
      entry: id,
      detail: '这一项的配置与本包声明补丁不一致',
      shipped: from,
      tree: to,
    })
  }

  const identical = declarationDifferences.length === 0 && structureDifferences.length === 0
  const hasUserEntries = structureDifferences.some((item) => item.kind === 'only-in-tree')
  const state = identical ? 'in-sync' : (hasUserEntries ? 'user-modified' : 'drifted')
  return finish(state, {
    ...report,
    reasons: identical ? ['in-sync'] : (hasUserEntries ? ['entries-not-in-package'] : ['declaration-differs']),
    detail: null,
    declarationDifferences,
    structureDifferences,
    entries: { shipped: shippedEntries, tree: treeEntries },
  })
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * 判定的**唯一出口**：校验档名在册，把 `state` 写进返回值，然后冻结。
 *
 * 它以前是个没人调用的函数（`classifyModeInstall` 自己 `Object.freeze` 完就返回），
 * 于是「档名写错」这件事要到报告发出去、甚至退出码打出来之后才现形。现在非法档名在这里
 * 就抛，抛在装机器里面——那正是 `main()` 包住的那条人话路径。
 *
 * `state` **由这里写进返回值**，不各调用点自己带：档名与它的归属处在一处，少一个拼错的地方。
 */
function finish(state, rest) {
  if (!INSTALL_STATES.has(state)) throw new Error(`内部错误：非法状态 ${state}`)
  return Object.freeze({ ...rest, state })
}

/* ── 旧目录退役：改名即「带备份删除」 ───────────────────────────────────────── */

/**
 * 用户盘上那个**宿主已不再读取**的旧目录：`.agent-presets/textbook`。
 *
 * 处理方式是**改名**到同级的 `<目录名>.retired`，不是复制再删：
 *   - 改名是**原子**的，不存在「两个都存在」的窗口；
 *   - 备份里就是原来那一份，一个字节都不改（包括用户当年写在里面的定制）；
 *   - 原路径消失 ＝ 删除达成，`.retired` ＝ 备份达成，两件事一次做完。
 *
 * 留着会让人继续去改它、改完发现没反应——正好复刻今天这个病。所以要改，并在输出里
 * **点名说明宿主已不再读它**。
 *
 * 已经有一份 `.retired` 时**不覆盖、不再删**：那份是上一次退役的备份，覆盖它等于丢数据。
 * 这时如实报「已存在一份退役备份」，不假装处理过。
 */
export function retireLegacyPresetDir({ dshHome, exists = existsSync, rename = renameSync } = {}) {
  const legacyDir = join(dshHome, ...LEGACY_PRESET_DIR_SEGMENTS)
  if (!exists(legacyDir)) return { action: 'none', legacyDir, retiredPath: null, detail: '旧目录本来就不存在' }
  const retiredPath = legacyDir + LEGACY_RETIRED_SUFFIX
  if (exists(retiredPath)) {
    return {
      action: 'kept',
      legacyDir,
      retiredPath,
      detail: `已经有一份退役备份 ${retiredPath}，本次不覆盖它（覆盖等于丢你当年写在那里的东西）`,
    }
  }
  rename(legacyDir, retiredPath)
  return {
    action: 'retired',
    legacyDir,
    retiredPath,
    detail: `${legacyDir} 已改名为 ${retiredPath}（保留作备份）`,
  }
}

/* ── 人话：把判定结果说成一次安装该说的话 ──────────────────────────────────── */

/**
 * 状态的一句话说明。`in-sync` 与 `absent` 的差别在这里必须能一眼看出来。
 *
 * 这张表是**穷举**的：`classifyModeInstall` 能产出的六档一个不多一个不少（见文件头那一节，
 * `unreadable` 在本层不成立）。表里多一档就会让报告里出现一个永远不出现的状态词。
 */
const INSTALL_STATE_HINT = {
  absent: '宿主组合树里没有造书模式那一行（模式没注册出来）',
  'in-sync': '宿主组合树里那一行与本包携带的声明补丁逐项相同',
  drifted: '那一行在，但与本包携带的声明补丁有差异',
  'user-modified': '那一行在，而且有本包声明补丁不会产生的实现条目',
  'not-judged': '证据没取到，这一轮**没有判定**（没判定 ≠ 判定为通过）',
  conflicted: '组合树里有一个身份冲突：多出一行撞了模式身份，或插件包那一行被顶掉了',
}

/**
 * 定制模板：**复制一行声明**，不再是复制一个目录。**两个 id 都要改**（ADR-0022 决策 5）。
 *
 * ## 为什么不能直接改插件包发出的那一行（模板里也印着这一句）
 *
 * 用户 profile 层的 `cordis.patch.yml` 排在**所有** bundle 层**之后**，所以按行 id 的覆盖
 * **每次启动都在最后**——覆盖**永远赢下去，升级冲不掉它**。插件包出的那一行
 * **没有任何机制能保护**（层序不是保护，ADR-0022 决策 4）。所以定制只能走「复制出一行
 * 自己的」，而复制出来的这一行**只能被检测看得见**——本安装器第 3 步每次都读组合树，
 * 下面那两种改错法各有各的一档。
 *
 * ## 两个 id 各是什么、改错会怎样
 *
 * | 位置 | 它是什么 | 改错的后果 |
 * | --- | --- | --- |
 * | 行上的 `id` | **Loader 编辑地址**：用户 profile 层就是按它覆盖的 | 留着插件包那一个 → 你的行**顶掉**插件包那一行（用户层永远赢），造书模式直接从名单上消失 |
 * | `config.id` | **模式身份**：会话保存的是它，宿主注册表按它去重 | 留着 `textbook` → 两行都声明同一个身份，撞出 `Duplicate agent preset: textbook`，**你那一行起不来**（插件包那行照常工作，所以症状像「改了没反应」） |
 *
 * 两种改错法**症状完全不同、修法也完全不同**，所以模板里两处各有一句注释点名自己那一种。
 */
export function customizationTemplate({ profile = 'web' } = {}) {
  return [
    `# 打开 ${'<'}DSH_HOME${'>'}/profiles/${profile}/cordis.patch.yml，在最上面加下面这一段：`,
    '',
    '# ⚠️ 不要直接改插件包发出的那一行（preset/textbook.patch.yml 里那行）：',
    '#    用户 profile 层的覆盖**每次启动都排在最后**，所以覆盖**永远赢下去，升级冲不掉它**。',
    '#    这一层没有任何机制能防住，只有检测看得见——本安装器第 3 步每次都读组合树并点名偏离。',
    '#    所以定制走「复制出一行自己的」：下面**两个 id 都要改**。',
    '',
    '- insert:',
    '    # ↓ 行上的 `id` = **Loader 编辑地址**（用户 profile 层按它覆盖）。',
    `    #   只给它换个名字、却把 \`config.id\` 留成 ${MODE_ID}，会撞出 \`Duplicate agent preset: ${MODE_ID}\`：`,
    '    #   两行声明同一个模式身份，宿主只注册其中一个，**你这一行起不来**（插件包那行照常工作）。',
    `    - id: ${MODE_ROW_ID}-mine`,
    `      name: '${MODE_DECLARATION_MODULE}'`,
    '      config:',
    `        # ↓ \`config.id\` = **模式身份**（会话保存的是它，宿主注册表按它去重）。`,
    `        #   留着 ${MODE_ID} 不改、或者**只在上面改行 id**，都会和插件包那一行撞身份（见上一条）。`,
    '        #   反过来，留着上面那个行 id 不改（不给自己一个地址）也一样坏：',
    `        #   你的行会按地址**顶掉插件包那一行**（用户层永远赢），造书模式（${MODE_ID}）直接从名单上消失。`,
    '        id: my-textbook',
    '        name: 我的造书模式',
    '        description: 换成你自己的描述。',
    '        order: 4',
    '        plugins:',
    '          # 把本包 preset/textbook.patch.yml 里 config.plugins 之下那一整段抄过来',
    '          # （上面两个 id 都改完之后，它就是一个你自己的模式）',
  ].join('\n')
}

/**
 * 状态 → 该做什么。**每一档都指名一个具体动作**，不给「安装失败」这种让人自己猜的说法。
 *
 * `in-sync` 那一档**刻意不宣称「装了什么」**：声明行不是本安装器装的，是插件包随 bundle
 * 发出的，宿主每次启动重算——本步骤只是读了一次并确认。
 */
export function installGuidance(plan, { profile = 'web', binary = 'npx dsh-craft-your-textbook' } = {}) {
  switch (plan.state) {
    case 'not-judged':
      return [
        `本安装器**没有判定**，也不会说「装好了」：${plan.detail ?? '证据没取到'}。`,
        '它做的事只有「读组合树 + 比对 + 如实报告」——造书模式那一行由本插件包随 bundle',
        `补丁发出（preset/${PRESET_PATCH_FILE}），宿主每次启动重算。`,
        '按上面的原因修好之后重跑一次：',
        `  ${binary}${profile === 'web' ? '' : ` --profile ${profile}`}`,
      ]
    case 'in-sync':
      return [
        '宿主组合树里那一行与本包携带的声明补丁逐项相同。',
        '**这一行不是本安装器装的**——它由本插件包随 bundle 补丁发出，宿主每次启动重算；',
        '本步骤只是读了一次并确认，一个文件都没有写。',
        '⚠️ 这个「相同」只覆盖本安装器逐行读得着的那些项。能力身份与折叠块标量正文要',
        'loader 方言才比得了，那一层**没验过**，不是「也相同」。',
      ]
    case 'absent':
      return [
        `宿主组合树里没有 config.id: ${MODE_ID} 的声明行——**宿主不会注册出造书模式**。`,
        '（**插件包那一行被顶掉**是其中一种：用户 profile 层的覆盖按行 id 生效且永远赢，',
        '  你要是用插件包那个行 id 声明了另一个身份，它就把那一行整个替换掉了。',
        `  那种情况本安装器报的是 \`conflicted\` 那一档，不落在这里。）`,
        '按顺序查这三处：',
        `  ① 本包有没有真的装进这个 profile（dsh.profile.bundles 里要有 ${'dsh-craft-your-textbook'}）；`,
        '  ② 装进来的那一份是不是带 preset/textbook.patch.yml 的版本（1.2.0 及以前不带，',
        '     那一版走的是已被上游取消的目录机制）；',
        '  ③ 改完 bundles 之后**重启 dsh**——组合树是每次启动重算的。',
      ]
    case 'conflicted':
      return [
        `${plan.detail}`,
        '',
        '**为什么这两个 id 都要改**（行上的 `id` 是 Loader 编辑地址，`config.id` 是模式身份）：',
        `  · 行 id 留着 ${MODE_ROW_ID} 不改 → 你的行**顶掉**插件包那一行（用户层永远赢，升级冲不掉），`,
        `    造书模式（${MODE_ID}）直接从名单上消失；`,
        `  · \`config.id\` 留着 ${MODE_ID} 不改 → 撞出 \`Duplicate agent preset: ${MODE_ID}\`，你那一行起不来`,
        '    （插件包那行照常工作，所以症状看起来像「改了没反应」）。',
        '',
        '本安装器**不改它**（用户层的覆盖永远赢，机制防不住，只有检测看得见）。',
        '把上面这一段抄进你自己的 profile，**两个 id 都换掉**——那就是一条有独立身份的行：',
        '',
        indent(customizationTemplate({ profile })),
      ]
    case 'drifted':
      return [
        '宿主组合树里那一行与本包携带的声明补丁**有差异**。本安装器**不改它**——',
        '那一行没有任何机制能保护，只有检测看得见（ADR-0022 决策 4）。',
        '',
        '  ① 那行不是你要保留的定制 → 升级到带新声明补丁的版本并重启 dsh；',
        '  ② 那行上有你自己的东西（用户 profile 层的覆盖每次启动都在最后，永远赢，',
        '     升级冲不掉它）→ 把它复制成**一个有独立身份**的模式，而不是继续改这一行：',
        '',
        indent(customizationTemplate({ profile })),
      ]
    case 'user-modified':
      return [
        '宿主组合树里那一行**多出**本包声明补丁不会产生的实现条目：',
        `  ${plan.structureDifferences.filter((item) => item.kind === 'only-in-tree').map((item) => item.entry).join('、')}`,
        '那不是版本落后，是有人在这一行上做过定制。把它复制成**一个有独立身份**的模式：',
        '',
        indent(customizationTemplate({ profile })),
      ]
    case 'unreadable':
      throw new Error(
        '内部错误：安装器这一层产不出 unreadable——它属于 dev/mode-capability-baseline/ 那边'
        + '读「一份文件」的维护者路径。本层读不出分 not-judged（树没取到）与 absent（没有那一行）。',
      )
    default:
      throw new Error(`内部错误：非法状态 ${plan.state}`)
  }
}

function indent(text) {
  return text.split('\n').map((line) => (line === '' ? '' : `    ${line}`)).join('\n')
}

/** 逐项比过的那三档。没比过的那三档不打印「实现条目 N 项」——那会是「有结论、没清单」。 */
const COMPARED_INSTALL_STATES = new Set(['in-sync', 'drifted', 'user-modified'])

/** 一次检测的完整报告：状态 → 三类差异各自点名 → 该做什么。 */
export function formatModeInstallSummary(plan, { profile = 'web' } = {}) {
  const lines = [`造书模式检测:${plan.state}——${INSTALL_STATE_HINT[plan.state]}`]
  lines.push(`  本包声明补丁：${plan.shippedPath ?? '(读不到)'}`)
  lines.push(`  组合树来源：${plan.treeSource ?? '(没取到)'}`)
  if (COMPARED_INSTALL_STATES.has(plan.state)) {
    lines.push(`  声明行：行 id=${plan.installed?.declaration?.rowId ?? '(读不出)'} · `
      + `config.id=${plan.installed?.declaration?.id ?? '(读不出)'} · `
      + `显示名=${plan.installed?.declaration?.name ?? '(读不出)'} · order=${plan.installed?.declaration?.order ?? '(读不出)'}`)
    lines.push(`  实现条目：本包 ${plan.entries.shipped.length} 项 / 这一行 ${plan.entries.tree.length} 项`)
  } else {
    // 「没取到证据」与「没有可比的那一行」是两件事，原因要说出来，不拿一个计数顶掉。
    lines.push(`  ${plan.state === 'not-judged' ? '为什么没判定' : '为什么不是逐项相同'}：${plan.detail ?? plan.reasons.join('、')}`)
  }

  // 三类差异**分开命名**。空的那两栏照实说「无」，第三栏照实说「算不出」——
  // 「有结论、没清单」正是票 01 复核点名的那类坏形状。
  lines.push(`  ── 显示元数据差异 (${plan.declarationDifferences.length})：改这一层，模式在名单上显示成另一个样子`)
  for (const item of plan.declarationDifferences) {
    lines.push(`     ${item.label}：本包=${JSON.stringify(item.shipped)} → 这一行=${JSON.stringify(item.tree)}`)
  }
  lines.push(`  ── 结构差异 (${plan.structureDifferences.length})：实现条目／次序／配置`)
  for (const item of plan.structureDifferences) {
    const where = item.entry === null ? '' : ` ${item.entry}`
    lines.push(`     ${item.kind}${where}：${item.detail}`)
  }
  lines.push(`  ── 能力差异：本安装器算不出（${plan.capability.computed ? '异常' : '如实报不算'}）`)
  for (const item of plan.capability.entries) lines.push(`     算不出的那一层：${item}`)
  lines.push(`     原因：${plan.capability.why}`)
  lines.push(`     要这一层的结论请在仓内跑：${plan.capability.command}`)

  lines.push(...installGuidance(plan, { profile }).map((line) => (line === '' ? '' : `  ${line}`)))
  return lines.join('\n')
}

/**
 * 收尾：**重启**与**新开会话**是两件事，缺一件界面就不会变。
 *
 * 刻意**不说「已就位」**——那一行不是本安装器装的（插件包随 bundle 补丁发出，宿主每次
 * 启动重算），说「已就位」是拿一个读数冒充一次部署。这里只说还需要做什么，以及
 * **怎么自己确认真的注册上了**：本安装器第 3 步读的就是那条命令。
 */
export function formatRestartNotice({ profile = 'web' } = {}) {
  return [
    '造书模式那一行由本插件包随 bundle 补丁发出，宿主**每次启动**重算组合树。',
    '所以从「装上了」到「看得见」之间隔着这两步（不做的话界面不会变）：',
    '  1. 重启 dsh（关掉再打开，或运行你的启动脚本）；',
    '  2. **新开**一个会话——已经开着的会话不会换组合，它会继续用打开那一刻的组合。',
    '',
    '怎么确认真的注册上了（重启之后随时可以自己查，跑的就是本安装器第 3 步那条）：',
    `  dsh --profile ${profile} --dump-config   # 在输出里找 config.id: ${MODE_ID}`,
    '  找不到 → 造书模式没注册出来，按上面「宿主组合树里没有那一行」那三条查。',
    '',
    '然后：新会话 → 模式选「造书模式」→ 中间会出现「工作台」页签，点进去开始造书。',
  ].join('\n')
}

/* ── 升级：把 profile 里记死的那个版本号解开 ────────────────────────────────── */

/**
 * 本包在包管理器里的名字。
 *
 * 开发板里它是 `dsh-craft-your-textbook`（本仓的包名），发布版由 `scripts/release.mjs`
 * 的包名改写把它逐字换成 `dsh-craft-your-textbook`——**所以这一处写开发板名**，
 * 与本文件其余地方（第 1 步 `add`、第 2 步 bundles）同一口径，不另开一份。
 */
const PACKAGE_NAME = 'dsh-craft-your-textbook'

/** npm registry 的「这个包现在最新是哪一版」。只用到 Node 内置的 fetch。 */
const REGISTRY_LATEST_URL = (name) => `https://registry.npmjs.org/${name}/latest`

/**
 * 读 npm 上当前最新的一版。
 *
 * ## 读不出就说读不出，**绝不拿一个版本号糊过去**
 *
 * 这一步的产出直接写进用户的 profile。拿「大概的最新版」去改一个真实用户的配置，
 * 比不改坏得多——所以取不到就返回 `unreadable`，由调用方如实告诉用户「没改、为什么」。
 * 这与本文件第 0 步读宿主版本是同一条纪律。
 *
 * @returns `{ok: true, version}` 或 `{ok: false, code, detail}`
 */
export async function readLatestPublishedVersion({
  packageName = PACKAGE_NAME,
  fetchImpl = globalThis.fetch,
  timeoutMs = 15000,
} = {}) {
  if (typeof fetchImpl !== 'function') {
    return { ok: false, code: 'registry-unreachable', detail: '这个 Node 环境里没有 fetch' }
  }
  const url = REGISTRY_LATEST_URL(packageName)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(url, { signal: controller.signal })
    if (response?.ok !== true) {
      return {
        ok: false,
        code: 'registry-unreachable',
        detail: `${url} 返回了 ${response?.status ?? '(没有状态码)'}`,
      }
    }
    const body = await response.json()
    const version = typeof body?.version === 'string' ? body.version.trim() : ''
    if (version === '') {
      return { ok: false, code: 'registry-unreadable', detail: `${url} 的返回里没有 version 字段` }
    }
    return { ok: true, version }
  } catch (fetchError) {
    return {
      ok: false,
      code: 'registry-unreachable',
      detail: `连不上 ${url}（${fetchError?.message ?? String(fetchError)}）`,
    }
  } finally {
    clearTimeout(timer)
  }
}

/** 改写档位。**封闭枚举**——多一档就会有人问它是什么意思，少一档就会把「没改」说成「改了」。 */
const UNPIN_STATES = new Set(['rewritten', 'already-current', 'not-declared', 'no-target'])

/** 判定的唯一出口：档名在册才放行，非法档名在这里就抛。 */
function finishUnpin(state, rest) {
  if (!UNPIN_STATES.has(state)) throw new Error(`内部错误：非法改写档位 ${state}`)
  return Object.freeze({ ...rest, state })
}

/**
 * 把 profile 里那行记死的版本号，改成指向**当前最新版**的范围。
 *
 * ## 为什么必须「改写」而不是「重装」
 *
 * dsh 装插件时往 profile 的 `package.json` 写的是 `"<包名>": "^<装上的那一版>"`。
 * `^x.y.z` 本来允许装更新的，但包管理器**认已经记下来的那个版本**：specifier 没变，
 * 它就不会回头去看有没有新的。所以「卸载再装一次」「再点一次安装」都升不了级——
 * 除非有人先把那行改掉，让它不再被满足。
 *
 * ⚠️ 这**不是**本插件的毛病，是 dsh 插件机制对所有第三方插件都这样。
 * 本函数是能拿到的最小解法：改一个字符串，然后让宿主自己那条 `pnpm install` 去重新解析。
 *
 * ## 纯函数：不碰盘
 *
 * 传进去的是**已解析的 profile package.json 对象**，返回的是「要改成什么」。
 * 写盘那一下在 `applyUnpinToProfile` 里，测试可以分别钉判据与落盘。
 */
export function planUnpin({ pkg, packageName = PACKAGE_NAME, latestVersion }) {
  if (!isRecord(pkg) || typeof latestVersion !== 'string' || latestVersion === '') {
    return finishUnpin('no-target', { packageName, from: null, to: null, field: null })
  }
  const target = `^${latestVersion}`
  for (const field of ['dependencies', 'devDependencies']) {
    const bucket = pkg[field]
    if (!isRecord(bucket) || typeof bucket[packageName] !== 'string') continue
    const from = bucket[packageName]
    // specifier 已经指向当前最新版 ——「已经是它」是一档，不是一档「没改成的失败」。
    if (from === target) return finishUnpin('already-current', { packageName, from, to: target, field })
    bucket[packageName] = target
    return finishUnpin('rewritten', { packageName, from, to: target, field })
  }
  return finishUnpin('not-declared', { packageName, from: null, to: null, field: null })
}

/** `planUnpin` 的落盘那一下。**只改一个键**，其余字节按原样写回。 */
export function applyUnpinToProfile({ profilePkg, ...args }) {
  let pkg
  try {
    pkg = JSON.parse(readFileSync(profilePkg, 'utf8'))
  } catch (parseError) {
    return finishUnpin('no-target', {
      ...args, packageName: args.packageName ?? PACKAGE_NAME, from: null, to: null, field: null,
      detail: `${profilePkg} 读不出内容：${parseError?.message ?? String(parseError)}`,
    })
  }
  const plan = planUnpin({ pkg, ...args })
  if (plan.state === 'rewritten') {
    writeFileSync(profilePkg, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
  }
  return plan
}

/** 一次改写的完整报告。每一档都指名**接下来做什么**，不给「升级失败」让人自己猜。 */
export function formatUnpinNotice(plan, { profile = 'web', packageName = PACKAGE_NAME, latest = null } = {}) {
  const lines = []
  switch (plan.state) {
    case 'rewritten':
      lines.push(`✅ 已把 profile 里记死的版本号改掉了：\`${plan.from}\` → \`${plan.to}\``)
      lines.push('   （dsh 装插件时记的是「装上的那一版」，包管理器认这一行、不自己去看有没有新的——')
      lines.push('   所以不改这一行，卸载重装多少次都还是原来那一版。）')
      break
    case 'already-current':
      lines.push(`ℹ️  profile 里记的已经是当前最新版（\`${plan.to}\`），这一行不用改。`)
      lines.push('   下面那一步仍会跑一次安装，好把「记着的」与「装着的」对齐。')
      break
    case 'not-declared':
      lines.push(`ℹ️  profile 的 package.json 里没有 \`${packageName}\` 这一行——本插件不在这个 profile 的依赖里。`)
      lines.push(`   若你是想装它，直接跑：dsh plugin --profile ${profile} add ${packageName}`)
      return lines.join('\n')
    case 'no-target':
      lines.push(`⚠️ 这一步没有改任何东西：${plan.detail ?? '读不到可改写的目标'}`)
      return lines.join('\n')
    default:
      throw new Error(`内部错误：非法改写档位 ${plan.state}`)
  }
  lines.push('')
  lines.push('现在让 dsh 重新装一次（它会把上面那个新范围解析成当前实际最新版）：')
  lines.push(`  dsh plugin --profile ${profile} install`)
  if (latest !== null) lines.push(`  目标版本：${latest}`)
  lines.push('')
  lines.push('装完**重启 dsh**（关掉再打开），再**新开**一个会话。')
  return lines.join('\n')
}

/* ── 首次安装：装哪一版（`planInstallSpec`）──────────────────────────────── */

/**
 * 首次安装要交给 `dsh plugin add` 的那个 spec。
 *
 * ## 为什么不是裸包名
 *
 * 包管理器对新发布的版本有一层**冷却**（pnpm 11 的 `minimum-release-age`，默认 1440 分钟
 * ＝ 24 小时）。实测（2026-10-03，1.3.1 发布约 10 小时后）：`pnpm add <包名>`、
 * `pnpm add <包名>@latest`、`pnpm add <包名>@^1` **全部装到 1.2.0**（它们解析成「最新的、
 * 够老的那一版」），只有 `pnpm add <包名>@^1.3.1` 装到 1.3.1。所以**发布当天**用裸包名装，
 * 用户拿到的是上一版——而插件页对话框里那行版本（走 `pnpm view`，不受这条策略限制）
 * 显示的是新的，两边天然对不上。
 *
 * ⇒ 这一步读一次 registry，把「要装的那一版」写进 spec。**冷却期外它是多余的，冷却期内
 * 它是唯一能让用户拿到最新版的那一步。**
 *
 * ## 读不出就照旧装，且**明说**
 *
 * `fallback` 那一档不是失败：用户要的是「把插件装上」，registry 读不出来不该把人挡在门外。
 * 但**不许悄悄退回裸包名**——那正是「以为装上了、其实拿到上一版」的那条路。所以回落时
 * 一定带一句「可能装到上一版」和那条能补的命令。
 *
 * **纯函数**：不联网、不碰盘，所以能被逐档喂读数钉住。
 */
const INSTALL_SPEC_STATES = new Set(['pinned', 'fallback'])

function finishInstallSpec(state, rest) {
  if (!INSTALL_SPEC_STATES.has(state)) throw new Error(`内部错误：非法安装 spec 档位 ${state}`)
  return Object.freeze({ ...rest, state })
}

export function planInstallSpec({ latest, packageName = PACKAGE_NAME } = {}) {
  const version = typeof latest === 'string' ? latest.trim() : ''
  if (version === '') {
    return finishInstallSpec('fallback', { packageName, spec: packageName, latest: null })
  }
  return finishInstallSpec('pinned', { packageName, spec: `${packageName}@^${version}`, latest: version })
}

/** 回落那一档要说的话：说清「装到的可能不是最新版」＋**怎么补**（而不是「安装失败」）。 */
export function formatInstallSpecNotice(plan, { latest = null } = {}) {
  if (plan.state === 'pinned') {
    return `ℹ️  这一版钉住了：\`${plan.spec}\`（registry 上当前最新是 ${latest ?? plan.latest}）。`
  }
  return [
    `⚠️ 读不到 npm 上 ${plan.packageName} 的最新版：这次按**裸包名**装，可能装到的是上一版。`,
    '   （发布不到一天的新版本会被包管理器的新版本冷却挡回去——这是它自带的策略，不是装错了。）',
    '   装完想确认自己装的是哪一版、或者换到最新版，跑：',
    `     npx ${plan.packageName} --upgrade`,
  ].join('\n')
}

/* ── CLI ──────────────────────────────────────────────────────────────────── */

function parseArgs(argv) {
  let profile = 'web'
  let upgrade = false
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--profile') {
      profile = argv[i + 1]
      i++
    } else if (argv[i] === '--upgrade') {
      upgrade = true
    } else if (argv[i] === '--sync') {
      throw new Error(
        '`--sync` 已随旧机制一起退役：0.1.7 之后宿主不再扫 ~/.dsh/.agent-presets/，'
        + '盘上那一行由本插件包的声明补丁每次启动重算，没有「同步」这个动作。'
        + '要确认当前那一行是什么，跑 `npx dsh-craft-your-textbook`（第 3 步会读组合树并如实报告）。',
      )
    } else {
      throw new Error(`不认识的参数：${argv[i]}（安装器没有「跳过检查」这类开关）`)
    }
  }
  return { profile, upgrade }
}

/**
 * 安装目标：**不猜**。`DSH_HOME` 指哪就装哪，指不出才用 `~/.dsh`（与旧脚本同一口径）。
 *
 * ⚠️ `legacyDir` 是**旧机制**那个目录（0.1.7 之前宿主扫的位置，宿主已不再读它），
 * 与 `retireLegacyPresetDir` 里的同一条路径是**同一个**指称——所以这里跟着它叫
 * `legacyDir`。它以前叫 `installDir`：同一条路径在同一个文件里叫过两个名字
 * （定义处 `installDir`、消费处 `legacyDir`），读的人得先知道它们是一处才知道
 * `target.installDir` 喂给的是 `retireLegacyPresetDir` 的退役对象。
 */
export function resolveInstallTarget(env = process.env, home = homedir(), profile = 'web') {
  const dshHome = env.DSH_HOME && env.DSH_HOME.trim() !== '' ? env.DSH_HOME : join(home, '.dsh')
  return {
    dshHome,
    profile,
    profileDir: join(dshHome, 'profiles', profile),
    legacyDir: join(dshHome, ...LEGACY_PRESET_DIR_SEGMENTS),
  }
}

/** 默认的「读实际组合树」那一步（真 spawn dsh）。测试注入一个替身，不 spawn。 */
function defaultComposeTree({ dshBin, profile, env }) {
  return readCompositionTree({ dshBin, profile, env })
}

/** 默认的「读宿主版本」那一步（真 spawn `dsh --version`）。测试注入一个替身，不 spawn。 */
function defaultHostVersion({ dshBin }) {
  return readHostVersion({ dshBin })
}

/**
 * 安装器主体。**它只返回退出码，不抛**。
 *
 * 任何漏到这里的异常都在最外层变成一句说人话的错误 ＋ 非零退出——票面点名的那条硬要求：
 * `npx dsh-craft-your-textbook` 在任何输入下都不许吐 Node 堆栈。
 */
export async function runInstaller({
  argv = process.argv.slice(2),
  env = process.env,
  home = homedir(),
  log = console.log,
  error = console.error,
  dshBin = process.platform === 'win32' ? 'dsh.cmd' : 'dsh',
  presetDir = join(PKG_DIR, 'preset'),
  composeTree = defaultComposeTree,
  readVersion = defaultHostVersion,
  readLatest = readLatestPublishedVersion,
  runHost = spawnHost,
  minimumVersion = MINIMUM_HOST_VERSION,
} = {}) {
  if (argv.includes('-h') || argv.includes('--help')) {
    usage()
    return 0
  }
  let profile
  let upgrade
  try {
    ({ profile, upgrade } = parseArgs(argv))
  } catch (parseError) {
    error(`❌ ${parseError.message}`)
    return 1
  }
  const target = resolveInstallTarget(env, home, profile)

  log('造书工作台安装脚本')
  log(`  profile：${profile}`)
  log(`  DSH 数据目录：${target.dshHome}`)
  log(`  模式身份：${MODE_ID}（声明行由本插件包随 bundle 补丁发出，本脚本不写它）`)
  log('')

  // ── 0) 宿主版本 ───────────────────────────────────────────────────────────
  // **在任何写动作之前**。第 1 步与第 2 步都留痕，等判出来再停就晚了。
  log('第 0 步：读宿主版本…')
  let versionVerdict
  try {
    versionVerdict = judgeHostVersion(readVersion({ dshBin }), { minimum: minimumVersion })
  } catch (versionError) {
    versionVerdict = judgeHostVersion(
      { ok: false, code: 'host-version-unreadable', source: `\`${dshBin} --version\``, detail: versionError?.message ?? String(versionError) },
      { minimum: minimumVersion },
    )
  }
  if (versionVerdict.state === 'below-minimum') {
    // 「不装」是这一档的字面意思：连第 1 步都不开始，磁盘上一个字节都不动。
    for (const line of formatHostVersionNotice(versionVerdict)) error(line)
    return 1
  }
  for (const line of formatHostVersionNotice(versionVerdict)) {
    if (versionVerdict.state === 'meets-minimum') log(line)
    else error(line)
  }
  log('')

  // ── 0b) 升级：把 profile 里记死的那个版本号解开（只有 --upgrade 才做）────────
  //
  // 位置在第 1 步**之前**是刻意的：第 1 步要触发的正是「让包管理器重新解析」，
  // 而重新解析的前提是 specifier 已经不再被 lock 满足。两步顺序反了就白跑。
  //
  // ⚠️ **两条路都要读一次 registry**：升级用它解开记死的号，普通安装用它**钉住要装的那一版**
  // （裸包名会撞上新版本冷却，见 `planInstallSpec`）。读一次，两处用同一个读数——
  // 两个读数会出现「升级说 1.3.1、装的说 1.2.0」那种自相矛盾，而用户看不到读数只看到结果。
  let latest = null
  try {
    latest = await readLatest({ packageName: PACKAGE_NAME })
  } catch (latestError) {
    latest = { ok: false, code: 'registry-unreachable', detail: latestError?.message ?? String(latestError) }
  }
  let latestVersion = null
  if (upgrade) {
    log('第 0b 步：解开 profile 里记死的版本号（--upgrade）…')
    if (latest.ok === true) {
      latestVersion = latest.version
      const unpin = applyUnpinToProfile({
        profilePkg: join(target.profileDir, 'package.json'),
        packageName: PACKAGE_NAME,
        latestVersion,
      })
      for (const line of formatUnpinNotice(unpin, { profile, packageName: PACKAGE_NAME, latest: latestVersion }).split('\n')) {
        log(line === '' ? '' : `  ${line}`)
      }
      if (unpin.state === 'no-target') {
        error('❌ 这一步没有改任何东西，升级中止（插件与 bundles 仍然照原样，没被破坏）。')
        return 1
      }
    } else {
      // 读不出最新版就**不改**。拿一个猜的版本号去改真实用户的配置，比不改坏得多。
      for (const line of [
        `⚠️ 读不到 npm 上 ${PACKAGE_NAME} 的最新版：${latest.detail ?? '原因不详'}`,
        '   本安装器**不拿「大概的最新版」糊过去**，所以**一个字节都没有改**。',
        '   等网络通了一次再跑同一条命令就好：',
        `     npx ${PACKAGE_NAME} --upgrade`,
        '',
        '   想自己看最新版是多少：',
        `     npm view ${PACKAGE_NAME} version`,
      ]) error(line === '' ? '' : `  ${line}`)
      return 1
    }
    log('')
  }

  // ── 1) dsh plugin add ─────────────────────────────────────────────────────
  log(upgrade ? '第 1 步：让 dsh 重新装一次（dsh plugin install）…' : '第 1 步：把插件装进 profile（dsh plugin add）…')
  // 走宿主 CLI 的**唯一出口**：Windows 上 `dsh` 是 npm 装的那层 `.cmd` shim，不经 shell
  // 跑不了（`spawnSync('dsh.cmd', …)` 恒 EINVAL）。漏掉这一层的后果是「静默没装上」——
  // 用户以为装完了，第 3 步才报「组合树里没有那一行」，病因与症状隔了两步
  // （票 `ship-mode-installable/01`）。
  // ⚠️ 升级走 `install` 而不是 `add`：`add` 对已装的包会报「已经装过了」直接返回，
  // 真正让 specifier 重新解析的是 `install`（dsh 把 pnpm 参数逐字转发，见 lib/bin.js）。
  // ⚠️ 普通安装传的是**带版本号的 spec**（`pkg@^<registry 最新>`）：裸包名会被包管理器的
  // 新版本冷却挡回上一版，于是「发布当天装的人」拿到的是上一版（`planInstallSpec` 的注释）。
  // 这一步**只把版本写进交给宿主的 spec**，不碰用户的 profile 文件——改 profile 那一行仍然
  // 只由 `--upgrade` 那一步做（`applyUnpinToProfile`），两条路的权限面不许混。
  const installSpec = planInstallSpec({ latest: latest.ok === true ? latest.version : null })
  if (!upgrade) {
    // 钉住那一版是**好消息**（走 log）；回落是**要盯一眼的事**（走 error，与本文件其余
    // 「读不出/拿不准」的警告同一出口）——「可能装到上一版」这句话绝不能混进普通输出里
    // 被滚过去。
    const sink = installSpec.state === 'pinned' ? log : error
    for (const line of formatInstallSpecNotice(installSpec, { latest: installSpec.latest }).split('\n')) {
      sink(line === '' ? '' : `  ${line}`)
    }
  }
  const pluginArgs = upgrade
    ? ['plugin', '--profile', profile, 'install']
    : ['plugin', '--profile', profile, 'add', installSpec.spec]
  const r = runHost(dshBin, pluginArgs, { stdio: 'inherit' })
  if (r.error?.code === 'host-cli-rejected') {
    error(`❌ ${r.error.message}`)
    error('  这一条是本脚本自己拒绝执行的，不是 dsh 报的错。请换一条不带 shell 元字符的 dsh 路径。')
    return 1
  }
  if (r.error) {
    error(`⚠️  没能自动调用 dsh 命令（${r.error.message}）。`)
    error(`  请手动执行一次：dsh ${pluginArgs.join(' ')}`)
    error('  然后继续看下面的步骤。')
  } else if (r.status !== 0) {
    error(`⚠️  dsh plugin 返回了非零状态（${r.status}），请看一下上面的报错。`)
  }
  log('')

  // ── 2) bundles 列表 ───────────────────────────────────────────────────────
  log(`第 2 步：把 ${PACKAGE_NAME} 加进 profile 的 bundles 列表…`)
  const profilePkg = join(target.profileDir, 'package.json')
  if (!existsSync(profilePkg)) {
    error(`❌ 找不到 ${profilePkg}`)
    error(`  请先确认 dsh 已安装、且 ${profile} profile 已初始化（至少启动过一次）。`)
    return 1
  }
  let pkg
  try {
    pkg = JSON.parse(readFileSync(profilePkg, 'utf8'))
  } catch (parseError) {
    error(`❌ ${profilePkg} 读不出内容：${parseError.message}`)
    error('  这一步要把本包登记进 profile 的 bundles，没法在读不出来的时候继续。')
    return 1
  }
  const bundles = pkg.dsh?.profile?.bundles ?? []
  if (bundles.includes(PACKAGE_NAME)) {
    log('  已经在列表里，跳过。')
  } else {
    pkg.dsh ??= {}
    pkg.dsh.profile ??= {}
    pkg.dsh.profile.bundles = [...bundles, PACKAGE_NAME]
    writeFileSync(profilePkg, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
    log('  已写入 bundles 列表。')
  }
  log('')

  // ── 3) 检测宿主组合树里那一行（**不写任何文件**） ──────────────────────────
  log('第 3 步：读宿主组合树，比对造书模式的那一行…')
  const shipped = await readShippedDeclaration({ presetDir })
  let tree
  if (shipped.ok === true) {
    tree = await composeTree({ dshBin, profile, env })
  } else {
    tree = { ok: false, code: 'composition-tree-unreadable', detail: '本包没有可对照的生成物，先不读组合树' }
  }
  tree = { ...tree, origin: tree?.origin ?? `dsh --profile ${profile} --dump-config` }
  const plan = classifyModeInstall({ shipped, tree })
  log(formatModeInstallSummary(plan, { profile }).split('\n').map((line) => (line === '' ? '' : `  ${line}`)).join('\n'))

  // 旧目录：宿主已不再读它，带备份退役掉，并**点名说明**。
  let retired
  try {
    retired = retireLegacyPresetDir({ dshHome: target.dshHome })
  } catch (retireError) {
    retired = { action: 'failed', legacyDir: target.legacyDir, retiredPath: null, detail: retireError?.message ?? String(retireError) }
  }
  if (retired.action === 'retired') {
    log(`  旧目录已退役：${retired.detail}`)
    log('  ⚠️ 0.1.7 之后宿主**不再读** ~/.dsh/.agent-presets/textbook/——那一整套目录机制已被上游取消。')
    log('     留着会让人继续去改它、改完发现没反应，所以本次把它改名保留在原处。')
  } else if (retired.action === 'kept') {
    log(`  旧目录：${retired.detail}`)
    log('  ⚠️ 它同样已经不会被宿主读取（0.1.7 取消了那套目录扫描），留着可以，手工删掉也行。')
  }
  log('')

  // 只有「逐项相同」才算这一次成立。其余每一档都以非零退出——不让「装过了」被当成事实。
  if (plan.state !== 'in-sync') {
    error('❌ 第 3 步没有确认造书模式那一行与本包一致（原因与修法见上面）。插件与 bundles 仍然已装好。')
    return 1
  }

  // ── 4) 收尾：重启 + 新会话 + 怎么自己确认 ─────────────────────────────────
  log(formatRestartNotice({ profile }))
  log('')
  log('需要的两个钥匙：')
  log('  1. 大模型接口：右上角 设置 → 模型 → 添加你自己的模型接口（DeepSeek 官方 key 等）。')
  log('  2. MinerU Token：PDF 转换要用，去 https://mineru.net 注册免费 Token，在工作台里粘贴保存。')
  return 0
}

/** 被当脚本执行时才跑 CLI；被测试 import 时只暴露判据本身。 */
export async function main(argv = process.argv.slice(2)) {
  try {
    return await runInstaller({ argv })
  } catch (error) {
    // 最后一道闸：任何漏出去的异常都在这里变成一句说人话的错误 ＋ 非零退出。
    // 这一格是票面的硬要求——`npx dsh-craft-your-textbook` 在任何输入下都不许吐 Node 堆栈。
    console.error(`❌ 安装器内部出错：${error?.message ?? String(error)}`)
    console.error('  这不是预期路径（上面那几行是原因）。请把上面整段输出贴给维护者。')
    return 1
  }
}

if (process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().then((code) => {
    process.exitCode = code
  })
}
