// Freeplay: rematch any regular you have beaten. The others are silhouettes until you beat them in the story.
import { OPPONENTS, findOpponent, gradeOf } from "../data/regulars";
import { helpText } from "../data/grades";
import { venueById } from "../data/venues";
import { me, myName, visibleGrades } from "../profile/profile";
import { paintPortrait } from "../people/portrait";
import type { GradeId } from "../types";
import { REGLEMENT, sameRules } from "../core/rules";
import { $, esc, first } from "./dom";
import { app, saveSettings } from "./app";
import { views } from "./menu";
import { silhouette } from "./story";
import { scoutHtml } from "./scout";
import { t, lang } from "../i18n";

let pickId = findOpponent(app.set.opp).id;
let gradeId: GradeId = findOpponent(pickId).grade;
export const pickedOpponent = () => findOpponent(pickId);
export function pickOpponent(id: string): void {
  pickId = findOpponent(id).id;
  gradeId = findOpponent(pickId).grade;
}
export const roster = { challenge: (): void => {} };

export function renderRoster(): void {
  const tabs = $("#gradeTabs"),
    r = $("#roster"),
    grades = visibleGrades();
  if (!me.beaten[pickId]) {
    const any = OPPONENTS.find((o) => me.beaten[o.id] && o.grade === gradeId) || OPPONENTS.find((o) => me.beaten[o.id]);
    if (any) pickOpponent(any.id);
  }
  if (tabs.dataset.n !== grades.length + lang) {
    // built once, and again when Pearlescent shows up or the language changes
    tabs.dataset.n = grades.length + lang;
    tabs.innerHTML = grades
      .map(
        (g) =>
          `<button class="c-grade-tab c-grade-tab--${g.id}" type="button" role="tab" data-grade="${g.id}" style="--g:${g.color}"><i class="c-grade-tab__gem"></i><span>${esc(t(g.label))}</span><svg class="o-icon c-grade-tab__lock" aria-hidden="true"><use href="#i-lock"/></svg></button>`,
      )
      .join("");
    r.innerHTML = OPPONENTS.filter((o) => grades.some((g) => g.id === o.grade))
      .map(
        (o) =>
          `<button class="c-card c-card--${o.grade}" type="button" role="radio" data-opp="${o.id}" style="--g:${gradeOf(o).color}"><span class="c-card__face"><canvas class="c-card__canvas" width="64" height="64"></canvas></span><b class="c-card__name"><span class="c-card__first"></span> <span class="c-card__last"></span></b><span class="c-card__nick"></span><span class="c-card__stamp" aria-hidden="true">${esc(t("Beaten"))}</span></button>`,
      )
      .join("");
    for (const b of tabs.querySelectorAll<HTMLElement>("[data-grade]"))
      b.addEventListener("click", () => {
        gradeId = b.dataset.grade as GradeId;
        const o =
          OPPONENTS.find((x) => x.grade === gradeId && me.beaten[x.id]) || OPPONENTS.find((x) => x.grade === gradeId)!;
        pickId = o.id;
        renderRoster();
      });
    for (const card of r.querySelectorAll<HTMLElement>("[data-opp]")) {
      card.addEventListener("click", () => {
        pickId = card.dataset.opp!;
        renderRoster();
      });
      card.addEventListener("dblclick", () => me.beaten[card.dataset.opp!] && roster.challenge());
    }
  }
  for (const b of tabs.querySelectorAll<HTMLElement>("[data-grade]")) {
    const any = OPPONENTS.some((o) => o.grade === b.dataset.grade && me.beaten[o.id]);
    b.setAttribute("aria-selected", String(b.dataset.grade === gradeId));
    b.classList.toggle("is-locked", !any);
  }
  for (const c of r.querySelectorAll<HTMLElement>("[data-opp]")) {
    const o = findOpponent(c.dataset.opp),
      open = !!me.beaten[o.id],
      state = (open ? "open" : "locked") + lang;
    c.hidden = o.grade !== gradeId;
    c.setAttribute("aria-checked", String(o.id === pickId));
    c.classList.toggle("is-locked", !open);
    c.classList.toggle("is-beaten", open);
    if (c.dataset.state !== state) {
      c.dataset.state = state;
      const cv = $<HTMLCanvasElement>("canvas", c);
      if (open) paintPortrait(cv, o);
      else silhouette(cv, gradeOf(o).bg, gradeOf(o).color);
      const [fn, ...ln] = (open ? o.name : "???").split(" ");
      $(".c-card__first", c).textContent = fn;
      $(".c-card__last", c).textContent = ln.join(" ");
      $(".c-card__nick", c).textContent = open ? t(o.nick) : t("Beat them in the story");
    }
  }
  bio();
}

function bio(): void {
  const o = pickedOpponent(),
    g = gradeOf(o),
    open = !!me.beaten[o.id],
    el = $("#oppBio");
  el.style.setProperty("--g", g.color);
  const venue = venueById(o.venue);
  if (open)
    el.innerHTML = `<b class="c-bio__name">${esc(o.name)}</b>
      <p class="c-bio__head"><span class="c-bio__tag c-bio__tag--${g.id}">${esc(t(g.label))}</span><span class="c-bio__style">${esc(t(o.style))}</span></p>
      <p class="c-bio__text">${esc(t(o.bio))}</p>
      ${scoutHtml(o)}
      <p class="c-bio__help"><b class="c-bio__help-title">${esc(t("At {bar}", { bar: t(venue.name) }))}</b>${esc(helpText(g))}</p>
      <p class="c-bio__rec is-won">${esc(t(sameRules(app.set.house, REGLEMENT) ? "Beaten · freeplay pays half" : "Beaten · freeplay pays half · house rules pay nothing"))}</p>`;
  else
    el.innerHTML = `<b class="c-bio__name">???</b>
      <p class="c-bio__head"><span class="c-bio__tag c-bio__tag--${g.id}">${esc(t(g.label))}</span><span class="c-bio__style">${esc(t("Not beaten yet"))}</span></p>
      <p class="c-bio__text">${esc(t("Freeplay is for rematches. Beat this regular in the story first, then come back here as often as you like. Some shop items can only be won in freeplay."))}</p>
      <p class="c-bio__help"><b class="c-bio__help-title">${esc(t("Table help"))}</b>${esc(helpText(g))}</p>`;
  $<HTMLButtonElement>("#btnChallenge").disabled = !open;
  $(".c-btn__label", $("#btnChallenge")).textContent = open
    ? t("Rematch {name}", { name: first(o.name) })
    : t("Rematch");
  $("#playingAs").innerHTML =
    `<svg class="o-icon"><use href="#i-user"/></svg>${esc(t("Playing as"))} <b>${esc(myName())}</b>`;
  if (app.set.opp !== o.id && open) {
    app.set.opp = o.id;
    saveSettings();
  }
}

views.pick = renderRoster;
