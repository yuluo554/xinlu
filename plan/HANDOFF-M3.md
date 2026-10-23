# HANDOFF-M3 · 第 3 棒交接单（M2 → M3）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档。
> 库内一律相对路径；会话启动命令由用户侧拼绝对路径。

## 一、当前进度 + 证据

- **M0 ✅、M1 ✅、M2 ✅（2026-10-24）**；M2 = 契约冻结点，plan/03 §2 引擎签名已冻结并注明日期。
- 证据（2026-10-24 当轮实测）：
  - 提交链：`85fd7e0`（plan 全套）→ `9e2ffd0`（装订 + M0）→ `cb643ad`（HANDOFF-M1）→ `c9b9fdd`（M1 交付）→ M2 交付提交（本交接单随该提交入库）。
  - 交付面：`src/engine/model.ts`（类型与枚举常量，数值口径零复写）+ `src/engine/engine.ts`（createRun / pickEvent / applyChoice / advanceStage / resolveEnding 五契约函数 + `seededDraw` 种子抽取原语 + `mbtiLetters` 字母判定，纯函数无 DOM 无存储）；`src/storage/storage.ts`（`xinlu.save.v1` 单 key load/save/clear + v1 严格校验 + 损坏兜底）。
  - `npx vitest run` **47/47 绿**（引擎 30 + 存档 9 + 既有 8）；`npm run typecheck` 0 错；`npm run validate` 0 FAIL；布局门/脱敏门全绿。
  - **可复现断言**：同 seed + 同选项序列双跑，全程每个状态快照 `JSON.stringify` 逐字段全等（全选 A / 全选 B / 哈希混合三种选择路径 × 2 个 seed）；**存档续局等价**：第 5 次选择后 save → load → 续跑，终态与不中断全程 `toEqual` 全等（存档 schema 无 RNG 字段仍可精确续流）。
  - **三方一致测试**：8 个条件结局各按其区间中值构造终态，`resolveEnding` 逐一命中，且 `mbtiLetters(实算) === typeText(数据)` 全等——数据 ↔ 口径 ↔ 引擎对齐点已钉进测试。
  - **防回退自检（两组变异验红留痕）**：A 回滚钳制（`clamp` 改直加）→「钳制上界/下界」2 测试红；B 种子抽取退化常量 →「随已决事件数变化」1 测试红；均复原后 sha256 字节级一致、全套复绿。变异未入库。
  - 配套：vitest include 扩至 `src/**/*.test.ts`（兑现 00 实物表"引擎/结局/存档单测在 src"承诺）；tsconfig 开 `resolveJsonModule`（引擎/存档直接导入 data JSON）；plan/03 §3 存档依赖行精确化为「2（类型）；1（birth-map 枚举仅作载入校验）」。

## 二、当前事实·状态不变量（下一棒动手前必须知道）

1. **plan/03 §2 契约已冻结（2026-10-24）**：改五函数任一签名 = 跨模块变更，须回改 plan/03 与测试。扩展行为请加新导出，不动既有签名。
2. **RunState 与存档 schema v1 内层同构**：`{seed, env, stageIndex, dims, history, flags}`；版本号 `v` 是存档信封字段，不属于 RunState。**存档里没有 RNG 状态字段**——context 抽取由 `seededDraw(seed, 已决事件数)` 无状态派生，这是可复现与续局等价的地基，改动前先读 plan/03 §2 冻结注记。
3. **stageIndex 语义**：0–7 = 八阶段；8 = 终局（advanceStage 从 elder 推入 8；8 上再推进抛错）。`pickEvent` 返回 null = 本阶段事件已取尽，调用方应 advanceStage。
4. **applyChoice 的待答事件由 pickEvent 重导出**（签名不含事件参数）——UI 卡片流渲染的事件必须来自当前 state 的 `pickEvent(state)`，不能拿旧卡片配新 state 调 applyChoice，否则 history/eventId 错位。
5. **字母判定**：`mbtiLetters(dims, env)`，当前值 =50 按出生初始值符号、初始值亦 50 取低侧字母（引擎裁定分支，测试已钉死）。**兜底结局无 `typeText`**——终局报告字母取 `ending.typeText ?? mbtiLetters(state.dims, state.env)`。
6. **存档损坏约定**：load() 对非法 JSON / 非 v1 / 任何形状违约返回 null，**且 localStorage 原文保留（绝不静默清档）**——M3 续局与 M5 损坏提示 UI 都依赖这一约定；"重新开始" = 显式调 clear()。校验是严格形（多余键也拒），save() 只写 schema 七字段，正常引擎态永远合法。
7. **storage 依赖边界**：仅 engine 类型 + birth-map 枚举（载入校验），不 import 引擎函数；UI 依赖 2、3、5 的方向不变。
8. K1–K10 全部继续生效（见 §四）；K6 存档 key 已实装（`xinlu.save.v1`）。
9. CI workflow 已入库但从未实跑（本机无远端）——一切"CI 绿"只能写"本地等价校验（待首推验证）"；不对外宣称"项目已通过安全审计"。

## 三、下一棒待办（M3 · 界面与可视化，任务块与验证命令见 plan/04 §M3）

1. 3.1 `src/viz/`：`renderRadar(dims, el)` 四轴手绘 SVG（含历史淡影）+ `renderCurve(history, el)` 四维演化曲线；零第三方图表库；冒烟断言渲染出 svg 节点；值域越界数据不产生 NaN 属性（单测）。
2. 3.2 `src/ui/` 四屏：开局屏（四要素选择 → `createRun`，四要素枚举从 birth-map 键读，勿在 UI 内联枚举清单）→ 卡片流（`pickEvent` / `applyChoice`，null 即 `advanceStage`）→ 阶段小结（advanceStage 后由 `history[].dimsAfter` 按阶段聚合）→ 终局报告（`resolveEnding` + 第 5 条字母口径）；重开 = `clear()` 回开局屏。
3. 存档接入：`createRun` 与每次 `applyChoice` / `advanceStage` 后 `save(state)`；启动时 `load()` 有档则续局；返回 null 且 key 存在 = 损坏 → 提示可重新开始（绝不静默清档）。
4. 3.3 设计规范落地：浅色、大留白、单一强调色、圆角卡片、轻动效；移动单列 / 桌面加宽；**375/768/1280px 手动清单全过并留痕（截图入 `docs/`）**。技能支援：`frontend-design` + `design-taste-frontend`。
5. 出口门：3.1–3.3 全过；一周目完整通关留痕。**纪律：视觉打磨不回炉引擎（2 已冻结）；不引入 UI 框架。**
6. 收尾顺序（skill 硬约束①）：DoD 验证 → plan/00 两处副本翻 M3 ✅ + 台账"双端响应式"行翻 ✅ → 写 HANDOFF-M4 → commit。

## 四、既定口径清单（K 编号；动了会打挂测试/门）

- **K1 口径单源**：数值口径只在 plan/02 定义一处；引擎/前端/测试/数据文件不得复写口径。
- **K2 零运行时依赖**：`dependencies` 空；守门测试在 tests/skeleton.test.ts。
- **K3 状态行 = 表格行**：状态格以状态符开头；plan/00 里程碑总表 + README 状态表两处副本同步翻。
- **K4 提交信息中文**，沿用「心路：」前缀。
- **K5 布局门判据只落仓库内文件**；门必须打印扫描计数（非空跑自证）。
- **K6 存档 key 口径**：`xinlu.save.v1`（已实装；schema v 变更则 key 同步变，旧 key 迁移后清理）。
- **K7 校验脚本入口名**：`npm run validate`（M1 已实装）。
- **K8 birth-map 合成口径**：初始值 = 中立值 50 + 四要素修正量之和；引擎**不**对初始值钳制（越界 = 数据错误，validate 拦）。
- **K9 数据门分阶段**：默认门常开（含骨架密度每阶段 ≥2）；`--full` 为 M4 出口门（密度矩阵 + 画像字数），届时 package.json validate 命令加 flag 同提交。
- **K10 flag/引用纪律**：flag 小写 kebab；`pre` 只许引用**更早事件**定义的 flag；endings 引用的 flag 必须在事件库闭合定义。**M4 补内容先立 flag 再引用。**
- **K11 契约冻结**（M2 新增）：plan/03 §2 引擎签名冻结；pickEvent 的 null 语义、applyChoice 重导出待答事件、seededDraw 无状态派生，三者是 M3 UI 必须适配的冻结事实。

## 五、本机环境坑（实测 2026-10-23/24）

- node v24.15.0 / npm 11.12.1 / git 2.54.0.windows.1（Git Bash）。
- npm 版本族：vite ^8 / vitest ^5 / typescript ^7（TS7 原生）；js-yaml v5 只有具名导出 `load`。
- **TS7 + bundler 解析下导入 JSON 需 `resolveJsonModule`（M2 已在 tsconfig 开启）**；引擎/存档经 `as unknown as` 收敛 JSON 推断类型。
- vitest `environment: "node"` 无 localStorage——存档测试用 `vi.stubGlobal("localStorage", 内存 stub)`（M2 已有范式，src/storage/storage.test.ts）。
- 本机直连 github.com 不通（推送对策见 plan/04 §风险）；无远端，CI 未实跑。
- **dev server 验证后要停**：`netstat -ano | grep :5173` 找 PID → `taskkill //F //PID <pid>`（M3 会高频起停 dev server）。
- Windows git 显示中文文件名为八进制转义属显示问题：用 `git -c core.quotepath=false status/log`。
- Mimosa 对历史提交的库扫描未得出完整结论——不要对外宣称"项目已通过安全审计"。
- MBTI 口径查证渠道留痕在 data/README.md（myersbriggs.org 403、16personalities 脚本渲染，走英文维基条目）。

## 六、DoD 逐项 checklist

M2（本棒已达成，plan/00 §里程碑总表行）：
- [x] `npx vitest run` 全绿（47/47）；同种子两次通关终局四维全等（三种选择路径双跑逐快照全等 + 存档续局等价）
- [x] 回滚钳制逻辑对应测试变红（防回退自检：钳制回滚 2 红、抽取退化 1 红，复原 sha256 一致后复绿）
- [x] 状态副本两处翻 M2 ✅ + 台账"四维倾向值连续演化""同种子两次通关结果全等"两行翻 ✅
- [x] plan/03 §2 契约冻结修订落盘
- [x] HANDOFF-M3 落盘（七节，本档）

M3 DoD（下一棒要达成的，来自 plan/00）：
- [ ] 375/768/1280px 手动清单全过并留痕（截图入 `docs/`）
- [ ] 一周目可完整玩通
- [ ] 状态副本两处翻 M3 ✅ + 台账"双端响应式"行翻 ✅
- [ ] HANDOFF-M4 落盘（七节）

## 七、关键命令速查（每条当轮实跑过）

```bash
node tools/check-sprint-layout.mjs          # 布局门（续接对话第一件事）
node tools/check-desensitized.mjs           # 脱敏门
npm run validate                            # 数据门（--count 加分母汇总；--full 开 M4 密度/字数门）
npm test                                    # vitest run（含 src/**/*.test.ts 引擎/存档测试）
npm run typecheck                           # tsc --noEmit
npm run dev                                 # M3 起停频繁，验证后记得杀进程（见 §五）
git -c core.quotepath=false log --oneline   # 中文文件名可读的日志
```
