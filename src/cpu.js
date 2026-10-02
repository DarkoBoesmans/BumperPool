// The opponent's brain: it tries candidate shots on a copy of the game, judged by the real referee,
// keeps the best one and then plays it with a hand as shaky as its character.
// Each regular looks for different kinds of shots (see `mix` in opponents.js), which is what makes them play differently.
import {
  G,
  withCopy,
  fire,
  step,
  trackTri,
  allStill,
  onSettled,
  strike,
  ball,
  remaining,
  other,
  fouls,
  loc,
  inKlein,
  onderStoot,
  att,
  GOAL_X,
  HY,
  R,
  DOP_R,
  DOPS,
} from "./game.js";

const SIM_DT = 1 / 240,
  SIM_MAX = 1500; // ponytail: coarser step than the real table (1/600), so plans are slightly optimistic; finer costs think time
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 1.4;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const W = HY - R; // where a ball centre touches a long cushion

function judge(cc, ai) {
  let s = 0;
  for (const x of G.balls)
    if (x.on) {
      const { u, v } = loc(x.c, x),
        near = Math.max(0, 1 - Math.hypot(u, v * 1.5) / 1200);
      // a ball tucked in the corner beside the goal looks close but is stuck there: soft shots only and the post blocks the way
      const stuck = onderStoot(x.c, x) && !inKlein(x.c, x) && u < 200;
      if (x.c === cc)
        s += stuck
          ? -30
          : 24 * near + (inKlein(cc, x) ? 12 + (ai.triangle || 0) : 0);
      else s += stuck ? 10 : -(18 + 40 * ai.defense) * near;
    }
  return s;
}

function simShot(cc, c, ai, dt = SIM_DT) {
  return withCopy(() => {
    const mine = remaining(cc),
      theirs = remaining(other(cc)),
      f = fouls(cc);
    fire(c.id, c.s);
    let n = 0,
      max = (SIM_MAX * SIM_DT) / dt;
    while (G.phase === "moving" && n++ < max) {
      step(dt);
      trackTri();
      if (allStill()) onSettled();
    }
    const scored = mine - remaining(cc),
      touches = G.stroke?.touches || 0;
    let s =
      scored * 100 -
      (theirs - remaining(other(cc))) * 70 -
      (fouls(cc) > f ? 150 * (ai.risk ?? 1) : 0);
    if (scored > 0) s += (ai.flair || 0) * Math.min(4, touches); // style points for goals off cushions and posts
    if (G.phase === "aim" && G.turn === cc) s += 15;
    return s + judge(cc, ai);
  });
}

function simOpening(cc, c) {
  return withCopy(() => {
    const b = ball(c.id);
    G.stroke = { opening: true, first: {}, pots: [] };
    strike(b, c.s);
    let n = 0;
    while (!allStill() && n++ < SIM_MAX) step(SIM_DT);
    const fc = G.stroke.first[c.id];
    if (!fc || fc.type !== "band" || fc.side !== (cc === "W" ? "y-" : "y+"))
      return -1e4;
    return b.on ? -Math.hypot(b.x - att(cc) * GOAL_X, b.y) : 500;
  });
}

function pickKind(mix) {
  let t = Math.random() * Object.values(mix).reduce((a, b) => a + b, 0);
  for (const [k, w] of Object.entries(mix)) if ((t -= w) <= 0) return k;
  return "random";
}
const aimAt = (b, x, y) => Math.atan2(y - b.y, x - b.x);

// One idea for one ball, in the style the character likes.
function idea(kind, b, cc, ai) {
  const gx = att(cc) * GOAL_X;
  let ang, p, d;
  switch (kind) {
    case "straight":
      ang = aimAt(b, gx, 0) + (Math.random() - 0.5) * 0.05;
      d = Math.hypot(gx - b.x, b.y);
      p = 0.08 + (d / 1800) * 0.4 + (Math.random() - 0.5) * 0.1;
      break;
    case "bank": {
      // off one or two long cushions: aim at the goal's mirror image
      const s = Math.random() < 0.5 ? 1 : -1,
        two = Math.random() < 0.35,
        ty = s * (two ? 4 : 2) * W + (Math.random() - 0.5) * 30;
      ang = aimAt(b, gx, ty);
      d = Math.hypot(gx - b.x, ty - b.y);
      p =
        0.1 +
        (d / 1800) * 0.45 * (two ? 1.5 : 1.25) +
        (Math.random() - 0.5) * 0.1;
      break;
    }
    case "post": {
      // glance a post so it bends the ball towards the goal
      const q = DOPS[(Math.random() * DOPS.length) | 0],
        a = Math.random() * Math.PI * 2,
        rr = (R + DOP_R) * (0.5 + Math.random() * 0.45);
      ang = aimAt(b, q.x + Math.cos(a) * rr, q.y + Math.sin(a) * rr);
      p = 0.15 + Math.random() * 0.45;
      break;
    }
    case "combo": {
      // hit one of your balls first and send both flying
      const opp = G.balls.filter((x) => x.on && x.c !== cc);
      if (!opp.length) return idea("straight", b, cc, ai);
      const o = opp[(Math.random() * opp.length) | 0];
      ang = aimAt(
        b,
        o.x + (Math.random() - 0.5) * 2 * R,
        o.y + (Math.random() - 0.5) * 2 * R,
      );
      d = Math.hypot(o.x - b.x, o.y - b.y);
      p = 0.15 + (d / 1800) * 0.3 + Math.random() * 0.35;
      break;
    }
    default:
      ang = Math.random() * Math.PI * 2;
      p = 0.08 + Math.random() * 0.6;
  }
  return {
    dx: Math.cos(ang),
    dy: Math.sin(ang),
    p: clamp(p * ai.powerBias, 0.05, 0.95),
  };
}

// Returns a job the game loop works through a few milliseconds per frame.
export function planCpu(cc, ai) {
  const g = att(cc),
    cands = [];
  if (G.phase === "openW" || G.phase === "openR") {
    const id = G.open.ids[cc],
      left = cc === "W" ? -1 : 1;
    for (let i = 0; i < Math.max(12, (ai.n / 3) | 0); i++) {
      const a = ((8 + Math.random() * 22) * Math.PI) / 180; // the opening ball sits between the goal posts: steeper than about 30° hits a post
      cands.push({
        id,
        s: {
          dx: g * Math.cos(a),
          dy: left * Math.sin(a),
          p: 0.14 + Math.random() * 0.4,
        },
      });
    }
    return {
      cands,
      evalFn: (c) => simOpening(cc, c),
      best: null,
      bestS: -Infinity,
      refine: 0,
      top: [],
      verify: 0,
    };
  }
  const mine = G.balls.filter((b) => b.on && b.c === cc),
    mix = ai.mix || { straight: 0.45, bank: 0.2, random: 0.35 };
  for (let i = 0; i < ai.n; i++) {
    const b = mine[i % mine.length],
      s = idea(pickKind(mix), b, cc, ai),
      spin = Math.random() < ai.spin;
    if (spin) {
      s.sx = (Math.random() - 0.5) * 1.6;
      s.sy = (Math.random() - 0.5) * 1.8;
    }
    cands.push({ id: b.id, s });
  }
  // verify: re-run the best few ideas at full precision, three times each with the character's own wobble, and keep the most reliable
  const robust = (c) => {
    let t = 0;
    for (let k = 0; k < 3; k++)
      t += simShot(cc, { id: c.id, s: shaky(c, ai) }, ai, 1 / 600);
    return t / 3;
  };
  return {
    cands,
    evalFn: (c) => simShot(cc, c, ai),
    robust,
    best: null,
    bestS: -Infinity,
    refine: ai.refine || 0,
    top: [],
    verify: ai.verify || 0,
  };
}

// Thinks for up to `budget` ms. Returns true once every candidate has been tried.
// Characters with `refine` then try small variations of their best idea before deciding.
export function think(job, budget = 7) {
  const t0 = performance.now();
  if (job.checking) {
    while (job.checking.length && performance.now() - t0 < budget) {
      const c = job.checking.pop(),
        s = job.robust(c);
      if (s > job.checkS) {
        job.checkS = s;
        job.best = c;
        job.bestS = s;
      }
    }
    return !job.checking.length;
  }
  while (job.cands.length && performance.now() - t0 < budget) {
    const c = job.cands.pop(),
      s = job.evalFn(c);
    if (s > job.bestS) {
      job.bestS = s;
      job.best = c;
    }
    if (job.verify) {
      job.top.push({ c, s });
      job.top.sort((a, b) => b.s - a.s);
      job.top.length = Math.min(job.top.length, job.verify);
    }
  }
  if (!job.cands.length && job.refine > 0 && job.best) {
    const { id, s } = job.best,
      a0 = Math.atan2(s.dy, s.dx);
    for (let i = 0; i < job.refine; i++) {
      const a = a0 + gauss() * 0.012;
      job.cands.push({
        id,
        s: {
          ...s,
          dx: Math.cos(a),
          dy: Math.sin(a),
          p: clamp(s.p * (1 + gauss() * 0.06), 0.03, 1),
        },
      });
    }
    job.refine = 0;
  }
  if (!job.cands.length && job.verify && job.top.length) {
    job.checking = job.top.map((t) => t.c);
    job.checkS = -Infinity;
    return false;
  }
  return !job.cands.length;
}

// The planned shot with the character's own wobble added. `wobble` grows when someone has had a few.
export function shaky(best, ai, wobble = 1) {
  const sa = ai.angle * wobble,
    a = Math.atan2(best.s.dy, best.s.dx) + gauss() * sa;
  return {
    dx: Math.cos(a),
    dy: Math.sin(a),
    p: clamp(best.s.p * (1 + gauss() * ai.power * wobble), 0.03, 1),
    sx: clamp((best.s.sx || 0) + gauss() * sa * 3, -1, 1),
    sy: clamp((best.s.sy || 0) + gauss() * sa * 3, -1, 1),
  };
}
