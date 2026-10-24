# HANDOFF-v3-M3 · v3-M2'' → v3-M3'' 交接单

> 用法：续接对话第一件事 = 跑布局门 `node tools/check-sprint-layout.mjs`（必须绿），然后读本档。
> 上一棒：v3-M2''（时间轴界面 + 叙事美术 + 游戏感三件，2026-10-24 ✅）。DoD 单源 [00 §里程碑总表](00-README总览.md)；验证记录 [docs/v3-M2-gates.md](../../docs/v3-M2-gates.md)。

## 一、当前进度 + 证据

- **v3-M2'' ✅（2026-10-24）**。交付：D4=B 时间轴画卷（桌面双栏：左八段轨道含线别色点 + 右事件卡；移动竖向时间轴；卡片重排：线别标签/年龄徽章/图标位）+ 175 枚 Game-Icons 事件图标层（对照表 `src/data/icon-map.json` 全覆盖、逐张对文案 [docs/v3-M2-icons.md](../../docs/v3-M2-icons.md)）+ 3 枚状态条资源图标 + CC0 parchment 纹理 2 件 + 状态条常驻（图标+数值+增损 bump）+ critical 重量分级（深描边+徽章+420ms 入场）+ 后果浮动微反馈（非阻塞层：资源带符号/三观只给方向词）+ mascot 降级三类出场（卡上无鱼）。
- 许可门白名单扩展**先于**素材入库（03 模块 6 纪律）：`assets/game-icons/` + `assets/cc0/` 入白名单，credits 加 Game-Icons 署名行（许可门 CREDIT_LINES 同步）；assets/README.md 增 v3 增量节（检索式与下载留痕）。
- **预算线重审**：500KB → 650KB（gzip）。依据：175 枚图标层（gz 约 111KB 实测增量）是 D3 拍板主体、鱼帧源 192px 不再压（分享卡 330px 绘制主视觉画质优先）——v3/02 §九 ▸ M2'' 增补 + v3/00 决策记录 2026-10-24 行，门脚本阈值同步。终值 **586.40KB / 650KB**。
- 出口门终值：validate **0 FAIL**（9 区，新增 I 区图标对照 175/175）/ vitest **166/166**（157+9）/ typecheck 0 / E2E 双端 exit 0（166 卡年龄单调 3→1068、选项 ≥3、图标全覆盖、critical 分级/状态条/轨道色点/浮动层断言全绿）+ 768 中档双栏断言（轨道 236px）+ 三档截图 / 可达性 2496 组 9/9 / 预算 586.40KB / 布局·脱敏·许可全绿。
- 变异自检：删图标 SVG → validate I.FILE 必红 → 复原绿（[docs/v3-M2-gates.md](../../docs/v3-M2-gates.md) §四）。
- dogfooding：本棒无正式留痕（M2'' 非要求项）；目检截图 = `docs/assets/v3m2-{critical-card,float-layer,summary}-1280.png` + `e2e-smoke-{375,768,1280}.png`。

## 二、当前事实·状态不变量（动手前必须知道）

1. **v3 里程碑状态真值 = plan/v3/00 §里程碑状态**（4 行，M1''/M2'' ✅）；两副本（plan/00 + README）各加至 v3-M2'' 行，逐处一致。
2. **v1.0.0 / v2.0.0 tag 与 Release 不许改写**；**v3.0.0 发布时 CHANGELOG 必须注明「历史存档建议重开」——重开声明义务在 M4''**（沿 M1'' 交接 §二.2）。
3. **传导系数表是冻结口径**（02 §二）；ei/jp 被 outlook 同驱是结构耦合；可达性扫描轴空间 2496 组 + 防回退锚 `teen-003`（wanderlust 唯一来源）——给事件挂 `wanderlust` flag 前先想防回退测试。
4. **预算线现为 650KB**（v3/02 §九 ▸ M2'' 增补）；素材增量先压缩（压缩>减帧>降分辨率），红即裁。**鱼帧 192px 源不再压**（分享卡 330px 绘制）。
5. **图标对照表 `src/data/icon-map.json` 是单源**：新增事件必须同步补条目（validate I 区会拦「对照表缺事件」与「引用无实物 SVG」）；图标文件按 `assets/game-icons/icons/<作者>/<名>.svg` 存放，作者目录即 CC-BY 署名单位；**新图标入库先过许可门白名单**（已含 `assets/game-icons/`，直接放对目录即可）。
6. **UI 表现层语汇单源 `src/ui/timeline.ts`**（LINE_META/RES_META/STAGE_SHORT/浮动词）——线别中文名与三观方向词只此一份；`src/ui/icons.ts` 的 `iconStyle()` 返回值**必须 esc() 后再进 HTML 属性**（vite data-URI 内含单引号，单引号包裹会截断——M2'' 实测坑，见 §五）。
7. **调度器分批口径**：love/friend/health 密度门未开（02 §四：M3'' 补 health + 04 §v3-M3'' 3.4 love/friend 补齐；02 §四括注的「M2'' 补 love+friend」与 04 执行视图不一致，**以 04 为准**，M1'' 交接即按此执行——如需改回先改 04 再动数据）。`LINE_DENSITY_ON` 常量在 `scripts/validate-data.mjs`，开线随数据同提交。
8. **E2E 断言基线已扩展**（smoke.mjs v3-M2'' 段）：改卡片 DOM 结构时注意保持 `.event-card[data-age-months]`、`.ev-icon[data-icon]`、`.statebar .res`、`.timeline-segment`、`.float-layer`、`.event-card.critical` 这些断言钩子。
9. **K1–K12 全部继续生效** + M1''/M2'' 新增易踩见 §五。
10. **03 模块状态**：1 ✅ / 2 🟡（余 love/friend/health 分批）/ 3 ✅ / 4–6 ⬜。
11. **backlog**：V3-1（正面_238 坏件重下）已依规则从 v2 队列转入 v3 队列（待排期）；观察区含声音扩展等。

## 三、待办（v3-M3''，按 04 §v3-M3'' 顺序执行）

1. **3.1 关系图谱**：NPC 模型接线（02 §五：bond/tag/图谱环形布局，父母默认在册）+ `src/ui/relations.ts`（SVG 收窄面）+ 图谱页入口 + 终局快照收录；单测（bondDeltas 钳制/衰减系数 0.5/tag 翻转阈值）+ 渲染断言 + E2E 双端。
2. **3.2 随机出生 + 种子码**：`seedCode = XL-XXXX-XXXX`（Crockford Base32 去 0O1I易混）+ 派生四要素 + 同码复现断言 + 手选出生仍显示种子；存档信封加可选 `seedCode` 字段（02 §八 ▸ M1'' 增补口径：读取缺省按 `seed` 数值键）。
3. **3.3 LLM 旁路**（D2=a）：`src/llm/` 单层（provider/开关/降级）+ 设置页 + 自定义第 4 槽（离线隐藏口径）+ 变体改写 + 终局点评 + 三路降级单测 + **过网隔离 grep 测试**（engine/ 零 fetch）+ 人审抽检 ≥10 条留痕。
4. **3.4 支线补齐 + 声音择项**：love/friend 每阶段 ≥3 补齐 + health 随 3.3 后补齐 + `LINE_DENSITY_ON` 全开；声音 3–5 枚 CC0（择项不做则决策记录留行 + backlog 观察区已有转入条件）。
5. 出口门沿 04：全部门绿 + 双端 E2E + 截图 + 变异自检（图谱钳制/同码复现各一）。

## 四、既定口径清单（K 编号延续 + 本棒口径）

- **K1–K12 全部继续生效**（逐条见 [../HANDOFF-M7.md](../HANDOFF-M7.md) §四 + [../v2/HANDOFF-v2-M5.md](../v2/HANDOFF-v2-M5.md) §四）。
- M1'' 口径（全部单源 plan/v3/02 ▸ M1'' 增补）：月龄解析四格式；单调规则①②③；传导方向表 + 0.4 系数；settleDeltas 结算系数；lineGain 缺省 8/15/rescue 0；线 critical 阈值 60；线终态 0/1–29/30–79/≥80；rescue <25 与 requires ≥阈值。
- **本棒（M2''）口径新增**：图标对照表单源 `src/data/icon-map.json`（validate I 区守门：覆盖 175/175 + SVG 实物存在 + kebab-case 卫生）；逐张对文案清单 = `docs/v3-M2-icons.md`（新事件图标入库时同步增行）；**v3 预算线 650KB**（v3/02 §九 ▸ M2'' 增补，重审依据与弃选项见 v3/00 决策记录 2026-10-24 行）；三观浮动只给方向词不示数（「三观数值不直接示人」的表现层延伸）；后果浮动为非阻塞自灭层（≤6 条、2.2s、pointer-events none）。
- 独白区间 <35/35–65/>65（monologues.json 9 条）；漂移净和近零——均不动。

## 五、环境坑（沿 + 本棒实测新增）

- **本棒新增**：
  - **vite SVG data-URI 内含单引号**（`xmlns='…'`）：CSS `url('…')` 单引号包裹会在内嵌引号处截断 → mask 全部静默失效（图标渲染成实心方块）。修复 = `url("…")` 双引号 + HTML 属性处 esc()（`src/ui/icons.ts` iconStyle 注释在案）。同类坑：任何把 vite 产物 URL 塞进 style 属性的代码都要 esc()。
  - **许可门按 `git ls-files` 对账**：新素材未 `git add` 前跑许可门必报「dist 图像溯源不到白名单源」——先入库再核门（本棒实测 4 FAIL 假象即此因）。
  - **Node 24 无 `node:ws` 内置模块**（报 ERR_UNKNOWN_BUILTIN_MODULE）：CDP 调试用全局 `WebSocket`（E2E 脚本同款）。
  - vitest 5 超时签名 `it(name, { timeout }, fn)`；Bash 写 `.ts` 源码会被 Mimosa 钩子拒——改码走 Edit/Write。
- 沿用：管道吞退出码（判成败 `cmd > log 2>&1; echo $?`）；sed 对中文不可靠（编辑用 Edit 工具）；dev/preview/http.server 用完清杀（`netstat -ano | grep :<port>` → `taskkill //F //PID`）；E2E 暖帧丢弃；`py` 替代 `python`；push 走 SSH:22；`core.quotepath=false`；Map.get undefined 用 `?? null` 归一；game-icons.net 直连可用（全量包 zip 一次成），github raw 走 gh-proxy 需先验证路径形状。

## 六、DoD 逐项 checklist（v3-M2''，全达成）

- [x] 2.1 许可门白名单扩展先于素材入库（`assets/game-icons/` + `assets/cc0/` + credits 行 + CREDIT_LINES 同步）；Game-Icons 175 枚（对照表 icon-map.json 先表后图、175/175 全覆盖零重复）+ CC0 parchment 纹理 2 件（检索式留痕 assets/README.md v3 增量节）；validate I 区新门 + 变异自检必红；预算线重审 650KB（口径增补 + 决策记录 + 门脚本同步）
- [x] 2.2 时间轴画卷（D4=B）：桌面双栏（八段轨道含线别色点 + 事件卡）/移动竖轴 + 卡片重排（线别标签/年龄徽章/图标位）；`data-age-months` 钩子与 E2E 年龄断言保留
- [x] 2.3 游戏感三件：状态条常驻（图标+数值+bump）+ 抉择重量分级（critical 深描边+徽章）+ 后果浮动微反馈（资源/三观）；CHECKLIST 逐项验收 + 反馈预算表落 [docs/v3-M2-feel.md](../../docs/v3-M2-feel.md)
- [x] 出口门：validate 0 FAIL（9 区）/ vitest 166/166 / typecheck 0 / E2E 双端 exit 0 + 768 中档 + 三档截图 / 可达性 9/9 / 预算 586.40KB / 布局·脱敏·许可全绿；评审门强核查记录 [docs/v3-M2-gates.md](../../docs/v3-M2-gates.md)（素材抽验 + 动效预算复核 + 三方核对 + 变异自检）
- [x] 翻面同提交：v3/00（里程碑状态 + 台账 3 行 + 实物表路径 + 决策记录 1 行）+ v3/03（模块 3 ✅、模块 2 增记）+ v3/backlog V3-1 转入 + v2/backlog V2-1 转出注记 + plan/00 与 README 两副本各 +1 行
- [x] 本交接单七节落盘

## 七、关键命令速查（每条当轮实跑过）

```bash
node tools/check-sprint-layout.mjs          # 布局门（续接对话第一件事）
npm run validate                            # 数据门 v3（9 区：E/L/B/X/P/M/V/I + 文件）
npm run validate -- --count                 # 分母汇总（175 条 / 每阶段 fate+支线）
npm test                                    # vitest run（166/166）
npm run typecheck                           # tsc --noEmit
npm run e2e                                 # E2E 双端通关 + 768 中档 + 时间轴/状态条/分级/浮动断言
node scripts/check-ending-reachability.mjs  # 可达性扫描（2496 组，9/9）
npm run gate:budget                         # 预算门（586.40KB / v3 预算线 650KB）
node tools/check-assets-license.mjs         # 许可门（白名单含 game-icons/cc0；跑前先 git add 素材）
node tools/check-desensitized.mjs           # 脱敏门
npm run build                               # vite build
```
