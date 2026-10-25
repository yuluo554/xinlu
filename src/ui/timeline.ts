// 时间轴画卷 + 游戏感反馈的视图模型（纯函数，无 DOM）。表现口径单源 plan/v3/02（§四 线别 / §三 资源 / §二 三观），
// 本档只承载 UI 语汇（线别中文名 / 资源图标 / 浮动文案），不复写数值口径。
import {
  LINE_KEYS,
  RES_KEYS,
  STAGES,
  type Deltas3,
  type LineKey,
  type ResourceDeltas,
  type ResKey,
  type RunState,
  type Stage,
  type ValuesAxis,
} from "../engine/model";
import { eventById } from "../engine/engine";
import { STAGE_LABEL } from "./logic";

export { RES_KEYS };

/** 线别显示名与配色类（plan/v3/02 §四 line 枚举）。 */
export const LINE_META: Record<LineKey, { label: string; cls: string }> = {
  fate: { label: "命运主线", cls: "line-fate" },
  study: { label: "学业", cls: "line-study" },
  career: { label: "事业", cls: "line-career" },
  love: { label: "情感", cls: "line-love" },
  friend: { label: "友情", cls: "line-friend" },
  health: { label: "健康", cls: "line-health" },
};

/** 状态条资源语汇（v3/02 §三：心境/积蓄/健康）。图标名出自 Game-Icons，随 icons.ts 解析。 */
export const RES_META: Record<ResKey, { label: string; icon: string }> = {
  mood: { label: "心境", icon: "heart-beats" },
  money: { label: "积蓄", icon: "two-coins" },
  health: { label: "健康", icon: "first-aid-kit" },
};

/** 移动端窄轨的单字阶段名（桌面态用全名 STAGE_LABEL）。 */
export const STAGE_SHORT: Record<Stage, string> = {
  infant: "婴",
  toddler: "幼",
  childhood: "童",
  teen: "少",
  youth: "青",
  adult: "壮",
  midlife: "中",
  elder: "老",
};

export interface TimelineNode {
  line: LineKey;
  critical: boolean;
}

export interface TimelineSegment {
  stage: Stage;
  label: string;
  short: string;
  status: "done" | "now" | "future";
  nodes: TimelineNode[];
}

/** 人生画卷轨道：八段 × 已消费事件（线别色点，critical 加环）。阶段信息沿 logic.ts 纪律由 history 反查派生；
 *  v4 时代卡（kind:"era"）计入命运线普通色点（02 §二：命运线注入）。 */
export function timelineVM(state: RunState): TimelineSegment[] {
  const nodes: Record<Stage, TimelineNode[]> = {} as Record<Stage, TimelineNode[]>;
  for (const s of STAGES) nodes[s] = [];
  for (const h of state.history) {
    if (h.kind === "era") {
      // 时代卡不属八阶段事件表：按「当前推进阶段」归段（history 末段所处阶段的口径与引擎注入一致）。
      const stage = STAGES[Math.min(state.stageIndex, STAGES.length - 1)]!;
      nodes[stage]!.push({ line: "fate", critical: false });
      continue;
    }
    const ev = eventById(h.eventId);
    if (!ev) continue;
    nodes[ev.stage]!.push({ line: ev.line, critical: ev.type === "critical" });
  }
  return STAGES.map((stage, i) => ({
    stage,
    label: STAGE_LABEL[stage],
    short: STAGE_SHORT[stage],
    status: i < state.stageIndex ? ("done" as const) : i === state.stageIndex ? ("now" as const) : ("future" as const),
    nodes: nodes[stage]!,
  }));
}

// ── 后果微反馈（v3/02 §三「增损时数值浮动」+ dogfooding 结论 1「选择可感」）──

export interface Floater {
  text: string;
  /** up = 增益 / down = 损耗；三观浮动恒为方向词（三观数值不直接示人，v3/02 §二）。 */
  cls: "up" | "down";
}

const RES_LABEL: Record<ResKey, string> = { mood: "心境", money: "积蓄", health: "健康" };

/** 资源浮动：非零项 → 「心境 −5」样式带符号文案。 */
export function resourceFloats(deltas: ResourceDeltas): Floater[] {
  const out: Floater[] = [];
  for (const key of RES_KEYS) {
    const v = deltas[key] ?? 0;
    if (v === 0) continue;
    const sign = v > 0 ? "+" : "−";
    out.push({ text: `${RES_LABEL[key]} ${sign}${Math.abs(v)}`, cls: v > 0 ? "up" : "down" });
  }
  return out;
}

/** 三观方向词（v3/02 §二轴定义：理性0↔感应100 / 进取0↔安然100 / 原则0↔共情100）。 */
const VALUES_DIRECTION: Record<ValuesAxis, { low: string; high: string; label: string }> = {
  worldview: { low: "理性", high: "感应", label: "世界观" },
  outlook: { low: "进取", high: "安然", label: "人生观" },
  values: { low: "原则", high: "共情", label: "价值观" },
};

/** 三观浮动：非零项 → 「世界观 ↗ 感应」方向词，不带数值。 */
export function valueFloats(deltas: Deltas3): Floater[] {
  const out: Floater[] = [];
  for (const axis of ["worldview", "outlook", "values"] as ValuesAxis[]) {
    const v = deltas[axis] ?? 0;
    if (v === 0) continue;
    const dir = VALUES_DIRECTION[axis];
    const word = v > 0 ? dir.high : dir.low;
    out.push({ text: `${dir.label} → ${word}`, cls: v > 0 ? "up" : "down" });
  }
  return out;
}

/** 一次选择的全部浮动文案（资源 + 三观合并，动效预算内 ≤6 条，渲染层做 stagger）。 */
export function choiceFloats(deltas3: Deltas3, resources: ResourceDeltas): Floater[] {
  return [...resourceFloats(resources), ...valueFloats(deltas3)];
}
