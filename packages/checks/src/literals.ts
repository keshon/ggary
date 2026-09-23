/**
 * The literal gate: a value that has a token is written as the token.
 *
 * Every family below has a scale in the theme's tokens. A raw value inside a
 * family is how a design language drifts: one component writes 1.6 where the
 * rest read the body's line height, the next copies it, and by the fifth the
 * scale describes nothing. The gate cannot tell a deliberate value from an
 * accident, so it does not try. It counts, per file and per family, and the
 * theme keeps a ledger of what it has not paid off yet: `literal-debt.json`
 * beside its theme.check.ts. A count above the ledger is new drift and fails.
 * A count below it fails too, until the ledger is lowered, so a paid debt
 * cannot be quietly taken out again.
 *
 * What each family lets through, and why:
 *   colour       named colours (system colours, transparent, currentColor)
 *   primitive    nothing: a component reads the semantic layer
 *   radius       0
 *   line-height  1 (a glyph box), 0, normal, inherit; a 1px hairline in calc()
 *   opacity      0 and 1: shown or not is state, not a value
 *   font-size    em and %: relative to the text around, which is tokenised
 *   font-weight  normal, inherit
 *   motion       0s, linear and steps(): a turn and a blink are not a feel
 *   focus        0, and a 1px hairline: an edge drawn with an outline is not a ring
 *   edge         a 1px hairline: a border wider than that is a mark
 *   z-index      below 10: stacking siblings inside one component
 * Rules under forced colours are not read: the tokens are gone there.
 * Keyframes are not read: a pulse's opacity is the animation, not a state.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { parseRules } from './css.ts'
import type { Finding, ThemeCheck } from './define.ts'
import { loadTheme } from './structure.ts'

export const FAMILIES = [
  'colour', 'primitive', 'radius', 'line-height', 'opacity', 'font-size', 'font-weight', 'motion', 'focus', 'edge', 'z-index',
] as const
export type Family = (typeof FAMILIES)[number]

/** file (relative to the theme's src/, forward slashes) -> family -> count */
export type Debt = Record<string, Partial<Record<Family, number>>>

export interface Literal {
  family: Family
  /** Relative to the theme's src/. */
  file: string
  line: number
  property: string
  value: string
}

export const DEBT_FILE = 'literal-debt.json'

/** Replace every var(...) and url(...), nested parentheses included, by a placeholder. */
function strip(value: string): string {
  let out = ''
  for (let i = 0; i < value.length; i++) {
    const head = /^(var|url)\(/.exec(value.slice(i))
    if (!head) {
      out += value[i]
      continue
    }
    let depth = 0
    let j = i + head[0].length - 1
    for (; j < value.length; j++) {
      if (value[j] === '(') depth++
      else if (value[j] === ')' && --depth === 0) break
    }
    out += head[1] === 'var' ? 'V' : 'U'
    i = j
  }
  return out
}

/** Numbers with a length or percentage unit, as [number, unit]. */
const lengths = (s: string) =>
  [...s.matchAll(/(?<![\w.#-])(-?\d*\.?\d+)(px|rem|em|%|vh|vw|ch|lh)\b/g)].map((m) => [Math.abs(Number(m[1])), m[2]] as const)

/** Every number, with whatever unit follows it ('' for none), as [|number|, unit]. */
const numbers = (s: string) =>
  [...s.matchAll(/(?<![\w.#-])-?(\d*\.?\d+)([a-z%]*)/gi)].map((m) => [Number(m[1]), m[2].toLowerCase()] as const)

const COLOUR = /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(|color-mix\(\s*in\s+srgb/i
const EASING = /\b(ease|ease-in|ease-out|ease-in-out)\b|cubic-bezier\(/
const DURATION = /(?<![\w.-])(\d*\.?\d+)m?s\b/g
const EDGE = /^border(-(top|right|bottom|left|block|inline)(-start|-end)?)?(-width)?$/

/** The families one declaration falls into. */
export function classify(property: string, value: string): Family[] {
  const out = new Set<Family>()
  const v = strip(value)
  const p = property

  // A mask's colour is its alpha, and only its alpha: #000 there is not a colour anyone sees.
  if (COLOUR.test(v) && !/^(-webkit-)?mask/.test(p)) out.add('colour')
  if (/var\(\s*--[\w]+-color-/.test(value)) out.add('primitive')

  if (/(^|-)radius$/.test(p) && lengths(v).some(([n]) => n !== 0)) out.add('radius')

  if (p === 'line-height' || /(^|-)line(-height)?$/.test(p)) {
    const allowed = ([n, unit]: readonly [number, string]) => (unit === '' && (n === 0 || n === 1)) || (unit === 'px' && n === 1)
    if (numbers(v).some((x) => !allowed(x))) out.add('line-height')
  }

  if ((p === 'opacity' || /-opacity$/.test(p)) && /\d/.test(v) && !/^(0|1)$/.test(v.trim())) out.add('opacity')

  if ((p === 'font-size' || /-font-size$/.test(p)) && lengths(v).some(([n, u]) => n !== 0 && (u === 'px' || u === 'rem'))) out.add('font-size')

  if ((p === 'font-weight' || /-font-weight$/.test(p)) && /\d|bold|lighter/.test(v)) out.add('font-weight')

  if (/^(transition|animation)(-|$)/.test(p) || /-(duration|easing)$/.test(p)) {
    const durations = [...v.matchAll(DURATION)].map((m) => Number(m[1]))
    if (durations.some((n) => n !== 0) || EASING.test(v)) out.add('motion')
  }

  if (/^outline(-width|-offset)?$/.test(p) || /-ring-(width|offset)$/.test(p)) {
    if (lengths(v).some(([n]) => n !== 0 && n !== 1)) out.add('focus')
  }

  if (EDGE.test(p) && lengths(v).some(([n, u]) => u === 'px' && n > 1)) out.add('edge')

  if (p === 'z-index' && /\d/.test(v) && Math.abs(Number.parseInt(v, 10)) >= 10) out.add('z-index')

  return [...out]
}

/**
 * Every literal in the files the theme writes itself: src/, less what declares
 * tokens rather than applies them — its token directories and whatever it
 * imports into the tokens layer (the contract map among them).
 */
export function findLiterals(check: ThemeCheck, workspaceRoot: string): Literal[] {
  const { css, srcDir } = loadTheme(check, workspaceRoot)
  const tokenDirs = (check.tokenDirs ?? []).map((d) => resolve(join(srcDir, d)))
  const own = css.files.filter(
    (f) => f.path.startsWith(resolve(srcDir)) && !tokenDirs.some((d) => f.path.startsWith(d)) && f.layer !== 'gg.tokens'
  )
  const out: Literal[] = []
  for (const file of own) {
    const rel = relative(srcDir, file.path).replace(/\\/g, '/')
    for (const rule of parseRules(file)) {
      // Under forced colours the tokens are replaced by system colours, and what
      // is written there is written for that mode alone.
      if (rule.media?.includes('forced-colors')) continue
      for (const decl of rule.declarations) {
        for (const family of classify(decl.property, decl.value)) {
          out.push({ family, file: rel, line: decl.line, property: decl.property, value: decl.value })
        }
      }
    }
  }
  return out
}

export function debtOf(literals: Literal[]): Debt {
  const debt: Debt = {}
  for (const l of [...literals].sort((a, b) => a.file.localeCompare(b.file))) {
    const row = (debt[l.file] ??= {})
    row[l.family] = (row[l.family] ?? 0) + 1
  }
  for (const row of Object.values(debt)) {
    const sorted = Object.fromEntries(FAMILIES.filter((f) => row[f]).map((f) => [f, row[f]]))
    for (const k of Object.keys(row)) delete row[k as Family]
    Object.assign(row, sorted)
  }
  return debt
}

/** One line per file, so a paid debt is a one-line diff. */
export function formatDebt(debt: Debt): string {
  const rows = Object.keys(debt)
    .sort()
    .map((file) => `  ${JSON.stringify(file)}: ${JSON.stringify(debt[file]).replace(/([:,])/g, '$1 ')}`)
  return rows.length ? `{\n${rows.join(',\n')}\n}\n` : '{}\n'
}

export function readDebt(check: ThemeCheck, workspaceRoot: string): Debt {
  const path = join(workspaceRoot, 'packages', check.dir, DEBT_FILE)
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {}
}

export function checkLiterals(check: ThemeCheck, workspaceRoot: string, debt = readDebt(check, workspaceRoot)): Finding[] {
  const literals = findLiterals(check, workspaceRoot)
  const found = debtOf(literals)
  const findings: Finding[] = []
  const files = new Set([...Object.keys(found), ...Object.keys(debt)])
  const src = `packages/${check.dir}/src`
  for (const file of [...files].sort()) {
    for (const family of FAMILIES) {
      const have = found[file]?.[family] ?? 0
      const owed = debt[file]?.[family] ?? 0
      if (have > owed) {
        const hits = literals.filter((l) => l.file === file && l.family === family)
        const shown = hits.slice(owed ? -Math.max(1, have - owed) : 0)
        for (const l of shown) {
          findings.push({
            theme: check.name,
            check: 'literals',
            message: `${family}: ${l.property}: ${l.value} — write it as a token${owed ? ` (the ledger allows ${owed} here, found ${have})` : ''}`,
            where: `${src}/${file}:${l.line}`,
          })
        }
      } else if (have < owed) {
        findings.push({
          theme: check.name,
          check: 'literals',
          message: `${family}: the ledger owes ${owed} here and ${have} remain — lower ${DEBT_FILE} (npm run check:themes -- --pay)`,
          where: `${src}/${file}`,
        })
      }
    }
  }
  return findings
}

/**
 * The ledger after paying: every count lowered to what is found, never raised.
 * What is new stays out of it and keeps failing — that is the point.
 */
export function pay(check: ThemeCheck, workspaceRoot: string, debt = readDebt(check, workspaceRoot)): Debt {
  const found = debtOf(findLiterals(check, workspaceRoot))
  const next: Debt = {}
  for (const [file, row] of Object.entries(debt)) {
    for (const family of FAMILIES) {
      const kept = Math.min(row[family] ?? 0, found[file]?.[family] ?? 0)
      if (kept) (next[file] ??= {})[family] = kept
    }
  }
  return next
}
