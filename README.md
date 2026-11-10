# PPO Engine

PPO Engine replays NHL games and tracks every **power-play opportunity** (PPO): who had the advantage, at what
strength, for how long, and whether they scored. It reads the NHL's play-by-play and shift data, runs its own penalty
engine over the game, and shows the result on an animated rink.

Live site: <https://geosheehan.github.io/ppo-engine/>

It's a React learning project that rebuilds a feature I originally built for a company that supplied power-play stats
to the NHL. The counting follows the NHL's official convention, and the engine's totals are checked against official
box scores.

## What it does

- **Replay** steps through a game play by play, or plays it back live. The rink shows each play, the penalty clocks
  count down, and the score bug and power-play tables update as the game goes.
- **Analysis** charts the whole game on one timeline: every penalty and every change in strength.
- **What if** lets you build a made-up game by placing penalties and goals, and shows how the engine counts it. It's
  the quickest way to see how an edge case is handled.
- **Game picker** in the nav finds any finished NHL game by season, month and day.

The engine covers the rules that change on-ice strength: minors, double minors, majors, match penalties, bench
minors, coincidental and offsetting penalties, delayed penalties, goals that release a penalty early, regular-season
3-on-3 overtime, and shootouts.

## How it fits together

```
NHL APIs ──► Cloudflare Worker ──► React app (GitHub Pages)
             caches finished games     runs the penalty engine
             in KV, rate-limited       in the browser
```

- **`worker/`** is a Cloudflare Worker with two routes, `GET /game/:id` and `GET /schedule/:weekStart`. It serves
  finished games only. The first request for a game fetches it from the NHL and stores it in KV, so the NHL is asked
  for each game once. Rate limits apply both per visitor and to the NHL.
- **`src/`** is the React app. The Worker sends the data untouched, and the app runs the penalty engine on it in the
  browser.

The app is split into layers, and lint stops a layer from importing anything above it:

| Layer            | What's in it                                                           |
| ---------------- | ---------------------------------------------------------------------- |
| `src/domain`     | Game data types, clock math, penalty names. No React.                  |
| `src/engine`     | The penalty engine and power-play counter. No React.                   |
| `src/layout`     | Turns engine output into positions, lanes and scales for drawing.      |
| `src/api`        | Loads games, from the Worker or from local files.                      |
| `src/context`    | React context: the loaded game, and the selected game and replay spot. |
| `src/hooks`      | Replay, playback and other shared hooks.                               |
| `src/components` | UI pieces: rink, penalty clocks, charts, picker.                       |
| `src/views`      | Pages: Replay, Analysis, What if.                                      |

## Running it locally

### Requirements

- Node 24
- npm

### Install

The app and the Worker each have their own packages:

```bash
git clone https://github.com/geosheehan/ppo-engine.git
cd ppo-engine
npm install
cd worker
npm install
cd ..
```

### Start the app

```bash
npm run dev:worker
```

This is the usual way to work on the app. The Worker runs inside the Vite dev server on the same port, so there's no
second server and no CORS setup, and each copy picks a free port. No Cloudflare account is needed.

The local Worker keeps its own KV in `worker/.wrangler/state`. The first time you open a game it's fetched from the
NHL; after that it comes from local KV. Please go easy on it: open games one at a time, and don't script bulk loads.

### Other ways to run it

| Command                 | What it does                                                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`           | Works offline from saved games in `src/data`. That folder is gitignored and starts empty; see below.                                                                    |
| `npm run preview:pages` | Builds the site as it's deployed and serves it at `/ppo-engine/`, using the deployed Worker through a local proxy. Use it to check a production build before deploying. |

### Saved games for offline work

`npm run dev` reads games from two folders:

- `src/data/games/YYYYMMDD-HOMEvAWAY.json`: the game's play-by-play JSON from the NHL, for example
  `20200222-TORvCAR.json`
- `src/data/shifts/YYYYMMDD-HOMEvAWAY-shifts.json`: that game's shift chart JSON

**NHL data is never committed to this repo.** Keep these files on your own machine only.

## Checks

```bash
npm run test:run
```

```bash
npm run lint
```

```bash
npm run format:check
```

Worker tests run on their own:

```bash
cd worker && npm test
```

A pre-commit hook formats and lints staged files, and checks that the Wrangler versions match (see below).

### Wrangler versions

The Cloudflare Vite plugin bundles its own Wrangler, so the Worker's Wrangler is pinned to the same version. Every
Cloudflare package is pinned exactly, and `npm run check:wrangler` fails if they drift apart. To upgrade, bump
`@cloudflare/vite-plugin` first, then match `wrangler` and `@cloudflare/vitest-plugin` in `worker/` to the Wrangler
version it uses. The check's error message explains how.

## Deploying

Deploy the Worker before the site whenever the site depends on a Worker change.

1. **Worker**: run `npm run deploy` in `worker/`. This needs a Cloudflare login (`npx wrangler login`).
2. **Site**: in GitHub, go to Actions → _Deploy to GitHub Pages_ → _Run workflow_. It builds `master` and publishes it
   to GitHub Pages.

## NHL data

This is a personal, non-commercial project and isn't affiliated with the NHL. Game data comes from the NHL's public
APIs through the Worker, which caches each finished game and rate-limits requests to the NHL. No NHL data is stored in
this repository.
