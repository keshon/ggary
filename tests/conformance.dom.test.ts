import { vi } from 'vitest'
import { runConformance } from './conformance/suite'

/**
 * The conformance suite under jsdom.
 *
 * Floating UI is mocked here: jsdom reports every rect as 0x0, and where a popup
 * lands on screen is a question for the browser run. It is mocked at
 * `@ggary/core`, which is where all three adapters import it from.
 */
vi.mock('@ggary/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@ggary/core')>()),
  attachPositioner: () => () => {},
}))

runConformance()
