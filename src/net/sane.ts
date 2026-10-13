// What a shared online table may hold. Anyone with the link can write to it, so an update that is broken or built to
// hurt is dropped before it reaches the game: the right shapes, finite numbers on the table, short plain names.
import type { Game } from "../types";

const PHASES = ["openW", "openR", "aim", "moving", "wait", "penalty", "mancheEnd", "matchEnd"];
const KINDS = ["info", "fout", "doel", "beurt"];
const EMOTES = ["cigar", "glass", "chalk", "knock"];
const color = (c: unknown): boolean => c === "W" || c === "R";
const num = (n: unknown): boolean => typeof n === "number" && Number.isFinite(n);
const text = (s: unknown, max: number): boolean => typeof s === "string" && s.length <= max;
const pair = (a: unknown, ok: (v: unknown) => boolean): boolean => Array.isArray(a) && a.length === 2 && a.every(ok);

// ponytail: checks what the HUD, the log and the balls read; deeper fields (stroke, snap) are trusted as the
// shooter's table wrote them. A full schema check once online play leaves beta.
export function saneGame(g: unknown): g is Game {
  const x = g as Game;
  return (
    !!x &&
    typeof x === "object" &&
    Array.isArray(x.balls) &&
    x.balls.length <= 10 &&
    x.balls.every(
      (b) =>
        !!b &&
        Number.isInteger(b.id) &&
        color(b.c) &&
        num(b.x) &&
        num(b.y) &&
        Math.abs(b.x) < 2000 &&
        Math.abs(b.y) < 2000 &&
        typeof b.on === "boolean",
    ) &&
    pair(x.names, (n) => text(n, 24)) &&
    pair(x.seats, (s) => s === null || text(s, 200)) &&
    pair(x.wins, (w) => Number.isInteger(w) && (w as number) >= 0 && (w as number) <= 5) &&
    color(x.turn) &&
    PHASES.includes(x.phase) &&
    Array.isArray(x.log) &&
    x.log.length <= 500 &&
    x.log.every(
      (e) =>
        !!e &&
        Number.isInteger(e.n) &&
        (e.c === null || color(e.c)) &&
        KINDS.includes(e.kind) &&
        text(e.text, 400) &&
        text(e.why, 600) &&
        (e.v === undefined ||
          (!!e.v &&
            typeof e.v === "object" &&
            Object.keys(e.v).length <= 8 &&
            Object.values(e.v).every((x) => text(x, 600) || num(x)))),
    )
  );
}

export const saneEmote = (e: unknown): e is { c: "W" | "R"; kind: string; t: number } => {
  const x = e as { c: unknown; kind: unknown; t: unknown };
  return !!x && color(x.c) && EMOTES.includes(x.kind as string) && num(x.t);
};
