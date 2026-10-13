// Where you play. Every regular has a bar of their own, from the old brown café to the championship hall, and each
// Pearlescent legend brings theirs. The room is the same box; the venue repaints it, adds its own props and puts
// its own table in the middle. venue-list.ts has the bars.
export type Prop =
  | "bar"
  | "booths"
  | "jukebox"
  | "stands"
  | "banners"
  | "seaweed"
  | "bubbles"
  | "portholes"
  | "columns"
  | "statues"
  | "shields"
  | "torches"
  | "chandelier"
  | "darts"
  | "tv"
  | "neon"
  | "piano"
  | "trophies"
  | "plants"
  | "fireplace"
  | "lanterns";

export interface Venue {
  id: string;
  name: string;
  tagline: string;
  /** wall: upper paper, its print, lower panels, the dado rail, the strip above */
  wall: {
    paper: string;
    print: string;
    panel: string;
    rail: string;
    upper: string;
    kind: "damask" | "stripes" | "planks" | "stone" | "plain" | "tiles";
  };
  floor: { a: string; b: string; kind: "tiles" | "planks" | "stone" | "carpet" | "sand" };
  ceiling: string;
  fog: string;
  /** lamp and room light tint */
  light: string;
  ambient: number;
  neon: string;
  marquee: string;
  /** the lamp shades over the table */
  shade: string;
  /** the house table: rail wood and cloth (the cloth gives way to the grade colour when that setting is on) */
  table: { rail: string; cloth: string };
  /** words and colour on the hanging banners, where there are banners */
  banner?: { words: [string, string, string]; color: string };
  props: Prop[];
  /** smoke colour, or bubbles under water */
  smoke: string;
  /** tokens to make it your home bar once you have played there */
  price: number;
}

export { VENUES, venueById } from "./venue-list";
