import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { expect, it } from 'vitest'

/**
 * The shape of core, held so it cannot drift. A connect takes what it reads —
 * props, or a machine's state and send, or a controller's snapshot — then the
 * normalizer, then at most one `options` object: words and callbacks go in it,
 * never after it, so a new one is never a new positional argument.
 */

const root = join(__dirname, '..')
const components = join(root, 'packages', 'core', 'src', 'components')

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : name.endsWith('.ts') ? [path] : []
  })

const CONNECT = /export function (connect\w*)(?:<[^>]*>)?\(([\s\S]*?)\)\s*(?::[^{]*)?\{/g

it('every connect ends at the normalizer or at one `options` after it', () => {
  const found: string[] = []
  const wrong: string[] = []
  for (const file of files(components)) {
    const text = readFileSync(file, 'utf8')
    for (const m of text.matchAll(CONNECT)) {
      const params = m[2]
        .split(/,(?![^<{(]*[>})])/)
        .map((p) => p.trim().replace(/[?:=][\s\S]*$/, '').trim())
        .filter(Boolean)
      const at = params.indexOf('normalize')
      const where = `${relative(root, file).replace(/\\/g, '/')} ${m[1]}(${params.join(', ')})`
      found.push(where)
      const tail = params.slice(at + 1)
      if (at < 0 || tail.length > 1 || (tail.length === 1 && tail[0] !== 'options')) wrong.push(where)
    }
  }
  expect(found.length).toBeGreaterThan(80)
  expect(wrong).toEqual([])
})
