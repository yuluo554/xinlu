# Game-Icons 事件图标层 · 溯源与许可（v3-M2'' 2.1 采集）

> 采集日期：2026-10-24。上游：[game-icons.net](https://game-icons.net)（图标集 CC-BY 3.0 为主，个别作者 CC0，见 `LICENSE-game-icons.txt`）。
> 下载方式：官方全量包 `https://game-icons.net/archives/000000/transparent/game-icons.net.svg.zip`（4,168,300 字节，黑图透明底，直连一次成功，未用镜像）。
> 本目录是**原始 SVG 原样入库**（未做任何路径/精度/元数据改写——官方包本身即最小化产物，实测无 metadata 块可剥）；文件按 `icons/<作者>/<图标名>.svg` 存放，作者目录即 CC-BY 署名单位。

## 选取口径（plan/v3/02 §九）

- 每事件 1 枚主题图标；`src/data/icon-map.json` 是「图标名 ↔ 事件 id」对照表单源（175 条全库覆盖，validate 数据门断言）；
- 「图说的是不是这件事」逐张对文案清单：[../../docs/v3-M2-icons.md](../../docs/v3-M2-icons.md)（含文案摘录 + 评审门抽验记录）；
- 175 枚零重复使用；作者分布：lorc / delapouite / caro-asercion / lord-berandas / sbed / seregacthtuf / skoll / various-artists / willdabeast（全部 CC-BY 3.0，无 CC0 作者件）。

## 署名（随分发，public/credits.md 已含同句）

```text
Icons made by Lorc, Delapouite and contributors (game-icons.net, CC-BY 3.0)
```

逐张作者归属以本目录路径 + docs/v3-M2-icons.md 对照表为准；上游 license.txt 原文随附（`LICENSE-game-icons.txt`）。

## 体积口径

175 枚原始合计约 260KB（vite 构建时随 assetsInlineLimit 内联或散文件进 dist，gzip 后约 130–150KB，占 v3 预算线的增量大头——预算线口径见 plan/v3/02 §九 ▸ M2'' 增补）。
