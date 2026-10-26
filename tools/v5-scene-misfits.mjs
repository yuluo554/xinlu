// 配图语义错配清单（单源）：哪些「图标本身不是场景」的 objectKey 被映射进了 scene-map 的 keyTag。
//
// 为什么需要这份清单：`tools/v5-gen-scene-map.mjs` 段首自己写着纪律——
//   「objectKey → 标签。只收『图标本身就是这一类场景/场景里的核心物件』的键；
//     抽象图标（heart-* / choice / crossroad / despair / infinity…）**不硬凑**——它们不是场景。」
// 实测该纪律被自家破了 35 处：情绪图标落进 `funeral`（丧事）、时间图标落进 `night`（夜色）、
// 社交图标落进 `meal`（饭桌）、宠物/乐器/电子/娱乐图标落进 `study`（书桌）。
// 结果就是「图上说的是别的事」——卡片画着花圈/台灯/碗/书堆，配的却是月考压力、公园晨练、庙会走丢、兔子。
//
// 消费者（两份，都从这里取，不许各写一遍）：
//   - `tools/v5-scene-audit.mjs`：只读报告（人读 / --json）
//   - `tools/v5-scenes-doc.mjs`：生成 docs/v5-scenes.md 时把错配数写进留痕
// 改本清单 = 改口径：处置决策（摘出/保留/补图）记在 plan/v5/backlog.md SI-001。

/** 分组名（人读用）→ 误映射的 objectKey 清单。 */
export const OFF_SCENE = {
  /** 情绪/时间图标被塞进 funeral（丧事）：画出来是花圈，配的是情绪低落事件。 */
  "funeral（丧事）← 情绪/时间图标": [
    "tear-tracks",
    "despair",
    "broken-heart",
    "shattered-heart",
    "two-shadows",
    "hourglass",
  ],
  /** 昼夜图标被塞进 night（夜色）：画出来是台灯，配的是结婚纪念/公园晨练。 */
  "night（夜色）← 时间/氛围图标": ["sunrise", "sundial", "sparkles", "star-formation"],
  /** 社交图标被塞进 meal（饭桌）：画出来是碗，配的是庙会走丢/抢玩具。 */
  "meal（饭桌）← 社交图标": ["meeple-group", "three-friends", "shaking-hands"],
  /** 宠物/玩具/乐器/电子/娱乐图标被塞进 study（书桌）：画出来是台灯书堆，配的是兔子/恐龙/电子琴/电视。 */
  "study（书桌）← 宠物/玩具/乐器/电子/娱乐图标": [
    "rabbit",
    "cat",
    "paw-print",
    "caterpillar",
    "dinosaur-rex",
    "jigsaw-piece",
    "jigsaw-box",
    "puzzle",
    "gamepad",
    "tv",
    "phone",
    "smartphone",
    "vibrating-smartphone",
    "tablet",
    "wifi-router",
    "pocket-radio",
    "boombox",
    "musical-notes",
    "guitar",
    "piano-keys",
    "microphone",
    "old-microphone",
    "drama-masks",
    "photo-camera",
    "film-spool",
  ],
};

/** 扁平清单（判据面：任一 objectKey ∈ 本集合 = 语义错配）。 */
export const OFF_SCENE_KEYS = Object.values(OFF_SCENE).flat();

/**
 * 分级处置（摘出会让覆盖率掉档，故分两级；数字由 audit 实算，此处只登记口径）：
 *   一级 = funeral / night / meal 三组（14 条事件）：这三类场景图「画的是事件的反面」，
 *          摘出后覆盖率仍 81.0% ≥ 60% 门，且不留误导。
 *   二级 = study 的宠物/乐器/电子组（38 条事件）：误配程度更温和（同为「室内日常」），
 *          全摘覆盖率降到 68.1%，仍过门；更优解是给这批补 3–5 张同标签新图（`home`/`outdoors` 复用即可）。
 */
export const OFF_SCENE_TIER = {
  tier1: ["funeral（丧事）← 情绪/时间图标", "night（夜色）← 时间/氛围图标", "meal（饭桌）← 社交图标"],
  tier2: ["study（书桌）← 宠物/玩具/乐器/电子/娱乐图标"],
};
