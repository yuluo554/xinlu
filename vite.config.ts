import { defineConfig } from "vitest/config";

export default defineConfig({
  // 相对 base：构建产物须同构可跑于 Pages 项目页子路径（…github.io/xinlu/）与本地静态服务
  base: "./",
  test: {
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    environment: "node",
  },
});
