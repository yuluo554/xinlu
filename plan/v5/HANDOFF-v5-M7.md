# HANDOFF-v5-M7 · v5-M6 运维第二棒 → 运维期第三棒（无既定里程碑；含 v5.0.1 补丁）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档 + [00-README总览.md](00-README总览.md)。
> 编号纪律（skill 硬约束①）：**交接单编号随棒顺延**——装订棒 HANDOFF-v5-M1、v5-M1'''' 棒 M2、v5-M2'''' 棒 M3、v5-M3'''' 棒 M4、v5-M4'''' 发布棒 M5、v5-M5 运维首查棒 M6、**本档为 v5-M6 运维第二棒收尾单（下一棒 = 运维期第三棒）**。
> 本档记录 **v5-M6 运维第二棒（2026-10-26）**：前半段做「观察区到期项复评 + 第 8 类跨端预跑 + 遗留批次入库」（HD-v5-M6 §三 第 1/2/3/5 项以**用户明示**或**到期日**为开工前提，当时未获）；后半段**用户明示三件**：**执行 SI-001（配图语义修复）→ 清仓（纹理素材）→ push**，并按版本规则发布 **v5.0.1 补丁**。

## 一、当前进度 + 证据（2026-10-26 当轮实测）

| 块 | 动作 | 证据（当轮实跑） |
|---|---|---|
| 0 布局门 | 开工前 + 每笔改动后各跑一次 | `node tools/check-sprint-layout.mjs` → **全绿**（10 条判据；`README 120/120`；`STATUS 2 处副本 × 19 里程碑一致`；`HANDOFFS 18 份齐`；`DOC_TOOLS 20 个脚本在位`）。开工基线 = 工作树 12 件悬空（上一棒未提交） |
| 1 遗留批次入库（先行） | 上一棒的 12 件悬空改动独立成笔 | `81e76ba`「v5-M5 运维首查（配图语义审计三件 + 两处文档数字漂移修复 + 棘轮测试）」；同笔订正 HANDOFF-v5-M6 §一 改动清单 2 处（缺 `plan/v5/04` 一行 / `docs/v5-scenes.md` 行数 198→197）——**订正有据**：`wc -l` 197 + 生成器重跑 md5 不变 |
| 2 全量门禁复跑（改前） | 确认发布态没漂 | validate 0 FAIL（14 区 / 295 事件）/ story 七项绿（主句 102·117·120）/ rhythm 绿 / vitest **403** / tsc 0 / license 0 FAIL（512 件）/ budget **760.43KB** / desens 538 文件 0 命中 / layout 全绿 |
| 3 观察区 15 项逐项复评 | 4 项可查项出结论，其余 11 项定「未满足」 | 结论全部落 [backlog](backlog.md) 观察区「复评」列；当时**未新开队列项**（后由用户明示开工两件，见下） |
| 4 第 8 类跨端漂移预跑 | e2e 双端 + 19 张留痕截图逐对比对 | 双端全绿（375 253 卡 / 1280 251 卡；双端单屏最长 **158**）；对照结论：图鉴 375 = 2 列 / 1280 = 4 列（同为 16 格）、图谱 375 纵排 / 1280 左图右表、关系网同构放大 ⇒ **差异全是自适应布局档，无断行·溢出·触控分叉** |
| 5 口径补门（本棒前置） | 复核交接单的「已覆盖」表述 → 发现口径裸奔 → 补机检 | HD-v5-M6 §三.2 写「E2E 的 375 断言已覆盖触控目标与行宽」= **半错**（行宽有断言，触控 ≥44px **零断言**）。`tests/e2e/smoke.mjs` 补：逐卡实测 `.event-card [data-option]` / `[data-continue]` 最小边，双端断言 ≥44px，实测值入 verdict 行（现印 `触控≥44px(最小44)`）。**验红实测**：`.option` 改 `min-height:20px + padding:2px 4px` → 红 `实测 32.2×862`；复原后绿、`git diff src/` 空 |
| 6 第 3 类文档数字对账 | 复跑值 vs 包内文档 | 与 README:60 / [00 台账](00-README总览.md) / [03](03-模块清单与验收.md) / [06](06-运维节奏.md) 所载一致（459 件 / 531 文件 / vitest 399 是历史快照）；`docs/v5-scenes.md` 生成器重跑 md5 不变 |
| 7 第 16 类修 SI-001（**用户明示**） | 一级摘出 + 二级改挂 + 重画图库 | 摘出 13 个抽象符号键（情绪/时间/氛围/社交/舞台）→ 显式豁免；宠物·玩物·影音·器乐 25 键改挂**新建四类** `pet`/`toy`/`media`/`music`（+`tired-eye`→home、`caterpillar`/`star-formation`→outdoors）；`night`/`meal` 事件归零 → 退役；**新画 11 张线稿**（pet-cat/cage、toy-jigsaw/gamepad、media-tv/radio/phone、music-guitar/piano/mic、funeral-candles）。实测：`node tools/v5-gen-scene-map.mjs` → **标签 21 类 / 图 55 张**、覆盖 **239/295 = 81.0%**、豁免 **56**；`npm run validate` → `S` 区绿（同三个数）；`node tools/v5-scene-audit.mjs` → `✅ 非场景图标已清零……错配键 0 键 / 命中事件 0 条` |
| 8 防回退（棘轮收紧到 0） | `tests/scene-misfits.test.ts` 改写 + 验红 | 快照 `0 / 0` + **阳性对照**（把黑名单任一键塞回 keyTag 副本必须数出 1）+ 覆盖率仍 ≥60% 的正向证据。**验红实测**：`sunrise` 塞回 `keyTag` → **3 项红**（含阳性对照），复原 → 5/5 绿 |
| 9 图库总览与目检 | 新工具 `tools/v5-scenes-sheet.mjs` | 用本机 Edge 无头把 55 张排成网格落盘 `docs/assets/v5-scenes-sheet.png`；目检：11 张新图主体可辨（猫/笼/拼图/手柄/电视/收音机/手机/吉他/琴键/话筒/双烛），与事件语义对应 |
| 10 清仓（**用户明示**） | 删 `assets/cc0/parchment/` 整目录 | 2 件处理版 webp（git 跟踪，`git rm`）+ 本地 jpg 留底（gitignored）一并删；[assets/README.md](../../assets/README.md) 该节改「已清出仓库」并**保留溯源文本**；[00 决策记录](00-README总览.md) 新增推翻行；`npm run gate:license` → 跟踪图像 **512 → 510 件**仍 0 FAIL |
| 11 版本与发布（**v5.0.1 补丁**） | 版本号 + CHANGELOG + 留档 + 构建 + 冒烟 + push | `package.json`/`package-lock.json` 5.0.1；CHANGELOG v5.0.1 节（含「**存档无需重开**」）；[plan/05 §十一](../05-发布留档.md) 双栏 + [v5/05 骨架指针](05-发布留档.md)；`npm run build` → `gate:budget` **761.06KB ≤ 850KB** 0 WARN；干净静态服务（`py -m http.server` 伺服 dist）**双端一键通关 + 768 + v5 自定义出生全流程 exit 0**；`dist.zip` **785,533 字节** sha256 `d5493d23…49eee0`（31 条目） |
| 12 门禁终值（改后） | 全量复跑 | validate **0 FAIL**（`S` 标签 21 / 图 55 / 覆盖 81.0% / 豁免 56）/ story 七项绿 / rhythm 绿 / **vitest 404**（37 文件；基线 403 → 404）/ tsc 0 / e2e 双端绿（含触控 ≥44px）/ license 0 FAIL（510 件）/ budget **761.06KB** / desens 547 文件 0 命中 / layout 全绿 |
| 13 Traffic（未到期，复核一次） | `gh api …/traffic/{views,clones}` + repo + issues | views **0** / clones **202**（unique 60，窗口 10-12～10-25，与首查同值，**非当日新增**）/ stars·forks·watchers 0 / `gh issue list --state all` 空 |
| 14 推送与发布留痕 | push（SSH:22）→ CI → Pages → tag v5.0.1 → Release | commit `2c37e84` push 成功（`66556c8..2c37e84`）；ci run **40353070799 success**（三 job：Methodology gates + Vitest node22/24）+ deploy-pages run **40353070810 success**；线上 https://yuluo554.github.io/xinlu/ **双端一键通关 + 768 + v5 自定义出生全流程 exit 0**（含触控 ≥44px 断言）；tag **v5.0.1 @ `2c37e84`**（annotated）+ Release https://github.com/yuluo554/xinlu/releases/tag/v5.0.1 （五部分 + dist.zip **785,533 字节** sha256 `d5493d23…49eee0`，`gh release download` 复核一致 + 解压与本地 `dist/` 逐文件一致 + 重建 dist 逐文件一致） |

**本轮改动清单（工作树，未提交）**：

| 文件 | 性质 |
|---|---|
| `tools/v5-gen-scene-map.mjs` | SI-001 修复：摘出 13 键 + 改挂四类 + 退役 `night`/`meal` + `funeral` 补第 3 张 + `TAGS` 显示名 |
| `tools/v5-gen-scenes.mjs` | 新增 11 张线稿（pet/toy/media/music/funeral-candles）、删 4 张（night/meal） |
| `assets/web-ready/scenes/*.svg` | +11 新、−4 删（净 48 → 55 张） |
| `src/data/scene-map.json` | 生成物（映射表） |
| `tools/v5-scene-misfits.mjs` / `.d.mts` | 黑名单收敛到 13 键 + `OFF_SCENE_FIXED` 修复留痕 |
| `tools/v5-scene-audit.mjs` | 输出语义改为「回归哨兵」：`✅ 已清零` 分支 + 回流键提醒 |
| `tools/v5-scenes-doc.mjs` | 留痕表：新类显示名、分类粒度/覆盖豁免行改实算、⚠ 错配段改 ✅ 修复段 |
| `tools/v5-scenes-sheet.mjs`（新） | 图库总览图生成器（Edge 无头截图；HTML 落系统临时目录，不入库） |
| `tests/scene-misfits.test.ts` | 棘轮快照 **0/0** + 阳性对照（5 项） |
| `tests/e2e/smoke.mjs` | 新增「事件卡触控目标 ≥44px」双端断言 + verdict 行打实测最小值 |
| `docs/v5-scenes.md` / `docs/assets/v5-scenes-sheet.png` | 留痕表（216 行，生成器实算）/ 总览图（55 张 / 21 类） |
| `assets/README.md` | 纹理素材节改「已清出仓库」+ 保留溯源文本 |
| `assets/cc0/parchment/*` | **删除**（2 webp + 本地 jpg） |
| `package.json` / `package-lock.json` / `CHANGELOG.md` | 版本 **5.0.1** + 补丁条目（含「存档无需重开」） |
| `README.md` | 语义配图行：55 张 / 21 类 / 覆盖 81.0% / 豁免 56 |
| `plan/05-发布留档.md` | 新增 **§十一 v5.0.1 发布留档**（双栏） |
| `plan/v5/{00,02,03,04,05,06,backlog}.md` | 台账/决策记录（+2 行）/ 口径 / 模块 5 / 运维期第二棒结果 / 留档指针 / 跨端机检口径 / 队列关闭与执行留痕 |
| `plan/v5/HANDOFF-v5-M7.md`（新） | 本档（第二棒收尾单 → 运维期第三棒入棒单，七节） |

## 二、当前事实·状态不变量（下一棒动手前必须知道）

1. **项目在运维期，无既定里程碑**：维护动力 = 可度量缺口（plan/06 总原则：**没有缺口时正确动作是不动**）。周自查 30 分钟轮转十六类。
2. **v5.0.1 已发布（补丁）**：改动面 = 配图映射 + 素材清仓（**判定核零改动、事件文本与选项一字未动、存档 schema 仍 `xinlu.save.v3`**）⇒ 存档无需重开。**tag 之后不改代码面**：后续任何 src 改动仍要进新提交、走版本规则。
3. **队列当前为空**（SI-001 ✅ 配图语义修复 / SI-002 ✅ 纹理清仓，见 [backlog](backlog.md)「已关闭」）；观察区 14 项 + 1 项已转队关闭。**没有用户明示就不开工**。
4. **配图终值（v5.0.1 起）**：**55 张 / 21 类**、覆盖 **239/295 = 81.0%**、豁免 **56 条**；新增四类 `pet`/`toy`/`media`/`music`；退役 `night`/`meal`。**改配图的三步**：改 `tools/v5-gen-scene-map.mjs` 的 `KEY_TAG`/`VARIANTS` → 改 `tools/v5-gen-scenes.mjs` 画稿 → 跑 `node tools/v5-gen-scenes.mjs && node tools/v5-gen-scene-map.mjs && node tools/v5-scenes-doc.mjs && node tools/v5-scenes-sheet.mjs`，再同步 README:60 / [docs/v5-scenes.md](../../docs/v5-scenes.md) / [plan/05 §十一](../05-发布留档.md) / [v5/00 台账](00-README总览.md) 的覆盖率数字。
5. **错配棘轮已收紧到 0/0**（`tests/scene-misfits.test.ts`）：黑名单（`tools/v5-scene-misfits.mjs` 的 `OFF_SCENE`，13 键）里任一键回流 `keyTag` 即判红；**别改成 `<=` 宽容式**，也别因为「现在是 0」删掉它——阳性对照那一条就是防它静默失效的。
6. **单屏余量仍只有 2 字**（`elder-012` 正文 118 + 选项 40 = 158，E2E 上限 160；≥148 的 11 条清单在 backlog 观察区）：任何加字的文案改动前先看那张表；**不许抬 160 线**。
7. **字数台账两个判据面**：`S.LEN2` 印 **102/117**（255 条 = 243 瘦身卡 + 12 线索解锁事件）；其中 243 条口径是 **104/118**。写台账必须标判据面。
8. **四个机检入口**：`tests/scene-misfits.test.ts`（错配棘轮，判红）/ `node tools/v5-scene-audit.mjs`（配图语义回归哨兵，只读恒 0）/ `node tools/v5-scenes-sheet.mjs`（总览图重生成）/ **`npm run e2e`（双端，含事件卡触控 ≥44px 与 L1 行宽 ≤34 字断言，判红）**。注意：**e2e 不在 CI 里**（CI 无浏览器：layout 两门 + typecheck / validate / validate:story / validate:rhythm / vitest）——触控断言只在本地跑得到。
9. **配图纪律不变**（v5/02 §十四）：映射单源 = `scene-map.json` 的 `keyTag`；变体取图用事件 id 哈希高位（`>>> 16`）；**归属判据**：图标必须是「该类场景（或场景里的核心物件）」——抽象符号（情绪/时间/氛围/社交/舞台）不得硬凑。
10. **Traffic 下一回 ≈ 2026-11-02**（发布 +7 天，这才是第一次有意义的 v5 回访）：`gh api repos/<user>/<repo>/traffic/views|clones`；基线 views 0 / clones 202（14 天窗口累计，非当日新增）。
11. **远端状态**：origin/main = `2c37e84`（本棒 v5.0.1 提交；紧随其后还有一笔收官提交补记留档与本节事实）；**tag v5.0.1 已推**；Pages 线上 = `2c37e84` 构建（deploy-pages 40353070810 success）；Release = v5.0.1（附件 sha256 复核一致）。CI / Release / 线上实开事实见 §一 行 14 与 [plan/05 §十一](../05-发布留档.md)「tag 后追加」栏。
12. **「口径有、机检无」的坑要主动查**：凡是上一棒交接单写「E2E 的 X 断言已覆盖 YYY」，**先在 `tests/e2e/smoke.mjs` 里 grep 那个判据**再信——本棒就这样补上了「触控 ≥44px」（此前只有 CSS token + 人工清单，零断言）。
13. **文档数字会反复漂移**：凡是「统计数据 + 分类说明」的段落一律脚本实算，别手抄（已中招四处：判据面 / `heart-*` 12→7 / `docs/v5-scenes.md` 行数 198→197 / 配图 48 张 19 类 → 55 张 21 类）。

## 三、下一棒待办（运维期第三棒，无里程碑）

> 没有用户明示就不开工：**运维期的正确动作多数时候是不动**。下列按优先级排：

1. **周自查第二回（≈ 2026-11-02，30 分钟）**：**Traffic 发布 +7 天回访**（首次有效观测；基线 views 0 / clones 202）+ 轮转**第 4 类「可复现性」**（同 seed 复跑全等，vitest 已有覆盖，复跑留痕即可）**或第 2 类「平衡」**（结局可达性/过易，批跑统计）。第 8 类「跨端漂移」已在本棒预跑并补了触控机检；第 3 类已对账。
2. **配图主观复核（承接 SI-001）**：新四类的 55 张图已过机检与目检，但**语义贴合度**值得在阅读中抽验（尤其 `toy`/`media` 与「兴趣班/电玩城/加班门卫室」这类事件）；反馈「图不对事」≥3 次即重开观察区项。
3. **观察区 14 项复评**（[backlog](backlog.md) 观察区）：到期可查项——`42→56 条豁免`（新增 14 条抽象符号事件，若有「这几张卡没图显得空」的反馈优先处理）、`出生证明卡 375px 滚动`（前提已机检坐实，待反馈）、`自产线稿上限`（本轮重画过一轮，观感一致）。
4. **可选**：v6 方案腿（用户明示后启动；先写方案文档沿 `plan/07–10` 先例 + 装订 `plan/v6/` 套件 + 布局门 `LEG_CONFIG` 加一行 + `WIRED_LEGS`）。

## 四、既定口径（已拍板，别再问；推翻须进 `v5/00` 决策记录）

- **判定核零改动（K11）**：三观传导 / 结局 / 调度单调 / 种子复现全部不动；任何棒都不得带判定改动。
- **零运行时依赖（K2）**：`dependencies` 恒空。配图是静态 SVG（`?raw` 内联），图谱是手绘 SVG。
- **存档 schema 沿用 v3**（`xinlu.save.v3`）：不升版本、不加字段。
- **文本口径**：主句 ≤120 / 选项 ≤10 字（中位）/ ≥20 字 ≤10% / 每题 2–3 / **单屏 ≤160（当前 158，余量 2）**；原文进 `detail`，内容零损失（不删只折叠）。
- **卡片三层与触控**：L1 行宽 ≤34 字；**L2 触控 ≥44px（机检 = E2E 双端控件最小边断言）**；L3 状态条默认折叠、读数节点不删。
- **配图路线**：自产 CC0 线稿 SVG（**55 张 / 21 类**，v5.0.1 起）已冻结；**覆盖率门线 = ≥60%**；**归属判据**见 §二.9；一图多事件（不承诺每事件独有）。
- **素材台账**：`assets/README.md` 是许可/溯源单源；**清仓不删台账文本**（可追溯靠文本，不靠二进制）——纹理素材已按此办理。
- **图谱默认 tree / ring 可切**；节点详情从 history 回查，不新增 bond 日志字段。
- **主题四款继续有效**（素纸默认；`--tex-wash: 0` 是机检事实，纹理素材已清出但仍不得再引用）。
- **版本规则**：判定/口径变化 → 主版本；新增事件/结局 → 次版本；**呈现面补丁（如本棒配图修复）→ 补丁 + CHANGELOG 声明存档是否需重开**（本棒：无需重开）。
- **发布纪律**：不虚报；tag 后不改代码面；Release 五部分 + dist.zip + sha256 复核一致；留档双栏。

## 五、环境坑（实测在案，沿 HANDOFF-v5-M6 增补）

- **`git checkout -- docs/assets/` 会把刚生成的总览图一起回滚**：e2e 会改写 19 张截图（那些 churn 不该提交），但 `docs/assets/` 下**也有要提交的留痕图**（如 `v5-scenes-sheet.png`）。跑完 e2e 复原时**要么只点单文件、要么复原后重跑** `node tools/v5-scenes-sheet.mjs`（本棒踩过：整目录复原把新总览图退回 48 张版本）。
- **变异自检必须真的压到判据线下**：首跑「只把 `.option` 的 `min-height` 改到 20px」**没能验红**——padding 16px×2 + 行高已把渲染高度撑到 ~57px，断言照样绿（假绿）；把 padding 一起压到 `2px` 才真红（实测 32.2×862）。判据是渲染值不是声明值。
- **配图三生成器有顺序依赖**：`v5-gen-scenes.mjs`（写 SVG）→ `v5-gen-scene-map.mjs`（写 scene-map.json，含死键/坏标签/覆盖率硬报错）→ `v5-scenes-doc.mjs`（写留痕表）→ `v5-scenes-sheet.mjs`（写总览图）。**删图要手动 `rm`**（生成器只写不删），否则 validate `S.EXTRA` 报孤儿图。
- **退役/新增标签会被三道门同时约束**：标签名必须小写 kebab（`^[a-z][a-z-]*$`，**不能带数字**）、每类 ≥2 张、磁盘无孤儿、`keyTag` 无死键、**每张图至少被一条事件用到**（哈希高位取模的分布决定——事件少的类要选对图数，否则必留死图；本棒 `funeral` 因此补了第 3 张）。
- **本机直连 github.com 不通**：push 一律 SSH:22；仓库/Pages/Release 操作走 `gh` API（HTTPS 通）。
- **脱敏门红线**：入库文件与提交信息不得写本机盘符 / 用户名 / 回环代理端口；示例路径用 `<user>`/`<repo>` 占位符。临时探针脚本（本轮 3 个 `tmp-*.mjs` 与 1 个 png 探针）用完立刻删。
- **`gh` 是原生程序，不认 `/tmp` 与 Git Bash 路径**：`--notes-file` / 附件参数要传 `cygpath -w` 转过的 Windows 路径。
- **写源码/测试要用 Write/Edit**：hook 拦「Bash 直接写 `src/`」，也拦向 `tests/` 的 Bash 写入；变异自检用 Edit 改、改完 Edit 复原。
- **`npm run e2e` ≈60–90s**（build + preview + Edge headless）；`npx vitest run` ≈30–40s（可达性三项各 ~30s，并行取最大）。
- **`python` 是 Store 占位符**（exit 49 零输出）：用 `py` 或 node；干净静态服务用 `py -m http.server <port> --directory dist`。

## 六、DoD（v5-M6 运维第二棒 · 运维期无里程碑口径）

> 单源 = [00 §里程碑总表](00-README总览.md)（本棒无里程碑行，运维期入口见 [04 §运维期 ▸ 第二棒结果](04-里程碑任务分解.md)）；本档自定 DoD 如下。

- [x] 布局门开工前 + 收尾各跑一次，全绿
- [x] 上一棒悬空批次已入库（`81e76ba`，含 2 处记录订正）
- [x] 观察区 15 项逐项复评（4 项可查项出结论、11 项定「未满足」）
- [x] 第 8 类跨端漂移预跑（e2e 双端 + 19 张截图对照）→ 无漂移
- [x] 口径补门：`tests/e2e/smoke.mjs` 触控 ≥44px 双端断言 + **验红实测通过**
- [x] 第 3 类文档数字对账（含生成器稳定性实测）
- [x] Traffic 复核（未到期）与仓库指标采集
- [x] **SI-001 修复**（用户明示）：一级摘出 + 二级改挂 + 退役两标签 + 新画 11 张；终值 55 张 / 21 类 / 81.0% / 豁免 56
- [x] **棘轮收紧到 0/0 + 验红实测**（含阳性对照）
- [x] **纹理素材清仓**（用户明示）：目录删除 + 台账保留溯源 + 决策记录推翻行 + 许可门复跑 510 件
- [x] **v5.0.1 补丁发布**：版本号 + CHANGELOG（存档无需重开）+ [plan/05 §十一](../05-发布留档.md) 双栏 + 构建 + 干净静态服务双端冒烟 exit 0 + dist.zip（785,533 字节 / sha256）+ push
- [x] 代码面改动全部走新提交（未在 tag 后改任何已发布面）
- [x] **每条发现带可复现证据**（命令 + 输出，见 §一 表与 backlog 周自查记录）
- [x] 布局门在收尾改动后仍全绿
- [x] 本档七节齐

**验证记录（本棒当轮实跑，2026-10-26）**：

| 命令 | 结果 |
|---|---|
| `node tools/check-sprint-layout.mjs` | **全绿**（10 条判据；`README 120/120`；`STATUS 2 处 × 19 里程碑一致`；`HANDOFFS 18 份齐`；`DOC_TOOLS 20 个`） |
| `node tools/check-desensitized.mjs` | 547 文件，0 命中（豁免 1 份） |
| `npm run validate` | **0 FAIL**（14 区；295 事件 / 图标 295-295 / `F` / `C` / **`S` 标签 21 类 + 图 55 张 + 覆盖 81.0% + 豁免 56 条**） |
| `npm run validate:story` | **七项全绿**（主句 102/117/120；选项 8/16/0%；detail 缺 0；单屏 >160 = 0） |
| `npm run validate:rhythm` | **绿**（8 局 × 8 阶段；非 critical 连片 ≤3） |
| `npx vitest run` | **404/404**（37 文件；基线 403 → 404） |
| `npx tsc --noEmit` | 0 错 |
| `npm run build` + `npm run gate:budget` | 31 件；gzip **761.06KB ≤ 850KB**，0 WARN |
| `npm run e2e` | **双端全绿**（375 253 卡 / 1280 251 卡；单屏最长 158；**触控≥44px(最小44)** 双端） |
| 干净静态服务（`py -m http.server` 伺服 dist）+ `node tests/e2e/smoke.mjs --no-build --base-url …` | **exit 0**（双端一键通关 + 768 + v5 自定义出生全流程） |
| `node tools/v5-gen-scene-map.mjs` | 标签 **21 类 / 图 55 张**；覆盖 **239/295 = 81.0%**；豁免 **56 条** |
| `node tools/v5-scene-audit.mjs` | `✅ 非场景图标已清零`（错配键 0 / 命中事件 0）；死图 0 |
| `node tools/v5-scenes-doc.mjs` / `v5-scenes-sheet.mjs` | 留痕表 216 行（md5 稳定）/ 总览图 55 张 21 类 |
| `npx vitest run tests/scene-misfits.test.ts`（验红轮） | `sunrise` 回流 → **3 项红**（含阳性对照）；复原 → 5/5 绿 |
| `npm run gate:license` | 0 FAIL（**510 件**；纹理清仓后 512 → 510） |
| `gh api …/traffic/{views,clones}` + repo + issues | views 0 / clones 202（unique 60，10-12～10-25）/ stars·forks·watchers 0 / issues 空 |
| `git push origin main`（SSH:22） | `66556c8..2c37e84` 成功；ci **40353070799 success**（3 job）+ deploy-pages **40353070810 success** |
| 线上实开：`node tests/e2e/smoke.mjs --no-build --base-url https://yuluo554.github.io/xinlu/` | **exit 0**（双端一键通关 + 768 + v5 自定义出生全流程；触控 ≥44px 最小 44） |
| `git tag -a v5.0.1` + `gh release create v5.0.1 … dist.zip` | tag @ `2c37e84` 推送成功；Release 建成功（五部分说明 + 附件） |
| `gh release download v5.0.1 --pattern dist.zip` | 785,533 字节 / sha256 `d5493d23…49eee0` **与说明一致**；解压件与本地 `dist/` 逐文件一致；`dist/` 重建到临时目录亦逐文件一致 |

## 七、命令速查

```bash
node tools/check-sprint-layout.mjs   # 布局门（= npm run gate:layout）
node tools/check-desensitized.mjs    # 脱敏门（= npm run gate:desens）
npm run validate                     # 数据门（14 区；F 槽位 / C 线索 / S 配图）
npm run validate:story               # 文本长度 + 写实机检七项（判据面 255 条）
npm run validate:rhythm              # 节奏门（每阶段变体 ≥3）
npm test                             # vitest（v5.0.1 后基线 404）
npx vitest run tests/scene-misfits.test.ts      # 配图错配棘轮（快照 0/0；会判红）
npx vitest run src/ui/scenes.test.ts            # 取图稳定 / 无死图 / 覆盖复算
npm run typecheck                    # tsc --noEmit
npm run build                        # 构建（dist/）
npm run e2e                          # E2E 全量（双端 + 768 + v5 开局四步；含触控 ≥44px；会改写 docs/assets/ 19 张截图——复原时别整目录回滚，见 §五）
node tests/e2e/smoke.mjs --no-build --base-url <url>   # 发布冒烟（干净静态服务 / 线上 Pages 同口径）
node tools/v5-scene-audit.mjs        # 配图语义回归哨兵（只读，退出码恒 0）
node tools/v5-scene-audit.mjs --json # 同上，机读
node tools/v5-gen-scenes.mjs         # 画稿 → assets/web-ready/scenes/*.svg（改画法后跑）
node tools/v5-gen-scene-map.mjs      # 映射 → src/data/scene-map.json（改 KEY_TAG/VARIANTS 后跑）
node tools/v5-scenes-doc.mjs         # 重生 docs/v5-scenes.md（改映射后必跑）
node tools/v5-scenes-sheet.mjs       # 重生 docs/assets/v5-scenes-sheet.png（图库变动后跑）
npm run gate:license                 # 许可门（实测 510 件跟踪图像）
npm run gate:budget                  # 预算门（850KB 线；实测 761.06KB）
gh api repos/<user>/<repo>/traffic/views   # Traffic 周记（clones 同路径；下一回 ≈ 2026-11-02）
gh release view v5.0.1               # Release 核对（v5.0.0 同例）
```