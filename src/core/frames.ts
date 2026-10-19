// Frame play (kaderspel, SP/10). Once either player is down to one ball, every shot must send a ball out of its frame.
// The 15 frames are the lines on the cloth (figure 1 of the rulebook): the two 92 mm strips along the long cushions
// (14, 15), the big triangles (11, 12), the diamond round the middle posts (13), the two halves of the middle band
// (9, 10) and eight side boxes (1 to 8). The shooting lines are no frame lines.
import type { Ball, Color, Point } from "../types";
import { QUART, R, VL, inGroot } from "./table";

const BAND = 180; // the long lines either side of the middle band
const BOS = 90; // the diamond round the middle posts

/** the frame a point lies in, for a ball of colour c: the triangle round your own goal is no frame for you (SP/9.4) */
export function frameAt(c: Color, p: Point): number {
  if (Math.abs(p.y) >= VL) return p.y > 0 ? 14 : 15;
  if (inGroot(c, p)) return p.x > 0 ? 11 : 12;
  if (Math.abs(p.x) + Math.abs(p.y) <= BOS) return 13;
  if (Math.abs(p.y) < BAND) return p.x >= 0 ? 9 : 10;
  const col = p.x < -QUART ? 0 : p.x < 0 ? 1 : p.x < QUART ? 2 : 3;
  return (p.y > 0 ? 1 : 5) + col;
}

// ponytail: the centre and eight points round the rim stand in for the whole ball. A line through the gap between
// two rim points is missed; sixteen points if that ever matters.
const RIM = Array.from({ length: 8 }, (_, i) => [Math.cos((i * Math.PI) / 4) * R, Math.sin((i * Math.PI) / 4) * R]);

/** the frames a ball touches: one, or more when it lies on a line */
export function framesOf(b: Ball): number[] {
  const set = new Set([frameAt(b.c, b)]);
  for (const [dx, dy] of RIM) set.add(frameAt(b.c, { x: b.x + dx, y: b.y + dy }));
  return [...set].sort((a, z) => a - z);
}

/** it left its frame: dropped into a goal, or no longer touches every frame it started in. A ball on a line leaves
 * its frame by leaving the line (SP/10.3); coming back later still counts (SP/10.2.1) */
export const leftFrame = (b: Ball, start: number[]): boolean => {
  if (!b.on) return true;
  const now = framesOf(b);
  return !start.every((f) => now.includes(f));
};
