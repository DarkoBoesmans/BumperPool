// Boards on the walls: live chalkboards and posters, painted on canvases and redrawn only when what they show changes.
import { THREE, add, lam, basic } from "../render/three";
import { WX, WZ } from "./state";
import { drawScore, drawFoulBook, drawRules, type BoardCtx } from "./boards-draw";
import { drawMarquee, drawRegular, drawClock } from "./boards-signs";
import { drawArtPoster, drawWhisky, drawCigarAd, drawShame } from "./posters";
import { drawKonami, drawCode } from "./arcade-posters";

/** draw(null, ctx) returns a key; the board is repainted when the key changes */
export type Draw = (c: CanvasRenderingContext2D | null, ctx: BoardCtx) => string | void;
interface Board {
  cv: HTMLCanvasElement;
  tex: THREE.CanvasTexture;
  draw: Draw;
  key: string | null | void;
}
const boards: Board[] = [];

function board(
  room: THREE.Object3D,
  w: number,
  h: number,
  x: number,
  y: number,
  z: number,
  ry: number,
  pxw: number,
  draw: Draw,
  o: { lit?: boolean; frame?: number } = {},
): void {
  const cv = document.createElement("canvas");
  cv.width = pxw;
  cv.height = Math.round((pxw * h) / w);
  const tex = new THREE.CanvasTexture(cv);
  add(room, new THREE.PlaneGeometry(w, h), basic(o.lit ? 0xffffff : 0xd9ccb6, { map: tex }), x, y, z).rotation.y = ry; // unlit, like a PS2 billboard
  if (o.frame) {
    const f = add(room, new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.03), lam(o.frame), x, y, z);
    f.rotation.y = ry;
    f.translateZ(-0.035);
  }
  boards.push({ cv, tex, draw, key: null });
}

export function buildBoards(room: THREE.Object3D): void {
  for (const s of [1, -1]) {
    const x = s * (WX - 0.03),
      ry = (-s * Math.PI) / 2,
      z = (v: number) => s * v; // positive v is to the right as you face this wall
    board(room, 1.7, 1.05, x, 0.42, z(0), ry, 640, drawScore, { frame: 0x3a1a0c }); // low enough to show under the HUD in player view
    board(room, 0.72, 0.98, x, 0.42, z(-1.45), ry, 288, drawFoulBook, { frame: 0x2a140a });
    board(room, 0.72, 0.98, x, 0.42, z(1.45), ry, 288, drawRules, { frame: 0x2a140a });
    board(room, 0.75, 1.05, x, 0.75, z(s > 0 ? 2.75 : -2.75), ry, 240, s > 0 ? drawArtPoster : drawWhisky, {
      frame: 0x111111,
    });
    board(room, 0.75, 1.05, x, 0.75, z(s > 0 ? -2.75 : 2.75), ry, 240, s > 0 ? drawCigarAd : drawShame, {
      frame: s > 0 ? 0x111111 : 0x2a140a,
    });
  }
  board(room, 2.6, 0.42, 0, 2.1, -WZ + 0.04, 0, 640, drawMarquee, { lit: true });
  board(room, 0.62, 0.82, 0, 1.0, WZ - 0.03, Math.PI, 192, drawRegular, { frame: 0xc9a35b });
  board(room, 0.5, 0.5, 1.0, 1.2, WZ - 0.03, Math.PI, 160, drawClock, { frame: 0x2a140a });
  board(room, 0.7, 0.98, -4.0, 0.8, WZ - 0.03, Math.PI, 240, drawCigarAd, { frame: 0x111111 });
  board(room, 0.42, 0.6, 3.55, 1.05, WZ - 0.03, Math.PI, 168, drawKonami, { frame: 0x111111 }); // a small arcade poster by the jukebox
  board(room, 0.7, 0.98, -2.2, 1.32, WZ - 0.03, Math.PI, 240, drawCode, { frame: 0x111111 }); // the old code, spelled out
}

export function updateBoards(ctx: BoardCtx): void {
  for (const B of boards) {
    const key = B.draw(null, ctx);
    if (key === B.key) continue;
    B.key = key;
    const c = B.cv.getContext("2d")!;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, B.cv.width, B.cv.height);
    B.draw(c, ctx);
    B.tex.needsUpdate = true;
  }
}
/** fonts arrived: draw everything again */
export function fontsChanged(): void {
  for (const B of boards) B.key = null;
}
