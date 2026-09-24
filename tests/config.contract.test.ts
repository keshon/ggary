import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { expect, it } from 'vitest'

/**
 * A ConfigProvider is only as good as the components that listen to it. Every
 * adapter component that takes a `locale` or `words`, and every control that
 * takes a `size`, reads the settings in force — so a component added later
 * cannot forget to, and an app's language or size is not right everywhere
 * but one place.
 */

const root = join(__dirname, '..')
const CONTROLS = [
  'button', 'button-group', 'input', 'textarea', 'input-group', 'search', 'number-field', 'chip',
  'segmented-control', 'slider', 'select', 'combobox', 'cascader', 'date-picker', 'time-picker', 'pagination', 'tabs', 'range-slider',
]
/**
 * Not deaf, though they look it: parts inside a component that has already read
 * the settings and hands them on, the provider itself, and a row that shares a
 * directory with a component taking a locale but takes none of its own.
 */
const EXEMPT = new Set([
  'data-grid/FilterEditor.svelte',
  'date-picker/DatePicker.svelte',
  'date-picker/CalendarView.svelte',
  'config-provider/ConfigProvider.svelte',
  'config-provider/ConfigProvider.tsx',
  'metric/MetricRow.svelte',
])

const files = (dir: string, ext: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path, ext) : path.endsWith(ext) ? [path] : []
  })

/** A component's core props, which its adapter takes as its own. */
const coreTypes = (component: string) => {
  const path = join(root, 'packages/core/src/components', component, `${component}.types.ts`)
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}

const takesSettings = (path: string, text: string, dir: string) => {
  const component = relative(dir, path).split(/[\\/]/)[0]
  const own = text + coreTypes(component)
  return /^\s+(locale|words)\?:/m.test(own) || (CONTROLS.includes(component) && /^\s+size\?:/m.test(own))
}

it('every React component that takes a locale, words or a control size reads the settings in force', () => {
  const dir = join(root, 'packages/react/src/components')
  const deaf = files(dir, '.tsx')
    .filter((path) => {
      const name = relative(dir, path).replace(/\\/g, '/')
      const text = readFileSync(path, 'utf8')
      return !EXEMPT.has(name) && takesSettings(path, text, dir) && !text.includes('useConfigured(')
    })
    .map((path) => relative(dir, path).replace(/\\/g, '/'))
  expect(deaf).toEqual([])
})

it('every Svelte component that takes a locale, words or a control size reads the settings in force', () => {
  const dir = join(root, 'packages/svelte/src/components')
  const deaf = files(dir, '.svelte')
    .filter((path) => {
      const name = relative(dir, path).replace(/\\/g, '/')
      const text = readFileSync(path, 'utf8')
      return !EXEMPT.has(name) && takesSettings(path, text, dir) && !text.includes('getConfig()')
    })
    .map((path) => relative(dir, path).replace(/\\/g, '/'))
  expect(deaf).toEqual([])
})
