// The Pearlescent legends bend the table once per game, just before one of their own shots.
// Tide (Poseidon): a wave carries their balls towards their goal. Stone (Medusa): your ball nearest your goal turns
// to stone for your next turn. Thunder (Thor): lightning in front of their goal throws your blockers clear.
// The moves are worked out here and animated by the renderer; the referee never sees them.
import type { Ball, Color } from "../types";
import { GOAL_X, att, loc, other } from "./table";
import { G, log, nameOf } from "./state";
import { free } from "./penalty";

export type Power = "tide" | "stone" | "thunder";
export interface Move {
  id: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
}
export const POWER_INFO: Record<Power, { word: string; sub: string; why: string }> = {
  tide: {
    word: "HIGH TIDE!",
    sub: "A wave carries Poseidon's balls closer to his goal",
    why: "Once per game the Lord of the Deep sends a wave across the cloth.",
  },
  stone: {
    word: "STONE STARE!",
    sub: "Your ball nearest your goal is stone until your turn ends",
    why: "Once per game Medusa looks at one of your balls. It can't be played and doesn't budge when hit.",
  },
  thunder: {
    word: "THUNDER!",
    sub: "Lightning clears the balls in front of Thor's goal",
    why: "Once per game the hammer comes down in front of his goal.",
  },
};

const on = (c: Color): Ball[] => G.balls.filter((b) => b.on && b.c === c);
const goalDist = (c: Color, b: Ball): number => Math.hypot(b.x - att(c) * GOAL_X, b.y);

/** slide a ball towards (tx, ty) in 6 mm steps, stopping where it would touch something */
function slide(b: Ball, tx: number, ty: number): Move | null {
  const from = { x: b.x, y: b.y },
    d = Math.hypot(tx - b.x, ty - b.y),
    n = Math.floor(d / 6);
  let x = b.x,
    y = b.y;
  for (let i = 1; i <= n; i++) {
    const nx = from.x + ((tx - from.x) * i) / n,
      ny = from.y + ((ty - from.y) * i) / n;
    if (!free(nx, ny, b.id)) break;
    x = nx;
    y = ny;
  }
  if (Math.hypot(x - from.x, y - from.y) < 5) return null;
  b.x = x;
  b.y = y;
  return { id: b.id, from, to: { x, y } };
}

/** should the legend use their power now? */
export function wantsPower(kind: Power, c: Color): boolean {
  if (G.powerUsed || G.phase !== "aim" || G.turn !== c) return false;
  const you = other(c);
  if (kind === "tide") return on(c).filter((b) => loc(c, b).u > 420).length >= 2;
  if (kind === "stone") return on(you).length >= 2 && on(you).some((b) => loc(you, b).u < 520);
  return on(you).some((b) => goalDist(c, b) < 300);
}

/** applies the power to the live game and returns the balls that moved */
export function usePower(kind: Power, c: Color): Move[] {
  G.powerUsed = true;
  const moves: Move[] = [];
  const g = att(c),
    you = other(c);
  if (kind === "tide") {
    for (const b of on(c).sort((a, z) => goalDist(c, a) - goalDist(c, z))) {
      const u = loc(c, b).u;
      if (u <= 420) continue;
      const m = slide(b, b.x + g * Math.min(170, u - 420), b.y * 0.9);
      if (m) moves.push(m);
    }
  } else if (kind === "stone") {
    const b = on(you).sort((a, z) => loc(you, a).u - loc(you, z).u)[0];
    if (b) b.stone = true;
  } else {
    const cx = g * GOAL_X;
    for (const b of on(you)) {
      const d = goalDist(c, b);
      if (d >= 300) continue;
      const ax = (b.x - cx) / (d || 1),
        ay = (b.y || 1) / (d || 1);
      const m = slide(b, cx + ax * 330 - g * 40, ay * 330);
      if (m) moves.push(m);
    }
  }
  log(
    c,
    "info",
    `${nameOf(c)} used a legend's power: ${POWER_INFO[kind].word.replace("!", "").toLowerCase()}.`,
    POWER_INFO[kind].why,
  );
  return moves;
}
