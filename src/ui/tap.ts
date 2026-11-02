// The pint between shots: Marcel can't keep up, so now and then the regular you play orders one and you may tap it
// (core/tap.ts has the beer). Hold to pour, let go at the line, skim. A good pint earns a tip in tokens. The game
// waits while you tap (blocked() in game/input.ts), the shot clock too.
import { newPint, pour, skim, score, gradeOf, HEAD, TIP, type Pint } from "../core/tap";
import { G } from "../core/state";
import { me, saveMe } from "../profile/profile";
import { sfx } from "../audio/sfx";
import { $, first } from "./dom";
import { t } from "../i18n";
import { app } from "./app";

const H = 144, // the glass in the drawing: rim at y 70, bottom at 214
  BOTTOM = 214,
  RIM = 70;
const S = {
  pint: newPint(),
  who: "",
  stage: "pour" as "pour" | "skim" | "done",
  last: 0,
  fizz: 0,
  orders: 0,
  hideAt: -1e9,
  /** when the tap was shut: the click that ends a press must not skim at once */
  shut: 0,
};
export const tapOpen = (): boolean => !$("#tap").hidden;

/** every match starts without orders */
export const resetOrders = (): void => {
  S.orders = 0;
  S.hideAt = -1e9;
  $("#tapOrder").hidden = true;
};

/** the regular's turn begins: now and then they order one (at most twice a match, never in the first turns) */
export function maybeOrder(): void {
  const now = performance.now();
  if (G.mode !== "cpu" || !app.opp || S.orders >= 2 || G.log.length < 6 || tapOpen() || now < S.hideAt + 20000) return;
  if (Math.random() > 0.3) return;
  S.orders++;
  S.who = first(app.opp.name);
  $("#tapOrderText").textContent = t("{name} wants a pint", { name: S.who });
  const chip = $("#tapOrder");
  chip.hidden = false;
  S.hideAt = now + 9000;
  setTimeout(() => performance.now() >= S.hideAt && (chip.hidden = true), 9100);
}

function open(): void {
  $("#tapOrder").hidden = true;
  S.pint = newPint();
  S.stage = "pour";
  $("#tapTitle").textContent = t("{name} wants a pint", { name: S.who });
  $("#tapResult").textContent = "";
  $("#tapLater").hidden = false;
  $("#tap").classList.remove("is-skimmed");
  label();
  draw();
  $("#tap").hidden = false;
  $("#tapGo").focus();
  S.last = performance.now();
  requestAnimationFrame(frame);
}
function close(): void {
  $("#tap").hidden = true;
  S.pint.open = false;
}

const label = () =>
  ($("#tapGoLabel").textContent =
    S.stage === "pour" ? t("Hold to pour") : S.stage === "skim" ? t("Skim") : t("Cheers"));

function frame(now: number): void {
  if (!tapOpen()) return;
  const p = S.pint;
  // real time in small steps, so a slow phone pours as fast as a quick one (a hidden tab pauses the tap)
  for (let dt = Math.min(0.25, (now - S.last) / 1000); dt > 0; dt -= 0.02) pour(p, Math.min(0.02, dt));
  S.last = now;
  if (p.open && now > S.fizz) {
    sfx("pour");
    S.fizz = now + 110;
  }
  draw();
  requestAnimationFrame(frame);
}

function draw(): void {
  const p = S.pint,
    y = (h: number) => BOTTOM - h * H,
    inside = Math.min(p.foam, Math.max(0, 1 - p.beer)),
    crown = Math.max(0, p.beer + p.foam - 1) * H,
    set = (id: string, a: Record<string, number | string>) => {
      const el = $(id);
      for (const k in a) el.setAttribute(k, String(a[k]));
    };
  set("#tapBeerFill", { y: y(p.beer), height: p.beer * H });
  set("#tapFoam", { y: y(p.beer + inside), height: inside * H });
  set("#tapCrown", { d: `M28 ${RIM} Q60 ${RIM - 2 * crown} 92 ${RIM} Z` });
  set("#tapStream", { height: Math.max(0, y(p.beer + inside) - crown - 44) }); // from the spout down into the glass
  $("#tap").classList.toggle("is-open", p.open);
  $("#tap").classList.toggle("is-running", p.open && crown > 0.11 * H); // the head runs down the glass
}

function down(): void {
  if (S.stage !== "pour" || S.pint.open) return;
  S.pint.open = true;
  $("#tapLater").hidden = true; // too late to say no: the tap is open
}
function up(): void {
  if (S.stage !== "pour" || !S.pint.open) return;
  S.pint.open = false;
  S.stage = "skim";
  S.shut = performance.now();
  label();
}
function skimNow(): void {
  skim(S.pint);
  sfx("skim");
  $("#tap").classList.add("is-skimmed");
  draw();
  const s = score(S.pint),
    g = gradeOf(s),
    tip = TIP[g];
  me.tokens += tip;
  saveMe();
  if (tip) setTimeout(() => sfx("coin"), 250);
  $("#tapResult").textContent =
    verdict(g) + " " + (tip === 1 ? t("Tip: 1 token.") : tip ? t("Tip: {n} tokens.", { n: tip }) : t("No tip."));
  S.stage = "done";
  label();
}

/** what the regular says, from what is in the glass */
function verdict(g: ReturnType<typeof gradeOf>): string {
  const p = S.pint;
  if (g === "perfect") return t("Perfect: two fingers of foam.");
  if (p.spill > 0.1) return t("Half of it went down the drain.");
  if (p.beer + p.foam < 0.85) return t("That glass is half empty.");
  if (p.foam > HEAD + 0.08) return t("A glass of foam.");
  if (p.foam < 0.08) return t("Flat as a pancake.");
  return g === "good" ? t("A good pint.") : t("It will do.");
}

export function initTap(): void {
  const go = $("#tapGo");
  $("#tapOrder").addEventListener("click", open);
  $("#tapLater").addEventListener("click", close);
  go.addEventListener("pointerdown", (e) => {
    if (S.stage === "pour") {
      go.setPointerCapture(e.pointerId);
      down();
    }
  });
  go.addEventListener("pointerup", up);
  go.addEventListener("pointercancel", up);
  go.addEventListener("click", () => {
    if (performance.now() - S.shut < 300) return; // the release of the pour, not a press of its own
    if (S.stage === "skim") skimNow();
    else if (S.stage === "done") close();
  });
  // the keyboard: hold Space or Enter to pour, press it again to skim
  go.addEventListener("keydown", (e) => {
    if ((e.key === " " || e.key === "Enter") && !e.repeat && S.stage === "pour") {
      e.preventDefault();
      down();
    }
  });
  go.addEventListener("keyup", (e) => {
    if ((e.key === " " || e.key === "Enter") && S.stage === "pour") {
      e.preventDefault();
      up();
    }
  });
}

/** Escape: shut the tap and put the glass down */
export const closeTap = close;
export type { Pint };
