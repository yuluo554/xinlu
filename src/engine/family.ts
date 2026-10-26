// 出生家庭生成器（plan/v4/02 §三 ▸ M1''' 增补；v5 重构：按槽生成，口径单源 plan/v5/02 §一）。
// 纯函数、零 DOM、零存储、零过网；seed 确定性——同 (env, birthYear, profile, seed) 必得同一家庭。
// 槽位表（封闭枚举 / role / 结构↔槽合法组合 / 南北祖辈侧）唯一来源 = src/data/family-slots.json；
// 本档只按表出牌，不得内联第二份槽位或组合表（validate F 区守门）。
import familySlotsRaw from "../data/family-slots.json" with { type: "json" };
import namesRaw from "../data/names.json" with { type: "json" };
import { seededDraw } from "./engine.ts";
import { tagOfBond } from "./values.ts";
import type { BirthEnv, BirthProfile, NpcState } from "./model.ts";

type NamePool = {
  "姓": string[];
  南方: { 男: string[]; 女: string[] };
  北方: { 男: string[]; 女: string[] };
};
const NAMES = namesRaw as unknown as NamePool;

/** 槽位表形状（family-slots.json）。 */
export interface FamilySlotDef {
  role: string;
  group: "parent" | "grandparent" | "sibling";
}
export interface FamilyStructureRule {
  /** 父母人数：定值或 [下限, 上限]（隔代 0–1）。 */
  parents: number | [number, number];
  grandparents: [number, number];
  siblings: [number, number];
  /** 同辈里年长的位数（双孩/多孩 = 1，其余 0）。 */
  olderSiblings: number;
}
interface FamilySlotsFile {
  slots: Record<string, FamilySlotDef>;
  structures: Record<string, FamilyStructureRule>;
  groups: Record<string, "parent" | "grandparent" | "sibling">;
  grandparentSide: Record<string, "paternal" | "maternal">;
}
const TABLE = familySlotsRaw as unknown as FamilySlotsFile;

/** 槽位封闭枚举（validate F 区与图谱标签共读）。 */
export const FAMILY_SLOT_TABLE = TABLE;

/** 家庭 NPC 注册槽 id（npcs.json 注册键，line 全 fate）；槽位细分由 NpcState.slot 承载。 */
export const FAMILY_SLOTS = {
  mother: "mother",
  father: "father",
  grandma: "grandma",
  grandpa: "grandpa",
  siblings: ["sibling-1", "sibling-2", "sibling-3"],
} as const;

/** 父母初始 bond 派生表（mood × style，单源 plan/v4/02 §三 ▸ M1''' 增补）。 */
const PARENT_BOND: Record<string, Record<string, number>> = {
  和睦: { 宽容: 80, 权威: 72, 忽视: 62 },
  紧张: { 宽容: 65, 权威: 55, 忽视: 50 },
  疏离: { 宽容: 48, 权威: 45, 忽视: 40 },
  单亲: { 宽容: 75, 权威: 65, 忽视: 55 },
};
/** 祖辈初始 bond：隔代抚养 75（朝夕相处），一般在世 60。 */
export const GRANDPARENT_BOND = { raised: 75, present: 60 } as const;
/** 同辈初始 bond。 */
export const SIBLING_BOND = 65;

/** 槽位 → 显示身份（图谱标签唯一出口；未登记槽返回 undefined，调用方回落注册表 role）。 */
export function familySlotRole(slot: string | undefined): string | undefined {
  return slot ? TABLE.slots[slot]?.role : undefined;
}

/**
 * 姓名包：南北名池按 profile.region 取；同局全名去重；姓重复不占池（同姓常见）。
 * draw 序 10 起顺延（0–8 为 env/birthYear/profile 派生，30–35 为结构性抽取，见 plan/v4/02 §一 ▸ M1''' 增补）。
 */
class NameBag {
  private used = new Set<string>();
  private counter = 10;
  private readonly region: "南方" | "北方";
  private readonly seed: number;
  constructor(region: "南方" | "北方", seed: number) {
    this.region = region;
    this.seed = seed;
  }
  private draw(): number {
    return seededDraw(this.seed, this.counter++);
  }
  private pick(pool: readonly string[]): string {
    return pool[Math.floor(this.draw() * pool.length) % pool.length]!;
  }
  surname(): string {
    return this.pick(NAMES["姓"]);
  }
  fullName(surname: string, gender: "男" | "女"): string {
    const pool = NAMES[this.region][gender];
    for (let tries = 0; tries < pool.length; tries++) {
      const full = surname + this.pick(pool);
      if (!this.used.has(full)) {
        this.used.add(full);
        return full;
      }
    }
    // 名池抽干兜底：拼序号（家庭上限 8 人 < 名池 20，正常不可达，防数据缺陷死循环）
    const fallback = surname + pool[0]! + this.used.size;
    this.used.add(fallback);
    return fallback;
  }
}

/** 区间/定值 → 人数（r ∈ [0,1)，闭区间均匀取整）。 */
function countOf(range: number | [number, number], r: number): number {
  const [low, high] = typeof range === "number" ? [range, range] : range;
  if (high <= low) return low;
  return low + (Math.floor(r * (high - low + 1)) % (high - low + 1));
}

/**
 * 出生家庭生成（构成与 bond 口径见 plan/v5/02 §一 / plan/v4/02 §三 ▸ M1''' 增补）：
 * 父母按结构（单亲 1 位、隔代 0–1 位、其余 2 位，单亲位由 draw 32 定父或母）；
 * 祖辈按结构区间，侧系由 profile.region 派生（南方=外公外婆 / 北方=祖父祖母）；
 * 同辈按结构区间，年长位由 gender draw 定兄或姐，其余为弟或妹。
 * 结构性 draw 用固定序号 30–35，与姓名 draw（10+）互不干扰。
 */
export function generateFamily(
  env: BirthEnv,
  birthYear: number,
  profile: BirthProfile,
  seed: number,
): NpcState[] {
  void birthYear; // 预留位：bond 口径表暂不按年代分档（02 §三 ▸ M1''' 增补未引入年代维度）
  const rule = TABLE.structures[profile.structure];
  if (!rule) throw new Error(`generateFamily：未知家庭结构「${profile.structure}」（family-slots.json 缺行）`);
  const bag = new NameBag(profile.region, seed);
  const familySurname = bag.surname();
  const out: NpcState[] = [];
  const push = (
    id: string,
    slot: string,
    bond: number,
    gender: "男" | "女",
    shareSurname: boolean,
  ): void => {
    const surname = shareSurname ? familySurname : bag.surname();
    out.push({ id, slot, bond, tag: tagOfBond(bond), name: bag.fullName(surname, gender) });
  };

  const parentBond = PARENT_BOND[env.mood]?.[env.style] ?? 70;
  const parentCount = countOf(rule.parents, seededDraw(seed, 32));
  // 单亲/隔代可能只有一位家长：由 draw 36 定父或母（两位家长恒父+母）。
  const onlyFather = parentCount === 1 && seededDraw(seed, 36) < 0.5;
  if (parentCount >= 2) {
    push(FAMILY_SLOTS.mother, "parent-mother", parentBond, "女", false);
    push(FAMILY_SLOTS.father, "parent-father", parentBond, "男", true);
  } else if (parentCount === 1 && onlyFather) {
    push(FAMILY_SLOTS.father, "parent-father", Math.min(100, parentBond + 5), "男", true);
  } else if (parentCount === 1) {
    // 独力抚养：bond +5 相依为命（沿 v4 口径）
    push(FAMILY_SLOTS.mother, "parent-mother", Math.min(100, parentBond + 5), "女", false);
  }

  // 祖辈：侧系由 region 派生；隔代 bond 75（朝夕相处），否则 60（在世）
  const side = TABLE.grandparentSide[profile.region] ?? "paternal";
  const grandPrefix = side === "maternal" ? "gp-maternal" : "gp-paternal";
  const grandCount = countOf(rule.grandparents, seededDraw(seed, 30));
  const grandBond =
    profile.structure === "隔代" ? GRANDPARENT_BOND.raised : GRANDPARENT_BOND.present;
  if (grandCount >= 1) push(FAMILY_SLOTS.grandma, `${grandPrefix}-grandma`, grandBond, "女", false);
  if (grandCount >= 2) push(FAMILY_SLOTS.grandpa, `${grandPrefix}-grandpa`, grandBond, "男", true);

  // 同辈：年长位（哥哥/姐姐）在前，其余为弟弟/妹妹。
  // 槽位唯一约束（plan/v5/02 §一）反推性别派生：年幼位 ≥2 时必须一男一女——
  // 否则两人同为弟弟（或妹妹）会撞同一封闭槽位。年长位与年幼位槽不重叠，不受此限。
  const siblingCount = Math.min(
    countOf(rule.siblings, seededDraw(seed, 31)),
    FAMILY_SLOTS.siblings.length,
  );
  const youngerCount = Math.max(0, siblingCount - rule.olderSiblings);
  let prevYoungerMale: boolean | undefined;
  for (let i = 0; i < siblingCount; i++) {
    const older = i < rule.olderSiblings;
    let male = seededDraw(seed, 33 + i) < 0.5;
    if (!older) {
      // 年幼位第二位强制与第一位异性（恰好两人的情形；三人同辈只有两位年幼）
      if (youngerCount >= 2 && prevYoungerMale !== undefined) male = !prevYoungerMale;
      prevYoungerMale = male;
    }
    const slot = older
      ? male
        ? "sib-older-brother"
        : "sib-older-sister"
      : male
        ? "sib-younger-brother"
        : "sib-younger-sister";
    push(FAMILY_SLOTS.siblings[i]!, slot, SIBLING_BOND, male ? "男" : "女", true);
  }
  return out;
}
