/**
 * 声明面与验货面的对账（票 `premature-announce/02`）。
 *
 * ## 病
 *
 * 全仓有四份「本段该有哪些产物」的基准：A 阶段产物行（`engine.STEP_OUTPUT_ROWS`）、
 * B 小助手产出面（`STEP_SUB_OUTPUT_ROWS`）、C 交工逐项验货（`chapters.js` 的 `case 'stage-submit'`）、
 * D 产物族表（`domain-rules.BOOK_PRODUCT_FAMILIES`）。四份互相不一致时，**没有一条判据会响**：
 * 认不出、对不上的条目被 `dispatchRegistryFor` 的 `pick` 静默过滤，而「该有几件」这句话在
 * 四个地方各说各的。
 *
 * 本模块只做**两件**比较，都是纯函数（⛔ 不读盘、⛔ 不读时钟）——扫描面（扫哪些源码文件、
 * C 那一段在哪一行）归调用方，判据住这里：
 *
 *   ① {@link declarationGapProblems}：C 要的每一件，能不能在 D（产物族表）或排除表里找到落点。
 *      找不到 ⇒ **少件**，逐条点名（⛔ 不静默过滤）。
 *   ② {@link deadDeclarationFamilies}：D 里每一族，代码里有没有人提过它。
 *      一次都提不到 ⇒ **死条目**，逐条点名。
 *
 * ## 以 C 为权威基准，但**不做 A／D ↔ C 的粒度对齐**
 *
 * 票面第 1 条要「以 C 为唯一权威基准」，票面 Comments（2026-10-10）明确把 **A/D ↔ C 的粒度对账**
 * 留给了「A 到底代表什么」那条裁决——`STEP_OUTPUT_ROWS` 列的是「这一步的主产物」，而检查记录与它的
 * 成对关系由 `pairedAuditRels`／`auditCoversProduct` 另行持有。本模块**不越过那条裁决**：
 * 它判的是 **文件名层面的覆盖**（C 点名的路径有没有落点、D 声明的族有没有产出者），
 * ⛔ 不判「A 该不该把三件塞进一格」。⇒ 「范例章那格只写一件、验货面要三件」在这里**不是**缺口
 * （三件在 D 里各有族），这正是 Comments 那条粒度差的形状。
 *
 * ## ⚠️ 我的枚举面比现实窄在哪里（`AGENTS.md` 票 `dev-gate-scan/17` 的纪律）
 *
 * ① **只对账文件名与条数，不判内容**（票面「窄处」第 1 条的口径）：一份文件在不在、名字对不对得上，
 *    与它里面写了什么、写对没有，是两件事。
 * ② **证不了 C 自己是对的**（票面「窄处」第 2 条）：C 漏了一件时，声明面跟着一起漏，本模块看不见
 *    ——那是同源恒绿，有意的边界。反过来说，C 自己**写错**一个名字（例如把 `.json` 写成 `.md`），
 *    本模块会把那条错名字当真、要求声明面也有它。
 * ③ {@link declarationGapProblems} 的 `requirements` 由调用方从 C **现算**给进来；本模块不读 C。
 *    ⇒ 「扫不扫得到 C 的某一条判据」是调用方扫描面的窄处，不是本模块的。
 * ④ {@link deadDeclarationFamilies} 的证据是「族名／路径片段在代码行里出现过一次」——
 *    它只证**有人提过这一族**，⛔ 不证「有写入点」（写入点在哪、由谁写，是每个族自己的事：
 *    章审计由小助手落地、成品书由机器拼、风格线由人写）。⇒ 一族若只被 UI 取词或判据引用、
 *    从没有生产者，本判据**看不见**。
 * ⑤ 目录族（`工作区/细目/*`）只比前缀：族里「该有几份」由产出者决定，本模块不数份数
 *    （份数由 `reconcileManifestRows` 那一族管）。
 */
import { isSweepExcluded, manifestPathMatches } from "../domain-rules.js";

/**
 * C（交工验货）要的每一件，在 D（产物族表）或扫盘排除表里找落点。
 *
 * 「少件」的定义照票面：**声明面比验货面少件** ⇒ 点名。⚠️ 排除表里带理由的中间件（如
 * `工作区/progress.md`）**算有落点**——它已经被人明确判过「不是读者产物」，那是登记过的裁决，
 * 不是漏声明（「排除」是把红变绿的方向，所以那张表逐条带理由，见 `SWEEP_EXCLUDED`）。
 *
 * @param {{stage?: string, path: string}[]} requirements C 现算出来的「要哪几件」
 * @param {{manifestRows: object[]}} facts D 派生的清单行（`manifestRowsFor(...)` 的返回）
 * @returns {{missing: {stage: string, path: string}[], checked: number}}
 */
export function declarationGapProblems(requirements, { manifestRows } = {}) {
	const declared = (Array.isArray(manifestRows) ? manifestRows : [])
		.map((row) => row?.path)
		.filter((path) => typeof path === "string" && path !== "");
	const missing = [];
	let checked = 0;
	for (const requirement of Array.isArray(requirements) ? requirements : []) {
		const path = typeof requirement?.path === "string" ? requirement.path : "";
		if (path === "") continue; // 空路径不是一条要求：它是扫描面自己的错，不算「少件」
		checked += 1;
		const covered = declared.some((declaredPath) => manifestPathMatches(declaredPath, path))
			|| isSweepExcluded(path);
		if (!covered) missing.push({ stage: typeof requirement?.stage === "string" ? requirement.stage : "", path });
	}
	return { missing, checked };
}

/**
 * 一族在代码里「有人提过」的几条线索：族名本身，加路径最后一段（无占位符／通配符时）。
 *
 * ⚠️ 只取这两条是**有意的窄**：更宽的线索（如「路径里的目录段」）会让 `报告`／`分片` 这类
 * 到处都是的词把死条目一起救活——判据就退化成「名字出现过」的空转。
 *
 * @param {{family?: string, path?: string}} family
 * @returns {string[]}
 */
export function declarationEvidenceNeedles(family) {
	const needles = [];
	const name = typeof family?.family === "string" ? family.family.trim() : "";
	if (name !== "") needles.push(name);
	const path = typeof family?.path === "string" ? family.path : "";
	const last = path.split("/").pop() ?? "";
	// 占位段（`{n}`）与目录族（`*`）的最后一段不是可直接搜的字面量：模板串里长成 `${…}`。
	if (last !== "" && !last.includes("{") && !last.includes("*")) needles.push(last);
	return [...new Set(needles)];
}

/**
 * D 里那些**一次都没被代码提过**的族（死条目：声明着、却没有任何人产出或引用）。
 *
 * 病（票面第 3 条的同形）：一族声明在「应当有什么」里、而代码里一次都不提它，它就只会以
 * **恒缺件**的身份出现在每一本书的对账里；而恒红的判据教人忽略缺件那一半（ADR-0031 原话）。
 * ⇒ 让「静静躺着」不可能：要么删掉这一族，要么在代码里真的接上它。
 *
 * @param {object[]} families `BOOK_PRODUCT_FAMILIES`
 * @param {{path: string, text: string}[]} sources 扫描面（**调用方负责**排除声明面自己那份文件：
 *   否则每一族都能在自己的定义里搜到自己，判据恒绿）
 * @returns {{family: string, path: string, needles: string[]}[]}
 */
export function deadDeclarationFamilies(families, sources) {
	const texts = (Array.isArray(sources) ? sources : []).map((source) => String(source?.text ?? ""));
	const dead = [];
	for (const family of Array.isArray(families) ? families : []) {
		const needles = declarationEvidenceNeedles(family);
		const mentioned = needles.length > 0 && texts.some((text) => needles.some((needle) => text.includes(needle)));
		if (!mentioned) {
			dead.push({
				family: typeof family?.family === "string" ? family.family : "",
				path: typeof family?.path === "string" ? family.path : "",
				needles,
			});
		}
	}
	return dead;
}
