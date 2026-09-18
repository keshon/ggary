<script lang="ts">
  import { connect, createAccordionMachine, findableContent, type AccordionItem } from '@ggary/core/accordion'
  import { rovingFocus, svelteNormalizer, uid } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'

  type Props = {
    items: AccordionItem[]
    /** The section under an item. */
    panel: Snippet<[AccordionItem]>
    /** Bindable: the open sections. */
    value?: string[]
    defaultValue?: string[]
    onValueChange?: (value: string[]) => void
    /** Several sections may stand open. Default false. */
    multiple?: boolean
    /** The open section may be closed, leaving none. Default true. */
    collapsible?: boolean
    disabled?: boolean
    /** The heading level of each section's button. Default 3. */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
    /** Keep a closed section's content in the page, hidden. Default true: find-in-page searches it. */
    keepMounted?: boolean
  }

  /** Headings that show and hide the section under each. */
  let { items, panel, value = $bindable(), defaultValue, onValueChange, multiple, collapsible, disabled, headingLevel, keepMounted = true }: Props = $props()

  const machine = untrack(() =>
    createAccordionMachine({
      id: uid('gg-accordion'),
      items,
      defaultValue: value !== undefined ? value : defaultValue,
      multiple,
      collapsible,
      disabled,
      onValueChange: (next) => {
        value = next
        onValueChange?.(next)
      },
    })
  )
  let snapshot = $state.raw(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))
  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { headingLevel }))

  $effect(() => machine.send({ type: 'SYNC_ITEMS', items }))
  $effect(() => machine.send({ type: 'SYNC_OPTIONS', multiple, collapsible, disabled }))
  $effect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value })
  })

  let lastFocusNonce = 0
  $effect(() => {
    const { focusNonce, focusValue } = api
    if (focusNonce === 0 || focusNonce === lastFocusNonce || focusValue === null) return
    lastFocusNonce = focusNonce
    untrack(() => rovingFocus(document, api.ids.trigger(focusValue)))
  })

  // A closed section stays findable: the browser's find-in-page opens it.
  const contents: Record<string, HTMLElement | null> = $state({})
  $effect(() => {
    const current = api
    const cleanups = current.items.map((item) => findableContent(contents[item.value] ?? null, current.isOpen(item.value), () => current.reveal(item.value)))
    return () => cleanups.forEach((cleanup) => cleanup())
  })
</script>

<div {...api.rootProps}>
  {#each api.items as item (item.value)}
    <div {...api.getItemProps(item)}>
      <div {...api.headingProps}>
        <button {...api.getTriggerProps(item)}>
          <span {...api.getLabelProps(item)}>{item.label}</span>
          {#if item.description}<span {...api.getDescriptionProps(item)}>{item.description}</span>{/if}
          <span {...api.getIndicatorProps(item)}></span>
        </button>
      </div>
      <div bind:this={contents[item.value]} {...api.getContentProps(item)}>
        {#if api.isOpen(item.value) || keepMounted}<div {...api.bodyProps}>{@render panel(item)}</div>{/if}
      </div>
    </div>
  {/each}
</div>
