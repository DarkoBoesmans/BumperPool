// A person in the style of a PS2 open-world game (think San Andreas): real proportions, smooth-shaded tapered limbs,
// a lathed torso shaped by build and frame, mitten hands with a thumb, shoes with a toe, a jawed head with a nose,
// ears and a painted face, then hair, hat and accessories. Standing or sitting. About 1.7 m tall.
import { THREE, add, lam } from "../render/three";
import { blobMat } from "../render/balls";
import { faceTex, clothTex, shade } from "./face";
import { hairMesh, hatMesh, extrasMesh } from "./hair";
import { cigar, glass, type Cigar, type Glass } from "./things";
import type { Frame, Look } from "../types";

export interface Arm {
  sh: THREE.Group;
  el: THREE.Group;
  hand: THREE.Group;
}
export type Kind = "cigar" | "glass" | "chalk" | "knock";
export interface Figure {
  g: THREE.Group;
  L: Look;
  head: THREE.Group;
  torso: THREE.Group;
  hips: THREE.Group[];
  r: Arm;
  l: Arm;
  anim: { kind: Kind; t0: number; puffed?: boolean } | null;
  phase: number;
  sit: boolean;
  cigar?: Cigar;
  glass?: Glass;
  chalk?: THREE.Mesh;
  idleKind?: Kind;
  keep?: boolean;
  hold(kind: Kind | null): void;
}

export function shadowBlob(parent: THREE.Object3D, x: number, z: number, size: number): THREE.Mesh {
  const m = add(parent, new THREE.PlaneGeometry(size, size), blobMat, x, 0.003, z);
  m.rotation.x = -Math.PI / 2;
  return m;
}

/** a tapered limb hanging down from its joint */
function limb(parent: THREE.Object3D, top: number, bottom: number, len: number, m: THREE.Material, y0 = 0): THREE.Mesh {
  return add(parent, new THREE.CylinderGeometry(top, bottom, len, 8), m, 0, y0 - len / 2, 0);
}

/** torso outline from the hips (0) to the base of the neck (0.62): [half width, height] */
const TORSO: Record<Frame, [number, number][]> = {
  straight: [
    [0.165, 0],
    [0.16, 0.09],
    [0.152, 0.22],
    [0.172, 0.38],
    [0.195, 0.5],
    [0.18, 0.57],
    [0.085, 0.63],
  ],
  broad: [
    [0.165, 0],
    [0.162, 0.09],
    [0.158, 0.22],
    [0.198, 0.38],
    [0.222, 0.5],
    [0.205, 0.57],
    [0.09, 0.63],
  ],
  curvy: [
    [0.185, 0],
    [0.175, 0.08],
    [0.135, 0.22],
    [0.162, 0.36],
    [0.172, 0.47],
    [0.162, 0.56],
    [0.08, 0.63],
  ],
};

/** a head from chin to crown, narrower at the jaw: the face texture wraps it like a sphere (face at u = 0.25) */
function headGeo(): THREE.BufferGeometry {
  const pts: THREE.Vector2[] = [],
    n = 12;
  for (let j = 0; j <= n; j++) {
    const th = Math.PI - (j / n) * Math.PI,
      y = Math.cos(th),
      jaw = y < -0.2 ? 0.8 + 0.2 * Math.cos(((y + 0.2) / 0.8) * (Math.PI / 2)) : 1;
    pts.push(new THREE.Vector2(Math.max(0.001, Math.sin(th) * 0.104 * jaw), y * 0.118));
  }
  return new THREE.LatheGeometry(pts, 14, -Math.PI / 2);
}

function hand(parent: THREE.Object3D, skin: THREE.Material, s: number): void {
  add(parent, new THREE.BoxGeometry(0.07, 0.08, 0.032), skin, 0, -0.045, 0);
  add(parent, new THREE.BoxGeometry(0.066, 0.055, 0.028), skin, 0, -0.105, 0.006).rotation.x = 0.35; // fingers
  const t = add(parent, new THREE.BoxGeometry(0.02, 0.05, 0.022), skin, s * 0.038, -0.05, 0.016); // thumb
  t.rotation.z = s * 0.45;
}

function shoe(parent: THREE.Object3D, m: THREE.Material, y: number): void {
  add(parent, new THREE.BoxGeometry(0.1, 0.07, 0.2), m, 0, y, 0.03);
  add(parent, new THREE.SphereGeometry(0.052, 8, 5), m, 0, y - 0.006, 0.13).scale.set(0.95, 0.62, 1);
  add(parent, new THREE.BoxGeometry(0.105, 0.016, 0.27), lam(0x2a2420), 0, y - 0.038, 0.06); // sole
}

export function figure(L: Look, pose: "stand" | "sit" = "stand"): Figure {
  const g = new THREE.Group(),
    b = L.build || 1,
    frame = L.frame || "straight",
    shirt = lam(0xffffff, { map: clothTex(L.shirt, L) }),
    pants = lam(0xffffff, { map: clothTex(L.pants) }),
    skin = lam(L.skin),
    shoes = lam(L.bottom === "skirt" ? shade(L.pants, 0.6) : 0x1c1612);
  const sit = pose === "sit",
    skirt = L.bottom === "skirt",
    legs = skirt ? skin : pants,
    hipY = sit ? 0.46 : 0.86,
    hipW = frame === "curvy" ? 1.08 : 1,
    belly = b > 1.1 ? (b - 1) * 0.35 : 0,
    hips: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(s * 0.092 * b * hipW, hipY, 0);
    g.add(hip);
    hips.push(hip);
    limb(hip, 0.082 * b, 0.058 * b, 0.44, legs);
    const knee = new THREE.Group();
    knee.position.y = -0.44;
    hip.add(knee);
    add(knee, new THREE.SphereGeometry(0.058 * b, 8, 5), legs);
    limb(knee, 0.057 * b, 0.042 * b, 0.36, legs);
    shoe(knee, shoes, -0.374); // the sole lands on the floor: 0.44 + 0.374 + 0.046 = hip height
    if (sit) {
      hip.rotation.x = -Math.PI / 2;
      knee.rotation.x = Math.PI / 2;
    }
  }
  const torso = new THREE.Group();
  torso.position.y = hipY;
  g.add(torso);
  // pelvis and belt; a skirt instead of trousers
  add(torso, new THREE.CylinderGeometry(0.168 * b * hipW, 0.15 * b * hipW, 0.12, 10), legs, 0, -0.03, 0).scale.z = 0.66;
  if (skirt) {
    const sk = add(
      torso,
      new THREE.CylinderGeometry(0.17 * b, 0.27 * b, sit ? 0.16 : 0.42, 12, 1, true),
      lam(0xffffff, { map: clothTex(L.pants), side: THREE.DoubleSide }),
      0,
      sit ? -0.02 : -0.17,
      0,
    );
    sk.scale.z = 0.8;
  } else
    add(torso, new THREE.CylinderGeometry(0.162 * b, 0.162 * b, 0.03, 10), lam(0x1a1210), 0, 0.03, 0).scale.z = 0.68;
  const pts = TORSO[frame].map(([w, y], i) => new THREE.Vector2(w * b * (i > 0 && i < 4 ? 1 + belly : 1), y));
  add(torso, new THREE.LatheGeometry(pts, 12), shirt, 0, 0, 0).scale.z = 0.64 + belly * 0.4;
  if (frame === "curvy")
    for (const s of [-1, 1])
      add(torso, new THREE.SphereGeometry(0.056 * b, 8, 6), shirt, s * 0.058 * b, 0.47, 0.062 * b).scale.set(
        1,
        0.82,
        0.7,
      );
  const collar = add(torso, new THREE.TorusGeometry(0.062, 0.014, 5, 12), lam(L.trim), 0, 0.615, 0.008); // shirt collar
  collar.rotation.x = Math.PI / 2 - 0.25;
  add(torso, new THREE.CylinderGeometry(0.045, 0.052, 0.12, 8), skin, 0, 0.66, 0.005); // neck
  const head = new THREE.Group();
  head.position.y = 0.77;
  torso.add(head);
  add(head, headGeo(), lam(0xffffff, { map: faceTex(L) })).scale.z = 0.94;
  add(head, new THREE.BoxGeometry(0.017, 0.032, 0.02), skin, 0, -0.006, 0.096); // nose
  for (const s of [-1, 1])
    add(head, new THREE.BoxGeometry(0.014, 0.042, 0.026), lam(shade(L.skin, 0.88)), s * 0.1, -0.008, -0.004);
  hairMesh(L, head);
  hatMesh(L, head);
  extrasMesh(L, head, torso, b);
  const shoulder = (frame === "broad" ? 0.255 : frame === "curvy" ? 0.215 : 0.235) * b;
  const arm = (s: number): Arm => {
    const sh = new THREE.Group();
    sh.position.set(s * shoulder, 0.555, 0);
    torso.add(sh);
    add(sh, new THREE.SphereGeometry(0.056 * b, 8, 6), shirt, 0, -0.01, 0).scale.set(0.95, 0.85, 0.9); // deltoid
    limb(sh, 0.054 * b, 0.044 * b, 0.3, shirt);
    const el = new THREE.Group();
    el.position.y = -0.3;
    sh.add(el);
    limb(el, 0.044 * b, 0.036 * b, 0.26, shirt);
    add(el, new THREE.CylinderGeometry(0.038 * b, 0.034, 0.03, 8), skin, 0, -0.27, 0); // wrist
    const h = new THREE.Group();
    h.position.y = -0.3;
    el.add(h);
    hand(h, skin, -s);
    sh.rotation.z = s * 0.08;
    return { sh, el, hand: h };
  };
  const A: Figure = {
    g,
    L,
    head,
    torso,
    hips,
    r: arm(-1),
    l: arm(1),
    anim: null,
    phase: Math.random() * 6,
    sit,
    hold(kind) {
      if (A.cigar) A.cigar.visible = kind === "cigar";
      if (A.glass) A.glass.visible = kind === "glass";
      if (A.chalk) A.chalk.visible = kind === "chalk";
      if (kind === "chalk" && !A.chalk)
        A.chalk = add(A.r.hand, new THREE.BoxGeometry(0.022, 0.022, 0.022), lam(0x3b73c4), 0, -0.08, 0.035);
      if (kind === "cigar" && !A.cigar) {
        A.cigar = cigar();
        A.cigar.position.set(0, -0.08, 0.04);
        A.cigar.rotation.x = Math.PI / 2;
        A.r.hand.add(A.cigar);
      }
      if (kind === "glass" && !A.glass) {
        A.glass = glass();
        A.glass.position.set(0, -0.07, 0.045);
        A.r.hand.add(A.glass);
      }
    },
  };
  if (sit) {
    A.r.sh.rotation.x = A.l.sh.rotation.x = -0.9;
    A.r.el.rotation.x = A.l.el.rotation.x = -0.6;
  }
  shadowBlob(g, 0, 0.02, 0.7);
  return A;
}
