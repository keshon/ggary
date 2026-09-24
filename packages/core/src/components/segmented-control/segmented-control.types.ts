import type { ControlSize } from '../../utils/size'
export type SegmentedControlSize = ControlSize

export interface SegmentedItem {
  value: string
  label: string
  disabled?: boolean
}

export interface SegmentedControlProps {
  id: string
  items: SegmentedItem[]
  /**
   * The name of the control, required: only the options have visible text, and
   * a group of "List, Grid, Table" says nothing about what it switches.
   */
  label: string
  /** Shared by the radios. Defaults to the id. */
  name?: string
  value?: string | null
  size?: SegmentedControlSize
  disabled?: boolean
  required?: boolean
  /** Segments share the width of the container instead of sizing to their text. */
  fullWidth?: boolean
}
