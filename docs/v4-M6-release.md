# v4-M4''' 发布清单与出口门终值（v4.0.0 · 2026-10-26）

> 单源约定：发布留档主体在 [plan/05-发布留档.md](../plan/05-发布留档.md) §九（单源不双写）；本档是发布棒的流程时序 + 三件套核对 + 门禁终值留痕（沿 docs/M6-发布清单.md 与 docs/v4-M3-icons.md §四 格式）。

## §一、发布流程时序（04 §v4-M4''' 顺序不可颠倒，逐格留痕）

| 步 | 事实（2026-10-26 实测） |
|---|---|
| 基线门 | 代码态 `5af1e62`（v4-M3''' 收官态）全套门本棒复跑全绿（validate 0 FAIL 11 区 / validate:story 243/243 / vitest 282/282 / typecheck 0 / e2e 全量含 build 双端通关 / 许可 0 FAIL / 脱敏 0 命中） |
| build | 发布就绪态 vite build 绿（预算门 720.36KB ≤ 850KB，0 WARN）；dist.zip 744,016 字节 + sha256 留档 |
| 干净静态服务冒烟 | node 内置 http 伺服 dist 全新端口（等价 Pages 托管），375/1280 双端一键通关（ENFJ/ESFJ）+ 768 中档 + v4 自定义出生段 exit 0 |
| 发布就绪态提交 | `677eb56`：版本号 4.0.0 + CHANGELOG v4.0.0（含重开声明）+ README 增量（114→119 行）+ plan/05 §九 主体（tag 时点事实 tag 前写定）+ v4/00 索引 05 行 + v4/05 骨架状态行；代码面与 `5af1e62` 零差异 |
| push | `origin/main` 一次推 7 提交（v4 六棒 + 发布就绪态；SSH:22，push 前核对 origin..HEAD 序列） |
| Pages 部署 + CI | deploy-pages run **40215667603 success**（1m12s，部署前 typecheck/validate/test 前置全过）+ ci run **40215667599 success**（layout + test 双 job） |
| 实开复核 | 线上 https://yuluo554.github.io/xinlu/ 同脚本口径双端一键通关 + 768 + v4 自定义出生段 exit 0；浏览器手动过开局→首卡→小结（1988 随机局，婴儿段小结五段全在位，截图 docs/assets/v4m4-pages-summary-390.png）；首开命中真实旧档（v1/v2 期存档）历法迁移终局——迁移链线上实证 |
| CHANGELOG | v4.0.0 节：数据口径对账（事件 243 / 时代锚 76 / 结局 8+1 / 画像 16 / birth-map 四要素 288 + 八因素 51840）+ 历史存档建议重开声明 |
| tag | **v4.0.0**（annotated）@ `677eb56`，晚于构建、干净冒烟、部署与实开复核 |
| Release | https://github.com/yuluo554/xinlu/releases/tag/v4.0.0 五部分（变更摘要 / 数据口径版本 / 重开声明 / 校验和 / 已知问题）+ 附件 dist.zip；附件自 Release 页下载 sha256 复核一致 |
| 留档翻面 | plan/05 §九 tag 后追加栏 + DoD 勾 / 两处状态副本 v4-M4''' ✅ / v4/00 台账「历史存档重开声明」行 ✅ / v4/03 模块 6 ✅ / HANDOFF-v4-M6 收官单 |

## §二、三件套核对（v4/00 §里程碑总表 v4-M4''' 行 DoD）

- [x] tag v4.0.0 @ `677eb56`（2026-10-26）
- [x] Release 五部分 + dist.zip 744,016 字节（sha256 `444bd76e67328aa01e299f1502ec92fa1d70ecc2dcf2bcf93520361c1080015c`，下载复核一致）
- [x] plan/05 §九 留档（tag 时点事实 + tag 后追加两栏 + DoD 声明 + 覆盖对账沿 §六 判据同构）

## §三、出口门终值（发布就绪态 `677eb56` 实测，2026-10-26）

- `npm run validate`：0 FAIL（11 区；含 R 区历法 76 锚 / I 区 objectKey 243/243 + 豁免 1 ≤ 24）
- `npm run validate:story`：243/243（四项 S.LEN/S.ERA/S.SENSE/S.REF）
- `npm test`：**282/282**（含可达性全量 2496 组 + 年代轴抽样 936 局）
- `npm run typecheck`：0 错
- `npm run e2e`：**三口径全绿**——vite preview 全量（基线）/ 干净静态服务 `--no-build --base-url` / 线上 Pages 实开，各含 375/1280 双端一键通关 + 768 中档 + v4 自定义出生段
- `npm run gate:license`：0 FAIL
- `npm run gate:budget`：**720.36KB ≤ 850KB** 绿（0 WARN）
- `npm run gate:layout` + `gate:desens`：全绿（收官提交态复跑，0 命中）
- README 行门：119 行 ≤ 120（v4 新增节 + save.v3 + 八因素口径，v2/v3 节压缩腾量）

## §四、发布日 Traffic 基线（gh api 实查 2026-10-26）

- views 0 / clones 168（unique 47——14 天窗口累计值，窗口含 v3.0.0 发布日与其后的克隆，非当日新增口径）/ stars 0 / open issues 0；
- 对比：v1/v2/v3 三代发布当日 views/clones 均全零；周记节奏见 plan/06（十四类轮转 + 年代事件回访最高优先级 + 存档迁移监控单列）。

## §五、遗留观察（不入本棒 DoD，入运维期轮转）

- 事件图标隐喻注记 8 条复评 + 青瓷纹理极淡档（0.78）观感（docs/v4-M3-icons.md §一注记表 / HANDOFF-v4-M5 §六）；
- v3 迁移局异常报告监控（v4/06 节奏增量：历法迁移标记丢失 / 家庭生成不一致单列台账）；
- dist 预算余量 ~130KB（720.36/850）：v5 内容增量前按 V4-1 判据重审。
