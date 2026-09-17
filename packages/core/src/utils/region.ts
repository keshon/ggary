/**
 * How much a region asks for attention on its screen (Instrument's rank):
 * `lead` a step louder title, `support` a quieter title on a recessed ground
 * with no edge. Rank is a screen-level choice and is not inherited: a region
 * inside another declares its own.
 */
export type RegionRank = 'lead' | 'default' | 'support'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

/** A live region, for a message that appears in response to something. `alert` interrupts. */
export type LiveMode = 'off' | 'polite' | 'alert'

export const headingTag = (level: HeadingLevel) => `h${level}` as const

/** The attributes a live mode puts on its element. */
export function liveAttrs(live: LiveMode | undefined): Record<string, string | undefined> {
  if (live === 'alert') return { role: 'alert' }
  if (live === 'polite') return { role: 'status', 'aria-live': 'polite' }
  return {}
}
