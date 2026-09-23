/**
 * Who is speaking. Only the person is marked in the markup: the machine's turn
 * is the default and carries no attribute, because there would be nothing for
 * it to declare — and an attribute value with no rule behind it is one the
 * theme gate cannot check.
 */
export type TurnFrom = 'user' | 'agent'

export interface TurnProps {
  /**
   * The name of whoever spoke. Required: the indent and the recess are
   * decoration and reach no assistive technology, so the name is the only
   * carrier of who said this.
   */
  who: string
  /** Default `agent`. */
  from?: TurnFrom
  /** When it was said, already formatted. Useful in a long thread, noise in a short one. */
  time?: string
  /** What the turn cost, in tokens. Formatted with `locale`. */
  tokens?: number
  /** How long it took, in seconds. Formatted with `locale`, to one decimal under ten. */
  duration?: number
  /** For the numbers in the head. Default: the page's. */
  locale?: string
  /**
   * The answer is still arriving. The root goes `aria-busy`, and the caret —
   * the kit's own, from `@ggary/core/states` — belongs at the end of the body.
   * The text itself is the announcement; the thread around it owns the live
   * region, because a turn does not know whether it is the newest one.
   */
  streaming?: boolean
}

/** The fixed text of the head. Everything else comes from the props. */
export interface TurnWords {
  /** The unit after the token count. Default "tokens". */
  tokens?: string
  /** The unit after the duration. Default "s". */
  seconds?: string
  /** Between the cost and the duration. Default " · ". */
  separator?: string
}
