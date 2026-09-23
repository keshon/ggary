import type { StatusTone } from '../../utils/tone'

/**
 * The phases of ONE tool call. A vocabulary of its own — `ok` rather than
 * `done`, and no `skipped`, because a call is either made or not — while the
 * COLOUR still comes from the kit's tone (`STEP_TONES`), so a step, a badge
 * and a dot never disagree about the same call on the same screen.
 *
 * A call that has not begun carries no state at all.
 */
export type StepState = 'running' | 'ok' | 'failed'

export interface StepProps {
  /** The tool, as the machine names it: `read_file`. Monospaced. */
  name: string
  /** What it was called with, in one line: a path, a query. Truncated rather than wrapped. */
  argument?: string
  /** The phase. Absent: the call has not begun. */
  state?: StepState
  /** How much came back: "240 lines", "3 matches". Stands before the time. */
  detail?: string
  /** How long the call took, in milliseconds; while it runs, how long so far. */
  duration?: number
  /** For the figures in the time and in the output's button. Default: the page's. */
  locale?: string
  /**
   * Open when it first renders. Openness then lives in the `<details>`, where
   * the platform keeps it — there is no second channel for one state, and
   * find-in-page opens a step the application never heard about.
   */
  defaultOpen?: boolean
  /**
   * The output shown is cut, and this is how many lines there are in ALL.
   * Absent: nothing is hidden. Truncating in silence is a lie about the volume,
   * so the number is named in words on the button.
   */
  outputLines?: number
  /** Pressed to ask for the whole output. */
  onShowAll?: () => void
  /** The output is still arriving: the step is busy and a caret stands at its end. */
  streaming?: boolean
  /** Told when the reader opens or closes the step. */
  onOpenChange?: (open: boolean) => void
}

/** The step's fixed text. Everything else comes from the call. */
export interface StepWords {
  /** The phase in words, since the tone of a name is not spoken. */
  running?: string
  ok?: string
  failed?: string
  /** A call that has not begun. */
  pending?: string
  /** The button over a cut output. Default: "Show all 240 lines". */
  showAll?: (lines: string) => string
  /** A time under a second. Default: "38 ms". */
  ms?: (value: string) => string
  /** A time under a minute. Default: "0.4 s". */
  seconds?: (value: string) => string
  /** A time of a minute or more. Default: "2 m 05 s". */
  minutes?: (minutes: string, seconds: string) => string
  /** Between the detail and the time. Default " · ". */
  separator?: string
}

export type StepTones = Record<StepState, StatusTone>
