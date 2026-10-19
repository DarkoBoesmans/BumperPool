// What the last shot was, for the show, the replay card and the HUD: the LastShot and Foul records the referee fills.
import type { Ball, Color, Foul, FoulKey, LastShot } from "../types";
import { att } from "./table";
import { G, ball } from "./state";
import { FOULS } from "./fouls";

export function shot(extra: Partial<LastShot> = {}): void {
  const s = G.stroke,
    shooter = s && !s.opening ? ball(s.shooter).c : null,
    own = s && shooter ? s.pots.filter((p) => p.c === shooter && p.h === att(shooter)) : [];
  G.lastShot = {
    n: G.strokeNo,
    shooter,
    pots: s ? s.pots.slice() : [],
    foul: null,
    end: null,
    lucky: own.length > 0 && (own.some((p) => p.id !== s!.shooter) || s!.touches >= 3),
    ...extra,
  };
}
export function foulInfo(
  key: FoulKey,
  c: Color,
  b: Ball | null,
  at: { t: number; x: number; y: number } | null,
  extra: Partial<Foul> = {},
): Foul {
  return {
    key,
    ...FOULS[key],
    c,
    ball: b ? b.id : null,
    t: at ? at.t : 0,
    x: at ? at.x : (b?.x ?? 0),
    y: at ? at.y : (b?.y ?? 0),
    ...extra,
  };
}
