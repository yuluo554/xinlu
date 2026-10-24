// 三观中间层与 v3 状态层纯函数（plan/v3/03 §1 契约、plan/v3/02 §二/三/四）。
// 本文件是判定核心的一部分：零 DOM、零存储、零过网（fetch 禁入 engine/，grep 守护）。
import stageDriftRaw from "../data/stage-drift.json" with { type: "json" };
import monologuesRaw from "../data/monologues.json" with { type: "json" };
import {
  DIM_KEYS,
  LINE_STATES,
  RES_KEYS,
  STAGES,
  VALUES_AXES,
  type Deltas3,
  type DimKey,
  type Dims,
  type EventType,
  type LineKey,
  type LineProgress,
  type LineState,
  type ResKey,
  type ResourceDeltas,
  type Resources,
  type RunState,
  type Stage,
  type Values3,
  type ValuesAxis,
} from "./model.ts";

const clampInt = (n: number): number => Math.min(100, Math.max(0, Math.round(n)));

export const INITIAL_VALUES3: Values3 = { worldview: 50, outlook: 50, values: 50 };
export const INITIAL_RESOURCES: Resources = { mood: 60, money: 60, health: 60 };
export const INITIAL_LINES: LineProgress = { study: 0, career: 0, love: 0, friend: 0, health: 0 };

/** 父母初始在册（plan/v3/02 §八）；图谱注册表（名字/职责）随 M3'' 落数据文件。 */
export const INITIAL_NPCS: RunState["npcs"] = [
  { id: "mother", bond: 70, tag: "亲密" },
  { id: "father", bond: 70, tag: "亲密" },
];

/** 支线 critical 解锁阈值（02 §四 ▸ M1'' 增补）。 */
export const LINE_CRITICAL_UNLOCK = 60;
/** rescue 触发阈值：资源 < 25 时该资源 rescue 事件进入候选（02 §三 ▸ M1'' 增补）。 */
export const RESCUE_TRIGGER = 25;
/** 线进度增益缺省（02 §四 ▸ M1'' 增补）。 */
export const LINE_GAIN_DEFAULT = { context: 8, critical: 15 } as const;

// ── 传导核：方向表（02 §二 ▸ M1'' 增补，唯一实现）──

/** worldview→sn / outlook→ei,jp / values→tf；每轴系数 0.4，方向按增量符号（+worldview→+sn / +outlook→−ei,−jp / +values→+tf）。 */
const DERIVE_TABLE: Record<ValuesAxis, Array<{ dim: DimKey; dir: 1 | -1 }>> = {
  worldview: [{ dim: "sn", dir: 1 }],
  outlook: [
    { dim: "ei", dir: -1 },
    { dim: "jp", dir: -1 },
  ],
  values: [{ dim: "tf", dir: 1 }],
};
const DERIVE_COEFF = 0.4;

/** 某一三观增量映射到某维的偏移；0 归一为 +0（防 -0 混入存档序列化与 toEqual 断言）。 */
function offsetOf(delta: number, dir: 1 | -1): number {
  const off = Math.round(DERIVE_COEFF * delta) * dir;
  return off === 0 ? 0 : off;
}

/** 传导核：三观增量 → 四维偏移（逐选项主效应）。方向表单源，回滚/改表即打挂传导单测。 */
export function dimsOffsetOf(deltas3: Deltas3): Partial<Dims> {
  const out: Partial<Dims> = {};
  for (const axis of VALUES_AXES) {
    const delta = deltas3[axis];
    if (typeof delta !== "number" || delta === 0) continue;
    for (const { dim, dir } of DERIVE_TABLE[axis]) {
      const off = offsetOf(delta, dir);
      if (off !== 0) out[dim] = (out[dim] ?? 0) + off;
    }
  }
  return out;
}

/**
 * 状态级投影（02 §二 ▸ M1'' 增补）：以 values3−50 为中性基过同一方向表，
 * 得「当前三观隐含的性格倾向」；各维输出钳在本维剩余空间内（不越极点）。
 * line 形参 v3-M1'' 为预留位（全线恒等影响，02 §二）；画像/隐线展示与测试消费。
 */
export function deriveDims(values3: Values3, dims: Dims, line: LineKey): Partial<Dims> {
  void line;
  const base = dimsOffsetOf({
    worldview: values3.worldview - 50,
    outlook: values3.outlook - 50,
    values: values3.values - 50,
  });
  const out: Partial<Dims> = {};
  for (const dim of DIM_KEYS) {
    const lean = base[dim] ?? 0;
    if (lean === 0) continue;
    out[dim] = lean > 0 ? Math.min(lean, 100 - dims[dim]) : Math.max(lean, -dims[dim]);
    if (out[dim] === 0) delete out[dim];
  }
  return out;
}

/** 三观主效应：增量入账 + 钳制 [0,100]（02 §二）。返回新状态，不改入参。 */
export function applyValues(state: RunState, deltas3: Deltas3): RunState {
  const values3 = { ...state.values3 };
  for (const axis of VALUES_AXES) {
    const delta = deltas3[axis];
    if (typeof delta === "number" && delta !== 0) {
      values3[axis] = clampInt(values3[axis] + delta);
    }
  }
  return { ...state, values3 };
}

// ── 资源层（02 §三）──

/** 资源增损：入账 + 钳制 [0,100]。返回新状态，不改入参。 */
export function applyResources(state: RunState, deltas: ResourceDeltas): RunState {
  const resources = { ...state.resources };
  for (const key of RES_KEYS) {
    const delta = deltas[key];
    if (typeof delta === "number" && delta !== 0) {
      resources[key] = clampInt(resources[key] + delta);
    }
  }
  return { ...state, resources };
}

/** 阶段末自然结算数值（02 §三 ▸ M1'' 增补系数表）：心境 −5 / 健康随年龄段 / 积蓄随 career 线。 */
export function settleDeltas(stage: Stage, lines: LineProgress): ResourceDeltas {
  const HEALTH_DECAY: Record<Stage, number> = {
    infant: 0,
    toddler: 0,
    childhood: 0,
    teen: 0,
    youth: 1,
    adult: 2,
    midlife: 4,
    elder: 6,
  };
  return {
    mood: -5,
    health: -HEALTH_DECAY[stage] || 0,
    money: Math.floor(lines.career / 20) - 4,
  };
}

/** 某资源当值是否触发 rescue 候选（02 §三：低值分支 < 25）。 */
export function rescueOpen(state: RunState, res: ResKey): boolean {
  return state.resources[res] < RESCUE_TRIGGER;
}

// ── NPC 关系层（v3/02 §五 ▸ M3'' 增补：bondDeltas 衰减 / tag 阈值 / 钳制）──

/** 新 NPC 入册时的初始 bond（中位）。 */
export const NPC_SPAWN_BOND = 50;
/** values 轴影响增益衰减的最大深度（02 §五：系数 0.5 单源本档）。 */
export const BOND_DECAY = 0.5;

/**
 * bond 增益的 values 轴衰减：增益 × (1 − 0.5 × |values−50| / 50)。
 * 价值观居中（50）时全额入账；越接近任一极值（极致原则或极致共情），
 * 关系增益越钝感，极端时衰减至一半。取整沿 M1'' 换算先例 = 远离零（符号对称）。
 */
export function bondGainOf(delta: number, valuesAxis: number): number {
  const factor = 1 - BOND_DECAY * (Math.abs(valuesAxis - 50) / 50);
  return Math.sign(delta) * Math.round(Math.abs(delta) * factor);
}

/** tag 翻转阈值（02 §五 ▸ M3'' 增补：<30 决裂 / 30–59 疏离 / 60–89 亲密 / ≥90 羁绊）。 */
export function tagOfBond(bond: number): import("./model").NpcTag {
  if (bond >= 90) return "羁绊";
  if (bond >= 60) return "亲密";
  if (bond >= 30) return "疏离";
  return "决裂";
}

/**
 * 关系增量入账：未在册 NPC 以 NPC_SPAWN_BOND 入册后按序应用增量；
 * bond 钳制 [0,100] 整数，tag 随 bond 重算。返回新状态，不改入参。
 */
export function applyBonds(state: RunState, bondDeltas: Record<string, number>): RunState {
  const entries = Object.entries(bondDeltas).filter(([, v]) => typeof v === "number" && v !== 0);
  if (entries.length === 0) return state;
  const npcs = state.npcs.map((n) => ({ ...n }));
  for (const [id, raw] of entries) {
    let npc = npcs.find((n) => n.id === id);
    if (!npc) {
      npc = { id, bond: NPC_SPAWN_BOND, tag: tagOfBond(NPC_SPAWN_BOND) };
      npcs.push(npc);
    }
    npc.bond = clampInt(npc.bond + bondGainOf(raw, state.values3.values));
    npc.tag = tagOfBond(npc.bond);
  }
  return { ...state, npcs };
}

// ── 线进度（02 §四）──
/** 事件的线进度增益：rescue 恒 0；缺省 context 8 / critical 15；fate 无进度不入账。 */
export function lineGainOf(line: LineKey, type: EventType, lineGain?: number): number {
  if (line === "fate") return 0;
  if (type === "rescue") return 0;
  if (typeof lineGain === "number") return lineGain;
  return type === "critical" ? LINE_GAIN_DEFAULT.critical : LINE_GAIN_DEFAULT.context;
}

/** 线进度入账 + 钳制 [0,100]。 */
export function applyLineGain(lines: LineProgress, line: LineKey, gain: number): LineProgress {
  if (line === "fate" || gain === 0) return lines;
  const next = { ...lines };
  next[line] = Math.min(100, Math.max(0, next[line] + gain));
  return next;
}

/** 支线 critical 解锁判定（阈值 60，02 §四）。 */
export function lineCriticalUnlocked(lines: LineProgress, line: LineKey): boolean {
  return line === "fate" || lines[line] >= LINE_CRITICAL_UNLOCK;
}

/** 线终态映射（02 §四 ▸ M1'' 增补：0 未启 / 1–29 中断 / 30–79 平顺 / ≥80 圆满）。 */
export function lineStateOf(progress: number): LineState {
  if (progress >= 80) return "圆满";
  if (progress >= 30) return "平顺";
  if (progress >= 1) return "中断";
  return "未启";
}

// ── 自定义槽增量钳制（02 §七：LLM 产出走本地钳制后才入状态；口径与 validate 同抄 02 §二/§三）──

const DELTAS3_CAP = { main: 3, context: 3, critical: 8, rescue: 3 } as const;
const RES_CAP = { main: 10, context: 10, critical: 25, rescue: 25 } as const;

/**
 * LLM 归一产出的增量钳制：逐轴截到该事件类型的口径上限，零偏移删键。
 * 反向标签相抵（和为 0）也在此删净，保证入状态前无零增量键。
 */
export function clampCustomDeltas(
  deltas3: Deltas3,
  resourceDeltas: ResourceDeltas,
  type: EventType,
): { deltas3: Deltas3; resourceDeltas: ResourceDeltas } {
  const cap3 = DELTAS3_CAP[type] ?? 3;
  const capR = RES_CAP[type] ?? 10;
  const out3: Deltas3 = {};
  for (const axis of VALUES_AXES) {
    const v = deltas3[axis];
    if (typeof v !== "number" || v === 0) continue;
    const clamped = Math.max(-cap3, Math.min(cap3, Math.round(v)));
    if (clamped !== 0) out3[axis] = clamped;
  }
  const outR: ResourceDeltas = {};
  for (const key of RES_KEYS) {
    const v = resourceDeltas[key];
    if (typeof v !== "number" || v === 0) continue;
    const clamped = Math.max(-capR, Math.min(capR, Math.round(v)));
    if (clamped !== 0) outR[key] = clamped;
  }
  return { deltas3: out3, resourceDeltas: outR };
}

// ── 非选项漂移（02 §二：stageDrift 数据表）──

type DriftTable = Record<Stage, Deltas3>;
const DRIFT = stageDriftRaw as unknown as DriftTable;

/** 当前阶段的非选项漂移（阶段小结时轻推三观；表缺失/越界属数据错误，取零漂移兜底不崩局）。 */
export function stageDrift(state: RunState): Deltas3 {
  const stage = STAGES[state.stageIndex];
  const row = stage ? DRIFT[stage] : undefined;
  if (!row) return {};
  const out: Deltas3 = {};
  for (const axis of VALUES_AXES) {
    const v = row[axis];
    if (typeof v === "number" && v !== 0) out[axis] = v;
  }
  return out;
}

// ── 独白（02 §二：区间 <35 / 35–65 / >65，文案表 monologues.json）──

type MonologueTable = Record<ValuesAxis, { low: string; mid: string; high: string }>;
const MONOLOGUES = monologuesRaw as unknown as MonologueTable;

export function monologueBand(v: number): "low" | "mid" | "high" {
  if (v < 35) return "low";
  if (v > 65) return "high";
  return "mid";
}

/** 内心独白：按各轴区间选文案（三观数值不直接示人，02 §二）。 */
export function monologueOf(values3: Values3): Record<ValuesAxis, string> {
  const out = {} as Record<ValuesAxis, string>;
  for (const axis of VALUES_AXES) {
    const band = monologueBand(values3[axis]);
    const text = MONOLOGUES[axis]?.[band];
    if (typeof text !== "string" || !text) throw new Error(`monologues.json 缺 ${axis}.${band} 文案`);
    out[axis] = text;
  }
  return out;
}

// ── 结局判定 v3（02 §四：v2 选择逻辑 + 线终态/三观画像结构化输出）──

export interface EndingV3 {
  ending: import("./model").Ending;
  /** 五条支线的终态（圆满/平顺/中断/未启）。 */
  lineStates: Record<Exclude<LineKey, "fate">, LineState>;
  /** 三观画像（终局数值快照；表现层文案化随 M2''/M3''）。 */
  values3: Values3;
}

/**
 * 结局判定 v3：结局**选择**仍沿 v2 四维+flags（resolveEnding，endings.json 不动）；
 * v3 增量 = 附线终态与三观画像。线终态参与结局选择随 M3''/M4'' endings 口径扩展再启用。
 */
export function deriveEndingV3(state: RunState, resolve: (s: RunState) => import("./model").Ending): EndingV3 {
  const lineStates = {
    study: lineStateOf(state.lines.study),
    career: lineStateOf(state.lines.career),
    love: lineStateOf(state.lines.love),
    friend: lineStateOf(state.lines.friend),
    health: lineStateOf(state.lines.health),
  };
  return { ending: resolve(state), lineStates, values3: { ...state.values3 } };
}

// LINE_STATES 目前仅经 lineStateOf 产出；枚举导出供 M3'' 图谱/终局屏消费，防漂移引用。
void LINE_STATES;
