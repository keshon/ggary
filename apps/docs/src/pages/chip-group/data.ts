import type { ChipItem } from '@ggary/core/chip-group'

/** A task's tags. */
export const tags: ChipItem[] = [
  { value: 'design', label: 'Design' },
  { value: 'code', label: 'Code' },
  { value: 'docs', label: 'Docs' },
  { value: 'devops', label: 'DevOps' },
  { value: 'research', label: 'Research' },
]

/** The same, with one no longer in use. */
export const tagsWithLegacy: ChipItem[] = [...tags.slice(0, 3), { value: 'legacy', label: 'Legacy', disabled: true }]

export const priorities: ChipItem[] = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
]
