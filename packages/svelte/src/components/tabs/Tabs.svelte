<script lang="ts">
  import { Tabs as Primitive } from 'bits-ui'
  import type { ControlSize } from '@ggary/core'
  import type { TabItem, TabsActivation, TabsOrientation, TabsVariant } from '@ggary/core/tabs'
  import { untrack, type Snippet } from 'svelte'
  import { getConfig } from '../config-provider/context'
  type Props = { size?: ControlSize; items: TabItem[]; value?: string | null; defaultValue?: string | null; onValueChange?: (value: string) => void; onClose?: (value: string) => void; label?: string; orientation?: TabsOrientation; activation?: TabsActivation; variant?: TabsVariant; panel?: Snippet<[TabItem]>; keepMounted?: boolean; closeLabel?: (label: string) => string }
  let { size: ownSize, items, value = $bindable(), defaultValue, onValueChange, onClose, label, orientation = 'horizontal', activation = 'automatic', variant = 'sections', panel, keepMounted = false, closeLabel = text => `Close ${text}` }: Props = $props()
  const kit = getConfig()
  const size = $derived(ownSize ?? kit().size)
  const componentId = $props.id()
  const id = `gg-bits-tabs-${componentId}`
  const itemId = (key: string) => `${id}-${encodeURIComponent(key)}`
  const part = (name: string) => ({ 'data-scope': 'tabs', 'data-part': name, 'data-backend': 'bits-ui' })
  let localValue = $state<string | null>(untrack(() => value !== undefined ? value : defaultValue !== undefined ? defaultValue : items.find(item => !item.disabled)?.value ?? null))
  const selected = $derived(value === undefined ? localValue : value)
  function changed(next: string) { if (next === selected) return; localValue = next; value = next; onValueChange?.(next) }
  let root = $state<HTMLElement | null>(null)
  let pendingClose: { value: string; next?: string; focused: boolean } | null = null
  function close(item: TabItem) {
    if (item.disabled || !item.closable) return
    const index = items.indexOf(item)
    const next = items.slice(index + 1).find(item => !item.disabled) ?? items.slice(0, index).reverse().find(item => !item.disabled)
    pendingClose = { value: item.value, next: next?.value, focused: document.activeElement?.id === `${itemId(item.value)}-tab` }
    onClose?.(item.value)
  }
  $effect(() => {
    if (selected !== null && !items.some(item => item.value === selected && !item.disabled)) {
      const next = pendingClose?.next ?? items.find(item => !item.disabled)?.value
      if (next !== undefined) changed(next)
      else { localValue = null; value = null }
    }
    if (pendingClose && !items.some(item => item.value === pendingClose!.value)) {
      const pending = pendingClose; pendingClose = null
      if (pending.focused && pending.next !== undefined) document.getElementById(`${itemId(pending.next)}-tab`)?.focus()
    }
  })
</script>
<Primitive.Root bind:ref={root} {...part('root')} bind:value={() => selected === null ? '' : `gg:${selected}`, next => { if (next) changed(next.slice(3)) }} {orientation} activationMode={activation} loop data-size={size} data-variant={variant} dir={kit().dir}>
  <Primitive.List {...part('list')} aria-label={label} data-variant={variant}>
    {#each items as item (item.value)}
      <Primitive.Trigger id={`${itemId(item.value)}-tab`} {...part('tab')} value={`gg:${item.value}`} disabled={item.disabled} aria-disabled={item.disabled ? 'true' : undefined}
        data-value={item.value} data-state={selected === item.value ? 'active' : 'inactive'} data-closable={item.closable ? '' : undefined} data-modified={item.modified ? '' : undefined}
        onkeydown={event => { if (event.key === 'Delete' && item.closable && !item.disabled) { event.preventDefault(); close(item) } }}
        onauxclick={event => { if (event.button === 1) { event.preventDefault(); close(item) } }}>
        {#snippet child({ props: triggerProps })}
          <div {...triggerProps}>
            <span {...part('tab-text')}>{item.label}</span>
            {#if item.closable}<button {...part('close')} type="button" tabindex={-1} disabled={item.disabled} aria-label={closeLabel(item.label)} onpointerdown={event => event.preventDefault()} onclick={event => { event.stopPropagation(); close(item) }}><span {...part('close-icon')} data-icon="close" aria-hidden="true"></span></button>{/if}
          </div>
        {/snippet}
      </Primitive.Trigger>
    {/each}
  </Primitive.List>
  {#if panel}
    {#each items as item (item.value)}
      <Primitive.Content {...part('panel')} id={`${itemId(item.value)}-panel`} value={`gg:${item.value}`} data-value={item.value} data-state={selected === item.value ? 'active' : 'inactive'}>
        {#if keepMounted || selected === item.value}{@render panel(item)}{/if}
      </Primitive.Content>
    {/each}
  {/if}
</Primitive.Root>
