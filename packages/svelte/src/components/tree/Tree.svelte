<script lang="ts">
  import { connect, createTreeMachine, type TreeNode, type TreeSelectionMode } from '@ggary/core/tree'
  import { rovingFocus, scrollIntoViewIfNeeded, svelteNormalizer, uid } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'

  type Props = {
    items: TreeNode[]
    /** The tree's accessible name. */
    label: string
    /** Bindable: the chosen nodes. */
    value?: string[]
    defaultValue?: string[]
    onValueChange?: (value: string[]) => void
    /** Bindable: the open branches. */
    expanded?: string[]
    defaultExpanded?: string[]
    onExpandedChange?: (expanded: string[]) => void
    /** `single` (default), `multiple`, or `none` for a tree only walked and opened. */
    selectionMode?: TreeSelectionMode
    disabled?: boolean
    /** Draws a row's text; default the label. An icon before it, a count after. */
    row?: Snippet<[TreeNode]>
  }

  /** Nested items, a branch opened in place. */
  let {
    items,
    label,
    value = $bindable(),
    defaultValue,
    onValueChange,
    expanded = $bindable(),
    defaultExpanded,
    onExpandedChange,
    selectionMode,
    disabled,
    row,
  }: Props = $props()

  const machine = untrack(() =>
    createTreeMachine({
      id: uid('gg-tree'),
      items,
      defaultValue: value !== undefined ? value : defaultValue,
      defaultExpanded: expanded !== undefined ? expanded : defaultExpanded,
      selectionMode,
      disabled,
      onValueChange: (next) => {
        value = next
        onValueChange?.(next)
      },
      onExpandedChange: (next) => {
        expanded = next
        onExpandedChange?.(next)
      },
    })
  )
  let snapshot = $state.raw(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))
  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { label }))

  $effect(() => machine.send({ type: 'SYNC_ITEMS', items }))
  $effect(() => machine.send({ type: 'SYNC_OPTIONS', selectionMode, disabled }))
  $effect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value })
  })
  $effect(() => {
    if (expanded !== undefined) machine.send({ type: 'SYNC_EXPANDED', expanded })
  })

  let rootEl = $state<HTMLDivElement | null>(null)
  let lastFocusNonce = 0
  $effect(() => {
    const { focusNonce, focusValue } = api
    if (focusNonce === 0 || focusNonce === lastFocusNonce || focusValue === null) return
    lastFocusNonce = focusNonce
    untrack(() => {
      const itemId = api.ids.item(focusValue)
      rovingFocus(document, itemId)
      scrollIntoViewIfNeeded(document.getElementById(itemId), rootEl)
    })
  })
</script>

<div bind:this={rootEl} {...api.rootProps}>
  {#each api.rows as entry (entry.node.value)}
    <div {...api.getItemProps(entry)}>
      <span {...api.getToggleProps(entry)}></span>
      <span {...api.itemTextProps}>{#if row}{@render row(entry.node)}{:else}{entry.node.label}{/if}</span>
      {#if snapshot.selectionMode === 'multiple'}<span {...api.itemIndicatorProps}></span>{/if}
    </div>
  {/each}
</div>
