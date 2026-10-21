// The jukebox: a little jazz trio plus vibraphone, improvised live from the chord changes in songs.ts.
// Bass walks (or sways), the drummer rides with brushes, the Rhodes comps, the vibes noodle a melody from the chord's scale.
import { au, vol } from "./mixer";
import { t as tr } from "../i18n";
import { band, bass, rhodes, vibes, ride, brush, rim, sweep, kick } from "./band";
import { SONGS, STYLE, chord, hz, near, type Song, type Style } from "./songs";
import { load, save } from "../profile/store";

const rnd = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
export const juke = { title: "", info: "", style: "all" as "all" | Style };
const songListeners: (() => void)[] = [];
/** run on every new record: the settings' jukebox line and the title card */
export const onSong = (f: () => void): void => void songListeners.push(f);
juke.style = (load("jukebox") as "all" | Style) || "all";
const J = {
  song: 0,
  beat: 0,
  nextT: 0,
  bass: 36,
  mel: 74,
  phrase: 0,
  comp: [] as number[],
  started: false,
  choruses: 2,
};
const fits = (i: number) => juke.style === "all" || SONGS[i].style === juke.style;
const nextFit = (i: number) => {
  for (let k = 1; k <= SONGS.length; k++) if (fits((i + k) % SONGS.length)) return (i + k) % SONGS.length;
  return i;
};

/** pick which records the jukebox plays; switches straight away if this one doesn't fit */
export function setStyle(st: "all" | Style): void {
  juke.style = st;
  save("jukebox", st);
  if (au.A && J.started && !fits(J.song)) nextSong();
}

export function initJukebox(): void {
  // a small speaker in a wooden cabinet: no deep bass, no sparkle, a bump in the middle, then the room
  const A = au.A!,
    hp = A.createBiquadFilter(),
    lp = A.createBiquadFilter(),
    mid = A.createBiquadFilter(),
    dry = A.createGain(),
    wet = A.createGain(),
    verb = A.createConvolver();
  hp.type = "highpass";
  hp.frequency.value = 70;
  lp.type = "lowpass";
  lp.frequency.value = 6200;
  mid.type = "peaking";
  mid.frequency.value = 1100;
  mid.gain.value = 3;
  const len = (A.sampleRate * 1.8) | 0,
    ir = A.createBuffer(2, len, A.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  verb.buffer = ir;
  dry.gain.value = 0.85;
  wet.gain.value = 0.3;
  band.bus = A.createGain();
  band.bus.gain.value = 0.9;
  band.bus.connect(hp).connect(mid).connect(lp);
  lp.connect(dry).connect(au.music);
  lp.connect(verb).connect(wet).connect(au.music);
  // tremolo for the Rhodes and the vibraphone motor
  const trem = (rate: number, depth: number) => {
    const g = A.createGain(),
      l = A.createOscillator(),
      d = A.createGain();
    g.gain.value = 1 - depth;
    l.frequency.value = rate;
    d.gain.value = depth;
    l.connect(d).connect(g.gain);
    l.start();
    g.connect(band.bus);
    return g;
  };
  band.rhodes = trem(4.6, 0.18);
  band.vibes = trem(5.4, 0.3);
  J.song = nextFit((Math.random() * SONGS.length) | 0);
  setInterval(schedule, 25); // the first record starts once the browser lets sound play
}

function startSong(t: number): void {
  const s = SONGS[J.song];
  J.beat = 0;
  J.nextT = t;
  J.phrase = 0;
  J.started = true;
  J.choruses = Math.max(2, Math.round(160 / ((s.chords.length * (s.meter || 4) * 60) / s.bpm))); // about two and a half minutes per record
  juke.title = s.title;
  juke.info = tr("{style} · {bpm} BPM · record {n} of {total}", {
    style: tr(STYLE[s.style]),
    bpm: s.bpm,
    n: J.song + 1,
    total: SONGS.length,
  });
  for (const f of songListeners) f();
}
export function nextSong(): void {
  if (!au.A) return;
  J.song = nextFit(J.song);
  startSong(au.A.currentTime + 0.4);
}
function schedule(): void {
  const A = au.A;
  if (!A || A.state !== "running") return;
  if (!J.started) startSong(A.currentTime + 0.8);
  const s = SONGS[J.song],
    b = 60 / s.bpm;
  if (J.nextT < A.currentTime - 0.05) J.nextT = A.currentTime + 0.05; // the tab slept: pick up from now
  while (J.nextT < A.currentTime + 0.15) {
    const meter = s.meter || 4,
      bar = Math.floor(J.beat / meter);
    if (bar >= s.chords.length * J.choruses) {
      J.song = nextFit(J.song);
      startSong(J.nextT + 2.5);
      return;
    }
    if (vol.music > 0) playBeat(s, bar, J.beat % meter, J.nextT, b);
    J.nextT += b;
    J.beat++;
  }
}
const swing = (k: number, b: number) => Math.floor(k / 2) * b + ((k % 2) * b * 2) / 3; // eighth notes, swung two to one

/** one beat of the band: the rhythm section depends on the style, the vibes improvise the same way in all of them */
function playBeat(s: Song, bar: number, pos: number, t: number, b: number): void {
  const C = chord(s.chords[bar % s.chords.length]),
    N = chord(s.chords[(bar + 1) % s.chords.length]),
    st = s.style,
    meter = s.meter || 4;
  const eighth = st === "bossa" || st === "ballad" ? (k: number) => (k / 2) * b : (k: number) => swing(k, b); // bossa and ballad play straight
  const at = (k: number) => t + eighth(k) - pos * b;
  if (st === "bossa") {
    // root and fifth, rim clicks on the clave, a shaker on every eighth
    if (pos === 0 || pos === 2) bass(hz(near(C.root, 38, 31, 45)), t, b * 1.4, 0.4);
    if (pos === 1 || pos === 3) bass(hz(near(C.root + 7, 38, 31, 50)), t + b / 2, b * 0.45, 0.3);
    const clave = bar % 2 ? [2, 4] : [0, 3, 6];
    for (const k of [pos * 2, pos * 2 + 1]) {
      brush(at(k), k % 2 ? 0.03 : 0.045);
      if (clave.includes(k)) rim(at(k), 0.12);
    }
    if (pos === 0 || pos === 2) kick(t, 0.06);
    if (pos === 0)
      J.comp = rnd([
        [0, 3, 6],
        [1, 4, 6],
        [0, 2, 5],
        [2, 5, 7],
        [0, 3, 5, 7],
      ]);
  } else if (st === "ballad") {
    // half notes in the bass, brushes swept in circles, long chords
    if (pos === 0 || pos === 2)
      bass(
        hz(pos === 0 ? near(C.root, J.bass, 31, 45) : near(C.root + rnd([7, 4, 3]), J.bass, 31, 48)),
        t,
        b * 1.9,
        0.36,
      );
    sweep(t, b * 0.95, pos % 2 ? 0.035 : 0.025);
    if (pos === 0) {
      kick(t, 0.04);
      J.comp = Math.random() < 0.6 ? [0] : [0, 4];
    }
  } else {
    // swing and waltz: walking bass, ride with the skip note, hi-hat foot
    let n: number;
    if (pos === 0) n = near(C.root, J.bass, 31, 48);
    else if (pos === meter - 1)
      n = near(N.root, J.bass, 31, 48) + (Math.random() < 0.5 ? 1 : -1); // a half step into the next root
    else {
      const pool = (pos === 2 ? C.tones : C.scale).map((x) =>
        near(C.root + x, J.bass + (Math.random() < 0.5 ? 2 : -2), 31, 50),
      );
      n = rnd(pool);
      if (n === J.bass) n += 2;
    }
    J.bass = n;
    bass(hz(n), t, b * 0.92, pos === 0 ? 0.42 : 0.34);
    ride(t, pos % 2 ? 0.075 : 0.06);
    if (meter === 3 ? pos === 1 : pos === 0 || pos === 2) ride(t + (b * 2) / 3, 0.035); // ding, ding-a ding
    if (meter === 3 ? pos === 1 : pos % 2) brush(t, 0.07);
    kick(t, pos === 0 ? 0.06 : 0.04);
    if (pos === 0)
      J.comp =
        meter === 3
          ? rnd([[2, 4], [2], [3, 4], [0, 4]])
          : rnd([[0], [3], [0, 3], [1, 4], [3, 6], [0, 5], [2, 7], [4], [0, 6]]);
  }
  // Rhodes: the comping rhythm picked for this bar
  for (const k of J.comp)
    if (Math.floor(k / 2) === pos) {
      const vs = C.voice.map((x) => near(C.root + x, 60, 50, 74)).sort((a, z) => a - z),
        long = st === "ballad" ? b * 3.6 : b * (0.6 + Math.random() * 0.9);
      for (const v of vs) rhodes(hz(v), at(k) + Math.random() * 0.012, long, st === "ballad" ? 0.04 : 0.05);
    }
  // vibraphone: phrases of a bar or two, then breathe. Slower and sparser in a ballad.
  if (pos === 0) J.phrase = J.phrase > 0 ? J.phrase - 1 : Math.random() < 0.6 ? 1 + ((Math.random() * 2) | 0) : -1;
  if (J.phrase > 0)
    for (const k of st === "ballad" ? [pos * 2] : [pos * 2, pos * 2 + 1]) {
      if (Math.random() > (st === "ballad" ? 0.55 : k % 2 ? 0.45 : 0.6)) continue;
      const pool = (k % 2 ? C.scale : C.tones).map((x) => near(C.root + x, J.mel + (Math.random() * 6 - 3), 64, 86));
      const close = pool.filter((x) => Math.abs(x - J.mel) <= 5),
        m = close.length ? rnd(close) : rnd(pool);
      J.mel = m;
      vibes(
        hz(m),
        at(k),
        st === "ballad" ? b * 1.6 : b * (Math.random() < 0.3 ? 1.4 : 0.6),
        st === "ballad" ? 0.06 : 0.075,
      );
    }
}
