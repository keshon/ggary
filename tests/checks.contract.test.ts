import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  LARGE,
  STEP,
  TEXT,
  type ThemeCheck,
  Resolver,
  checkContrast,
  checkLiterals,
  checkStructure,
  classify,
  pay,
  ratio,
  toHex,
} from '@ggary/checks'
import { cascadeOnRoot, loadCss, matchRoot, rulesOf } from '../packages/checks/src/css'

/**
 * The gate's own tests. A check that cannot fail is decoration, so every rule
 * here is proven by building a tiny workspace with exactly one defect planted
 * and watching that rule — and only that rule — report it.
 */

// --- a throwaway workspace -----------------------------------------------------

const CONTRACT = {
  layers: ['gg.tokens', 'gg.structure', 'gg.base', 'gg.components', 'gg.forced', 'gg.motion'],
  tokens: { '--gg-page': 'page', '--gg-text': 'text' },
  runtime: { '--gg-available-height': 'runtime' },
}

const LAYERS = '@layer gg.tokens, gg.structure, gg.base, gg.components, gg.forced, gg.motion;'

interface Fixture {
  files?: Record<string, string>
  components?: string[]
}

function workspace({ files = {}, components = ['button'] }: Fixture = {}): string {
  const dir = mkdtempSync(join(tmpdir(), 'gg-checks-'))
  const write = (path: string, body: string) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), body)
  }
  write('packages/structure/contract.json', JSON.stringify(CONTRACT))
  write('packages/structure/package.json', JSON.stringify({ exports: { '.': './src/index.css' } }))
  write('packages/structure/src/index.css', '[data-scope] { box-sizing: border-box; }')
  for (const c of components) write(`packages/core/src/components/${c}/index.ts`, '')

  const defaults: Record<string, string> = {
    'packages/theme-x/src/index.css': [
      LAYERS,
      "@import './tokens.css' layer(gg.tokens);",
      "@import '@ggary/structure' layer(gg.structure);",
      ...components.map((c) => `@import './components/${c}.css' layer(gg.components);`),
    ].join('\n'),
    'packages/theme-x/src/tokens.css': ':root { --x-ink: #111111; --x-paper: #ffffff; --gg-page: var(--x-paper); --gg-text: var(--x-ink); }',
    ...Object.fromEntries(
      components.map((c) => [`packages/theme-x/src/components/${c}.css`, `[data-scope='${c}'] { color: var(--x-ink); }`])
    ),
  }
  for (const [path, body] of Object.entries({ ...defaults, ...files })) write(path, body)
  return dir
}

const theme = (overrides: Partial<ThemeCheck> = {}): ThemeCheck => ({
  name: 'X',
  dir: 'theme-x',
  contexts: [{ label: 'light', attributes: {} }],
  pairs: [{ label: 'ink on paper', fg: '--x-ink', bg: ['--x-paper'], min: TEXT }],
  ...overrides,
})

const kinds = (root: string, check = theme()) => checkStructure(check, root).map((f) => f.check)

// --- structure -------------------------------------------------------------------

describe('structural checks', () => {
  it('a well-formed theme has no findings (the baseline every case below breaks)', () => {
    const root = workspace()
    expect(checkStructure(theme(), root)).toEqual([])
    expect(checkContrast(theme(), root).findings).toEqual([])
  })

  it('reports an import that does not resolve', () => {
    const root = workspace({
      files: { 'packages/theme-x/src/index.css': `${LAYERS}\n@import './tokens.css' layer(gg.tokens);\n@import './missing.css';\n@import './components/button.css';` },
    })
    expect(kinds(root)).toContain('imports')
  })

  it('reports a layer order that differs from the contract', () => {
    const root = workspace({
      files: {
        'packages/theme-x/src/index.css':
          "@layer gg.tokens, gg.components, gg.base;\n@import './tokens.css' layer(gg.tokens);\n@import './components/button.css' layer(gg.components);",
      },
    })
    expect(kinds(root)).toContain('layers')
  })

  it('reports a stylesheet nothing imports', () => {
    const root = workspace({ files: { 'packages/theme-x/src/components/forgotten.css': '[data-scope="x"] {}' } })
    expect(kinds(root)).toEqual(['orphans'])
  })

  it('a frozen theme answers only for what it lists — and a listed name must exist', () => {
    const root = workspace({ components: ['button'] })
    mkdirSync(join(root, 'packages/core/src/components/dialog'), { recursive: true })
    // dialog arrived after the freeze: not owed.
    expect(kinds(root, theme({ components: ['button'] }))).toEqual([])
    // a listed component the theme lost is still caught, and so is a typo.
    expect(kinds(root, theme({ components: ['button', 'dialog'] }))).toEqual(['parity'])
    expect(kinds(root, theme({ components: ['button', 'buton'] }))).toEqual(['parity', 'parity'])
  })

  it('reports a component core ships but the theme does not style', () => {
    const root = workspace({ components: ['button'] })
    // core grows a component the theme never heard of
    mkdirSync(join(root, 'packages/core/src/components/dialog'), { recursive: true })
    expect(kinds(root)).toEqual(['parity'])
  })

  it('reports a contract token the theme does not map, and an invented --gg-* name', () => {
    const root = workspace({
      files: { 'packages/theme-x/src/tokens.css': ':root { --x-ink: #111; --x-paper: #fff; --gg-page: var(--x-paper); --gg-textt: var(--x-ink); }' },
    })
    const findings = checkStructure(theme(), root).filter((f) => f.check === 'contract').map((f) => f.message)
    expect(findings.some((m) => m.includes('does not map --gg-text'))).toBe(true)
    expect(findings.some((m) => m.includes('--gg-textt'))).toBe(true)
  })

  it('reports var() of a name declared nowhere — and accepts a fallback or a runtime name', () => {
    const root = workspace({
      files: {
        'packages/theme-x/src/components/button.css':
          "[data-scope='button'] { color: var(--x-typo); height: var(--gg-available-height); margin: var(--x-optional, 0); }",
      },
    })
    const findings = checkStructure(theme(), root).filter((f) => f.check === 'variables')
    expect(findings.map((f) => f.message)).toEqual([expect.stringContaining('var(--x-typo)')])
  })

  it('reports a class selector, but not a dot inside an attribute value or a number', () => {
    const root = workspace({
      files: {
        'packages/theme-x/src/components/button.css':
          "[data-scope='button'] { color: var(--x-ink); }\n[data-value='a.b'] { opacity: 0.5; }\n.btn-primary { color: var(--x-ink); }",
      },
    })
    const findings = checkStructure(theme(), root).filter((f) => f.check === 'selectors')
    expect(findings.map((f) => f.message)).toEqual([expect.stringContaining('.btn-primary')])
  })

  it('reports shared structure reading a theme-private token', () => {
    const root = workspace({
      files: { 'packages/structure/src/index.css': '[data-scope] { color: var(--x-ink); padding: var(--gg-page, 0); }' },
    })
    expect(kinds(root)).toEqual(['structure'])
  })

  it('reports shared structure stacking at a literal level, and accepts a contract level', () => {
    const at = (value: string) =>
      workspace({ files: { 'packages/structure/src/index.css': `[data-scope] { z-index: ${value}; }` } })
    expect(kinds(at('30'))).toEqual(['structure'])
    expect(kinds(at('var(--gg-page)'))).toEqual([])
    expect(kinds(at('1'))).toEqual([])
  })
})

// --- literals --------------------------------------------------------------------

describe('literal gate', () => {
  it('puts a raw value in its family, and lets through what each family allows', () => {
    const cases: [string, string, string[]][] = [
      ['color', '#b00', ['colour']],
      ['background', 'rgb(0 0 0 / 0.2)', ['colour']],
      ['background', 'color-mix(in srgb, currentColor 12%, transparent)', ['colour']],
      ['background', 'color-mix(in oklab, var(--x-ink) 12%, transparent)', []],
      ['mask', 'radial-gradient(#000, transparent)', []],
      ['color', 'var(--x-color-white)', ['primitive']],
      ['border-radius', '2px', ['radius']],
      ['border-radius', '0', []],
      ['--tabs-radius', 'max(2px, var(--r))', ['radius']],
      ['line-height', '1.6', ['line-height']],
      ['line-height', '20px', ['line-height']],
      ['line-height', '1', []],
      ['line-height', 'calc(var(--row) - 1px)', []],
      ['opacity', '0.55', ['opacity']],
      ['opacity', '0', []],
      ['opacity', 'var(--x-opacity-disabled)', []],
      ['font-size', '11px', ['font-size']],
      ['font-size', '0.85em', []],
      ['font-weight', '600', ['font-weight']],
      ['transition', 'color var(--fast) ease', ['motion']],
      ['transition', 'color 120ms var(--easing)', ['motion']],
      ['animation', 'spin var(--slow) linear infinite', []],
      ['outline-offset', '-2px', ['focus']],
      ['outline-offset', 'calc(-1 * var(--ring))', []],
      ['outline', '1px solid var(--x-alarm)', []],
      ['border-inline-start', '3px solid var(--x-ink)', ['edge']],
      ['border', '1px solid var(--x-ink)', []],
      ['z-index', '40', ['z-index']],
      ['z-index', '2', []],
    ]
    for (const [property, value, families] of cases) {
      expect(classify(property, value), `${property}: ${value}`).toEqual(families)
    }
  })

  const literal = (body: string, debt?: object) => {
    const root = workspace({ files: { 'packages/theme-x/src/components/button.css': body } })
    if (debt) writeFileSync(join(root, 'packages/theme-x/literal-debt.json'), JSON.stringify(debt))
    return root
  }
  const RAW = "[data-scope='button'] { color: var(--x-ink); line-height: 1.6; }"

  it('fails a raw value the ledger does not owe, where it stands', () => {
    const [finding] = checkLiterals(theme(), literal(RAW))
    expect(finding.check).toBe('literals')
    expect(finding.message).toMatch(/^line-height: line-height: 1\.6/)
    expect(finding.where).toBe('packages/theme-x/src/components/button.css:1')
  })

  it('accepts what the ledger owes, and fails a ledger that owes more than is left', () => {
    expect(checkLiterals(theme(), literal(RAW, { 'components/button.css': { 'line-height': 1 } }))).toEqual([])
    const paid = literal("[data-scope='button'] { color: var(--x-ink); }", { 'components/button.css': { 'line-height': 1 } })
    expect(checkLiterals(theme(), paid).map((f) => f.message)).toEqual([
      expect.stringMatching(/^line-height: the ledger owes 1 here and 0 remain/),
    ])
  })

  it('pays a ledger down and never up: new drift stays out of it', () => {
    const root = literal("[data-scope='button'] { line-height: 1.6; opacity: 0.5; }", {
      'components/button.css': { 'line-height': 2 },
    })
    expect(pay(theme(), root)).toEqual({ 'components/button.css': { 'line-height': 1 } })
  })

  it('does not read the tokens layer, forced colours or keyframes', () => {
    const root = workspace({
      files: {
        'packages/theme-x/src/tokens.css': ':root { --x-ink: #111111; --x-paper: #ffffff; --gg-page: var(--x-paper); --gg-text: var(--x-ink); }',
        'packages/theme-x/src/components/button.css': [
          "[data-scope='button'] { color: var(--x-ink); }",
          "@media (forced-colors: active) { [data-scope='button'] { outline: 2px solid Highlight; } }",
          '@keyframes x-pulse { 50% { opacity: 0.35; } }',
        ].join('\n'),
      },
    })
    expect(checkLiterals(theme(), root)).toEqual([])
  })
})

// --- contrast --------------------------------------------------------------------

describe('contrast gate', () => {
  const colours = (tokens: string) =>
    workspace({ files: { 'packages/theme-x/src/tokens.css': `:root { --gg-page: var(--x-paper); --gg-text: var(--x-ink); ${tokens} }` } })

  it('fails a pair below its threshold, with the measured value', () => {
    const root = colours('--x-ink: #999999; --x-paper: #ffffff;')
    const [finding] = checkContrast(theme(), root).findings
    expect(finding.check).toBe('contrast')
    expect(finding.message).toMatch(/2\.85:1, needs 4\.50:1/)
  })

  it('accepts a waived failure, and fails a waiver whose pair now passes', () => {
    const failing = colours('--x-ink: #999999; --x-paper: #ffffff;')
    const waived = theme({ waivers: [{ pair: 'ink on paper', reason: 'known' }] })
    expect(checkContrast(waived, failing).findings).toEqual([])

    const passing = colours('--x-ink: #111111; --x-paper: #ffffff;')
    expect(checkContrast(waived, passing).findings.map((f) => f.check)).toEqual(['waivers'])
  })

  it('reports a text colour no pair measures — traced through component relays', () => {
    const root = workspace({
      files: {
        'packages/theme-x/src/tokens.css':
          ':root { --x-ink: #111; --x-paper: #fff; --x-alarm: #b00; --gg-page: var(--x-paper); --gg-text: var(--x-ink); }',
        // --btn-fg is a relay declared only on the component, never on the root
        'packages/theme-x/src/components/button.css':
          "[data-scope='button'] { --btn-fg: var(--x-ink); color: var(--btn-fg); }\n[data-tone='danger'] { --btn-fg: var(--x-alarm); }",
      },
    })
    const findings = checkContrast(theme(), root).findings
    expect(findings.map((f) => `${f.check}: ${f.message.split(' ')[0]}`)).toEqual(['coverage: --x-alarm'])
  })

  it('measures a translucent layer composited over its base, not against black', () => {
    const root = colours('--x-ink: #111111; --x-paper: #ffffff; --x-film: rgba(0, 0, 0, 0.06);')
    const check = theme({ pairs: [{ label: 'ink on film', fg: '--x-ink', bg: ['--x-paper', '--x-film'], min: TEXT }] })
    const [m] = checkContrast(check, root).measurements.filter((x) => x.pair.label === 'ink on film')
    expect(m.value!).toBeGreaterThan(15) // #111 on a near-white film; against black it would be ~1.1
  })

  it('fails a reversed ladder even when the absolute difference is large enough', () => {
    const root = colours('--x-ink: #111; --x-paper: #ffffff; --x-soft: rgba(0,0,0,0.20); --x-default: rgba(0,0,0,0.05);')
    const check = theme({
      pairs: [
        ...theme().pairs,
        { label: 'soft quieter than default', fg: '--x-soft', bg: ['--x-paper'], alt: ['--x-paper', '--x-default'], min: STEP },
      ],
    })
    expect(checkContrast(check, root).findings.map((f) => f.check)).toEqual(['contrast'])
  })
})

// --- the engine ------------------------------------------------------------------

describe('resolver', () => {
  const resolver = (tokens: Record<string, string>) => new Resolver({ get: (name) => tokens[name] })

  it('converts OKLCH to sRGB the way a browser does', () => {
    // Instrument's light page, as a browser reported it: oklch(0.976 0 75) = #f7f7f7
    expect(toHex(resolver({}).color('oklch(0.976 0 75)'))).toBe('#f7f7f7')
  })

  it('substitutes var() recursively, with fallbacks, then collapses calc()', () => {
    const r = resolver({ '--tint': '2', '--chroma': 'calc(0.02 * var(--tint))', '--c': 'oklch(0.6 var(--chroma) var(--hue, 250))' })
    expect(toHex(r.color('--c'))).toBe(toHex(r.color('oklch(0.6 0.04 250)')))
  })

  it('picks the light-dark() branch by the root colour-scheme', () => {
    const tokens = { '--ink': 'light-dark(#000000, #ffffff)' }
    expect(toHex(resolver({ ...tokens, 'color-scheme': 'light dark' }).color('--ink'))).toBe('#000000')
    expect(toHex(resolver({ ...tokens, 'color-scheme': 'dark' }).color('--ink'))).toBe('#ffffff')
  })

  it('mixes with transparent by alpha alone, keeping the hue', () => {
    const c = resolver({}).color('color-mix(in oklab, #dc2626 10%, transparent)')
    expect(c.a).toBeCloseTo(0.1)
    expect(toHex({ ...c, a: 1 })).toBe('#dc2626')
  })

  it('computes WCAG contrast', () => {
    const r = resolver({})
    expect(ratio(r.color('#000000'), r.color('#ffffff'))).toBeCloseTo(21)
    expect(ratio(r.color('#777777'), r.color('#ffffff'))).toBeCloseTo(4.48, 2)
  })

  it('refuses what it does not model rather than guessing', () => {
    expect(() => resolver({}).color('hsl(0 0% 50%)')).toThrow(/unsupported/)
    expect(() => resolver({}).color('calc(1px + 2px)')).toThrow()
    expect(() => resolver({}).color('--undeclared')).toThrow(/not declared/)
  })
})

describe('cascade on the root', () => {
  it('matches root selectors and rejects descendants, classes and unmet attributes', () => {
    const ctx = { attributes: { 'data-mode': 'dark' } }
    expect(matchRoot(':root', ctx)).not.toBeNull()
    expect(matchRoot(":where(:root, [data-mode])", ctx)).toEqual([0, 0, 0])
    expect(matchRoot("[data-mode='dark']", ctx)).toEqual([0, 1, 0])
    expect(matchRoot(":root:not([data-mode='light'])", ctx)).toEqual([0, 2, 0])
    expect(matchRoot("[data-mode='light']", ctx)).toBeNull()
    expect(matchRoot('[data-scale="15"] [data-density="compact"]', ctx)).toBeNull()
    expect(matchRoot('.theme', ctx)).toBeNull()
  })

  it('lets a later LAYER win over higher specificity, and unlayered win over every layer', () => {
    const root = workspace({
      files: {
        'packages/theme-x/src/index.css': [
          '@layer gg.tokens, gg.structure, gg.base, gg.components, gg.forced, gg.motion;',
          "@import './a.css' layer(gg.tokens);",
          "@import './b.css' layer(gg.base);",
          "@import './c.css';",
        ].join('\n'),
        'packages/theme-x/src/a.css': ":root:not([data-x]) { --v: tokens; --w: tokens; --u: tokens; }",
        'packages/theme-x/src/b.css': ':where(:root) { --v: base; --w: base; }',
        'packages/theme-x/src/c.css': ':where(:root) { --w: unlayered; }',
      },
    })
    const css = loadCss(join(root, 'packages/theme-x/src/index.css'), root)
    const cascade = cascadeOnRoot(rulesOf(css), { attributes: {} }, css.layerOrder)
    expect(cascade.get('--u')).toBe('tokens')
    expect(cascade.get('--v')).toBe('base')
    expect(cascade.get('--w')).toBe('unlayered')
  })
})

it('keeps the thresholds the kit documents', () => {
  expect([TEXT, LARGE, STEP]).toEqual([4.5, 3, 0.022])
})
