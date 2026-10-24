# v3-M3'' · 出口门验证记录（图谱 + 种子码 + LLM 旁路 + 支线补齐）

> 2026-10-25。依据 [plan/v3/04 §v3-M3''](/plan/v3/04-里程碑任务分解.md) 出口门 + [plan/v3/03 §4/§5](/plan/v3/03-模块清单与验收.md) 验收口径。
> 口径单源 = [plan/v3/02 ▸ M3'' 增补](/plan/v3/02-数据与口径.md)（§五/§六/§七/§八，与实现同提交）。

## 一、出口门终值

| 门 | 命令 | 终值 |
|---|---|---|
| 数据门 | `npm run validate`（--full） | **0 FAIL，10 区**（新增 N 区 NPC 关系层；事件库 175→**243** 条；图标对照 243/243 + SVG 实物 246 枚；密度门五线全开每阶段 ≥3） |
| 单测 | `npx vitest run` | **218/218**（166 → 218：bond 层 12 + 图谱渲染 8 + 种子码 10 + LLM 旁路 24 + 过网隔离 3 + 可复现/自定义槽增 5） |
| 类型 | `npm run typecheck` | 0 错 |
| E2E | `npm run e2e` | **双端 exit 0**：235 卡年龄单调 3→1068、选项 ≥3、图标全覆盖、critical 分级/状态条/轨道色点/浮动层断言 + **v3 新增：图谱页（节点/连线/图例）+ 种子码形 + 终局快照 ≥4 节点 + 自定义槽离线隐藏 + 设置页（开关默认关/预设 ≥4）** + 768 中档双栏 + 三档截图 |
| 可达性 | `node scripts/check-ending-reachability.mjs` | 9 结局全可达（2496 组轴空间） |
| 预算门 | `npm run gate:budget` | **643.77KB / 650KB**（68 枚新图标 gz 约 +57KB，余量收窄至 6.2KB——见 §五 声音择项与 M4'' 提示） |
| 布局门 | `node tools/check-sprint-layout.mjs` | 全绿 |
| 脱敏门 | `node tools/check-desensitized.mjs` | 388 文件 0 命中 |
| 许可门 | `node tools/check-assets-license.mjs` | 0 FAIL（68 枚 Game-Icons 同白名单口径，跑前先 `git add`） |

截图留痕：`docs/assets/e2e-smoke-{375,768,1280}.png`（三档）+ 关键态目检 `docs/assets/v3m3-{start-seed,relations-graph,ending-snapshot}-1280.png`（开局种子工具 / 图谱页环形布局 / 终局快照 7 人全入册）。

## 二、评审门（强核查）：02 ▸ M3'' 增补 ↔ 实现 ↔ 单测 三方核对

| 口径（02 单源） | 实现 | 单测锚 |
|---|---|---|
| §五 衰减公式 `symRound(Δ×(1−0.5×\|values−50\|/50))` | `values.ts bondGainOf`（symRound 沿 M1'' 先例，符号对称） | values.test「values 极值衰减至一半」「中段线性 ×0.9」 |
| §五 tag 阈值 <30/30–59/60–89/≥90 | `values.ts tagOfBond` | values.test「阈值边界四态」（29/30/59/60/89/90 全边界） |
| §五 入册 = 首次选中带键选项，初始 50 | `applyBonds` + `engine.settleChoice` | values.test「未在册 NPC 以中位 50 入册」+ engine.test「applyCustomChoice 入册 62=50+12」 |
| §五 连线宽度 = 1+bond/100×5 ∈ [1,6]px | `relations.ts bondToWidth` | relations.test「两端与中段 / 越界钳制」+ E2E 连线断言 |
| §六 码表 32 符号去 0/1/O/I、seed∈[0,2³¹)、双向无损 | `seedcode.ts` | seedcode.test「往返一致 / 码形 / 非法输入 / 越界抛错」 |
| §六 随机出生 = seededDraw(seed,0..3) 派生四要素 | `engine.randomBirthEnv` | seedcode.test「同 seed 必得同环境 / 直接开局」 |
| §七 标签闭集 12 枚本地规则表 + clampCustomDeltas | `bypass.ts TAG_RULES` + `values.ts clampCustomDeltas` | llm.test「标签→规则表 / 相抵清零 / 双标签钳 ±10 / 闭集外忽略」 |
| §七 自定义槽不携带 flag、history 记第 4 槽位 | `bypass.customOptionOf` + `engine.applyCustomChoice` | llm.test「customOptionOf 不携带 flag」+ engine.test「history 记 options.length」 |
| §七 过网隔离（engine/+ui/storage/viz 禁网，llm/ 唯一 fetch 点） | `llm/isolation.test.ts` grep 守护 | 3 断言（engine 零网络 API / provider 层在位 / 其余层零绕过） |
| §八 信封 seedCode 可选、码形非法不清档、RunState 不携带码 | `storage.ts`（11/12 键双形态 + seedCodeOf 现算） | storage.test 原有往返 + 旧 v2 档（11 键）继续全绿 |

## 三、E2E 抓真缺陷（本里程碑实测记录）

**settleChoice 漏带 npcs（已修复 + 防回退锚）**：3.1 引擎接线后，Node 侧全流程复现发现——整局消费支线事件 117 条，`npcs` 仍只有父母。根因 = `settleChoice` 返回对象从 `...state` 重建而未携带 `withResources.npcs`，applyBonds 的结果被整段丢弃。单测此前只测 applyBonds 本体，未测 applyChoice 链路；E2E 图谱断言只查「≥3 节点」，同样拦不住。

处置三件：
1. 修复 = 返回对象补 `npcs: withResources.npcs`；
2. 单测新增防回退锚（engine.test「全选项驱动跑通后 NPC 已入册」——settleChoice 漏字段必红）+ applyCustomChoice 链路用例；
3. E2E 终局快照断言收紧 3→**4** 节点（整局消费支线后必有父母以外 NPC 入册）。

## 四、变异自检（两件，均必红→复原绿）

| 变异 | 操作 | 结果 |
|---|---|---|
| 图谱钳制 | `values.ts applyBonds` 的 `clampInt` 移除（bond 不钳 [0,100]） | values.test「bond 钳制 [0,100]；tag 随钳制翻转」**红** → 复原绿 |
| 同码复现 | `engine.randomBirthEnv` 的 `seededDraw(seed,n)` 改 `Math.random()` | seedcode.test「同 seed 必得同环境」+「同码双跑逐字段全等」**双红** → 复原绿 |

## 五、LLM 旁路验证与抽检

### 5.1 降级三路径 + 过网隔离（自动化）

- 单测 24 项（llm.test.ts）：不可用 / HTTP 报错 / 超时（AbortController 20ms 演练）/ 解析失败 / 空响应 → 全部降级返回 null 或预设文案；provider 层 URL 拼接、错误上抛。
- 过网隔离 3 项（isolation.test.ts）：engine/ 全目录零 `fetch(`/XHR/WebSocket/sendBeacon/EventSource；ui/storage/viz 同样禁网；`llm/provider.ts` 是全仓唯一 fetch 调用点（含 8s 超时 AbortController 在位）。
- 离线行为等价断言：E2E 双端全程在「无 Key + 开关关」下通关，自定义槽全程不渲染（离线隐藏口径）。

### 5.2 人审抽检 ≥10 条（02 §十）

**口径声明（如实）**：本机无任何 OpenAI 兼容端点凭据，本轮抽检为**端到端管线抽检**——真实事件 + 真实归一/钳制/降级代码，LLM 响应取自预录桩（每条完整记录在案）；「真实服务商端点的抽检」依赖用户 BYO Key，已登记 [plan/v3/backlog](backlog.md) 观察区（转入条件：用户首次配置 Key）。桩响应按「典型好响应 / 闭集外标签 / 非 JSON」三类设计，覆盖管线全部分支。

| # | 玩家输入（自由文本） | 桩响应（摘要） | 归一产物（叙事 / deltas3 / 资源） | 人审核对 |
|---|---|---|---|---|
| 1 | 我想在天台上大声喊出她的名字 | narrative+tags[共情,进取] | 「你趴在栏杆上…」/ values+2, outlook−2 / — | ✓ 共情→values+2、进取→outlook−2，方向正确 |
| 2 | 把攒的钱全借给朋友 | [耗财,共情] | 转账叙事 / values+2 / money−5 | ✓ 耗财−5 未超资源口径 |
| 3 | 通宵把项目做完 | [劳损,进取,消沉] | 台灯叙事 / outlook−2 / mood−5, health−5 | ✓ 双资源同落，量级 ±5 合规 |
| 4 | 陪妈妈去医院复查 | [共情,养生] | 陪诊叙事 / values+2 / health+5 | ✓ 正向行动给正增益 |
| 5 | 辞职去旅行 | [耗财,安然,振奋] | 出走叙事 / outlook+2 / mood+5, money−5 | ✓ 安然→outlook+2 方向正确 |
| 6 | 在会上把数据拍在桌上 | [原则,进取] | 拍桌叙事 / outlook−2, values−2 / — | ✓ 原则→values−2 正确 |
| 7 | 偷偷给流浪猫搭个窝 | [共情,感应,消沉] | 纸箱叙事 / worldview+2, values+2 / mood−5 | ✓ 感应→worldview+2 正确 |
| 8 | 报名夜校学画画 | [耗财,感应] | 交费叙事 / worldview+2 / money−5 | ✓ 语义保持，无数值越权 |
| 9 | 早点化解和爸爸的矛盾 | [共情,安然] | 敲门叙事 / outlook+2, values+2 / — | ✓ 无 bondDeltas（自定义槽不触关系层，口径内） |
| 10 | 中彩票了 | tags[暴富,中彩票]（闭集外） | 叙事透传 / {} / {} | ✓ 闭集外标签全忽略——LLM 无法注入数值 |
| 11 | （桩返回非 JSON） | — | **null（降级）** | ✓ 解析失败不入半截状态，槽位可重试 |

结论：11 条（≥10 达标）全部符合「LLM 只产叙事与标签、数值走本地规则表 + 钳制」的 02 §七口径；三条降级路径行为与预设一致。

### 5.3 安全工具 advisory 处置记录

- Mimosa「弱随机数」（app.ts Math.random）：已改为 `crypto.getRandomValues` 无偏右移（`randomSeed()`）；降级路径保留 Math.random 并注释「游戏种子，非加密用途」——可预测性在本域是特性（种子要展示/分享），advisory 接受。
- Mimosa「命令注入」误报（seedcode.ts）：源为正则 `.exec(` 方法名形似进程执行；已改 `.match()` 写法规避，逻辑不变。

## 六、声音择项（04 §v3-M3''：可不做，决策记录留行）

**拍板：本里程碑不做声音。** 依据（可复核）：`npm run gate:budget` 终值 643.77KB / 650KB，余量 **6.2KB**——3–5 枚 CC0 音效（单枚 gzip 后 3–10KB 量级）必然击穿预算线；为择项重审预算线（抬升 650KB）违背 M2'' 刚定稿的口径纪律（重审需新依据走 02 §九增补 + 决策记录）。声音扩展已登记 backlog 观察区（转入条件：v3-M3'' 择项不做且外部诉求出现——两条件均满足）。M4'' 发布前若做任何素材增量，预算线需先行重审。

## 七、dogfooding 与目检

- 本棒无正式 dogfooding 留痕义务（04 §v3-M3'' 未列）；E2E 双端各一整局（235 卡 × 2 视口）即全内容冒烟。
- 目检 3 张关键态（§一截图清单）：开局屏种子工具三入口齐、图谱页环形布局与 tag 配色正确（半步相位错开后外环不与父母重叠）、终局快照 7 人全入册（金=亲密 / 玫红=羁绊，线宽随 bond）。
- 种子码实测样例：`XL-23HQ-EBDG` / `XL-23J2-B99G`（终局屏 data-seed-code 实拍，码形合法）。
