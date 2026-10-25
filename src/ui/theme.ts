// 背景主题四款（v4-M2''' 2.1，口径单源 plan/v4/02 §五 + ▸ M2''' 增补）：米纸（默认）/月白/夜航/青瓷。
// 色板单源在 src/style.css 主题块（CSS variables）；本档只承载主题元数据与存取——
// 键 xinlu.theme.v1 独立于存档，值为主题 id；非法/缺省一律回默认，不抛错不阻塞开局。
export const THEME_KEY = "xinlu.theme.v1";

export type ThemeId = "paper" | "moon" | "night" | "celadon";

/** 主题元数据（id/显示名/一句话基调，02 §五表）。 */
export const THEMES: Array<{ id: ThemeId; label: string; note: string }> = [
  { id: "paper", label: "米纸", note: "暖白纸纹，默认" },
  { id: "moon", label: "月白", note: "纯色极简，无纹理" },
  { id: "night", label: "夜航", note: "深色低亮，夜读友好" },
  { id: "celadon", label: "青瓷", note: "低饱和青，冷调" },
];

export const DEFAULT_THEME: ThemeId = "paper";

function store(): Storage | null {
  const s = globalThis.localStorage;
  return s ?? null;
}

/** 读主题：非法值（含手改 localStorage）回默认。存储不可用也回默认，不阻塞。 */
export function loadTheme(): ThemeId {
  try {
    const raw = store()?.getItem(THEME_KEY);
    const hit = THEMES.find((t) => t.id === raw);
    return hit ? hit.id : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** 存主题：写失败静默（本局仍即时生效，仅不跨会话）。 */
export function saveTheme(id: ThemeId): void {
  try {
    store()?.setItem(THEME_KEY, id);
  } catch {
    // 存储不可用：仅本次会话生效
  }
}

/** 应用主题：挂到 <html data-theme>，CSS variables（style.css 主题块）接管全部配色。 */
export function applyTheme(id: ThemeId): void {
  const root = globalThis.document?.documentElement;
  if (root) root.dataset.theme = id;
}
