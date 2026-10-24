// 场景氛围(v2-M3' 3.3):出生环境 → 水域背景映射,纯函数可单测。
// 口径解读(02 §四/04 §3.3 未锁细节表,实现自定并留痕 HANDOFF-v2-M4 §二):
//   era(6 档年代)→「时代水温」:水面滤镜 brightness 单调抬升 + hue 微偏(旧年代深冷,新年代亮暖);
//   place(4 档城乡)→ 云层不透明度单调递减(大城上空云最多,农村最少)。
// 枚举键序单源 = birth-map.json(与 engine.birthEnvOptions 同源,不在本文件复写清单)。
import birthMap from "../data/birth-map.json" with { type: "json" };

export type BirthEnvLike = { era: string; place: string; mood: string; style: string };

export interface SceneBackdrop {
  /** 水面纹理滤镜(era 驱动; era 未知名 → 中位回落)。 */
  filter: string;
  /** 云层不透明度 0..1(place 驱动;place 未知名 → 中位回落)。 */
  cloudsOpacity: number;
}

const ERAS = Object.keys(birthMap.era);
const PLACES = Object.keys(birthMap.place);

/** era 档位:0..5;未知 → 回落中位 2.5 取整映射。 */
export function eraIndexOf(era: string): number {
  const i = ERAS.indexOf(era);
  return i >= 0 ? i : Math.floor(ERAS.length / 2);
}

/** place 档位:0..3;未知 → 回落中位。 */
export function placeIndexOf(place: string): number {
  const i = PLACES.indexOf(place);
  return i >= 0 ? i : Math.floor(PLACES.length / 2);
}

export function sceneBackdrop(env: BirthEnvLike): SceneBackdrop {
  const e = eraIndexOf(env.era);
  // brightness 0.70→1.05 线性, hue −10°→+10° 线性(「时代水温」)
  const brightness = 0.7 + (e / (ERAS.length - 1)) * 0.35;
  const hue = (e / (ERAS.length - 1)) * 20 - 10;
  const p = placeIndexOf(env.place);
  // 云层 0.7→0.15 线性(城乡梯度)
  const cloudsOpacity = 0.7 - (p / (PLACES.length - 1)) * 0.55;
  return {
    filter: `brightness(${brightness.toFixed(2)}) hue-rotate(${hue.toFixed(1)}deg)`,
    cloudsOpacity: Number(cloudsOpacity.toFixed(2)),
  };
}
