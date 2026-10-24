# v2-M3' 门禁与评审留痕（分享卡 + 场景氛围 + 预算门）

> 依据 plan/v2/04 §v2-M3'：出口门 = 3.1–3.3 全过 + `check-dist-budget` 绿；**评审门（强核查）= 02 §四规格 ↔ share-card 实现 ↔ 单测三方一致**。本档是留痕。

## 一、评审门（强核查）：02 §四 ↔ share-card.ts ↔ 单测 三方逐条核对

规格单源 [02 §四](../plan/v2/02-数据与口径.md)；实现 [src/ui/share-card.ts](../src/ui/share-card.ts)；单测 [src/ui/share-card.test.ts](../src/ui/share-card.test.ts)。

| 规格条目（02 §四字面） | 实现 | 单测断言 | 一致 |
|---|---|---|---|
| 画布 1080×1440（3:4 竖版） | `CARD_WIDTH=1080`/`CARD_HEIGHT=1440` | `画布 1080×1440` | ✅ |
| 人格鱼主视觉 | `layout.fish`（印 `FRAMES[frame]`，帧 = ending 锁表） | `鱼主视觉印终局帧,帧 URL 在 FRAMES 域` | ✅ |
| 终局雷达 | `layout.radar`（顶点经 `radarVertex`——轴方位/值域口径单源 viz/radar.ts，本文件零复写） | `雷达顶点与 radarVertex 同源复算一致` | ✅ |
| MBTI 型号字母 | `layout.letters`（`endingLetters` 口径透传） | `型号/标题/横幅文本透传` | ✅ |
| 画像一句话（portraits.json 复用） | `layout.portrait`（wrapText 折行 ≤4 行；app.ts 从 portraits.json 取句） | `画像句折行 ≤4 行且行宽不超内容区` | ✅ |
| 关键抉择 3 条 | `slice(0,3)`，问答单行超长截断加省略号 | `关键抉择取前 3 条…单行截断加省略号` | ✅ |
| 水印 watermark.webp 左下角 ≤120px | `WATERMARK_MAX=120`，印制 112px，`watermark.x/y` 左下 | `水印印制 ≤120px 且在左下角` | ✅ |
| 导出文件名 `xinlu-<mbti>-<yyyymmdd>.png` | `shareCardFileName` | `导出文件名口径`（含跨月/补零用例） | ✅ |
| 纯客户端 Canvas 生成，零上传 | `exportShareCard`：createElement canvas → drawImage → toBlob → a[download]；无任何网络调用 | E2E 真实下载落盘断言（见 §三） | ✅ |
| 布局与绘制分离，前者可单测 | `computeShareCardLayout` 纯函数（无 DOM/Canvas 依赖）+ `drawShareCard` 只消费布局 | 全部用例传 measure stub，不测像素 | ✅ |

**结论：无第二表述，三方一致。** 布局细节（鱼印 330px/雷达半径/字号）02 §四未锁定，属实现自由度，由 `computeShareCardLayout` 单点定义。

## 二、预算门（3.1）：上线即红 → 压缩 → 绿

| 时点 | gzip 求和 | 单张 >50KB | 结果 |
|---|---|---|---|
| 上线即红（v2-M2' 末 dist 原样） | **797.13KB** | 5 件（06/13/14/20/26，51.1–58.9KB） | FAIL（exit 1）✓ 留痕 |
| 压缩后（本棒入库） | **445.51KB**（28 件） | 0 件 | 绿（exit 0） |

- **压缩口径**（ffmpeg libwebp / lanczos / compression_level 6）：19 张表情 + `whale-idle` → 192×192 q65（600KB→约 325KB）；`watermark.webp` → 200×200 q65（92.9→12.8KB，印制 112px 的 1.8x）；`WikndWakerWater` → 768×768 q50（44.1→31.8KB）；`Clouds` → 640×640 q50（43.7→25.3KB）。
- **画质目检**：320→192 拼图对比（26 炸毛 / 14 狡黠 / 01 / 15 / 04，左原右压）——文字可读、表情轮廓完整，粗线条表情包风格对分辨率不敏感；水印 200px 印 112px 无可见损失。
- **台账同步**：压缩记录见 [assets/README.md §跟踪策略](../assets/README.md)；非 dist 引用件（character-sheet / whale-* 立绘 / GIF 拆帧 / 三视图等 43 张）维持 D1=B「原样入库」不动。
- **变异自检（两向，2026-10-24 实跑）**：塞 600KB 随机件 `dist/assets/mutation-oversize.webp` → `FAIL gzip 总量 1031.73KB > 500KB`（exit 1，含单张 WARN）→ 删除复原 → `0 FAIL`（exit 0）。

## 三、E2E 扩展断言与变异自检

- 双端各完整通关后新增断言：终局「保存分享卡」按钮在位 → `Browser.setDownloadBehavior` 指向临时目录 → 真实点击 → 轮询到 `xinlu-ESFJ-20261024.png`（679–681KB）落盘 → 文件名正则 `^xinlu-[A-Z]{4}-\d{8}\.png$` 断言过 → 拷贝 `docs/assets/share-card-{375,1280}.png` 留痕（即「实存图」）。
- 场景氛围断言（双端不同出生环境）：375 档默认组合（era=60s/大城）→ `brightness(0.70)` + 云层 `opacity:0.70`；1280 档提交前改选（era=10s/农村）→ `brightness(1.05) hue-rotate(10.0deg)` + `opacity:0.15`——两档断言均过，证明背景随出生环境变化。
- credits 链入断言：终局 `.about-links a[href*='credits']` 在位（双端）。
- **变异自检**：375 档预期改错为 `brightness(0.99)` → `FAIL 375 档：场景水面滤镜不符(预期含 brightness(0.99),实得 …brightness(0.70) hue-rotate(-10.0deg))` → 复原绿。
- 卡片屏截图暖帧问题：屏切 rise 动画 0.28s 会捕到中途帧（v2-M2' 遗留观察），本棒按 HANDOFF-M7 §五纪律补「先拍一张丢弃再拍正式」。

## 四、3.3 场景氛围口径解读留痕（02 §四/04 §3.3 未锁细节表，实现自定）

| 决策 | 口径 | 理由 |
|---|---|---|
| 背景维度 | era 6 档 → 水面滤镜（brightness 0.70→1.05 线性 + hue −10°→+10°）；place 4 档 → 云层不透明度 0.7→0.15 线性 | 「时代水温」隐喻（旧年代深冷/新年代亮暖）+「城乡云量」梯度；每条映射一句话可说清 |
| 素材 | `WikndWakerWater_Background.webp` 平铺水面 + `Clouds_Background.webp` 云层（均 CC-BY Open Ocean 组白名单内） | `MainMenu_Background.webp` 含上游游戏「OPEN OCEAN」标题字样，不可用作本项目场景背景（商标/观感双重排除） |
| 小结图标 | Simple Worlds 大 SVG（187KB，Inkscape 分层、无语义图层名）提取水母组装态（`g9785` + defs 引用闭包 1 个渐变）→ `assets/cc-by/simple-worlds-ocean-animals/jellyfish.svg`（12.1KB） | 整文件进 dist 会吃掉 37% 预算；8 阶段共用 1 图标（阶段区分语义已由 mascot 表情帧承载，图标仅转场点缀）；SVG 矢量、透明底，Edge 渲染目检通过 |
| 观感 | 水面 opacity 0.16 平铺在浅色纸面上、云层顶部 42vh | 维持 v1「浅色纸面」设计规范（style.css 头注释），纹理是点缀不做深色满屏 |

## 五、门禁清单（本棒收尾实跑）

布局门全绿（PENDING_TOOLS 清空）/ 脱敏门 / 数据门 6 区 0 FAIL / typecheck 0 错 / vitest **106/106**（89 基线 + 11 share-card + 5 scene + 1 拆分用例归位）/ 可达性 9 结局 exit 0 / 许可门 0 FAIL（含 dist 24 件图像溯源 + jellyfish.svg 白名单内）/ 预算门 445.51KB 绿 0 WARN / e2e 双端绿（含分享卡落盘 + 场景 + credits 断言）。
