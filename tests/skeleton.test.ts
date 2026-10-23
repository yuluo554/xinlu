import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const read = (rel: string) => readFileSync(`${ROOT}/${rel}`, "utf8");

describe("M0 骨架完整性", () => {
  it("index.html 挂载点与入口脚本在位", () => {
    const html = read("index.html");
    expect(html).toContain('id="app"');
    expect(html).toContain('/src/main.ts');
    expect(html).toContain('lang="zh-CN"');
  });

  it("src/main.ts 消费 #app 挂载点", () => {
    expect(read("src/main.ts")).toContain('#app"');
  });

  it("零运行时依赖红线：dependencies 恒为空", () => {
    const pkg = JSON.parse(read("package.json")) as {
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    expect(Object.keys(pkg.dependencies ?? {})).toEqual([]);
    expect(Object.keys(pkg.peerDependencies ?? {})).toEqual([]);
  });

  it("开发脚本齐备（dev/build/preview/test/typecheck）", () => {
    const scripts = (JSON.parse(read("package.json")) as { scripts: Record<string, string> }).scripts;
    for (const key of ["dev", "build", "preview", "test", "typecheck"]) {
      expect(scripts[key], `package.json scripts 缺 ${key}`).toBeTruthy();
    }
  });
});
