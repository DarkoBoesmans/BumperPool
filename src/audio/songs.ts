// Seven original tunes over common jazz changes, in four styles: swing (from a slow blues to bebop), bossa nova,
// jazz waltz and ballad. Chords are written as "Gm7", "C7", "Fmaj7", "F#m7b5".
export type Style = "swing" | "bossa" | "waltz" | "ballad";
export interface Song {
  title: string;
  style: Style;
  bpm: number;
  meter?: number;
  chords: string[];
}

export const SONGS: Song[] = [
  {
    title: "Smoke on the Felt",
    style: "swing",
    bpm: 112,
    chords: ["Gm7", "C7", "Fmaj7", "Dm7", "Gm7", "C7", "Fmaj7", "C7"],
  },
  {
    title: "Cushion Samba",
    style: "bossa",
    bpm: 132,
    chords: ["Am7", "D7", "Gmaj7", "Gmaj7", "Gm7", "C7", "Fmaj7", "E7"],
  },
  {
    title: "Blue Post Blues",
    style: "swing",
    bpm: 92,
    chords: ["Cm7", "Cm7", "Cm7", "Cm7", "Fm7", "Fm7", "Cm7", "Cm7", "Ab7", "G7", "Cm7", "G7"],
  },
  {
    title: "Waltz for the Wobbler",
    style: "waltz",
    meter: 3,
    bpm: 150,
    chords: ["Dm7", "G7", "Cmaj7", "Am7", "Dm7", "G7", "Cmaj7", "Cmaj7"],
  },
  {
    title: "Last Call at the Golden Cue",
    style: "swing",
    bpm: 128,
    chords: ["Am7", "D7", "Gmaj7", "Cmaj7", "F#m7b5", "B7", "Em7", "Em7"],
  },
  {
    title: "Closing Time Ballad",
    style: "ballad",
    bpm: 62,
    chords: ["Cmaj7", "Am7", "Dm7", "G7", "Em7", "A7", "Dm7", "G7"],
  },
  {
    title: "Five Balls Bebop",
    style: "swing",
    bpm: 172,
    chords: ["Bb7", "Eb7", "Bb7", "Bb7", "Eb7", "Eb7", "Bb7", "G7", "Cm7", "F7", "Bb7", "F7"],
  },
];
export const STYLE: Record<Style, string> = {
  swing: "Swing",
  bossa: "Bossa nova",
  waltz: "Jazz waltz",
  ballad: "Ballad",
};

// chord tones, the rootless voicing the Rhodes plays, the scale the vibes improvise on
const QUAL: Record<string, { tones: number[]; voice: number[]; scale: number[] }> = {
  m7: { tones: [0, 3, 7, 10], voice: [3, 7, 10, 14], scale: [0, 2, 3, 5, 7, 9, 10] },
  "7": { tones: [0, 4, 7, 10], voice: [4, 9, 10, 14], scale: [0, 2, 4, 5, 7, 9, 10] },
  maj7: { tones: [0, 4, 7, 11], voice: [4, 7, 11, 14], scale: [0, 2, 4, 5, 7, 9, 11] },
  m7b5: { tones: [0, 3, 6, 10], voice: [3, 6, 10, 12], scale: [0, 1, 3, 5, 6, 8, 10] },
};
const NOTE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export interface Chord {
  root: number;
  tones: number[];
  voice: number[];
  scale: number[];
}
export function chord(s: string): Chord {
  const m = /^([A-G])([#b]?)(.*)$/.exec(s)!,
    root = NOTE[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  return { root: (root + 12) % 12, ...QUAL[m[3]] };
}
export const hz = (n: number): number => 440 * Math.pow(2, (n - 69) / 12);
/** the pitch class `pc` in the octave closest to `ref`, inside lo..hi */
export function near(pc: number, ref: number, lo: number, hi: number): number {
  let n = Math.round((ref - pc) / 12) * 12 + pc;
  while (n < lo) n += 12;
  while (n > hi) n -= 12;
  return n;
}
