# 数据台账（data/）

> 本目录承载游戏数据文件的台账与依据查证记录。**全部数值口径唯一存放于 [plan/02-数据与口径.md](../plan/02-数据与口径.md)**——本目录与数据文件只携带数值、不复写口径文字；发现第二份表述 = 缺陷。

## 口径来源

| 数据 | 来源 | 说明 |
|---|---|---|
| 事件库 / birth-map / endings / portraits | 全部原创撰写（M1–M4） | 不引用、不冒充任何来源；不引入真实人物与品牌事件 |
| 四维口径 / 密度口径 / 偏移口径 | plan/02（单一定义源） | 引擎只实现口径、不再表述口径 |
| 存档 schema | plan/02 §六 | localStorage key `xinlu.save.v1`，版本化 + 迁移 |

## 依据查证记录（三态：✅ 已核对原文并留渠道 ｜ ⬜ 待核对 ｜ 🟡 部分核对）

| 依据 | 来源 | 查证状态 | 渠道/快照 |
|---|---|---|---|
| MBTI 四维（E-I / S-N / T-F / J-P）公开定义 | 16personalities、Myers-Briggs 官网等公开资料 | ✅ 已核对（2026-10-24） | 英文维基百科 Myers–Briggs Type Indicator 条目（引注官方文献：MBTI Manual 3rd ed. / Myers & Myers《Gifts Differing》/ Myers & Briggs Foundation「MBTI Basics」）：四维 = introversion/extraversion、sensing/intuition、thinking/feeling、judging/perceiving，各取一偏好组合成 16 型。官网 myersbriggs.org 直读被拒（403）、16personalities 理论页为脚本渲染无法直读正文，故经上述引注链核对；另记：16personalities 实际采用 Mind/Energy/Nature/Tactics(+Identity) 自有命名，本作采用经典四维命名 |
| 品类需求真实性（人生重开模拟器传播度） | GitHub / 新闻报道 | ✅ 已核对（2026-10-24） | 检索式「人生重开模拟器 github lifeRestart」（2026-10-24）：原版 VickScarlet/lifeRestart（2021 年登 GitHub Trending，cnblogs「GitHub 热点速览 v.21.36」有存档记录）及多个派生仓库（LastHeaven/lifeRestart、nex-world/lifeRestart-AI、Clouds-Heath/PM-life-restart、EmbraceAGI/LifeReloaded 等）——品类传播度有实证 |
| 开源空白（人格演化向人生模拟） | GitHub 检索（**软论据**，不作硬锚点） | 🟡 部分核对（2026-10-24） | 检索式「github 开源 人生模拟 MBTI 人格演化 游戏」+ GitHub 站内「personality evolution life simulator MBTI game engine」：最近邻为 agent-topia/evolving_personality（LLM 智能体人格演化框架，非人生模拟游戏）与属性制人生重开（lifeRestart / LifeReloaded）；未见「确定性引擎 + 四维连续演化 + 人生模拟」同款。否定性结论无法穷尽验证 → 保持 🟡，仅作软论据 |

## 数值口径

- 事件密度：每阶段 main 4–6 / context ≥8 / critical ≥2（单处定义 plan/02 §二）；
- 选项偏移：常规 |Δ| ≤ 3，重大 |Δ| ≤ 8；
- 结局 ≥ 8 且含兜底；MBTI 16 型画像全覆盖（封闭枚举）；
- 实际总数于 M4 末态回填 plan/00 台账，README 数字与 `npm run validate --count` 输出对账。
