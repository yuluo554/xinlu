// scripts/check-ending-reachability.mjs 的类型声明（该脚本为 node 原生执行的 .mjs，
// 类型面只承诺给测试进程内调用的导出；CLI 行为见脚本头注释）。
export declare const V2_B1_EVENT_IDS: string[];
/** 注册剔除 B1 补齐事件的 node:module 加载钩子；仅 CLI 路径使用（vitest 走 vite 管线用 vi.mock）。 */
export declare function registerB1ExcludeHooks(): void;
/** 引擎级 96 组扫描（6 环境 × 16 权重）；返回各结局命中组与不可达清单。 */
export declare function runScan(): Promise<{
  hits: Map<string, string[]>;
  unreachable: string[];
}>;
