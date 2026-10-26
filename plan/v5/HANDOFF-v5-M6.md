# HANDOFF-v5-M6 · v5-M5 运维首查 → 运维期第二棒（无既定里程碑）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档 + [00-README总览.md](00-README总览.md)。
> 编号纪律（skill 硬约束①）：**交接单编号随棒顺延**——装订棒 HANDOFF-v5-M1、v5-M1'''' 棒 M2、v5-M2'''' 棒 M3、v5-M3'''' 棒 M4、v5-M4'''' 发布棒 M5、**本档为 v5-M5 运维首查棒的收尾单（下一棒 = 运维期第二棒）**。
> 本档记录 **v5-M5 运维期首查（2026-10-26）**：v5.0.0 发布后第一次运维轮转，无里程碑、无发版，只做轮转与缺口入队。

## 一、当前进度 + 证据（2026-10-26 当轮实测）

| 块 | 动作 | 证据（当轮实跑） |
|---|---|---|
| 0 布局门 | 开工前 + 每笔改动后各跑一次 | `node tools/check-sprint-layout.mjs` → **全绿**（10 条判据；`DOC_TOOLS 19 个脚本全部在位`；`README 120/120`；`STATUS 2 处副本 × 19 里程碑一致无缺行`；`HANDOFFS 18 份齐`）。基线代码态 = `66556c8`（v5-M4'''' 收官提交），工作树干净 |
| 1 全量门禁复跑 | 确认发布态没漂 | `validate` 0 FAIL（14 区 / 295 事件）/ `validate:story` 七项绿（255 条；主句 102·117·120）/ `validate:rhythm` 绿 / `tsc --noEmit` 0 错 / `gate:license` 0 FAIL（512 件）/ `gate:desens` 539 文件 0 命中 / `gate:budget` 31 件 **760.43KB ≤ 850KB** 0 WARN / `npm run e2e` **全绿**（375+1280 双端一键通关 252/250 张卡、单屏最长 158、768 中档、v5 自定义出生全流程） |
| 2 Traffic 周记 | `gh api repos/<user>/<repo>/traffic/{views,clones}` + issues + repo | views **0**（14 天全零）/ clones **202**（unique 60；14 天窗口含 10-24 的 168 与 10-25 的 34，**非当日新增**）/ stars 0 / forks 0 / watchers 0 / open issues 0 / `gh issue list --state all` 空 / `pushed_at` 2026-10-26T13:48:51Z |
| 3 第 15 类 阅读节奏漂移 | 长度门复跑 + 单屏字数实算（与 E2E 同口径：`text` + 全部 `options[].text`） | **无漂移**：主句 102/117/120、选项 8/16/0%、detail 缺 0、单屏 >160 = 0。单屏分布 中位 **122** / P90 **143** / 最长 **158**（`elder-012`）→ **余量 2 字**；≥148 的 11 条已实名入观察区 |
| 4 第 15 类 口径漂移（**已修**） | 台账「104/118」vs 门印「102/117」对账 | **不是回涨，是判据面不同**：104/118 = 243 条瘦身卡；102/117 = 门的 255 条（+12 条线索解锁事件，v5-M3'''' 新增、未参与瘦身）。已在 [02 §四](02-数据与口径.md) 加判据面注 + [00 台账行](00-README总览.md) 改写 + [06 §16 后](06-运维节奏.md) 记坑 |
| 5 第 16 类 配图语义漂移 | 新建只读审计工具并跑 | `node tools/v5-scene-audit.mjs` → 图库 48 张全用到（死图 0）/ 19 类 / 覆盖 253-295 = 85.8% / 豁免 42；**非场景图标混入 keyTag：38 键 / 52 条事件 = 17.6%**（四组：funeral 6 键/6 条、night 4 键/4 条、meal 3 键/4 条、study 25 键/38 条）→ **入队 SI-001** |
| 6 配图回访（季度项，与首查合并） | 20 张抽验 + 复用统计 + 42 条豁免复算 | 复用 top5：`study-lamp 26×` / `study-books 17×` / `study-writing 15×` / `hospital-ward 11×` / `outdoors-road 9×`（前三全在 study —— 与 SI-001 同源）；42 条豁免逐条复算与 `docs/v5-scenes.md` §三**完全一致**（42/42） |
| 7 文档手写数漂移（**已修**） | `docs/v5-scenes.md` §三「豁免构成」段 | 原手写「`heart-*` 系 **12** 个」实测豁免里只有 **7** 条（另 5 个 `heart-organ`/`heart-battery`/`heart-bottle`/`broken-heart`/`shattered-heart` 早已映射到 hospital/funeral）；同段把 `crossroad`/`despair` 列为「豁免」而它们也被映射走。**改为从数据实算**（`tools/v5-scenes-doc.mjs` 生成），并把错配数写进同节 |
| 8 防回退（skill 总原则三） | 新增棘轮测试 | `tests/scene-misfits.test.ts` **4 项**：清单无重复键 / 错配键数 = 快照 38 / 错配事件数 ≤ 52 / 棘轮非空跑。**验红实测**：把 `sunrise` 从清单删掉 → 立刻红（`实测 37 个 ≠ 快照 38`），复原后绿 —— 判据「改动回滚，测试会不会变红」= 会 |
| 9 基线更新 | vitest 计数 | **399 → 403**（37 文件，+4 = `scene-misfits.test.ts`）；~25s |

**本轮改动清单（工作树，未提交）**：

| 文件 | 性质 |
|---|---|
| `tools/v5-scene-audit.mjs`（新） | 只读审计（人读 + `--json`），退出码恒 0 |
| `tools/v5-scene-misfits.mjs` + `.d.mts`（新） | 错配清单单源 + 两级处置口径（两份消费者共用） |
| `tests/scene-misfits.test.ts`（新） | 棘轮测试（4 项，已验红） |
| `tools/v5-scenes-doc.mjs` | §三「豁免构成」改实算 + 错配数写进留痕 |
| `docs/v5-scenes.md` | 重新生成（197 行；§三 三行表 + ⚠ 错配段） |
| `plan/v5/backlog.md` | 队列 +SI-001（含证据格与两级处置）+ 观察区 +1（单屏余量实名单）+ 周自查记录（首查全记录） |
| `plan/v5/00-README总览.md` | backlog 行「队列空 + 观察区 13 项」→「队列 1 项 + 观察区 15 项」；台账「正文中位」行补判据面 |
| `plan/v5/02-数据与口径.md` | §四 瘦身终值加「判据面说明」 |
| `plan/v5/06-运维节奏.md` | 第 15/16 类查法补机检命令；配图回访加「机检先行」；记判据面坑 |
| `plan/v5/04-里程碑任务分解.md` | 运维期入口（无里程碑的日常口径）+ 首查棒结果节 |
| `plan/v5/HANDOFF-v5-M6.md`（新） | 本档（首查棒收尾单 → 运维期第二棒入棒单，七节） |

> **入库前补记（运维期第二棒代提，2026-10-26）**：本表原缺 `plan/v5/04` 一行、`docs/v5-scenes.md` 行数记为 198（实测 197，`wc -l` + 生成器重跑 md5 不变）——两处已订正；本棒改动未提交，故随本表一同入库，未动任何历史提交。

## 二、当前事实·状态不变量（下一棒动手前必须知道）

1. **项目在运维期，无既定里程碑**：维护动力 = 可度量缺口（plan/06 总原则：**没有缺口时正确动作是不动**）。周自查 30 分钟轮转十六类。
2. **v5.0.0 已发布，tag 之后不改代码面**：本轮 9 项改动**全部落在文档 / 工具 / 测试**，`git diff src/` 为空（已核）。任何后续代码改动都要进新提交、走版本规则（文本口径或判定呈现变化 → 主版本 +1 + 重开声明）。
3. **队列里唯一一项 = SI-001（配图语义错配）**：影响 2 / 成本 2h，得分 2×1÷2 = **1.0 < 2** → 按 v1 plan/06 评分表「< 2 记着不做」。**但它触的是 v5 主轴（图说同一件事），且用户可能直接点名**——若用户说「修配图」，按 `tools/v5-scene-misfits.mjs` 的 `OFF_SCENE_TIER` 分两级做：
   - 一级（funeral / night / meal 三组，14 条）→ 覆盖 81.0%、豁免 56，仍过 ≥60% 门；
   - 二级（study 的宠物/器材组，38 条）→ 覆盖 68.1%、豁免 94，也过门。更优解是给这批补 3–5 张新图（`home`/`outdoors` 复用即可），覆盖率只掉一点。
   **改完必须**：重跑 `tools/v5-scenes-doc.mjs`（否则留痕表过期）→ 把 `tests/scene-misfits.test.ts` 的 `SNAPSHOT` 改成新值 → 同步 README:60 / plan/05 §十 / docs/v5-scenes.md 的「85.8% / 42 条」→ SI-001 标 ✅。
4. **单屏余量只剩 2 字**（`elder-012` = 正文 118 + 选项 40 = 158，E2E 上限 160）：任何加字的文案改动前先看 backlog 观察区那张 ≥148 的 11 条清单；**不许抬 160 线**。
5. **字数台账有两个判据面**：`S.LEN2` 印 **102/117/120**（255 条 = 243 瘦身卡 + 12 线索解锁事件）；243 条口径是 **104/118/120**。写任何台账/文档都必须标判据面，否则下一棒会把它当漂移（本轮踩过）。
6. **新增两条门，命令速查也加了**：`node tools/v5-scene-audit.mjs`（配图语义，只读不判红）、`npx vitest run tests/scene-misfits.test.ts`（棘轮，判红）。**注意**：审计工具退出码恒 0（不阻断 CI），棘轮测试会阻断。
7. **棘轮的上限是快照制不是 0**：`SNAPSHOT.keys = 38` / `SNAPSHOT.events = 52`。**改小 = 修了一部分**；改到 `keys: 0` = SI-001 全修完。别把它改成 `<=` 宽容式，那会让缺口沉默回涨。
8. **配图纪律不变**（v5/02 §十四）：映射单源 = `scene-map.json` 的 `keyTag`；变体取图用事件 id 哈希高位（`>>> 16`）；改映射要重跑 `v5-scenes-doc.mjs`。
9. **Traffic 首查已做，下一回 ≈ 2026-11-02**（发布 +7 天）：`gh api repos/<user>/<repo>/traffic/views|clones`。当前基线 views 0 / clones 202（unique 60，14 天窗口累计，**非当日新增**）。
10. **远端状态**：origin/main = `66556c8`；tag v5.0.0 已推；Pages 线上 = `ea2a783` 构建；本轮改动**尚未提交**（见 §一 改动清单）。
11. **文档数字漂移会反复出现**：本轮抓到两处（判据面 + `heart-*` 12→7），都是「手写的分类说明随数据变旧」。**凡是「统计数据 + 分类说明」的段落，一律改成脚本实算**（`v5-scenes-doc.mjs` 已是这种形态），别手抄。

## 三、下一棒待办（运维期第二棒，无里程碑）

> 没有用户明示就不开工：**运维期的正确动作多数时候是不动**。下列按优先级排：

1. **（若用户点名）修 SI-001**：见 §二.3 的两级路线与「改完必须」五项。
2. **周自查第二回**（≈ 2026-11-02，30 分钟）：Traffic 周记 + 轮转**第 8 类跨端漂移**（375/1280 表现分叉——v5 加了配图层与三层卡，最可能分叉的一类；查法：双端截图对照 + E2E 的 375 断言已覆盖触控目标与行宽）。发现带证据入 backlog。
3. **季度配图回访的剩余部分**：本轮 20 张抽验与 SI-001 **同源**（错配先修完，抽验才有意义）。修完 SI-001 后重新抽 20 张，看「图说同一件事」的主观分。
4. **观察区到期项复评**：15 项里 4 项有触发条件可查（`纹理素材` 连续两轮无诉求 → 已过两轮，可考虑清理；`42 条豁免` 与 `自产线稿上限` 需外部反馈；`出生证明卡 375px 滚动` 需目检）。
5. **可选**：v6 方案腿（用户明示后启动；先写方案文档沿 `plan/07–10` 先例 + 装订 `plan/v6/` 套件 + 布局门 `LEG_CONFIG` 加一行 + `WIRED_LEGS`）。

## 四、既定口径（已拍板，别再问；推翻须进 `v5/00` 决策记录）

- **判定核零改动（K11）**：三观传导 / 结局 / 调度单调 / 种子复现全部不动；任何棒都不得带判定改动。
- **零运行时依赖（K2）**：`dependencies` 恒空。配图是静态 SVG（`?raw` 内联），图谱是手绘 SVG。
- **存档 schema 沿用 v3**（`xinlu.save.v3`）：不升版本、不加字段。
- **文本口径**：主句 ≤120 / 选项 ≤10 字（中位）/ ≥20 字 ≤10% / 每题 2–3 / **单屏 ≤160（当前 158，余量 2）**；原文进 `detail`，内容零损失（不删只折叠）。
- **配图路线**：自产 CC0 线稿 SVG（48 张 / 19 类）已冻结；发版说明里如实写「自产线稿」。
- **配图覆盖率门线 = ≥60%**：SI-001 无论摘一级还是两级都仍过门（81.0% / 68.1%），所以**不必因为「怕掉覆盖率」而不敢修**。
- **图谱默认 tree / ring 可切**；主题四款继续有效（素纸默认）。
- **发布纪律**：不虚报；tag 后不改代码面；Release 五部分 + dist.zip + sha256 复核一致；留档双栏。

## 五、环境坑（实测在案，沿 HANDOFF-v5-M5 增补）

- **本机直连 github.com 不通**：push 一律 SSH:22；仓库/Pages/Release 操作走 `gh` API（HTTPS 通）。
- **脱敏门红线**：入库文件与提交信息不得写本机盘符 / 用户名 / 回环代理端口；示例路径用 `<user>`/`<repo>` 占位符。临时探针脚本若写绝对路径也当场被抓——**用完立刻删**（本轮 4 个 `tmp-audit-v5m5*.mjs` 已删）。
- **`gh` 是原生程序，不认 `/tmp` 与 Git Bash 路径**：`--notes-file` / 附件参数要传 `cygpath -w` 转过的 Windows 路径。
- **写源码要用 Write/Edit**：hook 拦截「Bash 直接写 `src/`」，**本轮实测它也拦截向 `tests/` 的 Bash 写入**（`node -e` + `writeFileSync` 被拒）。变异自检要用 Edit 改、改完 Edit 复原，或用 `tools/` 下的脚本。
- **配图审计现在有正式入口**：`node tools/v5-scene-audit.mjs`（只读、退出码恒 0）+ `node tools/v5-scene-audit.mjs --json`（机读）。别再用一次性探针。
- **`npx vitest run` 单跑 ~25–35s**：可达性三项各 ~14–25s（并行取最大），不是卡死。
- **e2e 会改写 `docs/assets/` 下 19 张截图**：本轮跑 `npm run e2e` 后 19 张 PNG 全部 diff（像素级差异，内容一致）。**这些 churn 不要提交**——`git checkout -- docs/assets/` 复原（本轮已复原）。
- **node `-e` 内联脚本含 `''''`（里程碑标号）会被 bash 单引号截断**——写临时脚本文件或用 Edit 工具。
- **`python` 是 Store 占位符（exit 49 零输出）**：用 `py` 或 node。

## 六、DoD（v5-M5 运维首查棒 · 运维期无里程碑口径）

> 单源 = [00 §里程碑总表](00-README总览.md)（本棒无里程碑行，见 [04 §执行结果](04-里程碑任务分解.md) 的运维期入口）；本档自定 DoD 如下。

- [x] 布局门开工前 + 收尾各跑一次，全绿
- [x] 全量门禁复跑（validate / story / rhythm / vitest / typecheck / e2e / license / budget / desens）全绿
- [x] Traffic 周记 + issue 轮转 + 仓库指标采集（views 0 / clones 202 / stars 0 / issues 0）
- [x] 第 15 类抽验（长度门 + 单屏实算）：无漂移；余量 2 字已实名登记
- [x] 第 16 类抽验（配图语义）：查出 38 键 / 52 条（17.6%）错配 → 入队 SI-001
- [x] 配图回访兼做（复用统计 + 42 条豁免复算 42/42 一致）
- [x] **每条发现带可复现证据**（命令 + 输出，见 §一 表与 backlog 周自查记录）
- [x] **防回退测试**：`scene-misfits.test.ts` 4 项，**验红实测通过**（删清单一项 → 立刻红 → 复原绿）
- [x] 顺手修掉两处文档数字漂移（判据面注 / `heart-*` 12→7 改实算）
- [x] 代码面零改动（`git diff src/` 为空，符合 tag 后不改代码面）
- [x] 布局门在收尾改动后仍全绿
- [x] 本档七节齐

**验证记录（本棒当轮实跑，2026-10-26）**：

| 命令 | 结果 |
|---|---|
| `node tools/check-sprint-layout.mjs` | **全绿**（10 条判据；`DOC_TOOLS 19 个`；`README 120/120`；`STATUS 2 处 × 19 里程碑一致`；`HANDOFFS 18 份齐`） |
| `node tools/check-desensitized.mjs` | 539 文件，0 命中（豁免 1 份） |
| `npm run validate` | **0 FAIL**（14 区；295 事件 / 图标 295/295 / `F` / `C` / `S`） |
| `npm run validate:story` | **七项全绿**（255 条；主句 102/117/120；选项 8/16/0%；detail 0 缺；单屏 >160 = 0） |
| `npm run validate:rhythm` | **绿**（8 局 × 8 阶段，每阶段 4–5 变体、非 critical 连片 ≤3） |
| `npx vitest run` | **403/403**（37 文件；~25s；基线 399 → 403） |
| `npx tsc --noEmit` | 0 错 |
| `npm run e2e` | **全绿**（375: `ESFJ` 252 卡 / 1280: `ENFJ` 250 卡；单屏最长 158；768 中档；v5 自定义出生全流程） |
| `npm run gate:license` / `gate:budget` | 0 FAIL（512 件）/ **760.43KB ≤ 850KB** 0 WARN |
| `node tools/v5-scene-audit.mjs` | 覆盖 85.8% / 豁免 42 / **错配 38 键 52 条 = 17.6%** |
| `node tools/v5-scene-misfits` 棘轮验红 | 删 `sunrise` → `实测 37 个 ≠ 快照 38` 红；复原 → 4/4 绿 |
| `gh api .../traffic/views\|clones` | views 0 / clones 202（unique 60，14 天窗口） |

## 七、命令速查

```bash
node tools/check-sprint-layout.mjs   # 布局门（= npm run gate:layout）
node tools/check-desensitized.mjs    # 脱敏门（= npm run gate:desens）
npm run validate                     # 数据门（14 区；F 槽位 / C 线索 / S 配图）
npm run validate:story               # 文本长度 + 写实机检七项（判据面 255 条）
npm run validate:rhythm              # 节奏门（每阶段变体 ≥3）
npm test                             # vitest（v5-M5 后基线 403）
npx vitest run tests/scene-misfits.test.ts   # 配图错配棘轮（会判红）
npm run typecheck                    # tsc --noEmit
npm run e2e                          # E2E 全量（会改写 docs/assets/ 19 张截图，跑完 git checkout 复原）
node tests/e2e/smoke.mjs --no-build --base-url <url>   # 发布冒烟（外部静态服务/线上 Pages 同口径）
node tools/v5-scene-audit.mjs        # 配图语义审计（只读，退出码恒 0）
node tools/v5-scene-audit.mjs --json # 同上，机读
node tools/v5-scenes-doc.mjs         # 重生 docs/v5-scenes.md（改映射后必跑）
npm run gate:license                 # 许可门
npm run gate:budget                  # 预算门（850KB 线；实测 760.43KB）
gh api repos/<user>/<repo>/traffic/views   # Traffic 周记（clones 同路径）
gh release view v5.0.0               # Release 核对
```
