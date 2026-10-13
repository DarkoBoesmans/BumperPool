// Getting into a game and back out: the start menu, a story match, a freeplay rematch, two players, online.
import { G, setG, newMatch, newManche, REGLEMENT } from "../core";
import { S } from "../render/renderer";
import { camS } from "../render/camera";
import { setVenue } from "../cafe";
import { setPlayers } from "../people/player";
import { findOpponent, venueOf } from "../data/regulars";
import { itemById } from "../data/shop";
import { initAudio } from "../audio/mixer";
import { joinOnline, leaveOnline, push } from "../net/online";
import { me, myName, homeVenue, sawVenue } from "../profile/profile";
import { $ } from "../ui/dom";
import { app } from "../ui/app";
import { quip } from "../ui/bubble";
import { showView, type View } from "../ui/menu";
import { renderUI } from "../ui/hud";
import { pickOpponent } from "../ui/roster";
import { resetBuzz } from "./buzz";
import { t } from "../i18n";
import { applyLooks, refresh } from "./refresh";

const portrait = () => S.w < S.h;
const myCue = () => itemById(me.equip.cue)?.cue || null;

export function setViewPills(): void {
  $("#vPlayer").setAttribute("aria-pressed", String(camS.mode === "player"));
  $("#vTop").setAttribute("aria-pressed", String(camS.mode === "top"));
}

export function openStart(v: View = "home"): void {
  $("#start").hidden = false;
  $("#hud").hidden = true;
  camS.mode = "intro";
  if (!app.inGame) setVenue(homeVenue());
  showView(v);
  renderUI();
}

export function enterGame(): void {
  app.inGame = true;
  initAudio();
  app.cpu = null;
  app.drag = null;
  $("#start").hidden = true;
  $("#hud").hidden = false;
  camS.mode = portrait() ? "top" : "player"; // on a phone held upright the top view plays best
  setViewPills();
  const h = $("#orbitHint");
  h.style.animation = "none";
  void h.offsetWidth;
  h.style.animation = "";
  refresh();
}

function fresh(): void {
  app.shown = -1;
  app.oppSips = 0;
  app.endNote = "";
  app.reward = "";
  resetBuzz();
}

/** a match against a regular, in the story or as a freeplay rematch; it is played in their bar */
export function startCpu(id: string, freeplay: boolean): void {
  leaveOnline();
  const o = (app.opp = findOpponent(id));
  app.freeplay = freeplay;
  pickOpponent(o.id);
  setG(null);
  newMatch("cpu", { opp: o.id, names: [myName(), o.name], rules: freeplay ? app.set.house : REGLEMENT });
  fresh();
  setPlayers([me.look, o.look], [myCue(), null]);
  const v = venueOf(o);
  setVenue(v);
  sawVenue(v);
  applyLooks();
  enterGame();
  setTimeout(() => quip("hello"), 900);
}

/** two players at your home bar */
export function startLocal(): void {
  leaveOnline();
  app.opp = null;
  setG(null);
  newMatch("local", {
    names: [
      $<HTMLInputElement>("#n0").value.trim() || t("Player {n}", { n: 1 }),
      $<HTMLInputElement>("#n1").value.trim() || t("Player {n}", { n: 2 }),
    ],
  });
  fresh();
  setPlayers([me.look, null], [myCue(), null]);
  setVenue(homeVenue());
  applyLooks();
  enterGame();
}

export async function startOnline(): Promise<void> {
  const err = $("#onlineErr"),
    btn = $<HTMLButtonElement>("#btnJoin");
  err.hidden = true;
  btn.disabled = true;
  $(".c-btn__label", btn).textContent = "Connecting…";
  try {
    app.syncShown = true;
    app.opp = null;
    await joinOnline($<HTMLInputElement>("#tableName").value, $<HTMLInputElement>("#nOnline").value.trim() || myName());
    fresh();
    setPlayers([null, null]);
    setVenue(homeVenue());
    applyLooks();
    enterGame();
  } catch (e) {
    err.textContent = (e as Error).message;
    err.hidden = false;
  } finally {
    btn.disabled = false;
    $(".c-btn__label", btn).textContent = "Join table";
  }
}

/** the end card's big button: the next game, or a rematch */
export function nextGame(): void {
  app.endNote = "";
  app.reward = "";
  if (G.phase === "matchEnd") {
    newMatch(G.mode, { rules: G.rules }); // a rematch keeps the rules
    fresh();
    if (G.mode === "cpu") setTimeout(() => quip("hello"), 700);
  } else newManche();
  push();
  refresh();
}
