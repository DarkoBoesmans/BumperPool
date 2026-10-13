// Story mode: you are the new face in town and you beat them all, one bar at a time.
import type { GradeId } from "../types";

export interface Chapter {
  grade: GradeId;
  title: string;
  /** the part of town: every regular has a bar of their own there */
  place: string;
  text: string;
  secret?: boolean;
}

export const CHAPTERS: Chapter[] = [
  {
    grade: "common",
    title: "The New Face",
    place: "The market square",
    text: "Three pubs round the market square, each with a tjoepbiljart table and a regular who thinks it is theirs. Nobody here has heard of you. Yet.",
  },
  {
    grade: "uncommon",
    title: "Station Street",
    place: "Station Street",
    text: "Word travels. Down Station Street a trucker waits at the truck stop, a carom veteran at the Golden Cue and the street's darts champion at the Bullseye.",
  },
  {
    grade: "rare",
    title: "After Midnight",
    place: "The night district",
    text: "When the market closes, the late crowd takes over: Club Midnight, the old sorting office and the lawyers' club. They play fast, they play smart, and one of them knows the rulebook by heart.",
  },
  {
    grade: "epic",
    title: "High Stakes",
    place: "Up the hill",
    text: "Up the hill the tables get better and so do the players: the landlady's Velvet Room, the professor's faculty club and a casino where every shot has a bet on it.",
  },
  {
    grade: "legendary",
    title: "The Final",
    place: "On television",
    text: "The championship hall, the World Open and a live TV studio. Cameras, referees in white gloves, and three names everybody in town knows.",
  },
  {
    grade: "pearl",
    title: "Legends",
    place: "Three halls of their own",
    secret: true,
    text: "Three strangers sit at the back. Nobody saw them come in. The sea, a stone garden and a storm, all at one table.",
  },
];

/** what the barman says once you have beaten all fifteen, before the legends show up */
export const RUMOUR =
  'You beat every regular in town. Marcel polishes a glass: "Not everyone. Some nights three strangers come in, but only for people who know the old code. That old arcade poster on the wall knows it."';
