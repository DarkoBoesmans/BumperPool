// The language picker under the menu's small buttons. Switching redraws everything in the new language: the open
// view, the HUD and the café's boards (redraw), then the page's own text.
import { lang, setLang, onLang, type Lang } from "../i18n";
import { translateDom } from "../i18n/dom";
import { $$ } from "./dom";

export function initLang(redraw: () => void): void {
  const mark = () => {
    for (const b of $$("[data-lang]")) b.setAttribute("aria-checked", String(b.dataset.lang === lang));
  };
  for (const b of $$("[data-lang]")) b.addEventListener("click", () => setLang(b.dataset.lang as Lang));
  onLang(() => {
    redraw();
    translateDom();
    mark();
  });
  translateDom();
  mark();
}
