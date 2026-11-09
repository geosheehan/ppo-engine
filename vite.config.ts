import { copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import { configDefaults } from 'vitest/config';

// GitHub Pages has no SPA fallback but serves 404.html for unknown paths, so a copy of index.html lets the router
// handle deep links.
const pagesFallback = (): Plugin => ({
   name: 'pages-fallback',
   apply: 'build',
   writeBundle({ dir }) {
      if (dir !== undefined) copyFileSync(join(dir, 'index.html'), join(dir, '404.html'));
   },
});

// https://vite.dev/config/
export default defineConfig(({ command, isPreview, mode }) => ({
   // GitHub Pages serves the site from /ppo-engine/; `vite preview` must match it, the dev server stays at the root.
   base: command === 'build' || isPreview === true ? '/ppo-engine/' : '/',
   plugins: [
      react(),
      pagesFallback(),
      command === 'serve'
         && mode === 'worker'
         && cloudflare({
            configPath: './worker/wrangler.jsonc',
            persistState: { path: './worker/.wrangler/state' },
            config: {
               assets: {
                  not_found_handling: 'single-page-application',
                  run_worker_first: ['/game/*', '/schedule/*'],
               },
            },
         }),
   ],
   // The deployed Worker only allows the Pages origin, so a local preview reaches it through this
   // server-side proxy instead (build with --mode pages-preview, see npm run preview:pages).
   preview: {
      proxy: {
         '/ppo-engine/api': {
            target: 'https://ppo-engine-api.geosheehan.workers.dev',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/ppo-engine\/api/, ''),
         },
      },
   },
   resolve: {
      tsconfigPaths: true,
   },
   test: {
      exclude: [...configDefaults.exclude, 'worker/**'],
   },
}));
