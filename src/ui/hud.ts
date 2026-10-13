// The HUD after every change: scoreboard, the match drawer, the ribbon, the referee ticker, the end card.
import { G, ball, fouls, remaining } from "../core/state";
import { COL, other } from "../core/table";
import { gradeOf } from "../data/regulars";
import { venueById } from "../data/venues";
import { net } from "../net/online";
import { C } from "../cafe";
import { $, esc, replay } from "./dom";
import { app, canAct } from "./app";
import { statusText } from "./status";
import { endcard } from "./endcard";

let lastTick = "";

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
    $(".c-scoreboard__name", plate).textContent = G.names[p];
    $(".c-scoreboard__pips", plate).innerHTML = Array.from(
      { length: 5 },
      (_, i) => `<i class="c-scoreboard__pip${i < inn ? " is-in" : ""}"></i>`,
    ).join("");
    const fl = $(".c-scoreboard__fouls", plate);
    fl.textContent = f ? `${f} foul${f > 1 ? "s" : ""}` : "clean";
    fl.classList.toggle("is-bad", f > 0);
    $(".c-scoreboard__wins", plate).innerHTML = [0, 1]
      .map((i) => `<i class="c-scoreboard__win${G.wins[p] > i ? " is-on" : ""}"></i>`)
      .join("");
    $(".c-scoreboard__points", plate).textContent = String(inn);
    plate.setAttribute(
      "aria-label",
      `${G.names[p]}, ${COL[c]}: ${inn} of 5 balls in, ${G.wins[p]} games won, ${f} fouls`,
    );
    const inp = $<HTMLInputElement>("#name" + p);
    if (document.activeElement !== inp) inp.value = G.names[p];
    inp.disabled = (G.mode === "online" && G.seats[p] !== net.uid) || (G.mode === "cpu" && p === 1);
    const s = G.seats[p];
    $(".c-player-row__seat", row).innerHTML =
      G.mode === "cpu" && p === 1 && app.opp
        ? `${esc(app.opp.nick)} · <span class="c-gtag" style="--g:${gradeOf(app.opp).color}">${gradeOf(app.opp).label}</span>`
        : G.mode !== "online" || !net.ready
          ? ""
          : !s
            ? net.canWrite
              ? `<button class="c-link" type="button" data-seat="${p}">Take this seat</button>`
              : "Free seat"
            : s === net.uid
              ? `You <button class="c-link" type="button" data-leave="${p}">Leave seat</button>`
              : "Opponent";
  }
  $("#netNote").textContent =
    G.mode === "cpu"
      ? `You play white in game 1 and red in game 2. ${app.opp?.name} takes the other colour.`
      : G.mode === "local"
        ? "Two players on this screen. The camera moves to whoever is up."
        : net.canWrite
          ? "Online table. Your opponent joins the same table name from their device."
          : "You are watching. Ask the owner for edit access to play.";
  $("#gameLbl").textContent = `GAME ${G.manche}`;
  $("#venueLbl").textContent = C.venue ? venueById(C.venue.id).name : "best of 3";
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
        `<li class="c-log__item"><span class="c-log__n">#${esc(e.n)}</span><span class="c-log__dot" data-c="${esc(e.c || "")}"></span><span class="c-log__text c-log__text--${esc(e.kind)}">${esc(e.text)}${e.why ? `<span class="c-log__why">${esc(e.why)}</span>` : ""}</span></li>`,
    )
    .join("");
  const e = G.log[G.log.length - 1],
    key = e ? e.n + e.text : "";
  if (e && key !== lastTick) {
    lastTick = key;
    const t = $("#ticker");
    $(".c-ticker__tag", t).textContent = e.kind === "fout" ? "Foul" : e.kind === "doel" ? "Goal" : "Referee";
    $(".c-ticker__text", t).textContent = e.text;
    $(".c-ticker__why", t).textContent = e.why || "";
    replay(t, "is-shown");
  }
}
