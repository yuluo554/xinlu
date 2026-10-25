// 出生家庭生成器（plan/v4/02 §三 ▸ M1''' 增补；构成/概率/bond 表单源该节）。
// 纯函数、零 DOM、零存储、零过网；seed 确定性——同 (env, birthYear, profile, seed) 必得同一家庭。
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

/** 家庭 NPC 槽位 id（npcs.json 注册槽，line 全 fate）。 */
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

/**
 * 姓名包：南北名池按 profile.region 取；同局全名去重；姓重复不占池（同姓常见）。
 * draw 序 10 起顺延（0–8 为 env/birthYear/profile 派生，见 plan/v4/02 §一 ▸ M1''' 增补）。
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

/**
 * 出生家庭生成（构成与 bond 口径见 plan/v4/02 §三 ▸ M1''' 增补）：
 * 父母 2（单亲仅 mother，bond +5 相依为命）；祖辈 0–2（隔代必 2）；同辈 独生 0 / 双孩 1 / 多孩 2–3 / 单亲与隔代 0–2。
 * 结构性 draw 用固定序号 30–35，与姓名 draw（10+）互不干扰。
 */
export function generateFamily(
  env: BirthEnv,
  birthYear: number,
  profile: BirthProfile,
  seed: number,
): NpcState[] {
  void birthYear; // 预留位：bond 口径表暂不按年代分档（02 §三 ▸ M1''' 增补未引入年代维度）
  const bag = new NameBag(profile.region, seed);
  const familySurname = bag.surname();
  const out: NpcState[] = [];
  const push = (id: string, bond: number, gender: "男" | "女", shareSurname: boolean): void => {
    const surname = shareSurname ? familySurname : bag.surname();
    out.push({ id, bond, tag: tagOfBond(bond), name: bag.fullName(surname, gender) });
  };

  const singleParent = profile.structure === "单亲";
  const parentBond = PARENT_BOND[env.mood]?.[env.style] ?? 70;
  push(FAMILY_SLOTS.mother, singleParent ? Math.min(100, parentBond + 5) : parentBond, "女", false);
  if (!singleParent) {
    push(FAMILY_SLOTS.father, parentBond, "男", true);
  }

  // 祖辈：隔代必 2（bond 75）；否则 0–2（bond 60）
  const grandCount = profile.structure === "隔代" ? 2 : Math.floor(seededDraw(seed, 30) * 3) % 3;
  const grandBond =
    profile.structure === "隔代" ? GRANDPARENT_BOND.raised : GRANDPARENT_BOND.present;
  if (grandCount >= 1) push(FAMILY_SLOTS.grandma, grandBond, "女", false);
  if (grandCount >= 2) push(FAMILY_SLOTS.grandpa, grandBond, "男", true);

  // 同辈：独生 0 / 双孩 1 / 多孩 2–3 / 单亲与隔代 0–2
  let siblingCount: number;
  if (profile.structure === "独生") siblingCount = 0;
  else if (profile.structure === "双孩") siblingCount = 1;
  else if (profile.structure === "多孩") siblingCount = 2 + (seededDraw(seed, 31) < 0.5 ? 0 : 1);
  else siblingCount = Math.floor(seededDraw(seed, 32) * 3) % 3;
  for (let i = 0; i < siblingCount && i < FAMILY_SLOTS.siblings.length; i++) {
    const gender: "男" | "女" = seededDraw(seed, 33 + i) < 0.5 ? "男" : "女";
    push(FAMILY_SLOTS.siblings[i]!, SIBLING_BOND, gender, true);
  }
  return out;
}
