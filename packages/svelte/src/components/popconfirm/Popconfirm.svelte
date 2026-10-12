<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { connect, createPopconfirmMachine, type PopconfirmChangeDetails, type PopconfirmWords } from '@ggary/core/popconfirm'
  import { svelteNormalizer, uid, type Dict, type Placement } from '@ggary/core'
  import { tick, untrack, type Snippet } from 'svelte'
  import { Popover as Primitive, mergeProps } from 'bits-ui'
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

  let anchor = $state<HTMLElement | null>(null)
  let inheritedStyle = $state('')
  let dir = $state<'ltr' | 'rtl'>('ltr')
  let reason: 'trigger' | 'escape' | 'outside' = 'trigger'
  const part = (name: string) => ({ 'data-scope': 'popconfirm', 'data-part': name, 'data-backend': 'bits-ui' })
  const side = $derived(snapshot.placement.split('-')[0] as 'top' | 'bottom' | 'left' | 'right')
  const align = $derived((snapshot.placement.split('-')[1] ?? 'center') as 'start' | 'center' | 'end')
  const contentProps = $derived.by(() => { const { popover, ...props } = api.contentProps; return props })
  $effect(() => {
    if (!isOpen || !anchor) return
    const computed = getComputedStyle(anchor)
    const vars: string[] = []
    for (let i = 0; i < computed.length; i++) { const key = computed[i]; if (key.startsWith('--')) vars.push(`${key}:${computed.getPropertyValue(key)}`) }
    dir = kit().dir ?? (computed.direction === 'rtl' ? 'rtl' : 'ltr')
    inheritedStyle = `direction:${dir};${vars.join(';')}`
  })
</script>
<Primitive.Root bind:open={() => isOpen, next => machine.send(next ? { type: 'OPEN', reason: 'trigger' } : { type: 'CLOSE', reason })}>
  <div {...part('anchor')} bind:this={anchor} style="display:contents">
    <Primitive.Trigger id={api.ids.trigger} type="button" onclick={() => reason = 'trigger'} onkeydown={() => reason = 'trigger'}>
      {#snippet child({ props: triggerProps })}{@render trigger(triggerProps)}{/snippet}
    </Primitive.Trigger>
  </div>
  <Primitive.Portal>
    <Primitive.Content id={api.ids.content} {side} {align} sideOffset={6} strategy="fixed" {dir} style={inheritedStyle} trapFocus={false} preventScroll={false}
      onEscapeKeydown={() => reason = 'escape'} onInteractOutside={() => reason = 'outside'}
      onOpenAutoFocus={event => { event.preventDefault(); void tick().then(() => document.getElementById(api.ids.content)?.querySelector<HTMLElement>('[data-autofocus]')?.focus()) }}>
      {#snippet child({ props: primitiveProps, wrapperProps })}
        <div {...wrapperProps} {...part('positioner')}>
          <div {...mergeProps(primitiveProps, contentProps, { 'data-backend': 'bits-ui' })}>
            <p {...api.titleProps}>{title}</p>
            {#if description != null}<p {...api.descriptionProps}>{description}</p>{/if}
            {#if api.failed}<p {...api.errorProps}>{api.errorText}</p>{/if}
            <div {...api.actionsProps}>
              <Button size="sm" emphasis="medium" {...api.cancelProps}>{api.cancelText}</Button>
              <Button size="sm" emphasis="high" destructive={api.destructive} loading={api.pending} {...api.confirmProps}>{api.confirmText}</Button>
            </div>
          </div>
        </div>
      {/snippet}
    </Primitive.Content>
  </Primitive.Portal>
</Primitive.Root>
