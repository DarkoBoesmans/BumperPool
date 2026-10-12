// The two players: a figure at each home end that walks round to the ball, leans over the rail and holds the cue.
// Arms are solved with two-bone IK: the left hand makes the bridge, the right hand holds the butt.
// Your own figure can be shown, see-through or hidden while you play (Settings), and always shows in replays and top view.
import { THREE, M, FLOOR } from "../render/three";
import { S } from "../render/renderer";
import { AIM, pullOf } from "../render/aim";
import { home } from "../core/table";
import { figure, type Figure } from "./figure";
import { reach, UP, clampv } from "./ik";
import { waypoint, cueLine, stance, walkTo } from "./walk";
import { crawlStep, type Crawl } from "./crawl";
import type { Color, Look, Point, Shot } from "../types";
import type { CueLook } from "../data/shop";

export interface Player extends Figure {
  key: string;
  cue: THREE.Group;
  pos: THREE.Vector3;
  yaw: number;
  blend: number;
  walk: number;
  step: number;
  op: number;
  st: {
    pos: THREE.Vector3;
    yaw: number;
    back: number;
    b: Point;
    s: Shot;
    drawn: boolean;
    live: boolean;
    t: number;
  } | null;
  atStance: boolean;
  cr: Crawl | null;
}
export interface Aim {
  b: Point & { c: Color };
  s: Shot;
  drawn: boolean;
}
export type Mine = "show" | "fade" | "hide";

const DEFAULT_LOOKS: Look[] = [
  {
    skin: "#e2ae8c",
    shirt: "#26262c",
    trim: "#c9a35b",
    pants: "#17171b",
    hair: "#2a1a12",
    hairStyle: "short",
    hat: "none",
    build: 1,
  },
  {
    skin: "#d9a585",
    shirt: "#36533f",
    trim: "#e9dfc8",
    pants: "#221d19",
    hair: "#4a3020",
    hairStyle: "short",
    hat: "flatcap",
    hatColor: "#4a3a2a",
    facial: "stache",
    build: 1.05,
  },
];
export const PL = {
  figs: {} as Partial<Record<Color, Player>>,
  looks: [] as (Look | null)[],
  cues: [] as (CueLook | null)[],
};

export function setPlayers(looks: (Look | null)[], cues: (CueLook | null)[] = []): void {
  for (const F of Object.values(PL.figs)) F?.g.parent?.remove(F.g);
  PL.figs = {};
  PL.looks = looks.map((l, i) => l || DEFAULT_LOOKS[i]);
  PL.cues = cues;
}

function tintCue(g: THREE.Group, c: CueLook | null): void {
  if (!c) return;
  const mats = g.children.map((m) => (m as THREE.Mesh).material as THREE.MeshPhongMaterial);
  mats[0].color.set(c.shaft);
  mats[1].color.set(c.butt);
  mats[2].color.set(c.ring);
}

export function playerFig(c: Color, colorOf: Color[]): Player {
  const p = colorOf.indexOf(c),
    key = c + p;
  let F = PL.figs[c];
  if (F && F.key === key) return F;
  if (F) F.g.parent?.remove(F.g);
  const base = figure(PL.looks[p] || DEFAULT_LOOKS[p], "stand");
  S.scene.add(base.g);
  base.g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.material) m.material = (m.material as THREE.Material).clone();
  }); // own materials, so this figure can fade on its own
  const cue = AIM.cue.clone();
  cue.visible = true;
  cue.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.material) m.material = (m.material as THREE.Material).clone();
  });
  tintCue(cue, PL.cues[p] || null);
  base.g.add(cue);
  const h = home(c),
    pos = new THREE.Vector3(h * 1.85, 0, -h * 1.0);
  F = Object.assign(base, {
    key,
    cue,
    pos,
    yaw: Math.atan2(-pos.x, -pos.z),
    blend: 0,
    walk: 0,
    step: 0,
    op: 1,
    st: null,
    atStance: false,
    cr: null,
  });
  PL.figs[c] = F;
  return F;
}

function placeCue(F: Player, pos: THREE.Vector3, quat: THREE.Quaternion): void {
  F.cue.position.copy(F.g.worldToLocal(pos.clone()));
  F.cue.quaternion.copy(F.g.quaternion).invert().multiply(quat);
}

const _q = new THREE.Quaternion(),
  _b = new THREE.Vector3();

export function updatePlayer(F: Player, c: Color, aim: Aim | null, dt: number, now: number, mine: Mine | false): void {
  if (F.cr && crawlStep(F, dt)) return;
  const live = aim && aim.b.c === c;
  if (live)
    F.st = {
      ...stance(aim.b, aim.s),
      b: { x: aim.b.x, y: aim.b.y },
      s: { ...aim.s },
      drawn: aim.drawn,
      live: true,
      t: now,
    };
  else if (F.st?.live) {
    // the shot went: hold the follow-through a moment
    F.st.live = false;
    F.st.t = now;
    F.st.drawn = false;
    F.st.s.p = -0.45;
  }
  const inSt = !!F.st && (F.st.live || now - F.st.t < 1300);
  const h = home(c),
    goal = inSt ? F.st!.pos : new THREE.Vector3(h * 1.85, 0, -h * 1.0),
    goalYaw = inSt ? F.st!.yaw : Math.atan2(-goal.x, -goal.z);
  // walk round the table
  const wp = waypoint(F.pos, goal),
    moving = walkTo(F.pos, wp, 2.4 * dt) > 0.03;
  const near = F.pos.distanceTo(goal) < 0.05,
    wantYaw = moving && !near ? Math.atan2(wp.x - F.pos.x, wp.z - F.pos.z) : goalYaw;
  let dy = wantYaw - F.yaw;
  dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  F.yaw += dy * Math.min(1, dt * 9);
  F.walk += ((moving ? 1 : 0) - F.walk) * Math.min(1, dt * 8);
  F.blend += ((inSt && near ? 1 : 0) - F.blend) * Math.min(1, dt * 6);
  F.atStance = inSt && F.st!.live && F.blend > 0.85;
  F.g.position.set(F.pos.x, FLOOR, F.pos.z);
  F.g.rotation.y = F.yaw;
  // legs and pose
  F.step += dt * 9 * F.walk;
  F.hips[0].rotation.x = Math.sin(F.step) * 0.5 * F.walk;
  F.hips[1].rotation.x = -Math.sin(F.step) * 0.5 * F.walk;
  const k = F.blend,
    lean = inSt ? clampv(0.62 + (F.st!.back - 0.98) * 0.5, 0.62, 1.0) : 0.62;
  F.torso.rotation.set(lean * k, -0.32 * k, 0);
  F.head.rotation.x = -0.75 * k;
  F.head.rotation.y *= 1 - k;
  F.l.sh.rotation.set(-0.35 + Math.sin(F.step) * 0.3 * F.walk, 0, 0.1);
  F.l.el.rotation.set(-0.55, 0, 0); // the left hand carries the cue upright
  F.g.updateMatrixWorld(true);
  if (k > 0.01 && F.st) {
    const st = F.st,
      { tip, axis } = cueLine(st.b, st.s),
      pull = pullOf(st.s.p) * M * 1.02;
    const fwd = new THREE.Vector3(Math.sin(F.yaw), 0, Math.cos(F.yaw)),
      right = fwd.clone().cross(UP);
    const sb = clampv(st.back - 0.8, 0.22, 0.6),
      bridge = tip
        .clone()
        .addScaledVector(axis, -sb)
        .add(new THREE.Vector3(0, -0.03, 0));
    const grip = tip.clone().addScaledVector(axis, -(pull + 1.12));
    reach(
      F.l,
      bridge,
      right.clone().negate().multiplyScalar(0.8).addScaledVector(UP, 0.35).addScaledVector(fwd, -0.2),
      k,
    );
    reach(F.r, grip, UP.clone().multiplyScalar(0.7).addScaledVector(fwd, -0.4).addScaledVector(right, 0.45), k);
    F.g.updateMatrixWorld(true);
  }
  // the cue: in the hands at the table (unless the aiming cue is already drawn there), upright in the left hand otherwise
  if (k > 0.5 && F.st) {
    F.cue.visible = !F.st.drawn;
    const { tip, axis } = cueLine(F.st.b, F.st.s),
      pull = pullOf(F.st.s.p) * M * 1.02;
    placeCue(F, tip.addScaledVector(axis, -pull), _q.setFromUnitVectors(UP, axis));
  } else {
    F.cue.visible = true;
    placeCue(F, F.l.hand.getWorldPosition(new THREE.Vector3()).add(_b.set(0, 0.66, 0)), _q.identity());
  }
  fade(F, mine, dt);
}

/** your own figure while you play: see-through only when it stands close to the camera, where it would block the table */
function fade(F: Player, mine: Mine | false, dt: number): void {
  const cam = S.camera.position,
    close = Math.hypot(F.pos.x - cam.x, F.pos.z - cam.z) < 1.5,
    want = mine === "hide" ? 0 : mine === "fade" && close ? 0.22 : 1;
  if (Math.abs(want - F.op) <= 0.005) return;
  F.op += (want - F.op) * Math.min(1, dt * 8);
  if (Math.abs(want - F.op) < 0.01) F.op = want;
  F.g.visible = F.op > 0.01;
  F.g.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | undefined;
    if (!m) return;
    const u = m.userData;
    if (u.op === undefined) {
      u.op = m.opacity;
      u.tr = m.transparent;
      u.dw = m.depthWrite;
    }
    m.opacity = F.op * u.op;
    m.transparent = u.tr || F.op < 0.99;
    m.depthWrite = F.op < 0.99 ? false : u.dw;
  });
}

export const figurePos = (c: Color): THREE.Vector3 | undefined => PL.figs[c]?.g.position;
