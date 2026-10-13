// Smaller props that make one bar different from the next: a dartboard, a TV with the football on, neon signs, an
// upright piano, a trophy cabinet, potted plants, a fireplace and string lights. Built when a venue first needs one.
// The back wall's corners are shared: no venue has both a dartboard and a piano or fireplace on the left, and the
// TV hangs above the trophy cabinet on the right.
import { THREE, FLOOR, add, lam, basic, phong, facet, canvasTex } from "../render/three";
import { S } from "../render/renderer";
import { WX, WZ, H, rnd } from "./state";
import type { Venue } from "../data/venues";

const BACK = -WZ + 0.03;
/** neon tubes and string-light bulbs, tinted per venue */
const tinted: THREE.MeshBasicMaterial[] = [];
const fires: { m: THREE.Mesh; l: THREE.PointLight }[] = [];
let tvScreen: THREE.MeshBasicMaterial | null = null;

export function darts(g: THREE.Group): void {
  const t = canvasTex(128, 128, (c, w) => {
    const cols = ["#111", "#e8dcc0"];
    for (let i = 0; i < 20; i++) {
      c.fillStyle = cols[i % 2];
      c.beginPath();
      c.moveTo(64, 64);
      c.arc(64, 64, 60, (i / 20) * Math.PI * 2, ((i + 1) / 20) * Math.PI * 2);
      c.fill();
    }
    for (const [r, a, b] of [
      [60, "#b8261d", "#1e7a3a"],
      [38, "#b8261d", "#1e7a3a"],
    ] as const) {
      c.lineWidth = 6;
      for (let i = 0; i < 20; i++) {
        c.strokeStyle = i % 2 ? a : b;
        c.beginPath();
        c.arc(64, 64, r - 3, (i / 20) * Math.PI * 2, ((i + 1) / 20) * Math.PI * 2);
        c.stroke();
      }
    }
    c.fillStyle = "#1e7a3a";
    c.beginPath();
    c.arc(64, 64, 8, 0, 7);
    c.fill();
    c.fillStyle = "#b8261d";
    c.beginPath();
    c.arc(64, 64, 4, 0, 7);
    c.fill();
    c.strokeStyle = "#d8d8d8";
    c.lineWidth = 1;
    c.strokeRect(0.5, 0.5, w - 1, w - 1);
  });
  const x = -3.7;
  add(g, new THREE.BoxGeometry(0.62, 0.62, 0.03), lam(0x2a140a), x, FLOOR + 1.73, BACK + 0.015);
  add(g, new THREE.CircleGeometry(0.23, 20), basic(0xffffff, { map: t }), x, FLOOR + 1.73, BACK + 0.035);
  for (const [dx, dy] of [
    [0.03, 0.05],
    [-0.06, -0.02],
    [0.01, -0.09],
  ])
    add(
      g,
      new THREE.CylinderGeometry(0.004, 0.002, 0.09, 4),
      lam(0x3b73c4),
      x + dx,
      FLOOR + 1.73 + dy,
      BACK + 0.08,
    ).rotation.x = Math.PI / 2;
  add(g, new THREE.BoxGeometry(0.4, 0.5, 0.02), lam(0x1a2a1e), x - 0.62, FLOOR + 1.6, BACK + 0.01); // the score slate
  add(g, new THREE.BoxGeometry(0.6, 0.004, 0.04), basic(0xe8e0c8), x, FLOOR + 0.002, BACK + 2.37); // the oche
}

export function tv(g: THREE.Group): void {
  const t = canvasTex(160, 90, (c, w, h) => {
    c.fillStyle = "#2a8a3a";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#33a046";
    for (let x = 0; x < w; x += 20) c.fillRect(x, 0, 10, h);
    c.strokeStyle = "#e8f0e8";
    c.lineWidth = 2;
    c.strokeRect(6, 8, w - 12, h - 16);
    c.beginPath();
    c.moveTo(w / 2, 8);
    c.lineTo(w / 2, h - 8);
    c.stroke();
    c.beginPath();
    c.arc(w / 2, h / 2, 12, 0, 7);
    c.stroke();
    c.fillStyle = "rgba(0,0,0,.7)";
    c.fillRect(6, 4, 54, 12);
    c.fillStyle = "#fff";
    c.font = "bold 9px sans-serif";
    c.fillText("HOME 1-1 AWAY", 9, 13);
  });
  tvScreen = basic(0xffffff, { map: t });
  const x = 3.7,
    y = FLOOR + 2.15;
  add(g, new THREE.BoxGeometry(1.02, 0.6, 0.06), phong(0x111114, { shininess: 60 }), x, y, BACK + 0.12);
  add(g, new THREE.PlaneGeometry(0.94, 0.53), tvScreen, x, y, BACK + 0.155);
  add(g, new THREE.BoxGeometry(0.06, 0.06, 0.1), lam(0x222226), x, y, BACK + 0.05);
}

export function neon(g: THREE.Group): void {
  for (const [s, word] of [
    [1, "BILLIARDS"],
    [-1, "OPEN LATE"],
  ] as const) {
    const t = canvasTex(256, 64, (c, w, h) => {
      c.font = "bold 40px Anton, Impact, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.shadowColor = "#fff";
      c.shadowBlur = 10;
      c.strokeStyle = "#fff";
      c.lineWidth = 3;
      c.strokeText(word, w / 2, h / 2);
    });
    const m = basic(0xffffff, { map: t, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    tinted.push(m);
    const p = add(g, new THREE.PlaneGeometry(1.2, 0.3), m, s * (WX - 0.05), FLOOR + 2.55, s * 1.9);
    p.rotation.y = (-s * Math.PI) / 2;
  }
}

export function piano(g: THREE.Group): void {
  const p = new THREE.Group();
  p.position.set(-3.75, FLOOR, -WZ + 0.32);
  g.add(p);
  const body = phong(0x140c08, { shininess: 70 });
  add(p, new THREE.BoxGeometry(1.45, 1.22, 0.5), body, 0, 0.61, 0);
  add(p, new THREE.BoxGeometry(1.35, 0.06, 0.24), basic(0xf2eee4), 0, 0.72, 0.36); // keys
  for (let i = 0; i < 26; i++)
    if (i % 7 !== 2 && i % 7 !== 6)
      add(p, new THREE.BoxGeometry(0.025, 0.02, 0.13), basic(0x111111), -0.62 + i * 0.05, 0.76, 0.32);
  add(p, new THREE.BoxGeometry(1.45, 0.05, 0.3), body, 0, 0.69, 0.34);
  add(p, new THREE.BoxGeometry(0.8, 0.5, 0.36), body, 0, 0.25, 0.85); // the stool
  add(p, new THREE.BoxGeometry(0.3, 0.4, 0.02), basic(0xf2eee4), -0.2, 1.05, 0.26).rotation.x = -0.3; // sheet music
}

export function trophies(g: THREE.Group): void {
  const c = new THREE.Group();
  c.position.set(3.75, FLOOR, -WZ + 0.25);
  g.add(c);
  const wood = lam(0x3a1e10),
    glass = basic(0xcfe8ff, { transparent: true, opacity: 0.18 }),
    gold = phong(0xd4a24a, { specular: 0xfff0b0, shininess: 80 }),
    silver = phong(0xc8ccd4, { specular: 0xffffff, shininess: 80 });
  add(c, new THREE.BoxGeometry(1.3, 1.4, 0.4), wood, 0, 0.7, -0.02).scale.z = 0.25;
  for (const y of [0.05, 0.5, 0.95, 1.38]) add(c, new THREE.BoxGeometry(1.3, 0.04, 0.4), wood, 0, y, 0);
  for (const x of [-0.63, 0.63]) add(c, new THREE.BoxGeometry(0.04, 1.4, 0.4), wood, x, 0.7, 0);
  add(c, new THREE.PlaneGeometry(1.22, 1.3), glass, 0, 0.7, 0.2);
  for (const [i, y] of [0.07, 0.52, 0.97].entries())
    for (let k = 0; k < 4; k++) {
      const m = (i + k) % 3 ? gold : silver,
        x = -0.45 + k * 0.3 + rnd(-0.03, 0.03),
        s = rnd(0.8, 1.2);
      add(c, new THREE.BoxGeometry(0.08, 0.04, 0.08), m, x, y + 0.04, 0);
      add(c, facet(new THREE.CylinderGeometry(0.012, 0.012, 0.12 * s, 5)), m, x, y + 0.12 * s, 0);
      add(c, facet(new THREE.CylinderGeometry(0.06, 0.02, 0.1 * s, 6)), m, x, y + 0.22 * s, 0);
    }
}

export function plants(g: THREE.Group): void {
  const pot = lam(0x8a4a2a),
    leaf = [lam(0x2f6a2a), lam(0x3a8a34), lam(0x24522a)];
  for (const [x, z] of [
    [-(WX - 0.3), -(WZ - 0.3)],
    [WX - 0.3, -(WZ - 0.3)],
    [-(WX - 0.3), WZ - 0.3],
  ]) {
    add(g, facet(new THREE.CylinderGeometry(0.2, 0.15, 0.36, 7)), pot, x, FLOOR + 0.18, z);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2,
        h = rnd(0.5, 0.95),
        l = add(g, facet(new THREE.ConeGeometry(0.08, h, 4)), leaf[i % 3], x, FLOOR + 0.36 + h / 2, z);
      l.rotation.set(Math.sin(a) * 0.45, 0, Math.cos(a) * 0.45);
      l.position.x += Math.cos(a) * 0.08;
      l.position.z += Math.sin(a) * 0.08;
    }
  }
}

export function fireplace(g: THREE.Group): void {
  const f = new THREE.Group();
  f.position.set(-3.75, FLOOR, -WZ + 0.22);
  g.add(f);
  const brick = canvasTex(
    64,
    64,
    (c, w) => {
      c.fillStyle = "#3a1a10";
      c.fillRect(0, 0, w, w);
      c.fillStyle = "#7a3424";
      for (let y = 0; y < 64; y += 8)
        for (let x = (y / 8) % 2 ? -8 : 0; x < 64; x += 16) c.fillRect(x + 1, y + 1, 14, 6);
    },
    { pixel: true },
  );
  const bm = lam(0xffffff, { map: brick });
  add(f, new THREE.BoxGeometry(1.3, 1.15, 0.4), bm, 0, 0.575, 0);
  add(f, new THREE.BoxGeometry(1.5, 0.08, 0.5), lam(0x2a140a), 0, 1.19, 0.03); // the mantel
  add(f, new THREE.BoxGeometry(0.72, 0.6, 0.05), basic(0x080404), 0, 0.33, 0.18);
  for (const x of [-0.18, 0.02, 0.2]) {
    const m = add(f, facet(new THREE.ConeGeometry(0.08, 0.26, 5)), basic(0xffa040), x, 0.2, 0.24);
    const l = new THREE.PointLight(0xff8a30, 0.5, 3.2, 1.6);
    l.position.set(x, 0.4, 0.5);
    f.add(l);
    fires.push({ m, l });
  }
  for (const [x, h] of [
    [-0.4, 0.12],
    [0.38, 0.18],
  ])
    add(f, new THREE.BoxGeometry(0.06, h, 0.06), phong(0xd4a24a), x, 1.23 + h / 2, 0.05); // candlesticks
}

export function lanterns(g: THREE.Group): void {
  const wire = basic(0x111111);
  for (const z of [-1.6, 0, 1.6]) {
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const t = i / n,
        x = -WX + 0.3 + t * (2 * WX - 0.6),
        y = FLOOR + H - 0.25 - Math.sin(t * Math.PI) * 0.35;
      const m = basic(0xffffff);
      tinted.push(m);
      add(g, new THREE.SphereGeometry(0.03, 6, 4), m, x, y, z);
      if (i < n) {
        const w = add(g, new THREE.CylinderGeometry(0.003, 0.003, (2 * WX - 0.6) / n, 3), wire, x, y + 0.02, z);
        w.rotation.z = Math.PI / 2;
        w.position.x += (2 * WX - 0.6) / n / 2;
      }
      if (i % 4 === 2) S.flares.push({ pos: new THREE.Vector3(x, y, z), k: 0.25, vis: () => g.visible });
    }
  }
}

/** the venue's colour on the neon and the string lights */
export function tintMoreProps(v: Venue): void {
  for (const m of tinted) m.color.set(v.neon);
}

export function animateMoreProps(t: number): void {
  for (const f of fires)
    if (f.m.parent?.parent?.visible) {
      const k = 0.8 + Math.sin(t * 11 + f.m.id) * 0.1 + Math.random() * 0.12;
      f.m.scale.set(1, k, 1);
      f.l.intensity = 0.5 * k;
    }
  if (tvScreen?.map) tvScreen.color.setScalar(0.85 + Math.sin(t * 7) * 0.05 + Math.random() * 0.05);
}
