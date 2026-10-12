// The big comic banner: GOAL!, FOUL!, GAME!, THUNDER! and friends, with confetti for the good ones.
import { $ } from "./dom";

const CONFETTI = ["#ffd24a", "#ff3d2e", "#f7edd9", "#c6ff4d", "#ff7a1a", "#9b6bff"];
export type BannerKind = "goal" | "gift" | "foul" | "time" | "game" | "match" | "crawl" | "pearl" | "power";

export function banner(kind: BannerKind, word: string, who = "", sub = "", ms = 2300): Promise<void> {
  const el = $("#banner");
  el.className = "c-banner";
  el.hidden = false;
  $("#bWord").textContent = word;
  $("#bWho").textContent = who;
  $("#bSub").textContent = sub;
  const conf = $("#confetti");
  conf.innerHTML = "";
  if (["goal", "game", "match", "gift", "pearl"].includes(kind)) {
    const n = kind === "goal" || kind === "gift" ? 40 : 110;
    let html = "";
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2,
        d = 200 + Math.random() * 520;
      html += `<i class="c-banner__bit" style="left:${Math.random() * 100}%;background:${CONFETTI[i % 6]};--x:${(Math.cos(a) * d) | 0}px;--y:${(Math.sin(a) * d * 0.6 + 240) | 0}px;--r:${(Math.random() * 900 - 450) | 0}deg;--d:${(1.4 + Math.random() * 1.2).toFixed(2)}s"></i>`;
    }
    conf.innerHTML = html;
  }
  void el.offsetWidth;
  el.classList.add("is-go", `c-banner--${kind}`);
  return new Promise((res) =>
    setTimeout(() => {
      el.hidden = true;
      el.className = "c-banner";
      res();
    }, ms),
  );
}
