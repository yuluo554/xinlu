# HANDOFF-M6 · 第 6 棒交接单（M5 → M6）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档。
> 库内一律相对路径；会话启动命令由用户侧拼绝对路径。

## 一、当前进度 + 证据

- **M0 ✅、M1 ✅、M2 ✅、M3 ✅、M4 ✅、M5 ✅（2026-10-24）**；M5 = 打磨与门面：体验打磨 + README 产品页 + DEVELOPMENT.md + demo.gif + 构建冒烟。
- 证据（2026-10-24 当轮实测）：
  - **5.1 打磨三处**（引擎面零改动）：重开两步确认的确认态失焦复位（修"确认态永久驻留→二次单击直接清档"真实缺陷）、换屏 `scrollTo(0,0)`、进度点过渡动画（纳入 reduced-motion 兜底）。测试 67/67 绿。
  - **异常路径补测**（构建产物 preview 上实机）：存档损坏原文保留/显式重开才清档、两步重开（armed→复位→rearm 不重开→确认才清）、局中刷新续局（`resumeMatch: true`）、终局刷新续局、构建产物一键通关（190 交互，ESFJ，种子 1805937273）。留痕 [docs/M5-门面与体验清单.md](../docs/M5-门面与体验清单.md) + `docs/assets/m5-*.png` 3 张。
  - **README 产品页**：76 行（门 ≤120）；「30 秒跑起来」第 11 行（门 ≤30）；无 DoD 字样（grep 0 命中）；无里程碑占首屏（状态表移文末）；人格模型依据表照 data/README.md 三态表；已知限制照抄 01 §十；DEVELOPMENT.md 被链接。
  - **DEVELOPMENT.md** 新建（纯 plan/ 索引不复制内容）；**demo.gif** 录制入册（13.2s / 218KB，实玩 7 帧合成，录制口径见 M5 清单 §三）。
  - **数字对账**：README「112 事件 / 8+1 结局 / 16 画像 / 288 组合」与 `npm run validate -- --count` 逐项一致（M5 清单 §五）。
  - **出口验证六连**：validate 0 FAIL / test 67/67 / typecheck 0 错 / `npm run build` 产出 dist/index.html / 布局门全绿（6 个 ✅ 里程碑，状态副本 7+7 行一致）/ 脱敏门 0 命中。
  - **定名决策**：《心路》正式定名（plan/00 决策记录 2026-10-24 行）。

## 二、当前事实·状态不变量（下一棒动手前必须知道）

1. **plan/03 §2 引擎冻结五签名不变**；M5 只动了 UI 层（`src/ui/app.ts` 两处 + `src/style.css` 一处），数据与引擎未触碰。
2. **README 的状态表是机读副本**：布局门 LAYOUT.STATUS 扫"表格行且首格 M<k>、次列状态符开头"，**位置无关**——它在文末「项目进度」节，翻 M6 状态时同提交改 plan/00 总表 + README 状态表两处，再跑布局门。
3. **README 门清单是 04 §M5 的自证门**（未自动化）：行数/行位/DoD 字样等证据留痕在 docs/M5-门面与体验清单.md §四；M6 改 README 时保持 ≤120 行与第 30 行前有「30 秒跑起来」。
4. **README 线上地址是占位**：「GitHub Pages（v1.0.0 发布后在此填入）」——M6 部署后**必须回填实开 URL**（同提交）。
5. **dist/ 在 .gitignore**：实物表"游戏本体"判据是路径存在 + 可构建，不是入库；发布产物走 Release 附件 dist.zip。
6. **demo.gif 录制口径**：IAB 截帧 + ffmpeg palette 合成（帧面注入 `animation:none`，快进用同步 evaluate，双拍保底避合成器滞后帧）——重录时照 docs/M5-门面与体验清单.md §三，别用 fullPage 截图（拼接伪影，M3 已知）。
7. **backlog B1 仍在队**（⬜ 待排期）：end-04/05/07/08 线性策略不可达；M6 发布动作不碰内容平衡，不与之撞车。
8. **K1–K11 全部继续生效**（见 §四）。
9. CI workflow 已入库但从未实跑（本机无远端）——一切"CI 绿"只能写"本地等价校验（待首推验证）"；不对外宣称"项目已通过安全审计"。

## 三、下一棒待办（M6 · 发布，顺序不可颠倒，任务块见 plan/04 §M6）

1. **构建与干净环境验证**：`npm run build` → 本地静态服务实玩冒烟（可在全新端口起 `npm run preview` 或任意静态服务器；一键通关脚本套路见 §五）。
2. **Pages 部署** → 实开 URL 可玩 → **回填 README 线上地址**。
3. **CHANGELOG.md**（每条含数据口径版本；口径 = plan/02 单源 + M4 末态 112/8+1/16，见 data/README.md）。
4. **plan/05 主体**（tag 之前落盘）：发布概要 + §三「tag 时点事实」。
5. **tag（v1.0.0）**——必须晚于构建与验证；**GitHub Release**（五部分说明：变更摘要 / 口径版本 / 是否需重开历史存档 / 校验和 / 已知问题 + 附 dist.zip + sha256）。
6. **plan/05 §四「tag 后追加事实」**（部署 URL、附件 sha256、Traffic 基线）+ 覆盖对账小节（布局门 LAYOUT.RELEASE 届时启用）。
7. 收尾顺序（skill 硬约束①）：DoD 验证 → plan/00 两处副本翻 M6 ✅ + 台账"线上可玩（Pages）"行翻 ✅ + 实物表"发布留档/变更日志"两行落位 → **本仓库无 HANDOFF-M7 要求（末棒收官按 HANDOFF_EXEMPT_LAST=false 仍需写收官交接单 plan/HANDOFF-M7.md，七节）** → commit。
8. 发布前评审门：对照 00 §实物表与 01 §四验收标准逐行打勾，缺一不发版。

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

## 五、本机环境坑（实测 2026-10-23/24）

- node v24.15.0 / npm 11.12.1 / git 2.54.0.windows.1（Git Bash）；ffmpeg 8.1.1 在 PATH（WinGet Links，录 GIF 用）。
- npm 版本族：vite ^8 / vitest ^5 / typescript ^7（TS7 原生）；js-yaml v5 只有具名导出 `load`。
- TS7 + bundler 解析下导入 JSON 需 `resolveJsonModule`（已开）；`noUncheckedIndexedAccess` 开着——索引访问要 `!` 或 `?.`。
- vitest `environment: "node"` 无 DOM：viz 测试用最小 SVG 桩、存档测试用内存 localStorage stub（套路在 src/viz/viz.test.ts / src/storage/storage.test.ts）。
- 测试正则写 `/NaN/i` 会误中 SVG 属性 `dominant-baseline`——NaN 断言用大小写敏感 `/NaN|undefined/`。
- **IAB 自动化**：页面内 `setTimeout` 自驱动循环会被后台节流打断——**用同步 evaluate 循环**（`element.click()` 连点到终局屏，几秒跑完 112 卡）；evaluate 表达式必须 `"(() => {...})()"` 形式；**截图会拿到滞后的旧合成面——先拍一张暖帧丢弃再复拍**；录 GIF 注入 `animation:none` 防中间态鬼影；终局面长页面，截图前 `scrollTo(0,0)`。
- dev/preview server 用完必须清杀：`npm run preview` 的 npm 包装进程被杀后 **vite 子进程会存活**（M5 实测：TaskStop 后 4173 仍 LISTENING）——`netstat -ano | grep :4173` 找 PID → `taskkill //F //PID <pid>`。
- Windows git 显示中文文件名为八进制转义：用 `git -c core.quotepath=false status/log`。
- **本机直连 github.com 不通**（推送对策：gh-proxy 镜像 → SSH:22 → 顺延，plan/05 留痕，不虚报发布）；无远端，CI 未实跑。
- **仓库根有一份未跟踪的 `assets/` 目录（约 8.7MB 海洋游戏美术素材，dafeiyu-pet 等）**：与本项目无关、来源不明（疑为外部会话误置），M5 未动未提交——M6 发布前**不要 `git add assets/`**；处置（删除/移出/入 .gitignore）由项目方决定。
- Mimosa 对历史提交的库扫描未得出完整结论——不要对外宣称"项目已通过安全审计"。
- MBTI 口径查证渠道留痕在 data/README.md。

## 六、DoD 逐项 checklist

M5（本棒已达成，plan/00 §里程碑总表行）：
- [x] README 门清单（04 §M5）逐项过：76 行 / 第 11 行 30 秒 / 依据表 / 已知限制照抄 / 无 DoD 字样 / 无里程碑占首屏（证据：docs/M5-门面与体验清单.md §四）
- [x] `DEVELOPMENT.md` 建立且被 README 链接；`docs/assets/demo.gif` 录制入册（git add 后 `git ls-files` 可见）
- [x] `npm run build` 产出 dist 且本地 preview 冒烟可玩（一键通关 190 交互至终局）
- [x] 00 §提交材料实物表 8 项路径全部存在（Pages 与 plan/05/CHANGELOG 两项按口径待 M6）
- [x] 状态副本两处翻 M5 ✅ + 台账"演示 GIF"行翻 ✅
- [x] HANDOFF-M6 落盘（七节，本档）

M6 DoD（下一棒要达成的，来自 plan/00）：
- [ ] 三件套：tag（v1.0.0）+ Release 附产物（dist.zip + sha256）+ plan/05 留档两分栏
- [ ] Release 说明含五部分（变更摘要 / 口径版本 / 是否需重开历史存档 / 校验和 / 已知问题）
- [ ] tag 晚于构建与验证；CHANGELOG.md 每条含数据口径版本
- [ ] Pages 实开 URL 可玩 + README 线上地址回填
- [ ] 状态副本两处翻 M6 ✅ + 台账"线上可玩（Pages）"行翻 ✅
- [ ] HANDOFF-M7（收官交接单）落盘（七节）

## 七、关键命令速查（每条当轮实跑过）

```bash
node tools/check-sprint-layout.mjs          # 布局门（续接对话第一件事）
node tools/check-desensitized.mjs           # 脱敏门
npm run validate                            # 数据门（--full 已常开）
npm run validate -- --count                 # 分母汇总（README/台账数字对账）
npm test                                    # vitest run（67/67）
npm run typecheck                           # tsc --noEmit
npm run build && npm run preview            # 构建与冒烟（4173；用完清杀 vite 子进程，见 §五）
git -c core.quotepath=false log --oneline   # 中文文件名可读的日志
git ls-files docs/assets/demo.gif           # 实物表"演示 GIF"核对（M6 首推前确认已入库）
```
