// After every change to the game: redraw the HUD, the cloth, the plaques and the wall boards, then maybe run the show.
import { G, nameOf } from "../core/state";
import { paintCloth, setFelt } from "../render/cloth";
import { setRail } from "../render/table";
import { setCueLook } from "../render/aim";
import { updatePlaques } from "../render/plaques";
import { updateBoards, C } from "../cafe";
import { GRADES } from "../data/grades";
import { findOpponent, gradeOf } from "../data/regulars";
import { itemById } from "../data/shop";
import { me } from "../profile/profile";
import { renderUI } from "../ui/hud";
import { app, help } from "../ui/app";
import { clothMarks } from "./aiming";
import { maybePresent } from "./show";

let dirty = false;
export function changed(): void {
  if (app.syncShown) {
    app.shown = G.lastShot?.n ?? -1;
    app.syncShown = false;
  }
  if (dirty) return;
  dirty = true;
  queueMicrotask(() => {
    dirty = false;
    refresh();
    maybePresent();
  });
}

export const boardCtx = () => ({
  G,
  opp: G?.mode === "cpu" ? app.opp : findOpponent("baron"),
  turnName: G ? nameOf(G.turn) : "",
  venue: C.venue!,
  shame: me.shame,
  pearl: me.pearl,
});

export function refresh(): void {
  renderUI();
  paintCloth({ ...clothMarks(), lines: app.set.lines && !!help().lines });
  updatePlaques(nameOf);
  updateBoards(boardCtx());
}

/** the table: in a regular's bar you play on their table (its cloth in the grade colour if that setting is on);
 * at home, in two-player and online games, on your own table from the shop */
export function applyLooks(): void {
  const cpu = G?.mode === "cpu" && app.opp;
  const table = cpu ? C.venue!.table : (itemById(me.equip.table)?.table ?? { rail: "#5a2414", cloth: GRADES[0].felt });
  setFelt(cpu && app.set.cloth ? gradeOf(app.opp!).felt : table.cloth);
  setRail(table.rail);
  const cue = itemById(me.equip.cue)?.cue;
  if (cue) setCueLook(cue);
}
