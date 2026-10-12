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

/** one frame of crawling; false once they are back on their feet */
export function crawlStep(F: Player, dt: number): boolean {
  const cr = F.cr!,
    start = new THREE.Vector3(cr.h * 1.45, 0, 0),
    endX = -cr.h * 1.45;
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
      cb = ease(cr.t / 0.7);
      if (cr.t > 0.7) {
        cr.phase = "crawl";
        cr.t = 0;
      }
    } else if (cr.phase === "crawl") {
      cb = 1;
      cr.s += dt * 7;
      sw = Math.sin(cr.s);
      F.pos.x -= cr.h * 0.6 * dt;
      if ((F.pos.x - endX) * -cr.h >= 0) {
        F.pos.x = endX; // reached the far end
        cr.phase = "up";
        cr.t = 0;
      }
    } else {
      cb = 1 - ease(cr.t / 0.7);
      if (cr.t > 0.8) {
        F.cr = null;
        cr.done();
        return false;
      }
    }
  }
  F.g.position.set(F.pos.x, FLOOR - 0.42 * cb, F.pos.z);
  F.g.rotation.y = F.yaw;
  F.torso.rotation.set(1.45 * cb, 0, 0);
  F.head.rotation.x = -1.15 * cb;
  F.l.sh.rotation.set(-1.45 * cb + sw * 0.35, 0, 0.1);
  F.l.el.rotation.set(0, 0, 0);
  F.r.sh.rotation.set(-1.45 * cb - sw * 0.35, 0, -0.1);
  F.r.el.rotation.set(0, 0, 0);
  F.hips[0].rotation.x = sw * (cb ? 0.25 : 1);
  F.hips[1].rotation.x = -sw * (cb ? 0.25 : 1);
  return true;
}
