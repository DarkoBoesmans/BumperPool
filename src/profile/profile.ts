// You: name, look, record, tokens, what you own and which grades are open. Kept in this browser only (localStorage).
import type { Grade, GradeId, Look } from "../types";
import { GRADES } from "../data/grades";
import { OPPONENTS, findOpponent, gradeOf } from "../data/regulars";
import { ITEMS, STARTER, itemById, type FreeStats, type Item } from "../data/shop";

const KEY = "golfbiljart.profile";

export const DEFAULT_LOOK: Look = {
  skin: "#e2ae8c",
  shirt: "#26262c",
  trim: "#c9a35b",
  pants: "#17171b",
  hair: "#2a1a12",
  hairStyle: "short",
  hat: "none",
  hatColor: "#2a1a12",
  build: 1,
  frame: "straight",
  bottom: "trousers",
  facial: "none",
  glasses: "none",
  lips: "",
  eyeshadow: "",
  lashes: false,
  blush: false,
  earrings: "none",
  necklace: "none",
  bowtie: false,
  pattern: "none",
};

export interface Shame {
  who: string;
  by: string;
  at: number;
}
export interface Profile {
  name: string;
  look: Look;
  beaten: Record<string, boolean>;
  wins: number;
  losses: number;
  crawled: number;
  sentUnder: number;
  pearl: boolean;
  tokens: number;
  owned: Record<string, boolean>;
  equip: { cue: string; table: string; bar: string };
  free: FreeStats;
  shame: Shame[];
  streak: number;
  best: number;
  /** venues you have played in */
  seen: Record<string, boolean>;
}

const fresh = (): Profile => ({
  name: "",
  look: { ...DEFAULT_LOOK },
  beaten: {},
  wins: 0,
  losses: 0,
  crawled: 0,
  sentUnder: 0,
  pearl: false,
  tokens: 0,
  owned: Object.fromEntries(STARTER.map((id) => [id, true])),
  equip: { cue: "cue-house", table: "tbl-mahogany", bar: "bar-golden" },
  free: { wins: 0, sentUnder: 0, beat: {}, legendSweep: false },
  shame: [],
  streak: 0,
  best: 0,
  seen: { golden: true },
});

/** profiles saved by older versions kept hair styles in `hat` and used true/false for facial hair and lipstick */
export function migrateLook(l: Record<string, unknown>): Look {
  const look = { ...DEFAULT_LOOK, ...(l as Partial<Look>) };
  if (!l.hairStyle) {
    const hat = l.hat as string;
    if (hat === "perm" || hat === "bun" || hat === "pony") {
      look.hairStyle = hat;
      look.hat = "none";
    }
  }
  if (l.beard === true) look.facial = "beard";
  else if (l.stache === true) look.facial = "stache";
  if (l.glasses === true) look.glasses = "round";
  if (l.lips === true) look.lips = "#b51f2a";
  return look;
}

export const me: Profile = fresh();
try {
  const s = JSON.parse(globalThis.localStorage?.getItem(KEY) || "{}");
  Object.assign(me, s, {
    look: migrateLook(s.look || {}),
    beaten: { ...s.beaten },
    owned: { ...me.owned, ...s.owned },
    equip: { ...me.equip, ...s.equip },
    free: { ...me.free, ...s.free, beat: { ...s.free?.beat } },
    shame: s.shame || [],
    seen: { ...me.seen, ...s.seen },
  });
} catch {
  /* no storage (private mode, tests): start fresh */
}
export const saveMe = (): void => {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(me));
  } catch {
    /* not saved */
  }
};
export const resetMe = (): void => {
  Object.assign(me, fresh());
  saveMe();
};
export const myName = (): string => me.name.trim() || "Player";

// ---------- grades and the story ----------
/** a grade opens once you have beaten all three regulars of the grade before it; Pearlescent opens with the Konami code */
export function unlocked(gradeId: GradeId): boolean {
  const i = GRADES.findIndex((g) => g.id === gradeId);
  if (i < 0) return false;
  if (GRADES[i].secret) return me.pearl;
  return i === 0 || OPPONENTS.filter((o) => o.grade === GRADES[i - 1].id).every((o) => me.beaten[o.id]);
}
export const visibleGrades = (): Grade[] => GRADES.filter((g) => !g.secret || me.pearl);
export const beatenCount = (): number => OPPONENTS.filter((o) => me.beaten[o.id]).length;
export const TOTAL = OPPONENTS.length;
/** the next regular the story sends you to, or null when everyone you can reach is beaten */
export function nextInStory(): string | null {
  for (const o of OPPONENTS) if (unlocked(o.grade) && !me.beaten[o.id]) return o.id;
  return null;
}
export const allRegularsBeaten = (): boolean =>
  OPPONENTS.filter((o) => o.grade !== "pearl").every((o) => me.beaten[o.id]);

// ---------- matches ----------
export interface MatchResult {
  opened: Grade | null;
  tokens: number;
  items: Item[];
}
/** after a match against a regular */
export function recordMatch(
  oppId: string,
  won: boolean,
  o: { freeplay?: boolean; games?: [number, number] } = {},
): MatchResult {
  const before = GRADES.filter((g) => unlocked(g.id)).map((g) => g.id),
    had = earnable(),
    opp = findOpponent(oppId);
  let tokens = 0;
  if (won) {
    me.wins++;
    me.streak++;
    me.best = Math.max(me.best, me.streak);
    me.beaten[oppId] = true;
    tokens = o.freeplay ? Math.round(gradeOf(opp).prize / 2) : gradeOf(opp).prize;
    if (o.freeplay) {
      me.free.wins++;
      me.free.beat[oppId] = true;
      if (opp.grade === "legendary" && o.games && o.games[1] === 0) me.free.legendSweep = true;
    }
  } else {
    me.losses++;
    me.streak = 0;
    tokens = 5;
  }
  me.tokens += tokens;
  saveMe();
  return {
    opened: GRADES.find((g) => unlocked(g.id) && !before.includes(g.id)) || null,
    tokens,
    items: earnable().filter((i) => !had.includes(i)),
  };
}
/** 5-0: the loser crawls under the table and goes on the Wall of Shame */
export function recordCrawl(mine: boolean, who: string, by: string, freeplay = false): void {
  if (mine) me.crawled++;
  else {
    me.sentUnder++;
    if (freeplay) me.free.sentUnder++;
  }
  me.shame.unshift({ who, by, at: Date.now() });
  me.shame.length = Math.min(me.shame.length, 12);
  saveMe();
}

// ---------- the shop ----------
/** freeplay rewards you have earned but not collected */
const earnable = (): Item[] => ITEMS.filter((i) => i.free && !me.owned[i.id] && i.free.ok(me.free));
export function canBuy(i: Item): boolean {
  if (me.owned[i.id]) return false;
  if (i.free) return i.free.ok(me.free);
  if (i.venue && !me.seen[i.venue]) return false;
  return me.tokens >= i.price;
}
export function buy(id: string): boolean {
  const i = itemById(id);
  if (!i || !canBuy(i)) return false;
  if (!i.free) me.tokens -= i.price;
  me.owned[id] = true;
  equip(id);
  return true;
}
export function equip(id: string): void {
  const i = itemById(id);
  if (!i || !me.owned[id]) return;
  if (i.slot === "cue") me.equip.cue = id;
  else if (i.slot === "table") me.equip.table = id;
  else if (i.slot === "bar") me.equip.bar = id;
  else if (i.look) Object.assign(me.look, i.look);
  saveMe();
}
export const equipped = (id: string): boolean => {
  const i = itemById(id);
  if (!i) return false;
  if (i.slot === "cue") return me.equip.cue === id;
  if (i.slot === "table") return me.equip.table === id;
  if (i.slot === "bar") return me.equip.bar === id;
  return !!i.look && Object.entries(i.look).every(([k, v]) => me.look[k as keyof Look] === v);
};
export const homeVenue = (): string => itemById(me.equip.bar)?.venue || "golden";
export function sawVenue(id: string): void {
  if (me.seen[id]) return;
  me.seen[id] = true;
  saveMe();
}
