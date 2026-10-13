// Table and referee sounds: heavy balls, cushions, rubber posts, the drop into the goal, the whistle, the crowd,
// and the legends' powers.
import { au, tone, burst } from "./mixer";

const last: Record<string, number> = {};

function whistle(t0: number, dur: number, v = 0.12): void {
  const A = au.A!,
    t = A.currentTime + t0,
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
  o.connect(g).connect(au.fx);
  o.start(t);
  lfo.start(t);
  o.stop(t + dur + 0.05);
  lfo.stop(t + dur + 0.05);
}
/** the café cheering: a swell of voices */
function cheer(t0: number, dur: number, v: number): void {
  for (let i = 0; i < 4; i++)
    burst(dur * (0.7 + Math.random() * 0.3), v, "bandpass", 600 + i * 350, 0.9, t0 + i * 0.05, au.fx, 0, 0.18);
}

/** drop, roll down the return channel, clack into the tray */
function drop(): void {
  tone(92, 0.26, 0.6, "sine", 0, 52);
  burst(0.16, 0.45, "lowpass", 520, 0.8, 0.02);
  burst(0.85, 0.22, "lowpass", 240, 1.2, 0.18, au.fx, 140, 0.12);
  tone(1500, 0.05, 0.22, "triangle", 1.05);
  tone(190, 0.1, 0.35, "sine", 1.05);
  burst(0.03, 0.3, "bandpass", 2200, 2, 1.06);
}

export function sfx(kind: string, v = 1): void {
  if (!au.A || au.A.state !== "running") return;
  const a = Math.min(1, v);
  if (a < 0.03) return;
  const now = au.A.currentTime;
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
    case "rim": // skims across the hole and knocks the far edge
      tone(140, 0.08, 0.4 * a, "sine", 0, 90);
      burst(0.05, 0.4 * a, "bandpass", 900, 1.5);
      break;
    case "lip": // a hard ball slams into the lip, then drops
      tone(70, 0.2, 0.7, "sine", 0, 40);
      burst(0.09, 0.7, "lowpass", 1200, 0.9);
      tone(1200, 0.12, 0.08, "square", 0.01, 600);
      drop();
      break;
    case "pot":
      drop();
      break;
    case "cue":
      burst(0.03, 0.3 + 0.5 * a, "bandpass", 1250, 1.4);
      tone(640, 0.05, 0.16, "sine");
      break;
    case "ui":
      tone(700, 0.045, 0.05, "triangle");
      break;
    case "coin":
      tone(1568, 0.08, 0.08, "square");
      tone(2093, 0.25, 0.07, "square", 0.08);
      break;
    case "goal":
      tone(1318, 0.9, 0.12);
      tone(2637, 0.6, 0.05);
      tone(1318, 0.9, 0.12, "sine", 0.16);
      tone(2637, 0.6, 0.05, "sine", 0.16);
      cheer(0.05, 1.3, 0.2);
      break;
    case "gift":
      burst(1.0, 0.25, "bandpass", 760, 0.8, 0, au.fx, 420, 0.2);
      tone(392, 0.45, 0.08, "triangle", 0.1, 330);
      break;
    case "foul": // two blasts, then a comic slide down
      whistle(0, 0.32);
      whistle(0.42, 0.55);
      tone(1400, 0.75, 0.07, "sine", 1.0, 330);
      break;
    case "stamp":
      tone(62, 0.35, 0.6, "sine", 0, 40);
      burst(0.2, 0.6, "lowpass", 900, 0.8);
      break;
    case "win":
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, 0.1, "square", i * 0.11));
      [523, 659, 784].forEach((f) => tone(f, 1.1, 0.06, "triangle", 0.5));
      cheer(0.1, 2.2, 0.28);
      break;
    case "lighter":
      burst(0.015, 0.4, "highpass", 3000);
      burst(0.12, 0.25, "bandpass", 3200, 0.8, 0.03);
      burst(0.5, 0.12, "lowpass", 1400, 0.7, 0.06, au.fx, 0, 0.05);
      break;
    case "puff":
      for (let i = 0; i < 9; i++)
        burst(0.012, 0.2 + Math.random() * 0.25, "highpass", 2500, 1, 0.1 + i * 0.07 + Math.random() * 0.03);
      burst(0.9, 0.18, "bandpass", 900, 0.5, 0.95, au.fx, 500, 0.2);
      break;
    case "sip":
      tone(3400, 0.18, 0.05);
      tone(5100, 0.12, 0.03);
      burst(0.22, 0.12, "bandpass", 1800, 1.5, 0.35);
      tone(4300, 0.1, 0.03, "sine", 0.9);
      tone(3900, 0.1, 0.025, "sine", 1.05);
      break;
    case "chalk": // the cube twisted on the tip: a few dry scrapes
      for (let i = 0; i < 4; i++) burst(0.09, 0.22, "bandpass", 2600 + i * 300, 1.4, i * 0.13);
      break;
    case "knock": // two knuckle raps on the wooden rail
      for (const t of [0, 0.24]) {
        tone(150, 0.09, 0.5, "sine", t, 95);
        burst(0.04, 0.45, "lowpass", 900, 1, t);
      }
      break;
    case "miscue": // the tip skids off the ball
      burst(0.025, 0.6, "highpass", 2800);
      tone(620, 0.06, 0.2, "triangle", 0.01, 380);
      break;
    case "tide": // a wave rolls in
      burst(2.2, 0.5, "lowpass", 300, 0.7, 0, au.fx, 1400, 0.6);
      burst(1.6, 0.25, "bandpass", 2400, 0.6, 0.6, au.fx, 800, 0.4);
      break;
    case "stone": // a low hiss, then stone grinding
      burst(0.8, 0.3, "highpass", 4000, 1, 0, au.fx, 0, 0.1);
      burst(0.6, 0.6, "lowpass", 180, 1.5, 0.5, au.fx, 90, 0.05);
      break;
    case "thunder": // crack, then the rumble
      burst(0.08, 1, "highpass", 1800);
      burst(2.6, 0.9, "lowpass", 160, 0.8, 0.05, au.fx, 50, 0.02);
      tone(48, 1.8, 0.6, "sine", 0.05, 30);
      break;
  }
}
