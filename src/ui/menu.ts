// The start menu: which view is showing, the home screen's badges and your record in one line.
import { G } from "../core/state";
import { me, beatenCount, TOTAL } from "../profile/profile";
import { itemById } from "../data/shop";
import { $, $$ } from "./dom";
import { app } from "./app";

export type View = "home" | "story" | "pick" | "rules" | "me" | "shop" | "local" | "online" | "tutorial";
const WIDE: View[] = ["story", "pick", "rules", "me", "shop"];
/** what each view draws when it opens (set by the view modules) */
export const views: Partial<Record<View, () => void>> = {};
let back: View = "home";
export const backView = (): View => back;

export function showView(v: View): void {
  const panel = $("#panel"),
    prev = panel.dataset.view as View;
  if (v === "me" || v === "shop") back = prev === "story" || prev === "pick" ? prev : "home";
  for (const el of $$(".c-start .c-view[data-view]")) el.hidden = el.dataset.view !== v;
  panel.dataset.view = v;
  panel.classList.toggle("c-start__panel--wide", WIDE.includes(v));
  $("#btnResume").hidden = !(app.inGame && G);
  if (v === "home") home();
  views[v]?.();
  const f = document.querySelector<HTMLElement>(
    `.c-start .c-view[data-view="${v}"] button:not([disabled]), .c-start .c-view[data-view="${v}"] input`,
  );
  f?.focus({ preventScroll: true });
}

function recordText(): string {
  if (!me.wins && !me.losses) return "No matches on the board yet. The regulars are waiting.";
  return (
    `Your record: ${me.wins} won, ${me.losses} lost` +
    (me.crawled ? `, under the table ${me.crawled}×` : "") +
    (me.sentUnder ? `, sent ${me.sentUnder} under it` : "") +
    "."
  );
}

function home(): void {
  $("#homeRecord").textContent = recordText();
  $("#storyBadge").textContent = `${beatenCount()} / ${TOTAL}`;
  const n = beatenCount(),
    free = $<HTMLButtonElement>("#btnFreeplay");
  free.disabled = n === 0;
  $("#freeDesc").textContent = n
    ? `Rematch the ${n} regular${n > 1 ? "s" : ""} you beat`
    : "Beat someone in the story first";
  $("#homeBarNote").textContent = `You play at your home bar: ${itemById(me.equip.bar)?.name || "The Golden Cue"}.`;
}
