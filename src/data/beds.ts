// The café's sound beds: real rooms full of people, recorded by Joseph Sardin and Axeline T. for BigSoundBank (CC0,
// credited in legal.html anyway). tools/beds.ts fetches them into music/ as loops with soft edges; the mixer lays one
// loop over the next so the edges cross-fade. Every bar sounds like its mood: a small room murmurs, a busy one hums,
// a jazz club and the legends' rooms are hushed behind their curtains.
import type { Mood } from "./records";

export interface Bed {
  /** in music/ */
  file: string;
  /** BigSoundBank's sound number */
  source: number;
  /** the stretch used, in seconds */
  from: number;
  len: number;
}
/** seconds of fade at each end of a loop: the next loop starts this long before one ends */
export const EDGE = 4;

export const BEDS = {
  small: { file: "cafe-small.mp3", source: 3542, from: 80, len: 64 }, // French chat, a small restaurant, 15 people
  busy: { file: "cafe-busy.mp3", source: 3376, from: 6, len: 64 }, // brunch, about 40 people
} satisfies Record<string, Bed>;

/** per mood: which bed, how loud, and how much of the top end comes through the walls (Hz) */
export const BED_OF: Record<Mood, { bed: keyof typeof BEDS; gain: number; lp: number }> = {
  brown: { bed: "small", gain: 1, lp: 8000 },
  pub: { bed: "busy", gain: 0.9, lp: 8000 },
  club: { bed: "small", gain: 0.7, lp: 2600 },
  grand: { bed: "busy", gain: 1, lp: 6000 },
  legend: { bed: "small", gain: 0.45, lp: 1500 },
};
