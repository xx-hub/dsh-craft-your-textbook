/**
 * 造书工作台 · 前端插件（浏览器侧，入口）
 *
 * 定稿方案 B 的界面：顶部书名 + 六格进度条（⚡轮到你高亮）→ 单张焦点卡
 * （现在该做什么）→ "▸ 之前的过程"可展开时间线。
 *
 * 焦点卡按状态切换：
 *  - 没有项目/新建 → 向导卡（书名/目标/路线/理科/合规声明）
 *  - Phase 1 → 上传区（PDF + 角色标签）＋ 开始转换
 *  - 关卡等待 → 关卡卡（通过/驳回+分流+预置理由+版本对比）
 *  - 机器运行 → 状态卡（"AI 正在……"实时更新）
 *  - 出错/缺配置 → 红色提示 + 重试
 *  - 交付 → 交付卡（质量门打勾 + 预览 + 下载 + 怎么用）
 */

import { createElement, useEffect, useMemo, useRef, useState } from 'react'

export const inject = ['slots']

const PHASES = [
  { n: 1, label: '材料准备' },
  { n: 2, label: '源探查' },
  { n: 3, label: '设计' },
  { n: 4, label: '范例章' },
  { n: 5, label: '铺章' },
  { n: 6, label: '交付' },
]

const ROLE_OPTIONS = ['学生用书', '教师用书', '考纲', '讲义', '真题']

// 按文件名猜角色（规则兜底，与后端一致；AI 识别失败时用）。
function guessRoleFromName(name) {
  const n = String(name ?? '').toLowerCase()
  if (/(教师|教参|teacher|教学参考|教师用书)/.test(n)) return '教师用书'
  if (/(考纲|大纲|课标|syllabus|课程标准)/.test(n)) return '考纲'
  if (/(真题|试卷|试题|卷子|exam|paper|test)/.test(n)) return '真题'
  if (/(讲义|教案|课件|笔记|handout|notes)/.test(n)) return '讲义'
  return '学生用书'
}

/** 样例章章号（1 基；旧书/缺省=1）——前端各取稿点共用（谈判桌/事件卡片/分段查看）。 */
function goldChapterNo(meta) {
  return Number.isSafeInteger(meta?.goldChapter) && meta.goldChapter >= 1 ? meta.goldChapter : 1
}

const S = {
  container: { padding: '16px 20px', fontFamily: 'inherit', color: 'var(--dsw-text, #1f2328)' },
  title: { fontSize: '16px', fontWeight: 600, margin: '0 0 4px' },
  hint: { fontSize: '12px', opacity: 0.65, margin: '0 0 12px' },
  projectRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' },
  projectBtn: (active) => ({
    border: active ? '1px solid var(--dsw-accent, #4f6ef7)' : '1px solid var(--dsw-border, #d0d7de)',
    background: active ? 'var(--dsw-accent-soft, #eef2ff)' : 'transparent',
    borderRadius: '8px', padding: '6px 10px', fontSize: '13px', cursor: 'pointer',
  }),
  card: {
    border: '1px solid var(--dsw-border, #d0d7de)', borderRadius: '10px', padding: '12px 14px',
    marginBottom: '10px', background: 'var(--dsw-surface, #ffffff)', fontSize: '13px',
  },
  focus: {
    border: '1.5px solid var(--dsw-accent, #4f6ef7)', borderRadius: '12px', padding: '14px 16px',
    marginBottom: '12px', background: 'var(--dsw-accent-soft, #eef2ff)', fontSize: '13px',
  },
  error: { color: 'var(--dsw-danger, #cf222e)', fontSize: '13px', margin: '8px 0' },
  bigBtn: (primary) => ({
    border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '14px', fontWeight: 600,
    cursor: 'pointer', color: '#ffffff',
    background: primary ? 'var(--dsw-accent, #4f6ef7)' : 'var(--dsw-danger, #cf222e)',
  }),
  smallLink: {
    border: 'none', background: 'transparent', color: 'var(--dsw-accent, #4f6ef7)',
    cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', padding: '0',
  },
  input: {
    width: '100%', borderRadius: '8px', border: '1px solid var(--dsw-border, #d0d7de)',
    padding: '6px 8px', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit',
    margin: '4px 0 8px',
  },
  textarea: {
    width: '100%', minHeight: '56px', borderRadius: '8px', border: '1px solid var(--dsw-border, #d0d7de)',
    padding: '6px 8px', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit', margin: '4px 0 8px',
  },
  label: { fontSize: '12px', fontWeight: 600, display: 'block', marginTop: '6px' },
  checkItem: { display: 'block', margin: '4px 0', fontSize: '13px' },
  bar: { display: 'flex', gap: '4px', margin: '0 0 12px' },
  seg: (state) => ({
    flex: 1, borderRadius: '6px', padding: '6px 2px', textAlign: 'center', fontSize: '11px',
    color: state === 'done' ? 'var(--dsw-text, #1f2328)' : state === 'current' ? '#ffffff' : 'var(--dsw-text, #1f2328)',
    background: state === 'done' ? 'var(--dsw-success-soft, #dafbe1)'
      : state === 'current' ? 'var(--dsw-accent, #4f6ef7)'
        : 'var(--dsw-border-soft, #eff1f4)',
    border: state === 'current' ? 'none' : '1px solid var(--dsw-border, #d0d7de)',
  }),
}

function formatTime(time) {
  return new Date(time).toLocaleTimeString('zh-CN', { hour12: false })
}

function cardText(event) {
  const data = event.data ?? {}
  switch (event.type) {
    case 'textbook/phase-start': return `阶段 ${data.phase} 开始：${data.label ?? ''}`
    case 'textbook/phase-end': return `阶段 ${data.phase} 完成：${data.label ?? ''}`
    case 'textbook/agent-start': return `AI 开始：${data.label ?? ''}`
    case 'textbook/agent-end': return `AI 完成：${data.label ?? ''}`
    case 'textbook/gate-proposal': return `AI 提案（第 ${data.gate ?? '?'} 关 · v${data.version ?? '?'}）：${data.title ?? ''}`
    case 'textbook/gate-decision':
      return data.approved === true
        ? `第 ${data.gate ?? '?'} 关通过（v${data.version ?? '?'}）`
        : `第 ${data.gate ?? '?'} 关驳回（v${data.version ?? '?'}）${data.reasons?.length > 0 ? `：${data.reasons.join('、')}` : ''}`
    case 'textbook/mineru-progress':
      return `转换 ${data.file ?? ''}：${data.stage ?? ''}`
    case 'textbook/rollback': return `↩️ 已回退到快照 ${data.snapshot ?? '?'}`
    case 'textbook/source-added': return `已上传材料：${data.file ?? ''}（${data.role ?? ''}）`
    case 'textbook/hint': return `💡 ${data.text ?? ''}`
    case 'textbook/error': return `⚠️ 出错（${data.task ?? ''}）：${data.message ?? ''}`
    case 'textbook/quality': return `质量门：${(data.checks ?? []).filter((c) => c.ok === true).length}/${(data.checks ?? []).length} 项通过`
    case 'textbook/delivery': return '🎉 交付完成'
    case 'textbook/stage-start': return `🎯 交给 AI 动手：${data.label ?? data.stage ?? ''}`
    case 'textbook/progress': return `⏳ ${data.label ?? ''}${data.detail ? `：${data.detail}` : ''}`
    case 'textbook/review': return `👀 抽查意见（${data.title ?? `第${data.chapter ?? '?'}章`}）：${data.comment ?? ''}`
    case 'textbook/ai-report': return `🛡️ AI 自查报告：${data.report ?? ''}`
    default: return event.type
  }
}

function cardIcon(event) {
  switch (event.type) {
    case 'textbook/phase-start': return '▶️'
    case 'textbook/phase-end': return '🏁'
    case 'textbook/gate-proposal': return '📋'
    case 'textbook/gate-decision': return event.data?.approved === true ? '✅' : '↩️'
    case 'textbook/agent-start': return '🤖'
    case 'textbook/agent-end': return '🤖'
    case 'textbook/mineru-progress': return '📄'
    case 'textbook/rollback': return '⏪'
    case 'textbook/source-added': return '📎'
    case 'textbook/hint': return '💡'
    case 'textbook/error': return '⚠️'
    case 'textbook/quality': return '🛡️'
    case 'textbook/delivery': return '🎉'
    case 'textbook/stage-start': return '🤖'
    case 'textbook/progress': return '⏳'
    case 'textbook/review': return '👀'
    case 'textbook/ai-report': return '🛡️'
    default: return '•'
  }
}

// ── 进度条 ──────────────────────────────────────────────────────────────────

export function PhaseBar(props) {
  const { phase, gate, status, onSelect, productOf } = props
  const doneUpTo = phase - 1
  const gateAwaiting = gate !== null && gate.status === 'awaiting'
  const humanTurn = props.humanTurn === true || (gateAwaiting && phase === 3)
  return createElement('div', { style: S.bar },
    PHASES.map((item) => {
      let state = 'pending'
      if (item.n < phase || status === 'delivered' || (status === 'awaiting-explore' && item.n <= 2) || (status === 'awaiting-outline' && item.n <= 3) || (status === 'awaiting-gold' && item.n <= 4) || (status === 'awaiting-chapters-review' && item.n <= 5)) state = 'done'
      else if (item.n === phase) state = 'current'
      let label = item.label
      if (item.n === phase && humanTurn) label = '⚡轮到你'
      const product = typeof productOf === 'function' ? productOf(item.n) : null
      if (product !== null && state === 'done') label = `${label} 📄`
      const clickable = product !== null
      return createElement('div', {
        key: item.n,
        style: {
          ...S.seg(state),
          ...(clickable ? { cursor: 'pointer' } : {}),
        },
        title: clickable ? `查看「${product.label}」` : undefined,
        onClick: clickable && typeof onSelect === 'function' ? () => onSelect(item.n) : undefined,
      }, label)
    }),
  )
}

// ── 向导卡 ──────────────────────────────────────────────────────────────────

export function WizardCard(props) {
  const { onCreate, onCreateDemo, busy, suggestions, suggestLoading, onCancel, onSuggest } = props
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [route, setRoute] = useState('blueprint')
  const [science, setScience] = useState(false)
  const [agree, setAgree] = useState(false)
  const [hint, setHint] = useState('')
  const [error, setError] = useState(null)

  const pickSuggestion = (suggestion) => {
    setName(suggestion.name ?? '')
    setGoal(suggestion.goal ?? '')
    setScience(suggestion.science === true)
    setError(null)
  }

  const requestSuggest = () => {
    setError(null)
    void onSuggest(hint.trim()).catch((err) => setError(String(err instanceof Error ? err.message : err)))
  }

  const submit = () => {
    if (name.trim() === '') { setError('请填写书名'); return }
    if (goal.trim() === '') { setError('请填一下：这本书学完，学习者要能做到什么？'); return }
    if (!agree) { setError('请先勾选材料声明'); return }
    onCreate({ name: name.trim(), goal: goal.trim(), route, science })
  }

  return createElement('div', { style: S.focus },
    createElement('div', null,
      createElement('strong', { style: { fontSize: '14px' } }, '📚 第一步 · 材料准备：先给书"建档"（10 秒），然后就能上传教材'),
      createElement('button', { style: { ...S.smallLink, float: 'right' }, onClick: onCancel }, '取消'),
    ),
    createElement('div', { style: { marginTop: '8px' } },
      createElement('label', { style: { ...S.label, marginTop: '0' } }, '学习者的背景（选填，让建议更贴切）'),
      createElement('div', { style: { display: 'flex', gap: '6px' } },
        createElement('input', {
          style: { ...S.input, margin: '4px 0 6px', flex: 1 },
          placeholder: '比如：三年级，想补古诗背诵和作文',
          value: hint,
          onChange: (e) => setHint(e.target.value),
        }),
        createElement('button', {
          style: { ...S.bigBtn(true), padding: '6px 14px', marginTop: '4px' },
          onClick: requestSuggest,
          disabled: suggestLoading,
        }, '✨ AI 建议'),
      ),
    ),
    suggestions.length > 0
      ? createElement('div', { style: { marginTop: '4px' } },
          createElement('p', { style: { margin: '0 0 4px', fontSize: '12px', opacity: 0.7 } },
            '点一个 AI 建议自动填好（可再改）',
            createElement('button', { style: { ...S.smallLink, marginLeft: '10px' }, onClick: requestSuggest, disabled: suggestLoading }, '换一批'),
          ),
          suggestions.map((suggestion, index) =>
            createElement('button', {
              key: index,
              style: { ...S.projectBtn(false), margin: '0 6px 6px 0', textAlign: 'left' },
              onClick: () => pickSuggestion(suggestion),
            }, `${suggestion.name ?? ''}：${(suggestion.goal ?? '').slice(0, 30)}${(suggestion.goal ?? '').length > 30 ? '…' : ''}`),
          ),
        )
      : suggestLoading
        ? createElement('p', { style: { margin: '8px 0', fontSize: '12px', opacity: 0.7 } }, '💡 AI 正在想建议……')
        : null,
    createElement('label', { style: S.label }, '书名'),
    createElement('input', { style: S.input, placeholder: '比如：初中数学·有理数', value: name, onChange: (e) => setName(e.target.value) }),
    createElement('label', { style: S.label }, '这本书学完，要能做到什么？'),
    createElement('textarea', { style: S.textarea, placeholder: '比如：能独立做对教材配套的基础题，并说出每个概念是什么、为什么、怎么用', value: goal, onChange: (e) => setGoal(e.target.value) }),
    createElement('label', { style: S.label }, '给谁用？'),
    createElement('label', { style: S.checkItem },
      createElement('input', { type: 'radio', name: 'route', checked: route === 'blueprint', onChange: () => setRoute('blueprint') }),
      ' 给 AI 老师上课用（推荐，教学精度最高）'),
    createElement('label', { style: S.checkItem },
      createElement('input', { type: 'radio', name: 'route', checked: route === 'human', onChange: () => setRoute('human') }),
      ' 给人直接读的教材（AI 也能拿它教）'),
    createElement('label', { style: S.checkItem },
      createElement('input', { type: 'checkbox', checked: science, onChange: (e) => setScience(e.target.checked) }),
      ' 理科内容（公式较多，转换时开启公式识别）'),
    createElement('label', { style: S.checkItem },
      createElement('input', { type: 'checkbox', checked: agree, onChange: (e) => setAgree(e.target.checked) }),
      ' 我确认：只上传我有权使用的材料；造出来的是教学参考，AI 可能讲错，使用前我会请老师/家长复核'),
    error !== null ? createElement('p', { style: S.error }, error) : null,
    createElement('div', { style: { marginTop: '8px' } },
      createElement('button', { style: S.bigBtn(true), onClick: submit, disabled: busy }, '创建这本书'),
    ),
    createElement('p', { style: { margin: '10px 0 0', fontSize: '12px', opacity: 0.75 } },
      '还不确定这套流程适不适合你？',
      createElement('button', { style: { ...S.smallLink, marginLeft: '6px' }, disabled: busy,
        onClick: () => onCreateDemo() }, '先建一本演示书试试（不花模型额度，2 分钟走完全程）'),
    ),
    createElement('div', { style: { marginTop: '12px', padding: '8px 10px', fontSize: '12px', lineHeight: 1.6, opacity: 0.75, border: '1px solid var(--dsw-border, #d0d7de)', borderRadius: '8px', background: 'var(--dsw-surface, #fff)' } },
      createElement('p', { style: { margin: '0 0 4px' } },
        '本项目是',
        createElement('a', { href: 'https://www.socratopia.app/r/SCR-FEJXMQ', target: '_blank', rel: 'noopener noreferrer', style: { color: 'var(--dsw-accent, #4f6ef7)', textDecoration: 'underline' } }, '【破卷】'),
        '的衍生项目，💡 如果本项目对你有帮助，欢迎填写邀请码：SCR-FEJXMQ，可免费领取 100 万 tokens，全场官方造书免费学习。'),
      createElement('p', { style: { margin: '0' } },
        '把造好的书交给',
        createElement('a', { href: 'https://www.socratopia.app/r/SCR-FEJXMQ', target: '_blank', rel: 'noopener noreferrer', style: { color: 'var(--dsw-accent, #4f6ef7)', textDecoration: 'underline' } }, '【破卷】'),
        '，即可享受3A游戏的沉浸感以及三倍以上的学习效率。'),
    ),
  )
}

// ── 上传区（Phase 1） ───────────────────────────────────────────────────────

export function UploadArea(props) {
  const { sources, converting, onUpload, onConvert, onIdentify, busy } = props
  const [pending, setPending] = useState([]) // [{ name, file, role }]
  const [identifying, setIdentifying] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const dirtyRef = useRef({})

  // 选择文件（可多选）：先按文件名秒猜角色，再让 AI 精识别。
  const pick = (e) => {
    setError(null)
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    const seen = new Set()
    const next = pending.filter((item) => !files.some((f) => f.name === item.name))
    files.forEach((file) => {
      if (seen.has(file.name)) return
      seen.add(file.name)
      next.push({ name: file.name, file, role: guessRoleFromName(file.name) })
    })
    setPending(next)
    if (next.length > 0) void identify(next)
  }

  const setRole = (name, role) => {
    dirtyRef.current[name] = true // 用户手动改过：AI 识别结果不再覆盖
    setPending((prev) => prev.map((item) => (item.name === name ? { ...item, role } : item)))
  }

  // AI 识别角色：一次请求识别所有文件；失败就保留规则猜测。
  const identify = async (list) => {
    setIdentifying(true)
    try {
      const roles = await onIdentify(list.map((item) => item.name))
      const byName = new Map(roles.map((r) => [r.file, r.role]))
      setPending((prev) => prev.map((item) =>
        byName.has(item.name) && !dirtyRef.current[item.name] ? { ...item, role: byName.get(item.name) } : item))
    } catch {
      // 保持规则猜测
    } finally {
      setIdentifying(false)
    }
  }

  const uploadAll = async () => {
    if (pending.length === 0) { setError('请先选择 PDF 文件'); return }
    setUploading(true)
    setError(null)
    try {
      for (const item of pending) {
        await onUpload(item.file, item.role)
      }
      setPending([])
      dirtyRef.current = {}
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err))
    } finally {
      setUploading(false)
    }
  }

  return createElement('div', { style: S.focus },
    createElement('strong', { style: { fontSize: '14px' } }, '① 上传教材 PDF（可一次选多本）'),
    createElement('p', { style: { margin: '4px 0 8px', fontSize: '12px', opacity: 0.7 } }, '书文件夹建在当前工作区目录里（文件夹名＝书名，见上方 📁 路径），上传的 PDF 都保存在里面。每本是什么角色由 AI 自动识别，你只需要确认。'),
    createElement('label', { style: S.label }, '选择 PDF（可多选）'),
    createElement('input', { type: 'file', accept: '.pdf', multiple: true, style: S.input, onChange: pick }),
    pending.length > 0
      ? createElement('div', { style: { marginTop: '8px' } },
          createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' } },
            createElement('span', { style: { fontSize: '12px', fontWeight: 600 } }, `待上传 ${pending.length} 本：`),
            identifying
              ? createElement('span', { style: { fontSize: '12px', opacity: 0.7 } }, '✨ AI 识别角色中…')
              : createElement('span', { style: { fontSize: '12px', opacity: 0.7 } }, '✅ 已自动识别，可下拉修改'),
          ),
          pending.map((item) =>
            createElement('div', { key: item.name, style: { display: 'flex', gap: '8px', alignItems: 'center', margin: '4px 0' } },
              createElement('span', { style: { flex: 1, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, item.name),
              createElement('select', {
                style: { ...S.input, width: '108px', margin: '0', padding: '4px 6px' },
                value: item.role,
                onChange: (e) => setRole(item.name, e.target.value),
              },
                ROLE_OPTIONS.map((role) => createElement('option', { key: role, value: role }, role))),
            ),
          ),
        )
      : null,
    error !== null ? createElement('p', { style: S.error }, error) : null,
    createElement('div', { style: { marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' } },
      createElement('button', { style: { ...S.bigBtn(true), padding: '8px 14px' }, onClick: uploadAll, disabled: busy || uploading || pending.length === 0 },
        pending.length > 0 ? `上传这 ${pending.length} 本` : '上传'),
    ),
    sources.length > 0
      ? createElement('div', { style: { marginTop: '8px', fontSize: '12px', opacity: 0.85 } },
          createElement('div', { style: { margin: '0 0 4px' } }, `已上传 ${sources.length} 本：`),
          sources.map((source) =>
            createElement('div', { key: source.file, style: { wordBreak: 'break-all', margin: '2px 0' } },
              `${source.converted === true ? '✅' : '⏳'} ${source.file}`)),
        )
      : null,
    sources.length > 0
      ? createElement('div', { style: { marginTop: '10px' } },
          createElement('button', { style: S.bigBtn(true), onClick: onConvert, disabled: busy || converting }, '② 开始转换（机器自动跑）'),
          converting ? createElement('span', { style: { marginLeft: '8px', fontSize: '12px' } }, '转换中……') : null,
        )
      : null,
  )
}

// ── 状态卡 / 错误卡 ─────────────────────────────────────────────────────────

export function StatusCard(props) {
  const { meta, lastEvent, events, needsConfig, onResume, busy, pendingStageLabel, progressDetail, aiActive,
    onDeleteStart, onDeleteConfirm, deletingId } = props
  const [, tick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(timer)
  }, [])
  if (meta.status === 'error') {
    // F26（2026-08-20 走查）：优先显示后端落账的人话错误（meta.lastErrorHuman，页数超限/Token 失效
    // 已归一成人话），否则回退事件消息；下方给「拆 PDF / 换一本 / 删掉重来」引导，错误含 Token
    // 关键词时补 Token 重设提示（入口见 F20 的 MinerU Token 常驻卡）。
    const rawError = lastEvent?.data?.message ?? '未知错误'
    const humanError = typeof meta?.lastErrorHuman === 'string' && meta.lastErrorHuman !== ''
      ? meta.lastErrorHuman
      : rawError
    const isTokenIssue = humanError.includes('Token') || humanError.includes('token')
    return createElement('div', { style: { ...S.focus, borderColor: 'var(--dsw-danger, #cf222e)' } },
      createElement('strong', { style: { color: 'var(--dsw-danger, #cf222e)' } }, '⚠️ 这一步出错了'),
      createElement('p', { style: { margin: '6px 0' } }, humanError),
      createElement('p', { style: { margin: '6px 0 0', fontSize: '13px', opacity: 0.9 } },
        '你可以：把 PDF 拆成几份（每份 <200 页）后分别上传，或换一本更薄的书，或删掉这本书重新开始。'),
      isTokenIssue
        ? createElement('p', { style: { margin: '4px 0 0', fontSize: '13px', opacity: 0.9 } },
            '💡 MinerU Token 可能失效，可到工作台「MinerU Token」处点「重新设置」换新 Token。')
        : null,
      createElement('button', { style: S.bigBtn(true), onClick: onResume, disabled: busy }, '🔁 重试'),
      // F28（2026-08-20 走查）：上传错了给「删书重来」入口——两步确认（第一态→确认态），
      // 确认按钮只受 busy 置灰；删除后回向导可马上建一本新书。仅在父级传入删除回调时显示。
      typeof onDeleteStart === 'function'
        ? createElement('div', { style: { marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--dsw-border, #d0d7de)' } },
            createElement('p', { style: { margin: '0 0 6px', fontSize: '13px', opacity: 0.9 } },
              '上传错了？可以删掉这本书重新建一本（旧书进回收站），回到向导马上就能开始新书。'),
            deletingId === true
              ? createElement('button', {
                  style: { ...S.smallLink, color: 'var(--dsw-danger, #cf222e)' },
                  onClick: onDeleteConfirm,
                  disabled: busy,
                }, '确认删除这本书（进回收站）')
              : createElement('button', {
                  style: { ...S.smallLink, color: 'var(--dsw-danger, #cf222e)' },
                  onClick: onDeleteStart,
                }, '🗑 删除这本书重新建'),
          )
        : null,
    )
  }
  if (meta.status === 'needs-config') {
    return createElement('div', { style: { ...S.focus, borderColor: 'var(--dsw-danger, #cf222e)' } },
      createElement('strong', { style: { color: 'var(--dsw-danger, #cf222e)' } }, '🔑 需要先配置'),
      createElement('p', { style: { margin: '6px 0' } }, needsConfig),
      createElement('button', { style: S.bigBtn(true), onClick: onResume, disabled: busy }, '我配好了，继续'),
    )
  }
  // 机器在等主 AI（交办任务）→ 优先显示任务名；否则回退到最近的机器活动。
  let label = ''
  let extra = ''
  if (typeof pendingStageLabel === 'string' && pendingStageLabel !== '') {
    label = `AI 干活中 · ${pendingStageLabel}`
    extra = typeof progressDetail === 'string' ? progressDetail : ''
  } else if (lastEvent?.type === 'textbook/agent-start' || lastEvent?.type === 'textbook/mineru-progress') {
    const data = lastEvent.data ?? {}
    if (data.label !== undefined && data.label !== null && data.label !== '') label = data.label
    else if (data.stage !== undefined && data.stage !== null && data.stage !== '') {
      label = data.file !== undefined && data.file !== null && data.file !== ''
        ? `${data.file}：${data.stage}`
        : data.stage
    }
  }
  // 阶段在做什么（让人放心的说明）
  const phase = meta.phase ?? 1
  const phaseDesc = {
    2: '源探查：主 AI 正在通读你的教材，整理成源材料索引',
    3: '教学设计：主 AI 正在起草设计关卡方案（已通过过的会自动跳过）',
    4: '最佳范例章：主 AI 正在写第 1 章给你看效果',
    5: '全章写作：小助手执笔 + 小助手自查 + 主 AI 终审，逐章推进',
    6: '终检与交付：主 AI 亲自做最后检查 + 机器兜底',
  }[phase]
  // 写章进度（phase 5）：已完章数 / 总章数
  let chapterProgress = null
  if (phase === 5) {
    const total = (meta.outline?.chapters ?? []).length
    if (total > 0) {
      const done = (events ?? []).filter((e) =>
        e.type === 'textbook/agent-end' && typeof e.data?.label === 'string' && e.data.label.includes('完成（小助手执笔')).length
      chapterProgress = { done: Math.min(done, total), total }
    }
  }
  // 计时 + 卡顿警告（F31，2026-08-20）：AI 流式干活（aiActive=true：partialActive 或账本 3 分钟内有动）
  // 时抑制「可能卡住了」报警，改显示「AI 正在干活」；仅 aiActive=false 且账本超 8 分钟才报警。
  const lastTime = lastEvent?.time ?? meta.updatedAt ?? Date.now()
  const elapsedMs = Math.max(0, Date.now() - lastTime)
  const fmt = (ms) => {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    const h = Math.floor(m / 60)
    const parts = []
    if (h > 0) parts.push(`${h} 小时`)
    if (m % 60 > 0 || h > 0) parts.push(`${m % 60} 分`)
    parts.push(`${s % 60} 秒`)
    return parts.join(' ')
  }
  const stale = !aiActive && elapsedMs > 8 * 60 * 1000
  return createElement('div', { style: S.focus },
    createElement('strong', { style: { fontSize: '14px' } }, `⏳ ${label || '准备中…'}`),
    extra !== ''
      ? createElement('p', { style: { margin: '6px 0 0', opacity: 0.9 } }, `⏳ ${extra}`)
      : null,
    phaseDesc !== undefined
      ? createElement('p', { style: { margin: '6px 0 0', opacity: 0.85 } }, `📌 ${phaseDesc}`)
      : null,
    chapterProgress !== null
      ? createElement('div', { style: { marginTop: '10px' } },
          createElement('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' } },
            createElement('span', { style: { opacity: 0.8 } }, '章节写作进度'),
            createElement('span', { style: { opacity: 0.8 } }, `已完成 ${chapterProgress.done}/${chapterProgress.total} 章`),
          ),
          createElement('div', { style: { height: '8px', borderRadius: '4px', background: 'var(--dsw-border, #d0d7de)', overflow: 'hidden' } },
            createElement('div', {
              style: {
                height: '100%',
                width: `${Math.round((chapterProgress.done / chapterProgress.total) * 100)}%`,
                background: 'var(--dsw-accent, #4f6ef7)',
                borderRadius: '4px',
                transition: 'width 0.6s',
              },
            }),
          ),
        )
      : null,
    createElement('p', { style: { margin: '6px 0 0', fontSize: '12px', opacity: 0.7 } }, `⏱ 这一步已进行 ${fmt(elapsedMs)}`),
    stale
      ? createElement('div', { style: { marginTop: '8px', padding: '8px 10px', border: '1px solid #d4a72c', borderRadius: '8px', background: 'var(--dsw-warn-soft, #fff8e1)' } },
          createElement('span', { style: { fontSize: '13px' } }, `⚠️ 已经 ${fmt(elapsedMs)} 没有新动静了，可能卡住了。到对话页确认一下：如果真卡住了，在对话里发一句「继续」（或点这里重试）唤醒 AI。`),
          createElement('button', { style: { ...S.bigBtn(true), marginLeft: '8px', padding: '4px 12px' }, onClick: onResume, disabled: busy }, '🔁 重试'),
        )
      : createElement('p', { style: { margin: '6px 0 0', fontSize: '12px', opacity: 0.85 } }, `🤖 AI 正在干活，已进行 ${fmt(elapsedMs)}`),
    createElement('p', { style: { margin: '6px 0 0', opacity: 0.8 } }, '主 AI 正在亲手做这一步（下方对话台里能看到它现场干活）；轮到你需要拍板/确认时会亮起 ⚡，你随时可以在对话里问它。'),
  )
}

// ── 交付卡 ──────────────────────────────────────────────────────────────────

export function DeliveryCard(props) {
  const { project, session, checks, onPreview, preview, busy, meta, aiReport, styleNotes } = props
  const bookName = (meta?.name ?? '').trim() || 'BOOK'
  return createElement('div', { style: S.focus },
    createElement('strong', { style: { fontSize: '14px' } }, '🎉 书做好了！'),
    aiReport !== null && aiReport !== undefined && aiReport !== ''
      ? createElement('div', { style: { margin: '10px 0', padding: '8px 10px', background: 'var(--dsw-accent-soft, #eef2ff)', borderRadius: '8px', fontSize: '12px' } },
          createElement('strong', null, '🤖 AI 自查说的：'),
          createElement('p', { style: { margin: '4px 0 0', whiteSpace: 'pre-wrap' } }, aiReport),
        )
      : null,
    createElement('div', { style: { margin: '10px 0' } },
      (checks ?? []).map((check) =>
        createElement('div', { key: check.name, style: { margin: '4px 0' } },
          createElement('span', null, check.ok === true ? '✅' : '❌'),
          ` ${check.name}`,
          createElement('span', { style: { opacity: 0.7, marginLeft: '6px', fontSize: '12px' } }, check.note ?? ''),
        ),
      ),
    ),
    (styleNotes ?? []).length > 0
      ? createElement('div', { style: { margin: '10px 0', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--dsw-border, #d0d7de)' } },
          createElement('p', { style: { margin: '0 0 6px', fontWeight: 600 } }, '🎨 你的风格线条条有着落'),
          ...(styleNotes ?? []).map((note, index) =>
            createElement('div', { key: note.id ?? index, style: { fontSize: '12px', margin: '3px 0' } },
              `${note.status === 'superseded' ? '·（已收回）' : note.status === 'conflict' ? '·（与设计冲突，理由见备注）' : '·'}${note.text}`,
              note.note ? createElement('span', { style: { opacity: 0.6 } }, ` -- ${note.note}`) : null,
            )),
        )
      : null,
    createElement('p', { style: { margin: '0 0 8px', fontSize: '12px', opacity: 0.75 } },
      'AI 亲手做完最后检查，机器也兜底验过；你仍建议先让老师/家长复核一遍再用。'),
    createElement('div', { style: { display: 'flex', gap: '10px', margin: '10px 0' } },
      createElement('button', { style: S.bigBtn(true), onClick: onPreview, disabled: busy }, preview === null ? '👀 预览成品' : '收起预览'),
      createElement('a', {
        style: { ...S.bigBtn(true), textDecoration: 'none', display: 'inline-block' },
        href: `/textbook/download?session=${encodeURIComponent(session)}&project=${encodeURIComponent(project)}&path=work/book.md`,
      }, `⬇️ 下载《${bookName}》.md`),
    ),
    preview !== null
      ? createElement('pre', { style: { whiteSpace: 'pre-wrap', background: 'var(--dsw-surface, #fff)', borderRadius: '8px', padding: '10px', maxHeight: '300px', overflow: 'auto', fontSize: '12px' } }, preview)
      : null,
    createElement('div', { style: { margin: '8px 0 0', opacity: 0.8 } },
      createElement('p', { style: { margin: '0 0 4px', fontWeight: 600 } }, '💡 这本书怎么用'),
      createElement('p', { style: { margin: '0 0 4px' } }, `给 AI 老师上课 → 把下载的《${bookName}》.md 交给【破卷】（https://www.socratopia.app/r/SCR-FEJXMQ）作为教材进行学习。【建议】`),
      createElement('p', { style: { margin: '0 0 4px' } }, '给人读 → 直接阅读或打印。建议先复核一遍再用。'),
      createElement('p', { style: { margin: '0' } }, '如果本项目对你有帮助，欢迎填写邀请码：SCR-FEJXMQ，可免费领取 100 万 tokens，全场官方造书免费学习。'),
    ),
  )
}

// ── 关卡卡 ──────────────────────────────────────────────────────────────────

const REASONS = ['讲得太深了', '讲得太浅了', '不是我要的重点', '和别的部分重复', '换个风格']

// 2026-08-21：组装「驳回」提交体——勾选「换个风格」且粘贴了目标文本时，
// 把文本附进 note 交办给 AI（修订时照着改），并保留 reasons 里的「换个风格」。
export function rejectPayload(mode, reasons, note, styleText) {
  const style = (reasons ?? []).includes('换个风格') ? String(styleText ?? '').trim() : ''
  const extraNote = style !== '' ? `\n【你想换的风格/写法】\n${style}` : ''
  return { approved: false, mode, reasons: reasons ?? [], note: `${String(note ?? '')}${extraNote}`.trim() }
}

export function GatePanel(props) {
  const { gate, onDecide, onRollback, busy, error, onAddPattern } = props
  // 2026-08-21 需求：完整方案默认展开展示（用户拍板前先看全），仍可点「收起完整方案」折叠。
  const [showDetail, setShowDetail] = useState(true)
  const [showCompare, setShowCompare] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [mode, setMode] = useState('wrong')
  const [reasons, setReasons] = useState([])
  const [note, setNote] = useState('')
  // 2026-08-21：勾选「换个风格」时出现的粘贴窗口（目标文本 → 本书自定义模式）。
  const [styleText, setStyleText] = useState('')

  if (gate === null) return null

  if (gate.status !== 'awaiting') {
    const decided = gate.status === 'approved'
    return createElement('div', { style: S.focus },
      createElement('strong', null, decided ? `✅ 第 ${gate.gate} 关已通过（v${gate.version}）` : `↩️ 第 ${gate.gate} 关已驳回（v${gate.version}），等 AI 修订`),
      decided
        ? createElement('p', { style: { margin: '6px 0 0', opacity: 0.8 } }, '之后随时能改：回退可以回到这一关之前的任何版本。')
        : createElement('p', { style: { margin: '6px 0 0', opacity: 0.8 } }, 'AI 正在按你的意见修改，新版提案会出现在这里。'),
      createElement('div', { style: { marginTop: '8px' } },
        createElement('button', { style: S.smallLink, onClick: () => onRollback() }, '⏪ 回退到上一个拍板点'),
      ),
    )
  }

  const toggleReason = (reason) => {
    setReasons((prev) => prev.includes(reason) ? prev.filter((item) => item !== reason) : [...prev, reason])
  }

  // 2026-08-21：勾「换个风格」+ 粘贴目标文本 → 后台分析成自定义模式 + 文本并入驳回 note。
  const submitReject = () => {
    const hasStyle = (reasons ?? []).includes('换个风格')
    const style = hasStyle ? styleText.trim() : ''
    if (hasStyle && style !== '' && typeof onAddPattern === 'function') {
      void onAddPattern(style).catch(() => {})
    }
    onDecide(rejectPayload(mode, reasons, note, styleText))
  }

  return createElement('div', { style: S.focus },
    createElement('div', null,
      createElement('strong', { style: { fontSize: '14px' } }, `🚦 请你拍板 · 第 ${gate.gate} 关 · 方案 v${gate.version}`),
      createElement('span', { style: { float: 'right', opacity: 0.6, fontSize: '12px' } }, '这一关不过，流程不会继续'),
    ),
    createElement('p', { style: { margin: '10px 0 6px' } }, gate.title),
    createElement('p', { style: { margin: '0 0 6px', opacity: 0.9, lineHeight: 1.6 } }, gate.summary),
    createElement('div', { style: { margin: '6px 0' } },
      createElement('button', { style: S.smallLink, onClick: () => setShowDetail(!showDetail) }, showDetail ? '收起完整方案' : '展开完整方案'),
      gate.prevProposal !== null
        ? createElement('span', null, '　',
            createElement('button', { style: S.smallLink, onClick: () => setShowCompare(!showCompare) }, showCompare ? '收起对比' : `对比上一版（v${gate.prevProposal.version}）`))
        : null,
    ),
    showDetail && (gate.detail ?? '') !== ''
      ? createElement('pre', { style: { whiteSpace: 'pre-wrap', background: 'var(--dsw-surface, #fff)', borderRadius: '8px', padding: '10px', fontSize: '12px', opacity: 0.9, maxHeight: '260px', overflow: 'auto' } }, gate.detail)
      : null,
    showCompare && gate.prevProposal !== null
      ? createElement('div', { style: { background: 'var(--dsw-surface, #fff)', borderRadius: '8px', padding: '10px', fontSize: '12px', opacity: 0.9 } },
          createElement('strong', null, `上一版 v${gate.prevProposal.version}：`),
          createElement('p', { style: { margin: '4px 0 0' } }, gate.prevProposal.summary))
      : null,
    error !== null ? createElement('p', { style: S.error }, error) : null,
    rejecting
      ? createElement('div', { style: { marginTop: '10px', borderTop: '1px dashed var(--dsw-border, #d0d7de)', paddingTop: '8px' } },
          createElement('p', { style: { margin: '0 0 6px', fontWeight: 600 } }, '驳回原因（选一个，不必打字）'),
          createElement('div', { style: { margin: '8px 0' } },
            createElement('label', { style: { display: 'block', margin: '4px 0' } },
              createElement('input', { type: 'radio', name: 'mode', checked: mode === 'wrong', onChange: () => setMode('wrong') }),
              ' 方案不对 —— AI 重做一版'),
            createElement('label', { style: { display: 'block', margin: '4px 0' } },
              createElement('input', { type: 'radio', name: 'mode', checked: mode === 'confused', onChange: () => setMode('confused') }),
              ' 我看不懂 / 不是我要的 —— AI 换人话重讲、给例子')),
          createElement('p', { style: { margin: '6px 0 4px', fontWeight: 600 } }, '具体哪里不满意（可多选）'),
          REASONS.map((reason) =>
            createElement('label', { key: reason, style: S.checkItem },
              createElement('input', { type: 'checkbox', checked: reasons.includes(reason), onChange: () => toggleReason(reason) }),
              ` ${reason}`)),
          // 2026-08-21：勾选「换个风格」→ 弹出粘贴窗口，目标文本由 AI 分析成这本书的自定义模式。
          reasons.includes('换个风格')
            ? createElement('div', { style: { marginTop: '4px' } },
                createElement('p', { style: { margin: '0 0 4px', fontSize: '12px', opacity: 0.8 } },
                  '把你想要的风格/写法粘贴进来，AI 会把它记成这本书的自定义模式，修订时照着改：'),
                createElement('textarea', {
                  style: { ...S.textarea, borderColor: 'var(--dsw-accent, #4f6ef7)' },
                  placeholder: '例：每个知识点先给一个生活中的真实场景引出概念，再配一道由浅入深的例题……',
                  value: styleText,
                  onChange: (e) => setStyleText(e.target.value),
                }))
            : null,
          createElement('textarea', { style: S.textarea, placeholder: '想多说一句？在这里补充（可选）', value: note, onChange: (e) => setNote(e.target.value) }),
          createElement('div', { style: { marginTop: '8px', display: 'flex', gap: '8px' } },
            createElement('button', { style: S.bigBtn(false), onClick: submitReject, disabled: busy }, '提交驳回'),
            createElement('button', { style: { ...S.smallLink, textDecoration: 'none' }, onClick: () => { setRejecting(false); setStyleText('') } }, '取消')))
      : createElement('div', { style: { marginTop: '12px', display: 'flex', gap: '10px' } },
          createElement('button', { style: S.bigBtn(true), onClick: () => onDecide({ approved: true }), disabled: busy }, '✅ 通过，继续'),
          createElement('button', { style: S.bigBtn(false), onClick: () => setRejecting(true), disabled: busy }, '❌ 驳回，提意见')),
    createElement('div', { style: { marginTop: '10px' } },
      createElement('button', { style: S.smallLink, onClick: () => onRollback(), disabled: busy }, '⏪ 回退到上一个拍板点')),
  )
}

// ── 对话台（右下：宿主对话的完整镜像；只显人话，工具噪音默认折叠一行） ───────

function blockText(block) {
  if (block === null || block === undefined) return ''
  if (typeof block.text === 'string') return block.text
  return ''
}

function assistantBlocks(blocks) {
  const parts = []
  for (const block of blocks ?? []) {
    if (block?.kind === 'text') parts.push(blockText(block))
    else if (block?.kind === 'tool-call') parts.push(`🔧 调用工具：${block.name ?? ''}`)
    else if (block?.kind === 'reasoning') parts.push('（思考中…）')
  }
  return parts.join('\n')
}

function contentBlocksText(blocks) {
  const parts = []
  for (const block of blocks ?? []) {
    if (block?.type === 'text') parts.push(blockText(block))
    else if (block?.type === 'tool_use') parts.push(`🔧 调用工具：${block.name ?? ''}`)
  }
  return parts.join('\n')
}

// 单条气泡（用户靠右、助手靠左）；从旧左栏镜像提为模块级函数，对话台与别处共用。
function bubble(side, text, extraStyle) {
  return createElement('div', {
    style: {
      maxWidth: '88%',
      margin: '6px 0',
      padding: '8px 10px',
      borderRadius: '10px',
      fontSize: '13px',
      lineHeight: 1.55,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      alignSelf: side === 'user' ? 'flex-end' : 'flex-start',
      background: side === 'user' ? 'var(--dsw-accent-soft, #eef2ff)' : 'var(--dsw-surface, #ffffff)',
      border: '1px solid var(--dsw-border, #d0d7de)',
      ...(extraStyle ?? {}),
    },
  }, text)
}

// 工具行一句话：正在跑 / 已完成 / 出错（工具细节压成一行，避免刷屏）。
function toolLine(root) {
  const name = root?.name ?? root?.toolName ?? '工具'
  if (root?.kind === 'tool-result') {
    const text = String(root?.result?.text ?? root?.text ?? '').replace(/\s+/g, ' ').slice(0, 120)
    const ok = root?.result?.isError !== true && root?.isError !== true
    return `🔧 ${name} · ${ok ? '完成' : '出错'}${text !== '' ? `：${text}` : ''}`
  }
  return `🔧 ${name} · 执行中…`
}

// 灰字小行（重试/命令/压缩等系统提示，不打扰主对话）。
function muted(text) {
  return createElement('p', { style: { margin: '3px 0', fontSize: '11px', opacity: 0.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' } }, text)
}

// ── 账面回执徽章（F5/Task 20）：把落账事件按时间窗回贴到最近的 assistant 气泡 ──
// 界面只跟账走：AI 在对话里答应过的事，一旦账本里落了事件，就在最近那口气泡下面
// 亮一行绿色小字当回执，让"说了"和"落账了"在界面上接得上。
const RECEIPT_TEXT = {
  'textbook/style-note': (d) => `✓ 已记入风格线${d?.styleNote?.text ? `：${String(d.styleNote.text).slice(0, 20)}…` : ''}`,
  'textbook/intervention': () => '✓ 已记入留言（下个停靠点处理）',
  'textbook/intervention-done': () => '✓ 留言已处理',
  'textbook/pause': () => '✓ 已暂停',
  'textbook/resume': () => '✓ 已继续',
  'textbook/outline-decision': (d) => `✓ 章节安排${d?.approved === true ? '已通过' : '已驳回'}`,
  'textbook/gate-decision': (d) => `✓ 第 ${d?.gate ?? '?'} 关${d?.approved === true ? '通过' : '驳回'}`,
  'textbook/gold-seal': () => '✓ 金标准已定稿为风格母版',
  'textbook/pattern-added': (d) => `✓ 已加自定义模式${d?.name ? `：${String(d.name).slice(0, 20)}` : ''}`,
}

// 绿色小字徽章条（一行一个回执；左缩进对齐气泡内文）。
function badgeSpan(text) {
  return createElement('div', {
    style: { margin: '2px 0 6px 12px', fontSize: '11px', color: 'var(--dsw-success, #1a7f37)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  }, text)
}

// assistant 气泡的完整文本（正文 + 状态记号）；都空就不渲染（回执也无处可贴）。
// F29（2026-08-20 走查）：真实节点形态兼容多种——chat 节点形（data.blocks）与
// 简单消息形（node.content / data.content，user 同款）。挨个试，取第一个非空。
function assistantBubbleText(node) {
  const data = node?.data ?? node ?? {}
  const fromBlocks = Array.isArray(data.blocks) && data.blocks.length > 0 ? assistantBlocks(data.blocks) : ''
  const fromContent = fromBlocks !== '' ? '' : (contentBlocksText(node?.content) || contentBlocksText(data.content))
  const text = fromBlocks || fromContent
  const mark = data.status === 'running' ? '▍' : data.status === 'interrupted' ? '（已中断）' : ''
  return `${text}${mark}`
}

// 对话台（右下：宿主对话的完整镜像，节点全集自绘；独立滚动由外层容器负责）。
export function ChatDesk(props) {
  const nodes = props.useSession((s) => s.nodes) ?? []
  const partial = props.useSession((s) => s.partial)
  // F5 账面事件（/textbook/events，Task 20 回执徽章用）；漏账催办（Task 19 nudge，不传时安全忽略）。
  const events = props.events ?? []
  const onNudge = props.onNudge ?? (() => {})
  const onCollapse = props.onCollapse ?? null
  // 对话台钉底滚动（回归修复）：新消息/流式增量（nodes.length/partial）进来时，若用户正停在
  // 底部附近就自动滚到底；用户往上翻（离开底部）就不打扰，回到底部附近后重新钉住。
  // 清理安全：effect 只返回 undefined，随组件卸载/重渲一并回收，无外部监听残留。
  const deskScrollRef = useRef(null)
  useEffect(() => {
    const el = deskScrollRef.current
    if (el === null) return undefined
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    if (nearBottom) el.scrollTop = el.scrollHeight
    return undefined
  }, [nodes.length, partial])
  // 打开对话台时默认滚到最新一条消息：ChatDesk 在展开态才挂载，挂载即无条件钉底
  // （上面的 effect 只在用户已停在底部附近时才滚，长对话刚打开时会停在顶部）。
  useEffect(() => {
    const el = deskScrollRef.current
    if (el !== null) el.scrollTop = el.scrollHeight
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const items = []
  const push = (el) => items.push(el)
  // 回执徽章预计算：先收集每个会渲染的 assistant 气泡的时间戳（按渲染顺序编号），
  // 再把每个落账事件交给「它之前最近、且不早于 5 分钟」的那口气泡（最近语义，一条只贴一次）。
  // 防御：宿主 assistant 节点可能没带 data.time（旧账本/宿主结构差异）——先读 data.time 再退回
  // node.time，都没有就记为无效时间（不参与回贴、也不崩）；这同时兼容冒烟测试用 data.time 的伪节点。
  const assistantTimes = []
  for (const node of nodes ?? []) {
    // F29：真实 kind 是 assistant-step 或 assistant；正文可能在 data.blocks 或 node.content。
    if (node.kind !== 'assistant-step' && node.kind !== 'assistant') continue
    if (assistantBubbleText(node) !== '') assistantTimes.push(Number(node.data?.time ?? node.time))
  }
  const badgeByAssistant = new Map() // assistant 序号 -> 徽章文本数组
  for (const e of events) {
    const textOf = RECEIPT_TEXT[e.type]
    if (textOf === undefined || typeof e.time !== 'number') continue
    let best = -1
    for (let i = 0; i < assistantTimes.length; i += 1) {
      const t = assistantTimes[i]
      if (Number.isFinite(t) && e.time >= t && e.time - t < 5 * 60 * 1000) best = i
    }
    if (best >= 0) {
      const arr = badgeByAssistant.get(best) ?? []
      arr.push(badgeSpan(textOf(e.data)))
      badgeByAssistant.set(best, arr)
    }
  }
  let assistantOrdinal = -1
  for (const node of nodes ?? []) {
    const data = node.data ?? {}
    switch (node.kind) {
      case 'user': case 'steering': {
        const text = contentBlocksText(node.content)
        if (text !== '') push(bubble('user', text))
        break
      }
      // F29 修复（2026-08-20 实书走查）：真实 ChatNodeKind 是 assistant-step/tool-call/
      // model-retry/command-input/manual-compaction/unknown（Inspect conversation.chat.node
      // key 域）；旧代码用 assistant/tool/retry/command/compaction/fallback 对不上，
      // 导致 AI 消息/工具卡被静默丢弃（用户消息 kind=user 恰好匹配所以能显示）。
      // 主用真实名，保留旧名作兼容。
      case 'assistant-step': case 'assistant': {
        const text = assistantBubbleText(node)
        if (text !== '') {
          assistantOrdinal += 1
          push(bubble('assistant', text))
          // 账面回执徽章：这口气泡的回执贴到它下面（最近语义已在预计算里定好）。
          const badges = badgeByAssistant.get(assistantOrdinal)
          if (badges !== undefined) for (const b of badges) push(b)
        }
        break
      }
      case 'tool-call': case 'tool': push(toolLine(data.root)); break
      case 'turn-error': push(bubble('assistant', `⚠️ 出错了：${data.message ?? node.message ?? ''}`, { color: 'var(--dsw-danger, #cf222e)' })); break
      case 'model-retry': case 'retry': push(muted(`↻ 模型自动重试（第 ${(data.attempts ?? []).length + 1} 次）`)); break
      case 'command': case 'command-input': push(muted(`⌘ /${data.command?.name ?? '命令'} 已执行`)); break
      case 'compaction': case 'manual-compaction': push(muted('🧹 早期对话已压缩（内容要点保留）')); break
      case 'turn-max-tokens': push(muted('⚠️ 这一轮写到长度上限被截断')); break
      case 'unknown': case 'fallback': push(muted(data.message ?? '（一段未识别的记录）')); break
      // F29：context 是「注入的上下文」消息（system-reminder/上下文快照等），正文在 data.content，
      // 灰字折行显示（会很长，截断到 200 字提示即可，别刷屏）。
      case 'context': {
        const ctxText = (contentBlocksText(data.content) || String(data.text ?? data.message ?? '')).replace(/\s+/g, ' ').trim()
        push(muted(ctxText !== '' ? `（上下文）${ctxText.slice(0, 200)}${ctxText.length > 200 ? '…' : ''}` : '（上下文提示）'))
        break
      }
      case 'workflow-run': push(muted('（工作流运行）')); break
      default: break // turn-tail 等页脚行不进镜像
    }
  }
  if (partial != null && partial.blocks != null) {
    const text = assistantBlocks(partial.blocks)
    if (text !== '') push(bubble('assistant', `${text}▍`))
  }
  if (items.length === 0) push(muted('对话会实时显示在这里；你对 AI 说话用页面底下的输入条。'))
  // 外层是对话台自己的滚动容器（旧 ChatMirror 的 chatPaneRef 钉底滚动回归修复）：
  // 钉底 effect 由上面的 deskScrollRef 驱动，用户翻上去不打扰；「收成一条」在容器内粘顶。
  return createElement('div', {
    ref: deskScrollRef,
    style: { height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' },
  },
    onCollapse !== null
      ? createElement('div', { style: { position: 'sticky', top: 0, background: 'inherit', textAlign: 'right' } },
          createElement('button', { style: S.smallLink, onClick: onCollapse }, '收成一条'))
      : null,
    createElement('div', { style: { display: 'flex', flexDirection: 'column', padding: '10px 12px', minHeight: '100%', boxSizing: 'border-box' } },
      ...items,
      // 漏账催办（F5/Task 20）：对话台底部常驻小按钮，一键催主 AI 落账（nudge 动作）。
      createElement('button', {
        style: { ...S.smallLink, margin: '6px 0' },
        onClick: () => onNudge('工作台还没跟上，请把刚才答应的事落账（style-note/progress 等）'),
      }, '⏰ 提醒 AI 落账'),
    ),
  )
}

// ── 自动打开器：造书会话首次对话后，自动切到"工作台"页签 ────────────────────

export function AutoOpenWorkbench(props) {
  const isTextbook = props.useSessions((s) => s.byId[props.sessionId]?.agentPreset) === 'textbook'
  const messageCount = props.useSession((s) => s.nodes.length)
  const doneRef = useRef(false)

  useEffect(() => {
    if (doneRef.current || !isTextbook || messageCount === 0) return
    // 找到"工作台"页签并激活（仅一次；用户手动切回"对话"后不再打扰）。
    const target = [...document.querySelectorAll('[role="tab"]')]
      .find((el) => (el.textContent ?? '').trim() === '工作台')
    if (target === undefined) return
    doneRef.current = true
    if (target.getAttribute('aria-selected') === 'true') return
    target.click()
  }, [isTextbook, messageCount])

  return null
}

// ── 谈判桌·意见单 ───────────────────────────────────────────────────────────

const OPINION_KIND_TEXT = { dislike: '😕 不喜欢这种写法', drop: '🗑 这类内容不需要', change: '✏️ 要改成' }
const OPINION_STATUS_TEXT = { pending: '待处理', sent: 'AI 修订中', applied: 'AI 已改', revoked: '已撤销' }

export function GoldOpinionList(props) {
  const { opinions, busy, onRevoke, onRevise } = props
  const list = opinions ?? []
  if (list.length === 0) {
    return createElement('div', { style: { ...S.card, opacity: 0.85 } },
      createElement('p', { style: { margin: '0' } }, '📋 本稿意见单还空着：读下面的稿子随手标记，或用最底下的「笼统提一条」。'),
    )
  }
  let seq = 0
  const rows = list.map((o) => {
    if (o.status === 'revoked') {
      return createElement('div', { key: o.id, style: { ...S.card, opacity: 0.45, textDecoration: 'line-through', marginBottom: '6px' } },
        `已撤销：${OPINION_KIND_TEXT[o.kind] ?? o.kind}${o.wish ? ` ${o.wish}` : ''}`)
    }
    seq += 1
    const target = o.target == null
      ? '笼统（不指哪段）'
      : `第${o.target.para}段${o.target.hint ? `「${o.target.hint}」` : ''}`
    return createElement('div', { key: o.id, style: { ...S.card, marginBottom: '6px' } },
      createElement('div', { style: { display: 'flex', gap: '8px', alignItems: 'baseline', flexWrap: 'wrap' } },
        createElement('strong', null, `#${seq}`),
        createElement('span', null, OPINION_KIND_TEXT[o.kind] ?? o.kind),
        createElement('span', { style: { opacity: 0.75, fontSize: '12px' } }, target),
        o.wish ? createElement('span', null, o.wish) : null,
        createElement('span', { style: { marginLeft: 'auto', fontSize: '12px', whiteSpace: 'nowrap' } },
          OPINION_STATUS_TEXT[o.status] ?? o.status,
          ' ',
          createElement('button', { style: S.smallLink, onClick: () => onRevoke(o.id), disabled: busy }, '撤销'),
        ),
      ),
    )
  })
  const pendingCount = list.filter((o) => o.status === 'pending').length
  return createElement('div', null,
    createElement('p', { style: { margin: '0 0 6px', fontWeight: 600 } }, `📋 本稿意见单（${seq} 条）`),
    ...rows,
    onRevise !== undefined
      ? createElement('div', { style: { margin: '8px 0' } },
          createElement('button', { style: S.bigBtn(true), onClick: onRevise, disabled: busy || pendingCount === 0 },
            pendingCount > 0 ? `🔁 让 AI 照这些改（${pendingCount} 条）` : '🔁 让 AI 照这些改'),
          pendingCount === 0
            ? createElement('span', { style: { marginLeft: '8px', fontSize: '12px', opacity: 0.7 } }, '先标记至少一条意见（段旁三键或笼统便签）')
            : null,
          createElement('p', { style: S.hint }, '只改你标过的地方，其余原样保留'),
        )
      : null,
  )
}

// ── 谈判桌·阅读与标记（段旁三键 + 笼统便签） ───────────────────────────────

// 正文流式排版（F11）：像读书一样一段段往下流，不做卡片框。
const READER_PARA_STYLE = {
  margin: '0 0 0.75em', fontSize: '14px', lineHeight: 1.7, maxWidth: '42em',
}

// F36（2026-08-20 走查）：首次引导脉冲只在本页会话触发一次（页面刷新后重新计）。
let goldFirstPulseDone = false

export function GoldReader(props) {
  const { text, opinions, busy, onOpinion, readOnly, onRevokeOpinion = () => {} } = props
  const [hover, setHover] = useState(null)
  const [formPara, setFormPara] = useState(null)
  const [wishText, setWishText] = useState('')
  const [wishError, setWishError] = useState(null)
  const [generalKind, setGeneralKind] = useState('change')
  const [generalText, setGeneralText] = useState('')
  const [generalError, setGeneralError] = useState(null)
  // F36：进入标记态时首段三键闪两下，教用户「这三键可标意见」（本页会话一次）。
  // pulsePhase: null=未闪 | 'on1' | 'off' | 'on2' | 'done'（done 后不再闪）。
  const [pulsePhase, setPulsePhase] = useState(null)
  useEffect(() => {
    if (readOnly || goldFirstPulseDone) return undefined
    goldFirstPulseDone = true
    const timers = [
      setTimeout(() => setPulsePhase('on1'), 250),
      setTimeout(() => setPulsePhase('off'), 750),
      setTimeout(() => setPulsePhase('on2'), 1150),
      setTimeout(() => setPulsePhase('done'), 1650),
    ]
    return () => { for (const t of timers) clearTimeout(t) }
  }, [readOnly])
  const paras = splitParagraphs(text)
  // 段号 -> 已挂意见的标签（#N 表情），给人看「这段已标过」。
  const marked = new Map()
  let seq = 0
  for (const o of opinions ?? []) {
    if (o.status === 'revoked') continue
    seq += 1
    if (o.target != null && Number.isSafeInteger(o.target.para)) {
      const arr = marked.get(o.target.para) ?? []
      arr.push(`#${seq} ${o.kind === 'dislike' ? '😕' : o.kind === 'drop' ? '🗑' : '✏️'}`)
      marked.set(o.target.para, arr)
    }
  }
  const submitWish = () => {
    const wish = wishText.trim()
    if (wish === '') { setWishError('写一句你想让它变成什么样'); return }
    onOpinion('change', wish, formPara, paragraphHint(paras[formPara - 1] ?? ''))
    setFormPara(null); setWishText(''); setWishError(null)
  }
  const submitGeneral = () => {
    const wish = generalText.trim()
    if (generalKind === 'change' && wish === '') { setGeneralError('「要改成」请写一句话'); return }
    onOpinion(generalKind, wish, null, '')
    setGeneralText(''); setGeneralError(null)
  }
  // 左右留白：右 68px 给三键浮出腾地方，左 34px 给段号/已标标签的装订线腾地方。
  return createElement('div', { style: { paddingLeft: '34px', paddingRight: '68px' } },
    !readOnly
      ? createElement('p', { style: { margin: '0 0 8px', fontSize: '12px', opacity: 0.75 } },
          '标记方法：鼠标停在哪一段，那段右侧就亮出三个键 😕🗑✏️；不指哪段就用最底下「笼统提一条」。提完点意见单里的【让 AI 照这些改】。')
      : null,
    paras.map((para, idx) => {
      const n = idx + 1
      const marks = marked.get(n) ?? []
      // F36：首段三键引导脉冲（on1/on2 亮起、off 熄灭），平时常显淡态 0.3。
      const pulsing = n === 1 && (pulsePhase === 'on1' || pulsePhase === 'on2')
      const pulseBtnStyle = pulsing
        ? { background: 'var(--dsw-accent-soft, #eef2ff)', borderRadius: '6px', boxShadow: '0 0 0 2px var(--dsw-accent, #4f6ef7)',
            transform: 'scale(1.15)', transition: 'transform 0.2s, boxShadow 0.2s, background 0.2s' }
        : null
      return createElement('div', {
        key: n,
        // 段容器相对定位：装订线、三键浮出都以它为参照，正文不占这些位置。
        style: { position: 'relative' },
        onMouseEnter: () => setHover(n),
        onMouseLeave: () => setHover((cur) => (cur === n ? null : cur)),
      },
        // 左侧装订线：段号 + 已标 #N 标签（不指段时淡出到 0.35，指到时亮起）。
        createElement('span', {
          style: { position: 'absolute', left: '-34px', top: '0', fontSize: '11px', lineHeight: 1.6, whiteSpace: 'nowrap',
            color: 'var(--dsw-accent, #4f6ef7)', opacity: hover === n ? 1 : 0.35, transition: 'opacity 0.15s' },
        },
          String(n),
          marks.length > 0
            ? createElement('span', { style: { display: 'block' } }, marks.join(' '))
            : null,
        ),
        // 正文段落：纯流式 + markdown 最小渲染（标题/加粗/列表行）。
        createElement('p', { style: READER_PARA_STYLE }, ...renderInline(para)),
        formPara === n
          ? createElement('div', { style: { margin: '-4px 0 8px' } },
              createElement('textarea', {
                style: { ...S.input, width: '100%', boxSizing: 'border-box' }, rows: 2,
                placeholder: '写一句你想让它变成什么样（例：开头别反问，直接讲道理）',
                value: wishText, onChange: (e) => { setWishText(e.target.value); setWishError(null) },
              }),
              createElement('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
                createElement('button', { style: S.bigBtn(true), onClick: submitWish, disabled: busy }, '✅ 记下这条'),
                createElement('button', { style: S.smallLink, onClick: () => { setFormPara(null); setWishError(null) } }, '收起'),
                wishError !== null ? createElement('span', { style: S.error }, wishError) : null,
              ),
            )
          : null,
        // 三键浮出（absolute 定在段右上角、不占正文宽度）：F36 常显淡态 0.3（可感知、不占位），
        // 悬停或首段引导脉冲时全亮；键始终可点（悬停键本身也算悬停该段）。
        !readOnly
          ? createElement('div', {
              style: { position: 'absolute', top: '-2px', right: '-64px', display: 'flex', gap: '2px',
                opacity: hover === n || pulsing ? 1 : 0.3, transition: 'opacity 0.15s', pointerEvents: 'auto' },
            },
              (() => {
                const activeOf = (kind) => (opinions ?? []).find((o) => o.status !== 'revoked'
                  && o.target != null && o.target.para === n && o.kind === kind)
                // toggle=true 的两态键：同段同类型已有未撤销意见 -> 再点=revoke（防误触，F14 裁决）。
                // ✏️ 传 toggle=false：点开的是改写框、本身不落账、无误触问题，行为不变（F14 裁决第 3 条）。
                const keyWith = (label, kind, title, onClick, toggle = true) => {
                  const active = toggle ? activeOf(kind) : null
                  // aria-label 与 title 同文案：让读屏用户也知道「再点=撤销」。
                  const labelText = active != null ? `${title}（已标：再点一次=撤销）` : title
                  return createElement('button', {
                    key: label,
                    'aria-label': labelText,
                    style: { ...S.smallLink, fontSize: '15px', padding: '2px 4px', whiteSpace: 'nowrap',
                      transition: 'transform 0.2s, boxShadow 0.2s, background 0.2s',
                      ...(active != null ? { background: 'var(--dsw-accent-soft, #eef2ff)', borderRadius: '6px' } : {}),
                      ...(pulseBtnStyle ?? {}) },
                    title: labelText,
                    onClick: () => {
                      if (pulsing) setPulsePhase('done')
                      if (active != null) onRevokeOpinion(active.id)
                      else onClick()
                    },
                    disabled: busy,
                  }, label)
                }
                return [
                  keyWith('😕', 'dislike', '这种写法不喜欢', () => onOpinion('dislike', '', n, paragraphHint(para))),
                  keyWith('🗑', 'drop', '这类内容不需要', () => onOpinion('drop', '', n, paragraphHint(para))),
                  keyWith('✏️', 'change', '要改成（写一句话）', () => { setFormPara(n); setWishText('') }, false),
                ]
              })(),
            )
          : null,
      )
    }),
    !readOnly
      ? createElement('div', { style: { ...S.card, display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' } },
          createElement('span', { style: { fontSize: '12px', opacity: 0.75 } }, '笼统提一条（不指哪段也行）：'),
          ['dislike', 'drop', 'change'].map((k) => createElement('button', {
            key: k,
            style: S.projectBtn(generalKind === k),
            onClick: () => setGeneralKind(k), disabled: busy,
          }, OPINION_KIND_TEXT[k])),
          createElement('input', {
            style: { ...S.input, flex: '1 1 160px', minWidth: '120px' },
            placeholder: '例：整体语气再亲切一点',
            value: generalText,
            onChange: (e) => { setGeneralText(e.target.value); setGeneralError(null) },
          }),
          createElement('button', { style: S.bigBtn(true), onClick: submitGeneral, disabled: busy }, '笼统提一条'),
          generalError !== null ? createElement('span', { style: S.error }, generalError) : null,
        )
      : null,
  )
}

// ── 谈判桌·稿间内联对比（删除线旧文 + 绿底新文 + 意见号） ──────────────────

export function GoldCompare(props) {
  const { oldText, newText, opinions } = props
  const oldParas = splitParagraphs(oldText)
  const newParas = splitParagraphs(newText)
  const ops = diffParagraphs(oldParas, newParas)
  // 新稿段号(1 基) -> 意见号数组；笼统意见只计数。
  const chipsByNewPara = new Map()
  let generalCount = 0
  let seq = 0
  for (const o of opinions ?? []) {
    if (o.status === 'revoked') continue
    seq += 1
    if (o.target != null && Number.isSafeInteger(o.target.para)) {
      const arr = chipsByNewPara.get(o.target.para) ?? []
      arr.push(seq)
      chipsByNewPara.set(o.target.para, arr)
    } else generalCount += 1
  }
  const chipSpan = (n) => createElement('span', {
    key: `c${n}`,
    style: { fontWeight: 700, marginRight: '6px', color: 'var(--dsw-accent, #4f6ef7)', whiteSpace: 'nowrap' },
  }, `#${n}`)
  const blocks = ops.map((op, idx) => {
    if (op.type === 'del') {
      return createElement('p', {
        key: `d${idx}`,
        style: { ...READER_PARA_STYLE, textDecoration: 'line-through', background: 'var(--dsw-danger-soft, #ffebe9)', opacity: 0.75 },
      }, oldParas[op.old])
    }
    // same 与 add 都按新稿渲染；挂到该段的意见号亮出来（same 段挂了意见=AI 在别处落实，也给人看见）。
    const paraNo = op.new + 1
    const chips = chipsByNewPara.get(paraNo) ?? []
    return createElement('p', {
      key: `n${idx}`,
      style: op.type === 'add' ? { ...READER_PARA_STYLE, background: 'var(--dsw-success-soft, #dafbe1)', borderColor: 'var(--dsw-success, #2da44e)' } : READER_PARA_STYLE,
    }, chips.map((n) => chipSpan(n)), ' ', newParas[op.new])
  })
  return createElement('div', null,
    createElement('p', { style: { margin: '0 0 8px', fontSize: '12px', opacity: 0.75 } },
      `对照方式：红底划掉的是旧稿删掉的；绿底是新稿改成的；#号对应意见单里的第几条${generalCount > 0 ? `（另有 ${generalCount} 条笼统意见，AI 会对号入座）` : ''}。`),
    ...blocks,
  )
}

// ── 谈判桌·定稿沉淀（字数 + AI 建议 + 定稿/重写确认层） ─────────────────────

export function GoldFinalize(props) {
  const { meta, opinions, busy, onApprove, onSuggestWords } = props
  const [targetWords, setTargetWords] = useState('') // 兜底单值：默认空（每章字数以清单为准，这个数只兜未填章）
  const [suggesting, setSuggesting] = useState(false)
  const [suggestion, setSuggestion] = useState(null)
  const [error, setError] = useState(null)
  const [confirming, setConfirming] = useState(null) // 'seal' | 'rewrite' | null
  const requestSuggestion = () => {
    setSuggesting(true); setError(null)
    Promise.resolve(onSuggestWords())
      .then((result) => {
        if (result === null) return
        setSuggestion(result)
        if (Number.isFinite(Number(result.suggested)) && Number(result.suggested) >= 500) {
          setTargetWords(String(Math.round(Number(result.suggested))))
        }
      })
      .catch((err) => setError(String(err instanceof Error ? err.message : err)))
      .finally(() => setSuggesting(false))
  }
  const wordsRaw = String(targetWords ?? '').trim()
  const wordsEmpty = wordsRaw === ''
  const words = Number(wordsRaw)
  const wordsOk = wordsEmpty || (Number.isFinite(words) && words >= 500 && words <= 50000)
  const targetToSend = wordsEmpty ? null : (Number.isFinite(words) && words >= 500 && words <= 50000 ? Math.round(words) : null)
  const live = (opinions ?? []).filter((o) => o.status !== 'revoked')
  return createElement('div', { style: S.card },
    createElement('p', { style: { margin: '0 0 6px', fontWeight: 600 } }, '✅ 满意了就定稿（这一章就是全书的样板）'),
    createElement('div', { style: { margin: '6px 0' } },
      createElement('p', { style: { margin: '0 0 4px', fontSize: '12px', opacity: 0.8 } }, '每章字数（来自章节安排，可只调这一章）：'),
      (meta.outline?.chapters ?? []).map((chapter, index) =>
        createElement('div', { key: index, style: { fontSize: '12px', margin: '2px 0', display: 'flex', gap: '6px', alignItems: 'baseline' } },
          `${index + 1}. ${chapter.title ?? ''}`,
          createElement('span', { style: { opacity: 0.6 } },
            Number.isFinite(chapter.targetWords) ? `约 ${chapter.targetWords} 字` : '未定，AI 铺章时自定'),
          chapter.volumeReason ? createElement('span', { style: { opacity: 0.5 } }, `（${chapter.volumeReason}）`) : null,
        )),
      Number.isFinite(meta.targetWords)
        ? createElement('p', { style: { margin: '4px 0 0', fontSize: '12px', opacity: 0.6 } }, `兜底统一值：${meta.targetWords} 字（仅未填章使用）`)
        : null,
    ),
    createElement('div', { style: { display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' } },
      createElement('label', { style: S.label }, '兜底统一字数（可选，仅未填章使用）'),
      createElement('input', {
        style: { ...S.input, width: '110px' }, type: 'number', min: 500, max: 50000, step: 500,
        value: targetWords, onChange: (e) => { setTargetWords(e.target.value); setSuggestion(null) },
      }),
      createElement('button', { style: { ...S.bigBtn(true), padding: '6px 14px' }, onClick: requestSuggestion, disabled: suggesting || busy },
        suggesting ? 'AI 思考中…' : '✨ AI 建议'),
    ),
    suggestion !== null
      ? createElement('div', { style: { margin: '4px 0', fontSize: '12px', opacity: 0.8 } },
          createElement('p', { style: { margin: '0 0 4px' } },
            `🤖 AI 建议：每章 ${suggestion.suggested} 字（${suggestion.range ?? ''}）。${suggestion.reason ?? ''}`),
          (suggestion.perChapter ?? []).length > 0
            ? createElement('div', null,
                (suggestion.perChapter ?? []).map((item) =>
                  createElement('div', { key: item.n, style: { margin: '1px 0' } },
                    `${item.n}. ${item.title ?? ''}：${Number.isFinite(item.words) ? `约 ${item.words} 字` : '未定，AI 铺章时自定'}${item.reason ? `（${item.reason}）` : ''}`,
                  )))
            : null,
        )
      : null,
    !wordsEmpty && !wordsOk ? createElement('p', { style: S.error }, '兜底字数请在 500-50000 之间，或留空只用每章清单') : null,
    error !== null ? createElement('p', { style: S.error }, `⚠️ ${error}`) : null,
    createElement('div', { style: { display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' } },
      createElement('button', {
        style: S.bigBtn(true),
        onClick: () => { if (live.length > 0) setConfirming('seal'); else onApprove(true, targetToSend) },
        disabled: busy || !wordsOk,
      }, '✅ 就按这章的风格写全书'),
      createElement('button', {
        style: { ...S.bigBtn(true), background: 'transparent', color: 'var(--dsw-danger, #cf222e)', padding: '8px 10px' },
        onClick: () => setConfirming('rewrite'),
        disabled: busy || !wordsOk,
      }, '❌ 这版整个不要，重写'),
    ),
    createElement('p', { style: S.hint }, '从头重写这一章；你标过的意见仍会带给 AI 当方向'),
    confirming === 'seal'
      ? createElement('div', { style: { ...S.card, borderColor: 'var(--dsw-accent, #4f6ef7)', marginTop: '8px' } },
          createElement('p', { style: { margin: '0 0 4px', fontWeight: 600 } }, '定稿前确认：下面这些会永久生效'),
          createElement('p', { style: { margin: '0 0 4px', fontSize: '12px', opacity: 0.85 } }, '① 你的意见转成「风格线」，后面每一章都照此执行：'),
          live.map((o, i) => createElement('p', { key: o.id, style: { margin: '0 2px 2px 12px', fontSize: '12px' } },
            `#${i + 1} ${OPINION_KIND_TEXT[o.kind] ?? o.kind}${o.wish ? `：${o.wish}` : ''}`)),
          createElement('p', { style: { margin: '4px 0', fontSize: '12px', opacity: 0.85 } }, '② 这一稿冻结为「风格母版」，AI 铺全书时都拿它当样板。'),
          createElement('div', { style: { display: 'flex', gap: '8px', marginTop: '6px' } },
            createElement('button', { style: S.bigBtn(true), onClick: () => onApprove(true, targetToSend), disabled: busy || !wordsOk }, '确认，定稿'),
            createElement('button', { style: S.smallLink, onClick: () => setConfirming(null) }, '再想想'),
          ),
        )
      : null,
    confirming === 'rewrite'
      ? createElement('div', { style: { ...S.card, borderColor: 'var(--dsw-danger, #cf222e)', marginTop: '8px' } },
          createElement('p', { style: { margin: '0 0 6px' } }, '整稿丢弃重写：这一稿会存档留底（不丢），AI 从头再写一版。'),
          createElement('div', { style: { display: 'flex', gap: '8px' } },
            createElement('button', { style: { ...S.bigBtn(true), background: 'transparent', color: 'var(--dsw-danger, #cf222e)' }, onClick: () => onApprove(false, targetToSend), disabled: busy || !wordsOk }, '确认重写'),
            createElement('button', { style: S.smallLink, onClick: () => setConfirming(null) }, '再想想'),
          ),
        )
      : null,
  )
}

// ── 谈判桌·总装（稿页签 + 读/对比 + 意见单 + 定稿区） ────────────────────────

export function GoldTable(props) {
  const { meta, goldDrafts, goldDraftVersion, busy, postAction, fetchText, onSuggestWords } = props
  const [texts, setTexts] = useState({})
  const [view, setView] = useState({ tab: goldDraftVersion, mode: 'read' })
  const [auditText, setAuditText] = useState(undefined) // undefined=未读到 null=没有
  const [loadError, setLoadError] = useState(null)
  const opinions = meta.goldOpinions ?? []
  const goldNo = Number.isSafeInteger(meta?.goldChapter) && meta.goldChapter >= 1 ? meta.goldChapter : 1
  const currentPath = `work/chapter-${String(goldNo).padStart(2, '0')}.md`
  const pathOf = (version) => (version === goldDraftVersion ? currentPath : (goldDrafts ?? []).find((d) => d.version === version)?.path ?? null)
  const load = (path) => {
    if (texts[path] !== undefined) return
    fetchText(path)
      .then((t) => setTexts((prev) => ({ ...prev, [path]: t })))
      .catch((err) => setLoadError(String(err instanceof Error ? err.message : err)))
  }
  useEffect(() => {
    load(currentPath)
    fetchText(`work/audit-${String(goldNo).padStart(2, '0')}.md`).then(setAuditText).catch(() => setAuditText(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // 展示稿：当前稿或旧稿
  const showTab = Math.min(view.tab, goldDraftVersion)
  const showPath = pathOf(showTab)
  const showText = showPath === null ? null : texts[showPath] ?? null
  // 对比对象：当前稿比上一稿；旧稿比它的下一稿
  const compareWith = view.mode === 'compare' ? (showTab === goldDraftVersion ? showTab - 1 : showTab + 1) : null
  const comparePath = compareWith !== null ? pathOf(compareWith) : null
  useEffect(() => {
    if (comparePath !== null) load(comparePath)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comparePath])
  const compareText = comparePath === null ? null : texts[comparePath] ?? null
  let auditBadge = '🧪 质检：已附自查记录'
  if (auditText != null) {
    try {
      const audit = JSON.parse(auditText)
      auditBadge = typeof audit.passed === 'boolean'
        ? (audit.passed === true ? '🧪 质检：通过（自查无待完善项）' : '🧪 质检：有几处待完善（可以让 AI 改）')
        : '🧪 质检：记录格式待完善'
    } catch { auditBadge = '🧪 质检：记录格式待完善' }
  }
  const addOpinion = (kind, wish, para, hint) => {
    void postAction({ action: 'gold-opinion', kind, wish, ...(para !== null ? { para } : {}), ...(hint ? { hint } : {}) })
  }
  const tabBtn = (v) => createElement('button', {
    key: v,
    style: S.projectBtn(view.tab === v),
    onClick: () => setView({ tab: v, mode: 'read' }),
  }, `第 ${v} 稿${v === goldDraftVersion ? '（最新）' : ''}`)
  return createElement('div', { style: S.focus },
    createElement('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' } },
      createElement('strong', { style: { fontSize: '14px' } }, '🤝 最佳范例章 · 风格谈判桌'),
      createElement('span', { style: { fontSize: '12px', opacity: 0.8 } }, auditBadge),
    ),
    goldDraftVersion > 1
      ? createElement('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' } },
          Array.from({ length: goldDraftVersion }, (_, i) => tabBtn(i + 1)),
          showTab === goldDraftVersion
            ? createElement('button', { style: S.smallLink, onClick: () => setView({ tab: showTab, mode: view.mode === 'compare' ? 'read' : 'compare' }) },
                view.mode === 'compare' ? '只看这一稿' : `和第 ${goldDraftVersion - 1} 稿对比`)
            : createElement('button', { style: S.smallLink, onClick: () => setView({ tab: showTab, mode: view.mode === 'compare' ? 'read' : 'compare' }) },
                view.mode === 'compare' ? '只看这一稿' : `和第 ${showTab + 1} 稿对比`),
        )
      : null,
    loadError !== null ? createElement('p', { style: S.error }, `稿子打开失败：${loadError}`) : null,
    createElement('div', { style: { margin: '6px 0' } },
      showText === null
        ? createElement('p', { style: S.hint }, '加载中…')
        : view.mode === 'compare' && compareText !== null
          ? createElement('div', null,
              createElement('p', { style: S.hint }, '想在这一稿上继续挑毛病？点「只看这一稿」。'),
              createElement(GoldCompare, {
                oldText: showTab === goldDraftVersion ? compareText : showText,
                newText: showTab === goldDraftVersion ? showText : compareText,
                opinions,
              }),
            )
          : createElement(GoldReader, {
              text: showText, opinions, busy,
              onOpinion: addOpinion,
              onRevokeOpinion: (id) => { void postAction({ action: 'gold-opinion-revoke', id }) },
              readOnly: showTab !== goldDraftVersion,
            }),
      showTab !== goldDraftVersion && view.mode === 'read'
        ? createElement('p', { style: { fontSize: '12px', opacity: 0.7, margin: '4px 0' } }, '这是旧稿，只能回顾；要挑毛病请回到「最新」那稿。')
        : null,
    ),
    createElement(GoldOpinionList, {
      opinions, busy,
      onRevoke: (id) => { void postAction({ action: 'gold-opinion-revoke', id }) },
      onRevise: () => { void postAction({ action: 'gold-revise' }) },
    }),
    createElement(GoldFinalize, { meta, opinions, busy, onApprove: (approved, targetWords) => { void postAction({ action: 'gold-approve', approved, targetWords }) }, onSuggestWords }),
  )
}

// ── 协作状态条：现在轮到谁 ───────────────────────────────────────────────────

function StatusStrip(props) {
  const { meta, gate, pendingStage, progressDetail, metaLabel } = props
  const status = meta?.status ?? 'active'
  const phase = meta?.phase ?? 1
  let text = null
  let tone = 'normal'
  if (status === 'delivered') {
    text = `🎉 书做好了 · 可以预览和下载《${meta.name ?? ''}》.md`
    tone = 'ok'
  } else if (status === 'error' || status === 'needs-config') {
    text = status === 'error' ? '⚠️ 出错了 · 请看下面的提示' : '🔑 需要配置 · 请看下面的提示'
    tone = 'error'
  } else if (gate !== null && gate.status === 'awaiting') {
    text = `⚡ 轮到你 · 拍板第 ${gate.gate} 关`
    tone = 'you'
  } else if (status === 'awaiting-gold') {
    text = '⚡ 轮到你 · 确认最佳范例章'
    tone = 'you'
  } else if (status === 'awaiting-explore') {
    text = '⚡ 轮到你 · 确认探查结果'
    tone = 'you'
  } else if (phase === 1) {
    text = '📤 轮到你 · 上传教材（开始转换后 AI 会自动接手）'
    tone = 'you'
  } else if (pendingStage !== null && pendingStage !== undefined) {
    text = `🤖 AI 干活中 · ${metaLabel ?? ''}${progressDetail ? `　⏳ ${progressDetail}` : ''}`
    tone = 'ai'
  } else {
    text = '🤖 AI 正在准备下一步…'
    tone = 'ai'
  }
  const bg = {
    ok: 'var(--dsw-success-soft, #dafbe1)',
    you: 'var(--dsw-warn-soft, #fff8e1)',
    ai: 'var(--dsw-accent-soft, #eef2ff)',
    error: 'var(--dsw-danger-soft, #ffebe9)',
    normal: 'transparent',
  }[tone]
  const border = {
    ok: '#1a7f37', you: '#d4a72c', ai: 'var(--dsw-accent, #4f6ef7)', error: 'var(--dsw-danger, #cf222e)', normal: 'transparent',
  }[tone]
  return createElement('div', {
    style: {
      borderRadius: '8px', padding: '8px 12px', margin: '0 0 10px', fontSize: '13px',
      background: bg, border: `1px solid ${border}`, fontWeight: 600,
    },
  }, text)
}

// ── 主 AI 活性行（F17）：AI 回合进行中 / 账面 N 分钟没动静[戳一下 AI] / 等你拍板 ─────

export function ActivityLine(props) {
  const { meta, aiActive, onNudge, subagents } = props
  const staleMs = meta != null ? Date.now() - (meta.updatedAt ?? 0) : 0
  // F35（2026-08-20 走查）：聚合主会话的审计/写作子代理状态——running=在跑、inactive=完成待收；
  // 对应为 0 不显示，全 0 不显示聚合行（不打扰既有活性行）。
  const agg = { running: 0, inactive: 0, ...(subagents ?? {}) }
  const aggText = [
    agg.running > 0 ? `🔎 ${agg.running} 个审计在跑` : null,
    agg.inactive > 0 ? `📥 ${agg.inactive} 个完成待收` : null,
  ].filter(Boolean).join(' · ')
  const content = aiActive
    ? '🤖 AI 回合进行中'
    : meta?.status === 'running'
      ? createElement('span', null,
          `⏱ 账面 ${Math.round(staleMs / 60000)} 分钟没动静 `,
          createElement('button', {
            style: S.smallLink,
            onClick: onNudge,
            title: '给主 AI 发一条催办 notice（不打断它手里的活、不取消）',
          }, '[戳一下 AI]'))
      : '⚡ 等你拍板/确认'
  return createElement('div', {
    style: { margin: '0 0 10px', fontSize: '12px', opacity: 0.85, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  },
    aggText !== ''
      ? createElement('span', { style: { fontWeight: 600, color: '#0969da' } }, aggText)
      : null,
    content)
}

// ── 不打断提示条（F17）：铺章中提交风格线/留言/意见成功后，焦点区顶部滑入、6 秒自清 ──

export function InterruptNote(props) {
  return createElement('div', {
    role: 'status',
    style: {
      position: 'sticky', top: 0, zIndex: 20, margin: '0 0 10px',
      padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
      background: 'var(--dsw-accent-soft, #eef2ff)', border: '1px solid var(--dsw-accent, #4f6ef7)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '8px',
    },
  },
    createElement('span', { style: { flex: 1 } }, '💡 已记下；不打断正在写的这一章，AI 到下个停靠点会照办'),
    createElement('button', { style: S.smallLink, onClick: props.onClose }, '✕'),
  )
}

// ── 自动跟随横幅（F5/Task 20 方案 A）：等拍板回现在 / AI 干活跳过去 ─────────────

// 顶部滑入动画（横幅共用，一次定义到处引用）。
const AUTO_FOLLOW_KEYFRAMES = '@keyframes dsh-auto-follow-in { from { transform: translateY(-10px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }'
// 横幅共用样式：粘顶（内容滚它不滚）、顶部滑入、与 F17 不打断提示条同一视觉语言。
const AUTO_FOLLOW_BANNER_STYLE = {
  position: 'sticky', top: 0, zIndex: 20, margin: '0 0 10px',
  padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
  background: 'var(--dsw-accent-soft, #eef2ff)', border: '1px solid var(--dsw-accent, #4f6ef7)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '8px',
  animation: 'dsh-auto-follow-in 0.25s ease',
}

// 等拍板横幅：AI 进入 awaiting-* 且你正在翻历史时强制切回「现在」并亮这一条（6 秒自清由 WorkbenchView 定时器负责）。
export function AutoFollowAwaitNote(props) {
  return createElement('div', { role: 'status', style: AUTO_FOLLOW_BANNER_STYLE },
    createElement('style', null, AUTO_FOLLOW_KEYFRAMES),
    createElement('span', { style: { flex: 1 } }, '⚡ AI 在等你拍板，已切回现在'),
    createElement('button', { style: S.smallLink, onClick: props.onClose }, '✕'),
  )
}

// AI 干活跳过去横幅：浏览历史时 AI 出了新进展，整条可点（点击清浏览、回「现在」）。
export function AutoFollowProgressNote(props) {
  const onDismiss = props.onDismiss ?? (() => {})
  return createElement('div', {
    role: 'status',
    style: { ...AUTO_FOLLOW_BANNER_STYLE, cursor: 'pointer' },
    onClick: props.onJump,
  },
    createElement('style', null, AUTO_FOLLOW_KEYFRAMES),
    createElement('span', { style: { flex: 1 } }, '▶ AI 正在干活--点此跳过去'),
    createElement('button', {
      style: S.smallLink,
      onClick: (e) => { e.stopPropagation(); onDismiss() },
    }, '✕'),
  )
}

// ── 探查结果确认卡（探源 → 用户看一眼再继续） ───────────────────────────────

// 知识点难度 → 颜色（让清单一眼可扫）。
const DIFF_COLORS = { '基础': '#1a7f37', '重点': '#9a6700', '难点': '#cf222e', '进阶': '#8250df' }
// 重做探查的预置理由（点选即用，不用打字）。
const RE_EXPLORE_REASONS = ['有的材料没读全', '知识点整理得太粗', '章节建议不合理', '重点难点判断不对']

// F30（2026-08-20 走查）：源探查报告（work/explore.md）的 md 最小渲染。
// 按空行切段：`## ` 开头当标题（renderInline 自带加粗样式），普通段用正文流式排版
// （READER_PARA_STYLE），`- ` 列表行由 renderInline 转成带项目符号的块。
// 恒返回节点数组，可直接 ... 展开成 createElement 的 children；空/异常输入返回空数组。
export function exploreReportBlocks(mdText) {
  const paras = splitParagraphs(mdText)
  const blocks = []
  for (const para of paras) {
    blocks.push(
      /^#{1,2}\s+/.test(para)
        ? createElement('div', { key: blocks.length, style: { margin: '0 0 0.6em' } }, ...renderInline(para))
        : createElement('p', { key: blocks.length, style: READER_PARA_STYLE }, ...renderInline(para)),
    )
  }
  return blocks
}

export function ExploreConfirmCard(props) {
  const { exploreSummary, meta, project, session, onConfirm, onViewReport, busy, reportText } = props
  const sum = exploreSummary ?? {}
  const focus = Array.isArray(sum.teachingFocus) ? sum.teachingFocus : []
  const [showPoints, setShowPoints] = useState(false)
  const [showSections, setShowSections] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [reasons, setReasons] = useState([])
  const [rejectNote, setRejectNote] = useState('')
  // 知识地图（work/knowledge-map.json）通过现有文件接口读取并渲染成可读清单，
  // 让用户真正"看到"AI 从材料里整理出了什么，而不只是几个数字。
  const [km, setKm] = useState(null)
  useEffect(() => {
    let alive = true
    setKm(null)
    if (project === null || project === undefined) return undefined
    fetch(`/textbook/file?session=${encodeURIComponent(session)}&project=${encodeURIComponent(project)}&path=${encodeURIComponent('work/knowledge-map.json')}`)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((text) => {
        const parsed = JSON.parse(text)
        if (alive) setKm(parsed)
      })
      .catch(() => { /* 读取失败不影响确认卡；展示不了清单也不阻塞流程 */ })
    return () => { alive = false }
  }, [project, session])
  // F30（2026-08-20 走查）：源探查报告（work/explore.md）默认置顶展示。
  // 有 reportText（父级/测试注入）直接用（含首次渲染）；否则按上面 knowledge-map 的
  // 同一方式拉取，读取失败不抛错、报告为空也不影响卡片其余功能（优雅降级）。
  const [report, setReport] = useState(() => (typeof reportText === 'string' && reportText !== '' ? reportText : null))
  useEffect(() => {
    let alive = true
    if (typeof reportText === 'string' && reportText !== '') {
      setReport(reportText)
      return undefined
    }
    setReport(null)
    if (project === null || project === undefined) return undefined
    fetch(`/textbook/file?session=${encodeURIComponent(session)}&project=${encodeURIComponent(project)}&path=${encodeURIComponent('work/explore.md')}`)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((text) => { if (alive) setReport(text) })
      .catch(() => { /* 报告读不到就不显示报告区，不打断确认流程 */ })
    return () => { alive = false }
  }, [project, session, reportText])
  const reportBlocks = report !== null && report !== '' ? exploreReportBlocks(report) : []
  const kps = Array.isArray(km?.knowledgePoints) ? km.knowledgePoints : []
  const chapters = Array.isArray(km?.chapterSuggestion) ? km.chapterSuggestion : []
  const sections = Array.isArray(km?.materials) ? km.materials : []
  const sectionTitles = (material) => (Array.isArray(material?.sections) ? material.sections.map((s) => String(s?.title ?? '')).filter((t) => t !== '') : [])
  const toggleReason = (reason) => {
    setReasons((prev) => prev.includes(reason) ? prev.filter((item) => item !== reason) : [...prev, reason])
  }
  const cancelReject = () => { setRejecting(false); setReasons([]); setRejectNote('') }

  return createElement('div', { style: S.focus },
    reportBlocks.length > 0
      ? createElement('div', { style: { ...S.card, marginBottom: '10px' } },
          createElement('p', { style: { margin: '0 0 6px', fontSize: '12px', opacity: 0.8 } },
            '📋 源探查报告（AI 通读后的完整记录）：'),
          ...reportBlocks,
        )
      : null,
    createElement('strong', { style: { fontSize: '14px' } }, '🔍 源探查做完了！'),
    createElement('p', { style: { margin: '6px 0' } },
      `AI 已通读你的教材，整理出：来源材料 ${sum.sources ?? 0} 份 · 知识点 ${sum.knowledgePoints ?? 0} 个 · 建议分 ${sum.chapterSuggestion ?? 0} 章。`),
    focus.length > 0
      ? createElement('div', { style: { margin: '4px 0 8px', padding: '8px 10px', background: 'var(--dsw-surface, #fff)', borderRadius: '8px', border: '1px solid var(--dsw-border, #d0d7de)' } },
          createElement('p', { style: { margin: '0 0 4px', fontSize: '12px', opacity: 0.8 } }, 'AI 判断的重点/难点：'),
          focus.map((item, index) => createElement('div', { key: index, style: { fontSize: '12px', margin: '2px 0' } }, `· ${item}`)),
        )
      : null,
    chapters.length > 0
      ? createElement('div', { style: { margin: '4px 0 8px', padding: '8px 10px', background: 'var(--dsw-surface, #fff)', borderRadius: '8px', border: '1px solid var(--dsw-border, #d0d7de)' } },
          createElement('p', { style: { margin: '0 0 4px', fontSize: '12px', opacity: 0.8 } }, '📚 AI 建议的章节安排（后续可再调）：'),
          chapters.map((chapter, index) =>
            createElement('div', { key: index, style: { fontSize: '12px', margin: '2px 0' } },
              `${index + 1}. ${chapter.title ?? ''}`,
              chapter.source !== undefined && chapter.source !== '' && chapter.source !== null
                ? createElement('span', { style: { opacity: 0.6 } }, `　← ${chapter.source}`)
                : null,
            ),
          ),
        )
      : null,
    kps.length > 0
      ? createElement('div', { style: { margin: '4px 0 8px' } },
          createElement('button', { style: S.smallLink, onClick: () => setShowPoints(!showPoints) },
            showPoints ? `▾ 收起知识点清单（${kps.length} 个）` : `▸ 知识点清单（${kps.length} 个，点开看）`),
          showPoints
            ? createElement('div', { style: { marginTop: '6px', padding: '8px 10px', background: 'var(--dsw-surface, #fff)', borderRadius: '8px', border: '1px solid var(--dsw-border, #d0d7de)' } },
                kps.map((point, index) =>
                  createElement('div', { key: index, style: { fontSize: '12px', margin: '2px 0' } },
                    `· ${point.title ?? ''}`,
                    point.difficulty !== undefined && point.difficulty !== '' && point.difficulty !== null
                      ? createElement('span', { style: { color: DIFF_COLORS[point.difficulty] ?? '#57606a' } }, `（${point.difficulty}）`)
                      : null,
                    point.source !== undefined && point.source !== '' && point.source !== null
                      ? createElement('span', { style: { opacity: 0.5 } }, ` ${point.source}`)
                      : null,
                  ),
                ),
              )
            : null,
        )
      : null,
    sections.length > 0
      ? createElement('div', { style: { margin: '4px 0 8px' } },
          createElement('button', { style: S.smallLink, onClick: () => setShowSections(!showSections) },
            showSections ? '▾ 收起每本材料里读到的小节' : '▸ 每本材料里读到的小节（点开看）'),
          showSections
            ? createElement('div', { style: { marginTop: '6px', padding: '8px 10px', background: 'var(--dsw-surface, #fff)', borderRadius: '8px', border: '1px solid var(--dsw-border, #d0d7de)' } },
                sections.map((material, index) => {
                  const titles = sectionTitles(material)
                  return createElement('div', { key: index, style: { fontSize: '12px', margin: '2px 0' } },
                    `资料${material?.num ?? index + 1}：`,
                    createElement('span', { style: { opacity: 0.8 } }, titles.join(' / ') || '（未读到小节标题）'),
                  )
                }),
              )
            : null,
        )
      : null,
    createElement('p', { style: { margin: '0 0 8px', fontSize: '12px', opacity: 0.75 } },
      '这是后面所有设计的基础。满意就继续；不满意点「重做」，勾个理由或写一句哪里不满意，AI 会照着改（不填也能重做）。'),
    rejecting
      ? createElement('div', { style: { marginTop: '10px', borderTop: '1px dashed var(--dsw-border, #d0d7de)', paddingTop: '8px' } },
          createElement('p', { style: { margin: '0 0 6px', fontWeight: 600 } }, '哪里不满意？（点选或写一句，10 秒内搞定）'),
          createElement('div', { style: { margin: '6px 0' } },
            RE_EXPLORE_REASONS.map((reason) =>
              createElement('label', { key: reason, style: S.checkItem },
                createElement('input', { type: 'checkbox', checked: reasons.includes(reason), onChange: () => toggleReason(reason) }),
                ` ${reason}`)),
          ),
          createElement('textarea', {
            style: S.textarea,
            placeholder: '想多说一句？在这里写（可选）',
            value: rejectNote,
            onChange: (e) => setRejectNote(e.target.value),
          }),
          createElement('div', { style: { marginTop: '8px', display: 'flex', gap: '8px' } },
            createElement('button', {
              style: S.bigBtn(false),
              onClick: () => onConfirm(false, { reasons, note: rejectNote }),
              disabled: busy,
            }, '🔁 就这样重做'),
            createElement('button', { style: { ...S.smallLink, textDecoration: 'none' }, onClick: cancelReject }, '取消')),
        )
      : createElement('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
          createElement('button', { style: S.bigBtn(true), onClick: () => onConfirm(true), disabled: busy }, '✅ 满意，继续设计'),
          createElement('button', { style: { ...S.bigBtn(true), background: 'transparent', color: 'var(--dsw-danger, #cf222e)' }, onClick: () => setRejecting(true), disabled: busy }, '🔁 让 AI 重做'),
          createElement('button', { style: { ...S.smallLink, textDecoration: 'none' }, onClick: onViewReport, disabled: busy }, '👀 看完整报告'),
        ),
  )
}

// ── 章节安排确认卡（D1 人审：awaiting-outline 时的焦点区） ─────────────────────

export function OutlineConfirmCard(props) {
  const { meta, busy, onConfirm } = props
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const chapters = meta?.outline?.chapters ?? []
  const totalWords = chapters.reduce((sum, chapter) => sum + (Number.isFinite(chapter?.targetWords) ? chapter.targetWords : 0), 0)
  // 样例章：默认取旧账本兜底 meta.goldChapter ?? 1；用户可改选（只对确认生效）。
  const [goldPick, setGoldPick] = useState(() => {
    const initial = Number(meta?.goldChapter ?? 1)
    return Number.isSafeInteger(initial) && initial >= 1 && initial <= chapters.length ? initial : 1
  })
  const goldReason = typeof meta?.goldChapterReason === 'string' ? meta.goldChapterReason : ''
  const safePick = Number.isSafeInteger(Number(goldPick)) && Number(goldPick) >= 1 && Number(goldPick) <= chapters.length
    ? Number(goldPick) : 1

  return createElement('div', { style: S.focus },
    createElement('strong', { style: { fontSize: '14px' } }, '📐 章节安排出来了！'),
    createElement('p', { style: { margin: '6px 0' } },
      `AI 计划把这本书分成 ${chapters.length} 章${totalWords > 0 ? `，全书大约 ${totalWords} 字` : ''}。每章标好了用材料的哪一块、覆盖哪些知识点、大概写多长。满意点「通过」，AI 先写最佳范例章（第 ${safePick} 章当全书样板）给你过目；要调就点「提改进方向」。`),
    createElement('div', { style: { margin: '4px 0 8px', padding: '8px 10px', background: 'var(--dsw-surface, #fff)', borderRadius: '8px', border: '1px solid var(--dsw-border, #d0d7de)' } },
      chapters.map((chapter, index) => {
        // F38（2026-08-20 走查）：每章源材料索引措辞——「源：」前缀 + 「覆盖知识点 N 个」（N=points 数组长度）。
        const pointsArr = Array.isArray(chapter?.points)
          ? chapter.points.map((pt) => String(pt ?? '').trim()).filter((pt) => pt !== '')
          : []
        const points = pointsArr.join(' / ')
        const volumeReason = typeof chapter?.volumeReason === 'string' ? chapter.volumeReason : ''
        return createElement('div', { key: index, style: { fontSize: '12px', margin: '4px 0' } },
          `${index + 1}. ${chapter.title ?? ''}`,
          chapter.outline !== undefined && chapter.outline !== '' && chapter.outline !== null
            ? createElement('span', { style: { opacity: 0.6 } }, `　${chapter.outline}`)
            : null,
          createElement('div', { style: { opacity: 0.6, margin: '1px 0 0' } },
            [
              chapter.source !== undefined && chapter.source !== '' && chapter.source !== null ? `源：${chapter.source}` : null,
              Number.isFinite(chapter.targetWords) ? `约 ${chapter.targetWords} 字` : null,
            ].filter(Boolean).join(' · '),
          ),
          pointsArr.length > 0
            ? createElement('div', { style: { opacity: 0.6, margin: '1px 0 0' } }, `覆盖知识点 ${pointsArr.length} 个${points !== '' ? `：${points}` : ''}`)
            : null,
          volumeReason !== ''
            ? createElement('div', { style: { opacity: 0.5, fontSize: '11px', margin: '1px 0 0' } }, `体量依据：${volumeReason}`)
            : null,
        )
      }),
    ),
    createElement('div', { style: { margin: '4px 0 10px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' } },
      createElement('span', { style: { fontSize: '12px' } },
        `📐 AI 建议用第 ${safePick} 章当样例章：${goldReason !== '' ? goldReason : '（未给理由）'}`),
      chapters.length > 1
        ? createElement('select', {
            style: { fontSize: '12px', padding: '2px 4px', borderRadius: '6px', border: '1px solid var(--dsw-border, #d0d7de)', background: 'var(--dsw-surface, #fff)' },
            value: safePick,
            onChange: (e) => setGoldPick(Number(e.target.value)),
            disabled: busy,
          }, chapters.map((chapter, index) =>
            createElement('option', { key: index, value: index + 1 }, `${index + 1}. ${chapter.title ?? ''}`)))
        : null,
      chapters.length > 1
        ? createElement('span', { style: { fontSize: '11px', opacity: 0.6 } }, '（可改选）')
        : null,
    ),
    rejecting
      ? createElement('div', { style: { marginTop: '10px', borderTop: '1px dashed var(--dsw-border, #d0d7de)', paddingTop: '8px' } },
          createElement('p', { style: { margin: '0 0 6px', fontWeight: 600 } }, '改哪里？写一句（比如：第3章拆成两章 / 每章字数太多）'),
          createElement('textarea', {
            style: S.textarea,
            placeholder: '想怎么调，写在这里（可不填，AI 会自己重新安排）',
            value: note,
            onChange: (e) => setNote(e.target.value),
          }),
          createElement('div', { style: { marginTop: '8px', display: 'flex', gap: '8px' } },
            createElement('button', {
              style: S.bigBtn(false),
              onClick: () => onConfirm(false, note.trim()),
              disabled: busy,
            }, '🔁 就这样重新安排'),
            createElement('button', { style: { ...S.smallLink, textDecoration: 'none' }, onClick: () => { setRejecting(false); setNote('') }, disabled: busy }, '取消'),
          ),
        )
      : createElement('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
          createElement('button', { style: S.bigBtn(true), onClick: () => onConfirm(true, note, safePick), disabled: busy }, '✅ 通过，开始写范例章'),
          createElement('button', { style: { ...S.bigBtn(true), background: 'transparent', color: 'var(--dsw-danger, #cf222e)' }, onClick: () => setRejecting(true), disabled: busy }, '🔁 提改进方向'),
        ),
  )
}

// ── 章节清单卡（铺章阶段 · 人+AI 协同抽查面板） ───────────────────────────────

export function chapterBadge(row, pendingReviews, doneSet, pipelineStage) {
  // 章级徽章（F17 四态 + F35 五态）：优先级 doneSet（agent-end 含「完成」+第N章，F40 语义最高，
  // 防「写第N章」「自查第N章」提前标完成）→ 主 AI 上报的流水线阶段（chapterPipeline）→ 旧四态账本推导兜底。
  const hasReview = (pendingReviews ?? []).some((r) => Number(r.chapter) === Number(row.n))
  if (doneSet.has(row.n)) {
    return hasReview ? { icon: '📝', text: '有意见待 AI 修订', tone: '#cf222e' } : { icon: '🛡️', text: '写完·审过·AI 把过关', tone: '#1a7f37' }
  }
  // F35（2026-08-20 走查）：主 AI 经 progress 动作上报的章级流水线阶段；demo/旧账本为 null → 回退四态。
  if (pipelineStage === 'writing') return { icon: '⏳', text: '执笔中', tone: '#e3b341' }
  if (pipelineStage === 'auditing') return { icon: '🔍', text: '审计中', tone: '#0969da' }
  if (pipelineStage === 'audited') return { icon: '🔎', text: '审计完成，等 AI 终审', tone: '#0969da' }
  if (pipelineStage === 'finalizing') return { icon: '👁', text: 'AI 终审中', tone: '#57606a' }
  if (pipelineStage === 'done') {
    return hasReview ? { icon: '📝', text: '有意见待 AI 修订', tone: '#cf222e' } : { icon: '🛡️', text: '写完·审过·AI 把过关', tone: '#1a7f37' }
  }
  if (row.written && row.audited) return { icon: '👁', text: 'AI 终审中', tone: '#57606a' }
  if (row.written) return { icon: '🔍', text: '写好了，审计中', tone: '#0969da' }
  return { icon: '⏳', text: '执笔中', tone: '#e3b341' }
}

// 已完成的章（纯账本推导）：events 里「AI 完成某章」的 agent-end 事件（label 含 第N章）。
// F40（2026-08-20 走查）收紧：label 必须同时含「完成」，「写第N章」「自查第N章」这类
// 中间事件不再提前把章标成完成。抽成纯函数便于冒烟直接断言。
export function deriveDoneSet(events) {
  const set = new Set()
  for (const event of events ?? []) {
    if (event.type !== 'textbook/agent-end') continue
    const label = String(event.data?.label ?? '')
    // F40（2026-08-20 走查）：label 必须同时含「完成」，否则「写第N章」「自查第N章」
    // 这类中间事件会把章提前标成完成。
    if (!label.includes('完成')) continue
    const match = /第(\d+)章/.exec(label)
    if (match !== null) set.add(Number(match[1]))
  }
  return set
}

export function ChaptersCard(props) {
  const { meta, chapterStatus, pendingReviews, progressDetail, onView, onReview, busy, reviewMode, onApproveAll, events, workFiles, project, session, postAction, initialOpenChapter, chapterTextOverride } = props
  const [reviewing, setReviewing] = useState(null)
  const [comment, setComment] = useState('')
  // F39（2026-08-20 走查）：过目态「看看这章」内联展开——openChapter 记当前点开的章号，
  // 正文经文件接口拉取（initialOpenChapter / chapterTextOverride 仅供测试注入，生产不传）。
  const [openChapter, setOpenChapter] = useState(() => (Number.isSafeInteger(initialOpenChapter) && initialOpenChapter >= 1 ? initialOpenChapter : null))
  const [chapterText, setChapterText] = useState(null)
  const [chapterError, setChapterError] = useState(null)
  useEffect(() => {
    let alive = true
    setChapterText(null)
    setChapterError(null)
    if (openChapter === null || openChapter === undefined) return undefined
    if (project === null || project === undefined) return undefined
    const rel = `work/chapter-${String(openChapter).padStart(2, '0')}.md`
    fetch(`/textbook/file?session=${encodeURIComponent(session)}&project=${encodeURIComponent(project)}&path=${encodeURIComponent(rel)}`)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((text) => { if (alive) setChapterText(text) })
      .catch((err) => { if (alive) setChapterError(String(err instanceof Error ? err.message : err)) })
    return () => { alive = false }
  }, [openChapter, project, session])
  const rows = (meta?.outline?.chapters ?? []).map((chapter, index) => {
    const found = (chapterStatus ?? []).find((row) => Number(row.n) === index + 1)
    // F38（2026-08-20 走查）：源材料索引的「源」优先取后端账本 chapterStatus 的实际来源，
    // 为空时回退到确认过的大纲 plan（chapter.source），保证每章都有可读的源出处。
    const foundSource = found != null ? (found.source ?? '') : ''
    return {
      n: index + 1,
      title: found?.title ?? chapter.title ?? `第${index + 1}章`,
      source: foundSource !== '' ? foundSource : (chapter.source ?? ''),
      // F38（2026-08-20 走查）：每章「源材料索引」的覆盖知识点与体量依据，取自确认过的大纲。
      points: Array.isArray(chapter?.points)
        ? chapter.points.map((pt) => String(pt ?? '').trim()).filter((pt) => pt !== '')
        : [],
      volumeReason: typeof chapter?.volumeReason === 'string' ? chapter.volumeReason : '',
      written: found?.written === true || (chapterStatus ?? []).length === 0,
      audited: found?.audited === true || (chapterStatus ?? []).length === 0,
    }
  })
  // 已完成的章（纯账本推导）：events 里「AI 完成某章」的 agent-end 事件（label 含 第N章）。
  const doneSet = useMemo(() => deriveDoneSet(events), [events])
  // 「看看这章」置灰：chapter 文件不在产物清单里就禁用（旧账本/未拉取时 ?? 兜底不误灰）。
  const hasChapterFile = (n) => {
    const files = workFiles ?? []
    if (files.length === 0) return true
    return files.some((f) => f.path === `work/chapter-${String(n).padStart(2, '0')}.md`)
  }
  const done = rows.filter((row) => row.written && row.audited).length
  const prepared = (chapterStatus ?? []).length > 0

  const sendReview = (n) => {
    if (comment.trim() === '') return
    void onReview(n, comment.trim()).then(() => { setReviewing(null); setComment('') })
  }

  return createElement('div', { style: S.focus },
    reviewMode
      ? createElement('div', { style: { margin: '0 0 10px', padding: '8px 10px', borderRadius: '8px', background: 'var(--dsw-accent-soft, #eef2ff)' } },
          createElement('strong', null, '📚 全部章节写好了，请你过目'),
          createElement('p', { style: { margin: '4px 0', fontSize: '12px', opacity: 0.8 } },
            '想细看点「看看这章」；有意见直接写，AI 照改；都满意就交工合并。'),
          createElement('button', { style: S.bigBtn(true), onClick: onApproveAll, disabled: busy }, '✅ 都过了，交工'),
        )
      : null,
    createElement('strong', { style: { fontSize: '14px' } }, '📚 铺章 · 章节清单'),
    createElement('p', { style: { margin: '4px 0 8px', fontSize: '12px', opacity: 0.75 } },
      `每章流程：小助手执笔 → 小助手审计 → AI 最后把关。已完成 ${done}/${rows.length} 章；你随时可以"看看这章"并写意见，AI 会照意见修订。`),
    progressDetail !== null && progressDetail !== undefined && progressDetail !== ''
      ? createElement('div', { style: { margin: '0 0 8px', padding: '6px 10px', borderRadius: '8px', background: 'var(--dsw-accent-soft, #eef2ff)', fontSize: '12px' } },
          `🤖 ${progressDetail}`)
      : null,
    rows.map((row) => {
      // F35：主 AI 上报的章级流水线阶段（meta.chapterPipeline[n-1]={stage,updatedAt}；旧账本兜底 null → 四态回退）。
      const pipelineStage = (meta?.chapterPipeline ?? [])[row.n - 1]?.stage ?? null
      const badge = chapterBadge(row, pendingReviews, doneSet, pipelineStage)
      const open = reviewing === row.n
      const fileMissing = !hasChapterFile(row.n)
      // F39：过目态点「看看这章」= 内联展开（openChapter），正文渲染在该章卡片正下方；
      // 非过目态保持原行为（onView → 父级底部查看器）。
      const chapterOpen = reviewMode && openChapter === row.n
      // 该章已挂的段落级意见（chapter 维度、未撤销）：喂给 GoldReader 标段与两态键。
      const rowOpinions = (pendingReviews ?? []).filter((r) => Number(r.chapter) === Number(row.n) && r.kind != null && r.status !== 'revoked')
      const shownText = typeof chapterTextOverride === 'string' && chapterTextOverride !== '' ? chapterTextOverride : chapterText
      // F38（2026-08-20 走查）：每章「源材料索引」——源：用哪本材料哪部分 · 覆盖知识点 N 个 · 体量依据。
      // 字段缺失就不显示对应段；全缺则整行不渲染。
      const sourceIndex = [
        row.source !== undefined && row.source !== '' && row.source !== null ? `源：${row.source}` : null,
        row.points.length > 0 ? `覆盖知识点 ${row.points.length} 个` : null,
        row.volumeReason !== '' ? `体量依据：${row.volumeReason}` : null,
      ].filter(Boolean).join(' · ')
      return createElement('div', {
        key: row.n,
        style: { margin: '6px 0', padding: '8px 10px', background: 'var(--dsw-surface, #fff)', borderRadius: '8px', border: '1px solid var(--dsw-border, #d0d7de)' },
      },
        createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } },
          createElement('span', { style: { flex: 1, fontSize: '13px', fontWeight: 600 } }, `第 ${row.n} 章《${row.title}》`),
          !prepared
            ? createElement('span', { style: { fontSize: '12px', color: badge.tone } }, `${badge.icon} 准备中`)
            : createElement('span', { style: { fontSize: '12px', color: badge.tone } }, `${badge.icon} ${badge.text}`),
        ),
        sourceIndex !== ''
          ? createElement('div', { style: { margin: '2px 0 0', fontSize: '11px', opacity: 0.6 } }, sourceIndex)
          : null,
        createElement('div', { style: { marginTop: '6px', display: 'flex', gap: '10px', alignItems: 'center' } },
          createElement('button', {
            style: S.smallLink,
            onClick: () => {
              if (reviewMode) { setOpenChapter(chapterOpen ? null : row.n); setChapterText(null); setChapterError(null) }
              else onView(row.n)
            },
            disabled: fileMissing,
            title: fileMissing ? '这一章还没写出来（或文件改名了），暂时看不了' : undefined,
          }, chapterOpen ? '收起' : '👀 看看这章'),
          prepared
            ? createElement('button', {
                style: S.smallLink,
                onClick: () => { setReviewing(open ? null : row.n); setComment('') },
              }, open ? '收起' : '✍️ 写意见')
            : null,
        ),
        open
          ? createElement('div', { style: { marginTop: '6px' } },
              createElement('textarea', {
                style: S.textarea,
                placeholder: '你对这章的意见（比如：例子太难、多给几道练习、风格换成更口语）',
                value: comment,
                onChange: (e) => setComment(e.target.value),
              }),
              createElement('button', { style: { ...S.bigBtn(true), padding: '6px 14px' }, onClick: () => sendReview(row.n), disabled: busy || comment.trim() === '' }, '把意见交给 AI 修订'))
          : null,
        // F39：过目态内联展开——章正文 md 渲染（GoldReader 的段落流式排版 + renderInline），
        // 段落旁复用 GoldReader 段级三键（😕/🗑/✏️），意见走 gold-opinion 带 chapter 落 pendingReviews。
        chapterOpen
          ? createElement('div', { style: { marginTop: '8px', borderTop: '1px dashed var(--dsw-border, #d0d7de)', paddingTop: '8px' } },
              chapterError !== null
                ? createElement('p', { style: S.error }, `打开失败：${chapterError}`)
                : shownText === null
                  ? createElement('p', { style: S.hint }, '加载中…')
                  : createElement('div', null,
                      createElement('p', { style: { margin: '0 0 6px', fontSize: '12px', opacity: 0.75 } },
                        `第 ${row.n} 章正文（鼠标停在哪一段，那段右侧亮出 😕🗑✏️ 提意见）：`),
                      createElement(GoldReader, {
                        text: shownText,
                        opinions: rowOpinions,
                        busy,
                        onOpinion: (kind, wish, para, hint) => {
                          if (postAction === undefined) return
                          void postAction({ action: 'gold-opinion', kind, wish, ...(para !== null ? { para } : {}), ...(hint ? { hint } : {}), chapter: row.n })
                        },
                        onRevokeOpinion: (id) => {
                          if (postAction === undefined) return
                          void postAction({ action: 'gold-opinion-revoke', id })
                        },
                      }),
                    ),
            )
          : null,
      )
    }),
    createElement('p', { style: { margin: '8px 0 0', fontSize: '12px', opacity: 0.7 } },
      '📌 每章都自动存档，之后随时能回退到任意拍板点。'),
  )
}

// ── 过程地图（左竖栏：全书分段，历史灰/当前亮/未来虚；点击=焦点区切浏览视图） ──

function segState(segments, key) { return segments.find((s) => s.key === key)?.status ?? 'pending' }

export function ProcessMapRail(props) {
  const { segments, status, browsingKey, onSelect } = props
  // 邀请码可点复制：整卡是链接会跳转，代码块单独拦下来复制、不跳转（2026-08-21）。
  const [copied, setCopied] = useState(false)
  const copyInvite = (e, code) => {
    e.preventDefault()
    e.stopPropagation()
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1600) }
    const fallback = () => {
      try {
        const ta = document.createElement('textarea')
        ta.value = code
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        done()
      } catch { done() }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText !== undefined) {
      navigator.clipboard.writeText(code).then(done, fallback)
    } else {
      fallback()
    }
  }
  const row = (seg) => {
    const state = seg.status
    const isCurrent = browsingKey === seg.key
    return createElement('button', {
      key: seg.key,
      style: {
        display: 'block', width: '100%', textAlign: 'left', padding: '5px 8px', margin: '2px 0',
        fontSize: '12px', borderRadius: '6px', cursor: 'pointer',
        background: isCurrent ? 'var(--dsw-accent-soft, #eef2ff)'
          : state === 'active' ? 'var(--dsw-surface, #fff)'
          : state === 'waiting-user' ? '#fff8e6' : 'transparent',
        opacity: state === 'pending' ? 0.45 : state === 'done' ? 0.75 : 1,
        border: state === 'waiting-user' ? '1px solid #e3b341' : '1px solid transparent',
        color: 'inherit',
      },
      onClick: () => onSelect(seg.key),
      title: state === 'waiting-user' ? '在等你拍板/确认' : state === 'active' ? '正在做' : state === 'done' ? '已完成，点开回看' : '还没到这一步',
    },
      `${state === 'waiting-user' ? '⚡' : state === 'done' ? '·' : state === 'active' ? '▶' : '○'} ${seg.label}`,
      seg.status === 'waiting-user' ? '（轮到你）' : '',
    )
  }
  return createElement('div', { style: { width: '220px', flexShrink: 0, borderRight: '1px solid var(--dsw-border, #d0d7de)', padding: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' } },
    createElement('div', { style: { flex: 1, minHeight: 0, overflowY: 'auto' } },
      createElement('p', { style: { margin: '0 0 6px', fontSize: '12px', opacity: 0.7 } }, '🗺 过程地图（点任意一步回看/定点修改）'),
      ...(segments ?? []).map(row),
      createElement('p', { style: { margin: '8px 0 0', fontSize: '11px', opacity: 0.55 } }, '⚡=在等你 · ▶=正在做 · ·=已完成'),
    ),
    // 破卷常驻广告（2026-08-21 需求）：醒目好看、整块可点，造书进程中始终可见。
    createElement('a', {
      href: 'https://www.socratopia.app/r/SCR-FEJXMQ',
      target: '_blank',
      rel: 'noopener noreferrer',
      // F43（2026-08-20）：广告卡 flexShrink:0 常驻 rail 底部，地图滚动只滚自己的滚动条。
      style: {
        display: 'block', marginTop: '6px', padding: '10px 10px 9px', borderRadius: '10px',
        flexShrink: 0,
        background: 'linear-gradient(135deg, #4f6ef7 0%, #7a5cff 55%, #c04df7 100%)',
        color: '#ffffff', fontSize: '11px', lineHeight: 1.55, textDecoration: 'none',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 3px 10px rgba(79, 110, 247, 0.35)',
      },
    },
      createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' } },
        createElement('span', { style: { fontSize: '16px' } }, '📚'),
        createElement('strong', { style: { fontSize: '13px' } }, '【破卷】'),
        createElement('span', { style: { fontSize: '10px', background: 'rgba(255,255,255,0.22)', borderRadius: '4px', padding: '0 5px', lineHeight: '15px' } }, '衍生项目'),
      ),
      createElement('div', null, '把造好的书交给【破卷】'),
      createElement('div', null, '3A 沉浸感 · 3 倍学习效率'),
      createElement('div', { style: { marginTop: '5px', fontSize: '10px' } },
        '填邀请码 ',
        createElement('span', {
          onClick: (e) => copyInvite(e, 'SCR-FEJXMQ'),
          title: copied ? '已复制' : '点击复制邀请码',
          style: { background: 'rgba(255,255,255,0.28)', borderRadius: '5px', padding: '1px 6px', letterSpacing: '0.5px', cursor: 'pointer', userSelect: 'all' },
        }, copied ? '✓ 已复制' : 'SCR-FEJXMQ'),
        ' 领 100 万 tokens →'),
    ),
  )
}

// ── 历史浏览与定点修改（深改入口；数据来自 /textbook/process） ───────────────

export function HistoryBrowser(props) {
  const { segment, meta, onDeepModify, onDeepUndo, busy } = props
  const [confirming, setConfirming] = useState(false)
  const [note, setNote] = useState('')
  const undoable = meta?.lastDeepModify != null && Date.now() - meta.lastDeepModify.at <= 10 * 60 * 1000
  if (segment == null) return null
  const downstreamText = (segment.downstream ?? []).length === 0 ? '这一步之后没有下游要重做' : `要重做：${(segment.downstream ?? []).join(' -> ')}`
  return createElement('div', { style: S.focus },
    createElement('strong', { style: { fontSize: '14px' } }, `🗂 回看：${segment.label ?? segment.key}`),
    createElement('p', { style: { margin: '6px 0', fontSize: '12px', opacity: 0.75 } },
      `现在：${segment.status === 'done' ? '已完成' : segment.status === 'waiting-user' ? '在等你' : segment.status === 'active' ? '进行中' : '还没到'}`,
      segment.decision != null ? ` · 拍板：${segment.decision.approved === true ? '✅ 通过' : '❌ 驳回'}${segment.decision.note ? `（${segment.decision.note}）` : ''}` : ''),
    (segment.artifacts ?? []).length > 0
      ? createElement('div', { style: { margin: '4px 0 8px' } },
          createElement('p', { style: { margin: '0 0 4px', fontSize: '12px', opacity: 0.8 } }, '这一步的产物：'),
          ...(segment.artifacts ?? []).map((rel) =>
            createElement('button', { key: rel, style: { ...S.smallLink, display: 'block', margin: '2px 0' },
              onClick: () => props.onView(rel), title: '点开看内容' }, `📄 ${rel}`)),
        )
      : createElement('p', { style: { margin: '4px 0 8px', fontSize: '12px', opacity: 0.6 } }, '这一步没有留产物。'),
    segment.key !== 'chapters-review' && segment.canDeepModify === true
      ? (confirming
          ? createElement('div', { style: { marginTop: '8px', borderTop: '1px dashed var(--dsw-border, #d0d7de)', paddingTop: '8px' } },
              createElement('p', { style: { margin: '0 0 6px', fontWeight: 600 } }, `✍️ 定点修改「${segment.label}」`),
              createElement('p', { style: { margin: '0 0 6px', fontSize: '12px', color: 'var(--dsw-danger, #cf222e)' } }, `影响预告：${downstreamText}。`),
              createElement('p', { style: { margin: '0 0 6px', fontSize: '12px', opacity: 0.75 } },
                '你的风格线和豁免原样保留；每一步仍会来请你拍板；旧版本全部留档；10 分钟内可一键撤销。'),
              createElement('textarea', { style: S.textarea, placeholder: '这次要改成什么？写一句（必填）', value: note,
                onChange: (e) => setNote(e.target.value) }),
              createElement('div', { style: { marginTop: '8px', display: 'flex', gap: '8px' } },
                createElement('button', { style: S.bigBtn(false), disabled: busy || note.trim() === '',
                  onClick: () => { onDeepModify(segment.key, note.trim()); setConfirming(false); setNote('') } }, '✍️ 就这么改，重做下游'),
                createElement('button', { style: S.smallLink, onClick: () => { setConfirming(false); setNote('') } }, '取消'),
              ),
            )
          : createElement('button', { style: { ...S.bigBtn(true), background: 'transparent', color: 'var(--dsw-danger, #cf222e)' },
              onClick: () => setConfirming(true), disabled: busy }, '✍️ 定点修改这一步'))
      : null,
    undoable
      ? createElement('button', { style: { ...S.smallLink, textDecoration: 'none', marginTop: '8px' }, disabled: busy,
          onClick: onDeepUndo }, '↩️ 撤销刚才的定点修改（10 分钟内）')
      : null,
    createElement('p', { style: { margin: '10px 0 0', fontSize: '12px', opacity: 0.7 } },
      '想问『当时为什么这么定』？在对话里告诉 AI 你正在看哪一步（比如『第 2 关为什么这么定』），它会翻账本用大白话答。'),
  )
}

// ── 文件查看器（F22 抽出共用）：标题 + 收起 + 正文 <pre>。 ─────────────────────
// 浏览态下嵌在该段卡片正下方；「现在」视图下用于顶栏/事件卡/材料查看。

// F38（2026-08-20 走查）：knowledge-map.json 的最小人读折叠——把原始 JSON 的
// 章节建议/知识点清单/材料小节折叠成逐行清单；解析失败或无内容返回 null（回退原样）。
export function foldKnowledgeMap(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  if (data === null || typeof data !== 'object') return null
  const lines = []
  const chapters = Array.isArray(data.chapterSuggestion) ? data.chapterSuggestion : []
  if (chapters.length > 0) {
    lines.push(`📚 章节建议（${chapters.length} 章）`)
    chapters.forEach((chapter, index) => {
      const title = String(chapter?.title ?? '').trim()
      const src = String(chapter?.source ?? '').trim()
      lines.push(`${index + 1}. ${title}${src !== '' ? `　← ${src}` : ''}`)
    })
    lines.push('')
  }
  const kps = Array.isArray(data.knowledgePoints) ? data.knowledgePoints : []
  if (kps.length > 0) {
    lines.push(`🎯 知识点清单（${kps.length} 个）`)
    for (const point of kps) {
      const title = String(point?.title ?? '').trim()
      if (title === '') continue
      const diff = String(point?.difficulty ?? '').trim()
      const src = String(point?.source ?? '').trim()
      lines.push(`· ${title}${diff !== '' ? `（${diff}）` : ''}${src !== '' ? ` ${src}` : ''}`)
    }
    lines.push('')
  }
  const materials = Array.isArray(data.materials) ? data.materials : []
  if (materials.length > 0) {
    lines.push(`📄 材料小节（${materials.length} 份）`)
    materials.forEach((material, index) => {
      const title = String(material?.title ?? '').trim()
      const sections = Array.isArray(material?.sections)
        ? material.sections.map((s) => String(s?.title ?? '').trim()).filter((t) => t !== '')
        : []
      lines.push(`资料${material?.num ?? index + 1}${title !== '' ? `（${title}）` : ''}：${sections.join(' / ') || '（未读到小节标题）'}`)
    })
    lines.push('')
  }
  if (lines.length === 0) return null
  return lines.join('\n').replace(/\n+$/, '')
}

export function FileViewer(props) {
  const { viewing, viewText, onClose } = props
  // F38（2026-08-20 走查）：knowledge-map.json 折叠成人读清单；解析失败/无内容回退原样 <pre>。
  const isKm = typeof viewing?.path === 'string' && viewing.path.endsWith('knowledge-map.json')
  const folded = isKm ? foldKnowledgeMap(viewText) : null
  return createElement('div', { style: { marginTop: '8px', border: '1px solid var(--dsw-border, #d0d7de)', borderRadius: '8px', padding: '10px' } },
    createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
      createElement('strong', { style: { fontSize: '13px' } }, `📄 ${viewing.label}`),
      createElement('button', { style: S.smallLink, onClick: onClose }, '✕ 收起'),
    ),
    createElement('pre', {
      style: { whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'var(--dsw-surface, #fff)', borderRadius: '8px', padding: '10px', maxHeight: '320px', overflow: 'auto', fontSize: '12px', marginTop: '6px' },
    }, folded !== null ? folded : viewText),
  )
}

// ── 浏览态整段（F22 2026-08-20）：「⏪ 回到现在」+ 历史分段卡（HistoryBrowser） ──
// + 该段「产物」查看内容直接渲染在卡片正下方（不再沉到焦点区底部）。

export function BrowseSection(props) {
  const { segment, meta, busy, viewing, viewText, onBack, onView, onDeepModify, onDeepUndo, onCloseView } = props
  return createElement('div', { style: { marginBottom: '8px' } },
    createElement('button', { style: S.smallLink, onClick: onBack }, '⏪ 回到现在'),
    createElement(HistoryBrowser, { segment, meta, busy, onView, onDeepModify, onDeepUndo }),
    viewing !== null && viewText !== null
      ? createElement(FileViewer, { viewing, viewText, onClose: onCloseView })
      : null,
  )
}

// F22（2026-08-20）：浏览历史（browsing 非空）时主进度条隐藏，回到现在（null）才显示。
export function mainProgressVisible(browsing) {
  return browsing === null
}

// ── 顶栏介入工具条（常驻：书名 + 当前阶段 + 🎨风格线 / 📮留言 / ⏸暂停） ─────────

export function TopBar(props) {
  const { meta, openStylePanel, openIntervene, pause, resume } = props
  // 计数从 meta 现算（旧账本 ?? [] 兜底）：风格线数=active 条数，留言数=pending 条数。
  const styleCount = (meta?.styleNotes ?? []).filter((n) => n.status === 'active').length
  const pendingCount = (meta?.pendingInterventions ?? []).filter((i) => i.status === 'pending').length
  return createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderBottom: '1px solid var(--dsw-border, #d0d7de)', flexWrap: 'wrap' } },
    createElement('strong', null, `《${meta?.name ?? ''}》`),
    createElement('span', { style: { fontSize: '12px', opacity: 0.75 } }, `一起做到：${PHASES.find((x) => x.n === meta?.phase)?.label ?? ''}`),
    createElement('span', { style: { flex: 1 } }),
    styleCount > 0 ? createElement('button', { style: S.smallLink, onClick: openStylePanel, title: '你的风格意见清单（AI 写每一章都会照着办）' }, `🎨 风格线(${styleCount})`) : null,
    pendingCount > 0 ? createElement('button', { style: S.smallLink, onClick: openIntervene, title: '留言稍后处理：不打断 AI，它到下个停靠点会看' }, `📮 留言(${pendingCount})`) : null,
    meta?.pause != null
      ? createElement('button', { style: { ...S.smallLink, color: '#1a7f37' }, onClick: resume, title: '继续从断点接着写' }, '▶ 已暂停·点继续')
      : createElement('button', { style: S.smallLink, onClick: pause, title: '暂停：这次先停下手里的活，听我的（包括小助手）' }, '⏸ 暂停'),
  )
}

// ── 顶栏展开面板：🎨 风格线清单 / 📮 留言清单（点开即见，✕ 收起） ───────────────

function StylePanel(props) {
  const { notes, onClose } = props
  const list = notes ?? []
  return createElement('div', { style: { ...S.card, borderColor: 'var(--dsw-accent, #4f6ef7)', marginTop: '8px' } },
    createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' } },
      createElement('strong', { style: { fontSize: '13px' } }, `🎨 你的风格线（${list.length} 条：AI 写每一章都照着办）`),
      createElement('button', { style: S.smallLink, onClick: onClose }, '✕ 收起'),
    ),
    list.length === 0
      ? createElement('p', { style: { margin: '6px 0 0', fontSize: '12px', opacity: 0.7 } }, '还没有风格意见；在对话里跟 AI 提要求，它会记成风格线。')
      : list.map((note, index) =>
          createElement('div', { key: note.id, style: { margin: '6px 0', fontSize: '13px', lineHeight: 1.55 } },
            createElement('span', { style: { fontWeight: 600 } }, `#${index + 1}`),
            ` ${note.text ?? ''}`,
            note.note != null && note.note !== ''
              ? createElement('span', { style: { opacity: 0.6, fontSize: '12px' } }, `（${note.note}）`)
              : null,
          )),
  )
}

function IntervenePanel(props) {
  const { items, onClose } = props
  const list = items ?? []
  return createElement('div', { style: { ...S.card, borderColor: '#e3b341', marginTop: '8px' } },
    createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' } },
      createElement('strong', { style: { fontSize: '13px' } }, `📮 你的留言（${list.length} 条待处理）`),
      createElement('button', { style: S.smallLink, onClick: onClose }, '✕ 收起'),
    ),
    list.length === 0
      ? createElement('p', { style: { margin: '6px 0 0', fontSize: '12px', opacity: 0.7 } }, '没有待处理的留言。')
      : list.map((item) =>
          createElement('div', { key: item.id, style: { margin: '6px 0', fontSize: '13px', lineHeight: 1.55 } },
            createElement('span', { style: { opacity: 0.6, fontSize: '12px' } }, formatTime(item.at)),
            item.target != null && item.target !== ''
              ? createElement('span', { style: { opacity: 0.7, fontSize: '12px', marginLeft: '6px' } }, `（${item.target}）`)
              : null,
            createElement('div', null, item.text ?? ''),
            createElement('p', { style: { margin: '2px 0 0', fontSize: '12px', opacity: 0.6 } }, 'AI 到下个停靠点会看到并处理，不打断它手里的活。'),
          )),
  )
}

// ── 自定义模式库面板（2026-08-21）：粘贴描述 → AI 分析成「模式卡」加入本书 ──────

export function PatternPanel(props) {
  const { patterns, busy, onAnalyze, onClose, result } = props
  const [text, setText] = useState('')
  const list = patterns ?? []
  return createElement('div', { style: { ...S.card, borderColor: 'var(--dsw-accent, #4f6ef7)', marginTop: '8px' } },
    createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' } },
      createElement('strong', { style: { fontSize: '13px' } }, '🧩 自定义模式库'),
      createElement('button', { style: S.smallLink, onClick: onClose }, '✕ 收起'),
    ),
    createElement('p', { style: { margin: '6px 0', fontSize: '12px', opacity: 0.75, lineHeight: 1.6 } },
      '粘贴一段你想要的教法/章节结构描述，AI 会把它提炼成一张「模式卡」加入这本书的模式库；第 2 关「教学模式选型」和写作规范都会优先参考它。'),
    createElement('textarea', {
      style: { ...S.textarea, minHeight: '64px' },
      placeholder: '例：每个知识点先给一个生活中的真实场景引出概念，再配一道由浅入深的例题，最后放一道易错判断题……',
      value: text,
      onChange: (e) => setText(e.target.value),
    }),
    createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
      createElement('button', { style: S.bigBtn(true), disabled: busy || text.trim() === '', onClick: () => { onAnalyze(text.trim()); setText('') } }, '🤖 让 AI 分析并加入模式库'),
      busy ? createElement('span', { style: { fontSize: '12px', opacity: 0.7 } }, 'AI 分析中…') : null,
    ),
    result !== null
      ? createElement('div', { style: { marginTop: '8px', padding: '8px 10px', borderRadius: '8px', background: 'var(--dsw-success-soft, #dafbe1)', fontSize: '12px', lineHeight: 1.6 } },
          createElement('strong', null, `✅ 已加入模式库：${result.name ?? ''}`),
          result.problem != null && result.problem !== ''
            ? createElement('p', { style: { margin: '4px 0 0' } }, `解决：${result.problem}`)
            : null,
          result.blocks != null && result.blocks !== ''
            ? createElement('p', { style: { margin: '2px 0 0' } }, `落地：${result.blocks}`)
            : null,
        )
      : null,
    createElement('p', { style: { margin: '8px 0 4px', fontSize: '12px', opacity: 0.7 } },
      list.length === 0 ? '这本书还没有自定义模式。' : `已在这本书的模式库里（${list.length} 张）：`),
    list.map((p, index) =>
      createElement('div', { key: p.file ?? index, style: { margin: '3px 0', fontSize: '12px', lineHeight: 1.5 } },
        `· ${p.title ?? p.name ?? ''}${p.problem != null && p.problem !== '' ? ` — ${p.problem}` : ''}`)),
  )
}

// ── 工作台主视图 ────────────────────────────────────────────────────────────

// F33 自动跟随判定（抽成纯函数供冒烟测试）：等拍板状态**新到达**且当时正在浏览历史 → 才强制拉回「现在」；
// 已处于等拍板态后用户再主动浏览 → 不打断（有意浏览/定点修改）。
export function shouldForceBackToNow(prevAwaiting, awaiting, browsing) {
  return awaiting && !prevAwaiting && browsing
}

// ── MinerU Token 常驻入口（F20）─────────────────────────────────────────────
// 未设置（mineruSet=false）：原「还差一步」输入卡，现状不变；
// 已设置：常驻显示掩码（••••）+「重新设置」入口，点开（resetOpen）才展开输入框；
// 保存走父级 onSave（既有 settings 动作，后端支持覆盖），保存成功后父级关回掩码态。
export function MineruTokenCard(props) {
  const { mineruSet, mineruToken, busy, onTokenChange, onSave, resetOpen, onToggleReset } = props
  if (mineruSet === false) {
    return createElement('div', { style: { ...S.card, borderColor: 'var(--dsw-danger, #cf222e)' } },
      createElement('strong', { style: { color: 'var(--dsw-danger, #cf222e)' } }, '🔑 还差一步：MinerU Token'),
      createElement('p', { style: { margin: '4px 0' } }, 'PDF 转换需要 MinerU 的免费 Token（mineru.net 申请）。填在这里即可：'),
      createElement('input', { style: S.input, placeholder: '粘贴 MinerU Token', value: mineruToken, onChange: onTokenChange }),
      createElement('button', { style: S.bigBtn(true), onClick: onSave, disabled: busy }, '保存 Token'))
  }
  return createElement('div', { style: { ...S.card, borderColor: 'var(--dsw-success, #1a7f37)' } },
    createElement('div', { style: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' } },
      createElement('strong', {}, '✅ MinerU Token 已设置（••••）'),
      createElement('button', { style: S.smallLink, onClick: onToggleReset }, '重新设置')),
    resetOpen
      ? createElement('div', { style: { marginTop: '6px' } },
          createElement('p', { style: { margin: '4px 0' } }, '填新的 Token 即可覆盖旧的：'),
          createElement('input', { style: S.input, placeholder: '粘贴新的 MinerU Token', value: mineruToken, onChange: onTokenChange }),
          createElement('button', { style: S.bigBtn(true), onClick: onSave, disabled: busy }, '保存新 Token'))
      : null)
}

function WorkbenchView(props) {
  // 会话模式门控：只在「造书模式」显示工作台（useSessions 选择器返回稳定值，安全）。
  const sessionPreset = props.useSessions((s) => s.byId[props.sessionId]?.agentPreset ?? null)
  const session = props.sessionId
  // 主 AI 活性（F17）：浏览器侧流式正在吐半个回合（partial!=null）即算「AI 回合进行中」。
  const partialActive = props.useSession((s) => s.partial) != null
  const [projects, setProjects] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [meta, setMeta] = useState(null)
  const [gate, setGate] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [events, setEvents] = useState([])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [mineruSet, setMineruSet] = useState(true)
  const [mineruToken, setMineruToken] = useState('')
  // F20：已设置时的「重新设置」展开态——点开输入框、保存成功后回到掩码态。
  const [mineruResetOpen, setMineruResetOpen] = useState(false)
  const [preview, setPreview] = useState(null)
  const [bookDir, setBookDir] = useState(null)
  const [workFiles, setWorkFiles] = useState([])
  const [pendingStageView, setPendingStageView] = useState(null)
  const [pendingGateView, setPendingGateView] = useState(null)
  const [pendingReviews, setPendingReviews] = useState([])
  const [exploreSummary, setExploreSummary] = useState(null)
  const [chapterStatus, setChapterStatus] = useState([])
  const [goldDrafts, setGoldDrafts] = useState([])
  const [goldDraftVersion, setGoldDraftVersion] = useState(1)
  const [viewing, setViewing] = useState(null)
  const [viewText, setViewText] = useState(null)
  const [gateOpen, setGateOpen] = useState(null)
  const [showMaterials, setShowMaterials] = useState(false)
  // 顶栏 🎨 风格线 / 📮 留言 展开面板开关（Task 17 常驻入口；点开、再点或 ✕ 收起）。
  const [showStylePanel, setShowStylePanel] = useState(false)
  const [showIntervenePanel, setShowIntervenePanel] = useState(false)
  // 🧩 自定义模式库（2026-08-21）：粘贴描述 → AI 分析成「模式卡」加入本书。
  const [patternOpen, setPatternOpen] = useState(false)
  const [patternBusy, setPatternBusy] = useState(false)
  const [patternResult, setPatternResult] = useState(null)
  const [patternList, setPatternList] = useState([])
  // 对话台：下区高度（拖分界可调，默认 220）、是否收成一条。
  // 拖分界期间直改 DOM（见 startDeskDrag），不逐帧重渲整棵工作台组件树，保证跟手。
  const [deskHeight, setDeskHeight] = useState(220)
  const [deskCollapsed, setDeskCollapsed] = useState(true)
  const deskRef = useRef(null)
  // 拖拽中的实时对话台高度：直接改 DOM 的同时记进 ref，渲染高度读「ref ?? 状态」，
  // 这样拖拽期间被轮询/事件重渲时不会把高度打回旧状态（分界线不会弹回/反向）。
  const deskLiveRef = useRef(null)
  // F43（2026-08-20）：工作台根容器高度——槽位若不约束高度，页面整体滚动、地图栏会随右列
  // 内容拉伸（拖对话台分割线时广告被带着走、地图内容多时广告被挤出窗口）。实测父容器可用
  // 高度并钉到根容器；只在父容器真实可见且有合理尺寸时落地，否则保持 height:100% 基线
  // （页签未激活/隐藏时 rect 是 0/负值，跳过不动，绝不压塌界面）。
  const rootRef = useRef(null)
  const [rootH, setRootH] = useState(null)
  useEffect(() => {
    const el = rootRef.current
    if (el === null || el.parentElement === null) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      const vh = typeof window !== 'undefined' ? (window.innerHeight || 0) : 0
      // 实机证据（2026-08-21）：工作台根容器的父容器是 display:contents（无盒子，
      // getBoundingClientRect 全 0），量父容器拿不到高度。改用根容器自身的位置算可用高度；
      // 且不能把底部 DSH 作曲家输入框盖住——找到最靠底部的文本输入元素，工作台在它上方结束。
      let bottomBound = vh
      try {
        if (typeof document !== 'undefined') {
          let maxBottom = -1
          const cands = document.querySelectorAll('textarea, input, [role="textbox"], [contenteditable="true"]')
          for (const d of cands) {
            const r = d.getBoundingClientRect()
            if (!(r.width > 0 && r.height > 0)) continue
            // 只认「接近视口底部」的输入（DSH 作曲家）；工作台内部表单/顶部搜索框不算。
            if (r.top > rect.top && r.bottom > vh - 160 && r.bottom > maxBottom) {
              maxBottom = r.bottom
              bottomBound = r.top
            }
          }
        }
      } catch { /* 找不到作曲家就退回视口高度 */ }
      const usable = Math.max(0, bottomBound - Math.max(0, rect.top))
      if (usable > 200) {
        const next = Math.round(usable)
        setRootH((prev) => (prev === next ? prev : next))
      }
    }
    measure()
    // 页签可能后激活：短周期重测，直到拿到合理值并持续跟随（值不变不触发重渲）。
    const timer = setInterval(measure, 400)
    return () => clearInterval(timer)
  }, [])
  // 深改过程地图：历史分段列表（含影响预告/撤销窗口）+ 当前浏览的分段 key（地图栏点击由 Task 15 接线）。
  const [processSegs, setProcessSegs] = useState([])
  // F35：/textbook/process 响应里的子代理聚合状态（running=审计/写作在跑、inactive=完成待收），喂活性行。
  const [processSubagents, setProcessSubagents] = useState({ running: 0, inactive: 0 })
  const [browsing, setBrowsing] = useState(null)
  // 不打断提示条（F17）：铺章中提交风格线/留言/意见成功后，焦点区顶部滑入、6 秒自清。
  const [noteToast, setNoteToast] = useState(false)
  // 自动跟随（F5/Task 20 方案 A）：等拍板强制回「现在」的横幅 + 浏览历史时 AI 有新进展的「跳过去」横幅。
  const [awaitBanner, setAwaitBanner] = useState(false)
  const [progressBanner, setProgressBanner] = useState(false)
  const progressSeqRef = useRef(-1) // 上次见过的 progress 事件 seq（浏览时新 seq 才触发「跳过去」横幅）
  const activeRef = useRef(null)
  const lastSeqRef = useRef(-1)
  const eventsRef = useRef([])
  const awaitingSeenRef = useRef(false) // F33：只记录「等拍板状态新到达」那一帧，用于自动跟随只拉回一次
  const sessionRef = useRef(session)
  sessionRef.current = session

  // 拖分界（2026-08-21 修「不跟手」）：旧实现每帧 mousemove 都 setDeskHeight，
  // 触发整棵工作台重渲（对话台要重扫整段对话），渲染跟不上鼠标就发飘。
  // 现在拖拽期间直接改容器 DOM 高度（不重渲），松手才把最终高度交回 React 状态。
  const startDeskDrag = (e) => {
    e.preventDefault()
    const startY = e.clientY
    const startH = deskLiveRef.current ?? deskHeight
    const clamp = (v) => Math.max(120, Math.min(window.innerHeight / 2, v))
    const onMove = (ev) => {
      // 对话台贴底部：高度增大其上边缘（分界线）上移。要让分界线跟手（上拖→线上移），
      // 增量必须取反——往上拖（clientY 减小）→ 高度增大。
      const next = clamp(startH - (ev.clientY - startY))
      deskLiveRef.current = next
      if (deskRef.current !== null) deskRef.current.style.height = `${next}px`
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      const h = deskLiveRef.current ?? deskHeight
      deskLiveRef.current = null
      if (Number.isFinite(h) && h > 0) setDeskHeight(h)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const sess = () => `session=${encodeURIComponent(sessionRef.current)}`

  async function fetchJson(url, options) {
    const res = await fetch(url, options ?? { headers: { Accept: 'application/json' } })
    let json = null
    try { json = await res.json() } catch { json = null }
    if (!res.ok) throw new Error((json !== null && json.error) || `HTTP ${res.status}`)
    return json
  }

  async function loadProjects() {
    const json = await fetchJson(`/textbook/projects?${sess()}`)
    setProjects(json.projects ?? [])
    if (activeRef.current === null && (json.projects ?? []).length > 0) {
      activeRef.current = json.projects[0].id
      setActiveId(activeRef.current)
    }
  }
  async function loadAll(projectId) {
    const json = await fetchJson(`/textbook/events?${sess()}&project=${encodeURIComponent(projectId)}`)
    eventsRef.current = json.events ?? []
    lastSeqRef.current = json.events && json.events.length > 0 ? json.events[json.events.length - 1].seq : -1
    setEvents(eventsRef.current)
    setMeta(json.meta ?? null)
    setGate(json.gate ?? null)
    setSnapshots(json.snapshots ?? [])
    setBookDir(json.dir ?? null)
    setPendingStageView(json.pendingStage ?? null)
    setPendingGateView(json.pendingGate ?? null)
    setPendingReviews(Array.isArray(json.pendingReviews) ? json.pendingReviews : [])
    setExploreSummary(json.exploreSummary ?? null)
    setChapterStatus(Array.isArray(json.chapterStatus) ? json.chapterStatus : [])
    setGoldDrafts(Array.isArray(json.goldDrafts) ? json.goldDrafts : [])
    setGoldDraftVersion(Number.isSafeInteger(json.goldDraftVersion) ? json.goldDraftVersion : 1)
    void refreshWork(projectId)
    void refreshProcess(projectId)
  }

  // 已完成步骤的结果文件列表（源探查/章节/成书等，点开可看）。
  async function refreshWork(projectId) {
    try {
      const json = await fetchJson(`/textbook/work?${sess()}&project=${encodeURIComponent(projectId)}`)
      setWorkFiles(json.files ?? [])
    } catch { /* 结果列表失败不影响主界面 */ }
  }

  // 深改过程地图（历史分段 + 影响预告 + 撤销窗口）：与事件同节奏刷新。
  async function refreshProcess(projectId) {
    try {
      const json = await fetchJson(`/textbook/process?${sess()}&project=${encodeURIComponent(projectId)}`)
      setProcessSegs(json.segments ?? [])
      // F35：子代理聚合状态随过程地图一起刷新；后端降级/缺失时兜底为 0。
      const sub = json.subagents ?? {}
      setProcessSubagents({
        running: Number.isSafeInteger(sub.running) ? sub.running : 0,
        inactive: Number.isSafeInteger(sub.inactive) ? sub.inactive : 0,
      })
    } catch { /* 过程地图失败不影响主界面 */ }
  }

  const viewWork = async (file) => {
    setViewing(file)
    setViewText(null)
    try {
      const res = await fetch(`/textbook/file?${sess()}&project=${encodeURIComponent(activeRef.current)}&path=${encodeURIComponent(file.path)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setViewText(await res.text())
    } catch (err) {
      setViewText(`（打开失败：${String(err instanceof Error ? err.message : err)}）`)
    }
  }

  // 事件卡片 → 结果文件（只在实际存在的文件上给"查看"入口）。
  const workPathForEvent = (event) => {    const data = event.data ?? {}
    const candidates = []
    const label = data.label ?? ''
    if (event.type === 'textbook/agent-end' || event.type === 'textbook/agent-start') {
      if (label === '源探查') candidates.push('work/explore.md')
      else if (label === '合并成书' || label === '最后检查（质量门）') candidates.push('work/book.md')
      else if (label === '整理章节骨架') candidates.push('work/outline.md')
      else if (label === '最佳范例章' || label.startsWith('最佳范例章')) candidates.push(`work/chapter-${String(goldChapterNo(meta)).padStart(2, '0')}.md`)
      else if (label.startsWith('写第')) {
        const match = /写第(\d+)章/.exec(label)
        if (match !== null) candidates.push(`work/chapter-${String(Number(match[1])).padStart(2, '0')}.md`)
      } else if (label.startsWith('自查第')) {
        const match = /自查第(\d+)章/.exec(label)
        if (match !== null) candidates.push(`work/audit-${String(Number(match[1])).padStart(2, '0')}.md`)
      }
    } else if (event.type === 'textbook/phase-end') {
      const phase = Number(data.phase)
      if (phase === 2) candidates.push('work/explore.md')
      else if (phase === 4) candidates.push(`work/chapter-${String(goldChapterNo(meta)).padStart(2, '0')}.md`)
      else if (phase === 5 || phase === 6) candidates.push('work/book.md')
    }
    const hit = candidates.find((path) => workFiles.some((f) => f.path === path))
    if (hit === undefined) return null
    return { path: hit, label: workFiles.find((f) => f.path === hit)?.label ?? hit }
  }

  // 阶段 → 结果（顶部分段按钮可点击查看）。阶段 1 是"材料清单"面板（非文件）。
  const phaseProduct = (phase) => {
    if (phase === 1) return { path: '__materials__', label: '第一步·材料' }
    const map = { 2: 'work/explore.md', 3: 'work/outline.md', 4: `work/chapter-${String(goldChapterNo(meta)).padStart(2, '0')}.md`, 5: 'work/book.md', 6: 'work/book.md' }
    const path = map[phase]
    if (path === undefined) return null
    return workFiles.find((f) => f.path === path) ?? null
  }

  async function poll() {
    const projectId = activeRef.current
    if (projectId === null) {
      // 向导态：AI 可能刚在对话里建了书，主动发现新项目并切过去（双向同步）。
      try {
        const json = await fetchJson(`/textbook/projects?${sess()}`)
        const list = json.projects ?? []
        setProjects(list)
        if (list.length > 0 && activeRef.current === null) {
          activeRef.current = list[0].id
          setActiveId(list[0].id)
          await loadAll(list[0].id)
        }
      } catch { /* 网络抖动忽略 */ }
      return
    }
    try {
      const json = await fetchJson(`/textbook/events?${sess()}&project=${encodeURIComponent(projectId)}&after=${lastSeqRef.current}`)
      if ((json.events ?? []).length > 0) {
        const next = eventsRef.current.concat(json.events)
        eventsRef.current = next
        lastSeqRef.current = json.events[json.events.length - 1].seq
        setEvents(next)
      }
      setMeta(json.meta ?? null)
      setGate(json.gate ?? null)
      setSnapshots(json.snapshots ?? [])
      setBookDir(json.dir ?? null)
      setPendingStageView(json.pendingStage ?? null)
      setPendingGateView(json.pendingGate ?? null)
      setPendingReviews(Array.isArray(json.pendingReviews) ? json.pendingReviews : [])
      setExploreSummary(json.exploreSummary ?? null)
      setChapterStatus(Array.isArray(json.chapterStatus) ? json.chapterStatus : [])
      setGoldDrafts(Array.isArray(json.goldDrafts) ? json.goldDrafts : [])
      setGoldDraftVersion(Number.isSafeInteger(json.goldDraftVersion) ? json.goldDraftVersion : 1)
      void refreshWork(projectId)
      void refreshProcess(projectId)
    } catch (err) {
      // 项目可能被 AI 删除/移走了：回到向导态并重新拉列表。
      const message = String(err instanceof Error ? err.message : err)
      if (message.includes('不存在') || message.includes('不属于')) {
        activeRef.current = null
        setActiveId(null)
        setMeta(null)
        setGate(null)
        setSnapshots([])
        setBookDir(null)
        setEvents([])
        setPendingStageView(null)
        setPendingGateView(null)
        setPendingReviews([])
        setExploreSummary(null)
        setChapterStatus([])
        setProcessSegs([])
        setBrowsing(null)
        setAwaitBanner(false)
        setProgressBanner(false)
        progressSeqRef.current = -1
        eventsRef.current = []
        lastSeqRef.current = -1
        void loadProjects().catch(() => {})
      }
    }
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        await loadProjects()
        if (activeRef.current !== null) await loadAll(activeRef.current)
        const settings = await fetchJson('/textbook/settings')
        if (alive) setMineruSet(settings.settings?.mineruTokenSet === true)
      } catch (err) {
        if (alive) setError(String(err instanceof Error ? err.message : err))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => { void poll() }, 2000)
    return () => clearInterval(timer)
  }, [])

  // 不打断提示条 6 秒自清（提交成功后亮起，到时自动收起；组件卸载/重渲前清掉旧定时器）。
  useEffect(() => {
    if (!noteToast) return undefined
    const timer = setTimeout(() => setNoteToast(false), 6000)
    return () => clearTimeout(timer)
  }, [noteToast])

  // 自动跟随（方案 A）：AI 开始等人类拍板时，若正在翻历史，强制切回「现在」并顶部亮
  // 「已切回现在」横幅（不打扰、不弹窗）。等拍板分两种：meta.status 变成 awaiting-*；
  // 或设计关卡等你拍板——此时 meta.status 仍是 running（proposeGate 不切状态），
  // 由 gate.status==='awaiting' 兜住（Task 24 回归发现：关卡拍板是主决策面，之前漏拉回）。
  // F33 修复（2026-08-20 走查）：只在该状态「新到达」那一刻拉回一次；之后用户已处于等拍板
  // 态、再主动点地图历史段 = 有意浏览/定点修改，不再强制打断——否则 awaiting-* 下永远进不了
  // 历史浏览，定点修改入口被堵死（与「随时能改」承诺冲突，实书走查实测）。
  useEffect(() => {
    const st = meta?.status
    const awaiting = (typeof st === 'string' && st.startsWith('awaiting-')) || (gate !== null && gate.status === 'awaiting')
    if (shouldForceBackToNow(awaitingSeenRef.current, awaiting, browsing !== null)) {
      setBrowsing(null)
      setAwaitBanner(true)
    }
    awaitingSeenRef.current = awaiting
  }, [meta?.status, browsing, gate])

  // 自动跟随（方案 A）：浏览历史时 AI 出了「新」progress 事件 → 顶部滑入「AI 正在干活--点此跳过去」。
  // 新 = seq 大于开始浏览那一刻记住的进度序号（progressSeqRef），避免一进历史就把旧进展翻出来。
  useEffect(() => {
    if (browsing === null) return undefined
    const lastProgress = [...events].reverse().find((e) => e.type === 'textbook/progress')
    if (lastProgress !== undefined && lastProgress.seq > progressSeqRef.current) {
      progressSeqRef.current = lastProgress.seq
      setProgressBanner(true)
    }
    return undefined
  }, [events, browsing])

  // 等拍板横幅 6 秒自清（到时自动收起；组件卸载/重渲前清掉旧定时器）。
  useEffect(() => {
    if (!awaitBanner) return undefined
    const timer = setTimeout(() => setAwaitBanner(false), 6000)
    return () => clearTimeout(timer)
  }, [awaitBanner])

  // 向导打开时：请求 AI 建议（人类只做确认）。
  useEffect(() => {
    if (!showWizard) return
    let alive = true
    setSuggestLoading(true)
    fetchJson('/textbook/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'wizard-suggest', session: sessionRef.current }),
    })
      .then((json) => { if (alive) setSuggestions(json.suggestions ?? []) })
      .catch(() => { if (alive) setSuggestions([]) })
      .finally(() => { if (alive) setSuggestLoading(false) })
    return () => { alive = false }
  }, [showWizard])

  // 「✨ AI 建议」与「换一批」：带学习者的背景重新请求建议。
  const requestSuggest = async (hintText) => {
    setSuggestLoading(true)
    try {
      const json = await fetchJson('/textbook/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ action: 'wizard-suggest', session: sessionRef.current, hint: hintText || undefined }),
      })
      setSuggestions(json.suggestions ?? [])
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : String(err))
    } finally {
      setSuggestLoading(false)
    }
  }

  const selectProject = (id) => {
    activeRef.current = id
    setActiveId(id)
    setError(null)
    setGate(null)
    setPreview(null)
    // 换书时把自动跟随的两条横幅和进度序号一并归零，避免旧书的残留状态串台。
    setAwaitBanner(false)
    setProgressBanner(false)
    progressSeqRef.current = -1
    void loadAll(id).catch((err) => setError(String(err instanceof Error ? err.message : err)))
  }

  const postAction = async (body) => {
    setBusy(true)
    try {
      const json = await fetchJson('/textbook/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ project: activeRef.current, session: sessionRef.current, ...body }),
      })
      // 无活动项目（如 book-create 之前）时不需要刷新事件。
      if (activeRef.current !== null) await loadAll(activeRef.current)
      setError(null)
      // 不打断提示条：铺章（phase 5）且机器在跑（running）时，风格线/留言/意见提交成功 → 顶部提示。
      // 注：目前前端只经 review（章节卡写意见）走到这里；style-note/intervene 尚无前端入口，见 Task 19 报告。
      if (json !== null && ['style-note', 'intervene', 'review'].includes(body.action)
        && meta?.status === 'running' && meta?.phase === 5) {
        setNoteToast(true)
      }
      return json
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err))
      return null
    } finally {
      setBusy(false)
    }
  }

  const deleteBook = (id) => {
    setBusy(true)
    fetchJson('/textbook/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'book-delete', project: id, session: sessionRef.current, confirm: true }),
    })
      .then(() => {
        setDeletingId(null)
        if (activeRef.current === id) {
          activeRef.current = null
          setActiveId(null)
          setMeta(null)
          setGate(null)
          setEvents([])
        }
        return fetchJson(`/textbook/projects?${sess()}`)
      })
      .then((json) => setProjects(json.projects ?? []))
      .catch((err) => setError(String(err instanceof Error ? err.message : err)))
      .finally(() => setBusy(false))
  }

  const decide = (decision) => {
    if (gate === null) return
    void postAction({
      action: 'gate-decide', gate: gate.gate, version: gate.version,
      approved: decision.approved, mode: decision.mode ?? null,
      reasons: decision.reasons ?? [], note: decision.note ?? '',
    })
  }

  const rollback = () => {
    if (snapshots.length === 0) { setError('还没有可回退的快照'); return }
    void postAction({ action: 'rollback', snapshot: snapshots[0].seq })
  }

  const confirmExplore = (approved, feedback) => {
    void postAction({
      action: 'explore-confirm', approved,
      reasons: feedback?.reasons ?? [],
      note: feedback?.note ?? '',
    })
  }

  const confirmOutline = (approved, note, goldChapter) => {
    void postAction({
      action: 'outline-confirm', approved,
      note: note ?? '',
      ...(goldChapter != null && Number.isSafeInteger(Number(goldChapter)) ? { goldChapter: Number(goldChapter) } : {}),
    })
  }

  const submitReview = async (chapter, comment) => {
    const json = await postAction({ action: 'review', chapter, comment })
    return json
  }

  const createBook = (form) => {
    void postAction({ action: 'book-create', ...form }).then((json) => {
      if (json !== null && json.project !== undefined) {
        // 创建成功：立即切换到新书（修复"建完没反应、以为失败又点一次"的问题）。
        activeRef.current = json.project
        setActiveId(json.project)
        setShowWizard(false)
        void loadAll(json.project).catch((err) => setError(String(err instanceof Error ? err.message : err)))
        void fetchJson(`/textbook/projects?${sess()}`).then((list) => setProjects(list.projects ?? [])).catch(() => {})
      }
    })
  }

  const uploadSource = async (file, role) => {
    const bytes = await file.arrayBuffer()
    const url = `/textbook/upload?${sess()}&project=${encodeURIComponent(activeRef.current)}&name=${encodeURIComponent(file.name)}&role=${encodeURIComponent(role)}`
    const res = await fetch(url, { method: 'POST', body: bytes })
    let json = null
    try { json = await res.json() } catch { json = null }
    if (!res.ok) throw new Error((json !== null && json.error) || `HTTP ${res.status}`)
    await loadAll(activeRef.current)
  }

  // AI 识别每本 PDF 的角色（一次请求识别全部）。
  const identifyRoles = async (files) => {
    const json = await fetchJson('/textbook/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'suggest-roles', session: sessionRef.current, files }),
    })
    return json.roles ?? []
  }

  const convert = () => { void postAction({ action: 'convert-start' }) }
  const resume = () => { void postAction({ action: 'resume' }) }
  // 强制中断（Task 17 顶栏 ⏸）：记账 → 取消主 AI → 逐个中断子代理，绝不 followup（后端契约）。
  const pause = () => { void postAction({ action: 'pause' }) }

  const saveMineruToken = () => {
    if (mineruToken.trim() === '') return
    void postAction({ action: 'settings', mineruToken: mineruToken.trim() }).then(() => {
      setMineruSet(true)
      setMineruResetOpen(false) // F20：保存成功后回到掩码态
      setMineruToken('')
    })
  }

  const togglePreview = () => {
    if (preview !== null) { setPreview(null); return }
    void fetch(`/textbook/file?${sess()}&project=${encodeURIComponent(activeRef.current)}&path=work/book.md`)
      .then((res) => res.text())
      .then((text) => setPreview(text))
      .catch((err) => setError(String(err instanceof Error ? err.message : err)))
  }

  const lastEvent = events.length > 0 ? events[events.length - 1] : null
  const qualityEvent = [...events].reverse().find((event) => event.type === 'textbook/quality')
  const checks = qualityEvent?.data?.checks ?? []
  const aiReportEvent = [...events].reverse().find((event) => event.type === 'textbook/ai-report')
  const aiReport = aiReportEvent?.data?.report ?? null
  const progressEvent = [...events].reverse().find((event) => event.type === 'textbook/progress')
  const progressDetail = progressEvent !== undefined
    ? `${progressEvent.data?.label ?? ''}${progressEvent.data?.detail ? `：${progressEvent.data.detail}` : ''}`
    : ''
  const STAGE_HUMAN = { explore: '源探查', outline: '章节骨架', gold: '最佳范例章', chapters: '铺章', merge: '合并成书', final: '最后检查' }
  const pendingStageLabel = pendingStageView === 'gate'
    ? `设计提案·第 ${pendingGateView ?? '?'} 关`
    : (STAGE_HUMAN[pendingStageView] ?? '')
  const humanTurn = meta !== null && (
    meta.status === 'awaiting-explore'
    || meta.status === 'awaiting-outline'
    || meta.status === 'awaiting-gold'
    || meta.status === 'awaiting-chapters-review'
    || (gate !== null && gate.status === 'awaiting')
    || (meta.phase === 1 && gate === null)
  )
  const needsConfigText = lastEvent?.type === 'textbook/error'
    ? `${lastEvent.data?.task ?? ''}失败：${lastEvent.data?.message ?? ''}`
    : '请先配置大模型接口（右上角设置 → 模型），配好后点"继续"。'

  const showWizardForm = meta === null && !loading

  // 顶栏介入工具条：风格线/留言清单（旧账本 ?? [] 兜底）与面板开关/暂停入口。
  const styleNotes = (meta?.styleNotes ?? []).filter((n) => n.status === 'active')
  const pendingIvs = (meta?.pendingInterventions ?? []).filter((i) => i.status === 'pending')
  const openStylePanel = () => setShowStylePanel((v) => !v)
  const openIntervene = () => setShowIntervenePanel((v) => !v)
  // 🧩 自定义模式库：拉取本书已有模式卡清单 / 分析粘贴文本并加入模式库。
  const loadPatterns = () => {
    if (activeRef.current === null) return
    void fetchJson('/textbook/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'pattern-list', project: activeRef.current, session: sessionRef.current }),
    }).then((json) => { if (json?.ok === true) setPatternList(json.patterns ?? []) }).catch(() => {})
  }
  const analyzePattern = async (text) => {
    setPatternBusy(true)
    setPatternResult(null)
    try {
      const json = await postAction({ action: 'pattern-analyze', text })
      if (json !== null && json.ok === true) setPatternResult(json.card)
      loadPatterns()
    } finally {
      setPatternBusy(false)
    }
  }

  // 门控：只在「造书模式」会话显示工作台；未知（null）时放行（新会话首次加载）。
  if (sessionPreset !== null && sessionPreset !== 'textbook') {
    return createElement('div', { style: S.container },
      createElement('p', { style: S.title }, '造书工作台'),
      createElement('div', { style: S.card },
        createElement('p', { style: { margin: '0 0 6px' } }, '本会话不是「造书模式」，工作台不在这里显示。'),
        createElement('p', { style: { margin: '0', opacity: 0.8 } }, '使用方式：新建会话时，在模式里选择「造书模式」，工作台就会出现在那个会话里。'),
      ),
    )
  }

  // 顶栏介入工具条（布局 A：地图栏与焦点区之上；只在有活动书时出现——无书时是向导/加载态）。
  const topBar = meta !== null && !loading
    ? createElement(TopBar, { meta, openStylePanel, openIntervene, pause, resume })
    : null

  // 非项目态（向导/加载/无书）：单滚动内容。
  const simpleContent = createElement('div', { style: S.container },
    createElement('p', { style: S.title }, '造书工作台'),
    createElement('p', { style: S.hint }, '本会话独立使用，一个会话只造一本书。主 AI 亲手推进流水线，轮到你要拍板/确认时亮起 ⚡；每个拍板点都自动存档，随时能改。'),
    createElement(MineruTokenCard, {
      mineruSet, mineruToken, busy,
      onTokenChange: (e) => setMineruToken(e.target.value),
      onSave: saveMineruToken,
      resetOpen: mineruResetOpen,
      onToggleReset: () => setMineruResetOpen((v) => !v),
    }),
    error !== null ? createElement('p', { style: S.error }, `⚠️ ${error}`) : null,
    loading ? createElement('p', { style: S.hint }, '加载中…')
      : showWizardForm
        ? createElement(WizardCard, {
            onCreate: createBook,
            onCreateDemo: () => { void postAction({ action: 'demo-run' }).then((json) => { if (json?.project) { activeRef.current = json.project; setActiveId(json.project); setShowWizard(false); void loadAll(json.project) } }) },
            busy,
            suggestions,
            suggestLoading,
            onCancel: () => setShowWizard(false),
            onSuggest: (hintText) => requestSuggest(hintText),
          })
        : createElement('p', { style: S.hint }, '还没有书项目，点"＋ 新建书"开始。'),
  )
  // 有书时的三区主体：左地图栏 | 右列（上焦点区独立滚动 + 下对话台固定底部）。
  // 写成函数延迟构造：meta 为 null（向导/加载态）时不该碰 meta 字段，避免空指针。
  const projectView = () => createElement('div', { style: { display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' } },
    // 左：过程地图栏（Task 15 三区骨架 P3；点任意段 -> 焦点区切浏览视图）。
    createElement(ProcessMapRail, {
      segments: processSegs, status: meta?.status ?? null,
      browsingKey: browsing,
      onSelect: (key) => {
        setBrowsing(key) // 点任意段 -> 焦点区浏览视图（Task 10 HistoryBrowser）
        // F47（2026-08-20）：切段清掉上一个段的产物查看，并自动打开该段第一个产物。
        setViewing(null)
        setViewText(null)
        const seg = processSegs.find((s) => s.key === key)
        const first = seg?.artifacts?.[0]
        if (typeof first === 'string' && first !== '') void viewWork({ path: first, label: first })
        // 开始浏览时记住当前进度序号：这之后 AI 再出的 progress 才算「新进展」（方案 A）。
        const lastProgress = [...eventsRef.current].reverse().find((e) => e.type === 'textbook/progress')
        progressSeqRef.current = lastProgress?.seq ?? -1
        setProgressBanner(false)
      },
    }),
    // 右：上=焦点区（统一滚动容器，浏览/各状态卡/面板整体迁入），下=对话台（固定底部）。
    createElement('div', { style: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 } },
      createElement('div', { style: { position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 16px' } },
        // 自动跟随横幅（F5 方案 A）：等拍板强制回「现在」（6 秒自清）；浏览历史时 AI 有新进展（点击清浏览回现在）。
        awaitBanner
          ? createElement(AutoFollowAwaitNote, { onClose: () => setAwaitBanner(false) })
          : null,
        progressBanner && browsing !== null
          ? createElement(AutoFollowProgressNote, {
              onJump: () => { setBrowsing(null); setProgressBanner(false) },
              onDismiss: () => setProgressBanner(false),
            })
          : null,
        // 不打断提示条（F17）：铺章中提交风格线/留言/意见成功后，焦点区顶部滑入、6 秒自清。
        noteToast
          ? createElement(InterruptNote, { onClose: () => setNoteToast(false) })
          : null,
        // 业务头（原 workbenchContent 头部迁入焦点区顶）：书名/取消书、MinerU、错误。
        createElement('div', { style: { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' } },
          createElement('strong', { style: { fontSize: '15px' } }, `📖 ${meta.name ?? activeId}`),
          deletingId === activeId
            ? createElement('button', {
                style: { ...S.smallLink, color: 'var(--dsw-danger, #cf222e)' },
                onClick: () => deleteBook(activeId),
                disabled: busy,
              }, '确认取消这本书（进回收站）')
            : createElement('button', {
                style: S.smallLink,
                onClick: () => setDeletingId(activeId),
              }, '取消这本书'),
          createElement('button', {
            style: S.smallLink,
            onClick: () => { setPatternOpen(true); loadPatterns() },
            title: '粘贴一段你想要的教法/结构描述，AI 会把它加进这本书的模式库',
          }, '🧩 自定义模式'),
        ),
        // MinerU Token 卡只在该配置「还没完成」时留在有书面板（「还差一步」引导）；
        // 已设置后只在无书向导（定书名）页出现，不再占面板空间（2026-08-21 需求）。
        mineruSet === false
          ? createElement(MineruTokenCard, {
              mineruSet, mineruToken, busy,
              onTokenChange: (e) => setMineruToken(e.target.value),
              onSave: saveMineruToken,
              resetOpen: mineruResetOpen,
              onToggleReset: () => setMineruResetOpen((v) => !v),
            })
          : null,
        error !== null ? createElement('p', { style: S.error }, `⚠️ ${error}`) : null,
        // 浏览态：优先历史分段回看（「回到现在」回到现场，Task 10 提供，保持原位）。
        // F22：浏览态下该段「产物」查看内容渲染在卡片正下方（BrowseSection 内）；
        // 主进度条（PhaseBar）隐藏，回到现在（browsing=null）后才显示。
        browsing != null
          ? createElement(BrowseSection, {
              segment: (processSegs ?? []).find((seg) => seg.key === browsing) ?? null,
              meta, busy, viewing, viewText,
              onBack: () => setBrowsing(null),
              onView: (rel) => viewWork({ path: rel, label: rel }),
              onDeepModify: (segmentKey, note) => {
                void postAction({ action: 'deep-modify', segment: segmentKey, note })
                setBrowsing(null)
              },
              onDeepUndo: () => { void postAction({ action: 'deep-undo' }) },
              onCloseView: () => setViewing(null),
            })
          : null,
        // 顶栏 🎨 风格线 / 📮 留言 展开面板（Task 17 常驻入口；点开即见清单，再点或 ✕ 收起）。
        showStylePanel
          ? createElement(StylePanel, { notes: styleNotes, onClose: () => setShowStylePanel(false) })
          : null,
        showIntervenePanel
          ? createElement(IntervenePanel, { items: pendingIvs, onClose: () => setShowIntervenePanel(false) })
          : null,
        // 🧩 自定义模式库面板（2026-08-21）：粘贴描述 → AI 分析成「模式卡」加入本书。
        patternOpen
          ? createElement(PatternPanel, {
              patterns: patternList, busy: patternBusy, result: patternResult,
              onAnalyze: analyzePattern,
              onClose: () => setPatternOpen(false),
            })
          : null,
        // F22：主进度条（顶部阶段卡）在浏览态（browsing 非空）隐藏，回到现在才显示。
        mainProgressVisible(browsing)
          ? createElement(PhaseBar, {
              phase: meta.phase ?? 1, gate, status: meta.status, humanTurn,
              onSelect: (phase) => {
                const product = phaseProduct(phase)
                if (product === null) return
                if (phase === 1) { setShowMaterials(true); setViewing(null); return }
                viewWork(product)
              },
              productOf: phaseProduct,
            })
          : null,
        createElement(StatusStrip, { meta, gate, pendingStage: pendingStageView, progressDetail, metaLabel: pendingStageLabel }),
        // 主 AI 活性行（F17）：常驻一行——AI 回合进行中 / 账面 N 分钟没动静[戳一下 AI] / 等你拍板。
        createElement(ActivityLine, {
          meta,
          aiActive: partialActive || (meta?.status === 'running' && (Date.now() - (meta.updatedAt ?? 0)) < 3 * 60 * 1000),
          onNudge: () => { void postAction({ action: 'nudge', text: '账面有一会没动了，请查状态继续推进' }) },
          subagents: processSubagents,
        }),
        bookDir !== null
          ? createElement('p', { style: { margin: '6px 0 0', fontSize: '12px', opacity: 0.6, wordBreak: 'break-all' } },
              `📁 书文件夹：${bookDir}`)
          : null,
        gate !== null && gate.status === 'awaiting'
          ? createElement(GatePanel, { gate, onDecide: decide, onRollback: rollback, busy, error: null, onAddPattern: analyzePattern })
          : meta.status === 'awaiting-explore'
            ? createElement(ExploreConfirmCard, {
                meta, exploreSummary,
                project: activeId, session: sessionRef.current,
                onConfirm: confirmExplore,
                onViewReport: () => viewWork({ path: 'work/explore.md', label: '源探查报告' }),
                busy,
              })
            : meta.status === 'awaiting-outline'
              ? createElement(OutlineConfirmCard, {
                  meta, busy,
                  onConfirm: confirmOutline,
                })
              : meta.status === 'awaiting-gold'
                ? createElement(GoldTable, {
                    meta, busy,
                    goldDrafts, goldDraftVersion,
                    postAction,
                    onSuggestWords: async () => {
                      const json = await fetchJson('/textbook/action', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                        body: JSON.stringify({
                          action: 'suggest-words', session: sessionRef.current, project: activeRef.current,
                          goal: meta.goal, route: meta.route, science: meta.science,
                          chapterCount: (meta.outline?.chapters ?? []).length,
                        }),
                      })
                      return json.suggestion ?? null
                    },
                    fetchText: (path) => fetch(`/textbook/file?${sess()}&project=${encodeURIComponent(activeRef.current)}&path=${encodeURIComponent(path)}`)
                      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.text() }),
                  })
                : meta.status === 'delivered'
                  ? createElement(DeliveryCard, {
                      project: activeId, session: sessionRef.current, checks, onPreview: togglePreview, preview, busy, meta, aiReport,
                      styleNotes: meta.styleNotes, // 风格线落实清单：从 meta 传入，内部 ?? [] 兜底（旧账本无此字段）
                    })
                  : meta.phase === 5 && meta.demo !== true
                    ? createElement(ChaptersCard, {
                        meta, chapterStatus, pendingReviews, progressDetail,
                        reviewMode: meta.status === 'awaiting-chapters-review',
                        onApproveAll: () => { void postAction({ action: 'chapters-review-confirm', approved: true }) },
                        onView: (n) => viewWork({ path: `work/chapter-${String(n).padStart(2, '0')}.md`, label: `第 ${n} 章` }),
                        onReview: submitReview,
                        busy,
                        events, // F17 章级「完成」态推导用（agent-end 事件 → 第N章）
                        workFiles, // F17 「看看这章」置灰用（chapter 文件不在产物清单就禁用）
                        project: activeId, session: sessionRef.current, postAction, // F39 过目态内联展开/段级三键
                      })
                    : meta.phase === 1
                      ? createElement(UploadArea, {
                          sources: meta.sources ?? [], converting: meta.converting === true,
                          onUpload: uploadSource, onConvert: convert, onIdentify: identifyRoles, busy,
                        })
                      : createElement(StatusCard, {
                          meta, lastEvent, events, needsConfig: needsConfigText, onResume: resume, busy,
                          pendingStageLabel, progressDetail,
                          // F31：AI 流式干活（partialActive）或账本 3 分钟内有动 → 抑制「可能卡住了」误报（口径同活性行 L2759）。
                          aiActive: partialActive || (meta?.status === 'running' && (Date.now() - (meta.updatedAt ?? 0)) < 3 * 60 * 1000),
                          // F28：error 态删书重来入口——复用既有 deletingId/deleteBook 两步删除机制（与业务头同源）。
                          onDeleteStart: () => setDeletingId(activeId),
                          onDeleteConfirm: () => deleteBook(activeId),
                          deletingId: deletingId === activeId,
                        }),
        createElement('div', { style: { margin: '8px 0' } },
          createElement('button', { style: S.smallLink, onClick: () => setShowHistory(!showHistory) },
            showHistory ? '▾ 收起之前的过程' : '▸ 之前的过程（点开可回放抽查）'),
        ),
        showHistory
          ? events.map((event) => {
              const product = workPathForEvent(event)
              const isGate = event.type === 'textbook/gate-proposal'
              const detailOpen = gateOpen === event.seq
              const clickable = product !== null || isGate
              const viewingThis = product !== null && viewing !== null && viewing.path === product.path
              return createElement('div', {
                key: event.seq,
                style: {
                  ...S.card,
                  ...(clickable ? { cursor: 'pointer' } : {}),
                  ...(viewingThis ? { borderColor: 'var(--dsw-accent, #4f6ef7)' } : {}),
                },
                onClick: clickable
                  ? () => {
                      if (product !== null) viewWork(product)
                      else if (isGate) setGateOpen(detailOpen ? null : event.seq)
                    }
                  : undefined,
              },
                createElement('div', null,
                  createElement('span', null, cardIcon(event)),
                  ' ',
                  createElement('strong', null, cardText(event)),
                  product !== null
                    ? createElement('span', { style: { marginLeft: '8px', fontSize: '12px', color: 'var(--dsw-accent, #4f6ef7)' } },
                        viewingThis ? '👁️ 查看中' : '📄 查看结果')
                    : null,
                  createElement('span', { style: { float: 'right', opacity: 0.6, fontSize: '12px' } }, formatTime(event.time)),
                ),
                isGate
                  ? detailOpen
                    ? createElement('div', { style: { marginTop: '6px', fontSize: '12px', opacity: 0.9 } },
                        createElement('p', { style: { margin: '0 0 4px' } }, event.data?.summary ?? ''),
                        (event.data?.detail ?? '') !== ''
                          ? createElement('pre', { style: { whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'var(--dsw-surface, #fff)', borderRadius: '6px', padding: '8px', fontSize: '12px', margin: '4px 0 0' } }, event.data.detail)
                          : null,
                      )
                    : (event.data?.summary ?? '') !== ''
                      ? createElement('div', { style: { marginTop: '6px', opacity: 0.85 } }, event.data.summary)
                      : null
                  : null,
              )
            })
          : null,
        showMaterials
          ? createElement('div', { style: { marginTop: '8px', border: '1px solid var(--dsw-border, #d0d7de)', borderRadius: '8px', padding: '10px' } },
              createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                createElement('strong', { style: { fontSize: '13px' } }, '📄 第一步 · 材料准备'),
                createElement('button', { style: S.smallLink, onClick: () => setShowMaterials(false) }, '✕ 收起'),
              ),
              (meta.sources ?? []).length === 0
                ? createElement('p', { style: { margin: '6px 0 0', fontSize: '12px', opacity: 0.7 } }, '还没有上传材料。')
                : (meta.sources ?? []).map((source) =>
                    createElement('div', { key: source.file, style: { margin: '6px 0', display: 'flex', gap: '8px', alignItems: 'center' } },
                      createElement('span', { style: { flex: 1, fontSize: '12px', wordBreak: 'break-all' } },
                        `${source.converted === true ? '✅' : '⏳'} ${source.file}（${source.role ?? ''}）`),
                      source.converted === true && typeof source.md === 'string' && source.md !== ''
                        ? createElement('button', {
                            style: S.smallLink,
                            onClick: () => viewWork({ path: `sources-md/${source.md}`, label: `转换内容：${source.file}` }),
                          }, '查看转换内容')
                        : null,
                    ),
                  ),
            )
          : null,
        // F22：文件查看器——浏览态下已在 BrowseSection 里紧贴段卡片渲染，这里只在
        // 「现在」视图（browsing=null，顶栏/事件卡/材料入口打开）渲染，避免同一内容两处出现。
        browsing === null && viewing !== null && viewText !== null
          ? createElement(FileViewer, { viewing, viewText, onClose: () => setViewing(null) })
          : null,
      ),
      // 下：对话台（右下镜像宿主对话；分界可拖、可收成一条）。焦点区在它上面独立滚动。
      // 收起态（默认）压成单行高，只留「展开对话台」入口；展开态才是对话区本体。
      createElement('div', { ref: deskRef, style: { height: deskCollapsed ? '32px' : `${deskLiveRef.current ?? deskHeight}px`, flexShrink: 0, borderTop: '1px solid var(--dsw-border, #d0d7de)', position: 'relative' } },
        createElement('div', { // 拖拽分界手柄
          style: { position: 'absolute', top: '-4px', left: 0, right: 0, height: '8px', cursor: 'ns-resize' },
          onMouseDown: startDeskDrag,
        }),
        deskCollapsed
          ? createElement('button', { style: { ...S.smallLink, margin: '6px auto', display: 'block' }, onClick: () => setDeskCollapsed(false) }, '🤝 展开对话台')
          // 对话台的滚动容器移进 ChatDesk 自己（钉底滚动回归修复在组件内），展开态直接渲染组件。
          : createElement(ChatDesk, {
              useSession: props.useSession,
              events, // Task 20 回执徽章用（workbench 事件数组）
              onNudge: () => { void postAction({ action: 'nudge', text: '工作台还没跟上，请把刚才答应的事落账（style-note/progress 等）' }) },
              onCollapse: () => setDeskCollapsed(true),
            }),
      ),
    ),
  )

  // 三区布局（布局 A）：顶栏常驻其上；主体=有书时三区（地图栏+焦点区+对话台）、无书时单滚动内容。
  // 外层 overflow:hidden 保证只有焦点区/地图栏在滚，不带动页面。
  return createElement('div', {
    ref: rootRef,
    style: { display: 'flex', flexDirection: 'column', height: rootH !== null ? `${rootH}px` : '100%', minHeight: 0, overflow: 'hidden' },
  },
    topBar,
    meta !== null && !loading
      ? projectView()
      : createElement('div', { style: { flex: 1, minHeight: 0, overflow: 'auto' } }, simpleContent),
  )
}

// ── 谈判桌·纯函数（分段/摘要/段级对比） ─────────────────────────────────────

/** 把稿子按空行切成段（1 基编号 = 下标 + 1），丢掉空白段。 */
export function splitParagraphs(text) {
  return String(text ?? '')
    .split(/\n\s*\n/)
    .map((para) => para.trim())
    .filter((para) => para !== '')
}

/** 段落一句话摘要（意见 hint 用）：压空白、取前 40 字。 */
export function paragraphHint(para) {
  return String(para ?? '').replace(/\s+/g, ' ').trim().slice(0, 40)
}

/**
 * 行内最小 markdown 渲染（正文流式阅读用，不引依赖，全用 React.createElement）：
 * - `**加粗**` -> <strong>；
 * - `#`/`##` 开头 -> 加粗标题段；
 * - `- ` 开头 -> 列表行（前面加项目符号）；
 * - 其余原样当纯文本。
 * 恒返回节点数组（文本 + 元素混排），可直接 ... 展开成 createElement 的 children。
 */
export function renderInline(text) {
  const str = String(text ?? '')
  const head = /^(#{1,2})\s+(.+)$/.exec(str)
  if (head !== null) return [createElement('strong', { style: { fontSize: '16px' } }, ...inlineBold(head[2]))]
  const list = /^[-*]\s+(.+)$/.exec(str)
  if (list !== null) return [createElement('span', { style: { display: 'block' } }, '• ', ...inlineBold(list[1]))]
  return inlineBold(str)
}

/** 把 `**加粗**` 切成 [文本, strong, 文本, ...] 的节点数组：odd 下标是加粗段。 */
function inlineBold(s) {
  const parts = String(s).split(/(\*\*.+?\*\*)/g)
  const nodes = []
  for (let i = 0; i < parts.length; i += 1) {
    if (parts[i] === '') continue
    nodes.push(i % 2 === 1 ? createElement('strong', { key: i }, parts[i].slice(2, -2)) : parts[i])
  }
  return nodes
}

/** 段级最长公共子序列对比：返回按稿面顺序排好的操作序列（下标 0 基）。 */
export function diffParagraphs(oldParas, newParas) {
  const n = oldParas.length
  const m = newParas.length
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = oldParas[i] === newParas[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const ops = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (oldParas[i] === newParas[j]) { ops.push({ type: 'same', old: i, new: j }); i += 1; j += 1 }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ type: 'del', old: i }); i += 1 }
    else { ops.push({ type: 'add', new: j }); j += 1 }
  }
  while (i < n) { ops.push({ type: 'del', old: i }); i += 1 }
  while (j < m) { ops.push({ type: 'add', new: j }); j += 1 }
  return ops
}

export function apply(ctx) {
  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view',
    id: 'dsh-craft-your-textbook',
    order: 20,
    label: () => '工作台',
    inject: () => ({}),
  }, WorkbenchView))
  // 造书会话首次对话后自动打开工作台页签（头部小工具位，常驻但不占视觉空间）。
  ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
    name: 'conversation.session.header.utilities',
    id: 'textbook-autoopen',
    order: 99,
  }, AutoOpenWorkbench))
  ctx.logger.info('[ui-textbook-run] 工作台视图已注册（过程地图 + 对话台 + 自动打开）')
}
