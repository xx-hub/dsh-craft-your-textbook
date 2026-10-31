/**
 * 材料格式（受理白名单）—— **零依赖**模块（票 `depth-review-2026-10/14`，票 12 裁决的落地）。
 *
 * 它由 `src/domain-rules.js` 的同名那一档**整段**搬来（票 12：只先拆这一档、其余 23 段不动），
 * `src/domain-rules.js` 在原位置**原样再导出**这些名字（票 14 的 13 个 ＋ 票 `upload-formats/01`
 * 的 3 个）——7 个 `src/` 消费点与既有测试的
 * import 面一行不改，全仓只有 `src/domain-rules.js` 一处 import 本模块。
 *
 * ⚠️ 本模块**不许** import `node:` 内置 / react / 任何第三方，也不许 import `./domain-rules.js`
 * （那会成环）：它被 esbuild 直接打进前端 bundle，只住「两侧都必须知道」的纯事实与派生。
 */

// ── 材料格式（受理白名单）─────────────────────────────────────────────────────
//
// 票 `mineru-formats/07`：**一份常量、两处派生**（照同级 `domain-rules.js` 里 `MAX_UPLOAD_BYTES` 的先例）。
// 同一份 `MATERIAL_FORMATS` 同时供给三处，一处都不许各写一份：
//   ① 浏览器 `<input accept>`（src/ui/event-cards.js 的 UploadArea）——只改后端不改它，
//      用户连文件都选不到；
//   ② 服务端上传闸门（src/workflow.js 的 handleUpload）；
//   ③ 400 文案（本文件的 `unsupportedMaterialFormatMessage`）——闸门放开后，一份 .docx
//      **上传成功**而屏上还写着「请选择材料文件（.pdf）」，就是**说假话**
//      （`CONTEXT.md`「原件」词条把那句列进 _Avoid_）。
//
// ⚠️ **它是第三方事实的镜像，不是本仓拥有的语义**（`CONTEXT.md`「材料格式」）：格式能力的
// 事实拥有者是 MinerU。`ROLES`（在同级 `domain-rules.js` 里）用封闭白名单是对的
// （那是本仓**拥有**的分类法）；这里也用白名单，是一次**有代价的裁决**——白名单的腐烂是静默的（上游加了格式，我们默默拒收）。
// 权衡、反证与结论记在 `.scratch/mineru-formats/issues/07-扩展名白名单单一常量.md` 的
// `## Comments`，**别只改名单不改那份记录**。
// 抗腐烂靠三件可验的事：逐条 `calibrated`（有没有成功记录，判据是入库的票 01 真机实测证据
// `.scratch/mineru-verify/probe-result.json`）、`MATERIAL_FORMATS` ⊆ `MINERU_KNOWN_EXTENSIONS`
// （剥后缀那份表）、以及「名单外一律 400 且文案从名单派生」这条闭包。

/**
 * MinerU 云端认识的扩展名（**上游权威口径**＝`docs/reference/mineru-api-contracts.md` §8）。
 * 来源逐条：限制项表（权威，14 种）＝ pdf/图片(png,jpg,jpeg,jp2,webp,gif,bmp)/doc,docx,ppt,pptx,xls,xlsx；
 * `url`/`name` 字段说明另加 `html`；错误码 -60002 那份是**陈旧**的（缺 5 种），不取。
 *
 * ⚠️ 这是「**已知**扩展名」（用来剥后缀，**超集**：含 `.html`），**不是受理白名单**——
 * 受理那一份是下面的 `MATERIAL_FORMATS`，两者必须闭合（前者 ⊇ 后者，测试双向钉住）。
 *
 * ⚠️ 票 07 把它从 `src/mineru-lib.js` 搬到共用领域规则这一侧（票 `depth-review-2026-10/14` 又把它
 * 随整档搬进本模块，`domain-rules.js` 原样再导出）：它**两侧都要知道**（前端要由它判 accept
 * 归属、服务端要由它判受理），而 `src/mineru-lib.js` 只被 Node 侧 import、本模块被 esbuild
 * 直接打进前端 bundle——住那边，前端就永远拿不到「同源」这件事，只能各写一份。
 * `src/mineru-lib.js` 经 `domain-rules.js` 原样再导出它（`stripKnownExtension` 剥的仍是这一份，
 * 全仓只有这一处字面量）。
 */
export const MINERU_KNOWN_EXTENSIONS = Object.freeze([
	"pdf", "png", "jpg", "jpeg", "jp2", "webp", "gif", "bmp",
	"doc", "docx", "ppt", "pptx", "xls", "xlsx", "html",
]);

/**
 * 受理白名单（`CONTEXT.md`「材料格式」词条）。逐条三格：
 *
 * - `ext`：扩展名（小写、不带点）。**判据只认它**——MinerU 也只按后缀判类型，不看 MIME、
 *   不做内容嗅探（契约快照 §9），两侧与上游同构。
 * - `family`：给人看的形状词（PDF／图片／Word／幻灯片／表格），供界面派生那一行支持格式说明。
 * - `calibrated`：**本仓有没有成功记录**（不是「官方说支持」）。`true` 的三种在票 01 的真机
 *   实测里拿到过 `state: done` 与根目录 `full.md`（证据 `.scratch/mineru-verify/probe-result.json`，
 *   测试从那份 JSON **解析**出应有集合来钉这里，不手抄第二份）。
 *
 * ⚠️ **`.html` 今天不在名单里，是一次有记录的取舍**（票 07 `## Comments`）：实测的 `-10002`
 * 证明 `model_version` 是**请求级** ⇒ html 不能与非 HTML 同批，而本仓的 `convertPdfBatch`
 * 只有一条 `model_version: 'vlm'` 的通道 ⇒ 收下它就等于给用户一个必然被整批打回的后缀。
 * 加上 html 一次成功记录都没有（探针只跑过 vlm 下的拒绝），所以今天它在**闸门这一侧**
 * 拿到一句干净的本地 400，而不是在 MinerU 那一侧拖着同批好文件一起完蛋。
 * ⚠️ **别拿「html 有独立额度（-60019）」当排除的理由**——票面点名否掉过那个论据：
 * 独立额度恰恰是它该单独成批的证据。上游要收它时，改这一行之外还须给 `convertPdfBatch`
 * 补一条 `MinerU-HTML` 通道（两批各发一次申请）。
 */
export const MATERIAL_FORMATS = Object.freeze([
	{ ext: "pdf", family: "PDF", calibrated: true },
	{ ext: "png", family: "图片", calibrated: true },
	{ ext: "jpg", family: "图片", calibrated: false },
	{ ext: "jpeg", family: "图片", calibrated: false },
	{ ext: "jp2", family: "图片", calibrated: false },
	{ ext: "webp", family: "图片", calibrated: false },
	{ ext: "gif", family: "图片", calibrated: false },
	{ ext: "bmp", family: "图片", calibrated: false },
	{ ext: "doc", family: "Word", calibrated: false },
	{ ext: "docx", family: "Word", calibrated: true },
	{ ext: "ppt", family: "幻灯片", calibrated: false },
	{ ext: "pptx", family: "幻灯片", calibrated: false },
	{ ext: "xls", family: "表格", calibrated: false },
	{ ext: "xlsx", family: "表格", calibrated: false },
].map(Object.freeze));

/**
 * **已知却不受理**的那几项，**逐条登记理由**。
 *
 * ⚠️ 这一张表是白名单那张**腐烂时的告警**：白名单的腐烂方向是「上游加了格式，我们默默拒收」，
 * 而默默拒收是**最坏的一种腐烂**（用户只看到一句 400，不知道是上游加了还是我们没跟上）。
 * 所以判据是 `MINERU_KNOWN_EXTENSIONS − 受理名单 === 本表`（测试双向钉住）：
 * 上游 §8 多出一种而这里没登记理由 → 红 ⇒ 强制重做一次「收不收」的裁决，而不是让它悄悄过去。
 * 空理由＝没登记，而「没登记」会被读成「可以收」，所以每条必须写清。
 */
export const MATERIAL_FORMAT_EXCLUSIONS = Object.freeze([
	{
		ext: "html",
		why: "实测 -10002 证明 model_version 是请求级 ⇒ html 不能与非 HTML 同批（契约快照 §4），"
			+ "而本仓 convertPdfBatch 只有一条 model_version:'vlm' 的通道；且本仓对 MinerU-HTML 零成功记录。"
			+ "⚠️ 排除理由**不是**「它有独立额度（-60019）」——票面点名否掉过那个论据：独立额度恰恰是它该单独成批的证据。"
			+ "要收它：改这一行之外，还须给 convertPdfBatch 补一条 MinerU-HTML 通道（两批各发一次申请）。",
	},
].map(Object.freeze));

/** 受理白名单的扩展名（按 `MATERIAL_FORMATS` 的顺序；派生，别处不另写一份）。 */
export const MATERIAL_FORMAT_EXTENSIONS = Object.freeze(MATERIAL_FORMATS.map((f) => f.ext));

// ── 云端通道**不收**、但用户手上有这种东西的那几档（票 `upload-formats/01`）───────────────
//
// 票面 2026-10-26 的取证结论：MinerU **4.0 本地引擎**原生吃 epub（按 OPF spine 顺序解析），
// 而本产品走的通道是**云端 API**（`POST /api/v4/file-urls/batch` ＋ `extract/task`），
// 该通道的格式清单与上面的受理白名单一致、**不含 epub**（`docs/reference/mineru-api-contracts.md`
// §8 逐字：「md / txt / epub / csv / rtf / odt / ofd / mhtml 不在 v4」）。
// ⇒ 白名单**一个字不改**（它是通道能力的镜像，不是我们能放开的），改的是**拒收时说什么**：
// 只列一句「请选择材料文件（支持的后缀：…）」等于让用户自己去猜，而 epub 是教材来源里最常见的
// 格式之一，猜不出来的人只会以为产品坏了。
//
// ⚠️ **它与 `MATERIAL_FORMAT_EXCLUSIONS` 是两张表，别合并**：那一张是「上游 §8 认识、我们决定
// 不收」的**裁决登记**（今天只有 html），判据是 `已知 − 受理 === 那张表`（闭包钉着，动它会红）。
// 这一张是「上游**这个通道**根本不认识、但用户会拿它来上传」的**出路登记**——epub 不在
// `MINERU_KNOWN_EXTENSIONS` 里，合并进去会把那条闭包弄坏，也会把「要不要收」与「不收时怎么说」
// 两件事糊成一件。
//
// ⚠️ **`guidance` 必须可执行**（票面原话：「不是只列白名单让人自己猜」）：点名工具 ＋ 点名动作，
// 用户照着做就能过。⚠️ 票面给的出路②写的是「解析成 Markdown 后作为文本材料导入」——
// **本仓今天没有「文本材料导入」这条路**（`meta.sources[]` 的唯一写面是 `handleUpload`，
// 后缀闸门之外没有第二条），照抄它就是在屏上承诺一条不存在的路。所以落成**真能走通的**那一版：
// 解析成 Markdown 之后再用 pandoc 转成 `.docx` 上传（`.docx` 在受理名单里）。这条偏离与理由
// 记在票 `.scratch/upload-formats/issues/01` 的 `## Answer`。
//
// 每条四格：
// - `ext`：扩展名（小写、不带点），与受理名单同一套后缀判法。
// - `why`：**为什么云端通道不收它**（一句话，给下一个读到这张表的人）。
// - `container`：**怎么验它是坏件**——`"zip"` ＝ 能读中央目录；`"none"` ＝ 本模块没有这种探针
//   （那就只报「通道外」，⛔ 不许靠猜）。这一格是**每条自己的事实**，不是这个类别的隐含假设。
// - `hint` / `guidance`：两处文案（常显短句／选到时的完整出路），见各自的注释。
export const MATERIAL_FORMAT_OFF_CHANNEL = Object.freeze([
	{
		ext: "epub",
		why: "云端通道（file-urls/batch ＋ extract/task）的格式清单不含 epub——它是 MinerU 4.0 本地引擎"
			+ "才吃的格式（契约快照 §8）。白名单是通道能力的镜像，放不放开不归本仓决定。",
		// 「坏件探针怎么查」是**这一格**的事，不是「通道外」这个类别的隐含假设：epub 是 zip 容器
		// ⇒ 可以读它的中央目录。⚠️ 日后登记一个**不是 zip** 的通道外格式（票面设想过 md 也要出路）
		// 时，这一格若是 `"zip"`，一份**好** .md 会被判成「文件已损坏」——所以它必须逐条写清。
		container: "zip",
		// 上传区常显的那一行：只答「要不要转换、转成什么」，**短**（它紧贴「支持格式」那行，
		// 一长就会把同一屏下面的键继续往下推）。两条出路的具体命令在 `guidance` 里。
		hint: "epub 需先转换才能上传：用 calibre 或 pandoc 转成 PDF 或 .docx（选到它会给出完整做法）。",
		// 选到它时那条红字：**可执行**到能照着敲（票面原话「不是只列白名单让人自己猜」）。
		guidance: "epub 暂不支持云端解析。两条出路：① 用 calibre 或 pandoc 把它转成 PDF 后上传；"
			+ "② 或用本地 MinerU 4.0（命令：mineru parse 这本书.epub）解析成 Markdown，"
			+ "再用 pandoc 转成 .docx 上传。",
	},
].map(Object.freeze));

const MATERIAL_FORMAT_OFF_CHANNEL_BY_EXT = new Map(MATERIAL_FORMAT_OFF_CHANNEL.map((f) => [f.ext, f]));

/** 这一份材料属于「云端通道不收、但有出路」的那一档吗（认不出／不在表里返回 `null`）。 */
function materialFormatOffChannelOf(name) {
	return MATERIAL_FORMAT_OFF_CHANNEL_BY_EXT.get(materialExtensionOf(name)) ?? null;
}

/**
 * 一份材料进云端通道的**四档结局**（票 `upload-formats/01`）。
 *
 * `UNSUPPORTED` 与 `OFF_CHANNEL` 在机器眼里都是「这一次不收」，但**对用户是两件事**：
 * 前者是「你选了个我们压根不认识的杂后缀」（能选的后缀就在文案里），后者是「这个格式云端
 * 通道不收，但有一条能走的路」（换一条路就能成）。`CORRUPT` 再不一样：**文件本身坏了**，
 * 换格式也救不回来。三档的机器码互不相同（票面验收②：错误码要与「格式不支持」区分）。
 */
export const MATERIAL_INTAKE = Object.freeze({
	ACCEPTED: "accepted",
	UNSUPPORTED: "unsupported",
	OFF_CHANNEL: "off-channel",
	CORRUPT: "corrupt",
});

/** 机器码（HTTP 回包里的 `code`）：三档互不相同，客户端/日志据此分辨是哪一件事。 */
const MATERIAL_INTAKE_CODE = Object.freeze({
	UNSUPPORTED: "unsupported-material-format",
	OFF_CHANNEL: "material-channel-unavailable",
	CORRUPT: "material-file-corrupt",
});

/**
 * 「这份文件本身是坏的」那句（**不许**改口去讲换格式——它换格式也还是坏的）。
 * 票面逐字要求报「文件已损坏」，且与「格式不支持」分开。
 */
function corruptOffChannelMaterialMessage(ext) {
	return `这份文件已损坏（${ext} 的 zip 结构不完整：读不出可用的中央目录）。`
		+ `请重新获取一份能正常打开的副本再上传。`;
}

/* ── zip 结构探针（**只判「读不读得到中央目录」这一件事**）─────────────────────────────
 *
 * 为什么住在这里而不是引一个 zip 库：本模块**零依赖**（它被 esbuild 直接打进前端 bundle，
 * 见文件头），而判定要在**界面与服务端两侧**跑（票面：选到 epub 时界面就得把「坏件」与
 * 「格式不支持」分开报，不许等一趟网络往返）。`adm-zip` 只在 Node 侧、且它会**解压**——
 * 我们只需要读文件尾那 22 字节的目录索引。
 *
 * ⚠️ **它不证明「这份 epub 能读」**：只证明**尾部有中央目录且指得到它**（真实坏样本的形状
 * 是「头部有 PK\x03\x04、尾部连 EOCD 都没有」，1.34MB 的残缺下载）。中央目录里的条目坏、
 * OPF 缺、内容加密——这一层全看不见，那些由转换侧与用户自己发现。**少说一句只是啰嗦，
 * 多说一句就是承诺**：所以只有**明确读到矛盾**（尾部没有 EOCD／EOCD 指不到中央目录）才判坏件；
 * 读不懂（zip64 / 条目数字段溢出）**不判坏件**——见下面的提前返回。
 */
const ZIP_EOCD_SIGNATURE = Object.freeze([0x50, 0x4b, 0x05, 0x06]);
const ZIP_CENTRAL_SIGNATURE = Object.freeze([0x50, 0x4b, 0x01, 0x02]);
const ZIP_EOCD_MIN_BYTES = 22;
const ZIP_EOCD_MAX_COMMENT = 0xffff;

/** 把 Buffer / Uint8Array / ArrayBuffer / 其它视图统一成字节视图；认不出返回 `null`。 */
function zipBytesOf(bytes) {
	if (bytes === null || bytes === undefined) return null;
	if (bytes instanceof Uint8Array) return bytes;
	if (bytes instanceof ArrayBuffer) return new Uint8Array(bytes);
	if (ArrayBuffer.isView(bytes)) return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	return null;
}

/** 小端 32 位读（EOCD 里的中央目录偏移/大小）。 */
function zipU32(view, at) {
	return (view[at] | (view[at + 1] << 8) | (view[at + 2] << 16) | (view[at + 3] << 24)) >>> 0;
}

/**
 * 这份字节**看起来坏掉了吗**（`true` ＝ 明确读到矛盾：没 EOCD／EOCD 指不到中央目录）。
 * 认不出（拿不到字节、zip64、条目数溢出字段）一律 **`false`**——**不拿读不懂当坏件**。
 *
 * ⚠️ 名字说的是「看起来坏」而不是「完好」：这个探针只有**证伪**能力，没有「这份 epub 可用」的
 * 断言（见上面那条边界）。取名成 `…Readable` 会把「没证到坏」说成「读得动」，那正是总纲里
 * 「自称 ≠ 实现」的一格。
 */
function zipStructureLooksBroken(bytes) {
	const view = zipBytesOf(bytes);
	if (view === null) return false; // 拿不到字节 ≠ 文件坏了
	if (view.length < ZIP_EOCD_MIN_BYTES) return true;
	// EOCD 在尾部、后面最多跟 64KB 注释：从「最后可能的位置」往回找，且注释长度必须刚好收尾
	// （只看魔数不看收尾，会把压缩数据里偶然出现的 `PK\x05\x06` 当成目录索引）。
	const earliest = Math.max(0, view.length - ZIP_EOCD_MIN_BYTES - ZIP_EOCD_MAX_COMMENT);
	let eocd = -1;
	for (let at = view.length - ZIP_EOCD_MIN_BYTES; at >= earliest; at -= 1) {
		if (view[at] !== ZIP_EOCD_SIGNATURE[0] || view[at + 1] !== ZIP_EOCD_SIGNATURE[1]
			|| view[at + 2] !== ZIP_EOCD_SIGNATURE[2] || view[at + 3] !== ZIP_EOCD_SIGNATURE[3]) continue;
		const commentLength = view[at + 20] | (view[at + 21] << 8);
		if (at + ZIP_EOCD_MIN_BYTES + commentLength === view.length) {
			eocd = at;
			break;
		}
	}
	if (eocd < 0) return true;
	const entries = view[eocd + 10] | (view[eocd + 11] << 8);
	const dirSize = zipU32(view, eocd + 12);
	const dirOffset = zipU32(view, eocd + 16);
	// zip64：字段溢出成哨兵值 ⇒ 这份探针读不懂它的布局，**不判坏件**。
	if (entries === 0xffff || dirSize === 0xffffffff || dirOffset === 0xffffffff) return false;
	if (entries === 0) return false; // 空压缩包：结构自洽（有没有用是另一件事）
	if (dirOffset >= eocd || dirOffset + dirSize > eocd) return true;
	// 中央目录的签名对不上 ⇒ 索引指向的不是目录（截断/嫁接的常见形状）。
	return !(view[dirOffset] === ZIP_CENTRAL_SIGNATURE[0] && view[dirOffset + 1] === ZIP_CENTRAL_SIGNATURE[1]
		&& view[dirOffset + 2] === ZIP_CENTRAL_SIGNATURE[2] && view[dirOffset + 3] === ZIP_CENTRAL_SIGNATURE[3]);
}

/**
 * 一份材料**能不能进云端通道**、不能的话对它说什么——两侧（界面选文件／服务端闸门）**同一份**判据。
 *
 * 票 `upload-formats/01`：拒绝也要分得清是哪一件事，因为三件事要用户做的动作完全不同：
 *   · `ACCEPTED`：照常走；
 *   · `UNSUPPORTED`：只说可选后缀（既有那一档，本票不动）；
 *   · `OFF_CHANNEL`：云端通道不收这个格式，**给一条能走通的路**；
 *   · `CORRUPT`：**文件本身坏了**，换格式也救不回来，得重新拿一份。
 *
 * ⚠️ **只有登记过的通道外格式才做坏件探针**：受理格式（docx/pptx 也是 zip 容器）不走这一层
 * ——把它们也拦在本地等于替 MinerU 先判一次「它读不读得动」，那是另一个决定，不在本票射程
 * （票面只给了一个坏 epub 样本）。所以 `x.docx` 配一份烂字节**照旧返回 `ACCEPTED`**。
 *
 * ⚠️ `bytes` 可以不给：界面那次选文件在拿不到 `arrayBuffer` 时（老浏览器/夹具）只有名字，
 * 那一档返回 `OFF_CHANNEL`——**不许凭空替一份没读到的文件宣布「已损坏」**。
 *
 * @param {object} input
 * @param {string|null|undefined} input.name 文件名（**只认末段后缀**，与 MinerU 的类型判定同构）
 * @param {Uint8Array|ArrayBuffer|Buffer|null} [input.bytes] 文件字节（缺省＝只按名字判）
 * @returns {{status: string, code: string|null, message: string, needsBytes: boolean}}
 *   `needsBytes: true` ＝「这一档**只有看到字节才定得下来**」（通道外与坏件两档）。调用方拿这个
 *   字段决定「要不要为了判定去读一份文件」，⛔ 不要再各自去猜「哪几个状态算要读」——
 *   加第五档时那种猜法会**静默**把新档当成「名字就能判」。
 */
export function judgeMaterialFileIntake({ name, bytes = null } = {}) {
	if (isAcceptedMaterialFormat(name)) {
		return { status: MATERIAL_INTAKE.ACCEPTED, code: null, message: "", needsBytes: false };
	}
	const entry = materialFormatOffChannelOf(name);
	if (entry === null) {
		return {
			status: MATERIAL_INTAKE.UNSUPPORTED,
			code: MATERIAL_INTAKE_CODE.UNSUPPORTED,
			message: unsupportedMaterialFormatMessage(),
			needsBytes: false,
		};
	}
	// 坏件探针只对**表里声明了 zip 容器**的那几格跑：`container` 是每一条自己的事实，
	// 不是「通道外」这个类别的隐含假设（见 `MATERIAL_FORMAT_OFF_CHANNEL` 那一格的注释）。
	if (entry.container === "zip" && bytes !== null && bytes !== undefined && zipStructureLooksBroken(bytes)) {
		return {
			status: MATERIAL_INTAKE.CORRUPT,
			code: MATERIAL_INTAKE_CODE.CORRUPT,
			message: corruptOffChannelMaterialMessage(entry.ext),
			needsBytes: true,
		};
	}
	return {
		status: MATERIAL_INTAKE.OFF_CHANNEL,
		code: MATERIAL_INTAKE_CODE.OFF_CHANNEL,
		message: entry.guidance,
		needsBytes: true,
	};
}


const MATERIAL_FORMAT_SET = new Set(MATERIAL_FORMAT_EXTENSIONS);

/** 末段扩展名（小写、不带点）；没有扩展名返回空串。**只认末段**：`讲义.v2.pdf` 判 pdf。 */
export function materialExtensionOf(name) {
	const match = /\.([A-Za-z0-9]+)$/.exec(String(name ?? "").trim());
	return match === null ? "" : match[1].toLowerCase();
}

/**
 * 这份材料在受理白名单里吗（**只看后缀**，与 MinerU 的类型判定同构，契约快照 §9）。
 * 大小写不敏感（`讲义.PDF` 收）；无扩展名不收（上游实测：无扩展名文件判 -60002）。
 */
export function isAcceptedMaterialFormat(name) {
	return MATERIAL_FORMAT_SET.has(materialExtensionOf(name));
}

const MATERIAL_FORMAT_BY_EXT = new Map(MATERIAL_FORMATS.map((f) => [f.ext, f]));

/**
 * 这一份材料的格式条目（`MATERIAL_FORMATS` 里那一格；认不出／不在受理名单里返回 `null`）。
 *
 * ⚠️ **「按格式」一律从这里派生**（票 `mineru-formats/11`）：界面要判「这份材料是什么形状」
 * 时读 `family`，不许各处自己判一遍后缀——受理闸门判的是「收不收」，这里答的是「它是什么」，
 * 同一份 `MATERIAL_FORMATS` 供两问，别处再写一份 `.endsWith('.pdf')` 就是第二套名单。
 */
export function materialFormatOf(name) {
	return MATERIAL_FORMAT_BY_EXT.get(materialExtensionOf(name)) ?? null;
}

/** 原件在书夹里的目录（**机器身份词**：路径一个字不改，见 `workflow.js` 的 `sourcesDir`）。 */
const ORIGINAL_SOURCE_DIR = "sources";

/** 一份原件在书夹内的相对路径（`sources/<上传时的文件名>`；路径形状只有这一份）。 */
export function originalSourceRel(file) {
	return `${ORIGINAL_SOURCE_DIR}/${String(file ?? "")}`;
}

/**
 * **这份原件给不给预览入口**——`ADR-0011` 决策 2 的**按格式例外**，不是推翻它。
 *
 * `ADR-0011` 决策 2 不给原件预览入口的理由是「原件是**版式件**，翻开它等于回到纸质扫描件」。
 * 那条论证对版式件成立、对**一张板书照片**不成立（照片的原件就是最好的核对对象），而
 * 14 种受理格式里 9 种转换质量**未标定**（`MATERIAL_FORMATS[].calibrated`）——与其赌转换质量，
 * 不如把核对入口挪到原件。于是判据落在**格式族**上：`family === 'PDF'` 保持不给，其余给。
 *
 * - 判据读的是 `MATERIAL_FORMATS[].family`（票 07 落的逐条标记），**不自己判一遍后缀**；
 * - **认不出的一律不给**（`false`）：白名单外的后缀没有族，也就没人能承诺「点开有东西看」；
 * - 与 `productOpenMode` **是两条判据、两个出口**：那条管产物（哪些有正文、开不开右栏），
 *   这条管材料行的原件入口。原件**不进** `productOpenMode` 的 `'preview'` 分支——那份清单
 *   同时是后端 `/textbook/file` 的白名单，原件进去等于顺带放行一条读原件字节的路由。
 *
 * ⚠️ **给入口 ≠ 承诺宿主能渲染**：那条预览通道是**宿主的**阅读器（`ADR-0010` 决策 1 的
 * `sidebarRight.openResource`），它在图片／PDF／PPTX 上的渲染能力属宿主事实，本仓没有随库
 * 的契约快照可查（见票 `mineru-formats/11` 的 `## Comments`）。本函数只答「给不给入口」。
 */
export function originalPreviewOpenable(name) {
	const format = materialFormatOf(name);
	return format !== null && format.family !== "PDF";
}

/**
 * 这份材料的**形状词**（`MATERIAL_FORMATS` 的 `family`：PDF／图片／Word／幻灯片／表格）。
 * 不在受理名单里（无扩展名／后缀不在名单）返回**空串**——读不出形状就不许替它编一个。
 *
 * ⚠️ 票 10：**按格式**下判断的**唯一**入口。它由 `MATERIAL_FORMATS` 派生，
 * 所以别处（判「自动切开对不对它生效」那一族）**不许再自己判一遍后缀**——
 * 受理名单改了而判定还停在手抄的 `/\.pdf$/` 上，就是两侧分叉的那种病（票 07 的病根）。
 *
 * ⚠️ 复用上面那个 `MATERIAL_FORMAT_BY_EXT`（code-review P3）：它与正上方建好 Map 的
 * `materialFormatOf()` 认的是**同一件事**（「这份材料的格式条目是哪一格」），
 * 两份实现迟早分叉——而 `materialFormatOf` 认不出的（白名单外的后缀）这里必须同样返回空串。
 */
export function materialFormatFamily(name) {
	return materialFormatOf(name)?.family ?? "";
}

/**
 * 能被**本机自动切开**的那一族（由名单里 `ext === "pdf"` 那一行的 `family` 派生）。
 *
 * ⚠️ 派生而不是写死显示词 `「PDF」`：那是个**给人看的形状词**，改一次措辞（→「PDF 文件」）
 * 这道判据就静默失灵；族本身才是判据的支点（票 07 立这条名单就是为了这个）。
 * 名单里没有 pdf ⇒ 空串，而空串**不认任何族**（下面那道判据里显式挡掉），不许退化成「什么都算」。
 */
const AUTO_SPLIT_FAMILY = MATERIAL_FORMATS.find((f) => f.ext === "pdf")?.family ?? "";

/**
 * 这份材料**能不能被自动切开**（页数按 `page_ranges`、体积按本机 PyMuPDF 物理切）。
 *
 * 事实依据（契约快照 §6，`mineru/backend/analyze.py:148-149`）：`page_ranges` **官方只对 PDF 生效**，
 * 判的是**上传文件的后缀**；本机那条 PyMuPDF 物理切分链路也只对 PDF 跑得起来。
 * ⚠️ 这**不是**「非 PDF 没有页数」——200 页上限对所有格式都适用（`-60006` 无 PDF 限定）；
 * 切不动的是 `page_ranges` 这个参数与本地物理切分这两条链路。
 *
 * 认不出的（无扩展名／不在受理名单）一律 **false**：少说一句只是啰嗦，多说一句就是承诺。
 */
export function isAutoSplittableMaterial(name) {
	return AUTO_SPLIT_FAMILY !== "" && materialFormatFamily(name) === AUTO_SPLIT_FAMILY;
}

/**
 * `<input accept>` 的取值（浏览器文件选择器据此列出可选格式）。
 * ⚠️ 这是**受理白名单**那一份，**不是** `MINERU_KNOWN_EXTENSIONS`——那份含 `.html`，
 * 在这里放行就等于让用户选得到一个必然被上游打回的后缀。
 */
export function materialFormatAccept() {
	return MATERIAL_FORMAT_EXTENSIONS.map((ext) => `.${ext}`).join(",");
}

/**
 * 超出白名单时的人话（服务端 400 与界面预检共用这一句）。
 * 可选格式**逐个列在文案里**（取自 `MATERIAL_FORMATS`，不另抄一份）——判据照同级 `domain-rules.js` 里
 * `ROLES` 越界那句：调用方看得见该送什么，才叫可读。
 * ⚠️ **文案里不许出现「PDF」二字**（票面验收）：它是**扩展名事实**（`.pdf` 那种小写后缀），
 * 不是把上传入口说成「只收 PDF」——那样 `.docx` 上传成功时屏上就在说假话。
 */
export function unsupportedMaterialFormatMessage() {
	const list = MATERIAL_FORMAT_EXTENSIONS.map((ext) => `.${ext}`).join("、");
	return `请选择材料文件（支持的后缀：${list}）`;
}
