import { expect } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import '../../packages/elements/src/index'
import type { GgMenuElement, GgSelectElement, GgSheetElement } from '../../packages/elements/src/index'

/**
 * The spacing rules every theme owes, measured in a real browser on real
 * components. Run once per theme (each theme's CSS in its own page):
 *
 *   - an option list has one rhythm: label to first option = option to option
 *     = --gg-space-option, for checkboxes and radios alike;
 *   - a legend stands the same distance above its content, and a field's label
 *     above its control, with the field's hint the same distance below;
 *   - groups inside a fieldset are --gg-space-group apart, which is more than
 *     an option step, so a group reads as one thing;
 *   - a highlighted option in the listbox, and a row of a menu, is concentric
 *     with its panel; a closed menu is not drawn, and a row's shortcut stands
 *     at the row's far edge.
 *
 * This is what caught the popover whose checkboxes sat 16px apart and whose
 * radios sat 8px apart: two groups, two rhythms, nobody owning the space.
 */
const px = (value: string) => parseFloat(value)
const box = (el: Element) => el.getBoundingClientRect()
const gap = (above: Element, below: Element) => box(below).top - box(above).bottom
const near = (actual: number, expected: number) => expect(Math.abs(actual - expected)).toBeLessThan(0.75)

export function mountGroups() {
  document.body.style.margin = '0'
  document.body.innerHTML = `
    <div style="padding: 24px; inline-size: 320px">
      <gg-fieldset legend="Filters">
        <gg-checkbox-group label="Show" name="show">
          <label><input type="checkbox" value="open" checked> Only open issues</label>
          <label><input type="checkbox" value="mine"> Assigned to me</label>
          <label><input type="checkbox" value="starred"> Starred</label>
        </gg-checkbox-group>
        <gg-radio-group label="Sort" name="sort">
          <label><input type="radio" value="new" checked> Newest first</label>
          <label><input type="radio" value="old"> Oldest first</label>
          <label><input type="radio" value="active"> Most active</label>
        </gg-radio-group>
      </gg-fieldset>
      <gg-select label="Plan"></gg-select>
      <gg-field label="Email" hint="Work address"><input type="email"></gg-field>
      <gg-menu><button slot="trigger">Actions</button></gg-menu>
    </div>`
  const select = document.querySelector('gg-select') as GgSelectElement
  select.items = ['Free', 'Team', 'Business'].map((label) => ({ value: label.toLowerCase(), label }))
  const menu = document.querySelector('gg-menu') as GgMenuElement
  menu.items = ['Rename', 'Duplicate', 'Delete'].map((label) => ({ value: label.toLowerCase(), label, shortcut: label[0] }))
}

export async function expectRhythm() {
  const root = getComputedStyle(document.documentElement)
  const option = px(root.getPropertyValue('--gg-space-option'))
  const group = px(root.getPropertyValue('--gg-space-group'))
  expect(option).toBeGreaterThan(0)
  expect(group).toBeGreaterThan(option)

  for (const scope of ['checkbox-group', 'radio-group']) {
    const label = document.querySelector(`[data-scope="${scope}"][data-part="label"]`)!
    const options = [...document.querySelector(`[data-scope="${scope}"][data-part="list"]`)!.children]
    near(gap(label, options[0]), option)
    near(gap(options[0], options[1]), option)
    near(gap(options[1], options[2]), option)
  }

  const legend = document.querySelector('[data-scope="fieldset"][data-part="legend"]')!
  const content = document.querySelector('[data-scope="fieldset"][data-part="content"]')!
  near(gap(legend, content), option)
  near(gap(document.querySelector('gg-checkbox-group')!, document.querySelector('gg-radio-group')!), group)

  // A field's label and hint sit the same step from its control.
  const field = document.querySelector('gg-field')!
  const control = field.querySelector('input')!
  near(gap(field.querySelector('[data-part="label"]')!, control), option)
  near(gap(control, field.querySelector('[data-part="hint"]')!), option)
}

export async function expectConcentricListbox() {
  const select = document.querySelector('gg-select') as GgSelectElement
  await userEvent.click(select.querySelector('[data-part="trigger"]')!)
  const panel = getComputedStyle(select.querySelector('[data-part="content"]')!)
  const item = getComputedStyle(select.querySelector('[data-part="item"]')!)
  const expected = Math.max(2, px(panel.borderTopLeftRadius) - px(panel.paddingTop) - px(panel.borderTopWidth))
  near(px(item.borderTopLeftRadius), expected)
  await userEvent.keyboard('{Escape}')
}

export async function expectConcentricMenu() {
  const menu = document.querySelector('gg-menu') as GgMenuElement
  // A theme's layout must not outrank the platform's display: none for a
  // closed popover — Instrument's first menu showed while closed.
  expect(getComputedStyle(menu.querySelector('[data-part="content"]')!).display).toBe('none')
  await userEvent.click(menu.querySelector('[slot="trigger"]')!)
  const panel = getComputedStyle(menu.querySelector('[data-part="content"]')!)
  const row = menu.querySelector('[data-part="item"]')!
  const item = getComputedStyle(row)
  const expected = Math.max(2, px(panel.borderTopLeftRadius) - px(panel.paddingTop) - px(panel.borderTopWidth))
  near(px(item.borderTopLeftRadius), expected)
  near(box(row.querySelector('[data-part="item-shortcut"]')!).right, box(row).right - px(item.paddingRight))
  await userEvent.keyboard('{Escape}')
}

/** A sheet stands full height, flush with its edge, and its footer sits at the bottom. */
export async function expectSheetLayout() {
  for (const side of ['end', 'start'] as const) {
    const sheet = document.createElement('gg-sheet') as GgSheetElement
    sheet.setAttribute('heading', 'Parameters')
    sheet.setAttribute('side', side)
    sheet.innerHTML = '<p>Body</p><footer><button type="button">Close</button></footer>'
    document.body.append(sheet)
    sheet.show()
    await new Promise((resolve) => setTimeout(resolve, 250))
    const content = sheet.querySelector('[data-part="content"]')!
    const rect = box(content)
    near(rect.top, 0)
    near(rect.height, window.innerHeight)
    if (side === 'end') near(rect.right, document.documentElement.clientWidth)
    else near(rect.left, 0)
    expect(rect.width).toBeLessThan(window.innerWidth)
    near(box(sheet.querySelector('[data-part="footer"]')!).bottom, window.innerHeight)
    sheet.close()
    sheet.remove()
  }
}
