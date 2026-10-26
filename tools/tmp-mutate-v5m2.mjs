// 变异自检（随用随删，v5-M2''''）：逐条改判据靶面 → 断言报红 → 还原 → 断言字节一致。
// 覆盖本棒新增的三处判据面：素纸（theme-contrast）、卡片三层（card-layers）、开局四步（start-flow）与偏好（prefs）。
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
/** 直接跑 vitest 的 bin 脚本（npx 在 Windows 是 .cmd 外壳，execFileSync 不认）。 */
const VITEST = join(ROOT, "node_modules", "vitest", "vitest.mjs");

const FILES = {
  css: "src/style.css",
  screens: "src/ui/screens.ts",
  flow: "src/ui/start-flow.ts",
  prefs: "src/ui/prefs.ts",
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
/** 变异 → 跑指定测试 → 必须非 0；复原 → 必须 0。 */
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

// 1. 素纸：--tex-wash 改回非 0
expectRed(
  "素纸（--tex-wash 非 0）",
  () => patch("css", (s) => s.replace("--tex-wash: 0;", "--tex-wash: 0.6;")),
  "src/ui/theme-contrast.test.ts",
);
// 2. 素纸：把纹理层伪元素加回来
expectRed(
  "素纸（纹理层回归）",
  () =>
    patch("css", (s) =>
      s.replace(
        "#app {",
        'body::before {\n  content: "";\n  background-image: url("../assets/cc0/parchment/parchment-bg.webp");\n}\n\n#app {',
      ),
    ),
  "src/ui/theme-contrast.test.ts",
);
// 3. 素纸：米纸对比度退化（--ink-2 调浅到 4.5 以下）
expectRed(
  "素纸（ink-2 对比度退化）",
  () => patch("css", (s) => s.replace("--ink-2: #5c5850;", "--ink-2: #9a958a;")),
  "src/ui/theme-contrast.test.ts",
);
// 4. L1：正文行宽放宽到 46 字
expectRed(
  "卡片三层（L1 行宽 34→46 字）",
  () =>
    patch("css", (s) =>
      s.replace(
        ".event-text {\n  margin: 0 0 32px;\n  font-size: var(--fs-section);\n  line-height: 1.75;\n  color: var(--ink);\n  max-width: 34em;",
        ".event-text {\n  margin: 0 0 32px;\n  font-size: var(--fs-section);\n  line-height: 1.75;\n  color: var(--ink);\n  max-width: 46em;",
      ),
    ),
  "src/ui/card-layers.test.ts",
);
// 5. L1：正文退回小字号（焦点丢失）
expectRed(
  "卡片三层（L1 字号退回 body）",
  () =>
    patch("css", (s) =>
      s.replace(
        ".event-text {\n  margin: 0 0 32px;\n  font-size: var(--fs-section);",
        ".event-text {\n  margin: 0 0 32px;\n  font-size: var(--fs-body);",
      ),
    ),
  "src/ui/card-layers.test.ts",
);
// 6. L3：状态条折叠壳删掉（退回常驻）
expectRed(
  "卡片三层（L3 折叠壳缺失）",
  () => patch("screens", (s) => s.replace('<details class="statebar-fold" data-statebar-fold>', '<div class="statebar-fold">')),
  "src/ui/card-layers.test.ts",
);
// 7. L3：折叠壳默认展开
expectRed(
  "卡片三层（L3 默认展开）",
  () => patch("screens", (s) => s.replace('<details class="statebar-fold" data-statebar-fold>', '<details class="statebar-fold" data-statebar-fold open>')),
  "src/ui/card-layers.test.ts",
);
// 8. 开局四步：回退丢已填值（back 不再保留 manualEnv）
expectRed(
  "开局四步（回退丢手选值）",
  () =>
    patch("flow", (s) =>
      s.replace("if (draft.step === 2) return { ...draft, step: 1 };", "if (draft.step === 2) return { ...draft, step: 1, manualEnv: null };"),
    ),
  "src/ui/start-flow.test.ts",
);
// 9. 开局四步：再来一次不换种子（reroll 原样返回）
expectRed(
  "开局四步（再来一次不变）",
  () => patch("flow", (s) => s.replace("return preview(draft, seed);\n}", "return draft;\n}")),
  "src/ui/start-flow.test.ts",
);
// 10. 开局四步：出生证明缺家庭成员
expectRed(
  "开局四步（证明缺家庭成员）",
  () => patch("flow", (s) => s.replace("const family = generateFamily(input.env, input.birthYear, input.profile, input.seed).map", "const family = [].map")),
  "src/ui/start-flow.test.ts",
);
// 11. 开局四步：自定义态的证不认玩家填的出生年（换成种子派生）
expectRed(
  "开局四步（自定义年不入证）",
  () => patch("flow", (s) => s.replace("birthYear: custom.birthYear,", "birthYear: 1990,")),
  "src/ui/start-flow.test.ts",
);
// 12. 阅读偏好：默认值漂移
expectRed(
  "阅读偏好（默认值漂移）",
  () => patch("prefs", (s) => s.replace('export const DEFAULT_PREFS: Prefs = { font: "normal", motion: "full" };', 'export const DEFAULT_PREFS: Prefs = { font: "large", motion: "full" };')),
  "src/ui/prefs.test.ts",
);
// 13. 阅读偏好：非法值不再回落默认（直接采用）
expectRed(
  "阅读偏好（非法值不回落）",
  () =>
    patch("prefs", (s) =>
      s.replace(
        'const font = FONT_OPTIONS.find((o) => o.id === rec.font)?.id ?? DEFAULT_PREFS.font;',
        'const font = (rec.font as FontScale) ?? DEFAULT_PREFS.font;',
      ),
    ),
  "src/ui/prefs.test.ts",
);

const out = (s) => process.stdout.write(s + "\n");
out("变异自检（v5-M2'''' 判据靶面 → 报红 → 复原）");
out("=".repeat(64));
let bad = 0;
for (const [name, verdict, code] of cases) {
  out(`${verdict.padEnd(14)} ${name}（exit ${code}）`);
  if (verdict.includes("!") || verdict.includes("未红")) bad++;
}
out("=".repeat(64));
out(bad === 0 ? `结论: 全部 ${cases.length} 项符合预期` : `结论: ${bad} 项异常`);
process.exitCode = bad === 0 ? 0 : 1;
