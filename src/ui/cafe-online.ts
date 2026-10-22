// Online play on screen: the menu's three cards (open your café, walk in with a code, the list of open cafés) and,
// in the match drawer, the café's code to share, doubles for the leader and the door out.
import { G } from "../core/state";
import { net, board, leader, online, openCafe, joinCafe, setDoubles, MAX } from "../net/online";
import { watchLobby, type Listing } from "../net/lobby";
import { me, myName } from "../profile/profile";
import { $, esc } from "./dom";
import { t, onLang } from "../i18n";
import { views } from "./menu";

let cafes: Listing[] = [];

/** the line under the players in the drawer */
export function cafeNote(): string {
  if (!online()) return "";
  const waiting = board().map((m) => m.name);
  return [
    t("Café {code} · {n} of {max} here", { code: net.code, n: net.members.length, max: MAX }),
    waiting.length ? t("On the board: {names}", { names: waiting.join(", ") }) : "",
    board().some((m) => m.uid === net.uid) ? t("You play the winner.") : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

/** the café box in the drawer */
export function drawCafeBox(): void {
  const box = $("#cafeBox");
  box.hidden = !online();
  if (box.hidden) return;
  $("#cafeCodeShow").textContent = net.code;
  const d = $("#optDoubles");
  d.hidden = !leader() || net.members.length < MAX;
  d.setAttribute("aria-checked", String(!!G.doubles));
}

function drawList(): void {
  const ul = $("#cafeList");
  ul.innerHTML = cafes.length
    ? cafes
        .map(
          (c) =>
            `<li><button class="c-online__cafe" type="button" data-code="${esc(c.code)}"${c.n >= MAX ? " disabled" : ""}><b>${esc(
              t("{name}'s café", { name: c.host }),
            )}</b><span class="c-online__n">${esc(c.n >= MAX ? t("Full") : t("{n} of {max}", { n: c.n, max: MAX }))}</span><span class="c-online__tag" translate="no">${esc(c.code)}</span></button></li>`,
        )
        .join("")
    : `<li class="c-online__empty">${esc(t("No open cafés right now. Open yours and be the first."))}</li>`;
}

/** `go(walkIn)`: walks into a café (flow.ts sets the table up around it) */
export function initOnlineMenu(go: (walkIn: () => Promise<unknown>) => Promise<void>): void {
  const err = $("#onlineErr"),
    name = $<HTMLInputElement>("#nOnline"),
    open = $("#cafeOpen"),
    code = $<HTMLInputElement>("#cafeCode");
  const fail = (e: unknown) => {
    err.textContent = (e as Error).message; // already in your language
    err.hidden = false;
  };
  const busy = async (btn: HTMLButtonElement, walkIn: () => Promise<unknown>) => {
    err.hidden = true;
    btn.disabled = true;
    try {
      await go(walkIn);
    } catch (e) {
      fail(e);
    } finally {
      btn.disabled = false;
    }
  };
  const who = () => name.value.trim() || myName();
  views.online = () => {
    name.value ||= myName();
    drawList();
    watchLobby((c) => {
      cafes = c;
      drawList();
    }).catch((e) => fail(e));
  };
  onLang(drawList);
  open.addEventListener("click", () => open.setAttribute("aria-checked", String(open.ariaChecked !== "true")));
  $("#btnOpenCafe").addEventListener("click", (e) =>
    busy(e.currentTarget as HTMLButtonElement, () => openCafe(who(), me.look, open.ariaChecked === "true")),
  );
  const byCode = (btn: HTMLButtonElement, c: string) => busy(btn, () => joinCafe(c, who(), me.look));
  $("#btnJoinCode").addEventListener("click", (e) => byCode(e.currentTarget as HTMLButtonElement, code.value));
  code.addEventListener("input", () => (code.value = code.value.toUpperCase().replace(/[^A-Z0-9]/g, "")));
  $("#cafeList").addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-code]");
    if (b) void byCode(b, b.dataset.code!);
  });
}

/** the drawer's buttons: copy the code, doubles, leave */
export function initCafeBox(leave: () => void): void {
  $("#btnCopyCode").addEventListener("click", () => void navigator.clipboard?.writeText(net.code).catch(() => {}));
  $("#optDoubles").addEventListener("click", () => setDoubles(!G.doubles));
  $("#btnLeaveCafe").addEventListener("click", leave);
}
