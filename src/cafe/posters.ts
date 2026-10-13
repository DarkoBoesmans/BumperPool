// Posters: the tjoepbiljart print, whisky and cigar ads, a small arcade poster that knows the old code,
// and the Wall of Shame for everyone who crawled under the table.
import type { BoardCtx } from "./boards-draw";
import { CHALK, POSTER, LABEL, chalkBg, fit } from "./boards-draw";
import { t } from "../i18n";

type Ctx = CanvasRenderingContext2D | null;

export function drawArtPoster(c: Ctx): string | void {
  if (!c) return "art";
  const w = c.canvas.width,
    h = c.canvas.height;
  c.fillStyle = "#e6d8b8";
  c.fillRect(0, 0, w, h);
  c.fillStyle = "#23402f";
  c.fillRect(12, 12, w - 24, h - 24);
  c.fillStyle = "#e6d8b8";
  c.beginPath();
  c.arc(w * 0.62, h * 0.47, w * 0.27, 0, 7);
  c.fill();
  c.fillStyle = "#c8452c";
  c.beginPath();
  c.arc(w * 0.36, h * 0.6, w * 0.2, 0, 7);
  c.fill();
  for (const [x, y] of [
    [0.22, 0.78],
    [0.5, 0.82],
    [0.78, 0.78],
  ]) {
    c.fillStyle = "#141010";
    c.fillRect(w * x - 5, h * y - 30, 10, 30);
    c.fillStyle = "#b3392c";
    c.fillRect(w * x - 8, h * y - 26, 16, 6);
  }
  c.fillStyle = "#e6d8b8";
  c.font = `40px ${POSTER}`;
  c.textAlign = "left";
  c.fillText("TJOEP", 26, 60); // the game's name: never translated
  c.fillText("BILJART", 26, 100);
  c.fillStyle = "#c8452c";
  c.font = `600 13px ${LABEL}`;
  c.fillText(t("TAP BILLIARDS · SINCE 1932"), 28, 122);
  c.strokeStyle = "#c8452c";
  c.lineWidth = 2;
  c.strokeRect(26, h - 58, 92, 32);
  c.font = `20px ${POSTER}`;
  c.fillText("5 V 5", 46, h - 34);
}

export function drawWhisky(c: Ctx): string | void {
  if (!c) return "whisky";
  const w = c.canvas.width,
    h = c.canvas.height;
  c.fillStyle = "#1c0f08";
  c.fillRect(0, 0, w, h);
  const g = c.createRadialGradient(w / 2, h * 0.5, 10, w / 2, h * 0.5, w * 0.6);
  g.addColorStop(0, "rgba(240,160,50,.55)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  c.fillStyle = "#d8a04a";
  c.fillRect(w * 0.38, h * 0.32, w * 0.24, h * 0.36);
  c.fillRect(w * 0.45, h * 0.2, w * 0.1, h * 0.13);
  c.fillStyle = "#f2e6c8";
  c.fillRect(w * 0.4, h * 0.44, w * 0.2, h * 0.12);
  c.fillStyle = "#f2c86a";
  c.font = `34px ${POSTER}`;
  c.textAlign = "center";
  c.fillText(t("MARCEL'S"), w / 2, 52);
  c.fillText(t("RESERVE"), w / 2, 88);
  c.fillStyle = "#e6d8b8";
  c.font = `600 13px ${LABEL}`;
  c.fillText(t("THE HOUSE WHISKY"), w / 2, h - 46);
  c.fillText(t("as smooth as a soft shot"), w / 2, h - 26);
}

export function drawCigarAd(c: Ctx): string | void {
  if (!c) return "cigar";
  const w = c.canvas.width,
    h = c.canvas.height;
  c.fillStyle = "#8a1f1a";
  c.fillRect(0, 0, w, h);
  c.strokeStyle = "#f2c86a";
  c.lineWidth = 4;
  c.strokeRect(10, 10, w - 20, h - 20);
  c.save();
  c.translate(w / 2, h * 0.55);
  c.rotate(-0.3);
  c.fillStyle = "#5a3218";
  c.fillRect(-w * 0.36, -12, w * 0.72, 24);
  c.fillStyle = "#f2c86a";
  c.fillRect(-w * 0.1, -13, 26, 26);
  c.fillStyle = "#ff6a1a";
  c.fillRect(w * 0.36 - 4, -12, 6, 24);
  c.restore();
  c.fillStyle = "rgba(240,230,220,.4)";
  for (let i = 0; i < 6; i++) {
    c.beginPath();
    c.arc(w * 0.82 + Math.sin(i) * 10, h * 0.42 - i * 22, 10 + i * 3, 0, 7);
    c.fill();
  }
  c.fillStyle = "#f2c86a";
  c.font = `42px ${POSTER}`;
  c.textAlign = "center";
  c.fillText(t("SLOW BURN"), w / 2, 70);
  c.fillStyle = "#f6ead0";
  c.font = `600 14px ${LABEL}`;
  c.fillText(t("ROLLED IN THE BACK ROOM"), w / 2, 96);
  c.fillText(t("FOR THE LONG GAME"), w / 2, h - 30);
}

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

/** chalkboard: everyone who crawled under the table, newest first */
export function drawShame(c: Ctx, { shame }: BoardCtx): string | void {
  if (!c) return "shame" + shame.length + (shame[0]?.at || "");
  const w = c.canvas.width,
    h = c.canvas.height;
  chalkBg(c, w, h);
  c.textAlign = "center";
  c.fillStyle = "#ff8c7a";
  c.font = `30px ${CHALK}`;
  c.fillText(t("WALL OF"), w / 2, 40);
  c.fillText(t("SHAME"), w / 2, 72);
  c.fillStyle = "rgba(244,240,228,.7)";
  c.font = `13px ${CHALK}`;
  c.fillText(t("crawled under the table"), w / 2, 92);
  c.strokeStyle = "rgba(244,240,228,.6)";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(20, 102);
  c.lineTo(w - 20, 104);
  c.stroke();
  if (!shame.length) {
    c.fillStyle = "rgba(244,240,228,.8)";
    c.font = `17px ${CHALK}`;
    c.fillText(t("Nobody yet."), w / 2, 150);
    c.fillText(t("Keep it that way."), w / 2, 174);
    return;
  }
  c.textAlign = "left";
  shame.slice(0, 7).forEach((e, i) => {
    const y = 132 + i * 30;
    c.fillStyle = "#f4f0e4";
    fit(c, e.who.toUpperCase(), (s) => `${s}px ${CHALK}`, 19, w - 40);
    c.fillText(e.who.toUpperCase(), 18, y);
    c.fillStyle = "rgba(244,240,228,.55)";
    c.font = `11px ${CHALK}`;
    c.fillText(t("5-0 by {name}", { name: e.by }), 18, y + 12);
  });
}
