# v2-M4' 门禁与评审留痕（图鉴 + P2 拍板 + 发布 v2.0.0）

> 依据 plan/v2/04 §v2-M4'：出口门 = 4.1–4.3 全过 + 公共门全绿；**评审门（强核查）= 02 §三图鉴 schema ↔ gallery 实现 ↔ 单测三方一致**。本档是留痕。

## 一、评审门（强核查）：02 §三 ↔ gallery.ts ↔ 单测 三方逐条核对

规格单源 [02 §三](../plan/v2/02-数据与口径.md)；实现 [src/ui/gallery.ts](../src/ui/gallery.ts)；单测 [src/ui/gallery.test.ts](../src/ui/gallery.test.ts)。

| 规格条目（02 §三字面） | 实现 | 单测断言 | 一致 |
|---|---|---|---|
| localStorage key `xinlu.gallery.v2` | `GALLERY_KEY = "xinlu.gallery.v2"` | 全部用例经该 key 读写 stub | ✅ |
| 信封 `{ v: 2, types, endings, runs }` | `GalleryData` 接口 + `validateGallery` exactKeys 四键 | `无 key 读回空图鉴（runs 0 / 两表皆空 / v 2）`；多键/缺键 → 空 | ✅ |
| `types` 16 型封闭 | 键 ⊆ `GALLERY_TYPES`（四维字母笛卡尔积派生，不内联 16 型清单） | `types 混入 16 型之外的键 → 空图鉴`；`GALLERY_TYPES：16 个、唯一、…与 portraits.json 键集相等` | ✅ |
| `types[t] = { count, firstSeenAt }` | 条目 exactKeys 两键；count 正整数、firstSeenAt 有限数 | `型条目形状错（count 0 / 负数 / 小数、firstSeenAt 非数、多键）→ 空图鉴` | ✅ |
| `endings` 键 ⊆ 结局枚举（8 条件 + 兜底） | 键 ⊆ `ENDING_META`（endings.json 文件序，兜底居末） | `endings 混入枚举之外键（end-99）或计数形状错 → 空图鉴`；`ENDING_META：9 条、id 与 endings.json 文件序一致` | ✅ |
| `runs` 累计通关数 | `recordRun` 每笔 +1，非负整数校验 | `16 型 × 9 结局全量各记一笔…runs = 25` | ✅ |
| 独立于 `xinlu.save.v1`（K6 不动） | gallery.ts 不 import storage.ts，不触碰 SAVE_KEY；存档 schema 零改动（storage.ts 本棒零 diff） | 全套 121 项单测含存档既有用例不回退 | ✅ |
| 损坏 → 视为空图鉴重建，不提示不清档 | `loadGallery` 任何异常/校验失败回 `emptyGallery()`，永不 throw、不 removeItem；下次 `recordRun` 写入即覆盖重建 | `非 JSON / 非 v2 / 缺键 / 多键 / 表非对象 → 一律回空图鉴`；`损坏后 recordRun 从空重建：旧污染不残留`；`存储不可用…读侧永不 throw` | ✅ |
| `gallery.test.ts` 守护 | — | 15 项（读写 4 / 损坏重建 3 / 封闭 4 / 派生与代表四维 4） | ✅ |

**结论：无第二表述，三方一致。** 实现自定细节（02 §三未锁定）见 §三口径解读。

## 二、图鉴 UI 接入与 E2E 扩展断言

- **记录时机**：`toNext()` 推进 `stageIndex` 越过末阶段的一次性迁移点调 `recordGallery()`（恰记一笔）；刷新续局到终局（boot resume 路径）不重记，终局提示的「新解锁」以会话内表现态 `galleryJustUnlocked` 承载。
- **图鉴屏**：开局屏「人格图鉴」入口 → 独立屏（16 型格 + 结局记录 + 返回）；解锁型格印 avatar 待机像（参数 = `representativeDims`），结局记录印 `endingFrame` 锁表帧——**取图只走 `endingFrame`，零新映射**（HANDOFF-v2-M4 §二.7 纪律）。
- **终局「未解锁型」提示**：`.gallery-hint` 行（已解锁 X/16 型，还有 N 型未解锁 / 集齐祝贺 + 本局新解锁型号 + 累计局数）。
- **E2E（双端）**：终局提示存在且含未解锁口径 → 重开回开局屏 → 图鉴入口在位 → 图鉴屏 16 格 / 本局型号在册 / 9 条结局记录 / 解锁条目 avatar 水合数对账 / 累计通关 N 局（二局 = 2，跨局累计）→ 返回开局屏；截图留痕 `docs/assets/v2m4-gallery-{375,1280}.png`。
- **E2E 行为变更（诚实留痕）**：二局清档由 `localStorage.clear()` 收窄为 `removeItem('xinlu.save.v1')`——图鉴跨局保留是其本意，存档清档语义不变。
- **smoke.mjs 新增 `--base-url <url>`**：跳过 build/preview 驱动外部静态服务——4.3 干净环境冒烟与 Pages 线上实开复用同一脚本口径（`--no-build --base-url`），无新增依赖（K2）。
- **变异自检**：E2E 图鉴格数断言改错（16→17）→ `FAIL 375 档：图鉴格非 16（实得 16）` → 复原绿（2026-10-24 实跑留痕）。

## 三、口径解读留痕（02 §三未锁细节，实现自定）

| 决策 | 口径 | 理由 |
|---|---|---|
| 16 型封闭集的来源 | `AXIS_LETTERS` 四维字母笛卡尔积派生（16 个），单测与 portraits.json 键集互证 | 不内联 16 型清单（与 fish.ts「无 16 型字面量」同纪律）；字母域与引擎 `mbtiLetters` 同源 |
| 图鉴格 avatar 的帧 | 解锁型格 = 待机像（whale-idle，无锁定帧），差异化由 `representativeDims` 驱动 params（鱼群/饱和度/游速）；结局记录 = `endingFrame(id)` 锁表帧 | 图鉴数据只存 count/firstSeenAt（schema 冻结，无帧字段）；type→帧映射被 HANDOFF-v2-M4 §二.7 明令禁止；结局记录的「取图走 endingFrame」是纪律的正面消费 |
| `representativeDims` 取值 | 高位字母侧 75 / 低位侧 25（高位字母 E/S/F/J）；单测以 `mbtiLetters(rep(t), env) === t` 全 16 型 × 2 环境回环钉死 | 75/25 落在 mbtiLetters 的 `>50/<50` 判定域内保证回环成立——高位字母与引擎口径的一致性由该测试自动守护，不构成第二表述 |
| 结局记录锁定态展示 | 标题隐去（？？？ +「尚未抵达的结局」） | 图鉴作为收集目标的悬念语义；endings.json 本身公开（仓库内数据），此处仅 UI 层遮蔽 |
| 首见日期显示 | `toISOString().slice(0,10)`（UTC 日） | 确定性（不依赖运行环境 locale）；firstSeenAt 按 02 §三 schema 照存 |
| 图鉴屏无场景氛围层 | 与开局屏一致（无 sceneLayer） | 图鉴是局外 meta 屏，与开局屏同级；氛围层语义绑卡流/小结/终局四屏 |

## 四、P2 择项拍板（4.2，2026-10-24）

**三项均不做**（决策记录行落 plan/v2/00 §决策记录；观察区转入条件同步更新）：

| 项 | 拍板 | 证据 |
|---|---|---|
| PWA（manifest + SW） | 不做 | traffic views/clones 14 天窗口全 0、issue 0（gh api 实查）；本作零网络请求，SW 只增缓存失效维护面 |
| 音效（3–5 个 CC0） | 不做 | 无诉求反馈；dist 预算余量 ~53KB（447.29/500KB），音效会吃掉大半并牵动素材-许可链路 |
| 关键抉择回溯一次 | 不做（暂） | 观察区前置条件「v2.0.0 上线后诉求强」尚未到观察时点，按 06 证据制不入队 |

## 五、门禁清单（4.1 收尾实跑，2026-10-24）

布局门全绿 / 脱敏门 0 命中 / 数据门 6 区 0 FAIL / typecheck 0 错 / vitest **121/121**（106 基线 + 15 图鉴）/ 可达性 9 结局 exit 0 / 许可门 0 FAIL / 预算门 **447.29KB** 绿 0 WARN（图鉴 JS +1.78KB）/ e2e 双端绿（通关 + mascot + 场景 + 分享卡落盘 + credits + 图鉴断言）。
