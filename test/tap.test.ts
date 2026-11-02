// Tapping a pint: shut the tap at two fingers and skim straight away is perfect; early is foam, late is flat or
// down the drain.
import { describe, expect, test } from "bun:test";
import { newPint, pour, skim, score, gradeOf, HEAD, type Pint } from "../src/core/tap";

/** the tap open `hold` seconds, then `wait` before the skim */
function tap(hold: number, wait: number): Pint {
  const p = newPint();
  p.open = true;
  for (let t = 0; t < hold; t += 0.01) pour(p, 0.01);
  p.open = false;
  for (let t = 0; t < wait; t += 0.01) pour(p, 0.01);
  skim(p);
  return p;
}

describe("tap", () => {
  test("shut at two fingers under the rim and skimmed at once: a full glass, two fingers of foam", () => {
    const p = tap(2.7, 0.3);
    expect(p.beer + p.foam).toBeCloseTo(1, 2);
    expect(Math.abs(p.foam - HEAD)).toBeLessThan(0.04);
    expect(p.spill).toBe(0);
    expect(gradeOf(score(p))).toBe("perfect");
  });
  test("shut early: a glass of foam", () => {
    expect(gradeOf(score(tap(2.2, 0)))).not.toBe("perfect");
  });
  test("a short pour is half a glass", () => {
    expect(gradeOf(score(tap(1.2, 0.5)))).toBe("bad");
  });
  test("the tap left open runs beer down the drain", () => {
    const p = tap(6, 0.3);
    expect(p.spill).toBeGreaterThan(0.3);
    expect(gradeOf(score(p))).toBe("bad");
  });
  test("left standing before the skim the head sinks: flat and not full", () => {
    const p = tap(2.7, 6);
    expect(p.beer + p.foam).toBeLessThan(0.95);
    expect(gradeOf(score(p))).not.toBe("perfect");
  });
});
