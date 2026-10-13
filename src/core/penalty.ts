// Penalty spots (SP/12), who plays next, and the end of a game.
import type { Ball, Color, Spot } from "../types";
import { DOPS, DOP_R, HX, HY, R, other, spots } from "./table";
import { G, ball, changed, log, nameOf, push, remaining } from "./state";
import { beginTurn, resetTimer, startOpening } from "./match";
import { winsNeeded } from "./rules";

/** is there room for a ball here? */
export function free(x: number, y: number, ignore = -1): boolean {
  if (Math.abs(x) > HX - R + 0.1 || Math.abs(y) > HY - R + 0.1) return false;
  if (G.balls.some((b) => b.on && b.id !== ignore && Math.hypot(b.x - x, b.y - y) < 2 * R - 0.2)) return false;
  if (DOPS.some((d) => Math.hypot(d.x - x, d.y - y) < R + DOP_R - 0.2)) return false;
  return true;
}
function spiral(c: Color): Spot {
  const base = spots(c)[2];
  for (let r = 70; r < 900; r += 35)
    for (let a = 0; a < Math.PI * 2; a += 0.3) {
      const x = base.x + Math.cos(a) * r,
        y = base.y + Math.sin(a) * r;
      if (free(x, y)) return { n: "free", x, y };
    }
  return { n: "free", x: 0, y: 0 };
}
function place(b: Ball, p: { x: number; y: number }): void {
  Object.assign(b, { x: p.x, y: p.y, vx: 0, vy: 0, wx: 0, wy: 0, wz: 0, on: true, potN: 0, skim: 0, stone: false });
}

export function processQueue(): void {
  while (G.queue.length) {
    const b = ball(G.queue[0]);
    b.on = false;
    b.vx = b.vy = 0;
    const sp = spots(b.c);
    if (free(sp[0].x, sp[0].y) && free(sp[1].x, sp[1].y)) {
      G.phase = "penalty";
      G.penChoice = { id: b.id, opts: [sp[0], sp[1]] };
      changed();
      return;
    }
    const p = sp.find((q) => free(q.x, q.y)) || spiral(b.c);
    place(b, p);
    log(b.c, "info", `${nameOf(b.c)}'s ball placed on penalty spot ${p.n}.`);
    G.queue.shift();
  }
  afterQueue();
}

export function choosePen(i: number): void {
  const pc = G.penChoice;
  if (!pc) return;
  const b = ball(pc.id),
    p = pc.opts[i];
  place(b, p);
  log(other(b.c), "info", `${nameOf(other(b.c))} put ${nameOf(b.c)}'s ball on penalty spot ${p.n}.`);
  G.queue.shift();
  G.penChoice = null;
  processQueue();
  changed();
  push();
}

function checkWinner(): Color | null {
  const w = remaining("W"),
    r = remaining("R");
  if (w && r) return null;
  if (!w && !r) {
    // both cleared in one shot: whoever's last ball went in first (SP/7.3)
    const last = (c: Color) => Math.max(-1, ...G.lastPots.filter((p) => p.c === c).map((p) => p.t));
    return last("W") <= last("R") ? "W" : "R";
  }
  return !w ? "W" : "R";
}

function afterQueue(): void {
  G.penChoice = null;
  const w = checkWinner();
  if (w) {
    mancheEnd(w);
    changed();
    return;
  }
  if (G.nextMode === "continue") {
    G.phase = "aim";
    resetTimer();
  } else if (G.nextMode === "redoOpening") startOpening();
  else beginTurn(G.nextColor, G.nextMode === "fresh" ? G.openingBall : null);
  G.openingBall = null;
  changed();
}

function mancheEnd(wc: Color): void {
  const p = G.colorOf.indexOf(wc);
  G.wins[p]++;
  G.endWinner = p;
  G.phase = G.wins[p] >= winsNeeded(G.rules) ? "matchEnd" : "mancheEnd";
  if (G.lastShot) {
    G.lastShot.end = G.phase === "matchEnd" ? "match" : "game";
    G.lastShot.winner = wc;
  }
  log(
    wc,
    "doel",
    `${G.names[p]} wins game ${G.manche}.` +
      (G.phase === "matchEnd" ? ` Match won ${G.wins[p]}-${G.wins[1 - p]}.` : ""),
  );
}
