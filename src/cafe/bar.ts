// The bar along the back wall: counter, a beer font of three brass taps, a till, a framed mirror and shelves of
// bottles (bottles.ts), six stools and Marcel behind it.
import { THREE, FLOOR, add, lam, basic, phong, facet, canvasTex } from "../render/three";
import { TBL } from "../render/table";
import { figure, shadowBlob } from "../people/figure";
import { ashtray } from "./props";
import { bottles } from "./bottles";
import { C, WZ } from "./state";

export function buildBar(scene: THREE.Scene): THREE.Group {
  const g = new THREE.Group();
  scene.add(g);
  const front = canvasTex(
    64,
    64,
    (c, w, h) => {
      c.fillStyle = "#52200f";
      c.fillRect(0, 0, w, h);
      c.strokeStyle = "rgba(0,0,0,.55)";
      c.lineWidth = 3;
      c.strokeRect(6, 8, w - 12, h - 16);
      c.strokeStyle = "rgba(255,190,130,.14)";
      c.lineWidth = 1;
      c.strokeRect(9, 11, w - 18, h - 22);
    },
    { repeat: [7, 1], pixel: true },
  );
  const zf = -2.75,
    len = 5.4,
    brass = TBL.brass;
  add(g, new THREE.BoxGeometry(len, 1.04, 0.5), lam(0xffffff, { map: front }), 0, FLOOR + 0.52, zf - 0.25);
  add(
    g,
    new THREE.BoxGeometry(len + 0.1, 0.05, 0.62),
    phong(0x2a0f07, { specular: 0x553322, shininess: 30 }),
    0,
    FLOOR + 1.065,
    zf - 0.27,
  );
  // the top's rounded front edge, and the brass rails for feet and elbows
  add(
    g,
    new THREE.CylinderGeometry(0.03, 0.03, len + 0.1, 8),
    phong(0x2a0f07, { specular: 0x553322, shininess: 30 }),
    0,
    FLOOR + 1.06,
    zf + 0.04,
  ).rotation.z = Math.PI / 2;
  add(g, new THREE.CylinderGeometry(0.018, 0.018, len, 6), brass, 0, FLOOR + 0.2, zf + 0.12).rotation.z = Math.PI / 2;
  add(g, new THREE.CylinderGeometry(0.012, 0.012, len, 6), brass, 0, FLOOR + 1.0, zf + 0.04).rotation.z = Math.PI / 2;
  beerFont(g, -0.38, FLOOR + 1.09, zf - 0.33);
  till(g, 2.25, FLOOR + 1.09, zf - 0.3);
  const counter = bottles();
  counter.add("wine", 1.6, FLOOR + 1.09, zf - 0.3);
  counter.add("jug", 1.45, FLOOR + 1.09, zf - 0.34);
  const tumbler = lam(0xe8f0f0, { transparent: true, opacity: 0.35 });
  for (const x of [1.75, 1.88, -1.2]) {
    add(g, facet(new THREE.CylinderGeometry(0.035, 0.03, 0.08, 7)), tumbler, x, FLOOR + 1.13, zf - 0.2);
    add(
      g,
      new THREE.CylinderGeometry(0.031, 0.028, 0.035, 7),
      lam(0xc8761e, { emissive: 0x3a1a04 }),
      x,
      FLOOR + 1.11,
      zf - 0.2,
    );
  }
  ashtray(g, -1.05, FLOOR + 1.09, zf - 0.22, true);
  // back bar: mirror, shelves with bottles, a warm strip of light under each shelf
  const mirror = canvasTex(64, 32, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, "#1a140f");
    gr.addColorStop(0.5, "#30241a");
    gr.addColorStop(1, "#100b08");
    c.fillStyle = gr;
    c.fillRect(0, 0, w, h);
    c.fillStyle = "rgba(255,230,200,.05)"; // streaks of the lamps in the old glass
    for (let i = 0; i < 6; i++) c.fillRect(i * 12, 0, 4, h);
  });
  const wood = lam(0x3a160a);
  add(g, new THREE.PlaneGeometry(4.8, 1.2), basic(0xffffff, { map: mirror }), 0, FLOOR + 1.78, -WZ + 0.05);
  add(g, new THREE.BoxGeometry(5, 1.5, 0.08), wood, 0, FLOOR + 1.75, -WZ + 0.005);
  // a gilt frame round the mirror
  for (const [w, h, x, y] of [
    [4.9, 0.05, 0, 2.39],
    [4.9, 0.05, 0, 1.17],
    [0.05, 1.27, -2.43, 1.78],
    [0.05, 1.27, 2.43, 1.78],
  ])
    add(g, new THREE.BoxGeometry(w, h, 0.03), brass, x, FLOOR + y, -WZ + 0.06);
  const backBar = bottles();
  for (const y of [FLOOR + 1.3, FLOOR + 1.68, FLOOR + 2.06]) {
    add(g, new THREE.BoxGeometry(4.8, 0.035, 0.26), wood, 0, y, -WZ + 0.15);
    add(g, new THREE.BoxGeometry(4.7, 0.012, 0.02), basic(0xffb85a), 0, y - 0.024, -WZ + 0.2);
    for (const x of [-2.2, -1.1, 0, 1.1, 2.2])
      add(g, new THREE.BoxGeometry(0.018, 0.07, 0.2), wood, x, y - 0.05, -WZ + 0.14); // brackets
    backBar.shelf(-2.25, 2.25, y + 0.018, -WZ + 0.14);
  }
  backBar.into(g);
  counter.into(g);
  add(g, new THREE.BoxGeometry(5, 0.08, 0.12), lam(0x2a0f07), 0, FLOOR + 2.55, -WZ + 0.06);
  for (const x of [-1.6, 0, 1.6]) {
    const p = new THREE.PointLight(0xffb468, 0.55, 3.2, 1.5);
    p.position.set(x, FLOOR + 2.1, -WZ + 0.9);
    g.add(p);
  }
  // stools
  const seat = lam(0x8a1f1a),
    chrome = phong(0xcfd3d8, { specular: 0xffffff, shininess: 80 });
  for (let i = 0; i < 6; i++) {
    const x = -2.1 + i * 0.84;
    add(g, facet(new THREE.CylinderGeometry(0.19, 0.17, 0.08, 8)), seat, x, FLOOR + 0.78, zf + 0.42);
    add(g, new THREE.CylinderGeometry(0.025, 0.025, 0.72, 6), chrome, x, FLOOR + 0.38, zf + 0.42);
    add(g, new THREE.TorusGeometry(0.15, 0.01, 4, 10), chrome, x, FLOOR + 0.28, zf + 0.42).rotation.x = Math.PI / 2;
    add(g, facet(new THREE.CylinderGeometry(0.17, 0.2, 0.03, 8)), chrome, x, FLOOR + 0.015, zf + 0.42);
    shadowBlob(g, x, zf + 0.42, 0.55).position.y = FLOOR + 0.003;
  }
  // Marcel
  const m = figure(
    {
      skin: "#e5b08e",
      shirt: "#f1ece0",
      trim: "#1a1a1a",
      pants: "#1a1a1a",
      hair: "#1c1410",
      hairStyle: "side",
      hat: "none",
      facial: "stache",
      bowtie: true,
      build: 1.05,
    },
    "stand",
  );
  m.g.position.set(1.1, FLOOR, -3.15);
  g.add(m.g);
  m.hold("glass");
  m.glass!.liquid.visible = false;
  C.bartender = m;
  return g;
}

/** a beer font: three brass pillars on a drip tray, an enamel badge each to the room, the handles and spouts to Marcel */
function beerFont(g: THREE.Object3D, x0: number, y: number, z: number): void {
  const brass = TBL.brass,
    steel = phong(0x2a2c30, { specular: 0x8a8f99, shininess: 60 });
  add(g, new THREE.BoxGeometry(0.46, 0.022, 0.16), steel, x0, y + 0.011, z);
  add(g, new THREE.BoxGeometry(0.42, 0.006, 0.12), lam(0x0c0c0e), x0, y + 0.023, z); // the grid
  const badges = [0xb5241c, 0xe8dcc0, 0x1f3f7a],
    knobs = [0xf0e8d8, 0x141414, 0xc8a050];
  [-0.14, 0, 0.14].forEach((dx, i) => {
    const x = x0 + dx;
    add(g, facet(new THREE.CylinderGeometry(0.034, 0.034, 0.012, 8)), brass, x, y + 0.03, z);
    add(g, facet(new THREE.CylinderGeometry(0.021, 0.026, 0.26, 8)), brass, x, y + 0.16, z);
    add(g, facet(new THREE.SphereGeometry(0.027, 8, 3, 0, Math.PI * 2, 0, Math.PI / 2)), brass, x, y + 0.29, z);
    const badge = add(
      g,
      new THREE.CylinderGeometry(0.03, 0.03, 0.008, 10),
      lam(badges[i], { emissive: 0x1a1008 }),
      x,
      y + 0.23,
      z + 0.025,
    );
    badge.rotation.x = Math.PI / 2;
    add(g, new THREE.CylinderGeometry(0.014, 0.014, 0.01, 8), brass, x, y + 0.23, z + 0.031).rotation.x = Math.PI / 2;
    add(g, new THREE.CylinderGeometry(0.008, 0.008, 0.06, 6), brass, x, y + 0.2, z - 0.045).rotation.x = Math.PI / 2; // spout
    add(g, new THREE.CylinderGeometry(0.007, 0.006, 0.035, 6), brass, x, y + 0.183, z - 0.072);
    const lever = new THREE.Group();
    lever.position.set(x, y + 0.29, z - 0.01);
    lever.rotation.x = -0.35; // leaning back to Marcel
    g.add(lever);
    add(lever, new THREE.CylinderGeometry(0.008, 0.006, 0.08, 6), brass, 0, 0.04, 0);
    add(lever, facet(new THREE.CylinderGeometry(0.015, 0.012, 0.075, 6)), lam(knobs[i]), 0, 0.115, 0);
    add(lever, new THREE.CylinderGeometry(0.0155, 0.0155, 0.01, 6), lam(badges[i]), 0, 0.12, 0);
  });
  // tulip glasses upside down on the tray, rinsed and waiting
  const glassM = lam(0xe8f0f0, { transparent: true, opacity: 0.35 });
  for (const dx of [0.3, 0.37, 0.44])
    add(g, facet(new THREE.CylinderGeometry(0.022, 0.032, 0.1, 7)), glassM, x0 + dx, y + 0.05, z + 0.02);
}

/** an old brass till at the end of the counter */
function till(g: THREE.Object3D, x: number, y: number, z: number): void {
  const brass = phong(0x9a7428, { specular: 0xffe0a0, shininess: 50 }),
    t = new THREE.Group();
  t.position.set(x, y, z);
  t.rotation.y = -0.35;
  g.add(t);
  add(t, new THREE.BoxGeometry(0.3, 0.08, 0.26), lam(0x2a0f07), 0, 0.04, 0); // the drawer
  add(t, new THREE.BoxGeometry(0.28, 0.14, 0.14), brass, 0, 0.15, -0.05);
  const keys = canvasTex(
    16,
    8,
    (c, w, h) => {
      c.fillStyle = "#3a2a10";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#f0e6cc";
      for (let i = 0; i < w; i += 2) for (let j = 0; j < h; j += 2) c.fillRect(i, j, 1, 1);
    },
    { pixel: true },
  );
  const pad = add(t, new THREE.BoxGeometry(0.26, 0.012, 0.12), lam(0xffffff, { map: keys }), 0, 0.12, 0.07);
  pad.rotation.x = 0.45;
  add(t, new THREE.BoxGeometry(0.16, 0.06, 0.03), lam(0xf4ecd8, { emissive: 0x2a2416 }), 0, 0.25, -0.06); // the sum
  add(t, new THREE.BoxGeometry(0.2, 0.012, 0.04), brass, 0, 0.285, -0.06);
}
