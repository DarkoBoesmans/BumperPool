// The live game and the hooks the rest of the app listens on. The CPU plays its ideas on a copy (withCopy).
import type { Ball, Color, Game, LogKind } from "../types";

export let G: Game;
/** true while the CPU tries shots on a copy: no sound, no redraws */
export let SIM = false;
export const setG = (g: Game | null): void => {
  G = g as Game;
};

export const hooks = {
  changed(): void {},
  push(): void {},
  sfx(_kind: string, _v: number): void {},
  frame(): void {},
  me: (): string => "local",
};
export const changed = (): void => {
  if (!SIM) hooks.changed();
};
export const push = (): void => {
  if (!SIM) hooks.push();
};
export const sfx = (k: string, v: number): void => {
  if (!SIM) hooks.sfx(k, v);
};

export function ball(id: number): Ball {
  const b = G.balls.find((x) => x.id === id);
  if (!b) throw new Error(`no ball ${id}`);
  return b;
}
export const nameOf = (c: Color): string => G.names[G.colorOf.indexOf(c)];
export const remaining = (c: Color): number =>
  G.balls.filter((b) => b.c === c && (b.on || G.queue.includes(b.id))).length;
export const fouls = (c: Color): number => G.log.filter((e) => e.kind === "fout" && e.c === c).length;
export function log(c: Color | null, kind: LogKind, text: string, why = ""): void {
  G.log.push({ n: G.strokeNo, c, kind, text, why });
  if (G.log.length > 120) G.log.shift();
}
export const clone = (a: Ball[]): Ball[] => a.map((b) => ({ ...b }));

export function withCopy<T>(fn: () => T): T {
  const saved = G;
  SIM = true;
  G = structuredClone(saved);
  try {
    return fn();
  } finally {
    G = saved;
    SIM = false;
  }
}

/** balls the player at the table may shoot: Medusa's stone ball sits this turn out, unless it is all they have */
export function shootable(c: Color): Ball[] {
  const mine = G.balls.filter((b) => b.on && b.c === c);
  const free = mine.filter((b) => !b.stone);
  return free.length ? free : mine;
}
