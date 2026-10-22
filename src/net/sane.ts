// What may come in from an online café. Anyone with the code can send to it, so a message that is broken or built to
// hurt is dropped before it reaches the game: the right shapes, finite numbers on the table, short plain names.
import type { Game, Look } from "../types";

const PHASES = ["openW", "openR", "aim", "moving", "wait", "penalty", "mancheEnd", "matchEnd"];
const KINDS = ["info", "fout", "doel", "beurt"];
const EMOTES = ["cigar", "glass", "chalk", "knock"];
const color = (c: unknown): boolean => c === "W" || c === "R";
const num = (n: unknown): boolean => typeof n === "number" && Number.isFinite(n);
const text = (s: unknown, max: number): boolean => typeof s === "string" && s.length <= max;
const pair = (a: unknown, ok: (v: unknown) => boolean): boolean => Array.isArray(a) && a.length === 2 && a.every(ok);
const uid = (s: unknown): boolean => typeof s === "string" && /^[0-9a-f-]{8,40}$/.test(s);

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
    pair(x.names, (n) => text(n, 48)) && // in doubles: two names
    Array.isArray(x.seats) &&
    (x.seats.length === 2 || x.seats.length === 4) &&
    x.seats.every((s) => s === null || uid(s)) &&
    (x.board === undefined || (Array.isArray(x.board) && x.board.length <= 4 && x.board.every(uid))) &&
    (x.doubles === undefined || typeof x.doubles === "boolean") &&
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

export const saneEmote = (e: unknown): e is { c: "W" | "R"; kind: string } => {
  const x = e as { c: unknown; kind: unknown };
  return !!x && color(x.c) && EMOTES.includes(x.kind as string);
};

/** a look: a flat object of short strings, numbers and switches (colours end up in the 3D scene and on canvases) */
export const saneLook = (l: unknown): l is Look =>
  !!l &&
  typeof l === "object" &&
  !Array.isArray(l) &&
  Object.keys(l).length <= 40 &&
  Object.values(l).every((v) => text(v, 40) || (num(v) && Math.abs(v as number) < 10) || typeof v === "boolean");

/** someone in a café, as they announce themselves */
export const saneMember = (m: unknown): m is { name: string; look: Look | null; at: number } => {
  const x = m as { name: unknown; look: unknown; at: unknown };
  return !!x && text(x.name, 24) && (x.look === null || saneLook(x.look)) && num(x.at);
};

/** an open café in the list */
export const saneListing = (c: unknown): c is { code: string; host: string; n: number } => {
  const x = c as { code: unknown; host: unknown; n: unknown };
  return !!x && typeof x.code === "string" && /^[A-Z2-9]{4}$/.test(x.code) && text(x.host, 24) && num(x.n);
};
