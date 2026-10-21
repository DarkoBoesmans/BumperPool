// 5-0: the loser crawls under the table, end to end.
import { THREE, FLOOR } from "../render/three";
import { home } from "../core/table";
import { waypoint, walkTo } from "./walk";
import { ease } from "./animate";
import { PL, type Player } from "./player";
import type { Color } from "../types";

export interface Crawl {
  phase: "walk" | "down" | "crawl" | "up";
  t: number;
  s: number;
  h: number;
  done: () => void;
}

export function crawl(c: Color): Promise<void> {
  const F = PL.figs[c];
  if (!F) return Promise.resolve();
  return new Promise((done) => {
    F.cr = { phase: "walk", t: 0, s: 0, h: home(c), done };
    F.st = null;
  });
}

// Hands and knees, low enough for the 59 cm under the table: the thighs lean back, the shins lie flat behind, the
// back is level and the forearms rest on the floor. How high the hips sit follows from the legs, so a knee or a foot
// always touches the floor and nothing sinks into it, also halfway down and halfway up.
const THIGH = 0.44,
  SHIN = 0.42, // shin and shoe
  KNEE_R = 0.058,
  HIP_Y = 0.86, // hip height standing
  LEAN = 0.7, // how far the thighs lean back when crawling
  UNDER = 1.8; // where they go down and come up: clear of the table's ends

/** hip height above the floor for thighs at angle a and shins at a + k: whichever of knee and foot is lowest */
export const hipHeight = (a: number, k: number): number =>
  Math.max(THIGH * Math.cos(a) + KNEE_R, THIGH * Math.cos(a) + SHIN * Math.cos(a + k));

/** one frame of crawling; false once they are back on their feet */
export function crawlStep(F: Player, dt: number): boolean {
  const cr = F.cr!,
    start = new THREE.Vector3(cr.h * UNDER, 0, 0),
    endX = -cr.h * UNDER;
  let cb = 0,
    sw = 0;
  F.cue.visible = false;
  F.blend = 0;
  F.atStance = false;
  if (cr.phase === "walk") {
    const wp = waypoint(F.pos, start),
      d = walkTo(F.pos, wp, 2.4 * dt);
    if (d > 0.03) F.yaw = Math.atan2(wp.x - F.pos.x, wp.z - F.pos.z);
    F.step += dt * 9;
    sw = Math.sin(F.step) * 0.5;
    if (F.pos.distanceTo(start) < 0.03) {
      cr.phase = "down";
      cr.t = 0;
    }
  } else {
    F.yaw = Math.atan2(-cr.h, 0);
    cr.t += dt;
    if (cr.phase === "down") {
      cb = ease(Math.min(1, cr.t / 0.9));
      if (cr.t > 0.9) {
        cr.phase = "crawl";
        cr.t = 0;
      }
    } else if (cr.phase === "crawl") {
      cb = 1;
      cr.s += dt * 6;
      sw = Math.sin(cr.s);
      F.pos.x -= cr.h * 0.62 * dt * (0.75 + 0.25 * Math.abs(sw)); // a shuffle, quicker as each knee lands
      if ((F.pos.x - endX) * -cr.h >= 0) {
        F.pos.x = endX; // out at the far end
        cr.phase = "up";
        cr.t = 0;
      }
    } else {
      cb = 1 - ease(Math.min(1, cr.t / 0.9));
      if (cr.t > 1) {
        F.cr = null;
        for (const k of F.knees) k.rotation.x = 0;
        cr.done();
        return false;
      }
    }
  }
  // the legs: thighs lean back, shins fold flat behind; while crawling each leg steps a little
  const crawling = cr.phase === "crawl",
    legs = [sw, -sw].map((s) => {
      const a = LEAN * cb + (crawling ? s * 0.18 : 0),
        k = (Math.PI / 2 - LEAN) * cb - (crawling ? s * 0.18 : 0);
      return { a, k };
    }),
    hip = Math.max(...legs.map(({ a, k }) => hipHeight(a, k))),
    back = (Math.PI / 2) * cb;
  F.g.position.set(F.pos.x, FLOOR + hip - HIP_Y + (crawling ? Math.abs(sw) * 0.012 : 0), F.pos.z);
  F.g.rotation.y = F.yaw;
  F.torso.rotation.set(back, 0, crawling ? sw * 0.06 : 0);
  F.head.rotation.x = -back * 0.82; // looking ahead, under the table
  legs.forEach(({ a, k }, i) => {
    F.hips[i].rotation.x = cb ? a : sw * (i ? -1 : 1);
    F.knees[i].rotation.x = k;
  });
  // the arms: upper arms straight down from the shoulders, forearms flat on the floor, reaching in turn
  for (const [A, s] of [
    [F.l, sw],
    [F.r, -sw],
  ] as const) {
    A.sh.rotation.set(-back + (crawling ? s * 0.22 : cb ? 0 : s * 0.35), 0, A === F.l ? 0.1 : -0.1);
    A.el.rotation.set((-Math.PI / 2) * cb + (crawling ? Math.max(0, s) * 0.3 : 0), 0, 0);
  }
  return true;
}
