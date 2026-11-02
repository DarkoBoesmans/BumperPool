// The table and the referee are synthesised on the fly; the café is a recorded room (beds.ts), the jukebox plays
// records (records.ts) or the house trio. Four volume busses: master, fx (table and referee), amb (the café) and
// music (the jukebox).
import { initJukebox } from "./jukebox";
import { syncBed } from "./beds";
import { C } from "../cafe/state";
import { load, save } from "../profile/store";

export const au = {} as {
  A: AudioContext | null;
  out: GainNode;
  fx: GainNode;
  amb: GainNode;
  music: GainNode;
  noise: AudioBuffer;
};
au.A = null;
export type Bus = "master" | "fx" | "amb" | "music";
export const vol: Record<Bus, number> = { master: 90, fx: 90, amb: 50, music: 40 };
try {
  Object.assign(vol, JSON.parse(load("volume") || "{}"));
} catch {
  /* defaults */
}

export function initAudio(): void {
  if (au.A) {
    au.A.resume?.();
    return;
  }
  const AC =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  const A = (au.A = new AC());
  au.out = A.createGain();
  au.fx = A.createGain();
  au.amb = A.createGain();
  au.music = A.createGain();
  au.fx.connect(au.out);
  au.amb.connect(au.out);
  au.music.connect(au.out);
  au.out.connect(A.destination);
  applyVol();
  const buf = A.createBuffer(1, A.sampleRate * 2, A.sampleRate),
    d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  au.noise = buf;
  initJukebox();
  void syncBed(C.venue?.id);
  setInterval(() => void syncBed(C.venue?.id), 1000); // follows the bar you are in
}

function applyVol(): void {
  if (!au.A) return;
  au.out.gain.value = (vol.master / 100) ** 2;
  au.fx.gain.value = (vol.fx / 100) ** 2;
  au.amb.gain.value = (vol.amb / 100) ** 2 * 1.6;
  au.music.gain.value = (vol.music / 100) ** 2 * 0.9;
}
export function setVol(k: Bus, v: number): void {
  vol[k] = v;
  applyVol();
  save("volume", JSON.stringify(vol));
}

export function tone(
  f: number,
  dur: number,
  v: number,
  type: OscillatorType = "sine",
  t0 = 0,
  f2 = 0,
  bus: AudioNode = au.fx,
): OscillatorNode {
  const A = au.A!,
    t = A.currentTime + t0,
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
export function burst(
  dur: number,
  v: number,
  type: BiquadFilterType,
  f: number,
  q = 1,
  t0 = 0,
  bus: AudioNode = au.fx,
  f2 = 0,
  attack = 0,
): void {
  const A = au.A!,
    t = A.currentTime + t0,
    s = A.createBufferSource(),
    fl = A.createBiquadFilter(),
    g = A.createGain();
  s.buffer = au.noise;
  fl.type = type;
  fl.frequency.setValueAtTime(f, t);
  fl.Q.value = q;
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(attack ? 0.0001 : Math.max(v, 0.0002), t);
  if (attack) g.gain.exponentialRampToValueAtTime(Math.max(v, 0.0002), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl).connect(g).connect(bus);
  s.start(t, Math.random() * 1.5);
  s.stop(t + dur + 0.05);
}
