export interface PageItem {
  /** The page number, or the words at the edges: "Back", "Forward". */
  label: string
  href?: string
  page?: number
  current?: boolean
  /** A link has no `disabled`; this becomes aria-disabled, which is the truthful one. */
  disabled?: boolean
  /** An ellipsis standing for the pages left out. */
  gap?: boolean
}

export interface PaginationProps {
  items: PageItem[]
  /** The landmark's name: the screen already has a side nav and breadcrumbs. */
  label?: string
}

export interface PaginationRangeOptions {
  page: number
  pages: number
  /** How many pages to show on each side of the current one. */
  around?: number
  /** The words at the edges; leave one out and that edge is not drawn. */
  previousLabel?: string
  nextLabel?: string
  /** Turns a page number into its address. */
  href?: (page: number) => string
}
