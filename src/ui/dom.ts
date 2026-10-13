// Tiny DOM helpers.
export const $ = <T extends HTMLElement = HTMLElement>(s: string, root: ParentNode = document): T =>
  root.querySelector(s) as T;
export const $$ = <T extends HTMLElement = HTMLElement>(s: string, root: ParentNode = document): T[] => [
  ...root.querySelectorAll<T>(s),
];
export const esc = (s: unknown): string =>
  String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch] as string);
export const cap = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);
/** first name only: "Matthis Maes" is "Matthis" */
export const first = (s: string): string => String(s).trim().split(/\s+/)[0];
/** restart a CSS animation by toggling a class */
export function replay(el: HTMLElement, cls: string): void {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}
