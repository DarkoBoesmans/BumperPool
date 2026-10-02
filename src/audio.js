// Every sound is synthesised on the fly: no audio files. Four volume busses: master, fx (table and referee), amb (the café) and music (the jukebox).
const KEY = "golfbiljart.volume";
let A = null,
  out,
  fx,
  amb,
  music,
  noise,
  murmur;
const last = {};
export const vol = { master: 90, fx: 90, amb: 50, music: 40 };
try {
  Object.assign(vol, JSON.parse(localStorage.getItem(KEY) || "{}"));
} catch {
  /* private mode: defaults */
}

export function initAudio() {
  if (A) {
    A.resume?.();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  A = new AC();
  out = A.createGain();
  fx = A.createGain();
  amb = A.createGain();
  music = A.createGain();
  fx.connect(out);
  amb.connect(out);
  out.connect(A.destination);
  applyVol();
  const buf = A.createBuffer(1, A.sampleRate * 2, A.sampleRate),
    d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  noise = buf;
  // room tone: brown noise, low and steady
  const bn = A.createBuffer(1, A.sampleRate * 4, A.sampleRate),
    bd = bn.getChannelData(0);
  let l = 0;
  for (let i = 0; i < bd.length; i++) {
    l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    bd[i] = l * 3.5;
  }
  loop(bn, "lowpass", 420, 0.5, 0.35);
  // murmur: voices in the next room, a band of noise whose level wanders
  murmur = loop(noise, "bandpass", 520, 0.9, 0.0);
  setInterval(() => {
    if (A.state === "running")
      murmur.gain.setTargetAtTime(
        0.06 + Math.random() * 0.12,
        A.currentTime,
        0.35,
      );
  }, 450);
  setInterval(() => {
    if (Math.random() < 0.4) {
      const f = 2600 + Math.random() * 1200;
      tone(f, 0.35, 0.03, "sine", 0, 0, amb);
      tone(f * 1.5, 0.25, 0.018, "sine", 0.05, 0, amb);
    }
  }, 6000);
  setInterval(() => {
    if (Math.random() < 0.25) {
      burst(0.05, 0.12, "lowpass", 700, 1, 0, amb);
      tone(160, 0.12, 0.06, "sine", 0, 0, amb);
    }
  }, 9000); // a glass set down on the bar
  initJukebox();
}
function loop(buffer, type, f, q, g) {
  const s = A.createBufferSource(),
    fl = A.createBiquadFilter(),
    gn = A.createGain();
  s.buffer = buffer;
  s.loop = true;
  fl.type = type;
  fl.frequency.value = f;
  fl.Q.value = q;
  gn.gain.value = g;
  s.connect(fl).connect(gn).connect(amb);
  s.start();
  return gn;
}
function applyVol() {
  if (!A) return;
  out.gain.value = (vol.master / 100) ** 2;
  fx.gain.value = (vol.fx / 100) ** 2;
  amb.gain.value = (vol.amb / 100) ** 2 * 1.6;
  music.gain.value = (vol.music / 100) ** 2 * 0.9;
}
export function setVol(k, v) {
  vol[k] = v;
  applyVol();
  try {
    localStorage.setItem(KEY, JSON.stringify(vol));
  } catch {
    /* not saved, still applied */
  }
}

function tone(f, dur, v, type = "sine", t0 = 0, f2 = 0, bus = fx) {
  const t = A.currentTime + t0,
    o = A.createOscillator(),
    g = A.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(v, 0.0002), t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bus);
  o.start(t);
  o.stop(t + dur + 0.05);
  return o;
}
function burst(dur, v, type, f, q = 1, t0 = 0, bus = fx, f2 = 0, attack = 0) {
  const t = A.currentTime + t0,
    s = A.createBufferSource(),
    fl = A.createBiquadFilter(),
    g = A.createGain();
  s.buffer = noise;
  fl.type = type;
  fl.frequency.setValueAtTime(f, t);
  fl.Q.value = q;
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(attack ? 0.0001 : Math.max(v, 0.0002), t);
  if (attack)
    g.gain.exponentialRampToValueAtTime(Math.max(v, 0.0002), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl).connect(g).connect(bus);
  s.start(t, Math.random() * 1.5);
  s.stop(t + dur + 0.05);
}
function whistle(t0, dur, v = 0.12) {
  const t = A.currentTime + t0,
    o = A.createOscillator(),
    lfo = A.createOscillator(),
    depth = A.createGain(),
    g = A.createGain();
  o.frequency.value = 2750;
  lfo.frequency.value = 38;
  depth.gain.value = 140;
  lfo.connect(depth).connect(o.frequency);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + 0.02);
  g.gain.setValueAtTime(v, t + dur - 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(fx);
  o.start(t);
  lfo.start(t);
  o.stop(t + dur + 0.05);
  lfo.stop(t + dur + 0.05);
}
function cheer(t0, dur, v) {
  // the café cheering: a swell of voices
  for (let i = 0; i < 4; i++)
    burst(
      dur * (0.7 + Math.random() * 0.3),
      v,
      "bandpass",
      600 + i * 350,
      0.9,
      t0 + i * 0.05,
      fx,
      0,
      0.18,
    );
}

export function sfx(kind, v = 1) {
  if (!A || A.state !== "running") return;
  const a = Math.min(1, v);
  if (a < 0.03) return;
  const now = A.currentTime;
  if (now - (last[kind] || 0) < 0.03) return;
  last[kind] = now;
  switch (kind) {
    case "ball": // heavy resin balls: a dull knock with a short click on top
      tone(210, 0.09, 0.55 * a, "sine", 0, 140);
      burst(0.03, 0.75 * a, "bandpass", 1900, 1.3);
      tone(980, 0.06, 0.16 * a, "triangle");
      break;
    case "band":
      burst(0.13, 0.7 * a, "lowpass", 300, 0.7);
      tone(82, 0.16, 0.5 * a, "sine", 0, 60);
      break;
    case "dop":
      tone(330, 0.17, 0.32 * a, "triangle", 0, 180);
      burst(0.04, 0.3 * a, "bandpass", 1200, 2);
      tone(2600, 0.3, 0.04 * a, "sine");
      break;
    case "pot": // drop, roll down the return channel, clack into the tray
      tone(92, 0.26, 0.6, "sine", 0, 52);
      burst(0.16, 0.45, "lowpass", 520, 0.8, 0.02);
      burst(0.85, 0.22, "lowpass", 240, 1.2, 0.18, fx, 140, 0.12);
      tone(1500, 0.05, 0.22, "triangle", 1.05);
      tone(190, 0.1, 0.35, "sine", 1.05);
      burst(0.03, 0.3, "bandpass", 2200, 2, 1.06);
      break;
    case "cue":
      burst(0.03, 0.3 + 0.5 * a, "bandpass", 1250, 1.4);
      tone(640, 0.05, 0.16, "sine");
      break;
    case "ui":
      tone(700, 0.045, 0.05, "triangle");
      break;
    case "swoosh":
      burst(0.32, 0.35, "bandpass", 380, 1.2, 0, fx, 2600, 0.08);
      break;
    case "goal":
      tone(1318, 0.9, 0.12);
      tone(2637, 0.6, 0.05);
      tone(1318, 0.9, 0.12, "sine", 0.16);
      tone(2637, 0.6, 0.05, "sine", 0.16);
      cheer(0.05, 1.3, 0.2);
      break;
    case "gift":
      burst(1.0, 0.25, "bandpass", 760, 0.8, 0, fx, 420, 0.2);
      tone(392, 0.45, 0.08, "triangle", 0.1, 330);
      break;
    case "foul":
      whistle(0, 0.32);
      whistle(0.42, 0.55);
      tone(1400, 0.75, 0.07, "sine", 1.0, 330);
      break; // two blasts, then a comic slide down
    case "stamp":
      tone(62, 0.35, 0.6, "sine", 0, 40);
      burst(0.2, 0.6, "lowpass", 900, 0.8);
      break;
    case "win":
      [523, 659, 784, 1047].forEach((f, i) =>
        tone(f, 0.28, 0.1, "square", i * 0.11),
      );
      [523, 659, 784].forEach((f) => tone(f, 1.1, 0.06, "triangle", 0.5));
      cheer(0.1, 2.2, 0.28);
      break;
    case "lighter":
      burst(0.015, 0.4, "highpass", 3000);
      burst(0.12, 0.25, "bandpass", 3200, 0.8, 0.03);
      burst(0.5, 0.12, "lowpass", 1400, 0.7, 0.06, fx, 0, 0.05);
      break;
    case "puff":
      for (let i = 0; i < 9; i++)
        burst(
          0.012,
          0.2 + Math.random() * 0.25,
          "highpass",
          2500,
          1,
          0.1 + i * 0.07 + Math.random() * 0.03,
        );
      burst(0.9, 0.18, "bandpass", 900, 0.5, 0.95, fx, 500, 0.2);
      break;
    case "sip":
      tone(3400, 0.18, 0.05);
      tone(5100, 0.12, 0.03);
      burst(0.22, 0.12, "bandpass", 1800, 1.5, 0.35);
      tone(4300, 0.1, 0.03, "sine", 0.9);
      tone(3900, 0.1, 0.025, "sine", 1.05);
      break;
  }
}

// ---------- the jukebox: a little jazz trio plus vibraphone, improvised live ----------
// Three original tunes over common jazz changes. Bass walks, the drummer rides with brushes, the Rhodes comps,
// the vibes noodle a melody from the chord's scale. All of it goes through a small speaker and a bit of room.
const SONGS = [
  {
    title: "Smoke on the Felt",
    bpm: 112,
    chords: ["Gm7", "C7", "Fmaj7", "Dm7", "Gm7", "C7", "Fmaj7", "C7"],
  },
  {
    title: "Blue Post Blues",
    bpm: 92,
    chords: [
      "Cm7",
      "Cm7",
      "Cm7",
      "Cm7",
      "Fm7",
      "Fm7",
      "Cm7",
      "Cm7",
      "Ab7",
      "G7",
      "Cm7",
      "G7",
    ],
  },
  {
    title: "Last Call at the Golden Cue",
    bpm: 128,
    chords: ["Am7", "D7", "Gmaj7", "Cmaj7", "F#m7b5", "B7", "Em7", "Em7"],
  },
];
const QUAL = {
  // chord tones, the rootless voicing the Rhodes plays, the scale the vibes improvise on
  m7: {
    tones: [0, 3, 7, 10],
    voice: [3, 7, 10, 14],
    scale: [0, 2, 3, 5, 7, 9, 10],
  },
  7: {
    tones: [0, 4, 7, 10],
    voice: [4, 9, 10, 14],
    scale: [0, 2, 4, 5, 7, 9, 10],
  },
  maj7: {
    tones: [0, 4, 7, 11],
    voice: [4, 7, 11, 14],
    scale: [0, 2, 4, 5, 7, 9, 11],
  },
  m7b5: {
    tones: [0, 3, 6, 10],
    voice: [3, 6, 10, 12],
    scale: [0, 1, 3, 5, 6, 8, 10],
  },
};
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function chord(s) {
  const m = /^([A-G])([#b]?)(.*)$/.exec(s),
    root = NOTE[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  return { root: (root + 12) % 12, ...QUAL[m[3]] };
}
const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);
const rnd = (a) => a[Math.floor(Math.random() * a.length)];
export const juke = { title: "", info: "", onChange: null };
const J = {
  song: 0,
  beat: 0,
  nextT: 0,
  bass: 36,
  mel: 74,
  phrase: 0,
  comp: [],
  started: false,
};
let mBus, rhodesBus, vibesBus;

function initJukebox() {
  // a small speaker in a wooden cabinet: no deep bass, no sparkle, a bump in the middle, then the room
  const hp = A.createBiquadFilter(),
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
    for (let i = 0; i < len; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  verb.buffer = ir;
  dry.gain.value = 0.85;
  wet.gain.value = 0.3;
  mBus = A.createGain();
  mBus.gain.value = 0.9;
  mBus.connect(hp).connect(mid).connect(lp);
  lp.connect(dry).connect(music);
  lp.connect(verb).connect(wet).connect(music);
  music.connect(out);
  // tremolo for the Rhodes and the vibraphone motor
  const trem = (rate, depth) => {
    const g = A.createGain(),
      l = A.createOscillator(),
      d = A.createGain();
    g.gain.value = 1 - depth;
    l.frequency.value = rate;
    d.gain.value = depth;
    l.connect(d).connect(g.gain);
    l.start();
    g.connect(mBus);
    return g;
  };
  rhodesBus = trem(4.6, 0.18);
  vibesBus = trem(5.4, 0.3);
  J.song = (Math.random() * SONGS.length) | 0;
  startSong(A.currentTime + 1.2);
  setInterval(schedule, 25);
}
function startSong(t) {
  const s = SONGS[J.song];
  J.beat = 0;
  J.nextT = t;
  J.phrase = 0;
  J.started = true;
  J.choruses = Math.max(
    2,
    Math.round(160 / ((s.chords.length * 4 * 60) / s.bpm)),
  ); // about two and a half minutes per record
  juke.title = s.title;
  juke.info = `House trio · ${s.bpm} BPM · record ${J.song + 1} of ${SONGS.length}`;
  juke.onChange?.();
}
export function nextSong() {
  if (!A) return;
  J.song = (J.song + 1) % SONGS.length;
  startSong(A.currentTime + 0.4);
}
function schedule() {
  if (!A || A.state !== "running" || !J.started) return;
  const s = SONGS[J.song],
    b = 60 / s.bpm;
  if (J.nextT < A.currentTime - 0.05) J.nextT = A.currentTime + 0.05; // the tab slept: pick up from now
  while (J.nextT < A.currentTime + 0.15) {
    const bar = Math.floor(J.beat / 4);
    if (bar >= s.chords.length * J.choruses) {
      J.song = (J.song + 1) % SONGS.length;
      startSong(J.nextT + 2.5);
      return;
    }
    if (vol.music > 0) playBeat(s, bar, J.beat % 4, J.nextT, b);
    J.nextT += b;
    J.beat++;
  }
}
const swing = (k, b) => Math.floor(k / 2) * b + ((k % 2) * b * 2) / 3; // eighth notes, swung two to one

function playBeat(s, bar, pos, t, b) {
  const C = chord(s.chords[bar % s.chords.length]),
    N = chord(s.chords[(bar + 1) % s.chords.length]);
  // walking bass: root on one, chord or scale tones in between, a half step into the next root on four
  let n;
  if (pos === 0) n = near(C.root, J.bass, 31, 48);
  else if (pos === 3) {
    const target = near(N.root, J.bass, 31, 48);
    n = target + (Math.random() < 0.5 ? 1 : -1);
  } else {
    const pool = (pos === 2 ? C.tones : C.scale).map((x) =>
      near(C.root + x, J.bass + (Math.random() < 0.5 ? 2 : -2), 31, 50),
    );
    n = rnd(pool);
    if (n === J.bass) n += 2;
  }
  J.bass = n;
  bass(hz(n), t, b * 0.92, pos === 0 ? 0.42 : 0.34);
  // drums: ride on every beat with the skip before two and four, the hi-hat foot on two and four, a feathered kick
  ride(t, pos === 1 || pos === 3 ? 0.075 : 0.06);
  if (pos === 0 || pos === 2) ride(t + (b * 2) / 3, 0.035); // the skip note: ding, ding-a ding
  if (pos === 1 || pos === 3) brush(t, 0.07);
  kick(t, 0.05);
  // Rhodes: pick a comping rhythm per bar
  if (pos === 0)
    J.comp = rnd([
      [0],
      [3],
      [0, 3],
      [1, 4],
      [3, 6],
      [0, 5],
      [2, 7],
      [4],
      [0, 6],
    ]);
  for (const k of J.comp)
    if (Math.floor(k / 2) === pos) {
      const vs = C.voice
        .map((x) => near(C.root + x, 60, 50, 74))
        .sort((a, z) => a - z);
      const at = t + swing(k, b) - pos * b;
      for (const v of vs)
        rhodes(
          hz(v),
          at + Math.random() * 0.012,
          b * (0.6 + Math.random() * 0.9),
          0.05,
        );
    }
  // vibraphone: phrases of a bar or two, then breathe
  if (pos === 0)
    J.phrase =
      J.phrase > 0
        ? J.phrase - 1
        : Math.random() < 0.6
          ? 1 + ((Math.random() * 2) | 0)
          : -1;
  if (J.phrase > 0)
    for (const k of [pos * 2, pos * 2 + 1]) {
      if (Math.random() > (k % 2 ? 0.45 : 0.6)) continue;
      const pool = (k % 2 ? C.scale : C.tones).map((x) =>
        near(C.root + x, J.mel + (Math.random() * 6 - 3), 64, 86),
      );
      let m = rnd(pool.filter((x) => Math.abs(x - J.mel) <= 5)) ?? rnd(pool);
      J.mel = m;
      vibes(
        hz(m),
        t + swing(k, b) - pos * b,
        b * (Math.random() < 0.3 ? 1.4 : 0.6),
        0.075,
      );
    }
}
function near(pc, ref, lo, hi) {
  // the pitch class `pc` in the octave closest to `ref`, inside lo..hi
  let n = Math.round((ref - pc) / 12) * 12 + pc;
  while (n < lo) n += 12;
  while (n > hi) n -= 12;
  return n;
}
function env(g, t, a, peak, dur, rel = 0.06) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(peak * 0.35, t + a + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + rel);
}
function bass(f, t, dur, v) {
  const o = A.createOscillator(),
    o2 = A.createOscillator(),
    lp = A.createBiquadFilter(),
    g = A.createGain();
  o.type = "triangle";
  o.frequency.value = f;
  o2.frequency.value = f;
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(900, t);
  lp.frequency.exponentialRampToValueAtTime(320, t + 0.25);
  env(g, t, 0.012, v, dur, 0.05);
  o.connect(lp);
  o2.connect(lp);
  lp.connect(g).connect(mBus);
  o.start(t);
  o2.start(t);
  o.stop(t + dur + 0.1);
  o2.stop(t + dur + 0.1);
}
function rhodes(f, t, dur, v) {
  // two-operator FM: the bell on the attack is what makes it a Rhodes
  const c = A.createOscillator(),
    m = A.createOscillator(),
    mg = A.createGain(),
    g = A.createGain();
  c.frequency.value = f;
  m.frequency.value = f;
  mg.gain.setValueAtTime(f * 1.4, t);
  mg.gain.exponentialRampToValueAtTime(f * 0.15, t + 0.3);
  m.connect(mg).connect(c.frequency);
  env(g, t, 0.006, v, dur, 0.15);
  c.connect(g).connect(rhodesBus);
  c.start(t);
  m.start(t);
  c.stop(t + dur + 0.25);
  m.stop(t + dur + 0.25);
}
function vibes(f, t, dur, v) {
  const o = A.createOscillator(),
    o4 = A.createOscillator(),
    g = A.createGain(),
    g4 = A.createGain();
  o.frequency.value = f;
  o4.frequency.value = f * 4;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + 0.003);
  g.gain.exponentialRampToValueAtTime(v * 0.4, t + dur);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.5);
  g4.gain.setValueAtTime(v * 0.35, t);
  g4.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  o.connect(g).connect(vibesBus);
  o4.connect(g4).connect(vibesBus);
  o.start(t);
  o4.start(t);
  o.stop(t + dur + 0.6);
  o4.stop(t + 0.15);
}
function ride(t, v) {
  const s = A.createBufferSource(),
    bp = A.createBiquadFilter(),
    g = A.createGain();
  s.buffer = noise;
  bp.type = "bandpass";
  bp.frequency.value = 7200;
  bp.Q.value = 1.2;
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  s.connect(bp).connect(g).connect(mBus);
  s.start(t, Math.random() * 1.5);
  s.stop(t + 0.75);
  const p = A.createOscillator(),
    pg = A.createGain();
  p.frequency.value = 5100 + Math.random() * 60;
  pg.gain.setValueAtTime(v * 0.18, t);
  pg.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  p.connect(pg).connect(mBus);
  p.start(t);
  p.stop(t + 0.55);
}
function brush(t, v) {
  const s = A.createBufferSource(),
    hp = A.createBiquadFilter(),
    g = A.createGain();
  s.buffer = noise;
  hp.type = "highpass";
  hp.frequency.value = 5000;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  s.connect(hp).connect(g).connect(mBus);
  s.start(t, Math.random() * 1.5);
  s.stop(t + 0.12);
}
function kick(t, v) {
  const o = A.createOscillator(),
    g = A.createGain();
  o.frequency.setValueAtTime(72, t);
  o.frequency.exponentialRampToValueAtTime(44, t + 0.14);
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g).connect(mBus);
  o.start(t);
  o.stop(t + 0.2);
}
