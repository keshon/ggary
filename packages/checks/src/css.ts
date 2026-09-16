/**
 * Just enough of a CSS model to check themes against the kit contract.
 *
 * It is deliberately NOT a general CSS engine. It reads the theme files as they
 * ship, follows their @imports the way the bundler does, and answers two kinds
 * of question: "what is written in these files" (structure) and "what value
 * does this custom property have on <html> in this mode" (contrast). Anything
 * outside that — descendant selectors, arbitrary media queries — is reported as
 * not matching, which is the conservative answer for tokens declared on the root.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

// --- source -------------------------------------------------------------------

/**
 * Comment bodies become spaces, line breaks survive — so a finding can still
 * name the right line. Instrument's files are three quarters comment; cutting
 * them out would move every line number by hundreds. (Ported from
 * instrument/tools/internal/css Blank.)
 */
export function blank(text: string): string {
  let out = ''
  let i = 0
  while (i < text.length) {
    if (text[i] === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2)
      const stop = end === -1 ? text.length : end + 2
      out += text.slice(i, stop).replace(/[^\n]/g, ' ')
      i = stop
    } else {
      out += text[i]
      i++
    }
  }
  return out
}

export interface SourceFile {
  path: string
  /** Comment-blanked text. */
  text: string
  /** The cascade layer the file was imported into, if any. */
  layer: string | null
}

export interface LoadedCss {
  entry: string
  files: SourceFile[]
  /** The first `@layer a, b, c;` statement in the entry file, if any. */
  layerOrder: string[] | null
  /** Imports that could not be resolved, with the file that asked for them. */
  missing: { from: string; specifier: string }[]
}

const IMPORT = /@import\s+(?:url\()?\s*['"]([^'"]+)['"]\s*\)?\s*(?:layer\(([^)]+)\))?\s*;/g

/** Resolve `@ggary/<pkg>/<subpath>` through the workspace package's `exports`. */
function resolveWorkspace(specifier: string, workspaceRoot: string): string | null {
  const match = /^@ggary\/([^/]+)(?:\/(.+))?$/.exec(specifier)
  if (!match) return null
  const pkgDir = join(workspaceRoot, 'packages', match[1])
  const manifest = join(pkgDir, 'package.json')
  if (!existsSync(manifest)) return null
  const exportsMap = JSON.parse(readFileSync(manifest, 'utf8')).exports ?? {}
  const key = match[2] ? `./${match[2]}` : '.'
  let target = exportsMap[key]
  if (target === undefined) {
    // Wildcard exports such as "./*.css": "./src/*.css"
    for (const [pattern, value] of Object.entries(exportsMap)) {
      if (!pattern.includes('*')) continue
      const [head, tail] = pattern.split('*')
      if (key.startsWith(head) && key.endsWith(tail)) {
        const star = key.slice(head.length, key.length - tail.length)
        target = String(value).replace('*', star)
        break
      }
    }
  }
  if (target && typeof target === 'object') target = target.default ?? target.style
  return typeof target === 'string' ? join(pkgDir, target) : null
}

/** Load a stylesheet and everything it imports, in cascade order. */
export function loadCss(entry: string, workspaceRoot: string): LoadedCss {
  const files: SourceFile[] = []
  const missing: LoadedCss['missing'] = []
  const seen = new Set<string>()

  const visit = (path: string, layer: string | null) => {
    const abs = resolve(path)
    if (seen.has(abs)) return
    seen.add(abs)
    const text = blank(readFileSync(abs, 'utf8').replace(/\r\n/g, '\n'))
    // Imports come first in a stylesheet, so depth-first order IS cascade order.
    for (const m of text.matchAll(IMPORT)) {
      const specifier = m[1]
      const childLayer = m[2] ? m[2].trim() : layer
      const target = specifier.startsWith('.')
        ? join(dirname(abs), specifier)
        : resolveWorkspace(specifier, workspaceRoot)
      if (!target || !existsSync(target)) {
        missing.push({ from: relative(workspaceRoot, abs), specifier })
        continue
      }
      visit(target, childLayer)
    }
    files.push({ path: abs, text, layer })
  }

  visit(entry, null)
  const entryText = files.find((f) => f.path === resolve(entry))?.text ?? ''
  const order = /@layer\s+([^;{]+);/.exec(entryText)
  return {
    entry: resolve(entry),
    files,
    layerOrder: order ? order[1].split(',').map((s) => s.trim()) : null,
    missing,
  }
}

export function listCss(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return listCss(path)
    return name.endsWith('.css') ? [resolve(path)] : []
  })
}

// --- rules --------------------------------------------------------------------

export interface Declaration {
  property: string
  value: string
  line: number
}

export interface Rule {
  /** Selector list as written; nested rules are NOT flattened into it. */
  selector: string
  /** The enclosing @media condition, or null. */
  media: string | null
  declarations: Declaration[]
  file: string
  /** The cascade layer of the file the rule came from; null is unlayered. */
  layer: string | null
  line: number
  /** Position in the whole loaded set — the tiebreak for equal specificity. */
  order: number
  /** True for a rule nested inside another style rule (CSS nesting). */
  nested: boolean
}

const lineAt = (text: string, index: number) => text.slice(0, index).split('\n').length

/**
 * Split a file into rules. Handles @media blocks and CSS nesting; skips
 * @keyframes, @font-face, @starting-style and @supports bodies' own at-rule
 * preludes but still descends into @supports so their rules are visible to
 * structural checks.
 */
export function parseRules(file: SourceFile, orderStart = 0): Rule[] {
  const { text } = file
  const rules: Rule[] = []
  type Frame = { prelude: string; start: number; body: string; kind: 'rule' | 'media' | 'at' }
  const stack: Frame[] = []
  let prelude = ''
  let preludeStart = 0
  let quote: string | null = null
  let parens = 0
  let order = orderStart

  const mediaOf = () => {
    for (let i = stack.length - 1; i >= 0; i--) if (stack[i].kind === 'media') return stack[i].prelude.replace(/^@media\s*/, '')
    return null
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const top = stack[stack.length - 1]

    if (quote) {
      if (ch === quote && text[i - 1] !== '\\') quote = null
      prelude += ch
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      prelude += ch
      continue
    }
    if (ch === '(') parens++
    if (ch === ')') parens = Math.max(0, parens - 1)

    if (ch === '{' && parens === 0) {
      const head = prelude.trim()
      const kind: Frame['kind'] = head.startsWith('@media')
        ? 'media'
        : head.startsWith('@')
          ? 'at'
          : 'rule'
      // A parent's body only grows on ';', so a nested rule's prelude — still
      // sitting in `prelude` — never reached it and needs no removal.
      stack.push({ prelude: head, start: preludeStart + (prelude.length - prelude.trimStart().length), body: '', kind })
      prelude = ''
      preludeStart = i + 1
      continue
    }

    if (ch === '}' && parens === 0) {
      const frame = stack.pop()
      if (frame && frame.kind === 'rule') {
        const parentIsRule = stack.some((f) => f.kind === 'rule')
        const skip = stack.some((f) => f.kind === 'at' && /^@(keyframes|font-face)/.test(f.prelude))
        if (!skip) {
          const declarations: Declaration[] = []
          const bodyText = frame.body + prelude
          for (const chunk of splitTopLevel(bodyText, ';')) {
            const colon = chunk.indexOf(':')
            if (colon > 0) {
              const property = chunk.slice(0, colon).trim()
              const value = chunk.slice(colon + 1).trim()
              if (/^(--[\w-]+|[a-z-]+)$/.test(property)) {
                const at = text.indexOf(chunk.trim(), frame.start)
                declarations.push({ property, value, line: at >= 0 ? lineAt(text, at) : lineAt(text, frame.start) })
              }
            }
          }
          rules.push({
            selector: frame.prelude,
            media: mediaOf(),
            declarations,
            file: file.path,
            layer: file.layer,
            line: lineAt(text, frame.start),
            order: order++,
            nested: parentIsRule,
          })
        }
      }
      prelude = ''
      preludeStart = i + 1
      continue
    }

    if (ch === ';' && parens === 0) {
      if (top && top.kind === 'rule') top.body += prelude + ';'
      prelude = ''
      preludeStart = i + 1
      continue
    }

    prelude += ch
  }
  return rules
}

/** Split on a separator that is not inside parentheses or quotes. */
export function splitTopLevel(text: string, separator: string): string[] {
  const out: string[] = []
  let depth = 0
  let quote: string | null = null
  let current = ''
  for (const ch of text) {
    if (quote) {
      if (ch === quote) quote = null
    } else if (ch === '"' || ch === "'") quote = ch
    else if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    else if (ch === separator && depth === 0) {
      out.push(current)
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim()) out.push(current)
  return out
}

// --- selectors on the root element -------------------------------------------

/** The root element the theme is evaluated on: <html> with these attributes. */
export interface RootContext {
  attributes: Record<string, string>
}

type Specificity = [number, number, number]

/**
 * Does this selector match <html> itself, and with what specificity?
 *
 * Supported: :root, html, *, [attr], [attr="v"], :where(), :is(), :not(), and
 * compounds of those. A combinator (space, >, +, ~) means the selector targets a
 * descendant, so it does not match the root — the right answer for a token.
 */
export function matchRoot(selectorList: string, ctx: RootContext): Specificity | null {
  let best: Specificity | null = null
  for (const raw of splitTopLevel(selectorList, ',')) {
    const spec = matchCompound(raw.trim(), ctx)
    if (spec && (!best || compare(spec, best) > 0)) best = spec
  }
  return best
}

const compare = (a: Specificity, b: Specificity) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]

function matchCompound(selector: string, ctx: RootContext): Specificity | null {
  if (!selector) return null
  // Any combinator outside parentheses/brackets means "not the root itself".
  let depth = 0
  for (const ch of selector) {
    if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    else if (depth === 0 && /[\s>+~]/.test(ch)) return null
  }

  const spec: Specificity = [0, 0, 0]
  let rest = selector
  while (rest.length) {
    let m: RegExpExecArray | null
    if ((m = /^:root/.exec(rest))) {
      spec[1]++
    } else if ((m = /^html\b/.exec(rest))) {
      spec[2]++
    } else if ((m = /^\*/.exec(rest))) {
      // no specificity
    } else if ((m = /^\[\s*([\w-]+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([\w-]+))\s*)?\]/.exec(rest))) {
      const [, name, dq, sq, bare] = m
      const want = dq ?? sq ?? bare
      const has = Object.hasOwn(ctx.attributes, name)
      if (!has || (want !== undefined && ctx.attributes[name] !== want)) return null
      spec[1]++
    } else if ((m = /^:(where|is|not)\(/.exec(rest))) {
      const open = m[0].length - 1
      const close = matchingParen(rest, open)
      if (close < 0) return null
      const inner = rest.slice(open + 1, close)
      const innerSpec = matchRoot(inner, ctx)
      const kind = m[1]
      if (kind === 'not') {
        if (innerSpec) return null
        const worst = splitTopLevel(inner, ',').map((s) => staticSpecificity(s.trim()))
        const max = worst.reduce((a, b) => (compare(a, b) >= 0 ? a : b), [0, 0, 0] as Specificity)
        add(spec, max)
      } else {
        if (!innerSpec) return null
        if (kind === 'is') add(spec, innerSpec)
      }
      rest = rest.slice(close + 1)
      continue
    } else {
      return null // a class, an id, a type other than html, a pseudo we do not model
    }
    rest = rest.slice(m[0].length)
  }
  return spec
}

function add(a: Specificity, b: Specificity) {
  a[0] += b[0]
  a[1] += b[1]
  a[2] += b[2]
}

/** Specificity of a selector regardless of whether it matches (for :not). */
function staticSpecificity(selector: string): Specificity {
  const spec: Specificity = [0, 0, 0]
  const stripped = selector.replace(/:where\([^)]*\)/g, '')
  spec[0] = (stripped.match(/#[\w-]+/g) ?? []).length
  spec[1] = (stripped.match(/\.[\w-]+|\[[^\]]+\]|:(?!where|is|not)[\w-]+/g) ?? []).length
  spec[2] = (stripped.match(/(^|[\s>+~])[a-z][\w-]*/gi) ?? []).length
  return spec
}

function matchingParen(text: string, open: number): number {
  let depth = 0
  for (let i = open; i < text.length; i++) {
    if (text[i] === '(') depth++
    else if (text[i] === ')' && --depth === 0) return i
  }
  return -1
}

// --- cascade on the root --------------------------------------------------------

/**
 * Media conditions the checks evaluate. The OS is assumed to prefer LIGHT and
 * standard resolution: every dark mode a theme offers is reachable through its
 * own attribute, so the "system dark" branch adds nothing a check could miss.
 */
function mediaApplies(media: string | null): boolean {
  if (media === null) return true
  return false
}

export interface Cascade {
  /** Winning value of a property on the root, or undefined. */
  get(property: string): string | undefined
}

/**
 * The cascade for declarations on <html>: layer first (a later layer wins
 * whatever the specificity; unlayered wins over every layer), then specificity,
 * then source order. Exactly the order the kit's layer contract relies on.
 */
export function cascadeOnRoot(rules: Rule[], ctx: RootContext, layerOrder: string[] | null = null): Cascade {
  const rank = (layer: string | null) => {
    if (layer === null) return Number.MAX_SAFE_INTEGER
    const index = layerOrder?.indexOf(layer) ?? -1
    return index === -1 ? 0 : index
  }
  type Winner = { value: string; layer: number; spec: Specificity; order: number }
  const beats = (a: Winner, b: Winner) =>
    a.layer !== b.layer ? a.layer > b.layer : compare(a.spec, b.spec) !== 0 ? compare(a.spec, b.spec) > 0 : a.order > b.order

  const winners = new Map<string, Winner>()
  for (const rule of rules) {
    if (rule.nested || !mediaApplies(rule.media)) continue
    const spec = matchRoot(rule.selector, ctx)
    if (!spec) continue
    for (const decl of rule.declarations) {
      const candidate: Winner = { value: decl.value, layer: rank(rule.layer), spec, order: rule.order }
      const current = winners.get(decl.property)
      if (!current || beats(candidate, current)) winners.set(decl.property, candidate)
    }
  }
  return { get: (property) => winners.get(property)?.value }
}

/** All rules of a loaded stylesheet set, numbered in cascade order. */
export function rulesOf(css: LoadedCss): Rule[] {
  const rules: Rule[] = []
  for (const file of css.files) rules.push(...parseRules(file, rules.length))
  return rules
}
