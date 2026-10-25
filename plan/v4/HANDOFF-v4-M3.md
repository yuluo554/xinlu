# HANDOFF-v4-M3 · v4-M1''' B 段收尾交接单（B 段棒 → v4-M2''' 棒）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档。
> 编号纪律（skill 硬约束①）：**交接单编号随棒顺延**——装订棒 HANDOFF-v4-M1、A 段棒 HANDOFF-v4-M2、本档为 B 段棒收尾单（v4-M2''' 入棒单），v4-M2''' 棒收尾写 HANDOFF-v4-M4，依次到收官单 HANDOFF-v4-M6。
> 本档记录 **v4-M1''' B 段收官（1.3/1.4 故事重写主工程）**：M1''' 整体 DoD 已闭合，两处状态副本已翻 ✅（2026-10-25）。

## 一、当前进度 + 证据（2026-10-25 当轮实测）

- **1.3 批一**（fate 121 + study 24 + career 26 = 171 条文本写实化重写）：`npm run validate:story -- --batch=1` 绿（S.LEN/S.ERA/S.SENSE/S.REF 171/171）。
- **1.4 批二**（love/friend/health 72 条 + 76 时代卡 12 张轻润色）：`npm run validate:story` 全六线 **243/243 四项全过**；era 润色后 `npm run validate` R 区照绿（事实/titleHint/deltas/checkStatus 全未动，查证表无需变更）。
- **重写纪律**：只动 `text` 面（手术替换保住文件其余字节与自定义紧凑格式）；options/aftermath/deltas3/ageMonths/id 零改动——`tests/reachability-*.test.ts` 与 e2e 断言（结构/id/badge，不依赖叙事文本）全绿自证无漂移。
- **人工抽查**：分层抽样（每 线×type 层内步长 3）85/243 = **35.0%**，六项判据初查合格 **80/85 = 94.1% ≥90%**；5 条不合格（1 条叙述预演选项 + 1 条缺南北差异句 + 3 条缺家境呼应）+ 2 条弱项，当日修复复查 85/85 全过——留痕 [docs/v4-story-review.md](../../docs/v4-story-review.md)。
- **dogfooding**：3 局引擎级全流程（1962 北方县镇/1990 南方大城/2008 南方小城，229/226/232 次抉择，时代卡 12/8/5 张）——年代感（锚年与年龄全对位，晚年锚语义贴合）/地域感（对照句+画像层成立，结构性上限已观察）/互引（阿澈五十年线、林医生跨阶段出场）三问留痕 [docs/v4-M1-dogfooding.md](../../docs/v4-M1-dogfooding.md)。
- **变异自检**：4 组验红复原绿（S.LEN 截短 / S.ERA 年代词全抽空 / S.REF 互引词抽空 / S.SENSE 五感词抽空；教训：S2/S3 首跑未红均为抽空不彻底残留命中词，门行为正确）——记录在 v4-story-review.md §六。
- **出口门全绿**：`npm run validate` 0 FAIL（E.DUP 全库文案唯一性含新文本）+ vitest **252/252**（含可达性全量 2496 组 9 结局 + 年代轴抽样 936 局）+ typecheck 0 + e2e 双端一键通关 + v4 自定义出生段 + 布局门全绿 + 脱敏门 433 文件 0 命中。
- **预算门实测（已立案不隐藏）**：`npm run gate:budget` **FAIL 714.34KB > 650KB**（A 段 658.06 + B 段文本扩写 ~56KB gzip）。M1''' 出口门不含预算门（04 原排 M2''' 重审）；V4-1 证据已更新实测值，v4-M2''' 首项处理。
- `scripts/check-story-quality.mjs` 已落位并与 `npm run validate:story` 同批，**PENDING_TOOLS 登记已同提交删除**（check-sprint-layout.mjs）。

## 二、当前事实·状态不变量（v4-M2''' 动手前必须知道）

1. **口径单源仍是 plan/v4/02**：本棒新增 §八 ▸ B 段增补（批次/机检四项落点/词表构成原则/抽查口径/无豁免通道/只动 text 面）；**词表单源在脚本内**（ERA_WORDS/SENSE_POOLS/REF_WORDS），02 不誊抄——改词表先改脚本再跑门，反向同。
2. **事件文本面从此有门**：任何动 `src/data/events.json` 文本（含 M2''' 文案口语化引用积蓄换算时的改写）必须复跑 `npm run validate:story`；改 deltas3 数值仍走老红线（决策记录 + 可达性复跑）。
3. **状态副本现状**：v4-M1''' 两处机读副本已翻 **✅**；v4/00 台账「故事写实化」行 ✅ B 段；v4/03 模块 2 ✅（附验证记录）；**下一棒收尾写 HANDOFF-v4-M4**（编号随棒顺延）。
4. **预算超线观察态（V4-1，backlog 在队）**：B 段出口实测 **714.34KB > 650KB**（A 段后 658.06KB，文本扩写再增 ~56KB gzip；中文文本压缩率低，属内容工程的必然增量）；**v4-M2''' 首项处理 V4-1**（提基线或等价优化，主题/配图增量还会来），出口门前先跑 `npm run gate:budget` 留实测值。
5. **主题/实感口径已在 02 待用**：§四换算表与五档词色阶、§五主题四款（色板 CSS variables 单源 + `xinlu.theme.v1`）、§七小结五段结构——v4-M2''' 直接照单实现，别复写第二份表述。
6. **移动轴改版（D6=A）会推翻 v3 已验收断言**：E2E 轨道断言随改 + 三档截图重留痕，不留旧断言残尸（04 §风险）。
7. **事件文本的互引实指**：支线 NPC 素材在 npcs.json（阿澈/小满/周老师/老康/林医生 + 家庭槽）；M2''' 小结接线 monologues 表时别与事件文本口径打架。
8. 基线数字更新：单测 **252**（M2''' 出口 ≥252 且随新增单测上调）；LLM 旁路默认关不变。

## 三、下一棒待办（v4-M2''' · 实感修复包；任务块见 [04](04-里程碑任务分解.md) 2.1–2.4）

1. **首项：V4-1 预算重审**（backlog 在队：提基线一笔决策或等价优化；M1''' 出口不含预算门，04 出口门 2.1 重审）。
2. 2.1 主题四款（色板单源 + 设置页切换 + 五档色阶联动 + `xinlu.theme.v1` + 夜航 AA 抽验）。
3. 2.2 资源实感（moneyDisplay 换算 02 §四 + 文案口语化引用 + 五档词色阶状态条）。
4. 2.3 移动轴改版（D6=A：顶部固定八段阶段条 + 事件流；桌面轨道收敛阶段级；E2E 断言改写 + 375/768/1280 三档截图重留痕）。
5. 2.4 小结重做（02 §七五段结构 + monologues 接线 + 三观位移箭头 + CHECKLIST 复核 docs/v4-M2-feel.md）。
6. 出口门：validate + validate:story（动过文本时）+ vitest ≥252 + typecheck 0 + e2e + 布局/脱敏 + 预算门绿（V4-1 处理后）。
7. 收尾翻面（同提交）：v4-M2''' 两副本 ✅ + v4/00 台账四行（积蓄/移动轴/小结/主题）+ v4/03 模块 4 + 收尾交接单 HANDOFF-v4-M4。

## 四、既定口径（已拍板，别再问；推翻须进 `v4/00` 决策记录）

- D6=A（移动轴：顶部阶段条+事件流）；主题四款 = 米纸（默认）/月白/夜航/青瓷（02 §五）。
- 换算表与五档词阈值只存 02 §四；数值只在增损浮动层出现。
- 文本写实口径（§八 + ▸ B 段增补）：四项机检 + 人工抽查 ≥90%，**无豁免通道**。
- 产品/赛事/制度名可入文；真实机构名/真人名不写。
- 时代卡无选项（|Δ3|≤2 / |res|≤8），进 history kind:"era"。

## 五、环境坑（实测在案）

- 本机直连 github.com 不通：push 一律 SSH:22（origin `git@github.com:yuluo554/xinlu.git`）；仓库管理走 gh API；远端 CI 已接通。
- 脱敏门红线：入库文件与提交信息不得写本机盘符/用户名/回环代理端口；示例路径用 `<user>`/`<repo>`；本地地址写 localhost。
- node v24 原生跑 .ts 不支持构造器参数属性；engine 链 import 一律显式 `.ts` 扩展（dogfooding 驱动沿 check-ending-reachability 的 importLocal 模式即可）。
- Windows Git Bash；`python` 是商店占位符不可用（批量文本处理用 node）。
- events.json 带自定义紧凑格式（短对象单行内联）：**整库重写会破坏格式**，动文本用「精确串替换」手术式处理（本棒 tmp 工作法：needle `"text": <旧文>` 唯一命中再替换）。

## 六、DoD（v4-M1''' 整体对账 · 单源见 [00 §里程碑总表](00-README总览.md)）

- **A 段已过**（2026-10-25）：历法年代库/画像家庭/存档 v3/validate R 区/年份与家庭 E2E/可达性年代轴抽样。
- **B 段已过**（2026-10-25）：validate:story 两批全绿（243/243）/ 抽查 ≥90% 留痕（94.1% 修复后 100%）/ dogfooding ≥3 局三问留痕 / 变异自检 4 组验红。
- **M1''' 整体 DoD 闭合**：validate 新门全绿（era/组合覆盖/文本口径抽查脚本化）✅ + 年份推进与家庭生成 E2E ✅ + 迁移三档单测 ✅ + dogfooding ≥3 局 ✅ + 可达性复跑（年代轴抽样）✅ + 公共门全绿 ✅。
- 遗留观察（不入 DoD）：预算超线 V4-1（v4-M2''' 首项）；地域感结构性上限与对照句式节律（v4-story-review.md §八，backlog 观察区已有覆盖行）。

## 七、命令速查

```bash
node tools/check-sprint-layout.mjs   # 布局门（= npm run gate:layout）
node tools/check-desensitized.mjs    # 脱敏门（= npm run gate:desens）
npm run validate                     # 数据门（含 R 区：era/家庭/八因素域）
npm run validate:story               # 写实机检四项（--batch=1 可只查批一线）
npm test                             # vitest（B 段后基线 252）
npm run typecheck                    # tsc --noEmit
npm run e2e                          # E2E 双端一键通关 + v4 自定义出生全流程段
npm run gate:license                 # 许可门（素材变更时）
npm run gate:budget                  # 预算门（当前超线观察态，V4-1 待 v4-M2''' 首项处理）
```
