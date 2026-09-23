import type { Dict, Normalizer } from '../../types'
import { liveAttrs } from '../../utils/region'
import { READING_WORDS } from '../../utils/reading'
import type { MeterProps } from '../meter/meter.types'
import { budgetAnatomy } from './budget.anatomy'
import type { BudgetProps, BudgetWords } from './budget.types'

export const BUDGET_WORDS: BudgetWords = {
  forecast: (when) => `At the current pace the limit will be reached ${when}`,
  steady: 'Nothing is being spent now, so the limit will not be reached',
  spent: 'The limit is spent',
  reading: READING_WORDS.reading,
  over: READING_WORDS.over,
}

/**
 * How long the ceiling lasts, coarsely. The figure is rounded on purpose: a
 * forecast from one instantaneous rate is an estimate, and "in 11 minutes and
 * 42 seconds" claims a precision it does not have.
 */
export function exhaustion(seconds: number): { value: number; unit: Intl.RelativeTimeFormatUnit } {
  if (seconds < 90) return { value: Math.max(5, Math.round(seconds / 5) * 5), unit: 'second' }
  const minutes = seconds / 60
  if (minutes < 90) return { value: Math.round(minutes), unit: 'minute' }
  const hours = minutes / 60
  if (hours < 48) return { value: Math.round(hours), unit: 'hour' }
  return { value: Math.round(hours / 24), unit: 'day' }
}

/**
 * Spending against an explicit ceiling, and the forecast of its exhaustion.
 *
 * The bar is [the meter](../meter), which this returns the props for rather
 * than redrawing: one quantity against its own ceiling, its label and its
 * reading, are exactly what a meter is, and a second bar in the kit would be
 * a second name for one thing. What the meter cannot have is the forecast —
 * it needs a RATE over time, which one value and one ceiling do not supply,
 * and the meter's own doc says so.
 *
 * That is the whole of this component, and it is the part people come for:
 * "65,800 left" does not answer whether the run will make it, "in about 12
 * minutes" does. With no `rate` there is no forecast, and a budget with no
 * forecast is a meter with a longer name — pass one, or use the meter.
 *
 * The forecast moves while the work runs, so it lives in a polite live
 * region. The CADENCE is the application's: a region that updates every
 * second never falls silent, and Instrument's rule — no more than once in
 * thirty seconds — is a property of the data being pushed in, not of the
 * markup. No machine: the spending comes from outside.
 */
export function connect<T = Dict>(props: BudgetProps, normalize: Normalizer<T>, words: Partial<BudgetWords> = {}) {
  const { value, max, label, rate, tone, size, locale } = props
  const w = { ...BUDGET_WORDS, ...words }

  const ceiling = Number.isFinite(max) ? Math.max(0, max) : 0
  const spent = Number.isFinite(value) ? Math.max(0, value) : 0
  const remaining = Math.max(0, ceiling - spent)
  const over = spent >= ceiling
  const moving = rate !== undefined && Number.isFinite(rate) && rate > 0
  const secondsLeft = moving ? remaining / (rate as number) : null

  const note = over
    ? w.spent
    : secondsLeft === null
      ? rate === undefined
        ? undefined
        : w.steady
      : (() => {
          const { value: figure, unit } = exhaustion(secondsLeft)
          return w.forecast(new Intl.RelativeTimeFormat(locale, { numeric: 'always' }).format(figure, unit))
        })()

  return {
    remaining,
    /** How long the ceiling lasts at this pace. Null when nothing is being spent. */
    secondsLeft,
    /** The forecast in words. Undefined when no rate was given — and then there is no budget to show. */
    note,
    /** The bar: handed to a Meter, which is where a quantity against a ceiling belongs. */
    meterProps: {
      value: spent,
      max: ceiling,
      label,
      tone,
      size,
      locale,
      words: { reading: w.reading, over: w.over },
    } satisfies MeterProps,
    rootProps: normalize({ ...budgetAnatomy.attrs('root'), 'data-tone': tone }),
    noteProps: normalize({ ...budgetAnatomy.attrs('note'), ...liveAttrs('polite') }),
  }
}

export type BudgetApi<T = Dict> = ReturnType<typeof connect<T>>
