// The three languages: every English text the game shows has a Vlaams and an Oilsjters line in the sheets, every
// sheet line still belongs to a text in the game, and a translation keeps the {placeholders} the code fills in.
import { expect, test } from "bun:test";
import { allKeys, areaOf } from "../tools/i18n-keys";
import { AAL, SHEETS, VLS } from "../src/i18n/dicts";

const holes = (s: string) =>
  [...s.matchAll(/\{\w+\}/g)]
    .map((m) => m[0])
    .sort()
    .join(" ");

test("every text has a Vlaams and an Oilsjters line, and no line is left over", async () => {
  const { keys, warnings } = await allKeys();
  expect(warnings).toEqual([]); // a key built with ${} can't be looked up: use {placeholders}
  expect([...keys.keys()].filter((k) => !(k in VLS))).toEqual([]);
  // Oilsjters has its own line for everything but the small print, which it reads in Vlaams
  const own = new Set<string>();
  for (const sheet of Object.values(SHEETS)) {
    let en = "";
    for (const line of sheet.split("\n"))
      if (line.startsWith("= ")) en = line.slice(2).trim();
      else if (line.startsWith("a ")) own.add(en);
  }
  expect([...keys.keys()].filter((k) => areaOf(keys.get(k)!) !== "legal" && !own.has(k))).toEqual([]);
  expect(Object.keys(VLS).filter((k) => !keys.has(k))).toEqual([]);
});

test("translations keep their placeholders, use no em-dash and appear once", () => {
  const wrong = [VLS, AAL].flatMap((d) =>
    Object.entries(d).filter(([en, tr]) => !tr || holes(en) !== holes(tr) || tr.includes("—")),
  );
  expect(wrong).toEqual([]);
  const english = Object.values(SHEETS).flatMap((s) => [...s.matchAll(/^= (.*)$/gm)].map((m) => m[1].trim()));
  expect(english.filter((k, i) => english.indexOf(k) !== i)).toEqual([]);
});
