// House rules for freeplay. The story always plays by the book (the GZV rulebook): REGLEMENT.
import type { Rules } from "../types";

export const REGLEMENT: Rules = {
  games: 3,
  own: true,
  hard: true,
  fly: true,
  tri: true,
  frames: true,
  spin: true,
  golden: false,
};

/** the switches on the house rules page, in order: the book's fouls first, then the custom rules */
export const RULE_SWITCHES: { key: Exclude<keyof Rules, "games">; title: string; desc: string; custom?: true }[] = [
  {
    key: "own",
    title: "Own ball first is a foul",
    desc: "Hit one of your own balls first and the turn passes. (SP/8.1)",
  },
  {
    key: "hard",
    title: "No hard shots at goal from the corners",
    desc: "Below the shooting line, a shot straight at the goal must be soft. (SP/7.4)",
  },
  { key: "fly", title: "No hard flyers", desc: "No hard shot from the strip along the long cushions. (SP/6.7)" },
  {
    key: "tri",
    title: "Leave the big triangle",
    desc: "A ball that starts your turn in the big triangle must leave it. (SP/9)",
  },
  {
    key: "frames",
    title: "Frame play",
    desc: "Once a player is down to one ball, every shot must send a ball out of its frame. (SP/10)",
  },
  {
    key: "spin",
    title: "Spin allowed",
    desc: "Off: everybody plays centre ball, no draw, follow or side.",
    custom: true,
  },
  { key: "golden", title: "Golden goal", desc: "The first goal of a game wins that game.", custom: true },
];

export const sameRules = (a: Rules, b: Rules): boolean =>
  (Object.keys(REGLEMENT) as (keyof Rules)[]).every((k) => a[k] === b[k]);
/** games a player needs to win the match */
export const winsNeeded = (r: Rules): number => Math.ceil(r.games / 2);
