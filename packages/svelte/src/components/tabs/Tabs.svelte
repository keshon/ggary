<script lang="ts">
  import {
    connect,
    createTabsMachine,
    type TabItem,
    type TabsActivation,
    type TabsOrientation,
    type TabsVariant,
  } from '@ggary/core/tabs'
  import { focusTab, svelteNormalizer, uid } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'

  type Props = {
    items: TabItem[]
    /** Bindable: `bind:value`. A one-way `value` works too. */
    value?: string | null
    defaultValue?: string | null
    onValueChange?: (value: string) => void
    /** A close button, Delete or a middle click on a closable tab. Remove the item to close it. */
    onClose?: (value: string) => void
    /** The tab list's accessible name. */
    label?: string
    orientation?: TabsOrientation
    activation?: TabsActivation
    /** `line` for sections, `chips` for open documents. Default `line`. */
    variant?: TabsVariant
    /** The panel for a tab. Omit it for tabs that switch something rendered elsewhere. */
    panel?: Snippet<[TabItem]>
    /** Render every panel, hidden, rather than the selected one alone. Keeps their state. */
    keepMounted?: boolean
    closeLabel?: (label: string) => string
  }

  let {
    items,
    value = $bindable(),
    defaultValue,
    onValueChange,
    onClose,
    label,
    orientation,
    activation,
    variant,
    panel,
    keepMounted = false,
    closeLabel,
  }: Props = $props()

  const id = uid('gg-tabs')

  // Uncontrolled at heart, as `bind:value` is: a choice moves the tabs and
  // writes the binding, and a new `value` from outside arrives through SYNC_VALUE.
  const machine = untrack(() =>
    createTabsMachine({
      id,
      items,
      defaultValue: value !== undefined ? value : defaultValue,
      orientation,
      activation,
      onValueChange: (next) => {
        value = next
        onValueChange?.(next)
      },
      onClose: (closed) => onClose?.(closed),
    })
  )

  let snapshot = $state(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))

  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { label, variant, panels: panel !== undefined, closeLabel }))

  $effect(() => machine.send({ type: 'SYNC_ITEMS', items }))
  $effect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value })
  })
  $effect(() => machine.send({ type: 'SYNC_OPTIONS', orientation, activation }))

  // Roving focus moves only when the machine asks (the nonce), never on a re-render.
  let lastFocusNonce = 0
  $effect(() => {
    const { focusNonce, focusValue } = api
    if (focusNonce === 0 || focusNonce === lastFocusNonce || focusValue === null) return
    lastFocusNonce = focusNonce
    untrack(() => focusTab(document, api.ids.tab(focusValue)))
  })
</script>

<div {...api.rootProps}>
  <div {...api.listProps}>
    {#each api.items as item (item.value)}
      <div {...api.getTabProps(item)}>
        <span {...api.getTabTextProps()}>{item.label}</span>
        {#if item.closable}
          <button {...api.getCloseProps(item)}><span {...api.closeIconProps}></span></button>
        {/if}
      </div>
    {/each}
  </div>
  {#if panel}
    {#each api.items as item (item.value)}
      {#if keepMounted || item.value === snapshot.value}
        <div {...api.getPanelProps(item)}>{@render panel(item)}</div>
      {/if}
    {/each}
  {/if}
</div>
