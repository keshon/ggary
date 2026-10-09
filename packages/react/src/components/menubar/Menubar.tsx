import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Menubar as Primitive } from '@base-ui/react/menubar'
import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import type { MenubarMenu, MenubarSelectDetails } from '@ggary/core/menubar'
import { attachMenubarKeys, matchesMnemonic, parseMnemonic } from '@ggary/core'
import { Surface, Level, type Environment } from '../menu/Menu'
import { useConfig } from '../config-provider'

export interface MenubarProps {
  /** The bar's menus. A label may mark its access key with `&`: `&File`. */
  menus: MenubarMenu[]
  /** Called with the item's value when the user activates it, in any menu at any depth. */
  onSelect?: (value: string, details: MenubarSelectDetails) => void
  /** Called with the value of the menu that opened, or null when the bar closes. */
  onOpenChange?: (menu: string | null) => void
  /** The bar's accessible name, such as "Application". */
  label?: string
  /**
   * Page-wide keys: Alt+key opens a menu by its access key, a held Alt
   * underlines the keys, F10 goes to the bar. Default false.
   */
  mnemonics?: boolean
  /** Close after an item is activated. Default true; an item can override it. */
  closeOnSelect?: boolean
}

const part = (name: string) => ({ 'data-scope': 'menubar', 'data-part': name, 'data-backend': 'base-ui' })

export function Menubar({ menus, onSelect, onOpenChange, label, mnemonics = false, closeOnSelect = true }: MenubarProps) {
  const id = `gg-base-menubar-${useId().replace(/:/g, '')}`
  const config = useConfig()
  const root = useRef<HTMLDivElement>(null)
  const [opened, setOpened] = useState<string | null>(null)
  const current = useRef(opened)
  const [underlined, setUnderlined] = useState(false)
  const focusFirst = useRef(false)
  const request = (next: string | null) => {
    if (current.current === next) return
    current.current = next; setOpened(next); onOpenChange?.(next)
  }
  const latest = useRef({ menus, request })
  latest.current = { menus, request }
  useEffect(() => {
    if (opened !== null && !menus.some(menu => menu.value === opened && !menu.disabled)) request(null)
  }, [menus, opened])
  useEffect(() => {
    if (!mnemonics) { setUnderlined(false); return }
    return attachMenubarKeys(document, {
      onShowMnemonics: setUnderlined,
      onMnemonic: (key, code) => {
        const index = latest.current.menus.findIndex(menu => !menu.disabled && matchesMnemonic(parseMnemonic(menu.label).key, key, code))
        if (index < 0) return false
        const trigger = root.current?.querySelectorAll<HTMLElement>('[data-scope="menubar"][data-part="item"]')[index]
        trigger?.focus()
        if (current.current !== latest.current.menus[index].value) trigger?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))
        return true
      },
      onFocusBar: () => {
        const alreadyClosed = current.current === null
        focusFirst.current = !alreadyClosed
        latest.current.request(null); setUnderlined(true)
        if (alreadyClosed) root.current?.querySelector<HTMLElement>('[data-part="item"]')?.focus()
      },
    })
  }, [mnemonics])
  return <DirectionProvider direction={config.dir ?? 'ltr'}>
    <Primitive ref={root} {...part('root')} id={id} aria-label={label} modal={false} data-mnemonics={underlined ? '' : undefined}>
      {menus.map(menu => <Entry key={menu.value} menu={menu} shown={opened === menu.value} id={`${id}-${menu.value}`}
        onOpenChange={(next, reason) => {
          if (next && reason === 'trigger-focus' && current.current === null) return false
          if (next) request(menu.value)
          else if (reason !== 'sibling-open' && reason !== 'list-navigation' && current.current === menu.value) request(null)
          return true
        }} closeOnSelect={closeOnSelect} mnemonics={mnemonics} focusTarget={() => {
          if (current.current !== null) return false
          if (focusFirst.current) { focusFirst.current = false; return root.current?.querySelector<HTMLElement>('[data-part="item"]') ?? null }
          return true
        }}
        onSelect={(value, details) => onSelect?.(value, { ...details, menu: menu.value })} />)}
    </Primitive>
  </DirectionProvider>
}

function Entry({ menu, shown, id, onOpenChange, closeOnSelect, mnemonics, onSelect, focusTarget }: {
  menu: MenubarMenu; shown: boolean; id: string; onOpenChange: (open: boolean, reason: string) => boolean;
  closeOnSelect: boolean; mnemonics: boolean; onSelect: (value: string, details: Omit<MenubarSelectDetails, 'menu'>) => void;
  focusTarget: () => HTMLElement | boolean | null;
}) {
  const config = useConfig()
  const trigger = useRef<HTMLButtonElement>(null)
  const [environment, setEnvironment] = useState<Environment>({ style: {} })
  useLayoutEffect(() => {
    if (!shown || !trigger.current) return
    const computed = getComputedStyle(trigger.current)
    const style: Record<string, string> = {}
    for (const key of Array.from(computed)) if (key.startsWith('--')) style[key] = computed.getPropertyValue(key)
    setEnvironment({ style, mode: config.mode, dir: config.dir, locale: config.locale,
      container: trigger.current.closest<HTMLElement>('[data-backend="base-ui"]:is([data-scope="dialog"][data-part="layer"], [data-scope="popover"][data-part="positioner"])') ?? undefined })
  }, [shown, config])
  const lastRow = useRef(false)
  const text = parseMnemonic(menu.label)
  const dismiss = (reason: string) => {
    onOpenChange(false, reason)
  }
  const env = { ...environment, onTab: () => dismiss('tab') }
  return <MenuPrimitive.Root open={shown} disabled={menu.disabled} triggerId={`${id}-trigger`}
    onOpenChangeComplete={next => {
      if (!next || !lastRow.current) return
      lastRow.current = false
      const rows = document.getElementById(`${id}-content`)?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([aria-disabled="true"])')
      rows?.[rows.length - 1]?.focus()
    }} onOpenChange={(next, details) => {
      if (next) { if (!onOpenChange(true, details.reason)) details.cancel() }
      else dismiss(details.reason)
    }}>
    <MenuPrimitive.Trigger ref={trigger} {...part('item')} id={`${id}-trigger`} data-state={shown ? 'open' : 'closed'}
      onKeyDown={event => {
        if (event.key === 'ArrowUp' && !shown && !menu.disabled) {
          event.preventDefault(); event.preventBaseUIHandler(); lastRow.current = true; onOpenChange(true, 'trigger-press')
        }
      }} aria-expanded={shown ? 'true' : 'false'} aria-keyshortcuts={mnemonics && text.key ? `Alt+${text.key.toUpperCase()}` : undefined}>
      <span {...part('item-text')}>{text.index < 0 ? text.text : <>{text.text.slice(0, text.index)}<span {...part('mnemonic')}>{text.key}</span>{text.text.slice(text.index + 1)}</>}</span>
    </MenuPrimitive.Trigger>
    <Surface shown={shown} focusTarget={focusTarget} environment={env} level={0} id={`${id}-content`} triggerRef={trigger}>
      <Level items={menu.items} closeOnSelect={closeOnSelect} onSelect={onSelect} environment={env} level={0} />
    </Surface>
  </MenuPrimitive.Root>
}
