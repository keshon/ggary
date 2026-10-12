<script lang="ts">
  import { DropdownMenu as Primitive, mergeProps } from 'bits-ui'
  import type { MenuItem, MenuSelectDetails } from '@ggary/core/menu'
  import type { Snippet } from 'svelte'
  import BitsMenuItems from './BitsMenuItems.svelte'
  type Props = { item: Extract<MenuItem, { type: 'submenu' }>; closeOnSelect: boolean; onSelect?: (value: string, details: MenuSelectDetails) => void; onReason: () => void; onNextMenu?: (key: string) => void; dir: 'ltr' | 'rtl'; inheritedStyle: string; level: number; children: Snippet }
  let { item, closeOnSelect, onSelect, onReason, onNextMenu, dir, inheritedStyle, level, children }: Props = $props()
  let shown = $state(false)
  let trigger = $state<HTMLElement | null>(null)
  const part = (name: string) => ({ 'data-scope': 'menu', 'data-part': name, 'data-backend': 'bits-ui' })
</script>
<Primitive.Sub bind:open={shown}>
  <Primitive.SubTrigger bind:ref={trigger} {...part('item')} disabled={item.disabled} textValue={item.label} data-type="submenu">{@render children()}</Primitive.SubTrigger>
  <Primitive.Portal>
    <Primitive.SubContent strategy="fixed" side={dir === 'rtl' ? 'left' : 'right'} align="start" sideOffset={4} loop style={inheritedStyle} {dir} aria-labelledby={trigger?.id}
      onkeydown={event => { if (onNextMenu && event.key === (dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight') && !(event.target as HTMLElement).hasAttribute('data-menu-sub-trigger')) { event.preventDefault(); event.stopPropagation(); onNextMenu(event.key) } }}
      escapeKeydownBehavior="close" onEscapeKeydown={event => { event.preventDefault(); event.stopPropagation(); shown = false; trigger?.focus() }}>
      {#snippet child({ props: contentProps, wrapperProps })}
        <div {...wrapperProps} {...part('positioner')}>
          <div {...mergeProps(contentProps, part('content'), { style: { '--gg-available-width': 'var(--bits-floating-available-width)', '--gg-available-height': 'var(--bits-floating-available-height)' } })} data-level={level + 1}>
            <BitsMenuItems items={item.items} {closeOnSelect} {onSelect} {onReason} {onNextMenu} {dir} {inheritedStyle} level={level + 1} />
          </div>
        </div>
      {/snippet}
    </Primitive.SubContent>
  </Primitive.Portal>
</Primitive.Sub>
