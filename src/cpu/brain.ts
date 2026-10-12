// The opponent's brain: it tries candidate shots on a copy of the game, keeps the best one and then plays it with a
// hand as shaky as its character (hand.ts). Each regular looks for different kinds of shots (`mix`), which is what
// makes them play differently. Better regulars `refine` their best idea and `verify` the top few at full precision.
import type { AI, Color } from "../types";
import { G, att, shootable, powerOf } from "../core";
import { idea, pickKind, clamp } from "./ideas";
import { simShot, simOpening, type Cand } from "./judge";
import { shaky, gauss } from "./hand";

export interface Job {
  cands: Cand[];
  evalFn: (c: Cand) => number;
  robust?: (c: Cand) => number;
  best: Cand | null;
  bestS: number;
  refine: number;
  top: { c: Cand; s: number }[];
  verify: number;
  checking?: Cand[];
  checkS?: number;
}

export function planCpu(cc: Color, ai: AI): Job {
  const g = att(cc),
    cands: Cand[] = [];
  if (G.phase === "openW" || G.phase === "openR") {
    const id = G.open.ids[cc],
      left = cc === "W" ? -1 : 1;
    for (let i = 0; i < Math.max(12, (ai.n / 3) | 0); i++) {
      const a = ((6 + Math.random() * 34) * Math.PI) / 180; // soft, off your own left cushion
      cands.push({ id, s: { dx: g * Math.cos(a), dy: left * Math.sin(a), p: powerOf(450 + Math.random() * 700) } });
    }
    return { cands, evalFn: (c) => simOpening(cc, c), best: null, bestS: -Infinity, refine: 0, top: [], verify: 0 };
  }
  const mine = shootable(cc),
    mix = ai.mix || { straight: 0.45, bank: 0.2, random: 0.35 };
  for (let i = 0; i < ai.n; i++) {
    const b = mine[i % mine.length],
      s = idea(pickKind(mix), b, cc, ai);
    if (Math.random() < ai.spin) {
      s.sx = (Math.random() - 0.5) * 1.6;
      s.sy = (Math.random() - 0.5) * 1.8;
    }
    cands.push({ id: b.id, s });
  }
  // verify: re-run the best few ideas at full precision, three times each with the character's own wobble
  const robust = (c: Cand): number => {
    let t = 0;
    for (let k = 0; k < 3; k++) t += simShot(cc, { id: c.id, s: shaky(c.s, ai) }, ai, 1 / 600);
    return t / 3;
  };
  return {
    cands,
    evalFn: (c) => simShot(cc, c, ai),
    robust,
    best: null,
    bestS: -Infinity,
    refine: ai.refine || 0,
    top: [],
    verify: ai.verify || 0,
  };
}

/** thinks for up to `budget` ms; true once every candidate has been tried */
export function think(job: Job, budget = 7): boolean {
  const t0 = performance.now();
  if (job.checking) {
    while (job.checking.length && performance.now() - t0 < budget) {
      const c = job.checking.pop()!,
        s = job.robust!(c);
      if (s > (job.checkS ?? -Infinity)) {
        job.checkS = s;
        job.best = c;
        job.bestS = s;
      }
    }
    return !job.checking.length;
  }
  while (job.cands.length && performance.now() - t0 < budget) {
    const c = job.cands.pop()!,
      s = job.evalFn(c);
    if (s > job.bestS) {
      job.bestS = s;
      job.best = c;
    }
    if (job.verify) {
      job.top.push({ c, s });
      job.top.sort((a, b) => b.s - a.s);
      job.top.length = Math.min(job.top.length, job.verify);
    }
  }
  if (!job.cands.length && job.refine > 0 && job.best) {
    const { id, s } = job.best,
      a0 = Math.atan2(s.dy, s.dx);
    for (let i = 0; i < job.refine; i++) {
      const a = a0 + gauss() * 0.012;
      job.cands.push({
        id,
        s: { ...s, dx: Math.cos(a), dy: Math.sin(a), p: clamp(s.p * (1 + gauss() * 0.04), 0.05, 1) },
      });
    }
    job.refine = 0;
  }
  if (!job.cands.length && job.verify && job.top.length) {
    job.checking = job.top.map((t) => t.c);
    job.checkS = -Infinity;
    job.verify = 0;
    return false;
  }
  return !job.cands.length;
}

/** runs a whole plan at once (tests, headless) */
export function thinkAll(job: Job): Job {
  while (!think(job, 1e9));
  return job;
}
