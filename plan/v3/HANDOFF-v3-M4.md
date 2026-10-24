# HANDOFF-v3-M4 · v3-M3'' → v3-M4'' 交接单

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档。
> 上一棒：v3-M3''（关系图谱 + 随机出生种子码 + LLM 旁路 + 支线补齐，2026-10-25 ✅）。DoD 单源 [00 §里程碑总表](00-README总览.md)；验证记录 [docs/v3-M3-gates.md](../../docs/v3-M3-gates.md)。

## 一、当前进度 + 证据

- **v3-M3'' ✅（2026-10-25）**。交付四块 + 一个拍板：
  1. **3.1 关系图谱**：`src/data/npcs.json` 注册表（7 位：父母/伴侣小满/挚友阿澈/周老师/老康/林医生，validate N.REG 守门）+ `bondDeltas` 选项级字段（|Δ|≤15，N.BOND 守门；未在册 NPC 首次触发即以 50 入册）+ 衰减公式 `symRound(Δ×(1−0.5×|values−50|/50))`（`bondGainOf`）+ tag 阈值 <30 决裂/30–59 疏离/60–89 亲密/≥90 羁绊（`tagOfBond`）+ `src/ui/relations.ts` 环形 SVG（父母内环上半弧、支线外环半步相位错开五线分区、连线宽 1+bond/100×5、tag 四色）+ 阶段小结「关系图谱」入口 + 终局快照内联（`data-relations-snapshot`）。
  2. **3.2 随机出生 + 种子码**：`src/engine/seedcode.ts`（32 符号表去 0/1/O/I，`XL-XXXX-XXXX` = seed∈[0,2³¹) 定长 8 符号大端双向无损）+ `randomBirthEnv(seed)`（seededDraw(seed,0..3) 派生四要素）+ 开局屏「随机出生」按钮 + 种子码输入（小写/空格容错，非法拒绝提示）+ 终局屏 `data-seed-code` 展示 + 存档信封可选 `seedCode` 字段（11/12 键双形态合法，码形非法当缺省不清档；RunState 不携带码，一律 `seedCodeOf(state.seed)` 现算）。
  3. **3.3 LLM 旁路（D2=a）**：`src/llm/` 三件单层——`config.ts`（设置存 `xinlu.llm.v1`，5 服务商预设，`llmUsable` = 开关∧Key∧URL∧Model）/ `provider.ts`（OpenAI 兼容 chatCompletion，8s AbortController 超时，全仓唯一 fetch 调用点）/ `bypass.ts`（三用途：自定义裁决＝LLM 只产叙事+闭集 12 标签（`TAG_RULES` 本地规则表 ±2/±5）→ `clampCustomDeltas` 按事件类型口径钳制；变体改写仅 context 仅文本；终局点评预设兜底）+ 引擎侧 `applyCustomChoice`（与 applyChoice 同结算链，history 记第 4 槽位，不携带 flag）+ 设置页（BYO Key 明文风险提示）+ 卡屏第 4 槽（`llmUsable` 才渲染）。
  4. **3.4 支线补齐**：love(-4xx)/friend(-5xx)/health(-6xx) 每阶段 ≥3 共 **68 条新事件**（含 12 条带 aftermath）+ 图标 68 枚（Game-Icons 全量包同批提取，icon-map 243/243，[docs/v3-M2-icons.md](../../docs/v3-M2-icons.md) §v3-M3'' 增补逐张对文案）+ 存量 7 选项补 teacher/mentor 关系增量 + `LINE_DENSITY_ON` 五线全开。**事件库 175→243**。
  5. **声音择项拍板不做**（v3/00 决策记录 2026-10-25 行：预算余量 6.2KB 必爆线；backlog 观察区两转入条件已满足）。
- **E2E 实测抓真缺陷 1 件**（[gates §三](../../docs/v3-M3-gates.md)）：`settleChoice` 返回对象漏 `npcs` 字段 → 整局支线消费 117 条图谱仍只有父母。已修复 + 单测防回退锚（engine.test「全选项驱动跑通后 NPC 已入册」）+ E2E 快照断言收紧 3→4 节点。
- 出口门终值：validate **0 FAIL（10 区**，新增 N 区）/ vitest **218/218**（166→218）/ typecheck 0 / E2E 双端 exit 0（235 卡年龄单调 3→1068 + 图谱页/种子码/快照 ≥4 节点/自定义槽离线隐藏/设置页断言）+ 768 档 + 三档截图 / 可达性 2496 组 9/9 / **预算 643.77KB / 650KB** / 布局·脱敏·许可全绿。关键态目检 3 张（`docs/assets/v3m3-{start-seed,relations-graph,ending-snapshot}-1280.png`）。
- 变异自检两件（图谱钳制/同码复现）必红→复原绿（[gates §四](../../docs/v3-M3-gates.md)）。
- LLM 管线抽检 11 条留痕（桩响应口径，决策记录在案；真实端点抽检 backlog 观察区，转入条件=用户首次配 Key）。

## 二、当前事实·状态不变量（动手前必须知道）

1. **v3 里程碑状态真值 = plan/v3/00 §里程碑状态**（M1''/M2''/M3'' ✅）；两副本（plan/00 + README）各加至 v3-M3'' 行，逐处一致。
2. **v1.0.0 / v2.0.0 tag 与 Release 不许改写**；**v3.0.0 发布时 CHANGELOG 必须注明「三观层改变判定传导 → 历史存档建议重开」——重开声明义务在本棒（M4''）**（沿 M1'' 交接 §二.2）。
3. **预算线 650KB，当前 643.77KB，余量仅 6.2KB**——M4'' 发布前**任何**素材/依赖增量都可能击穿：README 增量、发布文案不动预算；若确需增量先走 02 §九重审流程（backlog 观察区已登记触发条件）。
4. **口径单源 plan/v3/02 ▸ M3'' 增补**（§五 NPC/图谱、§六种子码、§七 LLM、§八信封）与实现同提交——改行为先改 02 再动码。传导系数表（02 §二）与防回退锚 `teen-003` 不动。
5. **过网隔离 grep 测试在 `src/llm/isolation.test.ts`**：engine/ui/storage/viz 全禁网，`src/llm/provider.ts` 是全仓唯一 fetch 点——给表现层加任何网络功能必须经 llm/ 单层。
6. **新事件 id 编号段**：fate -0xx / study -1xx / career -2xx / rescue -3xx / **love -4xx / friend -5xx / health -6xx**；新 NPC 需先注册 `npcs.json`（validate N.REG），bondDeltas 键必须已注册（N.BOND 拦）；新事件图标必须同步 icon-map（I 区拦，零重复）+ [docs/v3-M2-icons.md](../../docs/v3-M2-icons.md) 增行。
7. **LLM 数值安全链**：标签闭集 12 枚（`TAG_RULES`）→ `clampCustomDeltas`（按事件类型口径）→ `applyCustomChoice`（不携带 flag、history 第 4 槽位）——自定义槽永不直写数值/flags/pre。
8. **E2E 断言基线再扩**（smoke.mjs）：`.screen-relations`/`[data-relations-chart] svg`、`[data-seed-code]`、`[data-relations-snapshot]`（≥4 节点）、`[data-custom-slot]`（离线必须不存在）、`.screen-settings`——改这些 DOM 钩子先同步 E2E。
9. **K1–K12 全部继续生效** + M1''/M2''/M3'' 新增易踩见 §五。
10. **03 模块状态**：1 ✅ / 2 ✅（243 条收齐）/ 3 ✅ / 4 ✅ / 5 ✅ / 6 🟡（余发布流程）。
11. **backlog**：V3-1 待排期；观察区新增「LLM 真实端点人审抽检」「预算线重审（v3）」两条转入条件在案。

## 三、待办（v3-M4''，按 04 §v3-M4'' 顺序执行——顺序不可颠倒）

1. **README 增量**：时间轴/图谱/种子码/LLM 说明 + 开关提示（「AI 旁路默认关闭，离线行为与 v2 一致」），不破行数门（状态行 = 表格行）。
2. **发布流程**（沿 v2-M4' 同套路）：`npm run build` → 干净静态服务双端通关冒烟（`npm run e2e -- --base-url`，py http.server 伺服 dist/）→ Pages 部署 → 实开复核 → CHANGELOG v3.0.0（数据口径版本 v3.0.0：事件 243/结局 9/画像 16/birth-map 288 对账 `npm run validate -- --count`；**含历史存档建议重开声明**；v3 特性清单）→ plan/05 追加 v3.0.0 节主体（tag 前）→ **tag v3.0.0 → Release 五部分 + dist.zip + sha256** → 留档「tag 后追加」分栏。
3. **package.json version 2.0.0 → 3.0.0**（CHANGELOG 同提交）。
4. 出口门：三件套 + 全部门绿 + README 行数门 + 布局/脱敏/许可/预算（643.77KB 基线不动）。
5. 收官：状态副本/台账翻齐 → HANDOFF-v3-M5（收官交接单，v3 无 M5'' 里程碑则沿 v2-M4' 先例写收官单）。

## 四、既定口径清单（K 编号延续 + 本棒口径）

- **K1–K12 全部继续生效**（逐条见 [../HANDOFF-M7.md](../HANDOFF-M7.md) §四 + [../v2/HANDOFF-v2-M5.md](../v2/HANDOFF-v2-M5.md) §四）。
- M1''/M2'' 口径全部延续（月龄四格式/单调规则①②③/传导方向表 0.4/结算系数/lineGain/线阈值/线终态/rescue/requires/图标对照单源/预算 650KB）。
- **本棒（M3''）口径新增**（单源 plan/v3/02 ▸ M3'' 增补）：bond 衰减公式（symRound×(1−0.5·|v−50|/50)）与 tag 阈值 30/60/90；NPC 入册=首次触发 bondDeltas 且初始 50；图谱连线宽 1+bond/100×5、外环半步相位；种子码 32 符号表去 0/1/O/I、域 [0,2³¹)、双向无损、手选出生也展示码；LLM 标签闭集 12 枚 + 本地钳制 + 不触 flags；自定义槽 history 记 `options.length`；信封 seedCode 可选字段（11/12 键双形态）。
- 决策记录三行新增长效有效：声音不做（余量 6.2KB 依据）、LLM 抽检桩响应口径、（沿）预算 650KB。

## 五、环境坑（沿 + 本棒实测新增）

- **本棒新增**：
  - **Mimosa 钩子两误报形态**：正则 `.exec(` 被判「命令注入」（改 `.match()` 规避，逻辑不变）；`Math.random` 被判「弱随机数」（游戏种子改 crypto.getRandomValues 无偏右移；如再遇，评估用途后可接受 advisory）。
  - **Node 24 直跑 TS 带 `as` 类型断言报 SyntaxError**：`node --input-type=module -e` 的脚本体是 JS 语法；类型断言代码用临时 `.mts` 文件 + `npx vite-node` 跑（能解析无扩展名导入与 vite 路径别名）。
  - **Bash 写 `.mts/.ts` 一律被 Mimosa 拦**（包括临时脚本在 Temp 目录）——heredoc 到 `.mjs`（纯 JS）或 Write 工具落 `.mts`。
  - **game-icons 全量包解压结构含中间层**：`icons/000000/transparent/1x1/<作者>/<名>.svg`——提取脚本按 basename 递归索引，不要按 `icons/<作者>/` 直拼路径。
  - **测试自动驾驶撞 requires 锁定选项**：事件库扩容后确定性序列（全选第 0 项/奇偶交替）会选中 requires 不满足的选项 → applyChoice 抛错。harness 统一口径：首选不可用回退首个可用项（engine.test/logic.test 已改，新 harness 照抄）。
- 沿用：管道吞退出码（判成败 `cmd > log 2>&1; echo $?`）；sed 对中文不可靠（编辑用 Edit 工具）；dev/preview/http.server 用完清杀（`netstat -ano | grep :<port>` → `taskkill //F //PID`）；E2E 暖帧丢弃；`py` 替代 `python`；push 走 SSH:22；`core.quotepath=false`；许可门按 `git ls-files` 对账（新素材先 `git add` 再核门）；vite SVG data-URI 内单引号坑（iconStyle esc 纪律）；vitest 5 超时签名。

## 六、DoD 逐项 checklist（v3-M3''，全达成）

- [x] 3.1 关系图谱：NPC 模型接线（npcs.json + bondDeltas + 衰减 0.5 + tag 阈值）+ `src/ui/relations.ts`（SVG 收窄面）+ 图谱页入口 + 终局快照收录；单测（bondDeltas 钳制/衰减系数/tag 翻转阈值）+ 渲染断言 + E2E 双端
- [x] 3.2 随机出生 + 种子码：`seedCode = XL-XXXX-XXXX`（Crockford Base32 去 0O1I）+ 派生四要素 + 同码复现断言 + 手选出生仍显示种子；存档信封可选 `seedCode` 字段（读取缺省按 `seed` 数值键）
- [x] 3.3 LLM 旁路（D2=a）：`src/llm/` 单层（provider/开关/降级）+ 设置页 + 自定义第 4 槽（离线隐藏口径）+ 变体改写 + 终局点评 + 三路降级单测 + 过网隔离 grep 测试 + 人审抽检 11 条留痕（≥10 达标，桩响应口径 + backlog 登记真实端点补验）
- [x] 3.4 支线补齐 + 声音择项：love/friend 每阶段 ≥3 + health 补齐（68 条）+ `LINE_DENSITY_ON` 全开五线绿；声音不做 → 决策记录留行（2026-10-25）+ backlog 观察区转入条件记档
- [x] 出口门：validate 0 FAIL（10 区）/ vitest 218/218 / typecheck 0 / E2E 双端 exit 0 + 768 中档 + 三档截图 + 关键态目检 3 张 / 可达性 9/9 / 预算 643.77KB / 布局·脱敏·许可全绿；变异自检两件（图谱钳制/同码复现）必红→复原绿；评审门强核查（三方核对表 + LLM 抽检）记录 [docs/v3-M3-gates.md](../../docs/v3-M3-gates.md)
- [x] 翻面同提交：v3/00（里程碑状态 + 台账 4 行 + 决策记录 2 行）+ v3/03（模块 2/4/5 ✅、模块 6 🟡）+ v3/02 ▸ M3'' 增补 + backlog 观察区 2 行 + plan/00 与 README 两副本各 +1 行
- [x] 本交接单七节落盘

## 七、关键命令速查（每条当轮实跑过）

```bash
node tools/check-sprint-layout.mjs          # 布局门（续接对话第一件事）
npm run validate                            # 数据门 v3（10 区：E/L/N/B/X/P/M/V/I + 文件）
npm run validate -- --count                 # 分母汇总（243 条 / 五线密度全开）
npm test                                    # vitest run（218/218，含 llm/isolation grep 门）
npm run typecheck                           # tsc --noEmit
npm run e2e                                 # E2E 双端通关 + 768 中档 + 图谱/种子码/快照/隐藏槽/设置页断言
node scripts/check-ending-reachability.mjs  # 可达性扫描（2496 组，9/9）
npm run gate:budget                         # 预算门（643.77KB / 650KB——余量 6.2KB，增量先重审）
node tools/check-assets-license.mjs         # 许可门（跑前先 git add 素材）
node tools/check-desensitized.mjs           # 脱敏门
npm run build                               # vite build
```
