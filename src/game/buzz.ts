// Whisky, cigars and chalk: risk and reward. drink: sips per colour (0..4), smoke: the room (0..1), chalk: on each
// tip (0..1). All of it wears off. A whisky buys back aim line and shows the next bounce, but blurs your view. Smoke
// makes the regulars aim worse, and you see less. Fresh chalk means full spin without a miscue, but some dust lands on
// your ball and makes it cling to the first ball it hits. And after a trick shot, you knock twice on the table.
import { G } from "../core/state";
import { camS } from "../render/camera";
import { emote, type Emote } from "../cafe";
import { sfx } from "../audio/sfx";
import { sendEmote } from "../net/online";
import { app, canAct, help } from "../ui/app";
import { say } from "../ui/bubble";
import type { Color, Shot, Trick } from "../types";
import { t } from "../i18n";
import type { AimHelp } from "../render/aim";

const both = <T>(v: T): Record<Color, T> => ({ W: v, R: v });
export const buzz = {
  drink: both(0),
  smoke: 0,
  /** chalk on the tip: 1 fresh, 0 dry */
  chalk: both(1),
  /** chalked since the last shot: the next shot carries dust */
  dust: both(false),
  /** a trick shot the table has not been thanked for yet */
  fluke: both(false),
  /** after one of your trick shots the knock button shows until this time (ms) */
  knockUntil: both(0),
  told: {} as Record<string, boolean>,
};

export function resetBuzz(): void {
  buzz.drink = both(0);
  buzz.smoke = 0;
  buzz.chalk = both(1);
  buzz.dust = both(false);
  buzz.fluke = both(false);
  buzz.knockUntil = both(0);
}
function tell(key: string, who: string, text: string, ms = 5200): void {
  if (buzz.told[key]) return;
  buzz.told[key] = true;
  say(who, text, null, ms);
}
/** help for the player at the table: the grade decides, a whisky buys back a bit of aim line and shows the next bounce */
export function aimHelp(c: Color): AimHelp {
  const h = help(),
    d = buzz.drink[c] || 0;
  if (d < 0.5) return { aim: h.aim, ghost: h.ghost, obj: h.obj, bounce: 0 };
  return { aim: Math.max(h.aim, 600), ghost: 1, obj: h.obj, bounce: 1 };
}
/** wears off a little every frame */
export function soberUp(dt: number): void {
  for (const c of ["W", "R"] as Color[]) buzz.drink[c] = Math.max(0, buzz.drink[c] - dt / 45);
  buzz.smoke = Math.max(0, buzz.smoke - dt * 0.006);
}

/** just before a shot: a dry tip can slip off the ball on a lot of spin (a miscue), and every shot uses some chalk */
export function chalkShot(c: Color, s: Shot, mine = true): Shot {
  const spin = Math.min(1, Math.hypot(s.sx || 0, s.sy || 0)),
    dry = 1 - buzz.chalk[c],
    out: Shot = { ...s, chalk: buzz.dust[c] || undefined };
  buzz.dust[c] = false;
  buzz.chalk[c] = Math.max(0, buzz.chalk[c] - 0.05 - 0.25 * spin);
  // ponytail: miscue chance grows with dryness and with spin past half, a feel number rather than a measured one
  if (spin > 0.5 && Math.random() < dry * (spin - 0.5) * 1.2) {
    const a = Math.atan2(s.dy, s.dx) + (Math.random() - 0.5) * 0.12;
    sfx("miscue");
    say(
      "Marcel",
      mine ? "Miscue! A dry tip slips off the ball. Chalk up first (3)." : "Miscue! That tip was dry.",
      null,
      3200,
    );
    return { ...out, dx: Math.cos(a), dy: Math.sin(a), p: s.p * 0.4, sx: 0, sy: 0 };
  }
  return out;
}

/** what Marcel calls each trick shot */
const trickLine = (k: Trick): string =>
  ({
    bank: t("Off the cushion and in!"),
    post: t("Off the post and in!"),
    combo: t("A combination!"),
    double: t("Two in one shot!"),
    carom: t("What a trick shot!"),
    long: t("From the far end!"),
  })[k];

/** right after a trick shot, while the banner and replay run: a knock button for a few seconds and Marcel's nudge.
 * A plain direct goal needs no knock. Regulars knock by themselves after their own trick shots. */
export function offerKnock(c: Color, trick: Trick | null, cpu: boolean): void {
  if (!trick) return;
  buzz.fluke[c] = true;
  if (cpu) {
    if (Math.random() < 0.8) setTimeout(() => doEmote(c, "knock", false), 1200); // most regulars know the tradition
    return;
  }
  if (!canAct(c)) return;
  buzz.knockUntil[c] = performance.now() + 9000;
  say(
    "Marcel",
    buzz.told.knock
      ? t("{shot} Knock twice on the table (4).", { shot: trickLine(trick) })
      : t("{shot} After a shot like that, tradition says you thank the table: knock on it twice (4).", {
          shot: trickLine(trick),
        }),
    null,
    4200,
  );
  buzz.told.knock = true;
}
/** the next shot went without a knock */
export function forgotKnock(c: Color, who: string): void {
  if (!buzz.fluke[c]) return;
  buzz.fluke[c] = false;
  say(who, "No knock for the table? It remembers, you know.", null, 2600);
}

export function doEmote(c: Color, kind: Emote, mine: boolean): void {
  const r = emote(c, kind, mine && camS.mode === "player");
  if (r === "empty") {
    if (mine) say("Marcel", "Easy. Your glass is on its way.", null, 2400);
    return;
  }
  if (r !== "ok") return;
  if (kind === "glass" && G.mode === "cpu" && c === G.colorOf[1]) app.oppSips++; // some regulars get shakier with every sip
  if (kind === "glass") buzz.drink[c] = Math.min(4, (buzz.drink[c] || 0) + 1);
  if (kind === "cigar") buzz.smoke = Math.min(1, buzz.smoke + 0.25);
  if (kind === "chalk") {
    buzz.chalk[c] = 1;
    buzz.dust[c] = true;
  }
  if (mine && kind === "glass")
    tell(
      "glass",
      "Marcel",
      "Liquid courage: your aim line reaches further and shows the next bounce. Every sip blurs the room a bit more.",
    );
  if (mine && kind === "cigar")
    tell("cigar", "Marcel", "Smoke fills the room: your opponent squints and aims worse. You see less too.");
  if (mine && kind === "chalk")
    tell(
      "chalk",
      "Marcel",
      "Fresh chalk: full spin without a miscue. Some dust lands on your ball, so the first ball it hits clings and goes a little off line.",
      6000,
    );
  if (kind === "cigar") {
    sfx("lighter");
    setTimeout(() => sfx("puff"), 350);
  } else if (kind === "glass") sfx("sip");
  else if (kind === "chalk") setTimeout(() => sfx("chalk"), 450);
  else {
    buzz.knockUntil[c] = 0;
    setTimeout(() => sfx("knock"), 620);
    if (buzz.fluke[c]) {
      buzz.fluke[c] = false;
      setTimeout(() => say("Marcel", "The table heard you.", null, 2200), 1100);
    }
  }
  if (mine && G.mode === "online") sendEmote(c, kind);
}
