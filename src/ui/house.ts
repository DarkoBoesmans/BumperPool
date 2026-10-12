// The house rules page in freeplay: match length, the book's fouls on or off, and a couple of custom rules.
import { REGLEMENT, RULE_SWITCHES, sameRules } from "../core/rules";
import type { Rules } from "../types";
import { $, $$, esc } from "./dom";
import { app, saveSettings } from "./app";
import { views } from "./menu";

/** how the freeplay button sums up the rules */
function houseLabel(): string {
  const h = app.set.house;
  if (sameRules(h, REGLEMENT)) return "House rules: by the book";
  const n = (Object.keys(REGLEMENT) as (keyof Rules)[]).filter((k) => h[k] !== REGLEMENT[k]).length;
  return `House rules: ${n} changed`;
}

function draw(): void {
  const h = app.set.house;
  for (const b of $$<HTMLButtonElement>("[data-games]"))
    b.setAttribute("aria-checked", String(Number(b.dataset.games) === h.games));
  $("#ruleList").innerHTML = RULE_SWITCHES.map(
    (r) => `<button class="c-toggle" type="button" role="switch" data-rule="${r.key}" aria-checked="${h[r.key]}">
      <span class="c-toggle__text"><b class="c-toggle__title">${r.custom ? "Custom: " : ""}${esc(r.title)}</b
      ><small class="c-toggle__desc">${esc(r.desc)}</small></span><i class="c-toggle__switch"></i></button>`,
  ).join("");
  for (const b of $$<HTMLButtonElement>("[data-rule]"))
    b.addEventListener("click", () => {
      const k = b.dataset.rule as keyof Omit<Rules, "games">;
      app.set.house = { ...h, [k]: !h[k] };
      changed();
    });
}
function changed(): void {
  saveSettings();
  draw();
  $("#btnRules .c-btn__label").textContent = houseLabel();
}

export function initHouse(): void {
  views.rules = draw;
  for (const b of $$<HTMLButtonElement>("[data-games]"))
    b.addEventListener("click", () => {
      app.set.house = { ...app.set.house, games: Number(b.dataset.games) as Rules["games"] };
      changed();
    });
  $("#ruleBook").addEventListener("click", () => {
    app.set.house = { ...REGLEMENT };
    changed();
  });
  $("#btnRules .c-btn__label").textContent = houseLabel();
}
