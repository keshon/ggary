import { afterEach, beforeEach, describe, it } from 'vitest'
import '../packages/theme-ggarry/src/index.css'
import { expectConcentricChipTabs, expectConcentricListbox, expectConcentricMenu, expectRhythm, expectSheetLayout, mountGroups, unmountGroups } from './rhythm/rhythm'

describe('GGarry rhythm, measured', () => {
  beforeEach(() => mountGroups())
  afterEach(() => unmountGroups())

  for (const mode of ['light', 'dark']) {
    it(`option lists, fieldsets, the listbox, the menu and the sheet keep the rules (${mode})`, async () => {
      document.documentElement.setAttribute('data-mode', mode)
      await expectRhythm()
      await expectConcentricListbox()
      await expectConcentricMenu()
      await expectSheetLayout()
      await expectConcentricChipTabs()
    })
  }
})
