<script lang="ts">
  import { Tooltip as Primitive, mergeProps } from 'bits-ui'
  import type { TooltipChangeDetails, TooltipPlacement } from '@ggary/core/tooltip'
  import type { Dict } from '@ggary/core'
  import { onDestroy, untrack, type Snippet } from 'svelte'
  import { getConfig } from '../config-provider/context'

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

  let { content: text, trigger, placement = 'top', openDelay = 500, closeDelay = 150,
    disabled = false, open = $bindable(), defaultOpen = false, onOpenChange }: Props = $props()
  let localOpen = $state(untrack(() => open ?? defaultOpen))
  const shown = $derived(!disabled && (open ?? localOpen))
  let disposed = false
  let reason: TooltipChangeDetails['reason'] = 'api'
  let closeTimer: ReturnType<typeof setTimeout> | undefined
  function cancelClose() { if (closeTimer !== undefined) clearTimeout(closeTimer); closeTimer = undefined }
  function publish(next: boolean) {
    cancelClose()
    if (disposed || next === shown || (next && disabled)) return
    localOpen = next; open = next; onOpenChange?.(next, { reason }); reason = 'api'
  }
  // Bits owns hover/focus and its safe pointer corridor. Retain GGary's explicit
  // closeDelay as a narrow policy extension, not a parallel interaction machine.
  function changed(next: boolean) {
    if (disposed) return
    cancelClose()
    // A late pointer-corridor callback must not hide a newly keyboard-focused tip.
    if (!next && reason !== 'escape' && reason !== 'press' && anchor?.contains(document.activeElement)) return
    if (!next && shown && reason === 'pointer' && closeDelay > 0) {
      closeTimer = setTimeout(() => { reason = 'pointer'; publish(false) }, closeDelay)
    } else publish(next)
  }
  $effect(() => { if (disabled) { cancelClose(); localOpen = false; open = false } })
  onDestroy(() => { disposed = true; cancelClose() })
  const componentId = $props.id()
  const id = `gg-bits-tooltip-${componentId}`
  const kit = getConfig()
  let anchor = $state<HTMLElement | null>(null)
  let inheritedStyle = $state('')
  let inheritedDir = $state<'ltr' | 'rtl'>('ltr')
  const side = $derived(placement.split('-')[0] as 'top' | 'bottom' | 'left' | 'right')
  const align = $derived((placement.split('-')[1] ?? 'center') as 'start' | 'center' | 'end')
  const part = (name: string) => ({ 'data-scope': 'tooltip', 'data-part': name, 'data-backend': 'bits-ui' })
  $effect(() => {
    if (!shown || !anchor) return
    const computed = getComputedStyle(anchor)
    const vars: string[] = []
    for (let i = 0; i < computed.length; i++) { const key = computed[i]; if (key.startsWith('--')) vars.push(`${key}:${computed.getPropertyValue(key)}`) }
    inheritedDir = kit().dir ?? (computed.direction === 'rtl' ? 'rtl' : 'ltr')
    inheritedStyle = `direction:${inheritedDir};${vars.join(';')}`
  })
</script>

<Primitive.Provider delayDuration={openDelay} skipDelayDuration={0} ignoreNonKeyboardFocus={false}>
  <Primitive.Root bind:open={() => shown, changed} {disabled} delayDuration={openDelay}>
    <div {...part('anchor')} bind:this={anchor} style="display:contents">
      <Primitive.Trigger type="button" id={`${id}-trigger`}
        onpointerenter={() => { reason = 'pointer'; cancelClose() }} onpointermove={() => reason = 'pointer'} onpointerleave={() => reason = 'pointer'}
        onfocus={() => { reason = 'focus'; cancelClose() }} onblur={() => reason = 'focus'}
        onpointerdown={() => { reason = 'press'; publish(false) }} onclick={() => reason = 'press'}>
        {#snippet child({ props: triggerProps })}{@render trigger(triggerProps)}{/snippet}
      </Primitive.Trigger>
    </div>
    <Primitive.Portal>
      <Primitive.Content id={`${id}-content`} forceMount {side} {align} sideOffset={6} strategy="fixed" dir={inheritedDir} style={inheritedStyle}
        onEscapeKeydown={() => reason = 'escape'} onpointerenter={() => { reason = 'pointer'; cancelClose() }} onpointerleave={() => reason = 'pointer'}>
        {#snippet child({ props: contentProps, wrapperProps })}
          <div {...wrapperProps} {...part('positioner')} hidden={!shown}>
            <div {...mergeProps(contentProps, part('content'), { style: { '--gg-available-width': 'var(--bits-floating-available-width)' } })} role="tooltip" hidden={!shown} data-state={shown ? 'open' : 'closed'}>
              {#if typeof text === 'string'}{text}{:else}{@render text()}{/if}
            </div>
          </div>
        {/snippet}
      </Primitive.Content>
    </Primitive.Portal>
  </Primitive.Root>
</Primitive.Provider>
