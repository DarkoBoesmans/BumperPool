// The cloth: lines, marks and the baked lamp light, drawn on a canvas. The tutorial draws its pictures with the same code.
import { THREE, basic, flat } from "./three";
import { S } from "./renderer";
import {
  R,
  DOP_R,
  HX,
  HY,
  GOAL_X,
  GOAL_R,
  LIP_R,
  LIP_SPAN,
  DD_X,
  DD_Y,
  DOPS,
  VL,
  VLIEG,
  QUART,
  KLEIN_TOP,
  START,
  COLORS,
  home,
  spots,
} from "../core/table";
import type { Color, Point, Spot } from "../types";

export interface Mark extends Point {
  r: number;
  color: string;
  w?: number;
  dash?: number[];
}
export interface Arrow {
  pts: [number, number][];
  bad?: boolean;
  alt?: boolean;
  cross?: [number, number];
}
export interface ClothOpts {
  felt?: string;
  noise?: HTMLCanvasElement;
  light?: HTMLCanvasElement;
  lines?: boolean;
  /** drawn on the 3D table: the holes and posts are real geometry there */
  three?: boolean;
  zone?: "stootlijn" | "vlieg" | "triangle" | "goals" | "penalty" | "power";
  marks?: Mark[];
  pens?: Spot[];
  arrows?: Arrow[];
  balls?: (Point & { c: Color })[];
}

export function drawTable(c: CanvasRenderingContext2D, o: ClothOpts = {}): void {
  const L = (a: number, b: number, d: number, e: number) => {
    c.beginPath();
    c.moveTo(a, b);
    c.lineTo(d, e);
    c.stroke();
  };
  const ring = (x: number, y: number, r: number) => {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
  };
  const poly = (pts: number[][], fill: string) => {
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  };
  const U = (u: number, v: number) => [HX - u, v];
  const k = c.getTransform().a,
    lw = Math.max(3, 1.4 / k);
  c.fillStyle = o.felt || "#1d6a63";
  c.fillRect(-HX, -HY, 2 * HX, 2 * HY);
  if (o.noise) c.drawImage(o.noise, -HX, -HY, 2 * HX, 2 * HY);
  if (o.zone === "stootlijn") {
    poly([U(0, -HY), U(HX, -HY), U(KLEIN_TOP, 0), U(HX, HY), U(0, HY)], "rgba(208,81,58,.5)");
    poly([U(0, -DD_Y), U(HX - DD_X, -DD_Y), U(KLEIN_TOP, 0), U(HX - DD_X, DD_Y), U(0, DD_Y)], "rgba(139,209,160,.75)");
  }
  if (o.zone === "vlieg") {
    c.fillStyle = "rgba(242,162,92,.55)";
    c.fillRect(-HX, VL, 2 * HX, VLIEG);
    c.fillRect(-HX, -HY, 2 * HX, VLIEG);
  }
  if (o.zone === "triangle") poly([U(0, 0), U(QUART, VL), U(QUART, -VL)], "rgba(242,162,92,.5)");
  if (o.lines) {
    c.strokeStyle = "rgba(238,244,238,.6)";
    c.lineWidth = lw;
    c.setLineDash([]);
    for (const y of [-VL, VL, -180, 180]) L(-HX, y, HX, y);
    L(0, -HY, 0, HY);
    c.beginPath();
    c.moveTo(90, 0);
    c.lineTo(0, 90);
    c.lineTo(-90, 0);
    c.lineTo(0, -90);
    c.closePath();
    c.stroke();
    for (const g of [1, -1]) {
      L(g * GOAL_X, 0, g * QUART, VL);
      L(g * GOAL_X, 0, g * QUART, -VL);
      const top = g * (HX - KLEIN_TOP);
      L(g * DD_X, DD_Y, top, 0);
      L(g * DD_X, -DD_Y, top, 0);
      L(0, HY, top, 0);
      L(0, -HY, top, 0);
    }
    c.setLineDash([16, 12]);
    for (const x of [-QUART, QUART]) {
      L(x, 180, x, HY);
      L(x, -180, x, -HY);
    }
    c.setLineDash([]);
    for (const col of COLORS)
      for (const p of START.slice(0, 4)) {
        const x = home(col) * p.x;
        L(x - 12, p.y, x + 12, p.y);
        L(x, p.y - 12, x, p.y + 12);
      }
  }
  if (!o.three)
    for (const h of [1, -1]) {
      ring(h * GOAL_X, 0, GOAL_R);
      c.fillStyle = "#050505";
      c.fill();
      ring(h * GOAL_X, 0, 37);
      c.lineWidth = o.zone === "goals" ? 12 : 7;
      c.strokeStyle = h === 1 ? "#efe7d4" : "#d9423f";
      c.stroke();
      // the lip behind the hole
      c.beginPath();
      c.arc(h * GOAL_X, 0, LIP_R + 3, h > 0 ? -LIP_SPAN : Math.PI - LIP_SPAN, h > 0 ? LIP_SPAN : Math.PI + LIP_SPAN);
      c.lineWidth = 9;
      c.strokeStyle = "#141414";
      c.stroke();
      for (const d of DOPS) {
        ring(d.x, d.y, DOP_R);
        c.fillStyle = "#b3392c";
        c.fill();
        ring(d.x, d.y, 10);
        c.fillStyle = "#d7dadd";
        c.fill();
      }
    }
  for (const m of o.marks || []) {
    c.setLineDash(m.dash || []);
    ring(m.x, m.y, m.r);
    c.lineWidth = m.w || 5;
    c.strokeStyle = m.color;
    c.stroke();
    c.setLineDash([]);
  }
  const pens = o.zone === "penalty" ? spots("W") : o.pens || [];
  if (pens.length) {
    c.font = '700 36px "Chakra Petch", monospace';
    c.textAlign = "center";
    c.textBaseline = "middle";
    for (const p of pens) {
      ring(p.x, p.y, R);
      c.fillStyle = "rgba(242,162,92,.4)";
      c.fill();
      c.setLineDash([8, 6]);
      c.lineWidth = 5;
      c.strokeStyle = "#ffb347";
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = "#fff";
      c.fillText(p.n, p.x, p.y + 2);
    }
  }
  for (const a of o.arrows || []) drawArrow(c, a, L);
  for (const b of o.balls || []) {
    const g = c.createRadialGradient(b.x - 10, b.y - 10, 3, b.x, b.y, R);
    g.addColorStop(0, b.c === "W" ? "#fff" : "#ff8a7c");
    g.addColorStop(1, b.c === "W" ? "#bdb39b" : "#7d1015");
    ring(b.x, b.y, R);
    c.fillStyle = g;
    c.fill();
  }
  if (o.light) {
    c.globalCompositeOperation = "multiply";
    c.drawImage(o.light, -HX, -HY, 2 * HX, 2 * HY);
    c.globalCompositeOperation = "source-over";
  }
}

function drawArrow(
  c: CanvasRenderingContext2D,
  a: Arrow,
  L: (a: number, b: number, d: number, e: number) => void,
): void {
  c.strokeStyle = a.bad ? "#f2a25c" : a.alt ? "#9fd4ff" : "#f2e9d8";
  c.fillStyle = c.strokeStyle;
  c.lineWidth = 7;
  c.setLineDash(a.bad || a.alt ? [18, 12] : []);
  c.beginPath();
  a.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.stroke();
  c.setLineDash([]);
  const [x1, y1] = a.pts[a.pts.length - 2],
    [x2, y2] = a.pts[a.pts.length - 1],
    ang = Math.atan2(y2 - y1, x2 - x1);
  c.beginPath();
  c.moveTo(x2, y2);
  c.lineTo(x2 - 34 * Math.cos(ang - 0.45), y2 - 34 * Math.sin(ang - 0.45));
  c.lineTo(x2 - 34 * Math.cos(ang + 0.45), y2 - 34 * Math.sin(ang + 0.45));
  c.closePath();
  c.fill();
  if (a.cross) {
    const [cx, cy] = a.cross;
    c.lineWidth = 9;
    L(cx - 26, cy - 26, cx + 26, cy + 26);
    L(cx - 26, cy + 26, cx + 26, cy - 26);
  }
}

// ---------- the 3D cloth ----------
const cloth = {} as {
  ctx: CanvasRenderingContext2D;
  k: number;
  tex: THREE.CanvasTexture;
  noise: HTMLCanvasElement;
  light: HTMLCanvasElement;
  felt: string;
};

function noiseCanvas(): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = 256;
  cv.height = 128;
  const n = cv.getContext("2d")!,
    d = n.createImageData(256, 128);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = Math.random() * 255;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 14;
  }
  n.putImageData(d, 0, 0);
  return cv;
}
/** the three lamp pools, baked into the cloth */
function lightCanvas(): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = 360;
  cv.height = 180;
  const l = cv.getContext("2d")!;
  l.fillStyle = "#5c5c5c";
  l.fillRect(0, 0, 360, 180);
  l.globalCompositeOperation = "lighter";
  for (const x of [60, 180, 300]) {
    const g = l.createRadialGradient(x, 90, 4, x, 90, 120);
    g.addColorStop(0, "rgba(170,165,150,1)");
    g.addColorStop(0.55, "rgba(110,105,95,.55)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    l.fillStyle = g;
    l.fillRect(0, 0, 360, 180);
  }
  return cv;
}

/** the cloth plane (unlit: the lamps are baked in) */
export function buildCloth(T: THREE.Object3D): void {
  const cv = document.createElement("canvas");
  cv.width = 1024;
  cv.height = 512;
  cloth.ctx = cv.getContext("2d")!;
  cloth.k = cv.width / 1800;
  cloth.noise = noiseCanvas();
  cloth.light = lightCanvas();
  cloth.felt = "#23897a";
  cloth.tex = new THREE.CanvasTexture(cv);
  cloth.tex.anisotropy = S.renderer.capabilities.getMaxAnisotropy();
  flat(T, 1.8, 0.9, basic(0xffffff, { map: cloth.tex }));
  paintCloth({});
}
export function paintCloth(o: ClothOpts): void {
  const c = cloth.ctx;
  c.setTransform(cloth.k, 0, 0, cloth.k, HX * cloth.k, HY * cloth.k);
  drawTable(c, { felt: cloth.felt, noise: cloth.noise, light: cloth.light, lines: S.lines, three: true, ...o });
  cloth.tex.needsUpdate = true;
}
/** the cloth colour; the cushions follow a shade darker */
export function setFelt(hex: string): void {
  cloth.felt = hex;
  cushionMat?.color.set(hex).multiplyScalar(0.84);
}
let cushionMat: THREE.MeshLambertMaterial | null = null;
export const setCushionMat = (m: THREE.MeshLambertMaterial): void => {
  cushionMat = m;
};
