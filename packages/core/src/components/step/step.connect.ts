import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import type { StatusTone } from '../../utils/tone'
import { stepAnatomy as anatomy } from './step.anatomy'
import type { StepProps, StepState, StepTones, StepWords } from './step.types'

/** The phase of a call, in the kit's one colour vocabulary. */
export const STEP_TONES: StepTones = { running: 'running', ok: 'ok', failed: 'error' }

export const STEP_WORDS: Required<StepWords> = {
  running: 'Running',
  ok: 'Succeeded',
  failed: 'Failed',
  pending: 'Not started',
  showAll: (lines) => `Show all ${lines} lines`,
  ms: (value) => `${value} ms`,
  seconds: (value) => `${value} s`,
  minutes: (minutes, seconds) => `${minutes} m ${seconds} s`,
  separator: ' · ',
}

const SECOND = 1000
const MINUTE = 60 * SECOND

/**
 * How long the call took, in the unit a reader can hold: milliseconds under a
 * second, tenths of a second under a minute, minutes and whole seconds above
 * it. One unit, never two of them added up — "1400 ms" and "0 m 84 s" are both
 * arithmetic the reader has to do.
 */
export function stepDuration(ms: number, locale: string | undefined, words: Required<StepWords>): string | undefined {
  if (!Number.isFinite(ms) || ms < 0) return undefined
  const format = (value: number, digits = 0) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)
  if (ms < SECOND) return words.ms(format(Math.round(ms)))
  if (ms < MINUTE) return words.seconds(format(ms / SECOND, 1))
  const minutes = Math.floor(ms / MINUTE)
  // Padded, so a column of times stays a column: "2 m 05 s" under "2 m 41 s".
  const seconds = String(Math.round((ms % MINUTE) / SECOND)).padStart(2, '0')
  return words.minutes(format(minutes), seconds)
}

/**
 * One call of a tool by an agent: what was called, with what, and what came
 * back. It is a `<details>` with a `<summary>`, so the expansion, the keyboard,
 * the `open` state and find-in-page — which opens a folded step to show the
 * match — are the platform's rather than ours. No machine: there is no state
 * here the DOM is not already keeping.
 *
 * It is NOT an Accordion item. The kit's Accordion is a GROUP: one machine
 * owning the whole list, a single-open policy, and Up and Down walking between
 * the headings. A transcript is neither — steps arrive one at a time while the
 * run goes on, each opens on its own, and the arrows belong to whatever is
 * inside the body. The one thing a step would have borrowed, find-in-page, the
 * `<details>` gives for nothing.
 *
 * The state dot is the kit's StatusDot, placed in the head by the adapter: the
 * root carries `data-tone`, and the dot reads the nearest tone. A step draws
 * no dot of its own.
 *
 * The tone of a name is not spoken, so the phase is also a word in the head,
 * shown to no one and read by everything.
 */
export function connect<T = Dict>(props: StepProps, normalize: Normalizer<T>, words: StepWords = {}) {
  const { name, argument, state, detail, duration, locale, defaultOpen, outputLines, streaming } = props
  const w = { ...STEP_WORDS, ...words }
  const tone: StatusTone = state ? STEP_TONES[state] : 'neutral'
  const truncated = outputLines !== undefined
  const time = duration === undefined ? undefined : stepDuration(duration, locale, w)
  const meta = [detail, time].filter((part) => part !== undefined && part !== '').join(w.separator)
  const status = state ? w[state] : w.pending

  return {
    name,
    argument,
    meta,
    /** The phase in words: shown to nobody, read by everything. */
    status,
    truncated,
    /** The caret of text still arriving, at the end of the output. */
    showCaret: Boolean(streaming),
    /** The button's label, with the number of lines in words. */
    showAllLabel: truncated ? w.showAll(new Intl.NumberFormat(locale).format(outputLines!)) : '',

    rootProps: normalize({
      ...anatomy.attrs('root'),
      'data-state': state,
      // The colour comes from the tone, never from the phase: one vocabulary.
      'data-tone': tone,
      // Set once, then the element's own. React leaves an attribute alone
      // while the prop does not change, so the reader's toggling stands.
      open: defaultOpen || undefined,
      'aria-busy': state === 'running' || streaming ? 'true' : undefined,
      onToggle: props.onOpenChange
        ? (event: Event) => props.onOpenChange!((event.currentTarget as HTMLDetailsElement).open)
        : undefined,
    }),

    headProps: normalize({ ...anatomy.attrs('head') }),
    // Decorative: the state of expansion is the `<details>`'s own, and the
    // browser announces it.
    indicatorProps: normalize({
      ...anatomy.attrs('indicator'),
      'aria-hidden': 'true',
      'data-icon': 'chevron-right' satisfies IconName,
    }),
    nameProps: normalize({ ...anatomy.attrs('name') }),
    // A path longer than the line would push the time past the edge.
    argumentProps: normalize({ ...anatomy.attrs('argument'), title: argument }),
    metaProps: normalize({ ...anatomy.attrs('meta') }),
    statusProps: normalize({ ...anatomy.attrs('status') }),
    bodyProps: normalize({ ...anatomy.attrs('body') }),

    outputProps: normalize({ ...anatomy.attrs('output'), 'data-truncated': truncated ? 'true' : undefined }),
    outputBodyProps: normalize({ ...anatomy.attrs('output-body') }),
    moreProps: normalize({ ...anatomy.attrs('more'), type: 'button', onClick: props.onShowAll }),
  }
}

export type StepApi<T = Dict> = ReturnType<typeof connect<T>>
