#!/usr/bin/env node
// 线索解锁事件的图标对照补录（v5-M3'''' 3.3 副产物）：icon-map.json 必须 100% 覆盖事件 id（validate I.COVER）。
// 只复用已入库的 Game-Icons 图标名（不新增素材、不动白名单），逐条按「文本核心物件」选：
//   字条/作业纸 → secret-book（纸条夹在书页里）；信封/来信 → envelope；凌晨楼道 → night-sleep；
//   旧项圈/狗碗 → paw-print；没寄的信 → love-letter；票根/铁盒 → photo-camera（旧照片与票根同盒）。
// 幂等：已存在的 id 跳过。用法：node tools/v5-add-clues-icons.mjs [--dry]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PATH = resolve(ROOT, "src/data/icon-map.json");
const DRY = process.argv.includes("--dry");

const ICONS = {
  "childhood-018": "secret-book",
  "childhood-020": "secret-book",
  "teen-018": "envelope",
  "teen-020": "envelope",
  "youth-018": "night-sleep",
  "youth-020": "night-sleep",
  "adult-018": "paw-print",
  "adult-020": "paw-print",
  "midlife-018": "love-letter",
  "midlife-020": "love-letter",
  "elder-404": "photo-camera",
  "elder-405": "photo-camera",
};

const iconMap = JSON.parse(readFileSync(PATH, "utf8"));
let added = 0;
for (const [id, objectKey] of Object.entries(ICONS)) {
  if (id in iconMap) continue;
  iconMap[id] = { objectKey };
  added += 1;
}
if (!DRY) writeFileSync(PATH, JSON.stringify(iconMap, null, 2) + "\n");
process.stdout.write(`${DRY ? "[dry] " : ""}线索事件图标对照：新增 ${added} 条，对照表共 ${Object.keys(iconMap).length} 条\n`);
