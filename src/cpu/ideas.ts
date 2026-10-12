// One shot idea for one ball, in the style the character likes. The power comes from the distance the ball has to
// run (core/power.ts), so the ideas land in the right ballpark and the simulation sorts out the rest.
import type { AI, Ball, Color, IdeaKind, Shot } from "../types";
import { G, GOAL_X, HY, R, DOPS, DOP_R, att, powerOf, speedFor } from "../core";

const W = HY - R; // where a ball centre touches a long cushion
export const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
const rnd = (a: number, b: number): number => a + Math.random() * (b - a);
const aimAt = (b: Ball, x: number, y: number): number => Math.atan2(y - b.y, x - b.x);

export function pickKind(mix: Partial<Record<IdeaKind, number>>): IdeaKind {
  let t = Math.random() * Object.values(mix).reduce((a, b) => a + (b || 0), 0);
  for (const [k, w] of Object.entries(mix)) if ((t -= w || 0) <= 0) return k as IdeaKind;
  return "random";
}

export function idea(kind: IdeaKind, b: Ball, cc: Color, ai: AI): Shot {
  const gx = att(cc) * GOAL_X;
  let ang: number, v: number;
  switch (kind) {
    case "straight": {
      ang = aimAt(b, gx, 0) + (Math.random() - 0.5) * 0.05;
      v = speedFor(Math.hypot(gx - b.x, b.y), rnd(120, 700));
      break;
    }
    case "bank": {
      // off one or two long cushions: aim at the goal's mirror image, a cushion eats about a fifth of the speed
      const s = Math.random() < 0.5 ? 1 : -1,
        two = Math.random() < 0.35,
        ty = s * (two ? 4 : 2) * W + (Math.random() - 0.5) * 30;
      ang = aimAt(b, gx, ty);
      v = speedFor(Math.hypot(gx - b.x, ty - b.y), rnd(150, 700)) * (two ? 1.5 : 1.22);
      break;
    }
    case "post": {
      // glance a post so it bends the ball towards the goal
      const q = DOPS[(Math.random() * DOPS.length) | 0],
        a = Math.random() * Math.PI * 2,
        rr = (R + DOP_R) * (0.5 + Math.random() * 0.45);
      ang = aimAt(b, q.x + Math.cos(a) * rr, q.y + Math.sin(a) * rr);
      v = speedFor(Math.hypot(q.x - b.x, q.y - b.y) + Math.hypot(gx - q.x, q.y) * 1.3, rnd(100, 600));
      break;
    }
    case "combo": {
      // hit one of the opponent's balls and send both flying
      const opp = G.balls.filter((x) => x.on && x.c !== cc);
      if (!opp.length) return idea("straight", b, cc, ai);
      const o = opp[(Math.random() * opp.length) | 0];
      ang = aimAt(b, o.x + (Math.random() - 0.5) * 2 * R, o.y + (Math.random() - 0.5) * 2 * R);
      v = speedFor(Math.hypot(o.x - b.x, o.y - b.y), rnd(400, 1800));
      break;
    }
    default:
      ang = Math.random() * Math.PI * 2;
      v = rnd(250, 2200);
  }
  return { dx: Math.cos(ang), dy: Math.sin(ang), p: clamp(powerOf(v) * ai.powerBias, 0.12, 0.98) };
}
