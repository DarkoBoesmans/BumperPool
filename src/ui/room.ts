// What the HUD covers on a small screen, so the camera can frame the table in the part left free. Each HUD block
// pushes in the screen edge that costs the least room: the scoreboard the top, the controls the bottom or the left.
import type { Insets } from "../render/camera";

export const room: Insets = { l: 0, t: 0, r: 0, b: 0 };
const BLOCKS = [".c-scoreboard", ".c-ribbon", ".c-rail", ".c-spin"];
let next = 0;

export function measureRoom(now: number): void {
  if (now < next) return;
  next = now + 250;
  const W = innerWidth,
    H = innerHeight,
    o: Insets = { l: 0, t: 0, r: 0, b: 0 },
    area = (a: Insets) => Math.max(0, W - a.l - a.r) * Math.max(0, H - a.t - a.b);
  if (W <= 900 || H <= 520)
    for (const q of BLOCKS) {
      const r = document.querySelector(q)?.getBoundingClientRect();
      if (!r?.width) continue; // hidden
      const best = [
        { ...o, t: Math.max(o.t, r.bottom + 4) },
        { ...o, b: Math.max(o.b, H - r.top + 4) },
        { ...o, l: Math.max(o.l, r.right + 4) },
        { ...o, r: Math.max(o.r, W - r.left + 4) },
      ].reduce((a, b) => (area(b) > area(a) ? b : a));
      if (W - best.l - best.r > W * 0.4 && H - best.t - best.b > H * 0.4) Object.assign(o, best);
    }
  Object.assign(room, o);
}
