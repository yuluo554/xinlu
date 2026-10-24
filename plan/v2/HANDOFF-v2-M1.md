# HANDOFF-v2-M1 · 交接单（v2 装订/骨架棒 → v2-M1' 回归基线与内容修复）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档。
> 上一棒（本档作者）完成的是 **v2 计划套件装订 + 骨架**，不是 v2-M1' 本身——v2-M1' 的三块任务一件都没开工。

## 一、当前进度 + 证据

- **v1.0.0 已发布收官**（tag `v1.0.0` @ `3f64564`，M0–M6 全 ✅，收官事实见 [../HANDOFF-M7.md](../HANDOFF-M7.md)）。
- **v2.0 计划套件已装订并入库**（2026-10-24）：[00-README总览](00-README总览.md)（总览/决策记录/台账/里程碑总表）、[01-题目文档](01-题目文档.md)（十段式）、[02-数据与口径](02-数据与口径.md)（avatar 参数/表情映射/图鉴/分享卡/许可白名单/预算，K12 数据门口径单源）、[03-模块清单与验收](03-模块清单与验收.md)（6 模块+依赖图）、[04-里程碑任务分解](04-里程碑任务分解.md)（v2-M1'–M4' 任务块）、[05-发布留档](05-发布留档.md)（骨架，待 M4' 撰写主体）、[06-运维节奏](06-运维节奏.md)、[backlog](backlog.md)（待启用）。上游方案 [../07-2.0优化方案.md](../07-2.0优化方案.md)（§九已补「人格鱼空白论据」中英两组检索快照，软论据）。
- **装订面增量**：布局门已 v2 感知（扫 `plan/v2/`、状态行双格式 `M<k>`/`v2-M<k>'`、v2 交接单路径 `plan/v2/HANDOFF-v2-M<k>.md`、双台账/双 backlog 扫描、`PENDING_TOOLS` 登记值改里程碑 ID）；[../AGENTS.md](../AGENTS.md) 强制布局表新增 v2 行；`plan/00` 决策记录新增装订行（装订位置 plan/v2/ + 标号 `v2-M1'–M4'` 的弃选项理由）。
- **两处状态副本已加 v2 四行（⬜ 待开工）**：`plan/00` 里程碑总表 + `README.md` 状态表，布局门确认 2 副本 × 11 里程碑全一致。
- **骨架件**：`tests/e2e/README.md` 占位（契约指针；`npm run e2e` 入口**故意未加**，随 v2-M1' 1.1 同提交）；`.gitignore` 护栏增量（原始 zip + ❌ 层素材永不入库）。
- **门禁现状（2026-10-24 实测）**：布局门全绿（20 文档 / 17 小节组 / 6 点名脚本其中 3 个 PENDING_TOOLS 登记 / 双台账 16 行）/ 脱敏门 0 命中 / 数据门 0 FAIL / typecheck 0 错 / vitest 67/67（v1 基线只增不减的起点）。
- **本棒门禁变异自检（7/7 变红→复原绿）**：状态副本冲突、缺 v2 交接单、点名脚本 stale、v2 台账挂未完成、队列过期行、v2 必备文件缺失、登记项被删（missing 分支）。变异中抓出并修复门脚本一个真 bug（v2 交接单文件名提取误匹配 "v2" 中的数字 → 改 `k.match(/v2-M(\d+)'$/)`）。键边界防误伤同时被证（v1 "M1" 不误命中 "v2-M1'" 文本）。

## 二、当前事实·状态不变量（动手前必须知道）

1. **v2 里程碑标号是 `v2-M1'–M4'`，不是 M7–M10**——标号顺延会与 [../HANDOFF-M7.md](../HANDOFF-M7.md)（v1 收官交接单，**已存在且不可挪用**）文件名冲突。机读状态副本行首格写 `v2-M1'` 等；交接单文件名**不带撇号**（`plan/v2/HANDOFF-v2-M1.md`）。唯一真相源：[../AGENTS.md](../AGENTS.md) 强制布局表 v2 行 + `plan/00` 决策记录 2026-10-24 装订行。
2. **D1（大肥鱼素材公开分发范围 A/B/C）尚未拍板，是用户动作**：结论与三选项见 [00-README总览.md](00-README总览.md) §决策记录「D1 待拍板」行，B 档为建议。**不拍板不得开工 v2-M2'**（用 fish/ 素材的模块）；v2-M1' 的 1.1（E2E）/1.3（B1）不依赖素材可先行，1.2（assets 跟踪策略）的 ⚠️ 层部分依赖 D1。
3. **`assets/` 的定性已变**：[../HANDOFF-M7.md](../HANDOFF-M7.md) §二.10 写的「约 8.7MB 与本项目无关、来源不明、勿 git add」**已被 v2 立项取代**——它是按需求采集的 v2 素材库，溯源与许可结论单源 = [../../assets/README.md](../../assets/README.md) 台账。勿 `git add assets/` 整目录扫入：入库策略在 v2-M1' 1.2 逐组落（.gitignore 已挡 zip 与 ❌ 层）。
4. **两份 backlog 并存**：[../backlog.md](../backlog.md)（v1，B1 在队 ⬜ 待排期——v2-M1' 1.3 承接实施，**做完同提交关闭该行**）+ [backlog.md](backlog.md)（v2，待启用）。布局门两份都扫"过期待 M<k>"。
5. **PENDING_TOOLS 三笔登记**（`tools/check-sprint-layout.mjs`）：`scripts/check-ending-reachability.mjs`→v2-M1'、`tools/check-assets-license.mjs`/`tools/check-dist-budget.mjs`→v2-M3'。**里程碑翻 ✅ 的同提交必须落位脚本并删登记**，否则 stale 分支变红；反之删登记不落位会打挂 missing 分支。
6. **v2 全部走「新增导出/新增文件」路线**：K11 冻结（引擎五签名、viz `sanitize`、存档 key 口径）不动；avatar 不许出现 16 型字面量分支（测试 grep 守护）；表情映射单源 `src/data/fish-mood-map.json`（K12 数据门待 v2-M2' 扩 validate）。
7. **v2/05 是骨架**：发布留档主体在 v2-M4' 撰写，届时并入 [../05-发布留档.md](../05-发布留档.md) 新增 v2.0.0 节（单源不双写）；布局门在 v2-M4' ✅ 后会检查 plan/05 含 v2.0.0 节。
8. **本套件状态 = ⬜ 待评审**（`plan/00` 文档索引 v2 行）：用户评审通过后把该行翻 🟡/✅（同提交翻齐两处状态副本再跑布局门）；评审意见走决策记录追加，不改写已定稿段落语义。
9. **plan/07 §八/§九 的软论据标记**：16personalities 观察已翻 🟡 部分核对；「人格鱼空白」✅（软论据，否定性结论无法穷尽验证）——后续任何市面论述引用时保持这个诚实度，别升格成硬锚点。

## 三、待办（v2-M1' 三块 + 前置）

1. **1.1 E2E 冒烟**：`tests/e2e/smoke.mjs` IAB 驱动 375/1280 一键通关（同步 evaluate 连点、暖帧丢弃，套路 [../HANDOFF-M7.md](../HANDOFF-M7.md) §五）；`package.json` 加 `"e2e"` 入口（与脚本同提交）；故意改错断言必红的自检留痕。
2. **1.2 assets/ 跟踪策略落地**：按 [../../assets/README.md](../../assets/README.md) 台账逐组落（压缩 WebP 入库、❌ 层与 zip 保持 .gitignore 排除、单张 ≤50KB 核查）；⚠️ 层（fish/ 62 张）处置等 D1。
3. **1.3 B1 修复**：补 T/P 侧语义事件（守 v1 密度矩阵与 |Δ| 口径，单源 [../02-数据与口径.md](../02-数据与口径.md) v1 套件）→ `scripts/check-ending-reachability.mjs`（02 §五口径：0 全可达 / 1 存在不可达）→ 防回退测试同行交付（删补齐事件扫描必红）→ dogfooding ≥2 局留痕 → **关闭 v1 backlog B1 行**。
4. **出口门**：公共门全绿 + `npm run e2e` 绿；评审门（强核查）：B1 新增事件 delta 与 flag 引用逐条对照口径单源。
5. **持续挂起**：D1 拍板（用户动作）——v2-M2' 开工前必须完成；逾期按 [04-里程碑任务分解](04-里程碑任务分解.md) 风险表升级 ⛔。

## 四、既定口径清单（K 编号；动了会打挂测试/门）

- **K1–K11 全部继续生效**（逐条定义见 [../HANDOFF-M7.md](../HANDOFF-M7.md) §四：单源纪律/零依赖/状态行机读/中文提交/布局门判据仓内/存档 key/validate 入口/birth-map 合成/--full 常开/flag 纪律/契约冻结）。
- **K12（v2 新增，口径单源 [02-数据与口径](02-数据与口径.md)）**：avatar 四参数线性映射表、表情映射 19 张三触发类别、图鉴 `xinlu.gallery.v2` schema、分享卡 1080×1440 规格、许可白名单三层、预算 gzip ≤500KB/单 WebP ≤50KB。**v2 数值口径只在本档 02 定义**，与 v1 plan/02 并列为两个单源，禁止互相复写。
- **状态副本两处**：`plan/00` 里程碑总表 + `README.md` 状态表，行首格 `v2-M<k>'`；翻 ✅ 必须同提交翻齐两处 + 对应 v2 台账行（`plan/v2/00` §承诺-证据台账）。
- **提交信息中文、`心路：` 前缀**（K4 延续）；v2 腿的 HANDOFF 落 `plan/v2/HANDOFF-v2-M<k>.md`（七节）。

## 五、环境坑（实测沿用 + 本棒新增）

- 沿用 [../HANDOFF-M7.md](../HANDOFF-M7.md) §五 全部条目（SSH push、IAB 同步 evaluate、vite 孤儿进程清杀、tar 打包正斜杠、`core.quotepath=false`、python 占位符等）。
- **布局门 execSync 变异测试的坑（本棒实测）**：门 FAIL 时退出码 1，`execSync` 直接抛异常——变异脚本必须 try/catch 取 `e.stdout`；且**变异脚本崩溃会把翻转态留在盘上**，重跑前先 `grep` 确认目标文件复原（本棒 README 曾因此残留脏状态，手工复原）。
- **`v2-M1'` 这类带撇号的标号**：Windows 文件名合法，但正则提取数字时勿用 `/(\d+)/`（会先命中 "v2" 的 2），要用锚定的 `/v2-M(\d+)'$/`（本棒实测踩过并已修）。

## 六、DoD 逐项 checklist（本棒 = v2 装订/骨架棒）

- [x] v2 计划套件 00–06+backlog 落 `plan/v2/` 并入库，各含必需小节（布局门 LAYOUT.FILES/SECTIONS 20/17 断言）
- [x] `plan/00` 索引登记 v2 行 + 决策记录装订行（弃选项理由在案）
- [x] 布局门 v2 感知：状态行/HANDOFF/台账/队列/点名脚本五面扩展，**变异自检 7/7 红→复原绿**（记录见 §一）
- [x] 两处状态副本 v2 四行 ⬜（布局门 2 副本 × 11 里程碑一致）
- [x] `PENDING_TOOLS` 登记与 v2 计划里程碑对齐（v2-M1'/v2-M3' 各就位）
- [x] 「人格鱼空白论据」检索快照落 plan/07 §九（v2/01 §五锚点 ⬜→✅ 软论据）
- [x] `.gitignore` 护栏（zip + ❌ 层）+ `tests/e2e/` 占位（`npm run e2e` 入口故意不预加）
- [x] 全门绿：布局门/脱敏门/数据门 0 FAIL/typecheck 0 错/vitest 67/67
- [x] 本交接单七节落盘（下一棒 = v2-M1'）
- [ ] v2 套件评审 + D1 拍板（**用户动作，非本棒可完成**——挂起项，见 §三.5）

## 七、关键命令速查（每条当轮实跑过）

```bash
node tools/check-sprint-layout.mjs          # 布局门（续接对话第一件事；现在含 v2 套件断言）
node tools/check-desensitized.mjs           # 脱敏门
npm run validate                            # 数据门（v1 口径 --full 常开；K12 扩展随 v2-M2'）
npm test                                    # vitest run（当前 67/67 = v2 基线）
npm run typecheck                           # tsc --noEmit
git push                                    # 走 origin（SSH）；别换回 HTTPS
npm run validate -- --count                 # 分母汇总（README/CHANGELOG 数字对账）
git -c core.quotepath=false log --oneline   # 中文可读日志
git check-ignore assets/cc-by/open-ocean-game-art/OpenOceanArt.zip   # 验证 ❌/zip 护栏生效
```
