// 关系图谱（v3/02 §五 ▸ M3'' 增补 + v5/02 §八 双视图重做）：环形固定布局 / 家谱树，均为手绘 SVG，零依赖。
//
// 两套布局共用同一份「在册 NPC → 节点」事实，视图只换坐标与连线形态：
//   tree（默认）三代纵向：祖辈顶行 → 父母行 → 玩家与同辈行 → 伴侣/同行者行（v5/02 §八）；
//   ring（切换）环形：中心玩家 + 父母内环 + 支线外环（沿 v3），v5 重做为曲线连边、亲疏=线宽+透明度、标签外推避让。
// 连线宽度 = bond 映射 [1,6]px；连线颜色按 tag（01 §五）。本档是图谱唯一的渲染出口（viz 收窄面纪律），
// 图谱页与终局快照共用同一字符串产物（快照收录 = 该 SVG 直接内联，天然序列化）。
import npcsRaw from "../data/npcs.json";
import familySlotsRaw from "../data/family-slots.json" with { type: "json" };
import { eventById } from "../engine/engine";
import { LINE_KEYS, type HistoryEntry, type LineKey, type NpcState, type NpcTag } from "../engine/model";
import { familySlotRole } from "../engine/family";
import { tagOfBond } from "../engine/values";

/** NPC 注册表（名字/职责/线别唯一事实源 = npcs.json，validate N.REG 守门）。 */
export const NPC_PROFILES = npcsRaw as unknown as Record<
  string,
  { name: string; role: string; line: LineKey; group?: "parent" | "grandparent" | "sibling" | null }
>;

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

/** 视图枚举（v5/02 §八：tree 默认，ring 切换）。 */
export const RELATION_VIEWS = ["tree", "ring"] as const;
export type RelationView = (typeof RELATION_VIEWS)[number];

export interface RelationNode {
  id: string;
  name: string;
  role: string;
  line: LineKey;
  bond: number;
  tag: NpcTag;
  /** 环视口：0 = 父母内环 / 1 = 支线外环；-1 = 中心（玩家本人）。树视口同理用于旧断言。 */
  ring: -1 | 0 | 1;
  x: number;
  y: number;
  /** 树视图层级：0 祖辈 / 1 父母 / 2 玩家与同辈 / 3 伴侣与同行者；ring 视图为 -1。 */
  layer?: number;
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

const CENTER = { x: 190, y: 186 };
const INNER_R = 86;
const OUTER_R = 154;
/** 外环线别分区顺序（fate 父母在内环，不入外环）。 */
const OUTER_LINES = LINE_KEYS.filter((l) => l !== "fate") as Array<Exclude<LineKey, "fate">>;

/** 家谱树画布与行高（viewBox 360×360；四行 y 固定 = 同状态恒同布局）。 */
const TREE = { w: 360, h: 360, left: 34, right: 326 } as const;
const TREE_ROW_Y = [46, 126, 212, 296] as const;

export function bondToWidth(bond: number): number {
  return Math.round((1 + (Math.min(100, Math.max(0, bond)) / 100) * 5) * 10) / 10;
}

/** 亲疏 → 连线透明度（v5/02 §八「亲疏 = 线宽 + 透明度」）：0.35–0.95 线性。 */
export function bondToOpacity(bond: number): number {
  const b = Math.min(100, Math.max(0, bond));
  return Math.round((0.35 + (b / 100) * 0.6) * 100) / 100;
}

function nodeOf(npc: NpcState): Omit<RelationNode, "ring" | "x" | "y"> {
  const profile = NPC_PROFILES[npc.id] ?? { ...FALLBACK, name: npc.id };
  // 出生家庭 NPC 的本局姓名覆盖注册名（plan/v4/02 §三 ▸ M1''' 增补）
  const name = npc.name ?? profile.name;
  // v5 家庭槽位逐位命名（plan/v5/02 §一）：role 优先取槽位表（父亲/母亲/外公/外婆/哥哥…），
  // 缺槽位（旧档未回填 / 非家庭成员）回落注册表 role——禁显示「父母/祖辈/同辈」泛称。
  const role = familySlotRole(npc.slot) ?? profile.role;
  return {
    id: npc.id,
    name,
    role,
    line: profile.line,
    bond: npc.bond,
    tag: npc.tag ?? tagOfBond(npc.bond),
  };
}

/** 图谱视图模型（环形）：位置完全由在册 NPC 的线别与序号决定（同状态恒同布局，确定性）。
 *  沿 v3 口径不变——树视图见 treeVM；本函数继续服务 rel-list 的行序与既有单测。 */
export function relationsVM(npcs: readonly NpcState[]): RelationsVM {
  const outer: RelationNode[] = [];
  const inner: RelationNode[] = [];
  for (const npc of npcs) {
    const base = nodeOf(npc);
    const node: RelationNode = { ...base, ring: -1, x: 0, y: 0 };
    if (base.line === "fate") inner.push(node);
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

// ── 家谱树（v5/02 §八 默认视图）──

/** 家庭槽位 → 层级：祖辈 0 / 父母 1 / 同辈 2；非家庭成员见 treeLayer 的兜底。 */
const SLOT_GROUP_LAYER: Record<"grandparent" | "parent" | "sibling", number> = {
  grandparent: 0,
  parent: 1,
  sibling: 2,
};

/** 槽位显示序（同层横排顺序）：同一行内先祖辈/父母再同辈，各自按槽位表登记序。 */
const SLOT_ORDER = Object.keys(
  (familySlotsRaw as unknown as { slots: Record<string, { role: string; group: string }> }).slots,
);

/** 非家庭成员按线别排（伴侣 → 同行者）。 */
function treeLayerOf(npc: NpcState): number {
  const group = NPC_PROFILES[npc.id]?.group;
  if (group && group in SLOT_GROUP_LAYER) return SLOT_GROUP_LAYER[group as keyof typeof SLOT_GROUP_LAYER];
  const slotGroup = npc.slot ? (familySlotsRaw as unknown as { slots: Record<string, { group: string }> }).slots[npc.slot]?.group : undefined;
  if (slotGroup && slotGroup in SLOT_GROUP_LAYER) return SLOT_GROUP_LAYER[slotGroup as keyof typeof SLOT_GROUP_LAYER];
  return 3;
}

/** 同层横排序：槽位登记序优先（祖父→祖母→外公→外婆→父→母→兄→姐→弟→妹），再按线别（love 居左），最后按 id。 */
function treeSortKey(npc: NpcState): [number, number, string] {
  const slotAt = npc.slot ? SLOT_ORDER.indexOf(npc.slot) : -1;
  const line = NPC_PROFILES[npc.id]?.line ?? "fate";
  const lineAt = line === "fate" ? -1 : LINE_KEYS.indexOf(line);
  return [slotAt >= 0 ? slotAt : 100 + lineAt, slotAt >= 0 ? 0 : 1, npc.id];
}

export interface TreeEdge {
  fromId: string;
  toId: string;
  kind: "blood" | "marriage" | "bond";
  bond: number;
  tag: NpcTag;
  width: number;
  /** 走线折点（含首尾）：家谱树用正交折线，不画斜穿的对角线。 */
  points: Array<[number, number]>;
}

export interface TreeVM {
  nodes: RelationNode[];
  edges: TreeEdge[];
  /** 层级 → 该层节点 id（布局断言与 E2E 直读）。 */
  layers: string[][];
  /** 公共母线（多子女共用的竖段/横段）：单独路径串，中性导线色画一次。 */
  busLines: string[];
}

/**
 * 家谱树布局（v5/02 §八）：层级由家庭槽组决定（祖辈 < 父母 < 玩家与同辈 < 伴侣与同行者），
 * 同层横排在 [left,right] 内均分——**位置只由成员构成决定**，同状态两次渲染逐字节相同。
 * 玩家恒在第 2 层正中；不与同辈抢位（同辈排在玩家两侧）。
 */
export function treeVM(npcs: readonly NpcState[]): TreeVM {
  const buckets: NpcState[][] = [[], [], [], []];
  for (const npc of npcs) buckets[treeLayerOf(npc)]!.push(npc);
  const nodes: RelationNode[] = [];
  const layers: string[][] = [[], [], [], []];
  const span = TREE.right - TREE.left;

  const place = (list: NpcState[], layer: number, skipCenterSlot: boolean): RelationNode[] => {
    const sorted = [...list].sort((a, b) => {
      const ka = treeSortKey(a);
      const kb = treeSortKey(b);
      for (let i = 0; i < 3; i++) {
        if (ka[i]! < kb[i]!) return -1;
        if (ka[i]! > kb[i]!) return 1;
      }
      return 0;
    });
    // 玩家与同辈层：玩家占据正中一格，同辈均分左右两半（skipCenterSlot=true 时按 2 段算）
    const slots = skipCenterSlot ? sorted.length + 1 : sorted.length;
    if (slots === 0) return [];
    const out: RelationNode[] = [];
    let k = 0;
    for (let i = 0; i < slots; i++) {
      // 正中位留给玩家（只有 0 个同辈时也留中，玩家不被推偏）
      const isCenterSlot = skipCenterSlot && i === Math.floor(slots / 2);
      if (isCenterSlot) continue;
      const npc = sorted[k++]!;
      const base = nodeOf(npc);
      const x = slots === 1 ? (TREE.left + TREE.right) / 2 : TREE.left + (span * (i + 0.5)) / slots;
      out.push({
        ...base,
        ring: 0,
        x: Math.round(x),
        y: TREE_ROW_Y[layer]!,
        layer,
      });
      layers[layer]!.push(npc.id);
    }
    return out;
  };

  for (let layer = 0; layer < 4; layer++) {
    const placed = place(buckets[layer]!, layer, layer === 2);
    nodes.push(...placed);
  }

  const you: RelationNode = {
    id: "__you__",
    name: "你",
    role: "本人",
    line: "fate",
    bond: 100,
    tag: "羁绊",
    ring: -1,
    x: Math.round((TREE.left + TREE.right) / 2),
    y: TREE_ROW_Y[2]!,
    layer: 2,
  };

  // ── 连线（家谱树走正交母线，不画斜穿的对角线）──
  //   婚姻 = 双线横杆（父母之间 / 祖辈夫妇之间 / 你与伴侣之间，竖连时改竖双线）；
  //   血缘 = 从横杆中点垂下一根母线，再横向分到各子女头顶（树形分叉，线不交叉）；
  //   同行者 = 你 → 每人的关系虚线（亲疏用线宽 + 透明度）。
  const edges: TreeEdge[] = [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  /** 公共母线（多子女共用的竖段/横段）：中性导线色画一次，不与某条边的 tag 色绑定。 */
  const busLines: string[] = [];
  /** 记一条边：bond/tag 取「被指向的那个人」（同行者取对方，血缘取子女，婚姻取后者）。 */
  const rel = (fromId: string, toId: string, kind: TreeEdge["kind"], points: Array<[number, number]>): void => {
    const subject = byId.get(toId) ?? byId.get(fromId);
    const bond = subject?.bond ?? 60;
    edges.push({
      fromId,
      toId,
      kind,
      bond,
      tag: subject?.tag ?? tagOfBond(bond),
      width: bondToWidth(bond),
      points,
    });
  };
  const father = byId.get("father");
  const mother = byId.get("mother");
  const grandparents = nodes.filter((n) => n.layer === 0);
  const parents = nodes.filter((n) => n.layer === 1);
  const siblings = nodes.filter((n) => n.layer === 2);
  const others = nodes.filter((n) => n.layer === 3);
  const children = [you, ...siblings];
  /** 同层两人之间的横杆（父母 / 祖辈夫妇）。 */
  const coupleBar = (a: RelationNode, b: RelationNode): void => {
    rel(a.id, b.id, "marriage", [
      [a.x, a.y],
      [b.x, b.y],
    ]);
  };

  // 父母横杆 + 父母 → 子女的正交母线分叉（一根竖母线 + 横向分叉，线不交叉）
  if (father && mother) coupleBar(father, mother);
  const parentAnchorX =
    parents.length >= 2 ? Math.round((parents[0]!.x + parents[1]!.x) / 2) : (parents[0]?.x ?? you.x);
  const parentAnchorY = parents.length > 0 ? parents[0]!.y + 20 : you.y - 24;
  const childBusY = Math.round((TREE_ROW_Y[1]! + TREE_ROW_Y[2]!) / 2) + 4;
  const parentId = parents[0]?.id ?? grandparents[0]?.id ?? "__you__";
  const bloodChildren = children.filter((c) => c.id !== parentId);
  // 母线（公共竖段 + 公共横段）单独画一次、用中性导线色——
  // 否则每个孩子各画一遍同一竖段，最后画的那条（其 tag 色）会盖住其余，颜色变成「碰巧」。
  if (bloodChildren.length > 0) {
    busLines.push(
      `M${parentAnchorX} ${parentAnchorY} L${parentAnchorX} ${childBusY}`,
      ...(bloodChildren.length > 1
        ? [`M${Math.min(...bloodChildren.map((c) => c.x))} ${childBusY} L${Math.max(...bloodChildren.map((c) => c.x))} ${childBusY}`]
        : []),
    );
  }
  for (const child of bloodChildren) {
    rel(parentId, child.id, "blood", [
      [child.x, childBusY],
      [child.x, child.y - 20],
    ]);
  }

  // 祖辈横杆 + 祖辈 → 对应家长（父系连父亲、母系连母亲；缺该家长时连现存家长，再缺则落到你）
  const gpPair = grandparents.slice(0, 2);
  if (gpPair.length === 2) coupleBar(gpPair[0]!, gpPair[1]!);
  const gpBusY = Math.round((TREE_ROW_Y[0]! + TREE_ROW_Y[1]!) / 2) + 4;
  for (const gp of grandparents) {
    // 侧系由槽位决定（南方 = 外公外婆 → 母亲；北方 = 祖父祖母 → 父亲，v5/02 §一）
    const slot = npcs.find((n) => n.id === gp.id)?.slot ?? "";
    const wantsFather = slot.startsWith("gp-paternal") || (!slot && gp.id === "grandpa");
    const target = wantsFather ? (father ?? mother ?? you) : (mother ?? father ?? you);
    if (!target || target.id === gp.id) continue;
    const anchorX = gpPair.length === 2 ? Math.round((gpPair[0]!.x + gpPair[1]!.x) / 2) : gp.x;
    rel(gp.id, target.id, "blood", [
      [anchorX, gp.y + 18],
      [anchorX, gpBusY],
      [target.x, gpBusY],
      [target.x, target.y - 19],
    ]);
  }

  // 同行者：你 → 每人一条关系线；伴侣走婚姻横杆。
  // 走正交折线（先竖后横再竖），与家谱母线同一走线风格：
  // 竖向从你脚下出发 → 到对方行上方 26px 的中转线 → 横向 → 落到对方头顶。
  for (const other of others) {
    if (other.id === "partner") {
      coupleBar(you, other);
      continue;
    }
    const partnerSideY = other.y - 40;
    rel(you.id, other.id, "bond", [
      [you.x, you.y + 22],
      [you.x, partnerSideY],
      [other.x, partnerSideY],
      [other.x, other.y - 19],
    ]);
  }

  return { nodes: [you, ...nodes], edges, layers, busLines };
}

// ── 节点详情（关系值 + 变化记录，v5/02 §八）──

export interface BondRecord {
  /** 何时：事件月龄对应的年份由调用方补（本层只出 ageHint 与事件标题线索）。 */
  eventId: string;
  ageHint: string;
  stage: string;
  /** 原始增量（选项声明值）。 */
  delta: number;
  /** 选项文案（这条记录因何而来）。 */
  optionText: string;
}

export interface NodeDetail {
  id: string;
  name: string;
  role: string;
  bond: number;
  tag: NpcTag;
  records: BondRecord[];
}

/**
 * 节点详情（v5/02 §八「节点可点开：关系值 + 变化记录」）：
 * history 只存 eventId/option（存档 schema v3 冻结，不新增字段），
 * 因此变化记录 = **按 history 顺序回查事件的选项 bondDeltas**——同一条事实的两种读法，
 * 不另存一份 bond 变更日志（那会与 history 漂移，且要升存档版本）。
 */
export function relationDetail(
  history: readonly HistoryEntry[],
  npcs: readonly NpcState[],
  npcId: string,
): NodeDetail | null {
  const npc = npcs.find((n) => n.id === npcId);
  if (!npc) return null;
  const base = nodeOf(npc);
  const records: BondRecord[] = [];
  for (const h of history) {
    if (h.kind === "era") continue;
    const event = eventById(h.eventId);
    const option = event?.options[h.option];
    const delta = option?.bondDeltas?.[npcId];
    if (!event || typeof delta !== "number" || delta === 0) continue;
    records.push({
      eventId: event.id,
      ageHint: event.ageHint,
      stage: event.stage,
      delta,
      optionText: option?.text ?? "",
    });
  }
  return { ...base, records };
}

/** 图谱 SVG 字符串（快照与图谱页共用；纯静态，无脚本无外链）。
 *  v5：字号与墨色走 CSS 变量（四主题联动）；view = tree（默认）/ ring。 */
export function renderRelations(npcs: readonly NpcState[], view: RelationView = "tree"): string {
  return view === "ring" ? renderRing(npcs) : renderTree(npcs);
}

function svgOpen(w: number, h: number, label: string): string {
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,-apple-system,'PingFang SC','Microsoft YaHei',sans-serif">`;
}

/** 节点圆 + 双行标签（名字在圆内，身份在圆下）；v5 加 data-rel-node 供点开详情。
 *  subDx/subDy = 身份标签相对圆心的额外偏移（环视图沿半径外推做避让，树视图为 0）。 */
function nodeMarkup(n: RelationNode, r: number, subDx = 0, subDy = 0): string {
  const isCenter = n.ring === -1;
  const label = isCenter ? "你" : n.name;
  const sub = isCenter ? "" : n.role;
  const body = isCenter
    ? `<text y="4" text-anchor="middle" font-size="13" font-weight="600" fill="var(--ink,#26241f)">${label}</text>`
    : `<text y="0" text-anchor="middle" font-size="11" fill="var(--ink,#26241f)">${label}</text>
       <text x="${subDx}" y="${12 + subDy}" text-anchor="middle" font-size="9" fill="var(--ink-3,#6f6a5e)">${sub}</text>`;
  return `<g data-rel-node="${n.id}" transform="translate(${n.x} ${n.y})">
        <circle r="${r}" fill="var(--surface,#ffffff)" stroke="${isCenter ? "var(--ink,#26241f)" : TAG_COLORS[n.tag]}" stroke-width="${isCenter ? 2 : 1.5}"/>
        ${body}
      </g>`;
}

function renderRing(npcs: readonly NpcState[]): string {
  const vm = relationsVM(npcs);
  // 曲线连边（v5/02 §八）：控制点向圆心方向内收 45%，观感是「从中心牵出的线」而不是刻度盘
  const edges = vm.edges
    .map((e) => {
      const to = vm.nodes.find((n) => n.id === e.toId);
      if (!to) return "";
      const cx = Math.round(CENTER.x + (to.x - CENTER.x) * 0.45);
      const cy = Math.round(CENTER.y + (to.y - CENTER.y) * 0.45);
      return `<path d="M${CENTER.x} ${CENTER.y}Q${cx} ${cy} ${to.x} ${to.y}" fill="none" stroke="${TAG_COLORS[e.tag]}" stroke-width="${e.width}" stroke-linecap="round" opacity="${bondToOpacity(e.bond)}"/>`;
    })
    .join("");
  // 节点：环视图沿用「名字在圆内、身份在圆下」，不做半径外推——
  // 外推会把标签推向相邻节点（实测叠字），避让改为「放大画布 + 加密环半径」，
  // 相邻节点的角度间隔 ≥ 2π/n，半径 82/142 下 6 节点间隔 60°，标签不会互压。
  const nodes = vm.nodes
    .map((n) => {
      const r = n.ring === -1 ? 22 : n.ring === 0 ? 20 : 18;
      return nodeMarkup(n, r);
    })
    .join("");
  return `${svgOpen(380, 372, "关系图谱")}${edges}${nodes}</svg>`;
}

function renderTree(npcs: readonly NpcState[]): string {
  const vm = treeVM(npcs);
  /** 正交折线 → 逐段 <line>，每段各自挂属性（E2E 用 `svg line` 数连线，必须保持 line 元素而非 path）。 */
  const segments = (points: Array<[number, number]>, dx: number, dy: number, attrs: string): string =>
    points
      .slice(1)
      .map(([x, y], i) => {
        const [px, py] = points[i]!;
        return `<line x1="${px + dx}" y1="${py + dy}" x2="${x + dx}" y2="${y + dy}" ${attrs}`;
      })
      .join("");
  const edges = vm.edges
    .map((e) => {
      // 婚姻双线 = 同一折线画两遍，垂直方向错开 3px（竖段则横向错开）。
      // 注意不包 <g>：E2E 用 `[data-relations-chart] svg g` 数节点，边不能混进同一选择器。
      const opacity = bondToOpacity(e.bond);
      const color = TAG_COLORS[e.tag];
      if (e.kind === "marriage") {
        const vertical = Math.abs(e.points[0]![0] - e.points[e.points.length - 1]![0]) < 8;
        const off = 3;
        const attrs = `stroke="${color}" stroke-width="1.5" stroke-linecap="round" opacity="${opacity}" data-edge="marriage"/>`;
        return segments(e.points, vertical ? -off : 0, vertical ? 0 : -off, attrs) + segments(e.points, vertical ? off : 0, vertical ? 0 : off, attrs);
      }
      const dash = e.kind === "bond" ? ' stroke-dasharray="5 4"' : "";
      const attrs = `stroke="${color}" stroke-width="${e.width}" stroke-linecap="round" opacity="${opacity}"${dash} data-edge="${e.kind}"/>`;
      return segments(e.points, 0, 0, attrs);
    })
    .join("");
  const nodes = vm.nodes.map((n) => nodeMarkup(n, n.ring === -1 ? 22 : 19)).join("");
  const bus = vm.busLines
    .map(
      (d) =>
        `<path d="${d}" fill="none" stroke="var(--ink-3,#6f6a5e)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.55" data-edge="bus"/>`,
    )
    .join("");
  const rule = `<line x1="${TREE.left - 10}" y1="${TREE_ROW_Y[3]! + 40}" x2="${TREE.right + 10}" y2="${TREE_ROW_Y[3]! + 40}" stroke="var(--rule,#dcd6c6)" stroke-width="1" opacity="0.8"/>`;
  return `${svgOpen(TREE.w, TREE.h, "家谱树")}${rule}${bus}${edges}${nodes}</svg>`;
}
