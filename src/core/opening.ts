// The opening (SP/5.1): both players play their marked ball off their left cushion at once; closest to its goal starts.
import type { Color, Hit } from "../types";
import { COLORS, DD_X, GOAL_X, att, home, other } from "./table";
import { G, ball, clone, log, nameOf } from "./state";
import { processQueue } from "./penalty";
import { foulInfo, shot } from "./verdict";

export function evalOpening(): void {
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
        "Foul: second faulty opening shot by {name}.",
        "The opening ball must hit your left cushion first. Turn over and the ball goes to a penalty spot. (SP/5.1)",
        { name: nameOf(c) },
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
        "{name}'s opening shot missed the left cushion. Set up again.",
        "Play the middle ball softly off your left cushion first. (SP/5.1)",
        { name: nameOf(c) },
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
    log(starter, "doel", "{name}'s opening ball went straight in. {name} starts.", "", { name: nameOf(starter) });
  } else {
    starter = r.W.d <= r.R.d ? "W" : "R";
    log(starter, "info", "{name} starts.", "White stopped {w} mm from its goal, red {r} mm. Closest starts. (SP/5.1)", {
      name: nameOf(starter),
      w: Math.round(r.W.d),
      r: Math.round(r.R.d),
    });
  }
  G.lastShot!.starter = starter;
  G.nextMode = "fresh";
  G.nextColor = starter;
  G.openingBall = G.open.ids[starter];
  processQueue();
}
