// Shared set-ups for the tests: a table with only the balls you list, and a shot rolled out without the referee.
import * as g from "../src/core";
import type { Ball, Shot } from "../src/types";
import { fill } from "../src/i18n/fill";

export type Spec = Partial<Ball> & Pick<Ball, "c" | "x" | "y">;

export function setup(balls: Spec[]): void {
  g.setG(null);
  g.newMatch("local");
  g.G.balls = balls.map((b, id) => ({ id, vx: 0, vy: 0, wx: 0, wy: 0, wz: 0, on: true, potN: 0, ...b }));
  g.G.queue = [];
  g.beginTurn("W", null);
}

export const logged = (code: string): boolean => g.G.log.some((e) => fill(e.why, e.v).includes(code));

/** pure physics: strike the first ball and let everything roll out */
export function roll(balls: Spec[], s: Shot): Ball[] {
  setup(balls);
  g.G.stroke = {
    opening: false,
    shooter: 0,
    first: {},
    pots: [],
    power: s.p,
    spin: [0, 0],
    start: { x: 0, y: 0 },
    aim: { x: 1, y: 0 },
    touches: 0,
  };
  g.strike(g.G.balls[0], s);
  let n = 0;
  while (!g.allStill() && n++ < 200000) g.step(1 / 600);
  return g.G.balls;
}

/** speed in mm/s to power 0..1 */
export const at = (v: number): number => g.powerOf(v);
