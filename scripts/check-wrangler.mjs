import { readFileSync } from 'node:fs';

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));

let versions;
try {
   versions = {
      '@cloudflare/vite-plugin (root) pins': read(
         'node_modules/@cloudflare/vite-plugin/package.json',
      ).dependencies.wrangler,
      '@cloudflare/vitest-plugin (worker/) pins': read(
         'worker/node_modules/@cloudflare/vitest-plugin/package.json',
      ).dependencies.wrangler,
      'worker/package.json asks for': read('worker/package.json').devDependencies.wrangler,
      'worker/ has installed': read('worker/node_modules/wrangler/package.json').version,
   };
} catch (error) {
   console.error(
      `Could not read the Wrangler versions (run npm install in the root and in worker/): ${error.message}`,
   );
   process.exit(1);
}

if (new Set(Object.values(versions)).size === 1) process.exit(0);

const wanted = Object.values(versions)[0];
console.error('Wrangler versions are out of step:');
for (const [where, version] of Object.entries(versions))
   console.error(`  ${where.padEnd(42)} ${version}`);
console.error(`
The Vite plugin decides the version. In worker/, run:
  npm install -D --save-exact wrangler@${wanted} @cloudflare/vitest-plugin@<release that pins ${wanted}>
Find that release with:
  npm view @cloudflare/vitest-plugin@<version> dependencies.wrangler`);
process.exit(1);
