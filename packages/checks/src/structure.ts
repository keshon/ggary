/**
 * Structural checks: is this package a complete, well-formed theme?
 *
 * Each check below is one way a theme goes wrong WITHOUT any visible error: a
 * custom property that resolves to nothing paints nothing, a stylesheet nobody
 * imports is dead code, a missing component file means that component renders
 * unstyled in one theme only. None of those throw; all of them ship.
 */
import { existsSync, readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { loadContract } from './contract.ts'
import { type LoadedCss, type Rule, cascadeOnRoot, listCss, loadCss, rulesOf } from './css.ts'
import type { Finding, ThemeCheck } from './define.ts'

export interface ThemeSource {
  css: LoadedCss
  rules: Rule[]
  packageDir: string
  srcDir: string
}

export function loadTheme(check: ThemeCheck, workspaceRoot: string): ThemeSource {
  const packageDir = join(workspaceRoot, 'packages', check.dir)
  const srcDir = join(packageDir, 'src')
  const css = loadCss(join(srcDir, 'index.css'), workspaceRoot)
  return { css, rules: rulesOf(css), packageDir, srcDir }
}

const where = (workspaceRoot: string, file: string, line?: number) =>
  `${relative(workspaceRoot, file).replace(/\\/g, '/')}${line ? `:${line}` : ''}`

/** Every `var(--name)` WITHOUT a fallback, with its line. */
function requiredVariables(text: string): { name: string; line: number }[] {
  const out: { name: string; line: number }[] = []
  const re = /var\(\s*(--[\w-]+)\s*([,)])/g
  for (const m of text.matchAll(re)) {
    if (m[2] === ',') continue
    out.push({ name: m[1], line: text.slice(0, m.index).split('\n').length })
  }
  return out
}

export function checkStructure(check: ThemeCheck, workspaceRoot: string): Finding[] {
  const findings: Finding[] = []
  const add = (f: Omit<Finding, 'theme'>) => findings.push({ theme: check.name, ...f })
  const contract = loadContract(workspaceRoot)
  const { css, rules, packageDir, srcDir } = loadTheme(check, workspaceRoot)
  const inTheme = (path: string) => resolve(path).startsWith(resolve(packageDir))

  // 1. Every import resolves. A missing file is otherwise silently skipped by
  //    some bundlers and fatal in others.
  for (const m of css.missing) {
    add({ check: 'imports', message: `cannot resolve @import '${m.specifier}'`, where: m.from })
  }

  // 2. The layer order IS the kit contract: application CSS wins by being
  //    unlayered, and every theme must stack its own layers identically.
  const order = css.layerOrder?.join(', ') ?? '(no @layer statement)'
  if (order !== contract.layers.join(', ')) {
    add({
      check: 'layers',
      message: `layer order is "${order}", the contract requires "${contract.layers.join(', ')}"`,
      where: where(workspaceRoot, css.entry),
    })
  }

  // 3. Orphans: a stylesheet in src/ that the entry never reaches is dead, and
  //    usually a component someone believes is styled.
  const loaded = new Set(css.files.map((f) => f.path))
  for (const file of listCss(srcDir)) {
    if (!loaded.has(file)) add({ check: 'orphans', message: 'not imported by src/index.css', where: where(workspaceRoot, file) })
  }

  // 4. Parity: every component core ships has a stylesheet in every theme.
  //    "Done" for a component means done in all themes; this makes that a rule
  //    rather than a habit. A frozen theme names the components it answers for,
  //    and those are held to the same rule; a name core does not ship is a typo.
  const componentsDir = join(workspaceRoot, 'packages', 'core', 'src', 'components')
  const shipped = readdirSync(componentsDir)
  for (const name of check.components ?? []) {
    if (!shipped.includes(name)) add({ check: 'parity', message: `answers for "${name}", which core does not ship` })
  }
  for (const component of check.components ?? shipped) {
    const expected = resolve(join(srcDir, 'components', `${component}.css`))
    if (!existsSync(expected)) {
      add({ check: 'parity', message: `core ships "${component}" but the theme has no components/${component}.css` })
    } else if (!loaded.has(expected)) {
      add({ check: 'parity', message: `components/${component}.css exists but is not imported` })
    }
  }

  // 5. The public contract: every name mapped on the root, and no invented
  //    --gg-* names (a typo in a contract name is a token nobody reads).
  const onRoot = cascadeOnRoot(rules, { attributes: {} }, css.layerOrder)
  for (const name of Object.keys(contract.tokens)) {
    if (onRoot.get(name) === undefined) add({ check: 'contract', message: `does not map ${name} on the root` })
  }
  const known = new Set([...Object.keys(contract.tokens), ...Object.keys(contract.runtime)])
  for (const rule of rules) {
    if (!inTheme(rule.file)) continue
    for (const decl of rule.declarations) {
      if (decl.property.startsWith('--gg-') && !known.has(decl.property) && !decl.property.startsWith('--gg-icon-')) {
        add({
          check: 'contract',
          message: `declares ${decl.property}, which is not a contract name — theme-private tokens need their own prefix`,
          where: where(workspaceRoot, rule.file, decl.line),
        })
      }
    }
  }

  // 6. Every var() without a fallback resolves to a declaration SOMEWHERE in
  //    what this theme loads. Checked per theme in isolation, which also catches
  //    one theme's private token leaking into another's CSS.
  const declared = new Set<string>(Object.keys(contract.runtime))
  for (const rule of rules) for (const decl of rule.declarations) if (decl.property.startsWith('--')) declared.add(decl.property)
  for (const file of css.files) {
    for (const use of requiredVariables(file.text)) {
      if (!declared.has(use.name)) {
        add({
          check: 'variables',
          message: `var(${use.name}) is never declared and has no fallback — it paints nothing`,
          where: where(workspaceRoot, file.path, use.line),
        })
      }
    }
  }

  // 7. No class selectors. The styling contract is [data-scope][data-part] plus
  //    state attributes; a class is a selector no component emits.
  for (const rule of rules) {
    if (!inTheme(rule.file) && !rule.file.includes(`${join('packages', 'structure')}`)) continue
    const bare = rule.selector.replace(/"[^"]*"|'[^']*'/g, '""').replace(/\[[^\]]*\]/g, '[]')
    if (/(^|[^\w-])\.[A-Za-z_-]/.test(bare)) {
      add({
        check: 'selectors',
        message: `class selector "${rule.selector}" — style [data-scope][data-part] and state attributes instead`,
        where: where(workspaceRoot, rule.file, rule.line),
      })
    }
  }

  // 8. @ggary/structure is shared by every theme, so it may only read the
  //    public contract (or what it declares itself). A theme-private token in
  //    it would work in one theme and resolve to nothing in the next.
  const structureFiles = css.files.filter((f) => f.path.includes(join('packages', 'structure')))
  const structureDeclared = new Set<string>()
  for (const rule of rules) {
    if (!rule.file.includes(join('packages', 'structure'))) continue
    for (const decl of rule.declarations) if (decl.property.startsWith('--')) structureDeclared.add(decl.property)
  }
  for (const file of structureFiles) {
    for (const m of file.text.matchAll(/var\(\s*(--[\w-]+)/g)) {
      const name = m[1]
      if (name.startsWith('--gg-') || structureDeclared.has(name)) continue
      add({
        check: 'structure',
        message: `shared structure reads ${name}, which is not a --gg-* contract name`,
        where: where(workspaceRoot, file.path, file.text.slice(0, m.index).split('\n').length),
      })
    }
  }

  // 9. Structure stacks with the contract's levels. A number there is a level
  //    no theme can move and no page can read, and the next number written
  //    beside it is a guess at where the first one stands.
  for (const rule of rules) {
    if (!rule.file.includes(join('packages', 'structure'))) continue
    for (const decl of rule.declarations) {
      if (decl.property !== 'z-index' || !/^-?\d+$/.test(decl.value.trim()) || Math.abs(Number(decl.value)) < 10) continue
      add({
        check: 'structure',
        message: `shared structure stacks at z-index ${decl.value} — read a --gg-z-* level instead`,
        where: where(workspaceRoot, rule.file, decl.line),
      })
    }
  }

  return findings
}
