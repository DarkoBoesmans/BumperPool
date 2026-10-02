// Everything on the HTML side: scoreboard, ribbon, ticker, banners, end card, replay overlay, spin pad, menus, tutorial, settings.
import {
  G,
  COL,
  nameOf,
  remaining,
  fouls,
  ball,
  other,
  HARD,
  onderStoot,
  inKlein,
  inVlieg,
  START,
} from "./game.js";
import {
  OPPONENTS,
  GRADES,
  gradeOf,
  findOpponent,
  paintPortrait,
  pick,
} from "./opponents.js";
import { drawTable, FX_DEFAULTS } from "./scene.js";
import { headScreen } from "./cafe.js";
import { net } from "./net.js";
import { vol, setVol, juke, nextSong } from "./audio.js";

export const $ = (s) => document.querySelector(s);
export const $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch],
  );
const cap = (s) => s[0].toUpperCase() + s.slice(1);

const SKEY = "golfbiljart.settings";
export const app = {
  inGame: false,
  show: false,
  shown: -1,
  syncShown: false,
  opp: null,
  cpu: null,
  drag: null,
  spin: { x: 0, y: 0 },
  set: {
    replays: "all",
    clock: false,
    lines: true,
    opp: "fred",
    fx: { ...FX_DEFAULTS },
  },
};
try {
  const saved = JSON.parse(localStorage.getItem(SKEY) || "{}");
  Object.assign(app.set, saved, { fx: { ...FX_DEFAULTS, ...saved.fx } });
  if (saved.retro === false && !saved.fx) app.set.fx.ps2 = 0; // the old on/off PS2 switch
  delete app.set.retro;
} catch {
  /* defaults */
}
export const saveSettings = () => {
  try {
    localStorage.setItem(SKEY, JSON.stringify(app.set));
  } catch {
    /* fine */
  }
};

export function canAct(c) {
  if (G.mode === "cpu") return c === G.colorOf[0];
  if (G.mode === "online")
    return net.canWrite && G.seats[G.colorOf.indexOf(c)] === net.uid;
  return true;
}
// The colour whose end the camera sits behind: yours, or in a two-player game whoever is up.
export function viewColor() {
  if (G.mode === "cpu") return G.colorOf[0];
  if (G.mode === "online") {
    const mine = [0, 1].filter((p) => G.seats[p] === net.uid);
    if (mine.length === 1) return G.colorOf[mine[0]];
  }
  return G.phase === "openW" ? "W" : G.phase === "openR" ? "R" : G.turn;
}

// ---------- the HUD ----------
function statusText() {
  const c = G.turn,
    opp = app.opp;
  const waitFor = (col) =>
    !canAct(col)
      ? G.mode === "cpu"
        ? [
            `${nameOf(col)} is lining up`,
            pick([
              "Studying the angles.",
              "Chalking the cue.",
              opp?.traits[0] || "",
            ]),
          ]
        : [`Waiting for ${nameOf(col)}`, "Their shot appears here live."]
      : null;
  switch (G.phase) {
    case "openW":
      return (
        waitFor("W") || [
          `Opening shot · ${nameOf("W")} with white`,
          "Play the marked ball softly off your left cushion. It rolls once both players have aimed.",
        ]
      );
    case "openR":
      return (
        waitFor("R") || [
          `Opening shot · ${nameOf("R")} with red`,
          "Play the marked ball off your left cushion. Closest to their goal starts.",
        ]
      );
    case "moving":
      return ["Rolling", ""];
    case "wait":
      return ["Checking the shot", `${nameOf(G.turn)}'s table decides.`];
    case "aim":
      return (
        waitFor(c) || [
          `${nameOf(c)} to play with ${COL[c]}`,
          "Press one of your balls, pull back, let go. Set spin on the cue ball, bottom right.",
        ]
      );
    case "penalty": {
      const b = ball(G.penChoice.id),
        ch = other(b.c);
      return [
        `${nameOf(ch)} picks a penalty spot`,
        canAct(ch)
          ? `For ${nameOf(b.c)}'s ball. Tap spot 1 or 2 beside the goal posts.`
          : "Waiting for their choice.",
      ];
    }
    case "mancheEnd":
      return [
        `${G.names[G.endWinner]} wins game ${G.manche}`,
        "Colours swap for the next game.",
      ];
    case "matchEnd":
      return [
        `${G.names[G.endWinner]} wins the match`,
        `Final score ${G.wins[G.endWinner]}-${G.wins[1 - G.endWinner]} in games.`,
      ];
  }
  return ["", ""];
}

let lastTick = "";
export function renderUI() {
  if (!G) return;
  const live = ["aim", "openW", "openR", "moving", "wait"].includes(G.phase);
  for (const p of [0, 1]) {
    const c = G.colorOf[p],
      side = $("#s" + p),
      row = $("#pl" + p),
      f = fouls(c),
      inn = 5 - remaining(c);
    side.dataset.c = c;
    row.dataset.c = c;
    side.classList.toggle("on", live && G.turn === c);
    side.querySelector(".nm").textContent = G.names[p];
    side.querySelector(".pips").innerHTML = Array.from(
      { length: 5 },
      (_, i) => `<i class="${i < inn ? "in" : ""}"></i>`,
    ).join("");
    const fl = side.querySelector(".fl");
    fl.textContent = f ? `${f} foul${f > 1 ? "s" : ""}` : "clean";
    fl.classList.toggle("bad", f > 0);
    side.querySelector(".wins").innerHTML =
      `<i class="${G.wins[p] > 0 ? "on" : ""}"></i><i class="${G.wins[p] > 1 ? "on" : ""}"></i>`;
    side.querySelector(".pts").textContent = inn;
    side.setAttribute(
      "aria-label",
      `${G.names[p]}, ${COL[c]}: ${inn} of 5 balls in, ${G.wins[p]} games won, ${f} fouls`,
    );
    const inp = $("#name" + p);
    if (document.activeElement !== inp) inp.value = G.names[p];
    inp.disabled =
      (G.mode === "online" && G.seats[p] !== net.uid) ||
      (G.mode === "cpu" && p === 1);
    const s = G.seats[p];
    row.querySelector(".seat").innerHTML =
      G.mode === "cpu" && p === 1
        ? `${esc(app.opp.nick)} · <span class="gtag" style="--g:${gradeOf(app.opp).color}">${gradeOf(app.opp).label}</span>`
        : G.mode !== "online" || !net.ready
          ? ""
          : !s
            ? net.canWrite
              ? `<button class="link" type="button" data-seat="${p}">Take this seat</button>`
              : "Free seat"
            : s === net.uid
              ? `You <button class="link" type="button" data-leave="${p}">Leave seat</button>`
              : "Opponent";
  }
  $("#netNote").textContent =
    G.mode === "cpu"
      ? `You play white in game 1 and red in game 2. ${app.opp.name} takes the other colour.`
      : G.mode === "local"
        ? "Two players on this screen. The camera moves to whoever is up."
        : net.canWrite
          ? "Online table. Your opponent joins the same table name from their device."
          : "You are watching. Ask the owner for edit access to play.";
  $("#gameLbl").textContent = `GAME ${G.manche}`;
  const [m, h] = statusText();
  $("#stMain").textContent = m;
  $("#stHint").textContent = h;
  $("#penBox").hidden =
    app.show ||
    !(G.phase === "penalty" && canAct(other(ball(G.penChoice.id).c)));
  endcard();
  $("#log").innerHTML = G.log
    .slice(-14)
    .reverse()
    .map(
      (e) =>
        `<li><span class="n">#${e.n}</span><span class="c ${e.c || ""}"></span><span class="t ${e.kind}">${esc(e.text)}${e.why ? `<span class="why">${esc(e.why)}</span>` : ""}</span></li>`,
    )
    .join("");
  const e = G.log[G.log.length - 1],
    key = e ? e.n + e.text : "";
  if (e && key !== lastTick) {
    lastTick = key;
    const t = $("#ticker");
    t.querySelector(".tag").textContent =
      e.kind === "fout" ? "Foul" : e.kind === "doel" ? "Goal" : "Referee";
    t.querySelector(".tt").textContent = e.text;
    t.querySelector(".why").textContent = e.why || "";
    t.classList.remove("show");
    void t.offsetWidth;
    t.classList.add("show");
  }
}

let lastLive = null,
  lastClock = "";
// Per frame: power meter, foul warning while aiming, clock, speech bubble.
export function liveUI(s, b) {
  let warn = "";
  if (b && s && G.phase === "aim" && s.p >= HARD) {
    if (onderStoot(b.c, b) && !inKlein(b.c, b))
      warn = "Below the shooting line: a hard shot here is a foul";
    else if (inVlieg(b))
      warn = "On the cushion strip: a hard shot here is a flyer";
  }
  if (warn !== lastLive) {
    lastLive = warn;
    const w = $("#stLive");
    w.textContent = warn;
    w.hidden = !warn;
  }
  const pw = $("#power");
  pw.hidden = !s;
  if (s) {
    pw.querySelector(".fill").style.height = `${s.p * 100}%`;
    pw.classList.toggle("hard", s.p >= HARD);
    pw.querySelector(".val").textContent = Math.round(s.p * 100);
  }
  const chip = $("#clockChip");
  chip.hidden = !app.set.clock;
  if (app.set.clock) {
    const t = G.phase === "aim" ? Math.max(0, Math.ceil(G.timeLeft)) : 60,
      c = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
    if (c !== lastClock) {
      lastClock = c;
      $("#clock").textContent = c;
      chip.classList.toggle("low", t <= 15);
    }
  }
  placeBubble();
}

// ---------- end of a game ----------
function endcard() {
  const on =
      !!app.inGame &&
      !app.show &&
      $("#start").hidden &&
      (G.phase === "mancheEnd" || G.phase === "matchEnd"),
    el = $("#endcard");
  if (el.hidden === on) {
    el.hidden = !on;
    document.body.classList.toggle("ending", on);
    if (on) setTimeout(() => $("#btnNext").focus({ preventScroll: true }), 400);
  }
  if (!on) return;
  const w = G.endWinner,
    match = G.phase === "matchEnd",
    cpu = G.mode === "cpu",
    o = app.opp;
  el.classList.toggle("match", match);
  $("#ecName").textContent = G.names[w];
  $("#ecWhat").textContent = match
    ? "takes the match"
    : `wins game ${G.manche}`;
  for (const p of [0, 1]) {
    const c = G.colorOf[p],
      s = $("#ec" + p),
      f = fouls(c);
    s.dataset.c = c;
    s.classList.toggle("won", p === w);
    s.querySelector(".nm").textContent = G.names[p];
    s.querySelector(".st").textContent =
      `${5 - remaining(c)} of 5 in · ${f} foul${f === 1 ? "" : "s"}`;
    $("#ecS" + p).textContent = G.wins[p];
  }
  const medal = $("#ecMedal"),
    face = cpu && w === 1;
  medal.classList.toggle("face", face);
  if (face && medal.dataset.opp !== o.id) {
    medal.dataset.opp = o.id;
    paintPortrait($("#ecFace"), o);
  }
  const next = (p) => COL[other(G.colorOf[p])],
    n = G.manche + 1;
  $("#ecNote").textContent = match
    ? cpu
      ? w === 0
        ? `${o.name} buys the next round. Fancy another go?`
        : `${o.name} keeps the table. Rematch?`
      : `Final score ${G.wins[w]}:${G.wins[1 - w]} in games.`
    : cpu
      ? `Colours swap: you play ${next(0)} in game ${n}.`
      : `Colours swap: ${G.names[0]} plays ${next(0)} in game ${n}.`;
  $("#btnNext span").textContent = match ? "Rematch" : `Play game ${n}`;
  $("#ecPick").hidden = !(match && cpu);
}

// ---------- speech bubbles ----------
let bubble = null;
export function say(who, text, color = null, ms = 3400) {
  const el = $("#bubble");
  el.querySelector(".who").textContent = who;
  el.querySelector(".txt").textContent = text;
  el.hidden = false;
  el.classList.remove("pop");
  void el.offsetWidth;
  el.classList.add("pop");
  bubble = { color, until: performance.now() + ms };
}
export function quip(kind) {
  if (G?.mode !== "cpu" || !app.opp) return;
  say(app.opp.name, pick(app.opp.quips[kind]), G.colorOf[1]);
}
function placeBubble() {
  const el = $("#bubble");
  if (!bubble) return;
  if (
    performance.now() > bubble.until ||
    document.body.classList.contains("replaying")
  ) {
    el.hidden = true;
    bubble = null;
    return;
  }
  const p = bubble.color && headScreen(bubble.color);
  const w = el.offsetWidth,
    h = el.offsetHeight;
  let x = p && !p.behind ? p.x - w / 2 : innerWidth - w - 24,
    y = p && !p.behind ? p.y - h - 18 : 120;
  x = Math.max(12, Math.min(innerWidth - w - 12, x));
  y = Math.max(110, Math.min(innerHeight - h - 160, y));
  el.style.transform = `translate(${x | 0}px, ${y | 0}px)`;
}

// ---------- banners ----------
const COLORS_CONFETTI = [
  "#ffd24a",
  "#ff3d2e",
  "#f7edd9",
  "#c6ff4d",
  "#ff7a1a",
  "#9b6bff",
];
export function banner(kind, word, who, sub, ms = 2300) {
  const el = $("#banner");
  el.className = "banner";
  el.hidden = false;
  $("#bWord").textContent = word;
  $("#bWord").dataset.text = word;
  $("#bWho").textContent = who || "";
  $("#bSub").textContent = sub || "";
  const conf = $("#confetti");
  conf.innerHTML = "";
  if (
    kind === "goal" ||
    kind === "game" ||
    kind === "match" ||
    kind === "gift"
  ) {
    const n = kind === "goal" || kind === "gift" ? 40 : 110;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2,
        d = 200 + Math.random() * 520,
        x = Math.random() * 100;
      conf.insertAdjacentHTML(
        "beforeend",
        `<i style="left:${x}%;background:${COLORS_CONFETTI[i % 6]};--x:${(Math.cos(a) * d) | 0}px;--y:${(Math.sin(a) * d * 0.6 + 240) | 0}px;--r:${(Math.random() * 900 - 450) | 0}deg;--d:${(1.4 + Math.random() * 1.2).toFixed(2)}s"></i>`,
      );
    }
  }
  void el.offsetWidth;
  el.classList.add("go", kind);
  return new Promise((res) =>
    setTimeout(() => {
      el.hidden = true;
      el.className = "banner";
      res();
    }, ms),
  );
}

// ---------- replay overlay ----------
export function replayOverlay(m, foul) {
  const r = $("#replay");
  if (!m) {
    r.hidden = true;
    document.body.classList.remove("replaying");
    r.className = "replay";
    return;
  }
  document.body.classList.add("replaying");
  r.hidden = false;
  r.className = "replay" + (m.kind === "win" ? " win" : "");
  $("#rLabel").textContent =
    m.kind === "win"
      ? "WINNING GOAL CAM"
      : m.kind === "foul"
        ? "FOUL CAM"
        : "GOAL CAM";
  $("#rWhy").hidden = true;
  if (foul) {
    $("#rTitle").textContent = foul.title;
    $("#rWho").textContent = `${nameOf(foul.c)} · ${COL[foul.c]}`;
    $("#rText").textContent = foul.why;
    $("#rNext").textContent = foul.next || "";
    $("#rRef").textContent = foul.code;
  }
}
export function replayFrozen(on, foul) {
  $("#replay").classList.toggle("frozen", on);
  if (foul && on) $("#rWhy").hidden = false; // the explanation stays up until the replay ends
}

// ---------- spin pad ----------
export function spinLabel(x, y) {
  const v = y > 0.25 ? "Follow" : y < -0.25 ? "Draw" : "",
    h = x > 0.25 ? "right" : x < -0.25 ? "left" : "";
  if (!v && !h)
    return Math.hypot(x, y) < 0.15 ? "Centre ball" : "A touch off centre";
  return v && h ? `${v}, ${h} english` : v || `${cap(h)} english`;
}
export function setSpin(x, y) {
  const d = Math.hypot(x, y);
  if (d > 1) {
    x /= d;
    y /= d;
  }
  app.spin.x = x;
  app.spin.y = y;
  $("#spinDot").style.left = `${50 + x * 36}%`;
  $("#spinDot").style.top = `${50 - y * 36}%`;
  const t = spinLabel(x, y);
  $("#spinRead").textContent = t;
  $("#cueball").setAttribute("aria-valuetext", t);
}
export function initSpinPad() {
  const pad = $("#cueball");
  const at = (e) => {
    const r = pad.getBoundingClientRect();
    setSpin(
      ((e.clientX - r.left) / r.width - 0.5) / 0.36,
      -((e.clientY - r.top) / r.height - 0.5) / 0.36,
    );
  };
  pad.addEventListener("pointerdown", (e) => {
    pad.setPointerCapture(e.pointerId);
    at(e);
  });
  pad.addEventListener("pointermove", (e) => {
    if (pad.hasPointerCapture(e.pointerId)) at(e);
  });
  pad.addEventListener("keydown", (e) => {
    const k = {
      ArrowUp: [0, 0.2],
      ArrowDown: [0, -0.2],
      ArrowLeft: [-0.2, 0],
      ArrowRight: [0.2, 0],
    }[e.key];
    if (k) {
      e.preventDefault();
      setSpin(app.spin.x + k[0], app.spin.y + k[1]);
    }
  });
  $("#spinReset").addEventListener("click", () => setSpin(0, 0));
  setSpin(0, 0);
}

// ---------- start menu ----------
let pickId = findOpponent(app.set.opp).id,
  gradeId = findOpponent(pickId).grade;
export function showView(v) {
  $$(".start .view[data-view]").forEach((el) => {
    el.hidden = el.dataset.view !== v;
  });
  const panel = $(".start .panel");
  panel.dataset.view = v;
  panel.classList.toggle("wide", v === "pick");
  $("#btnResume").hidden = !(app.inGame && G);
  if (v === "tutorial") {
    slide = 0;
    drawSlide();
  }
  if (v === "pick") renderRoster();
  const f = document.querySelector(
    `.start .view[data-view="${v}"] button, .start .view[data-view="${v}"] input`,
  );
  f?.focus({ preventScroll: true });
}
export const pickedOpponent = () => findOpponent(pickId);
export const pickOpponent = (id) => {
  pickId = findOpponent(id).id;
  gradeId = findOpponent(pickId).grade;
};
function renderRoster() {
  const tabs = $("#gradeTabs"),
    r = $("#roster");
  if (!tabs.children.length) {
    for (const g of GRADES) {
      tabs.insertAdjacentHTML(
        "beforeend",
        `<button class="grade" type="button" role="tab" data-grade="${g.id}" style="--g:${g.color}"><i class="gem"></i>${g.label}</button>`,
      );
      tabs.lastElementChild.addEventListener("click", () => {
        gradeId = g.id;
        if (findOpponent(pickId).grade !== g.id)
          pickId = OPPONENTS.find((o) => o.grade === g.id).id;
        renderRoster();
      });
    }
    for (const o of OPPONENTS) {
      const g = gradeOf(o);
      r.insertAdjacentHTML(
        "beforeend",
        `<button class="card ${g.id}" type="button" role="radio" data-opp="${o.id}" data-grade="${g.id}" style="--g:${g.color}"><canvas width="64" height="64"></canvas><b>${esc(o.name)}</b><span class="nick">${esc(o.nick)}</span><span class="style">${esc(o.style)}</span><span class="traits">${o.traits.map((t) => `<em>${esc(t)}</em>`).join("")}</span></button>`,
      );
      const card = r.lastElementChild;
      paintPortrait(card.querySelector("canvas"), o);
      card.addEventListener("click", () => {
        pickId = o.id;
        renderRoster();
      });
      card.addEventListener("dblclick", () => $("#btnChallenge").click());
    }
  }
  tabs
    .querySelectorAll(".grade")
    .forEach((b) =>
      b.setAttribute("aria-selected", b.dataset.grade === gradeId),
    );
  r.querySelectorAll(".card").forEach((c) => {
    c.hidden = c.dataset.grade !== gradeId;
    c.setAttribute("aria-checked", c.dataset.opp === pickId);
  });
  const o = pickedOpponent(),
    g = gradeOf(o),
    bio = $("#oppBio");
  bio.style.setProperty("--g", g.color);
  bio.innerHTML = `<b>${esc(o.name)}</b><span class="tag">${g.label}</span><small>${esc(o.bio)}</small>`;
  if (app.set.opp !== o.id) {
    app.set.opp = o.id;
    saveSettings();
  }
}

// ---------- tutorial ----------
const SLIDES = [
  {
    t: "Five balls, one goal",
    x: "Each player has five balls, white or red. Sink all five into the goal at the far end before your opponent does. Your goal has a ring in your colour.",
    zone: "goals",
    balls: [
      ...START.map((p) => ({ c: "W", x: -p.x, y: p.y })),
      ...START.map((p) => ({ c: "R", x: p.x, y: p.y })),
    ],
  },
  {
    t: "Taking a shot",
    x: "Press one of your own balls, pull back and let go. The further you pull, the harder the shot. Right-drag to walk around the table and scroll to zoom.",
    balls: [{ c: "W", x: -250, y: 150 }],
    arrows: [
      {
        pts: [
          [-250, 150],
          [860, 0],
        ],
      },
    ],
  },
  {
    t: "Put some spin on it",
    x: "The cue ball in the corner shows where your tip hits. Low makes your ball come back after it hits another ball, high makes it run on, left or right bends the bounce off a cushion.",
    why: "A ball hit dead centre slides first, then starts rolling. Spin changes what it does after the first contact.",
    balls: [
      { c: "W", x: -560, y: -200 },
      { c: "R", x: -120, y: -200 },
    ],
    arrows: [
      {
        pts: [
          [-560, -200],
          [-185, -200],
        ],
      },
      {
        pts: [
          [-185, -200],
          [260, -200],
        ],
        alt: true,
      },
      {
        pts: [
          [-185, -175],
          [-520, -60],
        ],
        alt: true,
      },
    ],
  },
  {
    t: "The opening shot",
    x: "Both players play their middle ball at the same time, softly off their own left cushion. Whoever stops closest to their goal takes the first turn.",
    balls: [
      { c: "W", x: -835, y: 0 },
      { c: "R", x: 835, y: 0 },
    ],
    arrows: [
      {
        pts: [
          [-800, -10],
          [-150, -415],
          [620, -60],
        ],
      },
      {
        pts: [
          [800, 10],
          [150, 415],
          [-620, 60],
        ],
      },
    ],
  },
  {
    t: "Keep shooting",
    x: "Score and you shoot again. No goal and the turn passes. Knock an opponent's ball into a goal and it counts for them.",
    why: "Put your own ball into the goal behind you and it goes to a penalty spot.",
    balls: [
      { c: "W", x: 640, y: 20 },
      { c: "R", x: 300, y: -200 },
    ],
    arrows: [
      {
        pts: [
          [640, 20],
          [866, 0],
        ],
      },
    ],
  },
  {
    t: "Foul: your own ball first",
    x: "You may never hit one of your own balls directly.",
    why: "Bounce off a cushion, a post or an opponent's ball first. Otherwise you could simply push your own balls to the goal.",
    balls: [
      { c: "W", x: -300, y: 200 },
      { c: "W", x: 150, y: 200 },
      { c: "W", x: -300, y: -150 },
      { c: "W", x: 150, y: -260 },
    ],
    arrows: [
      {
        pts: [
          [-300, 200],
          [110, 200],
        ],
        bad: true,
        cross: [-80, 200],
      },
      {
        pts: [
          [-300, -150],
          [-80, -415],
          [120, -280],
        ],
      },
    ],
  },
  {
    t: "Foul: hard from the corner",
    x: "The shooting lines run from the middle of each long cushion to the tip of the small triangle. From the red corners you may only play softly. From the small green triangle a hard shot is fine.",
    why: "Close to the goal the game rewards touch, not force.",
    zone: "stootlijn",
    balls: [
      { c: "W", x: 820, y: 230 },
      { c: "W", x: 770, y: 0 },
    ],
  },
  {
    t: "Foul: flying along the cushion",
    x: "A ball in the strip within 92 mm of a long cushion may not be hit hard. Play it softly.",
    why: "A hard shot along the rail makes scoring too easy, so it is called a flyer.",
    zone: "vlieg",
    balls: [{ c: "W", x: -400, y: -410 }],
    arrows: [
      {
        pts: [
          [-400, -410],
          [500, -410],
        ],
        bad: true,
        cross: [50, -410],
      },
    ],
  },
  {
    t: "Don't park in the big triangle",
    x: "If one of your balls starts your turn inside the big triangle in front of your goal, move it out or score it before your turn ends.",
    why: "You can't leave a ball in front of the goal just to block it.",
    zone: "triangle",
    balls: [{ c: "W", x: 600, y: 90 }],
    arrows: [
      {
        pts: [
          [600, 90],
          [300, 330],
        ],
      },
    ],
  },
  {
    t: "Penalty spots",
    x: "After a foul your turn ends, any balls that moved go back, and the ball that fouled goes on a penalty spot. Your opponent picks spot 1 or 2 beside the goal posts.",
    why: "A ball tucked beside the posts is hard to score, so a foul really costs you.",
    zone: "penalty",
  },
  {
    t: "Winning the match",
    x: "First to sink all five wins the game. A match is best of three and colours swap each game. Every goal and foul gets a replay, so you see exactly what happened.",
    zone: "goals",
  },
  {
    t: "Make yourself at home",
    x: "Light a cigar or take a sip of whisky with the buttons in the menu, top left. The regulars will. Press T for the top view and right-drag to look around the café.",
    why: "The chalkboards on the walls keep the score, the fouls and the rule that was just broken.",
  },
];
let slide = 0;
function drawSlide() {
  const s = SLIDES[slide],
    cv = $("#tutCanvas"),
    c = cv.getContext("2d"),
    k = Math.min(cv.width / 2080, cv.height / 1180);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, cv.width, cv.height);
  c.setTransform(k, 0, 0, k, cv.width / 2, cv.height / 2);
  c.fillStyle = "#4c1f13";
  c.fillRect(-1040, -590, 2080, 1180);
  c.fillStyle = "#16574f";
  c.fillRect(-930, -480, 1860, 960);
  drawTable(c, { lines: true, zone: s.zone, balls: s.balls, arrows: s.arrows });
  $("#tutStep").textContent = `${slide + 1} / ${SLIDES.length}`;
  $("#tutTitle").textContent = s.t;
  $("#tutText").textContent = s.x;
  $("#tutWhy").textContent = s.why || "";
  $("#tutDots").innerHTML = SLIDES.map(
    (_, i) => `<i class="${i === slide ? "on" : ""}"></i>`,
  ).join("");
  $("#tutBack").disabled = slide === 0;
  $("#tutNext span").textContent =
    slide === SLIDES.length - 1 ? "Done" : "Next";
}
export function initTutorial() {
  $("#tutNext").addEventListener("click", () => {
    if (slide < SLIDES.length - 1) {
      slide++;
      drawSlide();
    } else showView("home");
  });
  $("#tutBack").addEventListener("click", () => {
    if (slide > 0) {
      slide--;
      drawSlide();
    }
  });
  $("#tutSkip").addEventListener("click", () => showView("home"));
}

// ---------- tabs: all panels share one grid cell, so the box never changes size ----------
export function initTabs(list) {
  const btns = [...list.querySelectorAll("[role=tab]")];
  const sel = (b) =>
    btns.forEach((x) => {
      const on = x === b,
        p = document.getElementById(x.getAttribute("aria-controls"));
      x.setAttribute("aria-selected", on);
      x.tabIndex = on ? 0 : -1;
      p.classList.toggle("off", !on);
      p.inert = !on;
    });
  btns.forEach((b) => b.addEventListener("click", () => sel(b)));
  list.addEventListener("keydown", (e) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!d) return;
    const i =
      (btns.findIndex((b) => b.getAttribute("aria-selected") === "true") +
        d +
        btns.length) %
      btns.length;
    sel(btns[i]);
    btns[i].focus();
    e.preventDefault();
  });
  sel(btns.find((b) => b.getAttribute("aria-selected") === "true") || btns[0]);
}

// ---------- settings ----------
const FX = [
  ["ps2", "PS2 filter", "Low resolution, dithered colour, scanlines"],
  ["bloom", "Bloom", "Glow around lamps and bright spots"],
  ["flare", "Lens flare", "Streaks and rings when a lamp is in view"],
  ["grain", "Film grain", "Moving noise like an old camera"],
  ["vignette", "Vignette", "Darker corners"],
  ["blur", "Motion blur", "Smears fast camera moves"],
  ["chroma", "Chromatic aberration", "Colour fringes towards the edges"],
];
const LOOKS = {
  clean: {
    ps2: 0,
    bloom: 30,
    flare: 15,
    grain: 0,
    vignette: 25,
    blur: 0,
    chroma: 0,
  },
  ps2: { ...FX_DEFAULTS },
  cinema: {
    ps2: 15,
    bloom: 70,
    flare: 65,
    grain: 45,
    vignette: 75,
    blur: 35,
    chroma: 30,
  },
};
export function initSettings(apply) {
  for (const k of ["master", "fx", "amb", "music"]) {
    const i = $("#vol_" + k),
      o = $("#vol_" + k + "_v");
    i.value = vol[k];
    o.textContent = vol[k];
    i.addEventListener("input", () => {
      setVol(k, +i.value);
      o.textContent = i.value;
    });
  }
  const box = $("#fxSliders");
  box.innerHTML = FX.map(
    ([k, t, d]) =>
      `<label class="slider"><span>${t}<small>${d}</small></span><input type="range" min="0" max="100" data-fx="${k}" aria-label="${t}"><output data-fxv="${k}"></output></label>`,
  ).join("");
  const syncFx = () => {
    for (const [k] of FX) {
      box.querySelector(`[data-fx="${k}"]`).value = app.set.fx[k];
      box.querySelector(`[data-fxv="${k}"]`).textContent = app.set.fx[k];
    }
    $$("[data-look]").forEach((b) =>
      b.setAttribute(
        "aria-checked",
        FX.every(([k]) => LOOKS[b.dataset.look][k] === app.set.fx[k]),
      ),
    );
  };
  box.addEventListener("input", (e) => {
    const k = e.target.dataset.fx;
    if (!k) return;
    app.set.fx[k] = +e.target.value;
    syncFx();
    apply("fx");
  });
  box.addEventListener("change", saveSettings);
  $$("[data-look]").forEach((b) =>
    b.addEventListener("click", () => {
      app.set.fx = { ...LOOKS[b.dataset.look] };
      saveSettings();
      syncFx();
      apply("fx");
    }),
  );
  const sync = () => {
    $$("[data-replays]").forEach((b) =>
      b.setAttribute("aria-checked", b.dataset.replays === app.set.replays),
    );
    $("#optClock").setAttribute("aria-checked", app.set.clock);
    $("#optLines2").setAttribute("aria-checked", app.set.lines);
    $("#optLines").setAttribute("aria-pressed", app.set.lines);
  };
  $$("[data-replays]").forEach((b) =>
    b.addEventListener("click", () => {
      app.set.replays = b.dataset.replays;
      saveSettings();
      sync();
    }),
  );
  const toggle = (id, k) =>
    $(id).addEventListener("click", () => {
      app.set[k] = !app.set[k];
      saveSettings();
      sync();
      apply(k);
    });
  toggle("#optClock", "clock");
  toggle("#optLines2", "lines");
  toggle("#optLines", "lines");
  // the jukebox
  const song = () => {
    $("#songTitle").textContent = juke.title || "Jukebox";
    $("#songInfo").textContent = juke.info || "Starts with your first click";
    $(".jukebox").classList.toggle("on", !!juke.title && vol.music > 0);
  };
  juke.onChange = song;
  $("#songNext").addEventListener("click", () => {
    nextSong();
    song();
  });
  const open = (on) => {
    $("#settings").hidden = !on;
    if (on) {
      song();
      $("#setClose").focus();
    }
  };
  $("#btnSettings").addEventListener("click", () => open(true));
  $("#btnSettings2").addEventListener("click", () => open(true));
  $("#setClose").addEventListener("click", () => open(false));
  $("#settings").addEventListener("click", (e) => {
    if (e.target.id === "settings") open(false);
  });
  initTabs($("#settings [role=tablist]"));
  sync();
  syncFx();
  song();
  return open;
}
