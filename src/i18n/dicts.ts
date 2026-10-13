// The dictionaries: one sheet per part of the game, English with its Vlaams and Oilsjters lines right under it:
//   = English, with {placeholders}
//   v Vlaams
//   a Oilsjters ("a ~" when Oilsjters says it the same as Vlaams)
// The small print (legal.txt) has no Oilsjters lines: legal text stays plain, so Oilsjters reads it in Vlaams.
// Lines starting with # are notes. test/i18n.test.ts lists any English that has no line yet;
// `bun tools/i18n-keys.ts` prints the missing ones ready to paste.
import menu from "./sheets/menu.txt";
import settings from "./sheets/settings.txt";
import table from "./sheets/table.txt";
import show from "./sheets/show.txt";
import referee from "./sheets/referee.txt";
import cafe from "./sheets/cafe.txt";
import shop from "./sheets/shop.txt";
import bars from "./sheets/bars.txt";
import story from "./sheets/story.txt";
import common from "./sheets/regulars/common.txt";
import uncommon from "./sheets/regulars/uncommon.txt";
import rare from "./sheets/regulars/rare.txt";
import epic from "./sheets/regulars/epic.txt";
import legendary from "./sheets/regulars/legendary.txt";
import pearl from "./sheets/regulars/pearl.txt";
import legal from "./sheets/legal.txt";

export const SHEETS: Record<string, string> = {
  menu,
  settings,
  table,
  show,
  referee,
  cafe,
  shop,
  bars,
  story,
  "regulars/common": common,
  "regulars/uncommon": uncommon,
  "regulars/rare": rare,
  "regulars/epic": epic,
  "regulars/legendary": legendary,
  "regulars/pearl": pearl,
  legal,
};
export const VLS: Record<string, string> = {},
  AAL: Record<string, string> = {};

for (const sheet of Object.values(SHEETS)) {
  let en = "";
  for (const line of sheet.split("\n")) {
    const tag = line.slice(0, 2),
      s = line.slice(2).trim();
    if (tag === "= ") en = s;
    else if (tag === "v ") VLS[en] = s;
    else if (tag === "a ") AAL[en] = s === "~" ? VLS[en] : s;
  }
}
for (const en in VLS) AAL[en] ??= VLS[en]; // a line Oilsjters leaves out reads like Vlaams
