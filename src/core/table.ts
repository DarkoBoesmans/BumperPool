// The table (GZV standaardnormen) and its zones (NLGB drawing). No DOM, no three.js: runs in the browser and in tests.
import type { Color, Point, Spot } from "../types";

export const R = 30.75; // ball radius: 61.5 mm carom balls, 212 g
export const DOP_R = 17.5; // post radius
export const HX = 900; // half the playing length
export const HY = 450; // half the playing width

// The norm puts the hole's centre 897 mm from the middle, under the short cushion. On café tables it sits just in front
// of the cushion with a curved lip behind it that catches hard balls, so the cushion runs all the way round.
export const GOAL_X = 850;
export const GOAL_R = 32.5; // hole: 65 mm
export const LIP_R = GOAL_R + 5; // inner face of the lip
export const LIP_SPAN = (75 * Math.PI) / 180; // the lip wraps this far round each side of the back of the hole
export const DD_X = 835; // goal posts
export const DD_Y = 77 / 2 + DOP_R;

export const VLIEG = 92.3; // flyer strip along the long cushions
export const VL = HY - VLIEG;
export const QUART = 450; // big triangle depth
export const KLEIN_TOP = 180; // small triangle tip, measured from the short cushion

export const DOPS: Point[] = [];
for (const d of [90, 180]) DOPS.push({ x: d, y: 0 }, { x: -d, y: 0 }, { x: 0, y: d }, { x: 0, y: -d });
for (const s of [-1, 1]) DOPS.push({ x: s * DD_X, y: DD_Y }, { x: s * DD_X, y: -DD_Y });

// four balls on the start marks 65 mm from the short cushion, the middle one where the shooting lines cross
export const START: Point[] = [
  { x: 835, y: -320 },
  { x: 835, y: -160 },
  { x: 835, y: 160 },
  { x: 835, y: 320 },
  { x: HX - KLEIN_TOP, y: 0 },
];

export const COLORS: Color[] = ["W", "R"];
export const COL: Record<Color, string> = { W: "white", R: "red" };
/** the direction a colour attacks: white plays towards +x */
export const att = (c: Color): number => (c === "W" ? 1 : -1);
export const home = (c: Color): number => -att(c);
export const other = (c: Color): Color => (c === "W" ? "R" : "W");

/** u: distance to the short cushion behind the goal c attacks, v: distance from the long axis */
export function loc(c: Color, p: Point): { u: number; v: number } {
  return { u: HX - att(c) * p.x, v: Math.abs(p.y) };
}
// Zones. A ball "on the line" touches it: its centre is within `m` (pass R) of the line. The rulebook says on the line
// counts as inside the small triangle (SP/7.4), above the shooting line (SP/7.4), inside the big triangle (SP/9.3) and
// inside the flyer strip (SP/6.7). With m = 0 the zones go by the centre, as the cloth drawing shows them.
const SLANT_K = Math.hypot(KLEIN_TOP - (HX - DD_X), DD_Y),
  SLANT_G = Math.hypot(QUART, VL),
  SLANT_S = Math.hypot(HX - KLEIN_TOP, HY);
export function inKlein(c: Color, p: Point, m = 0): boolean {
  const { u, v } = loc(c, p),
    a = HX - DD_X;
  if (u < -m || u > KLEIN_TOP + m) return false;
  if (u <= a) return v <= DD_Y + m;
  return (v * (KLEIN_TOP - a) - DD_Y * (KLEIN_TOP - u)) / SLANT_K <= m;
}
export function inGroot(c: Color, p: Point, m = 0): boolean {
  const { u, v } = loc(c, p);
  return u >= -m && u <= QUART + m && (v * QUART - VL * u) / SLANT_G <= m;
}
/** below the shooting line (the corners beside the goal) by more than m */
export function onderStoot(c: Color, p: Point, m = 0): boolean {
  const { u, v } = loc(c, p);
  return u < HX && (v * (HX - KLEIN_TOP) - (u - KLEIN_TOP) * HY) / SLANT_S > m;
}
const inVlieg = (p: Point, m = 0): boolean => Math.abs(p.y) >= VL - m;

/** SP/7.4: a ball clearly below the shooting line and not touching the small triangle may not go hard at goal */
export const cornerBall = (c: Color, p: Point): boolean => onderStoot(c, p, R) && !inKlein(c, p, R);
/** SP/6.7: a flyer is played hard from the strip into or along its long cushion, not away from it into the table */
export const flyer = (p: Point, d: Point): boolean => inVlieg(p, R) && -Math.sign(p.y) * d.y < 0.42;
/** a ball sent from p along d heads between the posts of the goal c attacks: a direct goal attempt (SP/7.4) */
export function aimsAtGoal(c: Color, p: Point, d: Point): boolean {
  const gx = att(c) * GOAL_X - p.x,
    gy = -p.y;
  return d.x * gx + d.y * gy > 0 && Math.abs(d.x * gy - d.y * gx) < DD_Y;
}

/** Penalty spots (SP/12). "The offender's goal" is the goal they attack, see SP/12.2. */
export function spots(c: Color): Spot[] {
  const g = att(c);
  return [
    { n: "1", x: g * (HX - R), y: -(DD_Y + DOP_R + 3 + R) },
    { n: "2", x: g * (HX - R), y: DD_Y + DOP_R + 3 + R },
    { n: "3", x: g * (90 - DOP_R - R), y: 0 },
    { n: "4", x: -g * 17.4, y: -135 },
    { n: "5", x: -g * 17.4, y: 135 },
  ];
}
