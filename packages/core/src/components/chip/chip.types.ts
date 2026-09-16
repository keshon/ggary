export type ChipVariant = 'solid' | 'subtle' | 'outline'
export type ChipSize = 'sm' | 'md'

export interface ChipProps {
  variant?: ChipVariant
  size?: ChipSize
  selected?: boolean
  disabled?: boolean
  /** Renders the dismiss affordance and advertises the Delete shortcut. */
  removable?: boolean
  /** A chip that does nothing on click renders as a <span>, not a <button>. */
  interactive?: boolean
}
