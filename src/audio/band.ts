// The jukebox band: walking bass, a Rhodes, vibraphone, ride cymbal, brushes, rim clicks and a soft kick.
// Everything goes through `bus`, a small speaker in a wooden cabinet (jukebox.ts).
import { au } from "./mixer";

export const band = {} as { bus: GainNode; rhodes: GainNode; vibes: GainNode };

function env(g: GainNode, t: number, a: number, peak: number, dur: number, rel = 0.06): void {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(peak * 0.35, t + a + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + rel);
}
function noise(
  t: number,
  type: BiquadFilterType,
  f: number,
  q: number,
  shape: (g: GainNode) => void,
  dur: number,
): void {
  const A = au.A!,
    s = A.createBufferSource(),
    fl = A.createBiquadFilter(),
    g = A.createGain();
  s.buffer = au.noise;
  fl.type = type;
  fl.frequency.value = f;
  fl.Q.value = q;
  shape(g);
  s.connect(fl).connect(g).connect(band.bus);
  s.start(t, Math.random() * 1.5);
  s.stop(t + dur);
}

export function bass(f: number, t: number, dur: number, v: number): void {
  const A = au.A!,
    o = A.createOscillator(),
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
  lp.connect(g).connect(band.bus);
  o.start(t);
  o2.start(t);
  o.stop(t + dur + 0.1);
  o2.stop(t + dur + 0.1);
}
/** two-operator FM: the bell on the attack is what makes it a Rhodes */
export function rhodes(f: number, t: number, dur: number, v: number): void {
  const A = au.A!,
    c = A.createOscillator(),
    m = A.createOscillator(),
    mg = A.createGain(),
    g = A.createGain();
  c.frequency.value = f;
  m.frequency.value = f;
  mg.gain.setValueAtTime(f * 1.4, t);
  mg.gain.exponentialRampToValueAtTime(f * 0.15, t + 0.3);
  m.connect(mg).connect(c.frequency);
  env(g, t, 0.006, v, dur, 0.15);
  c.connect(g).connect(band.rhodes);
  c.start(t);
  m.start(t);
  c.stop(t + dur + 0.25);
  m.stop(t + dur + 0.25);
}
export function vibes(f: number, t: number, dur: number, v: number): void {
  const A = au.A!,
    o = A.createOscillator(),
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
  o.connect(g).connect(band.vibes);
  o4.connect(g4).connect(band.vibes);
  o.start(t);
  o4.start(t);
  o.stop(t + dur + 0.6);
  o4.stop(t + 0.15);
}
export function ride(t: number, v: number): void {
  noise(
    t,
    "bandpass",
    7200,
    1.2,
    (g) => {
      g.gain.setValueAtTime(v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    },
    0.75,
  );
  const A = au.A!,
    p = A.createOscillator(),
    pg = A.createGain();
  p.frequency.value = 5100 + Math.random() * 60;
  pg.gain.setValueAtTime(v * 0.18, t);
  pg.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  p.connect(pg).connect(band.bus);
  p.start(t);
  p.stop(t + 0.55);
}
export const brush = (t: number, v: number): void =>
  noise(
    t,
    "highpass",
    5000,
    1,
    (g) => {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    },
    0.12,
  );
/** a cross-stick click */
export const rim = (t: number, v: number): void =>
  noise(
    t,
    "bandpass",
    1900,
    5,
    (g) => {
      g.gain.setValueAtTime(v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    },
    0.06,
  );
/** brushes stirred round the snare */
export function sweep(t: number, dur: number, v: number): void {
  const A = au.A!,
    s = A.createBufferSource(),
    bp = A.createBiquadFilter(),
    g = A.createGain();
  s.buffer = au.noise;
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(2600, t);
  bp.frequency.linearRampToValueAtTime(3800, t + dur);
  bp.Q.value = 0.8;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + dur * 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(bp).connect(g).connect(band.bus);
  s.start(t, Math.random() * 1.5);
  s.stop(t + dur + 0.02);
}
export function kick(t: number, v: number): void {
  const A = au.A!,
    o = A.createOscillator(),
    g = A.createGain();
  o.frequency.setValueAtTime(72, t);
  o.frequency.exponentialRampToValueAtTime(44, t + 0.14);
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g).connect(band.bus);
  o.start(t);
  o.stop(t + 0.2);
}
