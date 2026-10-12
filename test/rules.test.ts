// The referee: goals, fouls with their replay moments, penalty spots, the big triangle, zones.
import { describe, expect, test } from "bun:test";
import * as g from "../src/core";
import { setup, logged, at } from "./helpers";
import type { Rules } from "../src/types";

describe("referee", () => {
  test("a straight ball between the goal posts counts and white shoots again", () => {
    setup([
      { c: "W", x: 700, y: 0 },
      { c: "W", x: -600, y: -300 },
      { c: "R", x: -835, y: 330 },
    ]);
    g.fire(0, { dx: 1, dy: 0, p: at(500) });
    g.runToRest();
    expect(g.ball(0).on).toBe(false);
    expect(g.G.turn).toBe("W");
    expect(g.G.phase).toBe("aim");
    expect(g.G.lastShot!.pots.length).toBe(1);
  });

  test("SP/8.1 own ball first: penalty spot, moved ball back, red to play", () => {
    setup([
      { c: "W", x: -300, y: -300 },
      { c: "W", x: -100, y: -300 },
      { c: "R", x: -835, y: 330 },
    ]);
    g.fire(0, { dx: 1, dy: 0, p: at(600) });
    g.runToRest();
    expect(g.G.phase).toBe("penalty");
    expect(logged("SP/8.1")).toBe(true);
    expect(g.G.lastShot!.foul!.key).toBe("own");
    expect(g.G.lastShot!.foul!.t).toBeGreaterThan(0);
    g.choosePen(0);
    expect(g.G.turn).toBe("R");
    expect(Math.abs(g.ball(0).x - (g.HX - g.R))).toBeLessThan(1);
    expect(g.ball(1).x).toBe(-100);
  });

  test("SP/7.4 a hard shot at goal from below the shooting line is a foul, soft or away from the goal is not", () => {
    const shoot = (v: number, dx: number, dy: number) => {
      setup([
        { c: "W", x: 850, y: 200 },
        { c: "W", x: -600, y: -300 },
        { c: "R", x: -835, y: 330 },
      ]);
      g.fire(0, { dx, dy, p: at(v) });
      g.runToRest();
      return g.G.lastShot!.foul?.key;
    };
    expect(shoot(2000, 0, -1)).toBe("hard");
    expect(shoot(1400, 0, -1)).toBeUndefined();
    expect(shoot(2000, -1, 0)).toBeUndefined(); // hard, but not a goal attempt
  });

  test("SP/6.7 a hard flyer from the cushion strip", () => {
    setup([
      { c: "W", x: -400, y: -410 },
      { c: "W", x: -600, y: 100 },
      { c: "R", x: -835, y: 330 },
    ]);
    g.fire(0, { dx: 1, dy: 0, p: at(1800) });
    g.runToRest();
    expect(g.G.lastShot!.foul!.key).toBe("fly");
  });

  test("SP/9.1 a ball that stayed in the big triangle", () => {
    setup([
      { c: "W", x: 600, y: 100 },
      { c: "W", x: -600, y: -300 },
      { c: "R", x: -835, y: 330 },
    ]);
    g.fire(1, { dx: 0, dy: 1, p: at(300) });
    g.runToRest();
    expect(logged("SP/9.1")).toBe(true);
    expect(g.G.phase).toBe("penalty");
    expect(g.G.lastShot!.foul!.key).toBe("tri");
  });

  test("zones match the NLGB drawing", () => {
    expect(g.inKlein("W", { x: 800, y: 0 }) && !g.inKlein("W", { x: 700, y: 0 })).toBe(true);
    expect(!g.onderStoot("W", { x: 400, y: 50 }) && g.onderStoot("W", { x: 800, y: 150 })).toBe(true);
  });

  test("on the line counts: touching the shooting line may go hard at goal, clear below it may not (SP/7.4)", () => {
    // white attacks +x; at u = 400 the shooting line is 137.5 mm off the long axis
    const shoot = (y: number) => {
      setup([
        { c: "W", x: 500, y },
        { c: "W", x: -600, y: -300 },
        { c: "R", x: -835, y: 330 },
      ]);
      const dx = g.GOAL_X - 500,
        l = Math.hypot(dx, y);
      g.fire(0, { dx: dx / l, dy: -y / l, p: at(2000) });
      g.runToRest();
      return g.G.lastShot!.foul?.key;
    };
    expect(shoot(157)).not.toBe("hard"); // 17 mm below the line: the ball still touches it
    expect(shoot(210)).toBe("hard");
  });

  test("a hard shot from the cushion strip away from the cushion is no flyer (SP/6.7)", () => {
    setup([
      { c: "W", x: -400, y: -410 },
      { c: "W", x: -600, y: 100 },
      { c: "R", x: -835, y: 330 },
    ]);
    g.fire(0, { dx: 0.6, dy: 0.8, p: at(1800) });
    g.runToRest();
    expect(g.G.lastShot!.foul?.key).not.toBe("fly");
  });

  test("a ball on the line of the big triangle is inside it (SP/9.3)", () => {
    // 15 mm outside the slanted side by its centre, so the ball overlaps the line
    const u = 300,
      v = (357.7 * u) / 450 + (15 * Math.hypot(450, 357.7)) / 450;
    expect(g.inGroot("W", { x: 900 - u, y: v })).toBe(false);
    expect(g.inGroot("W", { x: 900 - u, y: v }, g.R)).toBe(true);
  });

  test("the cue ball counts its cushions for trick shot points", () => {
    setup([
      { c: "W", x: -600, y: 0 },
      { c: "R", x: 835, y: 330 },
    ]);
    g.fire(0, { dx: 0.3, dy: 0.954, p: at(2500) });
    g.runToRest();
    expect(g.G.stroke!.touches).toBeGreaterThanOrEqual(2);
  });
});

describe("hard", () => {
  test("hard starts at 1.5 m/s, which runs more than three table lengths", () => {
    expect(g.speedOf(g.HARD)).toBeCloseTo(1500, 3);
    expect(g.tables(g.HARD)).toBeGreaterThan(3);
    expect(g.bandOf(g.HARD).id).toBe("hard");
    expect(g.bandOf(g.HARD - 0.01).id).toBe("medium");
  });
});

describe("house rules (freeplay)", () => {
  const house = (r: Partial<Rules>) => (g.G.rules = { ...g.REGLEMENT, ...r });

  test("own ball first is no foul when that rule is off", () => {
    setup([
      { c: "W", x: -300, y: -300 },
      { c: "W", x: -100, y: -300 },
      { c: "R", x: -835, y: 330 },
    ]);
    house({ own: false });
    g.fire(0, { dx: 1, dy: 0, p: at(600) });
    g.runToRest();
    expect(g.G.lastShot!.foul).toBeNull();
    expect(g.G.phase).toBe("aim");
  });

  test("golden goal: one goal wins the game, and with one game the match", () => {
    for (const games of [3, 1] as const) {
      setup([
        { c: "W", x: 700, y: 0 },
        { c: "W", x: -600, y: -300 },
        { c: "R", x: -835, y: 330 },
      ]);
      house({ golden: true, games });
      g.fire(0, { dx: 1, dy: 0, p: at(500) });
      g.runToRest();
      expect(g.G.wins[0]).toBe(1);
      expect(g.G.phase).toBe(games === 1 ? "matchEnd" : "mancheEnd");
    }
  });

  test("no spin: the cue ball leaves without side spin", () => {
    setup([{ c: "W", x: 0, y: -300 }]);
    house({ spin: false });
    g.fire(0, { dx: 1, dy: 0, p: at(800), sx: 1, sy: 0 });
    expect(g.ball(0).wy).toBe(0);
  });

  test("a goal off another of your balls is a lucky one", () => {
    setup([
      { c: "W", x: 500, y: 0 },
      { c: "W", x: 700, y: 0 },
      { c: "R", x: -835, y: 330 },
    ]);
    g.fire(0, { dx: 1, dy: 0, p: at(900) });
    g.runToRest();
    // own ball first is a foul by the book, so try it with that rule off
    expect(g.G.lastShot!.foul?.key).toBe("own");
    setup([
      { c: "W", x: 500, y: 0 },
      { c: "W", x: 700, y: 0 },
      { c: "R", x: -835, y: 330 },
    ]);
    house({ own: false });
    g.fire(0, { dx: 1, dy: 0, p: at(900) });
    g.runToRest();
    expect(g.G.lastShot!.pots.some((p) => p.id === 1)).toBe(true);
    expect(g.G.lastShot!.lucky).toBe(true);
  });
});
