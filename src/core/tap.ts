// Tapping a pint the Belgian way: the tap wide open, the foam piles up and runs over the rim while the beer rises
// underneath. Shut the tap when the beer reaches two fingers under the rim, then skim the crown flat with the spatula
// straight away, before the head sinks. Heights are fractions of the glass (0 the bottom, 1 the rim), time in seconds.
// ponytail: flow, foam and settling are tuned by feel for a game of a few seconds, not measured at a real tap.

export interface Pint {
  beer: number;
  /** the head on top of the beer */
  foam: number;
  /** beer that ran over the rim (foam running over is part of it, beer is waste) */
  spill: number;
  open: boolean;
  skimmed: boolean;
}
export type Grade = "perfect" | "good" | "ok" | "bad";

const BEER = 0.28, // the beer rises this much a second with the tap open
  CROWN = 0.12, // how far a head stands over the rim before it runs down the glass
  SETTLE = 0.4, // the share of the head that falls back to beer each second
  LIQUID = 0.25; // a measure of foam is a quarter beer
/** two fingers of foam on a 15 cm glass: shut the tap when the beer reaches 1 - HEAD */
export const HEAD = 0.2;

export const newPint = (): Pint => ({ beer: 0, foam: 0, spill: 0, open: false, skimmed: false });

/** the pint `dt` seconds on */
export function pour(p: Pint, dt: number): void {
  if (p.open && !p.skimmed) {
    p.beer += BEER * dt;
    p.foam += (0.1 + 0.25 * p.beer) * dt; // the glass straightens as it fills: more and more foam
  }
  const fall = p.foam * (1 - Math.exp(-SETTLE * dt));
  p.foam -= fall;
  p.beer += fall * LIQUID;
  const over = p.beer + p.foam - (p.skimmed ? 1 : 1 + CROWN);
  if (over > 0) {
    const f = Math.min(p.foam, over); // the head runs over first, that is how it should be
    p.foam -= f;
    p.beer -= over - f;
    p.spill += over - f;
  }
  if (p.beer > 1) {
    p.spill += p.beer - 1; // beer itself does not crown: over the rim is down the drain
    p.beer = 1;
  }
}

/** the spatula across the rim: the tap shuts and everything over the rim goes */
export function skim(p: Pint): void {
  p.open = false;
  p.skimmed = true;
  p.foam = Math.max(0, Math.min(p.foam, 1 - p.beer));
}

/** 0 to 1: a full glass with two fingers of foam and no beer down the drain */
export function score(p: Pint): number {
  const clamp = (v: number) => Math.max(0, Math.min(1, v)),
    head = 1 - clamp((Math.abs(p.foam - HEAD) - 0.03) / 0.15),
    full = clamp((p.beer + p.foam - 0.85) / 0.13),
    waste = Math.min(0.5, p.spill * 2);
  return Math.max(0, (0.6 * head + 0.4) * full - waste); // the head only counts on a full glass
}
export const gradeOf = (s: number): Grade => (s >= 0.85 ? "perfect" : s >= 0.6 ? "good" : s >= 0.35 ? "ok" : "bad");
/** what the regular leaves on the counter, in tokens */
export const TIP: Record<Grade, number> = { perfect: 3, good: 2, ok: 1, bad: 0 };
