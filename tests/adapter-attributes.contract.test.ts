import { readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import { expect, it } from 'vitest'

/**
 * An attribute an app adds — a class, an id, a data-* or aria-* — reaches the
 * component's element in both frameworks or in neither. A component that
 * hands the rest of its props on in React hands them on in Svelte too, so an
 * app moving between the two finds the same component.
 */

const root = join(__dirname, '..')
const files = (dir: string, ext: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path, ext) : name.endsWith(ext) ? [path] : []
  })

/**
 * Hands the rest on: `...rest` (or a whole-props spread, as Caret's) in the
 * markup, or into createElement's props. Comments are not code: a trigger's
 * doc shows `{...props}` spread onto a Button.
 */
const handsOn = (text: string) =>
  /\{\.\.\.(rest|props)\}|\{\s*\.\.\.rest\b/.test(text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$|<!--[\s\S]*?-->/gm, ''))

it('a component that hands its other props on in React does in Svelte, and the other way round', () => {
  const svelte = new Map(files(join(root, 'packages/svelte/src/components'), '.svelte').map((path) => [basename(path, '.svelte'), path]))
  const differ: string[] = []
  for (const path of files(join(root, 'packages/react/src/components'), '.tsx')) {
    const name = basename(path, '.tsx')
    const twin = svelte.get(name)
    if (!twin) continue
    const react = handsOn(readFileSync(path, 'utf8'))
    const other = handsOn(readFileSync(twin, 'utf8'))
    if (react !== other) differ.push(`${name}: React ${react ? 'does' : 'does not'}, Svelte ${other ? 'does' : 'does not'}`)
  }
  expect(differ).toEqual([])
})
