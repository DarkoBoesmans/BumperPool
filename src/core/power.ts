// How hard a shot is. The power meter (0..1) maps to the cue ball's speed in four equal quarters: touch, soft, medium
// and hard. Each band gets the same pull, so the soft game, where most shots are played, is easy to dose, and the
// top quarter is "hard" in the referee's sense (SP/7.4, SP/6.7): fast enough to run more than three table lengths.
import { R } from "./table";

export const GRAV = 9810; // mm/s²
const MU_SLIDE = 0.2; // ball on cloth while sliding
const MU_ROLL = 0.01; // rolling resistance on Simonis 300 Rapide
export const SLIDE_DECEL = MU_SLIDE * GRAV; // 1962 mm/s²
export const ROLL_DECEL = MU_ROLL * GRAV; // 98 mm/s²: a rolling ball loses about 0.1 m/s every second
export const SPIN_MAX = 0.5; // the tip can hit at most half a radius off centre before it miscues
export { R };

const VMAX = 4500; // mm/s: the hardest shot, about 16 km/h
const HARD_SPEED = 1500; // mm/s

/** meter position to speed: straight lines between these points, one quarter per band */
const KNOTS: [number, number][] = [
  [0, 0],
  [0.25, 400],
  [0.5, 800],
  [0.75, HARD_SPEED],
  [1, VMAX],
];
function lerpKnots(x: number, from: 0 | 1): number {
  const to = from ? 0 : 1;
  const k = KNOTS.findIndex((q, i) => i > 0 && x <= q[from]);
  const [a, b] = k < 1 ? [KNOTS[3], KNOTS[4]] : [KNOTS[k - 1], KNOTS[k]];
  return a[to] + ((Math.min(x, b[from]) - a[from]) / (b[from] - a[from])) * (b[to] - a[to]);
}
export const speedOf = (p: number): number => lerpKnots(Math.max(0, Math.min(1, p)), 0);
export const powerOf = (v: number): number => lerpKnots(Math.max(0, Math.min(VMAX, v)), 1);
export const HARD = 0.75;
export const isHard = (p: number): boolean => p >= HARD - 1e-9;

// A centre-hit ball slides until it rolls at 5/7 of its speed, then rolls to a stop.
const K_SLIDE = 24 / (98 * SLIDE_DECEL);
const K_ROLL = 25 / (98 * ROLL_DECEL);
/** how far a centre-hit ball runs on an empty table, in mm */
export const rollDistance = (v: number): number => (K_SLIDE + K_ROLL) * v * v;
/** the speed that covers `d` mm and is still doing `arrive` mm/s when it gets there */
export const speedFor = (d: number, arrive = 0): number =>
  Math.sqrt((d + (arrive * arrive) / (2 * ROLL_DECEL)) / (K_SLIDE + K_ROLL));

export type Band = "touch" | "soft" | "medium" | "hard";
export const BANDS: { id: Band; label: string; from: number }[] = [
  { id: "touch", label: "Touch", from: 0 },
  { id: "soft", label: "Soft", from: 400 },
  { id: "medium", label: "Medium", from: 800 },
  { id: "hard", label: "Hard", from: HARD_SPEED },
];
export function bandOf(p: number): (typeof BANDS)[number] {
  const v = speedOf(p);
  let b = BANDS[0];
  for (const x of BANDS) if (v >= x.from - 1e-6) b = x;
  return b;
}
/** table lengths (1.8 m) a shot runs on its own */
export const tables = (p: number): number => rollDistance(speedOf(p)) / 1800;
