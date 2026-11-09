// Fetches the café's sound beds from BigSoundBank (CC0) and makes them loop-ready: mono, the rumble and the mains hum
// cut, the level evened out and set to -24 LUFS, with a soft fade at each end (the mixer cross-fades loop into loop).
// Run it once after changing src/data/beds.ts:
//   bun tools/beds.ts
// Needs ffmpeg.
import { BEDS, EDGE } from "../src/data/beds";
import { existsSync } from "node:fs";

const SRC = "https://bigsoundbank.com/UPLOAD/ogg/";
const CLEAN = [
  "highpass=f=110:p=2",
  "equalizer=f=100:t=q:w=8:g=-18", // mains hum
  "equalizer=f=1917:t=q:w=10:g=-8", // a whine in the brunch room
  "lowpass=f=7500",
  "dynaudnorm=f=500:g=15:m=12", // evens out the room: who sits close to the microphone, a lull between tables
].join(",");

for (const b of Object.values(BEDS)) {
  const out = `music/${b.file}`;
  if (existsSync(out)) continue;
  const res = await fetch(`${SRC}${b.source}.ogg`);
  if (!res.ok) throw new Error(`${b.source}: ${res.status}`);
  const src = `/tmp/bed-${b.source}.ogg`,
    mid = `/tmp/bed-${b.source}.wav`;
  await Bun.write(src, await res.arrayBuffer());
  // cleaned with 8 s to spare at each end, so the leveller has settled where the loop starts and ends
  const pad = Math.min(8, b.from),
    trim = `atrim=start=${pad}:end=${pad + b.len},asetpts=PTS-STARTPTS`;
  await Bun.$`ffmpeg -v error -y -ss ${b.from - pad} -t ${b.len + 2 * pad} -i ${src} -ac 1 -ar 22050 -af ${CLEAN + "," + trim} ${mid}`;
  const meter = await Bun.$`ffmpeg -nostats -i ${mid} -af ebur128=framelog=quiet -f null - 2>&1`.text(),
    lufs = +[...meter.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].at(-1)![1], // the summary at the end
    fade = `afade=t=in:d=${EDGE}:curve=qsin,afade=t=out:st=${b.len - EDGE}:d=${EDGE}:curve=qsin`;
  await Bun.$`ffmpeg -v error -y -i ${mid} -af volume=${-24 - lufs}dB,${fade} -b:a 48k ${out}`;
  console.log(`${out}  ${b.len} s  (was ${lufs} LUFS)`);
}
