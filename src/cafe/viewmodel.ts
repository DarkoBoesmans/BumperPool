// First-person hand: in player view your own cigar, glass or chalk comes up in front of the camera, or the fist
// knocks twice on the rail below.
import { THREE, add, lam, facet } from "../render/three";
import { S } from "../render/renderer";
import { puff } from "../render/smoke";
import { cigar, glass, setLiquid } from "../people/things";
import { ease } from "../people/animate";
import { C } from "./state";

export function buildViewmodel(): void {
  const vm = new THREE.Group();
  S.camera.add(vm);
  vm.visible = false;
  add(vm, new THREE.BoxGeometry(0.085, 0.085, 0.36), lam(0x2a2a31), 0.035, -0.06, 0.2).rotation.x = 0.35;
  add(vm, new THREE.BoxGeometry(0.092, 0.092, 0.03), lam(0xece6d8), 0.022, -0.022, 0.05).rotation.x = 0.35; // shirt cuff
  add(vm, facet(new THREE.BoxGeometry(0.075, 0.065, 0.085)), lam(0xe2ae8c)); // fist
  add(vm, new THREE.BoxGeometry(0.03, 0.028, 0.05), lam(0xd39a78), -0.045, 0.012, -0.012); // thumb
  const cg = cigar();
  cg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-0.75, 0.4, -0.5).normalize());
  cg.position.set(-0.03, 0.02, -0.035);
  cg.scale.setScalar(0.85);
  vm.add(cg);
  const gl = glass();
  gl.scale.setScalar(1.15);
  gl.position.set(-0.07, -0.045, -0.01);
  vm.add(gl);
  const ch = add(vm, new THREE.BoxGeometry(0.03, 0.03, 0.03), lam(0x3b73c4), -0.02, 0.045, -0.03);
  C.vm = { g: vm, cigar: cg, glass: gl, chalk: ch, anim: null };
}

const REST = new THREE.Vector3(0.36, -0.42, -0.5),
  UP = new THREE.Vector3(0.15, -0.075, -0.42), // raised: right of the rail, above the spin pad
  KNOCK = new THREE.Vector3(0.12, -0.3, -0.55); // low, on the rail in front of you

export function animateViewmodel(now: number): void {
  const V = C.vm!,
    a = V.anim;
  if (!a) {
    V.g.visible = false;
    return;
  }
  const t = (now - a.t0) / 1000,
    dur = 2.7;
  if (t > dur) {
    V.anim = null;
    V.g.visible = false;
    return;
  }
  V.g.visible = true;
  V.cigar.visible = a.kind === "cigar";
  V.glass.visible = a.kind === "glass";
  V.chalk.visible = a.kind === "chalk";
  const up = t < 0.55 ? ease(t / 0.55) : t < 1.8 ? 1 : ease((dur - t) / 0.9),
    sip = ease((t - 0.6) / 0.4) * ease((1.75 - t) / 0.35);
  V.g.position.lerpVectors(REST, a.kind === "knock" ? KNOCK : UP, up);
  if (a.kind === "knock")
    V.g.position.y -= Math.max(0, Math.sin(((t - 0.55) / 0.3) * Math.PI)) * (t > 0.55 && t < 1.15 ? 0.06 : 0);
  if (a.kind === "chalk") V.g.rotation.set(0.12 * up, -0.3 * up + Math.sin(t * 9) * 0.5 * up, -0.15);
  if (a.kind !== "chalk")
    V.g.rotation.set(a.kind === "glass" ? 0.1 + 0.9 * sip : 0.12 * up, -0.3 * up, a.kind === "glass" ? 0.1 : -0.15);
  if (a.kind === "cigar") {
    V.cigar.tip.scale.setScalar(t > 0.6 && t < 1.7 ? 1.8 + Math.sin(t * 28) * 0.4 : 1);
    if (t > 1.8 && !a.puffed) {
      a.puffed = true;
      const cam = S.camera,
        f = new THREE.Vector3(0.05, -0.1, -1).applyQuaternion(cam.quaternion);
      puff(cam.position.clone().addScaledVector(f, 0.55), f, 14, 0.4, 0.55);
    }
  } else setLiquid(V.glass, Math.max(0.05, a.from - (a.from - a.to) * ease((t - 0.7) / 0.9)));
}
