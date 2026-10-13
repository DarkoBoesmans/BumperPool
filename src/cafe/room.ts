// The room: floor, four walls, ceiling and beams, and the lights. paintRoom() repaints it for a venue.
import { THREE, FLOOR, add, lam, basic, flat, facet, canvasTex } from "../render/three";
import { S } from "../render/renderer";
import { TBL } from "../render/table";
import { C, WX, WZ, H, rnd } from "./state";
import type { Venue } from "../data/venues";

const room = {} as {
  group: THREE.Group;
  floor: THREE.MeshLambertMaterial;
  walls: THREE.MeshLambertMaterial[];
  upper: THREE.MeshLambertMaterial[];
  ceiling: THREE.MeshLambertMaterial;
  beams: THREE.MeshLambertMaterial;
  hemi: THREE.HemisphereLight;
  spots: THREE.SpotLight[];
  lights: THREE.PointLight[];
  shade: THREE.MeshLambertMaterial;
};
function floorTex(v: Venue): THREE.CanvasTexture {
  const { a, b, kind } = v.floor;
  return canvasTex(
    128,
    128,
    (c, w) => {
      const n = 4,
        s = w / n;
      if (kind === "tiles") {
        for (let i = 0; i < n; i++)
          for (let j = 0; j < n; j++) {
            c.fillStyle = (i + j) % 2 ? b : a;
            c.fillRect(i * s, j * s, s, s);
          }
        c.fillStyle = "rgba(30,14,8,.5)";
        for (let i = 0; i <= n; i++) {
          c.fillRect(i * s - 1, 0, 2, w);
          c.fillRect(0, i * s - 1, w, 2);
        }
      } else if (kind === "planks") {
        for (let j = 0; j < 8; j++) {
          c.fillStyle = j % 2 ? a : b;
          c.fillRect(0, j * 16, w, 16);
          c.fillStyle = "rgba(0,0,0,.4)";
          c.fillRect(0, j * 16, w, 1);
          c.fillRect(((j * 37) % 128) | 0, j * 16, 1, 16);
        }
      } else if (kind === "stone") {
        c.fillStyle = a;
        c.fillRect(0, 0, w, w);
        for (let j = 0; j < 4; j++)
          for (let i = 0; i < 3; i++) {
            c.fillStyle = (i + j) % 2 ? b : a;
            c.fillRect(i * 44 + (j % 2) * 22 - 22, j * 32, 42, 30);
          }
      } else {
        c.fillStyle = a;
        c.fillRect(0, 0, w, w);
        if (kind === "carpet") {
          c.fillStyle = b;
          for (let i = 0; i < w; i += 16)
            for (let j = 0; j < w; j += 16) if ((i + j) % 32 === 0) c.fillRect(i + 6, j + 6, 4, 4);
        }
      }
      for (let k = 0; k < 400; k++) {
        c.fillStyle = `rgba(40,20,10,${rnd(0.02, 0.08)})`;
        c.fillRect(rnd(0, w), rnd(0, w), rnd(1, 4), rnd(1, 3));
      }
    },
    { repeat: [6.25, 4.75], pixel: true },
  );
}

function wallTex(v: Venue): THREE.CanvasTexture {
  const W = v.wall;
  return canvasTex(
    128,
    128,
    (c, w, h) => {
      c.fillStyle = W.paper;
      c.fillRect(0, 0, w, h);
      c.fillStyle = W.print;
      if (W.kind === "damask")
        for (let y = 8; y < 64; y += 32)
          for (let x = 16; x < w; x += 32) {
            c.beginPath();
            c.ellipse(x + (((y / 32) | 0) % 2 ? 16 : 0), y + 6, 5, 9, 0, 0, 7);
            c.fill();
          }
      if (W.kind === "stripes") for (let x = 0; x < w; x += 16) c.fillRect(x, 0, 6, 64);
      if (W.kind === "planks") for (let x = 0; x < w; x += 21) c.fillRect(x, 0, 2, h);
      if (W.kind === "tiles")
        for (let y = 0; y < 64; y += 8) {
          c.fillRect(0, y, w, 1);
          for (let x = (y / 8) % 2 ? 0 : 8; x < w; x += 16) c.fillRect(x, y, 1, 8);
        }
      if (W.kind === "stone")
        for (let y = 0; y < 64; y += 16)
          for (let x = (y / 16) % 2 ? 0 : 16; x < w; x += 32) c.strokeRect(x + 0.5, y + 0.5, 32, 16);
      const wy = 64;
      c.fillStyle = W.panel;
      c.fillRect(0, wy, w, h - wy);
      c.strokeStyle = "rgba(0,0,0,.5)";
      c.lineWidth = 3;
      c.strokeRect(8, wy + 10, w - 16, h - wy - 20);
      c.strokeStyle = "rgba(255,190,140,.1)";
      c.lineWidth = 1;
      c.strokeRect(12, wy + 14, w - 24, h - wy - 28);
      c.fillStyle = W.rail;
      c.fillRect(0, wy - 3, w, 4);
    },
    { pixel: true },
  );
}

export function buildRoom(scene: THREE.Scene): THREE.Group {
  const g = (room.group = new THREE.Group());
  scene.add(g);
  room.floor = lam(0xffffff);
  flat(g, 2 * WX, 2 * WZ, room.floor, 0, FLOOR, 0);
  room.walls = [];
  room.upper = [];
  const wall = (len: number, x: number, z: number, ry: number) => {
    const m = lam(0xffffff);
    m.userData.len = len;
    room.walls.push(m);
    add(g, new THREE.PlaneGeometry(len, 2.6, Math.round(len * 2), 6), m, x, FLOOR + 1.3, z).rotation.y = ry;
    const u = lam(0x14251a);
    room.upper.push(u);
    add(g, new THREE.PlaneGeometry(len, H - 2.6, 2, 1), u, x, FLOOR + 2.6 + (H - 2.6) / 2, z).rotation.y = ry;
  };
  wall(2 * WX, 0, -WZ, 0);
  wall(2 * WX, 0, WZ, Math.PI);
  wall(2 * WZ, -WX, 0, Math.PI / 2);
  wall(2 * WZ, WX, 0, -Math.PI / 2);
  // ceiling and beams: hidden with the lamps when the camera looks straight down
  const over = (C.overhead = new THREE.Group());
  g.add(over);
  room.ceiling = lam(0x120b08);
  add(over, new THREE.PlaneGeometry(2 * WX, 2 * WZ), room.ceiling, 0, FLOOR + H, 0).rotation.x = Math.PI / 2;
  room.beams = lam(0x2a140a);
  for (let x = -4; x <= 4; x += 2)
    add(over, new THREE.BoxGeometry(0.18, 0.16, 2 * WZ), room.beams, x, FLOOR + H - 0.08, 0);
  // light: a dim room, three pools over the table, picture lights over the boards, a pendant over each player
  room.hemi = new THREE.HemisphereLight(0xffd9b0, 0x2a140a, 0.34);
  scene.add(room.hemi);
  room.lights = [];
  for (const [x, y, z, ry] of [
    [WX - 0.12, 1.08, 0, -Math.PI / 2],
    [-WX + 0.12, 1.08, 0, Math.PI / 2],
    [-0.9, 1.35, WZ - 0.12, Math.PI],
    [0.9, 1.35, WZ - 0.12, Math.PI],
  ]) {
    add(g, new THREE.BoxGeometry(0.5, 0.05, 0.08), TBL.brass, x, y, z).rotation.y = ry;
    add(g, new THREE.BoxGeometry(0.44, 0.012, 0.03), basic(0xfff1c8), x, y - 0.03, z).rotation.y = ry;
    const p = new THREE.PointLight(0xffd9a0, 0.7, 2.6, 1.5);
    p.position.set(x * 0.97, y - 0.15, z * 0.97);
    scene.add(p);
    room.lights.push(p);
  }
  room.spots = [];
  for (const x of [-0.6, 0, 0.6]) {
    const sp = new THREE.SpotLight(0xffe4b8, 1.35, 4.2, 0.85, 0.65, 1.2);
    sp.position.set(x, 0.86, 0);
    sp.target.position.set(x, -0.5, 0);
    scene.add(sp, sp.target);
    room.spots.push(sp);
  }
  room.shade = lam(0x0d7a3e, { emissive: 0x05301a });
  for (const h of [-1, 1]) {
    const p = new THREE.Group();
    p.position.set(h * 1.9, FLOOR + 2.25, -h * 1.05);
    scene.add(p);
    add(p, facet(new THREE.CylinderGeometry(0.04, 0.13, 0.12, 8, 1, true)), room.shade);
    add(p, new THREE.SphereGeometry(0.03, 6, 4), basic(0xfff1c8), 0, -0.04, 0);
    add(p, new THREE.CylinderGeometry(0.003, 0.003, 0.9, 4), TBL.brass, 0, 0.5, 0);
    const l = new THREE.PointLight(0xffd8a8, 0.9, 3.4, 1.4);
    l.position.set(h * 1.9, FLOOR + 2.1, -h * 1.05);
    scene.add(l);
    room.lights.push(l);
  }
  return g;
}

/** repaint the room for a venue: walls, floor, ceiling, fog and the colour of the light */
export function paintRoom(v: Venue): void {
  room.floor.map?.dispose();
  room.floor.map = floorTex(v);
  room.floor.needsUpdate = true;
  const wt = wallTex(v);
  for (const m of room.walls) {
    m.map?.dispose();
    const t = wt.clone();
    t.needsUpdate = true;
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.set(m.userData.len / 1.3, 1);
    m.map = t;
    m.needsUpdate = true;
  }
  for (const u of room.upper) u.color.set(v.wall.upper);
  room.ceiling.color.set(v.ceiling);
  room.beams.color.set(v.wall.panel);
  const fog = S.scene.fog as THREE.Fog;
  fog.color.set(v.fog);
  (S.scene.background as THREE.Color).set(v.fog);
  room.hemi.color.set(v.light);
  room.hemi.groundColor.set(v.wall.panel);
  room.hemi.intensity = v.ambient;
  for (const s of room.spots) s.color.set(v.light);
  for (const p of room.lights) p.color.set(v.light).lerp(new THREE.Color(0xffd9a0), 0.4);
  room.shade.color.set(v.shade);
}
