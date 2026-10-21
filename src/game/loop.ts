// One frame: step the physics at 600 Hz, the shot clock, the opponent, replays, then draw everything.
import { G, ball, nameOf, log, step, track, allStill, timeout } from "../core";
import { S, render } from "../render/renderer";
import { camS, updateCamera } from "../render/camera";
import { updateBalls } from "../render/balls";
import { updateAim } from "../render/aim";
import { updateCafe, updateBoards } from "../cafe";
import { figurePos } from "../people/player";
import { rec, recStart, recStop } from "../replay/recorder";
import { stepReplay, frozen, play } from "../replay/replay";
import { settle } from "../net/online";
import { app, canAct, help, viewColor } from "../ui/app";
import { liveUI, buzzUI } from "../ui/live";
import { replayFrozen } from "../ui/replay-overlay";
import { room, measureRoom } from "../ui/room";
import { say } from "../ui/bubble";
import { buzz, aimHelp, soberUp } from "./buzz";
import { castRay, shotFrom } from "./aiming";
import { cpuTick } from "./cpu-turn";
import { blocked } from "./input";
import { boardCtx, changed } from "./refresh";
import type { Aim } from "../people/player";

const H = 1 / 600;
let last = performance.now(),
  acc = 0,
  boardTick = 0;
const portrait = () => S.w < S.h;

export function frame(now: number): void {
  requestAnimationFrame(frame); // first, so one bad frame never stops the game
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (G.phase === "moving") {
    if (!rec.active && rec.n !== G.strokeNo) recStart(G.strokeNo);
    acc += dt;
    let n = 0;
    while (acc >= H && n < 60) {
      step(H);
      acc -= H;
      n++;
    }
    track();
    if (allStill()) {
      acc = 0;
      recStop();
      settle();
    }
  } else if (G.phase === "aim" && app.set.clock && !app.drag && canAct(G.turn) && !blocked()) {
    G.timeLeft -= dt;
    if (G.timeLeft <= 15 && !G.warned) {
      G.warned = true;
      log(G.turn, "info", "15 seconds left for {name}.", "", { name: nameOf(G.turn) });
      changed();
    }
    if (G.timeLeft <= 0) timeout();
  }
  cpuTick(now, blocked());
  let f: Float32Array | null = null;
  if (play.on) {
    const was = frozen();
    f = stepReplay(dt);
    if (frozen() !== was) replayFrozen(frozen(), play.m?.foul);
  }
  if (!play.on && app.replayDone) {
    const done = app.replayDone;
    app.replayDone = null;
    done();
  }
  updateBalls(G.balls, now, f);
  // whisky and smoke wear off; the whisky of whoever's view this is blurs the picture
  soberUp(dt);
  S.flash = Math.max(0, S.flash - dt * 2.2);
  const vc = viewColor();
  S.drunk = Math.min(1, buzz.drink[vc] / 4) * (play.on ? 0.4 : 1);
  buzzUI(
    buzz.drink[vc],
    buzz.smoke,
    buzz.chalk[vc],
    buzz.fluke[vc],
    app.inGame && (buzz.fluke[vc] || performance.now() < buzz.knockUntil[vc]),
  );
  const d = app.drag,
    s = d && !play.on ? shotFrom(d) : null,
    b = s && d ? ball(d.id) : null;
  updateAim(b, s, castRay, b ? (d!.cpu ? { ...help(), bounce: 0 } : aimHelp(b.c)) : undefined);
  if (camS.replay?.crawl) {
    // follow the crawler from low beside the table
    const p = figurePos(camS.replay.crawl);
    if (p) {
      camS.replay.pos.set(Math.max(-1.2, Math.min(1.2, p.x * 0.7)), -0.2, 2.3);
      camS.replay.look.set(p.x, -0.45, 0);
    }
  }
  measureRoom(now, camS.mode === "top");
  updateCamera(dt, vc, portrait(), room);
  const cj = app.cpu,
    aim: Aim | null = play.on
      ? null
      : s && b
        ? { b, s, drawn: true }
        : cj?.shot && cj.best
          ? { b: ball(cj.best.id), s: cj.shot, drawn: false }
          : null;
  updateCafe(dt, now, {
    G,
    vc,
    aim,
    smoke: buzz.smoke,
    mine: app.set.mine,
    say: (who, text) => say(who, text, null, 3000),
  });
  liveUI(d?.cpu ? null : s, b);
  if ((boardTick -= dt) < 0) {
    boardTick = 1;
    updateBoards(boardCtx());
  }
  render(now);
}
