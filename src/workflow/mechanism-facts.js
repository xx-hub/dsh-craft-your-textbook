/**
 * 机器事实的只读投影（票 `skill-catchup/09`）。
 *
 * 本模块只做两件事：把 `src/` 里**已经存在**的声明面读成一份纯对象，再把同一份对象
 * 渲染成给人/给 AI 读的固定文本。它不是权威源——权威仍在各声明面；这里不复制任何表，
 * 也不改运行期行为。
 *
 * 两个导出是仅有的出口：
 *   · `mechanismFacts()` —— 纯投影；不读盘、不读时钟、不取随机数。
 *   · `renderMechanism(facts)` —— **唯一一份**渲染；同输入同输出，不写生成时间、不写绝对路径。
 *
 * ⚠️ 工具面**不手抄**：用只实现 `register` 的假 `ctx` 调 `agent-tool.js` 的 `apply()`，
 * 从注册后的两个 def 读名字/说明/参数键。`execute` 一次都不跑，因此不联网、不读本机 DSH。
 *
 * ⚠️ 三张阶段表**不合并**：`ACT_STAGES`（交办成员）、`STAGE_LABELS`（标签面）、
 * `STAGE_HUMAN`（界面面）分别进 `stages.handoff`/`label`/`ui`，差异只进 `stages.gaps`。
 * 今天 `goal` 是真实缺口：有标签、有交工分支，但不在工具枚举与界面面里——本模块如实记录，
 * 不替它选边。
 */
import {
  ACT_STAGES,
  BOOK_PRODUCT_FAMILIES,
  GATE_TOPIC,
  LEGACY_ARCHIVE_DIR_NAME,
  LEGACY_CONVERTED_DIR_NAME,
  LEGACY_DIR_RELS,
  LEGACY_PROPOSAL_DIR_NAME,
  LEGACY_WORK_DIR_NAME,
  PHASES,
  QUALITY_CHECKS_TAIL_NAMES,
  gateHuman,
} from '../domain-rules.js'
import { STAGE_LABELS, stageLabel } from './engine/labels.js'
import { STAGE_HUMAN } from '../ui/view-rules.js'
import { listAgentActionInputs, listContractActions } from '../contract-actions.js'
import { dispatchKindSpec, dispatchKinds } from './dispatch-assembly.js'
import { artifactDataForGate } from './artifact-fields.js'
import {
  NEXT_STAGE_VALUES,
  PER_CHAPTER,
  STEP_INPUT_ROWS,
  STEP_OUTPUT_ROWS,
  STEP_SUB_OUTPUT_ROWS,
} from './engine.js'
import { apply } from '../agent-tool.js'

const SUMMARY_LIMIT = 80

/** 说明文字的摘要：压成一行，取到第一个句号/分号为止，超长时截断并加省略号。 */
function summarize(description) {
  const text = String(description ?? '').replace(/\s+/g, ' ').trim()
  const stop = text.search(/[。；]/)
  const head = stop === -1 ? text : text.slice(0, stop)
  return head.length <= SUMMARY_LIMIT ? head : `${head.slice(0, SUMMARY_LIMIT - 1)}…`
}

/** 用假 `ctx` 跑一次注册，只读两个工具定义的形状；不调用 `execute`。 */
function registeredTools() {
  const registered = []
  apply({ tools: { register(definition) { registered.push(definition) } } }, {}, {})
  return registered.map((definition) => ({
    name: String(definition.name ?? ''),
    summary: summarize(definition.description),
    parameterKeys: Object.keys(definition.parameters?.properties ?? {}).sort(),
  }))
}

/** 逐行浅拷贝：函数条目保持原身份，不许换成字符串或手补章路径。 */
function copyRows(rows) {
  return Object.fromEntries(
    Object.entries(rows).map(([stage, row]) => [stage, Array.isArray(row) ? [...row] : row]),
  )
}

const HANDOFF = [...ACT_STAGES]
const LABEL = Object.keys(STAGE_LABELS)
const UI = Object.keys(STAGE_HUMAN)
/**
 * `stage-submit` 的分支面：本投影只许读声明面，读不到 `actions/chapters.js` 的 switch，
 * 所以按 交办成员 ∪ 标签面 派生；今天恰为 8 个，只在 switch 里新增的分支这里看不见。
 */
const SUBMIT = [...new Set([...HANDOFF, ...LABEL])]
/**
 * 缺口＝出现在某张表里、却不在工具 `stage` 枚举（由 `ACT_STAGES` 派生）里的阶段。
 * `gate` 不在标签面，但它在交办成员与界面面里，且有 `stageLabel()` 的特判——不算这一档缺口。
 */
const GAPS = [...new Set([...HANDOFF, ...LABEL, ...UI])]
  .filter((stage) => !HANDOFF.includes(stage))
  .map((stage) => ({
    stage,
    inLabel: LABEL.includes(stage),
    inSubmit: SUBMIT.includes(stage),
    inHandoff: HANDOFF.includes(stage),
    inUi: UI.includes(stage),
    inTool: HANDOFF.includes(stage),
  }))

const ADVANCE = Object.fromEntries(HANDOFF.map((stage, i) => [stage, NEXT_STAGE_VALUES[i]]))

/**
 * 动作目录的调用面（从 `listContractActions()` 派生，不手抄名单）：
 * AI 可调用／不可调用、`workbenchExposure` 三档计数。
 */
const ACTION_CATALOG = listContractActions()
const CALLABLE_ACTIONS = ACTION_CATALOG.filter((action) => action.agentCallable)
const NON_CALLABLE_ACTIONS = ACTION_CATALOG.filter((action) => !action.agentCallable)
const EXPOSURE_LEVELS = ['callable', 'read-only', 'null']
const exposureName = (action) => (action.workbenchExposure === null ? 'null' : String(action.workbenchExposure))
const EXPOSURE_COUNTS = Object.fromEntries(
  EXPOSURE_LEVELS.map((level) => [level, ACTION_CATALOG.filter((action) => exposureName(action) === level).length]),
)

/** 十档派发各自的模板落点（`dispatchKindSpec(kind).shapeRel`，不复制模板正文）。 */
const DISPATCH_TEMPLATES = dispatchKinds().map((kind) => ({
  kind,
  shapeRel: dispatchKindSpec(kind).shapeRel,
}))

/**
 * 按阶段一行：行＝`handoff ∪ label`（今天 8 个；`stage-submit` 的 `goal` 因此进来）。
 * `未登记` 一律表示**这张表没有这一行**，不手补：`gate` 不在 `STAGE_LABELS`（`stageLabel('gate')`
 * 是调用点按关卡号现拼的，本表不替它编一个关卡号），`goal` 没有输入／产物行与推进。
 */
const STAGE_ROWS = [...new Set([...HANDOFF, ...LABEL])].map((stage) => {
  const hasInput = Object.prototype.hasOwnProperty.call(STEP_INPUT_ROWS, stage)
  const hasOutput = Object.prototype.hasOwnProperty.call(STEP_OUTPUT_ROWS, stage)
  return {
    id: stage,
    machineLabel: Object.prototype.hasOwnProperty.call(STAGE_LABELS, stage) ? stageLabel(stage) : '未登记',
    uiLabel: Object.prototype.hasOwnProperty.call(STAGE_HUMAN, stage) ? STAGE_HUMAN[stage] : '未登记',
    hasInput,
    inputRow: hasInput
      ? (Array.isArray(STEP_INPUT_ROWS[stage]) ? [...STEP_INPUT_ROWS[stage]] : STEP_INPUT_ROWS[stage])
      : null,
    hasOutput,
    outputRow: hasOutput
      ? (Array.isArray(STEP_OUTPUT_ROWS[stage]) ? [...STEP_OUTPUT_ROWS[stage]] : STEP_OUTPUT_ROWS[stage])
      : null,
    advance: ADVANCE[stage] ?? '未登记',
  }
})

/** 老名 → 新名的四条配对（`LEGACY_DIR_RELS` 是唯一一份，渲染只排成一行）。 */
const LEGACY_PAIRS = LEGACY_DIR_RELS.map((pair) => ({ legacy: pair.legacy, current: pair.current }))

/**
 * 投影出机器事实的纯对象。顶层恰好九个键：
 * `tools`、`actions`、`dispatchKinds`、`phases`、`stages`、`artifacts`、`gates`、`quality`、`sources`。
 */
export function mechanismFacts() {
  const handoff = [...HANDOFF]
  const label = [...LABEL]
  const ui = [...UI]
  const submit = [...SUBMIT]

  return {
    tools: registeredTools(),
    actions: [...listAgentActionInputs()],
    dispatchKinds: [...dispatchKinds()],
    phases: PHASES.map((phase) => ({ n: phase.n, label: phase.label })),
    stages: {
      handoff,
      label,
      submit,
      ui,
      gaps: GAPS.map((gap) => ({ ...gap })),
      rows: STAGE_ROWS.map((row) => ({ ...row })),
    },
    artifacts: {
      families: BOOK_PRODUCT_FAMILIES.map((family) => ({ ...family })),
      stepInputRows: copyRows(STEP_INPUT_ROWS),
      stepOutputRows: copyRows(STEP_OUTPUT_ROWS),
      stepSubOutputRows: copyRows(STEP_SUB_OUTPUT_ROWS),
      perChapter: PER_CHAPTER,
      proposal: { ...artifactDataForGate(1, 1) },
      legacy: {
        workDir: LEGACY_WORK_DIR_NAME,
        proposalDir: LEGACY_PROPOSAL_DIR_NAME,
        archiveDir: LEGACY_ARCHIVE_DIR_NAME,
        convertedDir: LEGACY_CONVERTED_DIR_NAME,
      },
      legacyPairs: LEGACY_PAIRS.map((pair) => ({ ...pair })),
      advance: { ...ADVANCE },
    },
    gates: {
      topics: Object.entries(GATE_TOPIC).map(([n, topic]) => ({
        n: Number(n),
        topic,
        human: gateHuman(n),
      })),
      advance: { ...ADVANCE },
      // 进度账本的边界句是**散文**：口径抄自 `engine.js` 的 `progressFreshnessNote()`，不在任何
      // 声明面里，所以机器改那句时本投影不会自动跟着变（如实记在 `sources.blind`）。
      ledger: '机器只报数——最后一条进度记录落在多久前、此后又交工了几章；不拦交工，够不够勤由人看。',
    },
    quality: {
      entry: 'runQualityChecks',
      tailNames: [...QUALITY_CHECKS_TAIL_NAMES],
    },
    sources: {
      read: [
        'src/domain-rules.js：ACT_STAGES、PHASES、GATE_TOPIC、gateHuman()、BOOK_PRODUCT_FAMILIES、QUALITY_CHECKS_TAIL_NAMES、LEGACY_DIR_RELS',
        'src/workflow/engine.js：PER_CHAPTER、STEP_INPUT_ROWS、STEP_OUTPUT_ROWS、STEP_SUB_OUTPUT_ROWS、NEXT_STAGE_VALUES',
        'src/workflow/engine/labels.js：STAGE_LABELS、stageLabel()',
        'src/ui/view-rules.js：STAGE_HUMAN（界面 label）',
        'src/contract-actions.js：listContractActions()／listAgentActionInputs()',
        'src/workflow/dispatch-assembly.js：dispatchKinds()／dispatchKindSpec()',
        'src/workflow/artifact-fields.js：artifactDataForGate()',
        'src/agent-tool.js：apply() 注册的两个工具定义',
      ],
      blind: [
        '只看得见声明面：没进这些常量的代码分支看不见；靠源码字面闭包交叉核对，而它只认 `case \'…\'` 与 `ctx.tools.register(...name: \'…\')` 两种形状。',
        '动态构造的名字看不见：变量拼出的 stage、从配置读出的工具名、跨文件别名、helper 返回的分支都不在扫面。',
        '`goal` 今天就是缺口：它在 `STAGE_LABELS` 与 `stage-submit`，不在 `ACT_STAGES`／工具 `stage` 枚举／`STAGE_HUMAN`；本投影只把差异钉住，不替它选边。',
        '`merge` 的输入行混着一条函数键（`chapterRel`，给小助手的 `auditScope.chapters`），渲染成「声明面为空（已知缺口）」，同格的字符串路径照常渲染；`gate` 的空数组渲染成「无产物」；两者不混，也不手补路径。',
        `质量门名单只是尾段（今天 ${QUALITY_CHECKS_TAIL_NAMES.length} 项，现算）：不含条件项、不含 style-spec 追加的 0–2 项；权威是 \`runQualityChecks\`。`,
        'UI 面只到 `STAGE_HUMAN`：卡片组件、画廊屏 id、按钮文案不在生成面。',
        '进度账本的边界句是散文：抄自 `src/workflow/engine.js` 的 `progressFreshnessNote()` 口径，不是从声明面派生的——机器改那句时本投影不会自动跟着变。',
        '`stages.submit` 是派生的：读不到 `actions/chapters.js` 的 switch，按交办成员 ∪ 标签面求并集；只在 switch 里新增的分支这里看不见。`gaps` 只记「出现在标签/界面面、却不在 `ACT_STAGES`／工具枚举」的阶段。',
        '42 份 references 的散文、`preset/`、`docs/`、`AGENTS.md` 不在面内；老名的逐字清单只许住 `src/domain-rules.js` 的改名记账区（与 `docs/adr/0031`），本投影只给指针。',
        '比较前行尾归一（`\\r\\n?`→`\\n`）；反证只证「比较器会咬」，不证「扫面全」。',
      ],
    },
  }
}

const quote = (value) => `\`${value}\``
const joinNames = (values) => values.map(quote).join('、')
const countOf = (values) => values.length

/**
 * 「来源：」行从 `facts.sources.read` 派生——文件清单只在投影那一处写，渲染不另抄一份。
 * `sources.read` 的每一项是「路径：读了什么」，这里只取 `：` 前的 `src/` 路径；
 * 非 `src/` 的读面仍留在 §窄处，但不进「来源：」这一行（这一行只列 `src/` 文件）。
 */
function sourceLine(sources) {
  const paths = sources.read
    .map((source) => String(source).split('：')[0].trim())
    .filter((path) => path.startsWith('src/'))
    .map(quote)
  return `来源：${paths.join('、')}`
}

/** 一行产物：空数组＝无产物；非字符串条目＝声明面为空（已知缺口）；两者不许混为一谈。 */
function renderRow(row, perChapter) {
  if (row === perChapter) return `按章产出（${quote(perChapter)}）`
  if (!Array.isArray(row) || row.length === 0) return '无产物'
  return row
    .map((entry) => (typeof entry === 'string' ? quote(entry) : '声明面为空（已知缺口）'))
    .join('、')
}

function renderRows(rows, perChapter) {
  return Object.entries(rows)
    .map(([stage, row]) => `  - ${quote(stage)}：${renderRow(row, perChapter)}`)
    .join('\n')
}

/**
 * 按阶段表的单元格：**没有这一行**＝未登记；空数组＝无产物；非字符串条目＝声明面为空（已知缺口）；
 * `PER_CHAPTER` 标记＝按章产出（per-chapter）。四种口径不许互相顶替。
 */
function renderCell(hasRow, row, perChapter) {
  if (!hasRow) return '未登记'
  if (row === perChapter) return '按章产出（per-chapter）'
  if (!Array.isArray(row) || row.length === 0) return '无产物'
  return row
    .map((entry) => (typeof entry === 'string' ? quote(entry) : '声明面为空（已知缺口）'))
    .join('、')
}

function presence(value) {
  return value ? '有' : '无'
}

/** 把同一份 facts 渲染成固定文本；这是全仓唯一一份渲染。 */
export function renderMechanism(facts) {
  const { tools, actions, dispatchKinds: kinds, phases, stages, artifacts, gates, quality, sources } = facts
  const lines = []

  lines.push('<!-- 生成物，勿手改；改机器请改 src/ 的声明面，再跑 node scripts/gen-skill-mechanism.mjs --write -->')
  lines.push(sourceLine(sources))
  lines.push('判据：`test/test-skill-mechanism-drift.mjs`（`npm test` main 段）')

  lines.push('')
  lines.push('## 工具面')
  lines.push(`- 共 ${countOf(tools)} 个工具；参数键取自注册后的定义，不执行 execute、不联网。`)
  for (const tool of tools) {
    const keys = tool.parameterKeys.length === 0 ? '无' : joinNames(tool.parameterKeys)
    lines.push(`- ${quote(tool.name)}：${tool.summary}；参数：${keys}`)
  }
  lines.push(`- 动作目录（listContractActions()）共 ${countOf(ACTION_CATALOG)} 项：AI 可调用 ${countOf(CALLABLE_ACTIONS)} 项（\`agentCallable=true\`）；AI 不可调用 ${countOf(NON_CALLABLE_ACTIONS)} 项：${joinNames(NON_CALLABLE_ACTIONS.map((action) => action.name))}。`)
  lines.push(`- \`workbenchExposure\` 三档：${EXPOSURE_LEVELS.map((level) => `${quote(level)} ${EXPOSURE_COUNTS[level]} 项`).join('、')}；\`null\` ＝「不在工作台直调面」。`)
  lines.push('- 「需用户明确同意」今天不是动作目录的声明字段（它散在个别动作的约束散文里），本投影不替你判。')

  lines.push('')
  lines.push('## 阶段表')
  lines.push(`- 六阶段（${countOf(phases)}）：${phases.map((phase) => `${phase.n} ${phase.label}`).join('；')}`)
  lines.push(`- 交办成员（handoff，${countOf(stages.handoff)}）：${joinNames(stages.handoff)}`)
  lines.push(`- 标签面（label，${countOf(stages.label)}）：${joinNames(stages.label)}`)
  lines.push(`- 交工分支（submit，${countOf(stages.submit)}）：${joinNames(stages.submit)}`)
  lines.push(`- 界面面（ui，${countOf(stages.ui)}）：${joinNames(stages.ui)}`)
  lines.push('')
  lines.push(`按阶段一行（\`handoff ∪ label\`，${countOf(stages.rows)} 个；列＝机器 label／界面 label／输入／产物／推进）：`)
  lines.push('')
  lines.push('| 阶段 id | 机器 label | 界面 label | 输入 | 产物 | 推进 |')
  lines.push('| --- | --- | --- | --- | --- | --- |')
  for (const row of stages.rows) {
    const machineLabel = row.machineLabel === '未登记' ? '未登记' : quote(row.machineLabel)
    const uiLabel = row.uiLabel === '未登记' ? '未登记' : quote(row.uiLabel)
    const advance = row.advance === '未登记' ? '未登记' : quote(row.advance)
    lines.push(`| ${quote(row.id)} | ${machineLabel} | ${uiLabel} | ${renderCell(row.hasInput, row.inputRow, artifacts.perChapter)} | ${renderCell(row.hasOutput, row.outputRow, artifacts.perChapter)} | ${advance} |`)
  }

  lines.push('')
  lines.push('## 三表对账')
  lines.push('- 三张表分别读、不合并：`ACT_STAGES` 管交办成员，`STAGE_LABELS` 管人话标签，`STAGE_HUMAN` 管界面词；差异只记在缺口里。')
  if (stages.gaps.length === 0) {
    lines.push('- 已知缺口（gaps，0 项）：三张表今天没有差异。')
  } else {
    lines.push(`- 已知缺口（gaps，${countOf(stages.gaps)} 项）：`)
    for (const gap of stages.gaps) {
      lines.push(`  - ${quote(gap.stage)}：label=${presence(gap.inLabel)}、submit=${presence(gap.inSubmit)}、handoff=${presence(gap.inHandoff)}、ui=${presence(gap.inUi)}、tool=${presence(gap.inTool)}。`)
    }
    lines.push(`- 缺口不抹平：${stages.gaps.map((gap) => quote(gap.stage)).join('、')} 出现在某些声明面、却不在工具 stage 枚举里；本投影不替它选边。`)
  }

  lines.push('')
  lines.push('## 产物路径')
  lines.push(`- 产物族（${countOf(artifacts.families)}）：`)
  for (const family of artifacts.families) {
    lines.push(`  - ${family.family} → ${quote(family.path)}（producer=${family.producer}、scope=${family.scope}、disclose=${family.disclose}）`)
  }
  lines.push(`- 阶段输入行（STEP_INPUT_ROWS）：\n${renderRows(artifacts.stepInputRows, artifacts.perChapter)}`)
  lines.push(`- 阶段产物行（STEP_OUTPUT_ROWS）：\n${renderRows(artifacts.stepOutputRows, artifacts.perChapter)}`)
  lines.push(`- 派出产物行（STEP_SUB_OUTPUT_ROWS）：\n${renderRows(artifacts.stepSubOutputRows, artifacts.perChapter)}`)
  if (artifacts.proposal?.path) {
    lines.push(`- 方案件：${quote(artifacts.proposal.path)}（\`artifactDataForGate()\` 的 v1 形状）`)
  }
  // 老名逐字清单**只许住改名记账区**（`src/domain-rules.js` 与 `docs/adr/0031`）：全仓维护面零命中的那道门
  // 会咬任何别的文件（`test/test-book-dir-rename.mjs`）。所以这里只渲染组数与指针，不打印老名——
  // `LEGACY_DIR_RELS` 仍是唯一那份清单，本渲染不另抄、也不开第二处记账面。
  lines.push(`- 老名（只读兼容，${countOf(artifacts.legacyPairs)} 组；写侧永远用新名）：逐字清单只许住 \`src/domain-rules.js\` 的改名记账区（与 \`docs/adr/0031\`），本生成物不复写。`)
  lines.push(`- 推进次序：${Object.entries(artifacts.advance).map(([from, to]) => `${quote(from)}→${quote(to)}`).join('；')}`)

  lines.push('')
  lines.push('## 闸门与推进')
  lines.push(`- 三次设计关卡（${countOf(gates.topics)}）：${gates.topics.map((gate) => gate.human).join('；')}`)
  lines.push(`- 进度账本：${gates.ledger}`)
  lines.push(`- 推进次序（NEXT_STAGE_VALUES）：${Object.entries(gates.advance).map(([from, to]) => `${quote(from)}→${quote(to)}`).join('；')}`)
  lines.push('- 停点与放行由 `gateHuman()` 的主题词与 `STAGE_LABELS` 呈现；本投影只说声明面里的事实，不判语义。')

  lines.push('')
  lines.push('## 质量门')
  lines.push(`- 权威入口：${quote(quality.entry)}`)
  lines.push(`- 尾段名单（${countOf(quality.tailNames)} 项，QUALITY_CHECKS_TAIL_NAMES）：${joinNames(quality.tailNames)}`)
  lines.push('- 尾段只是尾段，权威是 `runQualityChecks`；条件项与 style-spec 追加的 0–2 项不在名单里。')

  lines.push('')
  lines.push('## 派发')
  lines.push(`- 派发档（${countOf(kinds)}）：${joinNames(kinds)}`)
  lines.push(`- 模板落点（\`dispatchKindSpec(kind).shapeRel\`）：${DISPATCH_TEMPLATES.map((item) => `${quote(item.kind)}→${quote(item.shapeRel)}`).join('、')}`)
  // ⚠️ 这一行的数**已经漂过一次**（票 `reader-questionnaire-ai-authoring/04` 添了第十一档时它仍写「十档」）
  // ⇒ 现在从 `kinds.length` 现算，⛔ 不再手写一个数（同一个句子里已经有一个现算的数，两个数并存必漂）。
  lines.push(`- 这 ${countOf(kinds)} 档的派单正文由机器按模板代填（\`workbench_act(action=agent-assign, dispatchKind=…)\`）。`)
  lines.push(`- 主笔可调用动作（${countOf(actions)}）：${joinNames(actions)}`)
  lines.push(`- 用户操作、AI 不可调用的 ${countOf(NON_CALLABLE_ACTIONS)} 个动作见 §工具面。`)

  lines.push('')
  lines.push('## 窄处')
  lines.push('- 读了哪些声明面：')
  for (const source of sources.read) lines.push(`  - ${source}`)
  lines.push('- 看不见什么：')
  for (const blind of sources.blind) lines.push(`  - ${blind}`)
  const emptyOutputRows = Object.entries(artifacts.stepOutputRows)
    .filter(([, row]) => Array.isArray(row) && row.length === 0)
    .map(([stage]) => quote(stage))
  const opaqueInputRows = Object.entries(artifacts.stepInputRows)
    .filter(([, row]) => Array.isArray(row) && row.some((entry) => typeof entry !== 'string'))
    .map(([stage]) => quote(stage))
  lines.push(`- 本次投影里：空产物行＝${emptyOutputRows.length > 0 ? emptyOutputRows.join('、') : '无'}（渲染为「无产物」）；非字符串输入行＝${opaqueInputRows.length > 0 ? opaqueInputRows.join('、') : '无'}（渲染为「声明面为空（已知缺口）」）。`)

  return `${lines.join('\n')}\n`
}
