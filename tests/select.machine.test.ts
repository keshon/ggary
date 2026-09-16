import { describe, expect, it } from 'vitest'
import { initialState, reducer } from '../packages/core/src/components/select/select.machine'
import type { SelectEvent, SelectItem, SelectState } from '../packages/core/src/components/select/select.types'

// This file runs in vitest's `node` environment. There is no `document` here,
// and that is the point: if anyone puts DOM access in a machine, these fail.

const items: SelectItem[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
  { value: 'c', label: 'Charlie', disabled: true },
  { value: 'd', label: 'Delta' },
]

const setup = (overrides: Partial<SelectState> = {}): SelectState => ({
  ...initialState({ id: 't', items }),
  ...overrides,
})

const run = (state: SelectState, ...events: SelectEvent[]) => events.reduce(reducer, state)

describe('open / close', () => {
  it('opens with the first enabled item highlighted when nothing is selected', () => {
    const next = run(setup(), { type: 'OPEN' })
    expect(next.open).toBe(true)
    expect(next.highlightedIndex).toBe(0)
  })

  it('opens with the selected item highlighted', () => {
    const next = run(setup({ value: 'd', highlightedIndex: 3 }), { type: 'OPEN' })
    expect(next.highlightedIndex).toBe(3)
  })

  it('refuses to open when disabled', () => {
    const state = setup({ disabled: true })
    expect(run(state, { type: 'OPEN' })).toBe(state)
  })

  it('returns the identical object for no-op events, so subscribers do not fire', () => {
    const state = setup()
    expect(reducer(state, { type: 'CLOSE' })).toBe(state)
    expect(reducer(state, { type: 'SYNC_VALUE', value: null })).toBe(state)
  })
})

describe('keyboard navigation', () => {
  it('skips disabled items going down', () => {
    const open = run(setup(), { type: 'OPEN' })
    const next = run(open, { type: 'HIGHLIGHT_MOVE', step: 1 }, { type: 'HIGHLIGHT_MOVE', step: 1 })
    expect(next.highlightedIndex).toBe(3) // 0 -> 1 -> skips 2 (disabled) -> 3
  })

  it('skips disabled items going up', () => {
    const open = run(setup({ open: true, highlightedIndex: 3 }), { type: 'HIGHLIGHT_MOVE', step: -1 })
    expect(open.highlightedIndex).toBe(1)
  })

  it('clamps at the ends instead of wrapping', () => {
    const atEnd = setup({ open: true, highlightedIndex: 3 })
    expect(run(atEnd, { type: 'HIGHLIGHT_MOVE', step: 1 }).highlightedIndex).toBe(3)
    const atStart = setup({ open: true, highlightedIndex: 0 })
    expect(run(atStart, { type: 'HIGHLIGHT_MOVE', step: -1 }).highlightedIndex).toBe(0)
  })

  it('HIGHLIGHT_EDGE lands on enabled items only', () => {
    const open = setup({ open: true })
    expect(run(open, { type: 'HIGHLIGHT_EDGE', edge: 'last' }).highlightedIndex).toBe(3)
    expect(run(open, { type: 'HIGHLIGHT_EDGE', edge: 'first' }).highlightedIndex).toBe(0)
  })

  it('arrow keys on a CLOSED trigger change the value directly, like a native select', () => {
    const next = run(setup({ value: 'a' }), { type: 'HIGHLIGHT_MOVE', step: 1 })
    expect(next.open).toBe(false)
    expect(next.value).toBe('b')
  })
})

describe('selection', () => {
  it('selects the highlighted item and closes', () => {
    const next = run(setup(), { type: 'OPEN' }, { type: 'HIGHLIGHT_MOVE', step: 1 }, { type: 'SELECT' })
    expect(next.value).toBe('b')
    expect(next.open).toBe(false)
  })

  it('ignores selection of a disabled item', () => {
    const open = run(setup(), { type: 'OPEN' })
    expect(run(open, { type: 'SELECT', index: 2 })).toBe(open)
  })

  it('never writes value in controlled mode, but still moves the highlight', () => {
    const controlled = { ...setup(), controlled: true, value: 'a' as string | null }
    const next = run(controlled, { type: 'OPEN' }, { type: 'SELECT', index: 1 })
    expect(next.value).toBe('a') // owner still owns it
    expect(next.highlightedIndex).toBe(1)
    expect(next.open).toBe(false)
  })
})

// Regression: the first version of this machine diffed `value` to decide when to
// call onValueChange. In controlled mode `value` never moves on its own, so the
// callback never fired and the component was inert — while a SYNC_VALUE from the
// owner *did* fire it, echoing back the owner's own write.
describe('intent vs value', () => {
  it('reports the intended value in controlled mode even though value is unchanged', () => {
    const controlled = { ...setup(), controlled: true, value: 'a' as string | null }
    const next = run(controlled, { type: 'OPEN' }, { type: 'SELECT', index: 3 })
    expect(next.intent).toEqual({ value: 'd', nonce: 1 })
    expect(next.value).toBe('a')
  })

  it('does not raise intent when the owner pushes a value in', () => {
    const next = run(setup(), { type: 'SYNC_VALUE', value: 'b' })
    expect(next.value).toBe('b')
    expect(next.intent.nonce).toBe(0)
  })

  it('advances the nonce when the same value is chosen twice, so repeats stay observable', () => {
    const once = run(setup(), { type: 'OPEN' }, { type: 'SELECT', index: 1 })
    const twice = run(once, { type: 'OPEN' }, { type: 'SELECT', index: 1 })
    expect(twice.intent.nonce).toBe(2)
  })

  it('raises intent on clear', () => {
    const next = run(setup({ value: 'a' }), { type: 'CLEAR' })
    expect(next.intent).toEqual({ value: null, nonce: 1 })
  })
})

describe('typeahead', () => {
  const now = 1_000

  it('jumps to the first match on a closed trigger and commits the value', () => {
    const next = run(setup(), { type: 'TYPE', char: 'd', now })
    expect(next.value).toBe('d')
  })

  it('accumulates within the timeout to disambiguate', () => {
    const open = run(setup(), { type: 'OPEN' })
    const next = run(open, { type: 'TYPE', char: 'b', now }, { type: 'TYPE', char: 'r', now: now + 100 })
    expect(next.highlightedIndex).toBe(1) // "br" -> Bravo
  })

  it('resets the buffer after the timeout', () => {
    const open = run(setup(), { type: 'OPEN' })
    const next = run(open, { type: 'TYPE', char: 'b', now }, { type: 'TYPE', char: 'd', now: now + 5_000 })
    expect(next.highlightedIndex).toBe(3) // fresh buffer "d" -> Delta
  })

  it('never lands on a disabled item', () => {
    const open = run(setup(), { type: 'OPEN' })
    const next = run(open, { type: 'TYPE', char: 'c', now })
    expect(next.highlightedIndex).not.toBe(2)
  })
})

describe('prop sync', () => {
  it('re-derives the highlight when the value is pushed in', () => {
    const next = run(setup(), { type: 'SYNC_VALUE', value: 'd' })
    expect(next.highlightedIndex).toBe(3)
  })

  it('closes when disabled while open', () => {
    const next = run(setup(), { type: 'OPEN' }, { type: 'SYNC_DISABLED', disabled: true })
    expect(next.open).toBe(false)
  })

  it('clamps the highlight when the item list shrinks', () => {
    const open = run(setup({ open: true, highlightedIndex: 3 }))
    const next = run(open, { type: 'SYNC_ITEMS', items: items.slice(0, 2) })
    expect(next.highlightedIndex).toBe(1)
  })
})
