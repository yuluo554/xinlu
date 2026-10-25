# HANDOFF-v4-M2 · v4-M1''' A 段收尾交接单（A 段棒 → B 段棒）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档。
> 编号纪律（skill 硬约束①）：**交接单编号随棒顺延**——装订棒写 [HANDOFF-v4-M1](HANDOFF-v4-M1.md)（A 段入棒单，留档原样），A 段棒收尾写本档（B 段入棒单），B 段棒收尾写 HANDOFF-v4-M3，依次到收官单（拆棒后 v4-M4''' 收官单顺延为 HANDOFF-v4-M6）。
> 本档记录 v4-M1''' 的 **A/B 拆棒执行**（预案 = v4/04 §风险，决策记录见 [00](00-README总览.md) 2026-10-25 行）：**A 段（1.1 历法年代库 + 1.2 画像家庭）已于 2026-10-25 收官**；B 段（1.3/1.4 故事重写）待续棒，DoD 不减。

## 一、当前进度 + 证据

- **A 段四件全落地**：
  - 1.1 历法与年代库：`src/engine/year.ts`（eraOf 归段 / eraMidYear / runYearOf）+ `src/data/era-events.json` **76 主锚 1955–2030 逐年 1 条**（国际 10 条 13.2% ≤15%；✅已核对 55 / 典型值 21）+ `docs/v4-era-facts.md` 查证三态表 76 行 + 注入 `engine.eraEventFor/applyEraCard`（**判定核调度零改动**：注入在 pickEvent 之外，02 §二 ▸ M1''' 细则）+ 年份徽章「YYYY 年 · N 岁」全卡位。
  - 1.2 画像与家庭：birth-map 八因素扩展（region/structure/parentsJob/wealth 四组修正量）+ `src/engine/family.ts`（构成/bond 派生表/姓名池同局无重复）+ `src/data/names.json`（姓 20 + 南北男女名池 80）+ npcs.json 家庭注册槽 5 位 + 开局三页签（随机/手选/自定义六因素）+「我的家庭」入口（图谱复用 renderRelations，fate 内环 >4 节点改整圆）+ 存档 **v3**（`xinlu.save.v3`，迁移链 v1→v2→v3 补派生补家庭，migrated 标记终局一句提示）。
- **证据（2026-10-25 当轮实测）**：
  - `npm run validate` 0 FAIL（新 **R 区**：era 76/76 逐年无缺 + 国际 10/≤11 + 查证表行数对账 + names 池 + 家庭注册槽 + birth-map 八因素 51840/51840 组合落域）。
  - `npm test` **252/252**（基线 218 → +34：year 9 断言 / era 7 / family 8 / birth-v4 7 / storage 迁移链与形状扩展；`tests/reachability-era.test.ts` 年代轴抽样 6 年 × 12 环境 × 13 权重 = 936 局全通关、时代卡确有注入、≥6 结局可达）。
  - `npm run typecheck` 0 错；`npm run e2e` 全绿（375/1280 双端一键通关 + **v4 自定义出生全流程段**：三页签/六因素表单/1956 时代卡首屏/年份徽章 1969→2058 与 2012→2101 单调/「我的家庭」图谱本局姓名 ≥3 字名/存档 v3 含 kind:"era" 条目；768 中档照旧）。
  - 变异自检 3 组验红复原绿（见 §六）；脱敏门 411 文件 0 命中；布局门全绿。
- **预算门实测（已立案不隐藏）**：`npm run gate:budget` **FAIL 658.06KB > 650KB**（超 14.29KB gzip；v3.0.0 基线 643.77KB 余量本就 6.2KB）。M1''' 出口门不含预算门，04 出口门 2.1 原排 M2''' 重审；已进 backlog **V4-1**（提基线或等价优化，不裁内容），v4/00 决策记录 2026-10-25 留行。

## 二、当前事实·状态不变量（B 段动手前必须知道）

1. **口径单源仍是 plan/v4/02**，A 段已落 ▸ M1''' 增补四节（§一历法派生表/§二注入细则与 R 区字母/§三派生概率表与家庭口径/§九 schema v3 细则）——实现与文案不得复写第二份表述；B 段文本口径（§八）原样生效。
2. **状态副本现状**：v4-M1''' 两处机读副本已翻 **🟡**（A 段收官）；B 段完成后同提交翻 ✅ 并翻齐：两副本 + v4/00 台账「故事写实化」行（现 ⬜ 待 B 段）+ v4/03 模块 2 状态行 + 收尾交接单写 **HANDOFF-v4-M3**（编号随棒顺延）。
3. **PENDING_TOOLS 登记 `scripts/check-story-quality.mjs` → v4-M1''' 仍在**：B 段块 1.3 落位该脚本与 `npm run validate:story`（分批开启）的**同提交必须删除登记**，否则 DOC_TOOLS stale 变红。
4. **故事重写只动文本面不动 deltas3 数值**（v4/03 纪律）；数值必须动 → v4/00 决策记录留行 + `tests/reachability-*.test.ts` 复跑（含新增年代轴抽样档）。
5. **存档 v3 形状**（02 §九 ▸ M1''' 增补）：顶层 + birthYear/profile/（可选 seedCode/migrated）；history 条目可选 `kind:"era"`（option=-1 哨兵）；npcs 条目可选 `name`（家庭 NPC 本局姓名）。旧档迁移：birthYear=eraMidYear(env.era)，profile=deriveBirth(env,seed) 复算，家庭补生成（既有 bond 保留）。**绝不清档**（K6）。
6. **时代卡注入契约**：eraEventFor 五闸（锚年命中/stageFit/同锚不重复/每阶段 ≤2/与 critical 双向错开）——改任何一条须先改 02 §二 ▸ 增补再同步 era.test。
7. **判定核零改动红线**（K11 延续）继续生效：三观传导/结局判定/调度单调未动一字（pickEvent/applyChoice/advanceStage/resolveEnding 原样）。
8. **E2E 注意**：出生年命中锚年时**首屏是时代卡不是事件卡**（smoke 已有穿卡逻辑，别删）；年份徽章正则到 21xx（10s 出生可活到 2100+）。
9. 基线数字更新：单测 **252**（B 段出口 ≥252）；预算超线态见 V4-1；LLM 旁路默认关不变。

## 三、下一棒待办（v4-M1''' B 段 · 故事重写主工程；任务块见 [04](04-里程碑任务分解.md) 1.3/1.4）

1. **1.3 批一**（fate + study/career 文本写实化重写）+ `scripts/check-story-quality.mjs` 落位（字数/互引计数/年代词表命中/五感词表命中四项机检；`npm run validate:story` 批一开启绿；**同提交删 PENDING_TOOLS 登记**）。
2. **1.4 批二**（love/friend/health + 时代卡文案润色）+ 人工抽查 ≥30% 样本合格率 ≥90% 留痕 `docs/v4-story-review.md` + dogfooding ≥3 局沉浸感留痕（年代感/地域感/互引三问）。
3. 出口门：validate 全绿 + validate:story 两批绿 + vitest ≥252 + typecheck 0 + e2e 绿 + 可达性复跑（全量 + 年代轴抽样）+ 布局/脱敏绿。
4. 收尾翻面（同提交）：M1''' 翻 ✅ 的全套清单见 §二.2；收尾交接单写 HANDOFF-v4-M3（含 M1''' 整体 DoD 对账）。
5. 年代锚词表/五感词表先定稿进 02 §八 ▸ B 段增补再写脚本（口径先行惯例）。

## 四、既定口径（已拍板，别再问；推翻须进 `v4/00` 决策记录）

- D5 年代密度：每年 1 主锚 + 每阶段注入 ≤2（已实现；评审可推翻）。
- 文本口径：critical ≥180 字 / context ≥100 字 / 五感 ≥2 / 互引 ≥1 / 年代锚+地域+家境各 ≥1；抽查合格率 ≥90% 出口，余量进 backlog。
- 时代卡无选项（固定增量 |Δ3|≤2 / |res|≤8），进 history kind:"era"。
- 预算线 650KB **待 M2''' 重审**（V4-1 在队；A 段后实测 658.06KB）。
- 产品/赛事/制度名属公共文化事实可入文；真实机构名/真人名不写（02 §二 ▸ 增补）。

## 五、环境坑（实测在案）

- 本机直连 github.com 不通：**push 一律 SSH:22**（origin `git@github.com:yuluo554/xinlu.git`）；仓库管理走 gh API；远端 CI 已接通。
- 脱敏门红线：入库文件与提交信息不得写本机盘符/用户名/回环代理端口；示例路径用 `<user>`/`<repo>`；本地地址写 localhost。
- node v24 原生跑 .ts（可达性扫描用）**不支持构造器参数属性**（family.ts NameBag 已绕）；engine 链上 import 一律显式 `.ts` 扩展。
- Windows Git Bash；`python` 是商店占位符不可用（批量文本处理用 node 或 Edit 工具）。
- 素材 png 不入 git；新增素材先扩许可门白名单再入库。

## 六、DoD（v4-M1''' 单源见 [00 §里程碑总表](00-README总览.md)；此处记录 A 段已验项与变异自检）

- A 段已过：validate 新门（R 区）/ 年份推进与家庭生成 E2E / 迁移三档单测 / 可达性年代轴抽样（936 局）/ 公共门（布局/脱敏/vitest 252/typecheck 0/e2e）。
- B 段未过：validate:story 两批 / 抽查 ≥90% 留痕 / dogfooding ≥3 局 → **M1''' 整体 DoD 未闭合，维持 🟡**。
- **变异自检记录（2026-10-25，3 组验红→复原绿）**：
  - MUT-R1 删 era-1990 锚 → `R.MAIN 主锚 75 条…异常年份：1990` 红 ✓（「删一锚必红」DoD 项）。
  - MUT-R2 查证表删 1990 行 → `R.FACT 查证表数据行 75 ≠ 主锚 76` + `缺锚行：era-1990-asian` 双红 ✓。
  - MUT-R3 birth-map 60s jp 3→60 → `B.COVER jp 初始值 112 出域` 红 ✓（v1 区先红；R.BIRTH 51840 组合域是同一不变量的更大空间覆盖）。
  - 教训沿用装订棒结论：门不红时先查变异本体再怀疑判据（本轮无此坑）。

## 七、命令速查

```bash
node tools/check-sprint-layout.mjs   # 布局门（= npm run gate:layout）
node tools/check-desensitized.mjs    # 脱敏门（= npm run gate:desens）
npm run validate                     # 数据门（含 R 区：era/家庭/八因素域）
npm run validate:story               # 写实初筛（B 段块 1.3 交付后才存在）
npm test                             # vitest（A 段后基线 252）
npm run typecheck                    # tsc --noEmit
npm run e2e                          # E2E 双端一键通关 + v4 自定义出生全流程段
npm run gate:license                 # 许可门（素材变更时）
npm run gate:budget                  # 预算门（当前 658.06KB 超线观察态，V4-1 在队）
```
