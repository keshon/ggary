/**
 * A file's size in the locale's words: `640 kB`, `3.8 MB`, `3,8 МБ`. Decimal
 * units, a thousand to the step, as Intl names them; one decimal from a
 * megabyte up, none below it, where a tenth of a kilobyte says nothing.
 */
export function formatBytes(bytes: number, locale?: string): string {
  const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'] as const
  let value = Math.max(0, bytes)
  let step = 0
  // Up a unit while the figure, as it will be rounded, reaches a thousand: 999,960 bytes is 1 MB, not 1,000 kB.
  const rounded = () => (step >= 2 ? Math.round(value * 10) / 10 : Math.round(value))
  while (rounded() >= 1000 && step < units.length - 1) {
    value /= 1000
    step++
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: units[step],
    unitDisplay: 'short',
    maximumFractionDigits: step >= 2 ? 1 : 0,
  }).format(value)
}

/**
 * Whether a file matches an `accept` list as the file input reads one: a
 * `.ext`, a `type/*`, or an exact type, any of them, case aside. An empty list
 * takes anything. The dialog's filter is a hint the user can switch off, and a
 * drop has none, so the list is checked again here.
 */
export function acceptsFile(file: { name: string; type: string }, accept: string | null | undefined): boolean {
  const rules = (accept ?? '').split(',').map((rule) => rule.trim().toLowerCase()).filter(Boolean)
  if (rules.length === 0) return true
  const name = file.name.toLowerCase()
  const type = (file.type || '').toLowerCase()
  return rules.some((rule) =>
    rule.startsWith('.') ? name.endsWith(rule) : rule.endsWith('/*') ? type.startsWith(rule.slice(0, -1)) : type === rule
  )
}
