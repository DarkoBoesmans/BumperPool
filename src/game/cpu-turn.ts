// The opponent's turn: think a few milliseconds per frame, walk round to the ball, draw the cue back, shoot.
// A Pearlescent legend may use their power first.
import { G, ball, other, fire, choosePen, wantsPower } from "../core";
import { planCpu, think } from "../cpu/brain";
import { shaky } from "../cpu/hand";
import { PL } from "../people/player";
import { app } from "../ui/app";
import { buzz, doEmote, chalkShot } from "./buzz";
import { powerShow } from "./show";
import { R } from "../core/table";

export function cpuTick(now: number, blocked: boolean): void {
  if (G.mode !== "cpu" || blocked || !app.opp) {
    if (app.cpu?.aiming) {
      app.drag = null;
      app.cpu = null;
    }
    return;
  }
  const cc = G.colorOf[1],
    o = app.opp,
    ai = o.ai;
  if (!app.cpu) {
    const aiming =
      (G.phase === "aim" && G.turn === cc) ||
      (G.phase === "openW" && cc === "W") ||
      (G.phase === "openR" && cc === "R");
    if (aiming) {
      if (o.power && G.phase === "aim" && wantsPower(o.power, cc)) {
        app.cpu = { readyAt: now + 900, act: () => void powerShow(o.power!, cc) };
        return;
      }
      app.cpu = { ...planCpu(cc, ai), readyAt: now + ai.think };
      const r = Math.random(),
        h = o.habits;
      if (r < h.smoke * 0.45) doEmote(cc, "cigar", false);
      else if (r < (h.smoke + h.drink) * 0.45) doEmote(cc, "glass", false);
      else if (ai.spin > 0 && buzz.chalk[cc] < 0.6) doEmote(cc, "chalk", false); // spin players keep their tip chalked
    } else if (G.phase === "penalty" && other(ball(G.penChoice!.id).c) === cc)
      app.cpu = { act: () => choosePen(Math.random() < 0.5 ? 0 : 1), readyAt: now + 900 };
    return;
  }
  const j = app.cpu;
  if (j.act) {
    if (now >= j.readyAt) {
      app.cpu = null;
      j.act();
    }
    return;
  }
  if (!think(j as Parameters<typeof think>[0])) return;
  if (!j.shot) {
    const wobble =
      (1 + (ai.tipsy || 0) * Math.min(4, app.oppSips)) * (1 + buzz.smoke * (o.habits.smoke > 0.5 ? 0.25 : 0.9));
    j.shot = shaky(j.best!.s, ai, wobble);
    j.aimAt = Math.max(now, j.readyAt - 800);
    j.walkUntil = now + 4500;
  }
  if (now < j.aimAt!) return;
  if (!j.aiming) {
    // wait until they have walked round to the ball
    if (!PL.figs[cc]?.atStance && now < j.walkUntil!) return;
    j.aiming = true;
    j.aimAt = now;
  }
  const b = ball(j.best!.id),
    k = Math.min(1, (now - j.aimAt!) / 650),
    p = j.shot.p * (1 - Math.pow(1 - k, 3)),
    len = R * 3;
  app.drag = {
    id: b.id,
    x: b.x - j.shot.dx * len,
    y: b.y - j.shot.dy * len,
    p,
    cpu: true,
    sx: j.shot.sx,
    sy: j.shot.sy,
  };
  if (now - j.aimAt! > 900) {
    app.drag = null;
    app.cpu = null;
    fire(b.id, chalkShot(cc, j.shot, false));
  }
}
