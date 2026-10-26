// 阅读偏好（plan/10 §四.3「设置页补全」：字号 / 动效 / 清档）。键 xinlu.prefs.v1 独立于存档与主题，
// 与 theme.ts 同构：缺省/非法一律回默认，永不抛错、永不阻塞开局。
// 实现路径 = 挂 <html data-font / data-motion>，具体像素只在 src/style.css 定义（本档不复写字号）。
export const PREFS_KEY = "xinlu.prefs.v1";

export type FontScale = "normal" | "large";
export type MotionPref = "full" | "reduced";

export interface Prefs {
  font: FontScale;
  motion: MotionPref;
}

export const DEFAULT_PREFS: Prefs = { font: "normal", motion: "full" };

/** 设置页的两组选项（文案单源本档，UI 不再内联第二份）。 */
export const FONT_OPTIONS: ReadonlyArray<{ id: FontScale; label: string; note: string }> = [
  { id: "normal", label: "标准", note: "正文 17px" },
  { id: "large", label: "大字", note: "正文放大一档，正文与选项同步" },
];

export const MOTION_OPTIONS: ReadonlyArray<{ id: MotionPref; label: string; note: string }> = [
  { id: "full", label: "完整", note: "换屏与浮动反馈保留动画" },
  { id: "reduced", label: "减弱", note: "关闭换屏与浮动动画（晕动/低配设备友好）" },
];

function store(): Storage | null {
  return globalThis.localStorage ?? null;
}

/** 读偏好：非法值 / 存储不可用一律回默认。 */
export function loadPrefs(): Prefs {
  try {
    const raw = store()?.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return { ...DEFAULT_PREFS };
    const rec = parsed as Record<string, unknown>;
    const font = FONT_OPTIONS.find((o) => o.id === rec.font)?.id ?? DEFAULT_PREFS.font;
    const motion = MOTION_OPTIONS.find((o) => o.id === rec.motion)?.id ?? DEFAULT_PREFS.motion;
    return { font, motion };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

/** 存偏好：写失败静默（本局仍即时生效，仅不跨会话）。 */
export function savePrefs(prefs: Prefs): void {
  try {
    store()?.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // 存储不可用：仅本次会话生效
  }
}

/** 应用到 <html data-font / data-motion>（CSS 变量接管全部字号与动画）。无 DOM 环境静默。 */
export function applyPrefs(prefs: Prefs): void {
  const root = globalThis.document?.documentElement;
  if (!root) return;
  root.dataset.font = prefs.font;
  root.dataset.motion = prefs.motion;
}
