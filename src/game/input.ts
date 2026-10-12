// Mouse, touch and keys. Left-drag a ball to aim and pull back. Right-drag turns the table, a right click looks at
// the spot you clicked, scroll zooms towards the pointer, middle-drag or shift + right-drag slides along the table.
// Touch: a finger on one of your balls aims, a finger on the cloth turns the table, two fingers pinch to zoom and
// slide, a tap looks at that spot once you have turned the table.
import { G, ball, other, fire, choosePen, R, GOAL_X, att } from "../core";
import type { Ball } from "../types";
import type { Drag } from "../ui/app";
import { S } from "../render/renderer";
import { camS, toFree, focusAt, zoomAt, panBy, orbitBy, toTable } from "../render/camera";
import { initAudio } from "../audio/mixer";
import { app, canAct } from "../ui/app";
import { $ } from "../ui/dom";
import { setSpin, nudgeSpin, ARROWS } from "../ui/spinpad";
import { shotFrom } from "./aiming";
import { setViewPills } from "./flow";
import { chalkShot, forgotKnock } from "./buzz";

export const blocked = (): boolean => !app.inGame || app.show || !$("#start").hidden || !$("#settings").hidden;

const fingers = new Map<number, { x: number; y: number }>();
/** two fingers down: their spread and middle. Stays set until every finger is up, so the last one does nothing. */
let pinch: { d: number; x: number; y: number } | null = null;
function spread(): { d: number; x: number; y: number } {
  const [a, b] = [...fingers.values()];
  return { d: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** the nearest point within `max` mm, or -1 */
function nearest(pts: { x: number; y: number }[], w: { x: number; y: number }, max: number): number {
  let best = -1;
  pts.forEach((p, i) => {
    const d = Math.hypot(p.x - w.x, p.y - w.y);
    if (d < max) {
      max = d;
      best = i;
    }
  });
  return best;
}

function startOrbit(e: PointerEvent, intro: boolean, pan = false): void {
  S.orbit = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, intro, pan };
  (e.target as HTMLElement).setPointerCapture(e.pointerId);
}

function onDown(e: PointerEvent): void {
  const touch = e.pointerType === "touch";
  if (touch) {
    fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (fingers.size > 1) {
      if (app.drag && !app.drag.cpu) app.drag = null; // a second finger lets go of the aim
      S.orbit = null;
      if (fingers.size === 2) pinch = spread();
      return;
    }
  }
  if (e.button === 2 || e.button === 1) {
    const intro = camS.mode === "intro";
    if (!intro) toFree();
    startOrbit(e, intro, e.button === 1 || e.shiftKey);
    e.preventDefault();
    return;
  }
  if (e.button !== 0) return;
  if (blocked()) {
    if (touch && camS.mode === "intro") startOrbit(e, true); // look round the start screen
    return;
  }
  initAudio();
  const w = toTable(e);
  if (!w) {
    if (touch) startOrbit(e, false);
    return;
  }
  // a finger needs more room than a mouse: 34 px round the touch, measured on the table
  const w2 = touch ? toTable({ clientX: e.clientX + 34, clientY: e.clientY }) : null,
    reach = w2 ? Math.hypot(w2.x - w.x, w2.y - w.y) : 0;
  if (G.phase === "penalty" && G.penChoice) {
    if (!canAct(other(ball(G.penChoice.id).c))) return;
    const i = nearest(G.penChoice.opts, w, Math.max(R * 1.8, reach));
    if (i >= 0) choosePen(i);
    return;
  }
  const cand = playable(),
    i = nearest(cand, w, Math.max(R * 2.4, reach));
  if (i >= 0) {
    app.drag = { id: cand[i].id, x: w.x, y: w.y, px: e.clientX, py: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  } else if (touch) startOrbit(e, false);
}

/** the balls you may shoot right now */
function playable(): Ball[] {
  let cand: Ball[] = [];
  if (G.phase === "aim" && canAct(G.turn)) cand = G.balls.filter((b) => b.on && b.c === G.turn && !b.stone);
  else if (G.phase === "openW" && canAct("W")) cand = [ball(G.open.ids.W)];
  else if (G.phase === "openR" && canAct("R")) cand = [ball(G.open.ids.R)];
  if (!cand.length && G.phase === "aim" && canAct(G.turn)) cand = G.balls.filter((b) => b.on && b.c === G.turn); // only stone left: play it anyway
  return cand;
}

/** shoot what is aimed: a knock you forgot is noted, chalk and a dry tip have their say */
function shoot(d: Drag): void {
  app.drag = null;
  const s = shotFrom(d);
  if (!s || s.p < 0.02 || blocked()) return;
  const c = ball(d.id).c;
  forgotKnock(c, G.mode === "cpu" ? G.names[1] : "Marcel");
  fire(d.id, chalkShot(c, s));
  setSpin(0, 0);
}

// Keyboard aiming: B picks one of your balls, A and D turn (Shift for fine steps), W and S set the power,
// Space shoots, Esc lets go. The aim is a direction and a power, so no pointer is needed.
const kb = { ang: 0, p: 0.3 };
function kbDrag(id: number): void {
  const b = ball(id);
  app.drag = { id, x: b.x - Math.cos(kb.ang) * R * 3, y: b.y - Math.sin(kb.ang) * R * 3, p: kb.p, kb: true };
}
function kbKey(e: KeyboardEvent): boolean {
  const d = app.drag?.kb ? app.drag : null,
    k = e.key.toLowerCase();
  if (k === "b" && !blocked()) {
    const cand = playable();
    if (!cand.length) return false;
    const i = d ? (cand.findIndex((b) => b.id === d.id) + 1) % cand.length : 0,
      b = cand[i];
    if (!d) kb.ang = Math.atan2(-b.y, att(b.c) * GOAL_X - b.x); // start aimed at the goal you attack
    kbDrag(b.id);
    return true;
  }
  if (!d) return false;
  const turn = e.shiftKey ? 0.004 : 0.03;
  if (k === "a") kb.ang -= turn;
  else if (k === "d") kb.ang += turn;
  else if (k === "w") kb.p = Math.min(1, kb.p + 0.025);
  else if (k === "s") kb.p = Math.max(0, kb.p - 0.025);
  else if (k === " " || k === "enter") {
    if ((e.target as HTMLElement).closest("button")) return false; // Space on a focused button presses the button
    shoot(d);
    return true;
  } else return false;
  kbDrag(d.id);
  return true;
}

function onMove(e: PointerEvent): void {
  if (fingers.has(e.pointerId)) {
    fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch) {
      if (fingers.size !== 2) return;
      const n = spread();
      if (camS.mode === "intro") camS.idist = Math.min(1.6, Math.max(0.5, (camS.idist * pinch.d) / n.d));
      else {
        toFree();
        zoomAt({ clientX: n.x, clientY: n.y }, pinch.d / n.d);
        panBy(n.x - pinch.x, n.y - pinch.y);
        setViewPills();
      }
      pinch = n;
      return;
    }
  }
  const o = S.orbit;
  if (o && !o.moved) {
    if (Math.hypot(e.clientX - o.sx, e.clientY - o.sy) < 5) return; // still a click
    o.moved = true;
    if (!o.intro) toFree();
  }
  if (o?.intro) {
    // the start screen: look around, it starts turning again by itself a moment after you let go
    camS.az += (e.clientX - o.x) * 0.006;
    camS.iel = Math.min(1.3, Math.max(0.05, camS.iel + (e.clientY - o.y) * 0.005));
    camS.hold = performance.now() + 2500;
    S.orbit = { ...o, x: e.clientX, y: e.clientY };
    return;
  }
  if (o?.pan) {
    panBy(e.clientX - o.x, e.clientY - o.y);
    S.orbit = { ...o, x: e.clientX, y: e.clientY };
    return;
  }
  if (o) {
    orbitBy(e.clientX - o.x, e.clientY - o.y);
    S.orbit = { ...o, x: e.clientX, y: e.clientY };
    setViewPills();
    return;
  }
  const d = app.drag;
  if (!d || d.cpu) return;
  const w = toTable(e);
  if (w) {
    d.x = w.x;
    d.y = w.y;
  }
  d.px = e.clientX;
  d.py = e.clientY;
}

/** a finger lifted: after two fingers nothing else happens until every finger is up */
function lift(e: PointerEvent): boolean {
  if (!fingers.delete(e.pointerId) || !pinch) return false;
  if (!fingers.size) pinch = null;
  return true;
}

function onUp(e: PointerEvent): void {
  if (lift(e)) return;
  const o = S.orbit;
  if (o) {
    S.orbit = null;
    // a tap only looks somewhere in the free view, so a stray touch never moves the camera
    if (!o.moved && !o.intro && !o.pan && (e.pointerType !== "touch" || camS.mode === "free")) focusAt(e);
    return;
  }
  const d = app.drag;
  if (!d || d.cpu || d.kb) return;
  shoot(d);
}

function onWheel(e: WheelEvent): void {
  e.preventDefault();
  if (camS.mode === "intro") {
    camS.idist = Math.min(1.6, Math.max(0.5, camS.idist * Math.pow(1.0015, e.deltaY)));
    return;
  }
  toFree();
  zoomAt(e, Math.pow(1.0015, e.deltaY));
  setViewPills();
}

export function wireInput(): void {
  const cv = S.renderer.domElement;
  cv.addEventListener("contextmenu", (e) => e.preventDefault());
  cv.addEventListener("pointerdown", onDown);
  cv.addEventListener("pointermove", onMove);
  cv.addEventListener("pointerup", onUp);
  cv.addEventListener("pointercancel", (e) => {
    lift(e);
    if (app.drag && !app.drag.cpu) app.drag = null;
    S.orbit = null;
  });
  cv.addEventListener("wheel", onWheel, { passive: false });
}

/** game keys: keyboard aiming, arrows set spin, 0 resets, T top view, P player view; 1 to 4 are wired in main.ts */
export function gameKey(e: KeyboardEvent): boolean {
  if (kbKey(e)) {
    e.preventDefault();
    return true;
  }
  const k = ARROWS[e.key];
  if (k && (e.target as HTMLElement).id !== "cueball") {
    e.preventDefault();
    nudgeSpin(k[0], k[1]);
  } else if (e.key === "0") setSpin(0, 0);
  else if (e.key === "t" || e.key === "T") {
    camS.mode = camS.mode === "top" ? "player" : "top";
    setViewPills();
  } else if (e.key === "p" || e.key === "P") {
    camS.mode = "player";
    setViewPills();
  } else return false;
  return true;
}
