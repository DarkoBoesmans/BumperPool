// The ten balls: live positions, a short drop into the goal, a place in the return tray, Medusa's stone look,
// and the slide when a legend's power moves them.
import { THREE, M, add, basic, phong, canvasTex } from "./three";
import { TBL } from "./table";
import { GOAL_X, R } from "../core/table";
import type { Ball, Color } from "../types";
import type { Move } from "../core/powers";

const B = {} as {
  meshes: THREE.Mesh<THREE.SphereGeometry, THREE.MeshPhongMaterial>[];
  blobs: THREE.Mesh[];
  mat: Record<Color, THREE.MeshPhongMaterial>;
  stone: THREE.MeshPhongMaterial;
  anim: Record<number, { on: boolean; x: number; y: number; t: number; h: number }>;
  slides: { m: Move; t0: number }[];
};
const blobTex = (): THREE.CanvasTexture =>
  canvasTex(32, 32, (c) => {
    const g = c.createRadialGradient(16, 16, 1, 16, 16, 16);
    g.addColorStop(0, "rgba(0,0,0,.65)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 32, 32);
  });
export const blobMat = basic(0xffffff, { transparent: true, depthWrite: false });

export function buildBalls(scene: THREE.Scene): void {
  blobMat.map = blobTex();
  const sphere = new THREE.SphereGeometry(R * M, 16, 12);
  B.mat = {
    W: phong(0xe6dcc4, { specular: 0x8a8a8a, shininess: 45 }),
    R: phong(0xb8121c, { specular: 0x7a4a40, shininess: 45 }),
  };
  B.stone = phong(0x8a8a84, { specular: 0x222222, shininess: 5, flatShading: true });
  B.meshes = [];
  B.blobs = [];
  B.anim = {};
  B.slides = [];
  for (let i = 0; i < 10; i++) {
    B.meshes.push(add(scene, sphere, i < 5 ? B.mat.W : B.mat.R));
    const b = add(scene, new THREE.PlaneGeometry(0.085, 0.085), blobMat, 0, 0.0016, 0);
    b.rotation.x = -Math.PI / 2;
    B.blobs.push(b);
  }
}

/** a legend's power slides balls to new spots: show the slide over `ms` */
export function slideBalls(moves: Move[], now: number): void {
  for (const m of moves) B.slides.push({ m, t0: now });
}

const ease = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));

/** frame: a replay frame (x, y, on per ball) instead of the live balls */
export function updateBalls(balls: Ball[], now: number, frame: Float32Array | null): void {
  const potted: Record<Color, number[]> = { W: [], R: [] };
  balls
    .filter((b) => !b.on && b.potN)
    .sort((a, b) => a.potN - b.potN)
    .forEach((b) => potted[b.c].push(b.id));
  B.slides = B.slides.filter((s) => now - s.t0 < 900);
  for (const b of balls) {
    const m = B.meshes[b.id],
      sh = B.blobs[b.id];
    const on = frame ? frame[b.id * 3 + 2] > 0 : b.on;
    let x = frame ? frame[b.id * 3] : b.x,
      y = frame ? frame[b.id * 3 + 1] : b.y;
    const sl = !frame && B.slides.find((s) => s.m.id === b.id);
    if (sl) {
      const k = ease((now - sl.t0) / 900);
      x = sl.m.from.x + (sl.m.to.x - sl.m.from.x) * k;
      y = sl.m.from.y + (sl.m.to.y - sl.m.from.y) * k;
    }
    m.material = !frame && b.stone ? B.stone : B.mat[b.c];
    const a = B.anim[b.id] || (B.anim[b.id] = { on, x, y, t: 0, h: 1 });
    if (a.on && !on) {
      a.t = now;
      a.x = x;
      a.y = y;
      a.h = Math.sign(x) || 1;
    }
    a.on = on;
    if (on) {
      m.visible = sh.visible = true;
      m.position.set(x * M, R * M, y * M);
      sh.position.set(x * M + 0.004, 0.0016, y * M + 0.004);
      if (!frame) {
        a.x = x;
        a.y = y;
      }
      continue;
    }
    sh.visible = false;
    const age = (now - a.t) / 1000;
    if (age < 0.28 && a.t) {
      // falling into the hole
      const k = age / 0.28,
        gx = a.h * GOAL_X;
      m.visible = true;
      m.position.set((a.x + (gx - a.x) * k) * M, (R - k * k * 2.4 * R) * M, a.y * (1 - k) * M);
    } else if (frame || age < 1.05) m.visible = false;
    else {
      // resting in the tray
      const i = potted[b.c].indexOf(b.id);
      m.visible = i >= 0;
      if (i >= 0)
        m.position.copy(TBL.tray.localToWorld(new THREE.Vector3(-0.15 + i * 0.066, 0.002, b.c === "W" ? 0.11 : 0.04)));
    }
  }
}
