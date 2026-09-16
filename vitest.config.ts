import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  test: {
    globals: true,
    projects: [
      {
        // Pure logic. Runs in Node with NO dom — this is the guard rail that
        // keeps `core/src/components/**/machine.ts` free of DOM access.
        test: { name: 'machine', environment: 'node', include: ['tests/*.machine.test.ts'], globals: true },
      },
      {
        // Source-level contracts: rules about how packages relate to each other,
        // checked by reading the tree. Node, no DOM, no rendering.
        test: { name: 'contract', environment: 'node', include: ['tests/*.contract.test.ts'], globals: true },
      },
      {
        // DOM conformance, run against all three adapters (tests/conformance),
        // plus element-only API tests.
        //
        // Svelte has to be compiled here, and resolved to its BROWSER build:
        // under Node the default export condition picks the server build, where
        // `mount` does not exist.
        plugins: [svelte({ hot: false })],
        resolve: { conditions: ['browser'] },
        test: { name: 'dom', environment: 'jsdom', include: ['tests/*.dom.test.ts'], globals: true },
      },
    ],
  },
})
