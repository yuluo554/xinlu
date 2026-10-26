# HANDOFF-v5-M5 · v5-M4'''' 收尾交接单（发布棒 → 运维期 · v5 腿收官单）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档 + [00-README总览.md](00-README总览.md)。
> 编号纪律（skill 硬约束①）：**交接单编号随棒顺延**——装订棒 HANDOFF-v5-M1、v5-M1'''' 棒 HANDOFF-v5-M2、v5-M2'''' 棒 HANDOFF-v5-M3、v5-M3'''' 棒 HANDOFF-v5-M4、本档为 v5-M4'''' 发布棒收尾单（**v5 腿收官单**）。
> 本档记录 **v5.0.0 发布（2026-10-26）**：v5-M1''''–M4'''' 全 ✅，v5 腿收官；下一阶段进入**运维期**（plan/06 十六类轮转），无既定开发棒。

## 一、当前进度 + 证据（2026-10-26 当轮实测）

- **三件套**：tag `v5.0.0`（annotated）@ `ea2a783`；Release https://github.com/yuluo554/xinlu/releases/tag/v5.0.0 五部分（变更摘要 / 数据口径版本 / **历史存档建议重开声明** / 校验和 / 已知问题）+ dist.zip **784,893 字节**（sha256 `bba505504e5e093cb5f5c407fd0d786641e3f9cb879f995f23454b5ca354a273`；`gh release download` 下载复核一致 + 与本地副本 `diff -r` 一致 + **解压独立静态服务双端一键通关 exit 0**）；[plan/05 §十](../../plan/05-发布留档.md) 留档两栏 + DoD 勾。
- **发布流程全序**（04 §v5-M4'''' 顺序不可颠倒）：基线门全绿（`6c085e1` 态）→ build（预算 **760.43KB** ≤ 850KB 绿）→ 干净静态服务双端一键通关 + 768 + v5 自定义出生全流程 exit 0 → 发布就绪态 `ea2a783`（CHANGELOG + README **120/120** 行 + plan/05 §十 主体 + 版本号 5.0.0，**代码面与 `6c085e1` 零差异**）→ push（SSH:22）→ ci run **40332053102** + deploy-pages run **40332053077** 双 success → **Pages 实开双端一键通关 + 768 + v5 自定义出生全流程 exit 0** → tag → Release → 留档翻齐 → 收官提交。
- **翻面**：两处状态副本 v5-M4'''' ⬜→✅（含 tag 链接）+ v5/00 台账「历史存档重开声明」行 ✅ + v5/00 索引 03/04/05/06 行与 HANDOFF-v5-M5 行 + v5/03 模块 6 ✅ + v5/04 执行结果 + plan/00 索引 v5 行（v5.0.0 已发布）+ AGENTS.md（v5 腿转「已发布」+ CI 行补发布态 run 号）+ HANDOFF-v5-M5（本档）。
- **终值留痕**：[docs/v5-M5-release.md](../../docs/v5-M5-release.md)（流程时序表 + 三件套核对 + 出口门终值 + 文本终值 + Traffic 基线 + 遗留观察）。

## 二、当前事实·状态不变量（下一棒动手前必须知道）

1. **v5 腿收官，项目进入运维期**：无既定开发棒；维护动力 = 可度量缺口（plan/06 总原则：**没有缺口时正确动作是不动**）。周自查 30 分钟轮转**十六类**（v1 八类 + v2 9/10 类 + v3 11/12 类 + v4 13/14 类 + v5 15/16 类：阅读节奏漂移 / 配图语义漂移）。
2. **tag 之后不改代码面**（AGENTS 环境禁忌）：v5.0.0 的任何后续改动都进新提交、走版本规则（文本长度口径或判定呈现变化 → 主版本 +1 + 重开声明；新增事件/结局 → 次版本；纯文案 → 补丁）。**v5.0.0 判定核零改动**（K11 未破：三观传导 / 结局条件 / 调度单调 / 种子复现）。
3. **Traffic 周记**：发布日基线 views 0 / clones 202（unique 60，14 天窗口累计；窗口含 10-24 的 168 与 10-25 的 34）/ stars 0 / issues 0；首次回访 ≈ **2026-11-02**（发布 +7 天），`gh api repos/<user>/<repo>/traffic/views|clones`。
4. **单测基线 399（只加不减）**；预算线 850KB（实测 760.43KB，余量 89.57KB；v6 内容增量前按 V4-1 判据重审）。
5. **文本口径已成门**：`validate:story` 七项（S.LEN2 主句 中位 ≤120·P90 ≤150 / S.OPT 中位 ≤10·最长 ≤16·≥20 字 ≤10% / S.DETAIL 覆盖 100% 非前缀 0）；改写任何事件文案必须复跑；单屏 ≤160 由 E2E 硬断言（当前最大 158，**余量只有 2 字**，改文案要留意）。
6. **配图纪律（v5/02 §十四）**：映射单源 = `scene-map.json` 的 `keyTag`（由 icon-map 派生）；改映射要重跑 `tools/v5-scenes-doc.mjs`，否则 `docs/v5-scenes.md` 逐张表过期；变体取图用事件 id **哈希高位**（`>>> 16`），低位会与 id 尾部强相关（`scenes.test.ts` 的「无死图」断言会拦）。
7. **线索纪律（v5/02 §十四）**：flag 只写在 `clues.json`；判定零随机、零三观改动；解锁事件 `pre` 必须真含该 flag（validate `C.UNLOCK`）；每阶段 ≤1 处。
8. **图谱纪律（v5/02 §十四）**：边一律 `<line>`（E2E 用 `svg line` 数边、`svg g` 数节点）；公共母线只画一次（否则颜色归属变成「谁最后画」）；`renderRelations(npcs, view)` 的默认参数别动（终局快照走默认值）。
9. **发布三先例齐**：v1.0.0 / v2.0.0 / v3.0.0 / v4.0.0 / v5.0.0 留档在 plan/05 §三/§四、§七、§八、§九、§十；下一版发布沿 §十 模板（tag 时点事实 tag 前写定 / run 号收官提交补记 / 两栏纪律）。
10. **远端状态**：origin/main = 收官提交（本档所在提交）；tag v5.0.0 已推；Pages 线上 = `ea2a783` 构建；ci + deploy-pages 双 run success 实测（2026-10-26）。
11. **变更入口**：若开 v6 腿，先写方案文档（沿 07/08/09/10 先例）+ 装订 `plan/v6/` 套件 + 布局门扩感知（`LEG_CONFIG` 加一行 + `WIRED_LEGS`），再开工（沿 v4/v5「先计划后开发」教训）。

## 三、下一棒待办（运维期首查 · 按 plan/06 节奏，或用户明示新腿）

1. **运维期首查**（≈ 2026-11-02）：Traffic 周记 + issue 轮转 + 十六类轮转一类（建议先从第 15 类「阅读节奏漂移」抽验起——v5 主轴是阅读体验，且单屏余量只有 2 字，最易回涨）；发现缺口带证据入 [v5/backlog.md](backlog.md) 观察区或 v1 backlog。
2. **配图回访**（v5/06 季度项，可与首查合并）：抽验 20 张配图与事件文本的贴合度（D9 纪律运维化）；同时看 42 条豁免卡的「空」观感是否触发扩展诉求。
3. **遗留观察复评**（[docs/v5-M5-release.md](../../docs/v5-M5-release.md) §六）：42 条豁免 / 线稿表现力上限 / 线索密度与 flag 是否进结局 / 预算余量 89.57KB。
4. **可选**：v6 方案腿（用户明示后启动，见 §二.11）。

## 四、既定口径（已拍板，别再问；推翻须进 `v5/00` 决策记录）

- **判定核零改动（K11）**：三观传导 / 结局 / 调度单调 / 种子复现全部不动；发版不得带判定改动。
- **零运行时依赖（K2）**：`dependencies` 恒空。配图是静态 SVG（`?raw` 内联，48 张进 bundle +14KB gzip 是有意的），图谱是手绘 SVG，均不经运行时库。
- **存档 schema 沿用 v3**（`xinlu.save.v3`）：线索与偶遇走既有 `flags`/`history` 通道，**不升版本、不加字段**。
- **文本口径**：主句 ≤120 / 选项 ≤10 字（中位）/ ≥20 字 ≤10% / 每题 2–3 / 单屏 ≤160；原文进 `detail`，内容零损失是硬约束（不删只折叠）。
- **配图路线**：自产 CC0 线稿 SVG（48 张 / 19 类）已冻结；偏离原「CC0 照片」口径的理由与实测留痕 [docs/v5-scenes.md](../../docs/v5-scenes.md) §一 + [v5/00 §决策记录](00-README总览.md)。发版说明里如实写「自产线稿」。
- **图谱默认 tree / ring 可切**；节点详情从 history 回查，不新增 bond 日志字段。
- **主题四款继续有效**；素纸（`--tex-wash: 0`）是默认，删纹理是负增量、纹理素材留档不删。
- 产品/赛事/制度名可入文，**真实机构名/真人名不写**。
- **发布纪律**：不虚报——push 不通就写不通；tag 后不改代码面；Release 五部分 + dist.zip + sha256 复核一致；留档双栏（tag 时点事实 tag 前写定）。

## 五、环境坑（实测在案，沿 HANDOFF-v5-M4 增补）

- **本机直连 github.com 不通**：push 一律 SSH:22（本轮实测 `ssh -T git@github.com` 通）；仓库/Pages/Release 操作走 `gh` API（HTTPS 通）。
- **脱敏门红线**：入库文件与提交信息不得写本机盘符 / 用户名 / 回环代理端口（`127.0.0.1:端口` 形态会红——本轮首写 plan/05 时踩过，改为 `<static-url>` 占位符即绿）；示例路径用 `<user>`/`<repo>` 占位符。**临时探针脚本若写绝对路径也当场被抓**——用完立刻删。
- **`gh` 是原生程序，不认 `/tmp` 与 Git Bash 路径**：`--notes-file` / 附件参数要传 `cygpath -w` 转过的 Windows 路径。
- **e2e 发布冒烟**用 `node tests/e2e/smoke.mjs --no-build --base-url <url>`（外部静态服务 / 线上 Pages / Release 附件解压目录同一口径）；`--base-url` 跳过 build/preview。
- **截图要等换屏淡入动画**：图谱页截图若不等（本轮脚本用 `sleep(700)`），拍到的是半透明帧、整页发白。
- **写源码要用 Write/Edit**：本环境有 hook 拦截「Bash 直接写 `src/`」——批量改请用 `tools/` 下脚本，不要在 Bash 里 `>` 重定向写 `src/`。
- **dist.zip 走 `dist-release/`**（`.gitignore` 的 `dist.zip` 模式覆盖，不入库）；打包用 PowerShell `Compress-Archive`（本机无 `zip` 命令）；`dist-release/verify` 解压目录属本地产物、不入库。
- **`vitest run` 单跑 ~28–35s**：可达性两项各 ~15–27s（并行取最大），不是卡死。
- **node `-e` 内联脚本含 `''''`（里程碑标号）会被 bash 单引号截断**——写临时脚本文件或用 Edit 工具。

## 六、DoD（v5-M4'''' 对账 · 单源见 [00 §里程碑总表](00-README总览.md)）

**v5-M4''''（本档所在，已收官）**：

- [x] 三件套：tag v5.0.0 @ `ea2a783` + Release 附产物（dist.zip 784,893 字节 + sha256）+ plan/05 §十 留档
- [x] Release 五部分（变更摘要 / 数据口径版本 / **历史存档建议重开声明** / 校验和 / 已知问题）
- [x] tag 在构建与部署验证之后（构建 / 干净冒烟 / 线上实开 exit 0 → ci 40332053102 + deploy-pages 40332053077 双 success → tag → Release）
- [x] CHANGELOG 注明「文本口径与判定呈现变化 → 历史存档建议重开」（并写明判定核零改动、schema 仍 v3 不加字段、旧档可原样续读）
- [x] README 增量不破行门（**120 行 / ≤120**，`LAYOUT.README` 机检，状态行 = 表格行）
- [x] 状态副本 / 台账翻齐（plan/00 + README 两副本 + v5/00 台账「历史存档重开声明」行 + v5/03 模块 6）
- [x] 本档七节齐

**验证记录（本棒当轮实跑，2026-10-26）**：

| 命令 | 结果 |
|---|---|
| `node tools/check-sprint-layout.mjs` | **全绿**（10 条判据；`README 120/120 行`；`STATUS 2 处副本 × 19 个已接门里程碑 状态全一致且无缺行`；`RELEASE … v5.0.0 留档节:true`） |
| `node tools/check-desensitized.mjs` | 531 文件，0 命中（豁免 1 份） |
| `npm run validate`（`--full`） | **0 FAIL**（14 区；295 事件 / 图标 295/295 / `F` 槽位 / `C` 线索 / `S` 配图） |
| `npm run validate:story` | **七项全绿**（255 条；主句 102/117/120；选项 8/16/0%；detail 0 缺；单屏 >160 = 0） |
| `npm run validate:rhythm` | **绿**（8 局 × 8 阶段，每阶段 4–5 种变体、非 critical 连片 ≤3） |
| `npx vitest run` | **399/399**（36 文件；~28s） |
| `npx tsc --noEmit` | **0 错** |
| `npm run e2e` + 干净静态服务 + 线上 Pages + Release 附件解压 | **四口径全绿** |
| `npm run build` + `gate:budget` | 31 件，gzip **760.43KB ≤ 850KB**，无 WARN（余量 89.57KB） |
| `npm run gate:license` | 0 FAIL（459 件） |
| `gh release download v5.0.0 --pattern dist.zip` | sha256 与说明一致 + 与本地 `diff -r` 一致 |

## 七、命令速查

```bash
node tools/check-sprint-layout.mjs   # 布局门（= npm run gate:layout）
node tools/check-desensitized.mjs    # 脱敏门（= npm run gate:desens）
npm run validate                     # 数据门（14 区；F 槽位 / C 线索 / S 配图）
npm run validate:story               # 文本长度 + 写实机检七项
npm run validate:rhythm              # 节奏门（每阶段变体 ≥3）
npm test                             # vitest（v5.0.0 后基线 399）
npm run typecheck                    # tsc --noEmit
npm run e2e                          # E2E 全量（build + 双端 + 768 + v5 段）
node tests/e2e/smoke.mjs --no-build --base-url <url>   # 发布冒烟（外部静态服务/线上 Pages 同口径）
npm run gate:license                 # 许可门
npm run gate:budget                  # 预算门（850KB 线；v5.0.0 实测 760.43KB）
gh api repos/<user>/<repo>/traffic/views   # Traffic 周记（clones 同路径）
gh release view v5.0.0               # Release 核对
```