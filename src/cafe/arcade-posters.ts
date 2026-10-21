// The arcade posters: a small one for legends night, and a big one that spells out the old code itself, key by key.
import type { BoardCtx } from "./boards-draw";
import { POSTER, LABEL, fit } from "./boards-draw";
import { t } from "../i18n";

type Ctx = CanvasRenderingContext2D | null;

/** a pixel arrow pointing up, rotated by `a` quarter turns */
function arrow(c: CanvasRenderingContext2D, x: number, y: number, s: number, a: number): void {
  c.save();
  c.translate(x, y);
  c.rotate((a * Math.PI) / 2);
  c.fillRect(-s * 0.2, -s * 0.1, s * 0.4, s * 0.6);
  c.beginPath();
  c.moveTo(-s * 0.5, 0);
  c.lineTo(0, -s * 0.5);
  c.lineTo(s * 0.5, 0);
  c.closePath();
  c.fill();
  c.restore();
}

/** an old arcade poster: three dark silhouettes and the code, in small print. Once they are in, it says so. */
export function drawKonami(c: Ctx, { pearl }: BoardCtx): string | void {
  if (!c) return pearl ? "konami-in" : "konami";
  const w = c.canvas.width,
    h = c.canvas.height;
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#1a0a2a");
  g.addColorStop(1, "#0a1a2a");
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 4) {
    c.fillStyle = "rgba(255,255,255,.03)";
    c.fillRect(0, y, w, 1);
  }
  c.textAlign = "center";
  c.fillStyle = "#ffd6f0";
  c.font = `24px ${POSTER}`;
  c.fillText(t("LEGENDS"), w / 2, 34);
  c.fillText(t("NIGHT"), w / 2, 60);
  // three figures: Neptune's crown, Minerva's crested helmet, Jupiter's laurel
  const cols = pearl ? ["#6af0ff", "#9aff6a", "#ffb04a"] : ["#2a2a3a", "#2a2a3a", "#2a2a3a"];
  [w * 0.25, w * 0.5, w * 0.75].forEach((x, i) => {
    c.fillStyle = cols[i];
    c.fillRect(x - 12, 108, 24, 34);
    c.beginPath();
    c.arc(x, 98, 11, 0, 7);
    c.fill();
    if (i === 0) for (const d of [-8, 0, 8]) c.fillRect(x + d - 2, 80, 4, 8);
    if (i === 1) c.fillRect(x - 2, 74, 4, 18); // the crest
    if (i === 2) for (const d of [-13, -9, 9, 13]) c.fillRect(x + d - 2, 88 + Math.abs(d) / 3, 4, 3); // the wreath
  });
  c.fillStyle = "rgba(255,240,220,.7)";
  c.font = `600 11px ${LABEL}`;
  c.fillText(t(pearl ? "THEY ARE IN TONIGHT" : "ONLY FOR THOSE WHO"), w / 2, 166);
  c.fillText(t(pearl ? "PEARLESCENT TABLE OPEN" : "KNOW THE OLD CODE"), w / 2, 180);
  // the code, in small print at the bottom
  c.fillStyle = pearl ? "#ffd6f0" : "rgba(255,214,240,.55)";
  const s = 12,
    y0 = h - 30;
  [0, 0, 2, 2, 3, 1, 3, 1].forEach((a, i) => arrow(c, 16 + i * 15, y0, s, a));
  c.font = `14px ${POSTER}`;
  c.fillText("B  A", w - 22, y0 + 5);
}

/** the old code, big: up up, down down, left right left right, B A, as keys and buttons on an arcade panel */
export function drawCode(c: Ctx, { pearl }: BoardCtx): string | void {
  if (!c) return pearl ? "code-in" : "code";
  const w = c.canvas.width,
    h = c.canvas.height,
    pink = "#ff5ab4",
    cyan = "#5ae6ff";
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#160822");
  g.addColorStop(1, "#06141e");
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 4) {
    c.fillStyle = "rgba(255,255,255,.035)";
    c.fillRect(0, y, w, 1);
  }
  // the title in neon, with a glow
  c.textAlign = "center";
  const title = t("THE OLD CODE");
  fit(c, title, (s) => `${s}px ${POSTER}`, 34, w - 24);
  c.shadowColor = pink;
  c.shadowBlur = 14;
  c.fillStyle = pink;
  c.fillText(title, w / 2, 44);
  c.shadowBlur = 0;
  c.fillStyle = "rgba(255,240,250,.8)";
  c.font = `600 11px ${LABEL}`;
  c.fillText(t(pearl ? "THE LEGENDS ARE IN" : "ON THE START SCREEN"), w / 2, 64);
  // the keys, row by row: a key cap with an arrow, or a round button
  const key = (x: number, y: number, a: number) => {
    c.fillStyle = "#1c2a3a";
    c.strokeStyle = cyan;
    c.lineWidth = 2;
    c.beginPath();
    c.roundRect(x - 19, y - 19, 38, 38, 6);
    c.fill();
    c.stroke();
    c.fillStyle = cyan;
    arrow(c, x, y + 2, 22, a);
  };
  const button = (x: number, y: number, label: string) => {
    c.fillStyle = "#c8203a";
    c.beginPath();
    c.arc(x, y, 22, 0, 7);
    c.fill();
    c.fillStyle = "rgba(255,255,255,.25)";
    c.beginPath();
    c.arc(x - 6, y - 7, 8, 0, 7);
    c.fill();
    c.fillStyle = "#fff";
    c.font = `26px ${POSTER}`;
    c.fillText(label, x, y + 9);
  };
  const rows: [number, number[]][] = [
    [104, [0, 0]],
    [152, [2, 2]],
    [200, [3, 1, 3, 1]],
  ];
  for (const [y, keys] of rows) keys.forEach((a, i) => key(w / 2 + (i - (keys.length - 1) / 2) * 46, y, a));
  button(w / 2 - 30, 256, "B");
  button(w / 2 + 30, 256, "A");
  c.fillStyle = "rgba(255,240,250,.7)";
  c.font = `600 10px ${LABEL}`;
  c.fillText(t("ON A PHONE: SWIPE, THEN TAP TWICE"), w / 2, h - 22);
}
