// Shared shapes for the people: how they look, how the CPU plays, the grades and the regulars.
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
  | "helmet"
  | "laurel"
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
  /** what you can read about them before a game: two strengths, two weaknesses */
  strong: string[];
  weak: string[];
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
