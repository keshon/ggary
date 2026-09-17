import type { IconName } from '@ggary/icons'

export interface NavItem {
  label: string
  /** Navigation is an address: a button breaks the middle click and "open in a new tab". */
  href: string
  icon?: IconName
  /** A number beside the label — how many are waiting, how many are failing. */
  count?: number | string
  current?: boolean
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}

export interface NavProps {
  id: string
  /** The landmark's name, required: a screen has more than one navigation. */
  label: string
  groups: NavGroup[]
}
