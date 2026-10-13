// The three legends' halls: the shipwreck's seaweed and portholes, the stone garden's columns and statues, the storm
// hall's shields and torches. venue-props.ts builds them with the other venue props.
import { THREE, FLOOR, add, lam, basic, phong, facet } from "../render/three";
import { figure } from "../people/figure";
import { WX, WZ, H, rnd } from "./state";
import type { Look } from "../types";

const weeds: THREE.Object3D[] = [];
const flames: { m: THREE.Mesh; l: THREE.PointLight }[] = [];

export function seaweed(g: THREE.Group): void {
  const greens = [0x2a8a4a, 0x3aa05a, 0x1e6a3a, 0x4ab070];
  for (let i = 0; i < 26; i++) {
    const wall = i % 4,
      t = rnd(-0.9, 0.9);
    const x = wall < 2 ? t * (WX - 0.4) : (wall === 2 ? -1 : 1) * (WX - 0.3),
      z = wall < 2 ? (wall === 0 ? -1 : 1) * (WZ - 0.3) : t * (WZ - 0.4);
    const h = rnd(0.8, 1.9),
      w = add(
        g,
        facet(new THREE.ConeGeometry(0.07, h, 4)),
        lam(greens[i % 4], { emissive: 0x0a2a14 }),
        x,
        FLOOR + h / 2,
        z,
      );
    w.userData.ph = Math.random() * 6;
    weeds.push(w);
  }
}

export function portholes(g: THREE.Group): void {
  for (const x of [-2.4, 2.4])
    for (const z of [-WZ + 0.03, WZ - 0.03]) {
      const ry = z > 0 ? Math.PI : 0;
      add(
        g,
        new THREE.TorusGeometry(0.28, 0.05, 6, 16),
        phong(0xb8862a, { shininess: 60, specular: 0xffe0a0 }),
        x,
        FLOOR + 1.85,
        z,
      ).rotation.y = ry;
      add(
        g,
        new THREE.CircleGeometry(0.27, 16),
        basic(0x2ad8ff, { transparent: true, opacity: 0.8 }),
        x,
        FLOOR + 1.85,
        z + (z > 0 ? -0.01 : 0.01),
      ).rotation.y = ry;
    }
}

export function columns(g: THREE.Group): void {
  const marble = lam(0xe8e4dc),
    spots = [
      [-(WX - 0.45), -2.3],
      [-(WX - 0.45), 2.3],
      [WX - 0.45, -2.3],
      [WX - 0.45, 2.3],
      [-3.2, -(WZ - 0.45)],
      [3.2, -(WZ - 0.45)],
      [-3.2, WZ - 0.45],
      [3.2, WZ - 0.45],
    ];
  for (const [x, z] of spots) {
    add(g, facet(new THREE.CylinderGeometry(0.2, 0.22, H - 0.3, 8)), marble, x, FLOOR + (H - 0.3) / 2, z);
    add(g, new THREE.BoxGeometry(0.56, 0.12, 0.56), marble, x, FLOOR + 0.06, z);
    add(g, new THREE.BoxGeometry(0.56, 0.14, 0.56), marble, x, FLOOR + H - 0.25, z);
  }
}

export function statues(g: THREE.Group): void {
  const stone = (shade: string): Look => ({
    skin: shade,
    shirt: shade,
    trim: shade,
    pants: shade,
    hair: shade,
    hairStyle: "short",
    hat: "none",
    build: 1 + Math.random() * 0.2,
  });
  for (const [x, z, ry, pose] of [
    [-3.6, 1.5, 1.2, "stand"],
    [3.7, -1.4, -1.9, "stand"],
    [-2.3, -2.95, 0.3, "sit"],
    [2.6, 2.95, 2.9, "stand"],
  ] as const) {
    const f = figure(stone(["#8a8a84", "#9a9a92", "#7a7a74"][(Math.random() * 3) | 0]), pose);
    f.g.position.set(x, FLOOR, z);
    f.g.rotation.y = ry;
    f.r.sh.rotation.x = -1.2;
    f.l.sh.rotation.x = -0.7;
    f.g.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshLambertMaterial | undefined;
      if (m && m.map) m.map = null;
    });
    g.add(f.g);
  }
}

export function shields(g: THREE.Group): void {
  const cols = [
    [0xc23a2a, 0xe8d8b8],
    [0x2a4a8a, 0xe8c060],
    [0x1a1a1a, 0xc8c8c8],
    [0x2a6a3a, 0xe8d8b8],
  ];
  let i = 0;
  const shield = (x: number, y: number, z: number, ry: number) => {
    const [a, b] = cols[i++ % cols.length],
      s = new THREE.Group();
    s.position.set(x, y, z);
    s.rotation.y = ry;
    g.add(s);
    add(s, new THREE.CylinderGeometry(0.3, 0.3, 0.04, 12), lam(a), 0, 0, 0).rotation.x = Math.PI / 2;
    add(s, new THREE.BoxGeometry(0.6, 0.12, 0.05), lam(b), 0, 0, 0.01);
    add(s, new THREE.SphereGeometry(0.06, 6, 4), phong(0xc8c8c8, { shininess: 60 }), 0, 0, 0.03);
  };
  for (const z of [-2.1, 0, 2.1]) {
    shield(WX - 0.04, 1.55, z, -Math.PI / 2);
    shield(-WX + 0.04, 1.55, z, Math.PI / 2);
  }
  for (const x of [-3.6, -1.2, 1.2, 3.6]) shield(x, 1.75, WZ - 0.04, Math.PI);
}

export function torches(g: THREE.Group): void {
  for (const [x, z, ry] of [
    [WX - 0.06, -2.1, -Math.PI / 2],
    [WX - 0.06, 2.1, -Math.PI / 2],
    [-WX + 0.06, -2.1, Math.PI / 2],
    [-WX + 0.06, 2.1, Math.PI / 2],
  ] as const) {
    const t = new THREE.Group();
    t.position.set(x, FLOOR + 1.55, z);
    t.rotation.y = ry;
    g.add(t);
    add(t, new THREE.CylinderGeometry(0.025, 0.018, 0.4, 5), lam(0x3a2414), 0, 0, 0.12).rotation.x = 0.5;
    const m = add(t, facet(new THREE.ConeGeometry(0.06, 0.18, 5)), basic(0xffa040), 0, 0.24, 0.22);
    const l = new THREE.PointLight(0xff9a40, 0.9, 3.6, 1.6);
    l.position.set(0, 0.3, 0.3);
    t.add(l);
    flames.push({ m, l });
  }
}

/** seaweed sways, torches flicker */
export function animateLegendProps(t: number): void {
  for (const s of weeds) if (s.parent?.visible) s.rotation.z = Math.sin(t * 0.9 + s.userData.ph) * 0.12;
  for (const f of flames)
    if (f.m.parent?.parent?.visible) {
      const k = 0.85 + Math.sin(t * 13 + f.m.id) * 0.08 + Math.random() * 0.1;
      f.m.scale.set(1, k, 1);
      f.l.intensity = 0.7 * k;
    }
}
