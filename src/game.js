// Table, zones, ball physics with spin, and the referee (GZV spelreglement 2026-2027).
// No DOM and no three.js: this file runs in the browser and in Node (see test/selftest.mjs).
// Units: millimetres, seconds, radians. Table coordinates: x along the length, y across, origin in the middle.

// ---------- Dimensions (GZV standaardnormen) ----------
export const R = 30.75,
  DOP_R = 17.5,
  HX = 900,
  HY = 450;
export const GOAL_X = 897,
  GOAL_R = 32.5,
  DD_X = 835,
  DD_Y = 77 / 2 + DOP_R;
export const VLIEG = 92.3,
  VL = HY - VLIEG,
  QUART = 450,
  KLEIN_TOP = 180;
export const HARD = 0.55,
  VMAX = 5600,
  PULL_MAX = 600,
  SPIN_MAX = 0.5;
const E_BAND = 0.72,
  E_DOP = 0.55,
  E_BALL = 0.94;
const GRAV = 9810,
  MU_SLIDE = 0.2,
  MU_BAND = 0.14,
  MU_DOP = 0.22;
const ROLL = 180,
  DRAG = 0.18,
  SPIN_DECAY = 25; // rolling resistance (mm/s²), extra drag per mm/s, side spin decay (rad/s²)

export const DOPS = [];
[90, 180].forEach((d) =>
  DOPS.push({ x: d, y: 0 }, { x: -d, y: 0 }, { x: 0, y: d }, { x: 0, y: -d }),
);
[-1, 1].forEach((s) =>
  DOPS.push({ x: s * DD_X, y: DD_Y }, { x: s * DD_X, y: -DD_Y }),
);
export const START = [
  { x: 835, y: -320 },
  { x: 835, y: -160 },
  { x: 835, y: 160 },
  { x: 835, y: 320 },
  { x: 835, y: 0 },
];
export const COLORS = ["W", "R"];
export const COL = { W: "white", R: "red" };
export const att = (c) => (c === "W" ? 1 : -1); // white attacks +x
export const home = (c) => -att(c);
export const other = (c) => (c === "W" ? "R" : "W");
export const clone = (a) => a.map((b) => ({ ...b }));

// ---------- Zones (NLGB drawing) ----------
export function loc(c, p) {
  return { u: HX - att(c) * p.x, v: Math.abs(p.y) };
} // u: distance to the short cushion behind the goal c attacks
export function inKlein(c, p) {
  const { u, v } = loc(c, p);
  if (u < 0 || u > KLEIN_TOP) return false;
  return u <= HX - DD_X
    ? v <= DD_Y
    : v <= (DD_Y * (KLEIN_TOP - u)) / (KLEIN_TOP - (HX - DD_X));
}
export function inGroot(c, p) {
  const { u, v } = loc(c, p);
  return u >= 0 && u <= QUART && v <= (VL * u) / QUART;
}
export function onderStoot(c, p) {
  const { u, v } = loc(c, p);
  return (
    u < HX &&
    !(u >= KLEIN_TOP && v <= (HY * (u - KLEIN_TOP)) / (HX - KLEIN_TOP))
  );
}
export const inVlieg = (p) => Math.abs(p.y) >= VL;

// ---------- State ----------
export let G = null;
export let SIM = false; // true while the CPU tries shots on a copy
export const setG = (g) => {
  G = g;
};
export const hooks = {
  changed() {},
  push() {},
  sfx() {},
  frame() {},
  me: () => "local",
};

export const ball = (id) => G.balls.find((b) => b.id === id);
export const nameOf = (c) => G.names[G.colorOf.indexOf(c)];
export const remaining = (c) =>
  G.balls.filter((b) => b.c === c && (b.on || G.queue.includes(b.id))).length;
export const fouls = (c) =>
  G.log.filter((e) => e.kind === "fout" && e.c === c).length;
export function log(c, kind, text, why = "") {
  G.log.push({ n: G.strokeNo, c, kind, text, why });
  if (G.log.length > 120) G.log.shift();
}
const changed = () => {
  if (!SIM) hooks.changed();
};
const push = () => {
  if (!SIM) hooks.push();
};

export function withCopy(fn) {
  const saved = G;
  SIM = true;
  G = JSON.parse(JSON.stringify(saved));
  try {
    return fn();
  } finally {
    G = saved;
    SIM = false;
  }
}

export function newMatch(mode = G?.mode || "local", o = {}) {
  const prev = G;
  G = {
    mode,
    opp: o.opp ?? prev?.opp ?? null,
    names: (o.names || prev?.names || ["Player 1", "Player 2"]).slice(),
    seats:
      mode === "online" && prev?.mode === "online" ? prev.seats : [null, null],
    wins: [0, 0],
    manche: 0,
    colorOf: ["W", "R"],
    balls: [],
    phase: "openW",
    turn: "W",
    log: [],
    queue: [],
    open: null,
    stroke: null,
    snap: null,
    turnInfo: { obligated: [], left: {} },
    nextMode: "switch",
    nextColor: "W",
    openingBall: null,
    timeLeft: 60,
    warned: false,
    lastPots: [],
    lastShot: null,
    simT: 0,
    strokeNo: 0,
    potN: 0,
    penChoice: null,
    endWinner: null,
    mover: null,
  };
  newManche();
}

export function newManche() {
  G.manche++;
  G.colorOf = G.manche === 2 ? ["R", "W"] : ["W", "R"];
  G.balls = [];
  let id = 0;
  for (const c of COLORS)
    START.forEach((p) =>
      G.balls.push({
        id: id++,
        c,
        x: home(c) * p.x,
        y: p.y,
        vx: 0,
        vy: 0,
        wx: 0,
        wy: 0,
        wz: 0,
        on: true,
        potN: 0,
      }),
    );
  G.open = { ids: { W: 4, R: 9 }, strikes: { W: 0, R: 0 }, shots: {} };
  G.queue = [];
  G.lastPots = [];
  G.penChoice = null;
  G.endWinner = null;
  G.turnInfo = { obligated: [], left: {} };
  log(
    null,
    "info",
    `Game ${G.manche}: ${nameOf("W")} plays white, ${nameOf("R")} plays red.`,
    G.manche === 3 ? "Deciding game. Colours as in game 1." : "",
  );
  startOpening();
}

function startOpening() {
  G.open.shots = {};
  G.phase = "openW";
  G.turn = "W";
  changed();
}

export function beginTurn(c, exemptId) {
  G.turn = c;
  G.turnInfo = {
    obligated: G.balls
      .filter(
        (b) =>
          b.on &&
          b.c === c &&
          inGroot(c, b) &&
          !(b.id === exemptId && inKlein(c, b)),
      )
      .map((b) => b.id),
    left: {},
  };
  const n = G.turnInfo.obligated.length;
  if (n)
    log(
      c,
      "info",
      n === 1
        ? `${nameOf(c)} has a ball in the big triangle.`
        : `${nameOf(c)} has ${n} balls in the big triangle.`,
      n === 1
        ? "Move it out or score it during this turn."
        : "At least one must leave the triangle during this turn.",
    );
  G.phase = "aim";
  resetTimer();
}
export function resetTimer() {
  G.timeLeft = 60;
  G.warned = false;
}

// ---------- Physics ----------
// Each ball has velocity (vx, vy) and angular velocity (wx, wy, wz) in the frame (table x, up, table y).
// A ball slides until the cloth turns its spin into rolling (the 2/7 rule), then rolls.
// Side spin (wy) only matters when the ball rubs a cushion or a post.
function hit(b, info) {
  if (!G.stroke) return;
  if (!G.stroke.first[b.id])
    G.stroke.first[b.id] = { ...info, t: G.simT, x: b.x, y: b.y };
  if (b.id === G.stroke.shooter) G.stroke.touches = (G.stroke.touches || 0) + 1; // cushions, posts and balls the cue ball met: trick shot flair
}
const sfx = (k, v) => {
  if (!SIM) hooks.sfx(k, v);
};

// Contact with a cushion or post. n points from the ball centre to the contact, vn > 0 is the approach speed.
function bounce(b, nx, ny, vn, e, mu) {
  const jn = (1 + e) * vn;
  b.vx -= jn * nx;
  b.vy -= jn * ny;
  const tx = -ny,
    ty = nx,
    st = b.vx * tx + b.vy * ty - R * b.wy; // slip of the contact point along the cushion
  const jt = -Math.max(-mu * jn, Math.min(mu * jn, st / 3.5));
  b.vx += jt * tx;
  b.vy += jt * ty;
  b.wy -= (2.5 * jt) / R;
}

export function strike(b, s) {
  const v0 = s.p * VMAX,
    k = (2.5 * v0) / R,
    a = (s.sx || 0) * SPIN_MAX,
    h = (s.sy || 0) * SPIN_MAX;
  b.vx = s.dx * v0;
  b.vy = s.dy * v0;
  b.wy = k * a; // tip right of centre (as the shooter sees it): right english
  b.wx = k * h * s.dy; // tip above centre: follow, below: draw
  b.wz = -k * h * s.dx;
}

export function step(dt) {
  const B = G.balls.filter((b) => b.on);
  G.simT += dt;
  const dv = MU_SLIDE * GRAV * dt;
  for (const b of B) {
    const ux = b.vx + R * b.wz,
      uy = b.vy - R * b.wx,
      us = Math.hypot(ux, uy);
    if (us > 1) {
      const k = Math.min(1, us / (3.5 * dv)),
        ax = (-ux / us) * dv * k,
        ay = (-uy / us) * dv * k;
      b.vx += ax;
      b.vy += ay;
      b.wx -= (2.5 / R) * ay;
      b.wz += (2.5 / R) * ax;
    } else {
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > 0) {
        const ns = sp - (ROLL + DRAG * sp) * dt;
        if (ns < 4) {
          b.vx = 0;
          b.vy = 0;
          b.wy = 0;
        } else {
          const k = ns / sp;
          b.vx *= k;
          b.vy *= k;
        }
      }
      b.wx = b.vy / R;
      b.wz = -b.vx / R;
    }
    if (b.wy)
      b.wy -= Math.sign(b.wy) * Math.min(Math.abs(b.wy), SPIN_DECAY * dt);
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }
  for (const b of B) {
    if (b.x > HX - R) {
      b.x = HX - R;
      if (b.vx > 0) {
        sfx("band", b.vx / 2400);
        hit(b, { type: "band", side: "x+" });
        bounce(b, 1, 0, b.vx, E_BAND, MU_BAND);
      }
    }
    if (b.x < -HX + R) {
      b.x = -HX + R;
      if (b.vx < 0) {
        sfx("band", -b.vx / 2400);
        hit(b, { type: "band", side: "x-" });
        bounce(b, -1, 0, -b.vx, E_BAND, MU_BAND);
      }
    }
    if (b.y > HY - R) {
      b.y = HY - R;
      if (b.vy > 0) {
        sfx("band", b.vy / 2400);
        hit(b, { type: "band", side: "y+" });
        bounce(b, 0, 1, b.vy, E_BAND, MU_BAND);
      }
    }
    if (b.y < -HY + R) {
      b.y = -HY + R;
      if (b.vy < 0) {
        sfx("band", -b.vy / 2400);
        hit(b, { type: "band", side: "y-" });
        bounce(b, 0, -1, -b.vy, E_BAND, MU_BAND);
      }
    }
    for (const d of DOPS) {
      const dx = d.x - b.x,
        dy = d.y - b.y,
        dist = Math.hypot(dx, dy),
        min = R + DOP_R;
      if (dist < min && dist > 0) {
        const nx = dx / dist,
          ny = dy / dist;
        b.x = d.x - nx * min;
        b.y = d.y - ny * min;
        const vn = b.vx * nx + b.vy * ny;
        if (vn > 0) {
          sfx("dop", vn / 2200);
          hit(b, { type: "dop" });
          bounce(b, nx, ny, vn, E_DOP, MU_DOP);
        }
      }
    }
  }
  for (let i = 0; i < B.length; i++)
    for (let j = i + 1; j < B.length; j++) {
      const a = B[i],
        b = B[j];
      const dx = a.x - b.x,
        dy = a.y - b.y,
        dist = Math.hypot(dx, dy);
      if (dist < 2 * R && dist > 0) {
        const nx = dx / dist,
          ny = dy / dist,
          ov = (2 * R - dist) / 2;
        a.x += nx * ov;
        a.y += ny * ov;
        b.x -= nx * ov;
        b.y -= ny * ov;
        const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (rel < 0) {
          sfx("ball", -rel / 2200);
          const jj = (-(1 + E_BALL) * rel) / 2; // equal masses, no friction: the spin stays with each ball (that is what makes follow and draw)
          a.vx += jj * nx;
          a.vy += jj * ny;
          b.vx -= jj * nx;
          b.vy -= jj * ny;
          hit(a, { type: "ball", id: b.id });
          hit(b, { type: "ball", id: a.id });
        }
      }
    }
  for (const b of B)
    for (const h of [1, -1]) {
      if (b.on && Math.hypot(b.x - h * GOAL_X, b.y) < 30) {
        b.on = false;
        b.vx = b.vy = b.wx = b.wy = b.wz = 0;
        b.potN = ++G.potN;
        sfx("pot", 1);
        G.stroke &&
          G.stroke.pots.push({
            id: b.id,
            c: b.c,
            h,
            t: G.simT,
            x: b.x,
            y: b.y,
          });
      }
    }
  if (!SIM) hooks.frame();
}
export const allStill = () =>
  G.balls.every(
    (b) => !b.on || (b.vx === 0 && b.vy === 0 && b.wx === 0 && b.wz === 0),
  );

export function trackTri() {
  if (!G.stroke || G.stroke.opening) return;
  for (const id of G.turnInfo.obligated) {
    const b = ball(id);
    if (!b.on || !inGroot(G.turn, b)) G.turnInfo.left[id] = true;
  }
}

// ---------- Shots and referee ----------
export function fire(id, s) {
  sfx("cue", s.p);
  if (G.phase === "openW") {
    G.open.shots.W = s;
    G.phase = "openR";
    G.turn = "R";
    changed();
    push();
    return;
  }
  if (G.phase === "openR") {
    G.open.shots.R = s;
    G.snap = clone(G.balls);
    G.strokeNo++;
    G.simT = 0;
    G.stroke = { opening: true, first: {}, pots: [] };
    for (const c of COLORS) strike(ball(G.open.ids[c]), G.open.shots[c]);
    G.phase = "moving";
    G.mover = hooks.me();
    changed();
    push();
    return;
  }
  if (G.phase === "aim") {
    const b = ball(id);
    G.snap = clone(G.balls);
    G.strokeNo++;
    G.simT = 0;
    G.stroke = {
      opening: false,
      shooter: id,
      first: {},
      pots: [],
      power: s.p,
      spin: [s.sx || 0, s.sy || 0],
      start: { x: b.x, y: b.y },
    };
    strike(b, s);
    G.phase = "moving";
    G.mover = hooks.me();
    changed();
    push();
  }
}

export function onSettled() {
  if (G.stroke.opening) evalOpening();
  else evalStroke();
  changed();
}

// Plain-words explanations, used by the log, the replay card and the tutorial.
export const FOULS = {
  own: {
    code: "SP/8.1",
    title: "Own ball first",
    why: "Your cue ball touched one of your own balls before anything else. You must bounce off a cushion, a post or an opponent's ball first, otherwise you could simply push your own balls to the goal.",
  },
  hard: {
    code: "SP/7.4",
    title: "Hard shot from the corner",
    why: "This ball lay below the shooting line, in the corner next to the goal. From there you may only play softly. Only the small triangle right in front of the goal allows a hard shot.",
  },
  fly: {
    code: "SP/6.7",
    title: "Flying along the cushion",
    why: "This ball lay in the 92 mm strip along a long cushion. Hitting it hard from there is a flyer, and flyers are not allowed.",
  },
  tri: {
    code: "SP/9",
    title: "Parked in the triangle",
    why: "This ball started the turn inside the big triangle in front of the goal and never left it. You can't park a ball there to block.",
  },
  wrong: {
    code: "SP/7.2",
    title: "Wrong goal",
    why: "Your balls only count in the goal at the far end, the one with the ring in your colour. This one dropped into the goal behind you.",
  },
  open: {
    code: "SP/5.1",
    title: "Bad opening shot",
    why: "The opening ball has to hit your own left cushion first, before anything else.",
  },
  time: {
    code: "SP/3.2",
    title: "Out of time",
    why: "You get one minute per shot. The clock ran out.",
  },
};
const PENALTY =
  "Turn over. Moved balls go back and the ball goes to a penalty spot.";
function shot(extra) {
  G.lastShot = {
    n: G.strokeNo,
    shooter: G.stroke && !G.stroke.opening ? ball(G.stroke.shooter).c : null,
    pots: G.stroke ? G.stroke.pots.slice() : [],
    foul: null,
    end: null,
    ...extra,
  };
}
function foulInfo(key, c, b, at, extra = {}) {
  return {
    key,
    ...FOULS[key],
    c,
    ball: b ? b.id : null,
    t: at ? at.t : 0,
    x: at ? at.x : b?.x,
    y: at ? at.y : b?.y,
    ...extra,
  };
}

function evalOpening() {
  const r = {};
  for (const c of COLORS) {
    const id = G.open.ids[c],
      b = ball(id),
      fc = G.stroke.first[id];
    r[c] = {
      ok: !!fc && fc.type === "band" && fc.side === (c === "W" ? "y-" : "y+"),
      fc,
      potted: !b.on,
      d: b.on ? Math.hypot(b.x - att(c) * GOAL_X, b.y) : 0,
    };
  }
  G.queue = [];
  shot({ opening: true });
  const bad = COLORS.filter((c) => !r[c].ok);
  if (bad.length) {
    const c0 = bad[0],
      b0 = ball(G.open.ids[c0]);
    G.lastShot.foul = foulInfo(
      "open",
      c0,
      b0,
      r[c0].fc || { t: 0.4, x: b0.x, y: b0.y },
    );
    G.balls = clone(G.snap);
    const second = bad.filter((c) => ++G.open.strikes[c] >= 2);
    if (second.length === 1) {
      const c = second[0];
      G.lastShot.foul = foulInfo("open", c, ball(G.open.ids[c]), r[c].fc, {
        next: "Second bad opening: turn over and the ball goes to a penalty spot.",
      });
      log(
        c,
        "fout",
        `Foul: second faulty opening shot by ${nameOf(c)}.`,
        `The opening ball must hit your left cushion first. Turn over and the ball goes to a penalty spot. (SP/5.1)`,
      );
      G.queue = [G.open.ids[c]];
      G.nextMode = "fresh";
      G.nextColor = other(c);
      G.openingBall = null;
      G.turn = c;
      processQueue();
      return;
    }
    if (second.length === 2) G.open.strikes = { W: 0, R: 0 };
    G.lastShot.foul.next = "Set up again and replay the opening.";
    bad.forEach((c) =>
      log(
        c,
        "fout",
        `${nameOf(c)}'s opening shot missed the left cushion. Set up again.`,
        "Play the middle ball softly off your left cushion first. (SP/5.1)",
      ),
    );
    G.nextMode = "redoOpening";
    processQueue();
    return;
  }
  G.lastPots = G.stroke.pots;
  if (r.W.potted && r.R.potted) {
    log(
      null,
      "doel",
      "Both opening balls went in and both count.",
      "Shoot the opening again with another ball. (SP/5.1)",
    );
    for (const c of COLORS) {
      const spot = { x: home(c) * DD_X, y: 0 };
      const cand = G.balls
        .filter((b) => b.on && b.c === c)
        .sort(
          (a, b) =>
            Math.hypot(a.x - spot.x, a.y) - Math.hypot(b.x - spot.x, b.y),
        )[0];
      if (cand) G.open.ids[c] = cand.id;
    }
    G.nextMode = "redoOpening";
    processQueue();
    return;
  }
  let starter;
  if (r.W.potted || r.R.potted) {
    starter = r.W.potted ? "W" : "R";
    log(
      starter,
      "doel",
      `${nameOf(starter)}'s opening ball went straight in. ${nameOf(starter)} starts.`,
    );
  } else {
    starter = r.W.d <= r.R.d ? "W" : "R";
    log(
      starter,
      "info",
      `${nameOf(starter)} starts.`,
      `White stopped ${Math.round(r.W.d)} mm from its goal, red ${Math.round(r.R.d)} mm. Closest starts. (SP/5.1)`,
    );
  }
  G.lastShot.starter = starter;
  G.nextMode = "fresh";
  G.nextColor = starter;
  G.openingBall = G.open.ids[starter];
  processQueue();
}

function evalStroke() {
  const s = G.stroke,
    sb = ball(s.shooter),
    c = sb.c,
    o = other(c);
  const fc = s.first[s.shooter],
    hard = s.power >= HARD,
    at0 = { t: 0, x: s.start.x, y: s.start.y };
  let foul = null;
  if (fc && fc.type === "ball" && ball(fc.id).c === c)
    foul = foulInfo("own", c, sb, fc);
  else if (hard && onderStoot(c, s.start) && !inKlein(c, s.start))
    foul = foulInfo("hard", c, sb, at0);
  else if (hard && inVlieg(s.start)) foul = foulInfo("fly", c, sb, at0);
  G.queue = [];
  G.lastPots = s.pots;
  shot();
  if (foul) {
    G.lastShot.foul = { ...foul, next: PENALTY };
    G.balls = clone(G.snap);
    log(
      c,
      "fout",
      `Foul: ${foul.title.toLowerCase()} by ${nameOf(c)}.`,
      `${foul.why} ${PENALTY} (${foul.code})`,
    );
    G.queue = [s.shooter];
    G.nextMode = "switch";
    G.nextColor = o;
    processQueue();
    return;
  }
  const own = s.pots.filter((p) => p.c === c && p.h === att(c));
  const wrong = s.pots.filter((p) => p.c === c && p.h !== att(c));
  const opp = s.pots.filter((p) => p.c !== c);
  if (own.length)
    log(
      c,
      "doel",
      own.length === 1
        ? `Goal for ${nameOf(c)}. Shoot again.`
        : `${own.length} goals in one shot for ${nameOf(c)}. Shoot again.`,
    );
  if (opp.length)
    log(
      o,
      "doel",
      `${opp.length === 1 ? "A ball" : opp.length + " balls"} of ${nameOf(o)} went into a goal.`,
      "Knocking an opponent's ball into any goal scores it for them. (SP/7.2)",
    );
  if (wrong.length) {
    const p = wrong[wrong.length - 1];
    G.lastShot.foul = foulInfo("wrong", c, ball(p.id), p, {
      next: own.length
        ? "The ball goes to a penalty spot, but you also scored, so you keep shooting. (SP/7.3)"
        : "Turn over and the ball goes to a penalty spot.",
    });
    wrong.forEach((p) => G.queue.push(p.id));
    log(
      c,
      "fout",
      `Foul: ${nameOf(c)}'s ball went into the wrong goal.`,
      "Your balls only count in the goal at the far end. It goes to a penalty spot" +
        (own.length
          ? ", but you also scored, so you keep shooting. (SP/7.3)"
          : " and your turn ends. (SP/7.2)"),
    );
  }
  if (own.length) {
    G.nextMode = "continue";
    G.nextColor = c;
  } else {
    G.nextMode = "switch";
    G.nextColor = o;
    const ended = remaining("W") === 0 || remaining("R") === 0;
    if (!ended && triCheck()) {
      /* logged */
    } else if (!wrong.length) log(c, "beurt", `No goal. ${nameOf(o)} to play.`);
  }
  processQueue();
}

function triCheck() {
  const c = G.turn,
    ti = G.turnInfo;
  if (!ti.obligated.length) return false;
  const stay = ti.obligated.filter((id) => !ti.left[id]);
  const viol =
    ti.obligated.length === 1
      ? stay.length === 1
      : stay.length === ti.obligated.length;
  if (!viol) return false;
  const b = ball(stay[0]);
  if (G.lastShot)
    G.lastShot.foul = foulInfo(
      "tri",
      c,
      b,
      { t: -1, x: b.x, y: b.y },
      { next: PENALTY },
    );
  G.balls = clone(G.snap);
  G.queue = stay.slice();
  log(
    c,
    "fout",
    `Foul: ${nameOf(c)} left a ball parked in the big triangle.`,
    `${FOULS.tri.why} ${PENALTY} (SP/9.${ti.obligated.length > 1 ? 2 : 1})`,
  );
  return true;
}

export function timeout() {
  const c = G.turn;
  G.strokeNo++;
  G.stroke = null;
  shot({
    shooter: c,
    foul: foulInfo("time", c, null, null, { next: "Turn over." }),
  });
  log(
    c,
    "fout",
    `Foul: ${nameOf(c)} ran out of time.`,
    "You have one minute per shot. Your turn ends. (SP/3.2)",
  );
  G.snap = clone(G.balls);
  G.queue = [];
  G.lastPots = [];
  G.nextMode = "switch";
  G.nextColor = other(c);
  triCheck();
  processQueue();
  changed();
  push();
}

// ---------- Penalty spots (SP/12) ----------
export function spots(c) {
  const g = att(c); // "the offender's goal" is the goal they attack, see SP/12.2
  return [
    { n: "1", x: g * (HX - R), y: -(DD_Y + DOP_R + 3 + R) },
    { n: "2", x: g * (HX - R), y: DD_Y + DOP_R + 3 + R },
    { n: "3", x: g * (90 - DOP_R - R), y: 0 },
    { n: "4", x: -g * 17.4, y: -135 },
    { n: "5", x: -g * 17.4, y: 135 },
  ];
}
function free(x, y) {
  if (Math.abs(x) > HX - R + 0.1 || Math.abs(y) > HY - R + 0.1) return false;
  if (G.balls.some((b) => b.on && Math.hypot(b.x - x, b.y - y) < 2 * R - 0.2))
    return false;
  if (DOPS.some((d) => Math.hypot(d.x - x, d.y - y) < R + DOP_R - 0.2))
    return false;
  return true;
}
function spiral(c) {
  const base = spots(c)[2];
  for (let r = 70; r < 900; r += 35)
    for (let a = 0; a < Math.PI * 2; a += 0.3) {
      const x = base.x + Math.cos(a) * r,
        y = base.y + Math.sin(a) * r;
      if (free(x, y)) return { n: "free", x, y };
    }
  return { n: "free", x: 0, y: 0 };
}
function place(b, p) {
  Object.assign(b, {
    x: p.x,
    y: p.y,
    vx: 0,
    vy: 0,
    wx: 0,
    wy: 0,
    wz: 0,
    on: true,
    potN: 0,
  });
}

function processQueue() {
  while (G.queue.length) {
    const b = ball(G.queue[0]);
    b.on = false;
    b.vx = b.vy = 0;
    const sp = spots(b.c);
    if (free(sp[0].x, sp[0].y) && free(sp[1].x, sp[1].y)) {
      G.phase = "penalty";
      G.penChoice = { id: b.id, opts: [sp[0], sp[1]] };
      changed();
      return;
    }
    const p = sp.find((q) => free(q.x, q.y)) || spiral(b.c);
    place(b, p);
    log(b.c, "info", `${nameOf(b.c)}'s ball placed on penalty spot ${p.n}.`);
    G.queue.shift();
  }
  afterQueue();
}
export function choosePen(i) {
  const pc = G.penChoice;
  if (!pc) return;
  const b = ball(pc.id),
    p = pc.opts[i];
  place(b, p);
  log(
    other(b.c),
    "info",
    `${nameOf(other(b.c))} put ${nameOf(b.c)}'s ball on penalty spot ${p.n}.`,
  );
  G.queue.shift();
  G.penChoice = null;
  processQueue();
  changed();
  push();
}

function checkWinner() {
  const w = remaining("W"),
    r = remaining("R");
  if (w && r) return null;
  if (!w && !r) {
    const last = (c) =>
      Math.max(-1, ...G.lastPots.filter((p) => p.c === c).map((p) => p.t));
    return last("W") <= last("R") ? "W" : "R";
  }
  return !w ? "W" : "R";
}
function afterQueue() {
  G.penChoice = null;
  const w = checkWinner();
  if (w) {
    mancheEnd(w);
    changed();
    return;
  }
  if (G.nextMode === "continue") {
    G.phase = "aim";
    resetTimer();
  } else if (G.nextMode === "redoOpening") startOpening();
  else beginTurn(G.nextColor, G.nextMode === "fresh" ? G.openingBall : null);
  G.openingBall = null;
  changed();
}
function mancheEnd(wc) {
  const p = G.colorOf.indexOf(wc);
  G.wins[p]++;
  G.endWinner = p;
  G.phase = G.wins[p] >= 2 ? "matchEnd" : "mancheEnd";
  if (G.lastShot) {
    G.lastShot.end = G.phase === "matchEnd" ? "match" : "game";
    G.lastShot.winner = wc;
  }
  log(
    wc,
    "doel",
    `${G.names[p]} wins game ${G.manche}.` +
      (G.phase === "matchEnd"
        ? ` Match won ${G.wins[p]}-${G.wins[1 - p]}.`
        : ""),
  );
}

// Runs a shot to the end without drawing anything: used by tests and by the CPU.
export function runToRest(dt = 1 / 600, max = 60000) {
  let n = 0;
  while (G.phase === "moving" && n++ < max) {
    step(dt);
    trackTri();
    if (allStill()) onSettled();
  }
}
