// Builds the game into dist/: the TypeScript bundled by Bun, the SCSS compiled by Dart Sass, the page and the fonts.
// `bun run build` for the site, tools/dev.ts calls it again whenever a file changes.
import * as sass from "sass";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

export const OUT = "dist";

/** `<!-- include: html/x.html -->` pulls in a part of the page, so no HTML file grows past a few hundred lines */
const INCLUDE = /^[ \t]*<!-- include: (\S+) -->\n?/gm;
async function page(file: string): Promise<string> {
  const text = await readFile(file, "utf8"),
    parts = await Promise.all([...text.matchAll(INCLUDE)].map((m) => page(m[1])));
  let i = 0;
  return text.replace(INCLUDE, () => parts[i++]);
}

/** only our own files may run or load; inline styles carry the data-driven colours. The copy published inside Claude
 * skips it (NO_CSP=1), since that host adds its own script to the page for online play. */
const CSP =
  `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; ` +
  `style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; ` +
  `object-src 'none'; base-uri 'none'; form-action 'none'" />`;

export async function buildAll({ minify = true } = {}): Promise<boolean> {
  const t0 = performance.now();
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  const js = await Bun.build({
    entrypoints: ["src/main.ts"],
    outdir: OUT,
    naming: "main.js",
    target: "browser",
    minify,
    sourcemap: minify ? "none" : "linked",
  });
  if (!js.success) {
    for (const l of js.logs) console.error(l);
    return false;
  }
  try {
    const css = sass.compile("styles/main.scss", { style: minify ? "compressed" : "expanded", sourceMap: false });
    await writeFile(`${OUT}/style.css`, css.css);
  } catch (e) {
    console.error((e as Error).message);
    return false;
  }
  // three.js is MIT: its notice goes with the bundle, the full text next to it
  const main = `${OUT}/main.js`;
  await writeFile(
    main,
    "/*! Includes three.js r128, (c) 2010-2021 three.js authors, MIT licence: licenses/three.txt */\n" +
      (await readFile(main, "utf8")),
  );
  await mkdir(`${OUT}/licenses`, { recursive: true });
  await cp("node_modules/three/LICENSE", `${OUT}/licenses/three.txt`);
  // the version from package.json goes on the page: the published game and your local build compare at a glance
  const { version } = JSON.parse(await readFile("package.json", "utf8"));
  for (const file of ["index.html", "legal.html"]) {
    let html = (await page(file)).replaceAll("%VERSION%", version);
    if (!process.env.NO_CSP) html = html.replace('<meta charset="utf-8" />', `<meta charset="utf-8" />\n    ${CSP}`);
    await writeFile(`${OUT}/${file}`, html);
  }
  await cp("fonts", `${OUT}/fonts`, { recursive: true });
  console.log(`built ${OUT}/ in ${Math.round(performance.now() - t0)} ms`);
  return true;
}

if (import.meta.main) process.exit((await buildAll()) ? 0 : 1);
