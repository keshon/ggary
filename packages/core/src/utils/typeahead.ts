/**
 * Pure typeahead: given a buffer and a keystroke, work out the next buffer and
 * the index to highlight. No timers, no DOM — the caller owns "now".
 */
export interface TypeaheadState {
  buffer: string
  at: number
}

export interface TypeaheadResult<T> {
  state: TypeaheadState
  index: number
}

const RESET_AFTER_MS = 600

export function typeahead<T>(
  items: readonly T[],
  options: {
    char: string
    now: number
    state: TypeaheadState
    from: number
    getText: (item: T) => string
    isDisabled?: (item: T) => boolean
  }
): TypeaheadResult<T> {
  const { char, now, state, from, getText, isDisabled } = options
  const expired = now - state.at > RESET_AFTER_MS
  const previous = expired ? '' : state.buffer

  // Repeating one character cycles through items starting with it — the same
  // behaviour a native <select> has.
  const repeating = previous.length > 0 && previous.split('').every((c) => c === char)
  const query = (repeating ? char : previous + char).toLowerCase()
  const next: TypeaheadState = { buffer: previous + char, at: now }

  const start = repeating || previous.length === 0 ? from + 1 : from
  for (let offset = 0; offset < items.length; offset++) {
    const index = (start + offset + items.length) % items.length
    const item = items[index]
    if (isDisabled?.(item)) continue
    if (getText(item).toLowerCase().startsWith(query)) return { state: next, index }
  }
  return { state: next, index: -1 }
}
