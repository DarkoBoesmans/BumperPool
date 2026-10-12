// Props that belong to one venue: the championship stands and banners, a chandelier, the shipwreck's seaweed and
// portholes, the stone garden's columns and statues, the mead hall's shields, and torches. Built when first needed.
import { THREE, FLOOR, add, lam, basic, phong, facet, canvasTex } from "../render/three";
import { S } from "../render/renderer";
import { figure } from "../people/figure";
import { WX, WZ, H, rnd } from "./state";
import type { Prop } from "../data/venues";
import type { Look } from "../types";
import { darts, tv, neon, piano, trophies, plants, fireplace, lanterns, animateMoreProps } from "./more-props";

const sway: THREE.Object3D[] = [];
const flames: { m: THREE.Mesh; l: THREE.PointLight }[] = [];
const crowd: THREE.Object3D[] = [];

function stands(g: THREE.Group): void {
  const step = lam(0x2a2c34),
    seat = lam(0x3a3c48);
  const shirts = [0xa3261d, 0x2f6fd6, 0xe6dcc4, 0x2c7a4a, 0xc8902a, 0x5a3a8e, 0x1a1a1e, 0xd8d8d8];
  for (const s of [-1, 1]) {
    for (let t = 0; t < 3; t++) {
      // three tiers, the highest against the wall
      const depth = 0.45,
        zz = s * (WZ - 0.25 - (2 - t) * depth - depth / 2);
      add(g, new THREE.BoxGeometry(7.6, 0.3 + t * 0.32, depth), step, 0, FLOOR + (0.3 + t * 0.32) / 2, zz);
      add(g, new THREE.BoxGeometry(7.6, 0.04, depth * 0.5), seat, 0, FLOOR + 0.32 + t * 0.32, zz);
      for (let x = -3.5; x <= 3.5; x += rnd(0.42, 0.62)) {
        if (Math.random() < 0.18) continue;
        const p = new THREE.Group();
        p.position.set(x, FLOOR + 0.34 + t * 0.32, zz);
        p.rotation.y = s > 0 ? Math.PI : 0;
        add(
          p,
          facet(new THREE.CylinderGeometry(0.15, 0.13, 0.42, 5)),
          lam(shirts[(Math.random() * shirts.length) | 0]),
          0,
          0.22,
          0,
        ).scale.z = 0.6;
        add(
          p,
          facet(new THREE.SphereGeometry(0.09, 6, 4)),
          lam(["#e9b896", "#c98d6a", "#9a6444", "#f3d2b8"][(Math.random() * 4) | 0]),
          0,
          0.52,
          0,
        );
        p.userData.ph = Math.random() * 6;
        crowd.push(p);
        g.add(p);
      }
    }
  }
  // a TV camera on a tripod
  const cam = new THREE.Group();
  cam.position.set(3.4, FLOOR, 1.9);
  cam.rotation.y = -2.4;
  g.add(cam);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    add(
      cam,
      new THREE.CylinderGeometry(0.012, 0.012, 1.3, 4),
      lam(0x1a1a1a),
      Math.sin(a) * 0.2,
      0.62,
      Math.cos(a) * 0.2,
    ).rotation.set(Math.cos(a) * 0.16, 0, -Math.sin(a) * 0.16);
  }
  add(cam, new THREE.BoxGeometry(0.22, 0.2, 0.42), lam(0x2a2a2e), 0, 1.35, 0);
  add(
    cam,
    new THREE.CylinderGeometry(0.07, 0.08, 0.16, 8),
    phong(0x0a0a0a, { shininess: 90 }),
    0,
    1.35,
    0.27,
  ).rotation.x = Math.PI / 2;
  add(cam, new THREE.SphereGeometry(0.015, 4, 3), basic(0xff2020), 0.08, 1.47, 0.1);
  // the referee in white gloves, beside the table
  const ref = figure(
    {
      skin: "#e8b494",
      shirt: "#141418",
      trim: "#f4f0e8",
      pants: "#141418",
      hair: "#3a2a1e",
      hairStyle: "side",
      hat: "none",
      bowtie: true,
      build: 1,
      pattern: "tux",
    },
    "stand",
  );
  ref.g.position.set(0.3, FLOOR, -1.85);
  g.add(ref.g);
  crowd.push(ref.g);
}

const bannerMats: THREE.MeshBasicMaterial[] = [];
function banners(g: THREE.Group): void {
  for (let i = 0; i < 3; i++) {
    const m = basic(0xffffff, { side: THREE.DoubleSide });
    bannerMats.push(m);
    const b = add(g, new THREE.PlaneGeometry(0.7, 1.75), m, -2.6 + i * 2.6, FLOOR + H - 1.0, -WZ + 0.06);
    b.userData.ph = i;
    sway.push(b);
  }
}
/** the words and colour of the venue's event on the hanging banners */
export function paintBanners(b: { words: string[]; color: string }): void {
  bannerMats.forEach((m, i) => {
    m.map?.dispose();
    m.map = canvasTex(64, 160, (c, cw, ch) => {
      c.fillStyle = i === 1 ? b.color : "#141418";
      c.fillRect(0, 0, cw, ch);
      c.fillStyle = i === 1 ? "#141418" : b.color;
      c.fillRect(0, ch - 20, cw, 6);
      c.font = "28px Anton, Impact, sans-serif";
      c.textAlign = "center";
      c.save();
      c.translate(cw / 2, ch / 2);
      c.rotate(-Math.PI / 2);
      c.fillText(b.words[i], 0, 10);
      c.restore();
    });
    m.needsUpdate = true;
  });
}

function chandelier(g: THREE.Group): void {
  const crystal = basic(0xfff4e0, { transparent: true, opacity: 0.85 });
  for (const x of [-2.6, 2.6]) {
    const c = new THREE.Group();
    c.position.set(x, FLOOR + 2.55, 0.6);
    g.add(c);
    add(c, new THREE.CylinderGeometry(0.005, 0.005, 0.6, 4), lam(0xe8c060), 0, 0.3, 0);
    for (const [r, y, n] of [
      [0.32, 0, 10],
      [0.2, -0.16, 7],
    ] as const)
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        add(c, new THREE.OctahedronGeometry(0.03), crystal, Math.cos(a) * r, y, Math.sin(a) * r);
      }
    add(c, new THREE.TorusGeometry(0.32, 0.008, 3, 16), lam(0xe8c060), 0, 0.02, 0).rotation.x = Math.PI / 2;
    const l = new THREE.PointLight(0xffd8f0, 0.8, 4, 1.5);
    l.position.y = -0.1;
    c.add(l);
    S.flares.push({ pos: new THREE.Vector3(x, FLOOR + 2.5, 0.6), k: 0.5, vis: () => g.visible });
  }
}

function seaweed(g: THREE.Group): void {
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
    sway.push(w);
  }
}

function portholes(g: THREE.Group): void {
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

function columns(g: THREE.Group): void {
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

function statues(g: THREE.Group): void {
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

function shields(g: THREE.Group): void {
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

function torches(g: THREE.Group): void {
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

const BUILD: Partial<Record<Prop, (g: THREE.Group) => void>> = {
  stands,
  banners,
  chandelier,
  seaweed,
  portholes,
  columns,
  statues,
  shields,
  torches,
  darts,
  tv,
  neon,
  piano,
  trophies,
  plants,
  fireplace,
  lanterns,
};

export function buildProp(kind: Prop, scene: THREE.Scene): THREE.Group | null {
  const b = BUILD[kind];
  if (!b) return null;
  const g = new THREE.Group();
  scene.add(g);
  b(g);
  return g;
}

/** seaweed and banners sway, torches flicker, the crowd fidgets */
export function animateVenue(t: number): void {
  for (const s of sway) if (s.parent?.visible) s.rotation.z = Math.sin(t * 0.9 + s.userData.ph) * 0.12;
  for (const f of flames)
    if (f.m.parent?.parent?.visible) {
      const k = 0.85 + Math.sin(t * 13 + f.m.id) * 0.08 + Math.random() * 0.1;
      f.m.scale.set(1, k, 1);
      f.l.intensity = 0.7 * k;
    }
  for (const p of crowd) if (p.parent?.visible) p.position.y += Math.sin(t * 2 + (p.userData.ph || 0)) * 0.0004;
  animateMoreProps(t);
}
