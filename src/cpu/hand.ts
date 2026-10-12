// The planned shot with the character's own wobble added. `wobble` grows when someone has had a few.
import type { AI, Shot } from "../types";
import { clamp } from "./ideas";
import { powerOf, speedOf } from "../core/power";

export const gauss = (): number => (Math.random() + Math.random() + Math.random() - 1.5) * 1.4;

export function shaky(s: Shot, ai: AI, wobble = 1): Shot {
  const sa = ai.angle * wobble,
    a = Math.atan2(s.dy, s.dx) + gauss() * sa;
  return {
    dx: Math.cos(a),
    dy: Math.sin(a),
    // ai.power is the error in ball speed
    p: clamp(powerOf(speedOf(s.p) * (1 + gauss() * ai.power * wobble)), 0.03, 1),
    sx: clamp((s.sx || 0) + gauss() * sa * 3, -1, 1),
    sy: clamp((s.sy || 0) + gauss() * sa * 3, -1, 1),
  };
}
