// Shared shapes. Units on the table: millimetres and seconds, x along the length, y across, origin in the middle.
// The people (looks, the CPU, grades, regulars) are in types-people.ts; everything is imported from here.
export type * from "./types-people";

export type Color = "W" | "R";
export type Mode = "local" | "cpu" | "online";
export type Phase = "openW" | "openR" | "aim" | "moving" | "wait" | "penalty" | "mancheEnd" | "matchEnd";

export interface Point {
  x: number;
  y: number;
}

export interface Ball extends Point {
  id: number;
  c: Color;
  vx: number;
  vy: number;
  /** angular velocity in the frame (table x, up, table y), rad/s */
  wx: number;
  wy: number;
  wz: number;
  on: boolean;
  /** order in which balls dropped, for the return tray */
  potN: number;
  /** goal this ball is skimming over too fast to drop (+1 or -1), 0 when none */
  skim?: number;
  /** turned to stone by Minerva's shield: can't be played and doesn't move when hit */
  stone?: boolean;
  /** chalk dust on it from the tip: more grip (throw) on the next ball it hits */
  chalk?: boolean;
}

/** A shot: direction, power 0..1 (see core/power.ts), where the tip hits (-1..1 each way). */
export interface Shot {
  dx: number;
  dy: number;
  p: number;
  sx?: number;
  sy?: number;
  /** fresh chalk on the tip: some dust lands on the ball and it clings to the first ball it hits */
  chalk?: boolean;
}

export type HitType = "band" | "dop" | "ball";
export interface Hit extends Point {
  type: HitType;
  side?: "x+" | "x-" | "y+" | "y-";
  id?: number;
  t: number;
}

export interface Pot extends Point {
  id: number;
  c: Color;
  /** which goal: +1 is the goal at +x */
  h: number;
  t: number;
}

export interface Stroke {
  opening: boolean;
  shooter: number;
  first: Record<number, Hit>;
  pots: Pot[];
  power: number;
  spin: [number, number];
  start: Point;
  /** the direction the cue sent the ball */
  aim: Point;
  /** cushions, posts and balls the cue ball met: trick shot flair */
  touches: number;
  /** frame play (SP/10): the frames each ball started in, and the balls that left theirs */
  frames?: Record<number, number[]>;
  moved?: Record<number, boolean>;
  /** the penalty spot the cue ball was shot from, if any (SP/12.3) */
  fromSpot?: string;
}

export type LogKind = "info" | "fout" | "doel" | "beurt";
export interface LogEntry {
  n: number;
  c: Color | null;
  kind: LogKind;
  /** English, with {placeholders}; the HUD translates when it draws, so a language switch redraws old lines too */
  text: string;
  why: string;
  v?: Record<string, string | number>;
}

export type FoulKey = "own" | "hard" | "fly" | "tri" | "small" | "frame" | "wrong" | "open" | "time";
export interface Foul extends Point {
  key: FoulKey;
  code: string;
  title: string;
  why: string;
  c: Color;
  ball: number | null;
  t: number;
  next?: string;
}

/** a goal that was more than a plain direct shot: off a cushion or a post, a combination, two at once, a carom
 * off two or more things, or from the far half */
export type Trick = "bank" | "post" | "combo" | "double" | "carom" | "long";

export interface LastShot {
  n: number;
  shooter: Color | null;
  pots: Pot[];
  foul: Foul | null;
  end: "game" | "match" | null;
  winner?: Color;
  starter?: Color;
  opening?: boolean;
  /** a goal worth knocking on the table for (house rule), see core/verdict.ts */
  trick?: Trick | null;
}

export interface Spot extends Point {
  n: string;
}

/** what the referee enforces: the book, or house rules in freeplay */
export interface Rules {
  /** games in the match: 1, 3 or 5 */
  games: 1 | 3 | 5;
  own: boolean;
  hard: boolean;
  fly: boolean;
  tri: boolean;
  /** frame play once a player is down to one ball (SP/10) */
  frames: boolean;
  spin: boolean;
  golden: boolean;
}

export type NextMode = "switch" | "continue" | "fresh" | "redoOpening";

export interface Game {
  mode: Mode;
  /** the book, or freeplay house rules */
  rules: Rules;
  opp: string | null;
  names: [string, string];
  seats: (string | null)[];
  wins: [number, number];
  manche: number;
  /** colour each player has this game: index 0 is player 1 */
  colorOf: [Color, Color];
  balls: Ball[];
  phase: Phase;
  turn: Color;
  log: LogEntry[];
  queue: number[];
  open: {
    ids: Record<Color, number>;
    strikes: Record<Color, number>;
    shots: Partial<Record<Color, Shot>>;
  };
  stroke: Stroke | null;
  snap: Ball[] | null;
  turnInfo: { obligated: number[]; left: Record<number, boolean> };
  nextMode: NextMode;
  nextColor: Color;
  openingBall: number | null;
  timeLeft: number;
  warned: boolean;
  lastPots: Pot[];
  lastShot: LastShot | null;
  simT: number;
  strokeNo: number;
  potN: number;
  penChoice: { id: number; opts: Spot[] } | null;
  endWinner: number | null;
  mover: string | null;
  /** a Pearlescent legend's table power, once per game */
  powerUsed: boolean;
  /** online: two to a side, seats 2 and 3 are the partners of seats 0 and 1 */
  doubles?: boolean;
  /** online: who chalked their name on the board to play the winner, in order */
  board?: string[];
  /** doubles: how often each colour has come to the table this game, so partners take turns (see core/doubles.ts) */
  visits?: Record<Color, number>;
  /** frame play has started this game (SP/10), and the penalty spots a foul was shot from since (SP/12.3) */
  framePlay?: boolean;
  spotFouls?: string[];
}
