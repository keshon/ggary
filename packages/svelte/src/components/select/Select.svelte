<script lang="ts">
  import { connect, createSelectMachine, type SelectItem } from '@ggary/core/select'
  import { attachPopover, onFormReset, scrollIntoViewIfNeeded, svelteNormalizer, uid } from '@ggary/core'
  import { untrack } from 'svelte'

  type Props = {
    items: SelectItem[]
    label?: string
    placeholder?: string
    /** Bindable: `bind:value`. A one-way `value` works too. */
    value?: string | null
    defaultValue?: string | null
    disabled?: boolean
    name?: string
    onValueChange?: (value: string | null, item: SelectItem | null) => void
  }

  let {
    items,
    label,
    placeholder,
    value = $bindable(),
    defaultValue,
    disabled = false,
    name,
    onValueChange,
  }: Props = $props()

  const id = uid('gg-select')

  // Built once from the props at mount; items, disabled and value reach it
  // afterwards through the SYNC effects below. See ChipGroup.svelte for why
  // this is `untrack`. Uncontrolled at heart, as `bind:value` is (and as
  // RadioGroup and Dialog are): a choice moves the select and writes the
  // binding, and a new `value` from outside arrives through SYNC_VALUE.
  const initial = untrack(() => (value !== undefined ? value : (defaultValue ?? null)))
  const machine = untrack(() =>
    createSelectMachine({
      id,
      items,
      defaultValue: initial,
      disabled,
      onValueChange: (next, item) => {
        value = next
        onValueChange?.(next, item)
      },
    })
  )

  let snapshot = $state(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))
  // Effects that attach on open read this, not the snapshot: a new snapshot on every
  // change would detach and attach them again on each key.
  const isOpen = $derived(snapshot.open)

  // Identical to the React adapter's `connect()` call — different normalizer.
  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { placeholder, name }))

  // Props flow in as events, exactly as in React.
  $effect(() => machine.send({ type: 'SYNC_ITEMS', items }))
  $effect(() => machine.send({ type: 'SYNC_DISABLED', disabled }))
  $effect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value })
  })

  let triggerEl = $state<HTMLButtonElement | null>(null)

  // A reset form puts the select back where it started.
  $effect(() =>
    onFormReset(triggerEl, () => {
      value = initial
      machine.send({ type: 'SYNC_VALUE', value: initial })
    })
  )
  let positionerEl = $state<HTMLDivElement | null>(null)
  let contentEl = $state<HTMLUListElement | null>(null)

  $effect(() => {
    if (!isOpen || !triggerEl || !positionerEl) return
    // Focus stays on the trigger (aria-activedescendant), so no focus management.
    const popover = attachPopover(triggerEl, positionerEl, {
      sameWidth: true,
      gutter: 4,
      // Placement is asynchronous and shortens the list: keep the highlight in view after it.
      onPlaced: () => {
        const { highlightedIndex } = machine.getState()
        if (highlightedIndex >= 0) scrollIntoViewIfNeeded(document.getElementById(api.ids.item(highlightedIndex)), contentEl)
      },
      onDismiss: () => {
        machine.send({ type: 'CLOSE' })
        triggerEl?.focus()
      },
    })
    return () => popover.destroy()
  })

  $effect(() => {
    if (!isOpen || snapshot.highlightedIndex < 0) return
    scrollIntoViewIfNeeded(document.getElementById(api.ids.item(snapshot.highlightedIndex)), contentEl)
  })
</script>

<div {...api.rootProps}>
  {#if label}
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label {...api.labelProps}>{label}</label>
  {/if}

  <button bind:this={triggerEl} {...api.triggerProps}>
    <span {...api.valueProps}>{api.displayText}</span>
    <span {...api.indicatorProps}></span>
  </button>

  <div bind:this={positionerEl} {...api.positionerProps}>
    <ul bind:this={contentEl} {...api.contentProps}>
      {#if api.items.length === 0}
        <li {...api.emptyProps}>No options</li>
      {/if}
      {#each api.items as item, index (item.value)}
        <li {...api.getItemProps(item, index)}>
          <span {...api.getItemTextProps()}>{item.label}</span>
          <span {...api.getItemIndicatorProps()}></span>
        </li>
      {/each}
    </ul>
  </div>

  {#if name}
    <input {...api.hiddenInputProps} />
  {/if}
</div>
