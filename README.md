# 心路 · 人格演化人生模拟

> 界面清爽、双端即开即玩的网页人生模拟：从一段出生环境开始，看着 E-I / S-N / T-F / J-P 四维倾向值慢慢长成人格；每一次抉择都在雷达图上留下轨迹，终局凝结成一份可分享的人格演化报告。
>
> （产品页将于 M5 定稿；当前进度见下方状态表。）

## 状态

| 里程碑 | 状态 |
|---|---|
| M0 仓库骨架与脚手架 | ✅（2026-10-23） |
| M1 数据先行 | ✅（2026-10-24） |
| M2 演化引擎与存档 | ✅（2026-10-24） |
| M3 界面与可视化 | ✅（2026-10-24） |
| M4 完整内容 | ⬜ |
| M5 打磨与门面 | ⬜ |
| M6 发布 | ⬜ |

## 本地运行

```bash
npm install
npm run dev        # 开发服务器（Vite，默认 http://localhost:5173）
npm test           # vitest 单测
npm run typecheck  # tsc --noEmit
```

零运行时依赖（`dependencies` 恒空）：全部逻辑为原生 TypeScript + 手绘 SVG，离线可玩。

## 文档

- 开发计划与口径唯一事实源：[plan/00-README总览.md](plan/00-README总览.md)
- 开发索引：`DEVELOPMENT.md`（M5 建立）
- 数据台账与依据查证：[data/README.md](data/README.md)
