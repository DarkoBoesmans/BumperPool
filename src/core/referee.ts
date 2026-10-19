// Shots and the referee (spelreglement 2026-2027): fouls (SP/6.7, 7.2, 7.4, 8.1, 9, 10, 3.2) and goals.
// The opening is in opening.ts, frames in frames.ts, penalty spots in penalty.ts; RULES.md maps every article to code.
// Log lines are English with {placeholders}; the HUD translates them (core has no DOM).
import type { Ball, Color, Foul, Shot, Stroke } from "../types";
import { COLORS, GOAL_X, R, aimsAtGoal, att, cornerBall, flyer, inGroot, inKlein, other, spots } from "./table";
import { framesOf } from "./frames";
import { G, ball, changed, clone, log, nameOf, push, remaining, sfx, hooks } from "./state";
import { strike } from "./physics";
import { isHard } from "./power";
import { FOULS, PENALTY } from "./fouls";
import { processQueue } from "./penalty";
import { evalOpening } from "./opening";
import { foulInfo, shot } from "./verdict";

export function fire(id: number, s: Shot): void {
  if (!G.rules.spin) s = { ...s, sx: 0, sy: 0 }; // house rule: centre ball only
  sfx("cue", s.p);
  if (G.phase === "openW" || G.phase === "openR") {
    const c: Color = G.phase === "openW" ? "W" : "R";
    G.open.shots[c] = s;
    if (c === "W") {
      G.phase = "openR";
      G.turn = "R";
    } else {
      G.snap = clone(G.balls);
      G.strokeNo++;
      G.simT = 0;
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
      for (const k of COLORS) strike(ball(G.open.ids[k]), G.open.shots[k] as Shot);
      G.phase = "moving";
      G.mover = hooks.me();
    }
    changed();
    push();
    return;
  }
  if (G.phase !== "aim") return;
  const b = ball(id);
  G.snap = clone(G.balls);
  G.strokeNo++;
  G.simT = 0;
  G.stroke = {
    opening: false,
    shooter: id,
    first: {},
    pots: [],
    power: s.p,
    spin: [s.sx || 0, s.sy || 0],
    start: { x: b.x, y: b.y },
    aim: { x: s.dx, y: s.dy },
    touches: 0,
    fromSpot: spots(b.c).find((q) => Math.hypot(q.x - b.x, q.y - b.y) < 1)?.n,
  };
  if (G.framePlay) {
    G.stroke.frames = Object.fromEntries(G.balls.filter((x) => x.on).map((x) => [x.id, framesOf(x)]));
    G.stroke.moved = {};
  }
  strike(b, s);
  G.phase = "moving";
  G.mover = hooks.me();
  changed();
  push();
}

export function onSettled(): void {
  if (G.stroke?.opening) evalOpening();
  else evalStroke();
  changed();
}

/** SP/7.4 forbids only a direct goal attempt: aimed between the goal posts and not played off a ball or a cushion first */
function direct(s: Stroke): boolean {
  const f = s.first[s.shooter];
  return aimsAtGoal(ball(s.shooter).c, s.start, s.aim) && (!f || f.type === "dop");
}

function evalStroke(): void {
  const s = G.stroke!,
    sb = ball(s.shooter),
    c = sb.c,
    o = other(c);
  const fc = s.first[s.shooter],
    hard = isHard(s.power),
    at0 = { t: 0, x: s.start.x, y: s.start.y };
  const rules = G.rules;
  let foul: Foul | null = null;
  if (rules.own && fc && fc.type === "ball" && ball(fc.id!).c === c) foul = foulInfo("own", c, sb, fc);
  else if (rules.hard && hard && direct(s) && cornerBall(c, s.start)) foul = foulInfo("hard", c, sb, at0);
  else if (rules.fly && hard && flyer(s.start, s.aim)) foul = foulInfo("fly", c, sb, at0);
  else if (s.frames && !Object.keys(s.moved || {}).length && !inGroot(c, s.start, R))
    foul = foulInfo("frame", c, sb, null); // SP/10.2: no ball left its frame, and the cue ball was not in the attack triangle
  G.queue = [];
  G.lastPots = s.pots;
  shot();
  const L = G.lastShot!;
  if (foul) {
    // frame play: no ball left its frame, so nothing moved far; the rule only sends the cue ball to a spot (SP/10.2)
    const next = foul.key === "frame" ? "Turn over and the ball goes to a penalty spot." : PENALTY;
    L.foul = { ...foul, next };
    if (foul.key !== "frame") G.balls = clone(G.snap!);
    if (G.framePlay && s.fromSpot) G.spotFouls = [...(G.spotFouls || []), c + s.fromSpot];
    log(c, "fout", "Foul by {name}: {foul}.", "{why} {next} ({code})", {
      name: nameOf(c),
      foul: foul.title,
      why: foul.why,
      next,
      code: foul.code,
    });
    G.queue = [s.shooter];
    G.nextMode = "switch";
    G.nextColor = o;
    processQueue();
    return;
  }
  const own = s.pots.filter((p) => p.c === c && p.h === att(c));
  const wrong = s.pots.filter((p) => p.c === c && p.h !== att(c));
  const opp = s.pots.filter((p) => p.c !== c);
  if (own.length)
    log(
      c,
      "doel",
      own.length === 1 ? "Goal for {name}. Shoot again." : "{n} goals in one shot for {name}. Shoot again.",
      "",
      { name: nameOf(c), n: own.length },
    );
  if (opp.length)
    log(
      o,
      "doel",
      opp.length === 1 ? "A ball of {name} went into a goal." : "{n} balls of {name} went into a goal.",
      "Knocking an opponent's ball into any goal scores it for them. (SP/7.2)",
      { name: nameOf(o), n: opp.length },
    );
  if (wrong.length) {
    const p = wrong[wrong.length - 1];
    L.foul = foulInfo("wrong", c, ball(p.id), p, {
      next: own.length
        ? "The ball goes to a penalty spot, but you also scored, so you keep shooting. (SP/7.3)"
        : "Turn over and the ball goes to a penalty spot.",
    });
    for (const w of wrong) G.queue.push(w.id);
    log(
      c,
      "fout",
      "Foul: {name}'s ball went into the wrong goal.",
      own.length
        ? "Your balls only count in the goal at the far end. It goes to a penalty spot, but you also scored, so you keep shooting. (SP/7.3)"
        : "Your balls only count in the goal at the far end. It goes to a penalty spot and your turn ends. (SP/7.2)",
      { name: nameOf(c) },
    );
  }
  guardedGoal(c, sb, own.length > 0);
  if (own.length && rules.golden) {
    // house rule: the first goal wins the game, the rest of the shooter's balls go to the tray
    log(c, "doel", "Golden goal: {name} wins the game.", "", { name: nameOf(c) });
    for (const b of G.balls) if (b.on && b.c === c) Object.assign(b, { on: false, vx: 0, vy: 0, potN: ++G.potN });
  }
  if (own.length) {
    G.nextMode = "continue";
    G.nextColor = c;
  } else {
    G.nextMode = "switch";
    G.nextColor = o;
    const ended = remaining("W") === 0 || remaining("R") === 0;
    const parked = !ended && triCheck(); // logs its own foul
    if (!parked && !wrong.length) log(c, "beurt", "No goal. {name} to play.", "", { name: nameOf(o) });
  }
  processQueue();
}

/** SP/9.5: while a defender's ball guards the small triangle, the cue ball may not end up in the big triangle */
function guardedGoal(c: Color, sb: Ball, scored: boolean): void {
  const o = other(c),
    guard = (balls: Ball[], zone: typeof inGroot) => balls.some((b) => b.on && b.c === o && zone(c, b, R));
  if (!G.rules.tri || !sb.on || !inGroot(c, sb, R) || !guard(G.snap!, inGroot) || !guard(G.balls, inKlein)) return;
  const next = scored
    ? "The ball goes to a penalty spot. You scored, so you keep shooting."
    : "The ball goes to a penalty spot.";
  if (G.lastShot) G.lastShot.foul = foulInfo("small", c, sb, { t: -1, x: sb.x, y: sb.y }, { next });
  G.queue.push(sb.id);
  log(c, "fout", "Foul: {name}'s ball stopped in front of a guarded goal.", "{why} {next} (SP/9.5)", {
    name: nameOf(c),
    why: FOULS.small.why,
    next,
  });
}

/** SP/9: a ball that started the turn in the big triangle must leave it during the turn */
function triCheck(): boolean {
  const c = G.turn,
    ti = G.turnInfo;
  if (!ti.obligated.length) return false;
  const stay = ti.obligated.filter((id) => !ti.left[id]);
  const viol = ti.obligated.length === 1 ? stay.length === 1 : stay.length === ti.obligated.length;
  if (!viol) return false;
  const b = ball(stay[0]);
  if (G.lastShot) G.lastShot.foul = foulInfo("tri", c, b, { t: -1, x: b.x, y: b.y }, { next: PENALTY });
  G.balls = clone(G.snap!);
  G.queue = stay.slice();
  log(c, "fout", "Foul: {name} left a ball parked in the big triangle.", "{why} {next} ({code})", {
    name: nameOf(c),
    why: FOULS.tri.why,
    next: PENALTY,
    code: `SP/9.${ti.obligated.length > 1 ? 2 : 1}`,
  });
  return true;
}

export function timeout(): void {
  const c = G.turn;
  G.strokeNo++;
  G.stroke = null;
  shot({ shooter: c, foul: foulInfo("time", c, null, null, { next: "Turn over." }) });
  log(c, "fout", "Foul: {name} ran out of time.", "You have one minute per shot. Your turn ends. (SP/3.2)", {
    name: nameOf(c),
  });
  G.snap = clone(G.balls);
  G.queue = [];
  G.lastPots = [];
  G.nextMode = "switch";
  G.nextColor = other(c);
  const mine = G.balls.filter((b) => b.on && b.c === c);
  if (mine.length === 1 && inGroot(c, mine[0], R)) {
    // out of time with your last ball in the attack triangle: it goes to a penalty spot (SP/8.2.3)
    G.queue = [mine[0].id];
    log(
      c,
      "fout",
      "{name}'s last ball goes to a penalty spot.",
      "Out of time with the last ball in the attack triangle. (SP/8.2.3)",
      { name: nameOf(c) },
    );
  } else if (G.framePlay && mine.length) {
    // frame play: the opponent picks one of your balls for a penalty spot; they pick the one nearest its goal (SP/3.2)
    const near = mine.sort((a, b) => Math.abs(a.x - att(c) * GOAL_X) - Math.abs(b.x - att(c) * GOAL_X))[0];
    G.queue = [near.id];
    log(c, "fout", "{name}'s ball nearest the goal goes to a penalty spot.", "Out of time in frame play. (SP/3.2)", {
      name: nameOf(c),
    });
  } else triCheck();
  processQueue();
  changed();
  push();
}
