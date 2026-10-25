# HANDOFF-v4-M4 · v4-M2''' 收尾交接单（实感修复包棒 → v4-M3''' 棒）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档。
> 编号纪律（skill 硬约束①）：**交接单编号随棒顺延**——装订棒 HANDOFF-v4-M1、A 段棒 HANDOFF-v4-M2、B 段棒 HANDOFF-v4-M3、本档为 v4-M2''' 棒收尾单（v4-M3''' 入棒单），v4-M3''' 棒收尾写 HANDOFF-v4-M5，依次到收官单 HANDOFF-v4-M6。
> 本档记录 **v4-M2''' 实感修复包收官（2.1–2.4 全过 + V4-1 首项）**：两处状态副本已翻 ✅（2026-10-26）。

## 一、当前进度 + 证据（2026-10-26 当轮实测）

- **首项 V4-1 预算重审定案**：提基线 **650KB → 850KB**（决策记录 v4/00 2026-10-26 行 + 判据单源 v4/02 §十 ▸ M2''' 增补 + 门常量 `tools/check-dist-budget.mjs` 同笔；backlog V4-1 翻 ✅ 关闭）。出口实测 **717.89KB ≤ 850KB 绿**（M2''' 增量仅 3.55KB gzip）。
- **2.1 主题四款**：色板单源 `src/style.css`（`:root`=米纸 + `[data-theme="moon"|"night"|"celadon"]`；五档色阶 `--tier-1..5` 同 variables 联动）+ `src/ui/theme.ts`（`xinlu.theme.v1` 独立键，非法值回米纸）+ 设置页 chips 即时切换（change 即生效，不随表单提交）+ 启动 mountApp 先应用。夜航 AA：`theme-contrast.test.ts` 直读 CSS 解析变量，11 组合 ≥4.5 全过。
- **2.2 资源实感**：`src/ui/resources.ts` 单源——`moneyBandOf`（按**运行年份**六档划档，≥2010 并入末档）+ `moneyDisplay/moneyDeltaDisplay`（满值 2,000→1,200,000、步长 10→10,000、千分位）+ `resTier` 五档（萎靡/低落/平稳/良好/高涨）。状态条：mood/health「标签 · 档词」+ 细色条，money「¥N,nnn」；浮动层 money 换算口语、mood/health 保留原始点数。
- **2.3 移动轴 D6=A**：移动撤竖轴 → 顶部固定八段阶段条（sticky 横向、高度恒定、小点 ≤5 封顶、critical 末点加环）+ 纯事件流；桌面左轨色点云收敛为**阶段计数徽标**。`timelineVM` 改 count/criticalCount/dots 聚合，时代卡归段走 `entryStages`（准确归段，修正旧「按当前阶段」口径）。E2E 旧断言（轨道色点增长/窄轨 ≤100px）已删改不留残尸；375/768/1280 三档截图全新重留痕。
- **2.4 小结重做**：五段结构（跨度句主题头（配图位留 M3''' 3.2）/ 三观三轴（区间词 9 词 + 位移箭头 + monologues 接线——v3 落库未接线的债清了）/ 雷达+四维增量并排 / 身家状态五档行 / 本阶段关键抉择回顾）。位移口径 = Σ 本阶段条目 deltas3（含时代卡、**不含阶段漂移**）。CHECKLIST 留痕 [docs/v4-M2-feel.md](../../docs/v4-M2-feel.md)。
- **出口门全绿**：`npm run validate` 0 FAIL + `npm run validate:story` 243/243（未动事件文本）+ vitest **280/280**（252 → +28：resources 7 / theme 5 / theme-contrast 5 / summary 8 / timeline 净增 3）+ typecheck 0 + e2e 双端一键通关全绿（新断言：默认主题/四 chips 切换/夜航即时生效+落盘/五档词格式/阶段条聚合/小结三观呈现）+ 布局门全绿 + 脱敏 422 文件 0 命中 + 预算门 717.89KB 绿。

## 二、当前事实·状态不变量（v4-M3''' 动手前必须知道）

1. **口径单源仍是 plan/v4/02**：§四/§五/§七/§十 ▸ M2''' 增补已与实现同提交定稿（换算步长表/主题 id 与挂载/区间词表与位移口径/D6=A 形态与 E2E 断言落点/预算线 850KB/单测基线 280）。改任何一端先改单源再改实现。
2. **objectKey 主工程在 02 §六**：3.1 只动 `icon-map.json`（每条加 objectKey 字段）+ 图标实物；**不动 events.json 文本**。若为选图必须微调事件文本 → 复跑 `npm run validate:story` + 走 03 §2 纪律（决策记录 + 可达性复跑）。
3. **validate I 区扩展是 3.1 的门**（objectKey 与图标文件名一致性 + 豁免计数 ≤10%）：先扩门再入库（03 纪律：门禁先于内容）。
4. **主题与配图交互**：色板单源 style.css；新配图/图标注意四主题下观感（尤其夜航深底）；**改色板必须跑 `theme-contrast.test.ts`**（直读 CSS，色值漂移会红）。分享卡画布与图谱 SVG 在月白/青瓷/夜航下的复验是 3.3 的活。
5. **小结结构已定型**：配图落位 `.screen-summary` 主题头区（`stage-icon` 现为占位装饰）；8 张 CC0 + 许可门白名单扩展 + 逐张对文案留痕（3.2）。
6. **预算余量 ~132KB**（717.89 实测 / 850 线）：M3''' 配图 8 张压缩 webp + objectKey 字符串增量预估 60–100KB，出口门必跑 `npm run gate:budget`；超线先压图（压缩 WebP > 减帧 > 降分辨率）不裁内容。
7. **E2E 断言基线**：阶段级轨道断言/五档词/主题切换/小结三观已固化在 tests/e2e/smoke.mjs；3.x 若改 UI 结构同步改断言，视觉变化重留三档截图。
8. **状态副本现状**：v4-M2''' 两处机读副本已翻 ✅；v4/00 台账四行（积蓄元/移动轴/小结三观/主题）✅；v4/03 模块 4 ✅；backlog V4-1 ✅ 关闭（队列清零）；**下一棒收尾写 HANDOFF-v4-M5**。
9. 基线数字：单测 **280**（出口 ≥280 只加不减）；LLM 旁路默认关不变。

## 三、下一棒待办（v4-M3''' · 图标与配图对象级；任务块见 [04](04-里程碑任务分解.md) 3.1–3.3）

1. **3.1 objectKey 全量重映射**：243 条逐条重选（文本核心物件 ⊆ objectKey 抽验口径）；补采清单处理（Game-Icons 备选/CC0 小图）；宁缺毋滥——无合适图 `objectKey: null` 显式豁免（目标 ≤10%）；validate I 区扩展先行；objectKey 抽验 100% + 豁免清单落档。
2. **3.2 小结场景配图 8 张**（CC0，逐张对文案留痕）+ 许可门白名单扩展；预算门绿（§二.6 余量口径）。
3. **3.3 收尾打磨**：主题×图谱×分享卡联动复验（四主题下图谱 SVG/分享卡画布观感）、开局图谱入口 UI 打磨、README 增量；全门绿 + CHECKLIST 终检。
4. 出口门：validate（I 扩展）+ validate:story（若动文本）+ vitest ≥280 + typecheck 0 + e2e + gate:license（素材变更必跑）+ 布局/脱敏 + gate:budget。
5. 收尾翻面（同提交）：v4-M3''' 两副本 ✅ + v4/00 台账两行（objectKey/小结配图）+ v4/03 模块 5 + 收尾交接单 HANDOFF-v4-M5。

## 四、既定口径（已拍板，别再问；推翻须进 `v4/00` 决策记录）

- 预算线 **850KB**（V4-1 已关闭；重开须决策记录新行）。
- objectKey 纪律（02 §六）：文本核心物件 ⊆ objectKey；宁缺毋滥；豁免 ≤10% 单独计数。
- 产品/赛事/制度名可入文；真实机构名/真人名不写（沿 §八）。
- 主题四款 id（paper/moon/night/celadon）与 `xinlu.theme.v1` 键形冻结；色板改值跑 AA 测试。
- 五档阈值与换算步长表只存 02 §四（含 ▸ M2''' 增补）；数值只在增损浮动层出现。

## 五、环境坑（实测在案）

- 本机直连 github.com 不通：push 一律 SSH:22（origin `git@github.com:yuluo554/xinlu.git`）；仓库管理走 gh API；远端 CI 已接通。
- 脱敏门红线：入库文件与提交信息不得写本机盘符/用户名/回环代理端口；示例路径用 `<user>`/`<repo>`；本地地址写 localhost。
- node v24 原生跑 .ts 不支持构造器参数属性；engine 链 import 一律显式 `.ts` 扩展。
- Windows Git Bash；`python` 是商店占位符不可用（批量文本处理用 node）。
- events.json 自定义紧凑格式（短对象单行内联）：动文本用「精确串替换」手术式处理；icon-map.json 同为机读面，改动前先看 validate I 区现行断言。
- e2e 的 Node 侧断言正则别写 `\\d`（模板字符串转义陷阱，本棒踩过一次：正则在 Node 侧是字面量，`\\d` 匹配的是反斜杠+d）。
- style.css 色板是 `theme-contrast.test.ts` 的直读源：变量名/格式（`--name: #rrggbb;`）别随手改。

## 六、DoD（v4-M2''' 对账 · 单源见 [00 §里程碑总表](00-README总览.md)）

- 2.1–2.4 全过（2026-10-26）：四项各有 E2E 断言 + 三档截图重留痕 ✓；CHECKLIST 复核 docs/v4-M2-feel.md ✓；预算门重审（提基线 850KB 定案 + 出口实测绿）✓。
- 换算/档位单测（resources 7）、monologues 接线单测（summary 8）、主题 AA 抽验（theme-contrast 5）✓；单测基线 252 → 280 ✓。
- 遗留观察（不入 DoD）：小结场景配图（M3''' 3.2）；月白/青瓷/夜航下图谱与分享卡复验（M3''' 3.3）；青瓷纹理极淡档（0.78）观感如弱可在 M3''' 3.3 一并调。

## 七、命令速查

```bash
node tools/check-sprint-layout.mjs   # 布局门（= npm run gate:layout）
node tools/check-desensitized.mjs    # 脱敏门（= npm run gate:desens）
npm run validate                     # 数据门（含 R 区：era/家庭/八因素域）
npm run validate:story               # 写实机检四项（动过事件文本时必跑）
npm test                             # vitest（M2''' 后基线 280）
npm run typecheck                    # tsc --noEmit
npm run e2e                          # E2E 双端一键通关 + 768 中档 + v4 自定义出生段
npm run gate:license                 # 许可门（素材变更时）
npm run gate:budget                  # 预算门（850KB 线；M2''' 出口实测 717.89KB 绿）
```
