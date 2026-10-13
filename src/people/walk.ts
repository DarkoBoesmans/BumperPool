// Getting round the table: the walkway is a rectangle round the rail, a player never walks through the table.
// The stance: behind the ball on the line of the shot, outside the rail, a step to the left so the cue sits under the chin.
import { THREE, M } from "../render/three";
import { R } from "../core/table";
import type { Point, Shot } from "../types";

const RX = 1.31,
  RZ = 0.86;

/** distance behind the ball (along -u) until outside the walkway rectangle */
function exitBack(px: number, pz: number, ux: number, uz: number): number {
  const tx = ux > 1e-6 ? (px + RX) / ux : ux < -1e-6 ? (px - RX) / ux : Infinity;
  const tz = uz > 1e-6 ? (pz + RZ) / uz : uz < -1e-6 ? (pz - RZ) / uz : Infinity;
  return Math.max(0, Math.min(tx, tz));
}
function pushOut(p: THREE.Vector3): THREE.Vector3 {
  if (Math.abs(p.x) >= RX || Math.abs(p.z) >= RZ) return p;
  if (RX - Math.abs(p.x) < RZ - Math.abs(p.z)) p.x = Math.sign(p.x || 1) * RX;
  else p.z = Math.sign(p.z || 1) * RZ;
  return p;
}
/** does the walk from a to b go through the table? (Liang-Barsky) */
function crosses(a: THREE.Vector3, b: THREE.Vector3): boolean {
  const rx = RX - 0.03,
    rz = RZ - 0.03,
    dx = b.x - a.x,
    dz = b.z - a.z;
  let t0 = 0,
    t1 = 1;
  for (const [p, q] of [
    [-dx, a.x + rx],
    [dx, rx - a.x],
    [-dz, a.z + rz],
    [dz, rz - a.z],
  ]) {
    if (Math.abs(p) < 1e-9) {
      if (q < 0) return false;
      continue;
    }
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
  }
  return t0 < t1;
}
/** the next point to walk to: straight there, or via the nearest corner of the walkway */
export function waypoint(cur: THREE.Vector3, goal: THREE.Vector3): THREE.Vector3 {
  if (!crosses(cur, goal)) return goal;
  let best = goal,
    bd = Infinity;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const c = new THREE.Vector3(sx * (RX + 0.1), 0, sz * (RZ + 0.1));
      if (crosses(cur, c)) continue;
      const d = cur.distanceTo(c) + c.distanceTo(goal);
      if (d < bd) {
        bd = d;
        best = c;
      }
    }
  return best;
}
/** where the cue sits for a shot: tip at the back of the ball, tilted up like the aiming cue */
export function cueLine(b: Point, s: Shot): { tip: THREE.Vector3; axis: THREE.Vector3 } {
  const tip = new THREE.Vector3((b.x - s.dx * R) * M, R * M, (b.y - s.dy * R) * M);
  return { tip, axis: new THREE.Vector3(s.dx, -0.2, s.dy).normalize() };
}
export function stance(b: Point, s: Shot): { pos: THREE.Vector3; yaw: number; back: number } {
  const bx = b.x * M,
    bz = b.y * M,
    back = Math.max(0.98, exitBack(bx, bz, s.dx, s.dy) + 0.03),
    yaw = Math.atan2(s.dx, s.dy);
  const pos = new THREE.Vector3(bx - s.dx * back + Math.cos(yaw) * 0.1, 0, bz - s.dy * back - Math.sin(yaw) * 0.1);
  return { pos: pushOut(pos), yaw, back };
}
/** step towards `to`, at most `max` metres */
export function walkTo(p: THREE.Vector3, to: THREE.Vector3, max: number): number {
  const d = p.distanceTo(to);
  if (d > 1e-4) p.addScaledVector(to.clone().sub(p).normalize(), Math.min(d, max));
  return d;
}
