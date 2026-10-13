// Boot: build the 3D café, wire the buttons, open the start menu, start the loop.
import * as core from "./core";
import { G, hooks, newMatch, choosePen, resetTimer } from "./core";
import { S, initScene, setFx } from "./render/renderer";
import { camS } from "./render/camera";
import { buildTable } from "./render/table";
import { buildBalls } from "./render/balls";
import { buildAim } from "./render/aim";
import { buildSmoke } from "./render/smoke";
import { replaqueAll } from "./render/plaques";
import { buildCafe, fontsChanged, C } from "./cafe";
import { setPlayers, PL } from "./people/player";
import { recTick } from "./replay/recorder";
import { play } from "./replay/replay";
import { sfx } from "./audio/sfx";
import { initAudio } from "./audio/mixer";
import { net, available, netHooks, push, takeSeat, leaveSeat } from "./net/online";
import { me, saveMe } from "./profile/profile";
import { $, $$ } from "./ui/dom";
import { app, viewColor } from "./ui/app";
import { say } from "./ui/bubble";
import { banner } from "./ui/banner";
import { initSpinPad } from "./ui/spinpad";
import { initTabs } from "./ui/tabs";
import { initSettings } from "./ui/settings";
import { initHouse } from "./ui/house";
import { initTutorial } from "./ui/tutorial";
import { initKonami } from "./ui/konami";
import { showView, redrawView, type View } from "./ui/menu";
import { initLang } from "./ui/lang";
import { story, renderStory } from "./ui/story";
import { roster, renderRoster, pickedOpponent, pickOpponent } from "./ui/roster";
import { onMeSaved } from "./ui/maker";
import { shop } from "./ui/shop";
import { changed, refresh, applyLooks } from "./game/refresh";
import { doEmote } from "./game/buzz";
import { wireInput, gameKey } from "./game/input";
import { openStart, enterGame, startCpu, startLocal, startOnline, nextGame, setViewPills } from "./game/flow";
import { skipReplay } from "./game/show";
import { frame } from "./game/loop";
import { itemById } from "./data/shop";
import { t } from "./i18n";

hooks.changed = changed;
hooks.push = () => push();
hooks.sfx = sfx;
hooks.frame = recTick;
netHooks({ changed, emote: (c, kind) => doEmote(c, kind, false) });

function wireMenus(): void {
  for (const b of $$("[data-go]")) b.addEventListener("click", () => showView(b.dataset.go as View));
  story.play = (id) => startCpu(id, false);
  story.rematch = (id) => {
    pickOpponent(id);
    showView("pick");
  };
  roster.challenge = () => startCpu(pickedOpponent().id, true);
  $("#btnStory").addEventListener("click", () => story.go());
  $("#btnChallenge").addEventListener("click", roster.challenge);
  $("#btnPlayLocal").addEventListener("click", startLocal);
  $("#btnJoin").addEventListener("click", () => void startOnline());
  $("#btnResume").addEventListener("click", enterGame);
  available().then((ok) => {
    $("#onlineOff").hidden = ok;
  });
  onMeSaved(() => {
    if (!app.inGame) setPlayers([me.look, null]);
  });
  shop.changed = () => {
    applyLooks();
    if (!app.inGame) {
      setPlayers([me.look, null], [itemById(me.equip.cue)?.cue || null, null]);
      openStart("shop");
    }
  };
}

function wireGame(): void {
  $("#pen1").addEventListener("click", () => choosePen(0));
  $("#pen2").addEventListener("click", () => choosePen(1));
  $("#btnNext").addEventListener("click", nextGame);
  $("#ecMenu").addEventListener("click", () => openStart("home"));
  $("#ecPick").addEventListener("click", () => openStart(app.freeplay ? "pick" : "story"));
  $("#vPlayer").addEventListener("click", () => {
    camS.mode = "player";
    setViewPills();
  });
  $("#vTop").addEventListener("click", () => {
    camS.mode = "top";
    setViewPills();
  });
  $("#btnCigar").addEventListener("click", () => doEmote(viewColor(), "cigar", true));
  $("#btnWhisky").addEventListener("click", () => doEmote(viewColor(), "glass", true));
  $("#btnChalk").addEventListener("click", () => doEmote(viewColor(), "chalk", true));
  $("#btnKnock").addEventListener("click", () => doEmote(viewColor(), "knock", true));
  $("#knockNow").addEventListener("click", () => doEmote(viewColor(), "knock", true));
  $("#rSkip").addEventListener("click", skipReplay);
  const sheet = (open: boolean) => {
    const el = $("#sheet");
    el.classList.toggle("is-open", open);
    el.inert = !open;
    $("#btnSheet").setAttribute("aria-expanded", String(open));
    (open ? $("#btnClose") : $("#btnSheet")).focus();
  };
  $("#btnSheet").addEventListener("click", () => sheet(!$("#sheet").classList.contains("is-open")));
  $("#btnClose").addEventListener("click", () => sheet(false));
  $("#btnMenu").addEventListener("click", () => {
    sheet(false);
    openStart("home");
  });
  $("#btnTut2").addEventListener("click", () => {
    sheet(false);
    openStart("tutorial");
  });
  const openSettings = initSettings((k) => {
    if (k === "fx") setFx(app.set.fx);
    if (k === "lines") {
      S.lines = app.set.lines;
      refresh();
    }
    if (k === "cloth") {
      applyLooks();
      refresh();
    }
    if (k === "clock") resetTimer();
  });
  initSpinPad();
  initTutorial();
  initHouse();
  initTabs($("#sheet [role=tablist]"));
  for (const p of [0, 1]) {
    const inp = $<HTMLInputElement>("#name" + p);
    inp.addEventListener("input", () => {
      G.names[p] = inp.value.trim() || t("Player {n}", { n: p + 1 });
      refresh();
    });
    inp.addEventListener("change", () => push());
  }
  $("#sheet").addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>("[data-seat],[data-leave]");
    if (!t || !net.uid) return;
    if (t.dataset.seat) takeSeat(+t.dataset.seat);
    else leaveSeat(+t.dataset.leave!);
  });
  document.addEventListener("keydown", (e) => {
    const t = e.target as HTMLElement;
    if (e.key === "Enter" && t.dataset.enter) {
      e.preventDefault();
      $(t.dataset.enter).click(); // Enter in a name field presses its form's button
      return;
    }
    if (t.matches("input, textarea")) return;
    if (e.key === "Escape") {
      if (app.drag?.kb)
        app.drag = null; // let go of a keyboard aim
      else if (!$("#settings").hidden) openSettings(false);
      else if ($("#sheet").classList.contains("is-open")) sheet(false);
      else if (play.on) skipReplay();
      else if (!$("#start").hidden && app.inGame) enterGame();
      return;
    }
    if (!app.inGame || !$("#start").hidden) return;
    if (gameKey(e)) return;
    if (e.key === "1") doEmote(viewColor(), "cigar", true);
    else if (e.key === "2") doEmote(viewColor(), "glass", true);
    else if (e.key === "3") doEmote(viewColor(), "chalk", true);
    else if (e.key === "4") doEmote(viewColor(), "knock", true);
  });
  document.addEventListener("click", (e) => {
    if (!(e.target as HTMLElement).closest("button")) return;
    initAudio();
    sfx("ui");
  });
  initKonami(() => {
    if (me.pearl) return;
    me.pearl = true;
    saveMe();
    initAudio();
    sfx("win");
    void banner(
      "pearl",
      "PEARLESCENT!",
      t("Three legends walked in"),
      "Neptune, Minerva and Jupiter want a game",
      3400,
    );
    if (!$("#start").hidden) {
      const v = $("#panel").dataset.view;
      if (v === "story") renderStory();
      if (v === "pick") renderRoster();
    }
    refresh();
  });
}

function boot(): void {
  newMatch("local", { names: [t("Player {n}", { n: 1 }), t("Player {n}", { n: 2 })] });
  if (!initScene($("#stage"))) {
    const p = Object.assign(document.createElement("p"), {
      className: "c-stage__nogl",
      textContent: t("This device does not support WebGL, which the 3D café needs."),
    });
    $("#stage").replaceChildren(p);
    return;
  }
  S.lines = app.set.lines;
  setFx(app.set.fx);
  buildTable(S.scene);
  buildBalls(S.scene);
  buildAim(S.scene);
  buildSmoke(S.scene);
  buildCafe(S.scene);
  setPlayers([me.look, null], [itemById(me.equip.cue)?.cue || null, null]);
  applyLooks();
  wireInput();
  wireMenus();
  wireGame();
  C.say = (who, text) => say(who, text, null, 3000);
  document.fonts?.ready.then(() => {
    fontsChanged();
    replaqueAll();
    refresh();
  });
  openStart("home");
  refresh();
  initLang(() => {
    redrawView();
    fontsChanged();
    replaqueAll();
    refresh();
  });
  // handy in the console of a local build only: the published game keeps its state out of reach
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname))
    (window as unknown as Record<string, unknown>).tjoepbiljart = {
      app,
      S,
      C,
      camS,
      me,
      core,
      PL,
      startCpu,
      get G() {
        return G;
      },
    };
  requestAnimationFrame(frame);
}
boot();
