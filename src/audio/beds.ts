// The café's sound bed: a recorded room (data/beds.ts) for the bar's mood, laid loop over loop so their soft edges
// cross-fade. Another bar fades its own room in over the old one. A bed loads the first time a bar needs it, and only
// the one playing stays in memory (a minute of sound is about 12 MB once decoded).
import { au } from "./mixer";
import { BEDS, BED_OF, EDGE } from "../data/beds";
import { moodOf, type Mood } from "../data/records";

type Key = keyof typeof BEDS;
/** under the jukebox: the beds are levelled to -24 LUFS, the records sit about 4 dB above this.
 * ponytail: set by loudness numbers, not by ear on real speakers; nudge it if the room drowns the jukebox */
const BASE = 0.3;
const loads: Partial<Record<Key, Promise<AudioBuffer | null>>> = {};
let now: { key: Key; mood: Mood; out: GainNode; lp: BiquadFilterNode; stop: () => void } | null = null;

function load(k: Key): Promise<AudioBuffer | null> {
  for (const o of Object.keys(loads) as Key[]) if (o !== k) delete loads[o];
  return (loads[k] ??= fetch("music/" + BEDS[k].file)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
    .then((b) => au.A!.decodeAudioData(b))
    .catch(() => null)); // no bed (offline, an old browser): the café is quiet, the game plays on
}

/** play `buf` round and round into `out`: each loop starts EDGE seconds before the last one ends */
function loop(buf: AudioBuffer, out: AudioNode): () => void {
  const A = au.A!,
    live = new Set<AudioBufferSourceNode>();
  let at = A.currentTime + 0.05,
    on = true;
  const queue = () => {
    const s = A.createBufferSource();
    s.buffer = buf;
    s.connect(out);
    s.start(at);
    s.onended = () => {
      live.delete(s);
      if (on) queue(); // one ends while the next plays: line up the one after (almost a minute ahead)
    };
    live.add(s);
    at += buf.duration - EDGE;
  };
  queue();
  queue();
  return () => {
    on = false;
    for (const s of live) s.stop(A.currentTime + 2);
  };
}

/** the bar changed (or the first sound): its room fades in, the last one fades out */
export async function syncBed(venue: string | undefined): Promise<void> {
  const A = au.A,
    mood = moodOf(venue);
  if (!A || now?.mood === mood) return;
  const want = BED_OF[mood],
    t = A.currentTime;
  if (now?.key === want.bed) {
    // the same room, another mood: only the walls and the level change
    now.mood = mood;
    now.lp.frequency.setTargetAtTime(want.lp, t, 0.5);
    now.out.gain.setTargetAtTime(BASE * want.gain, t, 0.5);
    return;
  }
  const old = now,
    out = A.createGain(),
    lp = A.createBiquadFilter();
  now = { key: want.bed, mood, out, lp, stop: () => {} };
  if (old) {
    old.out.gain.setTargetAtTime(0, t, 0.5);
    old.stop();
  }
  const buf = await load(want.bed);
  if (!buf || now.out !== out) return; // failed, or another bar came along while it loaded
  lp.frequency.value = want.lp;
  out.gain.value = BASE * want.gain;
  lp.connect(out).connect(au.amb);
  now.stop = loop(buf, lp);
}
