// The spin pad: drag the dot to where the tip should hit the cue ball. Arrow keys work too, 0 resets.
import { $, cap } from "./dom";
import { app } from "./app";

function spinLabel(x: number, y: number): string {
  const v = y > 0.25 ? "Follow" : y < -0.25 ? "Draw" : "",
    h = x > 0.25 ? "right" : x < -0.25 ? "left" : "";
  if (!v && !h) return Math.hypot(x, y) < 0.15 ? "Centre ball" : "A touch off centre";
  return v && h ? `${v}, ${h} english` : v || `${cap(h)} english`;
}
export function setSpin(x: number, y: number): void {
  const d = Math.hypot(x, y);
  if (d > 1) {
    x /= d;
    y /= d;
  }
  app.spin.x = x;
  app.spin.y = y;
  $("#spinDot").style.left = `${50 + x * 36}%`;
  $("#spinDot").style.top = `${50 - y * 36}%`;
  const t = spinLabel(x, y);
  $("#spinRead").textContent = t;
  $("#cueball").setAttribute("aria-valuetext", t);
}
export const nudgeSpin = (dx: number, dy: number): void => setSpin(app.spin.x + dx, app.spin.y + dy);
export const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [0, 0.2],
  ArrowDown: [0, -0.2],
  ArrowLeft: [-0.2, 0],
  ArrowRight: [0.2, 0],
};

export function initSpinPad(): void {
  const pad = $("#cueball");
  const at = (e: PointerEvent) => {
    const r = pad.getBoundingClientRect();
    setSpin(((e.clientX - r.left) / r.width - 0.5) / 0.36, -((e.clientY - r.top) / r.height - 0.5) / 0.36);
  };
  pad.addEventListener("pointerdown", (e) => {
    pad.setPointerCapture(e.pointerId);
    at(e);
  });
  pad.addEventListener("pointermove", (e) => {
    if (pad.hasPointerCapture(e.pointerId)) at(e);
  });
  pad.addEventListener("keydown", (e) => {
    const k = ARROWS[e.key];
    if (!k) return;
    e.preventDefault();
    nudgeSpin(k[0], k[1]);
  });
  $("#spinReset").addEventListener("click", () => setSpin(0, 0));
  setSpin(0, 0);
}
