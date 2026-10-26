# AGENTS.md

本仓库遵循 **`ai-tool-project-sprint`** 方法论（装订日期：2026-10-23）。

## 任何新对话的第一件事

```bash
node tools/check-sprint-layout.mjs    # 布局门；必须绿，红了先修布局再干活
```

- 续接对话：读 `plan/HANDOFF-M<k>.md`（那是第 k 棒的收尾交接单），**先跑上面这条门**。
- v2 腿（`plan/v2/` 套件）：读 `plan/v2/HANDOFF-v2-M<k>.md`（v2-M<k>' 里程碑的交接单，文件名不带撇号），同样先跑布局门。
- v4 腿（`plan/v4/` 套件）：读 `plan/v4/HANDOFF-v4-M<k>.md`（v4-M<k>''' 里程碑的交接单，文件名不带撇号），同样先跑布局门。
- **v5 腿（`plan/v5/` 套件，当前进行中）**：读 `plan/v5/HANDOFF-v5-M<k>.md`（v5-M<k>'''' 里程碑的交接单，文件名不带撇号），同样先跑布局门。v5 是当前活跃腿，其余腿为留档。
- 接手对话（无 HANDOFF）：先读 `plan/00`、`plan/05`、`plan/06` 与各 HANDOFF，重建"当前状态 + K 口径清单"再动手。
- **门不存在 = 本项目没装订** → 先补第零步，再做别的。

## 强制布局（布局门逐条断言，改动前先看这里）

| 项 | 位置 | 判据 |
|---|---|---|
| 计划套件 | `plan/00–06` + `plan/backlog.md` | 存在且各含必需小节（标题关键词） |
| v2 计划套件 | `plan/v2/00–06` + `plan/v2/backlog.md` | 存在且各含必需小节；v2 里程碑机读状态行以 `v2-M<k>'` 标号写入两处状态副本；交接单落 `plan/v2/HANDOFF-v2-M<k>.md` |
| v4 计划套件 | `plan/v4/00–06` + `plan/v4/backlog.md` | 存在且各含必需小节；v4 里程碑机读状态行以 `v4-M<k>'''` 标号写入两处状态副本；交接单落 `plan/v4/HANDOFF-v4-M<k>.md`（v3 腿未接门，行纪律双维护，见 `plan/v3/backlog.md` 观察区） |
| v5 计划套件 | `plan/v5/00–06` + `plan/v5/backlog.md` | 存在且各含必需小节；v5 里程碑机读状态行以 `v5-M<k>''''` 标号写入两处状态副本；交接单落 `plan/v5/HANDOFF-v5-M<k>.md` |
| 数据台账 | `data/README.md` | 口径来源 + 依据查证三态表在位 |
| 交接单 | `plan/HANDOFF-M<k>.md`（v2 腿：`plan/v2/HANDOFF-v2-M<k>.md`；v4 腿：`plan/v4/HANDOFF-v4-M<k>.md`；v5 腿：`plan/v5/HANDOFF-v5-M<k>.md`） | 每个 ✅ 里程碑一份，七节齐（含"当前事实"）；**M0 豁免**（M0 之前没有上一棒可写 HANDOFF-M0，M0 的收尾动作是写 HANDOFF-M1）。**编号随棒顺延**（skill 纪律①：每棒收尾写下一棒的 `HANDOFF-M<next>`；一里程碑拆多棒时每棒各占一号——布局门只对 ✅ 里程碑做最低校验，别拿门当编号纪律） |
| 里程碑状态副本 | `plan/00` 里程碑总表状态列 + `README.md` 状态表 | **逐处一致**，逐副本独立采集（状态行必须写成表格行才可机读；散文状态不参与判定，两处副本的行数门会打进结论）；**v3 腿在布局门 `LEG_CONFIG` 里显式 `wired:false`**（其交接单按编号随棒顺延，与门的最低校验口径不同构），其状态行可见计数但不参与一致性判定 |
| README 行数门 | `README.md` | ≤120 行（`LAYOUT.README` 机检；超限压缩旧版本小节，**不允许抬线**）。来源：`plan/03` §6 + `plan/04` §M5 + `v5/04` §M4 |
| 承诺-证据台账 | `plan/00` + `plan/v2/00` + `plan/v4/00` + `plan/v5/00` | 已 ✅ 里程碑不得仍挂"⬜ 待 M<k>"（台账四份都扫；v3/00 台账纪律双维护） |
| 缺口队列 | `plan/backlog.md`、`plan/v2/backlog.md`、`plan/v4/backlog.md` 与 `plan/v5/backlog.md` 队列表 | "待 M<k>"/"待 v2-M<k>'"/"待 v4-M<k>'''"/"待 v5-M<k>''''"的行在其里程碑 ✅ 后必须清理或关闭（v3/backlog 纪律双维护） |
| 发布留档 | `plan/05-发布留档.md`（各腿发布节并入：v2.0.0 / v4.0.0 / v5.0.0） | M6 ✅ 时要求两栏齐（tag 时点事实 / tag 后追加事实）+ 覆盖对账小节；腿内发布里程碑 ✅ 后追加对应版本节 |
| 文档点名的工具 | `tools/`、`scripts/` | 文档引用的脚本必须有实物，或登记进布局门 `PENDING_TOOLS`（未到该里程碑）；落位与删登记同提交 |
| CI | `.github/workflows/ci.yml` | layout job 两条门步骤 + test job typecheck / validate / validate:story / validate:rhythm / vitest（v5-M1'''' 起把文本长度门与节奏门并入远端；**该改动本轮尚未 push，远端实证待推送后回填，不虚报**）。历史实证：v3.0.0 发布链 ci run 40113677118 / deploy-pages run 40113677108 双 success（2026-10-25），v5 装订笔 ci run 40269817007 / deploy-pages run 40269816998 双 success（2026-10-26），两次均为 CI 日志实证而非本地等价 |

## 环境事实与禁忌（实测 2026-10-23）

- node v24.15.0 / npm 11.12.1 / git 2.54.0.windows.1（Git Bash）。
- 本机直连 github.com 不通（对策见 `plan/04` §风险：镜像/代理/顺延，不虚报发布）。
- 禁止：把"未执行"写成已完成；在 tag 之后改代码面；提交信息与任何入库文件写本机盘符/用户名/回环代理端口（脱敏门 `node tools/check-desensitized.mjs` 会拦，示例路径用 `<user>`/`<repo>` 占位符）。
- 状态行必须写成表格行；改状态要**同步翻齐** `plan/00` 里程碑总表 + `README.md` 状态表两处副本，再跑布局门。
