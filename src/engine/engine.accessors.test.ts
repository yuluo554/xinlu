import { describe, expect, it } from "vitest";
import birthMapRaw from "../data/birth-map.json";
import eventsRaw from "../data/events.json";
import {
  birthEnvOptions,
  createRun,
  eventById,
  initialDimsOf,
} from "./engine";
import { STAGES, type BirthEnv, type GameEvent } from "./model";

const BIRTH_MAP = birthMapRaw as unknown as Record<string, Record<string, unknown>>;
const EVENTS = eventsRaw as unknown as GameEvent[];

describe("M3 只读访问器（plan/03 §2 附件导出，不动冻结五签名）", () => {
  it("birthEnvOptions 与 birth-map 键逐一相等（UI 枚举唯一来源，不内联）", () => {
    const opts = birthEnvOptions();
    for (const key of ["era", "place", "mood", "style"] as const) {
      expect(opts[key]).toEqual(Object.keys(BIRTH_MAP[key]!));
    }
    expect(opts.era).toHaveLength(6);
    expect(opts.place).toHaveLength(4);
    expect(opts.mood).toHaveLength(4);
    expect(opts.style).toHaveLength(3);
  });

  it("initialDimsOf 与 createRun 初始四维全等（288 组合穷举）", () => {
    const opts = birthEnvOptions();
    let combos = 0;
    for (const era of opts.era) {
      for (const place of opts.place) {
        for (const mood of opts.mood) {
          for (const style of opts.style) {
            const env: BirthEnv = { era, place, mood, style };
            expect(initialDimsOf(env), `${era}/${place}/${mood}/${style}`).toEqual(
              createRun(env, 1).dims,
            );
            combos += 1;
          }
        }
      }
    }
    expect(combos).toBe(288);
  });

  it("eventById 命中返回事件本体；未知 id 返回 undefined", () => {
    const teen = eventById("teen-003");
    expect(teen?.stage).toBe("teen");
    expect(teen?.type).toBe("critical");
    expect(eventById("nope-999")).toBeUndefined();
  });

  it("事件库全量可反查，stage 均落在八阶段枚举", () => {
    expect(EVENTS.length).toBeGreaterThan(0);
    for (const e of EVENTS) {
      expect(STAGES, e.id).toContain(eventById(e.id)!.stage);
    }
  });
});
