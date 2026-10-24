# HANDOFF-v2-M5 · v2 收官交接单（v2-M4' → 运维期）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档。
> 本仓库 v1 里程碑 M0–M6 与 v2 里程碑 v2-M1'–M4' 已**全部 ✅**，**没有 v2-M5' 里程碑**——本档是 v2 收官交接单（布局门交接单判据只扫已 ✅ 里程碑，故本档存在但不被点名，无需 EXEMPT 登记；按 v2/04 §v2-M4' 出口门「HANDOFF（v2 收官交接单）落盘」要求撰写）。之后的日常工作按 [06-运维节奏.md](06-运维节奏.md) 轮转，迭代队列唯一存放 [backlog.md](backlog.md)。

## 一、当前进度 + 证据

- **v2-M1'–M4' 全部 ✅；v2.0.0 已发布（2026-10-24）**。三件套：
  - **tag** `v2.0.0` @ commit `c90263d`（晚于构建与部署验证：构建/干净冒烟/实开验证于 `fa1ec35` 态 → 文书 `c90263d` → tag → Release）；
  - **Release** https://github.com/yuluo554/xinlu/releases/tag/v2.0.0 （五部分说明 + 附件 dist.zip 461,988 字节，sha256 `79642f4d…f678` 自 Release 下载复核一致；解压纯静态服务双端一键通关 exit 0）；
  - **plan/05 §七 v2.0.0 留档**（发布概要 / tag 时点事实 / tag 后追加事实分栏 / DoD 声明翻齐；v2/05 骨架为载体指向该节，单源不双写）。
- **线上可玩**：https://yuluo554.github.io/xinlu/ —— v2 内容（人格鱼 mascot / 分享卡 / 图鉴 / 场景氛围 / credits）；部署 run 40086974577（`fa1ec35`）与 40087247790（`c90263d`）均 success，实开同脚本口径双端一键通关 + 图鉴断言 + 分享卡落盘 exit 0。
- **门禁终值（发布态实测）**：vitest **121/121**（106 基线 + 15 图鉴）/ 预算门 **447.29KB** 0 WARN / 可达性 9 结局 exit 0 / 许可门 0 FAIL / 数据门 6 区 0 FAIL / typecheck 0 错 / 脱敏门 0 命中 / 布局门全绿 / e2e 双端绿。
- v2 四棒全程留痕：各棒 HANDOFF（[HANDOFF-v2-M1](HANDOFF-v2-M1.md)–[M4](HANDOFF-v2-M4.md)）+ 评审门核对表（docs/v2-M1-dogfooding.md / v2-M2-gates.md / v2-M3-gates.md / [v2-M4-gates.md](../../docs/v2-M4-gates.md)）。

## 二、当前事实·状态不变量（动手前必须知道）

1. **状态副本两处 11 行全 ✅**（plan/00 里程碑总表 + README 状态表，行首格 `M<k>` / `v2-M<k>'`）——v1+v2 全部收官；布局门 RELEASE 判据已按 v2-M4' ✅ 检查 plan/05 §七 v2.0.0 节在位。
2. **v1.0.0 与 v2.0.0 的 tag 与 Release 均已发布——不许改写**：不 force-push 已发布 tag、不动已发布 Release 正文事实；后续发版走新 tag（v2.0.1+）+ 新 Release + CHANGELOG 新条目；**双层版本规则**见 plan/06（判定结论变化 → 主版本 +1 并注明历史存档需重开）。
3. **plan/05 §七 自证约定继续**：tag 时点事实不回写；新发布的事实只追加「tag 后追加」分栏。
4. **图鉴独立 key `xinlu.gallery.v2` schema 冻结**（plan/v2/02 §三）：16 型封闭 / endings 键 ⊆ 枚举 / 损坏视为空图鉴重建（刻意放宽，理由已记录）；**不读写 `xinlu.save.v1` 新字段**（K6）。图鉴格取图只走 `endingFrame`/`FRAMES`，勿新写映射。
5. **分享卡手机相册端真机补验仍欠**：iOS Safari 对 `a[download]` 的兼容未在手持设备实测（桌面机制与双端 E2E 已过；v2/00 台账与 Release 已如实写明）。首个 iOS 真机实开终局导出一次即关闭此项；若降级为预览打开，记已知限制即可，不阻塞任何事。
6. **P2 三项（PWA / 音效 / 抉择回溯）拍板不做**（2026-10-24，v2/00 §决策记录；证据 = traffic 全 0 / issue 0）——证据出现再按 06 入队，勿无证据复活。
7. **E2E `smoke.mjs` 支持 `--base-url <url>`**：干净静态冒烟与线上实开复用同一脚本口径；二局清档收窄为 `removeItem('xinlu.save.v1')`（图鉴跨局累计是其本意）。
8. **K1–K12 全部继续生效**（见 §四）。
9. **Mimosa 安全扫描未得出完整结论**（library_source 上限 / callgraph 部分）——不要对外宣称「项目已通过安全审计」。
10. **README 88 行**（门判据：≤120 行 / 「30 秒跑起来」在 ≤30 行处 / 无 DoD 字样 / DEVELOPMENT.md 与 credits 链接在位）——v2 特性节已入 README。

## 三、待办（运维期；无里程碑 DoD，按 06 节奏）

1. **分享卡手机真机补验**（不变量 5）：iOS 设备实开线上地址 → 通关 → 终局「保存分享卡」→ 相册可见即关闭；结果记 v2/00 台账分享卡行。
2. **首次 7 天回访（≈2026-10-31）**：`gh api repos/yuluo554/xinlu/traffic/views|clones` + issue 页检查，结果写入 backlog「周自查记录」；traffic 只保留 14 天，**必须周记**，否则永久丢失。
3. **v2 套件评审提醒用户**：v2/00 索引行括注「套件评审仍待用户确认」——不阻塞发布（已按计划收官），但宜向用户提请确认一次；有修改意见按 06 缺口流程处理。
4. **若发 v2.0.1+**：流程照 plan/05 §七 tag 时点事实同口径（build → 干净静态冒烟 → Pages → 实开 → CHANGELOG → plan/05 §七追加 → tag → Release → 留档）；判定类改动先过 plan/06 版本规则。
5. **外部 issue**：「判定反直觉/文案错误」按最高优先级；无反馈且满足归档判据（06 §归档）再谈归档，不主动归档。
6. **每周固定 30 分钟十类轮转一类**（06 §节奏；v2 新增第 9 类视觉回归漂移 = E2E 截图基线 diff、第 10 类素材许可漂移 = check-assets-license 输出对照台账）——「我觉得」不入队，证据制。

## 四、既定口径清单（K 编号；动了会打挂测试/门）

- **K1–K12 全部继续生效**（逐条见 [../HANDOFF-M7.md](../HANDOFF-M7.md) §四与 [HANDOFF-v2-M1.md](HANDOFF-v2-M1.md) §四）。本棒未新增 K 编号。
- 易踩重申：K2 零依赖（图鉴/发布链路零新增 npm 依赖，E2E 走 node 内置 WebSocket+CDP）；K6 存档 schema 冻结（图鉴独立 key，两把 key 互不读写）；K11 引擎五签名冻结（v2 全程仅 `radar.ts` 新增导出 `radarVertex`，新能力全走「新增文件/新增导出」路线：fish.ts / scene.ts / share-card.ts / gallery.ts）；K12 v2 数值口径只在 [02](02-数据与口径.md) 定义。
- 图鉴展示代表四维 `representativeDims`（高位字母侧 75 / 低位 25）：其与引擎高位字母的一致性由单测回环 `mbtiLetters(rep(t), env) === t` 全 16 型钉死——改引擎字母口径会打挂该测试，属预期守护。
- 状态副本两处（plan/00 + README，行首格 `v2-M<k>'`）；翻 ✅ 同提交翻齐两处 + v2 台账行 + v2/03 模块状态。

## 五、环境坑（沿用 HANDOFF-M7 §五 + HANDOFF-v2-M1/M2/M3/M4 §五 全条目 + 本棒新增实测）

- **管道吞退出码**：`cmd | tail; echo $?` 拿到的是 tail 的退出码——判成败必须 `cmd > log 2>&1; echo $?`（本棒变异自检实测踩坑： mutated e2e 首跑误报 exit 0）。
- **发布 zip 必须含 `credits.md`**：v2 起 dist 根有 credits.md 且开局/终局屏链接它——`tar -C dist index.html credits.md assets` 三件齐（沿 v1 只打 index.html+assets 的口径会 404 credits 链接）。
- 沿用：一次性脚本写 `.mjs` 文件不塞 `node -e`；sed 对含中文/引号内容不可靠（编辑用 Edit 工具或 node 脚本）；Edge headless `--screenshot` 目检本地件；CDP 下载断言（`Browser.setDownloadBehavior` page target 直发 + 目录轮询）；ffmpeg libwebp 压缩口径（alpha 保留 / lanczos / level 6）；E2E 暖帧丢弃纪律；`py` 替代 `python`；dev/preview/http.server 用完清杀（`netstat -ano | grep :<port>` → `taskkill //F //PID`）；`core.quotepath=false`；**push 一律走 SSH:22**（本棒三次 push 全成功；gh API/Release 走 HTTPS 可用）；`gh release create --notes-file` 传中文长说明。

## 六、DoD 逐项 checklist

v2-M4'（已达成，证据见 plan/05 §七 与 docs/v2-M4-gates.md）：
- [x] 4.1 图鉴：`gallery.ts` 独立 key 读写 + 图鉴屏 + 终局「未解锁型」提示 + 单测 15 项 + E2E 双端图鉴断言与截图
- [x] 4.2 P2 择项拍板：三项均不做，决策记录留行（v2/00）+ 观察区条件更新
- [x] 4.3 三件套：tag v2.0.0 @ c90263d + Release 五部分附 dist.zip（sha256 复核一致）+ plan/05 §七留档（主体 + 追加）；CHANGELOG 含新分母 121 + 历史存档建议重开声明 + credits 引用；README 增量且 88 行门过
- [x] 评审门（强核查）：02 §三 ↔ gallery.ts ↔ 单测三方核对表（docs/v2-M4-gates.md §一；变异自检红→复原绿留痕）
- [x] 出口门全绿：8 门 + e2e（布局/脱敏/数据 6 区/typecheck/121 单测/可达性 9 结局/许可/预算 447.29KB）
- [x] 翻面同提交：状态副本两处 + v2 台账 2 行 + v2/00 索引 05 行 + v2/03 模块 4/6 ✅
- [x] 本交接单（v2 收官交接单）七节落盘

v1+v2 全部里程碑 ✅；运维期无新里程碑 DoD，日常达成判据 = plan/06 节奏与归档判据、backlog 证据制、发版走双层版本规则。

## 七、关键命令速查（每条当轮实跑过）

```bash
node tools/check-sprint-layout.mjs          # 布局门（续接对话第一件事）
node tools/check-desensitized.mjs           # 脱敏门
npm run validate                            # 数据门（6 区含 fish-mood-map M 区）
npm run validate -- --count                 # 分母汇总（README/CHANGELOG 数字对账）
npm test                                    # vitest run（121/121）
npm run typecheck                           # tsc --noEmit
npm run e2e                                 # E2E 双端通关 + mascot/场景/分享卡/图鉴/credits 断言
node tests/e2e/smoke.mjs --no-build --base-url http://127.0.0.1:<port>/   # 干净静态/线上实开复用口径
py -m http.server <port> --bind 127.0.0.1 --directory dist                # 干净静态服务（用完清杀）
node scripts/check-ending-reachability.mjs  # 可达性扫描门（退出码 0 全可达）
npm run gate:license                        # 许可门
npm run gate:budget                         # 预算门（无 dist 先 build）
npm run build                               # vite build
/c/Windows/System32/tar.exe -a -c -f dist.zip -C dist index.html credits.md assets   # 发布 zip（credits.md 必含）
sha256sum dist.zip                          # 校验和（Release 说明 + plan/05 §七两处一致）
gh release create v2.0.0 dist.zip --title <标题> --notes-file <说明文件>              # Release（五部分说明）
gh api repos/yuluo554/xinlu/traffic/views   # Traffic 周记（14 天滚动窗口）
git push                                    # 走 origin（SSH）；HTTPS 443 间歇不通，别换回
git -c core.quotepath=false status          # 中文可读 status
```
