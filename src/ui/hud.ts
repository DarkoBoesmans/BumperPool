// The HUD after every change: scoreboard, the match drawer, the ribbon, the referee ticker, the end card.
import { G, ball, fouls, remaining } from "../core/state";
import { COL, other } from "../core/table";
import { gradeOf } from "../data/regulars";
import { venueById } from "../data/venues";
import { net } from "../net/online";
import { C } from "../cafe";
import { $, esc, replay } from "./dom";
import { app, canAct, team } from "./app";
import { cafeNote, drawCafeBox } from "./cafe-online";
import { statusText } from "./status";
import { endcard } from "./endcard";
import { lang, t, tLog } from "../i18n";

let lastTick = "",
  tickLang = "";

export function renderUI(): void {
  if (!G) return;
  const live = ["aim", "openW", "openR", "moving", "wait"].includes(G.phase);
  for (const p of [0, 1]) {
    const c = G.colorOf[p],
      plate = $("#s" + p),
      row = $("#pl" + p),
      f = fouls(c),
      inn = 5 - remaining(c);
    plate.dataset.c = c;
    $(".c-ball", plate).dataset.c = c;
    $(".c-ball", row).dataset.c = c;
    plate.classList.toggle("is-active", live && G.turn === c);
    $(".c-scoreboard__name", plate).textContent = G.names[p] || (G.mode === "online" ? t("Free seat") : "");
    $(".c-scoreboard__pips", plate).innerHTML = Array.from(
      { length: 5 },
      (_, i) => `<i class="c-scoreboard__pip${i < inn ? " is-in" : ""}"></i>`,
    ).join("");
    const fl = $(".c-scoreboard__fouls", plate);
    fl.textContent = f > 1 ? t("{n} fouls", { n: f }) : f ? t("1 foul") : t("clean");
    fl.classList.toggle("is-bad", f > 0);
    $(".c-scoreboard__wins", plate).innerHTML = [0, 1]
      .map((i) => `<i class="c-scoreboard__win${G.wins[p] > i ? " is-on" : ""}"></i>`)
      .join("");
    $(".c-scoreboard__points", plate).textContent = String(inn);
    plate.setAttribute(
      "aria-label",
      t("{name}, {colour}: {n} of 5 balls in, {wins} games won, {fouls} fouls", {
        name: G.names[p],
        colour: t(COL[c]),
        n: inn,
        wins: G.wins[p],
        fouls: f,
      }),
    );
    const inp = $<HTMLInputElement>("#name" + p);
    if (document.activeElement !== inp) inp.value = G.names[p];
    inp.disabled = G.mode === "online" || (G.mode === "cpu" && p === 1); // online, names come from the café
    const side = G.mode === "online" ? team(p) : [];
    $(".c-player-row__seat", row).innerHTML =
      G.mode === "cpu" && p === 1 && app.opp
        ? `${esc(t(app.opp.nick))} · <span class="c-gtag" style="--g:${gradeOf(app.opp).color}">${esc(t(gradeOf(app.opp).label))}</span>`
        : G.mode !== "online" || !net.ready
          ? ""
          : !side.length
            ? esc(t("Free seat"))
            : side.includes(net.uid)
              ? esc(t("You"))
              : esc(t("Opponent"));
  }
  $("#netNote").textContent =
    G.mode === "cpu"
      ? t("You play white in game 1 and red in game 2. {name} takes the other colour.", { name: app.opp?.name || "" })
      : G.mode === "local"
        ? t("Two players on this screen. The camera moves to whoever is up.")
        : cafeNote();
  drawCafeBox();
  $("#gameLbl").textContent = t("GAME {n}", { n: G.manche });
  $("#venueLbl").textContent = C.venue ? t(venueById(C.venue.id).name) : t("best of 3");
  const [m, h] = statusText();
  $("#stMain").textContent = m;
  $("#stHint").textContent = h;
  $("#penBox").hidden = app.show || !(G.phase === "penalty" && canAct(other(ball(G.penChoice!.id).c)));
  endcard();
  $("#log").innerHTML = G.log
    .slice(-14)
    .reverse()
    .map(
      (e) =>
        `<li class="c-log__item"><span class="c-log__n">#${esc(e.n)}</span><span class="c-log__dot" data-c="${esc(e.c || "")}"></span><span class="c-log__text c-log__text--${esc(e.kind)}">${esc(tLog(e.text, e.v))}${e.why ? `<span class="c-log__why">${esc(tLog(e.why, e.v))}</span>` : ""}</span></li>`,
    )
    .join("");
  const e = G.log[G.log.length - 1],
    key = e ? JSON.stringify([e.n, e.text, e.v]) : "";
  if (e && (key !== lastTick || lang !== tickLang)) {
    const tk = $("#ticker");
    $(".c-ticker__tag", tk).textContent = t(e.kind === "fout" ? "Foul" : e.kind === "doel" ? "Goal" : "Referee");
    $(".c-ticker__text", tk).textContent = tLog(e.text, e.v);
    $(".c-ticker__why", tk).textContent = e.why ? tLog(e.why, e.v) : "";
    if (key !== lastTick) replay(tk, "is-shown"); // a new line pops up; a language switch only rewrites it
    lastTick = key;
    tickLang = lang;
  }
}
