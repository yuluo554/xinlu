# HANDOFF-v5-M7 · v5-M6 运维第二棒 → 运维期第三棒（无既定里程碑）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档 + [00-README总览.md](00-README总览.md)。
> 编号纪律（skill 硬约束①）：**交接单编号随棒顺延**——装订棒 HANDOFF-v5-M1、v5-M1'''' 棒 M2、v5-M2'''' 棒 M3、v5-M3'''' 棒 M4、v5-M4'''' 发布棒 M5、v5-M5 运维首查棒 M6、**本档为 v5-M6 运维第二棒收尾单（下一棒 = 运维期第三棒）**。
> 本档记录 **v5-M6 运维期第二棒（2026-10-26）**：无里程碑、无发版，只做「观察区到期项复评」+ 第 8 类跨端预跑 + 遗留批次入库；因 HD-v5-M6 §三 的第 1/5 项以**用户明示**为开工前提（本轮未获）、第 2 项 Traffic 未到期、第 3 项以 SI-001 先修为前提，本棒**未开工任何产品改动**（黑字口径：没有缺口时正确动作是不动）。

## 一、当前进度 + 证据（2026-10-26 当轮实测）

| 块 | 动作 | 证据（当轮实跑） |
|---|---|---|
| 0 布局门 | 开工前 + 每笔改动后各跑一次 | `node tools/check-sprint-layout.mjs` → **全绿**（10 条判据；`README 120/120`；`README 状态表 23 行`；`STATUS 2 处副本 × 19 里程碑一致无缺行`；`HANDOFFS 18 份齐`；`DOC_TOOLS 19 个脚本在位`）。开工基线 = 工作树 12 件悬空（上一棒未提交） |
| 1 遗留批次入库（先行） | 上一棒的 12 件悬空改动独立成笔 | `81e76ba`「v5-M5 运维首查（配图语义审计三件 + 两处文档数字漂移修复 + 棘轮测试）」；同笔订正 HANDOFF-v5-M6 §一 改动清单 2 处（缺 `plan/v5/04` 一行 / `docs/v5-scenes.md` 行数 198→197）——**订正有据**：`wc -l` 197 + 生成器重跑 md5 不变 |
| 2 全量门禁复跑 | 确认发布态没漂 | `npm run validate` **0 FAIL**（14 区 / 295 事件）/ `validate:story` 七项绿（255 条；主句 102·117·120；选项 8/16/0%；detail 缺 0；单屏 >160 = 0）/ `validate:rhythm` 绿 / `npx vitest run` **403/403**（37 文件）/ `npx tsc --noEmit` 0 错 / `gate:license` 0 FAIL（**512 件**）/ `gate:budget` 31 件 **760.43KB ≤ 850KB** 0 WARN / `check-desensitized` **538 文件 0 命中** |
| 3 观察区 15 项逐项复评 | 4 项可查项出结论，其余 11 项定「未满足」 | 结论全部落 [backlog](backlog.md) 观察区新增的**「复评（v5-M6 · 2026-10-26）」列**（见本档 §二.3 摘要）；**未新开队列项** |
| 4 第 8 类跨端漂移预跑 | e2e 双端 + 19 张留痕截图逐对比对 | `npm run e2e` 双端全绿（375 `ESFJ` 253 卡 / 1280 `ENFJ` 251 卡；双端单屏最长均 **158**；768 中档 + v5 自定义出生全流程）；对照结论：图鉴 375 = 2 列 / 1280 = 4 列（同为 16 格）、图谱 375 纵排单列 / 1280 左图右表双栏、关系网 375 八卫星环绕可辨 / 1280 同构放大 ⇒ **差异全是自适应布局档，无文字断行差异、无溢出横滚、无触控分叉** |
| 5 口径补门（**本棒唯一新增断言**） | 复核交接单的「已覆盖」表述 → 发现口径裸奔 → 补机检 | HD-v5-M6 §三.2 写「E2E 的 375 断言已覆盖触控目标与行宽」= **半错**（行宽 ≤34 字有断言；触控 ≥44px **零断言**）。`tests/e2e/smoke.mjs` 补：逐卡实测 `.event-card [data-option]` / `[data-continue]` 的 `getBoundingClientRect()` 最小边，双端断言 ≥44px，实测最小值入 verdict 行（现印 `触控≥44px(最小44)`）。**验红实测**：`.option` 改 `min-height:20px + padding:2px 4px` → 立即红 `1280 档：触控目标 <44px（实测 32.2×862；卡 3 月龄 / 变体 choice）`；复原后 e2e 绿、`git diff src/` 空 |
| 6 第 3 类文档数字对账 | 复跑值 vs 包内文档 | 事件 295 / 覆盖 85.8% / 豁免 42 / 图标 295-295 / 线索 6+12 / 偶遇 40 / vitest 403 / 许可 512 件 / 预算 760.43KB / 脱敏 538 文件 —— 与 README:60、[00 台账](00-README总览.md)、[03](03-模块清单与验收.md)、[06](06-运维节奏.md) 所载一致（459 件 / 531 文件 / vitest 399 是 v5-M3''''/M4'''' **历史快照**，口径正确）；`docs/v5-scenes.md` 生成器稳定性实测：重跑 `tools/v5-scenes-doc.mjs` 后 md5 不变（`55f718e6…`） |
| 7 Traffic（未到期，复核一次） | `gh api …/traffic/{views,clones}` + repo + issues | views **0** / clones **202**（unique 60，窗口 10-12～10-25，与首查同值，**非当日新增**）/ stars 0 / forks 0 / watchers 0 / `gh issue list --state all` 空 |
| 8 基线更新 | vitest 计数 | **403 → 403（不变）**：本棒只改 `tests/e2e/smoke.mjs`，不进 vitest 面 |

**本轮改动清单（工作树，未提交）**：

| 文件 | 性质 |
|---|---|
| `tests/e2e/smoke.mjs` | 补「事件卡触控目标 ≥44px」双端断言 + verdict 行打实测最小值（唯一新增判据） |
| `plan/v5/backlog.md` | 队列 SI-001 加复评（挂起理由）；观察区整表 +「复评」列（15 行逐项结论）；周自查记录 + 第二棒全记录 |
| `plan/v5/04-里程碑任务分解.md` | 运维期 +「第二棒结果（v5-M6）」节（含本棒口径：为何 SI-001/v6 未开工） |
| `plan/v5/06-运维节奏.md` | 节奏增量 +「跨端回访（第 8 类）」机检口径（含触控断言与「不许把滚动当漂移」） |
| `plan/v5/02-数据与口径.md` | §三 L2 与 §十四 L2 登记触控 ≥44px 的机检入口 |
| `plan/v5/03-模块清单与验收.md` | 模块 6 运维期增量（v5-M5 三件 + v5-M6 触控断言；均为测试/工具面） |
| `plan/v5/00-README总览.md` | 索引 + HANDOFF-v5-M7 行 |
| `plan/v5/HANDOFF-v5-M7.md`（新） | 本档（第二棒收尾单 → 运维期第三棒入棒单，七节） |

## 二、当前事实·状态不变量（下一棒动手前必须知道）

1. **项目在运维期，无既定里程碑**：维护动力 = 可度量缺口（plan/06 总原则：**没有缺口时正确动作是不动**）。周自查 30 分钟轮转十六类（v1 八类 + v2 9/10 + v3 11/12 + v4 13/14 + v5 15/16）。
2. **v5.0.0 已发布，tag 之后不改代码面**：本棒 `git diff src/` 为空（已核，含变异探针复原）；改动全在**测试面 + 文档面**。任何 src 改动都要进新提交、走版本规则（文本长度口径或判定呈现变化 → 主版本 +1 + 重开声明）。
3. **队列里唯一一项 = SI-001（配图语义错配）**：本棒复评**仍挂起**——它的改动落在 `src/data/scene-map.json`（**代码面**），须先定版本号口径，并同步 README:60 / plan/05 §十 / docs/v5-scenes.md / 棘轮快照四处；HD-v5-M6 §三.1 写明「若用户点名才开工」，本轮未获点名。**若用户说「修配图」**，按 `tools/v5-scene-misfits.mjs` 的 `OFF_SCENE_TIER` 分两级（一级 funeral/night/meal 14 条 → 覆盖 81.0% / 豁免 56；二级 study 38 条 → 68.1% / 94；两者都过 ≥60% 门），**改完必须五项**见 HD-v5-M6 §二.3。
4. **观察区 4 项可查项的本轮结论**（全表见 [backlog](backlog.md) 观察区「复评」列）：
   - 纹理素材（`assets/cc0/parchment/`）**触发条件已满足**（三轮无复用诉求；全仓唯一提及 = `src/ui/theme-contrast.test.ts` 的反向断言），但**删除是数据删除 + 需同步 assets/README 与许可门** ⇒ 待用户明示，标注「可直接执行，待明示」（git 跟踪仅 2 个 webp / 7.6KB）。
   - 出生证明卡 375px 滚动：**前提已机检坐实**（`docs/assets/v5-start-step3-cert-375.png` 像素体检：375×812、页面底色 `#f7f4ec`、内容底缘行 = **811 = 视口末行**）但用户反馈 0 ⇒ **不判缺陷**（八因素全显性是硬口径），保留观察；转做时评估对象 = 家庭成员两栏化或折叠。
   - 42 条豁免 / 自产线稿上限：触发条件是**外部反馈 ≥3 次**，本轮实测 0 ⇒ 未满足，保留。
   - 其余 11 项同理（外部信号全 0）⇒ 一律保留。
5. **单屏余量只剩 2 字**（`elder-012` 正文 118 + 选项 40 = 158，E2E 上限 160；≥148 的有 11 条，清单在 backlog 观察区/周自查记录）：任何加字的文案改动前先看那张表；**不许抬 160 线**。
6. **字数台账有两个判据面**：`S.LEN2` 印 **102/117**（255 条 = 243 瘦身卡 + 12 线索解锁事件）；其中 243 条口径是 **104/118**。写台账/文档必须标判据面。
7. **三个机检入口（本棒后）**：`node tools/v5-scene-audit.mjs`（配图语义，只读，退出码恒 0）/ `npx vitest run tests/scene-misfits.test.ts`（错配棘轮，判红）/ **`npm run e2e`（双端，含事件卡触控 ≥44px 与 L1 行宽 ≤34 字断言，判红）**。注意：**e2e 不在 CI 里**（CI 无浏览器，只有 typecheck / validate / validate:story / validate:rhythm / vitest + 布局两门）——触控断言只在本地跑得到。
8. **棘轮上限是快照制不是 0**：`SNAPSHOT.keys = 38` / `SNAPSHOT.events = 52`。改小 = 修了一部分；改到 0 = SI-001 全修完。别改成 `<=` 宽容式。
9. **配图纪律不变**（v5/02 §十四）：映射单源 = `scene-map.json` 的 `keyTag`；变体取图用事件 id 哈希高位（`>>> 16`）；改映射要重跑 `tools/v5-scenes-doc.mjs`（否则留痕表过期）。
10. **Traffic 下一回 ≈ 2026-11-02**（发布 +7 天，**这才是第一次有意义的回访**；本轮窗口 10-12～10-25 全是发布前数据）：`gh api repos/<user>/<repo>/traffic/views|clones`。
11. **远端状态**：origin/main = `81e76ba`（上一棒批次）；tag v5.0.0 已推；Pages 线上 = `ea2a783` 构建；**本棒改动尚未提交**（见 §一 改动清单）。
12. **「口径有、机检无」是本轮新抓的坑类型**：`触控 ≥44px` 写进了两处口径文档、却有零断言（只有 CSS token + `docs/M3-手动清单.md` 目检项）。
    **接手纪律**：凡是上一棒交接单写「E2E 的 X 断言已覆盖 YYY」，**先在 `tests/e2e/smoke.mjs` 里 grep 那个判据**再信；表述与实物不一致时以实物为准，缺口补断言（本棒即如此）。
13. **文档数字会反复漂移**：凡是「统计数据 + 分类说明」的段落一律改成脚本实算，别手抄（已中招三处：判据面 / `heart-*` 12→7 / `docs/v5-scenes.md` 行数 198→197）。

## 三、下一棒待办（运维期第三棒，无里程碑）

> 没有用户明示就不开工：**运维期的正确动作多数时候是不动**。下列按优先级排：

1. **周自查第二回（≈ 2026-11-02，30 分钟）**：**Traffic 发布 +7 天回访**（首次有效观测，基线 views 0 / clones 202）+ 轮转**第 4 类「可复现性」**（同 seed 复跑全等，vitest 已有覆盖，复跑留痕即可）**或第 2 类「平衡」**（结局可达性/过易，批跑统计）。
   （第 8 类「跨端漂移」已在 v5-M6 预跑完成并补了触控机检，不必重跑；第 3 类已对账。）
2. **（若用户点名）修 SI-001**：见 §二.3 两级路线与「改完必须五项」。
3. **定格/待明示项**：纹理素材清出仓库（条件已满足，**删除是数据删除，须用户明示**）；出生证明卡 375px（待反馈，转做对象 = 两栏化或折叠）。
4. **季度配图回访的剩余部分**：SI-001 修完后重抽 20 张看「图说同一件事」的主观分。
5. **可选**：v6 方案腿（用户明示后启动；先写方案文档沿 `plan/07–10` 先例 + 装订 `plan/v6/` 套件 + 布局门 `LEG_CONFIG` 加一行 + `WIRED_LEGS`）。

## 四、既定口径（已拍板，别再问；推翻须进 `v5/00` 决策记录）

- **判定核零改动（K11）**：三观传导 / 结局 / 调度单调 / 种子复现全部不动；任何棒都不得带判定改动。
- **零运行时依赖（K2）**：`dependencies` 恒空。配图是静态 SVG（`?raw` 内联），图谱是手绘 SVG。
- **存档 schema 沿用 v3**（`xinlu.save.v3`）：不升版本、不加字段。
- **文本口径**：主句 ≤120 / 选项 ≤10 字（中位）/ ≥20 字 ≤10% / 每题 2–3 / **单屏 ≤160（当前 158，余量 2）**；原文进 `detail`，内容零损失（不删只折叠）。
- **卡片三层与触控（v5/02 §三/§六）**：L1 行宽 ≤34 字；**L2 触控 ≥44px（机检 = E2E 双端控件最小边断言）**；L3 状态条默认折叠、读数节点不删。
- **配图路线**：自产 CC0 线稿 SVG（48 张 / 19 类）已冻结；发版说明里如实写「自产线稿」；**覆盖率门线 = ≥60%**（故 SI-001 无论摘一级还是两级都仍过门，不必怕掉覆盖率而不敢修）。
- **图谱默认 tree / ring 可切**；主题四款继续有效（素纸默认，纹理素材留档不删）。
- **发布纪律**：不虚报；tag 后不改代码面；Release 五部分 + dist.zip + sha256 复核一致；留档双栏。

## 五、环境坑（实测在案，沿 HANDOFF-v5-M6 增补）

- **变异自检必须真的压到判据线下**：本棒首跑「只把 `.option` 的 `min-height` 改到 20px」**没能验红**——padding 16px×2 + 行高已把渲染高度撑到 ~57px，断言照样绿（假绿）。把 padding 一起压到 `2px` 才真的红（实测 32.2×862）。**判据是渲染值不是声明值**：改 CSS token 做变异时，同时检查 padding/line-height 是否把高度托住。
- **本机直连 github.com 不通**：push 一律 SSH:22；仓库/Pages/Release 操作走 `gh` API（HTTPS 通）。
- **脱敏门红线**：入库文件与提交信息不得写本机盘符 / 用户名 / 回环代理端口；示例路径用 `<user>`/`<repo>` 占位符。临时探针脚本若写绝对路径也当场被抓——**用完立刻删**（本轮 1 个 `tmp-png-probe.mjs` 已删，只留方法与数值在 backlog 周自查记录）。
- **`gh` 是原生程序，不认 `/tmp` 与 Git Bash 路径**：`--notes-file` / 附件参数要传 `cygpath -w` 转过的 Windows 路径。
- **写源码/测试要用 Write/Edit**：hook 拦「Bash 直接写 `src/`」，**也拦向 `tests/` 的 Bash 写入**（`node -e` + `writeFileSync` 被拒）。变异自检要用 Edit 改、改完 Edit 复原（本棒 `.option` 两次 Edit 即此法）。
- **`npm run e2e` 会改写 `docs/assets/` 下 19 张截图**：跑完**不要提交这些 churn**——`git checkout -- docs/assets/` 复原（本棒跑了 4 次 e2e，已复原）。
- **`npx vitest run` 单跑 ~25–40s**：可达性三项各 ~14–25s（并行取最大），不是卡死；`npm run e2e` ≈60–90s（含 build + preview + Edge headless）。
- **node `-e` 内联脚本含 `''''`（里程碑标号）会被 bash 单引号截断**——写临时脚本文件或用 Edit 工具。
- **`python` 是 Store 占位符（exit 49 零输出）**：用 `py` 或 node。

## 六、DoD（v5-M6 运维第二棒 · 运维期无里程碑口径）

> 单源 = [00 §里程碑总表](00-README总览.md)（本棒无里程碑行，运维期入口见 [04 §运维期 ▸ 第二棒结果](04-里程碑任务分解.md)）；本档自定 DoD 如下。

- [x] 布局门开工前 + 收尾各跑一次，全绿
- [x] 全量门禁复跑（validate / story / rhythm / vitest / typecheck / e2e / license / budget / desens）全绿
- [x] 上一棒悬空批次已入库（`81e76ba`，含 2 处记录订正；订正有据）
- [x] 观察区 15 项逐项复评：4 项可查项出结论、11 项定「未满足」，**不新开队列项**
- [x] 第 8 类跨端漂移预跑（e2e 双端 + 19 张留痕截图对照）→ 无漂移
- [x] 口径补门：`tests/e2e/smoke.mjs` 触控 ≥44px 双端断言 + **验红实测通过**（32.2×862 → 红；复原 → 绿）
- [x] 第 3 类文档数字对账（含生成器稳定性实测 md5 不变）
- [x] Traffic 复核（未到期）与仓库指标采集（views 0 / clones 202 / stars 0 / issues 0）
- [x] **每条发现带可复现证据**（命令 + 输出，见 §一 表与 backlog 周自查记录）
- [x] 代码面零改动（`git diff src/` 为空，含变异探针已复原）
- [x] 布局门在收尾改动后仍全绿
- [x] 本档七节齐

**验证记录（本棒当轮实跑，2026-10-26）**：

| 命令 | 结果 |
|---|---|
| `node tools/check-sprint-layout.mjs` | **全绿**（10 条判据；`README 120/120`；`STATUS 2 处 × 19 里程碑一致`；`HANDOFFS 18 份齐`） |
| `node tools/check-desensitized.mjs` | 538 文件，0 命中（豁免 1 份） |
| `npm run validate` | **0 FAIL**（14 区；295 事件 / 覆盖 85.8% + 豁免 42 / 图标 295-295） |
| `npm run validate:story` | **七项全绿**（255 条；主句 102/117/120；选项 8/16/0%；单屏 >160 = 0） |
| `npm run validate:rhythm` | **绿**（8 局 × 8 阶段；非 critical 连片 ≤3） |
| `npx vitest run` | **403/403**（37 文件） |
| `npx tsc --noEmit` | 0 错 |
| `npm run e2e`（4 次：基线 / 新断言 / 验红 / 复原） | **双端全绿**（375 253 卡 / 1280 251 卡；单屏最长 158；**触控≥44px(最小44)** 双端）；验红轮红在 `实测 32.2×862` |
| `npm run gate:license` / `gate:budget` | 0 FAIL（512 件）/ **760.43KB ≤ 850KB** 0 WARN |
| `node tools/v5-scene-audit.mjs` | 覆盖 85.8% / 豁免 42 / 错配 38 键 52 条 = 17.6%（SI-001 未修，快照吻合） |
| `node tools/v5-scenes-doc.mjs` | 重跑 md5 不变（`55f718e6…`）——留痕表与生成器一致 |
| `gh api …/traffic/{views,clones}` + `gh repo view` + `gh issue list --state all` | views 0 / clones 202（unique 60，10-12～10-25）/ stars·forks·watchers 0 / issues 空 |

## 七、命令速查

```bash
node tools/check-sprint-layout.mjs   # 布局门（= npm run gate:layout）
node tools/check-desensitized.mjs    # 脱敏门（= npm run gate:desens）
npm run validate                     # 数据门（14 区；F 槽位 / C 线索 / S 配图）
npm run validate:story               # 文本长度 + 写实机检七项（判据面 255 条）
npm run validate:rhythm              # 节奏门（每阶段变体 ≥3）
npm test                             # vitest（运维期基线 403）
npx vitest run tests/scene-misfits.test.ts   # 配图错配棘轮（会判红）
npm run typecheck                    # tsc --noEmit
npm run e2e                          # E2E 全量（双端 + 768 + v5 开局四步；含触控 ≥44px 断言；会改写 docs/assets/ 19 张截图，跑完 git checkout -- docs/assets/ 复原）
node tests/e2e/smoke.mjs --no-build --base-url <url>   # 发布冒烟（外部静态服务/线上 Pages 同口径）
node tools/v5-scene-audit.mjs        # 配图语义审计（只读，退出码恒 0）
node tools/v5-scene-audit.mjs --json # 同上，机读
node tools/v5-scenes-doc.mjs         # 重生 docs/v5-scenes.md（改映射后必跑）
npm run gate:license                 # 许可门（实测 512 件跟踪图像）
npm run gate:budget                  # 预算门（850KB 线；实测 760.43KB）
gh api repos/<user>/<repo>/traffic/views   # Traffic 周记（clones 同路径；下一回 ≈ 2026-11-02）
gh release view v5.0.0               # Release 核对
```