<script lang="ts">
  import { connect, createSelectMachine, type SelectItem } from '@ggary/core/select'
  import { attachPositioner, scrollIntoViewIfNeeded, svelteNormalizer, trackDismissable, uid } from '@ggary/core'

  type Props = {
    items: SelectItem[]
    label?: string
    placeholder?: string
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
    value,
    defaultValue,
    disabled = false,
    name,
    onValueChange,
  }: Props = $props()

  const id = uid('gg-select')

  const machine = createSelectMachine({
    id,
    items,
    value,
    defaultValue,
    disabled,
    onValueChange: (next, item) => onValueChange?.(next, item),
  })

  let snapshot = $state(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))

  // Identical to the React adapter's `connect()` call — different normalizer.
  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { placeholder, name }))

  // Props flow in as events, exactly as in React.
  $effect(() => machine.send({ type: 'SYNC_ITEMS', items }))
  $effect(() => machine.send({ type: 'SYNC_DISABLED', disabled }))
  $effect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value })
  })

  let triggerEl = $state<HTMLButtonElement | null>(null)
  let positionerEl = $state<HTMLDivElement | null>(null)
  let contentEl = $state<HTMLUListElement | null>(null)

  $effect(() => {
    if (!snapshot.open || !triggerEl || !positionerEl) return
    const stopPositioning = attachPositioner(triggerEl, positionerEl)
    const stopDismiss = trackDismissable(positionerEl, {
      exclude: [triggerEl],
      onDismiss: () => {
        machine.send({ type: 'CLOSE' })
        triggerEl?.focus()
      },
    })
    return () => {
      stopPositioning()
      stopDismiss()
    }
  })

  $effect(() => {
    if (!snapshot.open || snapshot.highlightedIndex < 0) return
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
    <svg {...api.indicatorProps} width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </button>

  <div bind:this={positionerEl} {...api.positionerProps}>
    <ul bind:this={contentEl} {...api.contentProps}>
      {#if api.items.length === 0}
        <li {...api.emptyProps}>No options</li>
      {/if}
      {#each api.items as item, index (item.value)}
        <li {...api.getItemProps(item, index)}>
          <span {...api.getItemTextProps()}>{item.label}</span>
          <svg {...api.getItemIndicatorProps()} width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </li>
      {/each}
    </ul>
  </div>

  {#if name}
    <input {...api.hiddenInputProps} />
  {/if}
</div>
