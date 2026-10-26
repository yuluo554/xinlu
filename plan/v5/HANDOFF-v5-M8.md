# HANDOFF-v5-M8 · 运维期第三棒 → 运维期第四棒（无既定里程碑；文档面订正为主）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档 + [00-README总览.md](00-README总览.md)。
> 编号纪律（skill 硬约束①）：**交接单编号随棒顺延**——装订棒 HANDOFF-v5-M1、v5-M1'''' 棒 M2、v5-M2'''' 棒 M3、v5-M3'''' 棒 M4、v5-M4'''' 发布棒 M5、v5-M5 运维首查棒 M6、v5-M6 运维第二棒 M7、**本档为 v5-M7 运维第三棒收尾单（下一棒 = 运维期第四棒）**。
> 本档记录 **v5-M7 运维第三棒（2026-10-27）**：按 [HANDOFF-v5-M7](HANDOFF-v5-M7.md) §三 执行——周自查第二回（第 4+2 类合并复跑）+ 配图主观抽验（承接 SI-001）+ 观察区复评；**基线全量门禁复跑时扫出第 3 类真漂移（许可门数字 510→517）并订正**。§三.4（v6 方案腿）需用户单独明示，本棒未动。

## 一、当前进度 + 证据（2026-10-27 当轮实测）

| 块 | 动作 | 证据（当轮实跑） |
|---|---|---|
| 0 布局门 | 开工前 + 每笔改动后各跑一次 | 开工前 `node tools/check-sprint-layout.mjs` → **全绿**（10 条判据；`README 120/120`；`STATUS 2 处副本 × 19 里程碑一致`；`HANDOFFS 18 份齐`；`DOC_TOOLS 20 个`）。开工基线 = 工作树**干净**，`HEAD = origin/main = 6d3936b`（v5.0.1 收官已推） |
| 1 基线门禁全量复跑 | 确认发布态没漂 | validate **0 FAIL**（14 区 / 295 事件 / `S` 标签 21 类 + 图 55 张 + 覆盖 81.0% + 豁免 56）/ story 七项绿（主句 102·117·120）/ rhythm 绿 / **vitest 404**（37 文件）/ tsc 0 / budget **761.06KB** / desens 547 文件 0 命中 / scene-audit `✅ 非场景图标已清零`（死图 0）/ layout 全绿 / **e2e 双端绿**（单屏最长 158、触控最小边 44） |
| 2 第 4 类可复现性 | vitest 契约 + **跨进程**加强 | `engine.test.ts`「可复现契约」3 项绿（同 seed 同选项序列全程逐字段全等）；另做跨进程：临时探针（`tools/tmp-*.mjs`，**用完即删、未入库**）两次独立 `node` 进程跑 8 种子（2026 / 1730012345 / 7 / 99999 / 42 / 1 / 314159 / 271828）全 trace（240–247 状态）sha256 **逐字节全等** |
| 3 第 2 类平衡 | 可达性批扫 + **分布基线**（首次记录） | `node scripts/check-ending-reachability.mjs` → **9 结局全可达**（2496 组 = 96 环境 × 26 轴权重）；分布 end-06 **608** / end-01 388 / end-02 384 / end-08 384 / end-05 192 / end-07 192 / end-fallback 156 / end-03 96 / end-04 96 ⇒ 无支配（最高 24.4%）、最稀 3.8%、兜底 6.25% ⇒ **无过易** |
| 4 第 3 类文档漂移（**本轮唯一实质改动**） | 全仓对账 → 订正 9 处 | 许可门文档记 **510 件**，实测 **517 件**（差 +7）：上一棒只把「改前的 512」减了清仓 −2，**漏计同笔 SI-001 场景图净增 +7（+11 新 −4 删）**。取证：许可门脚本自 v3-M2'' 起未改（`git log -- tools/check-assets-license.mjs`）+ 逐 ref 计数 `512@9a731a7 → 517@2c37e84`。订正落 9 处（v5/00 台账 / v5/02 / v5/04 / assets/README / v5/backlog ×2 / HANDOFF-v5-M7 ×5 / CHANGELOG）+ [plan/05 §十一](../05-发布留档.md) 的 **tag 后追加栏**（tag 时点栏按「不得回写」保留原记） |
| 5 第 16 类配图主观抽验（§三.2） | 55 张总览目检 + 新四类 35 条逐条核 | 发现**机制性错配**：变体取图按事件 id 哈希高位取模，同标签的异质变体必落到语义不对的事件 → `pet` 5/7 条猫图（狗/兔/鸽全配猫）、`media`「看电视」配 radio、「收音机」配 tv、`music`「吉他」配琴键、「电子琴」配话筒。**机检面仍 0 错配**（非 keyTag 问题）⇒ 观察区**新增一行**（附最小改法），触发待明示 |
| 6 观察区 / 其余复评 | 逐项 | 外部反馈仍 0（views 0 / clones 202 未进发布 +7 天窗口 / stars·forks·watchers 0 / issues 空）；单屏余量 e2e 复跑仍 **158**；56 条豁免与 `docs/v5-scenes.md` §三一致 |
| 7 台账与收尾 | backlog + 本档 | [backlog](backlog.md)：头部状态行更新 + 观察区 **+1 项**（新四类变体语义异质性）+ 第 6/15 行补 v5-M7 复评 + 新增「本周自查（2026-10-27）」记录；本档（新）七节齐 |

**本轮改动清单（工作树，未提交；全部为文档面）**：

| 文件 | 性质 |
|---|---|
| `CHANGELOG.md` | v5.0.1 节：许可门数字 510 → **517**（含订正说明） |
| `assets/README.md` | 纹理节机检行：跟踪图像 512 → 510 改为 **512 → 517**（含订正说明） |
| `plan/05-发布留档.md` | §十一 **tag 后追加事实**栏新增「文档数字漂移订正」一条（tag 时点栏不动） |
| `plan/v5/00-README总览.md` | 决策记录 v5-M6 行：许可门数字订正 517（含口径/取证） |
| `plan/v5/02-数据与口径.md` | §十三 纹理素材处置行：512 → 517 订正 |
| `plan/v5/04-里程碑任务分解.md` | 运维期第二棒结果：SI-002 行数字订正 |
| `plan/v5/backlog.md` | 头部状态行 + 观察区新行 + 两行补复评 + 新增周自查记录（第 3/4/2/16 类四项发现） |
| `plan/v5/HANDOFF-v5-M7.md` | 上一棒 5 处数字就地订正（标注「2026-10-27 订正」） |
| `plan/v5/HANDOFF-v5-M8.md`（新） | 本档（第三棒收尾单 → 运维期第四棒入棒单，七节） |

> **无 `src/` 与 `tests/` 改动** ⇒ 不触发版本规则（判定核零改动、事件数/文本口径/存档 schema 全不变），**不发新版本**。

## 二、当前事实·状态不变量（下一棒动手前必须知道）

1. **项目在运维期，无既定里程碑**：维护动力 = 可度量缺口（plan/06 总原则：**没有缺口时正确动作是不动**）。周自查 30 分钟轮转十六类。
2. **v5.0.1 已发布**（tag @ `2c37e84`，Release + dist.zip sha256 复核一致）；**tag 之后不改代码面**。**本棒（v5-M7）只改文档**，故**不升版本**。
3. **队列仍为空**（SI-001 / SI-002 均已关闭）；**观察区 15 项**（原 14 + 本棒新增「新四类变体语义异质性」1 项）。**没有用户明示就不开工**。
4. **配图终值不变（v5.0.1 起）**：**55 张 / 21 类**、覆盖 **239/295 = 81.0%**、豁免 **56 条**。改配图三步见 [HANDOFF-v5-M7 §二.4](HANDOFF-v5-M7.md)。
5. **配图变体取图 = 事件 id 哈希高位取模**（`src/ui/scenes.ts` 的 `variantIndex`，取 `hash >>> 16`）：这是为「同类分散不撞一张」而立的口径（[02 §十四](02-数据与口径.md)），**副作用 = 同标签的异质变体会落到语义不对的事件**（见 §一 行 5 与观察区新行）。改它要连带看 `scenes.test.ts` 的「无死图 / 每类 ≥2 张」判据与覆盖率门线（≥60%）。
6. **错配棘轮仍 0/0**（`tests/scene-misfits.test.ts`）：黑名单（`tools/v5-scene-misfits.mjs` 的 `OFF_SCENE`，13 键）里任一键回流 `keyTag` 即判红；**别改成 `<=` 宽容式**，也别删——阳性对照那一条就是防它静默失效的。
7. **单屏余量仍只有 2 字**：`elder-012` 正文 118 + 选项 40 = **158**（E2E 上限 160）；本棒 e2e 复跑仍 158（375/1280 同值）。**不许抬 160 线**。
8. **字数台账两个判据面**：`S.LEN2` 印 **102/117**（255 条 = 243 瘦身卡 + 12 线索解锁事件）；其中 243 条口径是 **104/118**。写台账必须标判据面。
9. **四个机检入口**：`tests/scene-misfits.test.ts`（错配棘轮，判红）/ `node tools/v5-scene-audit.mjs`（配图语义回归哨兵，只读恒 0）/ `node tools/v5-scenes-sheet.mjs`（总览图重生成）/ **`npm run e2e`（双端，含触控 ≥44px 与 L1 行宽 ≤34 字断言，判红）**。注意：**e2e 不在 CI 里**（CI 无浏览器：layout 两门 + typecheck / validate / validate:story / validate:rhythm / vitest）——触控断言只在本地跑得到。
10. **Traffic 下一回 ≈ 2026-11-02**（发布 +7 天，第一次有意义的 v5 回访）：`gh api repos/<user>/<repo>/traffic/views|clones`；基线 views **0** / clones **202**（14 天窗口累计，**非当日新增**；窗口仍止于 10-25，尚未吞进发布时间，故本棒复核值未变）。
11. **远端状态**：origin/main = `6d3936b`（v5.0.1 收官）；**本棒改动尚未提交/推送**（纯文档面）。tag v5.0.1 已推；Pages / Release 均为 v5.0.1。
12. **文档数字会反复漂移，且「重跑门」是唯一可靠取证**：本棒实测许可门 **510 记错 → 517**——教训 = **统计数别拿「改前的值」做减法/手算**，一律重跑门取实测（记 [backlog](backlog.md) 周自查 2026-10-27 发现 3 与 §五 环境坑）。
13. **「口径有、机检无」的坑要主动查**（沿上一棒）：凡交接单写「E2E 的 X 断言已覆盖 YYY」，先在 `tests/e2e/smoke.mjs` 里 grep 那个判据再信。

## 三、下一棒待办（运维期第四棒，无里程碑）

> 没有用户明示就不开工：**运维期的正确动作多数时候是不动**。下列按优先级排：

1. **周自查第三回（≈ 2026-11-02/03，30 分钟）**：**Traffic 发布 +7 天回访**（首次有效观测；基线 views 0 / clones 202）+ 轮转**第 5 类「输入鲁棒性」**（损坏存档 / 极端选项序列 / 清空 localStorage 中途）**或第 6 类「dogfooding」**（轮玩全结局记录体验断点）。第 4/2/3/8/16 类已在本棒或上一棒跑过。
2. **观察区新行「新四类变体语义异质性」**（本棒登记）：待用户明示。转做时**最小改法** = 给 `pet`/`media`/`music`/`toy` 建 `objectKey → 变体` 显式表（比「一事件一图」便宜得多）；**不得**改「一图多事件」对外口径与覆盖率门线，也不得把变体降到每类 1 张。
3. **观察区复评（15 项）**：到期可查项——`出生证明卡 375px 滚动`（前提已机检坐实，待反馈）、`56 条豁免`（本轮复算一致）、`自产线稿上限`（已重画过一轮）。
4. **可选**：v6 方案腿（用户明示后启动；先写方案文档沿 `plan/07–10` 先例 + 装订 `plan/v6/` 套件 + 布局门 `LEG_CONFIG` 加一行 + `WIRED_LEGS`）。

## 四、既定口径（已拍板，别再问；推翻须进 `v5/00` 决策记录）

- **判定核零改动（K11）**：三观传导 / 结局 / 调度单调 / 种子复现全部不动；任何棒都不得带判定改动。
- **零运行时依赖（K2）**：`dependencies` 恒空。配图是静态 SVG（`?raw` 内联），图谱是手绘 SVG。
- **存档 schema 沿用 v3**（`xinlu.save.v3`）：不升版本、不加字段。
- **文本口径**：主句 ≤120 / 选项 ≤10 字（中位）/ ≥20 字 ≤10% / 每题 2–3 / **单屏 ≤160（当前 158，余量 2）**；原文进 `detail`，内容零损失。
- **卡片三层与触控**：L1 行宽 ≤34 字；**L2 触控 ≥44px（机检 = E2E 双端控件最小边断言）**；L3 状态条默认折叠、读数节点不删。
- **配图路线**：自产 CC0 线稿 SVG（**55 张 / 21 类**，v5.0.1 起）已冻结；**覆盖率门线 = ≥60%**；**归属判据** = 图标必须是「该类场景（或场景里的核心物件）」，抽象符号不得硬凑；**一图多事件（不承诺每事件独有）**；**变体取图 = 事件 id 哈希高位取模**（副作用已登记观察区）。
- **素材台账**：`assets/README.md` 是许可/溯源单源；**清仓不删台账文本**（可追溯靠文本，不靠二进制）。
- **图谱默认 tree / ring 可切**；节点详情从 history 回查，不新增 bond 日志字段。
- **主题四款继续有效**（素纸默认；`--tex-wash: 0` 是机检事实，纹理素材已清出但仍不得再引用）。
- **版本规则**：判定/口径变化 → 主版本；新增事件/结局 → 次版本；**呈现面补丁（如配图修复）→ 补丁 + CHANGELOG 声明存档是否需重开**；**纯文档订正 → 不发版**（本棒即此例）。
- **发布纪律**：不虚报；tag 后不改代码面；Release 五部分 + dist.zip + sha256 复核一致；**发布留档双栏（tag 时点不得回写，订正记 tag 后追加栏）**。

## 五、环境坑（实测在案，沿 HANDOFF-v5-M7 增补）

- **统计数字别手算、别拿「改前的值」做减法**（本棒踩到）：许可门跟踪图像上一棒记 510，实为 517——只把改前的 512 减了清仓 −2，漏掉**同一笔** SI-001 的场景图净增 +7。**正解**：任何统计段落改动后**重跑门取实测**（`npm run gate:license` 印 517），别推算。漂移一旦发现，活文档就地订正、发布留档记 tag 后追加栏。
- **许可门计数的口径陷阱**：门脚本用 `git ls-files -z`（原始字节名）。若用**不带 `-z`** 的 `git ls-files | grep` 计数，含中文名（`assets/web-ready/dafeiyu-pet/侧面*.webp` 等 **11 件**）会被 git 加引号转义而**漏配**，数出来是 **506** 而不是 517——别拿它当口径。
- **`git checkout -- docs/assets/` 会把留痕图一起回滚**（沿上一棒）：`npm run e2e` 会改写 **19 张**截图（`e2e-smoke-{375,1280}` / `share-card-{375,1280}` / `v2m2-mascot*` 4 张 / `v2m4-gallery-{375,1280}` / `v5-relations-{tree,ring}-{375,1280}` / `v5-start-step{2,3}-375` / `v5-theme-{paper,night,celadon}-375`），但 `docs/assets/` 下**也有不该动的留痕图**（如 `v5-scenes-sheet.png`）。跑完 e2e 复原要**逐文件点**，别整目录。
- **e2e 的卡数与截图名随「当天日期」变**：分享卡名含 `YYYYMMDD`（种子派生），故卡数/截图内容每次不同——**那些 churn 不提交**（复原即可）。
- **跨进程复现探针写法**（本棒实测可用）：node 24 可直接 `await import(pathToFileURL("src/engine/engine.ts").href)`（类型剥离），无需 vitest；`import.meta.dirname` 可用。跑两次比 `diff` 即可。**探针用完立刻删**（本棒 1 个跨进程探针已删、未入库）。
- **`tools/tmp-mutate-v5m{1,2,3}.mjs` 是有意留档**（HANDOFF-v5-M2/M3 明写「名字带 tmp 是有意的，可复跑」），**不是**该删的临时探针。
- **本机直连 github.com 不通**：push 一律 SSH:22；仓库/Pages/Release 操作走 `gh` API（HTTPS 通）。
- **脱敏门红线**：入库文件与提交信息不得写本机盘符 / 用户名 / 回环代理端口；示例路径用 `<user>`/`<repo>` 占位符。
- **`gh` 是原生程序，不认 `/tmp` 与 Git Bash 路径**：`--notes-file` / 附件参数要传 `cygpath -w` 转过的 Windows 路径。
- **写源码/测试要用 Write/Edit**：hook 拦「Bash 直接写 `src/`」，也拦向 `tests/` 的 Bash 写入。
- **`npm run e2e` ≈60–90s**（build + preview + Edge headless）；`npx vitest run` ≈30–40s（可达性三项各 ~30s 取最大）；`node scripts/check-ending-reachability.mjs` ≈20–30s。
- **`python` 是 Store 占位符**（exit 49 零输出）：用 `py` 或 node。

## 六、DoD（v5-M7 运维第三棒 · 运维期无里程碑口径）

> 单源 = [00 §里程碑总表](00-README总览.md)（本棒无里程碑行，运维期入口见 [04 §运维期 ▸ 第二棒结果](04-里程碑任务分解.md)）；本档自定 DoD 如下。

- [x] 布局门开工前 + 收尾各跑一次，全绿
- [x] 基线门禁全量复跑（validate / story / rhythm / typecheck / license / budget / desens / layout / scene-audit / vitest / e2e）全绿
- [x] 第 4 类可复现性：vitest 契约 3 项 + **跨进程 8 种子全 trace sha256 全等**
- [x] 第 2 类平衡：9 结局全可达 + **分布基线（首次记录，无支配/无过易）**
- [x] 第 3 类文档数字漂移：许可门 510 → **517** 订正 **9 处** + 发布留档记 tag 后追加栏 + 取证可复现
- [x] 第 16 类配图主观抽验：新四类 35 条逐条核 + 观察区**新增 1 行**（含最小改法）
- [x] 观察区复评（可查项出结论）；其余项外部反馈仍 0
- [x] Traffic 复核（未到期，记基线）
- [x] backlog 周自查记录新增（第 4/2/3/16 类四项发现）
- [x] **本轮无 `src/` 与 `tests/` 改动** ⇒ 不触发版本规则、不发新版本
- [x] **每条发现带可复现证据**（命令 + 输出，见 §一 表与 backlog 周自查记录）
- [x] 布局门在收尾改动后仍全绿
- [x] 本档七节齐

**验证记录（本棒当轮实跑，2026-10-27）**：

| 命令 | 结果 |
|---|---|
| `node tools/check-sprint-layout.mjs` | **全绿**（10 条判据；`README 120/120`；`STATUS 2 处 × 19 里程碑一致`；`HANDOFFS 18 份齐`；`DOC_TOOLS 20 个`） |
| `npm run validate` | **0 FAIL**（14 区；295 事件 / 图标 295-295 / `F` / `C` / **`S` 标签 21 类 + 图 55 张 + 覆盖 81.0% + 豁免 56 条**） |
| `npm run validate:story` | **七项全绿**（主句 102/117/120；选项 8/16/0%；detail 缺 0；单屏 >160 = 0） |
| `npm run validate:rhythm` | **绿**（8 局 × 8 阶段；非 critical 连片 ≤3） |
| `npx vitest run` | **404/404**（37 文件） |
| `npx tsc --noEmit` | 0 错 |
| `npm run build` + `npm run gate:budget` | 31 件；gzip **761.06KB ≤ 850KB**，0 WARN |
| `npm run e2e` | **双端全绿**（375：261 卡 ENFJ / 1280：255 卡 ESFJ，卡数随当日种子派生；单屏最长 **158**；**触控≥44px(最小44)** 双端；19 张截图 churn 已**逐文件复原**） |
| `node scripts/check-ending-reachability.mjs` | **9 结局全可达**（2496 组）；分布见 §一 行 3 |
| `node tools/v5-scene-audit.mjs` | `✅ 非场景图标已清零`（错配键 0 / 命中事件 0）；死图 0 |
| 跨进程复现探针（临时，已删） | 8 种子 × 全 trace sha256 **两次独立进程逐字节全等** |
| `npm run gate:license` | 0 FAIL（**517 件**；本棒实测——文档原记 510 有误，已订正 9 处） |
| `node tools/check-desensitized.mjs` | 547 文件，0 命中（豁免 1 份） |
| `gh api …/traffic/{views,clones}` + repo + issues | views **0** / clones **202**（unique 60，窗口 10-12～10-25）/ stars·forks·watchers 0 / issues 空 |
| 数字取证 | `git ls-tree -r -z --name-only {9a731a7,2c37e84,6d3936b}` 过滤图像扩展名 → **512 / 517 / 517**（许可门脚本自 v3-M2'' 未改） |

## 七、命令速查

```bash
node tools/check-sprint-layout.mjs   # 布局门（= npm run gate:layout）
node tools/check-desensitized.mjs    # 脱敏门（= npm run gate:desens）
npm run validate                     # 数据门（14 区；F 槽位 / C 线索 / S 配图）
npm run validate:story               # 文本长度 + 写实机检七项（判据面 255 条）
npm run validate:rhythm              # 节奏门（每阶段变体 ≥3）
npm test                             # vitest（v5.0.1 后基线 404）
node scripts/check-ending-reachability.mjs   # 结局可达性批扫（2496 组；含分布）
npx vitest run tests/scene-misfits.test.ts      # 配图错配棘轮（快照 0/0；会判红）
npx vitest run src/ui/scenes.test.ts            # 取图稳定 / 无死图 / 覆盖复算
npm run typecheck                    # tsc --noEmit
npm run build                        # 构建（dist/）
npm run e2e                          # E2E 全量（双端 + 768 + v5 开局四步；含触控 ≥44px；会改写 docs/assets 19 张截图——复原别整目录回滚，见 §五）
node tests/e2e/smoke.mjs --no-build --base-url <url>   # 发布冒烟（干净静态服务 / 线上 Pages 同口径）
node tools/v5-scene-audit.mjs        # 配图语义回归哨兵（只读，退出码恒 0）
node tools/v5-gen-scenes.mjs         # 画稿 → assets/web-ready/scenes/*.svg（改画法后跑）
node tools/v5-gen-scene-map.mjs      # 映射 → src/data/scene-map.json（改 KEY_TAG/VARIANTS 后跑）
node tools/v5-scenes-doc.mjs         # 重生 docs/v5-scenes.md（改映射后必跑）
node tools/v5-scenes-sheet.mjs       # 重生 docs/assets/v5-scenes-sheet.png（图库变动后跑）
npm run gate:license                 # 许可门（实测 517 件跟踪图像；计数口径 = git ls-files -z，见 §五）
npm run gate:budget                  # 预算门（850KB 线；实测 761.06KB）
gh api repos/<user>/<repo>/traffic/views   # Traffic 周记（clones 同路径；下一回 ≈ 2026-11-02）
gh release view v5.0.1               # Release 核对
```
