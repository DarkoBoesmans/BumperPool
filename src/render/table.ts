// The table: rail, cushions all the way round, the goals with their lip, body, legs, the ball tray and the posts.
import { THREE, M, FLOOR, add, lam, basic, phong, facet, canvasTex } from "./three";
import { buildCloth, setCushionMat } from "./cloth";
import { GOAL_X, GOAL_R, LIP_R, LIP_SPAN, DOPS, COLORS, home } from "../core/table";
import type { Color } from "../types";

export const TBL = {} as {
  group: THREE.Group;
  wood: THREE.MeshLambertMaterial;
  dark: THREE.MeshLambertMaterial;
  brass: THREE.MeshPhongMaterial;
  tray: THREE.Group;
  plaques: Record<Color, { mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshLambertMaterial>; name: string | null }>;
};

function woodTex(base: string): THREE.CanvasTexture {
  return canvasTex(
    64,
    64,
    (c, w, h) => {
      c.fillStyle = base;
      c.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) {
        c.fillStyle = `rgba(${Math.random() < 0.5 ? "25,6,2" : "255,220,180"},${0.06 + Math.random() * 0.14})`;
        c.fillRect(0, Math.random() * h, w, 1 + Math.random() * 2);
      }
    },
    { repeat: [6, 1] },
  );
}
/** rail colour from the shop */
export function setRail(hex: string): void {
  TBL.wood.map?.dispose();
  TBL.wood.map = woodTex(hex);
  TBL.wood.needsUpdate = true;
  TBL.dark.color.set(hex).multiplyScalar(0.7);
}

const rr = (s: THREE.Shape | THREE.Path, x: number, y: number, w: number, h: number, r: number) => {
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
};

export function buildTable(scene: THREE.Scene): void {
  const T = (TBL.group = new THREE.Group());
  scene.add(T);
  buildCloth(T);
  TBL.wood = lam(0xffffff, { map: woodTex("#5a2414") });
  TBL.dark = lam(0x6b2c18);
  TBL.brass = phong(0xd4a752, { specular: 0xfff0c0, shininess: 50, emissive: 0x2a1a05 });
  const wood = TBL.wood,
    brass = TBL.brass;

  // rail with a soft bevel and a brass inlay
  const rail = new THREE.Shape();
  rr(rail, -1.05, -0.6, 2.1, 1.2, 0.07);
  const hole = new THREE.Path();
  hole.moveTo(-0.93, -0.48);
  hole.lineTo(0.93, -0.48);
  hole.lineTo(0.93, 0.48);
  hole.lineTo(-0.93, 0.48);
  hole.lineTo(-0.93, -0.48);
  rail.holes.push(hole);
  const railGeo = new THREE.ExtrudeGeometry(rail, {
    depth: 0.045,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 1,
    curveSegments: 3,
  });
  railGeo.rotateX(-Math.PI / 2);
  add(T, railGeo, wood, 0, 0.004, 0);
  for (const z of [-0.54, 0.54]) add(T, new THREE.BoxGeometry(1.9, 0.002, 0.006), brass, 0, 0.06, z);
  for (const x of [-0.99, 0.99])
    for (const z of [-0.35, 0.35]) add(T, new THREE.CylinderGeometry(0.008, 0.008, 0.003, 6), brass, x, 0.06, z);

  // cushions all the way round
  const cushionMat = lam(0x1d7466);
  setCushionMat(cushionMat);
  const nose = new THREE.Shape();
  nose.moveTo(0, 0);
  nose.lineTo(0.03, 0);
  nose.lineTo(0.03, 0.04);
  nose.lineTo(0.01, 0.04);
  nose.lineTo(0, 0.031);
  nose.lineTo(0, 0);
  const cushion = (len: number, x: number, z: number, ry: number) => {
    const g = new THREE.ExtrudeGeometry(nose, { depth: len, bevelEnabled: false });
    g.translate(0, 0, -len / 2);
    add(T, facet(g), cushionMat, x, 0, z).rotation.y = ry;
  };
  cushion(1.86, 0, 0.45, -Math.PI / 2);
  cushion(1.86, 0, -0.45, Math.PI / 2);
  cushion(0.96, 0.9, 0, 0);
  cushion(0.96, -0.9, 0, Math.PI);

  // the goals: the hole, a ring in the colour that scores here (white attacks +x), and the curved lip behind it
  const black = basic(0x020202),
    lipMat = phong(0x1a1a1c, { specular: 0x666666, shininess: 40, side: THREE.DoubleSide });
  for (const h of [1, -1]) {
    const gx = h * GOAL_X * M;
    add(T, new THREE.CircleGeometry(GOAL_R * M, 20), black, gx, 0.0012, 0).rotation.x = -Math.PI / 2;
    add(
      T,
      new THREE.CylinderGeometry(GOAL_R * M, GOAL_R * M, 0.06, 20, 1, true),
      basic(0x0c0806, { side: THREE.BackSide }),
      gx,
      -0.029,
      0,
    );
    add(
      T,
      new THREE.RingGeometry(34 * M, 38.5 * M, 24),
      basic(h === 1 ? 0xefe7d4 : 0xd9423f),
      gx,
      0.0014,
      0,
    ).rotation.x = -Math.PI / 2;
    const start = (h > 0 ? Math.PI / 2 : (3 * Math.PI) / 2) - LIP_SPAN;
    for (const r of [LIP_R, LIP_R + 3])
      add(T, new THREE.CylinderGeometry(r * M, r * M, 0.03, 12, 1, true, start, 2 * LIP_SPAN), lipMat, gx, 0.015, 0);
    add(
      T,
      new THREE.RingGeometry(LIP_R * M, (LIP_R + 3) * M, 12, 1, start - Math.PI / 2, 2 * LIP_SPAN),
      lipMat,
      gx,
      0.03,
      0,
    ).rotation.x = -Math.PI / 2;
  }

  // body, apron, legs, coin slot
  add(T, new THREE.BoxGeometry(2.04, 0.15, 1.14), wood, 0, -0.078, 0);
  add(T, new THREE.BoxGeometry(2.06, 0.02, 1.16), TBL.dark, 0, -0.16, 0);
  add(T, new THREE.BoxGeometry(0.01, 0.07, 0.15), brass, 1.025, -0.075, 0.3);
  add(T, new THREE.BoxGeometry(0.006, 0.035, 0.01), black, 1.031, -0.07, 0.3);
  const legGeo = facet(
    new THREE.LatheGeometry(
      [
        [0, 0],
        [0.055, 0],
        [0.058, 0.03],
        [0.04, 0.08],
        [0.048, 0.17],
        [0.03, 0.35],
        [0.038, 0.5],
        [0.052, 0.55],
        [0.052, 0.6],
        [0, 0.6],
      ].map(([r, y]) => new THREE.Vector2(r, y)),
      8,
    ),
  );
  for (const x of [-0.88, 0.88])
    for (const z of [-0.46, 0.46]) {
      add(T, legGeo, wood, x, FLOOR, z);
      add(T, new THREE.CylinderGeometry(0.06, 0.06, 0.012, 8), brass, x, FLOOR + 0.006, z);
    }

  // ball return tray on the long side: white balls in the back row, red in the front
  const tray = (TBL.tray = new THREE.Group());
  tray.position.set(0, -0.11, 0.6);
  T.add(tray);
  add(tray, new THREE.BoxGeometry(0.4, 0.012, 0.15), TBL.dark, 0, -0.035, 0.075);
  add(tray, new THREE.BoxGeometry(0.4, 0.05, 0.01), wood, 0, -0.012, 0.15);
  for (const x of [-0.2, 0.2]) add(tray, new THREE.BoxGeometry(0.01, 0.05, 0.15), wood, x, -0.012, 0.075);
  add(tray, new THREE.BoxGeometry(0.41, 0.006, 0.012), brass, 0, 0.014, 0.152);
  add(tray, new THREE.BoxGeometry(0.39, 0.012, 0.004), lam(0x2a120a), 0, -0.022, 0.075);
  add(tray, new THREE.BoxGeometry(0.12, 0.05, 0.02), lam(0x0a0604), 0, 0.02, -0.005);

  // brass name plaques on the short rails (plaques.ts paints them)
  TBL.plaques = {} as typeof TBL.plaques;
  for (const c of COLORS) {
    const m = add(T, new THREE.PlaneGeometry(0.3, 0.075), lam(0xe8e0d0), home(c) * 0.99, 0.0605, 0);
    m.rotation.order = "YXZ";
    m.rotation.y = home(c) < 0 ? -Math.PI / 2 : Math.PI / 2;
    m.rotation.x = -Math.PI / 2;
    TBL.plaques[c] = { mesh: m, name: null };
  }

  // posts: chrome stems with two red rubber rings
  const chrome = lam(0xaeb3ba, { emissive: 0x1a1a1c }),
    rubber = lam(0xb3392c);
  const postGeo = new THREE.LatheGeometry(
    [
      [0, 0],
      [0.0175, 0],
      [0.0175, 0.038],
      [0.014, 0.045],
      [0.008, 0.0475],
      [0, 0.048],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    10,
  );
  const ringGeo = new THREE.TorusGeometry(0.0172, 0.0036, 5, 10);
  for (const d of DOPS) {
    add(T, postGeo, chrome, d.x * M, 0, d.y * M);
    for (const y of [0.022, 0.034]) add(T, ringGeo, rubber, d.x * M, y, d.y * M).rotation.x = Math.PI / 2;
  }
}
