# Golfbiljart

Belgian tap billiards in browser. Rules: GZV spelreglement 2026-2027 + standaardnormen, NLGB line drawing. Low-poly PS2 café, San Andreas-style people. All in-game text English. Not affiliated with GZV/NLGB: no federation or real brand names in game.

## Stack
- TypeScript strict, three.js 0.128.0 from npm, Dart Sass, bun. Only open source, local tools.
- `bun run dev` watch server, `bun run build` to `dist/` (index.html, legal.html, licenses/), `bun run check` tsc, `bun test`, `bun run format` prettier.
- GitHub Pages via `.github/workflows/pages.yml` (Source: GitHub Actions).

## Code
- KISS. Small files, aim under 300 lines. No abstraction with one user.
- `src/core/` = rules + physics, no DOM, no three.js. Tests import it directly.
- Units: mm, mm/s, s; three.js scene in metres (`M`, `V()`).
- Power = ball speed, four equal meter quarters (`src/core/power.ts`). Hard = over 1.5 m/s. Pull measured on screen.
- House rules: `G.rules` (`src/core/rules.ts`). Story always `REGLEMENT`. House-rule games = friendly, no record.
- Every regular has own bar (`src/data/venue-list.ts`) and own table.
- Deliberate shortcut or calibration guess: `ponytail:` comment with ceiling + upgrade path.
- Every rule or physics change: one test in `test/`.
- Phone: HUD sits beside table, camera frames table in free room (`src/ui/room.ts`). New fixed HUD block: add to `BLOCKS`. Upright phone = `upright` mixin.

## Styles
- `styles/` ITCSS layers: settings, tools, generic, elements, objects (`o-`), components (`c-`), utilities (`u-`).
- BEM: `c-block__element--modifier`. State: `is-` classes.

## Privacy, a11y
- No cookies, analytics, ads, third-party scripts or embeds. Only `golfbiljart.*` localStorage (strictly necessary). New storage or tracking: update `legal.html` first, ask consent if not strictly necessary.
- Keep menus keyboard + screen-reader friendly; run axe-core on every view after UI changes. Text contrast AA.

## Release
- Every version: bump `package.json` version, `bun run check && bun test && bun run build`, publish `dist/` to artifact, copy source to user's local `Documents/Bumper Pool` (linked device folder), verify checksums match. Version shows under main menu (`v%VERSION%` filled by build).
- Never commit unless asked. GitHub: `DarkoBoesmans/BumperPool`, branch first, PR to `main`. Never push `.claude/`.

## Text
- No em-dash anywhere. Metric units.
