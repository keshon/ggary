import { useRef, type ComponentProps } from 'react'
import { Menu as Primitive } from '@base-ui/react/menu'
import { ContextMenu } from '@base-ui/react/context-menu'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import type { MenuEntry, MenuSelectDetails } from '@ggary/core/menu'
import { useOverlayEnvironment } from '../../utils/use-overlay-environment'
import { Surface, Level } from './Menu'

/** Internal menu for a domain component whose controller supplies its anchor. */
export function AnchoredMenu({ id, open, items, reference, anchor, label, onClose, onSelect }: {
  id: string; open: boolean; items: MenuEntry[]; reference: () => HTMLElement | null;
  anchor: ComponentProps<typeof Primitive.Positioner>['anchor']; label: string;
  onClose: () => void; onSelect: (value: string, details: MenuSelectDetails) => void;
}) {
  const target = useRef<HTMLElement | null>(null)
  target.current = reference()
  const environment = { ...useOverlayEnvironment(target, open), onTab: onClose }
  return <DirectionProvider direction={environment.dir ?? 'ltr'}>
    <ContextMenu.Root open={open} onOpenChange={next => { if (!next) onClose() }}
      onOpenChangeComplete={next => {
        if (next) document.getElementById(`${id}-content`)?.querySelector<HTMLElement>('[role^="menuitem"]:not([aria-disabled="true"])')?.focus()
      }}>
      <Surface id={`${id}-content`} shown={open} environment={environment}
        level={0} label={label} triggerRef={target} focusTarget={reference} anchor={anchor}>
        <Level items={items} closeOnSelect onSelect={onSelect} environment={environment} level={0} />
      </Surface>
    </ContextMenu.Root>
  </DirectionProvider>
}
