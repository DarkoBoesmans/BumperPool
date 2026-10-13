// Frame play (SP/10), the guarded goal (SP/9.5) and the spot rule in frame play (SP/12.3).
import { describe, expect, test } from "bun:test";
import * as g from "../src/core";
import { framesOf, frameAt } from "../src/core/frames";
import { setup, at } from "./helpers";

const shoot = (dx: number, dy: number, v: number) => {
  g.fire(0, { dx, dy, p: at(v) });
  g.runToRest();
  return g.G.lastShot!.foul?.key;
};

describe("frames", () => {
  test("the cloth's lines make the frames; your own defence triangle is no frame for you (SP/9.4)", () => {
    expect(frameAt("W", { x: 0, y: 400 })).toBe(14); // strip along the long cushion
    expect(frameAt("W", { x: 0, y: 0 })).toBe(13); // the diamond round the middle posts
    expect(frameAt("W", { x: 700, y: 0 })).toBe(11); // the triangle white attacks
    expect(frameAt("R", { x: 700, y: 0 })).toBe(9); // the same spot for red: its own goal, so the middle band
    expect(frameAt("W", { x: 200, y: 250 })).toBe(3); // a side box
    const onLine = { id: 0, c: "W" as const, x: 200, y: 180, vx: 0, vy: 0, wx: 0, wy: 0, wz: 0, on: true, potN: 0 };
    expect(framesOf(onLine)).toEqual([3, 9]);
  });

  test("frame play: a shot that moves no ball out of its frame is a foul, one that does is not (SP/10.2)", () => {
    const table = [
      { c: "W" as const, x: 200, y: 250 },
      { c: "R" as const, x: -835, y: 330 },
    ];
    setup(table);
    g.G.framePlay = true;
    expect(shoot(1, 0, 150)).toBe("frame"); // rolls 6 cm, still in its side box
    setup(table);
    g.G.framePlay = true;
    expect(shoot(1, 0, 400)).toBeUndefined(); // crosses the dashed line into the next box
  });

  test("from the attack triangle you need not change frames (SP/10.2.2)", () => {
    setup([
      { c: "W", x: 650, y: 0 },
      { c: "R", x: -835, y: 330 },
    ]);
    g.G.framePlay = true;
    expect(shoot(0, 1, 100)).not.toBe("frame"); // SP/9.1 may still call the parked ball, frame play does not
  });

  test("frame play starts once a player is down to one ball", () => {
    setup([
      { c: "W", x: 700, y: 0 },
      { c: "W", x: -600, y: -300 },
      { c: "R", x: -835, y: 330 },
    ]);
    shoot(1, 0, 500); // a goal: white is down to one ball
    expect(g.G.framePlay).toBe(true);
  });

  test("SP/9.5: your ball may not stop in the big triangle while their ball guards the small one", () => {
    setup([
      { c: "W", x: 300, y: 200 },
      { c: "R", x: 790, y: 0 },
      { c: "R", x: -835, y: 330 },
    ]);
    expect(shoot(1, 0, 300)).toBe("small");
    expect(g.G.phase).toBe("penalty");
  });

  test("SP/12.3: in frame play a spot a foul was shot from is used no more", () => {
    setup([
      { c: "W", x: 200, y: 250 },
      { c: "R", x: -835, y: 330 },
    ]);
    g.G.framePlay = true;
    shoot(1, 0, 150);
    g.choosePen(0); // red puts white on spot 1
    const s1 = g.spots("W")[0];
    expect(Math.hypot(g.ball(0).x - s1.x, g.ball(0).y - s1.y)).toBeLessThan(1);
    g.G.turn = "W";
    g.G.phase = "aim";
    shoot(0, 1, 60); // a tiny nudge from spot 1: no ball leaves its frame, another foul
    expect(g.G.spotFouls).toContain("W1");
    expect(g.G.penChoice).toBeNull(); // spots 1 and 2 are no longer a choice
    expect(Math.hypot(g.ball(0).x - s1.x, g.ball(0).y - s1.y)).toBeGreaterThan(1);
  });
});
