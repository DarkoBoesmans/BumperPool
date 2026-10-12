// Ball physics with spin. Values for carom balls (61.5 mm, 212 g) on Simonis 300 cloth:
// sliding friction 0.2, rolling resistance 0.01, spin friction 0.44 R, ball-ball friction 0.05 and restitution 0.95,
// cushion restitution about 0.85 that drops a little for hard hits, rubber post rings a bit softer.
// Each ball has velocity (vx, vy) and angular velocity (wx, wy, wz) in the frame (table x, up, table y).
// It slides until the cloth turns its spin into rolling (the 2/7 rule), then rolls. Side spin (wy) acts on cushions,
// posts and other balls (throw).
import type { Ball, Hit, Shot } from "../types";
import { R, HX, HY, DOPS, DOP_R, GOAL_X } from "./table";
import { G, SIM, hooks, sfx } from "./state";
import { SLIDE_DECEL, ROLL_DECEL, GRAV, SPIN_MAX, speedOf } from "./power";

const SPIN_DECAY = (5 * 0.444 * R * 0.001 * GRAV) / (2 * R); // side spin dies at about 11 rad/s²
const E_BALL = 0.95,
  MU_BALL = 0.05,
  // ponytail: chalk on the contact triples the grip, a guess from the "kick" players describe; tune if it is too wild
  MU_CHALK = 0.15;
const MU_BAND = 0.15,
  E_POST = 0.75,
  MU_POST = 0.2;
// Contact height above the ball centre. The push lands above the centre, so it twists rolling spin backwards and the
// ball leaves a cushion still rolling instead of dying. Cushion nose 37 mm (carom norm, same 61.5 mm ball): 6.25 mm.
// Post ring 35 to 45 mm, a round rubber ring touches the ball near 38.7 mm: 8 mm.
// ponytail: two calibration knobs, raise them if balls still die off the rubber, lower them if they run on too far.
const HZ_BAND = 37 - R,
  HZ_POST = 8;
const eBand = (vn: number): number => Math.max(0.7, Math.min(0.86, 0.88 - 0.04 * (vn / 1000)));
const STOP = 3; // mm/s: below this a rolling ball has stopped

// The goal: a ball whose centre gets within CAPTURE of the hole's centre drops, unless it skims across too fast.
// It drops when it stays over the hole for at least T_FALL, or when it is heading into the lip behind the hole.
const CAPTURE = 30,
  T_FALL = 0.035,
  LIP_COS = Math.cos((75 * Math.PI) / 180);

function hit(b: Ball, info: Omit<Hit, "t" | "x" | "y">): void {
  const s = G.stroke;
  if (!s) return;
  if (!s.first[b.id]) s.first[b.id] = { ...info, t: G.simT, x: b.x, y: b.y };
  if (b.id === s.shooter) s.touches++;
}

/** contact with a cushion or post: n points from the ball centre to the contact, vn > 0 is the approach speed,
 * hz is how far above the ball centre the contact sits */
function bounce(b: Ball, nx: number, ny: number, vn: number, e: number, mu: number, hz = 0): void {
  const jn = (1 + e) * vn;
  b.vx -= jn * nx;
  b.vy -= jn * ny;
  const k = (2.5 * hz * jn) / (R * R); // the push above the centre turns the ball against its roll
  b.wx -= k * ny;
  b.wz += k * nx;
  const tx = -ny,
    ty = nx,
    slip = b.vx * tx + b.vy * ty - R * b.wy; // the contact point sliding along the cushion
  const jt = -Math.max(-mu * jn, Math.min(mu * jn, slip / 3.5));
  b.vx += jt * tx;
  b.vy += jt * ty;
  b.wy -= (2.5 * jt) / R;
}

/** two balls, equal mass: the normal impulse swaps speed, friction at the contact throws the object ball a little */
function collide(a: Ball, b: Ball, nx: number, ny: number, rel: number): void {
  if (a.stone || b.stone) {
    // a stone ball is as fixed as a post
    const m = a.stone ? b : a,
      s = a.stone ? 1 : -1; // n points from b to a: towards the stone for b, away from it for a
    bounce(m, s * nx, s * ny, -rel, E_BALL, MU_BALL);
    return;
  }
  const jn = (-(1 + E_BALL) * rel) / 2,
    mu = a.chalk || b.chalk ? MU_CHALK : MU_BALL;
  a.chalk = b.chalk = false; // the dust is gone after one contact
  const tx = -ny,
    ty = nx;
  const st = (a.vx - b.vx) * tx + (a.vy - b.vy) * ty + R * (a.wy + b.wy);
  const sv = R * ((a.wx + b.wx) * ny - (a.wz + b.wz) * nx); // follow and draw rub vertically, which leaves less grip sideways
  const slip = Math.hypot(st, sv);
  let jt = 0;
  if (slip > 1e-6) jt = slip / 7 <= mu * jn ? -st / 7 : (-mu * jn * st) / slip;
  a.vx += jn * nx + jt * tx;
  a.vy += jn * ny + jt * ty;
  b.vx -= jn * nx + jt * tx;
  b.vy -= jn * ny + jt * ty;
  a.wy += (2.5 * jt) / R;
  b.wy += (2.5 * jt) / R;
}

export function strike(b: Ball, s: Shot): void {
  const v0 = speedOf(s.p),
    k = (2.5 * v0) / R,
    a = (s.sx || 0) * SPIN_MAX,
    h = (s.sy || 0) * SPIN_MAX;
  b.stone = false;
  b.chalk = !!s.chalk;
  b.vx = s.dx * v0;
  b.vy = s.dy * v0;
  b.wy = k * a; // tip right of centre (as the shooter sees it): right english
  b.wx = k * h * s.dy; // tip above centre: follow, below: draw
  b.wz = -k * h * s.dx;
}

function cloth(b: Ball, dt: number): void {
  const ux = b.vx + R * b.wz,
    uy = b.vy - R * b.wx,
    us = Math.hypot(ux, uy),
    dv = SLIDE_DECEL * dt;
  if (us > 1) {
    const k = Math.min(1, us / (3.5 * dv)),
      ax = (-ux / us) * dv * k,
      ay = (-uy / us) * dv * k;
    b.vx += ax;
    b.vy += ay;
    b.wx -= (2.5 / R) * ay;
    b.wz += (2.5 / R) * ax;
  } else {
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > 0) {
      const ns = sp - ROLL_DECEL * dt;
      if (ns < STOP) {
        b.vx = b.vy = 0;
        b.wy = 0;
      } else {
        b.vx *= ns / sp;
        b.vy *= ns / sp;
      }
    }
    b.wx = b.vy / R;
    b.wz = -b.vx / R;
  }
  if (b.wy) b.wy -= Math.sign(b.wy) * Math.min(Math.abs(b.wy), SPIN_DECAY * dt);
}

function cushions(b: Ball): void {
  const walls: [boolean, number, number, number, "x+" | "x-" | "y+" | "y-"][] = [
    [b.x > HX - R, 1, 0, b.vx, "x+"],
    [b.x < -HX + R, -1, 0, -b.vx, "x-"],
    [b.y > HY - R, 0, 1, b.vy, "y+"],
    [b.y < -HY + R, 0, -1, -b.vy, "y-"],
  ];
  for (const [past, nx, ny, vn, side] of walls) {
    if (!past) continue;
    if (nx) b.x = nx * (HX - R);
    else b.y = ny * (HY - R);
    if (vn > 0) {
      sfx("band", vn / 2000);
      hit(b, { type: "band", side });
      bounce(b, nx, ny, vn, eBand(vn), MU_BAND, HZ_BAND);
    }
  }
}

function posts(b: Ball): void {
  for (const d of DOPS) {
    const dx = d.x - b.x,
      dy = d.y - b.y,
      dist = Math.hypot(dx, dy),
      min = R + DOP_R;
    if (dist >= min || dist === 0) continue;
    const nx = dx / dist,
      ny = dy / dist;
    b.x = d.x - nx * min;
    b.y = d.y - ny * min;
    const vn = b.vx * nx + b.vy * ny;
    if (vn > 0) {
      sfx("dop", vn / 1800);
      hit(b, { type: "dop" });
      bounce(b, nx, ny, vn, E_POST, MU_POST, HZ_POST);
    }
  }
}

function goals(b: Ball): void {
  for (const h of [1, -1]) {
    const dx = b.x - h * GOAL_X,
      dy = b.y,
      d = Math.hypot(dx, dy);
    if (d >= CAPTURE) {
      if (b.skim === h && d > CAPTURE + 6) b.skim = 0;
      continue;
    }
    if (b.skim === h) continue;
    const v = Math.hypot(b.vx, b.vy);
    let drops = v < 1;
    if (!drops) {
      const intoLip = (b.vx * h) / v > LIP_COS,
        perp = Math.abs(dx * b.vy - dy * b.vx) / v,
        chord = 2 * Math.sqrt(Math.max(0, CAPTURE * CAPTURE - perp * perp));
      drops = intoLip || chord / v >= T_FALL;
    }
    if (!drops) {
      // too fast across the hole: it dips, knocks the far rim and carries on
      b.skim = h;
      b.vx *= 0.82;
      b.vy *= 0.82;
      sfx("rim", v / 2000);
      continue;
    }
    b.on = false;
    b.vx = b.vy = b.wx = b.wy = b.wz = 0;
    b.potN = ++G.potN;
    sfx(v > 1200 ? "lip" : "pot", 1);
    G.stroke?.pots.push({ id: b.id, c: b.c, h, t: G.simT, x: b.x, y: b.y });
    return;
  }
}

export function step(dt: number): void {
  const B = G.balls.filter((b) => b.on);
  G.simT += dt;
  for (const b of B) {
    if (b.stone) continue;
    cloth(b, dt);
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }
  for (const b of B) {
    if (b.stone) continue;
    cushions(b);
    posts(b);
  }
  for (let i = 0; i < B.length; i++)
    for (let j = i + 1; j < B.length; j++) {
      const a = B[i],
        b = B[j],
        dx = a.x - b.x,
        dy = a.y - b.y,
        dist = Math.hypot(dx, dy);
      if (dist >= 2 * R || dist === 0) continue;
      const nx = dx / dist,
        ny = dy / dist,
        ov = 2 * R - dist;
      if (a.stone) {
        b.x -= nx * ov;
        b.y -= ny * ov;
      } else if (b.stone) {
        a.x += nx * ov;
        a.y += ny * ov;
      } else {
        a.x += (nx * ov) / 2;
        a.y += (ny * ov) / 2;
        b.x -= (nx * ov) / 2;
        b.y -= (ny * ov) / 2;
      }
      const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (rel < 0) {
        sfx("ball", -rel / 1800);
        collide(a, b, nx, ny, rel);
        hit(a, { type: "ball", id: b.id });
        hit(b, { type: "ball", id: a.id });
      }
    }
  for (const b of B) if (b.on && !b.stone) goals(b);
  if (!SIM) hooks.frame();
}

export const allStill = (): boolean =>
  G.balls.every((b) => !b.on || (b.vx === 0 && b.vy === 0 && b.wx === 0 && b.wz === 0));
