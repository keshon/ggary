import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'

/**
 * One rule for the accent line that marks what is current: a bar on a block's
 * side (a nav item, a list row, a checked card, the grid's open row) or a
 * line on a row of items (the selected tab). It is always --ggarry-border-accent
 * — the accent that holds 3:1 on every ground it stands on, in both modes —
 * and always --ggarry-size-edge or --ggarry-size-indicator wide, never a
 * number. The audit found three accents and bare 3px widths doing this job.
 */

const dir = join(__dirname, '..', 'packages/theme-ggarry/src/components')

/** Declarations that draw an accent edge: a side inset shadow, or a side border. */
const edgeDeclarations = () =>
  readdirSync(dir)
    .filter((name) => name.endsWith('.css'))
    .flatMap((name) =>
      readFileSync(join(dir, name), 'utf8')
        .split(/;\s*/)
        .map((declaration) => declaration.replace(/\s+/g, ' ').trim())
        .filter((declaration) => /accent/.test(declaration))
        .filter((declaration) => /^(box-shadow: inset (?!0 0 0)|border-(inline|block)-(start|end)(-color)?:)/.test(declaration.replace(/^.*?(box-shadow|border-)/, '$1')))
        .map((declaration) => ({ file: name, declaration: declaration.replace(/^.*?(box-shadow|border-)/, '$1') }))
    )

it('finds the accent edges (guards the scan itself)', () => {
  expect(edgeDeclarations().length).toBeGreaterThanOrEqual(8)
})

it('every accent edge is border-accent', () => {
  const other = edgeDeclarations().filter(({ declaration }) => /--ggarry-(bg|text)-accent\b/.test(declaration) || !declaration.includes('--ggarry-border-accent'))
  expect(other).toEqual([])
})

it('every accent edge is the edge’s or the indicator’s width, never a bare number', () => {
  const bare = edgeDeclarations().filter(({ declaration }) => /inset -?\d+(\.\d+)?px 0 0 var\(--ggarry-border-accent\)|^border-[a-z-]+: \d+(\.\d+)?px solid var\(--ggarry-border-accent\)/.test(declaration))
  expect(bare).toEqual([])
})
