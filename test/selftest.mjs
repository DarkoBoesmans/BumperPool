// Referee, spin physics and opponent checks. Runs in Node or Bun without a browser: `bun run test`.
import assert from "node:assert/strict";
import * as g from "../src/game.js";
import { planCpu } from "../src/cpu.js";
import { OPPONENTS, GRADES } from "../src/opponents.js";

const results = [];
const check = (name, fn) => {
  try {
    fn();
    results.push("ok    " + name);
  } catch (e) {
    results.push("FAIL  " + name + "\n      " + e.message);
  }
};
const setup = (balls) => {
  g.setG(null);
  g.newMatch("local");
  g.G.balls = balls.map((b, id) => ({
    id,
    vx: 0,
    vy: 0,
    wx: 0,
    wy: 0,
    wz: 0,
    on: true,
    potN: 0,
    ...b,
  }));
  g.G.queue = [];
  g.beginTurn("W", null);
};
const logged = (code) => g.G.log.some((e) => e.why.includes(code));
// Pure physics: strike one ball and let everything roll out, no referee.
function roll(balls, s) {
  setup(balls);
  g.G.stroke = { first: {}, pots: [] };
  g.strike(g.G.balls[0], s);
  let n = 0;
  while (!g.allStill() && n++ < 60000) g.step(1 / 600);
  return g.G.balls;
}

check("straight ball between the goal posts counts, white shoots again", () => {
  setup([
    { c: "W", x: 700, y: 0 },
    { c: "W", x: -600, y: -300 },
    { c: "R", x: -835, y: 330 },
  ]);
  g.fire(0, { dx: 1, dy: 0, p: 0.3 });
  g.runToRest();
  assert.ok(!g.ball(0).on);
  assert.equal(g.G.turn, "W");
  assert.equal(g.G.phase, "aim");
  assert.equal(g.G.lastShot.pots.length, 1);
});

check(
  "SP/8.1 own ball first, then penalty spot, moved ball back, red to play",
  () => {
    setup([
      { c: "W", x: -300, y: -300 },
      { c: "W", x: -100, y: -300 },
      { c: "R", x: -835, y: 330 },
    ]);
    g.fire(0, { dx: 1, dy: 0, p: 0.2 });
    g.runToRest();
    assert.equal(g.G.phase, "penalty");
    assert.ok(logged("SP/8.1"));
    assert.equal(g.G.lastShot.foul.key, "own");
    assert.ok(g.G.lastShot.foul.t > 0, "foul has a moment for the replay");
    g.choosePen(0);
    assert.equal(g.G.turn, "R");
    assert.ok(Math.abs(g.ball(0).x - (g.HX - g.R)) < 1);
    assert.equal(g.ball(1).x, -100);
  },
);

check("SP/7.4 hard shot below the shooting line", () => {
  setup([
    { c: "W", x: 850, y: 200 },
    { c: "W", x: -600, y: -300 },
    { c: "R", x: -835, y: 330 },
  ]);
  g.fire(0, { dx: -1, dy: 0, p: 0.8 });
  g.runToRest();
  assert.ok(logged("SP/7.4"));
  assert.equal(g.G.lastShot.foul.key, "hard");
});

check("SP/6.7 hard flyer from the cushion strip", () => {
  setup([
    { c: "W", x: -400, y: -410 },
    { c: "W", x: -600, y: 100 },
    { c: "R", x: -835, y: 330 },
  ]);
  g.fire(0, { dx: 1, dy: 0, p: 0.7 });
  g.runToRest();
  assert.equal(g.G.lastShot.foul.key, "fly");
});

check("SP/9.1 ball stayed in the big triangle", () => {
  setup([
    { c: "W", x: 600, y: 100 },
    { c: "W", x: -600, y: -300 },
    { c: "R", x: -835, y: 330 },
  ]);
  g.fire(1, { dx: 0, dy: 1, p: 0.1 });
  g.runToRest();
  assert.ok(logged("SP/9.1"));
  assert.equal(g.G.phase, "penalty");
  assert.equal(g.G.lastShot.foul.key, "tri");
});

check("zones match the NLGB drawing", () => {
  assert.ok(
    g.inKlein("W", { x: 800, y: 0 }) && !g.inKlein("W", { x: 700, y: 0 }),
  );
  assert.ok(
    !g.onderStoot("W", { x: 400, y: 50 }) &&
      g.onderStoot("W", { x: 800, y: 150 }),
  );
});

check(
  "spin: draw comes back, follow runs on, centre ball stops in between",
  () => {
    const at = (sy) =>
      roll(
        [
          { c: "W", x: -400, y: -300 },
          { c: "R", x: -150, y: -300 },
        ],
        { dx: 1, dy: 0, p: 0.3, sx: 0, sy },
      )[0].x;
    const draw = at(-1),
      stun = at(0),
      follow = at(1);
    assert.ok(
      draw < -400,
      `draw ends at ${draw.toFixed(0)}, behind where it started`,
    );
    assert.ok(
      stun > draw + 200 && stun < 0,
      `centre ends at ${stun.toFixed(0)}`,
    );
    assert.ok(
      follow > stun + 300,
      `follow ${follow.toFixed(0)} vs centre ${stun.toFixed(0)}`,
    );
  },
);

check("spin: side spin throws the ball sideways off a cushion", () => {
  const vx = (sx) => {
    const b = roll([{ c: "W", x: 400, y: 0 }], {
      dx: 0,
      dy: 1,
      p: 0.25,
      sx,
      sy: 0,
    })[0];
    return b.x - 400;
  };
  const right = vx(1),
    none = vx(0),
    left = vx(-1);
  assert.ok(Math.abs(none) < 2, `no spin drifts ${none.toFixed(1)}`);
  assert.ok(
    right < -40 && left > 40,
    `right ${right.toFixed(0)}, left ${left.toFixed(0)} (the shooter's right is -x here)`,
  );
});

check("spin: hitting at 2/5 above centre rolls at once", () => {
  setup([{ c: "W", x: 0, y: -300 }]);
  const b = g.G.balls[0];
  g.strike(b, { dx: 1, dy: 0, p: 0.3, sx: 0, sy: 0.8 });
  assert.ok(Math.abs(b.vx + g.R * b.wz) < 1e-6);
});

check("CPU finds a scoring shot and leaves the real game untouched", () => {
  setup([
    { c: "W", x: -600, y: -300 },
    { c: "R", x: -600, y: 0 },
    { c: "R", x: 500, y: 200 },
  ]);
  Object.assign(g.G, { mode: "cpu", turn: "R", colorOf: ["W", "R"] });
  const ai = OPPONENTS.find((o) => o.id === "baron").ai;
  const job = planCpu("R", ai);
  for (const c of job.cands) {
    const s = job.evalFn(c);
    if (s > job.bestS) {
      job.bestS = s;
      job.best = c;
    }
  }
  assert.ok(job.best && job.bestS > 50, `best score ${job.bestS}`);
  assert.equal(g.G.phase, "aim");
  assert.equal(g.ball(1).x, -600);
  assert.ok(g.ball(1).on);
});

check("a whole match between two CPUs reaches the end", () => {
  g.setG(null);
  g.newMatch("cpu", { names: ["Rosa", "Fred"] });
  const ai = { ...OPPONENTS.find((o) => o.id === "rosa").ai, n: 12 };
  let shots = 0;
  while (g.G.phase !== "matchEnd" && shots < 600) {
    if (g.G.phase === "mancheEnd") {
      g.newManche();
      continue;
    }
    if (g.G.phase === "penalty") {
      g.choosePen(0);
      continue;
    }
    const cc =
      g.G.phase === "openW" ? "W" : g.G.phase === "openR" ? "R" : g.G.turn;
    const job = planCpu(cc, ai);
    for (const c of job.cands) {
      const s = job.evalFn(c);
      if (s > job.bestS) {
        job.bestS = s;
        job.best = c;
      }
    }
    g.fire(job.best.id, job.best.s);
    g.runToRest();
    shots++;
  }
  assert.equal(
    g.G.phase,
    "matchEnd",
    `still ${g.G.phase} after ${shots} shots`,
  );
  console.log(
    `      (${shots} shots, games ${g.G.wins.join("-")}, ${g.G.log.filter((e) => e.kind === "fout").length} fouls)`,
  );
});

check("twelve regulars, three per grade, every name alliterates", () => {
  assert.equal(OPPONENTS.length, 12);
  assert.equal(new Set(OPPONENTS.map((o) => o.id)).size, 12);
  for (const g of GRADES)
    assert.equal(OPPONENTS.filter((o) => o.grade === g.id).length, 3, g.id);
  assert.deepEqual(
    OPPONENTS.filter((o) => o.grade === "legendary")
      .map((o) => o.id)
      .sort(),
    ["baron", "cas", "matthis"],
  );
  for (const o of OPPONENTS) {
    const w = o.name.split(" ");
    assert.equal(w[0][0], w[w.length - 1][0], `${o.name} alliterates`);
    assert.ok(o.traits.length >= 2 && o.ai.n > 0 && o.style, o.id);
    for (const k of [
      "hello",
      "goal",
      "foul",
      "oppGoal",
      "oppFoul",
      "win",
      "lose",
    ])
      assert.ok(o.quips[k]?.length, `${o.id} ${k}`);
  }
  const in3 = (id, k) => OPPONENTS.find((o) => o.id === id).ai[k];
  assert.ok(
    in3("cas", "angle") < in3("baron", "angle") &&
      in3("cas", "n") + in3("cas", "refine") > in3("baron", "n"),
    "Cas is sharper than the Baron",
  );
  assert.ok(
    in3("matthis", "triangle") > 0 && in3("matthis", "mix").post >= 0.3,
    "Matthis plays the triangle and the posts",
  );
});

check("the cue ball counts its cushions for trick shot points", () => {
  setup([
    { c: "W", x: -600, y: 0 },
    { c: "R", x: 835, y: 330 },
  ]);
  g.fire(0, { dx: 0.3, dy: 0.954, p: 0.6 });
  g.runToRest();
  assert.ok(g.G.stroke.touches >= 2, `touches ${g.G.stroke.touches}`);
});

console.log(results.join("\n"));
if (results.some((r) => r.startsWith("FAIL"))) process.exit(1);
