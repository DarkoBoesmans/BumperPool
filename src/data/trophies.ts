// Trophies: beat a regular for the first time and something of theirs goes on your shelf, free to collect in the shop.
// One per regular; shop.ts puts them with the other items.
import type { Item } from "./shop";

const trophy = (from: string, slot: Item["slot"], name: string, desc: string, rest: Partial<Item>): Item => ({
  id: `tr-${from}`,
  slot,
  name,
  desc,
  price: 0,
  from,
  ...rest,
});

export const TROPHIES: Item[] = [
  trophy("jens", "hat", "Rookie Beanie", "Jens left it on the stool. He won't be back for it.", {
    look: { hat: "beanie", hatColor: "#2a2a30" },
  }),
  trophy("monique", "extra", "Monique's Pearls", "Since 1974. She insisted.", { look: { necklace: "pearls" } }),
  trophy("wim", "hat", "Wim's Flat Cap", "Smells faintly of the last round.", {
    look: { hat: "flatcap", hatColor: "#5a4a3a" },
  }),
  trophy("fred", "hat", "Trucker Cap", "From the truck stop, with a coffee stain.", {
    look: { hat: "cap", hatColor: "#c23a2a" },
  }),
  trophy("bart", "cue", "Carom Cue", "Bart's old carom cue. It only knows cushions.", {
    cue: { shaft: "#e8d8b8", butt: "#2f5a3a", ring: "#d4a752" },
  }),
  trophy("sofie", "cue", "Bullseye Cue", "Red, white and dead straight.", {
    cue: { shaft: "#f0ece4", butt: "#c8202a", ring: "#1a1a1a" },
  }),
  trophy("nina", "extra", "Night Shift Shades", "For the walk home at sunrise.", { look: { glasses: "shades" } }),
  trophy("dirk", "outfit", "Postman's Jacket", "Thirty years of letters, one jacket.", {
    look: { shirt: "#a8262a", trim: "#f2c84a", pattern: "stripes" },
  }),
  trophy("lotte", "outfit", "Lawyer's Suit", "Dark, sharp and never fouls.", {
    look: { shirt: "#1e2430", trim: "#f4f0e8", pants: "#1e2430", pattern: "none" },
  }),
  trophy("rosa", "table", "Velvet Table", "The landlady's purple cloth, for your own bar.", {
    table: { rail: "#3a1a3a", cloth: "#5a2a6a" },
  }),
  trophy("pieter", "extra", "Professor's Bow Tie", "Comes with a short lecture on spin.", { look: { bowtie: true } }),
  trophy("gust", "cue", "Lucky Seven Cue", "Black and red, with a bet on every shot.", {
    cue: { shaft: "#1a1a1a", butt: "#c8202a", ring: "#f2c84a" },
  }),
  trophy("kevin", "hat", "Prodigy Cap", "Gold, like the trophies he keeps filming.", {
    look: { hat: "cap", hatColor: "#d8a83a" },
  }),
  trophy("cas", "cue", "The Closer", "Silver rings. It has never lost a decider.", {
    cue: { shaft: "#2a2a2a", butt: "#e8e8e8", ring: "#c0c0c8" },
  }),
  trophy("matthis", "table", "Studio Table", "TV blue, for trick shots in front of the cameras.", {
    table: { rail: "#1a1a1a", cloth: "#1e5aa8" },
  }),
  trophy("neptune", "table", "Tide Table", "Sea green cloth that never quite dries.", {
    table: { rail: "#123e52", cloth: "#1e6f8a" },
    secret: true,
  }),
  trophy("minerva", "hat", "Minerva's Helmet", "Crested bronze. The gorgon stays on her shield.", {
    look: { hat: "helmet", hatColor: "#c9a35b" },
    secret: true,
  }),
  trophy("jupiter", "hat", "Laurel Wreath", "Jupiter's own. A little singed.", {
    look: { hat: "laurel", hatColor: "#5f8f3a" },
    secret: true,
  }),
];
