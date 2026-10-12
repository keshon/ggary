<script lang="ts">
  import { Menubar as Primitive, mergeProps } from 'bits-ui'
  import type { MenubarMenu, MenubarSelectDetails } from '@ggary/core/menubar'
  import { attachMenubarKeys, matchesMnemonic, parseMnemonic } from '@ggary/core'
  import { tick } from 'svelte'
  import { getConfig } from '../config-provider/context'
  import { focusLastMenuItem } from '../menu/bits-policy'
  import BitsMenuItems from '../menu/BitsMenuItems.svelte'
  type Props = { menus: MenubarMenu[]; onSelect?: (value: string, details: MenubarSelectDetails) => void; onOpenChange?: (menu: string | null) => void; label?: string; mnemonics?: boolean; closeOnSelect?: boolean }
  let { menus, onSelect, onOpenChange, label, mnemonics = false, closeOnSelect = true }: Props = $props()
  const componentId = $props.id()
  const id = `gg-bits-menubar-${componentId}`
  const kit = getConfig()
  let opened = $state<string | null>(null)
  let focusVersion = 0
  let focusFirst = false
  let underlined = $state(false)
  let root = $state<HTMLElement | null>(null)
  let dir = $state<'ltr' | 'rtl'>('ltr')
  let inheritedStyle = $state('')
  const part = (name: string) => ({ 'data-scope': 'menubar', 'data-part': name, 'data-backend': 'bits-ui' })
  const menuPart = (name: string) => ({ 'data-scope': 'menu', 'data-part': name, 'data-backend': 'bits-ui' })
  function changed(next: string | null) { if (opened === next) return; focusVersion++; opened = next; onOpenChange?.(next) }
  $effect(() => { if (opened !== null && !menus.some(menu => menu.value === opened && !menu.disabled)) changed(null) })
  $effect(() => {
    if (!root) return
    const computed = getComputedStyle(root)
    const vars: string[] = []
    for (let i = 0; i < computed.length; i++) { const key = computed[i]; if (key.startsWith('--')) vars.push(`${key}:${computed.getPropertyValue(key)}`) }
    dir = kit().dir ?? (computed.direction === 'rtl' ? 'rtl' : 'ltr')
    inheritedStyle = `direction:${dir};${vars.join(';')}`
  })
  $effect(() => {
    if (!mnemonics) { underlined = false; return }
    return attachMenubarKeys(document, {
      onShowMnemonics: show => underlined = show,
      onMnemonic: (key, code) => {
        const menu = menus.find(menu => !menu.disabled && matchesMnemonic(parseMnemonic(menu.label).key, key, code))
        if (!menu) return false
        const button = document.getElementById(`${id}-${menu.value}-trigger`)
        if (opened === menu.value) document.getElementById(`${id}-${menu.value}-content`)?.querySelector<HTMLElement>('[role^="menuitem"]:not([aria-disabled="true"])')?.focus()
        else { button?.focus(); changed(menu.value); void tick().then(() => document.getElementById(`${id}-${menu.value}-content`)?.querySelector<HTMLElement>('[role^="menuitem"]:not([aria-disabled="true"])')?.focus()) }
        return true
      },
      onFocusBar: () => { focusFirst = opened !== null; changed(null); underlined = true; root?.querySelector<HTMLElement>('[data-part="item"]:not([disabled])')?.focus() },
    })
  })
</script>
<Primitive.Root bind:ref={root} bind:value={() => opened === null ? '' : `gg:${opened}`, next => changed(next ? next.slice(3) : null)} {dir} loop {...part('root')} {id} aria-label={label} data-mnemonics={underlined ? '' : undefined}>
  {#each menus as menu (menu.value)}
    {@const text = parseMnemonic(menu.label)}
    <Primitive.Menu value={`gg:${menu.value}`}>
      <Primitive.Trigger {...part('item')} id={`${id}-${menu.value}-trigger`} disabled={menu.disabled} aria-disabled={menu.disabled ? 'true' : undefined} onkeydown={event => { if (event.key === 'ArrowUp' && opened === null && !menu.disabled) { event.preventDefault(); changed(menu.value); const version = focusVersion; void focusLastMenuItem(`${id}-${menu.value}-content`, () => opened === menu.value && version === focusVersion) } }} aria-keyshortcuts={mnemonics && text.key ? `Alt+${text.key.toUpperCase()}` : undefined}>
        <span {...part('item-text')}>{text.text.slice(0, text.index < 0 ? text.text.length : text.index)}{#if text.index >= 0}<span {...part('mnemonic')}>{text.key}</span>{text.text.slice(text.index + 1)}{/if}</span>
      </Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content id={`${id}-${menu.value}-content`} strategy="fixed" side="bottom" align="start" sideOffset={4} loop style={inheritedStyle}
          onCloseAutoFocus={event => { if (focusFirst) { event.preventDefault(); focusFirst = false; void tick().then(() => root?.querySelector<HTMLElement>('[data-part="item"]:not([disabled])')?.focus()) } }}
          onkeydown={event => { if (event.key === 'Tab') { event.preventDefault(); changed(null) } }}>
          {#snippet child({ props: contentProps, wrapperProps })}
            <div {...wrapperProps} {...menuPart('positioner')}>
              <div {...mergeProps(contentProps, menuPart('content'), { style: { '--gg-available-width': 'var(--bits-floating-available-width)', '--gg-available-height': 'var(--bits-floating-available-height)' } })}>
                <BitsMenuItems items={menu.items} {closeOnSelect} onSelect={(value, details) => onSelect?.(value, { ...details, menu: menu.value })} onReason={() => {}} onNextMenu={key => document.getElementById(`${id}-${menu.value}-content`)?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))} {dir} {inheritedStyle} />
              </div>
            </div>
          {/snippet}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Menu>
  {/each}
</Primitive.Root>
