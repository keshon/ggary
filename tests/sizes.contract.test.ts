import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'

/**
 * A control that has a size has all three. Each one below declares its size as
 * the kit's ControlSize and its theme draws sm and lg (md is the default the
 * rest of its stylesheet already is). A control that only wraps another one
 * says which, and is drawn by it.
 */

const root = join(__dirname, '..')
const CONTROLS = [
  'button', 'button-group', 'input', 'textarea', 'input-group', 'search', 'number-field', 'chip',
  'segmented-control', 'slider', 'select', 'combobox', 'cascader', 'date-picker', 'pagination', 'tabs',
]
/** Drawn by another control's stylesheet. */
const DRAWN_BY: Record<string, string> = { search: 'input', textarea: 'input' }

const core = (name: string) =>
  readdirSync(join(root, 'packages/core/src/components', name))
    .map((file) => readFileSync(join(root, 'packages/core/src/components', name, file), 'utf8'))
    .join('\n')

it('every control declares the one size scale', () => {
  const wrong = CONTROLS.filter((name) => {
    const text = core(name)
    // Its own alias of ControlSize, or a sibling's that is one.
    return !/ControlSize|InputSize|ButtonSize/.test(text)
  })
  expect(wrong).toEqual([])
})

it('every control is drawn at sm and at lg', () => {
  const missing: string[] = []
  for (const name of CONTROLS) {
    const scope = DRAWN_BY[name] ?? name
    const file = join(root, 'packages/theme-ggarry/src/components', `${scope}.css`)
    const css = existsSync(file) ? readFileSync(file, 'utf8') : ''
    for (const size of ['sm', 'lg']) {
      const drawn = new RegExp(`\\[data-scope='${scope}'\\][^{]*\\[data-size='${size}'\\]`).test(css)
      if (!drawn) missing.push(`${name}: ${size}`)
    }
  }
  expect(missing).toEqual([])
})

it('the size types are all the one scale', () => {
  const sizes = readFileSync(join(root, 'packages/core/src/utils/size.ts'), 'utf8')
  expect(sizes).toMatch(/export type ControlSize = 'sm' \| 'md' \| 'lg'/)
  const others: string[] = []
  for (const name of readdirSync(join(root, 'packages/core/src/components'))) {
    if (!CONTROLS.includes(name)) continue
    for (const m of core(name).matchAll(/export type (\w+Size) = ([^\n]+)/g)) {
      if (m[2].trim() !== 'ControlSize') others.push(`${name}: ${m[1]} = ${m[2]}`)
    }
  }
  expect(others).toEqual([])
})
