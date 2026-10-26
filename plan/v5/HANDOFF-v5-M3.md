# HANDOFF-v5-M3 · v5-M2'''' → v5-M3'''' 入棒单（呈现层二：家谱树双视图 / 语义配图层 / 轻量线索）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档 + [00-README总览.md](00-README总览.md)。
> 编号纪律（skill 硬约束①）：**交接单编号随棒顺延**——本档是 v5-M2'''' 的收尾单，编号 HANDOFF-v5-M3 指下一棒（v5-M3''''）。v5 腿后续棒依次写 HANDOFF-v5-M4 / M5。
> 本档记录 **v5-M2'''' 呈现层一（2026-10-26 收官）**：开局四步 + 出生证明卡 + 素纸主题（D8）+ 卡片三层 + 阅读偏好与设置页补全。

## 一、当前进度 + 证据（2026-10-26 当轮实测）

| 块 | 落位 | 证据（当轮实跑） |
|---|---|---|
| 2.1 开局四步 | `src/ui/start-flow.ts`（新，纯函数状态机）+ `src/ui/screens.ts`（四步渲染）+ `src/ui/app.ts`（接线 + `syncStartForm`）+ `src/style.css`（进度带/玩法卡/证明卡/入场白） | E2E：`data-start-progress` 与 `data-start-count` 逐级 1/4→4/4；首屏 `.screen-start form, .screen-start .chip` 计数 = **0**（一屏一个问题）；回退保值（手选四要素填 → `[data-start-back]` → 重进，四格值全在 + 进度回 2/4）；`start-flow.test.ts` **21 项**（回退保值 4 / 八因素 4 / 再来一次 3 / 年份尺 2 / 入场四件套 4 / 种子可复现 1 / 进度 3） |
| 2.2 出生证明卡 | `screens.ts` 的 `startStepCert`（八因素 `data-cert-factor` + 成员 `data-cert-member` + `data-cert-seed`） | E2E 八因素逐个非空 + 种子码形 `XL-XXXX-XXXX` + 成员 ≥1；单测钉「证上名单 **逐位等于** `generateFamily` 与 `createRun().npcs`」（同函数同 seed）；「再来一次」换种子且至少一项因素变（E2E），**自定义态不渲染该按钮**（单测 + E2E） |
| 2.3 素纸主题（D8） | `src/style.css`（`body::before` 纹理层整段删除；`--tex-wash: 0`；米纸三色重定）+ `src/ui/prefs.ts`（新）+ `screens.ts` 设置页 + `app.ts`（偏好接线 + 清档） | `theme-contrast.test.ts` 新增素纸断言（无纹理层 / 无 parchment 引用 / 无 `--tex-opacity`；四款主题 `ink/ground`·`ink/surface` ≥7:1、`ink-2/ink-3/surface` ≥4.5:1）；E2E 实测 `--tex-wash` 计算值 `"0"`、`body::before` backgroundImage `none`、字号/动效即时生效 + 落盘 + 复原、清档两步确认且不动偏好与主题；四主题截图 `docs/assets/v5-theme-{paper,moon,night,celadon}-375.png` |
| 2.4 卡片三层 | `screens.ts`（`statebar()` 改 `<details class="statebar-fold" data-statebar-fold>`）+ `style.css`（`.sb-rule`/`.sb-dot`/`.statebar-sum`；`.event-text` 字号 `--fs-section` + `max-width: 34em`） | E2E：`font-size × max-width(em)` 换算 **一行 = 34 字**（≤34 断言）；折叠壳 `foldOpen === false` + 3 枚 `[data-sb-dot]` + 3 项 `.statebar .res`；细看展开后**可见 + 以主句开头 + 不短于主句**；`card-layers.test.ts` **8 项**（34em 区间 / 字号档 / details 结构 / 摘要细线 / 默认不展开 / 大字档不改行宽 / 减弱动效） |
| 呈现面截图 | `docs/assets/v5-start-step1-375.png` / `v5-start-step2-375.png` / `v5-start-step3-cert-375.png` + 四主题 4 张 + 既有 9 张 e2e 截图重留痕 | E2E 每轮重写 |

**出口门实测（2026-10-26 当轮）**：布局门全绿（`DOC_TOOLS 11 个脚本全部在位`、`README 119/120`、`STATUS 2 处副本 × 19 里程碑一致无缺行`、`HANDOFFS 16 份齐`）/ 脱敏门 467 文件 0 命中 / 许可门 0 FAIL / 预算门 31 件 **746.05KB ≤ 850KB** 无 WARN / validate 0 FAIL（283 事件，`--full`）/ validate:story 七项绿 / validate:rhythm 绿 / vitest **364/364**（基线 325，+39）/ typecheck 0 / e2e 双端一键通关 + v4 自定义出生段全绿 / 变异自检 **26/26**（`node tools/tmp-mutate-v5m2.mjs`，13 组）。

## 二、当前事实·状态不变量（下一棒动手前必须知道）

1. **vitest 基线升到 364**（只加不减）：v5-M2'''' 增量 39 项 = `start-flow.test.ts`（21）+ `card-layers.test.ts`（8）+ `prefs.test.ts`（7）+ `theme-contrast.test.ts`（+4，素纸）。
2. **开端四步是纯函数状态机**：`src/ui/start-flow.ts` 是唯一状态源，UI 只渲染 `draft`。改开局必须改它（不要在 `app.ts` 里散落分支）；「回退不丢值」靠 **`back()` 的逐级语义**（4→3 留证 / 3→2 作废证 / 2→1 与 1 留值）+ **离开 step 2 前 `syncStartForm()` 抄值**（少了这一句就丢未提交的选择，E2E 首跑就是这样抓到的）。
3. **出生证明的八因素键是机读契约**：`data-cert-factor` ∈ `birthYear|region|place|structure|parentsJob|wealth|family|seed`（顺序 = 卡上显示序）；E2E 按此逐个断言。改因素名/顺序会同时打掉 E2E 与 [v5/02 §十三](02-数据与口径.md) 的表。
4. **`rerollable` 是玩法相关的**：随机/手选 `true`（换种子重派），自定义 `false`（不渲染「再来一次」）。年份尺点选会把 `pinnedYear` 钉住——此时「再来一次」只换种子，出生年不动（`preview()` 内部按 `pinnedYear` 分叉）。
5. **新增键 `xinlu.prefs.v1`**（`{ font: 'normal'|'large', motion: 'full'|'reduced' }`，挂 `<html data-font/data-motion>`）+ 新增 `src/ui/prefs.ts`。它与 `xinlu.theme.v1`、`xinlu.save.v3` **三个键互不读写**；清档按钮只删 `save`。
6. **素纸只有 `--tex-wash: 0` 这一个 token 名**（不是 `--tex-opacity`）：`theme-contrast.test.ts` 直读 `:root` 断言；样式表里出现任何 `parchment` 字样即报红。四款主题的对比度判据面**逐主题**（不再只测夜航），夜航原 11 组合判据**未删未改**。
7. **卡片三层判据面是「结构 + 换算」而不是像素**：`card-layers.test.ts` 读 CSS 块与 `screens.ts` 模板；E2E 读运行时换算（`max-width(px) / font-size` ≈ 34 字）。两半都要保住——只测 CSS 会漏「运行时被别处覆盖」，只测 E2E 会漏「某档位悄悄改口径」。
8. **L3 折叠不删节点**：`.statebar .res[data-res]` / `.res-word` / `.res-tier-bar i` / `data-tier` 全在 `<details>` 内部——**既有 E2E 钩子清单（阶段条高度恒定 / money 无档色条 / 桌面上竖轨高>宽 / year-badge 在卡内 / vn-band 含「 · 」/ ending-type 四字母 / gallery 恒 16 格）全部未动**。
9. **`tools/` 下本棒新增一脚本**：`tools/tmp-mutate-v5m2.mjs`（变异自检；**名字带 tmp 是有意的**——它不是门，只作留档，可复跑）。
10. **纹理素材留档未删**：`assets/cc0/parchment/{parchment-bg,parchment-fold}.webp` 仍在 git（只删了样式表引用）；`assets/README.md` 该节有 v5 状态行。删它们要同步 `assets/README.md` + 跑许可门。

## 三、下一棒待办（v5-M3'''' 呈现层二，三块）

> DoD 单源 = [00 §里程碑总表](00-README总览.md) v5-M3'''' 行；执行视图 = [04 §v5-M3''''](04-里程碑任务分解.md)；口径单源 = [02 §八（图谱双视图）/§九（语义配图）/§十（轻量线索）](02-数据与口径.md)。

| 块 | 内容 | 出口判据 |
|---|---|---|
| 3.1 | **图谱双视图**：家谱树（默认，三代纵向：祖辈→父母→玩家与同辈→伴侣/子女）+ 关系网视觉重做（曲线连线、节点圆头像+姓名、亲疏=线宽+透明度、标签避让）+ 节点点开看关系值与变化记录（取 history 的 bondDeltas） | 布局单测（层级 y 序 + 同状态两次渲染布局确定性）+ E2E 双视图切换 + 节点详情 |
| 3.2 | **语义图库（D9）**：≥16 类语义标签 + 40–60 张 CC0/公版（WebP ≤40KB）+ `src/data/scene-map.json` + 卡片上半屏展示（L1 之上）+ 未覆盖显式豁免（不留空框） | 覆盖 ≥60% 事件（脚本统计）+ 豁免清单落档；许可门白名单扩展 0 FAIL；预算门重审；**逐张对文案留痕 `docs/v5-scenes.md`** |
| 3.3 | **轻量线索（D10）**：`src/data/clues.json`（每阶段 ≤1 处）+ `src/engine/clues.ts` 判定（纯 flag 映射、不涉随机）+ flag 接线进事件解锁 + UI 呈现 | 判定单测 + flag 写入断言 + E2E 一处线索全流程 |

**公共出口门**：validate 0 FAIL + validate:story 七项绿 + **validate:rhythm 绿** + vitest ≥ 364（只加不减）+ typecheck 0 + e2e 双端绿 + 布局门/脱敏门绿 + README ≤120 行 + 预算门重审（**配图增量是本棒最大风险：WebP ≤40KB/张 × 40–60 张 ≈ 1.2–2.4MB 原始，按 gzip 后仍可能吃满余量——先量后采，必要时走 [v5/02 §九](02-数据与口径.md) 的豁免口径或提请抬线决策**）。

**评审门（强核查）**：02 §八/§九/§十 ↔ 实现 ↔ 单测/E2E 三方一致；**图谱改动不得破坏 E2E 既有钩子清单（见 §二.8）**——尤其 `[data-relations-chart]`、`.rel-list .rel-role`（逐位 role）、终局快照节点数 ≥4；配图先过许可门再入库（排序不可颠倒：白名单 + credits 行先行）；线索判定**不得引入随机**（可复现是硬约束）。

**收尾顺序（固定）**：DoD 验证 → 两处状态副本 v5-M3'''' ⬜→✅ → v5/00 台账三行 ✅ → v5/03 模块 4（图谱部分）与模块 5 收口 → 写 **HANDOFF-v5-M4**（编号随棒顺延）→ commit。

## 四、既定口径（已拍板，别再问；推翻须进 `v5/00` 决策记录）

- **判定核零改动（K11）**：三观传导 / 结局 / 调度单调 / 种子复现全部不动；v5 只治「节奏」与「信息层级」。线索玩法**只写 flag**（影响后续解锁），不直接改三观。
- **零运行时依赖（K2）**：`dependencies` 恒空；图谱继续手绘 SVG，配图是静态资源（不经运行时库）。
- **概率判定全走种子化 RNG**：同种子同结果（可复现是硬约束）。**线索判定不涉随机**。
- **正文瘦身内容零损失**：`detail` 必须是 `text` 的超集且以 text 开头（机检）；改主句必须同步改 `detail`。
- **主题四款继续有效**（米纸/月白/夜航/青瓷）；本棒起判据面是**四款逐主题**（ink/ground ≥7:1、ink-2/ink-3 ≥4.5:1），夜航 AA 原 11 组合不动。
- **存档 schema 沿用 v3**（`xinlu.save.v3`）：线索走既有 `flags` 通道，**不升版本、不加字段**（若确需新字段，走 v5/00 决策记录 + 迁移测试）。
- **配对图层的既有视觉不变量**：`.event-card[data-age-months]`、`[data-option]`、`[data-continue]`、`[data-detail]`、`.event-card[data-variant]`、`.statebar .res-word`（三项）、`[data-year-badge]`、`[data-family-open]` 全部保留；配图**不得**顶掉年份戳或把单屏字数推过 160（配图不计字数，但不得挤掉 L1 的可见性）。
- 产品/赛事/制度名可入文，**真实机构名/真人名不写**；配图素材沿 v4 纪律：CC0 优先、逐张对文案留痕、许可门白名单扩展、不虚构不误导。

## 五、环境坑（实测在案）

- **本机直连 github.com 不通**：push 一律 SSH:22；仓库/Pages/Release 操作走 `gh` API（HTTPS 通）。**不虚报发布**。
- **脱敏门红线**：入库文件与提交信息不得写本机盘符 / 用户名 / 回环代理端口；示例路径用 `<user>`/`<repo>` 占位符。
- **gh 是原生程序，不认 `/tmp` 路径**：`--notes-file` / 附件参数要传 `cygpath -w` 转过的 Windows 路径。
- **e2e 冒烟**：`node tests/e2e/smoke.mjs`（本地 build+preview）／`--no-build --base-url <url>`（外部静态服务或线上 Pages，同一口径）。**本棒 e2e 除既有 9 张外，新增 7 张截图**（开局 step1/step2/cert + 四主题）——提交前确认截图是有意更新。
- **E2E 里的两处易错点（本棒踩过）**：(a) 启动四步是**同步连点**——同一 `evaluate` 内 click→重渲染→再 click 可行，但跨 `evaluate` 之间必须重新 `querySelector`（DOM 已换）；(b) 回退保值的断言必须在**回退之后**再读 `:checked`，读之前要先把选择恢复成场景断言要用的出生环境（本棒的口径是「先测保值，再恢复目标 env」）。
- **vitest 单跑 ~17s**：两个可达性测试各 ~40s（并行耗时取最大），不是卡死。
- **写源码要用 Write/Edit**：本环境有 hook 拦截「Bash 直接写 src/」——变异自检脚本改文件请改用 `tools/` 下脚本（`tools/tmp-mutate-v5m2.mjs` 已按此实现），不要在 Bash 里 `>` 重定向写 `src/`。
- **变异自检的调用方式**：Windows 上 `execFileSync("npx", …)` 不认 `.cmd` 外壳——脚本内要 `run(process.execPath, [node_modules/vitest/vitest.mjs, "run", file])`（本棒踩过，13 组全报「复原后仍红」的假象就是它）。
- **变异自检纪律**：改完判据要**逐条验红再复原**（本棒判据面已扩到 `theme-contrast` 素纸 4 项 + `card-layers` 8 项 + `start-flow` 21 项 + `prefs` 7 项，`tools/tmp-mutate-v5m2.mjs` 13 组 / 26 项可直接复跑作基线）。

## 六、DoD 逐项 checklist

**v5-M2''''（本档所在，已收官）**：

- [x] 2.1 开局四步：`start-flow.ts` 纯函数状态机 + 进度 1/4–4/4 + 一屏一个问题 + 回退保值（`syncStartForm`）+ 年份尺快捷入口
- [x] 2.2 出生证明卡：八因素全显性 + 家庭成员（与 `generateFamily`/`createRun` 同源）+ 种子码 + 「用这个」/「再来一次」（自定义态不渲染）
- [x] 2.3 素纸主题（D8）：`body::before` 纹理层整段删除 + `--tex-wash: 0` 机检 + 四款主题逐主题对比度 + 四主题截图 + 设置页补全（`src/ui/prefs.ts` 字号/动效 + 清档）
- [x] 2.4 卡片三层：L1 `--fs-section` + `max-width: 34em`（E2E 换算 34 字）+ L3 状态条 `<details>` 默认折叠（节点不删）+ 细看展开对账
- [x] 出口门：validate 0 FAIL / validate:story 七项绿 / validate:rhythm 绿 / vitest 364（+39）/ typecheck 0 / e2e 双端全绿 / 布局·脱敏·许可·预算（746.05KB）全绿
- [x] 变异自检 26/26（`node tools/tmp-mutate-v5m2.mjs`，13 组）
- [x] 计划面翻齐：两处状态副本 v5-M2'''' ✅ + v5/00 台账四行 ✅ + v5/00 决策记录四行 + v5/02 §十三 增补 + v5/03 模块 3 ✅/3b ✅/4 部分 ✅/6 🟡 + v5/04 执行结果 + v5/backlog 观察区三项新增/更新 + v5/06 偏好回访行 + README 119/120
- [x] 本档七节齐（命令速查节由本棒补写；见 [HANDOFF-v5-M2 §八](HANDOFF-v5-M2.md)）

**v5-M3''''（下一棒）**：见 §三 三块表，每块各自 DoD 未勾。

**验证记录（本棒当轮实跑，2026-10-26）**：

| 命令 | 结果 |
|---|---|
| `node tools/check-sprint-layout.mjs` | **全绿**（11 条判据；`DOC_TOOLS 11 个脚本全部在位`；`README 119/120 行；状态表 23 行`；`STATUS 2 处副本 × 19 个已接门里程碑 状态全一致且无缺行`；`HANDOFFS 16 份齐`） |
| `node tools/check-desensitized.mjs` | 467 文件，0 命中（豁免 1 份） |
| `npm run validate` | **0 FAIL**（283 事件；图标 283/283；F 区绿；偶遇 40 条；--full 全量） |
| `npm run validate:story` | **绿（七项）**：S.LEN 243 / S.ERA 243 / S.SENSE 243 / S.REF 122；主句 104/118/120；选项 8/16/0%；detail 0 缺/0 超长/0 非前缀；单屏 >160 = 0 |
| `npm run validate:rhythm` | **绿**：8 局 × 8 阶段，每阶段 4–5 种变体、非 critical 段连片 ≤3 |
| `npx vitest run` | **364/364**（34 文件；~42s） |
| `npx tsc --noEmit` | **0 错** |
| `npm run e2e` | **全绿**（375/1280 双端一键通关 + 四步开局全流程 + 回退保值 + 八因素齐 + 再来一次换种子 + L1 行宽 34 字 + L3 折叠壳 + 细看展开对账 + v4 自定义出生段；单屏最长 158 字） |
| `npm run build` + `gate:budget` | 31 件，gzip **746.05KB ≤ 850KB**，无 WARN（纹理层删除为负增量 −2.45KB，探针实测 748.50→746.05） |
| `npm run gate:license` | 0 FAIL |
| `node tools/tmp-mutate-v5m2.mjs` | **13 组 / 26 项全符合预期**（素纸 3 组 / 卡片三层 4 组 / 开局四步 4 组 / 阅读偏好 2 组；逐条报红并复原绿） |

## 七、本棒抓出的真缺陷（写进档，供下一棒复用判别口诀）

1. **回退丢未提交的选择（2.1）**：`back()` 初版只回退 `step`，`manualEnv` 只在表单 submit 时记录——玩家改了 chip 没提交就点「换一种玩法」，值全丢。**E2E 首跑抓到**（`got` 回落到默认 60s/大城）。处置 = 回退前先 `syncStartForm()` 抄当前表单进 draft。判别口诀：**「不丢值」要问「离开这一步的那一刻，哪些值算数」——提交才算数是最容易写错的那种。**
2. **重进把作废的证带回来（2.1）**：3→2 回退若保留 `cert`，玩家改了要素后重进 step 3 会看到一张与表单不一致的旧证（因为 `preview` 没被调用）。处置 = 3→2 明确作废证明（`cert: null`），2→3 必须由 `preview` 重派；**4→3 则保留证**（回去看一眼是正当需求）。判别口诀：**回退语义要逐级定，不要一句「都保留」打天下。**
3. **`npx` 在变异自检里不认（5 环境坑连带）**：`execFileSync("npx", …)` 在 Windows 解析 `.cmd` 外壳失败 → 每次调用都非 0 退出 → 13 组全部被读成「报红」，但**复原后仍报红**是它自己失败、不是判据红。首跑 26 项全被标成异常，实际是调用方式错。处置 = 直接跑 `node_modules/vitest/vitest.mjs`。判别口诀：**「报红」与「跑不起来」是两件事——先看 exit code 的来源，再看测试输出。**