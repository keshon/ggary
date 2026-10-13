<script lang="ts">
  import { Accordion as Primitive } from 'bits-ui'
  import type { AccordionItem } from '@ggary/core/accordion'
  import { untrack, type Snippet } from 'svelte'
  type Props = { items: AccordionItem[]; panel: Snippet<[AccordionItem]>; value?: string[]; defaultValue?: string[]; onValueChange?: (value: string[]) => void; multiple?: boolean; collapsible?: boolean; disabled?: boolean; headingLevel?: 1 | 2 | 3 | 4 | 5 | 6; keepMounted?: boolean }
  let { items, panel, value = $bindable(), defaultValue = [], onValueChange, multiple = false, collapsible = true, disabled = false, headingLevel = 3, keepMounted = true }: Props = $props()
  let localValue = $state(untrack(() => value ?? defaultValue))
  const selected = $derived((value ?? localValue).filter(key => items.some(item => item.value === key)).slice(0, multiple ? undefined : 1))
  function changed(next: string[]) {
    if (!multiple && !collapsible && selected.length && !next.length) return
    localValue = next; value = next; onValueChange?.(next)
  }
  const componentId = $props.id()
  const id = `gg-bits-accordion-${componentId}`
  const itemId = (key: string) => `${id}-${encodeURIComponent(key)}`
  const part = (name: string) => ({ 'data-scope': 'accordion', 'data-part': name, 'data-backend': 'bits-ui' })
</script>
{#snippet body()}
  {#each items as item (item.value)}
    {@const shown = selected.includes(item.value)}
    <Primitive.Item {...part('item')} value={`gg:${item.value}`} disabled={item.disabled} data-value={item.value} data-state={shown ? 'open' : 'closed'}>
      <Primitive.Header {...part('heading')} level={headingLevel}>
        <Primitive.Trigger {...part('trigger')} id={`${itemId(item.value)}-trigger`} aria-labelledby={`${itemId(item.value)}-label`} aria-describedby={item.description ? `${itemId(item.value)}-description` : undefined} aria-disabled={disabled || item.disabled || (shown && !multiple && !collapsible) ? 'true' : undefined} data-state={shown ? 'open' : 'closed'}>
          {#snippet child({ props: triggerProps })}
            <button {...triggerProps} aria-controls={`${itemId(item.value)}-content`} aria-disabled={disabled || item.disabled || (shown && !multiple && !collapsible) ? 'true' : undefined}>
          <span {...part('label')} id={`${itemId(item.value)}-label`}>{item.label}</span>
          {#if item.description}<span {...part('description')} id={`${itemId(item.value)}-description`}>{item.description}</span>{/if}
          <span {...part('indicator')} data-icon="chevron-down" aria-hidden="true" data-state={shown ? 'open' : 'closed'}></span>
            </button>
          {/snippet}
        </Primitive.Trigger>
      </Primitive.Header>
      <Primitive.Content {...part('content')} id={`${itemId(item.value)}-content`} hiddenUntilFound={keepMounted} forceMount={keepMounted} role={items.length <= 6 ? 'region' : undefined} aria-labelledby={items.length <= 6 ? `${itemId(item.value)}-trigger` : undefined} data-state={shown ? 'open' : 'closed'}>
        {#if shown || keepMounted}<div {...part('body')}>{@render panel(item)}</div>{/if}
      </Primitive.Content>
    </Primitive.Item>
  {/each}
{/snippet}
{#if multiple}
  <Primitive.Root {...part('root')} type="multiple" {disabled} loop bind:value={() => selected.map(key => `gg:${key}`), next => changed(next.map(key => key.slice(3)))}>{@render body()}</Primitive.Root>
{:else}
  <Primitive.Root {...part('root')} type="single" {disabled} loop bind:value={() => selected.length ? `gg:${selected[0]}` : '', next => changed(next ? [next.slice(3)] : [])}>{@render body()}</Primitive.Root>
{/if}
