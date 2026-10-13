// Five grades of three regulars, plus a secret sixth. The better they are, the less the game helps you:
// help.lines = lines on the cloth, aim = aim line length in mm, ghost = ghost ball, obj = where a hit ball goes, warn = foul warnings.
// felt: the cloth colour against this grade. prize: tokens for beating one of them.
import type { Grade } from "../types";
import { t } from "../i18n";

export const GRADES: Grade[] = [
  {
    id: "common",
    label: "Common",
    color: "#b6bcb4",
    bg: "#1d211c",
    felt: "#23897a",
    help: { lines: 1, aim: Infinity, ghost: 1, obj: 1, warn: 1 },
    prize: 20,
  },
  {
    id: "uncommon",
    label: "Uncommon",
    color: "#5fd16f",
    bg: "#132416",
    felt: "#2a8540",
    help: { lines: 1, aim: Infinity, ghost: 1, obj: 0, warn: 1 },
    prize: 30,
  },
  {
    id: "rare",
    label: "Rare",
    color: "#4f97ff",
    bg: "#111a2c",
    felt: "#21609e",
    help: { lines: 1, aim: 600, ghost: 1, obj: 0, warn: 1 },
    prize: 45,
  },
  {
    id: "epic",
    label: "Epic",
    color: "#b46bff",
    bg: "#1d1229",
    felt: "#5a3a8e",
    help: { lines: 0, aim: 250, ghost: 0, obj: 0, warn: 0 },
    prize: 70,
  },
  {
    id: "legendary",
    label: "Legendary",
    color: "#ff9b2e",
    bg: "#2a1a0a",
    felt: "#a4521b",
    help: { lines: 0, aim: 0, ghost: 0, obj: 0, warn: 0 },
    prize: 100,
  },
  {
    id: "pearl",
    label: "Pearlescent",
    color: "#a8e6ff",
    bg: "#162630",
    felt: "#5f9fb6",
    secret: true,
    help: { lines: 0, aim: 0, ghost: 0, obj: 0, warn: 0 },
    prize: 150,
  },
];
export const FULL_HELP = GRADES[0].help;
export function helpText(g: Grade): string {
  const h = g.help;
  if (!h.aim && !h.lines) return t("No help: no lines on the cloth, no aim line, no warnings");
  return [
    h.lines && t("lines on the cloth"),
    h.aim === Infinity ? t("full aim line") : h.aim ? t("short aim line") : "",
    h.ghost && t("ghost ball"),
    h.obj && t("where the hit ball goes"),
    h.warn && t("foul warnings"),
  ]
    .filter(Boolean)
    .join(", ")
    .replace(/^./, (c) => c.toUpperCase());
}
