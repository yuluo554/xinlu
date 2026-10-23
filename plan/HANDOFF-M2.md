# HANDOFF-M2 · 第 2 棒交接单（M1 → M2）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档。
> 库内一律相对路径；会话启动命令由用户侧拼绝对路径。

## 一、当前进度 + 证据

- **M0（仓库骨架）✅、M1（数据先行）✅（2026-10-24）**；里程碑状态已同步翻齐两处机读副本，台账"出生环境四要素定盘"行已翻 ✅。
- 证据（2026-10-24 当轮实测）：
  - 提交链：`85fd7e0`（plan 全套）→ `9e2ffd0`（装订 + M0）→ `cb643ad`（HANDOFF-M1 入库）→ M1 交付提交（本交接单随该提交入库）。
  - 数据落位（`src/data/` 四份，全部原创文案）：`events.json` 8 阶段 17 条骨架样例（main 8 / context 7 / critical 2，每阶段 ≥2，flag/pre 机制已实例化）；`birth-map.json` 288/288 组合全覆盖（初始值范围 ei 43–56 / sn 47–55 / tf 45–53 / jp 45–59，全部落域 [0,100]）；`endings.json` 8 条件结局 + 1 兜底（兜底末位、不写死字母）；`portraits.json` 16/16 型封闭枚举。
  - `npm run validate --count` 0 FAIL（分母汇总已打印，供 M4 回填 00 台账对账）。
  - **门禁自检 4 组全验红、复原后与造错前字节级一致并复绿**：A 删事件 elder-001 → `[E.DENSITY] 阶段 elder 仅 1 条` 红；B youth-001 选项 ei 改 5 → `[E.DELTA] 超口径（main |Δ|≤3）` 红；C teen-002 pre 改「calm」→ `[E.PRE] 不可达死锁` 红；D birth-map era.60s.ei 改 -55 → `[B.COVER] 初始值出域（48 处）` 红。一次性造错未入库。
  - `--full`（M4 密度/字数门）实测按设计报出 8 阶段密度缺口并 exit 1——M1–M3 默认不开（plan/04 §风险：先低密度后补齐）。
  - `npx vitest run` 8/8 绿；`npx tsc --noEmit` 0 错；布局门全绿（文档点名脚本 3 个全在位，`PENDING_TOOLS` 已随 validate-data.mjs 落位清空）；脱敏门 32 文件 0 命中。
  - MBTI 口径查证三态翻转完成：MBTI 四维定义 ✅ / 品类传播度 ✅ / 开源空白 🟡（渠道与检索快照见 data/README.md 依据查证表；plan/01 §五与 §一同步翻转）。
  - CI test job 新增「Data validation」步骤（`npm run validate`）；CI 仍未实跑（本机无远端）——一切"CI 绿"仍只能表述为"本地等价校验（待首推验证）"。

## 二、当前事实·状态不变量（下一棒动手前必须知道）

1. **数值口径唯一事实源 = plan/02**（K1）。M1 在单源内补了三处澄清（不是新增第二份表述）：§三合成口径行（初始值 = 中立值 50 + 四要素修正量之和，越界 = birth-map 设计错误、validate 拦截、引擎不钳制初始值）；§一字母判定补明三维同构方向（`sn>50 → S，tf>50 → F，jp>50 → J`，endings 区间与引擎 M2 都以此为准）。
2. **里程碑状态两处机读副本**（plan/00 里程碑总表 + README 状态表）改状态必须同步翻齐并跑布局门（K3）。
3. **零运行时依赖红线**（K2）：`dependencies` 恒空；`scripts/validate-data.mjs` 本身也零依赖（仅 node:fs/node:path）。
4. **数据文件形态**（M2 引擎直接消费）：`events.json` = 顶层数组；`endings.json` = 顶层数组（条件结局 + **恰好 1 个无 `cond` 的兜底且必须末位**，兜底不得写 `typeText`——终局字母由四维实算）；`portraits.json` = 对象（16 型键封闭枚举）；`birth-map.json` = `{era, place, mood, style}` 四要素 → 各枚举值 → 四维修正量。
5. **flag 机制现状**（K10）：命名小写 kebab（validate 拦截）；已定义 `rebel`/`conform`（toddler-001）、`wanderlust`（teen-003）；`pre` 引用：teen-002←rebel、youth-002←wanderlust；endings 引用：end-03 必含 wanderlust、end-04 必含 rebel/禁含 conform。**endings 引用的 flag 必须在事件库有定义（validate 查闭合），M4 补内容时先立 flag 再引用。**
6. **数据门分阶段开关**（K9）：默认 = schema/枚举/偏移口径/pre 防死锁/birth-map 覆盖/endings 兜底/画像 16 型/骨架密度（每阶段 ≥2）；`--full` = plan/02 §二密度矩阵 + 画像 80–150 字（M4 出口前把 package.json 的 validate 命令加 `--full`，同提交）。
7. `npm run validate` 入口名已实装（K7）；`--count` 输出含分母，M4 回填 00 台账时用它对账，防文档数字漂移。
8. 交付面尚未冻结：M1 之后每次提交都可改任何文件；tag 之后才进入"只许文档面提交"。M2 出口是**契约冻结点**（03 §2 函数签名冻结，改签名 = 跨模块变更须回改 plan/03）。
9. CI workflow 已入库但从未实跑（无远端）；Mimosa 对前两笔提交的库扫描未得出完整结论——不对外宣称"项目已通过安全审计"。

## 三、下一棒待办（M2 · 演化引擎与存档，任务块与验证命令见 plan/04 §M2）

1. 2.1 `src/engine/`：createRun / pickEvent / applyChoice / advanceStage / resolveEnding 纯函数 + 种子化 RNG。注意：createRun 的四维初始化用 K8 合成口径（50 + 修正量，不钳制）；pickEvent 按 main → context 随机 → critical 调度并过滤 `pre` 不满足的事件。
2. 2.2 **可复现断言**：同 seed + 同选项序列两跑全程逐字段全等；防回退自检：回滚任一钳制逻辑对应测试必须变红。
3. 2.3 `src/storage/`：load/save/clear + v1 schema 迁移 + 损坏兜底（绝不静默清档）；localStorage 用内存 stub 测试；key 用 K6 口径。
4. 出口门：03 §2 契约签名冻结；**评审门（唯一强评审核查点）**：数据口径 ↔ 引擎实现 ↔ 测试三方一致性——口径只在 plan/02、引擎无第二份表述（M1 的 K8/K9/K10 与 §二第 4/5/6 条就是三方对齐点）。
5. 收尾顺序（skill 硬约束①）：DoD 验证 → plan/00 两处副本 + 台账"四维倾向值连续演化""同种子两次通关结果全等"两行翻 ✅ → 写 HANDOFF-M3 → commit。

## 四、既定口径清单（K 编号；动了会打挂测试/门）

- **K1 口径单源**：数值口径只在 plan/02 定义一处；引擎/前端/测试/数据文件不得复写口径。
- **K2 零运行时依赖**：`dependencies` 空；守门测试在 tests/skeleton.test.ts。
- **K3 状态行 = 表格行**：状态格以状态符开头；plan/00 里程碑总表 + README 状态表两处副本同步翻。
- **K4 提交信息中文**，沿用「心路：」前缀。
- **K5 布局门判据只落仓库内文件**；门必须打印扫描计数（非空跑自证）。
- **K6 存档 key 口径**：`xinlu.save.v1`（M2 用；schema v 变更则 key 同步变，旧 key 迁移后清理）。
- **K7 校验脚本入口名**：`npm run validate`（M1 已实装）。
- **K8 birth-map 合成口径**（M1 新增，定义于 plan/02 §三）：初始值 = 中立值 50 + 四要素修正量之和；288 组合全部落域 [0,100]；越界 = 数据设计错误（validate 拦），引擎**不**对初始值钳制。
- **K9 数据门分阶段**（M1 新增）：默认门常开（含骨架密度每阶段 ≥2）；`--full` 为 M4 出口门（密度矩阵 + 画像字数），届时 package.json validate 命令加 flag 同提交。
- **K10 flag/引用纪律**（M1 新增）：flag 小写 kebab；`pre` 只许引用**更早事件**定义的 flag；endings 引用的 flag 必须在事件库闭合定义。

## 五、本机环境坑（实测 2026-10-23/24）

- node v24.15.0 / npm 11.12.1 / git 2.54.0.windows.1（Git Bash）。
- npm 默认 registry 直装成功（未配镜像）；**js-yaml 已到 v5**：只有具名导出 `load`，无默认导出（tests/ci-workflow.test.ts 已用 `import { load as loadYaml }`）。
- npm 装到的版本族：vite ^8 / vitest ^5 / typescript ^7（TS7 原生实现，`tsc --noEmit` 通过）。
- 本机直连 github.com 不通（推送对策见 plan/04 §风险）；无远端，CI 未实跑。
- dev server 验证后要停：`netstat -ano | grep :5173` 找 PID → `taskkill //F //PID <pid>`。
- Windows git 显示中文文件名为八进制转义属显示问题：用 `git -c core.quotepath=false status/log`。
- Mimosa 提交钩子提示：前两笔提交的库扫描未得出完整结论（library source 上限），按兼容策略放行——**不要对外宣称"项目已通过安全审计"**。
- （M1 新增）查证渠道实测：myersbriggs.org 直读被拒（403），16personalities 理论页为脚本渲染抓不到正文——MBTI 定义核对走英文维基百科条目（引注官方文献链），渠道已留 data/README.md。

## 六、DoD 逐项 checklist

M1（plan/00 §里程碑总表行）：
- [x] `npm run validate` 0 FAIL
- [x] 故意造错一条必须报红（门禁自检 4 组验红留痕，见 §一；复原后字节级一致）
- [x] 状态副本两处翻 M1 ✅ + 台账"出生环境四要素定盘"行翻 ✅
- [x] MBTI 维度定义原文核对（plan/01 §五三态翻转 + data/README 渠道留痕）
- [x] HANDOFF-M2 落盘（七节，本档）

M2 DoD（下一棒要达成的，来自 plan/00）：
- [ ] `npx vitest run` 全绿；同种子两次通关终局四维全等；回滚任一钳制逻辑对应测试必须变红（防回退自检）
- [ ] 状态副本两处翻 M2 ✅ + 台账"四维倾向值连续演化""同种子两次通关结果全等"两行翻 ✅
- [ ] HANDOFF-M3 落盘（七节）

## 七、关键命令速查（每条当轮实跑过）

```bash
node tools/check-sprint-layout.mjs          # 布局门（续接对话第一件事）
node tools/check-desensitized.mjs           # 脱敏门
npm run validate                            # 数据门（--count 加分母汇总；--full 开 M4 密度/字数门）
npm test                                    # vitest run
npm run typecheck                           # tsc --noEmit
git -c core.quotepath=false log --oneline   # 中文文件名可读的日志
```
