// The jukebox's title strip: whenever a new record starts, a small card with its name slides in for a few seconds,
// like the title cards behind the glass of an old jukebox. The settings show the same record in full.
import { juke, onSong } from "../audio/jukebox";
import { $, replay } from "./dom";

const SHOW_MS = 4800;
let timer = 0;

export function initNowPlaying(): void {
  const card = $("#nowPlaying");
  onSong(() => {
    $("#npTitle").textContent = juke.title;
    $("#npInfo").textContent = juke.info;
    card.hidden = false;
    card.classList.remove("is-out");
    replay(card, "is-in");
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      card.classList.remove("is-in");
      card.classList.add("is-out");
      timer = window.setTimeout(() => {
        card.hidden = true;
        card.classList.remove("is-out");
      }, 400);
    }, SHOW_MS);
  });
}
