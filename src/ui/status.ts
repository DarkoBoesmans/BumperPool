// The ribbon under the scoreboard: who is up and what to do.
import { G, ball, nameOf } from "../core/state";
import { COL, other } from "../core/table";
import { pick } from "../data/regulars";
import { t } from "../i18n";
import { app, canAct } from "./app";
import type { Color } from "../types";

export function statusText(): [string, string] {
  const c = G.turn,
    opp = app.opp;
  const waitFor = (col: Color): [string, string] | null =>
    canAct(col)
      ? null
      : G.mode === "cpu"
        ? [
            t("{name} is lining up", { name: nameOf(col) }),
            t(pick(["Studying the angles.", "Chalking the cue.", opp?.style || ""])),
          ]
        : [t("Waiting for {name}", { name: nameOf(col) }), t("Their shot appears here live.")];
  switch (G.phase) {
    case "openW":
      return (
        waitFor("W") || [
          t("Opening shot · {name} with white", { name: nameOf("W") }),
          t("Play the marked ball softly off your left cushion. It rolls once both players have aimed."),
        ]
      );
    case "openR":
      return (
        waitFor("R") || [
          t("Opening shot · {name} with red", { name: nameOf("R") }),
          t("Play the marked ball off your left cushion. Closest to their goal starts."),
        ]
      );
    case "moving":
      return [t("Rolling"), ""];
    case "wait":
      return [t("Checking the shot"), t("{name}'s table decides.", { name: nameOf(G.turn) })];
    case "aim": {
      const ti = G.turnInfo,
        stay = ti.obligated.filter((id) => !ti.left[id]).length;
      return (
        waitFor(c) || [
          t("{name} to play with {colour}", { name: nameOf(c), colour: t(COL[c]) }),
          t(
            stay
              ? "The ringed ball is in the big triangle: get it out or score it this turn, or it goes to a penalty spot."
              : G.framePlay
                ? "Frame play: send at least one ball out of its frame, the boxes drawn on the cloth."
                : "Press one of your balls and pull back: the further you pull, the harder. Let go to shoot.",
          ),
        ]
      );
    }
    case "penalty": {
      const b = ball(G.penChoice!.id),
        ch = other(b.c);
      return [
        t("{name} picks a penalty spot", { name: nameOf(ch) }),
        canAct(ch)
          ? t("For {name}'s ball. Tap spot 1 or 2 beside the goal posts.", { name: nameOf(b.c) })
          : t("Waiting for their choice."),
      ];
    }
    case "mancheEnd":
      return [
        t("{name} wins game {n}", { name: G.names[G.endWinner!], n: G.manche }),
        t("Colours swap for the next game."),
      ];
    case "matchEnd":
      return [
        t("{name} wins the match", { name: G.names[G.endWinner!] }),
        t("Final score {a}-{b} in games.", { a: G.wins[G.endWinner!], b: G.wins[1 - G.endWinner!] }),
      ];
  }
  return ["", ""];
}
