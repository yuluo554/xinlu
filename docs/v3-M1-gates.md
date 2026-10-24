# v3-M1'' 评审门核对表（强核查）

> 2026-10-24 · v3-M1'' 出口门留痕。三方核对：口径单源（plan/v3/02 ▸ M1'' 增补）↔ 实现（src/engine/）↔ 单测（values.test.ts / engine.test.ts）。

## 一、传导链三方一致（04 v3-M1'' 1.2 评审门）

| 口径点（02 ▸ M1'' 增补） | 实现 | 单测锚点 | 一致 |
|---|---|---|---|
| worldview→sn（+δ 向感应→S）、outlook→ei/jp（+δ 向安然→I/P）、values→tf（+δ 向共情→F） | `values.ts` `DERIVE_TABLE` 方向表唯一实现 | `dimsOffsetOf` 六向断言 | ✅ |
| 每轴系数 0.4，round 后输出（0.4×±1=0 纯三观微动） | `offsetOf()` | `+8→3`、`±1→0` 断言 | ✅ |
| 传导核 = dimsOffsetOf(deltas3)；deriveDims(values3, dims, line) 为状态级投影（−50 中性基 + 极点钳制）；line 形参 M1'' 预留恒等 | `dimsOffsetOf` / `deriveDims` | 中性无倾向 / 感应 80→sn+12 / 极点钳 5 / 六线恒等 | ✅ |
| 非选项漂移 stageDrift（8 阶段 ×3 轴，\|值\|≤2，净漂移近零） | `stageDrift()` + stage-drift.json | infant/youth 行断言 + 数据契约扫描 | ✅ |
| 阶段结算：mood−5 / 健康按段 0/1/2/4/6 / 钱=floor(career/20)−4 | `settleDeltas()` | 系数表逐值断言 | ✅ |
| 事件 schema 换 deltas3，旧 deltas 字段移除 | events.json 全库无 `deltas` 键；validate `E.VALUES` 阻断回潮 | validate 变异自检 | ✅ |

## 二、当日定稿的三个决策（v3/00 §决策记录留行）

1. **传导签名细化**：02/03 原签名 `deriveDims(values3, dims, line)` 无法表达「方向按增量符号」（增量无入参可达）→ 增量显式化为 `dimsOffsetOf(deltas3)` 传导核，`deriveDims` 保留为同表状态级投影。
2. **结局重映射（传导耦合的结构性后果）**：outlook 同驱 ei/jp（02 冻结系数表）⇒ ei/jp 异侧结局结构性不可达（v2 的 16 角点扫描与 648 组轴空间扫描双证实）。ISTJ→ESTJ、ENTP→INTP、INTJ→ENTJ（仅翻被耦合锁死的字母，title/text/retrospect 语义适配）；v3.0.0 本就声明「三观层改变判定传导 → 历史存档建议重开」。
3. **可达性扫描空间升级**：扫描改在三观轴空间打分（26 组非零轴权重 × 96 出生环境 = 2496 组）——四维角点权重在耦合下无法表达真实策略空间；升级后 9/9 全可达（CLI 实测 6 秒）。防回退锚点从 v2 的 B1 清单（v3 事件池扩容后剔除仍全可达，不再是承重墙）换成 v3 单点：teen-003（wanderlust 唯一来源）剔除 → end-03 必不可达（实测 0/2496）。

## 三、变异自检（必红 → 复原绿，留痕）

| 变异 | 结果 | 复原 |
|---|---|---|
| 1.1 乱序：teen-012 ageMonths 204→100 | validate exit 1（`[E.AGE] 跨阶段回退：childhood 145 > teen 100`） | exit 0 ✅ |
| 1.4 删选项：midlife-014 删至 2 选项 | validate exit 1（`[E.OPTIONS] 不足 3 条`） | exit 0 ✅ |
| 1.2 回滚传导：方向表 sn 取反 | values.test.ts 14 处红，exit 1 | exit 0 ✅ |
| 防回退（可达性）：剔除 teen-003 | end-03 0/2496 命中，exit 1（tests/reachability-regression.test.ts 常驻） | — |

## 四、E2E 单调断言与真 bug 记录

- E2E 全程采集 `data-age-months`：双端 166 张卡 3→1068 月龄非减 + 每卡选项 ≥3 断言（smoke.mjs）。
- **断言首跑抓到真缺陷**：rescue 事件（elder-301，820 月龄）在阶段中途因健康跌破 25 才解锁，晚开事件插到 critical（1020）之后 → 1020→820 回退。修复 = pickEvent 位置下限（floor）：动态门槛（pre/rescue/线解锁）晚开的候选不得早于已抽位置出牌，错过即本局错过。修复后双端全绿。该缺陷同时被单测构造覆盖（rescue 用例全程单调断言）。

## 五、出口门终值（2026-10-24 实测）

| 门 | 结果 |
|---|---|
| validate（--full，8 区） | 0 FAIL（事件库 175 条） |
| vitest | **157/157**（v2 基线 121 → v3 基线 157：+values 传导 20、engine v3 改写、storage v2 迁移、可达性 2） |
| typecheck | 0 错 |
| build + 预算门 | dist 28 件 gzip 求和 475.02KB（门 ≤500KB）0 WARN |
| E2E 双端 | 375/1280 一键通关 exit 0（终局 ENFJ；年龄全程单调；选项 ≥3；分享卡落盘；图鉴断言） |
| 可达性扫描 | 2496 组 9/9 全可达 exit 0 |
| 布局门 / 脱敏门 / 许可门 | 全绿（0 命中 / 0 FAIL） |
| 换算保真 | 存量 121 条 deltas3 换算 468/532 方向保真（88%；64 处翻转集中于 jp，为 02 §二 ▸ M1'' 增补「ei/jp 同轴冲突取主分量」口径的文档化损耗） |
