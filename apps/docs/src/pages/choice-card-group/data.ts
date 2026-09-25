import type { ChoiceCardItem } from '@ggary/core/choice-card'

export const runModes: ChoiceCardItem[] = [
  { value: 'parallel', title: 'In parallel', description: 'Up to 12 agents at once. Faster, but the token spend is higher and the order of the output is not guaranteed.' },
  { value: 'sequential', title: 'Sequentially', description: 'One agent at a time. Slower, but the log reads top to bottom with no interleaving.' },
  { value: 'manual', title: 'One step at a time', description: 'Every step waits for you. For a run you do not trust yet.' },
]

/** The same modes, with one not available on this plan. */
export const runModesWithLocked: ChoiceCardItem[] = [...runModes.slice(0, 2), { ...runModes[2], disabled: true }]

export const runExtras: ChoiceCardItem[] = [
  { value: 'trace', title: 'Collect a trace', description: 'A full log of every step. The run becomes about 15% slower.' },
  { value: 'notify', title: 'Notify on completion', description: 'An email to the account address when the queue empties.' },
]
