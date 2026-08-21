#!/usr/bin/env node
/**
 * 造书工作台 · 一键安装脚本（给安装方用）
 *
 * 用法：
 *   npx dsh-craft-your-textbook              用默认 web profile 安装
 *   npx dsh-craft-your-textbook --profile tui  装到别的 profile
 *
 * 做四件事：
 *   1. 用 `dsh plugin` 把本插件装进 profile（等价于 pnpm add）
 *   2. 把 dsh-craft-your-textbook 写进 profile 的 bundles 列表（没有它宿主不会挂载）
 *   3. 把「造书模式」preset 拷到 <DSH_HOME>/.agent-presets/textbook/
 *   4. 提示重启
 *
 * 只用到 Node 内置模块，不依赖任何第三方包。
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG_DIR = join(HERE, '..')

function usage() {
  console.log(`造书工作台 · 一键安装

用法：
  npx dsh-craft-your-textbook               安装到默认的 web profile
  npx dsh-craft-your-textbook --profile tui 安装到指定 profile

安装后请重启 dsh（关掉再打开），然后：
  新会话 → 模式选「造书模式」→ 中间会出现「工作台」页签。`)
}

const args = process.argv.slice(2)
if (args.includes('-h') || args.includes('--help')) {
  usage()
  process.exit(0)
}

let profile = 'web'
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--profile') {
    profile = args[i + 1]
    i++
  }
}

const dshHome = process.env.DSH_HOME || join(homedir(), '.dsh')
const profileDir = join(dshHome, 'profiles', profile)
const profilePkg = join(profileDir, 'package.json')
const presetDest = join(dshHome, '.agent-presets', 'textbook')

console.log('造书工作台安装脚本')
console.log(`  profile：${profile}`)
console.log(`  DSH 数据目录：${dshHome}`)
console.log()

// ── 1) dsh plugin add ────────────────────────────────────────────────────────
const dshBin = process.platform === 'win32' ? 'dsh.cmd' : 'dsh'
console.log('第 1 步：把插件装进 profile（dsh plugin add）…')
const r = spawnSync(dshBin, ['plugin', '--profile', profile, 'add', 'dsh-craft-your-textbook'], {
  stdio: 'inherit',
})
if (r.error) {
  console.warn(`⚠️  没能自动调用 dsh 命令（${r.error.message}）。
  请手动执行一次：dsh plugin --profile ${profile} add dsh-craft-your-textbook
  然后继续看下面的步骤。`)
} else if (r.status !== 0) {
  console.warn(`⚠️  dsh plugin 返回了非零状态（${r.status}），请看一下上面的报错。`)
}
console.log()

// ── 2) bundles 列表 ──────────────────────────────────────────────────────────
console.log('第 2 步：把 dsh-craft-your-textbook 加进 profile 的 bundles 列表…')
if (!existsSync(profilePkg)) {
  console.error(`❌ 找不到 ${profilePkg}
  请先确认 dsh 已安装、且 ${profile} profile 已初始化（至少启动过一次）。`)
  process.exit(1)
}
const pkg = JSON.parse(readFileSync(profilePkg, 'utf8'))
const bundles = (pkg.dsh?.profile?.bundles ?? [])
if (bundles.includes('dsh-craft-your-textbook')) {
  console.log('  已经在列表里，跳过。')
} else {
  pkg.dsh ??= {}
  pkg.dsh.profile ??= {}
  pkg.dsh.profile.bundles = [...bundles, 'dsh-craft-your-textbook']
  writeFileSync(profilePkg, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
  console.log('  已写入 bundles 列表。')
}
console.log()

// ── 3) 拷贝「造书模式」preset ────────────────────────────────────────────────
console.log('第 3 步：安装「造书模式」preset…')
if (existsSync(presetDest)) {
  console.log(`  ${presetDest} 已存在，跳过（保留你现有的造书模式设置）。`)
} else {
  mkdirSync(presetDest, { recursive: true })
  for (const f of ['preset.yml', 'agent.cordis.yml']) {
    copyFileSync(join(PKG_DIR, 'preset', f), join(presetDest, f))
  }
  console.log(`  已安装到 ${presetDest}`)
}
console.log()

// ── 4) 收尾 ──────────────────────────────────────────────────────────────────
console.log('✅ 安装完成！最后一步：')
console.log('  重启 dsh（关掉再打开，或运行启动脚本），然后：')
console.log('  新会话 → 模式选「造书模式」→ 中间会出现「工作台」页签，点进去开始造书。')
console.log()
console.log('需要的两个钥匙：')
console.log('  1. 大模型接口：右上角 设置 → 模型 → 添加你自己的模型接口（DeepSeek 官方 key 等）。')
console.log('  2. MinerU Token：PDF 转换要用，去 https://mineru.net 注册免费 Token，在工作台里粘贴保存。')
