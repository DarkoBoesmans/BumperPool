// Ball physics: rolling resistance, spin, throw, the goal lip, Medusa's stone ball.
import { describe, expect, test } from "bun:test";
import * as g from "../src/core";
import { setup, roll, at } from "./helpers";

describe("physics", () => {
  test("a rolling ball runs as far as the carom numbers say (0.01 rolling resistance)", () => {
    for (const v of [300, 600]) {
      const b = roll([{ c: "W", x: -860, y: -400 }], { dx: 1, dy: 0, p: at(v) })[0];
      expect(b.x + 860).toBeCloseTo(g.rollDistance(v), -1);
    }
  });

  test("draw comes back, follow runs on, a centre ball stops in between", () => {
    // the red is lifted off the cloth once hit, so a cushion rebound never runs it back into the white
    const end = (sy: number) => {
      setup([
        { c: "W", x: -800, y: -300 },
        { c: "R", x: -550, y: -300 },
      ]);
      g.G.stroke = {
        opening: false,
        shooter: 0,
        first: {},
        pots: [],
        power: 0,
        spin: [0, 0],
        start: { x: 0, y: 0 },
        aim: { x: 1, y: 0 },
        touches: 0,
      };
      g.strike(g.G.balls[0], { dx: 1, dy: 0, p: at(1500), sx: 0, sy });
      const red = g.G.balls[1];
      for (let n = 0; !g.allStill() && n < 200000; n++) {
        g.step(1 / 600);
        if (red.vx > 0) red.on = false;
      }
      return g.G.balls[0].x;
    };
    const draw = end(-1),
      stun = end(0),
      follow = end(1);
    expect(draw).toBeLessThan(-700);
    expect(stun).toBeGreaterThan(draw + 100);
    expect(follow).toBeGreaterThan(stun + 150);
  });

  test("side spin throws the ball sideways off a cushion", () => {
    const off = (sx: number) => roll([{ c: "W", x: 400, y: 0 }], { dx: 0, dy: 1, p: at(900), sx, sy: 0 })[0].x - 400;
    expect(Math.abs(off(0))).toBeLessThan(2);
    expect(off(1)).toBeLessThan(-40); // the shooter's right is -x here
    expect(off(-1)).toBeGreaterThan(40);
  });

  test("a rolling ball leaves a cushion still rolling at more than half its speed (nose above the centre)", () => {
    // 580 mm/s at the cushion, back at about 0.57 of that: some 0.6 m. Without the nose torque it died after 0.2 m.
    const b = roll([{ c: "W", x: 300, y: 300 }], { dx: 0, dy: 1, p: at(600), sx: 0, sy: 0.8 })[0];
    const back = g.HY - g.R - b.y;
    expect(back).toBeGreaterThan(450);
    expect(back).toBeLessThan(800);
  });

  test("hitting 2/5 above centre rolls at once", () => {
    setup([{ c: "W", x: 0, y: -300 }]);
    const b = g.G.balls[0];
    g.strike(b, { dx: 1, dy: 0, p: 0.4, sx: 0, sy: 0.8 });
    expect(Math.abs(b.vx + g.R * b.wz)).toBeLessThan(1e-6);
  });

  const cutThrow = (chalk: boolean) => {
    setup([
      { c: "W", x: -500, y: -300 },
      { c: "R", x: -200, y: -300 + g.R },
    ]);
    g.G.stroke = {
      opening: false,
      shooter: 0,
      first: {},
      pots: [],
      power: 0,
      spin: [0, 0],
      start: { x: 0, y: 0 },
      aim: { x: 1, y: 0 },
      touches: 0,
    };
    g.strike(g.G.balls[0], { dx: 1, dy: 0, p: at(1500), chalk });
    const o = g.G.balls[1];
    for (let n = 0; o.vx === 0 && n < 100000; n++) g.step(1 / 600);
    return 30 - (Math.atan2(o.vy, o.vx) * 180) / Math.PI;
  };

  test("a half-ball cut throws the object ball one to four degrees off the line of centres", () => {
    const throwDeg = cutThrow(false);
    expect(throwDeg).toBeGreaterThan(0.8);
    expect(throwDeg).toBeLessThan(4);
  });

  test("chalk dust on the cue ball makes the cut throw further, once", () => {
    const chalky = cutThrow(true);
    expect(g.G.balls[0].chalk).toBe(false); // the dust went with the first contact
    expect(chalky).toBeGreaterThan(cutThrow(false) + 0.5);
  });

  test("the lip behind the hole catches a ball hit as hard as you can", () => {
    setup([{ c: "W", x: 500, y: 0 }]);
    g.fire(0, { dx: 1, dy: 0, p: 1 });
    g.runToRest();
    expect(g.ball(0).on).toBe(false);
  });

  test("a stone ball stays put when hit, and wears off when the turn passes", () => {
    setup([
      { c: "W", x: -300, y: -300 },
      { c: "R", x: -100, y: -300 },
      { c: "W", x: 600, y: 300 },
    ]);
    g.ball(1).stone = true;
    g.fire(0, { dx: 1, dy: 0, p: at(800) });
    g.runToRest();
    expect(g.ball(1).x).toBe(-100);
    expect(g.ball(0).x).toBeLessThan(-150);
    g.beginTurn("W", null);
    expect(g.ball(1).stone).toBe(false);
  });
});
