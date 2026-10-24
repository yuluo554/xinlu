// 结局可达性扫描门防回退测试 · 剔除模式（v2-M1' 1.3 · B1 起建；v3-M1'' 换锚）。
// 口径单源：plan/v2/02 §五 + plan/v3/02 ▸ M1'' 增补——「删掉承重事件，扫描必须报不可达」。
// v2 的 B1 清单在 v3 事件池扩容后不再是承重墙（剔除后仍全可达，2026-10-24 实测留痕）；
// v3 锚点 = wanderlust flag 唯一来源 teen-003：剔除后 end-03 必须回归不可达（单点守护）。
// vitest 走 vite 模块管线，node:module 钩子拦不到 JSON 加载——此处用 vi.mock 剔除
// （与 CLI 的 registerGuardExcludeHooks 共用同一份 V3_GUARD_EVENT_IDS 清单单源）；
// 与全量模式 tests/reachability-full.test.ts 靠 vitest 模块隔离互不污染。
import { describe, expect, it, vi } from "vitest";
import { runScan } from "../scripts/check-ending-reachability.mjs";

vi.mock("../src/data/events.json", async (importOriginal) => {
  const actual = await importOriginal();
  const { V3_GUARD_EVENT_IDS } = await import("../scripts/check-ending-reachability.mjs");
  return {
    default: (actual as { default: Array<{ id: string }> }).default.filter(
      (e) => !V3_GUARD_EVENT_IDS.includes(e.id)
    ),
  };
});

describe("结局可达性扫描门 · 剔除承重事件（防回退）", () => {
  it(
    "删掉 teen-003（wanderlust 唯一来源）后 end-03 回归不可达（承重事件被删/被改坏本测试必红）",
    { timeout: 300_000 },
    async () => {
      const { hits, unreachable } = await runScan();
      expect(unreachable, "剔除承重事件后应存在不可达结局").toContain("end-03");
      expect(hits.get("end-03")!.length, "end-03 剔除后应 0/2496 组命中").toBe(0);
    },
  );
});
