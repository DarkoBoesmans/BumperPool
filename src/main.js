// Boot, the game loop, input, the opponent's turns and the goal / foul show.
import * as game from "./game.js";
import {
  G,
  hooks,
  step,
  allStill,
  trackTri,
  fire,
  choosePen,
  newMatch,
  newManche,
  setG,
  ball,
  other,
  nameOf,
  att,
  R,
  DOP_R,
  DOPS,
  HX,
  HY,
  PULL_MAX,
  timeout,
  log,
  remaining,
} from "./game.js";
import {
  S,
  camS,
  initScene,
  setFx,
  render,
  toTable,
  paintCloth,
  updatePlaques,
  updateBalls,
  updateAim,
  updateCamera,
  toFree,
} from "./scene.js";
import {
  C,
  buildCafe,
  updateCafe,
  updateBoards,
  fontsChanged,
  setPlayers,
  emote,
} from "./cafe.js";
import {
  rec,
  recStart,
  recTick,
  recStop,
  hasShot,
  startReplay,
  stopReplay,
  stepReplay,
  frozen,
  play,
} from "./replay.js";
import { planCpu, think, shaky } from "./cpu.js";
import { findOpponent } from "./opponents.js";
import { initAudio, sfx } from "./audio.js";
import {
  net,
  available,
  joinOnline,
  leaveOnline,
  push,
  settle,
  sendEmote,
  netHooks,
  takeSeat,
  leaveSeat,
} from "./net.js";
import {
  $,
  $$,
  app,
  canAct,
  viewColor,
  renderUI,
  liveUI,
  say,
  quip,
  banner,
  replayOverlay,
  replayFrozen,
  setSpin,
  initSpinPad,
  showView,
  pickedOpponent,
  initTutorial,
  initSettings,
  initTabs,
} from "./ui.js";

const portrait = () => S.w < S.h;
let dirty = false;
function changed() {
  if (app.syncShown) {
    app.shown = G.lastShot?.n ?? -1;
    app.syncShown = false;
  }
  if (dirty) return;
  dirty = true;
  queueMicrotask(() => {
    dirty = false;
    refresh();
    maybePresent();
  });
}
function refresh() {
  renderUI();
  paintCloth(clothMarks());
  updatePlaques(nameOf);
  updateBoards({
    G,
    opp: G.mode === "cpu" ? app.opp : findOpponent("baron"),
    turnName: nameOf(G.turn),
  });
}
hooks.changed = changed;
hooks.push = () => push();
hooks.sfx = sfx;
hooks.frame = recTick;
netHooks({ changed, emote: (c, kind) => doEmote(c, kind, false) });

// Rings on the cloth: your selectable balls, balls that must leave the triangle, the opening ball, penalty spots.
function clothMarks() {
  const marks = [],
    pens = [];
  if (app.show) return { marks, pens };
  if (G.phase === "aim" && canAct(G.turn))
    for (const b of G.balls)
      if (b.on && b.c === G.turn) {
        marks.push({
          x: b.x,
          y: b.y,
          r: R + 7,
          color: "rgba(255,245,225,.45)",
          w: 5,
        });
        if (G.turnInfo.obligated.includes(b.id) && !G.turnInfo.left[b.id])
          marks.push({
            x: b.x,
            y: b.y,
            r: R + 15,
            color: "#ffb347",
            w: 6,
            dash: [10, 7],
          });
      }
  const oc = G.phase === "openW" ? "W" : G.phase === "openR" ? "R" : null;
  if (oc && canAct(oc)) {
    const b = ball(G.open.ids[oc]);
    marks.push({
      x: b.x,
      y: b.y,
      r: R + 10,
      color: "rgba(255,245,225,.8)",
      w: 6,
    });
  }
  if (
    G.phase === "penalty" &&
    G.penChoice &&
    canAct(other(ball(G.penChoice.id).c))
  )
    pens.push(...G.penChoice.opts);
  return { marks, pens };
}

// ---------- aiming ----------
function castRay(ox, oy, dx, dy, self) {
  let best = 1e9,
    hit = null;
  for (const [ok, t] of [
    [dx > 0, (HX - R - ox) / dx],
    [dx < 0, (-HX + R - ox) / dx],
    [dy > 0, (HY - R - oy) / dy],
    [dy < 0, (-HY + R - oy) / dy],
  ])
    if (ok && t >= 0 && t < best) {
      best = t;
      hit = { type: "band" };
    }
  const circ = (px, py, rad, info) => {
    const fx = ox - px,
      fy = oy - py,
      b = fx * dx + fy * dy,
      c = fx * fx + fy * fy - rad * rad,
      disc = b * b - c;
    if (disc < 0) return;
    const t = -b - Math.sqrt(disc);
    if (t > 0.01 && t < best) {
      best = t;
      hit = info;
    }
  };
  for (const q of G.balls)
    if (q.on && q.id !== self) circ(q.x, q.y, 2 * R, { type: "ball", b: q });
  for (const d of DOPS) circ(d.x, d.y, R + DOP_R, { type: "dop" });
  return { t: best, hit };
}
function shotFrom(d) {
  const b = ball(d.id);
  if (!b) return null;
  const px = d.x - b.x,
    py = d.y - b.y,
    len = Math.hypot(px, py);
  if (len < R * 0.8) return null;
  return {
    dx: -px / len,
    dy: -py / len,
    p: Math.min(1, Math.max(0, (len - R) / PULL_MAX)),
    sx: d.sx ?? app.spin.x,
    sy: d.sy ?? app.spin.y,
  };
}
const blocked = () =>
  !app.inGame || app.show || !$("#start").hidden || !$("#settings").hidden;

function onDown(e) {
  if (e.button === 2) {
    toFree();
    S.orbit = { x: e.clientX, y: e.clientY };
    e.target.setPointerCapture(e.pointerId);
    return;
  }
  if (e.button !== 0 || blocked()) return;
  initAudio();
  const w = toTable(e);
  if (!w) return;
  if (G.phase === "penalty" && G.penChoice) {
    if (!canAct(other(ball(G.penChoice.id).c))) return;
    const i = G.penChoice.opts.findIndex(
      (o) => Math.hypot(o.x - w.x, o.y - w.y) < R * 1.8,
    );
    if (i >= 0) choosePen(i);
    return;
  }
  let cand = [];
  if (G.phase === "aim" && canAct(G.turn))
    cand = G.balls.filter((b) => b.on && b.c === G.turn);
  else if (G.phase === "openW" && canAct("W")) cand = [ball(G.open.ids.W)];
  else if (G.phase === "openR" && canAct("R")) cand = [ball(G.open.ids.R)];
  let best = null,
    bd = R * 2.4;
  for (const b of cand) {
    const d = Math.hypot(b.x - w.x, b.y - w.y);
    if (d < bd) {
      bd = d;
      best = b;
    }
  }
  if (best) {
    app.drag = { id: best.id, x: w.x, y: w.y };
    e.target.setPointerCapture(e.pointerId);
    e.preventDefault();
  }
}
function onMove(e) {
  if (S.orbit) {
    camS.az += (e.clientX - S.orbit.x) * 0.006;
    camS.el = Math.min(
      1.5,
      Math.max(0.08, camS.el + (e.clientY - S.orbit.y) * 0.005),
    );
    S.orbit = { x: e.clientX, y: e.clientY };
    setViewPills();
    return;
  }
  const d = app.drag;
  if (!d || d.cpu) return;
  const w = toTable(e);
  if (w) {
    d.x = w.x;
    d.y = w.y;
  }
}
function onUp() {
  if (S.orbit) {
    S.orbit = null;
    return;
  }
  const d = app.drag;
  if (!d || d.cpu) return;
  app.drag = null;
  const s = shotFrom(d);
  if (s && s.p >= 0.02 && !blocked()) {
    fire(d.id, s);
    setSpin(0, 0);
  }
}

// ---------- emotes ----------
function doEmote(c, kind, mine) {
  const firstPerson = mine && camS.mode === "player";
  const r = emote(c, kind, firstPerson);
  if (r === "empty") {
    if (mine) say("Marcel", "Easy. Your glass is on its way.", null, 2400);
    return;
  }
  if (r !== "ok") return;
  if (kind === "glass" && G.mode === "cpu" && c === G.colorOf[1])
    app.oppSips = (app.oppSips || 0) + 1; // some regulars get shakier with every sip
  if (kind === "cigar") {
    sfx("lighter");
    setTimeout(() => sfx("puff"), 350);
  } else sfx("sip");
  if (mine && G.mode === "online") sendEmote(c, kind);
}

// ---------- the opponent's turn ----------
function cpuTick(now) {
  if (G.mode !== "cpu" || blocked()) {
    if (app.cpu?.aiming) {
      app.drag = null;
      app.cpu = null;
    }
    return;
  }
  const cc = G.colorOf[1],
    ai = app.opp.ai;
  if (!app.cpu) {
    const aiming =
      (G.phase === "aim" && G.turn === cc) ||
      (G.phase === "openW" && cc === "W") ||
      (G.phase === "openR" && cc === "R");
    if (aiming) {
      app.cpu = planCpu(cc, ai);
      app.cpu.readyAt = now + ai.think;
      const r = Math.random(),
        h = app.opp.habits;
      if (r < h.smoke * 0.45) doEmote(cc, "cigar", false);
      else if (r < (h.smoke + h.drink) * 0.45) doEmote(cc, "glass", false);
    } else if (G.phase === "penalty" && other(ball(G.penChoice.id).c) === cc)
      app.cpu = {
        act: () => choosePen(Math.random() < 0.5 ? 0 : 1),
        readyAt: now + 900,
      };
    return;
  }
  const j = app.cpu;
  if (j.act) {
    if (now >= j.readyAt) {
      app.cpu = null;
      j.act();
    }
    return;
  }
  if (!think(j)) return;
  if (!j.shot) {
    j.shot = shaky(
      j.best,
      ai,
      1 + (ai.tipsy || 0) * Math.min(4, app.oppSips || 0),
    );
    j.aimAt = Math.max(now, j.readyAt - 800);
    j.walkUntil = now + 4500;
  }
  if (now < j.aimAt) return;
  if (!j.aiming) {
    // wait until they have walked round to the ball
    if (!C.figs[cc]?.atStance && now < j.walkUntil) return;
    j.aiming = true;
    j.aimAt = now;
  }
  const b = ball(j.best.id),
    k = Math.min(1, (now - j.aimAt) / 650),
    len = R + j.shot.p * PULL_MAX * (1 - Math.pow(1 - k, 3));
  app.drag = {
    id: b.id,
    x: b.x - j.shot.dx * len,
    y: b.y - j.shot.dy * len,
    cpu: true,
    sx: j.shot.sx,
    sy: j.shot.sy,
  };
  if (now - j.aimAt > 900) {
    app.drag = null;
    app.cpu = null;
    fire(b.id, j.shot);
  }
}

// ---------- the show: banner, replay, more banner ----------
async function maybePresent() {
  const L = G.lastShot;
  if (!L || L.n <= app.shown || app.show || G.phase === "moving" || !app.inGame)
    return;
  app.shown = L.n;
  app.show = true;
  app.drag = null;
  renderUI();
  try {
    await present(L);
  } finally {
    app.show = false;
    refresh();
  }
}
function goalsOf(L) {
  const own = L.pots.filter(
    (p) => (L.shooter ? p.c === L.shooter : true) && p.h === att(p.c),
  );
  const gifts = L.shooter ? L.pots.filter((p) => p.c !== L.shooter) : [];
  return { own, gifts };
}
async function present(L) {
  const cpu = G.mode === "cpu",
    cc = G.colorOf[1],
    replays = app.set.replays,
    can = hasShot(L.n) && replays !== "off";
  const nm = (c) => nameOf(c);
  const { own, gifts } = goalsOf(L);
  if (L.foul) {
    const f = L.foul,
      time = f.key === "time";
    sfx("foul");
    setTimeout(() => sfx("stamp"), 180);
    if (cpu) quip(f.c === cc ? "foul" : "oppFoul");
    await banner(
      time ? "time" : "foul",
      time ? "TIME!" : "FOUL!",
      nm(f.c),
      f.title,
    );
    if (!time && can) await runReplay({ kind: "foul", foul: f }, f);
  }
  if (L.end) {
    const w = L.winner,
      pot = [...L.pots].reverse().find((p) => p.c === w);
    if (pot && can) await runReplay({ kind: "win", pot });
    sfx("win");
    if (cpu && L.end === "match") quip(w === cc ? "win" : "lose");
    const p = G.colorOf.indexOf(w);
    await banner(
      L.end,
      L.end === "match" ? "MATCH!" : "GAME!",
      G.names[p],
      L.end === "match"
        ? `Wins ${G.wins[p]}-${G.wins[1 - p]}`
        : `Game ${G.manche} · ${G.wins[0]}-${G.wins[1]}`,
      2800,
    );
    return;
  }
  if (L.foul) return;
  if (own.length) {
    const c = own[0].c,
      left = remaining(c);
    sfx("goal");
    if (cpu) quip(c === cc ? "goal" : "oppGoal");
    await banner(
      "goal",
      "GOAL!",
      nm(c),
      own.length > 1
        ? `${own.length} in one shot!`
        : left === 1
          ? "One to go"
          : `${left} to go`,
    );
    if (can && replays === "all")
      await runReplay({ kind: "goal", pot: own[own.length - 1] });
  } else if (gifts.length) {
    const c = gifts[0].c;
    sfx("gift");
    if (cpu) quip(c === cc ? "oppGoal" : "goal");
    await banner(
      "gift",
      "GIFT!",
      nm(c),
      `${nm(L.shooter)} scored for ${nm(c)}`,
    );
    if (can && replays === "all")
      await runReplay({ kind: "goal", pot: gifts[gifts.length - 1] });
  }
}
const skip = () => {
  if (play.on) stopReplay();
};
function runReplay(m, foul) {
  startReplay(m);
  replayOverlay(m, foul);
  return new Promise((res) => {
    app.replayDone = () => {
      replayOverlay(null);
      res();
    };
  });
}

// ---------- menus and buttons ----------
function setViewPills() {
  $("#vPlayer").setAttribute("aria-pressed", camS.mode === "player");
  $("#vTop").setAttribute("aria-pressed", camS.mode === "top");
}
function openStart(v = "home") {
  $("#start").hidden = false;
  $("#hud").hidden = true;
  camS.mode = "intro";
  showView(v);
  renderUI();
}
function enterGame() {
  app.inGame = true;
  initAudio();
  app.cpu = null;
  app.drag = null;
  $("#start").hidden = true;
  $("#hud").hidden = false;
  camS.mode = portrait() ? "top" : "player";
  setViewPills(); // on a phone held upright the top view plays best
  const h = $("#orbitHint");
  h.style.animation = "none";
  void h.offsetWidth;
  h.style.animation = "";
  refresh();
}
function startCpu() {
  leaveOnline();
  const o = (app.opp = pickedOpponent()),
    me = $("#nMe").value.trim() || "Player";
  setG(null);
  newMatch("cpu", { opp: o.id, names: [me, o.name] });
  app.shown = -1;
  app.oppSips = 0;
  setPlayers([null, o.look]);
  enterGame();
  setTimeout(() => quip("hello"), 900);
}
function startLocal() {
  leaveOnline();
  setG(null);
  newMatch("local", {
    names: [
      $("#n0").value.trim() || "Player 1",
      $("#n1").value.trim() || "Player 2",
    ],
  });
  app.shown = -1;
  setPlayers([null, null]);
  enterGame();
}
async function startOnline() {
  const err = $("#onlineErr"),
    btn = $("#btnJoin");
  err.hidden = true;
  btn.disabled = true;
  btn.querySelector("span").textContent = "Connecting…";
  try {
    app.syncShown = true;
    await joinOnline(
      $("#tableName").value,
      $("#nOnline").value.trim() || "Player",
    );
    setPlayers([null, null]);
    enterGame();
  } catch (e) {
    err.textContent = e.message;
    err.hidden = false;
  } finally {
    btn.disabled = false;
    btn.querySelector("span").textContent = "Join table";
  }
}

function wire() {
  const cv = S.renderer.domElement;
  cv.addEventListener("contextmenu", (e) => e.preventDefault());
  cv.addEventListener("pointerdown", onDown);
  cv.addEventListener("pointermove", onMove);
  cv.addEventListener("pointerup", onUp);
  cv.addEventListener("pointercancel", () => {
    if (app.drag && !app.drag.cpu) app.drag = null;
    S.orbit = null;
  });
  cv.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      toFree();
      camS.dist = Math.min(
        6,
        Math.max(0.6, camS.dist * Math.pow(1.0015, e.deltaY)),
      );
      setViewPills();
    },
    { passive: false },
  );

  $$("[data-go]").forEach((b) =>
    b.addEventListener("click", () => showView(b.dataset.go)),
  );
  $("#btnChallenge").addEventListener("click", startCpu);
  $("#btnPlayLocal").addEventListener("click", startLocal);
  $("#btnJoin").addEventListener("click", startOnline);
  $("#btnResume").addEventListener("click", enterGame);
  available().then((ok) => {
    $("#onlineOff").hidden = ok;
  });

  $("#pen1").addEventListener("click", () => choosePen(0));
  $("#pen2").addEventListener("click", () => choosePen(1));
  $("#btnNext").addEventListener("click", () => {
    if (G.phase === "matchEnd") {
      newMatch();
      app.shown = -1;
      app.oppSips = 0;
      if (G.mode === "cpu") setTimeout(() => quip("hello"), 700);
    } else newManche();
    push();
    refresh();
  });
  $("#ecMenu").addEventListener("click", () => openStart("home"));
  $("#ecPick").addEventListener("click", () => openStart("pick"));
  $("#vPlayer").addEventListener("click", () => {
    camS.mode = "player";
    setViewPills();
  });
  $("#vTop").addEventListener("click", () => {
    camS.mode = "top";
    setViewPills();
  });
  $("#btnCigar").addEventListener("click", () =>
    doEmote(viewColor(), "cigar", true),
  );
  $("#btnWhisky").addEventListener("click", () =>
    doEmote(viewColor(), "glass", true),
  );
  $("#rSkip").addEventListener("click", skip);
  const sheet = (open) => {
    $("#sheet").classList.toggle("open", open);
    $("#sheet").inert = !open;
    $("#btnSheet").setAttribute("aria-expanded", open);
    (open ? $("#btnClose") : $("#btnSheet")).focus();
  };
  $("#btnSheet").addEventListener("click", () =>
    sheet(!$("#sheet").classList.contains("open")),
  );
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
    if (k === "clock") game.resetTimer();
  });
  initSpinPad();
  initTutorial();
  initTabs($("#sheet [role=tablist]"));
  for (const p of [0, 1]) {
    $("#name" + p).addEventListener("input", (e) => {
      G.names[p] = e.target.value.trim() || `Player ${p + 1}`;
      refresh();
    });
    $("#name" + p).addEventListener("change", () => push());
  }
  $("#sheet").addEventListener("click", (e) => {
    const t = e.target.closest("[data-seat],[data-leave]");
    if (!t || !net.uid) return;
    if (t.dataset.seat) takeSeat(+t.dataset.seat);
    else leaveSeat(+t.dataset.leave);
  });
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea")) return;
    if (e.key === "Escape") {
      if (!$("#settings").hidden) openSettings(false);
      else if ($("#sheet").classList.contains("open")) sheet(false);
      else if (play.on) skip();
      else if (!$("#start").hidden && app.inGame) enterGame();
      return;
    }
    if (!app.inGame || !$("#start").hidden) return;
    const k = {
      ArrowUp: [0, 0.2],
      ArrowDown: [0, -0.2],
      ArrowLeft: [-0.2, 0],
      ArrowRight: [0.2, 0],
    }[e.key];
    if (k && e.target.id !== "cueball") {
      e.preventDefault();
      setSpin(app.spin.x + k[0], app.spin.y + k[1]);
    } else if (e.key === "0") setSpin(0, 0);
    else if (e.key === "t" || e.key === "T") {
      camS.mode = camS.mode === "top" ? "player" : "top";
      setViewPills();
    } else if (e.key === "p" || e.key === "P") {
      camS.mode = "player";
      setViewPills();
    } else if (e.key === "1") doEmote(viewColor(), "cigar", true);
    else if (e.key === "2") doEmote(viewColor(), "glass", true);
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest("button")) {
      initAudio();
      sfx("ui");
    }
  });
  C.say = (who, text) => say(who, text, null, 3000);
}

// ---------- loop ----------
let last = performance.now(),
  acc = 0,
  boardTick = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (G.phase === "moving") {
    if (!rec.active && rec.n !== G.strokeNo) recStart(G.strokeNo);
    acc += dt;
    const h = 1 / 600;
    let n = 0;
    while (acc >= h && n < 60) {
      step(h);
      acc -= h;
      n++;
    }
    trackTri();
    if (allStill()) {
      acc = 0;
      recStop();
      settle();
    }
  } else if (
    G.phase === "aim" &&
    app.set.clock &&
    !app.drag &&
    canAct(G.turn) &&
    !blocked()
  ) {
    G.timeLeft -= dt;
    if (G.timeLeft <= 15 && !G.warned) {
      G.warned = true;
      log(G.turn, "info", `15 seconds left for ${nameOf(G.turn)}.`);
      changed();
    }
    if (G.timeLeft <= 0) timeout();
  }
  cpuTick(now);
  let f = null;
  if (play.on) {
    const wasFrozen = frozen();
    f = stepReplay(dt);
    if (frozen() !== wasFrozen) replayFrozen(frozen(), play.m?.foul);
  }
  if (!play.on && app.replayDone) {
    const done = app.replayDone;
    app.replayDone = null;
    done();
  }
  updateBalls(G.balls, now, f);
  const d = app.drag,
    s = d && !play.on ? shotFrom(d) : null;
  updateAim(s ? ball(d.id) : null, s, castRay);
  updateCamera(dt, viewColor(), portrait());
  const cj = app.cpu,
    aim = play.on
      ? null
      : s
        ? { b: ball(d.id), s, drawn: true }
        : cj?.shot && cj.best
          ? { b: ball(cj.best.id), s: cj.shot, drawn: false }
          : null;
  updateCafe(dt, now, { G, vc: viewColor(), aim });
  liveUI(s, s ? ball(d.id) : null);
  if ((boardTick -= dt) < 0) {
    boardTick = 1;
    updateBoards({
      G,
      opp: G.mode === "cpu" ? app.opp : findOpponent("baron"),
      turnName: nameOf(G.turn),
    });
  }
  render(now);
  requestAnimationFrame(frame);
}

// ---------- boot ----------
function boot() {
  newMatch("local");
  if (!initScene($("#stage"))) {
    $("#stage").innerHTML =
      '<p class="nogl">This device does not support WebGL, which the 3D café needs.</p>';
    return;
  }
  S.lines = app.set.lines;
  setFx(app.set.fx);
  buildCafe(S.scene);
  setPlayers([null, null]);
  wire();
  document.fonts?.ready.then(() => {
    fontsChanged();
    refresh();
  });
  openStart("home");
  refresh();
  window.golfbiljart = {
    app,
    S,
    C,
    camS,
    game,
    get G() {
      return G;
    },
    debug: { recStart, recStop, settle },
  }; // handy in the console
  requestAnimationFrame(frame);
}
boot();
