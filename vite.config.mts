import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';

const root = import.meta.dirname;

export default defineConfig({
  root: resolve(root, 'src/renderer'),
  base: './', // loaded over file://, so every asset reference must be relative
  plugins: [svelte({ configFile: resolve(root, 'svelte.config.js') })],
  build: {
    outDir: resolve(root, 'dist/renderer'),
    emptyOutDir: true,
    target: 'chrome152', // pinned to the Chromium inside our pinned Electron
    sourcemap: true,
  },
});
