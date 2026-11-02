// Mouse, touch and keys. Drag one of your balls to aim and pull back. Drag anywhere else on the table (or right-drag
// anywhere) to turn it, a right click looks at the spot you clicked, scroll or pinch zooms towards the pointer,
// middle-drag or shift + drag slides along the table. Touch: a finger on the cloth turns the table, two fingers pinch
// to zoom and slide, a tap looks at that spot once you have turned the table. The keys are in keys.ts. The camera
// keeps still while a replay plays: the replay has it.
import { G, ball, other, fire, choosePen, R } from "../core";
import type { Ball } from "../types";
import type { Drag } from "../ui/app";
import { S } from "../render/renderer";
import { camS, toFree, focusAt, zoomAt, panBy, orbitBy, toTable, rayPick } from "../render/camera";
import { initAudio } from "../audio/mixer";
import { app, canAct } from "../ui/app";
import { $ } from "../ui/dom";
import { setSpin } from "../ui/spinpad";
import { shotFrom } from "./aiming";
import { coachDid } from "../ui/coach";
import { tapOpen } from "../ui/tap";
import { setViewPills } from "./flow";
import { chalkShot, forgotKnock } from "./buzz";

export const blocked = (): boolean =>
  !app.inGame || app.show || !$("#start").hidden || !$("#settings").hidden || tapOpen();

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

/** `tap`: a click without a drag looks at that spot (a right click, or a tap on a phone) */
function startOrbit(e: PointerEvent, intro: boolean, pan = false, tap = true): void {
  S.orbit = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, intro, pan, tap };
  (e.target as HTMLElement).setPointerCapture(e.pointerId);
}
export const replaying = (): boolean => camS.mode === "replay";

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
    if (replaying()) return;
    const intro = camS.mode === "intro";
    if (!intro) toFree();
    startOrbit(e, intro, e.button === 1 || e.shiftKey);
    e.preventDefault();
    return;
  }
  if (e.button !== 0) return;
  if (blocked()) {
    if (camS.mode === "intro") startOrbit(e, true); // look round the start screen
    return;
  }
  initAudio();
  const w = toTable(e),
    cand = playable(),
    hit = rayPick(e, cand, R * (touch ? 2.2 : 1.5)); // a ball under the pointer, from any camera angle
  if (hit >= 0 && G.phase !== "penalty") {
    const b = cand[hit];
    app.drag = { id: b.id, x: w?.x ?? b.x, y: w?.y ?? b.y, px: e.clientX, py: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
    return;
  }
  // nothing of yours under the pointer: the drag turns the table (a mouse click alone does nothing, it may have missed)
  const turn = () => !replaying() && startOrbit(e, false, e.shiftKey, touch);
  if (!w) {
    turn();
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
  const i = nearest(cand, w, Math.max(R * 2.4, reach));
  if (i >= 0) {
    app.drag = { id: cand[i].id, x: w.x, y: w.y, px: e.clientX, py: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  } else turn();
}

/** the balls you may shoot right now */
export function playable(): Ball[] {
  let cand: Ball[] = [];
  if (G.phase === "aim" && canAct(G.turn)) cand = G.balls.filter((b) => b.on && b.c === G.turn && !b.stone);
  else if (G.phase === "openW" && canAct("W")) cand = [ball(G.open.ids.W)];
  else if (G.phase === "openR" && canAct("R")) cand = [ball(G.open.ids.R)];
  if (!cand.length && G.phase === "aim" && canAct(G.turn)) cand = G.balls.filter((b) => b.on && b.c === G.turn); // only stone left: play it anyway
  return cand;
}

/** shoot what is aimed: a knock you forgot is noted, chalk and a dry tip have their say */
export function shoot(d: Drag): void {
  app.drag = null;
  const s = shotFrom(d);
  if (!s || s.p < 0.02 || blocked()) return;
  const c = ball(d.id).c;
  forgotKnock(c, G.mode === "cpu" ? G.names[1] : "Marcel");
  fire(d.id, chalkShot(c, s));
  setSpin(0, 0);
}

function onMove(e: PointerEvent): void {
  if (fingers.has(e.pointerId)) {
    fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch) {
      if (fingers.size !== 2) return;
      const n = spread();
      if (camS.mode === "intro") camS.idist = Math.min(1.6, Math.max(0.5, (camS.idist * pinch.d) / n.d));
      else if (!replaying()) {
        toFree();
        zoomAt({ clientX: n.x, clientY: n.y }, pinch.d / n.d);
        panBy(n.x - pinch.x, n.y - pinch.y);
        if (Math.abs(n.d - pinch.d) > 1) coachDid("zoom");
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
    if (e.pointerType === "mouse") point(e);
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
    coachDid("turn");
    S.orbit = { ...o, x: e.clientX, y: e.clientY };
    setViewPills();
    return;
  }
  const d = app.drag;
  if (!d || d.cpu) {
    if (e.pointerType === "mouse") point(e);
    return;
  }
  const w = toTable(e);
  if (w) {
    d.x = w.x;
    d.y = w.y;
  }
  d.px = e.clientX;
  d.py = e.clientY;
}

/** the mouse pointer says what a drag does here: grab turns the table, a crosshair over a ball you may shoot */
function point(e: PointerEvent): void {
  const cv = e.target as HTMLElement,
    cand = blocked() ? [] : playable(),
    w = cand.length ? toTable(e) : null,
    aim = cand.length > 0 && (rayPick(e, cand, R * 1.5) >= 0 || (!!w && nearest(cand, w, R * 2.4) >= 0)),
    c = S.orbit ? "grabbing" : aim ? "aim" : "grab";
  if (cv.dataset.cursor !== c) cv.dataset.cursor = c;
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
    if (e.pointerType === "mouse") point(e);
    // a tap only looks somewhere in the free view, so a stray touch never moves the camera
    if (!o.moved && o.tap && !o.intro && !o.pan && (e.pointerType !== "touch" || camS.mode === "free")) {
      focusAt(e);
      coachDid("look");
    }
    return;
  }
  const d = app.drag;
  if (!d || d.cpu || d.kb) return;
  shoot(d);
}

function onWheel(e: WheelEvent): void {
  e.preventDefault();
  if (replaying()) return;
  // lines (some mice in Firefox) and pages count as pixels; a touchpad pinch comes as small steps with Ctrl held
  const px = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1),
    s = Math.pow(e.ctrlKey ? 1.01 : 1.0015, Math.max(-200, Math.min(200, px)));
  if (camS.mode === "intro") {
    camS.idist = Math.min(1.6, Math.max(0.5, camS.idist * s));
    return;
  }
  toFree();
  zoomAt(e, s);
  coachDid("zoom");
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
