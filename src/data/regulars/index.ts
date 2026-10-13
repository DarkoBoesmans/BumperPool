// All eighteen: fifteen regulars in five grades and three Pearlescent legends behind the Konami code.
// ai: n = shots considered, angle/power = how shaky the hand is, powerBias = soft or heavy cue,
//     spin = how often they use spin (0..1), defense = how much they care about blocking you, think = ms before shooting,
//     mix = which kinds of shots they look for (straight, bank off the long cushions, post glances, combos off your balls, anything),
//     flair = bonus for goals off cushions or posts, triangle = bonus for parking in the small triangle,
//     risk = how much a foul scares them (1 = normal), refine = extra tries round their best idea, verify = top ideas re-checked,
//     tipsy = extra wobble per sip. habits: chance per turn to light a cigar or take a sip.
import type { Grade, Opponent } from "../../types";
import { GRADES } from "../grades";
import { COMMON } from "./common";
import { UNCOMMON } from "./uncommon";
import { RARE } from "./rare";
import { EPIC } from "./epic";
import { LEGENDARY } from "./legendary";
import { PEARL } from "./pearl";

export const OPPONENTS: Opponent[] = [...COMMON, ...UNCOMMON, ...RARE, ...EPIC, ...LEGENDARY, ...PEARL];
export const findOpponent = (id: string | null | undefined): Opponent =>
  OPPONENTS.find((o) => o.id === id) || OPPONENTS[0];
export const gradeOf = (o: Pick<Opponent, "grade">): Grade => GRADES.find((g) => g.id === o.grade) || GRADES[0];
export const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
/** the bar they play in */
export const venueOf = (o: Opponent): string => o.venue;
