/**
 * 造书工作台 · 领域标签与豁免表（engine 内部子模块 1/4，票 `depth-review-2026-10/10`）
 *
 * 本簇是**词**：书号合法性、范例章号、段落意见措辞**与它的形状**（`paragraphOpinion`，票
 * `demo-channel-full/15`：真书那一支与演示书自带的那条示例**共用一处**）、可豁免项声明表、阶段／关卡／工序的人话标签、
 * 两段状态条提示文案、以及最后检查交办说明里的「别写内部词」清单。此前它们住在 engine.js 顶部，
 * 而被状态机、质量门、交办说明三处同时读——想看其中一张表得先滚过一个三千行文件。
 *
 * 依赖图位置：**叶子**（只 import `../../domain-rules.js`，零内部依赖），所以它是切序里的第一步。
 *
 * ⚠️ `REPORT_WORDING_RULE` **故意含内部词**（指称禁词时只能用禁词，改它等于把给 AI 的指令改成自相矛盾）。
 *   界面用词不变量断言按**名字**引这个常量把它从被扫文本里剔掉（见 `test-wording-invariants.mjs`），
 *   不是"整段跳过"糊过去。搬到这里后仍由 `engine.js` 原样再导出，import 侧一个字都不用改。
 */
import { goldChapterNo, PHASES } from '../../domain-rules.js'


export const PROJECT_ID_RE = /^[a-z0-9-]{1,64}$/


/** 范例章章号（1 基；旧账本/缺省=1）——共享领域规则的本地别名（历史调用点沿用 goldN）。 */
export const goldN = goldChapterNo

/**
 * **段落级抽查意见的单一形状出口**（票 `demo-channel-full/15`）。
 *
 * 病：这条形状原先只在 `actions/gold.js` 的 `case 'gold-opinion'` 里**内联写了一份**
 * （`{id, at, chapter, target, kind, wish, status}`），而演示书**自带**的那条示例段落意见
 * （`content-lib.js` 的 `demoChapterOpinions`）也要产同一种东西 ⇒ 两处各写一份就是
 * 「第二份会漂的量法」：哪天真实那一支加一个字段（或改 `status` 的取值），演示那条不会跟着动，
 * 而**演示书上没有闸接得住它**（真书那一族的验货在 `stage-submit(chapters)` 那一跳，演示书从不经它）。
 *
 * ⚠️ **键名与键顺序都不许动**：产出的对象直接进 `project.json` 的 `meta.pendingReviews`
 * （`JSON.stringify` 的键顺序会落盘），而真书那一支的账本／`meta` 是**既有**事实——
 * 本函数的展开必须与它**逐字**等价（票 `demo-channel-full/15` 落地时对过一遍）。
 *
 * @param {{id: string, at: number, chapter: number, target: {para: number|null, hint: string}|null, kind: 'dislike'|'drop'|'change', wish: string}} fields
 */
export function paragraphOpinion({ id, at, chapter, target, kind, wish }) {
	return { id, at, chapter, target, kind, wish, status: 'pending' }
}

/** F39（2026-08-20 走查）：段落级抽查意见的人话说明（给 AI 交办修订 / 事件落账用）。
 *  整章意见（review 动作）带 comment；段落意见（gold-opinion 带 chapter）带 kind/wish/target。 */
export function paragraphReviewText(r) {
  if (typeof r.comment === 'string' && r.comment !== '') return r.comment
  const where = r.target === null ? '笼统' : (r.target.hint || `第${r.target.para}段`)
  const kindText = r.kind === 'dislike' ? '不喜欢' : r.kind === 'drop' ? '不需要' : '要改成'
  return `段落意见（${where}）${kindText}${r.wish ? `：${r.wish}` : ''}`
}

/** 可豁免项（内部枚举 -> 大白话标签与风险提示；界面不裸露枚举）。 */
export const WAIVER_ITEMS = {
  'gate-skip': { label: '跳过「请你拍板」的设计环节', risk: '设计没经你确认就定稿，方向错了要返工' },
  'outline-skip': { label: '跳过「章节安排」确认', risk: '章节切分没经你确认，可能与预期不符' },
  'gold-skip': { label: '跳过「最佳范例章」确认', risk: '全书风格基准没经你认可' },
  'audit-skip': { label: '不要求每章都有独立审查', risk: '章节质量问题可能漏网' },
  'scaffold-keep': { label: '保留 AI 的笔记不删', risk: '成品里会留下工作痕迹' },
  // 票 15⑤：`route-override` 已删除声明。判别规则（票 06 的 Answer）：语义是「改变一个已定状态并牵动
  // 下游产物」→ 全仓没有该状态变更的迁移语义 ＝ 未实现的新能力，只能删声明（要做得另开 effort）。
  // 此前它只写在声明表与 AI 可见的枚举描述里、全仓没有 waived() 读取点，AI 可能调一个没效果的豁免。
  'progress-skip': { label: '跳过「进度账本」检查', risk: 'AI 的工作过程没有留账，中途换人/重做时缺参照' },
  'other': { label: '其他（自己写一句）', risk: '以你的说明为准' },
}


// 账本事件类型清单已收编至 ./domain-rules.js（单一事实来源，appendEvent 校验共用）。
// 六阶段标签派生自共享 PHASES（canonical 全称见 domain-rules.js，勿在此手写）。
export const PHASE_LABELS = Object.fromEntries(PHASES.map((p) => [p.n, p.label]))

export const GATE_LABELS = {
  '1': '学习目标与难点', '2': '教学方法与板块', '3': '全书架构与章节',
}


/** 交办阶段的人话标签（gate 单独带关卡号）。 */
export const STAGE_LABELS = {
  explore: '源探查', goal: '学完能做到什么', outline: '章节骨架', gold: '范例章', chapters: '铺章', merge: '合并成书', final: '最后检查',
}

export function stageLabel(stage, gate) {
  if (stage === 'gate') return `设计提案·第 ${gate ?? '?'} 关`
  return STAGE_LABELS[stage] ?? String(stage ?? '')
}


/**
 * 用户读到的状态条/提示文案（**界面字**，不是机器身份词——账本 label、文件名、事件 type
 * 才是不动的那一类）。
 * ⚠️ 这两句曾在多处 ensureStatus / hint 里逐字重复，2026-09-20 走查抓到"只改了一半"：
 * 「终检完成了」的孪生件改名成「最后检查完成了」，这份没跟上。抽成常量，一处改、处处改。
 */
export const EXPLORE_DONE_HINT =
  '🔍 材料读完了，请在工作台查看：满意点「✅ 满意，继续设计」，不满意点「🔁 让 AI 重做」。'

/**
 * **站 3 那一个停点**的状态条提示（票 `confirm-points-redesign-build/05`）。
 *
 * 它跟上面那一句**不是**同一件事：同一个 `awaiting-explore` 状态值下有两个停点，
 * 站 2 那一句说的是「材料读完了」，这一句说的是「那一趟已经跑完、等你对那几条目标表态」。
 * 两句都在人眼前，人看得出「现在是第二件事」——这正是本票要治的那一半。
 */
export const STATION_GOALS_DONE_HINT =
  '🎯 「学完要能做到什么」已经拟好了，请在工作台查看：认可就点「✅ 就按这几条办」，要改就在那几条上改／删／加，全都不满意就点「🔁 让 AI 重写这几条」。'
/**
 * **站 0／1「只提示人」那一句**（票 `confirm-points-redesign-build/09`；spec §4.5 的两处例外之一）。
 *
 * 站 0（建书：`meta.name`／`goal`）与站 1（材料就绪：`brief.materials`）**没有重做通路**——
 * 它们的值是**现读**的，没有可作废的产物 ⇒ 机器**只打这一句**：⛔ 不归档、⛔ 不截账本、
 * ⛔ 不清 `meta`、⛔ 不把待办指回（与站 2–9 那条「机器拦」的闭包刚好是另一档强度）。
 *
 * ⚠️ 它是**同一件事的唯一出口**（`actions/books.js` 的 `book-set-goal`、`actions/convert.js` 的
 * `source-remove`、`workflow.js` 的 `handleUpload` 都引这一份）——⛔ 别在别处手抄第二份措辞。
 */
export const STATION_VALUE_EDIT_HINT =
  '下游已经产出的东西不会自动重做；要按新目标重做，请用定点修改。'

export const FINAL_CHECK_DONE_HINT =
  '🛡️ 最后检查完成了：AI 检查报告与机器检查结果已在工作台。这是你对整本书的最后一次把关——满意点「✅ 认可，交付」，要改的写意见（AI 会按意见修整本后重新做最后检查）。'

/**
 * 票 `demo-channel-full/26`（清仓）：上面那一句在**演示书**上的取值（同一句两个取值，先例＝
 * 本文件上面那两句的用法与 `engine.js` 的 `gateRejectedAnnounce`）。
 *
 * ── 读数（票 26 的一次性探针 `.scratch/demo-channel-full/t-26-probe.mjs`，**不入库**）──
 * `corpus` 段把演示书从建书跑到 `delivered`，会话播报第 27 条逐字就是真书那一句（它**真到了
 * 人眼前**，在**会话播报** ＋ `过程记录.md` 两条通道上）。假的那一半是「**AI 会按意见修整本**」：
 * `acts` 段③ 读出带意见点「不满意」之后 `工作区/报告/` 六件**逐字未变**（sha 前后相同），
 * 那句话只落 `meta.finalRedoNote`，读它的唯一一处是真书 brief（`engine.js:4550／5444`）；
 * 而「**重新做最后检查**」是真的（账上第二次出现「🛡️ 最后检查：8/8 项通过」）。
 * ⇒ 演示取值只说真的那一半 ＋ 如实说「你写的那句不会进去」。
 */
export const DEMO_FINAL_CHECK_DONE_HINT =
  '🛡️ 最后检查完成了：AI 检查报告与机器检查结果已在工作台。这是你对整本书的最后一次把关——满意点「✅ 认可，交付」，要改的写意见（演示书会把最后检查原样重跑一遍，没有 AI 参与；你写的那句不会进去）。'

/**
 * 上面那一格的**唯一出口**（正文逐字是上面两份之一，⛔ 不在这里拼第二份措辞）。
 * ⚠️ 真书那一侧今天走的是**同一个常量**（`actions/chapters.js:1559`）——那是真书自己的通路，
 * 本函数只给需要分叉的那一处（`engine.js` 的演示终检支）用。
 * @param {{demo?: boolean}|null|undefined} meta 当前书的状态（不传＝按真书那侧）
 */
export function finalCheckDoneHint(meta) {
  return meta?.demo === true ? DEMO_FINAL_CHECK_DONE_HINT : FINAL_CHECK_DONE_HINT
}

/**
 * 最后检查交办说明里的「别写内部词」清单（**元语言例外/豁免一**：指称禁词时只能用禁词）。
 * ⚠️ 这一段**故意保留内部词**（旧词→新词两列照抄），改它等于把给 AI 的指令改成自相矛盾。
 * 因为它是唯一一段"合法含禁词"的 brief 文本，用词不变量断言按**名字**引这个常量把它从被扫
 * 文本里剔掉（见 test-wording-invariants.mjs），而不是"整段跳过"糊过去。
 */
export const REPORT_WORDING_RULE =
  '⚠️ 这份报告用户会逐字读：不写"审计文件/进度账本/禁用词/契约项/回源核对/U+FFFD/质量门/终检"这类内部词，改说"检查记录/工作记录/不该用的词/写作规范/标注了出处/乱码/最后检查"。'