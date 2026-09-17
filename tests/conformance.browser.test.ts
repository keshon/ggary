import { runConformance } from './conformance/suite'

/**
 * The same conformance suite in a real Chromium: nothing mocked, nothing
 * simulated. What jsdom cannot answer — layout, real focus, the top layer,
 * the order the browser fires events in — is answered here.
 */
runConformance()
