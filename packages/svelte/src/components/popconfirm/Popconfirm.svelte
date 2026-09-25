<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { connect, createPopconfirmMachine, type PopconfirmChangeDetails, type PopconfirmWords } from '@ggary/core/popconfirm'
  import { attachPopover, svelteNormalizer, uid, type AttachedPopover, type Dict, type Placement } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'
  import Button from '../button/Button.svelte'

  type Props = {
    /** The question: "Delete this lead?" */
    title: string
    /** What follows if the answer is yes: "Its history goes with it." */
    description?: string
    /** The action destroys: its answer is drawn so, and the focus lands on Cancel. */
    destructive?: boolean
    /** The action's answer, named for the action: "Delete". Default "Confirm". */
    confirmLabel?: string
    cancelLabel?: string
    /** The action. A promise keeps the question open, busy, until it settles; a rejection's message is shown. */
    onConfirm?: () => unknown
    /** It closed any way but by the action. */
    onCancel?: () => void
    onOpenChange?: (open: boolean, details: PopconfirmChangeDetails) => void
    /** Opens with the page: the question already asked. */
    defaultOpen?: boolean
    /** The opener: spread the props onto a Button. */
    trigger: Snippet<[Dict]>
    placement?: Placement
    words?: Pick<PopconfirmWords, 'failed'>
  }

  let { title, description, destructive = false, confirmLabel, cancelLabel, onConfirm, onCancel, onOpenChange, defaultOpen, trigger, placement, words: ownWords }: Props = $props()
  const kit = getConfig()
  const words = $derived(configWords(kit(), 'popconfirm', ownWords))

  const machine = untrack(() =>
    createPopconfirmMachine({
      id: uid('gg-popconfirm'),
      placement,
      defaultOpen,
      onConfirm: () => onConfirm?.(),
      onCancel: () => onCancel?.(),
      onOpenChange: (open, details) => onOpenChange?.(open, details),
    })
  )
  let snapshot = $state(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))
  const isOpen = $derived(snapshot.open)

  const api = $derived(
    connect(snapshot, machine.send, svelteNormalizer, {
      destructive,
      description: description != null,
      words: { confirm: confirmLabel, cancel: cancelLabel, failed: words?.failed },
    })
  )

  $effect(() => machine.send({ type: 'SYNC_OPTIONS', placement }))

  let content: HTMLDivElement
  let attached: AttachedPopover | null = null

  $effect(() => {
    if (!isOpen) return
    const instance = untrack(() => {
      const reference = document.getElementById(api.ids.trigger)
      if (!reference) return null
      return attachPopover(reference, content, {
        placement: machine.getState().placement,
        gutter: 6,
        manageFocus: true,
        onDismiss: (reason) => api.dismiss(reason),
      })
    })
    attached = instance
    return () => {
      instance?.destroy()
      attached = null
    }
  })

  $effect(() => {
    const options = { placement: snapshot.placement }
    untrack(() => attached?.update(options))
  })
</script>

{@render trigger(api.triggerProps)}
<div bind:this={content} {...api.contentProps}>
  {#if snapshot.open}
    <p {...api.titleProps}>{title}</p>
    {#if description != null}<p {...api.descriptionProps}>{description}</p>{/if}
    {#if api.failed}<p {...api.errorProps}>{api.errorText}</p>{/if}
    <div {...api.actionsProps}>
      <Button size="sm" emphasis="medium" {...api.cancelProps}>{api.cancelText}</Button>
      <Button size="sm" emphasis="high" destructive={api.destructive} loading={api.pending} {...api.confirmProps}>{api.confirmText}</Button>
    </div>
  {/if}
</div>
