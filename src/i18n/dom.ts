// Translates the page's own text: every text node and the aria-label, title and placeholder attributes, looked up by
// their English (whitespace squeezed). Each spot remembers its English and what it last wrote, so switching back and
// forth always starts from the source. Text the code wrote since (already in some language) is traced back to its
// English first. Anything under translate="no" stays as it is (the game's name, the language names, song titles).
import { LANGS, lang, t } from "./index";
import { squeeze, wordy } from "./fill";
import { AAL, VLS } from "./dicts";

const ATTRS = ["aria-label", "title", "placeholder"];
const memo = new WeakMap<object, Record<string, { en: string; out: string }>>();
let back: Map<string, string> | null = null;

/** the English behind a text: itself when it is English, else the key whose Vlaams or Oilsjters reads like this */
function english(s: string): string {
  if (s in VLS) return s;
  if (!back) {
    back = new Map();
    for (const d of [VLS, AAL]) for (const [en, tr] of Object.entries(d)) if (!back.has(tr)) back.set(tr, en);
  }
  return back.get(s) ?? s;
}

/** a text with its outer whitespace kept and the inside swapped */
const keep = (s: string, inside: string) => s.match(/^\s*/)![0] + inside + s.match(/\s*$/)![0];

/** the text for one spot (a text node, or an attribute of an element) in the current language */
function translated(owner: object, slot: string, now: string): string {
  const m = memo.get(owner) || {};
  if (!m[slot] || m[slot].out !== now) m[slot] = { en: keep(now, english(squeeze(now))), out: now }; // new, or rewritten since
  const key = squeeze(m[slot].en);
  m[slot].out = wordy(key) ? keep(m[slot].en, t(key)) : m[slot].en;
  memo.set(owner, m);
  return m[slot].out;
}

export function translateDom(root: ParentNode = document.body): void {
  document.documentElement.lang = LANGS.find((l) => l.id === lang)!.html;
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    if (n.parentElement?.closest("[translate=no], script, style, kbd")) continue;
    const out = translated(n, "text", n.nodeValue || "");
    if (out !== n.nodeValue) n.nodeValue = out;
  }
  for (const el of root.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(","))) {
    if (el.closest("[translate=no]")) continue;
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      const now = el.getAttribute(a)!,
        out = translated(el, a, now);
      if (out !== now) el.setAttribute(a, out);
    }
  }
}
