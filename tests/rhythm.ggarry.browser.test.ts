import { beforeEach, describe, it } from 'vitest'
import '../packages/theme-ggarry/src/index.css'
import { expectConcentricChipTabs, expectConcentricListbox, expectConcentricMenu, expectRhythm, expectSheetLayout, mountGroups, useRowCorners } from './rhythm/rhythm'

describe('GGarry rhythm, measured', () => {
  beforeEach(() => {
    mountGroups()
    // A row takes the field's corner and is 32 pixels: as tall as the field, a highlight read as a second one.
    useRowCorners({ corner: 'field', rowHeight: 32 })
  })

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
