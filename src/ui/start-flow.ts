// 开局四步状态机（口径单源 plan/v5/02 §五）：选玩法 → 填要素 → 出生证明 → 入场。
// 纯函数、零 DOM：四步推进、回退保值、随机态「再来一次」全部由本档派生（UI 只渲染 draft），
// 因此「回退后重进值仍在」是可单测的性质，不是 DOM 残留的巧合。
// 出生派生链一律复用引擎导出（randomBirth / deriveBirth / envFromBirth），本档不复写概率表与槽位表。
import { deriveBirth, envFromBirth, randomBirth } from "../engine/engine";
import { familySlotRole, generateFamily } from "../engine/family";
import { seedCodeOf } from "../engine/seedcode";
import type { BirthEnv, BirthProfile } from "../engine/model";

export type StartMode = "random" | "manual" | "custom";

/** 四步编号（进度指示 1/4–4/4 的唯一来源）。 */
export type StartStep = 1 | 2 | 3 | 4;
export const START_STEP_COUNT = 4;

/** 玩法三选一（顺序 = 首屏三张大按钮的显示序）。 */
export const START_MODES: readonly StartMode[] = ["random", "manual", "custom"];

export const START_MODE_META: Record<StartMode, { label: string; note: string }> = {
  random: { label: "随机出生", note: "出生年、南北、城乡、家庭结构、父母职业、家境——全部交给种子" },
  manual: { label: "手选环境", note: "你挑年代、城乡、家庭氛围与教养方式，其余按年代概率派生" },
  custom: { label: "自定义八因素", note: "出生年、南北、城乡、家庭结构、父母职业与家境，逐项由你定" },
};

/** 自定义路径的已填值（回退不丢：值存在 draft 里，不依赖 DOM）。 */
export interface CustomBirth {
  birthYear: number;
  place: string;
  profile: BirthProfile;
}

/** 出生证明卡的视图模型（八因素 + 家庭成员 + 种子码）。 */
export interface StartCert {
  seed: number;
  seedCode: string;
  env: BirthEnv;
  birthYear: number;
  profile: BirthProfile;
  /** 家庭成员逐位（生成器输出；与 createRun 同一函数、同一 seed ⇒ 同名单）。 */
  family: Array<{ slot: string; role: string; name: string }>;
  /** 随机态（随机/手选）可「再来一次」；自定义态的因素是玩家填的，重掷只换种子。 */
  rerollable: boolean;
}

export interface StartDraft {
  step: StartStep;
  mode: StartMode | null;
  /** 手选四要素的已填值（回退不丢）。 */
  manualEnv: BirthEnv | null;
  /** 自定义路径的已填值（回退不丢）。 */
  customBirth: CustomBirth | null;
  /**
   * 年份尺点选的出生年（v5 界面改造的快捷入口）：非 null 时随机路径锁定该年，
   * 「再来一次」只换种子不换年——玩家点了哪一年，就是那一年。
   */
  pinnedYear: number | null;
  /** 出生证明（step 3 及其后的唯一事实源）。 */
  cert: StartCert | null;
}

export function initialDraft(): StartDraft {
  return { step: 1, mode: null, manualEnv: null, customBirth: null, pinnedYear: null, cert: null };
}

/** 出生证明：家庭成员走 generateFamily（与引擎同源），role 取槽位表（禁泛称）。 */
export function certOf(input: {
  seed: number;
  env: BirthEnv;
  birthYear: number;
  profile: BirthProfile;
  rerollable: boolean;
}): StartCert {
  const family = generateFamily(input.env, input.birthYear, input.profile, input.seed).map((npc) => ({
    slot: npc.slot ?? "",
    role: familySlotRole(npc.slot) ?? "家人",
    name: npc.name ?? "",
  }));
  return {
    seed: input.seed,
    seedCode: seedCodeOf(input.seed),
    env: { ...input.env },
    birthYear: input.birthYear,
    profile: { ...input.profile },
    family,
    rerollable: input.rerollable,
  };
}

/** step 1 → step 2：选玩法。已填值保留（来回切换不丢），但上一份出生证明作废。 */
export function chooseMode(draft: StartDraft, mode: StartMode): StartDraft {
  return { ...draft, step: 2, mode, cert: null };
}

/**
 * 回退一步（step 1 原地不动）。
 * - step 4 → 3：出生证明仍在（回到证上看一眼再决定）；
 * - step 3 → 2：证明作废（要改要素了，旧证留着只会与表单不一致）；
 * - 已填值（manualEnv / customBirth）任何回退都保留——这就是「回退不丢值」。
 */
export function back(draft: StartDraft): StartDraft {
  if (draft.step === 1) return draft;
  if (draft.step === 2) return { ...draft, step: 1 };
  if (draft.step === 3) return { ...draft, step: 2, cert: null };
  return { ...draft, step: 3 };
}

/** 手选路径：记下四要素（表单提交时调用；回退重进时按它回填选中态）。 */
export function withManualEnv(draft: StartDraft, env: BirthEnv): StartDraft {
  return { ...draft, manualEnv: { ...env } };
}

/** 自定义路径：记下八因素里的玩家可填项。 */
export function withCustomBirth(draft: StartDraft, birth: CustomBirth): StartDraft {
  return { ...draft, customBirth: { ...birth, profile: { ...birth.profile } } };
}

/**
 * step 2 → step 3：按玩法派生出生并生成出生证明。
 * 随机 = 种子定全部（点了年份尺则锁定那年）；手选 = 玩家 env + 种子派生年/画像；
 * 自定义 = 玩家填的因素直接成证。派生出错（枚举越界等）向上抛，由 UI 转成人话提示（不静默）。
 */
export function preview(draft: StartDraft, seed: number): StartDraft {
  if (!draft.mode) throw new Error("preview：还没选玩法");
  if (!Number.isInteger(seed) || seed < 0) throw new Error(`preview：种子越界 ${seed}`);
  if (draft.mode === "random") {
    const born = randomBirth(seed);
    // 年份尺点过的年份优先（v5 界面改造：同一年 + 同一种子 = 同一副牌）
    const birthYear = draft.pinnedYear ?? born.birthYear;
    const env = draft.pinnedYear === null ? born.env : envFromBirth(birthYear, born.profile, born.env.place);
    return {
      ...draft,
      step: 3,
      cert: certOf({ seed, env, birthYear, profile: born.profile, rerollable: true }),
    };
  }
  if (draft.mode === "manual") {
    const env = draft.manualEnv;
    if (!env) throw new Error("preview：手选路径缺四要素");
    const { birthYear, profile } = deriveBirth(env, seed);
    return { ...draft, step: 3, cert: certOf({ seed, env, birthYear, profile, rerollable: true }) };
  }
  const custom = draft.customBirth;
  if (!custom) throw new Error("preview：自定义路径缺八因素");
  const env = envFromBirth(custom.birthYear, custom.profile, custom.place);
  return {
    ...draft,
    step: 3,
    cert: certOf({
      seed,
      env,
      birthYear: custom.birthYear,
      profile: custom.profile,
      rerollable: false,
    }),
  };
}

/** 年份尺点选：锁定出生年 + 走随机路径 → 直接出出生证明（quick 入口，少两步）。 */
export function previewYear(draft: StartDraft, seed: number, birthYear: number): StartDraft {
  const pinned: StartDraft = { ...draft, mode: "random", pinnedYear: birthYear };
  return preview(pinned, seed);
}

/** step 3「再来一次」：换种子重派（自定义态不换已填因素；年份尺锁定的年份不变）。 */
export function reroll(draft: StartDraft, seed: number): StartDraft {
  if (!draft.cert) return draft;
  return preview(draft, seed);
}

/** step 3 → step 4：用这份出生证明。 */
export function useCert(draft: StartDraft): StartDraft {
  if (!draft.cert) return draft;
  return { ...draft, step: 4 };
}

/** step 4 的入场四件套（createRun 的入参；同构于 createRun(env, seed, {birthYear, profile})）。 */
export function startInput(draft: StartDraft): {
  env: BirthEnv;
  seed: number;
  birthYear: number;
  profile: BirthProfile;
} {
  const cert = draft.cert;
  if (!cert) throw new Error("startInput：还没有出生证明");
  return { env: cert.env, seed: cert.seed, birthYear: cert.birthYear, profile: cert.profile };
}

/** 入场白（step 4 的一句话）：只复述证上已有的八因素，不新增叙事内容。 */
export function openingLineOf(cert: StartCert): string {
  const who = cert.family.length > 0 ? `家里 ${cert.family.length} 个人，在等这个孩子。` : "这个家里，只有你。";
  return `${cert.birthYear} 年，${cert.profile.region}的${cert.env.place}。${cert.profile.structure}家庭，父母${cert.profile.parentsJob}，家境${cert.profile.wealth}。${who}`;
}
