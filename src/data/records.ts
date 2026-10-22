// The jukebox's records: real recordings by Kevin MacLeod (incompetech.com), CC BY 4.0, credited in legal.html.
// Every bar plays the records of its mood: a brown café swings and rags, a sports pub plays blues and boogie, the
// jazz clubs play it cool, the grand halls play big and bright, the legends' rooms play noir. tools/records.ts
// fetches the files into music/.
export type Mood = "brown" | "pub" | "club" | "grand" | "legend";

export interface Record_ {
  /** in music/ */
  file: string;
  /** the file name at incompetech.com */
  source: string;
  title: string;
  /** English, shown through t() */
  genre: string;
  mood: Mood;
}

const disc = (title: string, source: string, genre: string, mood: Mood): Record_ => ({
  file:
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-$/, "") + ".mp3",
  source,
  title,
  genre,
  mood,
});

export const ARTIST = "Kevin MacLeod";

export const RECORDS: Record_[] = [
  disc("Fig Leaf Rag", "Fig Leaf Rag.mp3", "Ragtime", "brown"),
  disc("Five Card Shuffle", "Five Card Shuffle.mp3", "Blues piano", "brown"),
  disc("No Good Layabout", "NoGoodLayabout.mp3", "Swing", "brown"),
  disc("Long Stroll", "Long Stroll.mp3", "Swing", "brown"),
  disc("OctoBlues", "OctoBlues.mp3", "Blues", "pub"),
  disc("Matt's Blues", "Matts Blues.mp3", "Blues", "pub"),
  disc("Boogie Party", "Boogie Party.mp3", "Boogie-woogie", "pub"),
  disc("Malt Shop Bop", "Malt Shop Bop.mp3", "Rock and roll", "pub"),
  disc("Bossa Antigua", "Bossa Antigua.mp3", "Bossa nova", "club"),
  disc("Lobby Time", "Lobby Time.mp3", "Cool jazz", "club"),
  disc("Cool Vibes", "Cool Vibes.mp3", "Cool jazz", "club"),
  disc("Backbay Lounge", "Backbay Lounge.mp3", "Lounge", "club"),
  disc("Samba Isobel", "Samba Isobel.mp3", "Samba", "grand"),
  disc("Vivacity", "Vivacity.mp3", "Vibraphone jazz", "grand"),
  disc("Dispersion Relation", "Dispersion Relation.mp3", "Jazz", "grand"),
  disc("Deuces", "Deuces.mp3", "Club jazz", "grand"),
  disc("Spy Glass", "Spy Glass.mp3", "Noir jazz", "legend"),
  disc("I Knew a Guy", "I Knew a Guy.mp3", "Noir jazz", "legend"),
  disc("Secret of Tiki Island", "Secret of Tiki Island.mp3", "Exotica", "legend"),
  disc("Night on the Docks", "Night on the Docks - Sax.mp3", "Noir jazz", "legend"),
];

/** which records each bar plays; a bar not listed plays the brown café's */
const MOOD: Partial<Record<string, Mood>> = {
  brown: "brown",
  corner: "brown",
  golden: "brown",
  penalty: "pub",
  truck: "pub",
  bullseye: "pub",
  sorting: "pub",
  jazz: "club",
  velvet: "club",
  lawclub: "club",
  faculty: "club",
  lucky: "grand",
  hall: "grand",
  arena: "grand",
  studio: "grand",
  deep: "legend",
  temple: "legend",
  sky: "legend",
};
export const moodOf = (venue: string | undefined): Mood => MOOD[venue || ""] || "brown";
