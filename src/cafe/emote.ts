// A puff on your cigar, a sip of your whisky, chalk on your tip or two knocks on the table: your figure does it,
// or in player view your own hand.
import { PL } from "../people/player";
import { setLiquid } from "../people/things";
import { refill } from "./props";
import { C } from "./state";
import type { Color } from "../types";

export type Emote = "cigar" | "glass" | "chalk" | "knock";

/** "ok", "busy" when already at it, or "empty" when the glass is empty */
export function emote(c: Color, kind: Emote, firstPerson: boolean, now = performance.now()): "ok" | "busy" | "empty" {
  const P = C.props[c];
  if (kind === "glass" && P.level <= 0.01) return "empty";
  if (firstPerson) {
    if (C.vm!.anim) return "busy";
    C.vm!.anim = { kind, t0: now, from: P.level, to: Math.max(0, P.level - 0.25) };
  } else {
    const F = PL.figs[c];
    if (!F || F.anim) return "busy";
    F.hold(kind === "knock" ? null : kind);
    F.anim = { kind, t0: now };
    if (kind === "glass" && F.glass) setLiquid(F.glass, Math.max(0.05, P.level));
  }
  if (kind === "cigar") {
    P.tray.lit = true;
    P.tray.litUntil = now + 90000;
    P.tray.tip.visible = true;
  } else if (kind === "glass") {
    const to = Math.max(0, P.level - 0.25);
    P.level = to;
    setTimeout(() => refill(c, to), 1600);
    if (to <= 0.01) P.refillAt = now + 6000;
  }
  return "ok";
}
