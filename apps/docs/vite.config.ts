import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [react(), svelte()],
  server: { port: 5190 },
  // Workspace packages export raw .ts/.svelte: Vite compiles them from source,
  // so an edit in packages/* reloads here with no build step.
  optimizeDeps: {
    exclude: ['@ggary/core', '@ggary/react', '@ggary/svelte', '@ggary/icons', '@ggary/structure', '@ggary/theme-ggarry'],
  },
  build: {
    rollupOptions: {
      input: { index: 'index.html', react: 'react.html', svelte: 'svelte.html' },
    },
  },
})
