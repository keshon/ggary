import type { StatusTone } from '../../utils/tone'

/**
 * A series is a CATEGORY, not a state: one of the six chart colours, in the
 * order the theme declares them. A series is never a tone and a tone is never
 * a series — see the note on `ShareItem`.
 */
export type ChartSeries = 1 | 2 | 3 | 4 | 5 | 6

export interface ShareItem {
  /** What this part is, in words: "up", "down", "nobody looked". It is read out in the bar's name. */
  label: string
  /**
   * How much of the whole. In whatever the bar counts — hours, runs, bytes —
   * and turned into a percentage of the items' total. Anything that is not a
   * positive finite number counts as nothing.
   */
  value: number
  /**
   * A category's colour, 1 to 6: languages in a repository, kinds of traffic,
   * where the time went. Use a series when the parts are KINDS of thing.
   */
  series?: ChartSeries
  /**
   * An outcome from the kit's one state vocabulary: up, degraded, down. Use a
   * tone when the parts are JUDGEMENTS — then the colours agree with every
   * badge, dot and banner saying the same thing on the same screen.
   *
   * A tone wins over a series if both are given, since a judgement outranks a
   * category; giving both is a mistake in the data rather than a style.
   */
  tone?: StatusTone
}

/** The bar's height: the meter's, or a glyph's where the bar is the subject of the screen. */
export type ShareSize = 'md' | 'lg'

export interface ShareProps {
  /** The parts, in the order they are drawn. */
  items: ShareItem[]
  /** What the whole is of: "The last 24 hours". It stands before the reading in the name. */
  label?: string
  /** The unit the values are in: "h", "runs". Said after each number in the name. */
  unit?: string
  /** For the numbers in the name. Default: the page's. */
  locale?: string
  /** Default `md`, the meter's height. `lg` is a glyph's, for a bar that is the subject rather than an annotation. */
  size?: ShareSize
}

/** The fixed text of the bar's name. Everything else comes from the items. */
export interface ShareWords {
  /** One part in words. Default: "22 h up". */
  part?: (value: string, label: string, unit?: string) => string
  /** Between one part's reading and the next. Default ", ". */
  separator?: string
  /** Between the bar's own label and the reading. Default ": ". */
  labelSeparator?: string
  /** The name of a bar with nothing in it. */
  empty?: string
}
