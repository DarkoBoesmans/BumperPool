// Online play through Claude's shared artifact storage (window.claude). Elsewhere the menu says it is unavailable.
// One document per table holds the whole game; the player who shoots decides the result. Emotes go in a side collection.
import type { Color, Game } from "../types";
import type { Emote } from "../cafe/emote";
import { G, setG, log, hooks } from "../core/state";
import { newMatch } from "../core/match";
import { onSettled } from "../core/referee";

interface Snap {
  exists: boolean;
  data(): { rev: number; G: Game } | null;
}
interface Doc {
  onSnapshot(ok: (s: Snap) => void, err: () => void): () => void;
  set(v: unknown): Promise<void>;
  collection(n: string): Coll;
}
interface Coll {
  doc(id: string): Doc;
  onSnapshot(
    ok: (s: { docs: { id: string; data(): { c: Color; kind: Emote; t: number } }[] }) => void,
    err: () => void,
  ): () => void;
}
interface ClaudeApi {
  use(k: "db" | "user"): Promise<unknown>;
}
type Db = { doc(p: string): Doc };
type User = { id(): Promise<string | null>; can(p: string): Promise<boolean> };

export const net = {
  ref: null as Doc | null,
  uid: null as string | null,
  canWrite: false,
  ready: false,
  rev: 0,
  pending: null as Game | null,
  chain: Promise.resolve(),
  unsub: null as null | (() => void),
  unsubE: null as null | (() => void),
  myName: "Player",
  emotes: null as Coll | null,
  seen: {} as Record<string, number>,
};
const claude = (globalThis as unknown as { claude?: ClaudeApi }).claude;
const probe: Promise<[Db | null, User | null]> = claude?.use
  ? (Promise.all([claude.use("db"), claude.use("user")]) as Promise<[Db, User]>).catch(() => [null, null])
  : Promise.resolve([null, null]);
export const available = (): Promise<boolean> => probe.then(([db, user]) => !!(db && user));

let onChange = (): void => {},
  onEmote = (_c: Color, _k: Emote): void => {};
export function netHooks(h: { changed: () => void; emote: (c: Color, k: Emote) => void }): void {
  onChange = h.changed;
  onEmote = h.emote;
}

export async function joinOnline(table: string, myName: string): Promise<string> {
  const [db, user] = await probe;
  if (!db || !user)
    throw new Error("Online play only works in the version published inside Claude. Offline play works everywhere.");
  const uid = await user.id();
  if (!uid) throw new Error("Sign in to play online.");
  leaveOnline();
  Object.assign(net, {
    uid,
    canWrite: (await user.can("data.write")) !== false,
    ready: false,
    rev: 0,
    pending: null,
    myName,
    seen: {},
  });
  const name =
    table
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "") || "cafe";
  net.ref = db.doc("games/" + name);
  net.emotes = net.ref.collection("emotes");
  hooks.me = () => net.uid!;
  setG(null);
  newMatch("online", { names: ["Player 1", "Player 2"] });
  net.unsub = net.ref.onSnapshot(onRemote, () => {
    log(null, "info", "Lost the connection to the online table.", "Reload the page to reconnect.");
    onChange();
  });
  net.unsubE = net.emotes.onSnapshot(
    (s) => {
      for (const d of s.docs) {
        const e = d.data();
        if (!e || d.id === net.uid) continue;
        if (net.seen[d.id] !== e.t) {
          const first = net.seen[d.id] === undefined;
          net.seen[d.id] = e.t;
          if (!first) onEmote(e.c, e.kind);
        }
      }
    },
    () => {},
  );
  return name;
}
export function leaveOnline(): void {
  net.unsub?.();
  net.unsubE?.();
  net.unsub = net.unsubE = null;
  net.ref = null;
  net.ready = false;
  hooks.me = () => "local";
}

function claimSeat(): void {
  if (!net.canWrite || G.seats.includes(net.uid)) return;
  const p = G.seats.indexOf(null);
  if (p < 0) return;
  G.seats[p] = net.uid;
  G.names[p] = net.myName; // no lease on seats: two players clicking the same seat at once, the last one wins
  log(null, "info", `${net.myName} took a seat.`);
  onChange();
  push();
}
function onRemote(snap: Snap): void {
  const first = !net.ready;
  net.ready = true;
  const d = snap.exists ? snap.data() : null;
  if (d && d.G && d.rev > net.rev) {
    net.rev = d.rev;
    const g: Game = structuredClone(d.G);
    g.seats = g.seats || [null, null];
    g.mode = "online";
    if (G.phase === "moving" && G.mover === net.uid) return; // our own shot is still rolling
    if (G.phase === "moving" && g.phase !== "moving") {
      net.pending = g; // let the opponent's shot finish rolling here first
      return;
    }
    setG(g);
  }
  if (first) claimSeat();
  onChange();
}
export function push(): void {
  const ref = net.ref;
  if (!ref || !net.ready || !net.canWrite) return;
  net.rev += 1;
  const body = { rev: net.rev, G: structuredClone(G) };
  net.chain = net.chain
    .then(() => ref.set(body))
    .catch((e: { code?: string }) => {
      const denied = e?.code === "invalid_argument";
      if (denied) net.canWrite = false;
      log(
        null,
        "info",
        denied ? "You can't change this table, so you are watching." : "Saving to the online table failed.",
        "Try your shot again.",
      );
      onChange();
    });
}
export function sendEmote(c: Color, kind: Emote): void {
  if (!net.emotes || !net.canWrite) return;
  net.emotes
    .doc(net.uid!)
    .set({ c, kind, t: Date.now() })
    .catch(() => {});
}
/** the balls stopped: the shooter's table decides, the other side waits for that result */
export function settle(): void {
  if (G.mover && G.mover !== hooks.me()) {
    G.phase = "wait";
    if (net.pending) {
      setG(net.pending);
      net.pending = null;
    }
    onChange();
    return;
  }
  onSettled();
  push();
}
export function takeSeat(p: number): void {
  if (G.seats[p]) return;
  G.seats[p] = net.uid;
  G.names[p] = net.myName;
  onChange();
  push();
}
export function leaveSeat(p: number): void {
  G.seats[p] = null;
  onChange();
  push();
}
