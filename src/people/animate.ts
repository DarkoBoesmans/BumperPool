// Idle life: breathing, a look round, a cigar or glass to the mouth, chalk twisted on the tip in front of the chest,
// and two knocks on the table, with the same IK the players use at the table.
import { THREE } from "../render/three";
import { puff } from "../render/smoke";
import { reach, DOWN } from "./ik";
import type { Figure } from "./figure";

export const ease = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));

export function animateFigure(A: Figure, dt: number, now: number): void {
  A.phase += dt;
  A.torso.scale.y = 1 + Math.sin(A.phase * 1.6) * 0.008;
  A.head.rotation.y = Math.sin(A.phase * 0.4) * 0.25;
  const base = A.sit ? [-0.9, -0.6] : [0, 0];
  let up = 0;
  if (A.anim) {
    const t = (now - A.anim.t0) / 1000;
    up = t < 0.5 ? ease(t / 0.5) : t < 1.6 ? 1 : ease((2.1 - t) / 0.5);
    if (A.anim.kind === "cigar" && A.cigar)
      A.cigar.tip.scale.setScalar(t > 0.5 && t < 1.6 ? 1.6 + Math.sin(t * 30) * 0.3 : 1);
    if (A.anim.kind === "glass" && A.glass) A.glass.rotation.x = up * -0.6;
    if (A.anim.kind === "chalk") A.r.hand.rotation.y = up * Math.sin(t * 9) * 0.9;
    if (t > 1.65 && !A.anim.puffed && A.anim.kind === "cigar") {
      A.anim.puffed = true;
      const p = A.head.getWorldPosition(new THREE.Vector3());
      const f = new THREE.Vector3(0, 0, 1).applyQuaternion(A.g.quaternion);
      puff(p.addScaledVector(f, 0.12), f, 22, 0.35);
    }
    if (t > 2.2) {
      A.anim = null;
      if (!A.keep) A.hold(null);
    }
  } else if (A.idleKind && Math.random() < dt * 0.06) A.anim = { kind: A.idleKind, t0: now };
  A.r.sh.rotation.set(base[0], 0, -0.08);
  A.r.el.rotation.set(base[1], 0, 0);
  if (up > 0.001) {
    A.g.updateMatrixWorld(true);
    const kind = A.anim?.kind,
      t = A.anim ? (now - A.anim.t0) / 1000 : 0,
      // knuckles come down on the rail twice, at 0.7 s and 1.0 s
      rap = Math.max(0, Math.sin(((t - 0.55) / 0.3) * Math.PI)) * (t > 0.55 && t < 1.15 ? 1 : 0);
    const to =
      kind === "knock"
        ? A.g.localToWorld(new THREE.Vector3(-0.12, 0.8 + rap * 0.09, 0.42))
        : kind === "chalk"
          ? A.torso.localToWorld(new THREE.Vector3(-0.02, 0.4, 0.3))
          : A.head.localToWorld(new THREE.Vector3(-0.03, -0.05, 0.17));
    const right = new THREE.Vector3(-1, 0, 0).applyQuaternion(A.g.getWorldQuaternion(new THREE.Quaternion()));
    reach(A.r, to, DOWN.clone().multiplyScalar(0.7).addScaledVector(right, 0.7), up);
  }
}
