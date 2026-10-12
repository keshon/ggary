<script lang="ts">
  import { DropdownMenu as Primitive, mergeProps } from 'bits-ui'
  import type { MenuEntry, MenuItem, MenuSelectDetails } from '@ggary/core/menu'
  import BitsMenuItems from './BitsMenuItems.svelte'
  import BitsMenuSub from './BitsMenuSub.svelte'
  type Props = { items: MenuEntry[]; closeOnSelect: boolean; onSelect?: (value: string, details: MenuSelectDetails) => void; onReason: () => void; onNextMenu?: (key: string) => void; dir: 'ltr' | 'rtl'; inheritedStyle: string; level?: number }
  let { items, closeOnSelect, onSelect, onReason, onNextMenu, dir, inheritedStyle, level = 0 }: Props = $props()
  const selected = $derived(items.find(entry => entry.type === 'radio' && entry.checked))
  const part = (name: string) => ({ 'data-scope': 'menu', 'data-part': name, 'data-backend': 'bits-ui' })
  function select(item: MenuSelectDetails['item']) {
    onReason()
    onSelect?.(item.value, item.type === 'checkbox' ? { item, checked: !item.checked } : item.type === 'radio' ? { item, checked: true } : { item })
  }
</script>
{#snippet text(item: MenuItem)}
  <span {...part('item-text')}>{item.label}</span>
  {#if 'shortcut' in item && item.shortcut}<span {...part('item-shortcut')}>{item.shortcut}</span>{/if}
  {#if item.type === 'checkbox' || item.type === 'radio'}<span {...part('item-indicator')} data-state={item.checked ? 'checked' : 'unchecked'} data-icon="check" aria-hidden="true"></span>{/if}
  {#if item.type === 'submenu'}<span {...part('submenu-indicator')} data-icon={dir === 'rtl' ? 'chevron-left' : 'chevron-right'} aria-hidden="true"></span>{/if}
{/snippet}
<Primitive.RadioGroup {...part('group')} bind:value={() => selected && 'value' in selected ? `gg:${selected.value}` : '', () => {}}>
  {#each items as entry, index ('value' in entry ? entry.value : index)}
    {#if entry.type === 'separator'}
      <Primitive.Separator {...part('separator')} />
    {:else if entry.type === 'group'}
      <Primitive.Group {...part('group')}>
        {#if entry.label}<Primitive.GroupHeading {...part('group-label')}>{entry.label}</Primitive.GroupHeading>{/if}
        <BitsMenuItems items={entry.items} {closeOnSelect} {onSelect} {onReason} {onNextMenu} {dir} {inheritedStyle} {level} />
      </Primitive.Group>
    {:else if entry.type === 'submenu'}
      <BitsMenuSub item={entry} {closeOnSelect} {onSelect} {onReason} {onNextMenu} {dir} {inheritedStyle} {level}>
        {#snippet children()}{@render text(entry)}{/snippet}
      </BitsMenuSub>
    {:else if entry.type === 'checkbox'}
      <Primitive.CheckboxItem {...part('item')} disabled={entry.disabled} textValue={entry.label} closeOnSelect={entry.closeOnSelect ?? closeOnSelect}
        bind:checked={() => entry.checked ?? false, () => {}} onSelect={() => select(entry)} data-type="checkbox" data-state={entry.checked ? 'checked' : 'unchecked'}>{@render text(entry)}</Primitive.CheckboxItem>
    {:else if entry.type === 'radio'}
      <Primitive.RadioItem {...part('item')} disabled={entry.disabled} textValue={entry.label} value={`gg:${entry.value}`} closeOnSelect={entry.closeOnSelect ?? closeOnSelect}
        onSelect={() => select(entry)} data-type="radio" data-state={entry.checked ? 'checked' : 'unchecked'}>{@render text(entry)}</Primitive.RadioItem>
    {:else}
      <Primitive.Item {...part('item')} disabled={entry.disabled} textValue={entry.label} closeOnSelect={entry.closeOnSelect ?? closeOnSelect}
        onSelect={() => select(entry)} data-type="item" data-destructive={entry.destructive ? '' : undefined}>
        {#snippet child({ props: itemProps })}
          {#if entry.href}<a {...itemProps} href={entry.href}>{@render text(entry)}</a>{:else}<div {...itemProps}>{@render text(entry)}</div>{/if}
        {/snippet}
      </Primitive.Item>
    {/if}
  {/each}
</Primitive.RadioGroup>
