import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [react(), svelte()],
  server: { port: 5180 },
  // Workspace packages export raw .ts/.svelte — let Vite compile them from
  // source instead of prebundling. This is what makes edits in packages/*
  // hot-reload here with no build step.
  optimizeDeps: {
    exclude: [
      '@ggary/core', '@ggary/elements', '@ggary/react', '@ggary/svelte',
      '@ggary/icons', '@ggary/structure', '@ggary/theme-ggarry', '@ggary/theme-instrument',
    ],
  },
  build: {
    rollupOptions: {
      input: { vanilla: 'index.html', react: 'react.html', svelte: 'svelte.html' },
    },
  },
})
