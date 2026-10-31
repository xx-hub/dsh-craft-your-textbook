/**
 * 造书工作台 · 状态存储（engine 内部子模块 3/4，票 `depth-review-2026-10/10`）
 *
 * 本簇是**状态的读写与落盘**：内存缓存、延迟批量写盘，以及 ADR-0016 决策 2 定的四个写入口
 * （`updateMeta` / `createMeta` / `appendEvent` / `rollbackLedger` 里前三个在本模块、第四个也在本模块）。
 *
 * 依赖图位置：只 import `./paths.js`（要账本与状态文件的地址）。**它就是 ADR-0016 决策 2 那条
 * 「状态写入收窄为单一入口」的所在地**——所以 ADR 与 `test-ledger-seq-integrity.mjs` 的判据口径
 * 在 2026-10 从「engine 之外」改写成「**store 子模块之外**」，两边同一个词。
 *
 * ⚠️ **本模块之外不许出现这四个底层标识符**：`writeMeta` / `metaCache` / `metaDirty` / `metaFlushHandle`，
 *   也不许有人 `writeFileSync(metaPath(…))` 或 `writeFileSync('project.json')` 绕过入口直写状态文件。
 *   `test-ledger-seq-integrity.mjs` 按这个口径扫 `src/**`。唯一例外是 `appendEvent` 所在的那个模块
 *   ——它是账高与「最后动静时刻」的**唯一写入者**，必须够得着 `writeMeta`（测试按名字搜出那个模块，
 *   不手写清单；`appendEvent` 将来搬进 `engine/ledger.js` 时这条不用改）。
 * ⚠️ `writeMeta` / `metaCache` / `metaDirty` / `metaFlushHandle` **在本模块内部也不许再导出到 engine**：
 *   engine 只认那四个入口，`test-ledger-seq-integrity.mjs` 的 `key in engine` 钉着它们不在导出面上。
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

import { metaPath, timelinePath } from './paths.js'


/** 校验项目属于某个会话；不属于则抛错（严格隔离）。 */
export function assertSessionOwned(projectId, sessionId) {
  const meta = readMeta(projectId)
  if (meta === null) throw new Error('项目不存在')
  if (meta.session !== sessionId) {
    throw new Error('该项目不属于当前会话')
  }
  return meta
}


/** project.json 内存缓存 + 批量落盘（P2-8，pipeline-perf）
 *  - readMeta 命中缓存返回深拷贝（语义与旧实现一致：每次读到独立对象），避免每事件一次整文件读；
 *  - writeMeta 只更新内存 + 标记脏，setImmediate 收口批量写盘；
 *  - flushMeta 在 setImmediate 与每次 HTTP 响应边界同步落盘并清缓存，
 *    保证外部直读 project.json（工作台/测试）始终看到最新状态；
 *    ⚠️ 那个 HTTP 边界是 `sendJson`，票 `deep-module-scan/11` 起它住在 `src/workflow.js`
 *    （**引擎从此不认识 `res`**）——「回包前 flush」这条不变量由那边调用本函数兑现。
 *  - timeline.jsonl 事件账本仍逐条同步追加，不受影响。 */
const metaCache = new Map() // projectId -> 最近一次读/写的深拷贝

const metaDirty = new Set() // projectId -> 待落盘

let metaFlushHandle = null


export function readMeta(projectId) {
  const cached = metaCache.get(projectId)
  if (cached !== undefined) return structuredClone(cached)
  const path = metaPath(projectId)
  if (!existsSync(path)) return null
  try {
    const meta = JSON.parse(readFileSync(path, 'utf8'))
    metaCache.set(projectId, meta)
    return structuredClone(meta) // 与命中路径同语义：调用方拿到独立拷贝，缓存私有副本不受污染
  } catch (error) {
    throw new Error(`textbook: corrupt project meta ${projectId}: ${String(error)}`)
  }
}


/** 把缓存里待写的 project.json 全部同步落盘，然后清空缓存（幂等，无脏可写时是空转）。
 *  清空缓存是刻意的：每次 HTTP 响应后缓存归零（那个 HTTP 边界见 `sendJson`，票 `deep-module-scan/11`
 *  起住在 `src/workflow.js`），工作流外的 project.json 直写/直读，
 *  下一次读一定命中磁盘最新——这是工作台/测试依赖的契约。
 *  落盘失败的 project 例外：保留副本 + 脏标记，下次 flush 重试（写本地 project.json 失败极罕见）。 */
export function flushMeta() {
  if (metaFlushHandle !== null) { clearImmediate(metaFlushHandle); metaFlushHandle = null }
  const retry = new Map() // projectId -> 落盘失败，保留副本下次重试
  for (const id of metaDirty) {
    const meta = metaCache.get(id)
    if (meta === undefined) continue
    try {
      writeFileSync(metaPath(id), JSON.stringify(meta, null, 2) + '\n')
    } catch {
      retry.set(id, meta)
    }
  }
  metaCache.clear()
  metaDirty.clear()
  for (const [id, meta] of retry) {
    metaCache.set(id, meta)
    metaDirty.add(id)
  }
}


/** 底层写入：只更新内存 + 标脏，落盘交给 setImmediate 与 HTTP 响应边界（`sendJson`，见上）。
 *  ⚠️ 它**导出到本 store 模块，但绝不上 engine 的导出面**（ADR-0016 决策 2）：对外只认
 *  updateMeta / createMeta / appendEvent / rollbackLedger 这四个入口——别处的「整份写回」
 *  正是票 02 的根因（写回一份旧状态会把旧账高一起带回来）。
 *
 *  ⚠️ **「store 之外」与「engine 导出面之外」是两件事，本条判据两条都要占**：
 *  · 本模块**必须**导出它——`appendEvent` 住在 `engine.js`，是 `eventCount` 与
 *    `updatedAt` 的唯一写入者，必须够得着底层写入口。
 *  · `engine.js` **不许**把它列进再导出块——`test-ledger-seq-integrity.mjs` 的
 *    `key in engine` 正是钉这一条，列进去即红。
 *  `appendEvent` 日后搬进 `engine/ledger.js` 时，测试按名字搜出那个模块即可，本条不用改。 */
export function writeMeta(meta) {
  metaCache.set(meta.id, structuredClone(meta))
  metaDirty.add(meta.id)
  if (metaFlushHandle === null) {
    metaFlushHandle = setImmediate(() => { metaFlushHandle = null; flushMeta() })
  }
}


/**
 * 状态写入的**单一入口**（ADR-0016 决策 2）：读 → 改 → 写收成一个动作，改法拿到的是**当场新读**的状态。
 *
 * 为什么要有它：原先的习惯是「先读一份状态 → 中途往账本记了一笔 → 再把手里那份**旧**状态整份写回去」。
 * 状态是内存缓存 + 延迟落盘，读优先命中缓存，所以写回旧状态不只覆盖磁盘，**同一瞬间的下一次读也拿到旧值**
 * ——账高被带回旧值，下一笔事件的序号于是重号或回退，前端「给我序号大于 N 的」增量拉取再也拉不到新事件
 * （票 timeline-seq-integrity/02 的根因）。收成单一入口后，「旧状态写回」这个形状在结构上不再可能。
 *
 * **账高（`eventCount`）与「最后动静时刻」（`updatedAt`）只归「记一笔」（appendEvent）所有**：
 * 改法里对这两个字段的任何改动一律丢弃（还原成写入前那份）。合法回退要「把账高调小」，
 * 那是 rollbackLedger 的事，不走这里。
 *
 * 改法必须**同步**（读到的就是写回的那一份；中间 await 出去，手里那份又成了旧状态）。
 * 返回写进去的那份状态，调用方据此读改完的字段。
 */
export function updateMeta(projectId, mutator) {
  const meta = readMeta(projectId)
  if (meta === null) throw new Error(`textbook: unknown project ${JSON.stringify(projectId)}`)
  const ownedEventCount = meta.eventCount
  const ownedUpdatedAt = meta.updatedAt
  mutator(meta)
  meta.eventCount = ownedEventCount
  meta.updatedAt = ownedUpdatedAt
  writeMeta(meta)
  return meta
}


/** 建档：项目**还不存在**时的那第一笔写入（book-create / demo-run）。
 *  updateMeta 要求「已存在」（读→改→写），这条是「从无到有」，分开写——不让建档借道 updateMeta
 *  （那会逼它先编一份不存在的状态）。已存在时抛错：建档路径不许覆盖别人的书。 */
export function createMeta(meta) {
  if (readMeta(meta.id) !== null) throw new Error(`textbook: project ${meta.id} already exists`)
  writeMeta(meta)
  return meta
}


/** 合法回退 · 账本重写（回退快照 / 深改截断 / 深改撤销共用这一份）：把 `timeline.jsonl` 换成 `events`，
 *  账高随之回到「笔数」——**这是「账高可以变小」的明文例外**（ADR-0016 决策 3），所以它刻意绕过
 *  updateMeta（updateMeta 会挡住对账高的改动，那正是它该做的）。
 *  - 给了 `restoredMeta`：整份换（回退快照 / 深改撤销，恢复到存档那一刻的状态）；
 *  - 没给：在**当场新读**的状态上只改账高（深改截断，其余字段由调用方随后的 updateMeta 改）。 */
export function rollbackLedger(projectId, events, restoredMeta = null) {
  writeFileSync(timelinePath(projectId), events.map((event) => JSON.stringify(event)).join('\n') + (events.length > 0 ? '\n' : ''))
  const base = restoredMeta === null ? readMeta(projectId) : { ...restoredMeta }
  if (base === null) throw new Error(`textbook: unknown project ${JSON.stringify(projectId)}`)
  base.id = projectId
  base.eventCount = events.length
  writeMeta(base)
  return base
}