// Scores a position and plays shots on a copy of the game, judged by the real referee.
import type { AI, Color, Shot } from "../types";
import {
  G,
  GOAL_X,
  withCopy,
  fire,
  step,
  track,
  allStill,
  onSettled,
  strike,
  ball,
  remaining,
  other,
  fouls,
  loc,
  inKlein,
  onderStoot,
  att,
} from "../core";

const SIM_DT = 1 / 240;
const SIM_SECONDS = 20; // a slow ball can roll for a long time on this cloth

export interface Cand {
  id: number;
  s: Shot;
}

/** how good the table looks for colour cc */
function judge(cc: Color, ai: AI): number {
  let s = 0;
  for (const x of G.balls)
    if (x.on) {
      const { u, v } = loc(x.c, x),
        near = Math.max(0, 1 - Math.hypot(u, v * 1.5) / 1200);
      // a ball tucked in the corner beside the goal looks close but is stuck there: soft shots only and the post blocks the way
      const stuck = onderStoot(x.c, x) && !inKlein(x.c, x) && u < 200;
      if (x.c === cc) s += stuck ? -30 : 24 * near + (inKlein(cc, x) ? 12 + (ai.triangle || 0) : 0);
      else s += stuck ? 10 : -(18 + 40 * ai.defense) * near;
    }
  return s;
}

export function simShot(cc: Color, c: Cand, ai: AI, dt = SIM_DT): number {
  return withCopy(() => {
    const mine = remaining(cc),
      theirs = remaining(other(cc)),
      f = fouls(cc);
    fire(c.id, c.s);
    let n = 0;
    const max = SIM_SECONDS / dt;
    while (G.phase === "moving" && n++ < max) {
      step(dt);
      track();
      if (allStill()) onSettled();
    }
    const scored = mine - remaining(cc),
      touches = G.stroke?.touches || 0;
    let s = scored * 100 - (theirs - remaining(other(cc))) * 70 - (fouls(cc) > f ? 150 * (ai.risk ?? 1) : 0);
    if (scored > 0) s += (ai.flair || 0) * Math.min(4, touches); // style points for goals off cushions and posts
    if (G.phase === "aim" && G.turn === cc) s += 15;
    return s + judge(cc, ai);
  });
}

export function simOpening(cc: Color, c: Cand): number {
  return withCopy(() => {
    const b = ball(c.id);
    G.stroke = {
      opening: true,
      shooter: -1,
      first: {},
      pots: [],
      power: 0,
      spin: [0, 0],
      start: { x: 0, y: 0 },
      aim: { x: 1, y: 0 },
      touches: 0,
    };
    strike(b, c.s);
    let n = 0;
    while (!allStill() && n++ < SIM_SECONDS / SIM_DT) step(SIM_DT);
    const fc = G.stroke.first[c.id];
    if (!fc || fc.type !== "band" || fc.side !== (cc === "W" ? "y-" : "y+")) return -1e4;
    return b.on ? -Math.hypot(b.x - att(cc) * GOAL_X, b.y) : 500;
  });
}
