// scripts/check-ending-reachability.mjs 的类型声明（该脚本为 node 原生执行的 .mjs，
// 类型面只承诺给测试进程内调用的导出；CLI 行为见脚本头注释）。
export declare const V3_GUARD_EVENT_IDS: string[];
/** 注册剔除防回退承重事件的 node:module 加载钩子；仅 CLI 路径使用（vitest 走 vite 管线用 vi.mock）。 */
export declare function registerGuardExcludeHooks(): void;
/** 引擎级 2496 组扫描（v3：96 环境 × 26 轴权重）；返回各结局命中组与不可达清单。 */
export declare function runScan(): Promise<{
  hits: Map<string, string[]>;
  unreachable: string[];
}>;
