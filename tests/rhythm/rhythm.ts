import { expect } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import { createElement as h, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { CheckboxGroup, Field, Fieldset, Input, Menu, RadioGroup, Select, Sheet, Tabs } from '../../packages/react/src/index'

/**
 * The spacing rules the theme owes, measured in a real browser on real
 * components:
 *
 *   - an option list has one rhythm: label to first option = option to option
 *     = --gg-space-option, for checkboxes and radios alike;
 *   - a legend stands the same distance above its content, and a field's label
 *     above its control, with the field's hint the same distance below;
 *   - groups inside a fieldset are --gg-space-group apart, which is more than
 *     an option step, so a group reads as one thing;
 *   - a highlighted option in the listbox, and a row of a menu, takes the
 *     field's corner and is 32 pixels tall; a closed menu is not drawn, and a
 *     row's shortcut stands at the row's far edge.
 *
 * This is what caught the popover whose checkboxes sat 16px apart and whose
 * radios sat 8px apart: two groups, two rhythms, nobody owning the space.
 */
const px = (value: string) => parseFloat(value)
const box = (el: Element) => el.getBoundingClientRect()
const gap = (above: Element, below: Element) => box(below).top - box(above).bottom
const near = (actual: number, expected: number) => expect(Math.abs(actual - expected)).toBeLessThan(0.75)
const part = (scope: string, name: string) => document.querySelector(`[data-scope="${scope}"][data-part="${name}"]`)!

const frames = (count = 2) =>
  new Promise<void>((resolve) => {
    let left = count
    const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick))
    requestAnimationFrame(tick)
  })

/** Renders into a fresh host on the body; the returned function takes it away again. */
async function render(node: ReactNode) {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  root.render(node)
  await frames()
  return () => {
    root.unmount()
    host.remove()
  }
}

let groups: Root | null = null

export function unmountGroups() {
  groups?.unmount()
  groups = null
  document.body.replaceChildren()
}

export async function mountGroups() {
  unmountGroups()
  document.body.style.margin = '0'
  const host = document.createElement('div')
  host.style.cssText = 'padding: 24px; inline-size: 320px'
  document.body.append(host)
  groups = createRoot(host)
  groups.render([
    h(Fieldset, {
      key: 'fieldset',
      legend: 'Filters',
      children: [
        h(CheckboxGroup, {
          key: 'show',
          label: 'Show',
          name: 'show',
          defaultValue: ['open'],
          items: [
            { value: 'open', label: 'Only open issues' },
            { value: 'mine', label: 'Assigned to me' },
            { value: 'starred', label: 'Starred' },
          ],
        }),
        h(RadioGroup, {
          key: 'sort',
          label: 'Sort',
          name: 'sort',
          defaultValue: 'new',
          items: [
            { value: 'new', label: 'Newest first' },
            { value: 'old', label: 'Oldest first' },
            { value: 'active', label: 'Most active' },
          ],
        }),
      ],
    }),
    h(Select, { key: 'select', label: 'Plan', items: ['Free', 'Team', 'Business'].map((label) => ({ value: label.toLowerCase(), label })) }),
    h(Field, { key: 'field', label: 'Email', hint: 'Work address', children: h(Input, { type: 'email' }) }),
    h(Menu, {
      key: 'menu',
      items: ['Rename', 'Duplicate', 'Delete'].map((label) => ({ value: label.toLowerCase(), label, shortcut: label[0] })),
      trigger: (props) => h('button', props, 'Actions'),
    }),
  ])
  await frames()
}

export async function expectRhythm() {
  const root = getComputedStyle(document.documentElement)
  const option = px(root.getPropertyValue('--gg-space-option'))
  const group = px(root.getPropertyValue('--gg-space-group'))
  expect(option).toBeGreaterThan(0)
  expect(group).toBeGreaterThan(option)

  for (const scope of ['checkbox-group', 'radio-group']) {
    const label = part(scope, 'label')
    const options = [...part(scope, 'list').children]
    near(gap(label, options[0]), option)
    near(gap(options[0], options[1]), option)
    near(gap(options[1], options[2]), option)
  }

  near(gap(part('fieldset', 'legend'), part('fieldset', 'content')), option)
  near(gap(part('checkbox-group', 'root'), part('radio-group', 'root')), group)

  // A field's label and hint sit the same step from its control.
  const field = part('field', 'root')
  const control = field.querySelector('input')!
  near(gap(field.querySelector('[data-part="label"]')!, control), option)
  near(gap(control, field.querySelector('[data-part="hint"]')!), option)
}

/**
 * How the theme rounds a list's rows: with the field's own corner, the one the
 * eye holds a highlighted option against, and 32 pixels tall — as tall as the
 * field, a highlight read as a second one.
 */
function expectRowCorner(row: Element) {
  const field = part('select', 'trigger')
  near(px(getComputedStyle(row).borderTopLeftRadius), px(getComputedStyle(field).borderTopLeftRadius))
  near(box(row).height, 32)
}

export async function expectConcentricListbox() {
  await userEvent.click(part('select', 'trigger'))
  await frames()
  expectRowCorner(part('select', 'content').querySelector('[data-part="item"]')!)
  await userEvent.keyboard('{Escape}')
  await frames()
}

export async function expectConcentricMenu() {
  // A theme's layout must not outrank the platform's display: none for a
  // closed popover.
  expect(getComputedStyle(part('menu', 'content')).display).toBe('none')
  await userEvent.click([...document.querySelectorAll('button')].find((button) => button.textContent === 'Actions')!)
  await frames()
  const row = part('menu', 'content').querySelector('[data-part="item"]')!
  const item = getComputedStyle(row)
  expectRowCorner(row)
  near(box(row.querySelector('[data-part="item-shortcut"]')!).right, box(row).right - px(item.paddingRight))
  await userEvent.keyboard('{Escape}')
  await frames()
}

/** A sheet stands full height, flush with its edge, and its footer sits at the bottom. */
export async function expectSheetLayout() {
  for (const side of ['end', 'start'] as const) {
    const unmount = await render(
      h(Sheet, { title: 'Parameters', side, defaultOpen: true, footer: h('button', { type: 'button' }, 'Close') }, h('p', null, 'Body'))
    )
    const content = part('dialog', 'content')
    // Measure where the sheet comes to rest, however long its entrance takes on a busy machine.
    await new Promise((resolve) => requestAnimationFrame(resolve))
    await Promise.all(content.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})))
    const rect = box(content)
    near(rect.top, 0)
    near(rect.height, window.innerHeight)
    if (side === 'end') near(rect.right, document.documentElement.clientWidth)
    else near(rect.left, 0)
    expect(rect.width).toBeLessThan(window.innerWidth)
    near(box(content.querySelector('[data-part="footer"]')!).bottom, window.innerHeight)
    unmount()
  }
}

/** A chip tab is concentric with the track it lies in. */
export async function expectConcentricChipTabs() {
  const unmount = await render(
    h(Tabs, {
      variant: 'chips',
      label: 'Open files',
      items: [
        { value: 'a', label: 'tokens.css', closable: true },
        { value: 'b', label: 'layout.css' },
      ],
      children: (item) => item.value.toUpperCase(),
    })
  )
  const list = getComputedStyle(part('tabs', 'list'))
  const tab = getComputedStyle(part('tabs', 'tab'))
  const expected = Math.max(2, px(list.borderTopLeftRadius) - px(list.paddingTop) - px(list.borderTopWidth))
  near(px(tab.borderTopLeftRadius), expected)
  unmount()
}
