/**
 * Colour resolution and measurement, ported from instrument/tools/internal/css.
 *
 * A token is resolved the way a browser resolves it on <html>: var() is
 * substituted textually (with fallbacks), calc() collapses to a number,
 * light-dark() picks a branch by the element's color-scheme, and the result is
 * parsed into sRGB with alpha. Values are COMPUTED from the files as shipped, so
 * the check cannot drift from the theme — it holds no copy of any value.
 *
 * One deliberate difference from the Go original: `color-mix(in oklab, …)` is
 * mixed in OKLab. The original interpolated in sRGB, which is identical for the
 * kit's usual case (a colour against `transparent`) but not for two opaque
 * colours — and a browser mixes in the space it was told to.
 */
import { type Cascade, splitTopLevel } from './css.ts'

export interface RGBA {
  r: number
  g: number
  b: number
  a: number
}

const TRANSPARENT: RGBA = { r: 0, g: 0, b: 0, a: 0 }

// --- space conversions ------------------------------------------------------------

const decode = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const encode = (v: number) => {
  const out = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.max(v, 0) ** (1 / 2.4) - 0.055
  return Math.min(1, Math.max(0, out))
}

interface Oklab {
  l: number
  a: number
  b: number
}

function srgbToOklab({ r, g, b }: RGBA): Oklab {
  const lr = decode(r)
  const lg = decode(g)
  const lb = decode(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  }
}

function oklabToSrgb({ l: L, a, b }: Oklab, alpha: number): RGBA {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return {
    r: encode(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: encode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: encode(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    a: alpha,
  }
}

export function oklchToSrgb(L: number, C: number, H: number, alpha = 1): RGBA {
  const h = (H * Math.PI) / 180
  return oklabToSrgb({ l: L, a: C * Math.cos(h), b: C * Math.sin(h) }, alpha)
}

// --- measurement ------------------------------------------------------------------

/** Lay `fg` over `bg`, in sRGB, the way a browser paints a translucent layer. */
export function composite(fg: RGBA, bg: RGBA): RGBA {
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: fg.a + bg.a * (1 - fg.a),
  }
}

const luminance = ({ r, g, b }: RGBA) => 0.2126 * decode(r) + 0.7152 * decode(g) + 0.0722 * decode(b)

/** WCAG contrast of a (possibly translucent) foreground over an opaque background. */
export function ratio(fg: RGBA, bg: RGBA): number {
  const hi = luminance(composite(fg, bg))
  const lo = luminance(bg)
  return (Math.max(hi, lo) + 0.05) / (Math.min(hi, lo) + 0.05)
}

/** OKLCH lightness — the perceptually uniform axis Instrument builds its ramps on. */
export const lightness = (c: RGBA) => srgbToOklab(c).l

/**
 * The lightness step a layer makes against what it lies on. Compositing is
 * mandatory: a recess is a translucent film, and measured on its own it would
 * contribute its own lightness (zero) and pass every threshold while checking
 * nothing — the defect Instrument's gate once had.
 */
export const step = (layer: RGBA, bg: RGBA) => Math.abs(lightness(composite(layer, bg)) - lightness(bg))

/** The lightness difference between two already opaque colours. */
export const stepOf = (a: RGBA, b: RGBA) => Math.abs(lightness(a) - lightness(b))

export const toHex = ({ r, g, b, a }: RGBA) => {
  const h = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}${a < 1 ? h(a) : ''}`
}

// --- resolution ---------------------------------------------------------------------

export class ResolveError extends Error {}

/** Resolves tokens and colour expressions on <html> for one root context. */
export class Resolver {
  private readonly cascade: Cascade
  readonly scheme: 'light' | 'dark'

  constructor(cascade: Cascade) {
    this.cascade = cascade
    // `color-scheme: light dark` means "follow the OS", and the checks assume a
    // light OS; a mode that wants dark says `color-scheme: dark` outright.
    const declared = (cascade.get('color-scheme') ?? 'light').trim().split(/\s+/)
    this.scheme = declared[0] === 'dark' ? 'dark' : 'light'
  }

  /** The raw declared value of a custom property. */
  token(name: string): string {
    const value = this.cascade.get(name)
    if (value === undefined) throw new ResolveError(`${name} is not declared on the root in this mode`)
    return value
  }

  /** Substitute every var() textually, honouring fallbacks. */
  expand(value: string, depth = 0): string {
    if (depth > 40) throw new ResolveError(`var() nesting too deep in: ${value}`)
    const start = value.indexOf('var(')
    if (start === -1) return value
    let depthParens = 0
    let end = -1
    for (let i = start + 3; i < value.length; i++) {
      if (value[i] === '(') depthParens++
      else if (value[i] === ')' && --depthParens === 0) {
        end = i
        break
      }
    }
    if (end === -1) throw new ResolveError(`unbalanced var() in: ${value}`)
    const [nameRaw, ...fallbackParts] = splitTopLevel(value.slice(start + 4, end), ',')
    const name = nameRaw.trim()
    const declared = this.cascade.get(name)
    let replacement: string
    if (declared !== undefined) replacement = declared
    else if (fallbackParts.length) replacement = fallbackParts.join(',').trim()
    else throw new ResolveError(`${name} is not declared on the root in this mode`)
    return this.expand(value.slice(0, start) + this.expand(replacement, depth + 1) + value.slice(end + 1), depth + 1)
  }

  /** A token name (`--x`) or any colour expression, resolved to sRGB. */
  color(expression: string): RGBA {
    const source = expression.startsWith('--') ? this.token(expression) : expression
    return this.parse(collapseCalc(this.expand(source)).trim())
  }

  /** Collapse a stack, base first, into one opaque colour. */
  flatten(stack: string[]): RGBA {
    let out = this.color(stack[0])
    for (const layer of stack.slice(1)) out = composite(this.color(layer), out)
    return out
  }

  private parse(value: string): RGBA {
    const v = value.trim()
    const lower = v.toLowerCase()
    if (lower === 'transparent') return TRANSPARENT
    if (lower === 'white') return { r: 1, g: 1, b: 1, a: 1 }
    if (lower === 'black') return { r: 0, g: 0, b: 0, a: 1 }

    if (lower.startsWith('#')) return parseHex(v)

    const fn = /^([a-z-]+)\((.*)\)$/is.exec(v)
    if (!fn) throw new ResolveError(`cannot parse colour: ${v}`)
    const [, name, body] = fn

    switch (name.toLowerCase()) {
      case 'light-dark': {
        const args = splitTopLevel(body, ',')
        if (args.length !== 2) throw new ResolveError(`light-dark() takes two colours: ${v}`)
        return this.parse(this.scheme === 'dark' ? args[1] : args[0])
      }
      case 'color-mix':
        return this.mix(body, v)
      case 'oklch': {
        const [channels, alpha] = body.split('/')
        const [L, C, H] = channels.trim().split(/\s+/).map(number)
        return oklchToSrgb(L, C, H, alpha === undefined ? 1 : number(alpha))
      }
      case 'rgb':
      case 'rgba': {
        const parts = body.includes(',') ? body.split(',') : body.replace('/', ' ').trim().split(/\s+/)
        const [r, g, b] = parts.slice(0, 3).map((p) => channel(p))
        return { r, g, b, a: parts[3] === undefined ? 1 : number(parts[3]) }
      }
      default:
        throw new ResolveError(`unsupported colour function ${name}(): ${v}`)
    }
  }

  private mix(body: string, whole: string): RGBA {
    const args = splitTopLevel(body, ',').map((s) => s.trim())
    if (args.length !== 3 || !/^in\s+oklab$/i.test(args[0])) {
      throw new ResolveError(`only color-mix(in oklab, …) is supported: ${whole}`)
    }
    const share = (arg: string): [string, number | null] => {
      const m = /^(.*?)\s+([\d.]+)%$/.exec(arg)
      return m ? [m[1], Number(m[2]) / 100] : [arg, null]
    }
    const [aExpr, aShare] = share(args[1])
    const [bExpr, bShare] = share(args[2])
    const p = aShare ?? (bShare === null ? 0.5 : 1 - bShare)

    const A = this.parse(aExpr)
    const B = this.parse(bExpr)
    const alpha = A.a * p + B.a * (1 - p)
    if (alpha === 0) return TRANSPARENT
    // Premultiplied interpolation: a transparent side contributes alpha only,
    // so mixing a colour with `transparent` keeps its hue exactly.
    const la = srgbToOklab(A)
    const lb = srgbToOklab(B)
    const lerp = (x: number, y: number) => (x * A.a * p + y * B.a * (1 - p)) / alpha
    return oklabToSrgb({ l: lerp(la.l, lb.l), a: lerp(la.a, lb.a), b: lerp(la.b, lb.b) }, alpha)
  }
}

function number(text: string): number {
  const t = text.trim()
  const value = t.endsWith('%') ? Number(t.slice(0, -1)) / 100 : Number(t)
  if (Number.isNaN(value)) throw new ResolveError(`not a number: ${text}`)
  return value
}

const channel = (text: string) => {
  const t = text.trim()
  return t.endsWith('%') ? Number(t.slice(0, -1)) / 100 : Number(t) / 255
}

function parseHex(hex: string): RGBA {
  let h = hex.slice(1)
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('')
  if (h.length !== 6 && h.length !== 8) throw new ResolveError(`bad hex colour: ${hex}`)
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16) / 255
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) : 1 }
}

/**
 * Collapse calc() with plain numbers and + - * / and parentheses. Themes use
 * calc() inside colours for exactly one thing — scaling a chroma by a knob —
 * and anything with units honestly fails rather than being guessed at.
 */
export function collapseCalc(value: string): string {
  let out = value
  for (let guard = 0; guard < 50 && out.includes('calc('); guard++) {
    const start = out.lastIndexOf('calc(')
    let depth = 0
    let end = -1
    for (let i = start + 4; i < out.length; i++) {
      if (out[i] === '(') depth++
      else if (out[i] === ')' && --depth === 0) {
        end = i
        break
      }
    }
    if (end === -1) throw new ResolveError(`unbalanced calc(): ${value}`)
    const result = arithmetic(out.slice(start + 5, end))
    out = out.slice(0, start) + String(result) + out.slice(end + 1)
  }
  return out
}

function arithmetic(expr: string): number {
  const tokens = expr.match(/\d*\.?\d+(?:e[+-]?\d+)?|[()+\-*/]/gi) ?? []
  if (tokens.join('') !== expr.replace(/\s+/g, '')) throw new ResolveError(`calc() with units is not supported: ${expr}`)
  let i = 0
  const primary = (): number => {
    const t = tokens[i++]
    if (t === '(') {
      const v = sum()
      i++ // ')'
      return v
    }
    if (t === '-') return -primary()
    return Number(t)
  }
  const product = (): number => {
    let v = primary()
    while (tokens[i] === '*' || tokens[i] === '/') v = tokens[i++] === '*' ? v * primary() : v / primary()
    return v
  }
  const sum = (): number => {
    let v = product()
    while (tokens[i] === '+' || tokens[i] === '-') v = tokens[i++] === '+' ? v + product() : v - product()
    return v
  }
  return sum()
}
