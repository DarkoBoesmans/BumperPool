// A 32 x 32 pixel portrait, in the spirit of a PS2 character select. The background glows in the grade colour.
// The canvas is always square: the caller sizes it with CSS.
import { GRADES } from "../data/grades";
import type { Grade, Look } from "../types";

export interface Sitter {
  look: Look;
  habits?: { smoke: number };
  grade?: string;
}

export function paintPortrait(cv: HTMLCanvasElement, o: Sitter): void {
  const c = cv.getContext("2d")!,
    L = o.look,
    S = cv.width / 32,
    G: Grade = GRADES.find((g) => g.id === o.grade) || GRADES[0];
  const r = (x: number, y: number, w: number, h: number, col: string) => {
    c.fillStyle = col;
    c.fillRect(x * S, y * S, w * S, h * S);
  };
  r(0, 0, 32, 32, G.bg);
  const glow = c.createRadialGradient(16 * S, 12 * S, 2 * S, 16 * S, 12 * S, 22 * S);
  glow.addColorStop(0, G.color + "66");
  glow.addColorStop(1, G.color + "00");
  c.fillStyle = glow;
  c.fillRect(0, 0, 32 * S, 32 * S);
  if (G.id === "pearl") {
    const p = c.createLinearGradient(0, 0, 32 * S, 32 * S);
    ["#ffd6f0", "#c6f1ff", "#e9ffd8", "#fff1c6", "#d8d2ff"].forEach((col, i) => p.addColorStop(i / 4, col + "40"));
    c.fillStyle = p;
    c.fillRect(0, 0, 32 * S, 32 * S);
  }
  for (let y = 0; y < 32; y += 2) r(0, y, 32, 1, "rgba(0,0,0,.12)");
  const frame = L.frame || "straight",
    w = Math.round(8 * L.build * (frame === "broad" ? 1.1 : frame === "curvy" ? 0.92 : 1));
  // shoulders, collar, neck
  r(16 - w - 4, 26, 2 * w + 8, 6, L.shirt);
  if (L.pattern === "stripes") r(16 - w - 4, 28, 2 * w + 8, 1, L.trim);
  if (L.pattern === "check") for (let x = 16 - w - 4; x < 16 + w + 4; x += 3) r(x, 26, 1, 6, "rgba(0,0,0,.35)");
  if (L.pattern === "flowers") for (const x of [9, 20, 24]) r(x, 28, 2, 2, L.trim);
  r(14, 26, 4, 6, L.pattern === "tux" ? "#f4f0e8" : L.trim);
  if (L.necklace === "pearls") r(12, 25, 8, 1, "#f6f2ea");
  if (L.necklace === "chain") r(12, 25, 8, 1, "#f2c84a");
  if (L.bowtie) {
    r(13, 26, 2, 2, L.pattern === "tux" ? "#0a0a0a" : "#a3261d");
    r(17, 26, 2, 2, L.pattern === "tux" ? "#0a0a0a" : "#a3261d");
  }
  r(14, 21, 4, 5, L.skin);
  // long hair falls behind the shoulders
  const st = L.hairStyle;
  if (st === "long") r(9, 10, 14, 15, L.hair);
  if (st === "bob") r(9, 9, 14, 11, L.hair);
  if (st === "pony") {
    r(21, 10, 4, 11, L.hair);
    r(22, 20, 3, 4, L.hair);
  }
  if (st === "pigtails") {
    r(6, 12, 3, 8, L.hair);
    r(23, 12, 3, 8, L.hair);
  }
  // head, ears, eyes
  r(10, 9, 12, 13, L.skin);
  r(9, 13, 1, 4, L.skin);
  r(22, 13, 1, 4, L.skin);
  if (L.earrings === "studs") {
    r(9, 17, 1, 1, "#f2c84a");
    r(22, 17, 1, 1, "#f2c84a");
  }
  if (L.earrings === "hoops") {
    r(8, 17, 1, 3, "#f2c84a");
    r(23, 17, 1, 3, "#f2c84a");
  }
  if (L.eyeshadow) {
    r(12, 13, 2, 1, L.eyeshadow);
    r(18, 13, 2, 1, L.eyeshadow);
  }
  r(12, 14, 2, 2, L.eyes || "#1a120c");
  r(18, 14, 2, 2, L.eyes || "#1a120c");
  r(12, 14, 1, 1, "#fff");
  r(18, 14, 1, 1, "#fff");
  if (L.lashes) {
    r(11, 13, 1, 1, "#0a0606");
    r(20, 13, 1, 1, "#0a0606");
  }
  if (L.glasses === "round") {
    r(11, 13, 4, 4, "rgba(255,255,255,.18)");
    r(17, 13, 4, 4, "rgba(255,255,255,.18)");
    r(15, 14, 2, 1, "#222");
  }
  if (L.glasses === "shades") {
    r(11, 13, 10, 3, "#0a0a0c");
    r(12, 13, 2, 1, "#5a5a6a");
  }
  if (L.blush) {
    r(11, 17, 2, 1, "rgba(220,60,60,.55)");
    r(19, 17, 2, 1, "rgba(220,60,60,.55)");
  }
  r(15, 16, 2, 2, "rgba(0,0,0,.18)"); // nose
  r(13, 19, 6, L.lips ? 2 : 1, L.lips || "#7a3a2a"); // mouth
  const f = L.facial || "none";
  if (f === "stubble") r(11, 18, 10, 4, "rgba(40,30,20,.3)");
  if (f === "stache" || f === "beard") r(12, 18, 8, 1, L.hair);
  if (f === "beard") {
    r(10, 19, 12, 3, L.hair);
    r(12, 22, 8, 1, L.hair);
    r(13, 19, 6, 1, "#7a3a2a");
  }
  if (f === "goatee") r(14, 20, 4, 3, L.hair);
  hairTop(r, L);
  hat(r, L);
  if ((o.habits?.smoke || 0) > 0.5) {
    r(19, 19, 6, 1, "#6b4a2b");
    r(25, 19, 1, 1, "#ff7a2a");
    r(25, 16, 1, 2, "rgba(220,220,220,.4)");
    r(26, 13, 1, 3, "rgba(220,220,220,.25)");
  }
}

type Rect = (x: number, y: number, w: number, h: number, col: string) => void;

function hairTop(r: Rect, L: Look): void {
  const h = L.hair;
  switch (L.hairStyle) {
    case "bald":
      return;
    case "buzz":
      r(10, 8, 12, 2, "rgba(30,20,10,.45)");
      return;
    case "mohawk":
      r(14, 4, 4, 6, h);
      return;
    case "perm":
    case "curly":
      r(8, 6, 16, 5, h);
      r(7, 9, 3, 7, h);
      r(22, 9, 3, 7, h);
      r(10, 5, 12, 2, h);
      return;
    case "bun":
      r(10, 7, 12, 3, h);
      r(13, 3, 6, 4, h);
      r(9, 9, 2, 5, h);
      r(21, 9, 2, 5, h);
      return;
    case "quiff":
      r(10, 7, 12, 3, h);
      r(11, 5, 8, 2, h);
      return;
    case "side":
      r(10, 7, 12, 3, h);
      r(10, 9, 5, 1, h);
      return;
    default:
      r(10, 7, 12, 3, h);
      r(9, 9, 1, 3, h);
      r(22, 9, 1, 3, h);
  }
}

function hat(r: Rect, L: Look): void {
  const h = L.hatColor || L.hair;
  switch (L.hat) {
    case "cap":
      r(9, 6, 14, 4, h);
      r(20, 8, 6, 2, h);
      r(10, 9, 12, 1, "rgba(0,0,0,.25)");
      break;
    case "flatcap":
      r(9, 6, 15, 4, h);
      r(8, 9, 17, 1, h);
      break;
    case "fedora":
      r(11, 3, 10, 6, h);
      r(7, 8, 18, 2, h);
      r(11, 7, 10, 1, "#5a1a1a");
      break;
    case "tophat":
      r(11, 0, 10, 8, h);
      r(8, 8, 16, 2, h);
      r(11, 6, 10, 1, "#7a1a1a");
      break;
    case "cowboy":
      r(11, 2, 10, 6, h);
      r(5, 7, 22, 2, h);
      r(4, 6, 2, 2, h);
      r(26, 6, 2, 2, h);
      r(11, 6, 10, 1, "#6a4a2a");
      break;
    case "beanie":
      r(9, 5, 14, 5, h);
      r(9, 9, 14, 1, "rgba(255,255,255,.12)");
      r(15, 4, 2, 1, h);
      break;
    case "beret":
      r(9, 6, 14, 4, h);
      r(8, 8, 4, 2, h);
      r(15, 5, 2, 1, h);
      break;
    case "headband":
      r(10, 9, 12, 2, h);
      break;
    case "bandana":
      r(9, 6, 14, 4, h);
      r(22, 8, 3, 3, h);
      break;
    case "crown":
      r(10, 4, 12, 3, h);
      for (const x of [10, 13, 16, 19, 21]) r(x, 2, 1, 2, h);
      r(15, 5, 2, 1, "#d23a4a");
      break;
    case "helmet":
      r(9, 5, 14, 5, h);
      r(15, 1, 2, 5, "#b8322a");
      r(8, 9, 2, 5, h);
      r(22, 9, 2, 5, h);
      break;
    case "laurel":
      for (const [x, y] of [
        [8, 9],
        [9, 7],
        [11, 6],
        [13, 5],
        [18, 5],
        [20, 6],
        [22, 7],
        [23, 9],
      ])
        r(x, y, 2, 1, h);
      break;
    case "snakes":
      for (const [x, y] of [
        [8, 7],
        [11, 4],
        [14, 3],
        [17, 3],
        [20, 4],
        [23, 7],
        [7, 11],
        [24, 11],
      ]) {
        r(x, y, 2, 4, h);
        r(x, y, 1, 1, "#e8ff4a");
      }
      r(10, 7, 12, 3, h);
      break;
  }
}
