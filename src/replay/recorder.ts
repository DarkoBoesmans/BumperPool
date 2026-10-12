// Records every shot at 60 frames a second: x, y and on-the-table for each ball.
import { G } from "../core/state";

const STEP = 1 / 60;
export const rec = { times: [] as number[], frames: [] as Float32Array[], n: -1, active: false };

function sample(): void {
  const f = new Float32Array(30);
  for (const b of G.balls) {
    f[b.id * 3] = b.x;
    f[b.id * 3 + 1] = b.y;
    f[b.id * 3 + 2] = b.on ? 1 : 0;
  }
  rec.frames.push(f);
  rec.times.push(G.simT);
}
export function recStart(n: number): void {
  rec.times = [];
  rec.frames = [];
  rec.n = n;
  rec.active = true;
  sample();
}
export function recTick(): void {
  if (rec.active && G.simT - rec.times[rec.times.length - 1] >= STEP - 1e-9) sample();
}
export function recStop(): void {
  if (!rec.active) return;
  sample();
  rec.active = false;
}
export const hasShot = (n: number): boolean => rec.n === n && rec.frames.length > 2;
