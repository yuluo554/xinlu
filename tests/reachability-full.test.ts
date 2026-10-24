// 结局可达性扫描门测试 · 全量模式（v2-M1' 1.3 · B1 起建；v3-M1'' 升级）。
// 口径单源：plan/v2/02 §五 + plan/v3/02 ▸ M1'' 增补——轴空间扫描（96 环境 × 26 轴权重），
// 目标 = 8 条件结局 + 兜底全可达。剔除模式在 tests/reachability-regression.test.ts
// （vitest 模块隔离，剔除钩子必须在引擎首载前注册，两种模式不能同进程混跑）。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { V3_GUARD_EVENT_IDS, runScan } from "../scripts/check-ending-reachability.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const ALL_ENDINGS = ["end-01", "end-02", "end-03", "end-04", "end-05", "end-06", "end-07", "end-08", "end-fallback"];

describe("结局可达性扫描门 · 全量（v2/02 §五 + v3 轴空间）", () => {
  it(
    "全量事件下 9 结局（8 条件 + 兜底）全可达",
    { timeout: 300_000 },
    async () => {
      const { hits, unreachable } = await runScan();
      expect(unreachable, `不可达结局：${unreachable.join(", ")}`).toEqual([]);
      expect([...hits.keys()]).toEqual(ALL_ENDINGS);
      for (const id of ALL_ENDINGS) {
        expect(hits.get(id)!.length, `${id} 应至少 1/2496 组命中`).toBeGreaterThan(0);
      }
    },
  );

  it("防回退清单里的 id 全部真实存在（清单漂移会让剔除空转、防回退变绿）", () => {
    expect(V3_GUARD_EVENT_IDS.length).toBeGreaterThan(0);
    const events = JSON.parse(readFileSync(`${ROOT}/src/data/events.json`, "utf8")) as Array<{ id: string }>;
    const known = new Set(events.map((e) => e.id));
    for (const id of V3_GUARD_EVENT_IDS) {
      expect(known.has(id), `清单 id ${id} 不在 events.json 中（剔除会空转）`).toBe(true);
    }
  });
});
