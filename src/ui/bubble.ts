// Speech bubbles over a regular's head, or top right when nobody's head is in view.
import { G } from "../core/state";
import { pick } from "../data/regulars";
import { headScreen } from "../cafe";
import { $, replay } from "./dom";
import { t } from "../i18n";
import { app } from "./app";
import type { Color, QuipKind } from "../types";

let bubble: { color: Color | null; until: number } | null = null;

export function say(who: string, text: string, color: Color | null = null, ms = 3400): void {
  const el = $("#bubble");
  $(".c-bubble__who", el).textContent = who;
  $(".c-bubble__text", el).textContent = t(text); // regulars' quips and Marcel's lines are English keys
  el.hidden = false;
  replay(el, "is-popping");
  bubble = { color, until: performance.now() + ms };
}
export function quip(kind: QuipKind): void {
  const o = app.opp;
  if (G?.mode !== "cpu" || !o) return;
  const lines = o.quips[kind];
  if (lines?.length) say(o.name, pick(lines), G.colorOf[1]);
}
export function placeBubble(): void {
  const el = $("#bubble");
  if (!bubble) return;
  if (performance.now() > bubble.until || document.body.classList.contains("is-replaying")) {
    el.hidden = true;
    bubble = null;
    return;
  }
  const p = bubble.color && headScreen(bubble.color),
    w = el.offsetWidth,
    h = el.offsetHeight;
  let x = p && !p.behind ? p.x - w / 2 : innerWidth - w - 24,
    y = p && !p.behind ? p.y - h - 18 : 120;
  const left = ($(".c-rail").getBoundingClientRect().right || 0) + 12; // never over the menu rail
  x = Math.max(left, Math.min(innerWidth - w - 12, x));
  y = Math.max(110, Math.min(innerHeight - h - 160, y));
  el.style.transform = `translate(${x | 0}px, ${y | 0}px)`;
}
