// 关系图谱渲染单测（v3-M3'' 3.1 · plan/v3/03 §4 验收：节点数=在册 NPC、bond→宽度映射、tag 配色、快照序列化非空）。
import { describe, expect, it } from "vitest";
import type { NpcState } from "../engine/model";
import { NPC_PROFILES, bondToWidth, relationsVM, renderRelations } from "./relations";

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
