// The opponents: finding shots, playing a whole match, their powers, the roster.
import { describe, expect, test } from "bun:test";
import * as g from "../src/core";
import { planCpu, thinkAll } from "../src/cpu/brain";
import { OPPONENTS, findOpponent } from "../src/data/regulars";
import { GRADES } from "../src/data/grades";
import { setup } from "./helpers";

describe("cpu", () => {
  test("finds a scoring shot and leaves the real game untouched", () => {
    setup([
      { c: "W", x: -600, y: -300 },
      { c: "R", x: -600, y: 0 },
      { c: "R", x: 500, y: 200 },
    ]);
    Object.assign(g.G, { mode: "cpu", turn: "R", colorOf: ["W", "R"] });
    const job = thinkAll(planCpu("R", findOpponent("baron").ai));
    expect(job.bestS).toBeGreaterThan(50);
    expect(g.G.phase).toBe("aim");
    expect(g.ball(1).x).toBe(-600);
    expect(g.ball(1).on).toBe(true);
  });

  test("a whole match between two CPUs reaches the end", () => {
    g.setG(null);
    g.newMatch("cpu", { names: ["Rosa", "Fred"] });
    const ai = { ...findOpponent("rosa").ai, n: 12, refine: 0, verify: 0 };
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
      const cc = g.G.phase === "openW" ? "W" : g.G.phase === "openR" ? "R" : g.G.turn;
      const job = thinkAll(planCpu(cc, ai));
      g.fire(job.best!.id, job.best!.s);
      g.runToRest();
      shots++;
    }
    expect(g.G.phase).toBe("matchEnd");
  }, 60000);
});

describe("powers", () => {
  test("thunder clears the balls in front of the legend's goal", () => {
    setup([
      { c: "R", x: -400, y: -300 },
      { c: "R", x: -300, y: 300 },
      { c: "W", x: -700, y: 40 },
    ]);
    Object.assign(g.G, { turn: "R", phase: "aim" });
    expect(g.wantsPower("thunder", "R")).toBe(true);
    const moves = g.usePower("thunder", "R");
    expect(moves.length).toBe(1);
    expect(Math.hypot(g.ball(2).x + g.GOAL_X, g.ball(2).y)).toBeGreaterThan(250);
    expect(g.wantsPower("thunder", "R")).toBe(false);
  });

  test("the stone stare picks your ball nearest your goal", () => {
    setup([
      { c: "W", x: 700, y: 100 },
      { c: "W", x: -300, y: 200 },
      { c: "R", x: -400, y: -300 },
    ]);
    Object.assign(g.G, { turn: "R", phase: "aim" });
    g.usePower("stone", "R");
    expect(g.ball(0).stone).toBe(true);
    expect(g.shootable("W").map((b) => b.id)).toEqual([1]);
  });
});

describe("roster", () => {
  test("five grades of three regulars plus three Pearlescent legends, every name alliterates", () => {
    expect(OPPONENTS.length).toBe(18);
    expect(new Set(OPPONENTS.map((o) => o.id)).size).toBe(18);
    expect(GRADES.map((x) => x.id)).toEqual(["common", "uncommon", "rare", "epic", "legendary", "pearl"]);
    for (const gr of GRADES) expect(OPPONENTS.filter((o) => o.grade === gr.id).length).toBe(3);
    expect(findOpponent("cas").quips.oppGoal).toContain("Okay buddy.");
    for (const o of OPPONENTS) {
      const w = o.name.split(" ");
      expect(w[0][0]).toBe(w[w.length - 1][0]);
      for (const k of ["hello", "goal", "foul", "oppGoal", "oppFoul", "win", "lose"] as const)
        expect(o.quips[k].length).toBeGreaterThan(0);
    }
    const ai = (id: string) => findOpponent(id).ai;
    expect(ai("cas").angle).toBeLessThan(ai("baron").angle);
    expect(ai("matthis").triangle).toBeGreaterThan(0);
    expect(OPPONENTS.filter((o) => o.power).map((o) => o.power)).toEqual(["tide", "stone", "thunder"]);
  });
});
