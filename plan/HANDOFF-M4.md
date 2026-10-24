# HANDOFF-M4 · 第 4 棒交接单（M3 → M4）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档。
> 库内一律相对路径；会话启动命令由用户侧拼绝对路径。

## 一、当前进度 + 证据

- **M0 ✅、M1 ✅、M2 ✅、M3 ✅（2026-10-24）**；M3 = 界面与可视化 + 双端响应式，交付面全部落在 `src/ui/`、`src/viz/`、`src/style.css`。
- 证据（2026-10-24 当轮实测）：
  - 交付面：`src/viz/radar.ts`（`renderRadar(dims, el, past?)` 四轴手绘 SVG：ei 上/sn 右/tf 下/jp 左，0 在圆心 100 在外沿，past 为历史淡影虚线多边形）+ `src/viz/curve.ts`（`renderCurve(history, el, initial?)` 四维演化曲线，x = 抉择序）+ `src/viz/svg.ts`（`svgEl`/`sanitize`：非有限归中 50、越界钳制 [0,100]，杜绝 NaN 属性）。
  - `src/ui/app.ts`（六态路由 start/card/aftermath/summary/ending/corrupt + 存档接入）+ `src/ui/screens.ts`（四屏 HTML 装配，动态文本全 esc() 转义）+ `src/ui/logic.ts`（纯函数：阶段聚合 / 阶段起点四维 / 终局字母口径 / 关键抉择回顾）。
  - `npx vitest run` **67/67 绿**（引擎 30 + 引擎访问器 4 + 存档 11 + viz 6 + ui logic 8 + 既有 8）；`npm run typecheck` 0 错；`npm run validate` 0 FAIL；布局门/脱敏门全绿。
  - **三档留痕**：`docs/M3-手动清单.md`（判据 × 375/768/1280 全过）+ `docs/assets/m3-{375,768,1280}-{start,card,summary,ending}.png` 12 张 + 损坏提示 `m3-375-corrupt.png`。
  - **一周目完整通关留痕**：375/768/1280 三档各一次全程实点通关；375 档终局 ESFJ「灶台边的大管家」，雷达含 8 阶段起点淡影，关键抉择两条与所选项一致。
  - **续局与损坏兜底实测**：终局存档刷新回终局屏；`xinlu.save.v1` 写坏 → 损坏提示屏出现且原文逐字节保留 → 显式点「重新开始」才清档。
- 配套：`index.html` 加 theme-color 与内联 SVG favicon；`src/main.ts` 改为挂载 `mountApp`。

## 二、当前事实·状态不变量（下一棒动手前必须知道）

1. **plan/03 §2 引擎冻结五签名不变**；M3 新增三个只读访问器导出（`birthEnvOptions` / `initialDimsOf` / `eventById`）与 storage 的 `hasSaveKey()`，已回写 plan/03 §2/§3/§5。扩展行为继续走"加新导出"路线。
2. **history 没有阶段字段**（存档 schema v1 冻结）——阶段聚合一律 `eventById(eventId)?.stage` 反查派生（`src/ui/logic.ts`）。M4 补事件后这套派生自动生效，不要往存档里加阶段字段。
3. **UI 枚举纪律**：开局屏四要素枚举唯一来源是 `birthEnvOptions()`，UI 不内联清单（测试钉死与 birth-map 键全等）。同理 UI 不内联年龄段口径——卡片只展示事件自带 `ageHint`，阶段显示名在 `logic.ts STAGE_LABEL`（UI 文案，非口径）。
4. **pickEvent/applyChoice 适配**（K11）：UI 卡片事件永远来自当前 state 的 `pickEvent(state)`；应答后如有 aftermath 先渲染 aftermath 屏再推进；`pickEvent` 返回 null 即 `advanceStage`（8 = 终局）。改动事件调度逻辑前先读 plan/03 §2 冻结注记。
5. **viz DOM 面收窄**：只用 createElementNS/setAttribute/appendChild/textContent，单测靠最小桩（`src/viz/viz.test.ts`）。给 viz 加图形时保持这个面，桩才能继续工作；一切属性值必须经 `sanitize()`。
6. **存档约定不变**：load null 且 `hasSaveKey()` = 损坏 → 提示屏，绝不静默清档；save 在 createRun/每次 applyChoice/advanceStage 后调用（`app.ts persist()`，存储不可用时静默降级内存续玩）。
7. **K1–K11 全部继续生效**（见 §四）；K9 数据门 M4 出口要开 `--full`。
8. **IAB 验证工具坑**：内置浏览器截图有渲染节流（动画首帧截入）与 fullPage 拼接伪影，均为工具现象非页面缺陷——规避方法已写进 `docs/M3-手动清单.md` §四（等动画结束再截、用加高视口代替 fullPage）。
9. CI workflow 已入库但从未实跑（本机无远端）——一切"CI 绿"只能写"本地等价校验（待首推验证）"；不对外宣称"项目已通过安全审计"。

## 三、下一棒待办（M4 · 完整内容，任务块与验证命令见 plan/04 §M4）

1. 4.1 事件库补齐至 plan/02 §二密度矩阵：每阶段 main 4–6 / context ≥8 / critical ≥2；文案按 `key-moments`（重大抉择节拍）与 `character-arc`（各阶段人格弧）创作。**K10：flag 先立后引**（`pre` 只许引用更早事件定义的 flag；endings 引用的 flag 必须闭合）。`npm run validate` 全绿。
2. 4.2 endings ≥8 条件结局文案补全 + `portraits.json` 16 型画像全文（各 80–150 字，`endings` 技能纪律：终局完成弧光收束）。validate 全绿。
3. 4.3 dogfooding：≥3 条不同出生环境全通关实玩，记录各终局类型与轨迹截图（入 `docs/`）；**实际事件总数/结局数末态回填** plan/00 台账与 README 数字。
4. 出口门：`package.json` 的 validate 命令加 `--full` flag（K9：密度矩阵 + 画像字数门开启），与补内容同提交。
5. UI/引擎**不需要改**：密度上去后卡片流、小结、终局、曲线自动适配。若终局曲线线端标签重叠明显（观察项，`docs/M3-手动清单.md` §四.1），可在 viz 内做阶梯错排——只动 viz，不动契约。
6. 收尾顺序（skill 硬约束①）：DoD 验证 → plan/00 两处副本翻 M4 ✅ + 台账"8 阶段事件密度口径""多结局 ≥ 8"两行翻 ✅（含实际数回填）→ 写 HANDOFF-M5 → commit。

## 四、既定口径清单（K 编号；动了会打挂测试/门）

- **K1 口径单源**：数值口径只在 plan/02 定义一处；引擎/前端/测试/数据文件不得复写口径。
- **K2 零运行时依赖**：`dependencies` 空；守门测试在 tests/skeleton.test.ts。
- **K3 状态行 = 表格行**：状态格以状态符开头；plan/00 里程碑总表 + README 状态表两处副本同步翻。
- **K4 提交信息中文**，沿用「心路：」前缀。
- **K5 布局门判据只落仓库内文件**；门必须打印扫描计数（非空跑自证）。
- **K6 存档 key 口径**：`xinlu.save.v1`（已实装；schema v 变更则 key 同步变，旧 key 迁移后清理）。
- **K7 校验脚本入口名**：`npm run validate`（M1 已实装）。
- **K8 birth-map 合成口径**：初始值 = 中立值 50 + 四要素修正量之和；引擎不对初始值钳制（越界 = 数据错误，validate 拦）。
- **K9 数据门分阶段**：默认门常开（骨架密度每阶段 ≥2）；`--full` 为 M4 出口门（密度矩阵 + 画像字数），届时 package.json validate 命令加 flag 同提交。
- **K10 flag/引用纪律**：flag 小写 kebab；`pre` 只许引用**更早事件**定义的 flag；endings 引用的 flag 必须在事件库闭合定义。**M4 补内容先立 flag 再引用。**
- **K11 契约冻结**（M2）：plan/03 §2 引擎签名冻结；M3 的访问器扩展是唯一例外且已回写文档。

## 五、本机环境坑（实测 2026-10-23/24）

- node v24.15.0 / npm 11.12.1 / git 2.54.0.windows.1（Git Bash）。
- npm 版本族：vite ^8 / vitest ^5 / typescript ^7（TS7 原生）；js-yaml v5 只有具名导出 `load`。
- TS7 + bundler 解析下导入 JSON 需 `resolveJsonModule`（tsconfig 已开）；`noUncheckedIndexedAccess` 开着——索引访问要 `!` 或 `?.`（M3 两处编译错都源于此）。
- vitest `environment: "node"` 无 DOM：viz 测试用最小 SVG 桩 stub `document.createElementNS`（src/viz/viz.test.ts）；存档测试用内存 localStorage stub（src/storage/storage.test.ts）。
- 测试正则写 `/NaN/i` 会误中 SVG 属性 `dominant-baseline`（含 "nan"）——NaN 断言用大小写敏感 `/NaN|undefined/`。
- **dev server 验证后要停**：`netstat -ano | grep :5173` 找 PID → `taskkill //F //PID <pid>`（本次已照此收尾）。
- Windows git 显示中文文件名为八进制转义属显示问题：用 `git -c core.quotepath=false status/log`。
- IAB 截图：动画首帧截入 → 等动画结束重截；fullPage 拼接伪影 → 改用加高视口（最高 2160）。页面内 `element.click()`（evaluate）可用且可靠；高层 locator.click 在本机 IAB 偶发 3s 超时。
- 本机直连 github.com 不通（推送对策见 plan/04 §风险）；无远端，CI 未实跑。
- Mimosa 对历史提交的库扫描未得出完整结论——不要对外宣称"项目已通过安全审计"。
- MBTI 口径查证渠道留痕在 data/README.md（myersbriggs.org 403、16personalities 脚本渲染，走英文维基条目）。

## 六、DoD 逐项 checklist

M3（本棒已达成，plan/00 §里程碑总表行）：
- [x] 375/768/1280px 手动清单全过并留痕（docs/M3-手动清单.md + docs/assets/ 13 张截图）
- [x] 一周目可完整玩通（三档各一次全程实点通关 + 续局 + 损坏兜底实测）
- [x] 状态副本两处翻 M3 ✅ + 台账"双端响应式"行翻 ✅
- [x] HANDOFF-M4 落盘（七节，本档）

M4 DoD（下一棒要达成的，来自 plan/00）：
- [ ] `npm run validate` 全绿（`--full` 密度/字数门开启）
- [ ] ≥3 条不同出生环境全通关实玩留痕（入 docs/）
- [ ] 实际事件数/结局数回填 plan/00 台账与 README 数字
- [ ] 状态副本两处翻 M4 ✅ + 台账"8 阶段事件密度口径""多结局 ≥ 8"两行翻 ✅
- [ ] HANDOFF-M5 落盘（七节）

## 七、关键命令速查（每条当轮实跑过）

```bash
node tools/check-sprint-layout.mjs          # 布局门（续接对话第一件事）
node tools/check-desensitized.mjs           # 脱敏门
npm run validate                            # 数据门（--count 加分母汇总；--full 开 M4 密度/字数门）
npm test                                    # vitest run（67/67：引擎/存档/viz/ui logic/骨架/CI）
npm run typecheck                           # tsc --noEmit
npm run dev                                 # M4 补内容后实玩验证；用完记得杀进程（见 §五）
git -c core.quotepath=false log --oneline   # 中文文件名可读的日志
```
