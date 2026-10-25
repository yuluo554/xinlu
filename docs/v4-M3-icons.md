# v4-M3''' · 图标 objectKey 重映射与小结配图（对文案清单 + 终检）

> 依据 plan/v4/02 §六（objectKey 选图纪律：**文本核心物件 ⊆ objectKey**，宁缺毋滥，豁免 ≤10% 显式 null）与 §七.1（小结场景配图逐张对文案留痕）。
> 对照表单源 = [src/data/icon-map.json](../src/data/icon-map.json)（条目形状 `{objectKey: 图标名|null}`，validate I 区守门：I.SCHEMA 形状 / I.NAME / I.FILE 实物 / I.EXEMPT 豁免 ≤10% + 既有 I.COVER/I.EXTRA）。
> 素材溯源 = [assets/README.md](../assets/README.md) v4 增量节（补采 4 枚 + 自产场景图 8 枚）。

## §一、objectKey 全量复核（243/243，2026-10-26）

**复核背景**：v4-M1''' B 段把 243 条事件文本全量写实化重写，v3-M2-icons.md 的逐张对文案清单基于旧文本——本棒按**新文本**逐条重核（抽验口径 100% 全量，非抽样）。

**结论**：**238 条保留**（现图标直扣新文本核心物件或题眼成立）+ **4 条换图**（补采）+ **1 条显式豁免**。豁免 1/243 = 0.4% ≤ 10% 上限（I.EXEMPT 绿）。

### 换图 4 条（补采，Game-Icons 全量包字节与 v3 两批一致）

| 事件 | 旧 → 新 | 作者 | 理由（新文本核心物件） |
|---|---|---|---|
| infant-015 初雪 | `snowman` → `snowflake-1` | lorc | 新文本写「第一次看见雪／接住一片雪／冰棱」，**无堆雪人情节**；雪花直扣初雪意象 |
| toddler-201 值日生 | `towel` → `broom` | delapouite | 新文本核心=值日牌＋给每桌发餐巾纸的「职务」感；扫帚是值日生直觉符号，毛巾与文本不贴 |
| toddler-603 看电视 | `3d-glasses` → `tv` | delapouite | 新文本核心物件=**电视机**（天线转着找台、雪花点、关电视缩成亮点）；3d-glasses 是眼镜，偏 |
| youth-602 健身房传单 | `basketball-ball` → `gym-bag` | delapouite | 新文本无篮球，核心=**健身房年卡传单**＋摸久坐的腰；gym-bag 直扣健身房场景 |

### 豁免 1 条（objectKey: null，卡片不配图）

| 事件 | 豁免理由 |
|---|---|
| infant-502 滑梯排队 | 核心情节=滑梯口被小孩堵住＋排队＋同病相怜的对视；`kid-slide` 已被 toddler-011（游乐场滑梯）占用（v3 零重复纪律），检索全量包无「排队/堵塞」贴切图——宁缺毋滥首例 |

### 保留中的隐喻成立项（注记，非直扣但题眼成立）

| 事件 | 图标 | 成立口径 |
|---|---|---|
| teen-006 旧书摊旅行笔记 | `hourglass` | 文本题眼「致三十年后的你——走了吗」=时间；旧书类图标已被四条占用 |
| childhood-004 两友闹掰各拉你 | `choice` | 站队抉择本体 |
| childhood-019 兴趣班试听 | `jigsaw-piece` | 为孩子拼上一块（围棋/奥数/门缝三种选择）；兴趣班本体无贴切图标 |
| adult-005 后浪新人 | `chess-pawn` | 棋子换位隐喻（沿 v3 注记）；新文本增「路标带人抄近路」意象亦通 |
| youth-019 三年规划时间轴 | `diagram` | PPT 时间轴=图表本体 |
| midlife-013 孙辈搅规矩 | `pinata` | 孩童闹翻天的意象（中文语境无皮纳塔实物，语义靠「彩罐打爆」弱通） |
| youth-503 婚礼伴郎 | `musical-notes` | 婚礼音乐意象（请柬/伴郎无贴切图标） |
| elder-402 铁盒旧物 | `love-song` | 粮票情书合照=旧日情意（铁盒/旧物无贴切图标） |

### 门与实现（同棒落地）

- **validate I 区扩展先行**（03 纪律：门先于内容）：I.SCHEMA 改断 `{objectKey:...}` 形状 → 旧平面对象格式验红（过渡态实测 1 FAIL）→ 数据迁移新格式 → 复绿。
- **UI 消费**：`src/ui/icons.ts` 导出 `objectKeyOf(id)`（null → 空串）；`app.ts` 卡片 iconName 走 objectKey；豁免条目卡片自然不渲染 `.ev-icon`（模板既有条件渲染，零改动）。
- **单测**：timeline.test 图标注册表 describe 4 条（形状全覆盖+URL 解析 / 豁免 ≤10% / objectKeyOf 回退 / 三资源图标在位）；vitest 280 → **282**。

## §二、小结场景配图 8 张（自产 CC0，逐张对文案）

> 素材：`assets/web-ready/stage-scenes/<stage>.svg`（2026-10-26 自产，AI 生成，项目以 CC0 释放；无第三方权利，credits 无新增署名）。单色剪影风与 Game-Icons 事件图标层同语言；fill 全走 CSS 变量（`--ink-2/3`、`--accent`、`--surface` + 米纸 fallback），四主题（米纸/月白/夜航/青瓷）随 `data-theme` 联动。渲染：`screens.ts` summaryScreen 主题头内联（`data-stage-scene`，role="img"），替换 v3 jellyfish 占位装饰。

| 阶段 | 场景构成 | 对文案（阶段意象锚） |
|---|---|---|
| infant 婴儿 | 摇篮＋上方悬挂转铃＋地面线 | 婴儿期事件群像：布偶铃/摇篮/分点心/初雪（摇篮与转铃是最高频物件锚） |
| toddler 幼儿 | 滑梯＋皮球＋风筝 | 沙池/滑梯/水坑/玩具争抢（游乐与玩具是本阶段主场景） |
| childhood 童年 | 书摞＋斜放铅笔＋纸飞机 | 上学/考试/书皮/纸条（书与铅笔是童年主线，纸飞机=天真的去处） |
| teen 少年 | 远山两层＋自行车 | 自行车上学/竞赛/志愿远行（车轮向着远山=少年把路骑向远处） |
| youth 青年 | 城市楼群＋窗灯＋朝阳 | 进城/合租/加班/抉择（天际线与朝阳=在大城市起步的年纪） |
| adult 壮年 | 房子＋两扇亮窗＋树＋小径 | 安家/育儿/陪护（亮窗的家与门前的树=壮年的根据地） |
| midlife 中年 | 层叠远山＋S 形山径＋长椅 | 转型/送别/环疆路书（山径通向没走过的路，长椅=歇下来回望） |
| elder 老年 | 沉入地平线的落日＋光晕＋摇椅＋茶杯＋飞鸟 | 退休/守候/告别（落日不是结束，摇椅边的热茶还冒气） |

体积：8 枚合计约 8.4KB（dist gzip 实测本棒总增量 **+2.42KB**：720.31KB ≤ 850KB 绿，远低于 60–100KB 预估——SVG 剪影比压缩 webp 位图省一个数量级）。

## §三、3.3 收尾复验与终检（2026-10-26）

- **主题×图谱联动**：`relations.ts` 图谱 SVG 节点底/文字由硬编码米纸色改 `var(--surface/--ink/--ink-2)` + 米纸 fallback（快照序列化自包含不破：独立查看回退米纸值）；tag 语义色四主题下保留固定。E2E 增断言：夜航下内联 SVG `var()` 解析为夜航值（node ≠ rgb(247,241,227)、text ≠ rgb(61,52,40)）。
- **分享卡画布**：v2 规格固定色板（canvas 不读 CSS 变量），四主题下导出同一张 1080×1440 PNG——复验口径=夜航下导出流程不炸（E2E 已有 shareBtn 在位 + 点击导出断言），画布配色不随主题是规格决定，留档不改。
- **开局图谱入口打磨**：`btn-family` 前置 family-tree 图标（mask+currentColor 随主题）+ aria-label；card/era/aftermath 三屏 topbar 一致在位（现状核实：三屏均渲染，本棒补图标与可访问性）。
- **README 增量**：v4-M3''' 行翻 ✅ + 特性段补主题/年代/家庭/配图要点（≤120 行门内）。
- **出口门终值**：（见下，出口门跑毕后填）

## §四、出口门终值（2026-10-26 实测）

- `npm run validate`：0 FAIL（I 区 243/243 + SVG 250 枚 + 豁免 1 ≤ 24；R 区照绿）
- `npm run validate:story`：243/243（本棒未动事件文本）
- `npm test`：**282/282**（280 + timeline 图标注册表净增 2）
- `npm run typecheck`：0 错
- `npm run e2e`：双端一键通关全绿 + 768 中档 + v4 自定义段（新断言：小结场景图在位 / 夜航内联 SVG var 解析非 fallback / 无图标卡 ≤ 豁免总数 1；沿有阶段条/五档词/主题切换/三观/年份推进；375/768/1280 三档截图重留痕）
- `npm run gate:license`：0 FAIL（git 跟踪图像 ⊆ 白名单；补采 4 枚 + 场景图 8 枚入既有前缀，白名单无需扩展）
- `npm run gate:layout` + `gate:desens`：全绿（437 文本文件 0 命中）
- `npm run gate:budget`：**720.36KB ≤ 850KB** 绿（较 M2''' 出口 717.89KB 增 +2.47KB gzip：8 张场景图内联 + objectKey 字符串 + 4 枚补采图标）
