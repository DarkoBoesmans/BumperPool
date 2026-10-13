# Security

Tjoepbiljart is a static page: no server, no accounts, nothing about players is sent anywhere.

## Report a problem

Use the repository's **Security** tab, **Report a vulnerability**, so it stays private until it is fixed. Please do not open a public issue for it.

## What is in place

- A Content Security Policy on the published site: only the game's own scripts, styles, images and fonts load
- Online play is switched off; when it returns, table updates are checked before they reach the game (`src/net/sane.ts`)
- Everything put on the page with `innerHTML` is escaped, and translations only ever go in as text
- The frame loop survives a bad frame, so one error never freezes the game
- The console handle `tjoepbiljart` only exists on a local build
- GitHub Actions are pinned to commits with read-only permissions by default; Dependabot keeps them and the dev tools current
- Secret scanning with push protection is on for the repository

## Out of scope

Progress lives in your own browser's local storage. Changing it there only changes your own game.
