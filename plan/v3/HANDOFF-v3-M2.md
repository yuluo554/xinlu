# HANDOFF-v3-M2 · v3-M1'' → v3-M2'' 交接单

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档。
> 上一棒：v3-M1''（引擎与数据 v3，2026-10-24 ✅）。DoD 单源 [00 §里程碑总表](00-README总览.md)；验证记录 [docs/v3-M1-gates.md](../../docs/v3-M1-gates.md)。

## 一、当前进度 + 证据

- **v3-M1'' ✅（2026-10-24）**。交付：175 条事件库（121 条存量补 `ageMonths`/`line`/`deltas3`/`resourceDeltas`/第三选项 + 48 条 study/career 支线 + 6 条 rescue）+ 传导核心（`values.ts`：dimsOffsetOf 方向表 / deriveDims 投影 / stageDrift 漂移 / applyValues / applyResources / settleDeltas / 线进度 / monologueOf）+ 单调调度（开卷窗口 + 锚点 + 线轮转 + critical 月龄序 + **晚开事件位置下限**）+ 存档 `xinlu.save.v2`（v1 迁移补中位，绝不静默清档）+ validate 八区门（单调/≥3 选项/deltas3/资源口径/线密度分批/rescue 2×3/漂移表/独白表）。
- 出口门终值：vitest **157/157** / validate 0 FAIL（--full）/ typecheck 0 / E2E 双端通关（166 卡年龄全程单调 3→1068、选项 ≥3）exit 0 / 可达性 **2496 组 9/9** exit 0 / 预算门 475.02KB / 布局门·脱敏门·许可门全绿。
- 变异自检四套：乱序必红 / 删选项必红 / 回滚传导必红（14 处红）/ 剔除承重事件必红（end-03 0/2496）——全部复原绿，留痕 [docs/v3-M1-gates.md](../../docs/v3-M1-gates.md) §三。
- dogfooding 2 局留痕（ESFJ / ISFP 对照组 + 观察结论）：[docs/v3-M1-dogfooding.md](../../docs/v3-M1-dogfooding.md)。

## 二、当前事实·状态不变量（动手前必须知道）

1. **v3 里程碑状态真值 = plan/v3/00 §里程碑状态**（4 行）；**布局门状态副本（plan/00 里程碑总表 + README 状态表）已各加 `v3-M1''` 行**——布局门状态行正则只认 `M<k>`/`v2-M<k>'`，v3 行不参与门判定，但两副本必须逐处一致（AGENTS 纪律）。
2. **v1.0.0 / v2.0.0 tag 与 Release 不许改写**（沿 v2 收官交接单 §二.2）；v3 判定层已变（三观传导 + 结局重映射 3 条），v3.0.0 发布时 CHANGELOG 必须注明「历史存档建议重开」——**重开声明义务在 M4''，现在就别忘**。
3. **传导系数表是冻结口径**（02 §二 ▸ M1'' 增补方向表 + 0.4 系数）：改方向表 = values.test.ts 14 处红 + 传导保真档案失效。ei/jp 被 outlook 同驱是**结构耦合**——任何「让某结局可达」的数据调整先想耦合后果（详见 v3/00 决策记录 2026-10-24 结局重映射行）。
4. **可达性扫描口径已升级为轴空间**（26 权重 × 96 环境）：扫描在 `scripts/check-ending-reachability.mjs`，测试锚 `V3_GUARD_EVENT_IDS = ["teen-003"]`（wanderlust 唯一来源）。**给事件挂 `wanderlust` flag 或改 teen-003 前先想防回退测试**。
5. **调度器位置下限（floor）**：pre/rescue/线解锁等动态门槛晚开的候选不得早于已抽位置出牌——新增动态门槛类事件时月龄定在「自然出现的位置」，否则被 floor 吞掉不出现。
6. **rescue 数量口径 = 每资源恰好 2 条**（validate 硬门）；`requires` 目前 4 处（adult-103/midlife-101 o0 money≥20、youth-203/elder-202 o0 money≥30）——**E2E 连点器已改为跳过禁用按钮**，requires 可挂任意选项但别挂满三选项。
7. **K1–K12 全部继续生效** + 本棒新增易踩：storage 双 key（`xinlu.save.v2` 主 + `xinlu.save.v1` 仅迁移读，hasSaveKey 看两把）；engine.ts 内部用 `.ts` 扩展名 import（node 原生执行可达性扫描依赖）；图鉴 key `xinlu.gallery.v2` 不动。
8. **03 模块 1 ✅ / 模块 2 🟡**（图标对照随 M2'' 2.1）——模块 2 收口条件在 v3/03。

## 三、待办（v3-M2''，按 04 §v3-M2'' 顺序执行）

1. **2.1 许可门白名单扩展 + 素材采集**（Game-Icons 按事件清单选图标、CC0 底图检索下载，逐张对文案对照表入库 `src/data/`）——先表后图，许可门白名单扩展**先于**素材入库（03 模块 6 排序纪律）。
2. **2.2 时间轴画卷布局（D4=B）**：桌面双栏（左八段轨道含线别色点 + 右事件卡）/移动竖向时间轴、卡片重排（线别标签/年龄徽章/图标位）；`data-age-months` 断言钩子与 E2E 年龄断言**保留**。
3. **2.3 游戏感三件**：状态条常驻（mood/money/health 图标+数值）+ 抉择重量分级（critical 深色描边+徽章）+ 后果屏内在变化微反馈（三观/资源浮动——dogfooding 结论 1：这是「选择可感」的关键补齐）；动效按 game-feel-and-juice CHECKLIST（反馈预算制），验收记录落 `docs/v3-M2-feel.md`。
4. 出口门沿 04：双端 E2E 绿 + 375/768/1280 三档截图 + CHECKLIST 逐项 + 评审门（素材「图说的是不是这件事」逐张抽验 + 动效预算复核）。

## 四、既定口径清单（K 编号延续 + 本棒口径）

- **K1–K12 全部继续生效**（逐条见 [../HANDOFF-M7.md](../HANDOFF-M7.md) §四 + [../v2/HANDOFF-v2-M5.md](../v2/HANDOFF-v2-M5.md) §四）。
- 本棒口径新增（全部单源 plan/v3/02 ▸ M1'' 增补，实现不得复写第二份表述）：月龄解析四格式与机判全等；单调规则①②③；传导方向表与 0.4 系数；settleDeltas 结算系数表；lineGain 缺省 context 8/critical 15/rescue 0；线 critical 阈值 60；线终态阈值 0/1–29/30–79/≥80；rescue 触发 <25 与 requires ≥阈值语义。
- 独白区间 <35/35–65/>65（monologues.json 9 条）；漂移净和近零（infant+1 … elder 0，表内注释有逐段理由）。

## 五、环境坑（本棒实测新增 + 沿用）

- **本棒新增**：
  - Bash 直接写 `.ts` 源码会被安全钩子拒绝（Mimosa PreToolUse）——改源码一律走 Edit/Write 工具；数据 JSON 可用一次性 node 脚本写。
  - vitest 5 已移除 `it(name, fn, options)` 尾参签名——超时用 `it(name, { timeout }, fn)`。
  - 可达性扫描如果给策略循环加新门槛，记得跳过 requires 锁定的选项（已修过一次 `applyChoice：选项被资源门槛锁定` 崩溃）。
  - Map.get 返回 undefined 不是 null——storage 测试断言用 `?? null` 归一。
- 沿用：管道吞退出码（判成败 `cmd > log 2>&1; echo $?`）；sed 对中文不可靠（编辑用 Edit 工具）；dev/preview/http.server 用完清杀（`netstat -ano | grep :<port>` → `taskkill //F //PID`）；E2E 暖帧丢弃；`py` 替代 `python`；push 走 SSH:22；`core.quotepath=false`。

## 六、DoD 逐项 checklist（v3-M1''，全达成）

- [x] 1.1 年龄单调：121 条补 `ageMonths`（ageHint 机判全等）+ 15 条重锚（11 main/critical 乱序 + 4 校验期新发现）+ 单调调度 + validate E.AGE + E2E 全程断言；变异自检乱序必红
- [x] 1.2 三观层：values.ts（applyValues/dimsOffsetOf/deriveDims/stageDrift）+ 独白文案表 + 121 条 deltas3 换算（方向保真 88%，损耗口径文档化）+ 单测 20 项 + 评审门三方核对（gates §一）
- [x] 1.3 多线 schema + 资源：line 枚举 + 单调轮转调度 + resourceDeltas 全选项 + rescue 6 条（触发/位置下限）+ 存档 v2 迁移（v1 双旧档单测 + 绝不静默清档）+ 低值分支/requires 单测
- [x] 1.4 选项 ≥3 扩写（121 条第三选项全手写）+ study/career 支线首批 48 条 + validate 收紧全绿 + 变异自检 + dogfooding 2 局留痕
- [x] 出口门：validate 0 FAIL / vitest 157/157 / typecheck 0 / build+预算 475.02KB / E2E 双端 exit 0 / 可达性 9/9 / 布局·脱敏·许可全绿
- [x] 翻面同提交：v3/00（索引 backlog 行 + 决策记录 4 行 + 里程碑状态节 + 台账 4 行）+ v3/03 模块 1✅/2🟡 + v3/backlog 启用 + plan/00 与 README 副本各 +1 行
- [x] 本交接单七节落盘

## 七、关键命令速查（每条当轮实跑过）

```bash
node tools/check-sprint-layout.mjs          # 布局门（续接对话第一件事）
npm run validate                            # 数据门 v3（8 区，--full 常开）
npm run validate -- --count                 # 分母汇总（175 条 / 每阶段 fate+支线）
npm test                                    # vitest run（157/157）
npm run typecheck                           # tsc --noEmit
npm run e2e                                 # E2E 双端通关 + 年龄单调/选项≥3 断言
node scripts/check-ending-reachability.mjs  # 可达性扫描（2496 组，9/9；--without-guard-events 防回退模式）
npm run gate:budget                         # 预算门（dist 28 件 475.02KB / ≤500KB）
node tools/check-desensitized.mjs           # 脱敏门
npm run build                               # vite build
```
