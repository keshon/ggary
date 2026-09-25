import type { IconName } from '@ggary/icons'

export interface NavItem {
  label: string
  /** Navigation is an address: a button breaks the middle click and "open in a new tab". */
  href: string
  icon?: IconName
  /** A number beside the label — how many are waiting, how many are failing. */
  count?: number | string
  current?: boolean
  /**
   * The item's own sections, one level down: a component's variants, a
   * settings page's panes. Deeper levels are not drawn — a side column that
   * nests further is a tree, and wants the Tree.
   */
  items?: NavItem[]
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}

export interface NavWords {
  /** The name of the button that opens and closes an item's sections: "Button, sections". */
  sections: (label: string) => string
}

export interface NavProps {
  id: string
  /** The landmark's name, required: a screen has more than one navigation. */
  label: string
  groups: NavGroup[]
  /** Each labelled group carries its number before its name, 01, 02…, in the accent: for a long column read by its sections. Drawn, not said. */
  numbered?: boolean
  /**
   * Which items with sections are open, by href, as the reader set them. An
   * item not listed is open while it or one of its sections is current, and
   * closed otherwise — the column follows the reading.
   */
  open?: Record<string, boolean>
  /** An item's sections were opened or closed by its button. */
  onOpenChange?: (href: string, open: boolean) => void
  words?: Partial<NavWords>
}
