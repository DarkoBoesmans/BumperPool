// Plain-words explanations, used by the log, the replay card, the wall board and the tutorial.
import type { FoulKey } from "../types";

const HARD_WORDS = "faster than 1.5 m/s, enough to run more than three table lengths";

export const FOULS: Record<FoulKey, { code: string; title: string; why: string }> = {
  own: {
    code: "SP/8.1",
    title: "Own ball first",
    why: "Your cue ball touched one of your own balls before anything else. You must bounce off a cushion, a post or an opponent's ball first, otherwise you could simply push your own balls to the goal.",
  },
  hard: {
    code: "SP/7.4",
    title: "Hard shot at goal from the corner",
    why: `This ball lay below the shooting line, clear of it, in the corner next to the goal, and went straight for the goal hard. From there a direct goal attempt must be soft. Hard means ${HARD_WORDS}. Playing it hard at a ball or off a cushion is fine, and the small triangle right in front of the goal allows a hard shot at goal.`,
  },
  fly: {
    code: "SP/6.7",
    title: "Flying along the cushion",
    why: `This ball lay in the 92 mm strip along a long cushion (touching the line counts) and was played hard (${HARD_WORDS}) into or along that cushion. That is a flyer, and flyers are not allowed. Hard away from the cushion, into the table, is fine.`,
  },
  tri: {
    code: "SP/9",
    title: "Parked in the triangle",
    why: "This ball lay in the big triangle in front of the goal when the turn began, and it never left during the turn. A ball may only stay there until your next turn if the last shot of a turn put it there. On the line counts as inside.",
  },
  small: {
    code: "SP/9.5",
    title: "Parked in front of a guarded goal",
    why: "Your opponent guards this goal with a ball in the small triangle. While it stays there after your shot, your ball may not end up in the big triangle. On the line counts as inside.",
  },
  frame: {
    code: "SP/10",
    title: "No ball left its frame",
    why: "Frame play: a player is down to one ball, so every shot must send at least one ball out of the frame it lay in. The lines on the cloth mark the 15 frames. A ball on a line leaves its frame by leaving the line, and a ball that drops into a goal has left too. From the attack triangle you need not change frames.",
  },
  wrong: {
    code: "SP/7.2",
    title: "Wrong goal",
    why: "Your balls only count in the goal at the far end, the one with the ring in your colour. This one dropped into the goal behind you.",
  },
  open: {
    code: "SP/5.1",
    title: "Bad opening shot",
    why: "The opening ball has to hit your own left cushion first, before anything else.",
  },
  time: {
    code: "SP/3.2",
    title: "Out of time",
    why: "You get one minute per shot. The clock ran out.",
  },
};
export const PENALTY = "Turn over. Moved balls go back and the ball goes to a penalty spot.";
