// Online play. Your café is a room: whoever opens it gets a code of four letters to share, and an open café also shows
// in the list of open cafés (lobby.ts). Up to four people: two at the table, or two pairs in doubles; the rest chalk
// their name on the board and play the winner. The game travels between the tables as messages, and the player who
// shoots decides the result. The first one in the café (the leader) seats people and greets newcomers with the game.
import type { RealtimeChannel } from "@supabase/realtime-js";
import type { Color, Game, Look } from "../types";
import type { Emote } from "../cafe/emote";
import { G, setG, log, hooks } from "../core/state";
import { newMatch } from "../core/match";
import { onSettled } from "../core/referee";
import { channel, drop } from "./supa";
import { saneGame, saneEmote, saneMember } from "./sane";
import { advertise, unadvertise, stopLobby } from "./lobby";
import { t } from "../i18n";

export const MAX = 4;
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0, O, 1 or I: a code is read out across a table
export interface Member {
  uid: string;
  name: string;
  look: Look | null;
  at: number;
}

export const net = {
  uid: crypto.randomUUID(),
  code: "",
  /** shown in the list of open cafés */
  open: false,
  ch: null as RealtimeChannel | null,
  /** everyone in the café, first come first */
  members: [] as Member[],
  ready: false,
  rev: 0,
  /** whose version of the game we hold: equal revisions go to the lower id, so every table ends up the same */
  from: "",
  pending: null as Game | null,
  myName: "Player",
  look: null as Look | null,
};
export const online = (): boolean => !!net.ch;
export const leader = (): boolean => net.members[0]?.uid === net.uid;
export const nameOf = (uid: string | null): string => net.members.find((m) => m.uid === uid)?.name || "";
/** who waits to play the winner, in chalk order */
export const board = (): Member[] =>
  (G.board || []).map((u) => net.members.find((m) => m.uid === u)).filter((m): m is Member => !!m);

let onChange = (): void => {},
  onEmote = (_c: Color, _k: Emote): void => {},
  onSeats = (_looks: (Look | null)[]): void => {};
export function netHooks(h: {
  changed: () => void;
  emote: (c: Color, k: Emote) => void;
  seated: (looks: (Look | null)[]) => void;
}): void {
  onChange = h.changed;
  onEmote = h.emote;
  onSeats = h.seated;
}

/** open a café of your own: resolves with its code */
export async function openCafe(name: string, look: Look | null, open: boolean): Promise<string> {
  const code = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => LETTERS[b % LETTERS.length]).join("");
  await enter(code, name, look);
  net.open = open;
  setG(null);
  newMatch("online", { names: [name, ""] });
  G.seats = [net.uid, null, null, null];
  G.board = [];
  net.ready = true;
  arrange();
  push();
  return code;
}

/** walk into someone's café by its code */
export async function joinCafe(code: string, name: string, look: Look | null): Promise<void> {
  code = code.toUpperCase().replace(/[^A-Z2-9]/g, "");
  if (code.length !== 4) throw new Error(t("A café code has four letters or digits."));
  await enter(code, name, look);
  setG(null);
  newMatch("online", { names: ["", ""] });
  for (let i = 0; i < 40 && !net.ready; i++) await new Promise((r) => setTimeout(r, 150));
  const me = net.members.findIndex((m) => m.uid === net.uid);
  if (!net.ready || net.members.length < 2) {
    leaveOnline();
    throw new Error(t("No café is open with code {code}.", { code }));
  }
  if (me >= MAX) {
    leaveOnline();
    throw new Error(t("That café is full: four people already."));
  }
}

async function enter(code: string, name: string, look: Look | null): Promise<void> {
  leaveOnline();
  stopLobby();
  Object.assign(net, { code, myName: name, look, members: [], ready: false, rev: 0, from: "", pending: null });
  hooks.me = () => net.uid;
  net.ch = await channel("tjoep:cafe:" + code, net.uid, (ch) =>
    ch
      .on("broadcast", { event: "state" }, (m) => onState(m.payload))
      .on("broadcast", { event: "emote" }, (m) => saneEmote(m.payload) && onEmote(m.payload.c, m.payload.kind as Emote))
      .on("presence", { event: "sync" }, () => onSync(ch)),
  );
  await net.ch.track({ name, look, at: Date.now() });
}

export function leaveOnline(): void {
  drop(net.ch);
  unadvertise();
  net.ch = null;
  net.code = "";
  net.members = [];
  net.ready = false;
  hooks.me = () => "local";
}

function onSync(ch: RealtimeChannel): void {
  const was = new Set(net.members.map((m) => m.uid));
  net.members = Object.entries(ch.presenceState())
    .map(([uid, [p]]) => (saneMember(p) ? { uid, name: p.name, look: p.look, at: p.at } : null))
    .filter((m): m is Member => !!m)
    .sort((a, b) => a.at - b.at || a.uid.localeCompare(b.uid));
  if (leader() && net.ready) {
    const fresh = net.members.some((m) => !was.has(m.uid) && m.uid !== net.uid);
    if (arrange() || fresh) push(); // seats changed, or a newcomer needs the game
    if (net.open) void advertise({ code: net.code, host: net.myName, n: net.members.length }).catch(() => {});
  }
  onChange();
}

/** the leader seats people: those at the table stay, empty seats go to the board in chalk order */
function arrange(): boolean {
  const here = new Set(net.members.slice(0, MAX).map((m) => m.uid)),
    n = G.doubles ? 4 : 2,
    seats = [0, 1, 2, 3].map((i) => (i < n && G.seats[i] && here.has(G.seats[i]!) ? G.seats[i] : null)),
    chalk = [...(G.board || []), ...net.members.map((m) => m.uid)].filter(
      (u, i, a) => here.has(u) && !seats.includes(u) && a.indexOf(u) === i,
    );
  for (let i = 0; i < n; i++) if (!seats[i]) seats[i] = chalk.shift() ?? null;
  const names = [0, 1].map((p) => [seats[p], seats[p + 2]].map(nameOf).filter(Boolean).join(" & ")) as [string, string];
  const same =
    seats.join() === G.seats.join() && chalk.join() === (G.board || []).join() && names.join() === G.names.join();
  G.seats = seats;
  G.board = chalk;
  G.names = names;
  if (!same) seated();
  return !same;
}
const seated = () => onSeats([0, 1].map((p) => net.members.find((m) => m.uid === G.seats[p])?.look || null));

/** the end of a match: whoever lost goes to the back of the board, the first on the board takes their place */
export function rotate(): void {
  if (!online() || G.endWinner === null || !(G.board || []).length) return;
  const lost = 1 - G.endWinner,
    out = [G.seats[lost], G.seats[lost + 2]].filter((u): u is string => !!u);
  G.seats = G.seats.map((u) => (u && out.includes(u) ? null : u));
  G.board = [...(G.board || []), ...out];
  arrange();
}

/** doubles on or off: the leader's switch, with four in the café */
export function setDoubles(on: boolean): void {
  if (!leader()) return;
  G.doubles = on;
  if (!on) G.board = [...(G.board || []), ...[G.seats[2], G.seats[3]].filter((u): u is string => !!u)];
  G.seats = [G.seats[0], G.seats[1], null, null];
  arrange();
  push();
  onChange();
}

function onState(p: unknown): void {
  const d = p as { rev: unknown; G: unknown; from: unknown };
  if (!d || !Number.isInteger(d.rev) || typeof d.from !== "string" || !saneGame(d.G)) return;
  const rev = d.rev as number;
  if (!(rev > net.rev || (rev === net.rev && d.from < net.from))) return;
  const first = !net.ready;
  net.rev = rev;
  net.from = d.from;
  net.ready = true;
  const g: Game = structuredClone(d.G);
  g.mode = "online";
  if (G.phase === "moving" && G.mover === net.uid) return; // our own shot is still rolling
  if (G.phase === "moving" && g.phase !== "moving") {
    net.pending = g; // let the other player's shot finish rolling here first
    return;
  }
  const seatsBefore = G.seats.join();
  setG(g);
  if (first || seatsBefore !== g.seats.join()) seated();
  onChange();
}

export function push(): void {
  if (!net.ch || !net.ready) return;
  net.rev += 1;
  net.from = net.uid;
  const g = structuredClone(G);
  g.log = g.log.slice(-80); // the HUD shows the last few; the messages stay small
  send({ rev: net.rev, from: net.uid, G: g });
}
/** a lost line: try again every two seconds, as long as nothing newer went out */
function send(payload: { rev: number; from: string; G: Game }, tries = 30): void {
  const retry = () => {
    if (tries === 30) {
      log(
        null,
        "info",
        "Lost the connection to the café.",
        "Your last move goes out again as soon as the line is back.",
      );
      onChange();
    }
    if (tries > 0) setTimeout(() => net.rev === payload.rev && send(payload, tries - 1), 2000);
  };
  if (!net.ch) return;
  net.ch
    .send({ type: "broadcast", event: "state", payload })
    .then((r) => r !== "ok" && retry())
    .catch(retry);
}
export function sendEmote(c: Color, kind: Emote): void {
  void net.ch?.send({ type: "broadcast", event: "emote", payload: { c, kind } }).catch(() => {});
}
/** the balls stopped: the shooter's table decides, the others wait for that result */
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
