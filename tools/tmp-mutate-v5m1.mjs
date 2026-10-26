// 变异自检（随用随删）：逐条改判据靶面 → 断言报红 → 还原 → 断言字节一致。
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const FILES = {
  events: "src/data/events.json",
  slots: "src/data/family-slots.json",
  rhythm: "src/engine/rhythm.ts",
};
const orig = Object.fromEntries(Object.entries(FILES).map(([k, p]) => [k, readFileSync(p, "utf8")]));
const restore = () => { for (const [k, p] of Object.entries(FILES)) writeFileSync(p, orig[k]); };
const run = (cmd, args) => {
  try { execFileSync(cmd, args, { stdio: "pipe" }); return 0; } catch (e) { return e.status ?? 1; }
};
const cases = [];
function expectRed(name, mutate, cmd, args = []) {
  for (const [k, p] of Object.entries(FILES)) writeFileSync(p, orig[k]);
  mutate();
  const changed = Object.entries(FILES).some(([k, p]) => readFileSync(p, "utf8") !== orig[k]);
  if (!changed) throw new Error(`${name}: 变异未真正改到文件（变异空转）`);
  const code = run(cmd, args);
  cases.push([name, code === 0 ? "PASS(未红!)" : "FAIL(报红✓)", code]);
  restore();
  for (const [k, p] of Object.entries(FILES)) {
    if (readFileSync(p, "utf8") !== orig[k]) throw new Error(`${name}: 还原后与原文不一致`);
  }
  const code2 = run(cmd, args);
  cases.push([`${name} → 复原`, code2 === 0 ? "绿✓" : "复原后仍红!", code2]);
}
const patchEvents = (fn) => {
  const arr = JSON.parse(orig.events);
  fn(arr);
  writeFileSync(FILES.events, JSON.stringify(arr, null, 2) + "\n");
};
// 1. F 区：槽位 role 改泛称
expectRed("F 区（role 用泛称）", () => {
  const t = JSON.parse(orig.slots);
  t.slots["parent-mother"].role = "父母";
  writeFileSync(FILES.slots, JSON.stringify(t, null, 2) + "\n");
}, "node", ["scripts/validate-data.mjs"]);
// 2. F 区：槽位键非法
expectRed("F 区（槽位键非法）", () => {
  const t = JSON.parse(orig.slots);
  t.slots["Mother"] = t.slots["parent-mother"];
  writeFileSync(FILES.slots, JSON.stringify(t, null, 2) + "\n");
}, "node", ["scripts/validate-data.mjs"]);
// 3. E.ENC：删掉一个阶段的偶遇
expectRed("偶遇密度（删一条）", () => {
  const arr = JSON.parse(orig.events).filter((e) => e.id !== "infant-701");
  writeFileSync(FILES.events, JSON.stringify(arr, null, 2) + "\n");
}, "node", ["scripts/validate-data.mjs"]);
// 4. E.ENC：偶遇文案超 80 字
expectRed("偶遇文案超长", () => {
  patchEvents((arr) => {
    const e = arr.find((x) => x.id === "infant-702");
    // 确定越过 80 字上限（补足到 100 字以上，不依赖原句长度的巧合）
    const filler = "补".repeat(Math.max(20, 90 - [...e.text].length));
    e.text = e.text + filler;
    e.detail = e.text + "detail 余部。";
  });
}, "node", ["scripts/validate-data.mjs"]);
// 4b. E.ENC：偶遇 variant 写成 read（本棒真缺陷的防回退锚，02 §三 只认 draw|quick）
expectRed("偶遇 variant 非法（read）", () => {
  patchEvents((arr) => { const e = arr.find((x) => x.type === "encounter"); e.variant = "read"; });
}, "node", ["scripts/validate-data.mjs"]);
// 5. E.OPTIONS：四个选项
expectRed("选项数 4", () => {
  patchEvents((arr) => { const e = arr.find((x) => x.id === "infant-001"); e.options.push({ ...e.options[0], text: "第四个选项" }); });
}, "node", ["scripts/validate-data.mjs"]);
// 6. S.LEN2：主句超 180
expectRed("主句超长（S.LEN2）", () => {
  patchEvents((arr) => { const e = arr.find((x) => x.id === "infant-001"); e.detail = e.text.repeat(2); e.text = e.detail; });
}, "node", ["scripts/check-story-quality.mjs"]);
// 7. S.OPT：选项 17 字
expectRed("选项超 16 字（S.OPT）", () => {
  patchEvents((arr) => { const e = arr.find((x) => x.id === "infant-001"); e.options[0].text = "把这句话写得足够长超过十六个字上限"; });
}, "node", ["scripts/check-story-quality.mjs"]);
// 8. S.DETAIL：删掉 detail
expectRed("detail 缺失（S.DETAIL）", () => {
  patchEvents((arr) => { delete arr.find((x) => x.id === "childhood-005").detail; });
}, "node", ["scripts/check-story-quality.mjs"]);
// 9. S.DETAIL：detail 非前缀
expectRed("detail 非主句前缀", () => {
  patchEvents((arr) => { const e = arr.find((x) => x.id === "childhood-005"); e.detail = "完全另写的一段话，" + e.detail; });
}, "node", ["scripts/check-story-quality.mjs"]);
// 10. 节奏门：关掉 quick relay
expectRed("节奏门（关 quick relay）", () => {
  const s = orig.rhythm.replace("return saturated ? \"quick\" : base;", "return base;");
  if (s === orig.rhythm) throw new Error("relay 变异未命中锚点");
  writeFileSync(FILES.rhythm, s);
}, "node", ["scripts/check-rhythm.mjs"]);
// 11. 节奏门：把一个阶段的变体来源全拆掉（删偶遇 + critical 降级为 context）
//     → 该阶段只剩 choice/quick 两档，≥3 变体判据必须报红
expectRed("节奏门（拆掉 infant 变体来源 → 种类不足）", () => {
  patchEvents((arr) => {
    let hits = 0;
    for (const e of arr) {
      if (e.stage !== "infant") continue;
      if (e.type === "encounter") { e.__drop = true; hits++; }
      else if (e.type === "critical") { e.type = "context"; hits++; }
    }
    if (hits === 0) throw new Error("变异未命中 infant 变体来源");
    const kept = arr.filter((e) => !e.__drop);
    arr.length = 0;
    arr.push(...kept);
  });
}, "node", ["scripts/check-rhythm.mjs"]);
const out = (s) => process.stdout.write(s + "\n");
out("变异自检（判据靶面 → 报红 → 复原）");
out("=".repeat(60));
let bad = 0;
for (const [name, verdict, code] of cases) {
  out(`${verdict.padEnd(14)} ${name}（exit ${code}）`);
  if (verdict.includes("!") || verdict.includes("未红")) bad++;
}
out("=".repeat(60));
out(bad === 0 ? `结论: 全部 ${cases.length} 项符合预期` : `结论: ${bad} 项异常`);
process.exitCode = bad === 0 ? 0 : 1;
