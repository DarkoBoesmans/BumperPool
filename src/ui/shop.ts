// The shop: buy with tokens, equip what you own. Freeplay rewards have a gold edge and say what earns them.
import { SLOTS, ITEMS, type Item, type Slot } from "../data/shop";
import { venueById } from "../data/venues";
import { me, buy, canBuy, equip, equipped } from "../profile/profile";
import { sfx } from "../audio/sfx";
import { $, esc } from "./dom";
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

function card(i: Item): string {
  const own = !!me.owned[i.id],
    on = own && equipped(i.id),
    locked = !!i.venue && !me.seen[i.venue] && !i.free;
  const act = on
    ? `<button class="c-btn c-btn--small" type="button" disabled>Equipped</button>`
    : own
      ? `<button class="c-btn c-btn--small" type="button" data-equip="${i.id}">Equip</button>`
      : i.free
        ? `<button class="c-btn c-btn--small" type="button" data-buy="${i.id}" ${canBuy(i) ? "" : "disabled"}>${canBuy(i) ? "Collect" : "Freeplay reward"}</button>`
        : locked
          ? `<button class="c-btn c-btn--small" type="button" disabled>Play there first</button>`
          : `<button class="c-btn c-btn--small" type="button" data-buy="${i.id}" ${canBuy(i) ? "" : "disabled"}>${i.price ? `Buy · ${i.price}` : "Free"}</button>`;
  return `<div class="c-item${i.free ? " c-item--free" : ""}${on ? " is-equipped" : ""}" role="listitem">
    <span class="c-item__swatch" style="--c:${swatch(i)}"></span>
    <b class="c-item__name">${esc(i.name)}</b>
    <span class="c-item__desc">${esc(i.desc)}</span>
    ${i.free && !own ? `<span class="c-item__goal">${esc(i.free.goal)}</span>` : "<span></span>"}
    <span class="c-item__act">${act}</span></div>`;
}

function renderShop(): void {
  if (!ready) {
    ready = true;
    const tabs = $("#shopTabs");
    tabs.innerHTML = SLOTS.map(
      (s) =>
        `<button class="c-tabs__tab" type="button" role="tab" data-slot="${s.id}" aria-selected="${s.id === slot}">${s.label}</button>`,
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
  $("#walletNum").textContent = String(me.tokens);
  grid();
}
function grid(): void {
  $("#shopGrid").innerHTML = ITEMS.filter((i) => i.slot === slot && (!i.secret || me.pearl))
    .map(card)
    .join("");
}
views.shop = renderShop;
