/**
 * How the rows are held together. `divided`: on the page itself, a hairline
 * between them. `bordered`: one surface, a header strip and a footer, the
 * rows split by hairlines. `cards`: each row its own card, a gap between.
 */
export type ListVariant = 'divided' | 'bordered' | 'cards'

export interface ListProps {
  /** Default `divided`. */
  variant?: ListVariant
  /** The list's heading, and its accessible name. Without one, name it with `aria-label`. */
  label?: string
  /** Beside the heading, quieter: "4 of 16". */
  count?: string
  /** Its accessible name when there is no `label`. */
  ariaLabel?: string
}

export interface ListItemProps {
  /** The row's name: what a link or press on it is called. */
  title: string
  /** A line under the title, cut to one line. It describes the row's link or press. */
  description?: string
  /** The whole row is a link to it. */
  href?: string
  /** The whole row is a press. Ignored with `href`. */
  onSelect?: () => void
  /** The row that is open, or the page that is shown: `true`, or `'page'` for a link to the page itself. */
  current?: boolean | 'page'
  disabled?: boolean
}

/** Whether "Show more" is idle, waiting for its answer, or failed. */
export type ListMoreState = 'idle' | 'loading' | 'failed'

export interface ListWords {
  /** The footer's button. Default "Show more"; say how many: "Show 12 more". */
  more?: string
  /** While more are loading. Default "Loading…". */
  loading?: string
  /** When loading more failed. Default "Couldn't load more". */
  failed?: string
  /** The button after a failure. Default "Try again". */
  retry?: string
}
