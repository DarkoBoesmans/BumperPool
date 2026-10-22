// Doubles, two to a side (an online café of four): partners take turns at the table. The first of the pair opens
// game 1, the other opens game 2, and so on; after the opening every visit to the table goes to the next partner.
// A goal keeps the same partner at the table: a visit lasts until the turn passes.
import type { Color, Game } from "../types";

/** who of `team` (one or two players) has the cue for colour `c` now */
export function shooterOf<T>(team: T[], c: Color, g: Pick<Game, "phase" | "manche" | "visits">): T | undefined {
  if (team.length < 2) return team[0];
  const open = g.phase === "openW" || g.phase === "openR";
  return team[(open ? g.manche - 1 : (g.manche - 1 + (g.visits?.[c] ?? 0)) % 2) % 2];
}
