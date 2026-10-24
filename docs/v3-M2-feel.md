# v3-M2'' · 游戏感动效验收（game-feel-and-juice CHECKLIST 逐项 + 反馈预算表）

> 依据 plan/v3/04 §v3-M2'' 2.3：动效按 game-feel-and-juice CHECKLIST（反馈预算制），本档是逐项验收记录。
> 适配口径：本作为**回合制叙事卡牌**（无实时控制、无物理模拟），CHECKLIST 的 A（控制与模拟）/B（输入与宽容）两域按其 Test-for 改答；
> 反馈强度取 **Medium 带**（Kao 2020 倒 U：Extreme ≈ None 都伤体验；叙事纸面基调取中低强度，顶格动效只给 critical——稀有度阶梯）。

## 一、反馈预算表（event × magnitude → bounded bundle，实现与预算逐条对账）

| 动作/事件 | 反馈束 | 预算上限 | 实现核对 |
|---|---|---|---|
| 屏切换（常规） | rise 上浮淡入 280ms ease-out | 每屏 1 次 | `.screen` rise ✓ |
| critical 卡入场 | rise+scale 420ms + 深色描边 + 徽章 | **稀有度阶梯顶层，critical 独占**（每局约 22 张） | `rise-critical` 仅 `.event-card.critical` ✓ |
| 选项 hover | 底色变浅 180ms | 单层过渡 | `.option:hover` ✓ |
| 选项 press | scale(0.99) <100ms | 单层 | `.option:active` ✓ |
| 状态条数值变化 | bump scale 1→1.35→1（600ms，一次） | 每次选择 ≤3 项（mood/money/health） | `.res.bump` ✓ |
| 后果微反馈 | 浮动签上浮淡出 2.2s，stagger 120ms | 每次选择 **1 层 ≤6 条**（资源带符号数值 + 三观只给方向词），pointer-events:none 非阻塞 | `.float-layer` / `.floater` ✓ |
| 时间轴新色点 | dot-in 320ms 缩放淡入 | 每新点 1 次 | `.tl-dot` ✓ |
| mascot 待机游动 | fish-drift 循环 | **全站唯一 infinite 动画**（v2 已有，非本棒新增） | `.fish-idle` ✓ |

「禁过动画」复核结论：新增动效全部 ≤2.2s 且自灭（fill-mode forwards 收在透明），无新增 infinite；顶格（420ms 加重入场）仅 critical 触发，常规动作全部 ≤320ms。

## 二、CHECKLIST 逐项验收

### A · Control & simulation（控制与模拟）

- [x] **N/A 判定**：回合制卡牌无实时控制与物理常量；本域可迁移判据 =「strip 后核心仍成立」——`prefers-reduced-motion: reduce` 下全部动效关闭（screen/critical/tl-dot/floater/bump 全部 `animation: none`），信息完整性不受损（状态条为常驻静态数值、图标为静态 mask）。E2E 与手动目检均在无动效依赖下可读。
- [x] 打磨不遮滞后：选项点击为同步渲染（无人为延迟/无等待动画拦截），浮动层 `pointer-events:none` 不拦截后续操作。

### B · Input & forgiveness（输入与宽容）

- [x] **N/A 判定**：无移动/跳跃类实时输入。可迁移判据 = 早按不丢：选项按钮渲染即可点（无入场动画门禁，`rise` 为纯视觉），禁用项仅 `requires` 锁定（引擎口径）并有置灰 + title 说明。

### C · Juice toolkit（反馈工具箱，逐通道预算）

- [x] **Every value change is eased**：状态条数值 bump（scale 弹跳）、后果浮动（上浮+淡出）、轨道新点（缩放淡入）——无瞬时跳变。
- [x] **Distinct signature per event type**：资源增损 = 带符号数值签（+青/−朱）、三观变化 = 方向词签（不含数值，口径「三观数值不直接示人」）、轨道新点 = 线别色点、critical = 深描边+墨底徽章。四通道互不撞形。
- [x] **预算封顶**：浮动层每选择 ≤6 条（3 资源 + 3 三观理论最大值），stagger 120ms，总时长 2.2s 内自灭；无粒子、无震屏（叙事纸面基调，不做战斗系 feedback）。
- [x] **无 uncapped emitters / 无重复 splat**：浮动签按选项实际 deltas 生成（零增量零签），非固定文案轮播。

### C.9 · Feedback budget（倒 U 天花板）

- [x] 全部反馈处于 **Medium 带**：单次选择 = 状态条 bump（≤3）+ 浮动签（≤6）+ 轨道新点（1）+ 卡切换（1）；无叠加爆点。
- [x] **稀有度阶梯**：顶格动效（420ms 加重入场 + 深色描边）唯一归属 critical（每局 ~22/166 张 ≈ 13%，符合「稀有但非孤例」）；常规卡 280ms。

### D–F · Animation / Camera / UI feel

- [x] **Timing consistent per action type**：同类动作时长恒定（屏切换一律 280ms、critical 一律 420ms、浮动一律 2.2s+120ms×序）——无可变时长。
- [x] **UI juice 三件**：hover 180ms → press <100ms → 反馈签；无静默状态切换（每步选择必有 bump/浮动至少其一，validate 保证每选项 ≥1 项非零资源增量）。
- [x] **相机 N/A**（无镜头系统）；滚动复位沿用「换屏回页首」既有纪律。
- [x] **声音**：本棒不含音频（v3-M3'' 择项，08 §六），CHECKLIST 音频条目全部 N/A 并在此声明。

## 三、验收证据

- E2E 双端断言：状态条 3 项恒在且值域 [0,100]；critical 分级卡全程 ≥1；轨道色点随抉择增长；浮动层全程可观察（`tests/e2e/smoke.mjs` v3-M2'' 段）。
- 截图目检（1280）：`docs/assets/v3m2-critical-card-1280.png`（描边+徽章+轨道 critical 环）、`v3m2-float-layer-1280.png`（资源签 ×2 + 三观方向签 + mascot 反馈帧）、`v3m2-summary-1280.png`（小结转场）、`v2m2-mascot-card-{375,1280}.png`（双栏/竖轴首卡）。
- reduced-motion 兜底在 style.css 单点声明（@media 块），与 CHECKLIST「strip 后仍成立」判据对齐。
