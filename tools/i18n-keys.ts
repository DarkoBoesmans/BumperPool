// Every English text the game can show, found in the source: what goes into t(), tLog() and say(), the referee's log
// lines, the banners, the text fields of the data files and the page's own text (as translateDom sees it).
// test/i18n.test.ts checks both dictionaries cover them. `bun tools/i18n-keys.ts` prints what is missing, per sheet.
import ts from "typescript";
import { Glob } from "bun";
import { squeeze, wordy } from "../src/i18n/fill";

/** calls whose arguments (by position) are English keys */
const CALLS: Record<string, number[]> = {
  t: [0],
  tr: [0],
  tLog: [0, 1],
  say: [1],
  log: [2, 3],
  banner: [1, 3],
  trophy: [2, 3],
  disc: [2],
};
/** in the data files, the fields that hold text (a regular's name and ids stay as they are) */
const PROPS = new Set(
  "nick style bio strong weak hello goal foul oppGoal oppFoul win lose name tagline marquee desc label title text place why next sub word W R".split(
    " ",
  ),
);
const DATA = /^src\/(data\/|core\/(fouls|powers|rules|power|table)\.ts|ui\/(tutorial|settings)\.ts)/;
const PEOPLE = /^src\/data\/regulars\//;

/** which sheet (src/i18n/sheets/<name>.txt) a key's lines go in, by the file it comes from */
export function areaOf(file: string): string {
  const grade = file.match(/regulars\/(\w+)\.ts$/);
  if (grade) return `regulars/${grade[1]}`;
  if (/^(legal\.html|src\/legal\.ts)$/.test(file)) return "legal";
  if (/^src\/data\/(shop|trophies)/.test(file)) return "shop";
  if (/^src\/data\/venue/.test(file)) return "bars";
  if (/^src\/(data\/(story|grades)|ui\/(story|tutorial|grades|roster|scout))\.ts$/.test(file)) return "story";
  if (/^src\/core\//.test(file)) return "referee";
  if (/^src\/(cafe|render)\//.test(file)) return "cafe";
  if (/^(src\/ui\/settings\.ts|src\/audio\/|src\/data\/records\.ts|html\/settings\.html)/.test(file)) return "settings";
  if (/^(src\/game\/(show|buzz)|src\/ui\/(endcard|replay-overlay|banner)|html\/show)/.test(file)) return "show";
  if (/^(src\/(game|replay|cpu)\/|src\/ui\/(hud|status|live|spinpad|bubble)\.ts|html\/hud\.html)/.test(file))
    return "table";
  return "menu";
}

/** the text a literal or a simple template stands for, with consts from the same file filled in */
function textOf(n: ts.Node, sf: ts.SourceFile): string | null {
  if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) return n.text;
  if (ts.isTemplateExpression(n)) {
    let s = n.head.text;
    for (const span of n.templateSpans) {
      const v = ts.isIdentifier(span.expression) ? constOf(span.expression.text, sf) : null;
      if (v === null) return null;
      s += v + span.literal.text;
    }
    return s;
  }
  return null;
}
function constOf(name: string, sf: ts.SourceFile): string | null {
  let out: string | null = null;
  sf.forEachChild(function walk(n) {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === name && n.initializer)
      out = textOf(n.initializer, sf);
    else n.forEachChild(walk);
  });
  return out;
}

/** the texts an expression can end up as: both sides of a ?:, either side of || and ??, every entry of a list */
function values(n: ts.Node, sf: ts.SourceFile, add: (s: string) => void, warn: (n: ts.Node) => void): void {
  const s = textOf(n, sf);
  if (s !== null) return add(s);
  if (ts.isTemplateExpression(n)) return warn(n);
  if (ts.isParenthesizedExpression(n) || ts.isAsExpression(n)) return values(n.expression, sf, add, warn);
  if (ts.isConditionalExpression(n)) {
    values(n.whenTrue, sf, add, warn);
    values(n.whenFalse, sf, add, warn);
  } else if (
    ts.isBinaryExpression(n) &&
    [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(n.operatorToken.kind)
  ) {
    values(n.left, sf, add, warn);
    values(n.right, sf, add, warn);
  } else if (ts.isArrayLiteralExpression(n)) n.elements.forEach((e) => values(e, sf, add, warn));
  else if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === "pick")
    n.arguments.forEach((a) => values(a, sf, add, warn));
}

const calleeName = (e: ts.Expression): string =>
  ts.isIdentifier(e) ? e.text : ts.isPropertyAccessExpression(e) ? e.name.text : "";

/** every key in the code, with the file it came from */
export async function codeKeys(): Promise<{ keys: Map<string, string>; warnings: string[] }> {
  const keys = new Map<string, string>(),
    warnings: string[] = [];
  for await (const file of new Glob("src/**/*.ts").scan(".")) {
    if (/^src\/(net|i18n)\//.test(file)) continue; // ponytail: online play is off and untranslated until it is back
    const sf = ts.createSourceFile(file, await Bun.file(file).text(), ts.ScriptTarget.Latest, true),
      add = (s: string) => {
        const k = squeeze(s);
        if (wordy(k.replace(/\{\w+\}/g, "")) && !keys.has(k)) keys.set(k, file);
      },
      warn = (n: ts.Node) =>
        warnings.push(`${file}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1} ${n.getText().slice(0, 60)}`);
    sf.forEachChild(function walk(n) {
      if (ts.isCallExpression(n)) {
        const at = CALLS[calleeName(n.expression)];
        if (at) for (const i of at) if (n.arguments[i]) values(n.arguments[i], sf, add, warn);
        // labels set from code, which translateDom picks up: el.setAttribute("aria-label", "…")
        const [attr, val] = n.arguments;
        if (
          calleeName(n.expression) === "setAttribute" &&
          attr &&
          /^(aria-label|title|placeholder)$/.test(textOf(attr, sf) || "")
        )
          values(val, sf, add, warn);
      }
      if (
        DATA.test(file) &&
        ts.isPropertyAssignment(n) &&
        PROPS.has(n.name.getText()) &&
        !(PEOPLE.test(file) && n.name.getText() === "name")
      )
        values(n.initializer, sf, add, warn);
      n.forEachChild(walk);
    });
  }
  return { keys, warnings };
}

/** text that reads the same in every language: rule codes, the version, the picture preset */
const RAW = /^(SP\/[\d.]+|v%VERSION%|PS2)$/;
const VOID = new Set("area base br col embed hr img input link meta source track wbr".split(" "));
/** one page file's own text, the way translateDom walks it: text nodes and three attributes, outside translate="no".
 * Each part of the page (html/) is read on its own, so a key knows which part it comes from. */
export async function pageKeys(file: string): Promise<Set<string>> {
  let html = (await Bun.file(file).text()).replace(/<!--[\s\S]*?-->/g, "");
  if (html.includes("<body")) html = html.slice(html.search(/<body\b/), html.search(/<\/body>/)); // the body only
  const keys = new Set<string>(),
    stack: { tag: string; skip: boolean }[] = [];
  const skipping = () => stack.some((e) => e.skip);
  const add = (s: string) => {
    const k = squeeze(
      s
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&\w+;/g, "·"),
    );
    if (wordy(k) && !RAW.test(k)) keys.add(k);
  };
  let last = 0;
  for (const m of html.matchAll(/<(\/?)([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g)) {
    if (!skipping()) add(html.slice(last, m.index));
    last = m.index! + m[0].length;
    const [, close, tag, attrs] = m,
      name = tag.toLowerCase();
    if (close) {
      const i = stack.map((e) => e.tag).lastIndexOf(name);
      if (i >= 0) stack.length = i;
      continue;
    }
    const skip = /\btranslate="no"/.test(attrs) || ["script", "style", "kbd"].includes(name);
    if (!skip && !skipping()) for (const a of attrs.matchAll(/\b(aria-label|title|placeholder)="([^"]*)"/g)) add(a[2]);
    if (!VOID.has(name) && !attrs.trim().endsWith("/")) stack.push({ tag: name, skip });
    if (name === "script" || name === "style") {
      const end = html.indexOf(`</${name}`, last);
      last = end < 0 ? html.length : end;
    }
  }
  return keys;
}

/** every key, with the file it came from: the code first, then the parts of the game's page and the small print */
export async function allKeys(): Promise<{ keys: Map<string, string>; warnings: string[] }> {
  const { keys, warnings } = await codeKeys(),
    pages = ["index.html", ...[...new Glob("html/**/*.html").scanSync(".")].sort(), "legal.html"];
  for (const file of pages) for (const k of await pageKeys(file)) if (!keys.has(k)) keys.set(k, file);
  return { keys, warnings };
}

if (import.meta.main) {
  // the keys without a line in the sheets, ready to paste: under "# sheet: <name>"
  const { keys, warnings } = await allKeys(),
    { VLS, AAL } = await import("../src/i18n/dicts");
  for (const w of warnings) console.warn("dynamic key, use {placeholders}:", w);
  const bySheet: Record<string, string[]> = {};
  for (const [k, file] of keys)
    if (!(k in VLS) || (!(k in AAL) && areaOf(file) !== "legal"))
      (bySheet[areaOf(file)] ??= []).push(`= ${k}\nv \na \n`);
  for (const [sheet, lines] of Object.entries(bySheet)) console.log(`# sheet: ${sheet}\n\n${lines.join("\n")}`);
  console.log(`# ${keys.size} keys`);
}
