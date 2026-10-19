// The start menu: which view is showing, the home screen's badges and your record in one line.
import { G } from "../core/state";
import { me, beatenCount, TOTAL } from "../profile/profile";
import { itemById } from "../data/shop";
import { $, $$ } from "./dom";
import { t } from "../i18n";
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
  if (v === "story" && !me.made) {
    // the story starts with your own player: the maker first, the story after Done
    v = "me";
    back = "story";
  }
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

/** draw the open view again, without moving the focus: after a language switch */
export function redrawView(): void {
  const v = $("#panel").dataset.view as View;
  if (v === "home") home();
  else views[v]?.();
}

function recordText(): string {
  if (!me.wins && !me.losses) return t("No matches on the board yet. The regulars are waiting.");
  return (
    t("Your record: {won} won, {lost} lost", { won: me.wins, lost: me.losses }) +
    (me.crawled ? t(", under the table {n}×", { n: me.crawled }) : "") +
    (me.sentUnder ? t(", sent {n} under it", { n: me.sentUnder }) : "") +
    "."
  );
}

function home(): void {
  $("#homeRecord").textContent = recordText();
  $("#storyBadge").textContent = `${beatenCount()} / ${TOTAL}`;
  const n = beatenCount(),
    free = $<HTMLButtonElement>("#btnFreeplay");
  free.disabled = n === 0;
  $("#freeDesc").textContent =
    n > 1
      ? t("Rematch the {n} regulars you beat", { n })
      : n
        ? t("Rematch the regular you beat")
        : t("Beat someone in the story first");
  $("#homeBarNote").textContent = t("You play at your home bar: {bar}.", {
    bar: t(itemById(me.equip.bar)?.name || "The Golden Cue"),
  });
}
