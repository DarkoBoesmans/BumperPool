// A match: best of three games (house rules: one or five), colours swap each game. Turns, the opening and the shot
// clock.
import type { Color, Game, Mode, Rules } from "../types";
import { REGLEMENT, winsNeeded } from "./rules";
import { COLORS, R, START, home, inGroot, inKlein, other } from "./table";
import { G, setG, changed, ball, log, nameOf } from "./state";
import { step, allStill } from "./physics";
import { onSettled } from "./referee";

export function newMatch(
  mode: Mode = G?.mode || "local",
  o: { opp?: string | null; names?: string[]; rules?: Rules } = {},
): void {
  const prev = G as Game | undefined;
  const names = (o.names || prev?.names || ["Player 1", "Player 2"]).slice(0, 2) as [string, string];
  setG({
    mode,
    rules: { ...(o.rules || REGLEMENT) },
    opp: o.opp ?? prev?.opp ?? null,
    names,
    seats: mode === "online" && prev?.mode === "online" ? prev.seats : [null, null],
    wins: [0, 0],
    manche: 0,
    colorOf: ["W", "R"],
    balls: [],
    phase: "openW",
    turn: "W",
    log: [],
    queue: [],
    open: { ids: { W: 4, R: 9 }, strikes: { W: 0, R: 0 }, shots: {} },
    stroke: null,
    snap: null,
    turnInfo: { obligated: [], left: {} },
    nextMode: "switch",
    nextColor: "W",
    openingBall: null,
    timeLeft: 60,
    warned: false,
    lastPots: [],
    lastShot: null,
    simT: 0,
    strokeNo: 0,
    potN: 0,
    penChoice: null,
    endWinner: null,
    mover: null,
    powerUsed: false,
  });
  newManche();
}

export function newManche(): void {
  G.manche++;
  G.colorOf = G.manche % 2 === 0 ? ["R", "W"] : ["W", "R"];
  G.balls = [];
  let id = 0;
  for (const c of COLORS)
    for (const p of START)
      G.balls.push({ id: id++, c, x: home(c) * p.x, y: p.y, vx: 0, vy: 0, wx: 0, wy: 0, wz: 0, on: true, potN: 0 });
  G.open = { ids: { W: 4, R: 9 }, strikes: { W: 0, R: 0 }, shots: {} };
  G.queue = [];
  G.lastPots = [];
  G.penChoice = null;
  G.endWinner = null;
  G.powerUsed = false;
  G.turnInfo = { obligated: [], left: {} };
  log(
    null,
    "info",
    `Game ${G.manche}: ${nameOf("W")} plays white, ${nameOf("R")} plays red.`,
    G.manche > 1 && G.manche === winsNeeded(G.rules) * 2 - 1 ? "Deciding game. Colours as in game 1." : "",
  );
  startOpening();
}

export function startOpening(): void {
  G.open.shots = {};
  G.phase = "openW";
  G.turn = "W";
  changed();
}

export function beginTurn(c: Color, exemptId: number | null): void {
  G.turn = c;
  for (const b of G.balls) if (b.c === other(c)) b.stone = false; // Medusa's stare wears off once your turn is over
  G.turnInfo = {
    obligated: G.rules.tri
      ? G.balls
          .filter((b) => b.on && b.c === c && inGroot(c, b, R) && !(b.id === exemptId && inKlein(c, b, R)))
          .map((b) => b.id)
      : [],
    left: {},
  };
  const n = G.turnInfo.obligated.length;
  if (n)
    log(
      c,
      "info",
      n === 1
        ? `Reminder: ${nameOf(c)}'s ringed ball must leave the big triangle this turn.`
        : `Reminder: one of ${nameOf(c)}'s ${n} ringed balls must leave the big triangle this turn.`,
      "Play it out or score it, directly or off another ball. Only a ball your last shot of a turn put there may stay until your next turn. (SP/9.1)",
    );
  G.phase = "aim";
  resetTimer();
}

export function resetTimer(): void {
  G.timeLeft = 60;
  G.warned = false;
}

/** remember which obligated balls have left the big triangle (SP/9) */
export function trackTri(): void {
  if (!G.stroke || G.stroke.opening) return;
  for (const id of G.turnInfo.obligated) {
    const b = ball(id);
    if (!b.on || !inGroot(G.turn, b, R)) G.turnInfo.left[id] = true; // on the line still counts as inside (SP/9.3)
  }
}

/** runs a shot to the end without drawing anything: used by tests and the CPU */
export function runToRest(dt = 1 / 600, max = 120000): void {
  let n = 0;
  while (G.phase === "moving" && n++ < max) {
    step(dt);
    trackTri();
    if (allStill()) onSettled();
  }
}
