<script lang="ts">
  import { ContextMenu as Primitive, mergeProps } from 'bits-ui'
  import type { MenuEntry, MenuSelectDetails } from '@ggary/core/menu'
  import type { Dict } from '@ggary/core'
  import { tick, type Snippet } from 'svelte'
  import { getConfig } from '../config-provider/context'
  import BitsMenuItems from '../menu/BitsMenuItems.svelte'
  type Props = { items: MenuEntry[]; onSelect?: (value: string, details: MenuSelectDetails) => void; trigger: Snippet<[Dict]>; label?: string; closeOnSelect?: boolean }
  let { items, onSelect, trigger, label = 'Actions', closeOnSelect = true }: Props = $props()
  let shown = $state(false)
  let keyboardOpen = false
  let target = $state<HTMLElement | null>(null)
  const kit = getConfig()
  let inheritedStyle = $state('')
  let dir = $state<'ltr' | 'rtl'>('ltr')
  const part = (name: string) => ({ 'data-scope': 'menu', 'data-part': name, 'data-backend': 'bits-ui' })
  const componentId = $props.id()
  const id = `gg-bits-context-menu-${componentId}`
  function keyboard(event: KeyboardEvent) {
    if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) return
    event.preventDefault()
    keyboardOpen = true
    const element = event.currentTarget as HTMLElement
    const rect = element.getBoundingClientRect()
    // The platform normally emits contextmenu for this key. Forward explicitly
    // for consistent support, using Bits' pointer anchor and opening behavior.
    element.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: dir === 'rtl' ? rect.right : rect.left, clientY: rect.bottom }))
  }
  $effect(() => {
    if (!shown || !target) return
    const computed = getComputedStyle(target)
    const vars: string[] = []
    for (let i = 0; i < computed.length; i++) { const key = computed[i]; if (key.startsWith('--')) vars.push(`${key}:${computed.getPropertyValue(key)}`) }
    dir = kit().dir ?? (computed.direction === 'rtl' ? 'rtl' : 'ltr')
    inheritedStyle = `direction:${dir};${vars.join(';')}`
  })
</script>
<Primitive.Root bind:open={shown} {dir}>
  <Primitive.Trigger bind:ref={target} id={`${id}-trigger`} tabindex={0} onkeydown={keyboard} data-context-menu={shown ? 'open' : 'closed'} aria-keyshortcuts="Shift+F10">
    {#snippet child({ props: triggerProps })}{@render trigger({ ...triggerProps, oncontextmenu: (event: MouseEvent) => { if (!event.shiftKey) (triggerProps.oncontextmenu as (event: MouseEvent) => void)(event) } })}{/snippet}
  </Primitive.Trigger>
  <Primitive.Portal>
    <Primitive.Content id={`${id}-content`} aria-label={label} strategy="fixed" loop preventScroll={false} style={inheritedStyle}
      onOpenAutoFocus={event => { if (keyboardOpen) { keyboardOpen = false; event.preventDefault(); void tick().then(() => document.getElementById(`${id}-content`)?.querySelector<HTMLElement>('[role^="menuitem"]:not([aria-disabled="true"])')?.focus()) } }}
      onkeydown={event => { if (event.key === 'Tab') { event.preventDefault(); shown = false } }}>
      {#snippet child({ props: contentProps, wrapperProps })}
        <div {...wrapperProps} {...part('positioner')}>
          <div {...mergeProps(contentProps, part('content'), { style: { '--gg-available-width': 'var(--bits-floating-available-width)', '--gg-available-height': 'var(--bits-floating-available-height)' } })}>
            <BitsMenuItems {items} {closeOnSelect} {onSelect} onReason={() => {}} {dir} {inheritedStyle} />
          </div>
        </div>
      {/snippet}
    </Primitive.Content>
  </Primitive.Portal>
</Primitive.Root>
