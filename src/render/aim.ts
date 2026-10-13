// Aiming: the cue, the dot where the tip hits, the aim line in the colour of the power band, the ghost ball, where a
// hit ball goes, and the next bounce.
import { THREE, M, V, add, lam, basic, phong } from "./three";
import { R } from "../core/table";
import { bandOf } from "../core/power";
import type { Ball, Shot } from "../types";
import type { CueLook } from "../data/shop";

export interface CastHit {
  type: "band" | "dop" | "ball";
  n: [number, number];
  b?: Ball;
}
export type Cast = (x: number, y: number, dx: number, dy: number, self: number) => { t: number; hit: CastHit | null };
export interface AimHelp {
  aim: number;
  ghost: number;
  obj: number;
  bounce: number;
}

/** the same colours as the bands on the power meter (styles/components/_power.scss) */
const BAND_COL = { touch: 0x8fd3ff, soft: 0xffffff, medium: 0xffd27a, hard: 0xff6a4a } as const;
export const AIM = {} as {
  cue: THREE.Group;
  shaft: THREE.MeshLambertMaterial;
  butt: THREE.MeshPhongMaterial;
  ring: THREE.MeshPhongMaterial;
  tip: THREE.Mesh;
  line: THREE.Line<THREE.BufferGeometry, THREE.LineDashedMaterial>;
  obj: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  bounce: THREE.Line<THREE.BufferGeometry, THREE.LineDashedMaterial>;
  ghost: THREE.Mesh;
};

const line2 = () => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);

export function buildAim(scene: THREE.Scene): void {
  const cue = (AIM.cue = new THREE.Group());
  AIM.shaft = lam(0xe0c48f);
  AIM.butt = phong(0x1b100a, { shininess: 60 });
  AIM.ring = phong(0xd4a752, { specular: 0xfff0c0, shininess: 50 });
  add(cue, new THREE.CylinderGeometry(0.0062, 0.0125, 0.9, 8), AIM.shaft, 0, -0.45, 0);
  add(cue, new THREE.CylinderGeometry(0.0125, 0.0155, 0.5, 8), AIM.butt, 0, -1.15, 0);
  add(cue, new THREE.CylinderGeometry(0.0128, 0.0128, 0.02, 8), AIM.ring, 0, -0.9, 0);
  add(cue, new THREE.CylinderGeometry(0.0063, 0.0063, 0.012, 8), lam(0x3b73c4), 0, 0.006, 0);
  cue.visible = false;
  scene.add(cue);
  AIM.tip = add(scene, new THREE.SphereGeometry(0.0055, 6, 4), basic(0x3b8bff));
  AIM.line = new THREE.Line(
    line2(),
    new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.015, gapSize: 0.01, transparent: true, opacity: 0.85 }),
  );
  AIM.obj = new THREE.Line(line2(), new THREE.LineBasicMaterial({ color: 0xffffff }));
  AIM.bounce = new THREE.Line(
    line2(),
    new THREE.LineDashedMaterial({ color: 0xffc860, dashSize: 0.012, gapSize: 0.012, transparent: true, opacity: 0.8 }),
  );
  AIM.ghost = add(
    scene,
    new THREE.RingGeometry(R * M * 0.84, R * M, 24),
    basic(0xffffff, { transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
  );
  AIM.ghost.rotation.x = -Math.PI / 2;
  scene.add(AIM.line, AIM.obj, AIM.bounce);
}

/** the cue from the shop */
export function setCueLook(c: CueLook): void {
  AIM.shaft.color.set(c.shaft);
  AIM.shaft.emissive.set(c.glow ? new THREE.Color(c.glow).multiplyScalar(0.35) : 0x000000);
  AIM.butt.color.set(c.butt);
  AIM.ring.color.set(c.ring);
}

export function updateAim(
  b: Ball | null,
  s: Shot | null,
  cast: Cast,
  h: AimHelp = { aim: Infinity, ghost: 1, obj: 1, bounce: 0 },
): void {
  AIM.cue.visible =
    AIM.line.visible =
    AIM.obj.visible =
    AIM.ghost.visible =
    AIM.tip.visible =
    AIM.bounce.visible =
      false;
  if (!b || !s) return;
  const r = cast(b.x, b.y, s.dx, s.dy, b.id),
    len = Math.min(r.t, h.aim),
    full = len >= r.t,
    cx = b.x + s.dx * r.t,
    cy = b.y + s.dy * r.t;
  const line = (l: THREE.Line, a: THREE.Vector3, z: THREE.Vector3) => {
    l.geometry.setFromPoints([a, z]);
    l.computeLineDistances();
    l.visible = true;
  };
  const band = bandOf(s.p).id;
  AIM.line.material.color.set(BAND_COL[band]);
  if (len > 0) line(AIM.line, V(b.x, b.y, 0.003), V(b.x + s.dx * len, b.y + s.dy * len, 0.003));
  if (full && h.ghost) {
    AIM.ghost.position.copy(V(cx, cy, 0.003));
    AIM.ghost.visible = true;
  }
  const hit = r.hit;
  if (full && h.obj && hit?.type === "ball" && hit.b) {
    const q = hit.b,
      nx = q.x - cx,
      ny = q.y - cy,
      nl = Math.hypot(nx, ny) || 1;
    AIM.obj.material.color.set(q.c === b.c ? 0xf2a25c : 0xffffff);
    line(AIM.obj, V(q.x, q.y, 0.003), V(q.x + (nx / nl) * 160, q.y + (ny / nl) * 160, 0.003));
  }
  if (full && h.bounce && hit) {
    // a ball glances off along the tangent, a cushion or post reflects it
    const [nx, ny] = hit.n,
      dn = s.dx * nx + s.dy * ny,
      f = hit.type === "ball" ? 1 : 2;
    let ex = s.dx - f * dn * nx,
      ey = s.dy - f * dn * ny;
    const el = Math.hypot(ex, ey);
    if (el > 0.05) {
      ex /= el;
      ey /= el;
      line(AIM.bounce, V(cx, cy, 0.004), V(cx + ex * 380, cy + ey * 380, 0.004));
    }
  }
  // where the tip meets the ball: right of centre is (-dy, dx) on this table, up is up
  const sx = (s.sx || 0) * 0.5,
    sy = (s.sy || 0) * 0.5,
    back = Math.sqrt(Math.max(0, 1 - sx * sx - sy * sy));
  const hx = b.x + (-s.dx * back - s.dy * sx) * R,
    hy = b.y + (-s.dy * back + s.dx * sx) * R,
    hz = R + sy * R;
  AIM.tip.position.set(hx * M, hz * M, hy * M);
  AIM.tip.visible = true;
  const pull = pullOf(s.p);
  AIM.cue.position.set((hx - s.dx * pull) * M, (hz + 0.2 * pull) * M, (hy - s.dy * pull) * M);
  AIM.cue.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(s.dx, -0.2, s.dy).normalize());
  AIM.cue.visible = true;
}
/** how far the cue sits back from the ball (mm) */
export const pullOf = (p: number): number => 12 + p * 110;
