import { describe, expect, it } from 'vitest'
import { initialState, reducer } from '../packages/core/src/components/chip-group/chip-group.machine'
import type {
  ChipGroupEvent,
  ChipGroupState,
  ChipItem,
} from '../packages/core/src/components/chip-group/chip-group.types'

const items: ChipItem[] = [
  { value: 'design', label: 'Design' },
  { value: 'code', label: 'Code' },
  { value: 'docs', label: 'Docs', disabled: true },
  { value: 'devops', label: 'DevOps' },
]

const setup = (overrides: Partial<ChipGroupState> = {}): ChipGroupState => ({
  ...initialState({ id: 't', items, removable: true }),
  ...overrides,
})

const run = (state: ChipGroupState, ...events: ChipGroupEvent[]) => events.reduce(reducer, state)

describe('roving focus', () => {
  it('starts on the first enabled chip and does not ask anyone to move focus', () => {
    const state = setup()
    expect(state.focus).toEqual({ index: 0, nonce: 0 })
  })

  it('wraps, unlike Select which clamps', () => {
    const atEnd = run(setup(), { type: 'FOCUS_EDGE', edge: 'last' })
    expect(atEnd.focus.index).toBe(3)
    expect(run(atEnd, { type: 'FOCUS_MOVE', step: 1 }).focus.index).toBe(0)
    expect(run(setup(), { type: 'FOCUS_MOVE', step: -1 }).focus.index).toBe(3)
  })

  it('skips disabled chips in both directions', () => {
    const state = run(setup(), { type: 'FOCUS', index: 1 })
    expect(run(state, { type: 'FOCUS_MOVE', step: 1 }).focus.index).toBe(3)
    expect(run(setup({ focus: { index: 3, nonce: 0 } }), { type: 'FOCUS_MOVE', step: -1 }).focus.index).toBe(1)
  })

  it('raises the nonce when the machine asks focus to move', () => {
    const state = run(setup(), { type: 'FOCUS_MOVE', step: 1 })
    expect(state.focus.nonce).toBe(1)
  })

  // Without this, the adapter's focus effect would fire in response to the focus
  // event it just caused, and the group would fight the user for the caret.
  it('does NOT raise the nonce for a focus the DOM merely reported', () => {
    const state = run(setup(), { type: 'FOCUS', index: 3 })
    expect(state.focus).toEqual({ index: 3, nonce: 0 })
  })

  it('refuses to focus a disabled chip', () => {
    const state = setup()
    expect(reducer(state, { type: 'FOCUS', index: 2 })).toBe(state)
  })
})

describe('selection', () => {
  it('multi mode accumulates and keeps item order, not click order', () => {
    const state = run(
      setup(),
      { type: 'TOGGLE', index: 3 },
      { type: 'TOGGLE', index: 0 }
    )
    expect(state.selection).toEqual(['design', 'devops'])
  })

  it('multi mode toggles off', () => {
    const state = run(setup(), { type: 'TOGGLE', index: 0 }, { type: 'TOGGLE', index: 0 })
    expect(state.selection).toEqual([])
  })

  it('single mode replaces, and re-picking clears', () => {
    const single = setup({ mode: 'single' })
    const picked = run(single, { type: 'TOGGLE', index: 0 }, { type: 'TOGGLE', index: 1 })
    expect(picked.selection).toEqual(['code'])
    expect(run(picked, { type: 'TOGGLE', index: 1 }).selection).toEqual([])
  })

  it('ignores disabled chips', () => {
    const state = setup()
    expect(reducer(state, { type: 'TOGGLE', index: 2 })).toBe(state)
  })

  it('reports intent but never writes selection in controlled mode', () => {
    const controlled = setup({ controlled: true, selection: [] })
    const state = run(controlled, { type: 'TOGGLE', index: 1 })
    expect(state.selection).toEqual([])
    expect(state.intent).toEqual({ selection: ['code'], nonce: 1 })
  })

  it('does not raise intent when the owner pushes a selection in', () => {
    const state = run(setup(), { type: 'SYNC_SELECTION', selection: ['code'] })
    expect(state.selection).toEqual(['code'])
    expect(state.intent.nonce).toBe(0)
  })
})

describe('removal', () => {
  it('announces the request without touching items — the owner owns the list', () => {
    const state = run(setup(), { type: 'REMOVE', index: 0 })
    expect(state.items).toHaveLength(4)
    expect(state.removal).toEqual({ value: 'design', nonce: 1 })
  })

  it('pre-aims focus at an ENABLED chip in the list as it will be', () => {
    const state = run(setup(), { type: 'FOCUS_EDGE', edge: 'last' }, { type: 'REMOVE' })
    // Removing index 3 leaves [design, code, docs]. The slot that opens up is
    // index 2 — but docs is disabled and therefore not focusable, so the landing
    // has to walk back to code.
    expect(state.focus.index).toBe(1)
  })

  it('re-homes the tab stop when items arrive after construction', () => {
    // A custom element is constructed empty and has `items` assigned later. The
    // first version kept focus.index at -1 here, leaving the group with no chip
    // in the tab order and no way to reach it from the keyboard.
    const empty = initialState({ id: 't', items: [] })
    expect(empty.focus.index).toBe(-1)
    expect(run(empty, { type: 'SYNC_ITEMS', items }).focus.index).toBe(0)
  })

  it('re-homes the tab stop when the current chip becomes disabled', () => {
    const state = run(setup({ focus: { index: 1, nonce: 0 } }), {
      type: 'SYNC_ITEMS',
      items: items.map((i, n) => (n === 1 ? { ...i, disabled: true } : i)),
    })
    expect(state.items[state.focus.index].disabled).toBeFalsy()
  })

  // The queued focus move has to survive the very list change it asked for.
  it('keeps the pending focus nonce across SYNC_ITEMS', () => {
    const removed = run(setup(), { type: 'REMOVE', index: 0 })
    const synced = run(removed, { type: 'SYNC_ITEMS', items: items.slice(1) })
    expect(synced.focus.nonce).toBe(removed.focus.nonce)
    expect(synced.items).toHaveLength(3)
  })

  it('ignores removal when the group is not removable', () => {
    const state = setup({ removable: false })
    expect(reducer(state, { type: 'REMOVE', index: 0 })).toBe(state)
  })

  it('honours a per-item removable override', () => {
    const state = setup({ removable: false, items: [{ value: 'a', label: 'A', removable: true }] })
    expect(reducer(state, { type: 'REMOVE', index: 0 }).removal.value).toBe('a')
  })

  it('drops selection entries for items that disappear', () => {
    const state = run(setup(), { type: 'TOGGLE', index: 0 }, { type: 'SYNC_ITEMS', items: items.slice(1) })
    expect(state.selection).toEqual([])
  })
})

describe('typeahead', () => {
  it('moves focus to the first match', () => {
    const state = run(setup(), { type: 'TYPE', char: 'c', now: 1000 })
    expect(state.focus.index).toBe(1)
  })

  it('never lands on a disabled chip', () => {
    const state = run(setup(), { type: 'TYPE', char: 'd', now: 1000 })
    expect(state.items[state.focus.index].disabled).toBeFalsy()
  })
})

describe('disabled group', () => {
  it('ignores every user intent', () => {
    const state = setup({ disabled: true })
    for (const event of [
      { type: 'FOCUS_MOVE', step: 1 },
      { type: 'TOGGLE', index: 0 },
      { type: 'REMOVE', index: 0 },
      { type: 'TYPE', char: 'c', now: 1000 },
    ] as ChipGroupEvent[]) {
      expect(reducer(state, event), event.type).toBe(state)
    }
  })
})
