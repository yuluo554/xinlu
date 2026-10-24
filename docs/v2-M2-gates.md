# v2-M2' 门禁变异自检留痕(2026-10-24)

> v2/04 出口门要求:许可门(提前交付)与数据门映射校验各自做"改坏必红 → 复原绿"变异自检并留痕。本文档为实测输出摘录。

## 一、素材许可门 `tools/check-assets-license.mjs`(npm run gate:license)

判据源:plan/v2/02 §六(白名单 ⊆、❌ 层双向排除、credits 署名行)。基线:0 FAIL 全绿(git 跟踪图像 135 件 ⊆ 白名单;dist 图像 20 件全部溯源;credits 4 条署名在位)。

### 变异 1:白名单外图像混入 git 跟踪 → 必红

```text
$ echo "rogue" > assets/rogue-variant.webp && git add assets/rogue-variant.webp
$ node tools/check-assets-license.mjs
FAIL  git 跟踪图像不在白名单:assets/rogue-variant.webp
结论: 1 项 FAIL            # 退出码 1
$ git rm --cached assets/rogue-variant.webp && rm assets/rogue-variant.webp
$ node tools/check-assets-license.mjs
结论: 0 FAIL,许可门全绿    # 复原绿
```

### 变异 2:credits 署名行缺失 → 必红

```text
$ sed -i '/YunYueSama/d' public/credits.md
$ node tools/check-assets-license.mjs
FAIL  credits 缺必需署名行:「YunYueSama/codex-deepseek-pet」
FAIL  credits 缺必需署名行:「1190fasheqi/dafeiyu-pet」
结论: 2 项 FAIL
$ cp $TMPDIR 备份复原
$ node tools/check-assets-license.mjs
结论: 0 FAIL,许可门全绿
```

## 二、数据门映射校验 `npm run validate`(validate-data.mjs M 区,v2/02 §二判据)

判据源:plan/v2/02 §二点名三项——覆盖 19/19、类别枚举合法、终局 9 张不重复;帧名清单扫 `assets/dafeiyu/fish/` 编号表情(不复写第二份清单)。基线:6 区全绿(M 区:覆盖 19/19 帧 + 终局锁 9 张)。

### 变异 1:删一条终局映射(end-05)→ 必红

```text
FAIL  fish-mood-map 覆盖 19/19 帧 + 终局锁 8 张:…(v2/02 §二)
FAIL  [M.ENDING] ending 键与 endings.json id 全集不一致:end-01,end-02,end-03,end-04,end-06,end-07,end-08,end-fallback
结论: 1 项 FAIL
```

### 变异 2:删一条帧登记(frames."06",仍被 stage/choice 引用)→ 必红

```text
FAIL  fish-mood-map 覆盖 18/19 帧 + 终局锁 9 张:…(v2/02 §二)
FAIL  [M.REF] 映射引用了未登记帧「06」
FAIL  [M.COVER] 映射表缺帧:06(覆盖 18/19)
结论: 2 项 FAIL
```

### 复原

```text
$ cp $TMPDIR/fish-mood-map.bak src/data/fish-mood-map.json
$ npm run validate
结论: 0 FAIL,数据门全绿
```

## 三、评审门(强核查):02 §一参数表 ↔ fish.ts 实现 ↔ 单测三方一致

逐参数核对(2026-10-24,v2-M2' 收尾):

| 02 §一 口径行 | fish.ts 实现 | 单测断言值 |
|---|---|---|
| activity = ei 线性(0→0,100→1) | `activity = ei / 100`(sanitize 后) | ei∈{0,50,100} → activity∈{0,0.5,1} |
| idle 间隔 = 1600 − activity×1000 | `idleIntervalMs: 1600 - activity * 1000` | 1600/1100/600 |
| 位移幅度 = 4 + activity×12 | `moveAmplitude: 4 + activity * 12` | 4/10/16 |
| mood 三段:<40 思 / 40–60 中 / >60 暖 | `tf < 40 ? "thoughtful" : tf > 60 ? "warm" : "neutral"` | 39→thoughtful、40/60→neutral、61→warm |
| 氛围层:sn<50 显示 / sn≥50 隐藏 | `visible: sn < 50` | 0/49→true、50/100→false |
| 饱和度 = 0.7 + sn/100 | `saturation: 0.7 + sn / 100` | 0.7/1.19/1.2/1.7 |
| 鱼群 = round(2 + (100−sn)/25) | `school: Math.round(2 + (100 - sn) / 25)` | 6/4(sn=49)/4(sn=50)/2 |
| 圆角 = 20 − jp×0.12 | `radius: 20 - jp * 0.12` | 20/14/8 |
| 栅格间距 = 8 + jp×0.16 | `gap: 8 + jp * 0.16` | 8/16/24 |
| NaN/越界 → 中位 50 参数集(沿用 sanitize 纪律) | 逐维 `sanitize()`(非有限→50、越界钳制) | 全 NaN → 全等中位参数集;999/−20/undefined → 钳制+回落 |
| 无 16 型字面量分支(K) | fish.ts 无任何型分支 | grep 测试 16 型词零命中 |

结论:三方一致,无第二表述。02 §二「帧位由映射表锁定」在 choice/stage/ending 三类的落点:choice = `pickChoiceFrame`(dir 同向 + seg 优先 + 种子取模)、stage/ending = 锁表直读,均以 `fish-mood-map.json` 为唯一数据源。
