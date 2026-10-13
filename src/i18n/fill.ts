// The pure text helpers: filling {name} placeholders and squeezing page text. No dictionaries, no DOM, so the
// referee's log, the key list (tools/i18n-keys.ts) and the tests use them too.
export type Vars = Record<string, string | number>;

export const fill = (s: string, v?: Vars): string =>
  v ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m)) : s;

/** how the page's own text is looked up: whitespace squeezed, and only text with a word in it */
export const squeeze = (s: string): string => s.replace(/\s+/g, " ").trim();
export const wordy = (s: string): boolean => /[A-Za-z]{2}/.test(s);
