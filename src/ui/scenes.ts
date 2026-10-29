// 语义配图（plan/v5/02 §九 D9）：事件 → 语义标签 → 场景图。
//
// 映射单源 = src/data/scene-map.json（由 tools/v5-gen-scene-map.mjs 从 icon-map 的 objectKey 派生，
// 因此「这条事件的配图贴不贴文案」继承 v4 逐条核过的图标结论，不再是二次猜测）。
// 取图规则：同一标签有多张变体时，按事件 id 的稳定哈希轮换——**同一事件恒同一张图**（可复现），
// 不同事件分散到该类的各张图上（不出现「全场都用第一张」）。
//
// 未命中 = 显式豁免：返回 null，调用方不渲染配图区、不留空框（v5/02 §九）。
// 本模块零 DOM、零依赖；图是静态 SVG 资源（K2：不经运行时库）。
import sceneMapRaw from "../data/scene-map.json" with { type: "json" };

interface SceneMapFile {
  _meta?: string;
  tags: Record<string, string[]>;
  keyTag: Record<string, string>;
  /** v5.0.2：objectKey → 指定变体（异质变体不再哈希轮换；语义错配修复，见 tools/v5-gen-scene-map.mjs KEY_PIN）。 */
  keyPin?: Record<string, string>;
}

const MAP = sceneMapRaw as unknown as SceneMapFile;

/** 语义标签封闭枚举（键序 = scene-map.json 的 tags 键序；validate S.TAG 守门）。 */
export const SCENE_TAGS = Object.keys(MAP.tags);
export type SceneTag = string;

/** 全部场景图文件名（validate S.FILE 与预算核对共读）。 */
export const SCENE_FILES: readonly string[] = Object.values(MAP.tags).flat();

/** 事件 id 的稳定哈希（FNV-1a 32 位；纯函数，同输入恒同输出）。 */
function hashOf(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/**
 * 同标签多张变体的选取位：取哈希的**高位**（>>>16）。
 * 低比特与事件 id 的尾部字符强相关（同阶段的事件 id 只差末两位），实测 `hash % 2` 会让
 * rain 的 3 条事件全落在同一张、meal 的 4 条里 3 条撞一起——多张变体形同摆设。高位分布才匀。
 */
function variantIndex(id: string, count: number): number {
  return (hashOf(id) >>> 16) % count;
}

/**
 * 事件的语义标签：objectKey → tag；未命中返回 null（显式豁免）。
 * @param objectKey 该事件的图标名（icon-map.json 的 objectKey；null = 图标层已豁免）
 */
export function sceneTagOf(objectKey: string | null | undefined): SceneTag | null {
  if (!objectKey) return null;
  return MAP.keyTag[objectKey] ?? null;
}

/**
 * 事件该用哪张场景图（文件名）；豁免返回 null。
 * v5.0.2：objectKey 命中 `keyPin` 时用指定变体（异质变体不做哈希轮换，避免「猫图配狗事件」）；
 * 未命中才按事件 id 哈希高位轮换。pin 的变体名解析为 `${tag}-${variant}.<ext>`，
 * 解析不到（表写错/图被删）时**回落到哈希轮换**而非返回 null——宁可旧错配也不静默丢配图。
 * @param eventId 事件 id（用于在同标签的多张变体间稳定轮换）
 * @param objectKey 该事件的图标名
 */
export function sceneFileOf(eventId: string, objectKey: string | null | undefined): string | null {
  const tag = sceneTagOf(objectKey);
  if (!tag) return null;
  const list = MAP.tags[tag];
  if (!list || list.length === 0) return null;
  if (objectKey && MAP.keyPin) {
    const variant = MAP.keyPin[objectKey];
    if (variant) {
      const pinned = list.find((f) => f === `${tag}-${variant}.avif` || f === `${tag}-${variant}.svg`);
      if (pinned) return pinned;
    }
  }
  return list[variantIndex(eventId, list.length)]!;
}

/** 有配图的事件数 / 总数（门与文档同源，不各算一遍）。 */
export function sceneCoverage(objectKeys: ReadonlyArray<{ id: string; objectKey: string | null }>): {
  covered: number;
  total: number;
  ratio: number;
  exempt: string[];
} {
  const exempt: string[] = [];
  let covered = 0;
  for (const row of objectKeys) {
    if (sceneTagOf(row.objectKey)) covered += 1;
    else exempt.push(row.id);
  }
  return { covered, total: objectKeys.length, ratio: objectKeys.length ? covered / objectKeys.length : 0, exempt };
}
