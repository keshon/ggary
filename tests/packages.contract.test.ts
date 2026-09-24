import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * What a project imports, held so it cannot drift. Each package exports its
 * root and one pattern for its components — a list per component fell 35
 * behind the directories it named. Every component directory has an index,
 * the two adapters have the same directories and the same components in them,
 * and each root carries everything its directories export.
 */

const root = join(__dirname, '..')
const pkg = (name: string) => JSON.parse(readFileSync(join(root, 'packages', name, 'package.json'), 'utf8'))
const dirs = (name: string) => readdirSync(join(root, 'packages', name, 'src', 'components')).sort()

/** Names a module re-exports: `export { A, B as C } from …`. */
function exported(file: string): Set<string> {
  const out = new Set<string>()
  for (const m of readFileSync(file, 'utf8').matchAll(/export (?:type )?\{([^}]*)\}/g)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop()
      if (name) out.add(name)
    }
  }
  return out
}

describe.each(['core', 'react', 'svelte'])('@ggary/%s', (name) => {
  it('exports its root and one pattern for every component, nothing listed by hand', () => {
    // Svelte's root also names itself to Svelte-aware bundlers.
    const self = name === 'svelte' ? { svelte: './src/index.ts' } : {}
    expect(pkg(name).exports).toEqual({
      '.': { types: './src/index.ts', ...self, default: './src/index.ts' },
      './*': { types: './src/components/*/index.ts', default: './src/components/*/index.ts' },
    })
  })

  it('has an index in every component directory', () => {
    const missing = dirs(name).filter((dir) => !existsSync(join(root, 'packages', name, 'src', 'components', dir, 'index.ts')))
    expect(missing).toEqual([])
  })
})

describe('the adapters', () => {
  it('have the same component directories', () => {
    expect(dirs('svelte')).toEqual(dirs('react'))
  })

  // A component, not its props type or a React hook: what both frameworks owe.
  const components = (adapter: string, dir: string) =>
    [...exported(join(root, 'packages', adapter, 'src', 'components', dir, 'index.ts'))]
      .filter((n) => /^[A-Z]/.test(n) && !/(Props|Api|Words|Options|State)$/.test(n))
      .sort()

  it('export the same components from each directory', () => {
    const differ = dirs('react')
      .map((dir) => ({ dir, react: components('react', dir), svelte: components('svelte', dir) }))
      .filter((row) => row.react.join() !== row.svelte.join())
    expect(differ).toEqual([])
  })

  it('carry every component from their root', () => {
    const missing: string[] = []
    for (const adapter of ['react', 'svelte']) {
      const top = exported(join(root, 'packages', adapter, 'src', 'index.ts'))
      for (const dir of dirs(adapter)) {
        for (const name of components(adapter, dir)) if (!top.has(name)) missing.push(`${adapter}: ${dir}/${name}`)
      }
    }
    expect(missing).toEqual([])
  })
})
