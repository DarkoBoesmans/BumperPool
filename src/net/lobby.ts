// The list of open cafés: one shared channel where every open café announces itself (Presence, keyed by its code),
// and where the online menu listens. A private café never shows here: you need its code.
import type { RealtimeChannel } from "@supabase/realtime-js";
import { channel, drop } from "./supa";
import { saneListing } from "./sane";

export interface Listing {
  code: string;
  host: string;
  /** how many people are in it */
  n: number;
}
const TOPIC = "tjoep:lobby";
let watch: RealtimeChannel | null = null,
  mine: RealtimeChannel | null = null,
  shown = "";

/** listen to the list; `seen` gets every change, open cafés with room first */
export async function watchLobby(seen: (cafes: Listing[]) => void): Promise<void> {
  if (watch) return;
  watch = await channel(TOPIC, "watcher", (ch) =>
    ch.on("presence", { event: "sync" }, () => {
      const all = Object.values(ch.presenceState()).flat().filter(saneListing) as unknown as Listing[];
      seen(all.sort((a, b) => a.n - b.n || a.code.localeCompare(b.code)));
    }),
  );
}
export function stopLobby(): void {
  drop(watch);
  watch = null;
}

/** put your café in the list, or update how full it is; the café's leader does this */
export async function advertise(c: Listing): Promise<void> {
  const k = JSON.stringify(c);
  if (k === shown) return;
  shown = k;
  mine ??= await channel(TOPIC, c.code, () => {});
  await mine.track(c);
}
export function unadvertise(): void {
  drop(mine);
  mine = null;
  shown = "";
}
