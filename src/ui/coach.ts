// The camera coach: your first games show how to look around in three steps (turn, zoom, look somewhere), each
// ticked off as you do it. Once all three are done, or you press Got it, it stays away for good (me.tips.camera).
// The same steps are in How to play.
import { $ } from "./dom";
import { me, saveMe } from "../profile/profile";

export type CoachStep = "turn" | "zoom" | "look";
const done = new Set<CoachStep>();
let on = false;

/** a game starts: the coach shows if you have not learned it yet */
export function showCoach(): void {
  const c = $("#coach");
  on = !me.tips.camera;
  c.hidden = !on;
  c.classList.remove("is-learned");
  done.clear();
  for (const li of c.querySelectorAll("[data-step]")) li.classList.remove("is-done");
}

/** you just did one of the steps */
export function coachDid(s: CoachStep): void {
  if (!on || done.has(s)) return;
  done.add(s);
  $(`#coach [data-step="${s}"]`).classList.add("is-done");
  if (done.size === 3) learned();
}

function learned(): void {
  on = false;
  me.tips.camera = true;
  saveMe();
  const c = $("#coach");
  c.classList.add("is-learned");
  setTimeout(() => c.classList.contains("is-learned") && (c.hidden = true), 1500); // after the bow (_coach.scss)
}

export const initCoach = (): void => $("#coachOk").addEventListener("click", learned);
