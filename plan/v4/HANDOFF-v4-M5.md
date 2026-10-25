# HANDOFF-v4-M5 · v4-M3''' 收尾交接单（图标与配图棒 → v4-M4''' 发布棒）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档。
> 编号纪律（skill 硬约束①）：**交接单编号随棒顺延**——装订棒 HANDOFF-v4-M1、A 段棒 HANDOFF-v4-M2、B 段棒 HANDOFF-v4-M3、实感修复包棒 HANDOFF-v4-M4、本档为 v4-M3''' 棒收尾单（v4-M4''' 入棒单），v4-M4''' 发布棒收尾写 **HANDOFF-v4-M6**（v4 腿收官单）。
> 本档记录 **v4-M3''' 图标与配图对象级收官（3.1–3.3 全过）**：两处状态副本已翻 ✅（2026-10-26）。

## 一、当前进度 + 证据（2026-10-26 当轮实测）

- **3.1 objectKey 全量重映射**：validate I 区扩展**先行**（I.SCHEMA 断 `{objectKey:...}` 形状 / I.NAME / I.FILE / I.EXEMPT 豁免 ≤ floor(243×10%)=24；旧平面对象格式过渡态验红 → 迁移复绿）。icon-map.json 243 条迁移新形状后按 **v4 写实化新文本逐条全量复核**（抽验口径 100%）：**238 保留 + 4 换图补采 + 1 显式豁免**（infant-502 滑梯排队，objectKey:null，0.4% ≤ 10%）。补采 4 枚经 Game-Icons 全量包（4,168,300 字节与 v3 两批一致，直连成功）：snowflake-1（lorc）/ broom / tv / gym-bag（delapouite）。换图/豁免明细 + 隐喻注记 8 条 → [docs/v4-M3-icons.md](../../docs/v4-M3-icons.md) §一。UI 消费单源 `objectKeyOf(id)`（src/ui/icons.ts）；豁免卡自然不渲染图标位。
- **3.2 小结场景配图 8 张**：**自产 CC0**（决策记录 v4/00 2026-10-26 行：弃 OGA 外采——风格统一/四主题联动/体积三胜）单色剪影 SVG，落 `assets/web-ready/stage-scenes/`；fill 全走 CSS 变量 + 米纸 fallback 四主题联动；summaryScreen 主题头内联（`data-stage-scene`，替换 v3 jellyfish 占位）；逐张对文案留痕 docs/v4-M3-icons.md §二。
- **3.3 收尾打磨**：图谱 SVG 硬编码米纸色改 `var(--surface/--ink/--ink-2)` + fallback（快照自包含不破；tag 语义色固定）；「我的家庭」入口前置 family-tree 图标 + aria-label；README v4-M3''' 行翻 ✅（114 行内）。E2E 新断言：小结场景图在位 / 夜航下内联 SVG var() 解析非 fallback / 无图标卡 ≤ 豁免总数（node 侧读 icon-map 对账）。
- **出口门全绿**：validate 0 FAIL（I 区 243/243 + SVG 250 枚 + 豁免 1 ≤ 24）+ validate:story 243/243（未动事件文本）+ vitest **282/282**（280 → +2：timeline 图标注册表形状/豁免/objectKeyOf）+ typecheck 0 + e2e 双端一键通关全绿（375/768/1280 三档截图重留痕）+ 布局/脱敏（437 文件 0 命中）/许可（白名单无需扩展）绿 + 预算门 **720.36KB ≤ 850KB**（本棒素材增量仅 **+2.47KB gzip**）。

## 二、当前事实·状态不变量（v4-M4''' 动手前必须知道）

1. **口径单源 plan/v4/02 §六 ▸ M3''' 增补已与实现同提交定稿**：objectKey 条目形状/豁免计数/隐喻注记口径/场景图自产 CC0 口径/图谱主题适配口径。发布棒若动任何一端先改单源。
2. **icon-map.json 是机读面**：条目 `{objectKey: 图标名|null}`；改值复跑 `npm run validate`（I 区四断言）；补采新图标走 Game-Icons 全量包（字节 4,168,300 核对）+ assets/README.md 台账增行。
3. **发布流程顺序不可颠倒**（04 §v4-M4'''）：build → 干净静态服务双端通关冒烟（`npm run e2e -- --base-url http://…`）→ Pages 部署 → 实开复核 → CHANGELOG v4.0.0 → plan/05 追加 §九 v4.0.0 节主体（tag 前）→ tag v4.0.0 → Release（五部分 + dist.zip + sha256）→ 留档「tag 后追加」分栏 → 状态副本/台账翻齐 → HANDOFF-v4-M6。
4. **CHANGELOG 必含重开声明**：「年代事件改变人生体验与判定输入 → 历史存档建议重开」（00 台账 ⬜ 行 + 双层版本规则）；Release 五部分沿 v3.0.0 先例（plan/05 §v3.0.0 节）。
5. **发布留档双栏纪律**（plan/05）：tag 时点事实 / tag 后追加事实两栏 + 覆盖对账小节；**tag 之后不改代码面**（AGENTS 环境禁忌）。
6. **预算与基线数字**：单测 **282**（出口 ≥282 只加不减）；预算线 850KB（出口实测 720.36KB，余量 ~130KB 全给发布零头足够）；LLM 旁路默认关不变。
7. **本机直连 github.com 不通**：push 走 SSH:22（origin `git@github.com:yuluo554/xinlu.git`）；gh API 可用；Pages 部署与 Release 走 gh；**不虚报发布**（04 §风险）。
8. **状态副本现状**：v4-M3''' 两处机读副本已翻 ✅；v4/00 台账两行（objectKey/小结配图）✅ + 决策记录两行（V4-1 已在前，自产 CC0 本棒新增）；v4/03 模块 5 ✅；模块 6（门禁与发布）⬜ 随发布棒翻；**发布棒收尾写 HANDOFF-v4-M6**（v4 腿收官，05 骨架 ⬜ 待撰写主体）。
9. **docs/v4-M3-icons.md 是图标与配图的活档**：隐喻注记 8 条后续复评入口；豁免清单（当前 1 条）扩展时同档追加。

## 三、下一棒待办（v4-M4''' · 发布 v4.0.0；流程块见 [04](04-里程碑任务分解.md) §v4-M4'''）

1. **发布主流程**：按 §二.3 顺序执行；干净静态服务冒烟用 `npm run e2e -- --base-url <url>`（--no-build 由外部服务出 dist）；Pages 部署后实开复核（远端 URL 手动过一遍开局→首卡→小结）。
2. **CHANGELOG + Release**：v4.0.0 五部分（亮点/年代事件库/画像家庭/实感包/图标配图）+ **历史存档建议重开声明** + dist.zip + sha256；plan/05 追加 §九 v4.0.0 节主体（tag 前写时点事实，tag 后补追加栏）。
3. **翻面收尾**：v4-M4''' 两副本 ✅ + v4/00 台账（历史存档重开声明行 + 模块 6）+ v4/03 模块 6 ✅ + v4/00 文档索引 05 行 ✅ + HANDOFF-v4-M6 收官单；README 增量不破行门（当前 114 行，门 120）。
4. 出口门：发布三件套（tag/Release/留档）+ 全门绿终值留痕（沿 docs/v4-M3-icons.md §四 格式落 docs/v4-M6-release.md 或 05 节内）。
5. **提交未推送积压**：本棒及此前 v4 各棒提交均在本地（origin 落后）；发布棒 push 前先 `git log origin/main..HEAD` 核对提交序列，一次推送。

## 四、既定口径（已拍板，别再问；推翻须进 `v4/00` 决策记录）

- 预算线 **850KB**（V4-1 已关闭；重开须决策记录新行）。
- objectKey 纪律（02 §六 + ▸M3''' 增补）：文本核心物件 ⊆ objectKey；宁缺毋滥；豁免 ≤10% 单独计数；隐喻保留须注记。
- 小结配图自产 CC0 冻结（决策记录 2026-10-26 行）；改风格走决策记录。
- 主题四款 id（paper/moon/night/celadon）与 `xinlu.theme.v1` 键形冻结；色板改值跑 AA 测试。
- 产品/赛事/制度名可入文；真实机构名/真人名不写（沿 §八）。
- 存档 v3 schema 冻结（§九）；v4.0.0 历史存档「建议重开」是提示不是强清（K6）。

## 五、环境坑（实测在案，沿 HANDOFF-v4-M4 增补）

- 本机直连 github.com 不通：push 一律 SSH:22；仓库管理走 gh API；远端 CI 已接通（v3.0.0 双 run success 实测）。
- 脱敏门红线：入库文件与提交信息不得写本机盘符/用户名/回环代理端口；示例路径用 `<user>`/`<repo>`。
- node v24 原生跑 .ts 不支持构造器参数属性；engine 链 import 显式 `.ts` 扩展；`python` 是商店占位符不可用。
- events.json / icon-map.json 均为机读面：动文本用「精确串替换」；icon-map 改动必跑 validate。
- e2e 的 Node 侧断言正则别写 `\\d`；e2e 新读 icon-map 需 `readFileSync`（node:fs 显式 import，本棒踩过一次）。
- style.css 色板是 theme-contrast.test 直读源（`--name: #rrggbb;` 格式别随手改）；场景图/图谱 SVG 的 CSS 变量写法 = `fill="var(--surface,#f7f1e3)"`（fallback 必带，快照独立查看回退米纸）。
- vite `?raw` import SVG 已可用（tsconfig types 含 vite/client）；场景图改动重跑 e2e（截图重留痕）。

## 六、DoD（v4-M3''' 对账 · 单源见 [00 §里程碑总表](00-README总览.md)）

- 3.1–3.3 全过（2026-10-26）：objectKey 抽验 100%（全量复核 243/243）+ 补采清单闭合（4 换图）与显式豁免（1 ≤10%）✓；validate I 扩展绿 ✓；豁免清单落档 ✓；小结配图 8 张逐张对文案留痕 ✓；许可门 0 FAIL（白名单无需扩展）✓；预算门绿（720.36 ≤ 850）✓；开局图谱 E2E（沿有 + 家庭入口图标打磨）✓；全门绿 ✓。
- 遗留观察（不入 DoD）：隐喻注记 8 条（docs/v4-M3-icons.md §一注记表）后续棒复评；青瓷纹理极淡档（0.78）观感如弱随 v4.0.0 实开复核一并看。

## 七、命令速查

```bash
node tools/check-sprint-layout.mjs   # 布局门（= npm run gate:layout）
node tools/check-desensitized.mjs    # 脱敏门（= npm run gate:desens）
npm run validate                     # 数据门（含 I 区 objectKey 四断言 + R 区）
npm run validate:story               # 写实机检四项（动过事件文本时必跑）
npm test                             # vitest（M3''' 后基线 282）
npm run typecheck                    # tsc --noEmit
npm run e2e                          # E2E 双端一键通关 + 768 中档 + v4 自定义出生段
npm run e2e -- --base-url <url>      # 发布棒冒烟（外部静态服务，--no-build 可叠加）
npm run gate:license                 # 许可门（素材变更时）
npm run gate:budget                  # 预算门（850KB 线；M3''' 出口实测 720.36KB 绿）
```
