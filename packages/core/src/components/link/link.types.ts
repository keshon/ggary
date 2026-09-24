export interface LinkProps {
  /** Goes elsewhere: opens in a new tab, without handing this page to it. */
  external?: boolean
}

export interface LinkWords {
  /** Said after an external link's words: "(opens in a new tab)". */
  external?: string
}
