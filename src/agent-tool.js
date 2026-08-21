/**
 * 造书工作台 · 对话侧工具（agent 预设行）
 *
 * 让"造书模式"的主笔 AI 真正执行流水线：
 *  - workbench_status：只读，查看当前进度/交办任务/关卡/材料/抽查意见/章节状态
 *  - workbench_act：
 *       · stage-brief   —— 领取机器派给主 AI 的阶段任务（说明 + 方法论 + 产物要求）
 *       · stage-submit  —— 交工（机器逐项验货，合格才放行）
 *       · progress      —— 上报进度（工作台状态卡实时显示）
 *       · 其余为用户代操作（改名/改目标/建书/拍板/回退/重试/删除），
 *         人设要求"用户明确同意后才调用"。
 *
 * 通过本地 webServer 的 /textbook/* 接口与宿主交互（与前端同一通道）。
 * 不 import @deepseek-ai/dsh-tools：agent 上下文可能解析不到，这里自带
 * 参数简写 → JSON Schema 的转换（与 defineTool 等价的最小实现）。
 */
import { appendFileSync } from 'node:fs'
import { join } from 'node:path'

export const name = 'textbook-agent-tool'
export const inject = ['tools']

/** 诊断日志：设置 TEXTBOOK_TOOL_DEBUG=1 时写入 $DSH_HOME/tool-debug.log。 */
function debugLog(payload) {
  try {
    if (typeof process === 'undefined' || process.env === undefined || process.env.TEXTBOOK_TOOL_DEBUG !== '1') return
    const home = process.env.DSH_HOME
    if (typeof home !== 'string' || home === '') return
    appendFileSync(join(home, 'tool-debug.log'), `${new Date().toISOString()} ${JSON.stringify(payload)}\n`)
  } catch { /* 诊断失败不影响功能 */ }
}

/** 参数简写（{ key: {type, required?, description?, enum?, items?} }）→ JSON Schema。 */
function shorthandToJsonSchema(spec) {
  const properties = {}
  const required = []
  for (const [key, def] of Object.entries(spec ?? {})) {
    const prop = { type: def.type }
    if (def.description !== undefined) prop.description = def.description
    if (def.enum !== undefined) prop.enum = def.enum
    if (def.items !== undefined) prop.items = def.items
    properties[key] = prop
    if (def.required === true) required.push(key)
  }
  return {
    type: 'object',
    properties,
    ...(required.length > 0 ? { required } : {}),
    additionalProperties: false,
  }
}

/** 与 defineTool 等价的最小注册形态。 */
function defineToolLocal(options) {
  const userExecute = options.execute
  const userRender = options.output.render
  return {
    name: options.name,
    description: options.description,
    parameters: shorthandToJsonSchema(options.parameters),
    output: {
      schema: options.output.schema,
      render(args, value) { return userRender(args, value) },
    },
    async execute(args, exec) { return userExecute(args, exec) },
  }
}
function resolveBaseUrl(config) {
  if (typeof process !== 'undefined' && process.env !== undefined) {
    const env = process.env.DSH_WEB_URL
    if (typeof env === 'string' && env.trim() !== '') {
      const clean = env.trim().replace(/\/+$/, '')
      if (/^https?:\/\//.test(clean)) return clean
    }
  }
  if (config !== undefined && typeof config.baseUrl === 'string' && config.baseUrl.trim() !== '') {
    return config.baseUrl.trim().replace(/\/+$/, '')
  }
  return 'http://127.0.0.1:3080'
}

/** 协作动作的本地预校验：不联网即可拦下明显错参（也便于测试；错误信息要能指导 AI 下一步怎么引导用户）。 */
function preValidate(actionName, args) {
  const need = (cond, msg) => { if (!cond) throw new Error(msg) }
  switch (actionName) {
    case 'style-note':
      need(typeof args.text === 'string' && args.text.trim() !== '', 'style-note 需要 text（风格意见内容）')
      break
    case 'intervene':
      need(typeof args.text === 'string' && args.text.trim() !== '', 'intervene 需要 text（留言内容）')
      break
    case 'waive':
      need(typeof args.item === 'string' && args.item !== '', 'waive 需要 item（豁免项）')
      need(typeof args.userNote === 'string' && args.userNote.trim() !== '',
        '豁免必须由用户在界面「特殊要求」面板手输原因（userNote）才能放行；请引导用户操作后再调用')
      break
    case 'style-note-revoke':
    case 'waive-revoke':
    case 'intervene-done':
    case 'gold-opinion-revoke':
      need(typeof args.id === 'string' && args.id !== '', `${actionName} 需要 id`)
      break
    case 'gold-opinion':
      need(['dislike', 'drop', 'change'].includes(args.kind), 'gold-opinion 需要 kind（dislike|drop|change）')
      need(typeof args.wish === 'string' && args.wish.trim() !== '', 'gold-opinion 需要 wish（一句话说明）')
      break
    case 'gold-chapter-set':
      need(Number.isSafeInteger(Number(args.chapter)) && Number(args.chapter) >= 1, 'gold-chapter-set 需要 chapter（目标样例章章号，1 基）')
      break
    case 'outline-confirm':
      need(typeof args.approved === 'boolean', 'outline-confirm 需要 approved（true/false）')
      break
    case 'chapters-review-confirm':
      need(typeof args.approved === 'boolean', 'chapters-review-confirm 需要 approved（true=都过了，开始合并）')
      break
    case 'deep-modify':
      need(typeof args.segment === 'string' && args.segment !== '', 'deep-modify 需要 segment（历史段 key，如 outline/chapter-2）')
      need(typeof args.note === 'string' && args.note.trim() !== '', 'deep-modify 需要 note（这次要改什么）')
      break
    default:
      break
  }
}

async function fetchJson(url, options) {
  debugLog({ stage: 'fetch', url })
  let res
  try {
    res = await fetch(url, options ?? { headers: { Accept: 'application/json' } })
  } catch (error) {
    debugLog({ stage: 'fetch-error', url, message: String(error?.message ?? error) })
    throw error
  }
  let json = null
  try { json = await res.json() } catch { json = null }
  debugLog({ stage: 'fetch-done', url, status: res.status, json })
  if (!res.ok) throw new Error((json !== null && typeof json.error === 'string' ? json.error : '') || `HTTP ${res.status}`)
  return json
}

function sessionIdOf(exec) {
  const id = exec?.agent?.session?.id
  if (typeof id !== 'string' || id === '') throw new Error('拿不到当前会话，请确认在造书模式会话里使用')
  return id
}

function renderText(args, value) {
  return [{ type: 'text', text: JSON.stringify(value, null, 1) }]
}

/** 从 events 接口取项目详情（含交办/章节/探查摘要等）。 */
async function fetchProjectDetail(base, sessionId, projectId) {
  return fetchJson(
    `${base}/textbook/events?session=${encodeURIComponent(sessionId)}&project=${encodeURIComponent(projectId)}`)
}

function apply(ctx, config) {
  const base = resolveBaseUrl(config)

  ctx.tools.register(defineToolLocal({
    name: 'workbench_status',
    description: '查看造书工作台当前的真实状态：有没有书、进行到第几步、机器在等谁、当前交给你 AI 的任务（pendingStage）、是否在等你拍板、抽查意见、各章进度、书文件夹在哪。回答用户关于"现在进行到哪一步/面板上是什么"的问题前必查（尤其交工前查一遍有没有新抽查意见），不要凭记忆猜。',
    parameters: {},
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: renderText,
    },
    async execute(args, exec) {
      const sessionId = sessionIdOf(exec)
      debugLog({ stage: 'status-start', base, sessionId, agent: exec?.agent?.id ?? exec?.agent?.session?.id })
      const list = await fetchJson(`${base}/textbook/projects?session=${encodeURIComponent(sessionId)}`)
      const projects = list.projects ?? []
      debugLog({ stage: 'status-projects', count: projects.length })
      if (projects.length === 0) {
        const out = { hasBook: false, sessionId, message: '这个会话还没有书，工作台显示"＋ 新建书"向导。' }
        debugLog({ stage: 'status-return', out })
        return out
      }
      const meta = projects[0]
      const detail = await fetchProjectDetail(base, sessionId, meta.id)
      const events = detail.events ?? []
      const last = events.length > 0 ? events[events.length - 1] : null
      const gate = detail.gate ?? null
      return {
        hasBook: true,
        sessionId,
        project: {
          id: meta.id,
          name: meta.name,
          goal: meta.goal ?? '',
          phase: meta.phase ?? 1,
          status: meta.status ?? 'active',
          route: meta.route ?? 'blueprint',
          science: meta.science === true,
          folder: meta.folder ?? null,
          dir: detail.dir ?? null,
        },
        sources: (meta.sources ?? []).map((source) => ({
          file: source.file,
          role: source.role ?? '',
          converted: source.converted === true,
        })),
        // 机器在等谁：pendingStage != null → 等你 AI 动手；awaiting-explore/awaiting-gold/awaiting-chapters-review → 等用户；关卡 awaiting → 等用户拍板。
        pendingStage: detail.pendingStage ?? null,
        pendingGate: detail.pendingGate ?? null,
        stageLabel: detail.pendingStage ?? null,
        awaitingUser: ['awaiting-explore', 'awaiting-gold', 'awaiting-chapters-review'].includes(meta.status)
          || (gate !== null && gate.status === 'awaiting'),
        gate: gate === null ? null : {
          gate: gate.gate,
          version: gate.version,
          status: gate.status,
          title: gate.title ?? '',
          summary: gate.summary ?? '',
          detail: gate.detail ?? '',
          awaiting: gate.status === 'awaiting',
          rejected: gate.status === 'rejected',
          reasons: gate.decision?.reasons ?? [],
          note: gate.decision?.note ?? '',
        },
        pendingReviews: Array.isArray(detail.pendingReviews) ? detail.pendingReviews : [],
        chapterStatus: Array.isArray(detail.chapterStatus) ? detail.chapterStatus : [],
        exploreSummary: detail.exploreSummary ?? null,
        finalReport: detail.finalReport ?? null,
        lastEvent: last === null ? null : { type: last.type, text: last.data?.text ?? last.data?.label ?? last.data?.title ?? '' },
        paused: detail.meta?.pause != null ? { ...detail.meta.pause } : null,
        styleNotes: (detail.meta?.styleNotes ?? []).map((n) => ({ id: n.id, text: n.text, status: n.status, note: n.note ?? null })),
        waivers: detail.meta?.waivers ?? [],
        pendingInterventions: detail.pendingInterventions ?? [],
        outline: { awaiting: detail.meta?.status === 'awaiting-outline', redoNote: detail.meta?.outlineRedoNote ?? null },
        gold: {
          awaiting: detail.meta?.status === 'awaiting-gold',
          opinions: (detail.meta?.goldOpinions ?? []).filter((o) => o.status !== 'revoked'),
          sealed: detail.meta?.goldSealed ?? null,
        },
        // 全章过目闸门（F18）：全章写完后等用户过目；chaptersReviewed 旧书无字段按 false 兜底。
        chapters: {
          awaitingReview: detail.meta?.status === 'awaiting-chapters-review',
          reviewed: (detail.meta?.chaptersReviewed ?? false) === true,
        },
      }
    },
  }))

  ctx.tools.register(defineToolLocal({
    name: 'workbench_act',
    description: '与造书工作台交互。两类用法：① 流水线内务（机器派给你的活）：stage-brief 领任务说明、progress 上报进度、stage-submit 交工——这三类直接调用，不需要征求用户同意；② 代用户操作（改书名/改目标/建书/拍板/回退/重试/删除）——仅在用户明确同意后调用。action 取值：stage-brief、stage-submit、progress、create（建书，需 name/goal，可选 route/science）、rename（改书名，需 name）、set_goal（改学习目标，需 goal）、gate（关卡拍板，需 gate/version/approved，可选 note）、rollback（回退，需 snapshot 序号）、resume（重试/继续）、delete（删除这本书）。协作动作：style-note（记风格线）、intervene（留言）、pause（强制中断）、nudge（催办：把用户一句话以 notice 唤醒主 AI，不中断不 cancel）为内务可直接调用；waive（豁免，必须先引导用户在界面手输原因）、outline-confirm、chapters-review-confirm（全章过目确认：全章写完后替用户点「都过了」时用，需 approved=true）、gold-opinion/gold-revise/gold-chapter-set/gold 定稿类必须用户明确同意后调用。定点修改（改历史）：deep-modify（用户在界面上点定点修改时走这条，需 segment/note）、deep-undo（撤销最近一次深改）；对话里用户说改历史也必须引导走工作台的定点修改流程，不要自己改账本或产物。',
    parameters: {
      action: {
        type: 'string', required: true,
        description: 'stage-brief | stage-submit | progress | create | rename | set_goal | gate | rollback | resume | nudge | delete | chapters-review-confirm | deep-modify | deep-undo',
      },
      stage: { type: 'string', description: 'stage-brief/stage-submit 用的阶段名：explore|gate|outline|gold|chapters|merge|final' },
      segment: { type: 'string', description: 'deep-modify 时：要定点修改的历史段 key（explore|gate-1|gate-2|gate-3|outline|gold|chapter-N|merge|final）' },
      // —— stage-submit 各阶段的交付内容 ——
      title: { type: 'string', description: '交工 gate 时：一句话标题' },
      summary: { type: 'string', description: '交工 gate 时：给用户看的人话摘要（300 字内）' },
      detail: { type: 'string', description: '交工 gate 时：完整方案 Markdown（detail 内联全文，禁止写「见文件/proposal-*.md」指针，用户只在页面上看方案）' },
      chaptersJson: { type: 'string', description: '交工 outline 时：JSON 数组字符串 [{"title":"…","outline":"…","source":"资料N：…","targetWords":6000,"points":["知识点…"],"volumeReason":"体量依据"}]' },
      goldChapter: { type: 'number', description: '交工 outline 时：建议的样例章章号（1 基，默认 1）；outline-confirm 时：用户改选的样例章章号' },
      goldChapterReason: { type: 'string', description: '交工 outline 时：一句理由（哪章最能代表全书风格/结构最完整/材料最充分）' },
      chapter: { type: 'number', description: '交工 chapters 时：第几章；gold-chapter-set 时：目标样例章章号（1 基）' },
      preface: { type: 'string', description: '交工 merge 时：书的前言/使用说明（≤300 字）' },
      report: { type: 'string', description: '交工 final 时：你的最后检查报告（人话）' },
      // —— progress ——
      label: { type: 'string', description: 'progress 时：正在做什么（如「写第3章」）' },
      detail: { type: 'string', description: 'progress 时：更细的一句话说明' },
      // —— 代用户操作 ——
      name: { type: 'string', description: 'create/rename 时的书名' },
      goal: { type: 'string', description: 'create/set_goal 时的学习目标' },
      route: { type: 'string', description: 'create 时：blueprint=给 AI 老师上课用（推荐），human=给人直接读的教材' },
      science: { type: 'boolean', description: 'create 时：理科内容（公式较多）为 true' },
      gate: { type: 'string', description: 'gate 时的关卡号' },
      version: { type: 'number', description: 'gate 时的版本号' },
      approved: { type: 'boolean', description: 'gate 时：true=通过，false=驳回；chapters-review-confirm 时：true=全章都过了，开始合并' },
      note: { type: 'string', description: 'gate 驳回时的说明，或任何想留的备注' },
      snapshot: { type: 'number', description: 'rollback 时回退到的快照序号' },
      // -- 协作动作 --
      text: { type: 'string', description: 'style-note/intervene 时：意见或留言内容；nudge 时：催办语（一句话，可省）' },
      source: { type: 'string', description: 'style-note 时：wizard|ui|chat（对话里识别的用 chat）' },
      id: { type: 'string', description: 'style-note-revoke/intervene-done/gold-opinion-revoke/waive-revoke 时：条目 id' },
      item: { type: 'string', description: 'waive 时：豁免项枚举（gate-skip 跳过「请你拍板」的设计关卡 / outline-skip 跳过「章节安排」确认 / gold-skip 跳过「最佳范例章」确认 / audit-skip 不要求每章都有独立审查 / scaffold-keep 保留 AI 的笔记不删 / route-override 改变已定的使用路线 / progress-skip 跳过「进度账本」检查 / other 其他）' },
      userNote: { type: 'string', description: 'waive 时：用户在界面手输的原因（放行必要条件）' },
      reason: { type: 'string', description: 'pause 时：中断原因（给账本与恢复上下文）' },
      target: { type: 'string', description: 'intervene 时：留言指向（如「第4章」）' },
      kind: { type: 'string', description: 'gold-opinion 时：dislike|drop|change' },
      wish: { type: 'string', description: 'gold-opinion 时：一句话说明' },
      para: { type: 'number', description: 'gold-opinion 时：段落序号（可省）' },
      hint: { type: 'string', description: 'gold-opinion 时：段落描述（如「开头那段」）' },
      note: { type: 'string', description: 'outline-confirm 驳回/gold-revise 时：给 AI 的改进方向；deep-modify 时：这次要改什么（一句话，必填）' },
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: renderText,
    },
    async execute(args, exec) {
      const sessionId = sessionIdOf(exec)
      const action = String(args.action ?? '')
      preValidate(action, args)
      const projects = await fetchJson(`${base}/textbook/projects?session=${encodeURIComponent(sessionId)}`)
      const meta = (projects.projects ?? [])[0]
      if (action !== 'create' && meta === undefined) {
        throw new Error('这个会话还没有书：要么先让用户在工作台建书，要么用 create 直接建')
      }
      const project = action === 'create' ? undefined : meta.id
      let body
      switch (action) {
        // ── 流水线内务（不需要征求用户同意） ─────────────────────────────
        case 'stage-brief':
          body = {
            action: 'stage-brief',
            ...(typeof args.stage === 'string' && args.stage !== '' ? { stage: args.stage } : {}),
          }
          break
        case 'progress':
          body = {
            action: 'progress',
            label: typeof args.label === 'string' ? args.label : '',
            detail: typeof args.detail === 'string' ? args.detail : '',
          }
          break
        case 'stage-submit': {
          const stage = String(args.stage ?? '')
          if (stage === '') throw new Error('stage-submit 需要 stage（explore|gate|outline|gold|chapters|merge|final）')
          body = { action: 'stage-submit', stage }
          if (stage === 'gate') {
            if (typeof args.title !== 'string' || args.title.trim() === '' || typeof args.summary !== 'string'
              || args.summary.trim() === '' || typeof args.detail !== 'string' || args.detail.trim() === '') {
              throw new Error('交工 gate 需要 title/summary/detail 三段')
            }
            body.title = args.title.trim()
            body.summary = args.summary.trim()
            body.detail = args.detail.trim()
          } else if (stage === 'outline') {
            if (typeof args.chaptersJson !== 'string' || args.chaptersJson.trim() === '') {
              throw new Error('交工 outline 需要 chaptersJson（JSON 数组字符串）')
            }
            body.chaptersJson = args.chaptersJson.trim()
            // 服务端收 JSON 字符串；样例章建议与理由一并带上
            if (Number.isSafeInteger(Number(args.goldChapter))) body.goldChapter = Number(args.goldChapter)
            if (typeof args.goldChapterReason === 'string' && args.goldChapterReason.trim() !== '') body.goldChapterReason = args.goldChapterReason.trim()
          } else if (stage === 'chapters') {
            if (!Number.isSafeInteger(Number(args.chapter))) throw new Error('交工 chapters 需要 chapter（第几章）')
            body.chapter = Number(args.chapter)
          } else if (stage === 'merge') {
            if (typeof args.preface !== 'string' || args.preface.trim() === '') throw new Error('交工 merge 需要 preface（前言文本）')
            body.preface = args.preface.trim()
          } else if (stage === 'final') {
            if (typeof args.report !== 'string' || args.report.trim() === '') throw new Error('交工 final 需要 report（自查报告）')
            body.report = args.report.trim()
          }
          break
        }
        // ── 代用户操作（必须先得到用户明确同意） ────────────────────────
        case 'create':
          if (typeof args.name !== 'string' || args.name.trim() === '') throw new Error('建书需要书名 name')
          if (typeof args.goal !== 'string' || args.goal.trim() === '') throw new Error('建书需要学习目标 goal')
          body = {
            action: 'book-create',
            name: args.name.trim(),
            goal: args.goal.trim(),
            route: args.route === 'human' ? 'human' : 'blueprint',
            science: args.science === true,
          }
          break
        case 'rename':
          if (typeof args.name !== 'string' || args.name.trim() === '') throw new Error('改名需要新书名 name')
          body = { action: 'book-rename', name: args.name.trim() }
          break
        case 'set_goal':
          if (typeof args.goal !== 'string' || args.goal.trim() === '') throw new Error('改目标需要 goal')
          body = { action: 'book-set-goal', goal: args.goal.trim() }
          break
        case 'gate':
          if (args.gate === undefined || args.gate === null || args.gate === '') throw new Error('拍板需要 gate 关卡号')
          if (typeof args.version !== 'number') throw new Error('拍板需要 version 版本号')
          if (typeof args.approved !== 'boolean') throw new Error('拍板需要 approved（true=通过/false=驳回）')
          body = {
            action: 'gate-decide',
            gate: String(args.gate),
            version: args.version,
            approved: args.approved,
            note: typeof args.note === 'string' ? args.note : '',
          }
          break
        case 'rollback':
          if (!Number.isSafeInteger(Number(args.snapshot))) throw new Error('回退需要 snapshot 序号')
          body = { action: 'rollback', snapshot: Number(args.snapshot) }
          break
        // ── 协作动作 ──────────────────────────────────────────────────────
        case 'style-note':
          if (typeof args.text !== 'string' || args.text.trim() === '') throw new Error('style-note 需要 text')
          body = { action: 'style-note', text: args.text.trim(), source: typeof args.source === 'string' ? args.source : 'chat' }
          break
        case 'style-note-revoke':
          if (typeof args.id !== 'string') throw new Error('需要 id')
          body = { action: 'style-note-revoke', id: args.id }
          break
        case 'waive':
          if (typeof args.item !== 'string' || args.item === '') throw new Error('waive 需要 item')
          if (typeof args.userNote !== 'string' || args.userNote.trim() === '') {
            throw new Error('豁免必须由用户在界面「特殊要求」面板手输原因（userNote）才能放行；请引导用户操作后再调用')
          }
          body = { action: 'waive', item: args.item, userNote: args.userNote.trim(), source: 'chat' }
          break
        case 'waive-revoke':
          if (typeof args.id !== 'string') throw new Error('需要 id')
          body = { action: 'waive-revoke', id: args.id }
          break
        case 'pause':
          body = { action: 'pause', reason: typeof args.reason === 'string' ? args.reason : '主 AI 侧发起的中断' }
          break
        case 'intervene':
          if (typeof args.text !== 'string' || args.text.trim() === '') throw new Error('intervene 需要 text')
          body = { action: 'intervene', text: args.text.trim(), ...(typeof args.target === 'string' ? { target: args.target } : {}) }
          break
        case 'intervene-done':
          if (typeof args.id !== 'string') throw new Error('需要 id')
          body = { action: 'intervene-done', id: args.id }
          break
        case 'outline-confirm':
          if (typeof args.approved !== 'boolean') throw new Error('outline-confirm 需要 approved')
          body = {
            action: 'outline-confirm', approved: args.approved,
            ...(typeof args.note === 'string' ? { note: args.note } : {}),
            ...(Number.isSafeInteger(Number(args.goldChapter)) ? { goldChapter: Number(args.goldChapter) } : {}),
          }
          break
        case 'chapters-review-confirm':
          if (typeof args.approved !== 'boolean') throw new Error('chapters-review-confirm 需要 approved（true=都过了，开始合并）')
          body = { action: 'chapters-review-confirm', approved: args.approved }
          break
        case 'deep-modify':
          // 定点修改（改历史）：用户在界面上点定点修改时走这条；对话里说改历史也必须
          // 引导用户去工作台点定点修改，不要自己动账本/产物。需用户明确同意后才调用。
          if (typeof args.segment !== 'string' || args.segment === '') throw new Error('deep-modify 需要 segment（历史段 key）')
          if (typeof args.note !== 'string' || args.note.trim() === '') throw new Error('deep-modify 需要 note（这次要改什么）')
          body = { action: 'deep-modify', segment: args.segment, note: args.note.trim() }
          break
        case 'deep-undo':
          body = { action: 'deep-undo' }
          break
        case 'gold-opinion':
          if (!['dislike', 'drop', 'change'].includes(args.kind)) throw new Error('gold-opinion 需要 kind（dislike|drop|change）')
          if (typeof args.wish !== 'string' || args.wish.trim() === '') throw new Error('gold-opinion 需要 wish')
          body = {
            action: 'gold-opinion', kind: args.kind, wish: args.wish.trim(),
            ...(Number.isSafeInteger(args.para) ? { para: args.para } : {}),
            ...(typeof args.hint === 'string' ? { hint: args.hint } : {}),
          }
          break
        case 'gold-opinion-revoke':
          if (typeof args.id !== 'string') throw new Error('需要 id')
          body = { action: 'gold-opinion-revoke', id: args.id }
          break
        case 'gold-revise':
          body = { action: 'gold-revise', ...(typeof args.note === 'string' ? { note: args.note } : {}) }
          break
        case 'gold-chapter-set':
          if (!Number.isSafeInteger(Number(args.chapter)) || Number(args.chapter) < 1) throw new Error('gold-chapter-set 需要 chapter（目标样例章章号，1 基）')
          body = { action: 'gold-chapter-set', chapter: Number(args.chapter), ...(typeof args.reason === 'string' ? { reason: args.reason } : {}) }
          break
        case 'resume':
          body = { action: 'resume' }
          break
        case 'nudge':
          // 催办：把用户的一句话以 notice 唤醒主 AI（不中断、不 cancel）；留空则用默认催办语。
          body = { action: 'nudge', ...(typeof args.text === 'string' && args.text.trim() !== '' ? { text: args.text.trim().slice(0, 200) } : {}) }
          break
        case 'delete':
          body = { action: 'book-delete', confirm: true }
          break
        default:
          throw new Error(`未知操作: ${action}`)
      }
      const json = await fetchJson(`${base}/textbook/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ session: sessionId, ...(project !== undefined ? { project } : {}), ...body }),
      })
      return json
    },
  }))
}

export { apply }
