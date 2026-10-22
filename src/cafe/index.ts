// The café round the table: built once, repainted per venue, alive every frame.
import { THREE } from "../render/three";
import { S, toScreen } from "../render/renderer";
import { camS, lookingDown } from "../render/camera";
import { smoke, stepSmoke, emit, setSmoke } from "../render/smoke";
import { COLORS } from "../core/table";
import { PL, playerFig, updatePlayer, type Aim, type Mine } from "../people/player";
import { animateFigure } from "../people/animate";
import { venueById, type Prop } from "../data/venues";
import { buildRoom, paintRoom } from "./room";
import { buildLamps, tintLamps } from "./lamps";
import { buildBar } from "./bar";
import { buildBooths, buildJukebox } from "./booths";
import { buildBoards } from "./boards";
import { buildRailProps, refill } from "./props";
import { buildViewmodel, animateViewmodel } from "./viewmodel";
import { buildProp, animateVenue, paintBanners } from "./venue-props";
import { tintMoreProps } from "./more-props";
import { C, rnd } from "./state";
import { setGuests as seat, animateGuests } from "./guests";
import type { Color, Game } from "../types";
import { t } from "../i18n";

export { C } from "./state";
/** the regulars you beat, at the bar of your own café (an empty list in anyone else's) */
export const setGuests = (who: Parameters<typeof seat>[1]): void => seat(scene, who);
export { emote, type Emote } from "./emote";
export { updateBoards, fontsChanged } from "./boards";

let scene: THREE.Scene;

export function buildCafe(sc: THREE.Scene): void {
  scene = sc;
  const room = buildRoom(sc);
  buildLamps(sc);
  C.groups.bar = buildBar(sc);
  C.groups.booths = buildBooths(sc);
  C.groups.jukebox = buildJukebox(sc);
  buildBoards(room);
  buildRailProps(sc);
  buildViewmodel();
  setVenue("golden"); // the start screen until the profile says which bar is home
}

/** repaint the room and swap the props for a venue */
export function setVenue(id: string): void {
  const v = venueById(id);
  if (C.venue?.id === v.id) return;
  C.venue = v;
  paintRoom(v);
  tintLamps(v.shade, v.neon);
  for (const k of Object.keys(C.groups) as Prop[]) C.groups[k]!.visible = v.props.includes(k);
  for (const k of v.props)
    if (!C.groups[k]) {
      const g = buildProp(k, scene);
      if (g) C.groups[k] = g;
    }
  if (v.banner) paintBanners(v.banner);
  tintMoreProps(v);
  setSmoke(v.smoke, v.props.includes("bubbles"));
}

export interface CafeCtx {
  G: Game | null;
  /** the colour whose end the camera sits behind */
  vc: Color;
  aim: Aim | null;
  smoke: number;
  mine: Mine;
  say: (who: string, text: string) => void;
}

const fogBase = new THREE.Color(),
  fogSmoke = new THREE.Color(0x544a3e);

export function updateCafe(dt: number, now: number, ctx: CafeCtx): void {
  const { G, vc, aim } = ctx,
    lv = ctx.smoke;
  smoke.level = lv;
  // a room full of smoke: the far end goes hazy
  const fog = S.scene.fog as THREE.Fog;
  fog.near = 4.5 - 3.4 * lv;
  fog.far = 12 - 8.4 * lv;
  fog.color.copy(fogBase.set(C.venue!.fog)).lerp(fogSmoke, lv * 0.8);
  C.lamps!.visible = C.overhead!.visible = !(
    camS.mode === "top" ||
    (camS.mode === "free" && lookingDown()) ||
    (camS.mode === "replay" && camS.replay?.high)
  );
  if (G)
    for (const c of COLORS) {
      const F = playerFig(c, G.colorOf);
      animateFigure(F, dt, now);
      updatePlayer(F, c, aim, dt, now, (camS.mode === "player" || camS.mode === "free") && c === vc && ctx.mine);
      const P = C.props[c];
      if (P.refillAt && now > P.refillAt) {
        P.refillAt = 0;
        refill(c, 1);
        ctx.say("Marcel", t("Another one for {name}, on the house.", { name: G.names[G.colorOf.indexOf(c)] }));
      }
    }
  if (C.groups.booths?.visible)
    for (const F of C.patrons) {
      if (!F.idleKind) F.idleKind = F.cigar?.visible ? "cigar" : "glass";
      F.keep = true;
      animateFigure(F, dt, now);
    }
  const bt = C.bartender;
  if (bt && C.groups.bar?.visible) {
    bt.phase += dt;
    bt.r.sh.rotation.x = -1.1 + Math.sin(bt.phase * 2.2) * 0.25;
    bt.r.el.rotation.x = -1.2;
    bt.head.rotation.y = Math.sin(bt.phase * 0.3) * 0.6;
  }
  animateGuests(dt, now);
  animateViewmodel(now);
  animateVenue(now / 1000);
  smokeSources(dt);
  stepSmoke(dt);
}

/** lit cigars in ashtrays and in the regulars' hands */
function smokeSources(dt: number): void {
  for (const t of C.ashtrays) {
    if (!t.lit || performance.now() > t.litUntil || !t.g.parent?.visible) {
      t.lit = t.lit && performance.now() <= t.litUntil;
      t.tip.visible = t.lit;
      if (!t.lit || !t.g.parent?.visible) continue;
    }
    t.next -= dt;
    if (t.next < 0) {
      t.next = 0.09;
      const p = t.tip.getWorldPosition(new THREE.Vector3());
      emit(p.x, p.y + 0.01, p.z, rnd(-0.01, 0.01), rnd(0.06, 0.1), rnd(-0.01, 0.01), 3.2, 0.012, 0.16, 0.22);
    }
  }
  if (C.groups.booths?.visible)
    for (const F of C.patrons)
      if (F.cigar?.visible && Math.random() < dt * 8) {
        const p = F.cigar.tip.getWorldPosition(new THREE.Vector3());
        emit(p.x, p.y, p.z, rnd(-0.01, 0.01), 0.08, rnd(-0.01, 0.01), 3, 0.012, 0.15, 0.2);
      }
}

/** where to put a speech bubble over a player's head */
export function headScreen(c: Color): { x: number; y: number; behind: boolean } | null {
  const F = PL.figs[c];
  if (!F || !F.g.visible) return null;
  return toScreen(F.head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.26, 0)));
}
