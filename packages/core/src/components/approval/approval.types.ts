import type { StatusTone } from '../../utils/tone'

/**
 * `pending` is the only state where the answers are shown. After an answer the
 * block neither disappears nor goes out — it steps back, and what was decided
 * stays readable: a request that vanished cannot be checked an hour later.
 */
export type ApprovalState = 'pending' | 'approved' | 'denied'

export type ApprovalDecision = 'approved' | 'denied'

export interface ApprovalEffect {
  /** One consequence, in words: "chunks.bin — deletion". */
  text: string
  /**
   * A tone here means IRREVERSIBILITY, not badness: a deletion is `error`
   * because it cannot be undone, a change of settings is `warn`. The word says
   * it too — the tone is never the only carrier.
   */
  tone?: StatusTone
}

export interface ApprovalProps {
  /** The heading's id is built from it, and the block is named by the heading. */
  id: string
  /** What exactly will be done: a command, a path, a call. Read character by character, so it is set in the mono face. */
  what: string
  /** Default `pending`. */
  state?: ApprovalState
  /** The heading. Default from the words. */
  title?: string
  /** What it will touch. The irreversible ones carry a tone AND say so in their text. */
  effects?: ApprovalEffect[]
  /** Who answered, for the record left behind. */
  decidedBy?: string
  /** When, already formatted. */
  decidedAt?: string
  /**
   * The request arises on the machine's initiative, so it has to reach a live
   * region or it will wait for ever. Default `polite`; `assertive` for a run
   * that is blocked until the answer comes.
   *
   * It is `aria-live` rather than the kit's `liveAttrs`, because those would
   * put `role="alert"` or `role="status"` on the root and the root's role is
   * already load-bearing: `group`, named by the heading, is what holds the
   * question, the consequences and the answers together as one object.
   */
  live?: 'off' | 'polite' | 'assertive'
}

/** Everything fixed that the block says. */
export interface ApprovalWords {
  /** The heading, when none is given. Default "Confirmation is required". */
  title?: string
  /** The name of the consequences list, with their number. Default `(n) => \`It will touch ${n}\`` — used as the list's accessible name. */
  effects?: (count: number) => string
  /** Default "Allow". */
  allow?: string
  /** Default "Deny". A refusal may never cost more presses than consent, so it is never hidden in a menu. */
  deny?: string
  /** The record after an answer. Default builds "Allowed by Anna at 14:32". */
  verdict?: (decision: ApprovalDecision, by?: string, at?: string) => string
}
