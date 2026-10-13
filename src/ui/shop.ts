// The shop: buy with tokens, equip what you own. Rewards (freeplay goals and the trophies of regulars you beat)
// have a gold edge and say what earns them. Items of the hidden legends show up after the old arcade code.
import { SLOTS, ITEMS, type Item, type Slot } from "../data/shop";
import { venueById } from "../data/venues";
import { findOpponent } from "../data/regulars";
import { t } from "../i18n";
import { me, buy, canBuy, equip, equipped } from "../profile/profile";
import { sfx } from "../audio/sfx";
import { $, $$, esc } from "./dom";
import { initTabs } from "./tabs";
import { views } from "./menu";

let slot: Slot = "cue";
let ready = false;
/** called after a purchase or a change of look, so the table and figures follow */
export const shop = { changed: (): void => {} };

/** a small preview colour for the item */
function swatch(i: Item): string {
  if (i.cue) return `linear-gradient(90deg, ${i.cue.butt} 0 45%, ${i.cue.ring} 45% 55%, ${i.cue.shaft} 55%)`;
  if (i.table) return `linear-gradient(${i.table.rail} 0 22%, ${i.table.cloth} 22% 78%, ${i.table.rail} 78%)`;
  if (i.venue) {
    const v = venueById(i.venue);
    return `linear-gradient(${v.wall.paper} 0 55%, ${v.wall.rail} 55% 60%, ${v.floor.a} 60%)`;
  }
  const l = i.look || {};
  if (l.shirt) return `linear-gradient(90deg, ${l.shirt} 0 70%, ${l.trim} 70%)`;
  if (l.hatColor) return l.hatColor;
  if (l.glasses) return "#0a0a0c";
  if (l.necklace) return "#f2c84a";
  return "#ccc";
}

/** what earns a reward: a freeplay goal, or beating the regular it belongs to */
const goal = (i: Item): string =>
  i.from ? t("Beat {name}", { name: findOpponent(i.from).name }) : t(i.free?.goal || "");

function card(i: Item): string {
  const own = !!me.owned[i.id],
    on = own && equipped(i.id),
    reward = !!(i.free || i.from),
    locked = !!i.venue && !me.seen[i.venue] && !reward;
  const act = on
    ? `<button class="c-btn c-btn--small" type="button" disabled>${esc(t("Equipped"))}</button>`
    : own
      ? `<button class="c-btn c-btn--small" type="button" data-equip="${i.id}">${esc(t("Equip"))}</button>`
      : reward
        ? `<button class="c-btn c-btn--small" type="button" data-buy="${i.id}" ${canBuy(i) ? "" : "disabled"}>${esc(t(canBuy(i) ? "Collect" : i.from ? "Trophy" : "Freeplay reward"))}</button>`
        : locked
          ? `<button class="c-btn c-btn--small" type="button" disabled>${esc(t("Play there first"))}</button>`
          : `<button class="c-btn c-btn--small" type="button" data-buy="${i.id}" ${canBuy(i) ? "" : "disabled"}>${i.price ? t("Buy · {price}", { price: i.price }) : t("Free")}</button>`;
  return `<div class="c-item${reward ? " c-item--free" : ""}${on ? " is-equipped" : ""}" role="listitem">
    <span class="c-item__swatch" style="--c:${swatch(i)}"></span>
    <b class="c-item__name">${esc(t(i.name))}</b>
    <span class="c-item__desc">${esc(t(i.desc))}</span>
    ${reward && !own ? `<span class="c-item__goal">${esc(goal(i))}</span>` : "<span></span>"}
    <span class="c-item__act">${act}</span></div>`;
}

function renderShop(): void {
  if (!ready) {
    ready = true;
    const tabs = $("#shopTabs");
    tabs.innerHTML = SLOTS.map(
      (s) =>
        `<button class="c-tabs__tab" type="button" role="tab" data-slot="${s.id}" aria-selected="${s.id === slot}">${esc(t(s.label))}</button>`,
    ).join("");
    initTabs(tabs, (t) => {
      slot = t.dataset.slot as Slot;
      grid();
    });
    $("#shopGrid").addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-buy],[data-equip]");
      if (!b) return;
      if (b.dataset.buy && buy(b.dataset.buy)) sfx("coin");
      if (b.dataset.equip) equip(b.dataset.equip);
      shop.changed();
      renderShop();
    });
  }
  for (const b of $$("#shopTabs [data-slot]")) b.textContent = t(SLOTS.find((s) => s.id === b.dataset.slot)!.label);
  $("#walletNum").textContent = String(me.tokens);
  grid();
}
function grid(): void {
  const shelf = ITEMS.filter((i) => i.slot === slot),
    hidden = me.pearl ? 0 : shelf.filter((i) => i.secret).length;
  $("#shopGrid").innerHTML = shelf
    .filter((i) => !i.secret || me.pearl)
    .map(card)
    .join("");
  const note = $("#shopSecret");
  note.hidden = !hidden;
  note.textContent = t(
    "{n} more on this shelf, after the old arcade code: up, up, down, down, left, right, left, right, B, A.",
    {
      n: hidden,
    },
  );
}
views.shop = renderShop;
