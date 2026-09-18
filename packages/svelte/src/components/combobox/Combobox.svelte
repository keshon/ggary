<script lang="ts">
  import {
    attachComboboxSource,
    connect,
    createComboboxMachine,
    type ComboboxItem,
    type ComboboxLoad,
    type ComboboxWords,
  } from '@ggary/core/combobox'
  import { attachPopover, onFormReset, scrollIntoViewIfNeeded, svelteNormalizer, uid } from '@ggary/core'
  import { untrack } from 'svelte'

  type Props = {
    label?: string
    /** The options, filtered in the page as the person types. */
    items?: ComboboxItem[]
    /** Or a server that answers a query. Takes precedence over `items`. */
    load?: ComboboxLoad
    debounce?: number
    minLength?: number
    multiple?: boolean
    /** Bindable: `bind:value`. A single combobox holds a string, a multiple one a list. */
    value?: string | string[] | null
    defaultValue?: string | string[] | null
    selectedItems?: ComboboxItem[]
    onValueChange?: (value: string[], items: ComboboxItem[]) => void
    placeholder?: string
    disabled?: boolean
    limit?: number
    name?: string
    words?: ComboboxWords
  }

  let {
    label, items, load, debounce, minLength, multiple = false, value = $bindable(), defaultValue, selectedItems, onValueChange,
    placeholder, disabled = false, limit, name, words,
  }: Props = $props()

  const initial = untrack(() => (value !== undefined ? value : (defaultValue ?? null)))
  // Uncontrolled at heart, as `bind:value` is: a choice moves it and writes the binding.
  const machine = untrack(() =>
    createComboboxMachine({
      id: uid('gg-combobox'),
      items: load ? undefined : items,
      defaultValue: initial,
      selectedItems,
      multiple,
      disabled,
      limit,
      onValueChange: (next, chosen) => {
        value = multiple ? next : (next[0] ?? null)
        onValueChange?.(next, chosen)
      },
    })
  )

  let snapshot = $state.raw(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))
  // Effects that attach on open read this, not the snapshot: a new snapshot on every
  // change would detach and attach them again on each key.
  const isOpen = $derived(snapshot.open)
  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { ...words, placeholder: placeholder ?? words?.placeholder, name }))

  $effect(() => {
    if (!load && items) machine.send({ type: 'SYNC_SOURCE', items })
  })
  $effect(() => machine.send({ type: 'SYNC_OPTIONS', multiple, disabled, limit }))
  $effect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value, items: untrack(() => selectedItems) })
  })
  const hasLoad = $derived(Boolean(load))
  $effect(() => {
    if (!hasLoad) return
    const options = { debounce, minLength }
    return untrack(() => attachComboboxSource(machine, (query, signal) => load!(query, signal), options))
  })

  let inputEl = $state<HTMLInputElement | null>(null)
  let controlEl = $state<HTMLDivElement | null>(null)
  let positionerEl = $state<HTMLDivElement | null>(null)
  let contentEl = $state<HTMLUListElement | null>(null)

  $effect(() =>
    onFormReset(inputEl, () => {
      value = initial
      machine.send({ type: 'SYNC_VALUE', value: initial })
    })
  )

  $effect(() => {
    if (!isOpen || !controlEl || !positionerEl) return
    const popover = attachPopover(controlEl, positionerEl, { sameWidth: true, gutter: 4, onDismiss: () => machine.send({ type: 'CLOSE' }) })
    return () => popover.destroy()
  })

  $effect(() => {
    if (!isOpen || snapshot.highlightedIndex < 0) return
    scrollIntoViewIfNeeded(document.getElementById(api.ids.item(snapshot.highlightedIndex)), contentEl)
  })
</script>

<div {...api.rootProps}>
  {#if label}<label {...api.labelProps}>{label}</label>{/if}
  <div bind:this={controlEl} {...api.controlProps}>
    {#if multiple}
      {#each api.selectedItems as item (item.value)}
        {@const chip = api.getChipProps(item)}
        <span {...chip.chipProps}>
          <span {...chip.chipTextProps}>{item.label}</span>
          <button {...chip.removeProps}><span {...chip.removeIconProps}></span></button>
        </span>
      {/each}
    {/if}
    <input bind:this={inputEl} {...api.inputProps} />
    <button {...api.clearProps}><span {...api.clearIconProps}></span></button>
    <button {...api.triggerProps}><span {...api.triggerIconProps}></span></button>
  </div>
  <div bind:this={positionerEl} {...api.positionerProps}>
    <ul bind:this={contentEl} {...api.contentProps}>
      {#if api.items.length === 0}<li {...api.emptyProps}>{api.emptyText}</li>{/if}
      {#each api.items as item, index (item.value)}
        <li {...api.getItemProps(item, index)}>
          <span {...api.itemTextProps}>{item.label}</span>
          {#if item.description}<span {...api.itemDescriptionProps}>{item.description}</span>{/if}
          <span {...api.itemIndicatorProps}></span>
        </li>
      {/each}
      {#if api.moreText}<li {...api.moreProps}>{api.moreText}</li>{/if}
    </ul>
  </div>
  <span {...api.statusProps}>{api.statusText}</span>
  {#if name}
    {#each api.value as entry (entry)}<input {...api.getHiddenInputProps(entry)} />{/each}
  {/if}
</div>
