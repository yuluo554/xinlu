import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { load as loadYaml } from "js-yaml";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

/** 收集对象树里所有 name 字段值，断言无裸 `: `（YAML 纯量含 `: ` 会让 GitHub 整份解析失败、jobs=0）。 */
function collectNames(node: unknown, out: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const item of node) collectNames(item, out);
  } else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (key === "name" && typeof value === "string") out.push(value);
      else collectNames(value, out);
    }
  }
  return out;
}

describe("CI workflow 结构门", () => {
  const doc = loadYaml(readFileSync(`${ROOT}/.github/workflows/ci.yml`, "utf8")) as {
    name: string;
    on: Record<string, unknown>;
    jobs: Record<string, { name?: string; steps: Array<{ name?: string; run?: string; uses?: string }> }>;
  };

  it("YAML 可解析且至少有 layout / test 两个 job", () => {
    expect(doc.name).toBeTruthy();
    expect(Object.keys(doc.jobs)).toEqual(expect.arrayContaining(["layout", "test"]));
  });

  it("layout job 两条方法论门步骤在位（布局门 + 脱敏门）", () => {
    const runs = doc.jobs.layout!.steps.map((s) => s.run ?? "");
    expect(runs).toContain("node tools/check-sprint-layout.mjs");
    expect(runs).toContain("node tools/check-desensitized.mjs");
  });

  it("test job 跑 vitest 且跨 node 版本矩阵", () => {
    const testJob = doc.jobs.test as unknown as {
      strategy: { matrix: { node: number[] } };
      steps: Array<{ run?: string }>;
    };
    expect(testJob.strategy.matrix.node.length).toBeGreaterThanOrEqual(2);
    const runs = testJob.steps.map((s) => s.run ?? "");
    expect(runs.some((r) => r.includes("npm test"))).toBe(true);
    expect(runs.some((r) => r.includes("npm ci"))).toBe(true);
  });

  it("所有 step/job 的 name 值不含裸 `: `（防 YAML 解析失败 jobs=0）", () => {
    for (const name of collectNames(doc)) {
      expect(name, `name 值含裸冒号: ${name}`).not.toMatch(/:\s/);
    }
  });
});
