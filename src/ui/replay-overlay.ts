// What's on screen during a replay: the camera's name, and for a foul, the card that explains it.
import { nameOf } from "../core/state";
import { t } from "../i18n";
import { COL } from "../core/table";
import { $ } from "./dom";
import type { Foul } from "../types";
import type { Moment } from "../replay/replay";

export function replayOverlay(m: Moment | null, foul?: Foul): void {
  const r = $("#replay");
  if (!m) {
    r.hidden = true;
    document.body.classList.remove("is-replaying");
    r.className = "c-replay";
    return;
  }
  document.body.classList.add("is-replaying");
  r.hidden = false;
  r.className = "c-replay" + (m.kind === "win" ? " c-replay--win" : "");
  $("#rLabel").textContent = t(m.kind === "win" ? "WINNING GOAL CAM" : m.kind === "foul" ? "FOUL CAM" : "GOAL CAM");
  $("#rWhy").hidden = true;
  if (foul) {
    $("#rTitle").textContent = t(foul.title);
    $("#rWho").textContent = `${nameOf(foul.c)} · ${t(COL[foul.c])}`;
    $("#rText").textContent = t(foul.why);
    $("#rNext").textContent = foul.next ? t(foul.next) : "";
    $("#rRef").textContent = foul.code;
  }
}
/** the explanation stays up until the replay ends */
export function replayFrozen(on: boolean, foul?: Foul): void {
  $("#replay").classList.toggle("is-frozen", on);
  if (foul && on) $("#rWhy").hidden = false;
}
