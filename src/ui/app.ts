// The app's own state: what is on screen, the opponent, your settings. Settings are kept in localStorage.
import type { Color, Opponent, Rules, Shot } from "../types";
import { REGLEMENT } from "../core/rules";
import { G } from "../core/state";
import { FX_DEFAULTS, type Fx } from "../render/post";
import { FULL_HELP } from "../data/grades";
import { gradeOf } from "../data/regulars";
import { net } from "../net/online";
import type { Job } from "../cpu/brain";
import type { Mine } from "../people/player";

export interface Settings {
  /** freeplay house rules */
  house: Rules;
  replays: "all" | "key" | "off";
  clock: boolean;
  lines: boolean;
  cloth: boolean;
  mine: Mine;
  opp: string;
  fx: Fx;
}
export interface Drag {
  id: number;
  /** the pointer on the cloth (mm): sets the direction */
  x: number;
  y: number;
  /** the pointer on screen (px): sets the power, so the same pull feels the same from every camera angle */
  px?: number;
  py?: number;
  /** power set directly (the CPU, or keyboard aiming) */
  p?: number;
  cpu?: boolean;
  /** aimed with the keyboard */
  kb?: boolean;
  sx?: number;
  sy?: number;
}
export interface CpuJob extends Partial<Job> {
  readyAt: number;
  shot?: Shot;
  aimAt?: number;
  walkUntil?: number;
  aiming?: boolean;
  act?: () => void;
}

const SKEY = "golfbiljart.settings";
export const app = {
  inGame: false,
  /** the goal / foul show is running */
  show: false,
  shown: -1,
  syncShown: false,
  opp: null as Opponent | null,
  /** this match is a freeplay rematch (as opposed to the story) */
  freeplay: false,
  cpu: null as CpuJob | null,
  drag: null as Drag | null,
  spin: { x: 0, y: 0 },
  oppSips: 0,
  endNote: "",
  reward: "",
  replayDone: null as null | (() => void),
  set: {
    house: { ...REGLEMENT },
    replays: "all",
    clock: false,
    lines: true,
    cloth: true,
    mine: "fade",
    opp: "kevin",
    fx: { ...FX_DEFAULTS },
  } as Settings,
};
try {
  const saved = JSON.parse(globalThis.localStorage?.getItem(SKEY) || "{}");
  Object.assign(app.set, saved, { fx: { ...FX_DEFAULTS, ...saved.fx }, house: { ...REGLEMENT, ...saved.house } });
} catch {
  /* defaults */
}
export const saveSettings = (): void => {
  try {
    localStorage.setItem(SKEY, JSON.stringify(app.set));
  } catch {
    /* fine */
  }
};

/** what the game shows you: against a regular it depends on their grade, the better they are the less help */
export const help = () => (G?.mode === "cpu" && app.opp ? gradeOf(app.opp).help : FULL_HELP);

export function canAct(c: Color): boolean {
  if (G.mode === "cpu") return c === G.colorOf[0];
  if (G.mode === "online") return net.canWrite && G.seats[G.colorOf.indexOf(c)] === net.uid;
  return true;
}
/** the colour whose end the camera sits behind: yours, or in a two-player game whoever is up */
export function viewColor(): Color {
  if (G.mode === "cpu") return G.colorOf[0];
  if (G.mode === "online") {
    const mine = [0, 1].filter((p) => G.seats[p] === net.uid);
    if (mine.length === 1) return G.colorOf[mine[0]];
  }
  return G.phase === "openW" ? "W" : G.phase === "openR" ? "R" : G.turn;
}
