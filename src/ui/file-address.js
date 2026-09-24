/**
 * DSH 文件地址拼装（`dsh-resource://file/…`）——工作台「打开一份文件看看」共用。
 *
 * 为什么自己实现：这套语法与语义属于 dsh 的 `@deepseek-ai/dsh-util-workspace-path`
 * （`fileAddressFor` / `sessionFileAddress`），但那个包不发布进客户端模块表
 * （各客户端插件在自己的 bundle 里内联它，我们引不到），故按其同一规则本地实现；
 * `fileAddressFor` 的行为与上游逐条对齐（地址串断言在 test-product-open-mode.mjs
 * 的「地址语法」「工作区相对/绝对」三例里）。
 *
 * 依据 ADR-0010 决策 8：地址用**工作区相对路径**拼（`<书文件夹名>/work/chapter-01.md`），
 * 不是绝对路径——保住「这个会话只能看自己工作区」的约束。
 * 书夹不在工作区内（老书留在 ~/.dsh/textbook/projects）时退回绝对路径形态，
 * 与上游同一取舍：此时由宿主按会话读权限判定，读不到就由右栏正文报错，不静默。
 */

const FILE_ADDRESS_PREFIX = "dsh-resource://file/";

/** 逐段组件编码；`:` 保持字面量（Windows 盘符要读成 `C:`）。 */
function encodeSegment(segment) {
	return encodeURIComponent(segment).replace(/%3A/gi, ":");
}

/**
 * 按会话构造文件地址（路径为工作区相对路径或绝对路径）。
 * @param {string} sessionId - 会话 id。
 * @param {string} path - 反斜杠会被归一为 `/`，开头的 `./` 会被去掉。
 * @returns {string} `dsh-resource://file/session/<id>/<path>`
 */
export function sessionFileAddress(sessionId, path) {
	const normalized = String(path ?? "")
		.replace(/\\/g, "/")
		.replace(/^(?:\.\/)+/, "");
	return `${FILE_ADDRESS_PREFIX}session/${encodeSegment(String(sessionId ?? ""))}/${normalized
		.split("/")
		.map(encodeSegment)
		.join("/")}`;
}

/**
 * 按调用方手里的路径构造地址：落在会话工作区内的绝对路径折成相对路径，
 * 工作区外（或不知道工作区）保持绝对路径，两者都在同一个会话作用域里。
 * @param {string} sessionId - 会话 id。
 * @param {string|undefined} cwd - 该会话的工作区根（客户端会话记录的 `cwd`）。
 * @param {string} path - 绝对路径或工作区相对路径。
 * @returns {string} `dsh-resource://file/…` 地址。
 */
export function fileAddressFor(sessionId, cwd, path) {
	const normalized = String(path ?? "").replace(/\\/g, "/");
	const root =
		typeof cwd === "string" && cwd !== ""
			? cwd.replace(/\\/g, "/").replace(/\/+$/, "")
			: "";
	if (root !== "" && (normalized.startsWith(`${root}/`) || normalized === root)) {
		const rel = normalized.slice(root.length).replace(/^\/+/, "");
		return sessionFileAddress(sessionId, rel);
	}
	return sessionFileAddress(sessionId, normalized);
}

/**
 * 书文件夹里的一个产物（`work/chapter-01.md` 这种书内相对路径）→ 预览地址。
 *
 * 书夹在会话工作区内时结果为**工作区相对路径**（ADR-0010 决策 8）：
 *   fileAddressFor("s1","D:\\code","D:\\code\\演示书", "work/chapter-01.md")
 *     → dsh-resource://file/session/s1/演示书/work/chapter-01.md
 * 书夹在工作区外（老书留在 ~/.dsh/textbook/projects）时退回绝对路径形态，
 * 读不读得到交给宿主按该会话的读权限判，不由前端猜。
 *
 * @param {string} sessionId
 * @param {string|undefined} cwd - 会话工作区根。
 * @param {string|null|undefined} bookDir - 书文件夹绝对路径（/textbook/events 的 dir）。
 * @param {string} rel - 书文件夹内的相对路径。
 * @returns {string} `dsh-resource://file/…` 地址。
 */
export function bookFileAddress(sessionId, cwd, bookDir, rel) {
	const inner = String(rel ?? "").replace(/\\/g, "/").replace(/^(?:\.\/)+/, "");
	const dir = typeof bookDir === "string" ? bookDir.replace(/\\/g, "/").replace(/\/+$/, "") : "";
	const absolute = dir === "" ? inner : `${dir}/${inner}`;
	return fileAddressFor(sessionId, cwd, absolute);
}
