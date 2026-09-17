import { createMachine, withEffects, type Machine } from '../../machine'
import { edgeEnabled, nearestEnabled, nextEnabled } from '../../utils/collection'
import { typeahead } from '../../utils/typeahead'
import type { ChipGroupEvent, ChipGroupMode, ChipGroupOrientation, ChipGroupState, ChipItem } from './chip-group.types'

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

// A toolbar wraps. This is the one line where ChipGroup and Select disagree
// about collection traversal, which is why `loop` is an option rather than a
// second copy of the walk.
const collection = { isDisabled: (item: ChipItem) => !!item.disabled, loop: true }

const enabled = (item: ChipItem | undefined) => !!item && !item.disabled

const isRemovable = (state: ChipGroupState, item: ChipItem | undefined) =>
  !!item && (item.removable ?? state.removable) && !item.disabled

/** Preserve the order of `items`, so selection never depends on click order. */
function orderedSelection(items: ChipItem[], selection: Iterable<string>): string[] {
  const wanted = new Set(selection)
  return items.filter((item) => wanted.has(item.value)).map((item) => item.value)
}

function withFocus(state: ChipGroupState, index: number): ChipGroupState {
  if (index === -1) return state
  return { ...state, focus: { index, nonce: state.focus.nonce + 1 } }
}

/** Same contract as Select: intent always advances, `selection` only if we own it. */
function commitSelection(state: ChipGroupState, selection: string[]): ChipGroupState {
  const next = { ...state, intent: { selection, nonce: state.intent.nonce + 1 } }
  return state.controlled ? next : { ...next, selection }
}

// ---------------------------------------------------------------------------
// Reducer. Pure. No DOM.
// ---------------------------------------------------------------------------

export function reducer(state: ChipGroupState, event: ChipGroupEvent): ChipGroupState {
  switch (event.type) {
    case 'FOCUS': {
      if (event.index === state.focus.index) return state
      if (!enabled(state.items[event.index])) return state
      // A focus event REPORTED by the DOM (the user clicked or tabbed in) must
      // not bump the nonce, or the adapter would re-focus in response to its own
      // focus event and loop.
      return { ...state, focus: { index: event.index, nonce: state.focus.nonce } }
    }

    case 'FOCUS_MOVE': {
      if (state.disabled) return state
      const next = nextEnabled(state.items, state.focus.index, event.step, collection)
      return next === -1 ? state : withFocus(state, next)
    }

    case 'FOCUS_EDGE': {
      if (state.disabled) return state
      const next = edgeEnabled(state.items, event.edge, collection)
      return next === -1 ? state : withFocus(state, next)
    }

    case 'TOGGLE': {
      if (state.disabled) return state
      const index = event.index ?? state.focus.index
      const item = state.items[index]
      if (!enabled(item)) return state

      const isSelected = state.selection.includes(item.value)
      const selection =
        state.mode === 'single'
          ? isSelected
            ? [] // re-picking the active chip clears it; filter chips are not radios
            : [item.value]
          : orderedSelection(
              state.items,
              isSelected ? state.selection.filter((v) => v !== item.value) : [...state.selection, item.value]
            )

      return commitSelection(state, selection)
    }

    case 'REMOVE': {
      if (state.disabled) return state
      const index = event.index ?? state.focus.index
      const item = state.items[index]
      if (!isRemovable(state, item)) return state

      // Items are a prop. Removal is a request the owner fulfils; the machine
      // only announces it and pre-aims focus at the chip that will take this
      // one's place. It aims against the list as it WILL be, and at an enabled
      // chip — a disabled one is not focusable, so focus would fall to <body>.
      const remaining = state.items.filter((_, i) => i !== index)
      const landing = nearestEnabled(remaining, index, collection)
      const removal = { value: item.value, nonce: state.removal.nonce + 1 }
      return { ...withFocus(state, landing), removal }
    }

    case 'TYPE': {
      if (state.disabled) return state
      const result = typeahead(state.items, {
        char: event.char,
        now: event.now,
        state: state.typeahead,
        from: state.focus.index,
        getText: (item) => item.label,
        isDisabled: (item) => !!item.disabled,
      })
      const moved = result.index === -1 ? state : withFocus(state, result.index)
      return { ...moved, typeahead: result.state }
    }

    case 'SYNC_ITEMS': {
      if (event.items === state.items) return state
      // Re-home the tab stop. Items often arrive after construction (fetched,
      // or assigned as a property on a custom element); without this the group
      // keeps focus.index === -1 from its empty initial state and ends up with
      // NO chip in the tab order at all — unreachable by keyboard.
      const index = nearestEnabled(event.items, Math.max(state.focus.index, 0), collection)
      return {
        ...state,
        items: event.items,
        // Keep the nonce: the pending focus move queued by REMOVE has to survive
        // the very list change it asked for.
        focus: { index, nonce: state.focus.nonce },
        selection: orderedSelection(event.items, state.selection),
      }
    }

    case 'SYNC_SELECTION': {
      const selection = orderedSelection(state.items, event.selection)
      if (selection.length === state.selection.length && selection.every((v, i) => v === state.selection[i])) {
        return state
      }
      return { ...state, selection }
    }

    case 'SYNC_DISABLED': {
      if (event.disabled === state.disabled) return state
      return { ...state, disabled: event.disabled }
    }

    case 'SYNC_OPTIONS': {
      // The event carries the WHOLE option set, and an absent option means its
      // default — so removing a prop reverts it rather than leaving the last
      // value stuck, and no adapter has to know what the defaults are.
      const mode = event.mode ?? DEFAULTS.mode
      const orientation = event.orientation ?? DEFAULTS.orientation
      const removable = event.removable ?? DEFAULTS.removable
      if (mode === state.mode && orientation === state.orientation && removable === state.removable) return state

      // Narrowing multi to single cannot leave several chips selected. When the
      // machine owns the selection it keeps the first, in item order. This is
      // the owner reconfiguring the group, not the user choosing, so it raises
      // no intent. A controlled owner's selection is left to the owner.
      const selection =
        mode === 'single' && !state.controlled && state.selection.length > 1 ? state.selection.slice(0, 1) : state.selection
      return { ...state, mode, orientation, removable, selection }
    }

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** One home for the defaults, shared by construction and by SYNC_OPTIONS. */
const DEFAULTS = { mode: 'multi', orientation: 'horizontal', removable: false } as const

export interface ChipGroupConfig {
  id: string
  items?: ChipItem[]
  mode?: ChipGroupMode
  orientation?: ChipGroupOrientation
  disabled?: boolean
  removable?: boolean
  /** Controlled. Omit and use `defaultValue` for uncontrolled. */
  value?: string[]
  defaultValue?: string[]
  onSelectionChange?: (selection: string[], items: ChipItem[]) => void
  onRemove?: (value: string, item: ChipItem | null) => void
}

export function initialState(config: ChipGroupConfig): ChipGroupState {
  const items = config.items ?? []
  const controlled = config.value !== undefined
  const selection = orderedSelection(items, controlled ? config.value! : config.defaultValue ?? [])

  return {
    id: config.id,
    items,
    mode: config.mode ?? DEFAULTS.mode,
    orientation: config.orientation ?? DEFAULTS.orientation,
    disabled: config.disabled ?? false,
    removable: config.removable ?? DEFAULTS.removable,
    controlled,
    selection,
    // nonce 0 means "never asked to move focus" — adapters must not steal focus
    // on mount.
    focus: { index: edgeEnabled(items, 'first', collection), nonce: 0 },
    intent: { selection, nonce: 0 },
    removal: { value: null, nonce: 0 },
    typeahead: { buffer: '', at: 0 },
  }
}

export function createChipGroupMachine(config: ChipGroupConfig): Machine<ChipGroupState, ChipGroupEvent> {
  const base = createMachine<ChipGroupState, ChipGroupEvent>(initialState(config), reducer)

  return withEffects(base, (previous, next) => {
    if (previous.intent.nonce !== next.intent.nonce) {
      const chosen = new Set(next.intent.selection)
      config.onSelectionChange?.(
        next.intent.selection,
        next.items.filter((item) => chosen.has(item.value))
      )
    }
    if (previous.removal.nonce !== next.removal.nonce && next.removal.value != null) {
      const item = next.items.find((i) => i.value === next.removal.value) ?? null
      config.onRemove?.(next.removal.value, item)
    }
  })
}
