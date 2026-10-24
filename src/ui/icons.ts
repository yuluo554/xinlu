// Game-Icons 图标注册表（plan/v3/02 §九）：事件对照单源是 src/data/icon-map.json（validate I 区守门），
// 本模块只负责把 assets/game-icons/ 下的 SVG 解析成可内联的 URL（CSS mask 着色，currentColor 跟随线别色）。
import iconMapJson from "../data/icon-map.json" with { type: "json" };

const urls = import.meta.glob("../../assets/game-icons/icons/**/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const byName: Record<string, string> = {};
for (const [path, url] of Object.entries(urls)) {
  const file = path.split("/").pop()!;
  byName[file.replace(/\.svg$/, "")] = url;
}

/** 事件 id → 图标名（对照表数据件，M2'' 2.1 入库）。 */
export const EVENT_ICONS = iconMapJson as Record<string, string>;

export function iconUrl(name: string): string {
  return byName[name] ?? "";
}

/** 内联 style 片段：`--gi:url("…")`。双引号包裹——vite 的 svg data-URI 内含单引号（xmlns='…'），
 *  单引号包裹会在内嵌引号处截断；调用方须对返回值做 esc() 再进 HTML 属性（含双引号）。 */
export function iconStyle(name: string): string {
  const url = iconUrl(name);
  return url ? `--gi:url("${url}")` : "";
}
