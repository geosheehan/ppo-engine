// Run: node scripts/headshot-samples.mjs
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const GAMES_DIR = 'src/data/games';
const OUT_DIR = 'public/headshot-debug';
const SKATERS_PER_TEAM = 4;

const newestFirst = (await readdir(GAMES_DIR))
   .filter((name) => name.endsWith('.json'))
   .sort()
   .reverse();
const samples = new Map();
for (const name of newestFirst) {
   const game = JSON.parse(await readFile(join(GAMES_DIR, name), 'utf8'));
   for (const team of [game.awayTeam, game.homeTeam]) {
      if (samples.has(team.abbrev)) continue;
      const roster = game.rosterSpots.filter((player) => player.teamId === team.id);
      const skaters = roster
         .filter((player) => player.positionCode !== 'G')
         .slice(0, SKATERS_PER_TEAM);
      const goalie = roster.find((player) => player.positionCode === 'G');
      const players = goalie === undefined ? skaters : [...skaters, goalie];
      samples.set(team.abbrev, {
         abbrev: team.abbrev,
         players: players.map((player) => ({
            teamId: player.teamId,
            playerId: player.playerId,
            firstName: player.firstName,
            lastName: player.lastName,
            sweaterNumber: player.sweaterNumber,
            positionCode: player.positionCode,
            headshot: player.headshot,
         })),
      });
   }
}

const teams = [...samples.values()].sort((a, b) => a.abbrev.localeCompare(b.abbrev));
await mkdir(OUT_DIR, { recursive: true });
await writeFile(join(OUT_DIR, 'samples.json'), `${JSON.stringify(teams, null, 3)}\n`);
console.log(`Wrote ${teams.length} teams to ${OUT_DIR}/samples.json`);
