// Your café as home: the regulars you beat come round for a drink. The four strongest sit on the bar stools, turned
// half round to watch the table, a glass or a cigar in hand. In anyone else's bar the stools stay empty.
import { THREE, FLOOR } from "../render/three";
import { figure, type Figure } from "../people/figure";
import { animateFigure } from "../people/animate";
import type { Opponent } from "../types";
import { C } from "./state";

const STOOLS = [-2.1, -1.26, 0.42, 2.1], // x of four of the six stools; Marcel stands by the fifth
  Z = -2.33, // the stools' line, in front of the counter
  SEAT = 0.36; // a stool is that much higher than a chair: the feet rest on its ring
const group = new THREE.Group();
let guests: Figure[] = [],
  key = "";

/** seat these regulars at the bar (the last four of the list), or nobody */
export function setGuests(scene: THREE.Scene, who: Opponent[]): void {
  const pick = who.slice(-STOOLS.length),
    k = pick.map((o) => o.id).join();
  if (!group.parent) scene.add(group);
  if (k === key) return;
  key = k;
  group.clear();
  guests = pick.map((o, i) => {
    const F = figure(o.look, "sit"),
      x = STOOLS[i];
    F.g.position.set(x, FLOOR + SEAT, Z);
    F.g.rotation.y = Math.atan2(-x, 2.33) * 0.7; // facing the room, turned towards the table
    F.idleKind = i % 2 ? "cigar" : "glass";
    F.keep = true;
    F.hold(F.idleKind);
    group.add(F.g);
    return F;
  });
}

export function animateGuests(dt: number, now: number): void {
  group.visible = !!C.groups.bar?.visible; // no counter in this bar, no stools to sit on
  if (!group.visible) return;
  for (const F of guests) animateFigure(F, dt, now);
}
