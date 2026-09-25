import { addDays, weekday } from '@ggary/core'

/**
 * A pseudo-random stream from a fixed seed (mulberry32): a year of plausible
 * numbers that draws the same picture on every load.
 */
function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Nightly runs, ending on a fixed day: busy on weekdays, quiet at weekends, with idle days throughout. */
function runs(days: number, last = '2026-09-22') {
  const random = seeded(20260922)
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(last, i - days + 1)
    const weekend = weekday(date) === 0 || weekday(date) === 6
    const idle = random() < (weekend ? 0.6 : 0.1)
    const busy = weekend ? 4 : 12
    return { date, value: idle ? 0 : Math.max(1, Math.round(busy * (0.3 + random() * 1.5))) }
  })
}

export const runYear = runs(365)
export const runQuarter = runs(91)
