<script lang="ts">
  import {
    connect,
    createRibbonMachine,
    type RibbonItem,
    type RibbonVariant,
  } from '@ggary/core/ribbon'
  import { focusTab, svelteNormalizer, uid } from '@ggary/core'
  import { attachRibbonScrollers } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'

  type Props = {
    items: RibbonItem[]
    /** Bindable: `bind:value`. A one-way `value` works too. */
    value?: string | null
    defaultValue?: string | null
    onValueChange?: (value: string) => void
    /** The tab row's accessible name. */
    label?: string
    /** `strip` for one ruled band, `cards` for a card per group. Default `strip`. */
    variant?: RibbonVariant
    /** The panel for a tab: groups of the kit's own controls. */
    panel?: Snippet<[RibbonItem]>
    /** Render every panel, hidden, rather than the selected one alone. Keeps their state. */
    keepMounted?: boolean
    [key: string]: unknown
  }

  let {
    items,
    value = $bindable(),
    defaultValue,
    onValueChange,
    label,
    variant,
    panel,
    keepMounted = false,
    ...rest
  }: Props = $props()

  const id = uid('gg-ribbon')

  const machine = untrack(() =>
    createRibbonMachine({
      id,
      items,
      defaultValue: value !== undefined ? value : defaultValue,
      onValueChange: (next) => {
        value = next
        onValueChange?.(next)
      },
    })
  )

  let snapshot = $state(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))

  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { label, variant }))

  $effect(() => machine.send({ type: 'SYNC_ITEMS', items }))
  $effect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value })
  })

  // Roving focus moves only when the machine asks (the nonce), never on a re-render.
  let lastFocusNonce = 0
  $effect(() => {
    const { focusNonce, focusValue } = api
    if (focusNonce === 0 || focusNonce === lastFocusNonce || focusValue === null) return
    lastFocusNonce = focusNonce
    untrack(() => focusTab(document, api.ids.tab(focusValue)))
  })
</script>

<div {...rest} {...api.rootProps} {@attach (node) => attachRibbonScrollers(node)}>
  <div {...api.tabListProps}>
    {#each api.items as item (item.value)}
      <div {...api.getTabProps(item)}>
        <span {...api.getTabTextProps()}>{item.label}</span>
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
