import { afterEach, describe, vi } from 'vitest'
import { elements } from './conformance/adapters/elements'
import { react } from './conformance/adapters/react'
import { svelte } from './conformance/adapters/svelte'
import { buttonConformance } from './conformance/button.spec'
import { chipGroupConformance } from './conformance/chip-group.spec'
import { selectConformance } from './conformance/select.spec'
import { cleanup } from './conformance/harness'

/**
 * One contract, every adapter. A failure reads as `react > select > keyboard >
 * skips disabled options`, which names the adapter that drifted.
 *
 * Floating UI is mocked for all three: jsdom reports every rect as 0x0, and
 * where a popup lands on screen is a visual question for a real browser. It is
 * mocked at `@ggary/core`, which is where all three adapters import it from.
 */
vi.mock('@ggary/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@ggary/core')>()),
  attachPositioner: () => () => {},
}))

afterEach(cleanup)

for (const adapter of [elements, react, svelte]) {
  describe(adapter.name, () => {
    buttonConformance(adapter)
    selectConformance(adapter)
    chipGroupConformance(adapter)
  })
}
