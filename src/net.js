// Online play through Claude's shared artifact storage (window.claude). Elsewhere the menu says it is unavailable.
// One document per table holds the whole game; the player who shoots decides the result. Emotes go in a side collection.
import { G, setG, newMatch, log, onSettled, hooks } from "./game.js";

export const net = {
  ref: null,
  uid: null,
  canWrite: false,
  ready: false,
  rev: 0,
  pending: null,
  chain: Promise.resolve(),
  unsub: null,
  unsubE: null,
  myName: "Player",
  emotes: null,
  seen: {},
};
const probe =
  typeof window !== "undefined" && window.claude?.use
    ? Promise.all([window.claude.use("db"), window.claude.use("user")]).catch(
        () => [null, null],
      )
    : Promise.resolve([null, null]);
export const available = () => probe.then(([db, user]) => !!(db && user));
let onChange = () => {},
  onEmote = () => {};
export function netHooks(h) {
  onChange = h.changed;
  onEmote = h.emote;
}

export async function joinOnline(table, myName) {
  const [db, user] = await probe;
  if (!db || !user)
    throw new Error(
      "Online play only works in the version published inside Claude. Offline play works everywhere.",
    );
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
  hooks.me = () => net.uid;
  setG(null);
  newMatch("online", { names: ["Player 1", "Player 2"] });
  net.unsub = net.ref.onSnapshot(onRemote, () => {
    log(
      null,
      "info",
      "Lost the connection to the online table.",
      "Reload the page to reconnect.",
    );
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
export function leaveOnline() {
  net.unsub?.();
  net.unsubE?.();
  net.unsub = net.unsubE = null;
  net.ref = null;
  net.ready = false;
  hooks.me = () => "local";
}

function claimSeat() {
  if (!net.canWrite || G.seats.includes(net.uid)) return;
  const p = G.seats.indexOf(null);
  if (p < 0) return;
  G.seats[p] = net.uid;
  G.names[p] = net.myName; // ponytail: no lease on seats; two players clicking the same seat at once, the last one wins
  log(null, "info", `${net.myName} took a seat.`);
  onChange();
  push();
}
function onRemote(snap) {
  const first = !net.ready;
  net.ready = true;
  const d = snap.exists ? snap.data() : null;
  if (d && d.G && d.rev > net.rev) {
    net.rev = d.rev;
    const g = JSON.parse(JSON.stringify(d.G));
    g.seats = g.seats || [null, null];
    g.mode = "online";
    if (G.phase === "moving" && G.mover === net.uid) return; // our own shot is still rolling
    if (G.phase === "moving" && g.phase !== "moving") {
      net.pending = g;
      return;
    } // let the opponent's shot finish rolling here first
    setG(g);
  }
  if (first) claimSeat();
  onChange();
}
export function push() {
  if (!net.ref || !net.ready || !net.canWrite) return;
  net.rev += 1;
  const body = { rev: net.rev, G: JSON.parse(JSON.stringify(G)) };
  net.chain = net.chain
    .then(() => net.ref.set(body))
    .catch((e) => {
      if (e && e.code === "invalid_argument") net.canWrite = false;
      log(
        null,
        "info",
        e && e.code === "invalid_argument"
          ? "You can't change this table, so you are watching."
          : "Saving to the online table failed.",
        "Try your shot again.",
      );
      onChange();
    });
}
export function sendEmote(c, kind) {
  if (!net.emotes || !net.canWrite) return;
  net.emotes
    .doc(net.uid)
    .set({ c, kind, t: Date.now() })
    .catch(() => {});
}
// Called when the balls stop. The shooter's table decides; the other side waits for that result.
export function settle() {
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
export function takeSeat(p) {
  if (!G.seats[p]) {
    G.seats[p] = net.uid;
    G.names[p] = net.myName;
    onChange();
    push();
  }
}
export function leaveSeat(p) {
  G.seats[p] = null;
  onChange();
  push();
}
