import { vi } from 'vitest'

// jsdom cannot measure layout. Stub only Floating UI's geometry/observers;
// Base UI selection, focus, callbacks, forms and GGary's layer stack stay real.
// Placement and top-layer visibility are checked in the browser.
vi.mock('@floating-ui/react-dom', async (original) => ({
  ...await original<typeof import('@floating-ui/react-dom')>(),
  autoUpdate: (_reference: Element, _floating: HTMLElement, update: () => void) => { update(); return () => {} },
}))
vi.mock('@floating-ui/dom', async (original) => ({
  ...await original<typeof import('@floating-ui/dom')>(),
  computePosition: async () => ({ x: 10, y: 48, strategy: 'fixed', placement: 'bottom', middlewareData: {} }),
}))
