// 变异自检（v5-M3''''）：逐条改判据靶面 → 断言报红 → 还原 → 断言复绿。
// 覆盖本棒三块新增判据：图谱双视图与节点详情（relations）、语义配图（scenes + scene-map）、
// 轻量线索（clues + clues.json）。纪律同前棒：改完必须真红，复原必须真绿，否则记「未红」。
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VITEST = join(ROOT, "node_modules", "vitest", "vitest.mjs");

const FILES = {
  relations: "src/ui/relations.ts",
  screens: "src/ui/screens.ts",
  scenes: "src/ui/scenes.ts",
  sceneMap: "src/data/scene-map.json",
  clues: "src/engine/clues.ts",
  cluesJson: "src/data/clues.json",
  validate: "scripts/validate-data.mjs",
};
const orig = Object.fromEntries(Object.entries(FILES).map(([k, p]) => [k, readFileSync(p, "utf8")]));
const restore = () => {
  for (const [k, p] of Object.entries(FILES)) writeFileSync(p, orig[k]);
};
const run = (cmd, args) => {
  try {
    execFileSync(cmd, args, { stdio: "pipe" });
    return 0;
  } catch (e) {
    return e.status ?? 1;
  }
};
const cases = [];
function expectRed(name, mutate, testFile) {
  restore();
  mutate();
  const changed = Object.entries(FILES).some(([k, p]) => readFileSync(p, "utf8") !== orig[k]);
  if (!changed) throw new Error(`${name}: 变异未真正改到文件（变异空转）`);
  const code = run(process.execPath, [VITEST, "run", testFile]);
  cases.push([name, code === 0 ? "PASS(未红!)" : "FAIL(报红✓)", code]);
  restore();
  for (const [k, p] of Object.entries(FILES)) {
    if (readFileSync(p, "utf8") !== orig[k]) throw new Error(`${name}: 还原后与原文不一致`);
  }
  const code2 = run(process.execPath, [VITEST, "run", testFile]);
  cases.push([`${name} → 复原`, code2 === 0 ? "绿✓" : "复原后仍红!", code2]);
}
const patch = (key, fn) => {
  const next = fn(orig[key]);
  if (next === orig[key]) throw new Error(`变异未命中 ${key} 的锚点`);
  writeFileSync(FILES[key], next);
};

// ── 3.1 图谱双视图 ──
// 1. 树视图层级：把祖辈行与父母行的 y 对调 → 层级 y 序断言必红
expectRed(
  "图谱（树层级 y 序反转）",
  () => patch("relations", (s) => s.replace("const TREE_ROW_Y = [46, 126, 212, 296] as const;", "const TREE_ROW_Y = [126, 46, 212, 296] as const;")),
  "src/ui/relations.test.ts",
);
// 2. 玩家不再居中（顶到最左）→ 正中断言必红
expectRed(
  "图谱（玩家偏离中轴）",
  () =>
    patch("relations", (s) =>
      s.replace(
        `    x: Math.round((TREE.left + TREE.right) / 2),\n    y: TREE_ROW_Y[2]!,\n    layer: 2,`,
        `    x: TREE.left,\n    y: TREE_ROW_Y[2]!,\n    layer: 2,`,
      ),
    ),
  "src/ui/relations.test.ts",
);
// 3. 婚姻连线不再画双线（只画一条）→ 双线断言必红
expectRed(
  "图谱（婚姻双线退化为单线）",
  () =>
    patch("relations", (s) =>
      s.replace(
        "return segments(e.points, vertical ? -off : 0, vertical ? 0 : -off, attrs) + segments(e.points, vertical ? off : 0, vertical ? 0 : off, attrs);",
        "return segments(e.points, vertical ? -off : 0, vertical ? 0 : -off, attrs);",
      ),
    ),
  "src/ui/relations.test.ts",
);
// 4. 节点详情丢掉变化记录（回查逻辑清空）→ 详情断言必红
expectRed(
  "图谱（节点详情丢变化记录）",
  () =>
    patch("relations", (s) =>
      s.replace(
        "    if (!event || typeof delta !== \"number\" || delta === 0) continue;",
        "    if (!event || typeof delta !== \"number\" || delta === 0) continue;\n    continue;",
      ),
    ),
  "src/ui/relations.test.ts",
);

// ── 3.2 语义配图 ──
// 5. 覆盖门：把一半映射删掉（降到 60% 以下）→ scenes 覆盖断言 + validate S.COVER 必红
expectRed(
  "配图（覆盖跌破 60%）",
  () => {
    const m = JSON.parse(orig.sceneMap);
    const keys = Object.keys(m.keyTag);
    for (const k of keys.slice(0, Math.ceil(keys.length * 0.6))) delete m.keyTag[k];
    writeFileSync(FILES.sceneMap, JSON.stringify(m, null, 2) + "\n");
  },
  "src/ui/scenes.test.ts",
);
// 6. 死键：映射表塞一个 icon-map 里不存在的 objectKey → 死键断言 + validate S.KEY 必红
expectRed(
  "配图（keyTag 死键）",
  () => {
    const m = JSON.parse(orig.sceneMap);
    m.keyTag["no-such-icon-key"] = "home";
    writeFileSync(FILES.sceneMap, JSON.stringify(m, null, 2) + "\n");
  },
  "src/ui/scenes.test.ts",
);
// 7. 取图不稳定：改成随机取（同事件每次可能不同）→ 确定性断言必红
expectRed(
  "配图（取图非确定）",
  () =>
    patch("scenes", (s) =>
      s.replace(
        "  return list[variantIndex(eventId, list.length)]!;",
        "  return list[Math.floor(Math.random() * list.length)]!;",
      ),
    ),
  "src/ui/scenes.test.ts",
);
// 8. 尺寸：把变体砍到 1 张（多张变体成摆设）→ 每类 ≥2 张断言必红
expectRed(
  "配图（每类只剩 1 张变体）",
  () => {
    const m = JSON.parse(orig.sceneMap);
    for (const tag of Object.keys(m.tags)) m.tags[tag] = m.tags[tag].slice(0, 1);
    writeFileSync(FILES.sceneMap, JSON.stringify(m, null, 2) + "\n");
  },
  "src/ui/scenes.test.ts",
);

// ── 3.3 轻量线索 ──
// 9. 判定忽略阶段门槛（线索跨阶段补播）→ 「阶段不符不出」断言必红
expectRed(
  "线索（判定忽略阶段门槛）",
  () =>
    patch("clues", (s) =>
      s.replace("    if (stageIndexOf(clue.stage) !== state.stageIndex) continue;", "    // 变异：去掉阶段门槛"),
    ),
  "src/engine/clues.test.ts",
);
// 10. 落定解读改成改三观（不再是纯 flag）→ 「不动判定核」断言必红
expectRed(
  "线索（落定改三观）",
  () =>
    patch("clues", (s) =>
      s.replace(
        "  return { ...state, flags: state.flags.concat(choice.flag) };",
        "  return { ...state, flags: state.flags.concat(choice.flag), values3: { ...state.values3, worldview: state.values3.worldview + 1 } };",
      ),
    ),
  "src/engine/clues.test.ts",
);
// 11. 解锁事件的 pre 被摘掉（线索写了 flag 却不改变任何事）→ 数据面断言必红
expectRed(
  "线索（解锁事件丢失 pre 门槛）",
  () => {
    const m = JSON.parse(orig.cluesJson);
    // 只改数据：让第一条线索的解锁事件 id 指向一个不含该 flag 的 pre 的事件
    m.clues[0].unlockEventIds = ["childhood-001", "childhood-003"];
    writeFileSync(FILES.cluesJson, JSON.stringify(m, null, 2) + "\n");
  },
  "src/engine/clues.test.ts",
);
// 12. 每阶段塞两条线索（>1 处）→ validate C.DENSITY 必红（走脚本，不跑 vitest）
{
  restore();
  const m = JSON.parse(orig.cluesJson);
  m.clues.push({ ...m.clues[0], id: "clue-childhood-02", choices: [{ text: "第二个解读", flag: "clue-dup-a" }, { text: "第三个解读", flag: "clue-dup-b" }] });
  writeFileSync(FILES.cluesJson, JSON.stringify(m, null, 2) + "\n");
  const code = run(process.execPath, [join(ROOT, "scripts", "validate-data.mjs"), "--full"]);
  cases.push(["线索（每阶段 2 处）", code === 0 ? "PASS(未红!)" : "FAIL(报红✓)", code]);
  restore();
  const code2 = run(process.execPath, [join(ROOT, "scripts", "validate-data.mjs"), "--full"]);
  cases.push(["线索（每阶段 2 处）→ 复原", code2 === 0 ? "绿✓" : "复原后仍红!", code2]);
}

// ── 汇总 ──
console.log("变异自检 · v5-M3''''");
console.log("=".repeat(56));
for (const [name, verdict, code] of cases) {
  console.log(`${verdict.padEnd(14)} ${name}  (exit ${code})`);
}
const bad = cases.filter(([, v]) => v.includes("未红") || v.includes("仍红"));
console.log("=".repeat(56));
console.log(bad.length === 0 ? `结论: ${cases.length} 项全符合预期` : `结论: ${bad.length} 项异常 → ${bad.map(([n]) => n).join("、")}`);
process.exitCode = bad.length === 0 ? 0 : 1;
