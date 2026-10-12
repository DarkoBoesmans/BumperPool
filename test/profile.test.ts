// Your record: grades opening up, the story counter, tokens, the shop and the Wall of Shame.
import { describe, expect, test } from "bun:test";
import {
  me,
  unlocked,
  recordMatch,
  recordCrawl,
  beatenCount,
  nextInStory,
  TOTAL,
  buy,
  canBuy,
  migrateLook,
  resetMe,
} from "../src/profile/profile";
import { itemById } from "../src/data/shop";

describe("profile", () => {
  test("beating all three regulars of a grade opens the next one", () => {
    resetMe();
    expect(unlocked("common") && !unlocked("uncommon") && !unlocked("pearl")).toBe(true);
    expect(nextInStory()).toBe("kevin");
    expect(recordMatch("kevin", true).opened).toBeNull();
    recordMatch("monique", false);
    expect(unlocked("uncommon")).toBe(false);
    recordMatch("monique", true);
    expect(recordMatch("wim", true).opened?.id).toBe("uncommon");
    expect(beatenCount()).toBe(3);
    expect(TOTAL).toBe(18);
    expect(nextInStory()).toBe("fred");
    me.pearl = true;
    expect(unlocked("pearl")).toBe(true);
    expect(me.wins).toBe(3);
    expect(me.losses).toBe(1);
    expect(me.tokens).toBe(65);
  });

  test("tokens buy looks, freeplay rewards can't be bought", () => {
    resetMe();
    me.tokens = 100;
    expect(buy("cue-redwood")).toBe(true);
    expect(me.tokens).toBe(60);
    expect(me.equip.cue).toBe("cue-redwood");
    expect(canBuy(itemById("cue-champ")!)).toBe(false);
    me.free.wins = 10;
    expect(buy("cue-champ")).toBe(true);
    expect(me.tokens).toBe(60);
  });

  test("freeplay wins count for the freeplay rewards", () => {
    resetMe();
    const r = recordMatch("poseidon", true, { freeplay: true, games: [2, 1] });
    expect(r.items.map((i) => i.id)).toContain("cue-trident");
    expect(r.tokens).toBe(75);
  });

  test("a 5-0 goes on the Wall of Shame", () => {
    resetMe();
    recordCrawl(false, "Kevin", "Player");
    expect(me.shame[0].who).toBe("Kevin");
    expect(me.sentUnder).toBe(1);
  });

  test("old profiles keep their hair", () => {
    const l = migrateLook({ hat: "bun", beard: true, glasses: true, lips: true });
    expect(l.hairStyle).toBe("bun");
    expect(l.hat).toBe("none");
    expect(l.facial).toBe("beard");
    expect(l.glasses).toBe("round");
  });
});
