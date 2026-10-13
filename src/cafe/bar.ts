// The bar along the back wall: counter, taps, a mirror and shelves of bottles, six stools and Marcel behind it.
import { THREE, FLOOR, add, lam, basic, phong, facet, canvasTex } from "../render/three";
import { TBL } from "../render/table";
import { figure, shadowBlob } from "../people/figure";
import { ashtray, bottle } from "./props";
import { C, WZ, rnd } from "./state";

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
  add(g, new THREE.CylinderGeometry(0.018, 0.018, len, 6), brass, 0, FLOOR + 0.2, zf + 0.12).rotation.z = Math.PI / 2;
  add(g, new THREE.CylinderGeometry(0.012, 0.012, len, 6), brass, 0, FLOOR + 1.0, zf + 0.04).rotation.z = Math.PI / 2;
  // taps, glasses and a bottle on the counter
  for (const x of [-0.5, -0.38, -0.26]) {
    add(g, new THREE.CylinderGeometry(0.02, 0.025, 0.24, 6), brass, x, FLOOR + 1.21, zf - 0.33);
    add(g, new THREE.BoxGeometry(0.025, 0.12, 0.025), lam(0x0e0e10), x, FLOOR + 1.39, zf - 0.33);
  }
  bottle(g, 1.6, FLOOR + 1.09, zf - 0.3, 0xb8661a, "tall");
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
    gr.addColorStop(0, "#2a2018");
    gr.addColorStop(0.5, "#4a3626");
    gr.addColorStop(1, "#1a120c");
    c.fillStyle = gr;
    c.fillRect(0, 0, w, h);
    c.fillStyle = "rgba(255,230,200,.06)";
    for (let i = 0; i < 6; i++) c.fillRect(i * 12, 0, 4, h);
  });
  add(g, new THREE.PlaneGeometry(4.8, 1.2), basic(0xffffff, { map: mirror }), 0, FLOOR + 1.78, -WZ + 0.02);
  add(g, new THREE.BoxGeometry(5, 1.5, 0.08), lam(0x3a160a), 0, FLOOR + 1.75, -WZ + 0.005);
  for (const y of [FLOOR + 1.3, FLOOR + 1.68, FLOOR + 2.06]) {
    add(g, new THREE.BoxGeometry(4.8, 0.035, 0.26), lam(0x3a160a), 0, y, -WZ + 0.15);
    add(g, new THREE.BoxGeometry(4.7, 0.012, 0.02), basic(0xffb85a), 0, y - 0.024, -WZ + 0.2);
    for (let x = -2.25; x <= 2.25; x += rnd(0.13, 0.22))
      bottle(
        g,
        x,
        y + 0.018,
        -WZ + 0.14,
        [0xb8661a, 0x7a3a10, 0x1f4a2a, 0xd8e2d8, 0x8a1a1a, 0xc89a3a][(Math.random() * 6) | 0],
        ["", "tall", "squat", "clear"][(Math.random() * 4) | 0],
      );
  }
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
