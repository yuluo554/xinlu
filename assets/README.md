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
    └── simple-worlds-ocean-animals/  SVG 源文件 + LICENSE.TXT（上游随附）
```

## 溯源与许可台账

| 素材组 | 来源 | 许可证 | 商用 | 备注 |
|---|---|---|---|---|
| `dafeiyu/fish/` 62 张 | [roseion/dsh-dayu-fish-skin](https://github.com/roseion/dsh-dayu-fish-skin)（仓库 MIT，`fish/` 为其处理产物） | 仓库 MIT 覆盖其代码与处理；**底层素材为第三方梗图/二创** | ⚠️ 谨慎 | 上游 SOURCES.md 自述「素材来自互联网公开项目，未自行创作，仅供个人学习使用」；其 ASSETS.md 记载完整处理链（抠图/拆帧/缩放脚本） |
| `upstream/dafeiyu-pet/` | [1190fasheqi/dafeiyu-pet](https://github.com/1190fasheqi/dafeiyu-pet) | MIT（c）2026 | ✅ | LICENSE 原文随附；「鲸鱼娘·大肥鱼」透明桌宠三视图多尺寸 |
| `upstream/codex-deepseek-pet/`（`assets/whale/` 系 AI 生成素材） | [YunYueSama/codex-deepseek-pet](https://github.com/YunYueSama/codex-deepseek-pet) | 大肥鱼项目署名许可 1.0（自定义署名许可，非标准 MIT） | ✅ 须署名 | 许可原文与素材边界声明随附（ASSET_LICENSE.md）；**whale/ 全量图集约 150MB 仅登记未下载**（见下节） |
| `upstream/codex-deepseek-pet/你这吃白饭的蓝色大肥鱼.png` | 同上 | **上游明示：社区参考图，原作者与授权尚待核实** | ❌ 不得商用 | 仅留底参考；上游 ASSET_LICENSE.md 原话「不能仅凭本仓库的署名许可将其视为可自由转载或商用的原创素材」 |
| `upstream/deepseek-fat-fish-codex-pet/` 4 张 GIF | [gmskywalker/deepseek-fat-fish-codex-pet](https://github.com/gmskywalker/deepseek-fat-fish-codex-pet) | **上游仓库无 LICENSE 文件** | ⚠️ 默认保留所有权利 | 皮肤仓库 `fatfish-*` 拆帧即源于此；按最低风险处理：与梗图同级对待 |
| `cc-by/open-ocean-game-art/` | [OpenGameArt · Open Ocean Game Art](https://opengameart.org/content/open-ocean-game-art-mostly-2d-fish-animations) | CC-BY 3.0 / 4.0 双许可 | ✅ 须署名 | 作者 Paul Kankiewicz（AllyProductions）；像素鱼群动画帧 + 鲨鱼图标 + UI 按钮/光标 |
| `cc-by/simple-worlds-ocean-animals/` | [OpenGameArt · Simple Worlds Ocean Animals](https://opengameart.org/content/simple-worlds-open-content-series-ocean-animals) | CC-BY 4.0 | ✅ 须署名 | 作者 Jana Ochse（2D!PIXX）；简形卡通海洋动物，SVG 分层源文件可再动画 |

## DeepSeek 形象提示（全部大肥鱼素材共用）

「蓝色大肥鱼 / 鲸鱼娘」是 DeepSeek 吉祥物的社区二创形象。codex 仓库 ASSET_LICENSE.md 明示：许可「不授予底层参考作品、角色设计、标志等第三方内容的额外权利，也不代表 DeepSeek 官方授权」。第二版若公开发布或商用，形象权利风险需自行评估；本台账仅按上游声明如实记录。

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

## 跟踪策略（v2-M1' 1.2 落地，2026-10-24）

- **git 只跟踪**：`assets/web-ready/`（压缩 WebP，单张 ≤50KB 已核查 40/40 全绿）+ 许可/溯源文本（LICENSE / SOURCES / ASSET_LICENSE / manifest.json）+ `simple-worlds` SVG 矢量源。
- **原始位图件（png/gif/ico）一律不入 git**（.gitignore 扩展名规则，本地留底）；⚠️ `fish/` 62 张与 ❌ 层维持排除，D1 拍板后按台账显式豁免。
- **web-ready 转换口径**：ffmpeg libwebp，q85 起，>50KB 依次降档（缩宽 1024→q60、缩宽 800→q45 / 缩宽 512→q70）；`正面_238.png` 因源损坏未转换（见上表）。

## 工程注意

- 本目录**未 git add**。M4 收尾提交时勿 `git add -A` 全仓扫入；跟踪与入库策略待 v2 立项时决策。
- 中文文件名（sprites/侧面.png 等）在 git 输出显示为八进制转义属显示问题，`git -c core.quotepath=false status` 可读。
- Open Ocean 保留原 zip 留底，解压件在同名子目录 `OpenOceanArt/` 并存。
- 所有下载均校验过尺寸/魔数（PNG IEND、GIF 头），梗图曾因镜像截断，已断点续传补全至 1530733 字节。
