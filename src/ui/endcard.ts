// The end of a game: a poster bill in the middle with the winner's first name, the score and what's next.
import { G, fouls, remaining } from "../core/state";
import { t } from "../i18n";
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
  $("#ecWhat").textContent = match ? t("takes the match") : t("wins game {n}", { n: G.manche });
  for (const p of [0, 1]) {
    const c = G.colorOf[p],
      s = $("#ec" + p),
      f = fouls(c);
    $(".c-ball", s).dataset.c = c;
    s.classList.toggle("is-won", p === w);
    $(".c-endcard__side-name", s).textContent = first(G.names[p]);
    $(".c-endcard__side-stat", s).textContent = t(f === 1 ? "{n} of 5 in · 1 foul" : "{n} of 5 in · {f} fouls", {
      n: 5 - remaining(c),
      f,
    });
    $("#ecS" + p).textContent = String(G.wins[p]);
  }
  const medal = $("#ecMedal"),
    face = cpu && w === 1 && !!o;
  medal.classList.toggle("is-face", face);
  if (face && o && medal.dataset.opp !== o.id) {
    medal.dataset.opp = o.id;
    paintPortrait($<HTMLCanvasElement>("#ecFace"), o);
  }
  const next = (p: number) => t(COL[other(G.colorOf[p])]),
    n = G.manche + 1;
  let note = match
    ? cpu && o
      ? w === 0
        ? t("{name} buys the next round. Fancy another go?", { name: first(o.name) })
        : t("{name} keeps the table. Rematch?", { name: first(o.name) })
      : t("Final score {a}:{b} in games.", { a: G.wins[w], b: G.wins[1 - w] })
    : cpu
      ? t("Colours swap: you play {colour} in game {n}.", { colour: next(0), n })
      : t("Colours swap: {name} plays {colour} in game {n}.", { name: first(G.names[0]), colour: next(0), n });
  if (app.endNote) note = `${app.endNote} ${note}`;
  $("#ecNote").textContent = note;
  const rw = $("#ecReward");
  rw.hidden = !(match && app.reward);
  rw.textContent = app.reward;
  $("#btnNext .c-btn__label").textContent = match ? t("Rematch") : t("Play game {n}", { n });
  const pick = $("#ecPick");
  pick.hidden = !(match && cpu);
  $(".c-btn__label", pick).textContent = t(app.freeplay ? "Freeplay" : "Back to the story");
}
