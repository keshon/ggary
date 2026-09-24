import type { ControlSize } from '../../utils/size'
/**
 * Named by intent, like ButtonEmphasis. A theme may draw every level alike:
 * Instrument does, because its chips carry no weights.
 */
export type ChipEmphasis = 'low' | 'medium' | 'high'
export type ChipSize = ControlSize

export interface ChipProps {
  emphasis?: ChipEmphasis
  size?: ChipSize
  selected?: boolean
  disabled?: boolean
  /** Renders the dismiss affordance and advertises the Delete shortcut. */
  removable?: boolean
  /** A chip that does nothing on click renders as a <span>, not a <button>. */
  interactive?: boolean
}
