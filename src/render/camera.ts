// The camera. Player view sits behind your own short end, low enough to see the far wall.
// Free view always looks at a point on the table and turns round it, like a turntable: right-drag turns, a right
// click glides that point to where you clicked, scroll zooms towards the pointer (the point follows), and
// middle-drag or shift + right-drag slides it. Turning round a point you look at never swings the view.
import { THREE, M } from "./three";
import { S, rayAt, calm } from "./renderer";
import { R } from "../core/table";
import type { Color } from "../types";
import { home, att } from "../core/table";

export type CamMode = "intro" | "free" | "top" | "player" | "replay";
export interface ReplayCam {
  pos: THREE.Vector3;
  look: THREE.Vector3;
  cut: boolean;
  high?: boolean;
  crawl?: Color;
}
export const camS = {
  mode: "intro" as CamMode,
  prev: "player" as CamMode,
  /** the start screen's slow turn */
  az: 0.6,
  replay: null as ReplayCam | null,
  iel: 0.36,
  idist: 1,
  hold: 0,
  /** free view: the point on the table it looks at and turns round, the angle round it, the height angle,
   * the distance you asked for (walls can hold the camera closer), and where a right click sent the point */
  target: new THREE.Vector3(),
  faz: 0,
  fel: 0.6,
  fdist: 2,
  focus: null as THREE.Vector3 | null,
};
/** the free view on screen: it eases towards what you asked for round the point it looks at, so a quick turn swings
 * the camera along the circle instead of cutting across it (which would dip it towards the table) */
const view = { az: 0, el: 0.6, d: 2, t: new THREE.Vector3() };
/** 0 to 1: how far the free view has taken over from where the camera was, after a replay hands it back */
let grip = 1,
  last: CamMode = "intro";
const CLOTH = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const BALLS = new THREE.Plane(new THREE.Vector3(0, 1, 0), -R * M);

/** screen edges the HUD covers, in px */
export interface Insets {
  l: number;
  t: number;
  r: number;
  b: number;
}
const off: Insets = { l: 0, t: 0, r: 0, b: 0 };

/** `room`: what the HUD covers. The lens shifts and the fit shrinks so the table sits in the part left free. */
export function updateCamera(dt: number, vc: Color, portrait: boolean, room: Insets): void {
  const cam = S.camera,
    ks = 1 - Math.pow(0.02, dt);
  for (const s of ["l", "t", "r", "b"] as const) off[s] += ((camS.mode === "replay" ? 0 : room[s]) - off[s]) * ks;
  const fw = S.w - off.l - off.r,
    fh = S.h - off.t - off.b,
    tan = Math.tan((cam.fov * Math.PI) / 360),
    tv = (tan * fh) / S.h,
    th = (tan * fw) / S.h;
  cam.setViewOffset(S.w, S.h, (off.r - off.l) / 2, (off.b - off.t) / 2, S.w, S.h);
  const orbit = (az: number, el: number, d: number) =>
    new THREE.Vector3(d * Math.cos(el) * Math.cos(az), d * Math.sin(el), d * Math.cos(el) * Math.sin(az));
  let pos: THREE.Vector3,
    look = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0),
    k = 1 - Math.pow(0.03, dt);
  const m = camS.mode;
  if (m === "replay" && camS.replay) {
    pos = camS.replay.pos;
    look = camS.replay.look;
    k = camS.replay.cut ? 1 : 1 - Math.pow(0.002, dt);
    camS.replay.cut = false;
  } else if (m === "intro") {
    if (!calm && performance.now() > camS.hold) camS.az += dt * 0.08;
    pos = orbit(camS.az, camS.iel, (portrait ? 4.4 : 3.4) * camS.idist);
    look.set(portrait ? 0 : -0.45, 0.1, 0);
    if (S.orbit?.intro) k = 1; // your hand turns it: follow it exactly, a lag would cut across the circle
  } else if (m === "free") {
    if (camS.focus) {
      camS.target.lerp(camS.focus, 1 - Math.pow(0.004, dt));
      if (camS.target.distanceTo(camS.focus) < 0.002) camS.focus = null;
    }
    if (last !== "free") grip = 0;
    const e = 1 - Math.pow(1e-6, dt);
    view.az += (camS.faz - view.az) * e;
    view.el += (camS.fel - view.el) * e;
    view.d += (freeDist() - view.d) * e; // the same ease for the distance and the point keeps a zoom on the pointer
    view.t.lerp(camS.target, e);
    pos = dirOf(view.az, view.el).multiplyScalar(view.d).add(view.t);
    look = view.t.clone();
    grip = Math.min(1, grip + dt * 1.5);
    k = Math.max(k, grip * grip);
  } else if (m === "top") {
    const ext = portrait ? [1.2, 2.14] : [2.14, 1.2];
    pos = new THREE.Vector3(0, 1.12 * Math.max(ext[1] / 2 / tv, ext[0] / 2 / th), 0.0001);
    up = portrait ? new THREE.Vector3(att(vc), 0, 0) : new THREE.Vector3(0, 0, -1);
  } else {
    const h = home(vc),
      d = Math.max((1.35 * tan) / tv, 0.7 / th), // backs off when the HUD leaves less height
      el = (23 * Math.PI) / 180;
    pos = new THREE.Vector3(h * (1.0 + d * Math.cos(el)), d * Math.sin(el) + 0.12, 0);
    look.set(-h * 0.25, 0.02, 0);
  }
  last = m;
  cam.position.lerp(pos, k);
  S.look.lerp(look, k);
  cam.up.lerp(up, k).normalize();
  cam.lookAt(S.look);
}

const Y_MIN = 0.12,
  Y_MAX = 2.1,
  ROOM_X = 4.7,
  ROOM_Z = 3.5,
  EL_MIN = 0.12,
  EL_MAX = 1.5;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
/** keep a point on the table, or just off its edge */
function onTable(p: THREE.Vector3): THREE.Vector3 {
  return p.set(clamp(p.x, -1.15, 1.15), 0, clamp(p.z, -0.7, 0.7));
}
const dirOf = (az: number, el: number) =>
  new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
/** how far the camera can back away from `t` along `d` before it leaves the room. Looking steeply down the ceiling
 * is hidden (cafe/index.ts), so the camera may rise through it, as high as the top view: turning from the top view
 * then keeps the whole table in sight instead of diving to the ceiling. The lift fades in, so a tilt never jumps. */
function roomLimit(t: THREE.Vector3, d: THREE.Vector3): number {
  const lift = clamp((d.y - 0.88) / 0.09, 0, 1),
    top = Y_MAX + 4 * lift * lift * (3 - 2 * lift);
  let best = 99;
  for (const [o, v, lo, hi] of [
    [t.x, d.x, -ROOM_X, ROOM_X],
    [t.y, d.y, Y_MIN, top],
    [t.z, d.z, -ROOM_Z, ROOM_Z],
  ])
    if (v > 1e-6) best = Math.min(best, (hi - o) / v);
    else if (v < -1e-6) best = Math.min(best, (lo - o) / v);
  return Math.max(0.3, best);
}
/** the camera's distance right now: what you asked for, or less where a wall is in the way */
const freeDist = () => Math.min(camS.fdist, roomLimit(camS.target, dirOf(camS.faz, camS.fel)));

/** start the free view from wherever the camera is: it keeps looking where it looked */
export function toFree(): void {
  if (camS.mode === "free") return;
  const cam = S.camera.position,
    d = S.look.clone().sub(cam).normalize(),
    t = new THREE.Vector3();
  if (!(d.y < -0.05 && new THREE.Ray(cam.clone(), d).intersectPlane(CLOTH, t))) t.copy(S.look);
  onTable(t);
  const off = cam.clone().sub(t),
    up = S.camera.up;
  camS.target.copy(t);
  camS.fdist = off.length();
  const el = Math.asin(Math.min(1, off.y / camS.fdist));
  camS.fel = clamp(el, EL_MIN, EL_MAX);
  // straight down (the top view) has no side to stand on: keep what is up on screen, so nothing turns
  camS.faz = Math.hypot(off.x, off.z) < 0.05 * camS.fdist ? Math.atan2(-up.z, -up.x) : Math.atan2(off.z, off.x);
  camS.focus = null;
  camS.mode = "free";
  Object.assign(view, { az: camS.faz, el, d: camS.fdist });
  view.t.copy(t);
  grip = 1; // the view starts exactly where the camera is
  last = "free";
}
/** pick a view; during a replay it is the view the replay hands back to */
export function setView(m: "player" | "top"): void {
  if (camS.mode === "replay") camS.prev = m;
  else camS.mode = m;
}
/** turn round the point you look at: dx sideways, dy up and down */
export function orbitBy(dx: number, dy: number): void {
  camS.faz += dx * 0.006;
  camS.fel = clamp(camS.fel + dy * 0.005, EL_MIN, EL_MAX);
}
/** a right click: glide the point you look at to the spot under the pointer */
export function focusAt(e: { clientX: number; clientY: number }): void {
  const p = pointAt(e);
  if (p) camS.focus = onTable(p);
}
/** the point on the cloth under the pointer, kept inside the room */
function pointAt(e: { clientX: number; clientY: number }): THREE.Vector3 | null {
  const p = new THREE.Vector3();
  if (!rayAt(e).intersectPlane(CLOTH, p)) return null;
  p.x = clamp(p.x, -3, 3);
  p.z = clamp(p.z, -2.2, 2.2);
  return p;
}
/** zoom towards the point under the pointer: it stays under the pointer while everything closes in */
export function zoomAt(e: { clientX: number; clientY: number }, s: number): void {
  const p = pointAt(e);
  const cur = freeDist(),
    d = clamp(cur * s, 0.35, Math.max(4.5, cur)); // from the top view you may start further out: never jump in
  if (p)
    onTable(
      camS.target
        .sub(p)
        .multiplyScalar(d / cur)
        .add(p),
    );
  camS.fdist = d;
  camS.focus = null;
}
/** slide the point you look at across the table (middle-drag or shift + right-drag) */
export function panBy(dx: number, dy: number): void {
  const c = Math.cos(camS.faz),
    s = Math.sin(camS.faz),
    k = freeDist() * 0.0012;
  // forward along the cloth is (-c, -s), right is (s, -c)
  camS.target.x += -s * dx * k - c * dy * k;
  camS.target.z += c * dx * k - s * dy * k;
  onTable(camS.target);
  camS.focus = null;
}
/** looking down from high up (the lamps would be in the way) */
export function lookingDown(): boolean {
  const d = S.look.clone().sub(S.camera.position).normalize();
  return d.y < -0.87;
}
/** screen point to a point on the table plane (mm), or null */
export function toTable(e: { clientX: number; clientY: number }): { x: number; y: number } | null {
  const p = new THREE.Vector3();
  return rayAt(e).intersectPlane(BALLS, p) ? { x: p.x / M, y: p.z / M } : null;
}

/** the ball under the pointer from any angle, even with the camera down at the cloth: the nearest ball whose centre
 * the pointer's ray passes within `r` mm of, or -1. toTable alone misses there: the ray meets the ball plane far
 * behind a ball you click near its top. */
export function rayPick(e: { clientX: number; clientY: number }, pts: { x: number; y: number }[], r: number): number {
  const ray = rayAt(e),
    c = new THREE.Vector3();
  let best = -1,
    near = Infinity;
  pts.forEach((p, i) => {
    c.set(p.x * M, R * M, p.y * M);
    const t = c.clone().sub(ray.origin).dot(ray.direction);
    if (t > 0 && t < near && ray.distanceSqToPoint(c) < (r * M) ** 2) {
      near = t;
      best = i;
    }
  });
  return best;
}
