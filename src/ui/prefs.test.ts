// 阅读偏好单测（plan/10 §四.3 设置页补全 / plan/v5/02 §七）：键 xinlu.prefs.v1、缺省/非法回默认、
// 往返一致、applyPrefs 挂 <html data-font/data-motion>（DOM 以最小桩替代，node 环境零 jsdom 依赖）。
// 与 theme.test.ts 同构：数据面（选项枚举）与存储面各测一遍。
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyPrefs,
  DEFAULT_PREFS,
  FONT_OPTIONS,
  loadPrefs,
  MOTION_OPTIONS,
  PREFS_KEY,
  savePrefs,
} from "./prefs";

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

describe("选项枚举（设置页两组，各两档）", () => {
  it("字号两档（标准/大字）、动效两档（完整/减弱），id 唯一", () => {
    expect(FONT_OPTIONS.map((o) => o.id)).toEqual(["normal", "large"]);
    expect(MOTION_OPTIONS.map((o) => o.id)).toEqual(["full", "reduced"]);
    for (const o of [...FONT_OPTIONS, ...MOTION_OPTIONS]) {
      expect(o.label.length).toBeGreaterThan(0);
      expect(o.note.length).toBeGreaterThan(0);
    }
  });

  it("默认偏好 = 标准字号 + 完整动效", () => {
    expect(DEFAULT_PREFS).toEqual({ font: "normal", motion: "full" });
  });
});

describe("loadPrefs / savePrefs", () => {
  it("无键回默认；非法值逐项回默认（手改 localStorage 不炸）", () => {
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
    localStorage.setItem(PREFS_KEY, JSON.stringify({ font: "huge", motion: "wild" }));
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
    localStorage.setItem(PREFS_KEY, "not json");
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
    localStorage.setItem(PREFS_KEY, JSON.stringify([1, 2]));
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
  });

  it("部分合法时逐项生效（一项非法不连带清掉另一项）", () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ font: "large", motion: "wild" }));
    expect(loadPrefs()).toEqual({ font: "large", motion: "full" });
  });

  it("savePrefs 写 xinlu.prefs.v1（独立于存档与主题键），往返一致", () => {
    for (const font of FONT_OPTIONS) {
      for (const motion of MOTION_OPTIONS) {
        const prefs = { font: font.id, motion: motion.id };
        savePrefs(prefs);
        expect(JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}")).toEqual(prefs);
        expect(loadPrefs()).toEqual(prefs);
      }
    }
    expect(PREFS_KEY).not.toBe("xinlu.save.v3");
    expect(PREFS_KEY).not.toBe("xinlu.theme.v1");
  });

  it("存储不可用不抛错：load 回默认、save 静默", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
    expect(() => savePrefs({ font: "large", motion: "reduced" })).not.toThrow();
  });
});

describe("applyPrefs（<html data-font/data-motion> 挂载）", () => {
  it("两只 data 属性同时挂上；无 DOM 环境静默不抛", () => {
    const dataset: Record<string, string> = {};
    vi.stubGlobal("document", { documentElement: { dataset } });
    applyPrefs({ font: "large", motion: "reduced" });
    expect(dataset.font).toBe("large");
    expect(dataset.motion).toBe("reduced");
    applyPrefs({ ...DEFAULT_PREFS });
    expect(dataset.font).toBe("normal");
    expect(dataset.motion).toBe("full");
    vi.stubGlobal("document", undefined);
    expect(() => applyPrefs({ font: "large", motion: "reduced" })).not.toThrow();
  });
});
