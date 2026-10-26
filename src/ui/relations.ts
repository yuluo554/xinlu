// 关系图谱（v3/02 §五 ▸ M3'' 增补、plan/v3/03 §4 契约）：环形固定布局的手绘 SVG，零依赖。
// 布局口径：中心 = 玩家；父母（fate）内环；其余 NPC 外环按线分区（study/career/love/friend/health 顺时针）。
// 连线宽度 = bond 映射 [1,6]px；连线颜色按 tag（01 §五）。本档是图谱唯一的渲染出口（viz 收窄面纪律），
// 图谱页与终局快照共用同一字符串产物（快照收录 = 该 SVG 直接内联，天然序列化）。
import npcsRaw from "../data/npcs.json";
import { LINE_KEYS, type LineKey, type NpcState, type NpcTag } from "../engine/model";
import { tagOfBond } from "../engine/values";

/** NPC 注册表（名字/职责/线别唯一事实源 = npcs.json，validate N.REG 守门）。 */
export const NPC_PROFILES = npcsRaw as unknown as Record<string, { name: string; role: string; line: LineKey }>;

/** tag 配色（inline 属性进 SVG，随快照自包含）。节点底/文字用 CSS 变量 + 米纸 fallback：
 * 主题页内随 data-theme 联动（v4-M3''' 3.3 四主题复验），快照独立查看时回退米纸值。 */
export const TAG_COLORS: Record<NpcTag, string> = {
  亲密: "#b0873a",
  疏离: "#7c8aa0",
  决裂: "#8a8a8a",
  羁绊: "#b4436c",
};

/** 未注册 id 的兜底档案（存档层不拦历史 id，渲染层不崩即可）。 */
const FALLBACK = { name: "故人", role: "旧识", line: "fate" as LineKey };

export interface RelationNode {
  id: string;
  name: string;
  role: string;
  line: LineKey;
  bond: number;
  tag: NpcTag;
  /** 0 = 父母内环 / 1 = 支线外环；-1 = 中心（玩家本人）。 */
  ring: -1 | 0 | 1;
  x: number;
  y: number;
}

export interface RelationEdge {
  toId: string;
  bond: number;
  tag: NpcTag;
  /** [1,6]px 映射（02 §五）。 */
  width: number;
}

export interface RelationsVM {
  nodes: RelationNode[];
  edges: RelationEdge[];
}

const CENTER = { x: 180, y: 165 };
const INNER_R = 78;
const OUTER_R = 138;
/** 外环线别分区顺序（fate 父母在内环，不入外环）。 */
const OUTER_LINES = LINE_KEYS.filter((l) => l !== "fate") as Array<Exclude<LineKey, "fate">>;

export function bondToWidth(bond: number): number {
  return Math.round((1 + (Math.min(100, Math.max(0, bond)) / 100) * 5) * 10) / 10;
}

/** 图谱视图模型：位置完全由在册 NPC 的线别与序号决定（同状态恒同布局，确定性）。 */
export function relationsVM(npcs: readonly NpcState[]): RelationsVM {
  const outer: RelationNode[] = [];
  const inner: RelationNode[] = [];
  for (const npc of npcs) {
    const profile = NPC_PROFILES[npc.id] ?? { ...FALLBACK, name: npc.id };
    // 出生家庭 NPC 的本局姓名覆盖注册名（plan/v4/02 §三 ▸ M1''' 增补）
    const name = npc.name ?? profile.name;
    const node: RelationNode = {
      id: npc.id,
      name,
      role: profile.role,
      line: profile.line,
      bond: npc.bond,
      tag: npc.tag ?? tagOfBond(npc.bond),
      ring: -1,
      x: 0,
      y: 0,
    };
    if (profile.line === "fate") inner.push(node);
    else outer.push(node);
  }
  // 内环：≤4 节点走上半弧（父母口径）；>4（出生家庭含祖辈/同辈）改整圆均分，防拥挤重叠。
  inner.forEach((node, i) => {
    const angle =
      inner.length <= 4
        ? -Math.PI / 2 + Math.PI * (inner.length === 1 ? 0.5 : i / (inner.length - 1))
        : ((i + 0.5) / inner.length) * Math.PI * 2 - Math.PI / 2;
    node.ring = 0;
    node.x = Math.round(CENTER.x + INNER_R * Math.cos(angle));
    node.y = Math.round(CENTER.y + INNER_R * Math.sin(angle));
  });
  // 外环：按线分区（study→health 顺时针），线内按在册序均分整圆。
  const sorted = [...outer].sort(
    (a, b) => OUTER_LINES.indexOf(a.line as Exclude<LineKey, "fate">) - OUTER_LINES.indexOf(b.line as Exclude<LineKey, "fate">),
  );
  sorted.forEach((node, i) => {
    // 半步相位偏移：外环起点错开内环父母的角度（-90°），避免同角度视觉重叠
    const angle = ((i + 0.5) / Math.max(1, sorted.length)) * Math.PI * 2 - Math.PI / 2;
    node.ring = 1;
    node.x = Math.round(CENTER.x + OUTER_R * Math.cos(angle));
    node.y = Math.round(CENTER.y + OUTER_R * Math.sin(angle));
  });
  const nodes = [...inner, ...sorted];
  const center: RelationNode = {
    id: "__you__",
    name: "你",
    role: "本人",
    line: "fate",
    bond: 100,
    tag: "羁绊",
    ring: -1,
    x: CENTER.x,
    y: CENTER.y,
  };
  const edges: RelationEdge[] = npcs.map((npc) => ({
    toId: npc.id,
    bond: npc.bond,
    tag: npc.tag ?? tagOfBond(npc.bond),
    width: bondToWidth(npc.bond),
  }));
  return { nodes: [center, ...nodes], edges };
}

/** 图谱 SVG 字符串（快照与图谱页共用；纯静态，无脚本无外链）。
 *  v5：字号与墨色走 CSS 变量（四主题联动）；节点名 12px、身份 9px；线只一条，节点只一圈。 */
export function renderRelations(npcs: readonly NpcState[]): string {
  const vm = relationsVM(npcs);
  const edges = vm.edges
    .map((e) => {
      const to = vm.nodes.find((n) => n.id === e.toId);
      if (!to) return "";
      return `<line x1="${CENTER.x}" y1="${CENTER.y}" x2="${to.x}" y2="${to.y}" stroke="${TAG_COLORS[e.tag]}" stroke-width="${e.width}" stroke-linecap="round" opacity="0.9"/>`;
    })
    .join("");
  const nodes = vm.nodes
    .map((n) => {
      const isCenter = n.ring === -1;
      const r = isCenter ? 22 : n.ring === 0 ? 20 : 18;
      const label = isCenter ? "你" : n.name;
      const sub = isCenter ? "" : n.role;
      // 名字在圆里放得下：三个汉字 ≈ 33px 宽，圆内可用弦长 ≥ 名字宽（半径 18–22 时 11px 字够）
      const body = isCenter
        ? `<text y="4" text-anchor="middle" font-size="13" font-weight="600" fill="var(--ink,#26241f)">${label}</text>`
        : `<text y="0" text-anchor="middle" font-size="11" fill="var(--ink,#26241f)">${label}</text>
           <text y="12" text-anchor="middle" font-size="9" fill="var(--ink-3,#6f6a5e)">${sub}</text>`;
      return `<g transform="translate(${n.x} ${n.y})">
        <circle r="${r}" fill="var(--surface,#ffffff)" stroke="${isCenter ? "var(--ink,#26241f)" : TAG_COLORS[n.tag]}" stroke-width="${isCenter ? 2 : 1.5}"/>
        ${body}
      </g>`;
    })
    .join("");
  return `<svg viewBox="0 0 360 330" role="img" aria-label="关系图谱" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,-apple-system,'PingFang SC','Microsoft YaHei',sans-serif">${edges}${nodes}</svg>`;
}