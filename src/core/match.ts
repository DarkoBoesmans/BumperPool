// A match: best of three games (house rules: one or five), colours swap each game. Turns, the opening and the shot
// clock.
import type { Color, Game, Mode, Rules } from "../types";
import { REGLEMENT, winsNeeded } from "./rules";
import { COLORS, R, START, home, inGroot, inKlein, other } from "./table";
import { G, setG, changed, ball, log, nameOf, remaining } from "./state";
import { leftFrame } from "./frames";
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
    ...(mode === "online" && prev?.mode === "online" ? { doubles: prev.doubles, board: prev.board } : {}),
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
    framePlay: false,
    spotFouls: [],
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
  G.framePlay = false;
  G.spotFouls = [];
  G.turnInfo = { obligated: [], left: {} };
  log(
    null,
    "info",
    "Game {n}: {w} plays white, {r} plays red.",
    G.manche > 1 && G.manche === winsNeeded(G.rules) * 2 - 1 ? "Deciding game. Colours as in game 1." : "",
    { n: G.manche, w: nameOf("W"), r: nameOf("R") },
  );
  startOpening();
}

export function startOpening(): void {
  G.open.shots = {};
  G.visits = { W: 0, R: 0 };
  G.phase = "openW";
  G.turn = "W";
  changed();
}

export function beginTurn(c: Color, exemptId: number | null): void {
  G.turn = c;
  G.visits = { W: 0, R: 0, ...G.visits, [c]: (G.visits?.[c] ?? 0) + 1 }; // a new visit: in doubles, the next partner
  for (const b of G.balls) if (b.c === other(c)) b.stone = false; // Minerva's stone wears off once your turn is over
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
        ? "Reminder: {name}'s ringed ball must leave the big triangle this turn."
        : "Reminder: one of {name}'s {n} ringed balls must leave the big triangle this turn.",
      "Play it out or score it, directly or off another ball. Only a ball your last shot of a turn put there may stay until your next turn. (SP/9.1)",
      { name: nameOf(c), n },
    );
  G.phase = "aim";
  resetTimer();
}

export function resetTimer(): void {
  G.timeLeft = 60;
  G.warned = false;
}

/** what the referee follows while the balls roll: obligated balls leaving the big triangle (SP/9) and balls leaving
 * their frame in frame play (SP/10). On the line still counts as inside the triangle (SP/9.3). */
export function track(): void {
  const s = G.stroke;
  if (!s || s.opening) return;
  for (const id of G.turnInfo.obligated) {
    const b = ball(id);
    if (!b.on || !inGroot(G.turn, b, R)) G.turnInfo.left[id] = true;
  }
  if (s.frames && s.moved)
    for (const id in s.frames) if (!s.moved[id] && leftFrame(ball(+id), s.frames[id])) s.moved[id] = true;
}

/** frame play starts as soon as either player is down to one ball, and lasts the rest of the game (SP/10.1) */
export function checkFramePlay(): void {
  if (G.framePlay || !G.rules.frames || (remaining("W") !== 1 && remaining("R") !== 1)) return;
  G.framePlay = true;
  log(
    null,
    "info",
    "Frame play: every shot must now send a ball out of its frame.",
    "A player is down to one ball. The lines on the cloth mark the frames; from the attack triangle you need not change frames. (SP/10)",
  );
}

/** runs a shot to the end without drawing anything: used by tests and the CPU */
export function runToRest(dt = 1 / 600, max = 120000): void {
  let n = 0;
  while (G.phase === "moving" && n++ < max) {
    step(dt);
    track();
    if (allStill()) onSettled();
  }
}
