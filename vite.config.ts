import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
   // GitHub Pages serves the site from /ppo-engine/; `vite preview` must match it, the dev server stays at the root.
   base: command === 'build' || isPreview === true ? '/ppo-engine/' : '/',
   plugins: [react()],
   resolve: {
      tsconfigPaths: true,
   },
}));
