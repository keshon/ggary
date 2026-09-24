<script lang="ts">
  import {
    connect,
    createChipGroupMachine,
    type ChipGroupMode,
    type ChipGroupOrientation,
    type ChipItem,
  } from '@ggary/core/chip-group'
  import type { ChipEmphasis, ChipSize } from '@ggary/core/chip'
  import { onFormReset, rovingFocus, svelteNormalizer, uid } from '@ggary/core'
  import { untrack } from 'svelte'

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
    /** Bindable: `bind:value`. A one-way `value` works too. */
    value?: string[]
    defaultValue?: string[]
    onValueChange?: (selection: string[], items: ChipItem[]) => void
    onRemove?: (value: string, item: ChipItem | null) => void
    /** What the group says: `empty` when it holds no chips. */
  words?: { empty?: string }
  }

  let {
    items,
    label,
    mode,
    orientation,
    emphasis,
    size,
    removable,
    disabled = false,
    name,
    value = $bindable(),
    defaultValue,
    onValueChange,
    onRemove,
    words = {},
  }: Props = $props()

  const id = uid('gg-chips')

  // The machine is built ONCE from the props as they are at mount, on purpose:
  // every prop that can change afterwards reaches it through a SYNC effect below.
  // `untrack` states that intent — and is what silences the compiler's
  // state_referenced_locally warning honestly, instead of suppressing it.
  // Uncontrolled at heart, as `bind:value` is: a toggle moves the group and
  // writes the binding, and a new `value` arrives through SYNC_SELECTION.
  const initial = untrack(() => value ?? defaultValue ?? [])
  const machine = untrack(() =>
    createChipGroupMachine({
      id,
      items,
      mode,
      orientation,
      disabled,
      removable,
      defaultValue: initial,
      onValueChange: (selection, selected) => {
        value = selection
        onValueChange?.(selection, selected)
      },
      onRemove: (removedValue, item) => onRemove?.(removedValue, item),
    })
  )

  let snapshot = $state(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))

  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { label, emphasis, size, name }))

  $effect(() => machine.send({ type: 'SYNC_ITEMS', items }))
  $effect(() => machine.send({ type: 'SYNC_DISABLED', disabled }))
  $effect(() => machine.send({ type: 'SYNC_OPTIONS', mode, orientation, removable }))
  $effect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_SELECTION', selection: value })
  })

  let root: HTMLDivElement
  $effect(() =>
    onFormReset(root, () => {
      value = initial
      machine.send({ type: 'SYNC_SELECTION', selection: initial })
    })
  )

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

<div bind:this={root} {...api.rootProps}>
  {#if label}
    <span {...api.labelProps}>{label}</span>
  {/if}

  <div {...api.listProps}>
    {#if api.items.length === 0}
      <span {...api.emptyProps}>{words.empty ?? 'Nothing here'}</span>
    {/if}
    {#each api.items as item, index (item.value)}
      <button {...api.getChipProps(item, index)}>
        <span {...api.getChipLabelProps()}>{item.label}</span>
        {#if item.removable ?? removable ?? false}
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
