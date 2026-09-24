import type { Dict, Normalizer } from '../../types'
import type { VirtualElement } from '../../utils/position'
import type { ContextMenuRequest, ContextMenuTargetOptions } from './context-menu.types'

/**
 * The target's props: a right click and the keyboard's right click. The keys
 * are taken on keydown, and their default prevented there, so the
 * `contextmenu` event the browser would fire after them never opens the menu
 * a second time; that event is the pointer's alone.
 */
export function connect<T = Dict>(state: { open: boolean }, normalize: Normalizer<T>, options: ContextMenuTargetOptions) {
  return {
    targetProps: normalize({
      'data-context-menu': state.open ? 'open' : 'closed',
      'aria-keyshortcuts': 'Shift+F10',
      onContextMenu: (event: MouseEvent) => {
        // Shift and a right click: the browser's own menu, for inspecting or copying.
        if (event.shiftKey) return
        event.preventDefault()
        options.onRequest({ element: event.currentTarget as HTMLElement, point: { x: event.clientX, y: event.clientY } })
      },
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) return
        event.preventDefault()
        options.onRequest({ element: event.currentTarget as HTMLElement, point: null })
      },
    }),
  }
}

/** Where the menu stands: at the pointer, as a zero-sized box there, or under the element. */
export function contextMenuAnchor(request: ContextMenuRequest): HTMLElement | VirtualElement {
  if (!request.point) return request.element
  const { x, y } = request.point
  return { getBoundingClientRect: () => new DOMRect(x, y, 0, 0), contextElement: request.element }
}
