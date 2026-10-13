// Aiming maths: from a drag to a shot, the first thing the aim line meets, and the rings on the cloth.
import { G, ball, R, DOP_R, DOPS, HX, HY, other } from "../core";
import type { Mark } from "../render/cloth";
import type { Cast, CastHit } from "../render/aim";
import type { Shot, Spot } from "../types";
import { app, canAct, type Drag } from "../ui/app";
import { S, toScreen } from "../render/renderer";
import { V } from "../render/three";

/** a full-power pull is this share of the smaller screen side; a few pixels around the ball do nothing */
const PULL_SCREEN = 0.32,
  DEAD_PX = 14;

/** where the aim line from (ox, oy) first touches a cushion, a post or a ball */
export const castRay: Cast = (ox, oy, dx, dy, self) => {
  let best = 1e9,
    hit: CastHit | null = null;
  const walls: [boolean, number, [number, number]][] = [
    [dx > 0, (HX - R - ox) / dx, [-1, 0]],
    [dx < 0, (-HX + R - ox) / dx, [1, 0]],
    [dy > 0, (HY - R - oy) / dy, [0, -1]],
    [dy < 0, (-HY + R - oy) / dy, [0, 1]],
  ];
  for (const [ok, t, n] of walls)
    if (ok && t >= 0 && t < best) {
      best = t;
      hit = { type: "band", n };
    }
  const circ = (px: number, py: number, rad: number, info: Omit<CastHit, "n">) => {
    const fx = ox - px,
      fy = oy - py,
      b = fx * dx + fy * dy,
      c = fx * fx + fy * fy - rad * rad,
      disc = b * b - c;
    if (disc < 0) return;
    const t = -b - Math.sqrt(disc);
    if (t > 0.01 && t < best) {
      best = t;
      hit = { ...info, n: [(ox + dx * t - px) / rad, (oy + dy * t - py) / rad] }; // the surface normal at the contact
    }
  };
  for (const q of G.balls) if (q.on && q.id !== self) circ(q.x, q.y, 2 * R, { type: "ball", b: q });
  for (const d of DOPS) circ(d.x, d.y, R + DOP_R, { type: "dop" });
  return { t: best, hit };
};

/** pull back from the ball: the direction is away from the pointer, the power grows with the on-screen distance */
export function shotFrom(d: Drag): Shot | null {
  const b = G.balls.find((x) => x.id === d.id);
  if (!b) return null;
  const px = d.x - b.x,
    py = d.y - b.y,
    len = Math.hypot(px, py);
  if (len < 1) return null;
  let p = d.p;
  if (p === undefined) {
    const o = toScreen(V(b.x, b.y)),
      pull = Math.hypot((d.px ?? o.x) - o.x, (d.py ?? o.y) - o.y);
    if (pull < DEAD_PX) return null;
    p = (pull - DEAD_PX) / (Math.min(S.w, S.h) * PULL_SCREEN);
  }
  return {
    dx: -px / len,
    dy: -py / len,
    p: Math.min(1, Math.max(0, p)),
    sx: d.sx ?? app.spin.x,
    sy: d.sy ?? app.spin.y,
  };
}

/** rings on the cloth: your playable balls, balls that must leave the triangle, the opening ball, penalty spots */
export function clothMarks(): { marks: Mark[]; pens: Spot[] } {
  const marks: Mark[] = [],
    pens: Spot[] = [];
  if (app.show) return { marks, pens };
  if (G.phase === "aim" && canAct(G.turn))
    for (const b of G.balls)
      if (b.on && b.c === G.turn) {
        marks.push({
          x: b.x,
          y: b.y,
          r: R + 7,
          color: b.stone ? "rgba(160,160,150,.6)" : "rgba(255,245,225,.45)",
          w: 5,
          dash: b.stone ? [6, 6] : undefined,
        });
        if (G.turnInfo.obligated.includes(b.id) && !G.turnInfo.left[b.id])
          marks.push({ x: b.x, y: b.y, r: R + 15, color: "#ffb347", w: 6, dash: [10, 7] });
      }
  const oc = G.phase === "openW" ? "W" : G.phase === "openR" ? "R" : null;
  if (oc && canAct(oc)) {
    const b = ball(G.open.ids[oc]);
    marks.push({ x: b.x, y: b.y, r: R + 10, color: "rgba(255,245,225,.8)", w: 6 });
  }
  if (G.phase === "penalty" && G.penChoice && canAct(other(ball(G.penChoice.id).c))) pens.push(...G.penChoice.opts);
  return { marks, pens };
}
