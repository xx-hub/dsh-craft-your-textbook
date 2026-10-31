/**
 * 材料准备那一步的**逐源表态面**（票 `mineru-formats/03` · ADR-0028 决策 3 ·
 * `CONTEXT.md`「材料缺口」）。
 *
 * ## 它为什么必须长在这里
 *
 * 被否掉的「标红后继续」（Q7-B）留下的是一个**全屏无解的红**：阶段页是只读的
 * （ADR-0012 决策 6），上传卡在 phase>1 已退场，于是红行摆在那儿而用户一个能点的都没有——
 * 那是「承诺过度」的反向形态。这张票的判据是反过来的：**材料不齐 ⇒ 不推进**，
 * 停在材料准备，而「材料准备」这张卡（`focusCardKey` 在 `phase === 1` 时给的就是它）
 * 上每一份红源都必须有**一个能走的动作**。
 *
 * 两个出口，一个不多：
 *   · **补传**——把这一份原件再给一次。请求走既有上传写面（`onReplaceSource`），
 *     服务端把那一格放回 `pending` 并当场接上状态机（`handleUpload` 的 resent 分支）；
 *   · **删掉这份**——承认缺这一份。`onRemoveSource` 打到契约动作 `source-remove`，
 *     **两步确认**：删的是用户自己传进来的原件，不可逆。
 *
 * ## 三条不许越界的边界
 *
 * 1. **逐源，不是批次**：这里每一行只讲**这一份**（`CONTEXT.md`「材料缺口」的 ⚠️ 那条）——
 *    「N 份转换失败」是批次口径，是错误卡那一句的事，两句话不许混进同一行。
 * 2. **它不是工作台状态词**：「轮到你／我正在做／已完成」三个名额一个都不占
 *    （`CONTEXT.md`「工作台状态词」）。它是一份**明细**，从 `meta.sources[].converted`
 *    派生的——所以它没有、也不许有自己的状态位。
 * 3. **判据只有一份**：读法一律经 `view-rules` 再导出的 `convertedState`
 *    （`domain-rules` 那个单一真相源），本文件不内联判 `converted`。
 *    没有缺口时**整块不渲染**（不是渲染一块空的）。
 * 4. **能选到的格式与能交上去的判据也各只有一份**（票 `mineru-formats/07` / `10`）：
 *    那颗文件选择器的 `accept` 从 `materialFormatAccept()` 派生（受理白名单**一份常量**），
 *    补传那一刻的体积预检走 `judgeMaterialUploadSize`（两条上限的**共享判据**）——
 *    两处都**不许**在本文件里另写一份。写死 `accept: ".pdf"` 的后果是：受理闸门早就收
 *    14 种格式，而转失败的那份若是 `.docx`／`.pptx`／`.png`，用户对红源**彻底无路可走**
 *    （服务端闸门是收的）；自己写一道 `picked.size > MAX_UPLOAD_BYTES` 的后果是：
 *    300MB 的 `.pptx` 走补传这条路**一句预检都没有**，而上传卡那条路有。
 */
import { createElement, useState } from "react";
import { S } from "./styles.js";
import { judgeMaterialUploadSize, materialFormatAccept } from "../domain-rules.js";
import { convertedState, convertedIcon } from "./view-rules.js";

/** 一份材料的缺口说成什么样：逐源，只讲这一份，且**不承诺**机器替用户决定该怎么办。
 *  ⚠️ 票 `pre-gold-build/02`：这一行**不再印角色**——没转成的源**永远没有角色**（它没有分片，
 *  角色那一路判定也覆盖不到它，射程＝`converted === 'ok'`），所以也⛔ 不许补一个空值充数。 */
function gapLine(source) {
	return `${convertedIcon(source)} ${source.file} —— 这一份没转成，这本书暂时缺它。`;
}

/**
 * @param {object} props
 * @param {object[]} props.sources `meta.sources`（原件清单；三值由 `convertedState` 归一）
 * @param {(file: File, source: object) => Promise<void>} props.onReplaceSource 补传这一份
 * @param {(file: string) => Promise<void>} props.onRemoveSource 删掉这份（承诺动作名由上层拿目录过门）
 * @param {boolean} [props.busy] 上层正忙着别的动作
 * @param {boolean} [props.autoSplit] 本机**真探到**了切分能力（承 `UploadArea` 同一份；
 *   缺省 false＝「探不到」，少说一句只是啰嗦，多说一句就是承诺）
 */
export function MaterialGapList(props) {
	const { sources, onReplaceSource, onRemoveSource, busy = false, autoSplit = false } = props;
	// 判定经 convertedState（单一真相源，老书布尔只读归一）；本文件不内联读 `converted`。
	const gaps = (sources ?? []).filter((source) => convertedState(source) === "failed");
	// 正在处理哪一份（补传要传字节、删掉要落盘，两者都不是瞬时的）：逐份的忙碌态，
	// 不做成整块禁用——三份红源里补完一份，那一份就该立刻从这张表上消失，
	// 其余两份不该被一起冻住。
	const [working, setWorking] = useState(null);
	const [confirming, setConfirming] = useState(null);
	const [error, setError] = useState(null);
	// 票 10 的两格：拦（红字）与**说**（不拦、只如实告知会不会先切开）分开。
	// 合成一格的后果是「300MB 的 PDF 会被当失败」或者「它悄悄什么也不说」——
	// 前者冤枉一份好材料，后者是承诺过度。措辞承 `UploadArea` 同一份判据，两屏说同一句话。
	const [notice, setNotice] = useState(null);

	if (gaps.length === 0) return null;

	const run = async (file, action, pendingNotice = null) => {
		setWorking(file);
		setError(null);
		// `pendingNotice` 是「不拦但要说」那一档（票 10）：它**跟着这次动作走**，所以重开一次
		// 动作时重新挂上——而不是在动作开始时清掉（那样它一闪就没，用户根本没读到）。
		setNotice(pendingNotice);
		try {
			await action();
			setConfirming(null);
		} catch (err) {
			setError(String(err instanceof Error ? err.message : err));
		} finally {
			setWorking(null);
		}
	};

	/**
	 * 补传：用户挑的那份**以缺口那一格的名字**落上去（换了文件名就是新材料，不是补传）。
	 *
	 * 预检走**同一份**共享判据（`domain-rules.judgeMaterialUploadSize`，票 10）：它认两道上限
	 * （仓门 500MB / MinerU 200MB）并**按格式分档**——非 PDF 那道是拦（自动切只对 PDF 生效），
	 * PDF 那道是不拦、只如实说会不会先切。所以 300MB 的 `.pptx` 在**这条路上同样被拦**，
	 * 而 300MB 的 `.pdf` 照发（只多一句说明）。`autoSplit` 由宿主 `/textbook/settings` 的
	 * `autoSplitAvailable` 经 `UploadArea` 透传下来，与上传卡那条路**同一个事实**。
	 */
	const pick = (source) => (event) => {
		const picked = event.target.files?.[0] ?? null;
		// 选完就把 input 清空：同一个文件再选一次（重试一次失败的补传）要还能触发 onChange。
		if (event.target) event.target.value = "";
		if (picked === null) return;
		setError(null);
		setNotice(null);
		const verdict = judgeMaterialUploadSize({ name: picked.name, size: picked.size, autoSplit });
		if (verdict.blocked) {
			setError(verdict.message);
			setNotice(null);
			return;
		}
		// **不拦但要说**：PDF 超 200MB 时 `blocked` 是 false 而 `message` 非空——那是「会/不会
		// 先切开」的说明，不是拦路的话。丢掉它就是把「本机能切」这件事悄悄咽下去。
		const said = verdict.message === "" ? null : verdict.message;
		void run(source.file, () => onReplaceSource(picked, source), said);
	};

	return createElement(
		"div",
		{
			style: {
				marginTop: "10px",
				padding: "8px 10px",
				borderRadius: "10px",
				border: "1px solid var(--dsw-alias-state-error-primary)",
			},
		},
		createElement(
			"div",
			{ style: { fontSize: "13px", fontWeight: 600 } },
			"⚠️ 材料还没齐，下面每一份都要你表个态",
		),
		createElement(
			"p",
			{ style: { margin: "4px 0 6px", fontSize: "12px", opacity: 0.8 } },
			"书停在这一步等你——处理完每一份，才会往下走。",
		),
		...gaps.map((source) =>
			createElement(
				"div",
				{
					key: source.file,
					style: {
						padding: "6px 0",
						borderTop: "1px solid var(--dsw-alias-border-l2)",
						fontSize: "13px",
					},
				},
				createElement("div", null, gapLine(source)),
				// 补传：一个真文件选择器（不是「重试」那种把同一份原件再跑一遍的假补传）。
				createElement(
					"label",
					{ style: { ...S.label, display: "inline-block", marginRight: "10px" } },
					"补传这一份：",
					createElement("input", {
						type: "file",
						// ⚠️ **从受理白名单派生，不写死扩展名**（票 `mineru-formats/07`）：写死
						// `".pdf"` 时，一份转失败的 `.docx`／`.pptx`／`.png` 在这里**连选都选不到**，
						// 而服务端闸门是收的 ⇒ 对那份红源彻底无路可走（票 03 的硬要求）。
						accept: materialFormatAccept(),
						disabled: busy || working !== null,
						style: S.disabled({ ...S.input, display: "inline-block", width: "auto", margin: "2px 0" }, busy || working !== null),
						onChange: pick(source),
					}),
				),
				confirming === source.file
					? createElement(
							"span",
							{ style: { fontSize: "12px" } },
							"删了原件就找不回来了。",
							createElement(
								"button",
								{
									style: S.disabled({ ...S.ghostBtn(true), padding: "2px 8px", fontSize: "12px", margin: "0 6px" }, busy || working !== null),
									disabled: busy || working !== null,
									onClick: () => void run(source.file, () => onRemoveSource(source.file)),
								},
								"确认删掉这份",
							),
							createElement(
								"button",
								{
									style: { ...S.smallLink, marginLeft: "4px" },
									onClick: () => setConfirming(null),
								},
								"算了",
							),
						)
					: createElement(
							"button",
							{
								style: S.disabled({ ...S.smallLink }, busy || working !== null),
								disabled: busy || working !== null,
								onClick: () => setConfirming(source.file),
							},
							"删掉这份",
						),
			),
		),
		error === null ? null : createElement("p", { style: S.error }, error),
		// 「不拦但要说」那一档（票 10）：说明的话不该长得像一次失败，所以不走 error 那一格
		// ——措辞与配色承 `UploadArea` 那一档（同一份判据，同一句话）。
		notice === null
			? null
			: createElement(
					"p",
					{ style: { margin: "4px 0 0", fontSize: "12px", opacity: 0.85 } },
					`ℹ️ ${notice}`,
				),
	);
}
