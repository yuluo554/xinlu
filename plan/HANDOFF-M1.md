# HANDOFF-M1 · 第 1 棒交接单（M0 → M1）

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档。
> 库内一律相对路径；会话启动命令由用户侧拼绝对路径。

## 一、当前进度 + 证据

- **M0（仓库骨架与脚手架）已 ✅**，里程碑状态已同步翻齐两处机读副本（plan/00 里程碑总表状态列 + README 状态表）。
- 证据（2026-10-23 当轮实测）：
  - 提交链：首提交 `85fd7e0`（plan/ 全套 + DESIGN.md，中文信息）→ `9e2ffd0`（方法论装订 + M0 骨架）；本交接单随下一笔提交入库。
  - 布局门全绿：9 条判据 PASS，扫描计数可见（文档 12 / 状态副本 3（含台账）/ 台账 8 行 / backlog 1 行 / 文档点名脚本 3 个）。
  - 脱敏门全绿：扫 25+ 个文本文件 0 命中（豁免 1 份）。
  - **变异验证 17 组全部验红、还原复绿**（布局门 13 组：FILES×4 / BINDING_HEAD / SECTIONS / STATUS×2（含"合计 0 行"）/ HANDOFFS / RELEASE / QUEUE / LEDGER / DOC_TOOLS；脱敏门 4 组 V1–V4）。一次性脚本置于 node_modules 下、用完即删，未入库。
  - `npx vitest run` 8/8 绿（skeleton 4 项 + ci-workflow 4 项）；`npx tsc --noEmit` 0 错。
  - `npm run dev` 起服（Vite v8，315ms ready）后 curl 返回挂载页 HTML；验证后已停服。
- M1（数据先行）未开工。

## 二、当前事实·状态不变量（下一棒动手前必须知道）

1. **数值口径唯一事实源 = plan/02**。引擎/前端/测试不得复写口径文字，发现第二份表述 = 缺陷进 backlog。
2. **里程碑状态有两处机读副本**（plan/00 里程碑总表状态列 + README 状态表）：改状态必须同步翻齐并跑布局门；状态行必须是表格行，且状态格以 ✅/⬜/🟡/🔒 开头，否则布局门读不到（会被当"0 行"报出来）。
3. **布局门 `PENDING_TOOLS` 登记 `scripts/validate-data.mjs`(M1)**：M1 落位该脚本时必须**同提交删除这条登记**，否则 `LAYOUT.DOC_TOOLS` 的 stale 分支变红。
4. **零运行时依赖是红线**：`dependencies` 恒空（守门测试 tests/skeleton.test.ts）；devDependencies 允许。
5. **脱敏门红线**：入库文件不得出现本机盘符路径 / MSYS 用户路径 / 本机用户名 / 回环代理端口字面量；示例路径写 `<user>`/`<repo>` 占位符；本地地址写 `localhost` 不写 `127.0.0.1`。
6. `npm run validate` 脚本**当前不存在**（M1 交付 validate-data.mjs 时才加进 package.json），别提前加、也别提前调用。
7. 里程碑仅 M0 为 ✅（布局门豁免其交接单，声明在 AGENTS.md）；M1–M6 全 ⬜。
8. CI workflow 已入库但**从未实跑**（本机无远端）：一切"CI 绿"只能表述为"本地等价校验（待首推验证）"。
9. 交付面尚未冻结：M0 之后每次提交都可改任何文件；tag 之后才进入"只许文档面提交"。

## 三、下一棒待办（M1 · 数据先行，任务块与验证命令见 plan/04 §M1）

1. 1.1 落地 plan/02 §二 schema：`src/data/events.json` 全 8 阶段骨架 + 每阶段 ≥2 条样例。
2. 1.2 `src/data/birth-map.json`（288 组合分层映射）+ `src/data/endings.json` 骨架（≥8 + 兜底）+ `src/data/portraits.json` 骨架。
3. 1.3 `scripts/validate-data.mjs`：plan/02 全部校验项 + `--count` 分母汇总；**门禁自检：故意造错一处（删事件/超口径 delta）必须报红，留痕后复原**；同提交完成：package.json 加 `validate` 脚本 + 删 PENDING_TOOLS 登记。
4. MBTI 维度定义原文核对（plan/01 §五 三态翻转 + data/README.md 依据查证表翻 🟡/✅ 并留渠道与日期）。
5. 收尾顺序（skill 硬约束①）：DoD 验证 → plan/00 状态副本与台账翻 M1 ✅（两处副本 + 台账"出生环境四要素定盘"行）→ 写 HANDOFF-M2 → commit。

## 四、既定口径清单（K 编号；动了会打挂测试/门）

- **K1 口径单源**：数值口径只在 plan/02 定义一处（M2 引擎落地时同样遵守）。
- **K2 零运行时依赖**：`dependencies` 空；守门测试在 tests/skeleton.test.ts。
- **K3 状态行 = 表格行**：状态格以状态符开头；两处副本同步翻。
- **K4 提交信息中文**，沿用「心路：」前缀。
- **K5 布局门判据只落仓库内文件**（不读 git 元数据）；门必须打印扫描计数（非空跑自证）。
- **K6 存档 key 口径**：`xinlu.save.v1`（M2 用；schema v 变更则 key 同步变）。
- **K7 校验脚本入口名**：`npm run validate`（plan/00 实物表、01 §四验收标准引用的都是这个名字）。

## 五、本机环境坑（实测 2026-10-23）

- node v24.15.0 / npm 11.12.1 / git 2.54.0.windows.1（Git Bash）。
- npm 默认 registry 直装成功（42 包 / 16s），未配镜像。
- **js-yaml 已到 v5**：只有具名导出 `load`，无默认导出（`import yaml from "js-yaml"` 得 undefined）；tests/ci-workflow.test.ts 已用 `import { load as loadYaml }`。
- npm 装到的版本族：vite ^8 / vitest ^5 / typescript ^7（TS7 原生实现，`tsc --noEmit` 通过；注意 TS7 与旧语法提示可能不同）。
- 本机直连 github.com 不通（推送对策见 plan/04 §风险）；无远端，CI 未实跑。
- dev server 验证后要停：`netstat -ano | grep :5173` 找 PID → `taskkill //F //PID <pid>`。
- Windows git 显示中文文件名为八进制转义属显示问题：用 `git -c core.quotepath=false status/log`。
- Mimosa 提交钩子提示：前两笔提交的库扫描未得出完整结论（library source 上限），按兼容策略放行——**不要对外宣称"项目已通过安全审计"**；后续可补跑一次完整审计。

## 六、DoD 逐项 checklist

M0（plan/00 §里程碑总表行）：
- [x] git 首提交（中文信息）并 `git log` 验证 → `85fd7e0`
- [x] `npm run dev` 打开空页面 → curl 返回挂载页（已留痕，服务已停）
- [x] data/README 建立 → 口径来源 + 依据查证三态表在位

第零步方法论装订（skill 硬约束③，本棒完成）：
- [x] AGENTS.md 锚点（强制布局清单 + 门命令 + M0 豁免声明）
- [x] tools/check-sprint-layout.mjs（9 判据，非空跑自证，CI 有步骤）
- [x] tools/check-desensitized.mjs（4 规则，与布局门同排进 CI layout job）
- [x] plan/00 顶部装订行（三锚点同现）
- [x] 变异验证 17 组全红、还原复绿（一次性脚本未入库）

M1 DoD（下一棒要达成的，来自 plan/00）：
- [ ] `npm run validate` 0 FAIL；故意造错一条必须报红（门禁自检留痕）
- [ ] 状态副本两处翻 M1 ✅ + 台账"出生环境四要素定盘"行翻 ✅（布局门 LAYOUT.LEDGER 会拦过期 ⬜）
- [ ] HANDOFF-M2 落盘（七节）

## 七、关键命令速查（每条当轮实跑过）

```bash
node tools/check-sprint-layout.mjs          # 布局门（续接对话第一件事）
node tools/check-desensitized.mjs           # 脱敏门
npm run dev                                 # 开发服务器（localhost:5173）
npm test                                    # vitest run
npm run typecheck                           # tsc --noEmit
git -c core.quotepath=false log --oneline   # 中文文件名可读的日志
```

（`npm run validate` 在 M1 交付前不存在，别提前调用。）
