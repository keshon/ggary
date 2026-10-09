import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'

const sources = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const path = join(dir, entry.name)
  return entry.isDirectory() ? sources(path) : /\.tsx?$/.test(path) ? [path] : []
})

it('React overlays do not reintroduce legacy dismissal or native top-layer fallbacks', () => {
  for (const file of sources(join(__dirname, '../packages/react/src'))) {
    const code = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
    expect(code, file).not.toMatch(/\b(?:trackDismissable|attachPopover|attachDialog|attachAnchorPanel|attachShellDrawer|attachToolbarKeys|focusTab|showPopover|hidePopover|showModal)\b/)
    expect(code, file).not.toMatch(/dialog\[open\]|\[popover\]/)
  }
})
