// Shot recorder and the replay cameras: goal cam, winning goal cam and foul cam.
import { THREE, M, camS } from "./scene.js";
import { G, R } from "./game.js";

const STEP = 1 / 60;
export const rec = { times: [], frames: [], n: -1, active: false };
function sample() {
  const f = new Float32Array(30);
  for (const b of G.balls) {
    f[b.id * 3] = b.x;
    f[b.id * 3 + 1] = b.y;
    f[b.id * 3 + 2] = b.on ? 1 : 0;
  }
  rec.frames.push(f);
  rec.times.push(G.simT);
}
export function recStart(n) {
  rec.times = [];
  rec.frames = [];
  rec.n = n;
  rec.active = true;
  sample();
}
export function recTick() {
  if (rec.active && G.simT - rec.times[rec.times.length - 1] >= STEP - 1e-9)
    sample();
}
export function recStop() {
  if (rec.active) {
    sample();
    rec.active = false;
  }
}
export const hasShot = (n) => rec.n === n && rec.frames.length > 2;

const out = new Float32Array(30),
  back = new Float32Array(30);
function frameAt(t, p = play, o = out) {
  const T = p.T,
    F = p.F;
  if (t <= T[0]) return F[0];
  if (t >= T[T.length - 1]) return F[F.length - 1];
  let lo = 0,
    hi = T.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (T[m] <= t) lo = m;
    else hi = m;
  }
  const k = (t - T[lo]) / (T[hi] - T[lo]),
    a = F[lo],
    b = F[hi];
  for (let i = 0; i < 30; i += 3) {
    o[i] = a[i] + (b[i] - a[i]) * k;
    o[i + 1] = a[i + 1] + (b[i + 1] - a[i + 1]) * k;
    o[i + 2] = b[i + 2] > 0 && a[i + 2] > 0 ? 1 : 0;
  }
  return o;
}
const P = (f, id, h = R) =>
  new THREE.Vector3(f[id * 3] * M, h * M, f[id * 3 + 1] * M);

// moment: { kind: 'goal' | 'win' | 'gift' | 'foul', pot, foul }
export const play = { on: false };
export function startReplay(m) {
  const end = rec.times[rec.times.length - 1];
  const p = {
    on: true,
    m,
    simT: 0,
    frozen: 0,
    frozeT: 0,
    frozeDone: false,
    goalCut: false,
    cut: true,
    T: rec.times,
    F: rec.frames,
    freezeAt: undefined,
    high: false,
  };
  if (m.kind === "foul") {
    const f = m.foul,
      tf = f.t < 0 ? end : Math.min(end, Math.max(f.t, f.t === 0 ? 0.12 : f.t));
    p.focus = { t: tf, x: f.x, y: f.y, id: f.ball };
    p.t0 = Math.max(0, tf - 1.6);
    p.t1 = Math.min(end, tf + 1.0);
    p.freezeAt = tf;
    p.freezeFor = 3.6;
    p.slow = [tf - 0.5, tf + 0.05, 0.3];
    p.high = f.key === "tri" || f.key === "hard" || f.key === "fly";
  } else {
    const pot = m.pot,
      tp = pot.t;
    p.focus = { t: tp, x: pot.x, y: pot.y, id: pot.id, h: pot.h };
    p.t0 = Math.max(0, tp - 2.6);
    p.t1 = Math.min(end, tp + (m.kind === "win" ? 0.4 : 0.8));
    p.slow = [tp - 0.9, tp + 0.25, m.kind === "win" ? 0.22 : 0.33];
    if (m.kind === "win") {
      p.freezeAt = tp - 0.02;
      p.freezeFor = 1.8;
    }
  }
  p.simT = p.t0;
  Object.assign(play, p);
  camS.prev = camS.mode;
  camS.mode = "replay";
  camS.replay = {
    pos: new THREE.Vector3(),
    look: new THREE.Vector3(),
    cut: true,
    high: p.high,
  };
}
export function stopReplay() {
  play.on = false;
  camS.mode = camS.prev || "player";
  camS.replay = null;
}

// Advances the replay. Returns the frame to draw, or null once it is over.
export function stepReplay(dt) {
  if (!play.on) return null;
  const p = play;
  if (p.frozen > 0) {
    p.frozen -= dt;
    p.frozeT = (p.frozeT || 0) + dt;
  } else {
    const rate = p.simT > p.slow[0] && p.simT < p.slow[1] ? p.slow[2] : 1;
    const next = p.simT + dt * rate;
    if (p.freezeAt !== undefined && !p.frozeDone && next >= p.freezeAt) {
      p.simT = p.freezeAt;
      p.frozen = p.freezeFor;
      p.frozeDone = true;
    } else p.simT = next;
    if (p.simT >= p.t1 && p.frozen <= 0) {
      stopReplay();
      return null;
    }
  }
  const f = frameAt(p.simT);
  aim(p, f);
  return f;
}
export const frozen = () => play.on && play.frozen > 0;

function aim(p, f) {
  const cr = camS.replay,
    fo = p.focus,
    orbit = (p.frozeT || 0) * 0.25;
  if (p.m.kind === "foul") {
    const c =
      fo.id != null && f[fo.id * 3 + 2] > 0
        ? P(f, fo.id)
        : new THREE.Vector3(fo.x * M, R * M, fo.y * M);
    const near = Math.abs(p.simT - fo.t) < 0.6 || p.frozen > 0;
    const d = p.high ? 0.75 : near ? 0.5 : 0.85,
      el = p.high ? 1.15 : near ? 0.42 : 0.6,
      az = 0.9 + orbit + (fo.x > 0 ? Math.PI : 0);
    cr.pos.set(
      c.x + d * Math.cos(el) * Math.cos(az),
      c.y + d * Math.sin(el),
      c.z + d * Math.cos(el) * Math.sin(az),
    );
    cr.look.copy(c);
    return;
  }
  // goal cam: chase the ball, then cut to a low camera behind the goal for the last second
  const id = fo.id,
    h = fo.h,
    goal = new THREE.Vector3(h * 0.897, 0.02, 0);
  const on = f[id * 3 + 2] > 0,
    b = on ? P(f, id) : goal.clone();
  if (p.simT < fo.t - 1.0) {
    const g = frameAt(Math.max(0, p.simT - 0.08), p, back),
      prev = P(g, id),
      dir = b.clone().sub(prev);
    dir.y = 0;
    if (dir.lengthSq() < 1e-8) dir.set(h, 0, 0);
    dir.normalize();
    cr.pos
      .copy(b)
      .addScaledVector(dir, -0.7)
      .add(new THREE.Vector3(0, 0.4, 0));
    cr.look.copy(b).addScaledVector(dir, 0.5);
  } else {
    if (!p.goalCut) {
      p.goalCut = true;
      cr.cut = true;
    }
    const side = fo.y > 0 ? 1 : -1;
    cr.pos.set(
      h * (0.897 + 0.42 - orbit * 0.12),
      0.3 + orbit * 0.05,
      side * (0.34 + orbit * 0.25),
    ); // behind and beside the goal, over the rail
    cr.look.lerpVectors(goal, b, 0.55);
  }
}
