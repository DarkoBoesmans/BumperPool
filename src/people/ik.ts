// Two-bone IK for an arm: shoulder to elbow to hand, the elbow bending towards `pole`, blended in by k.
import { THREE } from "../render/three";
import type { Arm } from "./figure";

export const UP = new THREE.Vector3(0, 1, 0);
export const DOWN = new THREE.Vector3(0, -1, 0);
export const clampv = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
const _q = new THREE.Quaternion(),
  _q2 = new THREE.Quaternion();

export function reach(arm: Arm, target: THREE.Vector3, pole: THREE.Vector3, k: number): void {
  const sh = arm.sh.getWorldPosition(new THREE.Vector3()),
    n = target.clone().sub(sh),
    a = 0.3,
    b = 0.31;
  const d = clampv(n.length(), 0.08, (a + b) * 0.999);
  n.normalize();
  const ang = Math.acos(clampv((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  const p = pole.clone().addScaledVector(n, -pole.dot(n)).normalize();
  const u = n.clone().multiplyScalar(Math.cos(ang)).addScaledVector(p, Math.sin(ang));
  const elbow = sh.clone().addScaledVector(u, a),
    f = target.clone().sub(elbow).normalize();
  const parent = arm.sh.parent!.getWorldQuaternion(_q2);
  const shL = parent.clone().invert().multiply(_q.setFromUnitVectors(DOWN, u));
  arm.sh.quaternion.slerp(shL, k);
  const shW = parent.clone().multiply(arm.sh.quaternion);
  arm.el.quaternion.slerp(shW.invert().multiply(_q.setFromUnitVectors(DOWN, f)), k);
}
