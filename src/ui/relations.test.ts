// 关系图谱渲染单测（v3-M3'' 3.1 · plan/v3/03 §4 验收：节点数=在册 NPC、bond→宽度映射、tag 配色、快照序列化非空）。
// v5-M3'''' 3.1 增量（plan/v5/02 §八）：家谱树布局（层级 y 序 + 确定性）、双视图切换、节点详情（bondDeltas 回溯）。
import { describe, expect, it } from "vitest";
import type { HistoryEntry, NpcState } from "../engine/model";
import { NPC_PROFILES, bondToOpacity, bondToWidth, relationDetail, relationsVM, renderRelations, treeVM } from "./relations";

const BASE: NpcState[] = [
  { id: "mother", bond: 70, tag: "亲密" },
  { id: "father", bond: 70, tag: "亲密" },
];

describe("relationsVM（环形布局确定性）", () => {
  it("节点数 = 在册 NPC + 中心玩家本人", () => {
    const vm = relationsVM(BASE);
    expect(vm.nodes.length).toBe(3);
    expect(vm.edges.length).toBe(2);
    const grown = relationsVM([...BASE, { id: "bestie", bond: 80, tag: "亲密" }]);
    expect(grown.nodes.length).toBe(4);
  });

  it("父母（fate）内环、支线外环按线分区", () => {
    const vm = relationsVM([
      ...BASE,
      { id: "partner", bond: 60, tag: "亲密" },
      { id: "bestie", bond: 40, tag: "疏离" },
    ]);
    const mother = vm.nodes.find((n) => n.id === "mother")!;
    const partner = vm.nodes.find((n) => n.id === "partner")!;
    const bestie = vm.nodes.find((n) => n.id === "bestie")!;
    expect(mother.ring).toBe(0);
    expect(NPC_PROFILES[mother.id]!.line).toBe("fate");
    expect(partner.ring).toBe(1);
    expect(NPC_PROFILES[partner.id]!.line).toBe("love");
    expect(bestie.ring).toBe(1);
    // 同在外环的两个 NPC 位置不同（布局无重叠）
    expect([partner.x, partner.y]).not.toEqual([bestie.x, bestie.y]);
  });

  it("同一状态恒同布局（确定性，快照可复现）", () => {
    const npcs = [...BASE, { id: "doctor", bond: 55, tag: "亲密" } as const];
    expect(JSON.stringify(relationsVM(npcs))).toBe(JSON.stringify(relationsVM(npcs)));
  });
});

describe("家庭槽位标签（plan/v5/02 §一：role 逐位命名，禁泛称）", () => {
  const SLOTTED: NpcState[] = [
    { id: "mother", bond: 70, tag: "亲密", name: "刘诗涵", slot: "parent-mother" },
    { id: "father", bond: 70, tag: "亲密", name: "朱瑞霖", slot: "parent-father" },
    { id: "grandma", bond: 60, tag: "亲密", name: "朱桂英", slot: "gp-maternal-grandma" },
    { id: "grandpa", bond: 60, tag: "亲密", name: "朱长林", slot: "gp-maternal-grandpa" },
    { id: "sibling-1", bond: 65, tag: "亲密", name: "朱书瑶", slot: "sib-older-sister" },
  ];

  it("有槽位时 role 直取槽位表（母亲/父亲/外婆/外公/姐姐）", () => {
    const vm = relationsVM(SLOTTED);
    const roleOf = (id: string) => vm.nodes.find((n) => n.id === id)!.role;
    expect(roleOf("mother")).toBe("母亲");
    expect(roleOf("father")).toBe("父亲");
    expect(roleOf("grandma")).toBe("外婆"); // 南方侧系 = maternal
    expect(roleOf("grandpa")).toBe("外公");
    expect(roleOf("sibling-1")).toBe("姐姐");
  });

  it("无槽位（旧档未回填/非家庭成员）回落注册表 role，不崩", () => {
    const vm = relationsVM(BASE);
    expect(vm.nodes.find((n) => n.id === "mother")!.role).toBe("母亲");
    expect(vm.nodes.find((n) => n.id === "father")!.role).toBe("父亲");
  });

  it("SVG 标签落到产物里；泛称「父母/祖辈/同辈」不出现", () => {
    const svg = renderRelations(SLOTTED);
    for (const role of ["母亲", "父亲", "外婆", "外公", "姐姐"]) expect(svg).toContain(role);
    for (const generic of ["父母", "祖辈", "同辈"]) expect(svg).not.toContain(generic);
  });
});

describe("bondToWidth（02 §五：连线宽度 = bond 映射 [1,6]px）", () => {
  it("两端与中段", () => {
    expect(bondToWidth(0)).toBe(1);
    expect(bondToWidth(50)).toBe(3.5);
    expect(bondToWidth(100)).toBe(6);
  });

  it("越界入参按边界钳制", () => {
    expect(bondToWidth(-10)).toBe(1);
    expect(bondToWidth(140)).toBe(6);
  });
});

describe("renderRelations（SVG 快照序列化）", () => {
  it("快照非空且含中心与父母名；graph 无脚本无外链", () => {
    const svg = renderRelations(BASE);
    expect(svg.length).toBeGreaterThan(0);
    expect(svg).toContain("你");
    expect(svg).toContain("妈妈");
    expect(svg).toContain("爸爸");
    expect(svg).not.toContain("<script");
    expect(svg).not.toContain("http://127.0.0.1");
  });

  it("连线宽度与 tag 颜色落在产物里", () => {
    const npcs: NpcState[] = [...BASE, { id: "bestie", bond: 100, tag: "羁绊" }];
    const svg = renderRelations(npcs);
    expect(svg).toContain('stroke-width="6"');
    expect(svg).toContain('stroke="#b4436c"'); // 羁绊
  });

  it("未注册 id 不崩（兜底档案渲染）", () => {
    const svg = renderRelations([...BASE, { id: "ghost-npc", bond: 40, tag: "疏离" }]);
    expect(svg).toContain("ghost-npc");
  });
});

describe("bondToOpacity（v5/02 §八：亲疏 = 线宽 + 透明度）", () => {
  it("随 bond 单调递增，落 [0.35, 0.95]", () => {
    expect(bondToOpacity(0)).toBeCloseTo(0.35, 2);
    expect(bondToOpacity(100)).toBeCloseTo(0.95, 2);
    expect(bondToOpacity(60)).toBeGreaterThan(bondToOpacity(30));
    expect(bondToOpacity(-20)).toBeCloseTo(0.35, 2);
    expect(bondToOpacity(200)).toBeCloseTo(0.95, 2);
  });
});

describe("家谱树（v5/02 §八 默认视图）", () => {
  const FAMILY: NpcState[] = [
    { id: "grandma", bond: 60, tag: "亲密", name: "朱桂英", slot: "gp-maternal-grandma" },
    { id: "grandpa", bond: 60, tag: "亲密", name: "朱长林", slot: "gp-maternal-grandpa" },
    { id: "mother", bond: 76, tag: "亲密", name: "刘诗涵", slot: "parent-mother" },
    { id: "father", bond: 72, tag: "亲密", name: "朱瑞霖", slot: "parent-father" },
    { id: "sibling-1", bond: 65, tag: "亲密", name: "朱书瑶", slot: "sib-older-sister" },
    { id: "partner", bond: 84, tag: "亲密" },
    { id: "bestie", bond: 70, tag: "亲密" },
  ];

  it("层级 y 序：祖辈 < 父母 < 玩家与同辈 < 伴侣与同行者", () => {
    const vm = treeVM(FAMILY);
    const yOf = (id: string) => vm.nodes.find((n) => n.id === id)!.y;
    expect(yOf("grandma")).toBeLessThan(yOf("mother"));
    expect(yOf("mother")).toBeLessThan(yOf("__you__"));
    expect(yOf("sibling-1")).toBe(yOf("__you__")); // 玩家与同辈同层
    expect(yOf("__you__")).toBeLessThan(yOf("partner"));
  });

  it("玩家恒在第 2 层正中；同辈与之同层（layer 字段机读）", () => {
    const vm = treeVM(FAMILY);
    const you = vm.nodes.find((n) => n.id === "__you__")!;
    expect(you.layer).toBe(2);
    expect(you.x).toBe(180);
    expect(vm.nodes.find((n) => n.id === "sibling-1")!.layer).toBe(2);
    expect(vm.nodes.filter((n) => n.layer === 2).length).toBe(2); // 玩家 + 姐姐
    expect(vm.nodes.find((n) => n.id === "partner")!.layer).toBe(3);
  });

  it("同状态两次渲染布局逐字节相同（确定性，快照可复现）", () => {
    expect(JSON.stringify(treeVM(FAMILY))).toBe(JSON.stringify(treeVM(FAMILY)));
    expect(renderRelations(FAMILY, "tree")).toBe(renderRelations(FAMILY, "tree"));
  });

  it("连线种类齐：婚姻双线 + 血缘实线 + 同行者关系虚线", () => {
    const vm = treeVM(FAMILY);
    const kinds = new Set(vm.edges.map((e) => e.kind));
    expect(kinds.has("marriage")).toBe(true);
    expect(kinds.has("blood")).toBe(true);
    expect(kinds.has("bond")).toBe(true);
    const svg = renderRelations(FAMILY, "tree");
    // 婚姻是**双线**：每条 marriage 边必须落两段线（父母一对 + 你与伴侣一对 = 4 段）。
    // 只断言「>=2」会漏掉「退化成单线」——本轮变异自检抓到的正是这个（>=2 在双边缘故下仍成立）。
    const marriageEdges = vm.edges.filter((e) => e.kind === "marriage").length;
    const marriageLines = (svg.match(/data-edge="marriage"/g) ?? []).length;
    expect(marriageEdges).toBeGreaterThanOrEqual(2);
    expect(marriageLines).toBe(marriageEdges * 2);
    expect(svg).toContain('stroke-dasharray="5 4"'); // 同行者关系虚线
  });

  it("双视图产物不同；ring 视图仍是曲线（path）连边", () => {
    const tree = renderRelations(FAMILY, "tree");
    const ring = renderRelations(FAMILY, "ring");
    expect(tree).not.toBe(ring);
    expect(tree).toContain("家谱树");
    expect(ring).toContain('aria-label="关系图谱"');
    expect(ring).toContain("<path d=");
  });

  it("每个非中心节点带 data-rel-node（节点详情入口）", () => {
    const svg = renderRelations(FAMILY, "tree");
    for (const id of ["grandma", "mother", "partner"]) expect(svg).toContain(`data-rel-node="${id}"`);
  });
});

describe("节点详情（关系值 + 变化记录，v5/02 §八）", () => {
  const dimsAfter = { ei: 50, sn: 50, tf: 50, jp: 50 };
  // infant-401 opt0 声明 mother +8；teen-011 三个选项都没有 bondDeltas
  const HISTORY: HistoryEntry[] = [
    { eventId: "infant-401", option: 0, dimsAfter },
    { eventId: "teen-011", option: 0, dimsAfter },
  ];

  it("从 history 回查 bondDeltas：逐条给出年龄/选项文案/增量", () => {
    const mother = relationDetail(HISTORY, BASE, "mother")!;
    expect(mother.id).toBe("mother");
    expect(mother.bond).toBe(70);
    expect(mother.records).toHaveLength(1); // teen-011 无 bondDeltas → 不入记录
    expect(mother.records[0]!.eventId).toBe("infant-401");
    expect(mother.records[0]!.delta).toBe(8);
    expect(mother.records[0]!.ageHint).toBe("6个月");
    expect(mother.records[0]!.optionText.length).toBeGreaterThan(0);
  });

  it("不在册的 id 返回 null（不虚构节点）；未知事件 id 不崩", () => {
    expect(relationDetail(HISTORY, BASE, "bestie")).toBeNull();
    const ghost: HistoryEntry[] = [{ eventId: "no-such-event", option: 0, dimsAfter }];
    expect(relationDetail(ghost, BASE, "mother")!.records).toEqual([]);
  });

  it("时代卡（kind:era，option=-1 哨兵）跳过、不误读选项", () => {
    const withEra: HistoryEntry[] = [{ eventId: "era-1955", option: -1, dimsAfter, kind: "era" }, ...HISTORY];
    expect(relationDetail(withEra, BASE, "mother")!.records).toHaveLength(1);
  });
});
