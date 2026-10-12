<script lang="ts">
  import { Popover as Primitive, mergeProps } from 'bits-ui'
  import type { PopoverChangeDetails, PopoverPlacement } from '@ggary/core/popover'
  import type { Dict } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'
  import { getConfig } from '../config-provider/context'

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

  let { open = $bindable(), defaultOpen = false, onOpenChange, trigger, title,
    children, placement = 'bottom-start', closeOnEscape = true, closeOnOutside = true,
    closeButton = false, closeLabel = 'Close' }: Props = $props()
  let localOpen = $state(untrack(() => open ?? defaultOpen))
  const shown = $derived(open ?? localOpen)
  let reason: PopoverChangeDetails['reason'] = 'api'
  function changed(next: boolean) {
    localOpen = next; open = next; onOpenChange?.(next, { reason }); reason = 'api'
  }
  const componentId = $props.id()
  const id = `gg-bits-popover-${componentId}`
  const kit = getConfig()
  let anchor = $state<HTMLElement | null>(null)
  let inheritedStyle = $state('')
  let inheritedDir = $state<'ltr' | 'rtl'>('ltr')
  const side = $derived(placement.split('-')[0] as 'top' | 'bottom' | 'left' | 'right')
  const align = $derived((placement.split('-')[1] ?? 'center') as 'start' | 'center' | 'end')
  const part = (name: string) => ({ 'data-scope': 'popover', 'data-part': name, 'data-backend': 'bits-ui' })
  $effect(() => {
    if (!shown || !anchor) return
    const computed = getComputedStyle(anchor)
    const vars: string[] = []
    for (let i = 0; i < computed.length; i++) { const key = computed[i]; if (key.startsWith('--')) vars.push(`${key}:${computed.getPropertyValue(key)}`) }
    inheritedDir = kit().dir ?? (computed.direction === 'rtl' ? 'rtl' : 'ltr')
    inheritedStyle = `direction:${inheritedDir};${vars.join(';')}`
  })
</script>

<Primitive.Root bind:open={() => shown, changed}>
  <div {...part('anchor')} bind:this={anchor} style="display:contents">
    <Primitive.Trigger type="button" id={`${id}-trigger`} onclick={() => reason = 'trigger'} onkeydown={() => reason = 'trigger'}>
      {#snippet child({ props: triggerProps })}{@render trigger(triggerProps)}{/snippet}
    </Primitive.Trigger>
  </div>
  <Primitive.Portal>
    <Primitive.Content id={`${id}-content`} {side} {align} sideOffset={6} strategy="fixed" dir={inheritedDir} style={inheritedStyle}
      trapFocus={false} preventScroll={false}
      onEscapeKeydown={event => { reason = 'escape'; if (!closeOnEscape) { event.preventDefault(); reason = 'api' } }}
      onInteractOutside={event => { reason = 'outside'; if (!closeOnOutside) { event.preventDefault(); reason = 'api' } }}>
      {#snippet child({ props: contentProps, wrapperProps })}
        <div {...wrapperProps} {...part('positioner')} hidden={!shown}>
          <div {...mergeProps(contentProps, part('content'), { style: { '--gg-available-width': 'var(--bits-floating-available-width)' } })} role="dialog" hidden={!shown} data-state={shown ? 'open' : 'closed'} aria-labelledby={title != null ? `${id}-title` : undefined}>
            {#if shown}
              {#if title != null}<h2 {...part('title')} id={`${id}-title`}>{title}</h2>{/if}
              {#if closeButton}<Primitive.Close {...part('close')} type="button" aria-label={closeLabel} onclick={() => reason = 'close-button'} onkeydown={() => reason = 'close-button'}><span {...part('close-icon')} data-icon="close" aria-hidden="true"></span></Primitive.Close>{/if}
              {@render children?.()}
            {/if}
          </div>
        </div>
      {/snippet}
    </Primitive.Content>
  </Primitive.Portal>
</Primitive.Root>
