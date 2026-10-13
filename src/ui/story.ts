// Story mode: one chapter per part of town, three regulars each in a bar of their own. Pick a regular to read their
// strengths and weaknesses, then play the next one or rematch one you beat. The counter counts all eighteen, legends
// included, so whoever beats the fifteen knows a few are still out there.
import { CHAPTERS, RUMOUR } from "../data/story";
import { GRADES } from "../data/grades";
import { OPPONENTS, findOpponent, gradeOf } from "../data/regulars";
import { me, unlocked, beatenCount, TOTAL, nextInStory, allRegularsBeaten } from "../profile/profile";
import { paintPortrait } from "../people/portrait";
import type { GradeId, Opponent } from "../types";
import { $, esc, first } from "./dom";
import { scoutHtml } from "./scout";
import { t } from "../i18n";
import { views } from "./menu";

let shown: GradeId | null = null,
  picked: string | null = null;
/** what the big button does with the regular you picked: play the next one, rematch a beaten one */
export const story = {
  play: (_id: string): void => {},
  rematch: (_id: string): void => {},
  go(): void {
    if (picked && me.beaten[picked]) story.rematch(picked);
    else if (picked && picked === nextInStory()) story.play(picked);
  },
};

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
    return `<button class="c-chapter-tab c-chapter-tab--${g.id}${st === "done" ? " is-done" : ""}${st === "locked" ? " is-locked" : ""}" type="button" role="tab" data-grade="${g.id}" aria-selected="${g.id === shown}" style="--g:${g.color}"><i class="c-chapter-tab__gem"></i>${hidden ? "?" : esc(t("Ch. {n}", { n: i + 1 }))}</button>`;
  }).join("");
  for (const b of tabs.querySelectorAll<HTMLElement>("[data-grade]"))
    b.addEventListener("click", () => {
      shown = b.dataset.grade as GradeId;
      picked = null;
      renderStory();
    });
  const people = OPPONENTS.filter((o) => o.grade === shown),
    open = chapterState(shown!) !== "locked" && !(shown === "pearl" && !me.pearl);
  if (!picked || !people.some((o) => o.id === picked))
    picked = open ? (people.find((o) => o.id === next) || people.find((o) => me.beaten[o.id]) || people[0]).id : null;
  chapter(shown!, next);
  counter();
  stats();
  const btn = $<HTMLButtonElement>("#btnStory"),
    o = picked ? findOpponent(picked) : null,
    beaten = !!o && !!me.beaten[o.id];
  btn.disabled = !o || (!beaten && o.id !== next);
  $(".c-btn__label", btn).textContent = !o
    ? next
      ? t("Play")
      : t("Everyone beaten")
    : beaten
      ? t("Rematch {name}", { name: first(o.name) })
      : o.id === next
        ? t("Play {name}", { name: first(o.name) })
        : t("Beat {name} first", { name: first(findOpponent(next!).name) });
}

/** a chapter's title, part of town and lines of story; locked ones keep their secret */
function chapterText(gid: GradeId): { title: string; place: string; text: string } {
  const ch = CHAPTERS.find((c) => c.grade === gid)!;
  if (!(ch.secret && !me.pearl)) return { title: t(ch.title), place: t(ch.place), text: t(ch.text) };
  return {
    title: "???",
    place: t("Somewhere"),
    text: allRegularsBeaten()
      ? t(RUMOUR)
      : t(
          "Three seats at the back stay empty. Beat everyone else in town, or enter the old arcade code: up, up, down, down, left, right, left, right, B, A. On a touch screen, swipe the arrows and tap twice.",
        ),
  };
}

function chapter(gid: GradeId, next: string | null): void {
  const ch = CHAPTERS.find((c) => c.grade === gid)!,
    g = GRADES.find((x) => x.id === gid)!,
    st = chapterState(gid),
    el = $("#chapter"),
    secret = ch.secret && !me.pearl;
  el.style.setProperty("--g", g.color);
  const people = OPPONENTS.filter((o) => o.grade === gid),
    o = picked && !secret && st !== "locked" ? findOpponent(picked) : null;
  // every chapter's text sits in the same spot and the longest sets the height, so switching chapters never jumps
  const intro = CHAPTERS.map((c) => {
    const t = chapterText(c.grade);
    return `<div class="c-chapter__intro"${c.grade === gid ? "" : ' aria-hidden="true" data-ghost'}><div class="c-chapter__head"><h3 class="c-chapter__title">${esc(t.title)}</h3><span class="c-chapter__venue">${esc(t.place)}</span></div><p class="c-chapter__text">${esc(t.text)}</p></div>`;
  }).join("");
  el.innerHTML = `<div class="c-chapter__intros">${intro}</div>
    <div class="c-chapter__people">${people.map((p) => person(p, st, next, !!secret)).join("")}</div>
    <div class="c-chapter__scout"><p class="c-chapter__who">${o ? `<b>${esc(o.name)}</b> · ${esc(t(o.nick))} · <i>${esc(t(o.style))}</i>` : esc(t("Beat the chapter before this one to meet them."))}</p>${scoutHtml(o)}</div>`;
  el.querySelectorAll<HTMLCanvasElement>("canvas[data-opp]").forEach((cv) => {
    const o = findOpponent(cv.dataset.opp);
    if (st === "locked" || secret) silhouette(cv, gradeOf(o).bg, gradeOf(o).color);
    else paintPortrait(cv, o);
  });
  el.querySelectorAll<HTMLElement>("[data-pick]").forEach((b) => {
    b.addEventListener("click", () => {
      picked = b.dataset.pick!;
      renderStory();
      $<HTMLElement>(`#chapter [data-pick="${picked}"]`).focus();
    });
    b.addEventListener("dblclick", () => story.go());
  });
}

function person(o: Opponent, st: string, next: string | null, secret: boolean): string {
  const beaten = !!me.beaten[o.id],
    isNext = o.id === next,
    hide = st === "locked" || secret;
  const state = t(beaten ? "Beaten" : isNext ? "Next up" : hide ? "Locked" : "Waiting");
  return `<button class="c-chapter__person${beaten ? " is-beaten" : ""}${isNext ? " is-next" : ""}${hide ? " is-locked" : ""}" type="button" data-pick="${o.id}" aria-pressed="${o.id === picked}" ${hide ? "disabled" : ""}>
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
    [me.wins, t("won")],
    [me.losses, t("lost")],
    [me.best, t("best streak")],
    [me.crawled, t("times under the table")],
    [me.sentUnder, t("sent under the table")],
    [me.tokens, t("tokens")],
  ];
  $("#stats").innerHTML = cells
    .map(
      ([n, l]) =>
        `<div class="c-stats__cell"><b class="c-stats__num">${n}</b><span class="c-stats__label">${esc(l)}</span></div>`,
    )
    .join("");
}

views.story = renderStory;
