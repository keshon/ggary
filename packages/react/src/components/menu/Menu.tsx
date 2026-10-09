import { useCallback, useId, useLayoutEffect, useRef, useState, type ReactNode, type ReactElement, type CSSProperties, type RefObject, type ComponentProps } from 'react'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { Menu as Primitive } from '@base-ui/react/menu'
import { type Dict } from '@ggary/core'
import type { MenuChangeDetails, MenuEntry, MenuItem, MenuPlacement, MenuSelectDetails } from '@ggary/core/menu'
import { useConfig } from '../config-provider'

export interface MenuProps {
  /** Actions, checkbox and radio items, submenus, separators and labelled groups. */
  items: MenuEntry[]
  /** The anchor and opener: spread the props onto a button. */
  trigger: (props: Dict) => ReactNode
  /** Called with the item's value when the user activates it, at any depth. */
  onSelect?: (value: string, details: MenuSelectDetails) => void
  /** Controlled. Omit and use `defaultOpen` for uncontrolled. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: MenuChangeDetails) => void
  placement?: MenuPlacement
  /** Close after an item is activated. Default true; an item can override it. */
  closeOnSelect?: boolean
  /** The menu's accessible name. Default: the trigger's text. */
  label?: string
}

const part = (name: string) => ({ 'data-scope': 'menu', 'data-part': name, 'data-backend': 'base-ui' })
export type Environment = { container?: HTMLElement; style: CSSProperties; mode?: string; dir?: 'ltr' | 'rtl'; locale?: string; onTab?: () => void }
type LevelProps = { items: MenuEntry[]; closeOnSelect: boolean; onSelect?: MenuProps['onSelect']; environment: Environment; level: number }

export function Surface({ children, shown, environment, level, onEscapeKey, id, label, placement = 'bottom-start', triggerRef, returnFocus = true, focusTarget, anchor }: {
  children: ReactNode; shown: boolean; onEscapeKey?: () => void; environment: Environment; level: number;
  id?: string; label?: string; placement?: MenuPlacement; triggerRef: RefObject<HTMLElement | null>; returnFocus?: boolean; focusTarget?: () => HTMLElement | boolean | null; anchor?: ComponentProps<typeof Primitive.Positioner>['anchor'];
}) {
  const [side, align] = placement.split('-')
  return <Primitive.Portal keepMounted={level === 0} container={environment.container}>
    <Primitive.Positioner {...part('positioner')} anchor={anchor} positionMethod="fixed"
      side={side as 'top' | 'bottom' | 'left' | 'right'} align={(align ?? 'center') as 'start' | 'end' | 'center'}
      sideOffset={4} data-mode={environment.mode} dir={environment.dir} lang={environment.locale}
      style={{ ...environment.style, '--gg-available-width': 'var(--available-width, 100vw)', '--gg-available-height': 'var(--available-height, 320px)' } as CSSProperties}>
      <Primitive.Popup {...part('content')} id={id} aria-label={label}
        aria-labelledby={label ? undefined : id?.replace('-content', '-trigger')} data-state={shown ? 'open' : 'closed'} data-level={level || undefined}
        finalFocus={level === 0 ? focusTarget ?? (returnFocus ? triggerRef : false) : focusTarget ?? false} onKeyDown={(event) => {
          // Consume nested Escape at its popup before document-level listeners
          // can close an ancestor after this surface has unmounted.
          if (event.key === 'Escape' && level > 0) {
            event.preventDefault(); event.stopPropagation(); onEscapeKey?.(); return
          }
          if (event.key === 'Tab') { event.preventDefault(); environment.onTab?.() }
        }}>
        {children}
      </Primitive.Popup>
    </Primitive.Positioner>
  </Primitive.Portal>
}
function Text({ item, dir }: { item: MenuItem; dir?: 'ltr' | 'rtl' }) {
  return <>
    <span {...part('item-text')}>{item.label}</span>
    {'shortcut' in item && item.shortcut && <span {...part('item-shortcut')}>{item.shortcut}</span>}
    {(item.type === 'checkbox' || item.type === 'radio') && <span {...part('item-indicator')}
      data-state={item.checked ? 'checked' : 'unchecked'} data-icon="check" aria-hidden="true" />}
    {item.type === 'submenu' && <span {...part('submenu-indicator')} data-icon={dir === 'rtl' ? 'chevron-left' : 'chevron-right'} aria-hidden="true" />}
  </>
}
function Submenu({ item, ...levelProps }: LevelProps & { item: Extract<MenuItem, { type: 'submenu' }> }) {
  const [shown, setShown] = useState(false)
  const triggerRef = useRef<HTMLElement>(null)
  const id = `gg-base-submenu-${useId().replace(/:/g, '')}`
  return <Primitive.SubmenuRoot open={shown} onOpenChange={(next, details) => {
    setShown(next)
    // Restore before the focused submenu unmounts, so parent focus recovery
    // cannot replace the destination. Hover/menu switching keeps its own focus.
    if (!next && details.reason === 'escape-key') triggerRef.current?.focus({ preventScroll: true })
  }} closeParentOnEsc={false}>
    <Primitive.SubmenuTrigger {...part('item')} ref={triggerRef} id={`${id}-trigger`} disabled={item.disabled}
      label={item.label} data-type="submenu" data-state={shown ? 'open' : 'closed'}>
      <Text item={item} dir={levelProps.environment.dir} />
    </Primitive.SubmenuTrigger>
    {shown && <Surface shown returnFocus={false} onEscapeKey={() => {
      setShown(false); triggerRef.current?.focus({ preventScroll: true })
    }} environment={levelProps.environment} level={levelProps.level + 1}
      id={`${id}-content`} placement={levelProps.environment.dir === 'rtl' ? 'left-start' : 'right-start'} triggerRef={triggerRef}>
      <Level {...levelProps} items={item.items} level={levelProps.level + 1} />
    </Surface>}
  </Primitive.SubmenuRoot>
}
export function Level(levelProps: LevelProps) {
  const { items, closeOnSelect, onSelect } = levelProps
  const selectedRadio = items.find((entry) => entry.type === 'radio' && entry.checked)
  return <Primitive.RadioGroup value={selectedRadio && 'value' in selectedRadio ? selectedRadio.value : null}>
    {items.map((entry, index) => {
      if (entry.type === 'separator') return <Primitive.Separator {...part('separator')} key={`separator-${index}`} />
      if (entry.type === 'group') return <Primitive.Group {...part('group')} key={`group-${index}`}>
        {entry.label && <Primitive.GroupLabel {...part('group-label')}>{entry.label}</Primitive.GroupLabel>}
        <Level {...levelProps} items={entry.items} />
      </Primitive.Group>
      if (entry.type === 'submenu') return <Submenu {...levelProps} item={entry} key={entry.value} />
      const common = { ...part('item'), disabled: entry.disabled, label: entry.label,
        closeOnClick: entry.closeOnSelect ?? closeOnSelect, 'data-type': entry.type ?? 'item' }
      const text = <Text item={entry} />
      if (entry.type === 'checkbox') return <Primitive.CheckboxItem {...common} key={entry.value} checked={entry.checked ?? false}
        data-state={entry.checked ? 'checked' : 'unchecked'} onCheckedChange={(checked) => onSelect?.(entry.value, { item: entry, checked })}>{text}</Primitive.CheckboxItem>
      if (entry.type === 'radio') return <Primitive.RadioItem {...common} key={entry.value} value={entry.value}
        data-state={entry.checked ? 'checked' : 'unchecked'} onClick={() => { if (!entry.disabled) onSelect?.(entry.value, { item: entry, checked: true }) }}>{text}</Primitive.RadioItem>
      return <Primitive.Item {...common} key={entry.value} nativeButton={false}
        render={entry.href ? <a {...part('item')} href={entry.href} /> : undefined} data-destructive={entry.destructive ? '' : undefined}
        onClick={() => { if (!entry.disabled) onSelect?.(entry.value, { item: entry }) }}>{text}</Primitive.Item>
    })}
  </Primitive.RadioGroup>
}
export function Menu({ items, trigger, onSelect, open, defaultOpen = false, onOpenChange,
  placement = 'bottom-start', closeOnSelect = true, label }: MenuProps) {
  const id = `gg-base-menu-${useId().replace(/:/g, '')}`
  const config = useConfig()
  const anchor = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [localOpen, setLocalOpen] = useState(defaultOpen)
  const shown = open ?? localOpen
  const [environment, setEnvironment] = useState<Environment>({ style: {} })
  const request = useCallback((next: boolean, reason: MenuChangeDetails['reason']) => {
    if (open === undefined) setLocalOpen(next)
    onOpenChange?.(next, { reason })
  }, [open, onOpenChange])
  useLayoutEffect(() => {
    if (!shown || !anchor.current) return
    const computed = getComputedStyle(anchor.current)
    const style: Record<string, string> = { direction: config.dir ?? computed.direction }
    for (let i = 0; i < computed.length; i++) {
      const key = computed[i]
      if (key.startsWith('--')) style[key] = computed.getPropertyValue(key)
    }
    setEnvironment({ style, mode: config.mode, dir: config.dir, locale: config.locale,
      container: anchor.current.closest<HTMLElement>('[data-backend="base-ui"]:is([data-scope="dialog"][data-part="layer"], [data-scope="popover"][data-part="positioner"])') ?? undefined })
  }, [shown, config])
  return <DirectionProvider direction={config.dir ?? 'ltr'}><Primitive.Root open={shown} triggerId={`${id}-trigger`} modal={false}
    onOpenChange={(next, details) => {
      request(next,
      details.reason === 'trigger-press' || details.reason === 'list-navigation' ? 'trigger'
        : details.reason === 'escape-key' ? 'escape' : details.reason === 'item-press' ? 'select'
        : details.event instanceof KeyboardEvent && details.event.key === 'Tab' ? 'tab'
        : details.reason === 'outside-press' || details.reason === 'focus-out' ? 'outside' : 'api')
    }}>
    <div {...part('anchor')} ref={anchor} style={{ display: 'contents' }}>
      <Primitive.Trigger ref={triggerRef} id={`${id}-trigger`} render={(p) => trigger({ ...p, 'aria-expanded': shown ? 'true' : 'false' }) as ReactElement} />
    </div>
    <Surface shown={shown} environment={{ ...environment, onTab: () => request(false, 'tab') }} level={0}
      id={`${id}-content`} label={label} placement={placement} triggerRef={triggerRef}>
      <Level items={items} closeOnSelect={closeOnSelect} onSelect={onSelect} environment={{ ...environment, onTab: () => request(false, 'tab') }} level={0} />
    </Surface>
  </Primitive.Root></DirectionProvider>
}
