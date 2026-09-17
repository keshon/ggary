<script lang="ts">
  import { connect, createTooltipMachine, type TooltipChangeDetails, type TooltipPlacement } from '@ggary/core/tooltip'
  import { attachPopover, svelteNormalizer, uid, type Dict } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'

  type Props = {
    /** What the tooltip says. A string, or a snippet for richer text — never controls. */
    content: string | Snippet
    /** The described element: `{#snippet trigger(props)}<Button {...props}>…</Button>{/snippet}` */
    trigger: Snippet<[Dict]>
    placement?: TooltipPlacement
    openDelay?: number
    closeDelay?: number
    disabled?: boolean
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean, details: TooltipChangeDetails) => void
  }

  let {
    content: text,
    trigger,
    placement,
    openDelay,
    closeDelay,
    disabled,
    open = $bindable(),
    defaultOpen,
    onOpenChange,
  }: Props = $props()

  const id = uid('gg-tooltip')

  const machine = untrack(() =>
    createTooltipMachine({
      id,
      defaultOpen: open ?? defaultOpen,
      placement,
      openDelay,
      closeDelay,
      disabled,
      onOpenChange: (next, details) => {
        open = next
        onOpenChange?.(next, details)
      },
    })
  )

  let snapshot = $state(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))

  const api = $derived(connect(snapshot, machine.send, svelteNormalizer))

  $effect(() => {
    if (open !== undefined) machine.send({ type: 'SYNC_OPEN', open })
  })
  $effect(() => machine.send({ type: 'SYNC_OPTIONS', placement, openDelay, closeDelay, disabled }))
  // A timer still pending when the tooltip goes away must not report to an owner that is gone.
  $effect(() => () => machine.send({ type: 'DESTROY' }))

  let content: HTMLDivElement

  $effect(() => {
    if (!snapshot.open) return
    const placement = snapshot.placement
    const instance = untrack(() => {
      const reference = document.querySelector<HTMLElement>(`[aria-describedby~="${api.ids.content}"]`)
      if (!reference) return null
      return attachPopover(reference, content, {
        placement,
        gutter: 6,
        passive: true,
        closeOnOutside: false,
        onDismiss: () => machine.send({ type: 'ESCAPE' }),
      })
    })
    return () => instance?.destroy()
  })
</script>

{@render trigger(api.triggerProps)}
<div bind:this={content} {...api.contentProps}>
  {#if typeof text === 'string'}{text}{:else}{@render text()}{/if}
</div>
