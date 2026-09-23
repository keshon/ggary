/**
 * npm run check:themes [-- -v] [-- --theme <dir>]
 *
 * The same gates the test suite runs, as a report a theme author can read:
 * structure findings, then contrast per context — failures, waivers and the
 * tightest passing rows, because a pair that passes by 0.02 is the next failure.
 * `-v` prints every measurement. Exit code 1 on any finding.
 *
 * `--pay` lowers each theme's literal-debt.json to what is still found, and
 * never raises it: new drift keeps failing. With no ledger yet, it writes the
 * first one from what is there, which is the only way a count goes up.
 *
 * Runs under Node's built-in TypeScript support (Node 22.18+ / 24).
 */
import { existsSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { checkContrast, format } from './contrast.ts'
import type { Finding, ThemeCheck } from './define.ts'
import { DEBT_FILE, checkLiterals, debtOf, findLiterals, formatDebt, pay } from './literals.ts'
import { checkStructure } from './structure.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const args = process.argv.slice(2)
const verbose = args.includes('-v')
const paying = args.includes('--pay')
const only = args.includes('--theme') ? args[args.indexOf('--theme') + 1] : null

const bold = (s: string) => `\x1b[1m${s}\x1b[22m`
const red = (s: string) => `\x1b[31m${s}\x1b[39m`
const green = (s: string) => `\x1b[32m${s}\x1b[39m`
const dim = (s: string) => `\x1b[2m${s}\x1b[22m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[39m`

const line = (f: Finding) =>
  `  ${red('✗')} ${dim(`[${f.check}]`)}${f.context ? ` ${dim(f.context)}` : ''} ${f.message}${f.where ? dim(`  @ ${f.where}`) : ''}`

const dirs = readdirSync(join(root, 'packages')).filter((d) => d.startsWith('theme-') && (!only || d === only))
let failed = 0

for (const dir of dirs) {
  const file = join(root, 'packages', dir, 'theme.check.ts')
  if (!existsSync(file)) {
    console.log(`\n${bold(dir)}\n  ${red('✗')} no theme.check.ts — this theme is not measured`)
    failed++
    continue
  }
  const check: ThemeCheck = (await import(pathToFileURL(file).href)).default
  console.log(`\n${bold(`═══ ${check.name}`)} ${dim(`packages/${dir}`)}`)

  const structure = checkStructure(check, root)
  console.log(structure.length ? bold('structure') : `${green('·')} structure: complete`)
  for (const f of structure) console.log(line(f))

  const ledger = join(root, 'packages', dir, DEBT_FILE)
  if (paying) {
    const next = existsSync(ledger) ? pay(check, root) : debtOf(findLiterals(check, root))
    writeFileSync(ledger, formatDebt(next))
    console.log(dim(`  ${DEBT_FILE} written`))
  }
  const literals = checkLiterals(check, root)
  const owed = debtOf(findLiterals(check, root))
  const owedCount = Object.values(owed).reduce((n, row) => n + Object.values(row).reduce((a, b) => a + (b ?? 0), 0), 0)
  console.log(`${literals.length ? red('✗') : green('·')} literals: ${owedCount} owed in ${Object.keys(owed).length} files`)
  for (const f of literals) console.log(line(f))

  const report = checkContrast(check, root)
  const byContext = new Map<string, typeof report.measurements>()
  for (const m of report.measurements) byContext.set(m.context, [...(byContext.get(m.context) ?? []), m])

  for (const [context, rows] of byContext) {
    const failures = report.findings.filter((f) => f.context === context)
    const waived = rows.filter((m) => m.waived)
    const passed = rows.filter((m) => m.pass).length
    const status = failures.length ? red('✗') : green('·')
    console.log(`${status} ${context.padEnd(26)} ${passed}/${rows.length} pass${waived.length ? yellow(`, ${waived.length} waived`) : ''}`)
    for (const f of failures) console.log(line(f))
    for (const m of verbose ? rows : []) {
      const mark = m.pass ? dim('·') : m.waived ? yellow('~') : red('✗')
      const value = m.value === null ? red(m.error ?? 'error') : format(m.pair, m.value)
      console.log(`    ${mark} ${m.pair.label.padEnd(52)} ${value.padStart(12)}  ${dim(`need ${format(m.pair, m.pair.min)}`)}`)
    }
  }

  const general = report.findings.filter((f) => !f.context)
  for (const f of general) console.log(line(f))

  const waivedRows = report.measurements.filter((m) => m.waived)
  if (waivedRows.length && !verbose) {
    console.log(yellow(`~ ${waivedRows.length} waived measurements:`))
    for (const w of check.waivers ?? []) {
      const hits = waivedRows.filter((m) => m.pair.label === w.pair)
      if (!hits.length) continue
      const values = hits.map((m) => `${m.context} ${format(m.pair, m.value ?? 0)}`).join(', ')
      console.log(`    ${w.pair} ${dim(`(${values})`)}\n      ${dim(w.reason)}`)
    }
  }

  const tight = report.measurements
    .filter((m) => m.pass && m.value !== null)
    .map((m) => ({ m, margin: m.pair.min < 1 ? m.value! - m.pair.min : m.value! / m.pair.min - 1 }))
    .sort((a, b) => a.margin - b.margin)
    .slice(0, 3)
  if (tight.length && !verbose) {
    console.log(dim('  tightest passes:'))
    for (const { m } of tight) console.log(dim(`    ${m.context.padEnd(26)} ${m.pair.label.padEnd(48)} ${format(m.pair, m.value!)}`))
  }

  const total = structure.length + literals.length + report.findings.length
  failed += total
  console.log(
    total
      ? red(`✗ ${check.name}: ${total} finding(s)`)
      : green(`· ${check.name}: ${report.measurements.length} measurements across ${byContext.size} contexts, ${report.inkCount} text colours covered`)
  )
}

process.exit(failed ? 1 : 0)
