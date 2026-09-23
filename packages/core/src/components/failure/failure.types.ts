/**
 * `pending` is the only state where the way out is shown. Once retried or
 * given up the block steps back exactly as an answered approval does: the
 * alert ground comes off and a quiet record stays, because a failure that
 * vanished when it was fixed cannot be checked later against the same file
 * failing again.
 */
export type FailureState = 'pending' | 'resolved' | 'given-up'

export interface FailureProps {
  /** What did not work: "Could not read terrain/chunks.bin". */
  title: string
  /**
   * The machine code — `EBUSY`, `ECONNRESET`, an exit status. Required: "something
   * went wrong" can neither be found in a log nor sent to support.
   */
  code: string
  /** The code in words: "The file is locked by another process". A code with no explanation is not a reason but its identifier. */
  reason: string
  /** Default `pending`. */
  state?: FailureState
  /**
   * What has already been tried. This is the one thing that sets an agent's
   * report apart from an ordinary error: without it the first thing the reader
   * does is press Retry — that is, do what the machine has already done twice.
   */
  tried?: string[]
  /** What happened in the end, for the record. */
  resolvedAt?: string
  /**
   * A failure arises on the machine's initiative and has to be announced at
   * once, so `alert` is the default while it is pending. Several alerts in a
   * row interrupt one another: for a series of failures, one block with a
   * count in its title is better than five.
   */
  live?: 'off' | 'polite' | 'alert'
}

/** Everything fixed that the block says. */
export interface FailureWords {
  /** The reason line. Default `(reason, code) => \`${reason} (${code})\``. */
  reason?: (reason: string, code: string) => string
  /** The name of the list of attempts, with their number. Default `(n) => \`Already tried: ${n}\``. */
  tried?: (count: number) => string
  /** The primary way out. Default "Retry". */
  retry?: string
  /** The record once the block has stepped back. Default builds "Resolved at 14:33" / "Given up at 14:33". */
  verdict?: (state: Exclude<FailureState, 'pending'>, at?: string) => string
}
