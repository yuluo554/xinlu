# HANDOFF-v3-M5 · v3 收官交接单（v3-M4'' → 运维期）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档。
> 本仓库 v1 里程碑 M0–M6、v2 里程碑 v2-M1'–M4' 与 v3 里程碑 v3-M1''–M4'' 已**全部 ✅**，**没有 v3-M5'' 里程碑**——本档是 v3 收官交接单（布局门交接单判据只扫 v1/v2 里程碑，v3 行不在其机读范围，本档存在但不被点名；按 v3/04 §v3-M4'' 出口门「HANDOFF-v3-M5 收官」要求撰写，沿 [v2/HANDOFF-v2-M5.md](../v2/HANDOFF-v2-M5.md) 先例）。之后的日常工作按 [06-运维节奏.md](06-运维节奏.md) 轮转，迭代队列唯一存放 [backlog.md](backlog.md)。

## 一、当前进度 + 证据

- **v3-M1''–M4'' 全部 ✅；v3.0.0 已发布（2026-10-25）**。三件套：
  - **tag** `v3.0.0` @ commit `819e6ee`（annotated；晚于构建与部署验证：全套门/干净冒烟于代码态 `0b0c2a6` 与发布就绪态 → 文书 `819e6ee` 推送 → deploy run 40113677108 + ci run 40113677118 双 success → 线上实开双端通关 exit 0 → tag → Release）；
  - **Release** https://github.com/yuluo554/xinlu/releases/tag/v3.0.0 （标题「心路 v3.0.0 · 时间轴画卷、三观传导与 AI 旁路」，五部分说明含**历史存档建议重开声明** + 附件 dist.zip 669,663 字节，sha256 `7f641a85…df731` 自 Release 下载复核一致；解压纯静态服务双端一键通关 exit 0）；
  - **plan/05 §八 v3.0.0 留档**（发布概要 / tag 时点事实 / tag 后追加事实分栏 / DoD 声明翻齐；v3/05 骨架为载体指向该节，单源不双写）。
- **线上可玩**：https://yuluo554.github.io/xinlu/ —— v3 内容（时间轴画卷 / 三观传导 / 关系图谱 / 种子码 / AI 旁路默认关闭）；实开同脚本口径双端一键通关 + 图鉴/分享卡/图谱/种子码/自定义槽离线隐藏断言 exit 0。
- **门禁终值（发布态实测）**：validate **0 FAIL（10 区）** / vitest **218/218** / typecheck 0 错 / e2e 双端绿 / 可达性 **2496 组 9 结局** exit 0 / 预算门 **643.77KB / 650KB** 0 WARN / 许可门 0 FAIL / 脱敏门 0 命中 / 布局门全绿；远端 ci run 40113677118（layout+test 两 job）success——**CI 已接通**（AGENTS.md「远端未接」提示已过时，后续可写真实 CI 绿，以 run 为证）。
- v3 四棒全程留痕：各棒 HANDOFF（[HANDOFF-v3-M2](HANDOFF-v3-M2.md)/[M3](HANDOFF-v3-M3.md)/[M4](HANDOFF-v3-M4.md)）+ 评审门记录（[docs/v3-M1-gates.md](../../docs/v3-M1-gates.md) / v3-M1-dogfooding / v3-M2-gates / v3-M2-icons / v3-M2-feel / [v3-M3-gates](../../docs/v3-M3-gates.md)）。

## 二、当前事实·状态不变量（动手前必须知道）

1. **v3 里程碑状态真值 = 本套件 00 §里程碑状态（M1''–M4'' 全 ✅）**；两副本（plan/00 + README）各加至 v3-M4'' 行，逐处一致。**注意：布局门 STATUS 正则只机读 v1 `M<k>` 与 v2 `v2-M<k>'` 行（当前 11 行），v3 行不参与机读——一致性靠纪律双维护**（已登记 backlog 观察区「布局门 v3 判据扩展」）。
2. **v1.0.0 / v2.0.0 / v3.0.0 的 tag 与 Release 均已发布——不许改写**：不 force-push 已发布 tag、不动已发布 Release 正文事实；后续发版走新 tag（v3.0.1+）+ 新 Release + CHANGELOG 新条目；判定类改动先过 plan/06 双层版本规则（判定结论变化 → 主版本 +1 + 重开声明）。
3. **plan/05 §八 自证约定**：tag 时点事实不回写；新发布的事实只追加「tag 后追加」分栏（部署 run 行按 §七 v2.0.0 先例于收官提交补记，树内占位行已声明该意图）。
4. **预算线 650KB，当前 643.77KB，余量仅 6.2KB**——任何素材/依赖增量都可能击穿；确需增量先走 v3/02 §九重审流程（backlog 观察区在案）。README/CHANGELOG/发布文案不动预算。
5. **口径单源 plan/v3/02**（含 ▸ M1''/M2''/M3'' 增补块）——改行为先改 02 再动码；传导系数表与防回退锚 `teen-003` 不动。
6. **过网隔离 grep 测试在 `src/llm/isolation.test.ts`**：`src/llm/provider.ts` 是全仓唯一 fetch 点；给表现层加任何网络功能必须经 llm/ 单层。LLM 数值安全链（闭集 12 标签 → clampCustomDeltas → applyCustomChoice 不触 flags）不动。
7. **E2E 断言基线**（smoke.mjs）：通关 + 图鉴 + 分享卡落盘 + 年龄单调 3–1068 + 选项 ≥3 + 图标全覆盖 + critical 分级/状态条/轨道色点/浮动层 + `.screen-relations`/`[data-relations-chart] svg` + `[data-seed-code]` + `[data-relations-snapshot]`（≥4 节点）+ `[data-custom-slot]`（离线必须不存在）+ `.screen-settings`——改这些 DOM 钩子先同步 E2E。
8. **K1–K12 + v3 各棒口径全部继续生效**（见 §四）；新事件编号段 fate -0xx / study -1xx / career -2xx / rescue -3xx / love -4xx / friend -5xx / health -6xx，新 NPC 先注册 `npcs.json`，新图标同步 icon-map + docs/v3-M2-icons.md 增行。
9. **存档三 key**：`xinlu.save.v2`（v1 旧档读迁移补中位不清档）/ `xinlu.gallery.v2`（图鉴，冻结）/ `xinlu.llm.v1`（AI 旁路设置，BYO Key 明文）——不互相读写。
10. **README 110 行**（门判据 ≤120 / 「30 秒跑起来」≤30 行处 / 无 DoD 字样 / DEVELOPMENT.md 与 credits 链接在位；v3 特性节 + 「AI 旁路默认关闭，离线行为与 v2 一致」提示已入）。
11. **Mimosa 安全扫描未得出完整结论**（library_source 上限 / callgraph 部分，commit/push 钩子均提示）——不要对外宣称「项目已通过安全审计」。
12. **backlog**：V3-1 待排期；观察区在案：LLM 真实端点人审抽检（转入=用户首次配 Key）、预算线重审（转入=增量触发红线）、声音扩展、布局门 v3 判据扩展（本棒新增）。

## 三、待办（运维期；无里程碑 DoD，按 06 节奏）

1. **traffic 周记**（14 天滚动窗口，不周记即永久丢失）：`gh api repos/yuluo554/xinlu/traffic/views|clones` + issue 检查，写入 v3/backlog「周自查记录」；v3.0.0 发布日基线全零已录 plan/05 §八，首次回访 ≈2026-11-01。
2. **LLM 真实端点人审抽检**：用户首次在设置页配置有效 Key 后，抽 ≥10 条真实端点响应补录留痕（backlog 观察区在案；口径沿 docs/v3-M3-gates.md §5.2）。
3. **v3 套件评审提请用户确认**：v3 腿已按计划收官，套件（plan/v3/ 00–06）宜向用户提请确认一次；有修改意见按 06 缺口流程处理。
4. **V3-1（坏件正面_238 重下）**：仍待排期（低影响：三视图缺 1 档、无 dist 引用），按 backlog 证据制入队节奏处理。
5. **若发 v3.0.1+**：流程照 plan/05 §八同口径（build → 干净静态冒烟 → Pages → 实开 → CHANGELOG → plan/05 §八追加 → tag → Release → 留档）；判定类改动先过 plan/06 版本规则；预算增量先走 02 §九重审。
6. **每周固定 30 分钟轮转一类缺口**（06 §节奏十二类）——「我觉得」不入队，证据制。
7. **外部 issue**：「判定反直觉/文案错误」最高优先级；无反馈且满足归档判据（06 §归档）再谈归档。

## 四、既定口径清单（K 编号延续 + v3 全棒口径）

- **K1–K12 全部继续生效**（逐条见 [../HANDOFF-M7.md](../HANDOFF-M7.md) §四 + [../v2/HANDOFF-v2-M5.md](../v2/HANDOFF-v2-M5.md) §四）。v3 全程零新增 npm 依赖（K2）；引擎签名只增不改（K11）；v3 数值口径只在 [02](02-数据与口径.md)（含 ▸ 增补块）定义（K12）。
- **M1''–M3'' 口径全部长效**：月龄四格式/单调规则/传导方向表 0.4/结算系数/lineGain/线阈值/线终态/rescue/requires；图标对照单源 icon-map.json；bond 衰减公式与 tag 阈值 30/60/90；种子码 32 符号表 + 双向无损；LLM 标签闭集 12 枚 + 本地钳制 + 不触 flags；信封 seedCode 可选字段（11/12 键双形态）。
- **决策记录长效有效**（v3/00 §决策记录）：D2=a / D3 无版权混合 / D4=B / 状态条 / 传导链 / 年龄单调 / M1'' 签名细化 / 信封分期 / 结局重映射 / 扫描空间升级 / 预算 650KB / 声音不做 / LLM 抽检桩口径。
- 状态副本两处（plan/00 + README，v3 行 `v3-M<k>''`）；翻 ✅ 同提交翻齐两处 + v3 台账行 + v3/03 模块状态 + HANDOFF。

## 五、环境坑（沿全部前棒 + 本棒实测新增）

- **本棒新增**：
  - **Bash `cd` 离开仓库后跑相对路径脚本必失败**（smoke 从 /tmp 跑 `tests/e2e/smoke.mjs` → loader 报错 exit 1，且管道吞掉细节）——跨目录一律用脚本绝对路径 `node D:/…/tests/e2e/smoke.mjs`。
  - **tag 形态差异**：v1/v2 tag 为轻量（`git cat-file -t` = commit），v3.0.0 为 annotated（= tag 对象，`rev-parse v3.0.0^{commit}` 才得 commit 号）——留档「tag @ commit」一律以 `^{commit}` 解析结果为准。
  - **布局门机读范围**：STATUS/QUEUE/RELEASE 正则只认 v1/v2——v3 状态行、v3 backlog 队列、v3.0.0 留档节不被机读，翻面一致性靠本档 §二.1 纪律（观察区已登记）。
  - **gh run 轮询 jq 引号**：git-bash 下 `gh run view --jq '…"+…"…'` 输出可能被吞——判成败直接 `gh run view <id> --json status,conclusion` 整体输出。
  - **Mimosa commit/push 钩子「未完整扫描结论」提示**：沿 v2-M4' 口径（已知，不宣称安全审计，不阻塞发布动作）。
- 沿用：管道吞退出码（`cmd > log 2>&1; echo $?`）；sed 对中文不可靠（Edit 工具）；dev/preview/http.server 用完清杀（`netstat -ano | grep :<port>` → `taskkill //F //PID`）；E2E 暖帧丢弃；`py` 替代 `python`；push 走 SSH:22（HTTPS 443 间歇不通）；`core.quotepath=false`；发布 zip 必含 credits.md（`tar -C dist index.html credits.md assets`）；`gh release create --notes-file` 中文长说明；Node 24 直跑 TS 带 `as` 报错（临时 .mts + vite-node）；Bash 写 .mts 被 Mimosa 拦（Write 工具落）；vite SVG data-URI 单引号坑。

## 六、DoD 逐项 checklist

v3-M4''（已达成，证据见 [plan/05 §八](../05-发布留档.md)）：
- [x] README 增量：v3 特性节（时间轴/三观/多线+状态条/图谱/种子码/AI 旁路）+ 开关提示 + 数字口径翻新（243/22/2496/xinlu.save.v2），110 行 ≤120 门过
- [x] 三件套：tag v3.0.0 @ 819e6ee + Release 五部分附 dist.zip（sha256 下载复核一致 + 解压纯静态双端通关 exit 0）+ plan/05 §八留档（主体 tag 前定稿 + 追加事实分栏）
- [x] CHANGELOG v3.0.0：数据口径版本（243/9/16/288 对账 `validate --count`）+ **历史存档建议重开声明** + v3 特性清单；package.json/lock 2.0.0 → 3.0.0 同提交
- [x] 发布链：build → 干净静态 8814 双端冒烟 exit 0 → push 819e6ee → deploy run 40113677108 + ci run 40113677118 双 success → 线上实开双端通关 exit 0 → tag（tag 晚于构建与验证）
- [x] 出口门：代码态 0b0c2a6 全套门实测全绿（validate 10 区 0 FAIL / 218/218 / typecheck 0 / e2e / 可达性 2496 组 9 结局 / 预算 643.77KB / 许可 / 脱敏 / 布局）+ 收官复跑全绿
- [x] 翻面同提交：v3/00（状态 ✅ + 台账重开声明行 + 索引 05 行）+ plan/00 与 README 两副本各 +v3-M4'' 行 + v3/03 模块 6 ✅ + v3/05 骨架状态行 + backlog 观察区 +1（布局门 v3 判据扩展）
- [x] 本交接单（v3 收官交接单）七节落盘

v1+v2+v3 全部里程碑 ✅；运维期无新里程碑 DoD，日常达成判据 = plan/06 节奏与归档判据、backlog 证据制、发版走双层版本规则。

## 七、关键命令速查（每条当轮实跑过）

```bash
node tools/check-sprint-layout.mjs          # 布局门（续接对话第一件事）
node tools/check-desensitized.mjs           # 脱敏门
npm run validate                            # 数据门 v3（10 区）
npm run validate -- --count                 # 分母汇总（243 / 9 / 16 / 288——README/CHANGELOG 对账）
npm test                                    # vitest run（218/218，含 llm/isolation grep 门）
npm run typecheck                           # tsc --noEmit
npm run e2e                                 # E2E 双端通关（含 build）
node tests/e2e/smoke.mjs --no-build --base-url http://127.0.0.1:<port>/   # 干净静态/线上实开复用口径（跨目录用绝对路径）
py -m http.server <port> --bind 127.0.0.1 --directory dist                # 干净静态服务（用完清杀）
node scripts/check-ending-reachability.mjs  # 可达性扫描门（2496 组，9/9）
npm run gate:license                        # 许可门
npm run gate:budget                         # 预算门（643.77KB / 650KB，余量 6.2KB）
npm run build                               # vite build
/c/Windows/System32/tar.exe -a -c -f dist.zip -C dist index.html credits.md assets   # 发布 zip（credits.md 必含）
sha256sum dist.zip                          # 校验和（Release 说明 + plan/05 §八两处一致）
gh release create v3.0.0 dist.zip --title <标题> --notes-file <说明文件>              # Release（五部分说明）
gh release download v3.0.0 --pattern dist.zip --output <file> && sha256sum <file>     # 附件下载复核
gh api repos/yuluo554/xinlu/traffic/views   # Traffic 周记（14 天滚动窗口）
gh run list --limit 4                       # 部署/CI run 查证（deploy-pages + ci）
git push                                    # 走 origin（SSH）；HTTPS 443 间歇不通，别换回
git -c core.quotepath=false status          # 中文可读 status
```
