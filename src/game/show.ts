// The show after a shot: banner, replay, more banner. A 5-0 ends with the loser crawling under the table.
// The match result goes on your record here, with tokens, freeplay rewards and newly opened bars.
import { G, nameOf, remaining } from "../core/state";
import { REGLEMENT, sameRules } from "../core/rules";
import { att, other } from "../core/table";
import { usePower, POWER_INFO, type Power } from "../core/powers";
import { THREE } from "../render/three";
import { S } from "../render/renderer";
import { camS } from "../render/camera";
import { slideBalls } from "../render/balls";
import { hasShot } from "../replay/recorder";
import { startReplay, stopReplay, play, type Moment } from "../replay/replay";
import { crawl } from "../people/crawl";
import { sfx } from "../audio/sfx";
import { push } from "../net/online";
import { recordMatch, recordCrawl, allRegularsBeaten, me } from "../profile/profile";
import { app } from "../ui/app";
import { offerKnock } from "./buzz";
import { first } from "../ui/dom";
import { banner } from "../ui/banner";
import { quip } from "../ui/bubble";
import { renderUI } from "../ui/hud";
import { replayOverlay } from "../ui/replay-overlay";
import { changed, refresh } from "./refresh";
import type { Color, Foul, LastShot } from "../types";

export async function maybePresent(): Promise<void> {
  const L = G.lastShot;
  if (!L || L.n <= app.shown || app.show || G.phase === "moving" || !app.inGame) return;
  app.shown = L.n;
  app.show = true;
  app.drag = null;
  renderUI();
  try {
    await present(L);
  } finally {
    app.show = false;
    refresh();
  }
}

function goalsOf(L: LastShot) {
  const own = L.pots.filter((p) => (L.shooter ? p.c === L.shooter : true) && p.h === att(p.c));
  const gifts = L.shooter ? L.pots.filter((p) => p.c !== L.shooter) : [];
  return { own, gifts };
}

async function present(L: LastShot): Promise<void> {
  const cpu = G.mode === "cpu",
    cc = G.colorOf[1],
    replays = app.set.replays,
    can = hasShot(L.n) && replays !== "off";
  const { own, gifts } = goalsOf(L);
  if (L.foul) {
    const f = L.foul,
      time = f.key === "time";
    sfx("foul");
    setTimeout(() => sfx("stamp"), 180);
    if (cpu) quip(f.c === cc ? "foul" : "oppFoul");
    await banner(time ? "time" : "foul", time ? "TIME!" : "FOUL!", nameOf(f.c), f.title);
    if (!time && can) await runReplay({ kind: "foul", foul: f }, f);
  }
  if (!L.foul && own.length && L.shooter) offerKnock(L.shooter, !!L.lucky, cpu && L.shooter === cc);
  if (L.end) return endShow(L, can);
  if (L.foul) return;
  if (own.length) {
    const c = own[0].c,
      left = remaining(c);
    sfx("goal");
    if (cpu) quip(c === cc ? "goal" : "oppGoal");
    await banner(
      "goal",
      "GOAL!",
      nameOf(c),
      own.length > 1 ? `${own.length} in one shot!` : left === 1 ? "One to go" : `${left} to go`,
    );
    if (can && replays === "all") await runReplay({ kind: "goal", pot: own[own.length - 1] });
  } else if (gifts.length) {
    const c = gifts[0].c;
    sfx("gift");
    if (cpu) quip(c === cc ? "oppGoal" : "goal");
    await banner("gift", "GIFT!", nameOf(c), `${nameOf(L.shooter!)} scored for ${nameOf(c)}`);
    if (can && replays === "all") await runReplay({ kind: "goal", pot: gifts[gifts.length - 1] });
  }
}

async function endShow(L: LastShot, can: boolean): Promise<void> {
  const cpu = G.mode === "cpu",
    w = L.winner!,
    pot = [...L.pots].reverse().find((p) => p.c === w);
  if (pot && can) await runReplay({ kind: "win", pot });
  sfx("win");
  if (cpu && L.end === "match") quip(w === G.colorOf[1] ? "win" : "lose");
  const p = G.colorOf.indexOf(w),
    lc = other(w),
    notes: string[] = [];
  await banner(
    L.end!,
    L.end === "match" ? "MATCH!" : "GAME!",
    first(G.names[p]),
    L.end === "match" ? `Wins ${G.wins[p]}-${G.wins[1 - p]}` : `Game ${G.manche} · ${G.wins[0]}-${G.wins[1]}`,
    2800,
  );
  // a freeplay match with house rules is a friendly: nothing on the record
  const friendly = !sameRules(G.rules, REGLEMENT);
  if (remaining(lc) === 5 && !G.rules.golden) {
    // 5-0: house rules, under the table you go
    const who = first(nameOf(lc));
    if (cpu && !friendly) recordCrawl(lc === G.colorOf[0], who, first(nameOf(w)), app.freeplay);
    notes.push(`${who} crawled under the table.`);
    await crawlShow(lc, who);
  }
  app.reward = "";
  if (cpu && L.end === "match" && friendly) notes.push("House rules: a friendly, nothing on your record.");
  if (cpu && L.end === "match" && app.opp && !friendly) {
    const won = w === G.colorOf[0],
      r = recordMatch(app.opp.id, won, { freeplay: app.freeplay, games: [G.wins[0], G.wins[1]] });
    app.reward =
      `+${r.tokens} tokens` + (r.items.length ? ` · freeplay reward: ${r.items.map((i) => i.name).join(", ")}` : "");
    if (r.opened)
      notes.push(
        r.opened.secret ? "The legends are in." : `${r.opened.label} is open: a new bar and three new regulars.`,
      );
    if (won && !app.freeplay && allRegularsBeaten() && !me.pearl)
      notes.push("That's fifteen. Or is it? The barman says to ask the old arcade poster.");
  }
  app.endNote = notes.join(" ");
}

/** the loser of a 5-0 crawls under the table, end to end, with the camera down low beside it */
async function crawlShow(c: Color, who: string): Promise<void> {
  camS.prev = camS.mode;
  camS.mode = "replay";
  camS.replay = { pos: new THREE.Vector3(0, -0.2, 2.3), look: new THREE.Vector3(0, -0.45, 0), cut: true, crawl: c };
  document.body.classList.add("is-replaying"); // hide the HUD, it is a show
  sfx("foul");
  banner("crawl", "UNDER THE TABLE!", who, "5-0. Onto the Wall of Shame.", 3200);
  await Promise.race([crawl(c), new Promise((r) => setTimeout(r, 15000))]);
  document.body.classList.remove("is-replaying");
  camS.mode = camS.prev || "player";
  camS.replay = null;
}

export const skipReplay = (): void => {
  if (play.on) stopReplay();
};
function runReplay(m: Moment, foul?: Foul): Promise<void> {
  startReplay(m);
  replayOverlay(m, foul);
  return new Promise((res) => {
    app.replayDone = () => {
      replayOverlay(null);
      res();
    };
  });
}

/** a Pearlescent legend bends the table: banner, sound, the balls slide */
export async function powerShow(kind: Power, c: Color): Promise<void> {
  app.show = true;
  quip("power");
  sfx(kind);
  S.flash = kind === "thunder" ? 1 : kind === "tide" ? 0.35 : 0.25;
  slideBalls(usePower(kind, c), performance.now());
  const info = POWER_INFO[kind];
  await banner("power", info.word, app.opp?.name || "", info.sub, 2600);
  app.show = false;
  changed();
  push();
}
