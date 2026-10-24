# HANDOFF-M5 · 第 5 棒交接单（M4 → M5）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档。
> 库内一律相对路径；会话启动命令由用户侧拼绝对路径。

## 一、当前进度 + 证据

- **M0 ✅、M1 ✅、M2 ✅、M3 ✅、M4 ✅（2026-10-24）**；M4 = 完整内容：事件密度达标 + 多结局 + 画像文案 + dogfooding。
- 证据（2026-10-24 当轮实测）：
  - **事件库 112 条**（8 阶段 × main 4 / context 8 / critical 2，`npm run validate --count` 分母可对账）；**endings 8 条件 + 1 兜底**（文案全部弧光收束级扩写，cond 区间容差 48/52）；**portraits 16 型全文**（各 80–150 字，去空白后计数）。
  - `npm run validate`（**--full 已常开**：密度矩阵 + 画像字数门）0 FAIL；`npm test` **67/67 绿**；`npm run typecheck` 0 错；布局门/脱敏门全绿。
  - **变异自检双红复原绿**：删 1 条 critical → E.DENSITY 红；画像砍短 → P.LENGTH 红；复原后 0 FAIL。
  - **dogfooding 6 局全通关实玩**（IAB 375×812，逐卡实点）：ESFJ×3 / ISFJ×2 / ISTJ 三类终局；存档续局顺带验证。留痕 [docs/M4-dogfooding.md](../docs/M4-dogfooding.md) + `docs/assets/m4-*.png` 7 张。
  - **内容平衡调平**（dogfooding 驱动）：50 条事件 delta 按语义重配 + endings 区间 45/55→48/52；96 组引擎扫描从"仅 1 条件结局可达"提升到 **4 条件 + 兜底可达**；线性策略下 end-04/05/07/08 仍不可达 → **backlog B1**（已登记，证据齐全）。
- 配套：`package.json` validate 命令加 `--full`（K9 落地，与补内容同提交）；`plan/00` 台账两行 ✅ 含实际数回填；`plan/00` 与 `README.md` 两处状态副本翻 M4 ✅；backlog 队列启用。

## 二、当前事实·状态不变量（下一棒动手前必须知道）

1. **plan/03 §2 引擎冻结五签名不变**；M4 只动了数据面（events/endings/portraits）与 `engine.test.ts` 的 4 处骨架密度断言（改用 `historyOf()` 谓词构造，密度无关）+ 1 处 delta 断言（infant-001 选项 1 新值）。**测试不再硬编码"每阶段 2 条"假设，后续加事件无需再改测试**。
2. **endings cond 数值不是冻结口径**：plan/02 §四只冻结"每维一个 [low,high] 区间 + 首个命中 + 兜底末位"的结构；具体 48/52 是 M4 调平值，再调不需回改 plan/02。引擎 `resolveEnding`/测试的"区间中值可命中 + 字母全等"断言继续有效。
3. **事件 delta 与文案语义必须对位**（M4 调平的纪律）：N 向选项配 `sn` 负、T 向配 `tf` 负、P 向配 `jp` 负。改文案或加事件时保持这个对位，否则可达性观察项 B1 会恶化。
4. **history 无阶段字段**（存档 schema v1 冻结）不变；`pre` 只引用更早事件的 flag（K10）；flag 清单：rebel / conform / wanderlust / caretaker（childhood-012 立）/ craftsman（childhood-013 立）/ homebody（teen-011 立）。
5. **backlog 已启用**：B1 在队（⬜ 待排期），M5 若动内容平衡须先读 [docs/M4-dogfooding.md](../docs/M4-dogfooding.md) §四观察项，避免与 B1 撞车。
6. **存档约定不变**：`xinlu.save.v1` 损坏不清档；save 在 createRun/applyChoice/advanceStage 后调用。
7. **K1–K11 全部继续生效**（见 §四）。
8. CI workflow 已入库但从未实跑（本机无远端）——一切"CI 绿"只能写"本地等价校验（待首推验证）"；不对外宣称"项目已通过安全审计"。

## 三、下一棒待办（M5 · 打磨与门面，任务块与验证命令见 plan/04 §M5）

1. 5.1 体验打磨：轻动效打磨、空态、重开流补测；**存档损坏兜底 UI M3 已交付**（corrupt 屏），M5 只需把它纳入手动清单补测异常路径，不要重做。
2. 5.2 `README.md` 产品页改造：≤120 行；「30 秒跑起来」（线上地址 + 本地两条命令）≤30 行处；**人格模型依据表**（维度定义来源 + 查证状态，照 data/README.md 三态表）；已知限制照抄 01 §十；营销词零容忍。门清单：install_line≤30 / 有真实输出截图 / 无里程碑占首屏 / README 无 DoD 字样 / `DEVELOPMENT.md` 被链接。
3. 5.3 `DEVELOPMENT.md` 只做 plan/ 索引（不复制内容，防分叉）；`docs/assets/demo.gif` 录制（M4 的 6 局实玩流程可作素材）。
4. 数字门：README 出现"112 条事件 / 8+1 结局 / 16 型画像"时与 `npm run validate --count` 输出对账（06 §八类之 3）。
5. 出口门：`npm run build` 产出 `dist/index.html`；00 §提交材料实物表 8 项路径全部存在（M5 时点允许 dist 与 demo.gif 为 M5 新增，Pages 项仍 ⬜ 待 M6）。
6. 收尾顺序（skill 硬约束①）：DoD 验证 → plan/00 两处副本翻 M5 ✅ + 台账"演示 GIF"行翻 ✅ → 写 HANDOFF-M6 → commit。

## 四、既定口径清单（K 编号；动了会打挂测试/门）

- **K1 口径单源**：数值口径只在 plan/02 定义一处；引擎/前端/测试/数据文件不得复写口径。
- **K2 零运行时依赖**：`dependencies` 空；守门测试在 tests/skeleton.test.ts。
- **K3 状态行 = 表格行**：状态格以状态符开头；plan/00 里程碑总表 + README 状态表两处副本同步翻。
- **K4 提交信息中文**，沿用「心路：」前缀。
- **K5 布局门判据只落仓库内文件**；门必须打印扫描计数（非空跑自证）。
- **K6 存档 key 口径**：`xinlu.save.v1`（已实装；schema v 变更则 key 同步变，旧 key 迁移后清理）。
- **K7 校验脚本入口名**：`npm run validate`（M1 实装；**M4 起默认带 `--full`**）。
- **K8 birth-map 合成口径**：初始值 = 中立值 50 + 四要素修正量之和；引擎不对初始值钳制。
- **K9 数据门 --full 常开**（M4 落地）：密度矩阵 + 画像字数每跑必查。
- **K10 flag/引用纪律**：flag 小写 kebab；`pre` 只许引用更早事件定义的 flag；endings 引用的 flag 必须闭合。
- **K11 契约冻结**（M2）：plan/03 §2 引擎签名冻结；M3 访问器扩展与 M4 数据面替换是仅有的两处已回写文档的例外。

## 五、本机环境坑（实测 2026-10-23/24）

- node v24.15.0 / npm 11.12.1 / git 2.54.0.windows.1（Git Bash）。
- npm 版本族：vite ^8 / vitest ^5 / typescript ^7（TS7 原生）；js-yaml v5 只有具名导出 `load`。
- TS7 + bundler 解析下导入 JSON 需 `resolveJsonModule`（已开）；`noUncheckedIndexedAccess` 开着——索引访问要 `!` 或 `?.`。
- vitest `environment: "node"` 无 DOM：viz 测试用最小 SVG 桩、存档测试用内存 localStorage stub（套路在 src/viz/viz.test.ts / src/storage/storage.test.ts）。
- 测试正则写 `/NaN/i` 会误中 SVG 属性 `dominant-baseline`——NaN 断言用大小写敏感 `/NaN|undefined/`。
- **IAB 自动化实测（M4 新增）**：页面内 `setTimeout` 自驱动循环会被后台节流打断——**用同步 evaluate 循环**（`render()` 是同步 innerHTML 替换，单次 evaluate 里连续 `element.click()` 直到终局屏，几秒内跑完 112 卡）；高层 `locator.click` 偶发超时，`element.click()` 可靠；动画截图先 `waitForTimeout(1500)`；终局面是长页面，截图前先 `scrollTo(0,0)`；evaluate 的表达式必须是 `"(() => {...})()"` 形式（裸多语句会 SyntaxError）；页面 reload 会丢注入变量但游戏进度经存档恢复。
- dev server 验证后要停：`netstat -ano | grep :5173` 找 PID → `taskkill //F //PID <pid>`（本次已照此收尾）。
- Windows git 显示中文文件名为八进制转义：用 `git -c core.quotepath=false status/log`。
- 本机直连 github.com 不通（推送对策见 plan/04 §风险）；无远端，CI 未实跑。
- Mimosa 对历史提交的库扫描未得出完整结论——不要对外宣称"项目已通过安全审计"。
- MBTI 口径查证渠道留痕在 data/README.md。

## 六、DoD 逐项 checklist

M4（本棒已达成，plan/00 §里程碑总表行）：
- [x] `npm run validate` 全绿（--full 密度/字数门常开；变异自检双红复原绿）
- [x] ≥3 条不同出生环境全通关实玩留痕（6 局，docs/M4-dogfooding.md + 7 张截图）
- [x] 实际事件数/结局数回填 plan/00 台账与 README 数字（112 条 / 8+1 结局 / 16 画像）
- [x] 状态副本两处翻 M4 ✅ + 台账"8 阶段事件密度口径""多结局 ≥ 8"两行翻 ✅
- [x] HANDOFF-M5 落盘（七节，本档）

M5 DoD（下一棒要达成的，来自 plan/00）：
- [ ] README 门清单（04 §M5）逐项过（≤120 行 / 30 秒跑起来 ≤30 行 / 依据表 / 已知限制 / 无 DoD 字样）
- [ ] `DEVELOPMENT.md` 建立且被 README 链接；`docs/assets/demo.gif` 录制入册
- [ ] `npm run build` 产出 dist 且本地 preview 冒烟可玩
- [ ] 00 §提交材料实物表 8 项路径全部存在（Pages 项除外，待 M6）
- [ ] 状态副本两处翻 M5 ✅ + 台账"演示 GIF"行翻 ✅
- [ ] HANDOFF-M6 落盘（七节）

## 七、关键命令速查（每条当轮实跑过）

```bash
node tools/check-sprint-layout.mjs          # 布局门（续接对话第一件事）
node tools/check-desensitized.mjs           # 脱敏门
npm run validate                            # 数据门（--full 已常开）
npm run validate -- --count                 # 分母汇总（README/台账数字对账）
npm test                                    # vitest run（67/67）
npm run typecheck                           # tsc --noEmit
npm run dev                                 # 实玩验证；用完杀进程（见 §五）
npm run build && npm run preview            # M5 构建与冒烟
git -c core.quotepath=false log --oneline   # 中文文件名可读的日志
```
