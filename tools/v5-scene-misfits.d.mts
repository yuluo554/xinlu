// tools/v5-scene-misfits.mjs 的类型声明（该模块为 node 原生执行的 .mjs；
// 消费者 = tools/v5-scene-audit.mjs（只读报告）+ tools/v5-scenes-doc.mjs（生成留痕）+ tests/scene-misfits.test.ts（棘轮）。
export declare const OFF_SCENE: Record<string, string[]>;
export declare const OFF_SCENE_KEYS: string[];
/** v5-M6 修复留痕（一级摘出 / 二级改挂 / 退役标签 / 修复后实测值）。 */
export declare const OFF_SCENE_FIXED: {
  tier1Removed: string[];
  tier2Retargeted: Record<string, string[]>;
  retiredTags: string[];
  after: { misfitKeys: number; misfitEvents: number; coverage: string; exempt: number; images: string };
};