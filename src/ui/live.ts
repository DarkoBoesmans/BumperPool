// Every frame while you play: the power meter, the foul warning while you aim, the shot clock, the whisky and smoke
// meters, and the speech bubble's position.
import { G } from "../core/state";
import { t } from "../i18n";
import { aimsAtGoal, cornerBall, flyer } from "../core/table";
import { bandOf, isHard, rollDistance, speedOf } from "../core/power";
import type { Ball, Shot } from "../types";
import { $, $$ } from "./dom";
import { app, help } from "./app";
import { placeBubble } from "./bubble";

let lastWarn: string | null = null,
  lastClock = "",
  lastPower = "";

/** the foul a hard shot would be from where this ball lies, aimed like this, if any */
function hardFoul(b: Ball, s: Shot): string {
  const d = { x: s.dx, y: s.dy };
  if (cornerBall(b.c, b) && aimsAtGoal(b.c, b, d))
    return t("Below the shooting line: a hard shot straight at the goal is a foul");
  if (flyer(b, d)) return t("On the cushion strip: hard along the cushion is a flyer");
  return "";
}

export function liveUI(s: Shot | null, b: Ball | null): void {
  const warnHelp = !!help().warn,
    foulHere = b && s && G.phase === "aim" ? hardFoul(b, s) : "",
    warn = s && warnHelp && foulHere && isHard(s.p) ? foulHere : "";
  if (warn !== lastWarn) {
    lastWarn = warn;
    const w = $("#stLive");
    w.textContent = warn;
    w.hidden = !warn;
  }
  const pw = $("#power");
  pw.hidden = !s;
  if (s) {
    const key = `${s.p.toFixed(3)}|${!!foulHere && warnHelp}`;
    if (key !== lastPower) {
      lastPower = key;
      const v = speedOf(s.p),
        run = rollDistance(v) / 1000;
      pw.style.setProperty("--p", `${s.p * 100}%`);
      pw.dataset.band = bandOf(s.p).id;
      pw.classList.toggle("is-hard", isHard(s.p));
      pw.classList.toggle("is-foul", !!foulHere && warnHelp);
      $(".c-power__band", pw).textContent = t(bandOf(s.p).label);
      $(".c-power__speed", pw).textContent = `${(v / 1000).toFixed(1)} m/s`;
      $(".c-power__reach", pw).textContent = t("rolls {m} m on its own", {
        m: run < 10 ? run.toFixed(1) : Math.round(run),
      });
    }
  }
  const chip = $("#clockChip");
  chip.hidden = !app.set.clock;
  if (app.set.clock) {
    const left = G.phase === "aim" ? Math.max(0, Math.ceil(G.timeLeft)) : 60,
      c = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
    if (c !== lastClock) {
      lastClock = c;
      $("#clock").textContent = c;
      chip.classList.toggle("is-low", left <= 15);
    }
  }
  placeBubble();
}

/** whisky, smoke and chalk meters on their buttons; the knock button glows after a trick shot, and a big knock button
 * shows right after one of your goals, over the banner and the replay */
export function buzzUI(drink: number, smoke: number, chalk: number, fluke: boolean, knockNow: boolean): void {
  $$("#lvWhisky b").forEach((b, i) => b.classList.toggle("is-on", i < Math.ceil(drink - 0.05)));
  $$("#lvCigar b").forEach((b, i) => b.classList.toggle("is-on", i < Math.ceil(smoke * 4 - 0.05)));
  $$("#lvChalk b").forEach((b, i) => b.classList.toggle("is-on", i < Math.ceil(chalk * 4 - 0.05)));
  $("#btnKnock").classList.toggle("is-ready", fluke);
  const k = $("#knockNow");
  if (k.hidden === knockNow) k.hidden = !knockNow;
  k.classList.toggle("is-lucky", fluke);
}
