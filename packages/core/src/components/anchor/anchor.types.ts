export interface AnchorItem {
  label: string
  /** The section's address on this page: `#id`. */
  href: string
  /** Its own sections, one level down. Deeper ones are not drawn. */
  items?: AnchorItem[]
}

export interface AnchorWords {
  /** The corner button's name: the list's name and the section being read, when there is one. */
  trigger: (label: string, current: string | null) => string
}

export interface AnchorProps {
  id: string
  /** The landmark's name, required: a page with an anchor has another navigation too. */
  label: string
  items: AnchorItem[]
  /** The section being read, by href. Left out, the anchor follows the reading itself. */
  current?: string
  /** The reading reached another section, or a link was followed. */
  onCurrentChange?: (href: string) => void
  /**
   * How far below the window's top a section counts as reached, in px: the
   * height of whatever stays at the top, a bar. Default 0.
   */
  offset?: number
  /**
   * Folds the list behind a button at the window's corner: always (`true`),
   * or while the window is narrower than this many px. Default: never, the
   * list stands where it is put.
   */
  float?: boolean | number
  /** The folded list is open. Left out, the anchor keeps it. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  words?: Partial<AnchorWords>
}

/** What the adapter keeps and hands back to connect: settled, not asked for. */
export interface AnchorState {
  /** The href being read, or null before any is. */
  current: string | null
  /** Folded at the corner now. */
  floating: boolean
  /** Folded and opened. */
  open: boolean
}
