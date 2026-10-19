// A regular's strengths and weaknesses, shown when you pick them in the story or in freeplay. Every row has room for
// two lines, so switching between regulars never moves the page.
import type { Opponent } from "../types";
import { esc } from "./dom";
import { t } from "../i18n";

export function scoutHtml(o: Opponent | null): string {
  const col = (kind: "strong" | "weak", title: string) =>
    `<div class="c-scout__col c-scout__col--${kind}"><b class="c-scout__title">${title}</b><ul class="c-scout__list">${(
      o?.[kind] || ["???", "???"]
    )
      .map((x) => `<li class="c-scout__item">${esc(t(x))}</li>`)
      .join("")}</ul></div>`;
  return `<div class="c-scout">${col("strong", t("Strengths"))}${col("weak", t("Weaknesses"))}</div>`;
}
