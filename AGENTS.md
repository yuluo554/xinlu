# AGENTS.md

本仓库遵循 **`ai-tool-project-sprint`** 方法论（装订日期：2026-10-23）。

## 任何新对话的第一件事

```bash
node tools/check-sprint-layout.mjs    # 布局门；必须绿，红了先修布局再干活
```

- 续接对话：读 `plan/HANDOFF-M<k>.md`（那是第 k 棒的收尾交接单），**先跑上面这条门**。
- v2 腿（`plan/v2/` 套件）：读 `plan/v2/HANDOFF-v2-M<k>.md`（v2-M<k>' 里程碑的交接单，文件名不带撇号），同样先跑布局门。
- v4 腿（`plan/v4/` 套件）：读 `plan/v4/HANDOFF-v4-M<k>.md`（v4-M<k>''' 里程碑的交接单，文件名不带撇号），同样先跑布局门。
- 接手对话（无 HANDOFF）：先读 `plan/00`、`plan/05`、`plan/06` 与各 HANDOFF，重建"当前状态 + K 口径清单"再动手。
- **门不存在 = 本项目没装订** → 先补第零步，再做别的。

## 强制布局（布局门逐条断言，改动前先看这里）

| 项 | 位置 | 判据 |
|---|---|---|
| 计划套件 | `plan/00–06` + `plan/backlog.md` | 存在且各含必需小节（标题关键词） |
| v2 计划套件 | `plan/v2/00–06` + `plan/v2/backlog.md` | 存在且各含必需小节；v2 里程碑机读状态行以 `v2-M<k>'` 标号写入两处状态副本；交接单落 `plan/v2/HANDOFF-v2-M<k>.md` |
| v4 计划套件 | `plan/v4/00–06` + `plan/v4/backlog.md` | 存在且各含必需小节；v4 里程碑机读状态行以 `v4-M<k>'''` 标号写入两处状态副本；交接单落 `plan/v4/HANDOFF-v4-M<k>.md`（v3 腿未接门，行纪律双维护，见 `plan/v3/backlog.md` 观察区） |
| 数据台账 | `data/README.md` | 口径来源 + 依据查证三态表在位 |
| 交接单 | `plan/HANDOFF-M<k>.md`（v2 腿：`plan/v2/HANDOFF-v2-M<k>.md`；v4 腿：`plan/v4/HANDOFF-v4-M<k>.md`） | 每个 ✅ 里程碑一份，七节齐（含"当前事实"）；**M0 豁免**（M0 之前没有上一棒可写 HANDOFF-M0，M0 的收尾动作是写 HANDOFF-M1） |
| 里程碑状态副本 | `plan/00` 里程碑总表状态列 + `README.md` 状态表 | **逐处一致**，逐副本独立采集（状态行必须写成表格行才可机读；散文状态不参与判定，两处副本的行数门会打进结论） |
| 承诺-证据台账 | `plan/00` + `plan/v2/00` + `plan/v4/00` | 已 ✅ 里程碑不得仍挂"⬜ 待 M<k>"（台账三份都扫；v3/00 台账纪律双维护） |
| 缺口队列 | `plan/backlog.md`、`plan/v2/backlog.md` 与 `plan/v4/backlog.md` 队列表 | "待 M<k>"/"待 v2-M<k>'"/"待 v4-M<k>'''"的行在其里程碑 ✅ 后必须清理或关闭（v3/backlog 纪律双维护） |
| 发布留档 | `plan/05-发布留档.md` | M6 ✅ 时要求两栏齐（tag 时点事实 / tag 后追加事实）+ 覆盖对账小节 |
| 文档点名的工具 | `tools/`、`scripts/` | 文档引用的脚本必须有实物，或登记进布局门 `PENDING_TOOLS`（未到该里程碑）；落位与删登记同提交 |
| CI | `.github/workflows/ci.yml` | layout job 两条门步骤 + test job vitest（远端已接通：v3.0.0 发布链 ci run 40113677118 / deploy-pages run 40113677108 双 success，2026-10-25 实测；首推前的历史记录保持「本地等价校验（待首推验证）」原表述不改写） |

## 环境事实与禁忌（实测 2026-10-23）

- node v24.15.0 / npm 11.12.1 / git 2.54.0.windows.1（Git Bash）。
- 本机直连 github.com 不通（对策见 `plan/04` §风险：镜像/代理/顺延，不虚报发布）。
- 禁止：把"未执行"写成已完成；在 tag 之后改代码面；提交信息与任何入库文件写本机盘符/用户名/回环代理端口（脱敏门 `node tools/check-desensitized.mjs` 会拦，示例路径用 `<user>`/`<repo>` 占位符）。
- 状态行必须写成表格行；改状态要**同步翻齐** `plan/00` 里程碑总表 + `README.md` 状态表两处副本，再跑布局门。
