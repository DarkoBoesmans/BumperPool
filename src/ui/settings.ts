// Settings: sound and the jukebox, the picture effects, and game options. Everything saves as you change it.
import { FX_DEFAULTS, type Fx } from "../render/post";
import { vol, setVol, type Bus } from "../audio/mixer";
import { juke, nextSong, setStyle } from "../audio/jukebox";
import { $, $$ } from "./dom";
import { app, saveSettings, type Settings } from "./app";
import { initTabs } from "./tabs";

const FX: [keyof Fx, string, string][] = [
  ["ps2", "PS2 filter", "Low resolution, dithered colour, scanlines"],
  ["bloom", "Bloom", "Glow around lamps and bright spots"],
  ["flare", "Lens flare", "Streaks and rings when a lamp is in view"],
  ["grain", "Film grain", "Moving noise like an old camera"],
  ["vignette", "Vignette", "Darker corners"],
  ["blur", "Motion blur", "Smears fast camera moves"],
  ["chroma", "Chromatic aberration", "Colour fringes towards the edges"],
];
const LOOKS: Record<string, Fx> = {
  clean: { ps2: 0, bloom: 30, flare: 15, grain: 0, vignette: 25, blur: 0, chroma: 0 },
  ps2: { ...FX_DEFAULTS },
  cinema: { ps2: 15, bloom: 70, flare: 65, grain: 45, vignette: 75, blur: 35, chroma: 30 },
};
export type Applied = "fx" | "lines" | "cloth" | "clock";

/** returns open(on) for the settings dialog */
export function initSettings(apply: (k: Applied) => void): (on: boolean) => void {
  for (const k of ["master", "fx", "amb", "music"] as Bus[]) {
    const i = $<HTMLInputElement>("#vol_" + k),
      o = $("#vol_" + k + "_v");
    i.value = String(vol[k]);
    o.textContent = String(vol[k]);
    i.addEventListener("input", () => {
      setVol(k, +i.value);
      o.textContent = i.value;
    });
  }
  const box = $("#fxSliders");
  box.innerHTML = FX.map(
    ([k, t, d]) =>
      `<label class="c-slider"><span class="c-slider__label">${t}<small class="c-slider__desc">${d}</small></span><input class="c-slider__input" type="range" min="0" max="100" data-fx="${k}" aria-label="${t}"><output class="c-slider__value" data-fxv="${k}"></output></label>`,
  ).join("");
  const syncFx = () => {
    for (const [k] of FX) {
      $<HTMLInputElement>(`[data-fx="${k}"]`, box).value = String(app.set.fx[k]);
      $(`[data-fxv="${k}"]`, box).textContent = String(app.set.fx[k]);
    }
    for (const b of $$("[data-look]"))
      b.setAttribute("aria-checked", String(FX.every(([k]) => LOOKS[b.dataset.look!][k] === app.set.fx[k])));
  };
  box.addEventListener("input", (e) => {
    const t = e.target as HTMLInputElement,
      k = t.dataset.fx as keyof Fx | undefined;
    if (!k) return;
    app.set.fx[k] = +t.value;
    syncFx();
    apply("fx");
  });
  box.addEventListener("change", saveSettings);
  for (const b of $$("[data-look]"))
    b.addEventListener("click", () => {
      app.set.fx = { ...LOOKS[b.dataset.look!] };
      saveSettings();
      syncFx();
      apply("fx");
    });
  const sync = () => {
    for (const b of $$("[data-replays]")) b.setAttribute("aria-checked", String(b.dataset.replays === app.set.replays));
    $("#optClock").setAttribute("aria-checked", String(app.set.clock));
    $("#optLines2").setAttribute("aria-checked", String(app.set.lines));
    $("#optCloth").setAttribute("aria-checked", String(app.set.cloth));
    $("#optLines").setAttribute("aria-pressed", String(app.set.lines));
    for (const b of $$("[data-mine]")) b.setAttribute("aria-checked", String(b.dataset.mine === app.set.mine));
    for (const b of $$("[data-jstyle]")) b.setAttribute("aria-checked", String(b.dataset.jstyle === juke.style));
  };
  for (const b of $$("[data-replays]"))
    b.addEventListener("click", () => {
      app.set.replays = b.dataset.replays as Settings["replays"];
      saveSettings();
      sync();
    });
  for (const b of $$("[data-mine]"))
    b.addEventListener("click", () => {
      app.set.mine = b.dataset.mine as Settings["mine"];
      saveSettings();
      sync();
    });
  for (const b of $$("[data-jstyle]"))
    b.addEventListener("click", () => {
      setStyle(b.dataset.jstyle as typeof juke.style);
      sync();
      song();
    });
  const toggle = (id: string, k: "clock" | "lines" | "cloth") =>
    $(id).addEventListener("click", () => {
      app.set[k] = !app.set[k];
      saveSettings();
      sync();
      apply(k);
    });
  toggle("#optClock", "clock");
  toggle("#optLines2", "lines");
  toggle("#optLines", "lines");
  toggle("#optCloth", "cloth");
  // delete my data: a second press within four seconds wipes everything this game keeps in the browser
  const wipe = $<HTMLButtonElement>("#btnWipe");
  let armed = 0;
  wipe.addEventListener("click", () => {
    if (!armed) {
      wipe.classList.add("is-armed");
      $(".c-btn__label", wipe).textContent = "Press again to delete everything";
      armed = window.setTimeout(() => {
        armed = 0;
        wipe.classList.remove("is-armed");
        $(".c-btn__label", wipe).textContent = "Delete my data";
      }, 4000);
      return;
    }
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith("golfbiljart.")) localStorage.removeItem(k);
    } catch {
      // storage blocked: there is nothing stored to delete
    }
    location.reload();
  });
  // the jukebox
  const song = () => {
    $("#songTitle").textContent = juke.title || "Jukebox";
    $("#songInfo").textContent = juke.info || "Starts with your first tap or click";
    $("#jukebox").classList.toggle("is-on", !!juke.title && vol.music > 0);
  };
  juke.onChange = song;
  $("#songNext").addEventListener("click", () => {
    nextSong();
    song();
  });
  const open = (on: boolean) => {
    $("#settings").hidden = !on;
    if (on) {
      song();
      $("#setClose").focus();
    }
  };
  $("#btnSettings").addEventListener("click", () => open(true));
  $("#btnSettings2").addEventListener("click", () => open(true));
  $("#setClose").addEventListener("click", () => open(false));
  $("#settings").addEventListener("click", (e) => {
    if ((e.target as HTMLElement).id === "settings") open(false);
  });
  initTabs($("#settings [role=tablist]"));
  sync();
  syncFx();
  song();
  return open;
}
