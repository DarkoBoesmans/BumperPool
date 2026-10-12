// Shared shapes. Units on the table: millimetres and seconds, x along the length, y across, origin in the middle.

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
  /** turned to stone by Medusa: can't be played and doesn't move when hit */
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
}

export type LogKind = "info" | "fout" | "doel" | "beurt";
export interface LogEntry {
  n: number;
  c: Color | null;
  kind: LogKind;
  text: string;
  why: string;
}

export type FoulKey = "own" | "hard" | "fly" | "tri" | "wrong" | "open" | "time";
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

export interface LastShot {
  n: number;
  shooter: Color | null;
  pots: Pot[];
  foul: Foul | null;
  end: "game" | "match" | null;
  winner?: Color;
  starter?: Color;
  opening?: boolean;
  /** a goal with luck in it: off another ball, or after three or more cushions, posts and balls */
  lucky?: boolean;
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
}

// ---------- people ----------
export type HairStyle =
  | "short"
  | "buzz"
  | "bald"
  | "quiff"
  | "side"
  | "curly"
  | "bob"
  | "long"
  | "bun"
  | "pony"
  | "pigtails"
  | "perm"
  | "mohawk";
export type HatKind =
  | "none"
  | "cap"
  | "flatcap"
  | "fedora"
  | "beret"
  | "beanie"
  | "cowboy"
  | "crown"
  | "viking"
  | "snakes"
  | "tophat"
  | "headband"
  | "bandana";
export type Facial = "none" | "stubble" | "stache" | "beard" | "goatee";
export type Frame = "broad" | "straight" | "curvy";

export interface Look {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  hat: HatKind;
  hatColor?: string;
  shirt: string;
  trim: string;
  pants: string;
  /** 0.85 slim to 1.3 big */
  build: number;
  frame?: Frame;
  bottom?: "trousers" | "skirt";
  facial?: Facial;
  glasses?: "none" | "round" | "shades";
  /** lipstick colour, empty for none */
  lips?: string;
  eyeshadow?: string;
  lashes?: boolean;
  blush?: boolean;
  earrings?: "none" | "studs" | "hoops";
  necklace?: "none" | "pearls" | "chain";
  bowtie?: boolean;
  eyes?: string;
  /** shirt print from the shop */
  pattern?: "none" | "stripes" | "flowers" | "check" | "tux" | "gold";
}

export interface AI {
  /** shots considered */
  n: number;
  /** how shaky the hand is: aim (rad) and power (fraction) */
  angle: number;
  power: number;
  /** soft or heavy cue */
  powerBias: number;
  /** how often they use spin, 0..1 */
  spin: number;
  /** how much they care about blocking you */
  defense: number;
  /** ms before shooting */
  think: number;
  mix?: Partial<Record<IdeaKind, number>>;
  flair?: number;
  triangle?: number;
  risk?: number;
  refine?: number;
  verify?: number;
  tipsy?: number;
}
export type IdeaKind = "straight" | "bank" | "post" | "combo" | "random";

export type GradeId = "common" | "uncommon" | "rare" | "epic" | "legendary" | "pearl";
export interface Help {
  lines: number;
  /** aim line length in mm */
  aim: number;
  ghost: number;
  obj: number;
  warn: number;
}
export interface Grade {
  id: GradeId;
  label: string;
  color: string;
  bg: string;
  felt: string;
  help: Help;
  secret?: boolean;
  /** tokens for beating someone of this grade */
  prize: number;
}

export type QuipKind = "hello" | "goal" | "foul" | "oppGoal" | "oppFoul" | "win" | "lose" | "power";
export interface Opponent {
  id: string;
  grade: GradeId;
  name: string;
  nick: string;
  style: string;
  traits: string[];
  bio: string;
  look: Look;
  ai: AI;
  habits: { smoke: number; drink: number };
  quips: Record<Exclude<QuipKind, "power">, string[]> & { power?: string[] };
  /** a Pearlescent legend's table power */
  power?: "tide" | "stone" | "thunder";
  /** their own bar (a venue id) */
  venue: string;
}
