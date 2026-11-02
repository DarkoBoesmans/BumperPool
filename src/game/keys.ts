// The keyboard in a game. Aiming without a pointer: B picks one of your balls, A and D turn (Shift for fine steps),
// W and S set the power, Space shoots, Esc lets go. The camera: Q and E turn, R and F tilt, + and - zoom, T is the top
// view, P puts you back behind your end. Arrows set the spin, 0 resets it. 1 to 4 (the emotes) are wired in main.ts.
import { G, ball, R, GOAL_X, att, powerOf } from "../core";
import { camS, toFree, zoomAt, orbitBy, setView } from "../render/camera";
import { app } from "../ui/app";
import { setSpin, nudgeSpin, ARROWS } from "../ui/spinpad";
import { setViewPills } from "./flow";
import { blocked, playable, shoot, replaying } from "./input";
import { coachDid } from "../ui/coach";

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
    if (!d && G.phase !== "aim") {
      // the opening (SP/5.1): softly off your own left cushion, as the referee asks
      kb.ang = Math.atan2((b.c === "W" ? -1 : 1) * Math.sin(0.35), att(b.c) * Math.cos(0.35));
      kb.p = powerOf(800);
    } else if (!d) kb.ang = Math.atan2(-b.y, att(b.c) * GOAL_X - b.x); // start aimed at the goal you attack
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

/** Q and E turn, R and F tilt, + and - zoom towards the middle of the screen */
function camKey(k: string): boolean {
  const turn: Record<string, [number, number]> = { q: [-40, 0], e: [40, 0], r: [0, -40], f: [0, 40] };
  const z = k === "-" || k === "_" ? 1.15 : k === "+" || k === "=" ? 1 / 1.15 : 0;
  if (!turn[k] && !z) return false;
  if (replaying()) return true;
  toFree();
  if (z) zoomAt({ clientX: innerWidth / 2, clientY: innerHeight / 2 }, z);
  else orbitBy(...turn[k]);
  coachDid(z ? "zoom" : "turn");
  setViewPills();
  return true;
}

/** game keys: keyboard aiming, the camera keys, arrows set spin, 0 resets, T top view, P player view; 1 to 4 are
 * wired in main.ts */
export function gameKey(e: KeyboardEvent): boolean {
  if (kbKey(e)) {
    e.preventDefault();
    return true;
  }
  if (!e.ctrlKey && !e.metaKey && !e.altKey && camKey(e.key.toLowerCase())) {
    e.preventDefault();
    return true;
  }
  const k = ARROWS[e.key];
  if (k && (e.target as HTMLElement).id !== "cueball") {
    e.preventDefault();
    nudgeSpin(k[0], k[1]);
  } else if (e.key === "0") setSpin(0, 0);
  else if (e.key === "t" || e.key === "T") {
    setView(camS.mode === "top" || (camS.mode === "replay" && camS.prev === "top") ? "player" : "top");
    setViewPills();
  } else if (e.key === "p" || e.key === "P") {
    setView("player");
    setViewPills();
  } else return false;
  return true;
}
