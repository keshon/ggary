import { afterEach, describe } from 'vitest'
import { elements } from './adapters/elements'
import { react } from './adapters/react'
import { svelte } from './adapters/svelte'
import { buttonConformance } from './button.spec'
import { checkboxConformance, switchConformance } from './checkbox.spec'
import { chipGroupConformance } from './chip-group.spec'
import { dialogConformance } from './dialog.spec'
import { fieldConformance } from './field.spec'
import { checkboxGroupConformance, fieldsetConformance } from './fieldset.spec'
import { cleanup } from './harness'
import { inputConformance } from './input.spec'
import { popoverConformance, tooltipConformance } from './popover.spec'
import { radioGroupConformance } from './radio-group.spec'
import { selectConformance } from './select.spec'
import { textareaConformance } from './textarea.spec'

/**
 * One contract, every adapter. A failure reads as `react > select > keyboard >
 * skips disabled options`, which names the adapter that drifted.
 *
 * Run twice: under jsdom (conformance.dom.test.ts), fast and everywhere, and in
 * a real Chromium (conformance.browser.test.ts), where layout, focus, the top
 * layer and events are the browser's own rather than a simulation's.
 */
export function runConformance() {
  afterEach(cleanup)

  for (const adapter of [elements, react, svelte]) {
    describe(adapter.name, () => {
      buttonConformance(adapter)
      selectConformance(adapter)
      chipGroupConformance(adapter)
      inputConformance(adapter)
      textareaConformance(adapter)
      checkboxConformance(adapter)
      switchConformance(adapter)
      radioGroupConformance(adapter)
      checkboxGroupConformance(adapter)
      fieldsetConformance(adapter)
      fieldConformance(adapter)
      dialogConformance(adapter)
      popoverConformance(adapter)
      tooltipConformance(adapter)
    })
  }
}
