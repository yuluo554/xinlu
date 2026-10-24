# assets/ · 第二版美术素材暂存（v1 不引用）

> **定位**：本目录是第二个版本的美术素材收集区。当前第一版（v1，M4 进行中）的任何代码、构建与校验都不引用本目录；目录未加入 git 跟踪，避免混入 M4 提交。
> **采集日期**：2026-10-24。本机直连 github.com 不通，克隆与原始件均经 gh-proxy.com 镜像获取；opengameart.org 直连；itch.io 超时、craftpix.net 403，未采集。
> **本 README 是本目录唯一溯源台账**；各上游自带的许可/来源文件已原样随附。

## 目录结构

```
assets/
├── dafeiyu/                          「大肥鱼」合集（处理版，透明 WebP，可直接用于网页）
│   ├── fish/                         62 张：表情 19（01~26 编号）/ 大肥鱼 GIF 拆帧 23（idle·working·success·hover）/ 鲸鱼立绘 13（whale-*）/ 三视图 3（fish-front·side·back）/ 水印·头像·设定表·饭碗 4
│   ├── favicon.svg
│   ├── LICENSE-上游皮肤仓库-MIT.txt
│   └── SOURCES-上游皮肤仓库.md        （上游自带的素材来源说明，原样保留）
├── upstream/                         原始件留底
│   ├── dafeiyu-pet/                  鲸鱼娘三视图 sprites 14 张 + icon.ico + LICENSE（MIT，原文随附）
│   ├── codex-deepseek-pet/           经典梗图 1254×1254 PNG + portrait 立绘 + 图集 manifest.json + ASSET_LICENSE.md + LICENSE（署名许可 1.0）
│   └── deepseek-fat-fish-codex-pet/  idle / working / success / hover 四张 GIF 竖排精灵图（上游无许可证文件 ⚠️）
└── cc-by/                            严格可商用素材（须署名）
    ├── open-ocean-game-art/          OpenOceanArt.zip（原包留底）+ 解压 27 件：Fish 18 / Other 5 / UI 4
    └── simple-worlds-ocean-animals/  SVG 源文件 + LICENSE.TXT（上游随附）+ jellyfish.svg（v2-M3' 提取件：大 SVG 水母组装态 g9785 + defs 引用闭包，12.1KB；一次性提取脚本未入库）
```

## 溯源与许可台账

| 素材组 | 来源 | 许可证 | 商用 | 备注 |
|---|---|---|---|---|
| `dafeiyu/fish/` 62 张 | [roseion/dsh-dayu-fish-skin](https://github.com/roseion/dsh-dayu-fish-skin)（仓库 MIT，`fish/` 为其处理产物） | 仓库 MIT 覆盖其代码与处理；**底层素材为第三方梗图/二创** | ⚠️ 谨慎 | 上游 SOURCES.md 自述「素材来自互联网公开项目，未自行创作，仅供个人学习使用」；其 ASSETS.md 记载完整处理链（抠图/拆帧/缩放脚本）。**D1 拍板 B 档（2026-10-24）：处理版已入库分发**，已知限制声明见下节与 `public/credits.md` |
| `upstream/dafeiyu-pet/` | [1190fasheqi/dafeiyu-pet](https://github.com/1190fasheqi/dafeiyu-pet) | MIT（c）2026 | ✅ | LICENSE 原文随附；「鲸鱼娘·大肥鱼」透明桌宠三视图多尺寸 |
| `upstream/codex-deepseek-pet/`（`assets/whale/` 系 AI 生成素材） | [YunYueSama/codex-deepseek-pet](https://github.com/YunYueSama/codex-deepseek-pet) | 大肥鱼项目署名许可 1.0（自定义署名许可，非标准 MIT） | ✅ 须署名 | 许可原文与素材边界声明随附（ASSET_LICENSE.md）；**whale/ 全量图集约 150MB 仅登记未下载**（见下节） |
| `upstream/codex-deepseek-pet/你这吃白饭的蓝色大肥鱼.png` | 同上 | **上游明示：社区参考图，原作者与授权尚待核实** | ❌ 不得商用 | 仅留底参考；上游 ASSET_LICENSE.md 原话「不能仅凭本仓库的署名许可将其视为可自由转载或商用的原创素材」 |
| `upstream/deepseek-fat-fish-codex-pet/` 4 张 GIF | [gmskywalker/deepseek-fat-fish-codex-pet](https://github.com/gmskywalker/deepseek-fat-fish-codex-pet) | **上游仓库无 LICENSE 文件** | ⚠️ 默认保留所有权利 | 皮肤仓库 `fatfish-*` 拆帧即源于此；按最低风险处理：与梗图同级对待 |
| `cc-by/open-ocean-game-art/` | [OpenGameArt · Open Ocean Game Art](https://opengameart.org/content/open-ocean-game-art-mostly-2d-fish-animations) | CC-BY 3.0 / 4.0 双许可 | ✅ 须署名 | 作者 Paul Kankiewicz（AllyProductions）；像素鱼群动画帧 + 鲨鱼图标 + UI 按钮/光标 |
| `cc-by/simple-worlds-ocean-animals/` | [OpenGameArt · Simple Worlds Ocean Animals](https://opengameart.org/content/simple-worlds-open-content-series-ocean-animals) | CC-BY 4.0 | ✅ 须署名 | 作者 Jana Ochse（2D!PIXX）；简形卡通海洋动物，SVG 分层源文件可再动画 |

## DeepSeek 形象提示（全部大肥鱼素材共用）

「蓝色大肥鱼 / 鲸鱼娘」是 DeepSeek 吉祥物的社区二创形象。codex 仓库 ASSET_LICENSE.md 明示：许可「不授予底层参考作品、角色设计、标志等第三方内容的额外权利，也不代表 DeepSeek 官方授权」。第二版若公开发布或商用，形象权利风险需自行评估；本台账仅按上游声明如实记录。

### 已知限制声明（B 档分发随附，D1 拍板 2026-10-24）

D1 拍板为 **B 标准**（plan/v2/00 §决策记录）：CC-BY/MIT 素材 + `fish/` 62 张处理版 + whale 系入库分发，配本声明与 credits 署名（`public/credits.md`）。分发件中的已知限制：

- `fish/` 19 张表情底层素材为互联网流传的「吃白饭的大肥鱼」表情包（上游自述「仅供个人学习使用」，原作者不可考）；仓库 MIT 许可覆盖抠图/拆帧等处理劳动，不覆盖底层画作权利。
- 「蓝色大肥鱼 / 鲸鱼娘」形象为 DeepSeek 社区二创，非 DeepSeek 官方授权；商用场景的形象权利风险需自行评估。
- 4 张 GIF 原件与梗图原图维持 ❌ 层排除（上游无 LICENSE / 原作者授权待核实），不进 git、不进 dist、不进 Release。

## v2 可直接粘贴的署名文案

```text
Open Ocean Game Art by Paul Kankiewicz (CC-BY 3.0/4.0)
Ocean Animals by Jana Ochse / 2D!PIXX (CC-BY 4.0) — www.2dpixx.de
大肥鱼素材：YunYueSama/codex-deepseek-pet（大肥鱼项目署名许可 1.0）；1190fasheqi/dafeiyu-pet（MIT）
```

## 登记未下载（待获取，含阻断原因）

| 素材 | 获取路径 | 阻断原因 |
|---|---|---|
| codex `assets/whale/` 全量图集 25 件（约 150MB；manifest v5：512px 单元 × 32 动作） | 逐件 raw 镜像下载，或整仓 clone | 镜像实测约 35KB/s 且曾截断大文件（需 `curl -C -` 续传）；本次已取 manifest.json + portrait.png 留底 |
| 「吃白饭的大肥鱼」表情包原始 webp 23 张 | 仅存于上游作者本地（dsh 仓库 ASSETS.md 注明「用户本地下载」），无公开原件 | 不可获取；处理版 19 张已在 `fish/` |
| itch.io CC0 鱼类素材（如 PixelFishes 50+ 种、Kelano Studio Wild Fish 30 种） | itch.io 对应标签页 | 本机访问 itch.io 超时，未采集 |
| `upstream/dafeiyu-pet/sprites/正面_238.png`（重新下载） | 上游 raw 经镜像重下（`curl -C -` 校验 IEND 闭合） | 2026-10-24 实测坏件：IDAT 声明 79327B 与实际错位（镜像续传截断先例，v2/04 风险表）；web-ready 转换已剔除该件，187/306 档完好 |

## 跟踪策略（v2-M1' 1.2 落地，2026-10-24；D1=B 增记同日）

- **git 只跟踪**：`assets/web-ready/`（压缩 WebP，单张 ≤50KB 已核查 40/40 全绿）+ 许可/溯源文本（LICENSE / SOURCES / ASSET_LICENSE / manifest.json）+ `simple-worlds` SVG 矢量源 + **⚠️ `fish/` 62 张处理版 webp（D1=B 档显式豁免，2026-10-24；含 dist 引用的 19 张表情 / whale-idle 等，62 张体积约 1.9MB 原样入库，`fish/*` + `!fish/*.webp` 形态豁免、非 webp 仍排除）**。
- **原始位图件（png/gif/ico）一律不入 git**（.gitignore 扩展名规则，本地留底）；❌ 层（梗图原图、4 张 GIF 原件）与 upstream 无许可目录维持排除。
- **web-ready 转换口径**：ffmpeg libwebp，q85 起，>50KB 依次降档（缩宽 1024→q60、缩宽 800→q45 / 缩宽 512→q70）；`正面_238.png` 因源损坏未转换（见上表）。
- **v2-M3' dist 引用集压缩记录（2026-10-24，预算门上线）**：dist 引用的 19 张表情 + `whale-idle` 重压至 192×192 q65（600KB→约 325KB，ffmpeg libwebp lanczos；320→192 目检画质留痕 docs/v2-M3-gates.md）、`watermark.webp` 重压至 200×200 q65（92.9KB→12.8KB，印制尺寸 ≤120px 的 1.67x）；open-ocean 组 `WikndWakerWater` 重压至 768×768 q50（44.1→31.8KB）、`Clouds` 重压至 640×640 q50（43.7→25.3KB）——两者随 v2-M3' 3.3 场景氛围进 dist。**非 dist 引用件维持 D1=B「原样入库」不动**（character-sheet / whale-* 立绘 / GIF 拆帧 / 三视图等 43 张；预算门 WARN 只扫 dist 内文件）。

## 工程注意

- 本目录**未 git add**。M4 收尾提交时勿 `git add -A` 全仓扫入；跟踪与入库策略待 v2 立项时决策。
- 中文文件名（sprites/侧面.png 等）在 git 输出显示为八进制转义属显示问题，`git -c core.quotepath=false status` 可读。
- Open Ocean 保留原 zip 留底，解压件在同名子目录 `OpenOceanArt/` 并存。
- 所有下载均校验过尺寸/魔数（PNG IEND、GIF 头），梗图曾因镜像截断，已断点续传补全至 1530733 字节。

## v3 增量节（v3-M2'' 2.1 素材采集，2026-10-24）

> 依据 plan/v3/02 §九（D3 拍板：CC0 底图/纹理 + Game-Icons 事件图标层）。许可门白名单扩展**先于**素材入库（plan/v3/03 模块 6 排序纪律），本节是新增素材的检索式与下载留痕。

### Game-Icons 事件图标层（`game-icons/`）

| 项 | 内容 |
|---|---|
| 来源 | game-icons.net 官方全量包 `https://game-icons.net/archives/000000/transparent/game-icons.net.svg.zip`（4,168,300 字节；直连一次成功，未走镜像） |
| 许可证 | CC-BY 3.0（个别作者 CC0；本次 175 枚无 CC0 件）；`game-icons/LICENSE-game-icons.txt` 原文随附 |
| 选取 | 175 枚（每事件 1 枚、零重复）；对照表单源 `src/data/icon-map.json`；逐张对文案清单 `docs/v3-M2-icons.md` |
| 处理 | **原样入库**（官方包即最小化产物，实测无 metadata 可剥）；路径 `game-icons/icons/<作者>/<名>.svg`，作者目录即署名单位 |
| 检索式 | 无需检索（全量包直接解取）；替代路径实测：gh-proxy/jdelivr raw 均 404（仓库路径不含裸 author/ 顶层），`all.svg.zip` 旧地址 301→404 |
| 署名 | `Icons made by Lorc, Delapouite and contributors (game-icons.net, CC-BY 3.0)`（public/credits.md 已加，许可门 CREDIT_LINES 同步） |

### CC0 场景底图/纹理（`cc0/parchment/`）

| 素材 | 来源 | 许可证 | 检索式 | 处理 |
|---|---|---|---|---|
| `parchment-bg.webp`（1.9KB） | [OpenGameArt · Parchment background](https://opengameart.org/content/parchment-background)（FelisChaus_ParchmentBackground.jpg，380×421） | CC0（页面明示） | OGA 高级搜索 `keys=paper texture` + 类型=Texture + 许可=CC0，结果第 7 位 | ffmpeg libwebp q60 原尺寸直转 |
| `parchment-fold.webp`（5.7KB） | [OpenGameArt · Old Parchment Paper](https://opengameart.org/content/old-parchment-paper)（parchment.jpg，640×480） | CC0（作者页明示） | 同上，结果第 3 位 | ffmpeg 中心裁剪 520×360 后 q60（去撕边留十字折痕，画卷质感） |
| 上游 jpg 留底 | 同上两件原始件 | — | — | 留 `cc0/parchment/` 本地（.gitignore `assets/**/*.jpg` 扩展，原始位图不入 git 纪律延续） |

跟踪策略：`assets/game-icons/`（SVG 原样 + 溯源文本）与 `assets/cc0/**/*.webp`（处理版）入 git；jpg 原始件不入。

### v3-M3'' 增补（2026-10-24，3.4 支线补齐素材）

| 项 | 内容 |
|---|---|
| 来源 | Game-Icons 官方全量包**重新下载核验**（`https://game-icons.net/archives/000000/transparent/game-icons.net.svg.zip`，4,168,300 字节与 M2'' 采集一致；直连一次成功）；无新增来源方 |
| 许可证 | CC-BY 3.0（不变）；`game-icons/LICENSE-game-icons.txt` 已随附；public/credits.md 署名行不变（覆盖全部作者） |
| 选取 | **增补 68 枚**（love/-4xx、friend/-5xx、health/-6xx 三线新事件每事件 1 枚；全库零重复 243/243）；逐张对文案增行 `docs/v3-M2-icons.md` §v3-M3'' 增补 |
| 处理 | 原样入库（同 M2''：官方包即最小化产物）；路径 `game-icons/icons/<作者>/<名>.svg`；validate I 区随库扩至 243/243，许可门白名单不变 |
