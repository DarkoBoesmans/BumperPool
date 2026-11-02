# Tjoepbiljart

Belgian tap billiards (golfbiljart) in browser. Rules: GZV spelreglement 2026-2027 + standaardnormen, NLGB line drawing. Low-poly PS2 café, San Andreas-style people. Source text English, shown in Vlaams, English, Oilsjters. Game name Tjoepbiljart never translated (`translate="no"`). Not affiliated with GZV/NLGB: no federation or real brand names in game.

## Stack
- TypeScript strict, three.js 0.128.0 from npm, Dart Sass, bun. Only open source, local tools.
- `bun run dev` watch server, `bun run build` to `dist/` (index.html, legal.html + legal.js, 404.html, og.jpg, robots.txt, sitemap.xml, music/, licenses/), `bun run check` tsc, `bun test`, `bun run format` prettier.
- Page markup in `html/` partials, pulled into `index.html` by `<!-- include: html/x.html -->` at build. No inline styles except data-driven CSS vars.
- GitHub Pages via `.github/workflows/pages.yml` (Source: GitHub Actions): https://darkoboesmans.github.io/BumperPool/. PRs run check/test/build; deploy only from `main`. Actions pinned to SHA + tag comment.

## Code
- KISS. Small files, aim under 300 lines. No abstraction with one user.
- `src/core/` = rules + physics, no DOM, no three.js. Tests import it directly.
- Units: mm, mm/s, s; three.js scene in metres (`M`, `V()`).
- Power = ball speed, four equal meter quarters (`src/core/power.ts`). Hard = over 1.5 m/s. Pull measured on screen.
- House rules: `G.rules` (`src/core/rules.ts`). Story always `REGLEMENT`. House-rule games = friendly, no record.
- Every regular has own bar (`src/data/venues-street.ts`, `venues-grand.ts`), own table, own trophy (`src/data/trophies.ts`).
- Story needs a made player first (`me.made`, gate in `src/ui/menu.ts`).
- Online: Supabase Realtime (`src/net/supa.ts`, project fikiiwkgyiljsnxcaagj, Frankfurt), public channels, nothing stored. Café = channel `tjoep:cafe:CODE` (Broadcast `state`/`emote`, Presence members, max 4); open cafés = Presence on `tjoep:lobby`. Leader (first in) seats people, board = chalk queue, doubles = seats 2/3 partners (`core/doubles.ts`). Full-state sync, shooter decides. Test with Chromium through the agent proxy (`proxy`, route the game from `dist/`).
- Deliberate shortcut or calibration guess: `ponytail:` comment with ceiling + upgrade path.
- Every rule or physics change: one test in `test/`.
- Text: every shown string through `t("English {name}", vars)` (`src/i18n`). Referee log stores key + `v`, HUD translates (`tLog`). Lines in `src/i18n/sheets/*.txt` (`=` en, `v` Vlaams, `a` Oilsjters, `a ~` same). Legal sheet Vlaams only. `bun tools/i18n-keys.ts` prints missing lines; `test/i18n.test.ts` checks. Dynamic text: redraw on `onLang`.
- Phone: HUD sits beside table, camera frames table in free room (`src/ui/room.ts`). New fixed HUD block: add to `BLOCKS`. Desktop top view: rail + spin pad push sides in. Upright phone = `upright` mixin.
- Knock = thanks for a trick shot only (`trickOf` in `src/core/verdict.ts`). Ball pick = ray against balls (`rayPick`, `src/render/camera.ts`), works at any tilt.
- Camera: drag off your balls or right-drag turns, keys in `src/game/keys.ts` (Q/E R/F +/-). Free view eases in spherical terms (`view` in `camera.ts`), view changes via `setView` (a replay keeps them). Camera input waits while a replay plays. First games: coach card (`src/ui/coach.ts`, `me.tips.camera`).
- Title screen (`src/ui/title.ts`): its press = the browser's first gesture, starts audio. Jukebox: records (`src/data/records.ts`, Kevin MacLeod CC BY 4.0, `bun tools/records.ts` fetches into `music/`, credits in `legal.html`), crate per bar mood, or the house trio (synth, `songs.ts`). New record: `onSong` listeners, title card `src/ui/nowplaying.ts`.
- Home café: `goHome()` (`src/game/flow.ts`) = home venue + beaten regulars on bar stools (`src/cafe/guests.ts`); landlord frame + photo wall boards. PS1 look: vertex snap patched into every material (`renderer.ts`), only vertices in front of the camera, grid 480 to 160 lines (75 = 240).
- Café sound: recorded beds per mood (`src/data/beds.ts`, BigSoundBank CC0, `bun tools/beds.ts` fetches into `music/`, credits in `legal.html`), looped with overlapping soft edges (`src/audio/beds.ts`). No synthesised noise.
- Pint between shots: model in `src/core/tap.ts` (tested), dialog `src/ui/tap.ts` + `html/tap.html`, offered on the regular's turn (`maybeOrder`), max two per match, pauses the game (`blocked()`), tips in tokens. First step of the landlord evening.
- Many small static meshes of one kind: merge them with vertex colours (`src/cafe/bottles.ts`).
- Reduced motion: `calm` (`src/render/renderer.ts`): no drift, still grain, no ambient smoke. CSS: `calm` mixin.

## Styles
- `styles/` ITCSS layers: settings, tools, generic, elements, objects (`o-`), components (`c-`), utilities (`u-`).
- BEM: `c-block__element--modifier`. State: `is-` classes.
- Start menu: one fixed panel height, nothing jumps on select. One scroller per view (`c-view__body`, shop grid) with `more-below` fade. Hover = motion (lift, slide, bar), never colour alone.

## Privacy, a11y
- No cookies, analytics, ads, third-party scripts or embeds. Only `tjoepbiljart.*` localStorage via `src/profile/store.ts` (strictly necessary; old `golfbiljart.*` moved once). New storage or tracking: update `legal.html` first, ask consent if not strictly necessary.
- Keep menus keyboard + screen-reader friendly; run axe-core on every view after UI changes. Text contrast AA.
- Security: build adds CSP meta (artifact build `NO_CSP=1`, host injects its own script). Escape every value put in `innerHTML` (`esc`), translations too. Every online message passes `src/net/sane.ts`. CSP `connect-src` allows only the Supabase host. Console handle localhost only.

## Release
- Every version: bump `package.json` version, `bun run check && bun test && bun run build`, branch + PR, green CI, user merges (Pages deploys). Artifact: `NO_CSP=1 bun run build`, publish `dist/`. Local `Documents/Bumper Pool` is a git clone: user runs `git pull` (Windows Controlled Folder Access blocks overwrites from the device shell). Version shows under main menu (`v%VERSION%` filled by build).
- Never commit unless asked. GitHub: `DarkoBoesmans/BumperPool`, branch first, PR to `main`. Never push `.claude/`.

## Text
- No em-dash anywhere. Metric units.
