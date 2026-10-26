# HANDOFF-v5-M1 · v5 装订棒收尾交接单（装订棒 → v5-M1'''' 数据与机制层）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档 + [00-README总览.md](00-README总览.md)。
> 编号纪律（skill 硬约束①）：**交接单编号随棒顺延**——本档是**装订棒**收尾单，编号 HANDOFF-v5-M1 指下一棒（v5-M1''''）。v5 腿后续棒依次写 HANDOFF-v5-M2 / M3 / M4。
> 本档记录 **v5 计划套件装订（2026-10-26）**：plan/v5/00–06+backlog 定稿、布局门认 v5、README 行数门落地、两处状态副本加 v5 四行 ⬜。**v5 代码面零改动**。

## 一、当前进度 + 证据（2026-10-26 当轮实测）

**装订三件齐**（skill 硬约束③）：

| 件 | 落位 | 证据（当轮实跑） |
|---|---|---|
| ① 仓库锚点 `AGENTS.md` | 强制布局表新增 **v5 计划套件 / 交接单 v5 路径 / README 行数门 / 台账四份 / 缺口队列四份** 五行，顶部续接行点明「v5 是当前活跃腿」 | 文件已改，布局门 `LAYOUT.FILES` 认 AGENTS.md |
| ② 布局门 `tools/check-sprint-layout.mjs` | 新增 `LEG_CONFIG` 腿登记表 + `handoffPath()` / `normalizeLegKey()` / `keyPattern()` / `queuedRefPattern()`；八处判据认 `v5-M<k>''''`；**新增 `LAYOUT.README` 行数门** | 当轮 `node tools/check-sprint-layout.mjs` → **全绿**，关键行：`LAYOUT.STATUS 2 处副本 × 19 个已接门里程碑 状态全一致（行数 00-README总览.md:23 README.md:23）；未接门腿 4 个不计入（v3，纪律双维护）` / `LAYOUT.README 119/120 行；状态表 23 行` / `LAYOUT.DOC_TOOLS 8 个文档点名的 tools|scripts 脚本；1 个待里程碑落位: scripts/check-rhythm.mjs(v5-M1'''')` |
| ③ `plan/00` 顶部装订行 | 原件已有（2026-10-23），未改 | `LAYOUT.BINDING_HEAD` PASS（三锚点齐） |

**四件事的落位**（对照 [00 §开工前置](00-README总览.md)）：

1. **未提交视觉改造批次** —— ✅ **已清偿**：独立成笔 `bbaca67`（见 §二.1）。装订笔未把该批裹进自己的提交，两笔边界 = 「代码面」vs「文档与门」。
2. **布局门 v5 感知**：八处（FILES / SECTIONS / STATUS / HANDOFFS / QUEUE / LEDGER / RELEASE / DOC_TOOLS）全认 `v5-M<k>''''`。沿两处**判据面扩大**：
   - `STATUS_LINE` 改为按腿宽匹配 + `normalizeLegKey()` 规范化撇号数——写错撇号数的行不会「静默掉出待检集合」（假门族①的同族陷阱）。
   - `checkStaleQueue` / `checkLedger` 的扫描文件**由 `LEG_CONFIG` 派生**（不再手写三份文件名：加腿只加一行登记）。
3. **两处状态副本加 v5 四行 ⬜**：`plan/00` 里程碑总表 + `README.md` 状态表，逐行写清"待 v5-Mn'''' 收官"依赖关系。
4. **本档**（HANDOFF-v5-M1）。

**顺带补齐的一处真缺陷**（不在原计划内，发现即修）：`plan/03` §6 / `plan/04` §M5 / `v5/04` §M4 三份文档都点名 **README ≤120 行**，而 `plan/HANDOFF-M6.md:22` 自述"**未自动化**"——即这条门**在文档里存在、在仓库里不存在**（skill 装订第四种失效）。当轮 README 实测 **119 行**，加 v5 四行必定越线而**没有任何东西会红**。处置 = 新增 `LAYOUT.README`（上限常量 120，单源在门内注释）+ 压缩 README 的 v2/v3 小节腾量（折行合并，信息零删减），加完 v5 四行仍 **119/120**。

## 二、当前事实·状态不变量（下一棒动手前必须知道）

1. **视觉改造批次已入库（v5 基线就位）**：`bbaca67`（独立成笔）——`src/style.css` 1859→2618 行重写 + 新增 `src/ui/lines.ts`/`years.ts` 及其单测 + `screens.ts`(+444)/`app.ts`/`relations.ts`/`engine/model.ts`/`viz/*` + 40 张 `v5-ui-*.png` + 11 张既有截图重留痕 + `plan/v3/02` ▸ v5 界面改造增补 + `.gitignore`/脱敏门 `.taste-skill` 同步。**v5 后续代码改动现在可以与视觉基线二分回溯**（`git diff bbaca67..HEAD -- src/` 即 v5 真实代码增量）。装订笔（本档所在）在其之上独立成笔。
2. **v5 代码面零改动**：本棒只动 `tools/check-sprint-layout.mjs` + 文档面（AGENTS / plan/00 / README / plan/v5/*）。**`src/`、`scripts/`、`src/data/` 在本棒内一个字节没变**（视觉批次已计入上一笔 `bbaca67`）——单测因此仍是 **298/298**（不是 v4 的 282：差额 16 项来自 `lines.test.ts` + `years.test.ts` 等已入库的视觉层测试）。
3. **`plan/v5/` 里程碑口径是四撇**：`v5-M1''''` / `v5-M2''''` / `v5-M3''''` / `v5-M4''''`（v2 一撇、v3 两撇、v4 三撇、v5 四撇）。**交接单文件名不带撇号**：`plan/v5/HANDOFF-v5-M<k>.md`。写状态行时撇号数写错**不会**被正则漏掉（门会规范化），但仍是口径漂移。
4. **v3 腿在门里是显式 `wired:false`**：v3 的交接单按「编号随棒顺延」落成 `HANDOFF-v3-M<k+1>`（如 v3-M1'' 的交接单叫 HANDOFF-v3-M2.md），与门的最低校验口径（每 ✅ 里程碑一份 `HANDOFF-<leg>-M<k>`）不同构。**别把 v3 改成 `wired:true`**——会立刻报四条"缺交接单"假红。它的状态行可见计数但不参与一致性判定（纪律双维护）。
5. **README 是硬门，不是建议**：上限 120 行，当前 119。下一版加状态行/特性节前先想好从哪腾量；**不许抬线**（抬线 = 把出口门静默取消，正是 skill「链三」）。
6. **`scripts/check-rhythm.mjs` 已在 `PENDING_TOOLS` 登记**（值 `v5-M1''''`）。**落位该脚本的同提交必须删这行登记**，否则 v5-M1'''' 翻 ✅ 后走 `stale` 分支报红（这是门的设计，不是 bug）。
7. **单测基线 298（只加不减）**；vitest 含可达性全量（2496 组）+ 年代轴抽样（936 局），单跑约 16s，其中两个可达性测试各 ~15s 是主要耗时，别当卡死。
8. **远端**：`origin/main` 起点 = `fed5769`（v4 腿收官）。本棒两笔已 push：视觉基线 `bbaca67` + 装订笔 `ae511a3`。**CI 实测**（2026-10-26，`ae511a3`）：ci run **40269817007** success（三 job 全绿：Methodology gates + Vitest node22 + node24）+ deploy-pages run **40269816998** success。CI 日志已实证跑的是**新版 v5 感知布局门**（`LAYOUT.README 119/120 行` / `LAYOUT.STATUS …19 个已接门里程碑 状态全一致且无缺行` / `LAYOUT.FILES 36 份`），不是旧版。
9. **发布先例四份**：plan/05 §三/§四（v1）、§七（v2）、§八（v3）、§九（v4）。v5 发布沿 §九 模板，主体落 plan/05 新增 **§十**（`v5/05` 骨架已声明"单源不双写"）——布局门 `RELEASE_MILESTONE_V5` 会在 v5-M4'''' 翻 ✅ 后要求 plan/05 存在 `v5.0.0` 节。

## 三、下一棒待办（v5-M1'''' 数据与机制层，四块）

> DoD 单源 = [00 §里程碑总表](00-README总览.md) v5-M1'''' 行；执行视图 = [04 §v5-M1''''](04-里程碑任务分解.md)；口径单源 = [02 §一–§四、§十一](02-数据与口径.md)。

**块 0（前置，已办）**：视觉改造批次已独立成笔 `bbaca67` 入库（§二.1），可直接开工。

| 块 | 内容 | 出口判据 |
|---|---|---|
| 1.1 | **家庭槽位逐位命名**（缺陷修复）：`npcs.json` 重构（`slot`/`role` 逐位）+ `src/engine/family.ts` 按槽生成 + validate 新增 `F` 区 + 图谱标签接线 | F 区绿；结构↔槽组合单测；图谱标签 E2E；变异自检（槽重复必红） |
| 1.2 | **偶遇层**：encounter schema + 40 条文案（每阶段 ≥5）+ `pickEncounter`（0–3 条、种子决定、不推 line） | 密度门绿；注入单测；种子可复现断言 |
| 1.3 | **文本瘦身**：243 条主句重写（≤120 字）+ 原文迁 `detail`（零损失）+ 选项短句化（≤10 字）+ 每题 2–3 + `validate:story` 三门落地 | 三门绿（中位/P90/占比/覆盖）；抽样对账 detail 与 v4 原文；变异自检 3 组 |
| 1.4 | **节奏变体引擎**：`rhythm.ts`（五种变体分配 + 概率判定）+ `scripts/check-rhythm.mjs` 节奏门 + `npm run validate:rhythm` | 节奏门绿（每阶段 ≥3 变体 / 同变体连续 ≤3）；概率同种子同结果断言；分配单测；**落位同提交删 `PENDING_TOOLS` 登记** |

**公共出口门**：validate 0 FAIL + validate:story 绿 + vitest ≥ 298（只加不减）+ typecheck 0 + e2e 双端绿 + 布局门/脱敏门绿 + README ≤120 行。
**评审门（强核查）**：02 §三分配表 / §四长度门 ↔ 实现 ↔ 单测三方一致；瘦身**只动文案面**（`deltas3`/`ageMonths`/`line` 零改动 diff 核对）。

**收尾顺序（固定）**：DoD 验证 → 两处状态副本 v5-M1'''' ⬜→✅ → v5/00 台账四行 ✅ → v5/03 模块 1/2 ✅ 附验证记录 → 写 **HANDOFF-v5-M2**（编号随棒顺延）→ commit。

## 四、既定口径（已拍板，别再问；推翻须进 `v5/00` 决策记录）

- **判定核零改动**（K11）：三观传导 / 结局 / 调度单调 / 种子复现全部不动；v5 只治「节奏」与「信息层级」。
- **零运行时依赖**（K2）：`dependencies` 恒空；新增能力一律原生 TS + 手绘 SVG。
- **概率判定全走种子化 RNG**：同种子同结果（可复现是硬约束，不是"尽力"）。
- **正文瘦身内容零损失**：v4 原文整段进 `detail`，不删只折叠（抽样对账）。
- **主题四款继续有效**（米纸/月白/夜航/青瓷），夜航 AA 不得退化（`theme-contrast.test` 11 组合 ≥4.5）。
- **存档 schema 沿用 v3**（`xinlu.save.v3`）：偶遇/节奏变体走既有 `history`/`flags` 通道，**无结构性新增**，不升版。
- **每题 2–3 个选项**（关键节点 3，日常 2）；**不复用** v3「选项 ≥3」的旧口径——v5 是**放宽下限、收紧上限**。
- 配图为**语义复用**（一图多事件），不承诺每事件独有；覆盖不足显式豁免。
- 产品/赛事/制度名可入文，**真实机构名/真人名不写**。

## 五、环境坑（实测在案）

- **本机直连 github.com 不通**：push 一律 SSH:22；仓库/Pages/Release 操作走 `gh` API（HTTPS 通）。**不虚报发布**。
- **脱敏门红线**：入库文件与提交信息不得写本机盘符 / 用户名 / 回环代理端口（`127.0.0.1:端口` 形态会红）。`.taste-skill/` 已进 `.gitignore` + 脱敏门 `SKIP_DIRS`（两侧必须同步，只看一侧必漏）。
- **gh 是原生程序，不认 `/tmp` 路径**：`--notes-file` / 附件参数要传 `cygpath -w` 转过的 Windows 路径。
- **e2e 冒烟**：`node tests/e2e/smoke.mjs`（本地 build+preview）／`--no-build --base-url <url>`（外部静态服务或线上 Pages，同一口径）。
- **vitest 单跑 ~16s**：两个可达性测试各 ~15s（并行耗时取最大），不是卡死。
- **布局门变异自检**：改完判据要**逐条验红再复原**。本项目判据已扩到 10 条（含新增 `LAYOUT.README`），**变异清单必须逐条覆盖**（skill：一条门里有几个 `add()`，变异清单就要覆盖几个）。

## 六、DoD 逐项 checklist

**装订棒（本档）**：

- [x] `plan/v5/00–06` + `backlog.md` 八份齐备且各含必需小节（`LAYOUT.FILES` 36 份 / `LAYOUT.SECTIONS` 33 份）
- [x] 布局门八处认 `v5-M<k>''''`（FILES/SECTIONS/STATUS/HANDOFFS/QUEUE/LEDGER/RELEASE/DOC_TOOLS）
- [x] 腿登记表 `LEG_CONFIG` 落位，v3 显式 `wired:false`（不再靠正则漏掉它）
- [x] **`LAYOUT.README` 行数门落地**（补齐三份文档点名却"未自动化"的 ≤120 行门）
- [x] 两处状态副本加 v5 四行 ⬜ 且逐副本一致（19 个已接门里程碑 / 行数 23:23）
- [x] README 加完四行仍 ≤120（实测 119）
- [x] `AGENTS.md` 强制布局表加 v5 行 + 续接行点明活跃腿
- [x] `plan/v5/00` 文档索引加 HANDOFF 行 + §开工前置 逐项标注结果
- [x] `plan/00` 文档索引 v5 行 ⬜→✅ 已定稿装订
- [x] 本档七节齐
- [x] 变异自检 **11/11 组**逐条验红复原（见文末附表；当轮抓出 2 条真缺陷并已修）
- [x] `LAYOUT.STATUS` 新增「缺行」判据（原判据会放过整行缺失 → 已修，第 11 组验红）
- [x] 全门复跑：layout / desens / validate / validate:story / vitest 298 / typecheck / e2e / budget / license 全绿
- [x] **未提交视觉改造批次入库**（§二.1 已清偿）：独立成笔 `bbaca67`——`src/` 全批（style.css 1859→2618 行 + lines.ts/years.ts 及单测 + screens.ts/app.ts/relations.ts/model.ts/viz/*）+ 40 张 `v5-ui-*` 截图 + 11 张既有截图重留痕 + `plan/v3/02` ▸ v5 界面改造增补 + `.gitignore`/脱敏门 `.taste-skill` 同步；入库前实测 vitest 298/298 + 脱敏 454 文件 0 命中。**v5 代码改动自此可与视觉基线二分回溯**
- [x] 装订提交（`ae511a3`）：`plan/10-5.0优化方案.md` + `plan/v5/` 全套 + `tools/check-sprint-layout.mjs` + `AGENTS.md` + `README.md` + `plan/00`；已 push
- [x] **push 后 CI 绿（真跑，非本地等价）**：`ae511a3` → ci run **40269817007** success（Methodology gates + Vitest node22/24 三 job 全绿）+ deploy-pages run **40269816998** success；CI 日志实证跑的是新版 v5 感知布局门

**v5-M1''''（下一棒）**：见 §三 四块表，每块各自 DoD 未勾。

**验证记录（装订棒当轮实跑，2026-10-26）**：

| 命令 | 结果 |
|---|---|
| `node tools/check-sprint-layout.mjs` | **全绿**（10 条判据；`LAYOUT.README 119/120 行；状态表 23 行`；`LAYOUT.STATUS 2 处副本 × 19 个已接门里程碑 状态全一致且无缺行（行数 23:23）`；`LAYOUT.DOC_TOOLS 8 个点名脚本，1 个待 v5-M1'''' 落位`） |
| `node tools/check-desensitized.mjs` | 脱敏门：扫 454 个文本文件，**0 命中**（豁免 1 份） |
| `npm run validate` | **0 FAIL**（图标覆盖 243/243 + 历法 76/76 + birth-map 51840/51840） |
| `npm run validate:story` | **绿**（S.LEN 243 / S.ERA 243 / S.SENSE 243 / S.REF 122 全过） |
| `npx vitest run` | **298/298** 通过（30 文件；含可达性全量 2496 组 + 年代轴抽样 936 局；~41s） |
| `npx tsc --noEmit` | **0 错** |
| `npm run e2e` | **全绿**（375/1280 双端一键通关 + v4 自定义出生全流程） |
| `npm run build` + `gate:budget` | 31 件产物，gzip **724.26KB ≤ 850KB**，单图 ≤50KB，无 WARN |
| `npm run gate:license` | **0 FAIL** |
| 变异自检 | **11/11 组**符合预期（见下附表），复原后门复跑全绿 |

> 注：`vitest` 基线由 v4 的 282 升到 **298**，增量 16 项来自 `bbaca67` 已入库的视觉层测试（`src/ui/lines.test.ts` + `src/ui/years.test.ts` 等）。下一棒的"只加不减"基线取 **298**。

## 七、关键命令速查

```bash
# 布局门（第一件事，必须绿）
node tools/check-sprint-layout.mjs

# 全门
npm run validate            # 数据门（-- --count 出分母汇总）
npm run validate:story      # 文本质量四项机检（243/243）
npx vitest run              # 单测（基线 298，只加不减；~16s）
npm run typecheck           # tsc --noEmit
npm run e2e                 # 双端冒烟（build + preview）
node tests/e2e/smoke.mjs --no-build --base-url <url>   # 外部/线上同一口径

# 门禁
npm run gate:layout && npm run gate:desens && npm run gate:license && npm run gate:budget

# 构建与预算
npm run build && ls -l dist && npm run gate:budget
```

```bash
# 本棒装订提交后的自检序列（顺序固定）
node tools/check-sprint-layout.mjs && npm run gate:desens && npx vitest run && npm run typecheck
```

---

### 附：布局门变异自检表（本棒 **11 组**，逐条验红→复原绿，实测 11/11 符合预期）

| # | 判据 | 变异 | 实测结果 |
|---|---|---|---|
| 1 | `LAYOUT.FILES` | 移走 `plan/v5/06-运维节奏.md` | ✓ FAIL=[LAYOUT.FILES] |
| 2 | `LAYOUT.SECTIONS` | 改 `plan/v5/02` 的「节奏变体」小节标题 | ✓ FAIL=[LAYOUT.SECTIONS] |
| 3 | `LAYOUT.STATUS`（副本冲突） | 只把 `README.md` 的 `v5-M1''''` 翻 ✅ | ✓ FAIL=[STATUS,LEDGER,DOC_TOOLS] |
| 4 | `LAYOUT.HANDOFFS` | 造 v5-M1'''' ✅ 态 + 移走 `plan/v5/HANDOFF-v5-M1.md` | ✓ FAIL=[HANDOFFS,…] |
| 5 | `LAYOUT.QUEUE` | 造 ✅ 态 + 队列加"待 v5-M1''''"行 | ✓ FAIL=[QUEUE,…] |
| 6 | `LAYOUT.LEDGER` | 造 ✅ 态而 v5/00 台账仍挂"⬜ 待 v5-M1''''" | ✓ FAIL=[LEDGER,…] |
| 7 | `LAYOUT.RELEASE` | 造 v5-M4'''' ✅ 态而 plan/05 无 `v5.0.0` 节 | ✓ FAIL=[RELEASE,…] |
| 8 | `LAYOUT.DOC_TOOLS` | 删掉 `PENDING_TOOLS` 里 check-rhythm 登记 | ✓ FAIL=[DOC_TOOLS] |
| 9 | `LAYOUT.README` | README 追加 3 行 | ✓ FAIL=[README]（123/120 超 3 行） |
| 10 | `LAYOUT.BINDING_HEAD` | 改掉 `plan/00` 顶部装订锚点 | ✓ FAIL=[BINDING_HEAD] |
| 11 | `LAYOUT.STATUS`（**缺行**） | 从 README 整行删掉一条 v5 状态行 | ✓ FAIL=[STATUS] |

**变异自检当轮抓出的两条真缺陷（都已修，是本棒最有价值的产出）**：

1. **`LAYOUT.STATUS` 原判据「只比副本间状态值」会放过"整行缺失"**：把 README 的一条 v5 状态行整行删掉后，
   门报 **PASS**（19 个里程碑"全一致"——因为掉出去的那行从 README 视角根本不存在，没有"不一致"可比）。
   这正是 skill 假门族①「自我参照的真值源」的同族：**掉出待检集合的东西永远判绿**。
   处置 = 采集结构从 `Map<k, Set<state>>` 改为 `Map<k, Map<copyFile, state>>`，并新增判据
   「已接门腿的里程碑必须在**每一份**副本都出现」（缺行点名报出）。改后第 11 组立刻变红。
2. **改结构时同步引入的"单位错"**：`done` 的收集原写 `set.has("done")`（对 Map 恒 false）→ `done` 恒空
   → `HANDOFFS` 报"0 份交接单齐"、`RELEASE` 报"M6 未完成尚不适用"，**两条判据静默空转**。
   当轮即从结论行 `0 份交接单` 抓到（不是靠推理），改为遍历 `perCopy.values().includes("done")`。
   判别口诀（写进本档供下一棒复用）：**"判据的 done 集合为空时，是哪一条在替我报警？"**

> 变异脚本纪律（沿 skill）：替换前 `assert marker 存在` → 替换后 `assert 文件已变` → 还原后 `assert 字节一致`，
> 全包 `try/finally`。本棒第一版脚本的 `setDone()` 曾因贪婪正则**静默 no-op**（写"替换后文件未变"即崩），
> 也正是这条纪律抓住的——**"变异没红"先查"变异真发生了几次字节变化"**。
> 靶子说明：3–7/11 组需要"已 ✅ 里程碑"作靶，本棒无一 ✅ v5 里程碑，故用**临时构造态**（改两处副本 → 验红 → 复原），
> 复原后门复跑必须绿（实测末态全绿）。
