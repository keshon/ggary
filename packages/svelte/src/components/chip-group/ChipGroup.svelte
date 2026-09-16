<script lang="ts">
  import {
    connect,
    createChipGroupMachine,
    type ChipGroupMode,
    type ChipGroupOrientation,
    type ChipItem,
  } from '@ggary/core/chip-group'
  import type { ChipEmphasis, ChipSize } from '@ggary/core/chip'
  import { rovingFocus, svelteNormalizer, uid } from '@ggary/core'

  type Props = {
    items: ChipItem[]
    label?: string
    mode?: ChipGroupMode
    orientation?: ChipGroupOrientation
    emphasis?: ChipEmphasis
    size?: ChipSize
    removable?: boolean
    disabled?: boolean
    name?: string
    value?: string[]
    defaultValue?: string[]
    onSelectionChange?: (selection: string[], items: ChipItem[]) => void
    onRemove?: (value: string, item: ChipItem | null) => void
    emptyLabel?: string
  }

  let {
    items,
    label,
    mode,
    orientation,
    emphasis,
    size,
    removable = false,
    disabled = false,
    name,
    value,
    defaultValue,
    onSelectionChange,
    onRemove,
    emptyLabel = 'Nothing here',
  }: Props = $props()

  const id = uid('gg-chips')

  const machine = createChipGroupMachine({
    id,
    items,
    mode,
    orientation,
    disabled,
    removable,
    value,
    defaultValue,
    onSelectionChange: (selection, selected) => onSelectionChange?.(selection, selected),
    onRemove: (removedValue, item) => onRemove?.(removedValue, item),
  })

  let snapshot = $state(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))

  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { label, emphasis, size, name }))

  $effect(() => machine.send({ type: 'SYNC_ITEMS', items }))
  $effect(() => machine.send({ type: 'SYNC_DISABLED', disabled }))
  $effect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_SELECTION', selection: value })
  })

  // Identical rule to the React adapter: act on the nonce, and only when it
  // actually changed. `api` is re-derived on every state change, so an effect
  // that merely reads it would re-focus constantly and steal focus back from
  // wherever the user moved it.
  let lastFocusNonce = 0
  $effect(() => {
    const { nonce, index } = snapshot.focus
    if (nonce === 0 || nonce === lastFocusNonce || index < 0) return
    lastFocusNonce = nonce
    rovingFocus(document, api.ids.chip(index))
  })
</script>

<div {...api.rootProps}>
  {#if label}
    <span {...api.labelProps}>{label}</span>
  {/if}

  <div {...api.listProps}>
    {#if api.items.length === 0}
      <span {...api.emptyProps}>{emptyLabel}</span>
    {/if}
    {#each api.items as item, index (item.value)}
      <button {...api.getChipProps(item, index)}>
        <span {...api.getChipLabelProps()}>{item.label}</span>
        {#if item.removable ?? removable}
          <span {...api.getChipRemoveProps(item, index)}><span {...api.getChipRemoveIconProps()}></span></span>
        {/if}
      </button>
    {/each}
  </div>

  {#if api.hasName}
    {#each api.selection as selected (selected)}
      <input {...api.getHiddenInputProps(selected)} />
    {/each}
  {/if}
</div>
