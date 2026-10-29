import { defineConfig } from "vitest/config";

export default defineConfig({
  // 相对 base：构建产物须同构可跑于 Pages 项目页子路径（…github.io/xinlu/）与本地静态服务
  base: "./",
  build: {
    // 场景配图（AVIF，2–13KB）必须**各自成文件**：Vite 默认把 <4KB 的资源内联成 base64，
    // 会把 33% 的体积塞进 JS 主干，还让 loading="lazy" 失效（图随脚本一起到）。
    // 只对 .avif 关内联；其余小资源（250 枚图标 SVG）保持默认内联——它们内联更省
    // （逐个成文件会为每份加 gzip 头，实测总量反而涨 40KB）。判据见 docs/v5-M9-scene-webp.md §三。
    assetsInlineLimit: (filePath) => (filePath.endsWith(".avif") ? false : undefined),
  },
  test: {
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    environment: "node",
  },
});
