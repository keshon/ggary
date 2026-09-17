import { beforeEach, describe, it } from 'vitest'
import '../packages/theme-ggarry/src/index.css'
import { expectConcentricListbox, expectRhythm, mountGroups } from './rhythm/rhythm'

describe('GGarry rhythm, measured', () => {
  beforeEach(() => mountGroups())

  for (const mode of ['light', 'dark']) {
    it(`option lists, fieldsets and the listbox keep the rules (${mode})`, async () => {
      document.documentElement.setAttribute('data-mode', mode)
      await expectRhythm()
      await expectConcentricListbox()
    })
  }
})
