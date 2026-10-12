// The ribbon under the scoreboard: who is up and what to do.
import { G, ball, nameOf } from "../core/state";
import { COL, other } from "../core/table";
import { pick } from "../data/regulars";
import { app, canAct } from "./app";
import type { Color } from "../types";

export function statusText(): [string, string] {
  const c = G.turn,
    opp = app.opp;
  const waitFor = (col: Color): [string, string] | null =>
    canAct(col)
      ? null
      : G.mode === "cpu"
        ? [`${nameOf(col)} is lining up`, pick(["Studying the angles.", "Chalking the cue.", opp?.traits[0] || ""])]
        : [`Waiting for ${nameOf(col)}`, "Their shot appears here live."];
  switch (G.phase) {
    case "openW":
      return (
        waitFor("W") || [
          `Opening shot · ${nameOf("W")} with white`,
          "Play the marked ball softly off your left cushion. It rolls once both players have aimed.",
        ]
      );
    case "openR":
      return (
        waitFor("R") || [
          `Opening shot · ${nameOf("R")} with red`,
          "Play the marked ball off your left cushion. Closest to their goal starts.",
        ]
      );
    case "moving":
      return ["Rolling", ""];
    case "wait":
      return ["Checking the shot", `${nameOf(G.turn)}'s table decides.`];
    case "aim": {
      const ti = G.turnInfo,
        stay = ti.obligated.filter((id) => !ti.left[id]).length;
      return (
        waitFor(c) || [
          `${nameOf(c)} to play with ${COL[c]}`,
          stay
            ? "The ringed ball is in the big triangle: get it out or score it this turn, or it goes to a penalty spot."
            : "Press one of your balls and pull back: the further you pull, the harder. Let go to shoot.",
        ]
      );
    }
    case "penalty": {
      const b = ball(G.penChoice!.id),
        ch = other(b.c);
      return [
        `${nameOf(ch)} picks a penalty spot`,
        canAct(ch) ? `For ${nameOf(b.c)}'s ball. Tap spot 1 or 2 beside the goal posts.` : "Waiting for their choice.",
      ];
    }
    case "mancheEnd":
      return [`${G.names[G.endWinner!]} wins game ${G.manche}`, "Colours swap for the next game."];
    case "matchEnd":
      return [
        `${G.names[G.endWinner!]} wins the match`,
        `Final score ${G.wins[G.endWinner!]}-${G.wins[1 - G.endWinner!]} in games.`,
      ];
  }
  return ["", ""];
}
