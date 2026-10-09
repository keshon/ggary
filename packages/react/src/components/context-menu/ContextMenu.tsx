import { useId, useLayoutEffect, useRef, useState, type ReactNode, type ReactElement } from 'react'
import { ContextMenu as Primitive } from '@base-ui/react/context-menu'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import type { MenuEntry, MenuSelectDetails } from '@ggary/core/menu'
import type { Dict } from '@ggary/core'
import { Surface, Level, type Environment } from '../menu/Menu'
import { useConfig } from '../config-provider'

export interface ContextMenuProps {
  /** Actions, checkbox and radio items, submenus, separators and groups: a Menu's. */
  items: MenuEntry[]
  onSelect?: (value: string, details: MenuSelectDetails) => void
  /**
   * The element the menu belongs to: spread the props onto it. Give it a
   * tabIndex if it is not focusable already — the keyboard opens the menu from
   * it, and the focus comes back to it. Merge with mergeProps if it has an
   * onKeyDown of its own.
   */
  trigger: (props: Dict) => ReactNode
  /** The menu's accessible name. Default "Actions". */
  label?: string
  closeOnSelect?: boolean
}

export function ContextMenu({ items, onSelect, trigger, label = 'Actions', closeOnSelect = true }: ContextMenuProps) {
  const id = `gg-base-context-menu-${useId().replace(/:/g, '')}`
  const config = useConfig()
  const target = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  const [environment, setEnvironment] = useState<Environment>({ style: {} })
  useLayoutEffect(() => {
    if (!shown || !target.current) return
    const computed = getComputedStyle(target.current)
    const style: Record<string, string> = {}
    for (const key of Array.from(computed)) if (key.startsWith('--')) style[key] = computed.getPropertyValue(key)
    setEnvironment({ style, mode: config.mode, dir: config.dir, locale: config.locale,
      container: target.current.closest<HTMLElement>('[data-backend="base-ui"]:is([data-scope="dialog"][data-part="layer"], [data-scope="popover"][data-part="positioner"])') ?? undefined })
  }, [shown, config])
  const env = { ...environment, onTab: () => setShown(false) }
  return <DirectionProvider direction={config.dir ?? 'ltr'}><Primitive.Root open={shown} onOpenChange={setShown}>
    <Primitive.Trigger ref={target} id={`${id}-trigger`} render={p => trigger({ ...p, 'data-context-menu': shown ? 'open' : 'closed', 'aria-keyshortcuts': 'Shift+F10', 'aria-haspopup': 'menu', 'aria-expanded': shown ? 'true' : 'false' }) as ReactElement}
      onContextMenu={event => { if (event.shiftKey) { event.preventBaseUIHandler(); event.stopPropagation() } }}
      onKeyDown={event => {
        if (event.key === 'ContextMenu' || event.key === 'F10' && event.shiftKey) {
          event.preventDefault()
          const rect = event.currentTarget.getBoundingClientRect()
          event.currentTarget.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: rect.left, clientY: rect.bottom }))
        }
      }} />
    <Surface shown={shown} environment={env} level={0} id={`${id}-content`} label={label} triggerRef={target}>
      <Level items={items} closeOnSelect={closeOnSelect} onSelect={onSelect} environment={env} level={0} />
    </Surface>
  </Primitive.Root></DirectionProvider>
}
