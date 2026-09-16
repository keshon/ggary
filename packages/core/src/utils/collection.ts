/**
 * Index arithmetic over a list with disabled entries. Pure.
 *
 * This fell out when ChipGroup arrived: Select and ChipGroup both walk a
 * collection skipping disabled items, and differ only in whether they wrap.
 * Component three is usually where shared primitives stop being speculative.
 */
export interface CollectionOptions<T> {
  isDisabled?: (item: T) => boolean
  /** ChipGroup wraps (toolbar convention); Select clamps (native <select>). */
  loop?: boolean
}

export function firstEnabled<T>(items: readonly T[], options: CollectionOptions<T> = {}): number {
  for (let i = 0; i < items.length; i++) if (!options.isDisabled?.(items[i])) return i
  return -1
}

export function lastEnabled<T>(items: readonly T[], options: CollectionOptions<T> = {}): number {
  for (let i = items.length - 1; i >= 0; i--) if (!options.isDisabled?.(items[i])) return i
  return -1
}

export function edgeEnabled<T>(
  items: readonly T[],
  edge: 'first' | 'last',
  options: CollectionOptions<T> = {}
): number {
  return edge === 'first' ? firstEnabled(items, options) : lastEnabled(items, options)
}

/**
 * Walk `step` places from `from`, skipping disabled items.
 *
 * - `from` out of range starts at the edge you are heading towards.
 * - Overshooting clamps to the far edge (so PageDown near the end lands on the
 *   last item rather than doing nothing) unless `loop` is set.
 */
export function nextEnabled<T>(
  items: readonly T[],
  from: number,
  step: number,
  options: CollectionOptions<T> = {}
): number {
  const { isDisabled, loop = false } = options
  const size = items.length
  if (size === 0) return -1
  if (from < 0 || from >= size) return edgeEnabled(items, step > 0 ? 'first' : 'last', options)

  let index = from
  for (let guard = 0; guard < size; guard++) {
    index += step
    if (index < 0 || index >= size) {
      if (!loop) return edgeEnabled(items, step > 0 ? 'last' : 'first', options)
      index = ((index % size) + size) % size
    }
    if (!isDisabled?.(items[index])) return index
  }
  return from
}

/**
 * The enabled index closest to `from`, searching outwards in both directions.
 *
 * This is the "where does focus land now?" question, and it comes up whenever a
 * list changes underneath a roving tabindex: an item was removed, items arrived
 * late, or the current item just became disabled. Clamping alone is not enough —
 * it happily lands you on a disabled item, which in a real browser is not
 * focusable at all, so focus silently falls to <body>.
 */
export function nearestEnabled<T>(items: readonly T[], from: number, options: CollectionOptions<T> = {}): number {
  if (items.length === 0) return -1
  const start = Math.max(0, Math.min(from, items.length - 1))
  for (let offset = 0; offset < items.length; offset++) {
    const forward = start + offset
    if (forward < items.length && !options.isDisabled?.(items[forward])) return forward
    const backward = start - offset
    if (backward >= 0 && !options.isDisabled?.(items[backward])) return backward
  }
  return -1
}

/** Clamp an index into a resized list, keeping -1 as "nothing". */
export function clampIndex(index: number, size: number): number {
  if (size === 0) return -1
  return Math.max(-1, Math.min(index, size - 1))
}
