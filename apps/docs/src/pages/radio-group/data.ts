import type { RadioItem } from '@ggary/core/radio-group'

export const plans: RadioItem[] = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'team', label: 'Team' },
]

/** The same plans, with one that has to go through sales. */
export const plansWithLocked: RadioItem[] = [...plans.slice(0, 2), { value: 'team', label: 'Team (contact sales)', disabled: true }]

export const billing: RadioItem[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]
