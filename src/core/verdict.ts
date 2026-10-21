// What the last shot was, for the show, the replay card and the HUD: the LastShot and Foul records the referee fills.
import type { Ball, Color, Foul, FoulKey, LastShot, Stroke, Trick } from "../types";
import { GOAL_X, att } from "./table";
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
    trick: s && shooter && own.length ? trickOf(s, shooter) : null,
    ...extra,
  };
}

/** from the far half: further than this from the goal it went into (mm) */
export const LONG = 1100;

/** house rule: after a trick shot you knock twice on the table. A trick is any goal but a plain direct one: off a
 * cushion or a post first, another of your balls knocked in, two at once, two or more contacts on the way, or a shot
 * from the far half. */
export function trickOf(s: Stroke, c: Color): Trick | null {
  const own = s.pots.filter((p) => p.c === c && p.h === att(c));
  if (!own.length) return null;
  if (own.length > 1) return "double";
  if (own[0].id !== s.shooter) return "combo";
  const f = s.first[s.shooter];
  if (s.touches >= 2) return "carom";
  if (f?.type === "band") return "bank";
  if (f?.type === "dop") return "post";
  return Math.hypot(s.start.x - att(c) * GOAL_X, s.start.y) > LONG ? "long" : null;
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
