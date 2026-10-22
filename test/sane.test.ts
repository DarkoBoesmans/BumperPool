// Online play: a broken or hostile table update never reaches the game.
import { describe, expect, test } from "bun:test";
import * as g from "../src/core";
import { saneGame, saneEmote, saneMember, saneListing } from "../src/net/sane";
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
    expect(bad((x) => (x.seats = ["<img src=x>", null]))).toBe(false);
    expect(bad((x) => (x.board = ["a1b2c3d4", "a1b2c3d4", "a1b2c3d4", "a1b2c3d4", "a1b2c3d4"]))).toBe(false);
    expect(saneEmote({ c: "W", kind: "knock" })).toBe(true);
    expect(saneEmote({ c: "W", kind: "<script>" })).toBe(false);
    expect(saneMember({ name: "Darko", look: { skin: "#e0b090", build: 1, bowtie: true }, at: 1 })).toBe(true);
    expect(saneMember({ name: "x".repeat(40), look: null, at: 1 })).toBe(false);
    expect(saneMember({ name: "Darko", look: { skin: { evil: 1 } }, at: 1 })).toBe(false);
    expect(saneListing({ code: "KX7P", host: "Darko", n: 2 })).toBe(true);
    expect(saneListing({ code: "../../x", host: "Darko", n: 2 })).toBe(false);
  });
});
