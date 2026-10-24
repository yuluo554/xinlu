# HANDOFF-M7 · 收官交接单（M6 → 运维期）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档。
> 本仓库里程碑 M0–M6 已全部 ✅，**没有 M7 里程碑**——本档是收官交接单，之后的日常工作按 [06-运维节奏.md](06-运维节奏.md) 轮转，迭代队列唯一存放 [backlog.md](backlog.md)。

## 一、当前进度 + 证据

- **M0–M6 全部 ✅；v1.0.0 已发布（2026-10-24）**。三件套：
  - **tag** `v1.0.0` @ commit `3f64564`（晚于构建与验证；构建 10:38 → 部署 run 40054975413 成功 → tag）；
  - **Release** https://github.com/yuluo554/xinlu/releases/tag/v1.0.0 （五部分说明 + 附件 dist.zip 34,058 字节，sha256 `eba80e63…13c46d` 自 Release 下载复核一致）；
  - **plan/05 留档**两分栏齐 + 覆盖对账小节（§四/§五/§六）。
- **线上可玩**：https://yuluo554.github.io/xinlu/ —— 实开一键通关 191 交互至 ESFJ 终局（种子 1807934004），截图 docs/assets/m6-pages-ending.png；干净环境（纯静态服务）同口径通关留痕 docs/assets/m6-clean-static-ending.png。
- M6 全程留痕：[docs/M6-发布清单.md](../docs/M6-发布清单.md)（流水线六步 / 发布前评审门逐行 / README 门复验 / 通道事实）。
- Traffic 基线（发布当日）：views 0 / clones 0 / stars 0 / open issues 0（gh api 实查，录 plan/05 §四）。

## 二、当前事实·状态不变量（动手前必须知道）

1. **远端已建**：`yuluo554/xinlu`（public，MIT，homepage 指 Pages，topics 5 枚）；`origin` = SSH 地址；push 一律走 SSH（见 §五）。
2. **Pages = Actions 模式**：`.github/workflows/deploy-pages.yml`，push main 自动重建部署（部署前强制 typecheck / validate / test 全过）；Pages 已 `build_type=workflow` 启用，勿改回分支模式。
3. **v1.0.0 tag 与 Release 已发布——不许改写**：不 force-push 已发布 tag、不动已发布 Release 正文事实；后续发版走新 tag（v1.0.1+）+ 新 Release + CHANGELOG 新条目；**双层版本规则**见 plan/06（结局/画像判定结论变化 → 主版本 +1 并注明历史存档需重开）。
4. **plan/05 自证约定继续**：已有事实不回写；新发布的事实只追加 §四（或新发布另起小节），覆盖对账 §六 随新版更新。
5. **状态副本两处**（plan/00 里程碑总表 + README 状态表）7 行全 ✅ 且行数门 7+7——未来若新增里程碑或重开迭代，同提交翻齐两处再跑布局门。
6. **backlog B1 在队**（⬜ 待排期）：end-04/05/07/08 线性策略不可达；按 06 评分（影响 2 × 成本 2）排期，动内容平衡须复跑可达性扫描并回填台账。
7. **K1–K11 全部继续生效**（见 §四）。
8. **CHANGELOG 每条含数据口径版本**（v1.0.0 条目为范式）；口径单源仍在 plan/02，对账 `npm run validate -- --count`。
9. **CI 已有实跑记录**（run 40054672747 绿）——此前"CI 绿只能写待首推"的限制解除；但本地等价校验仍是纪律主体，CI 为旁证。
10. **仓库根 `assets/` 未跟踪目录仍在**（约 8.7MB 海洋游戏素材，与本项目无关，来源不明）：发布时未入库未处置，处置（删除/移出/入 .gitignore）仍由项目方决定；勿 `git add assets/`。
11. Mimosa 对历史提交的库扫描未得出完整结论——不要对外宣称"项目已通过安全审计"。

## 三、待办（运维期；无里程碑 DoD，按 06 节奏）

1. **首次 7 天回访（≈2026-10-31）**：`gh api repos/yuluo554/xinlu/traffic/views|clones` + issue 页检查，结果写入 backlog「周自查记录」；traffic 只保留 14 天，**必须周记**，否则永久丢失。
2. **B1 平衡缺口排期**：按 06 评分决定本月是否做；动手 = 补 T/P 侧语义事件 + 复跑可达性扫描 + dogfooding，防回退测试同行交付。
3. **若发 v1.0.1+**：流程照 docs/M6-发布清单.md §一（构建 → 干净环境验证 → CHANGELOG → tag → Release → plan/05 追加）；判定类改动先过 plan/06 版本规则。
4. **外部 issue**：「判定反直觉/文案错误」按最高优先级；无反馈且满足归档判据（06 §归档）再谈归档，不主动归档。
5. 每周固定 30 分钟八类轮转一类（06 §节奏），「我觉得」不入队，证据制。

## 四、既定口径清单（K 编号；动了会打挂测试/门）

- **K1 口径单源**：数值口径只在 plan/02 定义一处；引擎/前端/测试/数据文件不得复写口径。
- **K2 零运行时依赖**：`dependencies` 空；守门测试在 tests/skeleton.test.ts。
- **K3 状态行 = 表格行**：状态格以状态符开头；plan/00 里程碑总表 + README 状态表两处副本同步翻。
- **K4 提交信息中文**，沿用「心路：」前缀。
- **K5 布局门判据只落仓库内文件**；门必须打印扫描计数（非空跑自证）。
- **K6 存档 key 口径**：`xinlu.save.v1`（已实装；schema v 变更则 key 同步变，旧 key 迁移后清理）。
- **K7 校验脚本入口名**：`npm run validate`（M1 实装；M4 起默认带 `--full`）。
- **K8 birth-map 合成口径**：初始值 = 中立值 50 + 四要素修正量之和；引擎不对初始值钳制。
- **K9 数据门 --full 常开**（M4 落地）：密度矩阵 + 画像字数每跑必查。
- **K10 flag/引用纪律**：flag 小写 kebab；`pre` 只许引用更早事件定义的 flag；endings 引用的 flag 必须闭合。
- **K11 契约冻结**（M2）：plan/03 §2 引擎签名冻结；M3 访问器扩展与 M4 数据面替换是仅有的两处已回写文档的例外。

## 五、环境坑（实测 2026-10-23/24，运维期沿用）

- **push 一律走 SSH:22**（`git@github.com:yuluo554/xinlu.git`）：HTTPS 443 对 github.com 间歇不通（git push 实测两次失败）；本机存在系统级回环代理但 git 不读取系统代理（端口按脱敏纪律不入任何库内文件）；gh API（HTTPS）通路可用，仓库/Release/Pages 管理均走 gh。
- node v24.15.0 / npm 11.12.1 / git 2.54.0.windows.1（Git Bash）；ffmpeg 8.1.1 在 PATH（录 GIF 用）。
- npm 版本族：vite ^8 / vitest ^5 / typescript ^7（TS7 原生）；js-yaml v5 只有具名导出 `load`；`noUncheckedIndexedAccess` 开着；导入 JSON 需 `resolveJsonModule`（已开）。
- vitest `environment: "node"` 无 DOM：viz 测试用最小 SVG 桩、存档测试用内存 localStorage stub（套路在 src/viz/viz.test.ts / src/storage/storage.test.ts）；NaN 断言用大小写敏感 `/NaN|undefined/`（`/NaN/i` 会误中 `dominant-baseline`）。
- **`python` 是 Windows Store 占位符（exit 49 零输出）**——用 `py` 或 Python312 全路径。
- **打发布 zip 用 `/c/Windows/System32/tar.exe -a -c -f dist.zip -C dist index.html assets`**：PowerShell Compress-Archive 的条目名是反斜杠，Linux unzip 兼容差。
- dev/preview/静态 server 用完必须清杀：vite 孤儿进程存活（TaskStop 后端口仍 LISTENING）——`netstat -ano | grep :<port>` 找 PID → `taskkill //F //PID <pid>`。
- **IAB 自动化套路**：页面内 setTimeout 循环会被节流打断——用同步 evaluate（`"(() => {...})()"` 形式，`element.click()` 连点）；截图先拍暖帧丢弃再复拍（合成器滞后）；录 GIF 注入 `animation:none`；长页面截图前 `scrollTo(0,0)`；构建产物相对 base 后 Pages 子路径与本地静态服务同构。
- Windows git 显示中文文件名为八进制转义：`git -c core.quotepath=false status/log`。
- 本地 `dist.zip` 与 `dist/` 已在 .gitignore（附件走 Release，不入库）；仓库根 `assets/` 未跟踪（见 §二.10）。
- MBTI 口径查证渠道留痕在 data/README.md。

## 六、DoD 逐项 checklist

M6（已达成，证据见 plan/05 §五/§六 与 docs/M6-发布清单.md）：
- [x] 三件套：tag v1.0.0 + Release 附产物（dist.zip + sha256 复核一致）+ plan/05 留档两分栏 + 覆盖对账
- [x] Release 说明五部分（变更摘要 / 口径版本 / 是否需重开历史存档 / 校验和 / 已知问题）
- [x] tag 晚于构建与验证；CHANGELOG.md 每条含数据口径版本
- [x] Pages 实开 URL 可玩 + README 线上地址回填
- [x] 状态副本两处翻 M6 ✅ + 台账"线上可玩（Pages）"行翻 ✅ + 实物表"发布留档/变更日志"两行落位
- [x] HANDOFF-M7（收官交接单，本档）落盘（七节）

运维期无新里程碑 DoD；日常达成判据 = plan/06 节奏与归档判据、backlog 证据制、发版走双层版本规则。

## 七、关键命令速查（每条当轮实跑过）

```bash
node tools/check-sprint-layout.mjs          # 布局门（续接对话第一件事）
node tools/check-desensitized.mjs           # 脱敏门
npm run validate                            # 数据门（--full 已常开）
npm run validate -- --count                 # 分母汇总（README/CHANGELOG 数字对账）
npm test                                    # vitest run（67/67）
npm run typecheck                           # tsc --noEmit
npm run build && npm run preview            # 构建与冒烟（用完清杀 vite 子进程）
git push                                    # 走 origin（SSH）；HTTPS 443 间歇不通，别换回
gh api repos/yuluo554/xinlu/traffic/views   # Traffic 周记（14 天滚动窗口）
gh release download v1.0.0 --pattern "dist.zip" --dir <tmp>  # 附件复核 sha256
/c/Windows/System32/tar.exe -a -c -f dist.zip -C dist index.html assets   # 发布 zip（正斜杠条目）
git -c core.quotepath=false log --oneline   # 中文可读日志
```
