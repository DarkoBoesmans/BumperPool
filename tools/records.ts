// Fetches the jukebox records from incompetech.com (Kevin MacLeod, CC BY 4.0) and makes them jukebox-sized:
// mono, 48 kbps, at most 3.5 minutes with a fade. Run it once after changing the list in src/data/records.ts:
//   bun tools/records.ts
// Needs ffmpeg. The licence asks for the credit and the changes to be named: legal.html does both.
import { RECORDS } from "../src/data/records";
import { existsSync } from "node:fs";

const SRC = "https://incompetech.com/music/royalty-free/mp3-royaltyfree/";
const MAX = 210; // seconds

for (const r of RECORDS) {
  const out = `music/${r.file}`;
  if (existsSync(out)) continue;
  const res = await fetch(SRC + encodeURIComponent(r.source));
  if (!res.ok) throw new Error(`${r.source}: ${res.status}`);
  const tmp = `/tmp/record-${r.file}`;
  await Bun.write(tmp, await res.arrayBuffer());
  const len = +(await Bun.$`ffprobe -v error -show_entries format=duration -of csv=p=0 ${tmp}`.text());
  const end = Math.min(len, MAX),
    fade = len > MAX ? `,afade=t=out:st=${end - 4}:d=4` : "";
  await Bun.$`ffmpeg -v error -y -i ${tmp} -t ${end} -af aresample=44100${fade} -ac 1 -b:a 48k ${out}`;
  console.log(`${out}  ${Math.round(end)} s`);
}
