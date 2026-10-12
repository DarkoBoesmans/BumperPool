// The end of a game: a poster bill in the middle with the winner's first name, the score and what's next.
import { G, fouls, remaining } from "../core/state";
import { COL, other } from "../core/table";
import { paintPortrait } from "../people/portrait";
import { $, first } from "./dom";
import { app } from "./app";

export function endcard(): void {
  const on = app.inGame && !app.show && $("#start").hidden && (G.phase === "mancheEnd" || G.phase === "matchEnd"),
    el = $("#endcard");
  if (el.hidden === on) {
    el.hidden = !on;
    document.body.classList.toggle("is-ending", on);
    if (on) setTimeout(() => $("#btnNext").focus({ preventScroll: true }), 400);
  }
  if (!on) return;
  const w = G.endWinner!,
    match = G.phase === "matchEnd",
    cpu = G.mode === "cpu",
    o = app.opp;
  el.classList.toggle("c-endcard--match", match);
  $("#ecName").textContent = first(G.names[w]);
  $("#ecWhat").textContent = match ? "takes the match" : `wins game ${G.manche}`;
  for (const p of [0, 1]) {
    const c = G.colorOf[p],
      s = $("#ec" + p),
      f = fouls(c);
    $(".c-ball", s).dataset.c = c;
    s.classList.toggle("is-won", p === w);
    $(".c-endcard__side-name", s).textContent = first(G.names[p]);
    $(".c-endcard__side-stat", s).textContent = `${5 - remaining(c)} of 5 in · ${f} foul${f === 1 ? "" : "s"}`;
    $("#ecS" + p).textContent = String(G.wins[p]);
  }
  const medal = $("#ecMedal"),
    face = cpu && w === 1 && !!o;
  medal.classList.toggle("is-face", face);
  if (face && o && medal.dataset.opp !== o.id) {
    medal.dataset.opp = o.id;
    paintPortrait($<HTMLCanvasElement>("#ecFace"), o);
  }
  const next = (p: number) => COL[other(G.colorOf[p])],
    n = G.manche + 1;
  let note = match
    ? cpu && o
      ? w === 0
        ? `${first(o.name)} buys the next round. Fancy another go?`
        : `${first(o.name)} keeps the table. Rematch?`
      : `Final score ${G.wins[w]}:${G.wins[1 - w]} in games.`
    : cpu
      ? `Colours swap: you play ${next(0)} in game ${n}.`
      : `Colours swap: ${first(G.names[0])} plays ${next(0)} in game ${n}.`;
  if (app.endNote) note = `${app.endNote} ${note}`;
  $("#ecNote").textContent = note;
  const rw = $("#ecReward");
  rw.hidden = !(match && app.reward);
  rw.textContent = app.reward;
  $("#btnNext .c-btn__label").textContent = match ? "Rematch" : `Play game ${n}`;
  const pick = $("#ecPick");
  pick.hidden = !(match && cpu);
  $(".c-btn__label", pick).textContent = app.freeplay ? "Freeplay" : "Back to the story";
}
