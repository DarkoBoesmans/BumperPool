// The record player inside the jukebox. One <audio> element plays every record, so a phone that let it play once
// lets it play again; it runs through the same cabinet and room as the house trio, a little brighter.
import { au } from "./mixer";
import type { Record_ } from "../data/records";

let el: HTMLAudioElement | null = null,
  want = false;

/** wire the player into the jukebox: `room` is the jukebox's reverb */
export function initRecords(room: AudioNode): void {
  const A = au.A!,
    hp = A.createBiquadFilter(),
    lp = A.createBiquadFilter(),
    send = A.createGain();
  el = new Audio();
  el.preload = "auto";
  hp.type = "highpass";
  hp.frequency.value = 60;
  lp.type = "lowpass";
  lp.frequency.value = 9000;
  send.gain.value = 0.45;
  A.createMediaElementSource(el).connect(hp).connect(lp).connect(au.music);
  lp.connect(send).connect(room);
}

export function playRecord(r: Record_, onEnd: () => void): void {
  if (!el) return;
  el.src = "music/" + r.file;
  el.onended = onEnd;
  want = true;
  el.play().catch(() => void 0); // refused before the first press: wake() tries again on the next one
}
export function stopRecord(): void {
  want = false;
  el?.pause();
}
/** inside a press: a phone that refused the record earlier lets it play now */
export function wake(): void {
  if (el && want && el.paused) el.play().catch(() => void 0);
}
