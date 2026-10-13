// Brass name plaques: 0.3 m for a normal name, wider for a long one, so the name never runs into the coloured studs.
import { THREE } from "./three";
import { TBL } from "./table";
import { COLORS } from "../core/table";
import type { Color } from "../types";

const FONT = '700 60px "Chakra Petch", sans-serif';

function paint(c: Color, text: string): { cv: HTMLCanvasElement; w: number } {
  const h = 128,
    m = document.createElement("canvas").getContext("2d")!;
  m.font = FONT;
  const w = Math.min(1100, Math.max(512, Math.ceil(m.measureText(text).width) + 190)),
    cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const x = cv.getContext("2d")!;
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#f6dc8e");
  g.addColorStop(0.45, "#d4a246");
  g.addColorStop(0.55, "#b9832c");
  g.addColorStop(1, "#f0cf78");
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  x.strokeStyle = "#6b4512";
  x.lineWidth = 6;
  x.strokeRect(9, 9, w - 18, h - 18);
  x.strokeStyle = "rgba(255,248,210,.7)";
  x.lineWidth = 2;
  x.strokeRect(15, 15, w - 30, h - 30);
  for (const sx of [26, w - 26]) {
    x.fillStyle = "#7a5216";
    x.beginPath();
    x.arc(sx, h / 2, 7, 0, 7);
    x.fill();
    x.fillStyle = "#ffe7a6";
    x.fillRect(sx - 5, h / 2 - 1, 10, 2);
  }
  x.fillStyle = c === "W" ? "#f2ead6" : "#c0141f";
  x.strokeStyle = "#4a2c08";
  x.lineWidth = 3;
  for (const sx of [52, w - 52]) {
    x.beginPath();
    x.arc(sx, h / 2, 13, 0, 7);
    x.fill();
    x.stroke();
  }
  let size = 60;
  x.font = FONT;
  while (x.measureText(text).width > w - 170 && size > 24) {
    size -= 2;
    x.font = `700 ${size}px "Chakra Petch", sans-serif`;
  }
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillStyle = "rgba(255,250,220,.75)"; // engraved: light edge below, dark cut above
  x.fillText(text, w / 2 + 2, h / 2 + 4);
  x.fillStyle = "#4a2c08";
  x.fillText(text, w / 2, h / 2 + 1);
  return { cv, w };
}

export function updatePlaques(nameOf: (c: Color) => string): void {
  for (const c of COLORS) {
    const p = TBL.plaques[c],
      name = nameOf(c);
    if (p.name === name) continue;
    p.name = name;
    const { cv, w } = paint(c, name.toUpperCase()),
      mat = p.mesh.material;
    mat.map?.dispose();
    mat.map = new THREE.CanvasTexture(cv);
    mat.needsUpdate = true;
    p.mesh.scale.x = w / 512;
  }
}
/** fonts arrived: draw again */
export function replaqueAll(): void {
  for (const c of COLORS) TBL.plaques[c].name = null;
}
