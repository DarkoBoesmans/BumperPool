// Your player: four tabs of choices. Hair, make-up, clothes and accessories let you look as masculine or feminine as you
// like; nothing is tied to anything else. Things from the shop show up here once you own them.
import type { Look } from "../types";
import { t } from "../i18n";
import { me, saveMe, DEFAULT_LOOK } from "../profile/profile";
import { ITEMS } from "../data/shop";
import { paintPortrait } from "../people/portrait";
import { $, $$, esc } from "./dom";
import { initTabs } from "./tabs";
import { views, showView, backView } from "./menu";

type Opt = [string | number | boolean, string];
interface Row {
  k: keyof Look;
  label: string;
  kind: "sw" | "chips";
  opts: () => Opt[];
}

const SKINS = ["#f3d2b8", "#e9b896", "#d9a585", "#c98d6a", "#9a6444", "#6b4330"];
const HAIRS = ["#1a0f0a", "#3a2416", "#7a4a22", "#c8902a", "#d8b060", "#c8c2b8", "#a8321e", "#2a4a8a"];
const SHIRTS = ["#26262c", "#a3261d", "#2f6fd6", "#2c7a4a", "#c8902a", "#6e1626", "#e6dcc4", "#5a3a8e", "#d86a9a"];
const PANTS = ["#17171b", "#2b3a55", "#3a3226", "#5a1a2a", "#e6dcc4", "#2c4a3a"];
const LIPS = ["", "#b51f2a", "#9a2a5a", "#d86a8a", "#6a2a4a"];
const SHADOW = ["", "#3a2a3a", "#2a6a6a", "#a8862a", "#6a4a8a"];
/** shop items you own that set `k` */
const owned = (slot: string, k: keyof Look): Opt[] =>
  ITEMS.filter((i) => i.slot === slot && me.owned[i.id] && i.look?.[k] !== undefined).map((i) => [
    i.look![k] as string,
    i.name,
  ]);

const PANELS: Record<string, Row[]> = {
  tpBody: [
    { k: "skin", label: "Skin", kind: "sw", opts: () => SKINS.map((c) => [c, c]) },
    {
      k: "build",
      label: "Build",
      kind: "chips",
      opts: () => [
        [0.88, "Slim"],
        [1, "Regular"],
        [1.22, "Big"],
      ],
    },
    {
      k: "frame",
      label: "Frame",
      kind: "chips",
      opts: () => [
        ["broad", "Broad"],
        ["straight", "Straight"],
        ["curvy", "Curvy"],
      ],
    },
    {
      k: "bottom",
      label: "Wears",
      kind: "chips",
      opts: () => [
        ["trousers", "Trousers"],
        ["skirt", "Skirt"],
      ],
    },
    { k: "pants", label: "Colour", kind: "sw", opts: () => PANTS.map((c) => [c, c]) },
  ],
  tpHair: [
    {
      k: "hairStyle",
      label: "Style",
      kind: "chips",
      opts: () => [
        ["bald", "Bald"],
        ["buzz", "Buzz"],
        ["short", "Short"],
        ["side", "Side part"],
        ["quiff", "Quiff"],
        ["mohawk", "Mohawk"],
        ["curly", "Curls"],
        ["bob", "Bob"],
        ["long", "Long"],
        ["pony", "Ponytail"],
        ["pigtails", "Pigtails"],
        ["bun", "Bun"],
        ["perm", "Perm"],
      ],
    },
    { k: "hair", label: "Colour", kind: "sw", opts: () => HAIRS.map((c) => [c, c]) },
    {
      k: "facial",
      label: "Facial hair",
      kind: "chips",
      opts: () => [
        ["none", "None"],
        ["stubble", "Stubble"],
        ["stache", "Moustache"],
        ["goatee", "Goatee"],
        ["beard", "Beard"],
      ],
    },
  ],
  tpFace: [
    { k: "lips", label: "Lipstick", kind: "sw", opts: () => LIPS.map((c) => [c, c || "None"]) },
    { k: "eyeshadow", label: "Eyeshadow", kind: "sw", opts: () => SHADOW.map((c) => [c, c || "None"]) },
    {
      k: "lashes",
      label: "Lashes",
      kind: "chips",
      opts: () => [
        [false, "Natural"],
        [true, "Mascara"],
      ],
    },
    {
      k: "blush",
      label: "Blush",
      kind: "chips",
      opts: () => [
        [false, "None"],
        [true, "Rosy"],
      ],
    },
    {
      k: "glasses",
      label: "Glasses",
      kind: "chips",
      opts: () => [["none", "None"], ["round", "Round"], ...owned("extra", "glasses")],
    },
  ],
  tpStyle: [
    { k: "shirt", label: "Shirt", kind: "sw", opts: () => SHIRTS.map((c) => [c, c]) },
    {
      k: "hat",
      label: "Hat",
      kind: "chips",
      opts: () => [
        ["none", "None"],
        ["cap", "Cap"],
        ["flatcap", "Flat cap"],
        ["fedora", "Fedora"],
        ["beret", "Beret"],
        ["beanie", "Beanie"],
        ["cowboy", "Cowboy"],
        ...owned("hat", "hat"),
      ],
    },
    {
      k: "earrings",
      label: "Earrings",
      kind: "chips",
      opts: () => [
        ["none", "None"],
        ["studs", "Studs"],
        ["hoops", "Hoops"],
      ],
    },
    {
      k: "necklace",
      label: "Neck",
      kind: "chips",
      opts: () => [["none", "None"], ["pearls", "Pearls"], ...owned("extra", "necklace")],
    },
    {
      k: "bowtie",
      label: "Bow tie",
      kind: "chips",
      opts: () => [
        [false, "No"],
        [true, "Yes"],
      ],
    },
    { k: "pattern", label: "Print", kind: "chips", opts: () => [["none", "Plain"], ...owned("outfit", "pattern")] },
  ],
};

let draft: Look = { ...DEFAULT_LOOK };
const key = (v: unknown) => String(v);

function build(): void {
  for (const [id, rows] of Object.entries(PANELS))
    $("#" + id).innerHTML = rows
      .map((r) => {
        const opts = r.opts();
        const body =
          r.kind === "sw"
            ? `<div class="c-swatches" role="radiogroup" aria-label="${esc(t(r.label))}">${opts.map(([v, l]) => `<button class="c-swatches__swatch${v ? "" : " c-swatches__swatch--none"}" type="button" role="radio" data-k="${r.k}" data-v="${key(v)}" style="--c:${v || "transparent"}" aria-label="${esc(t(r.label))} ${esc(t(l))}" title="${esc(t(l))}"></button>`).join("")}</div>`
            : `<div class="c-chips" role="radiogroup" aria-label="${esc(t(r.label))}">${opts.map(([v, l]) => `<button class="c-chips__chip" type="button" role="radio" data-k="${r.k}" data-v="${key(v)}">${esc(t(l))}</button>`).join("")}</div>`;
        return `<div class="c-maker__row"><span class="c-maker__label">${esc(t(r.label))}</span>${body}</div>`;
      })
      .join("");
}

/** the shop's prints carry their own trim colour; a hat from the shop keeps its colour */
function apply(k: keyof Look, raw: string): void {
  const row = Object.values(PANELS)
    .flat()
    .find((r) => r.k === k)!;
  const v = row.opts().find(([x]) => key(x) === raw)?.[0];
  (draft as unknown as Record<string, unknown>)[k] = v;
  if (k === "pattern") {
    const item = ITEMS.find((i) => i.look?.pattern === v);
    if (item?.look) Object.assign(draft, item.look);
  }
  if (k === "hat") {
    const item = ITEMS.find((i) => i.look?.hat === v);
    draft.hatColor = item?.look?.hatColor ?? (["cap", "beanie", "beret"].includes(String(v)) ? draft.shirt : "#2a2622");
  }
  if (k === "shirt" && (!draft.pattern || draft.pattern === "none"))
    draft.trim = draft.shirt === "#e6dcc4" ? "#26262c" : "#e6dcc4";
}

function sync(): void {
  for (const b of $$("#meForm [data-k]"))
    b.setAttribute("aria-checked", String(key(draft[b.dataset.k as keyof Look] ?? "") === b.dataset.v));
  paintPortrait($<HTMLCanvasElement>("#meFace"), { look: draft, grade: "common" });
}

let ready = false;
function renderMe(): void {
  draft = structuredClone(me.look);
  build(); // shop items you bought since last time show up
  if (!ready) {
    ready = true;
    initTabs($(".c-maker__form .c-tabs"));
    $("#meForm").addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-k]");
      if (!b) return;
      apply(b.dataset.k as keyof Look, b.dataset.v!);
      sync();
    });
    $("#meDone").addEventListener("click", () => {
      const name = $<HTMLInputElement>("#meName");
      if (!me.made && !name.value.trim()) {
        $("#meFirst").textContent = t("Your player needs a name first.");
        name.focus();
        return;
      }
      me.name = name.value.trim();
      me.look = { ...draft };
      me.made = true;
      saveMe();
      onSaved();
      showView(backView());
    });
  }
  $("#meFirst").hidden = me.made;
  $<HTMLInputElement>("#meName").value = me.name;
  sync();
}
let onSaved = (): void => {};
export const onMeSaved = (f: () => void): void => {
  onSaved = f;
};
views.me = renderMe;
