// Getting into a game and back out: the start menu, a story match, a freeplay rematch, two players, online.
import { G, setG, newMatch, newManche, REGLEMENT } from "../core";
import { S } from "../render/renderer";
import { camS } from "../render/camera";
import { setVenue, setGuests } from "../cafe";
import { setPlayers } from "../people/player";
import { findOpponent, venueOf } from "../data/regulars";
import { itemById } from "../data/shop";
import { initAudio } from "../audio/mixer";
import { leaveOnline, push, rotate } from "../net/online";
import { me, myName, homeVenue, sawVenue, beatenRegulars } from "../profile/profile";
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
/** your own café, with the regulars you beat at the bar */
const goHome = () => {
  setVenue(homeVenue());
  setGuests(beatenRegulars());
};
const myCue = () => itemById(me.equip.cue)?.cue || null;

export function setViewPills(): void {
  $("#vPlayer").setAttribute("aria-pressed", String(camS.mode === "player"));
  $("#vTop").setAttribute("aria-pressed", String(camS.mode === "top"));
}

export function openStart(v: View = "home"): void {
  $("#start").hidden = false;
  $("#hud").hidden = true;
  camS.mode = "intro";
  if (!app.inGame) goHome();
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
  setGuests([]);
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
  goHome();
  applyLooks();
  enterGame();
}

/** an online café, your own or someone else's: `walkIn` opens or joins it, then the table is set up around it */
export async function startOnline(walkIn: () => Promise<unknown>): Promise<void> {
  app.syncShown = true;
  app.opp = null;
  await walkIn();
  fresh();
  goHome();
  applyLooks();
  enterGame();
  refresh();
}

/** out of the café, back to the menu */
export function leaveCafe(): void {
  leaveOnline();
  app.inGame = false;
  openStart("online");
}

/** the end card's big button: the next game, or a rematch */
export function nextGame(): void {
  app.endNote = "";
  app.reward = "";
  if (G.phase === "matchEnd") {
    rotate(); // online: whoever lost makes way for the next name on the board
    newMatch(G.mode, { rules: G.rules }); // a rematch keeps the rules
    fresh();
    if (G.mode === "cpu") setTimeout(() => quip("hello"), 700);
  } else newManche();
  push();
  refresh();
}
