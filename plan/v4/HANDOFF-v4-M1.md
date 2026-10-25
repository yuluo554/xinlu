# HANDOFF-v4-M1 · v4 腿入棒交接单（装订棒 → v4-M1'''）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档。
> 本档在装订棒（2026-10-25）写成（沿 v1「M0 收尾写 HANDOFF-M1」与 v2 装订棒写 HANDOFF-v2-M1 的先例）；v4-M1''' 收尾时按同七节结构翻新为该棒收尾交接单。

## 一、当前进度 + 证据

- **v4 计划套件已装订**：`plan/09-4.0优化方案.md`（十条反馈逐点回应，✅ 已定稿）+ `plan/v4/`00–06+backlog 八件入库；`v4-M1'''–M4'''` 四行 ⬜ 已落两处机读副本（plan/00 里程碑总表 + README 状态表）。
- **布局门 v4 感知已扩**（沿 v2 装订先例 0aeb1e8 同笔扩门）：FILES 20→28 / SECTIONS 17→25 / STATUS 正则认 `v4-M<k>'''` / HANDOFFS 认 `plan/v4/HANDOFF-v4-M<k>.md` / QUEUE+LEDGER 扫 v4 两份 / RELEASE 认 v4-M4'''→plan/05 v4.0.0 节 / DOC_TOOLS 扫 plan/v4/ 并登记 PENDING_TOOLS。
- 证据（2026-10-25 当轮实测）：
  - 布局门全绿：文档 28 / 状态副本 15+15 行 / 台账 30 行（v1+v2+v4）/ 队列 3 行 / 交接单 10 份 / 文档点名脚本 7 个（1 个 PENDING）。
  - 变异自检 4 组覆盖 7 条 v4 相关判据全部验红、还原复绿（清单见 §六）。
  - 基线保持：脱敏门 0 命中；`npm run validate` 0 FAIL；`npm test` 218/218；`npm run typecheck` 0 错。
- **v4-M1''' 未开工**（用户明示「先写好计划，部署骨架，不着急直接开始」，2026-10-25）。

## 二、当前事实·状态不变量（下一棒动手前必须知道）

1. **口径单源 = plan/v4/02**（K1 延续）：出生年历法 / 年代事件库 / 家庭生成 / 换算与五档 / 主题色板 / objectKey / 写实口径 / 存档 v3 / E2E 增量；v1/v2/v3 口径继续生效；实现与文案不得复写第二份表述。
2. **v4-M1''' 翻 ✅ 的同提交必须翻齐**：两处机读副本 + `v4/00` 承诺-证据台账中挂「待 v4-M1'''」的 7 行 + `v4/backlog` 若有挂账行（LEDGER/QUEUE 已机读 v4，漏翻会红）。
3. **PENDING_TOOLS 登记 `scripts/check-story-quality.mjs` → v4-M1'''**：块 1.3 落位该脚本与 `npm run validate:story` 的同提交必须删除登记，否则 DOC_TOOLS stale 分支变红。
4. **判定核零改动红线**（K11 延续）：三观传导系数 / 结局判定 / 调度单调不动；时代卡增量只走 deltas3/resourceDeltas 既有通道。
5. **故事重写只动文本面不动 deltas3 数值**（v4/03 纪律）；数值必须动 → `v4/00` 决策记录留行 + 可达性扫描复跑。
6. **存档 v3 迁移绝不清档**（K6 语义）；图鉴键 `xinlu.gallery.v2` 不动；主题键 `xinlu.theme.v1` 独立于存档。
7. **年代事件纪律**：氛围级公共事实引用，不虚构具体机构人名；查证三态表逐条（`docs/v4-era-facts.md`）；国际锚 ≤15%。
8. **预算线 650KB**（v3.0.0 终值 643.77KB，余量 6.2KB）；v4-M2''' 主题与配图增量时重审（v4/04 出口门 2.1）。
9. 基线数字：单测 218/218；E2E `npm run e2e` 双端一键通关；LLM 旁路默认关（BYO Key，离线行为与 v2 一致）。
10. v3 腿**未接**布局门（STATUS/QUEUE/RELEASE 不机读 v3 行，纪律双维护，见 `plan/v3/backlog.md` 观察区）——不是门漏了；v4 已接门。

## 三、下一棒待办（v4-M1''' · 内容与历法主工程；任务块与验证命令见 [04](04-里程碑任务分解.md)）

1. 1.1 历法与年代库先行：era-events schema 定稿 → validate E 区门**先建后填**（v4/03 纪律：门禁先于内容入库）→ 76 主锚逐条撰写 + 查证三态表 → birthYear 贯通（随机/手选/存档）+ runYear 徽章；变异自检（删一锚必红）。
2. 1.2 画像与家庭：birth-map 六因素扩展 + 新组合覆盖校验 → `family.ts` + `names.json` → 开局三页签 +「查看我的家庭」→ 存档 v3 迁移（v1/v2/v3 三档单测）。
3. 1.3/1.4 故事重写分批（fate+study/career → love/friend/health）+ `check-story-quality.mjs` 落位（同提交删 PENDING_TOOLS 登记）+ dogfooding ≥3 局沉浸感留痕。
4. 单棒过重允许 **A/B 两段拆**（1.1+1.2 / 1.3+1.4），HANDOFF 留痕且 DoD 不减。
5. 出口门：validate 新门全绿（era/组合覆盖/文本口径脚本化）+ 年份/家庭 E2E + 迁移三档单测 + 可达性年代轴抽样复跑 + 公共门（布局/脱敏/vitest ≥218/typecheck 0/e2e 绿）。

## 四、既定口径（已拍板，别再问；推翻须进 `v4/00` 决策记录）

- D5 年代密度：每年 1 主锚 + 每阶段注入 ≤2（评审可推翻）。
- D6 移动端：A 撤竖轴 → 顶部固定八段阶段条 + 事件流（v4-M2''' 执行）。
- D7 主题四款：米纸默认 / 月白 / 夜航 / 青瓷。
- 存档 schema v3（`xinlu.save.v3`）；旧档 birthYear 由 era 中值派生 +「历法迁移」标记。
- 时代卡无选项（固定增量 \|Δ3\|≤2 / \|res\|≤8），防选择疲劳（01 §六非目标）。
- 文本口径：critical ≥180 字 / context ≥100 字 / 五感 ≥2 / 互引 ≥1 / 年代锚+地域+家境各 ≥1；抽查合格率 ≥90% 出口，余量进 backlog。

## 五、环境坑（实测在案）

- 本机直连 github.com 不通：**push 一律 SSH:22**（origin `git@github.com:yuluo554/xinlu.git` 已认证可用）；仓库管理走 gh API；远端 CI 已接通（v3.0.0 发布链 ci run 40113677118 / deploy-pages run 40113677108 双 success）。
- 脱敏门红线：入库文件与提交信息不得写本机盘符 / 用户名 / 回环代理端口；示例路径用 `<user>`/`<repo>` 占位符；本地地址写 localhost 不写 127.0.0.1。
- 素材 png 不入 git（原始位图规则，转制 web-ready 产物才入）；新增素材先扩许可门白名单再入库，同提交过门。
- Windows Git Bash；node v24；文档内日期一律绝对日期。

## 六、DoD（v4-M1''' 单源见 [00 §里程碑总表](00-README总览.md)；此处只列验证出口与记录义务）

- validate 新门全绿（era E 区 / birth-map 新组合覆盖 / 文本口径抽查脚本化）
- 年份推进与家庭生成 E2E；迁移三档单测；dogfooding ≥3 局沉浸感留痕；可达性复跑（年代轴抽样）
- 公共门：布局 / 脱敏 / vitest ≥ 基线 218 / typecheck 0 / e2e 绿
- 变异自检记录进当轮 HANDOFF。装订棒已验（2026-10-25）：FILES / SECTIONS / STATUS / HANDOFFS / QUEUE / LEDGER / DOC_TOOLS 七判据 4 组变异全红→复原绿；BINDING_HEAD 与 RELEASE 两判据不受 v4 扩展影响（v2 装订棒已验），未重复验。教训留档：MUT4 首跑 QUEUE 未红，查因是**变异注入行不合格**（sed 只换行首段残留空格，状态格落到空列），门行为正确——门不红时先查变异本体再怀疑判据。

## 七、命令速查

```bash
node tools/check-sprint-layout.mjs   # 布局门（= npm run gate:layout）
node tools/check-desensitized.mjs    # 脱敏门（= npm run gate:desens）
npm run validate                     # 数据门（v4-M1''' 将扩 E 区等）
npm run validate:story               # 写实初筛（v4-M1''' 块 1.3 交付后才存在，现在调用会报脚本缺失）
npm test                             # vitest（基线 218）
npm run typecheck                    # tsc --noEmit
npm run e2e                          # E2E 双端一键通关
npm run gate:license                 # 许可门（素材变更时）
npm run gate:budget                  # 预算门（dist 产物，650KB 线）
```
