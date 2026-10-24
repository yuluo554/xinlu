// 人格鱼 avatar(v2/02 §一参数表 + §二表情映射的实现;数值口径唯一事实源是 plan/v2/02,本文件不复写数值)。
// 纪律:同输入恒同输出(无随机);DOM 只用 createElementNS / setAttribute / appendChild /
// textContent(viz 收窄面);无 16 型字面量分支——型是四维区间的派生结果,不进代码(单测 grep 守护)。
import type { Dims } from "../engine/model.ts";
import { sanitize, svgEl } from "./svg.ts";
import moodMap from "../data/fish-mood-map.json" with { type: "json" };

// 帧素材 URL 绑定(vite 静态 import → dist 内 hash 文件名);帧名与 fish-mood-map.json 的 frames 键对齐。
import f01 from "../../assets/dafeiyu/fish/01.webp";
import f03 from "../../assets/dafeiyu/fish/03.webp";
import f04 from "../../assets/dafeiyu/fish/04.webp";
import f05 from "../../assets/dafeiyu/fish/05.webp";
import f06 from "../../assets/dafeiyu/fish/06.webp";
import f07 from "../../assets/dafeiyu/fish/07.webp";
import f08 from "../../assets/dafeiyu/fish/08.webp";
import f10 from "../../assets/dafeiyu/fish/10.webp";
import f13 from "../../assets/dafeiyu/fish/13.webp";
import f14 from "../../assets/dafeiyu/fish/14.webp";
import f15 from "../../assets/dafeiyu/fish/15.webp";
import f16 from "../../assets/dafeiyu/fish/16.webp";
import f17 from "../../assets/dafeiyu/fish/17.webp";
import f18 from "../../assets/dafeiyu/fish/18.webp";
import f19 from "../../assets/dafeiyu/fish/19.webp";
import f20 from "../../assets/dafeiyu/fish/20.webp";
import f22 from "../../assets/dafeiyu/fish/22.webp";
import f24 from "../../assets/dafeiyu/fish/24.webp";
import f26 from "../../assets/dafeiyu/fish/26.webp";
import idleImg from "../../assets/dafeiyu/fish/whale-idle.webp";
import schoolA from "../../assets/web-ready/open-ocean/Fish/Clownfish.webp";
import schoolB from "../../assets/web-ready/open-ocean/Fish/Mackerel.webp";
import schoolC from "../../assets/web-ready/open-ocean/Fish/Tuna.webp";

export type MoodSeg = "thoughtful" | "neutral" | "warm";
export type DeltaDir = "pos" | "neg" | "neutral";

export interface FishParams {
  /** 活跃度 0..1(ei 线性:ei=0 → 0,ei=100 → 1)。 */
  activity: number;
  /** 待机动画播放间隔 ms = 1600 − activity×1000。 */
  idleIntervalMs: number;
  /** 位移幅度 px = 4 + activity×12。 */
  moveAmplitude: number;
  /** 表情倾向(tf 三段:<40 thoughtful / 40–60 neutral / >60 warm)。 */
  mood: MoodSeg;
  ambience: {
    /** sn<50 显示氛围层,sn≥50 隐藏。 */
    visible: boolean;
    /** 氛围层饱和度 = 0.7 + sn/100。 */
    saturation: number;
    /** 鱼群数量 = round(2 + (100−sn)/25),全域 2–6。 */
    school: number;
  };
  orderliness: {
    /** 圆角 px = 20 − jp×0.12(v2 新增界面消费)。 */
    radius: number;
    /** 栅格间距 px = 8 + jp×0.16。 */
    gap: number;
  };
}

export function createFishParams(dims: Dims): FishParams {
  const ei = sanitize(dims.ei);
  const sn = sanitize(dims.sn);
  const tf = sanitize(dims.tf);
  const jp = sanitize(dims.jp);
  const activity = ei / 100;
  return {
    activity,
    idleIntervalMs: 1600 - activity * 1000,
    moveAmplitude: 4 + activity * 12,
    mood: tf < 40 ? "thoughtful" : tf > 60 ? "warm" : "neutral",
    ambience: {
      visible: sn < 50,
      saturation: 0.7 + sn / 100,
      school: Math.round(2 + (100 - sn) / 25),
    },
    orderliness: {
      radius: 20 - jp * 0.12,
      gap: 8 + jp * 0.16,
    },
  };
}

interface MoodFrame {
  seg: string;
  dir: string;
  hint: string;
}

const FRAMES_MAP = moodMap.frames as Record<string, MoodFrame>;

/** 帧名 → 素材 URL(键与 fish-mood-map.json frames 对齐,单测断言集合相等)。 */
export const FRAMES: Record<string, string> = {
  "01": f01,
  "03": f03,
  "04": f04,
  "05": f05,
  "06": f06,
  "07": f07,
  "08": f08,
  "10": f10,
  "13": f13,
  "14": f14,
  "15": f15,
  "16": f16,
  "17": f17,
  "18": f18,
  "19": f19,
  "20": f20,
  "22": f22,
  "24": f24,
  "26": f26,
};

const IDLE_URL = idleImg;
const SCHOOL_URLS = [schoolA, schoolB, schoolC];

/** 阶段转场锁定帧(stage 表首张)。 */
export function stageFrame(stage: string): string {
  const list = (moodMap.stage as Record<string, string[]>)[stage];
  return list?.[0] ?? "01";
}

/** 终局主视觉锁定帧(9 结局各 1 张;未知 id 兜底 "01")。 */
export function endingFrame(endingId: string): string {
  return (moodMap.ending as Record<string, string>)[endingId] ?? "01";
}

/** choice 反馈抽帧(02 §二):候选 = dir 同向帧,seg 命中当前 mood 者优先,同种子可复现。 */
export function pickChoiceFrame(dir: DeltaDir, mood: MoodSeg, seed: number): string {
  const byDir = Object.keys(FRAMES_MAP).filter((k) => FRAMES_MAP[k]!.dir === dir);
  const segged = byDir.filter((k) => FRAMES_MAP[k]!.seg === mood);
  const pool = segged.length > 0 ? segged : byDir.length > 0 ? byDir : Object.keys(FRAMES_MAP);
  const s = Number.isFinite(seed) ? Math.abs(Math.trunc(seed)) : 0;
  return pool[s % pool.length] ?? "01";
}

const SIZE = 240;
const BODY_X = 45;
const BODY_Y = 38;
const BODY_W = 150;
const BODY_H = 170;
const SCHOOL_SIZE = 28;
const SCHOOL_SPOTS: Array<[number, number]> = [
  [14, 14],
  [198, 20],
  [16, 198],
  [198, 192],
  [104, 8],
  [104, 210],
];

/**
 * renderFish(params, el, frame?):渲染人格鱼 mascot(v2/03 §2 契约的第三可选参)。
 * frame = 表情帧名(02 §二 choice 抽取结果或 stage/ending 锁定帧),给定显示该帧;
 * 缺省播待机游动(播放间隔/位移幅度经 CSS 变量注入,activity 驱动)。
 */
export function renderFish(params: FishParams, el: Element, frame?: string): void {
  const svg = svgEl("svg", {
    viewBox: `0 0 ${SIZE} ${SIZE}`,
    class: "fish-mascot",
    role: "img",
    "aria-label": frame ? `人格鱼表情:${moodHintOf(frame)}` : "人格鱼(待机游动)",
  });

  if (params.ambience.visible) {
    const amb = svgEl("g", {
      class: "fish-ambience",
      style: `filter:saturate(${params.ambience.saturation.toFixed(2)})`,
    });
    for (let i = 0; i < params.ambience.school; i++) {
      const [sx, sy] = SCHOOL_SPOTS[i % SCHOOL_SPOTS.length]!;
      amb.appendChild(
        svgEl("image", {
          href: SCHOOL_URLS[i % SCHOOL_URLS.length]!,
          x: sx,
          y: sy,
          width: SCHOOL_SIZE,
          height: SCHOOL_SIZE,
          class: "fish-school",
        }),
      );
    }
    svg.appendChild(amb);
  }

  const body = svgEl("g", {
    class: frame ? "fish-still" : "fish-idle",
    style: `--fish-dur:${Math.round(params.idleIntervalMs)}ms;--fish-amp:${params.moveAmplitude.toFixed(1)}px`,
  });
  body.appendChild(
    svgEl("image", {
      href: frame ? (FRAMES[frame] ?? IDLE_URL) : IDLE_URL,
      x: BODY_X,
      y: BODY_Y,
      width: BODY_W,
      height: BODY_H,
      class: "fish-frame",
    }),
  );
  svg.appendChild(body);
  el.appendChild(svg);
}

function moodHintOf(frame: string): string {
  return FRAMES_MAP[frame]?.hint ?? "";
}
