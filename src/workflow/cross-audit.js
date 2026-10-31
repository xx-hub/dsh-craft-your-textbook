/**
 * 合并前跨章审计（票 `.scratch/context-budget/issues/05` · ADR-0030 决策 2 · 改派第一刀 · merge 段）
 * 的**机器侧形状判据**：五项核对逐项有交代才放行合并。
 *
 * ## 这一层只断接线与形状（判据声称的强度＝实现强度）
 *
 * 它断的是「那五节在不在、每节有没有交代」——**不证明审计小助手真读了章**
 * （行号／引文是否真实，属真机层，票 07）。所以这里的名字、措辞与文档都按「形状」写。
 *
 * ## 第 7 条：跨章审计的**条数对账**（票 `knowledge-graph-build/11` · spec §5 第 7 条）
 *
 * 第 4 项那一节判「通过」时，交代行必须写成 `已核，未见——逐边清单 N 条全核（跨章 X／章内 Y），
 * 无倒置、无「只出现名字」`——机器从那一行里**解析 N／X／Y**，与它**自己现算的**（同一份清单，
 * 现算口径住 `cross-audit-ledger.js`）**逐数对账**，并要求 `N = X + Y`；**「无倒置」也机器判**
 * （机器算得出倒置条数：算出的条数与那一句对不上就判红）。
 * ⛔ 这一层**不判结论对错**（「数对得上、结论说反了」在这里全绿），⛔ **不判「是不是只出现名字」**，
 * ⛔ 也不判审计有没有真读原文。
 *
 * ⚠️ **我的枚举面比现实窄在哪里**（`dev-gate-scan/17`）：
 * · **对账解析的是报告的写法**（spec §5 末段逐字）：「这一行写对了」**不证明审计真读了原文**——
 *   把清单照抄一遍、数字抄对，本模块一样绿；真读没读属真机层（ADR-0005）。
 * · 「哪一节是清单那一项」按**判定表第 4 行**绑定（spec §4 逐字把逐边清单指给「第 4 项」）。
 *   判定表被重排／增删行时绑定会跟着挪——`test/test-cross-audit-ledger.mjs` 钉了一条哨兵，
 *   它红了就说明该回来重核这条绑定（⛔ 不是「判据松了」）。
 * · 清单那一项的**接线形状**（小标题／结论行／`已核，未见`）没过时，本模块**不再报第二遍**
 *   条数对账（同一条问题不写两遍）；判「不通过」那一支**没有**条数要求（spec 只管「通过」那一行）。
 * · 机器现算的那份清单是从**盘上此刻**的合并件算的：审计派发时与交工时刻之间图被改过，
 *   两边的数就会对不上（那正是对账要报的事，不是本模块的口径问题）。
 *
 * ## 五项判定词只有一处出处：派发模板
 *
 * 判定词与判定口径住在 `resources/references/subagent-prompts/cross-audit-prompt.md`
 * 的「五项核对判定表」一节里，**本模块从那份文件解析**。别处（brief 交办说明、
 * `audit-and-testing.md` §十·第二轮、拒收文案、人设）一律只**引**它——各写一份
 * 就是四份会漂的平行清单，而漂了以后机器判的和 AI 读到的会是两件事。
 *
 * ⚠️ 模板读不出来（缺文件 / 那一节被改没了）时**不许放行**：`wiringBroken` 走的是
 * 「机器自己的接线坏了」这一档，拒收文案直说那是仓内问题、不是这本书的问题——
 * 静默放行等于把一道闸门悄悄关掉，而没人会知道为什么。
 */
import { readResource } from '../content-lib.js'
import { ledgerCountsClause, parseLedgerCounts } from './cross-audit-ledger.js'

/** 跨章审计派发模板在 resources/ 下的相对路径（**单一出处**：判定词、判定口径、回灌结构都在那儿）。 */
export const CROSS_AUDIT_TEMPLATE_REL = 'references/subagent-prompts/cross-audit-prompt.md'

/** 模板里那张判定表的节标题——解析从它开始，到下一个同级 `##` 为止。 */
const ITEMS_HEADING = '## 五项核对判定表'

/** 一节里的结论行：`结论：通过` / `结论：不通过`。 */
const VERDICT_RE = /结论\s*[:：]\s*(通过|不通过)/

/** 判「通过」那一支的交代句：**无问题也要写它**，否则「没交代」与「交代了没问题」在盘上长得一样。 */
export const CROSS_AUDIT_PASS_MARK = '已核，未见'

/** 点名条目：每条一行列表项（`- …` / `* …` / `+ …`）。 */
const BULLET_RE = /^[ \t]*[-*+][ \t]+\S/

/** 审计报告的落盘件（书夹相对路径）。 */
export const CROSS_AUDIT_REPORT_REL = '工作区/audit-cross.md'

/** 除全部章之外，跨章审计还要读的三份约束件（**纯路径**，不带正文）。 */
export const CROSS_AUDIT_CONSTRAINTS = Object.freeze(['工作区/outline.md', '工作区/knowledge-map.json', '工作区/style-spec.md'])

/**
 * **逐边清单那一项**在判定表里的**序号**（spec §4 逐字：「跨章审计第 4 项」）——绑定靠这个数，
 * ⛔ 不在这里抄判定词本身（抄了就是第二份会漂的清单）。
 *
 * ⚠️ 窄处：判定表重排行序时绑定会跟着挪，哨兵在 `test/test-cross-audit-ledger.mjs`（见文件头）。
 */
export const LEDGER_ITEM_NUMBER = 4

/**
 * 这一道闸的问题码表（**下游按码取值的那一份**；顺序＝`judgeCrossAuditReport` 报问题的顺序）。
 *
 * 前四个是**逐项**的接线形状（票 05 那一层，本票补上了码；判定词有几项就按几项逐个查——第五项同形，不需要新码），最后一个（**本票新加**，
 * spec §5 第 7 条那条硬闸）是**条数对账**——它排在所有各项的接线检查**之后**，
 * 因为「那一节的形状先站得住」才是「数对得上」的前提（形状没过时不再报第二遍）。
 */
export const CROSS_AUDIT_PROBLEM_CODES = Object.freeze([
  'cross-audit-item-heading-missing',
  'cross-audit-verdict-missing',
  'cross-audit-pass-mark-missing',
  'cross-audit-item-bullets-missing',
  // 票 `knowledge-graph-build/11`：条数对账（逐边清单 N＝跨章 X＋章内 Y 且与机器现算逐数相等）
  'cross-audit-ledger-count',
])

/**
 * 那一行**必须逐字照抄**的交代行（机器现算的数就在里面）。
 *
 * 生成侧是 `cross-audit-ledger.js` 的 `ledgerCountsClause()`（**同一处**措辞）＋ 本模块的
 * `CROSS_AUDIT_PASS_MARK`；解析侧是 `parseLedgerCounts()`——三处同名同面，⛔ 别在别处另写一份。
 *
 * @param {{total: number, across: number, within: number, inverted: number}} counts
 * @returns {string} 如 `已核，未见——逐边清单 12 条全核（跨章 9／章内 3），无倒置、无「只出现名字」`
 */
export function ledgerClaimLine(counts) {
  return `${CROSS_AUDIT_PASS_MARK}——${ledgerCountsClause(counts)}`
}

/**
 * 默认参数要的那一份模板全文——**读不出就回空串**（票 `resource-read-result/04`）。
 *
 * ⚠️ 为什么不能把 `readResource()` 直接当默认参数：`crossAuditItemLabels` 的签名只装得下
 * `string`，而分档答案不是字符串。默认参数这一处是**唯一**读盘点，它必须显式吃掉分档：
 * 缺 ⇒ `''` ⇒ 下面解析不到判定词 ⇒ 回 `[]` ⇒ `judgeCrossAuditReport` 判 `wiringBroken: true`
 * ⇒ **拒合并**（判据强度一个字符都不动）。"缺"这一档的原因由 `crossAuditRejectReason` 那一句
 * 说准（它会点名 rel 与 reason），而不是让「缺」和「模板在但解析不出条目」混在同一句里。
 */
function defaultCrossAuditTemplateText() {
  const read = readResource(CROSS_AUDIT_TEMPLATE_REL)
  return read.ok ? read.text : ''
}

/**
 * 从派发模板解析出五项判定词（模板的「五项核对判定表」里第一列）。
 *
 * ⚠️ 解析不到就返回**空数组**，由调用方判红——本模块不自带一份兜底清单：
 * 兜底清单就是第二处出处，正是这个模块要治的病。
 *
 * @param {string} [text] 模板全文（默认现读 `resources/` 那份）
 * @returns {string[]} 判定词，逐字、顺序与模板一致
 */
export function crossAuditItemLabels(text = defaultCrossAuditTemplateText()) {
  const source = String(text ?? '')
  const from = source.indexOf(ITEMS_HEADING)
  if (from < 0) return []
  const rest = source.slice(from + ITEMS_HEADING.length)
  const nextAt = rest.search(/\n##\s/)
  const section = nextAt >= 0 ? rest.slice(0, nextAt) : rest
  const labels = []
  for (const line of section.split(/\r?\n/)) {
    // 表行形状：`| 1 | 判定词 | … |`——只认带序号的行，免得把表头/分隔行也吃进来。
    const m = /^\|\s*\d+\s*\|\s*([^|]+?)\s*\|/.exec(line)
    if (m !== null && m[1] !== '') labels.push(m[1])
  }
  return labels
}

/** Markdown 标题行（`#`…`######`），供分节用。 */
const HEADING_RE = /^(#{1,6})\s+(.*)$/

/**
 * 判一份 `audit-cross.md` 的形状：五项核对**逐项**有交代才放行。
 *
 * 每项的判定口径见派发模板；机器这一层只认三条**可解析的形状**：
 *   ① 有一个小标题含该项判定词（`## 1. 术语统一` 也认）；
 *   ② 那一节里有一行 `结论：通过` 或 `结论：不通过`；
 *   ③ 判「通过」必须写 `已核，未见`（**空节与「没问题」在盘上长得一样**，靠这一行分开）；
 *      判「不通过」必须至少有一条点名条目（每条一行列表项）。
 * 外加 spec §5 第 7 条那条**条数对账**（只压「清单那一项判通过」那一支，见下面第五步）。
 *
 * 机器**不**判断结论对不对、不判断点名是否属实、不判断判定表之外的东西——
 * 那是真机层（票 07）。
 *
 * @param {string} reportText `工作区/audit-cross.md` 的全文
 * @param {string[]} [labels] 判定词（默认从派发模板解析）
 * @param {{ledger?: object|null}} [options] `ledger` ＝ 机器现算的逐边清单
 *   （`cross-audit-ledger.js` 的 `readCrossAuditEdgeLedger()` 那一份）。**必填**：
 *   没它就没有「自己算的数」可对，本模块按**接线坏了**报（⛔ 不静默跳过这道闸）。
 * @returns {{wiringBroken: boolean, wiringWhy: string|null, missing: {code: string, label: string, why: string}[], counts: object|null}}
 */
export function judgeCrossAuditReport(reportText, labels = crossAuditItemLabels(), { ledger = null } = {}) {
  if (labels.length === 0) {
    return {
      wiringBroken: true,
      wiringWhy: null, // 由 `crossAuditRejectReason` 用「模板读不出判定词」那一句（默认文案）
      missing: [],
      counts: null,
    }
  }
  if (ledger === null || typeof ledger !== 'object' || typeof ledger.counts !== 'object') {
    return {
      wiringBroken: true,
      wiringWhy: '机器没拿到逐边清单（spec §5 第 7 条的条数对账要拿它跟自己算的数比）。'
        + '清单由调用方读盘现算后**当值**传进来（`cross-audit-ledger.js` 的 `readCrossAuditEdgeLedger()`）——'
        + '这是仓内接线坏了，不是这本书的问题。',
      missing: [],
      counts: null,
    }
  }
  const counts = ledger.counts
  const lines = String(reportText ?? '').split(/\r?\n/)
  const headings = []
  for (const [index, line] of lines.entries()) {
    const m = HEADING_RE.exec(line)
    if (m !== null) headings.push({ level: m[1].length, title: m[2], index })
  }
  const missing = []
  const sections = new Map()
  for (const label of labels) {
    const head = headings.find((h) => h.title.includes(label))
    if (head === undefined) {
      missing.push({ code: 'cross-audit-item-heading-missing', label, why: '没有这一项的小标题' })
      continue
    }
    // 本节 = 标题行之后、到**下一个同级或更高级**标题为止（`###` 子标题归它所有）。
    const end = headings.find((h) => h.index > head.index && h.level <= head.level)?.index ?? lines.length
    const body = lines.slice(head.index + 1, end)
    const verdict = body.map((line) => VERDICT_RE.exec(line)).find((m) => m !== null)
    if (verdict === undefined) {
      missing.push({ code: 'cross-audit-verdict-missing', label, why: '有这一节，但没写「结论：通过／不通过」' })
      continue
    }
    sections.set(label, { body, verdict: verdict[1] })
    if (verdict[1] === '通过') {
      if (!body.some((line) => line.includes(CROSS_AUDIT_PASS_MARK))) {
        missing.push({ code: 'cross-audit-pass-mark-missing', label, why: `结论写了「通过」，但没写「${CROSS_AUDIT_PASS_MARK}」——没交代等于没查` })
      }
      continue
    }
    if (!body.some((line) => BULLET_RE.test(line))) {
      missing.push({ code: 'cross-audit-item-bullets-missing', label, why: '结论写了「不通过」，但一条点名都没有（每条一行「- …」，指到章／位置／原文）' })
    }
  }

  // 第五步（spec §5 第 7 条 · 条数对账）：只压「清单那一项判通过」那一支。
  // ⚠️ 形状没过的那一项**不再报第二遍**（它已经在上面的循环里被点名了）。
  const ledgerLabel = labels[LEDGER_ITEM_NUMBER - 1] ?? null
  const section = ledgerLabel === null ? undefined : sections.get(ledgerLabel)
  const sectionClean = ledgerLabel !== null && !missing.some((item) => item.label === ledgerLabel)
  if (section !== undefined && sectionClean && section.verdict === '通过') {
    const hits = section.body.map((line) => parseLedgerCounts(line)).filter((row) => row !== null)
    const required = ledgerClaimLine(counts)
    if (hits.length === 0) {
      missing.push({
        code: 'cross-audit-ledger-count',
        label: ledgerLabel,
        why: `判「通过」却没写逐边清单那一句——条数对账就是「查了」的形态。机器要求那一节的交代行**逐字**写成：\`${required}\``,
      })
    } else if (hits.length > 1) {
      missing.push({
        code: 'cross-audit-ledger-count',
        label: ledgerLabel,
        why: `那一节里写了 ${hits.length} 条逐边清单交代行——同一份账写几遍，没人知道信哪一份（只许一条）`,
      })
    } else {
      const said = hits[0]
      const mine = {
        total: Number.isSafeInteger(counts.total) ? counts.total : 0,
        across: Number.isSafeInteger(counts.across) ? counts.across : 0,
        within: Number.isSafeInteger(counts.within) ? counts.within : 0,
        inverted: Number.isSafeInteger(counts.inverted) ? counts.inverted : 0,
      }
      if (said.total !== said.across + said.within) {
        missing.push({
          code: 'cross-audit-ledger-count',
          label: ledgerLabel,
          why: `报告写的是「逐边清单 ${said.total} 条全核（跨章 ${said.across}／章内 ${said.within}）」——`
            + `${said.total} ≠ ${said.across} ＋ ${said.within}（清单的条数必须等于跨章 ＋ 章内两条之和）`,
        })
      } else if (said.total !== mine.total || said.across !== mine.across || said.within !== mine.within) {
        missing.push({
          code: 'cross-audit-ledger-count',
          label: ledgerLabel,
          why: `条数逐数对不上：报告写「${said.total} 条（跨章 ${said.across}／章内 ${said.within}）」，`
            + `机器现算的是「${mine.total} 条（跨章 ${mine.across}／章内 ${mine.within}）」——`
            + `清单是全量的（跨章 ＋ 章内都在），⛔ 不是「只列看着可疑的那几条」`,
        })
      } else if (said.inverted !== mine.inverted) {
        missing.push({
          code: 'cross-audit-ledger-count',
          label: ledgerLabel,
          why: `「无倒置」那一句与图对不上：报告写的是「${said.inverted === 0 ? '无倒置' : `${said.inverted} 条章序倒置`}」，`
            + `机器现算的是 ${mine.inverted} 条章序倒置（机器算得出倒置条数）`,
        })
      }
    }
  }

  return { wiringBroken: false, wiringWhy: null, missing, counts }
}

/**
 * 缺项时的拒收文案：**点名缺哪一项、为什么**，并把派发/判定口径指回那一份模板。
 *
 * ⚠️ 这里**不许**把判定词列一遍——那正是本模块要治的「四份平行清单」。
 * 文案里出现的是**运行时算出来的**缺项，不是抄在代码里的清单。
 *
 * @param {{wiringBroken: boolean, wiringWhy?: string|null, missing: {code: string, label: string, why: string}[], counts?: object|null}} verdict
 * @returns {string} 一句人话（会落到账本事件的 reason 上）
 */
export function crossAuditRejectReason(verdict) {
  const template = `resources/${CROSS_AUDIT_TEMPLATE_REL}`
  if (verdict.wiringBroken) {
    if (typeof verdict.wiringWhy === 'string' && verdict.wiringWhy !== '') return verdict.wiringWhy
    // 票 `resource-read-result/04`：判定词清单读不到时，**把原因说准**——「缺文件」与「文件在、
    // 但那一节没解析出条目」是两件事，从前它们混在同一句里。判据强度不动：两档都仍然是
    // `wiringBroken: true` ⇒ 拒合并（⛔ 不许为了好判而放宽成「缺就跳过这道闸」）。
    // ⚠️ 这里**再读一次**盘（命中 mtime+size 缓存，代价是一次 stat）：为的是不把
    // `judgeCrossAuditReport` 的签名撑宽一个 `reading` 字段——那会让 12 个调用面全部改一遍，
    // 而本 effort 的纪律是「缺了怎么办由消费者族选一次」。
    const read = readResource(CROSS_AUDIT_TEMPLATE_REL)
    if (!read.ok) {
      return `机器读不到跨章审计的判定词清单：派发模板 ${template} 读不出（${read.reason}）。这是仓内接线坏了，不是这本书的问题；五项判定词只住在那一份模板里，机器与 AI 读的是同一份。`
    }
    return `机器读不到跨章审计的判定词清单：派发模板 ${template} 在盘上，但它的「${ITEMS_HEADING}」一节没解析出条目。这是仓内接线坏了，不是这本书的问题；五项判定词只住在那一份模板里，机器与 AI 读的是同一份。`
  }
  const names = verdict.missing.map((item) => item.label).join('、')
  const why = verdict.missing.map((item) => `${item.label}——${item.why}`).join('；')
  return `合并前跨章审计记录 ${CROSS_AUDIT_REPORT_REL} 有 ${verdict.missing.length} 项没有交代：${names}（${why}）。派发与判定口径见 ${template}——五项判定词只住在那一份里，别处不另写清单。每一项一个小标题（标题含判定词）＋一行「结论：通过／不通过」：判「通过」要写「${CROSS_AUDIT_PASS_MARK}」，判「不通过」要逐条点名（每条一行「- …」，指到章／位置／原文）。`
}