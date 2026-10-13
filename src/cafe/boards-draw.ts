// The live boards: tonight's score, the foul book and the house rules. The signs are in boards-signs.ts.
import type { Game, Opponent } from "../types";
import type { Venue } from "../data/venues";
import type { Shame } from "../profile/profile";
import { t, tLog } from "../i18n";
import { rnd } from "./state";

export interface BoardCtx {
  G: Game | null;
  opp: Opponent | null;
  turnName: string;
  venue: Venue;
  shame: Shame[];
  pearl: boolean;
}
export const CHALK = '"Permanent Marker", "Comic Sans MS", cursive',
  POSTER = "Anton, Impact, sans-serif",
  LABEL = '"Chakra Petch", sans-serif';

export function chalkBg(c: CanvasRenderingContext2D, w: number, h: number): void {
  c.fillStyle = "#1e2723";
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) {
    c.fillStyle = `rgba(230,235,225,${rnd(0.01, 0.04)})`;
    c.beginPath();
    c.ellipse(rnd(0, w), rnd(0, h), rnd(10, 60), rnd(4, 16), rnd(0, 3), 0, 7);
    c.fill();
  }
}
/** shrink the font until the text fits */
export function fit(
  c: CanvasRenderingContext2D,
  text: string,
  font: (s: number) => string,
  size: number,
  maxW: number,
): number {
  let s = size;
  c.font = font(s);
  while (c.measureText(text).width > maxW && s > 10) {
    s -= 2;
    c.font = font(s);
  }
  return s;
}
function wrap(c: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number): void {
  let line = "";
  for (const wd of text.split(" ")) {
    const next = line ? line + " " + wd : wd;
    if (c.measureText(next).width > maxW && line) {
      c.fillText(line, x, y);
      y += lh;
      line = wd;
    } else line = next;
  }
  c.fillText(line, x, y);
}
const lastFoul = (G: Game) => [...G.log].reverse().find((e) => e.kind === "fout");

export function drawScore(c: CanvasRenderingContext2D | null, { G, turnName }: BoardCtx): string | void {
  if (!c)
    return G
      ? JSON.stringify([G.names, G.colorOf, G.wins, G.manche, G.balls.map((b) => b.on), G.turn, G.phase, turnName])
      : "none";
  const w = c.canvas.width,
    h = c.canvas.height;
  chalkBg(c, w, h);
  c.fillStyle = "rgba(244,240,228,.92)";
  c.strokeStyle = "rgba(244,240,228,.8)";
  c.textBaseline = "alphabetic";
  if (!G) return;
  c.font = `46px ${CHALK}`;
  c.textAlign = "center";
  c.fillText(t("TONIGHT · GAME {n}", { n: G.manche }), w / 2, 62);
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(60, 80);
  c.lineTo(w - 60, 84);
  c.stroke();
  for (const p of [0, 1]) {
    const col = G.colorOf[p],
      y = 160 + p * 130,
      inn = G.balls.filter((b) => b.c === col && !b.on).length;
    c.textAlign = "left";
    fit(c, G.names[p].toUpperCase(), (s) => `${s}px ${CHALK}`, 48, 300);
    c.fillStyle = col === "W" ? "#f4f0e4" : "#ff8c7a";
    c.fillText(G.names[p].toUpperCase(), 40, y);
    c.fillStyle = "rgba(244,240,228,.92)";
    for (let i = 0; i < 5; i++) {
      const x = 360 + i * 48;
      c.strokeRect(x, y - 38, 36, 36);
      if (i < inn) {
        c.beginPath();
        c.moveTo(x + 4, y - 18);
        c.lineTo(x + 15, y - 6);
        c.lineTo(x + 34, y - 44);
        c.stroke();
      }
    }
    c.font = `30px ${CHALK}`;
    c.fillText("★".repeat(G.wins[p]) || "-", 40, y + 40);
    if (G.turn === col && !/End/.test(G.phase)) {
      c.textAlign = "right";
      c.fillStyle = "#ffd46a";
      c.fillText("← " + t("ON THE CUE"), w - 30, y + 40);
    }
  }
  c.textAlign = "center";
  c.font = `26px ${CHALK}`;
  c.fillStyle = "rgba(244,240,228,.7)";
  c.fillText(t("best of three · first to sink five"), w / 2, h - 24);
}

export function drawFoulBook(c: CanvasRenderingContext2D | null, { G }: BoardCtx): string | void {
  const lf = G && lastFoul(G);
  if (!c)
    return G ? JSON.stringify([G.names, G.colorOf, G.log.filter((e) => e.kind === "fout").length, lf?.n]) : "none";
  const w = c.canvas.width,
    h = c.canvas.height;
  c.fillStyle = "#e9dcb8";
  c.fillRect(0, 0, w, h);
  c.strokeStyle = "rgba(70,110,170,.35)";
  c.lineWidth = 1;
  for (let y = 74; y < h; y += 26) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(w, y);
    c.stroke();
  }
  c.strokeStyle = "rgba(200,40,40,.6)";
  c.beginPath();
  c.moveTo(34, 0);
  c.lineTo(34, h);
  c.stroke();
  c.fillStyle = "#1d140c";
  c.font = `46px ${POSTER}`;
  c.textAlign = "center";
  c.fillText(t("FOUL BOOK"), w / 2, 56);
  if (!G) return;
  for (const p of [0, 1]) {
    const col = G.colorOf[p],
      f = G.log.filter((e) => e.kind === "fout" && e.c === col).length,
      y = 120 + p * 92;
    c.textAlign = "left";
    c.fillStyle = "#1d140c";
    fit(c, G.names[p], (s) => `${s}px ${CHALK}`, 30, w - 60);
    c.fillText(G.names[p], 44, y);
    c.strokeStyle = "#a3261d";
    c.lineWidth = 4;
    for (let i = 0; i < f; i++) {
      const gx = 48 + Math.floor(i / 5) * 62,
        k = i % 5;
      c.beginPath();
      if (k < 4) {
        c.moveTo(gx + k * 11, y + 14);
        c.lineTo(gx + k * 11 + 2, y + 50);
      } else {
        c.moveTo(gx - 6, y + 44);
        c.lineTo(gx + 44, y + 18);
      }
      c.stroke();
    }
    if (!f) {
      c.fillStyle = "#5a7a3a";
      c.font = `24px ${CHALK}`;
      c.fillText(t("clean"), 48, y + 42);
    }
  }
  if (lf) {
    c.fillStyle = "#a3261d";
    c.font = `21px ${CHALK}`;
    c.textAlign = "left";
    wrap(c, t("Last: {text}", { text: tLog(lf.text, lf.v) }), 44, h - 82, w - 60, 26);
  }
}

const RULES: [string, string][] = [
  ["open", "Open off your left cushion"],
  ["own", "Never your own ball first"],
  ["hard", "No hard shots at goal from the corners"],
  ["fly", "No flyers along the cushion"],
  ["tri small", "No parking in the big triangle"],
  ["frame", "Last ball? Leave your frame"],
  ["wrong", "Wrong goal never counts"],
  ["time", "One minute per shot"],
  ["", "The landlady is always right"],
];
export function drawRules(c: CanvasRenderingContext2D | null, { G }: BoardCtx): string | void {
  const lf = G?.lastShot?.foul?.key || "";
  if (!c) return "r" + lf;
  const w = c.canvas.width;
  c.fillStyle = "#efe4c8";
  c.fillRect(0, 0, w, c.canvas.height);
  c.fillStyle = "#23402f";
  c.fillRect(10, 10, w - 20, 70);
  c.fillStyle = "#efe4c8";
  c.font = `44px ${POSTER}`;
  c.textAlign = "center";
  c.fillText(t("HOUSE RULES"), w / 2, 62);
  c.textAlign = "left";
  RULES.forEach(([k, en], i) => {
    const line = t(en);
    const y = 108 + i * 31;
    c.fillStyle = "#c8452c";
    c.font = `26px ${POSTER}`;
    c.fillText(String(i + 1), 18, y);
    c.fillStyle = "#1d140c";
    fit(c, line, (s) => `600 ${s}px ${LABEL}`, 19, w - 60);
    c.fillText(line, 44, y);
    if (k && k.split(" ").includes(lf)) {
      c.strokeStyle = "#d0201a";
      c.lineWidth = 4;
      c.beginPath();
      c.ellipse(w / 2 + 8, y - 8, w / 2 - 8, 22, -0.03, 0, 7);
      c.stroke();
      c.fillStyle = "#d0201a";
      c.font = `30px ${CHALK}`;
      c.fillText("!!", w - 34, y - 14);
    }
  });
}
