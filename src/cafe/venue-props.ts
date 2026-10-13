// Props that belong to one venue, built when first needed: the championship stands and banners and a chandelier here,
// the legends' halls in legend-props.ts, darts, a TV, neon and the rest in more-props.ts.
import { THREE, FLOOR, add, lam, basic, phong, facet, canvasTex } from "../render/three";
import { S } from "../render/renderer";
import { figure } from "../people/figure";
import { WZ, H, rnd } from "./state";
import type { Prop } from "../data/venues";
import { darts, tv, neon, piano, trophies, plants, fireplace, lanterns, animateMoreProps } from "./more-props";
import { seaweed, portholes, columns, statues, shields, torches, animateLegendProps } from "./legend-props";

const sway: THREE.Object3D[] = [];
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

/** banners sway, the crowd fidgets, and the legends' halls and the other props move */
export function animateVenue(t: number): void {
  for (const s of sway) if (s.parent?.visible) s.rotation.z = Math.sin(t * 0.9 + s.userData.ph) * 0.12;
  for (const p of crowd) if (p.parent?.visible) p.position.y += Math.sin(t * 2 + (p.userData.ph || 0)) * 0.0004;
  animateMoreProps(t);
  animateLegendProps(t);
}
