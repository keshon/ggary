/**
 * How a theme declares what it promises.
 *
 * A theme package exports a `theme.check.ts` built with `defineThemeCheck`. The
 * pairs live WITH the theme because they are written in the theme's private
 * token names, and a pair carries knowledge no tool can derive: the stack a
 * foreground actually sits on ("label in a field on a panel" is two backgrounds,
 * because the field is translucent). The contract pairs in contract.ts are the
 * part every theme owes regardless of its language.
 */

/** Text below 18px — WCAG 1.4.3. */
export const TEXT = 4.5
/** Large text, and non-text that carries meaning: a control's own border, a state mark — WCAG 1.4.11. */
export const LARGE = 3.0
/**
 * A step between two surfaces, measured as OKLCH lightness difference rather
 * than a contrast ratio. The WCAG ratio's 0.05 flare term squeezes every ratio
 * towards 1 at the dark end, so one ratio threshold cannot serve light and dark
 * modes alike; OKLCH lightness is perceptually uniform and can. 0.022 is
 * Instrument's tightest deliberate step. Any `min` below 1 is read as a step.
 */
export const STEP = 0.022

export interface Pair {
  /** A name a person recognises: "text: muted on panel". */
  label: string
  /** A token name (`--text-muted`) or a colour expression. */
  fg: string
  /** The background stack, base first. Translucent layers MUST be written out. */
  bg: string[]
  min: number
  /**
   * For a step: a second stack the first must be QUIETER than, not merely
   * different from. Used for a ladder of weights, where a reversed order passes
   * an absolute difference and still reads wrong. Negative results fail.
   */
  alt?: string[]
}

/** One root state the theme is evaluated in: <html> carrying these attributes. */
export interface Context {
  label: string
  attributes: Record<string, string>
}

/**
 * A known failure the theme's author has decided to live with, for now, and
 * says why. A waiver whose pair starts PASSING is itself reported, so a fixed
 * problem cannot leave a stale excuse behind.
 */
export interface Waiver {
  pair: string
  /** A context label, or omitted for every context. */
  context?: string
  reason: string
}

export interface ThemeCheck {
  /** Display name: "GGarry". */
  name: string
  /** The package directory under packages/: "theme-ggarry". */
  dir: string
  /** Directories under the package's src/ that declare tokens rather than apply them. */
  tokenDirs?: string[]
  contexts: Context[]
  pairs: Pair[]
  waivers?: Waiver[]
  /**
   * The components this theme answers for. Left out, it is every component core
   * ships, and a new one fails parity until the theme styles it. A FROZEN theme
   * lists what it covers: what it has keeps being checked, and new components
   * are not owed to it.
   */
  components?: string[]
}

export const defineThemeCheck = (check: ThemeCheck): ThemeCheck => check

export interface Finding {
  theme: string
  check: 'imports' | 'layers' | 'orphans' | 'parity' | 'contract' | 'variables' | 'selectors' | 'structure' | 'contrast' | 'coverage' | 'waivers'
  message: string
  context?: string
  where?: string
}

export interface Measurement {
  context: string
  pair: Pair
  value: number | null
  pass: boolean
  waived: boolean
  error?: string
}
