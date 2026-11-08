// Downloads the deployed site's default games from the NHL API, since src/data is gitignored and the NHL API
// blocks browser requests from other sites. Files that already exist are kept, so local data and the deploy
// workflow's cache skip the download.
// Run: node scripts/fetch-default-games.mjs [dataDir]
import { access, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DEFAULT_GAMES = [
   { id: 2026020202, file: '20261028-SEAvTOR' },
   { id: 2010020823, file: '20110211-NYIvPIT' },
];

const dataDir = process.argv[2] ?? 'src/data';
const sources = (id) => [
   {
      dir: 'games',
      name: (file) => `${file}.json`,
      url: `https://api-web.nhle.com/v1/gamecenter/${id}/play-by-play`,
   },
   {
      dir: 'shifts',
      name: (file) => `${file}-shifts.json`,
      url: `https://api.nhle.com/stats/rest/en/shiftcharts?cayenneExp=gameId=${id}`,
   },
];

const exists = (path) =>
   access(path).then(
      () => true,
      () => false,
   );

for (const { id, file } of DEFAULT_GAMES) {
   for (const { dir, name, url } of sources(id)) {
      const path = join(dataDir, dir, name(file));
      if (await exists(path)) {
         console.log(`kept ${path}`);
         continue;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${url} answered ${response.status}`);
      const body = await response.json();
      // The NHL sometimes answers a finished game's shift chart with no shifts; caching that would ship a game
      // with nobody on the ice.
      if (dir === 'shifts' && body.total === 0) throw new Error(`${url} has no shifts`);
      await mkdir(join(dataDir, dir), { recursive: true });
      await writeFile(path, JSON.stringify(body));
      console.log(`fetched ${path}`);
   }
}
