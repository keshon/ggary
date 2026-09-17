import { vi } from 'vitest'
import { runConformance } from './conformance/suite'

/**
 * The conformance suite under jsdom.
 *
 * Floating UI is mocked here: jsdom reports every rect as 0x0, and where a popup
 * lands on screen is a question for the browser run.
 */
// Mocked at the module, not at `@ggary/core`: core's own overlay helpers import
// the positioner directly, and a mock of the package entry would miss them.
vi.mock('../packages/core/src/utils/position', () => ({ attachPositioner: () => () => {} }))

runConformance()
