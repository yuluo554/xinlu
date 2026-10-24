# v2-M1' · dogfooding 实玩留痕（2026-10-24）

> v2/03 §6 验收：≥2 局不同出生环境实玩通关留痕。实际 3 局，全部在真实 UI（Vite preview 静态服务 + Edge 无头 CDP 驱动，375×812 视口）逐卡实点完成；事件库 121 条（v2-M1' 补齐 9 条后）。
> 驱动方式与 M4 的 IAB 实点同构：每次点击经真实 DOM 事件派发，页面渲染、存档、结局判定全走生产路径。

## 一、实玩局记录（3 局）

| # | 出生环境（年代/城乡/氛围/教养） | 策略 | 终局结局 | 终局字母 | 截图（docs/assets/） |
|---|---|---|---|---|---|
| A | 90s / 农村 / 和睦 / 权威 | 全选第 1 项（末项） | end-fallback 路上的人 | ISFJ（实算） | v2m1-dogfood-runA-375.png |
| B | 10s / 大城 / 疏离 / 忽视 | 全选第 0 项 | end-fallback 路上的人 | ENFJ（实算） | v2m1-dogfood-runB-375.png |
| C | 80s / 小城 / 紧张 / 忽视 | 引擎引导贪心（每卡选使四维最逼近 end-05 区间中心的选项） | **end-05 一手好活的沉默匠人** | **ISTP** | v2m1-dogfood-runC-istp-375.png |

另：E2E 冒烟（tests/e2e/smoke.mjs，`npm run e2e`）默认环境（60s/大城/和睦/权威）全选第 0 项双档通关至 end-06 ESFJ，截图 e2e-smoke-375.png / e2e-smoke-1280.png。

## 二、B1 修复的实玩验证结论

- **局 C 命中 end-05（ISTP）**——M4 dogfooding §四记录的 4 个不可达条件结局之一，本棒补齐 T/P 侧语义事件后，真实 UI 实玩路径可达（引擎级 96 组扫描同口径全绿，见 `scripts/check-ending-reachability.mjs` 输出）。
- 局 A/B 落兜底：全选同侧选项的机械策略下终态落中间带，与 M4 时期行为一致，属预期（兜底结局存在的意义）。
- 新事件（每阶段 1 条 `-019` context + elder-023 critical）在 3 局中均正常出现、应答、计入阶段小结与终局复盘，无渲染或判定异常。

## 三、复现

```bash
npm run build && npm run preview   # 或直接 npm run e2e（内置 build + preview + 通关）
# dogfooding 三局由一次性 CDP 探针驱动（跑完已删，套路 = tests/e2e/smoke.mjs）：
# 局 A/B 固定 radio 组合 + 固定选项序号；局 C 每步读 xinlu.save.v1 重建 RunState
# → pickEvent → 贪心逼近 {ei:24, sn:76, tf:24, jp:24}（end-05 区间中心）。
```
