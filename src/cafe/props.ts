// Small things on tables and rails: ashtrays with a smouldering cigar, bottles, and each player's cigar and whisky
// on their end of the rail.
import { THREE, add, lam, basic, facet } from "../render/three";
import { COLORS, home } from "../core/table";
import { glass, setLiquid } from "../people/things";
import { C, type Ashtray } from "./state";

export function ashtray(parent: THREE.Object3D, x: number, y: number, z: number, lit: boolean): Ashtray {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  add(g, facet(new THREE.CylinderGeometry(0.05, 0.045, 0.02, 8)), lam(0x5a2a10, { emissive: 0x1a0802 }), 0, 0.01, 0);
  const cig = new THREE.Group();
  cig.position.set(0.03, 0.026, 0);
  cig.rotation.z = -0.12;
  g.add(cig);
  add(cig, new THREE.CylinderGeometry(0.008, 0.008, 0.11, 6), lam(0x6b4423), 0.03, 0, 0).rotation.z = Math.PI / 2;
  add(cig, new THREE.CylinderGeometry(0.0085, 0.0085, 0.012, 6), lam(0xb8b0a0), 0.09, 0, 0).rotation.z = Math.PI / 2;
  const tip = add(cig, new THREE.CylinderGeometry(0.0082, 0.0082, 0.004, 6), basic(0xff6a1a), 0.097, 0, 0);
  tip.rotation.z = Math.PI / 2;
  tip.visible = lit;
  const t: Ashtray = { g, tip, lit, litUntil: lit ? Infinity : 0, next: 0 };
  C.ashtrays.push(t);
  return t;
}

export function bottle(g: THREE.Object3D, x: number, y: number, z: number, col: number, kind: string): void {
  const m = lam(col, {
    emissive: new THREE.Color(col).multiplyScalar(0.25),
    transparent: kind === "clear",
    opacity: 0.6,
  });
  const tall = kind === "tall" ? 0.34 : kind === "squat" ? 0.2 : 0.27,
    r = kind === "squat" ? 0.05 : 0.038;
  add(g, facet(new THREE.CylinderGeometry(r, r, tall * 0.68, 6)), m, x, y + tall * 0.34, z);
  add(g, facet(new THREE.CylinderGeometry(0.013, r * 0.8, tall * 0.14, 6)), m, x, y + tall * 0.75, z);
  add(g, new THREE.CylinderGeometry(0.012, 0.012, tall * 0.18, 5), m, x, y + tall * 0.9, z);
  add(
    g,
    new THREE.BoxGeometry(r * 1.5, tall * 0.18, 0.004),
    lam(["#efe2c0", "#d8c38a", "#f4f0e6", "#c9302c"][(Math.random() * 4) | 0]),
    x,
    y + tall * 0.33,
    z + r * 0.98,
  );
}

/** each player's ashtray and glass on their end of the rail */
export function buildRailProps(scene: THREE.Scene): void {
  for (const c of COLORS) {
    const h = home(c),
      side = h < 0 ? 1 : -1;
    const tray = ashtray(scene, h * 0.99, 0.058, -side * 0.47, false);
    tray.g.rotation.y = h < 0 ? Math.PI : 0;
    const g = glass();
    g.position.set(h * 0.99, 0.058, side * 0.47);
    scene.add(g);
    C.props[c] = { tray, glass: g, level: 1, refillAt: 0 };
  }
}
export const refill = (c: (typeof COLORS)[number], level: number): void => {
  const P = C.props[c];
  P.level = level;
  setLiquid(P.glass, level);
};
