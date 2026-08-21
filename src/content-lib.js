/**
 * 造书内容生成库（v2 · 主 AI 嵌入工作流）
 *
 * 流水线（源探查/设计提案/章节骨架/范例章/铺章/自查/合并）真实模式已交由
 * 主对话 AI 亲手完成（宿主通过 workbench_act 的 stage-brief 派发方法论素材，
 * 不在这里跑子代理）。本库保留：
 *  - demo 模式：演示书的流水线占位产出（明确标注演示内容，仅用于熟悉流程）
 *  - 向导与辅助：选书建议（wizard）、PDF 角色识别（roles）、每章字数建议（words）
 *    —— 这三类仍是宿主侧一次性子代理（快捷建议，非流水线写作）
 *
 * resources/ 方法论文件由 workflow.js 的 buildStageBrief 通过 resourceText 读取，
 * 嵌入交办说明给主 AI。
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { jsonrepair } from 'jsonrepair'

const HERE = dirname(fileURLToPath(import.meta.url))
export const RESOURCES_DIR = join(HERE, '..', 'resources')

/** 读 vendored 方法论文件；缺失时返回提示。 */
export function resourceText(rel) {
  try {
    return readFileSync(join(RESOURCES_DIR, rel), 'utf8')
  } catch {
    return `（方法论文件缺失: ${rel}）`
  }
}

const DEMO_MARK = '【演示内容 · 仅用于熟悉流程，非真实产出】'

// ── 一次性子代理执行（向导/识别/字数建议等快捷任务用） ─────────────────────

/**
 * 派发一个一次性子代理，返回其最终文本。
 * runtime: { ctx, demo, dir, project, getParent }
 * timeoutMs：单任务硬超时（默认 15 分钟；超时自动报错）。
 */
async function runSubagent(runtime, label, promptText, timeoutMs = 15 * 60 * 1000) {
  const parent = await runtime.getParent()
  const run = await runtime.ctx.subagents.start('spawn', {
    label,
    prompt: [{ type: 'text', text: promptText }],
    parent,
    signal: AbortSignal.timeout(timeoutMs),
  })
  try {
    const result = await run.result
    if (result.stopReason !== 'completed') {
      const tail = result.output
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n')
        .slice(0, 300)
      runtime.ctx.logger.warn(`textbook: 子代理「${label}」未完成（${result.stopReason}），输出尾部: ${tail}`)
      throw new Error(`子代理未完成（${result.stopReason}）`)
    }
    const text = (() => {
      const blocks = result.output.filter((block) => block.type === 'text')
      // 只取最后一段文本（最终答复）；前面的推理/计划文本不算数。
      return blocks.length > 0 ? blocks[blocks.length - 1].text.trim() : ''
    })()
    if (text === '') throw new Error('子代理没有产出文本')
    return text
  } finally {
    await run.dispose()
  }
}

/**
 * 宽容 JSON 解析：子代理输出常带解释文字、markdown 代码块、裸控制字符或未转义引号。
 * 依次尝试：直接解析 → 清理控制字符 → jsonrepair 修复 → 提取首个 {…} 片段 → 片段修复。
 */
function parseJsonLoose(raw) {
  const clean = (text) => text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
  const candidates = [raw, clean(raw)]
  for (const candidate of candidates) {
    try { return JSON.parse(candidate) } catch { /* 继续 */ }
  }
  for (const candidate of candidates) {
    try { return JSON.parse(jsonrepair(candidate)) } catch { /* 继续 */ }
  }
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start >= 0 && end > start) {
    const segment = raw.slice(start, end + 1)
    for (const candidate of [segment, clean(segment)]) {
      try { return JSON.parse(candidate) } catch { /* 继续 */ }
    }
    try { return JSON.parse(jsonrepair(segment)) } catch { /* 继续 */ }
  }
  throw new Error(`AI 输出不是合法 JSON（已尝试全部修复）：${raw.slice(0, 120)}`)
}

// ── 演示模式 · 流水线占位产出（仅 demo 书） ────────────────────────────────

function demoExplore() {
  return {
    index: `${DEMO_MARK}
# 源材料索引（演示）

## 材料清单
- 《示例教材》全文（由 MinerU 转换的 Markdown）

## 结构观察
1. 全书按"概念 → 例题 → 练习"组织，共 6 章。
2. 权威层级：教材正文 > 例题 > 练习。
3. 角色标签：学生用书（正文）、教师用书（讲解提示）。

## 教学线索
- 知识点密度中等，公式较少。
- 每章末有小结与习题，适合直接复用为"自查清单"。
`,
    knowledgeMap: {
      materials: [{ num: 1, sections: [{ title: '数的认识', summary: '数与运算的基础概念', keywords: ['数', '运算'] }] }],
      knowledgePoints: [{ id: 'kp-1', title: '数的认识', source: '资料1：数的认识', summary: '数与运算的基础概念', difficulty: '低' }],
      teachingFocus: ['重点：概念清晰', '难点：应用题理解'],
      chapterSuggestion: [{ title: '数的认识', source: '资料1', points: ['kp-1'] }],
    },
  }
}

function demoGateProposal(runtime, params) {
  const { gate, version } = params
  const base = {
    '1': {
      title: 'AI 提议：先明确这本书要让学习者学会什么',
      summary: '这本书的目标是：学完能独立做对教材配套的基础题，并说出每个概念"是什么、为什么、怎么用"。\n最大难点：概念记住了但不会用，例题看得懂、变个形式就不会。',
    },
    '2': {
      title: 'AI 提议：用"概念 → 例子 → 易错点 → 小练习"的固定板块',
      summary: '每章按四段式组织：先讲清概念（配生活例子），再给 2-3 个由浅入深的例题，然后专门讲"最容易错的地方"，最后放 5 道小练习（带答案）。\n叙述上用一个"小明学数学"的贯穿案例串起全书，降低理解门槛。',
    },
    '3': {
      title: 'AI 提议：全书 6 章、每章约 15 分钟学完',
      summary: '第1章 数的认识 → 第2章 加减法 → 第3章 乘法 → 第4章 除法 → 第5章 混合运算 → 第6章 应用题综合。\n每章内部：概念（10分钟）→ 例题（10分钟）→ 易错提醒（5分钟）→ 小练习（15分钟）。\n第 6 章末尾附"全书自查清单"。',
    },
  }
  const entry = base[String(gate)]
  if (entry === undefined) throw new Error(`未知关卡: ${gate}`)
  return { title: `${entry.title}（演示·v${version}）`, summary: entry.summary, detail: `${DEMO_MARK}\n完整方案正文（演示）：\n${entry.summary}\n\n章节级细节表格……` }
}

function demoGoldChapter(runtime, params) {
  // 修订回路演示：把本轮意见要点织进新稿，让「稿间对比」真的看得到变化。
  const redoNote = typeof params?.redoNote === 'string' ? params.redoNote.trim() : ''
  const redoSection = redoNote === ''
    ? ''
    : `\n\n## 本稿按你的意见改了（演示）\n\n已照以下意见调整：${redoNote}\n`
  return {
    styleSpec: `${DEMO_MARK}\n# style-spec（演示）\n板块：概念 → 例题 → 易错点 → 小练习。叙述口吻：像老师讲课，用"你"。`,
    chapter: `${DEMO_MARK}\n# 第1章 数的认识（最佳范例·演示）\n\n## 概念\n数是用来数东西的符号……\n\n## 例题\n例1 ……\n\n## 易错点\n不要把 0 和"没有"搞混……\n\n## 小练习\n1. ……（答案：……）${redoSection}`,
    audit: { passed: true, issues: [{ level: '提示', text: '演示章未做真实审计' }] },
  }
}

function demoChapterWrite(runtime, params) {
  const { n, title } = params
  return `${DEMO_MARK}\n# 第${n}章 ${title}（演示）\n\n## 概念\n（演示内容：${params.outline ?? ''}）\n\n## 例题\n例1 ……\n\n## 易错点\n……\n\n## 小练习\n1. ……`
}

function demoChapterAudit() {
  return { passed: true, issues: [{ level: '提示', text: '演示章未做真实审计' }] }
}

function demoMergeBook(runtime, params) {
  const { chapters, title } = params
  const parts = [`# ${title}（演示成品）`, '', '> 本书由造书工作台演示模式生成，仅用于熟悉流程。']
  for (const [n, { title: chapterTitle, text }] of chapters.entries()) {
    parts.push('', `---`, '', `# 第${n + 1}章 ${chapterTitle}`, '', (text ?? '').replace(/^# .*$/m, '').trim())
  }
  return parts.join('\n')
}

function demoOutline() {
  return {
    chapters: [
      { title: '数的认识', outline: '什么是数、数的读写、大小比较', source: '材料1：数的认识部分', targetWords: 4000 },
      { title: '加减法', outline: '不进位/进位加法、不退位/退位减法', source: '材料1：加减法部分', targetWords: 5000 },
      { title: '应用题综合', outline: '读懂题意、分步列式、检查答案', source: '材料2：应用题部分', targetWords: 6000 },
    ],
  }
}

// ── 选书向导 / 角色识别 / 字数建议（真实子代理） ──────────────────────────

export function guessRoleFromName(name) {
  const n = String(name ?? '').toLowerCase()
  if (/(教师|教参|teacher|教学参考|教师用书)/.test(n)) return '教师用书'
  if (/(考纲|大纲|课标|syllabus|课程标准)/.test(n)) return '考纲'
  if (/(真题|试卷|试题|卷子|exam|paper|test)/.test(n)) return '真题'
  if (/(讲义|教案|课件|笔记|handout|notes)/.test(n)) return '讲义'
  return '学生用书'
}

const ROLE_LIST = ['学生用书', '教师用书', '考纲', '讲义', '真题']

async function wizardSuggest(runtime, params) {
  const hint = typeof params.hint === 'string' && params.hint.trim() !== '' ? params.hint.trim() : ''
  if (runtime.demo) {
    return {
      suggestions: hint === ''
        ? [
            { name: '初中数学·有理数', goal: '学完能独立做对教材配套的基础题，并说出每个概念是什么、为什么、怎么用', science: true },
            { name: '小学英语·自然拼读', goal: '看到陌生单词能试读出来，听写常见单词不再怕', science: false },
            { name: '高中物理·力学入门', goal: '能用受力分析解典型题，看懂"为什么物体会动"', science: true },
          ]
        : [
            { name: `围绕"${hint.slice(0, 12)}"的入门书`, goal: '学完能独立完成对应基础练习，并说出每个概念是什么、为什么、怎么用', science: false },
            { name: `${hint.slice(0, 12)}：从例子到规律`, goal: '能用自己的话讲清楚知识点的来龙去脉，做对配套练习', science: false },
            { name: `${hint.slice(0, 12)}：查漏补缺版`, goal: '找出最薄弱的两三处并逐一攻克，配套练习正确率达到九成', science: false },
          ],
    }
  }
  const contextBlock = hint === ''
    ? '用户没有填写背景信息。请给出 3 个覆盖面广的通用建议（不同学科/场景）。'
    : `用户的背景信息：「${hint}」——这是唯一依据，严禁无视它、套用默认模板。`
  const prompt = `你是"造书工作台"的选书顾问，为想"造一本书"的用户推荐起点。用户是谁、想要什么，完全由下面这条背景信息决定：

${contextBlock}

规则：
1. 背景填写了：先想清楚"这位用户是谁、最急的事是什么"，再推荐对应的书。
   · 背景是成年人/职业/考证（如 PMP、CPA、法考、考研）→ 推荐对应的备考书，书名和 goal 都用成年人的说法。
     例子：name「PMP 备考·项目管理知识体系」goal「学完能掌握五大过程组与十大知识领域，刷题正确率 80% 以上，有信心走进考场」。
   · 背景是学习者/年级/学科（如三年级、古诗）→ 推荐对应的教材书。
2. 背景没填写：给 3 个不同方向的通用建议。
3. 严禁无视背景、一律按"中小学生教材"输出。

输出严格 JSON（不要解释、不要代码块）：
{"suggestions":[{"name":"书名（具体、贴近教材）","goal":"学完要能做到什么（一句话，具体可检验，措辞贴合用户身份）","science":true或false}]}
三个建议要互相有差异（打基础 / 补短板 / 提兴趣 / 备考冲刺等）。
字符串内部严禁使用英文双引号，引用一律用「」。`
  const raw = await runSubagent(runtime, '选书建议', prompt)
  const parsed = parseJsonLoose(raw)
  if (Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) return parsed
  throw new Error('建议格式不对')
}

async function suggestRoles(runtime, params) {
  const files = Array.isArray(params.files) ? params.files.slice(0, 20) : []
  if (files.length === 0) return { roles: [] }
  if (runtime.demo) {
    return { roles: files.map((file) => ({ file, role: guessRoleFromName(file) })) }
  }
  const listText = files.map((file, index) => `${index + 1}. ${file}`).join('\n')
  const prompt = `你是教材分类助手。用户一次性上传了几本 PDF 教材，请根据"文件名"判断每本属于哪一类，只能从这 5 类里选 1 个：
- 学生用书：课本正文
- 教师用书：教师版、教参、教学指导
- 考纲：考试大纲、课程标准
- 讲义：补充讲义、教案、课件、笔记
- 真题：历年试卷、真题集、练习题集

文件名列表：
${listText}

输出严格 JSON（不要解释、不要代码块）：
{"roles":[{"file":"文件名（原样照抄）","role":"类别"}]}
每个文件都要有；拿不准的按文件名猜一个最像的。字符串内部严禁使用英文双引号。`
  const raw = await runSubagent(runtime, '识别角色', prompt)
  const parsed = parseJsonLoose(raw)
  if (!Array.isArray(parsed.roles) || parsed.roles.length === 0) throw new Error('角色格式不对')
  // 按原始文件名对齐，缺的用规则补。
  const byFile = new Map(parsed.roles.map((item) => [item.file, item.role]))
  const roles = files.map((file) => ({
    file,
    role: ROLE_LIST.includes(byFile.get(file)) ? byFile.get(file) : guessRoleFromName(file),
  }))
  return { roles }
}

async function suggestWords(runtime, params) {
  const goal = typeof params.goal === 'string' ? params.goal : ''
  const route = params.route === 'human' ? '给人直接读的教材' : '给 AI 老师上课用的教学蓝本'
  const science = params.science === true
  const chapterCount = Number.isFinite(Number(params.chapterCount)) && Number(params.chapterCount) > 0 ? Number(params.chapterCount) : 7
  if (runtime.demo) {
    return { suggested: 6000, range: '5000-7000', reason: '（演示建议）每章 6000 字左右，保证内容充实。' }
  }
  const prompt = `你是"造书工作台"的编辑顾问，为一位家长/老师建议"每章目标字数"。

学习目标：${goal || '（未填写）'}
使用方式：${route}
理科内容：${science ? '是' : '否'}
全书章节数：${chapterCount} 章

请给出合理的"每章正文目标字数"建议（考虑：成人实用教材、篇幅充实但不啰嗦、总字数可控）。输出严格 JSON（不要解释、不要代码块）：
{"suggested":6000,"range":"5000-7000","reason":"一句话理由（家长能看懂）"}`
  try {
    const raw = await runSubagent(runtime, '字数建议', prompt, 120 * 1000)
    const parsed = parseJsonLoose(raw)
    const suggested = Number(parsed.suggested)
    if (!Number.isFinite(suggested) || suggested < 500) throw new Error('建议字数不合法')
    return {
      suggested: Math.round(suggested),
      range: typeof parsed.range === 'string' ? parsed.range : '',
      reason: typeof parsed.reason === 'string' ? parsed.reason : '',
    }
  } catch {
    return { suggested: 6000, range: '5000-7000', reason: '（AI 建议暂不可用，使用默认值）' }
  }
}

/** 自定义模式分析：用户粘贴一段教学/结构描述 → AI 提炼成「模式卡」（加入本书模式库用）。 */
async function analyzePattern(runtime, params) {
  const text = typeof params.text === 'string' ? params.text.trim() : ''
  if (text === '') throw new Error('请先粘贴要分析的文本')
  if (runtime.demo) {
    return {
      card: {
        name: '自定义板块（演示）',
        problem: '按你粘贴的描述提炼的板块结构（演示占位，真实模式由 AI 分析生成）',
        when: '本书写作时使用',
        blocks: `1. 先呈现：${text.slice(0, 50)}${text.length > 50 ? '…' : ''}\n2. 再逐条落地为章节板块。`,
      },
    }
  }
  const prompt = `你是"造书工作台"的教学模式设计师。用户粘贴了一段对「教学结构/教法/板块」的描述，请把它提炼成一张标准「模式卡」，供 AI 写书时选用（与内置模式库格式一致）。

模式卡字段：
- name：模式名（4-12 个字的动词短语，如「先场景后概念」「误区判断题」）
- problem：它解决哪个教学问题（一句话，家长能看懂）
- when：什么时候用（什么场景/什么类型的内容适合）
- blocks：在章节里怎么落地——板块/步骤怎么排、每步干什么（可执行的写法，用「1. … 2. … 3. …」编号）

用户粘贴的文本：
「${text.slice(0, 3000)}」

输出严格 JSON（不要解释、不要代码块）：
{"card":{"name":"…","problem":"…","when":"…","blocks":"…"}}
字符串内部严禁使用英文双引号，引用一律用「」。`
  const raw = await runSubagent(runtime, '分析自定义模式', prompt, 120 * 1000)
  const parsed = parseJsonLoose(raw)
  const card = parsed?.card
  if (card === null || typeof card !== 'object') throw new Error('模式分析格式不对')
  const name = typeof card.name === 'string' ? card.name.trim() : ''
  if (name === '') throw new Error('模式分析缺少模式名')
  return {
    card: {
      name,
      problem: typeof card.problem === 'string' ? card.problem.trim() : '',
      when: typeof card.when === 'string' ? card.when.trim() : '',
      blocks: typeof card.blocks === 'string' ? card.blocks.trim() : '',
    },
  }
}

/** 按任务类型生成内容。 */
export async function generateContent(runtime, kind, params = {}) {
  // 流水线任务：只支持演示模式（真实模式已由主 AI 接管，走到这说明是配置错误）。
  const pipeline = (demoCode) => {
    if (runtime.demo) return demoCode(runtime, params)
    throw new Error(`流水线任务「${kind}」应由主 AI 经 stage-brief/stage-submit 完成，不应在这里调用`)
  }
  switch (kind) {
    case 'explore': return pipeline(demoExplore)
    case 'gate': return pipeline(demoGateProposal)
    case 'outline': return pipeline(demoOutline)
    case 'gold': return pipeline(demoGoldChapter)
    case 'chapter': return pipeline(demoChapterWrite)
    case 'audit': return pipeline(demoChapterAudit)
    case 'merge': return pipeline(demoMergeBook)
    case 'words': return await suggestWords(runtime, params)
    case 'wizard': return await wizardSuggest(runtime, params)
    case 'roles': return await suggestRoles(runtime, params)
    case 'pattern': return await analyzePattern(runtime, params)
    default: throw new Error(`未知生成任务: ${kind}`)
  }
}
