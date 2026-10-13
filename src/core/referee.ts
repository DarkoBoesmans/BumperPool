// Shots and the referee (GZV spelreglement 2026-2027): the opening (SP/5), fouls (SP/6.7, 7.2, 7.4, 8.1, 9, 3.2).
import type { Ball, Color, Foul, FoulKey, Hit, LastShot, Shot, Stroke } from "../types";
import { COLORS, DD_X, GOAL_X, R, aimsAtGoal, att, cornerBall, flyer, home, inGroot, other } from "./table";
import { G, ball, changed, clone, log, nameOf, push, remaining, sfx, hooks } from "./state";
import { strike } from "./physics";
import { isHard } from "./power";
import { FOULS, PENALTY } from "./fouls";
import { processQueue } from "./penalty";

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
  };
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

function shot(extra: Partial<LastShot> = {}): void {
  const s = G.stroke,
    shooter = s && !s.opening ? ball(s.shooter).c : null,
    own = s && shooter ? s.pots.filter((p) => p.c === shooter && p.h === att(shooter)) : [];
  G.lastShot = {
    n: G.strokeNo,
    shooter,
    pots: s ? s.pots.slice() : [],
    foul: null,
    end: null,
    lucky: own.length > 0 && (own.some((p) => p.id !== s!.shooter) || s!.touches >= 3),
    ...extra,
  };
}
function foulInfo(
  key: FoulKey,
  c: Color,
  b: Ball | null,
  at: { t: number; x: number; y: number } | null,
  extra: Partial<Foul> = {},
): Foul {
  return {
    key,
    ...FOULS[key],
    c,
    ball: b ? b.id : null,
    t: at ? at.t : 0,
    x: at ? at.x : (b?.x ?? 0),
    y: at ? at.y : (b?.y ?? 0),
    ...extra,
  };
}

function evalOpening(): void {
  const stroke = G.stroke!;
  const r = {} as Record<Color, { ok: boolean; fc?: Hit; potted: boolean; d: number }>;
  for (const c of COLORS) {
    const id = G.open.ids[c],
      b = ball(id),
      fc = stroke.first[id];
    r[c] = {
      ok: !!fc && fc.type === "band" && fc.side === (c === "W" ? "y-" : "y+"),
      fc,
      potted: !b.on,
      d: b.on ? Math.hypot(b.x - att(c) * GOAL_X, b.y) : 0,
    };
  }
  G.queue = [];
  shot({ opening: true });
  const bad = COLORS.filter((c) => !r[c].ok);
  if (bad.length) {
    const c0 = bad[0],
      b0 = ball(G.open.ids[c0]);
    G.lastShot!.foul = foulInfo("open", c0, b0, r[c0].fc || { t: 0.4, x: b0.x, y: b0.y });
    G.balls = clone(G.snap!);
    const second = bad.filter((c) => ++G.open.strikes[c] >= 2);
    if (second.length === 1) {
      const c = second[0];
      G.lastShot!.foul = foulInfo("open", c, ball(G.open.ids[c]), r[c].fc ?? null, {
        next: "Second bad opening: turn over and the ball goes to a penalty spot.",
      });
      log(
        c,
        "fout",
        `Foul: second faulty opening shot by ${nameOf(c)}.`,
        "The opening ball must hit your left cushion first. Turn over and the ball goes to a penalty spot. (SP/5.1)",
      );
      G.queue = [G.open.ids[c]];
      G.nextMode = "fresh";
      G.nextColor = other(c);
      G.openingBall = null;
      G.turn = c;
      processQueue();
      return;
    }
    if (second.length === 2) G.open.strikes = { W: 0, R: 0 };
    G.lastShot!.foul!.next = "Set up again and replay the opening.";
    for (const c of bad)
      log(
        c,
        "fout",
        `${nameOf(c)}'s opening shot missed the left cushion. Set up again.`,
        "Play the middle ball softly off your left cushion first. (SP/5.1)",
      );
    G.nextMode = "redoOpening";
    processQueue();
    return;
  }
  G.lastPots = stroke.pots;
  if (r.W.potted && r.R.potted) {
    log(
      null,
      "doel",
      "Both opening balls went in and both count.",
      "Shoot the opening again with another ball. (SP/5.1)",
    );
    for (const c of COLORS) {
      const spot = { x: home(c) * DD_X, y: 0 };
      const cand = G.balls
        .filter((b) => b.on && b.c === c)
        .sort((a, b) => Math.hypot(a.x - spot.x, a.y) - Math.hypot(b.x - spot.x, b.y))[0];
      if (cand) G.open.ids[c] = cand.id;
    }
    G.nextMode = "redoOpening";
    processQueue();
    return;
  }
  let starter: Color;
  if (r.W.potted || r.R.potted) {
    starter = r.W.potted ? "W" : "R";
    log(starter, "doel", `${nameOf(starter)}'s opening ball went straight in. ${nameOf(starter)} starts.`);
  } else {
    starter = r.W.d <= r.R.d ? "W" : "R";
    log(
      starter,
      "info",
      `${nameOf(starter)} starts.`,
      `White stopped ${Math.round(r.W.d)} mm from its goal, red ${Math.round(r.R.d)} mm. Closest starts. (SP/5.1)`,
    );
  }
  G.lastShot!.starter = starter;
  G.nextMode = "fresh";
  G.nextColor = starter;
  G.openingBall = G.open.ids[starter];
  processQueue();
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
  const R = G.rules;
  let foul: Foul | null = null;
  if (R.own && fc && fc.type === "ball" && ball(fc.id!).c === c) foul = foulInfo("own", c, sb, fc);
  else if (R.hard && hard && direct(s) && cornerBall(c, s.start)) foul = foulInfo("hard", c, sb, at0);
  else if (R.fly && hard && flyer(s.start, s.aim)) foul = foulInfo("fly", c, sb, at0);
  G.queue = [];
  G.lastPots = s.pots;
  shot();
  const L = G.lastShot!;
  if (foul) {
    L.foul = { ...foul, next: PENALTY };
    G.balls = clone(G.snap!);
    log(c, "fout", `Foul: ${foul.title.toLowerCase()} by ${nameOf(c)}.`, `${foul.why} ${PENALTY} (${foul.code})`);
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
      own.length === 1
        ? `Goal for ${nameOf(c)}. Shoot again.`
        : `${own.length} goals in one shot for ${nameOf(c)}. Shoot again.`,
    );
  if (opp.length)
    log(
      o,
      "doel",
      `${opp.length === 1 ? "A ball" : opp.length + " balls"} of ${nameOf(o)} went into a goal.`,
      "Knocking an opponent's ball into any goal scores it for them. (SP/7.2)",
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
      `Foul: ${nameOf(c)}'s ball went into the wrong goal.`,
      "Your balls only count in the goal at the far end. It goes to a penalty spot" +
        (own.length ? ", but you also scored, so you keep shooting. (SP/7.3)" : " and your turn ends. (SP/7.2)"),
    );
  }
  if (own.length && R.golden) {
    // house rule: the first goal wins the game, the rest of the shooter's balls go to the tray
    log(c, "doel", `Golden goal: ${nameOf(c)} wins the game.`);
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
    if (!parked && !wrong.length) log(c, "beurt", `No goal. ${nameOf(o)} to play.`);
  }
  processQueue();
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
  log(
    c,
    "fout",
    `Foul: ${nameOf(c)} left a ball parked in the big triangle.`,
    `${FOULS.tri.why} ${PENALTY} (SP/9.${ti.obligated.length > 1 ? 2 : 1})`,
  );
  return true;
}

export function timeout(): void {
  const c = G.turn;
  G.strokeNo++;
  G.stroke = null;
  shot({ shooter: c, foul: foulInfo("time", c, null, null, { next: "Turn over." }) });
  log(c, "fout", `Foul: ${nameOf(c)} ran out of time.`, "You have one minute per shot. Your turn ends. (SP/3.2)");
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
      `${nameOf(c)}'s last ball goes to a penalty spot.`,
      "Out of time with the last ball in the attack triangle. (SP/8.2.3)",
    );
  } else triCheck();
  processQueue();
  changed();
  push();
}
