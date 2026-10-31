/**
 * 焦点区主卡路由表（票 `focus-card-routing/02` 立）：**一行 = 一个 `createCardView` 的 slot**。
 *
 * ## 它治的病
 *
 * 「当前该摆哪张焦点区主卡」这一个决定，收编前散在**四份互不相等的字面**里：
 * `focusCardKey` 的返回值（10 个）、壳里的 `switch`（9 个 `case` ＋ 1 个 `default`）、
 * 壳里手抄的 slot 登记（14 行）、盘上的 `defineCardView`（13 份）。四份的**对应关系**
 * 没有任何一处被写下来——只活在注释里。`GoalsConfirmCard` 就是那个已经发生的实害：
 * 三处都接好了，覆盖率门那张手抄表里却没有它，门照样全绿。
 *
 * 本文件把四份收成**一张表**。壳从这个表派生 slot 与主卡选择；覆盖率门枚举它；
 * 画廊从它派生卡清单。**生产侧**加一张卡＝在 `CARD_ROUTING` 里加一行；如果它由
 * `focusCardKey` 路由，`focusCardKey` 也要长出那个键（闭包①会点名），整壳探针那份**人写的
 * 可见串取证表**会醒（见 `test/smoke-test.mjs` 2d-7b）——那两处是**人写的期望值**，
 * 不是第二份 slot／契约声明。
 *
 * ## 字段
 *
 * | 字段 | 含义 |
 * | --- | --- |
 * | `slot` | `createCardView` 的 slot 名（行身份，唯一） |
 * | `routedBy` | `focusCardKey` 的返回键；`null` ＝ **不由 `focusCardKey` 路由** |
 * | `arm` | `"case"` 或 `"default"`（`routedBy: null` 时没有此字段） |
 * | `component` | 渲染用的组件函数 |
 * | `build` | 该卡 `defineCardView` 的返回值（契约） |
 * | `module` | 契约/组件所在模块的**仓根相对路径**（给失败原文与判据定位用，不给 import 用） |
 * | `mount` | **仅** `routedBy: null` 时必填：一句人话说明它挂在哪一屏的哪一块 |
 *
 * ## 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）
 *
 * ① **表本身仍是人写的**（与它取代的那张 12 行登记表同类）：新加的卡要有人加一行。
 *    闭包**强度不等**：只有「**表 ⇄ `focusCardKey` 源码**」（闭包①）与「**表 ⇄ `src/ui/*.js` 的
 *    `defineCardView`**」（闭包②）是**双向**的。「**表 → 模块导出**」（闭包③）只按
 *    `component.name`／`build.card` 那一串名字在该 `module` 源码里找同名 `export`（今天两者同串，
 *    契约的导出身份由闭包②的 `build` 函数引用兜）；「**壳的 slot 引用 → 表**」（闭包④）只查正向
 *    「引用 ⊆ 表」（另有壳形状断言），反向「表里每一行都被壳引用」不在断言里——③④ 都是**单向**的。
 *    「表**少了一整类**卡」（将来出现第二种渲染单元、或某张卡压根没被任何人想起）这件事仍咬不住，
 *    要人看见。
 * ② **`arm: "default"` 的可达性不在表里**：`focusCardKey` 是全函数，`default` 是防御性兜底；
 *    表只声明它恰好一行，不声称今天真会走到。`arm: "case"` 是给读者与门看的声明，
 *    运行时只有 `default` 那一行被 `rowFor` 读（其余行按 `routedBy` 精确命中）。
 * ③ **`module` 是人写的路径字符串**：闭包③只证「那个文件里真有同名 `export`」，**不证**
 *    组件／契约真的从那里 `import`（一个同名的函数住在错文件里能过）——身份那一半由
 *    `build` 的函数引用（闭包②）与整壳探针兜。
 * ④ **它不判「这张卡在真屏上好不好看」**：位置、遮挡、像素归人工边界（`ADR-0035`）。
 *
 * ⚠️ **表可以 import 组件与契约**（它就是「组件 ↔ 契约 ↔ 键」的汇合处），但
 * `card-view.js` 仍必须零 import——那个中性件不认识任何一张卡，正是这张表住在它**旁边**
 * 而不是住进它里面的理由。`module` 那一列是**字符串**，给失败原文定位，不参与 import。
 */

import {
  DeliveryCard,
  FinalApprovalCard,
  GatePanel,
  StatusCard,
  UploadArea,
  deliveryCardView,
  finalApprovalCardView,
  gatePanelView,
  statusCardView,
  uploadAreaView,
} from './event-cards.js'
import {
  ExploreConfirmCard,
  OutlineConfirmCard,
  exploreConfirmCardView,
  outlineConfirmCardView,
} from './confirm-cards.js'
import { GoalsConfirmCard, goalConfirmCardView } from './goal-cards.js'
import { GoldTable, goldTableView } from './gold-table.js'
import {
  ChaptersCard,
  ProgressOverview,
  chaptersCardView,
  progressOverviewView,
} from './chapters-map.js'
import { PhasePage, phasePageView } from './phase-page.js'
import { ReplayList, replayListView } from './replay-list.js'

/**
 * 一行 = 一个 slot。顺序＝画廊下钻网格的显示顺序（也是壳里 slot 登记的旧顺序）。
 *
 * ⚠️ 十行 `routedBy` 非 null：9 行 `arm: "case"` ＋ 1 行 `arm: "default"`。
 * ⚠️ 四行 `routedBy: null`：它们**不参与**焦点区主卡路由，但仍是 `createCardView` 的 slot，
 * 所以必须在这张表里、且必须显式标成 `null`（不能混进同一串键里靠读者自己分辨）。
 */
export const CARD_ROUTING = Object.freeze([
  Object.freeze({
    slot: 'gate',
    routedBy: 'gate',
    arm: 'case',
    component: GatePanel,
    build: gatePanelView,
    module: './src/ui/event-cards.js',
  }),
  Object.freeze({
    slot: 'explore',
    routedBy: 'explore',
    arm: 'case',
    component: ExploreConfirmCard,
    build: exploreConfirmCardView,
    module: './src/ui/confirm-cards.js',
  }),
  Object.freeze({
    slot: 'goals',
    // `awaiting-explore` 下的**第二个停点**（站 3）：同一个状态值，由 `meta.exploreConfirmed` 折出。
    routedBy: 'goals',
    arm: 'case',
    component: GoalsConfirmCard,
    build: goalConfirmCardView,
    module: './src/ui/goal-cards.js',
  }),
  Object.freeze({
    slot: 'outline',
    routedBy: 'outline',
    arm: 'case',
    component: OutlineConfirmCard,
    build: outlineConfirmCardView,
    module: './src/ui/confirm-cards.js',
  }),
  Object.freeze({
    slot: 'gold',
    routedBy: 'gold',
    arm: 'case',
    component: GoldTable,
    build: goldTableView,
    module: './src/ui/gold-table.js',
  }),
  Object.freeze({
    slot: 'upload',
    routedBy: 'upload',
    arm: 'case',
    component: UploadArea,
    build: uploadAreaView,
    module: './src/ui/event-cards.js',
  }),
  Object.freeze({
    slot: 'status',
    // 兜底臂：`focusCardKey` 是全函数，凡没被专门路由的状态都落它。
    routedBy: 'status',
    arm: 'default',
    component: StatusCard,
    build: statusCardView,
    module: './src/ui/event-cards.js',
  }),
  Object.freeze({
    slot: 'delivered',
    routedBy: 'delivered',
    arm: 'case',
    component: DeliveryCard,
    build: deliveryCardView,
    module: './src/ui/event-cards.js',
  }),
  Object.freeze({
    slot: 'final',
    routedBy: 'final',
    arm: 'case',
    component: FinalApprovalCard,
    build: finalApprovalCardView,
    module: './src/ui/event-cards.js',
  }),
  Object.freeze({
    slot: 'chapters',
    routedBy: 'chapters',
    arm: 'case',
    component: ChaptersCard,
    build: chaptersCardView,
    module: './src/ui/chapters-map.js',
  }),
  Object.freeze({
    slot: 'progressOverview',
    routedBy: null,
    component: ProgressOverview,
    build: progressOverviewView,
    module: './src/ui/chapters-map.js',
    mount: '「现在」那一屏的全览条（焦点区主卡上方的进度条，不是焦点区主卡）',
  }),
  Object.freeze({
    slot: 'replay',
    routedBy: null,
    component: ReplayList,
    build: replayListView,
    module: './src/ui/replay-list.js',
    mount: '「之前的过程」旁挂的账本回放列表（回看态／展开时出现，不占焦点区）',
  }),
  Object.freeze({
    slot: 'phasePageBrowse',
    routedBy: null,
    component: PhasePage,
    build: phasePageView,
    module: './src/ui/phase-page.js',
    mount: '浏览态阶段页（阶段片点一步落到那一页；与 phasePagePhase 共用一份契约）',
  }),
  Object.freeze({
    slot: 'phasePagePhase',
    routedBy: null,
    component: PhasePage,
    build: phasePageView,
    module: './src/ui/phase-page.js',
    mount: '阶段页态阶段页（顶栏点一格落到那一页；位置夹在三个展开面板之间）',
  }),
])

/** `focusCardKey` 的键 → 那一行（精确命中；未命中落 `arm: "default"` 那一行）。 */
const ROUTED_ROWS = new Map(
  CARD_ROUTING.filter((row) => row.routedBy !== null && row.arm === 'case')
    .map((row) => [row.routedBy, row]),
)
const DEFAULT_ROW = CARD_ROUTING.find((row) => row.arm === 'default')

/**
 * 精确命中 `routedBy === key` 的那一行；未命中时落 `arm: "default"` 那一行。
 *
 * ⚠️ `focusCardKey` 是全函数 ⇒ 正常调用都会命中；兜底走的是 `status` 那一行，
 * 与壳里原来 `switch` 的 `default:` **逐字同义**。
 */
export function rowFor(key) {
  return ROUTED_ROWS.get(key) ?? DEFAULT_ROW
}

/**
 * 从表派生出 `createCardView` 的第二实参（slot 名 → 契约）。
 *
 * 壳**不再**手抄那 14 行；`slot` 唯一性由判据钉住（重复会让这里静默覆盖）。
 */
const SLOTS_FROM_TABLE = Object.freeze(
  Object.fromEntries(CARD_ROUTING.map((row) => [row.slot, row.build])),
)

export function slotsFromTable() {
  return SLOTS_FROM_TABLE
}
