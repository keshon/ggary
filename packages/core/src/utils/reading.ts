/**
 * One quantity against its own ceiling, read the same way by the meter and by
 * the ring: the share to draw, and the reading in words.
 *
 * The minimum is always zero and there is no prop for it. A meter measures a
 * quantity against a ceiling — a budget spent, a share of the time, a step's
 * readiness — and a quantity that begins somewhere other than nothing is a
 * range, which is a different thing entirely.
 *
 * Over the maximum the drawing clamps, because an arc cannot be 120% of a
 * circle and a fill cannot leave its track — but the WORDS do not clamp. The
 * reading keeps the number that was given and says it is over, so the one
 * fact a clamped picture destroys is the one the reading carries.
 */

export interface ReadingWords {
  /** The reading. Both figures arrive already written in the locale. */
  reading(value: string, max: string): string
  /** The reading when the value is above the maximum. */
  over(value: string, max: string): string
}

export const READING_WORDS: ReadingWords = {
  reading: (value, max) => `${value} of ${max}`,
  over: (value, max) => `${value} of ${max}, over the maximum`,
}

export interface ReadingInput {
  /** The quantity. Above `max` it is drawn clamped and read as over. */
  value: number
  /** The ceiling it is measured against. Default: 100, so a bare value is a percentage. */
  max?: number
  /** The reading in words, in place of the default. */
  valueText?: string
  /** For the default reading's figures. Default: the page's. */
  locale?: string
  words?: Partial<ReadingWords>
}

export interface Reading {
  /** The value as drawn and as reported to assistive tech: clamped into 0…max. */
  value: number
  max: number
  /** 0…1, what the fill and the arc are given. */
  fraction: number
  /** The value given was above the maximum. */
  over: boolean
  /** The reading in words: shown where there is room, and always spoken. */
  text: string
}

export function reading(input: ReadingInput): Reading {
  const max = Number.isFinite(input.max) ? Math.max(0, input.max as number) : 100
  const raw = Number.isFinite(input.value) ? input.value : 0
  const value = Math.min(max, Math.max(0, raw))
  const words = { ...READING_WORDS, ...input.words }
  const write = (n: number) => new Intl.NumberFormat(input.locale).format(n)
  const over = raw > max
  return {
    value,
    max,
    // A ceiling of nothing is not a ceiling: the meter reads empty rather than dividing by it.
    fraction: max > 0 ? value / max : 0,
    over,
    text: input.valueText ?? (over ? words.over(write(raw), write(max)) : words.reading(write(value), write(max))),
  }
}
