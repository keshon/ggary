/** A day of a monitored service, by outcome: the four parts add up to 24 hours. Judgements, so tones. */
export const dayOutcomes = [
  { label: 'up', value: 22.1, tone: 'ok' as const },
  { label: 'degraded', value: 1.4, tone: 'warn' as const },
  { label: 'down', value: 0.4, tone: 'error' as const },
  { label: 'not checked', value: 0.1, tone: 'neutral' as const },
]

/** A repository by language: kinds of thing, so series. */
export const languages = [
  { label: 'TypeScript', value: 61_200, series: 1 as const },
  { label: 'Svelte', value: 18_400, series: 2 as const },
  { label: 'CSS', value: 14_900, series: 3 as const },
  { label: 'Other', value: 2_300, series: 4 as const },
]

/** A day nobody checked: nothing to share out. */
export const nothing = [
  { label: 'up', value: 0, tone: 'ok' as const },
  { label: 'down', value: 0, tone: 'error' as const },
]
