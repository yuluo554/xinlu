# v5-M4'''' 发布清单与出口门终值（v5.0.0 · 2026-10-26）

> 单源约定：发布留档主体在 [plan/05-发布留档.md](../plan/05-发布留档.md) §十（单源不双写）；本档是发布棒的流程时序 + 三件套核对 + 门禁终值留痕（沿 docs/v4-M6-release.md 格式）。

## §一、发布流程时序（04 §v5-M4'''' 顺序不可颠倒，逐格留痕）

| 步 | 事实（2026-10-26 实测） |
|---|---|
| 基线门 | 代码态 `6c085e1`（v5-M3'''' 收官态）全套门本棒复跑全绿（validate 0 FAIL 14 区 / validate:story 七项绿 / validate:rhythm 绿 / vitest 399/399 / typecheck 0 / e2e 全量含 build 双端通关 / 许可 0 FAIL 459 件 / 脱敏 531 文件 0 命中 / 布局门全绿） |
| build | 发布就绪态 vite build 绿（预算门 **760.43KB** ≤ 850KB，0 WARN）；dist.zip 784,893 字节 + sha256 留档 |
| 干净静态服务冒烟 | `py -m http.server` 伺服 `dist/`（等价 Pages 托管），375/1280 双端一键通关（ESFJ「路上的人」两档）+ 768 中档 + v5 自定义出生全流程 exit 0 |
| 发布就绪态提交 | `ea2a783`：版本号 5.0.0 + CHANGELOG v5.0.0（含重开声明）+ README 增量（**120/120 行**）+ plan/05 §十 主体（tag 时点事实 tag 前写定）+ v5/00 索引 05 行 + v5/05 骨架状态行；**代码面与 `6c085e1` 零差异**（`git diff 6c085e1..HEAD -- src/ scripts/ tools/` 为空） |
| push | `origin/main`（SSH:22）；push `ea2a783` 触发远端 |
| Pages 部署 + CI | ci run **40332053102 success**（Methodology gates 8s + Vitest node 22/24，三 job 全绿）+ deploy-pages run **40332053077 success**（1m22s） |
| 实开复核 | 线上 https://yuluo554.github.io/xinlu/ 同脚本口径双端一键通关 + 768 + v5 自定义出生全流程 exit 0 |
| CHANGELOG | v5.0.0 节：数据口径对账（事件 **295** = 主线支线 243 + 偶遇 40 + 线索解锁 12 / 时代锚 76 / 结局 8+1 / 画像 16 / birth-map 288 + 51840 / 家庭槽位 10 / 线索 6 / 配图 48 张 19 类）+ 历史存档建议重开声明（判定核零改动、schema 仍 v3 不加字段） |
| tag | **v5.0.0**（annotated）@ `ea2a783`，晚于构建、干净冒烟、部署与实开复核 |
| Release | https://github.com/yuluo554/xinlu/releases/tag/v5.0.0 五部分（变更摘要 / 数据口径版本 / 重开声明 / 校验和 / 已知问题）+ 附件 dist.zip；附件 `gh release download` 下载 sha256 复核一致 + 与本地副本 `diff -r` 一致 + 解压独立静态服务双端通关 exit 0 |
| 留档翻面 | plan/05 §十 tag 后追加栏 + DoD 勾 / 两处状态副本 v5-M4'''' ✅ / v5/00 台账「历史存档重开声明」行 ✅ / v5/03 模块 6 ✅ / v5/00 索引与 AGENTS.md CI 行 / HANDOFF-v5-M5 收官单 |

## §二、三件套核对（v5/00 §里程碑总表 v5-M4'''' 行 DoD）

- [x] tag v5.0.0 @ `ea2a783`（2026-10-26，annotated）
- [x] Release 五部分 + dist.zip 784,893 字节（sha256 `bba505504e5e093cb5f5c407fd0d786641e3f9cb879f995f23454b5ca354a273`，下载复核一致 + 解压通关）
- [x] plan/05 §十 留档（tag 时点事实 + tag 后追加两栏 + DoD 声明 + 覆盖对账沿 §六 判据同构）

## §三、出口门终值（发布就绪态 `ea2a783` 实测，2026-10-26）

- `npm run validate`：0 FAIL（**14 区**；295 事件 / 图标 295/295 + 豁免 1 / `F` 家庭槽位 10 枚 / `C` 线索 6 条 / `S` 配图 48 张 19 类覆盖 85.8%）
- `npm run validate:story`：**七项全绿**（扫到 255 条；S.LEN 255 / S.ERA 255 / S.SENSE 255 / S.REF 122 + S.LEN2/S.OPT/S.DETAIL）
- `npm run validate:rhythm`：绿（8 局 × 8 阶段，每阶段 4–5 种变体、非 critical 段连片 ≤3）
- `npm test`：**399/399**（36 文件，含可达性全量 2496 组 + 年代轴抽样 936 局）
- `npm run typecheck`：0 错
- `npm run e2e`：**三口径全绿**——vite preview 全量（基线）/ 干净静态服务 `--no-build --base-url` / 线上 Pages 实开，各含 375/1280 双端一键通关 + 768 中档 + v5 自定义出生全流程；另 Release 附件解压独立静态服务再跑一次 exit 0
- `npm run gate:license`：0 FAIL（459 件；scenes 落既有白名单 `assets/web-ready/`，无新增署名行）
- `npm run gate:budget`：**760.43KB ≤ 850KB** 绿（0 WARN；余量 89.57KB）
- `npm run gate:layout` + `gate:desens`：全绿（收官提交态复跑，0 命中）
- README 行门：**120 行 ≤ 120**（v5 新增节九条；v2/v3/v4 节折行腾量，信息零删减）

## §四、文本终值（`validate:story` 当轮实测）

- 正文主句：中位 **102** / P90 **117** / 最长 **120**（门 ≤120/150/180）
- 选项：中位 **8** / 最长 **16** / ≥20 字占比 **0.0%**（门 ≤10/≤16/≤10%）
- `detail`：缺 0 / 超长 0 / 非前缀 0（覆盖率 100%，内容零损失）
- 单屏 >160 字：**0 条**（E2E 全程硬断言，实测最长 158 字）

## §五、发布日 Traffic 基线（gh api 实查 2026-10-26）

- views 0 / clones 202（unique 60——14 天窗口累计值，窗口含 10-24 的 168 与 10-25 的 34，**非当日新增口径**，本日数据尚未进窗口）/ stars 0 / open issues 0；
- 对比：v1/v2/v3/v4 四代发布当日 views 均全零；周记节奏见 plan/06（十六类轮转 + 配图回访季度抽验 + 槽位/家谱回访高优先）。

## §六、遗留观察（不入本棒 DoD，入运维期轮转）

- 配图覆盖的 42 条豁免（抽象图标本就不是场景）与「一图多事件」复用度，季度回访抽验 20 张贴合度（v5/06 节奏增量）；
- 自产线稿表现力上限（同一套画法的差异度）——见 [v5/backlog.md](../plan/v5/backlog.md) 观察区；
- 线索只做 6 条（每阶段 1 处）：扩到每阶段 2 处需先改口径（02 §十）并同步 validate `C.DENSITY` 与 E2E；
- 线索 flag 未参与结局条件（若希望「对某件事的理解」影响结局，需扩 `endings.json` 条件并复跑可达性全量扫描）；
- dist 预算余量 ~89.57KB（760.43/850）：v6 内容增量前按 V4-1 判据重审。