<script lang="ts">
  import { Tabs as Primitive } from 'bits-ui'
  import type { RibbonItem, RibbonVariant } from '@ggary/core/ribbon'
  import { attachRibbonScrollers, uid } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'
  import { getConfig } from '../config-provider/context'
  type Props = {
    items: RibbonItem[]
    /** Bindable: `bind:value`. A one-way `value` works too. */
    value?: string | null
    defaultValue?: string | null
    onValueChange?: (value: string) => void
    /** The tab row's accessible name. */
    label?: string
    /** `strip` for one ruled band, `cards` for a card per group. Default `strip`. */
    variant?: RibbonVariant
    /** The panel for a tab: groups of the kit's own controls. */
    panel?: Snippet<[RibbonItem]>
    /** Render every panel, hidden, rather than the selected one alone. Keeps their state. */
    keepMounted?: boolean
    [key: string]: unknown
  }

  let {
    items,
    value = $bindable(),
    defaultValue,
    onValueChange,
    label,
    variant,
    panel,
    keepMounted = false,
    ...rest
  }: Props = $props()


  const id = uid('gg-ribbon')
  const kit = getConfig()
  untrack(() => { if (value === undefined) value = defaultValue !== undefined ? defaultValue : items.find(item => !item.disabled)?.value ?? null })
  const part = (name: string) => ({ 'data-scope': 'ribbon', 'data-part': name, 'data-backend': 'bits-ui' })
  const itemId = (key: string) => `${id}-${encodeURIComponent(key)}`
  function changed(next: string) { if (next === value) return; value = next; onValueChange?.(next) }
  $effect(() => {
    if (value !== null && !items.some(item => item.value === value && !item.disabled)) {
      const next = items.find(item => !item.disabled)?.value
      if (next !== undefined) changed(next)
      else value = null
    }
  })
</script>

  <Primitive.Root bind:value={() => value === null ? '' : `gg:${value}`, next => { if (next) changed(next.slice(3)) }} loop dir={kit().dir}>
    {#snippet child({ props: primitiveProps })}
    <div {...primitiveProps} {...rest} {...part('root')} {id} data-variant={variant ?? 'strip'} {@attach (node) => attachRibbonScrollers(node)}>
      <Primitive.List {...part('tab-list')} aria-label={label} data-variant={variant ?? 'strip'}>
        {#each items as item (item.value)}
          <Primitive.Trigger {...part('tab')} id={`${itemId(item.value)}-tab`} value={`gg:${item.value}`} disabled={item.disabled} aria-disabled={item.disabled ? 'true' : undefined} data-value={item.value} data-state={value === item.value ? 'active' : 'inactive'}>
            <span {...part('tab-text')}>{item.label}</span>
          </Primitive.Trigger>
        {/each}
      </Primitive.List>
      {#if panel}
        {#each items as item (item.value)}
          <Primitive.Content {...part('panel')} id={`${itemId(item.value)}-panel`} value={`gg:${item.value}`} data-value={item.value} data-state={value === item.value ? 'active' : 'inactive'}>
            {#if keepMounted || value === item.value}{@render panel(item)}{/if}
          </Primitive.Content>
        {/each}
      {/if}
    </div>
    {/snippet}
  </Primitive.Root>
