# DEVELOPMENT · 开发文档索引

> 本档只做 plan/ 目录的索引，不复制内容——计划、口径、决策的唯一事实源都在 plan/，改内容去那边改，防止两处分叉。

## 文档索引

| 文档 | 内容 |
|---|---|
| [plan/00-README总览.md](plan/00-README总览.md) | 项目总览：文档索引 / 决策记录 / 承诺-证据台账 / 里程碑总表 |
| [plan/01-题目文档.md](plan/01-题目文档.md) | 题目十段式：定位宣言 / 任务要求 / 验收标准 / 边界与已知限制 |
| [plan/02-数据与口径.md](plan/02-数据与口径.md) | 四维口径 / 事件库 schema / 密度口径 / 存档 schema（数值单一定义源） |
| [plan/03-模块清单与验收.md](plan/03-模块清单与验收.md) | 6 模块职责 / 引擎契约冻结签名 / 模块验收 |
| [plan/04-里程碑任务分解.md](plan/04-里程碑任务分解.md) | M0–M6 任务块 / 验证命令 / 风险与恢复 |
| [plan/05-发布留档.md](plan/05-发布留档.md) | 发布三件套留档（M6 撰写主体） |
| [plan/06-运维节奏.md](plan/06-运维节奏.md) | 发布后八类缺口轮转 / 归档判据 |
| [plan/backlog.md](plan/backlog.md) | 迭代队列（唯一队列，证据制；当前 B1 平衡缺口在队） |
| plan/HANDOFF-M*.md | 各开发棒交接单（七节：进度证据 / 状态不变量 / 待办 / 口径 / 环境坑 / 核对清单 / 命令速查） |

## 门与常用命令

```bash
node tools/check-sprint-layout.mjs    # 布局门（方法论装订，任何新对话第一件事）
node tools/check-desensitized.mjs     # 脱敏门（发布前必跑，进 CI layout job）
npm run validate                      # 数据门（--full 常开：密度矩阵 + 画像字数）
npm run validate -- --count           # 分母汇总（README / 台账数字对账）
npm test                              # vitest 单测
npm run typecheck                     # tsc --noEmit
npm run build && npm run preview      # 构建产物本地冒烟
```

协作纪律（状态副本同步、提交信息口径、脱敏约束）见 [AGENTS.md](AGENTS.md)。
