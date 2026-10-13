// Three languages: Vlaams, English and Oilsjters (the dialect of Aalst). Every text in the code is English and goes
// through t(); the dictionaries in vls/ and aal/ map that English to the other two. A line missing in Oilsjters falls
// back to Vlaams, one missing in Vlaams to English. The game's name, Tjoepbiljart, is never translated.
// dom.ts translates the page itself; test/i18n.test.ts checks that every text has both translations.
import { load, save } from "../profile/store";
import { VLS, AAL } from "./dicts";
import { fill, type Vars } from "./fill";

export type Lang = "vls" | "en" | "aal";
/** in the order of the picker, each name in its own language */
export const LANGS: { id: Lang; name: string; html: string }[] = [
  { id: "vls", name: "Vlaams", html: "nl-BE" },
  { id: "en", name: "English", html: "en" },
  { id: "aal", name: "Oilsjters", html: "nl-BE" },
];
const DICT: Record<Lang, Record<string, string>> = { en: {}, vls: VLS, aal: AAL };

const saved = load("lang") as Lang | null;
export let lang: Lang =
  saved && saved in DICT ? saved : /^nl\b/i.test(globalThis.navigator?.language || "") ? "vls" : "en";

/** the text in the current language, with {name} placeholders filled in from vars */
export function t(en: string, vars?: Vars): string {
  return fill((lang === "en" ? undefined : (DICT[lang][en] ?? VLS[en])) ?? en, vars);
}

/** a referee's log line: its text values are English too (a foul's title, a power), so they are translated as well.
 * ponytail: a player named like a dictionary key ("Goal") gets translated too; harmless, tag the values if it bites */
export const tLog = (en: string, vars?: Vars): string =>
  t(en, vars && Object.fromEntries(Object.entries(vars).map(([k, x]) => [k, typeof x === "string" ? t(x) : x])));

const listeners: (() => void)[] = [];
/** run again whenever the language changes: views redraw their dynamic text */
export const onLang = (f: () => void): void => void listeners.push(f);
export function setLang(l: Lang): void {
  if (l === lang) return;
  lang = l;
  save("lang", l);
  for (const f of listeners) f();
}
