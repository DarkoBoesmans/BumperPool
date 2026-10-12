// Builds the game into dist/: the TypeScript bundled by Bun, the SCSS compiled by Dart Sass, the page and the fonts.
// `bun run build` for the site, tools/dev.ts calls it again whenever a file changes.
import * as sass from "sass";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

export const OUT = "dist";

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
  for (const page of ["index.html", "legal.html"])
    await writeFile(`${OUT}/${page}`, (await readFile(page, "utf8")).replaceAll("%VERSION%", version));
  await cp("fonts", `${OUT}/fonts`, { recursive: true });
  console.log(`built ${OUT}/ in ${Math.round(performance.now() - t0)} ms`);
  return true;
}

if (import.meta.main) process.exit((await buildAll()) ? 0 : 1);
