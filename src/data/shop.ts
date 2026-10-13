// The shop behind the bar: looks only, nothing that changes how the balls roll.
// Tokens come from matches. Freeplay items can't be bought: you earn them in freeplay (rematches against regulars you beat).
import type { Look } from "../types";
import { VENUES } from "./venues";

const LEGEND_HALLS = ["deep", "temple", "mead"];

export type Slot = "cue" | "outfit" | "hat" | "extra" | "table" | "bar";
export const SLOTS: { id: Slot; label: string }[] = [
  { id: "cue", label: "Cues" },
  { id: "outfit", label: "Clothes" },
  { id: "hat", label: "Hats" },
  { id: "extra", label: "Accessories" },
  { id: "table", label: "Tables" },
  { id: "bar", label: "Bars" },
];

export interface FreeStats {
  wins: number;
  sentUnder: number;
  beat: Record<string, boolean>;
  legendSweep: boolean;
}
export interface CueLook {
  shaft: string;
  butt: string;
  ring: string;
  glow?: string;
}
export interface Item {
  id: string;
  slot: Slot;
  name: string;
  desc: string;
  price: number;
  /** freeplay reward instead of a price */
  free?: { goal: string; ok: (f: FreeStats) => boolean };
  /** a bar you have to have played in first (its venue id) */
  venue?: string;
  /** belongs to the hidden legends: not on the shelf until they have walked in */
  secret?: true;
  look?: Partial<Look>;
  cue?: CueLook;
  table?: { rail: string; cloth: string };
}

export const ITEMS: Item[] = [
  // cues
  {
    id: "cue-house",
    slot: "cue",
    name: "House Cue",
    desc: "Maple shaft, dark butt. It has seen things.",
    price: 0,
    cue: { shaft: "#e0c48f", butt: "#1b100a", ring: "#d4a752" },
  },
  {
    id: "cue-redwood",
    slot: "cue",
    name: "Redwood",
    desc: "Warm red grain from butt to tip.",
    price: 40,
    cue: { shaft: "#d8a070", butt: "#6a2a14", ring: "#e8d8b8" },
  },
  {
    id: "cue-ebony",
    slot: "cue",
    name: "Ebony & Brass",
    desc: "Black butt with a heavy brass joint.",
    price: 60,
    cue: { shaft: "#e8d0a0", butt: "#0a0808", ring: "#f0c040" },
  },
  {
    id: "cue-ivory",
    slot: "cue",
    name: "Ivory Inlay",
    desc: "Cream butt, gold rings, very old money.",
    price: 90,
    cue: { shaft: "#f0dcb0", butt: "#f2ead6", ring: "#d4a040" },
  },
  {
    id: "cue-neon",
    slot: "cue",
    name: "Neon",
    desc: "Glows in a smoky room. Looks fast.",
    price: 120,
    cue: { shaft: "#c8ffd8", butt: "#141418", ring: "#4aff8a", glow: "#2aff6a" },
  },
  {
    id: "cue-champ",
    slot: "cue",
    name: "Champion's Cue",
    desc: "Gold butt, black shaft. Only for people who keep coming back.",
    price: 0,
    free: { goal: "Win 10 freeplay matches", ok: (f) => f.wins >= 10 },
    cue: { shaft: "#1a1a1e", butt: "#e8b640", ring: "#fff0b0" },
  },
  {
    id: "cue-trident",
    slot: "cue",
    name: "Trident",
    desc: "Sea green and pearl, it smells faintly of salt.",
    price: 0,
    secret: true,
    free: { goal: "Beat Poseidon in freeplay", ok: (f) => !!f.beat.poseidon },
    cue: { shaft: "#c6f1ff", butt: "#1e6f8a", ring: "#f2c84a", glow: "#4ae0ff" },
  },
  // clothes
  {
    id: "fit-lumber",
    slot: "outfit",
    name: "Lumberjack",
    desc: "Red check flannel.",
    price: 40,
    look: { shirt: "#a3261d", trim: "#1a1a1a", pattern: "check" },
  },
  {
    id: "fit-bowling",
    slot: "outfit",
    name: "Bowling Shirt",
    desc: "Two-tone with a racing stripe.",
    price: 50,
    look: { shirt: "#2a7a8a", trim: "#f2e6c8", pattern: "stripes" },
  },
  {
    id: "fit-hawaii",
    slot: "outfit",
    name: "Hawaiian Shirt",
    desc: "Loud flowers for loud shots.",
    price: 70,
    look: { shirt: "#e05a2a", trim: "#ffe08a", pattern: "flowers" },
  },
  {
    id: "fit-tux",
    slot: "outfit",
    name: "Tuxedo",
    desc: "Black tie, for the championship.",
    price: 120,
    look: { shirt: "#141418", trim: "#f4f0e8", pants: "#141418", pattern: "tux", bowtie: true },
  },
  {
    id: "fit-gold",
    slot: "outfit",
    name: "Golden Jacket",
    desc: "For beating a legend without dropping a game.",
    price: 0,
    free: { goal: "Win 2-0 against a Legendary in freeplay", ok: (f) => f.legendSweep },
    look: { shirt: "#d8a83a", trim: "#141010", pattern: "gold" },
  },
  // hats
  {
    id: "hat-headband",
    slot: "hat",
    name: "Headband",
    desc: "Sweat is for winners.",
    price: 25,
    look: { hat: "headband", hatColor: "#e8e0d0" },
  },
  {
    id: "hat-bandana",
    slot: "hat",
    name: "Bandana",
    desc: "Red, tied at the back.",
    price: 30,
    look: { hat: "bandana", hatColor: "#c8202a" },
  },
  {
    id: "hat-top",
    slot: "hat",
    name: "Top Hat",
    desc: "Raise the stakes, literally.",
    price: 80,
    look: { hat: "tophat", hatColor: "#141418" },
  },
  {
    id: "hat-crown",
    slot: "hat",
    name: "Golden Crown",
    desc: "For the one who beat all three legends at their own tables.",
    price: 0,
    secret: true,
    free: {
      goal: "Beat Poseidon, Medusa and Thor in freeplay",
      ok: (f) => !!(f.beat.poseidon && f.beat.medusa && f.beat.thor),
    },
    look: { hat: "crown", hatColor: "#f2c84a" },
  },
  // accessories
  {
    id: "x-shades",
    slot: "extra",
    name: "Sunglasses",
    desc: "Nobody can read your aim.",
    price: 35,
    look: { glasses: "shades" },
  },
  {
    id: "x-chain",
    slot: "extra",
    name: "Gold Chain",
    desc: "Heavier than your cue. For sending someone under the table.",
    price: 0,
    free: { goal: "Send a regular under the table in freeplay", ok: (f) => f.sentUnder >= 1 },
    look: { necklace: "chain" },
  },
  // tables
  {
    id: "tbl-mahogany",
    slot: "table",
    name: "Mahogany",
    desc: "The classic café table.",
    price: 0,
    table: { rail: "#5a2414", cloth: "#23897a" },
  },
  {
    id: "tbl-oak",
    slot: "table",
    name: "Light Oak",
    desc: "Pale oak rails and a teal cloth, like the new tables.",
    price: 80,
    table: { rail: "#c8a878", cloth: "#1ea8a0" },
  },
  {
    id: "tbl-ebony",
    slot: "table",
    name: "Black Ebony",
    desc: "Black rails, deep red cloth.",
    price: 100,
    table: { rail: "#141010", cloth: "#7a1a1a" },
  },
  {
    id: "tbl-gold",
    slot: "table",
    name: "Gold Leaf",
    desc: "Gold rails and royal blue cloth. Earned under the table.",
    price: 0,
    free: { goal: "Send 3 regulars under the table in freeplay", ok: (f) => f.sentUnder >= 3 },
    table: { rail: "#c8962a", cloth: "#1a3a8a" },
  },
  // bars: your home bar is where two-player and online games are played, and the start screen.
  // Every regular's bar is on the shelf once you have played there; the legends' halls are earned in freeplay.
  ...VENUES.filter((v) => !LEGEND_HALLS.includes(v.id)).map((v): Item => ({
    id: `bar-${v.id}`,
    slot: "bar",
    name: v.name,
    desc: v.tagline,
    price: v.price,
    venue: v.id,
  })),
  {
    id: "bar-deep",
    slot: "bar",
    name: "The Sunken Tavern",
    desc: "Poseidon's shipwreck.",
    price: 0,
    venue: "deep",
    secret: true,
    free: { goal: "Beat Poseidon in freeplay", ok: (f) => !!f.beat.poseidon },
  },
  {
    id: "bar-temple",
    slot: "bar",
    name: "The Stone Garden",
    desc: "Medusa's marble garden.",
    price: 0,
    venue: "temple",
    secret: true,
    free: { goal: "Beat Medusa in freeplay", ok: (f) => !!f.beat.medusa },
  },
  {
    id: "bar-mead",
    slot: "bar",
    name: "The Mead Hall",
    desc: "Thor's hall, fire included.",
    price: 0,
    venue: "mead",
    secret: true,
    free: { goal: "Beat Thor in freeplay", ok: (f) => !!f.beat.thor },
  },
];
export const itemById = (id: string): Item | undefined => ITEMS.find((i) => i.id === id);
export const STARTER = ["cue-house", "tbl-mahogany", "bar-golden"];
