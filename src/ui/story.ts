// Story mode: one chapter per bar, three regulars each. The counter counts all eighteen, legends included,
// so whoever beats the fifteen knows a few are still out there.
import { CHAPTERS, RUMOUR } from "../data/story";
import { GRADES } from "../data/grades";
import { OPPONENTS, findOpponent, gradeOf } from "../data/regulars";
import { me, unlocked, beatenCount, TOTAL, nextInStory, allRegularsBeaten } from "../profile/profile";
import { paintPortrait } from "../people/portrait";
import type { GradeId, Opponent } from "../types";
import { $, esc, first } from "./dom";
import { views } from "./menu";

let shown: GradeId | null = null;
/** what happens when you pick someone: play the next one, rematch a beaten one */
export const story = { play: (_id: string): void => {}, rematch: (_id: string): void => {} };

const chapterState = (g: GradeId): "done" | "open" | "locked" =>
  !unlocked(g) ? "locked" : OPPONENTS.filter((o) => o.grade === g).every((o) => me.beaten[o.id]) ? "done" : "open";

export function renderStory(): void {
  const next = nextInStory();
  if (!shown || (shown === "pearl" && !me.pearl && !allRegularsBeaten()))
    shown = next ? findOpponent(next).grade : "legendary";
  // chapter tabs
  const tabs = $("#chapters");
  tabs.innerHTML = CHAPTERS.map((ch, i) => {
    const g = GRADES.find((x) => x.id === ch.grade)!,
      st = chapterState(ch.grade),
      hidden = ch.secret && !me.pearl;
    return `<button class="c-chapter-tab c-chapter-tab--${g.id}${st === "done" ? " is-done" : ""}${st === "locked" ? " is-locked" : ""}" type="button" role="tab" data-grade="${g.id}" aria-selected="${g.id === shown}" style="--g:${g.color}"><i class="c-chapter-tab__gem"></i>${hidden ? "?" : `Ch. ${i + 1}`}</button>`;
  }).join("");
  for (const b of tabs.querySelectorAll<HTMLElement>("[data-grade]"))
    b.addEventListener("click", () => {
      shown = b.dataset.grade as GradeId;
      renderStory();
    });
  chapter(shown!, next);
  counter();
  stats();
  const btn = $<HTMLButtonElement>("#btnStory");
  btn.disabled = !next;
  $(".c-btn__label", btn).textContent = next ? `Play ${first(findOpponent(next).name)}` : "Everyone beaten";
}

function chapter(gid: GradeId, next: string | null): void {
  const ch = CHAPTERS.find((c) => c.grade === gid)!,
    g = GRADES.find((x) => x.id === gid)!,
    st = chapterState(gid),
    el = $("#chapter"),
    secret = ch.secret && !me.pearl;
  el.style.setProperty("--g", g.color);
  const people = OPPONENTS.filter((o) => o.grade === gid);
  let text = ch.text;
  if (secret)
    text = allRegularsBeaten()
      ? RUMOUR
      : "Three seats at the back stay empty. Beat everyone else in town and listen to the barman.";
  el.innerHTML = `<div class="c-chapter__head"><h3 class="c-chapter__title">${esc(secret ? "???" : ch.title)}</h3><span class="c-chapter__venue">${esc(secret ? "Somewhere" : ch.place)}</span></div>
    <p class="c-chapter__text">${esc(text)}</p>
    <div class="c-chapter__people">${people.map((o) => person(o, st, next, !!secret)).join("")}</div>`;
  el.querySelectorAll<HTMLCanvasElement>("canvas[data-opp]").forEach((cv) => {
    const o = findOpponent(cv.dataset.opp);
    if (st === "locked" || secret) silhouette(cv, gradeOf(o).bg, gradeOf(o).color);
    else paintPortrait(cv, o);
  });
  el.querySelectorAll<HTMLElement>("[data-pick]").forEach((b) =>
    b.addEventListener("click", () => {
      const id = b.dataset.pick!;
      if (me.beaten[id]) story.rematch(id);
      else if (id === next) story.play(id);
    }),
  );
}

function person(o: Opponent, st: string, next: string | null, secret: boolean): string {
  const beaten = !!me.beaten[o.id],
    isNext = o.id === next,
    hide = st === "locked" || secret;
  const state = beaten ? "Beaten" : isNext ? "Next up" : hide ? "Locked" : "Waiting";
  return `<button class="c-chapter__person${beaten ? " is-beaten" : ""}${isNext ? " is-next" : ""}${hide ? " is-locked" : ""}" type="button" data-pick="${o.id}" ${hide ? "disabled" : ""} title="${beaten ? "Rematch in freeplay" : ""}">
    <canvas class="c-chapter__face" width="64" height="64" data-opp="${o.id}"></canvas>
    <b class="c-chapter__name">${esc(hide ? "???" : first(o.name))}</b><span class="c-chapter__state">${state}</span></button>`;
}

/** a dark silhouette with a question mark, for regulars you haven't reached */
export function silhouette(cv: HTMLCanvasElement, bg: string, color: string): void {
  const c = cv.getContext("2d")!,
    s = cv.width / 32;
  c.fillStyle = bg;
  c.fillRect(0, 0, cv.width, cv.height);
  c.fillStyle = "rgba(0,0,0,.6)";
  c.fillRect(6 * s, 26 * s, 20 * s, 6 * s);
  c.fillRect(10 * s, 8 * s, 12 * s, 14 * s);
  c.fillRect(14 * s, 21 * s, 4 * s, 5 * s);
  c.fillStyle = color;
  c.font = `${15 * s}px Anton, Impact, sans-serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("?", 16 * s, 15.5 * s);
}

function counter(): void {
  $("#beatenNum").textContent = String(beatenCount());
  $("#beatenTotal").textContent = String(TOTAL);
  // one little group of pips per grade, so the hidden ones read as "a set you have not found"
  $("#beatenPips").innerHTML = GRADES.map((g) => {
    const hidden = g.secret && !me.pearl,
      pips = OPPONENTS.filter((o) => o.grade === g.id).map(
        (o) =>
          `<i class="c-counter__pip${me.beaten[o.id] ? " is-on" : ""}${hidden ? " is-hidden" : ""}" title="${hidden ? "???" : esc(o.name)}"></i>`,
      );
    return `<span class="c-counter__group" style="--g:${g.color}">${pips.join("")}</span>`;
  }).join("");
}

function stats(): void {
  const cells: [number | string, string][] = [
    [me.wins, "won"],
    [me.losses, "lost"],
    [me.best, "best streak"],
    [me.crawled, "times under the table"],
    [me.sentUnder, "sent under the table"],
    [me.tokens, "tokens"],
  ];
  $("#stats").innerHTML = cells
    .map(
      ([n, l]) =>
        `<div class="c-stats__cell"><b class="c-stats__num">${n}</b><span class="c-stats__label">${l}</span></div>`,
    )
    .join("");
}

views.story = renderStory;
