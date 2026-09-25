import type { CheckboxItem } from '@ggary/core/checkbox-group'

/** What a person can be notified about: Checkbox's "all of them" and CheckboxGroup's options. */
export const notifyItems: CheckboxItem[] = [
  { value: 'mentions', label: 'Mentions' },
  { value: 'replies', label: 'Replies' },
  { value: 'digest', label: 'Weekly digest' },
]
