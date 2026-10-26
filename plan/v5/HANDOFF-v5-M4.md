# HANDOFF-v5-M4 · v5-M3'''' → v5-M4'''' 入棒单（发布 v5.0.0）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档 + [00-README总览.md](00-README总览.md)。
> 编号纪律（skill 硬约束①）：**交接单编号随棒顺延**——本档是 v5-M3'''' 的收尾单，编号 HANDOFF-v5-M4 指下一棒（v5-M4''''）。
> 本档记录 **v5-M3'''' 呈现层二（2026-10-26 收官）**：图谱双视图 + 节点详情 / 语义配图层（D9）/ 轻量线索（D10）。

## 一、当前进度 + 证据（2026-10-26 当轮实测）

| 块 | 落位 | 证据（当轮实跑） |
|---|---|---|
| 3.1 图谱双视图 | `src/ui/relations.ts`（`treeVM` / `treeSortKey` / `bondToOpacity` / `relationDetail` / `renderTree` / `renderRing`）+ `screens.ts`（`relationsScreen` 视图切换 + 清单行改按钮 + `relationDetailPanel`）+ `app.ts`（`relationView` 表现态 + 点开详情 + 换视图后重绑）+ `style.css`（`.rel-views` / `.rel-detail*` / 节点 hover） | `relations.test.ts` **21 项**（+10：层级 y 序 / 玩家恒正中 / 逐字节确定 / 婚姻双线线段数 = 边数 × 2 / 双视图产物不同 / `data-rel-node` 入口 / 详情回查 bondDeltas / 不在册返回 null / 时代卡跳过）；E2E 双视图切换 + 树层级（`getBoundingClientRect`）+ 详情面板（姓名 / 关系值 / 有记录或「还没变过」）+ 4 张截图 `docs/assets/v5-relations-{tree,ring}-{375,1280}.png` |
| 3.2 语义图库（D9） | `assets/web-ready/scenes/*.svg`（**48 张 / 19 类**）+ `src/data/scene-map.json`（`{tags, keyTag}`）+ `src/ui/scenes.ts`（`sceneTagOf` / `sceneFileOf` / `sceneCoverage`）+ `screens.ts`（`sceneImage` 内联 + `figure.ev-scene`）+ `style.css`（`.ev-scene`，375 档限高 104px）+ `tools/v5-gen-scenes.mjs` / `v5-gen-scene-map.mjs` / `v5-scenes-doc.mjs` | validate 新增 `S` 区（`S.TAG` 19 类 / `S.FILE` 实物在位 / `S.EXTRA` 无孤儿 / `S.KEY` 无死键 / `S.COVER` 253/295 = **85.8%** ≥60%）；`scenes.test.ts` **9 项**（含「无死图」——每张图至少被一条事件用到）；逐张对文案 [docs/v5-scenes.md](../../docs/v5-scenes.md)（183 行）+ 总览图 `docs/assets/v5-scenes-sheet.png`；E2E 配图断言（≥10 张卡带图 / ≥6 张不同场景图 / 文件名合法） |
| 3.3 轻量线索（D10） | `src/data/clues.json`（6 条）+ `src/engine/clues.ts`（`pendingClue` / `resolveClue` / `unlockEventIdOf` / `CLUE_FLAGS`）+ `events.json` 增 **12 条** `pre` 门槛事件（`tools/v5-add-clues-events.mjs`）+ `icon-map.json` 补 12 条（`tools/v5-add-clues-icons.mjs`）+ `screens.ts` `clueScreen` + `app.ts` `renderClueCard` + `style.css` `.clue-card` | validate 新增 `C` 区（形状 / 引用闭合 / 阶段一致 / 文案长度 / flag 唯一 / 每阶段 ≤1 / **`C.UNLOCK` 解锁事件 `pre` 必须真含该 flag**）；`clues.test.ts` **16 项**（含 **36 局全程实证：6 条线索 100% 触发 + 6 个锚事件 36/36 被抽到**）；E2E 线索卡（2–3 观察 + 2 解读 + 无三观增量读数 + 一局至少遇到 1 次） |

**出口门实测（2026-10-26 当轮）**：布局门全绿（`DOC_TOOLS 12 个脚本全部在位`、`README 119/120`、`STATUS 2 处副本 × 19 里程碑一致无缺行`、`HANDOFFS 17 份齐`）/ 脱敏门 529 文件 0 命中 / 许可门 0 FAIL（459 件）/ 预算门 31 件 **760.43KB ≤ 850KB** 无 WARN（+14.38）/ validate 0 FAIL（295 事件，`--full`）/ validate:story 七项绿（255 条）/ validate:rhythm 绿 / vitest **399/399**（基线 364，+35）/ typecheck 0 / e2e 双端一键通关 + v5 开局四步与自定义出生全流程 / 变异自检 **24/24**（`node tools/tmp-mutate-v5m3.mjs`，12 组）。

## 二、当前事实·状态不变量（下一棒动手前必须知道）

1. **vitest 基线升到 399**（只加不减）：v5-M3'''' 增量 35 项 = `relations.test.ts`（+10）+ `scenes.test.ts`（9）+ `clues.test.ts`（16）。
2. **图谱有两套布局，同一个出口**：`relationsVM`（环，沿 v3，继续服务右列清单行序与旧断言）与 `treeVM`（树，默认）。`renderRelations(npcs, view)` 是唯一渲染出口，快照与图谱页共用。**别把 renderRelations 的默认参数改掉**——终局快照 `relations-snapshot` 走默认值。
3. **图谱边必须是 `<line>`，不能换 `<path>`**：E2E 用 `[data-relations-chart] svg line` 数边、`svg g` 数节点。树的「正交折线」是逐段 `<line>` 拼出来的；环视图的曲线是 `<path>`（只在 ring 视图出现，E2E 不数它）。
4. **公共母线单独画一次**：多子女共用的竖/横段若不抽出来，每个孩子各画一遍同一段，**最后画的那条 tag 色会盖住其余**——颜色的归属变成「谁最后画」。母线用中性导线色（`--ink-3`，opacity .55）。
5. **配图映射单源 = `scene-map.json` 的 `keyTag`**（`objectKey → 标签`），由 `tools/v5-gen-scene-map.mjs` 从 icon-map 派生；`assets/web-ready/scenes/*.svg` 是实物。**改映射要重跑 `tools/v5-scenes-doc.mjs`**，否则 `docs/v5-scenes.md` 的逐张表过期。
6. **配图变体取图用哈希高位**（`variantIndex` = `hash >>> 16 % n`）。低位取模与事件 id 尾部强相关（实测 rain 3 条全撞一张），`scenes.test.ts` 的「无死图」断言会拦。
7. **豁免是「不渲染」而不是「渲染空框」**：`sceneImage(null)` 返回空串，`figure.ev-scene` 节点根本不存在。E2E 用「无图标卡 ≤ 豁免数」的既有口径，配图侧不重复判。
8. **线索判定零随机、零三观改动**：`resolveClue` 只把 flag 并进 `state.flags`（其余字段原样）。改这一条会同时打掉 `clues.test.ts` 的「不动判定核」与「36 局可复现」。
9. **线索 flag 只写在 `clues.json`**：validate `C.FLAG` 反向扫「以 `clue-` 开头但 clues.json 未声明」的 flag。事件库的 `pre` 可以引用它们（validate 启动时先把 `clues.json` 的 flag 注入 `flagsDefined`）。
10. **12 条解锁事件的真约束**：`pre` 必须含对应 flag（`C.UNLOCK`）、阶段与线索一致、月龄在锚事件之后且不晚于本阶段最早 critical（`E.AGE` ③）——**改月龄要同时改 `ageHint`**（`E.AGE` 要求两者解析值全等）。
11. **线索卡的 e2e 钩子**：`.screen-clue[data-clue]`（挂在 `section` 上，不是后代！本轮首跑踩过 `[data-clue]` 后代选择器）、`[data-clue-prompt]`、`[data-clue-choice]`。
12. **`tools/` 本棒新增四个脚本**：`v5-gen-scenes.mjs`（48 张图稿源，可重跑覆盖）、`v5-gen-scene-map.mjs`（映射派生 + 死键/坏标签硬报错）、`v5-scenes-doc.mjs`（留痕表重生成）、`v5-add-clues-events.mjs` / `v5-add-clues-icons.mjs`（幂等 upsert）。`tmp-mutate-v5m3.mjs` 名字带 tmp 是有意的（不是门，只作留档，可复跑）。

## 三、下一棒待办（v5-M4'''' 发布 v5.0.0，顺序不可颠倒）

> DoD 单源 = [00 §里程碑总表](00-README总览.md) v5-M4'''' 行；执行视图 = [04 §v5-M4''''](04-里程碑任务分解.md)；留档骨架 = [05-发布留档.md](05-发布留档.md)。

| 步 | 内容 | 出口判据 |
|---|---|---|
| 4.1 | **构建 + 干净静态服务双端冒烟**：`npm run build` → 起干净静态服务 → `node tests/e2e/smoke.mjs --base-url <url>` | 双端一键通关；不得只看本地 preview |
| 4.2 | **Pages 部署 + 实开复核**：push → ci + deploy-pages 双 success → 线上 `--base-url` 再跑一次冒烟 | 远端 run 号与结论落档（**CI 日志实证，非本地等价**）；不虚报 |
| 4.3 | **CHANGELOG v5.0.0**：数据口径版本 + 文本口径与判定呈现变化 → **历史存档建议重开** | 三件事逐条写明；与 v5/02 口径一致 |
| 4.4 | **plan/05 追加 §十 v5.0.0 节主体（tag 前）** | 两栏齐：tag 时点事实 / tag 后追加事实；覆盖对账小节 |
| 4.5 | **tag v5.0.0 → Release（五部分 + dist.zip + sha256）** | 五部分齐；`dist.zip` 的 sha256 与本地复算一致 |
| 4.6 | 留档「tag 后追加」分栏 → 两处状态副本翻 ✅ → 台账 ✅ → **HANDOFF-v5-M5**（收官单） | 布局门全绿；README ≤120 行 |

**公共出口门**：全门绿终值留痕 + 三件套 + README 增量不破 120 行门（`LAYOUT.README` 机检）。

**评审门（强核查）**：CHANGELOG 口径 ↔ v5/02 §十四 ↔ 实现三方一致；发布物（dist.zip / Pages）与 tag 提交一一对应；**tag 之后不得再改代码面**。

**收尾顺序（固定）**：DoD 验证 → 两处状态副本 v5-M4'''' ⬜→✅ → v5/00 台账 ✅ → v5/03 模块 6 收口 → 写 **HANDOFF-v5-M5**（收官单，编号随棒顺延）→ commit。

## 四、既定口径（已拍板，别再问；推翻须进 `v5/00` 决策记录）

- **判定核零改动（K11）**：三观传导 / 结局 / 调度单调 / 种子复现全部不动；**发版不得带判定改动**。
- **零运行时依赖（K2）**：`dependencies` 恒空。配图是静态 SVG（`?raw` 内联），图谱是手绘 SVG，均不经运行时库。
- **存档 schema 沿用 v3**（`xinlu.save.v3`）：线索走既有 `flags` 通道，**不升版本、不加字段**。
- **图谱默认 tree / ring 可切**；节点详情从 history 回查，不新增 bond 日志字段。
- **配图路线已定为自产 CC0 线稿 SVG**（48 张 / 19 类），偏离原「CC0 照片」口径的**理由与实测数据已留痕** [docs/v5-scenes.md](../../docs/v5-scenes.md) §一 + [00 §决策记录](00-README总览.md)。发版说明里如实写「自产线稿」。
- **主题四款继续有效**；素纸是默认。
- 产品/赛事/制度名可入文，**真实机构名/真人名不写**；配图素材沿 v4 纪律：CC0 优先、逐张对文案留痕、不虚构不误导。
- **发布纪律**：不虚报——push 不通就写不通；tag 后不改代码面；Release 五部分 + dist.zip + sha256 复核一致。

## 五、环境坑（实测在案）

- **本机直连 github.com 不通**：push 一律 SSH:22；仓库/Pages/Release 操作走 `gh` API（HTTPS 通）。
- **脱敏门红线**：入库文件与提交信息不得写本机盘符 / 用户名 / 回环代理端口；示例路径用 `<user>`/`<repo>` 占位符。**临时探针脚本若写了绝对路径，脱敏门会当场抓到**（本轮踩过：`tests/tmp-probe-scenes.test.ts` 4 处命中）——探针用完立刻删，或一开始就写相对路径。
- **gh 是原生程序，不认 `/tmp` 路径**：`--notes-file` / 附件参数要传 `cygpath -w` 转过的 Windows 路径。
- **e2e 冒烟**：`node tests/e2e/smoke.mjs`（本地 build+preview）／`--no-build --base-url <url>`（外部静态服务或线上 Pages，同一口径）。**本轮新增 4 张截图**：`v5-relations-tree-{375,1280}.png` / `v5-relations-ring-{375,1280}.png`——提交前确认是有意更新。
- **写源码要用 Write/Edit**：本环境有 hook 拦截「Bash 直接写 src/」——批量改请用 `tools/` 下脚本（`v5-add-clues-events.mjs` 等已按此实现），不要在 Bash 里 `>` 重定向写 `src/`。
- **变异自检的调用方式**：Windows 上 `execFileSync("npx", …)` 不认 `.cmd` 外壳——脚本内要 `run(process.execPath, [node_modules/vitest/vitest.mjs, "run", file])`。
- **截图要等换屏淡入动画**：图谱页截图若不等（本轮用 `sleep(700)`），拍到的是半透明帧，整页发白。
- **vitest 单跑 ~20–35s**：可达性两项各 ~33s（并行取最大），不是卡死。
- **`import.meta.glob` 的 `?raw` 会把 48 张 SVG 内联进 bundle**：这是有意的（省请求、随主题变量联动），代价是 JS bundle +14KB gzip。

## 六、DoD 逐项 checklist

**v5-M3''''（本档所在，已收官）**：

- [x] 3.1 图谱双视图：`treeVM` 三代纵向（tree 默认）+ 关系网曲线重做（亲疏 = 线宽 × 透明度）+ 节点详情（history 回查 bondDeltas）+ 正交母线 + 婚姻双线
- [x] 3.2 语义图库（D9）：19 类标签 + **48 张自产 CC0 线稿**（原始 34KB）+ `scene-map.json`（`objectKey → 标签`）+ 卡片上半屏（年份戳之下）+ 覆盖 85.8% + 豁免 42 条显式 + 逐张对文案 `docs/v5-scenes.md`
- [x] 3.3 轻量线索（D10）：`clues.json` 6 条（每阶段 1 处）+ `clues.ts` 纯 flag 判定（零随机）+ 12 条 `pre` 门槛解锁事件 + 线索卡 UI
- [x] 出口门：validate 0 FAIL（295 事件 + `C`/`S` 两区）/ validate:story 七项绿 / validate:rhythm 绿 / vitest **399**（+35）/ typecheck 0 / e2e 双端全绿 / 布局·脱敏·许可·预算（760.43KB）全绿
- [x] 变异自检 **24/24**（`node tools/tmp-mutate-v5m3.mjs`，12 组）
- [x] 计划面翻齐：两处状态副本 v5-M3'''' ✅ + v5/00 台账三行 ✅ + v5/00 决策记录七行 + v5/02 §十四 增补 + v5/03 模块 4 ✅ / 5 ✅ / 6 🟡 增量 + v5/04 执行结果 + v5/backlog 观察区 +4 项 + README 119/120
- [x] 本档七节齐

**v5-M4''''（下一棒）**：见 §三 六步表，每步各自 DoD 未勾。

**验证记录（本棒当轮实跑，2026-10-26）**：

| 命令 | 结果 |
|---|---|
| `node tools/check-sprint-layout.mjs` | **全绿**（10 条判据；`DOC_TOOLS 12 个脚本全部在位`；`README 119/120 行；状态表 23 行`；`STATUS 2 处副本 × 19 个已接门里程碑 状态全一致且无缺行`；`HANDOFFS 17 份齐`） |
| `node tools/check-desensitized.mjs` | 529 文件，0 命中（豁免 1 份） |
| `npm run validate`（`--full`） | **0 FAIL**（295 事件；新增 `C` 轻量线索 + `S` 语义配图两区；图标 295/295；F 区绿；偶遇 40 条） |
| `npm run validate:story` | **绿（七项）**：S.LEN 255 / S.ERA 255 / S.SENSE 255 / S.REF 122；主句 102/117/120；选项 8/16/0%；detail 0 缺/0 超长/0 非前缀；单屏 >160 = 0 |
| `npm run validate:rhythm` | **绿**：8 局 × 8 阶段，每阶段 4–5 种变体、非 critical 段连片 ≤3 |
| `npx vitest run` | **399/399**（36 文件；~21s） |
| `npx tsc --noEmit` | **0 错** |
| `npm run e2e` | **全绿**（375/1280 双端一键通关 + 线索卡 + 配图 ≥10 张卡 / ≥6 张图 + 图谱双视图/树层级/节点详情 + 四步开局 + v4 自定义出生段；单屏最长 158 字） |
| `npm run build` + `gate:budget` | 31 件，gzip **760.43KB ≤ 850KB**，无 WARN（+14.38：配图 48 张内联 + 图谱/线索代码） |
| `npm run gate:license` | 0 FAIL（459 件；scenes 落在既有白名单 `assets/web-ready/`，无需新增署名行） |
| `node tools/tmp-mutate-v5m3.mjs` | **12 组 / 24 项全符合预期**（图谱 4 组 / 配图 4 组 / 线索 4 组；逐条报红并复原绿） |

## 七、本棒抓出的真缺陷（写进档，供下一棒复用判别口诀）

1. **家谱树画成交叉网（3.1）**：首版每位家长连每个孩子，全是斜穿对角线，看起来不像家谱。处置 = **正交母线**（一根竖母线 + 横向分叉）。判别口诀：**「树」的结构信号是走线正交与分叉点，不是「有层级就算树」**——层级只保证了 y 序，观感要另外治。
2. **母线颜色被最后一个孩子盖住（3.1）**：多子女共用同一段母线，每个孩子各画一遍 → 最后画的那条 tag 色盖住其余，颜色归属变成「谁最后画」。处置 = 公共段抽出来用中性导线色画一次。判别口诀：**同一条视觉元素被 N 个对象重复绘制时，它的样式就是「最后一个」的样式——要么只画一次，要么明确谁说了算。**
3. **线稿 46 张长得一样（3.2）**：首版每张右侧堆三个无意义方框当「背景建筑」凑画面。总览目检一眼看出。处置 = **一张只有一个主体、居中放大**。判别口诀：**「一套图」不等于「一个模板」**——共用画法（画布/线宽/配色）是好的，共用填充物会让 48 张变成 1 张。
4. **配图与文案错配（3.2）**：`windchimes`（摇篮转铃）映射到 `relic`，「信封」图挂在婴儿摇篮卡下；「办健身卡」配「病房」；「公园打拳」配「病房」；「徒弟开厂」配「家门」。处置 = ①按「事件发生在哪」重新归类；②**拆出不存在的类**（新增 `outdoors`），而不是硬塞进最近的类。判别口诀：**类目不够细就会硬塞**——错配的信号往往不是「映射写错了」，而是「这个类根本不该收这条」。
5. **哈希低位取模导致变体全撞（3.2）**：`hash % n` 与事件 id 尾部强相关（`infant-015` / `toddler-015` / `toddler-602` 的低比特全是 0），rain 3 条全落同一张、meal 4 条撞 3 张，「每类 ≥2 张变体」形同摆设。处置 = 用**高位**（`>>> 16`）+ 补「无死图」门。判别口诀：**「我有 N 个槽」不等于「N 个槽都在用」——分布要机检，别靠想。**
6. **婚姻双线判据是假门（3.1）**：首版断言 `marriage 线段数 ≥ 2`，但父母一对 + 伴侣一对本来就 ≥2 段，退化成单线依然通过。变异自检报「未红」才发现。处置 = 断言 `线段数 = 边数 × 2`。判别口诀：**下界断言要问「最坏情况是什么」——如果最坏情况也满足下界，这条断言没在判任何东西。**
7. **线索随机化不可观测（3.3）**：想用「变异成随机取线索」验证可复现断言，结果不报红——因为 6 条线索在固定 state 下只有 1 条 pending，随机起点也还是它。处置 = 换成「忽略阶段门槛」变异（这条真能观测）。判别口诀：**变异要选「判据面真会被改变」的那个维度**，否则你以为在验门，其实在验运气。
8. **新屏未接 E2E 驱动（3.3）**：新增线索卡后 e2e 首跑直接 `stuck:screen screen-card screen-clue`——轮询不认识新屏。处置 = 补驱动分支 + 采集 + 断言。判别口诀：**新增一个屏 = 新增一条 e2e 分支**，不是「等它出现再断言」（后者会静默跳过）。
9. **选择器挂在自己身上（3.3）**：`[data-clue]` 挂在 `section.screen-clue` 上，写成 `.screen-clue [data-clue]`（后代选择器）永远找不到。处置 = `.screen-clue[data-clue]`。判别口诀：**同一个元素既当容器又当锚点时，后代选择器必然落空。**
10. **截图拍在淡入动画中途（3.1 留痕）**：图谱页截图整页发白——`.screen` 有淡入动画，`captureScreenshot` 抢在动画中。处置 = 等 700ms 再拍（或等 `animationend`）。判别口诀：**任何「截出来怪怪的」先怀疑时机，再怀疑样式。**
11. **脱敏门抓自己的临时探针（环境坑连带）**：为目检写的 `tests/tmp-probe-scenes.test.ts` 里写了绝对盘符路径，脱敏门当场 4 处命中。处置 = 探针用完立刻删；要留就写相对路径。判别口诀：**临时脚本也进扫描面**——「跑完就删」是纪律，不是可选项。
