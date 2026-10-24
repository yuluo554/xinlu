# HANDOFF-v2-M4 · 交接单（v2-M3' 分享卡 + 场景氛围 + 预算门 棒 → v2-M4' 图鉴 + 发布 v2.0.0 棒）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档。
> 上一棒（本档作者）完成的是 **v2-M3' 全部三块（3.1/3.2/3.3）+ 预算门上线与素材压缩 + 评审门核对表**。

## 一、当前进度 + 证据

- **3.1 预算门 + credits 链入**：[tools/check-dist-budget.mjs](../../tools/check-dist-budget.mjs)（判据 = 02 §七：dist 全部产物 gzip 求和 >500KB FAIL；dist 内单张图像 >50KB WARN+清单；无 dist NOTE 跳过）+ `npm run gate:budget`；**上线即红留痕 797.13KB（5 张表情 51–59KB WARN）→ dist 引用集压缩 → 445.51KB 绿 0 WARN**；变异自检两向必红（塞 600KB → FAIL 1031.73KB → 复原绿）——[docs/v2-M3-gates.md §二](../../docs/v2-M3-gates.md)。压缩口径（ffmpeg libwebp / lanczos / level 6）：19 表情 + whale-idle → 192×192 q65、watermark → 200×200 q65（92.9→12.8KB）、WikndWaker → 768 q50、Clouds → 640 q50；**画质目检拼图对比通过**（粗线条表情包风格不敏感）；台账记录见 [assets/README.md §跟踪策略](../../assets/README.md)。credits 链入：终局面 + 开局屏「素材与许可说明」链接（`public/credits.md` 原件 v2-M2' 已在位，E2E 断言链接在位）。
- **3.2 分享卡**：[src/ui/share-card.ts](../../src/ui/share-card.ts)——`computeShareCardLayout` 布局纯函数（1080×1440 / 鱼主视觉印 ending 锁表帧 / 雷达顶点复用 `radarVertex` / 型号 / 画像句折行 ≤4 行 / 抉择 3 条单行截断加省略号 / 水印左下 112px ≤120 / `shareCardFileName` 文件名口径）+ `drawShareCard` 只消费布局 + `exportShareCard` 纯客户端零上传（canvas → toBlob → a[download]）；终局按钮三态（正在生成…/已保存 ✓/失败重试）。单测 12 项（规格硬尺寸/文件名跨月补零/截断/水印不重叠/确定性）；**E2E 真实下载落盘断言双端过**（`Browser.setDownloadBehavior` + 文件名正则 `^xinlu-[A-Z]{4}-\d{8}\.png$`，实测 `xinlu-ESFJ-20261024.png` 679–681KB）；实存图 [docs/assets/share-card-375.png](../../docs/assets/share-card-375.png)/[share-card-1280.png](../../docs/assets/share-card-1280.png)。**评审门（强核查）三方核对表落 [docs/v2-M3-gates.md §一](../../docs/v2-M3-gates.md)——02 §四逐条 ↔ 实现 ↔ 单测，无第二表述**。
- **3.3 场景氛围**：[src/viz/scene.ts](../../src/viz/scene.ts)——era 6 档 → 水面滤镜（brightness 0.70→1.05 + hue −10°→+10°，「时代水温」）、place 4 档 → 云层不透明度 0.7→0.15（城乡梯度）；枚举键序单源 birth-map.json。接入四屏（卡片/应答/小结/终局）`sceneLayer`（低透明纹理维持浅色纸面规范）；小结图标 = Simple Worlds 大 SVG 提取水母组装态（`g9785` + defs 引用闭包 → [assets/cc-by/simple-worlds-ocean-animals/jellyfish.svg](../../assets/cc-by/simple-worlds-ocean-animals/jellyfish.svg) 12.1KB，Edge 渲染目检过，台账已记档）；单测 5 项（单调性/锚点/未知回落/确定性/键序对齐）；E2E 双端不同出生环境断言（375 默认 60s/大城 vs 1280 改选 10s/农村）过。**口径解读留痕见 [docs/v2-M3-gates.md §四](../../docs/v2-M3-gates.md)（MainMenu 背景因上游标题字样排除等）**。
- **radar.ts 新增导出**：`radarVertex(dim, value, cx, cy, radius)`（v1 既有函数体零改动，分享卡雷达几何单源）。
- **门禁现状（2026-10-24 实测）**：布局门全绿（PENDING_TOOLS 清空）/ 脱敏门 0 命中 / 数据门 6 区 0 FAIL / typecheck 0 错 / vitest **106/106**（89 基线 + 12 share-card + 5 scene）/ 可达性 9 结局 exit 0 / 许可门 0 FAIL（dist 24 件图像溯源含 jellyfish.svg）/ 预算门 445.51KB 绿 / e2e 双端绿（通关 + mascot + 场景 + 分享卡落盘 + credits 断言）。

## 二、当前事实·状态不变量（动手前必须知道）

1. **v2 里程碑标号仍是 `v2-M1'–M4'`，交接单文件名不带撇号**；下一棒 = v2-M4'（v2 收官棒）。
2. **v2 套件评审仍待用户**（[plan/00 索引 v2 行](../00-README总览.md) 括注「D1 已拍板；套件评审仍待用户确认」）——不设硬门槛，但 M4' 开工前宜提醒用户（M3' 已收官，只剩最后一棒）。
3. **dist 预算余量 ~55KB**（445.51/500KB）。v2-M4' 图鉴新增 JS/CSS 预计 +3–5KB gzip、图鉴格复用 FRAMES 表情零新图 → 预计 ~450KB，安全；若再加素材先跑预算门。
4. **表情源已压至 192px**：mascot 印 150×170、分享卡鱼印 330px（1.7x 放大，目检可接受）；**v2-M4' 图鉴格若印 >128px 注意观感**，不要把表情用于更大尺寸的新场景。
5. **分享卡「三端」诚实口径**：E2E 双端（375 mobile / 1280 desktop）下载落盘 + 桌面机制验证已过；**手机相册端（iOS Safari 的 a[download] 兼容）留 v2-M4' 发布后真机补验**——若 iOS 降级为预览打开，记已知限制，不阻塞发布（plan/00 台账与 v2/03 状态行均已如实写明）。
6. **许可门白名单没新增目录**（沿不变量）：jellyfish.svg 在 `assets/cc-by/` 白名单内；dist 溯源按 basename 去 hash，当前 dist 24 件图像全唯一，**v2-M4' 加素材留意同名冲突**。
7. **fish.ts 纪律不变**：无 16 型字面量（grep 测试钉死）、同输入恒同输出、帧名三方对齐（JSON + FRAMES + 测试）。图鉴格取图请走 `endingFrame`/`FRAMES`，勿新写映射。
8. **K2 零依赖继续**：图鉴/发布不得引入新 npm 依赖；E2E 已用 `Browser.setDownloadBehavior`（page target WS 直发有效，`Page.setDownloadBehavior` 兜底）——图鉴断言沿用现有 CDP 面即可。
9. **存档 schema 冻结（K6）**：图鉴走独立 key `xinlu.gallery.v2`（02 §三），损坏视为空图鉴重建（刻意放宽，理由已记录）；**不读写 `xinlu.save.v1` 新字段**。
10. **events.json 121 条分母不变**；v2.0.0 发布时 CHANGELOG 写新分母 + 「B1 改变结局判定结论 → 历史存档建议重开」声明（M4' 4.3 活）。
11. **发布顺序不可颠倒（04 §4.3）**：build → 干净静态服务一键通关冒烟 → Pages 部署 → 实开验证 → CHANGELOG → plan/05 追加主体（tag 前）→ tag v2.0.0 → Release（五部分 + dist.zip + sha256）→ 留档追加分栏。
12. **渲染解读留痕**：3.3 背景映射（era→「时代水温」/place→云量）与小结图标单水母（阶段语义由 mascot 表情帧承载）是实现自定口径，记录在 [docs/v2-M3-gates.md §四](../../docs/v2-M3-gates.md)——修改前先读。

## 三、待办（v2-M4' 两块半）

1. **4.1 图鉴**：`src/ui/gallery.ts`——读写 `xinlu.gallery.v2`（02 §三 schema：types 16 型封闭 / endings 键 ⊆ 枚举 / runs）+ 图鉴屏（16 格 + 结局记录）+ 终局「未解锁型」提示；损坏视为空图鉴重建（不提示不清档）；`gallery.test.ts`（读写/损坏重建/封闭/⊆ 枚举）；E2E 补图鉴断言；图鉴格用 avatar 缩略。
2. **4.2 P2 择项拍板**：PWA/音效/抉择回溯——按证据拍板做或不做，**不做则决策记录留行**（00 §决策记录）。
3. **4.3 发布 v2.0.0**（顺序见不变量 11）：含 CHANGELOG（新分母 121 + 重开声明 + 已知限制引用 credits）、plan/05 追加主体、tag、Release 五部分、留档追加分栏；**发布后手机相册端分享卡真机补验**（见不变量 5）。
4. **出口门**：公共门全绿（现 8 门含预算门）+ e2e 绿；**评审门（强核查）**：02 §三图鉴 schema ↔ gallery.ts ↔ 单测三方一致（核对表落 docs/v2-M4-gates.md）。
5. **用户动作**：v2 套件评审（不阻塞，收尾时提醒）。
6. **收官交接单**：v2-M4' ✅ 后布局门会点名下一份交接单（`plan/v2/HANDOFF-v2-M5.md`，v2 无 M5' 里程碑——若布局门判据不适用按其 EXEMPT 机制登记豁免，别硬造空档）。

## 四、既定口径清单（K 编号；动了会打挂测试/门）

- **K1–K12 全部继续生效**（逐条见 [HANDOFF-v2-M1.md](HANDOFF-v2-M1.md) §四与 [../HANDOFF-M7.md](../HANDOFF-M7.md) §四）。本棒未新增 K 编号。
- 易踩重申：K2 零依赖（分享卡用原生 Canvas 已兑现，图鉴同理）；K6 存档 schema 冻结（图鉴独立 key）；K11 引擎五签名冻结（本棒仅 radar.ts 新增导出 `radarVertex`，既有函数体零改动——图鉴若需几何/表情继续走「新增导出」路线）；K12 v2 数值口径只在 [02](02-数据与口径.md) 定义。
- 状态副本两处（plan/00 + README，行首格 `v2-M<k>'`）；翻 ✅ 同提交翻齐两处 + [v2 台账行](00-README总览.md) + [v2/03 模块状态](03-模块清单与验收.md)。

## 五、环境坑（沿用 HANDOFF-v2-M3 §五 + 本棒新增实测）

- **node -e 内嵌复杂解析逻辑是坑**：bash 双引号转义地狱 + 回溯正则爆炸（defs 15KB 上 `[\s\S]*?` 匹配 90s+ 不返回）——一次性脚本一律写成 `.mjs` 文件再 `node` 跑，别塞 `node -e`。
- **Inkscape SVG 开标签跨行**：`indexOf('<g id="x"')` 返回 −1 时下游深度扫描会从文件头读出 200KB「巨组」——定位用正则 `/<g[^>]*\bid="x"/`，取到后校验长度合理再继续。
- **Edge headless `--screenshot` 可直接渲染本地 SVG/HTML 目检**（`file:///` URL + `--window-size`），零 CDP 代码，本棒 SVG 提取件目检即走此路。
- **CDP 下载断言**：`Browser.setDownloadBehavior {behavior:"allow", downloadPath}` 在 page target 的 WebSocket 上直发有效（无需 browser target）；失败兜底 `Page.setDownloadBehavior`（deprecated 但本机 Edge 仍接）；下载完成判据 = 目录轮询（正则匹配文件名 + size >30000，未完成的 `.crdownload` 不匹配正则）。
- **ffmpeg libwebp 压缩口径实测**：alpha 保留（输出 pix_fmt yuva420p）；`-vf scale=W:W:flags=lanczos -c:v libwebp -quality Q -compression_level 6`；同图 q70→q65 降 ~8%，320→192px 降 ~50%；水纹理类高频图（44KB）压不动太多（q50 768px ≈ 32KB）。
- **E2E 卡片屏截图暖帧**：屏切 rise 动画 0.28s 会捕到中途帧（淡）——cardShot 也补了「先拍一张丢弃」（v2-M2' 遗留观察，本棒修）。
- **sed 对含中文/引号/单引号内容替换不可靠**（本棒 sed 一次静默不匹配）——文件编辑优先 Edit 工具或 node 脚本。
- **分享卡 PNG 体积 ~680KB**（Canvas 渲染位图 + 渐变）：E2E 落盘判据阈值 30000 字节按此设定；文件落 `docs/assets/` 会进 git（自产截图白名单层，许可门已覆盖）。
- 沿用：.mjs 不能写 TS 语法 / `git check-ignore -v` 对 `!` 负模式也输出命中 / Git Bash `cp` 到 `$TEMP` 可用 / vite 资源拍平按 basename 对账 / vite preview 只绑 IPv4 回环（端口写 `<port>` 占位）/ node 原生跑 TS 三件套 / Edge 无头 profile 清理时序 / `core.quotepath=false` / `py` 替代 python（HANDOFF-M7 §五 + HANDOFF-v2-M1/M2/M3 §五全条目）。

## 六、DoD 逐项 checklist（本棒 = v2-M3'）

- [x] 3.1 预算门 `check-dist-budget.mjs`（上线即红 797.13KB 留痕 → 压缩 → 445.51KB 绿）+ 变异自检两向必红 + `gate:budget` 入口 + PENDING_TOOLS 删登记
- [x] 3.1 credits 链入终局面 + 开局屏（E2E 断言在位）
- [x] 3.2 `share-card.ts` 布局纯函数/绘制分离 + 终局按钮 + 单测 12 项 + E2E 真实下载落盘文件名断言双端过 + 实存图留痕 2 张
- [x] 3.3 场景氛围 `scene.ts`（era→水面/place→云层）+ 四屏接入 + Simple Worlds 水母小结图标（提取件入库 + 台账记档）+ 单测 5 项 + E2E 双端环境差异断言
- [x] dist 引用集压缩（19 表情 + whale-idle + watermark + 2 背景）+ 画质目检 + 台账记录
- [x] 出口门全绿：布局门/脱敏门/数据门 6 区/typecheck/106/106/可达性 9 结局/许可门/预算门/e2e
- [x] 评审门（强核查）：02 §四 ↔ share-card ↔ 单测三方一致核对表（docs/v2-M3-gates.md §一）
- [x] 翻面同提交：状态副本两处 + v2 台账 3 行（分享卡/白名单/预算）+ v2/03 模块 3/5 ✅
- [x] 本交接单七节落盘（下一棒 = v2-M4'）

## 七、关键命令速查（每条当轮实跑过）

```bash
node tools/check-sprint-layout.mjs          # 布局门（续接对话第一件事；PENDING_TOOLS 已清空）
node tools/check-desensitized.mjs           # 脱敏门
node tools/check-assets-license.mjs         # 许可门（= npm run gate:license）
node tools/check-dist-budget.mjs            # 预算门（= npm run gate:budget；无 dist 先 build）
npm run validate                            # 数据门（6 区含 fish-mood-map M 区）
npm test                                    # vitest run（106/106 = 89 基线 + 12 share-card + 5 scene）
npm run typecheck                           # tsc --noEmit
npm run e2e                                 # E2E 双端通关 + mascot/场景/分享卡落盘/credits 断言 + 8 张截图
node scripts/check-ending-reachability.mjs  # 可达性扫描门（退出码 0 全可达）
npm run build                               # vite build（素材 hash 拍平进 dist/assets/）
ffmpeg -i in.webp -vf scale=192:192:flags=lanczos -c:v libwebp -quality 65 -compression_level 6 out.webp
                                            # 素材再压缩口径（alpha 保留；改动前先跑预算门对账）
git -c core.quotepath=false status          # 中文可读 status
```
