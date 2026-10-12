// Faces and clothes, painted on small canvases with soft shading baked in, like a PS2 open-world game's characters.
// The face sits at x = 32 of a 128-wide strip that wraps round the head (u = 0.25); the back of the head is hair.
import { canvasTex, THREE } from "../render/three";
import type { Look } from "../types";

const BALDISH = new Set(["bald", "buzz", "mohawk"]);

export function faceTex(L: Look): THREE.CanvasTexture {
  return canvasTex(128, 64, (c, w, h) => {
    const fx = 32,
      dark = shade(L.skin, 0.72),
      deep = shade(L.skin, 0.55);
    c.fillStyle = L.skin;
    c.fillRect(0, 0, w, h);
    // round the sides and under the jaw the skin falls into shadow
    const side = c.createLinearGradient(fx - 32, 0, fx + 32, 0);
    side.addColorStop(0, "rgba(0,0,0,.28)");
    side.addColorStop(0.3, "rgba(0,0,0,0)");
    side.addColorStop(0.7, "rgba(0,0,0,0)");
    side.addColorStop(1, "rgba(0,0,0,.28)");
    c.fillStyle = side;
    c.fillRect(fx - 32, 0, 64, h);
    c.fillStyle = "rgba(0,0,0,.28)";
    c.fillRect(64, 0, 64, h);
    const jaw = c.createLinearGradient(0, 46, 0, 64);
    jaw.addColorStop(0, "rgba(0,0,0,0)");
    jaw.addColorStop(1, "rgba(0,0,0,.35)");
    c.fillStyle = jaw;
    c.fillRect(0, 46, w, 18);
    if (!BALDISH.has(L.hairStyle)) {
      c.fillStyle = L.hair;
      c.fillRect(0, 0, w, 14);
      c.fillRect(64, 0, 64, 40);
      c.fillRect(fx - 26, 14, 6, 10); // sideburns
      c.fillRect(fx + 20, 14, 6, 10);
    } else if (L.hairStyle === "buzz") {
      c.fillStyle = shade(L.hair, 0.5, L.skin);
      c.fillRect(0, 0, w, 12);
      c.fillRect(64, 0, 64, 32);
    }
    // brows, eyes with whites and a lid line, the nose's shadow and nostrils, the mouth
    c.fillStyle = shade(L.hair, 0.85);
    c.fillRect(fx - 13, 19, 10, 2);
    c.fillRect(fx + 3, 19, 10, 2);
    c.fillStyle = dark;
    c.fillRect(fx - 12, 22, 9, 1);
    c.fillRect(fx + 3, 22, 9, 1);
    if (L.eyeshadow) {
      c.fillStyle = L.eyeshadow;
      c.fillRect(fx - 12, 21, 9, 3);
      c.fillRect(fx + 3, 21, 9, 3);
    }
    c.fillStyle = "#f2ede4";
    c.fillRect(fx - 11, 24, 7, 4);
    c.fillRect(fx + 4, 24, 7, 4);
    c.fillStyle = L.eyes || "#3a2616";
    c.fillRect(fx - 9, 24, 4, 4);
    c.fillRect(fx + 5, 24, 4, 4);
    c.fillStyle = "#0a0606";
    c.fillRect(fx - 8, 25, 2, 2);
    c.fillRect(fx + 6, 25, 2, 2);
    c.fillStyle = L.lashes ? "#0a0606" : deep;
    c.fillRect(fx - 12, 23, 9, L.lashes ? 2 : 1);
    c.fillRect(fx + 3, 23, 9, L.lashes ? 2 : 1);
    if (L.lashes) {
      c.fillRect(fx - 13, 22, 1, 1);
      c.fillRect(fx + 12, 22, 1, 1);
    }
    c.fillStyle = dark;
    c.fillRect(fx + 1, 26, 2, 9);
    c.fillStyle = deep;
    c.fillRect(fx - 4, 35, 3, 2);
    c.fillRect(fx + 1, 35, 3, 2);
    c.fillStyle = shade(L.skin, 0.88);
    c.fillRect(fx - 9, 29, 5, 6); // cheek shading under the eyes
    c.fillRect(fx + 4, 29, 5, 6);
    const lips = L.lips || shade(L.skin, 0.62, "#8a2a2a");
    c.fillStyle = shade(lips, 0.7);
    c.fillRect(fx - 6, 41, 12, 1);
    c.fillStyle = lips;
    c.fillRect(fx - 5, 42, 10, L.lips ? 3 : 2);
    c.fillStyle = dark;
    c.fillRect(fx - 3, 48, 6, 1); // under the lip
    const f = L.facial || "none";
    if (f === "stubble") {
      c.fillStyle = shade(L.hair, 0.4, L.skin);
      c.globalAlpha = 0.55;
      c.fillRect(fx - 16, 36, 32, 16);
      c.globalAlpha = 1;
      c.fillStyle = lips;
      c.fillRect(fx - 5, 42, 10, 2);
    }
    if (f === "stache" || f === "beard") {
      c.fillStyle = L.hair;
      c.fillRect(fx - 8, 38, 16, 3);
    }
    if (f === "beard") {
      c.fillStyle = L.hair;
      c.fillRect(fx - 16, 36, 32, 16);
      c.fillStyle = lips;
      c.fillRect(fx - 5, 42, 10, 2);
    }
    if (f === "goatee") {
      c.fillStyle = L.hair;
      c.fillRect(fx - 4, 44, 8, 8);
      c.fillRect(fx - 6, 38, 12, 2);
    }
    if (L.glasses === "round") {
      c.strokeStyle = "#1a1a1a";
      c.lineWidth = 1.5;
      c.strokeRect(fx - 13, 22, 10, 8);
      c.strokeRect(fx + 3, 22, 10, 8);
      c.fillStyle = "#1a1a1a";
      c.fillRect(fx - 3, 24, 6, 1);
    }
    if (L.blush) {
      c.fillStyle = "rgba(215,60,55,.4)";
      c.fillRect(fx - 16, 32, 6, 4);
      c.fillRect(fx + 10, 32, 6, 4);
    }
  });
}

/** a colour mixed towards another: k = 1 keeps a, 0 gives b */
export function shade(a: string, k: number, b = "#000000"): string {
  const ca = new THREE.Color(a),
    cb = new THREE.Color(b);
  return "#" + ca.lerp(cb, 1 - k).getHexString();
}

/** cloth with soft folds baked in, and the shop's print on a shirt */
export function clothTex(color: string, L?: Look): THREE.CanvasTexture {
  const p = L?.pattern || "none";
  return canvasTex(64, 64, (c, w, h) => {
    c.fillStyle = color;
    c.fillRect(0, 0, w, h);
    if (L) {
      c.fillStyle = L.trim;
      if (p === "stripes") {
        c.fillRect(0, 20, w, 8);
        c.fillRect(0, 36, w, 4);
      } else if (p === "check") {
        c.globalAlpha = 0.4;
        c.fillStyle = "#000";
        for (let i = 0; i < w; i += 16) {
          c.fillRect(i, 0, 8, h);
          c.fillRect(0, i, w, 8);
        }
        c.globalAlpha = 1;
      } else if (p === "flowers") {
        for (const [x, y] of [
          [8, 8],
          [40, 16],
          [20, 36],
          [52, 48],
          [4, 52],
          [32, 58],
        ]) {
          c.fillStyle = L.trim;
          c.fillRect(x, y, 7, 7);
          c.fillStyle = "#2a8a3a";
          c.fillRect(x + 7, y + 3, 3, 3);
        }
      } else if (p === "tux") {
        c.fillRect(26, 0, 12, h);
        c.fillStyle = "#000";
        c.fillRect(30, 12, 4, 4);
        c.fillRect(30, 28, 4, 4);
      } else if (p === "gold") {
        c.fillStyle = "rgba(255,215,90,.35)";
        for (let i = 0; i < w; i += 8) c.fillRect(i, 0, 2, h);
      }
    }
    // folds: soft darker streaks, lighter on the ridges
    for (let i = 0; i < 9; i++) {
      const x = (i * 23) % w,
        g = c.createLinearGradient(x - 4, 0, x + 4, 0);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.5, i % 2 ? "rgba(0,0,0,.14)" : "rgba(255,255,255,.08)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g;
      c.fillRect(x - 4, (i * 13) % 32, 8, 28 + ((i * 7) % 20));
    }
  });
}
