// 结局可达性扫描门防回退测试 · 剔除模式（v2-M1' 1.3 · B1）。
// 口径单源：plan/v2/02 §五——「删掉补齐事件，扫描必须报不可达」（回归防线）。
// vitest 走 vite 模块管线，node:module 钩子拦不到 JSON 加载——此处用 vi.mock 剔除
// （与 CLI 的 registerB1ExcludeHooks 共用同一份 V2_B1_EVENT_IDS 清单单源）；
// 与全量模式 tests/reachability-full.test.ts 靠 vitest 模块隔离互不污染。
import { describe, expect, it, vi } from "vitest";
import { runScan } from "../scripts/check-ending-reachability.mjs";

vi.mock("../src/data/events.json", async (importOriginal) => {
  const actual = await importOriginal();
  const { V2_B1_EVENT_IDS } = await import("../scripts/check-ending-reachability.mjs");
  return {
    default: (actual as { default: Array<{ id: string }> }).default.filter(
      (e) => !V2_B1_EVENT_IDS.includes(e.id)
    ),
  };
});

describe("结局可达性扫描门 · 剔除 B1 补齐事件（防回退）", () => {
  it("删掉补齐事件后 end-04/05/07 回归不可达（补齐事件被删/被改坏本测试必红）", async () => {
    const { hits, unreachable } = await runScan();
    expect(unreachable, "剔除补齐事件后应存在不可达结局").toEqual(
      expect.arrayContaining(["end-04", "end-05", "end-07"])
    );
    for (const id of ["end-04", "end-05", "end-07"]) {
      expect(hits.get(id)!.length, `${id} 剔除后应 0/96 组命中`).toBe(0);
    }
  });
});
