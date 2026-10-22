// The title screen, as on a console: the logo over the café and a blinking PRESS START. Any key, click or tap goes
// in, and that same press is the one the browser needs before sound may play, so the jukebox starts with the menu.
import { $ } from "./dom";

const SKIP = /^(Tab|Shift|Control|Alt|Meta|CapsLock|F\d+)$/;

export function initTitle(onStart: () => void): void {
  const title = $("#title"),
    start = $("#start");
  start.inert = true;
  start.classList.add("is-titled");
  $("#pressStart").focus();
  let gone = false;
  const go = () => {
    if (gone) return;
    gone = true;
    onStart();
    title.classList.add("is-going");
    start.inert = false;
    start.classList.replace("is-titled", "is-arriving");
    setTimeout(() => {
      title.hidden = true;
      document.removeEventListener("keydown", key, true);
      $<HTMLElement>("#panel .c-view:not([hidden]) button:not([hidden], :disabled)").focus();
    }, 620);
  };
  const key = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey || SKIP.test(e.key)) return;
    e.preventDefault();
    e.stopPropagation();
    go();
  };
  document.addEventListener("keydown", key, true);
  title.addEventListener("click", go);
}
