# Golfbiljart

Belgian tap billiards in the browser, set in a smoky low-poly café with a PS2 look. The rules follow the GZV spelreglement 2026-2027 and the table follows the GZV standaardnormen and the NLGB line drawing. [RULES.md](RULES.md) lists every article and how the referee handles it.

- Five balls each, eight rubber posts, one goal at each end with a lip behind the hole that catches hard balls, best of three games
- **Story, The Newcomer**: you walk into town where nobody knows you and beat the regulars one by one, each in their own bar, from an old brown café up to a live TV studio. A counter shows how many of the eighteen you have beaten
- **Freeplay**: rematch any regular you have already beaten, by the book or with house rules. Some shop items can only be earned here
- **Shop**: cues, clothes, hats, accessories, tables and bars, looks only. Matches pay tokens
- Every regular has a bar and a table of their own: fifteen bars plus the three legends' halls
- The better the regular, the less the game helps you: the lines on the cloth, the aim line, the ghost ball and the foul warnings go one by one
- Make your own player: body, frame, skirt or trousers, thirteen hair styles, makeup, glasses, jewellery, hats
- Players walk round the table, lean over the rail and hold the cue for every shot. Lose 5-0 and you crawl under the table, and your name goes on the Wall of Shame
- Whisky blurs your view but your aim line reaches further. Cigars fill the room with smoke. Chalk gives full spin without a miscue, but chalk dust makes your ball cling
- Knock on the table to thank it right after a goal; after a lucky one, tradition says you must
- A referee that explains every foul in plain words, goal cam and foul cam replays, an end card after every game
- Synthesised sound and a jazz jukebox that improvises seven original tunes
- Plays on a phone, upright or on its side: the controls move beside the table, and the camera frames the table in the room they leave
- Rumour has it an old arcade poster on the wall knows a code

**Play it:** https://darkoboesmans.github.io/BumperPool/ (always the latest version on `main`)

## Run it

Needs Bun 1.2 or newer.

```bash
bun install
bun run dev          # builds to dist/, rebuilds on save, serves http://localhost:5173
```

| Script | Does |
| --- | --- |
| `bun run dev` | Build, watch `src/`, `styles/`, `html/` and the pages, serve `dist/` |
| `bun run build` | Minified build to `dist/` (`main.js`, `style.css`, `index.html`, `legal.html`, `fonts/`, `licenses/`) |
| `bun run check` | TypeScript type check (`tsc --noEmit`, strict) |
| `bun run test` | Referee, physics, CPU brain and profile tests (`bun test`) |
| `bun run format` | Prettier over `src/`, `styles/`, `html/`, `test/`, `tools/` and the two pages |

## GitHub Pages

`.github/workflows/pages.yml` checks every pull request (types, tests, build) and publishes `dist/` on every push to `main`. Repo setting: Settings, Pages, Source: **GitHub Actions**. Dependabot (`.github/dependabot.yml`) opens one update PR a month for the actions and one for the dev tools.

Online play uses Claude's shared artifact storage (`window.claude`), so it only works in the version published inside Claude. Everywhere else the online menu says so and offline play works as usual.

## Power: what is hard?

Power is a ball speed. The further you pull back on screen, the faster, the same from every camera angle. The meter has four equal bands, and the aim line takes the colour of the band you are in. It also shows the speed in m/s and how far the ball would roll on its own.

| Band | Meter | Speed | Rolls about |
| --- | --- | --- | --- |
| Touch | first quarter | under 0.4 m/s | under 0.45 m |
| Soft | second quarter | 0.4 to 0.8 m/s | 0.45 to 1.75 m |
| Medium | third quarter | 0.8 to 1.5 m/s | 1.75 to 6 m |
| Hard | top quarter | 1.5 to 4.5 m/s | over 6 m, more than three table lengths |

SP/7.4 forbids a hard shot straight at the goal from below the shooting line (the corners beside the goal); SP/6.7 forbids a hard flyer from the cushion strip. Hard means over 1.5 m/s. While you aim such a shot the hard part of the meter is striped (not from the Epic grade up: no warnings there).

## Physics

Values based on published measurements for carom balls and cloth. The few that are calibration guesses are marked `ponytail:` in the code (the cushion and post contact heights, chalk grip, miscue chance):

| | Value |
| --- | --- |
| Sliding friction ball on cloth | 0.2 (slide turns to roll after 2/7 of the speed difference) |
| Rolling resistance | 0.01, about 0.1 m/s lost per second |
| Side spin decay | about 11 rad/s² |
| Ball on ball | restitution 0.95, friction 0.05 with throw (about 1 to 2 degrees on a cut) |
| Cushion | restitution 0.86 at walking pace, down to 0.7 when hit hard, friction 0.15, nose 37 mm high |
| Rubber post | restitution 0.75, friction 0.2, ring 35 to 45 mm high |
| Goal lip | a ball heading into the lip behind the hole always drops; one crossing the hole sideways too fast clips the rim and runs on |

The cushion nose and the post ring touch the ball above its centre. That push turns a rolling ball's spin backwards, so it leaves the rubber still rolling at about 0.57 of its speed instead of dying at 0.31. `HZ_BAND` and `HZ_POST` in `src/core/physics.ts` are the knobs if your own table plays livelier or deader.

The constants are in `src/core/power.ts` and `src/core/physics.ts`, the goal and lip in `src/core/table.ts`.

## The regulars

| Grade | Bar | Regulars |
| --- | --- | --- |
| Common | The Old Brown Café | Kevin Kracht, Monique Moens, Wim Wuyts |
| Uncommon | The Golden Cue | Fred Feys, Bart Bauwens, Sofie Segers |
| Rare | Club Midnight | Nina Nuyts, Dirk Dewaele, Lotte Lemmens |
| Epic | The Velvet Room | Rosa Raes, Pieter Peeters, Gust Goossens |
| Legendary | Championship Hall | Baron Bertrand, Cas Claes, Matthis Maes |
| Pearlescent (secret) | their own | Poseidon (high tide), Medusa (stone stare), Thor (thunder) |

The legends each use their power once per game.

## Controls

| Input | Does |
| --- | --- |
| Left-drag a ball | Aim and pull back, release to shoot |
| `B`, `A` `D`, `W` `S`, `Space` | Keyboard aiming: pick a ball, turn (Shift for fine steps), power, shoot. `Esc` lets go |
| Spin pad or arrow keys | Where the tip hits the cue ball, `0` resets |
| Right-drag | Turn the table round the point you look at |
| Right-click | Look at the spot you clicked (the view glides there) |
| Scroll | Zoom towards the pointer |
| Middle-drag, Shift + right-drag | Slide along the table |
| `T`, `P` | Top view, player view |
| `1`, `2`, `3`, `4` | Cigar, whisky, chalk, knock on the table |
| `Esc` | Close a panel or skip a replay |

On a touch screen:

| Touch | Does |
| --- | --- |
| Finger on one of your balls | Aim and pull back, lift to shoot (a second finger cancels) |
| Finger on the cloth | Turn the table |
| Pinch, two fingers | Zoom, slide along the table |
| Tap | Look at that spot, once you have turned the table |
| Eye and top buttons | Back to the player view or the top view |

In Settings, Game: your own player can be shown, see-through when close to the camera, or hidden.

## Code map

TypeScript in `src/`, one job per file, no file much over 300 lines.

| Folder | What lives there |
| --- | --- |
| `src/core/` | Table, power, physics, referee, penalties, powers. No DOM, runs in tests |
| `src/cpu/` | Opponent brain: shot ideas, judged on a copy of the game with the real referee, then a shaky hand |
| `src/data/` | Grades, the regulars (one file per grade), bars, shop items, story chapters |
| `src/profile/` | Your player, record, tokens and items, kept in localStorage |
| `src/render/` | three.js renderer, post-processing, camera, table, cloth, balls, aim line, smoke |
| `src/people/` | Figures, faces, hair and hats, IK arms, walking, the players, the crawl, portraits |
| `src/cafe/` | Room, lamps, bar, booths, venue props, wall boards and posters |
| `src/replay/` | Shot recorder and replay cameras |
| `src/audio/` | Mixer, sound effects, jukebox |
| `src/ui/` | Menus, story, freeplay, maker, shop, HUD, banners, end card, tutorial, settings |
| `src/game/` | Input, game flow, the goal and foul show, the opponent's turn, the frame loop |
| `src/net/` | Online play and the check on every table update |
| `src/main.ts` | Boot and wiring |
| `index.html`, `html/` | The page, put together from parts at build time (`<!-- include: html/hud.html -->`) |
| `styles/` | SCSS in ITCSS layers |
| `test/` | `bun test` suites |
| `tools/` | Build and dev server |

On a local build (`localhost`), the browser console has `golfbiljart`: the app state, the scene, your profile and the live game (`golfbiljart.G`). The published game leaves it out.

### Styles: ITCSS and BEM

`styles/main.scss` pulls the layers in order, from wide reach to narrow:

1. `settings/` tokens: colours, type, spacing, breakpoints
2. `tools/` mixins, no CSS of their own
3. `generic/` fonts and reset
4. `elements/` bare HTML elements
5. `objects/` layout patterns, `o-` prefix (`o-row`, `o-stack`, `o-icon`)
6. `components/` one file per component, `c-` prefix
7. `utilities/` single-purpose helpers, `u-` prefix

Class names are BEM: `c-block__element--modifier`. States are `is-` classes (`is-open`, `is-locked`).

## Privacy, terms and accessibility

`legal.html` (linked under the main menu) has the privacy notice, cookies and storage, data deletion, terms, refunds, accessibility and credits. In short:

- No cookies, no analytics, no ads, no third-party scripts or embeds, no accounts, no e-mail, no payments
- Progress and settings stay in the browser's local storage (`golfbiljart.*`), which is strictly necessary storage: no consent banner needed. Settings, Game, Delete my data wipes it
- Online play (claude.ai copy only) keeps the table, the names typed and the game in the artifact's shared storage
- Menus are keyboard and screen-reader friendly and pass an axe-core audit; aiming works from the keyboard too (`B`, `A` `D`, `W` `S`, `Space`)
- Meant for players aged 16 and over: the café has cigars and whisky

## Security

See [SECURITY.md](SECURITY.md): how to report a problem privately and what is in place (Content Security Policy, checked online updates, pinned actions).

## Licences

three.js (MIT) comes from npm; the build puts its licence in `dist/licenses/three.txt` and a notice at the top of `main.js`. Anton, Chakra Petch, Abril Fatface and Merriweather (SIL OFL 1.1) and Permanent Marker (Apache 2.0) are in `fonts/` with their licences.
