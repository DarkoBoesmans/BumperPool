// The spin pad: drag the dot to where the tip should hit the cue ball. Arrow keys work too, 0 resets.
import { $ } from "./dom";
import { t } from "../i18n";
import { app } from "./app";

const LABEL: Record<string, string> = {
  "1,0": "Follow",
  "-1,0": "Draw",
  "0,1": "Right english",
  "0,-1": "Left english",
  "1,1": "Follow, right english",
  "1,-1": "Follow, left english",
  "-1,1": "Draw, right english",
  "-1,-1": "Draw, left english",
};
function spinLabel(x: number, y: number): string {
  const v = y > 0.25 ? 1 : y < -0.25 ? -1 : 0,
    h = x > 0.25 ? 1 : x < -0.25 ? -1 : 0;
  if (!v && !h) return t(Math.hypot(x, y) < 0.15 ? "Centre ball" : "A touch off centre");
  return t(LABEL[`${v},${h}`]);
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
