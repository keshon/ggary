import type { IconName } from '@ggary/icons'

export interface RailItem {
  /** Shown under the glyph, small: a rail item is named in words, not by its glyph alone. */
  label: string
  /** A rail is navigation: an address, so the middle click and "open in a new tab" work. */
  href: string
  icon: IconName
  /** A number at the glyph's corner — how many are waiting. */
  count?: number | string
  current?: boolean
  /** Stands at the bottom of the rail: the account, the settings. */
  end?: boolean
}

export interface RailProps {
  id: string
  /** The landmark's name, required: a screen has more than one navigation. */
  label: string
  items: RailItem[]
}
