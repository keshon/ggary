import { beforeEach, describe, it } from 'vitest'
import '../packages/theme-instrument/src/index.css'
import { expectConcentricListbox, expectRhythm, mountGroups } from './rhythm/rhythm'

describe('Instrument rhythm, measured', () => {
  beforeEach(() => mountGroups())

  // Density moves both steps of the rhythm; the rules must hold at each.
  for (const density of ['compact', 'regular', 'comfortable']) {
    it(`option lists, fieldsets and the listbox keep the rules (${density})`, async () => {
      document.documentElement.setAttribute('data-density', density)
      await expectRhythm()
      await expectConcentricListbox()
    })
  }
})
