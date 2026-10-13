// Online play: a broken or hostile table update never reaches the game.
import { describe, expect, test } from "bun:test";
import * as g from "../src/core";
import { saneGame, saneEmote } from "../src/net/sane";
import { setup } from "./helpers";

describe("online table updates", () => {
  test("a real game passes, a tampered one is dropped", () => {
    setup([
      { c: "W", x: 700, y: 0 },
      { c: "R", x: -835, y: 330 },
    ]);
    g.log("W", "info", "A real line.");
    const good = structuredClone(g.G);
    expect(saneGame(good)).toBe(true);
    const bad = (f: (x: typeof good) => void) => {
      const x = structuredClone(good);
      f(x);
      return saneGame(x);
    };
    expect(bad((x) => (x.log[0].kind = '"><img src=x onerror=alert(1)>' as never))).toBe(false);
    expect(bad((x) => (x.names[0] = "x".repeat(500)))).toBe(false);
    expect(bad((x) => (x.balls[0].x = Infinity))).toBe(false);
    expect(bad((x) => (x.balls = null as never))).toBe(false);
    expect(saneGame(null)).toBe(false);
    expect(saneEmote({ c: "W", kind: "knock", t: 1 })).toBe(true);
    expect(saneEmote({ c: "W", kind: "<script>", t: 1 })).toBe(false);
  });
});
