import { defineConfig } from 'vitest/config'

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
        // DOM-level conformance, run against the vanilla custom elements.
        test: { name: 'dom', environment: 'jsdom', include: ['tests/*.dom.test.ts'], globals: true },
      },
    ],
  },
})
