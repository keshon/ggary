import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { type Finding, type ThemeCheck, checkContrast, checkStructure } from '@ggary/checks'

/**
 * Every theme package, every rule. Themes are DISCOVERED, not listed: a new
 * packages/theme-* directory is checked the moment it exists, and one that ships
 * without a theme.check.ts fails rather than going unmeasured.
 */

const root = join(__dirname, '..')
const themeDirs = readdirSync(join(root, 'packages')).filter((d) => d.startsWith('theme-'))

const show = (findings: Finding[]) =>
  findings.map((f) => `[${f.check}]${f.context ? ` (${f.context})` : ''} ${f.message}${f.where ? `  @ ${f.where}` : ''}`)

it('finds the themes (guards the discovery itself)', () => {
  expect(themeDirs.length).toBeGreaterThanOrEqual(2)
})

describe.each(themeDirs)('%s', (dir) => {
  const checkFile = join(root, 'packages', dir, 'theme.check.ts')

  it('declares its checks in theme.check.ts', () => {
    expect(existsSync(checkFile), `${dir} has no theme.check.ts — a theme nobody measures`).toBe(true)
  })

  const load = async (): Promise<ThemeCheck> => (await import(pathToFileURL(checkFile).href)).default

  it('is structurally complete', async () => {
    const check = await load()
    expect(check.dir).toBe(dir)
    expect(show(checkStructure(check, root))).toEqual([])
  })

  it('meets its contrast promises, and every text colour is measured', async () => {
    const check = await load()
    const report = checkContrast(check, root)
    expect(report.measurements.length).toBeGreaterThan(0)
    expect(report.inkCount).toBeGreaterThan(0)
    expect(show(report.findings)).toEqual([])
  })
})
