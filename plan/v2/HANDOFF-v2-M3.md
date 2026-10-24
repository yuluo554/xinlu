# HANDOFF-v2-M3 · 交接单（v2-M2' 人格鱼 avatar 棒 → v2-M3' 分享卡 + 场景氛围 + 预算门）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档。
> 上一棒（本档作者）完成的是 **v2-M2' 全部三块（2.1/2.2/2.3）+ D1 拍板入档 + 许可门提前交付**。

## 一、当前进度 + 证据

- **D1 已拍板 = B 标准（2026-10-24，用户确认）**：fish/ 62 张处理版 webp 显式豁免入库（`.gitignore` 改内容级排除 `fish/*` + `!fish/*.webp`，非 webp 仍排除）、已知限制声明（[assets/README.md §已知限制声明](../../assets/README.md) + [public/credits.md](../../public/credits.md)）、whale 系可用；❌ 层（梗图原图 / 4 张 GIF 原件）维持排除。决策记录两行见 [00 §决策记录](00-README总览.md)（拍板行 + 许可门提前行）。
- **2.1 fish.ts**：[src/viz/fish.ts](../../src/viz/fish.ts)——`createFishParams` 四参数按 [02 §一](02-数据与口径.md) 逐字面实现（逐维 sanitize，NaN→50 回落）；`pickChoiceFrame`（dir 同向候选 + seg 命中 mood 优先 + 种子取模，同种子可复现）；`renderFish`（viz 收窄面，氛围层 saturate 滤镜 + 鱼群 2–6 条 open-ocean 小鱼 + CSS 变量 `--fish-dur`/`--fish-amp` 驱动待机游动）；[src/data/fish-mood-map.json](../../src/data/fish-mood-map.json) 19 帧语义标注（实读 19 张表情图逐一标注 seg/dir/hint）+ stage 8 阶段锁表 + ending 9 结局锁表（两两不重复）。单测 [fish.test.ts](../../src/viz/fish.test.ts) **19 项**：参数边界 0/50/100、确定性、NaN 回落、映射 19/19、FRAMES 绑定与 JSON 键对齐、**无 16 型字面量 grep**。
- **2.2 mascot 接入**：卡片流 choice 反馈（选项 tf delta 方向 → 抽帧，反馈帧驻留到下一事件卡，表现态不入存档）、小结 stage 转场（锁表帧）、终局 ending 主视觉（锁表帧）；E2E 补 mascot 断言（卡片流待机态挂载 + 终局帧 href 非空）双端绿；截图留痕 docs/assets/v2m2-mascot-{card-,}{375,1280}.png 共 4 张（目检：鲸鱼娘形象统一，end-06 锁定帧「大笑」正确）。
- **2.3 validate 扩展**：[validate-data.mjs](../../scripts/validate-data.mjs) 新增 **M 区**（数据文件 4→5 份）：帧清单扫 `assets/dafeiyu/fish/` 编号表情（19 张口径数，不复写清单）+ 覆盖 19/19 + seg/dir 枚举 + stage 8 阶段 1–2 张 + ending 9 结局不重复；**变异自检两向必红留痕**（删 end-05 映射 → M.ENDING 红；删 frames."06" → M.REF+M.COVER 红；复原绿）——[docs/v2-M2-gates.md](../../docs/v2-M2-gates.md)。
- **许可门提前交付**（排序约束「先有许可门，再入 fish/ 素材」，v2/03 §5）：[tools/check-assets-license.mjs](../../tools/check-assets-license.mjs) + `npm run gate:license`；判据 = 02 §六（跟踪图像 ⊆ 白名单、❌ 层双向排除、credits 署名行）；变异自检两向必红留痕同上文档;布局门 `PENDING_TOOLS` 已删登记（仅剩 `check-dist-budget.mjs` 待 v2-M3'）。
- **门禁现状（2026-10-24 实测）**：布局门全绿（2 副本 × 11 里程碑一致 + 台账 16 行）/ 脱敏门 0 命中 / 数据门 0 FAIL（6 区含 M 区）/ typecheck 0 错 / vitest **89/89**（70 基线 + 3 可达性 + 19 fish 新增）/ 可达性扫描 9 结局全可达退出码 0 / 许可门 0 FAIL / e2e 绿（双端通关 + mascot 断言）。
- **评审门（强核查）已过**：02 §一参数表 ↔ fish.ts 实现 ↔ 单测三方逐参数一致性核对表落 [docs/v2-M2-gates.md §三](../../docs/v2-M2-gates.md)——activity/mood/ambience/orderliness 数值、NaN 回落、无 16 型分支全部对齐,无第二表述。

## 二、当前事实·状态不变量（动手前必须知道）

1. **v2 里程碑标号仍是 `v2-M1'–M4'`，交接单文件名不带撇号**；下一棒 = v2-M3'，收尾写 `plan/v2/HANDOFF-v2-M4.md`。
2. **v2 套件评审仍待用户**（[plan/00 索引 v2 行](../00-README总览.md) 括注已改为「D1 已拍板；套件评审仍待用户确认」）——它不设硬门槛（D1 才是），但 M3'/M4' 大块动工前宜提醒用户。
3. **许可门白名单是目录级前缀**（`tools/check-assets-license.mjs` 顶部常量，注释指向台账单源）：`assets/web-ready/`、`assets/dafeiyu/fish/`、`assets/cc-by/`、`assets/dafeiyu/favicon.svg`、`public/`、`docs/assets/`（自产截图）。**v2-M3' 素材入库（3.3 水域背景/图标）直接用这几组即可，别新增白名单目录**；dist 图像按 basename 去 hash 回源树对账——**vite 资源会拍平进 dist/assets/，同名文件冲突会溯源红**（现 20 件全唯一）。
4. **dist 体积现状（v2-M2' 末）**：JS gzip 46.19KB + CSS 2.14KB + **19 张表情 webp 共约 600KB（原样未压缩）**。其中 5 张单张 >50KB（26=60.4KB、06/13/20≈56KB、14=52.3KB）——02 §七口径这是 **WARN+清单**（不 FAIL），v2-M3' 预算门上线即会看到；gzip 总量已超 500KB？**没有——预算判据对 dist 全部产物 gzip 求和，webp 本身已压缩（gzip 几乎不缩）**，因此 v2-M3' 3.1 预算门大概率直接红，需按「压缩 WebP > 减帧 > 降分辨率」顺序裁（先压这 5 张 + 大图表情）。
5. **fish.ts 纪律**：无 16 型字面量分支（grep 测试钉死，连注释都别写型名）；同输入恒同输出（无随机）；帧名与 `fish-mood-map.json` 键对齐（单测断言集合相等，**加帧必须 JSON + FRAMES import + 测试三方同改**）。渲染尺寸常量（BODY/SCHOOL_SPOTS）在 fish.ts 中部。
6. **choice 反馈帧是表现态**（`app.ts` 模块级 `choiceFeedback`），不进存档、刷新回待机——不要试图把它写进 `xinlu.save.v1`（K6 冻结）。
7. **events.json 121 条分母不变**；v2.0.0 发布时 CHANGELOG 新条目写新分母 + 「历史存档建议重开」声明（v2-M4' 活）。
8. **渲染解读留痕**：02 §一「idle 动画播放间隔」实装为 whale-idle 单帧 + CSS 位移动画周期（「帧」= 动画关键帧；不用 fatfish-* GIF 拆帧轮播——那是鱼形，与鲸鱼娘表情帧形象跳变）。口径字面未改，实现解读记在此处备查。
9. **`plan/07` §九软论据诚实度纪律继续**——v2-M3' 分享卡/氛围引用行为论据时维持（16personalities 观察 🟡 部分核对）。

## 三、待办（v2-M3' 三块）

1. **3.1 预算门 + credits 链入**：`tools/check-dist-budget.mjs`（02 §七判据：dist 全部产物 gzip 求和 ≤500KB FAIL 线；单张图像 >50KB WARN+清单）+ 变异自检（塞超限文件必红→复原绿）留痕；`public/credits.md` 链入终局页/关于位（**许可门已交付，此块只剩这两件**）；预计需先压 5 张超 50KB 表情（见不变量 4）。
2. **3.2 分享卡**：`src/ui/share-card.ts`——布局计算纯函数（可单测 canvas stub）+ Canvas 绘制分离 + 终局面「保存分享卡」按钮；规格 02 §四（1080×1440、鱼主视觉/雷达/型号/画像/关键抉择 3 条/水印 ≤120px、文件名 `xinlu-<mbti>-<yyyymmdd>.png`、纯客户端零上传）；三端实存图留痕。
3. **3.3 场景氛围**：出生环境→水域背景（CC-BY 组 open-ocean）+ 阶段小结图标（Simple Worlds SVG）；E2E 双端断言；credits 三行署名齐（许可门断言已有，验收时对账）。
4. **出口门**：公共门全绿（现 7 门）+ `check-dist-budget` 绿 + e2e 绿；**评审门（强核查）**：02 §四规格 ↔ share-card 实现 ↔ 单测三方一致。
5. **用户动作**：v2 套件评审（不阻塞，但收尾时提醒）。

## 四、既定口径清单（K 编号；动了会打挂测试/门）

- **K1–K12 全部继续生效**（逐条见 [HANDOFF-v2-M1.md](HANDOFF-v2-M1.md) §四与 [../HANDOFF-M7.md](../HANDOFF-M7.md) §四）。本棒未新增 K 编号。
- 易踩重申：K2 零依赖（e2e 不得引入 playwright/puppeteer；分享卡用原生 Canvas）；K6 存档 schema 冻结（图鉴 key `xinlu.gallery.v2` 独立，v2-M4' 才用）；K11 引擎五签名冻结；K12 v2 数值口径只在 [02](02-数据与口径.md) 定义。
- 状态副本两处（plan/00 + README，行首格 `v2-M<k>'`）；翻 ✅ 同提交翻齐两处 + [v2 台账行](00-README总览.md) + [v2/03 模块状态](03-模块清单与验收.md)。

## 五、环境坑（沿用 HANDOFF-v2-M2 §五 + 本棒新增实测）

- **.mjs 文件不能写任何 TS 语法**——本棒又踩一次（`.pop()!` 非空断言 SyntaxError，node 报错位置在 `!` 处）。写 tools/scripts 一律纯 JS。
- **`git check-ignore -v` 对 `!` 负模式豁免的文件也输出且退出码 0**（显示命中的是 `!` 规则行）——验证「webp 已豁免」看规则行首是否 `!`，别只看退出码；实测入库与否以 `git add` + `git status` 为准。
- **Windows 下 `cp` 目标 `$TEMP` 在 Git Bash 可用**（本机实测），备份/复原未提交数据走 `cp` 到仓库外（**不用 git checkout**，见 HANDOFF-v2-M2 §五）。
- **vite 资源拍平**：dist/assets/ 内所有图像平铺、`[name]-[hash][ext]` 命名——许可门/预算门按 basename 去 hash 对账；源树同名文件（不同目录）会在对账时歧义,当前 20 件无重名，加素材时留意。
- 沿用：vite preview 只绑 IPv4 回环（`--host 127.0.0.1` 已在 smoke.mjs）、文档写端口用 `<port>` 占位（脱敏门拦 `127.0.0.1:<数字>` 字面量）、node 原生跑 TS 三件套（pathToFileURL / with type json / 显式 .ts）、Edge 无头 profile 清理时序、Git Bash `/tmp` ≠ node `/tmp`、SSH push、`core.quotepath=false`、`py` 替代 python（HANDOFF-M7 §五 + HANDOFF-v2-M1/M2 §五全条目）。

## 六、DoD 逐项 checklist（本棒 = v2-M2'）

- [x] 2.1 fish.ts：`createFishParams` + `renderFish` + `fish-mood-map.json` + 单测 19 项（边界/确定性/NaN 回落/19/19/无 16 型 grep）
- [x] 2.2 mascot 接入：choice/stage/ending 三场景 + E2E mascot 断言双端绿 + 截图留痕 4 张
- [x] 2.3 validate 扩展 M 区（19/19 / 枚举 / 终局不重复）+ 两向必红留痕
- [x] D1=B 拍板入档（决策记录 2 行 + .gitignore 豁免 + 台账记档 + 已知限制声明）+ fish/ 62 张入库 + credits 落位
- [x] 许可门提前交付（脚本 + 两向变异自检 + PENDING_TOOLS 删登记 + `npm run gate:license`）
- [x] 出口门全绿：布局门/脱敏门/数据门 6 区/typecheck/89/89/可达性 9 结局/许可门/e2e
- [x] 评审门（强核查）：02 §一 ↔ fish.ts ↔ 单测三方一致核对表（docs/v2-M2-gates.md §三）
- [x] 翻面同提交：状态副本两处 + v2 台账 1 行 + v2/03 模块 2/6 ✅ + PENDING_TOOLS 删登记
- [x] 本交接单七节落盘（下一棒 = v2-M3'）

## 七、关键命令速查（每条当轮实跑过）

```bash
node tools/check-sprint-layout.mjs          # 布局门（续接对话第一件事）
node tools/check-desensitized.mjs           # 脱敏门
node tools/check-assets-license.mjs         # 许可门（v2-M2' 提前交付；= npm run gate:license）
npm run validate                            # 数据门（--full 常开；6 区含 fish-mood-map M 区）
npm run validate -- --count                 # 分母汇总（README/plan/00 对账；事件 121 不变）
npm test                                    # vitest run（89/89 = 67 基线 + 3 可达性 + 19 fish）
npm run typecheck                           # tsc --noEmit
npm run e2e                                 # E2E 双端一键通关 + mascot 断言 + 6 张截图
node scripts/check-ending-reachability.mjs  # 可达性扫描门（退出码 0 全可达）
npm run build                               # vite build（素材 hash 拍平进 dist/assets/）
git -c core.quotepath=false status          # 中文可读 status
git check-ignore -v assets/dafeiyu/fish/01.webp   # 验证豁免：命中行首应是 `!` 负模式
```
