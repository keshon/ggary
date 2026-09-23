import { mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error — a plain .mjs build module, no declarations
import { compileIcons } from '../packages/icons/compile.mjs'

/**
 * The icon contract, checked from the source tree rather than from a render:
 *
 *   core      names a glyph           data-icon="check"
 *   a theme   draws it                --gg-icon-check: url(...)
 *   adapters  do neither              an empty <span>
 *
 * Each rule below is one way that split erodes quietly.
 */

const root = join(__dirname, '..')
const pkg = (...parts: string[]) => join(root, 'packages', ...parts)

function walk(dir: string, exts: string[]): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return walk(path, exts)
    return exts.some((ext) => path.endsWith(ext)) ? [path] : []
  })
}

const glyphNames = (dir: string) =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.svg'))
    .map((f) => basename(f, '.svg'))

const baseGlyphs = new Set(glyphNames(pkg('icons', 'svg')))

describe('core names only glyphs that exist', () => {
  const emitted = walk(pkg('core', 'src'), ['.ts']).flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(/'data-icon':\s*'([^']+)'/g)].map((m) => ({ name: m[1], file }))
  )

  it('finds the icons core emits (guards the scan itself)', () => {
    expect(emitted.length).toBeGreaterThan(0)
  })

  it.each(emitted.map((e) => [e.name, basename(e.file)]))('"%s" in %s is in the base set', (name) => {
    expect(baseGlyphs.has(name)).toBe(true)
  })
})

describe('adapters draw no glyphs', () => {
  // A glyph in adapter markup is a glyph no theme can replace, copied into every
  // framework. That is exactly what @ggary/icons removed.
  //
  // The charts are the one exception: a sparkline's line and a ring's arc are
  // DATA — their shape comes from the numbers, so no glyph set can hold them.
  // They draw an <svg> whose geometry core computed, and still no glyph.
  const CHARTS = ['sparkline', 'ring']
  const isChart = (file: string) => CHARTS.some((chart) => file.includes(`components/${chart}/`) || file.includes(`components\\${chart}\\`))
  const everyAdapterFile = ['react', 'svelte'].flatMap((name) => walk(pkg(name, 'src'), ['.ts', '.tsx', '.svelte']))
  const adapterFiles = everyAdapterFile.filter((file) => !isChart(file))
  const chartFiles = everyAdapterFile.filter(isChart)

  it.each(adapterFiles.map((f) => [f.slice(root.length + 1)]))('%s', (file) => {
    const source = readFileSync(join(root, file), 'utf8')
    expect(source).not.toMatch(/<svg|<path|createElementNS/)
  })

  it.each(chartFiles.length ? chartFiles.map((f) => [f.slice(root.length + 1)]) : [['(no chart adapter yet)']])('%s draws data, not glyphs', (file) => {
    if (file.startsWith('(')) return
    const source = readFileSync(join(root, file), 'utf8')
    expect(source).toMatch(/<(svg|path|circle|rect|polyline|line|g)/)
    // A glyph would arrive as a sprite or a hand-built node; data does not.
    expect(source).not.toMatch(/<use|xlink:href|createElementNS/)
  })
})

describe('themes', () => {
  const themes = readdirSync(join(root, 'packages')).filter((d) => d.startsWith('theme-'))

  it('finds the themes (guards the scan itself)', () => {
    expect(themes.length).toBeGreaterThanOrEqual(1)
  })

  // Without the base set loaded, [data-icon] has no --gg-icon and draws nothing —
  // with no error anywhere.
  it.each(themes)('%s loads the base glyph set', (theme) => {
    const entry = readFileSync(pkg(theme, 'src', 'index.css'), 'utf8')
    expect(entry).toContain("@import '@ggary/icons/icons.css'")
  })

  // An override may reshape a glyph but not invent a name: nothing would ever
  // render it, and a typo in a file name would silently keep the default glyph.
  it.each(themes)('%s overrides only glyphs the base set defines', (theme) => {
    const dir = pkg(theme, 'icons')
    let names: string[] = []
    try {
      names = glyphNames(dir)
    } catch {
      return // this theme draws every glyph with the defaults
    }
    expect(names.filter((n) => !baseGlyphs.has(n))).toEqual([])
  })
})

describe('the glyph compiler', () => {
  const scratch = (files: Record<string, string>) => {
    const dir = mkdtempSync(join(tmpdir(), 'gg-icons-'))
    for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body)
    return dir
  }
  const svg = (body = '<path d="M0 0h1"/>') =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">${body}</svg>`

  it('emits a token per glyph and, for the base set only, the name mapping', () => {
    const dir = scratch({ 'arrow-up.svg': svg() })
    const out = join(dir, 'out.css')
    compileIcons({ srcDir: dir, outCss: out, mapping: true })
    const css = readFileSync(out, 'utf8')
    expect(css).toContain('--gg-icon-arrow-up: url("data:image/svg+xml,')
    expect(css).toContain("[data-icon='arrow-up'] { --gg-icon: var(--gg-icon-arrow-up); }")

    compileIcons({ srcDir: dir, outCss: out })
    expect(readFileSync(out, 'utf8')).not.toContain('[data-icon=')
  })

  it('rejects a glyph with no viewBox — it could not scale into its box', () => {
    const dir = scratch({ 'bad.svg': '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>' })
    expect(() => compileIcons({ srcDir: dir, outCss: join(dir, 'o.css') })).toThrow(/viewBox/)
  })

  it('rejects styles and scripts inside a glyph', () => {
    const dir = scratch({ 'bad.svg': svg('<style>path{fill:red}</style>') })
    expect(() => compileIcons({ srcDir: dir, outCss: join(dir, 'o.css') })).toThrow(/not allowed/)
  })

  it('rejects a name that is not kebab-case', () => {
    const dir = scratch({ 'Arrow_Up.svg': svg() })
    expect(() => compileIcons({ srcDir: dir, outCss: join(dir, 'o.css') })).toThrow(/kebab-case/)
  })
})
