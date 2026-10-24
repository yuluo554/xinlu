# HANDOFF-v2-M2 · 交接单（v2-M1' 回归基线棒 → v2-M2' 人格鱼 avatar）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档。
> 上一棒（本档作者）完成的是 **v2-M1' 全部三块**（1.1 E2E / 1.2 assets 策略 / 1.3 B1 修复）。

## 一、当前进度 + 证据

- **v2-M1' 全 ✅（2026-10-24）**，两处状态副本已翻（plan/00 + README，布局门 2 副本 × 11 里程碑一致）：
  - **1.1 E2E**：[tests/e2e/smoke.mjs](../../tests/e2e/smoke.mjs) + `npm run e2e` 入口——node 内置 WebSocket 直连 CDP 驱动本机 Edge 无头（零新增依赖，K2 延伸），375/1280 双端各完整通关至 end-06 ESFJ，断言 h2 / `.ending-type` / 雷达 SVG；断言改错必红自检（`/^XX$/` 变异 → FAIL「终局类型字母非法」→ 复原绿）；截图 docs/assets/e2e-smoke-{375,1280}.png。
  - **1.2 assets 策略**：`assets/web-ready/` 40 件压缩 WebP 入库（单张 ≤50KB 核查 40/40 全绿；转换口径见 [assets/README.md](../../assets/README.md) §跟踪策略）+ 许可/溯源文本 + SVG 矢量源；原始位图件（png/gif/ico/zip）与 ⚠️ `fish/` 层 .gitignore 排除；`git status` 对账台账 0 位图混入。
  - **1.3 B1**：补 9 条 T/P 侧语义事件（112→121 条）→ [scripts/check-ending-reachability.mjs](../../scripts/check-ending-reachability.mjs) 96 组扫描 9 结局全可达退出码 0（修复前 end-04/05/07 不可达基线已实测）→ 防回退测试 [tests/reachability-full / -regression].test.ts 三方向变异自检全红留痕 → dogfooding 3 局留痕 [docs/v2-M1-dogfooding.md](../../docs/v2-M1-dogfooding.md)（局 C 真实 UI 实玩命中 **end-05 ISTP**）→ [v1 backlog B1 行已关闭](../../backlog.md)。
- **门禁现状（2026-10-24 实测）**：布局门全绿（交接单 7 份）/ 脱敏门 0 命中 / 数据门 0 FAIL（--full 含密度矩阵）/ typecheck 0 错 / vitest **70/70**（67 v1 基线 + 3 可达性新测试）/ 扫描门 0 / e2e 绿。`PENDING_TOOLS` 已删 v2-M1' 登记（脚本落位同提交），仅剩 v2-M3' 两笔。
- **v2 backlog 已启用**：[v2/backlog.md](backlog.md) 队列首条 V2-1（坏件 `正面_238.png` 重下，影响 1 / 成本 0.5）。
- **评审门（强核查）已过**：B1 新增 9 条事件 delta 逐条对照口径单源——8×context 选项 {sn:-2, tf:-2, jp:-3} 与 {ei:+1, sn:+1}（|Δ| 各维 ≤3 ✓ v1 plan/02 §一）；1×critical {jp:-6, tf:-2} 与 {ei:-1, sn:+1}（|Δ| ≤8 ✓）；全部不带 flag（endings flag 引用闭合不受扰，validate X.REF ✓）；密度矩阵 main 4–6 / context ≥8 / critical ≥2 持续全绿（v2/02 §五「新增事件守 v1 schema 与偏移口径」）。

## 二、当前事实·状态不变量（动手前必须知道）

1. **v2 里程碑标号仍是 `v2-M1'–M4'`，交接单文件名不带撇号**；下一棒 = v2-M2'，收尾写 `plan/v2/HANDOFF-v2-M3.md`。
2. **D1（大肥鱼素材公开分发范围 A/B/C）仍未拍板，是用户动作**——**不拍板不得开工 v2-M2'**（2.1 fish/ 素材、2.2 mascot 都用 ⚠️ 层素材）；见 [00 §决策记录「D1 待拍板」行](00-README总览.md)。v2 套件评审（`plan/00` 索引 v2 行翻 🟡/✅）同样待用户。
3. **engine.ts 有两处 v2 兼容改动（K11 五签名未动）**：三个 JSON import 加 `with { type: "json" }` + `from "./model.ts"` 显式扩展名（tsconfig 新开 `allowImportingTsExtensions`）。这是为了让同一份引擎文件可被 node 原生执行（可达性扫描复用真实引擎的根基）——**新引擎侧代码沿用此模式**；vite/vitest/tsc 三方已验证兼容。
4. **vitest 走 vite 模块管线**：`node:module.registerHooks` 拦不到它——剔除模式测试用 `vi.mock("../src/data/events.json")`（清单单源仍是脚本内 `V2_B1_EVENT_IDS`）；**同进程内引擎/JSON 模块只载一次**，全量与剔除两种扫描不可混跑（靠 vitest 每文件模块隔离，见两个测试文件的头注释）。
5. **E2E 的环境依赖**：本机 Edge（`C:\Program Files (x86)\...\msedge.exe`，候选路径数组在脚本头）+ 端口 4173/9223 空闲；**CI（ubuntu runner）目前不跑 e2e**（未加 job——runner 浏览器路径不同，是否纳入 CI 留给 v2-M2'/M4' 决策，不虚报「CI 含 e2e」）。e2e 每次先 `vite build` 再 preview，`--no-build` 可跳过构建。
6. **事件库 121 条（分母已变）**：README 产品页与 plan/00 台账已更新；**CHANGELOG.md v1.0.0 条目与 docs/M4-dogfooding.md 的「112」是 v1.0.0 时点历史事实，按「已有事实不回写」纪律不改**——v2.0.0 发布时在 CHANGELOG 新条目写新分母并声明「历史存档建议重开」（B1 改判定 = 双层版本规则主版本 +1）。
7. **assets/ 跟踪策略已锁**：git 只跟踪 `assets/web-ready/`（≤50KB WebP）+ 许可/溯源文本 + SVG；png/gif/ico/zip 与 `fish/` 整目录被 .gitignore 挡（v2-M2' 若 D1 拍板为 B 档，须**显式豁免 `fish/` 并在台账记档**，勿删规则）。坏件 `正面_238.png` 不转换（V2-1 重下）；whale 全量图集仍登记未下载。
8. **扫描脚本两用**：CLI（退出码 0/1，`--without-v2-b1-events` 剔除模式）+ 进程内 `runScan()`（.d.mts 提供类型）；它 import TS 引擎靠 node 24 类型剥离——引擎文件语法若用了 enum/namespace 等不可剥离特性会打断这条路（v2-M2' 新增 viz/fish.ts 不受影响，fish.ts 走 vite）。
9. **`plan/07` §九软论据诚实度纪律继续**（16personalities 观察 🟡 部分核对）——v2-M2' 表情映射引用行为论据时维持。

## 三、待办（v2-M2' 三块 + 前置）

1. **前置硬门槛：D1 拍板**（用户动作）——逾期按 [04 §风险表](04-里程碑任务分解.md) 升级 ⛔。
2. **2.1** `src/viz/fish.ts`：`createFishParams` 纯函数（口径单源 [02 §一](02-数据与口径.md) 参数表，四参数线性映射）+ `renderFish`（DOM 收窄面：createElementNS/setAttribute/sanitize）+ `src/data/fish-mood-map.json`（19 张三触发类别，02 §二）；单测：参数边界 0/50/100、确定性、NaN 回落、映射 19/19；**grep 测试守护 fish.ts 无 16 型字面量分支**。
3. **2.2** mascot 接入：卡片流反馈（choice 类）、阶段小结转场（stage 类）、终局主视觉（ending 类）；E2E 补 mascot 渲染断言；375/1280 截图留痕 docs/assets/。
4. **2.3** validate 扩展映射校验（K12 新增项：覆盖 19/19、类别枚举、终局 9 张不重复）；故意删一条映射必红留痕。
5. **出口门**：公共门全绿 + `npm run e2e` 绿；**评审门（强核查）**：02 §一参数表 ↔ fish.ts 实现 ↔ 单测三方一致性——口径第二表述即缺陷。

## 四、既定口径清单（K 编号；动了会打挂测试/门）

- **K1–K12 全部继续生效**（逐条见 [HANDOFF-v2-M1.md](HANDOFF-v2-M1.md) §四与 [../HANDOFF-M7.md](../HANDOFF-M7.md) §四）。
- 本棒未新增 K 编号；下列为易踩的既有条目重申：K2 零依赖（e2e 用 node 内置 WebSocket/CDP，**不得引入 playwright/puppeteer**）；K11 引擎五签名冻结（engine.ts 兼容改动是 import 形态，不是签名）；K12 v2 数值口径只在 [02](02-数据与口径.md) 定义。
- 状态副本两处（plan/00 + README，行首格 `v2-M<k>'`）；翻 ✅ 同提交翻齐两处 + [v2 台账行](00-README总览.md) + [v2/03 模块状态](03-模块清单与验收.md)。

## 五、环境坑（沿用 HANDOFF-v2-M1 §五 + 本棒新增实测）

- **vite preview 默认只绑 `[::1]`（IPv6）**：按 IPv4 回环地址访问连不上——spawn 加 `--host 127.0.0.1`（smoke.mjs 已带；文档写端口一律用 `<port>` 占位，脱敏门拦 `127.0.0.1:<数字>` 字面量）。
- **node 原生执行 TS 的三件套**：动态 import Windows 绝对路径必须 `pathToFileURL()`；JSON import 必须 `with { type: "json" }`；模块相对 import 必须显式 `.ts` 扩展名。少一件即 ERR。
- **node:module 钩子拦不到 vitest**（vite 管线接管模块加载）：测试内做数据变体用 `vi.mock`；同进程 JSON 只首载一次，变体模式靠 vitest 文件级隔离分文件。
- **.mjs 文件不能写任何 TS 语法**（`!` 非空断言、`: void` 注解都会 SyntaxError）——本棒两次踩到，node 报错位置在 `!` 处。
- **Edge 无头 profile 目录清理**：taskkill 后句柄延迟释放，`rmSync` 会 EPERM——killAll 后 `sleep(300)` 再容错清理（smoke.mjs finally 块已处理）；残留 profile 在系统临时目录不碍事，下次启动前会再清。
- **Git Bash 的 `/tmp` 与 node 的 `/tmp` 不是同一处**（node 解析到当前盘 `\tmp`）——node 临时文件走 `os.tmpdir()`，别手拼 `/tmp`。
- **git checkout 复原未提交数据 = 数据丢失**：本棒 events.json 的新事件曾这样被清掉重写——未提交改动的复原用备份文件（`cp` 到仓库外），不用 git。
- **镜像续传坏件实例**：`正面_238.png` IEND 在尾部但 IDAT 错位（ffmpeg 报 Invalid PNG signature）——下载校验不能只看头尾，chunk 结构闭合（IDAT 声明长度 = 实际）才算完好。
- 沿用：SSH push、IAB 同步 evaluate 连点、vite 孤儿进程清杀、`core.quotepath=false`、`py` 替代 python（HANDOFF-M7 §五全条目）。

## 六、DoD 逐项 checklist（本棒 = v2-M1'）

- [x] 1.1 E2E：`tests/e2e/smoke.mjs` + `npm run e2e` 入口同提交；双端一键通关绿；断言改错必红自检留痕
- [x] 1.2 assets：web-ready 40 件 ≤50KB 全绿入库；❌ 层/zip/⚠️ fish/ 排除对账 `git status` 0 位图混入；.gitignore 注释增量同提交
- [x] 1.3 B1：9 条 T/P 侧事件（口径逐条对照留痕 §一）+ 扫描门 0 + 防回退测试三方向必红 + dogfooding 3 局留痕 + v1 backlog B1 行关闭
- [x] 出口门全绿：布局门/脱敏门/数据门/typecheck/70/70/扫描门 0/e2e 绿
- [x] 翻面同提交：状态副本两处 + v2 台账 2 行 + v2/03 模块 1/6 ✅ + PENDING_TOOLS 删登记 + 分母对账（README/plan/00 → 121）
- [x] 本交接单七节落盘（下一棒 = v2-M2'）
- [ ] **用户动作挂起**：v2 套件评审 + D1 拍板（不迟于 v2-M2' 开工）

## 七、关键命令速查（每条当轮实跑过）

```bash
node tools/check-sprint-layout.mjs          # 布局门（续接对话第一件事）
node tools/check-desensitized.mjs           # 脱敏门
npm run validate                            # 数据门（--full 常开；121 条分母）
npm run validate -- --count                 # 分母汇总（README/plan/00 对账）
npm test                                    # vitest run（70/70 = 67 基线 + 3 可达性）
npm run typecheck                           # tsc --noEmit
npm run e2e                                 # E2E 双端一键通关（内置 build+preview+Edge headless）
node scripts/check-ending-reachability.mjs  # 可达性扫描门（退出码 0 全可达）
node scripts/check-ending-reachability.mjs --without-v2-b1-events  # 剔除模式（防回退自检，预期退出码 1）
npm run build && npm run preview            # 构建与冒烟（用完清杀，见 HANDOFF-M7 §五）
git push                                    # 走 origin（SSH）
git -c core.quotepath=false status          # 中文可读 status
git check-ignore assets/dafeiyu/fish/01.webp  # 验证 ⚠️ 层护栏生效
```
