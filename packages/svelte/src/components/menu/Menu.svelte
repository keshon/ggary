<script lang="ts">
  import { DropdownMenu as Primitive, mergeProps } from 'bits-ui'
  import type { MenuChangeDetails, MenuEntry, MenuPlacement, MenuSelectDetails } from '@ggary/core/menu'
  import type { Dict } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'
  import { getConfig } from '../config-provider/context'
  import { focusLastMenuItem } from './bits-policy'
  import BitsMenuItems from './BitsMenuItems.svelte'
  type Props = { items: MenuEntry[]; trigger: Snippet<[Dict]>; onSelect?: (value: string, details: MenuSelectDetails) => void; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean, details: MenuChangeDetails) => void; placement?: MenuPlacement; closeOnSelect?: boolean; label?: string }
  let { items, trigger, onSelect, open = $bindable(), defaultOpen = false, onOpenChange, placement = 'bottom-start', closeOnSelect = true, label }: Props = $props()
  let localOpen = $state(untrack(() => open ?? defaultOpen))
  const shown = $derived(open ?? localOpen)
  let focusVersion = 0
  let reason: MenuChangeDetails['reason'] = 'api'
  function changed(next: boolean) { focusVersion++; localOpen = next; open = next; onOpenChange?.(next, { reason }); reason = 'api' }
  const componentId = $props.id()
  const id = `gg-bits-menu-${componentId}`
  const kit = getConfig()
  let anchor = $state<HTMLElement | null>(null)
  let inheritedStyle = $state('')
  let dir = $state<'ltr' | 'rtl'>('ltr')
  const side = $derived(placement.split('-')[0] as 'top' | 'bottom' | 'left' | 'right')
  const align = $derived((placement.split('-')[1] ?? 'center') as 'start' | 'center' | 'end')
  const part = (name: string) => ({ 'data-scope': 'menu', 'data-part': name, 'data-backend': 'bits-ui' })
  $effect(() => {
    if (!shown || !anchor) return
    const computed = getComputedStyle(anchor)
    const vars: string[] = []
    for (let i = 0; i < computed.length; i++) { const key = computed[i]; if (key.startsWith('--')) vars.push(`${key}:${computed.getPropertyValue(key)}`) }
    dir = kit().dir ?? (computed.direction === 'rtl' ? 'rtl' : 'ltr')
    inheritedStyle = `direction:${dir};${vars.join(';')}`
  })
</script>
<Primitive.Root bind:open={() => shown, changed} {dir}>
  <div {...part('anchor')} bind:this={anchor} style="display:contents">
    <Primitive.Trigger id={`${id}-trigger`} type="button" onpointerdown={() => reason = 'trigger'} onpointerup={() => reason = 'trigger'} onclick={() => reason = 'trigger'} onkeydown={event => { reason = 'trigger'; if (event.key === 'ArrowUp' && !shown) { event.preventDefault(); changed(true); const version = focusVersion; void focusLastMenuItem(`${id}-content`, () => shown && version === focusVersion) } }}>
      {#snippet child({ props: triggerProps })}{@render trigger(triggerProps)}{/snippet}
    </Primitive.Trigger>
  </div>
  <Primitive.Portal>
    <Primitive.Content id={`${id}-content`} {side} {align} sideOffset={4} strategy="fixed" loop preventScroll={false} style={inheritedStyle}
      aria-label={label} aria-labelledby={label ? undefined : `${id}-trigger`}
      onEscapeKeydown={() => reason = 'escape'} onInteractOutside={() => reason = 'outside'}
      onkeydown={event => { if (event.key === 'Tab') { event.preventDefault(); reason = 'tab'; changed(false) } }}>
      {#snippet child({ props: contentProps, wrapperProps })}
        <div {...wrapperProps} {...part('positioner')}>
          <div {...mergeProps(contentProps, part('content'), { style: { '--gg-available-width': 'var(--bits-floating-available-width)', '--gg-available-height': 'var(--bits-floating-available-height)' } })}>
            <BitsMenuItems {items} {closeOnSelect} {onSelect} onReason={() => reason = 'select'} {dir} {inheritedStyle} />
          </div>
        </div>
      {/snippet}
    </Primitive.Content>
  </Primitive.Portal>
</Primitive.Root>
