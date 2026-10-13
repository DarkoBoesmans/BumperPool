// Everything the game keeps in this browser sits under one prefix. Saves from before the game was called
// Tjoepbiljart (golfbiljart.*) move over once, the first time this loads.
export const STORE = "tjoepbiljart.";
const OLD = "golfbiljart.";

try {
  const ls = globalThis.localStorage;
  for (const k of Object.keys(ls ?? {}))
    if (k.startsWith(OLD)) {
      const to = STORE + k.slice(OLD.length);
      if (ls.getItem(to) === null) ls.setItem(to, ls.getItem(k)!);
      ls.removeItem(k);
    }
} catch {
  /* no storage (private mode, tests): nothing to move */
}

/** read and write one setting as text; storage that is blocked or full just doesn't keep it */
export function load(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(STORE + key) ?? null;
  } catch {
    return null;
  }
}
export function save(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(STORE + key, value);
  } catch {
    /* not saved */
  }
}
/** Settings, Delete my data */
export function wipe(): void {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(STORE)) localStorage.removeItem(k);
  } catch {
    /* storage blocked: there is nothing stored to delete */
  }
}
