// 主题四款单测（v4-M2''' 2.1，plan/v4/02 §五）：键 xinlu.theme.v1、缺省/非法回米纸、往返一致、
// applyTheme 挂 <html data-theme>（DOM 以最小桩替代，node 环境零 jsdom 依赖）。
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyTheme, DEFAULT_THEME, loadTheme, saveTheme, THEMES, THEME_KEY } from "./theme";

class MemoryStorage implements Storage {
  constructor(private readonly backing: Map<string, string>) {}
  get length(): number {
    return this.backing.size;
  }
  clear(): void {
    this.backing.clear();
  }
  getItem(key: string): string | null {
    return this.backing.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.backing.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.backing.delete(key);
  }
  setItem(key: string, value: string): void {
    this.backing.set(key, String(value));
  }
}

let backing: Map<string, string>;

beforeEach(() => {
  backing = new Map();
  vi.stubGlobal("localStorage", new MemoryStorage(backing));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("THEMES 元数据（02 §五表：米纸默认/月白/夜航/青瓷）", () => {
  it("四款且 id 唯一", () => {
    expect(THEMES.map((t) => t.id)).toEqual(["paper", "moon", "night", "celadon"]);
    expect(DEFAULT_THEME).toBe("paper");
  });
});

describe("loadTheme / saveTheme", () => {
  it("无键与非法值都回默认米纸（手改 localStorage 不炸游戏）", () => {
    expect(loadTheme()).toBe("paper");
    localStorage.setItem(THEME_KEY, "dark-mode");
    expect(loadTheme()).toBe("paper");
  });

  it("saveTheme 写 xinlu.theme.v1（独立于存档键），loadTheme 读回；往返四款一致", () => {
    for (const t of THEMES) {
      saveTheme(t.id);
      expect(localStorage.getItem(THEME_KEY)).toBe(t.id);
      expect(loadTheme()).toBe(t.id);
    }
  });

  it("存储不可用不抛错：load 回默认、save 静默", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(loadTheme()).toBe("paper");
    expect(() => saveTheme("night")).not.toThrow();
  });
});

describe("applyTheme（<html data-theme> 挂载）", () => {
  it("设置 documentElement.dataset.theme；无 DOM 环境静默不抛", () => {
    const dataset: Record<string, string> = {};
    vi.stubGlobal("document", { documentElement: { dataset } });
    applyTheme("night");
    expect(dataset.theme).toBe("night");
    applyTheme("paper");
    expect(dataset.theme).toBe("paper");
    vi.stubGlobal("document", undefined);
    expect(() => applyTheme("celadon")).not.toThrow();
  });
});
