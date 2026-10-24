// 种子码编解码（v3/02 §六 ▸ M3'' 增补）：XL-XXXX-XXXX，Crockford 式 Base32 去 0/O/1/I 易混字符。
// 契约：seed ∈ [0, 2^31) 数值键；码是它的无损文本形——同码必同人生（离线复现契约，02 §六）。
// 本文件是判定核心的一部分：纯函数，零 DOM、零存储、零过网。

/** 32 符号表：数字 2–9 + 字母 A–Z 去 I/O（8+24）。含 0/1/O/I 的输入一律拒绝（易混，02 §六）。 */
export const SEED_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
/** seed 数值域（与 v2 手选出生 Date.now() % 2^31 的取值域一致）。 */
export const SEED_MAX = 2 ** 31;
/** 码形：XL- 两段各 4 符号。 */
const SEED_CODE_RE = /^XL-([2-9A-HJ-NP-Z]{4})-([2-9A-HJ-NP-Z]{4})$/;

/** seed → 种子码（定长 8 符号，大端）。越界 seed 是引擎层 bug，直接抛错而非静默。 */
export function seedCodeOf(seed: number): string {
  if (!Number.isInteger(seed) || seed < 0 || seed >= SEED_MAX) {
    throw new Error(`seedCodeOf：seed 越界 [0, 2^31)：${seed}`);
  }
  let n = seed;
  let symbols = "";
  for (let i = 0; i < 8; i++) {
    symbols = SEED_ALPHABET[n % 32] + symbols;
    n = Math.floor(n / 32);
  }
  return `XL-${symbols.slice(0, 4)}-${symbols.slice(4)}`;
}

/** 种子码 → seed；任何不合法输入（格式/易混字符/越界）返回 null，调用方走错误提示。 */
export function seedFromCode(code: string): number | null {
  const m = code.trim().toUpperCase().match(SEED_CODE_RE);
  if (!m) return null;
  let n = 0;
  for (const c of m[1]! + m[2]!) {
    const v = SEED_ALPHABET.indexOf(c);
    if (v < 0) return null;
    n = n * 32 + v;
  }
  return n < SEED_MAX ? n : null;
}

/** 存档信封里 seedCode 字段的宽松校验（信封以 seed 数值键为真值，码形不对就当缺省）。 */
export function isSeedCodeShape(code: unknown): code is string {
  return typeof code === "string" && SEED_CODE_RE.test(code);
}
