import type { SegmentedItem } from '@ggary/core/segmented-control'

export const viewModes: SegmentedItem[] = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'table', label: 'Table' },
]

/** The same modes, with one not available for this data. */
export const viewModesWithLocked: SegmentedItem[] = [...viewModes.slice(0, 2), { value: 'table', label: 'Table', disabled: true }]

export const densities: SegmentedItem[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'regular', label: 'Regular' },
  { value: 'comfortable', label: 'Roomy' },
]
