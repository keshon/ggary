<script lang="ts">
  import { connect, createPopoverMachine, type PopoverChangeDetails, type PopoverPlacement } from '@ggary/core/popover'
  import { attachPopover, svelteNormalizer, uid, type AttachedPopover, type Dict } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'

  type Props = {
    /** Bindable: `bind:open`. */
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean, details: PopoverChangeDetails) => void
    /** The anchor and opener: `{#snippet trigger(props)}<Button {...props}>…</Button>{/snippet}` */
    trigger: Snippet<[Dict]>
    title?: string
    /** The content. Rendered only while open. */
    children?: Snippet
    placement?: PopoverPlacement
    closeOnEscape?: boolean
    closeOnOutside?: boolean
    closeButton?: boolean
    closeLabel?: string
  }

  let {
    open = $bindable(),
    defaultOpen,
    onOpenChange,
    trigger,
    title,
    children,
    placement,
    closeOnEscape,
    closeOnOutside,
    closeButton = false,
    closeLabel,
  }: Props = $props()

  const id = uid('gg-popover')

  // As Dialog: uncontrolled at heart, as `bind:open` is.
  const machine = untrack(() =>
    createPopoverMachine({
      id,
      defaultOpen: open ?? defaultOpen,
      placement,
      closeOnEscape,
      closeOnOutside,
      onOpenChange: (next, details) => {
        open = next
        onOpenChange?.(next, details)
      },
    })
  )

  let snapshot = $state(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))
  // Effects that attach on open read this, not the snapshot: a new snapshot on every
  // change would detach and attach them again on each key.
  const isOpen = $derived(snapshot.open)

  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { title: title != null, closeLabel }))

  $effect(() => {
    if (open !== undefined) machine.send({ type: 'SYNC_OPEN', open })
  })
  $effect(() => machine.send({ type: 'SYNC_OPTIONS', placement, closeOnEscape, closeOnOutside }))

  let content: HTMLDivElement
  let attached: AttachedPopover | null = null

  $effect(() => {
    if (!isOpen) return
    const instance = untrack(() => {
      const reference = document.getElementById(api.ids.trigger)
      if (!reference) return null
      const { placement, closeOnEscape, closeOnOutside } = machine.getState()
      return attachPopover(reference, content, {
        placement,
        gutter: 6,
        closeOnEscape,
        closeOnOutside,
        manageFocus: true,
        onDismiss: (reason) => machine.send({ type: 'CLOSE', reason }),
      })
    })
    attached = instance
    return () => {
      instance?.destroy()
      attached = null
    }
  })

  $effect(() => {
    const options = { placement: snapshot.placement, closeOnEscape: snapshot.closeOnEscape, closeOnOutside: snapshot.closeOnOutside }
    untrack(() => attached?.update(options))
  })
</script>

{@render trigger(api.triggerProps)}
<div bind:this={content} {...api.contentProps}>
  {#if snapshot.open}
    {#if title != null}
      <h2 {...api.titleProps}>{title}</h2>
    {/if}
    {#if closeButton}
      <button {...api.closeProps}><span {...api.closeIconProps}></span></button>
    {/if}
    {@render children?.()}
  {/if}
</div>
