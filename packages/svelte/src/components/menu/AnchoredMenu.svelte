<script lang="ts">
  import { DropdownMenu as Primitive, mergeProps } from 'bits-ui'
  import type { MenuEntry, MenuSelectDetails } from '@ggary/core/menu'
  import type { VirtualElement } from '@ggary/core'
  import { tick } from 'svelte'
  import { getConfig } from '../config-provider/context'
  import BitsMenuItems from './BitsMenuItems.svelte'

  /** Domain controllers supply requests and anchors; Bits owns the menu. */
  type Props = {
    id: string
    open: boolean
    items: MenuEntry[]
    reference: () => HTMLElement | null
    anchor: Element | VirtualElement | null
    label: string
    focus?: 'first' | 'none'
    onClose: () => void
    onSelect: (value: string, details: MenuSelectDetails) => void
  }
  let { id, open, items, reference, anchor, label, focus = 'first', onClose, onSelect }: Props = $props()
  const customAnchor = $derived.by(() => {
    const reference = anchor
    if (!reference) return null
    return {
      getBoundingClientRect: () => DOMRect.fromRect(reference.getBoundingClientRect()),
      contextElement: 'contextElement' in reference ? reference.contextElement : reference,
    }
  })
  const kit = getConfig()
  let inheritedStyle = $state('')
  let dir = $state<'ltr' | 'rtl'>('ltr')
  const part = (name: string) => ({ 'data-scope': 'menu', 'data-part': name, 'data-backend': 'bits-ui' })
  $effect(() => {
    if (!open) return
    const element = reference()
    if (!element) return
    const computed = getComputedStyle(element)
    const vars: string[] = []
    for (let i = 0; i < computed.length; i++) { const key = computed[i]; if (key.startsWith('--')) vars.push(`${key}:${computed.getPropertyValue(key)}`) }
    dir = kit().dir ?? (computed.direction === 'rtl' ? 'rtl' : 'ltr')
    inheritedStyle = `direction:${dir};${vars.join(';')}`
  })
</script>
<Primitive.Root {open} {dir} onOpenChange={next => { if (!next) onClose() }}>
  <Primitive.Portal>
    <Primitive.Content id={`${id}-content`} {customAnchor} strategy="fixed" side="bottom" align="start" sideOffset={4} loop preventScroll={false} style={inheritedStyle} aria-label={label}
      onOpenAutoFocus={event => {
        event.preventDefault()
        void tick().then(() => {
          if (!open) return
          const content = document.getElementById(`${id}-content`)
          const target = focus === 'first' ? content?.querySelector<HTMLElement>('[role^="menuitem"]:not([aria-disabled="true"])') ?? content : content
          target?.focus()
        })
      }}
      onCloseAutoFocus={event => { event.preventDefault(); void tick().then(() => reference()?.focus({ preventScroll: true })) }}
      onkeydown={event => { if (event.key === 'Tab') { event.preventDefault(); onClose() } }}>
      {#snippet child({ props: contentProps, wrapperProps })}
        <div {...wrapperProps} {...part('positioner')}>
          <div {...mergeProps(contentProps, part('content'), { style: { '--gg-available-width': 'var(--bits-floating-available-width)', '--gg-available-height': 'var(--bits-floating-available-height)' } })}>
            <BitsMenuItems {items} closeOnSelect {onSelect} onReason={() => {}} {dir} {inheritedStyle} />
          </div>
        </div>
      {/snippet}
    </Primitive.Content>
  </Primitive.Portal>
</Primitive.Root>
