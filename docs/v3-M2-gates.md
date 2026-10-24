# v3-M2'' · 评审门（强核查）验证记录

> 依据 plan/v3/04 §v3-M2'' 出口门：**评审门（强核查）= 素材「图说的是不是这件事」逐张抽验 + 动效预算复核（禁过动画）**。
> 本档是三方核对与变异自检的留痕；逐张对文案全量清单在 [v3-M2-icons.md](v3-M2-icons.md)，动效预算在 [v3-M2-feel.md](v3-M2-feel.md)。

## 一、素材评审门（图说的是不是这件事）

- **核对对象**：175 枚 Game-Icons（对照表单源 `src/data/icon-map.json`，逐张对文案清单 `docs/v3-M2-icons.md`，表内含每条事件的文案摘录）。
- **选图纪律**：每枚图标在选型时逐一对照事件文案主物象（如 摇篮转铃→windchimes、抓周→abacus、高考志愿→crossroad、返聘带新人→teacher、
  环疆旅行书房 vs 首付→strongbox）；对照表按事件库序排列，评审者可逐行「文案 vs 图标名」直读比对。
- **实渲染抽验**：E2E 截图目检 —— 首卡 windchimes（命运线赭色）、critical 卡 meeple-group（庙会走失「四周全是比你还高的腿」），
  图形与文案事件直接对应（`docs/assets/v2m2-mascot-card-1280.png` / `v3m2-critical-card-1280.png`）。
- **已知弱配对**（如实注记）：adult-005（后浪新人）→ chess-pawn 为隐喻配图（棋子换位），语义成立但非直扣物象；保留并在 icons.md 抽验记录注记。
- **对不上的怎么办**（04 §风险口径）：不强配——本批未出现需要降级为「无图标」的事件（`icon-map.json` 175/175 全配，validate I 区守门）。

## 二、动效预算复核（禁过动画）

- 预算表逐条对账见 [v3-M2-feel.md](v3-M2-feel.md) §一：新增动效全部 ≤2.2s 自灭、无新增 infinite（全站唯一循环 = v2 fish-drift）；
- 顶格动效（420ms 加重入场+深描边）唯一归属 critical；常规动作 ≤320ms；反馈带 = Medium（Kao 2020 倒 U 口径）。

## 三、三方核对（口径 ↔ 数据 ↔ 实现）

| 方 | 实物 | 核对结论 |
|---|---|---|
| 口径 | plan/v3/02 §九（D3 素材口径 + ▸ M2'' 预算线 650KB 增补） | 门脚本 `tools/check-dist-budget.mjs` 阈值 = 650KB，注释引该节；许可门 `tools/check-assets-license.mjs` 白名单含 `assets/game-icons/` + `assets/cc0/`，credits 行一致 |
| 数据 | `src/data/icon-map.json`（175 条）+ `assets/game-icons/icons/<作者>/*.svg`（175 枚 + 3 枚状态条图标） | validate I 区：覆盖 175/175、SVG 实物 178 枚在位、图标名 kebab-case 卫生 |
| 实现 | `src/ui/icons.ts`（glob 注册表）+ `screens.ts`（图标位/线别 chip/年龄徽章/critical 分级/状态条/浮动层）+ `timeline.ts`（VM 纯函数） | 单测 9 项（timeline.test.ts，含「每个图标名解析到真实 SVG URL」全量回环）；E2E 双端 + 768 断言 |

## 四、变异自检（必红 → 复原绿）

| 变异 | 预期 | 实测 |
|---|---|---|
| 删除 `assets/game-icons/icons/lorc/backstab.svg` | validate I.FILE 必红（对照表引用无实物） | `[I.FILE] 对照表引用的图标无 SVG 实物：backstab` ✓ 必红 |
| 复原该文件 | 全绿 | 数据门 0 FAIL ✓ |

（UI 分级断言的防回退由 E2E 承担：critical 卡无 `.critical` 类 →「全程未出现 critical 分级卡」必红；状态条缺失/值越界、轨道色点不增长、浮动层缺失均有独立断言。）

## 五、出口门终值（v3-M2''）

- 数据门 `npm run validate`：**0 FAIL**（9 区全绿，新增 I 区图标对照 175/175）
- 单测 `npm test`：**166/166**（v3-M1'' 基线 157 + 本棒 9）
- typecheck：**0 错**
- E2E `npm run e2e`：**双端 exit 0**（375/1280 通关 166 卡年龄单调 3→1068、选项 ≥3、图标全覆盖、critical 分级/状态条/轨道/浮动断言绿）+ 768 中档双栏断言（轨道 236px）+ 三档截图落盘
- 可达性 `node scripts/check-ending-reachability.mjs`：**2496 组 9/9** exit 0
- 预算门：**586.40KB / 650KB**（v3 预算线，重审依据见 plan/v3/02 §九 ▸ M2'' 增补 + v3/00 决策记录）
- 布局门 / 脱敏门 / 许可门（白名单扩展后）：全绿
