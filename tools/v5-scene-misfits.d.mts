// tools/v5-scene-misfits.mjs 的类型声明（该模块为 node 原生执行的 .mjs；
// 消费者 = tools/v5-scene-audit.mjs（只读报告）与 tools/v5-scenes-doc.mjs（生成留痕）+ tests/scene-misfits.test.ts（棘轮）。
export declare const OFF_SCENE: Record<string, string[]>;
export declare const OFF_SCENE_KEYS: string[];
export declare const OFF_SCENE_TIER: { tier1: string[]; tier2: string[] };
