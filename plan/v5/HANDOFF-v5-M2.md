# HANDOFF-v5-M2 · v5-M1'''' → v5-M2'''' 入棒单（呈现层一：开局四步 / 出生证明卡 / 卡片三层细化）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档 + [00-README总览.md](00-README总览.md)。
> 编号纪律（skill 硬约束①）：**交接单编号随棒顺延**——本档是 v5-M1'''' 的收尾单，编号 HANDOFF-v5-M2 指下一棒（v5-M2''''）。v5 腿后续棒依次写 HANDOFF-v5-M3 / M4 / M5。
> 本档记录 **v5-M1'''' 数据与机制层（2026-10-26 收官）**：家庭槽位逐位命名 + 偶遇层 40 条 + 243 条文本瘦身 + 五次节奏变体与防单调 relay；呈现面只做了 M1 必需的最小接线（细看折叠层 / 变体控件），**开局四步与出生证明卡未动**。

## 一、当前进度 + 证据（2026-10-26 当轮实测）

| 块 | 落位 | 证据（当轮实跑） |
|---|---|---|
| 1.1 家庭槽位逐位命名 | `src/data/family-slots.json`（新，单源）+ `src/data/npcs.json`（加 `group`）+ `src/engine/family.ts`（按槽生成）+ `src/engine/values.ts`（家庭 id 不按需入册）+ `src/engine/model.ts`（`NpcState.slot?`）+ `src/storage/storage.ts`（旧档回填）+ `src/ui/relations.ts`（role 取槽位表）+ validate `F` 区 | `npm run validate` → `PASS 家庭槽位（v5/02 §一）：槽位 10 枚（role 逐位、无泛称）+ 结构 5 种（↔槽区间合法）+ 注册组 7 项 + 南北侧系闭合`；`family.test.ts` 14 项（含 1500 组合 fuzz 槽位零重复、单亲父/母两形态、隔代南北侧系）；`relations.test.ts` +3 项（外婆/外公/姐姐逐位 + 泛称禁令）；`storage.test.ts` +2 项（slot 回填、slot 类型非法拒绝）；E2E 图谱逐位 role（含泛称禁令） |
| 1.2 偶遇层 40 条 | `src/data/events.json`（40 条 `type: encounter`，每阶段 5）+ `src/data/icon-map.json`（+40，全部既有 SVG）+ `src/engine/engine.ts`（`encounterQuota/encounterFor/applyEncounterChoice`）+ `src/engine/values.ts`（`lineGainOf` 对 encounter 恒 0）+ validate `E.ENC` | validate → `PASS 事件库 283 条：… 偶遇层 40 条（每阶段 ≥5，v5/02 §二）`；`rhythm.test.ts` 注入 5 项（配额 0–3 且种子决定 / 实出 ≤ 配额 / 存在 0 条阶段（留白）/ 不推 line / 不连发） |
| 1.3 文本瘦身 243 条 | `tools/v5-slim-events.mjs`（一次性迁移，幂等 + `--dry`）→ `src/data/events.json`（`text` 主句 + `detail` 原文 + `options[].text` 短句 + `options[].detail` 原话）+ `scripts/check-story-quality.mjs`（v4 四项改扫 `detail ?? text`；新增 `S.LEN2`/`S.OPT`/`S.DETAIL`） | `npm run validate:story` → `绿（七项全过）`：主句 中位 104 / P90 118 / 最长 120；选项 中位 8 / 最长 16 / ≥20 字占比 0%；detail 缺 0 / 超长 0 / 非前缀 0；单屏 >160 0 条。零损失核对（脚本比对 v4 原文）：243/243 `detail` 逐字等于原文，`stage/type/line/ageHint/ageMonths/lineGain/rescue/pre` 与选项 `deltas3/resourceDeltas/bondDeltas/requires/flag/aftermath` **零改动** |
| 1.4 节奏变体引擎 | `src/engine/rhythm.ts`（五种变体 + `oddsOf/rollOdds/drawCard` + 防单调 relay）+ `scripts/check-rhythm.mjs` + `npm run validate:rhythm` + `src/engine/rhythm.test.ts`(16 项) + 布局门 `PENDING_TOOLS` 删登记 | `npm run validate:rhythm` → 8 局 × 8 阶段全 PASS（每阶段 4–5 种变体、非 critical 段连片 ≤3、critical 段实测 2–4 单列）；critical 22 张 risk 档齐（无 risk 会全落 draw 被门抓到） |
| 呈现面最小接线 | `src/ui/screens.ts`（`data-detail` 细看折叠层 + `data-variant` 变体控件 + `option-quick` 紧凑按钮 + `variant-note`）+ `src/ui/app.ts`（偶遇分支、read「继续」、变体派生）+ `src/style.css`（细看层/紧凑按钮/提示句样式） | E2E 双端：243/245 张卡全部带细看层、单屏最长 158 字、各见 4 种变体（choice+draw+quick+odds） |

**出口门实测（2026-10-26 当轮）**：布局门全绿（`LAYOUT.DOC_TOOLS 10 个脚本全部在位`、`README 119/120`、`STATUS 2 处副本 × 19 里程碑一致无缺行`、`LEDGER 45 行无未完成`）/ 脱敏门 487 文件 0 命中 / 许可门 0 FAIL / 预算门 31 件 745.46KB ≤ 850KB 无 WARN / validate 0 FAIL（283 事件，`--full` 全量）/ validate:story 七项绿 / validate:rhythm 绿 / vitest **325/325**（基线 298，+27）/ typecheck 0 / e2e 双端一键通关 + v4 自定义出生段全绿 / 变异自检 **24/24**（`node tools/tmp-mutate-v5m1.mjs`）。

## 二、当前事实·状态不变量（下一棒动手前必须知道）

1. **vitest 基线升到 325**（只加不减）：v5-M1'''' 增量 27 项 = `family.test.ts`（14）+ `relations.test.ts`（+3）+ `storage.test.ts`（+2）+ `values.test.ts`（+1，家庭 id 不按需入册）+ `rhythm.test.ts`（16）；其中 family/relations 的部分旧断言被改写而非新增，净差 +27。
2. **文本面新形态**：全库事件都有 `detail`（= v4 原文整段，且**以 `text` 为前缀**）；563/729 个选项有 `options[].detail`（短句化前的原话）。**改文案必须同时改 `detail`**，否则 `S.DETAIL 非前缀` 会红——这是「内容零损失」的机检形式，不是可选建议。
3. **选项数口径已改**：`2–3`（v3 的「≥3」废止）；**偶遇卡允许单选项**「就这样走过去」（validate `E.OPTIONS` 与 E2E 分别按 `type: encounter` 放宽下限；E2E 只统计非偶遇卡的下限）。
4. **节奏门判据面**：`每阶段变体种类 ≥3` + `非 critical 段同变体连续 ≤3`（critical 段单列观测）。critical 的 22 张都带 `risk`（`low|mid|high`），**新增 critical 必须带 risk**，否则 `rhythm.test.ts` 的「全部 critical 标了 risk」会红——那张测试守的就是「teen 四张全落 draw」这个坑。
5. **quick 阈值是 13 字**（`src/engine/rhythm.ts` 常量，02 §三 ▸ 增补有实测表）。改这个数字必须同步 02 §三 的实测表，否则就是口径漂移。
6. **偶遇注入规则**（`encounterFor`）：配额 0–3（`seededDraw(seed, 900 + stageIndex×13)` 四等分）；只在 `floor ≥ 0` 且 `floor ≤ 偶遇月龄 ≤ 下一张主线卡月龄` 时插（不抢开场、保单调）；上一张是偶遇或 critical 时不插；`pickEvent` 候选池已排除 `encounter`。
7. **存档**：`xinlu.save.v3` 版本号未变；`NpcState.slot` 是**新增可选字段**；`readNpcs` 已接受 `name/slot` 两个可选键；旧档在 `load()` 里按 seed 复算回填（不覆盖既有值、不新增成员）。
8. **家庭成员不按需入册**（`values.applyBonds`）：`mother/father/grandma/...`（`family-slots.json` 的 `groups` 键）缺席时，给它的 `bondDeltas` **落空不入册**——单亲-父家庭没有母亲是结构事实；支线 NPC（伴侣/挚友/师/上司/医生）仍按需入册。实测 240 局单亲模拟「凭空长出家庭成员」0 次。注意 `values.ts` 直接读 `family-slots.json` 而非 import `family.ts`（后者反向依赖 `tagOfBond`，走模块会成环）。
9. **UI 契约（E2E 钉住的钩子，别删）**：`.event-card[data-age-months]`、`[data-option]`、`[data-continue]`、`[data-detail]`、`.event-card[data-variant]`（新增，值 ∈ choice/draw/odds/read/quick）、`.statebar .res-word`（三项）、`[data-year-badge]`、`[data-relations-chart]`、`.rel-list .rel-role`（逐位 role）、`[data-family-open]`。**状态条 3 项 / 阶段条高度恒定 / money 无档色条 / year-badge 在卡内**这些既有钩子未动。
10. **`tools/` 下三个本棒工具**：`v5-slim-events.mjs`、`v5-add-encounters.mjs`（幂等迁移）、`tmp-mutate-v5m1.mjs`（变异自检；**名字带 tmp 是有意的**——它不是门，只作留档，可在 v5-M2 复跑）。

## 三、下一棒待办（v5-M2'''' 呈现层一，四块）

> DoD 单源 = [00 §里程碑总表](00-README总览.md) v5-M2'''' 行；执行视图 = [04 §v5-M2''''](04-里程碑任务分解.md)；口径单源 = [02 §五（开局四步）/§六（卡片三层）/§七（素纸主题）](02-数据与口径.md)。

| 块 | 内容 | 出口判据 |
|---|---|---|
| 2.1 | **开局四步**：状态机（选玩法 → 填要素 → 出生证明 → 入场；任何一步可回退且不丢已填值）+ 进度指示 1/4–4/4 | 四步 E2E 全流程 + 回退保值断言（回退后重进值仍在） |
| 2.2 | **出生证明卡**：八因素（出生年/南北/城乡/家庭结构/父母职业/家境/家庭成员逐位姓名/种子码）全显性 + 「用这个」/「再来一次」（随机态） | E2E 断言八因素齐 + 再来一次确实改变结果；家庭成员姓名与 `generateFamily` 一致 |
| 2.3 | **素纸主题（D8）**：删纹理层（`--tex-wash: 0`）+ 提对比 + 四主题保留 + 设置页补全 | 四主题截图留痕；夜航 AA（`theme-contrast.test` 11 组合 ≥4.5）不退化；`--tex-wash: 0` 断言 |
| 2.4 | **卡片三层**：L1 正文焦点（大字/大留白/行宽 ≤34 字）+ 细看折叠（已在 M1 接线，本棒做视觉分层与展开对账）+ L3 辅助弱化（状态条默认折叠为细线，点击展开） | 单屏字数 ≤160 断言（已在 M1 落）+ 细看展开内容对账（展开后与 `detail` 逐字一致）+ 三档截图 |

**公共出口门**：validate 0 FAIL + validate:story 七项绿 + **validate:rhythm 绿** + vitest ≥ 325（只加不减）+ typecheck 0 + e2e 双端绿 + 布局门/脱敏门绿 + README ≤120 行 + 预算门重审（**删纹理应为负增量**）。

**评审门（强核查）**：02 §五/§六/§七 ↔ 实现 ↔ 单测/E2E 三方一致；**卡片三层改动不得破坏 E2E 既有钩子清单（见 §二.8）**；主题改动不得动 `theme-contrast.test.ts` 的判据面。

**收尾顺序（固定）**：DoD 验证 → 两处状态副本 v5-M2'''' ⬜→✅ → v5/00 台账六行 ✅ → v5/03 模块 3 收口（开局四步/出生证明）→ 写 **HANDOFF-v5-M3**（编号随棒顺延）→ commit。

## 四、既定口径（已拍板，别再问；推翻须进 `v5/00` 决策记录）

- **判定核零改动（K11）**：三观传导 / 结局 / 调度单调 / 种子复现全部不动；v5 只治「节奏」与「信息层级」。
- **零运行时依赖（K2）**：`dependencies` 恒空；新增能力一律原生 TS + 手绘 SVG。
- **概率判定全走种子化 RNG**：同种子同结果（可复现是硬约束，不是"尽力"）。
- **正文瘦身内容零损失**：`detail` 必须是 `text` 的**超集且以 text 开头**（机检）；改主句必须同步改 `detail`。
- **主题四款继续有效**（米纸/月白/夜航/青瓷），夜航 AA 不得退化（`theme-contrast.test` 11 组合 ≥4.5）。
- **存档 schema 沿用 v3**（`xinlu.save.v3`）：偶遇/节奏变体走既有 `history`/`flags` 通道；`slot` 是可选字段，无版本号变更。
- **每题 2–3 个选项**（关键节点 3，日常 2；`quick` 呈现固定 2–3 紧凑按钮；偶遇可单选项）。
- **节奏变体是呈现层**：不得为凑门的数字改事件类型、删选项或改 `deltas3`（那是改判定核）。
- 产品/赛事/制度名可入文，**真实机构名/真人名不写**。

## 五、环境坑（实测在案）

- **本机直连 github.com 不通**：push 一律 SSH:22；仓库/Pages/Release 操作走 `gh` API（HTTPS 通）。**不虚报发布**。
- **脱敏门红线**：入库文件与提交信息不得写本机盘符 / 用户名 / 回环代理端口。`.taste-skill/` 已进 `.gitignore` + 脱敏门 `SKIP_DIRS`（两侧必须同步）。
- **gh 是原生程序，不认 `/tmp` 路径**：`--notes-file` / 附件参数要传 `cygpath -w` 转过的 Windows 路径。
- **e2e 冒烟**：`node tests/e2e/smoke.mjs`（本地 build+preview）／`--no-build --base-url <url>`（外部静态服务或线上 Pages，同一口径）。**本棒 e2e 每次重写 9 张截图**（3 档 × 3 张），提交前确认截图是有意更新。
- **vitest 单跑 ~17s**：两个可达性测试各 ~15s（并行耗时取最大），不是卡死。
- **写源码要用 Write/Edit**：本环境有 hook 拦截「Bash 直接写 src/」——变异自检脚本改文件请改用 `tools/` 下脚本或在 Edit 里改回。
- **变异自检纪律**：改完判据要**逐条验红再复原**（本项目判据已扩到 validate `F`/`E.ENC`/`E.OPTIONS` + `validate:story` 七项 + `validate:rhythm` 两条，`tools/tmp-mutate-v5m1.mjs` 已覆盖 12 组 24 项，可直接复跑作基线）。

## 六、DoD 逐项 checklist

**v5-M1''''（本档所在，已收官）**：

- [x] 1.1 家庭槽位逐位命名：`family-slots.json` 单源 + 按槽生成 + validate `F` 区 + 图谱 role 接线 + 旧档回填（1500 组合 fuzz 零重复）
- [x] 1.2 偶遇层：40 条（每阶段 ≥5）+ `encounterFor` 注入（0–3 / 种子决定 / 不推 line / 不抢开场）+ `E.ENC` 密度门 + 图标 40 条
- [x] 1.3 文本瘦身：243 条主句（中位 104 / 最长 120）+ 原文整段迁 `detail` 零损失 + 选项短句化（中位 8 / 最长 16）+ 每题 2–3（validate 口径）+ `validate:story` 七项
- [x] 1.4 节奏变体：`rhythm.ts` 五种变体 + 概率判定（种子化）+ 防单调 relay + `scripts/check-rhythm.mjs` + `npm run validate:rhythm`（同批删布局门 `PENDING_TOOLS` 登记）
- [x] 呈现面最小接线：卡片 `data-detail` 细看折叠层 + `data-variant` 变体控件（read/quick/draw/odds）
- [x] 出口门：validate 0 FAIL / validate:story 七项绿 / validate:rhythm 绿 / vitest 325（+27）/ typecheck 0 / e2e 双端全绿 / 布局·脱敏·许可·预算全绿
- [x] 变异自检 24/24（`node tools/tmp-mutate-v5m1.mjs`）
- [x] 计划面翻齐：两处状态副本 v5-M1'''' ✅ + v5/00 台账七行 ✅ + v5/00 决策记录四行 + v5/02 §十二 增补 + v5/03 模块 1/2 ✅（模块 3 部分）/模块 6 🟡 + v5/backlog 启用 + README 119/120
- [x] 本档七节齐

**v5-M2''''（下一棒）**：见 §三 四块表，每块各自 DoD 未勾。

**验证记录（本棒当轮实跑，2026-10-26）**：

| 命令 | 结果 |
|---|---|
| `node tools/check-sprint-layout.mjs` | **全绿**（10 条判据；`DOC_TOOLS 10 个脚本全部在位`；`README 119/120 行；状态表 23 行`；`STATUS 2 处副本 × 19 个已接门里程碑 状态全一致且无缺行`） |
| `node tools/check-desensitized.mjs` | 487 文件，0 命中（豁免 1 份） |
| `npm run validate` | **0 FAIL**（283 事件；图标 283/283；F 区绿；偶遇 40 条；--full 全量） |
| `npm run validate:story` | **绿（七项）**：S.LEN 243 / S.ERA 243 / S.SENSE 243 / S.REF 122；主句 104/118/120；选项 8/16/0%；detail 0 缺/0 超长/0 非前缀；单屏 >160 = 0 |
| `npm run validate:rhythm` | **绿**：8 局 × 8 阶段，每阶段 4–5 种变体、非 critical 段连片 ≤3 |
| `npx vitest run` | **325/325**（31 文件；~17s） |
| `npx tsc --noEmit` | **0 错** |
| `npm run e2e` | **全绿**（375/1280 双端一键通关 94–245 张卡 + v4 自定义出生全流程；单屏最长 158 字） |
| `npm run build` + `gate:budget` | 31 件，gzip **745.46KB ≤ 850KB**，无 WARN |
| `npm run gate:license` | 0 FAIL |
| `node tools/tmp-mutate-v5m1.mjs` | **11 组 / 22 项全符合预期**（24 项：11 组 22 项 + 本棒闭合的 encounter variant 组 2 项；真缺陷记录见 §七） |

## 七、本棒抓出的真缺陷（写进档，供下一棒复用判别口诀）

1. **槽位重复（1.1）**：多孩结构下两个同辈年幼位可能同性别 → 两个「弟弟」撞同一封闭槽位。1500 组合 fuzz 抓出，处置 = 由「槽位唯一」反推性别派生（年幼位 ≥2 时强制一男一女）。
2. **偶遇抢开场（1.2）**：`encounterFor` 初版只要求 `偶遇月龄 ≥ floor`，但 `floor` 在阶段开头是 `-1` → 22 个月的偶遇可以插在 3 个月的开场卡之前，并把 `pickEvent` 的 floor 抬到 22 个月，**直接吃掉开场卡**。E2E 的年份单调断言抓出。处置 = 只在 `floor ≥ 0`（本阶段已出过真卡）且 `偶遇月龄 ≤ 下一张主线卡月龄` 时插。
3. **偶遇 variant 用了 read（1.2）**：13 条偶遇声明 `read`，违反 02 §三「encounter → draw 或 quick」。节奏门第一版抓到（read 连片 4 张），处置 = 全改 `draw`，并**同笔在 validate 补 `E.ENC` 的「encounter 的 variant 只认 draw|quick」判据**（变异自检第 4b 组，本棒已把它从「下一棒待补」变成「本棒已闭」）。
4. **quick 阈值不可达（1.4）**：02 §三 原表写「≤6 字」；瘦身后按 6 字筛每阶段仅 0–2 张可用 → choice 连片 28 张，节奏门「连续 ≤3」自己不可达。处置 = 实测定档 13 字 + 把实测表写进 02 §三 ▸ 增补（**门不许自己制造它要防的现象**）。
5. **critical 全落 draw（1.4）**：22 张 critical 原本都没有 `risk` → 全走 `draw`，teen 四张连发。处置 = 按事件性质逐张标 `risk`，并在单测里钉「全部 critical 必须带 risk」。
6. **变异自检第一次「没红」的两处**：一处是我的变异没真正越界（偶遇文案 +13 字仍在 80 字内 → 改成按原长补足到 100+）；一处变异没打中门的判据（删 teen 偶遇后仍有 era/read + relay/quick 撑起 ≥3 种 → 改成拆掉整阶段的变体来源）。判别口诀：**「变异没红」先查「变异真发生了几次字节变化」与「它打的是不是这条判据的靶面」**。
7. **家庭成员被按需「补」出来（1.1 连带）**：`applyBonds` 原语义「未在册 NPC 以中位 50 入册」对支线 NPC 是对的，对家庭成员是错的——v4 单亲恒母，v5 单亲分父/母两形态后，单亲-**父**局里 66 处「与母亲有关」的关系增量会长出一位从未生成过的母亲。处置 = `applyBonds` 对 `family-slots.json` 的 `groups` 键缺席即落空 + 单测；实测 240 局单亲模拟「凭空长人」0 次。同笔踩到并修掉一个**模块环**：`values.ts` import `family.ts` 会成环（`family.ts` 反向依赖 `tagOfBond`），表现为 `Cannot read properties of undefined (reading 'groups')`——正解是两处都直接读数据文件。

---

### 附：本棒提交边界（建议拆笔）

| 笔 | 内容 | 说明 |
|---|---|---|
| 第一笔 | `src/` 全批 + `src/data/*` + `scripts/` + `tools/` + `tests/e2e` + `package.json` + `docs/assets`（截图重留痕） | 代码与门（含 9 张 e2e 截图更新） |
| 第二笔 | `plan/v5/*` + `plan/00` + `README.md` + `AGENTS.md`（若需） | 文档翻面与留档 |

两笔边界 = 「代码面」vs 「文档与状态」。不要混成一次提交（否则 `git diff <代码基线>..HEAD -- src/` 无法二分）。
