// Two leather booths along the front wall with a regular in each, the red lantern in the corner and the jukebox.
import { THREE, FLOOR, add, lam, basic, facet, canvasTex } from "../render/three";
import { S } from "../render/renderer";
import { TBL } from "../render/table";
import { figure } from "../people/figure";
import { ashtray } from "./props";
import { C, WX, WZ } from "./state";

export function buildBooths(scene: THREE.Scene): THREE.Group {
  const root = new THREE.Group();
  scene.add(root);
  const leather = lam(0x1d3d2a),
    frame = TBL.wood,
    globe = basic(0xfff0d0);
  for (const bx of [-2.4, 2.4]) {
    const g = new THREE.Group();
    g.position.set(bx, FLOOR, WZ - 0.85);
    root.add(g);
    for (const s of [-1, 1]) {
      add(g, new THREE.BoxGeometry(0.5, 0.46, 1.5), leather, s * 0.55, 0.23, 0);
      add(g, new THREE.BoxGeometry(0.14, 1.25, 1.5), leather, s * 0.86, 0.62, 0);
      add(g, new THREE.BoxGeometry(0.06, 1.32, 1.56), frame, s * 0.95, 0.66, 0);
      for (let z = -0.55; z <= 0.55; z += 0.37)
        add(g, new THREE.BoxGeometry(0.02, 0.9, 0.012), lam(0x12281b), s * 0.78, 0.72, z); // tufted pleats
    }
    add(g, new THREE.CylinderGeometry(0.36, 0.36, 0.035, 8), basic(0xf3dfb0), 0, 0.74, 0).rotation.y = Math.PI / 8;
    add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.72, 6), lam(0x141414), 0, 0.37, 0);
    add(g, new THREE.CylinderGeometry(0.2, 0.22, 0.02, 8), lam(0x141414), 0, 0.01, 0);
    add(g, new THREE.SphereGeometry(0.14, 8, 6), globe, 0, 2.15, 0);
    add(g, new THREE.CylinderGeometry(0.004, 0.004, 0.8, 4), TBL.brass, 0, 2.6, 0);
    const p = new THREE.PointLight(0xffd29a, 0.75, 3.6, 1.6);
    p.position.set(0, 1.95, 0);
    g.add(p);
    S.flares.push({ pos: new THREE.Vector3(bx, FLOOR + 2.15, WZ - 0.85), k: 0.75, vis: () => root.visible });
    ashtray(g, 0.12, 0.76, 0.08, bx < 0);
  }
  // red lantern in the corner
  add(root, facet(new THREE.CylinderGeometry(0.1, 0.1, 0.26, 8)), basic(0xff6a3a), -WX + 0.45, 1.25, -WZ + 0.5);
  const red = new THREE.PointLight(0xff3a20, 1.1, 5, 1.6);
  red.position.set(-WX + 0.7, 1.2, -WZ + 0.8);
  root.add(red);
  S.flares.push({ pos: new THREE.Vector3(-WX + 0.45, 1.25, -WZ + 0.5), k: 0.55, vis: () => root.visible });
  // two regulars in the booths
  const p1 = figure(
    {
      skin: "#d9a07c",
      shirt: "#3d5a46",
      trim: "#e0d6c0",
      pants: "#2a2622",
      hair: "#9a948a",
      hairStyle: "short",
      hat: "flatcap",
      hatColor: "#3a3028",
      facial: "stache",
      build: 1.1,
    },
    "sit",
  );
  p1.g.position.set(-2.95, FLOOR, 2.95);
  p1.g.rotation.y = Math.PI / 2;
  root.add(p1.g);
  p1.hold("cigar");
  const p2 = figure(
    {
      skin: "#efc2a4",
      shirt: "#7a2433",
      trim: "#f0d8c8",
      pants: "#2a2228",
      hair: "#5a2a18",
      hairStyle: "bun",
      hat: "none",
      lips: "#b51f2a",
      earrings: "studs",
      build: 0.9,
      frame: "curvy",
      bottom: "skirt",
    },
    "sit",
  );
  p2.g.position.set(-1.85, FLOOR, 2.95);
  p2.g.rotation.y = -Math.PI / 2;
  root.add(p2.g);
  p2.hold("glass");
  C.patrons = [p1, p2];
  return root;
}

export function buildJukebox(scene: THREE.Scene): THREE.Group {
  const g = new THREE.Group();
  g.position.set(WX - 0.5, FLOOR, WZ - 0.55);
  g.rotation.y = -Math.PI * 0.75;
  scene.add(g);
  const face = canvasTex(
    64,
    96,
    (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, w, 0);
      ["#ff9a2a", "#ffd25a", "#ff5a7a", "#7affc0", "#ff9a2a"].forEach((col, i) => gr.addColorStop(i / 4, col));
      c.fillStyle = "#1a0d08";
      c.fillRect(0, 0, w, h);
      c.fillStyle = gr;
      c.beginPath();
      c.arc(w / 2, 34, 30, Math.PI, 0);
      c.lineTo(w - 2, h - 2);
      c.lineTo(2, h - 2);
      c.closePath();
      c.fill();
      c.fillStyle = "#2a1408";
      c.beginPath();
      c.arc(w / 2, 36, 22, Math.PI, 0);
      c.lineTo(w - 10, 60);
      c.lineTo(10, 60);
      c.closePath();
      c.fill();
      c.fillStyle = "#d8d0c0";
      for (let y = 64; y < 90; y += 4) c.fillRect(12, y, w - 24, 2);
    },
    { pixel: true },
  );
  add(g, new THREE.BoxGeometry(0.7, 1.3, 0.45), lam(0x3a1a0c), 0, 0.65, 0);
  add(g, new THREE.PlaneGeometry(0.66, 1.0), basic(0xffffff, { map: face }), 0, 0.82, 0.226);
  const p = new THREE.PointLight(0xff7a5a, 0.9, 3.4, 1.6);
  p.position.set(0, 1.0, 0.5);
  g.add(p);
  return g;
}
