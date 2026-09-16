import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { connect, createChipGroupMachine, type ChipGroupMode, type ChipGroupOrientation, type ChipItem } from '@ggary/core/chip-group'
import type { ChipSize, ChipVariant } from '@ggary/core/chip'
import { reactNormalizer, rovingFocus } from '@ggary/core'
import { RemoveIcon } from '../chip/Chip'

export interface ChipGroupProps {
  items: ChipItem[]
  label?: string
  mode?: ChipGroupMode
  orientation?: ChipGroupOrientation
  variant?: ChipVariant
  size?: ChipSize
  removable?: boolean
  disabled?: boolean
  name?: string
  /** Controlled. Omit and use `defaultValue` for uncontrolled. */
  value?: string[]
  defaultValue?: string[]
  onSelectionChange?: (selection: string[], items: ChipItem[]) => void
  onRemove?: (value: string, item: ChipItem | null) => void
  emptyLabel?: string
}

export function ChipGroup(props: ChipGroupProps) {
  const {
    items, label, mode, orientation, variant, size, removable, disabled = false,
    name, value, defaultValue, onSelectionChange, onRemove, emptyLabel = 'Nothing here',
  } = props

  const id = `gg-chips-${useId().replace(/:/g, '')}`

  const callbacks = useRef({ onSelectionChange, onRemove })
  callbacks.current = { onSelectionChange, onRemove }

  const [machine] = useState(() =>
    createChipGroupMachine({
      id, items, mode, orientation, disabled, removable, value, defaultValue,
      onSelectionChange: (selection, selected) => callbacks.current.onSelectionChange?.(selection, selected),
      onRemove: (removedValue, item) => callbacks.current.onRemove?.(removedValue, item),
    })
  )

  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { label, variant, size, name })

  useEffect(() => machine.send({ type: 'SYNC_ITEMS', items }), [machine, items])
  useEffect(() => machine.send({ type: 'SYNC_DISABLED', disabled }), [machine, disabled])
  useEffect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_SELECTION', selection: value })
  }, [machine, value])

  // The one piece of DOM work roving tabindex needs, and it has two traps.
  //
  // useLayoutEffect, not useEffect: focus must land before paint. A passive
  // effect moves it a frame late, and under concurrent rendering can be
  // delayed further.
  //
  // Guard on the nonce explicitly rather than trusting the dep array: `api.ids`
  // is a fresh object every render, so a dep-array version re-runs constantly
  // and will drag focus back into the group from wherever the user actually
  // moved it.
  const lastFocusNonce = useRef(0)
  useLayoutEffect(() => {
    if (api.focusNonce === 0 || api.focusNonce === lastFocusNonce.current || api.focusedIndex < 0) return
    lastFocusNonce.current = api.focusNonce
    rovingFocus(document, api.ids.chip(api.focusedIndex))
  })

  return (
    <div {...api.rootProps}>
      {label && <span {...api.labelProps}>{label}</span>}

      <div {...api.listProps}>
        {api.items.length === 0 && <span {...api.emptyProps}>{emptyLabel}</span>}
        {api.items.map((item, index) => (
          <button key={item.value} {...api.getChipProps(item, index)}>
            <span {...api.getChipLabelProps()}>{item.label}</span>
            {(item.removable ?? removable) && (
              <span {...api.getChipRemoveProps(item, index)}>
                <RemoveIcon />
              </span>
            )}
          </button>
        ))}
      </div>

      {api.hasName && api.selection.map((v) => <input key={v} {...api.getHiddenInputProps(v)} />)}
    </div>
  )
}
