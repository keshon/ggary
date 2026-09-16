/**
 * The contrast gate, ported from instrument/tools/cmd/contrast and generalised
 * to any theme: the engine is shared, the pairs belong to the theme, and the
 * contract pairs belong to everyone.
 */
import { join, relative, resolve } from 'node:path'
import { ResolveError, Resolver, ratio, step, stepOf } from './color.ts'
import { loadContract } from './contract.ts'
import { cascadeOnRoot } from './css.ts'
import type { Finding, Measurement, Pair, ThemeCheck } from './define.ts'
import { loadTheme } from './structure.ts'

const isStep = (pair: Pair) => pair.min < 1

function measure(resolver: Resolver, pair: Pair): number {
  const bg = resolver.flatten(pair.bg)
  const fg = resolver.color(pair.fg)
  if (!isStep(pair)) return ratio(fg, bg)
  if (!pair.alt) return step(fg, bg)
  // Directional: the pair's layer must be QUIETER than the alternative on the
  // same ground. A reversed ladder gives a negative number and fails.
  const alternative = resolver.flatten(pair.alt)
  return stepOf(alternative, bg) - step(fg, bg)
}

export interface ContrastReport {
  measurements: Measurement[]
  findings: Finding[]
  /** Number of distinct colours the theme's CSS paints text with. */
  inkCount: number
}

export function checkContrast(check: ThemeCheck, workspaceRoot: string): ContrastReport {
  const { css, rules, srcDir } = loadTheme(check, workspaceRoot)
  const pairs = [...loadContract(workspaceRoot).pairs, ...check.pairs]
  const measurements: Measurement[] = []
  const findings: Finding[] = []
  const waivers = check.waivers ?? []
  const usedWaivers = new Set<(typeof waivers)[number]>()

  for (const context of check.contexts) {
    const resolver = new Resolver(cascadeOnRoot(rules, { attributes: context.attributes }, css.layerOrder))
    for (const pair of pairs) {
      const waiver = waivers.find((w) => w.pair === pair.label && (w.context === undefined || w.context === context.label))
      let value: number | null = null
      let error: string | undefined
      try {
        value = measure(resolver, pair)
      } catch (e) {
        if (!(e instanceof ResolveError)) throw e
        error = e.message
      }
      const pass = value !== null && value >= pair.min
      measurements.push({ context: context.label, pair, value, pass, waived: Boolean(waiver) && !pass, error })

      if (waiver) {
        usedWaivers.add(waiver)
        if (pass) {
          findings.push({
            theme: check.name,
            check: 'waivers',
            context: context.label,
            message: `"${pair.label}" is waived but now passes (${format(pair, value!)}) — remove the waiver`,
          })
        }
        continue
      }
      if (!pass) {
        findings.push({
          theme: check.name,
          check: 'contrast',
          context: context.label,
          message: error
            ? `"${pair.label}": ${error}`
            : `"${pair.label}" is ${format(pair, value!)}, needs ${format(pair, pair.min)}`,
        })
      }
    }
  }

  for (const waiver of waivers) {
    if (!usedWaivers.has(waiver)) {
      findings.push({ theme: check.name, check: 'waivers', message: `waiver for "${waiver.pair}" matches no pair or context` })
    }
  }

  // --- coverage ------------------------------------------------------------------
  //
  // The pair table is written by hand, and must be: a pair carries the stack a
  // colour sits on, which no tool can derive. But a GAP in the table is
  // derivable. Every colour the theme paints text with must be the foreground of
  // at least one pair — otherwise it is a threshold nobody measured, found later
  // by someone who cannot read the label.
  //
  // Instrument skipped relay variables (--btn-fg, --tone-ink) by a hand-kept
  // name pattern. Here relays are FOLLOWED instead: a custom property that is
  // not declared on the root is a component-local relay, and every value it is
  // ever given is traced down to root tokens, which are what must be covered.
  const root = cascadeOnRoot(rules, { attributes: {} }, css.layerOrder)
  const tokenDirs = (check.tokenDirs ?? []).map((d) => resolve(join(srcDir, d)))
  const applied = rules.filter((r) => {
    const file = resolve(r.file)
    return file.startsWith(resolve(srcDir)) && !tokenDirs.some((d) => file.startsWith(d)) && !file.endsWith('contract.css')
  })

  const relayValues = new Map<string, string[]>()
  for (const rule of rules) {
    for (const decl of rule.declarations) {
      if (!decl.property.startsWith('--') || root.get(decl.property) !== undefined) continue
      relayValues.set(decl.property, [...(relayValues.get(decl.property) ?? []), decl.value])
    }
  }

  const ink = new Map<string, string>()
  const trace = (value: string, where: string, seen = new Set<string>()) => {
    for (const m of value.matchAll(/var\(\s*(--[\w-]+)/g)) {
      const name = m[1]
      if (seen.has(name)) continue
      seen.add(name)
      if (root.get(name) !== undefined) {
        if (!ink.has(name)) ink.set(name, where)
      } else {
        for (const relayed of relayValues.get(name) ?? []) trace(relayed, where, seen)
      }
    }
  }
  for (const rule of applied) {
    for (const decl of rule.declarations) {
      if (decl.property !== 'color') continue
      trace(decl.value, `${relative(workspaceRoot, rule.file).replace(/\\/g, '/')}:${decl.line}`)
    }
  }

  const covered = new Set(pairs.map((p) => p.fg))
  for (const [token, where] of [...ink].sort()) {
    if (!covered.has(token)) {
      findings.push({
        theme: check.name,
        check: 'coverage',
        message: `${token} paints text but is the foreground of no pair — add a row to the theme's pair table`,
        where,
      })
    }
  }

  return { measurements, findings, inkCount: ink.size }
}

export function format(pair: Pair, value: number): string {
  return isStep(pair) ? `ΔL ${value.toFixed(3)}` : `${value.toFixed(2)}:1`
}
