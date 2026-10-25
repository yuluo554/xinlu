# HANDOFF-v4-M6 · v4-M4''' 收尾交接单（发布棒 → 运维期 · v4 腿收官单）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档。
> 编号纪律（skill 硬约束①）：**交接单编号随棒顺延**——装订棒 HANDOFF-v4-M1、A 段棒 HANDOFF-v4-M2、B 段棒 HANDOFF-v4-M3、实感修复包棒 HANDOFF-v4-M4、图标配图棒 HANDOFF-v4-M5、本档为 v4-M4''' 发布棒收尾单（v4 腿收官单）。
> 本档记录 **v4.0.0 发布（2026-10-26）**：v4-M1'''–M4''' 全 ✅，v4 腿收官；下一阶段进入**运维期**（plan/06 十四类轮转），无既定开发棒。

## 一、当前进度 + 证据（2026-10-26 当轮实测）

- **三件套**：tag `v4.0.0`（annotated）@ `677eb56`；Release https://github.com/yuluo554/xinlu/releases/tag/v4.0.0 五部分（含「年代事件改变人生体验与判定输入 → 历史存档建议重开」）+ dist.zip 744,016 字节（sha256 自 Release 页下载复核一致）；plan/05 §九 留档两栏 + DoD 勾。
- **发布流程全序**（04 §v4-M4''' 顺序不可颠倒）：基线门全绿（`5af1e62` 态）→ build（预算 720.36KB ≤ 850KB 绿）→ 干净静态服务双端一键通关 exit 0 → 发布就绪态 `677eb56`（CHANGELOG + README 119 行 + plan/05 §九 主体 + 版本号 4.0.0，代码面与 `5af1e62` 零差异）→ push 7 提交（SSH:22）→ deploy-pages run **40215667603** + ci run **40215667599** 双 success → **Pages 实开双端一键通关 exit 0 + 浏览器手动开局→首卡→小结**（截图 docs/assets/v4m4-pages-summary-390.png；首开命中真实旧档 v1/v2→v3 历法迁移终局，迁移链线上实证）→ tag → Release → 留档翻齐 → 收官提交。
- **翻面**：两处状态副本 v4-M4''' ⬜→✅ + v4/00 台账「历史存档重开声明」行 ✅ + v4/03 模块 6 ✅ + plan/00 文档索引 v4 行收口 + HANDOFF-v4-M6（本档）。
- **终值留痕**：[docs/v4-M6-release.md](../../docs/v4-M6-release.md)（流程时序表 + 三件套核对 + 出口门终值 + Traffic 基线 + 遗留观察）。

## 二、当前事实·状态不变量（下一棒动手前必须知道）

1. **v4 腿收官，项目进入运维期**：无既定开发棒；维护动力 = 可度量缺口（plan/06 总原则：**没有缺口时正确动作是不动**）。周自查 30 分钟轮转十四类（v1 八类 + v2 9/10 类 + v3 11/12 类 + v4 13/14 类：年代事实漂移 / 文本质感衰退）。
2. **tag 之后不改代码面**（AGENTS 环境禁忌）：v4.0.0 的任何后续改动都进新提交、走版本规则（判定输入结构变化 → 主版本 +1 + 重开声明；新增事件/结局 → 次版本；纯文案 → 补丁）。
3. **Traffic 周记**：发布日基线 views 0 / clones 168（unique 47，14 天窗口累计）/ stars 0 / issues 0；首次回访 ≈ 2026-11-01（发布 +7 天），gh api `repos/<user>/<repo>/traffic/views|clones`。
4. **存档迁移监控单列**（v4/06 节奏增量）：v3 迁移局异常报告（历法迁移标记丢失 / 家庭生成不一致）记台账；线上已实证一条真实旧档迁移终局（plan/05 §九 Pages 行）。
5. **单测基线 282（只加不减）**；预算线 850KB（实测 720.36KB，余量 ~130KB；v5 内容增量前按 V4-1 判据重审）；validate:story 243/243 与可达性年代轴抽样随 vitest 常态在测。
6. **发布三先例齐**：v1.0.0 / v2.0.0 / v3.0.0 / v4.0.0 留档在 plan/05 §三/§四、§七、§八、§九；下一版发布沿 §九 模板（tag 时点事实 tag 前写定 / run 号收官提交补记 / 两栏纪律）。
7. **远端状态**：origin/main = 收官提交（本档所在提交）；tag v4.0.0 已推；Pages 线上 = `677eb56` 构建；ci + deploy-pages 双 run success 实测（2026-10-26）。
8. **变更入口**：若开 v5 腿，先写方案文档（沿 07/08/09 先例）+ 装订 `plan/v5/` 套件 + 布局门扩感知，再开工（沿 v4「先计划后开发」教训）。

## 三、下一棒待办（运维期首查 · 按 plan/06 节奏，或用户明示新腿）

1. **运维期首查**（≈ 2026-11-01）：Traffic 周记 + issue 轮转 + 十四类轮转一类（建议从 13 类「年代事实漂移」抽验起——v4 主轴是事实感，查证表抽 10 条对公开史料）；发现缺口带证据入 `plan/v4/backlog.md` 观察区或 v1 backlog。
2. **遗留观察复评**（docs/v4-M6-release.md §五）：隐喻注记 8 条 + 青瓷纹理观感；v3 迁移局异常监控。
3. **可选**：v5 方案腿（用户明示后启动，见 §二.8）。

## 四、既定口径（已拍板，别再问；推翻须进 `v4/00` 决策记录）

- 预算线 **850KB**（V4-1 已关闭）；objectKey 纪律（02 §六：宁缺毋滥 / 豁免 ≤10% / 隐喻须注记）；小结配图自产 CC0 冻结；主题四款 id 与 `xinlu.theme.v1` 键形冻结；存档 v3 schema 冻结；产品/赛事/制度名可入文，真实机构名/真人名不写（§八）。
- 发布留档双栏纪律（plan/05）：tag 时点事实 / tag 后追加 + 覆盖对账；tag 后不改代码面。

## 五、环境坑（实测在案，沿 HANDOFF-v4-M5 增补）

- 本机直连 github.com 不通：push 一律 SSH:22；仓库/Pages/Release 走 gh API（HTTPS 通）；**不虚报发布**。
- 脱敏门红线：入库文件与提交信息不得写本机盘符/用户名/回环代理端口（`127.0.0.1:端口` 形态会红；留档写端口不写回环地址）。
- e2e 发布冒烟用 `node tests/e2e/smoke.mjs --no-build --base-url <url>`（外部静态服务或线上 Pages 同一口径）；`--base-url` 跳过 build/preview。
- IAB 浏览器带用户真实 localStorage：首开线上站可能命中旧档终局（迁移链实证场景）；Playwright locator click 可能被确认框/动画卡住，evaluate 直发 `el.click()` 可绕。
- node `-e` 内联脚本含 `'''`（里程碑标号）会被 bash 单引号截断——写临时脚本文件或用 Edit 工具。
- dist.zip 走 `dist-release/`（.gitignore `dist.zip` 模式覆盖，不入库）；PowerShell `Compress-Archive` 打包。

## 六、DoD（v4-M4''' 对账 · 单源见 [00 §里程碑总表](00-README总览.md)）

- 三件套 ✓（tag + Release 五部分含重开声明 + plan/05 §九 留档）；README 增量 119 行 ≤120 ✓；CHANGELOG 数据口径对账 + 重开声明 ✓；tag 晚于构建/部署/实开 ✓；全门绿终值留痕 docs/v4-M6-release.md §三 ✓；状态副本/台账翻齐 ✓（收官提交态复跑布局/脱敏门绿）。
- 遗留观察（不入 DoD）：§三.2 两项转运维期轮转。

## 七、命令速查

```bash
node tools/check-sprint-layout.mjs   # 布局门（= npm run gate:layout）
node tools/check-desensitized.mjs    # 脱敏门（= npm run gate:desens）
npm run validate                     # 数据门（11 区；I 区 objectKey / R 区历法）
npm run validate:story               # 写实机检四项
npm test                             # vitest（v4.0.0 后基线 282）
npm run typecheck                    # tsc --noEmit
npm run e2e                          # E2E 全量（build + 双端 + 768 + v4 段）
node tests/e2e/smoke.mjs --no-build --base-url <url>   # 发布冒烟（外部静态服务/线上 Pages 同口径）
npm run gate:license                 # 许可门
npm run gate:budget                  # 预算门（850KB 线；v4.0.0 实测 720.36KB）
gh api repos/<user>/<repo>/traffic/views   # Traffic 周记（clones 同路径）
```
