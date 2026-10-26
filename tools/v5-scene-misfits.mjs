// 配图语义错配清单（单源）：哪些 objectKey **本身不是任何场景的物件**，因此不得出现在
// scene-map 的 keyTag 里。
//
// 为什么需要这份清单：`tools/v5-gen-scene-map.mjs` 段首自己写着纪律——
//   「objectKey → 标签。只收『图标本身就是这一类场景/场景里的核心物件』的键；
//     抽象图标（heart-* / choice / crossroad / despair / infinity…）**不硬凑**——它们不是场景。」
// v5-M5 运维首查实测该纪律被自家破了 38 键 / 52 条事件（17.6%）：「图上说的是别的事」——
// 卡片画着花圈/台灯/碗/书堆，配的却是情绪低落、公园晨练、庙会走丢、兔子。
//
// ── v5-M6 SI-001 修复（已执行，两种处置）──
//   一级 · 摘出（本清单保留的即这一批）：情绪/时间/氛围/社交/舞台类**抽象符号**——它们没有可归的场景，
//        从 keyTag 删除，事件转显式豁免（`hourglass` 虽是器物，但它承载的语义是「时间」，
//        与同批的情绪符号一类，一并摘出）。
//   二级 · 改挂（从本清单**移出**）：宠物（rabbit/cat/paw-print）、玩物（dinosaur-rex/jigsaw-*）、
//        影音（tv/pocket-radio/phone/tablet/…/photo-camera/film-spool）、器乐（guitar/piano-keys/
//        microphone/…）——它们是各自场景的**核心物件**，改挂新建的 `pet`/`toy`/`media`/`music` 四类；
//        另有 `tired-eye`→home、`caterpillar`/`star-formation`→outdoors。
//        原 `night`（夜色）/`meal`（饭桌）两类在摘出后事件归零 → 整类连同图稿退役（少事件必留死图）。
//   结果：keyTag 里的错配键 **38 → 0**；覆盖 253/295 = 85.8% → **239/295 = 81.0%**；豁免 42 → **56**。
//
// 消费者（两份，都从这里取，不许各写一遍）：
//   - `tools/v5-scene-audit.mjs`：只读报告（人读 / --json）
//   - `tests/scene-misfits.test.ts`：棘轮（任何一次把这些键加回 keyTag 就判红）
// 改本清单 = 改口径：新处置决策记在 plan/v5/backlog.md 的 SI-001 条目与 plan/v5/00 决策记录。

/** 危险清单（黑名单）：分组名（人读）→ 不得出现在 keyTag 里的 objectKey。 */
export const OFF_SCENE = {
  /** 情绪/关系符号：画出来是花圈/碎心，配的是「连续三周提不起劲」这类事件。 */
  "情绪·关系符号（原被塞进 funeral 丧事）": ["tear-tracks", "despair", "broken-heart", "shattered-heart", "two-shadows"],
  /** 时间符号：沙漏/日晷/日出表达「时间」，不是某个场所。 */
  "时间符号（原被塞进 funeral / night）": ["hourglass", "sunrise", "sundial"],
  /** 氛围符号：闪光表达气氛，不是场景本体。 */
  "氛围符号（原被塞进 night 夜色）": ["sparkles"],
  /** 社交符号：人形组/握手表达「关系」，不是饭桌本身。 */
  "社交符号（原被塞进 meal 饭桌）": ["meeple-group", "three-friends", "shaking-hands"],
  /** 舞台符号：戏剧面具属「舞台行当」，本图库无舞台类可归。 */
  "舞台符号（原被塞进 study 书桌）": ["drama-masks"],
};

/** 扁平清单（判据面：任一 objectKey ∈ 本集合 且出现在 keyTag = 语义错配）。 */
export const OFF_SCENE_KEYS = Object.values(OFF_SCENE).flat();

/**
 * v5-M6 修复留痕（不参与判据，只回答「这一批为什么不在黑名单里了」）：
 * 二级处置 = 改挂到新建语义类，而不是摘出——故这些键**可以**出现在 keyTag（指向新类）。
 */
export const OFF_SCENE_FIXED = {
  /** 一级：直接摘出（黑名单里这批就是它们）。 */
  tier1Removed: [...OFF_SCENE_KEYS],
  /** 二级：改挂到各自语义类（宠物/玩物/影音/器乐 + home/outdoors）。 */
  tier2Retargeted: {
    pet: ["rabbit", "cat", "paw-print"],
    toy: ["dinosaur-rex", "jigsaw-piece", "jigsaw-box", "puzzle", "gamepad"],
    media: [
      "tv",
      "pocket-radio",
      "boombox",
      "phone",
      "smartphone",
      "vibrating-smartphone",
      "tablet",
      "wifi-router",
      "photo-camera",
      "film-spool",
    ],
    music: ["musical-notes", "guitar", "piano-keys", "microphone", "old-microphone"],
    home: ["tired-eye"],
    outdoors: ["caterpillar", "star-formation"],
  },
  /** 因事件归零而退役的标签（图稿同笔删除）。 */
  retiredTags: ["night", "meal"],
  /** 修复后的实测值（与 `node tools/v5-scene-audit.mjs` 输出一致，写死在此只作留痕）。 */
  after: { misfitKeys: 0, misfitEvents: 0, coverage: "239/295 = 81.0%", exempt: 56, images: "55 张 / 21 类" },
};